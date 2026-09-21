import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), cssFiles=[], jsFiles=[], skip=new Set(['.git','node_modules','dist','build','.next']);
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile()&&p.endsWith('.css'))cssFiles.push(p);else if(ent.isFile()&&/\.(?:js|mjs|cjs)$/.test(p))jsFiles.push(p);}}
walk(root);
const selectors=['.dock','.bottom-nav','.bottom-dock','.mobile-nav','.mobile-actions'];
let marked=0,protectedDock=0;const failures=[],passes=[];const check=(ok,msg)=>(ok?passes:failures).push(msg);
for(const file of cssFiles){const text=fs.readFileSync(file,'utf8');const marker=text.lastIndexOf('UI_CONTRACT_DOCK_V1');if(marker<0)continue;marked++;const tail=text.slice(marker);check(/--dock-bottom\s*:\s*2px/i.test(tail),'phone bottom token '+file);check(/--dock-width\s*:\s*87%/i.test(tail),'phone width token '+file);check(/--dock-height\s*:\s*68px/i.test(tail),'phone height token '+file);for(const selector of selectors){const safe=selector.startsWith('.')?'\\.'+selector.slice(1):selector;const blocks=[...tail.matchAll(new RegExp(safe+'\\s*\\{([^{}]*)\\}','gs'))].map(m=>m[1]);for(const block of blocks){if(!/position\s*:|bottom\s*:/.test(block))continue;protectedDock++;check(/position\s*:\s*fixed\b/i.test(block),selector+' fixed '+file);check(/bottom\s*:\s*var\(\s*--dock-bottom\s*\)/i.test(block),selector+' bottom token '+file);check(!/safe-area|env\s*\(/i.test(block),selector+' no safe-area '+file);}}}
check(marked>0,'contract marker exists');check(protectedDock>0,'protected dock rule exists');
const js=jsFiles.map(f=>fs.readFileSync(f,'utf8')).join('\n');check(!/(?:dock|bottomNav|bottom_nav)\s*\.\s*style\s*\.\s*bottom/i.test(js),'JS does not set dock.style.bottom');check(!/setProperty\s*\(\s*['"]--dock-bottom['"]/i.test(js),'JS does not mutate --dock-bottom');
for(const p of passes)console.log('PASS '+p);if(failures.length){for(const f of failures)console.error('FAIL '+f);process.exit(1)}console.log('PASS Safari-independent dock contract protected');
