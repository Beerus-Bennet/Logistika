/* v372: Alte Bildzuordnung, mobile Auktion, Garage und echte lokale Fotos. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-autofotos-v372';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await ctx.newPage(),errors=[],wikiRequests=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/wikipedia|wikimedia/.test(r.url()))wikiRequests.push(r.url());});
  await page.addInitScript(()=>localStorage.setItem('logistika-carpics-2',JSON.stringify({prs:{src:'https://upload.wikimedia.org/wrong-modern-green-911.jpg',paint:['Grün','#008800']}})));
  await page.goto('http://127.0.0.1:8000/?test=1');await page.waitForFunction(()=>typeof CAR_PHOTOS!=='undefined'&&typeof newGame==='function');
  await page.evaluate(async()=>{
   S=Object.assign(newGame(),{phase:'play',stage:6,money:145510000,time:191*1440+1268,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});farmNew();S.farm.logi=true;S.farm.tut.done=true;
   const l=makeLot({car:'prs'});Object.assign(l,{id:'L1835',y:1975,paint:['Schwarz','#15161a'],km:103100,cond:3,price:300000,start:300000,bids:1,lead:'me',me:{max:450000},ends:S.time+1138,rivals:[]});
   S.ah.lots=[l];S.ah.on=true;S.ah.next=S.time+99999;delete S.ah.modelYears372;
   S.ah.garage=[{uid:'PURPLE',kind:'car',car:'prs',y:1975,paint:['Violett','#452345'],cond:2,km:80000,luck:1,paid:510000,at:S.time}];
   window.before372=JSON.stringify({money:S.money,paint:l.paint,price:l.price,bids:l.bids,limit:l.me.max,garage:S.ah.garage[0].paint});
   document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-market';showTab('market');renderAuction();
  });
  await page.waitForFunction(()=>document.querySelector('[data-carpic="prs"] img')?.complete,{timeout:30000});
  const fixed=await page.evaluate(()=>({y:S.ah.lots[0].y,garageY:S.ah.garage[0].y,same:before372===JSON.stringify({money:S.money,paint:S.ah.lots[0].paint,price:S.ah.lots[0].price,bids:S.ah.lots[0].bids,limit:S.ah.lots[0].me.max,garage:S.ah.garage[0].paint}),src:PICS.prs.src,file:PICS.prs.file,old:localStorage.getItem('logistika-carpics-2'),photo:document.querySelector('[data-carpic="prs"] img').naturalWidth}));
  assert.equal(fixed.y,1973);assert.equal(fixed.garageY,1973);assert.equal(fixed.same,true);assert.equal(fixed.file,'1973 Porsche 911 Carrera RS 2.7.jpg');assert.match(fixed.src,/cars\/photos\/prs.jpg\?image=/);assert.equal(fixed.old,null);assert.ok(fixed.photo>0);
  await page.screenshot({path:out+'/porsche-auktion-mobil.png'});
  await page.evaluate(()=>{openLot('L1835');});await page.screenshot({path:out+'/porsche-details-mobil.png'});await page.locator('#mClose').click();
  // Derselbe Modelltyp mit zwei Lackierungen im selben DOM: Nachladen darf keine fremde Farbe einblenden.
  await page.evaluate(()=>{S.ah.view='garage';renderAuction();});assert.equal(await page.locator('#tab-market [data-carpic="prs"] img').count(),0);assert.ok(await page.locator('#tab-market [data-carpic="prs"]').innerText().then(s=>s.includes('Illustration in Fahrzeugfarbe')));await page.screenshot({path:out+'/garage-lack-erhalten.png'});
  await page.evaluate(()=>{document.querySelector('#tab-market').insertAdjacentHTML('beforeend',carPicHTML(CAR.prs,'#15161a'));showCarPic('prs');});assert.equal(await page.locator('#tab-market [data-carpic="prs"] img').count(),1);assert.equal(await page.evaluate(()=>S.ah.garage[0].paint[0]),'Violett');
  const all=await page.evaluate(async()=>{const images=await Promise.all(Object.keys(CAR_PHOTOS).map(async id=>{const im=new Image();im.src=PICS[id].src;await im.decode();return {id,w:im.naturalWidth,h:im.naturalHeight};}));return images;});assert.equal(all.length,127);assert.ok(all.every(p=>p.w>0&&p.h>0));
  // Während der Filter rechnet, ersetzt eine andere Quelle das Modellfoto.
  // Das verspätete Ergebnis darf weder DOM noch Bildspeicher überschreiben.
  await page.evaluate(()=>{
   window.savedComicRun372=comicRun;comicRun=data=>new Promise(r=>{window.releaseComic372=()=>r(data.data);});
   COMIC_Q.length=0;COMIC_Q.push('p550');window.pendingComic372=comicNext();
  });
  await page.waitForFunction(()=>typeof releaseComic372==='function');
  await page.evaluate(async()=>{
   PICS.p550={...PICS.p550,sha256:'a'.repeat(64)};releaseComic372();await pendingComic372;
   window.staleRejected372=!COMIC_URL.has('p550')&&!COMIC_SOURCE.has('p550');PICS.p550=modelPic('p550');comicRun=savedComicRun372;
  });assert.equal(await page.evaluate(()=>staleRejected372),true);
  // Ein defektes Comic-Bild darf nur auf dieselbe geprüfte Originaldatei zurückfallen.
  const fallback=await page.evaluate(()=>{const el=document.querySelector('[data-carpaint="#15161a"]'),im=el.querySelector('img');picFail(im);const original=im.getAttribute('src');picFail(im);return {original,images:el.querySelectorAll('img').length,note:el.textContent};});assert.match(fallback.original,/cars\/photos\/prs.jpg/);assert.equal(fallback.images,0);assert.match(fallback.note,/Illustration in Fahrzeugfarbe/);
  assert.deepEqual(wikiRequests,[]);assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/result.json',JSON.stringify({fixed,decoded:all.length,wikiRequests,errors,fallback},null,2));console.log('OK: mobiler Porsche-Fall 1975 → 1973, korrektes schwarzes RS-Foto, Geld/Gebote/Lack unverändert; Garage mit abweichendem Lack illustriert; 127 echte Dateien dekodiert; keine Wikipedia-Anfragen; Original-/Illustrationsrückfall.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
