/* v384: Zusammenhängende Wasserlandschaft mit vorgelagerten Bergkämmen. Gemeinsames Höhenfeld für Gelände,
   Ufer, Bachanschluss, Inselkante und Tiere; feste Budgets, keine Meshes im Takt. */
"use strict";
const ALPINE = (()=>{
 const B={x0:4,x1:156,z0:-214,z1:-88},L={x:80,z:-149,rx:20,rz:13,y:10.4};
 const PEAKS=[[42,-168,28,22,25],[68,-181,32,25,39],[95,-177,31,29,45],[121,-157,27,30,36],[116,-128,28,23,24],[61,-153,20,23,21]];
 /* v384: Kleinere Vorberge gliedern die Talseite; dieselbe Oberfläche trägt die Tiere. */
 const FOREPEAKS=[[30,-146,17,17,10],[35,-124,16,16,9],[61,-116,19,17,12],[86,-110,18,16,15],[110,-111,18,17,12],[132,-137,18,20,17]];
 const LEDGES=[[31,-145],[37,-124],[62,-116],[88,-113],[119,-135]];
 const RUN=[[64,-146,10.4,2.05],[62,-144,10.4,2.05]],POOL={x:58,z:-138.5,rx:6.8,rz:6,y:.12};
 const DRAIN=[[54.5,-133.65,.12,1.725],[51.2,-128.8,.11,1.725],[48.8,-123.2,.09,1.725],[43.2,-120,.07,1.725],[38,-112.8,.05,1.725],[31.2,-105.6,.03,1.725]];
 const FALL={lip:[62,L.y,-144],foot:[60.8,POOL.y,-142.8],duration:Math.sqrt(2*(L.y-POOL.y)/9.81)};
 const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),col=n=>G3.col(n);
 let scene=null,grid=null,clock=0,geometry=null,spray=0,mist=0;
 function mountainWeight(x,z){const e=Math.hypot((x-79)/75,(z+155)/58);let w=(1-sm(.76,1,e))*sm(14,34,x)*(1-sm(-135,-119,z));
  for(const [px,pz,rx,rz] of FOREPEAKS)w=Math.max(w,1-sm(.64,1.18,Math.hypot((x-px)/rx,(z-pz)/rz)));return w;
 }
 /* v384: Uferumrisse sind zugleich Wassergrenze und Höhenprofil. Die schmale
    Auslasssehne ersetzt nur den jeweiligen Mündungsbogen, keine halbe Seeseite. */
 function outline(cx,cz,rx,rz,N,wob,mouth){const points=[];
  const angle=p=>Math.atan2(p[1]-cz,p[0]-cx),delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const ends=mouth&&[-1,1].map(s=>[mouth.x+mouth.nx*mouth.w*s,mouth.z+mouth.nz*mouth.w*s]);
  const ma=mouth?angle([mouth.x,mouth.z]):0,span=mouth?Math.max(...ends.map(p=>Math.abs(delta(angle(p),ma)))):0;
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2,r=wob(a),p=[cx+Math.cos(a)*rx*r,cz+Math.sin(a)*rz*r];if(mouth&&Math.abs(delta(angle(p),ma))<span)continue;points.push(p);}
  if(ends)points.push(...ends);return points.sort((a,b)=>angle(a)-angle(b)).map(p=>({p,a:angle(p)}));
 }
 const lakeOutline=outline(L.x,L.z,L.rx,L.rz,96,a=>1+.055*Math.sin(a*3+.8)+.035*Math.sin(a*7),{x:62,z:-144,nx:Math.SQRT1_2,nz:Math.SQRT1_2,w:2.05});
 const first=FWM.smoothLine(DRAIN.map(p=>p.slice(0,2)),6),dsx=first[1][0]-first[0][0],dsz=first[1][1]-first[0][1],dsl=Math.hypot(dsx,dsz);
 const poolOutline=outline(POOL.x,POOL.z,POOL.rx,POOL.rz,64,a=>1+.06*Math.sin(a*3+.4)+.035*Math.cos(a*5),{x:DRAIN[0][0],z:DRAIN[0][1],nx:-dsz/dsl,nz:dsx/dsl,w:DRAIN[0][3]});
 function radialE(poly,cx,cz,x,z){const dx=x-cx,dz=z-cz,r=Math.hypot(dx,dz);if(r<1e-8)return 0;const a=Math.atan2(dz,dx);let lo=0,hi=poly.length;while(lo<hi){const m=(lo+hi)>>1;if(poly[m].a<a)lo=m+1;else hi=m;}
  const p=poly[(lo+poly.length-1)%poly.length].p,q=poly[lo%poly.length].p,ex=q[0]-p[0],ez=q[1]-p[1],ux=dx/r,uz=dz/r,den=ux*ez-uz*ex,bound=((p[0]-cx)*ez-(p[1]-cz)*ex)/den;return r/bound;
 }
 const lakeE=(x,z)=>radialE(lakeOutline,L.x,L.z,x,z),poolE=(x,z)=>radialE(poolOutline,POOL.x,POOL.z,x,z);
 let river=null;
 function riverLine(){return DRAIN.map(p=>p.slice(0,2)).concat(FWORLD.creek.slice(1));}
 function riverProfile(){if(river)return river;const p=FWM.smoothLine(riverLine().slice(0,DRAIN.length+3),6);river=[];let dist=0;
  p.forEach((q,i)=>{if(i)dist+=Math.hypot(q[0]-p[i-1][0],q[1]-p[i-1][1]);const k=Math.min(DRAIN.length-1,Math.floor(i/6)),t=i/6-k,a=DRAIN[k],b=DRAIN[Math.min(DRAIN.length-1,k+1)];river.push([q[0],q[1],a[2]+(b[2]-a[2])*Math.max(0,Math.min(1,t)),1.725,dist]);});return river;
 }
 function nearest(line,x,z){let best=1e8,out=null;
  for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t),w=a[3]+(b[3]-a[3])*t;if(d-w<best){best=d-w;out={d:d-w,y:a[2]+(b[2]-a[2])*t,w,s:(a[4]||0)+Math.hypot(dx,dz)*t};}}return out;
 }
 function channel(x,z){const drain=nearest(riverProfile(),x,z),upper=nearest(RUN,x,z),along=(-(x-62)+(z+144))/Math.SQRT2;return along<.05&&upper.d<drain.d?upper:drain;}
 function weight(x,z){return Math.max(mountainWeight(x,z),1-sm(1,1.5,poolE(x,z)),(1-sm(2,5.5,nearest(riverProfile(),x,z).d))*sm(4,22,x)*(1-sm(-94,-85,z)));}
 const contains=(x,z)=>weight(x,z)>.035;
 const replacesGround=(x,z)=>x>=B.x0&&x<=B.x1&&z>=B.z0&&z<=B.z1;
 /* Rinne auch ins alte Quellgelände schneiden; unabhängig vom Höhenfeld,
    damit springHeightW und dieses Modul sich nicht gegenseitig aufrufen. */
 function cutChannel(x,z,h,onlyCut){const q=channel(x,z);if(q.d>5.5)return h;
  /* Kein erhöhtes Endstück: Profil läuft bis IN den vorhandenen Fluss weiter.
     Das Bett reicht über beide Wasserufer; kleine Rasterfehler verdecken es nicht. */
  const bed=q.y-.3,edge=q.y+.04,bank=bed+(edge-bed)*sm(.25,1.05,q.d),carved=bank+(Math.max(edge,h)-bank)*sm(1.05,5.5,q.d);return onlyCut?Math.min(h,carved):carved;
 }
 function baseHeight(x,z){const w=mountainWeight(x,z);if(w<=0)return 0;let h=0;
  for(const [px,pz,rx,rz,top] of PEAKS.concat(FOREPEAKS)){const dx=(x-px)/rx,dz=(z-pz)/rz,a=Math.atan2(dz,dx),d=Math.hypot(dx,dz),r=Math.max(0,1-d*(1+.1*Math.sin(a*5+px)+.04*Math.cos(a*3-pz)));h=Math.max(h,top*Math.pow(r,.94));}
  const ribs=.65*Math.sin(x*.55+z*.28)+.35*Math.sin(x*.9-z*.37);return Math.max(0,(h+ribs*sm(3,15,h))*w);
 }
 function rawHeight(x,z){let h=baseHeight(x,z);for(const [cx,cz] of LEDGES){const d=Math.hypot(x-cx,z-cz);if(d<5.4)h+=(baseHeight(cx,cz)-h)*(1-sm(2.8,5.4,d));}return h;}
 function height(x,z){if(!contains(x,z))return 0;
  let h=rawHeight(x,z),e=lakeE(x,z);
  if(e<1.4){const basin=L.y-2.4+2.1*sm(.18,1,e),shore=L.y-.3+.8*sm(1,1.1,e);h=e<1?basin:shore+(h-shore)*sm(1.02,1.4,e);}
  if(e>=1||channel(x,z).y<1)h=cutChannel(x,z,h);
  const along=(-(x-62)+(z+144))/Math.SQRT2,side=((x-62)+(z+144))/Math.SQRT2;
  if(along>-.4&&along<7&&Math.abs(side)<5){const cliff=10.3*(1-sm(-.1,1.5,along));h=h+(Math.min(h,cliff)-h)*(1-sm(3.3,5,Math.abs(side)));}
  const ePool=poolE(x,z);if(ePool<1.6){const bed=POOL.y-.32-1.3*(1-sm(.2,1,ePool));h=ePool<1?bed:POOL.y-.32+(h-POOL.y+.32)*sm(1,1.6,ePool);}
  if(channel(x,z).y<1)h=cutChannel(x,z,h,true);
  return h;
 }

 function color(x,z,h){const w=sm(.02,.3,weight(x,z)),e=lakeE(x,z),n=Math.sin(x*.71+z*.43)*.5+.5;
  const slope=Math.hypot(height(x+.6,z)-height(x-.6,z),height(x,z+.6)-height(x,z-.6))/1.2;
  let c=mix(col(0x688349),col(0x9a9a83),sm(.36,1.25,slope));
  c=mix(c,mix(col(0x7f8584),col(0xb2b0a1),n),Math.max(sm(18,31,h),sm(.8,1.4,slope)));
  if(e<1.12)c=mix(col(e<1?0x3b6967:0x919685),c,sm(.94,1.12,e));
  if((-(x-62)+(z+144))/Math.SQRT2>.1&&Math.abs((x-62)+(z+144))<10&&h<L.y-.8&&slope>.8)c=mix(col(0x596760),col(0x8a8b7f),sm(1,2.4,slope)); /* v380: nasser Fels unter der Fallkante, kein türkis gefärbter Seegrund an der Wand */
  const strata=.96+.04*Math.sin(h*2.8+x*.12+z*.09);c=c.map(v=>v*strata);
  const q=channel(x,z);
  const base=typeof worldGroundCol==='function'?col(worldGroundCol(x,z)):col(0x719c48);let result=mix(base,c,w);
  if(q.y<1&&q.d<3.2&&poolE(x,z)>.98){const shore=mix(col(0x7d8470),col(0xc9b98c),sm(-.1,1.1,q.d));result=mix(shore,result,sm(1.1,3.2,q.d));}return result;
 }
 function inside(x,z){const cx=-28,cz=-28,a=Math.atan2(z-cz,x-cx);return Math.hypot(x-cx,z-cz)<apronEdgeRadius(a)-.25;}
 function project(x,z){if(inside(x,z))return [x,z];const a=Math.atan2(z+28,x+28),r=apronEdgeRadius(a)-.25;return [-28+Math.cos(a)*r,-28+Math.sin(a)*r];}
 function normal(x,z){const d=.45;return G3.norm([height(x-d,z)-height(x+d,z),d*2,height(x,z-d)-height(x,z+d)]);}
 function terrain(cell,store){const b=new FM.MB(),nx=Math.ceil((B.x1-B.x0)/cell),nz=Math.ceil((B.z1-B.z0)/cell),dx=(B.x1-B.x0)/nx,dz=(B.z1-B.z0)/nz,V=[],fine=new Set(),cache=new Map(),N=4;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const X=B.x0+i*dx,Z=B.z0+j*dz,p=project(X,Z),h=height(...p);V.push({out:!inside(X,Z),p:[p[0],h+.012*sm(0,.5,h),p[1]],c:color(p[0],p[1],h),n:normal(p[0],p[1])});}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=B.x0+(i+.5)*dx,z=B.z0+(j+.5)*dz,e=lakeE(x,z);if(channel(x,z).d<3.6||(e>.82&&e<1.18)||poolE(x,z)<1.5)fine.add(j*nx+i);}
  const interpolate=(a,b,t)=>({out:a.out&&b.out,p:mix(a.p,b.p,t),c:mix(a.c,b.c,t),n:G3.norm(mix(a.n,b.n,t))});
  function vertex(I,J){const key=J*(nx*N+1)+I;if(cache.has(key))return cache.get(key);const i=Math.min(nx-1,Math.floor(I/N)),j=Math.min(nz-1,Math.floor(J/N)),u=(I-i*N)/N,v=(J-j*N)/N;let out;
   if(I%N===0&&J%N===0)out=V[(J/N)*(nx+1)+I/N];
   else if(I%N===0&&(!fine.has(j*nx+i)||!fine.has(j*nx+i-1)))out=interpolate(V[j*(nx+1)+I/N],V[(j+1)*(nx+1)+I/N],v);
   else if(J%N===0&&(!fine.has(j*nx+i)||!fine.has((j-1)*nx+i)))out=interpolate(V[(J/N)*(nx+1)+i],V[(J/N)*(nx+1)+i+1],u);
   else{const X=B.x0+I/N*dx,Z=B.z0+J/N*dz,p=project(X,Z),h=height(...p);out={out:!inside(X,Z),p:[p[0],h+.012*sm(0,.5,h),p[1]],c:color(p[0],p[1],h),n:normal(p[0],p[1])};}cache.set(key,out);return out;
  }
  const quad=(a,d,c,e)=>{if([a,d,c,e].every(q=>q.out))return;b.v.push(...a.p,...a.n,...a.c,...d.p,...d.n,...d.c,...c.p,...c.n,...c.c,...a.p,...a.n,...a.c,...c.p,...c.n,...c.c,...e.p,...e.n,...e.c);};
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){if(fine.has(j*nx+i)){for(let v=0;v<N;v++)for(let u=0;u<N;u++){const I=i*N+u,J=j*N+v;quad(vertex(I,J),vertex(I,J+1),vertex(I+1,J+1),vertex(I+1,J));}}else quad(V[j*(nx+1)+i],V[(j+1)*(nx+1)+i],V[(j+1)*(nx+1)+i+1],V[j*(nx+1)+i+1]);}
  if(store)grid={nx,nz,dx,dz,V,fine,vertex,N};return b;
 }
 function basinWater(poly,cx,cz,y,N){const b=new FM.MB(),at=(i,r)=>[cx+(poly[i%poly.length].p[0]-cx)*r,y,cz+(poly[i%poly.length].p[1]-cz)*r];
  for(let j=0;j<N;j++)for(let i=0;i<poly.length;i++){const r=j/N,s=(j+1)/N,c=mix(col(G3.WATER.deep),col(G3.WATER.shallow),Math.pow(r,3)),d=mix(col(G3.WATER.deep),col(G3.WATER.shallow),Math.pow(s,3));b.triV(at(i,r),at(i+1,s),at(i,s),c,d,d);if(j)b.triV(at(i,r),at(i+1,r),at(i+1,s),c,c,d);}return b;
 }
 function water(){return basinWater(lakeOutline,L.x,L.z,L.y,5);}
 /* v384: Das Talwasser gehört zum durchgehenden Flussmesh in worldview.js.
    Kein überlagertes Band, keine separat endende Strömungsphase. */
 function riverLevel(x,z){return nearest(riverProfile(),x,z).y;}
 function riverBankY(x,z,y){return contains(x,z)?Math.max(y,height(x,z)+.032):y;}
 function fallPath(t){return [62-1.2*t,L.y-(L.y-POOL.y)*t*t,-144+1.2*t,2.05*(1-.25*t)];}
 function fallMesh(){const b=new FM.MB(),N=24,M=6;const at=(t,w)=>{const p=fallPath(t);return[p[0]+w*p[3]/Math.SQRT2,p[1],p[2]+w*p[3]/Math.SQRT2];};
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){const t=i/N,u=(i+1)/N,a=-1+j*2/M,d=a+2/M,A=at(t,a),B=at(t,d),C=at(u,d),D=at(u,a),ca=[t,(a+1)/2,1],cb=[t,(d+1)/2,1],cc=[u,(d+1)/2,1],cd=[u,(a+1)/2,1];b.triV(A,B,C,ca,cb,cc);b.triV(A,C,D,ca,cc,cd);b.triV(A,C,B,ca,cc,cb);b.triV(A,D,C,ca,cd,cc);}return b;}
 function poolMesh(){return basinWater(poolOutline,POOL.x,POOL.z,POOL.y,4);}
 function foamMesh(){const b=new FM.MB(),N=12,M=12,at=(t,w)=>[60.8-t*1.7+w*1.7,POOL.y+.018,-142.8+t*3.5+w*.8];for(let i=0;i<N;i++)for(let j=0;j<M;j++){const t=i/N,u=(i+1)/N,a=-1+j*2/M,d=a+2/M;b.triV(at(t,a),at(u,d),at(t,d),[t*1.1,a,-1],[u*1.1,d,-1],[t*1.1,d,-1]);b.triV(at(t,a),at(u,a),at(u,d),[t*1.1,a,-1],[u*1.1,a,-1],[u*1.1,d,-1]);}return b;}
 function fir(b,x,y,z,s,far,tint){b.box(.18*s,1.4*s,.18*s,0x67513b,{x,y,z});
  const layers=far?2:4;for(let j=0;j<layers;j++){const t=j/layers,r=(1.3-.83*t)*s,Y=y+(1+t*3)*s;b.cone(r,(2.4-1.0*t)*s,far?5:7,tint,{x,y:Y,z});
   if(!far)for(let k=0;k<7;k++){const a=k/7*Math.PI*2+j*.8,da=.16,R=r*(1.08+.1*Math.sin(k*2+j));b.tri([x+Math.cos(a-da)*r*.65,Y+.27*s,z+Math.sin(a-da)*r*.65],[x+Math.cos(a)*R,Y-.16*s,z+Math.sin(a)*R],[x+Math.cos(a+da)*r*.65,Y+.1*s,z+Math.sin(a+da)*r*.65],tint);}
  }}
 function scenery(){const near=new FM.MB(),far=new FM.MB(),detail=new FM.MB(),rnd=wRng(373),trees=[];
  for(let i=0;i<1500&&trees.length<210;i++){const x=22+rnd()*112,z=-191+rnd()*68,h=height(x,z),e=lakeE(x,z),sl=Math.hypot(height(x+.8,z)-h,height(x,z+.8)-h)/.8;
   if(!contains(x,z)||!inside(x,z)||h<1||h>23||sl>.8||e<1.16||poolE(x,z)<1.25||channel(x,z).d<3||trees.some(t=>Math.hypot(t.x-x,t.z-z)<2.8))continue;
   if(x<57&&z>-145)continue;const s=.7+rnd()*.65,tint=[0x325746,0x3e654b,0x56734c][i%3];trees.push({x,z,h,s});fir(near,x,h,z,s,false,tint);fir(far,x,h,z,s,true,tint);
  }
  for(let i=0;i<110;i++){const x=25+rnd()*112,z=-190+rnd()*65,h=height(x,z);if(!inside(x,z)||!contains(x,z)||h<1||lakeE(x,z)<1.08||poolE(x,z)<1.15||channel(x,z).d<1.8)continue;const r=.18+rnd()*.6;detail.ico(r,0x85897c,{x,y:h+r*.28,z,sy:.55,ry:rnd()*6.28});}
  // Schuttfächer und einzelne Felsschichten statt gleichmäßig verteilter Steinbälle.
  for(const [x,z,r] of [[96,-158,5],[105,-144,4],[50,-164,3]])for(let i=0;i<22;i++){const a=rnd()*6.28,d=Math.sqrt(rnd())*r,X=x+Math.cos(a)*d,Z=z+Math.sin(a)*d,h=height(X,Z);if(lakeE(X,Z)<1.08||poolE(X,Z)<1.15)continue;detail.ico(.13+rnd()*.3,0x939688,{x:X,y:h+.08,z:Z,sy:.45});}
  return {near,far,detail,trees};
 }
 function body(kind){const b=new FM.MB(),m=kind==='marmot';
  b.ico(1,m?0x82715a:0x746858,{x:0,y:m?.28:.88,z:0,sx:m?.24:.31,sy:m?.25:.37,sz:m?.48:.62});
  if(!m){b.ico(.26,0xb09c7d,{y:1.13,z:.44,sx:.8,sy:1.45,sz:.8});b.box(.11,.22,.1,0x554636,{y:.85,z:-.6,rx:-.65});}
  else{b.ico(.16,0x938064,{y:.37,z:.4});for(const s of [-1,1]){b.ico(.05,0x766149,{x:s*.11,y:.48,z:.36});b.ico(.018,0x141916,{x:s*.115,y:.405,z:.49});}b.ico(.038,0x39362f,{y:.35,z:.55});b.box(.12,.09,.35,0x665341,{y:.12,z:-.48});}return b;
 }
 function head(){const b=new FM.MB();b.ico(.24,0x8d7e67,{sx:.78,sy:1.05,sz:1.35});b.ico(.12,0x403c32,{y:-.1,z:.23,sz:1.5});
  for(const s of [-1,1]){b.ico(.07,0xa3957b,{x:s*.22,y:.07,sz:1.8});b.ico(.025,0x161c17,{x:s*.16,y:.025,z:.15});
   const pts=[[s*.13,.15,-.06],[s*.17,.4,-.12],[s*.19,.62,-.29],[s*.18,.77,-.54],[s*.15,.78,-.75]];
   for(let i=1;i<pts.length;i++){const a=pts[i-1],d=pts[i],dx=d[0]-a[0],dy=d[1]-a[1],dz=d[2]-a[2],l=Math.hypot(dx,dy,dz);b.cyl(.065-i*.008,.057-i*.008,l,6,0x504a3b,{x:a[0],y:a[1],z:a[2],rx:Math.atan2(dz,dy),rz:-Math.asin(dx/l)});}}
  return b;
 }
 function leg(){const b=new FM.MB();b.box(.1,1,.11,0x675c4b,{y:-1});return b;}
 function hoof(){const b=new FM.MB();b.box(.13,.1,.19,0x302f29,{z:.03});return b;}
 function eagle(){const b=new FM.MB();b.ico(.22,0x4a4032,{sy:.65,sz:1.8});b.ico(.11,0x8d7951,{y:.02,z:.35});b.cone(.04,.12,5,0xb99b54,{y:.01,z:.41,rx:Math.PI/2});b.box(.3,.04,.3,0x685944,{y:-.02,z:-.28});return b;}
 function wing(side){const b=new FM.MB();const A=[side*.15,.02,.12],B=[side*1.6,0,-.1],C=[side*1.25,0,-.42],D=[side*.15,0,-.22];b.quad(A,B,C,D,0x413b30);b.quad(D,C,B,A,0x413b30);for(let i=0;i<5;i++)b.box(.14,.035,.38,0x343229,{x:side*(1.0+i*.13),z:-.35-i*.02,ry:side*.25});return b;}
 function safeCenter(wanted,small,occupied){let best=wanted,score=1e6;
  for(let i=0;i<220;i++){const a=i*2.39996,r=i?Math.sqrt(i/220)*30:0,x=wanted[0]+Math.cos(a)*r,z=wanted[1]+Math.sin(a)*r;if(occupied.some(q=>Math.hypot(q.x-x,q.z-z)<(small?4:7)))continue;let cost=r*.008;
   for(let j=0;j<16;j++){const t=j/16*Math.PI*2,X=x+Math.cos(t)*(small?.7:2.3),Z=z+Math.sin(t)*(small?.6:1.8),h=surface(X,Z),sl=Math.hypot(surface(X+.5,Z)-surface(X-.5,Z),surface(X,Z+.5)-surface(X,Z-.5));cost=Math.max(cost,sl+r*.008);
    if(!inside(X,Z)||!contains(X,Z)||h<1.6||lakeE(X,Z)<1.17||poolE(X,Z)<1.2||channel(X,Z).d<2.4||geometry.trees.some(t=>Math.hypot(t.x-X,t.z-Z)<1.7))cost+=10;
   }if(cost<score){score=cost;best=[x,z];}if(cost<.5)break;
  }return best;
 }
 function makeAnimals(R,parent){const animals=[],node=(mesh,o)=>R.node(mesh,o),cache=(k,fn)=>fmesh('alp384:'+k,fn);
  const candidates=LEDGES;
  for(let i=0;i<7;i++){const m=i>4,wanted=m?[[96,-130],[66,-159]][i-5]:candidates[i],[x,z]=safeCenter(wanted,m,animals),root=node(cache(m?'marmot':'ibex',()=>body(m?'marmot':'ibex')),{shadow:false,s:m?1.1:i===4?.72:1.25});R.addChild(parent,root);
   const a={kind:m?'marmot':'ibex',root,x,z,phase:i*1.71,walk:0,legs:[],head:null,path:[]};
   // Nur sichere Punkte auf dem tatsächlichen feinen Geländeraster verwenden.
   for(let k=0;k<64;k++){const t=k/64*Math.PI*2,X=x+Math.cos(t)*(m?.7:2.3),Z=z+Math.sin(t)*(m?.6:1.8);a.path.push([X,surface(X,Z),Z]);}
   if(!m){a.head=R.addChild(root,node(cache('head',head),{y:1.27,z:.63}));for(const sx of [-1,1])for(const sz of [-1,1]){const hip=R.addChild(root,node(null,{x:sx*.22,y:.68,z:sz*.4}));a.legs.push({hip,upper:R.addChild(hip,node(cache('leg',leg),{})),lower:R.addChild(hip,node(cache('leg',leg),{})),hoof:R.addChild(hip,node(cache('hoof',hoof),{}))});};}
   animals.push(a);
  }
  const birds=[];for(let i=0;i<2;i++){const root=R.addChild(parent,node(cache('eagle',eagle),{shadow:false,s:1.4})),left=R.addChild(root,node(cache('wl',()=>wing(-1)),{})),right=R.addChild(root,node(cache('wr',()=>wing(1)),{}));birds.push({root,left,right,phase:i*2.8});}return {animals,birds};
 }
 /* Bodenkontakt auf denselben Dreiecken wie die Nahansicht, nicht auf einer
    nur ähnlichen analytischen Höhe. Raster wird einmal je Aufbau erzeugt. */
 function surface(x,z){if(!grid){const h=height(x,z);return h+.012*sm(0,.5,h);}const {nx,nz,dx,dz,V,fine,vertex,N}=grid,fx=Math.max(0,Math.min(nx-.0001,(x-B.x0)/dx)),fz=Math.max(0,Math.min(nz-.0001,(z-B.z0)/dz)),i=Math.floor(fx),j=Math.floor(fz);let u=fx-i,v=fz-j,a,b,c,d;
  if(fine.has(j*nx+i)){const I=Math.floor(fx*N),J=Math.floor(fz*N);u=fx*N-I;v=fz*N-J;a=vertex(I,J).p[1];b=vertex(I+1,J).p[1];c=vertex(I,J+1).p[1];d=vertex(I+1,J+1).p[1];}
  else{a=V[j*(nx+1)+i].p[1];b=V[j*(nx+1)+i+1].p[1];c=V[(j+1)*(nx+1)+i].p[1];d=V[(j+1)*(nx+1)+i+1].p[1];}
  return v>=u?a+(d-c)*u+(c-a)*v:a+(b-a)*u+(d-b)*v;
 }
 function prepare(){
  if(!geometry){const terrainNear=terrain(3,true),decor=scenery();geometry={terrainNear,treeNear:decor.near,treeFar:decor.far,detail:decor.detail,trees:decor.trees,water:water(),fall:fallMesh(),pool:poolMesh(),foam:foamMesh()};
  }
 }
 function build(R){prepare();
  const cache=(k,mb)=>fmesh('alp384:'+k,()=>mb),root=R.node(null,{shadow:false});R.nodes.push(root);
  const add=(k,mb,o={})=>R.addChild(root,R.node(cache(k,mb),Object.assign({shadow:false},o)));
  const near=add('terrain',geometry.terrainNear);
  scene={root,near,treeNear:add('fir',geometry.treeNear),treeFar:add('firFar',geometry.treeFar,{inv:true,visible:false}),detail:add('detail',geometry.detail),water:add('water',geometry.water,{water:4}),fall:add('fall',geometry.fall,{alpha:.98,water:6,flow:[0,1.3,1,POOL.y]}),pool:add('pool',geometry.pool,{water:4}),foam:add('foam',geometry.foam,{water:6,flow:[3.9,1.7,1,POOL.y],alpha:.98}),...makeAnimals(R,root)};
  clock=0;return scene;
 }
 function step(dt){if(!scene)return;const fp=!!FV.fp,d=FV.R.cam.dist,on=!fp,day=(S.time%1440)>330&&(S.time%1440)<1230;scene.root.visible=on;if(!on)return;
  const t=sm(140,225,d);scene.near.fade=0;scene.near.visible=true;scene.treeNear.fade=t;scene.treeNear.visible=t<.999;scene.treeFar.fade=t;scene.treeFar.visible=t>.001;
  const detail=sm(90,140,d);scene.detail.fade=detail;scene.detail.visible=detail<.999;clock+=Math.min(.05,Math.max(0,dt));
  if(d<130&&Math.hypot(FV.R.cam.tx-POOL.x,FV.R.cam.tz-POOL.z)<65&&FV.R.emit){spray+=Math.min(.05,dt)*18;while(spray>=1){spray--;const a=clock*17+spray;FV.R.emit({x:60.8+Math.cos(a)*.5,y:.17,z:-142.8+Math.sin(a)*.5,vx:Math.cos(a)*1.2,vy:1.3+Math.sin(a*3)*.4,vz:Math.sin(a)*1.2,g:-9.81,life:.55,size:.04,size2:.1,col:[.85,.95,1,.45],shape:5});}}else spray=0;
  if(d<130&&Math.hypot(FV.R.cam.tx-POOL.x,FV.R.cam.tz-POOL.z)<65&&FV.R.emit){mist+=Math.min(.05,dt)*2;if(mist>=1){mist--;FV.R.emit({x:60.8,y:.35,z:-142.8,vx:-.15,vy:.35,vz:.18,g:0,life:1.4,size:.18,size2:.7,col:[.86,.94,1,.075],drag:1.2,shape:4});}}else mist=0;
  for(const a of scene.animals){const fade=sm(150,220,d),near=Math.hypot(a.x-FV.R.cam.tx,a.z-FV.R.cam.tz)<Math.max(50,d*.75);a.root.fade=fade;a.root.visible=fade<.999&&near&&(day||a.kind==='ibex');if(!a.root.visible)continue;
   const moving=day&&Math.sin(clock*.23+a.phase)>-.15,speed=a.kind==='marmot'?.12:.16;if(moving)a.walk+=Math.min(.05,dt)*speed;
   const f=(a.walk+a.phase)*64/(Math.PI*2),i=((Math.floor(f)%64)+64)%64,u=f-Math.floor(f),p=a.path[i],q=a.path[(i+1)%64],x=p[0]+(q[0]-p[0])*u,z=p[2]+(q[2]-p[2])*u;
   a.root.x=x;a.root.z=z;a.root.y=surface(x,z);a.root.ry=Math.atan2(q[0]-p[0],q[2]-p[2]);
   a.legs.forEach((leg,j)=>{const wave=Math.sin(clock*5+a.phase+(j===0||j===3?0:Math.PI)),sc=a.root.sx,c=Math.cos(a.root.ry),s=Math.sin(a.root.ry),swing=moving?wave*.09:0,hip=leg.hip,X=x+(hip.x*c+(hip.z+swing)*s)*sc,Z=z+(-hip.x*s+(hip.z+swing)*c)*sc,toe=(surface(X,Z)-a.root.y)/sc-hip.y+(moving?Math.max(0,wave)*.06:0),knee=toe*.49,kz=(hip.z>0?.11:-.11)+swing*.4;
    leg.upper.rx=Math.atan2(-kz,-knee);leg.upper.sy=Math.hypot(knee,kz);leg.lower.y=knee;leg.lower.z=kz;leg.lower.rx=Math.atan2(-(swing-kz),knee-toe);leg.lower.sy=Math.hypot(knee-toe,swing-kz);leg.hoof.y=toe;leg.hoof.z=swing;
   });
   if(a.head)a.head.rx=moving?-.05:.38+.05*Math.sin(clock*.8+a.phase);if(a.kind==='marmot')a.root.rx=moving?0:Math.sin(clock*.5+a.phase)>.5?-.2:0;
  }
  for(const b of scene.birds){b.root.visible=day;if(!day)continue;const t=clock*.12+b.phase;b.root.x=80+Math.cos(t)*29;b.root.z=-152+Math.sin(t)*18;b.root.y=43+Math.sin(t*1.4)*3;b.root.ry=-t;b.root.rz=Math.sin(t)*.12;const flap=Math.sin(clock*3+b.phase)>.82?Math.sin(clock*8+b.phase)*.13:.035;b.left.rz=flap;b.right.rz=-flap;}
 }
 return {riverLine,riverLevel,riverBankY,replacesGround,contains,weight,height,color,channel,cutChannel,lakeE,poolE,surface,build,step,info:()=>({scene,geometry,grid,clock,lake:L,lakeOutline,poolOutline,run:RUN,drain:DRAIN,profile:riverProfile(),pool:POOL,fall:FALL,fallPath,bounds:B,peaks:PEAKS,forepeaks:FOREPEAKS,ledges:LEDGES})};
})();
