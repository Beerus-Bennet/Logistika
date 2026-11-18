/* v412: Kanal, sichtbares Gehirn und Bericht müssen dieselbe Geometrie nutzen. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);
const run=s=>vm.runInContext(s,C);let cases=0;
run(`var R={nodes:[],mesh:b=>({b}),free(){},node:(m,o)=>Object.assign({mesh:m,ch:[]},o),addChild:(p,n)=>{p.ch.push(n);return n;}};`);
for(const k of ['hirsch','keiler','fasan'])for(const pose of [{nrx:0,nry:0,hrx:0,legs:[]},{nrx:.23,nry:-.35,hrx:k==='hirsch'?.18:0,legs:[]}])for(const dir of [[1,0,0],[0,0,1],[.7,.15,.7]]){
 Object.assign(C,{k,pose,dir});
 run(`var S0=HUNT.SP[k],c=HUNT._headPoint(k,S0.brain.c,pose),z=HUNT._headPoint(k,S0.brain.c.map((v,i)=>v+dir[i]),pose),l=Math.hypot(...z.map((v,i)=>v-c[i])),ld=z.map((v,i)=>(c[i]-v)/l),lo=c.map((v,i)=>v-ld[i]*3),sh={zone:'kopf',lo,ld,t:2.7,dm:256,dmg:100,e:3000,v:750,org:[{id:'kopf'}],pose},before=JSON.stringify(sh),HC=HUNT._headContacts(k,lo,ld,pose),brain=HC.find(q=>q.O.id==='gehirn'),channel=HUNT._headChannel(k,sh),view=HUNT._xrShot(k,sh),gn=HUNT.genes(k,.3,12),A={k,s:1,score:.3,gn,T:HUNT.traits(k,.3,gn),vr:0};HUNT._xrBuild(R,A,sh);var ov=HUNT._xr().ov;`);
 assert.ok(run('!!brain'),k+' Gehirn getroffen');
 assert.ok(run('channel.entry<brain.sg[0]&&channel.end>brain.sg[1]'),k+' kompletter Kanal durch den Hirnschädel');
 assert.equal(run('channel.thru'),true);assert.equal(run('ov.hn'),'Gehirn');
 assert.ok(run('ov.lab.some(q=>q.n==="Schädel")'));assert.ok(run('ov.lab.every(q=>q.n!=="Gehirn")'));
 assert.ok(run('view.org.some(o=>o.id==="schaedel")&&view.org.some(o=>o.id==="gehirn")&&!view.org.some(o=>o.id==="kopf")'));
 assert.ok(run('view.org.findIndex(o=>o.id==="schaedel")<view.org.findIndex(o=>o.id==="gehirn")'));
 assert.equal(run('JSON.stringify(sh)'),run('before'));assert.equal(run('view.dmg'),100);
 assert.ok(run(`Math.abs(ov.x.map((v,i)=>(v-lo[i])*ld[i]).reduce((a,b)=>a+b,0)-channel.exit)<1e-7`));
 if(dir[2]===1&&pose.nrx===0)assert.equal(run(`HUNT.zoneHit(k,Object.assign({x:0,y:0,z:0,s:1},pose),lo,ld).zone`),'kopf',k+' frontaler Hirntreffer');
 // Die künstlich kurze Eindringtiefe endet vor dem Gehirn. Auch alte "Kopfschüsse" werden ehrlich angezeigt.
 run(`var short=Object.assign({},sh,{stop:(channel.entry+brain.sg[0])/2}),sv=HUNT._xrShot(k,short),sc=HUNT._headChannel(k,short);HUNT._xrBuild(R,A,short);`);
 assert.ok(run('!sv.org.some(o=>o.id==="gehirn")'));assert.equal(run('sv.reportZone'),k==='fasan'?'streif':'haupt');
 assert.equal(run('sv.anatomyUpdated'),true);assert.equal(run('sv.dmg'),100);assert.equal(run('sc.thru'),false);
 assert.ok(run('Math.abs(sc.end-short.stop)<1e-9'));assert.notEqual(run('HUNT._xr().ov.hn'),'Gehirn');
 assert.equal(run('HUNT._xr().ov.kill'),false);
 // Der Kanal endet bei einem Steckschuss IM Gehirn genau an der gespeicherten Grenze.
 run(`var lodged=Object.assign({},sh,{stop:(brain.sg[0]+brain.sg[1])/2});HUNT._xrBuild(R,A,lodged);var lx=HUNT._xr().ov.x;`);
 assert.ok(run('Math.abs(lx.map((v,i)=>(v-lo[i])*ld[i]).reduce((a,b)=>a+b,0)-lodged.stop)<1e-7'));
 cases++;
}
for(const k of ['hirsch','keiler','fasan']){
 C.k=k;
 run(`var B=HUNT.SP[k].brain,pose={x:0,z:0,s:1,nrx:0,nry:0,hrx:0,legs:[]},c=HUNT._headPoint(k,B.c,pose),lo=[c[0]+3,c[1],c[2]],ld=[-1,0,0],ch=HUNT._headChannel(k,{lo,ld,pose}),hit={zone:'kopf',t:ch.entry},rec=HUNT._shotRec(k,pose,lo,ld,hit,100,{gun:{id:'test',pen:.001,v0:820,lam:1150,m:.0117}});`);
 assert.ok(run('!rec.org.some(o=>o.id==="gehirn")'));assert.ok(run('rec.dmg<100'));assert.equal(run('rec.thru'),false);
 run(`var jaw=k==='keiler'?[0,-.05*Math.cos(.38)-.36*Math.sin(.38),-.05*Math.sin(.38)+.36*Math.cos(.38)]:k==='hirsch'?[0,-.04,.32]:[0,.153,.08],jc=HUNT._headPoint(k,jaw,pose),jo=[jc[0]+3,jc[1],jc[2]],jh=HUNT.zoneHit(k,pose,jo,[-1,0,0]);`);
 assert.ok(run('!!jh'),k+' Kopfoberfläche treffbar');assert.notEqual(run('jh.zone'),'kopf',k+' Kiefer/Schnabel ist kein Gehirntreffer');
 run(`var early={zone:'kopf',lo,ld,t:ch.entry,stop:ch.entry-.01,pose},ec=HUNT._headChannel(k,early);HUNT._xrBuild(R,{k,s:1,score:.3,gn:HUNT.genes(k,.3,12),T:HUNT.traits(k,.3,HUNT.genes(k,.3,12))},Object.assign({org:[],dmg:100},early));`);
 assert.equal(run('ec.entered'),false);assert.equal(run('ec.end'),run('early.stop'));assert.equal(run('HUNT._xr().ov.entered'),false);
 for(const type of ['skull','brain','envelope']){
  C.type=type;run('var mesh=HUNT._headMesh(k,type)');assert.ok(run('mesh.v.every(Number.isFinite)'));
  assert.ok(run('mesh.v.length/27<9000'),k+' feste Dreiecksgrenze');
  assert.ok(run('mesh===HUNT._headMesh(k,type)'),k+' Geometrie wird wiederverwendet');
 }
 for(const type of ['schaedel','gehirn']){C.type=type;assert.ok(run('HUNT._headPreview(k,type).v.length>1000'));}
}
console.log(`OK v412: ${cases} Kopfkanäle (3 Arten, 2 Posen, 3 Richtungen), echte Gehirnkontakte, Ein-/Austritt, begrenzte Eindringtiefe, historische Werte und begrenzte/cachende 3D-Modelle.`);
