/* v412: Kopfmodelle, ganzer Schusskanal und schmales Hochsitz-Menü im Touch-Viewport. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-v412';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await b.newContext({viewport:{width:390,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto((process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8004')+'/?test=1');await p.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:1e7,time:21.6*60,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.tut.done=true;S.farm.snd=false;S.farm.areas={wald:true,see:true,saege:true,altwald:true};
  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=true;farmDOM();syncHeadH();FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:256,maxDpr:1});HUNT._v200.st().built=1;HUNT.begin();HUNT.X.mode='hold';HUNT.X.inRv=true;HUNT.X.spawnT=1e9;HUNT.X.flyT=1e9;HUNT.step(.01,0);FV.R.render(0);VISTA.draw(FV.R,0);
 });

 await p.evaluate(()=>{const H=HUNT._v200.st();H.jobs=[{id:'test0',tpl:'art_h',d:0,n:1,got:0},{id:'test1',tpl:'art_f',d:1,n:1,got:0},{id:'test2',tpl:'rek',d:2,n:1,got:0,k:'fasan',v:.5}];HUNT.X.jobK=null;HUNT.step(.01,0);FV.on=false;});
 for(const viewport of [{width:390,height:760},{width:320,height:640},{width:760,height:390}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(150);
  const menu=p.locator('#huntUI .hu-job');await menu.locator('summary').tap();assert.equal(await menu.getAttribute('open'),'');
  const m=await p.evaluate(()=>{const el=document.querySelector('.hu-job'),info=document.querySelector('.hu-info'),list=el.querySelector('.hu-job-list');return {w:el.getBoundingClientRect().width,iw:info.getBoundingClientRect().width,sw:el.scrollWidth,cw:el.clientWidth,lw:list.scrollWidth,lcw:list.clientWidth,rows:[...el.querySelectorAll('.hu-job-row')].length,hs:list.scrollHeight,h:list.clientHeight};});
  assert.ok(Math.abs(m.w-Math.max(164,m.iw))<1.1,JSON.stringify(m));assert.ok(m.sw<=m.cw+1);assert.ok(m.lw<=m.lcw+1);assert.equal(m.rows,3);assert.ok(m.w<viewport.width*.65);
  // Die letzte Belohnung bleibt bei langen Texten per Scroll erreichbar.
  await menu.locator('.hu-job-row').last().scrollIntoViewIfNeeded();assert.equal(await menu.locator('.hu-job-row em').last().textContent(),'800 €');
  if(m.hs>m.h)assert.ok(await menu.locator('.hu-job-list').evaluate(el=>el.scrollTop>0));
  await p.screenshot({path:out+'/auftraege-'+viewport.width+'.png'});
  await menu.locator('summary').tap();assert.equal(await menu.getAttribute('open'),null);
 }
 await p.setViewportSize({width:390,height:760});


 for(const k of ['keiler','hirsch','fasan']){
 await p.evaluate(k=>{FV.on=false;const A=HUNT._spawn(k,false,{score:.3,g:12,vr:0,x:HUNT.FC.x,z:HUNT.FC.z}),pose={nrx:0,nry:0,hrx:0,legs:[]},B=HUNT.SP[k].brain||{c:[0,.153,.043]},c=HUNT._headPoint(k,B.c,pose);
 const lo=[c[0],c[1],c[2]+3],ld=[0,0,-1];
 A.shots=[{anatomy367:true,zone:'kopf',lo,ld,t:2.65,dm:256,dmg:100,v:750,e:3300,stop:4.5,org:[],pose}];HUNT.X.hrv={A};HUNT._xray();window.headA=A;},k);
 await p.waitForTimeout(400);

 const names=await p.locator('.xr-organ-name').allTextContents();assert.ok(names.includes('Schädel')&&names.includes('Gehirn'));assert.ok(!names.includes('Schädel und Gehirn'));
 assert.equal(await p.locator('.xo-hl').textContent(),'◎ Gehirn');
 const stats=await p.evaluate(()=>{const X=HUNT._xr(),C=HUNT._headChannel(headA.k,headA.shots[0]),imgs=[...document.querySelectorAll('.xr-organ-model img')];return {thru:C.thru,end:C.end,exit:C.exit,thumbs:imgs.map(i=>i.naturalWidth),nodes:X.R.nodes.length};});
 assert.equal(stats.thru,true);assert.equal(stats.end,stats.exit);assert.ok(stats.thumbs.length>=2&&stats.thumbs.every(w=>w>0));
 await p.screenshot({path:out+'/'+k+'.png'});
 if(k==='keiler'){const pan=p.locator('.xr-pan');await pan.evaluate(el=>el.scrollTop=180);assert.ok(await pan.evaluate(el=>el.scrollTop>0));await p.screenshot({path:out+'/bericht.png'});await pan.evaluate(el=>el.scrollTop=0);}
 await p.evaluate(()=>{HUNT._xr().yaw=-.4;HUNT._xr().zoom=.72;});await p.waitForTimeout(150);await p.screenshot({path:out+'/'+k+'-detail.png'});
 }
 assert.deepEqual(errors,[]);console.log('OK v412 Browser: 3 Arten mit 3D-Schädel/Gehirn und vollständigem Kanal; Auftragsmenü in 320/390 px sowie Querformat, Texte/Belohnungen ohne Überlauf, bedienbar und scrollbar. Keine JavaScriptfehler.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
