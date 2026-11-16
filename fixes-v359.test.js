/* v359: Relevante Störungen und feste anatomische Modelle, ohne Browser. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});vm.runInContext(fs.readFileSync('gl3d.js','utf8'),C);vm.runInContext(fs.readFileSync('hunt.js','utf8'),C);
const run=s=>vm.runInContext(s,C);let count=0;const test=(n,f)=>{f();console.log('ok '+(++count)+' '+n);};
test('Jedes Organ aller drei Arten hat ein festes, endliches Netz innerhalb seines anatomischen Bereichs',()=>{
 run(`var budgets=[],bad=[];for(const k of ['hirsch','keiler','fasan'])for(const O of HUNT.ORG[k].filter(O=>O.t)){
  const a=HUNT._organMesh(k,O.id).v,b=HUNT._organMesh(k,O.id).v;
  if(a.length!==b.length||!a.every((v,i)=>v===b[i]))bad.push(k+O.id+': bewegt sich');
  for(let i=0;i<a.length;i+=9)for(let j=0;j<3;j++)if(!Number.isFinite(a[i+j])||Math.abs((a[i+j]-O.c[j])/O.r[j])>1.3)bad.push(k+O.id+': außerhalb');
  budgets.push(a.length/27);
 }`);assert.equal(run('bad.length'),0,run('JSON.stringify(bad.slice(0,8))'));assert.ok(run('budgets.every(n=>n>200&&n<4500)'));
});
test('Herz, Leber, Darm und Nieren sind unterschiedliche Formen; Vogel- und Säugerlunge unterscheiden sich',()=>{
 assert.ok(run(`new Set(['herz','leber','darm','niereL'].map(id=>HUNT._organMesh('keiler',id).v.length)).size===4`));
 assert.ok(run(`function depth(k){const O=HUNT.ORG[k][k==='fasan'?1:0],v=HUNT._organMesh(k,O.id).v,Y=v.filter((_,i)=>i%9===1);return (Math.max(...Y)-Math.min(...Y))/O.r[1];}depth('fasan')<depth('hirsch')*.8`));
});
test('Nur protokollierte Organe und die gewertete Primärzone bleiben sichtbar, alte Datensätze ebenfalls',()=>{
 run(`var R={nodes:[],mesh:b=>({b}),free(){},node:(m,o)=>Object.assign({mesh:m,ch:[]},o),addChild:(p,n)=>{p.ch.push(n);return n;}};
 function build(k,zone,org){const gn=HUNT.genes(k,.7,3),A={k,s:1,score:.7,gn,T:HUNT.traits(k,.7,gn),vr:0};HUNT._xrBuild(R,A,{zone,org,lo:[3,.9,.28],ld:[-1,0,0],t:2.8,pose:{nrx:0,nry:0,hrx:0,legs:[]}});return HUNT._xr();}`);
 run(`var x=build('hirsch','herz',[{id:'herz'}]);`);assert.equal(run('x.visibleOrgans.join(",")'),'herz');assert.equal(run('x.ov.lab.map(l=>l.n).join(",")'),'Herz');
 run(`x=build('keiler','lunge',[{id:'lungeR'},{id:'leber'}]);`);assert.equal(run('x.visibleOrgans.join(",")'),'lungeR,leber');assert.equal(run('x.ov.lab.map(l=>l.n).join(",")'),'Lunge,Leber');
 run(`x=build('fasan','herz',[]);`);assert.equal(run('x.visibleOrgans.join(",")'),'herz');
});
const E=vm.createContext({console});const ev=s=>vm.runInContext(s,E);
ev(`var S={time:100,stage:6,jobs:[],fleet:[],events:[]},DECISIONS={},notes=[],toasts=[];
 var N={a:{name:'A'},b:{name:'B'}},document={getElementById:()=>null};
 const vType=t=>({mode:t,name:t}),roadLine=p=>p.display||p,routePending=p=>!!p.pending,legCoords=l=>l.pts;
 const hav=(a,b)=>{const r=Math.PI/180,dy=(b[0]-a[0])*r,dx=(b[1]-a[1])*r;return 12742*Math.asin(Math.sqrt(Math.sin(dy/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dx/2)**2));};
 const pathLen=p=>p.slice(1).reduce((n,q,i)=>n+hav(p[i],q),0),vehPoint=f=>f.point;
 const decisionMsg=m=>notes.push(m),toast=(...a)=>toasts.push(a),clock=String,dur=String,costKmOf=()=>1;
 function setup(){const route=[[52,13],[52,13.04]],f={uid:'f',type:'r',phase:'haul',jobId:'j',legIdx:0,route,pos:0,routeDist:pathLen(route),point:[52,13.005]},j={id:'j',v:313,legs:[{mode:'r',from:'a',to:'b',vehs:['f'],qty:10,dn:0,pts:route}]};S.jobs=[j];S.fleet=[f];S.events=[{id:'e',type:'stau',road:'Test',at:[52,13.02],until:500}];notes=[];toasts=[];return S.events[0];}
`);ev(fs.readFileSync('events.js','utf8'));
test('Störung auf unbenutzter/benachbarter Straße erzeugt weder Pille noch Nachricht',()=>{
 ev('var e=setup();e.at=[52.006,13.02];evNotify(e);');assert.equal(ev('evRelevant().length'),0);assert.equal(ev('notes.length+toasts.length'),0);
 ev('S.jobs=[];S.fleet[0].phase="idle";evNotify(e);');assert.equal(ev('evRelevant().length'),0);
});
test('Tatsächliche Kurvenlinie gilt, keine Luftlinie, bereits passierte Störung verschwindet',()=>{
 ev('e=setup();');assert.equal(ev('evRelevant().length'),1);
 ev('S.fleet[0].pos=S.fleet[0].routeDist*.8;');assert.equal(ev('evRelevant().length'),0);
 ev(`e=setup();S.fleet[0].route.display=[[52,13],[52.01,13.02],[52,13.04]];`);assert.equal(ev('evRelevant().length'),0);
 ev('e.at=[52.01,13.02];');assert.equal(ev('evRelevant().length'),1);
});
test('Kein Tempolimit durch off-route Stau; nur direkt auf dem betroffenen Abschnitt',()=>{
 ev('e=setup();S.fleet[0].point=[52,13.02];S.fleet[0].pos=S.fleet[0].routeDist*.5;');assert.equal(ev('eventFactor(S.fleet[0])'),.35);
 ev('e.at=[52.006,13.02];');assert.equal(ev('eventFactor(S.fleet[0])'),1);
});
test('Parallelfahrzeuge, andere Verkehrsträger, fertige Teilstrecken, Datumslinie und echte Meldung',()=>{
 ev(`e=setup();var g={...S.fleet[0],uid:'g'};S.fleet.push(g);S.jobs[0].legs[0].vehs.push('g');evNotify(e);`);assert.equal(ev('notes.length'),1);assert.equal(ev('notes[0].ctx.jobs.length'),1);assert.equal(ev('notes[0].ctx.vehicles.length'),2);
 ev('S.jobs[0].legs[0].dn=10;');assert.equal(ev('evRelevant().length'),0);
 ev('e=setup();S.jobs[0].legs[0].mode="b";S.fleet[0].type="b";');assert.equal(ev('evRelevant().length'),0);
 ev('e=setup();e.at=[52,179.99];');assert.equal(ev('evRouteHits(e,[[52,179.98],[52,-179.98]])'),true);
});
test('Hub nur an betroffenen Terminals, globale Streiks nur für zugewiesene Fahrten',()=>{
 ev('e=setup();e.type="hafen";e.node="b";S.fleet[0].type="s";S.jobs[0].legs[0].mode="s";');assert.equal(ev('evRelevant().length'),1);
 ev('e.node="a";');assert.equal(ev('evRelevant().length'),0,'Abfahrtshafen bereits verlassen');
 ev('e.type="streik";S.fleet[0].type="l";S.jobs[0].legs[0].mode="l";');assert.equal(ev('evRelevant().length'),1);
 ev('S.jobs=[];');assert.equal(ev('evRelevant().length'),0);
});
test('Überholte Störungsentscheidung belastet weder Geld noch Fristen',()=>{
 ev(`e=setup();evNotify(e);var paid=0;function payOut(n){paid+=n;}S.fleet[0].pos=S.fleet[0].routeDist*.95;
 var m={dec:{ctx:notes[0].ctx,choices:[{label:'Umfahren lassen'}]}},answer=DECISIONS.event.choose(m,0,100);`);
 assert.equal(ev('paid'),0);assert.match(ev('answer'),/keine Kosten/);
});
console.log(count+' Prüfgruppen v359 bestanden.');
