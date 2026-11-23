"use strict";
/* v467: Modellbezogene Rennwagen. Maße in Metern, +Z ist die Fahrzeugfront.
   Gallardo: frühes Coupé (2006–2008), passend zum vorhandenen Garagenfoto. */
const RACECARS=(()=>{
 const gallardo=Object.freeze({length:4.30,width:1.90,height:1.165,wheelX:.81,wheelY:.335,wheelRadius:.335,axles:Object.freeze([-1.32,1.24]),exhaustZ:-2.25,exhaustY:.30,exhaustX:.61});
 const generic=Object.freeze({wheelX:.98,wheelY:.40,wheelRadius:.39,axles:Object.freeze([-1.35,1.36]),exhaustZ:-2.65,exhaustY:.52,exhaustX:.55});
 const rig=c=>c&&c.id==='lgal'?gallardo:generic;
 function body(c,paint){
  if(!c||c.id!=='lgal')return null;
  const b=new G3.MB(),dark=0x171e25,glass=0x263e4b,trim=0x30383e;
  const shade=(color,f)=>G3.col(color).map(v=>v*f),light=shade(paint,1.05),shadow=shade(paint,.80);
  const face=(P,col,N)=>{const a=P[0],v=P[1].map((x,i)=>x-a[i]),w=P[2].map((x,i)=>x-a[i]),n=[v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]];if(n.reduce((s,x,i)=>s+x*N[i],0)<0)P=P.slice().reverse();b.quad(...P,col);};
  // Durchgehender Unterboden, niedrige Nase und aufgespannte Schulterflächen.
  b.box(1.53,.10,3.85,dark,{y:.15});
  const stations=[[-2.15,.86,.69],[-1.75,.94,.77],[-.80,.95,.81],[.62,.93,.81],[1.43,.91,.70],[2.15,.85,.55]];
  for(let i=1;i<stations.length;i++){
   const [z0,w0,h0]=stations[i-1],[z1,w1,h1]=stations[i];
   face([[-w0,h0,z0],[w0,h0,z0],[w1,h1,z1],[-w1,h1,z1]],paint,[0,1,0]);
  }
  const top=z=>{let i=1;while(i<stations.length-1&&stations[i][0]<z)i++;const a=stations[i-1],c=stations[i],t=(z-a[0])/(c[0]-a[0]);return {w:a[1]+(c[1]-a[1])*t,h:a[2]+(c[2]-a[2])*t};};
  const lower=z=>{for(const axle of gallardo.axles){const d=z-axle;if(Math.abs(d)<.37)return .335+Math.sqrt(.37*.37-d*d);}return .22;};
  const zs=[-2.15,-1.86,-.87,-.66,.58,.78,1.75,2.15];for(const axle of gallardo.axles)for(let i=0;i<=12;i++)zs.push(axle-.37+Math.min(.74,i*.74/12));zs.sort((a,b)=>a-b);
  for(const side of [-1,1]){
   for(let i=1;i<zs.length;i++){const z0=zs[i-1],z1=zs[i];if(z1-z0<1e-5)continue;const a=top(z0),c=top(z1);face([[side*a.w,lower(z0),z0],[side*c.w,lower(z1),z1],[side*c.w,c.h,z1],[side*a.w,a.h,z0]],paint,[side,0,0]);}
   // Schwarze Radhauskante – die Öffnung selbst bleibt wirklich frei.
   for(const axle of gallardo.axles)for(let j=0;j<12;j++){const a=j/12*Math.PI,c=(j+1)/12*Math.PI,z0=axle+Math.cos(a)*.37,z1=axle+Math.cos(c)*.37;face([[side*.947,.335+Math.sin(a)*.37,z0],[side*.947,.335+Math.sin(c)*.37,z1],[side*.947,.335+Math.sin(c)*.397,axle+Math.cos(c)*.397],[side*.947,.335+Math.sin(a)*.397,axle+Math.cos(a)*.397]],trim,[side,0,0]);}
   b.box(.07,.10,1.66,shadow,{x:side*.917,y:.20,z:-.03});
   face([[side*.953,.32,-.78],[side*.953,.71,-.78],[side*.953,.73,-1.02],[side*.953,.40,-1.09]],dark,[side,0,0]);
   face([[side*.956,.32,-.68],[side*.956,.39,-.68],[side*.938,.72,.66],[side*.938,.69,.66]],light,[side,0,0]);
   b.box(.009,.31,.012,shadow,{x:side*.952,y:.34,z:-.68});b.box(.011,.027,.12,trim,{x:side*.952,y:.73,z:-.38});
   b.box(.12,.035,.07,trim,{x:side*.95,y:.83,z:.41});b.box(.19,.095,.19,paint,{x:side*1.01,y:.83,z:.42});
   b.box(.17,.065,.018,glass,{x:side*1.01,y:.85,z:.315});
  }
  // Flache Kabine, breite schräge Frontscheibe und kleine dreieckige Seitenfenster.
  const roofY=1.165;
  face([[-.70,.825,.69],[.70,.825,.69],[.58,roofY-.02,.08],[-.58,roofY-.02,.08]],glass,[0,1,1]);
  face([[-.58,roofY,.07],[.58,roofY,.07],[.60,roofY-.025,-.79],[-.60,roofY-.025,-.79]],paint,[0,1,0]);
  face([[-.60,roofY-.025,-.82],[.60,roofY-.025,-.82],[.66,.84,-1.27],[-.66,.84,-1.27]],glass,[0,1,-1]);
  for(const side of [-1,1]){
   face([[side*.70,.825,.61],[side*.59,roofY-.035,.04],[side*.61,roofY-.052,-.77],[side*.78,.82,-.96]],glass,[side,0,0]);
   face([[side*.70,.825,.69],[side*.58,roofY-.02,.08],[side*.59,roofY-.035,.04],[side*.72,.82,.62]],paint,[side,1,0]);
   face([[side*.61,roofY-.052,-.77],[side*.60,roofY-.025,-.79],[side*.84,.81,-1.16],[side*.78,.82,-.96]],paint,[side,1,-1]);
   // Lange Trapezleuchten liegen in den Kotflügeln, nicht als Würfel vor der Nase.
   face([[side*.70,.605,2.02],[side*.85,.625,1.89],[side*.83,.739,1.20],[side*.65,.747,1.29]],0xb7c9d0,[0,1,0]);
   for(const [z,r] of [[1.47,.062],[1.75,.052]])b.cyl(r,r,.008,12,0xe6ebdf,{x:side*.752,y:.71-(z-1.4)*.16,z,rx:.16});
   face([[side*.64,.754,1.30],[side*.63,.753,1.32],[side*.49,.835,.70],[side*.505,.834,.69]],shadow,[0,1,0]);
  }
  face([[-.87,.23,2.15],[.87,.23,2.15],[.85,.55,2.15],[-.85,.55,2.15]],paint,[0,0,1]);
  for(const side of [-1,1]){face([[side*.25,.26,2.156],[side*.78,.26,2.156],[side*.78,.47,2.156],[side*.29,.47,2.156]],dark,[0,0,1]);
   for(let i=0;i<4;i++)b.box(.008,.16,.008,0x354148,{x:side*(.33+i*.115),y:.28,z:2.165});}
  b.box(.37,.18,.014,trim,{y:.27,z:2.17});b.box(1.76,.055,.13,dark,{y:.18,z:2.12});
  b.tri([.038,.607,1.88],[-.038,.607,1.88],[0,.598,1.96],0xcab363);
  // Kurzes, breites Heck mit Kühlgittern, roten Bändern und vier Endrohren.
  face([[.86,.23,-2.15],[-.86,.23,-2.15],[-.86,.69,-2.15],[.86,.69,-2.15]],paint,[0,0,-1]);
  b.box(1.52,.17,.02,dark,{y:.40,z:-2.162});
  for(const side of [-1,1]){b.box(.48,.105,.022,0xa4262c,{x:side*.62,y:.615,z:-2.163});b.box(.41,.018,.027,0xf1694f,{x:side*.62,y:.676,z:-2.168});}
  b.box(.37,.16,.025,0x6b7476,{y:.405,z:-2.18});b.box(1.57,.13,.16,dark,{y:.19,z:-2.12});
  for(const x of [-.73,-.52,.52,.73]){b.cyl(.063,.063,.10,12,0x8d989c,{x,y:.30,z:-2.16,rx:Math.PI/2});b.cyl(.046,.046,.006,12,dark,{x,y:.30,z:-2.225,rx:Math.PI/2});}
  for(const x of [-.33,-.11,.11,.33])b.box(.022,.12,.22,trim,{x,y:.18,z:-2.06});
  b.plate(1.15,.42,dark,{z:-1.55,y0:.795});for(let j=0;j<6;j++)b.box(1.12,.014,.025,shadow,{y:.798,z:-1.37-j*.065});
  return b;
 }
 function wheel(c){
  if(!c||c.id!=='lgal')return null;const b=new G3.MB();
  b.cyl(.335,.335,.24,20,0x171b20,{x:.12,rz:Math.PI/2});b.cyl(.242,.242,.246,20,0x586168,{x:.123,rz:Math.PI/2});b.cyl(.220,.220,.250,20,0x1a2229,{x:.125,rz:Math.PI/2});
  for(let j=0;j<5;j++)for(const d of [-.075,.075]){const a=j/5*Math.PI*2+d;b.box(.012,.177,.023,0x839097,{x:.132,y:Math.cos(a)*.144,z:Math.sin(a)*.144,rx:a,c:true});}
  b.cyl(.052,.052,.01,12,0x354047,{x:.14,rz:Math.PI/2});b.cyl(.018,.018,.012,8,0xc3a752,{x:.151,rz:Math.PI/2});return b;
 }
 return {body,wheel,rig};
})();
