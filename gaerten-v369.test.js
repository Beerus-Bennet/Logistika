/* v343: Straßen, Grundstücke und gespeicherte Bewohnerabläufe.
   Ohne Pakete: node village-life-v343.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js','villagedata.js','places.js','map.js','game.js','farm.js','erbe.js','village.js','gl3d.js','farmmodels.js','woodmodels.js','rent.js','hunt.js','villagesite.js','villagegarden.js','villagepeople.js'])run(read(f));
run(`
 var notices=[];
 toast=m=>notices.push(m);save=()=>{};render=()=>{};renderInspector=()=>{};mapRedraw=()=>{};logMoney=()=>{};
 checkLevel=()=>{};farmCheckLevel=()=>{};farmEvent=()=>{};
 function umschlagFactor(){return 1;}function tickBases(){}function baseDayChange(){}function staffPerk(){return 0;}
 spawnOrders=()=>0;spawnJewels=()=>{};
 function fresh(lv=111){
  S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:600,lastDay:0,player:{company:'Test'},bases:[],fleet:[]});
  farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=(lv-1)**2*50;S.farm.lvSeen=lv;S.farm.tut.done=true;
  S.farm.econ238=1;S.farm.cap.silo=10;S.farm.cap.barn=10;
  S.farm.objs.push({t:'lagerhalle',id:S.farm.seq++,x:1,z:20,sz:[10,6]});
  S.orders=[];notices=[];clearRouteCache();
 }
`);

// Die echte Wegsuche wird im Browser geprüft; hier geht es um Ablauf und Verkauf.
run(`navPath=(x,z,a,b)=>[[x,z],[a,b]];
 function prepared(){fresh(25);S.time=600;S.farm.areas.see=true;for(const h of Object.values(VILLAGE.state().homes))h.life={mailDay:0,shopDay:0};}
 function advance(kind,f=.5){const L=VILLAGE.home('000').life.active;let at=L.at;for(let i=L.index;i<L.steps.length;i++){if(L.steps[i].kind===kind){S.time=at+L.steps[i].duration*f;VILLAGE.tick();return;}at+=L.steps[i].duration;}throw Error(kind);}
`);

let count=0;const test=(name,fn)=>{fn();console.log('ok '+(++count)+' '+name);};
test('Ausstattung erscheint erst nach echtem Vertrag/Einzug, nicht bei Bau oder bloßen Wohnanfragen',()=>{
 run(`prepared();VILLAGE.state().expanded=true;VILLAGE.buy('030');VILLAGE.build('030','familie',false);var p=VILLAGE.plot('030'),h=VILLAGE.home('030');`);
 assert.equal(run('VILLAGE_GARDEN.plan(p,h)'),null);
 run(`S.time=h.ready;VILLAGE.tick();VILLAGE.list('030','online');S.time=h.listing.ready;VILLAGE.tick();var offer=h.listing.offers[0];`);
 assert.equal(run('VILLAGE_GARDEN.plan(p,h)'),null);
 assert.equal(run(`VILLAGE.negotiate('030',offer.id,'rent',offer.price)&&VILLAGE.sign('030',offer.id)`),true);
 assert.ok(run('VILLAGE_GARDEN.plan(p,h).items.length>=6'));assert.equal(run('h.status'),'rented');
});
test('Bestehende Nachbarn und gekaufte Häuser erhalten Gärten; leerstehende oder unfertige Häuser bleiben frei',()=>{
 run('prepared();');assert.ok(run(`VILLAGE_GARDEN.plan(VILLAGE.plot('000'),VILLAGE.home('000'))`));
 for(const status of ['resident','rented','sold'])assert.ok(run(`VILLAGE_GARDEN.plan(VILLAGE.plot('030'),{status:'${status}',type:'holz',resident:{id:'test',seed:8,size:2}})`));
 for(const status of ['vacant','land','building','ready'])assert.equal(run(`VILLAGE_GARDEN.plan(VILLAGE.plot('030'),{status:'${status}',type:'holz'})`),null);
});
test('Haushalte unterscheiden sich nachvollziehbar; Gartenplan bleibt nach Neuladen gleich und ändert kein Geld/Save',()=>{
 run(`prepared();var a=VILLAGE_GARDEN.plan(VILLAGE.plot('000'),VILLAGE.home('000')),family=VILLAGE_GARDEN.plan(VILLAGE.plot('001'),VILLAGE.home('001'));`);
 assert.equal(run('a.profile'),'beete');assert.equal(run('family.profile'),'familie');assert.ok(run(`family.items.some(q=>q.kind==='schaukel')`));
 run(`var saved=JSON.stringify(S),first=JSON.stringify(a);VILLAGE_GARDEN.mesh(VILLAGE.plot('000'),a);S=JSON.parse(saved);VILLAGE_GARDEN.plan(VILLAGE.plot('000'),{status:'resident',type:'holz',resident:{id:'andere',seed:19,size:3}});a=VILLAGE_GARDEN.plan(VILLAGE.plot('000'),VILLAGE.home('000'));`);
 assert.equal(run('JSON.stringify(a)'),run('first'));assert.equal(run('JSON.stringify(S)'),run('saved'));
});
test('Alle Grundstücke/Haustypen/Profile: Zubehör bleibt innerhalb des Zauns, außerhalb von Haus/Anbau und ohne überlappende Ausstattungszonen',()=>{
 run(`prepared();var failures=[],triangles=[],farTriangles=[],profiles=new Set();
 for(const p of VILLAGE_DATA.plots)for(const type of ['holz','familie'])for(const r of [{id:'a',seed:10,size:2},{id:'b',seed:11,size:2},{id:'c',seed:12,size:3},{id:'d',seed:13,size:2,job:'Gärtner'}]){
  const h={status:'rented',type,resident:r},P=VILLAGE_GARDEN.plan(p,h),s=VILLAGE_DATA.houses[type].scale,B=VILLAGE_SITE.lot(p),mesh=VILLAGE_GARDEN.mesh(p,P),far=VILLAGE_GARDEN.mesh(p,P,true);profiles.add(P.profile);
  triangles.push(mesh.v.length/27);farTriangles.push(far.v.length/27);
  for(let i=0;i<mesh.v.length;i+=9){const x=mesh.v[i]+p.x,z=mesh.v[i+2]+p.z;if(!Number.isFinite(mesh.v[i])||!Number.isFinite(mesh.v[i+1])||x<B[0]+.2||x>B[2]-.2||z<B[1]+.2||z>B[3]-.2)failures.push(type+':Zaun:'+p.id);}
  const homes=[[11-4.65*s,-3*s,11+2.6*s,3*s]];
  if(type==='familie'){const vv=[-p.side*5.9*s,-p.side*2.2*s].sort((a,b)=>a-b);homes.push([11-2.2*s,vv[0],11+2.2*s,vv[1]]);}
  const overlap=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
  P.items.forEach((q,i)=>{const a=[q.u-q.w/2,q.v-q.d/2,q.u+q.w/2,q.v+q.d/2];if(homes.some(b=>overlap(a,b)))failures.push(type+':Haus:'+q.kind);if(P.items.slice(i+1).some(t=>overlap(a,[t.u-t.w/2,t.v-t.d/2,t.u+t.w/2,t.v+t.d/2])))failures.push(type+':Zubehör:'+q.kind);});
 }`);
 assert.equal(run('failures.length'),0,run('JSON.stringify(failures.slice(0,12))'));assert.equal(run('profiles.size'),4);assert.ok(run('Math.max(...triangles)<2500'));assert.ok(run('farTriangles.every((n,i)=>n<triangles[i]*.65)'));
 console.log('   '+run('Math.max(...triangles)')+' Dreiecke maximal pro Garten; fern '+run('Math.max(...farTriangles)'));
});
test('Rendergeometrie liegt in den gemeinsamen Hindernisflächen; Briefkasten-, Tor- und Radwege bleiben frei',()=>{
 run(`prepared();var failures=[];for(const p of VILLAGE_DATA.plots)for(const type of ['holz','familie']){
  const h=VILLAGE.home(p.id);Object.assign(h,{status:'rented',type,resident:{id:'walk'+p.id,seed:11,size:3}});const P=VILLAGE_GARDEN.plan(p,h);
  for(const q of P.items){const b=VILLAGE_GARDEN._model(q.kind,P.colors),M=new FM.MB();M.merge(b,{ry:q.ry});for(let i=0;i<M.v.length;i+=9){if(Math.abs(M.v[i])>q.w/2+.005||Math.abs(M.v[i+2])>q.d/2+.005)failures.push(q.kind+':Umriss');}
    if(!VILLAGE_SITE.blocked(p.road+p.side*q.u,p.z+q.v,.1))failures.push(q.kind+':Kollision');}
  if(!VILLAGE_SITE.clearLine(VILLAGE_SITE.gate(p),VILLAGE.door(p),.34))failures.push(p.id+':Torweg');
  for(const q of [VILLAGE_SITE.mailbox(p),VILLAGE_SITE.bikePark(p)])if(VILLAGE_GARDEN.blocked(p,h,q[0],q[1],.7))failures.push(p.id+':Zugang');
 }`);assert.equal(run('failures.length'),0,run('JSON.stringify(failures.slice(0,16))'));
});
console.log(count+' Garten-Prüfgruppen bestanden.');
