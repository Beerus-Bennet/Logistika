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


// Der Pass bleibt Teil des Kamms; keine voneinander isolierten Kegel mit flachen Lücken.
for(let i=0;i<4;i++)for(const t of [.3,.5,.7]){
 const a=I.peaks[i],b=I.peaks[i+1];C.point=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const h=run('ALPINE.height(...point)'),crest=a[4]+(b[4]-a[4])*t;
 assert.ok(h>crest*.5,`Kamm unterbrochen zwischen ${i}/${i+1}: ${h}/${crest}`);
}
const peak=G.spots.summit;assert.equal(peak[0],I.peaks[2][0]);assert.equal(peak[2],I.peaks[2][1]);
C.point=[peak[0],peak[2]];assert.ok(Math.abs(run('ALPINE.surface(...point)')-peak[1])<1e-9,'Gipfelkreuz steht auf dem neuen Hauptkamm');
// Der bestehende Hüttenplatz bleibt über die ganze Terrasse ebenerdig.
const hut=G.spots.hut,c=Math.cos(hut[3]),s=Math.sin(hut[3]);let low=Infinity,high=-Infinity;
for(let x=-3.3;x<3.31;x+=.55)for(let z=-2.3;z<3.41;z+=.57){C.point=[hut[0]+c*x+s*z,hut[2]-s*x+c*z];const y=run('ALPINE.surface(...point)');low=Math.min(low,y);high=Math.max(high,y);}
assert.ok(high-low<.08,'Hütte hat eine ebene Standfläche');assert.ok(hut[1]>=high&&hut[1]-low<.3,'Hüttenterrasse sitzt ohne hohen Sockel im Gelände');
assert.ok(G.spots.path.length>30,'Wanderweg zur Hütte erhalten');
for(const p of G.spots.path){C.point=p;assert.ok(run('ALPINE.lakeE(...point)>1.05&&ALPINE.poolE(...point)>1.05&&ALPINE.channel(...point).d>1.7'),'Trampelpfad bleibt trocken');}
for(const [name,m] of Object.entries(G))if(m.v){assert.ok(m.v.every(Number.isFinite),name+' enthält endliche Werte');assert.equal(m.v.length%27,0,name+' ganze Dreiecke');}
assert.ok(tri(G.terrainNear)<=10000,'Geländedetails ohne zusätzliche Rasterverfeinerung');assert.ok(tri(G.treeNear)<16000);assert.ok(tri(G.detail)<7000);assert.ok(tri(G.fun)<8000);
assert.ok(G.trees.length<=140);assert.ok(G.trees.every(t=>t.h<36),'Kahle Hochlagen statt Bäumen auf Gipfeln');
// Das äußere Wassernetz liegt unter dem flachen Kiesufer. Toleranz deutlich
// unter einer Rasterzelle; an der gewollten Falllippe bleibt Wasser offen.
let shoreMin=Infinity,shoreCount=0;
for(let i=0;i<G.water.v.length;i+=9){const x=G.water.v[i],z=G.water.v[i+2];C.point=[x,z];if(run('ALPINE.lakeE(...point)')<1.02)continue;
 const along=(-(x-62)+(z+144))/Math.SQRT2,side=((x-62)+(z+144))/Math.SQRT2;if(along>-3&&Math.abs(side)<I.fall.w+2)continue;
 const edge=run('ALPINE.surface(...point)')-I.lake.y;shoreMin=Math.min(shoreMin,edge);shoreCount++;assert.ok(edge>-.12,'Wasserrand ragt aus dem Gelände');}
assert.ok(shoreCount>100);
const meshCount=run('Object.keys(FV.meshes).length'),ref=G.terrainNear;
run('for(let i=0;i<240;i++){FV.R.cam.dist=i%2?450:65;ALPINE.step(1/30);}');
assert.equal(run('Object.keys(FV.meshes).length'),meshCount);assert.equal(run('ALPINE.info().geometry.terrainNear'),ref);assert.equal(run('JSON.stringify(S)'),run('saveBefore'));
// Form und Farbe ändern sich nicht mit der Uhrzeit. Licht kommt weiterhin aus der vorhandenen Umgebung.
C.point=[106,-178];run('S.time=720');const day=run('JSON.stringify(ALPINE.color(...point,ALPINE.height(...point)))');run('S.time=120');assert.equal(run('JSON.stringify(ALPINE.color(...point,ALPINE.height(...point)))'),day);
console.log('OK v413: 12 Kammabschnitte verbunden, Gipfelkreuz und Hüttenterrasse am Gelände, Trampelpfad trocken, kahle Hochlagen, feste Grafikbudgets, 240 Zoomwechsel ohne neue Meshes/Saveänderung.',{terrain:tri(G.terrainNear),treeNear:tri(G.treeNear),treeFar:tri(G.treeFar),trees:G.trees.length,terraceRange:high-low,shoreMin});
