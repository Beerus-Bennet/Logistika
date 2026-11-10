/* v328: Echte Lager-, Objekt-, Bauzonen- und Sammlungslogik gemeinsam prüfen.
   node trophy-exhibits-v328.test.js */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const C={console,Math,Date,performance:{now:()=>0},navigator:{},S:{time:300,money:12345,farm:{seq:1,objs:[],trees:[],inv:{},cap:{troph:1},stage:1,areas:{wald:true,saege:true,altwald:true,see:true},stats:{},snd:false}},
  FWM:{springHeightW:()=>0},save(){},farmSyncScene(){},toast(){},setTimeout(){}};
C.window=C;vm.createContext(C);
vm.runInContext('function clamp(v,a,b){return Math.max(a,Math.min(b,v));}',C);
for(const f of ['data.js','farmdata.js','erbedata.js','fishdata.js','farm.js','erbe.js','gl3d.js','hunt.js','exhibits.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),C,{filename:f});
const run=s=>vm.runInContext(s,C),json=x=>JSON.parse(JSON.stringify(x));
const H=run('HUNT'),T=run('TROPHIES');H.collSync();let n=0;
function test(name,fn){fn();console.log('ok '+(++n)+' '+name);}
const add=(k,i)=>{const r={u:'owned'+i,k,m:3,s:.8,vr:i%6,gn:json(H.genes(k,.8,77+i)),zone:'lunge',dm:211,t:200};H._v200.st().coll.push(r);C.r=r;run('farmAdd(HUNT.trophyId(r.k,r.m),1,3)');return r;};
const r=add('fasan',1),other=add('fasan',2),deer=add('hirsch',3),boar=add('keiler',4);
let deployed,saved;
test('Bestand und frühere Ehrenplätze bleiben erhalten; mehr als drei Favoriten möglich',()=>{
  const extra=add('fasan',5);
  for(const p of [r,other,deer,boar,extra])assert.ok(H._v200.pinRec(p.u));
  assert.equal(H.collSync().filter(r=>r.pin).length,5);
  assert.ok(H._v200.pinRec(r.u));assert.ok(!r.pin);
});
test('Aufstellen bewegt genau dieses Stück aus dem Lager auf seinen eigenen Sockel, ohne Kosten',()=>{
  const before=run('farmInv("tro_fasan_3")'),money=C.S.money; saved=json(r);
  deployed=T.place(r.u,3,12,3);
  assert.ok(deployed && deployed.t==='trophy');assert.equal(deployed.r,3);
  assert.equal(run('farmInv("tro_fasan_3")'),before-1);assert.equal(C.S.money,money);
  assert.deepEqual(json(deployed.specimen),saved);assert.deepEqual(json(T.record(deployed)),saved);
  assert.equal(H.collSync().length,5);assert.equal(T.placed(r.u),deployed);
  C.obj=deployed;assert.ok(run('farmObjKnown(obj)'));
  assert.ok(!T.place(r.u,7,12,0),'Kein doppeltes Aufstellen');
  assert.equal(run('farmInv("tro_fasan_3")'),before-1);
});
test('Belegte Fläche und Hofweg blockieren das Aufstellen ohne Warenverlust',()=>{
  const inventory=json(C.S.farm.inv);
  assert.ok(!T.place(deer.u,3,12,0));assert.ok(!T.place(deer.u,20,12,0));
  assert.ok(!T.place(deer.u,500,500,0));assert.ok(!T.place(deer.u,3.5,12,0));
  assert.deepEqual(json(C.S.farm.inv),inventory);
  assert.ok(T.canPlace(deployed.x,deployed.z,...deployed.sz,deployed.id),'Eigenes Objekt sperrt Verschieben nicht');
});
test('Der Hofwert zählt das Präparat im Lager und auf dem Sockel genau einmal',()=>{
  const value=run('farmValue()'),money=C.S.money;
  assert.ok(T.place(deer.u,8,12,1));assert.equal(run('farmValue()'),value);
  assert.ok(T.store(deer.u));assert.equal(run('farmValue()'),value);assert.equal(C.S.money,money);
});
test('Freie Landschaft möglich; gesperrter Wald, Wasser, Wege, Bäume, Hindernisse und Hänge bleiben frei',()=>{
  assert.ok(T.canPlace(-64,-9,2,2),'Freie Wildwiese abseits der bisherigen Hofbauzonen');
  C.S.farm.areas.wald=false;assert.ok(!T.canPlace(-64,-9,2,2));C.S.farm.areas.wald=true;
  assert.ok(!T.canPlace(50,13,2,2),'Teich');assert.ok(!T.canPlace(30,64,2,2),'See');
  assert.ok(!T.canPlace(-25,-44,2,2),'Waldweg');
  C.S.farm.trees=[{x:-80,z:-25}];assert.ok(!T.canPlace(-64,-9,2,2));C.S.farm.trees=[];
  C.FWM.springHeightW=()=>.3;assert.ok(!T.canPlace(-64,-9,2,2));C.FWM.springHeightW=()=>0;
  C.navLive=()=>({blk:[1],cost:[1]});C.navIn=()=>true;C.navIdx=()=>0;
  assert.ok(!T.canPlace(-64,-9,2,2),'Hinderniskarte');delete C.navLive;
});
test('Speichern/Laden und selbst fehlender alter Sammlungsdatensatz erhalten dieselbe Trophäe',()=>{
  const model=H.trophyBuild(r).v;
  C.S=json(C.S);H._v200.st().coll=H._v200.st().coll.filter(x=>x.u!==r.u);
  const records=H.collSync(),restored=records.find(x=>x.u===r.u);
  assert.deepEqual(json(restored),saved);assert.deepEqual(H.trophyBuild(restored).v,model);
  assert.equal(records.length,5);assert.equal(T.objects().length,1);
  assert.equal(H._v200.sellRec(r.u),0,'Ausgestelltes Stück steht nicht zum Verkauf');
});
test('Lagerentnahme derselben Medaille entfernt ein gelagertes Stück, niemals das ausgestellte',()=>{
  run('farmTake("tro_fasan_3",1)');const records=H.collSync();
  assert.ok(records.some(x=>x.u===r.u));assert.equal(records.length,4);
});
test('Volles Lager blockiert Einlagern; nach Freimachen genau einmal zurück, Daten und Geld erhalten',()=>{
  run('farmAdd("tro_fasan_3",farmRoom("tro_fasan_3"),3)');H.collSync();
  assert.equal(run('farmRoom("tro_fasan_3")'),0);assert.equal(T.store(r.u),false);
  assert.ok(T.placed(r.u));const full=run('farmInv("tro_fasan_3")');
  run('farmTake("tro_fasan_3",1)');H.collSync();
  assert.ok(T.store(r.u));assert.equal(T.placed(r.u),null);
  assert.equal(run('farmInv("tro_fasan_3")'),full);
  assert.deepEqual(json(H.collSync().find(x=>x.u===r.u)),saved);
  assert.equal(T.store(r.u),false);assert.equal(C.S.money,12345);
});
console.log(n+' Prüfgruppen bestanden.');
