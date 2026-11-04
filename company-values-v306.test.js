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
run(read('corp.js'));
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
let count=0;
function test(name,fn){run('fresh()');fn();count++;console.log('ok '+name);}

test('Screenshot reproduziert: 10/11/12 Prozent bei ähnlicher Flotte liegen in vergleichbarer Größenordnung',()=>{
 /* Die Ausgangsfälle wurden vor der Änderung mit dem originalen v301-Code
    auf 5.700.000 / 636.350.000 / 548.410.000 Euro reproduziert. Der Test
    bleibt unabhängig von späteren Änderungen an origin/main ausführbar. */
 const vals=get('['+'"w3_zenit","w4_eisberg","w4_titan"'+'].map(corpValue)');
 assert.ok(Math.max(...vals)/Math.min(...vals)<1.5,'Kein hundertfacher Aufschlag bei vergleichbarer Ausstattung');
 assert.ok(vals[1]>vals[0],'Größere Flotte und etwas mehr Anteil bleiben wertvoller');
 console.log('  Vergleichswerte v306:',vals.join(' / '));
});
test('Standort und alte Wellenbasis werden nicht als Multiplikator auf die ganze Firma angewendet',()=>{
 run('var original=corpValue("w3_zenit"),fleet=corpAppraisal("w3_zenit").fleetValue;CORP.w3_zenit.base*=1000;');
 assert.equal(run('corpValue("w3_zenit")'),run('original'));
 run('CORP.w3_zenit.hq="casablanca";var other=corpAppraisal("w3_zenit");');
 assert.equal(run('other.fleetValue'),run('fleet'));assert.ok(run('other.total/original<1.05'));
});
test('Gleiche Vermögenswerte und Marktanteile ergeben gleichen Wert unabhängig von Name und Welle',()=>{
 run(`CORP.w4_eisberg.fleet=12;CORP.w4_eisberg.tier=2;CORP.w4_eisberg.hq='mannheim';
 S.share={me:69,w3_zenit:10,w4_eisberg:10,w4_titan:11};var p=corpFleetPlan('w3_zenit');S.corp.fleets306.w4_eisberg=JSON.parse(JSON.stringify(p));`);
 assert.equal(run('corpValue("w3_zenit")'),run('corpValue("w4_eisberg")'));
});
test('Marktanteil wirkt stetig und moderat, Vermögenswerte bleiben separat sichtbar',()=>{
 run('var a=corpAppraisal("w3_zenit");S.share.w3_zenit=12;S.share.me=65;var b=corpAppraisal("w3_zenit");');
 assert.equal(run('a.fleetValue'),run('b.fleetValue'));assert.equal(run('a.hqValue'),run('b.hqValue'));
 assert.ok(run('b.total>a.total&&b.total/a.total<1.05'));
 assert.ok(run('Math.abs(b.total-b.fleetValue-b.hqValue-b.goodwill)<=500'));
});
test('Alle sechs Etappen: gültige normale Fahrzeuge, korrekte Anzahl/Modi und realistische Zustände',()=>{
 for(let stage=1;stage<=6;stage++)for(const id of ['blitz','nord','w3_zenit']){
  run(`S.stage=${stage};var p=corpFleetPlan('${id}');`);
  assert.equal(run('p.fleet.length'),run(`CORP['${id}'].fleet+Math.floor(S.stage/2)`));
  assert.ok(run(`p.fleet.every(f=>{const t=vType(f.type);return !t.special&&t.stage<=S.stage&&unlockedModes().includes(t.mode)&&CORP['${id}'].modes.includes(t.mode);})`));
  assert.ok(run('p.fleet.every(f=>f.wear>=4&&f.wear<=55&&f.kmTotal>=8000&&f.kmTotal<=300000)'));
  assert.ok(Number.isFinite(run(`corpValue('${id}')`)));
 }
});
test('Flotte ist gespeichert und auch ohne Cache nach Neuladen identisch, kein Neuwürfeln',()=>{
 run('var p=corpFleetPlan("w4_eisberg"),snapshot=JSON.stringify(p);');
 assert.equal(run('corpFleetPlan("w4_eisberg")===p'),true);
 run('S=JSON.parse(JSON.stringify(S));corpSyncRivals(true);');assert.equal(run('JSON.stringify(corpFleetPlan("w4_eisberg"))'),run('snapshot'));
 run('delete S.corp.fleets306.w4_eisberg;Math.random=()=>{throw Error("Bewertung darf nicht neu würfeln");};');
 assert.equal(run('JSON.stringify(corpFleetPlan("w4_eisberg"))'),run('snapshot'));
});
test('Vergleichbare Mischflotten bleiben auch über viele Firmenkennungen hinweg vergleichbar',()=>{
 const values=[];
 for(let i=0;i<80;i++){
  run(`var id='sample_'+${i};CORP[id]={...CORP.w4_eisberg};S.corp.rivals.push({id,name:id,st:0,wave:4});RIVALS.push({id,name:id,st:0,wave:4});S.share[id]=0;var a=corpAppraisal(id);`);
  values.push(run('a.fleetValue'));assert.equal(run('a.fleet.length'),17);
 }
 assert.ok(Math.max(...values)/Math.min(...values)<1.3,'Keine zufälligen reinen Billig-/Luxusflotten');
});
test('Alte aktive Verhandlung wird proportional korrigiert, Runde und Fortschritt bleiben',()=>{
 run(`S.corp.talks.w3_zenit={val:5700000,res:5800000,ask:5750000,offer:5000000,round:1,cool:0,chat:[{me:true,t:'Altes Angebot'}]};
 var expected=corpValue('w3_zenit');openCorp('w3_zenit');var t=S.corp.talks.w3_zenit;`);
 assert.equal(run('t.val'),run('expected'));assert.equal(run('t.round'),1);
 assert.equal(run('t.res'),run('Math.round(5800000*expected/5700000)'));
 assert.ok(run('Math.abs(t.ask-5750000*expected/5700000)<=500'));assert.equal(run('t.chat[0].t'),'Altes Angebot');
 assert.match(run('t.chat.at(-1).t'),/Bewertung/);assert.match(run('modalHTML'),/Bewertung: Flotte/);
 assert.match(run('modalHTML'),/Fahrzeuge je Verkehrsträger/);assert.ok(run('corpFleetText(t.fleet306).includes("✈️")'));
 assert.equal(run('t.fleet306.length'),15);
});
test('Sperrzeit und übernommene Firmenhistorie werden nicht rückwirkend verändert',()=>{
 run(`var history=JSON.stringify(S.corp.owned),cash=S.money;S.corp.talks.w3_zenit={val:5700000,res:5800000,round:3,cool:S.time+100,chat:[]};openCorp('w3_zenit');`);
 assert.equal(run('S.corp.talks.w3_zenit.val'),5700000);assert.equal(run('corpOpen'),null);
 run('corpHTML();openCorp("blitz");');assert.equal(run('JSON.stringify(S.corp.owned)'),run('history'));assert.equal(run('S.money'),run('cash'));
});
test('Kauf übergibt exakt die bewertete Flotte, Sitz und Marktanteil, einmalige Zahlung',()=>{
 run('openCorp("w3_zenit");var t=S.corp.talks.w3_zenit,quote=JSON.stringify(t.fleet306),cash=S.money;t.ask=t.val;corpOffer("w3_zenit",t.ask,true);');
 assert.equal(run('S.money'),run('cash-t.val'));assert.equal(run('S.expense'),run('t.val'));
 assert.equal(run('JSON.stringify(S.fleet.map(({type,wear,kmTotal})=>({type,wear,kmTotal})))'),run('quote'));
 assert.equal(run('S.corp.owned.w3_zenit.veh'),15);assert.equal(run('S.share.w3_zenit'),0);assert.equal(run('S.share.me'),77);
 assert.ok(run('!!baseAtNode("mannheim")'));assert.equal(run('S.corp.owned.w3_zenit.price'),run('t.val'));
 run('var paid=S.money;corpOffer("w3_zenit",t.ask,true);');assert.equal(run('S.money'),run('paid'));
});
test('Ein laufendes Angebot behält seine zugesagte Flotte bei Etappenwechsel',()=>{
 run('S.stage=3;openCorp("w3_zenit");var t=S.corp.talks.w3_zenit,quote=JSON.stringify(t.fleet306);S.stage=6;corpFleetPlan("w3_zenit");t.ask=t.val;corpOffer("w3_zenit",t.ask,true);');
 assert.equal(run('S.fleet.length'),13);assert.equal(run('JSON.stringify(S.fleet.map(({type,wear,kmTotal})=>({type,wear,kmTotal})))'),run('quote'));
 assert.match(run('modalHTML'),/13 Fahrzeuge/);
});
test('Doppelter Sitz zahlt nur Immobilien-Zeitwert aus, keinen Anteil der gesamten Schiffsflotte',()=>{
 run(`S.bases=[{id:'B0',node:'mannheim',tier:2,staff:[],vehicles:[],deco:{}}];openCorp('w3_zenit');var t=S.corp.talks.w3_zenit,cash=S.money,hq=t.appraisal306.hqValue;t.ask=t.val;corpOffer('w3_zenit',t.ask,true);`);
 assert.equal(run('S.money'),run('cash-t.val+hq'));assert.equal(run('ledger.filter(x=>x.l.startsWith("Verkauf Firmensitz"))[0].a'),run('hq'));
 assert.equal(run('S.bases.length'),1);assert.equal(run('S.corp.hq.w3_zenit'),undefined);
 run('var balance=S.money;corpHqTry();');assert.equal(run('S.money'),run('balance'));
});
console.log(count+' Firmenwert-Szenarien bestanden; echte Preis-/Übergabelogik, kein Live-Browser-/Handytest.');
