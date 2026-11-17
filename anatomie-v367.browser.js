/* v367: Echte WebGL-Trefferbilder und Touch-Scrollen, nur generierte Testtiere. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-anatomie-v367';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await b.newContext({viewport:{width:390,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8000/?test=1');await p.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:1e7,time:600,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.tut.done=true;S.farm.snd=false;S.farm.areas={wald:true,see:true,saege:true,altwald:true};
  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=true;farmDOM();syncHeadH();FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:256,maxDpr:1});HUNT._v200.st().built=1;HUNT.begin();HUNT.X.mode='hold';
 });
 for(const [k,id,zone] of [['keiler','diagonal','lunge'],['keiler','magen','koerper'],['hirsch','herz','herz'],['fasan','lungeR','vogel']]){
  const report=await p.evaluate(({k,id,zone})=>{
   const gn=HUNT.genes(k,.7,3),O=HUNT.ORG[k].find(o=>o.id===id),A={k,s:1,score:.7,gn,T:HUNT.traits(k,.7,gn),vr:0,medal:3,zone,dm:179};
   const lo=O?[3,O.c[1],O.c[2]]:[.03,.77,-2],ld=O?[-1,0,0]:[.011416774907719883,-.09361755424330306,.9955427719531738];
   const rec=HUNT._shotRec(k,{x:0,y:0,z:0,s:1},lo,ld,{zone,t:O?2.8:1.5},179,{tf:.2});
   if(id==='diagonal'){delete rec.anatomy367;rec.org.push({id:'magen',n:'Magen'});}A.shots=[rec];
   window.animal367=A;window.before367=JSON.stringify(A.shots);HUNT.X.hrv={A};HUNT.X.view='harvest';HUNT._xray();return HUNT._xrShot(k,A.shots[0]).org.map(o=>o.id);
  },{k,id,zone});
  await p.waitForTimeout(250);
  const visible=await p.evaluate(()=>HUNT._xr().visibleOrgans);
  if(id==='diagonal'){assert.deepEqual(visible,['lungeR','niereR']);assert.equal(report.includes('magen'),false);assert.match(await p.locator('.xr-org').innerText(),/Niere rechts/);assert.doesNotMatch(await p.locator('.xr-org').innerText(),/Magen/);}
  if(id==='magen'){assert.deepEqual(visible,['magen']);assert.equal(await p.evaluate(()=>animal367.shots[0].dmg),45);}
  if(id==='herz')assert.deepEqual(visible,['herz']);
  if(k==='fasan')assert.deepEqual(visible,['lungeL','lungeR']);
  assert.equal(await p.evaluate(()=>JSON.stringify(animal367.shots)===before367),true);
  await p.screenshot({path:out+'/'+k+'-'+id+'.png'});
  for(const [width,height] of [[390,760],[320,568]]){
   await p.setViewportSize({width,height});
   for(const yaw of [.25,1.2,3.4]){
    await p.evaluate(yaw=>{HUNT._xr().yaw=yaw;},yaw);await p.waitForTimeout(90);
    const boxes=await p.locator('.xr-labs>span').evaluateAll(nodes=>nodes.map(e=>{const b=e.getBoundingClientRect();return {l:b.left,r:b.right,t:b.top,b:b.bottom};}));
    for(const q of boxes)assert.ok(q.l>=0&&q.r<=width+1);
    for(let i=0;i<boxes.length;i++)for(let j=0;j<i;j++)assert.ok(boxes[i].r<=boxes[j].l||boxes[j].r<=boxes[i].l||boxes[i].b<=boxes[j].t||boxes[j].b<=boxes[i].t,'Namen überlappen');
   }
  }
  await p.setViewportSize({width:390,height:760});
 }
 const cd=await ctx.newCDPSession(p),pan=p.locator('.xr-pan'),r=await pan.boundingBox();await pan.evaluate(e=>e.scrollTop=0);
 const before=await p.evaluate(()=>[HUNT._xr().yaw,HUNT._xr().pitch]);
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height*.8}]});
 for(let i=1;i<=8;i++){await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height*.8-i*20}]});await p.waitForTimeout(25);}
 await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(100);assert.ok(await pan.evaluate(e=>e.scrollTop>0));assert.deepEqual(await p.evaluate(()=>[HUNT._xr().yaw,HUNT._xr().pitch]),before);
 await pan.evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await p.locator('.xr-tip').evaluate(e=>e.getBoundingClientRect().bottom<=e.closest('.xr-pan').getBoundingClientRect().bottom));
 await p.screenshot({path:out+'/report-end.png'});assert.deepEqual(errors,[]);
 console.log('OK: vier WebGL-Aufnahmen, echter schräger Nieren-/Lungentreffer ohne Magen, korrekte Paarorgane, Namensspalten ohne Überlappung bei 320/390 px und Drehen, Touch-Scroll bis Berichtsende, Aufzeichnungen unverändert.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
