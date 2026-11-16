/* v366: Bachenden bis zur Inselkante, Baumsaum nur auf dem Randstreifen, Zoomgrenze überall. node inselrand-v366.test.js */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('worldview.js','utf8'),C=vm.createContext({console,Math});
vm.runInContext(fs.readFileSync('gl3d.js','utf8'),C);
vm.runInContext(`var FM={MB:G3.MB},WGRID={x0:-160,z0:-160,x1:104,z1:104},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function erbeRng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 function forestK(x,z){return z<0?1:0;}
 ${src.slice(src.indexOf('const APRON ='),src.indexOf('function worldGround('))}`,C);
const run=s=>vm.runInContext(s,C);
for(const line of ['[[-140,-61.5],[-164,-64]]','[[100,64],[112,65]]']){
 run(`var E=creekToRim(${line}),over=Math.hypot(E.end[0]+28,E.end[1]+28)-apronRim(Math.atan2(E.end[1]+28,E.end[0]+28));`);
 assert.ok(run('over>0&&over<1.5'),'Bach endet knapp über der Kante: '+run('over'));
 assert.ok(run('E.line.length>3&&E.line.slice(1).every((p,i)=>Math.hypot(p[0]-E.line[i][0],p[1]-E.line[i][1])<26)'),'keine Sprünge im Verlauf');
 assert.ok(run('rimFall(E,2.3).v.every(Number.isFinite)'));
}
run('var v=worldApronTrees((x,z)=>Math.abs(z+64)>6).v,inside=0,out=0,near=0;for(let i=0;i<v.length;i+=9){const x=v[i],z=v[i+2];if(x>-158&&x<102&&z>-158&&z<102)inside++;if(Math.hypot(x+28,z+28)>apronRim(Math.atan2(z+28,x+28))-1.5)out++;if(Math.abs(z+64)<3.5&&x<-160)near++;}');
assert.equal(run('inside'),0,'kein Baum in der Spielwelt');assert.equal(run('out'),0,'kein Baum über der Kante');assert.equal(run('near'),0,'Bachlauf frei');
assert.ok(run('v.length/27')>3000&&run('v.length/27')<40000,'Baumsaum vorhanden und sparsam: '+run('v.length/27'));
assert.ok(run('var w=worldApronTrees(null).v;w.length>=v.length'));
assert.match(fs.readFileSync('farmview.js','utf8'),/const lim = 450;/);
console.log('OK v366: Bachenden an der Kante, Baumsaum nur auf dem Randstreifen ('+Math.round(run('v.length/27'))+' Dreiecke), weite Übersicht überall.');
