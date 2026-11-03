/* v281: Bürogrenzen, Oberfläche und gespeicherte Übernahme-Sitze prüfen.
   Aufruf: node office-limits.test.js */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ctx = vm.createContext({ console, DECISIONS: {} });
for (const file of ['offices.js', 'corp.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), ctx);
vm.runInContext(`
var S = {stage:1, bases:[], fleet:[], money:1e12, expense:0, time:0, seq:1, player:{company:'Test'}};
var N = Object.fromEntries(Array.from({length:40}, (_,i)=>['n'+i,{id:'n'+i,name:'Ort '+i,stage:1,type:'city',modes:'r'}]));
var notices=[];
toast=(text)=>notices.push(text); save=()=>{}; render=()=>{}; phoneMsg=()=>{};
refreshPool=()=>{}; perks=()=>({}); logMoney=()=>{}; tutTabHook=()=>{};
isUnlocked=id=>!!N[id] && N[id].stage<=S.stage;
unlockedNodes=()=>Object.values(N).filter(n=>isUnlocked(n.id));
rivalById=id=>({id,name:id}); esc=x=>String(x); money=x=>String(x); kmf=x=>String(x); TYPE_GLYPH={};
`, ctx);
const run = code => vm.runInContext(code, ctx);
for (const [stage, cap] of [[1,1],[2,3],[3,10],[4,15],[5,20],[6,Infinity]]) {
  run(`S.stage=${stage}; S.bases=[]; notices=[];`);
  assert.equal(run('maxBases()'), cap);
  const count = Number.isFinite(cap) ? cap : 30;
  for (let i=0;i<count;i++) run(`openBase('n${i}',0,false)`);
  assert.equal(run('S.bases.length'), count);
  if (Number.isFinite(cap)) {
    run(`openBase('n${count}',0,false)`);
    assert.equal(run('S.bases.length'), cap);
    assert.match(run('newBaseCard()'), /Bürogrenze dieser Etappe erreicht/);
  } else {
    assert.match(run('newBaseCard()'), /unbegrenzt viele Standorte möglich/);
    assert.doesNotMatch(run('newBaseCard()'), /Infinity|nächste Etappe|Alle Standorte/);
  }
}
// Übernahmesitze bleiben an der Grenze über einen Speicherzyklus erhalten.
run(`S.stage=2; S.bases=S.bases.slice(0,3); N['b-tempel']={id:'b-tempel',name:'Tempelhof',short:'Tempelhof',stage:1,modes:'r'};
S.corp={owned:{blitz:{hq:1}}, hq:{blitz:{staff:[{id:'P1',name:'Erhalten',role:'disp',skill:3,wage:100}]}}};
corpHqTry();`);
assert.equal(run('S.bases.length'),3);
assert.equal(run('S.corp.hq.blitz.staff[0].id'),'P1');
run('S=JSON.parse(JSON.stringify(S)); corpHqTry();');
assert.equal(run('S.corp.hq.blitz.staff[0].id'),'P1');
run('S.stage=3; corpHqTry();');
assert.equal(run('S.bases.length'),4);
assert.equal(run('baseAtNode("b-tempel").staff[0].id'),'P1');
assert.equal(run('S.corp.hq.blitz'),undefined);
run('corpHqTry();');
assert.equal(run('S.bases.length'),4);
// Bestehende Büros werden beim Laden auch oberhalb einer Grenze nicht entfernt.
run('S.stage=1; ensureOffices();');
assert.equal(run('S.bases.length'),4);
run(`S.stage=3; S.bases=[]; S.corp={owned:{blitz:{hq:1}},hq:{}};
corpHqStaff=()=>[{id:'RESTORED',role:'disp',skill:3,wage:100}]; corpHqTry();`);
assert.equal(run('baseAtNode("b-tempel").staff[0].id'),'RESTORED');
assert.equal(run('S.corp.hqRestore281'),true);
run('S.bases=[]; corpHqTry();');
assert.equal(run('S.bases.length'),0); // Nach der einmaligen Reparatur kein Wiederbeleben verkaufter Büros.
run(`S.stage=1; S.bases=[{id:'existing',node:'n0',staff:[],vehicles:[]}];
S.corp={owned:{blitz:{hq:1}},hq:{}}; corpHqTry(); S=JSON.parse(JSON.stringify(S));`);
assert.equal(run('S.corp.hq.blitz.staff[0].id'),'RESTORED');
run('S.stage=2; corpHqTry();');
assert.equal(run('S.bases.length'),2);
run('corpHqTry();');
assert.equal(run('S.bases.length'),2);
console.log('OK: alle 6 Etappen, Kaufgrenzen, Welt mit 30 Büros, Oberfläche, Vormerkung, Speichern/Laden, Etappenaufstieg und Bestandsschutz.');
