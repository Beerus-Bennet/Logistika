"use strict";
/* v469: Kurze Zielfeier als begrenzte 2D-Ebene. Keine Spielstandänderung,
   keine gesperrten Knöpfe, alle Zeichen-/Audioquellen beim Verlassen freigeben. */
const RACEFINISH=(()=>{
 function start(parent,{audio=null,seed=469}={}){
  let canvas=null,ctx=null,raf=0,active=true,w=1,h=1,first=null;
  const sources=[],listeners=[],reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const listen=(el,k,fn)=>{el.addEventListener(k,fn);listeners.push(()=>el.removeEventListener(k,fn));};
  function destroy(){if(!active)return;active=false;cancelAnimationFrame(raf);raf=0;listeners.forEach(f=>f());for(const s of sources){try{s.osc.stop();}catch(e){}s.osc.disconnect();s.gain.disconnect();}sources.length=0;if(canvas)canvas.remove();}
  // Ein heller, kurzer Zielakkord respektiert die vorhandene Toneinstellung.
  if(audio)try{
   const now=audio.currentTime;for(const [i,hz] of [523.25,659.25,783.99,1046.5].entries()){
    const osc=audio.createOscillator(),gain=audio.createGain(),at=now+i*.13;osc.type='sine';osc.frequency.value=hz;
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.025,at+.018);gain.gain.exponentialRampToValueAtTime(.0001,at+.48);
    osc.connect(gain);gain.connect(audio.destination);osc.start(at);osc.stop(at+.50);sources.push({osc,gain});
   }
  }catch(e){/* Die sichtbare Feier funktioniert auch ohne freigegebenen Ton. */}
  const stopHidden=()=>{if(document.hidden)destroy();};listen(document,'visibilitychange',stopHidden);
  if(reduced){const timer=setTimeout(destroy,1100);listeners.push(()=>clearTimeout(timer));return {destroy,get active(){return active;},canvas};}
  canvas=document.createElement('canvas');canvas.className='race-finish-fx';canvas.setAttribute('aria-hidden','true');parent.appendChild(canvas);ctx=canvas.getContext('2d');
  if(!ctx){destroy();return {destroy,get active(){return active;},canvas};}
  function resize(){w=parent.clientWidth||1;h=parent.clientHeight||1;const d=Math.min(1.5,window.devicePixelRatio||1);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}
  listen(window,'resize',resize);resize();
  let state=seed|0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return(state>>>0)/4294967296;};
  const colors=['#ffc849','#42c3a0','#2f6fed','#ff8157','#fff4cb','#b893ed'];
  const paper=Array.from({length:w<600?110:150},(_,i)=>{const side=i%2?1:-1;return {side,delay:rand()*.65,x:side<0?-.02:1.02,y:.68+rand()*.15,vx:-side*(.23+rand()*.42),vy:-.85-rand()*.55,size:4+rand()*5,spin:(rand()-.5)*12,angle:rand()*6.28,color:colors[i%colors.length]};});
  const bursts=[{x:.15,y:.17,t:.12},{x:.85,y:.27,t:.65},{x:.52,y:.09,t:1.15},{x:.12,y:.38,t:1.85},{x:.88,y:.13,t:2.45}].map((b,i)=>({...b,color:colors[i%colors.length],rays:Array.from({length:30},(_,j)=>({angle:j/30*Math.PI*2+(rand()-.5)*.1,speed:.7+rand()*.5}))}));
  function draw(now){if(!active)return;if(first===null)first=now;const t=(now-first)/1000;if(t>4.6){destroy();return;}
   ctx.clearRect(0,0,w,h);
   for(const b of bursts){const age=t-b.t;if(age<-.2||age>1.35)continue;const cx=b.x*w,cy=b.y*h,scale=Math.min(w,h)*.28;
    ctx.strokeStyle=b.color;ctx.fillStyle=b.color;ctx.lineWidth=1.5;ctx.lineCap='round';
    if(age<0){ctx.globalAlpha=.75;const y=cy-age*scale*3;ctx.beginPath();ctx.moveTo(cx,y+12);ctx.lineTo(cx,y);ctx.stroke();continue;}
    ctx.globalAlpha=Math.max(0,1-age/1.35)*.9;
    for(const r of b.rays){const a=Math.max(0,age-.065),radius=scale*r.speed*(1-Math.exp(-age*2.7)),tail=scale*r.speed*(1-Math.exp(-a*2.7));
     const x=cx+Math.cos(r.angle)*radius,y=cy+Math.sin(r.angle)*radius+age*age*45;
     ctx.beginPath();ctx.moveTo(cx+Math.cos(r.angle)*tail,cy+Math.sin(r.angle)*tail+a*a*45);ctx.lineTo(x,y);ctx.stroke();ctx.fillRect(x-1,y-1,2.5,2.5);
    }
   }
   for(const p of paper){const age=t-p.delay;if(age<0||age>4)continue;const x=(p.x+p.vx*age/(1+age*.24))*w,y=(p.y+p.vy*age+.36*age*age)*h;if(y>h+20)continue;
    ctx.globalAlpha=Math.min(1,(4-age)*1.5)*.90;ctx.save();ctx.translate(x,y);ctx.rotate(p.angle+age*p.spin);ctx.scale(1,Math.max(.25,Math.abs(Math.cos(age*4+p.angle))));ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size*.35,p.size,p.size*.7);ctx.restore();
   }
   ctx.globalAlpha=1;raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);return {destroy,get active(){return active;},canvas};
 }
 return {start};
})();
