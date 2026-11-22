/* v438: Wege der Arbeitskräfte ohne Zickzack. node wegglaetten-v438.test.js */
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
run(`staffHome=()=>[0,0];fresh(25);S.farm.areas.wald=true;S.farm.areas.see=true;S.farm.areas.saege=true;navBuild();`);
const R=JSON.parse(run(`(()=>{const sharp=p=>{let n=0;for(let i=2;i<p.length;i++){const a=Math.atan2(p[i-1][1]-p[i-2][1],p[i-1][0]-p[i-2][0]),b=Math.atan2(p[i][1]-p[i-1][1],p[i][0]-p[i-1][0]);let d=Math.abs(b-a);if(d>Math.PI)d=2*Math.PI-d;if(d>.5)n++;}return n;};
 const W=navWallsFor("farmer");let routes=0,raw=0,sm=0,lr=0,ls=0,hit=0,bad=0;
 for(let k=0;k<120;k++){const a=[-40+((k*37)%80),-30+((k*53)%60)],b=[-40+((k*71+13)%80),-30+((k*29+7)%60)],f1=navFree(a[0],a[1],"farmer",4),f2=navFree(b[0],b[1],"farmer",4),r=navPath(f1[0],f1[1],f2[0],f2[1],"farmer"),p=navPathSafe(f1[0],f1[1],f2[0],f2[1],"farmer");if(!r||!p)continue;
  routes++;raw+=sharp(r);sm+=sharp(p);lr+=routeLen(r);ls+=routeLen(p);
  for(let i=1;i<p.length;i++){if(navHit(p[i-1][0],p[i-1][1],p[i][0],p[i][1],W))hit++;const n=Math.ceil(routeLen([p[i-1],p[i]])/.25);for(let t=0;t<=n&&i>1&&i<p.length-1;t++){const x=p[i-1][0]+(p[i][0]-p[i-1][0])*t/n,z=p[i-1][1]+(p[i][1]-p[i-1][1])*t/n,bl=NAV.blk[navIdx(Math.floor(x),Math.floor(z))];if(bl&&bl!==2)bad++;}}}
 return JSON.stringify({routes,raw,sm,lr,ls,hit,bad});})()`));
let n=0;const test=(t,f)=>{f();console.log('ok '+(++n)+' '+t);};
test('Viele Wege geprüft, scharfe Knicke fast vollständig weg, Wege nicht länger',()=>{assert.ok(R.routes>=60);assert.ok(R.sm<=R.raw*0.1,'scharfe Knicke '+R.raw+' → '+R.sm);assert.ok(R.ls<=R.lr*1.001,'Länge '+R.lr+' → '+R.ls);});
test('Geglättete Wege kreuzen keinen Zaun und liegen auf freien Feldern',()=>{assert.equal(R.hit,0);assert.equal(R.bad,0);});
console.log(n+' Prüfungen v438 bestanden.');
