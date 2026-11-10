/* v330: Außenlager, Angebotsmengen, echte Lieferkette und alte Spielstände.
   Ohne Pakete: node farm-wholesale-v330.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js','places.js','map.js','game.js','farm.js','erbe.js'])run(read(f));
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
 function truck(){const f=makeVehicle('v-scania');f.at=FARM_NODE;S.fleet.push(f);return f;}
 function largeFarm(){
  fresh();truck();S.farm.external={silo:10,barn:10};S.farm.inv={};
  S.farm.objs=S.farm.objs.filter(o=>o.t!=='field'&&o.t!=='tree');
  for(let k=0;k<40;k++)S.farm.objs.push({id:S.farm.seq++,t:'field',x:1,z:1});
 }
`);
let n=0;
function test(name,f){f();console.log('ok '+(++n)+' '+name);}

test('Altbestand: Silo mit Halle weiterhin 1080 Plätze, keine kostenlosen Außenflächen',()=>{
 run('fresh();');assert.equal(run('farmStoreCap("silo")'),1080);assert.equal(run('farmExternalCap("silo")'),0);
 const before=run('JSON.stringify(S.farm.inv)');run('S=JSON.parse(JSON.stringify(S));farmMigrate();farmMigrate();');
 assert.equal(run('farmStoreCap("silo")'),1080);assert.equal(run('JSON.stringify(S.farm.inv)'),before);
 assert.equal(run('farmBulkMake()'),null);
});
test('Kauf, Mengenpakete, exakter Preis und additive Kapazität auch über bisheriges Maximum',()=>{
 run('fresh();var m=S.money,ex=S.expense,v=farmValue();var price=farmExternalCost("silo",1);');
 assert.equal(run('price'),75000);assert.equal(run('farmExternalBuy("silo",1)'),true);
 assert.equal(run('m-S.money'),75000);assert.equal(run('S.expense-ex'),75000);
 assert.equal(run('farmStoreCap("silo")'),2080);assert.equal(run('farmHallBonus("silo")'),540);
 assert.equal(run('farmValue()-v'),52500);
 run('price=farmExternalCost("silo",5);m=S.money;');assert.ok(run('farmExternalBuy("silo",5)'));
 assert.equal(run('m-S.money'),run('price'));assert.equal(run('farmExternalLevel("silo")'),6);
 assert.equal(run('farmStoreCap("silo")'),7080);
 assert.ok(run('farmExternalBuy("barn",10)'));assert.equal(run('farmExternalCap("barn")'),5000);
});
test('Level, Speditionsgründung, falsches Lager und leere Kasse blockieren ohne Abbuchung',()=>{
 for(const setup of ['fresh(14)','fresh();S.farm.logi=false','fresh();S.money=1']){
  run(setup+';var before=JSON.stringify({money:S.money,inv:S.farm.inv,external:S.farm.external,orders:S.orders});');
  assert.equal(run('farmExternalBuy("silo",1)'),false);
  assert.equal(run('JSON.stringify({money:S.money,inv:S.farm.inv,external:S.farm.external,orders:S.orders})'),run('before'));
 }
 run('fresh();');for(const args of ['"holz",1','"troph",1','"silo",0','"silo",-1','"silo",2'])assert.equal(run('farmExternalBuy('+args+')'),false);
 assert.equal(run('S.money'),3e8);
});
test('Ausgebauter Platz speichert echte Ware; JSON und Migration erhalten Geld, Ausbau und Bestand',()=>{
 run('fresh();farmExternalBuy("silo",5);farmAdd("weizen",3000,4);var saved=JSON.stringify({money:S.money,external:S.farm.external,inv:S.farm.inv,cap:farmStoreCap("silo")});S=JSON.parse(JSON.stringify(S));farmMigrate();');
 assert.ok(run('farmInv("weizen")')>1080);
 assert.equal(run('JSON.stringify({money:S.money,external:S.farm.external,inv:S.farm.inv,cap:farmStoreCap("silo")})'),run('saved'));
});
test('Großaufträge mit echter Straße, Adresse und deutlich größerer Menge; höchstens zwei zugleich',()=>{
 run('largeFarm();var o=farmBulkMake();');assert.ok(run('o && o.bulk'));
 assert.ok(run('Object.values(o.farm.items)[0]')>140);
 assert.ok(run('o.drop.t.includes(o.shipper) && o.pick.t.includes("Test")'));
 assert.ok(run('plan(o.from,o.to,o.cargo,o.weight,"time")'));
 assert.ok(run('o.weight<=farmMaxKg() && o.bulk.window>=5*1440 && o.bulk.window<=45*1440'));
 run('S.orders.push(o);var second=farmBulkMake();');assert.ok(run('second && second.shipper!==o.shipper'));
 run('S.orders.push(second);');assert.equal(run('farmBulkMake()'),null);
});
test('Keine unproduzierbaren, zu großen oder vom kleinen Fahrzeug nicht tragbaren Mengen',()=>{
 run('fresh();S.farm.external={barn:10};S.farm.inv={};S.farm.objs=[];truck();');assert.equal(run('farmBulkMake()'),null);
 run('largeFarm();S.fleet=[];');assert.equal(run('farmBulkMake()'),null);
 run('largeFarm();S.farm.external.barn=0;S.farm.inv={mais:{n:farmStoreCap("silo"),q:3}};');assert.equal(run('farmBulkMake()'),null);
 run('largeFarm();var o=farmBulkMake();');
 assert.ok(run('Object.entries(o.farm.items).every(([id,n])=>n<=farmStoreCap(FITEMS[id].st)*.6 && n<=farmBulkStock(id)+farmBulkDaily(id,28)*28*.75)'));
});
test('Zutatenkette begrenzt Tierprodukte und Backwaren: ohne Mühle kein Futter, ohne Bäckerei kein Brot',()=>{
 run('largeFarm();S.farm.objs=S.farm.objs.filter(o=>!FMACHINES[o.t]);S.farm.objs.push({t:"cows",animals:Array(6).fill({})});');
 assert.equal(run('farmBulkDaily("milch",21)'),0);assert.equal(run('farmBulkDaily("brot",21)'),0);
 run('S.farm.objs.push({t:"mill"});');assert.ok(run('farmBulkDaily("milch",21)>0'));
 assert.equal(run('farmBulkDaily("brot",21)'),0);
 run('S.farm.objs.push({t:"bakery"});');assert.ok(run('farmBulkDaily("brot",21)>0'));
});
test('Annahme startet längere Frist jetzt; Standardaufträge bleiben unbegrenzt, erneute Annahme verlängert nichts',()=>{
 run('largeFarm();var o=farmBulkMake();S.orders.push(o);var window_=o.bulk.window;S.time+=600;var now=S.time;');
 assert.ok(run('farmAcceptOrder(o,"fahrer")'));assert.equal(run('o.deadline'),run('now+window_'));
 run('S.time+=300;');assert.equal(run('farmAcceptOrder(o)'),false);assert.equal(run('o.deadline'),run('now+window_'));
 assert.ok(run('farmBulkTerm(o).includes(stamp(o.deadline))'));
 run('var standard=farmOrderObj("w-werder","Nachbar",{weizen:2});farmAcceptOrder(standard);');
 assert.equal(run('standard.deadline-S.time'),run('FORD_NOLIMIT'));
 assert.ok(run('farmBulkWindow(2000,20000,2000,0,30)>farmBulkWindow(200,2000,200,0,30)'));
 run('S=JSON.parse(JSON.stringify(S));farmMigrate();o=S.orders[0];');assert.equal(run('o.deadline'),run('now+window_'));
});
test('Abgelaufene Angebote und angenommene Aufträge verbrauchen keine Ware; Rückgabe bleibt möglich',()=>{
 run('largeFarm();var o=farmBulkMake();S.orders.push(o);S.time=o.expire;');assert.equal(run('farmAcceptOrder(o)'),false);
 run('largeFarm();var o=farmBulkMake();S.orders.push(o);farmAcceptOrder(o);var [id,qty]=Object.entries(o.farm.items)[0];farmAdd(id,qty,4);S.time=o.deadline;var inv=farmInv(id);');
 assert.equal(run('startJob(o,{},[])'),false);assert.equal(run('farmInv(id)'),run('inv'));
 assert.ok(run('farmReturnOrder(o)'));assert.equal(run('farmInv(id)'),run('inv'));assert.equal(run('S.orders.length'),0);
});
test('Echter Tick behält Auftrag bis zur Frist und entfernt ihn dann einmalig ohne Warenverlust',()=>{
 run('largeFarm();var o=farmBulkMake();S.orders.push(o);farmAcceptOrder(o);var [id,qty]=Object.entries(o.farm.items)[0];farmAdd(id,qty,4);var inv=farmInv(id);S.time=o.deadline-2;S.lastDay=Math.floor(S.time/1440);S.lastSpawn=S.time;S.lastJewel=S.time;tick(1);');
 assert.equal(run('S.orders.length'),1);run('tick(1);tick(1);');assert.equal(run('S.orders.length'),0);
 assert.equal(run('farmInv(id)'),run('inv'));assert.equal(run('notices.filter(s=>s.includes("abgelaufen")).length'),1);
});
test('Direkte Lieferung: Ware genau einmal entnehmen, bis Kunde fahren, genau einmal bezahlen',()=>{
 run(`largeFarm();var o=farmBulkMake();S.orders.push(o);var [id,qty]=Object.entries(o.farm.items)[0];farmAdd(id,qty,4);var inv=farmInv(id),m=S.money,xp=S.farm.xp;
  var opt=farmDispatchOptions(o)[0];`);
 assert.ok(run('opt && opt.ev.ok'));assert.equal(run('farmSend(o,opt)'),true);
 assert.equal(run('farmInv(id)'),run('inv-qty'));assert.equal(run('S.jobs.length'),1);assert.ok(run('o.acc && o.farm.taken'));
 assert.equal(run('startJob(o,opt.v,[opt.f.uid])'),false);assert.equal(run('S.jobs.length'),1);
 run(`var job=S.jobs[0];for(let k=0;k<2000 && S.jobs.length;k++){
   if(k===10){S=JSON.parse(JSON.stringify(S));job=S.jobs[0];}
   S.time++;for(const f of S.fleet)if(f.jobId)d2dTick(f,job,job.legs[f.legIdx],vType(f.type),1);
  }`);
 assert.equal(run('S.jobs.length'),0);assert.equal(run('S.done'),1);assert.equal(run('S.farm.stats.deliv'),1);
 assert.ok(run('S.money>m && S.farm.xp>xp'));assert.equal(run('farmInv(id)'),run('inv-qty'));
 const money=run('S.money');run('finishJob(job)');assert.equal(run('S.money'),money);assert.equal(run('S.done'),1);
});
console.log('Außenlager und Großkunden: '+n+' Integrationsprüfungen bestanden.');
