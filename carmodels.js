"use strict";
/* v471: Geformte Katalogfamilien, gemeinsame Netze für Auktion, Garage und Rennen.
   Maße sind Darstellungsmaße; Fahrleistung bleibt im Technikprofil. +Z = Front. */
const CARMODELS=(()=>{
 const special={p930:[4.29,1.78,1.31],p959:[4.26,1.84,1.28],pcgt:[4.61,1.92,1.16],p918:[4.64,1.94,1.17],p924:[4.21,1.69,1.27],p944:[4.20,1.74,1.28],ar8a:[4.43,1.90,1.25],ar8:[4.43,1.94,1.24],fenz:[4.70,2.04,1.15],flaf:[4.70,1.99,1.12],f458:[4.53,1.94,1.21],fsf90:[4.71,1.97,1.19],bchi:[4.54,2.04,1.21],bdiv:[4.64,2.02,1.21],bnoi:[4.69,2.02,1.21],b110:[4.54,2.04,1.20],lven:[5.02,2.08,1.17],lcen:[4.92,2.06,1.14],lave:[4.78,2.03,1.14],lsian:[4.98,2.10,1.13],msen:[4.74,1.96,1.23],m765:[4.60,1.93,1.16],fgt05:[4.64,1.95,1.13],fgt17:[4.76,2.00,1.11],mg63:[4.88,1.98,1.97],llm2:[4.90,2.00,1.85],rpha:[5.76,2.02,1.65],rcul:[5.34,2.00,1.84],rspe:[5.45,2.02,1.56],rssh:[5.17,1.80,1.52],p356:[3.95,1.67,1.31],p550:[3.70,1.61,1.02],asq:[4.16,1.86,1.34],aurq:[4.40,1.72,1.34],bm3:[4.35,1.68,1.37],bm5:[4.78,1.80,1.44],b02t:[4.22,1.63,1.41],lcou:[4.14,2.00,1.07],lmiu:[4.36,1.76,1.05],p917:[4.12,1.98,.94],fgt40:[4.19,1.78,1.03],mspe:[5.14,2.00,1.12],jetp:[4.45,1.66,1.22],m540:[5.01,1.80,1.55],bt57:[5.00,1.75,1.55],bblo:[4.38,1.74,1.65]};
 const wedge=new Set('lcou ldia lmur lave lven lcen lsian lrev ltem bm1 f308 f288 ftr ff40 fdyt beb110 lesp mbor jxj'.split(' '));
 const round=new Set('p356 p550 p930 prs pgt3 pgt2 p911r p959 p986 lmiu m300 b507 bz8 f250 adb5 adbz jxk jetp jxkss'.split(' '));
 const wings=new Set('p930 p959 prs pgt3 pgt2 p917 mclk mone ff40 ff50 fenz flaf bbol lven lcen adva msen m765 mmc12 pzon kagr fgt40'.split(' '));
 const boxy=new Set('mg63 llm2 aurq asq ars2 be9 bm3 bm5 b02t rssh rpha rcul bcon lesa fsh'.split(' '));
 const cache=new Map(),mix=(a,b,t)=>a+(b-a)*t;
 function profile(c){if(cache.has(c.id))return cache.get(c.id);const suv=c.body==='suv',wagon=c.body==='kombi',saloon=c.body==='limo',open=c.body==='roadster',vintage=['m540','bt57','bblo'].includes(c.id),tech=RACEHANDLING.profile(c),mid=tech.engine==='MR',old=c.y<1995;
  const dims=special[c.id]||[suv?4.95:wagon?4.82:saloon?4.90:mid?4.48:old?4.32:4.65,suv?1.98:old?1.78:mid?1.98:1.90,suv?1.70:saloon||wagon?1.46:mid?1.18:old?1.30:1.34];
  const [length,width,height]=dims,r=suv?.39:old?.315:.345,wb=tech.wb||tech.wheelbase||2.65,p={length,width,height,wheelX:width/2-.12,wheelY:r,wheelRadius:r,axles:[-wb/2,wb/2],exhaustZ:-length/2-.06,exhaustY:r*.85,exhaustX:width*.31,suv,wagon,saloon,open,vintage,mid,old,wedge:wedge.has(c.id),round:round.has(c.id),box:boxy.has(c.id),wing:wings.has(c.id)};
  cache.set(c.id,Object.freeze(p));return p;
 }
 function face(b,P,col,N){for(let i=1;i<P.length-1;i++){let a=P[0],d=P[i],e=P[i+1],u=d.map((v,k)=>v-a[k]),v=e.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(Math.hypot(...n)<1e-9)continue;if(n.reduce((s,v,k)=>s+v*N[k],0)<0)[d,e]=[e,d];b.tri(a,d,e,col);}}
 function body(c,paint){const p=profile(c),b=new G3.MB(),W=p.width/2,L=p.length/2,H=p.height,dark=0x19232a,glass=0x294c5d,chrome=p.old?0xa7aeb0:0x4a5359,belt=p.suv?H*.57:p.vintage?H*.46:H*.62;
  const width=z=>W*(1-(p.box?.025:p.round?.18:.10)*Math.abs(z/L)**4),top=(x,z)=>belt+(p.round?.09:.035)*(1-(x/W)**2)-(p.wedge?.24:p.box?.06:.19)*Math.max(0,z/L)**4-.05*Math.max(0,-z/L)**6+.09*Math.exp(-(((Math.abs(z)-p.axles[1])/.45)**2))*Math.exp(-(((Math.abs(x/W)-.78)/.24)**2));
  const zs=[];for(let j=0;j<=24;j++)zs.push(-L+j*p.length/24);for(const axle of p.axles)for(let j=0;j<=16;j++)zs.push(axle+(p.wheelRadius+.035)*Math.cos(j*Math.PI/16));zs.sort((a,b)=>a-b);
  for(let j=1;j<zs.length;j++){const a=zs[j-1],d=zs[j];if(d-a<1e-5)continue;for(let i=0;i<8;i++){const x0=i/4-1,x1=(i+1)/4-1;face(b,[[x0*width(a),top(x0*width(a),a),a],[x1*width(a),top(x1*width(a),a),a],[x1*width(d),top(x1*width(d),d),d],[x0*width(d),top(x0*width(d),d),d]],paint,[0,1,0]);}
   for(const s of [-1,1]){const low=z=>{for(const axle of p.axles){const dz=z-axle,r=p.wheelRadius+.035;if(Math.abs(dz)<r)return p.wheelY+Math.sqrt(r*r-dz*dz);}return .20;};face(b,[[s*width(a),low(a),a],[s*width(d),low(d),d],[s*width(d),top(width(d),d),d],[s*width(a),top(width(a),a),a]],paint,[s,0,0]);}
  }
  for(const s of [-1,1]){const z=s*L;face(b,[[-width(z),.20,z],[width(z),.20,z],[width(z),top(width(z),z),z],[-width(z),top(width(z),z),z]],paint,[0,0,s]);}
  const front=p.mid?.30*L:.06*L,rear=p.wagon||p.suv?-.66*L:p.mid?-.48*L:-.42*L,rf=p.box?front+.08:front-.18,rr=p.box?rear+.08:rear+.18,rw=W*(p.box?.86:.70),base=W*.90;
  if(!p.open){face(b,[[-base,belt,front+.55],[base,belt,front+.55],[rw,H-.035,rf],[-rw,H-.035,rf]],glass,[0,1,1]);face(b,[[base,belt,rear-.45],[-base,belt,rear-.45],[-rw,H-.035,rr],[rw,H-.035,rr]],glass,[0,1,-1]);
   for(let j=0;j<8;j++){const a=-1+j/4,d=a+.25,y=u=>H-.035*u*u;face(b,[[a*rw,y(a),rf],[d*rw,y(d),rf],[d*rw,y(d),rr],[a*rw,y(a),rr]],paint,[0,1,0]);}
   for(const s of [-1,1]){face(b,[[s*base,belt,front+.55],[s*base,belt,rear-.45],[s*rw,H-.035,rr],[s*rw,H-.035,rf]],glass,[s,0,0]);for(const t of [0,.52,1]){const z0=mix(front+.55,rear-.45,t),z1=mix(rf,rr,t);face(b,[[s*base,belt,z0-.025],[s*base,belt,z0+.025],[s*rw,H-.035,z1+.025],[s*rw,H-.035,z1-.025]],paint,[s,0,0]);}}
  }else{b.box(base*1.85,.08,.95,dark,{y:belt+.005,z:-.18});for(const s of [-1,1])b.box(.39,.30,.35,0x514a42,{x:s*.37,y:belt,z:-.36});face(b,[[-base,belt,.65],[base,belt,.65],[rw,H,.35],[-rw,H,.35]],glass,[0,1,1]);}
  // Einfassungen, Spiegel, Leuchten und markentypische Frontsignaturen.
  for(const s of [-1,1]){b.box(.13,.075,.22,paint,{x:s*(W+.065),y:belt+.12,z:front+.43});b.box(.018,.025,.13,chrome,{x:s*(W+.005),y:belt-.10,z:-.15});
   if(c.b==='bmw'&&p.old){for(const dx of [-.105,.105])b.sphere(.085,10,5,0xe0e2cf,{x:s*W*.70+dx,y:top(W*.7,L)-.05,z:L+.02,sz:.35});}else if(c.b==='pagani'){for(const dy of [0,.11])b.sphere(.065,10,5,0xe0e2cf,{x:s*W*.70,y:top(W*.7,L)-.10+dy,z:L+.02,sz:.35});}else if(p.round||p.vintage||c.id==='mg63')b.sphere(.13,10,5,0xe0e2cf,{x:s*W*.70,y:top(W*.7,L)-.02,z:L+.015,sx:1,sy:1.05,sz:.35});else b.box(W*.53,.065,.055,0xd0dfdc,{x:s*W*.68,y:top(W,L)-.095,z:L+.02});
   b.box(W*.58,.065,.055,0xa82c32,{x:s*W*.64,y:belt-.10,z:-L-.025});
   if(p.mid){b.box(.018,.23,.42,dark,{x:s*(W+.003),y:belt-.30,z:-.62});for(let j=0;j<3;j++)b.box(.026,.016,.36,chrome,{x:s*(W+.015),y:belt-.27+j*.065,z:-.62});}
   b.box(.04,.08,p.length*.45,G3.col(paint).map(v=>v*.7),{x:s*(W-.015),y:.20,z:0});
  }
  const gz=L+.024,gy=Math.max(.25,belt-.36);b.box(p.width*.68,.16,.035,dark,{y:gy,z:gz});
  if(c.b==='bmw'){for(const x of [-.16,.16]){b.box(.25,.20,.05,chrome,{x,y:gy+.12,z:gz+.02});b.box(.20,.16,.055,dark,{x,y:gy+.14,z:gz+.025});}}
  else if(c.b==='bugatti'||c.b==='rolls'||p.vintage){b.box(p.width*.25,belt*.56,.06,chrome,{y:.25,z:gz+.02});b.box(p.width*.20,belt*.49,.065,dark,{y:.27,z:gz+.03});for(let j=-2;j<=2;j++)b.box(.012,belt*.45,.07,chrome,{x:j*.06,y:.28,z:gz+.035});}
  else if(['aston','maserati','audi','mercedes','bentley','ford'].includes(c.b)){for(let j=0;j<3;j++)b.box(p.width*.56,.012,.05,chrome,{y:gy+.03+j*.045,z:gz+.025});}
  if(p.wing){b.box(p.width*.88,.05,.32,dark,{y:belt+.35,z:-L+.20});for(const x of [-W*.5,W*.5])b.box(.045,.35,.07,dark,{x,y:belt,z:-L+.20});}
  if(p.vintage){for(const s of [-1,1])b.box(.26,.08,p.length*.76,paint,{x:s*W,y:.55,z:0});}
  if(c.b==='pagani'){for(const x of [-.07,.07])for(const y of [.34,.48])b.cyl(.05,.05,.09,12,chrome,{x,y,z:-L,rx:Math.PI/2});}
  b.box(.30,.085,.045,0xc3c5bd,{y:.23,z:gz+.03});return b;
 }
 function wheel(c){const p=profile(c),b=new G3.MB(),r=p.wheelRadius;b.cyl(r,r,.22,20,0x1d2327,{x:-.11,rz:-Math.PI/2,smooth:true});b.cyl(r*.70,r*.70,.018,20,0x303b43,{x:.113,rz:-Math.PI/2,nobot:true});const spokes=p.old?8:c.b==='bmw'?10:5;for(let j=0;j<spokes;j++){const a=j/spokes*Math.PI*2;face(b,[[.14,Math.cos(a-.12)*r*.20,Math.sin(a-.12)*r*.20],[.14,Math.cos(a-.04)*r*.71,Math.sin(a-.04)*r*.71],[.14,Math.cos(a+.04)*r*.71,Math.sin(a+.04)*r*.71],[.14,Math.cos(a+.12)*r*.20,Math.sin(a+.12)*r*.20]],0x9ca6ac,[1,0,0]);}b.cyl(.045,.045,.02,10,0x7e8a90,{x:.135,rz:-Math.PI/2});return b;}
 return {profile,body,wheel};
})();
