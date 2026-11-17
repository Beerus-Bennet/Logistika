/* v366: Reale Fallgelenke, touchbedienbare Jagdaufträge und weltfeste Wolken. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-v366';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await b.newContext({viewport:{width:390,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8000/?test=1');await p.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:1e7,time:21.6*60,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.tut.done=true;S.farm.snd=false;S.farm.areas={wald:true,see:true,saege:true,altwald:true};
  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=true;farmDOM();syncHeadH();FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:256,maxDpr:1});HUNT._v200.st().built=1;HUNT.begin();HUNT.X.mode='hold';HUNT.X.inRv=true;HUNT.X.spawnT=1e9;HUNT.X.flyT=1e9;HUNT.step(.01,0);FV.R.render(0);VISTA.draw(FV.R,0);
 });
 assert.equal(await p.locator('[data-hu=quality],.hu-quality').count(),0);const details=p.locator('.hu-job');assert.equal(await details.evaluate(e=>e.open),false);assert.equal(await p.locator('.hu-job-row').count(),3);
 const under=await details.evaluate(e=>({y:e.getBoundingClientRect().top,head:e.parentElement.querySelector('.hu-top').getBoundingClientRect().bottom}));assert.ok(under.y>=under.head+6);
 await p.screenshot({path:out+'/jobs-closed.png'});await details.locator('summary').tap();assert.equal(await details.evaluate(e=>e.open),true);
 const saved=await p.evaluate(()=>({th:HUNT.X.th,ph:HUNT.X.ph,node:document.querySelector('.hu-job')}));
 await p.evaluate(()=>{window.jobNode366=document.querySelector('.hu-job');HUNT.X.t+=8;HUNT._v200.st().jobs[0].got++;HUNT.step(.01,1);});assert.equal(await p.evaluate(()=>document.querySelector('.hu-job')===jobNode366&&jobNode366.open),true);
 await p.screenshot({path:out+'/jobs-open.png'});
 await p.locator('.hu-job-list').evaluate(e=>e.style.maxHeight='60px');const rect=await p.locator('.hu-job-list').boundingBox(),cd=await ctx.newCDPSession(p);await p.evaluate(()=>{window.lookBefore366=[HUNT.X.th,HUNT.X.ph];});
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+80,y:rect.y+45}]});for(let i=1;i<=6;i++){await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rect.x+80,y:rect.y+45-i*7}]});await p.waitForTimeout(25);}await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);
 assert.ok(await p.locator('.hu-job-list').evaluate(e=>e.scrollTop>0));assert.deepEqual(await p.evaluate(()=>[HUNT.X.th,HUNT.X.ph]),await p.evaluate(()=>lookBefore366));
 await p.locator('.hu-job-list').evaluate(e=>e.style.maxHeight='');await p.setViewportSize({width:320,height:568});await p.evaluate(()=>{document.querySelector('.hu-info').style.fontSize='24px';document.querySelector('.hu-info b').style.fontSize='24px';});await p.waitForTimeout(100);
 assert.ok(await details.evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('.hu-top').getBoundingClientRect().bottom+6));await p.setViewportSize({width:390,height:760});
 console.log('OK: kein Fragezeichen, drei Aufträge, nativ eingeklappt, Touch-Öffnen/Scrollen ohne Kamerabewegung und Offen-Zustand bleibt nach Fortschrittsupdate.');
 await p.setViewportSize({width:900,height:650});
 /* Gleiche Modelle und Gelenke wie im Spiel auf einer isolierten Bühne. */
 const stats=await p.evaluate(()=>{
  document.querySelector('#huntUI').style.display='none';VISTA.hide();const R=FV.R;R.nodes=[];R.instClear();R.env.fogR=[100,200];R.env.sky=[.8,.84,.9];R.env.sunCol=[.9,.85,.8];R.env.ground=[.5,.5,.5];
  const ground=new G3.MB();ground.box(8,.02,8,0xa9b58d,{x:0,z:0,y:-.04});R.nodes.push(R.node(R.mesh(ground),{shadow:false}));
  const stats=[];
  for(const k of ['hirsch','keiler'])for(const side of [-1,1])for(const speed of [0,6])for(const scale of [.85,1.15]){
   const A=HUNT._spawn(k,false,{score:.6,g:36,vr:0,x:HUNT.FC.x,z:HUNT.FC.z});A.ry=.7;A.s=scale;A.node.sx=A.node.sy=A.node.sz=scale;A.zone='herz';A.dist=speed?3:0;A.collapse365=!speed;A.v=speed;A.legsA=[[.1,.05,0],[-.1,.2,0],[.12,-.1,0],[-.14,-.2,0]];
   A.legN.forEach((N,i)=>{N.up.rx=A.legsA[i][0];N.lo.rx=A.legsA[i][1];});
   HUNT._fall(A,side);const before={money:S.money,score:A.score},samples=[],base=A.fs.center,origin=[A.x,A.z];let maxStep=0,maxJoint=0,minFloor=Infinity,early=0,footDrift=0,last=null;
   const count=Math.ceil(A.fT*60)+2;
   for(let j=0;j<count;j++){
    HUNT.X.t+=1/60;HUNT._stepAnimal(A,1/60,j/60);const q={x:A.x,y:A.y,z:A.z,rx:A.rx,rz:A.rz,legs:A.legsA.map(a=>a.slice()),st:A.st};
    if(last){maxStep=Math.max(maxStep,Math.hypot(q.x-last.x,q.y-last.y,q.z-last.z));for(let i=0;i<4;i++)for(let v=0;v<3;v++)maxJoint=Math.max(maxJoint,Math.abs(q.legs[i][v]-last.legs[i][v]));}
    if(A.st==='fall')minFloor=Math.min(minFloor,A.node.y-HUNT._fallFloor(A));
    if(!speed&&j<count*.15){for(let i=0;i<4;i++){const L=HUNT.SP[k].legs[i],dm=HUNT._legDim(k,L),a=A.legsA[i],lo=HUNT.rot([0,-dm[1],0],a[1],0,0),q=HUNT.rot([0,-dm[0]+lo[1],dm[2]+lo[2]],a[0],0,a[2]);const w=HUNT.rot(q.map((v,d)=>(v+L.h[d])*A.s),A.rx,A.ry,A.rz),F=A.fs.feet[i];footDrift=Math.max(footDrift,Math.hypot(A.x+w[0]-F[0],A.y+w[1]-F[1],A.z+w[2]-F[2]));}}
    if(j<count*.25)early=Math.max(early,...A.legsA.map(a=>Math.abs(a[1])));last=q;samples.push(q);
   }
   const dp=HUNT._dead(A),center=HUNT.rot(HUNT.SP[k].body.c.map(v=>v*A.s),0,A.ry,A.rz),c0=HUNT.rot(base,0,A.ry,0),travel=Math.hypot(A.x+center[0]-origin[0]-c0[0],A.z+center[2]-origin[1]-c0[2]);
   stats.push({k,side,speed,scale,maxStep,maxJoint,minFloor,early,footDrift,travel,dead:A.st==='dead',poseError:Math.max(...A.legsA.flatMap((a,i)=>a.map((v,j)=>Math.abs(v-dp.legs[i][j])))),moneySame:before.money===S.money,scoreSame:before.score===A.score});
   R.nodes=R.nodes.filter(n=>n!==A.node);HUNT.X.animals=HUNT.X.animals.filter(a=>a!==A);
  }return stats;
 });
 for(const s of stats){assert.ok(s.dead&&s.poseError<1e-8&&s.moneySame&&s.scoreSame,JSON.stringify(s));assert.ok(s.maxJoint<.18&&s.maxStep<.15&&s.minFloor>-.001,JSON.stringify(s));if(!s.speed)assert.ok(s.travel<.2&&s.footDrift<.045,JSON.stringify(s));}
 fs.writeFileSync(out+'/fall-metrics.json',JSON.stringify(stats,null,2));console.log('Fallmessungen:',{cases:stats.length,maxJoint:Math.max(...stats.map(s=>s.maxJoint)),maxRootStep:Math.max(...stats.map(s=>s.maxStep)),maxFootDrift:Math.max(...stats.map(s=>s.footDrift))});
 /* Gerenderte Zwischenbilder und kleine, abspielbare Fallfolge je Art. */
 for(const k of ['hirsch','keiler']){
  await p.evaluate(k=>{const R=FV.R;R.nodes.length=1;const A=HUNT._spawn(k,false,{score:.6,g:36,vr:0,x:HUNT.FC.x,z:HUNT.FC.z});A.x=0;A.z=0;A.node.x=0;A.node.z=0;A.ry=0;A.zone='herz';A.collapse365=true;A.v=0;HUNT._fall(A,1);window.fallA366=A;R.cam={...R.cam,tx:0,ty:k==='hirsch'?.7:.4,tz:0,dist:k==='hirsch'?5.5:4,yaw:1.05,pitch:.28,fov:.7};R.render(0);},k);
  fs.mkdirSync(out+'/'+k,{recursive:true});
  for(let n=0;n<=40;n++){
   await p.evaluate(()=>{HUNT.X.t+=1/40;HUNT._stepAnimal(fallA366,1/40,0);FV.R.render(0);});
   await p.locator('#farmCv').screenshot({path:out+'/'+k+'/'+String(n).padStart(3,'0')+'.png'});
  }
 }
 await p.setViewportSize({width:390,height:760});
 /* Ausrichtung der Wolken bei denselben Himmelsrichtungen, wechselnden Blickwinkeln. */
 await p.evaluate(()=>{document.querySelector('#huntUI').style.display='';document.querySelector('.hu-job').open=false;const R=FV.R;R.nodes=[];R.instClear();HUNT.X.skyAz=0;HUNT.X.mode='hold';S.time=21.6*60;window.skySet366=(yaw,pitch,time)=>{Object.assign(R.cam,{tx:0,ty:1,tz:0,dist:.05,yaw,pitch,fov:.85,far:10000});R.render(time);VISTA.draw(R,time);};});
 for(const [name,yaw,pitch,time]of [['sky-a',Math.PI,.03,10],['sky-b',Math.PI+.35,.13,10],['sky-return',Math.PI,.03,100]]){await p.evaluate(({yaw,pitch,time})=>skySet366(yaw,pitch,time),{yaw,pitch,time});const data=await p.locator('#fpVista').evaluate(e=>e.toDataURL('image/png'));fs.writeFileSync(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));}
 const cpu=await p.evaluate(()=>{const start=performance.now();for(let i=0;i<40;i++)VISTA.draw(FV.R,100+i/60);return (performance.now()-start)/40;});console.log('VISTA.draw (nur 2D) mittlere CPU-Zeit:',cpu.toFixed(2)+' ms');
 assert.deepEqual(errors,[]);console.log('OK: 16 Fallkombinationen, stetige Winkel und Bodenschutz, Endpose ohne Sprung; Wolkenansichten gerendert, keine JavaScript-Fehler.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
