/* =========================================================================
   LOGISTIKA – forest.js   (v91)
   Waldboden, Waldökologie, besondere Orte und Entdeckungen im Wald der großen Welt.
   Reine Logik – kennt weder Engine noch Welt: die Welt reicht Bäume, Büsche, Lichtungen und
   Prüffunktionen herein (worldview.js, worldForest). Dadurch läuft das Modul auch in Node
   (Tests: tests/forest.test.js). Alles ist seedbasiert und reproduzierbar.

   Ablauf
     plan()      vor den Büschen: wählt versteckte Lichtungen und Senken (Bäume werden dort entnommen)
     generate()  nach den Büschen: Bodenflecken, Bodendetails, besondere Orte, Büsche mit Überraschungen

   Ökologie statt Streuung: aus den Bäumen und Büschen werden je Punkt Merkmale berechnet
     shade    Schatten (Baumdichte im Umkreis)        moist  Feuchte (Rauschen + Wassernähe + Schatten)
     conif    Nadelbäume in der Nähe                   broad  Laubbäume in der Nähe
     oldB     Nähe zu einem alten Laubbaum             open   Offenheit (Lichtung, lockerer Bestand)
   Daraus ergeben sich Eignungen je Bodenart (Moos, feuchter Boden, Laub, Nadeln, Erde, Lichtungsgras);
   jedes Bodenstück bringt passende Dinge mit (Moos: Polster, Farn · Laub: Zweige, Pilze · Nadeln: rote Pilze …),
   so entstehen Zusammenhänge statt Dekoration. Vier Waldkompositionen (nach Seed) setzen andere
   Gewichte und örtliche Schwerpunkte.
   ========================================================================= */
const FOREST = (() => {
  "use strict";
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const h2 = (i, j, s) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
  const vnoise = (x, z, s) => {
    const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return lerp(lerp(h2(i, j, s), h2(i + 1, j, s), u), lerp(h2(i, j + 1, s), h2(i + 1, j + 1, s), u), v);
  };
  const hash = (a, b, s) => h2(a * 1.7 + 0.3, b * 1.3 + 0.7, s);

  /* ---- Bodenarten: Radius (min, max), Farben (Mitte) ---- */
  const PATCH = {
    moss:   { r: [0.9, 2.6], cols: [0x4c8632, 0x55913a, 0x5e9a3c], y: 0 },
    damp:   { r: [0.9, 2.2], cols: [0x3b6a3c, 0x44743f, 0x35603a], y: 1 },
    leaf:   { r: [0.8, 2.2], cols: [0x9c8a3e, 0x8f7434, 0x7e6330], y: 2 },
    needle: { r: [0.9, 2.4], cols: [0x6e5c3a, 0x7a6640, 0x624f34], y: 3 },
    earth:  { r: [0.8, 1.5], cols: [0x84674a, 0x76593e, 0x8e6f50], y: 4 },
    glade:  { r: [1.0, 2.8], cols: [0x8ec052, 0x86b84c, 0x97c75a], y: 5 }
  };
  /* Laubfarben (einzelne Blätter auf der Laubschicht): gelb, rostbraun, dunkelbraun */
  const LEAF_COLS = [0xd2a93e, 0xb4682c, 0x8a5430, 0x6c4a2c];
  /* Kompositionen: Gewichte je Bodenart, Zahl besonderer Orte, Schwerpunkte */
  const COMP = [
    { name: "Moosgrund",      moss: 1.35, damp: 1.15, leaf: 0.8,  needle: 0.8,  earth: 0.8,  glade: 0.9,  nOld: 7, nLog: 6, nHollow: 3, nHidden: 2, nField: 4, nBig: 3, nSun: 2, disc: 0.12 },
    { name: "Laubwald",       moss: 0.9,  damp: 0.8,  leaf: 1.4,  needle: 0.6,  earth: 0.9,  glade: 0.9,  nOld: 9, nLog: 5, nHollow: 2, nHidden: 2, nField: 3, nBig: 3, nSun: 2, disc: 0.12 },
    { name: "Nadelhang",      moss: 0.9,  damp: 0.8,  leaf: 0.6,  needle: 1.45, earth: 1.0,  glade: 0.8,  nOld: 6, nLog: 6, nHollow: 2, nHidden: 2, nField: 3, nBig: 2, nSun: 2, disc: 0.1 },
    { name: "Lichtungswald",  moss: 1.0,  damp: 0.9,  leaf: 0.9,  needle: 0.8,  earth: 0.8,  glade: 1.4,  nOld: 7, nLog: 5, nHollow: 3, nHidden: 3, nField: 4, nBig: 3, nSun: 3, disc: 0.12 }
  ];
  const PATCH_KINDS = ["moss", "damp", "leaf", "needle", "earth", "glade"];
  const FLOWER_COLS = 4;                 /* weiß, gelb, violett, rosa (FWM.flowers) */

  /* Abstandsgitter für Kreise [x, z, r] */
  class Grid {
    constructor(c) { this.c = c || 3; this.m = new Map(); }
    add(x, z, r, tag) { const k = (Math.floor(x / this.c) + 2048) * 8192 + Math.floor(z / this.c) + 2048; let a = this.m.get(k); if (!a) this.m.set(k, a = []); a.push([x, z, r, tag]); }
    some(x, z, rad, fn) {
      const c = this.c, i0 = Math.floor((x - rad) / c), i1 = Math.floor((x + rad) / c), j0 = Math.floor((z - rad) / c), j1 = Math.floor((z + rad) / c);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a = this.m.get((i + 2048) * 8192 + j + 2048); if (a) for (const o of a) if (fn(o)) return true; }
      return false;
    }
  }
  const mkRng = seed => { let a = (seed >>> 0) + 0x9E3779B9; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const isConif = sp => sp === "fichte" || sp === "kiefer";
  const isBroad = sp => !isConif(sp);
  /* alter Laubbaum: Eiche/Buche ab Maßstab 1,45, sonst nur sehr große */
  const isOldB = t => isBroad(t.sp) && ((t.sp === "eiche" || t.sp === "buche") ? (t.s || 1) >= 1.45 : (t.s || 1) >= 1.95);

  /* Tabelle der Entdeckungen an Büschen */
  const DISC = {
    hedgehog: { max: 6,  types: ["spreading_shrub", "evergreen_shrub", "round_shrub"], shade: [0.4, 1.2] },
    berries:  { max: 8,  types: ["round_shrub", "young_shrub", "spreading_shrub", "evergreen_shrub"], open: [0.3, 1] },
    nest:     { max: 5,  types: ["round_shrub", "young_shrub", "spreading_shrub", "seasonal_shrub"] },
    tracks:   { max: 6,  types: null },
    dense:    { max: 6,  types: ["evergreen_shrub", "round_shrub", "spreading_shrub"], shade: [0.55, 1.3] },
    litter:   { max: 8,  types: ["round_shrub", "young_shrub", "seasonal_shrub", "spreading_shrub"], broad: 0.4 },
    gap:      { max: 4,  types: ["round_shrub", "young_shrub", "spreading_shrub"] }
  };

  /* ------------------------------------------------------------------------------------------------
     Standortmerkmale – gemeinsam für plan() und generate()
     ------------------------------------------------------------------------------------------------ */
  function makeFeat(o, seed) {
    const trees = o.trees, bushes = o.bushes || [], dims = o.dims || (() => ({ r: 0.5, h: 0.5 }));
    const HC = 4, th = new Map(), bh = new Map();
    trees.forEach((t, i) => { const k = (Math.floor(t.x / HC) + 2048) * 8192 + Math.floor(t.z / HC) + 2048; (th.get(k) || th.set(k, []).get(k)).push(i); });
    bushes.forEach((b, i) => { const k = (Math.floor(b.position[0] / HC) + 2048) * 8192 + Math.floor(b.position[2] / HC) + 2048; (bh.get(k) || bh.set(k, []).get(k)).push(i); });
    const each = (map, x, z, rad, fn) => {
      const i0 = Math.floor((x - rad) / HC), i1 = Math.floor((x + rad) / HC), j0 = Math.floor((z - rad) / HC), j1 = Math.floor((z + rad) / HC);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const L = map.get((i + 2048) * 8192 + j + 2048); if (L) for (const n of L) fn(n); }
    };
    const REF = 0.084, PI = Math.PI, bR = bushes.map(b => dims(b).r);
    const feat = (x, z) => {
      let n = 0, nc = 0, nb = 0, od = 1e9, odc = 1e9, tn = 1e9;
      each(th, x, z, 5, i => {
        const t = trees[i], d = Math.hypot(t.x - x, t.z - z);
        if (d > 4.6) { return; }
        const w = (t.s || 1) * (1 - d / 5.2);
        n++; if (isConif(t.sp)) nc += w; else nb += w;
        if (isOldB(t) && d < od) od = d;
        if (isConif(t.sp) && (t.s || 1) >= 1.7 && d < odc) odc = d;
        if (d < tn) tn = d;
      });
      let bd = 1e9, bn = 0;
      each(bh, x, z, 3, i => { const b = bushes[i], d = Math.hypot(b.position[0] - x, b.position[2] - z) - bR[i]; if (d < bd) bd = d; if (d < 1.2) bn++; });
      const f = o.forestK(x, z), rho = n / (PI * 4.6 * 4.6 * REF);
      const shade = clamp01(0.88 * rho + 0.12 * f);
      const wet = o.wet ? o.wet(x, z) : 0;
      const moist = clamp01(0.55 * vnoise(x / 30, z / 30, seed + 1) + 0.3 * vnoise(x / 11, z / 11, seed + 2) + 0.5 * wet + 0.18 * shade - 0.08);
      const tot = nc + nb + 1e-6;
      return {
        f, rho, shade, moist, wet, conif: clamp01(nc / tot * clamp01(tot / 1.4)), broad: clamp01(nb / tot * clamp01(tot / 1.4)),
        oldB: clamp01(1 - od / 5), oldDist: od, oldC: clamp01(1 - odc / 5), open: clamp01(1 - shade) * clamp01(f * 1.4),
        gap: o.wayGap ? o.wayGap(x, z) : 20, bushD: bd, bushN: bn, treeD: tn, edge: clamp01((0.75 - f) / 0.5)
      };
    };
    return { feat, each, th, bh, trees, bushes, dims, bR };
  }

  /* ------------------------------------------------------------------------------------------------
     plan(): versteckte Lichtungen und Senken – brauchen freie Fläche, die Bäume dort werden entnommen
     opts: rng, seed, area, trees, inForest, ok, forestK, wayGap, clearings [{x,z,r}] (vorhandene)
     Rückgabe: { hidden: [{x,z,r}], hollow: [{x,z,r}], comp }
     ------------------------------------------------------------------------------------------------ */
  function plan(o) {
    const seed = o.seed | 0, comp = COMP[((seed % COMP.length) + COMP.length) % COMP.length], rng = mkRng(seed * 31 + 7);
    const F = makeFeat(o, seed), A = o.area, cand = [];
    for (let x = A.x0 + 3; x < A.x1 - 3; x += 3) for (let z = A.z0 + 3; z < A.z1 - 3; z += 3) {
      const px = x + (rng() - 0.5) * 2, pz = z + (rng() - 0.5) * 2;
      if (o.forestK(px, pz) < 0.85 || !o.ok(px, pz, 4.2)) continue;
      const g = o.wayGap(px, pz);
      if (g < 6 || g > 22) continue;
      const f = F.feat(px, pz);
      if (f.rho < 0.7) continue;
      cand.push({ x: px, z: pz, w: rng(), moist: f.moist });
    }
    const taken = (o.clearings || []).map(c => [c.x, c.z, c.r]), out = { hidden: [], hollow: [], comp };
    const pick = (n, key, rad, minD, sortBy) => {
      cand.sort((a, b) => sortBy(b) - sortBy(a) || a.x - b.x);
      for (const c of cand) {
        if (out[key].length >= n) break;
        if (taken.some(t => Math.hypot(t[0] - c.x, t[1] - c.z) < minD + t[2])) continue;
        const r = rad * (0.9 + 0.25 * hash(c.x, c.z, seed + 11));
        out[key].push({ x: +c.x.toFixed(2), z: +c.z.toFixed(2), r: +r.toFixed(2) }); taken.push([c.x, c.z, r]);
      }
    };
    pick(comp.nHidden, "hidden", 2.9, 16, c => c.w);
    pick(comp.nHollow, "hollow", 2.4, 14, c => c.moist * 0.8 + c.w * 0.5);
    return out;
  }

  /* ------------------------------------------------------------------------------------------------
     generate()
     opts.rng, opts.seed, opts.area {x0,z0,x1,z1}
          .trees   [{x,z,sp,s}]        alle Bäume (Kulisse + Hof) · .bushes [Instanzen aus BUSH.generate] · .dims(b) → {r, h}
          .inForest(x,z) · .forestK(x,z) · .ok(x,z,r) · .wayGap(x,z) · .wet(x,z) (0…1 Wassernähe)
          .clearings [{x,z,r,explicit?,kind?}]  · .rocks [[x,z,r]] · .plan (Ergebnis von plan())
     Rückgabe: { patches, items, places, disc, bushMods, stats }
     ------------------------------------------------------------------------------------------------ */
  function generate(o) {
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const seed = o.seed | 0, comp = COMP[((seed % COMP.length) + COMP.length) % COMP.length], rng = mkRng(seed * 131 + 3);
    const A = o.area, F = makeFeat(o, seed), feat = F.feat, trees = o.trees, bushes = o.bushes || [], dims = F.dims;
    const R = (a, b) => a + (b - a) * rng();
    const patches = [], items = [], places = [], disc = [], bushMods = { scale: {}, extra: [], tint: {} };
    const pg = new Grid(3), prot = [];                 /* Flecken · geschützte Kreise besonderer Orte */
    const itemG = new Grid(2);
    const gap = o.wayGap, forestK = o.forestK, ok = o.ok;
    const clearings = o.clearings || [], rocks = o.rocks || [], plan0 = o.plan || { hidden: [], hollow: [] };
    const rockD = (x, z) => { let d = 1e9; for (const r of rocks) d = Math.min(d, Math.hypot(x - r[0], z - r[1]) - r[2]); return d; };
    const clearD = (x, z) => { let d = 1e9; for (const c of clearings) d = Math.min(d, Math.hypot(x - c.x, z - c.z) - c.r); return d; };
    let composing = true;                              /* beim Aufbau besonderer Orte gilt der Schutzkreis nicht für den Ort selbst */
    const protectedAt = (x, z) => !composing && prot.some(p => Math.hypot(x - p[0], z - p[1]) < p[2]);

    /* Gewichte je Boden: örtliche Schwerpunkte (je Komposition 4 Stellen im Wald, ein Boden wird dort verstärkt) */
    const focus = [];
    for (let i = 0, tries = 0; i < 5 && tries < 200; tries++) {
      const x = R(A.x0, A.x1), z = R(A.z0, A.z1);
      if (o.forestK(x, z) < 0.8) continue;
      focus.push({ x, z, r: R(14, 26), kind: PATCH_KINDS[Math.floor(rng() * 5)] }); i++;
    }
    const focusK = (x, z, kind) => { let k = 1; for (const f of focus) if (f.kind === kind) { const d = Math.hypot(x - f.x, z - f.z); if (d < f.r) k = Math.max(k, 1 + 0.9 * (1 - d / f.r)); } return k; };

    /* freier Platz für ein Ding: Weg, Wasser, Hof (ok), Baumstämme, Büsche, geschützte Orte */
    const free = (x, z, r, trunkR) => {
      if (!ok(x, z, r)) return false;
      if (gap(x, z) < 1.05 + r) return false;
      if (protectedAt(x, z)) return false;
      if (rocks.length && rockD(x, z) < r * 0.5) return false;            /* nicht im Fels */
      let bad = false;
      F.each(F.th, x, z, 2.5, i => { const t = trees[i]; if (Math.hypot(t.x - x, t.z - z) < (trunkR == null ? 0.5 : trunkR) + 0.12 * (t.s || 1) + r) bad = true; });
      if (bad) return false;
      F.each(F.bh, x, z, 2.5, i => { const b = bushes[i], d = dims(b); if (Math.hypot(b.position[0] - x, b.position[2] - z) < d.r * 0.85 + r) bad = true; });
      if (bad) return false;
      return true;
    };
    const putItem = (k, x, z, extra, r, trunkR) => {
      if (!free(x, z, r == null ? 0.15 : r, trunkR)) return null;
      if (itemG.some(x, z, 0.35, p => Math.hypot(p[0] - x, p[1] - z) < 0.3 + (p[2] || 0))) return null;
      const it = Object.assign({ k, x: +x.toFixed(2), z: +z.toFixed(2), ry: +(rng() * 6.283).toFixed(2), s: 1, v: Math.floor(rng() * 3) }, extra || {});
      items.push(it); itemG.add(x, z, r == null ? 0.15 : r, k);
      return it;
    };
    const forceItem = (k, x, z, extra) => { const it = Object.assign({ k, x: +x.toFixed(2), z: +z.toFixed(2), ry: +(rng() * 6.283).toFixed(2), s: 1, v: Math.floor(rng() * 3) }, extra || {}); items.push(it); return it; };
    const addPatch = (k, x, z, r, extra) => {
      const p = Object.assign({ k, x: +x.toFixed(2), z: +z.toFixed(2), r: +r.toFixed(2), rot: +(rng() * 3.1416).toFixed(2), ecc: +(1 + 0.7 * Math.pow(rng(), 1.6)).toFixed(2), seed: Math.floor(rng() * 1e6), tone: +rng().toFixed(3) }, extra || {});
      patches.push(p); pg.add(x, z, r, k); return p;
    };
    const mushKind = (f) => f.conif > 0.45 ? (rng() < 0.7 ? "red" : "brown") : (f.broad > 0.4 ? (rng() < 0.55 ? "brown" : rng() < 0.5 ? "yellow" : "white") : (rng() < 0.5 ? "red" : "white"));
    const scatter = (cx, cz, rad, n, fn) => { for (let i = 0; i < n; i++) { const a = rng() * 6.283, d = Math.sqrt(rng()) * rad; fn(cx + Math.cos(a) * d, cz + Math.sin(a) * d, i); } };

    /* ============================= besondere Orte ============================= */
    const place = (type, x, z, r, extra) => { const p = Object.assign({ type, x: +x.toFixed(2), z: +z.toFixed(2), r: +r.toFixed(2) }, extra || {}); places.push(p); prot.push([x, z, r * 0.8]); return p; };
    const nearPlace = (x, z, d) => places.some(p => Math.hypot(p.x - x, p.z - z) < d);
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    /* --- versteckte Lichtungen (Bäume wurden vorher entnommen) --- */
    plan0.hidden.forEach((h, i) => {
      place("hidden", h.x, h.z, h.r, { idx: i });
      addPatch("glade", h.x, h.z, h.r * 0.95, { ecc: 1.15 });
      const fc = Math.floor(rng() * FLOWER_COLS);
      scatter(h.x, h.z, h.r * 0.75, 7, (x, z, k) => forceItem("flowers", x, z, { v: (fc + (k % 3 === 0 ? 1 : 0)) % FLOWER_COLS, s: R(0.9, 1.3) }));
      scatter(h.x, h.z, h.r * 0.9, 3, (x, z) => putItem("stone", x, z, { v: Math.floor(rng() * 3), s: R(0.6, 1.2), moss: rng() < 0.5 }, 0.3));
      scatter(h.x, h.z, h.r * 0.95, 2, (x, z) => putItem("mush", x, z, { mk: "white", n: 3 }, 0.2));
      if (rng() < 0.6) { const a = rng() * 6.283; forceItem("lost", h.x + Math.cos(a) * h.r * 0.35, h.z + Math.sin(a) * h.r * 0.35, { lk: ["lantern", "boot", "basket"][i % 3] }); }
    });
    /* --- moosige Senken --- */
    plan0.hollow.forEach((h, i) => {
      place("hollow", h.x, h.z, h.r * 1.4, { idx: i });
      addPatch("damp", h.x, h.z, h.r * 1.0, { ecc: 1.1 });
      addPatch("moss", h.x + 0.2, h.z - 0.2, h.r * 1.5, { ecc: 1.25 });
      scatter(h.x, h.z, h.r * 1.15, 3, (x, z) => putItem("stone", x, z, { v: Math.floor(rng() * 3), s: R(0.6, 1.1), moss: true }, 0.3));
      scatter(h.x, h.z, h.r * 1.45, 9, (x, z) => { const d = Math.hypot(x - h.x, z - h.z); if (d > h.r * 0.5) putItem("fern", x, z, { s: R(0.9, 1.45) }, 0.25); });
      scatter(h.x, h.z, h.r * 1.4, 4, (x, z) => putItem("stone", x, z, { v: Math.floor(rng() * 3), s: R(0.7, 1.5), moss: true }, 0.35));
      scatter(h.x, h.z, h.r * 1.2, 2, (x, z) => putItem("mush", x, z, { mk: "brown", n: 3 }, 0.2));
    });

    /* --- alte Bäume mit Wurzeln --- */
    {
      const cand = [];
      trees.forEach((t, i) => { if (!isOldB(t) || !ok(t.x, t.z, 1)) return; const g = gap(t.x, t.z); if (g < 3.2 || g > 22) return; cand.push({ i, w: rng() + (g < 12 ? 0.5 : 0) }); });
      cand.sort((a, b) => b.w - a.w || a.i - b.i);
      for (const c of cand) {
        if (places.filter(p => p.type === "old").length >= comp.nOld) break;
        const t = trees[c.i];
        if (nearPlace(t.x, t.z, 11)) continue;
        place("old", t.x, t.z, 3.2 * (t.s || 1) * 0.8 + 1.4, { sp: t.sp, s: t.s || 1, tree: c.i });
        forceItem("roots", t.x, t.z, { sp: t.sp, s: Math.min(1.7, 0.7 + 0.45 * (t.s || 1)), ry: +(rng() * 6.283).toFixed(2) });
        const rr = 1.6 + 0.9 * (t.s || 1);
        addPatch("leaf", t.x, t.z, rr * 1.15, { ecc: 1.05 });
        addPatch("moss", t.x + R(-1, 1), t.z + R(-1, 1), rr * 0.7, { ecc: 1.3 });
        scatter(t.x, t.z, rr, 3, (x, z) => putItem("stone", x, z, { v: Math.floor(rng() * 3), s: R(0.5, 1.1), moss: rng() < 0.6 }, 0.3));
        scatter(t.x, t.z, rr * 0.9, 3, (x, z) => putItem("mush", x, z, { mk: rng() < 0.6 ? "brown" : "yellow", n: 3 }, 0.2));
        scatter(t.x, t.z, rr * 1.1, 4, (x, z) => putItem("stick", x, z, { s: R(0.8, 1.4) }, 0.15));
      }
    }
    /* --- umgestürzte, bemooste Baumstämme --- */
    {
      const sites = []; for (let i = 0; i < 160; i++) { const x = R(A.x0, A.x1), z = R(A.z0, A.z1); if (o.forestK(x, z) < 0.8) continue; const f = feat(x, z); const g = f.gap; if (g < 3.5 || g > 18 || f.shade < 0.45) continue; sites.push({ x, z, f, w: f.moist + 0.5 * f.shade + rng() * 0.3 }); }
      sites.sort((a, b) => b.w - a.w || a.x - b.x);
      for (const s of sites) {
        if (places.filter(p => p.type === "log").length >= comp.nLog) break;
        if (nearPlace(s.x, s.z, 12)) continue;
        const ry = rng() * 6.283, L = 2.6, ca = Math.cos(ry), sa = Math.sin(ry);
        let good = true; for (let k = -1; k <= 1.001; k += 0.5) { if (!free(s.x + ca * L * 0.5 * k, s.z - sa * L * 0.5 * k, 0.45, 0.45)) good = false; }
        if (!good) continue;
        place("log", s.x, s.z, 2.4, { ry });
        forceItem("mosslog", s.x, s.z, { ry, v: Math.floor(rng() * 2) });
        addPatch("moss", s.x, s.z, 1.7, { ecc: 1.5, rot: +(ry % 3.1416).toFixed(2) });
        scatter(s.x, s.z, 1.9, 4, (x, z) => putItem("fern", x, z, { s: R(0.9, 1.4) }, 0.25));
        scatter(s.x, s.z, 1.6, 3, (x, z) => putItem("mush", x, z, { mk: mushKind(s.f), n: 3 }, 0.2, 0.3));
        scatter(s.x, s.z, 1.8, 2, (x, z) => putItem("bark", x, z, { s: R(0.8, 1.2) }, 0.2));
      }
    }
    /* --- Farn- und Pilzfeld um einen Stumpf --- */
    {
      const sites = []; for (let i = 0; i < 160; i++) { const x = R(A.x0, A.x1), z = R(A.z0, A.z1); if (o.forestK(x, z) < 0.8) continue; const f = feat(x, z); if (f.gap < 4 || f.gap > 20 || f.shade < 0.55) continue; sites.push({ x, z, f, w: f.moist + rng() * 0.3 }); }
      sites.sort((a, b) => b.w - a.w || a.x - b.x);
      for (const s of sites) {
        if (places.filter(p => p.type === "field").length >= comp.nField) break;
        if (nearPlace(s.x, s.z, 12) || !free(s.x, s.z, 0.5, 0.5)) continue;
        place("field", s.x, s.z, 3.0, {});
        forceItem("stump", s.x, s.z, { sp: s.f.conif > 0.5 ? "fichte" : "buche" });
        addPatch("damp", s.x, s.z, 2.4, { ecc: 1.15 });
        scatter(s.x, s.z, 2.6, 10, (x, z) => { if (Math.hypot(x - s.x, z - s.z) > 0.9) putItem("fern", x, z, { s: R(0.9, 1.5) }, 0.25); });
        scatter(s.x, s.z, 2.2, 6, (x, z) => { if (Math.hypot(x - s.x, z - s.z) > 0.6) putItem("mush", x, z, { mk: ["red", "brown", "yellow", "white"][Math.floor(rng() * 4)], n: 3 }, 0.2); });
      }
    }
    /* --- Sonnenplätze: Lichtungen mit Lichtschacht, Blumen und Faltern --- */
    {
      const cl = clearings.filter(c => !c.explicit && c.r >= 4.2 && c.kind !== "rock").sort((a, b) => b.r - a.r || a.x - b.x);
      const exp = clearings.filter(c => c.explicit);
      const list = exp.concat(cl);
      let n = 0;
      for (const c of list) {
        if (n >= comp.nSun) break;
        if (nearPlace(c.x, c.z, 14)) continue;
        n++; place("sun", c.x, c.z, Math.min(c.r, 6), { shaft: true });
        addPatch("glade", c.x + 0.4, c.z + 0.2, Math.min(c.r * 0.85, 4.6), { ecc: 1.2, warm: 1 });
        const fc = Math.floor(rng() * FLOWER_COLS);
        scatter(c.x, c.z, Math.min(c.r * 0.8, 4.4), 12, (x, z, k) => { if (Math.hypot(x - c.x, z - c.z) > 1.6) putItem("flowers", x, z, { v: (fc + (k % 4 === 0 ? 2 : 0)) % FLOWER_COLS, s: R(0.9, 1.35) }, 0.3); });
      }
    }
    /* --- ein ungewöhnlich großer Busch --- */
    {
      const cand = []; bushes.forEach((b, i) => { const t = b.typeId; if (t !== "round_shrub" && t !== "spreading_shrub" && t !== "young_shrub") return; const x = b.position[0], z = b.position[2]; const g = gap(x, z); if (g < 2.5 || g > 15) return; cand.push({ i, w: rng() }); });
      cand.sort((a, b) => b.w - a.w || a.i - b.i);
      let n = 0;
      for (const c of cand) {
        if (n >= comp.nBig) break;
        const b = bushes[c.i], x = b.position[0], z = b.position[2], d = dims(b), kx = R(1.5, 1.75), ky = R(1.25, 1.45), r2 = d.r * kx;
        if (nearPlace(x, z, 10) || !ok(x, z, r2) || gap(x, z) < 1.05 + r2) continue;
        let bad = false;
        F.each(F.th, x, z, r2 + 2.5, i => { const t = trees[i]; if (Math.hypot(t.x - x, t.z - z) < r2 * 0.9 + 0.5) bad = true; });
        F.each(F.bh, x, z, r2 + 2.5, i => { if (i === c.i) return; const q = bushes[i]; if (Math.hypot(q.position[0] - x, q.position[2] - z) < r2 * 0.8 + dims(q).r * 0.8) bad = true; });
        if (bad) continue;
        n++; bushMods.scale[c.i] = [kx, ky]; bushMods.tint[c.i] = 0.9;
        place("bigbush", x, z, r2 + 0.6, { bush: c.i });
        addPatch("earth", x, z, r2 * 0.9, { ecc: 1.1 });
        scatter(x, z, r2 + 0.6, 3, (px, pz) => { if (Math.hypot(px - x, pz - z) > r2 * 0.75) putItem("stick", px, pz, { s: R(0.7, 1.2) }, 0.15); });
      }
    }

    composing = false;
    /* ============================= Bodenflecken (Ökologie) ============================= */
    const step = 1.85, cov0 = seed * 0.37;
    const stats = { patches: {}, items: {}, kindsAtShade: {}, forestCells: 0, cells: 0 };
    PATCH_KINDS.forEach(k => stats.patches[k] = 0);
    for (let gx = A.x0; gx < A.x1; gx += step) for (let gz = A.z0; gz < A.z1; gz += step) {
      const x = gx + rng() * step, z = gz + rng() * step, r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng();
      stats.cells++;
      if (!o.inForest(x, z)) continue;
      stats.forestCells++;
      const f = feat(x, z);
      const cov = smooth(0.18, 0.55, 0.6 * vnoise(x / 20, z / 20, seed + 5 + cov0) + 0.4 * vnoise(x / 8, z / 8, seed + 6));
      const cd = clearD(x, z), rd = rockD(x, z);
      const sc = {
        moss: comp.moss * focusK(x, z, "moss") * smooth(0.28, 0.72, f.moist) * (0.35 + 0.65 * f.shade) * (f.conif > 0.65 ? 0.65 : 1) + 0.25 * clamp01(1 - rd / 4),
        damp: comp.damp * focusK(x, z, "damp") * smooth(0.5, 0.82, f.moist) * smooth(0.42, 0.85, f.shade) * (1 + 1.6 * f.wet),      /* am Wasser deutlich häufiger */
        leaf: comp.leaf * focusK(x, z, "leaf") * f.broad * (0.35 + 0.65 * f.oldB) * (0.45 + 0.55 * f.shade),
        needle: comp.needle * focusK(x, z, "needle") * f.conif * (0.5 + 0.5 * f.shade),
        earth: comp.earth * focusK(x, z, "earth") * 0.55 * (0.08 + 0.7 * clamp01(1 - f.bushD / 0.9) + 0.3 * clamp01(1 - (f.gap - 1) / 2.5) + 0.3 * clamp01(1 - rd / 3) + 0.2 * f.edge),
        glade: comp.glade * focusK(x, z, "glade") * (0.9 * clamp01(1 - cd / 2.2) + 0.7 * smooth(0.45, 0.85, f.open) * f.f)
      };
      let tot = 0; for (const k of PATCH_KINDS) { sc[k] = Math.pow(Math.max(0, sc[k]), 1.2); tot += sc[k]; }
      const pPlace = clamp01(tot * 0.95) * (0.25 + 0.75 * cov);
      if (r1 > pPlace) continue;
      let pick = r2 * tot, kind = "moss";
      for (const k of PATCH_KINDS) { pick -= sc[k]; if (pick <= 0) { kind = k; break; } }
      const P = PATCH[kind], strength = clamp01(sc[kind] / (kind === "earth" ? 0.5 : 1));
      const r = lerp(P.r[0], P.r[1], Math.pow(r3, 1.4) * (0.45 + 0.55 * strength)) * (0.85 + 0.3 * r4);
      if (!ok(x, z, r * 0.55) || (kind !== "earth" && f.gap < 0.95 + r * 0.3) || (kind === "earth" && f.gap < 1.0 + r * 0.2)) continue;
      if (pg.some(x, z, r + 2.5, p => p[3] === kind ? Math.hypot(p[0] - x, p[1] - z) < 0.55 * (r + p[2]) : Math.hypot(p[0] - x, p[1] - z) < 0.2 * (r + p[2]))) continue;
      const p = addPatch(kind, x, z, r);
      stats.patches[kind]++;
      /* was zu diesem Boden gehört */
      const near = (n, rad, fn) => scatter(x, z, rad, n, fn);
      if (kind === "moss") {
        if (rng() < 0.45 * f.shade) near(1 + (rng() < 0.4 ? 1 : 0), r * 0.8, (px, pz) => putItem("fern", px, pz, { s: R(0.85, 1.3) }, 0.25));
        if (rng() < 0.12) near(1, r * 0.8, (px, pz) => putItem("stone", px, pz, { v: Math.floor(rng() * 3), s: R(0.5, 1), moss: true }, 0.3));
        if (rng() < 0.12 * (0.5 + f.moist)) near(1, r * 0.8, (px, pz) => putItem("mush", px, pz, { mk: mushKind(f), n: 3 }, 0.2));
      } else if (kind === "damp") {
        near(1 + (rng() < 0.6 ? 1 : 0), r * 0.85, (px, pz) => putItem("fern", px, pz, { s: R(0.9, 1.4) }, 0.25));
        if (rng() < 0.3) near(1, r * 0.8, (px, pz) => putItem("mush", px, pz, { mk: mushKind(f), n: 3 }, 0.2));
        if (rng() < 0.3) near(1, r * 0.9, (px, pz) => putItem("stick", px, pz, { s: R(0.8, 1.3) }, 0.15));
        if (rng() < 0.15) near(1, r * 0.8, (px, pz) => putItem("stone", px, pz, { v: Math.floor(rng() * 3), s: R(0.5, 1), moss: true }, 0.3));
      } else if (kind === "leaf") {
        p.bits = Math.max(3, Math.round(r * 4.5));
        if (rng() < 0.4) near(1 + (rng() < 0.4 ? 1 : 0), r * 0.9, (px, pz) => putItem("stick", px, pz, { s: R(0.8, 1.4) }, 0.15));
        if (rng() < 0.13) near(1, r * 0.8, (px, pz) => putItem("mush", px, pz, { mk: "brown", n: 3 }, 0.2));
        if (f.oldB > 0.4 && rng() < 0.15) near(1, r * 0.8, (px, pz) => putItem("bark", px, pz, { s: R(0.8, 1.2) }, 0.2));
      } else if (kind === "needle") {
        if (rng() < 0.35) near(1 + (rng() < 0.3 ? 1 : 0), r * 0.9, (px, pz) => putItem("stick", px, pz, { s: R(0.8, 1.4) }, 0.15));
        if (rng() < 0.14) near(1, r * 0.8, (px, pz) => putItem("mush", px, pz, { mk: "red", n: 3 }, 0.2));
      } else if (kind === "earth") {
        if (rng() < 0.55) near(1 + (rng() < 0.4 ? 1 : 0), r * 0.9, (px, pz) => putItem("stone", px, pz, { v: Math.floor(rng() * 3), s: R(0.35, 0.7) }, 0.2));
        if (rng() < 0.3) near(1, r, (px, pz) => putItem("stick", px, pz, { s: R(0.7, 1.2) }, 0.15));
      } else if (kind === "glade") {
        const fc = Math.floor(rng() * FLOWER_COLS);
        near(2 + Math.floor(rng() * 4), r * 0.85, (px, pz, k) => putItem("flowers", px, pz, { v: rng() < 0.75 ? fc : Math.floor(rng() * FLOWER_COLS), s: R(0.85, 1.3) }, 0.3));
        if (rng() < 0.15) near(1, r * 0.8, (px, pz) => putItem("stone", px, pz, { v: Math.floor(rng() * 3), s: R(0.4, 0.8) }, 0.2));
      }
    }
    /* Boden-Spuren: Wegkanten bekommen gelegentlich Erde (Trampelstellen) – Büsche selbst sind Quelle von Erdflecken (oben) */

    /* ============================= Büsche mit Überraschungen ============================= */
    const cnt = {}, discPts = [];
    const discOk = (x, z, d) => !discPts.some(p => Math.hypot(p[0] - x, p[1] - z) < d);
    const order = bushes.map((b, i) => i); shuffle(order);
    const bflag = {};
    for (const i of order) {
      const b = bushes[i], T = b.typeId, x = b.position[0], z = b.position[2], d = dims(b);
      if (bushMods.scale[i] || bflag[i]) continue;
      if (rng() > comp.disc * 1.6) continue;
      const f = feat(x, z), vis = clamp01(1 - (f.gap - 2) / 16);
      if (f.gap < 2.0 || !discOk(x, z, 9)) continue;
      /* mögliche Arten nach Standort, gewichtet */
      const opts = [];
      const can = (k) => (cnt[k] || 0) < DISC[k].max && (!DISC[k].types || DISC[k].types.includes(T));
      if (can("hedgehog") && f.shade >= DISC.hedgehog.shade[0] && d.r >= 0.4 && f.gap < 16) opts.push(["hedgehog", 2.2 * vis + 0.6]);
      if (can("berries") && f.open >= 0.15 && f.shade < 0.9) opts.push(["berries", 1.0 + 0.5 * (f.edge + clamp01(1 - f.gap / 6))]);
      if (can("nest") && d.h >= 0.45 && f.shade < 1.0) opts.push(["nest", 0.8]);
      if (can("tracks")) opts.push(["tracks", 0.7 + 0.5 * vis]);
      if (can("dense") && f.shade >= DISC.dense.shade[0]) opts.push(["dense", 0.8]);
      if (can("litter") && f.broad >= DISC.litter.broad) opts.push(["litter", 0.9]);
      if (can("gap") && d.r >= 0.4 && f.shade < 0.95) opts.push(["gap", 0.6]);
      if (!opts.length) continue;
      let tw = 0; opts.forEach(o2 => tw += o2[1]);
      let pk = rng() * tw, kind = opts[0][0]; for (const o2 of opts) { pk -= o2[1]; if (pk <= 0) { kind = o2[0]; break; } }
      const ry = +(rng() * 6.283).toFixed(2);
      const D = { type: kind, bush: i, x, z, ry, r: d.r, h: d.h, tp: T };
      let done = false;
      if (kind === "hedgehog") {
        /* das Tier schaut vom Busch weg zum Weg hin – der Kopf ragt aus dem Busch */
        let best = 0, ba = ry;
        for (let a = 0; a < 6.28; a += 0.52) { const px = x + Math.cos(a) * (d.r + 0.4), pz = z + Math.sin(a) * (d.r + 0.4); const g2 = gap(px, pz) + (o.ok(px, pz, 0.2) ? 0 : -50); const sc2 = -g2 * 0.02 + 0.9 * Math.cos(a - 0.77) + (free(px, pz, 0.12, 0.3) ? 1.2 : 0);   /* bevorzugt die der Spielkamera (Südost) zugewandte Seite, damit man das Tier sieht */ if (sc2 > best) { best = sc2; ba = a; } }
        if (best > 0) { D.face = +ba.toFixed(2); done = true; }
        if (done && rng() < 0.5) { /* Spuren davor */ D.tracks = trackTo(x, z, ba, d.r); }
      } else if (kind === "berries") {
        D.berries = berryPts(b, d); D.bc = [0xd02a3a, 0x3a4aa8, 0xf09030][Math.floor(rng() * 3)]; done = D.berries.length > 3;
      } else if (kind === "nest") {
        const a = rng() * 6.283, rr = d.r * 0.22;
        D.nx = +(x + Math.cos(a) * rr).toFixed(2); D.nz = +(z + Math.sin(a) * rr).toFixed(2); D.ny = +(d.h * 0.8).toFixed(2); done = true;
      } else if (kind === "tracks") {
        const a = rng() * 6.283; D.tracks = trackTo(x, z, a, d.r); done = D.tracks.length >= 4;
      } else if (kind === "dense") {
        bushMods.scale[i] = [R(1.18, 1.3), R(1.15, 1.3)]; bushMods.tint[i] = 0.84;
        addPatch("damp", x, z, d.r * 1.5, { ecc: 1.1 }); done = true;
      } else if (kind === "litter") {
        addPatch("leaf", x, z, d.r * 1.45, { ecc: 1.15, bits: Math.round(d.r * 7) });
        scatter(x, z, d.r * 1.4, 3, (px, pz) => putItem("stick", px, pz, { s: R(0.7, 1.2) }, 0.15));
        scatter(x, z, d.r * 1.3, 3, (px, pz) => { if (free(px, pz, 0.1, 0.3)) forceItem("fruit", px, pz, { col: [0xc0242c, 0xe08a2c, 0x7a2a5a][Math.floor(rng() * 3)] }); });
        done = true;
      } else if (kind === "gap") {
        /* zweiter Busch daneben mit schmalem Durchblick; dahinter liegt etwas */
        const a = rng() * 6.283, sep = d.r * 2 + R(0.55, 0.85), x2 = x + Math.cos(a) * sep, z2 = z + Math.sin(a) * sep;
        if (free(x2, z2, d.r * 0.9, 0.5)) {
          const mx = (x + x2) / 2, mz = (z + z2) / 2, px = -Math.sin(a), pz = Math.cos(a);
          const bx = mx + px * 0.9, bz = mz + pz * 0.9;       /* Gegenstand seitlich/ dahinter */
          if (free(bx, bz, 0.2, 0.4)) {
            bushMods.extra.push({ clone: i, x: +x2.toFixed(2), z: +z2.toFixed(2), ry: +(rng() * 6.283).toFixed(2), k: R(0.9, 1.05) });
            D.x2 = +x2.toFixed(2); D.z2 = +z2.toFixed(2); D.lx = +bx.toFixed(2); D.lz = +bz.toFixed(2); D.lk = ["boot", "lantern", "basket"][Math.floor(rng() * 3)]; done = true;
          }
        }
      }
      if (!done) continue;
      cnt[kind] = (cnt[kind] || 0) + 1; discPts.push([x, z]); disc.push(D); bflag[i] = 1;
    }
    function berryPts(b, d) {
      const pts = [], n = 6 + Math.floor(rng() * 5);
      for (let k = 0; k < n; k++) {
        const th = R(0.3, 1.2), ph = rng() * 6.283, ax = d.r * 0.92, ay = d.h * 0.5;
        pts.push([+(b.position[0] + Math.sin(th) * Math.cos(ph) * ax).toFixed(3), +(d.h * 0.5 + Math.cos(th) * ay).toFixed(3), +(b.position[2] + Math.sin(th) * Math.sin(ph) * ax).toFixed(3)]);
      }
      return pts;
    }
    function trackTo(x, z, a, rBush) {
      /* Pfotenspur: von weit her auf den Busch zu, leicht geschwungen, abwechselnd links/rechts */
      const pts = [], len = R(2.4, 3.6), n = Math.round(len / 0.34), cur = R(-0.5, 0.5);
      for (let k = 0; k < n; k++) {
        const t = k / n, dist = rBush * 0.7 + 0.2 + t * len, side = (k % 2 ? 1 : -1) * 0.07, aa = a + cur * t * 0.6;
        const px = x + Math.cos(aa) * dist - Math.sin(aa) * side, pz = z + Math.sin(aa) * dist + Math.cos(aa) * side;
        if (!free(px, pz, 0.08, 0.3)) { if (k > 2) break; else continue; }
        pts.push([+px.toFixed(2), +pz.toFixed(2), +(aa + Math.PI).toFixed(2)]);
      }
      return pts;
    }
    disc.forEach(D => { if (D.tracks) D.tracks.forEach(p => items.push({ k: "paw", x: p[0], z: p[1], ry: p[2], s: 1, v: 0 })); });

    items.forEach(it => { stats.items[it.k] = (stats.items[it.k] || 0) + 1; });
    stats.disc = cnt; stats.places = {}; places.forEach(p => stats.places[p.type] = (stats.places[p.type] || 0) + 1);
    stats.comp = comp.name; stats.focus = focus.length;
    stats.ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
    return { patches, items, places, disc, bushMods, stats, comp };
  }

  return { PATCH, PATCH_KINDS, LEAF_COLS, COMP, DISC, FLOWER_COLS, plan, generate, makeFeat, isOldB, isConif, isBroad, vnoise, mkRng };
})();
if (typeof module !== "undefined" && module.exports) module.exports = FOREST;
