/* v325: Reale Strömungskoordinaten durch das Becken und alle Flussbiegungen, Aufprall im Wasser.
   node water-impact-v325.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8'),C={console};C.window=C;vm.createContext(C);
for(const f of ['gl3d.js','farmmodels.js','bushes.js'])vm.runInContext(read(f),C);
vm.runInContext(read('woodmodels.js').replace('terrain, ribbon, smoothLine,','_current:creekCurrent, _springGeo:springGeo, terrain, ribbon, smoothLine,'),C);
const source=read('erbe.js'),start=source.indexOf('const FWORLD =');vm.runInContext(source.slice(start,source.indexOf('\n};',start)+3),C);
const F=vm.runInContext('FWM',C),G=vm.runInContext('G3',C),points=vm.runInContext('FWORLD.creek',C);
const opts={w:1.5,taper:[0,0],min:.7,current:true},spring=F.springInfo(points,opts);opts.spring=spring;
const line=F.smoothLine(points,6),current=F._current(line,spring),raw=F.creekWater(points,opts).v;
const verts=a=>Array.from({length:a.length/9},(_,i)=>a.slice(i*9,i*9+9));
assert.ok(current.prefix>0,'Beckenbiegung hat eine echte Laufstrecke vor dem Bachanfang');
let length=0;
for(let i=0;i<line.length;i++){
 if(i)length+=Math.hypot(line[i][0]-line[i-1][0],line[i][1]-line[i-1][1]);
 const phase=current.prefix+length,center=verts(raw).find(v=>Math.hypot(v[0]-line[i][0],v[2]-line[i][1])<1e-7&&Math.abs(v[7])<1e-7);
 assert.ok(center,'Bachmitte '+i+' im echten Modell');assert.ok(Math.abs(center[6]-phase)<1e-7,'Phase folgt der Bogenlänge');
 assert.equal(center[8],.45);assert.ok(Math.abs(current.at(...line[i])[0]-phase)<1e-7,'Becken und Fluss benutzen dieselbe Phase');
}
// Auch eine Drehung der gesamten Landschaft ändert die talwärts gerichtete Laufzeit nicht.
for(const angle of [Math.PI/2,Math.PI,Math.PI*1.5]){
 const cs=Math.cos(angle),sn=Math.sin(angle),rotate=p=>[cs*p[0]-sn*p[1]+19,sn*p[0]+cs*p[1]-37];
 const pts=points.map(rotate),s=F.springInfo(pts,opts),cur=F._current(F.smoothLine(pts,6),s);
 for(let i=0;i<current.path.length;i+=3){
  const p=current.path[i],q=rotate(p);assert.ok(Math.abs(cur.at(...q)[0]-current.at(...p)[0])<1e-6,'Keine Bindung der Fließrichtung an die Welt-x-Achse');
 }
}
// Jede Strecke durch das Einlaufbecken hat eine vorwärts zunehmende Koordinate.
for(let i=1;i<25;i++)assert.ok(current.at(...current.path[i])[0]>current.at(...current.path[i-1])[0]);
const pool=F.springPool2(points,opts).v;
for(const v of verts(pool)){
 assert.ok(v.every(Number.isFinite));assert.ok(v[8]>=.45&&v[8]<=.85);
 assert.ok(Math.abs(v[6]-current.at(v[0],v[2])[0])<1e-7,'Wasserpolygon liest die echte Strömungslinie');
}
const I=F.springImpact(),k=F.SPRING_FALL.S,ry=Math.atan2(-spring.dir[1],spring.dir[0])+Math.PI/2;
const world=v=>[spring.C[0]+(v[0]*Math.cos(ry)+v[2]*Math.sin(ry))*k,spring.C[1]+(-v[0]*Math.sin(ry)+v[2]*Math.cos(ry))*k];
const geo=F._springGeo(points,opts),foam=verts(F.springFoam().v);
for(const v of foam){
 assert.equal(v[1],I.foamY);assert.equal(v[8],-1);assert.ok(geo.dU(...world(v))<0,'Schaum bleibt innerhalb der wirklichen Wasserfläche');
}
const middle=foam.filter(v=>Math.abs(v[7])<1e-7).sort((a,b)=>a[6]-b[6]),a=world(middle[0]),b=world(middle.at(-1));
assert.ok((b[0]-a[0])*spring.dir[0]+(b[1]-a[1])*spring.dir[1]>.5,'Schaumfahne biegt zum Bachabfluss ab');
assert.ok(foam.length/3<5000,'Kein höheres Modellbudget für die Schaumfahne');
// Tatsächliche Shader-Ausdrücke: die Schaumadern werden mitgerissen und laufen mit Entfernung langsamer aus.
const gl=read('gl3d.js'),travel=gl.match(/float travel = (x \+[^;]+);/)[1],phase=gl.match(/vec2 drift = vec2\((travel \*[^,]+),/)[1];
const fn=new Function('x','t','max','const travel='+travel+';return '+phase+';');
for(const t of [0,60,600,7200])for(const x of [-.3,0,.5,1,1.7]){
 const p=fn(x,t,Math.max);assert.ok(fn(x+.001,t,Math.max)>p);assert.ok(fn(x,t+.001,Math.max)<p);
}
assert.ok(G.WATER.deep!==G.WATER.shallow&&G.WATER.foam!==G.WATER.mid);
console.log('OK: '+line.length+' Flussstationen, Beckenanschluss und drei Landschaftsdrehungen; '+pool.length/27+' Beckenpolygone mit echter Laufstrecke, Schaum vollständig im Wasser und talwärts gerichtete Animation bis 7200 s.');
