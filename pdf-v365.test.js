/* v365: PDF-Aufgaben – Anzeige, Tiergüte, Bildtakt, Haft und Schienenrouten.
   Ohne Pakete: node village-v340.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
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

let count=0;const test=(n,f)=>{f();console.log('ok '+(++count)+' '+n);};
test('Eine Anzeige vermittelt passende Neubauten schon im Bau, einmalige Gebühr, noch keine Übergabe',()=>{
 run(`fresh();S.farm.stats.deliv=6;VILLAGE.expand();VILLAGE.buy('030');VILLAGE.build('030','holz',false);VILLAGE.buy('031');VILLAGE.build('031','familie',false);var m=S.money;`);
 assert.ok(run(`VILLAGE.advertise('online',['holz'],'rent')`));assert.equal(run('m-S.money'),750);
 assert.ok(run(`VILLAGE.home('030').listing`));assert.equal(run(`VILLAGE.home('031').listing`),undefined);
 assert.equal(run(`VILLAGE.advertise('online',['holz'],'rent')`),false);assert.equal(run('m-S.money'),750);
 run(`S.time=VILLAGE.home('030').listing.ready;VILLAGE.tick();var h=VILLAGE.home('030'),c=h.listing.offers[0];`);
 assert.equal(run('h.status'),'building');assert.ok(run(`h.listing.offers.every(c=>c.kind==='rent')`));
 assert.ok(run(`VILLAGE.negotiate('030',c.id,'rent',c.price)`));assert.equal(run(`VILLAGE.sign('030',c.id)`),false);assert.equal(run('h.resident'),undefined);
 run('S=JSON.parse(JSON.stringify(S));h=VILLAGE.home("030");c=h.listing.offers[0];S.time=h.ready;VILLAGE.tick();');
 assert.ok(run(`VILLAGE.sign('030',c.id)`));assert.equal(run(`VILLAGE.sign('030',c.id)`),false);assert.equal(run('h.status'),'rented');assert.equal(run('m-S.money'),750);
});
test('Neue passende Bauvorhaben treten bei, abgebrochene Verhandlungen bleiben leer, Anzeige endet ohne Doppelgebühr',()=>{
 run(`fresh();S.farm.stats.deliv=6;VILLAGE.expand();VILLAGE.buy('030');var m=S.money;VILLAGE.advertise('referral',['holz','familie'],'buy');VILLAGE.build('030','familie',false);var h=VILLAGE.home('030');S.time=h.listing.ready;VILLAGE.tick();`);
 assert.ok(run(`h.listing.offers.every(c=>c.kind==='buy')`));run(`for(const c of h.listing.offers)for(let i=0;i<3;i++)VILLAGE.negotiate('030',c.id,'buy',9999999);`);
 assert.ok(run('h.listing.offers.every(c=>c.declined)'));assert.equal(run('h.resident'),undefined);
 assert.ok(run('VILLAGE.stopAdvert()'));run(`VILLAGE.buy('031');VILLAGE.build('031','holz',false);`);assert.equal(run(`VILLAGE.home('031').listing`),undefined);
 assert.equal(run(`VILLAGE.negotiate('030',h.listing.offers[0].id,'buy',1)`),false);
});
test('Tiergüte und Schussnote erklärt; schwaches Herzstück bleibt Silber und sofortiger Zusammenbruch ist reproduzierbar',()=>{
 assert.equal(run(`HUNT.medalOf(.46,'herz')`),2);assert.equal(run(`HUNT.medalOf(.85,'herz')`),4);assert.match(run('HUNT._qualityHTML()'),/46.*51/s);
 assert.ok(run(`Array.from({length:100},(_,g)=>HUNT._instantCollapse({g,score:.6,v:0},'herz')).some(Boolean)`));
 assert.ok(run(`Array.from({length:100},(_,g)=>HUNT._instantCollapse({g,score:.6,v:0},'herz')).some(v=>!v)`));
 assert.equal(run(`HUNT._instantCollapse({g:3,score:.6,v:7},'herz')`),false);assert.equal(run(`HUNT._instantCollapse({g:3,v:0},'lunge')`),false);assert.equal(run(`HUNT._instantCollapse({g:3,v:7},'kopf')`),true);
});
run(fs.readFileSync('jail.js','utf8'));
test('Haftblasen bleiben neben oder über dem Gesicht; Textvarianten ohne identische Direktwiederholungen',()=>{
 for(const w of [320,390,700]){const a=JSON.parse(run(`JSON.stringify(JAIL3D.speechPlace([${w/2},350,.5],[${w/2},370,.5],${w},760,200,55,130,520))`));assert.ok(a[1]<=342||Math.abs(a[0]-w/2)>=125||a[1]-55>=394,JSON.stringify(a));assert.ok(a[0]>=108&&a[0]<=w-108);}
 assert.ok(run('JAIL3D.SAY.man.length>=10&&JAIL3D.SAY.rat.length>=7&&JAIL3D.SAY_U.man.length>=8'));assert.ok(run(`Object.values(JAIL3D.SAY).every(a=>new Set(a).size===a.length)`));
});
test('30-Hz-Begrenzung verschlechtert die Auflösung nicht; echte Überlast wird begrenzt und Hintergrundzeit nicht nachgeholt',()=>{
 run('document.hidden=false;var R={scale:1},g=G3.governor(R,{frameMs:1000/30,minScale:.7});for(let t=0;t<20000;t+=1000/30)g(1000/30,t);');assert.equal(run('R.scale'),1);
 run('for(let t=20000;t<28000;t+=80)g(80,t);');assert.equal(run('R.scale'),.7);
 run('var pace=G3.pacer(30),frames=0;for(let i=0;i<600;i++)if(pace(i*1000/60))frames++;');assert.ok(run('frames>=299&&frames<=301'));
 run('document.hidden=true;pace(100000);document.hidden=false;var timing=pace(200000);');assert.ok(run('timing.dt<.04'));
});
/* Haftlogik ohne WebGL: kontrollierte Uhr, echte jailServe-Schleife. */
const J=vm.createContext({console,performance:{now:()=>J.now},window:{JAIL_MS_TEST:9000},document:{hidden:false},requestAnimationFrame:f=>J.queue.push(f)});
J.now=0;J.queue=[];vm.runInContext(fs.readFileSync('snus.js','utf8'),J);const jr=s=>vm.runInContext(s,J);
jr(`var S={time:1000,jail:{from:0,until:23040,days:16,kind:'uhaft',done0:0},done:0,money:0},muteToasts=false,counts=[],closed=0,out=0;
 var esc=String,money=String,reportShow=()=>{},save=()=>{},$=()=>null;
 var N={};jailOut=()=>out++;tick=n=>{counts.push(n);S.time+=n;};jailServe();`);
test('Haft setzt aus gespeichertem Fortschritt gleichmäßig fort; kein Zeitsprung bei Hintergrund, keine Überschreitung',()=>{
 J.now=1000;J.queue.shift()();assert.ok(jr('S.time')>1000&&jr('S.time')<=1060);assert.ok(jr('counts.length<=6&&counts.every(n=>n<=10)'));
 jr('document.hidden=true');const before=jr('S.time');J.now=50000;J.queue.shift()();assert.equal(jr('S.time'),before);
 jr('document.hidden=false');for(let i=0;i<5000&&J.queue.length;i++){J.now+=1000/60;J.queue.shift()();}
 assert.equal(jr('S.time'),23040);assert.equal(jr('out'),1);assert.equal(jr('muteToasts'),false);
});
/* Echte GEO-Funktionen mit kontrollierten Dienstantworten statt Internetabhängigkeit. */
const G=vm.createContext({console,Map,Set,WeakMap,Date,Math,navigator:{onLine:false},setTimeout:()=>0,clearTimeout(){},AbortController});const gr=s=>vm.runInContext(s,G);gr(fs.readFileSync('routegeo.js','utf8'));
test('Schienenroute bleibt bei Offline/Timeout ausstehend statt zur Luftlinie zu werden; Cache wird nicht falsch eingefroren',()=>{
 gr(`var a=[52.53,13.37],b=[53.06,14.28],r=[a,b];r.gm=['l'];r.fz=1;`);assert.equal(gr('geoPending(r)'),true);assert.match(gr('geoStatus(r)'),/Internet/);
 gr('var old=geoDisp(r);GEO.failAt.set(geoKey(a,b,"l"),Date.now());navigator.onLine=true;');assert.equal(gr('geoPending(r)'),true);assert.match(gr('geoStatus(r)'),/erneuter/);
 gr(`var line=[a,[52.7,13.4],[52.9,14],b];GEO.mem.set(geoKey(a,b,'l'),line);GEO.ver++;var current=geoDisp(r);`);assert.equal(gr('geoPending(r)'),false);assert.equal(gr('current.length'),4);assert.equal(gr('current===old'),false);assert.equal(gr('geoStatus(r)'),null);
});
(async()=>{
 G.fetch=async()=>({ok:true,json:async()=>({paths:[{points:{coordinates:[[13.371,52.531],[13.4,52.7],[14,52.9],[14.281,53.061]]}}]})});
 const pts=await gr(`geoFetch({a,b,mode:'l'})`);assert.equal(pts.length,4);assert.ok(Math.abs(pts[0][0]-52.531)<1e-8);assert.notDeepEqual(Array.from(pts[0]),[52.53,13.37]);
 console.log('ok '+(++count)+' Routingdienst: echte Gleisendpunkte ohne künstliche Ortsmittelpunkt-Gerade');console.log(count+' PDF-Prüfgruppen bestanden.');
})().catch(e=>{console.error(e);process.exitCode=1;});
