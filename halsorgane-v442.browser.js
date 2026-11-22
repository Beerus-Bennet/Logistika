/* v442: Halsorgane und gemeinsame 3D-Vorschauen im Touch-Viewport. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-v442';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await b.newContext({viewport:{width:390,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto((process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8014')+'/?test=1');await p.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:1e7,time:21.6*60,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.tut.done=true;S.farm.snd=false;S.farm.areas={wald:true,see:true,saege:true,altwald:true};
  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=true;farmDOM();syncHeadH();FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:256,maxDpr:1});HUNT._v200.st().built=1;HUNT.begin();HUNT.X.mode='hold';HUNT.X.inRv=true;HUNT.X.spawnT=1e9;HUNT.X.flyT=1e9;HUNT.step(.01,0);FV.R.render(0);VISTA.draw(FV.R,0);
 });


 for(const k of ['hirsch','keiler','fasan']){
  await p.evaluate(k=>{
   FV.on=false;const A=HUNT._spawn(k,false,{score:.3,g:12,vr:0,x:HUNT.FC.x,z:HUNT.FC.z}),pose={nrx:k==='hirsch'?2.2:k==='keiler'?-.55:.4,nry:0,hrx:0,legs:[]};
   // Ein wirklicher Querschuss an der Halsmitte für die bedienbare Ansicht.
   const O=HUNT.NORG[k].find(o=>o.id==='luftroehre'),F=HUNT._neckFrame(k,.65),q=HUNT.rot(F.c.map((v,a)=>v+F.V[a]*O.off*F.hF),pose.nrx,0,0).map((v,a)=>v+HUNT.SP[k].neckP[a]);
   A.shots=[{anatomy367:true,anatomy442:true,zone:'hals',lo:[3,q[1],q[2]],ld:[-1,0,0],t:2.8,dm:74,dmg:100,v:750,e:3300,tf:.1,stop:5,org:[],pose}];
   A.shots[0].org=HUNT._xrShot(k,A.shots[0]).org;HUNT.X.hrv={A};HUNT._xray();window.neckA=A;
  },k);await p.waitForTimeout(300);
  const count=await p.locator('.xr-organ-model img').count();assert.ok(count>0,k+': echte Modellvorschauen');
  await p.locator('.xr-organ-model img').evaluateAll(imgs=>Promise.all(imgs.map(im=>im.decode())));
  for(const yaw of [.1,Math.PI+.1]){
   await p.evaluate(y=>{HUNT._xr().yaw=y;HUNT._xr().zoom=.8;},yaw);await p.waitForTimeout(150);
   await p.screenshot({path:out+'/'+k+'-'+(yaw<1?'rechts':'links')+'.png'});
  }
  // Modellgalerie: Halsorgane mit exakt ihren Körpergeometrien.
  // Nur in diesem Prüfstand, im Spiel weiterhin ausschließlich getroffene Organe.
  await p.evaluate(()=>{
   const A=neckA,sh=Object.assign({},A.shots[0],{org:[...HUNT.ORG[A.k],...HUNT.NORG[A.k]]});
   HUNT._xrBuild(HUNT._xr().R,A,sh);HUNT._xr().yaw=.1;HUNT._xr().zoom=.8;
   const gallery=document.createElement('div');gallery.id='neck-gallery';gallery.style='position:fixed;z-index:99999;bottom:0;left:0;right:0;background:#152434;padding:8px;display:flex;gap:6px;flex-wrap:wrap';
   gallery.innerHTML=HUNT.NORG[A.k].map(O=>'<div style="width:86px;color:white;font:10px sans-serif;text-align:center">'+thumbSpan('neck442:'+A.k+':'+O.id,()=>HUNT._neckPreview(A.k,O),'',false,{yaw:.85,pitch:.18,noShadow:true})+'<br>'+HUNT._organName(O)+'</div>').join('');document.body.append(gallery);gallery.querySelectorAll('.ic').forEach(el=>el.style='display:block;width:72px;height:72px');thumbFill();
  });await p.waitForFunction(()=>!document.querySelector('#neck-gallery [data-th]'));assert.equal(await p.locator('#neck-gallery img').count(),k==='fasan'?5:7);await p.locator('#neck-gallery img').evaluateAll(imgs=>{imgs.forEach(im=>im.style='width:100%;height:100%;object-fit:contain');return Promise.all(imgs.map(im=>im.decode()));});await p.screenshot({path:out+'/'+k+'-uebersicht.png'});
  await p.evaluate(()=>document.getElementById('neck-gallery').remove());
 }
 assert.deepEqual(errors,[]);console.log('OK v442: 3 Arten, beidseitiges Trefferbild und geladene echte Halsorgan-Vorschauen; keine JavaScriptfehler.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
