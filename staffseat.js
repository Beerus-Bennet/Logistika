/* v349: Durchgehende Gelenkpose statt Wechsel zwischen Steh-/Sitzmodell.
   Die Knie falten sich bei festen Gliedlängen; Sohlen bleiben auf dem Kies. */
const STAFF_SEAT = (() => {
  const U=.25,L=.34,ANKLE=.027;
  const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function create(s,e){
    if(e.seatRig)return e.seatRig;
    const R=FV.R,body=staffBody(s),add=(parent,key,make,props)=>R.addChild(parent,fnode(fmesh(key,make),props));
    const torso=add(e.node,'seat349:body:'+e.key,()=>{const b=new FM.MB();b.merge(FWM.person(Object.assign({},body,{noLegs:true,noHead:true,noArms:true})),{y:-.42});return b;},{y:.42,visible:false});
    const upperMesh=()=>{const b=new FM.MB();b.box(.07,.34,.08,body.shirt,{y:-.34});return b;};
    const upper=fmesh('seat349:upper:'+body.shirt,upperMesh);
    const left=R.addChild(e.node,fnode(upper,{x:-.19,y:.78,visible:false}));
    const fore=parent=>add(parent,'seat349:fore:'+body.shirt+':'+body.skin,()=>{const b=new FM.MB();b.box(.066,.23,.072,body.shirt,{y:-.23});b.box(.065,.065,.072,body.skin,{y:-.27,z:.01});return b;},{y:-.34,visible:false});
    const arms=[{upper:left,fore:fore(left)},{upper:e.arm,fore:fore(e.arm)}];
    const legs=[-1,1].map(side=>{
      const thigh=add(e.node,'seat349:thigh:'+body.pants,()=>{const b=new FM.MB();b.box(.09,U,.11,body.pants,{y:-U});return b;},{x:side*.07,visible:false});
      const shin=add(thigh,'seat349:shin:'+body.pants+':'+body.boots,()=>{const b=new FM.MB();b.box(.09,L,.105,body.pants,{y:-L});if(body.boots)b.box(.098,.11,.118,body.boots,{y:-L});return b;},{y:-U});
      const foot=add(shin,'seat349:foot:'+body.boots,()=>{const b=new FM.MB();b.box(.10,.05,.17,body.boots||0x2a2a30,{y:-ANKLE,z:.04});return b;},{y:-L});return {thigh,shin,foot};
    });
    return e.seatRig={torso,arms,legs,upper,active:false};
  }
  function pose(e,k,lean=0,gesture=0){
    const r=e.seatRig,angle=k*Math.PI/2;r.k=k;
    r.torso.rx=lean;
    for(const leg of r.legs){leg.thigh.y=L+ANKLE+U*Math.cos(angle);leg.thigh.rx=-angle;leg.shin.rx=angle;}
    r.arms.forEach((a,i)=>{a.upper.y=.42+.36*Math.cos(lean);a.upper.z=.36*Math.sin(lean);a.upper.rx=lean-.08*k+(i?gesture:0);a.upper.rz=(i?1:-1)*(.08-.04*k);a.fore.rx=-Math.PI/2*k;});
    e.head.y=.42+.38*Math.cos(lean);e.head.z=.38*Math.sin(lean);e.node.rx=0;
  }
  function activate(s,e){const r=create(s,e);if(r.active)return;r.active=true;e.mStand=e.node.mesh;e.node.mesh=null;r.torso.visible=true;r.arms[0].upper.visible=true;e.arm.mesh=r.upper;r.arms.forEach(a=>a.fore.visible=true);r.legs.forEach(l=>l.thigh.visible=true);e.head.visible=true;pose(e,0);}
  function deactivate(e){const r=e.seatRig;if(!r||!r.active)return;r.active=false;r.torso.visible=r.arms[0].upper.visible=false;r.arms.forEach(a=>a.fore.visible=false);r.legs.forEach(l=>l.thigh.visible=false);e.node.mesh=e.mStand;e.arm.mesh=e.armM;e.arm.rx=0;e.arm.rz=.08;e.arm.y=.78;e.arm.z=0;e.head.visible=false;e.head.y=.8;e.head.z=0;e.node.y=e.node.rx=0;}
  function down(s,e,sl,dt){
    const n=e.node,P=CAMP.pose(sl),st=CAMP.toW(...CAMP.standPt(sl));e.riseT=null;
    if(!e.sitT){
      if(Math.hypot(e.x-st[0],e.z-st[1])>.25){
        const moved=s.job&&s.job.route?staffFollow(e,s.job,routeLen(s.job.route),dt):null;
        const d=Math.hypot(e.x-st[0],e.z-st[1]);if(moved==null&&d<1.2){const k=Math.min(1,2*dt/d);e.x+=(st[0]-e.x)*k;e.z+=(st[1]-e.z)*k;}
        n.x=e.x;n.z=e.z;return true;
      }
      activate(s,e);e.seatStart={x:e.x,z:e.z,ry:n.ry};e.sitT=.00001;
    }
    e.sitT+=Math.min(dt,.1);const t=e.sitT,start=e.seatStart,back=ease((t-.4)/.65),fold=ease((t-1.0)/.95);
    e.x=n.x=start.x+(sl.x-start.x)*back;e.z=n.z=start.z+(sl.z-start.z)*back;n.ry=start.ry+angTo(start.ry,sl.ry+P.turn)*ease(t/.5);n.y=CAMP.SIT_Y*fold;
    pose(e,fold,.16*Math.sin(Math.PI*fold)+P.lean*fold);if(e.tool)e.tool.visible=false;e.head.visible=true;e.head.rx=.05*fold;e.head.ry=e.head.rz=0;
    if(t<1.95)return true;e.sitT=0;e.isSit=true;pose(e,1,P.lean);return false;
  }
  function idle(e,sl,dt,time,G){const n=e.node,P=CAMP.pose(sl);e.x=n.x=sl.x;e.z=n.z=sl.z;n.ry+=angTo(n.ry,sl.ry+P.turn)*Math.min(1,dt*6);n.y=CAMP.SIT_Y;
    pose(e,1,P.lean,-G.ges*.18);e.head.visible=true;e.head.ry=G.yaw+G.shk;e.head.rx=P.lean+G.pit+G.nod;e.head.rz=G.roll;
  }
  function up(s,e,dt){
    if(!e.seatRig||!e.seatRig.active)return false;
    if(e.riseT==null)e.risePose=e.seatRig.k||0;
    e.sitT=0;e.riseT=(e.riseT==null?0:e.riseT)+Math.min(dt,.1);const t=e.riseT,unfold=ease((t-.25)/.9),sl=CAMP.slotOf(s.id);
    if(!e.riseStart)e.riseStart={x:e.x,z:e.z};const st=sl?CAMP.toW(...CAMP.standPt(sl)):[e.x,e.z],step=ease((t-1.2)/.5);
    e.x=e.node.x=e.riseStart.x+(st[0]-e.riseStart.x)*step;e.z=e.node.z=e.riseStart.z+(st[1]-e.riseStart.z)*step;
    pose(e,e.risePose*(1-unfold),.18*Math.sin(Math.PI*unfold));e.node.y=CAMP.SIT_Y*(1-unfold);if(e.tool)e.tool.visible=false;
    if(t<1.7)return true;deactivate(e);e.isSit=false;e.riseT=null;e.riseStart=null;e.seatStart=null;return false;
  }
  return {down,idle,up,pose,U,L,ANKLE};
})();
