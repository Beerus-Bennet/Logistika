/* v288: Kein doppeltes Handgelenk und keine Empfangsüberschneidung. Aufruf: node office-joints-v288.test.js */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const C={console};C.window=C;vm.createContext(C);
for(const f of ['avatar.js','gl3d.js','offices.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),C);
const src=fs.readFileSync(path.join(__dirname,'officefp.js'),'utf8').replace('return { enter, leave,','return { qa:{foreMesh,handMesh,GRIPS}, enter, leave,');vm.runInContext(src,C);
const run=s=>vm.runInContext(s,C);
run(`var S={stage:6,fleet:[]};var assertResult=[];`);
for(const tier of [3,4]){
 run(`var B={id:'test',tier:${tier},node:'berlin',staff:Array.from({length:36},(_,i)=>({id:'p'+i,role:'disp'})),vehicles:[],deco:{floor:'beton',tint:'natur',wall:'weiss',kitchen:'keine',plants:[],pos:{desks:{},plants:{},kitchen:null}}};`);
 const r=run('receptionPlan(B)');assert.ok(r);
 const rooms=run('[OFFICE3D.buildRoom(B,0),OFFICE3D.buildRoom(B,1)]');
 const counters=rooms[0].surf.filter(s=>s.kind==='counter');assert.equal(counters.length,1);assert.equal(rooms[1].surf.filter(s=>s.kind==='counter').length,0);
 for(const seat of rooms[0].seats){const c=counters[0];assert.ok(seat.x+.33<c.x0||seat.x-.33>c.x1||seat.z+.36<c.z0||seat.z-.3>c.z1,'Stuhl/Person überlappt den Empfang nicht');}
 run('B.deco.pos.desks[0]=[180,245]');assert.equal(run('receptionPlan(B)'),null);assert.equal(run('OFFICE3D.buildRoom(B,0).surf.filter(s=>s.kind==="counter").length'),0);
}
for(const side of [-1,1]){
 const m=run(`OFFICE3D.qa.foreMesh({sleeve:0x123456,skin:0xe0a080,outfit:'bluse'},${side})`);
 for(let i=6;i<m.v.length;i+=9){assert.ok(!(Math.abs(m.v[i]-224/255)<1e-5&&Math.abs(m.v[i+1]-160/255)<1e-5&&Math.abs(m.v[i+2]-128/255)<1e-5),'Unterarm hat keinen eigenen hautfarbenen Gelenkknubbel');}
}
console.log('OK: Empfang und sämtliche EG-Sitzplätze in Bürogebäude/Konzernzentrale kollisionsfrei; Obergeschoss ohne Tresen; manuelle Überschneidung abgefangen; kein zweiter Hautabschluss am Unterarm.');
