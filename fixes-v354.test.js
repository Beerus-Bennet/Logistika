/* v354: Sammelprüfung zu Tutorial (Säen zählt je Feld einmal), Bewohnerwegen (gemeinsame Lage, Speichern/Laden,
   ein Verkauf), Wendeplatz, Trefferbild (Haupt am Träger), Keilerteller und Landschaftskulisse.
   Ohne Pakete: node fixes-v354.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');let count=0;
const test=(n,fn)=>{fn();count++;console.log('ok '+count+' '+n);};
const cut=(src,name)=>{const i=src.indexOf('function '+name+'(');assert.ok(i>=0,name);let d=0,j=src.indexOf('{',i);for(let k=j;k<src.length;k++){if(src[k]==='{')d++;else if(src[k]==='}'&&--d===0)return src.slice(i,k+1);}throw Error(name);};

/* ---------- Tutorial ---------- */
test('Säen im Rundgang: 0 → 1 → 2, dasselbe Feld zählt nicht doppelt, genau ein Weiterschalten',()=>{
 const C=vm.createContext({console});
 vm.runInContext(`var S={farm:{tut:{step:2,done:false,cnt:0}}},adv=0,shown=0,ftSlowT=0,ftSlow=-1;
  function clearTimeout(){}function farmHintFor(){}function farmTutState(){return S.farm.tut.done?null:S.farm.tut;}
  function farmTutList(){return [0,0,{wait:'plant',n:2}];}function farmTutAdvance(T){adv++;T.adv=true;}function farmTutShow(){shown++;}
  ${cut(read('farmview.js'),'farmTutSignal')}`,C);
 const run=s=>vm.runInContext(s,C);
 run('farmTutSignal("plant:weizen",1,10)');assert.equal(run('S.farm.tut.cnt'),1);assert.equal(run('adv'),0);
 run('farmTutSignal("plant:weizen",1,10)');assert.equal(run('S.farm.tut.cnt'),1,'dasselbe Feld');
 run('S.farm.tut=JSON.parse(JSON.stringify(S.farm.tut))');                                /* Speichern/Laden mitten im Schritt */
 run('farmTutSignal("plant:mais",1,10)');assert.equal(run('S.farm.tut.cnt'),1,'dasselbe Feld nach dem Laden');
 run('farmTutSignal("harvest:weizen",1,11)');assert.equal(run('S.farm.tut.cnt'),1,'anderes Ereignis');
 run('farmTutSignal("plant:weizen",1,11)');assert.equal(run('S.farm.tut.cnt'),2);assert.equal(run('adv'),1);
 run('farmTutSignal("plant:weizen",1,12)');assert.equal(run('adv'),1,'während der Rückmeldung kein zweiter Wechsel');
 run('S.farm.tut={step:2,done:false,cnt:1};farmTutSignal("plant:weizen",1)');assert.equal(run('S.farm.tut.cnt'),2,'alter Stand/Aufruf ohne Feldkennung bleibt zählbar');
 assert.match(read('farm.js'),/farmEvent\("plant:" \+ crop, 1, o\.id\)/);
});

/* ---------- Siedlung ---------- */
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const V=vm.createContext({console,Math,JSON,Date,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,V);
for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js','villagedata.js','places.js','map.js','game.js','farm.js','erbe.js','village.js','gl3d.js','farmmodels.js','woodmodels.js','rent.js','hunt.js','villagesite.js','villagepeople.js'])run(read(f));
run(cut(read('farmview.js'),'farmStallShift'));
run(`toast=()=>{};save=()=>{};render=()=>{};renderInspector=()=>{};mapRedraw=()=>{};logMoney=()=>{};checkLevel=()=>{};farmCheckLevel=()=>{};farmEvent=()=>{};
 function umschlagFactor(){return 1;}function tickBases(){}function baseDayChange(){}function staffPerk(){return 0;}spawnOrders=()=>0;spawnJewels=()=>{};
 navPath=(x,z,a,b)=>[[x,z],[a,b]];
 /* Hofzaun wie im Spiel: Südseite z = 14 mit Tor bei x 3 … 7 */
 navWalls=()=>[[1,-15,-18,14,-10.7,-8.3],[1,15,-18,14,0,0],[0,-18,-15,15,0,0],[0,14,-15,15,3,7]];
 function prepared(){S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:600,lastDay:0,player:{company:'Test'},bases:[],fleet:[]});
  farmNew();S.farm.logi=true;S.farm.stage=4;S.farm.xp=24*24*50;S.farm.lvSeen=25;S.farm.tut.done=true;S.farm.econ238=1;S.farm.cap.silo=10;S.farm.cap.barn=10;S.orders=[];clearRouteCache();
  S.farm.areas.see=true;for(const h of Object.values(VILLAGE.state().homes))h.life={mailDay:0,shopDay:0};}`);

test('Wendeplatz: kein Gehweg und kein Bordstein in der Fahrfläche, Ringe schließen an die Einmündung an',()=>{
 run('prepared();var T=VILLAGE_SITE.turn,v=VILLAGE_SITE.roadMesh(false).v,bad=0,ring=0;for(let i=0;i<v.length;i+=9){const d=Math.hypot(v[i]-T.x,v[i+2]-T.z);if(v[i+1]>=.045&&d<T.r-.02)bad++;if(v[i+1]>=.045&&Math.abs(d-T.rim)<.01)ring++;}');
 assert.equal(run('bad'),0);assert.ok(run('ring')>40,'Gehwegring vorhanden');
 /* Öffnung: zwischen den Bordsteinen liegt an der Einmündung nur Fahrbahn */
 assert.equal(run('var open=0;for(let i=0;i<v.length;i+=9)if(v[i+1]>=.045&&Math.abs(v[i]-T.x)<VILLAGE_SITE.half-.01&&v[i+2]>60&&v[i+2]<T.z)open++;open'),0);
});

test('Sichtbarer Stand und Hofzaun sind Hindernisse; versetzt gezeichneter Stand wird dort geprüft, wo man ihn sieht',()=>{
 run('prepared();var o=stallObj(false),B=VILLAGE_SITE.stallBox(o),c=farmCenter(o);');
 assert.ok(run('Math.abs((B[1]+B[3])/2-(c[1]+farmStallShift(o)))<1e-9'));
 assert.ok(run('VILLAGE_SITE.blocked((B[0]+B[2])/2,B[3]-.05,.3)'),'Vorderkante des gezeichneten Tresens');
 assert.ok(run('VILLAGE_SITE.blocked(-6,14,.2)&&!VILLAGE_SITE.blocked(5,14,.3)&&!VILLAGE_SITE.blocked(-6,15.2,.3)'),'Zaun gesperrt, Tor und Wiese frei');
});

test('Einkaufsweg: jede Lage frei, Rad wendet als eigener Schritt, Schritte schließen ohne Sprung aneinander an',()=>{
 for(const id of ['000','001']){V.id=id;run('prepared();');assert.ok(run('VILLAGE_PEOPLE.start(id,"shop",false)'),id);
  run('var L=VILLAGE.home(id).life.active,P=VILLAGE_PEOPLE;');
  assert.deepEqual(run('L.steps.map(s=>s.kind).join(",")'),'walk,unlock,turn,push,look,mount,ride,dismount,walk,buy,walk,turn,mount,ride,dismount,push,lock,walk');
  assert.ok(run('L.steps.every(s=>P.stepClear(s,null))'),'alle Lagen frei');
  assert.equal(run('var jump=0,where="";for(let i=1;i<L.steps.length;i++){const a=P.pose(L.steps[i-1],1),b=P.pose(L.steps[i],0);let j=Math.hypot(a.person.x-b.person.x,a.person.z-b.person.z);if(a.bike&&b.bike)j=Math.max(j,Math.hypot(a.bike.x-b.bike.x,a.bike.z-b.bike.z));if(j>jump){jump=j;where=L.steps[i-1].kind+">"+L.steps[i].kind+"#"+i;}}jump<.05'),true,'Sprung '+run('jump')+' bei '+run('where'));
  /* Kunde steht außerhalb des sichtbaren Stands, das Rad nicht in der Hofeinfahrt */
  assert.ok(run('!VILLAGE_SITE.blocked(...L.trip.counter,.3)&&Math.abs(L.trip.parking[0]-FGATE.x)>=3.4'));
 }
});

test('Speichern/Laden mitten im Ablauf, Wartephasen und Wiederholungen buchen genau einen Verkauf',()=>{
 run('prepared();stallState(false).slots=[];farmAdd("apfel",1,3);stallPut(false,"apfel",1,stallBase("apfel",1,false));var m0=S.money,n0=farmInv("apfel");VILLAGE_PEOPLE.start("000","shop",false);');
 run('var h=VILLAGE.home("000");for(let i=0;i<4000&&h.life.active;i++){S.time+=.25;VILLAGE.tick();if(i%7===0&&h.life.active){h.life.active=JSON.parse(JSON.stringify(h.life.active));h.life.active.trafficWait=i%21===0;VILLAGE.tick();h.life.active&&(h.life.active.trafficWait=false);}}');
 assert.equal(run('!!h.life.active'),false,'Ablauf endet');assert.equal(run('h.life.purchases'),1);
 assert.equal(run('stallState(false).slots.filter(s=>s&&s.sold).length'),1);assert.equal(run('farmInv("apfel")'),run('n0'));
 run('var m1=S.money;for(let i=0;i<50;i++){S.time+=1;VILLAGE.tick();}');assert.equal(run('S.money'),run('m1'),'kein Nachbuchen');
});

test('Versetzter Stand: Ablauf wird neu geprüft, kein Verkauf am alten Ort, niemand bleibt für immer stehen',()=>{
 run('prepared();stallState(false).slots=[];farmAdd("apfel",1,3);stallPut(false,"apfel",1,stallBase("apfel",1,false));VILLAGE_PEOPLE.start("000","shop",false);var h=VILLAGE.home("000"),k=0;navKey=()=>"k"+k;');
 run('for(let i=0;i<60;i++){S.time+=.5;VILLAGE.tick();}stallObj(false).x+=5;k++;for(let i=0;i<6000&&h.life.active;i++){S.time+=.25;VILLAGE.tick();}');
 assert.equal(run('!!h.life.active'),false);assert.ok(run('!stallState(false).slots[0].sold'));
});

/* ---------- Jagd ---------- */
const H=vm.createContext({console});H.window=H;for(const f of ['gl3d.js','hunt.js'])vm.runInContext(read(f),H);
const hrun=s=>vm.runInContext(s,H);
test('Trefferbild: Haupt hängt am Träger (Haut und Inneres), nicht am Rumpf',()=>{
 hrun(`var R={nodes:[],mesh:b=>({b}),free(){},node:(m,o)=>Object.assign({mesh:m,ch:[]},o),addChild:(p,n)=>{p.ch.push(n);n.par=p;return n;}};
  var gn=HUNT.genes('hirsch',.7,3),A={k:'hirsch',s:1,score:.7,gn,T:HUNT.traits('hirsch',.7,gn),vr:0};
  HUNT._xrBuild(R,A,{zone:'lunge',lo:[3,1,.2],ld:[-1,0,0],t:2.8,org:[],pose:{nrx:.9,nry:.2,hrx:.3,legs:[]}});
  var all=[];(function walk(n){all.push(n);n.ch.forEach(walk);})({ch:R.nodes});
  var heads=all.filter(n=>n.rx===.3&&n.par);`);
 assert.equal(hrun('heads.length'),2);
 assert.ok(hrun('heads.every(n=>n.par.rx===.9&&n.par.ry===.2&&n.par.par&&n.par.par.s===1)'),'Elternknoten ist der Träger in Einschlaghaltung');
 assert.ok(hrun('heads.every(n=>Math.abs(n.y-.5)<1e-9&&Math.abs(n.z-.22)<1e-9)'),'Kopfgelenk in Trägerkoordinaten');
});
test('Keilerteller: liegendes Stück behält Ansatz und Stellung des lebenden (kein umgelegtes Ohr)',()=>{
 /* Tellerbereich: seitlich-oben am Hinterhaupt. Höchster Punkt und Schwerpunkt dürfen sich kaum verlagern (alt: 6,5 cm tiefer, 7 cm nach hinten). */
 hrun(`function ears(rest){const v=HUNT._m.boarHead(.7,18,rest).v;let n=0,sy=0,sz=0,top=-9;for(let i=0;i<v.length;i+=9)if(Math.abs(v[i])>.075&&v[i+1]>.06&&v[i+2]<.12){n++;sy+=v[i+1];sz+=v[i+2];top=Math.max(top,v[i+1]);}return [top,sy/n,sz/n];}
  var a=ears(false),r=ears(true);`);
 assert.ok(hrun('Math.abs(a[0]-r[0])<.02&&Math.abs(a[1]-r[1])<.012&&Math.abs(a[2]-r[2])<.02'),hrun('JSON.stringify([a,r])'));
});

/* ---------- Landschaftskulisse ---------- */
test('v357 Insel: schließt oben außerhalb der Spielfläche an, hat Felsvolumen statt kilometerweiter Streifen',()=>{
 const src=read('worldview.js'),K=vm.createContext({console,Math});
 vm.runInContext(read('gl3d.js'),K);
 vm.runInContext(`var FM={MB:G3.MB},WGRID={x0:-160,z0:-160,x1:104,z1:104},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function erbeRng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function forestK(x,z){return z<0?1:0;}
  ${src.slice(src.indexOf('const APRON ='),src.indexOf('function worldApron('))}${cut(src,'worldApron')}
  var a=worldApron(()=>[.4,.6,.3]).v,b2=worldApron(()=>[.4,.6,.3]).v,inside=0,far=0,low=0;
  for(let i=0;i<a.length;i+=9){const x=a[i],z=a[i+2];if(a[i+1]>=0&&x>-159.99&&x<103.99&&z>-159.99&&z<103.99)inside++;far=Math.max(far,Math.hypot(x+28,z+28));if(a[i+1]<-.1)low++;}`,K);
 const k=s=>vm.runInContext(s,K);
 assert.equal(k('inside'),0,'nichts innerhalb der Welt');assert.ok(k('far')<250&&k('far')>180);assert.ok(k('low')>500);
 assert.ok(k('a.length/27')<26000,'Dreiecke: '+k('a.length/27'));assert.ok(k('a.length===b2.length&&a.every((v,i)=>v===b2[i])'),'reproduzierbar');
});
console.log(count+' Prüfgruppen v354 bestanden.');
