/* v475: Durchblicke mit demselben Backface-Culling wie im WebGL-Renderer prüfen. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),C=vm.createContext({});
const root=process.env.MODEL_ROOT||__dirname;
for(const f of ['gl3d.js','cars.js','racehandling.js','carforms.js','carmodels.js','racecars.js','racetrack.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),C);
const run=s=>vm.runInContext(s,C),T=run('RACETRACK'),cars=run('CARS'),snapshot=JSON.stringify(cars),sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const compiled=new WeakMap();
function ray(data,o,d){let tris=compiled.get(data);if(!tris){tris=[];for(let i=0;i<data.length;i+=27)tris.push([...data.slice(i,i+3),...sub(data.slice(i+9,i+12),data.slice(i,i+3)),...sub(data.slice(i+18,i+21),data.slice(i,i+3))]);compiled.set(data,tris);}let best=Infinity;
 for(const a of tris){const px=d[1]*a[8]-d[2]*a[7],py=d[2]*a[6]-d[0]*a[8],pz=d[0]*a[7]-d[1]*a[6],det=a[3]*px+a[4]*py+a[5]*pz;if(det<1e-9)continue;const hx=o[0]-a[0],hy=o[1]-a[1],hz=o[2]-a[2],u=(hx*px+hy*py+hz*pz)/det;if(u<0||u>1)continue;const qx=hy*a[5]-hz*a[4],qy=hz*a[3]-hx*a[5],qz=hx*a[4]-hy*a[3],v=(d[0]*qx+d[1]*qy+d[2]*qz)/det;if(v<0||u+v>1)continue;const t=(a[6]*qx+a[7]*qy+a[8]*qz)/det;if(t>1e-6&&t<best)best=t;}return best;}

let wellChecks=0,cabinChecks=0,failures=[];
for(const c of cars){const r=T.rig(c),v=T.car(c,0x767c83).v;
 for(const s of [-1,1])for(const z of r.axles)for(const radius of [.35,.65,1.02])for(const angle of [.25,.65,1.05,1.57,2.10,2.50,2.90]){const o=[s*(r.wheelX+1),r.wheelY+Math.sin(angle)*r.wheelRadius*radius,z+Math.cos(angle)*r.wheelRadius*radius],t=ray(v,o,[-s,0,0]);wellChecks++;if(!Number.isFinite(t)||t>1.35)failures.push(c.id+' Radhaus '+s+'/'+z+'/'+radius+'/'+angle);}
 // Von der Innenseite der Scheibe nach außen: Innenhaut muss vor dem Himmel liegen.
 let count=0;for(let i=0;i<v.length&&count<8;i+=27){const col=v.slice(i+6,i+9),glass=[0x24414f,0x284551,0x355562,0x365766].some(k=>col.every((x,j)=>Math.abs(x-((k>>(16-j*8))&255)/255)<1e-6));if(!glass)continue;const A=v.slice(i,i+3),B=v.slice(i+9,i+12),D=v.slice(i+18,i+21),n=cross(sub(B,A),sub(D,A)),len=Math.hypot(...n);if(len<1e-8)continue;const N=n.map(x=>x/len),center=A.map((x,k)=>(x+B[k]+D[k])/3),o=center.map((x,k)=>x-N[k]*.01),t=ray(v,o,N);cabinChecks++;count++;if(!Number.isFinite(t)||t>.011)failures.push(c.id+' Scheibenrückseite');}
 assert.ok(count>0,c.id+' Scheiben geprüft');
 assert.ok(v.every(Number.isFinite));assert.ok(T.displayCar(c,0).v.length/27<6500,c.id+' begrenztes Gesamtbudget');
}
assert.equal(JSON.stringify(cars),snapshot,'Keine Fahr-/Preis-/Katalogänderung');
console.log(JSON.stringify({models:cars.length,wellChecks,cabinChecks,failed:failures.length,examples:failures.slice(0,12)}));if(!process.env.MEASURE_ONLY)assert.equal(failures.length,0,JSON.stringify(failures.slice(0,15)));
