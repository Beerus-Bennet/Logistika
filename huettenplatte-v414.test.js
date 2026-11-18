/* v414: Die echten Hüttenflächen dürfen nicht aufeinander flimmern. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','farmmodels.js','bushes.js','woodmodels.js','alpine.js'])vm.runInContext(fs.readFileSync(f==='alpine.js'&&process.env.LOGISTIKA_BASELINE_ALPINE?process.env.LOGISTIKA_BASELINE_ALPINE:f,'utf8'),C,{filename:f});
const erbe=fs.readFileSync('erbe.js','utf8'),start=erbe.indexOf('const FWORLD =');vm.runInContext(erbe.slice(start,erbe.indexOf('\n};',start)+3),C);
const world=fs.readFileSync('worldview.js','utf8');vm.runInContext(`const WGRID={x0:-160,z0:-160,x1:104,z1:104};${world.slice(world.indexOf('const APRON ='),world.indexOf('function worldGround('))}
function wRng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const S={time:720,money:123456,farm:{trees:[{id:1,x:-20,z:-30}],objs:[]}};
const FV={meshes:{},R:{nodes:[],node:(mesh,o={})=>({mesh,x:0,y:0,z:0,sx:o.s||1,sy:o.s||1,sz:o.s||1,rx:0,ry:0,rz:0,visible:true,...o,children:[]}),addChild:(p,c)=>{p.children.push(c);return c;},mesh:m=>({count:m.v.length/9}),cam:{dist:90,tx:80,tz:-149}}};
const fmesh=(k,fn)=>FV.meshes[k]||(FV.meshes[k]=FV.R.mesh(fn()));
const saveBefore=JSON.stringify(S);ALPINE.build(FV.R);`,C);
const run=s=>vm.runInContext(s,C),I=run('ALPINE.info()'),G=I.geometry,tri=m=>m.v.length/27;



const V=G.fun.v,hut=G.spots.hut,stone=run('G3.col(0x8f8c80)'),slab=run('G3.col(0x9a978c)'),isColor=(i,c)=>c.every((v,j)=>Math.abs(V[i+6+j]-v)<1e-7);
const faces=(c,up)=>{const out=[];for(let i=0;i<V.length;i+=27)if(V[i+4]*up>.999&&isColor(i,c))out.push([[V[i],V[i+1],V[i+2]],[V[i+9],V[i+10],V[i+11]],[V[i+18],V[i+19],V[i+20]]]);return out;};
const supportTop=faces(stone,1),slabTop=faces(slab,1),slabBottom=faces(slab.map(v=>v*.7),-1);
assert.equal(supportTop.length,2,'Oberseite des tatsächlichen Fundaments gefunden');assert.equal(slabTop.length,2,'Oberseite der tatsächlichen Deckplatte gefunden');assert.equal(slabBottom.length,2,'Unterseite der Deckplatte gefunden');
const level=t=>t.flat().reduce((n,p)=>n+p[1],0)/(t.length*3),a=level(supportTop),b=level(slabTop),c=level(slabBottom);
assert.ok(b-a>.001,'Fundament und Deckplatte haben überlagernde sichtbare Oberseiten');
assert.ok(Math.abs(a-c)<1e-5,'Fundament schließt ohne Lücke an die Plattenunterseite an');
assert.ok(b>c,'Deckplatte besitzt eine echte Dicke');
// Der Sockel reicht unter alle angrenzenden Bodenpunkte. Keine schwebende Kante.
const support=V.filter((_,i)=>i%9===1&&isColor(i-1,stone)),bottom=Math.min(...support),cos=Math.cos(hut[3]),sin=Math.sin(hut[3]);
for(const x of [-3.3,0,3.3])for(const z of [-2.3,.55,3.4]){C.point=[hut[0]+cos*x+sin*z,hut[2]-sin*x+cos*z];const y=run('ALPINE.surface(...point)');assert.ok(bottom<y,'Sockel ist im Boden verankert');assert.ok(y<a,'Hang durchstößt die Bodenplatte nicht');}
const n=run('Object.keys(FV.meshes).length');run('for(let i=0;i<100;i++){FV.R.cam.dist=i%2?450:25;ALPINE.step(.016);}');assert.equal(run('Object.keys(FV.meshes).length'),n);assert.equal(run('JSON.stringify(S)'),run('saveBefore'));
assert.ok(tri(G.fun)<8000);
console.log('OK v414: sichtbare Oberseiten getrennt, Fundament nahtlos unter Deckplatte, Sockel im Boden; 100 Zoomwechsel ohne zusätzliche Meshes oder Saveänderung.',{supportTop:a,slabBottom:c,slabTop:b,topSeparation:b-a});
