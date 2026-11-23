"use strict";
/* v461: Fahrphysik in Metern und Sekunden, ohne DOM und ohne Spielstand.
   Kontrollpunkte zählen nur vorwärts in Reihenfolge; Zurücksetzen führt zurück. */
const RACEDRIVE=(()=>{
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),TAU=Math.PI*2,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 /* v468: Der bekannte 0–100-Wert kalibriert den Antritt, oberhalb davon
    zählt zusätzlich Leistung je kg. Kein gemeinsames 378-km/h-Limit mehr. */
 function spec(c){
  const p=RACEHANDLING.profile(c),max=clamp((c.vmax||220)/3.6,20,160);let lo=.4,hi=45;
  for(let i=0;i<32;i++){const a=(lo+hi)/2,k=.65*a/max+.012,t=-Math.log(1-k*(100/3.6)/a)/k;if(!Number.isFinite(t)||t>p.acc100)lo=a;else hi=a;}
  return {...p,max,acc:(lo+hi)/2,power:(c.ps||180)*735.5*.82/p.kg,brake:9.81*p.tyre*(c.y<1970?.87:1.04),response:12*p.agility};
 }
 function force(s,v,boost=false){const max=s.max*(boost?1.18:1),blend=clamp((v-100/3.6)/15,0,1),power=s.power;
  return {push:s.acc*(1-.65*v/max)*(1-blend)+power/Math.max(100/3.6,v)*blend,drag:v*.012*(1-blend)+power*v*v/(max*max*max)*blend};
 }
 const grip=(s,v)=>9.81*s.tyre*(1+s.aero*Math.min(1.6,(v/65)**2));
 function create(c,index=0,ai=false){const p=RACETRACK.at(RACETRACK.START-12-index*7.5,index%2?2.8:-2.8);return {car:c,x:p.x,z:p.z,h:p.heading,vx:0,vz:0,v:0,steer:0,s:p.s,i:p.i,next:0,lap:0,progress:-index/100,time:0,finish:0,km:0,wear:0,nitro:100,boost:false,drifting:false,drift:0,penalty:0,hit:0,ai,skill:1,index,spec:spec(c)};}
 function gate(a,px,pz){if(a.finish)return;const p=RACETRACK.at(RACETRACK.START+(a.next%12)*RACETRACK.length/12),dx=Math.sin(p.heading),dz=Math.cos(p.heading),before=(px-p.x)*dx+(pz-p.z)*dz,after=(a.x-p.x)*dx+(a.z-p.z)*dz;
  if(before<=0&&after>0&&Math.abs((a.x-p.x)*p.nx+(a.z-p.z)*p.nz)<RACETRACK.HALF+3&&Math.hypot(a.x-px,a.z-pz)<10){a.next++;a.lap=Math.floor((a.next-1)/12);if(a.lap>=2)a.finish=a.time+a.penalty;}
  const last=RACETRACK.START+(a.next-1)*RACETRACK.length/12,s=((a.s-last)%RACETRACK.length+RACETRACK.length)%RACETRACK.length;a.progress=a.next-1+clamp(s/(RACETRACK.length/12),0,.995);
 }
 function update(a,input,dt){if(a.finish)return;const px=a.x,pz=a.z;dt=clamp(dt,0,.025);a.time+=dt;a.hit=Math.max(0,a.hit-dt);const n=RACETRACK.near(a.x,a.z,a.i),on=n.d<RACETRACK.HALF,sp=Math.hypot(a.vx,a.vz);a.i=n.i;
  /* v469: Nitro und Drift auch im Auslauf. Beim langsamen Freifahren unter Gas
     bleibt Lenkung möglich, obwohl die Leitplanke die Vorwärtsfahrt begrenzt. */
  a.steer+=(clamp(input.steer||0,-1,1)-a.steer)*Math.min(1,dt*a.spec.response);a.drifting=!!input.drift&&sp>(on?(a.spec.drive==='A'?12:10):3);a.boost=!!input.nitro&&a.nitro>0&&input.throttle>0;
  a.nitro=clamp(a.nitro+(a.boost?-23:input.nitro?0:8)*dt,0,100);const max=a.spec.max*(a.boost?1.18:1),brake=clamp(input.brake||0,0,1),throttle=clamp(input.throttle||0,0,1);
  const turnSp=!on&&throttle>0?Math.max(sp,input.drift?7:5):sp;
  const yaw=a.steer*1.65*a.spec.agility*(turnSp/(turnSp+12))*(a.drifting?1.05+.4*a.spec.drift:1)/(1+sp/145),limit=grip(a.spec,sp)/Math.max(8,sp)*(a.drifting?1.22:1);
  a.h+=clamp(yaw,-limit,limit)*dt;
  const fx=Math.sin(a.h),fz=Math.cos(a.h),rx=fz,rz=-fx;let forward=a.vx*fx+a.vz*fz,lateral=a.vx*rx+a.vz*rz;
  const f=force(a.spec,Math.max(0,forward),a.boost);
  forward+=(throttle*f.push+(a.boost?6:0)-f.drag-brake*a.spec.brake-(on?0:Math.max(0,forward)*.20))*dt;
  if(forward>max)forward=Math.max(max,forward-16*dt);forward=Math.max(0,forward);lateral*=Math.exp(-(a.drifting?3.0-2.2*a.spec.drift:on?10*a.spec.tyre:4.5)*dt);
  a.vx=fx*forward+rx*lateral;a.vz=fz*forward+rz*lateral;a.x+=a.vx*dt;a.z+=a.vz*dt;
  const q=RACETRACK.near(a.x,a.z,a.i);a.i=q.i;a.s=q.s;
  if(q.d>RACETRACK.HALF+6.5){const dx=(a.x-q.x)/q.d,dz=(a.z-q.z)/q.d,k=a.vx*dx+a.vz*dz;a.x=q.x+dx*(RACETRACK.HALF+6.5);a.z=q.z+dz*(RACETRACK.HALF+6.5);if(k>0){a.vx-=dx*k*1.18;a.vz-=dz*k*1.18;if(a.hit<=0){a.wear+=Math.min(.12,k*.003);a.hit=.7;}}}
  a.v=Math.hypot(a.vx,a.vz);a.km+=Math.hypot(a.x-px,a.z-pz)/1000;a.wear+=a.v*dt/1000*.18+(a.boost?.004*dt:0);if(a.drifting&&Math.abs(lateral)>1)a.drift+=sp*dt;
  gate(a,px,pz);
 }
 function recover(a){if(a.finish)return;const s=RACETRACK.START+(a.next<=1?-18:(a.next-1)*RACETRACK.length/12+4),p=RACETRACK.at(s);a.x=p.x;a.z=p.z;a.h=p.heading;a.i=p.i;a.s=p.s;a.vx=a.vz=a.v=a.steer=0;a.penalty+=4;a.wear+=.025;a.boost=a.drifting=false;}
 function aiUpdate(a,dt,others){if(a.finish)return;const px=a.x,pz=a.z;let curve=0;for(const look of [14,30,55])curve=Math.max(curve,Math.abs(wrap(RACETRACK.at(a.s+look).heading-RACETRACK.at(a.s+look-12).heading))/12);
  // v468: Eigener Grip, eigener Antritt, eigenes Tempolimit; keine Spieleranpassung.
  let target=Math.min(a.spec.max*.94,Math.sqrt(grip(a.spec,a.v)*.78/Math.max(.001,curve)))*a.skill;
  for(const b of others||[])if(b!==a&&!b.finish&&Math.hypot(b.x-a.x,b.z-a.z)<9){const p=RACETRACK.at(a.s);if((b.x-a.x)*Math.sin(p.heading)+(b.z-a.z)*Math.cos(p.heading)>0&&Math.abs((b.x-a.x)*p.nx+(b.z-a.z)*p.nz)<2)target=Math.min(target,Math.max(9,b.v*.9));}
  const f=force(a.spec,a.v);a.v+=clamp(target-a.v,-a.spec.brake*dt,Math.max(0,f.push-f.drag)*dt);a.s=(a.s+a.v*dt)%RACETRACK.length;const lane=(a.index%2?2.7:-2.7)+Math.sin(a.time*.6+a.index)*.45,p=RACETRACK.at(a.s,lane);a.x=p.x;a.z=p.z;a.h=p.heading;a.i=p.i;a.time+=dt;a.km+=Math.hypot(a.x-px,a.z-pz)/1000;gate(a,px,pz);
 }
 function collide(a,others,dt){if(a.finish)return;for(const b of others){if(b===a||b.finish)continue;const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz);if(d>0&&d<2.3){const push=Math.min(.12,(2.3-d)*dt*8);a.x+=dx/d*push;a.z+=dz/d*push;a.vx*=1-dt*1.7;a.vz*=1-dt*1.7;if(a.hit<=0){a.wear+=.015;a.hit=.6;}}}}
 return {spec,create,update,aiUpdate,collide,recover,gate,wrap,force,grip};
})();
