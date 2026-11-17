/* v369: Wohnverträge, echter Renderer, Einzug/LOD/Wege und sichtbare Gärten. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-gaerten-v369';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await browser.newContext({viewport:{width:390,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8000/?test=1');await page.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:12*60,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=500000;S.farm.tut.done=true;S.farm.snd=false;S.farm.stats.deliv=6;S.farm.areas={wald:true,see:true,saege:true,altwald:true};
  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=true;farmDOM();syncHeadH();FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:512,shadowBox:55,maxDpr:1});FV.meshes={};
  const R=FV.R;R.env.fogR=[300,600];R.env.sun=G3.norm([-.5,1,.3]);R.env.sunCol=[.8,.77,.67];R.env.sky=[.47,.57,.68];R.env.ground=[.24,.31,.2];
  const ground=new FM.MB();ground.plate(92,100,0x7da550,{x:-81,z:58,y0:.01});R.nodes.push(R.node(R.mesh(ground),{shadow:false}));
  VILLAGE.state().expanded=true;VILLAGE.buy('030');VILLAGE.build('030','familie',false);S.time=VILLAGE.home('030').ready;VILLAGE.tick();S.time=Math.floor(S.time/1440)*1440+720;
  for(const h of Object.values(VILLAGE.state().homes))h.life={mailDay:Math.floor(S.time/1440),shopDay:Math.floor(S.time/1440)};
  document.querySelector('#toasts').replaceChildren();VILLAGE_VIEW.attach(R);window.gardenRender=(id,dist=34,yaw=3.7)=>{const p=VILLAGE.plot(id);Object.assign(R.cam,{tx:p.x,ty:.5,tz:p.z,dist,yaw,pitch:.87,fov:.65});VILLAGE_VIEW.step(.016,S.time);R.render(0);};
  gardenRender('030');window.beforeHouse369=VILLAGE_VIEW._world.homes.get('030').house;
 });
 assert.equal(await page.evaluate(()=>!!VILLAGE_VIEW._world.homes.get('030').yard),false);
 await page.screenshot({path:out+'/bezugsfertig.png'});
 await page.evaluate(()=>{
  const h=VILLAGE.home('030');VILLAGE.list('030','online');S.time=h.listing.ready;VILLAGE.tick();const c=h.listing.offers[0];c.size=3;VILLAGE.negotiate('030',c.id,'rent',c.price);VILLAGE.sign('030',c.id);
  document.querySelector('#toasts').replaceChildren();gardenRender('030');
 });
 assert.equal(await page.evaluate(()=>VILLAGE_VIEW._world.homes.get('030').house===beforeHouse369),true);
 assert.ok(await page.evaluate(()=>VILLAGE_VIEW._world.homes.get('030').yard.visible));
 await page.screenshot({path:out+'/familiengarten-mobil.png'});
 for(const [id,name,yaw] of [['000','blumengarten',3.6],['001','familie-gegenueber',-.55],['010','ruhe-feuerstelle',3.6],['011','grillgarten',-.55],['021','nutzgarten',-.55]]){
  await page.evaluate(({id,yaw})=>gardenRender(id,31,yaw),{id,yaw});await page.screenshot({path:out+'/'+name+'.png'});
 }
 // Vollständiger Ort zur Prüfung der Gesamtwirkung, nicht nur Einzelobjekte.
 await page.setViewportSize({width:960,height:800});await page.evaluate(()=>{
  for(const p of VILLAGE_DATA.plots){const h=VILLAGE.home(p.id);if(!h.resident){h.status='rented';h.type=Number(p.id)%2?'familie':'holz';h.resident={...VILLAGE_DATA.neighbors[Number(p.id)%6],id:'render-'+p.id};}}
  document.querySelector('#toasts').replaceChildren();VILLAGE_VIEW.sync();Object.assign(FV.R.cam,{tx:-81,ty:0,tz:58,dist:139,yaw:-.7,pitch:1.0,fov:.65});VILLAGE_VIEW.step(.016,S.time);FV.R.render(0);
 });
 await page.screenshot({path:out+'/quartier-uebersicht.png'});
 const lod=await page.evaluate(()=>{
  const e=VILLAGE_VIEW._world.homes.get('030'),R=FV.R,read=()=>({detail:e.yard.visible,far:e.yardFar.visible,ground:e.yardGround.visible,blocked:VILLAGE_SITE.blocked(VILLAGE.plot('030').road+VILLAGE.plot('030').side*15.55,VILLAGE.plot('030').z,.2)});
  const result=[];for(const d of [80,115,107,96,80]){R.cam.dist=d;VILLAGE_VIEW.step(.016,S.time);result.push(read());}return result;
 });
 assert.deepEqual(lod.map(q=>[q.detail,q.far]),[[true,false],[false,true],[false,true],[true,false],[true,false]]);assert.ok(lod.every(q=>q.ground&&q.blocked));
 await page.evaluate(()=>{const old=FV.fp;FV.fp={};FV.R.cam.dist=260;VILLAGE_VIEW.step(.016,S.time);window.fpYard369=VILLAGE_VIEW._world.homes.get('030').yard.visible;FV.fp=old;});assert.equal(await page.evaluate(()=>fpYard369),true);
 const stable=await page.evaluate(()=>{const n=FV.R.nodes.length,m=Object.keys(FV.meshes).length,cash=S.money;for(let i=0;i<40;i++)VILLAGE_VIEW.sync();return {nodes:FV.R.nodes.length-n,meshes:Object.keys(FV.meshes).length-m,cash:S.money===cash};});assert.deepEqual(stable,{nodes:0,meshes:0,cash:true});
 const empty=await page.evaluate(()=>{const h=VILLAGE.home('030');window.backupGarden369=JSON.stringify(h);delete h.resident;h.status='ready';VILLAGE_VIEW.sync();const e=VILLAGE_VIEW._world.homes.get('030');return[e.yard.visible,e.yardFar.visible,e.yardGround.visible];});assert.deepEqual(empty,[false,false,false]);
 await page.evaluate(()=>{VILLAGE.state().homes['030']=JSON.parse(backupGarden369);VILLAGE_VIEW.sync();});assert.ok(await page.evaluate(()=>VILLAGE_VIEW._world.homes.get('030').yard.visible));
 // Integrationsblick in die vollständige Insel, einschließlich der parallelen Fernstufen.
 await page.evaluate(()=>{S.time=Math.ceil(S.time/1440)*1440+720;farmBuildScene();Object.assign(FV.R.cam,{tx:-81,ty:0,tz:58,dist:260,yaw:-.7,pitch:1.0,fov:.65});worldStep(.016,0);FV.R.render(0);});
 const island=await page.evaluate(()=>({shadow:FV.R.noShadow,shadowTriangles:FV.R.stats.sTris,gardens:[...VILLAGE_VIEW._world.homes.values()].filter(e=>e.yardFar&&e.yardFar.visible).length}));
 assert.equal(island.shadow,true);assert.equal(island.shadowTriangles,0);assert.equal(island.gardens,20);
 await page.screenshot({path:out+'/insel-gaerten-fern.png'});
 await page.setViewportSize({width:390,height:760});await page.evaluate(()=>{gardenRender('030',34,3.7);worldStep(.016,1);FV.R.render(1);});
 assert.equal(await page.evaluate(()=>FV.R.noShadow),false);
 await page.screenshot({path:out+'/familiengarten-insel-mobil.png'});
 assert.deepEqual(errors,[]);console.log('OK: echte Vermietung zeigt Ausstattung ohne Hausneubau, vier Gartenprofile auf beiden Straßenseiten, vollständiges Quartier, sparsame Fernstufe mit Hysterese, 40 Synchronisationen ohne neue Knoten/Meshes/Geldänderung, Leerstand entfernt Ausstattung.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
