/* v413: Grafikvergleich, Hüttenkontakt und echte WebGL-Zoomwechsel ohne Ressourcenwachstum. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-gebirge-v413';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:960,height:800},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(60000);
 if(process.env.LOGISTIKA_BASELINE_ALPINE)await page.route('**/alpine.js?*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.LOGISTIKA_BASELINE_ALPINE,'utf8')}));
 await page.goto((process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8005')+'/?test=1');await page.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:12*60,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=500000;S.farm.tut.done=true;S.farm.snd=false;S.farm.areas={wald:true,see:true,saege:true,altwald:true};farmTractorEnsure();
  const oldTree=Object.assign({},S.farm.trees[0],{id:999001,x:35,z:-124,dmg:2,t:18}),keep=JSON.stringify({...oldTree,x:0,z:0});S.farm.trees.push(oldTree);delete S.farm.mountains384;farmAlpineTrees384(S.farm);
  if(ALPINE.contains(oldTree.x,oldTree.z)||!treeSpotOk(oldTree.x,oldTree.z,2.4)||JSON.stringify({...oldTree,x:0,z:0})!==keep||!S.farm.mountains384)throw Error('Alter Baum wurde nicht unter Datenerhalt freigestellt');

  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=true;farmDOM();syncHeadH();document.querySelectorAll('.navbtn').forEach(n=>n.classList.toggle('on',n.dataset.tab==='farm'));
  FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:512,shadowBox:55,maxDpr:1});FV.meshes={};window.lost375=0;document.querySelector('#farmCv').addEventListener('webglcontextlost',()=>lost375++);
  window.originalAssets375=JSON.stringify({trees:S.farm.trees,objs:S.farm.objs,money:S.money});const alpBuild=ALPINE.build;ALPINE.build=(...args)=>{const t=performance.now(),v=alpBuild(...args);window.alpBuildMs=performance.now()-t;return v;};farmBuildScene();FV.on=false;
  window.frame375=(x,z,d,yaw=2.4,ty=12,pitch=.82)=>{Object.assign(FV.R.cam,{tx:x,tz:z,ty,dist:d,yaw,pitch,fov:.65});document.querySelector('#hudTime').textContent=stamp(S.time);farmEnv();worldStep(1/30,ALPINE.info().clock);FV.R.render(ALPINE.info().clock);document.querySelector('#farmCv').getContext('webgl2').finish();};frame375(75,-145,145,2.4,20);document.querySelector('#toasts').replaceChildren();
 });

 const initial=await page.evaluate(()=>({buildMs:alpBuildMs,terrain:ALPINE.info().geometry.terrainNear.v.length/27,trees:ALPINE.info().geometry.trees.length,geometry:Object.fromEntries(Object.entries(ALPINE.info().geometry).filter(([k,v])=>v.v).map(([k,v])=>[k,v.v.length/27]))}));
 for(const v of [{n:'tal-tag',x:75,z:-150,d:185,yaw:2.4,ty:26,pitch:.82},{n:'kamm-seite',x:75,z:-150,d:175,yaw:1,ty:24,pitch:.7},{n:'see-ufer',x:78,z:-149,d:85,yaw:2.4,ty:15,pitch:.65}]){
  await page.evaluate(v=>{S.time=720;frame375(v.x,v.z,v.d,v.yaw,v.ty,v.pitch);},v);await page.screenshot({path:out+'/'+v.n+'.png'});
 }
 await page.evaluate(()=>{const p=ALPINE.info().geometry.spots.hut;frame375(p[0],p[2],26,2.4,p[1]+1,.62);});await page.screenshot({path:out+'/huette.png'});
 await page.setViewportSize({width:390,height:760});
 for(const v of [{n:'mobil-tag',t:720,yaw:2.4,d:215},{n:'mobil-nacht',t:115,yaw:2.4,d:215},{n:'mobil-seite',t:720,yaw:1.05,d:235}]){await page.evaluate(v=>{S.time=v.t;frame375(72,-142,v.d,v.yaw,21,.82);},v);await page.screenshot({path:out+'/'+v.n+'.png'});}
 await page.evaluate(()=>{S.time=720;for(const d of [70,185,450,70,185,450])frame375(75,-145,d);});
 const baseline=await page.evaluate(()=>({meshes:Object.keys(FV.meshes).length,nodes:FV.R.nodes.length})),frames=[];
 for(let cycle=0;cycle<3;cycle++)for(const d of [70,150,185,225,450,225,150,70])frames.push(await page.evaluate(d=>{const start=performance.now();frame375(75,-145,d);const A=ALPINE.info().scene;return {dist:d,ms:performance.now()-start,tris:FV.R.stats.tris,shadowTris:FV.R.stats.sTris,near:A.near.visible,terrainMesh:A.near.mesh.count,fade:A.near.fade,animals:A.animals.filter(a=>a.root.visible).length,meshes:Object.keys(FV.meshes).length,nodes:FV.R.nodes.length,lost:lost375};},d));
 assert.ok(frames.every(f=>f.lost===0&&f.meshes===baseline.meshes&&f.nodes===baseline.nodes&&f.fade===0&&f.near));
 assert.ok(frames.filter(f=>f.dist===450).every(f=>f.shadowTris===0&&f.animals===0));
 await page.evaluate(()=>frame375(-28,-28,450,2.4,0));await page.screenshot({path:out+'/insel-gesamt.png'});
 const budget=await page.evaluate(()=>{let tris=0,draws=0;function count(n){if(n.visible===false)return;if(n.mesh){tris+=n.mesh.count/3;draws++;}n.children.forEach(count);}count(ALPINE.info().scene.root);return {tris,draws};});assert.ok(budget.tris<16000,'Feste Fernlast');
 const movement=await page.evaluate(()=>{frame375(80,-149,90);const A=ALPINE.info().scene,a=A.animals[0],bird=A.birds[0],before=[a.root.x,a.root.z,bird.root.x,bird.root.z];for(let i=0;i<150;i++)worldStep(1/30,i/30);return {before,after:[a.root.x,a.root.z,bird.root.x,bird.root.z],legs:a.legs.every(l=>Number.isFinite(l.upper.rx)&&Number.isFinite(l.lower.sy))};});assert.notDeepEqual(movement.before,movement.after);assert.ok(movement.legs);
 await page.evaluate(()=>{S.time=115;frame375(75,-145,120);});assert.equal(await page.evaluate(()=>ALPINE.info().scene.birds.filter(b=>b.root.visible).length),0);
 const preserved=await page.evaluate(()=>({before:JSON.parse(originalAssets375),after:JSON.parse(JSON.stringify({trees:S.farm.trees,objs:S.farm.objs,money:S.money}))}));assert.deepEqual(preserved.after,preserved.before);
 assert.ok(await page.evaluate(()=>[...document.scripts].some(s=>s.src.endsWith('alpine.js?v=413'))));assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/messwerte.json',JSON.stringify({viewport:'390×760 / 960×800, Chromium SwiftShader',initial,baseline,frames,budget,movement,preserved,errors},null,2));
 console.log('OK v413 Browser: Tag/Nacht, Kamm, Seeufer, Hütte und Insel; 24 Zoomwechsel ohne neue Meshes/Knoten/Contextverlust, Fernschatten aus, Tiere bewegen sich, Bäume/Gebäude/Geld erhalten.',{initial,budget});
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
