/* v297: Tatsächliche Mesh-Anschlüsse und Wasserkontakt prüfen.
   node water-seams-v297.test.js */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['gl3d.js','farmmodels.js','bushes.js','woodmodels.js']) vm.runInContext(read(f), ctx);
const erbe = read('erbe.js'), start = erbe.indexOf('const FWORLD =');
vm.runInContext(erbe.slice(start, erbe.indexOf('\n};', start) + 3), ctx);
vm.runInContext(`const SPI=FWM.springInfo(FWORLD.creek,{w:1.5}),k=FWM.SPRING_FALL.S,
  ry=Math.atan2(-SPI.dir[1],SPI.dir[0])+Math.PI/2,c=Math.cos(ry),s=Math.sin(ry);
  FWM.setSpringFrame(SPI.C,ry,k);
  const world=(x,z)=>[SPI.C[0]+(x*c+z*s)*k,SPI.C[1]+(-x*s+z*c)*k];`,ctx);
const FWM = vm.runInContext('FWM',ctx), world = vm.runInContext('world',ctx);
const meshes = Object.fromEntries(['springRun','springCascades','springFall','springFoam','springRunFoam'].map(n=>[n,FWM[n]().v]));
const vertices = a => { const out=[]; for(let i=0;i<a.length;i+=9)out.push(a.slice(i,i+9));return out; };
const key = v => v.slice(0,3).map(n=>n.toFixed(8)).join(',');
const close = (a,b,label) => { assert.equal(a.length,b.length);a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-7,label+': '+i)); };
for (const [name,a] of Object.entries(meshes)) {
  assert.ok(a.length>0&&a.every(Number.isFinite),name+' ohne ungültige Koordinaten');
  assert.ok(a.length/27<5000,name+' im Modellbudget');
  for (const v of vertices(a)) assert.ok(Math.abs(Math.hypot(...v.slice(3,6))-1)<1e-7,'Normale normiert');
  // Beim Zeichnen mit Backface-Culling darf kein nach unten gewendeter Streifen verschwinden.
  if(name==='springRun'||name==='springCascades')for(let i=0;i<a.length;i+=27){
    const A=a.slice(i,i+3),B=a.slice(i+9,i+12),C=a.slice(i+18,i+21);
    assert.ok((B[2]-A[2])*(C[0]-A[0])-(B[0]-A[0])*(C[2]-A[2])>0,'Wasserfläche von oben sichtbar');
  }
}
const run = new Map(vertices(meshes.springRun).map(v=>[key(v),v]));
const casc = new Map(vertices(meshes.springCascades).map(v=>[key(v),v]));
let joins=0;
for(const [p,v] of casc)if(run.has(p)){
  close(v,run.get(p),'Kaskade/Bach: Position, Normale und Strömungsphase identisch');joins++;
}
assert.equal(joins,4*2*9,'Alle vier kleinen Fälle teilen oben und unten die vollständige Anschlusszeile');
const join=FWM.springFallJoin(), main=new Map(vertices(meshes.springFall).filter(v=>v[4]>0).map(v=>[key(v),v]));
let mainJoins=0;
for(const [p,v] of main)if(run.has(p)){
  const r=run.get(p);close(v.slice(0,6),r.slice(0,6),'Hauptfall/Bach: gemeinsamer Rand');
  assert.equal(v[6],0);close([join[0],v[7]*2-1,join[1]],r.slice(6),'Wasserkoordinaten am Materialwechsel');mainJoins++;
}
assert.equal(mainJoins,9,'Hauptfall über volle Breite angeschlossen');
let bedChecks=0;
for(const v of vertices(meshes.springCascades))if(Math.abs(v[7])<1e-8){
  const w=world(v[0],v[2]),ground=FWM.springHeightW(w[0],w[1]);
  assert.ok(ground<v[1]*1.5-0.01,'Bachbett bleibt unter der Kaskadenmitte');bedChecks++;
}
assert.ok(bedChecks>100);
assert.equal(FWM.SPRING_FALL.strands.length,0,'Seitenfälle vollständig entfernt');
assert.ok(!read('worldview.js').includes('fx("st",'),'Keine versteckten Nebenfall-Spritzer');
const I=FWM.springImpact(),foam=vertices(meshes.springFoam);
assert.ok(foam.every(v=>v[1]===I.foamY&&v[8]===-1),'Aufprallfläche liegt flach direkt über dem See');
assert.ok(I.foamY*1.5-FWM.SPR.waterY<0.012,'Keine schwebende Schaumfläche');
assert.ok(Math.min(...foam.map(v=>v[2]))<I.z-I.w*.6&&Math.max(...foam.map(v=>v[2]))>I.z+I.w*.6,'Schaum über die gesamte Fallbreite');
for(let a=0.02;a<=1;a+=0.02)assert.ok(FWM.springFallPath(a)[1]<=FWM.springFallPath(a-0.02)[1]+1e-12,'Fallbahn steigt nicht an');
const total=Object.values(meshes).reduce((n,a)=>n+a.length/27,0);
assert.ok(total<9000,'Gesamtes Wasser bleibt unter 9000 Dreiecken');
console.log(`OK: ${joins} gemeinsame Kaskadenpunkte, ${mainJoins} Hauptfall-Anschlüsse, ${bedChecks} Bachbettprüfungen, keine Nebenfälle, flacher See-Aufprall; ${total} Wasserdreiecke.`);
