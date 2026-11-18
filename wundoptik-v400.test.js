const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const C=vm.createContext({console});for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);const run=s=>vm.runInContext(s,C);
function distance(P,M){let best=Infinity;for(let i=0;i<M.v.length;i+=27){const V=M.v,A=V.slice(i,i+3),E=V.slice(i+9,i+12).map((x,j)=>x-A[j]),F=V.slice(i+18,i+21).map((x,j)=>x-A[j]),Q=P.map((x,j)=>x-A[j]),dot=(a,b)=>a.reduce((s,v,j)=>s+v*b[j],0),ee=dot(E,E),ff=dot(F,F),ef=dot(E,F),det=ee*ff-ef*ef;if(det<1e-14)continue;const u=(dot(Q,E)*ff-dot(Q,F)*ef)/det,v=(dot(Q,F)*ee-dot(Q,E)*ef)/det;if(u<-.0001||v<-.0001||u+v>1.0001){for(const [X,Y]of [[A,V.slice(i+9,i+12)],[V.slice(i+9,i+12),V.slice(i+18,i+21)],[V.slice(i+18,i+21),A]]){const D=Y.map((x,j)=>x-X[j]),Q=P.map((x,j)=>x-X[j]),t=Math.max(0,Math.min(1,dot(Q,D)/(dot(D,D)||1)));best=Math.min(best,Math.hypot(...Q.map((x,j)=>x-D[j]*t)));}continue;}best=Math.min(best,Math.hypot(...Q.map((x,j)=>x-u*E[j]-v*F[j])));}return best;}
let count=0;for(const k of ['hirsch','keiler','fasan'])for(const side of [-1,1]){
 C.k=k;C.side=side;run(`var gn=HUNT.genes(k,.7,3),A={k,gn,score:.7,vr:0,T:HUNT.traits(k,.7,gn),node:{},neck:{},head:{}},B=HUNT.SP[k].body,rec={zone:'koerper',lo:[side*3,B.c[1],B.c[2]+.05],ld:[-side,0,.06],t:2.8,stop:10,pose:{}},W=HUNT._woundSpot(A,rec),M=HUNT._woundMesh(W.P,W.n,1,W.surf,W.tone);`);const W=run('W'),M=run('M');assert.ok(W.parent===run('A.node'));assert.ok(M.v.length>0&&M.v.every(Number.isFinite));
 for(let i=0;i<M.v.length;i+=9)assert.ok(distance(M.v.slice(i,i+3),W.mesh)<.0015,'Auf Körperfläche '+k);
 assert.equal(run(`HUNT._woundSpot(A,{...rec,stop:0},true)`),null);assert.ok(run(`HUNT._woundSpot(A,rec,true)`));count++;
}console.log('OK v400: '+count+' Körperseiten, angepasste Hautfläche statt schwebender Scheibe; Ausschuss nur bei Durchdringung.');

for(const k of ['hirsch','keiler','fasan'])for(const zone of ['hals','haupt'])for(const side of [-1,1]){
 C.k=k;C.zone=zone;C.side=side;
 run(`var gn=HUNT.genes(k,.7,3),A={k,gn,score:.7,vr:0,T:HUNT.traits(k,.7,gn),node:{},neck:{},head:{}},sp=HUNT.SP[k],lc=zone==='haupt'?sp.head.c:sp.neckZ[0].map((v,i)=>(v+sp.neckZ[1][i])/2),offset=zone==='haupt'&&k==='hirsch'?sp.headP:[0,0,0],target=lc.map((v,i)=>v+offset[i]+sp.neckP[i]),rec={zone,lo:[side*3,target[1],target[2]],ld:[-side,0,0],t:3,stop:10,pose:{}},W=HUNT._woundSpot(A,rec),M=HUNT._woundMesh(W.P,W.n,1,W.surf,W.tone);`);
 const W=run('W'),M=run('M');assert.equal(W.parent,run(zone==='haupt'?'A.head':'A.neck'));assert.ok(M.v.length>0&&M.v.every(Number.isFinite),k+' '+zone);
 for(let i=0;i<M.v.length;i+=9)assert.ok(distance(M.v.slice(i,i+3),W.mesh)<.0015,'Auf Hals/Haupt '+k+' '+zone);
}
console.log('OK v400: zusätzliche 12 Hals-/Hauptflächen an tatsächlichem Tiernetz und passendem Gelenkknoten.');
