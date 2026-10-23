/* Tests für die Jagd (v107): node tests/hunt.test.js
   Trefferzonen (Strahl gegen Kugel/Ellipsoid in Tierkoordinaten), Medaillen und Deckel, Preise, Lichtung, Kamera. */
const assert = require("assert");
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
let n = 0; const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };
let seed = 7; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const M = Object.create(Math); M.random = rand;
const ctx = { console, Math: M, Object, Array, JSON, Map, Set, Float32Array, Uint8Array, Int32Array, Date };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "hunt.js"), "utf8") + "\n;this.HUNT = HUNT;", ctx, { filename: "hunt.js" });
const H = ctx.HUNT;
const shoot = (pose, y, z, k) => H.zoneHit(k || "hirsch", pose, [6, y, z], [-1, 0, 0]);       /* von der Seite (+x), Tier schaut nach +z */
const P0 = { x: 0, y: 0, z: 0, ry: 0, s: 1, nrx: -0.35, nry: 0, hrx: 0.2, legs: [[0, 0], [0, 0], [0, 0], [0, 0]] };

test("Hirsch breitseits: Lunge, Herz, Weichschuss, Lauf, Kopf, vorbei", () => {
  assert.strictEqual(shoot(P0, 1.0, 0.18).zone, "lunge");
  assert.strictEqual(shoot(P0, 0.88, 0.28).zone, "herz");
  assert.strictEqual(shoot(P0, 0.98, -0.32).zone, "koerper");
  assert.strictEqual(shoot(P0, 0.3, 0.34).zone, "lauf");
  const S0 = H.SP.hirsch, hp = H.rot([0, 0, 0.18], P0.hrx, 0, 0), np = H.rot([S0.headP[0] + hp[0], S0.headP[1] + hp[1], S0.headP[2] + hp[2]], P0.nrx, 0, 0);
  const head = [0, S0.neckP[1] + np[1], S0.neckP[2] + np[2]];
  assert.strictEqual(shoot(P0, head[1], head[2]).zone, "kopf");
  assert.strictEqual(shoot(P0, 2.4, 0), null);
  assert.strictEqual(shoot(P0, 0.98, 1.6), null);
});
test("Lauf mit gebeugtem Knie: Treffer am Unterlauf zählt als Laufschuss", () => {
  const pose = Object.assign({}, P0, { legs: [[-0.4, 0.9], [0, 0], [0, 0], [0, 0]] });
  const L = H.SP.hirsch.legs[0], up = H.rot([0, -L.lu, 0], -0.4, 0, 0), lo = H.rot([0, -L.ll * 0.5, 0], 0.9, 0, 0), knee = [L.h[0] + up[0], L.h[1] + up[1], L.h[2] + up[2]];
  const p = H.rot([0, -L.lu + lo[1], lo[2]], -0.4, 0, 0), foot = [L.h[0] + p[0], L.h[1] + p[1], L.h[2] + p[2]];
  const r = H.zoneHit("hirsch", pose, [6, foot[1], foot[2]], [-1, 0, 0]);
  assert.ok(r && r.zone === "lauf", JSON.stringify(r) + " " + knee.map(v => v.toFixed(2)));
});
test("verschoben, gedreht, größer: Strahl durch die Lunge bleibt kritisch, hinten bleibt Weichschuss", () => {
  const pose = { x: 10, y: 0, z: -5, ry: 1.2, s: 1.1, nrx: -0.35, nry: 0, hrx: 0.2, legs: [[0.3, 0.2], [-0.3, 0], [-0.3, 0], [0.3, 0.2]] };
  const W = l => { const p = H.rot(l.map(v => v * pose.s), 0, pose.ry, 0); return [pose.x + p[0], p[1], pose.z + p[2]]; };
  const side = H.rot([1, 0, 0], 0, pose.ry, 0);                         /* Flanke des Tiers */
  const ray = c => { const o = [c[0] + side[0] * 6, c[1], c[2] + side[2] * 6]; return H.zoneHit("hirsch", pose, o, [-side[0], 0, -side[2]]); };
  assert.ok(["lunge", "herz"].includes(ray(W([0, 0.96, 0.24])).zone));
  assert.strictEqual(ray(W([0, 0.98, -0.34])).zone, "koerper");
  assert.ok(ray(W([0, 0.98, -0.34])).t > 4 && ray(W([0, 0.98, -0.34])).t < 6.1, "Abstand stimmt");
});
test("Keiler und Fasan: kritische Zonen, Vogel stets Treffer im Flug", () => {
  const pose = { x: 0, y: 0, z: 0, ry: 0, s: 1, nrx: 0, nry: 0, hrx: 0, legs: [[0, 0], [0, 0], [0, 0], [0, 0]] };
  assert.ok(["lunge", "herz"].includes(shoot(pose, 0.5, 0.2, "keiler").zone));
  assert.strictEqual(shoot(pose, 0.53, -0.3, "keiler").zone, "koerper");
  assert.strictEqual(shoot(pose, 0.24, -0.02, "fasan").zone, "vogel");
});
test("Medaillen streng: nur Herz/Lunge/Kopf/Träger erlegen, Kopf höchstens Silber, Träger höchstens Gold", () => {
  assert.strictEqual(H.medalOf(0.95, "lunge"), 4);
  assert.strictEqual(H.medalOf(0.86, "herz"), 4);
  assert.strictEqual(H.medalOf(0.86, "lunge"), 3);
  assert.strictEqual(H.medalOf(0.95, "kopf"), 2);
  assert.strictEqual(H.medalOf(0.95, "hals"), 3);
  assert.strictEqual(H.medalOf(0.3, "herz"), 1);
  assert.strictEqual(H.medalOf(0.95, "koerper"), 0);
  assert.strictEqual(H.medalOf(0.95, "lauf"), 0);
  assert.ok(!H.ZONE.koerper.kill && !H.ZONE.lauf.kill && H.ZONE.herz.kill && H.ZONE.lunge.kill);
  for (let s = 0; s <= 1; s += 0.05) assert.ok(H.medalOf(s, "lunge") >= H.medalOf(Math.max(0, s - 0.05), "lunge"));
});
test("Preise steigen mit der Medaille, Diamant bringt mindestens das Zehnfache von Bronze", () => {
  Object.keys(H.PRICE).forEach(k => { const p = H.PRICE[k]; for (let m = 2; m <= 4; m++) assert.ok(p[m] > p[m - 1], k); assert.ok(p[4] >= p[1] * 10, k); });
});
test("Güte und Merkmale: 0 … 1, Hirsch mit geraden Enden 6 … 16", () => {
  let sum = 0;
  for (let i = 0; i < 2000; i++) { const s = H.drawScore(); assert.ok(s >= 0 && s <= 1); sum += s; const T = H.traits("hirsch", s); assert.ok(T.P % 2 === 0 && T.P >= 6 && T.P <= 16); }
  const avg = sum / 2000; assert.ok(avg > 0.5 && avg < 0.65, "Mittel " + avg.toFixed(3));
  assert.ok(/Ender Geweih/.test(H.traits("hirsch", 0.9).troph));
  assert.ok(/cm/.test(H.traits("keiler", 0.5).troph) && /Fasanenfeder/.test(H.traits("fasan", 0.8).troph));
});
test("Lichtung frei, Hochsitz am Rand, weit weg kein Einfluss", () => {
  assert.ok(H.clear(H.CX, H.CZ, "bg") && H.clear(H.CX, H.CZ, "tree") && H.clear(H.CX + 5, H.CZ - 3, "bush"));
  assert.ok(H.clear(H.TW.x, H.TW.z, "bg"));
  assert.ok(!H.clear(H.CX + 40, H.CZ, "bg") && !H.clear(H.CX, H.CZ - 30, "tree"));
  const d = Math.hypot(H.TW.x - H.CX, H.TW.z - H.CZ);
  assert.ok(d > H.CR * 0.95 && d < H.CR * 1.35, "Hochsitz am Wiesenrand " + d.toFixed(1));
  assert.ok(H.EYEP[1] > 5.5 && H.EYEP[1] < 6.5);
});
test("Revier: weit außerhalb der Karte, Wild 150–240 m vom Hochsitz, im Feld", () => {
  assert.ok(H.RV.x < -300, "außerhalb der Karte");
  const r = (() => { let s = 3; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  for (let i = 0; i < 300; i++) {
    const p = H.spawnPoint(r, false), m = Math.hypot(p[0] - H.EYER[0], p[1] - H.EYER[2]) * H.M_PER_U;
    assert.ok(m >= 150 && m <= 242, "Entfernung " + m.toFixed(0)); assert.ok(H.fieldE(p[0], p[1]) < 0.88);
    const q = H.spawnPoint(r, true); assert.ok(H.fieldE(q[0], q[1]) > 1.0, "kommt vom Waldrand"); assert.ok(H.fieldE(q[2], q[3]) < 0.88);
  }
  assert.ok(H.fieldE(H.EYER[0], H.EYER[2]) > 0.98, "Hochsitz am Feldrand");
});
test("Wind: Seitenwind versetzt, Rückenwind nicht; Haltepunkte gegen den Wind", () => {
  const aim = Math.PI;                                                 /* Blick nach Westen */
  assert.ok(Math.abs(H.windDrift(5, aim, aim)) < 1e-9, "Rückenwind");
  const d = H.windDrift(5, aim + Math.PI / 2, aim);                     /* Wind von der Seite */
  assert.ok(Math.abs(d) > 0.0025 && Math.abs(d) < 0.0035, d);
  assert.ok(Math.sign(H.holdDots(d)) === -Math.sign(d), "gegen die Abdrift halten");
  assert.ok(Math.abs(H.holdDots(d)) > 1 && Math.abs(H.holdDots(d)) < 2);
});
test("Ich-Kamera: aus den Kamerawerten ergibt sich genau das Auge auf dem Hochsitz", () => {
  [[0.3, -0.2], [-2.8, 0.1], [1.4, -0.6]].forEach(([th, ph]) => {
    [H.EYEP, H.EYER].forEach(E => {
      const c = H.camLook(E, th, ph, 0.9);
      const cp = Math.cos(c.pitch), eye = [c.tx + Math.cos(c.yaw) * cp * c.dist, c.ty + Math.sin(c.pitch) * c.dist, c.tz + Math.sin(c.yaw) * cp * c.dist];
      eye.forEach((v, i) => assert.ok(Math.abs(v - E[i]) < 1e-9));
    });
  });
});
test("Baumaterial: nur vorhandene Holzsorten aus Wald und Sägewerk", () => {
  assert.deepStrictEqual(Object.keys(H.NEED).sort(), ["aeste", "balken", "bretter", "kiefer", "pfosten"]);
  Object.values(H.NEED).forEach(n => assert.ok(n > 0 && n <= 10));
});
test("Wiesenwild: Wiese ↔ Revier – gleicher Winkel zum Hochsitz, Rückweg trifft den Ausgangspunkt, im Feld", () => {
  const aCT = Math.atan2(H.TW.z - H.CZ, H.TW.x - H.CX);
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, d = H.CR * (0.05 + (i % 7) * 0.1), x = H.CX + Math.cos(a) * d, z = H.CZ + Math.sin(a) * d;
    const [rx, rz] = H.toRv(x, z), [bx, bz] = H.fromRv(rx, rz);
    assert.ok(H.fieldE(rx, rz) <= 0.801, "im Feld");
    assert.ok(Math.hypot(rx - H.EYER[0], rz - H.EYER[2]) * H.M_PER_U >= 100, "weit genug weg vom Hochsitz");
    assert.ok(Math.hypot(bx - x, bz - z) < 0.01, "Rückweg " + Math.hypot(bx - x, bz - z));
  }
  /* ein Tier auf der Hochsitz-Seite der Wiese steht im Revier nah am Hochsitz, eines auf der Gegenseite weit weg */
  const near = H.toRv(H.CX + Math.cos(aCT) * 8, H.CZ + Math.sin(aCT) * 8), far = H.toRv(H.CX - Math.cos(aCT) * 8, H.CZ - Math.sin(aCT) * 8);
  const dn = Math.hypot(near[0] - H.EYER[0], near[1] - H.EYER[2]), df = Math.hypot(far[0] - H.EYER[0], far[1] - H.EYER[2]);
  assert.ok(dn < df, "nah " + dn.toFixed(0) + " < fern " + df.toFixed(0));
});
test("Nahsicht-Bäume (v117): fünf Arten, Höhe wie das Standardmodell, keine NaN, Dreiecksbudget, Kirsche bleibt Standard", () => {
  const C2 = { console, Math, Object, Array, JSON, Map, Set, Float32Array, Uint8Array, Uint16Array, Int32Array, Date, performance: { now: () => Date.now() }, navigator: { userAgent: "node" }, localStorage: { getItem: () => null, setItem() {} } };
  C2.window = C2; C2.self = C2; vm.createContext(C2);
  vm.runInContext("function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }", C2);
  ["gl3d.js", "farmmodels.js", "woodmodels.js"].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8") + "\n;this.__l = 1;", C2, { filename: f }));
  vm.runInContext("this.FWM = FWM;", C2);
  const W = C2.FWM, top = b => { let m = 0; for (let i = 1; i < b.v.length; i += 9) m = Math.max(m, b.v[i]); return m; };
  ["kiefer", "fichte", "buche", "eiche", "birke"].forEach(sp => [2, 3, 4].forEach(sz => {
    const a = W.tree(sp, sz, 1), r = W.treeRv(sp, sz, 1);
    assert.ok(r.v.length % 27 === 0, sp + " ganze Dreiecke");
    for (let i = 0; i < r.v.length; i++) if (!Number.isFinite(r.v[i])) assert.fail(sp + sz + " NaN bei " + i);
    const tris = r.v.length / 27;
    assert.ok(tris > 3 * a.v.length / 27 && tris < 7500, sp + sz + " Dreiecke " + tris);
    const ha = top(a), hr = top(r);
    assert.ok(Math.abs(hr - ha) < 0.2 * ha, sp + sz + " Höhe " + hr.toFixed(2) + " vs " + ha.toFixed(2));
    /* Licht-Normalen sind Einheitsvektoren */
    for (let i = 3; i < r.v.length; i += 9 * 37) { const l = Math.hypot(r.v[i], r.v[i + 1], r.v[i + 2]); assert.ok(Math.abs(l - 1) < 0.02, sp + " Normale " + l); }
  }));
  assert.ok(W.treeRv("kirsche", 2, 0).v.length === W.tree("kirsche", 2, 0).v.length, "Kirsche bleibt das Standardmodell");
});
test("Trophäen (v119): 12 Schilder, ganze Dreiecke, keine NaN, Stufen unterscheiden sich, Hirschgeweih wächst mit der Stufe", () => {
  const C3 = { console, Math, Object, Array, JSON, Map, Set, Float32Array, Uint8Array, Uint16Array, Int32Array, Date, performance: { now: () => Date.now() }, navigator: { userAgent: "node" }, localStorage: { getItem: () => null, setItem() {} } };
  C3.window = C3; C3.self = C3; vm.createContext(C3);
  vm.runInContext("function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); } var FITEMS = {};", C3);
  ["gl3d.js", "farmmodels.js", "woodmodels.js", "hunt.js"].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8") + "\n;this.__l = 1;", C3, { filename: f }));
  vm.runInContext("this.HUNT = HUNT;", C3);
  const HH = C3.HUNT, sizes = {};
  ["hirsch", "keiler", "fasan"].forEach(k => [1, 2, 3, 4].forEach(m => {
    const b = HH.trophyMesh(HH.trophyId(k, m));
    assert.ok(b.v.length % 27 === 0 && b.v.length > 0, k + m + " ganze Dreiecke");
    for (let i = 0; i < b.v.length; i++) if (!Number.isFinite(b.v[i])) assert.fail(k + m + " NaN bei " + i);
    sizes[k + m] = b.v.length / 27;
    assert.ok(sizes[k + m] > 150 && sizes[k + m] < 4000, k + m + " Dreiecke " + sizes[k + m]);
  }));
  assert.ok(sizes.hirsch4 > sizes.hirsch1, "mehr Enden bei höherer Stufe");
  assert.ok(sizes.hirsch1 !== sizes.keiler1 && sizes.keiler1 !== sizes.fasan1, "Arten verschieden");
});
console.log(n + " Tests bestanden");
