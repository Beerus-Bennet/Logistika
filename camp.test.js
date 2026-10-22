/* Tests für den Lagerplatz (v95): node tests/camp.test.js
   Wege ums Feuer herum (nie hindurch), Beine vor den Sofas, Gesprächs-Regie (Blick, Nicken, Kopfschütteln). */
const assert = require("assert");
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
let n = 0; const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };
let seed = 11; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const M = Object.create(Math); M.random = rand;
const ctx = { console, Math: M, Object, Array, JSON, Map, Set, Float32Array, Uint8Array, Uint16Array, Int32Array, Date };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "camp.js"), "utf8") + "\n;this.CAMP = CAMP;", ctx, { filename: "camp.js" });
const C = ctx.CAMP;
const loc = (x, z) => { const dx = x - C.CX, dz = z - C.CZ, s = Math.SQRT1_2; return [(dx - dz) * s, (dx + dz) * s]; };
const dens = (route, step) => { const o = []; for (let i = 1; i < route.length; i++) { const a = route[i - 1], b = route[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(l / step)); for (let q = 0; q <= k; q++) o.push([a[0] + (b[0] - a[0]) * q / k, a[1] + (b[1] - a[1]) * q / k, i, q === k]); } return o; };

test("neun Sitzplätze, Becken vorn auf der Sitzfläche (nicht hinter der Mitte)", () => {
  assert.strictEqual(C.slots.length, 9);
  C.slots.forEach(s => { assert.ok(Math.hypot(s.lx, s.lz) < s.R - 0.05, s.id); assert.ok(Math.hypot(s.lx, s.lz) > s.R - 0.3, s.id); });
});
test("Füße enden vor dem Sofa, aber weit außerhalb der Feuerstelle (Radius ≥ 1,7)", () => {
  C.slots.forEach(s => { const front = Math.hypot(s.lx, s.lz) - (0.275 + 0.075) * 1.45; assert.ok(front > 1.7, s.id + " " + front.toFixed(2)); });
});
test("Weg hinein: nie näher als 1,45 ans Feuer, nie durch Sofa oder Wand (ab Tor nur Mittelgang und Ring)", () => {
  C.slots.forEach(s => {
    const r = C.routeIn(s);
    dens(r, 0.1).forEach(([x, z, seg, end]) => {
      const l = loc(x, z), rr = Math.hypot(l[0], l[1]);
      assert.ok(rr > 1.44, s.id + " zu nah am Feuer " + rr.toFixed(2));
      const gang = Math.abs(l[0]) < 0.2 && l[1] > 1.4, ring = rr < 1.62, fin = Math.abs(Math.sin(Math.atan2(-l[1], l[0]) - s.ang * Math.PI / 180)) < 0.02;
      assert.ok(gang || ring || fin, s.id + " Wegpunkt außerhalb der freien Wege " + l.map(v => v.toFixed(2)));
    });
    const e = loc(...r[r.length - 1]); assert.ok(Math.hypot(e[0] - s.lx, e[1] - s.lz) < 0.8, "Standpunkt nah am Sitz");
  });
});
test("Weg heraus beginnt am Sitz und endet am Tor außerhalb des gesperrten Platzes", () => {
  C.slots.forEach(s => {
    const r = C.routeOut(s.x, s.z), g = C.gate();
    assert.ok(Math.hypot(r[0][0] - s.x, r[0][1] - s.z) < 0.02);
    assert.ok(Math.hypot(r[r.length - 1][0] - g[0], r[r.length - 1][1] - g[1]) < 0.02);
    assert.ok(!C.blockedW(g[0], g[1]), "Tor liegt frei");
    dens(r, 0.1).forEach(([x, z]) => { const l = loc(x, z); const rr = Math.hypot(l[0], l[1]); assert.ok(rr > 1.44, s.id + " heraus: zu nah am Feuer"); });
  });
});
test("Bogen führt auf dem kürzeren Weg (höchstens 180° um das Feuer)", () => {
  C.slots.forEach(s => { const r = C.routeIn(s); let tot = 0; for (let i = 1; i < r.length; i++) tot += Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); assert.ok(tot < 8.2 + 1.5 * Math.PI + 1.6, s.id + " " + tot.toFixed(1)); });
});
test("Gesperrter Platz: Feuer, Sofas, Wände innen gesperrt; Gelände davor frei", () => {
  assert.ok(C.blockedW(C.CX, C.CZ)); assert.ok(C.blockedW(...C.slots[0] && [C.slots[0].x, C.slots[0].z]));
  const f = C.gate(); assert.ok(!C.blockedW(f[0], f[1]));
});

/* Gespräch: 10 Minuten Spielzeit bei 10 Bildern/s */
const sim = () => {
  C.talkReset(); const ids = C.slots.map(s => s.id), st = { sp: [], nod: 0, shk: 0, ges: 0, yawMin: 9, yawMax: -9, tgSp: 0, tgAll: 0 };
  let last = null, t0 = 0, prevNod = {}, prevShk = {}; const dur = [];
  for (let k = 0; k < 6000; k++) {
    const time = k * 0.1; C.talkStep(0.1, time, ids);
    const sp = ids.find(i => C.talkOf(i).speaking) || null;
    if (sp !== last) { if (last !== undefined && k) dur.push(time - t0); t0 = time; last = sp; st.sp.push(sp); }
    ids.forEach(i => { const g = C.talkOf(i); st.yawMin = Math.min(st.yawMin, g.yaw); st.yawMax = Math.max(st.yawMax, g.yaw);
      if (Math.abs(g.nod) > 0.05 && !prevNod[i]) st.nod++; prevNod[i] = Math.abs(g.nod) > 0.05;
      if (Math.abs(g.shk) > 0.05 && !prevShk[i]) st.shk++; prevShk[i] = Math.abs(g.shk) > 0.05;
      if (g.ges > 0.1) st.ges++; });
  }
  st.dur = dur; return st;
};
test("Gespräch: Sprecher wechselt unregelmäßig (Dauer streut), kein fester Takt", () => {
  const st = sim(), d = st.dur.filter(x => x > 0), mean = d.reduce((a, b) => a + b, 0) / d.length, sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) * (b - mean), 0) / d.length);
  assert.ok(d.length > 40, "Wechsel " + d.length); assert.ok(sd > 0.8, "Streuung " + sd.toFixed(2));
  assert.ok(new Set(st.sp.filter(Boolean)).size === 9, "alle kommen irgendwann dran");
});
test("Gespräch: Köpfe drehen sich beiderseits (links und rechts), bleiben im Nackenbereich, es wird genickt und selten geschüttelt", () => {
  const st = sim();
  assert.ok(st.yawMin < -0.4 && st.yawMax > 0.4, st.yawMin + " " + st.yawMax);
  assert.ok(st.yawMin >= -1.12 && st.yawMax <= 1.12);
  assert.ok(st.nod > 40, "Nicken " + st.nod); assert.ok(st.shk >= 3 && st.shk < st.nod / 4, "Nick " + st.nod + " Schütt " + st.shk); assert.ok(st.shk < st.nod / 4, "Schütteln " + st.shk);
  assert.ok(st.ges > 100, "Gesten " + st.ges);
});
test("Gespräch: Zuhörer schauen überwiegend zum Sprecher", () => {
  C.talkReset(); const ids = C.slots.map(s => s.id); let on = 0, all = 0;
  for (let k = 0; k < 6000; k++) { C.talkStep(0.1, k * 0.1, ids); const sp = ids.find(i => C.talkOf(i).speaking); if (!sp) continue; ids.forEach(i => { if (i === sp) return; all++; if (C.talkOf(i).tg === sp) on++; }); }
  assert.ok(on / all > 0.5 && on / all < 0.9, "Anteil " + (on / all).toFixed(2));
});
console.log(n + " Tests bestanden");
