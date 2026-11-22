/* v446: Bewegte Gelenke und Fellvarianten in echten WebGL-Modellen. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8016',out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-v446';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1100,height:850},deviceScaleFactor:1}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(base+'/docs/');await p.setContent('<style>body{margin:0;background:#e8f0e1;color:#102333;font:15px sans-serif}h1{font-size:24px;margin:16px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}article{background:#fff9eb;border:2px solid #142636;border-radius:16px;text-align:center}canvas{display:block;width:100%;height:215px}h2{font-size:16px;margin:10px}</style><h1>Tierleben: Schritte und Fellvarianten</h1><div class="grid"></div>');
 for(const f of ['gl3d.js','farmmodels.js','woodmodels.js','animalmotion.js'])await p.addScriptTag({url:base+'/'+f});
 await p.evaluate(()=>{
  window.animations=[];
  const examples=[['squirrel','normal','Eichhörnchen · kupferrot'],['squirrel','albino','Eichhörnchen · Albino'],['squirrel','black','Eichhörnchen · schwarzbraun'],['deer','piebald','Hirsch · gescheckt'],['boar','normal','Wildschwein · dunkel'],['boar','piebald','Wildschwein · gescheckt'],['fox','cross','Kreuzfuchs'],['hare','pale','Hase · sandfarben'],['dog','normal','Hund'],['cat','normal','Katze'],['goat','normal','Ziege'],['hedgehog','pale','Igel · hell']];
  for(const [k,look,title] of examples){const el=document.createElement('article');el.innerHTML='<h2>'+title+'</h2><canvas></canvas>';document.querySelector('.grid').append(el);
   const R=G3.create(el.querySelector('canvas'),{shadowSize:256,maxDpr:1}),root=R.node(null,{}),gait=ANIMAL_MOTION.wild(R,root,k,look);R.nodes.push(root);
   const all=new FM.MB().merge(FWM[k](),{}),box=R.mesh(all).box,radius=Math.max(.15,Math.hypot(...box[1].map((v,a)=>v-box[0][a]))/2),height=box[1][1]-box[0][1];
   const ground=new FM.MB().plate(radius*5,radius*5,0x91aa6b);R.nodes.unshift(R.node(R.mesh(ground),{y:-.01}));R.env.sun=G3.norm([-.4,.8,.4]);R.env.fogR=[400,800];
   Object.assign(R.cam,{tx:0,ty:height*.45,tz:(box[0][2]+box[1][2])/2,dist:radius*4.1,yaw:1.05,pitch:.25,fov:.55,near:.01,far:100});animations.push({R,gait,root,radius});
  }
  window.drawPose=(t,moving=true)=>{for(const a of animations){ANIMAL_MOTION.step(a.gait,moving?.003:0,1/60);a.R.render(t);}};
  for(let i=0;i<30;i++)drawPose(i/60);
 });await p.screenshot({path:out+'/varianten-und-schritte.png',fullPage:true});
 const first=await p.evaluate(()=>animations.map(a=>a.gait.legs.map(l=>l.node.rx)));
 await p.evaluate(()=>{for(let i=0;i<12;i++)drawPose(i/60);});const second=await p.evaluate(()=>animations.map(a=>a.gait.legs.map(l=>l.node.rx)));
 assert.notDeepEqual(first,second);await p.screenshot({path:out+'/schrittfolge.png',fullPage:true});
 await p.evaluate(()=>{for(let i=0;i<120;i++)drawPose(i/60,false);});assert.ok(await p.evaluate(()=>animations.every(a=>a.gait.amount===0)));assert.deepEqual(errors,[]);
 console.log('OK v446: zwölf Tier-/Fellansichten, sichtbare unterschiedliche Schrittphasen und ruhige Beine im Stand, keine JavaScriptfehler.');
 await p.close();
 // Integration: tatsächliche Spielskripte, Renderer und Wald-/Haustier-Schleifen.
 const game=await b.newPage({viewport:{width:390,height:760},isMobile:true,hasTouch:true});game.on('pageerror',e=>errors.push(String(e)));await game.goto(base+'/?test=1');
 await game.evaluate(()=>{
  S=Object.assign(newGame(),{phase:'play',stage:6,money:1e7,time:600,speed:0,tut:{done:true},player:{name:'Jonas',company:'Weitwind Spedition',origin:3,color:0,avatar:{art:'p1'}}});farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.tut.done=true;S.farm.snd=false;S.farm.areas={wald:true,see:true,saege:true,altwald:true};
  document.querySelector('#intro').classList.remove('on');document.body.className='has-farm tab-farm';activeTab='farm';FV.on=false;farmDOM();syncHeadH();FV.R=G3.create(document.querySelector('#farmCv'),{shadowSize:256,maxDpr:1});
  worldMakeWild0();window.snapshot444=JSON.stringify(S);
  // Navigation nur für diesen Bewegungsprüfstand gerade halten.
  window.wanderPlan=(w,x,z)=>{w.path=[[x,z]];};window.wanderMove=(w,d)=>{const dx=w.tx-w.x,dz=w.tz-w.z,l=Math.hypot(dx,dz),s=Math.min(l,d);w.x+=dx/l*s;w.z+=dz/l*s;return {h:Math.atan2(dx,dz),done:l<=d};};
  for(const w of WV.wild){w.D=Object.assign({},w.D,{win:[0,24]});WV.pres['w'+w.i]={on:true,t:99999};w.f=1;w.x=w.node.x=-4+w.i*.6;w.z=w.node.z=-4;w.tx=w.x;w.tz=1;w.wait=0;w.path=null;}
  Object.assign(FV.R.cam,{tx:0,tz:0,ty:.4,dist:13,yaw:.5,pitch:.55});
  for(let i=0;i<30;i++)stepWild(1/60,i/60);window.sameSave444=JSON.stringify(S)===snapshot444;FV.R.render(0);
 });
 const report=await game.evaluate(()=>({animals:WV.wild.length,joints:WV.wild.reduce((n,w)=>n+w.gait.legs.length,0),moving:WV.wild.filter(w=>w.gait.amount>.9).length,bounce:WV.wild.some(w=>w.node.y!==0),sameSave:sameSave444}));
 assert.equal(report.animals,16);assert.equal(report.moving,16);assert.equal(report.bounce,false);assert.equal(report.sameSave,true);assert.equal(report.joints,62);
 await game.screenshot({path:out+'/wald-mobil.png'});
 const extra=await game.evaluate(()=>{
  const before=WV.wild.map(w=>w.gait.phase);for(const w of WV.wild)w.wait=99;
  for(let i=0;i<120;i++)stepWild(1/60,i/60);
  const idle=WV.wild.every((w,i)=>w.gait.phase===before[i]&&w.gait.amount===0);
  const random=Math.random,rare=[];try{Math.random=()=>.995;for(const k of ['squirrel','deer','boar']){const w=WV.wild.find(w=>w.k===k);wildHome(w);rare.push(w.gait.look);}}finally{Math.random=random;}

  S.farm.cos.own.hund=1;S.farm.cos.own.katze=1;S.farm.cos.own.ziege=1;worldSyncPets();
  const saved=JSON.stringify(S);
  for(const p of WV.pets.values()){p.wait=0;p.tgt=[p.x,p.z+4];p.tk=null;}
  for(let i=0;i<30;i++)stepPets(1/60,i/60);
  const pets=Array.from(WV.pets.values()).filter(p=>p.node._gait.amount>.9&&p.node.y===0).length;
  const petsSave=JSON.stringify(S)===saved;
  FV.ani.clear();
  for(const [i,kind] of ['huhn','kuh','schwein','schaf','rind'].entries()){
   const o={t:FANIMALS[kind].house,id:500+i,x:15+i*8,z:12,lvl:1,animals:[{id:900+i,v:0,born:0,fed:S.time+1440,mast:FANIMALS[kind].mast||0}]};S.farm.objs.push(o);
   const a=o.animals[0],s=ensureAnimal(o,a),ar=penArea(o);s.x=s.node.x=ar.x1-1;s.z=s.node.z=ar.z1-1;s.tx=s.x;s.tz=ar.z1;s.t=10;s.mode='walk';
  }
  const farmSave=JSON.stringify(S);for(let i=0;i<30;i++)stepAnimals(1/60,i/60);
  const farm=Array.from(FV.ani.values()).filter(s=>s.gait&&s.gait.amount>.9&&s.node.y===0).length;
  const farmSaveOK=JSON.stringify(S)===farmSave,sheep=Array.from(FV.ani.values()).find(s=>s.kind==='schaf'),wool=sheep.node.mesh;
  const sheepRecord=animalById(sheep.id)[1];sheepRecord.fed=null;stepAnimals(1/60,1);
  const shorn=sheep.node.mesh!==wool&&sheep.node.children.length===4;
  const originalMesh=FV.R.mesh;let newMeshes=0;FV.R.mesh=(...args)=>{newMeshes++;return originalMesh(...args);};
  try{for(let i=0;i<180;i++){stepWild(1/60,i/60);stepPets(1/60,i/60);stepAnimals(1/60,i/60);}}finally{FV.R.mesh=originalMesh;}
  return {idle,rare,pets,petsSave,farm,farmSave:farmSaveOK,shorn,newMeshes};
 });
 assert.equal(extra.idle,true);assert.deepEqual(extra.rare,['albino','piebald','piebald']);assert.equal(extra.pets,3);assert.equal(extra.petsSave,true);assert.equal(extra.farm,5);assert.equal(extra.farmSave,true);assert.equal(extra.shorn,true);assert.equal(extra.newMeshes,0);
 assert.deepEqual(errors,[]);console.log('OK v446 Integration: '+JSON.stringify({...report,...extra}));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
