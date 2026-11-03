/* v283: Zusätzliche Regressionstests: node hunt-v283.test.js */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const C={console};C.window=C;vm.createContext(C);
for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8')+'\nthis.H=typeof HUNT!=="undefined"?HUNT:null;',C);
const H=C.H;let count=0;
for(const k of ['hirsch','keiler','fasan']){
 const shades=new Set(),colors=new Set();
 for(let g=1;g<=24;g++){
  const gn=H.genes(k,.65,g);shades.add(H.shadeVariant(gn));
  const mesh=()=>H._v200.withLook(k,gn,()=>H._m[k==='hirsch'?'deerBody':k==='keiler'?'boarBody':'phBody']());
  const a=mesh().v,b=mesh().v;assert.deepEqual(a,b);assert.ok(a.every(Number.isFinite));
  assert.deepEqual(H.genes(k,.65,g),H.genes(k,.65,g));
  colors.add(require('node:crypto').createHash('sha256').update(JSON.stringify(a)).digest('hex'));count++;
 }
 assert.equal(shades.size,8);assert.ok(colors.size>=8);
 const original=H._m[k==='hirsch'?'deerBody':k==='keiler'?'boarBody':'phBody']().v;
 H._v200.withLook(k,H.genes(k,.65,81),()=>H._m.phBody());
 assert.deepEqual(H._m[k==='hirsch'?'deerBody':k==='keiler'?'boarBody':'phBody']().v,original);
}
assert.equal(H.shadeVariant(H.genes('hirsch',.65,0)),-1);
const personalities=new Set();for(let g=1;g<=30;g++)personalities.add(H.temperOf(H.genes('hirsch',.65,g)).name);assert.equal(personalities.size,3);
const A={x:H.EYER[0]+20,z:H.EYER[2],gn:H.genes('hirsch',.65,10)};
assert.ok(H.scentGain(A,{v:3,dir:0})>.04,'Wind zum nahen Stück überwiegt Alarmabbau');
assert.equal(H.scentGain(A,{v:3,dir:Math.PI}),0);
assert.equal(H.scentGain(A,{v:1,dir:0}),0);
for(const front of [false,true]){const v=H._m.deerUpper(front).v;let top=-Infinity;for(let i=1;i<v.length;i+=9)top=Math.max(top,v[i]);assert.ok(top>.05,'Laufprofil reicht in den Rumpf, ohne aufgesetzte Gelenkkugel');}
console.log('OK: '+count+' deterministische Modelle, acht Nuancen je Art, Paletten-Rücksetzung, drei Temperamente, Windrichtung/Stärke und überlappende Gelenkansätze.');

for(const k of ['hirsch','keiler'])for(const g of [0,1,8])for(const front of [false,true]){
const gn=H.genes(k,.7,g);const mesh=H._v200.withLook(k,gn,()=>H._m[k==='hirsch'?'deerUpper':'boarUpper'](front));
assert.ok(mesh.v.every(Number.isFinite),'Gelenke auch bei alten Datensätzen ohne Farbnuance gültig');}
