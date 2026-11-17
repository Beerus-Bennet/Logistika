/* v386: Echte Geometrie, Wasseranschluss, Tierkontakte und feste Fernbudgets. */
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

function meshHeight(m,x,z){let y=-Infinity;for(let i=0;i<m.v.length;i+=27){const v=m.v,ax=v[i],az=v[i+2],bx=v[i+9],bz=v[i+11],cx=v[i+18],cz=v[i+20],den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-9)continue;const a=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,b=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den;if(a>=-1e-7&&b>=-1e-7&&a+b<=1.0000001)y=Math.max(y,a*v[i+1]+b*v[i+10]+(1-a-b)*v[i+19]);}return y;}
for(const [name,m]of Object.entries(G))if(m.v){assert.ok(m.v.every(Number.isFinite),name);assert.equal(m.v.length%27,0,name);}
const river=run('FWM.creekWater(creekToRim(ALPINE.riverLine()).line,{w:1.5,current:true,width:ALPINE.riverWidth,level:ALPINE.riverLevel})');
const rows=new Map();for(let i=0;i<river.v.length;i+=9){const v=river.v,s=v[i+6].toFixed(6),q=rows.get(s)||{};q[v[i+7]]=[v[i],v[i+1],v[i+2]];rows.set(s,q);}
let stations=0,worst=-Infinity,widthError=0;
for(const row of rows.values())if(row[-1]&&row[1]){const a=row[-1],b=row[1];C.point=[(a[0]+b[0])/2,(a[2]+b[2])/2];widthError=Math.max(widthError,Math.abs(Math.hypot(a[0]-b[0],a[2]-b[2])-(a[0]<45?1.725:run("ALPINE.riverWidth(...point)"))*2));if(a[0]<8||a[2]>-90)continue;stations++;
 for(let j=0;j<=10;j++){const t=j/10,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,y=a[1]+(b[1]-a[1])*t,ground=meshHeight(G.terrainNear,x,z);worst=Math.max(worst,ground-y);assert.ok(ground<y-.005,'Wasserquerschnitt durch Gelände verdeckt '+JSON.stringify({x,z,y,ground}));}}
assert.ok(stations>35&&widthError<.06);console.log('Durchgehende volle Flussbreite:',{stations,worst,widthError});
for(const [name,poly,cx,cz,y,mesh]of [['Bergsee',I.lakeOutline,I.lake.x,I.lake.z,I.lake.y,G.water],['Kolk',I.poolOutline,I.pool.x,I.pool.z,I.pool.y,G.pool]]){let cover=-Infinity;for(const q of poly)for(const r of [.4,.9,.999]){const x=cx+(q.p[0]-cx)*r,z=cz+(q.p[1]-cz)*r,ground=meshHeight(G.terrainNear,x,z);cover=Math.max(cover,ground-y);assert.ok(ground<y+.005,name+' wird von Ufer verdeckt '+JSON.stringify({x,z,ground,y}));}console.log(name+' Bodenfreiheit',cover);assert.ok(tri(mesh)<1000);}
// Exakte Nahtpunkte statt nur ungefähr gleicher Mittelpunkte.
const head=[...rows.values()][0];for(const side of [-1,1]){const p=head[side];assert.ok(I.poolOutline.some(q=>Math.hypot(q.p[0]-p[0],q.p[1]-p[2])<1e-7),'Kolk und Fluss teilen dieselbe Wasserkante');assert.ok(Math.abs(p[1]-I.pool.y)<1e-9);}
for(const side of [-1,1]){const x=I.fall.lip[0]+side*3.2/Math.SQRT2,z=I.fall.lip[2]+side*3.2/Math.SQRT2;assert.ok(I.lakeOutline.some(q=>Math.hypot(q.p[0]-x,q.p[1]-z)<1e-7));assert.ok(G.fall.v.some((v,i)=>i%9===0&&Math.hypot(v-x,G.fall.v[i+1]-I.lake.y,G.fall.v[i+2]-z)<1e-7));}
for(let i=0;i<=20;i++){const t=i/20,p=run('ALPINE.info().fallPath('+t+')');assert.ok(Math.abs(p[1]-(I.fall.lip[1]-.5*9.81*(t*I.fall.duration)**2))<1e-6);}
const shore=run('creekToRim(ALPINE.riverLine())'),clipped=run('islandClip(FWM.creekWater(creekToRim(ALPINE.riverLine()).line,{w:1.5,current:true,width:ALPINE.riverWidth,level:ALPINE.riverLevel}))');
const end=shore.end;C.point=end;assert.ok(Math.abs(run('islandGap(...point)'))<1e-6);assert.ok(end[1]>0);
for(let i=0;i<clipped.v.length;i+=9){C.point=[clipped.v[i],clipped.v[i+2]];assert.ok(run('islandGap(...point)')>-.00001,'Wasser endet an echter Polygonkante');}
for(const [line,w]of [['ALPINE.riverLine()',1.725],['[[100,64],[112,65]]',1.15]]){const fall=run('rimFall(creekToRim('+line+'),'+w+')'),water=run('islandClip(FWM.creekWater(creekToRim('+line+').line,{w:'+w+'/1.15,current:true}))'),E=run('creekToRim('+line+')');let n=0;for(let i=0;i<fall.v.length;i+=9)if(fall.v[i+6]===0){const x=fall.v[i],z=fall.v[i+2];C.point=[x,z];assert.ok(Math.abs(run('islandGap(...point)'))<1e-6,'Falllippe liegt an der gezeichneten Felskante');assert.ok(Math.abs(meshHeight(water,x,z)-.03)<1e-6,'Fluss reicht bis an die gesamte Falllippe '+JSON.stringify({x,z,w,dir:E.dir,water:meshHeight(water,x,z)}));n++;}assert.ok(n>8);}
assert.equal(I.forepeaks.length,6);assert.ok(I.forepeaks.every(p=>p[4]<25));assert.ok(I.scene.animals.filter(a=>a.kind==='ibex'&&a.x>20&&a.z>-152&&a.root.sx>0).length===5);
for(const a of I.scene.animals)for(const p of a.path){C.point=p;assert.ok(run('ALPINE.lakeE(point[0],point[2])>1.05&&ALPINE.poolE(point[0],point[2])>1.05'));assert.ok(p[1]>1.5);}
const contacts=run(`(()=>{let min=1e9,max=-1e9,seam=0,closest=1e9;for(let frame=0;frame<1800;frame++){ALPINE.step(1/30);const A=ALPINE.info().scene.animals;for(let i=0;i<A.length;i++){const a=A[i];if(!a.root.visible)continue;const r=a.root,c=Math.cos(r.ry),s=Math.sin(r.ry);for(const l of a.legs){const X=r.x+(l.hip.x*c+(l.hip.z+l.hoof.z)*s)*r.sx,Z=r.z+(-l.hip.x*s+(l.hip.z+l.hoof.z)*c)*r.sx,ground=ALPINE.surface(X,Z),foot=r.y+(l.hip.y+l.hoof.y)*r.sy,delta=foot-ground;min=Math.min(min,delta);max=Math.max(max,delta);seam=Math.max(seam,Math.abs(-l.upper.sy*Math.cos(l.upper.rx)-l.lower.y),Math.abs(-l.upper.sy*Math.sin(l.upper.rx)-l.lower.z),Math.abs(l.lower.y-l.lower.sy*Math.cos(l.lower.rx)-l.hoof.y),Math.abs(l.lower.z-l.lower.sy*Math.sin(l.lower.rx)-l.hoof.z));}for(let j=i+1;j<A.length;j++)if(A[j].root.visible)closest=Math.min(closest,Math.hypot(r.x-A[j].root.x,r.z-A[j].root.z));}}return{min,max,seam,closest};})()`);
assert.ok(contacts.min>-.001&&contacts.max<.1);assert.ok(contacts.seam<1e-6);assert.ok(contacts.closest>1.2);assert.equal(I.scene.animals.length,7);assert.equal(I.scene.birds.length,2);
const count=run('Object.keys(FV.meshes).length');run('for(let i=0;i<200;i++){FV.R.cam.dist=i%2?450:60;ALPINE.step(.016);if(ALPINE.info().scene.near.fade!==0)throw Error("Gelände darf beim Zoomen kein Raster zeigen");}');assert.equal(run('Object.keys(FV.meshes).length'),count);assert.equal(run('JSON.stringify(S)===saveBefore'),true);
run('FV.R.cam.dist=450;ALPINE.step(.016)');const farTris=run(`(()=>{let n=0;function count(q){if(q.visible===false)return;if(q.mesh)n+=q.mesh.count/3;q.children.forEach(count);}count(ALPINE.info().scene.root);return n;})()`);assert.ok(farTris<16000,'Feste Fernlast '+farTris);assert.ok(I.scene.animals.every(a=>!a.root.visible));assert.ok(!I.scene.detail.visible);
run('S.time=120;ALPINE.step(.016)');assert.ok(I.scene.birds.every(a=>!a.root.visible));run('FV.fp={};ALPINE.step(.016)');assert.equal(I.scene.root.visible,false);run('FV.fp=null;FV.R.nodes.length=0;ALPINE.build(FV.R)');assert.equal(run('Object.keys(FV.meshes).length'),count);
console.log('OK v386: volle Wasserbreite und beide Anschlusskanten, echte Inselkontur/Falllippen, sechs Vorberge und fünf Steinböcke, 1800 Schritte mit Hufkontakt, 200 Zoomwechsel ohne Geometriewachstum, keine Saveänderung. Fernlast '+farTris+' Dreiecke.',contacts);

// Der alte flache Boden darf auch am geschnittenen Ufer nicht darüberliegen.
vm.runInContext(world.slice(world.indexOf('class WBuf {'),world.indexOf('/* v75: Lage des Angelstegs')),C);
vm.runInContext(world.slice(world.indexOf('const GROUND_SUB'),world.indexOf('const APRON')),C);
vm.runInContext(world.slice(world.indexOf('function worldGround('),world.indexOf('function worldStatic()')),C);
run(`const WV={},HOFG={x0:-16,x1:16,z0:-16,z1:16};function lakeE(){return 2;}const base384=new WBuf();worldGround(()=>({g:base384}),Array.from({length:67*67},()=>[.4,.6,.3]),66,66,4,()=>[.4,.6,.3],null);`);
const base={v:Array.from(run('base384.out()'))};for(const row of rows.values())if(row[0]){const p=row[0];if(p[0]<8||p[0]>100||p[2]< -156||p[2]>-92)continue;assert.equal(meshHeight(base,p[0],p[2]),-Infinity,'Alte Wiese ist im ersetzten Geländebereich entfernt');}
for(let i=0;i<G.terrainNear.v.length;i+=9){C.point=[G.terrainNear.v[i],G.terrainNear.v[i+2]];assert.ok(run('islandGap(...point)')>.2,'Gebirgsdecke bleibt auf der Insel');}
// Spielstandmigration: nur betroffene Standorte, keine Löschung/Neuziehung.
vm.runInContext(erbe.slice(erbe.indexOf('function farmAlpineTrees384'),erbe.indexOf('/* -------------------------------- Init',erbe.indexOf('function farmAlpineTrees384'))),C);
run(`function treeSpotOk(x,z){return !ALPINE.contains(x,z);}const oldTrees384={trees:[{id:9001,x:35,z:-124,st:'up',sp:'eiche',sz:3,dmg:2,t:18,area:'wald'},{id:9002,x:-50,z:-80,st:'stump',sp:'buche',t:10}]};const before384=JSON.parse(JSON.stringify(oldTrees384));farmAlpineTrees384(oldTrees384);globalThis.once384=JSON.stringify(oldTrees384);farmAlpineTrees384(oldTrees384);`);
assert.equal(run('JSON.stringify(oldTrees384)===once384'),true);assert.equal(run('oldTrees384.trees.length'),2);assert.equal(run('oldTrees384.mountains384'),1);
assert.ok(run('!ALPINE.contains(oldTrees384.trees[0].x,oldTrees384.trees[0].z)'));
const kept=run(`JSON.stringify(oldTrees384.trees.map(t=>{const{x,z,...rest}=t;return rest;}))`),prior=run(`JSON.stringify(before384.trees.map(t=>{const{x,z,...rest}=t;return rest;}))`);assert.equal(kept,prior);
assert.equal(run('JSON.stringify(oldTrees384.trees[1])===JSON.stringify(before384.trees[1])'),true);
run(`const full384={trees:[{id:1,x:35,z:-124,st:'up'}]};function treeSpotOk(){return false;}farmAlpineTrees384(full384);`);assert.equal(run('full384.trees[0].x'),35);assert.equal(run('full384.trees.length'),1);assert.equal(run('!!full384.mountains384'),false);console.log('Baummigration: Daten erhalten, nur betroffene Bäume versetzt, wiederholbar und bei Platzmangel kein Verlust.');

assert.equal(I.scene.water.water,8);assert.equal(I.scene.pool.water,8);
assert.ok(I.fall.lip[1]-I.fall.foot[1]>14,'Fallhöhe sichtbar erhöht');
assert.ok(run('ALPINE.info().fallPath(0)[3]*2')>6,'Fallbreite sichtbar erhöht');
assert.ok(run('ALPINE.riverWidth(...ALPINE.info().drain[0])')>2.9,'Beckenauslauf verbreitert');
for(let i=0;i<G.foam.v.length;i+=9){C.point=[G.foam.v[i],G.foam.v[i+2]];assert.ok(run('ALPINE.poolE(...point)')<1,'Gischtfläche bleibt im Becken');}
console.log('OK v386: große Fallhöhe/-breite, gemeinsames Wassermaterial und breiter Beckenauslauf; Gischt bleibt im Wasser.');
