/* v409: Vierteldrehung betrifft nur den Stamm, nicht Wegfläche oder andere Wegenden. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const C=vm.createContext({console});for(const f of ['gl3d.js','farmmodels.js','woodmodels.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);const run=s=>vm.runInContext(s,C);
run(`var path=[[0,0],[0,4]],base={ends:[false,true]},before=FWM.forestPath(path,1.8,base),after=FWM.forestPath(path,1.8,{...base,benchTurn:[0,Math.PI/2]}),unchanged=FWM.forestPath(path,1.8,{...base,benchTurn:[0,0]});`);
assert.deepEqual(run('unchanged.v'),run('before.v'));
function points(m,high){const p=[];for(let i=0;i<m.v.length;i+=9)if((m.v[i+1]>.17)===high)p.push(m.v.slice(i,i+9));return p;}
const A=points(run('before'),true),B=points(run('after'),true),bounds=(P,k)=>Math.max(...P.map(p=>p[k]))-Math.min(...P.map(p=>p[k]));assert.ok(A.length>0);assert.equal(A.length,B.length);assert.ok(Math.abs(bounds(A,0)-bounds(B,2))<1e-6);assert.ok(Math.abs(bounds(A,2)-bounds(B,0))<1e-6);
// Höhe/Farbe des Stamms und sein Mittelpunkt bleiben; nur seine horizontale Richtung ändert sich.
for(let i=0;i<A.length;i++){assert.equal(A[i][1],B[i][1]);assert.deepEqual(A[i].slice(6),B[i].slice(6));}
for(const k of [0,2])assert.ok(Math.abs(A.reduce((s,p)=>s+p[k],0)/A.length-B.reduce((s,p)=>s+p[k],0)/B.length)<1e-6);
run(`var noBench=FWM.forestPath(path,1.8,{ends:[false,false]}),noBenchTurn=FWM.forestPath(path,1.8,{ends:[false,false],benchTurn:[0,Math.PI/2]});`);assert.deepEqual(run('noBench.v'),run('noBenchTurn.v'));
console.log('OK v409: Stamm horizontal um 90° gedreht; Höhe, Farbe, Mittelpunkt und Wege ohne Bank unverändert.');
