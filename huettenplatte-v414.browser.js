/* v414: Berghaus-Bodenplatte aus vier Richtungen bei Tag/Nacht, mit realem Renderer. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-huettenplatte-v414';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:960,height:800},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(60000);
 if(process.env.LOGISTIKA_BASELINE_ALPINE)await page.route('**/alpine.js?*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.LOGISTIKA_BASELINE_ALPINE,'utf8')}));
 await page.goto((process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8006')+'/?test=1');await page.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:12*60,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=500000;S.farm.tut.done=true;S.farm.snd=false;S.farm.areas={wald:true,see:true,saege:true,altwald:true};farmTractorEnsure();
  const oldTree=Object.assign({},S.farm.trees[0],{id:999001,x:35,z:-124,dmg:2,t:18}),keep=JSON.stringify({...oldTree,x:0,z:0});S.farm.trees.push(oldTree);delete S.farm.mountains384;farmAlpineTrees384(S.farm);
  if(ALPINE.contains(oldTree.x,oldTree.z)||!treeSpotOk(oldTree.x,oldTree.z,2.4)||JSON.stringify({...oldTree,x:0,z:0})!==keep||!S.farm.mountains384)throw Error('Alter Baum wurde nicht unter Datenerhalt freigestellt');

  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=true;farmDOM();syncHeadH();document.querySelectorAll('.navbtn').forEach(n=>n.classList.toggle('on',n.dataset.tab==='farm'));
  FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:512,shadowBox:55,maxDpr:1});FV.meshes={};window.lost375=0;document.querySelector('#farmCv').addEventListener('webglcontextlost',()=>lost375++);
  window.originalAssets375=JSON.stringify({trees:S.farm.trees,objs:S.farm.objs,money:S.money});const alpBuild=ALPINE.build;ALPINE.build=(...args)=>{const t=performance.now(),v=alpBuild(...args);window.alpBuildMs=performance.now()-t;return v;};farmBuildScene();FV.on=false;
  window.frame375=(x,z,d,yaw=2.4,ty=12,pitch=.82)=>{Object.assign(FV.R.cam,{tx:x,tz:z,ty,dist:d,yaw,pitch,fov:.65});document.querySelector('#hudTime').textContent=stamp(S.time);farmEnv();worldStep(1/30,ALPINE.info().clock);FV.R.render(ALPINE.info().clock);document.querySelector('#farmCv').getContext('webgl2').finish();};frame375(75,-145,145,2.4,20);document.querySelector('#toasts').replaceChildren();
 });


 // Alle Blickrichtungen vorher aufwärmen: die eigentliche Prüfung misst kein Lazy Loading.
 await page.evaluate(()=>{const p=ALPINE.info().geometry.spots.hut;for(const yaw of [.35,1.9,3.4,4.9])frame375(p[0],p[2],24,yaw,p[1]+.7,.92);});
 const baseline=await page.evaluate(()=>({meshes:Object.keys(FV.meshes).length,nodes:FV.R.nodes.length})),frames=[];
 for(const v of [{width:960,height:800,d:26,n:'desktop'},{width:390,height:760,d:23,n:'mobil'}]){
  await page.setViewportSize({width:v.width,height:v.height});
  for(const t of [720,188])for(let i=0;i<4;i++){
   const state=await page.evaluate(({v,t,i})=>{S.time=t;const p=ALPINE.info().geometry.spots.hut;frame375(p[0]+Math.sin(p[3])*.55,p[2]+Math.cos(p[3])*.55,v.d,[.35,1.9,3.4,4.9][i],p[1]+.7,.92);return {meshes:Object.keys(FV.meshes).length,nodes:FV.R.nodes.length,lost:lost375,funTris:ALPINE.info().geometry.fun.v.length/27};},{v,t,i});
   frames.push({size:v.n,time:t,direction:i,...state});assert.equal(state.meshes,baseline.meshes);assert.equal(state.nodes,baseline.nodes);assert.equal(state.lost,0);
   await page.screenshot({path:out+'/'+v.n+'-'+(t===720?'tag':'nacht')+'-'+i+'.png'});
  }
 }
 const saved=await page.evaluate(()=>({before:JSON.parse(originalAssets375),after:JSON.parse(JSON.stringify({trees:S.farm.trees,objs:S.farm.objs,money:S.money}))}));assert.deepEqual(saved.after,saved.before);
 assert.ok(await page.evaluate(()=>[...document.scripts].some(s=>s.src.endsWith('alpine.js?v=414'))));assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/messwerte.json',JSON.stringify({baseline,frames,errors,preserved:true},null,2));
 console.log('OK v414 Browser: 16 Hüttenansichten (4 Richtungen, Tag/Nacht, Desktop/Mobilformat), keine zusätzlichen Meshes/Knoten, kein Contextverlust oder JavaScriptfehler, Spielobjekte und Geld erhalten.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
