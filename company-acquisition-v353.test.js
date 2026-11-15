/* node company-acquisition-v353.test.js — echte Angebots-/Übergabelogik,
   Fahrzeugwerte, Büroklassen, Personalregeln; UI separat im Browser geprüft. */
const assert = require('node:assert/strict');
const {run,get} = require('./test-support/company-fixture');
let count=0;
function test(name,fn){run('fresh();save=function(){saves++;return true};');fn();count++;console.log('ok '+name);}
function offer(id='w3_zenit'){run(`openCorp('${id}');var t=corp().talks['${id}'],d=t.deal353;`);}
function buy(id='w3_zenit'){run(`corpOffer('${id}',corp().talks['${id}'].val,true);`);}

test('Hochwertiges Unternehmen hat konkrete, besetzte und eingerichtete Standorte',()=>{
 offer();
 assert.ok(run('t.val>5e7&&t.val<15e7'));
 assert.ok(run('d.sites[0].tier>=3'));
 assert.ok(run('corpDealSummary(d).staff>=20'));
 assert.ok(run('d.sites[0].staff.every(p=>p.skill>=4)'));
 assert.ok(run('d.sites[0].deco.kitchen!=="keine"&&d.sites[0].deco.floor!=="beton"'));
 assert.ok(run('d.sites.every(b=>driverCap(b)>=b.vehicles.length&&rolePower(b,"disp")>0)'));
 assert.match(run('modalHTML'),/Mitarbeitende · Ø/);
 assert.match(run('modalHTML'),/Verbindliche Flotte/);
});

test('Nach Öffnen, Etappen-/Marktwechsel und Laden bleibt das Angebot identisch',()=>{
 run('S.stage=3;');offer();
 const quote=get('d'); const val=run('t.val');
 run('S.stage=6;S.share.w3_zenit=2;S.share.me=90;S=JSON.parse(JSON.stringify(S));corpSyncRivals(true);openCorp("w3_zenit");');
 assert.deepEqual(get('corp().talks.w3_zenit.deal353'),quote);
 assert.equal(run('corpValue("w3_zenit")'),val);
 buy(); assert.equal(run('corp().owned.w3_zenit.veh'),quote.fleet.length);
});

test('Exakt zugesagte IDs, Zustände, Teamrollen und Ausstattung werden übernommen',()=>{
 offer();const quote=get('d');const cash=run('S.money');buy();
 assert.equal(run('S.money'),cash-run('t.val'));
 assert.deepEqual(get('S.fleet'),quote.fleet);
 assert.deepEqual(get('S.bases'),quote.sites);
 const receipt=get('corp().owned.w3_zenit.receipt353');
 assert.deepEqual(receipt.vehicleIds,quote.fleet.map(v=>v.uid));
 assert.deepEqual(receipt.staffIds,quote.sites.flatMap(b=>b.staff.map(p=>p.id)));
 assert.equal(receipt.staff,quote.sites.reduce((n,b)=>n+b.staff.length,0));
 assert.equal(receipt.cust,quote.orders.length);
 assert.equal(run('S.share.w3_zenit'),0);
});

test('Vorhandener voller Sitz verliert weder Personal noch individuelle Einrichtung',()=>{
 run(`S.bases=[{id:'ALT',node:'mannheim',tier:0,staff:[{id:'ALT-P',role:'fahr',skill:3}],vehicles:[],mood:80,deco:{floor:'parkett',kitchen:'barista',wall:'terra',tint:'warm',plants:['olive'],pos:{desks:{0:[77,123]},plants:{},kitchen:null},fitout322:0}}];`);
 const before=get('S.bases[0]');offer();buy();
 assert.deepEqual(get('S.bases[0]'),before);
 assert.equal(run('S.bases.filter(b=>b.node==="mannheim").length'),2);
 assert.equal(run('ledger.filter(l=>l.l.startsWith("Verkauf Firmensitz")).length'),0);
 assert.equal(run('corp().owned.w3_zenit.receipt353.staffIds.every(id=>S.bases.some(b=>b.staff.some(p=>p.id===id)))'),true);
});

test('Mitgekaufte Standorte bleiben auch über der Gründungsgrenze erhalten',()=>{
 run('S.stage=1;S.corp.owned={};S.share={me:90,blitz:10};S.bases=[{id:"ALT",node:"b-mitte",tier:0,staff:[],vehicles:[],deco:{}}];');
 offer('blitz');const n=run('d.sites.length');buy('blitz');
 assert.equal(run('S.bases.length'),1+n);
 assert.equal(run('corp().hq.blitz'),undefined);
});

test('Fahrzeuge stehen auf geeigneten Verkehrsknoten und sind vollständig zugeordnet',()=>{
 offer();buy();
 assert.equal(run('S.fleet.every(v=>N[v.at].modes.includes(vType(v.type).mode))'),true);
 assert.equal(run('S.fleet.every(v=>baseOfVehicle(v.uid)&&baseOfVehicle(v.uid).node===v.at)'),true);
 assert.equal(run('S.bases.reduce((n,b)=>n+b.vehicles.length,0)'),run('S.fleet.length'));
});

test('Reservierte gesperrte Standorte öffnen später einmalig mit dem vollständigen Team',()=>{
 run('CORP.w3_zenit.hq="singapur";');offer();
 run('S.stage=3;');buy();
 assert.ok(run('corp().hq.w3_zenit.sites353.length>0'));
 const n=run('corp().owned.w3_zenit.staff');
 run('S.stage=6;corpHqTry();var once=JSON.stringify(S.bases);corpHqTry();');
 assert.equal(run('JSON.stringify(S.bases)'),run('once'));
 assert.equal(run('S.bases.reduce((n,b)=>n+b.staff.length,0)'),n);
});

test('Doppeltippen, direkter zweiter Kauf und erneut geladene Quittung belasten nur einmal',()=>{
 offer();buy();const after=get('S');
 run('corpOffer("w3_zenit",t.val,true);corpClose("w3_zenit",t.val);S=JSON.parse(JSON.stringify(S));corpClose("w3_zenit",1);');
 assert.deepEqual(get('S'),after);
 assert.equal(run('ledger.filter(x=>x.l.startsWith("Übernahme:")).length'),1);
});

test('Unzureichendes Guthaben und ungültige Preise verändern keinen Besitz',()=>{
 offer();run('S.money=1;');const before=get('S');
 run('corpOffer("w3_zenit",t.val,true);');assert.deepEqual(get('S'),before);
 for(const amount of ['NaN','Infinity','-100','0']){
  run(`corpOffer('w3_zenit',${amount},true);`);assert.deepEqual(get('S'),before);
 }
});

test('Speicherfehler nimmt Abbuchung, Objekte, Ruf, Marktanteil und Beleg zurück',()=>{
 offer();const before=get('S');run('save=()=>false;corpClose("w3_zenit",t.val);');
 assert.deepEqual(get('S'),before);
 assert.equal(run('timers.length'),0);
 assert.match(run('notices.at(-1)'),/zurückgenommen/);
});

test('Speicherfehler verbraucht auch im Verhandlungsdialog keine Runde',()=>{
 offer();const before=get('S');run('save=()=>false;corpOffer("w3_zenit",t.val,true);');
 assert.deepEqual(get('S'),before);
 assert.match(run('modalHTML'),/Kauf wurde nicht abgeschlossen/);
});

test('Fehlerhafte oder doppelte Asset-IDs werden vor der Zahlung abgefangen',()=>{
 offer();run('d.sites[0].staff[0].id=d.fleet[0].uid;');const before=get('S');
 run('corpClose("w3_zenit",t.val);');assert.deepEqual(get('S'),before);
 assert.match(run('notices.at(-1)'),/Doppelte Kennung/);
});

test('Kaufbeleg bleibt nach Nutzung, Umzug, Zeitablauf und Laden unverändert',()=>{
 offer();buy();const receipt=get('corp().owned.w3_zenit.receipt353');
 run('S.fleet[0].wear=89;S.fleet[0].at="b-mitte";S.bases[0].staff[0].skill=1;S.time+=10000;S=JSON.parse(JSON.stringify(S));');
 assert.deepEqual(get('corp().owned.w3_zenit.receipt353'),receipt);
 assert.equal(run('corp().owned.w3_zenit.receipt353.assets.fleet[0].wear'),receipt.assets.fleet[0].wear);
});

test('Alte Spielstände erhalten keine erfundenen rückwirkenden Vermögenswerte',()=>{
 const history=get('S.corp.owned');run('corpHTML();corpHqTry();');assert.deepEqual(get('S.corp.owned'),history);
 assert.equal(run('S.fleet.length'),0);
});

test('Liquidationswert begrenzt die Verhandlung und verhindert Sofortverkaufsgewinn',()=>{
 offer();run('corpOffer("w3_zenit",Math.round(t.val*.7));');
 assert.ok(run('t.ask>=d.appraisal.floor'));
 assert.ok(run('d.appraisal.floor>d.appraisal.fleetValue+d.sites.reduce((n,b)=>n+Math.round(buyPrice(b.node,tierOf(b))*.55),0)'));
});

test('Branchenprofile unterscheiden Schwerlast, Kühlkette und Lkw-Betrieb',()=>{
 run(`for(const k of ['vulkan','eisberg','titan']){const t=CORP_WAVE_POOL.find(x=>x.k===k);S.corp.rivals.push({...t,id:'w5_'+k,wave:5,hq:'hamburg',fleet:12,tier:3,modes:'rbilsa'});}corpSyncRivals(true);`);
 assert.ok(run('corpFleetPlan("w5_vulkan").fleet.every(f=>vType(f.type).flags.includes("sperrig")&&"rl".includes(vType(f.type).mode))'));
 assert.ok(run('corpFleetPlan("w5_eisberg").fleet.every(f=>vType(f.type).flags.includes("kuehl"))'));
 assert.ok(run('corpFleetPlan("w5_titan").fleet.every(f=>vType(f.type).mode==="r"&&vType(f.type).cap>=12000)'));
});

test('Nach gescheiterter Verhandlung ist ein neues vollständiges Angebot möglich',()=>{
 offer();run('corpOffer("w3_zenit",Math.floor(t.val*.5));S.time=t.cool+1;openCorp("w3_zenit");');
 assert.equal(run('corp().talks.w3_zenit.round'),0);
 assert.ok(run('corp().talks.w3_zenit.deal353.sites.every(b=>b.staff.length>0)'));
 buy();assert.ok(run('!!corp().owned.w3_zenit.receipt353'));
});

test('Sehr große spätere Konzerne erhalten mehrere ausreichend große Betriebsstandorte',()=>{
 run('CORP.w3_zenit.fleet=210;');offer();buy();
 assert.equal(run('S.fleet.length'),213);
 assert.ok(run('S.bases.every(b=>b.staff.length<=tierOf(b).desks&&b.vehicles.length<=tierOf(b).slots&&driverCap(b)>=b.vehicles.length&&dispCap(b)>=b.vehicles.length)'));
});

console.log(count+' Übernahmeszenarien bestanden.');
