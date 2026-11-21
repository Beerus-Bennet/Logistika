/* v340: Eigene Siedlung, echte Fahrradlieferungen und Wohnverträge.
   Ohne Pakete: node village-v340.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
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
let count=0;
function test(name,fn){fn();console.log('ok '+(++count)+' '+name);}
test('Sechs Haushalte, je drei Straßenseiten; keine Überschneidung mit See, Hütte oder Grundstücken',()=>{
 run('fresh(1);var T=VILLAGE.state();');assert.equal(run('VILLAGE.residents().length'),6);
 assert.equal(run('VILLAGE_DATA.plots.filter(p=>p.starter&&p.side===1).length'),3);
 assert.equal(run('VILLAGE_DATA.plots.filter(p=>p.starter&&p.side===-1).length'),3);
 assert.ok(run('VILLAGE_DATA.plots.every(p=>!inLake(p.x,p.z,5)&&Math.hypot(p.x-RENT.H.x,p.z-RENT.H.z)>9)'));
 assert.ok(run('VILLAGE_DATA.plots.every((p,i,a)=>a.slice(i+1).every(q=>Math.abs(p.x-q.x)>=13||Math.abs(p.z-q.z)>=10.4))'),'Gärten benachbarter Straßen dürfen sich nicht überschneiden');
 assert.equal(run('new Set(VILLAGE_DATA.plots.map(p=>p.street+p.number)).size'),20);
 assert.ok(run('isUnlocked("w-seeblick")'));assert.ok(run('farmCamRect()[0]<=-82&&farmCamRect()[3]>=64'));
});
test('Wiederholtes Laden erhält Bestand, vorhandene Hütte und dieselben sechs Bewohner ohne Nachzahlung',()=>{
 run('fresh(18);S.farm.rent={built:100,earned:500,ten:{n:"Alte Mietpartei",since:200}};var before=JSON.stringify({v:VILLAGE.state(),inv:S.farm.inv,m:S.money,r:S.farm.rent});S=JSON.parse(JSON.stringify(S));farmMigrate();farmMigrate();');
 assert.equal(run('JSON.stringify({v:VILLAGE.state(),inv:S.farm.inv,m:S.money,r:S.farm.rent})'),run('before'));
});
test('Frühe Angebote kommen von benannten Nachbarn, höchstens zwölf Kilo und mit festen Haustüradressen',()=>{
 run('fresh(1);S.stage=1;S.farm.logi=false;var b=makeVehicle("v-bullitt");b.at=FARM_NODE;S.fleet.push(b);');
 for(let i=0;i<6;i++){
  run('var o=makeFarmOrder("hof");');assert.ok(run('o&&o.village&&!o.village.friend'));
  assert.ok(run('o.weight<=12&&o.refDist<1&&o.drop.t.includes(VILLAGE.address(VILLAGE.plot(o.village.plot)).t)'));
  assert.ok(run('farmDispatchOptions(o).some(x=>x.t.mode==="b"&&x.ev.ok)'));
  run('S.orders.push(o)');
 }
 assert.equal(run('new Set(S.orders.map(o=>o.shipper)).size'),6);assert.equal(run('makeFarmOrder("hof")'),null);
});
test('Echte Lieferung folgt rechtwinkligen Straßen, fährt zurück und wird nach Laden genau einmal bezahlt',()=>{
 run('fresh(1);S.stage=1;S.farm.logi=false;var b=makeVehicle("v-bullitt");b.at=FARM_NODE;S.fleet.push(b);farmAdd("apfel",8,4);var o=VILLAGE.orderFor("000",{apfel:1});S.orders.push(o);var opt=farmDispatchOptions(o)[0];var qty=farmInv("apfel");farmSend(o,opt);');
 assert.equal(run('farmInv("apfel")'),run('qty-1'));assert.equal(run('farmSend(o,opt)'),false);
 run(`var j=S.jobs[0];for(let k=0;k<1500&&S.jobs.length;k++){
  if(k===2){S=JSON.parse(JSON.stringify(S));j=S.jobs[0];}
  S.time+=.2;for(const f of S.fleet)if(f.jobId)d2dTick(f,j,j.legs[f.legIdx],vType(f.type),.2);
 }b=S.fleet[0];`);
 assert.equal(run('S.done'),1);assert.equal(run('VILLAGE.home("000").deliveries'),1);assert.equal(run('b.villageAt'),'000');
 assert.ok(run('hav(vehPoint(b),VILLAGE.geo(...VILLAGE.door(VILLAGE.plot("000"))))<.001'));
 run('var v=buildVariants(VILLAGE.orderFor("001",{apfel:1}))[0],r=repoCost(b,v.legs[0],o,0);');
 assert.ok(run('r.ok&&r.pts.length>4&&r.pts.gm.every(x=>x==="v")'));
 assert.ok(run('roadDisp(r.pts)===r.pts'));
 const m=run('S.money');run('finishJob(j);VILLAGE.delivered(j.order);');assert.equal(run('S.money'),m);assert.equal(run('VILLAGE.state().deliveries'),1);
});
test('Zwei erfolgreiche Nachbarlieferungen schalten genau eine persönliche Empfehlung frei',()=>{
 run('fresh(5);var o=VILLAGE.orderFor("000",{apfel:1});VILLAGE.delivered(o);VILLAGE.delivered(o);');
 assert.equal(run('VILLAGE.state().referrals.length'),0);
 run('VILLAGE.delivered(VILLAGE.orderFor("000",{apfel:1}));');
 assert.equal(run('VILLAGE.state().referrals.length'),1);assert.equal(run('VILLAGE.state().referrals[0].referrer'),'Anna Köhler');
 run('VILLAGE.delivered(VILLAGE.orderFor("000",{apfel:1}));');assert.equal(run('VILLAGE.state().referrals.length'),1);
});
test('Unbezahlte Erweiterung und fehlendes Baumaterial verändern weder Geld noch Grundstück',()=>{
 run('fresh(1);');assert.equal(run('VILLAGE.expand()'),false);
 run('fresh(10);S.farm.stats.deliv=6;S.money=1;var before=JSON.stringify(S);');assert.equal(run('VILLAGE.expand()'),false);assert.equal(run('JSON.stringify(S)'),run('before'));
 run('S.money=1e7;VILLAGE.expand();VILLAGE.buy("030");var before=JSON.stringify(S);');assert.equal(run('VILLAGE.build("030","holz",true)'),false);assert.equal(run('JSON.stringify(S)'),run('before'));
 assert.equal(run('VILLAGE.buy("030")'),false);
});
function built(){run('fresh(10);S.money=1e7;S.farm.stats.deliv=6;VILLAGE.expand();VILLAGE.buy("030");VILLAGE.build("030","holz",false);S.time=VILLAGE.home("030").ready;VILLAGE.tick();');}
function listed(){built();run('VILLAGE.list("030","online");S.time=VILLAGE.home("030").listing.ready;VILLAGE.tick();var L0=VILLAGE.home("030").listing;L0.offers=VILLAGE.offers("030",3);L0.extra=0;');}
test('Kauf und Bau genau einmal; eine echte Bauzeit, danach mehrere formelle Miet-/Kaufanfragen',()=>{
 run('fresh(10);S.money=1e7;S.farm.stats.deliv=6;var m=S.money;');assert.ok(run('VILLAGE.expand()'));assert.ok(run('VILLAGE.buy("030")'));assert.ok(run('VILLAGE.build("030","holz",false)'));
 assert.equal(run('m-S.money'),48000+35000+215000);assert.equal(run('VILLAGE.home("030").status'),'building');
 assert.equal(run('VILLAGE.build("030","holz",false)'),false);
 run('S.time=VILLAGE.home("030").ready-.01;VILLAGE.tick();');assert.equal(run('VILLAGE.home("030").status'),'building');
 run('S.time+=.01;VILLAGE.tick();');assert.equal(run('VILLAGE.home("030").status'),'ready');
 assert.ok(run('VILLAGE.list("030","online")'));assert.equal(run('VILLAGE.list("030","online")'),false);
 run('S.time=VILLAGE.home("030").listing.ready;VILLAGE.tick();');assert.ok(run('VILLAGE.home("030").listing.offers.length')<=6);
 assert.equal(run('VILLAGE.home("030").resident'),undefined);
});
test('Verhandlungen können scheitern: Leerstand, kein Geld, Neuvermittlung mit anderen Interessenten',()=>{
 listed();run('var h=VILLAGE.home("030"),oldNames=h.listing.offers.map(c=>c.n),m=S.money;for(let i=0;i<3;i++){for(const c of h.listing.offers)if(!c.declined)VILLAGE.negotiate("030",c.id,"rent",99999+i);S.time+=1.9*1440;VILLAGE.tick();}');
 assert.ok(run('h.listing.offers.every(c=>c.declined)'));assert.equal(run('VILLAGE.sign("030",h.listing.offers[0].id)'),false);
 assert.equal(run('h.resident'),undefined);assert.equal(run('h.status'),'ready');assert.equal(run('S.money'),run('m'));
 assert.ok(run('VILLAGE.relist("030")'));assert.ok(run('VILLAGE.list("030","referral")'));
 run('S.time=VILLAGE.home("030").listing.ready;VILLAGE.tick();');assert.ok(run('h.listing.offers.every(c=>!oldNames.includes(c.n))'));
 run('S.time+=30*1440;VILLAGE.tick();');assert.equal(run('h.resident'),undefined);assert.equal(run('S.money'),run('m'));
});
test('Erst unterschriebener Mietvertrag erzeugt Einzug und wöchentliche Zahlungen, ohne Doppelzahlung nach Laden',()=>{
 listed();run('var h=VILLAGE.home("030"),c=h.listing.offers[0],m=S.money;c.kind="rent";c.price=c.cur.rent;VILLAGE.accept("030",c.id);');
 assert.equal(run('h.resident'),undefined);assert.ok(run('VILLAGE.sign("030",c.id)'));assert.equal(run('VILLAGE.sign("030",c.id)'),false);
 assert.equal(run('S.money'),run('m'));assert.equal(run('h.status'),'rented');
 run('S.time=h.contract.next-.1;VILLAGE.tick();');assert.equal(run('S.money'),run('m'));
 run('S.time+=.1;VILLAGE.tick();var first=S.money;VILLAGE.tick();S=JSON.parse(JSON.stringify(S));VILLAGE.tick();');assert.equal(run('S.money'),run('first'));
 assert.ok(run('S.money>m'));run('S.time=VILLAGE.home("030").contract.next;VILLAGE.tick();');assert.ok(run('S.money>first'));
});
test('Kaufvertrag bezahlt genau einmal; verkaufte Häuser bleiben bewohnt und werfen keine Miete ab',()=>{
 listed();run('var h=VILLAGE.home("030"),c=h.listing.offers[1];c.kind="buy";c.price=c.cur.buy;VILLAGE.accept("030",c.id);var m=S.money;');
 assert.ok(run('VILLAGE.sign("030",c.id)'));assert.equal(run('S.money-m'),run('c.price'));assert.equal(run('h.status'),'sold');
 run('var after=S.money;S.time+=90*1440;VILLAGE.tick();S=JSON.parse(JSON.stringify(S));VILLAGE.tick();');assert.equal(run('S.money'),run('after'));
 assert.equal(run('VILLAGE.buy("030")'),false);assert.ok(run('VILLAGE.home("030").resident'));
});
test('Siedlungsaussparung öffnet kein Seewasser; vorhandene Dekoration blockiert Neubau und bleibt erhalten',()=>{
 run('fresh(10);var parts=VILLAGE.clipLock([-400,21,400,400]);');
 assert.ok(run('!parts.some(q=>-62>q[0]&&-62<q[2]&&43>q[1]&&43<q[3])'));
 assert.ok(run('parts.some(q=>14>q[0]&&14<q[2]&&48>q[1]&&48<q[3])'));
 run('S.farm.stats.deliv=6;VILLAGE.expand();var p=VILLAGE.plot("030");var obj=farmAddObj({t:"deco",k:"flowers",x:p.x+16,z:p.z+16});');
 assert.ok(run('VILLAGE.obstruction(p)'));assert.equal(run('VILLAGE.buy("030")'),false);assert.ok(run('S.farm.objs.includes(obj)'));
});
test('Hausvorbild bleibt reproduzierbar und erhält mehrere Farbvarianten',()=>{
 run('var a=RENT.homeMesh(0).v,b=RENT.homeMesh(1).v,c=RENT.homeMesh(0).v;');
 assert.equal(run('JSON.stringify(a)'),run('JSON.stringify(c)'));assert.notEqual(run('JSON.stringify(a)'),run('JSON.stringify(b)'));
});
test('v433: Nachfrage schwankt (keine/eine/viele), Seeblick und ruhige Lage ziehen mehr an',()=>{
 run('fresh(10);S.farm.stats.deliv=6;VILLAGE.expand();var D0=VILLAGE_DATA;');
 const d=run('JSON.stringify(D0.plots.map(p=>p.id).map(id=>VILLAGE.demand(id).score))');
 const sc=JSON.parse(d);assert.ok(Math.max(...sc)-Math.min(...sc)>1,'unterschiedliche Nachfrage '+d);
 built();run('VILLAGE.list("030","online");');const counts=new Set();for(let i=0;i<40;i++){run('S.time+='+(i*137+11)+';var R=erbeRng('+(i*97+5)+');');counts.add(run('VILLAGE.offers("030",null).length'));}
 assert.ok(counts.has(0)||counts.size>=3,'Anzahl streut: '+[...counts]);assert.ok(counts.size>=3,'mehrere verschiedene Anzahlen '+[...counts]);
});
test('v433: Verhandlung dauert Tage, Antwort kommt verzögert; im Budget gibt es Zusage mit Gewinn über Richtwert',()=>{
 listed();run('var h=VILLAGE.home("030"),c=h.listing.offers[0];c.kind="rent";c.cur={rent:1200,buy:250000};c.price=1200;c.rentBudget=1800;c.pat=4;var ask=1700;');
 assert.ok(run('VILLAGE.negotiate("030",c.id,"rent",ask)'));assert.ok(run('c.pending'));assert.equal(run('VILLAGE.negotiate("030",c.id,"rent",1750)'),false);
 run('VILLAGE.tick();');assert.ok(run('c.pending'),'sofort keine Antwort');assert.ok(!run('c.agreed'));
 run('S.time+=2*1440;VILLAGE.tick();');assert.ok(!run('c.pending'));assert.equal(run('c.agreed.price'),1700);assert.ok(1700>run('VILLAGE_DATA.houses.holz.rent'),'Gewinn über Richtwert');
});
test('v433: zu hohe Forderung führt zu Gegenangebot, Geduld endet mit Rückzug',()=>{
 listed();run('var h=VILLAGE.home("030"),c=h.listing.offers[0];c.kind="rent";c.cur={rent:1200,buy:250000};c.price=1200;c.rentBudget=1500;c.pat=3;');
 run('VILLAGE.negotiate("030",c.id,"rent",2000);S.time+=2*1440;VILLAGE.tick();');assert.ok(!run('c.agreed')&&!run('c.declined'));
 assert.ok(run('c.price>1200&&c.price<=1500'),'Gegenangebot '+run('c.price'));
 run('VILLAGE.negotiate("030",c.id,"rent",2000);S.time+=2*1440;VILLAGE.tick();VILLAGE.negotiate("030",c.id,"rent",2000);S.time+=2*1440;VILLAGE.tick();');assert.ok(run('c.declined'));
});
test('v433: Gegenangebot direkt annehmen; Rückkauf nach Verkauf mit Aufschlag',()=>{
 listed();run('var h=VILLAGE.home("030"),c=h.listing.offers[0];c.kind="buy";c.price=c.cur.buy;');assert.ok(run('VILLAGE.accept("030",c.id)'));assert.ok(run('VILLAGE.sign("030",c.id)'));
 assert.equal(run('VILLAGE.buyback("030")'),false,'erst nach einem Tag');
 const sold=run('h.contract.price');run('S.time+=2*1440;var m=S.money,bp=VILLAGE.buybackPrice("030");');assert.ok(run('bp>h.contract.price*1.1&&bp<=h.contract.price*1.2+1'));run('S.time+=200*1440;');assert.ok(run('VILLAGE.buybackPrice("030")<=h.contract.price*1.2+1'),'höchstens 20 %');run('S.time-=200*1440;');
 assert.ok(run('VILLAGE.buyback("030")'));assert.equal(run('m-S.money'),run('bp'));assert.equal(run('h.status'),'ready');assert.equal(run('h.resident'),undefined);assert.equal(run('h.contract'),undefined);
 assert.equal(run('VILLAGE.buyback("030")'),false);assert.ok(run('VILLAGE.list("030","referral")'));
});
console.log('Seeblick: '+count+' Integrationsgruppen bestanden.');
