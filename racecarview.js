"use strict";
/* v472: Drehbare Garagenansicht aus denselben Karosserie-/Radnetzen wie im Rennen.
   Nur bei Eingabe/Größenänderung zeichnen, beim Schließen alle Quellen freigeben. */
const RACECARVIEW=(()=>{
 function create(canvas,c,paint,status){
  const R=G3.create(canvas,{maxDpr:1.5,shadowSize:512,shadowBox:4});if(!R)return null;
  const meshes=[],off=[],rig=RACETRACK.rig(c);let disposed=false,raf=0,ptr=null,zoom=1;
  const mesh=b=>{const m=R.mesh(b);meshes.push(m);return m;},listen=(el,k,fn,opts)=>{el.addEventListener(k,fn,opts);off.push(()=>el.removeEventListener(k,fn,opts));};
  const root=R.node(mesh(RACETRACK.car(c,paint))),wheel=mesh(RACETRACK.wheel(c));
  for(const side of [-1,1])for(const z of rig.axles)R.addChild(root,R.node(wheel,{x:side*rig.wheelX,y:rig.wheelY,z,ry:side<0?Math.PI:0}));
  const floor=new G3.MB();floor.disc(3.15,48,0xa5a69e,{y0:-.012});floor.plate(40,40,0xe4e1d7,{y0:-.05});R.nodes.push(R.node(mesh(floor)),root);
  R.shadowK=.60; // v472: Flache Vorschau-Schatten zeigen Blechfugen ohne schwarze Flecken.
  R.env.sun=G3.norm([.55,.95,.70]);R.env.sunCol=[.66,.64,.61];R.env.sky=[.47,.49,.51];R.env.ground=[.25,.26,.27];R.env.fogR=[80,150];
  Object.assign(R.cam,{tx:0,ty:.54,tz:0,yaw:1.05,pitch:.19,fov:.56,near:.05,far:20});
  // Ausschnitt nach echten Modellpunkten: auch die Seite passt auf schmale Displays.
  const wheelCorners=[];for(const side of [-1,1])for(const z of rig.axles)for(const x of [wheel.box[0][0],wheel.box[1][0]])for(const y of [wheel.box[0][1],wheel.box[1][1]])for(const dz of [wheel.box[0][2],wheel.box[1][2]])wheelCorners.push([side*(rig.wheelX+x),rig.wheelY+y,z+dz]);
  function draw(){
   raf=0;if(disposed||R.lost())return;
   const cam=R.cam,aspect=(canvas.clientWidth||1)/(canvas.clientHeight||1),cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw),cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),tv=Math.tan(cam.fov/2)*.90,th=tv*aspect;let fit=0;
   const point=(x,y,z)=>{x-=cam.tx;y-=cam.ty;z-=cam.tz;const depth=cp*(cy*x+sy*z)+sp*y;fit=Math.max(fit,depth+Math.abs(sy*x-cy*z)/th,depth+Math.abs(cp*y-sp*(cy*x+sy*z))/tv);};
   const v=root.mesh.data;for(let i=0;i<v.length;i+=9)point(v[i],v[i+1],v[i+2]);for(const p of wheelCorners)point(...p);
   cam.dist=Math.max(4,fit)*zoom;cam.far=Math.max(20,cam.dist+6);R.render(0);
  }
  function schedule(){if(!raf&&!disposed)raf=requestAnimationFrame(draw);}
  listen(canvas,'pointerdown',e=>{if(ptr)return;ptr={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.preventDefault();});
  listen(canvas,'pointermove',e=>{if(!ptr||ptr.id!==e.pointerId)return;R.cam.yaw-=(e.clientX-ptr.x)*.012;R.cam.pitch=Math.max(.12,Math.min(1.15,R.cam.pitch+(e.clientY-ptr.y)*.007));ptr.x=e.clientX;ptr.y=e.clientY;schedule();e.preventDefault();});
  for(const k of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,k,e=>{if(ptr&&ptr.id===e.pointerId)ptr=null;});
  listen(canvas,'wheel',e=>{zoom=Math.max(.72,Math.min(1.35,zoom+e.deltaY*.001));schedule();e.preventDefault();},{passive:false});
  listen(window,'resize',schedule);listen(canvas,'webglcontextlost',e=>{e.preventDefault();if(status)status('3D-Ansicht unterbrochen. Bitte schließen und erneut öffnen.');});R.onRestore=schedule;draw();
  return {R,rig,pose(k){R.cam.yaw=k==='front'?Math.PI/2:k==='rear'?-Math.PI/2:0;R.cam.pitch=k==='side'?.12:.18;schedule();},zoom(d){zoom=Math.max(.72,Math.min(1.35,zoom+d));schedule();},destroy(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);off.forEach(fn=>fn());meshes.forEach(m=>R.free(m));R.nodes.length=0;const lose=R.gl.getExtension('WEBGL_lose_context');if(lose)lose.loseContext();}};
 }
 return {create};
})();
