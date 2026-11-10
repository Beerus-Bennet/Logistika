/* v307: Modelle, tatsächliche Animationsknoten, Trefferzustand und Flugauftrag.
   Ausführen: node hunt-v307.test.js. Kein Browser und keine simulierten Modell-/Posefunktionen. */
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), assert = require('node:assert/strict');
function harness(source) {
  let seed = 17;
  const math = Object.create(Math); math.random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  const timers = [], cache = new Map(), C = { console, Math: math, navigator: {}, S: { time: 10, farm: { snd: false } }, save() {}, setTimeout: fn => { timers.push(fn); return timers.length; } };
  const node = (mesh, o = {}) => { const n = Object.assign({ mesh, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, visible: true, children: [] }, o); if (o.s != null) n.sx = n.sy = n.sz = o.s; return n; };
  C.FV = { R: { nodes: [], node, addChild(p, n) { p.children.push(n); n.parent = p; return n; }, burst() {}, updateCamera() {}, eye: [5, .24, 0], w: 400, h: 800, ray() { return { o: this.eye, d: [-1, 0, 0] }; } } };
  C.fnode = node; C.fmesh = (k, fn) => { if (!cache.has(k)) cache.set(k, fn()); return cache.get(k); };
  C.window = C; vm.createContext(C);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'gl3d.js'), 'utf8'), C);
  const code = source || fs.readFileSync(path.join(__dirname, 'hunt.js'), 'utf8');
  vm.runInContext(code.replace('    CX, CZ, CR, TW, TRY, PH, EYEP, EYER, RV, FC, M_PER_U, SP, ZONE, MEDALS, PRICE, NEED, DOT,',
    '    qa: { build, takeOff, stepAnimal, fallStart, deadLeg, shotContext: typeof shotContext === "undefined" ? null : shotContext, shotName: typeof shotName === "undefined" ? null : shotName, onHit, JOBT, setX: x => X = x }, CX, CZ, CR, TW, TRY, PH, EYEP, EYER, RV, FC, M_PER_U, SP, ZONE, MEDALS, PRICE, NEED, DOT,') + '\nthis.H = HUNT; this.G = G3;', C);
  const H = C.H, G = C.G, Q = H.qa, X = { inRv: true, aid: 0, animals: [], nodes: [], wind: { v: 0, dir: 0 }, t: 0, view: 'scope', mode: 'hold', reload: 0 };
  Q.setX(X);
  const animal = (k, score = .65, g = 77) => H._spawn(k, false, { g, score, x: H.FC.x, z: H.FC.z, st: 'look', t: 100, tx: H.FC.x, tz: H.FC.z, ry: .3 });
  function visit(root, fn, parent = G.ID()) {
    if (root.visible === false) return;
    const M = G.mul(G.ID(), parent, G.trs(G.ID(), root.x, root.y, root.z, root.rx, root.ry, root.rz, root.sx, root.sy, root.sz));
    if (root.mesh) fn(root.mesh.v, M);
    root.children.forEach(n => visit(n, fn, M));
  }
  const minY = root => { let y = Infinity; visit(root, (v, M) => { for (let i = 0; i < v.length; i += 9) y = Math.min(y, M[1] * v[i] + M[5] * v[i + 1] + M[9] * v[i + 2] + M[13]); }); return y; };
  function flatten(root) {
    const v = []; visit(root, (a, M) => { for (let i = 0; i < a.length; i += 9) {
      const normal = [0, 1, 2].map(j => M[j] * a[i + 3] + M[j + 4] * a[i + 4] + M[j + 8] * a[i + 5]), len = Math.hypot(...normal) || 1;
      v.push(...[0, 1, 2].map(j => M[j] * a[i] + M[j + 4] * a[i + 1] + M[j + 8] * a[i + 2] + M[j + 12]), ...normal.map(x => x / len), ...a.slice(i + 6, i + 9));
    } }); return v;
  }
  return { H, Q, X, C, G, animal, minY, flatten, timers };
}
function tests() {
  let n = 0; const test = (name, fn) => { fn(); console.log('ok ' + (++n) + ' ' + name); };
  const { H, Q, X, animal } = harness();
  test('Acht Schwarte-Familien, stabile gespeicherte Merkmale und unverändert seltene weiße/gescheckte Keiler', () => {
    assert.equal(H.COATS.keiler.length, 8); assert.equal(H.COATS.keiler.reduce((s, c) => s + c[1], 0), 100);
    assert.equal(H.COATS.keiler.find(c => c[0] === 'weiss')[1], .5); assert.equal(H.COATS.keiler.find(c => c[0] === 'schecke')[1], 2.5);
    const colors = new Set();
    for (const coat of H.COATS.keiler) {
      const gn = JSON.parse(JSON.stringify({ ...H.genes('keiler', .65, 77), c: coat[0] }));
      const mesh = () => H._v200.withLook('keiler', gn, () => H._m.boarBody()).v;
      const a = mesh(); assert.ok(a.every(Number.isFinite)); assert.deepEqual(a, mesh());
      colors.add(JSON.stringify(a.filter((_, i) => i % 9 >= 6)));
    }
    assert.equal(colors.size, 8);
  });
  test('Schulter und Hüfte sitzen im Rumpf; beide bewegten Laufsegmente bleiben treffbar', () => {
    for (const L of H.SP.keiler.legs) assert.ok(H._inTorso('keiler', L.h, 0) > .02);
    const pose = { x: 0, y: 0, z: 0, ry: 0, s: 1, nrx: -.35, legs: [[-.5, 1.1], [0, 0], [.4, -.8], [0, 0]] };
    for (const i of [0, 2]) {
      const L = H.SP.keiler.legs[i], a = pose.legs[i], q = H.rot([0, -.12, 0], a[1], 0, 0), p = H.rot([q[0], q[1] - L.lu, q[2] + H._legDim('keiler', L)[2]], a[0], 0, 0);   /* v343: Versatz des Sprunggelenks aus dem Modell statt fester Zahl */
      assert.equal(H.zoneHit('keiler', pose, [6, p[1] + L.h[1], p[2] + L.h[2]], [-1, 0, 0]).zone, 'lauf');
    }
  });
  test('Körpermaßstab bleibt beim Atmen, Umfallen und Liegen erhalten', () => {
    const A = animal('keiler', .95); Q.stepAnimal(A, 1 / 60, 1);
    assert.ok(Math.abs(A.node.sy / A.s - 1) < .007);
    A.side = -1; A.st = 'fall'; Q.fallStart(A, .55); Q.stepAnimal(A, 1 / 60, 2);
    assert.equal(A.node.sy, A.s); assert.equal(A.node.sx, A.s); assert.equal(A.node.sz, A.s);
  });
  test('16 Sturzabläufe: beide Arten/Seiten, kleine/große Tiere, Stand/Galopp; Haut, Kopf, Geweih und Hufe über dem Boden', () => {
    let frames = 0;
    for (const k of ['keiler', 'hirsch']) for (const side of [-1, 1]) for (const sc of [.1, .95]) for (const speed of [0, 4]) {
      const q = harness(), A = q.animal(k, sc, 52), dt = sc < .5 ? 1 / 30 : 1 / 60;
      A.v = A.vT = speed; A.gw = speed ? 1 : 0; q.Q.stepAnimal(A, dt, 1);
      const start = [A.node.y, A.node.rx, A.node.rz, A.neck.rx]; A.side = side; A.st = 'fall'; q.Q.fallStart(A, .55);
      assert.ok(A.fT > 1 && A.fT < 1.5); assert.equal(A.y0, start[0]); assert.equal(A.rx0, start[1]); assert.equal(A.rz0, start[2]);
      let y = A.node.y, min = Infinity, maxJump = 0, t = 0;
      while (A.st !== 'dead' && t < 2) {
        t += dt; q.X.t = t; q.Q.stepAnimal(A, dt, 1 + t); frames++;
        min = Math.min(min, q.minY(A.node)); maxJump = Math.max(maxJump, Math.abs(A.node.y - y)); y = A.node.y;
        assert.ok(A.legsA.flat().every(Number.isFinite));
      }
      assert.equal(A.st, 'dead'); assert.ok(min >= -.012 * A.s, k + ' ' + side + ' ' + sc + ' Boden ' + min);
      assert.ok(maxJump < .12 * A.s, k + ' abrupter Höhensprung ' + maxJump);
      const end = q.flatten(A.node); q.Q.stepAnimal(A, dt, 3); const next = q.flatten(A.node);
      assert.ok(end.every((v, i) => i % 9 >= 6 || Math.abs(v - next[i]) < .0001), 'Kein Posensprung nach dem Aufliegen');
    }
    console.log('  ' + frames + ' echte Animationsbilder vermessen');
  });
  test('Vorderläufe knicken vor den Hinterläufen ein, bevor der Rumpf vollständig rollt', () => {
    const A = animal('keiler'); Q.stepAnimal(A, .01, 1); A.side = 1; A.st = 'fall'; Q.fallStart(A, .8);
    A.t = A.fT * .84; const front = Q.deadLeg(A, 0), rear = Q.deadLeg(A, 2);
    assert.ok(Math.abs(front[1]) > Math.abs(rear[1]) + .15); assert.ok(A.fT > .8);
  });
  test('Gehender, pickender, startender, fliegender und gelandeter Fasan werden korrekt unterschieden', () => {
    for (const [st, y, air] of [['walk', 0, false], ['peck', 0, false], ['fly', 0, false], ['fly', 2, true], ['land', .02, false]]) {
      const c = Q.shotContext({ k: 'fasan', st, y, v: 1 }); assert.equal(c.air, air);
      const label = Q.shotName({ k: 'fasan', zone: 'vogel', ...c }); assert.ok(label.includes(air ? 'im Flug' : 'am Boden'), st + label);
    }
    assert.equal(Q.shotName({ k: 'fasan', zone: 'vogel' }), 'Treffer');
    assert.equal(Q.shotName({ k: 'fasan', zone: 'vogel', mv: 0 }), 'Treffer am Boden');
    assert.equal(Q.shotName({ k: 'fasan', zone: 'vogel', mv: 1 }), 'Treffer im Flug');
  });
  test('Echte Schussverzögerung: Flugzustand beim Abdrücken bleibt erhalten, auch bei Start/Landung vor dem Einschlag', () => {
    for (const flying of [false, true]) {
      const q = harness(), A = q.animal('fasan'); A.x = A.z = 0; A.ry = 0; A.st = flying ? 'fly' : 'walk'; A.y = flying ? 2 : 0; A.node.y = A.y;
      A.fly = { vy: 0, vx: 0, vz: 0 }; q.C.FV.R.eye = [5, A.y + .24 * A.s, -.02 * A.s];
      q.H._fire(); assert.ok(q.timers.length > 0, 'Geschoss unterwegs');
      A.st = flying ? 'land' : 'fly'; A.y = flying ? 0 : 2;
      q.timers.shift()(); assert.equal(A.air, flying); assert.equal(A.mv, flying);
      assert.ok(q.H.shotOf({ k: 'fasan', zone: A.zone, air: A.air, mv: A.mv }).why[0][0].includes(flying ? 'im Flug' : 'am Boden'));
      const saved = JSON.parse(JSON.stringify({ k: 'fasan', zone: A.zone, air: A.air, mv: A.mv }));
      assert.equal(q.Q.shotName(saved), q.Q.shotName(A));
      const count = A.hits.length; q.Q.onHit(A, 'vogel', 10); assert.equal(A.hits.length, count, 'Doppelter Einschlag verwirft Folgeauswertung');
    }
  });
  test('Fasan nach Boden- und Flugtreffer: Sturz endet in stabiler Pose mit erhaltener Trefferbeschriftung', () => {
    for (const flying of [false, true]) {
      const q = harness(), A = q.animal('fasan', .8); q.Q.stepAnimal(A, 1 / 60, 1);
      if (flying) { q.Q.takeOff(A, .7, { air: true }); A.y = A.node.y = 2; }
      q.Q.onHit(A, 'vogel', 180); let time = 0;
      while (A.st !== 'dead' && time < 3) { time += 1 / 60; q.X.t = time; q.Q.stepAnimal(A, 1 / 60, 1 + time); }
      assert.equal(A.st, 'dead'); assert.equal(A.air, flying); assert.ok(q.minY(A.node) >= -.012 * A.s, 'Fasan liegt über dem Boden');
      assert.equal(A.node.sy, A.s); assert.ok(q.Q.shotName(A).includes(flying ? 'im Flug' : 'am Boden'));
    }
  });
  test('Flugauftrag zählt ausschließlich einen bestätigten Flugtreffer', () => {
    const j = Q.JOBT.find(j => j.id === 'art_f');
    assert.equal(j.ok({ k: 'fasan', air: false }), false); assert.equal(j.ok({ k: 'fasan' }), false); assert.equal(j.ok({ k: 'fasan', air: true }), true); assert.equal(j.ok({ k: 'keiler', air: true }), false);
  });
  test('Fasane mit 32 % etwas häufiger; Flugtimer, Güte, Medaillen und Tiergrenzen bleiben erhalten', () => {
    const count = { hirsch: 0, keiler: 0, fasan: 0 }; for (let i = 0; i < 10000; i++) count[H.pickSpecies(() => (i + .5) / 10000)]++;
    assert.deepEqual(count, { hirsch: 4000, keiler: 2800, fasan: 3200 });
    assert.deepEqual(Array.from(H.FLY_NEXT), [45, 75]); assert.equal(H.LIMIT.total, 3); assert.equal(H.LIMIT.ground, 2); assert.equal(H.LIMIT.fly, 1);
    assert.equal(H.medalOf(.95, 'vogel'), 4); assert.equal(H.PRICE.keiler[1], 120);
  });
  console.log(n + ' Prüfgruppen bestanden.');
}
module.exports = { harness };
if (require.main === module) tests();
