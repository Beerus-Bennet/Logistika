/* v290: Schenkel ohne kugelige Aufsätze: node hunt-thighs-v290.test.js */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const C={console};C.window=C;vm.createContext(C);for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),C);
const run=s=>vm.runInContext(s,C);
for(const kind of ['hirsch','keiler'])for(const front of [false,true])for(const g of [0,52]){
 const v=run(`HUNT._v200.withLook('${kind}',HUNT.genes('${kind}',.65,${g}),()=>HUNT._m.${kind==='hirsch'?'deerUpper':'boarUpper'}(${front})).v`);
 assert.ok(v.every(Number.isFinite));let top=-Infinity,peak=-Infinity,peakY=0;
 for(let i=0;i<v.length;i+=9){top=Math.max(top,v[i+1]);const r=Math.hypot(v[i],v[i+2]);if(r>peak){peak=r;peakY=v[i+1];}}
 assert.ok(peakY<0,'Muskelbauch längs des Beins, nicht als Kugel über dem Gelenk');
 for(let i=0;i<v.length;i+=9)if(Math.abs(v[i+1]-top)<1e-6)assert.ok(Math.hypot(v[i],v[i+2])<.012,'Kein sichtbarer runder Deckel am Schenkelansatz');
 assert.ok(top>.05&&top<.08,'Verankerung bleibt im Rumpfbereich');
}
console.log('OK: Vorder-/Hinterschenkel beider Arten, alte/neue Farbdatensätze, länglicher Muskelbauch und schmal auslaufender Ansatz ohne runden Deckel.');
