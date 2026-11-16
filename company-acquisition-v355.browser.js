/* Optionaler echter Browsercheck: lokaler Server auf Port 8000, Playwright und
   Chromium erforderlich. node company-acquisition-v355.browser.js
   Nur generierte Testdaten unter ?test=1; kein Zugriff auf den Live-Spielstand. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const output=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-company-v355';
const url=process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8000/';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.LOGISTIKA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(url+'?test=1',{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{
  S=Object.assign(newGame(),{stage:6,money:5e9,time:172*1440+1000,xp:500000,phase:'play',speed:0,tut:{done:true},
   player:{name:'Jonas',company:'Weitwind Spedition',avatar:{art:'p1'},color:0,origin:3},bases:[],fleet:[],orders:[],
   share:{me:70,pacific:10,atlas:8,nord:5,rabe:4,blitz:3},corp:{owned:{},talks:{},hq:{},rivals:[],hqRestore281:true}});
  document.querySelectorAll('.open').forEach(e=>e.classList.remove('open'));
  document.querySelector('#intro').classList.remove('on');document.body.className='';
  showTab('world');render();openCorp('pacific');
 });
 const expected=await page.evaluate(()=>({ids:corp().talks.pacific.deal353.fleet.map(v=>v.uid),staff:corpDealSummary(corp().talks.pacific.deal353).staff,cash:S.money}));
 await page.screenshot({path:path.join(output,'offer.png')});
 // Echter Angebotsschieber und Bestätigungsbutton statt Abkürzung am Commit.
 await page.locator('#coOff').evaluate(el=>{el.value=String(Math.round(corp().talks.pacific.val*1.05));el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#coGo').click();await page.waitForSelector('#corpShow.cs-shark');
 await page.waitForTimeout(650);await page.screenshot({path:path.join(output,'shark-intro.png')});
 await page.waitForFunction(()=>parseFloat(document.querySelector('.shk-bottom b').style.width)>=34);
 // Simulierter Sichtbarkeitswechsel: Zeitachse und CSS müssen gemeinsam pausieren.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 const paused=await page.locator('.shk-bottom b').evaluate(el=>el.style.width);
 await page.waitForTimeout(250);
 assert.equal(await page.locator('.shk-bottom b').evaluate(el=>el.style.width),paused);
 assert.ok(await page.locator('#corpShow').evaluate(el=>el.classList.contains('shk-paused')));
 await page.screenshot({path:path.join(output,'shark-pass.png')});
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForSelector('.shk-reveal .shk-result');await page.waitForTimeout(1100);
 await page.screenshot({path:path.join(output,'shark-result.png')});
 await page.locator('.shk-details').click();await page.waitForSelector('.crp-sheet');
 const committed=await page.evaluate(()=>({ids:S.fleet.map(v=>v.uid),staff:S.bases.reduce((n,b)=>n+b.staff.length,0),cash:S.money,ledger:S.ledger,receipt:corp().owned.pacific.receipt353}));
 assert.deepEqual(committed.ids,expected.ids);assert.equal(committed.staff,expected.staff);
 const payment=committed.ledger.filter(x=>x.k==='corp'&&x.l.startsWith('Übernahme:'));
 assert.equal(payment.length,1);assert.equal(payment[0].a,-committed.receipt.price);
 // Bestehende Erfolge können beim Kauf zusätzlich Geld ausschütten.
 const other=committed.ledger.filter(x=>x!==payment[0]).reduce((n,x)=>n+x.a,0);
 assert.equal(committed.cash,expected.cash-committed.receipt.price+other);
 for(const [width,height] of [[390,844],[375,667],[320,568],[844,390],[1280,800]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(50);
  const size=await page.evaluate(()=>{const sheet=document.querySelector('.crp-sheet'),button=document.querySelector('.crp-close');const body=document.querySelector('.crp2-body');return {h:sheet.clientHeight,scroll:sheet.scrollHeight,w:sheet.clientWidth,sw:sheet.scrollWidth,button:button.getBoundingClientRect().bottom,vh:innerHeight,bh:body.clientHeight,bs:body.scrollHeight};});
  /* v362: Der Inhalt liegt in .crp2-body – auch dort darf nichts scrollen, und der Knopf bleibt im Bild. */
  assert.ok(size.bs<=size.bh+1,'Belegteil passt ohne Scrollen '+width+'x'+height+' ('+size.bs+' > '+size.bh+')');assert.ok(size.button<=size.vh,'Knopf im Bild '+width+'x'+height);
  assert.ok(size.sw<=size.w+1,'Kein horizontaler Überlauf '+width);
  assert.ok(size.scroll<=size.h+1,'Zusammenfassung passt ohne Scrollen '+width+'x'+height);
  console.log('Beleg',width+'x'+height,size);
  await page.screenshot({path:path.join(output,'receipt-'+width+'x'+height+'.png')});
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('.crp-details>summary').click();
 await page.locator('.crp-close').click();assert.equal(await page.locator('#corpShow').count(),0);
 assert.equal(await page.evaluate(()=>document.querySelectorAll('[inert]').length),0);
 // Beleg über die echte Welt-Oberfläche erneut öffnen; keine zweite Zahlung.
 await page.locator('[data-corp-receipt="pacific"]').click();
 assert.equal(await page.evaluate(()=>S.money),committed.cash);
 await page.keyboard.press('Escape');
 await page.evaluate(()=>save());await page.reload({waitUntil:'load'});
 assert.deepEqual(await page.evaluate(()=>corp().owned.pacific.receipt353.vehicleIds),expected.ids);
 assert.equal(await page.evaluate(()=>S.money),committed.cash);
 await page.evaluate(()=>corpShow({...corp().owned.pacific.receipt353,sharkShown:true}));
 // Große Schrift: lesbarer Scroll-Fallback, keine schrumpfenden/überlappenden Karten.
 await page.evaluate(()=>{
  const nodes=[...document.querySelectorAll('#corpShow *')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);
  nodes.forEach(([el,size])=>{el.style.fontSize=size*2+'px';});
 });
 /* v362: Der Belegteil (.crp2-body) scrollt dann für sich; der Knopf darunter bleibt stehen. */
 const enlarged=await page.evaluate(()=>{const s=document.querySelector('.crp2-body');s.scrollTop=s.scrollHeight;const b=document.querySelector('.crp-close').getBoundingClientRect();return {scroll:s.scrollHeight,client:s.clientHeight,bottom:b.bottom};});
 assert.ok(enlarged.scroll>enlarged.client);assert.ok(enlarged.bottom<=844);
 await page.screenshot({path:path.join(output,'receipt-large-type.png')});await page.keyboard.press('Escape');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>corpShow(corp().owned.pacific.receipt353));
 assert.ok(await page.locator('#corpShow').evaluate(el=>el.classList.contains('shk-rm')));
 await page.locator('.shk-details').click();await page.locator('.crp-close').click();
 assert.equal(await page.evaluate(()=>S.money),committed.cash);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>corpShow(corp().owned.pacific.receipt353));
 await page.locator('.shk-skip').click();await page.locator('.crp-close').click();
 assert.equal(await page.evaluate(()=>S.money),committed.cash);
 // Lange Namen und fehlende externe Schrift: zugänglicher Fallback.
 const fallbackStyle=await page.addStyleTag({content:'.cs-receipt *{font-family:Arial,sans-serif!important}'});
 await page.evaluate(()=>corpShow({...corp().owned.pacific.receipt353,sharkShown:true,name:'Pacific Star Lines International Transportgesellschaft',company:'Weitwind Internationale Spedition und Logistikgruppe'}));
 await page.screenshot({path:path.join(output,'receipt-long-name-fallback.png')});
 assert.ok(await page.locator('.crp-sheet').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await page.locator('.crp-close').click();
 await fallbackStyle.evaluate(el=>el.remove());
 // Zweiter Kauf: Premiumkonzern um 100 Mio. mit tatsächlicher Konzernzentrale.
 await page.evaluate(()=>{
  const template=CORP_WAVE_POOL.find(t=>t.k==='zenit');
  corp().rivals.push({...template,id:'w3_zenit',wave:3,hq:'mannheim',fleet:12,tier:2,modes:'rbilsa',base:5700000,at:S.time});
  S.share.w3_zenit=10;corpSyncRivals(true);openCorp('w3_zenit');
 });
 const premium=await page.evaluate(()=>({staff:corpDealSummary(corp().talks.w3_zenit.deal353).staff,tier:corp().talks.w3_zenit.deal353.sites[0].tier}));
 assert.ok(premium.staff>=20);assert.equal(premium.tier,4);
 await page.locator('#coOff').evaluate(el=>{el.value=String(Math.round(corp().talks.w3_zenit.val*1.1));el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#coGo').click();await page.waitForSelector('#corpShow.cs-shark');
 await page.locator('.shk-skip').click();await page.waitForSelector('.crp-sheet');
 const premiumReceipt=await page.evaluate(()=>corp().owned.w3_zenit.receipt353);
 assert.ok(premiumReceipt.price>8e7&&premiumReceipt.price<12e7);
 await page.screenshot({path:path.join(output,'receipt-premium.png')});
 await page.locator('.crp-close').click();await page.locator('[data-tab="bases"]').click();
 const actualPremium=await page.evaluate(()=>{
  const ids=new Set(corp().owned.w3_zenit.receipt353.baseIds),bases=S.bases.filter(b=>ids.has(b.id));
  const b=bases.find(b=>b.node==='mannheim');
  for(let floor=0;floor<tierFloors(tierOf(b));floor++){
   const room=OFFICE3D.buildRoom(b,floor);
   for(const k of ['st','shell','trim','glow'])if(!room[k].v.every(Number.isFinite))throw Error('Ungültige 3D-Bürogeometrie');
  }
  return {staff:bases.reduce((n,b)=>n+b.staff.length,0),tier:b.tier,kitchen:b.deco.kitchen};
 });
 assert.equal(actualPremium.staff,premiumReceipt.staff);assert.equal(actualPremium.tier,4);assert.equal(actualPremium.kitchen,'barista');
 console.log('Premiumkauf',premiumReceipt.price,premiumReceipt.veh+' Fahrzeuge',premiumReceipt.staff+' Mitarbeitende',premiumReceipt.sites+' Standorte',actualPremium);
 assert.deepEqual(errors,[],'Keine JavaScript-Laufzeitfehler');
 fs.writeFileSync(path.join(output,'purchase-example.json'),JSON.stringify({price:committed.receipt.price,vehicles:committed.ids.length,staff:committed.staff,sites:committed.receipt.sites,premium:{price:premiumReceipt.price,vehicles:premiumReceipt.veh,staff:premiumReceipt.staff,sites:premiumReceipt.sites},errors},null,2));
 console.log('OK: zwei echte Käufe einschließlich Premiumkonzern und 3D-Büro, Animation, 5 Ansichten, Details, Wiederöffnung, Laden, große Schrift, reduzierte Bewegung, Sichtbarkeitspause, Überspringen und lange Namen. Chromium; kein echter iPhone-/Safari-Test.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
