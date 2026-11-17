/* v359: Reale Formulare, Tastatur-Viewport, Filter und 3D-Trefferbild in Chromium. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-v359';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await browser.newContext({viewport:{width:390,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await ctx.addInitScript(()=>{const v=new EventTarget();Object.assign(v,{height:760,width:390,offsetTop:0,offsetLeft:0,scale:1});Object.defineProperty(window,'visualViewport',{value:v});window.testViewport=v;});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8000/?test=1');
 await p.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:1e7,time:600,lastDay:0,player:{name:'Test',company:'Weitwind Spedition',origin:3,avatar:{art:'p1'}},speed:0,tut:{done:true}});
  farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=500000;S.farm.tut.done=true;S.farm.areas={wald:true,see:true,saege:true,altwald:true};S.farm.stats.deliv=6;
  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=true;farmDOM();syncHeadH();window.oldThumbFill=thumbFill;thumbFill=()=>{};
  VILLAGE.expand();VILLAGE.buy('030');VILLAGE.build('030','holz',false);S.time=VILLAGE.home('030').ready;VILLAGE.tick();VILLAGE.list('030','online');S.time=VILLAGE.home('030').listing.ready;VILLAGE.tick();VILLAGE_UI.open('030');
 });
 await p.locator('.town-applicant>summary').first().click();await p.locator('[data-town-talk]').first().click();
 const input=p.locator('#townNegotiation [name=price]');await input.fill('99999');await p.evaluate(()=>{window.inputNode=document.querySelector('#townNegotiation input');window.cashBefore=S.money;});
 for(let i=0;i<8;i++)await p.evaluate(()=>{S.time+=1;FV.sheetTick();});
 assert.equal(await input.inputValue(),'99999');assert.equal(await p.evaluate(()=>inputNode===document.querySelector('#townNegotiation input')),true);
 await p.locator('.tn-form [type=submit]').click();assert.match(await p.locator('.tn-reply').innerText(),/Budget/);assert.equal(await input.inputValue(),'99999');
 await p.evaluate(()=>{Object.assign(testViewport,{height:320,offsetTop:26});testViewport.dispatchEvent(new Event('resize'));testViewport.dispatchEvent(new Event('scroll'));});
 await input.fill('1420');await p.evaluate(()=>new Promise(requestAnimationFrame));
 const box=await p.locator('#townNegotiation').boundingBox(),submit=await p.locator('.tn-form [type=submit]').boundingBox();assert.ok(box.y>=26&&box.y+box.height<=346);assert.ok(submit.y+submit.height<=346);assert.ok(parseFloat(await input.evaluate(e=>getComputedStyle(e).fontSize))>=16);
 await p.screenshot({path:out+'/negotiation-keyboard.png'});
 await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>S.money),await p.evaluate(()=>cashBefore));
 await p.locator('[data-town-talk]').first().click();assert.equal(await input.inputValue(),'1420');
 await p.evaluate(()=>{Object.assign(testViewport,{height:760,offsetTop:0});testViewport.dispatchEvent(new Event('resize'));});
 const offer=await p.evaluate(()=>VILLAGE.home('030').listing.offers[0].price);await input.fill(String(offer));await p.locator('.tn-form [type=submit]').click();await p.locator('.tn-form [data-sign]').click();assert.equal(await p.locator('#townNegotiation').count(),0);assert.equal(await p.evaluate(()=>VILLAGE.home('030').contract.kind),'rent');
 assert.equal(await p.evaluate(()=>S.money),await p.evaluate(()=>cashBefore));
 /* Kauf und Ablauf werden im selben Dialog unabhängig von Mietverträgen geprüft. */
 await p.evaluate(()=>{const h=VILLAGE.home('031');h.status='ready';h.type='holz';VILLAGE.list('031','referral');S.time=h.listing.ready;VILLAGE.tick();VILLAGE_UI.open('031');VILLAGE_UI.openTalk('031',h.listing.offers[1].id);window.buyBefore=S.money;});
 const buy=await p.evaluate(()=>VILLAGE.home('031').listing.offers[1].price);await input.fill(String(buy));await p.locator('.tn-form [type=submit]').click();await p.locator('.tn-form [data-sign]').click();
 assert.equal(await p.evaluate(()=>VILLAGE.home('031').contract.kind),'buy');assert.equal(await p.evaluate(()=>S.money),await p.evaluate(()=>buyBefore)+buy);
 await p.evaluate(()=>{const h=VILLAGE.home('040');h.status='ready';h.type='holz';VILLAGE.list('040','online');S.time=h.listing.ready;VILLAGE.tick();VILLAGE_UI.open('040');VILLAGE_UI.openTalk('040',h.listing.offers[0].id);window.expiredBefore=S.money;h.listing.expires=S.time-1;});
 await p.locator('.tn-form [type=submit]').click();assert.match(await p.locator('.tn-reply').innerText(),/nicht mehr gültig/);assert.equal(await p.evaluate(()=>S.money),await p.evaluate(()=>expiredBefore));await p.keyboard.press('Escape');
 console.log('OK: Verhandlung ohne DOM-Ersatz/Werteverlust, Antwort, Tastaturbereich, Abbruch/Entwurf und bestätigter Mietvertrag.');
 await p.evaluate(()=>{farmAdd(Object.keys(FITEMS).find(id=>FITEMS[id].st==='koeder'),1,3);for(const k of ['hirsch','keiler','fasan'])farmAdd(HUNT.trophyId(k,3),3,3);S.farm.hunt.built=S.time;thumbFill=oldThumbFill;document.querySelector('#toasts').innerHTML='';openFarmStore('troph');});
 assert.equal(await p.locator('#fsStoreSelect').inputValue(),'troph');assert.equal(await p.locator('.tw-filters select').count(),3);assert.equal(await p.locator('.tw-tabs .logi-icon').count(),3);
 await p.locator('[data-tw-filter=kind]').selectOption('fasan');assert.ok((await p.locator('.tw-c').allTextContents()).every(s=>/Fasan/i.test(s)));
 await p.locator('[data-tw-filter=rarity]').selectOption('0');await p.locator('[data-tw-filter=sort]').selectOption('wert');
 const filt=await p.locator('.tw-filters').boundingBox();assert.ok(filt.width<=370);assert.ok(await p.locator('.tw-c').count()>0);await p.screenshot({path:out+'/storage.png'});
 for(const k of ['silo','barn','holz','fisch','koeder','troph']){await p.locator('#fsStoreSelect').selectOption(k);assert.equal(await p.locator('#fsStoreSelect').inputValue(),k);}
 console.log('OK: Lagerwechsel, drei Filter, passende SVG-Symbole und keine horizontale Überbreite.');
 const alerts=await p.evaluate(()=>{
  const old={jobs:S.jobs,fleet:S.fleet,events:S.events,line:roadLine,pending:routePending},r=[[52,13],[52,13.04]],type=VEHICLES.find(v=>v.mode==='r'&&!v.special).id;
  roadLine=x=>x;routePending=()=>false;
  const f={uid:'event359',type,jobId:'job359',legIdx:0,phase:'haul',route:r,routeDist:pathLen(r),pos:0};
  S.fleet=[f];S.jobs=[{id:'job359',v:313,legs:[{mode:'r',from:Object.keys(N)[0],to:Object.keys(N)[1],vehs:[f.uid],qty:10,dn:0,pts:r}]}];
  const e={id:'event359',type:'stau',road:'Teststrecke',at:[52.01,13.02],until:S.time+120};S.events=[e];renderEventBar();const none=!document.querySelector('#evToggle');
  e.at=[52,13.02];renderEventBar();const active=document.querySelector('#evToggle').textContent.includes('1 Störung');
  f.pos=f.routeDist*.9;renderEventBar();const passed=!document.querySelector('#evToggle');
  S.jobs=old.jobs;S.fleet=old.fleet;S.events=old.events;roadLine=old.line;routePending=old.pending;renderEventBar();return{none,active,passed};
 });assert.deepEqual(alerts,{none:true,active:true,passed:true});console.log('OK: Warnanzeige nur für betroffene Route; verschwindet nach dem Passieren.');
 await p.evaluate(()=>{closeFarmSheet();FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:256,maxDpr:1});S.farm.hunt.built=S.time;HUNT.begin();});
 for(const [k,zone,orgId]of [['hirsch','herz','herz'],['keiler','lunge','lungeR'],['fasan','vogel','herz']]){
  await p.evaluate(({k,zone,orgId})=>{
   const gn=HUNT.genes(k,.7,3),O=HUNT.ORG[k].find(O=>O.id===orgId),A={k,s:1,score:.7,gn,T:HUNT.traits(k,.7,gn),vr:0,medal:3,zone,dm:177};
   const lo=[3,O.c[1],O.c[2]],ld=[-1,0,0];A.shots=[{zone,lo,ld,t:2.8,org:[{id:orgId,n:O.n,v:O.v}],dmg:100,dm:177,v:700,e:2800,pose:{nrx:0,nry:0,hrx:0,legs:[]}}];
   HUNT.X.hrv={A};HUNT.X.view='harvest';HUNT._xray();
  },{k,zone,orgId});
  await p.waitForFunction(()=>document.querySelector('.xo-hl')&&HUNT._xr().ov);await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>HUNT._xr().visibleOrgans.length),k==='keiler'?2:1);assert.equal(await p.locator('.xr-labs>span').count(),1);
  await p.screenshot({path:out+'/xray-'+k+'.png'});
 }
 const cd=await ctx.newCDPSession(p),pan=p.locator('.xr-pan'),pr=await pan.boundingBox();await p.evaluate(()=>{document.querySelector('.xr-pan').scrollTop=0;window.panPrevented=null;document.addEventListener('touchstart',e=>{if(e.target.closest('.xr-pan'))window.panPrevented=e.defaultPrevented;});});
 const x=pr.x+pr.width*.5,y=pr.y+pr.height*.8;
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=7;i++){await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*20}]});await p.waitForTimeout(25);}await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(200);
 const scroll=await pan.evaluate(el=>({top:el.scrollTop,max:el.scrollHeight-el.clientHeight}));assert.ok(scroll.max>0&&scroll.top>0,JSON.stringify(scroll));assert.equal(await p.evaluate(()=>panPrevented),false);
 await pan.evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await p.locator('.xr-tip').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.closest('.xr-pan').getBoundingClientRect();return a.bottom<=b.bottom;}));await p.screenshot({path:out+'/xray-scroll.png'});
 assert.deepEqual(errors,[]);console.log('OK: artspezifische Organmodelle im WebGL-Trefferbild; nur betroffene Organe; echtes Touch-Scrollen bis zum Berichtsende.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
