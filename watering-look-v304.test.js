/* v304: node watering-look-v304.test.js – originale Netze und Zustandsabgleich,
   ohne Browser/GPU. DOM, Szenenknoten und GPU-Upload sind kleine Fixtures. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=fs.existsSync(path.join(__dirname,'farmmodels.js'))?__dirname:path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const C=vm.createContext({console});const run=s=>vm.runInContext(s,C);
for(const f of ['gl3d.js','farmmodels.js','woodmodels.js'])run(read(f));
run('this.F=FM;');const F=C.F;
const old=vm.createContext({console});for(const f of ['gl3d.js','farmmodels.js','woodmodels.js'])vm.runInContext(f==='farmmodels.js'?cp.execFileSync('git',['show','origin/main:'+f],{cwd:root,encoding:'utf8'}):read(f),old);
vm.runInContext('this.F=FM;',old);
const geom=m=>m.v.filter((_,i)=>i%9<6);
const colors=m=>m.v.filter((_,i)=>i%9>=6);
const fin=m=>assert.ok(m.v.length>0&&m.v.length%27===0&&m.v.every(Number.isFinite));
let meshes=0;
for(const kind of ['weizen','mais','tomate','karotte','kartoffel','erdbeere','kuerbis'])for(let stage=0;stage<4;stage++){
 const dry=F.cropMesh(kind,stage,false),wet=F.cropMesh(kind,stage,true),base=old.F.cropMesh(kind,stage);
 [dry,wet].forEach(fin);meshes+=2;
 assert.deepEqual(geom(dry),geom(wet),'Wachstumsstufe/Geometrie bleibt gleich: '+kind+stage);
 assert.deepEqual(Array.from(wet.v),Array.from(base.v),'Gewässerte Pflanze behält gesundes Originalmodell');
 if(kind==='weizen'&&stage===3)assert.deepEqual(colors(dry),colors(wet),'Goldene reife Ähren werden nicht umgefärbt');
 else assert.notDeepEqual(colors(dry),colors(wet),'Trockenes Grün sichtbar verändert: '+kind+stage);
 for(let i=0;i<wet.v.length;i+=9){const r=wet.v[i+6],g=wet.v[i+7],b=wet.v[i+8];
  if(!(g>r*1.05&&g>b*1.2))assert.deepEqual(Array.from(dry.v.slice(i+6,i+9)),Array.from(wet.v.slice(i+6,i+9)),'Reife Frucht/Ähre und Stütze unverändert');
 }
}
for(const kind of ['apfel','kirsche','birne']){
 const dry=F.treeMesh(kind,false),wet=F.treeMesh(kind,true),base=old.F.treeMesh(kind);
 [dry,wet].forEach(fin);meshes+=2;
 assert.deepEqual(geom(dry),geom(wet));assert.notDeepEqual(colors(dry),colors(wet));
 assert.deepEqual(Array.from(wet.v),Array.from(base.v),'Gesunder Baum bleibt unverändert');
 assert.deepEqual(Array.from(F.treeFruit(kind).v),Array.from(old.F.treeFruit(kind).v),'Früchte bleiben eigene unveränderte Netze');
}
for(const rotation of [false,true])assert.deepEqual(Array.from(F.fieldSoil(rotation).v),Array.from(old.F.fieldSoil(rotation).v),'Leeres Beet/alter Aufruf unverändert');
for(const fn of ['fieldSoil','treeSoil']){
 const dry=fn==='fieldSoil'?F.fieldSoil(false,false):F.treeSoil(false),wet=fn==='fieldSoil'?F.fieldSoil(false,true):F.treeSoil(true);
 [dry,wet].forEach(fin);meshes+=2;
 assert.ok(dry.v.length>wet.v.length,'Nur trockene Erde hat feine Risse');
 for(const m of [dry,wet])for(let i=0;i<m.v.length;i+=9){assert.ok(Math.abs(m.v[i])<=.96&&Math.abs(m.v[i+2])<=.96,'Erde bleibt in der Kachel');assert.ok(m.v[i+1]>=0&&m.v[i+1]<=.14);}
 const lum=m=>{let sum=0,total=0;for(let i=0;i<m.v.length;i+=27)if(m.v[i+4]>.9){const area=Math.abs((m.v[i+9]-m.v[i])*(m.v[i+20]-m.v[i+2])-(m.v[i+18]-m.v[i])*(m.v[i+11]-m.v[i+2]))/2;sum+=area*(.2126*m.v[i+6]+.7152*m.v[i+7]+.0722*m.v[i+8]);total+=area;}return sum/total;};
 assert.ok(lum(dry)>lum(wet)*1.4,'Helligkeit der Erde unterscheidet sich deutlich');
 assert.ok(dry.v.length/27<=180,'Kleine gemeinsam verwendete Netze statt Partikeldauereffekt');
}
/* Auch der Fallback ohne Blattbüschel nutzt dieselben Farben. */
{
 const fallback=vm.createContext({console});for(const f of ['gl3d.js','farmmodels.js'])vm.runInContext(read(f),fallback);
 assert.notEqual(vm.runInContext('JSON.stringify(FM.treeMesh("apfel",false).v)',fallback),vm.runInContext('JSON.stringify(FM.treeMesh("apfel",true).v)',fallback));
}
const extract=(file,name)=>{const s=read(file),i=s.indexOf('function '+name+'('),end=s.indexOf('\n}',i);assert.ok(i>=0&&end>i,name);return s.slice(i,end+2);};
run(`var S={time:10,money:100,expense:0,farm:{objs:[],stats:{harvest:0},cos:{}}};
var uploads=0,FV={meshes:{},nodes:new Map(),R:{nodes:[],mesh:b=>({v:b.v,id:++uploads}),node:(mesh,o)=>Object.assign({mesh,children:[]},o),addChild:(p,n)=>{p.children.push(n);return n;}}};
var PEN_HUT={};
function farmObj(id){return S.farm.objs.find(o=>o.id===id);}function farmCenter(o){return [o.x||0,o.z||0];}function farmYaw(){return 0;}
function flv(){return 100;}function farmXP(){}function farmEvent(){}function toast(){}function farmRoom(){return 100;}function farmAdd(){}
`);
for(const name of ['FCROPS','FITEMS','FTREES'])run(read('farmdata.js').match(new RegExp('const '+name+' = \\{[\\s\\S]*?\\n\\};'))[0]);
for(const [file,names] of [['farm.js',['fieldState','fieldStage','farmCropOk','farmPlant','farmWater','farmHarvest','treeRipe','treeDef','farmPick']],['farmview.js',['fmesh','fnode','objMesh','objSig','buildObjNode','farmSyncState']]])
 for(const name of names){const text=read(file),single=text.match(new RegExp('^function '+name+'\\([^\\n]+\\} *$', 'm'));run(single?single[0]:extract(file,name));}
run(`var field={id:1,t:'field',x:0,z:0},tree={id:2,t:'tree',kind:'apfel',end:500,w:false};S.farm.objs=[field,tree];
for(const o of S.farm.objs)FV.nodes.set(o.id,buildObjNode(o));farmSyncState();var empty=FV.nodes.get(1).node.mesh;
farmPlant(field,'mais');farmSyncState();var de=FV.nodes.get(1),te=FV.nodes.get(2),drySoil=de.node.mesh,dryCrop=de.parts.crop.mesh,dryTree=te.node.mesh,dryTreeSoil=te.parts.soil.mesh,fruit=te.parts.fruit.mesh;`);
assert.notEqual(run('empty===drySoil'),true);
run('var saved=JSON.stringify(S);farmSyncState();');assert.equal(run('JSON.stringify(S)'),run('saved'),'Nur Darstellung geändert');
run('farmWater(field);farmWater(tree);farmSyncState();');
for(const expr of ['de.node.mesh!==drySoil','de.parts.crop.mesh!==dryCrop','te.node.mesh!==dryTree','te.parts.soil.mesh!==dryTreeSoil','te.parts.fruit.mesh===fruit'])assert.equal(run(expr),true,expr);
run('var u=uploads;for(var i=0;i<60;i++)farmSyncState();');assert.equal(run('uploads'),run('u'),'Kein wiederholter GPU-Upload');
run('S.time=field.end;farmSyncState();farmHarvest(field);farmSyncState();');assert.equal(run('de.node.mesh===empty'),true);assert.equal(run('de.parts.crop.visible'),false);
run('farmPlant(field,"mais");farmSyncState();');assert.equal(run('de.node.mesh===drySoil'),true,'Neuer Wachstumszyklus wieder trocken');
run('S.time=tree.end;farmPick(tree);farmSyncState();');assert.equal(run('te.node.mesh===dryTree'),true);assert.equal(run('te.parts.soil.mesh===dryTreeSoil'),true);assert.equal(run('te.parts.fruit.visible'),false);
run('farmWater(tree);farmSyncState();var loaded=JSON.stringify(S);S=JSON.parse(loaded);FV.nodes.clear();for(const o of S.farm.objs)FV.nodes.set(o.id,buildObjNode(o));farmSyncState();');
assert.equal(run('FV.nodes.get(2).waterKey'),'wet');assert.equal(run('FV.nodes.get(1).soilKey'),'dry');
console.log('OK: '+meshes+' trockene/nasse Originalnetze, sieben Kulturen/vier Stufen, drei Obstbäume, unveränderte Früchte/Geometrie, Kontrast, Kachelgrenzen, Gießen/Ernte/Neuaussaat/Neuladen und begrenzter Mesh-Cache. Kein Live-Browser-/Handytest.');
