/* v351: Schritte nach der freigegebenen Bewegung, erst nach der Kollision.
   Knie/Füße sind eigene Gelenke; Arbeit, Telefon und Werkzeughand bleiben erhalten. */
const STAFF_WALK = (() => {
  const U=.22,L=.20,H=.42,STRIDE=1.05;
  function attach(s,e){
    const R=FV.R,b=staffBody(s),child=(p,key,fn,o)=>R.addChild(p,fnode(fmesh(key,fn),o));
    const group=R.addChild(e.node,fnode(null,{}));
    const left=child(group,'walk351:arm:'+b.shirt+':'+b.skin,()=>FWM.arm(b),{x:-.19,y:.78,rz:-.08});
    const legs=[-1,1].map(side=>{
      const thigh=child(group,'walk351:thigh:'+b.pants,()=>{const m=new FM.MB();m.box(.09,U,.11,b.pants,{y:-U});return m;},{x:side*.07,y:H});
      const shin=child(thigh,'walk351:shin:'+b.pants+':'+b.boots,()=>{const m=new FM.MB();m.box(.085,L,.10,b.pants,{y:-L});if(b.boots)m.box(.098,.11,.118,b.boots,{y:-L});return m;},{y:-U});
      const foot=child(shin,'walk351:foot:'+b.boots,()=>{const m=new FM.MB();m.box(.10,.05,.17,b.boots||0x2a2a30,{z:.035});return m;},{y:-L});return {thigh,shin,foot};
    });
    e.walkRig={group,left,legs,x:e.x,z:e.z,phase:(e.ph||0)*.7,weight:0};
  }
  function reset(e,hidden=false){const r=e.walkRig;if(!r)return;r.group.visible=!hidden;r.x=e.x;r.z=e.z;r.weight=0;
    for(const l of r.legs){l.thigh.rx=l.shin.rx=l.foot.rx=0;l.thigh.y=H;}
    r.left.rx=0;
  }
  /* Ein Fuß bleibt in der Stützphase auf Bodenhöhe, der andere wird angehoben.
     Zweigliedrige IK hält die Beinlängen und die Sohlen waagerecht. */
  function footAt(leg,z,y){const d=Math.max(.025,Math.min(U+L,Math.hypot(y,z))),c=v=>Math.max(-1,Math.min(1,v));
    const a=Math.atan2(z,-y)+Math.acos(c((U*U+d*d-L*L)/(2*U*d))),k=Math.acos(c((d*d-U*U-L*L)/(2*U*L)));
    leg.thigh.rx=-a;leg.shin.rx=k;leg.foot.rx=a-k;
  }
  function step(dt,time){if(!S.farm||!FV.R)return;dt=Math.min(.1,Math.max(0,dt));
    for(const s of S.farm.staff||[]){const e=WV.staff.get(s.id),r=e&&e.walkRig;if(!r)continue;
      const blocked=e.isSit||e.sitT||e.riseT!=null||e.seatRig&&e.seatRig.active;
      if(blocked||!e.node.visible){reset(e,true);continue;}r.group.visible=true;
      const d=Math.hypot(e.x-r.x,e.z-r.z);r.x=e.x;r.z=e.z;
      /* Laden/Versetzen erzeugt keinen Riesenschritt; bloß verstrichene Zeit keinen Schritt auf der Stelle. */
      if(d>2){reset(e);continue;}
      const walking=dt>0&&d>.0005&&!e.dw&&!(e.wave!=null&&wnow()-e.wave<1.9);
      const target=walking?Math.min(1,d/dt/.6):0;r.weight+=(target-r.weight)*Math.min(1,dt*15);
      if(walking)r.phase+=Math.min(d/STRIDE*Math.PI*2,dt*Math.PI*4.4);
      if(r.weight<.002){r.weight=0;}
      const w=r.weight,phase=r.phase,hip=H-.018*w;
      r.legs.forEach((l,i)=>{const a=phase+i*Math.PI,z=Math.cos(a)*.11*w,lift=Math.max(0,Math.sin(a))*.075*w;l.thigh.y=hip;footAt(l,z,-hip+lift);});
      r.left.rx=-Math.cos(phase)*.38*w;r.left.rz=-.08;
      if(walking){e.node.y=0;const carrying=e.tool&&e.tool.visible,amplitude=carrying?.12:.38;
        if(!staffCalling(s)){e.arm.rx=Math.cos(phase)*amplitude-(carrying?.12:0);e.arm.rz=.08;}
      }else if(!e.dw&&!e.isSit){e.node.y*=Math.max(0,1-dt*12);}
    }
  }
  return {attach,step,reset,footAt,U,L,H,STRIDE};
})();
