"use strict";
/* v467: Drehbare Garagenansicht aus denselben Karosserie-/Radnetzen wie im Rennen.
   Nur bei Eingabe/Größenänderung zeichnen, beim Schließen alle Quellen freigeben. */
const RACECARVIEW=(()=>{
 function create(canvas,c,paint,status){
  const R=G3.create(canvas,{maxDpr:1.5,shadowSize:256,shadowBox:6});if(!R)return null;
  const meshes=[],off=[],rig=RACETRACK.rig(c);let disposed=false,raf=0,ptr=null,zoom=1;
  const mesh=b=>{const m=R.mesh(b);meshes.push(m);return m;},listen=(el,k,fn,opts)=>{el.addEventListener(k,fn,opts);off.push(()=>el.removeEventListener(k,fn,opts));};
  const root=R.node(mesh(RACETRACK.car(c,paint))),wheel=mesh(RACETRACK.wheel(c));
  for(const side of [-1,1])for(const z of rig.axles)R.addChild(root,R.node(wheel,{x:side*rig.wheelX,y:rig.wheelY,z,ry:side<0?Math.PI:0}));
  const floor=new G3.MB();floor.disc(3.15,48,0xc7c5af,{y0:-.012});floor.plate(40,40,0xe8e5d9,{y0:-.05});R.nodes.push(R.node(mesh(floor)),root);
  R.env.sun=G3.norm([.6,.9,.45]);R.env.sunCol=[.82,.81,.77];R.env.sky=[.55,.64,.72];R.env.ground=[.30,.29,.27];R.env.fogR=[80,150];
  Object.assign(R.cam,{tx:0,ty:.55,tz:0,yaw:1.05,pitch:.30,fov:.56,near:.05,far:100});
  function draw(){raf=0;if(disposed||R.lost())return;const aspect=(canvas.clientWidth||1)/(canvas.clientHeight||1);R.cam.dist=7.3*Math.max(1,1.20/aspect)*zoom;R.render(0);}
  function schedule(){if(!raf&&!disposed)raf=requestAnimationFrame(draw);}
  listen(canvas,'pointerdown',e=>{if(ptr)return;ptr={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.preventDefault();});
  listen(canvas,'pointermove',e=>{if(!ptr||ptr.id!==e.pointerId)return;R.cam.yaw-=(e.clientX-ptr.x)*.012;R.cam.pitch=Math.max(.12,Math.min(1.15,R.cam.pitch+(e.clientY-ptr.y)*.007));ptr.x=e.clientX;ptr.y=e.clientY;schedule();e.preventDefault();});
  for(const k of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,k,e=>{if(ptr&&ptr.id===e.pointerId)ptr=null;});
  listen(canvas,'wheel',e=>{zoom=Math.max(.72,Math.min(1.35,zoom+e.deltaY*.001));schedule();e.preventDefault();},{passive:false});
  listen(window,'resize',schedule);listen(canvas,'webglcontextlost',e=>{e.preventDefault();if(status)status('3D-Ansicht unterbrochen. Bitte schließen und erneut öffnen.');});R.onRestore=schedule;draw();
  return {R,rig,pose(k){R.cam.yaw=k==='front'?Math.PI/2:k==='rear'?-Math.PI/2:0;R.cam.pitch=k==='side'?.18:.27;schedule();},zoom(d){zoom=Math.max(.72,Math.min(1.35,zoom+d));schedule();},destroy(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);off.forEach(fn=>fn());meshes.forEach(m=>R.free(m));R.nodes.length=0;const lose=R.gl.getExtension('WEBGL_lose_context');if(lose)lose.loseContext();}};
 }
 return {create};
})();
