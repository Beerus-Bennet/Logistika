/* v357: Reload/Orientierung und simulierte Visual-Viewport-Änderungen.
   Chromium prüft den App-Rahmen, keine Behauptung über native Safari-Chrome. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.LOGISTIKA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const url=(process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8000/')+'?test=1';
 await page.goto(url);await page.evaluate(()=>{S.phase='play';S.tut={done:true};S.player={name:'Test',company:'Viewport',avatar:{art:'p1'},origin:3};S.lastTab='map';S.speed=0;S.money=123456;document.querySelector('#intro').classList.remove('on');document.body.classList.remove('locked');showTab('map');save();});
 async function layout(h,top=0){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const box=await page.evaluate(()=>{const rect=id=>document.querySelector(id).getBoundingClientRect().toJSON();return{body:document.body.getBoundingClientRect().toJSON(),map:rect('#map'),nav:rect('#nav'),scroll:[scrollX,scrollY],root:[document.documentElement.clientWidth,document.documentElement.scrollWidth]};});assert.ok(Math.abs(box.body.height-h)<1,JSON.stringify(box));assert.ok(Math.abs(box.body.y-top)<1);assert.ok(Math.abs(box.map.bottom-(h+top))<1);assert.ok(Math.abs(box.nav.bottom-(h+top))<1);assert.deepEqual(box.scroll,[0,0]);assert.equal(box.root[0],box.root[1]);return box;}
 await layout(760);await page.reload();await layout(760);assert.equal(await page.evaluate(()=>S.money),123456);
 for(const [width,height]of [[390,600],[844,390],[390,760]]){await page.setViewportSize({width,height});await layout(height);}
 await context.close();
 const mock=await browser.newContext({viewport:{width:390,height:760},serviceWorkers:'block'});
 await mock.addInitScript(()=>{const v=new EventTarget();Object.assign(v,{height:620,offsetTop:0,scale:1});Object.defineProperty(window,'visualViewport',{value:v,configurable:true});window.testViewport=v;});
 const p=await mock.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(url);await p.evaluate(()=>{document.body.classList.remove('locked');});
 const frame=()=>p.evaluate(()=>{const b=document.body.getBoundingClientRect(),n=document.querySelector('#nav').getBoundingClientRect();return[b.y,b.height,n.bottom];});
 assert.deepEqual(await frame(),[0,620,620]);
 await p.evaluate(()=>{Object.assign(testViewport,{height:480,offsetTop:34});testViewport.dispatchEvent(new Event('resize'));testViewport.dispatchEvent(new Event('scroll'));});await p.evaluate(()=>new Promise(requestAnimationFrame));
 assert.deepEqual(await frame(),[34,480,514]);
 await p.evaluate(()=>{const el=luckyEl();el.className='on lb';el.innerHTML='<div style="height:2000px">Scrollprüfung</div>';lbFitVh();el.scrollTop=300;});
 assert.deepEqual(await p.evaluate(()=>{const el=document.querySelector('#lucky'),r=el.getBoundingClientRect();return[r.y,r.height,el.scrollTop,scrollY];}),[34,480,300,0],'Luckybox nicht doppelt versetzen, innen weiter scrollbar');
 await p.evaluate(()=>document.querySelector('#lucky').remove());
 await p.evaluate(()=>{testViewport.scale=2;testViewport.height=240;testViewport.dispatchEvent(new Event('resize'));});await p.evaluate(()=>new Promise(requestAnimationFrame));assert.deepEqual(await frame(),[34,480,514]);
 await p.evaluate(()=>{Object.assign(testViewport,{height:620,offsetTop:0,scale:1});window.dispatchEvent(new Event('pageshow'));});await p.evaluate(()=>new Promise(requestAnimationFrame));assert.deepEqual(await frame(),[0,620,620]);
 await p.reload();await p.evaluate(()=>document.body.classList.remove('locked'));assert.deepEqual(await frame(),[0,620,620]);await mock.close();
 const fallback=await browser.newContext({viewport:{width:375,height:667},serviceWorkers:'block'});await fallback.addInitScript(()=>Object.defineProperty(window,'visualViewport',{value:undefined}));const f=await fallback.newPage();await f.goto(url);assert.equal(await f.evaluate(()=>document.body.getBoundingClientRect().height),667);await fallback.close();
 assert.deepEqual(errors,[]);console.log('OK v357: Reload mit erhaltenem Spielstand, Hoch-/Querformat, kleinere Browserfläche, Offset/Resize/Pageshow, Pinch-Schutz und Fallback ohne visualViewport.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
