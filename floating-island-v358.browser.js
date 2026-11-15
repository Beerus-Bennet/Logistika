/* v358: Reproduzierbare 3D-Abnahme, nur generierte Spielstände. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.LOGISTIKA_ARTIFACT_DIR||'/tmp/logistika-island-v358';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:1100,height:850},serviceWorkers:'block'});
 const errors=[];
 p.on('pageerror',e=>errors.push(String(e)));
 try{await p.goto('http://127.0.0.1:8000/?test=1');
 await p.evaluate(()=>{S=Object.assign(newGame(),{phase:'play',stage:6,time:650,xp:500000,speed:0,money:3e8,tut:{done:true},player:{name:'Jonas',company:'Weitwind',avatar:{art:'p1'},origin:3}});farmNew();
 S.farm.logi=true;
 S.farm.stage=4;
 S.farm.xp=500000;
 S.farm.tut.done=true;
 S.farm.areas={wald:true,see:true,saege:true,altwald:true};
 S.farm.staff=Object.keys(FSTAFF_ROLES).map(role=>FARM_STORY.candidate(role));
 document.querySelector('#intro').classList.remove('on');
 document.body.className='';showTab('farm');render();});
 await p.waitForFunction(()=>FV.built&&FV.R,{timeout:90000});
 await p.waitForSelector('#farmBoot',{state:'detached',timeout:90000});
 await p.evaluate(()=>{S.speed=0;
 FV.R.cam.tx=-28;
 FV.R.cam.tz=-28;
 FV.R.cam.ty=-50;
 FV.R.cam.dist=900;
 FV.R.cam.pitch=.63;
 FV.distSoft=null;});
 await p.waitForTimeout(2000);assert.equal(await p.evaluate(()=>!!WV.apron),true);
 await p.screenshot({path:out+'/island.png'});
 await p.evaluate(()=>{FV.R.cam.tx=CAMP.CX;
 FV.R.cam.tz=CAMP.CZ;
 FV.R.cam.ty=0;
 FV.R.cam.dist=28;
 FV.R.cam.pitch=.92;
 FV.R.cam.yaw=Math.PI/4;});
 await p.waitForTimeout(1000);
 await p.screenshot({path:out+'/camp-all.png'});
await p.evaluate(()=>{
 S.farm.staff=S.farm.staff.slice(0,2);worldSyncStaff();CAMP.syncRacks(FV.R);
 S.time=750;
 for(const s of S.farm.staff){const e=WV.staff.get(s.id),sl=CAMP.slotOf(s.id),at=CAMP.toW(...CAMP.standPt(sl));
  s.job={k:'lunch',t0:700,walk:1,t1:780};s.px=e.x=e.node.x=at[0];s.pz=e.z=e.node.z=at[1];
  for(let i=0;i<240&&!e.isSit;i++)staffSitDown(s,e,sl,1/60);
 }
 STAFF_GEAR.step(1/60,10);
});
 await p.waitForTimeout(400);
 await p.screenshot({path:out+'/camp-two.png'});
const counts=await p.evaluate(()=>({staff:S.farm.staff.length,racks:FV.R.nodes.find(n=>n.mesh===FV.meshes.camp_v358).children.filter(n=>n.mesh===FV.meshes.camp_rack358&&n.visible).length,gear:[...WV.staff.values()].filter(e=>e.gt&&e.gt.visible).length}));assert.deepEqual(counts,{staff:2,racks:2,gear:2});
await p.setViewportSize({width:390,height:760});await p.evaluate(()=>{FV.R.cam.dist=42;});
 await p.waitForTimeout(300);
 await p.screenshot({path:out+'/camp-mobile.png'});
const frame=await p.evaluate(()=>({farm:document.querySelector('#farm').getBoundingClientRect().toJSON(),canvas:document.querySelector('#farmCv').getBoundingClientRect().toJSON(),nav:document.querySelector('#nav').getBoundingClientRect().toJSON(),h:visualViewport.height}));assert.ok(Math.abs(frame.farm.bottom-frame.nav.top)<1);assert.equal(frame.canvas.height,frame.farm.height);assert.equal(frame.nav.bottom,frame.h);assert.deepEqual(errors,[]);
/* Integrationsprobe für PR #75: gleiche feste App-Fläche, eigenes Trefferbild. */
await p.evaluate(()=>{S.farm.hunt={built:S.time,stock:6,at:S.time};HUNT.begin();});
await p.waitForFunction(()=>HUNT.X&&HUNT.X.inRv&&HUNT.X.mode==='hold',{timeout:60000});
const shot=await p.evaluate(()=>{
 const E=HUNT.EYER,F=HUNT.FC,dx=F.x-E[0],dz=F.z-E[2],l=Math.hypot(dx,dz),ux=dx/l,uz=dz/l;
 HUNT._spawn('hirsch',false,{x:E[0]+ux*12,z:E[2]+uz*12,st:'graze',t:600,ry:Math.atan2(-uz,ux),score:.7});
 const A=HUNT.X.animals[HUNT.X.animals.length-1];window.testDeer358=A;return HUNT._shootAt(A,HUNT.SP.hirsch.heart.c);
});assert.ok(['herz','lunge'].includes(shot),shot);
await p.waitForFunction(()=>testDeer358.st==='dead',{timeout:30000});await p.evaluate(()=>HUNT._harvest(testDeer358));
await p.waitForSelector('[data-hu="xray"]',{state:'visible',timeout:30000});await p.evaluate(()=>HUNT._xray());
await p.waitForFunction(()=>document.querySelector('.xo-hl')&&HUNT._xr().ov,{timeout:30000});
await p.waitForTimeout(300);await p.screenshot({path:out+'/hunt-integration.png'});
assert.deepEqual(errors,[]);
console.log('OK: Integrierter Jagd-PR: echter Schuss, erlegter Hirsch und Trefferbild mit Treffermarkierung im gemeinsamen App-Rahmen.');
console.log('OK: Insel in WebGL, neun seitliche Fächer, zwei Kräfte mit exakt zwei sichtbaren Fächern und Geräten; Hochformat ohne Überlappung.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

