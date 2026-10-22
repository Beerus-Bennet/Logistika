/* Tests für forest.js (reine Logik, ohne Engine):  node tests/forest.test.js */
const assert = require("assert");
const BUSH = require("../bushes.js");
const FOREST = require("../forest.js");
const rngOf = seed => { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
let n = 0; const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };

/* Mock-Welt 240 × 240: links Laubwald (Buche/Eiche/Birke, einige alte), rechts Nadelwald, ein Weg (z = 120), ein Teich, drei Lichtungen */
const CL = [{ x: 60, z: 60, r: 6 }, { x: 70, z: 180, r: 7 }, { x: 180, z: 70, r: 5 }];
const mkTrees = seed => {
  const r = rngOf(seed), o = [];
  for (let i = 0; i < 240 * 240 * 0.07; i++) {
    const x = r() * 240, z = r() * 240;
    if (CL.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 0.5) || Math.abs(z - 120) < 2.5) continue;
    if (r() > (x < 120 ? 1 : 0.6)) continue;
    const sp = x > 120 ? (r() < 0.7 ? "fichte" : "kiefer") : ["buche", "eiche", "birke"][Math.floor(r() * 3)];
    o.push({ x, z, sp, s: x < 120 && r() < 0.12 ? 1.6 + r() * 0.5 : 0.9 + r() * 0.6 });
  }
  return o;
};
const TREES = mkTrees(11);
const POND = [150, 190, 9];
const world = {
  area: { x0: 0, z0: 0, x1: 240, z1: 240 },
  inForest: () => true, forestK: () => 1,
  ok: (x, z, r) => x > 3 && x < 237 && z > 3 && z < 237 && Math.abs(z - 120) > 1.2 + r && Math.hypot(x - POND[0], z - POND[1]) > POND[2] + r && CL.every(c => Math.hypot(x - c.x, z - c.z) > 1.5 + r),
  wayGap: (x, z) => Math.abs(z - 120) - 1.2,
  wet: (x, z) => Math.hypot(x - POND[0], z - POND[1]) < POND[2] + 6 ? 1 : 0,
  clearings: CL, rocks: [[30, 30, 1.2], [31.5, 31, 0.9]]
};
const bushWorld = { area: world.area, inForest: world.inForest, ok: world.ok, clearings: CL };
const genBushes = seed => BUSH.generate(Object.assign({ rng: rngOf(seed), seed, obstacles: TREES.map(t => [t.x, t.z, 0.3]), trunks: TREES.map(t => [t.x, t.z, 0.45]),
  feat: (x, z) => ({ rho: 0.7, edge: 0.2, conifer: x > 120 ? 1 : 0, path: Math.max(0, 1 - Math.abs(z - 120) / 5), clearing: 0, rock: 0, water: 0 }) }, bushWorld)).instances;
const BUSHES = genBushes(5);
const dims = b => { const T = BUSH.BY_ID[b.typeId]; return { r: (T.w[0] + T.w[1]) / 4 * b.scale[0], h: (T.h[0] + T.h[1]) / 2 * b.scale[1] }; };
const run = seed => {
  const plan = FOREST.plan(Object.assign({ seed, trees: TREES }, world));
  return FOREST.generate(Object.assign({ seed, trees: TREES, bushes: BUSHES, dims, plan }, world));
};
const G = run(7331);
const near = (list, x, z, rad) => list.filter(t => Math.hypot(t.x - x, t.z - z) < rad);

test("Erzeugung liefert Flecken, Dinge, besondere Orte und Entdeckungen", () => {
  assert.ok(G.patches.length > 200 && G.items.length > 200, G.patches.length + " / " + G.items.length);
  assert.ok(G.places.length >= 8, "Orte " + G.places.length);
  assert.ok(G.disc.length >= 5, "Entdeckungen " + G.disc.length);
});
test("deterministisch: gleicher Seed → byte-gleiches Ergebnis", () => {
  const strip = r => JSON.stringify(Object.assign({}, r, { stats: Object.assign({}, r.stats, { ms: 0 }) }));      /* ms = Rechenzeit, nicht Inhalt */
  const a = strip(run(7331)), b = strip(run(7331));
  assert.strictEqual(a, b);
});
test("der Seed wählt die Komposition: vier Seeds → vier verschiedene Charaktere mit unterschiedlicher Bodenmischung", () => {
  const R = [0, 1, 2, 3].map(s => run(7000 + s));
  assert.strictEqual(new Set(R.map(r => r.comp.name)).size, 4);
  const share = r => { const p = r.stats.patches, t = Object.values(p).reduce((a, b) => a + b, 0); return JSON.stringify(Object.keys(p).sort().map(k => Math.round(p[k] / t * 20))); };
  assert.ok(new Set(R.map(share)).size >= 3, "Mischungen " + R.map(share).join(" "));
});
test("kein Waldboden und keine Dinge auf Wegen, Teich, Lichtungsmitte (dort nur der helle Lichtboden selbst) oder Felsen", () => {
  const bad = [...G.patches.filter(p => p.k !== "glade"), ...G.items].filter(o => Math.abs(o.z - 120) < 1.0 || Math.hypot(o.x - POND[0], o.z - POND[1]) < POND[2] - 0.5 || CL.some(c => Math.hypot(o.x - c.x, o.z - c.z) < c.r * 0.3));
  assert.strictEqual(bad.length, 0, "Verstöße " + bad.length);
  const rk = G.items.filter(i => i.k !== "stone" && world.rocks.some(r => Math.hypot(i.x - r[0], i.z - r[1]) < r[2] * 0.6));
  assert.strictEqual(rk.length, 0, "Dinge in Felsen " + rk.length);
});
test("nichts steckt in Baumstämmen", () => {
  const hits = G.items.filter(i => i.k !== "roots" && i.k !== "stump" && TREES.some(t => Math.hypot(t.x - i.x, t.z - i.z) < 0.28));
  assert.strictEqual(hits.length, 0, "in Stämmen " + hits.length);
});
test("ohne freie Fläche entsteht nichts (kein Erzwingen)", () => {
  const E = FOREST.generate(Object.assign({}, { seed: 7331, trees: TREES, bushes: BUSHES, dims, plan: { hidden: [], hollow: [] } }, world, { ok: () => false }));
  assert.strictEqual(E.items.length, 0);
  /* übrig bleiben nur Flecken, die an vorhandene Lichtungen und Entdeckungs-Büsche gebunden sind */
  assert.ok(E.patches.length <= E.places.length + E.disc.length * 2, E.patches.length + " Flecken");
});
test("Ökologie: Nadelboden unter Nadelbäumen, Laubschicht unter Laubbäumen", () => {
  const share = kind => { const P = G.patches.filter(p => p.k === kind); let c = 0, m = 0; P.forEach(p => { const t = near(TREES, p.x, p.z, 6); if (!t.length) return; m++; if (t.filter(q => q.sp === "fichte" || q.sp === "kiefer").length / t.length > 0.5) c++; }); return c / (m || 1); };
  assert.ok(share("needle") > 0.7, "Nadelboden unter Nadelbäumen " + share("needle").toFixed(2));
  assert.ok(share("leaf") < 0.35, "Laubschicht unter Nadelbäumen " + share("leaf").toFixed(2));
});
test("Ökologie: rote Pilze vor allem im Nadelwald; Blumen im Licht, nicht im Dickicht", () => {
  const red = G.items.filter(i => i.k === "mush" && i.mk === "red"), fl = G.items.filter(i => i.k === "flowers");
  assert.ok(red.length > 20 && fl.length > 20);
  const cs = red.filter(i => { const t = near(TREES, i.x, i.z, 6); return t.length && t.filter(q => q.sp === "fichte" || q.sp === "kiefer").length / t.length > 0.5; }).length / red.length;
  assert.ok(cs > 0.6, "rote Pilze im Nadelwald " + cs.toFixed(2));
  const dens = list => list.reduce((s, i) => s + near(TREES, i.x, i.z, 4).length, 0) / list.length;
  assert.ok(dens(fl) < dens(G.items) * 0.8, "Blumen " + dens(fl).toFixed(1) + " gegen alle " + dens(G.items).toFixed(1));
});
test("Moos liegt im Schatten und an feuchten Stellen, Lichtboden (glade) dort, wo es offen ist", () => {
  const d = k => { const P = G.patches.filter(p => p.k === k); return P.reduce((s, p) => s + near(TREES, p.x, p.z, 5).length, 0) / (P.length || 1); };
  assert.ok(d("glade") < d("moss") * 0.8, "glade " + d("glade").toFixed(1) + " moos " + d("moss").toFixed(1));
  const wetShare = A => A.filter(p => world.wet(p.x, p.z) > 0).length / (A.length || 1);
  const dampW = wetShare(G.patches.filter(p => p.k === "damp")), allW = wetShare(G.patches.filter(p => p.k !== "damp"));
  assert.ok(dampW > allW * 1.6, "feuchter Boden nahe Wasser: " + dampW.toFixed(3) + " gegen übrige " + allW.toFixed(3));
});
test("Entdeckungen: Obergrenzen eingehalten, nur an passenden Bussarten, die meisten Büsche bleiben normal", () => {
  const c = {}; G.disc.forEach(D => { c[D.type] = (c[D.type] || 0) + 1; });
  Object.keys(FOREST.DISC).forEach(k => assert.ok((c[k] || 0) <= FOREST.DISC[k].max, k + " " + c[k]));
  assert.ok(G.disc.length < BUSHES.length * 0.08, "Entdeckungen " + G.disc.length + " von " + BUSHES.length + " Büschen");
  G.disc.forEach(D => { const T = FOREST.DISC[D.type]; if (T.types) assert.ok(T.types.includes(BUSHES[D.bush].typeId), D.type + " an " + BUSHES[D.bush].typeId); });
});
test("mindestens ein Versteck für ein kleines Waldtier (Igel im Busch), mit Blickrichtung", () => {
  const H = G.disc.filter(D => D.type === "hedgehog");
  assert.ok(H.length >= 1, "kein Igel");
  H.forEach(D => assert.ok(typeof D.face === "number" && D.r >= 0.4));
});
test("Büsche werden nur dort verändert, wo eine Entdeckung oder ein Ort es verlangt", () => {
  const m = Object.keys(G.bushMods.scale).length;
  assert.ok(m > 0 && m < BUSHES.length * 0.1, "veränderte Büsche " + m);
  Object.values(G.bushMods.scale).forEach(s => assert.ok(s[0] >= 1 && s[0] <= 1.9 && s[1] >= 1 && s[1] <= 1.9, "Skalierung " + s));
});
test("Muster vermeiden: Flecken unterschiedlich groß, Dinge nicht auf einem Raster", () => {
  const rs = G.patches.map(p => p.r), m = rs.reduce((a, b) => a + b, 0) / rs.length, cv = Math.sqrt(rs.reduce((s, x) => s + (x - m) ** 2, 0) / rs.length) / m;
  assert.ok(cv > 0.2, "Variation der Fleckengröße " + cv.toFixed(2));
  const rots = new Set(G.items.map(i => Math.round((i.ry || 0) * 4))); assert.ok(rots.size > 15, "Drehungen " + rots.size);
  const mod = G.items.map(i => Math.round(((i.x % 2) + 2) % 2 * 4)); assert.ok(new Set(mod).size > 6, "Rasterlage");
  /* keine zwei Flecken derselben Bodenart direkt aufeinander */
  let stack = 0; for (let i = 0; i < G.patches.length; i += 5) { const p = G.patches[i]; if (G.patches.some(q => q !== p && q.k === p.k && Math.hypot(q.x - p.x, q.z - p.z) < Math.min(q.r, p.r) * 0.35)) stack++; }
  assert.ok(stack < G.patches.length / 5 * 0.1, "übereinander " + stack);
});
test("Menge bleibt begrenzt (Mobil): Dinge je 100 m² im Wald", () => {
  const per = G.items.length / (240 * 240) * 100;
  assert.ok(per < 22, "Dinge je 100 m² " + per.toFixed(1));
});
test("Rechenzeit der Erzeugung (240 × 240) unter 3 s", () => {
  const t0 = Date.now(); run(4242); const ms = Date.now() - t0; assert.ok(ms < 3000, ms + " ms");
});
console.log("\n" + n + " Tests bestanden");
