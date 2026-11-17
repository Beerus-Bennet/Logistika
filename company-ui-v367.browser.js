/* Browserabnahme v367: Chromium/Playwright, lokaler Testserver Port 8000.
   node company-ui-v356.browser.js; ausschließlich generierte Testdaten. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-company-v367';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.LOGISTIKA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:664},hasTouch:true,isMobile:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
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
  openCorp('w4_titan');
 });

 await page.locator('#coOff').evaluate(el=>{el.value=String(Math.round(corp().talks.w4_titan.val*1.1));el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#coGo').click();await page.waitForSelector('#corpShow.cs-receipt');
 assert.equal(await page.evaluate(()=>typeof CORP_SHARK),'undefined');assert.equal(await page.locator('.cs-shark').count(),0);
 const saved=await page.evaluate(()=>JSON.stringify({money:S.money,own:corp().owned.w4_titan}));
 const cd=await context.newCDPSession(page);
 for(const [width,height] of [[390,664],[320,568],[844,390]]){
  await page.setViewportSize({width,height});await page.locator('.crp-inventory-open').click();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'crp-detail-content');
  await page.locator('#crpInventory .corp-subfold>summary').first().click();
  const content=page.locator('.crp-detail-content');
  const dimensions=await content.evaluate(e=>({h:e.clientHeight,sh:e.scrollHeight,w:e.clientWidth,sw:e.scrollWidth}));
  assert.ok(dimensions.h>40&&dimensions.sh>dimensions.h&&dimensions.sw<=dimensions.w+1,JSON.stringify(dimensions));
  const b=await content.boundingBox();await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.6,y:b.y+b.height*.8}]});
  for(let i=1;i<=8;i++){await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width*.6,y:b.y+b.height*.8-i*b.height*.065}]});await page.waitForTimeout(25);}
  await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);
  assert.ok(await content.evaluate(e=>e.scrollTop>15),'Bestandsliste reagiert auf Fingerwischen');
  await content.evaluate(e=>e.scrollTop=e.scrollHeight);const last=page.locator('#crpInventory .corp-subfold').first().locator('.corp-record').last();
  assert.ok(await last.isVisible());const end=await last.boundingBox();assert.ok(end.y+end.height<=b.y+b.height+2,'letztes Fahrzeug erreichbar');
  const footer=await page.locator('.crp-close').boundingBox();assert.ok(footer.y+footer.height<=height);
  await page.screenshot({path:path.join(out,'receipt-scroll-'+width+'x'+height+'.png')});
  await page.locator('.crp-inventory-back').click();assert.equal(await page.locator('.crp-inventory-open').getAttribute('aria-expanded'),'false');
  assert.equal(await page.evaluate(()=>JSON.stringify({money:S.money,own:corp().owned.w4_titan})),saved);
  await page.evaluate(()=>document.querySelector('#crpInventory .corp-subfold').open=false);
 }
 await page.locator('.crp-close').click();assert.equal(await page.locator('[inert]').count(),0);assert.deepEqual(errors,[]);
 console.log('OK: echter Kauf direkt zum Beleg ohne Hai; Finger-Scroll bis Fahrzeug 17 bei 390/320/Querformat, feste Navigation, Daten unverändert.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
