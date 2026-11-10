/* v343: Straßen, Grundstücke und gespeicherte Bewohnerabläufe.
   Ohne Pakete: node village-life-v343.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js','villagedata.js','places.js','map.js','game.js','farm.js','erbe.js','village.js','gl3d.js','farmmodels.js','woodmodels.js','rent.js','hunt.js','villagesite.js','villagepeople.js'])run(read(f));
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

// Die echte Wegsuche wird im Browser geprüft; hier geht es um Ablauf und Verkauf.
run(`navPath=(x,z,a,b)=>[[x,z],[a,b]];
 function prepared(){fresh(25);S.time=600;S.farm.areas.see=true;for(const h of Object.values(VILLAGE.state().homes))h.life={mailDay:0,shopDay:0};}
 function advance(kind,f=.5){const L=VILLAGE.home('000').life.active;let at=L.at;for(let i=L.index;i<L.steps.length;i++){if(L.steps[i].kind===kind){S.time=at+L.steps[i].duration*f;VILLAGE.tick();return;}at+=L.steps[i].duration;}throw Error(kind);}
`);
let count=0;const test=(n,f)=>{f();console.log('ok '+(++count)+' '+n);};
test('Einmündungen überdecken weder Hauptfahrbahn noch Mittelmarkierung',()=>{
 run('prepared();var m=VILLAGE_SITE.roadMesh(false),main=VILLAGE_SITE.main,edge=VILLAGE_SITE.edge,color=G3.col(0x7c7f86);');
 assert.ok(run('m.v.every((n,i)=>i%9!==2||Math.abs(m.v[i+4]-color[0])>.0001||Math.abs(m.v[i+5]-color[1])>.0001||Math.abs(m.v[i+6]-color[2])>.0001||n>=edge-.00001)'));
 run('var before=VILLAGE_SITE.roads.join();VILLAGE_SITE.roadMesh(true);VILLAGE_SITE.roadMesh(false);');assert.equal(run('VILLAGE_SITE.roads.join()'),run('before'));
 run('var r=FM.road(200,VILLAGE_SITE.mainBreaks(0));');assert.ok(run('r.v.every(Number.isFinite)'));
 assert.ok(run('VILLAGE_SITE.segments(true).every((s,i,a)=>s.every(p=>p[1]===VILLAGE_SITE.edge||a.some((q,j)=>i!==j&&((q[0][0]===q[1][0]&&p[0]===q[0][0]&&p[1]>=q[0][1]&&p[1]<=q[1][1])||(q[0][1]===q[1][1]&&p[1]===q[0][1]&&p[0]>=q[0][0]&&p[0]<=q[1][0])))))'),'Keine Straßenstummel außerhalb des verbundenen Netzes');
});
test('Grundstücke stoßen zusammen, teilen Grenzen einmal und haben echte Toröffnungen',()=>{
 run('prepared();var ps=VILLAGE_DATA.plots,plan=VILLAGE_SITE.fencePlan(ps);');
 assert.ok(run('ps.every((p,i)=>ps.slice(i+1).every(q=>{const a=VILLAGE_SITE.lot(p),b=VILLAGE_SITE.lot(q);return Math.min(a[2],b[2])-Math.max(a[0],b[0])<=.00001||Math.min(a[3],b[3])-Math.max(a[1],b[1])<=.00001;}))'));
 assert.equal(run('new Set(plan.lines.map(l=>JSON.stringify(l))).size'),run('plan.lines.length'));
 assert.ok(run('plan.lines.length<ps.length*5'));
 assert.ok(run('plan.gates.every(g=>!plan.lines.some(([a,b])=>a[0]===g.at[0]&&b[0]===g.at[0]&&Math.min(a[1],b[1])<g.at[1]&&Math.max(a[1],b[1])>g.at[1]))'));
 assert.ok(run('VILLAGE_SITE.fenceMesh(plan).v.every(Number.isFinite)'));
 run('var p=VILLAGE.plot("030"),g=VILLAGE_SITE.gate(p);var old=farmAddObj({t:"deco",k:"flowers",x:g[0]+p.side+FG/2,z:g[1]+2+FG/2});');assert.equal(run('VILLAGE.obstruction(p)'),run('old'));assert.ok(run('S.farm.objs.includes(old)'));
});
test('Haustürwege und Lieferlinien passieren auf beiden Straßenseiten die Toröffnung',()=>{
 run('prepared();');
 assert.ok(run('VILLAGE_DATA.plots.every(p=>{const g=VILLAGE_SITE.gate(p),d=VILLAGE.door(p),r=VILLAGE.route(p.id);return r[r.length-2][1]===g[1]&&d[1]===g[1]&&Math.abs(r[r.length-2][0]-p.road)<VILLAGE_SITE.front;})'));
});
test('Briefkastenablauf geht hin, öffnet/nimmt Post und kehrt erst danach heim',()=>{
 run('prepared();var old=S.money;');assert.ok(run('VILLAGE_PEOPLE.start("000","mail")'));assert.equal(run('VILLAGE_PEOPLE.start("000","mail")'),false);
 run('advance("mail",.6);');assert.equal(run('VILLAGE_PEOPLE.sample(VILLAGE.home("000").life.active).kind'),'mail');assert.equal(run('S.money'),run('old'));
 run('var L=VILLAGE.home("000").life.active;S.time=L.at+L.steps.slice(L.index).reduce((n,s)=>n+s.duration,0)+.01;VILLAGE.tick();');assert.equal(run('VILLAGE.home("000").life.active'),null);assert.equal(run('VILLAGE.home("000").life.mailDay'),0);
});
test('Hofbesuch enthält Schieben, beide Übergänge, Hin-/Rückfahrt und echten Einkauf',()=>{
 run('prepared();farmAdd("apfel",2,3);stallState(false).slots=[];stallPut(false,"apfel",1,stallBase("apfel",1,false));var old=S.money,stock=farmInv("apfel");');
 assert.ok(run('VILLAGE_PEOPLE.start("000","shop",false)'));assert.equal(run('VILLAGE.home("000").life.active.steps.filter(s=>s.kind==="mount").length'),2);
 assert.equal(run('VILLAGE.home("000").life.active.steps.filter(s=>s.kind==="dismount").length'),2);
 run('advance("buy",.9);');assert.ok(run('!stallState(false).slots[0].sold'));
 run('var L=VILLAGE.home("000").life.active;S.time=L.at+L.steps[L.index].duration+.001;VILLAGE.tick();');
 assert.equal(run('stallState(false).slots[0].buyer'),'Anna Köhler');assert.equal(run('S.money'),run('old'));assert.equal(run('farmInv("apfel")'),run('stock'));
 run('var sales=S.farm.stats.stallSold;S=JSON.parse(JSON.stringify(S));VILLAGE.tick();VILLAGE.tick();');assert.equal(run('S.farm.stats.stallSold'),run('sales'));
 run('var paid=stallTake(false,0),m=S.money;stallTake(false,0);');assert.ok(run('paid>0'));assert.equal(run('S.money'),run('m'));
});
test('Leere oder zu teure Angebote erzeugen weder Ware noch Geld',()=>{
 run('prepared();stallState(false).slots=[];farmAdd("apfel",1,3);stallPut(false,"apfel",1,99999);VILLAGE_PEOPLE.start("000","shop",false);advance("buy",1);');
 assert.ok(run('!stallState(false).slots[0].sold'));assert.equal(run('VILLAGE.home("000").life.active.bought'),false);
});
test('Fischmarkt erst nach Freigabe, gleicher Ablauf und keine zweite Warenentnahme',()=>{
 run('prepared();S.farm.areas.see=false;');assert.equal(run('VILLAGE_PEOPLE.start("000","shop",true)'),false);
 run('S.farm.areas.see=true;farmAddObj({t:"f_markt",x:51,z:39.5,area:"see"});farmAdd("barschfilet",1,3);stallState(true).slots=[];stallPut(true,"barschfilet",1,stallBase("barschfilet",1,true));var n=farmInv("barschfilet");');
 assert.ok(run('VILLAGE_PEOPLE.start("000","shop",true)'));run('advance("buy",1);');assert.ok(run('stallState(true).slots[0].sold'));assert.equal(run('farmInv("barschfilet")'),run('n'));
});
test('Zweiter Kunde wartet beim abgestellten Rad, bis der Tresen frei wird',()=>{
 run('prepared();VILLAGE_PEOPLE.start("000","shop",false);VILLAGE_PEOPLE.start("001","shop",false);var a=VILLAGE.home("000").life.active,b=VILLAGE.home("001").life.active;a.index=8;a.at=S.time;b.index=6;b.at=S.time-b.steps[6].duration;VILLAGE.tick();');
 assert.equal(run('b.waiting'),true);assert.equal(run('b.index'),6);
 run('S.time+=30;VILLAGE.tick();');assert.equal(run('b.waiting'),false);assert.ok(run('b.index>=7'));
});
test('Markt reserviert getrennte Radplätze und Fußwege umgehen das eigene Rad',()=>{
 run(`prepared();var plans=[];for(const id of ['000','001','002','003','004','005']){if(VILLAGE_PEOPLE.start(id,'shop',false))plans.push(VILLAGE.home(id).life.active.trip);}`);
 assert.ok(run('plans.length>=2'));
 assert.ok(run('plans.every((p,i)=>plans.slice(i+1).every(q=>Math.hypot(p.parking[0]-q.parking[0],p.parking[1]-q.parking[1])>=3.4))'));
 assert.ok(run('plans.every(p=>Math.hypot(p.parking[0]-p.counter[0],p.parking[1]-p.counter[1])>=3)'));
 assert.ok(run('plans.every(p=>Math.hypot(p.walk[0][0]-p.parking[0],p.walk[0][1]-p.parking[1])>.7)'));
 assert.ok(run(`plans.every(p=>p.walk.every((q,i)=>{if(!i)return true;const a=p.walk[i-1],n=Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.05);for(let j=0;j<=n;j++){const x=a[0]+(q[0]-a[0])*j/n-p.parking[0],z=a[1]+(q[1]-a[1])*j/n-p.parking[1];if(Math.abs(x*Math.cos(p.parkYaw)-z*Math.sin(p.parkYaw))<.65&&Math.abs(x*Math.sin(p.parkYaw)+z*Math.cos(p.parkYaw))<1.5)return false;}return true;}))`));
 run('var homes=VILLAGE.state().homes;for(const h of Object.values(homes))if(h.life&&h.life.active)h.life.active.v=344;VILLAGE_PEOPLE.tick();');
 assert.ok(run('Object.values(homes).every(h=>!h.life||!h.life.active)'));
});
test('Pedalumdrehung bleibt erreichbar: Kniegelenke und Füße folgen den Pedalen',()=>{
 for(let i=0;i<128;i++){
  const t=i/128*Math.PI*2,y=.3+.11*Math.cos(t)-.56,z=-.06+.11*Math.sin(t)+.22;
  C.targetY=y;C.targetZ=z;run('var leg={thigh:{},shin:{},foot:{}};VILLAGE_PEOPLE._legIK(leg,targetY,targetZ);');
  assert.ok(run('Object.values(leg).every(o=>Object.values(o).every(Number.isFinite))'));
  assert.ok(run('Math.abs(-.22*Math.cos(leg.thigh.rx)-.20*Math.cos(leg.thigh.rx+leg.shin.rx)-targetY)<.00001'));
  assert.ok(run('Math.abs(-.22*Math.sin(leg.thigh.rx)-.20*Math.sin(leg.thigh.rx+leg.shin.rx)-targetZ)<.00001'));
  assert.ok(run('Math.abs(leg.thigh.rx+leg.shin.rx+leg.foot.rx)<.00001'));
 }
});
test('Nach einem versetzten Markt kein Verkauf am früheren Standort',()=>{
 run('prepared();farmAdd("apfel",1,3);stallState(false).slots=[];stallPut(false,"apfel",1,stallBase("apfel",1,false));VILLAGE_PEOPLE.start("000","shop",false);stallObj(false).x+=5;advance("buy",1);');assert.ok(run('!stallState(false).slots[0].sold'));
});
test('Gebäude, Veranda und Zäune sperren; Haustürpunkt und Umwege bleiben frei',()=>{
 run('prepared();var p=VILLAGE.plot("000"),d=VILLAGE.door(p),a=VILLAGE.local(p,0,0),b=VILLAGE.local(p,.5,4);');
 assert.ok(run('VILLAGE_SITE.blocked(...a)&&VILLAGE_SITE.blocked(...b)'));assert.ok(run('!VILLAGE_SITE.blocked(...d)'));
 run('var r=VILLAGE_SITE.safePath([d,[d[0]+1,d[1]+1]]);');assert.ok(run('r&&r.slice(1).every((p,i)=>VILLAGE_SITE.clearLine(r[i],p))'));
 assert.notEqual(run('VILLAGE_SITE.homeMesh("holz",0).v.length'),run('VILLAGE_SITE.homeMesh("familie",0).v.length'));
 assert.notEqual(run('VILLAGE_SITE.construction("holz").v.length'),run('VILLAGE_SITE.construction("familie").v.length'));
});
console.log('Straßen und Bewohner: '+count+' Gruppen bestanden.');
