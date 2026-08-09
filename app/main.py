from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import sqlite3, json, os, base64, mimetypes, httpx, re

BASE=Path(__file__).parent
DB=BASE/"data"/"homemate.db"
app=FastAPI(title="HomeMate AI",version="0.2.2")
app.mount("/static",StaticFiles(directory=BASE/"static"),name="static")

def L(lang): return lang if lang in ("uk","ru","en") else "uk"
def rows(sql,args=()):
    con=sqlite3.connect(DB); con.row_factory=sqlite3.Row
    out=[dict(x) for x in con.execute(sql,args).fetchall()]
    con.close(); return out

@app.get("/")
def index(): return FileResponse(BASE/"static"/"index.html")

@app.get("/api/health")
def health():
    return {"ok":True,"app":"HomeMate AI","version":"0.2.2","languages":["uk","ru","en"],
            "vision_enabled":bool(os.getenv("OPENAI_API_KEY"))}

@app.get("/api/locale/{lang}")
def locale(lang:str):
    lang=L(lang); return json.loads((BASE/"locales"/f"{lang}.json").read_text(encoding="utf-8"))

@app.get("/api/stats")
def stats():
    return {k:rows(f"select count(*) n from {t}")[0]["n"] for k,t in
            {"plants":"plants","problems":"plant_problems","ingredients":"ingredients","recipes":"recipes"}.items()}

@app.get("/api/plants")
def plants(q:str="",lang:str="uk",limit:int=300):
    lang=L(lang);q=q.strip().lower()
    data=rows("select * from plants order by "+lang)
    out=[]
    for r in data:
        hay=" ".join([r["uk"],r["ru"],r["en"],r["family"]]).lower()
        if q and q not in hay: continue
        out.append({"id":r["id"],"name":r[lang],"family":r["family"],"light":r["light"],"water":r["water"],
                    "temp":[r["temp_min"],r["temp_max"]],"humidity":r["humidity"],"toxic":r["toxic"]})
    return out[:max(1,min(limit,500))]

@app.get("/api/recipes")
def recipe_search(q:str="",lang:str="uk",category:str=""):
    lang=L(lang);q=q.strip().lower()
    out=[]
    for r in rows("select * from recipes order by "+lang):
        hay=" ".join([r["uk"],r["ru"],r["en"],r["ingredients"],r["category"]]).lower()
        if q and q not in hay: continue
        if category and r["category"]!=category: continue
        out.append({"id":r["id"],"name":r[lang],"ingredients":r["ingredients"].split(","),
                    "minutes":r["minutes"],"category":r["category"],"servings":r["servings"],
                    "difficulty":r["difficulty"]})
    return out

@app.get("/api/ingredients")
def ingredient_list(lang:str="uk"):
    lang=L(lang)
    return [{"id":r["id"],"name":r[lang],"category":r["category"]} for r in rows("select * from ingredients order by "+lang)]

@app.get("/api/problems")
def problem_list(lang:str="uk"):
    lang=L(lang)
    return [{"id":r["id"],"name":r[lang],"symptoms":r[f"symptoms_{lang}"]} for r in rows("select * from plant_problems order by "+lang)]

@app.post("/api/ai-cook")
def ai_cook(payload:dict):
    lang=L(payload.get("lang","uk"))
    available=set(payload.get("ingredients",[]))
    max_missing=int(payload.get("max_missing",0))
    candidates=[]
    for r in rows("select * from recipes"):
        need=set(r["ingredients"].split(","))
        missing=need-available
        if len(missing)>max_missing: continue
        score=(len(need & available)/max(1,len(need))) * 100
        candidates.append((score,len(missing),r,sorted(missing)))
    candidates.sort(key=lambda x:(-x[0],x[1],x[2]["minutes"]))
    return {"recipes":[{"id":r["id"],"name":r[lang],"match":round(score),
                        "minutes":r["minutes"],"ingredients":r["ingredients"].split(","),
                        "missing":missing} for score,_,r,missing in candidates[:12]]}

def local_diagnosis(query,lang):
    q=(query or "").lower()
    aliases={
      "mealybug":["ват","пух","білий наліт","белый нал","cotton","липк","sticky"],
      "powdery_mildew":["порош","борош","мука","powder"],
      "spider_mite":["паутин","павутин","web","клещ","кліщ"],
      "thrips":["трипс","silver","сріб","серебр"],
      "scale":["щитів","щитов","scale"],
      "whitefly":["білокрил","белокрыл","whitefly"],
      "aphids":["попел","тля","aphid"],
      "overwatering":["перелив","залил","мокр","wet soil","overwater"],
      "underwatering":["недолив","сух","dry","увяд","в'ян"],
      "low_humidity":["сухі краї","сухие края","dry tips","коричневі кінчики","коричневые кончики"],
      "root_rot":["гнил","root rot","запах корней","запах коріння"]
    }
    for pid,words in aliases.items():
        if any(w in q for w in words):
            r=rows("select * from plant_problems where id=?",(pid,))[0]
            return {"confidence":"medium","title":r[lang],"text":r[f"symptoms_{lang}"],"source":"local"}
    return {"confidence":"low",
            "title":{"uk":"Потрібно більше даних","ru":"Нужно больше данных","en":"More information needed"}[lang],
            "text":{"uk":"Додайте фото або опишіть наліт, липкість, павутиння, плями та стан ґрунту.",
                    "ru":"Добавьте фото или опишите налёт, липкость, паутину, пятна и состояние грунта.",
                    "en":"Add a photo or describe coating, stickiness, webbing, spots and soil condition."}[lang],
            "source":"local"}

def extract_response_text(data):
    if isinstance(data,dict) and data.get("output_text"): return data["output_text"]
    parts=[]
    for item in data.get("output",[]) if isinstance(data,dict) else []:
        for c in item.get("content",[]) if isinstance(item,dict) else []:
            if c.get("type")=="output_text" and c.get("text"): parts.append(c["text"])
    return "\n".join(parts).strip()

async def openai_vision(query, lang, raw, mime):
    key=os.getenv("OPENAI_API_KEY")
    if not key: return None
    model=os.getenv("OPENAI_MODEL","gpt-5-mini")
    language={"uk":"Ukrainian","ru":"Russian","en":"English"}[lang]
    b64=base64.b64encode(raw).decode()
    prompt=f"""You are HomeMate AI plant-care assistant. Analyze this houseplant photo plus user note.
Reply in {language}. Be cautious: distinguish pest, disease, watering/light/humidity stress.
Give: likely issue, confidence (low/medium/high), visible evidence, 3-6 safe next steps, and what photo/details to collect if uncertain.
Do not claim certainty from a single photo. User note: {query or 'none'}"""
    payload={"model":model,"input":[{"role":"user","content":[
        {"type":"input_text","text":prompt},
        {"type":"input_image","image_url":f"data:{mime};base64,{b64}","detail":"high"}
    ]}]}
    async with httpx.AsyncClient(timeout=60) as client:
        r=await client.post("https://api.openai.com/v1/responses",
            headers={"Authorization":f"Bearer {key}","Content-Type":"application/json"},json=payload)
        r.raise_for_status()
        text=extract_response_text(r.json())
        return {"confidence":"ai","title":{"uk":"AI-аналіз фото","ru":"AI-анализ фото","en":"AI photo analysis"}[lang],
                "text":text,"source":"openai","model":model}

@app.post("/api/diagnose")
async def diagnose(query:str=Form(""), lang:str=Form("uk"), image:UploadFile|None=File(None)):
    lang=L(lang)
    result=None
    if image:
        raw=await image.read()
        mime=image.content_type or mimetypes.guess_type(image.filename or "")[0] or "image/jpeg"
        if len(raw)<=12*1024*1024:
            try: result=await openai_vision(query,lang,raw,mime)
            except Exception as e:
                result=None
    if not result: result=local_diagnosis(query,lang)
    con=sqlite3.connect(DB);con.execute("insert into diagnosis_history(query,result) values(?,?)",
        (query,json.dumps(result,ensure_ascii=False)));con.commit();con.close()
    return result

@app.get("/api/fridge")
def fridge(lang:str="uk"):
    lang=L(lang)
    return rows(f"""select f.id,f.ingredient_id,f.amount,f.unit,f.expires,i.{lang} name
                    from fridge f join ingredients i on i.id=f.ingredient_id order by f.id desc""")

@app.post("/api/fridge")
def add_fridge(payload:dict):
    con=sqlite3.connect(DB);con.execute("insert into fridge(ingredient_id,amount,unit,expires) values(?,?,?,?)",
      (payload["ingredient_id"],payload.get("amount",1),payload.get("unit","pcs"),payload.get("expires","")))
    con.commit();con.close();return {"ok":True}

@app.delete("/api/fridge/{item_id}")
def delete_fridge(item_id:int):
    con=sqlite3.connect(DB);con.execute("delete from fridge where id=?",(item_id,));con.commit();con.close();return {"ok":True}
