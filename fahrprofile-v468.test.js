/* v468: Modelltechnik, echter Fahrzeugvorteil und unveränderliches Monatsfeld. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['cars.js','racehandling.js','racetrack.js','racedrive.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C,{filename:f});
const run=s=>vm.runInContext(s,C),H=run('RACEHANDLING'),D=run('RACEDRIVE'),T=run('RACETRACK'),cars=run('CARS'),car=run('CAR');let tests=0;
assert.equal(H.ids.length,127);assert.deepEqual([...H.ids].sort(),[...cars].map(c=>c.id).sort());
for(const c of cars){const p=H.profile(c),s=D.spec(c);for(const k of ['kg','wheelbase','tyre','aero','agility','drift','acc100'])assert.ok(Number.isFinite(p[k]),c.id+' '+k);assert.ok(p.kg>=500&&p.kg<=3100);assert.ok(p.source?.startsWith('https://en.wikipedia.org/wiki/'));assert.ok(['R','A'].includes(p.drive));assert.equal(s.max,c.vmax/3.6);assert.equal(p.estimated,!c.acc);}
tests++;
// Keine Marken- oder Auktionspreis-Boni: nur das technische Modell ist relevant.
const same={...car.bm2,b:'porsche',val:1e12};assert.deepEqual({...D.spec(same)},{...D.spec(car.bm2)});assert.ok(car.f250.val>car.bchi.val&&D.spec(car.f250).acc100>D.spec(car.bchi).acc100);tests++;
assert.equal(H.profile(car.bm2).drive,'R');assert.equal(H.profile(car.mamg).drive,'R');for(const id of ['bi8','mg63','lgal','fsf90','luru','ptay'])assert.equal(H.profile(car[id]).drive,'A',id+' bleibt Allrad');for(const id of ['ldia','flaf','pgt3','jxj'])assert.equal(H.profile(car[id]).drive,'R');assert.ok(H.profile(car.pgt3).kg<H.profile(car.bm2).kg);assert.ok(H.profile(car.pgt3).agility>H.profile(car.mg63).agility);assert.ok(H.profile(car.bm2).drift>H.profile(car.bi8).drift);tests++;
// Beschleunigung auf einer geraden, unendlich langen Prüfstrecke ohne Nitro.
const realTrack=run('RACETRACK.at'),realNear=run('RACETRACK.near');run(`RACETRACK.at=(s,lane=0)=>({x:lane,z:s,heading:0,nx:1,nz:0,s,i:0});RACETRACK.near=(x,z)=>({x:0,z,d:Math.abs(x),nx:1,nz:0,s:z,i:0,heading:0});`);
const measures=[];
for(const c of cars){const a=D.create(c);Object.assign(a,{x:0,z:0,h:0});for(let n=0;n<120*30&&a.v<100/3.6;n++)D.update(a,{throttle:1},1/120);const expected=H.profile(c).acc100;assert.ok(Math.abs(a.time-expected)<.045,c.id+': '+a.time+' statt '+expected);if(['p356','bm2','pgt3','lgal','bchi'].includes(c.id))measures.push({id:c.id,seconds:+a.time.toFixed(3)});}
tests++;
function slide(c){const a=D.create(c);Object.assign(a,{x:0,z:0,h:0,vx:4,vz:22});for(let i=0;i<120;i++)D.update(a,{throttle:1,drift:true},1/120);return Math.abs(a.vx);}
assert.ok(slide(car.bm2)>slide(car.bi8)*2,'RWD hält denselben Rutschimpuls spürbar länger als Allrad');
assert.ok(D.grip(D.spec(car.pgt3),35)>D.grip(D.spec(car.mg63),35),'Sportfahrwerk vs. schwerer hoher SUV');
const f=D.spec(car.bchi),g=D.spec(car.p944);assert.ok(D.force(f,40).push-D.force(f,40).drag>D.force(g,40).push-D.force(g,40).drag,'Leistungsgewicht wirkt oberhalb 100 km/h');assert.ok(D.spec(car.btou).max>120,'Kein gemeinsamer Hypercar-Tempolimiter');tests++;
run('RACETRACK.at=undefined;RACETRACK.near=undefined;');T.at=realTrack;T.near=realNear;
const signature=m=>JSON.stringify(H.lineup(m));assert.equal(signature(7),signature(7));assert.notEqual(signature(7),signature(8));
for(let m=0;m<120;m++){const field=H.lineup(m);assert.equal(field.length,5);assert.equal(new Set(field.map(r=>r.id)).size,5);for(const r of field)assert.ok(car[r.id]&&r.skill>=.87&&r.skill<=.96);}
const roster=signature(7);H.profile(car.bm2);H.profile(car.bchi);T.use('kurven');assert.equal(signature(7),roster,'Autowahl und Streckenumbau ändern das Monatsfeld nicht');tests++;
// Gleiche Fahrer mit unterschiedlichen Autos: Aufwertung verbessert die Rundenzeit.
const times={};
for(const id of ['p924','bm2','pgt3','bchi']){T.use('werder');const a=D.create(car[id],0,true);a.skill=.92;for(let i=0;i<120*360&&!a.finish;i++)D.aiUpdate(a,1/120);assert.equal(a.next,25,id);times[id]=a.finish;}
assert.ok(times.bm2<times.p924*.86,'Mehr Leistung hilft ohne Gegnerangleichung');assert.ok(times.pgt3<times.bm2,'Leichter GT3 mit passender Traktion/Grip schneller als M2');assert.ok(times.bchi<times.p924*.82,'Hypercar-Vorteil bleibt erhalten');tests++;
// Jedes Modell und jeder neue Kurs können ihre 25 Runden-/Zielmarkierungen erreichen.
for(const layout of T.layouts){T.use(layout.id);for(const c of cars){const a=D.create(c,0,true);for(let i=0;i<120*360&&!a.finish;i++)D.aiUpdate(a,1/120);assert.equal(a.next,25,c.id+' auf '+layout.id);assert.ok(a.finish>70&&a.finish<360);}}
T.use('werder');tests++;
console.log('OK v468:',tests,'Prüfgruppen, 127 Antritte und 381 vollständige KI-Läufe.');console.log('0–100 km/h:',measures);console.log('Gleicher Fahrer, Werder Ring:',times);
