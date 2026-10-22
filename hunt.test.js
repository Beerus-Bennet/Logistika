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
const P0 = { x: 0, y: 0, z: 0, ry: 0, s: 1, hrx: -0.3, hry: 0, legs: [0, 0, 0, 0] };

test("Hirsch breitseits: Lunge, Herz, Weichschuss, Lauf, Kopf, vorbei", () => {
  assert.strictEqual(shoot(P0, 0.98, 0.2).zone, "lunge");
  assert.strictEqual(shoot(P0, 0.86, 0.3).zone, "herz");
  assert.strictEqual(shoot(P0, 0.96, -0.32).zone, "koerper");
  assert.strictEqual(shoot(P0, 0.3, 0.34).zone, "lauf");
  const hc = H.rot([0, 0.46, 0.4], -0.3, 0, 0), head = [0, 1.0 + hc[1], 0.42 + hc[2]];
  assert.strictEqual(shoot(P0, head[1], head[2]).zone, "kopf");
  assert.strictEqual(shoot(P0, 2.2, 0), null);
  assert.strictEqual(shoot(P0, 0.96, 1.4), null);
});
test("verschoben, gedreht, größer: Strahl durch die Lunge bleibt kritisch, hinten bleibt Weichschuss", () => {
  const pose = { x: 10, y: 0, z: -5, ry: 1.2, s: 1.1, hrx: -0.3, hry: 0, legs: [0.3, -0.3, -0.3, 0.3] };
  const W = l => { const p = H.rot(l.map(v => v * pose.s), 0, pose.ry, 0); return [pose.x + p[0], p[1], pose.z + p[2]]; };
  const side = H.rot([1, 0, 0], 0, pose.ry, 0);                         /* Flanke des Tiers */
  const ray = c => { const o = [c[0] + side[0] * 6, c[1], c[2] + side[2] * 6]; return H.zoneHit("hirsch", pose, o, [-side[0], 0, -side[2]]); };
  assert.ok(["lunge", "herz"].includes(ray(W([0, 0.94, 0.26])).zone));
  assert.strictEqual(ray(W([0, 0.96, -0.34])).zone, "koerper");
  assert.ok(ray(W([0, 0.96, -0.34])).t > 4 && ray(W([0, 0.96, -0.34])).t < 6.1, "Abstand stimmt");
});
test("Keiler und Fasan: kritische Zonen, Vogel stets Treffer im Flug", () => {
  const pose = { x: 0, y: 0, z: 0, ry: 0, s: 1, hrx: 0, hry: 0, legs: [0, 0, 0, 0] };
  assert.ok(["lunge", "herz"].includes(shoot(pose, 0.5, 0.2, "keiler").zone));
  assert.strictEqual(shoot(pose, 0.53, -0.3, "keiler").zone, "koerper");
  assert.strictEqual(shoot(pose, 0.24, -0.02, "fasan").zone, "vogel");
});
test("Medaillen: Güte entscheidet, Weichschuss höchstens Silber, Laufschuss Bronze", () => {
  assert.strictEqual(H.medalOf(0.95, "lunge"), 4);
  assert.strictEqual(H.medalOf(0.8, "herz"), 3);
  assert.strictEqual(H.medalOf(0.55, "kopf"), 2);
  assert.strictEqual(H.medalOf(0.3, "herz"), 1);
  assert.strictEqual(H.medalOf(0.95, "koerper"), 2);
  assert.strictEqual(H.medalOf(0.95, "lauf"), 1);
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
test("Ich-Kamera: aus den Kamerawerten ergibt sich genau das Auge auf dem Hochsitz", () => {
  [[0.3, -0.2], [-2.8, 0.1], [1.4, -0.6]].forEach(([th, ph]) => {
    const c = H.camLook(H.EYEP, th, ph, 0.9);
    const cp = Math.cos(c.pitch), eye = [c.tx + Math.cos(c.yaw) * cp * c.dist, c.ty + Math.sin(c.pitch) * c.dist, c.tz + Math.sin(c.yaw) * cp * c.dist];
    eye.forEach((v, i) => assert.ok(Math.abs(v - H.EYEP[i]) < 1e-9));
  });
});
console.log(n + " Tests bestanden");
