"use strict";
/* v472: Bildreferenzbasierte Karosserien. Nur Darstellungsnetze und Einbaupunkte;
   Technik, Auktionen und gespeicherte Autos werden nicht verändert. +Z = Front. */
const CARMODELS=(()=>{
 const special={p930:[4.29,1.78,1.31],p959:[4.26,1.84,1.28],pcgt:[4.61,1.92,1.16],p918:[4.64,1.94,1.17],p924:[4.21,1.69,1.27],p944:[4.20,1.74,1.28],ar8a:[4.43,1.90,1.25],ar8:[4.43,1.94,1.24],fenz:[4.70,2.04,1.15],flaf:[4.70,1.99,1.12],f458:[4.53,1.94,1.21],fsf90:[4.71,1.97,1.19],bchi:[4.54,2.04,1.21],bdiv:[4.64,2.02,1.21],bnoi:[4.69,2.02,1.21],b110:[4.54,2.04,1.20],lven:[5.02,2.08,1.17],lcen:[4.92,2.06,1.14],lave:[4.78,2.03,1.14],lsian:[4.98,2.10,1.13],msen:[4.74,1.96,1.23],m765:[4.60,1.93,1.16],fgt05:[4.64,1.95,1.13],fgt17:[4.76,2.00,1.11],mg63:[4.88,1.98,1.97],llm2:[4.90,2.00,1.85],rpha:[5.76,2.02,1.65],rcul:[5.34,2.00,1.84],rspe:[5.45,2.02,1.56],rssh:[5.17,1.80,1.52],p356:[3.95,1.67,1.31],p550:[3.70,1.61,1.02],asq:[4.16,1.86,1.34],aurq:[4.40,1.72,1.34],bm3:[4.35,1.68,1.37],bm5:[4.78,1.80,1.44],b02t:[4.22,1.63,1.41],lcou:[4.14,2.00,1.07],lmiu:[4.36,1.76,1.05],p917:[4.12,1.98,.94],fgt40:[4.19,1.78,1.03],mspe:[5.14,2.00,1.12],jetp:[4.45,1.66,1.22],m540:[5.01,1.80,1.55],bt57:[5.00,1.75,1.55],bblo:[4.38,1.74,1.65]};
 const extra={mone:[4.756,2.010,1.261],m300:[4.52,1.79,1.30],m113:[4.285,1.76,1.285],m129:[4.47,1.81,1.30],mslr:[4.656,1.908,1.261],msls:[4.64,1.94,1.26],mamg:[4.55,1.94,1.29],mclk:[4.855,1.95,1.10],adva:[4.50,1.965,1.07],bm1:[4.36,1.824,1.14],be9:[4.66,1.67,1.37],p986:[4.315,1.78,1.29],ptay:[4.96,1.97,1.38],pcay:[4.92,1.98,1.67],bm2:[4.58,1.89,1.40],bz3:[4.025,1.74,1.293],bz8:[4.40,1.83,1.317],bi8:[4.689,1.942,1.298],f250:[4.325,1.60,1.21],f308:[4.23,1.72,1.12],f288:[4.29,1.91,1.12],ftr:[4.485,1.976,1.13],ff40:[4.358,1.97,1.124],ff50:[4.48,1.986,1.12],f812:[4.657,1.971,1.276],f296:[4.565,1.958,1.187],fsp3:[4.686,2.05,1.142],fpur:[4.973,2.028,1.589],fdyt:[4.425,1.76,1.245],froma:[4.656,1.974,1.301],beb110:[4.40,1.94,1.114],bvey:[4.462,1.998,1.204],bbol:[4.835,2.00,.995],bmis:[4.53,1.99,1.206],btou:[4.671,2.051,1.189],ldia:[4.46,2.04,1.105],lmur:[4.58,2.045,1.135],lhur:[4.459,1.924,1.165],luru:[5.112,2.016,1.638],lrev:[4.947,2.033,1.16],lesa:[4.73,1.86,1.185],ltem:[4.706,1.996,1.201],adb5:[4.57,1.68,1.32],adbz:[4.27,1.56,1.27],avan:[4.665,1.923,1.318],aone:[4.601,1.999,1.222],avnt:[4.465,1.942,1.273],mf1:[4.287,1.82,1.14],mp1:[4.588,1.946,1.188],mart:[4.539,1.913,1.193],bcon:[5.34,1.87,1.46],bcgt:[4.80,1.916,1.39],bcsp:[4.895,1.966,1.397],mbor:[4.335,1.768,1.134],mmc12:[5.143,2.096,1.205],mmc20:[4.669,1.965,1.224],jxk:[4.394,1.562,1.334],jxkss:[3.99,1.66,1.14],jxj:[4.93,2.00,1.15],pzon:[4.435,2.055,1.151],phuy:[4.605,2.036,1.169],putop:[4.60,2.036,1.169],kccr:[4.293,1.996,1.12],kreg:[4.56,2.05,1.11],kagr:[4.293,2.05,1.12],lesp:[4.19,1.86,1.115],lels:[3.726,1.719,1.202],lemi:[4.413,1.895,1.226],leva:[4.459,2.00,1.122],fsh:[4.61,1.73,1.30]};
 const cache=new Map(),mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sub=(a,b)=>a.map((x,i)=>x-b[i]);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 function profile(c){if(cache.has(c.id))return cache.get(c.id);const form=CAR_FORMS[c.id];if(!form)throw Error('Fehlende Modellform: '+c.id);const tech=RACEHANDLING.profile(c),suv=c.body==='suv',wagon=c.body==='kombi',saloon=c.body==='limo',mid=tech.engine==='MR',old=c.y<1995,vintage=form.shape==='vintage',dims=extra[c.id]||special[c.id]||[wagon?4.82:saloon?4.90:suv?4.95:4.55,suv?1.98:old?1.78:1.90,suv?1.70:saloon||wagon?1.46:1.27],r=suv?.39:old?.315:.345,wb=tech.wheelbase;
  const [length,width,height]=dims,p={...form,length,width,height,wheelX:width/2-.12,wheelY:r,wheelRadius:r,axles:Object.freeze([-wb/2,wb/2]),exhaustZ:-length/2-.06,exhaustY:r*.85,exhaustX:width*.31,suv,wagon,saloon,mid,old,vintage,open:['spyder','frspyder'].includes(form.shape)||vintage&&!form.features.includes('roof'),box:['box','boxsuv','muscle'].includes(form.shape),wedge:form.shape==='wedge',round:['round','rear','classic','spyder','frspyder'].includes(form.shape)};
  cache.set(c.id,Object.freeze(p));return p;
 }
 function face(b,P,col,N,normals){for(let i=1;i<P.length-1;i++){let ids=[0,i,i+1],n=cross(sub(P[i],P[0]),sub(P[i+1],P[0]));if(Math.hypot(...n)<1e-10)continue;if(dot(n,N)<0)ids=[0,i+1,i];b.tri(...ids.map(j=>P[j]),col,...(normals?ids.map(j=>normals[j]):[]));}}
 function patch(b,fn,nu,nv,col,N){const points=[],normals=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const u=i/nu,v=j/nv;points.push(fn(u,v));let n=G3.norm(cross(sub(fn(Math.min(1,u+.001),v),fn(Math.max(0,u-.001),v)),sub(fn(u,Math.min(1,v+.001)),fn(u,Math.max(0,v-.001)))));if(dot(n,N)<0)n=n.map(x=>-x);normals.push(n);}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const k=j*(nu+1)+i,ids=[k,k+1,k+nu+2,k+nu+1];face(b,ids.map(k=>points[k]),col,N,ids.map(k=>normals[k]));}}
 function beam(b,a,d,r,col){const v=sub(d,a),h=Math.hypot(...v);if(h<1e-6)return;b.cyl(r,r,h,5,col,{x:a[0],y:a[1],z:a[2],rx:Math.acos(clamp(v[1]/h,-1,1)),ry:Math.atan2(v[0],v[2]),notop:true,nobot:true});}
 const poly=(cx,cy,rx,ry,n=12)=>Array.from({length:n},(_,i)=>[cx+Math.cos(i/n*Math.PI*2)*rx,cy+Math.sin(i/n*Math.PI*2)*ry]);
 function body(c,paint){const p=profile(c);if(p.vintage)return vintage(c,paint,p);const b=new G3.MB(),W=p.width/2,L=p.length/2,H=p.height,dark=0x172127,trim=0x34414a,glass=0x24414f,chrome=p.old?0xadb4b5:0x6a7880,shade=f=>G3.col(paint).map(x=>x*f),has=f=>p.features.includes(f),hyper=['hyper','prototype'].includes(p.shape),rear=p.shape==='rear',sport=!p.suv&&!p.saloon&&!p.wagon,bodyBase=p.suv?.29:.18;
  // Grundriss, Hauben und Radkuppen werden getrennt geformt, nicht aus einem Quader.
  const width=z=>W*(1-(p.box?.025:p.round?.13:.08)*Math.abs(z/L)**4-(p.mid?.035:.012)*Math.exp(-(((z/L)/.40)**2)));
  const deck=p.suv?.66:p.box?.65:sport?.64:.65,frontH=p.suv?.54:p.box?.53:['m113','m129'].includes(c.id)?.58:p.grille==='horse'?.54:p.wedge?.40:p.old&&p.round?.39:.46,backH=p.suv?.61:p.box?.60:.57;
  const center=z=>H*(deck-(deck-frontH)*Math.max(0,z/L)**3-(deck-backH)*Math.max(0,-z/L)**4);
  const bulge=z=>p.axles.reduce((v,a)=>v+(p.box?.09:sport?.20:.12)*Math.exp(-(((z-a)/.48)**2)),0);
  const endZ=(z,u)=>z-(z>L-.28?(p.box?.035:.20)*((z-L+.28)/.28)**2:z<-L+.25?-.045*((z+L-.25)/.25)**2:0)*u**4;
  function top(u,z){const shoulder=Math.exp(-(((Math.abs(u)-.80)/.24)**2));return [width(z)*u,center(z)+bulge(z)*shoulder+.025*(1-u*u)-(p.box?.015:.07)*u**8,endZ(z,u)];}
  const low=z=>{for(const a of p.axles){const dz=z-a,r=p.wheelRadius+.032;if(Math.abs(dz)<r)return p.wheelY+Math.sqrt(r*r-dz*dz);}return bodyBase;};
  function side(s,z,y,inset=0){const hi=top(1,z)[1],t=clamp((y-bodyBase)/(hi-bodyBase),0,1),waist=(p.box?.006:.025)*Math.sin(t*Math.PI)*Math.exp(-(((z/L)/.65)**4)),taper=z>L-.28?(p.old&&p.round?.16:.04)*((z-L+.28)/.28)*clamp((hi-y)/(hi-bodyBase),0,1)**2:0;return [s*(width(z)-waist+inset),y,endZ(z,1)-taper];}
  // Dachanteil nach Bauform: kleine Mittelmotor-Kanzel, lange Haube beim GT,
  // eigener Elfer-Dachbogen und lange hohe Kombi-/SUV-Kabine.
  let cab=p.mid||hyper?[.39,.05,-.30,-.55,.59]:rear?[.36,.02,-.30,-.79,.64]:p.wagon||p.suv?[.36,.10,-.65,-.88,.79]:p.saloon||p.box?[.34,.06,-.43,-.72,.76]:[.17,-.09,-.42,-.72,.64];
  if(p.shape==='prototype')cab=[.31,.02,-.29,-.55,.51];if(c.id==='lesa')cab=[.25,-.05,-.58,-.86,.73];if(c.id==='mone')cab=[.37,.045,-.29,-.54,.59];if(has('longtail'))cab=[.40,.11,-.21,-.44,.57];
  const [cf,rf,rr,cr,rw]=cab,bf=cf*L,br=cr*L,roofF=rf*L,roofR=rr*L,baseWidth=p.suv?.90:p.box?.88:hyper?.75:.80;
  const roof=(u,t)=>[W*rw*u*(1-.08*(2*t-1)**2),(has('lowglass')||has('scoop')?H-.12:H)-(p.box?.035:.075)*u*u-(p.box?.015:.065)*(2*t-1)**2,mix(roofF,roofR,t)+.018*u*u*(1-t)];
  const wind=(u,t)=>{const a=top(u*baseWidth,bf),d=roof(u,0);return a.map((x,k)=>mix(x,d[k],t)+(k===1?.006*(1-t)+.025*Math.sin(t*Math.PI)*(1-u*u):0));};
  const back=(u,t)=>{const a=top(u*baseWidth,br),d=roof(u,1);return a.map((x,k)=>mix(x,d[k],t)+(k===1?.006*(1-t)+.025*Math.sin(t*Math.PI)*(1-u*u):0));};
  const sidePort=has('side')||has('ccurve')||has('blade')||has('strakes')||has('vents'),cz=p.mid?Math.max(p.axles[0]+p.wheelRadius+.362,-.52*p.axles[1]):.48*p.axles[1],portRear=cz-.29,portFront=cz+.22;
  const hole=z=>{const t=clamp((z-portRear)/(portFront-portRear),0,1),hi=top(1,z)[1]-.035,lo=bodyBase+.12+(1-t)*.07;return [lo,hi];};
  const zs=[-L,L,bf,br,portRear,portFront];for(let j=1;j<27;j++)zs.push(mix(-L,L,j/27));for(const a of p.axles)for(let j=0;j<=16;j++)zs.push(a+(p.wheelRadius+.032)*Math.cos(j*Math.PI/16));zs.sort((a,b)=>a-b);const unique=zs.filter((z,i)=>z>=-L&&z<=L&&(!i||z-zs[i-1]>1e-6));
  for(let j=1;j<unique.length;j++){const a=unique[j-1],d=unique[j];patch(b,(u,v)=>top(mix(-1,1,u),mix(a,d,v)),10,1,paint,[0,1,0]);
   for(const s of [-1,1]){const la=low(a),ld=low(d),ha=top(1,a)[1],hd=top(1,d)[1],inside=sidePort&&a>=portRear-1e-5&&d<=portFront+1e-5&&hole(a)[0]>la&&hole(d)[0]>ld;
    const bands=inside?[[la,hole(a)[0],ld,hole(d)[0]],[hole(a)[1],ha,hole(d)[1],hd]]:[[la,ha,ld,hd]];
    for(const [l0,h0,l1,h1] of bands)if(h0>=l0&&h1>=l1)patch(b,(u,v)=>side(s,mix(a,d,u),mix(mix(l0,l1,u),mix(h0,h1,u),v)),1,2,paint,[s,0,0]);
   }
  }
  b.box(p.width*.76,.07,p.length*.87,dark,{y:.12});
  for(const s of [-1,1]){
   // Radhausschalen schließen den hellen Durchblick zwischen Reifen und Blech.
   for(const a of p.axles){for(let j=0;j<16;j++){const q=j*Math.PI/16,r=(j+1)*Math.PI/16,pt=(radius,t)=>[s*(width(a)-.065),p.wheelY+Math.sin(t)*radius,a+Math.cos(t)*radius];face(b,[pt(p.wheelRadius+.05,q),pt(p.wheelRadius+.05,r),pt(p.wheelRadius*.78,r),pt(p.wheelRadius*.78,q)],dark,[s,0,0]);}b.box(.025,.11,.07,p.old?0x62696b:0x746555,{x:s*(p.wheelX+.085),y:p.wheelY-.055,z:a+.13});}
   if(sidePort){const outline=[[portRear,hole(portRear)[1]],[portRear+.055,hole(portRear+.055)[0]],[portFront,hole(portFront)[0]],[portFront,hole(portFront)[1]]],outer=outline.map(([z,y])=>side(s,z,y,.002)),inner=outline.map(([z,y])=>side(s,z,y,-.075));face(b,inner,dark,[s,0,0]);for(let i=0;i<4;i++){const k=(i+1)%4;face(b,[outer[i],outer[k],inner[k],inner[i]],shade(.62),[0,(outer[0][1]+outer[1][1])/2-(outer[i][1]+outer[k][1])/2,cz-(outer[i][2]+outer[k][2])/2]);}
    if(has('strakes')||has('vents'))for(let j=1;j<=4;j++){const y=mix(hole(cz)[0],hole(cz)[1],j/5);beam(b,side(s,portRear+.06,y,.005),side(s,portFront,y,.005),.009,has('strakes')?paint:trim);}
   }
   patch(b,(u,v)=>side(s,mix(p.axles[0]+.38,p.axles[1]-.38,u),mix(bodyBase-.01,bodyBase+.045,v),.008),6,1,shade(.73),[s,0,0]);
   const handleZ=(br+bf)*.14;b.box(.012,.016,.11,chrome,{x:s*(width(handleZ)+.002),y:top(1,handleZ)[1]-.07,z:handleZ});
   const seamA=side(s,bf-.12,top(1,bf-.12)[1]-.045,.003),seamB=side(s,bf-.18,bodyBase+.08,.003);beam(b,seamA,seamB,.0025,shade(.55));
  }
  if(!p.open){patch(b,(u,v)=>roof(mix(-1,1,u),v),8,4,has('softtop')?dark:paint,[0,1,0]);
   for(const [fn,N] of [[wind,[0,.8,.6]],[back,[0,.8,-.6]]]){patch(b,(u,v)=>fn(mix(-1,1,u),v),6,3,paint,N);patch(b,(u,v)=>{const pt=fn(mix(-.95,.95,u),mix(.05,.96,v));pt[1]+=.006;return pt;},6,3,glass,N);}
   for(const s of [-1,1]){const A=wind(s,0),B=roof(s,0),D=back(s,0),E=roof(s,1),P=(u,v)=>A.map((x,k)=>mix(mix(x,D[k],u),mix(B[k],E[k],u),v));patch(b,P,6,2,paint,[s,0,0]);patch(b,(u,v)=>{const pt=P(mix(.045,.955,u),mix(.10,.92,v));pt[0]+=s*.008;return pt;},6,2,glass,[s,0,0]);const pillar=p.wagon||p.saloon||p.suv?.55:.72;beam(b,P(pillar,.05).map((x,k)=>x+(k===0?s*.012:0)),P(pillar,.97).map((x,k)=>x+(k===0?s*.012:0)),p.box?.018:.012,paint);}
  }else{
   const openZ=(bf+br)/2,span=Math.min(.95,(bf-br)*.85);b.box(W*1.38,.055,span,dark,{y:center(openZ)+.015,z:openZ});
   for(const s of [-1,1]){b.box(.36,.22,.18,0x534b41,{x:s*W*.40,y:center(openZ)+.03,z:openZ-.23});b.box(.35,.05,.35,0x534b41,{x:s*W*.40,y:center(openZ)+.035,z:openZ});}
   patch(b,(u,v)=>wind(mix(-1,1,u),v),6,3,paint,[0,1,1]);patch(b,(u,v)=>{const pt=wind(mix(-.94,.94,u),mix(.07,.95,v));pt[1]+=.006;return pt;},6,3,glass,[0,1,1]);for(const s of [-1,1])beam(b,wind(s,0),roof(s,0),.018,paint);
  }
  // Spiegel mit verbundenen Stielen statt frei schwebender Blöcke.
  for(const s of [-1,1]){const a=wind(s,.18),m=[s*(W+.08),a[1]+.055,bf-.12];beam(b,a,m,.013,trim);b.sphere(1,8,4,paint,{x:m[0],y:m[1],z:m[2],sx:.12,sy:.050,sz:.095});face(b,[[s*(W-.01),m[1]-.025,m[2]-.087],[s*(W+.16),m[1]-.025,m[2]-.087],[s*(W+.15),m[1]+.025,m[2]-.087],[s*W,m[1]+.025,m[2]-.087]],0x60717a,[0,0,-1]);}
  for(const s of [-1,1]){const a=wind(s*.15,.10),d=wind(s*.80,.08);a[1]+=.01;d[1]+=.01;beam(b,a,d,.006,trim);}
  // Die Stoßfängerkante übernimmt exakt das Raster der Haube.
  const edge=x=>{const f=clamp((x/width(L)+1)*5,0,10),i=Math.min(9,Math.floor(f)),a=top(i/5-1,L),d=top((i+1)/5-1,L);return a.map((v,k)=>mix(v,d[k],f-i));};
  const front=(x,y,depth=0)=>[x,y,edge(x)[2]-(p.old&&p.round?.16:.04)*clamp((edge(x)[1]-y)/(edge(x)[1]-bodyBase),0,1)**2+depth];
  const FW=width(L),frontMin=Math.min(...Array.from({length:11},(_,j)=>edge(FW*(j/5-1))[1])),bottom=bodyBase,gh=frontMin-.052,gl=bottom+.045,gm=(gh+gl)/2,gr=(gh-gl)/2;
  const rect=(x0,x1,y0,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],rounded=(cx,rx,y0,y1)=>poly(cx,(y0+y1)/2,rx,(y1-y0)/2,10),holes=[];
  if(p.grille==='horse'){holes.push([...Array.from({length:9},(_,i)=>[Math.cos(i*Math.PI/8)*FW*.17,gm+Math.sin(i*Math.PI/8)*gr]),[-FW*.17,gl],[FW*.17,gl]]);for(const s of [-1,1])holes.push(rounded(s*FW*.63,FW*.25,gl,gm+.025));}
  else if(p.grille==='tall'){holes.push(rect(-FW*.31,FW*.31,gl,gh));for(const s of [-1,1])holes.push(rect(s<0?-FW*.88:FW*.45,s<0?-FW*.45:FW*.88,gl,gl+.06));}
  else if(p.grille==='kidney'){for(const s of [-1,1]){const x=s*FW*.15;holes.push([[x-FW*.11,gm+.02],[x+FW*.11,gm+.02],[x+FW*.115,gh-.02],[x+FW*.09,gh],[x-FW*.09,gh],[x-FW*.115,gh-.02]]);}holes.push(rect(-FW*.52,FW*.52,gl,gm-.025));}
  else if(p.grille==='hex'){holes.push([[-FW*.57,gl+.035],[FW*.57,gl+.035],[FW*.66,gm],[FW*.52,gh],[-FW*.52,gh],[-FW*.66,gm]]);}
  else if(['oval','merc'].includes(p.grille))holes.push(rounded(0,FW*.68,gl,gh));
  else if(p.grille==='slit'){const upper=c.b==='audi'||p.shape==='muscle';holes.push(rect(-FW*.68,FW*.68,upper?gm:gl,upper?gh:Math.min(gh,gl+.075)));}
  else{holes.push([[-FW*.44,gl],[FW*.44,gl],[FW*.53,gh],[-FW*.53,gh]]);for(const s of [-1,1])holes.push(rounded(s*FW*.75,FW*.19,gl,gh));}
  // Streifenzerlegung um reale Öffnungen: keine schwarze Aufkleberfläche auf Blech.
  const ys=[bottom,frontMin,...holes.flatMap(P=>P.map(p=>p[1]))].sort((a,b)=>a-b).filter((y,i,a)=>!i||y-a[i-1]>1e-6);
  const span=(P,y)=>{const xs=[];for(let i=0;i<P.length;i++){const a=P[i],d=P[(i+1)%P.length];if(Math.abs(a[1]-d[1])<1e-8){if(Math.abs(y-a[1])<1e-6)xs.push(a[0],d[0]);}else if(y>=Math.min(a[1],d[1])-1e-6&&y<=Math.max(a[1],d[1])+1e-6)xs.push(mix(a[0],d[0],(y-a[1])/(d[1]-a[1])));}return xs.length?[Math.min(...xs),Math.max(...xs)]:null;};
  const frontXs=Array.from({length:11},(_,j)=>FW*(j/5-1));
  const clipX=(P,x,greater)=>{const out=[];for(let j=0;j<P.length;j++){const a=P[j],d=P[(j+1)%P.length],ia=greater?a[0]>=x-1e-8:a[0]<=x+1e-8,id=greater?d[0]>=x-1e-8:d[0]<=x+1e-8;if(ia)out.push(a);if(ia!==id){const t=(x-a[0])/(d[0]-a[0]);out.push([x,mix(a[1],d[1],t)]);}}return out;};
  const frontPaint=P=>{for(let j=1;j<frontXs.length;j++){const clipped=clipX(clipX(P,frontXs[j-1],true),frontXs[j],false);if(clipped.length>=3)face(b,clipped.map(([x,y])=>front(x,y)),paint,[0,0,1]);}};
  for(let j=1;j<ys.length;j++){const ya=ys[j-1],yd=ys[j],mid=(ya+yd)/2,spans=holes.map(P=>({P,m:span(P,mid)})).filter(q=>q.m).sort((a,b)=>a.m[0]-b.m[0]);let xa=-FW,xd=-FW;for(const q of [...spans,{P:null}]){const a=q.P?span(q.P,ya):[FW,FW],d=q.P?span(q.P,yd):[FW,FW];frontPaint([[xa,ya],[a[0],ya],[d[0],yd],[xd,yd]]);xa=a[1];xd=d[1];}}
  for(let j=0;j<10;j++){const a=FW*(j/5-1),d=FW*((j+1)/5-1);face(b,[front(a,frontMin),front(d,frontMin),front(d,edge(d)[1]),front(a,edge(a)[1])],paint,[0,0,1]);}
  for(const original of holes){const P=[];for(let i=0;i<original.length;i++){const a=original[i],d=original[(i+1)%original.length],ts=[0,...frontXs.filter(x=>x>Math.min(a[0],d[0])+1e-6&&x<Math.max(a[0],d[0])-1e-6).map(x=>(x-a[0])/(d[0]-a[0]))].sort((a,b)=>a-b);for(const t of ts)P.push([mix(a[0],d[0],t),mix(a[1],d[1],t)]);}const inner=P.map(([x,y])=>front(x,y,-.07)),outer=P.map(([x,y])=>front(x,y)),cx=P.reduce((s,p)=>s+p[0],0)/P.length,cy=P.reduce((s,p)=>s+p[1],0)/P.length;face(b,inner,dark,[0,0,1]);for(let j=0;j<P.length;j++){const k=(j+1)%P.length;face(b,[outer[j],outer[k],inner[k],inner[j]],shade(.62),[cx-(outer[j][0]+outer[k][0])/2,cy-(outer[j][1]+outer[k][1])/2,0]);}
   const x0=Math.min(...P.map(p=>p[0])),x1=Math.max(...P.map(p=>p[0])),y0=Math.min(...P.map(p=>p[1])),y1=Math.max(...P.map(p=>p[1]));
   if(p.grille==='tall'){for(let j=1;j<9;j++){const x=mix(x0,x1,j/9),r=span(P,(y0+y1)/2);if(r)beam(b,front(x,y0+.01,-.052),front(x,y1-.01,-.052),.004,chrome);}}
   else if(p.old){for(let row=0;row<2;row++){const y=mix(y0,y1,(row+1)/3),r=span(P,y);if(r)beam(b,front(r[0]+.015,y,-.055),front(r[1]-.015,y,-.055),.0025,trim);}}
   else for(let row=0;row<2;row++)for(let j=0;j<5;j++){const y=mix(y0,y1,(row+1)/3),x=mix(x0,x1,(j+.5)/5),radius=Math.min(.025,(y1-y0)/7,(x1-x0)/12),Q=poly(x,y,radius,radius,6);if(Q.some(([x,y])=>{const r=span(P,y);return !r||x<r[0]+.008||x>r[1]-.008;}))continue;for(let k=0;k<6;k++){const next=(k+1)%6,a=Q[k],d=Q[next],inside=v=>[mix(v[0],x,.16),mix(v[1],y,.16)];face(b,[front(...a,-.053),front(...d,-.053),front(...inside(d),-.053),front(...inside(a),-.053)],trim,[0,0,1]);}}
  }
  if(p.grille==='merc'){const cy=gm+.015;for(let j=0;j<3;j++){const a=j*2*Math.PI/3+Math.PI/2;beam(b,front(0,cy,.004),front(Math.cos(a)*.075,cy+Math.sin(a)*.075,.004),.006,chrome);}beam(b,front(-FW*.56,cy,.002),front(FW*.56,cy,.002),.005,chrome);}
  if(c.b==='audi'){for(let ring=0;ring<4;ring++){const cx=(ring-1.5)*.070,y=gh-.025;for(let j=0;j<10;j++){const a=j*2*Math.PI/10,d=(j+1)*2*Math.PI/10;face(b,[front(cx+Math.cos(a)*.043,y+Math.sin(a)*.030,.015),front(cx+Math.cos(d)*.043,y+Math.sin(d)*.030,.015),front(cx+Math.cos(d)*.035,y+Math.sin(d)*.023,.015),front(cx+Math.cos(a)*.035,y+Math.sin(a)*.023,.015)],chrome,[0,0,1]);}}}
  if(has('chrome')||c.id==='p356'){for(let j=0;j<10;j++){const a=mix(-FW*.96,FW*.96,j/10),d=mix(-FW*.96,FW*.96,(j+1)/10);beam(b,front(a,bodyBase+.11,.014),front(d,bodyBase+.11,.014),.009,chrome);}}
  patch(b,(u,v)=>front(mix(-FW*.99,FW*.99,u),mix(bodyBase-.018,bodyBase+.015,v),.008),10,1,trim,[0,0,1]);
  // Eingelassene Scheinwerfer folgen den Radkuppen; geschlossene Klappdeckel bleiben lackiert.
  const lampSurface=(s,x,z,dy)=>{let j=1;while(j<unique.length-1&&unique[j]<z)j++;const za=unique[j-1],zd=unique[j],v=clamp((z-za)/(zd-za),0,1),w=mix(width(za),width(zd),v),q=clamp((s*x/w+1)*5,0,10),i=Math.min(9,Math.floor(q)),u=q-i,A=top(i/5-1,za),B=top((i+1)/5-1,za),D=top((i+1)/5-1,zd),E=top(i/5-1,zd),pt=v<=u?A.map((a,k)=>a*(1-u)+B[k]*(u-v)+D[k]*v):A.map((a,k)=>a*(1-v)+D[k]*u+E[k]*(v-u));pt[1]+=dy;return pt;};
  for(const s of [-1,1]){
   if(p.head==='quad'||['round','twin'].includes(p.head)&&(p.box||p.saloon||c.b==='bentley'||p.shape==='frspyder'&&c.b==='bmw')){const n=p.head==='round'?1:2;for(let j=0;j<n;j++){const x=s*FW*(n===1?.74:.66)+((j-(n-1)/2)*.16),y=edge(x)[1]-.095;face(b,poly(x,y,.075,.075,12).map(([x,y])=>front(x,y,.012)),chrome,[0,0,1]);face(b,poly(x,y,.060,.060,12).map(([x,y])=>front(x,y,.018)),0x9bb3c1,[0,0,1]);}}
   else if(p.box||p.saloon||p.wagon||p.suv||c.b==='rolls'||c.b==='bentley'||p.shape==='frspyder'&&c.b==='mercedes'){const x=s*FW*.72,y=edge(x)[1]-(p.head==='vertical'?.15:.075),rx=p.head==='vertical'?.065:FW*.19,ry=p.head==='vertical'?.12:.045,P=[[x-rx,y-ry],[x+rx,y-ry],[x+rx,y+ry],[x-rx,y+ry]];face(b,P.map(([x,y])=>front(x,y,.012)),dark,[0,0,1]);face(b,P.map(([xx,yy])=>front(mix(xx,x,.12),mix(yy,y,.22),.017)),0x8199a6,[0,0,1]);beam(b,front(x-rx*.8,y+.025,.021),front(x+rx*.8,y+.025,.021),.006,0xdae5e0);}
   else if(p.head==='pop'){const x=W*.65,z=L*.76,pt=(u,v,dy)=>lampSurface(s,x+mix(-.12,.12,u),z+mix(-.15,.15,v),dy);patch(b,(u,v)=>pt(u,v,.005),2,2,shade(.65),[0,1,0]);patch(b,(u,v)=>pt(mix(.04,.96,u),mix(.04,.96,v),.009),2,2,paint,[0,1,0]);}
   else{const vertical=['vertical','stack'].includes(p.head),oval=['oval','round','twin'].includes(p.head),slit=p.head==='slit',x=W*(vertical?.73:.70),zc=L*(c.id==='mone'?.84:oval?.73:.79),lx=c.id==='mone'?.19:slit?.18:oval?.12:vertical?.095:.115,lz=c.id==='mone'?.12:slit?.09:oval?.20:vertical?.29:.25;
    const outline=oval?poly(x,zc,lx,lz,12):[[x-lx,zc+lz],[x+lx,zc+lz*.62],[x+lx*.83,zc-lz],[x-lx*.50,zc-lz*.55]],cx=x,cz=zc;
    const lens=(scale,dy,col)=>{if(!oval){const fn=(u,v)=>{const x=mix(mix(outline[0][0],outline[1][0],u),mix(outline[3][0],outline[2][0],u),v),z=mix(mix(outline[0][1],outline[1][1],u),mix(outline[3][1],outline[2][1],u),v);return lampSurface(s,mix(cx,x,scale),mix(cz,z,scale),dy);};patch(b,fn,4,4,col,[0,1,0]);}else for(let ring=0;ring<3;ring++)for(let j=0;j<outline.length;j++){const a=outline[j],d=outline[(j+1)%outline.length],pt=(v,t)=>lampSurface(s,mix(cx,v[0],t*scale),mix(cz,v[1],t*scale),dy);face(b,[pt(a,ring/3),pt(d,ring/3),pt(d,(ring+1)/3),pt(a,(ring+1)/3)],col,[0,1,0]);}};lens(1,.012,dark);lens(.90,.017,0x425c6b);
    const count=c.id==='mone'?3:p.head==='cluster'?4:p.head==='stack'||p.head==='twin'?2:1;for(let j=0;j<count;j++){let xx=x,zz=count===2?zc+mix(-lz*.48,lz*.48,j):zc;if(!oval){const u=count>2?(j+1)/(count+1):.5,v=count===2?(j+1)/3:.5;xx=mix(mix(outline[0][0],outline[1][0],u),mix(outline[3][0],outline[2][0],u),v);zz=mix(mix(outline[0][1],outline[1][1],u),mix(outline[3][1],outline[2][1],u),v);}const radius=c.id==='mone'?.024:slit?.020:count===4?.023:.036;face(b,poly(xx,zz,radius,radius,10).map(([x,z])=>lampSurface(s,x,z,.024)),0x8da9b9,[0,1,0]);}
    if(c.b==='lambo'&&p.head==='swept'){const pt=lampSurface(s,x,zc,.031);for(const [xx,zz] of [[x-lx*.7,zc+lz*.6],[x+lx*.7,zc+lz*.3],[x+lx*.25,zc-lz*.6]])beam(b,pt,lampSurface(s,xx,zz,.031),.004,0xdce8de);}
    if(!oval){const a=lampSurface(s,x-lx*.65,zc+lz*.65,.030),d=lampSurface(s,x+lx*.75,zc+lz*.35,.030);beam(b,a,d,.006,0xdce8de);}
   }
  }
  // Heckleuchten und Motorraum folgen der jeweiligen Körperkontur.
  const rearZ=(x,y)=>[x,y,-L+.045*(Math.abs(x)/width(-L))**4-.007];
  patch(b,(u,v)=>rearZ(mix(-width(-L),width(-L),u),mix(bodyBase,top(mix(-1,1,u),-L)[1],v)),10,2,paint,[0,0,-1]);
  const rearY=center(-L)-.10;
  for(const s of [-1,1]){if(['ferrari','pagani','lotus','ford'].includes(c.b)&&!['froma','fpur','fsh'].includes(c.id)){for(const j of [-1,1])b.cyl(.052,.052,.018,12,0xa73739,{x:s*W*.62+j*.072,y:rearY,z:-L-.016,rx:Math.PI/2});}else face(b,[[s*W*.40,rearY-.025,-L-.018],[s*W*.84,rearY-.025,-L+.005],[s*W*.84,rearY+.025,-L+.005],[s*W*.40,rearY+.025,-L-.018]],0xb83a3b,[0,0,-1]);}
  b.box(W*1.55,.095,.10,dark,{y:bodyBase,z:-L+.015});
  if(has('vents')||c.id==='mone')for(const side of [-1,1])for(let j=0;j<4;j++)patch(b,(u,v)=>{const pt=top(side*mix(.80,.94,u),p.axles[1]-.18+j*.055+v*.018);pt[1]+=.011;return pt;},2,1,trim,[0,1,0]);
  if(has('engine'))for(let j=0;j<7;j++)patch(b,(u,v)=>{const pt=top(mix(-.53,.53,u),mix(-L*.91,-L*.62,j/6)+v*.018);pt[1]+=.009;return pt;},4,1,trim,[0,1,0]);
  if(has('scoop')){const z=roofR+.16,t=clamp((roofF-z)/(roofF-roofR),0,1),y=roof(0,t)[1]-.025;b.sphere(1,10,5,trim,{x:0,y:y+.065,z,sx:.17,sy:.095,sz:.34});face(b,[[-.135,y+.03,z+.29],[.135,y+.03,z+.29],[.12,y+.12,z+.27],[-.12,y+.12,z+.27]],dark,[0,0,1]);}
  if(has('fin')){const a=[0,H-.02,roofR-.02],d=[0,center(-L*.83)+.10,-L*.87];for(const s of [-1,1])face(b,[[s*.012,a[1],a[2]],[s*.012,d[1],d[2]],[s*.012,d[1]+.22,d[2]]],trim,[s,0,0]);}
  if(has('hood'))patch(b,(u,v)=>{const pt=top(mix(-.20,.20,u),mix(L*.40,L*.75,v));pt[1]+=.06*Math.sin(v*Math.PI);return pt;},4,4,shade(.94),[0,1,0]);
  if(has('scoops'))for(const side of [-1,1]){const x=side*W*.72,z=-L*.38,y=top(side*.72,z)[1];b.box(.25,.13,.31,paint,{x,y,z});face(b,[[x-.10,y+.02,z+.16],[x+.10,y+.02,z+.16],[x+.09,y+.11,z+.16],[x-.09,y+.11,z+.16]],dark,[0,0,1]);}
  if(has('lashes'))for(const side of [-1,1])for(let j=0;j<6;j++){const a=j*Math.PI/5,x=W*.70+Math.cos(a)*.14,z=L*.73+Math.sin(a)*.22;beam(b,lampSurface(side,x,z,.020),lampSurface(side,x+Math.cos(a)*.025,z+Math.sin(a)*.025,.020),.004,trim);}
  if(has('rails'))for(const s of [-1,1])beam(b,roof(s*.92,.10).map((x,k)=>x+(k===1?.04:0)),roof(s*.92,.9).map((x,k)=>x+(k===1?.04:0)),.012,chrome);
  if(has('ccurve'))for(const s of [-1,1]){const points=[roof(s,.12),roof(s,.90),side(s,portRear-.04,top(1,portRear)[1]-.02,.010),side(s,portRear+.015,bodyBase+.07,.010),side(s,.25,bodyBase+.035,.010)];for(let j=1;j<points.length;j++)beam(b,points[j-1],points[j],.012,chrome);}
  else if(has('blade'))for(const s of [-1,1])beam(b,roof(s,1),side(s,portRear,hole(portRear)[0],.008),.028,trim);
  // Ruhende/aktive Flügel sind keine frei schwebenden Tischplatten.
  if(['lip','duck','whale'].includes(p.wing)){const z0=-L*.94,z1=-L*.76,h=p.wing==='lip'?.035:p.wing==='duck'?.13:.09;patch(b,(u,v)=>{const pt=top(mix(-.82,.82,u),mix(z0,z1,v));pt[1]+=.008+h*(1-v);return pt;},8,3,p.wing==='whale'?trim:paint,[0,1,0]);}
  else if(p.wing!=='none'){const z=-L*.83,base=center(z),raised=['raised','swan','integrated'].includes(p.wing),h=p.wing==='duck'?.11:p.wing==='whale'?.08:p.wing==='active'?(c.id==='mone'?.27:.10):hyper?.29:.28,y=base+h,wingW=W*(p.wing==='duck'?.72:.92),depth=p.wing==='whale'?.40:.24;
   patch(b,(u,v)=>[mix(-wingW,wingW,u),y+.025*Math.sin(v*Math.PI)-.02*(2*u-1)**2,z+mix(-depth/2,depth/2,v)],8,2,p.wing==='integrated'?paint:trim,[0,1,0]);
   for(const s of [-1,1]){const x=s*wingW*(p.wing==='integrated'?.95:.48);if(p.wing==='swan'){beam(b,[x,base,z+.08],[x,y+.035,z-.04],.018,trim);beam(b,[x,y+.035,z-.04],[x,y,z+.03],.018,trim);}else if(p.wing==='integrated')b.box(.08,h,.20,paint,{x,y:base,z});else beam(b,[x,base-.01,z],[x,y-.005,z],raised?.025:.018,trim);}
  }
  const pipes=c.b==='pagani'?[[-.055,.06],[.055,.06],[-.055,-.05],[.055,-.05]]:[[-p.exhaustX,0],[p.exhaustX,0]];for(const [x,dy] of pipes){b.cyl(.042,.042,.08,10,chrome,{x,y:p.exhaustY+dy,z:-L+.015,rx:Math.PI/2,nobot:true});b.cyl(.029,.029,.005,10,dark,{x,y:p.exhaustY+dy,z:-L-.067,rx:Math.PI/2,nobot:true});}
  if(p.box&&has('spare')){b.cyl(p.wheelRadius*.85,p.wheelRadius*.85,.13,16,trim,{x:0,y:H*.48,z:-L-.08,rx:Math.PI/2});}
  return b;
 }
 function vintage(c,paint,p){const b=new G3.MB(),W=p.width/2,L=p.length/2,H=p.height,dark=0x1b2428,chrome=0xa2abac,hoodTop=H*.69,cabinZ=-L*.40;
  b.box(W*.92,.13,p.length*.88,dark,{y:.24});
  patch(b,(u,v)=>{const x=mix(-W*.49,W*.49,u),z=mix(-L*.12,L*.82,v);return[x,hoodTop-.12*(x/(W*.49))**2,z];},8,8,paint,[0,1,0]);
  for(const s of [-1,1]){b.box(.035,hoodTop-.35,L*.94,paint,{x:s*W*.49,y:.35,z:L*.35});
   for(const axle of p.axles)patch(b,(u,v)=>{const t=mix(.04,Math.PI-.04,u),r=p.wheelRadius+.10;return[s*(p.wheelX+mix(-.17,.17,v)),p.wheelY+Math.sin(t)*r,axle+Math.cos(t)*r];},12,2,c.id==='bt57'?dark:paint,[s,.6,0]);
   b.box(.22,.05,p.axles[1]-p.axles[0],paint,{x:s*(p.wheelX-.08),y:.31,z:0});
   const x=s*W*.64,y=hoodTop*.80,z=L*.78;beam(b,[s*W*.45,y-.12,z],[x,y,z],.025,chrome);b.cyl(.12,.12,.055,12,chrome,{x,y,z,rx:Math.PI/2});b.cyl(.105,.105,.016,12,0xd1dad7,{x,y,z:z+.017,rx:Math.PI/2});
  }
  b.sphere(1,12,6,paint,{y:H*.48,z:cabinZ,sx:W*.74,sy:H*.18,sz:L*.47});b.box(W*1.21,.04,L*.50,dark,{y:H*.60,z:cabinZ});for(const s of [-1,1])b.box(.33,.24,.22,0x55453b,{x:s*W*.32,y:H*.60,z:cabinZ-.20});
  face(b,[[-W*.65,H*.64,-L*.08],[W*.65,H*.64,-L*.08],[W*.58,H*.94,-L*.18],[-W*.58,H*.94,-L*.18]],0x355562,[0,1,1]);
  for(const side of [-1,1])beam(b,[side*W*.65,H*.61,-L*.08],[side*W*.58,H*.94,-L*.18],.013,chrome);
  if(p.features.includes('roof')){b.sphere(1,12,6,dark,{y:H*.83,z:cabinZ,sx:W*.75,sy:H*.17,sz:L*.47});for(const s of [-1,1])face(b,[[s*W*.64,H*.68,-L*.12],[s*W*.64,H*.68,-L*.71],[s*W*.60,H*.88,-L*.65],[s*W*.60,H*.90,-L*.20]],0x355562,[s,0,0]);}
  const radiatorZ=L*.84;b.box(W*.78,H*.49,.055,chrome,{y:.35,z:radiatorZ});b.box(W*.68,H*.44,.060,dark,{y:.38,z:radiatorZ+.01});for(let i=-4;i<=4;i++)b.box(.012,H*.42,.065,chrome,{x:i*W*.067,y:.39,z:radiatorZ+.018});return b;
 }
 function wheel(c){const p=profile(c),b=new G3.MB(),r=p.wheelRadius,seg=20,dark=0x1b2329,wire=p.vintage||['f250','adb5','adbz','jetp','jxk'].includes(c.id),aero=['p928','p959','beb110','bm1'].includes(c.id),double=['bmw','bugatti','mercedes'].includes(c.b)&&!p.old;
  const section=[[-.11,r*.84],[-.09,r*.95],[-.065,r],[.065,r],[.09,r*.95],[.115,r*.83]];
  for(let j=1;j<section.length;j++)for(let i=0;i<seg;i++){const a=i*2*Math.PI/seg,d=(i+1)*2*Math.PI/seg,[x0,r0]=section[j-1],[x1,r1]=section[j],pt=(x,r,t)=>[x,Math.cos(t)*r,Math.sin(t)*r],normal=t=>G3.norm([-(r1-r0)/(x1-x0),Math.cos(t),Math.sin(t)]);face(b,[pt(x0,r0,a),pt(x1,r1,a),pt(x1,r1,d),pt(x0,r0,d)],dark,[0,Math.cos((a+d)/2),Math.sin((a+d)/2)],[normal(a),normal(a),normal(d),normal(d)]);}
  const ring=(x,ra,rb,col)=>{for(let i=0;i<seg;i++){const a=i*2*Math.PI/seg,d=(i+1)*2*Math.PI/seg;face(b,[[x,Math.cos(a)*ra,Math.sin(a)*ra],[x,Math.cos(d)*ra,Math.sin(d)*ra],[x,Math.cos(d)*rb,Math.sin(d)*rb],[x,Math.cos(a)*rb,Math.sin(a)*rb]],col,[1,0,0]);}};
  ring(.118,r*.83,r*.72,0x39434a);ring(.124,r*.74,r*.69,p.old?0x99a3a6:0x687780);b.cyl(r*.56,r*.56,.012,16,0x394349,{x:.065,rz:-Math.PI/2,nobot:true});
  if(aero){b.cyl(r*.68,r*.68,.008,20,0x929c9e,{x:.125,rz:-Math.PI/2,nobot:true});for(let j=0;j<5;j++){const a=j*2*Math.PI/5;face(b,poly(Math.cos(a)*r*.44,Math.sin(a)*r*.44,r*.095,r*.095,8).map(([y,z])=>[.135,y,z]),dark,[1,0,0]);}}
  else{const count=wire?20:5;for(let j=0;j<count;j++)for(const delta of double?[-.065,.065]:[0]){const a=j*2*Math.PI/count+delta,w=wire?.018:.05;face(b,[[.13,Math.cos(a-.08)*r*.17,Math.sin(a-.08)*r*.17],[.128,Math.cos(a-w)*r*.70,Math.sin(a-w)*r*.70],[.128,Math.cos(a+w)*r*.70,Math.sin(a+w)*r*.70],[.13,Math.cos(a+.08)*r*.17,Math.sin(a+.08)*r*.17]],c.b==='porsche'&&p.old?0x838d90:0x89969c,[1,0,0]);}}
  b.cyl(.046,.046,.014,10,0x727e84,{x:.128,rz:-Math.PI/2,nobot:true});for(let j=0;j<5;j++){const a=j*2*Math.PI/5;face(b,[[.146,Math.cos(a)*.033-.003,Math.sin(a)*.033-.003],[.146,Math.cos(a)*.033+.003,Math.sin(a)*.033-.003],[.146,Math.cos(a)*.033+.003,Math.sin(a)*.033+.003],[.146,Math.cos(a)*.033-.003,Math.sin(a)*.033+.003]],0xa6b0b0,[1,0,0]);}return b;
 }
 return {profile,body,wheel};
})();
