/* v310: Ehrenplätze mit echten Präparaten prüfen; gespeicherte Merkmale bleiben erhalten.
   Ausführen: node trophy-layout-v310.test.js */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const C = { console, antlers: [] }; C.window = C; vm.createContext(C);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'gl3d.js'), 'utf8'), C);
const source = fs.readFileSync(path.join(__dirname, 'hunt.js'), 'utf8');
vm.runInContext(source.replace('function antlersInto(b, P, sc, vr, F) {',
  'function antlersInto(b, P, sc, vr, F) { if (F && F.skull) window.antlers.push({P,sc,vr,F});') + '\nthis.H = HUNT; this.G = G3;', C);
const { H, G } = C, json = v => JSON.parse(JSON.stringify(v));
const rec = (k, m, seed = 77, score = [0,.42,.62,.8,.95][m]) => ({ u: k + seed, k, m, s: score, vr: seed % 6, gn: json(H.genes(k, score, seed)), pin: 1, t: 90 });
function bounds(v) {
  const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
  for (let i = 0; i < v.length; i += 9) for (let j = 0; j < 3; j++) { min[j] = Math.min(min[j],v[i+j]); max[j] = Math.max(max[j],v[i+j]); }
  return { min, max };
}
let models = 0;
for (const k of ['hirsch','keiler','fasan']) for (const m of [1,2,3,4]) for (const seed of [0,77,4242]) {
  const r = rec(k,m,seed), saved = json(r), value = H.valueOf(r), traits = json(H.traits(k,r.s,r.gn));
  const a = H.trophyBuild(r).v, b = H.trophyBuild(json(r)).v;
  assert.ok(a.length && a.every(Number.isFinite), 'Gültiges Präparat ' + k);
  assert.deepEqual(a,b,'Dasselbe Stück nach JSON-Laden');
  assert.ok(a.length/27 < 6500,'Modellbudget');
  assert.deepEqual(json(r),saved,'Darstellung verändert keinen Trophäendatensatz');
  assert.equal(H.valueOf(r),value); assert.deepEqual(json(H.traits(k,r.s,r.gn)),traits);
  models++;
}
for (const k of ['hirsch','keiler','fasan']) assert.ok(H.trophyBuild({k,m:1,s:.42,old:2}).v.every(Number.isFinite),'Altbestand ohne Gene');
// Auch spezielle/ungerade Geweihe verwenden dieselben Enden wie das erlegte Tier.
for (const feature of ['weit','eng','ungerade','doppelaug','abnorm']) for (const side of [-1,1]) {
  const r=rec('hirsch',4,90001); r.gn.f=[feature]; r.gn.sd=side;
  H.trophyBuild(r); const a=C.antlers[C.antlers.length-1], T=H.traits('hirsch',r.s,r.gn), F=H._antF(r.gn);
  assert.equal(a.P,T.P); assert.equal(a.sc,H._m.qS(r.s)); assert.equal(a.vr,r.vr);
  for (const [k,v] of Object.entries(F)) assert.equal(a.F[k],v);
  assert.deepEqual(json(H._antEnds(a.P,a.sc,a.vr,a.F)),json(H._antEnds(T.P,H._m.qS(r.s),r.vr,F)));
}
// Tatsächliche zusammengeführte Präparate vermessen, nicht nur eine zweite Layoutformel.
const proto=G.MB.prototype, merge=proto.merge, placed=[];
proto.merge=function(mesh,t) { const start=this.v.length, out=merge.call(this,mesh,t); placed.push(bounds(this.v.slice(start))); return out; };
const large=['weit','ungerade','abnorm'].map((feature,i)=> {const r=rec('hirsch',4,4242+i);r.gn.f=[feature];r.gn.sd=i%2?1:-1;return r;});
const cases=[[],[large[0]],[rec('keiler',4),large[0]],[rec('fasan',4),large[1]],large,
  [rec('keiler',4),large[0],rec('keiler',3)],[large[1],rec('keiler',1),rec('fasan',4)],large.concat(rec('keiler',2))];
for (const records of cases) {
  placed.length=0; const saved=json(records), mesh=H._v200.showMesh(records);
  assert.equal(placed.length,Math.min(3,records.length)); assert.deepEqual(json(records),saved);
  assert.ok(mesh.v.every(Number.isFinite)); assert.ok(mesh.v.length/27<22000,'Tafelbudget');
  placed.forEach((p,i)=>{
    assert.ok(p.min[0]>=-1.2&&p.max[0]<=1.2,'Freier Abstand zu den Pfosten');
    assert.ok(p.min[1]>=.87&&p.max[1]<=2.11,'Ganzes Präparat auf der Rückwand, unter dem Dach');
    assert.ok(p.min[2]>=.03,'Keine Stangen durch die Rückwand');
    if(i) assert.ok(p.min[0]-placed[i-1].max[0]>.1,'Keine überlappenden Nachbarpräparate');
  });
}
proto.merge=merge;
console.log(`OK: ${models} Präparate, Altbestände, zehn Geweih-Sonderformen und acht Ehrenplatzbelegungen; Daten/Werte erhalten, kein Überlappen oder Durchragen.`);
