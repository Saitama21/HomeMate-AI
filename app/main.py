from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import sqlite3, json, os, re

BASE=Path(__file__).parent
DB=BASE/"data"/"homemate.db"
app=FastAPI(title="HomeMate AI", version="0.1.0")
app.mount("/static", StaticFiles(directory=BASE/"static"), name="static")

def rows(sql,args=()):
    con=sqlite3.connect(DB); con.row_factory=sqlite3.Row
    out=[dict(x) for x in con.execute(sql,args).fetchall()]
    con.close(); return out

@app.get("/")
def index(): return FileResponse(BASE/"static"/"index.html")

@app.get("/api/health")
def health(): return {"ok":True,"app":"HomeMate AI","version":"0.1.0","languages":["uk","ru","en"]}

@app.get("/api/locale/{lang}")
def locale(lang:str):
    if lang not in ("uk","ru","en"): lang="uk"
    return json.loads((BASE/"locales"/f"{lang}.json").read_text(encoding="utf-8"))

@app.get("/api/catalog")
def catalog(lang:str="uk"):
    if lang not in ("uk","ru","en"): lang="uk"
    return {
      "plants":[{"id":r["id"],"name":r[lang],"light":r[f"light_{lang}"],"water":r[f"water_{lang}"]} for r in rows("select * from plants")],
      "problems":[{"id":r["id"],"name":r[lang],"symptoms":r[f"symptoms_{lang}"]} for r in rows("select * from plant_problems")],
      "ingredients":[{"id":r["id"],"name":r[lang],"category":r["category"]} for r in rows("select * from ingredients")],
      "recipes":[{"id":r["id"],"name":r[lang],"ingredients":r["ingredients"].split(","),"minutes":r["minutes"]} for r in rows("select * from recipes")]
    }

@app.get("/api/recipes")
def recipe_search(q:str="",lang:str="uk"):
    if lang not in ("uk","ru","en"): lang="uk"
    allr=rows("select * from recipes")
    q=q.lower().strip()
    return [{"id":r["id"],"name":r[lang],"ingredients":r["ingredients"].split(","),"minutes":r["minutes"]}
            for r in allr if not q or q in r[lang].lower() or q in r["ingredients"].lower()]

@app.post("/api/ai-cook")
def ai_cook(payload:dict):
    lang=payload.get("lang","uk"); ids=set(payload.get("ingredients",[]))
    candidates=[]
    for r in rows("select * from recipes"):
        need=set(r["ingredients"].split(","))
        score=len(need & ids)/max(1,len(need))
        if score>0: candidates.append((score,r))
    candidates.sort(key=lambda x:x[0], reverse=True)
    if not candidates:
        msg={"uk":"Додайте продукти до холодильника.","ru":"Добавьте продукты в холодильник.","en":"Add products to your fridge."}[lang]
        return {"message":msg,"recipes":[]}
    return {"recipes":[{"id":r["id"],"name":r[lang],"match":round(score*100),"minutes":r["minutes"],
                        "ingredients":r["ingredients"].split(",")} for score,r in candidates[:6]]}

@app.post("/api/diagnose")
async def diagnose(query:str=Form(""), lang:str=Form("uk"), image:UploadFile|None=File(None)):
    q=query.lower()
    aliases={
      "mealybug":["ват","пупир","білий наліт","белый нал","cotton","sticky","липк"],
      "powdery_mildew":["порош","мука","борош","powder"],
      "spider_mite":["паутин","павутин","web","клещ","кліщ"],
      "thrips":["трипс","silver","сріб","серебр"],
      "overwatering":["перелив","залил","мокр","wet soil","overwater"],
      "underwatering":["недолив","сух","dry","увяд","в'ян"]
    }
    chosen=None
    for pid, words in aliases.items():
        if any(w in q for w in words):
            rr=rows("select * from plant_problems where id=?",(pid,))
            if rr: chosen=rr[0]; break
    if not chosen:
        chosen=rows("select * from plant_problems where id='mealybug'")[0] if image else None
    if not chosen:
        return {"confidence":"low","title":{"uk":"Потрібно більше даних","ru":"Нужно больше данных","en":"More information needed"}[lang],
                "text":{"uk":"Опишіть колір, форму нальоту, липкість, павутиння та стан ґрунту або додайте фото.",
                        "ru":"Опишите цвет, форму налёта, липкость, паутину и состояние грунта или добавьте фото.",
                        "en":"Describe color, coating, stickiness, webbing and soil condition, or add a photo."}[lang]}
    title=chosen[lang]; symptoms=chosen[f"symptoms_{lang}"]
    text={"uk":f"Найбільш схоже на: {title}. Ознаки: {symptoms}. Перевірте рослину ізольовано та огляньте нижній бік листя.",
          "ru":f"Больше всего похоже на: {title}. Признаки: {symptoms}. Изолируйте растение и осмотрите нижнюю сторону листьев.",
          "en":f"Most consistent with: {title}. Signs: {symptoms}. Isolate the plant and inspect leaf undersides."}[lang]
    con=sqlite3.connect(DB); con.execute("insert into diagnosis_history(query,result) values(?,?)",(query,text)); con.commit(); con.close()
    return {"confidence":"medium","title":title,"text":text,"image_received":bool(image)}

@app.get("/api/fridge")
def fridge(lang:str="uk"):
    return rows(f"""select f.id,f.ingredient_id,f.amount,f.unit,f.expires,i.{lang} name from fridge f join ingredients i on i.id=f.ingredient_id order by f.id desc""")

@app.post("/api/fridge")
def add_fridge(payload:dict):
    con=sqlite3.connect(DB); con.execute("insert into fridge(ingredient_id,amount,unit,expires) values(?,?,?,?)",
        (payload["ingredient_id"],payload.get("amount",1),payload.get("unit","pcs"),payload.get("expires","")))
    con.commit(); con.close(); return {"ok":True}
