/* Browserabnahme v356: Chromium/Playwright, lokaler Testserver Port 8000.
   node company-ui-v356.browser.js; ausschließlich generierte Testdaten. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-company-v356';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.LOGISTIKA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:664},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto((process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8000/')+'?test=1',{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:5e9,time:172*1440,xp:500000,speed:0,tut:{done:true},tutSeen:{bases:true,base1:true},
   player:{name:'Jonas',company:'Weitwind Spedition',avatar:{art:'p1'},color:0,origin:3},share:{me:70,w6_kraft:16,w6_ostwind:14,w4_titan:9},corp:{owned:{},talks:{},rivals:[],hq:{},hqRestore281:true}});
  for(const [k,id,place,wave,fleet] of [['kraft','w6_kraft','Santiago',6,16],['ostwind','w6_ostwind','Buenos Aires',6,16],['titan','w4_titan','Casablanca',4,14]]){
   const template=CORP_WAVE_POOL.find(x=>x.k===k),hq=Object.values(N).find(n=>n.short===place).id;
   corp().rivals.push({...template,name:template.name+(wave===6?' International':''),id,hq,wave,fleet,tier:3,modes:'rbilsa',base:5e6,at:S.time});
  }
  corpSyncRivals(true);document.querySelector('#intro').classList.remove('on');document.body.className='';showTab('world');render();
  corpShow({kind:'threat',ids:['w6_kraft','w6_ostwind']});
 });
 for(const [width,height] of [[390,664],[375,667],[320,520],[844,390],[1280,800]]){
  await page.setViewportSize({width,height});
  const box=await page.locator('.ct-sheet').evaluate(el=>({h:el.clientHeight,scroll:el.scrollHeight,w:el.clientWidth,sw:el.scrollWidth,bottom:document.querySelector('.ct-close').getBoundingClientRect().bottom,vh:innerHeight}));
  console.log('Konzernmeldung',width,height,box);
  assert.ok(box.scroll<=box.h+1,'Meldung benötigt Scrollen bei '+width+'x'+height);
  assert.ok(box.sw<=box.w+1);assert.ok(box.bottom<=height-5);
  await page.screenshot({path:path.join(out,'challenge-'+width+'x'+height+'.png')});
 }
 await page.setViewportSize({width:390,height:664});
 await page.evaluate(()=>{const nodes=[...document.querySelectorAll('.ct-sheet *')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);nodes.forEach(([el,n])=>{el.style.fontSize=n*2+'px'});});
 const big=await page.locator('.ct-sheet').evaluate(el=>{el.scrollTop=el.scrollHeight;return {h:el.clientHeight,sh:el.scrollHeight,w:el.clientWidth,sw:el.scrollWidth,bottom:document.querySelector('.ct-close').getBoundingClientRect().bottom}});
 assert.ok(big.sh>big.h&&big.sw<=big.w+1&&big.bottom<=664);
 await page.locator('.ct-close').click();assert.equal(await page.locator('[inert]').count(),0);
 await page.setViewportSize({width:390,height:664});await page.evaluate(()=>openCorp('w4_titan'));
 await page.locator('#modalBody .corp-package>summary').click();
 const folds=page.locator('#modalBody .corp-package-body>.corp-subfold');assert.equal(await folds.count(),3);
 assert.deepEqual(await folds.evaluateAll(nodes=>nodes.map(el=>el.open)),[false,false,false]);
 await folds.nth(0).locator('summary').first().click();assert.ok(await folds.nth(0).locator('.corp-record').count()>=17);
 assert.equal(await folds.nth(2).evaluate(el=>el.open),false);await folds.nth(0).locator('summary').first().click();
 await folds.nth(2).locator('summary').first().click();assert.equal(await folds.nth(2).locator('.corp-subfold[open]').count(),0);
 await folds.nth(2).locator('.corp-subfold>summary').first().click();assert.ok(await folds.nth(2).locator('.corp-record').count()>0);
 await folds.nth(2).locator('summary').first().click();
 await page.screenshot({path:path.join(out,'offer-sections.png')});await page.locator('#mClose').click();
 await page.evaluate(()=>showTab('bases'));await page.locator('#newBaseNode').click();
 await page.evaluate(()=>{corp().showQ=[{kind:'threat',ids:['w6_kraft','w6_ostwind']}];corpTick();});
 assert.equal(await page.locator('#corpShow').count(),0);await page.evaluate(()=>{corp().showQ=[];});
 await page.locator('#baseLocationSearch').fill('Brandenburg');
 await page.evaluate(()=>renderBases());assert.equal(await page.locator('#baseLocationSearch').inputValue(),'Brandenburg');
 const option=page.locator('.location-options [data-place]').first();
 assert.match(await option.innerText(),/Brandenburg an der Havel/);
 assert.equal(/\p{Extended_Pictographic}/u.test(await page.locator('.location-options').innerText()),false);
 await page.setViewportSize({width:320,height:568});
 const size=await option.evaluate(el=>({h:el.offsetHeight,w:el.scrollWidth,cw:el.clientWidth}));assert.ok(size.h>=44&&size.w<=size.cw);
 await page.screenshot({path:path.join(out,'location-search.png')});
 await page.locator('#baseLocationSearch').fill('Berlin');await page.locator('#baseLocationSearch').press('ArrowDown');
 const selected=await page.locator('.location-options [data-place]:focus').getAttribute('data-place');
 await page.keyboard.press('Enter');await page.waitForSelector('#baseLocationDialog',{state:'detached'});
 assert.equal(await page.locator('#newBaseNode').getAttribute('value'),selected);
 const cash=await page.evaluate(()=>S.money);
 await page.locator('#newBaseNode').click();await page.keyboard.press('Escape');await page.waitForSelector('#baseLocationDialog',{state:'detached'});
 assert.equal(await page.evaluate(()=>S.money),cash);
 await page.setViewportSize({width:390,height:664});await page.evaluate(()=>{showTab('world');openCorp('w4_titan');});
 await page.locator('#coOff').evaluate(el=>{el.value=String(Math.round(corp().talks.w4_titan.val*1.1));el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#coGo').click();await page.waitForSelector('#corpShow.cs-shark');await page.locator('.shk-skip').click();await page.locator('.crp-close').click();
 const parked=await page.evaluate(()=>{
  const own=corp().owned.w4_titan.receipt353,ids=new Set(own.vehicleIds),vehicles=S.fleet.filter(v=>ids.has(v.uid));
  return vehicles.map(v=>{const b=baseOfVehicle(v.uid),a=baseAddr(b);return {uid:v.uid,mode:vType(v.type).mode,at:v.at,node:b.node,lat:v.spot.lat,lon:v.spot.lon,baseLat:a.lat,baseLon:a.lon,label:v.spot.t,baseLabel:a.t};});
 });
 assert.equal(parked.length,17);assert.ok(parked.every(v=>'rb'.includes(v.mode)&&v.at===v.node&&v.lat===v.baseLat&&v.lon===v.baseLon&&v.label===v.baseLabel));
 await page.evaluate(()=>{showTab('map');const b=baseOfVehicle(corp().owned.w4_titan.receipt353.vehicleIds[0]),a=baseAddr(b);map.setView([a.lat,a.lon],16);mapRedraw();});
 await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'vehicles-at-base.png')});
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'parking.json'),JSON.stringify(parked,null,2));
 console.log('OK: kompakte Konzernmeldung, unabhängige Klappbereiche, suchbare Ortsauswahl mit Tastatur/Refresh, echter Kauf und 17 Fahrzeuge exakt am Betriebshof. Chromium; kein echter Safari-/iPhone-Test.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
