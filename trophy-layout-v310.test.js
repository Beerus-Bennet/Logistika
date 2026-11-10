/* v328: Ganze Tiere auf runden Einzelsockeln prüfen; gespeicherte Merkmale bleiben erhalten.
   Ausführen: node trophy-layout-v310.test.js */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const C = { console, antlers: [] }; C.window = C; vm.createContext(C);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'gl3d.js'), 'utf8'), C);
const source = fs.readFileSync(path.join(__dirname, 'hunt.js'), 'utf8');
vm.runInContext(source.replace('function antlersInto(b, P, sc, vr, F) {',
  'function antlersInto(b, P, sc, vr, F) { window.antlers.push({P,sc,vr,F});') + '\nthis.H = HUNT; this.G = G3;', C);
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
  assert.ok(a.length/27 < 11000,'Modellbudget');
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
// Tatsächlich zusammengeführte Tiere vermessen: nicht nur die Sockelformel prüfen.
const proto=G.MB.prototype,merge=proto.merge;
let animals=0;
for(const k of ['hirsch','keiler','fasan']) for(const score of [.15,.95]) {
  let body=null,animalVertices=null;
  proto.merge=function(mesh,t) {
    const start=this.v.length,out=merge.call(this,mesh,t);
    if(t.y && Math.abs(t.x||0)<1 && mesh.v.length>50000){animalVertices=this.v.slice(start);body=bounds(animalVertices);}
    return out;
  };
  const r=rec(k,4,77,score),mesh=H.trophyBuild(r),B=mesh._stand;
  assert.ok(body,'Ganzes Tier wurde als ein Modell zusammengeführt');
  assert.ok(Math.abs(body.min[1]-.14)<1e-5,'Füße stehen auf der Sockeloberfläche');
  assert.ok(body.max[1]>.14+(k==='fasan'?.4:k==='keiler'?.6:1.5),'Vollständiger Körper mit artspezifischer Höhe');
  assert.ok(B.radius*2<B.size && B.height<=body.max[1]+1e-5,'Platzierungsmaße umschließen das Modell');
  if(k!=='fasan') {
    const feet=[];
    for(let i=0;i<animalVertices.length;i+=9)if(animalVertices[i+1]<.17)feet.push([animalVertices[i],animalVertices[i+2]]);
    const groups=[];
    for(const p of feet){let g=groups.find(g=>g.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<.08));if(!g)groups.push(g=[]);g.push(p);}
    assert.equal(groups.length,4,'Vier getrennte Hufe an ihren wirklichen Schulter-/Hüftansätzen');
  }
  for(let i=0;i<mesh.v.length;i+=9){
    assert.ok(Math.hypot(mesh.v[i],mesh.v[i+2])<=B.radius+.04,'Tier und kleine Metallplakette bleiben am eigenen Sockel');
    assert.ok(Math.abs(mesh.v[i])<B.size/2 && Math.abs(mesh.v[i+2])<B.size/2,'Das vollständige Modell passt in seine belegte Fläche');
  }
  animals++;
}
proto.merge=merge;
console.log(`OK: ${models} Ganzkörperpräparate, Altbestände, zehn Geweih-Sonderformen und ${animals} Bodenkontakt-/Sockelmessungen; Daten/Werte erhalten.`);
