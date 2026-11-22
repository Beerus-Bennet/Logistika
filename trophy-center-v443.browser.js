/* v443: Präparate mit ihren tatsächlichen Sockeln in Chromium ansehen. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-v443';fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1080,height:900},deviceScaleFactor:1}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto((process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8014')+'/docs/');
 await p.setContent('<style>body{margin:0;background:#edf3e7;color:#102333;font:16px sans-serif}h1{font-size:24px;margin:20px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}article{text-align:center;background:#fff9ec;border:2px solid #102333;border-radius:18px}canvas{width:100%;height:340px;display:block}h2{margin:12px}</style><h1>Trophäen mittig auf ihren Sockeln</h1><div class="grid"></div>');
 for(const f of ['gl3d.js','hunt.js'])await p.addScriptTag({url:(process.env.LOGISTIKA_TEST_URL||'http://127.0.0.1:8014')+'/'+f});
 const stats=await p.evaluate(()=>{
  window.scenes=[];
  for(const pitch of [.45,1.35])for(const [k,name] of [['hirsch','Rothirsch'],['keiler','Keiler'],['fasan','Fasan']]){
   const rec={k,m:3,s:.8,vr:1,gn:HUNT.genes(k,.8,77)},mb=HUNT.trophyBuild(rec),el=document.createElement('article');el.innerHTML='<h2>'+name+(pitch>1?' · von oben':'')+'</h2><canvas></canvas>';document.querySelector('.grid').append(el);
   const R=G3.create(el.querySelector('canvas'),{shadowSize:512,maxDpr:1}),mesh=R.mesh(mb),box=mesh.box;
   R.nodes.push(R.node(mesh,{}));R.env.sun=G3.norm([-.4,.8,.4]);R.env.fogR=[400,800];
   Object.assign(R.cam,{tx:0,ty:mb._stand.height*.46,tz:0,dist:Math.max(mb._stand.radius*4.8,mb._stand.height*2.5),yaw:.65,pitch,fov:.55,near:.02,far:100});R.render(0);scenes.push(R);
  }
  return scenes.map(R=>({nodes:R.nodes.length,vertices:R.nodes[0].mesh.box}));
 });assert.equal(stats.length,6);assert.ok(stats.every(s=>s.nodes===1));await p.screenshot({path:out+'/sockel-alle.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('OK v443: Hirsch, Keiler und Fasan schräg/von oben mit echten Sockeln gerendert; keine JavaScriptfehler.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
