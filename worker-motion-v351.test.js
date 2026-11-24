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
 run('allWorkers();');const points=[];for(let i=0;i<9;i++){C.idx=i;run('var s=S.farm.staff[idx],e=WV.staff.get(s.id),sl=CAMP.slotOf(s.id),T=CAMP.toolSpot(sl),P=STAFF_GEAR.parking(s,e),f=STAFF_GEAR.fit(s);');points.push(JSON.parse(run('JSON.stringify([T.lx,T.lz])')));assert.ok(run('Math.abs(T.lx)>=1.49'));assert.ok(run('P.y+f.lo[1]>=.159'));assert.ok(run('f.hi[0]-f.lo[0]<.81'));}
 for(let i=0;i<points.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(points[i][0]-points[j][0],points[i][1]-points[j][1])>=1.34);
});
test('v358 Fächerzahl folgt dem Team, Entfernen und Neueinstellen erzeugt keine zusätzlichen sichtbaren Regale',()=>{
 run('allWorkers();CAMP.attach(FV.R);var root=FV.R.nodes[FV.R.nodes.length-1];');
 const racks=()=>run('root.children.filter(n=>n.mesh.key==="camp_rack358"&&n.visible).length');
 assert.equal(racks(),9);
 run('S.farm.staff=S.farm.staff.slice(0,2);CAMP.syncRacks(FV.R);');assert.equal(racks(),2);
 run('S.farm.staff=[];CAMP.syncRacks(FV.R);');assert.equal(racks(),0);
 run('S.farm.staff=Object.keys(FSTAFF_ROLES).slice(0,3).map(role=>FARM_STORY.candidate(role));CAMP.tidy(new Set(S.farm.staff.map(s=>s.id)));CAMP.syncRacks(FV.R);');assert.equal(racks(),3);
});
test('v358 alter Frontregal-Weg wird ab tatsächlicher Position ohne Arbeitszeitverlust umgestellt',()=>{
 run(`allWorkers();var s=S.farm.staff[0],e=WV.staff.get(s.id),sl=CAMP.slotOf(s.id);
  staffGo(s,0,{k:'home',i:0});var j=s.job,st=j.stops[0],i=st.i;
  j.route.splice(i-1,3,CAMP.toW(-5.1,5.22));st.i=i-1;delete st.rack358;st.d=routeLen(j.route.slice(0,st.i+1));j.len=routeLen(j.route);
  var work=j.t1-j.t0-j.walk,before=[e.x,e.z],cash=S.money,inv=JSON.stringify(S.farm.inv);
  STAFF_GEAR.relocate(s,e,j);var T=CAMP.toolSpot(sl),at=j.route[st.i],saved=JSON.stringify(j);STAFF_GEAR.relocate(s,e,j);`);
 assert.ok(run('Math.hypot(at[0]-T.sx,at[1]-T.sz)<.01'));
 assert.ok(run('Math.abs((j.t1-j.t0-j.walk)-work)<1e-8'));
 assert.equal(run('JSON.stringify(j)'),run('saved'));assert.ok(run('e.x===before[0]&&e.z===before[1]'));
 assert.equal(run('S.money'),run('cash'));assert.equal(run('JSON.stringify(S.farm.inv)'),run('inv'));
});
test('v358 Laden während der Pause lässt das Ende um 13 Uhr und erledigte Arbeit unverändert',()=>{
 run(`allWorkers();var s=S.farm.staff[0],e=WV.staff.get(s.id);staffGo(s,0,{k:'home',i:0});var j=s.job;delete j.stops[0].rack358;
  j.k='lunch';j.t0=700;j.walk=10;j.t1=780;s.jobEnd=780;S.time=750;var before=JSON.stringify([j.t0,j.walk,j.t1,s.jobEnd]);
  STAFF_GEAR.relocate(s,e,j);`);
 assert.equal(run('JSON.stringify([j.t0,j.walk,j.t1,s.jobEnd])'),run('before'));assert.ok(run('j.stops[0].rack358'));
});
test('Rückwege nach der Pause verlassen das Camp durch den Eingang und erreichen alle neun Arbeitsplätze',()=>{
 run(`allWorkers();PEOPLE_TRAFFIC.reset();for(let i=0;i<9;i++)staffGo(S.farm.staff[i],i,{k:'home',i});var crossed=0,maxJump=0,jumpInfo=null;var oldMoney=S.money,oldInv=JSON.stringify(S.farm.inv);for(let i=0;i<6500;i++){var before=new Map([...WV.staff].map(([id,e])=>[id,[e.x,e.z]]));S.time+=.02;simTime=i*.05;stepStaff(.05,simTime);PEOPLE_TRAFFIC.step(.05);STAFF_WALK.step(.05,simTime);STAFF_GEAR.step(.05,simTime);for(const s of S.farm.staff){const e=WV.staff.get(s.id),b=before.get(s.id);if(navHit(...b,e.x,e.z,navWallsFor(s.role)))crossed++;var jump=Math.hypot(e.x-b[0],e.z-b[1]);if(jump>maxJump){maxJump=jump;jumpInfo={role:s.role,frame:i,from:b,to:[e.x,e.z],fixed:!!e.gearAction};}}}var distances=S.farm.staff.map(s=>{const e=WV.staff.get(s.id);return [s.role,Math.hypot(e.x-s.job.x,e.z-s.job.z)];});`);
 assert.ok(run('distances.every(q=>q[1]<.2)'),run('JSON.stringify(distances)'));assert.equal(run('crossed'),0);assert.ok(run('maxJump<.7'),run('JSON.stringify({maxJump,jumpInfo})'));assert.equal(run('S.money'),run('oldMoney'));assert.equal(run('JSON.stringify(S.farm.inv)'),run('oldInv'));
});
/* v388: Pausenende – alle verlassen gleichzeitig das Camp. Vorher wichen sich die Kräfte in der einen Person breiten Werkzeuggasse
   gegenseitig aus, wurden auf ihre Route zurückgezogen und wichen wieder aus (gemessen bis 11 Richtungswechsel je Kraft, die Uhr ihres
   Wegs stand still). Erlaubt sind die Wenden des Wegs selbst (in die eigene Fachbahn hinein und wieder heraus). */
test('v388 Pausenende: niemand pendelt im Camp hin und her',()=>{
 run(`allWorkers();PEOPLE_TRAFFIC.reset();for(let i=0;i<9;i++)staffGo(S.farm.staff[i],i,{k:'home',i});var rev={},dir={},last={};
  for(let i=0;i<4000;i++){S.time+=.02;simTime=i*.05;stepStaff(.05,simTime);PEOPLE_TRAFFIC.step(.05);STAFF_WALK.step(.05,simTime);STAFF_GEAR.step(.05,simTime);
   for(const s of S.farm.staff){const e=WV.staff.get(s.id),p=last[s.id];if(!p){last[s.id]=[e.x,e.z];continue;}const dx=e.x-p[0],dz=e.z-p[1],l=Math.hypot(dx,dz);if(l<.03)continue;
    const d=[dx/l,dz/l],o=dir[s.id];if(o&&d[0]*o[0]+d[1]*o[1]<-.5)rev[s.role]=(rev[s.role]||0)+1;dir[s.id]=d;last[s.id]=[e.x,e.z];}}
  var worst=Math.max(0,...Object.values(rev));`);
 assert.ok(run('worst<=3'),run('JSON.stringify(rev)'));
});
/* v462: Fischer auf dem Steg stand auf Bodenhöhe und steckte mit den Füßen in den Planken (Oberkante 0,135) */
test('v463 Steg: Kraft steht auf den Planken, abseits des Stegs auf dem Boden',()=>{
 run(`allWorkers();S.farm.objs.push({t:'f_steg',id:S.farm.seq++,x:-7,z:18.5});var st=farmObj1('f_steg'),sp=staffStegSpot(st);`);
 assert.ok(run('Math.abs(staffDeckY(sp[0],sp[1])-.135)<.001'),run('staffDeckY(sp[0],sp[1])'));
 assert.equal(run('staffDeckY(sp[0]+3,sp[1])'),0);assert.equal(run('staffDeckY(sp[0],sp[1]-9)'),0);
 run(`var fs=S.farm.staff.find(s=>s.role==='fischer'),fe=WV.staff.get(fs.id);fe.x=sp[0];fe.z=sp[1];fs.px=sp[0];fs.pz=sp[1];fs.job=null;stepStaff(.05,1);`);
 assert.ok(run('fe.node.y>=.135'),run('fe.node.y'));
});
/* v476: Bei Tempo 30× lag die Figur 80–140 Einheiten hinter dem Fahrplan (feste Gehgeschwindigkeit) – Pause „verzögert“, langes Rennen. Nach langer
   Abwesenheit der Hofansicht springt sie unbemerkt an die Planstelle auf dem Weg. */
test('v476 Tempo 30×: Figur folgt dem Fahrplan, nach Abwesenheit springt sie auf den Weg',()=>{
 run(`allWorkers();PEOPLE_TRAFFIC.reset();S.time=11*60;for(let i=0;i<9;i++)staffGo(S.farm.staff[i],i,{k:'home',i});S.speed=30;var lag={},seen={};
  for(let i=0;i<500;i++){S.time+=.05*30;simTime+=.05;stepStaff(.05,simTime);for(const s of S.farm.staff){const j=s.job;if(!j||!j.route||seen[s.id]===j)continue;if(S.time>=j.t0+j.walk){const e=WV.staff.get(s.id),q=routeAt(j.route,j.len||routeLen(j.route));lag[s.role]=Math.hypot(e.x-q[0],e.z-q[1]);seen[s.id]=j;}}}
  var worstLag=Math.max(0,...Object.values(lag));`);
 assert.ok(run('Object.keys(lag).length>=7'));assert.ok(run('worstLag<10'),run('JSON.stringify(lag)'));
 run(`allWorkers();PEOPLE_TRAFFIC.reset();S.speed=1;S.time=11*60;for(let i=0;i<9;i++)staffGo(S.farm.staff[i],i,{k:'home',i});for(let i=0;i<60;i++){S.time+=.05;simTime+=.05;stepStaff(.05,simTime);}
  var jobs=S.farm.staff.map(s=>s.job);S.time+=Math.min(...jobs.map(j=>j.t0+j.walk))-S.time-3;stepStaff(.05,simTime+=.05);stepStaff(.05,simTime+=.05);var far=0;
  for(const s of S.farm.staff){const j=s.job,e=WV.staff.get(s.id);if(!j||!j.route||j!==jobs[S.farm.staff.indexOf(s)])continue;far=Math.max(far,routeProject(j.route,e.x,e.z).dist);}`);
 assert.ok(run('far<.5'),run('far'));
});
test('Übergabe wartet am Fach, läuft sichtbar ab und wird nach dem Laden nicht erneut begonnen',()=>{
 run(`allWorkers();var s=S.farm.staff[0],e=WV.staff.get(s.id);staffGo(s,0,{k:'home',i:0});var j=s.job,st=j.stops[0],at=j.route[st.i],total=j.len+j.stops.reduce((n,q)=>n+q.w,0);j.t0=S.time-st.d*j.walk/total;e.x=at[0]+2;e.z=at[1];for(let i=0;i<20;i++){S.time+=.01;STAFF_GEAR.prepare(s,e,.02,.01);}var waited=e.gearAction.t;e.x=at[0];e.z=at[1];for(let i=0;i<92;i++){S.time+=.01;STAFF_GEAR.prepare(s,e,.02,.01);}var finished=st.done351;s.job=JSON.parse(JSON.stringify(j));e.gearAction=null;STAFF_GEAR.prepare(s,e,.02,.01);`);
 assert.equal(run('waited'),0);assert.equal(run('finished'),true);assert.equal(run('e.gearAction'),null);
});
/* v426: Wald-Arbeitsplatz darf nach dem Vorziehen nicht wieder im Baum liegen. */
test('v426 Holzfäller: freie Baumplätze und kein Pendeln auch bei alten gespeicherten Zielen',()=>{
 for(const legacy of [false,true]){
  C.legacy=legacy;
  run(`allWorkers();S.time=1100;var s=S.farm.staff.find(s=>s.role==='holzfaeller'),e=WV.staff.get(s.id);S.farm.staff=[s];
   var blocked=S.farm.trees.filter(t=>t.st==='up').filter(t=>{const p=staffTreeSpot(t,s.role);return navBlockedAt(p.x,p.z);});`);
  assert.equal(run('blocked.length'),0,'Baumplätze liegen auf freien Zellen');
  run(`var t=S.farm.trees.find(t=>t.id===1);e.x=e.node.x=s.px=27.5;e.z=e.node.z=s.pz=-9.5;staffGo(s,0,{k:'fell',tid:t.id,what:'fällt eine Birke'});
   if(legacy){var p=[27.5,-9.5],dx=t.x-p[0],dz=t.z-p[1],l=Math.hypot(dx,dz);s.job.x=p[0]+dx/l*(l-.7);s.job.z=p[1]+dz/l*(l-.7);s.job.route[s.job.route.length-1]=[s.job.x,s.job.z];s.job.len=routeLen(s.job.route);s.job=JSON.parse(JSON.stringify(s.job));}
   var cash=S.money,inv=JSON.stringify(S.farm.inv),rev426=0,dir426=null,last426=[e.x,e.z],trail426=[];PEOPLE_TRAFFIC.reset();
   for(let f=0;f<600;f++){S.time+=.05;simTime=f*.05;stepStaff(.05,simTime);PEOPLE_TRAFFIC.step(.05);
    const dx=e.x-last426[0],dz=e.z-last426[1],l=Math.hypot(dx,dz);if(l>.03){const d=[dx/l,dz/l];if(dir426&&d[0]*dir426[0]+d[1]*dir426[1]<-.5)rev426++;dir426=d;last426=[e.x,e.z];}
    if(f>500)trail426.push([e.x,e.z]);}
   var report426={legacy,rev:rev426,dist:Math.hypot(e.x-s.job.x,e.z-s.job.z),blocked:navBlockedAt(s.job.x,s.job.z),moving:e.mv};`);
  assert.ok(run('rev426<=3'),run('JSON.stringify(report426)'));
  assert.ok(run('report426.dist<.06&&!report426.blocked&&!report426.moving'),run('JSON.stringify(report426)'));
  assert.ok(run('trail426.every(p=>Math.hypot(p[0]-e.x,p[1]-e.z)<.01)'),'Arbeitsplatz stabil');
  assert.equal(run('S.money'),run('cash'));assert.equal(run('JSON.stringify(S.farm.inv)'),run('inv'));
 }
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
  /* v354: Schieben ist jetzt Schritt 3 (hinaus) und 15 (hinein); Halt statt blocked. */
  for(const index of [3,15])for(let k=0;k<40;k++){C.pushIndex=index;C.f=k/40;run(`var L=VILLAGE.home(id).life.active;L.index=pushIndex;L.at=S.time-L.steps[pushIndex].duration*f;L.lastTime=S.time;var actor=VILLAGE_PEOPLE._world.actors.get(id);actor.prevN=actor.prevB=null;VILLAGE_PEOPLE.step(.05,20);if(L.steps[pushIndex].kind!=='push'||!VILLAGE_SITE.bikeClear(actor.bike.x,actor.bike.z,actor.bike.ry)||VILLAGE_SITE.blocked(actor.node.x,actor.node.z,.3)||L.hold)badPush.push({id,index:pushIndex,f,x:actor.bike.x,z:actor.bike.z,ry:actor.bike.ry,body:L.hold});`);}
 }
 assert.equal(run('badPush.length'),0,run('JSON.stringify(badPush.slice(0,5))'));
});
/* v445: Neuplanung ist begrenzt (sonst schiebt sie das Auftragsende ewig nach hinten); nächster Weg beginnt an der echten Figurenposition */
test('v445 Neuplanungen je Auftrag begrenzt, Auftragsende nimmt die Figurenposition mit',()=>{
 run(`allWorkers();var s=S.farm.staff[0],e=WV.staff.get(s.id);staffGo(s,0,{k:'home',i:0});var j=s.job;e.x=10;e.z=10;var n=0;for(let i=0;i<12;i++)if(staffRepath351(e,j))n++;`);
 assert.ok(run('n<=6&&j.rp445>6'),'Neuplanungen '+run('n'));
 run(`s.job={k:'home',x:-4.5,z:-5.5,t1:S.time-1,t0:S.time-2,walk:1};e.x=-0.5;e.z=-5.5;staffWork();`);
 assert.ok(run('Math.abs(s.px+0.5)<1e-6&&Math.abs(s.pz+5.5)<1e-6'),'px '+run('s.px'));
});
console.log(count+' Bewegungs-/Werkzeugprüfungen bestanden.');
