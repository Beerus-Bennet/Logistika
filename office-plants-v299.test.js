/* v299: Büropflanzen – Geometrie, offene Töpfe, Stammanschlüsse und Modellbudget.
   Ohne Zusatzpakete: node office-plants-v299.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8'),C={console};C.window=C;vm.createContext(C);
for(const f of ['avatar.js','gl3d.js'])vm.runInContext(read(f),C);
vm.runInContext(read('officefp.js').replace('return { enter, leave,','return { qa:{plant}, enter, leave,')+'\nthis.plant=OFFICE3D.qa.plant;this.G=G3;',C);
vm.runInContext(read('offices.js').match(/const PLANTS = \[[\s\S]*?\n\];/)[0]+'\nthis.plants=PLANTS;',C);
const rgb=c=>[(c>>16&255)/255,(c>>8&255)/255,(c&255)/255],same=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-7);
function toSegment(p,a,b){const v=b.map((x,i)=>x-a[i]),q=p.map((x,i)=>x-a[i]),d=v.reduce((n,x)=>n+x*x,0),t=Math.max(0,Math.min(1,q.reduce((n,x,i)=>n+x*v[i],0)/d));return Math.hypot(...q.map((x,i)=>x-t*v[i]));}
let cases=0;const budgets=[];
for(const it of C.plants)for(const [x,z] of [[0,0],[-5.6,4.08],[5.6,-3.1]]){
 const h=it.h*.055,pr=.14+it.h*.004,m=new C.G.MB(),traces=[],cyl=m.cyl;
 m.cyl=function(r0,r1,h,n,col,o){
  const colors={ficus:0x75533a,olive:0x81745b,monstera:0x487442};
  if(col===colors[it.id]||it.id==='palme'&&[0x6c8050,0x7c8e56,0x789653].includes(col)){
   const a=o||{},M=C.G.mul(C.G.ID(),this.M,C.G.trs(C.G.ID(),a.x||0,a.y||0,a.z||0,a.rx||0,a.ry||0,a.rz||0,1,1,1));
   const P=y=>[M[4]*y+M[12],M[5]*y+M[13],M[6]*y+M[14]];
   traces.push({a:P(0),b:P(h),r:Math.max(r0,r1)});
  }
  return cyl.call(this,r0,r1,h,n,col,o);
 };
 C.plant(m,x,z,h,pr,it);const raw=m.v,verts=Array.from({length:raw.length/9},(_,i)=>raw.slice(i*9,i*9+9));
 assert.ok(raw.every(Number.isFinite),'Endliche Positionen, Normalen und Farben: '+it.id);
 assert.ok(raw.length/27<=4500,'Mobilbudget je Pflanze: '+it.id);
 assert.ok(Math.min(...verts.map(v=>v[1]))>=-1e-6,'Topf steht auf dem Boden');
 assert.ok(Math.max(...verts.map(v=>v[1]))<=.34+h*1.1,'Pflanze passt unter die bisherige Raumhöhe');
 assert.ok(Math.max(...verts.map(v=>Math.hypot(v[0]-x,v[2]-z)))<Math.max(pr*1.07,h*.65),'Krone bleibt im bisherigen Größenbereich');
 const pot=it.id==='olive'?0x909995:it.id==='monstera'?0xe6dfd0:0xb97250;
 const body=verts.filter(v=>same(v.slice(6,9),rgb(pot))),lower=body.filter(v=>Math.abs(v[1]-.025)<1e-5),upper=body.filter(v=>Math.abs(v[1]-.30)<1e-5);
 const radius=v=>Math.hypot(v[0]-x,v[2]-z);
 assert.ok(lower.length&&upper.length&&Math.max(...upper.map(radius))>Math.max(...lower.map(radius))*1.25,'Topf wird nach oben breiter');
 const rim=verts.filter(v=>Math.abs(v[1]-.34)<1e-5).map(radius);
 assert.ok(rim.some(r=>Math.abs(r-pr*.88)<1e-5)&&rim.some(r=>Math.abs(r-pr*1.025)<1e-5),'Sichtbare innere und äußere Topfkante');
 assert.ok(verts.some(v=>Math.abs(v[1]-.305)<1e-5&&same(v.slice(6,9),rgb(0x493a29))),'Erde liegt tiefer als der Topfrand');
 if(traces.length){
  const connected=new Set(traces.map((s,i)=>Math.min(s.a[1],s.b[1])<.325?i:-1).filter(i=>i>=0));
  let added=true;while(added){added=false;traces.forEach((s,i)=>{
   if(connected.has(i))return;
   for(const j of connected){const q=traces[j],dist=Math.min(toSegment(s.a,q.a,q.b),toSegment(s.b,q.a,q.b),toSegment(q.a,s.a,s.b),toSegment(q.b,s.a,s.b));if(dist<s.r+q.r+.001){connected.add(i);added=true;break;}}
  });}
  assert.equal(connected.size,traces.length,'Sämtliche Stämme, Äste und Blattstiele sind mit der Erde verbunden: '+it.id);
 }else assert.ok(['gruenlilie','kaktus'].includes(it.id),'Bäumchen benötigen einen Stamm');
 if(it.id!=='kaktus'){
  const leaf=verts.filter(v=>v[1]>.34&&v[7]>v[6]*1.02&&v[7]>v[8]*1.02&&Math.abs(v[4])>.3);
  assert.ok(leaf.some(v=>v[4]>.3)&&leaf.some(v=>v[4]<-.3),'Blätter von oben und unten sichtbar: '+it.id);
 }
 const other=new C.G.MB();C.plant(other,x,z,h,pr,it);assert.equal(JSON.stringify(raw),JSON.stringify(other.v),'Gleicher Standort baut dieselbe Pflanze');
 assert.deepEqual(Array.from(m.M),Array.from(C.G.ID()),'Lokale Pflanzentransformation hinterlässt keine Verschiebung');
 if(!x&&!z)budgets.push(it.id+': '+raw.length/27);cases++;
}
const sample=()=>{const m=new C.G.MB();m.noise(.15,()=>m.tri([0,0,0],[1,0,0],[0,1,0],0x669944));return JSON.stringify(m.v);};
C.G.seed(193);const expected=sample();C.G.seed(193);const it=C.plants[2];C.plant(new C.G.MB(),0,0,it.h*.055,.14+it.h*.004,it);assert.equal(sample(),expected,'Pflanzen verbrauchen keinen Zufall anderer Modelle');
console.log('OK: '+cases+' Pflanzen-/Standortkombinationen, verwurzelte Astketten, offene und richtig verjüngte Töpfe, beidseitige Blätter, Größen-/Modellbudgets und deterministischer Aufbau.');
console.log('Dreiecke: '+budgets.join(' · '));
