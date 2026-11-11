/* v349: Bekanntschaften, Arbeitsvereinbarungen und durchgehende Sitzpose.
   Ohne Pakete: node farmteam-v349.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,addEventListener(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js','villagedata.js','places.js','map.js','game.js','farm.js','erbe.js','village.js','gl3d.js','farmmodels.js','woodmodels.js','rent.js','hunt.js'])run(read(f));
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


for(const f of ['avatar.js','farmstory.js','intro.js','farmview.js','camp.js','team.js','staffseat.js'])run(read(f));
run(`staffHome=()=>[0,0];phoneMsg=m=>notices.push(m);
 function prepared(){fresh(25);S.farm.areas.wald=true;S.farm.areas.see=true;S.farm.areas.saege=true;}
`);
let count=0;function test(n,f){f();console.log('ok '+(++count)+' '+n);}
test('Neun Aufgaben haben eigene Personen und nachvollziehbare Verbindungen',()=>{
 assert.equal(run('Object.keys(FARM_STORY.people).length'),run('Object.keys(FSTAFF_ROLES).length'));
 assert.equal(run('new Set(Object.values(FARM_STORY.people).map(p=>p.name)).size'),9);
 assert.ok(run('Object.values(FARM_STORY.people).every(p=>p.arrival.length>100&&p.why.length>50&&p.tip.length>60)'));
});
test('Erwin kann früh beraten, ohne Mitarbeiter oder Kosten zu erzeugen',()=>{
 run('fresh(1);var before=S.money;FARM_STORY.meet("farmer");');assert.equal(run('S.farm.staff.length'),0);assert.equal(run('S.money'),run('before'));assert.equal(run('staffRoleOpen("farmer")'),false);
 assert.equal(run('FARM_STORY.speaker("farmer").name'),'Erwin Krüger');
});
test('Bekannte bleiben nach Tageswechsel und Speichern dieselben',()=>{
 run('prepared();var a=JSON.stringify(staffCands());S.time+=1440;S=JSON.parse(JSON.stringify(S));var b=JSON.stringify(staffCands());');assert.equal(run('a'),run('b'));
});
test('Kennenlernen ist kostenlos; erst bestätigte Zusammenarbeit bucht genau einmal',()=>{
 run('prepared();var c=staffCands().find(c=>c.role==="farmer"),before=S.money;');assert.equal(run('staffHire(c.id)'),false);assert.equal(run('S.money'),run('before'));
 run('FARM_STORY.meet("farmer");');assert.equal(run('staffHire(c.id)'),true);assert.equal(run('S.money'),run('before-c.wage*2'));assert.equal(run('S.farm.staff[0].name'),'Erwin Krüger');
 assert.equal(run('staffHire(c.id)'),false);assert.equal(run('S.money'),run('before-c.wage*2'));
 run('S=JSON.parse(JSON.stringify(S));');assert.equal(run('S.farm.staff.length'),1);assert.ok(run('FARM_STORY.state().agreed.farmer!==undefined'));
});
test('Fehlendes Geld und gesperrte Station verändern weder Team noch Kontostand',()=>{
 run('prepared();var c=staffCands().find(c=>c.role==="fischer");FARM_STORY.meet("fischer");S.money=0;');assert.equal(run('staffHire(c.id)'),false);assert.equal(run('S.farm.staff.length'),0);
 run('S.money=10000;S.farm.areas.see=false;');assert.equal(run('staffHire(c.id)'),false);assert.equal(run('S.money'),10000);
});
test('Bestehende Mitarbeiter behalten Namen, Fähigkeiten, Lohn und Identität',()=>{
 run('prepared();S.farm.staff=[{id:"alt",role:"farmer",name:"Mira",wage:37,perk:18,look:5,since:1}];var before=JSON.stringify(S.farm.staff);staffCands();FARM_STORY.meet("farmer");');assert.equal(run('JSON.stringify(S.farm.staff)'),run('before'));
 assert.equal(run('FARM_STORY.speaker("farmer").name'),'Erwin Krüger');assert.ok(run('!staffCands().some(c=>c.role==="farmer")'));
});
test('Neue Bekanntschaften werden einzeln und mit Abstand angekündigt',()=>{
 run('prepared();FARM_STORY.announce();FARM_STORY.announce();');assert.equal(run('notices.length'),1);
 run('S.time+=180;FARM_STORY.announce();');assert.equal(run('notices.length'),2);
 run('S=JSON.parse(JSON.stringify(S));FARM_STORY.announce();');assert.equal(run('notices.length'),2);
});
test('Hofkarte nennt Erwin, Logistikkarte Lina; Account-Hilfe hat kein Gesicht',()=>{
 run('prepared();var a=linaCardHTML({uid:"f",kind:"info",speaker:FARM_STORY.speaker("farmer"),title:"Ernte"}),b=linaCardHTML({uid:"l",kind:"info",title:"Lieferung"});');
 assert.match(run('a'),/Erwin Krüger/);assert.doesNotMatch(run('a'),/Lina Sturm/);assert.match(run('b'),/Lina Sturm/);assert.doesNotMatch(run('onboardingFigure()'),/lina.png|circle/);
});
run(`var meshes=new Map();fmesh=(key,fn)=>{if(!meshes.has(key))meshes.set(key,{key,data:fn()});return meshes.get(key);};
 fnode=(mesh,props)=>Object.assign({mesh,x:0,y:0,z:0,rx:0,ry:0,rz:0,visible:true,children:[]},props);
 FV.R={addChild:(p,c)=>{p.children.push(c);return c;}};
 function figure(role,sl){const s=FARM_STORY.candidate(role),st=CAMP.toW(...CAMP.standPt(sl)),e={key:staffKey(s),node:fnode('stand'),arm:fnode('arm'),head:fnode('head'),armM:'arm',x:st[0],z:st[1]};CAMP.assign(sl.id,s.id);return {s,e};}
`);
test('Alle neun Sitzplätze: fließend rückwärts setzen, feste Gelenklängen und Sohlenhöhe',()=>{
 run('prepared();');for(let i=0;i<9;i++){
  C.slotIndex=i;run('var sl=CAMP.slots[slotIndex],q=figure(Object.keys(FSTAFF_ROLES)[slotIndex],sl),prev=null,max=0;for(let f=0;f<140&&!q.e.isSit;f++){staffSitDown(q.s,q.e,sl,1/60);if(prev)max=Math.max(max,Math.hypot(q.e.node.x-prev[0],q.e.node.z-prev[1]));prev=[q.e.node.x,q.e.node.z];}');
  assert.equal(run('q.e.isSit'),true);assert.ok(run('max<.06'));assert.ok(run('Math.hypot(q.e.x-sl.x,q.e.z-sl.z)<.001'));
  for(let k=0;k<=20;k++){C.poseK=k/20;run('STAFF_SEAT.pose(q.e,poseK);');assert.ok(run('q.e.seatRig.legs.every(l=>Math.abs(l.thigh.y-STAFF_SEAT.U*Math.cos(-l.thigh.rx)-STAFF_SEAT.L-STAFF_SEAT.ANKLE)<1e-6)'));}
 }
});
test('Aufstehen und abgebrochenes Hinsetzen stellen die Stehfigur ohne Doppelglieder wieder her',()=>{
 run('prepared();var sl=CAMP.slots[0],q=figure("farmer",sl);for(let f=0;f<100;f++)staffSitDown(q.s,q.e,sl,1/60);for(let f=0;f<120;f++)staffRise(q.s,q.e,1/60);');assert.equal(run('q.e.node.mesh'),'stand');assert.equal(run('q.e.seatRig.active'),false);assert.ok(run('q.e.seatRig.legs.every(l=>!l.thigh.visible)'));assert.equal(run('q.e.arm.mesh'),'arm');
});
run('prepared();S.player={company:"Testhof",name:"Nora",origin:3,color:0,avatar:avDefault()};S.tut={done:true};S.lastTab="farm";S.speed=0;');
if(process.env.FARM_TEAM_FIXTURE)fs.writeFileSync('/tmp/farmteam-v349-save.json',run('JSON.stringify(S)'));
console.log(count+' Hofteam-/Sitzprüfungen bestanden.');
