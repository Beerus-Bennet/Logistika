/* v343: Bewohner im Arbeitermaßstab. Gespeicherte Wege/Abläufe und getrennte
   Darstellung: Briefkasten, Fahrrad schieben, Auf-/Absteigen und Marktbesuche. */
const VILLAGE_PEOPLE = (() => {
  const SCALE=1.45,DAY=1440,W={R:null,actors:new Map()},speed={walk:1.35,push:1.15,ride:6};
  const len=p=>p.slice(1).reduce((n,q,i)=>n+Math.hypot(q[0]-p[i][0],q[1]-p[i][1]),0);
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function along(points,d){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=l||i===points.length-1){const f=l?Math.min(1,d/l):0;return {x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,ry:Math.atan2(b[0]-a[0],b[1]-a[1])};}d-=l;}return {x:points[0][0],z:points[0][1],ry:0};}
  function rounded(points,r=.35){const out=[points[0]];for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],l1=Math.hypot(a[0]-b[0],a[1]-b[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]);if(l1<.01||l2<.01)continue;
      const d=Math.min(r,l1/3,l2/3),u=[b[0]+(a[0]-b[0])*d/l1,b[1]+(a[1]-b[1])*d/l1],v=[b[0]+(c[0]-b[0])*d/l2,b[1]+(c[1]-b[1])*d/l2];out.push(u);
      for(let j=1;j<=5;j++){const t=j/5;out.push([(1-t)**2*u[0]+2*t*(1-t)*b[0]+t*t*v[0],(1-t)**2*u[1]+2*t*(1-t)*b[1]+t*t*v[1]]);}}
    out.push(points[points.length-1]);return out;}
  const move=(kind,pts)=>({kind,pts,duration:Math.max(.2,len(pts)/speed[kind])});
  const wait=(kind,pt,duration,ry=0)=>({kind,pts:[pt,pt],duration,ry});
  function access(p){const d=VILLAGE.door(p),g=VILLAGE_SITE.gate(p),m=VILLAGE_SITE.mailbox(p),park=VILLAGE_SITE.bikePark(p),side=p.road+p.side*VILLAGE_SITE.sidewalk;
    return {d,g,m,park,stand:[park[0],park[1]+.36*SCALE],side,mail:[p.road+p.side*1.48,m[1]+p.side*.26],mount:[p.road+.42,g[1]],back:[p.road-.42,g[1]]};}
  function marketPlan(p,market){
    if(market&&!farmAreaOpen('see'))return null;const o=stallObj(market);if(!o)return null;
    const c=farmCenter(o),sz=farmSize(o),ry=farmRotation(o)*Math.PI/2,forward=[Math.sin(ry),Math.cos(ry)],right=[Math.cos(ry),-Math.sin(ry)],dist=Math.abs(forward[0])*sz[0]/2+Math.abs(forward[1])*sz[1]/2+.75;
    const sideDist=Math.abs(right[0])*sz[0]/2+Math.abs(right[1])*sz[1]/2+.75;
    const candidates=[[c[0]+forward[0]*dist,c[1]+forward[1]*dist],...[-1,1].map(s=>[c[0]+s*right[0]*sideDist+forward[0]*.35,c[1]+s*right[1]*sideDist+forward[1]*.35]),[c[0]-forward[0]*dist,c[1]-forward[1]*dist]];
    if(typeof navPath!=='function')return null;
    for(const counter of candidates){
      if(Math.abs(counter[1]-VILLAGE_SITE.main)<1.18)continue;
      const space=(Number(p.id)%3-1)*.9,parking=[counter[0]+right[0]*(1.8+space),counter[1]+right[1]*(1.8+space)];
      if(Math.abs(parking[1]-VILLAGE_SITE.main)<1.75)parking[1]=VILLAGE_SITE.main+Math.sign(parking[1]-VILLAGE_SITE.main)*1.75;
      const path=navPath(5,18.5,parking[0],parking[1],'besucher'),walk=path&&navPath(parking[0],parking[1],counter[0],counter[1],'besucher');
      if(path&&walk)return {oid:o.id,center:c,market,parking,counter,path,walk,ry:Math.atan2(c[0]-counter[0],c[1]-counter[1]),parkYaw:Math.abs(parking[1]-VILLAGE_SITE.main)<4?Math.PI/2:ry};
    }return null;
  }
  function start(id,kind,market){const h=VILLAGE.home(id),p=VILLAGE.plot(id);if(!h||!h.resident||h.life&&h.life.active||VILLAGE.obstruction(p))return false;
    const A=access(p),life=h.life||(h.life={}),day=Math.floor(S.time/DAY);let steps,trip=null;
    if(kind==='mail'){
      steps=[move('walk',[A.d,A.g,[A.side,A.g[1]],A.mail]),wait('mail',A.mail,4.5,p.side*Math.PI/2),move('walk',[A.mail,[A.side,A.g[1]],A.g,A.d])];life.mailDay=day;
    }else{
      trip=marketPlan(p,!!market);if(!trip)return false;
      const out=rounded([A.mount,[p.road+.42,20.1],[p.road+.7,18.92],[5,18.92],...trip.path.slice(1)]),back=rounded([...trip.path].reverse().concat([[5,18.08],[p.road-.7,18.08],[p.road-.42,20.1],A.back]));
      const exit=[A.park,[A.g[0]+p.side*.8,A.park[1]],[A.g[0]+p.side*.8,A.g[1]],A.g,[A.side,A.g[1]],A.mount],entry=[A.back,[A.side,A.g[1]],A.g,[A.park[0]+p.side*.8,A.g[1]],[A.park[0]+p.side*.8,A.park[1]],A.park];
      const walkToBike=[A.d,[A.park[0]+p.side*1.55,A.d[1]],[A.park[0]+p.side*1.55,A.stand[1]],A.stand];
      steps=[move('walk',walkToBike),wait('unlock',A.stand,1.2,Math.PI),move('push',exit),wait('look',A.mount,1.1,Math.PI),wait('mount',A.mount,2.4,Math.PI),move('ride',out),wait('dismount',trip.parking,2.4,trip.parkYaw),move('walk',trip.walk),wait('buy',trip.counter,7,trip.ry),move('walk',trip.walk.slice().reverse()),wait('mount',trip.parking,2.4,trip.parkYaw),move('ride',back),wait('dismount',A.back,2.4,0),move('push',entry),wait('lock',A.stand,1.2,Math.PI),move('walk',walkToBike.slice().reverse())];life.shopDay=day;
    }
    life.active={kind,at:S.time,index:0,steps,trip,bought:false,attempted:false,day};return true;
  }
  function buy(h,L){if(L.attempted)return;L.attempted=true;const M=L.trip;if(!M||!stallObj(M.market)||stallObj(M.market).id!==M.oid||M.market&&!farmAreaOpen('see'))return;
    const at=farmCenter(stallObj(M.market));if(M.center&&Math.hypot(at[0]-M.center[0],at[1]-M.center[1])>.1)return;
    const St=stallState(M.market),size=h.resident.size||1,budget=70+size*35;
    const it=St.slots.find(it=>it&&!it.sold&&['silo','barn','fisch'].includes(FITEMS[it.id].st)&&!['waste','feed','bait'].includes(FITEMS[it.id].k)&&it.n*FITEMS[it.id].kg<=12&&it.p<=budget&&it.p<=stallBase(it.id,it.n,M.market,it.v)*1.6);
    if(it&&stallCustomerSale(M.market,it,h.resident.n)){L.bought=true;h.life.purchases=(h.life.purchases||0)+1;}
  }
  function tick(){if(!farmOn())return;const T=VILLAGE.state(),day=Math.floor(S.time/DAY),m=S.time%DAY;
    for(const p of VILLAGE_DATA.plots){const h=T.homes[p.id];if(!h.resident)continue;const life=h.life||(h.life={});let L=life.active;
      if(L){let n=0;while(L&&n++<32){const step=L.steps[L.index],end=L.at+step.duration;if(S.time<end)break;
          /* Am Markt erst zum Tresen gehen, wenn der vorherige Kunde Platz macht. */
          if(L.trip&&L.index===6&&Object.values(T.homes).some(o=>o!==h&&o.life&&o.life.active&&o.life.active.trip&&o.life.active.trip.oid===L.trip.oid&&o.life.active.index>=7&&o.life.active.index<=9)){
            L.at=S.time-step.duration;L.waiting=true;break;
          }L.waiting=false;
          if(step.kind==='buy'&&S.time-end<180)buy(h,L);L.at=end;L.index++;
          if(L.index===L.steps.length){life.active=null;L=null;}}
      }else if(m>=365&&m<1260){
        if(life.mailDay!==day&&m>=375+(h.resident.seed%45))start(p.id,'mail');
        else if(life.shopDay!==day&&S.time>=(life.retryAt||0)&&m>=540+(h.resident.seed%8)*27){
          const preferFish=(day+h.resident.seed)%2===0&&farmAreaOpen('see')&&!!stallObj(true);
          if(!start(p.id,'shop',preferFish)&&!start(p.id,'shop',!preferFish))life.retryAt=S.time+30;
        }
      }
    }
  }
  function sample(L){const s=L.steps[L.index],f=Math.max(0,Math.min(1,(S.time-L.at)/s.duration)),p=along(s.pts,len(s.pts)*f);if(s.ry!=null)p.ry=s.ry;return {...p,kind:s.kind,f,distance:len(s.pts)*f};}
  function wheelMesh(){const b=new FM.MB(),r=.30,inner=.255;
    for(let i=0;i<20;i++){const a=i*Math.PI/10,c=(i+1)*Math.PI/10,pt=(x,q,t)=>[x,Math.cos(t)*q,Math.sin(t)*q];
      b.quad(pt(.025,r,a),pt(.025,r,c),pt(.025,inner,c),pt(.025,inner,a),0x292e32);
      b.quad(pt(-.025,inner,a),pt(-.025,inner,c),pt(-.025,r,c),pt(-.025,r,a),0x292e32);
      b.quad(pt(-.025,r,a),pt(-.025,r,c),pt(.025,r,c),pt(.025,r,a),0x292e32);
      b.quad(pt(-.025,inner,a),pt(.025,inner,a),pt(.025,inner,c),pt(-.025,inner,c),0x292e32);}
    for(let i=0;i<6;i++)b.at({rx:i*Math.PI/6},m=>m.box(.012,inner*2,.012,0xbfc5c6,{y:-inner}));return b;}
  function beam(b,a,c,color,w=.027){const dx=c[0]-a[0],dy=c[1]-a[1],dz=c[2]-a[2],l=Math.hypot(dx,dy,dz);b.at({x:a[0],y:a[1],z:a[2],rx:Math.atan2(dz,dy),rz:-Math.atan2(dx,Math.hypot(dy,dz))},q=>q.box(w,l,w,color));}
  function bikeMesh(color){const b=new FM.MB(),rear=[0,.3,-.48],crank=[0,.3,-.06],seat=[0,.57,-.22],head=[0,.66,.30],front=[0,.3,.48];
    [[rear,seat],[rear,crank],[seat,crank],[crank,head],[seat,head],[head,front]].forEach(q=>beam(b,q[0],q[1],color));
    beam(b,seat,[0,.58,-.22],0x9ba2a6);b.box(.15,.035,.23,0x3b3430,{y:.55,z:-.22});beam(b,head,[0,.77,.18],0x9ba2a6);
    b.box(.42,.025,.025,0x2d353a,{y:.77,z:.18});[-1,1].forEach(s=>b.box(.085,.035,.045,0x3b3430,{x:s*.20,y:.76,z:.18}));
    b.box(.31,.025,.29,0x6c7069,{y:.51,z:.42});b.box(.025,.17,.29,0x8c754d,{x:-.15,y:.52,z:.42});b.box(.025,.17,.29,0x8c754d,{x:.15,y:.52,z:.42});b.box(.31,.17,.025,0x8c754d,{y:.52,z:.56});return b;}
  const add=(mesh,o)=>{const n=fnode(mesh,o);W.R.nodes.push(n);return n;};
  const child=(parent,mesh,o)=>W.R.addChild(parent,fnode(mesh,o));
  function rig(p,r){const L=r.look,root=add(null,{x:p.x,z:p.z,s:SCALE,visible:false}),hip=child(root,null,{y:.42});
    child(hip,fmesh('villager-body343:'+r.id,()=>FWM.person({...L,noLegs:true,noArms:true})),{y:-.42});
    const arms=[-1,1].map(s=>{const upper=child(hip,fmesh('v-arm343:'+L.shirt,()=>{const b=new FM.MB();b.box(.07,.19,.08,L.shirt,{y:-.19});return b;}),{x:s*(L.fem?.17:.19),y:.36}),lower=child(upper,fmesh('v-fore343:'+L.shirt+':'+L.skin,()=>{const b=new FM.MB();b.box(.065,.17,.075,L.shirt,{y:-.17});b.box(.065,.065,.072,L.skin||0xf2c9a0,{y:-.225});return b;}),{y:-.19});return {upper,lower};});
    const legs=[-1,1].map(s=>{const thigh=child(root,fmesh('v-thigh343:'+L.pants,()=>{const b=new FM.MB();b.box(.09,.22,.11,L.pants,{y:-.22});return b;}),{x:s*.07,y:.42}),shin=child(thigh,fmesh('v-shin343:'+L.pants,()=>{const b=new FM.MB();b.box(.085,.20,.10,L.pants,{y:-.20});return b;}),{y:-.22}),foot=child(shin,fmesh('v-shoe343:'+L.boots,()=>{const b=new FM.MB();b.box(.10,.055,.17,L.boots||0x4b4946,{z:.03});return b;}),{y:-.20});return {thigh,shin,foot};});
    const paper=child(arms[1].lower,fmesh('v-letter343',()=>{const b=new FM.MB();b.box(.12,.018,.085,0xf5eedc,{z:.025});return b;}),{y:-.24,visible:false});
    const bagMesh=()=>{const b=new FM.MB();b.box(.19,.24,.14,0xb58d59,{y:-.24});beam(b,[-.07,0,0],[-.07,.09,0],0x755735,.015);beam(b,[.07,0,0],[.07,.09,0],0x755735,.015);beam(b,[-.07,.09,0],[.07,.09,0],0x755735,.015);return b;};
    const bag=child(arms[1].lower,fmesh('v-bag343',bagMesh),{y:-.24,visible:false});
    const bike=add(fmesh('v-bike343:'+r.seed%4,()=>bikeMesh([0x537888,0x98654f,0x8a9b68,0x7f7297][r.seed%4])),{s:SCALE});
    const wheels=[-.48,.48].map(z=>child(bike,fmesh('v-wheel343',wheelMesh),{y:.3,z})),crank=child(bike,null,{y:.3,z:-.06});
    for(const s of [-1,1]){child(crank,fmesh('v-crank343',()=>{const b=new FM.MB();b.box(.02,.11,.02,0x9ca3a6);return b;}),{x:s*.12,rx:s<0?Math.PI:0});child(crank,fmesh('v-pedal343',()=>{const b=new FM.MB();b.box(.1,.022,.065,0x393d3e);return b;}),{x:s*.16,y:s*.11});}
    const basketBag=child(bike,fmesh('v-basketbag343',bagMesh),{y:.78,z:.42,visible:false});
    return {id:r.id,node:root,hip,arms,legs,paper,bag,bike,wheels,crank,basketBag,scale:SCALE};
  }
  function attach(R){W.R=R;W.actors.clear();sync();}
  function sync(){if(!W.R||!farmOn())return;for(const {p,r}of VILLAGE.residents())if(!W.actors.has(p.id)||W.actors.get(p.id).id!==r.id)W.actors.set(p.id,rig(p,r));}
  function legIK(e,y,z){const u=.22,l=.20,d=Math.max(.025,Math.min(u+l-.001,Math.hypot(y,z))),a=Math.atan2(z,-y)+Math.acos(Math.max(-1,Math.min(1,(u*u+d*d-l*l)/(2*u*d)))),k=Math.acos(Math.max(-1,Math.min(1,(d*d-u*u-l*l)/(2*u*l))));e.thigh.rx=-a;e.shin.rx=k;e.foot.rx=a-k;}
  function ridePose(e,phase){e.hip.rx=.17;e.arms.forEach(a=>{a.upper.rx=-.95;a.lower.rx=-.75;});e.legs.forEach((l,i)=>{const t=phase+i*Math.PI;legIK(l,.3+.11*Math.cos(t)-.56,-.06+.11*Math.sin(t)+.22);l.thigh.rz=(i?-1:1)*.19;l.foot.rz=-l.thigh.rz;});}
  function step(dt,time){if(!W.R||!farmOn())return;tick();sync();
    for(const {p,h}of VILLAGE.residents()){const e=W.actors.get(p.id),A=access(p),L=h.life&&h.life.active,n=e.node,b=e.bike;
      b.x=A.park[0];b.z=A.park[1];b.y=.04;b.ry=p.ry;b.rz=.10;b.visible=!VILLAGE.obstruction(p);n.visible=!!L&&b.visible;
      e.paper.visible=e.bag.visible=e.basketBag.visible=false;if(!L)continue;
      const q=sample(L),stage=q.kind,moving=['walk','push','ride'].includes(stage),phase=q.distance/1.05*Math.PI*2;
      n.x=q.x;n.z=q.z;n.y=.04+(moving&&stage!=='ride'?Math.abs(Math.sin(phase))*.045:0);n.ry=q.ry;n.rx=n.rz=e.hip.rx=0;
      for(const a of e.arms){a.upper.rx=-.04;a.upper.rz=0;a.lower.rx=-.12;}
      e.legs.forEach((l,i)=>{l.thigh.rx=moving?Math.sin(phase+i*Math.PI)*.48:0;l.thigh.rz=l.foot.rz=0;l.shin.rx=moving?.08+Math.max(0,-Math.sin(phase+i*Math.PI))*.66:0;l.foot.rx=-l.thigh.rx-l.shin.rx;});
      if(stage==='walk')e.arms.forEach((a,i)=>a.upper.rx=-Math.sin(phase+i*Math.PI)*.45);
      if(stage==='mail'){const t=q.f,reach=Math.sin(Math.PI*Math.min(1,t*1.5));e.hip.rx=.16*reach;e.arms[1].upper.rx=-1.1*reach;e.arms[1].lower.rx=-.65*reach;e.paper.visible=t>.46&&t<.9;}
      const bikeAction=['push','look','mount','ride','dismount'].includes(stage);
      if(bikeAction){b.x=q.x;b.z=q.z;b.ry=q.ry;b.rz=0;
        if(stage==='ride'||stage==='mount'||stage==='dismount'){
          const k=stage==='ride'?1:smooth(stage==='mount'?q.f:1-q.f),side=p.side,seated=smooth((k-.65)/.35);
          const lx=(1-k)*side*.4*SCALE,lz=-.22*SCALE;n.x=q.x+Math.cos(q.ry)*lx+Math.sin(q.ry)*lz;n.z=q.z-Math.sin(q.ry)*lx+Math.cos(q.ry)*lz;n.y=.04+.14*SCALE*seated;
          ridePose(e,stage==='ride'?q.distance/.70:0);e.hip.rx*=k;e.arms.forEach(a=>{a.upper.rx*=.5+.5*k;});
          if(k<1)e.legs.forEach((l,i)=>{const swing=i===(side>0?1:0),lift=Math.sin(k*Math.PI);
            l.thigh.rz=swing?side*lift*.5:0;l.thigh.rx=l.thigh.rx*seated+(swing?-.55*lift:0)*(1-seated);l.shin.rx=l.shin.rx*seated+(swing?1.0*lift:0)*(1-seated);l.foot.rx=-l.thigh.rx-l.shin.rx;});
          e.crank.rx=stage==='ride'?q.distance/.70:0;e.wheels.forEach(w=>w.rx=stage==='ride'?q.distance/(.3*SCALE):0);
        }else{const side=p.side,offset=.36*SCALE;n.x+=Math.cos(q.ry)*side*offset;n.z-=Math.sin(q.ry)*side*offset;e.arms[side>0?0:1].upper.rx=-.9;}
      }else if(L.trip&&L.index>5&&L.index<11){b.x=L.trip.parking[0];b.z=L.trip.parking[1];b.ry=L.trip.parkYaw??L.trip.ry;b.rz=.12;}
      if(stage==='buy'){e.hip.rx=.08;e.arms[1].upper.rx=-.8+Math.sin(q.f*Math.PI*4)*.12;e.arms[1].lower.rx=-.65;}
      if(stage==='unlock'||stage==='lock'){e.hip.rx=.5*Math.sin(q.f*Math.PI);e.arms[1].upper.rx=-.7;}
      if(stage==='look')e.hip.ry=Math.sin(q.f*Math.PI*2)*.5;else e.hip.ry=0;
      if(L.bought){e.basketBag.visible=['ride','push','look','mount','dismount','lock'].includes(stage);e.bag.visible=!e.basketBag.visible;}
      /* Übergänge und Lenken glätten; Fahrer und Rad bleiben dabei verbunden. */
      const turn=(a,c)=>((c-a+Math.PI*3)%(Math.PI*2))-Math.PI,k=Math.min(1,dt*9),pb=e.prevB;
      if(pb&&Math.hypot(pb.x-b.x,pb.z-b.z)<8){const bx=b.x,bz=b.z,br=b.ry,dr=turn(br,pb.ry)*(1-k);b.x=pb.x+(b.x-pb.x)*k;b.z=pb.z+(b.z-pb.z)*k;b.ry=br+dr;
        if(bikeAction){const x=n.x-bx,z=n.z-bz;n.x=b.x+x*Math.cos(dr)+z*Math.sin(dr);n.z=b.z-x*Math.sin(dr)+z*Math.cos(dr);n.ry=b.ry;}}
      const pn=e.prevN;if(!bikeAction&&pn&&Math.hypot(pn.x-n.x,pn.z-n.z)<3){n.x=pn.x+(n.x-pn.x)*k;n.z=pn.z+(n.z-pn.z)*k;n.ry=pn.ry+turn(pn.ry,n.ry)*k;}
      e.prevB={x:b.x,z:b.z,ry:b.ry};e.prevN={x:n.x,z:n.z,ry:n.ry};
    }
  }
  return {attach,sync,step,tick,access,start,sample,marketPlan,scale:SCALE,_world:W,_legIK:legIK};
})();
