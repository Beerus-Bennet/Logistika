/* v315: Echte Kopfpräparate und ruhige Endbewegung prüfen. node hunt-presentation-v315.test.js */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const { harness } = require('./hunt-v307.test.js');
const source = fs.readFileSync(path.join(__dirname, 'hunt.js'), 'utf8');
const C = { calls: [] }; C.window = C; vm.createContext(C);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'gl3d.js'), 'utf8'), C);
const probes = source
  .replace('function mountShoulderInto(b, k) {', 'function mountShoulderInto(b, k) { window.calls.push({part:"shoulder",k});')
  .replace('function deerHeadInto(b, P_, sc, vr, F, noAnt, resting) {', 'function deerHeadInto(b, P_, sc, vr, F, noAnt, resting) { window.calls.push({part:"head",k:"hirsch",P:P_,sc,vr,F,noAnt,resting,M:Array.from(b.M)});')
  .replace('function boarHeadInto(b, sc, cm, resting) {', 'function boarHeadInto(b, sc, cm, resting) { window.calls.push({part:"head",k:"keiler",sc,cm,resting,M:Array.from(b.M)});');
vm.runInContext(probes + ';this.H=HUNT;', C);
const H = C.H, json = x => JSON.parse(JSON.stringify(x));
let mounts = 0;
for (const k of ['hirsch','keiler']) for (const m of [1,2,3,4]) for (const coat of ['normal','weiss','schecke']) {
  const score = [0,.42,.62,.8,.95][m], gn = json(H.genes(k,score,77)); gn.c = coat;
  const r = {k,m,s:score,vr:3,gn}, saved = json(r), value = H.valueOf(r);
  C.calls.length=0; const model = H.trophyBuild(r), parts=json(C.calls), head=parts.find(p=>p.part==='head');
  assert.equal(parts.filter(p=>p.part==='shoulder').length,1,'Durchgehender Schulteransatz');
  assert.ok(head && head.k===k && !head.resting,'Präparat verwendet echten Tierkopf mit offenen Glasaugen');
  if(k==='hirsch') {
    assert.equal(head.P,H.traits(k,score,gn).P); assert.ok(!head.noAnt && !head.F.skull,'Kopf samt eigenem Geweih, kein Schädel');
    assert.equal(head.vr,r.vr);
  } else assert.equal(head.cm,H.traits(k,score,gn).cm,'Waffenlänge des erlegten Keilers');
  // Alle drei Achsen des tatsächlichen Kopftransforms haben denselben Maßstab.
  const s=[0,4,8].map(i=>Math.hypot(head.M[i],head.M[i+1],head.M[i+2]));
  assert.ok(s.every(v=>Math.abs(v-1)<1e-6),'Kopf weder gestreckt noch gestaucht');
  assert.ok(model.v.every(Number.isFinite) && model.v.length/27<6500);
  assert.deepEqual(json(r),saved);assert.equal(H.valueOf(r),value); mounts++;
}
// Die Tafel verwendet für alle Stücke denselben Maßstab und verteilt den Platz nach ihrer echten Breite.
const transforms=[], original=vm.runInContext('G3.MB.prototype.merge',C);
C.captureScale=t=>transforms.push(t.s);
vm.runInContext('this.originalMerge=G3.MB.prototype.merge;G3.MB.prototype.merge=function(b,t){window.captureScale(t);return window.originalMerge.call(this,b,t);}',C);
const lineup=['keiler','hirsch','keiler'].map((k,i)=>({k,m:3,s:.88,vr:i,gn:json(H.genes(k,.88,77+i))}));
H._v200.showMesh(lineup);
assert.equal(transforms.length,3);assert.ok(transforms.every(s=>s===transforms[0]),'Gleicher Maßstab für die Kopfpräparate');
C.originalMerge=original;vm.runInContext('G3.MB.prototype.merge=window.originalMerge;',C);
let poses=0;
for(const k of ['hirsch','keiler']) for(const side of [-1,1]) for(const score of [.15,.95]) {
  const q=harness(), A=q.animal(k,score,52), saved=json(A.gn);
  q.Q.stepAnimal(A,1/60,0); const open=A.head.mesh;
  A.side=side;A.st='fall';q.Q.fallStart(A,.8);
  assert.notEqual(A.head.mesh,open,'Erlegtes Tier erhält geschlossene Lider');
  const resting=A.head.mesh;
  // Gegen die gespeicherte Endpose messen: auch die Beschleunigung läuft ohne Knick aus.
  const d=q.H._dead(A).legs;
  for(const epsilon of [.001,.0005]) {
    A.t=A.fT*epsilon;
    for(let i=0;i<d.length;i++) q.Q.deadLeg(A,i).forEach((v,j)=>assert.ok(Math.abs(v-d[i][j])<.1*epsilon**2,'Weiches Auslaufen der Gelenke'));
  }
  A.t=A.fT;
  for(let t=0;t<2;t+=1/60){q.X.t=t;q.Q.stepAnimal(A,1/60,t);if(A.st==='dead')break;}
  assert.equal(A.st,'dead');assert.equal(A.head.mesh,resting,'Keine neue Kopfgeometrie pro Bild');
  q.Q.build(A);assert.equal(A.head.mesh,resting,'Neuaufbau behält geschlossene Lider und benutzt den Cache');
  assert.ok(q.minY(A.node)>=-.012*A.s,'Haut und Läufe bleiben über dem Boden');
  assert.deepEqual(json(A.gn),saved);poses++;
}
console.log(`OK: ${mounts} unverzerrte Kopfpräparate mit unveränderten Daten/Werten; ${poses} Seitenlagen mit ruhigen Gelenken, geschlossenen Lidern und stabilen Modellknoten.`);
