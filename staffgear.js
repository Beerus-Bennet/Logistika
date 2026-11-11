/* v351: Eigene Fächer, sichtbare Übergabe und Rücknahme derselben Werkzeuge.
   Keine Inventarbuchung: dies ist die Darstellung der bestehenden Mittagspause. */
const STAFF_GEAR = (() => {
  const cache=new Map(),ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function matrix(n){return G3.trs(G3.ID(),n.x||0,n.y||0,n.z||0,n.rx||0,n.ry||0,n.rz||0,n.sx||n.s||1,n.sy||n.s||1,n.sz||n.s||1);}
  function world(n){const m=matrix(n);return n.parent?G3.mul(G3.ID(),world(n.parent),m):m;}
  function decompose(m){const s=Math.hypot(m[0],m[1],m[2]);return {x:m[12],y:m[13],z:m[14],rx:Math.asin(Math.max(-1,Math.min(1,-m[9]/s))),ry:Math.atan2(m[8],m[10]),rz:Math.atan2(m[1],m[5]),s};}
  function fit(s){if(cache.has(s.role))return cache.get(s.role);const T=staffTool(s.role);if(!T)return null;
    const b=T.grip?staffGrip(s.role)||T.fn():T.fn(),scale=T.s*1.45,long=['holzfaeller','fischer'].includes(s.role);let best=null;
    for(const rx of [0,Math.PI/2,-Math.PI/2,Math.PI])for(const ry of [0,Math.PI/2])for(const rz of [0,Math.PI/2,-Math.PI/2]){
      const m=G3.trs(G3.ID(),0,0,0,rx,ry,rz,scale,scale,scale),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
      for(let i=0;i<b.v.length;i+=9){const p=[b.v[i],b.v[i+1],b.v[i+2]];for(let k=0;k<3;k++){const v=m[k]*p[0]+m[4+k]*p[1]+m[8+k]*p[2];lo[k]=Math.min(lo[k],v);hi[k]=Math.max(hi[k],v);}}
      const size=hi.map((n,i)=>n-lo[i]),score=Math.max(0,size[0]-.76)*20+Math.max(0,size[2]-.48)*25+(long?-size[1]:size[1])+.01*(Math.abs(rx)+Math.abs(rz));
      if(!best||score<best.score)best={rx,ry,rz,s:scale,lo,hi,score};
    }cache.set(s.role,best);return best;
  }
  function parking(s,e){const sl=CAMP.slotOf(s.id),f=fit(s);if(!sl||!f)return null;const T=CAMP.toolSpot(sl),a=CAMP.RY,c=Math.cos(a),sn=Math.sin(a),ox=-(f.lo[0]+f.hi[0])/2,oz=(['holzfaeller','fischer'].includes(s.role)?.18:-.05)-(f.lo[2]+f.hi[2])/2;
    return {x:T.x+c*ox+sn*oz,z:T.z-sn*ox+c*oz,y:(['holzfaeller','fischer'].includes(s.role)?.16:.58)-f.lo[1],rx:f.rx,ry:a+f.ry,rz:f.rz,s:f.s};
  }
  const put=(n,p)=>{for(const k of ['x','y','z','rx','ry','rz'])n[k]=p[k];n.sx=n.sy=n.sz=p.s;};
  function retime(s,j,t0){const delta=t0-j.t0;j.t0=t0;j.t1+=delta;if(s.jobEnd!=null)s.jobEnd+=delta;}
  /* Die Übergabe dauert auch bei schneller Spieluhr sichtbar 1,8 s.
     Bei Rückstau beginnt sie erst, wenn die Kraft vor ihrem Fach steht. */
  function prepare(s,e,dt,gdt){const j=s.job;if(!j||!j.route||!j.stops)return;
    let before=0;const total=(j.len||routeLen(j.route))+j.stops.reduce((n,st)=>n+st.w,0),rate=j.walk/total;
    for(const st of j.stops){const start=(st.d+before)*rate;before+=st.w;if(!st.rack351||st.done351||S.time-j.t0<start-.0001)continue;
      let a=e.gearAction;if(!a||a.job!==j||a.stop!==st)a=e.gearAction={job:j,stop:st,t:0,hand:null};
      const at=j.route[st.i],near=at&&Math.hypot(e.x-at[0],e.z-at[1])<.18;
      if(near&&(gdt>0||typeof clockRunning!=='function'||clockRunning()))a.t+=Math.min(dt,.1);
      const p=Math.min(1,a.t/1.8);retime(s,j,S.time-start-st.w*rate*p);
      if(p>=1){st.done351=true;retime(s,j,j.t0-.0001);e.gearAction=null;}
      return;
    }
  }
  function handPose(e,target,reach){const r=e.walkRig;if(!r)return;
    if(!r.fore){const b=staffBody((S.farm.staff||[]).find(s=>WV.staff.get(s.id)===e));r.upper=fmesh('gear351:upper:'+b.shirt,()=>{const m=new FM.MB();m.box(.07,.19,.08,b.shirt,{y:-.19});return m;});r.fore=FV.R.addChild(e.arm,fnode(fmesh('gear351:fore:'+b.shirt+':'+b.skin,()=>{const m=new FM.MB();m.box(.065,.21,.075,b.shirt,{y:-.21});m.box(.062,.065,.072,b.skin,{y:-.25});return m;}),{y:-.19,visible:false}));}
    e.arm.mesh=r.upper;r.fore.visible=true;
    const n=e.node,dx=target.x-n.x,dz=target.z-n.z,c=Math.cos(n.ry),sn=Math.sin(n.ry),x=(c*dx-sn*dz)/1.45-.19,z=(sn*dx+c*dz)/1.45,y=(target.y-n.y)/1.45-.78,d=Math.max(.025,Math.min(.399,Math.hypot(x,y,z))),cl=v=>Math.max(-1,Math.min(1,v));
    const bend=Math.acos(cl((d*d-.19*.19-.21*.21)/(2*.19*.21))),angle=Math.atan2(Math.hypot(x,z),-y)-Math.acos(cl((.19*.19+d*d-.21*.21)/(2*.19*d)));
    e.arm.ry=Math.atan2(x,z);e.arm.rx=-angle;e.arm.rz=0;r.fore.rx=-bend;r.left.rx=-.35*reach;
  }
  function restore(e){const r=e.walkRig;if(r&&r.fore&&r.fore.visible){r.fore.visible=false;e.arm.mesh=e.armM;e.arm.ry=0;e.arm.rx=-.12;e.arm.rz=.08;}}
  function step(dt,time){for(const s of S.farm.staff||[]){const e=WV.staff.get(s.id);if(!e||!e.gt||!e.tool)continue;const park=parking(s,e);if(!park)continue;
      e.gt.mesh=e.tool.mesh;const a=e.gearAction,tg=staffToolSpot(s,e),off=!e.node.visible;
      if(a&&a.job===s.job){const p=Math.min(1,a.t/1.8),k=ease((p-.12)/.68),drop=a.stop.kind==='drop';
        if(!a.hand){restore(e);a.hand=decompose(world(e.tool));}const t=drop?k:1-k,out={s:park.s};
        for(const key of ['x','y','z'])out[key]=a.hand[key]+(park[key]-a.hand[key])*t;
        for(const key of ['rx','ry','rz'])out[key]=a.hand[key]+angTo(a.hand[key],park[key])*t;
        put(e.gt,out);e.gt.visible=!off;e.tool.visible=false;handPose(e,out,Math.sin(p*Math.PI));
      }else{restore(e);put(e.gt,park);e.gt.visible=!off&&!!(tg&&tg.ground);e.tool.visible=!off&&!e.isSit&&!e.sitT&&e.riseT==null&&!staffCalling(s)&&!e.gt.visible;}
    }
  }
  return {prepare,step,parking,fit,restore,world};
})();
