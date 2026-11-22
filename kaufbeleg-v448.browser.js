/* v448: Kaufbeleg in echten Spielskripten, inklusive Bestandsansicht und Fokus. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {run,get}=require('./test-support/company-fixture');run('fresh();openCorp("w4_eisberg");corpOffer("w4_eisberg",corp().talks.w4_eisberg.val,true);');
const receipt=get('corp().owned.w4_eisberg.receipt353');Object.assign(receipt,{at:207*1440+975,price:167180000,pct:22.2,company:'Weitwind Spedition',group:{count:17,vehicles:216,paid:740190000}});
const base=process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8017',out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-v448';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const p=await b.newPage({viewport:{width:390,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(base+'/?test=1');await p.evaluate(()=>document.fonts.ready);
 const open=async(data=receipt)=>p.evaluate(ev=>{
  const old=document.getElementById('corpShow');if(old)old.querySelector('.crp-close').click();
  S=Object.assign(newGame(),{phase:'play',stage:6,time:ev.at,speed:0,money:2e8,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});
  S.corp={owned:{},talks:{},rivals:[],hq:{},hqRestore281:true};rivalById(ev.id);
  document.querySelector('#intro').classList.remove('on');
  const before=JSON.stringify(S),snapshot=JSON.stringify(ev);corpWinReport(ev);window.receiptSaveOK=JSON.stringify(S)===before&&JSON.stringify(ev)===snapshot;
 },data);
 const checks=[];
 for(const size of [{width:390,height:760},{width:320,height:568},{width:360,height:640},{width:430,height:820}]){
  await p.setViewportSize(size);await open();await p.waitForTimeout(400);
  const result=await p.evaluate(()=>{
   const box=document.querySelector('.crp448'),body=box.querySelector('.crp2-body'),btn=box.querySelector('.crp-close'),r=box.getBoundingClientRect(),br=btn.getBoundingClientRect();
   const overflow=[...box.querySelectorAll('.crp2-kpi,.crp2-price,.crp2-head h2,.crp2-head>span,.crp2-rows')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className);
   return {w:innerWidth,h:innerHeight,top:r.top,bottom:r.bottom,footer:br.bottom,scroll:body.scrollHeight-body.clientHeight,overflow,saved:receiptSaveOK,kpis:box.querySelectorAll('.crp2-kpi').length,title:document.querySelector('#crpTitle').textContent};
  });checks.push(result);await p.screenshot({path:out+'/beleg-'+size.width+'.png'});
  assert.ok(result.top>=0&&result.bottom<=size.height+1,JSON.stringify(result));assert.equal(result.kpis,6);assert.equal(result.saved,true);assert.deepEqual(result.overflow,[]);
  assert.ok(result.footer<=size.height);if(size.width>=360)assert.equal(result.scroll,0,'Üblicher Beleg passt vollständig ins normale Handyformat');assert.equal(result.title,receipt.name);
  assert.ok((await p.locator('.crp2-kpis').textContent()).includes('+22,2'));await p.screenshot({path:out+'/beleg-'+size.width+'.png'});
  await p.locator('.crp-inventory-open').tap();assert.equal(await p.locator('.crp-inventory').isVisible(),true);
  await p.locator('.corp-subfold').first().locator('summary').tap();const list=p.locator('.crp-inventory .crp-detail-content');
  await list.evaluate(el=>el.scrollTop=el.scrollHeight);assert.ok(await list.evaluate(el=>el.scrollHeight>el.clientHeight&&el.scrollTop>0));
  await p.screenshot({path:out+'/bestand-'+size.width+'.png'});await p.locator('.crp-inventory-back').tap();assert.equal(await p.locator('.crp-inventory').isVisible(),false);
  assert.equal(await p.locator('.crp-inventory-open').getAttribute('aria-expanded'),'false');
  await p.locator('.crp-close').tap();assert.equal(await p.locator('#corpShow').count(),0);
 }
 // Lange gespeicherte Namen/Zahlen und reservierte Standorte bleiben lesbar.
 await p.setViewportSize({width:320,height:568});await open({...receipt,name:'Eisberg Frischelogistik International & Partner',company:'Weitwind Internationale Spedition und Logistikgruppe',veh:12345,staff:12345,pct:99.9,pending:2,sites:3,group:{count:123,vehicles:123456,paid:167180000000}});await p.waitForTimeout(400);
 assert.ok(await p.locator('.crp2-body').evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert.ok(await p.locator('.crp2-kpi').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1)));await p.screenshot({path:out+'/lange-werte.png'});
 await p.keyboard.press('Escape');assert.equal(await p.locator('#corpShow').count(),0);
 await p.emulateMedia({reducedMotion:'reduce'});const legacy={id:'blitz',name:'Blitz Kurier',company:'Weitwind',at:600,price:12500,veh:2,staff:0,sites:1,cust:0,pct:0,rep:0};await open(legacy);await p.waitForTimeout(100);
 assert.equal(await p.locator('.crp-inventory-open').count(),0);assert.equal(await p.locator('.crp448').evaluate(el=>getComputedStyle(el).animationName),'none');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.classList.contains('crp-close')),true);await p.keyboard.press('Escape');
 await p.close();
 const desktop=await b.newPage({viewport:{width:1100,height:900},serviceWorkers:'block'});desktop.on('pageerror',e=>errors.push(String(e)));await desktop.goto(base+'/?test=1');await desktop.evaluate(()=>document.fonts.ready);
 for(const size of [{width:1100,height:900},{width:844,height:390}]){
  await desktop.setViewportSize(size);await desktop.evaluate(ev=>{const old=document.getElementById('corpShow');if(old)old.querySelector('.crp-close').click();S=Object.assign(newGame(),{phase:'play',stage:6,time:ev.at,speed:0,money:2e8,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});S.corp={owned:{},talks:{},rivals:[],hq:{}};corpWinReport(ev);},receipt);await desktop.waitForTimeout(400);
  assert.ok(await desktop.locator('.crp448').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1));await desktop.screenshot({path:out+'/desktop-'+size.width+'.png'});
  await desktop.locator('.crp-inventory-open').click();await desktop.keyboard.press('Tab');assert.ok(await desktop.evaluate(()=>document.activeElement.closest('#corpShow')!==null));await desktop.locator('.crp-inventory-back').click();assert.equal(await desktop.evaluate(()=>document.activeElement.classList.contains('crp-inventory-open')),true);await desktop.keyboard.press('Escape');assert.equal(await desktop.locator('#corpShow').count(),0);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/pruefung.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));console.log('OK v448: mobiler Beleg, Bestand/Touch-Scroll/Zurück/Schließen, lange Werte, Altbestand und reduzierte Bewegung; Daten unverändert.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
