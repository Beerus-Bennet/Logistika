/* v284: Reale Figurenanimationen und Monitorlayout prüfen: node office-workers-v284.test.js */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const C={console,performance:{now:()=>0}};C.window=C;vm.createContext(C);
for(const f of ['avatar.js','gl3d.js','officekitchen.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),C);
const src=fs.readFileSync(path.join(__dirname,'officefp.js'),'utf8').replace('return { enter, leave,','return { qa:{ buildFigure, animFigure, screenCanvas, fitScreenText, screenLines, bubblePosition, deskWrist, setO:o=>{O=o} }, enter, leave,');
vm.runInContext(src+'\nthis.Q=OFFICE3D.qa;',C);const Q=C.Q;
const node=o=>Object.assign({x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1,visible:true},o?.s?{sx:o.s,sy:o.s,sz:o.s}:{},o||{});
const R={node:(mesh,o)=>Object.assign(node(o),{mesh}),addChild:(p,n)=>n};
const state={R,t:0,reduced:false,staff:[],deaths:0};Q.setO(state);
const F={p:{id:'P2',name:'Test',role:'disp',av:{skin:1}},x:0,z:0,dz:0};Q.buildFigure(R,F,(k,fn)=>fn());state.staff=[F];
const pl={d:10,front:false,l:[0,1,3]};
for(const act of ['type','mouse','read','note','phone','cup','look']){
 F.act=act;F.actT=0;F.actDur=12;let maxGap=0;
 for(let i=0;i<720;i++){state.t+=1/60;Q.animFigure(F,1/60,state.t*1000,pl);for(const a of F.arm){assert.ok([...a.H,...a.E,a.hand.rx,a.hand.ry,a.hand.rz].every(Number.isFinite));assert.ok(Math.hypot(...a.H.map((v,j)=>v-a.S[j]))<.432);}
 if(act==='note'&&F.pen.visible){maxGap=Math.max(maxGap,Math.abs(F.arm[1].C[1]-.534));}}
 if(act==='note')assert.ok(maxGap<.02,'Stiftkontakt bleibt im Schreibbereich statt über dem Block zu schweben');
 console.log(act,'OK',act==='note'?'max Schreibkontakt-Höhenabweichung '+maxGap.toFixed(3):'');
}
F.shock={at:state.t-10,F:{dead:false},pt:[0,1,0]};state.deaths=1;F.act='type';F.actT=4;
for(let i=0;i<120;i++){state.t+=1/60;Q.animFigure(F,1/60,state.t*1000,pl);}
assert.equal(F.actT,4);assert.equal(F.arm[0].g,'rest');assert.equal(F.arm[1].g,'rest');assert.equal(F.pen.visible,false);assert.equal(F.held,null);
for(const x of [-200,0,390,1000]){const p=Q.bubblePosition(x,30,390,700,220,140);assert.ok(p[0]>=118&&p[0]<=272);assert.ok(p[1]>=160);}
const g={measureText:t=>({width:String(t).length*6})};const lines=Q.screenLines(g,'Mein Monat: 13 Aufträge mit Papieren betreut',240);assert.ok(lines.length>1);assert.ok(lines.every(x=>g.measureText(x).width<=240));
assert.ok(g.measureText(Q.fitScreenText(g,'LOGISTIKA · Zoll & Papiere',184)).width<=184);
console.log('OK: alle Tätigkeiten, Armreichweite, Notfall ohne Weiterarbeiten, Bildschirmtexte und Sprechblasengrenzen.');
