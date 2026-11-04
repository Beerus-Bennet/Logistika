/* v301: Echte Raum-/Etagenlogik mit leichtem DOM- und Grafiktreiber-Ersatz.
   Ohne Zusatzpakete: node office-stairs-v301.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8'),drawn=[];
class El{
 constructor(){this.style={};this.dataset={};this.attrs={};this.children=[];this.events={};this.hidden=false;const s=new Set();this.classList={add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),contains:x=>s.has(x),toggle:(x,on)=>on?s.add(x):s.delete(x)};}
 set innerHTML(html){this.html=html;this.children=[];for(const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)){const e=new El();e.textContent=m[2];for(const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)){e.attrs[a[1]]=a[2];if(a[1].startsWith('data-'))e.dataset[a[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=a[2];if(a[1]==='class')e.classList.add(...a[2].split(' '));}this.children.push(e);}}
 get innerHTML(){return this.html||'';}
 querySelectorAll(s){return this.children.filter(e=>s[0]==='.'?e.classList.contains(s.slice(1)):e.attrs[s.slice(1,-1)]!==undefined);}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn){(this.events[k]||(this.events[k]=[])).push(fn);}
 setPointerCapture(){}
 focus(){this.focused=true;}
 getBoundingClientRect(){return {left:0,top:0,width:390,height:700};}
}
function canvas(){const e=new El(),g=new Proxy({measureText:t=>({width:String(t).length*8}),fillText:t=>drawn.push(String(t)),strokeText:t=>drawn.push(String(t))},{get:(o,k)=>k in o?o[k]:()=>{}});e.getContext=()=>g;return e;}
function dom(){const map=new Map();for(const s of ['#ofpCv','#ofpJoy','.ofp-joy i','#ofpAction','#ofpThrow','#ofpCarry','.ofp-aim','#ofpCard','#ofpSay','#ofpHint','.ofp-fl','.ofp-floors'])map.set(s,new El());const knob=map.get('.ofp-joy i');map.get('#ofpJoy').querySelector=s=>s==='i'?knob:null;return {querySelector:s=>map.get(s)||null,clientWidth:390,clientHeight:700};}
const C={console,performance:{now:()=>1000},setTimeout:()=>0,clearTimeout:()=>{},document:{createElement:()=>canvas()},addEventListener:()=>{}};C.window=C;vm.createContext(C);
for(const f of ['avatar.js','gl3d.js','officekitchen.js','offices.js'])vm.runInContext(read(f),C);
const names='stairwell,buildRoom,safeLanding,changeFloor,useStairs,walkedIntoStairs,stairTarget,actionTarget,performAction,buildFloor,closeCard,bindInput,step,syncOfficeCamera';
vm.runInContext(read('officefp.js').replace('return { enter, leave,','return { qa:{'+names+',setO:o=>{O=o}}, enter, leave,')+'\nthis.Q=OFFICE3D.qa;',C);const Q=C.Q;
vm.runInContext(`var S={stage:6,time:100,money:4200,expense:0,bases:[],fleet:[],jobs:[],player:{company:'FIRMA-TEST-301',color:0}},N={berlin:{short:'Berlin'}},COMPANY_COLORS=['#2f6fed'];
 var esc=x=>String(x),dayOf=t=>Math.floor(t/1440)+1,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));motmCheck=()=>null;var baseById=id=>S.bases.find(b=>b.id===id);`,C);
let serial=0;
const hitBox=vm.runInContext('('+read('gl3d.js').match(/R\.hitBox = (function[\s\S]*?\n    });/)[1]+')',C);
function make(tier,kitchen='keine',plants=false){
 const b={id:'B',tier,node:'berlin',mood:95,staff:[],vehicles:[],deco:{floor:'beton',tint:'natur',wall:'weiss',kitchen,plants:plants?['ficus','ficus','ficus']:[],pos:{desks:{},plants:plants?{0:[298,58],1:[298,58],2:[298,58]}:{},kitchen:null}}};C.S.bases=[b];
 const R={nodes:[],w:390,h:700,cam:{dist:.05},mesh:m=>({id:++serial,vertices:m.v.length}),free:m=>{m.freed=true;},texture:c=>({id:++serial,c,tex:true}),texFree:t=>{t.freed=true;},node:(mesh,o={})=>Object.assign({id:++serial,mesh,children:[],sx:1,sy:1,sz:1},o.s?{sx:o.s,sy:o.s,sz:o.s}:{},o),addChild:(p,n)=>{p.children.push(n);return n;},hitBox,texUpdate:()=>{}};
 const o={b,R,el:dom(),floor:0,t:0,tok:1,alive:true,reduced:true,meshes:[],texs:[],mcache:new Map(),kitchenStates:new Map(),spills:new Map(),fx:[],later:[]};R.ray=()=>o.testRay||{o:o.eye,d:[1,0,0]};Q.setO(o);Q.buildFloor(true);Q.bindInput();Q.syncOfficeCamera(0);return o;
}
function clearPosition(o){const r=.32;return o.ob.concat(o.kitRuntime?o.kitRuntime.colliders():[]).every(([x0,z0,x1,z1])=>o.pos[0]<=x0-r||o.pos[0]>=x1+r||o.pos[1]<=z0-r||o.pos[1]>=z1+r);}
function front(o){o.pos=[o.stairwell.gate-.10,o.stairwell.entry[1]];o.yaw=Math.PI;o.pitch=0;Q.syncOfficeCamera(0);o.testRay={o:o.eye.slice(),d:[1,0,0]};}
let transitions=0;
for(const tier of [3,4])for(const kitchen of ['keine','nische','einbau','barista']){
 const o=make(tier,kitchen,true),saved=JSON.stringify(C.S),count=tier===3?2:3;
 assert.equal(o.stairwell.dest.length,1);assert.equal(o.stairwell.dest[0].floor,1);
 for(const f of Array.from({length:count-1},(_,i)=>i+1).concat(Array.from({length:count-1},(_,i)=>count-2-i))){
  front(o);const action=Q.actionTarget(o.testRay);assert.equal(action&&action.id,'stairs','Treppe ist ein erreichbares Aktionsziel');
  const assets=o.meshes.slice(),tex=o.texs.slice();
  if(o.stairwell.dest.length===2){assert.equal(Q.useStairs(),true);assert.equal(o.stairChoice,true);assert.equal(o.in.jy,0);
   const el=o.el.querySelector('#ofpCard'),buttons=el.querySelectorAll('[data-stair-floor]');assert.deepEqual(buttons.map(b=>+b.dataset.stairFloor).sort(),[0,2]);
   const x=o.pos.slice();o.in.k.w=true;Q.step(.05,1100);assert.deepEqual(o.pos,x,'In der Treppenauswahl bleibt die Figur stehen');
   buttons.find(b=>+b.dataset.stairFloor===f).onclick();
  }else Q.performAction(action);
  assert.equal(o.floor,f);assert.equal(o.cardOpen,false);assert.equal(o.stairChoice,false);assert.equal(o.in.jx,0);assert.equal(o.in.jy,0);assert.equal(Object.keys(o.in.k).length,0);
  assert.ok(clearPosition(o),'Ankunft außerhalb von Möbeln, Pflanzen und Treppe');assert.ok(Math.hypot(o.pos[0]-4,o.pos[1]+3.44)<2,'Ankunft am Treppenhaus statt an der Außentür');assert.ok(o.pos[0]<=o.stairwell.gate-.10,'Ankunft vor dem Treppenzugang, damit auch der Rückweg durch Hingehen funktioniert');
  assert.ok(assets.every(m=>m.freed)&&tex.every(t=>t.freed),'Alte Etage gibt Grafikressourcen frei');
  assert.deepEqual(Array.from(o.eye),[o.pos[0],1.62,o.pos[1]],'Kamera direkt am neuen Standort');
  const floor=o.floor;for(let i=0;i<5;i++)Q.step(.05,1200+i*50);assert.equal(o.floor,floor,'Kein unbeabsichtigtes Zurückwechseln');transitions++;
 }
 assert.equal(JSON.stringify(C.S),saved,'Treppen ändern weder Firma, Geld, Personal noch gespeicherte Dekoration');
 assert.equal(Q.changeFloor(-1,true),false);assert.equal(Q.changeFloor(count,true),false);assert.equal(Q.changeFloor(.5,false),false);
 assert.ok(drawn.every(t=>!t.includes('FIRMA-TEST-301')),'Firmenschriftzug wird nicht mehr gezeichnet');
}
for(const tier of [0,1,2]){const o=make(tier);assert.equal(o.stairwell,null);assert.equal(Q.useStairs(),false);assert.equal(Q.changeFloor(1,false),false);}
{const o=make(3),r=Q.buildRoom(o.b,0),s=r.stairwell,rail=[];
 for(let i=0;i<r.st.v.length;i+=9){const v=r.st.v.slice(i,i+9);if(Math.abs(v[6]-85/255)<1e-8&&Math.abs(v[7]-96/255)<1e-8&&v[2]>s.hi[2]-.01&&v[2]<s.hi[2]+.05)rail.push(v);}
 const xs=rail.map(v=>v[0]);assert.ok(Math.max(...xs)-Math.min(...xs)>s.hi[0]-s.lo[0],'Handlauf reicht über den gesamten Lauf');
 const low=rail.filter(v=>v[0]<s.lo[0]+.08),high=rail.filter(v=>v[0]>s.hi[0]-.08),mean=a=>a.reduce((n,v)=>n+v[1],0)/a.length;
 assert.ok(mean(high)-mean(low)>2.8,'Handlauf steigt mit den Stufen statt in Gegenrichtung');
}
/* Wirklicher Laufweg: gleiche Schritt-/Kollisionsroutine wie Joystick/WASD. */
let o=make(3);front(o);o.in.k.w=true;Q.step(.05,1100);assert.equal(o.floor,1,'In die Treppe laufen steigt auf');front(o);o.in.jy=1;Q.step(.05,1200);assert.equal(o.floor,0,'Joystick-Lauf in die Treppe steigt wieder ab');
o=make(3);front(o);const cv=o.el.querySelector('#ofpCv'),touch={pointerId:7,clientX:160,clientY:260,pointerType:'touch'};cv.events.pointerdown[0](touch);cv.events.pointerup[0](touch);assert.equal(o.floor,1,'Kurzer Touch auf die Treppe nutzt den vollständigen Canvas-Eingabepfad');assert.equal(o.texs.length,2,'Nur Standorttafel und Personalposter, keine Firmenschild-Textur');
o=make(4);front(o);o.key({code:'KeyF',type:'keydown',ctrlKey:true,preventDefault(){throw Error('Strg+F darf nicht abgefangen werden');}});assert.equal(o.floor,0);o.key({code:'KeyF',type:'keydown',repeat:false,preventDefault(){}});assert.equal(o.floor,1,'F benutzt das aktuelle Treppenziel');o.key({code:'KeyF',type:'keydown',repeat:true,preventDefault(){}});assert.equal(o.cardOpen,false,'Gehaltenes F löst keine Folgeaktion aus');
front(o);o.in.jy=1;Q.step(.05,1300);assert.equal(o.stairChoice,true);o.key({code:'Escape',type:'keydown'});assert.equal(o.stairChoice,false);assert.equal(o.floor,1,'Abbrechen wechselt keine Etage');
const button=o.el.querySelector('.ofp-floors').querySelectorAll('[data-ofl]').find(x=>x.dataset.ofl==='2');button.onclick();assert.equal(o.floor,2,'Vorhandene Etagenknöpfe funktionieren weiter');
front(o);o.occ.push([[4.5,0,-4.5],[4.6,3,-2.2]]);assert.equal(Q.stairTarget(o.testRay,o.eye),null,'Keine Treppenaktion durch ein Möbelstück');o.occ.pop();
o.pos=[0,0];Q.syncOfficeCamera(0);assert.equal(Q.useStairs(),false,'Keine Benutzung aus der Ferne');assert.equal(Q.changeFloor(0,true),false,'Treppe überspringt keine Etage');
/* Lokale Küchenzustände bleiben über denselben Auf-/Abbauweg erhalten. */
o=make(3,'barista');const cup=o.kitRuntime.items.find(i=>i.kind==='cup');cup.fill=1;cup.location='held';o.kitRuntime.held=cup;
front(o);Q.useStairs();assert.equal(o.kitchenStates.get(0).items.find(i=>i.id===cup.id).location,'home');front(o);Q.useStairs();assert.equal(o.kitRuntime.items.find(i=>i.id===cup.id).fill,1,'Kaffeezustand bleibt beim Rückweg erhalten');
console.log('OK: '+transitions+' Auf-/Abgänge in Bürogebäude/Konzern mit vier Küchentypen, begehbarer Zugang, Touch-Aktion/F, Etagenwahl/Abbruch, Kollisionsschutz, Ressourcenfreigabe, Küchenzustände und unveränderter Spielstand ohne Firmenschild.');
