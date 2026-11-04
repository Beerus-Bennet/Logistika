/* v300: Seiten-/Rückenfehler der Figuren. Ohne Zusatzpakete:
   node office-clothes-v300.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8'),C={console};C.window=C;vm.createContext(C);
for(const f of ['avatar.js','gl3d.js','officekitchen.js'])vm.runInContext(read(f),C);
const names='lookOf,headMesh,hairMesh,hatMesh,beardMesh,headsetMesh,glassesMesh,torsoSize,torsoSurface,overallStraps,hoodMesh,torsoMesh,upperMesh,foreMesh';
vm.runInContext(read('officefp.js').replace('return { enter, leave,','return { qa:{'+names+'}, enter, leave,')+'\nthis.Q=OFFICE3D.qa;',C);const Q=C.Q;
const rgb=c=>[(c>>16&255)/255,(c>>8&255)/255,(c&255)/255],same=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-8);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function ray(v,D){
 let hit=0;const O=[0,.13,0];
 for(let i=0;i<v.length;i+=27){const A=v.slice(i,i+3),B=v.slice(i+9,i+12),E=v.slice(i+18,i+21),e1=sub(B,A),e2=sub(E,A),p=cross(D,e2),det=dot(e1,p);if(Math.abs(det)<1e-11)continue;
  const t=sub(O,A),u=dot(t,p)/det;if(u<-1e-7||u>1+1e-7)continue;const q=cross(t,e1),w=dot(D,q)/det;if(w<-1e-7||u+w>1+1e-7)continue;
  const d=dot(e2,q)/det;if(d>0)hit=Math.max(hit,d);
 }
 return hit;
}
const direction=(th,az)=>{const d=[Math.sin(th)*Math.sin(az),Math.cos(th)*1.06,Math.sin(th)*Math.cos(az)],l=Math.hypot(...d);return d.map(v=>v/l);};
let heads=0,hatRays=0;
for(const sex of [0,1])for(let hair=0;hair<8;hair++)for(let acc=0;acc<5;acc++)for(let beard=0;beard<4;beard++){
 const L=Q.lookOf({id:'clothes',role:'disp',av:{sex,hair,acc,beard}}),v=Q.headMesh(L).v;
 assert.ok(v.every(Number.isFinite)&&v.length/27<=6500,'Endlicher Kopf im Budget: '+JSON.stringify({sex,hair,acc,beard,n:v.length/27}));heads++;
 if((acc===2||acc===3)&&beard===0){
  const hat=Q.hatMesh(L).v,hairV=Q.hairMesh(L).v;
  for(let a=0;a<12;a++)for(const th of [.35,.65]){
   const D=direction(th,a/12*Math.PI*2),h=ray(hat,D),r=ray(hairV,D);
   assert.ok(h>r+.001,'Haar liegt unter der Mütze/Cap: '+JSON.stringify({sex,hair,acc,a,th,h,r}));hatRays++;
  }
  if(acc===3)for(let a=0;a<28;a++){
   const az=(a+.37)/28*Math.PI*2,abs=Math.min(az,2*Math.PI-az),t=Math.max(0,Math.min(1,(abs-.55)/1.75)),edge=.95+.35*t*t*(3-2*t),D=direction(edge-.08,az);
   assert.ok(ray(hat,D)>.118*1.15,'Mützenumschlag ohne fehlende Kacheln oder Löcher');hatRays++;
  }
 }
 const bv=Q.beardMesh(L).v;
 assert.ok(Array.from({length:bv.length/9},(_,i)=>bv[i*9+2]).every(z=>z>0),'Kein Bart am Hinterkopf/Nacken');
}
for(const beard of [1,3]){
 const L=Q.lookOf({id:'beard',role:'disp',av:{sex:1,beard}}),v=Q.beardMesh(L).v;
 for(const az of [-1.2,-.7,0,.7,1.2])for(const th of [2.10,2.35,2.48]){
  const D=direction(th,az),len=Math.hypot(Math.sin(th),Math.cos(th)*1.06);
  assert.ok(ray(v,D)>.118*len*1.005,'Bartfläche verschwindet nicht in der Kopfhaut');
 }
}
const headset=Q.headsetMesh().v;
for(let i=0;i<=32;i++){
 const a=-1.35+i/32*2.7,len=Math.hypot(Math.sin(a),Math.cos(a)*1.06),D=[Math.sin(a)/len,Math.cos(a)*1.06/len,0];
 assert.ok(ray(headset,D)>.118*len*1.16,'Kopfhörerbügel bildet einen durchgehenden Bogen');
}
assert.ok(Q.glassesMesh().v.every(Number.isFinite),'Brillenbügel mit endlichen Koordinaten');
function components(v){
 const parent=[],ids=new Map(),find=i=>parent[i]===i?i:parent[i]=find(parent[i]);
 const key=p=>p.map(x=>Math.round(x*1e6)).join(',');
 const id=p=>{const k=key(p);if(!ids.has(k)){ids.set(k,parent.length);parent.push(parent.length);}return ids.get(k);};
 for(let i=0;i<v.length;i+=27){const a=id(v.slice(i,i+3)),b=id(v.slice(i+9,i+12)),c=id(v.slice(i+18,i+21));parent[find(b)]=find(a);parent[find(c)]=find(a);}
 return new Set(parent.map((_,i)=>find(i))).size;
}
let outfits=0;
for(const sex of [0,1])for(let outfit=0;outfit<6;outfit++){
 const L=Q.lookOf({id:'fit',role:'disp',av:{sex,outfit}}),torso=Q.torsoMesh(L).v,upper=Q.upperMesh(L).v,fore=Q.foreMesh(L,-1).v;
 assert.ok([...torso,...upper,...fore].every(Number.isFinite));
 assert.ok(torso.length/27<1500&&upper.length/27<400&&fore.length/27<800,'Kleidungsbudget');
 assert.equal(components(upper),1,'Oberarm ist ein zusammenhängender Ärmel statt Kugel/Zylinder-Überlappung');
 assert.ok(L.sh-Q.torsoSize(L,.33)[0]<.018,'Schulteranschluss liegt ausreichend im Rumpf');
 if(outfit===5){
  const straps=Q.overallStraps(L).v;
  for(let i=0;i<straps.length;i+=9){const p=straps.slice(i,i+3);
   if(p[1]>=.35)assert.ok(Math.abs(p[0])>=.048,'Kein Trägerbalken über dem Hals');
   if(p[1]<=.36){const z=Q.torsoSurface(L,p[0],p[1],Math.sign(p[2]),0)[2];assert.ok(Math.abs(p[2]-z)<.0021,'Träger folgt der Körperoberfläche');}
   else assert.ok(p[1]-.36<.002,'Träger liegt auf der Schulter');
  }
 }
 if(outfit===5||outfit===2){
  /* Auch Dreiecksmitten müssen außen liegen: breite Latz-/Westenflächen dürfen
     an abgeschrägten Rumpfecken weder versinken noch als Platte abstehen. */
  for(let i=0;i<torso.length;i+=27)if(same(torso.slice(i+6,i+9),rgb(L.oc))){
   const p=[0,1,2].map(k=>(torso[i+k]+torso[i+9+k]+torso[i+18+k])/3);
   if(p[1]<.36){const s=Math.sign(p[2]),z=Q.torsoSurface(L,p[0],p[1],s,0)[2],d=(p[2]-z)*s;assert.ok(d>.0008&&d<(outfit===2?.0041:.0021),'Latz/Weste liegt vollständig und eng am Hemd: '+JSON.stringify({sex,outfit,p,z,d}));}
  }
 }
 if(outfit===3){
  const hood=Q.hoodMesh(L).v;
  for(let i=0;i<hood.length;i+=9){const p=hood.slice(i,i+3);if(p[1]<.35&&p[2]<-.06){const z=Q.torsoSurface(L,p[0],p[1],-1,0)[2];assert.ok(z-p[2]<=.0231,'Kapuze bleibt am Rücken angelegt');}}
 }
 outfits++;
}
console.log('OK: '+heads+' Kopfkombinationen, '+hatRays+' Mützen-/Haar-Strahlproben, Bart vor den Ohren, durchgehender Kopfhörerbügel, '+outfits+' Outfits mit anliegenden Trägern und Westen, sichtbaren Latzflächen, angelegter Kapuze und durchgehenden Ärmeln.');
