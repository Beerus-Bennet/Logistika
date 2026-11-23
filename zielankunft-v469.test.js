/* v469: Nitro/Drift im Kies und Freifahren ohne Zurücksetzen/Abkürzung. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['cars.js','racehandling.js','racetrack.js','racedrive.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C,{filename:f});
const run=s=>vm.runInContext(s,C),T=run('RACETRACK'),D=run('RACEDRIVE'),car=run('CAR');let groups=0;
function outside(c,s=180,lane=10,speed=0){const a=D.create(c),p=T.at(s,lane);Object.assign(a,{x:p.x,z:p.z,h:p.heading,s:p.s,i:p.i,vx:Math.sin(p.heading)*speed,vz:Math.cos(p.heading)*speed,v:speed});return a;}
for(const id of ['p356','pgt3','bm2','lgal','mg63']){const a=outside(car[id]);D.update(a,{throttle:1,nitro:true},1/120);assert.equal(a.boost,true,id+' Nitro im Auslauf');assert.ok(a.nitro<100&&a.v>0);}
groups++;
for(const id of ['bm2','lgal']){const a=outside(car[id],180,10,20);D.update(a,{throttle:1,drift:true},1/120);assert.equal(a.drifting,true,id+' Drift im Kies');}
groups++;
let a=outside(car.pgt3);a.nitro=0;D.update(a,{throttle:1,nitro:true},1/120);assert.equal(a.boost,false);assert.equal(a.nitro,0);a=outside(car.pgt3);D.update(a,{throttle:0,brake:1,nitro:true},1/120);assert.equal(a.boost,false);assert.equal(a.nitro,100);groups++;
a=outside(car.pgt3);const parked=a.h;for(let i=0;i<120;i++)D.update(a,{steer:1,drift:true,throttle:0},1/120);assert.equal(a.h,parked,'Kein Drehen eines geparkten Autos ohne Gas');assert.equal(a.drifting,false);groups++;
const escapes=[];
for(const layout of T.layouts){T.use(layout.id);for(const id of ['p356','pgt3','bm2','lgal','mg63'])for(const side of [-1,1]){
 const a=outside(car[id],180,side*(T.HALF+6.5)),p=T.at(180);a.h=Math.atan2(p.nx*side,p.nz*side);let escaped=0;
 for(let i=0;i<120*7;i++){const n=T.near(a.x,a.z),aim=T.at(n.s+8),steer=Math.max(-1,Math.min(1,D.wrap(Math.atan2(aim.x-a.x,aim.z-a.z)-a.h)*2));D.update(a,{throttle:1,nitro:true,drift:true,steer},1/120);assert.ok(T.near(a.x,a.z).d<=T.HALF+6.50001);if(T.near(a.x,a.z).d<T.HALF){escaped=a.time;break;}}
 assert.ok(escaped>0&&escaped<6,id+' muss sich von beiden Leitplanken lösen können');assert.equal(a.penalty,0,'Kein versteckter Rücksetzvorgang');assert.equal(a.next,0,'Keine Kontrollpunkte geschenkt');assert.equal(a.finish,0);assert.ok(a.nitro<100);escapes.push({layout:layout.id,id,side,seconds:+escaped.toFixed(2)});
}}
groups++;
T.use('werder');a=outside(car.pgt3);D.recover(a);assert.equal(a.penalty,4);assert.equal(a.v,0);assert.equal(a.next,0);groups++;
a=outside(car.pgt3);a.finish=120;const snapshot=JSON.stringify(a);D.update(a,{throttle:1,nitro:true,drift:true,steer:1},1/120);assert.equal(JSON.stringify(a),snapshot,'Nach dem Ziel werden keine Eingaben mehr gefahren');groups++;
console.log('OK v469:',groups,'Prüfgruppen;',escapes.length,'Freifahrversuche ohne Rücksetzen.');console.log('Freifahren min/max Sekunden:',Math.min(...escapes.map(e=>e.seconds)),Math.max(...escapes.map(e=>e.seconds)));
