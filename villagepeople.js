/* v354: Wegplanung, Prüfung und Darstellung nutzen dieselbe Lagefunktion (pose); das Rad
   folgt mit beiden Rädern dem geprüften Weg, Wenden ist ein eigener Schritt (turn).
   v343: Bewohner im Arbeitermaßstab. Gespeicherte Wege/Abläufe und getrennte
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
  /* v354: Eine gemeinsame Lage für Planung, Prüfung und Darstellung.
     Rad: Vorder- und Hinterrad liegen beide auf dem geprüften Weg (kein nachträgliches Glätten,
     das Ecken durch Zaun oder Tresen abkürzt). Person: neben dem Rad (side = Seite relativ zur
     Fahrtrichtung), beim Auf-/Absteigen bis in den Sattel. */
  const VER=478,WB=.96*SCALE,LAT=.40,BACK=-.15,SEAT=-.22*SCALE,SHIFT=.22,BIKE_T=[-.9,-.45,0,.45,.9],
    /* Umriss des Rads längs der Achse: [Abstand von der Mitte, Radius] – Reifenspitzen schmal, Rahmen/Lenker/Korb breiter. */
    BIKE_SHAPE=[[-1.1,.1],[-.62,.2],[0,.22],[.62,.2],[1.1,.1]];
  const BIKE_WAIT=new Set(['unlock','lock','turn','look','mount','dismount']),BIKE_MOVE=new Set(['push','ride']);
  const move=(kind,pts,side)=>({kind,pts,duration:Math.max(.2,len(pts)/speed[kind]),side});
  const wait=(kind,pt,duration,ry=0,side)=>({kind,pts:[pt,pt],duration,ry,side});
  function ext(points,d){const L=len(points);if(d>=0&&d<=L)return along(points,d);
    const end=d>L,n=points.length;let a,b;
    if(end){b=points[n-1];for(let i=n-2;i>=0;i--){a=points[i];if(Math.hypot(b[0]-a[0],b[1]-a[1])>.001)break;}}
    else{a=points[0];for(let i=1;i<n;i++){b=points[i];if(Math.hypot(b[0]-a[0],b[1]-a[1])>.001)break;}}
    const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ux=(b[0]-a[0])/l,uz=(b[1]-a[1])/l,o=end?b:a,t=end?d-L:d;return {x:o[0]+ux*t,z:o[1]+uz*t,ry:Math.atan2(ux,uz)};}
  function bikeAt(points,d){const r=ext(points,d-WB/2),f=ext(points,d+WB/2);return {x:(r.x+f.x)/2,z:(r.z+f.z)/2,ry:Math.atan2(f.x-r.x,f.z-r.z)};}
  const rel=(b,lx,lz)=>({x:b.x+Math.cos(b.ry)*lx+Math.sin(b.ry)*lz,z:b.z-Math.sin(b.ry)*lx+Math.cos(b.ry)*lz,ry:b.ry});
  const beside=(b,side)=>rel(b,side*LAT,BACK);
  /* Lage von Person und Rad im Schritt s beim Anteil f (0 … 1). */
  function pose(s,f){f=Math.max(0,Math.min(1,f));const D=len(s.pts),d=D*f,side=s.side||1,o={kind:s.kind,f,distance:d,side,bike:null,k:0};
    if(BIKE_MOVE.has(s.kind))o.bike=bikeAt(s.pts,d);
    else if(BIKE_WAIT.has(s.kind))o.bike={x:s.pts[0][0],z:s.pts[0][1],ry:(s.ry||0)+(s.kind==='turn'?Math.PI*smooth(f):0)};
    if(!o.bike){const q=along(s.pts,d);o.person={x:q.x,z:q.z,ry:s.ry!=null?s.ry:q.ry};return o;}
    o.k=s.kind==='ride'?1:s.kind==='mount'?smooth(f):s.kind==='dismount'?smooth(1-f):0;
    o.person=rel(o.bike,(1-o.k)*side*LAT,BACK+(SEAT-BACK)*o.k);return o;}
  /* Ist die Lage frei? Person als Kreis, Rad als Kreiskette (Räder, Rahmen, Korb). */
  function poseClear(o,extra){const B=VILLAGE_SITE.blocked;
    if(o.bike){for(const [t,r] of BIKE_SHAPE)if(B(o.bike.x+Math.sin(o.bike.ry)*t,o.bike.z+Math.cos(o.bike.ry)*t,r,extra))return false;
      if(o.kind==='turn'&&B(o.bike.x,o.bike.z,1.15,extra))return false;}
    return o.kind==='ride'||!B(o.person.x,o.person.z,.3,extra);}
  function stepClear(s,extra,from=0){const n=s.pts[0]===s.pts[1]?(s.kind==='turn'?6:1):Math.max(1,Math.ceil(len(s.pts)/.12));
    for(let i=0;i<=n;i++){const f=i/n;if(f<from)continue;if(!poseClear(pose(s,f),extra))return false;}return true;}
  /* Das eigene abgestellte Rad: schmal genug, dass die Person direkt daneben stehen kann. */
  const bikeCircles=(c,ry,r=.04)=>BIKE_T.map(t=>({x:c[0]+Math.sin(ry)*t,z:c[1]+Math.cos(ry)*t,r}));
  function access(p){const d=VILLAGE.door(p),g=VILLAGE_SITE.gate(p),m=VILLAGE_SITE.mailbox(p),park=VILLAGE_SITE.bikePark(p),side=p.road+p.side*VILLAGE_SITE.sidewalk;
    const st=beside({x:park[0],z:park[1],ry:0},p.side);
    /* Auf- und Absteigen auf der rechten Fahrspur (Rechtsverkehr), vor der Einfahrt. Wer die Straße
       queren muss, hält weiter vorn – gegenüberliegende Nachbarn stehen sich so nicht im Weg. */
    return {d,g,m,park,stand:[st.x,st.z],side,mail:[p.road+p.side*1.48,m[1]+p.side*.26],mount:[p.road-.5,g[1]-SHIFT-1.9-(p.side>0?3.4:0)],back:[p.road+.5,g[1]+SHIFT-(p.side<0?5.3:2.8)]};}
  /* Wege mit dem Rad durchs Gartentor: gerade durch die Öffnung, das Rad so weit zur Seite,
     dass Rad und Person zusammen mittig durchpassen. */
  function homePaths(p,A){const s=p.side,zo=A.g[1]-SHIFT,zi=A.g[1]+SHIFT,inX=A.g[0]+s*1.5,outX=A.g[0]-s*.95;
    return {exit:[A.park,[A.park[0],zo],[inX,zo],[outX,zo],[p.road-.5,zo],A.mount],
      /* Liegt das Tor gleich neben der Fahrspur, erst nach links ausholen: Das Rad steht gerade, bevor es die Öffnung erreicht. */
      entry:(s>0?[A.back,[p.road+.5,zi-2],[p.road-.15,zi-1],[p.road-.15,zi]]:[A.back,[p.road+.5,zi]]).concat([[outX,zi],[inX,zi],[A.park[0],zi],A.park])};}
  function marketPlan(p,market){
    if(market&&!farmAreaOpen('see'))return null;const o=stallObj(market);if(!o)return null;
    const V=VILLAGE_SITE.stallBox(o),c=[(V[0]+V[2])/2,(V[1]+V[3])/2],ry=farmRotation(o)*Math.PI/2,forward=[Math.sin(ry),Math.cos(ry)],right=[Math.cos(ry),-Math.sin(ry)];
    const hf=Math.abs(forward[0])*(V[2]-V[0])/2+Math.abs(forward[1])*(V[3]-V[1])/2,hs=Math.abs(right[0])*(V[2]-V[0])/2+Math.abs(right[1])*(V[3]-V[1])/2,gap=.72;
    /* Einkaufspunkte vor einer zugänglichen Seite: vorn, an beiden Stirnseiten, zuletzt hinten. */
    const candidates=[[c[0]+forward[0]*(hf+gap),c[1]+forward[1]*(hf+gap)],...[-1,1].map(q=>[c[0]+q*right[0]*(hs+gap),c[1]+q*right[1]*(hs+gap)]),[c[0]-forward[0]*(hf+gap),c[1]-forward[1]*(hf+gap)]];
    if(typeof navPath!=='function')return null;
    /* v345: Eigene Radplätze reservieren, Tresen freihalten. Ohne freien Platz Besuch verschieben. */
    const others=Object.entries(VILLAGE.state().homes).filter(([id,h])=>id!==p.id&&h.life&&h.life.active&&h.life.active.trip&&h.life.active.trip.oid===o.id).map(([,h])=>h.life.active.trip);
    const taken=others.map(t=>({x:t.parking[0],z:t.parking[1],r:1.3}));
    const main=VILLAGE_SITE.main;
    for(const counter of candidates){
      if(Math.abs(counter[1]-main)<1.18||VILLAGE_SITE.blocked(...counter,.34,taken))continue;
      for(const space of [3.5,-3.5,6.9,-6.9,10.3,-10.3,13.7,-13.7])for(const depth of [0,-1.1,1.1]){
        const parking=[counter[0]+right[0]*space-forward[0]*depth,counter[1]+right[1]*space-forward[1]*depth];
        if(Math.abs(parking[1]-main)<2.3)continue;
        /* Hofeinfahrt und Weg zum Tor bleiben frei. */
        if(typeof FGATE!=='undefined'&&Math.abs(parking[0]-FGATE.x)<3.4&&parking[1]<main&&parking[1]>main-6)continue;
        if(others.some(t=>Math.hypot(t.parking[0]-parking[0],t.parking[1]-parking[1])<3.4)||VILLAGE_SITE.blocked(...parking,1.2,taken))continue;
        /* Von der Fahrspur gerade auf den Platz; die Anfahrt bestimmt die Stellrichtung. */
        const near=navPath(parking[0],main,parking[0],parking[1],'besucher');if(!near)continue;
        /* An- und Abfahrt teilen sich das letzte gerade Stück vor dem Platz – so passt die Stellrichtung zu beiden. */
        const mid=near.length>2?near.slice(1,-1):[[parking[0],parking[1]+Math.sign(main-parking[1])*1.2]];
        const approach=[[parking[0]-2.2,main-.42],[parking[0]-.7,main-.42],...mid,parking],a=mid[mid.length-1],parkYaw=Math.atan2(parking[0]-a[0],parking[1]-a[1]);
        const leave=[parking,...mid.slice().reverse(),[parking[0],main],[parking[0]-1.5,main+.42]];
        const st=beside({x:parking[0],z:parking[1],ry:parkYaw},p.side),stand=[st.x,st.z],own=bikeCircles(parking,parkYaw);
        const walk=VILLAGE_SITE.safePath([stand,counter],.34,taken.concat(own));if(!walk)continue;
        return {oid:o.id,center:farmCenter(o),market,parking,stand,counter,path:approach,leave,walk,ry:Math.atan2(c[0]-counter[0],c[1]-counter[1]),parkYaw};
      }
    }return null;
  }
  function start(id,kind,market){const h=VILLAGE.home(id),p=VILLAGE.plot(id);if(!h||!h.resident||h.life&&h.life.active||VILLAGE.obstruction(p))return false;
    const A=access(p),life=h.life||(h.life={}),day=Math.floor(S.time/DAY),s=p.side;let steps,trip=null,extra=[];
    if(kind==='mail'){
      steps=[move('walk',[A.d,A.g,[A.side,A.g[1]],A.mail]),wait('mail',A.mail,4.5,s*Math.PI/2),move('walk',[A.mail,[A.side,A.g[1]],A.g,A.d])];
    }else{
      trip=marketPlan(p,!!market);if(!trip)return false;
      const H=homePaths(p,A),main=VILLAGE_SITE.main,P=trip.parkYaw;
      /* Rechtsverkehr: hin auf der Standseite der Hauptstraße, zurück auf der Ortsseite. */
      const out=rounded([A.mount,[p.road-.5,main+1.7],[p.road+1.2,main-.42],...trip.path]);
      const back=rounded([...trip.leave,[p.road+2.2,main+.42],[p.road+.5,main+1.7],A.back]);
      const walkToBike=[A.d,[A.park[0]+s*1.55,A.d[1]],[A.park[0]+s*1.55,A.stand[1]],A.stand];
      steps=[move('walk',walkToBike),wait('unlock',A.park,1.2,0,s),wait('turn',A.park,2.4,0,s),move('push',H.exit,s),wait('look',A.mount,1.1,Math.PI,s),wait('mount',A.mount,2.4,Math.PI,s),
        move('ride',out,s),wait('dismount',trip.parking,2.4,P,s),
        {...move('walk',trip.walk),zone:1},{...wait('buy',trip.counter,7,trip.ry),zone:1},{...move('walk',trip.walk.slice().reverse()),zone:1},
        wait('turn',trip.parking,2.4,P,s),wait('mount',trip.parking,2.4,P+Math.PI,s),move('ride',back,s),wait('dismount',A.back,2.4,0,s),
        move('push',H.entry,s),wait('lock',A.park,1.2,0,s),move('walk',walkToBike.slice().reverse())];
      extra=Object.values(VILLAGE.state().homes).filter(o=>o!==h&&o.life&&o.life.active&&o.life.active.trip&&o.life.active.trip.oid===trip.oid).map(o=>({x:o.life.active.trip.parking[0],z:o.life.active.trip.parking[1],r:1.3}));
    }
    for(const st of steps){
      if(st.kind==='walk'&&!st.zone){const route=VILLAGE_SITE.safePath(st.pts);if(!route){W.lastBlocked={kind:st.kind,pts:st.pts};return false;}st.pts=route;st.duration=Math.max(.2,len(route)/speed.walk);}
      /* Jede Lage des ganzen Ablaufs muss frei sein – sonst findet der Besuch heute nicht statt. */
      const atMarket=trip&&(st.zone||st.pts[0]===trip.parking);
      if(!stepClear(st,atMarket?extra.concat(st.zone?bikeCircles(trip.parking,trip.parkYaw):[]):null)){W.lastBlocked={kind:st.kind,pts:st.pts};return false;}
    }
    if(kind==='mail')life.mailDay=day;else life.shopDay=day;
    life.active={v:VER,kind,at:S.time,index:0,steps,trip,bought:false,attempted:false,day,key:worldKey()};return true;
  }
  const worldKey=()=>typeof navKey==='function'?navKey():'';
  /* v354: Nach Umbauten (Stand versetzt, etwas in den Weg gebaut) den Rest des Ablaufs neu prüfen.
     Ein versperrter Fußweg wird ab dem aktuellen Standort neu gesucht; sonst wartet die Person, bis es frei ist. */
  function recheck(L){const s=L.steps[L.index],f=Math.max(0,Math.min(1,(S.time-L.at)/s.duration));L.hold=false;
    const own=L.trip?bikeCircles(L.trip.parking,L.trip.parkYaw):[];
    for(let i=L.index;i<L.steps.length;i++){const st=L.steps[i],from=i===L.index?f:0,extra=st.zone?own:null;if(stepClear(st,extra,from))continue;
      if(st.kind==='walk'){const a=i===L.index?pose(st,f).person:{x:st.pts[0][0],z:st.pts[0][1]},b=st.pts[st.pts.length-1],route=VILLAGE_SITE.safePath([[a.x,a.z],b],.34,extra);
        if(route){st.pts=route;st.duration=Math.max(.2,len(route)/speed.walk);if(i===L.index)L.at=S.time;continue;}}
      if(i===L.index||i===L.index+1&&f>.98){L.hold=true;}return;}
  }
  function buy(h,L){if(L.attempted)return;L.attempted=true;const M=L.trip;if(!M||!stallObj(M.market)||stallObj(M.market).id!==M.oid||M.market&&!farmAreaOpen('see'))return;
    const at=farmCenter(stallObj(M.market));if(M.center&&Math.hypot(at[0]-M.center[0],at[1]-M.center[1])>.1)return;
    const St=stallState(M.market),size=h.resident.size||1,budget=70+size*35;
    const it=St.slots.find(it=>it&&!it.sold&&['silo','barn','fisch'].includes(FITEMS[it.id].st)&&!['waste','feed','bait'].includes(FITEMS[it.id].k)&&it.n*FITEMS[it.id].kg<=12&&it.p<=budget&&it.p<=stallBase(it.id,it.n,M.market,it.v)*1.6);
    if(it&&stallCustomerSale(M.market,it,h.resident.n)){L.bought=true;h.life.purchases=(h.life.purchases||0)+1;}
  }
  function tick(){if(!farmOn())return;const T=VILLAGE.state(),day=Math.floor(S.time/DAY),m=S.time%DAY,key=worldKey();
    for(const p of VILLAGE_DATA.plots){const h=T.homes[p.id];if(!h.resident)continue;const life=h.life||(h.life={});let L=life.active;
      /* v351: Alte Wege beenden, ohne einen bereits getätigten Einkauf erneut zu buchen. */
      if(L&&L.v!==VER){life.active=null;L=null;}
      if(L&&(L.key!==key||L.hold&&S.time-(L.heldAt||0)>30)){L.key=key;L.heldAt=S.time;recheck(L);}
      if(L&&(L.hold||L.trafficWait)){L.at+=Math.max(0,S.time-(L.lastTime??S.time));L.lastTime=S.time;continue;}if(L)L.lastTime=S.time;
      if(L){let n=0;while(L&&n++<32){const step=L.steps[L.index],end=L.at+step.duration;if(S.time<end)break;
          /* Am Markt erst zum Tresen gehen, wenn der vorherige Kunde Platz macht. */
          const next=L.steps[L.index+1];
          if(L.trip&&next&&next.zone&&!step.zone&&Object.values(T.homes).some(o=>o!==h&&o.life&&o.life.active&&o.life.active.trip&&o.life.active.trip.oid===L.trip.oid&&o.life.active.steps[o.life.active.index].zone)){
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
  const place=L=>{const s=L.steps[L.index];return pose(s,(S.time-L.at)/s.duration);};
  function sample(L){const o=place(L);return {...o.person,kind:o.kind,f:o.f,distance:o.distance};}
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
    const turn=(a,c)=>((c-a+Math.PI*3)%(Math.PI*2))-Math.PI;
    for(const {p,h}of VILLAGE.residents()){const e=W.actors.get(p.id),A=access(p),L=h.life&&h.life.active,n=e.node,b=e.bike;
      b.x=A.park[0];b.z=A.park[1];b.y=.04;b.ry=0;b.rz=.08;b.visible=!VILLAGE.obstruction(p);n.visible=!!L&&b.visible;if(!L)e.prevN=null;
      e.paper.visible=e.bag.visible=e.basketBag.visible=false;if(!L)continue;
      const q=place(L),stage=q.kind,side=q.side,moving=['walk','push','ride','turn'].includes(stage),dist=stage==='turn'?q.f*Math.PI*LAT*2.2:q.distance,phase=dist/1.05*Math.PI*2;
      n.x=q.person.x;n.z=q.person.z;n.y=.04+(moving&&stage!=='ride'?Math.abs(Math.sin(phase))*.045:0);n.ry=q.person.ry;n.rx=n.rz=e.hip.rx=0;
      for(const a of e.arms){a.upper.rx=-.04;a.upper.rz=0;a.lower.rx=-.12;}
      e.legs.forEach((l,i)=>{l.thigh.rx=moving?Math.sin(phase+i*Math.PI)*.48:0;l.thigh.rz=l.foot.rz=0;l.shin.rx=moving?.08+Math.max(0,-Math.sin(phase+i*Math.PI))*.66:0;l.foot.rx=-l.thigh.rx-l.shin.rx;});
      if(stage==='walk')e.arms.forEach((a,i)=>a.upper.rx=-Math.sin(phase+i*Math.PI)*.45);
      if(stage==='mail'){const t=q.f,reach=Math.sin(Math.PI*Math.min(1,t*1.5));e.hip.rx=.16*reach;e.arms[1].upper.rx=-1.1*reach;e.arms[1].lower.rx=-.65*reach;e.paper.visible=t>.46&&t<.9;}
      if(q.bike){b.x=q.bike.x;b.z=q.bike.z;b.ry=q.bike.ry;b.rz=0;
        if(stage==='ride'||stage==='mount'||stage==='dismount'){
          const k=q.k,seated=smooth((k-.65)/.35);n.y=.04+.14*SCALE*seated;
          ridePose(e,stage==='ride'?q.distance/.70:0);e.hip.rx*=k;e.arms.forEach(a=>{a.upper.rx*=.5+.5*k;});
          if(k<1)e.legs.forEach((l,i)=>{const swing=i===(side>0?1:0),lift=Math.sin(k*Math.PI);
            l.thigh.rz=swing?side*lift*.5:0;l.thigh.rx=l.thigh.rx*seated+(swing?-.55*lift:0)*(1-seated);l.shin.rx=l.shin.rx*seated+(swing?1.0*lift:0)*(1-seated);l.foot.rx=-l.thigh.rx-l.shin.rx;});
          e.crank.rx=stage==='ride'?q.distance/.70:0;e.wheels.forEach(w=>w.rx=stage==='ride'?q.distance/(.3*SCALE):0);
        }else{e.arms[side>0?0:1].upper.rx=-.9;if(stage==='push'||stage==='turn')e.wheels.forEach(w=>w.rx=dist/(.3*SCALE));}
      }else if(L.trip&&L.steps[L.index].zone){b.x=L.trip.parking[0];b.z=L.trip.parking[1];b.ry=L.trip.parkYaw;b.rz=.12;}
      if(stage==='buy'){e.hip.rx=.08;e.arms[1].upper.rx=-.8+Math.sin(q.f*Math.PI*4)*.12;e.arms[1].lower.rx=-.65;}
      if(stage==='unlock'||stage==='lock'){e.hip.rx=.5*Math.sin(q.f*Math.PI);e.arms[1].upper.rx=-.7;}
      if(stage==='look')e.hip.ry=Math.sin(q.f*Math.PI*2)*.5;else e.hip.ry=0;
      if(L.bought){e.basketBag.visible=!!q.bike;e.bag.visible=!e.basketBag.visible;}
      /* Zu Fuß nur die Blickrichtung weich nachführen – der Standort bleibt genau auf dem geprüften Weg. */
      const pn=e.prevN;if(!q.bike&&pn&&Math.hypot(pn.x-n.x,pn.z-n.z)<3)n.ry=pn.ry+turn(pn.ry,n.ry)*Math.min(1,dt*9);
      e.prevB={x:b.x,z:b.z,ry:b.ry};e.prevN={x:n.x,z:n.z,ry:n.ry};
    }
  }
  return {attach,sync,step,tick,access,start,sample,place,pose,poseClear,stepClear,marketPlan,scale:SCALE,_world:W,_legIK:legIK};
})();
