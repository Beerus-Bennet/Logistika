"use strict";
/* v471: Ein einziger, erst auf Wunsch angelegter 3D-Kontext im Auktionsdialog. */
const AUCTION3D=(()=>{
 let view=null,observer=null;
 function stop(){if(observer)observer.disconnect();observer=null;if(view)view.destroy();view=null;}
 function bind(c,paint){stop();const host=document.querySelector('#auctionModel');if(!host)return;host.querySelector('button').onclick=()=>{
  stop();host.innerHTML='<canvas class="race-car-canvas" aria-label="Auto drehen und zoomen"></canvas><p>Ziehen zum Drehen · Mausrad zum Zoomen</p><div class="race-car-tools"><button data-model-pose="front">Front</button><button data-model-pose="side">Seite</button><button data-model-pose="rear">Heck</button><button data-model-zoom="-.12">+</button><button data-model-zoom=".12">−</button></div>';
  const canvas=host.querySelector('canvas'),color=parseInt((paint||'#767c83').replace('#',''),16);view=RACECARVIEW.create(canvas,c,Number.isFinite(color)?color:0x767c83);
  if(!view){host.textContent='3D-Ansicht ist hier nicht verfügbar.';return;}
  host.querySelectorAll('[data-model-pose]').forEach(b=>b.onclick=()=>view&&view.pose(b.dataset.modelPose));host.querySelectorAll('[data-model-zoom]').forEach(b=>b.onclick=()=>view&&view.zoom(+b.dataset.modelZoom));
  observer=new MutationObserver(()=>{if(!canvas.isConnected||!document.querySelector('#modal').classList.contains('open'))stop();});observer.observe(document.querySelector('#modal'),{attributes:true,attributeFilter:['class']});observer.observe(document.querySelector('#modalBody'),{childList:true});
 };}
 return {bind,stop,html:'<div id="auctionModel"><button class="btn ghost">Auto in 3D ansehen</button></div>'};
})();
