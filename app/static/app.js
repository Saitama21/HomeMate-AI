let lang=localStorage.getItem("hm_lang")||((navigator.language||"uk").slice(0,2)); if(!["uk","ru","en"].includes(lang))lang="uk";
let locale={},catalog={}; let dark=localStorage.getItem("hm_theme")==="dark"; let selected=new Set();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
async function boot(){applyTheme(); $("#lang").value=$("#lang2").value=lang; await loadLocale(); await loadCatalog(); bind(); loadFridge();}
async function loadLocale(){locale=await fetch(`/api/locale/${lang}`).then(r=>r.json()); $$("[data-i18n]").forEach(x=>x.textContent=locale[x.dataset.i18n]||x.dataset.i18n); $$("[data-placeholder]").forEach(x=>x.placeholder=locale[x.dataset.placeholder]||"");}
async function loadCatalog(){catalog=await fetch(`/api/catalog?lang=${lang}`).then(r=>r.json()); render();}
function render(){ $("#stats").innerHTML=`<div class="chips"><span class="chip">🌿 ${catalog.plants.length} ${locale.plants}</span><span class="chip">🩺 ${catalog.problems.length}</span><span class="chip">🥕 ${catalog.ingredients.length}</span><span class="chip">🍳 ${catalog.recipes.length}</span></div>`;
$("#plantCards").innerHTML=catalog.plants.map(p=>`<div class="card"><div class="emoji">🌿</div><h3>${p.name}</h3><small>☀ ${p.light}</small><p>💧 ${p.water}</p></div>`).join("");
renderRecipes(catalog.recipes);
$("#ingredientChips").innerHTML=catalog.ingredients.map(i=>`<button class="chip" data-ing="${i.id}">${i.name}</button>`).join("");
$("#fridgeIngredient").innerHTML=catalog.ingredients.map(i=>`<option value="${i.id}">${i.name}</option>`).join("");}
function renderRecipes(arr){$("#recipeCards").innerHTML=arr.map(r=>`<div class="card"><div class="emoji">🍽️</div><h3>${r.name}</h3><span class="badge">⏱ ${r.minutes} min</span><p>${r.ingredients.join(" · ")}</p></div>`).join("");}
function showPage(id){$$(".page").forEach(p=>p.classList.toggle("active",p.id===id)); $$(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===id)); window.scrollTo({top:0,behavior:"smooth"});}
function applyTheme(){document.body.classList.toggle("dark",dark);}
async function changeLang(v){lang=v;localStorage.setItem("hm_lang",lang);$("#lang").value=$("#lang2").value=lang;await loadLocale();await loadCatalog();await loadFridge();}
function bind(){
 $$("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page)); $$("[data-go]").forEach(b=>b.onclick=()=>showPage(b.dataset.go));
 $("#lang").onchange=e=>changeLang(e.target.value);$("#lang2").onchange=e=>changeLang(e.target.value);
 const toggle=()=>{dark=!dark;localStorage.setItem("hm_theme",dark?"dark":"light");applyTheme()};$("#theme").onclick=toggle;$("#theme2").onclick=toggle;
 $("#accent").oninput=e=>{document.documentElement.style.setProperty("--accent",e.target.value);localStorage.setItem("hm_accent",e.target.value)};
 const acc=localStorage.getItem("hm_accent");if(acc){$("#accent").value=acc;document.documentElement.style.setProperty("--accent",acc)}
 $("#recipeSearch").oninput=async e=>{let a=await fetch(`/api/recipes?lang=${lang}&q=${encodeURIComponent(e.target.value)}`).then(r=>r.json());renderRecipes(a)};
 $("#ingredientChips").onclick=e=>{let b=e.target.closest("[data-ing]");if(!b)return;selected.has(b.dataset.ing)?selected.delete(b.dataset.ing):selected.add(b.dataset.ing);b.classList.toggle("on")};
 $("#cookBtn").onclick=async()=>{let r=await fetch("/api/ai-cook",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,ingredients:[...selected]})}).then(r=>r.json());$("#cookResult").innerHTML=(r.recipes||[]).map(x=>`<div class="card"><b>${x.name}</b> · ${x.match}% · ${x.minutes} min</div>`).join("")||`<p>${r.message||""}</p>`};
 $("#diagnoseForm").onsubmit=async e=>{e.preventDefault();let fd=new FormData();fd.append("query",$("#plantQuery").value);fd.append("lang",lang);if($("#plantImage").files[0])fd.append("image",$("#plantImage").files[0]);$("#diagnosisResult").innerHTML="✨ AI…";let r=await fetch("/api/diagnose",{method:"POST",body:fd}).then(r=>r.json());$("#diagnosisResult").innerHTML=`<div><span class="badge">${r.confidence}</span><h2>${r.title}</h2><p>${r.text}</p></div>`};
 $("#addFridge").onclick=async()=>{await fetch("/api/fridge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ingredient_id:$("#fridgeIngredient").value,amount:+$("#fridgeAmount").value,unit:$("#fridgeUnit").value,expires:$("#fridgeExpires").value})});loadFridge()};
}
async function loadFridge(){let a=await fetch(`/api/fridge?lang=${lang}`).then(r=>r.json());$("#fridgeList").innerHTML=a.length?a.map(x=>`<div class="card"><div class="emoji">🧊</div><h3>${x.name}</h3><b>${x.amount} ${x.unit}</b><p>${x.expires||"—"}</p></div>`).join(""):`<div class="card">🧊 ${locale.available||""}</div>`}
boot();