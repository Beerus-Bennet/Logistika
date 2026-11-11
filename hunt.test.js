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
test("Keiler und Fasan: kritische Zonen, Vogel-Körperzone ohne Aussage über den Flug", () => {
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
  assert.ok(/cm/.test(H.traits("keiler", 0.5).troph) && /Stoßlänge/.test(H.traits("fasan", 0.8).troph));
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
test("Trophäen (v119): 12 Ganzkörperpräparate, ganze Dreiecke, keine NaN, Stufen unterscheiden sich, Hirschgeweih wächst mit der Stufe", () => {
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
    assert.ok(sizes[k + m] > 150 && sizes[k + m] < 11000, k + m + " Dreiecke " + sizes[k + m]);          /* v328: Vollständige Tiere samt Sockel, höchstens 11 000 Dreiecke. */
  }));
  assert.ok(sizes.hirsch4 > sizes.hirsch1, "mehr Enden bei höherer Stufe");
  assert.ok(sizes.hirsch1 !== sizes.keiler1 && sizes.keiler1 !== sizes.fasan1, "Arten verschieden");
});
/* v135: neue Modelle (Keiler, Fasan) und Liegepose aus den Modellpunkten */
const C4 = { console, Math, Object, Array, JSON, Map, Set, Float32Array, Uint8Array, Uint16Array, Int32Array, Date, performance: { now: () => Date.now() }, navigator: { userAgent: "node" }, localStorage: { getItem: () => null, setItem() {} } };
C4.window = C4; C4.self = C4; vm.createContext(C4);
vm.runInContext("function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); } var FITEMS = {};", C4);
["gl3d.js", "farmmodels.js", "woodmodels.js", "hunt.js"].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8") + "\n;this.__l = 1;", C4, { filename: f }));
vm.runInContext("this.HUNT = HUNT;", C4);
const H4 = C4.HUNT, M4 = H4._m;
const whole = (b, name) => { assert.ok(b.v.length % 27 === 0 && b.v.length > 0, name + " ganze Dreiecke"); for (let i = 0; i < b.v.length; i++) if (!Number.isFinite(b.v[i])) assert.fail(name + " NaN bei " + i); return b.v.length / 27; };
/* v265: Schüsse von der Seite durch den sichtbaren Träger des Hirschs (Rasterpunkte der Silhouette) sind tödlich */
test("Träger v265: Schuss durch den sichtbaren Hals ist tödlich, nie Weichschuss", () => {
  const nk = (p, nrx) => { const r = H4.rot(p, nrx, 0, 0), S0 = H4.SP.hirsch; return [S0.neckP[0] + r[0], S0.neckP[1] + r[1], S0.neckP[2] + r[2]]; };
  const mb = M4.deerNeck(), V = []; for (let i = 0; i < mb.v.length; i += 9) V.push([mb.v[i], mb.v[i + 1], mb.v[i + 2]]);
  const B = H4.SP.hirsch.body, outside = p => (p[0] / B.r[0]) ** 2 + ((p[1] - B.c[1]) / B.r[1]) ** 2 + ((p[2] - B.c[2]) / B.r[2]) ** 2 > 1;   /* Halsansatz im Rumpf ist unsichtbar */
  [-0.35, 0, 0.6].forEach(nrx => {
    const pose = { x: 0, y: 0, z: 0, ry: 0, s: 1, nrx, nry: 0, hrx: 0.2, legs: [[0, 0], [0, 0], [0, 0], [0, 0]] };
    const P = V.map(p => nk(p, nrx)).filter(outside); let y0 = 9, y1 = -9, z0 = 9, z1 = -9;
    P.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]); });
    let n = 0, kill = 0, soft = 0;
    for (let y = y0; y <= y1; y += 0.02) for (let z = z0; z <= z1; z += 0.02) {
      if (!P.some(p => Math.abs(p[1] - y) < 0.018 && Math.abs(p[2] - z) < 0.018)) continue;
      const r = H4.zoneHit("hirsch", pose, [6, y, z], [-1, 0, 0]); n++;
      if (r && H4.ZONE[r.zone].kill) kill++; if (r && r.zone === "koerper") soft++;
    }
    assert.ok(kill / n >= 0.88, "tödlich " + Math.round(kill / n * 100) + " % bei nrx " + nrx);
    assert.strictEqual(soft, 0, "Weichschuss am Hals bei nrx " + nrx);
  });
  /* Kehle (vorn am Hals) und Stich (Brustansatz vor dem Blatt) */
  const P0 = { x: 0, y: 0, z: 0, ry: 0, s: 1, nrx: -0.35, nry: 0, hrx: 0.2, legs: [[0, 0], [0, 0], [0, 0], [0, 0]] };
  const throat = nk([0, 0.25, 0.2], -0.35), stich = nk([0, -0.12, 0.08], -0.35);
  assert.strictEqual(H4.zoneHit("hirsch", P0, [6, throat[1], throat[2]], [-1, 0, 0]).zone, "hals");
  assert.ok(H4.ZONE[H4.zoneHit("hirsch", P0, [6, stich[1], stich[2]], [-1, 0, 0]).zone].kill, "Stich");
  /* Keiler: Stich unter dem Träger tödlich, Keule bleibt Weichschuss */
  const PK = { x: 0, y: 0, z: 0, ry: 0, s: 1, nrx: -0.55, nry: 0, hrx: 0, legs: [[0, 0], [0, 0], [0, 0], [0, 0]] };
  assert.strictEqual(H4.zoneHit("keiler", PK, [6, 0.42, 0.45], [-1, 0, 0]).zone, "hals");
  assert.strictEqual(H4.zoneHit("keiler", PK, [6, 0.55, -0.3], [-1, 0, 0]).zone, "koerper");
});
test("Modelle v135: Keiler und Fasan ganz, ohne NaN, im Budget", () => {
  const T = { boarBody: whole(M4.boarBody(), "boarBody"), boarHead: whole(M4.boarHead(0.6, 18), "boarHead"), boarUpperV: whole(M4.boarUpper(true), "boarUpper"), boarUpperH: whole(M4.boarUpper(false), "boarUpperH"),
    boarLower: whole(M4.boarLower(), "boarLower"), boarLeg: whole(M4.boarLeg(true), "boarLeg"), phBody: whole(M4.phBody(), "phBody"), phHead: whole(M4.phHead(), "phHead"), phLeg: whole(M4.phLeg(), "phLeg") };
  const one = T.boarBody + T.boarHead + 2 * (T.boarUpperV + T.boarUpperH) + 4 * T.boarLower;
  assert.ok(one < 9000, "Keiler gesamt " + one);
  assert.ok(T.phBody + T.phHead + 2 * T.phLeg < 4800, "Fasan gesamt");          /* v350: befiederte Schenkel (+56 Dreiecke je Ständer) */
});
test("Keiler v135: Waffen wachsen mit den gespeicherten Zentimetern", () => {
  /* gleiche Eckenzahl – es unterscheiden sich nur die Waffen; deren Ausdehnung muss mit den Zentimetern wachsen */
  const a = M4.boarHead(0.6, 8).v, b = M4.boarHead(0.6, 24).v, pa = [], pb = [];
  assert.strictEqual(a.length, b.length, "gleiche Bauweise");
  for (let i = 0; i < a.length; i += 9) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 1e-7) { pa.push([a[i], a[i + 1], a[i + 2]]); pb.push([b[i], b[i + 1], b[i + 2]]); }
  const diag = P => { const mn = [9, 9, 9], mx = [-9, -9, -9]; P.forEach(p => { for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); } }); return Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]); };
  assert.ok(pa.length > 20, "Waffen-Ecken " + pa.length);
  assert.ok(diag(pb) > diag(pa) * 1.15, "24 cm größer als 8 cm: " + diag(pb).toFixed(3) + " / " + diag(pa).toFixed(3));
});
test("Liegepose v262/v350: Boden, Gelenkgrenzen, keine Durchdringung, Haupt liegt auf, immer gleich – alle Arten, alle Liegeformen, beide Seiten, klein und groß", () => {
  const forms = { keiler: new Set(), hirsch: new Set(), fasan: new Set() };
  ["keiler", "hirsch", "fasan"].forEach(k => [-1, 1].forEach(side => [0.1, 0.5, 0.95].forEach(sc => [0, 77, 4242, 90001, 5, 31, 123, 999].forEach(g => {
    const gn = H4.genes(k, sc, g), S0 = H4.SP[k];
    const A = { k, side, ry: 0.7, s: S0.s0 + (S0.s1 - S0.s0) * sc, score: sc, g, gn, T: H4.traits(k, sc, gn), vr: g % 6 };
    const B = Object.assign({}, A), d = H4._dead(A), d2 = H4._dead(B), c = H4._poseCheck(A), tag = k + " " + side + " " + sc + " g" + g + " [" + d.variant + "]";
    forms[k].add(d.variant); assert.strictEqual(d.variant, d2.variant, tag + " gleiche Liegeform");
    assert.ok(Math.abs(d.mn[1]) < 0.012, tag + " tiefster Punkt " + d.mn[1].toFixed(3));
    d.pts.forEach(p => assert.ok(p[1] > -0.008 * A.s, tag + " Punkt unter dem Boden " + p[1].toFixed(3)));
    assert.ok(d.mx[1] < (k === "hirsch" ? 1.9 : k === "keiler" ? 0.7 : 0.6), tag + " liegt flach (Höhe " + d.mx[1].toFixed(2) + ")");
    assert.strictEqual(JSON.stringify(d.legs), JSON.stringify(d2.legs), tag + " gleiche Pose");
    assert.strictEqual(JSON.stringify([d.neckT, d.nz, d.hz, d.headT]), JSON.stringify([d2.neckT, d2.nz, d2.hz, d2.headT]), tag + " gleiches Haupt");
    /* Läufe: Gelenke in ihren Grenzen (Vorderfußwurzel nur nach hinten, Sprunggelenk nur nach vorn), Spreizung begrenzt, nicht alle gleich */
    d.legs.forEach((l, i) => {
      const L = S0.legs[i], lim = c.lim[L.f ? "f" : "h"];
      assert.ok(l[0] >= lim[0][0] - 1e-9 && l[0] <= lim[0][1] + 1e-9 && l[1] >= lim[1][0] - 1e-9 && l[1] <= lim[1][1] + 1e-9, tag + " Gelenk " + i + " " + l);
      assert.ok(Math.abs(l[2]) <= 1.2 + 1e-9, tag + " Spreizung " + l[2]);          /* v350: über die Seite gerollt (rueck) bis 1,2 */
    });
    if (d.legs.length) assert.ok(new Set(d.legs.map(l => l[0].toFixed(2) + "/" + l[1].toFixed(2))).size === 4, tag + " vier verschiedene Winkel");
    /* keine Durchdringung: Lauf ↔ Boden, Lauf ↔ Lauf, Lauf ↔ Rumpf (mit denselben Abtastpunkten nachgemessen) */
    if (d.legs.length) {
      assert.ok(c.ground > -0.012 * A.s, tag + " Lauf im Boden " + c.ground.toFixed(3));
      assert.ok(c.legLeg < 0.012, tag + " Lauf in Lauf " + c.legLeg.toFixed(3));
      assert.ok(c.legBody < 0.012, tag + " Lauf im Rumpf " + c.legBody.toFixed(3));
    }
    /* Haupt: keine Durchdringung; liegt auf – beim Hirsch darf das Geweih tragen, dann höchstens eine Handbreit angehoben */
    assert.ok(d.head.pen < 0.004, tag + " Haupt/Geweih durchdringt " + d.head.pen.toFixed(4));
    assert.ok(d.head.gap < (d.head.carried ? 0.13 : 0.03) * A.s, tag + " Haupt schwebt " + d.head.gap.toFixed(3) + (d.head.carried ? " (Geweih trägt)" : ""));
    /* v350: Ständer in den Grenzen der jeweiligen Liegeform; offene Schwingen liegen auf, nicht im Boden */
    if (k === "fasan") { const FL = c.feetLim; d.feet.forEach(f => assert.ok(f[0] >= FL[0][0] - 1e-9 && f[0] <= FL[0][1] + 1e-9 && f[1] >= FL[1][0] - 1e-9 && f[1] <= FL[1][1] + 1e-9, tag + " Ständer " + f)); }
    if (d.wings) d.wings.forEach(w => { if (w) assert.ok(Math.abs(w.rz) <= 1.9 + 1e-9 && w.sx > 0.5, tag + " Schwinge " + JSON.stringify(w)); });
  }))));
  assert.strictEqual(forms.keiler.size, 5, "Keiler: fünf Liegeformen " + [...forms.keiler]); assert.strictEqual(forms.hirsch.size, 5, "Hirsch: fünf Liegeformen " + [...forms.hirsch]);
  assert.strictEqual(forms.fasan.size, 4, "Fasan: vier Liegeformen " + [...forms.fasan]);
});
test("Trefferbild v350: Schusskanal nennt die getroffenen Organe, passt zur Wertung, Wirkung und Schussbericht stimmen", () => {
  const P = k => ({ x: 0, y: 0, z: 0, ry: 0, s: 1, nrx: k === "hirsch" ? -0.35 : 0, nry: 0, hrx: 0, legs: [[0, 0], [0, 0], [0, 0], [0, 0]] });
  const rec = (k, y, z) => { const o = [6, y, z], d = [-1, 0, 0], h = H4.zoneHit(k, P(k), o, d); return h && H4._shotRec(k, P(k), o, d, h, 160, { tf: 0.2, drift: 0.05, wv: 3 }); };
  const ids = r => r.org.map(o => o.id);
  /* Hirsch breitseits durch die Lunge: beide Flügel, lebenswichtig, 100 % */
  let r = rec("hirsch", 1.0, 0.18); assert.strictEqual(r.zone, "lunge");
  assert.ok(ids(r).includes("lungeL") && ids(r).includes("lungeR"), "beide Lungenflügel " + ids(r)); assert.strictEqual(r.org[0].id, "decke"); assert.strictEqual(r.dmg, 100);
  /* Herz: Wertung und Liste stimmen überein */
  r = rec("hirsch", 0.88, 0.28); assert.strictEqual(r.zone, "herz"); assert.ok(ids(r).includes("herz"));
  /* Weichschuss hinten: Gescheide, keine lebenswichtigen Organe, Wirkung unter 100 % */
  r = rec("hirsch", 0.92, -0.36); assert.strictEqual(r.zone, "koerper"); assert.ok(ids(r).includes("darm")); assert.ok(!r.org.some(o => o.v), "nichts Lebenswichtiges"); assert.ok(r.dmg < 100 && r.dmg >= 30);
  /* Lauf und Haupt: Knochen */
  r = rec("hirsch", 0.3, 0.34); assert.strictEqual(r.zone, "lauf"); assert.strictEqual(ids(r).join(), "lauf"); assert.strictEqual(r.dmg, 20);
  /* Keiler und Fasan */
  r = rec("keiler", 0.5, 0.2); assert.ok(["lunge", "herz"].includes(r.zone)); assert.ok(r.org.some(o => o.v));
  r = rec("fasan", 0.24, -0.02); assert.strictEqual(r.zone, "vogel"); assert.strictEqual(r.org[0].n, "Federkleid und Muskel"); assert.strictEqual(r.dmg, 100);
  /* Schussbericht: Geschwindigkeit sinkt mit der Entfernung, Energie plausibel (Büchse: 2 000 … 4 000 J) */
  assert.ok(r.v < 820 && r.v > 600 && r.e > 2000 && r.e < 4000, r.v + " m/s, " + r.e + " J");
  /* Strahl in Tierkoordinaten: gedrehtes, verschobenes, größeres Stück ergibt denselben Kanal */
  const p2 = Object.assign(P("hirsch"), { x: 4, z: -3, ry: 1.1, s: 1.1 }), W = l => { const q = H4.rot(l.map(v => v * 1.1), 0, 1.1, 0); return [4 + q[0], q[1], -3 + q[2]]; };
  const o2 = W([6, 1.0, 0.18]), t2 = W([0, 1.0, 0.18]), d2 = [t2[0] - o2[0], t2[1] - o2[1], t2[2] - o2[2]].map(v => v / (6 * 1.1)), h2 = H4.zoneHit("hirsch", p2, o2, d2), r2 = H4._shotRec("hirsch", p2, o2, d2, h2, 160, {});
  assert.strictEqual(h2.zone, "lunge"); assert.ok(Math.abs(r2.lo[0] - 6) < 1e-6 && Math.abs(r2.lo[1] - 1.0) < 1e-6 && Math.abs(r2.ld[0] + 1) < 1e-6, "Strahl " + r2.lo + " " + r2.ld);
  /* jedes Organ liegt im Rumpf seiner Art */
  ["hirsch", "keiler", "fasan"].forEach(k => H4.ORG[k].forEach(O => { if (!O.b) assert.ok(H4._inTorso(k, O.c, 0) > 0, k + " " + O.id + " liegt im Rumpf"); }));
});
test("Geweih v262: Name und Modell zählen dieselben Enden (auch ungerade, doppelte Augsprosse, abnorme Sprosse)", () => {
  const Fs = [{}, { extra: -1 }, { extra: 1 }, { aug: -1 }, { aug: 1 }, { abn: -1 }, { abn: 1 }];
  for (let P = 6; P <= 16; P += 2) Fs.forEach(F => {
    const sides = H4._antSides(P, F), built = H4._antEnds(P, 0.6, 2, F);
    assert.deepStrictEqual(Array.from(sides), Array.from(built), "P " + P + " " + JSON.stringify(F) + " Modell " + built + " gezählt " + sides);
  });
  /* Name aus den Merkmalen: gleiche Stangen → „N-Ender Geweih“, sonst „Ungerader N-Ender“ mit der stärkeren Stange doppelt */
  for (let g = 0; g < 4000; g += 7) [0.3, 0.6, 0.9].forEach(sc => {
    const gn = H4.genes("hirsch", sc, g), T = H4.traits("hirsch", sc, gn), sd = H4._antSides(T.P, H4._antF(gn));
    assert.strictEqual(T.Pl, 2 * Math.max(sd[0], sd[1]), "Enden " + T.troph);
    assert.strictEqual(T.odd, sd[0] !== sd[1], "ungerade " + T.troph);
    assert.ok(T.odd ? /^Ungerader \d+-Ender$/.test(T.troph) : /^\d+-Ender Geweih$/.test(T.troph), T.troph);
  });
});
test("Artenwahl v307: 40 % Hirsch, 28 % Keiler, 32 % Fasan (12 000 feste Ziehungen); Flugtimer und Grenzen", () => {
  let s = 99; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const n = { hirsch: 0, keiler: 0, fasan: 0 }, N = 12000;
  for (let i = 0; i < N; i++) n[H4.pickSpecies(r)]++;
  const W = H4.SPECIES_W, tot = W.hirsch + W.keiler + W.fasan;
  Object.keys(n).forEach(k => assert.ok(Math.abs(n[k] / N - W[k] / tot) < 0.012, k + " " + (n[k] / N * 100).toFixed(1) + " %"));
  assert.deepStrictEqual([W.hirsch, W.keiler, W.fasan], [40, 28, 32]);
  assert.deepStrictEqual(Array.from(H4.FLY_FIRST), [25, 45]); assert.deepStrictEqual(Array.from(H4.FLY_NEXT), [45, 75]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(H4.LIMIT)), { ground: 2, fly: 1, total: 3 });
});
console.log(n + " Tests bestanden");
