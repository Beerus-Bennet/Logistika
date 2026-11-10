/* v322: Büroausstattung, Bestandsschutz und erreichbare Fahrzeuge im echten Netz.
   Ohne Zusatzpakete: node office-value-v322.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,DECISIONS:{},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['data.js','places.js','map.js','game.js','offices.js'])run(read(f));
run(`toast=()=>{};save=()=>{};render=()=>{};showTab=()=>{};logMoney=()=>{};refreshPool=()=>{};phoneMsg=()=>{};perks=()=>({});tutTabHook=()=>{};
 S=Object.assign(newGame(),{stage:6,money:2e7,time:600,player:{company:'Test'},bases:[],fleet:[]});
 function bare(tier){return {id:'B',tier,node:'lanzhou',staff:[],vehicles:[],mood:82,deco:{floor:'beton',tint:'natur',wall:'weiss',kitchen:'keine',plants:[]}};}`);
const json=x=>JSON.parse(JSON.stringify(x));
// Gekaufte und alte, noch nicht eingerichtete Büros erhalten passende Ausstattung genau einmal.
for(let tier=0;tier<5;tier++){
 run(`var b=bare(${tier});S.bases=[b];`);
 const money=run('S.money');run('ensureOffices()');
 const once=run('JSON.stringify(b)');run('ensureOffices();S=JSON.parse(JSON.stringify(S));b=S.bases[0];ensureOffices();');
 assert.equal(run('JSON.stringify(b)'),once,'Wiederholtes Laden ist stabil');
 assert.equal(run('S.money'),money,'Enthaltene Einrichtung verursacht keine zweite Abbuchung');
 if(tier>=2){assert.notEqual(run('b.deco.floor'),'beton');assert.notEqual(run('b.deco.kitchen'),'keine');assert.ok(run('b.deco.plants.length')>=2);}
}
// Individuelle Beläge, Pflanzen und verschobene Möbel auch beim Laden/Upgrade erhalten.
for(const setup of ["b.deco.floor='parkett'","b.deco.plants=['olive']","b.deco.pos={desks:{0:[120,155]},plants:{},kitchen:null}"]){
 run(`b=bare(2);${setup};S.bases=[b];`);const d=json(run('b.deco'));run('ensureOffices()');
 const after=json(run('b.deco'));delete after.fitout322;delete after.pos;if(d.pos)after.pos=d.pos;
 const expected=json(d);if(!d.pos)delete expected.pos;
 assert.deepEqual(after,expected,'Bestehende individuelle Einrichtung bleibt erhalten');
}
run(`b=bare(1);decoOf(b);b.tier=2;decoOf(b);`);assert.equal(run('b.deco.kitchen'),'einbau','Unveränderte Standardausstattung wächst beim Ausbau mit');
// Der Screenshot: europäische Straßenflotte kann den Ladeort Lanzhou nicht erreichen.
run(`S.bases=[];S.fleet=[];S.orders=[];repoMemo.clear();
 var far=makeVehicle('v-scania');far.at='bbg';S.fleet.push(far);
 var o={id:'O',from:'lanzhou',to:'pvg',cargo:'pal',weight:484,pay:100000,deadline:S.time+20000,pick:makeAddr('lanzhou'),drop:makeAddr('pvg')};
 var v={legs:chainLegs(o,plan(o.from,o.to,o.cargo,o.weight,'cost','r').legs)};
 var leg=v.legs[0];`);
assert.equal(run('repoCost(far,leg,o,0).ok'),false);
assert.deepEqual(json(run('assignFor(v,o)')),[null],'Unerreichbares Fahrzeug wird nicht vorausgewählt');
assert.match(run('vehOptHTML({f:far,t:vType(far.type),rc:repoCost(far,leg,o,0)},0,true)'),/disabled/);
assert.doesNotMatch(run('vehOptHTML({f:far,t:vType(far.type),rc:repoCost(far,leg,o,0)},0,true)'),/class="vopt on/);
assert.match(run('missingHelpHTML(leg,o,0)'),/Fahrzeug in Lanzhou kaufen/,'Handlung bleibt trotz vorhandener ferner Flotte sichtbar');
// Ein Standort ermöglicht den lokalen Kauf für das dortige Netz; fremde Fahrzeuge werden nicht versetzt.
run(`b=bare(2);b.addr=makeAddr(b.node,'office');S.bases=[b];S.ah={on:true};openShopAtBase(b.id);`);
assert.equal(run('marketFocus.at'),'lanzhou');assert.equal(run('S.ah.on'),false);
assert.ok(run('marketFocus.ids.length')>0);
assert.ok(run('marketFocus.ids.every(id=>N[b.node].modes.includes(vType(id).mode))'));
assert.equal(run('far.at'),'bbg');
run(`var cash=S.money,local=acquire('v-scania',false,marketFocus.at,marketFocus.addr);assignVehicle(b.id,local.uid);`);
assert.equal(run('cash-S.money'),run("vType('v-scania').price"));
assert.equal(run('local.at'),'lanzhou');assert.ok(run('b.vehicles.includes(local.uid)'));
assert.equal(run('repoCost(local,leg,o,0).ok'),true);
assert.deepEqual(json(run('assignFor(v,o)')),[run('local.uid')]);assert.equal(run('far.at'),'bbg');
// Neue Ausstattung in jeder großen Büroklasse: endliche Raumgeometrie und genau ein Textur-Ursprung je Doppelmonitor.
for(const f of ['avatar.js','gl3d.js','officekitchen.js','officefp.js'])run(read(f));
for(const tier of [2,3,4]) {
 run(`b=bare(${tier});b.staff=Array.from({length:tierOf(b).desks},(_,i)=>({id:'P'+i}));`);
 for(let floor=0;floor<run('tierFloors(tierOf(b))');floor++){
  const room=run(`OFFICE3D.buildRoom(b,${floor})`);
  for(const k of ['st','shell','trim','glow'])assert.ok(room[k].v.every(Number.isFinite),'Endliche Raumgeometrie');
  const screens=Array.from(room.screens),primary=screens.filter(x=>!x.mirror),mirrors=screens.filter(x=>x.mirror);
  assert.equal(mirrors.length,primary.length);
  assert.ok(mirrors.every(x=>primary.some(p=>p.i===x.i)),'Zweitmonitor hat eine gemeinsame Texturquelle');
 }
}
console.log('OK: fünf Büroklassen, einmalige Ausstattung, individuelle Bestände/Ausbau, echte unerreichbare Europa-China-Anfahrt, lokaler Kauf zum normalen Preis und sechs Etagen mit gültigen Doppelmonitoren.');
