/* v289: Modelle und Gischtraten prüfen: node waterfall-v289.test.js */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const C={console};C.window=C;vm.createContext(C);const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
for(const f of ['gl3d.js','farmmodels.js','bushes.js','woodmodels.js'])vm.runInContext(read(f),C);
for(const name of ['springFall','springFoam','springBasin','springRocks']){
 const a=vm.runInContext('FWM.'+name+'().v',C),b=vm.runInContext('FWM.'+name+'().v',C);assert.deepEqual(a,b);assert.ok(a.length>0&&a.every(Number.isFinite),name);assert.ok(a.length/9<60000,'Modellbudget '+name);
 if(name==='springFall')for(let i=6;i<a.length;i+=9){assert.ok(a[i]>=0&&a[i]<=1&&a[i+1]>=0&&a[i+1]<=1);assert.equal(a[i+2],1);}
}
const source=read('worldview.js'),effects=source.slice(source.indexOf('  /* v190: Gischt'),source.indexOf('  /* v207: Spritzer'));
const samples=[];
for(const fps of [30,60,120]){
 const emitted=[],sf={x:0,z:0,lx:-1,lz:0,ly:3,dx:1,dz:0,side:[0,1],w:1.74,strands:[{x:-1,z:-1,y:.4},{x:-1,z:1,y:.4}]};
 const q={WV:{springFx:sf},FV:{R:{cam:{tx:0,tz:0},env:{sunCol:[.08,.08,.08]},emit:p=>emitted.push(p)}},dt:1/fps,Math};vm.createContext(q);
 const code=new vm.Script("{\n"+effects+"\n}");for(let i=0;i<fps*10;i++)code.runInContext(q);
 assert.ok(emitted.length>470&&emitted.length<=490,'Partikelbudget bei '+fps+' fps');
 for(const p of emitted){for(const f of ['x','y','z','vx','vy','vz','life','size','size2'])assert.ok(Number.isFinite(p[f]),f);assert.ok(p.life>0&&p.size>0&&p.col.every(Number.isFinite));}
 samples.push(emitted.length);q.FV.R.cam.tx=1000;const n=emitted.length;code.runInContext(q);assert.equal(emitted.length,n,'Kamerafern keine neuen Partikel');
}
assert.ok(Math.max(...samples)-Math.min(...samples)<=5,'Emissionen unabhängig von Bildrate');
console.log('OK: vier deterministische Wasserfallmodelle, gültige Strömungskoordinaten, begrenzte Gischt bei 30/60/120 fps und keine Emissionen bei ferner Kamera.');
