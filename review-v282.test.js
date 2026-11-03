/* v282: Regressionstests, ohne Browser: node review-v282.test.js */
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict'), path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const ctx=vm.createContext({DECISIONS:{},console});
vm.runInContext(read('corp.js'),ctx);
vm.runInContext(`var S={money:1e8,time:0,corp:{talks:{},spite:{}}};
rivalById=id=>({name:id}); money=x=>String(x); roundK=(x,k)=>Math.round(x/k)*k;
pick=a=>a[0];save=()=>{};renderCorp=()=>{};corpClose=(id,amount)=>{S.closed=amount};`,ctx);
const run=s=>vm.runInContext(s,ctx);
for(const res of [3100000,3450000,4100000]) {
 run(`S.closed=null;S.corp.talks.blitz={val:3450000,res:${res},round:0,ask:null,chat:[]};`);
 run('corpOffer("blitz",2940000)');
 assert.equal(run('S.corp.spite.blitz'),undefined);
 assert.ok(run('S.corp.talks.blitz.ask')<3450000);
 const first=run('S.corp.talks.blitz.ask');
 run('corpOffer("blitz",2960000)');
 assert.ok(run('S.corp.talks.blitz.ask')<=first);
 run('corpOffer("blitz",S.corp.talks.blitz.ask,true)');
 assert.equal(run('S.corp.talks.blitz.done'),true);
}
run('S.corp.talks.blitz={val:3450000,res:3100000,round:0,chat:[]};corpOffer("blitz",3200000)');
assert.equal(run('S.closed'),3200000);
run('S.corp.talks.blitz={val:3450000,res:3100000,round:0,chat:[]};corpOffer("blitz",1000000)');
assert.equal(run('S.corp.talks.blitz.cool'),2880);
// Das gespeicherte Porträt muss vor der asynchronen Bildprüfung bereits stimmen.
const art=vm.createContext({console});vm.runInContext(read('avatar.js'),art);
for(let i=1;i<=10;i++) {
 assert.match(vm.runInContext(`portraitHTML({art:'p${i}'},42,{uid:'test'})`,art),new RegExp(`src="player-p${i}.png"`));
 assert.ok(fs.existsSync(path.join(__dirname,`player-p${i}.png`)));
}
assert.match(vm.runInContext('portraitHTML({photo:"data:image/png;base64,AAAA",art:"p2"},42)',art),/pt-photo/);
// Echte Modellbauer mit der echten Engine ausführen; keine WebGL-Initialisierung nötig.
vm.runInContext(read('gl3d.js'),art);
vm.runInContext(read('officefp.js').replace('return { enter, leave,','return { geometry: {handMesh, mouseMesh, torsoMesh, GRIPS}, enter, leave,'),art);
const geometry=vm.runInContext(`(()=>{const g=OFFICE3D.geometry,L={skin:0xe2b48a,skinS:0xb58b6a,tw:0.3,td:0.18,oc:0x445566,ocS:0x334455,ocT:0x556677,role:'disp'};
const meshes=[g.mouseMesh()];for(const outfit of ['warnweste','bluse','kapuzenpulli','latzhose','lederjacke']) meshes.push(g.torsoMesh({...L,outfit}));
for(const grip of Object.keys(g.GRIPS))for(const side of [-1,1])meshes.push(g.handMesh(L,side,grip));
return meshes.map(m=>m.v);})()`,art);
for(const verts of geometry){assert.ok(verts.length>0);assert.ok(verts.every(Number.isFinite));}
console.log('OK: seriöse Gegenangebote ohne Preisaufschlag, Annahme, niedrige Angebote, sofortige Porträts/Fotovorrang, 22 Modelle ohne ungültige Koordinaten.');
