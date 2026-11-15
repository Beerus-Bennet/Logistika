/* node company-parking-v356.test.js — echte Adressen/Terminalpunkte, Bestandsschutz. */
const assert=require('node:assert/strict');
const {run,get}=require('./test-support/company-fixture');
let n=0;
const test=(name,fn)=>{run('fresh();save=()=>true;openCorp("w3_zenit");var t=corp().talks.w3_zenit,d=t.deal353;');fn();n++;console.log('ok '+name);};
test('Angebot reserviert konkrete Betriebshöfe und geeignete Terminalpositionen',()=>{
 run('delete corp().owned.pacific;S.share.pacific=5;openCorp("pacific");d=corp().talks.pacific.deal353;');
 assert.ok(run('d.sites.every(b=>Number.isFinite(b.addr.lat)&&Number.isFinite(b.addr.lon))'));
 assert.ok(run('d.fleet.every(v=>!!v.spot&&v.spotAt===v.at)'));
 run(`var roads=d.fleet.filter(v=>isDoorMode(vType(v.type).mode));`);
 assert.ok(run('roads.length>0'));
 assert.ok(run('roads.every(v=>{const b=d.sites.find(b=>b.vehicles.includes(v.uid));return v.spot.lat===b.addr.lat&&v.spot.lon===b.addr.lon&&v.spot.t===b.addr.t;})'));
 assert.ok(run('d.fleet.filter(v=>!isDoorMode(vType(v.type).mode)).every(v=>{const p=termPt(v.at,vType(v.type).mode);return Math.abs(v.spot.lat-p[0])<.000011&&Math.abs(v.spot.lon-p[1])<.000011;})'));
});
test('Kauf und Laden behalten dieselben Parkadressen',()=>{
 const quote=get('d.fleet');run('corpOffer("w3_zenit",t.val,true);S=JSON.parse(JSON.stringify(S));');
 assert.deepEqual(get('S.fleet'),quote);
});
test('Älteres offenes Angebot erhält nur Parkdaten, keine neue Bewertung oder Mannschaft',()=>{
 run('delete d.parking356;d.sites.forEach(b=>delete b.addr);d.fleet.forEach(v=>{delete v.spot;delete v.spotAt});var before={val:t.val,staff:d.sites.flatMap(b=>b.staff),fleet:d.fleet.map(v=>({uid:v.uid,type:v.type,wear:v.wear})),cash:S.money};openCorp("w3_zenit");');
 assert.deepEqual(get('({val:t.val,staff:d.sites.flatMap(b=>b.staff),fleet:d.fleet.map(v=>({uid:v.uid,type:v.type,wear:v.wear})),cash:S.money})'),get('before'));
 assert.ok(run('d.fleet.every(v=>!!v.spot)'));
});
test('Bestehende unbenutzte Standardstellplätze werden genau einmal zum Büro korrigiert',()=>{
 run('corpOffer("w3_zenit",t.val,true);S.fleet.forEach(v=>{v.spot={lat:1,lon:2,t:"Stellplatz, Test"};v.spotAt=v.at;});var cash=S.money,owned=JSON.stringify(corp().owned),count=corpParkRepair356(),once=JSON.stringify(S);corpParkRepair356();');
 assert.equal(run('count'),run('S.fleet.length'));
 assert.equal(run('JSON.stringify(S)'),run('once'));
 assert.equal(run('S.money'),run('cash'));assert.equal(run('JSON.stringify(corp().owned)'),run('owned'));
});
test('Kundenparkplätze, benutzte und fahrende Fahrzeuge bleiben unangetastet',()=>{
 run(`corpOffer("w3_zenit",t.val,true);var cars=S.fleet.slice(0,4);
 cars.forEach(v=>{v.spot={lat:1,lon:2,t:'Stellplatz, Test'};v.spotAt=v.at});
 cars[0].phase='haul';cars[0].route=[[1,2],[3,4]];cars[1].jobs=2;cars[2].spot.t='Kunde, Tor 7';cars[3].at='b-mitte';
 var before=JSON.stringify(cars);corpParkRepair356();`);
 assert.equal(run('JSON.stringify(cars)'),run('before'));
});
test('Selbst gekaufte Fahrzeuge ohne Übernahmeherkunft werden nicht versetzt',()=>{
 run('corpOffer("w3_zenit",t.val,true);var b=S.bases[0],v=makeVehicle("v-caddy");v.at=b.node;v.spot={lat:1,lon:2,t:"Stellplatz, Test"};v.spotAt=v.at;S.fleet.push(v);b.vehicles.push(v.uid);var before=JSON.stringify(v);corpParkRepair356();');
 assert.equal(run('JSON.stringify(v)'),run('before'));
});
console.log(n+' Park-/Bestandsschutzszenarien bestanden.');
