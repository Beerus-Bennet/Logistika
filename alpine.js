/* v384: Zusammenhängende Wasserlandschaft mit vorgelagerten Bergkämmen. Gemeinsames Höhenfeld für Gelände,
   Ufer, Bachanschluss, Inselkante und Tiere; feste Budgets, keine Meshes im Takt. */
"use strict";
const ALPINE = (()=>{
 const B={x0:4,x1:156,z0:-214,z1:-88},L={x:80,z:-149,rx:20,rz:13,y:15.0};
 /* v403: Gipfel deutlich höher (Hauptkamm bis ~80), Form unten konkav, oben spitz – wie ein Kalkalpenkamm statt runder Hügel */
 const PEAKS=[[42,-168,28,22,40],[68,-181,32,25,64],[95,-177,31,29,80],[121,-157,27,30,60],[116,-128,28,23,36],[61,-153,20,23,30]];
 /* v384: Kleinere Vorberge gliedern die Talseite; dieselbe Oberfläche trägt die Tiere. */
 const FOREPEAKS=[[30,-146,17,17,10],[35,-124,16,16,9],[61,-116,19,17,12],[86,-110,18,16,15],[110,-111,18,17,12],[132,-137,18,20,17]];
 const LEDGES=[[31,-145],[37,-124],[62,-116],[88,-113],[119,-135]];
 /* v409: Bauplatz der Almhütte – das Gelände wird dort eingeebnet (Abtrag/Aufschüttung), statt die Hütte schweben zu lassen */
 const HUT={x:30,z:-132,r:6.2,f:9.5}; /* weit genug vom Bach (Uferanschnitt) */
 /* v403: Fall 10 statt 6,4 breit (FW = halbe Breite); Kolk kreisrund (r 8) vor der Wand, Mitte 9,5 vor der Falllippe */
 const FW=5,RUN=[[64,-146,15,FW],[62,-144,15,FW]],POOL={x:62-9.5*Math.SQRT1_2,z:-144+9.5*Math.SQRT1_2,rx:8,rz:8,y:.12};
 const DRAIN=[[51.82,-130.08,.12,3.0],[49.9,-126.3,.11,2.3],[48.8,-123.2,.09,1.725],[43.2,-120,.07,1.725],[38,-112.8,.05,1.725],[31.2,-105.6,.03,1.725]];
 const FALL={lip:[62,L.y,-144],foot:[62-2.4,POOL.y,-144+2.4],w:FW,duration:Math.sqrt(2*(L.y-POOL.y)/9.81)},FOAM={lx:2.3,ly:FW*.88}; /* v404: Aufprallband Länge/halbe Breite */
 const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),col=n=>G3.col(n);
 let scene=null,grid=null,clock=0,geometry=null,spray=0,mist=0,groundSampler=null;
 /* v403: Wertrauschen und Gratrauschen (1-|n|) für Grate, Rinnen und Felsrippen – deterministisch, ohne Speicher */
 function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z),u0=x-xi,v0=z-zi,u=u0*u0*(3-2*u0),v=v0*v0*(3-2*v0),q=(a,b)=>{let n=Math.imul(a,374761393)+Math.imul(b,668265263)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  return q(xi,zi)*(1-u)*(1-v)+q(xi+1,zi)*u*(1-v)+q(xi,zi+1)*(1-u)*v+q(xi+1,zi+1)*u*v;}
 function ridged(x,z){let s=0,a=.55,f=.05;for(let o=0;o<3;o++){const n=1-Math.abs(vnoise(x*f+o*17.3,z*f-o*9.1)*2-1);s+=a*n*n;a*=.5;f*=2.13;}return s;}
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
 const lakeOutline=outline(L.x,L.z,L.rx,L.rz,96,a=>1+.055*Math.sin(a*3+.8)+.035*Math.sin(a*7),{x:62,z:-144,nx:Math.SQRT1_2,nz:Math.SQRT1_2,w:FW});
 /* v405: Kein Seeufer jenseits der Falllippe – Umrisspunkte hinter der Lippenlinie werden auf sie zurückgesetzt (vorher hing rechts
    neben dem Fall eine Wasserzunge über der Wand, der Fall wirkte geknickt). Die beiden Lippenpunkte bleiben exakt. */
 lakeOutline.forEach(q=>{const al=(-(q.p[0]-62)+(q.p[1]+144))/Math.SQRT2,sd=((q.p[0]-62)+(q.p[1]+144))/Math.SQRT2;if(al>-.4&&Math.abs(Math.abs(sd)-FW)>1e-6){const d=al+.4+.6*(1-sm(FW,FW+6,Math.abs(sd)));q.p=[q.p[0]+Math.SQRT1_2*d,q.p[1]-Math.SQRT1_2*d];}});
 const first=FWM.smoothLine(DRAIN.map(p=>p.slice(0,2)),6),dsx=first[1][0]-first[0][0],dsz=first[1][1]-first[0][1],dsl=Math.hypot(dsx,dsz);
 const poolOutline=outline(POOL.x,POOL.z,POOL.rx,POOL.rz,64,a=>1+.018*Math.sin(a*5+.4)+.012*Math.cos(a*3),{x:DRAIN[0][0],z:DRAIN[0][1],nx:-dsz/dsl,nz:dsx/dsl,w:DRAIN[0][3]});
 function radialE(poly,cx,cz,x,z){const dx=x-cx,dz=z-cz,r=Math.hypot(dx,dz);if(r<1e-8)return 0;const a=Math.atan2(dz,dx);let lo=0,hi=poly.length;while(lo<hi){const m=(lo+hi)>>1;if(poly[m].a<a)lo=m+1;else hi=m;}
  const p=poly[(lo+poly.length-1)%poly.length].p,q=poly[lo%poly.length].p,ex=q[0]-p[0],ez=q[1]-p[1],ux=dx/r,uz=dz/r,den=ux*ez-uz*ex,bound=((p[0]-cx)*ez-(p[1]-cz)*ex)/den;return r/bound;
 }
 const lakeE=(x,z)=>radialE(lakeOutline,L.x,L.z,x,z),poolE=(x,z)=>radialE(poolOutline,POOL.x,POOL.z,x,z);
 let river=null;
 function riverLine(){return DRAIN.map(p=>p.slice(0,2)).concat(FWORLD.creek.slice(1));}
 function riverProfile(){if(river)return river;const p=FWM.smoothLine(riverLine().slice(0,DRAIN.length+3),6);river=[];let dist=0;
  p.forEach((q,i)=>{if(i)dist+=Math.hypot(q[0]-p[i-1][0],q[1]-p[i-1][1]);const k=Math.min(DRAIN.length-1,Math.floor(i/6)),t=i/6-k,a=DRAIN[k],b=DRAIN[Math.min(DRAIN.length-1,k+1)];river.push([q[0],q[1],a[2]+(b[2]-a[2])*Math.max(0,Math.min(1,t)),a[3]+(b[3]-a[3])*Math.max(0,Math.min(1,t)),dist]);});return river;
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
  for(const [px,pz,rx,rz,top] of PEAKS.concat(FOREPEAKS)){const dx=(x-px)/rx,dz=(z-pz)/rz,a=Math.atan2(dz,dx),d=Math.hypot(dx,dz),r=Math.max(0,1-d*(1+.1*Math.sin(a*5+px)+.04*Math.cos(a*3-pz)));h=Math.max(h,top*Math.pow(r,top>30?1.3:.94));}
  /* v403: Grate und Rinnen wachsen mit der Höhe; niedrige Vorberge bleiben weich */
  const ribs=.65*Math.sin(x*.55+z*.28)+.35*Math.sin(x*.9-z*.37),crag=sm(8,30,h)*h*(ridged(x,z)-.42)*.42;return Math.max(0,(h+crag+ribs*sm(3,15,h))*w);
 }
 function rawHeight(x,z){let h=baseHeight(x,z);for(const [cx,cz] of LEDGES){const d=Math.hypot(x-cx,z-cz);if(d<5.4)h+=(baseHeight(cx,cz)-h)*(1-sm(2.8,5.4,d));}
  {const d=Math.hypot(x-HUT.x,z-HUT.z);if(d<HUT.f){const y=baseHeight(HUT.x,HUT.z);h+=(y-h)*(1-sm(HUT.r,HUT.f,d));}}
  /* v403: kleines Gipfelplateau am Hauptgipfel – Platz für Kreuz, Steinmann und Gipfelstürmer */
  const ds=Math.hypot(x-95,z+177);if(ds<7)h+=(Math.min(h,71.5+.3*ds)-h)*(1-sm(3.8,7,ds));return h;}
 function height(x,z){if(!contains(x,z))return 0;
  let h=rawHeight(x,z),e=lakeE(x,z);
  const along=(-(x-62)+(z+144))/Math.SQRT2,side=((x-62)+(z+144))/Math.SQRT2;
  /* v403: Karsee mit Felsriegel – das Ufer steigt gleich hinter der Wasserlinie über den Spiegel (Kamm L.y+1,9); auf der Bergseite
     wächst die Karwand weiter, zur Talseite fällt der Riegel erst danach ab. Nur die Abflusskerbe bleibt offen (vorher lag das
     Gelände außen tiefer als der See, er wirkte wie übergelaufen). */
  if(e<1.6){const basin=L.y-2.4+2.1*sm(.18,1,e),crest=L.y-.3+3.8*sm(1,1.16,e); /* v405: Felsrand höher (Spiegel + 3,5 statt + 1,9) */
   if(e<1)h=basin;else h=h>=crest?crest+(h-crest)*sm(1.05,1.35,e):crest+(h-crest)*sm(1.32,1.75,e);
   const notch=(1-sm(FW-.2,FW+.6,Math.abs(side)))*sm(-3.6,-2.2,along);if(notch>0&&e>=1)h+=(Math.min(h,L.y-.3)-h)*notch;}
  if(e>=1||channel(x,z).y<1)h=cutChannel(x,z,h);
  if(along>-.4&&along<11&&Math.abs(side)<FW+3){const cliff=(L.y-.1)*(1-sm(-.1,1.5,along));const sa=Math.abs(side),wide=sm(1,2.2,along),k=(1-sm(FW-.1,FW+.9,sa))*(1-wide)+(1-sm(FW+.3,FW+2.6,sa))*wide;h=h+(Math.min(h,cliff)-h)*k; /* v405: an der Lippe senkrechte Felswangen direkt neben dem Fall – kein Überlauf neben der Kerbe */}
  /* v403: runder, tiefer Kolk; wirkt nur vor der Wand (nicht durch den Riegel in den See) */
  const ePool=poolE(x,z);if(ePool<1.6&&along>.2){const k=sm(.2,1.5,along),bed=POOL.y-.4-2.2*(1-sm(.1,1,ePool)),bank=POOL.y-.32+1.1*sm(1,1.12,ePool),t=ePool<1?bed:bank+(h-bank)*sm(1.12,1.6,ePool);h+=(t-h)*k;}
  if(channel(x,z).y<1)h=cutChannel(x,z,h,true);
  return h;
 }

 /* v403: Schnee – Firnfelder über ~55 in flacheren Lagen, Restschnee in Mulden ab ~42, Gipfelkappen auch an steilen Flanken */
 function snowAmt(h,slope,n2,n3){const line=50+8*n2;return Math.min(1,sm(line-4,line+3,h)*(1-sm(1.3,2,slope))+sm(.6,.76,n3)*sm(40,50,h)*(1-sm(.9,1.5,slope))+sm(56,68,h)*(1-sm(2.4,3.8,slope))*.85);}
 function color(x,z,h){const w=sm(.02,.3,weight(x,z)),e=lakeE(x,z),n=Math.sin(x*.71+z*.43)*.5+.5;
  const slope=Math.hypot(height(x+.6,z)-height(x-.6,z),height(x,z+.6)-height(x,z-.6))/1.2;
  /* v403: Höhenstufen wie in den Kalkalpen – Bergwald, Almwiese, Latschen-/Schuttzone, heller gebänderter Fels, Schnee in Mulden und am Gipfel */
  const n2=vnoise(x*.31+7,z*.31-3),n3=vnoise(x*1.7,z*1.7);
  let c=mix(col(0x5b7c44),col(0x86a050),sm(8,22,h));c=mix(c,col(0x9aa462),sm(24,36,h)*(.6+.4*n2));
  c=mix(c,mix(col(0xa9a593),col(0xc0baa4),n3),sm(.5,.85,slope)*(1-sm(1.2,1.6,slope))*sm(4,12,h));
  const band=.88+.12*Math.sin(h*1.9+n2*3.1),rock=mix(mix(col(0x7c7f7e),col(0xb3ae9f),n2*.7+n3*.3),col(0x9a8a72),sm(.55,.8,vnoise(x*.08+3,z*.08))*.5).map(v=>v*band); /* v408: warme Kalktöne im Wechsel mit kühlem Grau */
  /* v408: Rinnen dunkler, Grate heller (aus demselben Gratrauschen wie die Form) – macht die Felsstruktur lesbar */
  const ao=.78+.34*ridged(x,z);c=mix(c,rock.map(v=>Math.min(1,v*ao)),Math.max(sm(.8,1.25,slope),sm(40,58,h)*.75));
  const snow=snowAmt(h,slope,n2,n3);
  c=mix(c,col(0xeef3f6),Math.min(1,snow));
  /* v403: Kiesufer statt Wiesenkragen: heller Schotter am Wasser, dahinter Fels des Riegels */
  if(e<1.3){const sh=e<1?col(0x3b6967):mix(col(0x8b887b),col(0xaba692),n3);c=mix(sh,c,e<1?sm(.94,1.12,e):sm(1.1,1.3,e));}
  {const ep=poolE(x,z);if(ep>=1&&ep<1.35)c=mix(mix(col(0x5c645e),col(0x7b8076),n3),c,sm(1.05,1.35,ep));}
  if((-(x-62)+(z+144))/Math.SQRT2>.1&&Math.abs((x-62)+(z+144))<10&&h<L.y-.8&&slope>.8)c=mix(col(0x596760),col(0x8a8b7f),sm(1,2.4,slope)); /* v380: nasser Fels unter der Fallkante, kein türkis gefärbter Seegrund an der Wand */
  if(slope>.7&&h<L.y-1&&e<1.15)c=col(0x72796c);
  const strata=.95+.05*Math.sin(h*.85+x*.09+z*.06);c=c.map(v=>v*strata);
  const q=channel(x,z);
  const base=groundSampler?groundSampler(x,z):typeof worldGroundCol==='function'?col(worldGroundCol(x,z)):col(0x719c48);let result=mix(base,c,w);
  if(q.y<1&&q.d<4.5&&poolE(x,z)>.98){const shore=mix(col(0x7d8470),col(0x9a9b83),sm(-.1,1.1,q.d));result=mix(shore,result,sm(.5,4.5,q.d));}return result;
 }
 function inside(x,z){const cx=-28,cz=-28,a=Math.atan2(z-cz,x-cx);return Math.hypot(x-cx,z-cz)<apronEdgeRadius(a)-.25;}
 function project(x,z){if(inside(x,z))return [x,z];const a=Math.atan2(z+28,x+28),r=apronEdgeRadius(a)-.25;return [-28+Math.cos(a)*r,-28+Math.sin(a)*r];}
 function normal(x,z){const d=.45;return G3.norm([height(x-d,z)-height(x+d,z),d*2,height(x,z-d)-height(x,z+d)]);}
 function terrain(cell,store){const b=new FM.MB(),nx=Math.ceil((B.x1-B.x0)/cell),nz=Math.ceil((B.z1-B.z0)/cell),dx=(B.x1-B.x0)/nx,dz=(B.z1-B.z0)/nz,V=[],fine=new Set(),cache=new Map(),N=3;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const X=B.x0+i*dx,Z=B.z0+j*dz,p=project(X,Z),h=height(...p);V.push({out:!inside(X,Z),p:[p[0],h+.012*sm(0,.5,h),p[1]],c:color(p[0],p[1],h),n:normal(p[0],p[1])});}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=B.x0+(i+.5)*dx,z=B.z0+(j+.5)*dz,e=lakeE(x,z);if(channel(x,z).d<3.6||(e>.82&&e<1.18)||poolE(x,z)<1.5)fine.add(j*nx+i);}
  const interpolate=(a,b,t)=>({out:a.out&&b.out,p:mix(a.p,b.p,t),c:mix(a.c,b.c,t),n:G3.norm(mix(a.n,b.n,t))});
  function vertex(I,J){const key=J*(nx*N+1)+I;if(cache.has(key))return cache.get(key);const i=Math.min(nx-1,Math.floor(I/N)),j=Math.min(nz-1,Math.floor(J/N)),u=(I-i*N)/N,v=(J-j*N)/N;let out;
   if(I%N===0&&J%N===0)out=V[(J/N)*(nx+1)+I/N];
   else if(I%N===0&&(!fine.has(j*nx+i)||!fine.has(j*nx+i-1)))out=interpolate(V[j*(nx+1)+I/N],V[(j+1)*(nx+1)+I/N],v);
   else if(J%N===0&&(!fine.has(j*nx+i)||!fine.has((j-1)*nx+i)))out=interpolate(V[(J/N)*(nx+1)+i],V[(J/N)*(nx+1)+i+1],u);
   else{const X=B.x0+I/N*dx,Z=B.z0+J/N*dz,p=project(X,Z),h=height(...p);out={out:!inside(X,Z),p:[p[0],h+.012*sm(0,.5,h),p[1]],c:color(p[0],p[1],h),n:normal(p[0],p[1])};}cache.set(key,out);return out;
  }
  const quad=(a,d,c,e)=>{if([a,d,c,e].every(q=>q.out))return;const face=G3.norm([(d.p[1]-a.p[1])*(c.p[2]-a.p[2])-(d.p[2]-a.p[2])*(c.p[1]-a.p[1]),(d.p[2]-a.p[2])*(c.p[0]-a.p[0])-(d.p[0]-a.p[0])*(c.p[2]-a.p[2]),(d.p[0]-a.p[0])*(c.p[1]-a.p[1])-(d.p[1]-a.p[1])*(c.p[0]-a.p[0])]),fk=(.12+.55*(1-sm(.5,.86,face[1])))*sm(2,10,(a.p[1]+c.p[1])/2),n=q=>G3.norm(mix(q.n,face,fk)); /* v403: Felswände facettiert, Wiesen weich */
   /* v408: Farbe je Dreieck statt Verlauf über die Fläche – klare Low-Poly-Facetten wie bei Bäumen und Häusern (vorher verschwommene
      Übergänge); Fels mit stärkerer, Wiese mit leichter Helligkeitsstreuung je Facette */
   const rock=1-sm(.55,.85,face[1]),tc=(p,q,r)=>{const cx=(p.p[0]+q.p[0]+r.p[0])/3,cz=(p.p[2]+q.p[2]+r.p[2])/3,j=1+(vnoise(cx*1.7,cz*1.7)-.5)*(.06+.16*rock),hy=(p.p[1]+q.p[1]+r.p[1])/3;let m=[0,1,2].map(i=>(p.c[i]+q.c[i]+r.c[i])/3);
    /* Grasbänder auf flacheren Facetten zwischen den Felsen (scharfe Fels-/Wiesengrenze), nicht im Schnee und nicht am Wasser */
    const g=sm(.6,.76,face[1])*(1-sm(44,58,hy))*sm(6,12,hy)*(m[0]+m[1]+m[2]<2.3?1:0)*(lakeE(cx,cz)>1.3&&poolE(cx,cz)>1.4?1:0);if(g>0)m=mix(m,mix(col(0x7d9a4a),col(0x93a85a),vnoise(cx*.9,cz*.9)),g*.8);
    return m.map(v=>Math.min(1,v*j));},c1=tc(a,d,c),c2=tc(a,c,e);
   b.v.push(...a.p,...n(a),...c1,...d.p,...n(d),...c1,...c.p,...n(c),...c1,...a.p,...n(a),...c2,...c.p,...n(c),...c2,...e.p,...n(e),...c2);};
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){if(fine.has(j*nx+i)){for(let v=0;v<N;v++)for(let u=0;u<N;u++){const I=i*N+u,J=j*N+v;quad(vertex(I,J),vertex(I,J+1),vertex(I+1,J+1),vertex(I+1,J));}}else quad(V[j*(nx+1)+i],V[(j+1)*(nx+1)+i],V[(j+1)*(nx+1)+i+1],V[j*(nx+1)+i+1]);}
  if(store)grid={nx,nz,dx,dz,V,fine,vertex,N};return b;
 }
 /* v386: Ein Material für See, Kolk und Fluss; am Auslauf dieselben
    Strömungskoordinaten statt einer sichtbaren Materialkante. */
 function basinWater(poly,cx,cz,y,N,mouth){const b=new FM.MB(),grow=i=>{const p=poly[i%poly.length].p;if(!mouth)return 1.035;const mc=[(mouth[0][0]+mouth[1][0])/2,(mouth[0][1]+mouth[1][1])/2],hw=Math.hypot(mouth[0][0]-mc[0],mouth[0][1]-mc[1]);return 1+.035*sm(hw+.2,hw+4,Math.hypot(p[0]-mc[0],p[1]-mc[1])); /* v405: Zuwachs läuft zur Abflusskante weich aus – kein Knick an der Lippe */},at=(i,r)=>{const g=r>.999?grow(i):1;return [cx+(poly[i%poly.length].p[0]-cx)*r*g,y,cz+(poly[i%poly.length].p[1]-cz)*r*g];}; /* v403: Rand 3,5 % unter das ansteigende Ufer, Abflusskanten exakt */
  const coords=p=>{const pool=y<1,head=pool?DRAIN[0]:[62,-144],tx=pool?dsx/dsl:-Math.SQRT1_2,tz=pool?dsz/dsl:Math.SQRT1_2,dx=p[0]-head[0],dz=p[2]-head[1],along=dx*tx+dz*tz,side=(-tz*dx+tx*dz)/(pool?3:3.2),rad=pool?poolE(p[0],p[2]):lakeE(p[0],p[2]),mouth=sm(-5,0,along)*(1-sm(1,2,Math.abs(side)))*(1-sm(0,2,along));return[along,rad*.85*(1-mouth)+side*mouth,.45];};
  for(let j=0;j<N;j++)for(let i=0;i<poly.length;i++){const r=j/N,s=(j+1)/N,A=at(i,r),B=at(i+1,s),C=at(i,s),D=at(i+1,r);b.triV(A,B,C,coords(A),coords(B),coords(C));if(j)b.triV(A,D,B,coords(A),coords(D),coords(B));}return b;
 }
 function water(){return basinWater(lakeOutline,L.x,L.z,L.y,5,[-1,1].map(s=>[62+Math.SQRT1_2*FW*s,-144+Math.SQRT1_2*FW*s]));}
 /* v384: Das Talwasser gehört zum durchgehenden Flussmesh in worldview.js.
    Kein überlagertes Band, keine separat endende Strömungsphase. */
 function riverWidth(x,z){return nearest(riverProfile(),x,z).w;}
 function setGroundSampler(fn){if(!geometry)groundSampler=fn;}
 function riverLevel(x,z){return nearest(riverProfile(),x,z).y;}
 function riverBankY(x,z,y){return contains(x,z)?Math.max(y,height(x,z)+.032):y;}
 function fallPath(t){return [62-2.4*t,L.y-(L.y-POOL.y)*t*t,-144+2.4*t,FW*(1-.15*t)];}
 function fallMesh(){const b=new FM.MB(),N=24,M=10;const at=(t,w)=>{const p=fallPath(t);return[p[0]+w*p[3]/Math.SQRT2,p[1],p[2]+w*p[3]/Math.SQRT2];};
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){const t=i/N,u=(i+1)/N,a=-1+j*2/M,d=a+2/M,A=at(t,a),B=at(t,d),C=at(u,d),D=at(u,a),ca=[t,(a+1)/2,1],cb=[t,(d+1)/2,1],cc=[u,(d+1)/2,1],cd=[u,(a+1)/2,1];b.triV(A,B,C,ca,cb,cc);b.triV(A,C,D,ca,cc,cd);b.triV(A,C,B,ca,cc,cb);b.triV(A,D,C,ca,cd,cc);}return b;}
 function poolMesh(){return basinWater(poolOutline,POOL.x,POOL.z,POOL.y,4,[-1,1].map(s=>[DRAIN[0][0]+(-dsz/dsl)*DRAIN[0][3]*s,DRAIN[0][1]+(dsx/dsl)*DRAIN[0][3]*s]));}
 /* v404: Aufprallschaum als Band über die ganze Fallbreite (Schaderkoordinaten wie beim Auftreffsaum: x stromab, w quer ±1),
    Kanten in den runden Kolk eingepasst. Vorher ovale Ringzone um einen Punkt – wirkte wie ein dünner, runder Strahl. */
 function foamMesh(){const b=new FM.MB(),N=12,M=26,dx=-Math.SQRT1_2,dz=Math.SQRT1_2,sx=Math.SQRT1_2,sz=Math.SQRT1_2,Lx=FOAM.lx,Ly=FOAM.ly,f=FALL.foot;
  const at=(x,w)=>{let X=f[0]+dx*x*Lx+sx*w*Ly,Z=f[2]+dz*x*Lx+sz*w*Ly;const e=poolE(X,Z);if(e>.95){const k=.95/e;X=POOL.x+(X-POOL.x)*k;Z=POOL.z+(Z-POOL.z)*k;}return [X,POOL.y+.018,Z];};
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){const x0=-.3+1.6*i/N,x1=-.3+1.6*(i+1)/N,w0=-1.15+2.3*j/M,w1=-1.15+2.3*(j+1)/M;
   b.triV(at(x0,w0),at(x1,w1),at(x0,w1),[x0,w0,-1],[x1,w1,-1],[x0,w1,-1]);b.triV(at(x0,w0),at(x1,w0),at(x1,w1),[x0,w0,-1],[x1,w0,-1],[x1,w1,-1]);}return b;}
 /* v403: Bergfichte schlank (Schneelast), fünf hängende Astetagen mit gezackten Rändern, helle Spitze; Fernstufe zwei Kegel */
 function spruce(b,x,y,z,s,far,tint,rot){if(!far)b.box(.16*s,1.2*s,.16*s,0x5e4a36,{x,y,z}); /* v408: Fernstufe ohne Stamm (aus der Ferne unsichtbar, spart Dreiecke) */
 const L=far?2:5,top=G3.col(tint).map(v=>Math.min(1,v*1.22));for(let j=0;j<L;j++){const t=j/L,r=(1.05-.78*t)*s,Y=y+(.75+t*3.5)*s,hh=(far?2.6:1.7-.5*t)*s,cc=t>.7?top:tint;b.cone(r,hh,far?5:7,cc,{x,y:Y,z,ry:rot+j*.7});
  if(!far)for(let k=0;k<7;k++){const a=rot+j*.7+k/7*Math.PI*2,R=r*(1.12+.12*Math.sin(k*2.3+j));b.tri([x+Math.cos(a-.2)*r*.7,Y+.24*s,z+Math.sin(a-.2)*r*.7],[x+Math.cos(a)*R,Y-.2*s,z+Math.sin(a)*R],[x+Math.cos(a+.2)*r*.7,Y+.08*s,z+Math.sin(a+.2)*r*.7],cc);}}
 if(!far)b.cone(.12*s,.7*s,4,top,{x,y:y+4.6*s,z});}
 function larch(b,x,y,z,s,far,rot){if(!far)b.box(.15*s,1.6*s,.15*s,0x6b4a33,{x,y,z});const c=far?1:3;for(let j=0;j<c;j++){const t=j/c;b.ico((.95-.45*t)*s,[0x7f9a4c,0x8ea957,0x738f45][j%3],{x:x+Math.sin(rot+j)*.12*s,y:y+(1.7+t*2.1)*s,z:z+Math.cos(rot+j)*.12*s,sy:1.25,sx:.85,sz:.85});}}
 function latsche(b,x,y,z,s,rot){/* Legföhre: niedrige, breite, dunkle Polster */const n=3;for(let j=0;j<n;j++){const a=rot+j*2.1,d=j?.55*s:0;b.ico((.75-.12*j)*s,j%2?0x2f5236:0x3a6040,{x:x+Math.cos(a)*d,y:y+.22*s,z:z+Math.sin(a)*d,sy:.45,ry:a});}}
 function scenery(){const near=new FM.MB(),far=new FM.MB(),detail=new FM.MB(),rnd=wRng(373),trees=[];
  /* v403: Höhenstufen: Fichten/Lärchen bis ~28, darüber Latschenfelder bis ~46 (wie die Waldgrenze in den Kalkalpen) */
  for(let i=0;i<7000&&trees.length<245;i++){const x=22+rnd()*112,z=-191+rnd()*68,h=height(x,z),e=lakeE(x,z),sl=Math.hypot(height(x+.8,z)-h,height(x,z+.8)-h)/.8,lat=h>24;
   if(!contains(x,z)||!inside(x,z)||h<1||h>46||sl>(lat?1.25:h<22?1.3:1.0)||e<1.3||poolE(x,z)<1.35||channel(x,z).d<3||trees.some(t=>Math.hypot(t.x-x,t.z-z)<(lat?2:2.6)))continue;
   if(x<57&&z>-145)continue;const s=(lat?.8:.75)+rnd()*.6,rot=rnd()*6.28,k=lat?'latsche':rnd()<.2?'larch':'spruce';trees.push({x,z,h,s,k});
   if(k==='latsche')latsche(near,x,h,z,s,rot); /* Latschen blenden in der Fernstufe aus (Budget) */else if(k==='larch'){larch(near,x,h,z,s,false,rot);larch(far,x,h,z,s,true,rot);}
   else{const tint=[0x2f5243,0x3a6048,0x46694a][i%3];spruce(near,x,h,z,s,false,tint,rot);spruce(far,x,h,z,s,true,tint,rot);}
  }
  for(let i=0;i<110;i++){const x=25+rnd()*112,z=-190+rnd()*65,h=height(x,z);if(!inside(x,z)||!contains(x,z)||h<1||lakeE(x,z)<1.08||poolE(x,z)<1.15||channel(x,z).d<1.8)continue;const r=.18+rnd()*.6;if(Math.hypot(x-HUT.x,z-HUT.z)<HUT.f+1)continue;const sl=Math.hypot(height(x+.6,z)-h,height(x,z+.6)-h)/.6;detail.ico(r,0x85897c,{x,y:h+r*(.28-.4*Math.min(1,sl)),z,sy:.55,ry:rnd()*6.28});} /* v409: am Hang tiefer eingesunken, nicht am Hüttenplatz */
  /* v408: Felsköpfe und Schrofen an steilen Hängen – kantige, teils eingesunkene Blöcke in Felsfarbe, nur in der Nahstufe */
  for(let i=0;i<900;i++){const x=24+rnd()*112,z=-196+rnd()*72;if(!inside(x,z)||!contains(x,z))continue;const h=height(x,z);if(h<8||h>70||lakeE(x,z)<1.15||poolE(x,z)<1.3||channel(x,z).d<3)continue;
   const sl=Math.hypot(height(x+.8,z)-h,height(x,z+.8)-h)/.8;if(sl<.9||sl>1.9||rnd()>.35||Math.hypot(x-HUT.x,z-HUT.z)<HUT.f+2)continue;const r=.6+rnd()*1.1,c=h>52?0xa9a79c:[0x7d7f79,0x8b8b82,0x6f716b][i%3];detail.ico(r,c,{x,y:h-r*(.3+.25*Math.min(1,sl-.9)),z,sx:1+rnd()*.5,sy:.55+rnd()*.3,ry:rnd()*6.28});}
  // Schuttfächer und einzelne Felsschichten statt gleichmäßig verteilter Steinbälle.
  for(const [x,z,r] of [[96,-158,5],[105,-144,4],[50,-164,3]])for(let i=0;i<22;i++){const a=rnd()*6.28,d=Math.sqrt(rnd())*r,X=x+Math.cos(a)*d,Z=z+Math.sin(a)*d,h=height(X,Z);if(lakeE(X,Z)<1.08||poolE(X,Z)<1.15)continue;detail.ico(.13+rnd()*.3,0x939688,{x:X,y:h+.08,z:Z,sy:.45});}
  return {near,far,detail,trees};
 }
 /* v403: Kleine Entdeckungen für die Nahansicht (nur unter ~110 Abstand sichtbar): Gipfelkreuz mit Gipfelbuch, Almhütte mit
    Bank, Brennholz, Brunnentrog und Rauch, Wanderweg mit gelben Wegweisern und Steinmännchen, Wanderer, Zelt mit Lagerfeuer,
    Aussichtsbank am See, Edelweiß und Enzian, Findlinge um den Kolk – und ein paar Späße: Gartenzwerg am See, Yeti-Spuren im
    Schnee, ein verlorener Wanderschuh, ein Picknick, eine Ente im Kolk und ein Angler im Ruderboot. */
 function flatSpot(cands,ok){let best=null,score=1e9;for(const [x,z] of cands){if(!inside(x,z)||!contains(x,z))continue;const h=surface(x,z),sl=Math.hypot(surface(x+1,z)-surface(x-1,z),surface(x,z+1)-surface(x,z-1))/2;if(!ok(x,z,h,sl))continue;const c=sl;if(c<score){score=c;best=[x,h,z];}}return best;}
 /* v404: Wegsuche auf einem 1er-Raster mit Binärheap; Kosten nach Hangneigung, Wasser gesperrt */
 /* v404: Wegsuche auf einem 1er-Raster mit Binärheap. Kosten nach der Steigung des Wegstücks selbst (nicht des Hangs): so entstehen
    Serpentinen, die schräg im Hang liegen. Felswände (Hang > ~62°) und Wasser sind gesperrt; strict: kein Wegstück steiler als ~35° (Bergsteig mit Stufen). */
 function route(a,b,slopeAt,strict){const nx=Math.ceil(B.x1-B.x0),id=(i,j)=>j*(nx+1)+i,pos=k=>{const j=Math.floor(k/(nx+1)),i=k-j*(nx+1);return [B.x0+i,B.z0+j];},memo=new Map();
  const cell=k=>{if(memo.has(k))return memo.get(k);const [x,z]=pos(k);let c=null;if(inside(x,z)&&lakeE(x,z)>1.12&&poolE(x,z)>1.25&&channel(x,z).d>2.4&&slopeAt(x,z)<(strict?1.9:2.4))c=surface(x,z);memo.set(k,c);return c;};
  const S0=id(Math.round(a[0]-B.x0),Math.round(a[1]-B.z0)),T=id(Math.round(b[0]-B.x0),Math.round(b[1]-B.z0)),[tx,tz]=pos(T),H=[],g=new Map([[S0,0]]),from=new Map(),done=new Set();
  const push=(f,k)=>{H.push([f,k]);let i=H.length-1;while(i){const p=(i-1)>>1;if(H[p][0]<=H[i][0])break;[H[p],H[i]]=[H[i],H[p]];i=p;}},pop=()=>{const top=H[0],last=H.pop();if(H.length){H[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<H.length&&H[l][0]<H[m][0])m=l;if(r<H.length&&H[r][0]<H[m][0])m=r;if(m===i)break;[H[m],H[i]]=[H[i],H[m]];i=m;}}return top;};
  push(0,S0);while(H.length){const [,k]=pop();if(done.has(k))continue;done.add(k);if(k===T)break;const [x,z]=pos(k),hk=cell(k)!=null?cell(k):surface(x,z);
   for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){if(!di&&!dj)continue;const X=x+di,Z=z+dj;if(X<B.x0||Z<B.z0||X>B.x1||Z>B.z1)continue;const K=id(X-B.x0,Z-B.z0),hK=cell(K);if(hK==null&&K!==T)continue;
    const len=Math.hypot(di,dj),grade=Math.abs((hK!=null?hK:surface(X,Z))-hk)/len;if(strict&&grade>.7)continue;
    const ng=g.get(k)+len*(1+40*Math.max(0,grade-.18)**2+(grade>.55?80:0));if(ng<(g.has(K)?g.get(K):Infinity)){g.set(K,ng);from.set(K,k);push(ng+Math.hypot(tx-X,tz-Z),K);}}}
  if(!from.has(T))return null;const out=[];let k=T;while(k!=null){out.push(pos(k));k=from.get(k);}return out.reverse();}
 /* v404: Rasterweg straff ziehen – Zwischenpunkte entfallen, solange die gerade Strecke begehbar bleibt (kein Wasser, keine Wand,
    Steigung je halbe Einheit ≤ 0,7). Entfernt die Ein-Feld-Zacken der Rastersuche. */
 function pull(P,slopeAt){if(P.length<3)return P;const ok=(a,b)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(l/.5));let h0=surface(a[0],a[1]);
   for(let k=1;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n,h=surface(x,z);if(lakeE(x,z)<1.12||poolE(x,z)<1.25||channel(x,z).d<2.4||slopeAt(x,z)>1.9||Math.abs(h-h0)/(l/n)>.7)return false;h0=h;}return true;};
  const out=[P[0]];let i=0;while(i<P.length-1){let j=Math.min(P.length-1,i+30);while(j>i+1&&!ok(P[i],P[j]))j--;out.push(P[j]);i=j;}return out;}
 const chaikin=P=>P.length<3?P:[P[0]].concat(P.slice(0,-1).flatMap((p,i)=>{const q=P[i+1];return [[p[0]*.75+q[0]*.25,p[1]*.75+q[1]*.25],[p[0]*.25+q[0]*.75,p[1]*.25+q[1]*.75]];}),[P[P.length-1]]);
 function resample(P,step){if(P.length<2)return P;const out=[P[0]];let acc=0;for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);let t=step-acc;while(t<=l){out.push([a[0]+(b[0]-a[0])*t/l,a[1]+(b[1]-a[1])*t/l]);t+=step;}acc=(acc+l)%step;}out.push(P[P.length-1]);return out;}
 const nearestIdx=(P,q)=>{let bi=0,bd=1e9;P.forEach((p,i)=>{const d=Math.hypot(p[0]-q[0],p[1]-q[1]);if(d<bd){bd=d;bi=i;}});return bi;};
 /* gelbe Wegtafel als Pfeil (Fünfeck-Prisma), beginnt am Pfosten und zeigt in lokale +x-Richtung */
 function arrowBoard(b){const P=[[.04,-.1],[.78,-.1],[.98,0],[.78,.1],[.04,.1]],t=.035,c=0xf2c230,e=0xc99a1e;
  b.tri([P[0][0],P[0][1],t],[P[1][0],P[1][1],t],[P[2][0],P[2][1],t],c);b.tri([P[0][0],P[0][1],t],[P[2][0],P[2][1],t],[P[3][0],P[3][1],t],c);b.tri([P[0][0],P[0][1],t],[P[3][0],P[3][1],t],[P[4][0],P[4][1],t],c);
  b.tri([P[0][0],P[0][1],-t],[P[2][0],P[2][1],-t],[P[1][0],P[1][1],-t],c);b.tri([P[0][0],P[0][1],-t],[P[3][0],P[3][1],-t],[P[2][0],P[2][1],-t],c);b.tri([P[0][0],P[0][1],-t],[P[4][0],P[4][1],-t],[P[3][0],P[3][1],-t],c);
  for(let i=0;i<5;i++){const p=P[i],q=P[(i+1)%5];b.quad([p[0],p[1],t],[p[0],p[1],-t],[q[0],q[1],-t],[q[0],q[1],t],e);}
  b.box(.5,.03,.012,0xffffff,{x:.4,y:-.015,z:t+.004});}                                                                    /* weißer Schriftstreifen */
 function ring(cx,cz,r0,r1,n,seed){const rnd=wRng(seed),out=[];for(let i=0;i<n;i++){const a=rnd()*6.283,r=r0+(r1-r0)*Math.sqrt(rnd());out.push([cx+Math.cos(a)*r,cz+Math.sin(a)*r]);}return out;}
 function extras(trees){const fun=new FM.MB(),rnd=wRng(4031),spots={},free=(x,z,r)=>!trees.some(t=>Math.hypot(t.x-x,t.z-z)<r)&&lakeE(x,z)>1.12&&poolE(x,z)>1.15&&channel(x,z).d>2.2;
  const P=o=>typeof FWM!=='undefined'&&FWM.person?FWM.person(o):null,put=(m,t)=>{if(m)fun.merge(m,t);};
  /* Gipfelkreuz auf dem Plateau des Hauptgipfels */
  const top=[95,surface(95,-177),-177];spots.summit=top;
  fun.box(.16,3.2,.16,0x6e4b2f,{x:top[0],y:top[1]-.2,z:top[2]});fun.box(1.5,.16,.16,0x6e4b2f,{x:top[0],y:top[1]+2.05,z:top[2]});
  fun.box(.5,.08,.5,0x4a3a2a,{x:top[0],y:top[1]+3.0,z:top[2]});fun.box(.22,.28,.14,0x8e9aa3,{x:top[0],y:top[1]+.9,z:top[2]+.12});           /* Dach, Gipfelbuch-Kasten */
  const g=(dx,dz)=>surface(top[0]+dx,top[2]+dz);
  for(let k=0;k<4;k++)fun.ico(.42-k*.08,0x8f8d84,{x:top[0]+1.5,y:g(1.5,.6)+.1+k*.42,z:top[2]+.6,sy:.6,ry:k});                                 /* Steinmann */
  put(P({shirt:0xd8432f,pants:0x3a3f4a,hat:'cap',hatC:0x2f6fb0,boots:0x3a2a1a,seed:31}),{x:top[0]-1.1,y:g(-1.1,.8)-.03,z:top[2]+.8,ry:2.3,s:1.2});
  fun.box(.5,.32,.4,0x2f6b4a,{x:top[0]-1.9,y:g(-1.9,.2),z:top[2]+.2,ry:.4});                                                               /* abgestellter Rucksack */
  /* Almhütte auf einer flachen Stelle der Talseite, Blick auf den Wasserfall */
  const hut=[HUT.x,surface(HUT.x,HUT.z),HUT.z]; /* v409: fester, eingeebneter Bauplatz */
  /* v409: Hütte auf eingeebnetem Bauplatz (HUT im Höhenfeld) mit flacher Steinterrasse – vorher schwebte die Talseite in der Luft */
  if(hut){const [x,,z]=hut,ry=Math.atan2(POOL.x-x,POOL.z-z),cr=Math.cos(ry),sr=Math.sin(ry);let lo=1e9,hi=-1e9;
   for(let u=-3.3;u<=3.31;u+=.55)for(let v=-2.3;v<=3.41;v+=.57){const g=surface(x+cr*u+sr*v,z-sr*u+cr*v);lo=Math.min(lo,g);hi=Math.max(hi,g);}
   const y=(hi+lo)/2+.15;hut[1]=y; /* halb eingeschnitten, halb aufgeschüttet – niedrige Mauer */hut[3]=ry;spots.hut=hut;fun.at({x,y,z,ry},b=>{
    {const th=y-lo+.4;b.box(6.6,th,5.7,0x8f8c80,{y:.04-th,z:.55});b.box(6.7,.08,5.8,0x9a978c,{y:-.04,z:.55});}                             /* Steinterrasse bis unter den tiefsten Bodenpunkt */                                                                                          /* flache Steinterrasse auf dem eingeebneten Platz */
    b.box(5.2,.7,4,0x8f8d84,{y:-.3});b.box(4.8,2.1,3.6,0x8a5a34,{y:.4});for(let k=0;k<5;k++)b.box(4.86,.06,3.66,0x6e4528,{y:.6+k*.42});
    b.roof(5.8,4.4,1.5,0x6b6f72,{y:2.5,gable:0x7a4c2c});b.box(.5,1.1,.5,0x8f8d84,{x:1.3,y:3.1,z:-.6});
    b.box(1,1.6,.08,0x5a3a22,{z:1.82,y:.4});[-1.6,1.6].forEach(q=>{b.box(.8,.7,.08,0xcfe4ee,{x:q,y:1.3,z:1.82});b.box(.9,.18,.25,0x8a5a34,{x:q,y:1.12,z:1.95});for(let f=0;f<4;f++)b.ico(.11,[0xd8332b,0xe85a8a,0xd8332b,0xf2c231][f],{x:q-.3+f*.2,y:1.3,z:1.98});});
    b.box(2.4,.08,.45,0x7a4c2c,{x:0,y:.3,z:2.55});[-1,1].forEach(q=>b.box(.1,.3,.4,0x5a3a22,{x:q*1.05,y:0,z:2.55}));                   /* Bank – v406: Sitzhöhe = Oberschenkel der sitzenden Figur (0,317 × 1,2) */
    for(let k=0;k<12;k++)b.cyl(.13,.13,1.2,6,k%3?0xa07a50:0x8c6a46,{x:-2.9,y:.05+Math.floor(k/4)*.27+.13,z:-1.4+(k%4)*.3,rz:Math.PI/2}); /* Brennholz */
    b.box(.5,.45,1.5,0x6e4b2f,{x:2.85,y:-.05,z:1.3});b.box(.36,.06,1.3,0x6a9ab8,{x:2.85,y:.37,z:1.3});b.box(.12,.9,.12,0x6e4b2f,{x:2.85,y:.1,z:2.2}); /* Brunnentrog */
    for(let k=0;k<6;k++)b.box(.08,.75,.08,0x7a5a3a,{x:-2.6+k*1.05,y:-.05,z:3.25});b.box(5.4,.06,.06,0x7a5a3a,{x:0,y:.55,z:3.25});           /* Zaun */
   });
   put(P({shirt:0x3f78c8,pants:0x5a4a3a,hat:'hut',seed:41,sit:true}),{x:x+Math.sin(ry)*2.42+Math.cos(ry)*.6,y,z:z+Math.cos(ry)*2.42-Math.sin(ry)*.6,ry,s:1.2}); /* v406: Rücken über der Sitzfläche, Beine vor der Bank */
   spots.smoke=[x+Math.cos(ry)*1.3-Math.sin(ry)*.6,y+4.3,z-Math.sin(ry)*1.3-Math.cos(ry)*.6];}
  /* Aussichtsbank, Zelt mit Feuer, Picknick und Gartenzwerg am Seeufer (südliche Terrasse) */
  const shore=[];for(let i=0;i<72;i++){const a=i/72*Math.PI*2;for(const e of [1.3,1.45,1.6]){const x=L.x+Math.cos(a)*L.rx*e,z=L.z+Math.sin(a)*L.rz*e;shore.push([x,z]);}}
  /* v404: Aussichtsbank nur dort, wohin von der Hütte ein begehbarer Steig führt (Westufer; der Bach hat keine Brücke) */
  const slopeAt=(x,z)=>Math.hypot(surface(x+.7,z)-surface(x-.7,z),surface(x,z+.7)-surface(x,z-.7))/1.4,hutFront=hut?[hut[0]+Math.sin(hut[3])*3.4,hut[2]+Math.cos(hut[3])*3.4]:[33,-113];
  const benchC=[];for(const [x,z] of shore){if(!inside(x,z)||!contains(x,z))continue;const h=surface(x,z),sl=Math.hypot(surface(x+1,z)-surface(x-1,z),surface(x,z+1)-surface(x,z-1))/2;if(sl<.55&&x<60&&h>L.y&&h<L.y+8&&free(x,z,1.2)&&Math.hypot(x-62,z+144)>9)benchC.push([sl,x,h,z]);}
  benchC.sort((a,b)=>a[0]-b[0]);let bench=null,benchRoute=null;
  for(const st of [true,false]){if(bench)break;for(const c of benchC.slice(0,8)){const ry=Math.atan2(L.x-c[1],L.z-c[3]),r=route(hutFront,[c[1]-Math.sin(ry)*1.6,c[3]-Math.cos(ry)*1.6],slopeAt,st);if(r){bench=[c[1],c[2],c[3]];benchRoute=r;break;}}} /* erst Steig ≤ 35°, sonst steilerer Weg; Bank immer westlich des Falls (kein Bachübergang) */
  if(!bench&&benchC.length)bench=[benchC[0][1],benchC[0][2],benchC[0][3]];
  if(bench){const [x,y,z]=bench,ry=Math.atan2(L.x-x,L.z-z);bench[3]=ry;spots.bench=bench;fun.at({x,y,z,ry},b=>{b.box(1.8,.08,.42,0x7a4c2c,{y:.5});b.box(1.8,.4,.06,0x7a4c2c,{y:.6,z:-.2});[-.75,.75].forEach(q=>b.box(.08,.5,.4,0x5a3a22,{x:q}));});
   /* Gartenzwerg auf einem Findling daneben */
   const gx=x+Math.cos(ry)*1.8,gz=z-Math.sin(ry)*1.8,gy=surface(gx,gz);fun.ico(.55,0x8f8d84,{x:gx,y:gy+.2,z:gz,sy:.6});fun.at({x:gx,y:gy+.52,z:gz,ry,s:.8},b=>{b.cyl(.16,.2,.32,6,0x2f5aa8);b.ico(.13,0xf2c9a0,{y:.42});b.ico(.12,0xf4f4f0,{y:.34,z:.08,sy:1.3});b.cone(.15,.38,6,0xd8332b,{y:.48});});}
  const camp=flatSpot(shore,(x,z,h,sl)=>sl<.55&&h>L.y&&free(x,z,3)&&(!bench||Math.hypot(x-bench[0],z-bench[2])>8)&&Math.hypot(x-62,z+144)>10);
  if(camp){const [x,y,z]=camp,ry=Math.atan2(L.x-x,L.z-z);spots.camp=camp;fun.at({x,y,z,ry},b=>{
    b.at({x:-1.2,z:-.3},t=>{t.roof(1.9,1.5,1.1,0xe8792b,{gable:0xd0641f});t.box(.06,1.1,.06,0x555555,{x:-.95});t.box(.06,1.1,.06,0x555555,{x:.95});});   /* Zelt */
    for(let k=0;k<7;k++){const a=k/7*Math.PI*2;b.ico(.14,0x7d7d76,{x:1+Math.cos(a)*.45,y:.05,z:.6+Math.sin(a)*.45,sy:.7});}
    [0,1.1,2.2].forEach(a=>b.cyl(.06,.06,.7,5,0x6b4a33,{x:1,y:.08,z:.6,rz:Math.PI/2,ry:a}));b.cone(.22,.45,5,0xf29a2b,{x:1,y:.1,z:.6});b.cone(.12,.3,5,0xffd25a,{x:1,y:.14,z:.6});
    b.box(1.6,.03,1.2,0xd8332b,{x:-.2,y:.02,z:1.5});for(let q=0;q<4;q++)b.box(.4,.035,.3,0xf4f1ea,{x:-.8+(q%2)*.8+(Math.floor(q/2)?.4:0),y:.025,z:1.2+Math.floor(q/2)*.6});    /* Picknickdecke rot-weiß */
    b.box(.5,.32,.32,0xb98a50,{x:.1,y:.03,z:1.5});b.cyl(.04,.04,.3,5,0x8a6a3a,{x:.1,y:.35,z:1.5,rz:Math.PI/2});                              /* Korb */
   });spots.fire=[x+Math.cos(ry)*1+Math.sin(ry)*.6,y+.4,z-Math.sin(ry)*1+Math.cos(ry)*.6];
   {const px=x+Math.cos(ry)*1.9+Math.sin(ry)*.6,pz=z-Math.sin(ry)*1.9+Math.cos(ry)*.6,py=surface(px,pz);put(P({shirt:0x2f8a5a,pants:0x3a3f4a,hat:'strick',hatC:0xd8332b,seed:52,sit:true}),{x:px,y:py,z:pz,ry:ry-Math.PI/2,s:1.15});
    fun.at({x:px,y:py,z:pz,ry:ry-Math.PI/2},b=>b.cyl(.18,.18,1.1,7,0x7a5532,{x:-.55,y:.18,rz:-Math.PI/2}));}}   /* v406: sitzt auf einem Baumstamm statt in der Luft */
  /* v404: Wanderweg per Wegsuche (A*) auf einem 1er-Raster der Geländeoberfläche: jede Steigung kostet, über ~45° ist der Hang
     unbegehbar, See/Kolk/Bach sind gesperrt – so entstehen Serpentinen statt gerader Linien über Felswände. Danach geglättet und als
     durchgehendes Band mit gemeinsamen Kanten gelegt (vorher Einzelstücke mit Lücken und Überlappungen). */
  const way=[[33,-113]].concat(hut?[[hut[0]+Math.sin(hut[3])*3.4,hut[2]+Math.cos(hut[3])*3.4]]:[]).concat(bench?[[bench[0]+Math.sin(bench[3]+Math.PI)*1.6,bench[2]+Math.cos(bench[3]+Math.PI)*1.6]]:[]);
  let path=[];for(let i=1;i<way.length;i++){const r=(i===2&&benchRoute)||route(way[i-1],way[i],slopeAt,true)||route(way[i-1],way[i],slopeAt);if(r)path=path.concat(path.length?r.slice(1):r);}
  path=resample(chaikin(chaikin(chaikin(pull(path,slopeAt)))),.6);spots.path=path;
  /* v409: Trampelpfad statt Band: fünf Reihen quer – Mitte festgetretene Erde, nach außen in die Geländefarbe auslaufend (keine harte
     Kante), Breite schwankt leicht, vereinzelte Steine am Rand. Folgt dem Gelände über alle Reihen. */
  if(path.length>3){const O=[-1,-.45,0,.45,1],rows=O.map(()=>[]),cols=O.map(()=>[]),earth=[col(0x8a7051),col(0x9b8260)];
   for(let i=0;i<path.length;i++){const a=path[Math.max(0,i-3)],b=path[Math.min(path.length-1,i+3)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,p0=path[Math.max(0,i-2)],p2=path[Math.min(path.length-1,i+2)],t1=Math.atan2(path[i][1]-p0[1],path[i][0]-p0[0]),t2=Math.atan2(p2[1]-path[i][1],p2[0]-path[i][0]),turn=Math.abs(Math.atan2(Math.sin(t2-t1),Math.cos(t2-t1)));
    const w=(.6+.08*Math.sin(i*.53)+.05*Math.sin(i*1.7))*(1-.35*sm(.6,1.6,turn)),ux=-(b[1]-a[1])/l,uz=(b[0]-a[0])/l,[x,z]=path[i],n=vnoise(x*.8,z*.8);
    O.forEach((o,k)=>{const X=x+ux*w*o,Z=z+uz*w*o,g=surface(X,Z),edge=Math.abs(o)>.9;rows[k].push([X,g+(edge?.03:.07),Z]);
     const e=mix(earth[0],earth[1],n),t=color(X,Z,g);cols[k].push(edge?mix(t,e,.18):o===0?e.map(v=>v*.94):mix(e,t,.15));});}
   for(let i=1;i<path.length;i++)for(let k=0;k<O.length-1;k++){const A=rows[k],Bq=rows[k+1],cA=cols[k],cB=cols[k+1];fun.triV(A[i-1],Bq[i-1],Bq[i],cA[i-1],cB[i-1],cB[i]);fun.triV(A[i-1],Bq[i],A[i],cA[i-1],cB[i],cA[i]);}
   for(let i=3;i<path.length-3;i+=4){const r=rnd();if(r>.55)continue;const k=r<.27?0:4,p=rows[k][i],q=rows[2][i],X=q[0]+(p[0]-q[0])*.85,Z=q[2]+(p[2]-q[2])*.85;fun.ico(.07+r*.12,0x8d8c84,{x:X,y:surface(X,Z)+.03,z:Z,sy:.6,ry:r*9});}}
  /* Wegweiser neben dem Weg; die gelben Tafeln sind selbst Pfeile (ein Stück, am Pfosten angesetzt) und zeigen entlang des Weges */
  const dirTo=(i,j)=>{const a=path[i],b=path[Math.max(0,Math.min(path.length-1,j))];return Math.atan2(-(b[1]-a[1]),b[0]-a[0]);};
  const sign=(i,dirs)=>{if(i<0||i>=path.length)return;const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,x=path[i][0]-(b[1]-a[1])/l*1.15,z=path[i][1]+(b[0]-a[0])/l*1.15,y=surface(x,z);
   fun.box(.11,1.9,.11,0x7a5a3a,{x,y:y-.1,z});fun.box(.16,.06,.16,0x6a4a2a,{x,y:y+1.8,z});dirs.forEach((ry,k)=>fun.at({x,y:y+1.58-k*.3,z,ry},arrowBoard));};
  if(path.length>12){sign(2,[dirTo(2,14),dirTo(2,0)]);if(hut&&way.length>2){const k=nearestIdx(path,way[1]);if(k>3&&k<path.length-4)sign(k,[dirTo(k,k+12),dirTo(k,k-12)]);}sign(path.length-3,[dirTo(path.length-3,path.length-15)]);}
  /* Steinmännchen im oberen Teil des Weges */
  for(let i=Math.floor(path.length*.45);i<path.length-6;i+=22){const a=path[i-1],b=path[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,X=path[i][0]+(b[1]-a[1])/l*1.2,Z=path[i][1]-(b[0]-a[0])/l*1.2,y=surface(X,Z);for(let k=0;k<3;k++)fun.ico(.3-k*.07,0x8f8d84,{x:X,y:y+.12+k*.3,z:Z,sy:.62,ry:k});}
  let hi=Math.floor(path.length*.45);while(hi<path.length-2&&LEDGES.some(q=>Math.hypot(q[0]-path[hi][0],q[1]-path[hi][1])<6))hi++; /* nicht im Revier der Steinböcke */
  if(path.length>30&&hi<path.length-2){const [x,z]=path[hi],y=surface(x,z),[x2,z2]=path[hi+1];spots.hiker=[x,y,z];
   put(P({shirt:0xf2a531,pants:0x3a3f4a,hat:'muetze',boots:0x3a2a1a,seed:63}),{x,y,z,ry:Math.atan2(x2-x,z2-z),s:1.2});fun.box(.42,.55,.26,0x8a2f2f,{x:x-Math.sin(Math.atan2(x2-x,z2-z))*.25,y:y+.75,z:z-Math.cos(Math.atan2(x2-x,z2-z))*.25,ry:Math.atan2(x2-x,z2-z)});
   const [bx,bz]=path[Math.floor(path.length*.7)];fun.at({x:bx+.7,y:surface(bx+.7,bz),z:bz,ry:1.1},b=>{b.box(.22,.16,.42,0x5a3a22);b.box(.22,.32,.16,0x5a3a22,{z:-.13});});}            /* verlorener Wanderschuh */
  /* Edelweiß und Enzian auf den Almwiesen */
  for(let i=0;i<220;i++){const x=24+rnd()*110,z=-190+rnd()*66;if(!inside(x,z)||!contains(x,z))continue;const h=height(x,z);if(h<14||h>44||!free(x,z,1))continue;const sl=Math.hypot(height(x+.8,z)-h,height(x,z+.8)-h)/.8;if(sl>.7)continue;
   const y=surface(x,z),blue=rnd()<.5;for(let k=0;k<4;k++){const a=rnd()*6.28,d=rnd()*.5;fun.disc(.07,5,blue?0x2a52c8:0xf4f2e6,{x:x+Math.cos(a)*d,y:y+.08,z:z+Math.sin(a)*d});}}
  /* Findlinge rund um den Kolk */
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2+.2,r=POOL.rx*1.12,x=POOL.x+Math.cos(a)*r,z=POOL.z+Math.sin(a)*r;if(channel(x,z).d<2.6||Math.abs((((x-62)+(z+144))/Math.SQRT2))<FW+1&&(-(x-62)+(z+144))/Math.SQRT2<3)continue;fun.ico(.5+((i*37)%10)/14,0x7d8079,{x,y:surface(x,z)+.1,z,sy:.65,ry:i});}
  /* Yeti-Spuren in einem Schneefeld */
  /* Yeti-Spuren quer über das verschneite Gipfelplateau – sie führen am Kreuz vorbei ins Nichts */
  spots.yeti=[top[0]-3.2,top[2]-2];for(let k=0;k<8;k++){const x=top[0]-3.2+k*.9,z=top[2]-2+(k%2?.32:-.32)+k*.12,y=surface(x,z)+.03;fun.disc(.26,7,0x9fb2c4,{x,y,z,sx:.7});for(let t=0;t<3;t++)fun.disc(.07,5,0x9fb2c4,{x:x+.26,y,z:z-.12+t*.12});}
  return {fun,spots};
 }
 /* v403: Bewegte Kleinigkeiten: Ruderboot mit Angler auf dem See, Stockente im Kolk */
 function boatMesh(){const b=new FM.MB();b.box(2.4,.35,.9,0x8a5a34,{y:-.15});b.box(2.2,.06,.8,0x6e4528,{y:.18});b.box(.9,.06,.8,0x7a4c2c,{y:.12});
  const p=typeof FWM!=='undefined'&&FWM.person?FWM.person({shirt:0x2f6b4a,pants:0x4a3a2a,hat:'hut',seed:77,sit:true}):null;if(p)b.merge(p,{x:-.3,y:-.15,z:-.15,ry:Math.PI/2,s:1.05});
  b.cyl(.025,.015,2.6,4,0x3a2a1a,{x:.1,y:.9,z:.2,rz:-1.05});b.box(.012,1.8,.012,0xdddddd,{x:1.45,y:-.8,z:.2});return b;}
 /* v404: Stockenten-Erpel in echten Farben (graubrauner Körper, dunkler Rücken, braune Brust, weißer Halsring, grün schillernder Kopf, gelber Schnabel) */
 function duckMesh(){const b=new FM.MB();b.ico(.22,0x8c857a,{sy:.6,sz:1.2});b.ico(.17,0x5c5045,{y:.07,z:-.05,sy:.42,sz:1.1});b.ico(.13,0x6b3a28,{y:.04,z:.17,sy:.8});
  b.cyl(.07,.075,.05,8,0xf2f0ea,{y:.14,z:.2});b.ico(.115,0x1f5a3a,{y:.25,z:.21,sz:1.15});b.box(.07,.035,.12,0xd8b13a,{y:.22,z:.34});
  b.ico(.02,0x141414,{x:.075,y:.28,z:.27});b.ico(.02,0x141414,{x:-.075,y:.28,z:.27});b.box(.09,.06,.1,0x1d1d1d,{y:.07,z:-.28,rx:-.4});b.box(.05,.04,.06,0xf2f0ea,{y:.12,z:-.32});return b;}

 function body(kind){const b=new FM.MB(),m=kind==='marmot';
  if(m)b.ico(1,0x82715a,{x:0,y:.28,z:0,sx:.24,sy:.25,sz:.48});
  /* v404: Steinbock geschlossen modelliert – runder Rumpf, Brust/Schulter und Keule als eigene Wölbungen, Hals bis zum Kopf, Ansätze über
     den Läufen (vorher grobe Ellipse mit losem Kopf und Läufen, von oben sichtbare Lücken) */
  if(!m){b.ico(1,0x746858,{y:.88,sx:.33,sy:.37,sz:.62,detail:1});b.ico(.3,0x6c6050,{y:.94,z:.4,sx:1.08,sy:1.05,sz:.95,detail:1});b.ico(.29,0x786b5a,{y:.9,z:-.42,sx:1.08,sy:1,sz:.9,detail:1});
   b.ico(.27,0xb09c7d,{y:.66,z:.04,sx:.9,sy:.4,sz:1.9});b.box(.08,.06,1.05,0x4c4234,{y:1.24,z:0});                                         /* heller Bauch, dunkler Aalstrich */
   {const a=[0,1.02,.5],d=[0,1.3,.66],l=Math.hypot(d[1]-a[1],d[2]-a[2]);b.cyl(.17,.13,l+.08,8,0x7d705d,{x:0,y:a[1],z:a[2],rx:Math.atan2(d[2]-a[2],d[1]-a[1])});}  /* Hals */
   for(const sx of [-1,1])for(const sz of [-1,1])b.ico(.15,sz>0?0x6c6050:0x786b5a,{x:sx*.22,y:.74,z:sz*.4,sy:1.7,sz:1.1});                    /* Schulter-/Schenkelansätze */
   b.box(.11,.22,.1,0x554636,{y:.85,z:-.6,rx:-.65});}
  else{b.ico(.16,0x938064,{y:.37,z:.4});for(const s of [-1,1]){b.ico(.05,0x766149,{x:s*.11,y:.48,z:.36});b.ico(.018,0x141916,{x:s*.115,y:.405,z:.49});}b.ico(.038,0x39362f,{y:.35,z:.55});b.box(.12,.09,.35,0x665341,{y:.12,z:-.48});}return b;
 }
 function head(){const b=new FM.MB();b.ico(.24,0x8d7e67,{sx:.78,sy:1.05,sz:1.35});b.ico(.12,0x403c32,{y:-.1,z:.23,sz:1.5});
  for(const s of [-1,1]){b.ico(.07,0xa3957b,{x:s*.22,y:.07,sz:1.8});b.ico(.025,0x161c17,{x:s*.16,y:.025,z:.15});
   const pts=[[s*.13,.15,-.06],[s*.17,.4,-.12],[s*.19,.62,-.29],[s*.18,.77,-.54],[s*.15,.78,-.75]];
   for(let i=1;i<pts.length;i++){const a=pts[i-1],d=pts[i],dx=d[0]-a[0],dy=d[1]-a[1],dz=d[2]-a[2],l=Math.hypot(dx,dy,dz);b.cyl(.065-i*.008,.057-i*.008,l,6,0x504a3b,{x:a[0],y:a[1],z:a[2],rx:Math.atan2(dz,dy),rz:-Math.asin(dx/l)});}}
  return b;
 }
 function leg(){const b=new FM.MB();b.box(.12,1.14,.13,0x675c4b,{y:-1});return b;} /* v404: etwas kräftiger, oben in den Ansatz hinein */
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
 function makeAnimals(R,parent){const animals=[],node=(mesh,o)=>R.node(mesh,o),cache=(k,fn)=>fmesh('alp386:'+k,fn);
  const candidates=LEDGES;
  for(let i=0;i<7;i++){const m=i>4,wanted=m?[[96,-130],[66,-159]][i-5]:candidates[i],[x,z]=safeCenter(wanted,m,animals.concat(['hiker','hut','bench','camp'].map(k=>geometry.spots&&geometry.spots[k]).filter(Boolean).map(p=>({x:p[0],z:p[2]})))) /* v404: Tiere nicht in Wanderer/Hütte/Bank/Zelt */,root=node(cache(m?'marmot':'ibex',()=>body(m?'marmot':'ibex')),{shadow:false,s:m?1.1:i===4?.72:1.25});R.addChild(parent,root);
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
  if(!geometry){const terrainNear=terrain(2.4,true),decor=scenery(),ex=extras(decor.trees);geometry={terrainNear,treeNear:decor.near,treeFar:decor.far,detail:decor.detail,trees:decor.trees,fun:ex.fun,spots:ex.spots,boat:boatMesh(),duck:duckMesh(),water:water(),fall:fallMesh(),pool:poolMesh(),foam:foamMesh()};
  }
 }
 function build(R){prepare();
  const cache=(k,mb)=>fmesh('alp386:'+k,()=>mb),root=R.node(null,{shadow:false});R.nodes.push(root);
  const add=(k,mb,o={})=>R.addChild(root,R.node(cache(k,mb),Object.assign({shadow:false},o)));
  const near=add('terrain',geometry.terrainNear);
  scene={root,near,treeNear:add('fir',geometry.treeNear),treeFar:add('firFar',geometry.treeFar,{inv:true,visible:false}),detail:add('detail',geometry.detail),water:add('water',geometry.water,{water:8}),fall:add('fall',geometry.fall,{alpha:.98,water:6,flow:[0,.45,1,POOL.y],fallStart:.05}),pool:add('pool',geometry.pool,{water:8}),foam:add('foam',geometry.foam,{water:6,flow:[FOAM.lx,FOAM.ly,1,POOL.y],alpha:.98}),fun:add('fun403',geometry.fun),boat:add('boat403',geometry.boat,{shadow:true}),duck:add('duck403',geometry.duck),camTy:null,...makeAnimals(R,root)};
  clock=0;return scene;
 }
 function step(dt){if(!scene)return;const fp=!!FV.fp,d=FV.R.cam.dist,on=!fp,day=(S.time%1440)>330&&(S.time%1440)<1230;scene.root.visible=on;if(!on)return;
  const t=sm(140,225,d);scene.near.fade=0;scene.near.visible=true;scene.treeNear.fade=t;scene.treeNear.visible=t<.999;scene.treeFar.fade=t;scene.treeFar.visible=t>.001;
  const detail=sm(90,140,d);scene.detail.fade=detail;scene.detail.visible=detail<.999;clock+=Math.min(.05,Math.max(0,dt));
  /* v403: Entdeckungen erst beim Heranzoomen (weich eingeblendet) */
  const fz=sm(75,115,d);for(const k of ['fun','boat','duck'])if(scene[k]){scene[k].fade=fz;scene[k].visible=fz<.999;}
  if(scene.boat){const t=clock*.035;scene.boat.x=L.x+3+Math.cos(t)*7;scene.boat.z=L.z+1+Math.sin(t)*3.5;scene.boat.y=L.y+.12+Math.sin(clock*1.3)*.04;scene.boat.ry=-t+Math.PI;scene.boat.rz=Math.sin(clock*1.1)*.03;}
  if(scene.duck){const t=clock*.11;scene.duck.x=POOL.x-1.5+Math.cos(t)*3.2;scene.duck.z=POOL.z+2+Math.sin(t)*3.2;scene.duck.y=POOL.y+.1+Math.sin(clock*3)*.03;scene.duck.ry=-t;scene.duck.rx=Math.sin(clock*2.4)*.08;}
  const cam=FV.R.cam,hunting=typeof HUNT!=='undefined'&&HUNT.X;if(scene.camTy!=null&&Math.abs((cam.ty||0)-scene.camTy)>1e-6)scene.camExt=Math.abs(cam.ty||0)>1e-6;
  if(!hunting&&!scene.camExt){
   /* v403: Über dem Gebirge folgt der Blickpunkt der Geländehöhe und die Kamera bleibt über dem Hang (sonst taucht sie bei
      nahem Zoom in die höheren Gipfel ein). Setzt ein anderes Modul ty selbst (Tests, Jagd), bleibt es unangetastet, bis ty wieder 0 ist. */
   const g=contains(cam.tx,cam.tz)?Math.max(0,surface(cam.tx,cam.tz)):0,want=g*(1-sm(170,320,d));let ty=(cam.ty||0)+(want-(cam.ty||0))*Math.min(1,Math.max(0,dt)*3);
   const cp=Math.cos(cam.pitch||.8),ex=cam.tx+Math.cos(cam.yaw||0)*cp*d,ez=cam.tz+Math.sin(cam.yaw||0)*cp*d,eg=contains(ex,ez)?surface(ex,ez):0,ey=ty+Math.sin(cam.pitch||.8)*d;if(ey<eg+4)ty+=eg+4-ey;
   cam.ty=ty;}scene.camTy=cam.ty||0;
  if(scene.spots&&scene.spots.smoke&&d<120&&FV.R.emit){scene.smoke=(scene.smoke||0)+Math.min(.05,dt)*1.6;if(scene.smoke>=1){scene.smoke--;const p=scene.spots.smoke;FV.R.emit({x:p[0],y:p[1],z:p[2],vx:.12,vy:.55,vz:.05,g:0,life:3.2,size:.22,size2:.9,col:[.8,.8,.82,.22],drag:.6,shape:4});}}
  if(scene.spots&&scene.spots.fire&&d<100&&FV.R.emit){scene.fire=(scene.fire||0)+Math.min(.05,dt)*(day?2:5);if(scene.fire>=1){scene.fire--;const p=scene.spots.fire;FV.R.emit({x:p[0],y:p[1],z:p[2],vx:0,vy:.7,vz:0,g:0,life:.8,size:.1,size2:.02,col:[1,.62,.2,.8],shape:5});}}
  if(d<130&&Math.hypot(FV.R.cam.tx-POOL.x,FV.R.cam.tz-POOL.z)<65&&FV.R.emit){spray+=Math.min(.05,dt)*45;while(spray>=1){spray--;const a=clock*17+spray;const u=Math.sin(a*1.7)*FW*.8;FV.R.emit({x:FALL.foot[0]+u*Math.SQRT1_2+Math.cos(a)*.5,y:.17,z:FALL.foot[2]+u*Math.SQRT1_2+Math.sin(a)*.5,vx:Math.cos(a)*1.4,vy:1.5+Math.sin(a*3)*.5,vz:Math.sin(a)*1.4,g:-9.81,life:.7,size:.055,size2:.12,col:[.85,.95,1,.45],shape:5});}}else spray=0;
  if(d<130&&Math.hypot(FV.R.cam.tx-POOL.x,FV.R.cam.tz-POOL.z)<65&&FV.R.emit){mist+=Math.min(.05,dt)*7;if(mist>=1){mist--;const u=(Math.sin(clock*2.3)*.8)*FW;FV.R.emit({x:FALL.foot[0]+u*Math.SQRT1_2,y:.35,z:FALL.foot[2]+u*Math.SQRT1_2,vx:-.25,vy:.4,vz:.25,g:0,life:1.8,size:.35,size2:1.6,col:[.86,.94,1,.075],drag:1.2,shape:4});}}else mist=0;
  for(const a of scene.animals){const fade=sm(150,220,d),near=Math.hypot(a.x-FV.R.cam.tx,a.z-FV.R.cam.tz)<Math.max(50,d*.75);a.root.fade=fade;a.root.visible=fade<.999&&near&&(day||a.kind==='ibex');if(!a.root.visible)continue;
   const moving=day&&Math.sin(clock*.23+a.phase)>-.15,speed=a.kind==='marmot'?.12:.16;if(moving)a.walk+=Math.min(.05,dt)*speed;
   const f=(a.walk+a.phase)*64/(Math.PI*2),i=((Math.floor(f)%64)+64)%64,u=f-Math.floor(f),p=a.path[i],q=a.path[(i+1)%64],x=p[0]+(q[0]-p[0])*u,z=p[2]+(q[2]-p[2])*u;
   a.root.x=x;a.root.z=z;a.root.y=surface(x,z);a.root.ry=Math.atan2(q[0]-p[0],q[2]-p[2]);
   a.legs.forEach((leg,j)=>{const wave=Math.sin(clock*5+a.phase+(j===0||j===3?0:Math.PI)),sc=a.root.sx,c=Math.cos(a.root.ry),s=Math.sin(a.root.ry),swing=moving?wave*.09:0,hip=leg.hip,X=x+(hip.x*c+(hip.z+swing)*s)*sc,Z=z+(-hip.x*s+(hip.z+swing)*c)*sc,toe=(surface(X,Z)-a.root.y)/sc-hip.y+(moving?Math.max(0,wave)*.06:0),knee=toe*.49,kz=(hip.z>0?.11:-.11)+swing*.4;
    leg.upper.rx=Math.atan2(-kz,-knee);leg.upper.sy=Math.hypot(knee,kz);leg.lower.y=knee;leg.lower.z=kz;leg.lower.rx=Math.atan2(-(swing-kz),knee-toe);leg.lower.sy=Math.hypot(knee-toe,swing-kz);leg.hoof.y=toe;leg.hoof.z=swing;
   });
   if(a.head)a.head.rx=moving?-.05:.38+.05*Math.sin(clock*.8+a.phase);if(a.kind==='marmot')a.root.rx=moving?0:Math.sin(clock*.5+a.phase)>.5?-.2:0;
  }
  for(const b of scene.birds){b.root.visible=day;if(!day)continue;const t=clock*.12+b.phase;b.root.x=80+Math.cos(t)*29;b.root.z=-152+Math.sin(t)*18;b.root.y=58+Math.sin(t*1.4)*3;b.root.ry=-t;b.root.rz=Math.sin(t)*.12;const flap=Math.sin(clock*3+b.phase)>.82?Math.sin(clock*8+b.phase)*.13:.035;b.left.rz=flap;b.right.rz=-flap;}
 }
 return {setGroundSampler,riverWidth,riverLine,riverLevel,riverBankY,replacesGround,contains,weight,height,color,channel,cutChannel,lakeE,poolE,surface,build,step,info:()=>({scene,geometry,grid,clock,lake:L,lakeOutline,poolOutline,run:RUN,drain:DRAIN,profile:riverProfile(),pool:POOL,fall:FALL,fallPath,bounds:B,peaks:PEAKS,forepeaks:FOREPEAKS,ledges:LEDGES})};
})();
