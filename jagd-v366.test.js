/* v366: Bewegungsgrenzen und Himmelsverankerung unabhängig von GPU/Netzwerk. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','hunt.js','vista.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);const run=s=>vm.runInContext(s,C);let n=0;const test=(name,fn)=>{fn();console.log('ok '+(++n)+' '+name);};
test('Freie Läufe gehen ohne zusätzliche Knick-Zwischenpose aus der tatsächlichen Gangstellung in die Endpose',()=>{
 run(`var A={k:'hirsch',st:'fall',fT:1,side:1,legs0:[[.1,.05,0],[-.1,.2,0],[.12,-.1,0],[-.14,-.2,0]],dp:{legs:[[-.5,.4,.3],[-.2,.7,.5],[.4,-.3,.4],[.2,-.7,.6]]}},bad=[];
 for(let i=0;i<4;i++)for(let j=0;j<=100;j++){A.t=1-j/100;const leg=HUNT._deadLeg(A,i);for(let k=0;k<3;k++)if(leg[k]<Math.min(A.legs0[i][k],A.dp.legs[i][k])-1e-9||leg[k]>Math.max(A.legs0[i][k],A.dp.legs[i][k])+1e-9)bad.push(leg);}`);
 assert.equal(run('bad.length'),0);run(`A.t=1;`);assert.equal(run('JSON.stringify(HUNT._deadLeg(A,0))'),run('JSON.stringify(A.legs0[0])'));run('A.t=0;');assert.equal(run('JSON.stringify(HUNT._deadLeg(A,0))'),run('JSON.stringify(A.dp.legs[0])'));
});
test('Links/rechts und Vorder-/Hinterläufe erreichen ohne Überschwingen dieselbe gespeicherte Liegepose',()=>{
 for(const side of [-1,1]){run('A.side='+side+';A.st="dead";');for(let i=0;i<4;i++)assert.equal(run(`JSON.stringify(HUNT._deadLeg(A,${i}))`),run(`JSON.stringify(A.dp.legs[${i}])`));}run('A.st="fall";A.t=.5;A.fs={support:0,feet:[]};');assert.ok(run('HUNT._deadLeg(A,0).every(Number.isFinite)'));
});
test('Wolken haben feste Raumkoordinaten; Drehen und Neigen ändern ausschließlich die Projektion',()=>{
 run(`var eye=[0,2,0],yaw=0,pitch=0,R={project(x,y,z){const q=HUNT.unrot([x-eye[0],y-eye[1],z-eye[2]],pitch,yaw,0);return [q[0]/(q[2]+5000)*390,q[1]/(q[2]+5000)*760];}};
 var first=VISTA._cloudGrid(R,eye,.3,.2,.5,.12,6,2,1);yaw=.5;pitch=.3;var turned=VISTA._cloudGrid(R,eye,.3,.2,.5,.12,6,2,1);`);
 assert.equal(run('JSON.stringify(first.map(p=>p.world))'),run('JSON.stringify(turned.map(p=>p.world))'));assert.notEqual(run('JSON.stringify(first.map(p=>p.p))'),run('JSON.stringify(turned.map(p=>p.p))'));
 run('yaw=0;pitch=0;var back=VISTA._cloudGrid(R,eye,.3,.2,.5,.12,6,2,1);');assert.equal(run('JSON.stringify(first)'),run('JSON.stringify(back)'));
 assert.ok(run('first.every(p=>p.world.every(Number.isFinite)&&p.p.every(Number.isFinite))'));
});
test('Kameraversatz verschiebt den Himmel nicht; alle Texturpunkte gehören derselben festen Fläche an',()=>{
 run(`var before=VISTA._cloudGrid(R,eye,.3,.2,.5,.12,3,2,1);eye=[20,8,-3];var shifted=VISTA._cloudGrid(R,eye,.3,.2,.5,.12,3,2,1);`);
 assert.ok(run('before.every((p,i)=>p.p.every((v,j)=>Math.abs(v-shifted[i].p[j])<1e-8))'));
 assert.equal(run('shifted.length'),12);assert.ok(run('shifted[0].u===0&&shifted[0].v===0&&shifted[11].u===1&&shifted[11].v===1'));
});
console.log(n+' Prüfgruppen v366 bestanden.');
