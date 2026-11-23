"use strict";
/* v461: Ein zusammenhängender Rundkurs, für Miniatur und Fahrspiel identisch.
   Metereinheiten im Fahrspiel; die Übersicht verwendet eine feste Verkleinerung. */
const RACETRACK=(()=>{
 const W=26,D=22,HALF=7.5,START=100,N=480,TAU=Math.PI*2;
 /* v467: Jeder Umbau besitzt eigene Kurven, Projektion und Geometrie.
    Die Startgerade und die Grundstücksgröße bleiben für alle Varianten gleich. */
 const layouts=[
  {id:'werder',name:'Werder Ring',tag:'Ausgewogen',description:'Lange Nitro-Gerade, schnelle Bögen und technische S-Kurven.',points:[[-155,142],[-60,125],[60,125],[155,115],[195,65],[185,5],[145,-24],[145,-53],[181,-94],[145,-155],[65,-158],[30,-105],[-30,-107],[-63,-153],[-144,-145],[-193,-90],[-173,-27],[-106,5],[-90,35],[-112,64],[-165,80],[-200,105],[-190,135]]},
  {id:'hafen',name:'Hafenring',tag:'Schnelle Bögen',description:'Flüssigere Kurven und längere Vollgasabschnitte zwischen den Containern.',points:[[-155,142],[-60,125],[60,125],[155,115],[195,65],[185,-15],[190,-102],[135,-152],[50,-155],[0,-130],[-55,-140],[-140,-140],[-192,-88],[-173,-27],[-106,5],[-90,35],[-112,64],[-165,80],[-200,105],[-190,135]]},
  {id:'kurven',name:'Kurvenwerk',tag:'Drift & Bremspunkte',description:'Zusätzliche Richtungswechsel und eine tiefere S-Kombination fordern saubere Linien.',points:[[-155,142],[-60,125],[60,125],[155,115],[195,65],[185,5],[145,-24],[145,-53],[181,-94],[145,-155],[65,-158],[15,-118],[-35,-85],[-80,-110],[-130,-145],[-185,-110],[-178,-50],[-122,-6],[-90,35],[-112,64],[-165,80],[-200,105],[-190,135]]}
 ];
 function make(def){
 const controls=def.points;
 const cat=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
 const points=[],lengths=[0];let length=0;
 for(let i=0;i<=N;i++){const u=i/N*controls.length,j=Math.floor(u)%controls.length,t=u-Math.floor(u),q=[];
  for(let k=0;k<2;k++)q.push(cat(controls[(j+controls.length-1)%controls.length][k],controls[j][k],controls[(j+1)%controls.length][k],controls[(j+2)%controls.length][k],t));
  points.push(q);if(i){length+=Math.hypot(q[0]-points[i-1][0],q[1]-points[i-1][1]);lengths.push(length);}
 }
 const wrap=s=>{s%=length;return s<0?s+length:s;};
 function at(s,lane=0){s=wrap(s);let a=0,b=N;while(b-a>1){const m=(a+b)>>1;if(lengths[m]>s)b=m;else a=m;}const f=(s-lengths[a])/(lengths[a+1]-lengths[a]),p=points[a],q=points[a+1],prev=points[(a+N-1)%N],next=points[(a+2)%N],tx=(q[0]-prev[0])*(1-f)+(next[0]-p[0])*f,tz=(q[1]-prev[1])*(1-f)+(next[1]-p[1])*f,l=Math.hypot(tx,tz),nx=tz/l,nz=-tx/l;
  return {x:p[0]+(q[0]-p[0])*f+nx*lane,z:p[1]+(q[1]-p[1])*f+nz*lane,heading:Math.atan2(tx,tz),nx,nz,s,i:a};
 }
 function near(x,z,hint){let best=null,ds=Infinity;const check=i=>{i=(i+N)%N;const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/l2)),qx=a[0]+dx*t,qz=a[1]+dz*t,d=(qx-x)**2+(qz-z)**2;
   if(d<ds){ds=d;const l=Math.sqrt(l2);best={x:qx,z:qz,d:Math.sqrt(d),nx:dz/l,nz:-dx/l,s:lengths[i]+Math.sqrt(l2)*t,i,heading:Math.atan2(dx,dz)};}};
  if(hint!=null)for(let j=-18;j<=18;j++)check(hint+j);
  if(!best||ds>25*25)for(let i=0;i<N;i++)check(i);return best;
 }
 function strip(b,a,c,lo,hi,color,y){if(lo>hi)[lo,hi]=[hi,lo];const A=at(lengths[a],lo),B=at(lengths[a],hi),C=at(lengths[c%N],hi),E=at(lengths[c%N],lo);b.quad([B.x,y,B.z],[A.x,y,A.z],[E.x,y,E.z],[C.x,y,C.z],color);}
 function stage(mini=false){const b=new G3.MB(),step=mini?4:1;
  b.plate(510,420,0x6e8e51,{y0:-.08});
  // Durchgängige Fahrbahn, Kies-Auslauf, Randsteine und äußere Leitplanke.
  for(let i=0;i<N;i+=step){
   strip(b,i,i+step,-HALF-5,HALF+5,0xc0aa7b,-.015);strip(b,i,i+step,-HALF,HALF,0x37424b,.01);
   for(const side of [-1,1]){strip(b,i,i+step,side*HALF,side*(HALF+.9),i%8<4?0xf4ecdf:0xd65b4e,.035);strip(b,i,i+step,side*(HALF-.22),side*(HALF-.08),0xefe9d5,.025);}
   if(i%12<5)strip(b,i,i+step,-.075,.075,0xaeb1a7,.021);
   if(!mini&&i%3===0)for(const side of [-1,1]){const p=at(lengths[i],side*(HALF+8));b.box(.3,.8,4,0xd9e0dd,{x:p.x,y:0,z:p.z,ry:p.heading});}
  }
  // Ziellinie und abgesetzte Startplätze.
  for(let x=-7;x<7;x++)for(let j=0;j<2;j++){const p=at(START+j*1.15,x+.5);b.plate(.95,1.1,(x+j)%2?0x172633:0xfff8df,{x:p.x,y0:.045,z:p.z,ry:p.heading});}
  for(let i=0;i<8;i++){const p=at(START-12-i*7.5,i%2?2.8:-2.8);b.plate(2.5,.14,0xeee8d6,{x:p.x,y0:.04,z:p.z,ry:p.heading});}
  // Boxengasse, Garagen, Zuschauertribüne, Startbrücke und Tunnel.
  b.plate(115,13,0x58616a,{x:-70,z:147,y0:.02});
  for(let i=0;i<5;i++){const x=-110+i*20;b.box(17,5,12,0xd8d2bd,{x,y:0,z:163});b.box(17.8,.45,13,0x233c50,{x,y:5,z:163});b.box(11,3.8,.2,[0x326ed0,0x269b85,0xd4554e][i%3],{x,y:.1,z:156.85});}
  for(let r=0;r<5;r++){b.box(75,1+r*.75,2.4,0x85949b,{x:65,z:150+r*2.5});for(let i=0;i<24;i+=mini?4:1)b.box(1.7,.55,.65,(r+i)%3?0x2f6fed:0xf0c64a,{x:31+i*2.9,y:1+r*.75,z:150+r*2.5});}
  const start=at(START);for(const side of [-1,1])b.box(.8,8,.8,0x26394a,{x:start.x+start.nx*side*10,z:start.z+start.nz*side*10});b.box(21,2.6,1.2,0x18394e,{x:start.x,y:6,z:start.z,ry:start.heading});
  for(let i=0;i<6;i++)b.box(1,.5,.2,i%2?0xf6c84f:0xf7f0df,{x:start.x+start.nx*(-7+i*2.5),y:6.8,z:start.z+start.nz*(-7+i*2.5),ry:start.heading});
  for(let i=0;i<5;i++){const p=at(length*.12+i*9);b.box(18,.5,1,0x264f66,{x:p.x,y:5.8,z:p.z,ry:p.heading});for(const side of [-1,1])b.box(.5,5.8,.5,0x2d7893,{x:p.x+p.nx*side*9,y:0,z:p.z+p.nz*side*9});}
  for(let i=0;i<18;i++){const p=at(length*i/18,19+(i%3)*4),color=[0x316d9b,0xbd6944,0xd2b556,0x6c8b79][i%4];b.box(6,2.8,11,color,{x:p.x,y:0,z:p.z,ry:p.heading});if(!mini)for(let j=-2;j<=2;j++)b.box(.12,2.6,.08,0x263b48,{x:p.x+j,y:.1,z:p.z+5.55,ry:p.heading});}
  // Kiesige Inneninseln und Felsgruppen, bewusst ohne Wald oder Bäume.
  for(let i=0;i<15;i++){const a=i*2.399,x=Math.cos(a)*(70+i*4),z=Math.sin(a)*(55+i*2);if(near(x,z).d<25)continue;b.ico(3+i%3,0x899081,{x,y:1,z,sx:1.8,sy:.65,sz:1.2});}
  return b;
 }
 function miniature(){const b=new G3.MB();b.merge(stage(true),{s:.045,y:.045});
  // Eingefriedete Baufläche und Einfahrt statt einer ungerahmten grünen Platte.
  for(const side of [-1,1]){b.box(.08,.11,19.5,0x41594d,{x:side*11.7,y:.045});for(let z=-9.7;z<=9.7;z+=1.2)b.box(.09,.3,.09,0x294550,{x:side*11.7,y:.05,z});b.box(23.4,.11,.08,0x41594d,{y:.045,z:side*9.75});}
  for(let x=-11.7;x<=11.7;x+=1.2)for(const side of [-1,1]){if(side===1&&Math.abs(x)<1.6)continue;b.box(.09,.3,.09,0x294550,{x,y:.05,z:side*9.75});}
  b.plate(2.9,1.2,0xb8aa86,{z:9.7,y0:.06});for(const x of [-1.55,1.55])b.box(.14,.8,.14,0x233e51,{x,y:.05,z:9.75});b.box(3.25,.28,.14,0x2f6fed,{y:.65,z:9.75});
  return b;
 }
 return {id:def.id,name:def.name,W,D,HALF,START,N,points,lengths,length,at,near,stage,miniature};
 }
 function car(c,color=0x2f6fed){if(typeof RACECARS!=='undefined'){const own=RACECARS.body(c,color);if(own)return own;}const b=new G3.MB(),suv=c.body==='suv',open=c.body==='roadster',classic=c.body==='classic',hyper=c.cls==='hyper'||c.track,H=suv?1.45:classic?1.02:.82,W=suv?2.05:hyper?2.02:1.86;
  b.box(W,.43,4.45,color,{y:.35});b.box(W*.94,.24,1.1,color,{y:.72,z:1.42});b.box(W*.97,.2,.9,color,{y:.70,z:-1.65});
  if(classic)b.ico(1,color,{y:.86,z:-.2,sx:W*.48,sy:.45,sz:1.35,detail:1});
  if(!open){
   const y=.86,top=.86+H*.66,wide=W*.40,roof=W*.32,f=suv?.65:.28,rear=suv?-1.25:-.83;
   // Schräge Scheiben und ein schmaleres Dach lassen den Aufbau des Autos erkennen.
   b.quad([-wide,y,1],[wide,y,1],[roof,top,f],[-roof,top,f],0x284b60);
   b.quad([wide,y,-1.48],[-wide,y,-1.48],[-roof,top,rear],[roof,top,rear],0x284b60);
   for(const side of [-1,1]){const lo=side*wide,hi=side*roof,pts=[[lo,y,1],[lo,y,-1.48],[hi,top,rear],[hi,top,f]];if(side<0)pts.reverse();b.quad(...pts,0x1c394c);b.box(.07,H*.59,.09,color,{x:side*(wide+roof)/2,y:.87,z:-.35});}
   b.box(roof*2,.10,f-rear,color,{y:top,z:(f+rear)/2});
  }else{b.box(W*.8,.24,1.15,0x15242f,{y:.85,z:-.35});for(const side of [-1,1]){b.box(.55,.55,.52,0x51433c,{x:side*.43,y:.85,z:-.6});b.box(.07,.65,.08,color,{x:side*W*.38,y:.8,z:.48});}b.quad([-W*.38,.88,.76],[W*.38,.88,.76],[W*.35,1.35,.48],[-W*.35,1.35,.48],0x25475b);}
  b.box(W*.87,.18,.12,0x26353d,{y:.43,z:2.27});b.box(W*.87,.18,.12,0x26353d,{y:.43,z:-2.27});
  for(const side of [-1,1]){if(c.b==='porsche'||classic)b.ico(.22,0xffedb0,{x:side*.66,y:.82,z:2.04,sz:.35});else b.box(.49,.15,.08,0xffedb0,{x:side*.64,y:.83,z:2.26});b.box(.51,.12,.08,0xe45852,{x:side*.65,y:.82,z:-2.27});b.box(.15,.15,.10,0x526a79,{x:side*W*.54,y:1.05,z:.25});}
  if(c.b==='bmw'){for(const x of [-.16,.16])b.box(.2,.22,.1,0x17232d,{x,y:.6,z:2.28});}
  if(hyper||/gt3|gt2/.test(c.id||'')){b.box(2.05,.10,.50,0x222f39,{y:1.23,z:-1.9});for(const x of [-.62,.62])b.box(.12,.45,.12,0x222f39,{x,y:.82,z:-1.9});}
  return b;
 }
 function wheel(c){if(typeof RACECARS!=='undefined'){const own=RACECARS.wheel(c);if(own)return own;}const b=new G3.MB();b.cyl(.39,.39,.24,12,0x1d252d,{x:.12,rz:Math.PI/2});b.cyl(.22,.22,.26,10,0xa8b4b9,{x:.13,rz:Math.PI/2});return b;}
 const cache=new Map();
 const forId=id=>{const def=layouts.find(l=>l.id===id)||layouts[0];if(!cache.has(def.id))cache.set(def.id,make(def));return cache.get(def.id);};
 let active=forId('werder');
 const use=id=>{active=forId(id);return active;};
 const rig=c=>typeof RACECARS!=='undefined'?RACECARS.rig(c):{wheelX:.98,wheelY:.4,wheelRadius:.39,axles:[-1.35,1.36],exhaustX:.55,exhaustY:.52,exhaustZ:-2.65};
 function displayCar(c,color){const b=new G3.MB().merge(car(c,color),{}),r=rig(c);for(const side of [-1,1])for(const z of r.axles)b.merge(wheel(c),{x:side*r.wheelX,y:r.wheelY,z,ry:side<0?Math.PI:0});return b;}
 return {W,D,HALF,START,N,layouts:layouts.map(({id,name,tag,description})=>({id,name,tag,description})),forId,use,car,wheel,rig,displayCar,
  get id(){return active.id;},get name(){return active.name;},get points(){return active.points;},get lengths(){return active.lengths;},get length(){return active.length;},
  at:(...a)=>active.at(...a),near:(...a)=>active.near(...a),stage:(...a)=>active.stage(...a),miniature:(id)=>forId(id||active.id).miniature()};
})();
