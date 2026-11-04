/* v298: Sichtbare Modellanschlüsse, Mausausrichtung und echte Monitorvorgänge.
   Aufruf: node office-appearance-v298.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
/* Nur Node-Kernmodule für die Regression; die zusätzliche Sichtprüfung verwendet echte Canvas-Texturen. */
const createCanvas=(width,height)=>{
 const g={font:'12px sans-serif',textAlign:'left',commands:[],save(){},restore(){},scale(){},fillRect(){},
  measureText(t){return {width:String(t).length*(Number((this.font.match(/([0-9.]+)px/)||[])[1])||12)*.56};},
  fillText(t,x,y){assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=width&&y>=0&&y<=height);this.commands.push(String(t));}};
 return {width,height,getContext:()=>g};
};
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const C={console,performance:{now:()=>0}};C.window=C;vm.createContext(C);
for(const f of ['avatar.js','gl3d.js','officekitchen.js'])vm.runInContext(read(f),C);
const names='lookOf,hairMesh,headMesh,foreMesh,handMesh,mouseMesh,GRIPS,screenData,screenCanvas,updateScreens,buildFigure,animFigure,nodePoint,R3,MOUSE_ANCHOR';
vm.runInContext(read('officefp.js').replace('return { enter, leave,','return { qa:{'+names+',setO:o=>{O=o}}, enter, leave,')+'\nthis.Q=OFFICE3D.qa;',C);const Q=C.Q;
const run=s=>vm.runInContext(s,C);
function ray(O,D,A,B,C){
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const e1=sub(B,A),e2=sub(C,A),p=cross(D,e2),det=dot(e1,p);if(Math.abs(det)<1e-10)return 0;
 const T=sub(O,A),u=dot(T,p)/det;if(u<-1e-7||u>1+1e-7)return 0;const q=cross(T,e1),v=dot(D,q)/det;if(v<-1e-7||u+v>1+1e-7)return 0;const t=dot(e2,q)/det;return t>0?t:0;
}
let hairCases=0;
for(const sex of [0,1])for(let hair=0;hair<8;hair++)for(const acc of [0,2,3]){
 const L=Q.lookOf({id:'hair-'+sex+'-'+hair,role:'disp',av:{sex,hair,hairColor:1,acc}});
 const h=Q.headMesh(L).v,cap=Q.hairMesh(L).v;
 assert.ok(h.every(Number.isFinite)&&h.length/27<6500,'Kopf bleibt endlich und im Budget');
 if(L.style!=='glatze'){
  assert.ok(cap.length>0);
  for(const th of [.08,.4,.7])for(let j=0;j<8;j++){
   const az=j/8*Math.PI*2,d=[Math.sin(th)*Math.sin(az),Math.cos(th)*1.06,Math.sin(th)*Math.cos(az)],len=Math.hypot(...d),D=d.map(v=>v/len);let hit=0;
   for(let i=0;i<cap.length;i+=27)hit=Math.max(hit,ray([0,.13,0],D,cap.slice(i,i+3),cap.slice(i+9,i+12),cap.slice(i+18,i+21)));
   assert.ok(hit>.118*len*1.02,'Keine freie Kopfhaut im oberen Haarbereich: '+JSON.stringify({style:L.style,sex,hair,acc,th,az,hit,min:.118*len*1.02}));
  }
 }
 hairCases++;
}
for(const side of [-1,1])for(const outfit of ['bluse','blaujacke','warnweste','kapuzenpulli','lederjacke','latzhose'])for(const grip of Object.keys(Q.GRIPS)){
 const L=Q.lookOf({id:'wrist',role:'zoll',av:{outfit:['bluse','blaujacke','warnweste','kapuzenpulli','lederjacke','latzhose'].indexOf(outfit)}});
 const hand=Q.handMesh(L,side,grip).v,fore=Q.foreMesh(L,side).v;
 assert.ok(hand.every(Number.isFinite)&&fore.every(Number.isFinite));
 // Der durchgehende Handwurzelbereich schließt mindestens 12 mm hinter dem anatomischen Handgelenk an.
 assert.ok(Math.min(...Array.from({length:hand.length/9},(_,i)=>hand[i*9+2]))<=-.046);
 assert.ok(hand.length/27<3000&&fore.length/27<800);
}
const mouse=Q.mouseMesh().v,verts=Array.from({length:mouse.length/9},(_,i)=>mouse.slice(i*9,i*9+9));
assert.ok(mouse.every(Number.isFinite));assert.ok(mouse.length/27<2000);
assert.ok(Math.min(...verts.map(v=>v[1]))>=-1e-10,'Maus steht auf der Unterlage');
const wheel=verts.filter(v=>Math.abs(v[6]-139/255)<1e-8&&Math.abs(v[7]-153/255)<1e-8);
assert.ok(wheel.length>0&&wheel.every(v=>v[2]>0),'Scrollrad vorn zu den Fingern');
const rear=Math.max(...verts.filter(v=>v[2]<-.006).map(v=>v[1])),front=Math.max(...verts.filter(v=>v[2]>.012).map(v=>v[1]));
assert.ok(rear>front,'Handballenauflage hinten höher als die Tasten');
const node=o=>Object.assign({x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1,visible:true},o&&o.s?{sx:o.s,sy:o.s,sz:o.s}:{},o||{});
const R={node:(mesh,o)=>Object.assign(node(o),{mesh}),addChild:(p,n)=>n};
for(let outfit=0;outfit<6;outfit++){
 const state={R,t:0,reduced:false,staff:[],deaths:0};Q.setO(state);
 const F={p:{id:'P2',name:'Mauskontakt',role:'disp',av:{outfit}},x:0,z:0,dz:0};Q.buildFigure(R,F,(k,fn)=>fn());state.staff=[F];F.act='mouse';F.actT=0;F.actDur=20;
 for(let i=0;i<180;i++){
  state.t+=1/60;Q.animFigure(F,1/60,state.t*1000,{d:10,front:false,l:[0,1,3]});
  const contact=Q.nodePoint(F.mouse,Q.MOUSE_ANCHOR),hand=F.arm[1];
  assert.ok(Math.hypot(contact[0]-hand.C[0],contact[2]-hand.C[2])<2e-7,'Maus folgt der Hand ohne seitlichen Versatz (Float32-Transform)');
  assert.ok(Math.abs(F.mouse.ry-hand.hand.ry)<1e-8,'Tasten zeigen zur Fingerrichtung');
  if(i>120)assert.ok(Math.abs(contact[1]-hand.C[1])<.01,'Handballen bleibt auf dem Gehäuse');
 }
}
run(`var S={time:1440,fleet:[{uid:'v1',type:'truck',phase:'haul',driver:'driver',jobId:'J1'},{uid:'v2',type:'truck',phase:'load',jobId:'J2'}],jobs:[
 {id:'J1',curLeg:0,order:{id:'A11',from:'berlin',to:'hamburg',cargo:'pal',weight:12000,viaBase:'B'},legs:[{from:'berlin',to:'hamburg',veh:'v1',done:false}]},
 {id:'J2',curLeg:0,order:{id:'A12',from:'berlin',to:'dresden',cargo:'pak',weight:800,viaBase:'B'},legs:[{from:'berlin',to:'dresden',veh:'v2',done:false}]},
 {id:'OTHER',order:{id:'FREMD',from:'hamburg',to:'dresden',cargo:'pal',weight:1,viaBase:'other'},legs:[]} ]};
 var N={berlin:{short:'Berlin'},hamburg:{short:'Hamburg'},dresden:{short:'Dresden'}};var CARGO={pal:{name:'Palettenware'},pak:{name:'Pakete'}};
 var B={id:'B',node:'berlin',vehicles:['v1','v2'],staff:[{id:'disp',name:'Lena Beispiel',role:'disp'},{id:'driver',name:'Jan Beispiel',role:'fahr'},{id:'ums',name:'Uta Beispiel',role:'ums'},{id:'zoll',name:'Zora Beispiel',role:'zoll'}]};
 var vType=()=>({name:'Mercedes-Benz Actros'}),dayOf=t=>Math.floor(t/1440)+1;`);
const B=run('B'),S=run('S');const state={b:B,staff:B.staff.map(p=>({p,act:'type'})),screens:[],R:{texUpdate:()=>{state.updates++;}},updates:0};Q.setO(state);
const saved=JSON.stringify({B,S});
for(const p of B.staff){const d=Q.screenData(B,p);assert.ok(d.work);assert.notEqual(d.work.id,'FREMD');assert.ok(d.work.from==='Berlin');}
assert.equal(Q.screenData(B,B.staff[1]).work.id,'A11','Feste Fahrerzuweisung');
S.jobs.unshift({id:'FUTURE',curLeg:0,order:{id:'SPAETER',from:'berlin',to:'hamburg',viaBase:'B'},legs:[{veh:'v1',done:false}]});
assert.equal(Q.screenData(B,B.staff[1]).work.id,'A11','Aktuelle Fahrt hat Vorrang vor vorgemerktem Auftrag');S.jobs.shift();
assert.equal(Q.screenData(B,B.staff[2]).work.id,'A12','Umschlag zeigt echte Beladung bevorzugt');
const d=Q.screenData(B,B.staff[3]);assert.equal(d.work.cargo,'Palettenware');assert.equal(d.work.weight,'12 t');assert.equal(d.activity,'Erfasst Daten');
assert.equal(d.work.status,'Unterwegs');
run(`var haltLabel=f=>f.halt?f.halt.label:null;S.fleet[0].halt={label:'Wartet an der Grenze'};`);
assert.equal(Q.screenData(B,B.staff[1]).work.status,'Wartet an der Grenze','Reale Unterbrechung statt irreführendem Fahrstatus');delete S.fleet[0].halt;
state.staff[3].act='note';assert.equal(Q.screenData(B,B.staff[3]).activity,'Schreibt Notizen');
state.staff[3].act='cup';assert.equal(Q.screenData(B,B.staff[3]).paused,true);state.staff[3].shock={};assert.equal(Q.screenData(B,B.staff[3]).activity,'Arbeit unterbrochen');delete state.staff[3].shock;
state.screens=B.staff.map(p=>{const c=createCanvas(384,240);return {p,c,t:{},next:0,sig:Q.screenCanvas(c,B,p)};});
Q.updateScreens(1000);assert.equal(state.updates,0,'Unveränderte Ansichten nicht neu hochladen');
for(const f of state.staff)f.act='phone';Q.updateScreens(2000);assert.equal(state.updates,1,'Maximal eine Textur pro Durchgang');
Q.updateScreens(2016);Q.updateScreens(2032);Q.updateScreens(2048);assert.equal(state.updates,4,'Alle geänderten Monitore ohne Verhungern aktualisiert');
assert.equal(JSON.stringify({B,S}),saved,'Monitor und Animation verändern keine gespeicherten Geschäfts-/Personaldaten');
S.jobs=[];assert.equal(Q.screenData(B,B.staff[0]).work,null,'Keine erfundenen Aufträge bei leerer Liste');
assert.equal(JSON.parse(Q.screenCanvas(createCanvas(384,240),B,B.staff[0])).work,null);
console.log('OK: '+hairCases+' Haar-/Kopfvarianten ohne Kopfhautstreifen, 96 Hand-/Outfitvarianten, animierter Mauskontakt in sechs Outfits, vier Rollen mit echten Aufträgen, Pause/Notfall, begrenzte Monitoraktualisierung und unveränderte Spieldaten.');
