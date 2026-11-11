/* v347: Platzvorschläge mit echter Bauprüfung.
   Ohne Pakete: node placement-v347.test.js */
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

let count=0;function test(n,f){f();console.log('ok '+(++count)+' '+n);}
function plain(){run('fresh(25);S.farm.objs=[];');}
test('Startfelder werden am Bestand statt an einer entfernten Kamera ergänzt',()=>{
 run('fresh(1);var before=JSON.stringify(S),p=farmSuggestedSpot({t:"field"},28,26);');
 assert.ok(run('farmFits(...p,2,2,null,"field")'));
 assert.ok(run('S.farm.objs.some(o=>o.t==="field"&&((o.x===p[0]&&Math.abs(o.z-p[1])===2)||(o.z===p[1]&&Math.abs(o.x-p[0])===2)))'));
 assert.equal(run('JSON.stringify(S)'),run('before'));
});
test('Lücke im Feldblock hat Vorrang vor einer neuen Außenreihe',()=>{
 plain();run('for(const [x,z]of [[10,10],[12,10],[10,12]])farmAddObj({t:"field",x,z});var p=farmSuggestedSpot({t:"field"},1,1);');assert.equal(run('JSON.stringify(p)'),'[12,12]');
});
test('Feldblock bleibt kompakt und bildet keine endlose Einzelreihe',()=>{
 plain();run('farmAddObj({t:"field",x:10,z:10});farmAddObj({t:"field",x:12,z:10});var p=farmSuggestedSpot({t:"field"},28,10);');assert.ok(run('p[0]===10||p[0]===12'));assert.ok(run('Math.abs(p[1]-10)===2'));
});
test('Felder respektieren Kieswege, Gebäude und Hofgrenzen',()=>{
 run('fresh(1);var good=true;for(let i=0;i<16;i++){const p=farmSuggestedSpot({t:"field"},30,29);if(!p)break;if(!farmFits(...p,2,2,null,"field"))good=false;farmAddObj({t:"field",x:p[0],z:p[1]});}');assert.ok(run('good'));
});
test('Obstbaumreihe übernimmt den vorhandenen Abstand, auch bei anderer Sorte',()=>{
 plain();run('farmAddObj({t:"tree",kind:"apfel",x:10,z:10});farmAddObj({t:"tree",kind:"apfel",x:13,z:10});var p=farmSuggestedSpot({t:"tree",kind:"kirsche"},16,11);');assert.equal(run('JSON.stringify(p)'),'[16,10]');
});
test('Dichte Startbaumreihe bleibt ausgerichtet; einzelne Bäume bekommen Abstand',()=>{
 run('fresh(1);var p=farmSuggestedSpot({t:"tree",kind:"apfel"},28,9);');assert.ok(run('farmFits(...p,2,2,null,"tree")'));
 plain();run('farmAddObj({t:"tree",kind:"apfel",x:10,z:10});var p=farmSuggestedSpot({t:"tree",kind:"apfel"},14,11);');assert.equal(run('Math.hypot(p[0]-10,p[1]-10)'),3);
});
test('Kein Platz ergibt keinen Vorschlag, andere Gebäude behalten ihre Platzsuche',()=>{
 plain();run('for(let z=FIN.z0;z<FIN.z1;z++)for(let x=FIN.x0;x<FIN.x1;x++)farmAddObj({t:"deco",k:"flowers",x,z});');assert.equal(run('farmSuggestedSpot({t:"field"},10,10)'),null);assert.equal(run('farmSuggestedSpot({t:"mill"},10,10)'),null);
});
console.log(count+' Platzierungsprüfungen bestanden.');
