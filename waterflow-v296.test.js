/* v296: Regressionsprüfung für Fließrichtung, Wasserkontakt und alle vier Bergkaskaden.
   Aufruf im Projektordner: node waterflow-v296.test.js */
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), assert = require('node:assert/strict');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const gl = read('gl3d.js'), world = read('worldview.js');
const match = (re, s = gl) => { const m = s.match(re); assert.ok(m, 'Erwarteter Quellabschnitt: ' + re); return m[1]; };

/* Tatsächliche GLSL-Koordinaten ausführen, statt die Formel im Test nachzubauen. */
const travel = new Function('a', match(/float fallTravel\(float a\)\{([\s\S]*?)\}/));
const phases = new Function('a', 't', 'fallTravel', (
  match(/(float travel =[^;]*;\s*float v =[^;]*;)/) + '\n' + match(/(float v2 =[^;]*;)/)
).replace(/float /g, 'let ').replace(/uFlow\.x/g, 'uFlow[0]').replace(/uFlow\.y/g, 'uFlow[1]') + '\nreturn [v, v2, v3];');
const stream = new Function('s', 't', 'spc', 'return ' + match(/float v = (s \*[^;]*);/));
const streamFine = new Function('s', 't', 'spc', 'return ' + match(/n3 = vnoise\(vec2\(w \* 8\.5 \+ 1\.1, ([^;]*?)\)\);/));
/* v297: Nur der Hauptfall verwendet noch das Fallmaterial. Die Kaskaden benutzen
   mit dem Bach dasselbe Material und dieselbe durchgehende Strömungskoordinate. */
for (const t of [0, 4, 15, 60, 600, 3600, 7200]) for (const a of [0.05, 0.3, 0.6, 0.9, 0.99]) {
  const p = phases(a, t, travel), dx = phases(a + 0.0001, t, travel), dt = phases(a, t + 0.001, travel);
  for (let i = 0; i < p.length; i++) {
    assert.ok(dx[i] > p[i], 'Ortskoordinate bleibt aufsteigend, auch nach zwei Stunden');
    assert.ok(dt[i] < p[i], 'Muster wandert talwärts');
  }
}
for (let a = 0; a < 1; a += 0.01) assert.ok(travel(a + 0.01) > travel(a));
for (const fn of [stream, streamFine]) for (const t of [0, 15, 600, 7200]) for (const direction of [-1, 1]) {
  const speed = s => 0.7 + direction * (s - 2) * 0.5, s = 2, p = fn(s, t, speed(s));
  assert.ok(fn(s + 0.001, t, speed(s + 0.001)) > p, 'Bach bleibt auch bei wechselnder Turbulenz talwärts');
  assert.ok(fn(s, t + 0.001, speed(s)) < p);
}

const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['gl3d.js', 'farmmodels.js', 'bushes.js', 'woodmodels.js']) vm.runInContext(read(f), ctx);
const erbe = read('erbe.js'), startWorld = erbe.indexOf('const FWORLD =');
vm.runInContext(erbe.slice(startWorld, erbe.indexOf('\n};', startWorld) + 3), ctx);
vm.runInContext(`const CR={w:1.5,taper:[0,0],min:.7}, SPI=FWM.springInfo(FWORLD.creek,CR), SF=FWM.SPRING_FALL,k=SF.S,
  ryF=Math.atan2(-SPI.dir[1],SPI.dir[0])+Math.PI/2,cF=Math.cos(ryF),sF=Math.sin(ryF),
  WF=(x,z)=>[SPI.C[0]+(x*cF+z*sF)*k,SPI.C[1]+(-x*sF+z*cF)*k];
  FWM.setSpringFrame(SPI.C,ryF,k);`, ctx);
const FWM = vm.runInContext('FWM', ctx), impact = FWM.springImpact(), curve = FWM.springFallPath(impact.a);
assert.ok(Math.abs(curve[1] - impact.y) < 1e-6);
assert.ok(Math.abs(impact.y * FWM.SPRING_FALL.S - FWM.SPR.waterY) < 1e-12);
assert.equal(impact.x, curve[0] + curve[4]);
assert.ok(impact.foamY > impact.y && impact.foamY - impact.y < 0.02, 'Schaum direkt auf dem Wasser');
const foam = FWM.springFoam().v;
assert.ok(foam[0] < impact.x, 'Schaumfläche beginnt hinter dem Einschlag');
for(let i=0;i<foam.length;i+=9){assert.equal(foam[i+1],impact.foamY);assert.equal(foam[i+8],-1);}
assert.equal(foam[1], impact.foamY);
for (const name of ['springFall', 'springFoam', 'springRun', 'springCascades', 'springRunFoam']) {
  const a = FWM[name]().v, b = FWM[name]().v;
  assert.deepEqual(a, b, 'Deterministisches Modell ' + name);
  assert.ok(a.length > 0 && a.every(Number.isFinite), name);
  assert.ok(a.length / 27 < 5000, 'Dreiecksbudget ' + name);
}

const Istart = world.indexOf('    const I = FWM.springRunInfo();');
const setupI = world.slice(Istart, world.indexOf('\n', world.indexOf('    WV.springRun = ', Istart)));
const fxStart = world.indexOf('    const impact = FWM.springImpact()');
const setupFx = world.slice(fxStart, world.indexOf('\n  }\n  worldWaterCheck', fxStart));
const effectStart = world.indexOf('  /* v190: Gischt');
const effects = world.slice(effectStart, world.indexOf('  stepOutline(time);', effectStart));
const script = new vm.Script('{\n' + effects + '\n}');
const totals = [];
for (const fps of [30, 60, 120]) {
  vm.runInContext(`var WV={},emitted=[],FV={R:{cam:{tx:SPI.C[0],tz:SPI.C[1]},env:{sunCol:[.08,.08,.08]},emit:p=>emitted.push(p)}},dt=1/${fps};`, ctx);
  vm.runInContext('{\n' + setupI + '\n' + setupFx + '\n}', ctx);
  for (let n = 0; n < fps * 10; n++) script.runInContext(ctx);
  const { WV, FV, emitted } = vm.runInContext('({WV,FV,emitted})', ctx), sf = WV.springFx;
  assert.equal(WV.springRun.feet.length, 4);
  assert.equal(sf.strands.length, 0, 'Keine seitlichen Nebenfälle oder deren Spritzer');
  assert.ok(Math.abs(sf.y - FWM.SPR.waterY) < 1e-12);
  assert.ok(Math.hypot(sf.path(impact.a).x - sf.x, sf.path(impact.a).z - sf.z) < 1e-10);
  assert.ok(emitted.length >= 585 && emitted.length <= 590, 'Gesamtrate für Hauptfall und vier Kaskaden');
  for (const p of emitted) {
    for (const f of ['x', 'y', 'z', 'vx', 'vy', 'vz', 'life', 'size', 'size2']) assert.ok(Number.isFinite(p[f]), f);
    assert.ok(p.life > 0 && p.size > 0 && p.col.every(Number.isFinite));
    assert.ok(p.col[0] < 0.65 && p.col[3] <= 1, 'Keine unbeleuchtet weiße Nachtgischt');
  }
  const coverage = (points, offset, shape, expected) => {
    const counts = points.map(f => emitted.filter(p => p.shape === shape && Math.abs(p.y - f.y - offset) < 1e-8 && Math.hypot(p.x - f.x, p.z - f.z) < 0.4).length);
    assert.ok(counts.every(n => Math.abs(n - expected) <= 1), 'Alle Auftreffpunkte gleichmäßig: ' + counts);
  };
  coverage(WV.springRun.feet, 0.04, 5, 35);
  coverage(WV.springRun.feet, 0.1, 4, 7.5);

  const lipDrops = emitted.filter(p => p.y === sf.ly);
  assert.ok(lipDrops.length >= 49);
  for (const p of lipDrops) {
    assert.equal(p.vy, 0, 'Tropfen starten waagerecht und fallen mit Schwerkraft');
    assert.ok(Math.abs(p.y + p.g * p.life * p.life / 2 - sf.y) < 1e-8, 'Falltropfen enden auf Seehöhe');
    assert.ok(p.vx * sf.dx + p.vz * sf.dz > 0);
  }
  const splash = emitted.filter(p => Math.abs(p.y - sf.y - 0.025) < 1e-10);
  assert.ok(splash.length >= 319);
  for (const p of splash) assert.ok(p.vx * sf.dx + p.vz * sf.dz > 0, 'Aufprallspritzer laufen zum See aus');
  totals.push(emitted.length);FV.R.cam.tx = 1000;const count = emitted.length;script.runInContext(ctx);
  assert.equal(emitted.length, count, 'Keine Emission bei ferner Kamera');
  emitted.length = 0; FV.R.cam.tx = sf.x + 55; FV.R.cam.tz = sf.z;
  for (let n = 0; n < fps; n++) script.runInContext(ctx);
  assert.ok(emitted.length >= 16 && emitted.length <= 18, 'Nur Bergkaskaden im äußeren Sichtbereich');
  assert.ok(emitted.every(p => p.col[0] < 0.65), 'Nachtlicht auch ohne aktiven Hauptfall-Emitter');
}
assert.ok(Math.max(...totals) - Math.min(...totals) <= 5);
console.log('OK: Shader-Fließrichtung bis 7200 s, exakter See-Aufprall, fünf Modellbudgets, vier Kaskaden ohne Nebenstränge bei 30/60/120 fps, Nachtfarben und Kameradistanz.');
