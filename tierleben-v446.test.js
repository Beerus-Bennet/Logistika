/* v446: Alle bewegten Tiergruppen, Stillstand, Gelenkgeometrie und Fellvielfalt. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','farmmodels.js','woodmodels.js','animalmotion.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);
const H=vm.runInContext('ANIMAL_MOTION',C),FM=vm.runInContext('FM',C),FWM=vm.runInContext('FWM',C);
let meshes=0;const R={mesh:b=>{meshes++;return {v:b.v};},node:(mesh,o={})=>Object.assign({mesh,x:0,y:0,z:0,rx:0,sx:1,children:[]},o),addChild:(p,n)=>{p.children.push(n);return n;}};
let count=0;
for(const k of ['deer','hare','squirrel','boar','fox','hedgehog','heron','dog','cat','goat','chicken','cow','pig','sheep','beef']){
 const root=R.node(null),farm=['chicken','cow','pig','sheep','beef'].includes(k),fn=farm?FM[k]:FWM[k],parts=[],body=k==='sheep'?fn(0,false,parts):fn(false,parts),full=k==='sheep'?fn(0,false):fn(false);
 assert.equal(parts.length,k==='heron'||k==='chicken'?2:4,k+' Gelenke');
 assert.equal(body.v.length+parts.reduce((n,p)=>n+p.mesh.v.length,0),full.v.length,k+' vollständiges Modell, keine doppelten starren Beine');
 const g=H.mount(R,root,k,k,p=>k==='sheep'?fn(0,false,p):fn(false,p)),before=meshes,angles=new Set();
 for(let f=0;f<240;f++){
  H.step(g,.003,1/60);angles.add(g.legs[0].node.rx.toFixed(3));
  assert.equal(root.y,0,k+' kein Ganzkörperhüpfen');
  for(const leg of g.legs){assert.ok(Number.isFinite(leg.node.rx)&&Number.isFinite(leg.node.y));
   let bottom=Infinity;const co=Math.cos(leg.node.rx),si=Math.sin(leg.node.rx),v=leg.node.mesh.v;
   for(let i=0;i<v.length;i+=9)bottom=Math.min(bottom,leg.node.y+v[i+1]*co-v[i+2]*si);
   assert.ok(bottom>-.045,k+' Pfoten nicht im Boden versenkt');}
 }
 assert.ok(angles.size>10,k+' erkennbare Schritte');assert.equal(meshes,before,'Keine Netzarbeit im Schrittloop');
 for(let i=0;i<60;i++)H.step(g,.15,1/60);assert.equal(g.running,true,k+' längerer Fluchtschritt');assert.equal(meshes,before);

 const phase=g.phase;for(let i=0;i<120;i++)H.step(g,0,1/60);
 assert.equal(g.phase,phase,k+' im Stand kein Weiterlaufen');assert.equal(g.amount,0);
 for(const leg of g.legs){assert.ok(Math.abs(leg.node.rx)<1e-10);assert.equal(leg.node.y,leg.p[1]);}
 const prior=meshes,second=R.node(null);H.mount(R,second,k,k,p=>{throw Error('Cache nicht verwendet');});assert.equal(meshes,prior);
 H.mount(R,root,k,k,p=>{throw Error('Cache nicht verwendet');});assert.equal(root.children.length,parts.length,'Keine angesammelten Gelenke');count++;
}
let looks=0;
for(const [k,list] of Object.entries(H.LOOKS)){
 const seen=new Map();for(let i=0;i<10000;i++){const look=H.choose(k,(i+.5)/10000);seen.set(look,(seen.get(look)||0)+1);}
 for(const [look,name,weight] of list){assert.equal(seen.get(look),weight*100,k+' '+name+' Seltenheit');
  const root=R.node(null),g=H.wild(R,root,k,look),data=JSON.stringify(g.legs.map(l=>l.node.mesh.v));
  assert.ok(root.mesh.v.every(Number.isFinite));for(const l of g.legs)assert.ok(l.node.mesh.v.every(Number.isFinite));
  H.step(g,.01,.02);assert.equal(JSON.stringify(g.legs.map(l=>l.node.mesh.v)),data,'Fell bleibt während der Bewegung gleich');looks++;
 }
}
const albino=H.paint(FWM.squirrel(),'squirrel','albino').v,normal=FWM.squirrel().v;assert.equal(albino.length,normal.length);assert.notEqual(JSON.stringify(albino),JSON.stringify(normal));
let pink=0;for(let i=0;i<albino.length;i+=9)if(albino[i+6]>.5&&albino[i+7]<.45&&albino[i+8]>.25)pink++;assert.ok(pink>0,'Albino mit rosigen Augen statt bloß grauem Fell');
console.log(count+' Gelenkmodelle, '+looks+' gewichtete Fellvarianten, Bodenkontakt, Stillstand und begrenzte Renderressourcen geprüft.');

for(const k of ['chicken','cow','pig','sheep','beef'])for(const variant of [0,1,2])for(const shorn of (k==='sheep'?[false,true]:[false])){
 const parts=[],full=k==='sheep'?FM[k](variant,shorn):FM[k](variant),body=k==='sheep'?FM[k](variant,shorn,parts):FM[k](variant,parts);
 assert.equal(body.v.length+parts.reduce((n,p)=>n+p.mesh.v.length,0),full.v.length,k+' alternative Farbe/Schur vollständig');assert.ok(body.v.every(Number.isFinite));
}
console.log('Alle Stalltier-Farben sowie bewollte/geschorene Schafe als Gelenkmodelle geprüft.');
