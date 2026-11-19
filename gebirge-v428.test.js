/* v413: Verbundener Bergkamm, standfeste Ausstattung und feste Grafikbudgets. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','farmmodels.js','bushes.js','woodmodels.js','alpine.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C,{filename:f});
const erbe=fs.readFileSync('erbe.js','utf8'),start=erbe.indexOf('const FWORLD =');vm.runInContext(erbe.slice(start,erbe.indexOf('\n};',start)+3),C);
const world=fs.readFileSync('worldview.js','utf8');vm.runInContext(`const WGRID={x0:-160,z0:-160,x1:104,z1:104};${world.slice(world.indexOf('const APRON ='),world.indexOf('function worldGround('))}
function wRng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const S={time:720,money:123456,farm:{trees:[{id:1,x:-20,z:-30}],objs:[]}};
const FV={meshes:{},R:{nodes:[],node:(mesh,o={})=>({mesh,x:0,y:0,z:0,sx:o.s||1,sy:o.s||1,sz:o.s||1,rx:0,ry:0,rz:0,visible:true,...o,children:[]}),addChild:(p,c)=>{p.children.push(c);return c;},mesh:m=>({count:m.v.length/9}),cam:{dist:90,tx:80,tz:-149}}};
const fmesh=(k,fn)=>FV.meshes[k]||(FV.meshes[k]=FV.R.mesh(fn()));
const saveBefore=JSON.stringify(S);ALPINE.build(FV.R);`,C);
const run=s=>vm.runInContext(s,C),I=run('ALPINE.info()'),G=I.geometry,tri=m=>m.v.length/27;



for(const ty of [0,12,30]){C.ty=ty;run('FV.R.cam.ty=ty;');for(let i=0;i<90;i++){C.i=i;run('Object.assign(FV.R.cam,{tx:20+i,tz:-140-i*.3,dist:40+i%5*30});ALPINE.step(1/30);');assert.equal(run('FV.R.cam.ty'),ty,'Kein automatischer Kameraauftrieb');}}
let varied=0,seen=0;const v=G.terrainNear.v;
for(let i=0;i<v.length;i+=27){seen++;if(v.slice(i+6,i+9).some((x,j)=>Math.abs(x-v[i+15+j])>1e-7||Math.abs(x-v[i+24+j])>1e-7))varied++;}
assert.ok(varied>1000,'Farbübergänge statt konstanter Dreiecksfarben');
const shared=new Map();let matched=0;
for(let i=0;i<v.length;i+=9){const key=v.slice(i,i+3).join(','),attrs=v.slice(i+3,i+9),old=shared.get(key);if(old){attrs.forEach((x,j)=>assert.ok(Math.abs(x-old[j])<1e-6,'Gemeinsame Eckpunkte ohne Farb-/Normalensprung'));matched++;}else shared.set(key,attrs);}
assert.ok(matched>1000,'Gemeinsame Eckpunkte geprüft');
assert.equal(tri(G.terrainNear),9918,'Gleiches Grafikbudget');
console.log('OK v428: 270 Schwenks mit unveränderter Kamerahöhe; durchgehende Eckpunktfarben, unverändert 9918 Geländedreiecke.',{varied,seen});
