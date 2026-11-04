/* v303: node field-menu-v303.test.js
   Originale Feld-, Farmer-, Menü- und Werkzeugfunktionen mit kleinem DOM-/Grafik-Ersatz.
   --before lädt für den Fehlernachweis farmview.js aus origin/main (Test muss scheitern). */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=fs.existsSync(path.join(__dirname,'farmview.js'))?__dirname:path.join(__dirname,'..');
const before=process.argv.includes('--before');
const read=f=>before&&f==='farmview.js'?require('node:child_process').execFileSync('git',['show','origin/main:farmview.js'],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,f),'utf8');
const extract=(file,name)=>{const s=read(file),i=s.indexOf('function '+name+'(');if(i<0)return '';const end=s.indexOf('\n}',i);assert.ok(end>i,name);return s.slice(i,end+2);};
const C=vm.createContext({console});const run=s=>vm.runInContext(s,C);
for(const name of ['FITEMS','FCROPS'])run(read('farmdata.js').match(new RegExp('const '+name+' = \\{[\\s\\S]*?\\n\\};'))[0]);
run(`
var S,FV,writes,events,saved,gains,experience,chosen,timers=new Map(),timerId=0,listeners={},tools=[],left=null;
function el(){return {dataset:{},style:{},events:{},classList:{contains:()=>false},getBoundingClientRect:()=>({left:0,top:0}),appendChild(){},remove(){},addEventListener(k,fn){this.events[k]=fn;}};}
var pop=el(),farm=el(),canvas=el(),html='',classes=new Set();
pop.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};
Object.defineProperty(pop,'className',{get:()=>[...classes].join(' '),set:s=>{classes=new Set(s.split(' ').filter(Boolean));}});
Object.defineProperty(pop,'innerHTML',{get:()=>html,set:s=>{html=s;writes++;tools=[];
 pop.firstChild=s?{offsetWidth:280,offsetHeight:s.includes('data-tool="seed"')?300:140,style:{}}:null;
 for(const m of s.matchAll(/<div\\b([^>]*data-tool="[^"]*"[^>]*)>/g)){const t=el();for(const a of m[1].matchAll(/data-([a-z]+)="([^"]*)"/g))t.dataset[a[1]]=a[2];tools.push(t);}
 left=s.includes('class="fp-left"')?{textContent:''}:null;
}});
pop.querySelectorAll=s=>s==='[data-tool]'?tools:[];pop.querySelector=s=>s==='.fp-left'?left:null;
function $(s){return s==='#farmPop'?pop:s==='#farm'?farm:s==='#farmCv'?canvas:null;}
var document={createElement:()=>el()},window={addEventListener:(k,fn)=>listeners[k]=fn,removeEventListener:(k,fn)=>{if(listeners[k]===fn)delete listeners[k];}};
var performance={now:()=>1000};
function setTimeout(fn){const id=++timerId;timers.set(id,fn);return id;}function clearTimeout(id){timers.delete(id);}
function fresh(){S={time:100,money:1000,expense:0,farm:{objs:[{id:1,t:'field',x:0,z:0,crop:null,last:'mais'}],stats:{harvest:0}}};
 FV={pop:null,sel:1,tool:null,t0:0,nodes:new Map(),bounce:new Map(),R:{w:390,h:700,project:()=>[180,300],burst(){},emit(){}}};
 writes=0;events=[];saved=0;gains=[];experience=0;chosen='weizen';html='';classes.clear();timers.clear();listeners={};tools=[];left=null;}
function farmObj(id){return S.farm.objs.find(o=>o.id===id);}function flv(){return 106;}function esc(s){return String(s);}function eur(n){return n+' €';}
function icOf(id){return '<i>'+id+'</i>';}function tagIc(id){return id;}function qStars(q){return '★'.repeat(q);}function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function farmCenter(o){return [o.x||0,o.z||0];}function objH(){return 1;}function farmRoom(){return 100;}
function farmAdd(id,n,q){gains.push({id,n,q});}function farmXP(n){experience+=n;}function farmEvent(k,n){events.push({k,n});}
function toast(){}function sfx(){}function floatText(){}function xpFly(){}function flyGain(){}function save(){saved++;}
function staffWlHas(){return true;}function staffCropNeed(){return true;}function staffCrop(){return chosen;}function staffCredit(){}function staffItemName(id,n){return id;}
function pointer(x=100,y=100){return {clientX:x,clientY:y,preventDefault(){},stopPropagation(){}};}
function selected(){return farmObj(FV.sel);}
`);
for(const [file,names] of [
 ['farm.js',['fieldState','fieldStage','farmCropOk','farmPlant','farmWater','farmHarvest']],
 ['team.js',['staffDo']],
 ['farmview.js',['fdur','openPop','popFresh','closeFarmPop','fieldPopState','refreshFieldPop','renderFarmPop','positionFarmPop','startToolDrag','applyToolAt','applyToolTo','doPlant','doWater','doHarvest','objScreen','farmSyncState']]
])for(const name of names){const s=extract(file,name);if(s)run(s);}
let checks=0;
function test(name,fn){run('fresh();var o=farmObj(1);openPop(o,"seed");');fn();checks++;console.log('ok '+name);}
function tick(){run('positionFarmPop()');}
function show(re){assert.match(run('html'),re);}

test('Ausgewähltes leeres Feld wechselt nach Farmer-Aussaat automatisch zum Gießen',()=>{
 show(/Was soll wachsen/);run('staffDo({role:"farmer"},{k:"field",oid:1,crop:"weizen"});');tick();
 assert.equal(run('FV.pop.kind'),'grow');assert.equal(run('FV.sel'),1);show(/Gießen/);
 assert.doesNotMatch(run('html'),/data-tool="seed"|Was soll wachsen/);
 assert.equal(run('o.crop'),'weizen');assert.equal(run('S.money'),999);assert.equal(run('S.expense'),1);
 assert.equal(run('pop.classList.contains("fresh")'),true,'Klickschutz für neue Aktion');
});
test('Keine wiederholten DOM-Neuaufbauten beim Nachführen der Position/Restzeit',()=>{
 run('staffDo({role:"farmer"},{k:"field",oid:1,crop:"weizen"});');tick();
 const n=run('writes');run('var button=tools[0];S.time+=15;for(var i=0;i<40;i++)positionFarmPop();');
 assert.equal(run('writes'),n);assert.equal(run('tools[0]===button'),true);assert.match(run('left.textContent'),/h/);
});
test('Farmer-Gießen zeigt gegossen, richtige Restzeit und Qualität ohne weiteren Wasserknopf',()=>{
 run('staffDo({role:"farmer"},{k:"field",oid:1,crop:"weizen"});');tick();
 run('var oldEnd=o.end;staffDo({role:"farmer"},{k:"water",oid:1});');tick();
 assert.equal(run('o.w'),true);assert.equal(run('o.end'),run('S.time+(oldEnd-S.time)*0.75'));
 show(/gegossen/);assert.doesNotMatch(run('html'),/data-tool="water"/);show(/★★★★★/);
 const end=run('o.end');run('staffDo({role:"farmer"},{k:"water",oid:1});');assert.equal(run('o.end'),end);
});
test('Reife und anschließende Farmer-Ernte/Aussaat wechseln ohne erneutes Antippen',()=>{
 run('staffDo({role:"farmer"},{k:"field",oid:1,crop:"weizen"});');tick();
 run('S.time=o.end;');tick();assert.equal(run('FV.pop.kind'),'sickle');show(/ist reif/);
 run('staffDo({role:"farmer"},{k:"field",oid:1,crop:"mais"});');tick();
 assert.equal(run('o.crop'),'mais');assert.equal(run('FV.pop.kind'),'grow');show(/Mais/);show(/Gießen/);
 assert.equal(run('FV.sel'),1);assert.equal(run('S.farm.stats.harvest>=2'),true);
});
test('Direkter Neuaufbau normalisiert ein veraltetes Saatmenü',()=>{
 run('farmPlant(o,"mais");renderFarmPop();');assert.equal(run('FV.pop.kind'),'grow');show(/Gießen/);
 run('S.time=o.end;renderFarmPop();');assert.equal(run('FV.pop.kind'),'sickle');show(/Sichel/);
 run('farmHarvest(o);renderFarmPop();');assert.equal(run('FV.pop.kind'),'seed');show(/Was soll wachsen/);
});
test('Alter Saatknopf zwischen zwei Bildern pflanzt nicht erneut und wechselt zum neuen Menü',()=>{
 run('var oldButton=tools.find(t=>t.dataset.crop==="mais");staffDo({role:"farmer"},{k:"field",oid:1,crop:"weizen"});oldButton.events.pointerdown(pointer());');
 assert.equal(run('FV.tool'),null);assert.equal(run('o.crop'),'weizen');assert.equal(run('S.money'),999);
 assert.equal(run('FV.pop.kind'),'grow');show(/Gießen/);assert.equal(run('Object.keys(listeners).length'),0);
 run('var planted=farmPlant(o,"mais");');assert.equal(run('planted'),false);assert.equal(run('S.money'),999);
});
test('Begonnene Saatgeste bleibt stabil; Farmer übernimmt vor Loslassen ohne Auswahlverlust',()=>{
 run('tools.find(t=>t.dataset.crop==="mais").events.pointerdown(pointer());var oldWrites=writes;staffDo({role:"farmer"},{k:"field",oid:1,crop:"weizen"});');
 tick();assert.equal(run('writes'),run('oldWrites'),'Keine Änderung unter dem Finger');
 assert.equal(run('FV.pop.kind'),'seed');run('listeners.pointerup(pointer());');
 assert.equal(run('FV.tool'),null);assert.equal(run('o.crop'),'weizen');assert.equal(run('S.money'),999);
 assert.equal(run('FV.pop.kind'),'grow');assert.equal(run('FV.sel'),1);show(/Gießen/);
 assert.equal(run('Object.keys(listeners).length'),0);
});
test('Gezogene Saat darf andere leere Felder weiter bepflanzen, belegtes Ursprungsfeld bleibt geschützt',()=>{
 run(`S.farm.objs.push({id:2,t:'field',x:2,z:0,crop:null});tools.find(t=>t.dataset.crop==='mais').events.pointerdown(pointer());
 staffDo({role:'farmer'},{k:'field',oid:1,crop:'weizen'});var T=FV.tool;T.moved=true;applyToolTo(o,T);applyToolTo(farmObj(2),T);listeners.pointerup(pointer());`);
 assert.equal(run('o.crop'),'weizen');assert.equal(run('farmObj(2).crop'),'mais');assert.equal(run('S.money'),997);
 assert.equal(run('T.done'),1);assert.equal(run('saved'),1);assert.equal(run('FV.pop'),null,'Erfolgreiche eigene Geste schließt wie bisher');
});
test('Gießknopf funktioniert nach automatischem Wechsel über denselben Pointerpfad',()=>{
 run('staffDo({role:"farmer"},{k:"field",oid:1,crop:"weizen"});');tick();
 run('tools.find(t=>t.dataset.tool==="water").events.pointerdown(pointer());listeners.pointerup(pointer());');
 assert.equal(run('o.w'),true);assert.equal(run('saved'),1);assert.equal(run('experience'),1);assert.equal(run('FV.tool'),null);
});
test('Andere Auswahl bleibt unverändert, entfernte Felder schließen nur ihr eigenes Menü',()=>{
 run('FV.pop={id:20,kind:"pen"};FV.sel=20;farmPlant(o,"weizen");var n=writes;');tick();
 assert.equal(run('FV.pop.kind'),'pen');assert.equal(run('writes'),run('n'));assert.equal(run('FV.sel'),20);
 run('FV.pop={id:1,kind:"seed"};FV.sel=1;S.farm.objs=[];');tick();assert.equal(run('FV.pop'),null);
});
console.log(checks+' Feldmenü-Szenarien bestanden; echte Logik, DOM-/Grafik-Ersatz, kein Live-Browser-/Handytest.');
