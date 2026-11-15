/* v306/v353: Firmenwert-Regressionsprüfungen. Branchen werden für den
   Preisvergleich angeglichen; gleiche Anzahl allein bedeutet nicht gleicher Wert. */
const assert=require('node:assert/strict');
const {run,get}=require('./test-support/company-fixture');
let count=0;
function test(name,fn){run('fresh()');fn();count++;console.log('ok '+name);}

test('Screenshot reproduziert: 10/11/12 Prozent bei ähnlicher Flotte liegen in vergleichbarer Größenordnung',()=>{
 /* Die Ausgangsfälle wurden vor der Änderung mit dem originalen v301-Code
    auf 5.700.000 / 636.350.000 / 548.410.000 Euro reproduziert. Der Test
    bleibt unabhängig von späteren Änderungen an origin/main ausführbar. */
 run('CORP.w4_eisberg.k=CORP.w4_titan.k=CORP.w3_zenit.k;');
 const vals=get('['+'"w3_zenit","w4_eisberg","w4_titan"'+'].map(corpValue)');
 assert.ok(Math.max(...vals)/Math.min(...vals)<1.5,'Kein hundertfacher Aufschlag bei vergleichbarer Ausstattung');
 assert.ok(vals[1]>vals[0],'Größere Flotte und etwas mehr Anteil bleiben wertvoller');
 console.log('  Vergleichswerte v306:',vals.join(' / '));
});
test('Standort und alte Wellenbasis werden nicht als Multiplikator auf die ganze Firma angewendet',()=>{
 run('var original=corpValue("w3_zenit"),fleet=corpAppraisal("w3_zenit").fleetValue;CORP.w3_zenit.base*=1000;');
 assert.equal(run('corpValue("w3_zenit")'),run('original'));
 run('CORP.w3_zenit.hq="casablanca";var other=corpAppraisal("w3_zenit");');
 assert.equal(run('other.fleetValue'),run('fleet'));assert.ok(run('other.total/original<1.25'));
});
test('Gleiche Vermögenswerte und Marktanteile ergeben gleichen Wert unabhängig von Name und Welle',()=>{
 run(`CORP.w4_eisberg.k=CORP.w3_zenit.k;CORP.w4_eisberg.fleet=12;CORP.w4_eisberg.tier=2;CORP.w4_eisberg.hq='mannheim';
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
 assert.ok(run('t.chat.some(m=>/Bewertung/.test(m.t))'));assert.match(run('modalHTML'),/Bewertung: Flotte/);
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
test('Doppelter Sitz bleibt als zusätzliches Büro samt vollständigem Team erhalten',()=>{
 run(`S.bases=[{id:'B0',node:'mannheim',tier:2,staff:[],vehicles:[],deco:{}}];openCorp('w3_zenit');var t=S.corp.talks.w3_zenit,cash=S.money,sites=t.deal353.sites.length;t.ask=t.val;corpOffer('w3_zenit',t.ask,true);`);
 assert.equal(run('S.money'),run('cash-t.val'));assert.equal(run('ledger.filter(x=>x.l.startsWith("Verkauf Firmensitz")).length'),0);
 assert.equal(run('S.bases.length'),run('1+sites'));assert.equal(run('S.corp.hq.w3_zenit'),undefined);
 run('var balance=S.money;corpHqTry();');assert.equal(run('S.money'),run('balance'));
});
console.log(count+' Firmenwert-Szenarien bestanden; echte Preis-/Übergabelogik, kein Live-Browser-/Handytest.');
