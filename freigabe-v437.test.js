/* v437: Freigabe per Diensttelefon. node freigabe-v437.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,addEventListener(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js','villagedata.js','places.js','map.js','game.js','farm.js','erbe.js','village.js','gl3d.js','farmmodels.js','woodmodels.js','rent.js','hunt.js'])run(read(f));
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


for(const f of ['avatar.js','farmstory.js','intro.js','farmview.js','camp.js','team.js','staffseat.js'])run(read(f));
run(`staffHome=()=>[0,0];S=null;var msgs=[];phoneMsg=m=>{m.id="M"+(S.seq++);msgs.push(m);S.phone.msgs.unshift(m);return m;};renderPhone=()=>{};
 function prep(){fresh(25);S.phone={msgs:[],unread:0};msgs=[];S.farm.staff=[{id:"s1",role:"farmer",name:"Kalle Bauer",job:null},{id:"s2",role:"fischwirt",name:"Fiete Fisch",job:null}];S.farm.tasks=[];}`);
let n=0;const test=(t,f)=>{f();console.log('ok '+(++n)+' '+t);};
test('Nicht freigegebene Ware: Kraft fragt per Telefon (einmal), Freigabe schaltet frei',()=>{
 run('prep();staffWlSet("farmer","tomate",false);var T=staffEnsureTask({role:"farmer",item:"tomate",n:1,from:"chef"});var s=S.farm.staff[0];');
 run('staffTaskJob(s,T);staffTaskJob(s,T);staffTaskJob(s,T);');
 assert.equal(run('msgs.length'),1);assert.equal(run('msgs[0].kind'),'approve');assert.match(run('T.wait'),/Freigabe/);
 assert.ok(run('staffApprove(msgs[0].id,true)'));assert.equal(run('staffWlHas("farmer","tomate")'),true);assert.ok(run('msgs[0].handled'));
 assert.equal(run('staffApprove(msgs[0].id,true)'),false);assert.match(run('approveMsgHTML(msgs[0])'),/✔/);
});
test('Nicht freigeben löscht die ganze Kette auch bei Kollegen und verhindert sofortiges Nachwachsen',()=>{
 run('prep();staffWlSet("farmer","tomate",false);var P=staffEnsureTask({role:"fischwirt",item:"fischkonserve",n:1,from:"chef"});var T=staffEnsureTask({role:"farmer",item:"tomate",n:1,from:"fischwirt",fromId:"s2",parent:P.id});var s=S.farm.staff[0];');
 assert.equal(run('S.farm.tasks.length'),2);run('staffTaskJob(s,T);');assert.equal(run('msgs.length'),1);
 assert.ok(run('staffApprove(msgs[0].id,false)'));assert.equal(run('S.farm.tasks.length'),0);assert.equal(run('staffWlHas("farmer","tomate")'),false);
 assert.equal(run('staffEnsureTask({role:"farmer",item:"tomate",n:1,from:"fischwirt",fromId:"s2"})'),null);
});
test('Easter Egg: Satz entfernt, +2 Kleeblätter',()=>{
 const t=read('team.js');assert.ok(!t.includes('Telefonieren kannst du danach'));assert.match(t,/Zurück an die Arbeit · \+2 🍀/);assert.match(t,/farmClover\(2, "Easter Egg"\)/);
});
console.log(n+' Prüfungen v437 bestanden.');
