/* v305: node treasure-loot-v305.test.js – echte Fund-/Lager-/Anzeigefunktionen,
   Produktionsfreigaben und Effekte als Fixtures, keine Browser-/Handyprüfung. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=fs.existsSync(path.join(__dirname,'erbe.js'))?__dirname:path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const extract=(file,name)=>{const s=read(file),i=s.indexOf('function '+name+'(');assert.ok(i>=0,name);const one=s.slice(i).match(/^function [^\n]+\} *$/m);if(one&&one.index===0)return one[0];const end=s.indexOf('\n}',i);assert.ok(end>i);return s.slice(i,end+2);};
const C=vm.createContext({console});const run=s=>vm.runInContext(s,C);
run(read('farmdata.js').match(/const FITEMS = \{[\s\S]*?\n\};/)[0]);
run(`var S,allowed,capacity,notices,ledger,saves,shown,timers,fx,callbacks;
var FSTORE={silo:{},barn:{},holz:{}};
Object.assign(FITEMS,{bretter:{n:'Bretter',k:'wood',v:20,st:'holz'},fisch:{n:'Fisch',k:'fisch',v:20,st:'fisch'},wild:{n:'Wild',k:'wild',v:50,st:'barn'},pokal:{n:'Trophäe',k:'troph',v:1000,st:'barn'},strom:{n:'Strom',k:'energy',v:1,st:'barn',energy:10},koeder:{n:'Köder',k:'bait',v:8,st:'koeder'}});
function fresh(cash=1000,lv=1,stage=1){S={time:100,money:cash,revenue:0,stage,orders:[],farm:{xp:50*(lv-1)**2,inv:{},objs:[],areas:{},clover:0,stats:{events:0},tr:{cur:{t0:100,until:500,done:false},found:0}}};
allowed=new Set(['weizen','brot','bretter','apfelkuchen']);capacity={silo:100,barn:100,holz:100,fisch:100,koeder:100};notices=[];ledger=[];saves=0;shown=[];timers=[];fx=[];callbacks=[];Math.random=()=>.5;}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}function farmOrders(){return S.orders.filter(o=>o.farm);}
function farmCanMake(id){return allowed.has(id);}function farmStoreCap(st){return capacity[st]||0;}function farmXP(x){S.farm.xp+=x;}
function logMoney(k,l,a){ledger.push({k,l,a});}function save(){saves++;}function farmSyncScene(){}function renderFarmUI(){}
function farmFocusXZ(){}function sfx(){}function storeBtn(){return {};}
var MG={open:(kind,opts,cb)=>callbacks.push(cb)},WV={trReveal:null},FV={on:true,R:null};
function worldTreasureReveal(){}function worldLootShow(x,y,o){shown.push(o);}function eur(x){return x+' €';}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}function icHTML(id){return '<i>'+id+'</i>';}
function setTimeout(cb,delay){timers.push({cb,delay});return timers.length;}
function coinFly(x,y,n){fx.push(['cash',n]);}function farmCloverFlyAt(x,y,n){fx.push(['clover',n]);}function xpFly(x,y,n){fx.push(['xp',n]);}function flyItem(id,x,y,target,d,n){fx.push([id,n]);}
`);
run(read('worldview.js').match(/const TR_TXT = \[[^\n]+/)[0]);run(read('worldview.js').match(/const TR_CSS = \[[^\n]+/)[0]);
for(const [file,names] of [
 ['farm.js',['farmInv','farmStoreUsed','farmQsOn','farmAdd','farmRoom','farmItemArea','farmOrderAreaOn']],
 ['erbe.js',['lvOfXp','flv','farmAreaOpen','farmStores','farmTreasureCur','farmTreasureLoot','farmTreasureDig']],
 ['worldview.js',['worldTreasureDig','worldTreasureReward']]
])for(const name of names)run(extract(file,name));
const get=s=>JSON.parse(run('JSON.stringify('+s+')'));
let count=0;
function test(name,fn){run('fresh()');fn();count++;console.log('ok '+name);}

test('Kapital skaliert den prächtigen Schatz auch bei Millionen und Milliarden',()=>{
 const sums=[];for(const cash of [1000,100000,1000000,50000000,1000000000]){
  run('fresh('+cash+',107,6);var r=farmTreasureDig(.8);');sums.push(run('r.m'));
  assert.ok(run('Number.isFinite(r.m)&&r.m>0'));assert.equal(run('S.money'),cash+run('r.m'));
 }
 assert.ok(sums[3]>=500000,'50 Mio. führen zu einem relevanten sechsstelligen Fund');
 assert.ok(sums[4]>sums[3]*10);assert.ok(sums[3]>sums[0]);
 run('fresh(50000000,107,6);var r=farmTreasureDig(.8);');assert.equal(run('r.m'),600000);
});
test('Einsteiger erhalten überschaubaren Loot, fortgeschrittene Spieler mehr EP/Kleeblätter',()=>{
 run('fresh(500,1,1);var r=farmTreasureDig(.8);');assert.ok(run('r.m>=50&&r.m<250'));assert.equal(run('r.xp'),26);assert.equal(run('r.clover'),1);
 run('fresh(500,107,6);var late=farmTreasureDig(.8);');assert.ok(run('late.m>10000'));assert.equal(run('late.xp'),426);assert.equal(run('late.clover'),7);
});
test('Grabqualität erhöht Geld, Warenplätze, Warenqualität und Fortschrittsbelohnungen',()=>{
 const r=[];for(const score of [.5,.8,1]){run('fresh(10000000,80,5);var r=farmTreasureDig('+score+');');r.push(get('r'));assert.ok(run('r.items.every(([id])=>S.farm.inv[id].q===2+r.stars)'));}
 for(let i=1;i<3;i++){assert.ok(r[i].m>r[i-1].m);assert.ok(r[i].xp>r[i-1].xp);assert.ok(r[i].items.length>r[i-1].items.length);}
});
test('Fehlende aktive Auftragsware wird vor beliebigem Vorrat geliefert, Mengen passen zum Bedarf',()=>{
 run(`fresh(1000,10,1);S.orders=[{id:'O1',acc:true,farm:{items:{brot:7}}}];var r=farmTreasureDig(.5);`);
 assert.deepEqual(get('r.items'),[['brot',7]]);assert.equal(run('S.farm.inv.brot.n'),7);
 assert.equal(run('S.orders[0].farm.taken'),undefined,'Schatz schickt keinen Auftrag ungefragt ab');
});
test('Nur freigegebene, erreichbare und lagerbare Waren; keine Energie, Tiere oder Trophäen',()=>{
 run(`allowed=new Set(['weizen','pokal','strom','fisch','wild','koeder']);S.farm.areas.see=true;var r=farmTreasureDig(1);`);
 assert.deepEqual(get('r.items.map(x=>x[0])'),['weizen']);
 assert.ok(run('r.cashBonus>0'));assert.equal(run('S.farm.inv.koeder'),undefined,'Köderkiste ist noch nicht vorhanden');
});
test('Gut gefüllte Waren ohne Bedarf werden übersprungen',()=>{
 run(`S.farm.inv={weizen:{n:50,q:3},brot:{n:50,q:3},bretter:{n:50,q:3}};allowed.delete('apfelkuchen');var r=farmTreasureDig(.8);`);
 assert.deepEqual(get('r.items'),[]);assert.ok(run('r.cashBonus>0'));assert.equal(run('S.farm.inv.weizen.n'),50);
});
test('Gemeinsames Lager wird schon bei der Planung reserviert und niemals überfüllt',()=>{
 run(`allowed=new Set(['brot','apfelkuchen']);S.farm.inv={kaese:{n:98,q:3}};S.orders=[{acc:true,farm:{items:{brot:10,apfelkuchen:10}}}];var r=farmTreasureDig(1);`);
 assert.equal(run('farmStoreUsed("barn")'),100);assert.equal(run('r.items.reduce((n,x)=>n+x[1],0)'),2);assert.ok(run('r.cashBonus>0'));
});
test('Volle Lager und fehlendes Sortiment ergeben Geldersatz statt verlorener Belohnungen',()=>{
 run(`capacity={silo:0,barn:0,holz:0};var r=farmTreasureDig(.8);`);
 assert.deepEqual(get('r.items'),[]);assert.ok(run('r.cashBonus>0'));assert.equal(run('ledger.length'),1);
 assert.equal(run('S.revenue'),run('r.m'));assert.equal(run('S.farm.stats.earned'),run('r.m'));
});
test('Abgelaufene oder bereits ausgelieferte Bestellungen erzeugen keinen künstlichen Bedarf',()=>{
 run(`allowed=new Set(['brot']);S.farm.inv={brot:{n:50,q:3}};S.orders=[{expire:99,farm:{items:{brot:100}}},{farm:{taken:true,items:{brot:100}}}];var r=farmTreasureDig(.5);`);
 assert.deepEqual(get('r.items'),[]);
 run(`fresh(1000,10,1);allowed=new Set(['brot']);S.farm.inv={brot:{n:50,q:3}};S.orders=[{acc:true,expire:99,farm:{items:{brot:60}}}];var r=farmTreasureDig(.5);`);
 assert.deepEqual(get('r.items'),[['brot',10]],'Angenommener Auftrag bleibt relevant');
});
test('Jede Kiste zahlt nur einmal, auch nach Speichern/Neuladen oder doppeltem Minispielabschluss',()=>{
 run('worldTreasureDig();worldTreasureDig();callbacks[0]({ok:true,score:.8});var saved=JSON.stringify(S);callbacks[1]({ok:true,score:1});');
 assert.equal(run('JSON.stringify(S)'),run('saved'));assert.equal(run('saves'),1);assert.equal(run('S.farm.tr.found'),1);assert.equal(run('S.farm.stats.events'),1);
 run('S=JSON.parse(saved);var again=farmTreasureDig(1);');assert.equal(run('again'),null);assert.equal(run('JSON.stringify(S)'),run('saved'));
 assert.ok(run('S.farm.tr.cur.reward.items.length>0'),'Fundinhalt gespeichert');
});
test('Ungültige Ergebnisse und Kapitalmangel beschädigen keine Geld-/EP-Werte',()=>{
 for(const score of ['NaN','undefined','null','-1','2']){run('fresh(-100,1,1);var r=farmTreasureDig('+score+');');assert.ok(run('Number.isFinite(r.m)&&Number.isFinite(r.xp)&&r.m>=50'));}
 for(const [score,stars]of [[.749,1],[.75,2],[.949,2],[.95,3]]){run('fresh();var r=farmTreasureDig('+score+');');assert.equal(run('r.stars'),stars);}
 run('fresh();S.time=501;');assert.equal(run('farmTreasureDig(1)'),null);
});
test('Anzeige und Fluganimationen zeigen genau den verbuchten Fund, ohne erneut zu belohnen',()=>{
 run('fresh(50000000,107,6);var r=farmTreasureDig(1),saved=JSON.stringify(S);worldTreasureReward(100,200,r,r.stars);timers.forEach(t=>t.cb());');
 assert.equal(run('shown[0].chips.length'),run('r.items.length+3'));assert.equal(run('shown[0].ms'),4800);
 assert.ok(run('shown[0].chips[0].includes(String(r.m))'));assert.equal(run('JSON.stringify(S)'),run('saved'));
 assert.equal(run('fx.filter(x=>!['+'"cash","clover","xp"'+'].includes(x[0])).length'),run('r.items.length'));
 run('shown=[];timers=[];fx=[];FV.on=false;worldTreasureReward(100,200,{m:100,clover:1,xp:20},1);timers.forEach(t=>t.cb());');
 assert.equal(run('shown[0].chips.length'),3);assert.equal(run('fx.length'),0);assert.equal(run('shown[0].ms'),3200);run('FV.on=true;');
});
/* Zusätzlich echte Waren-/Rezepttabellen und rekursive Produktionsfreigabe. */
{
 const R=vm.createContext({console});const rr=s=>vm.runInContext(s,R);
 for(const f of ['data.js','farmdata.js','fishdata.js','erbedata.js'])rr(read(f));
 rr(`var S;function clamp(x,a,b){return Math.max(a,Math.min(b,x));}function farmStoreCap(){return 100;}
 function angelS(){return {potLvl:0};}function farmGroundOk(){return false;}function farmXP(x){S.farm.xp+=x;}function logMoney(){}
 function freshReal(lv){S={stage:1,time:100,money:1000,revenue:0,orders:[],farm:{xp:50*(lv-1)**2,areas:{},objs:[{t:'field'}],trees:[],inv:{},stats:{events:0},tr:{cur:{until:500,done:false}}}};Math.random=()=>.5;}
 `);
 for(const [f,names]of [['farm.js',['farmOrders','farmInv','farmStoreUsed','farmRoom','farmQsOn','farmAdd','farmItemArea','farmOrderAreaOn','farmCropOk','farmCanMake','machReady']],['erbe.js',['lvOfXp','flv','farmAreaOpen','farmStores','farmPotOk','farmTreasureCur','farmTreasureLoot','farmTreasureDig']]])for(const name of names)rr(extract(f,name));
 rr('freshReal(1);var r=farmTreasureDig(1);');
 assert.deepEqual(JSON.parse(rr('JSON.stringify(r.items.map(x=>x[0]).sort())')),['mais','weizen'],'Echte Einsteiger-Freischaltung');
 rr(`freshReal(30);S.farm.objs.push({t:'mill'},{t:'bakery'},{t:'tree',kind:'apfel'},{t:'coop',animals:[{}]});
 S.orders=[{acc:true,farm:{items:{apfelkuchen:7}}}];var can=farmCanMake('apfelkuchen'),r=farmTreasureDig(.8);`);
 assert.equal(rr('can'),true,'Rezept und seine Zutaten tatsächlich herstellbar');
 assert.equal(rr('r.items[0][0]'),'apfelkuchen');assert.ok(rr('r.items.every(([id])=>farmCanMake(id))'));
 count++;console.log('ok Echte Waren-/Rezepttabellen: Einsteiger-Getreide und verfügbare Backwaren nach Ausbau');
}
console.log(count+' Schatz-Szenarien bestanden: Kapital/Fortschritt, Bedarf/Freigaben, Lager, einmalige Vergabe, Speicherung und vollständige Lootanzeige.');
