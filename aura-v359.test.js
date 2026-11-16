/* v359: Aura um Gold- und Diamant-Stücke. node aura-v359.test.js */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const C={console};C.window=C;vm.createContext(C);for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),C);
const run=s=>vm.runInContext(s,C),js=fs.readFileSync(path.join(__dirname,'hunt.js'),'utf8');
assert.deepEqual(run('Object.keys(HUNT.AURA).join()'),'3,4','nur Gold und Diamant haben eine Aura');
for(const k of ['k','dark','rays','lances','spark','shaft'])assert.ok(run(`HUNT.AURA[4].${k}>HUNT.AURA[3].${k}`),'Diamant stärker als Gold: '+k);
assert.ok(run('HUNT.AURA[4].wave<HUNT.AURA[3].wave'),'Diamant: Lichtwellen in kürzerem Abstand');
assert.match(js,/const P = AURA\[A\.medal\]; if \(!P \|\| X\.aura/,'Bronze und Silber bleiben ohne Aura');
assert.match(js,/function bedClear\(\) \{\s*auraClear\(\);/,'Aura wird mit dem Liegeplatz entfernt');
assert.match(js,/prefers-reduced-motion/,'reduzierte Bewegung wird beachtet');
/* reine Darstellung: Preise, Erfahrung und Medaillengrenzen unverändert */
assert.match(js,/const PRICE = \{ hirsch: \[0, 180, 420, 950, 2600\], keiler: \[0, 120, 300, 700, 1900\], fasan: \[0, 40, 90, 200, 520\] \};/);
assert.match(js,/return Math\.min\(e >= 0\.9 \? 4 : e >= 0\.72 \? 3 : e >= 0\.5 \? 2 : 1, Z\.cap\);/);
console.log('OK: Aura nur für Gold/Diamant, Diamant in allen Größen stärker, Aufräumen und Wertung unverändert.');
