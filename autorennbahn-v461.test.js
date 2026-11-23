/* v461: Fahrphysik, Kontrollpunkte, KI und begrenzte Modellarbeit. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','cars.js','racecars.js','racetrack.js','racehandling.js','racedrive.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);
const get=s=>vm.runInContext(s,C),T=get('RACETRACK'),D=get('RACEDRIVE'),cars=get('CARS');let checks=0;
assert.ok(T.length>1400&&T.length<1600);checks++;
for(let s=-500;s<2*T.length;s+=3.7){const p=T.at(s),q=T.near(p.x,p.z,p.i);assert.ok(q.d<1e-7);assert.ok(Math.abs(Math.hypot(p.nx,p.nz)-1)<1e-10);}
const stage=T.stage();assert.ok(stage.v.every(Number.isFinite));assert.ok(stage.v.length/27<18000,'Begrenztes Streckenbudget');
for(let i=0;i<stage.v.length;i+=9)if(Math.abs(stage.v[i+1]-.035)<1e-8||Math.abs(stage.v[i+1]+.015)<1e-8)assert.ok(stage.v[i+4]>=0,'Randsteine auf beiden Seiten von oben sichtbar');
const mini=T.miniature().v;assert.ok(mini.length/27<6000,'Miniatur besitzt eine sparsame Detailstufe');for(let i=0;i<mini.length;i+=9){assert.ok(Math.abs(mini[i])<T.W/2);assert.ok(Math.abs(mini[i+2])<T.D/2);}checks++;
for(const c of cars){const m=T.car(c);assert.ok(m.v.every(Number.isFinite),c.id);assert.ok(m.v.length/27<(c.id==='lgal'?3600:600),c.id+' niedriges Fahrzeugbudget');}checks++;
const c={vmax:260,acc:5};
function start(s=180){const a=D.create(c),p=T.at(s);Object.assign(a,{x:p.x,z:p.z,h:p.heading,i:p.i,s:p.s});return a;}
let a=start();for(let i=0;i<240;i++)D.update(a,{steer:0,throttle:1},1/120);assert.ok(a.v>8&&a.km>0&&a.wear>0);checks++;
let regular=start(),nitro=start();for(let i=0;i<240;i++){D.update(regular,{throttle:1},1/120);D.update(nitro,{throttle:1,nitro:true},1/120);}assert.ok(nitro.v>regular.v*1.4);assert.ok(nitro.nitro<60);assert.ok(nitro.wear>regular.wear);const used=nitro.nitro;D.update(nitro,{throttle:0},.02);assert.ok(nitro.nitro>used);checks++;
let grip=start(),drift=start();for(const a of [grip,drift]){a.vx=Math.sin(a.h)*20+Math.cos(a.h)*4;a.vz=Math.cos(a.h)*20-Math.sin(a.h)*4;}D.update(grip,{throttle:1},.02);D.update(drift,{throttle:1,drift:true},.02);const lateral=a=>Math.abs(a.vx*Math.cos(a.h)-a.vz*Math.sin(a.h));assert.ok(lateral(drift)>lateral(grip));assert.ok(drift.drift>0);checks++;
a=start();a.vx=20*Math.sin(a.h);a.vz=20*Math.cos(a.h);for(let i=0;i<240;i++)D.update(a,{brake:1},1/120);assert.ok(a.v<.01);checks++;
a=start();let p=T.at(180,30);a.x=p.x;a.z=p.z;D.update(a,{throttle:1},.02);assert.ok(T.near(a.x,a.z).d<=T.HALF+6.6);assert.ok(Number.isFinite(a.h));checks++;
// Alle Modellklassen schaffen den vollständigen Kurs ohne Abkürzungen.
for(const i of [0,1,5,10,30,60,100,cars.length-1]){a=D.create(cars[i],i%6,true);for(let n=0;n<120*360&&!a.finish;n++)D.aiUpdate(a,1/120);assert.equal(a.next,25);assert.equal(a.lap,2);assert.ok(a.finish>90&&a.finish<360);assert.ok(a.km>2.85&&a.km<3.3);}checks++;
// Rückwärts über Start und direkt vom Start zur Ziellinie reichen nicht.
a=D.create(c);p=T.at(T.START);a.x=p.x-Math.sin(p.heading)*2;a.z=p.z-Math.cos(p.heading)*2;D.gate(a,p.x+Math.sin(p.heading)*2,p.z+Math.cos(p.heading)*2);assert.equal(a.next,0);
a.x=p.x+Math.sin(p.heading)*2;a.z=p.z+Math.cos(p.heading)*2;a.s=T.START+2;D.gate(a,p.x-Math.sin(p.heading)*2,p.z-Math.cos(p.heading)*2);assert.equal(a.next,1);
D.gate(a,p.x-Math.sin(p.heading)*2,p.z-Math.cos(p.heading)*2);assert.equal(a.next,1);assert.equal(a.finish,0);checks++;
a.next=7;a.lap=0;a.s=1000;D.recover(a);assert.equal(a.next,7);assert.equal(a.penalty,4);assert.ok(Math.abs(a.s-(T.START+6*T.length/12+4))<.01);assert.equal(a.v,0);checks++;
// Derselbe Kurs ist mit der freien Fahrphysik ohne Schienenhilfe schaffbar.
a=D.create(c);for(let i=0;i<120*240&&!a.finish;i++){const p=T.at(a.s+10+a.v*.3),h=Math.atan2(p.x-a.x,p.z-a.z),steer=Math.max(-1,Math.min(1,D.wrap(h-a.h)*2));let curv=0;for(const look of [12,26,42])curv=Math.max(curv,Math.abs(D.wrap(T.at(a.s+look).heading-T.at(a.s+look-10).heading))/10);const target=Math.min(a.spec.max*.9,Math.sqrt(5/Math.max(.002,curv)));D.update(a,{steer,throttle:a.v<target+1?1:0,brake:a.v>target+2?1:0,nitro:curv<.006},1/120);}assert.equal(a.next,25);assert.equal(a.lap,2);assert.ok(a.finish>140&&a.finish<220);assert.ok(a.wear<1);checks++;
console.log('OK v461: '+checks+' Prüfgruppen, '+cars.length+' Automodelle, '+Math.round(T.length)+' m Strecke, '+stage.v.length/27+' Streckendreiecke.');
