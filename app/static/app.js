let lang=localStorage.getItem("hm_lang")||((navigator.language||"uk").slice(0,2));if(!["uk","ru","en"].includes(lang))lang="uk";
let locale={},plants=[],recipes=[],ingredients=[],problems=[],selected=new Set();let dark=localStorage.getItem("hm_theme")==="dark";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
async function boot(){applyTheme();$("#lang").value=$("#lang2").value=lang;await loadLocale();await Promise.all([loadCatalogs(),loadStats(),loadHealth()]);bind();loadFridge();}
async function loadLocale(){locale=await fetch(`/api/locale/${lang}`).then(r=>r.json());$$("[data-i18n]").forEach(x=>x.textContent=locale[x.dataset.i18n]||x.dataset.i18n);$$("[data-placeholder]").forEach(x=>x.placeholder=locale[x.dataset.placeholder]||"")}
async function loadCatalogs(){[plants,recipes,ingredients,problems]=await Promise.all([fetch(`/api/plants?lang=${lang}`).then(r=>r.json()),fetch(`/api/recipes?lang=${lang}`).then(r=>r.json()),fetch(`/api/ingredients?lang=${lang}`).then(r=>r.json()),fetch(`/api/problems?lang=${lang}`).then(r=>r.json())]);render();}
async function loadStats(){let s=await fetch("/api/stats").then(r=>r.json());$("#stats").innerHTML=`<div class="chips"><span class="chip">🌿 ${s.plants}</span><span class="chip">🩺 ${s.problems}</span><span class="chip">🥕 ${s.ingredients}</span><span class="chip">🍳 ${s.recipes}</span></div>`}
async function loadHealth(){let h=await fetch("/api/health").then(r=>r.json());$("#visionBadge").textContent=h.vision_enabled?(locale.ai_ready||"AI Vision"):(locale.local_mode||"Local");}
function render(){renderPlants(plants);renderRecipes(recipes);$("#problemCards").innerHTML=problems.map(p=>`<div class="card"><div class="emoji">🩺</div><h3>${p.name}</h3><p>${p.symptoms}</p></div>`).join("");$("#ingredientChips").innerHTML=ingredients.map(i=>`<button class="chip" data-ing="${i.id}">${i.name}</button>`).join("");$("#fridgeIngredient").innerHTML=ingredients.map(i=>`<option value="${i.id}">${i.name}</option>`).join("");}
const ENUM_I18N={
uk:{
  aroid:"Ароїдні",fern:"Папоротеві",flowering:"Квітучі",succulent:"Сукуленти",conifer:"Хвойні",palm:"Пальмові",foliage:"Декоративно-листяні",tropical:"Тропічні",begonia:"Бегонієві",bromeliad:"Бромелієві",
  bright_indirect:"Яскраве розсіяне світло",medium_indirect:"Помірне розсіяне світло",low_to_medium:"Слабке — помірне освітлення",bright:"Яскраве світло",low:"Слабке освітлення",
  moderate:"Помірний полив",moist:"Вологий ґрунт",dry:"Просушувати ґрунт",high:"Висока",medium:"Середня",
  main:"Основна страва",soup:"Суп",salad:"Салат",breakfast:"Сніданок",dessert:"Десерт",snack:"Закуска",side:"Гарнір",drink:"Напій",
  easy:"Легко",medium_difficulty:"Середньо",hard:"Складно",
  meat:"М’ясо",vegetable:"Овочі",dairy:"Молочні продукти",grain:"Крупи та борошно",fruit:"Фрукти",spice:"Спеції",other:"Інше",
  yes:"Так",no:"Ні",min:"хв"
},
ru:{
  aroid:"Ароидные",fern:"Папоротниковые",flowering:"Цветущие",succulent:"Суккуленты",conifer:"Хвойные",palm:"Пальмовые",foliage:"Декоративно-лиственные",tropical:"Тропические",begonia:"Бегониевые",bromeliad:"Бромелиевые",
  bright_indirect:"Яркий рассеянный свет",medium_indirect:"Умеренный рассеянный свет",low_to_medium:"Слабое — умеренное освещение",bright:"Яркий свет",low:"Слабое освещение",
  moderate:"Умеренный полив",moist:"Влажная почва",dry:"Просушивать почву",high:"Высокая",medium:"Средняя",
  main:"Основное блюдо",soup:"Суп",salad:"Салат",breakfast:"Завтрак",dessert:"Десерт",snack:"Закуска",side:"Гарнир",drink:"Напиток",
  easy:"Легко",medium_difficulty:"Средне",hard:"Сложно",yes:"Да",no:"Нет",min:"мин"
},
en:{
  aroid:"Aroid",fern:"Fern",flowering:"Flowering",succulent:"Succulent",conifer:"Conifer",palm:"Palm",foliage:"Foliage",tropical:"Tropical",begonia:"Begonia",bromeliad:"Bromeliad",
  bright_indirect:"Bright indirect light",medium_indirect:"Medium indirect light",low_to_medium:"Low to medium light",bright:"Bright light",low:"Low light",
  moderate:"Moderate watering",moist:"Moist soil",dry:"Let soil dry",high:"High",medium:"Medium",
  main:"Main course",soup:"Soup",salad:"Salad",breakfast:"Breakfast",dessert:"Dessert",snack:"Snack",side:"Side dish",drink:"Drink",
  easy:"Easy",medium_difficulty:"Medium",hard:"Hard",yes:"Yes",no:"No",min:"min"
}};
function trEnum(x){if(x===null||x===undefined)return "";let k=String(x);return ENUM_I18N[lang]?.[k]||k.replaceAll("_"," ")}
function human(x){return trEnum(x)}
function renderPlants(arr){$("#plantCards").innerHTML=arr.map(p=>`<div class="card"><div class="emoji">🌿</div><h3>${p.name}</h3><span class="badge">${human(p.family)}</span><p>☀ ${human(p.light)}<br>💧 ${human(p.water)}<br>🌡 ${p.temp[0]}–${p.temp[1]}°C · 💨 ${human(p.humidity)}</p></div>`).join("")}
function renderRecipes(arr){$("#recipeCards").innerHTML=arr.map(r=>`<div class="card"><div class="emoji">🍽️</div><h3>${r.name}</h3><span class="badge">⏱ ${r.minutes} ${trEnum("min")}</span> <span class="badge">${human(r.category)}</span><p>${r.ingredients.map(id=>ingredients.find(i=>i.id===id)?.name||id).join(" · ")}</p></div>`).join("")}
function showPage(id){$$(".page").forEach(p=>p.classList.toggle("active",p.id===id));$$(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===id));scrollTo({top:0,behavior:"smooth"})}
function applyTheme(){document.body.classList.toggle("dark",dark)}
async function changeLang(v){lang=v;localStorage.setItem("hm_lang",lang);$("#lang").value=$("#lang2").value=lang;await loadLocale();await loadCatalogs();await loadStats();await loadHealth();await loadFridge()}
function bind(){
 $$("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));$$("[data-go]").forEach(b=>b.onclick=()=>showPage(b.dataset.go));
 $("#lang").onchange=e=>changeLang(e.target.value);$("#lang2").onchange=e=>changeLang(e.target.value);
 const toggle=()=>{dark=!dark;localStorage.setItem("hm_theme",dark?"dark":"light");applyTheme()};$("#theme").onclick=toggle;$("#theme2").onclick=toggle;
 $("#accent").oninput=e=>{document.documentElement.style.setProperty("--accent",e.target.value);localStorage.setItem("hm_accent",e.target.value)};
 const acc=localStorage.getItem("hm_accent");if(acc){$("#accent").value=acc;document.documentElement.style.setProperty("--accent",acc)}
 $("#plantSearch").oninput=async e=>{let a=await fetch(`/api/plants?lang=${lang}&q=${encodeURIComponent(e.target.value)}`).then(r=>r.json());renderPlants(a)};
 $("#recipeSearch").oninput=async e=>{let a=await fetch(`/api/recipes?lang=${lang}&q=${encodeURIComponent(e.target.value)}`).then(r=>r.json());renderRecipes(a)};
 $("#ingredientChips").onclick=e=>{let b=e.target.closest("[data-ing]");if(!b)return;selected.has(b.dataset.ing)?selected.delete(b.dataset.ing):selected.add(b.dataset.ing);b.classList.toggle("on")};
 $("#cookBtn").onclick=async()=>{let max_missing=+$('input[name="missing"]:checked').value;let r=await fetch("/api/ai-cook",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,ingredients:[...selected],max_missing})}).then(r=>r.json());$("#cookResult").innerHTML=(r.recipes||[]).map(x=>`<div class="card"><b>${x.name}</b> · ${x.match}% · ${x.minutes} ${trEnum("min")}${x.missing.length?`<p>+ ${x.missing.map(id=>ingredients.find(i=>i.id===id)?.name||id).join(", ")}</p>`:""}</div>`).join("")};
 $("#plantImage").onchange=e=>{let f=e.target.files[0];if(!f){$("#preview").innerHTML="";return}let u=URL.createObjectURL(f);$("#preview").innerHTML=`<img src="${u}">`};
 $("#diagnoseForm").onsubmit=async e=>{e.preventDefault();let fd=new FormData();fd.append("query",$("#plantQuery").value);fd.append("lang",lang);if($("#plantImage").files[0])fd.append("image",$("#plantImage").files[0]);$("#diagnosisResult").innerHTML="✨ AI…";let r=await fetch("/api/diagnose",{method:"POST",body:fd}).then(r=>r.json());$("#diagnosisResult").innerHTML=`<div><span class="badge">${r.confidence}</span><h2>${r.title}</h2><div class="diagnosis-text">${escapeHtml(r.text||"")}</div><small>${r.source||""}${r.model?" · "+r.model:""}</small></div>`};
 $("#addFridge").onclick=async()=>{await fetch("/api/fridge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ingredient_id:$("#fridgeIngredient").value,amount:+$("#fridgeAmount").value,unit:$("#fridgeUnit").value,expires:$("#fridgeExpires").value})});loadFridge()};
 $("#fridgeList").onclick=async e=>{let b=e.target.closest("[data-del]");if(!b)return;await fetch(`/api/fridge/${b.dataset.del}`,{method:"DELETE"});loadFridge()}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])).replace(/\n/g,"<br>")}
async function loadFridge(){let a=await fetch(`/api/fridge?lang=${lang}`).then(r=>r.json());$("#fridgeList").innerHTML=a.length?a.map(x=>`<div class="card fridge-card"><button class="delete-btn" data-del="${x.id}">×</button><div class="emoji">🧊</div><h3>${x.name}</h3><b>${x.amount} ${x.unit}</b><p>${x.expires||"—"}</p></div>`).join(""):`<div class="card">🧊 ${locale.available||""}</div>`}
boot();