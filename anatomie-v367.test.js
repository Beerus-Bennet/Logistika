/* v367: Sichtbare Organoberflächen und Schussbericht dürfen sich nicht widersprechen. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);const run=s=>vm.runInContext(s,C);let n=0;const test=(name,fn)=>{fn();console.log('ok '+(++n)+' '+name);};
test('Magen: Strahl innerhalb des alten Ersatzellipsoids, aber außerhalb der gezeichneten Form zählt nicht; zentraler Treffer zählt',()=>{
 run(`var O=HUNT.ORG.keiler.find(q=>q.id==='magen'),miss=[3,.39,-.15],d=[-1,0,0];`);
 assert.ok(run(`((miss[1]-O.c[1])/O.r[1])**2+((miss[2]-O.c[2])/O.r[2])**2<1`));
 assert.equal(run(`HUNT._organSegment('keiler','magen',miss,d)`),null);
 assert.equal(run(`HUNT._shotOrgans('keiler',miss,d,'koerper').some(o=>o.id==='magen')`),false);
 assert.ok(run(`HUNT._shotOrgans('keiler',[3,.5,-.12],d,'koerper').some(o=>o.id==='magen')`));
});
test('Alle 25 weichen Organmodelle sind von beiden Seiten treffbar; leere Umgebung wird nie als Organ ausgegeben',()=>{
 run(`var checked=0;for(const k of ['hirsch','keiler','fasan'])for(const O of HUNT.ORG[k].filter(q=>q.t)){
  for(const side of [-1,1]){const org=HUNT._shotOrgans(k,[side*3,O.c[1],O.c[2]],[-side,0,0],'koerper');if(!org.some(q=>q.id===O.id))throw Error(k+':'+O.id);}
  checked++;
 }`);assert.equal(run('checked'),25);
 for(const k of ['hirsch','keiler','fasan'])assert.equal(run(`HUNT._shotOrgans('${k}',[3,5,4],[-1,0,0],'koerper').filter(o=>HUNT.ORG['${k}'].some(O=>O.t&&O.id===o.id)).length`),0);
});
test('Paarige Nieren bleiben getrennt und stehen in wirklicher Durchschussreihenfolge, auch von der Gegenseite',()=>{
 assert.equal(run(`HUNT._shotOrgans('keiler',[3,.62,-.2],[-1,0,0],'koerper').filter(o=>/^niere/.test(o.id)).map(o=>o.n).join(',')`),'Niere links,Niere rechts');
 assert.equal(run(`HUNT._shotOrgans('keiler',[-3,.62,-.2],[1,0,0],'koerper').filter(o=>/^niere/.test(o.id)).map(o=>o.id).join(',')`),'niereL,niereR');
});
test('Ein neuer Schuss wird ohne tatsächlichen Herzkontakt nicht mehr allein durch die großzügige alte Herzzone zum Herzschuss',()=>{
 run(`var missHeart=[3,.414,.194],H=HUNT.SP.keiler.heart,depth=1-((missHeart[1]-H.c[1])/H.r)**2-((missHeart[2]-H.c[2])/H.r)**2;`);
 assert.ok(run('depth>.35**2'));assert.equal(run(`HUNT._organSegment('keiler','herz',missHeart,[-1,0,0])`),null);
 assert.equal(run(`HUNT.zoneHit('keiler',{x:0,z:0,s:1},missHeart,[-1,0,0]).zone`),'koerper');
 assert.equal(run(`HUNT.zoneHit('keiler',{x:0,z:0,s:1},[3,.47,.24],[-1,0,0]).zone`),'herz');
});
test('Alte Aufnahmen korrigieren falsche Organliste ohne gespeicherte Wirkung/Medaille/Schussdaten zu ändern oder Organe zu erzwingen',()=>{
 run(`var old={zone:'lunge',lo:miss,ld:d,org:[{id:'magen'},{id:'lungeL'}],dmg:100,medal:3},before=JSON.stringify(old),view=HUNT._xrShot('keiler',old);`);
 assert.equal(run('JSON.stringify(old)'),run('before'));assert.equal(run('view.reportZone'),'koerper');assert.equal(run('view.dmg'),100);assert.equal(run('view.medal'),3);assert.equal(run('view.anatomyUpdated'),true);
 assert.equal(run(`view.org.some(o=>o.id==='magen'||/^lunge/.test(o.id))`),false);
});
test('Weltrotation und Tiergröße ändern die erfassten Organe nicht; Strahl und Modell bleiben in denselben Tierkoordinaten',()=>{
 run(`var sets=[];for(const s of [.7,1,1.3])for(const rx of [-.2,.25])for(const ry of [-1.4,.8]){
  const pose={x:5,y:.1,z:-3,rx,ry,rz:.12,s},o0=[3,.5,-.12],d0=[-1,0,0],w=HUNT.rot(o0.map(x=>x*s),rx,ry,.12),wd=HUNT.rot(d0,rx,ry,.12);
  const rec=HUNT._shotRec('keiler',pose,[w[0]+5,w[1]+.1,w[2]-3],wd,{zone:'koerper',t:2.8*s},179,{});sets.push(rec.org.map(o=>o.id).join(','));if(!rec.anatomy367)throw Error('Kennzeichen fehlt');
 }`);assert.equal(run('new Set(sets).size'),1);assert.match(run('sets[0]'),/magen/);
});
test('Gezeichnete Trefferpunkte und Namenszeiger sitzen auf demselben Kanal und nur auf tatsächlich getroffenen Organen',()=>{
 run(`var R={nodes:[],mesh:b=>({b}),free(){},node:(m,o)=>Object.assign({mesh:m,ch:[]},o),addChild:(p,n)=>{p.ch.push(n);return n;}};
 var gn=HUNT.genes('keiler',.7,3),A={k:'keiler',s:1,score:.7,gn,T:HUNT.traits('keiler',.7,gn),vr:0},sh={zone:'koerper',lo:[3,.5,-.12],ld:d,t:2.8,org:[],pose:{legs:[]}};
 HUNT._xrBuild(R,A,sh);var x=HUNT._xr();`);
 assert.equal(run('x.visibleOrgans.join(",")'),'magen');assert.equal(run('x.ov.hn'),'Magen');assert.equal(run('x.ov.lab.length'),0);
 const hit=run(`HUNT._organSegment('keiler','magen',sh.lo,sh.ld)[0]`);assert.ok(Math.abs(run('x.ov.h[0]')-(3-hit))<1e-7);
 assert.ok(run('x.ov.e[0]>x.ov.h[0]&&x.ov.h[0]>x.ov.x[0]'));
});
console.log(n+' Prüfgruppen v367 bestanden.');
