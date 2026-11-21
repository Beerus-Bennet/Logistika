/* v424: Keine Bäume auf dem Sandrand des Flusses. node fluss-baeume-v424.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}});
const C=vm.createContext({console,Math,JSON,Date,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,requestAnimationFrame(){},
 performance:{now:()=>0},location:{search:''},navigator:{userAgent:'node'},Image:function(){},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),documentElement:el()},
 window:{addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})}});
const run=s=>vm.runInContext(s,C),read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ["data.js","farmdata.js","fishdata.js","erbedata.js","places.js","map.js","game.js","farm.js","erbe.js","gl3d.js","farmmodels.js","woodmodels.js","alpine.js"])run(read(f));
run(`toast=m=>{};save=()=>{};render=()=>{};mapRedraw=()=>{};logMoney=()=>{};farmEvent=()=>{};
 function mk(){S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:600,player:{company:'Test'},bases:[],fleet:[]});farmNew();}`);
let n=0;const test=(t,f)=>{f();console.log('ok '+(++n)+' '+t);};
test('Neues Spiel: kein Baum innerhalb des Sandrands, Bäume bleiben vorhanden',()=>{
 run('mk();');
 assert.ok(run('S.farm.trees.length')>50);
 assert.equal(run('S.farm.trees.filter(t=>creekBankD(t.x,t.z)<CREEK_BANK).length'),0);
});
test('Alter Stand: Bäume auf dem Sandrand werden einmalig entfernt, übrige bleiben',()=>{
 run('mk();');
 run('var P=FWM.smoothLine(ALPINE.riverLine(),6)[40];S.farm.trees.push({id:9001,sp:"eiche",x:P[0]+3,z:P[1],st:"adult"},{id:9002,sp:"eiche",x:P[0]-4.5,z:P[1]+1,st:"adult"});delete S.farm.river432;');
 const before=run('S.farm.trees.length');
 run('farmMigrate();');
 assert.equal(run('S.farm.trees.some(t=>t.id===9001||t.id===9002)'),false);
 assert.ok(run('S.farm.trees.length')>=before-2-0 && run('S.farm.trees.length')>=before-10);
 assert.equal(run('S.farm.trees.filter(t=>creekBankD(t.x,t.z)<CREEK_BANK).length'),0);
 assert.equal(run('S.farm.river432'),1);
});
test('Neue Pflanzplätze am Sandrand sind gesperrt',()=>{
 run('var Q=FWM.smoothLine(ALPINE.riverLine(),6)[40];');
 assert.equal(run('treeSpotOk(Q[0]+5,Q[1],2.4)'),false);
});
console.log(n+' Prüfungen v424 bestanden.');
