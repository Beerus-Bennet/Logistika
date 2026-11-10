/* v346: Begegnungen mit echten Körper-/Radmaßen und durchgehender Wegprüfung. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console,Math,Map});
vm.runInContext(fs.readFileSync('peopletraffic.js','utf8')+';globalThis.T=PEOPLE_TRAFFIC;',C);
const T=C.T,body=[{x:0,z:0,r:.39}],bike=[-.95,-.48,0,.48,.95].map(z=>({x:0,z,r:.25}));
const actor=(id,x,z,gx,gz,parts=body,extra={})=>({id,from:{x,z},want:{x:gx,z:gz},parts,...extra});
let count=0;function test(n,f){f();console.log('ok '+(++count)+' '+n);}
function check(A){for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){
 const a=A[i],b=A[j];if(a.owner===b.id||b.owner===a.id)continue;
 for(const p of a.parts)for(const q of b.parts){
  const end=(e,r)=>({x:(e.to||e.from).x+r.x,z:(e.to||e.from).z+r.z});
  assert.ok(Math.hypot(end(a,p).x-end(b,q).x,end(a,p).z-end(b,q).z)>=p.r+q.r+.034,`${a.id}/${b.id}`);
 }
}}
function run(A,n=500,valid){for(let i=0;i<n;i++){
 A.sort((a,b)=>a.id.localeCompare(b.id));const before=A.map(a=>({...a.from}));for(const a of A){delete a.to;if(valid)a.valid=valid;}
 T.solve(A,1/60);check(A);
 for(let k=0;k<A.length;k++)for(let j=k+1;j<A.length;j++)for(const p of A[k].parts)for(const q of A[j].parts){
  const a=A[k],b=A[j],off=(v,r)=>({x:v.x+r.x,z:v.z+r.z});
  assert.ok(T.swept(off(before[k],p),off(a.to||a.from,p),off(before[j],q),off(b.to||b.from,q))>=p.r+q.r+.034,'Bewegungen kreuzen sich');
 }
 for(const a of A)a.from={...(a.to||a.from)};
}return A;}
test('Relative Prüfung erkennt kreuzende Bewegungen mit freien Endpunkten',()=>{
 assert.equal(T.swept({x:-3,z:0},{x:3,z:0},{x:0,z:-3},{x:0,z:3}),0);
 const A=[actor('a',-3,0,3,0),actor('b',0,-3,0,3)];run(A);assert.ok(A.every(a=>Math.hypot(a.from.x-a.want.x,a.from.z-a.want.z)<.1));
});
test('Bewohner und Arbeiter passieren einander ohne Körperkontakt',()=>{
 const A=[actor('resident',-4,0,4,0),actor('staff',4,0,-4,0)];run(A,600);assert.ok(A.every(a=>Math.hypot(a.from.x-a.want.x,a.from.z-a.want.z)<.1));
});
test('Fahrräder halten auch mit Vorder- und Hinterrad Abstand',()=>{
 const A=[actor('rad',0,-5,0,5,bike),actor('staff',0,0,0,0,body,{fixed:true})];run(A,700);assert.ok(A[0].from.z>4.8);
});
test('Abgestelltes Rad bleibt stehen und wird zu Fuß umgangen',()=>{
 const A=[actor('person',-4,0,4,0),actor('parked',0,0,0,0,bike,{fixed:true})];run(A,600);assert.equal(A.find(a=>a.id==='parked').from.x,0);assert.equal(A.find(a=>a.id==='parked').from.z,0);assert.ok(A.find(a=>a.id==='person').from.x>3.8);
});
test('Engstelle: warten statt durch Person oder Wand ausweichen',()=>{
 const A=[actor('walker',0,-3,0,3),actor('standing',0,0,0,0,body,{fixed:true})];run(A,200,(a,b)=>Math.abs(b.x)<.1);assert.ok(A.find(a=>a.id==='walker').from.z<-.8);assert.ok(A.find(a=>a.id==='walker').delayed);
});
test('Alte überlappende Standorte werden in freien Nachbarraum getrennt',()=>{
 const A=[actor('a',0,0,0,0),actor('b',0,0,0,0),actor('c',0,0,0,0)];T.solve(A,1/60);check(A);
});
test('Zwei Radfahrer begegnen sich mit Abstand und erreichen ihre Ziele',()=>{
 const A=[actor('a',0,-5,0,5,bike),actor('b',0,5,0,-5,bike)];run(A,900);assert.ok(A.every(a=>Math.hypot(a.from.x-a.want.x,a.from.z-a.want.z)<.1));
});
test('Anbindung respektiert Feldarbeit, menschliche Tore und ruhende Standorte',()=>{
 const C2=vm.createContext({console,Math,Map});
 vm.runInContext(`
 var S={time:600,farm:{staff:[{id:1,role:'farmer',job:{route:[[0,0],[2,0]],walk:10,t0:600,t1:620}}]}};
 var FV={R:{}},e={node:{visible:true,x:0,z:0},x:0,z:0},WV={staff:new Map([[1,e]])};
 var VILLAGE_SITE={clearLine:()=>true},NAV={blk:[2]},roles=[];
 function navLive(){}function navHit(){return false;}function navWallsFor(role){roles.push(role);return [];}
 function navIn(){return true;}function navIdx(){return 0;}
 `+fs.readFileSync('peopletraffic.js','utf8')+`
 PEOPLE_TRAFFIC.step(1/60);
 for(let i=0;i<10;i++){S.time+=.01;e.node.x=e.x+.1;PEOPLE_TRAFFIC.step(1/60);}
 var reached=e.x;
 S.farm.staff[0].job=null;S.time+=.01;e.node.x=5;PEOPLE_TRAFFIC.step(1/60);var resting=e.x;
 `,C2);
 assert.ok(vm.runInContext('reached>.99',C2));assert.ok(vm.runInContext('roles.length>0&&roles.every(r=>r==="farmer")',C2));
 assert.equal(vm.runInContext('resting',C2),vm.runInContext('reached',C2));
});
console.log(count+' Verkehrsprüfungen bestanden.');
