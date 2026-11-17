/* v388: Tierseitigkeit, Eindringtiefe und eindeutige Beschriftung. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);const run=s=>vm.runInContext(s,C);
run(`var R={nodes:[],mesh:b=>({b}),free(){},node:(m,o)=>Object.assign({mesh:m,ch:[]},o),addChild:(p,n)=>{p.ch.push(n);return n;}};`);
for(const k of ['hirsch','keiler','fasan'])for(const side of [-1,1]){
 C.k=k;C.side=side;
 run(`var O=HUNT.ORG[k].find(q=>q.t==='lunge'&&Math.sign(q.c[0])===side),lo=[O.c[0],O.c[1],3],ld=[0,0,-1],org=HUNT._shotOrgans(k,lo,ld,'lunge'),lungs=org.filter(q=>/^lunge/.test(q.id));`);
 assert.equal(run('lungs.length'),1,k);assert.match(run('lungs[0].n'),side<0?/rechts$/:/links$/);
 run(`var gn=HUNT.genes(k,.7,3),A={k,s:1,score:.7,gn,T:HUNT.traits(k,.7,gn),vr:0},sh={zone:'lunge',lo,ld,t:2.8,dmg:100,org,pose:{legs:[]}};HUNT._xrBuild(R,A,sh);`);
 assert.equal(run('HUNT._xr().ov.hn'),run('lungs[0].n'));assert.equal(run(`HUNT._xr().ov.lab.some(q=>/Lungenflügel|Lunge/.test(q.n))`),false);
}
run(`var k='hirsch',O=HUNT.ORG[k].find(o=>o.id==='herz'),gn=HUNT.genes(k,.7,3),A={k,s:1,score:.7,gn,T:HUNT.traits(k,.7,gn),vr:0},sh={zone:'herz',lo:[3,O.c[1],O.c[2]],ld:[-1,0,0],t:2.8,dmg:100,org:[],pose:{legs:[]}};HUNT._xrBuild(R,A,sh);`);
assert.equal(run('HUNT._xr().ov.hn'),'Herz');assert.ok(run(`HUNT._xr().ov.lab.every(q=>q.n!=='Herz')`));
assert.equal(run(`HUNT._organReportName('hirsch',{id:'herz',n:'Herz'},sh)`),'Herz (zerstört)');
assert.equal(run(`HUNT._organReportName('hirsch',{id:'herz',n:'Herz'},{dmg:40})`),'Herz');
// Ein gespeicherter Schuss endet vor der gegenüberliegenden Lunge.
run(`var O=HUNT.ORG.hirsch.find(q=>q.t==='lunge'&&q.c[0]<0),old={zone:'lunge',lo:[-3,O.c[1],O.c[2]],ld:[1,0,0],t:2.8,stop:2.99,dmg:100,medal:3,org:[{id:'lungeL'},{id:'lungeR'}]},before=JSON.stringify(old),view=HUNT._xrShot('hirsch',old);`);
assert.equal(run('view.org.filter(q=>/^lunge/.test(q.id)).length'),1);assert.match(run('view.org.find(q=>/^lunge/.test(q.id)).n'),/rechts$/);assert.equal(run('JSON.stringify(old)'),run('before'));assert.equal(run('view.dmg'),100);
console.log('OK v388: sechs einseitige Lungenkanäle korrekt nach Tierseite, keine primären Doppelschilder, kompakter Herzstatus, Eindringtiefe und gespeicherte Werte erhalten.');
