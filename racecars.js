"use strict";
/* v470: Frühes Gallardo-Coupé mit geformten Blechen und echten Vertiefungen.
   Meter, +Z = Front. Fahrmaße, Achsen und Garagenlack aus v467 bleiben gleich. */
const RACECARS=(()=>{
 const gallardo=Object.freeze({length:4.30,width:1.90,height:1.165,wheelX:.81,wheelY:.335,wheelRadius:.335,axles:Object.freeze([-1.32,1.24]),exhaustZ:-2.25,exhaustY:.30,exhaustX:.61});
 const generic=Object.freeze({wheelX:.98,wheelY:.40,wheelRadius:.39,axles:Object.freeze([-1.35,1.36]),exhaustZ:-2.65,exhaustY:.52,exhaustX:.55});
 const rig=c=>c&&c.id==='lgal'?gallardo:typeof CARMODELS!=='undefined'&&c?CARMODELS.profile(c):generic;
 const mix=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),sub=(a,b)=>a.map((v,i)=>v-b[i]);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 function face(b,P,color,N,normals){for(let i=1;i<P.length-1;i++){let ids=[0,i,i+1],n=cross(sub(P[i],P[0]),sub(P[i+1],P[0]));if(Math.hypot(...n)<1e-9)continue;if(n.reduce((s,v,j)=>s+v*N[j],0)<0)ids=[0,i+1,i];b.tri(...ids.map(j=>P[j]),color,...(normals?ids.map(j=>normals[j]):[]));}}
 /* Weiche Blech-Normalen nur an diesem Modell, keine Änderung am Hof-Shader. */
 function patch(b,fn,nu,nv,color,N){
  const points=[],normals=[];
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const u=i/nu,v=j/nv,p=fn(u,v),du=sub(fn(Math.min(1,u+.001),v),fn(Math.max(0,u-.001),v)),dv=sub(fn(u,Math.min(1,v+.001)),fn(u,Math.max(0,v-.001)));let n=G3.norm(cross(du,dv));if(n.reduce((s,x,k)=>s+x*N[k],0)<0)n=n.map(x=>-x);points.push(p);normals.push(n);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const k=j*(nu+1)+i,ids=[k,k+1,k+nu+2,k+nu+1];face(b,ids.map(k=>points[k]),typeof color==='function'?color(i/nu,j/nv):color,N,ids.map(k=>normals[k]));}
 }
 function beam(b,a,c,r,color){const d=sub(c,a),h=Math.hypot(...d);if(h<1e-6)return;b.cyl(r,r,h,5,color,{notop:true,nobot:true,x:a[0],y:a[1],z:a[2],ry:Math.atan2(d[0],d[2]),rx:Math.acos(clamp(d[1]/h,-1,1))});}
 function body(c,paint){
  if(!c||c.id!=='lgal')return typeof CARMODELS!=='undefined'&&c?CARMODELS.body(c,paint):null;
  const b=new G3.MB(),dark=0x161e23,trim=0x333e43,glass=0x284551,shade=f=>G3.col(paint).map(v=>v*f);
  // z, Halbbreite, Haubenhöhe: weich interpoliert, Schulter über den Rädern angehoben.
  const stations=[[-2.15,.83,.67],[-2.02,.89,.72],[-1.72,.94,.79],[-1.32,.95,.80],[-.95,.94,.80],[-.65,.925,.80],[.45,.925,.79],[.80,.935,.78],[1.24,.94,.72],[1.62,.93,.65],[1.95,.89,.58],[2.15,.82,.52]];
  function sample(z,k){let i=0;while(i<stations.length-2&&stations[i+1][0]<z)i++;const a=stations[i],d=stations[i+1],p=stations[Math.max(0,i-1)],q=stations[Math.min(stations.length-1,i+2)],h=d[0]-a[0],t=clamp((z-a[0])/h,0,1),m=(d[k]-p[k])/(d[0]-p[0]),n=(q[k]-a[k])/(q[0]-a[0]);return (2*t*t*t-3*t*t+1)*a[k]+(t*t*t-2*t*t+t)*h*m+(-2*t*t*t+3*t*t)*d[k]+(t*t*t-t*t)*h*n;}
  const width=z=>Math.min(.95,sample(z,1)),endZ=(z,u)=>z-(z>1.8?.08*((z-1.8)/.35)**2:z<-1.9?-.05*((z+1.9)/.25)**2:0)*u**4;
  function top(z,u){const f=.075*Math.exp(-(((z-1.24)/.52)**2))+.085*Math.exp(-(((z+1.32)/.60)**2));return [width(z)*u,sample(z,2)+f*Math.exp(-(((Math.abs(u)-.84)/.21)**2))-.035*u**8,endZ(z,u)];}
  const lower=z=>{for(const axle of gallardo.axles){const d=z-axle;if(Math.abs(d)<.365)return .335+Math.sqrt(.365*.365-d*d);}return .225;};
  function side(s,z,y,offset=0){const edgeY=top(z,1)[1],t=clamp((y-.225)/Math.max(.1,edgeY-.225),0,1),noseTaper=z>1.95?.055*clamp((z-1.95)/.20,0,1)*clamp((edgeY-y)/(edgeY-.19),0,1)**2:0,waist=Math.exp(-(((z+.05)/.82)**4));return [s*(width(z)-.025*Math.sin(t*Math.PI)*waist+offset),y,endZ(z,1)-noseTaper];}
  patch(b,(u,v)=>top(mix(-2.15,2.15,v),mix(-1,1,u)),10,26,paint,[0,1,0]);
  b.box(1.50,.075,3.85,dark,{y:.15});
  const zs=[-2.15,-2.02,-1.72,-1.32,-.95,-.83,-.65,-.50,0,.45,.8,1.24,1.62,1.95,2.15];for(const axle of gallardo.axles)for(let i=0;i<=16;i++)zs.push(axle-.365+i*.73/16);zs.sort((a,b)=>a-b);
  const hole=z=>{const t=clamp((z+.95)/.45,0,1),lo=z<-.83?mix(.745,.36,(z+.95)/.12):mix(.36,.33,(z+.83)/.33);return [lo,mix(.745,.765,t)];};
  for(const s of [-1,1]){
   // Dunkle Radhausschalen schließen den Blick durch den Freiraum zum Reifen.
   for(const axle of gallardo.axles)for(let j=0;j<16;j++){const a=j*Math.PI/16,d=(j+1)*Math.PI/16,p=(r,t)=>[s*(width(axle)-.065),.335+Math.sin(t)*r,axle+Math.cos(t)*r];face(b,[p(.388,a),p(.388,d),p(.26,d),p(.26,a)],dark,[s,0,0]);}
   for(let i=1;i<zs.length;i++){const a=zs[i-1],d=zs[i];if(d-a<1e-6)continue;const loA=lower(a),loD=lower(d),hiA=top(a,1)[1],hiD=top(d,1)[1],inside=a>=-.950001&&d<=-.499999;
    const bands=inside?[[loA,hole(a)[0],loD,hole(d)[0]],[hole(a)[1],hiA,hole(d)[1],hiD]]:[[loA,hiA,loD,hiD]];
    for(const [l0,h0,l1,h1] of bands){if(h0<l0||h1<l1)continue;patch(b,(u,v)=>side(s,mix(a,d,u),mix(mix(l0,l1,u),mix(h0,h1,u),v)),1,2,paint,[s,0,0]);}
   }
   // Freie Ansaugöffnung: lackierte Laibung, dunkler Boden 7 cm hinter dem Blech.
   const outline=[[-.95,.745],[-.83,.36],[-.50,.33],[-.50,.765]],outer=outline.map(([z,y])=>side(s,z,y,.001)),inner=outline.map(([z,y])=>side(s,z,y,-.075));
   face(b,inner,dark,[s,0,0]);for(let i=0;i<4;i++){const j=(i+1)%4;face(b,[outer[i],outer[j],inner[j],inner[i]],shade(.62),[0,.55-(outer[i][1]+outer[j][1])/2,-.70-(outer[i][2]+outer[j][2])/2]);}
   for(let j=0;j<4;j++){const z=-.80+j*.065,[lo,hi]=hole(z);beam(b,side(s,z,lo+.025,-.064),side(s,z,hi-.025,-.064),.0045,trim);}
   // Schmaler Seitenschweller und feine, der Karosserie folgende Türfugen.
   patch(b,(u,v)=>side(s,mix(-.82,.79,u),mix(.205,.26,v),.009),8,1,shade(.78),[s,0,0]);
   const door=[[.72,.74],[.63,.33],[.42,.275],[-.40,.275],[-.49,.34],[-.49,.75]];
   for(let j=1;j<door.length;j++)beam(b,side(s,...door[j-1],.003),side(s,...door[j],.003),.0027,shade(.55));
   b.box(.008,.019,.13,trim,{x:s*(width(-.28)+.001),y:.743,z:-.28});
   // Geformte Spiegel mit dünnem Stiel und rückwärts gerichteter Spiegelfläche.
   beam(b,[s*.73,.84,.59],[s*.99,.88,.55],.018,dark);
   b.sphere(1,10,5,paint,{x:s*1.00,y:.895,z:.55,sx:.135,sy:.057,sz:.115,bottom:dark});
   face(b,[[s*.9,.863,.444],[s*1.09,.868,.444],[s*1.10,.917,.456],[s*.91,.924,.456]],0x455e68,[0,0,-1]);
   for(const axle of gallardo.axles)b.box(.033,.14,.065,0x777d7a,{x:s*.906,y:.30,z:axle+.14});
  }
  // Eine gemeinsame Dach-/Scheibenkontur schließt die Kabine ohne offene Spalten.
  const roof=(u,t)=>[mix(.585,.61,t)*u,1.165-.04*u*u-.018*(2*t-1)**2,-.10-.78*t+.015*u*u*(1-t)];
  const wind=(u,t)=>{const a=top(.78,u*.73/width(.78)),d=roof(u,0);return a.map((v,k)=>mix(v,d[k],t)+(k===1?.004*(1-t):0));};
  const rear=(u,t)=>{const a=top(-1.28,u*.70/width(-1.28)),d=roof(u,1);return a.map((v,k)=>mix(v,d[k],t)+(k===1?.004*(1-t):0));};
  patch(b,(u,v)=>roof(mix(-1,1,u),v),8,4,paint,[0,1,0]);
  for(const [fn,N] of [[wind,[0,.8,.6]],[rear,[0,.8,-.6]]]){
   patch(b,(u,v)=>fn(mix(-1,1,u),v),6,3,paint,N);
   patch(b,(u,v)=>{const p=fn(mix(-.955,.955,u),mix(.045,.96,v));return [p[0],p[1]+.004,p[2]];},6,3,(u,v)=>v>.7?0x365766:glass,N);
  }
  // Flache Wischer an der Scheibenbasis bleiben auch aus der Nähe lesbar.
  for(const s of [-1,1]){const a=wind(s*.18,.08),d=wind(s*.80,.075);a[1]+=.012;d[1]+=.012;beam(b,a,d,.009,dark);}
  for(const s of [-1,1]){
   const A=wind(s,0),B=roof(s,0),C=roof(s,1),D=rear(s,0),P=(u,v)=>A.map((x,k)=>mix(mix(x,D[k],u),mix(B[k],C[k],u),v));
   patch(b,P,6,2,paint,[s,.2,0]);
   const glassP=(u,v)=>{const p=P(u,v);p[0]+=s*.004;return p;};
   patch(b,(u,v)=>glassP(mix(mix(.055,.76,u),mix(.065,.64,u),v),mix(.12,mix(.86,.88,u),v)),4,2,glass,[s,0,0]);
   face(b,[[.80,.12],[.73,.89],[.95,.12]].map(([u,v])=>glassP(u,v)),0x1d3541,[s,0,0]);
   beam(b,glassP(.78,.12),glassP(.685,.88),.0085,dark);
  }
  // Scheinwerfer liegen auf der geformten Kotflügelfläche; zwei Projektorlinsen.
  const lampPoint=(s,x,z,dy)=>{const p=top(z,s*x/width(z));p[1]+=dy;return p;};
  for(const s of [-1,1]){
   const lamp=[[.61,1.99],[.845,1.91],[.88,1.27],[.79,1.30]],cx=.793,cz=1.62;
   const lens=(u,v,inset,dy)=>{const x=mix(mix(lamp[0][0],lamp[1][0],u),mix(lamp[3][0],lamp[2][0],u),v),z=mix(mix(lamp[0][1],lamp[1][1],u),mix(lamp[3][1],lamp[2][1],u),v);return lampPoint(s,mix(x,cx,inset),mix(z,cz,inset),dy);};
   patch(b,(u,v)=>lens(u,v,0,.008),2,4,dark,[0,1,0]);
   patch(b,(u,v)=>lens(u,v,.055,.013),2,4,0x617d8c,[0,1,0]);
   for(const [x,z,r] of [[.801,1.45,.051],[.738,1.77,.045]]){const p=lampPoint(s,x,z,.019);b.cyl(r,r,.006,12,0x47565d,{x:p[0],y:p[1],z:p[2],rx:.22});b.cyl(r*.68,r*.68,.008,12,0xe0e8df,{x:p[0],y:p[1]+.006,z:p[2],rx:.22});}
   const edge=side(s,1.78,top(1.78,1)[1]-.055,.005);b.box(.013,.027,.095,0xe4e5d0,{x:edge[0],y:edge[1],z:edge[2]});
   const seam=[[.53,1.96],[.56,1.72],[.59,1.15],[.59,.80]].map(([x,z])=>lampPoint(s,x,z,.004));for(let i=1;i<seam.length;i++)beam(b,seam[i-1],seam[i],.0022,shade(.66));
  }
  // Der Stoßfänger übernimmt genau die Haubenkante, auch zwischen Rasterpunkten.
  const noseTop=x=>{const q=clamp((x/.82+1)*5,0,10),i=Math.min(9,Math.floor(q)),a=top(2.15,i/5-1),d=top(2.15,(i+1)/5-1);return a.map((v,k)=>mix(v,d[k],q-i));};
  const nose=(x,y,depth=0)=>[x,y,noseTop(x)[2]-.055*clamp((noseTop(x)[1]-y)/(noseTop(x)[1]-.19),0,1)**2+depth],noseXs=[-.82,-.78,-.74,-.29,-.25,-.20,.20,.25,.29,.74,.78,.82];
  for(let j=1;j<10;j++)noseXs.push(.82*(j/5-1));noseXs.sort((a,b)=>a-b);
  const frontHole=x=>{const a=Math.abs(x);if(a>=.25&&a<=.78)return [.235,a<.29?mix(.235,.455,(a-.25)/.04):a>.74?mix(.455,.235,(a-.74)/.04):.455];if(a<=.20)return [.255,.435];return null;};
  for(let i=1;i<noseXs.length;i++){const a=noseXs[i-1],d=noseXs[i],hole=frontHole((a+d)/2),ha=hole?frontHole(a)||hole:null,hd=hole?frontHole(d)||hole:null;
   const strips=hole?[[.19,ha[0],.19,hd[0]],[ha[1],.515,hd[1],.515]]:[[.19,.515,.19,.515]];
   for(const [l0,h0,l1,h1] of strips)face(b,[nose(a,l0),nose(d,l1),nose(d,h1===.515?noseTop(d)[1]:h1),nose(a,h0===.515?noseTop(a)[1]:h0)],paint,[0,0,1]);
  }
  // Eingelassene Trapezgitter mit sparsamem Wabenmuster statt senkrechter Zaunstäbe.
  const mouths=[...[-1,1].map(s=>[[.25,.235],[.78,.235],[.74,.455],[.29,.455]].map(([x,y])=>[s*x,y])),[[-.20,.255],[.20,.255],[.20,.435],[-.20,.435]]];
  for(const outline of mouths){const outer=outline.map(([x,y])=>nose(x,y)),inner=outline.map(([x,y])=>nose(x,y,-.065));face(b,inner,dark,[0,0,1]);for(let j=0;j<4;j++){const k=(j+1)%4;face(b,[outer[j],outer[k],inner[k],inner[j]],shade(.55),[outline.reduce((a,p)=>a+p[0],0)/4-(outer[j][0]+outer[k][0])/2,outline.reduce((a,p)=>a+p[1],0)/4-(outer[j][1]+outer[k][1])/2,0]);}}
  for(const s of [-1,1])for(let row=0;row<2;row++)for(let j=0;j<5;j++){const x=s*(.345+j*.075+(row%2)*.018),y=.285+row*.078;for(let k=0;k<6;k++){const a=k*Math.PI/3,d=(k+1)*Math.PI/3;face(b,[nose(x+Math.cos(a)*.033,y+Math.sin(a)*.033,-.049),nose(x+Math.cos(d)*.033,y+Math.sin(d)*.033,-.049),nose(x+Math.cos(d)*.029,y+Math.sin(d)*.029,-.049),nose(x+Math.cos(a)*.029,y+Math.sin(a)*.029,-.049)],0x394349,[0,0,1]);}}
  patch(b,(u,v)=>nose(mix(-.84,.84,u),mix(.174,.216,v),.009),12,1,trim,[0,.3,1]);
  b.box(.37,.105,.018,0xdad8c8,{y:.288,z:2.164});b.box(.027,.092,.02,0x315786,{x:-.158,y:.294,z:2.168});
  const logo=top(1.88,0);face(b,[[logo[0]-.028,logo[1]+.008,1.86],[logo[0]+.028,logo[1]+.008,1.86],[0,logo[1]-.003,1.932]],0xbca565,[0,1,0]);
  // Geschlossenes Heck, flache Leuchten, Lamellen und vier separate Endrohre.
  patch(b,(u,v)=>[mix(-.83,.83,u),mix(.20,top(-2.15,mix(-1,1,u))[1],v),-2.15+.05*Math.abs(2*u-1)**4],10,2,paint,[0,0,-1]);
  b.box(1.46,.17,.018,dark,{y:.365,z:-2.161});
  for(const s of [-1,1]){b.box(.48,.094,.024,0x8d2229,{x:s*.58,y:.566,z:-2.158});b.box(.44,.018,.026,0xe95c4f,{x:s*.58,y:.638,z:-2.163});b.box(.44,.012,.028,0xc94a42,{x:s*.58,y:.586,z:-2.165});}
  b.box(.35,.105,.024,0xdad8c8,{y:.36,z:-2.18});b.box(1.52,.11,.16,dark,{y:.18,z:-2.12});
  for(const x of [-.73,-.52,.52,.73]){b.cyl(.059,.059,.10,12,0x849093,{x,y:.30,z:-2.15,rx:Math.PI/2});b.cyl(.043,.043,.006,12,dark,{x,y:.30,z:-2.215,rx:Math.PI/2});}
  for(const x of [-.31,0,.31])b.box(.018,.09,.20,trim,{x,y:.18,z:-2.08});
  patch(b,(u,v)=>{const p=top(mix(-1.91,-1.34,v),mix(-.60,.60,u));p[1]+=.006;return p;},6,4,dark,[0,1,0]);
  for(let j=0;j<7;j++)patch(b,(u,v)=>{const p=top(-1.36-j*.074-v*.018,mix(-.59,.59,u));p[1]+=.014;return p;},4,1,shade(.67),[0,1,0]);
  return b;
 }
 function wheel(c){
  if(!c||c.id!=='lgal')return typeof CARMODELS!=='undefined'&&c?CARMODELS.wheel(c):null;const b=new G3.MB(),darkWheel=0x1c262b,seg=24,section=[[-.12,.28],[-.105,.313],[-.075,.335],[.075,.335],[.108,.313],[.125,.275]];
  for(let j=1;j<section.length;j++)for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,d=(i+1)/seg*Math.PI*2,[x0,r0]=section[j-1],[x1,r1]=section[j],p=(x,r,t)=>[x,Math.cos(t)*r,Math.sin(t)*r],n=t=>G3.norm([-(r1-r0)/(x1-x0),Math.cos(t),Math.sin(t)]);face(b,[p(x0,r0,a),p(x1,r1,a),p(x1,r1,d),p(x0,r0,d)],0x1c2023,[0,Math.cos((a+d)/2),Math.sin((a+d)/2)],[n(a),n(a),n(d),n(d)]);}
  const ring=(x,outer,inner,color)=>{for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,d=(i+1)/seg*Math.PI*2;face(b,[[x,Math.cos(a)*outer,Math.sin(a)*outer],[x,Math.cos(d)*outer,Math.sin(d)*outer],[x,Math.cos(d)*inner,Math.sin(d)*inner],[x,Math.cos(a)*inner,Math.sin(a)*inner]],color,[1,0,0]);}};
  ring(.127,.275,.241,0x242a2d);ring(.133,.243,.229,0x8a959b);ring(.113,.228,.211,0x3b464d);
  b.cyl(.184,.184,.012,20,0x343d42,{x:.065,rz:-Math.PI/2,smooth:true,nobot:true});
  for(let j=0;j<10;j++){const a=j/10*Math.PI*2,y=Math.cos(a)*.157,z=Math.sin(a)*.157;face(b,[[.079,y-.003,z-.003],[.079,y+.003,z-.003],[.079,y+.003,z+.003],[.079,y-.003,z+.003]],darkWheel,[1,0,0]);}
  // Zehn schmale, leicht geschwungene Speichen mit offenen Zwischenräumen.
  for(let j=0;j<5;j++)for(const d of [-.085,.085]){const a=j/5*Math.PI*2+d,pts=[[.058,a-.09],[.225,a-.025],[.225,a+.025],[.058,a+.09]].map(([r,t])=>[.139-(r-.058)*.09,Math.cos(t)*r,Math.sin(t)*r]);face(b,pts,0x77858e,[1,0,0]);}
  b.cyl(.055,.055,.015,12,0x4d5961,{x:.129,rz:-Math.PI/2,nobot:true});b.cyl(.018,.018,.018,6,0xc0a764,{x:.131,rz:-Math.PI/2,nobot:true});
  for(let j=0;j<5;j++){const a=j/5*Math.PI*2,y=Math.cos(a)*.037,z=Math.sin(a)*.037;face(b,[[.147,y-.004,z-.004],[.147,y+.004,z-.004],[.147,y+.004,z+.004],[.147,y-.004,z+.004]],0xaeb5b5,[1,0,0]);}
  return b;
 }
 return {body,wheel,rig};
})();
