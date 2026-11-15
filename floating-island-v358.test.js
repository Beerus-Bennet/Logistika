/* v358: Anschlusskante, Volumen und geschlossener Inselkörper ohne WebGL. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('worldview.js','utf8'),C=vm.createContext({console,Math});
vm.runInContext(fs.readFileSync('gl3d.js','utf8'),C);
vm.runInContext(`var FM={MB:G3.MB},WGRID={x0:-160,z0:-160,x1:104,z1:104};${src.slice(src.indexOf('const APRON ='),src.indexOf('function worldGround('))}var mesh=worldApron((x,z)=>[.4+(x+160)/2640,.6,.3]).v;`,C);
const v=Array.from(vm.runInContext('mesh',C)),edges=new Map(),pt=i=>v.slice(i,i+3),key=p=>p.map(n=>n.toFixed(6)).join(',');
let low=0,top=0,soil=0,area=0;
for(let i=0;i<v.length;i+=27){
 const p=[pt(i),pt(i+9),pt(i+18)],ny=v[i+4];
 assert.ok(p.flat().every(Number.isFinite));
 for(let j=0;j<3;j++){
  const a=key(p[j]),b=key(p[(j+1)%3]),k=[a,b].sort().join('|');edges.set(k,(edges.get(k)||0)+1);
 }
 const a=p[1].map((n,k)=>n-p[0][k]),b=p[2].map((n,k)=>n-p[0][k]);
 const cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 assert.ok(Math.hypot(...cross)>1e-5,'keine degenerierten Flächen');area+=Math.hypot(...cross)/2;
 if(p.every(q=>q[1]>=-.35)){assert.ok(ny>.85,'Grasdecke nach oben');top++;}
 if(p.every(q=>q[1]<=-100)){assert.ok(ny<0,'Unterseite nach unten');low++;}
 if(p.every(q=>q[1]<0)&&p.some(q=>q[1]>-32))soil++;
}
const open=[...edges].filter(([,n])=>n===1);assert.equal(open.length,264,'nur Anschluss zum bestehenden Weltboden ist offen');
assert.ok([...edges.values()].every(n=>n===1||n===2),'keine mehrfachen oder losen Innenkanten');
for(const [k] of open)for(const a of k.split('|')){const [x,y,z]=a.split(',').map(Number);assert.equal(y,0);assert.ok(x===-160||x===104||z===-160||z===104);}
assert.ok(top>=1000&&low>=264&&soil>=500);assert.ok(area>2e5);assert.ok(v.length/27<5000,'Geometriebudget');
console.log('OK v358: 264 exakte Anschlusskanten, geschlossene Flanken/Unterseite, korrekte Flächenausrichtung, '+v.length/27+' Dreiecke.');
