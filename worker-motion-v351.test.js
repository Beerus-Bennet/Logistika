/* v351: Laufbewegung, Werkzeugstation, Camp-Ausgang und Fahrradstellplätze.
   Ohne Pakete: node worker-motion-v351.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,addEventListener(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js','villagedata.js','places.js','map.js','game.js','farm.js','erbe.js','village.js','gl3d.js','farmmodels.js','woodmodels.js','fishmodels.js','rent.js','hunt.js'])run(read(f));
run(`
 var notices=[];
 toast=m=>notices.push(m);save=()=>{};render=()=>{};renderInspector=()=>{};mapRedraw=()=>{};logMoney=()=>{};
 checkLevel=()=>{};farmCheckLevel=()=>{};farmEvent=()=>{};
 function umschlagFactor(){return 1;}function tickBases(){}function baseDayChange(){}function staffPerk(){return 0;}
 spawnOrders=()=>0;spawnJewels=()=>{};
 function fresh(lv=111){
  S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:600,lastDay:0,player:{company:'Test'},bases:[],fleet:[]});
  farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=(lv-1)**2*50;S.farm.lvSeen=lv;S.farm.tut.done=true;
  S.farm.econ238=1;S.farm.cap.silo=10;S.farm.cap.barn=10;
  S.farm.objs.push({t:'lagerhalle',id:S.farm.seq++,x:1,z:20,sz:[10,6]});
  S.orders=[];notices=[];clearRouteCache();
 }
`);


for(const f of ['avatar.js','farmstory.js','intro.js','farmview.js','camp.js','staffwalk.js','staffgear.js','team.js','staffseat.js'])run(read(f));
run(`phoneMsg=m=>notices.push(m);
 function prepared(){fresh(25);S.farm.areas.wald=true;S.farm.areas.see=true;S.farm.areas.saege=true;}
`);


run(`var WV={staff:new Map(),bgChunks:new Map(),bushes:[],rockObs:[]};forestK=()=>0;prepared();S.farm.areas.altwald=true;
var simTime=0;wnow=()=>simTime;var meshes=new Map();fmesh=(key,fn)=>{if(!meshes.has(key))meshes.set(key,{key,data:fn()});return meshes.get(key);};
fnode=(mesh,props)=>Object.assign({mesh,x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1,visible:true,children:[]},props);
FV.R={nodes:[],cam:{tx:0,tz:0},addChild:(p,c)=>{p.children.push(c);c.parent=p;return c;},burst(){}};
function allWorkers(){prepared();S.farm.areas.altwald=true;WV.staff.clear();FV.R.nodes=[];S.farm.staff=Object.keys(FSTAFF_ROLES).map((role,i)=>{const s=FARM_STORY.candidate(role),sl=CAMP.slots[i];s.px=sl.x;s.pz=sl.z;CAMP.assign(sl.id,s.id);return s;});worldSyncStaff();}
`);
run(read('peopletraffic.js'));
let count=0;const test=(n,f)=>{f();console.log('ok '+(++count)+' '+n);};
test('Alle neun Berufe haben getrennte Beine und einen freien beweglichen Arm',()=>{
 run('allWorkers();');assert.ok(run('[...WV.staff.values()].every(e=>e.walkRig.legs.length===2&&e.walkRig.left!==e.arm)'));
});
test('Schritte hängen vom Weg ab; Warten bewegt keine Beine weiter',()=>{
 run(`var e=WV.staff.values().next().value,s=S.farm.staff[0];var initial=e.walkRig.phase;for(let i=0;i<20;i++){e.x+=.02;e.node.x=e.x;STAFF_WALK.step(.02,i*.02);}var advanced=e.walkRig.phase;for(let i=0;i<50;i++)STAFF_WALK.step(.02,1+i*.02);`);
 assert.ok(run('advanced>initial'));assert.equal(run('e.walkRig.phase'),run('advanced'));assert.equal(run('e.walkRig.weight'),0);
});
test('Stützfuß bleibt am Boden, beide Beinlängen und Sohlenwinkel bleiben konstant',()=>{
 for(let i=0;i<60;i++){C.angle=i*Math.PI/30;run('var leg=e.walkRig.legs[0],z=Math.cos(angle)*.11,lift=Math.max(0,Math.sin(angle))*.075;STAFF_WALK.footAt(leg,z,-.402+lift);var a=-leg.thigh.rx,k=leg.shin.rx,yy=.402-STAFF_WALK.U*Math.cos(a)-STAFF_WALK.L*Math.cos(a-k),zz=STAFF_WALK.U*Math.sin(a)+STAFF_WALK.L*Math.sin(a-k);');assert.ok(Math.abs(run('yy-lift'))<1e-6);assert.ok(Math.abs(run('zz-z'))<1e-6);assert.ok(Math.abs(run('leg.thigh.rx+leg.shin.rx+leg.foot.rx'))<1e-6);}
});
test('Sitz-/Laufgelenke sind nie gleichzeitig sichtbar; nach Aufstehen wieder zwei Beine',()=>{
 run(`allWorkers();var s=S.farm.staff[0],e=WV.staff.get(s.id),sl=CAMP.slotOf(s.id),st=CAMP.toW(...CAMP.standPt(sl));e.x=e.node.x=st[0];e.z=e.node.z=st[1];for(let i=0;i<140&&!e.isSit;i++)staffSitDown(s,e,sl,1/60);`);
 assert.equal(run('e.walkRig.group.visible'),false);run('for(let i=0;i<120;i++)staffRise(s,e,1/60);');assert.equal(run('e.walkRig.group.visible'),true);assert.equal(run('e.seatRig.active'),false);
});
test('Werkzeugfächer liegen seitlich mit Abstand; Langgeräte stehen und Kleinteile liegen erhöht',()=>{
 run('allWorkers();');const points=[];for(let i=0;i<9;i++){C.idx=i;run('var s=S.farm.staff[idx],e=WV.staff.get(s.id),sl=CAMP.slotOf(s.id),T=CAMP.toolSpot(sl),P=STAFF_GEAR.parking(s,e),f=STAFF_GEAR.fit(s);');points.push(JSON.parse(run('JSON.stringify([T.lx,CAMP.TOOL_Z])')));assert.ok(run('Math.abs(T.lx)>=1.49'));assert.ok(run('P.y+f.lo[1]>=.159'));assert.ok(run('f.hi[0]-f.lo[0]<.81'));}
 for(let i=0;i<points.length;i++)for(let j=0;j<i;j++)assert.ok(Math.abs(points[i][0]-points[j][0])>=.89);
});
test('Rückwege nach der Pause verlassen das Camp durch den Eingang und erreichen alle neun Arbeitsplätze',()=>{
 run(`allWorkers();PEOPLE_TRAFFIC.reset();for(let i=0;i<9;i++)staffGo(S.farm.staff[i],i,{k:'home',i});var crossed=0,maxJump=0;var oldMoney=S.money,oldInv=JSON.stringify(S.farm.inv);for(let i=0;i<6500;i++){var before=new Map([...WV.staff].map(([id,e])=>[id,[e.x,e.z]]));S.time+=.02;simTime=i*.05;stepStaff(.05,simTime);PEOPLE_TRAFFIC.step(.05);STAFF_WALK.step(.05,simTime);STAFF_GEAR.step(.05,simTime);for(const s of S.farm.staff){const e=WV.staff.get(s.id),b=before.get(s.id);if(navHit(...b,e.x,e.z,navWallsFor(s.role)))crossed++;maxJump=Math.max(maxJump,Math.hypot(e.x-b[0],e.z-b[1]));}}var distances=S.farm.staff.map(s=>{const e=WV.staff.get(s.id);return [s.role,Math.hypot(e.x-s.job.x,e.z-s.job.z)];});`);
 assert.ok(run('distances.every(q=>q[1]<.2)'),run('JSON.stringify(distances)'));assert.equal(run('crossed'),0);assert.ok(run('maxJump<.7'));assert.equal(run('S.money'),run('oldMoney'));assert.equal(run('JSON.stringify(S.farm.inv)'),run('oldInv'));
});
test('Übergabe wartet am Fach, läuft sichtbar ab und wird nach dem Laden nicht erneut begonnen',()=>{
 run(`allWorkers();var s=S.farm.staff[0],e=WV.staff.get(s.id);staffGo(s,0,{k:'home',i:0});var j=s.job,st=j.stops[0],at=j.route[st.i],total=j.len+j.stops.reduce((n,q)=>n+q.w,0);j.t0=S.time-st.d*j.walk/total;e.x=at[0]+2;e.z=at[1];for(let i=0;i<20;i++){S.time+=.01;STAFF_GEAR.prepare(s,e,.02,.01);}var waited=e.gearAction.t;e.x=at[0];e.z=at[1];for(let i=0;i<92;i++){S.time+=.01;STAFF_GEAR.prepare(s,e,.02,.01);}var finished=st.done351;s.job=JSON.parse(JSON.stringify(j));e.gearAction=null;STAFF_GEAR.prepare(s,e,.02,.01);`);
 assert.equal(run('waited'),0);assert.equal(run('finished'),true);assert.equal(run('e.gearAction'),null);
});
run(read('villagesite.js'));run(read('villagepeople.js'));
test('Fahrräder stehen vollständig auf den Stellflächen innerhalb aller bewohnten Grundstücke',()=>{
 run(`prepared();for(const h of Object.values(VILLAGE.state().homes)){h.status='ready';h.type='familie';}var bikeBad=VILLAGE_DATA.plots.filter(p=>{const a=VILLAGE_SITE.bikePark(p);return !VILLAGE_SITE.bikeClear(...a,0);}).map(p=>p.id);`);
 assert.equal(run('JSON.stringify(bikeBad)'),'[]');
});
test('Ein alter direkter Weg durch den Sägewerkszaun wird durch das Tor ersetzt',()=>{
 run(`allWorkers();var s=S.farm.staff[0],e=WV.staff.get(s.id);e.x=e.node.x=-55.5;e.z=e.node.z=-52.5;var j=s.job={k:'home',x:-52.5,z:-52.5,fx:-52.5,fz:-51.5,route:[[-55.5,-52.5],[-52.5,-52.5]],len:3,walk:1,t0:S.time-1,t1:S.time+30};e.rj=j;e.rs=0;var crossed=0;for(let i=0;i<1000;i++){const x=e.x,z=e.z;staffFollow(e,j,routeLen(j.route),.05);if(navHit(x,z,e.x,e.z,navWallsFor(s.role)))crossed++;}`);
 assert.equal(run('crossed'),0);assert.ok(run('j.route.length>2'));assert.ok(run('Math.hypot(e.x-j.x,e.z-j.z)<.05'));
});
test('Beide Schieberichtungen passieren die Gartentore mit dem ganzen Rad',()=>{
 run(`prepared();S.time=600;for(const h of Object.values(VILLAGE.state().homes))h.life={mailDay:0,shopDay:0};VILLAGE_PEOPLE.attach(FV.R);var badPush=[];`);
 for(const id of ['000','001']){C.id=id;assert.ok(run('VILLAGE_PEOPLE.start(id,"shop",false)'));
  for(const index of [2,13])for(let k=0;k<40;k++){C.pushIndex=index;C.f=k/40;run(`var L=VILLAGE.home(id).life.active;L.index=pushIndex;L.at=S.time-L.steps[pushIndex].duration*f;L.lastTime=S.time;var actor=VILLAGE_PEOPLE._world.actors.get(id);actor.prevN=actor.prevB=null;VILLAGE_PEOPLE.step(.05,20);if(!VILLAGE_SITE.bikeClear(actor.bike.x,actor.bike.z,actor.bike.ry)||L.blocked)badPush.push({id,index:pushIndex,f,x:actor.bike.x,z:actor.bike.z,ry:actor.bike.ry,body:L.blocked});`);}
 }
 assert.equal(run('badPush.length'),0,run('JSON.stringify(badPush.slice(0,5))'));
});
console.log(count+' Bewegungs-/Werkzeugprüfungen bestanden.');
