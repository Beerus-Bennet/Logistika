/* v417: Außenlager-Pakete je einmal und Futter in Portionen je Mahlzeit. Ohne Pakete: node aussenlager-futter-v417.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js','places.js','map.js','game.js','farm.js','erbe.js','gl3d.js','hunt.js'])run(read(f));
run(`
 var notices=[];
 toast=m=>notices.push(m);save=()=>{};render=()=>{};renderInspector=()=>{};mapRedraw=()=>{};logMoney=()=>{};
 checkLevel=()=>{};farmCheckLevel=()=>{};farmEvent=()=>{};
 function umschlagFactor(){return 1;}function tickBases(){}function baseDayChange(){}function staffPerk(){return 0;}
 spawnOrders=()=>0;spawnJewels=()=>{};
 const farmTickReal=farmTick;farmTick=()=>{};
 function fresh(lv=111){
  S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:600,lastDay:0,player:{company:'Test'},bases:[],fleet:[]});
  farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=(lv-1)**2*50;S.farm.lvSeen=lv;S.farm.tut.done=true;
  S.farm.econ238=1;S.farm.cap.silo=10;S.farm.cap.barn=10;
  S.farm.objs.push({t:'lagerhalle',id:S.farm.seq++,x:1,z:20,sz:[10,6]});
  S.orders=[];notices=[];clearRouteCache();
 }

`);
const assert2=require('node:assert/strict');
run(`fresh();`);
// Außenlager: jedes Paket einmal
assert2.ok(run(`farmExternalBuy('silo',1)`));assert2.equal(run(`farmExternalCost('silo',1)`),null,'+1 nur einmal');
assert2.ok(run(`farmExternalBuy('silo',10)`));assert2.equal(run(`farmExternalCost('silo',10)`),null);assert2.ok(run(`farmExternalCost('silo',5)>0`));
assert2.ok(run(`farmExternalBuy('silo',5)`));assert2.equal(run(`farmExternalLevel('silo')`),16);assert2.equal(run(`[1,5,10].every(n=>farmExternalCost('silo',n)===null)`),true);
assert2.equal(run(`farmExternalBuy('silo',1)`),false,'kein viertes Paket');
// alter Stand mit 20 Abschnitten: alle Pakete gelten als gekauft; 2 Abschnitte: +5/+10 noch möglich
run(`S.farm.external.barn=20`);assert2.equal(run(`[1,5,10].every(n=>farmExternalCost('barn',n)===null)`),true);
run(`S.farm.external.holz=2`);assert2.equal(run(`farmExternalCost('holz',1)`),null);assert2.ok(run(`farmExternalCost('holz',5)>0&&farmExternalCost('holz',10)>0`));
// Futter: Kuh frisst 5 kg je Mahlzeit, ein 20-kg-Ballen reicht für 4 Mahlzeiten
const r=run(`(()=>{const o={id:S.farm.seq++,t:'cows',x:0,z:0,lv:0,animals:[]};for(let i=0;i<4;i++)o.animals.push({});S.farm.objs.push(o);S.farm.inv={};farmAdd('kfutter',1,3);
 const res=o.animals.map(a=>farmFeed(o,a));return JSON.stringify({res,inv:farmInv('kfutter'),open:S.farm.feedOpen.kfutter,fifth:(()=>{const a={};o.animals.push(a);return farmFeed(o,a);})()});})()`);
console.log(r);const R=JSON.parse(r);assert2.deepEqual(R.res,[true,true,true,true]);assert2.equal(R.inv,0);assert2.ok(Math.abs(R.open)<1e-9);assert2.equal(R.fifth,'nofeed');
// Huhn: 0,15 kg je Mahlzeit, ein 5-kg-Eimer reicht für 33 Mahlzeiten
const h=run(`(()=>{const o={id:S.farm.seq++,t:'coop',x:0,z:0,lv:3,animals:[]};for(let i=0;i<40;i++)o.animals.push({});S.farm.objs.push(o);S.farm.inv={};S.farm.feedOpen={};farmAdd('hfutter',1,3);return o.animals.map(a=>farmFeed(o,a)).filter(x=>x===true).length;})()`);
console.log('Hühner satt aus einem Eimer:',h);assert2.equal(h,33);
console.log('OK v417: Außenlager-Pakete je einmal (auch alte Stände), Futter in Portionen je Mahlzeit.');
