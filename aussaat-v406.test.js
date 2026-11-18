/* v351: Laufbewegung, Werkzeugstation, Camp-Ausgang und Fahrradstellplätze.
   Ohne Pakete: node worker-motion-v351.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,addEventListener(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js','villagedata.js','places.js','map.js','game.js','farm.js','erbe.js','village.js','gl3d.js','farmmodels.js','woodmodels.js','fishmodels.js','rent.js','hunt.js'])run(read(f));
run(`
 var notices=[];
 toast=m=>notices.push(m);save=()=>{};render=()=>{};renderInspector=()=>{};mapRedraw=()=>{};logMoney=()=>{};
 checkLevel=()=>{};farmCheckLevel=()=>{};farmEvent=()=>{};
 function umschlagFactor(){return 1;}function tickBases(){}function baseDayChange(){}function staffPerk(){return 0;}
 spawnOrders=()=>0;spawnJewels=()=>{};
 function fresh(lv=111){
  S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:600,lastDay:0,player:{company:'Test'},bases:[],fleet:[]});
  farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=(lv-1)**2*50;S.farm.lvSeen=lv;S.farm.tut.done=true;
  S.farm.econ238=1;S.farm.cap.silo=10;S.farm.cap.barn=10;
  S.farm.objs.push({t:'lagerhalle',id:S.farm.seq++,x:1,z:20,sz:[10,6]});
  S.orders=[];notices=[];clearRouteCache();
 }
`);


for(const f of ['avatar.js','farmstory.js','intro.js','farmview.js','camp.js','staffwalk.js','staffgear.js','team.js','staffseat.js'])run(read(f));
run(`phoneMsg=m=>notices.push(m);
 function prepared(){fresh(25);S.farm.areas.wald=true;S.farm.areas.see=true;S.farm.areas.saege=true;}
`);


run(`var WV={staff:new Map(),bgChunks:new Map(),bushes:[],rockObs:[]};forestK=()=>0;prepared();S.farm.areas.altwald=true;
var simTime=0;wnow=()=>simTime;var meshes=new Map();fmesh=(key,fn)=>{if(!meshes.has(key))meshes.set(key,{key,data:fn()});return meshes.get(key);};
fnode=(mesh,props)=>Object.assign({mesh,x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1,visible:true,children:[]},props);
FV.R={nodes:[],cam:{tx:0,tz:0},addChild:(p,c)=>{p.children.push(c);c.parent=p;return c;},burst(){}};
function allWorkers(){prepared();S.farm.areas.altwald=true;WV.staff.clear();FV.R.nodes=[];S.farm.staff=Object.keys(FSTAFF_ROLES).map((role,i)=>{const s=FARM_STORY.candidate(role),sl=CAMP.slots[i];s.px=sl.x;s.pz=sl.z;CAMP.assign(sl.id,s.id);return s;});worldSyncStaff();}
`);
run(read('peopletraffic.js'));

let count=0;const test=(name,fn)=>{fn();console.log('ok '+(++count)+' '+name);};
run(`function fieldSetup(n=1){prepared();FV.on=false;S.farm.staff=[FARM_STORY.candidate('farmer')];var s=S.farm.staff[0],fields=S.farm.objs.filter(o=>o.t==='field').slice(0,n);if(fields.length<n)throw Error('Felder fehlen');fields.forEach(o=>{o.crop=null;});return fields;}`);
test('Ernte leert das Feld; weder Saatkosten noch sofortige Neubepflanzung',()=>{
 run(`var fields=fieldSetup(),o=fields[0],s=S.farm.staff[0];farmPlant(o,'weizen');S.time=o.end;var moneyBefore=S.money;var j={k:'field',oid:o.id,what:'erntet Weizen, sät Mais'};staffDo(s,j);var harvested=S.farm.stats.harvest;`);
 assert.equal(run('o.crop'),null);assert.equal(run('S.money'),run('moneyBefore'));assert.ok(run('harvested>=2'));run('staffDo(s,j);');assert.equal(run('S.farm.stats.harvest'),run('harvested'));assert.equal(run('o.crop'),null);
});
test('Ernteabsicht bleibt bei manuell geleertem Feld erhalten; Aussaat bucht nur einmal',()=>{
 run(`var fields=fieldSetup(),o=fields[0],s=S.farm.staff[0];farmPlant(o,'weizen');S.time=o.end;staffGo(s,0,{k:'field',oid:o.id,what:'erntet Weizen'});var j=s.job;farmHarvest(o);var before=S.money;staffDo(s,j);`);assert.equal(run('j.fieldMode'),'harvest');assert.equal(run('o.crop'),null);assert.equal(run('S.money'),run('before'));
 run(`staffGo(s,0,{k:'field',oid:o.id,what:'sät Weizen'});var j=s.job;staffDo(s,j);var crop=o.crop,paid=S.money;staffDo(s,j);`);assert.equal(run('j.fieldMode'),'sow');assert.ok(run('!!crop'));assert.equal(run('S.money'),run('paid'));
});
test('Sichtbare Aussaat über zwei Felder dauert auch bei 30× mindestens je eine Säbewegung',()=>{
 run(`var fields=fieldSetup(2),s=S.farm.staff[0],p=staffSpot(fields[0],s.role);s.px=p.x;s.pz=p.z;WV.staff.clear();worldSyncStaff();var e=WV.staff.get(s.id);FV.on=true;FV.R.cam.dist=25;FV.R.w=640;FV.R.h=480;FV.R.project=()=>[320,240,0];document.hidden=false;document.body.classList.contains=k=>k==='tab-farm';clockRunning=()=>true;var grains=[];FV.R.emit=p=>grains.push(p);S.farm.taskT=S.time;staffGo(s,0,{k:'field',oid:fields[0].id,oids:fields.map(o=>o.id),what:'sät Weizen'});var original=s.job,frames=0,sowingFrames=0,states=new Set(),premature=false,sickle=false;
 for(;frames<1600&&s.job===original;frames++){S.time+=1.5;S.farm.taskT=S.time;staffWork();simTime+=.05;stepStaff(.05,simTime);STAFF_WALK.step(.05,simTime);STAFF_GEAR.step(.05,simTime);if(e.sowing){sowingFrames++;states.add(e.sowAction.index);if(e.tool.visible||!e.seedBag.visible||Math.abs(e.walkRig.left.rx+.55)>.001)sickle=true;}if(s.job===original&&!e.sowAction?.done&&fields.some(o=>o.crop))premature=true;}`);
 assert.equal(run('premature'),false);assert.equal(run('sickle'),false);assert.ok(run('sowingFrames>=64'));assert.ok(run('fields.every(o=>!!o.crop)'));assert.ok(run('grains.length>=8&&grains.length<=12'));assert.ok(run('grains.every(p=>[p.x,p.y,p.z,p.vx,p.vy,p.vz].every(Number.isFinite)&&p.g<0&&p.life<=.7)'));
});
test('Abseits der Hofansicht hängt die Arbeit nicht von Animationsbildern ab',()=>{
 run(`var fields=fieldSetup(),s=S.farm.staff[0];staffGo(s,0,{k:'field',oid:fields[0].id,what:'sät Weizen'});S.time=s.job.t1+1;S.farm.taskT=S.time;staffWork();`);assert.ok(run('!!fields[0].crop'));assert.equal(run('s.job'),null);
});
test('Manuell bepflanztes Zielfeld wird nicht noch einmal besät oder bezahlt',()=>{
 run(`var fields=fieldSetup(),s=S.farm.staff[0];staffGo(s,0,{k:'field',oid:fields[0].id,what:'sät Weizen'});farmPlant(fields[0],'weizen');var paid=S.money,end=fields[0].end;staffDo(s,s.job);`);assert.equal(run('S.money'),run('paid'));assert.equal(run('fields[0].end'),run('end'));
});
console.log(count+' Aussaat-Prüfgruppen bestanden.');
