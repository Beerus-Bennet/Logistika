/* v306: node company-values-v306.test.js
   Echte Firmen-/Fahrzeug-/Büropreise, Bewertungs-, Verhandlungs- und Übergabelogik.
   DOM, Kandidatennamen, Auftragsgenerator und Effekte als kleine Fixtures. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=fs.existsSync(path.join(__dirname,'corp.js'))?__dirname:path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const extract=(file,name)=>{const s=read(file),i=s.indexOf('function '+name+'(');assert.ok(i>=0,name);const one=s.slice(i).match(/^function [^\n]+\} *$/m);if(one&&one.index===0)return one[0];const end=s.indexOf('\n}',i);assert.ok(end>i,name);return s.slice(i,end+2);};
const C=vm.createContext({console,DECISIONS:{}}),run=s=>vm.runInContext(s,C);
run(read('data.js'));run(read('offices.js'));
run(read('vip.js').match(/const RIVALS = \[[\s\S]*?\n\];/)[0]);
for(const n of ['STAGE_K','roundK'])run(read('extras.js').match(new RegExp('^const '+n+' = [^\\n]+','m'))[0]);
for(const n of ['vType','makeVehicle'])run(extract('game.js',n));
for(const n of ['wearOf','wearValueFactor'])run(extract('extras.js',n));
run(read('game.js').match(/^const vehValue = [^\n]+/m)[0]);
run(`const N=Object.fromEntries(NODES.map(a=>[a[0],{id:a[0],name:a[1],lat:a[2],lon:a[3],stage:a[5],modes:a[6],type:a[7],short:a[8]}]));`);
run(read('corpassets.js'));run(read('corp.js'));
for(const n of ['shareState','rivalById'])run(extract('vip.js',n));
run(`
var S,notices,ledger,timers,saves=0,dom={},modalHTML='',candidate=0,renderDirty=false;
function element(){return {value:0,textContent:'',scrollHeight:100,scrollTop:0,classList:{add(){},remove(){},contains:()=>false}};}
var body=element();var document={body,getElementById:()=>null};
function $(s){return dom[s]||(dom[s]=element());}
Object.defineProperty($('#modalBody'),'innerHTML',{get:()=>modalHTML,set:v=>{modalHTML=v;const m=v.match(/id="coOff"[^>]*value="([^"]*)"/);if(m)$('#coOff').value=m[1];}});
function fresh(){
 S={stage:6,time:2000,money:1e12,expense:0,revenue:0,seq:1,orders:[],fleet:[],bases:[],player:{company:'Testspedition'},share:{me:67,w3_zenit:10,w4_eisberg:12,w4_titan:11},
 corp:{owned:{blitz:{at:1,price:10000,hq:1},rabe:{at:2,price:20000,hq:1},nord:{at:3,price:30000,hq:1},atlas:{at:4,price:40000,hq:1},pacific:{at:5,price:50000,hq:1}},talks:{},hq:{},hqRestore281:true,rivals:[]}};
 for(const [id,k,hq,w,fleet,tier,share,price,factor]of [
 ['w3_zenit','zenit','mannheim',3,12,2,10,5700000,6],
 ['w4_eisberg','eisberg','callao',4,14,3,12,636350000,90],
 ['w4_titan','titan','casablanca',4,14,3,11,548410000,90]]){
  const t=CORP_WAVE_POOL.find(x=>x.k===k);S.corp.rivals.push({id,k,hq,wave:w,fleet,tier,modes:'rbilsa',at:1,base:price/(factor*(.7+1.6*share/100)),...t});
 }
 notices=[];ledger=[];timers=[];saves=0;corpOpen=null;candidate=0;Math.random=()=>.5;corpSyncRivals(true);
}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}function rnd(a,b){return a+(b-a)*Math.random();}function pick(a){return a[0];}
function unlockedModes(){return STAGES[S.stage-1].modes;}function unlockedNodes(){return Object.values(N).filter(n=>isUnlocked(n.id));}function isUnlocked(id){return N[id]&&N[id].stage<=S.stage;}
function homeFor(mode){return unlockedNodes().find(n=>n.modes.includes(mode)).id;}function level(){return 60;}function logiOn(){return true;}
function stageK(){return STAGE_K[S.stage-1];}function esc(s){return String(s);}function money(n){return String(n)+' €';}function stamp(t){return String(t);}
function logMoney(k,l,a){ledger.push({k,l,a});}function save(){saves++;}function render(){}function renderWorld(){}function closeModal(){}
function toast(t){notices.push(t);}function phoneMsg(m){notices.push(m);}function setTimeout(fn){timers.push(fn);return timers.length;}
function makeCandidate(){return {id:'P'+(++candidate),name:'Mitarbeiter '+candidate,av:{}};}function refreshPool(){}function perks(){return {};}
function makeOrder(){return {id:'A'+S.seq++,pay:1000,expire:S.time+500};}function repAdd(){}
`);
const get=s=>JSON.parse(run('JSON.stringify('+s+')'));

module.exports={run,get};
