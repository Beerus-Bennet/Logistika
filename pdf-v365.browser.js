/* v365: PDF-Abnahme in mobilem Chromium; keine Aussage über reale iPhone-Temperatur. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-v365';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await browser.newContext({viewport:{width:390,height:760},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8000/?test=1');await p.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:600,lastDay:0,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});
  farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=500000;S.farm.tut.done=true;S.farm.stats.deliv=6;HUNT._v200.st().built=1;
  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=true;farmDOM();syncHeadH();
  VILLAGE.expand();VILLAGE.buy('030');VILLAGE.build('030','holz',false);VILLAGE_UI.open();
 });
 await p.locator('.town-ad>summary').click();await p.locator('#townAdForm [name=kind]').selectOption('rent');await p.locator('#townAdForm [value=familie]').uncheck();
 await p.evaluate(()=>{for(let i=0;i<3;i++){S.time++;FV.sheetTick();}});assert.equal(await p.locator('#townAdForm [name=kind]').inputValue(),'rent');
 await p.locator('#townAdForm [type=submit]').click();assert.match(await p.locator('.town-ad').innerText(),/Anzeige läuft/);assert.match(await p.locator('.town-ad').innerText(),/Zur Miete/);
 await p.screenshot({path:out+'/central-advert.png'});
 await p.evaluate(()=>{const h=VILLAGE.home('030');S.time=h.listing.ready;VILLAGE.tick();VILLAGE_UI.open('030');});
 await p.locator('.town-applicant>summary').first().click();await p.locator('[data-town-talk]').first().click();const price=await p.evaluate(()=>VILLAGE.home('030').listing.offers[0].price);await p.locator('#townNegotiation input').fill(String(price));await p.locator('.tn-form [type=submit]').click();
 assert.equal(await p.locator('.tn-form [data-sign]').isDisabled(),true);assert.match(await p.locator('.tn-reply').innerText(),/nach Fertigstellung/);await p.screenshot({path:out+'/building-reservation.png'});await p.evaluate(()=>{S.time=VILLAGE.home('030').ready;VILLAGE.tick();FV.sheetTick();});assert.equal(await p.locator('.tn-form [data-sign]').isDisabled(),false);await p.locator('.tn-form [data-sign]').click();assert.equal(await p.evaluate(()=>VILLAGE.home('030').status),'rented');
 await p.evaluate(()=>{closeFarmSheet();FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:256,maxDpr:1});HUNT.begin();});
 await p.locator('[data-hu=quality]').click();assert.match(await p.locator('#huntQuality').innerText(),/Tiergüte 46/);await p.screenshot({path:out+'/quality-help.png'});await p.locator('#huntQuality button').click();
 /* Tatsächlicher sofortiger Fallpfad, einschließlich Gelenken und Lageübergang. */
 const collapse=await p.evaluate(()=>{
  const X=HUNT.X;X.mode='on';X.inRv=true;const A=HUNT._spawn('hirsch');let g=1;while(!HUNT._instantCollapse({...A,g,v:0},'herz'))g++;A.g=g;A.st='graze';A.v=0;A.zone='herz';const before=[A.x,A.z];HUNT._hit(A,'herz',100,{});
  window.fall365={A,before};return {state:A.st,run:A.runL,duration:A.fT};
 });assert.equal(collapse.state,'fall');assert.equal(collapse.run,0);assert.ok(collapse.duration>.7&&collapse.duration<1.1);
 const frameSamples=await p.evaluate(()=>{
  const A=fall365.A,R=FV.R;R.cam.tx=A.x;R.cam.tz=A.z;R.cam.ty=.9;R.cam.dist=5;R.cam.pitch=.35;const samples=[];
  for(let i=0;i<45;i++){HUNT.step(.04,i*.04);samples.push({st:A.st,y:A.y,rz:A.rz,x:A.x,z:A.z});}R.render(2);return samples;
 });assert.ok(frameSamples.some(a=>a.st==='dead'));assert.ok(new Set(frameSamples.map(a=>a.rz.toFixed(3))).size>5);assert.ok(frameSamples.every(a=>Number.isFinite(a.y+a.rz+a.x+a.z)));
 await p.screenshot({path:out+'/instant-collapse.png'});
 /* Innenraum mit echtem, vielfältigem Personal, nicht nur leeres Büro. */
 await p.evaluate(()=>{
  document.getElementById('huntUI').remove();FV.on=false;activeTab='bases';document.body.className='';
  const b={id:'pdf365',tier:4,node:'b-temp',rent:false,mood:90,opened:S.time,staff:Array.from({length:18},(_,i)=>makeCandidateFor(['disp','fahr','ums','zoll'][i%4])),vehicles:[],deco:{floor:'beton',tint:'natur',wall:'weiss',kitchen:'nische',plants:[],pos:{desks:{},plants:{},kitchen:null}}};S.bases=[b];
  if(!N[b.node])b.node=Object.keys(N).find(id=>N[id].short==='Tempelhof')||'berlin';window.frames365=0;window.oldRender365=G3.create;G3.create=(cv,opt)=>{const R=oldRender365(cv,opt),render=R.render;R.render=t=>{frames365++;render(t);};return R;};OFFICE3D.enter(b.id);
 });
 await p.waitForFunction(()=>OFFICE3D._dbg()&&OFFICE3D._dbg().build&&OFFICE3D._dbg().build.length===0,{},{timeout:60000});await p.waitForSelector('#officeBoot',{state:'detached',timeout:30000});
 const office=await p.evaluate(()=>{const O=OFFICE3D._dbg();return {staff:O.staff.length,expected:O.b.staff.filter((s,i)=>deskFloor(O.b,i)===O.floor).length,dpr:O.R.dpr,scale:O.R.scale||1,pixels:O.R.canvas.width,css:O.R.w,frames:frames365,meshes:O.meshes.length};});
 assert.equal(office.staff,office.expected);assert.ok(office.staff>0);assert.ok(office.dpr>=1.04&&office.dpr<=1.5);assert.ok(office.meshes>20);console.log('Büro:',office);
 await p.screenshot({path:out+'/office.png'});
 const start=await p.evaluate(()=>frames365);await p.waitForTimeout(1100);const rendered=await p.evaluate(()=>frames365)-start;assert.ok(rendered<=36,'Bildtakt begrenzt: '+rendered);console.log('Büro-Bilder in 1,1 s:',rendered);
 await p.evaluate(()=>{OFFICE3D.leave();window.jail365=JAIL3D.open(document.querySelector('#report'),{days:16,kind:'uhaft',where:'Untersuchungshaft · Berlin-Tempelhof'});document.querySelector('#report').classList.add('on','jl-on');document.body.classList.add('jl-open');});
 await p.evaluate(()=>{jail365.update({k:.3,money:S.money,moneyTxt:money(S.money),jobs:12});jail365.say('man');});await p.waitForTimeout(200);
 const face=await p.evaluate(()=>{const J=jail365,p=J.R.project(-.3,.92+.115+.383+.16,-.81),b=document.querySelector('#jlSay').getBoundingClientRect(),r=document.querySelector('#jlCv').getBoundingClientRect();return {p:[p[0]+r.left,p[1]+r.top],b:{left:b.left,right:b.right,top:b.top,bottom:b.bottom}};});
 assert.ok(face.b.bottom<face.p[1]-20||face.b.right<face.p[0]-25||face.b.left>face.p[0]+25||face.b.top>face.p[1]+24,JSON.stringify(face));
 await p.screenshot({path:out+'/jail-speech.png'});await p.evaluate(()=>jail365.close());
 assert.deepEqual(errors,[]);console.log('OK: zentrale Anzeige, Bauvormerkung, Gütehilfe, unmittelbarer Gelenk-Fall, stufenweiser Büroaufbau, 30-Hz-Takt und Haftblase ohne Gesichtsüberdeckung.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
