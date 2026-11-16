/* v357: Trefferbild – Organlage, sichtbarer Trefferpunkt, Zoom ohne Knöpfe. node trefferbild-v357.test.js */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const C={console};C.window=C;vm.createContext(C);for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),C);
const run=s=>vm.runInContext(s,C);let n=0;const test=(t,fn)=>{fn();console.log('ok '+(++n)+' '+t);};
test('Herz liegt tief in der Brust und schaut unter der Lunge hervor (Hirsch, Keiler)',()=>{
 for(const k of ['hirsch','keiler']){C.k=k;run('var O=HUNT.ORG[k],h=O.find(o=>o.id==="herz"),l=O.find(o=>o.id==="lungeL");');
  assert.ok(run('h.c[1]<l.c[1]'),'Herz unter der Lungenmitte');
  assert.ok(run('(l.c[1]-l.r[1])-(h.c[1]-h.r[1])>=h.r[1]*0.9'),k+': mindestens knapp die halbe Herzhöhe liegt frei unter der Lunge');
  assert.ok(run('h.c[2]>l.c[2]'),'Herz vorn in der Brust');
  /* Zeichnung und Wertung gehören zusammen: gezeichnetes Herz liegt in der Herzzone */
  assert.ok(run('var Z=HUNT.SP[k].heart;Math.hypot(h.c[0]-Z.c[0],h.c[1]-Z.c[1],h.c[2]-Z.c[2])<Z.r*0.35'),k+': Herz in der Wertungszone');
  assert.ok(run('O.find(o=>o.id==="leber").c[2]<l.c[2]&&O.find(o=>o.t==="magen").c[2]<O.find(o=>o.id==="leber").c[2]&&O.find(o=>o.id==="darm").c[2]<O.find(o=>o.t==="magen").c[2]'),k+': Lunge → Leber → Magen → Gescheide von vorn nach hinten');
  assert.ok(run('O.find(o=>o.id==="niereL").c[1]>O.find(o=>o.t==="magen").c[1]'),'Nieren oben unter der Lende');
 }
});
test('Trefferpunkt liegt im gewerteten Organ, der Kanal endet am Ausschuss, jedes Organ ist benannt',()=>{
 run(`var R={nodes:[],mesh:b=>({b}),free(){},node:(m,o)=>Object.assign({mesh:m,ch:[]},o),addChild:(p,n)=>{p.ch.push(n);return n;}};
  function shot(k,id,zone){const gn=HUNT.genes(k,.7,3),A={k,s:1.1,score:.7,gn,T:HUNT.traits(k,.7,gn),vr:0},O=HUNT.ORG[k].find(o=>o.id===id),lo=[O.c[0]+3,O.c[1]+.3,O.c[2]+.2],l=Math.hypot(3,.3,.2),ld=[-3/l,-.3/l,-.2/l];
   HUNT._xrBuild(R,A,{zone,lo,ld,t:l-.19,org:HUNT._shotOrgans(k,lo,ld,zone),pose:{nrx:0,nry:0,hrx:0,legs:[]}});return {V:HUNT._xr().ov,O,s:A.s};}`);
 for(const [k,id,zone,name] of [['hirsch','herz','herz','Herz'],['keiler','herz','herz','Herz'],['hirsch','lungeL','lunge','Lunge']]){
  C.a=[k,id,zone];run('var r=shot(...a),V=r.V,O=r.O,h=V.h.map(v=>v/r.s);');
  assert.equal(run('V.hn'),name);assert.equal(run('V.kill'),true);
  assert.ok(run('HUNT.ORG[a[0]].filter(Q=>Q.t===O.t).some(Q=>Math.hypot((h[0]-Q.c[0])/Q.r[0],(h[1]-Q.c[1])/Q.r[1],(h[2]-Q.c[2])/Q.r[2])<1)'),k+' '+id+': Trefferpunkt im Organ');
  assert.ok(run('V.x[0]<V.h[0]&&V.h[0]<V.e[0]'),'Einschuss → Treffer → Ausschuss in Schussrichtung');
  assert.ok(run('V.lab.length>=1&&V.lab.every(l=>l.hit)&&V.lab.some(l=>l.n==="'+name+'")'),'Organnamen, getroffenes markiert');
 }
 run('var f=shot("fasan","herz","vogel").V;');assert.ok(run('f.lab.every(l=>l.hit)&&f.lab.length>=1'));
});
test('Wertung unverändert: Herz- und Lungenzone wie zuvor',()=>{
 assert.deepEqual(run('JSON.stringify([HUNT.SP.hirsch.heart,HUNT.SP.hirsch.lung,HUNT.SP.keiler.heart,HUNT.SP.keiler.lung])'),
  '[{"c":[0,0.88,0.28],"r":0.08},{"c":[0,0.96,0.24],"r":0.135},{"c":[0,0.46,0.24],"r":0.07},{"c":[0,0.52,0.2],"r":0.125}]');
});
test('Zoom ohne Knöpfe: keine Zoom-Schaltflächen mehr, Zwei-Finger-Zoom in beiden Ansichten',()=>{
 const js=fs.readFileSync(path.join(__dirname,'hunt.js'),'utf8'),css=fs.readFileSync(path.join(__dirname,'style.css'),'utf8');
 assert.doesNotMatch(js,/hu-zoom|hzin|hzout|hzreset/);assert.doesNotMatch(css,/\.hu-zoom\{/);
 assert.match(js,/X\.hrv\.zoom = pinch\.z0 \* pinch\.d0 \/ span\(\)/);assert.match(js,/XR\.zoom = clamp\(pinch\.z0 \* pinch\.d0 \/ span\(\)/);
});
console.log(n+' Prüfgruppen v357 bestanden.');
