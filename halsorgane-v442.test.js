/* v442: Halsgeometrie, echte Vorschauen und freie Lungenflügel. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);const H=vm.runInContext('HUNT',C);
let samples=0;
for(const k of ['hirsch','keiler','fasan']){
 for(const O of H.NORG[k]){
  const m=H._neckMesh(k,O),p=H._neckPreview(k,O);
  assert.equal(H._neckMesh(k,O),m,'Geometrie wiederverwenden');assert.equal(p.v.length,m.v.length,'Vorschau enthält exakt dasselbe Modell');
  assert.ok(m.v.every(Number.isFinite)&&p.v.every(Number.isFinite));assert.ok(m.v.length/27<1500,'Modellbudget');
  const lo=[Infinity,Infinity,Infinity],hi=lo.map(()=>-Infinity);
  for(let i=0;i<m.v.length;i+=9)for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],m.v[i+a]);hi[a]=Math.max(hi[a],m.v[i+a]);}
  const scale=2/Math.max(...hi.map((v,a)=>v-lo[a]));
  for(let i=0;i<m.v.length;i+=9)for(let a=0;a<3;a++)assert.ok(Math.abs(p.v[i+a]-(m.v[i+a]-(lo[a]+hi[a])/2)*scale)<2e-6,'Keine Ersatzform im Bildchen');
 }
 // Lebende Haltungen: Hirsch bis Äsen (2,55 - 0,35), Keiler bis Wühlen,
 // Fasan bis Picken; zusätzlich seitlich gedrehter Hals.
 const poses=k==='hirsch'?[-.55,-.35,.1,.65,2.2]:k==='keiler'?[-.7,-.55,0,.2]:[-.2,0,.4,.7];
 for(const rx of poses)for(const ry of [-.4,0,.4])for(const id of ['luftroehre','speiseroehre']){
  const m=H._neckMesh(k,H.NORG[k].find(o=>o.id===id));
  const points=new Map();for(let i=0;i<m.v.length;i+=9){const p=m.v.slice(i,i+3);points.set(p.map(v=>v.toFixed(6)).join(),p);}
  for(const p of points.values()){
   const q=H.rot(p,rx,ry,0).map((v,a)=>v+H.SP[k].neckP[a]);
   for(const lid of ['lungeL','lungeR']){const sg=H._organSegment(k,lid,[q[0]+1,q[1],q[2]],[-1,0,0]);assert.ok(!sg||sg[0]>=1-1e-5||sg[1]<=1+1e-5,`${k}/${id}: Röhrenpunkt im ${lid}, Haltung ${rx}/${ry}`);samples++;}
  }
 }
 const spine=H.NORG[k].find(o=>o.id==='hwirbel');assert.equal(spine.beads,k==='fasan'?9:7);
 console.log('ok '+k+': gemeinsame Modellvorschau, Wirbelgliederung, freie Lungenflügel');
}
console.log(samples+' Röhrenpunkt-/Lungenprüfungen bestanden.');

const old={anatomy367:true,zone:'hals',lo:[3,1,.3],ld:[-1,0,0],stop:5,org:[{id:'luftroehre',n:'Luftröhre',v:2}],dmg:100,medal:3,pose:{nrx:2.2,nry:0,legs:[]}},before=JSON.stringify(old),view=H._xrShot('hirsch',old);
assert.equal(JSON.stringify(old),before);assert.equal(view.dmg,100);assert.equal(view.medal,3);assert.equal(view.anatomyUpdated,true);
console.log('ok historische Aufnahme: Darstellung berichtigt, Wirkung/Medaille und gespeicherter Datensatz erhalten.');
