/* v346: Gemeinsamer Bewegungsraum für Hofarbeiter, Bewohner und Fahrräder.
   Körper als Kreise, Räder als Kette von Kreisen; relative Bewegungen werden
   über das gesamte Bild geprüft, nicht nur an ihren Endpunkten. */
const PEOPLE_TRAFFIC = (() => {
  let history = new Map(), renderer = null, farm = null, lastTime = null;
  const gap = .035;
  const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
  function swept(a,b,c,d) {
    const x=a.x-c.x,z=a.z-c.z,vx=b.x-a.x-d.x+c.x,vz=b.z-a.z-d.z+c.z;
    const vv=vx*vx+vz*vz,t=vv?Math.max(0,Math.min(1,-(x*vx+z*vz)/vv)):0;
    return Math.hypot(x+vx*t,z+vz*t);
  }
  const at = (a,p) => a.parts.map(q=>({x:p.x+q.x,z:p.z+q.z,r:q.r}));
  function free(a,from,to,others) {
    if(a.valid&&!a.valid(from,to))return false;
    const A=at(a,from),B=at(a,to);
    return others.every(o=>{
      if(o===a||o.owner===a.id||a.owner===o.id)return true;
      /* v388: Hofkräfte weichen einander nicht mehr aus. Sie folgen fest ihrer Route (staffFollow setzt sie jedes Bild auf den
         Weg zurück); ein seitlicher Ausweichschritt wurde im nächsten Bild zurückgenommen und wieder versucht – das „wilde Hin und Her“
         (gemessen bis 69 Richtungswechsel je Kraft nach Pausenende, in der nur eine Person breiten Werkzeuggasse und auf schmalen Wegen,
         die Uhr ihres Wegs stand dabei still). Kollegen gehen jetzt Schulter an Schulter aneinander vorbei; gegenüber Bewohnern und
         Rädern gilt die Kollision unverändert. */
      if(a.staff&&o.staff)return true;
      const C=at(o,o.from),D=at(o,o.to||o.from);
      return A.every((p,i)=>C.every((q,j)=>swept(p,B[i],q,D[j])>=p.r+q.r+gap-1e-6));
    });
  }
  function solve(actors,dt) {
    /* Stabile Reihenfolge statt wechselndem gegenseitigem Ausweichen. */
    actors.sort((a,b)=>a.id.localeCompare(b.id));
    const moving=actors.filter(a=>!a.fixed);
    for(const a of moving){
      let from=a.from,dx=a.want.x-from.x,dz=a.want.z-from.z,d=Math.hypot(dx,dz);
      /* Alte Spielstände dürfen bereits überlappende Standorte enthalten. Nur
         an einen freien, baulich erreichbaren Nachbarpunkt versetzen. */
      if(!a.rail&&!free(a,from,from,actors)){
        let found=null;
        for(let r=.25;r<=3&&!found;r+=.25)for(let i=0;i<16;i++){
          const t=i*Math.PI/8,p={x:from.x+Math.cos(t)*r,z:from.z+Math.sin(t)*r};
          if(free(a,p,p,actors)&&(!a.valid||a.valid(from,p))){found=p;break;}
        }
        if(found){a.from=from=found;dx=a.want.x-from.x;dz=a.want.z-from.z;d=Math.hypot(dx,dz);}
      }
      /* v354: Bewohner bleiben auf ihrem geprüften Weg („Schiene“): Zielpunkt frei → vorrücken,
         sonst an Ort und Stelle warten. Kein seitliches Ausweichen quer durch Zaun, Tresen oder Hauswand. */
      if(a.rail){const ok=free(a,a.want,a.want,actors);a.used=!ok&&a.pass&&free(a,a.want,a.want,actors.filter(o=>!o.rail));
        a.to=ok||a.used?a.want:from;a.delayed=a.to===from&&d>.003;continue;}
      const limit=Math.max(.025,dt*12),k=d?Math.min(1,limit/d):0;
      let to={x:from.x+dx*k,z:from.z+dz*k};
      if(a.avoid&&a.avoid.left>0){
        const step=Math.min(limit,a.avoid.left),p={x:from.x+a.avoid.x*step,z:from.z+a.avoid.z*step};
        if(free(a,from,p,actors)){to=p;a.avoid.left-=step;}else a.avoid=null;
      }
      if(!free(a,from,to,actors)){
        /* Erst bremsen, dann rechts/links vorbeigehen. Dieselbe Vorzugsseite
           bleibt während einer Begegnung erhalten, damit niemand pendelt. */
        to=from;
        if(d>.001){const ux=dx/d,uz=dz/d,side=a.side||1,step=Math.min(limit,.22);
          for(const advance of [.25,0,-.2]){for(const s of [side,-side]){
            const p={x:from.x+(ux*advance+uz*s)*step,z:from.z+(uz*advance-ux*s)*step};
            if(free(a,from,p,actors)){to=p;a.side=s;a.avoid={x:uz*s,z:-ux*s,left:1.8};break;}
          }if(to!==from)break;}
          if(to===from)for(const f of [.75,.5,.25]){
            const p={x:from.x+dx*k*f,z:from.z+dz*k*f};if(free(a,from,p,actors)){to=p;break;}
          }
        }
      }
      a.to=to;a.delayed=distance(to,a.want)>.25;
    }
    return actors;
  }
  function step(dt) {
    if(typeof FV==='undefined'||!FV.R)return;
    if(renderer!==FV.R||farm!==S.farm){history.clear();renderer=FV.R;farm=S.farm;lastTime=null;}
    const gdt=lastTime==null?0:Math.max(0,S.time-lastTime);lastTime=S.time;
    const actors=[];
    const valid=(a,b)=>typeof VILLAGE_SITE==='undefined'||VILLAGE_SITE.clearLine([a.x,a.z],[b.x,b.z]);
    const add=(id,node,parts,apply,extra={})=>{
      if(!node||!node.visible)return;
      let old=history.get(id);if(old&&(old.node!==node||extra.snap))old=null;
      const want=extra.resting&&old?old.pos:{x:node.x,z:node.z};
      actors.push({id,node,from:extra.fixed?want:old?old.pos:want,want,parts,apply,side:old&&old.side,avoid:old&&old.avoid,valid,...extra});
    };
    if(typeof WV!=='undefined')for(const [id,e]of WV.staff){
      const s=(S.farm.staff||[]).find(s=>s.id===id);if(!s)continue;
      /* v480: Wer seiner Route folgt, darf auf sie gesetzt werden: bei schnellem Tempo, nach großem Rückstand oder wenn es sechs Sekunden
         nicht weitergeht. Vorher zog ihn die Geschwindigkeitsgrenze geradeaus zum Ziel – an Gehegen und Gebäuden blieb er hängen. */
      const was=history.get('staff:'+id),gapR=was?distance(was.pos,e.node):0,snap=!!(s.job&&e.rj===s.job&&gapR>.001&&(S.speed>3||gapR>4||e.stuckAt&&wnow()-e.stuckAt>6));
      add('staff:'+id,e.node,[{x:0,z:0,r:.39}],(p,delayed)=>{
        /* v351: Der Routenzeiger folgt der wirklich freigegebenen Strecke,
           nicht einem vom Zaun oder Gegenverkehr verworfenen Schritt. */
        const j=s.job,from=ahead.get('staff:'+id),dx=e.node.x-from.x,dz=e.node.z-from.z,l2=dx*dx+dz*dz;
        if(j&&e.rj===j&&e.rPrev!=null&&distance(p,e.node)>.001){const f=l2?Math.max(0,Math.min(1,((p.x-from.x)*dx+(p.z-from.z)*dz)/l2)):0;e.rs=e.rPrev+(e.rs-e.rPrev)*f;}
        e.x=e.node.x=p.x;e.z=e.node.z=p.z;e.ox=e.oz=0;e.stuckAt=delayed?e.stuckAt||wnow():0;
        if(delayed){e.mv=false;if(j&&j.route&&S.time-j.t0<j.walk&&gdt){j.t0+=gdt;j.t1+=gdt;if(s.jobEnd)s.jobEnd+=gdt;}}
      },{staff:true,snap,fixed:!!e.isSit||!!e.sitT||e.riseT!=null||!!(e.gearAction&&e.gearAction.t>0),resting:!s.job,valid:(a,b)=>{
        if(typeof VILLAGE!=='undefined'&&(VILLAGE.clear(a.x,a.z)||VILLAGE.clear(b.x,b.z))&&!valid(a,b))return false;
        if(typeof navLive!=='function'||distance(a,b)<.001)return true;
        navLive();if(navHit(a.x,a.z,b.x,b.z,navWallsFor(s.role)))return false;
        if(navBlockedAt(a.x,a.z))return true; /* v480: Wer schon im Gesperrten steht (Gehege darüber gebaut, alter Spielstand), darf hinaus. */
        /* v351: Auch der Rückweg nutzt die ausdrücklich geplanten Camp-Wege.
           Die A*-Sperre des ganzen Platzes darf den Ausgang nicht verriegeln. */
        const n=Math.max(1,Math.ceil(distance(a,b)/.2));
        for(let i=1;i<=n;i++){const x=Math.floor(a.x+(b.x-a.x)*i/n),z=Math.floor(a.z+(b.z-a.z)*i/n);
          if(typeof CAMP!=='undefined'&&s.job&&s.job.route&&CAMP.blockedW(x+.5,z+.5))continue;
          if(navIn(x,z)){const k=NAV.blk[navIdx(x,z)];if(k&&!(k===2&&s.role==='farmer'))return false;}}
        return true;
      }});
    }
    if(typeof VILLAGE_PEOPLE!=='undefined')for(const [id,e]of VILLAGE_PEOPLE._world.actors){
      const h=VILLAGE.home(id),L=h&&h.life&&h.life.active,n=e.node,b=e.bike,kind=L&&L.steps[L.index].kind;
      const attached=n.visible&&L&&['push','look','mount','ride','dismount'].includes(kind);
      const riding=kind==='ride',bikeParts=()=>[-.95,-.48,0,.48,.95].map(z=>({x:Math.sin(b.ry)*z,z:Math.cos(b.ry)*z,r:riding?.2:.25}));
      /* v354: Im Sattel zählt die schmale Silhouette – zwei Radler passen auf ihren Spuren aneinander vorbei. */
      const parts=[{x:0,z:0,r:riding?.26:.39}];
      if(attached)for(const q of bikeParts())parts.push({x:b.x-n.x+q.x,z:b.z-n.z+q.z,r:q.r});
      const old=history.get('resident:'+id),stuck=old&&old.node===n&&old.stuck||0;
      add('resident:'+id,n,parts,(p,delayed)=>{
        const dx=p.x-n.x,dz=p.z-n.z;n.x=p.x;n.z=p.z;
        if(attached){b.x+=dx;b.z+=dz;e.prevB={x:b.x,z:b.z,ry:b.ry};}
        e.prevN={x:p.x,z:p.z,ry:n.ry};
        if(L)L.trafficWait=!!delayed;
        if(delayed&&['walk','push'].includes(kind)){
          for(const l of e.legs){l.thigh.rx=l.shin.rx=l.foot.rx=0;}
        }
      },{rail:true,valid:null,stuck,pass:stuck>8});
      if(b.visible&&!attached)add('bike:'+id,b,bikeParts(),()=>{},{fixed:true,owner:'resident:'+id});
    }
    const ahead=new Map(actors.map(a=>[a.id,{...a.from}]));
    solve(actors,Math.min(.1,Math.max(0,dt)));
    const next=new Map();
    /* v354: stuck – Sekunden ohne Vorankommen. Stehen sich zwei Bewohner länger als 8 s gegenüber,
       darf einer am anderen Bewohner vorbei (nie an Bauten, Arbeitern oder abgestellten Rädern). */
    for(const a of actors){const p=a.to||a.from;a.apply(p,a.delayed);next.set(a.id,{pos:p,node:a.node,side:a.side,avoid:a.avoid,stuck:a.rail&&(a.delayed||a.used)?(a.stuck||0)+dt:0});}
    history=next;
  }
  return {step,solve,swept,reset(){history.clear();renderer=null;lastTime=null;}};
})();
