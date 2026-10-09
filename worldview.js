/* =========================================================================
   LOGISTIKA – worldview.js
   Die große Welt um den Hof in 3D: Gelände mit Wald, Wegen, Bach und See,
   graue Sperrgebiete mit Aufdeck-Animation, fällbare Bäume (wachsen nach),
   Krügers Sägewerk, Hof-Ausbaustufen, Wildtiere, Haustiere und Mitarbeiter,
   kleine Ereignisse, Wetter – dazu Reiseknöpfe, Ausdauer, Kleeblätter und
   die Fenster für Sägewerk, Verkaufsstand, Händler, Brotzeit und Gebiete.
   Hängt sich an farmview.js (Szene, Eingabe, Fenster); die Minispiele
   stecken in minigames.js, das Angeln am See in fishview.js.
   ========================================================================= */
const WV = {
  trees: new Map(), falling: [], hofKey: "", hof: [], barriers: {}, npc: null, reveal: null,
  wild: [], fly: [], pres: {}, pets: new Map(), staff: new Map(), evKey: "", evNodes: [], visitSeen: {},
  gust: 0, hit: null, sawBlades: null, popTree: null
};
const WGRID = { x0: -160, z0: -160, x1: 104, z1: 104, chunk: 24, cell: 4 };
/* Reiseziele der Gebietsknöpfe (Kamera) – peek: wohin bei gesperrtem Gebiet */
const AREA_SPOTS = {
  hof:     { i: "🏡", n: "Hof",        at: [-1, 0],    d: 32 },
  wald:    { i: "🌲", n: "Wald",       at: [-22, -44], d: 40, peek: [-16, -15] },
  saege:   { i: "🪚", n: "Sägewerk",   at: [-29, -29], d: 30, peek: [-18, -17] },
  altwald: { i: "🌳", n: "Alter Wald", at: [-72, -76], d: 40, peek: [-48, -55] },
  see:     { i: "🎣", n: "See",        at: [12, 36],   d: 40, peek: [6, 19] }
};
const AREA_NPC = { wald: [-14.2, -5.3], saege: [-27.1, -16.4], altwald: [-53.8, -58.6], see: [7.2, 20.5] };
const AREA_BAR = { wald: [-14.7, -7.5, Math.PI / 2], saege: [-29, -17.4, 0], altwald: [-56, -61.2, -4.172], see: [5, 20.8, 0] };
const NPC_LOOK = {
  wald:    { shirt: 0x4a6a3a, pants: 0x3a4a3a, hat: "hut", beard: 0x7a5a3a, seed: 1, tool: "axt" },
  altwald: { shirt: 0x4a6a3a, pants: 0x3a4a3a, hat: "hut", beard: 0x7a5a3a, seed: 1, tool: "axt" },
  saege:   { shirt: 0x6a7a8a, pants: 0x3a3a4a, hat: "muetze", beard: 0xd8d4cc, seed: 2 },
  see:     { shirt: 0xb83a4a, pants: 0x2a2a3a, hair: 0x6a3a2a, skin: 0xf0c4a0, seed: 3 }
};
/* Höhe der Tag-Blasen und Taps für die neuen Objekte */
Object.assign(OBJ_H, {
  sw_halle: 4.6, sw_lager: 2.6, sw_buero: 2.8, sw_lkw: 2.2, kessel: 3.0, spalter: 1.4, hobel: 1.3, trocken: 2.4, verpack: 1.5,
  schleif: 1.3, fraese: 2.0, saegebock: 1.1, junk: 0.9, stall: 1.8, f_plot: 1.0, f_steg: 0.9, f_huette: 2.8, f_boot: 3.4,
  f_lager: 2.5, f_rauch: 3.6, f_kuehl: 2.9, f_markt: 2.4
});
/* Rauch über arbeitenden Gebäuden */
Object.assign(CHIMNEYS, {
  kessel:  { p: () => FWM.KESSEL_CHIMNEY, col: [0.62, 0.6, 0.58, 0.55], life: 3.0, size: 0.75 },
  f_rauch: { p: () => FFM.SMOKE_CHIMNEY,  col: [0.78, 0.76, 0.72, 0.62], life: 3.2, size: 0.8 }
});
const wnow = () => performance.now() / 1000;

/* ------------------------------ Hilfen -------------------------------- */
function wNoise(x, z) { return Math.sin(x * 0.37 + z * 0.21) * 0.5 + Math.sin(x * 0.11 - z * 0.43) * 0.5 + Math.sin((x + z) * 0.9) * 0.15; }
function wMix(a, b, t) { const A = G3.col(a), B = G3.col(b); t = clamp(t, 0, 1); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; }
/* Wie sehr ist hier Wald? 0 … 1 (weich am Waldrand) */
function forestK(x, z) {
  if (z > 19) return 0;
  const depth = Math.max(-15.5 - x, -15.5 - z);
  let f = clamp((depth + 1.5) / 4.5, 0, 1);
  if (z > 14) f *= clamp((19 - z) / 5, 0, 1);
  return f;
}
function lakeE(x, z) { const L = FWORLD.lake; return Math.hypot((x - L.x) / L.rx, (z - L.z) / L.rz); }
/* Bodenfarbe je Punkt: Wiese, Waldboden, Lichtung, Sägewerkshof, Ufer */
function worldGroundCol(x, z) {
  const v = wNoise(x, z), v2 = Math.sin(x * 0.07 + 1.3) * Math.cos(z * 0.06 - 0.4);
  const C = FM.C;
  let c = v > 0.35 ? C.grassD : v > -0.2 ? C.grass2 : C.grass;
  const f = forestK(x, z);
  if (f > 0) {
    const alt = x < -58 && z < -58;
    let fc = alt ? 0x4f7a2e : v > 0.3 ? 0x5e8a34 : v < -0.3 ? 0x6c8f3c : 0x64903a;
    if (v2 > 0.55) fc = wMix(fc, 0x7d6a42, (v2 - 0.55) * 1.6);
    c = wMix(c, fc, f);
  }
  for (const q of FWORLD.clearings) {
    const d = Math.hypot(x - q[0], z - q[1]);
    if (d < q[2] + 2) c = wMix(c, v > 0 ? 0x93c957 : 0x8cc650, clamp((q[2] + 2 - d) / 2.5, 0, 1));
  }
  if (inYard(x, z, 1.5)) {
    const y = FWORLD.yard, d = Math.min(x - y[0], y[2] - x, z - y[1], y[3] - z);
    c = wMix(c, 0xb5a98e, clamp((d + 1.5) / 2, 0, 1));
  }
  const e = lakeE(x, z);
  if (e < 1.25) c = wMix(c, 0xd9c48a, clamp((1.25 - e) / 0.2, 0, 1));
  if (e < 0.98) c = wMix(0xd9c48a, 0x3d6f86, clamp((0.98 - e) / 0.12, 0, 1));
  /* Nachbarfelder */
  if (Math.abs(x + 29) < 6.4 && Math.abs(z + 1) < 4.4) c = wMix(c, 0xd3b76a, 0.6);
  if (Math.abs(x - 40) < 5.4 && Math.abs(z + 2) < 7.4) c = wMix(c, 0xb9d466, 0.6);
  return c;
}
function wRng(seed) { return typeof erbeRng === "function" ? erbeRng(seed) : (() => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(); }
/* Schnelle Nachschlage-Gitter für den Kulissenbau: Nähe zu Wegen und
   Bächen (1 Einheit Raster) und fällbare Bäume (Raster 4) */
function worldMasks(fell) {
  const x0 = WGRID.x0, z0 = WGRID.z0, W = WGRID.x1 - x0, H = WGRID.z1 - z0;
  const g = new Uint8Array(W * H);
  const stamp = (line, r, bit) => {
    for (let k = 1; k < line.length; k++) {
      const a = line[k - 1], b = line[k], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 0.5));
      for (let t = 0; t <= n; t++) {
        const px = a[0] + (b[0] - a[0]) * t / n, pz = a[1] + (b[1] - a[1]) * t / n;
        for (let ix = Math.floor(px - r); ix <= Math.ceil(px + r); ix++)
          for (let iz = Math.floor(pz - r); iz <= Math.ceil(pz + r); iz++) {
            const gx = ix - x0, gz = iz - z0;
            if (gx < 0 || gz < 0 || gx >= W || gz >= H) continue;
            if ((ix + 0.5 - px) * (ix + 0.5 - px) + (iz + 0.5 - pz) * (iz + 0.5 - pz) <= r * r) g[gz * W + gx] |= bit;
          }
      }
    }
  };
  FWORLD.paths.forEach(p => { stamp(p, 2.2, 1); stamp(p, 6, 2); });
  stamp(FWORLD.creek, 2.7, 4); stamp(LAKE_CREEK, 2.3, 4);
  const at = (x, z) => { const gx = Math.floor(x) - x0, gz = Math.floor(z) - z0; return gx < 0 || gz < 0 || gx >= W || gz >= H ? 0 : g[gz * W + gx]; };
  const hash = new Map();
  fell.forEach(t => { const k = Math.floor(t.x / 4) + "," + Math.floor(t.z / 4); (hash.get(k) || hash.set(k, []).get(k)).push(t); });
  const nearTree = (x, z) => {
    const cx = Math.floor(x / 4), cz = Math.floor(z / 4);
    for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) {
      const L = hash.get(i + "," + j);
      if (L) for (const t of L) if ((t.x - x) * (t.x - x) + (t.z - z) * (t.z - z) < 4.84) return true;
    }
    return false;
  };
  return { at, nearTree };
}
/* Kulissenbaum hier erlaubt? */
function bgTreeOk(x, z, M) {
  if (Math.abs(x) < 16.5 && Math.abs(z) < 16.5) return false;
  if (x > 13 && x < 35 && z > -17.5 && z < 17.5) return false;
  if (z > 15.8 && z < 22.5) return false;
  if (z > 20 && z < 34 && x > -24 && x < 44) return false;
  if (inYard(x, z, 1.8)) return false;
  if (Math.abs(x + 29) < 7 && Math.abs(z + 1) < 5) return false;
  if (Math.abs(x - 40) < 6 && Math.abs(z + 2) < 8) return false;
  if (M.at(x, z) & 5) return false;
  if (z > 20 && lakeE(x, z) < 1.18) return false;
  for (const c of FWORLD.clearings) if (Math.abs(x - c[0]) < c[2] && Math.abs(z - c[1]) < c[2] && Math.hypot(x - c[0], z - c[1]) < c[2] - 0.5) return false;
  if (Math.hypot(x - FWORLD.rocks[0], z - FWORLD.rocks[1]) < FWORLD.rocks[2] * 0.75) return false;
  if (Math.hypot(x - FWORLD.pond.x, z - FWORLD.pond.z) < FWORLD.pond.r + 2) return false;
  return !M.nearTree(x, z);
}
/* Bach, der von Osten in den See fließt (Bachmündung) */
const LAKE_CREEK = [[48.5, 59], [58, 62], [70, 60], [84, 66], [100, 64]];

/* Schneller Puffer für Kulissen: Kopien eines Modells (nur Drehung um y,
   gleichmäßige Größe) direkt in ein Float32Array – ohne MB-Umweg */
class WBuf {
  constructor() { this.f = new Float32Array(9 * 3 * 256); this.n = 0; }
  grow(k) { if (this.n + k <= this.f.length) return; let L = this.f.length * 2; while (L < this.n + k) L *= 2; const g = new Float32Array(L); g.set(this.f.subarray(0, this.n)); this.f = g; }
  add(m, x, z, ry, s) {
    this.grow(m.length);
    const f = this.f, c = Math.cos(ry), sn = Math.sin(ry);
    let o = this.n;
    for (let i = 0; i < m.length; i += 9) {
      const px = m[i], py = m[i + 1], pz = m[i + 2], qx = m[i + 3], qz = m[i + 5];
      f[o] = x + (c * px + sn * pz) * s; f[o + 1] = py * s; f[o + 2] = z + (-sn * px + c * pz) * s;
      f[o + 3] = c * qx + sn * qz; f[o + 4] = m[i + 4]; f[o + 5] = -sn * qx + c * qz;
      f[o + 6] = m[i + 6]; f[o + 7] = m[i + 7]; f[o + 8] = m[i + 8];
      o += 9;
    }
    this.n = o;
  }
  /* Bodenkachel mit Farbe je Ecke (zwei Dreiecke, Normale nach oben) */
  quad(x, z, w, c00, c10, c01, c11) {
    this.grow(54);
    const f = this.f;
    let o = this.n;
    const v = (px, pz, c) => { f[o] = px; f[o + 1] = 0; f[o + 2] = pz; f[o + 3] = 0; f[o + 4] = 1; f[o + 5] = 0; f[o + 6] = c[0]; f[o + 7] = c[1]; f[o + 8] = c[2]; o += 9; };
    v(x, z, c00); v(x, z + w, c01); v(x + w, z + w, c11);
    v(x, z, c00); v(x + w, z + w, c11); v(x + w, z, c10);
    this.n = o;
  }
  out() { return this.f.slice(0, this.n); }
}

/* --------------------------- Kulisse bauen ----------------------------- */
function worldStatic() {
  const R = FV.R;
  WV.trees.clear(); WV.falling = []; WV.hofKey = ""; WV.hof = []; WV.barriers = {}; WV.npc = null;
  WV.wild = []; WV.fly = []; WV.pets.clear(); WV.staff.clear(); WV.evKey = ""; WV.evNodes = []; WV.sawBlades = null;
  const fell = S.farm.trees || [];
  const rnd = wRng(7331);
  const MK = worldMasks(fell);
  /* Gelände und Kulissenwald in Kacheln – was nicht im Bild ist, wird nicht
     gezeichnet. Gebaut direkt in Float32Arrays (Tausende Bäume, schnell). */
  const CH = WGRID.chunk, cell = WGRID.cell;
  const chunks = new Map();
  const chunkOf = (x, z) => {
    const i = Math.floor((x - WGRID.x0) / CH), j = Math.floor((z - WGRID.z0) / CH), k = i + "," + j;
    let c = chunks.get(k);
    if (!c) { c = { g: new WBuf(), d: new WBuf() }; chunks.set(k, c); }
    return c;
  };
  /* Bodenfarben einmal je Gitterpunkt */
  const nx = Math.round((WGRID.x1 - WGRID.x0) / cell), nz = Math.round((WGRID.z1 - WGRID.z0) / cell);
  const GC = new Array((nx + 1) * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) GC[j * (nx + 1) + i] = G3.col(worldGroundCol(WGRID.x0 + i * cell, WGRID.z0 + j * cell));
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const x = WGRID.x0 + i * cell, z = WGRID.z0 + j * cell;
      if (x >= -16 && x + cell <= 16 && z >= -16 && z + cell <= 16) continue;     /* Hofwiese kommt extra */
      if (lakeE(x + cell / 2, z + cell / 2) < 0.8) continue;                          /* unter Wasser */
      const g = chunkOf(x + 0.1, z + 0.1).g;
      const c00 = GC[j * (nx + 1) + i], c10 = GC[j * (nx + 1) + i + 1], c01 = GC[(j + 1) * (nx + 1) + i], c11 = GC[(j + 1) * (nx + 1) + i + 1];
      g.quad(x, z, cell, c00, c10, c01, c11);
    }
  /* Kulissenbäume: dichter Wald, lockere Bäume am See und im Osten */
  const F32 = mb => new Float32Array(mb.v);
  const P = [0, 1, 2].map(v => F32(FWM.bgPine(v))), L = [0, 1, 2, 3].map(v => F32(FWM.bgLeaf(v))), B = [0, 1].map(v => F32(FWM.bgBirch(v)));
  const fern = F32(FWM.fern()), mush = F32(FWM.mushrooms(true)), mush2 = F32(FWM.mushrooms(false)), dlog = F32(FWM.deadLog()), bush = F32(FM.bushes());
  const rocks = [0.9, 1.4, 2.0].map(k => F32(FWM.boulder(k)));
  const step = 3.2;
  for (let gx = WGRID.x0; gx < WGRID.x1; gx += step)
    for (let gz = WGRID.z0; gz < WGRID.z1; gz += step) {
      const x = gx + rnd() * step * 0.8, z = gz + rnd() * step * 0.8;
      const f = forestK(x, z);
      let p;
      if (f > 0.5) p = 0.86;
      else if (z > 22) p = z > 74 ? 0.55 : 0.1;
      else if (x > 34) p = 0.1;
      else p = f * 0.6;
      const r0 = rnd(), r1 = rnd(), r2 = rnd();
      if (r0 > p) {
        /* Waldboden: Farn, Pilze, Totholz – nur in Wegnähe, wo man hinsieht */
        if (f > 0.5 && r0 < 0.98 && (MK.at(x, z) & 2) && bgTreeOk(x, z, MK)) {
          const c = chunkOf(x, z).d;
          if (r1 < 0.35) c.add(fern, x, z, r2 * 6.28, 0.9 + r2 * 0.5);
          else if (r1 < 0.4) c.add(r2 < 0.5 ? mush : mush2, x, z, r2 * 6.28, 1);
          else if (r1 < 0.44) c.add(dlog, x, z, r2 * 6.28, 1);
          else if (r1 < 0.5) c.add(bush, x, z, r2 * 6.28, 0.9 + r2);
        }
        continue;
      }
      if (!bgTreeOk(x, z, MK)) continue;
      const zone = forestZone(x, z), alt = zone === "alt";
      let m;
      if (f < 0.5) m = r1 < 0.5 ? L[Math.floor(r2 * 4)] : r1 < 0.8 ? P[Math.floor(r2 * 3)] : B[Math.floor(r2 * 2)];
      else if (zone === "birke") m = r1 < 0.45 ? B[Math.floor(r2 * 2)] : r1 < 0.75 ? P[Math.floor(r2 * 3)] : L[Math.floor(r2 * 4)];
      else if (zone === "kiefer") m = r1 < 0.72 ? P[Math.floor(r2 * 3)] : r1 < 0.85 ? B[Math.floor(r2 * 2)] : L[Math.floor(r2 * 4)];
      else if (alt) m = r1 < 0.72 ? L[Math.floor(r2 * 4)] : P[Math.floor(r2 * 3)];
      else m = r1 < 0.5 ? L[Math.floor(r2 * 4)] : r1 < 0.85 ? P[Math.floor(r2 * 3)] : B[Math.floor(r2 * 2)];
      const sc = alt ? 1.55 + r2 * 0.7 : f > 0.5 ? 1.05 + r2 * 0.6 : 0.9 + r2 * 0.4;
      chunkOf(x, z).d.add(m, x, z, r1 * 6.28, sc);
    }
  /* Felsen im Wald */
  for (let i = 0; i < 14; i++) {
    const a = rnd() * 6.28, d = rnd() * FWORLD.rocks[2] * 0.7;
    const x = FWORLD.rocks[0] + Math.cos(a) * d, z = FWORLD.rocks[1] + Math.sin(a) * d;
    chunkOf(x, z).d.add(rocks[i % 3], x, z, rnd() * 6.28, 0.8 + rnd() * 0.5);
  }
  for (const c of chunks.values()) {
    if (c.g.n) R.nodes.push(fnode(R.mesh(c.g.out()), { shadow: false }));
    if (c.d.n) R.nodes.push(fnode(R.mesh(c.d.out())));
  }
  /* Wege, Bach mit Brücke, Straße */
  const lines = new FM.MB();
  FWORLD.paths.forEach(p => lines.merge(FWM.forestPath(p, 1.8), {}));
  lines.merge(FWM.creekBank(FWORLD.creek), {});
  lines.merge(FWM.creekBank(LAKE_CREEK), {});
  R.nodes.push(fnode(R.mesh(lines), { shadow: false }));
  const cw = new FM.MB();
  cw.merge(FWM.creekWater(FWORLD.creek), {}); cw.merge(FWM.creekWater(LAKE_CREEK), {});
  R.nodes.push(fnode(R.mesh(cw), { water: 1, shadow: false }));
  R.nodes.push(fnode(fmesh("wbridge", FWM.bridge), { x: -21.8, y: 0, z: -64.4, ry: -Math.atan2(-8, 4) }));
  R.nodes.push(fnode(fmesh("wbridge", FWM.bridge), { x: 52.6, y: 0, z: 60.3, ry: Math.PI / 2 - Math.atan2(3, 9.5) }));
  const st = new FM.MB();
  st.merge(FM.road(WGRID.x1 - WGRID.x0), { x: (WGRID.x0 + WGRID.x1) / 2, z: 18.5, ry: Math.PI / 2 });
  /* Weg von der Straße hinunter zum See und am Ufer entlang */
  st.merge(FWM.forestPath([[5, 19.4], [5, 21.6], [-2, 22.2], [-20, 21.9]], 1.6), {});
  st.merge(FWM.forestPath([[5, 21.6], [14, 22.1], [26, 22.1], [38, 21.6]], 1.6), {});
  /* Nachbarfelder */
  const nf = (x, z, w, d, c1, c2) => {
    const m = new FM.MB();
    m.plate(w, d, c1, { y0: 0.015 });
    for (let i = 0; i < Math.floor(d / 0.6); i++) m.plate(w - 0.2, 0.22, c2, { z: -d / 2 + 0.4 + i * 0.6, y0: 0.03 });
    st.merge(m, { x, z });
  };
  nf(-29, -1, 12, 8, 0xe3c35a, 0xd0ac43);
  nf(40, -2, 10, 14, 0xb9d466, 0x9fc055);
  /* Sägewerkshof: Schotter, Holzstapel, Zaun */
  st.merge(FWM.yard(26, 24), { x: -29, z: -30 });
  [[-40, -24.5, 0], [-35, -40.5, 1.57], [-18.2, -27, 0.2], [-23.2, -40.6, 1.57]].forEach(([x, z, ry], i) => st.merge(FWM.logPile(5 + i * 2, i % 2 ? "kiefer" : "buche"), { x, z, ry }));
  const yf = new FM.MB(), fo = { step: 1.2, h: 0.7, post: 0x6e4a2e, rail: 0x9a6a3e };
  FM.fenceLine(yf, -42, -42, -31, -42, fo); FM.fenceLine(yf, -27, -42, -16, -42, fo);
  FM.fenceLine(yf, -42, -42, -42, -32, fo); FM.fenceLine(yf, -42, -28, -42, -18, fo);
  FM.fenceLine(yf, -16, -42, -16, -18, fo);
  FM.fenceLine(yf, -42, -18, -31, -18, fo); FM.fenceLine(yf, -27, -18, -16, -18, fo);
  st.add(yf);
  /* Teich im Osten */
  st.merge(FM.pondBank(POND.r), { x: POND.x, z: POND.z });
  R.nodes.push(fnode(R.mesh(st), { shadow: false }));
  R.nodes.push(fnode(fmesh("pond", () => FM.pondWater(POND.r)), { x: POND.x, y: 0.03, z: POND.z, water: 1, shadow: false }));
  FV.foam = fnode(fmesh("pondFoam", () => FM.pondFoam(POND.r)), { x: POND.x, y: 0.042, z: POND.z, alpha: 0.4, shadow: false });
  R.nodes.push(FV.foam);
  R.nodes.push(fnode(fmesh("pondReeds", () => FM.pondReeds(POND.r)), { x: POND.x, z: POND.z, sway: 0.9 }));
  R.nodes.push(fnode(fmesh("pondProps", () => FM.pondProps(POND.r)), { x: POND.x, z: POND.z }));
  FV.ducks = [0, 1, 2].map(i => {
    const n = fnode(fmesh("duck:" + (i === 2 ? 1 : 0), () => FM.duck(i === 2 ? 1 : 0)), { y: 0.03, s: 1.4 });
    R.nodes.push(n);
    return { n, a: i * 2.1, r: [2.6, 1.6, 2.1][i], sp: [0.11, -0.16, 0.13][i], off: i * 0.25 };
  });
  /* Der Glindower See: Ufer, Wasser, Schilf, Seerosen, Insel, Steine */
  const Lk = FWORLD.lake;
  R.nodes.push(fnode(fmesh("lakeShore", () => FWM.lakeShore(Lk.rx, Lk.rz)), { x: Lk.x, z: Lk.z, shadow: false }));
  R.nodes.push(fnode(fmesh("lakeWater", () => FWM.lakeWater(Lk.rx, Lk.rz)), { x: Lk.x, y: 0.035, z: Lk.z, water: 1, shadow: false }));
  const lk = new FM.MB();
  [[-15, 52, 26], [-20, 44, 18], [-12, 62, 16], [36, 36, 14], [44, 52, 12], [-17, 34, 10]].forEach(([x, z, n], i) => lk.merge(FWM.reedPatch(n), { x, z, ry: i }));
  [[-9, 40, 14], [-4, 43, 8], [28, 64, 9]].forEach(([x, z, n]) => lk.merge(FWM.lilyPads(n), { x, z, y: 0.03 }));
  /* Insel mit zwei Bäumen */
  lk.merge((() => { const m = new FM.MB(); m.disc(3.2, 14, 0xd9c48a, { y0: 0.05, wob: 0.12 }); m.disc(2.5, 12, 0x86bf4a, { y0: 0.07, wob: 0.12 }); return m; })(), { x: 2, z: 58 });
  lk.merge(FWM.bgLeaf(1), { x: 2.6, z: 57.6, s: 1.3 }); lk.merge(FWM.bgPine(2), { x: 1, z: 58.8, s: 1.1 });
  for (let i = 0; i < 7; i++) lk.merge(FWM.boulder(0.5 + rnd() * 0.7), { x: 34 + rnd() * 5 - 2.5, z: 39 + rnd() * 3, ry: rnd() * 6 });
  R.nodes.push(fnode(R.mesh(lk), { sway: 0.4 }));
  /* fällbare Bäume, Hof je Ausbaustufe, Schranken an gesperrten Wegen */
  worldSyncHof(true);
  worldSyncTrees(true);
  worldSyncBarriers();
  worldLocks();
  worldMakeWild();
}

/* --------------------------- Hof je Ausbaustufe ------------------------- */
function worldHofKey() { const F = S.farm; return (F.stage || 1) + ":" + ((F.cos && F.cos.on && F.cos.on.tractor) || ""); }
function worldSyncHof(force) {
  const R = FV.R, key = worldHofKey();
  if (!force && key === WV.hofKey) return;
  WV.hofKey = key;
  WV.hof.forEach(n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
  WV.hof = [];
  const stage = S.farm.stage || 1, big = stage >= 4, F0 = big ? 15.5 : 13;
  const add = n => { R.nodes.push(n); WV.hof.push(n); return n; };
  add(fnode(fmesh("hofGround:" + Math.min(stage, 2), () => FWM.hofGround(32, 13, Math.min(stage, 2))), { shadow: false }));
  const b = new FM.MB(), ps = Math.min(3, stage);
  b.merge(FWM.hofPath(2, big ? 23.5 : 21, ps), { x: 5, z: big ? 3.75 : 2.5 });
  b.merge(FWM.hofPath(big ? 21.5 : 19, 1, ps), { x: big ? -4.75 : -3.5, z: -7.5 });
  b.merge(FWM.hofPath(2, 17.7 - F0, ps), { x: 5, z: (F0 + 17.7) / 2 });
  b.merge(FWM.hofPath(Math.max(1, 15.6 - F0 + 0.2), 1.6, ps), { x: -(F0 + 15.6) / 2, z: -7.5 });
  if (big) {
    /* Steinmauer ringsum mit Toren im Süden und Westen */
    const wall = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      b.merge(FWM.stoneWall(len), { x: (x0 + x1) / 2, z: (z0 + z1) / 2, ry: -Math.atan2(z1 - z0, x1 - x0) });
    };
    wall(-15.5, -15.5, 15.5, -15.5); wall(15.5, -15.5, 15.5, 15.5);
    wall(-15.5, 15.5, 2.6, 15.5); wall(7.4, 15.5, 15.5, 15.5);
    wall(-15.5, -15.5, -15.5, -8.6); wall(-15.5, -6.4, -15.5, 15.5);
    b.merge(FWM.stoneGate(), { x: 5, z: 15.5 });
  } else {
    const k = stage;
    FWM.hofFence(b, -13, -13, 13, -13, k, 1);
    FWM.hofFence(b, 13, -13, 13, 13, k, 2);
    FWM.hofFence(b, -13, 13, 3, 13, k, 3);
    FWM.hofFence(b, 7, 13, 13, 13, k, 4);
    FWM.hofFence(b, -13, -13, -13, -8.6, k, 5);
    FWM.hofFence(b, -13, -6.4, -13, 13, k, 6);
    b.merge(FM.gate(), { x: 5, z: 13, ry: stage <= 1 ? 0.06 : 0 });
  }
  /* Westtor zum Wald */
  [-8.7, -6.3].forEach(z => b.box(0.18, 1.2, 0.18, stage >= 4 ? 0xa8a094 : FM.C.woodD, { x: -F0, z }));
  if (stage >= 3) {
    const L = FM.lamp(), fl = FM.flowers();
    [[2.5, F0 + 0.6], [7.5, F0 + 0.6], [-F0 - 0.6, -9.3], [-F0 - 0.6, -5.7], [F0 + 0.6, F0 + 0.6], [-F0 - 0.6, F0 + 0.6], [F0 + 0.6, -F0 - 0.6], [-F0 - 0.6, -F0 - 0.6], [-8, 17.2], [18, 17.2]]
      .forEach(([x, z]) => b.merge(L, { x, z }));
    [-10, -6, -2, 10, 12].forEach(x => b.merge(fl, { x, z: F0 + 0.9 }));
  }
  add(fnode(R.mesh(b)));
  if (stage >= 2) {
    const col = (S.farm.cos && S.farm.cos.on.tractor) || "rot";
    add(fnode(fmesh("tractor:" + col, () => FWM.tractor(col)), { x: 10.4, z: 16.6, ry: -Math.PI / 2 }));
    add(fnode(fmesh("trailer", FWM.trailer), { x: 12.6, z: 16.6, ry: -Math.PI / 2 }));
  }
  if (big) add(fnode(fmesh("mhall", FWM.machineHall), { x: 24, z: 12.8, ry: Math.PI }));
}
/* Ausgezeichnete Hofgebäude: in Stufe 1 noch etwas grau und verwittert */
const WORN_T = new Set(["house", "barn", "silo", "mill", "shed", "bakery"]);
function objVar(o) {
  const F = S.farm;
  if (WORN_T.has(o.t)) return (F.stage || 1) <= 1 ? "w" : "";
  if (o.t === "sw_halle") return sawMask();
  if (o.t === "kessel") return F.saw && F.saw.motor ? "1" : "0";
  if (o.t === "sw_lager") return sawRepaired() ? "1" : "0";
  if (o.t === "sw_buero") return F.saw && F.saw.strom ? "1" : "0";
  if (o.t === "sw_lkw") return F.saw && F.saw.lkw ? "1" : "0";
  return "";
}
function sawMask() { const s = S.farm.saw || {}; return (s.dach ? 1 : 0) | (s.strom ? 2 : 0) | (s.saege ? 4 : 0) | (s.band ? 8 : 0); }
/* Modelle der neuen Objekte */
function worldObjMesh(o) {
  const F = S.farm;
  switch (o.t) {
    case "sw_halle": { const m = sawMask(); return fmesh("sawHall:" + m, () => FWM.sawHall(m)); }
    case "sw_lager": { const k = sawRepaired() ? 1 : 0; return fmesh("sawLager:" + k, () => FWM.sawLager(k)); }
    case "sw_buero": { const k = F.saw && F.saw.strom ? 1 : 0; return fmesh("sawBuero:" + k, () => FWM.sawBuero(k)); }
    case "sw_lkw": { const k = F.saw && F.saw.lkw ? 1 : 0; return fmesh("sawLkw:" + k, () => FWM.sawLkw(k)); }
    case "kessel": { const k = F.saw && F.saw.motor ? 1 : 0; return fmesh("kessel:" + k, () => FWM.kessel(k)); }
    case "spalter": case "hobel": case "trocken": case "verpack": case "schleif": case "fraese": return fmesh("mach:" + o.t, () => FWM.machine(o.t));
    case "saegebock": return fmesh("saegebock", FWM.saegebock);
    case "junk": return fmesh("junk:" + o.k, () => FWM.junk(o.k));
    case "stall": return fmesh("stall", FWM.stall);
    case "f_plot": { const [w, d] = farmSize(o); return fmesh("fplot:" + w + "x" + d, () => FWM.fPlot(w, d)); }
    case "f_steg": return fmesh("lakeSteg", FWM.lakeSteg);
    case "f_huette": return fmesh("fHuette", FWM.fHuette);
    case "f_boot": return fmesh("fBoot", FWM.fBoot);
    case "f_lager": return fmesh("fLager", FWM.fLager);
    case "f_rauch": return fmesh("smoke", FFM.smoke);
    case "f_kuehl": return fmesh("kuehl", FFM.kuehl);
    case "f_markt": return fmesh("fMarkt", FWM.fMarkt);
  }
  return null;
}
/* Gebäude mit Anstrich aus dem Kosmetik-Shop */
function skinMB(t, k) {
  const C = FM.C;
  if (t === "house") {
    if (k !== "schiefer") return FM.house();
    const a = C.roof, b = C.roofD; C.roof = 0x5d6570; C.roofD = 0x464d57;
    try { return FM.house(); } finally { C.roof = a; C.roofD = b; }
  }
  if (!k) return FM.barn();
  const a = C.red, b = C.redD;
  if (k === "blau") { C.red = 0x5a86b0; C.redD = 0x47729a; } else { C.red = 0x5f8a4a; C.redD = 0x4c7639; }
  try { return FM.barn(); } finally { C.red = a; C.redD = b; }
}
function skinMesh(t) {
  const on = (S.farm && S.farm.cos && S.farm.cos.on) || {}, k = on[t] || "";
  return fmesh(t + ":" + k, () => skinMB(t, k));
}
/* Vorschaubilder für den Extras-Laden: das echte 3D-Modell, einmal gerendert */
const THUMB = { R: null, cache: {}, failed: false };
function thumbR() {
  if (THUMB.R || THUMB.failed) return THUMB.R;
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const R = G3.create(cv, { keep: true, shadowSize: 1024, shadowBox: 4, maxDpr: 1 });
    if (!R) { THUMB.failed = true; return null; }
    R.resize = () => { R.w = 128; R.h = 128; R.dpr = 1; };
    R.env.fogR = [400, 800];
    THUMB.R = R;
  } catch (e) { THUMB.failed = true; }
  return THUMB.R;
}
function thumbOf(key, fn) {
  if (THUMB.cache[key]) return THUMB.cache[key];
  const R = thumbR();
  if (!R) return null;
  let url = null;
  try {
    const m = R.mesh(fn()), b = m.box;
    const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2, cz = (b[0][2] + b[1][2]) / 2;
    const r = Math.max(0.3, Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1], b[1][2] - b[0][2]) / 2);
    const flat = (b[1][1] - b[0][1]) < 0.4 * Math.max(b[1][0] - b[0][0], b[1][2] - b[0][2]);
    R.nodes.length = 0;
    R.nodes.push(R.node(m, {}));
    R.locks = [];
    Object.assign(R.cam, { tx: cx, ty: cy, tz: cz, dist: r * (flat ? 3.0 : 3.3), yaw: Math.PI / 4, pitch: flat ? 0.85 : 0.55, fov: 0.55 });
    R.shadowBox = r * 1.6;
    R.render(1.5);
    url = R.canvas.toDataURL("image/png");
    R.free(m);
  } catch (e) { url = null; }
  THUMB.cache[key] = url;
  return url;
}
/* Modell eines Laden-Artikels – so, wie er auf dem Hof steht */
function shopModel(it) {
  if (it.id === "field") return () => { const b = FM.fieldSoil(false); b.merge(FM.cropMesh("weizen", 3), {}); return b; };
  if (it.tree) return () => { const b = FM.treeMesh(it.tree); b.merge(FM.treeFruit(it.tree), {}); return b; };
  if (it.animal) return { huhn: () => FM.chicken(0), kuh: () => FM.cow(0), schwein: () => FM.pig(0), schaf: () => FM.sheep(0, false), rind: () => FM.beef(0) }[it.animal] || null;
  if (FPENS[it.id] && PEN_HUT[it.id]) {
    const run = { coop: FM.coopRun, cows: FM.pasture, pigs: FM.pigRun, sheep: FM.sheepPasture, beef: FM.beefPasture }[it.id];
    if (!run) return null;
    return () => { const p = FPENS[it.id][0], H = PEN_HUT[it.id], b = run(p.w, p.d); b.merge(H.fn(), { x: -p.w / 2 + H.x, z: -p.d / 2 + H.z }); return b; };
  }
  if (FSHOP_SAW.some(x => x.id === it.id)) return () => FWM.machine(it.id);
  if (typeof FM[it.id] === "function" && FMACHINES[it.id]) return () => FM[it.id]();
  return null;
}
function decoModel(k) {
  const D = FDECO[k];
  if (!D) return null;
  if (FM[k]) return () => FM[k](D.arg || 1);
  if (D.cos) return () => FWM.cosDeco(k);
  return typeof FFM !== "undefined" && FFM[k] ? () => FFM[k]() : null;
}
/* Bildchen im Laden: erst das Symbol, dann (Bild für Bild) das echte Modell */
THUMB.fns = {};
function thumbSpan(key, fn, emoji, lock) {
  const lk = lock ? `<i class="th-lk">🔒</i>` : "";
  if (!fn || THUMB.failed || THUMB.cache[key] === null) return `<span class="ic">${lock ? "🔒" : emoji}</span>`;
  THUMB.fns[key] = fn;
  const url = THUMB.cache[key];
  return url ? `<span class="ic th"><img src="${url}" alt="">${lk}</span>` : `<span class="ic th" data-th="${key}"><b>${emoji}</b>${lk}</span>`;
}
function thumbFill() {
  THUMB.queue = $$("#farmSheetIn [data-th]");
  if (THUMB.queue.length && !THUMB.busy) { THUMB.busy = true; requestAnimationFrame(thumbWork); }
}
function thumbWork() {
  const q = THUMB.queue || [];
  let n = 0;
  while (q.length && n < 2) {
    const el = q.shift();
    if (!el.isConnected || !el.dataset.th) continue;
    const k = el.dataset.th, url = thumbOf(k, THUMB.fns[k]);
    el.removeAttribute("data-th");
    if (url) { const b = el.querySelector("b"); if (b) b.remove(); el.insertAdjacentHTML("afterbegin", `<img src="${url}" alt="">`); }
    else el.classList.remove("th");
    n++;
  }
  if (q.length) requestAnimationFrame(thumbWork); else THUMB.busy = false;
}
function cosModel(c) {
  if (c.skin && c.skin.barn) return ["barn:" + c.skin.barn, () => skinMB("barn", c.skin.barn)];
  if (c.skin && c.skin.house) return ["house:" + c.skin.house, () => skinMB("house", c.skin.house)];
  if (c.skin && c.skin.tractor) return ["tractor:" + c.skin.tractor, () => FWM.tractor(c.skin.tractor)];
  if (c.pet) return ["pet:" + c.pet, c.pet === "hund" ? FWM.dog : c.pet === "katze" ? FWM.cat : FWM.goat];
  if (c.deco) return ["deco:" + c.deco, () => FWM.cosDeco(c.deco)];
  return [null, null];
}
function cosThumb(c) {
  if (c.skin && c.skin.barn) return thumbOf("barn:" + c.skin.barn, () => skinMB("barn", c.skin.barn));
  if (c.skin && c.skin.house) return thumbOf("house:" + c.skin.house, () => skinMB("house", c.skin.house));
  if (c.skin && c.skin.tractor) return thumbOf("tractor:" + c.skin.tractor, () => FWM.tractor(c.skin.tractor));
  if (c.pet) return thumbOf("pet:" + c.pet, c.pet === "hund" ? FWM.dog : c.pet === "katze" ? FWM.cat : FWM.goat);
  if (c.deco) return thumbOf("deco:" + c.deco, () => FWM.cosDeco(c.deco));
  return null;
}
/* Teile an Objekten: Sägeblätter, Angler, Verwitterung */
function worldObjParts(o, root, parts) {
  const R = FV.R;
  if (WORN_T.has(o.t) && (S.farm.stage || 1) <= 1) root.tint = [0.42, 0.38, 0.32, 0.22];
  if (o.t === "sw_halle" && sawMask() & 4) parts.blades = R.addChild(root, fnode(fmesh("sawBlades", FWM.sawBlades), { x: 0.5, y: 0.73, z: 0 }));
  if (o.t === "f_steg") {
    parts.angler = R.addChild(root, fnode(fmesh("angler", FFM.angler), { y: 0.17, z: 2.3 }));
    parts.rod = R.addChild(root, fnode(fmesh("rod", FFM.rod), { y: 0.63, z: 2.55, rx: ROD_REST }));
    parts.angler.visible = parts.rod.visible = false;
  }
  if (o.t === "stall" || o.t === "f_markt") parts.goods = R.addChild(root, fnode(fmesh("stallGoods", FWM.stallGoods), { visible: false, y: o.t === "f_markt" ? 0.15 : 0 }));
}

/* ------------------------------- Bäume ---------------------------------- */
function treeMeshOf(t) {
  if (t.st === "stump") return fmesh("ws:" + t.sp + ":" + t.sz, () => FWM.stump(t.sp, t.sz));
  if (t.st === "sapling") return fmesh("wsap:" + t.sp, () => FWM.sapling(t.sp));
  if (t.st === "fallen") return fmesh("wf:" + t.sp + ":" + t.sz, () => FWM.fallen(t.sp, t.sz));
  const v = t.id % 3;
  return fmesh("wt:" + t.sp + ":" + t.sz + ":" + v, () => FWM.tree(t.sp, t.sz, v));
}
function treeKey(t) { return t.st + ":" + t.sz; }
function worldSyncTrees(force) {
  const R = FV.R;
  if (!S.farm.trees) return;
  for (const t of S.farm.trees) {
    let e = WV.trees.get(t.id);
    if (e && e.falling) continue;
    const key = treeKey(t);
    if (e && !force && e.key === key) continue;
    if (!e) { e = { node: fnode(null, {}), key: "" }; WV.trees.set(t.id, e); R.nodes.push(e.node); }
    else if (e.key !== key && e.key && !force) {
      /* neu gewachsen oder umgestürzt: kurz wippen */
      e.pop = wnow();
    }
    e.key = key;
    const n = e.node;
    n.mesh = treeMeshOf(t);
    n.x = t.x; n.z = t.z; n.y = 0; n.rx = 0; n.rz = 0;
    n.ry = t.st === "fallen" ? (t.fall || 0) : t.ry;
    n.sx = n.sy = n.sz = t.s || 1;
    n.sway = t.st === "up" ? 0.22 : 0;
    n.visible = true;
  }
}
function treeH(t) { return t.st === "up" ? (1.0 + FWM.TH[t.sz] * 1.7) * (t.s || 1) : t.st === "fallen" ? 0.8 : 0.5; }
/* Baum unter dem Finger (Abstand entlang des Strahls) */
function pickTree(x, y) {
  const R = FV.R, r = R.ray(x, y);
  let best = null, bt = 1e9;
  for (const t of S.farm.trees || []) {
    let lo, hi;
    if (t.st === "fallen") {
      const len = 2.3 * FWM.TH[t.sz], a = t.fall || 0, cx = t.x + Math.cos(a) * len / 2, cz = t.z - Math.sin(a) * len / 2, k = len / 2 + 0.3;
      lo = [cx - k, 0, cz - k]; hi = [cx + k, 0.9, cz + k];
    } else {
      const k = t.st === "up" ? 0.4 + 0.2 * t.sz : 0.45;
      lo = [t.x - k, 0, t.z - k]; hi = [t.x + k, treeH(t), t.z + k];
    }
    const d = R.hitBox(r, lo, hi);
    if (d != null && d < bt) { bt = d; best = t; }
  }
  return best ? { t: best, d: bt } : null;
}
function treeScreen(t, f) { const p = FV.R.project(t.x, treeH(t) * (f == null ? 0.6 : f), t.z); return p ? [p[0], p[1]] : [FV.R.w / 2, FV.R.h / 2]; }
/* gefällter Baum kippt in die gewählte Richtung */
function worldTreeFall(t, dir) {
  const e = WV.trees.get(t.id);
  if (!e) return;
  e.falling = true;
  WV.falling.push({ e, t, t0: wnow(), ry: dir != null ? dir : Math.random() * 6.28 });
}
function stepFalling() {
  const now = wnow();
  for (let i = WV.falling.length - 1; i >= 0; i--) {
    const F = WV.falling[i], k = clamp((now - F.t0) / 1.0, 0, 1), n = F.e.node;
    n.ry = F.ry; n.rx = k * k * Math.PI / 2 * 0.97; n.sway = 0;
    if (k >= 1) {
      WV.falling.splice(i, 1);
      F.e.falling = false; F.e.key = "";
      const len = treeH({ st: "up", sz: F.t.sz, s: F.t.s }) * 0.7;
      FV.R.burst({ x: F.t.x + Math.sin(F.ry) * len, y: 0.2, z: F.t.z + Math.cos(F.ry) * len, n: 26, col: [[0.75, 0.68, 0.55, 0.9], [0.55, 0.75, 0.35, 1]], speed: 2.2, up: 1.4, size: 0.12, flat: true, spread: 2 });
      sfx("thud");
      worldSyncTrees(false);
    }
  }
}

/* --------------------------- Sperrgebiete -------------------------------- */
function worldLocks() {
  const R = FV.R;
  if (!R) return;
  const out = [];
  FAREA_ORDER.forEach(id => {
    const A = FAREAS[id], rv = WV.reveal && WV.reveal.id === id ? WV.reveal : null;
    if (farmAreaOpen(id) && !rv) return;
    A.locks.forEach(r => out.push({ r, c: A.reveal, rad: rv ? rv.rad : 0, a: 1 }));
  });
  R.locks = out;
}
function worldSyncBarriers() {
  const R = FV.R;
  FAREA_ORDER.forEach(id => {
    const open = farmAreaOpen(id), n = WV.barriers[id];
    if (!open && !n) {
      const p = AREA_BAR[id];
      WV.barriers[id] = fnode(fmesh("barrier", FWM.barrier), { x: p[0], z: p[1], ry: p[2] });
      R.nodes.push(WV.barriers[id]);
    } else if (open && n) {
      const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1);
      delete WV.barriers[id];
      for (let k = 0; k < 18; k++) R.emit({ x: n.x + (Math.random() - 0.5) * 2, y: 0.3, z: n.z + (Math.random() - 0.5) * 2, vx: (Math.random() - 0.5) * 2, vy: 1, vz: (Math.random() - 0.5) * 2, life: 0.9, size: 0.2, size2: 0.45, col: [0.95, 0.92, 0.85, 0.7], drag: 2 });
    }
  });
}
/* Wer wartet gerade am Weg? (Förster, Nachbar, Bürgermeisterin) */
function worldVisitor() { const Q = (S.farm && S.farm.areaQ) || []; return Q.find(id => !farmAreaOpen(id)) || null; }
function worldSyncNpc() {
  const R = FV.R, id = worldVisitor() || (WV.reveal && wnow() - WV.reveal.t0 < 14 ? WV.reveal.id : null);
  if (WV.npc && WV.npc.id === id) return;
  if (WV.npc) { const i = R.nodes.indexOf(WV.npc.node); if (i >= 0) R.nodes.splice(i, 1); WV.npc = null; }
  if (!id) return;
  const p = AREA_NPC[id], L = NPC_LOOK[id];
  const node = fnode(fmesh("npc:" + id, () => FWM.person(L)), { x: p[0], z: p[1], ry: Math.PI / 4, s: 1.35 });
  R.nodes.push(node);
  WV.npc = { id, node };
}
function worldUnlock(id) {
  if (!farmAreaUnlock(id)) return;
  const A = FAREAS[id];
  closeFarmSheet();
  WV.reveal = { id, t0: wnow(), dur: 3.4, rad: 0 };
  sfx("level");
  toast(A.i + " " + A.msg, "ok");
  const sp = AREA_SPOTS[id];
  farmFocusXZ(A.reveal[0] + (id === "see" ? 2 : -4), A.reveal[1] + (id === "see" ? 6 : -4), id === "saege" ? 30 : 40, 1300);
  /* Staubspur: der Weg wird freigeschnitten */
  const path = id === "wald" ? FWORLD.paths[0].concat(FWORLD.paths[1].slice(0, 3)) : id === "saege" ? [[-29, -18], [-29, -30], [-29, -42]] : id === "altwald" ? FWORLD.paths[4].slice(2) : [[5, 19.4], [5, 21.6], [-20, 21.9]];
  WV.dust = { pts: FM.MB ? FWM.smoothLine(path, 5) : path, i: 0, t: 0 };
  worldSyncBarriers();
  farmSyncScene(true);
  save();
  setTimeout(() => { if (sp && FV.on) toast("Tipp: Mit den Knöpfen links springst du zwischen " + (id === "see" ? "Hof, Wald und See." : "Hof und Wald."), ""); }, 4200);
}
function stepReveal(dt) {
  if (WV.reveal) {
    const R = WV.reveal, k = clamp((wnow() - R.t0) / R.dur, 0, 1);
    R.rad = (k * k * (3 - 2 * k)) * 320;
    if (k >= 1 && wnow() - R.t0 > 14) WV.reveal = null;
    else if (k >= 1) R.rad = 1000;
    worldLocks();
  }
  if (WV.dust) {
    const D = WV.dust;
    D.t += dt;
    while (D.t > 0.05 && D.i < D.pts.length) {
      D.t -= 0.05;
      const p = D.pts[D.i++];
      for (let k = 0; k < 3; k++) FV.R.emit({ x: p[0] + (Math.random() - 0.5) * 1.6, y: 0.15, z: p[1] + (Math.random() - 0.5) * 1.6, vy: 0.8, vx: (Math.random() - 0.5), vz: (Math.random() - 0.5), life: 1.1, size: 0.25, size2: 0.6, col: [0.9, 0.84, 0.7, 0.6], drag: 1.5 });
    }
    if (D.i >= D.pts.length) WV.dust = null;
  }
}

/* --------------------------- Wildtiere & Co. ----------------------------- */
/* Tagsüber Rehe, Hasen, Eichhörnchen und ein Reiher am See, in der Dämmerung
   Wildschweine, nachts Füchse, Igel, Eulen und Fledermäuse. Jedes Tier ist
   nur einen Teil seiner Zeit zu sehen und zieht sich dazwischen zurück –
   Sichtungen bleiben so etwas Besonderes. win = Uhrzeit von–bis. */
const WILD_SPOTS = [
  ["deer", -12, -36, 4.5, "wald"], ["deer", -48, -42, 5, "wald"], ["deer", -66, -72, 4.5, "altwald"],
  ["hare", 25, 10, 3, null], ["hare", -19, -12, 3, "wald"], ["hare", -24, 19, 2.5, "see"],
  ["squirrel", -24, -54, 2.5, "wald"], ["squirrel", 18.5, -12, 1.8, null], ["heron", -3.5, 29.4, 0.8, "see"],
  ["boar", -60, -36, 4, "wald"], ["boar", -86, -78, 5, "altwald"],
  ["fox", -4, -48, 5, "wald"], ["fox", 40, 5, 4, null], ["fox", -26, 28, 3, "see"],
  ["hedgehog", 31, -13, 2.5, null], ["hedgehog", -12, -40, 3, "wald"]
];
const WILD_DEF = {
  deer:     { sp: 1.3, run: 5, s: 1.0, win: [5, 20], mesh: () => FWM.deer(false) },
  hare:     { sp: 1.5, run: 5.5, s: 1.3, hop: 1, win: [6, 20], mesh: FWM.hare },
  squirrel: { sp: 1.6, run: 4, s: 1.4, hop: 1, win: [7, 18], mesh: FWM.squirrel },
  heron:    { sp: 0.45, run: 2.5, s: 1.3, still: 1, win: [5, 20], mesh: FWM.heron },
  boar:     { sp: 0.9, run: 3.5, s: 1.1, win: [17, 1], mesh: FWM.boar },
  fox:      { sp: 1.4, run: 5, s: 1.1, win: [19, 6], mesh: FWM.fox },
  hedgehog: { sp: 0.5, run: 1.3, s: 1.6, win: [20, 5], mesh: FWM.hedgehog }
};
/* Fliegende: Singvögel am Tag, Eulen und Fledermäuse nachts.
   [Art, Mitte x, z, Radius, Höhe, Gebiet, Gruppe] – eine Gruppe kommt und geht gemeinsam */
const FLY_DEF = {
  bird: { s: 1.6, win: [6, 19], mesh: () => FWM.bird(0x3a3a40), wing: () => FWM.birdWing(0x3a3a40) },
  owl:  { s: 1.9, win: [20, 5], mesh: FWM.owl, wing: FWM.owlWing },
  bat:  { s: 2.2, win: [19.5, 5], mesh: FWM.bat, wing: FWM.batWing }
};
const FLY_SPOTS = [
  ["bird", -24, -40, 5, 5, null, 0], ["bird", -24, -40, 6.3, 5.6, null, 0], ["bird", -24, -40, 7.6, 6.2, "wald", 0],
  ["owl", -18, -30, 9, 6, "wald", 1], ["owl", 8, 2, 11, 6.5, null, 2],
  ["bat", 2, -4, 3.6, 3.4, null, 3], ["bat", 2, -4, 4.4, 4, null, 3], ["bat", 2, -4, 3, 3, null, 3],
  ["bat", 6, 24, 4, 3, "see", 4], ["bat", 6, 24, 4.8, 3.6, "see", 4]
];
function wildWin(w, h) { return w[0] < w[1] ? h >= w[0] && h < w[1] : h >= w[0] || h < w[1]; }
/* Kommen und Gehen: da für 40–85 s, dann 55–150 s weg; außerhalb der Zeit nie */
function wildPres(key, dt, act) {
  const p = WV.pres[key] || (WV.pres[key] = { on: Math.random() < 0.45, t: 5 + Math.random() * 60 });
  if (!act) { p.on = false; if (p.t < 3) p.t = 3 + Math.random() * 45; return false; }
  p.t -= dt;
  if (p.t <= 0) { p.on = !p.on; p.t = p.on ? 40 + Math.random() * 45 : 55 + Math.random() * 95; }
  return p.on;
}
function worldMakeWild() {
  const R = FV.R;
  WV.wild = WILD_SPOTS.map(([k, x, z, r, area], i) => {
    const D = WILD_DEF[k], node = fnode(fmesh("wild:" + k, D.mesh), { x, z, s: D.s, ry: i, visible: false, alpha: 0 });
    R.nodes.push(node);
    return { k, D, home: [x, z], r, area, node, x, z, tx: x, tz: z, wait: Math.random() * 4, flee: 0, f: 0, i };
  });
  WV.fly = FLY_SPOTS.map(([k, x, z, r, h, area, g], i) => {
    const D = FLY_DEF[k];
    const body = fnode(fmesh("fly:" + k, D.mesh), { s: D.s, visible: false, alpha: 0 });
    const wl = R.addChild(body, fnode(fmesh("flyW:" + k, D.wing), {}));
    const wr = R.addChild(body, fnode(fmesh("flyW:" + k, D.wing), { sx: -1 }));
    R.nodes.push(body);
    const sp = (k === "owl" ? 0.2 : k === "bat" ? 1.05 : 0.5) + (i % 3) * 0.07;
    return { k, D, body, wl, wr, c: [x, z], cc: [x, z], r, h, area, g, a: i * 1.7, sp, f: 0, scare: 0, i };
  });
}
function wildHome(w) {
  const a = Math.random() * 6.28, d = Math.random() * w.r;
  w.x = w.tx = w.home[0] + Math.cos(a) * d; w.z = w.tz = w.home[1] + Math.sin(a) * d;
  w.node.x = w.x; w.node.z = w.z; w.node.ry = Math.random() * 6.28; w.node.rx = 0;
  w.wait = 1 + Math.random() * 3; w.flee = 0; w.leave = 0;
}
function stepWild(dt, time) {
  const cam = FV.R.cam, h = (S.time % 1440) / 60, fade = dt / 1.5;
  for (const w of WV.wild) {
    const on = wildPres("w" + w.i, dt, wildWin(w.D.win, h) && (!w.area || farmAreaOpen(w.area)));
    if (on && w.f <= 0) wildHome(w);
    if (on) w.leave = 0;
    /* geht es, läuft es noch ein Stück davon und verblasst dabei */
    if (!on && w.f > 0 && !w.leave) {
      w.leave = 1; w.wait = 0;
      const a = Math.random() * 6.28; w.tx = w.x + Math.cos(a) * 5; w.tz = w.z + Math.sin(a) * 5;
    }
    w.f = on ? Math.min(1, w.f + fade) : Math.max(0, w.f - fade);
    const show = w.f > 0 && Math.abs(w.x - cam.tx) < 70 && Math.abs(w.z - cam.tz) < 70;
    w.node.visible = show; w.node.alpha = w.f;
    if (!show) continue;
    if (w.wait > 0 && !w.flee && !w.leave) {
      w.wait -= dt;
      w.node.y = 0;
      if (w.k === "deer") w.node.rx = Math.sin(time * 0.8 + w.i) > 0.6 ? 0.18 : 0;     /* grast */
      if (w.k === "heron") w.node.rx = Math.sin(time * 0.5 + w.i) > 0.85 ? 0.3 : 0;   /* späht ins Wasser */
      if (w.wait <= 0) {
        const a = Math.random() * 6.28, d = Math.random() * w.r;
        w.tx = w.home[0] + Math.cos(a) * d; w.tz = w.home[1] + Math.sin(a) * d;
      }
      continue;
    }
    const dx = w.tx - w.x, dz = w.tz - w.z, dist = Math.hypot(dx, dz);
    const sp = (w.flee > 0 ? w.D.run : w.D.sp) * dt;
    if (w.flee > 0) w.flee -= dt;
    if (dist < sp || dist < 0.05) { w.wait = (w.D.still ? 6 : 2) + Math.random() * (w.D.still ? 9 : 5); w.flee = 0; w.node.rx = 0; continue; }
    w.x += dx / dist * sp; w.z += dz / dist * sp;
    w.node.x = w.x; w.node.z = w.z; w.node.rx = 0;
    w.node.ry = Math.atan2(dx, dz);
    w.node.y = w.D.hop ? Math.abs(Math.sin(time * (w.flee > 0 ? 14 : 9) + w.i)) * 0.12 : Math.abs(Math.sin(time * 8 + w.i)) * 0.02;
  }
  /* Vögel kreisen über dem Wald – beim Schatz über der Fundstelle (nachts die Eulen) */
  const ev = S.farm.ev && S.farm.ev.cur, sch = ev && ev.k === "schatz" && !ev.data.done ? ev.data : null;
  const grp = {}, sk = wildWin(FLY_DEF.bird.win, h) ? "bird" : "owl";   /* nachts kreisen die Eulen */
  for (const b of WV.fly) {
    if (grp[b.g] == null) grp[b.g] = wildPres("g" + b.g, dt, wildWin(b.D.win, h));
    const isB = b.k === "bird", treasure = !!sch && b.k === sk;
    const on = treasure || (grp[b.g] && (!b.area || farmAreaOpen(b.area)));
    /* ganz weg: beim nächsten Mal woanders auftauchen */
    if (!on && b.f <= 0 && isB && !sch && Math.random() < dt * 0.5) { b.c = pick(FWORLD.clearings).slice(0, 2); b.cc = b.c.slice(); }
    b.f = on ? Math.min(1, b.f + fade) : Math.max(0, b.f - fade);
    const tc = treasure ? [sch.x, sch.z] : b.c;
    const mv = Math.min(1, dt * 0.8);
    b.cc[0] += (tc[0] - b.cc[0]) * mv; b.cc[1] += (tc[1] - b.cc[1]) * mv;
    const c = b.cc, B = b.body, ox = B.x, oz = B.z;
    if (b.scare > 0) b.scare -= dt;
    const boost = b.scare > 0 ? 2.6 : 1;
    b.a += dt * b.sp * (treasure ? 1.4 : 1) * boost;
    if (b.k === "bat") {
      /* Fledermäuse: zackiger Zickzackflug */
      B.x = c[0] + Math.cos(b.a) * b.r + Math.sin(b.a * 2.7 + b.i) * 1.3;
      B.z = c[1] + Math.sin(b.a) * b.r + Math.cos(b.a * 3.1 + b.i) * 1.1;
      B.y = b.h + Math.sin(b.a * 4.3 + b.i) * 0.6 + (b.scare > 0 ? 1.5 : 0);
      const f = Math.sin(time * 26 + b.i) * 0.95;
      b.wl.rz = f; b.wr.rz = -f;
    } else {
      const r = treasure ? 2.2 + (b.i % 3) * 0.6 : b.r;
      B.x = c[0] + Math.cos(b.a) * r; B.z = c[1] + Math.sin(b.a) * r;
      B.y = (treasure ? 4 : b.h) + Math.sin(time * (b.k === "owl" ? 0.7 : 1.3) + b.i) * 0.3 + (b.scare > 0 ? 1.2 : 0);
      /* Eulen: ein paar Flügelschläge, dann lautlos gleiten */
      const f = b.k === "owl" ? ((time * 0.45 + b.i) % 3 < 1 || b.scare > 0 ? Math.sin(time * 7 + b.i) * 0.55 : 0.06) : Math.sin(time * 12 + b.i) * 0.6;
      b.wl.rz = f; b.wr.rz = -f;
    }
    if (Math.hypot(B.x - ox, B.z - oz) > 1e-4) B.ry = Math.atan2(B.x - ox, B.z - oz);
    B.alpha = b.f;
    B.visible = b.f > 0 && Math.abs(B.x - cam.tx) < 70 && Math.abs(B.z - cam.tz) < 70;
  }
}
/* Haustiere laufen die Hofwege ab */
const PET_WAY = [[5, 12], [5, 6], [5, 0], [5, -7.5], [-1, -7.5], [-7, -7.5], [-12, -7.5]];
function worldSyncPets() {
  const R = FV.R, own = {};
  FCOSMETIC.filter(c => c.pet && farmCos(c.id)).forEach(c => { own[c.pet] = 1; });
  for (const [k, p] of WV.pets) if (!own[k]) { const i = R.nodes.indexOf(p.node); if (i >= 0) R.nodes.splice(i, 1); WV.pets.delete(k); }
  Object.keys(own).forEach((k, i) => {
    if (WV.pets.has(k)) return;
    const fn = k === "hund" ? FWM.dog : k === "katze" ? FWM.cat : FWM.goat;
    const j = i * 2 % PET_WAY.length, node = fnode(fmesh("pet:" + k, fn), { x: PET_WAY[j][0], z: PET_WAY[j][1], s: 1.4 });
    R.nodes.push(node);
    WV.pets.set(k, { node, i: j, to: j, x: PET_WAY[j][0], z: PET_WAY[j][1], wait: 1 + i, sp: k === "hund" ? 1.8 : k === "katze" ? 1.1 : 0.8 });
  });
}
function stepPets(dt, time) {
  for (const [k, p] of WV.pets) {
    if (p.wait > 0) { p.wait -= dt; p.node.y = 0; if (p.wait <= 0) p.to = clamp(p.i + (Math.random() < 0.5 ? -1 : 1), 0, PET_WAY.length - 1); continue; }
    const t = PET_WAY[p.to], dx = t[0] + (k === "katze" ? 0.5 : -0.4) - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz), s = p.sp * dt;
    if (d < s) { p.i = p.to; p.wait = Math.random() < 0.3 ? 4 + Math.random() * 6 : 0.4; continue; }
    p.x += dx / d * s; p.z += dz / d * s;
    p.node.x = p.x; p.node.z = p.z; p.node.ry = Math.atan2(dx, dz);
    p.node.y = Math.abs(Math.sin(time * 10 + p.sp)) * 0.03;
  }
}
/* Mitarbeiter stehen bei der Arbeit */
const STAFF_LOOK = {
  fahrer: { shirt: 0x2f6fb0, hat: "muetze", at: () => [8.2, 12] }, farmer: { shirt: 0x6a9a3a, hat: "hut", at: () => [-0.8, -2.2] },
  mechaniker: { shirt: 0x3a4a6a, hat: "helm", at: () => [-24.5, -27] }, holzfaeller: { shirt: 0xc8443a, hat: "helm", tool: "axt", at: () => [-20, -11] },
  fischer: { shirt: 0x3a6a7a, hat: "muetze", at: () => [-1.2, 26.2] }
};
function worldSyncStaff() {
  const R = FV.R, F = S.farm, ids = new Set((F.staff || []).map(s => s.id));
  for (const [id, n] of WV.staff) if (!ids.has(id)) { const i = R.nodes.indexOf(n.node); if (i >= 0) R.nodes.splice(i, 1); WV.staff.delete(id); }
  (F.staff || []).forEach((s, i) => {
    if (WV.staff.has(s.id)) return;
    const L = STAFF_LOOK[s.role] || STAFF_LOOK.farmer, p = L.at();
    const node = fnode(fmesh("staff:" + s.role, () => FWM.person({ shirt: L.shirt, hat: L.hat, tool: L.tool, seed: 10 + i })), { x: p[0] + (i % 2) * 0.8, z: p[1] + Math.floor(i / 2) * 0.7, ry: 0.6 + i, s: 1.3 });
    R.nodes.push(node);
    WV.staff.set(s.id, { node, ph: i });
  });
}

/* ------------------------------ Ereignisse -------------------------------- */
function worldEvKey() { const c = S.farm.ev && S.farm.ev.cur; return c ? c.k + ":" + c.t0 + ":" + (c.data.done ? 1 : 0) + ":" + (c.data.spots ? c.data.spots.filter(x => x.done).length : "") : ""; }
function worldSyncEvents() {
  const key = worldEvKey(), R = FV.R;
  if (key === WV.evKey) return;
  WV.evKey = key;
  WV.evNodes.forEach(n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
  WV.evNodes = [];
  const c = S.farm.ev && S.farm.ev.cur;
  if (!c || c.data.done) return;
  const add = (mesh, o) => { const n = fnode(mesh, o); R.nodes.push(n); WV.evNodes.push(n); return n; };
  if (c.k === "haendler") { add(fmesh("tvan", () => FM.van(0xf2a531)), { x: 10, z: 18.6, ry: -Math.PI / 2 }); add(fmesh("trader", () => FWM.person({ shirt: 0x8a3ac8, hat: "hut", seed: 7 })), { x: 9.6, z: 17.2, s: 1.3 }); }
  if (c.k === "nachbar") add(fmesh("npc:saege", () => FWM.person(NPC_LOOK.saege)), { x: -20.5, z: -19.4, ry: 0.4, s: 1.35 });
  if (c.k === "hirsch") add(fmesh("stag", () => FWM.deer(true)), { x: c.data.x, z: c.data.z, s: 1.25, glow: 0.35 });
  if (c.k === "reh") add(fmesh("wild:deer", () => FWM.deer(false)), { x: c.data.x, z: c.data.z, s: 1.0, ry: 1 });
  if (c.k === "lieferung") add(fmesh("parcel", () => { const b = new FM.MB(); b.box(0.7, 0.5, 0.55, 0xc9955a, { top: 0xd8a868 }); b.box(0.72, 0.08, 0.1, 0xd8332b, { y: 0.42 }); b.box(0.1, 0.08, 0.57, 0xd8332b, { y: 0.42 }); return b; }), { x: c.data.x, z: c.data.z, ry: 0.4 });
  if (c.k === "schatz") add(fmesh("mound", () => { const b = new FM.MB(); b.ico(0.5, 0x8a6a44, { y: 0.05, flat: 0.3, jitter: 0.4 }); b.box(0.05, 0.6, 0.05, FM.C.woodD, { x: 0.3, rz: 0.4 }); return b; }), { x: c.data.x, z: c.data.z });
  if (c.k === "pilze") c.data.spots.forEach((s, i) => { if (!s.done) add(fmesh("evmush", () => FWM.mushrooms(false)), { x: s.x, z: s.z, s: 1.6, ry: i }); });
}
/* Wo sitzt das Ereignis? Für Blase und Kamera */
function worldEvSpots() {
  const c = S.farm.ev && S.farm.ev.cur;
  if (!c || c.data.done || S.time >= c.until) return [];
  const D = FEVENTS[c.k];
  switch (c.k) {
    case "haendler": return [{ x: 9.8, y: 2.2, z: 17.8, ic: "🧑‍💼", act: "haendler" }];
    case "nachbar": return [{ x: -20.5, y: 2.3, z: -19.4, ic: "👴💬", act: "nachbar" }];
    case "hirsch": return [{ x: c.data.x, y: 2.4, z: c.data.z, ic: "🦌✨", act: "hirsch", area: "wald" }];
    case "reh": return [{ x: c.data.x, y: 1.9, z: c.data.z, ic: "🦌", act: "reh" }];
    case "lieferung": return [{ x: c.data.x, y: 1.1, z: c.data.z, ic: "📦", act: "lieferung" }];
    case "schatz": return [{ x: c.data.x, y: 1.4, z: c.data.z, ic: "🗝️", act: "schatz" }];
    case "pilze": return c.data.spots.map((s, i) => s.done ? null : { x: s.x, y: 0.9, z: s.z, ic: "🍄", act: "pilz", i }).filter(Boolean);
    case "schwarm": { const g = FGROUNDS.find(q => q.id === c.data.g); return g ? [{ x: g.x, y: 1.2, z: g.z, ic: "🐟", act: "schwarm" }] : []; }
    case "defekt": { const h = farmObj1("sw_halle"); if (!h) return []; const [x, z] = farmCenter(h); return [{ x, y: 5.2, z, ic: "⚠️", act: "defekt", cls: "hungry" }]; }
  }
  return D ? [] : [];
}
function worldEvAct(s) {
  const c = S.farm.ev && S.farm.ev.cur;
  if (!c) return;
  const p = FV.R.project(s.x, s.y, s.z) || [FV.R.w / 2, FV.R.h / 2];
  const reward = (r, x, y) => {
    if (!r) return;
    if (r.clover) farmCloverFlyAt(x, y, r.clover);
    if (r.xp) xpFly(x, y - 10, r.xp, 150);
    if (r.m) coinFly(x, y, r.m);
    if (r.item) flyItem(FITEMS[r.item].i, x, y, storeBtn(), 250, r.n || 1);
    sfx("collect"); save(); farmSyncScene(); renderFarmUI();
  };
  switch (s.act) {
    case "haendler": openTrader(); break;
    case "nachbar": openNeighbor(); break;
    case "hirsch": case "reh": case "lieferung": {
      const r = farmEvReward(s.act);
      if (r) { floatText(p[0], p[1] - 20, s.act === "hirsch" ? "Ein Glücksbringer!" : s.act === "reh" ? "Wie friedlich …" : "Ein Paket für dich!", "gold"); reward(r, p[0], p[1]); }
      break;
    }
    case "schatz":
      MG.open("dig", {}, res => { if (res && res.ok) { const r = farmEvReward("schatz"); if (r) { floatText(p[0], p[1] - 20, "Ein Schatz!", "gold"); reward(r, p[0], p[1]); } } });
      break;
    case "pilz": { const r = farmMushroom(s.i); if (r) { flyItem("🍄", p[0], p[1], storeBtn(), 0, 1); xpFly(p[0], p[1], r.xp); sfx("collect"); save(); farmSyncScene(); } break; }
    case "schwarm": if (typeof openFishingAt === "function") openFishingAt(c.data.g); break;
    case "defekt": {
      const h = farmObj1("sw_halle");
      MG.open("gears", { quick: true, title: "Die Säge klemmt!" }, res => { if (res && res.ok && h) { farmMachFix(h); farmXP(10); sfx("collect"); floatText(p[0], p[1], "Läuft wieder!", "gold"); xpFly(p[0], p[1], 10); save(); farmSyncScene(); } });
      break;
    }
  }
}

/* ------------------------------ Wetter ------------------------------------ */
function worldEnv(E) {
  if (!S.farm || !S.farm.wx) return;
  const wx = S.farm.wx.k, storm = farmEvOn("sturm");
  const dim = storm ? 0.5 : wx === "regen" ? 0.66 : wx === "wolken" ? 0.82 : wx === "nebel" ? 0.78 : 1;
  if (dim < 1) { E.sunCol = E.sunCol.map(v => v * dim); E.sky = E.sky.map(v => v * (0.8 + dim * 0.2)); }
  if (wx === "nebel" && !storm) {
    E.fog = E.fog.map(v => v * 0.85 + 0.12);
    E.fogR = [FV.R.cam.dist * 0.55 + 4, FV.R.cam.dist * 1.5 + 16];
  }
  if (storm || wx === "regen") E.fog = E.fog.map(v => v * 0.88 + 0.04);
}
function stepWeather(dt, time) {
  const F = S.farm;
  if (!F.wx) return;
  const storm = farmEvOn("sturm"), rain = storm || F.wx.k === "regen";
  WV.gust += ((storm ? 1 : 0) - WV.gust) * Math.min(1, dt * 0.8);
  if (rain) {
    const c = FV.R.cam, n = Math.round((storm ? 420 : 260) * dt), r = 12 + c.dist * 0.45;
    for (let i = 0; i < n; i++) FV.R.emit({ x: c.tx + (Math.random() - 0.5) * r * 2, y: 7 + Math.random() * 3, z: c.tz + (Math.random() - 0.5) * r * 2, vx: storm ? -3 : -0.6, vy: -15, life: 0.55, size: 0.035, col: [0.78, 0.85, 0.98, 0.5], fade: false });
  }
  if (storm && Math.random() < dt * 2) {
    const c = FV.R.cam;
    FV.R.emit({ x: c.tx + (Math.random() - 0.5) * 20, y: 3, z: c.tz + (Math.random() - 0.5) * 20, vx: -4, vy: 0.5, vz: 1, life: 2, size: 0.08, col: [0.45, 0.62, 0.25, 1], g: -0.6, shape: 1 });
  }
  if (WV.gust > 0.05) for (const e of WV.trees.values()) if (e.node.sway) e.node.sway = 0.22 + WV.gust * 0.9;
}

/* --------------------------- Antippen ------------------------------------ */
function pickObjT(x, y) {
  const R = FV.R, r = R.ray(x, y);
  let best = null, bt = 1e9;
  for (const o of S.farm.objs) {
    const [w, d] = farmSize(o), [cx, cz] = farmCenter(o), h = objH(o);
    const t = R.hitBox(r, [cx - w / 2, 0, cz - d / 2], [cx + w / 2, h, cz + d / 2]);
    if (t != null && t < bt - (o.t === "field" || o.t === "deco" ? 0.4 : 0)) { bt = t; best = o; }
  }
  return best ? { o: best, d: bt } : null;
}
/* Gebiet unter dem Finger, falls dort gesperrt */
function lockedAreaAt(x, z) {
  for (const id of FAREA_ORDER) {
    if (farmAreaOpen(id)) continue;
    if (FAREAS[id].locks.some(r => x > r[0] && x < r[2] && z > r[1] && z < r[3])) {
      /* das innerste Gebiet gewinnt (Sägewerk und alter Wald liegen im Wald) */
      const inner = FAREA_ORDER.slice().reverse().find(k => !farmAreaOpen(k) && FAREAS[k].locks.some(r => x > r[0] && x < r[2] && z > r[1] && z < r[3]));
      return inner || id;
    }
  }
  return null;
}
function worldTap(x, y) {
  const R = FV.R;
  /* Ereignisse und Besucher zuerst (großzügige Fläche um die Figur) */
  const near = (wx, wy, wz, px) => { const p = R.project(wx, wy, wz); return p && Math.hypot(p[0] - x, p[1] - y) < px; };
  for (const s of worldEvSpots()) if ((!s.area || farmAreaOpen(s.area)) && near(s.x, s.y * 0.5, s.z, 44)) { worldEvAct(s); return true; }
  if (WV.npc && near(WV.npc.node.x, 1.2, WV.npc.node.z, 46)) { const id = worldVisitor(); if (id) openAreaVisit(id); return true; }
  const ho = pickObjT(x, y), ht = pickTree(x, y);
  /* Wildtiere nur, wenn nichts anderes getroffen wurde */
  if (!ho && !ht) for (const w of WV.wild) if (w.node.visible && w.f > 0.5 && near(w.x, 0.4, w.z, 30)) {
    w.flee = 1.8; w.wait = 0;
    const a = Math.atan2(w.z - R.cam.tz, w.x - R.cam.tx) + (Math.random() - 0.5);
    w.tx = w.x + Math.cos(a) * 6; w.tz = w.z + Math.sin(a) * 6;
    sfx("pop");
    if (!w.seen) { w.seen = true; farmXP(1); xpFly(x, y, 1); }
    return true;
  }
  /* Eulen und Fledermäuse lassen sich aufscheuchen */
  if (!ho && !ht) for (const b of WV.fly) if (b.k !== "bird" && b.body.visible && b.f > 0.5 && near(b.body.x, b.body.y, b.body.z, 30)) {
    b.scare = 2.5;
    sfx("pop");
    if (!b.seen) { b.seen = true; farmXP(1); xpFly(x, y, 1); }
    return true;
  }
  if (ht && (!ho || ht.d < ho.d - 0.2)) { worldTreeTap(ht.t, x, y); return true; }
  if (ho) {
    const o = ho.o;
    if (o.area && !farmAreaOpen(o.area)) { openAreaInfo(o.area); return true; }
    return false;
  }
  const g = R.ground(x, y, 0);
  if (g) { const id = lockedAreaAt(g[0], g[2]); if (id) { openAreaInfo(id); return true; } }
  return false;
}
function worldTreeTap(t, x, y) {
  if (t.area && !farmAreaOpen(t.area)) { openAreaInfo(t.area); return; }
  sfx("tap");
  const e = WV.trees.get(t.id);
  if (e) e.pop = wnow();
  closeFarmPop();
  FV.sel = null;
  FV.pop = { id: -1, kind: "wtree", tree: t.id };
  renderFarmPop();
  popFresh();
}
/* Blase über Bäumen */
function treePopHTML(t) {
  treeUpdate(t);
  const S0 = FSPECIES[t.sp], Z = FTREE_SIZE[t.sz] || FTREE_SIZE[1];
  if (t.st === "stump") return `<div class="fp-h">🪵 ${esc(S0.n)}nstumpf<small>Ein Setzling treibt aus in ${fdur(Math.max(1, t.t - S.time))}</small></div>`;
  if (t.st === "sapling") return `<div class="fp-h">🌱 ${esc(S0.n)}-Setzling<small>wird ein Baum in ${fdur(Math.max(1, t.t - S.time))}</small></div>`;
  if (t.st === "fallen") return `<div class="fp-h">🌪️ ${esc(S0.n)} – vom Sturm umgeworfen<small>${fqty(S0.log, Z.logs)} und Äste liegen bereit</small></div>
    <div class="fp-row"><div class="ftool big" data-act="takefallen"><span class="ic">🪵</span><b>Aufsammeln</b><small>ohne Fällen</small></div></div>`;
  const tool = treeTool(t), saw = tool === "saw", lvAxe = S.farm.tools.axe || 1;
  const staCost = saw ? Math.round(4 * Z.sta) : Math.round(5 * Z.sta);
  const grow = t.t && t.sz < t.mx ? ` · wächst: ${FTREE_SIZE[t.sz + 1].n} in ${fdur(Math.max(1, t.t - S.time))}` : "";
  const yieldT = fqty(S0.log, Z.logs) + " · " + fqty("aeste", Z.aeste) + (saw ? " · Holzreste" : "");
  const sta = farmSta();
  const btn = tool
    ? `<div class="ftool big${sta < Math.min(staCost, 6) ? " tired" : ""}" data-act="fell"><span class="ic">${saw ? "🪚" : "🪓"}</span><b>${saw ? "Sägen" : "Fällen"}</b><small>💪 ${staCost}${saw ? " · ⛽ " + eur(FSAW_FUEL[S.farm.tools.saw]) : ""}</small></div>`
    : `<div class="ftool lock"><span class="ic">🔒</span><b>${esc(treeNeedText(t))}</b><small>im Laden</small></div><div class="ftool" data-act="toolshop"><span class="ic">🛒</span><b>Werkzeug</b><small>ansehen</small></div>`;
  return `<div class="fp-h">${S0.rare ? "💎" : t.sp === "birke" ? "🌳" : t.sp === "eiche" ? "🌰" : t.sp === "buche" ? "🍂" : "🌲"} ${esc(S0.n)} · ${esc(Z.n)}<small>${esc(yieldT)}${grow}</small></div>
    <div class="fp-row">${btn}${tool && sta < staCost ? `<div class="ftool" data-act="food"><span class="ic">🥪</span><b>Brotzeit</b><small>💪 ${Math.floor(sta)}/${farmStaMax()}</small></div>` : ""}</div>
    ${S0.rare ? `<div class="fp-tip">Seltene Wildkirsche: aus ihr wird kostbares Edelholz.</div>` : t.sz >= 4 ? `<div class="fp-tip">Eine uralte Eiche – manchmal steckt Edelholz drin.</div>` : ""}`;
}
function renderTreePop(el, P) {
  const t = farmTree(P.tree);
  if (!t) return closeFarmPop();
  el.className = "on";
  el.innerHTML = `<div class="fp-box">${treePopHTML(t)}</div>`;
  el.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
    const a = b.dataset.act;
    if (a === "fell") worldFell(t);
    if (a === "takefallen") {
      const r = farmTakeFallen(t);
      if (r) { const [sx, sy] = treeScreen(t, 0.2); flyItem(FITEMS[r.id].i, sx, sy, storeBtn(), 0, r.n); xpFly(sx, sy, r.xp, 120); sfx("collect"); closeFarmPop(); worldSyncTrees(); save(); }
    }
    if (a === "toolshop") { closeFarmPop(); openFarmShop("werkzeug"); }
    if (a === "food") { closeFarmPop(); openFood(); }
  });
  positionTreePop(el, P);
}
function positionTreePop(el, P) {
  const t = farmTree(P.tree), box = el.firstChild;
  if (!t || !box || !FV.R) return;
  const p = FV.R.project(t.x, treeH(t), t.z);
  if (!p) return;
  const w = box.offsetWidth, hgt = box.offsetHeight, W = FV.R.w, H = FV.R.h;
  let x = clamp(p[0] - w / 2, 8, W - w - 8), y = p[1] - hgt - 24;
  if (y < 56) y = Math.min(H - hgt - 8, p[1] + 40);
  y = clamp(y, 8, Math.max(8, H - hgt - 8));
  box.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  if ((t.st === "stump" || t.st === "sapling") && t.t && S.time >= t.t) { treeUpdate(t); worldSyncTrees(); renderTreePop(el, P); }
}
/* Pop-Inhalte für Gerümpel (kommt aus renderFarmPop) */
function worldPopHTML(o, P) {
  if (P.kind === "junk") {
    const J = FJUNK[o.k] || FJUNK.unkraut;
    return `<div class="fp-h">${J.i} ${esc(J.n)}<small>Aufräumen bringt ${Object.keys(J.gain).map(id => fqty(id, J.gain[id])).join(", ")}${J.m ? " und " + eur(J.m) + " vom Schrotthändler" : ""} · +5 EP</small></div>
      <div class="fp-row"><div class="ftool big" data-act="clear"><span class="ic">🧹</span><b>Wegräumen</b><small>💪 ${J.sta}</small></div></div>`;
  }
  return "";
}
function worldPopAct(a, o) {
  if (a === "clear") {
    const [x, y] = objScreen(o);
    puff(o);
    const r = farmClearJunk(o);
    if (!r) { sfx("bad"); toast("💪 Zu erschöpft – erst eine Brotzeit (oben auf 💪 tippen).", "warn"); return; }
    r.got.forEach((g, i) => flyItem(FITEMS[g.id].i, x, y, storeBtn(), i * 100, g.n));
    if (r.m) coinFly(x, y, r.m);
    xpFly(x, y - 10, r.xp, 120);
    sfx("swish");
    closeFarmPop(); FV.sel = null;
    farmSyncScene(); save();
  }
}
/* Fällen: Werkzeug, Platz und Sprit prüfen, dann das Minispiel */
function worldFell(t) {
  const tool = treeTool(t);
  if (!tool) return toast("Dafür brauchst du " + treeNeedText(t) + " – im Laden unter „Werkzeug“.", "warn");
  if (farmRoom(FSPECIES[t.sp].log) < 1) { farmFull("holz"); farmViewFull("holz"); return toast("🪵 Der Holzplatz ist voll – verkauf Holz an den Holzhändler oder bau ihn aus.", "warn"); }
  const F = S.farm, Z = FTREE_SIZE[t.sz];
  if (tool === "saw") {
    const fuel = FSAW_FUEL[F.tools.saw] || 3;
    if (S.money < fuel) return toast("⛽ Für den Sprit fehlt das Geld.", "warn");
    if (!farmStaUse(Math.round(4 * Z.sta))) { openFood(); return toast("💪 Zu erschöpft für die Säge – erst eine Brotzeit.", "warn"); }
    S.money -= fuel; S.expense += fuel;
    logMoney("farm", "Sprit · Kettensäge", -fuel);
  } else if (farmSta() < Z.sta) { openFood(); return toast("💪 Zu erschöpft – erst eine Brotzeit.", "warn"); }
  closeFarmPop();
  /* Baum oben im Bild, das Minispiel unten */
  const port = innerHeight > innerWidth;
  farmFocusXZ(t.x + (port ? 2.6 : 1.2), t.z + (port ? 2.6 : 1.2), port ? 23 : 19, 500);
  MG.open(tool === "saw" ? "saw" : "axe", { tree: t }, res => {
    if (!res || !res.ok) { save(); return; }
    const r = farmFell(t, { acc: res.acc, tool, dirOk: res.dirOk, hung: res.hung });
    if (!r) return;
    worldTreeFall(t, res.dir);
    const [sx, sy] = treeScreen(t, 0.5);
    r.got.forEach((g, i) => flyItem(FITEMS[g.id].i, sx, sy, storeBtn(), 700 + i * 120, g.n));
    xpFly(sx, sy - 10, r.xp, 650);
    floatText(sx, sy - 40, res.acc > 0.85 ? "Sauber gefällt! +1 Stamm" : tool === "saw" && res.dirOk ? "Perfekte Fallrichtung!" : "Holz!", res.acc > 0.85 || res.dirOk ? "gold" : "");
    sfx("collect");
    save(); renderFarmUI();
  });
}

/* ------------------------------ Kamera ------------------------------------ */
function farmFocusXZ(x, z, dist, ms) {
  if (!FV.R) return;
  const c = FV.R.cam, s = { tx: c.tx, tz: c.tz, d: c.dist }, e = { tx: x, tz: z, d: dist || c.dist };
  const t0 = performance.now(), id = (FV.focusId || 0) + 1, dur = ms || 650;
  FV.focusId = id; FV.focusing = true;
  const step = () => {
    if (FV.focusId !== id) return;
    const k = Math.min(1, (performance.now() - t0) / dur), f = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    c.tx = s.tx + (e.tx - s.tx) * f; c.tz = s.tz + (e.tz - s.tz) * f; c.dist = s.d + (e.d - s.d) * f;
    clampCam();
    if (k < 1) requestAnimationFrame(step); else FV.focusing = false;
  };
  step();
}
function worldGo(id) {
  const A = AREA_SPOTS[id];
  if (!A) return;
  if (id !== "hof" && !farmAreaOpen(id)) {
    const v = worldVisitor();
    if (v === id) return openAreaVisit(id);
    if (A.peek) farmFocusXZ(A.peek[0], A.peek[1], 34, 900);
    return openAreaInfo(id);
  }
  sfx("pop");
  farmFocusXZ(A.at[0], A.at[1], A.d, 900);
}

/* --------------------------- Blasen (Tags) -------------------------------- */
function worldTags() {
  const box = $("#farmTags");
  if (!box || !FV.R) return;
  const want = [];
  worldEvSpots().forEach((s, i) => { if (!s.area || farmAreaOpen(s.area)) want.push(["e" + i + s.act, s.x, s.y, s.z, s.ic, s.cls || "ready", () => worldEvAct(s)]); });
  if (WV.npc && worldVisitor()) want.push(["npc", WV.npc.node.x, 2.6, WV.npc.node.z, FAREAS[WV.npc.id].whoI + "❗", "ready", () => openAreaVisit(WV.npc.id)]);
  const F = S.farm;
  F.objs.forEach(o => {
    if (o.area && !farmAreaOpen(o.area)) return;
    const [cx, cz] = farmCenter(o);
    if (o.t === "stall" || o.t === "f_markt") {
      const St = stallState(o.t === "f_markt");
      const sold = St.slots.filter(it => it && it.sold).length;
      if (sold) want.push(["st" + o.id, cx, objH(o) + 0.4, cz, "💰<b>" + sold + "</b>", "ready", () => openStall(o.t === "f_markt")]);
    }
    if (o.t === "f_plot" && farmFishBuildCheck(o.k) === true) want.push(["pl" + o.id, cx, 1.3, cz, "🔨" + FFISHERY[o.k].i, "ready", () => openPlot(o)]);
    if (o.t === "sw_halle" && farmAreaOpen("saege") && !sawRepaired()) { const r = sawNext(); if (r && farmRepairCheck(r) === true) want.push(["rp", cx, 5, cz, "🔧" + r.i, "ready", () => openSawRepair()]); }
    if (o.t === "sw_lkw" && farmAreaOpen("saege") && !(F.saw && F.saw.lkw) && farmRepairCheck(FSAW_LKW) === true) want.push(["lkw", cx, 2.6, cz, "🔧🚛", "ready", () => openLkw()]);
  });
  (F.trees || []).forEach(t => { if (t.st === "fallen" && treeOpen(t)) want.push(["tf" + t.id, t.x, 1.2, t.z, "🪵", "ready", () => worldTreeTap(t)]); });
  const keep = new Set();
  want.forEach(([k, x, y, z, html, cls, fn]) => {
    keep.add(k);
    let el = WV.tagEls && WV.tagEls.get(k);
    if (!WV.tagEls) WV.tagEls = new Map();
    if (!el) {
      el = document.createElement("button");
      el.className = "ftag wtag " + cls;
      box.appendChild(el);
      WV.tagEls.set(k, el);
    }
    el.onclick = fn;
    if (el._h !== html) { el.innerHTML = html; el._h = html; el.className = "ftag wtag " + cls; }
    const p = FV.R.project(x, y, z);
    if (!p || p[0] < -40 || p[1] < -40 || p[0] > FV.R.w + 40 || p[1] > FV.R.h + 40) { el.style.display = "none"; return; }
    el.style.display = "";
    el.style.transform = `translate(${Math.round(p[0])}px,${Math.round(p[1])}px)`;
  });
  if (WV.tagEls) for (const [k, el] of WV.tagEls) if (!keep.has(k)) { el.remove(); WV.tagEls.delete(k); }
}

/* ------------------- Fertig? Dann leicht gelb umrandet ---------------------- */
function objReady(o) {
  if (o.area && !farmAreaOpen(o.area)) return false;
  if (o.t === "field") return fieldState(o) === "ripe";
  if (o.t === "tree") return treeRipe(o);
  if (o.animals && o.animals.length) return o.animals.some(a => aniState(a) === "ready");
  if ((o.t === "stall" || o.t === "f_markt") && stallState(o.t === "f_markt").slots.some(it => it && it.sold)) return true;
  if (o.q && o.done) { machUpdate(o); return o.done.length > 0; }
  if (o.t === "board") return farmOrders().some(farmOrderReady);
  return false;
}
function stepOutline(time) {
  if (!WV.readyAt || time - WV.readyAt > 0.35) {
    WV.readyAt = time;
    WV.ready = new Set(S.farm.objs.filter(objReady).map(o => o.id));
  }
  const a = 0.74 + Math.sin(time * 3.2) * 0.18;
  for (const o of S.farm.objs) {
    const e = FV.nodes.get(o.id);
    if (!e) continue;
    if (WV.ready.has(o.id) && !(FV.place && FV.place.move && FV.place.move.id === o.id)) {
      const ol = e.node.outline || (e.node.outline = [1, 0.84, 0.24, a, o.t === "field" ? 0.11 : 0.15]);
      ol[3] = a;
    } else e.node.outline = null;
  }
}

/* ------------------------------ Takt -------------------------------------- */
function worldBusy() { return !!(WV.falling.length || WV.reveal || WV.dust || (typeof MG !== "undefined" && MG.on) || (S.farm && S.farm.wx && (S.farm.wx.k === "regen" || farmEvOn("sturm")))); }
function worldStep(dt, time) {
  if (!S.farm) return;
  stepFalling();
  stepReveal(dt);
  stepWild(dt, time);
  stepPets(dt, time);
  stepWeather(dt, time);
  const now = wnow();
  /* Baum wippt nach dem Antippen oder wenn er gewachsen ist */
  for (const [id, e] of WV.trees) {
    if (e.pop && !e.falling) {
      const k = Math.max(0, 1 - (now - e.pop) * 2.4);
      const s = Math.sin((now - e.pop) * 20) * 0.06 * k, t = farmTree(id), b = (t && t.s) || 1;
      e.node.sy = b * (1 + s); e.node.sx = e.node.sz = b * (1 - s * 0.5);
      if (!k) { e.pop = 0; e.node.sx = e.node.sy = e.node.sz = b; }
    }
  }
  if (WV.hit) {
    const e = WV.trees.get(WV.hit.id), k = Math.max(0, 1 - (now - WV.hit.t0) * 3.5);
    if (e && !e.falling) { e.node.rz = Math.sin((now - WV.hit.t0) * 38) * 0.05 * k; if (!k) { e.node.rz = 0; WV.hit = null; } } else WV.hit = null;
  }
  /* Sägeblätter fahren auf und ab, wenn die Halle arbeitet */
  const hall = farmObj1("sw_halle");
  if (hall) {
    const e = FV.nodes.get(hall.id);
    if (e && e.parts.blades) { const run = hall.q && hall.q.length && !hall.broken; e.parts.blades.y = 0.73 + (run ? Math.sin(time * 14) * 0.18 : 0); }
    if (hall.q && hall.q.length && !hall.broken && Math.random() < dt * 4) {
      const [cx, cz] = farmCenter(hall);
      FV.R.emit({ x: cx + 0.5 + (Math.random() - 0.5) * 0.6, y: 0.9, z: cz + (Math.random() - 0.5), vx: (Math.random() - 0.5), vy: 1.2, vz: 1, g: -3, life: 0.9, size: 0.06, col: [0.95, 0.85, 0.6, 1], shape: 1 });
    }
  }
  const bock = farmObj1("saegebock");
  if (bock && bock.q && bock.q.length && Math.random() < dt * 3) {
    const [cx, cz] = farmCenter(bock);
    FV.R.emit({ x: cx, y: 0.75, z: cz, vx: (Math.random() - 0.5) * 1.4, vy: 1.4, vz: (Math.random() - 0.5) * 1.4, g: -4, life: 0.7, size: 0.05, col: [0.95, 0.85, 0.6, 1], shape: 1 });
  }
  /* Mitarbeiter wippen bei der Arbeit, der Besucher winkt */
  for (const s of WV.staff.values()) s.node.y = Math.abs(Math.sin(time * 2.2 + s.ph)) * 0.04;
  if (WV.npc) { WV.npc.node.y = Math.abs(Math.sin(time * 3)) * 0.06; WV.npc.node.ry = Math.PI / 4 + Math.sin(time * 1.2) * 0.3; }
  WV.evNodes.forEach((n, i) => { if (n.glow) n.glow = 0.25 + Math.sin(time * 3 + i) * 0.15; });
  /* Fischschwarm: Blubbern und springende Fische */
  const ev = S.farm.ev && S.farm.ev.cur;
  if (ev && ev.k === "schwarm" && S.time < ev.until && Math.random() < dt * 3) {
    const g = FGROUNDS.find(q => q.id === ev.data.g);
    if (g) FV.R.burst({ x: g.x + (Math.random() - 0.5) * 3, y: 0.06, z: g.z + (Math.random() - 0.5) * 3, n: 4, col: [0.9, 0.96, 1, 0.8], speed: 0.6, up: 1.6, size: 0.08, g: -6, life: 0.7 });
  }
  stepOutline(time);
  worldTags();
  if (FV.pop && FV.pop.kind === "wtree") positionTreePop($("#farmPop"), FV.pop);
}
/* nach jedem Abgleich der Szene */
function worldSync(force) {
  if (!FV.R || !FV.built) return;
  worldSyncHof(force);
  worldSyncTrees(force);
  worldSyncBarriers();
  worldSyncNpc();
  worldSyncPets();
  worldSyncStaff();
  worldSyncEvents();
  if (!WV.reveal) worldLocks();
  /* Ware auf dem Verkaufsstand */
  S.farm.objs.forEach(o => {
    if (o.t !== "stall" && o.t !== "f_markt") return;
    const e = FV.nodes.get(o.id);
    if (e && e.parts.goods) e.parts.goods.visible = stallState(o.t === "f_markt").slots.some(it => it && !it.sold);
  });
  const st = farmObj1("f_steg"), e = st && FV.nodes.get(st.id);
  if (e && e.parts.angler) e.parts.angler.visible = e.parts.rod.visible = !!(typeof FISH !== "undefined" && FISH.at === "steg");
}

/* ------------------------- Oberfläche: Knöpfe ----------------------------- */
function worldDOM() {
  const f = $("#farm");
  if (!f || $("#farmAreas")) return;
  const a = document.createElement("div");
  a.id = "farmAreas";
  f.appendChild(a);
  const c = document.createElement("div");
  c.id = "farmChips";
  f.appendChild(c);
}
function worldUI() {
  const F = S.farm, A = $("#farmAreas"), C = $("#farmChips");
  if (!A || !C || !F) return;
  const v = worldVisitor();
  if (FV.R && FV.built && (WV.npc ? WV.npc.id : null) !== v && !WV.reveal) worldSyncNpc();
  A.style.display = F.tut && !F.tut.done ? "none" : "";
  const ak = Object.keys(AREA_SPOTS).map(id => id + (id === "hof" || farmAreaOpen(id) ? "1" : v === id ? "!" : "0")).join("");
  if (A._k !== ak) {
    A._k = ak;
    A.innerHTML = Object.keys(AREA_SPOTS).map(id => {
      const S0 = AREA_SPOTS[id], open = id === "hof" || farmAreaOpen(id), ready = v === id;
      return `<button class="farea${open ? "" : " lock"}${ready ? " ready" : ""}" data-area="${id}" title="${esc(S0.n)}"><i>${S0.i}</i>${open ? "" : `<em>${ready ? "❗" : "🔒"}</em>`}<span>${esc(S0.n)}</span></button>`;
    }).join("");
    A.querySelectorAll("[data-area]").forEach(b => b.onclick = () => worldGo(b.dataset.area));
  }
  const sta = Math.floor(farmSta()), mx = farmStaMax(), wx0 = FWEATHER[farmWeather()] || FWEATHER.sonne;
  const wx = wx0 === FWEATHER.sonne && farmTod() === "nacht" ? { n: "Klar", i: "🌙" } : wx0;
  const ev = F.ev && F.ev.cur && S.time < F.ev.cur.until && !F.ev.cur.data.done ? F.ev.cur : null;
  const evT = ev ? FEVENTS[ev.k] : null;
  const left = ev ? Math.max(0, Math.ceil(ev.until - S.time)) : 0;
  const ck = sta + ":" + mx + ":" + F.clover + ":" + wx.n + ":" + farmTod() + ":" + (ev ? ev.k + (ev.k === "defekt" ? "" : Math.ceil(left / 5)) : "");
  if (C._k !== ck) {
    C._k = ck;
    C.innerHTML = `<button class="fchip2 sta${sta < 15 ? " low" : ""}" id="fcSta" title="Ausdauer – Brotzeit macht wieder fit"><span>💪</span><b>${sta}</b><i><em style="width:${Math.round(sta / mx * 100)}%"></em></i></button>
      <button class="fchip2" id="fcClover" title="Kleeblätter für den Extras-Laden"><span>🍀</span><b>${F.clover || 0}</b></button>
      <button class="fchip2 wx" id="fcWx" title="Wetter und Tageszeit – wichtig fürs Angeln"><span>${wx.i}</span><b>${esc(FTOD_N[farmTod()])}</b></button>
      ${ev ? `<button class="fchip2 ev" id="fcEv"><span>${evT.i}</span><b>${esc(evT.n)}</b>${ev.k !== "defekt" && left < 999 ? `<small>${fdur(left)}</small>` : ""}</button>` : ""}`;
    $("#fcSta").onclick = openFood;
    $("#fcClover").onclick = () => openFarmHouse("extras");
    $("#fcWx").onclick = openWeatherInfo;
    const eb = $("#fcEv");
    if (eb) eb.onclick = () => {
      const s = worldEvSpots()[0];
      if (s) { farmFocusXZ(s.x, s.z + 1, 22, 700); if (s.act === "haendler" || s.act === "nachbar") setTimeout(() => worldEvAct(s), 720); }
      else toast(evT.i + " " + evT.n + (ev.k === "holzpreis" ? ": Der Holzhändler zahlt gerade 30 % mehr für Rohholz." : ev.k === "fischpreis" ? ": Am Fischmarkt bringt Fisch gerade 30 % mehr." : ev.k === "sturm" ? ": Danach liegen ein paar Bäume im Wald – einfach aufsammeln." : ""), "");
    };
  }
  /* Besucher wartet: einmal pro Sitzung von selbst zeigen */
  if (v && !WV.visitSeen[v] && !FV.sheet && !FV.place && !(typeof MG !== "undefined" && MG.on) && S.farm.tut && S.farm.tut.done && !$("#farmLvl.on")) {
    WV.visitSeen[v] = 1;
    const p = AREA_NPC[v];
    farmFocusXZ(p[0] + 1.5, p[1] + 2, 24, 900);
    setTimeout(() => { if (FV.on && !FV.sheet) openAreaVisit(v); }, 1000);
  }
}

/* -------------------------------- Fenster --------------------------------- */
function openAreaInfo(id) {
  const A = FAREAS[id], S0 = AREA_SPOTS[id], lvOk = flv() >= A.lv;
  const pre = id === "saege" || id === "altwald" ? farmAreaOpen("wald") : true;
  FV.sheetFn = () => openAreaInfo(id);
  const ready = worldVisitor() === id;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">${A.i}</span>${esc(A.n)}<small>${farmAreaOpen(id) ? "offen" : "noch gesperrt"}</small></div>
    <div class="farea-req">
      ${pre ? "" : `<div class="no">🔒 Erst muss der Wald offen sein</div>`}
      <div class="${lvOk ? "ok" : "no"}">${lvOk ? "✅" : "⭐"} Erbe-Level ${A.lv}${lvOk ? "" : ` · du bist auf Level ${flv()}`}</div>
      ${A.reqs.map(q => { const v = q.v(), ok = v >= q.n; return `<div class="${ok ? "ok" : "no"}">${ok ? "✅" : "📋"} ${q.yes ? esc(q.t) : q.n + " " + esc(q.t)}${q.yes ? "" : `<em>${Math.min(v, q.n)}/${q.n}</em>`}</div>`; }).join("")}
    </div>
    <div class="fs-sub">${ready ? esc(A.who) + " wartet schon am Weg – tipp auf die Figur oder hier unten." : "Sobald alles erfüllt ist, schaut " + esc(A.who) + " vorbei und gibt das Gebiet frei. Die grauen Flächen auf der Karte gehören dann dir."}</div>
    ${ready ? `<button class="btn fgo" id="faVisit">${A.whoI} Mit ${esc(A.who.split(" ").slice(-2).join(" "))} reden</button>` : ""}`, "area");
  const b = $("#faVisit"); if (b) b.onclick = () => openAreaVisit(id);
}
function openAreaVisit(id) {
  const A = FAREAS[id];
  FV.sheetFn = null;
  openFarmSheet(`<div class="fvisit"><div class="fv-fig">${A.whoI}</div><div class="fv-tx"><b>${esc(A.who)}</b><small>${esc(A.whoRole)}</small>
      <p>„${esc(A.talk)}“</p></div></div>
    <div class="fv-msg">${A.i} ${esc(A.msg)}</div>
    <button class="btn fgo" id="fvGo">👍 Los geht’s!</button>`, "visit");
  $("#fvGo").onclick = () => worldUnlock(id);
}
function openFood() {
  FV.sheetFn = openFood;
  const sta = Math.floor(farmSta()), mx = farmStaMax(), foods = farmFoods();
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🥪</span>Brotzeit<small>Ausdauer ${sta}/${mx} · kommt auch von selbst langsam zurück</small></div>
    <div class="fcap"><i style="width:${Math.round(sta / mx * 100)}%" class="${sta < 15 ? "full" : ""}"></i><span>💪 ${sta} / ${mx}</span></div>
    <div class="finv">${foods.length ? foods.map(id => `<button class="fit" data-eat="${id}"><span>${FITEMS[id].i}</span><b>+${FFOOD[id]}</b><small>${famt(id, farmInv(id))}</small></button>`).join("")
      : `<div class="fs-empty">Nichts zu essen im Lager. Äpfel vom Baum, Brot aus dem Ofen, Wurst aus der Metzgerei – alles macht satt.</div>`}</div>
    <div class="fs-sub">Holzfällen, Sägen und Aufräumen kostet Kraft. Je besser das Essen, desto mehr Ausdauer gibt es.${farmCos("thermos") ? " ☕ Die Thermoskanne hilft beim Erholen." : ""}</div>`, "food");
  $$("#farmSheetIn [data-eat]").forEach(b => b.onclick = () => {
    const v = farmEat(b.dataset.eat);
    if (v) { const r = b.getBoundingClientRect(), fr = $("#farmFx").getBoundingClientRect(); floatText(r.left - fr.left + r.width / 2, r.top - fr.top, "+" + v + " 💪", "gold"); sfx("collect"); save(); openFood(); renderFarmUI(); }
    else { sfx("bad"); toast("Du bist schon satt und ausgeruht.", ""); }
  });
}
function openWeatherInfo() {
  const wx = FWEATHER[farmWeather()], tod = farmTod();
  FV.sheetFn = openWeatherInfo;
  let odds = "";
  if (farmAreaOpen("see")) {
    const gs = FGROUNDS.filter(farmGroundOk);
    odds = gs.map(g => {
      const o = farmFishOdds(g.id), sum = Object.values(o).reduce((a, b) => a + b, 0);
      const top = Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, 3);
      return `<div class="fwx-g"><b>${g.i} ${esc(g.n)}</b><span>${top.map(id => `${FITEMS[id].i} ${Math.round(o[id] / sum * 100)} %`).join(" · ")}</span></div>`;
    }).join("");
  }
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">${wx.i}</span>${esc(wx.n)} · ${esc(FTOD_N[tod])}<small>${(S.time % 1440 / 60 | 0).toString().padStart(2, "0")}:${(S.time % 60 | 0).toString().padStart(2, "0")} Uhr</small></div>
    ${odds ? `<div class="fs-sub">Was gerade beißt:</div><div class="fwx">${odds}</div>` : ""}
    <div class="fs-sub">Morgens und abends beißen Forellen, nachts kommen Aal und Zander, bei Regen die Aale und manchmal die seltene Gold-Schleie. Der Sturm wirft Bäume im Wald um – einfach aufsammeln.</div>`, "wx");
}
/* Kleeblätter fliegen in den Zähler */
function farmCloverFlyAt(x, y, n) {
  const to = $("#fcClover");
  if (!to) return;
  for (let i = 0; i < Math.min(5, n); i++) flyItem("🍀", x + (Math.random() - 0.5) * 30, y, to, i * 90, i === 0 ? n : 0);
}
function farmCloverFly(n, why) {
  if (!FV.on) return;
  const to = $("#fcClover");
  if (!to) return;
  const fr = $("#farmFx").getBoundingClientRect();
  setTimeout(() => {
    farmCloverFlyAt(fr.width / 2, fr.height * 0.45, n);
    floatText(fr.width / 2 - 40, fr.height * 0.45 - 30, "🍀 +" + n + (why ? " · " + why : ""), "gold");
    renderFarmUI();
  }, 300);
}
function farmEvView(type, c) {
  if (!FV.on) return;
  const D = FEVENTS[c.k];
  if (type === "start") {
    toast(D.i + " " + ({
      sturm: "Ein Sturm zieht auf! Danach liegen Bäume im Wald.", haendler: "Ein fliegender Händler steht an der Straße.", schwarm: "Ein Fischschwarm ist im See unterwegs!",
      nachbar: "Nachbar Krüger braucht Holz – er zahlt gut.", holzpreis: "Holzpreise steigen: Der Holzhändler zahlt 30 % mehr.", fischpreis: "Fischpreise steigen: Am Fischmarkt bringt Fisch 30 % mehr.",
      hirsch: "Ein weißer Hirsch wurde im Wald gesehen – ein Glücksbringer!", schatz: "Über dem Wald kreisen Vögel … da liegt doch was?", defekt: "Die Säge im Sägewerk klemmt!",
      lieferung: "Ein Paket liegt am Tor.", pilze: "Wildschweine haben Pilze freigewühlt – sammel sie ein!", reh: "Ein Reh steht auf dem Weg."
    }[c.k] || D.n), "");
    farmSyncScene();
  } else {
    if (c.k === "sturm" && c.data.fallen && c.data.fallen.length) toast("🌪️ Der Sturm ist vorbei – " + c.data.fallen.length + " Bäume liegen im Wald. Holz zum Aufsammeln!", "");
    farmSyncScene();
  }
}
/* Sägewerk: Reparaturen */
function openSawRepair() {
  FV.sheetFn = openSawRepair;
  const F = S.farm, done = FSAW_REPAIRS.filter(r => F.saw[r.id]).length, nx = sawNext();
  const rows = FSAW_REPAIRS.map(r => {
    const ok = !!F.saw[r.id], cur = nx === r, chk = cur ? farmRepairCheck(r) : null;
    const need = Object.keys(r.need).map(id => itemChip(id, r.need[id], farmInv(id))).join("") + `<span class="fchip${S.money < farmRepairCost(r) ? " miss" : ""}">💶<b>${eur(farmRepairCost(r))}</b></span>`;
    return `<div class="frep${ok ? " ok" : cur ? " cur" : ""}"><span class="ic">${ok ? "✅" : r.i}</span><div><b>${esc(r.n)}</b>
      ${cur ? `<small>${esc(r.d)}</small><div class="fr-in">${need}</div>` : `<small>${ok ? "repariert" : "danach"}</small>`}</div>
      ${cur ? `<button class="btn tiny${chk === true ? "" : " ghost"}" data-rep="${r.id}">🔧 Los</button>` : ""}</div>`;
  }).join("");
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏭</span>Sägewerk Krüger<small>Reparaturen ${done}/${FSAW_REPAIRS.length}</small></div>
    <div class="freps">${rows}</div>
    <div class="fs-sub">Das Material kommt vom Sägebock auf dem Hof: Bretter, Pfosten und Balken aus Kiefernstämmen. Jede Reparatur ist ein kleines Handwerk – gut gemacht gibt es mehr EP.</div>`, "repair");
  $$("#farmSheetIn [data-rep]").forEach(b => b.onclick = () => worldRepair(FSAW_REPAIRS.find(r => r.id === b.dataset.rep)));
}
function worldRepair(rep, after) {
  const chk = farmRepairCheck(rep);
  if (chk === "missing") return sfx("bad"), toast("Es fehlt: " + farmMissing(rep.need).map(m => fqty(m.id, m.need)).join(", "), "warn");
  if (chk === "money") return sfx("bad"), toast("Dafür fehlen " + eur(farmRepairCost(rep) - S.money) + ".", "warn");
  if (chk !== true) return;
  closeFarmSheet();
  MG.open(rep.game, { rep, title: rep.n + " reparieren" }, res => {
    if (!res || !res.ok) return;
    if (!farmRepairDone(rep, res.score)) return;
    const o = rep.id === "lkw" ? farmObj1("sw_lkw") : rep.id === "motor" ? farmObj1("kessel") : farmObj1("sw_halle");
    farmSyncScene();
    if (o) { puff(o); const [x, y] = objScreen(o); xpFly(x, y, 40 + Math.round((res.score || 0.5) * 30), 200); floatText(x, y - 30, rep.id === "lkw" ? "🚛 Der Unimog läuft!" : rep.i + " " + rep.n + " repariert!", "gold"); }
    sfx("build");
    if (rep.id === "lkw") toast("🚛 Krügers Unimog fährt jetzt in deiner Flotte – 2,5 t für Holzlieferungen.", "ok");
    if (sawRepaired() && rep.id === "motor") setTimeout(() => toast("🏭 Das Sägewerk läuft! Heiz den Kessel an – ohne Strom keine Säge.", "ok"), 900);
    save(); renderFarmUI();
    if (after) after();
  });
}
function openLkw() {
  FV.sheetFn = openLkw;
  const F = S.farm, R0 = FSAW_LKW, ok = !!(F.saw && F.saw.lkw);
  const need = Object.keys(R0.need).map(id => itemChip(id, R0.need[id], farmInv(id))).join("") + `<span class="fchip${S.money < farmRepairCost(R0) ? " miss" : ""}">💶<b>${eur(farmRepairCost(R0))}</b></span>`;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🚛</span>${esc(R0.n)}<small>${ok ? "fährt in deiner Flotte" : "steht unter der Plane"}</small></div>
    ${ok ? `<div class="fs-sub">Der Unimog holt und bringt Holz – du findest ihn im Fuhrpark und am Schuppen.</div><div class="fs-row"><button class="btn tiny" id="flFleet">🚚 Zum Fuhrpark</button></div>`
      : `<div class="fs-sub">${esc(R0.d)}</div><div class="fr-in">${need}</div><button class="btn fgo" id="flGo">🔧 Motor richten</button>`}`, "repair");
  const g = $("#flGo"); if (g) g.onclick = () => worldRepair(R0);
  const f = $("#flFleet"); if (f) f.onclick = () => { closeFarmSheet(); showTab("fleet"); };
}
/* Strom im Kessel */
function energyHTML() {
  const en = Math.floor(S.farm.en || 0), cap = farmEnCap();
  return `<div class="fen"><span>⚡</span><div><b>Strom ${en} / ${cap} kWh</b><i><em style="width:${Math.round(en / cap * 100)}%"></em></i>
    <small>${S.farm.saw && S.farm.saw.motor ? "Der Kessel verfeuert Holzreste, Äste oder Brennholz." : "Erst den Motor reparieren."}</small></div></div>`;
}
/* Zusatz im Gebäude-Fenster (farmview.openMachine) */
function machExtraHTML(o) {
  const M = FMACHINES[o.t];
  let h = "";
  if (M.saw || M.power) h += energyHTML();
  if (o.t === "sw_halle" || o.t === "kessel") {
    const id = o.t === "sw_halle" ? "saege2" : "kessel2", U = FSAW_UPGRADES[id];
    const has = id === "saege2" ? (o.lvl || 1) >= 2 : (S.farm.enLv || 0) >= 1;
    if (!has) h += `<button class="fup2" id="fxUp" ${flv() < U.lv ? "disabled" : ""}><span>${U.i}</span><b>${esc(U.n)}</b><small>${flv() < U.lv ? "ab Level " + U.lv : esc(U.d) + " · " + eur(U.cost) + " · " + Object.keys(U.need).map(k => fqty(k, U.need[k])).join(", ")}</small></button>`;
  }
  if (o.t === "f_markt") h += `<button class="fup2" id="fxStall"><span>🏪</span><b>Marktstand</b><small>Fisch und Fischwaren direkt am See verkaufen – 15 % mehr</small></button>`;
  if (o.broken) h += `<button class="fup2 warn" id="fxFix"><span>⚠️</span><b>Die Säge klemmt</b><small>Antippen und richten – solange steht alles</small></button>`;
  return h;
}
function machExtraBind(o) {
  const u = $("#fxUp");
  if (u) u.onclick = () => { if (farmSawUpgrade(o.t === "sw_halle" ? "saege2" : "kessel2")) { sfx("build"); puff(o); save(); farmSyncScene(); openMachine(o); } else sfx("bad"); };
  const s = $("#fxStall"); if (s) s.onclick = () => openStall(true);
  const f = $("#fxFix"); if (f) f.onclick = () => { closeFarmSheet(); const sp = worldEvSpots().find(x => x.act === "defekt"); if (sp) worldEvAct(sp); else { farmMachFix(o); save(); } };
}
/* Krügers Büro: Überblick, Ausbau, Holzhändler */
function openSawOffice() {
  FV.sheetFn = openSawOffice;
  const F = S.farm, rep = sawRepaired();
  const mach = FSHOP_SAW.map(it => `<span class="fchip${fcount(it.id) ? "" : " miss"}">${it.i}<b>${fcount(it.id) ? "✓" : "Lv " + it.lv}</b></span>`).join("");
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏠</span>Büro im Sägewerk<small>${rep ? "alles läuft" : "Reparaturen " + FSAW_REPAIRS.filter(r => F.saw[r.id]).length + "/5"}</small></div>
    ${rep ? energyHTML() : ""}
    <div class="fs-sub">Maschinen im Sägewerk:</div><div class="fr-in">${mach}</div>
    <div class="fs-row"><button class="btn tiny" id="foRep">${rep ? "🏭 Zur Säge" : "🔧 Reparaturen"}</button><button class="btn tiny ghost" id="foShop">🛒 Maschinen kaufen</button><button class="btn tiny ghost" id="foWood">🪵 Holzhändler</button></div>
    <div class="fletter mini"><p>„Meine Säge hat dreißig Jahre gesungen. Bei dir singt sie hoffentlich noch mal so lange.“ – Erwin Krüger</p></div>`, "office");
  $("#foRep").onclick = () => { const h = farmObj1("sw_halle"); if (rep && h) openMachine(h); else openSawRepair(); };
  $("#foShop").onclick = () => openFarmShop("saege");
  $("#foWood").onclick = () => openFarmStore("holz");
}
/* Verkaufsstand am Tor oder Fischmarkt am See */
function openStall(market) {
  FV.sheetFn = () => openStall(market);
  const St = stallState(market), cap = stallCap(market), F = S.farm;
  const sel = FV.stallSel && FV.stallSel.m === !!market ? FV.stallSel : null;
  const used = St.slots.filter(Boolean).length;
  const slots = [];
  for (let i = 0; i < cap; i++) {
    const it = St.slots[i];
    if (!it) slots.push(`<button class="fstl free" data-pick="${i}"><span>＋</span><small>Ware einstellen</small></button>`);
    else slots.push(`<button class="fstl${it.sold ? " sold" : ""}" data-slot="${i}"><span>${FITEMS[it.id].i}</span><b>${esc(fqty(it.id, it.n))}</b><small>${it.sold ? "💰 " + eur(it.p) + " · kassieren" : eur(it.p) + " · wartet"}</small></button>`);
  }
  let pickH = "";
  if (sel && sel.id == null) {
    const ids = Object.keys(F.inv).filter(id => FITEMS[id] && FITEMS[id].v > 0.2 && farmInv(id) > 0 && FITEMS[id].k !== "energy" && FITEMS[id].k !== "bait" && (!market || FITEMS[id].st === "fisch"));
    pickH = `<div class="fs-sub">Was soll auf den Stand?</div><div class="finv">${ids.length ? ids.map(id => `<button class="fit" data-sid="${id}"><span>${FITEMS[id].i}</span><b>${famt(id, farmInv(id))}</b><small>${eur(FITEMS[id].v)}</small></button>`).join("") : `<div class="fs-empty">${market ? "Kein Fisch im Lager." : "Das Lager ist leer."}</div>`}</div>`;
  } else if (sel) {
    const max = farmInv(sel.id), n = clamp(sel.n || 1, 1, Math.max(1, max)), base = stallBase(sel.id, n, market), p = Math.round(base * sel.f * 10) / 10;
    const speed = sel.f <= 0.85 ? "schnell weg" : sel.f <= 1.1 ? "normal" : sel.f <= 1.35 ? "dauert länger" : "nur mit Glück";
    pickH = `<div class="fstl-cfg"><b>${FITEMS[sel.id].i} ${esc(fqty(sel.id, n))}</b>
      <div class="fs-row">${[1, 5, 10, max].filter((k, i, a) => k <= max && a.indexOf(k) === i).map(k => `<button class="btn tiny${k === n ? "" : " ghost"}" data-n="${k}">${k === max && k > 1 ? "alles" : famt(sel.id, k)}</button>`).join("")}</div>
      <div class="fstl-p"><button class="btn tiny ghost" data-f="-0.1">−</button><span><b>${eur(p)}</b><small>${Math.round(sel.f * 100)} % vom Wert · ${speed}</small></span><button class="btn tiny ghost" data-f="0.1">＋</button></div>
      <button class="btn fgo" id="fsPut">Einstellen</button></div>`;
  }
  const sold = St.slots.filter(it => it && it.sold).length;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">${market ? "🏪" : "🛒"}</span>${market ? "Fischmarkt am See" : "Verkaufsstand an der Straße"}<small>${used}/${cap} Plätze${market ? " · Fisch +15 %" : ""}</small></div>
    <div class="fstls">${slots.join("")}</div>
    ${sold > 1 ? `<button class="btn tiny" id="fsAll">💰 Alles kassieren</button>` : ""}
    ${pickH}
    <div class="fs-sub">Leute aus dem Ort kommen vorbei und kaufen – günstig geht schnell, teuer dauert. ${market ? "" : "Mit dem Hof-Ausbau gibt es mehr Plätze."}</div>`, "stall");
  $$("#farmSheetIn [data-pick]").forEach(b => b.onclick = () => { FV.stallSel = { m: !!market, id: null }; openStall(market); });
  $$("#farmSheetIn [data-sid]").forEach(b => b.onclick = () => { FV.stallSel = { m: !!market, id: b.dataset.sid, n: Math.min(farmInv(b.dataset.sid), 1), f: 1 }; openStall(market); });
  $$("#farmSheetIn [data-n]").forEach(b => b.onclick = () => { sel.n = +b.dataset.n; openStall(market); });
  $$("#farmSheetIn [data-f]").forEach(b => b.onclick = () => { sel.f = clamp(Math.round((sel.f + +b.dataset.f) * 10) / 10, 0.6, 1.8); openStall(market); });
  const put = $("#fsPut");
  if (put) put.onclick = () => {
    const n = clamp(sel.n || 1, 1, farmInv(sel.id)), p = stallBase(sel.id, n, market) * sel.f;
    if (stallPut(market, sel.id, n, p)) { FV.stallSel = null; sfx("pop"); save(); farmSyncScene(); openStall(market); }
  };
  $$("#farmSheetIn [data-slot]").forEach(b => b.onclick = () => {
    const i = +b.dataset.slot, it = St.slots[i];
    const r = stallTake(market, i);
    if (r && it && it.sold) { const q = b.getBoundingClientRect(), fr = $("#farmFx").getBoundingClientRect(); coinFly(q.left - fr.left + q.width / 2, q.top - fr.top, r); sfx("coin"); }
    else if (r) sfx("pop");
    save(); farmSyncScene(); openStall(market);
  });
  const all = $("#fsAll");
  if (all) all.onclick = () => { const m = stallCollectAll(market); if (m) { const q = all.getBoundingClientRect(), fr = $("#farmFx").getBoundingClientRect(); coinFly(q.left - fr.left + q.width / 2, q.top - fr.top, m); sfx("coin"); save(); farmSyncScene(); openStall(market); } };
}
/* Fliegender Händler */
function openTrader() {
  const c = S.farm.ev.cur;
  if (!c || c.k !== "haendler") return;
  FV.sheetFn = openTrader;
  const rows = c.data.deals.map((d, i) => {
    const it = d.item ? FITEMS[d.item] : null;
    const t = d.kind === "buy" ? `${esc(d.n)} kaufen` : d.kind === "clover" ? `${d.qty} Kleeblätter kaufen` : `${esc(fqty(d.item, d.qty))} verkaufen`;
    const p = d.kind === "sell" ? "+" + eur(Math.round(it.v * d.qty * d.mult * 10) / 10) + " (+" + Math.round((d.mult - 1) * 100) + " %)" : eur(d.price);
    return `<button class="frec${d.done ? " lock" : ""}" data-deal="${i}" ${d.done ? "disabled" : ""}><span class="ic">${d.i}</span><b>${t}</b><small>${d.done ? "erledigt" : p}</small></button>`;
  }).join("");
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🧑‍💼</span>Fliegender Händler<small>noch ${fdur(Math.max(1, c.until - S.time))} an der Straße</small></div>
    <div class="frecs">${rows}</div><div class="fs-sub">„Heute nur bei mir – morgen bin ich in Brandenburg an der Havel!“</div>`, "trader");
  $$("#farmSheetIn [data-deal]").forEach(b => b.onclick = () => { if (farmTraderDeal(+b.dataset.deal)) { sfx("coin"); save(); openTrader(); renderFarmUI(); } else sfx("bad"); });
}
function openNeighbor() {
  const c = S.farm.ev.cur;
  if (!c || c.k !== "nachbar") return;
  FV.sheetFn = openNeighbor;
  const m = Math.round(Object.keys(c.data.items).reduce((s, id) => s + FITEMS[id].v * c.data.items[id], 0) * 1.5);
  openFarmSheet(`<div class="fvisit"><div class="fv-fig">👴</div><div class="fv-tx"><b>Erwin Krüger</b><small>Nachbar</small>
    <p>„Ich bau meiner Tochter einen Schuppen. Hast du mir was von deinem Holz? Ich zahl auch ordentlich – und ein Kleeblatt aus meinem Garten gibt’s obendrauf.“</p></div></div>
    <div class="fr-in">${Object.keys(c.data.items).map(id => itemChip(id, c.data.items[id], farmInv(id))).join("")}</div>
    <button class="btn fgo" id="fnGo" ${farmHasAll(c.data.items) ? "" : "disabled"}>🤝 Übergeben · ${eur(m)} + 🍀 2</button>
    <div class="fs-sub">Noch ${fdur(Math.max(1, c.until - S.time))} – dann fragt er woanders.</div>`, "visit");
  $("#fnGo").onclick = () => { const r = farmNeighborDeliver(); if (r) { closeFarmSheet(); const fr = $("#farmFx").getBoundingClientRect(); coinFly(fr.width / 2, fr.height / 2, r); sfx("coin"); save(); farmSyncScene(); renderFarmUI(); } else sfx("bad"); };
}
/* Fischerei: Bauplatz am Ufer */
function openPlot(o) {
  const t = o.k, B = FFISHERY[t], chk = farmFishBuildCheck(t);
  FV.sheetFn = () => openPlot(o);
  const need = Object.keys(B.need).map(id => itemChip(id, B.need[id], farmInv(id))).join("") + `<span class="fchip${S.money < B.cost ? " miss" : ""}">💶<b>${eur(B.cost)}</b></span>`;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">${B.i}</span>${esc(B.n)}<small>Bauplatz am Ufer${flv() < B.lv ? " · ab Level " + B.lv : ""}</small></div>
    <div class="fs-sub">${esc(B.d)}</div><div class="fr-in">${need}</div>
    <button class="btn fgo" id="fpGo" ${chk === true ? "" : "disabled"}>🔨 Bauen</button>
    <div class="fs-sub">Das Holz kommt aus deinem Sägewerk. Beim Bauen nagelst du selbst mit.</div>`, "plot");
  $("#fpGo").onclick = () => {
    if (farmFishBuildCheck(t) !== true) return;
    closeFarmSheet();
    MG.open("nails", { short: true, title: B.n + " bauen" }, res => {
      if (!res || !res.ok) return;
      const n = farmFishBuild(t);
      if (!n) return;
      farmSyncScene(); puff(n); sfx("build");
      const [x, y] = objScreen(n);
      floatText(x, y - 30, B.i + " " + B.n + " steht!", "gold");
      xpFly(x, y, 60 + Math.round(B.cost / 40), 200);
      save(); renderFarmUI();
    });
  };
}
/* Objekte der großen Welt antippen (vor dem allgemeinen Verhalten) */
function worldObjAction(o, x, y) {
  if (o.area && !farmAreaOpen(o.area)) { openAreaInfo(o.area); return true; }
  const F = S.farm;
  switch (o.t) {
    case "junk": openPop(o, "junk"); return true;
    case "stall": openStall(false); return true;
    case "f_plot": openPlot(o); return true;
    case "sw_buero": openSawOffice(); return true;
    case "sw_lager": openFarmStore("holz"); return true;
    case "sw_lkw": openLkw(); return true;
    case "sw_halle":
      if (o.broken) { const s = worldEvSpots().find(q => q.act === "defekt"); if (s) { worldEvAct(s); return true; } }
      if (!sawRepaired()) { openSawRepair(); return true; }
      return false;
    case "kessel": if (!(F.saw && F.saw.motor)) { openSawRepair(); return true; } return false;
    case "f_steg": if (typeof openFishingAt === "function") openFishingAt("steg"); return true;
    case "f_boot": if (typeof openBoatSheet === "function") openBoatSheet(); return true;
  }
  if (FMACHINES[o.t] && FMACHINES[o.t].saw && !sawRepaired()) { openSawRepair(); return true; }
  return false;
}
/* Tor-Schild: wandert in Stufe 4 mit dem Steintor nach außen */
function worldGateSign() { return (S.farm.stage || 1) >= 4 ? [5, 2.65, 15.85] : [5, 1.68, 13.05]; }
/* beim Öffnen des Hofs */
function worldShow() {
  const F = S.farm;
  if (!F) return;
  if (F.conv && !F.conv.told && typeof phoneMsg === "function") {
    F.conv.told = true;
    setTimeout(() => phoneMsg({ from: "Lina Sturm", kind: "info", title: "Neuigkeiten von der Küste",
      body: "Chef, die Fischerei an der Ostsee gibt es nicht mehr – Tante Gesche hat sie verkauft und dir " + eur(F.conv.money || 5000) + " überwiesen. Dafür gehört dir jetzt Opas Hof bei Werder: Felder, Tiere, dahinter der Wald, Krügers altes Sägewerk und der Glindower See. Dein Fuhrpark steht schon am Schuppen. Komm vorbei!" }), 1400);
    save();
  }
  if (F.tut && F.tut.done && farmDailyBonus()) setTimeout(() => toast("🍀 Tagesbonus: 2 Kleeblätter! Morgen gibt es wieder welche.", "ok"), 900);
}

/* ---------------------- Wohnhaus: Ausbau, Team, Extras --------------------- */
function stageHTML() {
  const F = S.farm, cur = F.stage || 1, nx = farmStageNext(), chk = farmStageCheck();
  const list = FHOF_STAGES.slice(1).map((st, i) => {
    const k = i + 1, on = k === cur, done = k < cur;
    return `<div class="fstage${on ? " cur" : done ? " ok" : ""}"><b>${done ? "✓" : k}</b><div><span>${esc(st.n)}</span>${st.perks ? `<small>${st.perks.map(esc).join(" · ")}</small>` : `<small>${esc(st.d)}</small>`}</div></div>`;
  }).join("");
  let next = "";
  if (nx) {
    const need = Object.keys(nx.need).map(id => itemChip(id, nx.need[id], farmInv(id))).join("") + `<span class="fchip${S.money < nx.cost ? " miss" : ""}">💶<b>${eur(nx.cost)}</b></span>`;
    next = `<div class="fs-sub">Nächste Stufe: <b>${esc(nx.n)}</b>${flv() < nx.lv ? " · ab Level " + nx.lv : ""}</div><div class="fr-in">${need}</div>
      <button class="btn fgo" id="fsStage" ${chk === true ? "" : "disabled"}>🏡 Hof ausbauen</button>`;
  } else next = `<div class="fs-sub">Größer geht es nicht – dein Hof ist ein richtiger Wirtschaftshof. 🎉</div>`;
  return `<div class="fstages">${list}</div>${next}<div class="fs-sub">Für den Ausbau brauchst du Holz aus dem Wald und später aus dem Sägewerk.</div>`;
}
function stageBind(again) {
  const b = $("#fsStage");
  if (b) b.onclick = () => {
    if (!farmStageUp()) { sfx("bad"); return; }
    sfx("level"); save();
    closeFarmSheet();
    farmSyncScene(true);
    const h = S.farm.objs.find(o => o.t === "house");
    if (h) { puff(h); farmFocus(h, 34); }
    const R = FV.R;
    for (let i = 0; i < 90; i++) R.emit({ x: (Math.random() - 0.5) * 26, y: 6 + Math.random() * 3, z: (Math.random() - 0.5) * 26, vx: (Math.random() - 0.5) * 2, vy: -0.5, vz: (Math.random() - 0.5) * 2, g: -2.2, drag: 0.6, life: 3, size: 0.13, shape: 1, fade: false,
      col: [[0.95, 0.3, 0.35, 1], [0.3, 0.6, 0.95, 1], [0.98, 0.82, 0.25, 1], [0.35, 0.8, 0.45, 1]][i % 4] });
    toast("🏡 " + FHOF_STAGES[S.farm.stage].n + " – sieh dich um!", "ok");
    renderFarmUI();
  };
}
function staffFace(c, size) {
  if (c.av && typeof portraitHTML === "function") { try { return portraitHTML(c.av, size, { label: c.name }); } catch (e) { /* weiter mit Emoji */ } }
  return `<span class="fst-emo">${FSTAFF_ROLES[c.role].i}</span>`;
}
function staffHTML() {
  const F = S.farm, slots = staffSlots(), nxt = FSTAFF_SLOTS.find(([lv]) => flv() < lv);
  if (!slots) return `<div class="fs-empty">👷 Ab Level ${FSTAFF_SLOTS[0][0]} kannst du Leute einstellen – Fahrer und Landwirte zuerst, später Mechaniker, Holzfäller und Fischer.</div>`;
  const hired = F.staff.map(s => {
    const R0 = FSTAFF_ROLES[s.role];
    return `<div class="fstaff"><div class="fst-p">${staffFace(s, 44)}</div><div><b>${esc(s.name)} · ${R0.i} ${esc(R0.n)}</b><small>${esc(s.trait)} · ${esc(R0.perk)} +${s.perk} % · ${eur(s.wage)} am Tag${s.fed === false ? " · 😟 hungrig" : " · 😊 satt"}${s.last && FITEMS[s.last] ? " · zuletzt " + FITEMS[s.last].i : ""}</small></div>
      <button class="btn tiny ghost" data-fire="${s.id}">Entlassen</button></div>`;
  }).join("");
  const cands = F.staff.length < slots ? staffCands().map(c => {
    const R0 = FSTAFF_ROLES[c.role];
    return `<div class="fstaff cand"><div class="fst-p">${staffFace(c, 44)}</div><div><b>${esc(c.name)} · ${R0.i} ${esc(R0.n)}</b><small>${esc(c.trait)} · ${esc(R0.perk)} +${c.perk} % · ${eur(c.wage)} am Tag</small></div>
      <button class="btn tiny" data-hire="${c.id}" ${S.money < c.wage * 2 ? "disabled" : ""}>Einstellen<small>${eur(c.wage * 2)}</small></button></div>`;
  }).join("") : "";
  return `<div class="fs-sub">👷 ${F.staff.length}/${slots} Plätze${nxt ? " · nächster Platz ab Level " + nxt[0] : ""}</div>
    ${hired || `<div class="fs-empty">Noch niemand eingestellt.</div>`}
    ${cands ? `<div class="fs-sub">Bewerbungen von heute:</div>${cands}` : ""}
    <div class="fs-sub">Mitarbeiter wollen jeden Tag ihren Lohn und eine Brotzeit aus dem Lager. Ohne Essen schaffen sie nur die Hälfte.</div>`;
}
function staffBind(again) {
  $$("#farmSheetIn [data-hire]").forEach(b => b.onclick = () => { if (staffHire(b.dataset.hire)) { sfx("build"); save(); farmSyncScene(); again(); } else sfx("bad"); });
  $$("#farmSheetIn [data-fire]").forEach(b => b.onclick = () => askConfirm("Wirklich entlassen?", "Die Stelle wird frei – neue Bewerbungen kommen jeden Tag.", "Entlassen", () => { staffFire(b.dataset.fire); save(); farmSyncScene(); again(); }));
}
/* Extras-Laden: Kleeblätter statt Geld. Echtgeld und Werbung sind nur Platzhalter. */
function cosShopHTML() {
  const F = S.farm, today = new Date().toISOString().slice(0, 10);
  const head = `<div class="fcos-top"><div><b>🍀 ${F.clover || 0}</b><small>Kleeblätter gibt es für Level, Kapitel, neue Gebiete, Ereignisse und den Tagesbonus.</small></div>
    <button class="btn tiny" id="fcDaily" ${F.daily === today ? "disabled" : ""}>${F.daily === today ? "✓ Tagesbonus" : "🎁 Tagesbonus"}</button></div>`;
  const cats = FCOS_CATS.map(([k, l]) => `<div class="fcos-cat">${l}</div>` + FCOSMETIC.filter(c => c.cat === k).map(c => {
    const own = farmCos(c.id);
    const note = own ? (c.deco ? "gehört dir · unter 🌷 Deko aufstellen" : c.pet ? "läuft auf dem Hof herum" : "aktiv") : "🍀 " + c.price;
    const [tk, tf] = cosModel(c);
    return `<button class="fshop${own ? " own" : (F.clover || 0) < c.price ? " poor" : ""}" data-cos="${c.id}" ${own && !c.deco ? "disabled" : ""}>${thumbSpan(tk, tf, c.i)}<b>${esc(c.n)}</b><small>${note}</small>${c.d ? `<p>${esc(c.d)}</p>` : ""}</button>`;
  }).join("")).join("");
  const ph = `<div class="fcos-cat">✨ Bald</div>
    <button class="fshop lock" disabled><span class="ic">🍀</span><b>Kleeblätter kaufen</b><small>kommt bald</small><p>Platzhalter – im Spiel gibt es Kleeblätter fürs Spielen.</p></button>
    <button class="fshop lock" disabled><span class="ic">🎬</span><b>Bonus-Video ansehen</b><small>kommt bald</small><p>Platzhalter – freiwillig, nie nötig zum Weiterkommen.</p></button>`;
  return head + cats + ph;
}
function cosShopBind(again) {
  const d = $("#fcDaily");
  if (d) d.onclick = () => { if (farmDailyBonus()) { sfx("coin"); save(); again(); } };
  $$("#farmSheetIn [data-cos]").forEach(b => b.onclick = () => {
    const C = FCOSMETIC.find(c => c.id === b.dataset.cos);
    if (!C) return;
    const place = () => {
      const k = C.deco, D = FDECO[k];
      closeFarmSheet();
      startPlace({ proto: { t: "deco", k, r: 0 }, build: { t: "deco", k }, price: 0, label: D.n });
    };
    if (farmCos(C.id)) { if (C.deco) place(); return; }
    if (!farmCosBuy(C.id)) { sfx("bad"); return; }
    sfx("level"); save();
    farmSyncScene(true);
    if (C.deco) { toast(C.i + " " + C.n + " gehört dir – stell es auf!", "ok"); place(); return; }
    toast(C.i + " " + C.n + (C.pet ? " wohnt jetzt auf dem Hof!" : " – gekauft!"), "ok");
    again();
  });
}
