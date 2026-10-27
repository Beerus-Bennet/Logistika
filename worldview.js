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
  wild: [], fly: [], swarm: [], pres: {}, trKey: "", trNodes: [], trFx: null, trChest: null, trReveal: null, trIntro: null, pets: new Map(), staff: new Map(), evKey: "", evNodes: [], visitSeen: {}, pvKey: "", pvNodes: [],
  gust: 0, hit: null, sawBlades: null, popTree: null
};
const WGRID = { x0: -160, z0: -160, x1: 104, z1: 104, chunk: 24, cell: 4 };
/* Hofwiese (größter Hof, aufs 4er-Raster gerundet): dort liegt statt Gelände FWM.hofGround */
const HOFG = { x0: -24, z0: -28, x1: 24, z1: 16 };
/* Weg vom Südtor des Sägewerks über den Waldweg und den Feldweg zur Straße (Holzlaster, Döring) */
const SAW_ROAD = [[-41, -30.5], [-41, -21], [-37, -14], [-31, -9.5], [-31, -1], [-31.5, 8], [-31, 18.5], [-48, 18.5]];
/* Reiseziele der Gebietsknöpfe (Kamera) – peek: wohin bei gesperrtem Gebiet */
const AREA_SPOTS = {
  hof:     { i: "🏡", n: "Hof",        at: [-1, -2],   d: 34 },
  wald:    { i: "🌲", n: "Wald",       at: [-34, -56], d: 40, peek: [-26, -16] },
  saege:   { i: "🪚", n: "Sägewerk",   at: [-41, -41], d: 30, peek: [-32, -27] },
  altwald: { i: "🌳", n: "Alter Wald", at: [-84, -88], d: 40, peek: [-60, -67] },
  see:     { i: "🎣", n: "See",        at: [12, 36],   d: 40, peek: [6, 19] }
};
/* v56: Förster und Schranke am Waldrand auf dem Weg vom Westtor, Krüger am Tor des Sägewerks */
const AREA_NPC = { wald: [-27.2, -7.3], saege: [-39.1, -28.4], altwald: [-65.8, -70.6], see: [7.2, 20.5] };
const AREA_BAR = { wald: [-27.7, -9.5, Math.PI / 2], saege: [-41, -29.4, 0], altwald: [-68, -73.2, -4.172], see: [5, 20.8, 0] };
/* v70: zweite Schranke am Ostweg (Teich → Wald), solange der Wald zu ist.
   v75: Liste je Gebiet – der See hat zwei weitere Zugänge (Uferweg bei x = −31, Ostuferweg bei x = 40) */
const AREA_BAR2 = { wald: [[35.1, -19.5, Math.PI / 4]], see: [[-31, 20.95, 0], [40, 20.95, 0]] };
/* v71: Uferweg nach Osten, am Ende senkrecht hoch zur Straße (das Ende liegt unter dem Asphalt) */
/* v75: Wegenetz am See als Knoten und Kanten (statt zwei ineinander geschobener Wege):
   – LAKE_STEM: Stichweg vom Südtor über die Straße (x = 5) bis zum Uferweg – unten eine T-Kreuzung
   – LAKE_WAY:  Uferweg von Straße zu Straße. Im Westen (x = −31) biegt er hinter dem Kühlhaus in einem
                Bogen (r = 1,6) zur Straße ab – genau gegenüber dem Feldweg vom Westtor (Kreuzung, vorher endete
                er als Zunge vor dem Kühlhaus). Im Osten mündet er als T in den Ostuferweg.
   – LAKE_EAST: Ostuferweg: an der Straße bei x = 40 genau gegenüber dem Teichweg (Kreuzung), am Ostufer
                entlang über die Brücke am Bach zum See und in eine kleine Lichtung mit Bank.
   Alle Mündungen laufen senkrecht auf den Bordstein (Kanten-Snap in FWM.forestPath) und haben Ausrundungen. */
const LAKE_STEM = [[5, 19.52], [5, 20.8], [5, 22.15]];
const LAKE_WAY = [[-31, 19.52], [-31, 20.3], [-31, 21.0], [-30.88, 21.61], [-30.53, 22.13], [-30.01, 22.48], [-29.4, 22.6], [-27, 22.6], [-23.5, 22.25], [-20, 21.9],
  [-2, 22.2], [1.6, 22.2], [5, 22.15], [10, 22.1], [14, 22.1], [26, 22.1], [35, 21.9], [37, 21.95], [38.6, 22.3], [40, 22.35]];
const LAKE_EAST = [[40, 19.52], [40, 20.6], [40, 22.35], [40, 23.6], [40.5, 25.4], [41.6, 27.4], [44.2, 31.4], [47.6, 35.8], [50.8, 40.6], [52.9, 45.6], [53.7, 50.4],
  [53.75, 54.2], [53.65, 56.96], [52.6, 60.3], [51.55, 63.64], [50.9, 66.6], [50.2, 69.2]];
/* ältere Namen (team.js, Staubspur): Stich + Westteil, Ostteil */
const LAKE_WAY1 = LAKE_STEM.concat(LAKE_WAY.slice(0, 12).reverse());
const LAKE_WAY2 = LAKE_WAY.slice(12).concat(LAKE_EAST.slice(0, 2).reverse());
const NPC_LOOK = {
  wald:    { shirt: 0x4a6a3a, pants: 0x3a4a3a, hat: "hut", beard: 0x7a5a3a, seed: 1, tool: "axt" },
  altwald: { shirt: 0x4a6a3a, pants: 0x3a4a3a, hat: "hut", beard: 0x7a5a3a, seed: 1, tool: "axt" },
  saege:   { shirt: 0x6a7a8a, pants: 0x3a3a4a, hat: "muetze", beard: 0xd8d4cc, seed: 2 },
  see:     { shirt: 0xb83a4a, pants: 0x2a2a3a, hair: 0x6a3a2a, skin: 0xf0c4a0, seed: 3 }
};
/* Höhe der Tag-Blasen und Taps für die neuen Objekte */
Object.assign(OBJ_H, {
  sw_halle: 4.6, sw_lager: 2.6, sw_buero: 2.8, sw_lkw: 2.2, kessel: 3.0, spalter: 1.4, hobel: 1.3, trocken: 2.4, verpack: 1.5,
  schleif: 1.3, fraese: 2.0, saegebock: 1.1, junk: 0.9, stall: 1.8, tractor: 1.9, f_plot: 1.0, f_steg: 0.9, f_huette: 2.8, f_boot: 3.4,
  f_lager: 2.5, f_rauch: 3.6, f_kuehl: 2.9, f_markt: 2.4, bert_car: 1.1
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
  const depth = forestDepth(x, z);
  let f = clamp((depth + 1.5) / 4.5, 0, 1);
  if (z > 14) f *= clamp((19 - z) / 5, 0, 1);
  return f;
}
function lakeE(x, z) { const L = FWORLD.lake; return Math.hypot((x - L.x) / L.rx, (z - L.z) / L.rz); }
/* Bodenfarbe je Punkt: Wiese, Waldboden, Lichtung, Sägewerkshof, Ufer */
function worldGroundCol(x, z) {
  const v = wNoise(x, z), v2 = Math.sin(x * 0.07 + 1.3) * Math.cos(z * 0.06 - 0.4);
  const C = FM.C;
  /* v153: Grün- und Waldbodentöne gehen stetig ineinander über. Vorher wählte jeder Gitterpunkt (alle 4 m) hart einen von drei
     Tönen – das gab große, flache, eckige Flächen mit geraden Kanten mitten auf Wiesen und Lichtungen. Jetzt hat jeder Punkt eine
     Mischfarbe, die Übergänge laufen als weicher Verlauf über die Dreiecke. */
  const sm = (a, b, t) => { const k = clamp((t - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  let c = wMix(wMix(C.grass, C.grass2, sm(-0.45, 0.0, v)), C.grassD, sm(0.1, 0.6, v));
  const f = forestK(x, z);
  if (f > 0) {
    const alt = x < -70 && z < -70;
    let fc = alt ? 0x4f7a2e : wMix(wMix(0x64903a, 0x6c8f3c, sm(-0.1, -0.5, v)), 0x5e8a34, sm(0.1, 0.5, v));
    if (v2 > 0.55) fc = wMix(fc, 0x7d6a42, (v2 - 0.55) * 1.6);
    c = wMix(c, fc, f);
  }
  for (const q of FWORLD.clearings) {
    const d = Math.hypot(x - q[0], z - q[1]);
    if (d < q[2] + 2) c = wMix(c, 0x90c853, clamp((q[2] + 2 - d) / 2.5, 0, 1));          /* v153: ein Ton – vorher wechselte er je Gitterpunkt zwischen zwei Grüns (große eckige Flecken in der Lichtung) */
  }
  if (typeof HUNT !== "undefined") c = HUNT.ground(x, z, c, v);                                   /* v107: Wildwiese */
  if (inYard(x, z, 1.5)) {
    const y = FWORLD.yard, d = Math.min(x - y[0], y[2] - x, z - y[1], y[3] - z);
    c = wMix(c, FWM.YARD_COL, clamp((d + 1.5) / 2, 0, 1));     /* v77: dieselbe Farbe wie der Schotter im Hof */
  }
  if (inLkwBay(x, z, 1)) {         /* v169: Schotter am Lkw-Stellplatz, weich zum Gras hin */
    const d = Math.min(x + 46.5, -40 - x, z + 29.5, -19 - z);
    c = wMix(c, FWM.YARD_COL, clamp((d + 1) / 1.6, 0, 1));
  }
  const e = lakeE(x, z);
  /* v173: kein eigener Sandring im Gelände mehr (4er-Raster: breit, eckig, harte Kante) – den Strand zeichnet FWM.lakeShore weich;
     unter dem Wasser bleibt der dunkle Seegrund */
  if (e < 0.92) c = wMix(c, 0x3d6f86, clamp((0.92 - e) / 0.1, 0, 1));
  /* Nachbarfelder */
  FWORLD.fields.forEach(([fx, fz, w, d], i) => { if (Math.abs(x - fx) < w / 2 + 0.4 && Math.abs(z - fz) < d / 2 + 0.4) c = wMix(c, i ? 0xb9d466 : 0xd3b76a, 0.6); });
  return c;
}
/* Geländefarbe wie im Kachelgitter (4er-Raster, zwei Dreiecke je Zelle) – für die Wiese um den Hof */
function wGroundAt(x, z) {
  const c = WGRID.cell, x0 = Math.floor(x / c) * c, z0 = Math.floor(z / c) * c, u = (x - x0) / c, v = (z - z0) / c;
  const g = (a, b) => G3.col(worldGroundCol(a, b)), c00 = g(x0, z0), c01 = g(x0, z0 + c), c10 = g(x0 + c, z0), c11 = g(x0 + c, z0 + c);
  const f = (k) => v >= u ? c00[k] + (c11[k] - c01[k]) * u + (c01[k] - c00[k]) * v : c00[k] + (c10[k] - c00[k]) * u + (c11[k] - c10[k]) * v;
  return [f(0), f(1), f(2)];
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
  /* v75: auch die Wege am See halten Kulissenbäume fern (der neue Ostuferweg läuft durch lockeren Baumbestand) */
  [LAKE_STEM, LAKE_WAY, LAKE_EAST].forEach(p => stamp(p, 2.2, 1));
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
/* v77: Abstand zur nächsten Wegmitte (Waldwege und Wege am See) – Kronen und Büsche ragen nicht über den Schotter */
function wayGap(x, z) {
  let d = 1e9;
  for (const p of FWORLD.paths) d = Math.min(d, distLine(x, z, p));
  for (const p of [LAKE_STEM, LAKE_WAY, LAKE_EAST]) d = Math.min(d, distLine(x, z, p));
  return d;
}
/* … auf der Kameraseite (Südosten) des nächsten Weges verdeckt eine Krone ihn früher: bis 0,9 mehr Abstand */
function wayCamSide(x, z) {
  let d = 1e9, px = x, pz = z;
  for (const p of FWORLD.paths.concat([LAKE_STEM, LAKE_WAY, LAKE_EAST])) for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
    const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1), qx = a[0] + dx * t, qz = a[1] + dz * t, e = Math.hypot(x - qx, z - qz);
    if (e < d) { d = e; px = qx; pz = qz; }
  }
  return d > 0.01 ? 0.9 * Math.max(0, ((x - px) + (z - pz)) / d * 0.7071) : 0;
}
/* Kronenradius der Kulissenbäume (Maßstab 1, breiteste Variante) */
const BG_CR = { birke: 0.55, kiefer: 0.85, fichte: 0.7, buche: 1.07, eiche: 1.24, kirsche: 0.74 };
/* Kulissenbaum hier erlaubt? */
function bgTreeOk(x, z, M) {
  if (inHofMax(x, z, 3.2)) return false;      /* v99: Krone soll nicht im Hofzaun stehen (vorher 1,5) */
  if (typeof CAMP !== "undefined" && CAMP.clear(x, z, "bg")) return false;      /* v81: Lagerfeuerplatz */
  if (typeof HUNT !== "undefined" && HUNT.clear(x, z, "bg")) return false;      /* v107: Wildwiese am Hochsitz */
  if (x > 24.5 && x < 47 && z > -17.5 && z < 17.5) return false;
  if (z > 15.8 && z < 22.5) return false;
  if (z > 20 && z < 34 && x > -24 && x < 44) return false;
  if (inYard(x, z, 3.4) || inLkwBay(x, z, 1.2)) return false;        /* v99: Sägewerkszaun (vorher 1,8); v169: Lkw-Stellplatz */
  if (inFieldN(x, z, 1)) return false;
  if (M.at(x, z) & 5) return false;
  if (z > 20 && lakeE(x, z) < 1.18) return false;
  for (const c of FWORLD.clearings) if (Math.abs(x - c[0]) < c[2] && Math.abs(z - c[1]) < c[2] && Math.hypot(x - c[0], z - c[1]) < c[2] - 0.5) return false;
  if (Math.hypot(x - FWORLD.rocks[0], z - FWORLD.rocks[1]) < FWORLD.rocks[2] * 0.75) return false;
  if (Math.hypot(x - FWORLD.pond.x, z - FWORLD.pond.z) < FWORLD.pond.r + 2) return false;
  return !M.nearTree(x, z);
}
/* Bach, der von Osten in den See fließt (Bachmündung) */
/* v75: beginnt im See und läuft bis über den Kartenrand (x = 104) – kein offenes Ende */
const LAKE_CREEK = [[45.2, 58], [48.5, 59], [58, 62], [70, 60], [84, 66], [100, 64], [112, 65]];

/* Schneller Puffer für Kulissen: Kopien eines Modells (nur Drehung um y,
   gleichmäßige Größe) direkt in ein Float32Array – ohne MB-Umweg */
/* v88: Vegetation – Qualität und Windanimation.
   Basis ist statisch (kein Sway, keine Schatten von Gras und Büschen). Der Wind der Grasbüschel läuft als
   gemeinsamer Vertex-Shader (uSway/uSwayT in gl3d.js), nicht per JS pro Halm; ein Knoten je Chunk, vom Frustum-Culling
   mit erledigt. Moduswahl: ?veg=static|wind|auto, localStorage "logistika_veg" oder WV.vegMode(…).
   v92: Gras, Blumen und Farn biegen sich (Pflanzenwind in gl3d.js, uPlant/uWind) statt starr geschert zu werden. „auto“ startet
   mit Wind (die Rechnung im Vertex-Shader kostet fast nichts) und schaltet erst bei echtem Einbruch (< 25 Bilder/s) ab.
   Stärke nach Wetter (still bei Nebel, kräftiger bei Regen und Sturm), Amplituden blenden weich ein und aus. */
const VEGQ = {
  mode: "auto",            /* static | wind | auto */
  grassSway: 0.5,          /* Amplitude des Pflanzenwinds: Spitze einer 0,45 hohen Blume ≈ ± 0,07 (in der Böe bis 0,13) */
  swayT: 1,                /* Zeitfaktor des Shaders: Grundschwingung ≈ 2,7 s, Böen ≈ 11 s */
  range: 40,               /* Wind nur für Chunks innerhalb dieser Entfernung zum Kamerazentrum */
  bushShadow: false,       /* Büsche werfen keinen dynamischen Schatten (statisches Shading) */
  on: false, why: "start", nodes: [], samples: [], prev: 0, good: 0, banUntil: 0, t0: 0, checkAt: 0,
  fps: 0, wind: 0.85, last: 0
};
/* Windstärke je Wetter (uWind.z) */
const WIND_WX = { sonne: 0.85, wolken: 1.1, regen: 1.45, nebel: 0.5, sturm: 2.3 };
(function vegInit() {
  try {
    const q = new URLSearchParams(location.search).get("veg"), ls = localStorage.getItem("logistika_veg");
    const m = q || ls;
    if (m === "static" || m === "wind" || m === "auto") VEGQ.mode = m;
    else if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) VEGQ.mode = "static";
    if (new URLSearchParams(location.search).get("vegshadow") === "1" || localStorage.getItem("logistika_vegshadow") === "1") VEGQ.bushShadow = true;
  } catch (e) {}
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => { VEGQ.prev = 0; VEGQ.samples.length = 0; VEGQ.good = 0; });
})();

class WBuf {
  constructor() { this.f = new Float32Array(9 * 3 * 256); this.n = 0; }
  grow(k) { if (this.n + k <= this.f.length) return; let L = this.f.length * 2; while (L < this.n + k) L *= 2; const g = new Float32Array(L); g.set(this.f.subarray(0, this.n)); this.f = g; }
  /* v86: sy = eigene Höhenskalierung (Büsche: Breite und Höhe unabhängig), k = Helligkeitsfaktor (Farbvariante) */
  add(m, x, z, ry, s, sy, k, y0) {
    this.grow(m.length);
    const f = this.f, c = Math.cos(ry), sn = Math.sin(ry), sh = sy == null ? s : sy;
    let o = this.n;
    for (let i = 0; i < m.length; i += 9) {
      const px = m[i], py = m[i + 1], pz = m[i + 2], qx = m[i + 3], qz = m[i + 5];
      f[o] = x + (c * px + sn * pz) * s; f[o + 1] = py * sh + (y0 || 0); f[o + 2] = z + (-sn * px + c * pz) * s;
      f[o + 3] = c * qx + sn * qz; f[o + 4] = m[i + 4]; f[o + 5] = -sn * qx + c * qz;
      if (k) { f[o + 6] = Math.min(1, m[i + 6] * k); f[o + 7] = Math.min(1, m[i + 7] * k); f[o + 8] = Math.min(1, m[i + 8] * k); }
      else { f[o + 6] = m[i + 6]; f[o + 7] = m[i + 7]; f[o + 8] = m[i + 8]; }
      o += 9;
    }
    this.n = o;
  }
  /* einzelnes Blatt (zwei Dreiecke, flach) */
  leafBit(x, z, rot, sz, col, y) {
    this.grow(54);
    const f = this.f, c = Math.cos(rot) * sz, s = Math.sin(rot) * sz;
    let o = this.n;
    const v = (px, pz) => { f[o] = px; f[o + 1] = y; f[o + 2] = pz; f[o + 3] = 0; f[o + 4] = 1; f[o + 5] = 0; f[o + 6] = col[0]; f[o + 7] = col[1]; f[o + 8] = col[2]; o += 9; };
    const a = [x - c, z - s], b = [x - s * 0.45, z + c * 0.45], d = [x + c, z + s], e = [x + s * 0.45, z - c * 0.45];
    v(a[0], a[1]); v(b[0], b[1]); v(d[0], d[1]); v(a[0], a[1]); v(d[0], d[1]); v(e[0], e[1]);
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

/* v75: Lage des Angelstegs aus dem Bachverlauf: Fußpunkt auf der (geglätteten) Bachlinie nahe dem Ende des
   Westwegs, Normale zum Weg hin. Auflager 2,3 vor der Bachmitte (am Kies), der Steg ist 1,9 lang und endet 0,4
   vor der Bachmitte – das andere Ufer bleibt frei. Der Weg wird in FWM.forestPath auf diesen Punkt ausgerichtet. */
function worldPierFrame() {
  const P = FWM.smoothLine(FWORLD.creek, 6), w = FWORLD.paths[2], q = w[w.length - 1];
  let best = 1e9, F = null, m = null;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], c = P[i], dx = c[0] - a[0], dz = c[1] - a[1], l2 = dx * dx + dz * dz || 1;
    const k = clamp(((q[0] - a[0]) * dx + (q[1] - a[1]) * dz) / l2, 0, 1), fx = a[0] + dx * k, fz = a[1] + dz * k, d = Math.hypot(q[0] - fx, q[1] - fz);
    if (d < best) { best = d; F = [fx, fz]; const l = Math.sqrt(l2); m = [dx / l, dz / l]; }
  }
  if (!F || best > 6) return null;
  let n = [-m[1], m[0]];
  if (n[0] * (q[0] - F[0]) + n[1] * (q[1] - F[1]) < 0) n = [-n[0], -n[1]];
  const x = F[0] + n[0] * 2.3, z = F[1] + n[1] * 2.3, dx = -n[0], dz = -n[1];
  return { x, z, dx, dz, ry: Math.atan2(-dz, dx) };
}
/* v75: Edge-Check – kein Bach darf offen auf der Wiese enden: jedes Ende liegt am Kartenrand, im See
   oder an einer Quelle (FWORLD.spring). Gibt die offenen Enden zurück (und warnt in der Konsole). */
function worldWaterCheck() {
  const open = [], edge = p => p[0] <= WGRID.x0 + 0.5 || p[0] >= WGRID.x1 - 0.5 || p[1] <= WGRID.z0 + 0.5 || p[1] >= WGRID.z1 - 0.5;
  [FWORLD.creek, LAKE_CREEK].forEach(c => [c[0], c[c.length - 1]].forEach(p => {
    const spring = FWORLD.spring && Math.hypot(p[0] - FWORLD.spring[0], p[1] - FWORLD.spring[1]) < 0.5;
    if (!spring && !edge(p) && lakeE(p[0], p[1]) >= 1) open.push(p);
  }));
  if (open.length) console.warn("Bach endet offen bei " + JSON.stringify(open));
  return open;
}

/* --------------------------- v86/v87: Vegetation platzieren ----------------------------- */
/* Büsche (BUSH.generate, v89): keine feste Zahl und kein Verhältnis zu den Bäumen – Eignung aus lokaler Baumdichte, Übergängen,
   Lichtungsrändern, Felsen und Wegen, dazu ein fleckiges Bewuchsfeld; Einzelbüsche und kleine, unterschiedlich große Gruppen,
   Lichtungen bleiben überwiegend offen; Gras (BUSH.grass): Büschel an Birken u. a.
   Positionen kommen aus festen Samen (gleiche Welt → gleiche Vegetation). Gültig ist ein Standort im Wald, der von Hof,
   Feldern, Wegen, Bach, See, Teich, Lagerplatz, Lichtungsmitte, Bäumen, Felsen, Totholz und anderen Büschen frei ist. */
/* v91: freier Boden – nicht auf Hof, Wegen, Wasser, Lichtungsmitte (gemeinsam für Büsche und Waldboden) */
function wFreeGround(x, z, r, MK) {
  if (inHofMax(x, z, 1.5 + r)) return false;
  if (typeof CAMP !== "undefined" && CAMP.clear(x, z, "bg")) return false;
  if (typeof HUNT !== "undefined" && r > 0.25 && HUNT.clear(x, z, "bush")) return false;     /* v107: Wildwiese bleibt offen (Gras und Blumen dürfen) */
  if (x > 24.5 - r && x < 47 + r && z > -17.5 - r && z < 17.5 + r) return false;
  if (z > 15.8 - r && z < 22.5 + r) return false;
  if (z > 20 && z < 34 && x > -24 && x < 44) return false;
  if (inYard(x, z, 1.8 + r) || inLkwBay(x, z, r * 0.6) || inFieldN(x, z, 1 + r)) return false;
  if (MK.at(x, z) & 4) return false;                                      /* Bachufer */
  if (z > 20 && lakeE(x, z) < 1.18) return false;
  if (Math.hypot(x - FWORLD.pond.x, z - FWORLD.pond.z) < FWORLD.pond.r + 1.5 + r) return false;
  for (const c of FWORLD.clearings) if (Math.hypot(x - c[0], z - c[1]) < 1.8 + r) return false;     /* Mitte der Lichtung (Bank, Feuer) bleibt frei */
  return wayGap(x, z) > 1.0 + r * 0.9;                                    /* Wegbreite 1,8 – nichts ragt auf den Schotter */
}
/* Wassernähe 0 … 1 (Bach, Bachmündung, Teich, See) – macht den Boden feuchter */
function wWet(x, z) {
  const d = Math.min(distLine(x, z, FWORLD.creek), distLine(x, z, LAKE_CREEK), Math.hypot(x - FWORLD.pond.x, z - FWORLD.pond.z) - FWORLD.pond.r, (lakeE(x, z) - 1) * 22);
  return clamp(1 - d / 14, 0, 1);
}
function worldBushes(trees, MK, extra, rocks, hidden) {
  const hash = new Map(), HC = 4;
  trees.forEach(t => { const k = Math.floor(t.x / HC) + "," + Math.floor(t.z / HC); (hash.get(k) || hash.set(k, []).get(k)).push(t); });
  const near = (x, z, rad, fn) => {
    const i0 = Math.floor((x - rad) / HC), i1 = Math.floor((x + rad) / HC), j0 = Math.floor((z - rad) / HC), j1 = Math.floor((z + rad) / HC);
    let n = 0;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const L = hash.get(i + "," + j); if (L) for (const t of L) if ((t.x - x) * (t.x - x) + (t.z - z) * (t.z - z) < rad * rad && (!fn || fn(t))) n++; }
    return n;
  };
  const nearestTree = (x, z, rad) => {
    let d = rad;
    const i0 = Math.floor((x - rad) / HC), i1 = Math.floor((x + rad) / HC), j0 = Math.floor((z - rad) / HC), j1 = Math.floor((z + rad) / HC);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const L = hash.get(i + "," + j); if (L) for (const t of L) d = Math.min(d, Math.hypot(t.x - x, t.z - z)); }
    return d;
  };
  const treeObs = trees.map(t => [t.x, t.z, 0.2 + 0.1 * (t.s || 1)]);
  const trunks = trees.map(t => [t.x, t.z, 0.4 + 0.1 * (t.s || 1)]);
  const W = WGRID, c01 = v => clamp(v, 0, 1);
  const sample = rr => {
    for (let i = 0; i < 14; i++) { const x = W.x0 + rr() * (W.x1 - W.x0), z = W.z0 + rr() * (W.z1 - W.z0); if (forestK(x, z) > 0.2) return { x, z }; }
    return null;
  };
  const ok = (x, z, r) => wFreeGround(x, z, r, MK);
  /* Lichtungen: die ausdrücklich angelegten (FWORLD.clearings) plus freie Flächen aus der Baumdichte – ein Punkt, an dem im Umkreis
     von mindestens 4,0 Einheiten kein Baum steht (Kulissenbäume stehen im dichten Kern im Schnitt alle 3,4); der Steinbereich im Altwald wird als eigene Art markiert */
  const clearings = FWORLD.clearings.map(c => ({ x: c[0], z: c[1], r: c[2] - 0.5, explicit: true }));
  (hidden || []).forEach(h => clearings.push({ x: h.x, z: h.z, r: h.r, hidden: true }));      /* v91: versteckte Lichtungen und Senken (FOREST.plan) */
  {
    const cand = [];
    for (let x = W.x0 + 2; x < W.x1; x += 3) for (let z = W.z0 + 2; z < W.z1 - 85; z += 3) {
      if (forestK(x, z) < 0.5 || !ok(x, z, 2)) continue;
      const r = nearestTree(x, z, 8) - 0.4;
      if (r >= 4.0) cand.push({ x, z, r: Math.min(r, 7) });
    }
    cand.sort((a, b) => b.r - a.r || a.x - b.x || a.z - b.z);
    const got = [];
    cand.forEach(c => {
      if (clearings.some(o => Math.hypot(o.x - c.x, o.z - c.z) < o.r + c.r * 0.6) || got.some(o => Math.hypot(o.x - c.x, o.z - c.z) < (o.r + c.r) * 0.9)) return;
      if (Math.hypot(c.x - FWORLD.rocks[0], c.z - FWORLD.rocks[1]) < FWORLD.rocks[2]) c.kind = "rock";
      got.push(c);
    });
    got.forEach(c => clearings.push(c));
  }
  const pathLines = FWORLD.paths.concat([LAKE_STEM, LAKE_WAY, LAKE_EAST]);
  const segs = []; let segLen = 0;
  pathLines.forEach(p => { for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (l > 0.1) { segs.push([p[i - 1], p[i], l]); segLen += l; } } });
  /* Standortmerkmale: rho = lokale Baumdichte im Umkreis von 5 relativ zum dichten Kernwald (1 = Kernwald, 0 = keine Bäume),
     edge = Übergang (Waldrand oder deutlicher Dichteunterschied zwischen nahem und weitem Umkreis) */
  const REF = 0.084, PI = Math.PI;
  const feat = (x, z) => {
    const f = forestK(x, z), gap = wayGap(x, z);
    let cd = 1e9; for (const c of clearings) cd = Math.min(cd, Math.hypot(x - c.x, z - c.z) - c.r);
    const rd = Math.hypot(x - FWORLD.rocks[0], z - FWORLD.rocks[1]) - FWORLD.rocks[2], wd = distLine(x, z, FWORLD.creek);
    const rho = near(x, z, 5) / (PI * 25 * REF), rs = near(x, z, 3.2) / (PI * 10.24 * REF), rl = near(x, z, 8) / (PI * 64 * REF);
    return {
      rho, edge: Math.max(c01((0.7 - f) / 0.5), c01(2.2 * Math.abs(rs - rl))), conifer: c01(near(x, z, 5, t => t.sp === "fichte" || t.sp === "kiefer") / 3),
      path: c01(1 - (gap - 1) / 4), clearing: c01(1 - cd / 5), rock: c01(1 - rd / 6), water: c01(1 - wd / 10)
    };
  };
  const res = BUSH.generate({ rng: wRng(7331 + 4242), seed: 7331, area: { x0: W.x0, z0: W.z0, x1: W.x1, z1: W.z1 }, inForest: (x, z) => forestK(x, z) > 0.2, ok, feat, clearings,
    rocks: rocks || [], obstacles: treeObs.concat(extra || []), trunks });
  /* Gras: Birken (Stammradius je Quelle), Lichtungsränder, Steine, sonnige Wegränder, Übergänge – zählt nicht zum 7:1 */
  const birches = trees.filter(t => t.sp === "birke" && (t.st == null || t.st === "up")).map(t => ({ x: t.x, z: t.z, s: t.s || 1, r: t.sz ? (0.07 * FWM.TH[t.sz] + 0.02) * 1.15 * (t.s || 1) : 0.11 * (t.s || 1) }));
  const sampleEdge = rr => {
    let x = rr() * segLen, S = segs[0]; for (const g of segs) { if (x < g[2]) { S = g; break; } x -= g[2]; }
    const t = x / S[2], px = S[0][0] + (S[1][0] - S[0][0]) * t, pz = S[0][1] + (S[1][1] - S[0][1]) * t, nx = -(S[1][1] - S[0][1]) / S[2], nz = (S[1][0] - S[0][0]) / S[2], o = (rr() < 0.5 ? -1 : 1) * (1.3 + rr() * 0.9);
    const X = px + nx * o, Z = pz + nz * o; return forestK(X, Z) > 0.15 && ok(X, Z, 0.1) ? { x: X, z: Z } : null;
  };
  const sampleTrans = rr => { const p = sample(rr); if (!p) return null; const f = forestK(p.x, p.z); return f > 0.2 && f < 0.65 ? p : null; };
  const gr = BUSH.grass({ birches, seed: 7331, ok: (x, z) => ok(x, z, 0.1) && forestK(x, z) > 0.1, sp: res.spacing, clearings, rocks, sampleEdge, sampleTrans });
  res.grass = gr;
  res.clearings = clearings;
  return res;
}


/* ===================== v91: Waldboden, besondere Orte, Entdeckungen (forest.js) ===================== */
/* Der Seed legt Komposition und alle Plätze fest (Standard 7331 = „Lichtungswald“). Zum Vergleichen: ?fseed=7330…7333 in der Adresse (vier Kompositionen). */
function forestSeed() { try { const q = +new URLSearchParams(location.search).get("fseed"); if (q > 0) return q | 0; } catch (e) {} return 7331; }
/* Maßstab der kleinen Dinge – groß genug, dass sie aus der Spielkamera lesbar sind (Kameraabstand 22–50) */
const FSCALE = { stone: 1.35, roots: 1, stick: 1.5, bark: 1.4, mosslog: 1, mush: 1.9, flowers: 1.7, fern: 1.2, stump: 1, lost: 1.8, paw: 1.5, fruit: 1.5, berry: 1.5, nest: 1.9 };
function worldForest(chunks, res, plan, MK, chunkOf, rockObs, gcAt) {
  const t0 = performance.now(), ftr = [];
  for (const c of chunks.values()) c.trees.forEach(t => ftr.push(t));
  (S.farm.trees || []).forEach(t => ftr.push(t));
  const dims = b => { const T = BUSH.BY_ID[b.typeId]; return { r: (T.w[0] + T.w[1]) / 4 * b.scale[0], h: (T.h[0] + T.h[1]) / 2 * b.scale[1] }; };
  const W = WGRID;
  const F = FOREST.generate({ seed: forestSeed(), area: { x0: W.x0, z0: W.z0, x1: W.x1, z1: W.z1 - 85 }, trees: ftr, bushes: res.instances, dims,
    inForest: (x, z) => forestK(x, z) > 0.2, forestK, ok: (x, z, r) => wFreeGround(x, z, r, MK), wayGap, wet: wWet, clearings: res.clearings, rocks: rockObs || [], plan });
  /* Büsche: größere/dunklere Exemplare, zweite Büsche für Durchblicke */
  const inst = res.instances;
  for (const k in F.bushMods.scale) { const b = inst[k], m = F.bushMods.scale[k]; b.scale = [+(b.scale[0] * m[0]).toFixed(3), +(b.scale[1] * m[1]).toFixed(3), +(b.scale[2] * m[0]).toFixed(3)]; if (F.bushMods.tint[k]) b.tint = F.bushMods.tint[k]; }
  F.bushMods.extra.forEach(e => {
    const o = inst[e.clone];
    inst.push(Object.assign({}, o, { id: "bx" + inst.length, position: [e.x, 0, e.z], rotationY: e.ry, scale: [+(o.scale[0] * e.k).toFixed(3), +(o.scale[1] * e.k).toFixed(3), +(o.scale[2] * e.k).toFixed(3)], variantSeed: (o.variantSeed + 7) % 1000003, group: -1 }));
  });
  worldForestBuild(F, chunkOf, gcAt);
  /* Lebendigkeit: wo Tiere, Falter, Lichtschächte und fallende Blätter hingehören */
  const L = { peek: [], homes: [], shafts: [], oldTrees: [], trees: ftr.filter(t => FOREST.isBroad(t.sp) && t.s >= 1.1) };
  F.disc.forEach(D => { if (D.type === "hedgehog" && D.face != null) L.peek.push({ x: D.x, z: D.z, face: D.face, r: D.r }); });
  const logs = [];
  F.places.forEach(p => {
    if (p.type === "sun" || p.type === "hidden" || p.type === "field") L.homes.push({ x: p.x, z: p.z, r: Math.min(p.r || 3, 3.4) });
    if (p.type === "sun") L.shafts.push({ x: p.x + 0.4, z: p.z + 0.2 });
    if (p.type === "log") logs.push(p);
  });
  /* Vogelsitz: der Moosstamm, vor dem (von der Spielkamera im Südosten aus gesehen) am wenigsten Kronen stehen */
  let bestC = 1e9;
  logs.forEach(p => { let n = 0; for (const t of ftr) { const d = Math.hypot(t.x - (p.x + 2.5), t.z - (p.z + 2.5)); if (d < 4.5) n += (t.s || 1); } if (n < bestC) { bestC = n; L.perch = { x: p.x, z: p.z }; } });
  ftr.forEach(t => { if (FOREST.isOldB(t)) L.oldTrees.push(t); });
  F.life = L;
  F.ms = +(performance.now() - t0).toFixed(0);
  return F;
}
/* Flecken, Dinge und Entdeckungen in die Boden-Kacheln schreiben (ohne Schatten, kein eigener Knoten je Ding) */
function worldForestBuild(F, chunkOf, gcAt) {
  const md = {}, fm = (key, fn) => md[key] || (md[key] = new Float32Array(fn().v)), col = h => G3.col(h);
  /* v92: die Flecken selbst sind Teil der Bodenfarbe (worldGround). Hier nur die einzelnen Blätter der Laubschicht –
     jedes auf eigener Höhe, damit sich überlappende Blätter nie die gleiche Tiefe teilen */
  let lb = 0;
  const LG = new Map(), lkey = (x, z) => (Math.floor(x) + 2048) * 8192 + Math.floor(z) + 2048;
  const lfree = (x, z) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = LG.get(lkey(x + i, z + j)); if (L) for (const q of L) if (Math.hypot(q[0] - x, q[1] - z) < 0.32) return false; } return true; };
  F.patches.forEach(p => {
    if (!p.bits) return;
    const buf = chunkOf(p.x, p.z).g;
    for (let i = 0; i < p.bits; i++) {
      const h1 = Math.sin(p.seed * 0.13 + i * 4.1) * 43758.5, h2 = Math.sin(p.seed * 0.71 + i * 9.7) * 24634.6, h3 = Math.sin(p.seed * 0.29 + i * 2.3) * 12345.6;
      const a = (h1 - Math.floor(h1)) * 6.283, d = Math.sqrt(h2 - Math.floor(h2)) * p.r * 0.8, lc = FOREST.LEAF_COLS[Math.floor((h3 - Math.floor(h3)) * 4) % 4];
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (!lfree(x, z)) continue;                         /* Blätter liegen nie übereinander (keine zwei Flächen in derselben Tiefe) */
      const k = lkey(x, z); let L = LG.get(k); if (!L) LG.set(k, L = []); L.push([x, z]);
      buf.leafBit(x, z, a * 3, 0.1 + 0.05 * (h3 - Math.floor(h3)), col(lc), 0.006 + 0.0012 * (lb++ % 6));
    }
  });
  F.items.forEach(it => {
    const g = chunkOf(it.x, it.z).g, S0 = FSCALE[it.k] || 1, s = (it.s || 1) * S0;
    let m;
    switch (it.k) {
      case "stone": m = fm("st" + (it.v % 3) + (it.moss ? "m" : ""), () => FWM.stone(it.v % 3, !!it.moss)); break;
      case "roots": m = fm("ro" + it.sp, () => FWM.roots(it.sp)); break;
      case "stick": m = fm("sti", () => FWM.stick()); break;
      case "bark": m = fm("bar", () => FWM.bark()); break;
      case "mosslog": m = fm("ml" + (it.v % 2), () => FWM.mosslog(it.v % 2)); break;
      case "mush": m = fm("mu" + it.mk, () => FWM.mushGroup(it.mk)); break;
      case "flowers": {
        /* v92: Farbe aus dem Generator, Form (Sternblüten / Ähren) fest aus dem Ort; Pflanzen kommen in die Wind-Kachel */
        const fv = (it.v % 4) + 4 * (Math.floor(Math.abs(Math.sin(it.x * 12.9898 + it.z * 78.233)) * 43758.5) % 2);
        chunkOf(it.x, it.z).v.add(fm("fl" + fv, () => FWM.flowers(fv)), it.x, it.z, it.ry, s);
        return;
      }
      case "fern": chunkOf(it.x, it.z).v.add(fm("fern", () => FWM.fern2()), it.x, it.z, it.ry, s); return;
      case "stump": m = fm("stp" + it.sp, () => FWM.stump(it.sp, 1)); break;
      case "lost": m = fm("lo" + it.lk, () => FWM.lost(it.lk)); break;
      case "paw": m = fm("paw", () => FWM.paw()); break;
      case "fruit": m = fm("fr" + it.col, () => FWM.fruit(it.col)); break;
      default: return;
    }
    g.add(m, it.x, it.z, it.ry, s);
  });
  F.disc.forEach(D => {
    if (D.type === "berries") D.berries.forEach(b => chunkOf(b[0], b[2]).g.add(fm("be" + D.bc, () => FWM.berry(D.bc)), b[0], b[2], 0, 1.4, 1.4, null, b[1]));
    else if (D.type === "nest") chunkOf(D.nx, D.nz).g.add(fm("nest", () => FWM.nest()), D.nx, D.nz, D.ry, 1.9, 1.9, null, D.ny);
    else if (D.type === "gap") chunkOf(D.lx, D.lz).g.add(fm("lo" + D.lk, () => FWM.lost(D.lk)), D.lx, D.lz, D.ry, 1.8);
  });
}


/* ===================== v91: kleines Leben im Wald ===================== */
/* Alles an Orten, wo es hingehört: Igel schauen aus ihren Büschen, Falter über Blumenwiesen und Lichtinseln, ein Vogel sitzt auf dem
   Moosstamm, Laub fällt nur von alten Laubbäumen, Lichtschächte stehen in den Lichtinseln. Nichts davon läuft gleichzeitig oder im Takt:
   jede Gruppe hat eigene Kommen-und-Gehen-Zeiten (wildPres), Bewegungen laufen mit eigener Phase. Gerechnet wird nur in Kameranähe. */
const LIFE_BFLY = [[0xf2c230, 0xc77a1e], [0xe8e4d8, 0xaec2e0], [0x5f9ee6, 0x2c5aa0], [0xe0703a, 0x7a2a18]];
function worldMakeLife() {
  try { worldMakeLife0(); } catch (e) { console.warn("Waldleben:", e); WV.life = null; }
}
function worldMakeLife0() {
  const R = FV.R, F = WV.forest;
  WV.life = null;
  if (!F || !F.life) return;
  const L = F.life, Lf = { peek: [], bfly: [], shafts: [], bird: null, leafT: 0, near: [], nearT: 0 };
  L.peek.forEach((p, i) => {
    const off = Math.max(0.3, p.r * 0.6), n = fnode(fmesh("wild:hedgehog", FWM.hedgehog), { s: 2.7, ry: Math.PI / 2 - p.face, visible: false });
    R.nodes.push(n);
    Lf.peek.push({ i, p, n, f: 0, bx: p.x + Math.cos(p.face) * off, bz: p.z + Math.sin(p.face) * off, dx: Math.cos(p.face), dz: Math.sin(p.face), hide: 0, seen: false });
  });
  L.homes.forEach((h, k) => {
    for (let j = 0; j < 2; j++) {
      const i = k * 2 + j, cl = LIFE_BFLY[(i * 7 + k) % 4];
      const body = fnode(fmesh("bfly", () => FWM.butterfly()), { s: 3.4, visible: false });
      const wl = R.addChild(body, fnode(fmesh("bflyW" + (i * 7 + k) % 4, () => FWM.butterflyWing(cl[0], cl[1])), {}));
      const wr = R.addChild(body, fnode(fmesh("bflyW" + (i * 7 + k) % 4, () => FWM.butterflyWing(cl[0], cl[1])), { sx: -1 }));
      R.nodes.push(body);
      Lf.bfly.push({ i, h, body, wl, wr, a: i * 2.3, sp: 0.35 + (i % 4) * 0.09, rr: h.r * (0.5 + (i % 3) * 0.2), hh: 0.5 + (i % 4) * 0.25, f: 0 });
    }
  });
  if (L.perch) {
    const body = fnode(fmesh("perch:bird", () => FWM.bird(0x8a6a4a)), { s: 2.6, x: L.perch.x + 0.15, z: L.perch.z, y: 0.42, ry: 1.2, visible: false });
    R.addChild(body, fnode(fmesh("perchW:bird", () => FWM.birdWing(0x6a5240)), { rz: 1.25 }));
    R.addChild(body, fnode(fmesh("perchW:bird", () => FWM.birdWing(0x6a5240)), { sx: -1, rz: -1.25 }));
    R.nodes.push(body);
    Lf.bird = { body, f: 0, p: L.perch };
  }
  L.shafts.forEach((p, i) => {
    const n = fnode(fmesh("lshaft", () => FWM.lightShaft()), { x: p.x, z: p.z, s: 1, alpha: 0, visible: false, shadow: false });
    const np = fnode(fmesh("lpatch", () => FWM.lightPatch()), { x: p.x, z: p.z, s: 1, alpha: 0, visible: false, shadow: false });      /* v153: Draufsicht */
    R.nodes.push(n, np);
    Lf.shafts.push({ i, n, np, x: p.x, z: p.z });
  });
  WV.life = Lf;
}
function lifeRain() { const F = S.farm; return !!(F && F.wx && (F.wx.k === "regen" || farmEvOn("sturm"))); }
function stepLife(dt, time) {
  const Lf = WV.life, F = WV.forest;
  if (!Lf) return;
  const cam = FV.R.cam, h = (S.time % 1440) / 60, rain = lifeRain(), day = h >= 7 && h < 20.5, fade = dt / 1.2;
  const nearCam = (x, z, r) => Math.abs(x - cam.tx) < r && Math.abs(z - cam.tz) < r;
  /* Igel: schieben sich aus dem Busch, bleiben ein Weilchen, ziehen sich wieder zurück */
  for (const q of Lf.peek) {
    const on = wildPres("hp" + q.i, dt, !rain && h >= 6 && h < 22) && q.hide <= 0;
    if (q.hide > 0) q.hide -= dt;
    q.f = on ? Math.min(1, q.f + dt / 1.6) : Math.max(0, q.f - dt / 1.1);
    const show = q.f > 0 && nearCam(q.bx, q.bz, 60);
    q.n.visible = show;
    if (!show) continue;
    const e = q.f * q.f * (3 - 2 * q.f), back = (1 - e) * 0.55;                    /* weich heraus-/hineingleiten */
    q.n.x = q.bx - q.dx * back; q.n.z = q.bz - q.dz * back; q.n.y = 0;
    q.n.ry = Math.PI / 2 - q.p.face + Math.sin(time * 0.7 + q.i * 2.1) * 0.12 * (q.f > 0.95 ? 1 : 0);   /* schnuppert: Kopf pendelt leicht */
    q.n.rx = q.f > 0.95 ? Math.max(0, Math.sin(time * 1.9 + q.i)) * 0.06 : 0;
  }
  /* Falter: unregelmäßige Schleifen über der Wiese, nur bei Tag und trockenem Wetter */
  for (const b of Lf.bfly) {
    const on = wildPres("bf" + b.i, dt, !rain && h >= 8 && h < 19.5);
    b.f = on ? Math.min(1, b.f + fade) : Math.max(0, b.f - fade);
    const B = b.body, show = b.f > 0 && nearCam(b.h.x, b.h.z, 46);
    B.visible = show;
    if (!show) continue;
    const ox = B.x, oz = B.z, oa = b.a;
    if (!b.dir) b.dir = 1;
    b.a += dt * b.sp * b.dir * (0.8 + 0.4 * Math.sin(time * 0.43 + b.i * 1.9));
    const nx = b.h.x + Math.cos(b.a) * b.rr + Math.sin(b.a * 2.3 + b.i) * 0.7;
    const nz = b.h.z + Math.sin(b.a * 0.9) * b.rr * 0.8 + Math.cos(b.a * 1.7 + b.i) * 0.6;
    /* v146: Falter fliegen nicht durch Häuser, Bäume, Felsen oder Zäune: an Hindernissen drehen sie um und ziehen die Schleife enger */
    const nv = typeof navStepBlocked === "function";
    if (!b.init) {                                  /* Start: nie mitten in einem Hindernis */
      let sx = nx, sz = nz;
      if (nv && navBlockedAt(sx, sz)) { const f = navFree(sx, sz, "wild", 4); sx = f[0]; sz = f[1]; }
      B.x = sx; B.z = sz; b.init = true;
    } else if (nv && (navBlockedAt(nx, nz) || navHit(ox, oz, nx, nz, NAV.cw)) && !navBlockedAt(ox, oz)) {
      if (b.rr0 == null) b.rr0 = b.rr; b.a = oa; b.dir = -b.dir; b.rr = Math.max(0.5, b.rr * 0.93);
    } else if (nv && navBlockedAt(ox, oz) && navBlockedAt(nx, nz)) {
      b.a = oa; b.dir = -b.dir; b.rr = Math.max(0.5, b.rr * 0.93);   /* steckt fest: zurück, bis sie frei ist */
    } else { B.x = nx; B.z = nz; if (b.rr0 == null) b.rr0 = b.rr; else if (b.rr < b.rr0) b.rr = Math.min(b.rr0, b.rr + dt * 0.04); }
    B.y = b.hh + Math.sin(time * 1.6 + b.i * 2) * 0.22 + Math.sin(b.a * 3.3) * 0.12;
    if (Math.hypot(B.x - ox, B.z - oz) > 1e-4) B.ry = Math.atan2(B.x - ox, B.z - oz);
    const fl = Math.sin(time * (17 + b.i % 3) + b.i * 1.3) * 0.85 * (Math.sin(time * 0.9 + b.i * 3) > -0.55 ? 1 : 0.15);      /* zwischendurch segeln sie */
    b.wl.rz = fl; b.wr.rz = -fl;
  }
  /* Vogel auf dem Moosstamm: dreht den Kopf, pickt, ist nicht immer da */
  if (Lf.bird) {
    const v = Lf.bird, on = wildPres("pb", dt, !rain && h >= 6 && h < 19);
    v.f = on ? Math.min(1, v.f + fade) : Math.max(0, v.f - fade);
    v.body.visible = v.f > 0.02 && nearCam(v.p.x, v.p.z, 46);
    if (v.body.visible) { v.body.ry = 1.2 + Math.sin(time * 0.6) * 0.5 * (Math.sin(time * 0.23) > 0 ? 1 : 0.2); v.body.rx = Math.max(0, Math.sin(time * 1.4)) > 0.9 ? 0.35 : 0; v.body.y = 0.42 - (1 - v.f) * 0.3; v.body.alpha = v.f; }
  }
  /* Lichtschächte: nur bei Sonne, atmen langsam, jeder in eigener Phase */
  const sun = rain ? 0 : Math.max(0, Math.sin((h - 6.5) / 14 * Math.PI)) * (h > 6.5 && h < 20.5 ? 1 : 0);
  /* v153: Die Lichtsäule gibt es nur bei flachem Blick (Ich-Perspektive); aus der Hofansicht (Blick von schräg oben) liegt dort
     stattdessen ein weicher Lichtfleck auf dem Boden – die Säule war von oben ein hartes Sechseck mit geraden Kanten. */
  const lowView = !!FV.fp || cam.pitch < 0.55;
  for (const sh of Lf.shafts) {
    const a = sun * 0.1 * (0.8 + 0.2 * Math.sin(time * 0.17 + sh.i * 2.4)), n = sh.n, np = sh.np, near = nearCam(sh.x, sh.z, 60);
    n.visible = lowView && a > 0.01 && near; n.alpha = a;
    if (np) { np.visible = !lowView && a > 0.01 && near; np.alpha = a * 0.16; }       /* 8 Scheiben übereinander: 8 × 1,3 % ≈ 10 % in der Mitte */
  }
  /* fallendes Laub: einzelne Blätter von alten Laubbäumen in Kameranähe */
  Lf.nearT -= dt;
  if (Lf.nearT <= 0) { Lf.nearT = 2; Lf.near = F.life.oldTrees.filter(t => nearCam(t.x, t.z, 30)); }
  Lf.leafT -= dt;
  if (Lf.leafT <= 0 && Lf.near.length) {
    Lf.leafT = 0.8 + Math.random() * 2.2;
    if (!rain || Math.random() < 0.3) {
      const t = Lf.near[Math.floor(Math.random() * Lf.near.length)], hh = 2.6 + (t.s || 1.5) * 1.6, c = FOREST.LEAF_COLS[Math.floor(Math.random() * 3)];
      FV.R.emit({ x: t.x + (Math.random() - 0.5) * 2, y: hh, z: t.z + (Math.random() - 0.5) * 2, vx: 0.2 + Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.3, vy: -0.5, life: hh / 0.5, size: 0.13, size2: 0.12,
        col: [(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255, 1], fade: false, shape: 1 });
    }
  }
}



/* v77/v92: Krone eines Kulissenbaums ragt nicht über den Weg (auf der Kameraseite etwas mehr Abstand) */
function bgWayOk(x, z, sp, sc, MK) {
  return !((MK.at(x, z) & 2 || z > 19) && wayGap(x, z) < 1 + (BG_CR[sp] || 1) * sc + wayCamSide(x, z));
}
/* v92: Kulissenbäume standen seit v89 über die volle Zellbreite gestreut ohne Abstandsprüfung untereinander – manche Stämme
   steckten im Nachbarn, Kronen ineinander. Jetzt: die fällbaren Bäume (in ausgewachsener Größe) und die Felsen stehen fest,
   dann kommen die Kulissenbäume von groß nach klein. Wer mit einem schon stehenden Baum ineinandersteht, probiert feste
   Ausweichstellen (Richtung aus seinem Schlüssel, bis ≈ 2 Einheiten), sonst entfällt er. Maße: treeBody / FTREE_DIM (erbe.js),
   Regel: treeClash. Gleiche Welt → gleiches Ergebnis; Schlüssel (bgCut) bleiben gültig. */
function worldTreeSpace(chunks, chunkOf, MK, rockObs) {
  const C = 6, H = new Map(), key = (i, j) => (i + 1000) * 4096 + j + 1000;
  const put = B => { const k = key(Math.floor(B.x / C), Math.floor(B.z / C)); let L = H.get(k); if (!L) H.set(k, L = []); L.push(B); };
  const hits = B => {
    const R = B.cr + 6, i0 = Math.floor((B.x - R) / C), i1 = Math.floor((B.x + R) / C), j0 = Math.floor((B.z - R) / C), j1 = Math.floor((B.z + R) / C);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const L = H.get(key(i, j)); if (L) for (const o of L) if (o.rock ? Math.hypot(o.x - B.x, o.z - B.z) < o.r + B.tr + 0.35 : treeClash(B, o)) return true; }
    return false;
  };
  (S.farm.trees || []).forEach(t => put(treeBody(t.sp, Math.max(t.mx || 1, t.sz || 1), t.s || 1, t.x, t.z)));
  rockObs.forEach(r => put({ rock: 1, x: r[0], z: r[1], r: r[2], cr: r[2] }));
  const all = [];
  for (const c of chunks.values()) for (const t of c.trees) { bgFinal(t); all.push({ t, c, B: treeBody(t.sp, t.fz, t.fs, t.x, t.z) }); }
  all.sort((a, b) => b.B.y1 - a.B.y1 || a.t.k - b.t.k);
  let moved = 0, dropped = 0;
  for (const e of all) {
    const t = e.t;
    if (!hits(e.B)) { put(e.B); continue; }
    let ok = false;
    for (let i = 0; i < 6 && !ok; i++) {
      const [x, z] = treeNudge(t.k, i, t.x, t.z, 0.55);
      const B = treeBody(t.sp, t.fz, t.fs, x, z);
      if (!bgTreeOk(x, z, MK) || !bgWayOk(x, z, t.sp, t.s, MK) || hits(B)) continue;
      t.x = t.fx = +x.toFixed(2); t.z = t.fzz = +z.toFixed(2); e.B = B; ok = true; moved++;
      const c2 = chunkOf(t.x, t.z);
      if (c2 !== e.c) { e.c.trees.splice(e.c.trees.indexOf(t), 1); c2.trees.push(t); }
    }
    if (ok) { put(e.B); continue; }
    e.c.trees.splice(e.c.trees.indexOf(t), 1); dropped++;
  }
  return { trees: all.length, moved, dropped };
}

/* ===================== v92: Gelände mit eingebautem Waldboden ===================== */
/* Grundfarben liegen auf dem 4er-Gitter (GC). Wo Waldbodenflecken liegen, wird die Kachel in 3 × 3 Teilkacheln (1⅓ m) geteilt
   und der Fleck geht als Farbfeld in die Eckfarben ein: weiche, unregelmäßige Ränder, keine zweite Fläche über dem Boden.
   (v91 legte jeden Fleck als eigenes 7-Eck knapp über den Boden; sein Rand lief zur Grundfarbe statt zum Fleck darunter aus –
   daher harte Kanten, helle Ränder und übereinanderliegende Flächen.) Kanten zu ungeteilten Nachbarn bleiben nahtlos: Der Einfluss
   eines Flecks endet innerhalb der markierten Kacheln, dort ist die Farbe genau die Dreiecks-Interpolation der groben Kachel. */
const GROUND_SUB = 3;
const GROUND_A = { moss: 0.72, damp: 0.7, leaf: 0.78, needle: 0.72, earth: 0.8, glade: 0.42 };     /* Deckkraft je Bodenart */
function worldGround(chunkOf, GC, nx, nz, cell, gcAt, F) {
  const W = WGRID, N = GROUND_SUB, sc = cell / N, col = h => G3.col(h);
  const prep = [];
  if (F && typeof FOREST !== "undefined") F.patches.forEach(p => {
    const D = FOREST.PATCH[p.k], base = col(D.cols[Math.min(D.cols.length - 1, Math.floor(p.tone * D.cols.length))]);
    const br = 0.94 + 0.12 * ((p.seed % 97) / 97), warm = p.warm ? 1.05 : 1, ex = Math.sqrt(p.ecc), h = p.seed * 0.0137;
    prep.push({ x: p.x, z: p.z, r: p.r, ex, ez: 1 / ex, c: Math.cos(p.rot), s: Math.sin(p.rot), R: p.r * ex * 1.33 + 0.02,
      s1: h % 6.283, s2: (h * 1.7) % 6.283, s3: (h * 2.9) % 6.283, a: GROUND_A[p.k] || 0.7,
      col: [Math.min(1, base[0] * br * warm), Math.min(1, base[1] * br * warm), Math.min(1, base[2] * br)] });
  });
  /* Kacheln, die ein Fleck berührt (Bereich inklusive Rand), mit ihren Flecken */
  const cellP = new Map();
  prep.forEach((q, n) => {
    const i0 = Math.max(0, Math.floor((q.x - q.R - W.x0) / cell)), i1 = Math.min(nx - 1, Math.floor((q.x + q.R - W.x0) / cell));
    const j0 = Math.max(0, Math.floor((q.z - q.R - W.z0) / cell)), j1 = Math.min(nz - 1, Math.floor((q.z + q.R - W.z0) / cell));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = j * nx + i; let L = cellP.get(k); if (!L) cellP.set(k, L = []); L.push(n); }
  });
  /* Farbe eines Punktes: Grundfarbe, darüber die Flecken in fester Reihenfolge (Mitte deckend, Rand weich, Umriss mit Wellen) */
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const colAt = (x, z, L) => {
    const g = gcAt(x, z), c = [g[0], g[1], g[2]];
    for (const n of L) {
      const q = prep[n], dx = x - q.x, dz = z - q.z;
      if (dx > q.R || dx < -q.R || dz > q.R || dz < -q.R) continue;
      const u = (q.c * dx + q.s * dz) / (q.r * q.ex), v = (-q.s * dx + q.c * dz) / (q.r * q.ez), d = Math.sqrt(u * u + v * v);
      if (d > 1.33) continue;
      const t = Math.atan2(v, u), m = 1 + 0.16 * Math.sin(3 * t + q.s1) + 0.1 * Math.sin(5 * t + q.s2) + 0.06 * Math.sin(2 * t + q.s3);
      const w = 1 - ss(0.3, 1, d / m);
      if (w <= 0) continue;
      const a = w * q.a;
      c[0] += (q.col[0] - c[0]) * a; c[1] += (q.col[1] - c[1]) * a; c[2] += (q.col[2] - c[2]) * a;
    }
    return c;
  };
  /* Eckfarben des feinen Gitters einmal je Punkt (gemeinsame Kanten haben so garantiert dieselbe Farbe) */
  const FX = nx * N + 1, vc = new Map();
  const vAt = (I, J, L) => { const k = J * FX + I; let c = vc.get(k); if (!c) { c = colAt(W.x0 + I * sc, W.z0 + J * sc, L); vc.set(k, c); } return c; };
  let fine = 0, coarse = 0;
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const x = W.x0 + i * cell, z = W.z0 + j * cell;
      if (x >= HOFG.x0 && x + cell <= HOFG.x1 && z >= HOFG.z0 && z + cell <= HOFG.z1) continue;     /* Hofwiese kommt extra */
      if (lakeE(x + cell / 2, z + cell / 2) < 0.8) continue;                          /* unter Wasser */
      const g = chunkOf(x + 0.1, z + 0.1).g, L = cellP.get(j * nx + i);
      if (!L) {
        const c00 = GC[j * (nx + 1) + i], c10 = GC[j * (nx + 1) + i + 1], c01 = GC[(j + 1) * (nx + 1) + i], c11 = GC[(j + 1) * (nx + 1) + i + 1];
        g.quad(x, z, cell, c00, c10, c01, c11); coarse++;
        continue;
      }
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
        const I = i * N + a, J = j * N + b;
        g.quad(x + a * sc, z + b * sc, sc, vAt(I, J, L), vAt(I + 1, J, L), vAt(I, J + 1, L), vAt(I + 1, J + 1, L));
      }
      fine++;
    }
  WV.groundInfo = { coarse, fine, sub: N, verts: vc.size };
}

/* --------------------------- Kulisse bauen ----------------------------- */
function worldStatic() {
  const R = FV.R;
  WV.trees.clear(); WV.falling = []; WV.hofKey = ""; WV.hof = []; WV.barriers = {}; WV.npc = null;
  WV.wild = []; WV.fly = []; WV.swarm = []; WV.trKey = ""; WV.trNodes = []; WV.trFx = null; WV.trChest = null; WV.trReveal = null; WV.trIntro = null; WV.pets.clear(); WV.staff.clear(); WV.evKey = ""; WV.evNodes = []; WV.sawBlades = null; WV.pvKey = ""; WV.pvNodes = []; WV.piles = new Map();
  const fell = (S.farm.trees || []).filter(t => !t.bg);       /* angetippte Kulissenbäume stehen schon in bgCut */
  const rnd = wRng(7331);
  const MK = worldMasks(fell);
  /* Gelände und Kulissenwald in Kacheln – was nicht im Bild ist, wird nicht
     gezeichnet. Gebaut direkt in Float32Arrays (Tausende Bäume, schnell). */
  const CH = WGRID.chunk, cell = WGRID.cell;
  const chunks = new Map();
  const chunkOf = (x, z) => {
    const i = Math.floor((x - WGRID.x0) / CH), j = Math.floor((z - WGRID.z0) / CH), k = i + "," + j;
    let c = chunks.get(k);
    if (!c) { c = { g: new WBuf(), d: new WBuf(), v: new WBuf(), trees: [] }; chunks.set(k, c); }
    return c;
  };
  /* Bodenfarben einmal je Gitterpunkt */
  const nx = Math.round((WGRID.x1 - WGRID.x0) / cell), nz = Math.round((WGRID.z1 - WGRID.z0) / cell);
  const GC = new Array((nx + 1) * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) GC[j * (nx + 1) + i] = G3.col(worldGroundCol(WGRID.x0 + i * cell, WGRID.z0 + j * cell));
  /* Bodenfarbe aus dem Gitter (dieselbe Dreiecksaufteilung wie die Kacheln, ohne die Rauschfunktionen neu zu rechnen) – für weiche Ränder der Bodenflecken */
  const gcAt = (x, z) => {
    const fi = (x - WGRID.x0) / cell, fj = (z - WGRID.z0) / cell, i = clamp(Math.floor(fi), 0, nx - 1), j = clamp(Math.floor(fj), 0, nz - 1), u = clamp(fi - i, 0, 1), v = clamp(fj - j, 0, 1);
    const c00 = GC[j * (nx + 1) + i], c10 = GC[j * (nx + 1) + i + 1], c01 = GC[(j + 1) * (nx + 1) + i], c11 = GC[(j + 1) * (nx + 1) + i + 1];
    return [0, 1, 2].map(k => v >= u ? c00[k] + (c11[k] - c01[k]) * u + (c01[k] - c00[k]) * v : c00[k] + (c10[k] - c00[k]) * u + (c11[k] - c10[k]) * v);
  };
  /* v92: die Bodenkacheln selbst entstehen erst nach dem Waldboden (worldGround) – dessen Flecken gehen in die Eckfarben ein */
  /* Kulissenbäume: dichter Wald, lockere Bäume am See und im Osten. v56: jeder hat eine Art
     (Birke, Kiefer, Fichte, Buche, Eiche, Kirsche) und lässt sich antippen – dann wird er ein
     echter Baum (bgPromote). Die Bäume je Kachel liegen in WV.bgChunks.
     v90: Kulissenbäume stehen von Anfang an in ihrer endgültigen Form (dasselbe Modell wie nach dem
     Antippen) und werden als Instanzen gezeichnet – siehe bgFinal / bgChunkBuild. */
  const F32 = mb => new Float32Array(mb.v);
  const fern = F32(FWM.fern2 ? FWM.fern2() : FWM.fern()), mush = F32(FWM.mushrooms(true)), mush2 = F32(FWM.mushrooms(false)), dlog = F32(FWM.deadLog());
  /* v86: sieben Buscharten (bushes.js) – je Typ drei Formvarianten, von allen Büschen gemeinsam genutzt */
  WV.bushm = {}; WV.bushes = []; WV.bushInfo = null; WV.grass = []; WV.grassm = [];
  if (typeof BUSH !== "undefined") WV.grassm = [0, 1, 2].map(v => F32(FWM.grassTuft(v)));
  if (typeof BUSH !== "undefined") BUSH.TYPES.forEach(t => { WV.bushm[t.id] = [0, 1, 2].map(v => F32(FWM.bush(t.id, v))); });
  const logObs = [], rockObs = [];
  const rocks = [0.9, 1.4, 2.0].map(k => F32(FWM.boulder(k)));
  const cut = S.farm.bgCut || {}, step = 3.2;
  /* v89: Baumdichte-Feld (glatter Wertrauschen, feste Samen → reproduzierbar): 0 = Lücke/Lichtung, 1 = dichter Hain */
  const tH = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
  const tV = (x, z, k) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return tH(i, j, k) * (1 - u) * (1 - v) + tH(i + 1, j, k) * u * (1 - v) + tH(i, j + 1, k) * (1 - u) * v + tH(i + 1, j + 1, k) * u * v; };
  const treeDens = (x, z) => { const q = clamp(0.62 * tV(x / 30, z / 30, 11) + 0.38 * tV(x / 12, z / 12, 23), 0, 1), t = clamp((q - 0.2) / 0.65, 0, 1); return Math.pow(t * t * (3 - 2 * t), 0.7); };
  const pickSp = (zone, edge, r) => {
    if (edge) return r < 0.3 ? "buche" : r < 0.45 ? "eiche" : r < 0.62 ? "kiefer" : r < 0.88 ? "birke" : r < 0.96 ? "fichte" : "kirsche";
    if (zone === "birke") return r < 0.45 ? "birke" : r < 0.68 ? "kiefer" : r < 0.8 ? "fichte" : r < 0.95 ? "buche" : "kirsche";
    if (zone === "kiefer") return r < 0.55 ? "kiefer" : r < 0.78 ? "fichte" : r < 0.9 ? "birke" : "buche";
    if (zone === "alt") return r < 0.6 ? "eiche" : r < 0.85 ? "buche" : "fichte";
    return r < 0.3 ? "buche" : r < 0.45 ? "eiche" : r < 0.7 ? "fichte" : r < 0.85 ? "kiefer" : r < 0.97 ? "birke" : "kirsche";
  };
  for (let gx = WGRID.x0; gx < WGRID.x1; gx += step)
    for (let gz = WGRID.z0; gz < WGRID.z1; gz += step) {
      const x = gx + rnd() * step, z = gz + rnd() * step;       /* v89: volle Zellbreite Streuung (vorher 0,8) – weniger Rasterwirkung */
      const f = forestK(x, z), dm = treeDens(x, z);
      let p;
      if (f > 0.5) p = 0.30 + 0.85 * dm;                       /* v89: Dichte wechselt in Flecken – dichte Haine, lockere Stücke, natürliche Lücken (vorher überall 0,86) */
      else if (z > 22) p = z > 74 ? 0.55 : 0.1;
      else if (x > 46) p = 0.1;
      else p = f * 0.6 * (0.4 + 1.2 * dm);
      const r0 = rnd(), r1 = rnd(), r2 = rnd();
      if (r0 > p) {
        /* Waldboden: Farn, Pilze, Totholz – nur in Wegnähe, wo man hinsieht */
        if (f > 0.5 && r0 < 0.98 && (MK.at(x, z) & 2) && bgTreeOk(x, z, MK)) {
          const c = chunkOf(x, z).d, g = wayGap(x, z);     /* v77: Busch und Totholz liegen neben dem Weg, nicht darauf */
          if (r1 < 0.35) { if (g > 1.0 + 0.23 * (0.9 + r2 * 0.5)) chunkOf(x, z).v.add(fern, x, z, r2 * 6.28, 0.75 + r2 * 0.4); }     /* v92: Farn in die Wind-Kachel */
          else if (r1 < 0.4) { if (g > 1.2) c.add(r2 < 0.5 ? mush : mush2, x, z, r2 * 6.28, 1); }
          else if (r1 < 0.44) { if (g > 1.0 + 0.82) { c.add(dlog, x, z, r2 * 6.28, 1); logObs.push([x, z, 0.9]); } }
          /* v86: der einzelne alte Busch (r1 < 0,5) entfällt – Büsche kommen aus dem Buschsystem (worldBushes, Verhältnis 7 : 1) */
        }
        continue;
      }
      const k = Math.round((gx - WGRID.x0) / step) * 1000 + Math.round((gz - WGRID.z0) / step);
      if (cut[k] || !bgTreeOk(x, z, MK)) continue;
      const zone = forestZone(x, z), alt = zone === "alt", sp = pickSp(zone, f < 0.5, r1);
      const sc = alt ? 1.55 + r2 * 0.7 : f > 0.5 ? 1.05 + r2 * 0.6 : 0.9 + r2 * 0.4;
      /* v77: die Krone darf nicht über den Weg ragen (vorher nur 2,2 Abstand zur Wegmitte, egal wie groß der Baum) */
      if (!bgWayOk(x, z, sp, sc, MK)) continue;
      chunkOf(x, z).trees.push({ k, sp, v: Math.floor(r2 * 3), x, z, ry: r1 * 6.28, s: sc });
    }
  /* Felsen im Wald */
  for (let i = 0; i < 14; i++) {
    const a = rnd() * 6.28, d = rnd() * FWORLD.rocks[2] * 0.7;
    const x = FWORLD.rocks[0] + Math.cos(a) * d, z = FWORLD.rocks[1] + Math.sin(a) * d, ry = rnd() * 6.28, sc = 0.8 + rnd() * 0.5;
    chunkOf(x, z).d.add(rocks[i % 3], x, z, ry, sc);
    rockObs.push([x, z, 0.55 * [0.9, 1.4, 2.0][i % 3] * sc]);
  }
  /* v92: Kulissenbäume entzerren – je Art und Größe, mit fällbaren Bäumen und Felsen als festen Hindernissen */
  WV.rockObs = rockObs;
  WV.spaceInfo = worldTreeSpace(chunks, chunkOf, MK, rockObs);
  /* v91: versteckte Lichtungen und Senken planen – die Kulissenbäume dort werden entnommen, die Büsche setzen sich an den Rand */
  let fplan = null;
  WV.forest = null;
  if (typeof FOREST !== "undefined") {
    try {
      const ftr = []; for (const c of chunks.values()) c.trees.forEach(t => ftr.push(t));
      fplan = FOREST.plan({ seed: forestSeed(), area: { x0: WGRID.x0, z0: WGRID.z0, x1: WGRID.x1, z1: WGRID.z1 - 85 }, trees: ftr, inForest: (x, z) => forestK(x, z) > 0.2, forestK, wayGap,
        ok: (x, z, r) => wFreeGround(x, z, r, MK), wet: wWet, clearings: FWORLD.clearings.map(c => ({ x: c[0], z: c[1], r: c[2] })) });
      const gone = fplan.hidden.concat(fplan.hollow);
      for (const c of chunks.values()) if (c.trees.length) c.trees = c.trees.filter(t => !gone.some(h => Math.hypot(t.x - h.x, t.z - h.z) < h.r + 0.5));
    } catch (e) { console.warn("Waldplan:", e); fplan = null; }
  }
  /* v86–v89: Büsche (eignungsgesteuert, Menge ergibt sich aus der Waldsituation – keine feste Zahl pro Baum) und Grasbüschel */
  if (typeof BUSH !== "undefined") {
    const trees = [];
    for (const c of chunks.values()) c.trees.forEach(t => trees.push(t));
    (S.farm.trees || []).forEach(t => trees.push(t));
    const tB = performance.now();
    const res = worldBushes(trees, MK, logObs.concat(rockObs), rockObs, fplan ? fplan.hidden.concat(fplan.hollow) : null);
    /* v91: Waldboden, Ökologie, besondere Orte, Büsche mit Überraschungen (forest.js) */
    if (typeof FOREST !== "undefined" && fplan) {
      try { WV.forest = worldForest(chunks, res, fplan, MK, chunkOf, rockObs, gcAt); } catch (e) { console.warn("Waldboden:", e); WV.forest = null; }
    }
    res.ms = performance.now() - tB;
    WV.bushes = res.instances; WV.grass = res.grass.instances;
    WV.bushInfo = { trees: trees.length, ms: +res.ms.toFixed(0), placed: res.placed, byType: res.byType, groups: res.groups, singles: res.singles, kinds: res.kinds,
      clearings: res.clearings.length, clearingTypes: res.clearingTypes, grass: res.grass.instances.length, birchTufted: res.grass.birchTufted, birchTotal: res.grass.birchTotal };
    res.instances.forEach(b => (VEGQ.bushShadow ? chunkOf(b.position[0], b.position[2]).d : chunkOf(b.position[0], b.position[2]).g).add(WV.bushm[b.typeId][b.variantSeed % BUSH.VARIANTS], b.position[0], b.position[2], b.rotationY, b.scale[0], b.scale[1], b.tint));
    res.grass.instances.forEach(g => chunkOf(g.position[0], g.position[2]).v.add(WV.grassm[g.variantSeed % BUSH.GRASS.variants], g.position[0], g.position[2], g.rotationY, g.scale[0], g.scale[1], g.tint));
  }
  worldGround(chunkOf, GC, nx, nz, cell, gcAt, WV.forest);
  WV.bgChunks = new Map(); VEGQ.nodes = []; VEGQ.on = VEGQ.mode !== "static"; VEGQ.why = VEGQ.on ? "start" : "Modus statisch";
  R.instClear(); WV.bgInst = new Map(); WV.bgG = new Map(); WV.bgGH = new Map(); WV.bgHi = new Map(); TLOD.dirty = true;
  for (const [key, c] of chunks) {
    if (c.g.n) R.nodes.push(fnode(R.mesh(c.g.out()), { shadow: false }));
    if (c.d.n) R.nodes.push(fnode(R.mesh(c.d.out())));
    if (c.v.n) {
      /* v88: Gras je Chunk in einem eigenen Knoten – ohne Schattenwurf, Wind über den gemeinsamen Shader (sway = 0 im statischen Betrieb) */
      const [i, j] = key.split(",").map(Number);
      const vn = fnode(R.mesh(c.v.out()), { shadow: false, sway: 0, swayT: VEGQ.swayT, plant: 1 });
      R.nodes.push(vn);
      VEGQ.nodes.push({ node: vn, x: WGRID.x0 + (i + 0.5) * CH, z: WGRID.z0 + (j + 0.5) * CH });
    }
    if (c.trees.length) { const [i, j] = key.split(",").map(Number); WV.bgChunks.set(key, { trees: c.trees, all: c.trees.slice(), x0: WGRID.x0 + i * CH, z0: WGRID.z0 + j * CH }); }
  }
  { const tB = performance.now(); for (const c of WV.bgChunks.values()) bgChunkBuild(c);
    let n = 0; WV.bgG.forEach(g => { n += g.n; });
    WV.bgInfo = { trees: n, types: WV.bgG.size, ms: +(performance.now() - tB).toFixed(0) }; }
  /* Wege, Bach mit Brücke, Straße */
  const lines = new FM.MB();
  /* Waldwege: jeder auf eigener Höhe (Kreuzungen flimmern nicht), lose Enden laufen
     in eine kleine Lichtung mit Bank aus; der Weg zum Hof beginnt erst vor dem Tor */
  /* v56: an den Toren des Sägewerks endet der Weg gerade am Zaun (keine runde Kappe im Hof) */
  /* v75: Knoten je Wegende: Mündung (Straße), Abzweig (liegt auf einem Knick eines anderen Weges), Tor, Hof,
     Steg (Westweg) – sonst lose (Lichtung mit Bank). Weiche Ränder über die Bodenfarbe (wGroundAt). */
  const teeOf = (q, i) => FWORLD.paths.findIndex((o, j) => j !== i && o.slice(1, -1).some(r => Math.hypot(r[0] - q[0], r[1] - q[1]) < 0.05));
  const PIER = worldPierFrame();
  /* 1) Optionen und Stützpunkte je Weg: Abzweig-Stellen auf dem Hauptweg gerade ziehen, dann Kanten-Snap */
  const campEnd = q => typeof CAMP !== "undefined" && CAMP.near(q[0], q[1], 7);
  const WAYS = FWORLD.paths.map((p, i) => {
    const gate = q => inYard(q[0], q[1], 0.6), road = q => q[1] > 16;
    /* v72: kein „loses Ende“ mit Lichtung und Bank in der Nähe des Bachs (dort endet der Weg am Steg) */
    const loose = q => !FWORLD.paths.some((o, j) => j !== i && o.some(r => Math.hypot(r[0] - q[0], r[1] - q[1]) < 3)) && !inYard(q[0], q[1], 3) && !inHofMax(q[0], q[1], 2) && !road(q) && distLine(q[0], q[1], FWORLD.creek) > 7;
    const a = p[0], e = p[p.length - 1], hof = q => inHofMax(q[0], q[1], 1.5);
    const tee = [teeOf(a, i), teeOf(e, i)];
    /* Westweg: das Ende sitzt auf dem Steg-Auflager und läuft in der Achse des Stegs an */
    const pier = q => PIER && Math.hypot(q[0] - PIER.x, q[1] - PIER.z) < 1.5;
    const snap = [pier(a) ? { at: [PIER.x, PIER.z], dir: [-PIER.dx, -PIER.dz], L: 1.4 } : null, pier(e) ? { at: [PIER.x, PIER.z], dir: [PIER.dx, PIER.dz], L: 1.4 } : null];
    /* v70: alle Ränder liegen unter allen Wegflächen – Abzweige gehen ohne Kante ineinander über.
       v71: am Westtor keine runde Kappe (lag aufs Pflaster), kein Laub auf Hofpflaster und Straße */
    const cap = (q, k) => !gate(q) && !road(q) && !hof(q) && tee[k] < 0 && !snap[k];
    /* v77: am Tor läuft der Weg 1 Einheit in den Hof hinein und dort in den Schotter aus (fade) */
    const fade = [gate(a) ? { L: 2.6, col: FWM.YARD_COL } : campEnd(a) ? { L: 7, col: CAMP.GRAVEL } : null, gate(e) ? { L: 2.6, col: FWM.YARD_COL } : campEnd(e) ? { L: 7, col: CAMP.GRAVEL } : null];   /* v83: der Weg läuft in den Kies des Lagerfeuerplatzes aus */
    const o = { y: 0.026 + i * 0.003, ey: 0.016 + i * 0.0012, ends: [loose(a) && tee[0] < 0 && !campEnd(a), loose(e) && tee[1] < 0 && !campEnd(e)], caps: [cap(a, 0), cap(e, 1)], mouth: [road(a), road(e)],
      snap, fade, gnd: wGroundAt, roadCol: 0x7c7f86, leafOk: (x, z) => !inHofMax(x, z, 0.7) && Math.abs(z - 18.5) > 1.25 && !inYard(x, z, 1.2) };
    return { p, o, tee };
  });
  WAYS.forEach((W, i) => {
    let q = W.p;
    WAYS.forEach((V, j) => V.tee.forEach((t, k) => { if (t === i) q = FWM.wayStraightAt(q, k ? V.p[V.p.length - 1] : V.p[0], 1.4); }));
    W.raw = FWM.wayRaw(q, W.o);
    /* v77: Torenden ein Stück in den Hof verlängern (der Übergang liegt dann im Tor, nicht davor) */
    W.o.fade.forEach((F, k) => {
      if (!F) return;
      const R = W.raw, e = k ? R[R.length - 1] : R[0], p = k ? R[R.length - 2] : R[1], l = Math.hypot(e[0] - p[0], e[1] - p[1]) || 1, x = [e[0] + (e[0] - p[0]) / l, e[1] + (e[1] - p[1]) / l];
      W.raw = k ? R.concat([x]) : [x].concat(R);
    });
  });
  /* 2) zeichnen – Abzweige kennen die fertige Linie ihres Hauptweges */
  WAYS.forEach(W => {
    const tee = W.tee.map(j => j < 0 ? null : { pts: WAYS[j].raw, w: 1.8, ey: WAYS[j].o.ey });
    lines.merge(FWM.forestPath(W.raw, 1.8, Object.assign({}, W.o, { tee, prepared: true })), {});
  });
  /* Der Glindower See – Uferlinie vorab (v176: der Seebach schließt daran an); Ufer, Wasser, Schilf usw. weiter unten */
  const Lk = FWORLD.lake;
  /* v174/v175: Abstand zu Gebäuden und Wegen am See. Für jedes Hindernis, das zu nah am Wasser liegt, weicht die Uferlinie dort
     weich zurück (Einbuchtung), und der Strand bleibt schmal. Gebäude (nicht Steg/Bootshaus): 3,2 Einheiten frei; Wege (Mittellinie,
     Breite 1,8): 3,0. Nur Optik – Angeln, Boote, inLake/lakeE bleiben unverändert. */
  const lkWob = a => 1 + 0.05 * Math.sin(3 * a + 0.7) + 0.03 * Math.sin(5 * a + 1.9);
  const lkAng = (x, z) => Math.atan2((z - Lk.z) / Lk.rz, (x - Lk.x) / Lk.rx);
  const lkRad = a => Math.hypot(Lk.rx * Math.cos(a), Lk.rz * Math.sin(a)) * lkWob(a);
  const lkGap = (x, z) => { const a = lkAng(x, z); return (lakeE(x, z) / lkWob(a) - 1) * lkRad(a); };
  const lkObs = [];
  if (typeof FFISHERY !== "undefined") Object.keys(FFISHERY).filter(k => k !== "f_steg" && k !== "f_boot").forEach(k => {
    const B = FFISHERY[k], hw = B.sz[0] / 2, hd = B.sz[1] / 2;
    let mn = 1e9, at = null;
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) { const x = B.x - hw + hw * i / 4, z = B.z - hd + hd * j / 4, g = lkGap(x, z); if (g < mn) { mn = g; at = [x, z]; } }
    if (mn < 3.2) { const a = lkAng(at[0], at[1]); lkObs.push({ a, f: (3.2 - mn) / lkRad(a), wd: (hw + 3) / lkRad(a) * 1.6, w: 0.7 }); }
  });
  (typeof LAKE_EAST !== "undefined" ? [LAKE_WAY, LAKE_EAST, LAKE_STEM] : []).forEach(line => {
    for (let k = 1; k < line.length; k++) {
      const p = line[k - 1], q = line[k], n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.8));
      for (let t = 0; t <= n; t++) {
        const x = p[0] + (q[0] - p[0]) * t / n, z = p[1] + (q[1] - p[1]) * t / n, g = lkGap(x, z);
        if (g > -1 && g < 3.0) { const a = lkAng(x, z); lkObs.push({ a, f: (3.0 - g) / lkRad(a), wd: 2.6 / lkRad(a), w: 1.2 }); }
      }
    }
  });
  if (FWM.setLakeDents) FWM.setLakeDents(lkObs.map(o => [o.a, o.f, o.wd]));
  const lkW = a => { let w = 2.2; lkObs.forEach(o => { const d = Math.abs(Math.atan2(Math.sin(a - o.a), Math.cos(a - o.a))); if (d < o.wd) w = Math.min(w, o.w + (2.2 - o.w) * clamp(d / o.wd, 0, 1) * 0.5); }); return w; };
  /* v176: Uferfarbe des Sees an einem Weltpunkt (genau wie lakeShore: Wiese → Sand → nasser Sand → Schlamm, mit Einbuchtungen) –
     der Seebach läuft an der Mündung damit nahtlos in den Seestrand über */
  const lkDent = a => { let s = 0; lkObs.forEach(o => { const d = Math.abs(Math.atan2(Math.sin(a - o.a), Math.cos(a - o.a))); if (d < o.wd) { const k = 1 - d / o.wd; s = Math.max(s, o.f * k * k * (3 - 2 * k)); } }); return s; };
  const lkShoreD = (x, z) => {   /* Abstand von der Seeuferlinie im Maß von lakeShore (außen +) */
    const a = lkAng(x, z), w = lkWob(a) * (1 - lkDent(a)), c = Math.cos(a), s = Math.sin(a);
    return ((x - Lk.x) / w) * c + ((z - Lk.z) / w) * s - (Lk.rx * c * c + Lk.rz * s * s);
  };
  const lkShoreCol = (x, z) => {
    const d = lkShoreD(x, z), W = lkW(lkAng(x, z));
    if (d >= W) return wGroundAt(x, z);
    if (d >= 0.4 * W) return wMix(0xc9b98c, wGroundAt(x, z), (d - 0.4 * W) / (0.6 * W));
    if (d >= 0.15) return wMix(0xa89878, 0xc9b98c, (d - 0.15) / Math.max(0.01, 0.4 * W - 0.15));
    return wMix(0x75704f, 0xa89878, (d + 1.4) / 1.55);
  };
  /* v177: Seebach beginnt 4 Einheiten im See; LK_MP = Punkt, an dem seine Mitte die Seeuferlinie erreicht */
  const LCR = [[41.4, 56.85]].concat(LAKE_CREEK);
  let LK_MP = LCR[0];
  for (let k = 1, done = false; k < LCR.length && !done; k++) {
    const p = LCR[k - 1], q = LCR[k], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    for (let t = 0; t <= l; t += 0.05) { const x = p[0] + (q[0] - p[0]) * t / l, z = p[1] + (q[1] - p[1]) * t / l; if (lkShoreD(x, z) >= 0) { LK_MP = [x, z]; done = true; break; } }
  }
  const LK_MOUTH = lkAng(LK_MP[0], LK_MP[1]);
  if (R.env) R.env.mouth = [LK_MP[0], LK_MP[1], 14];   /* Wasser-Shader: Fluss → See überblenden (water: 5) */
  /* v75: Bach – im Osten aus einer Quelle (verjüngt sich auf den letzten 9 Einheiten), im Westen bis an den
     Kartenrand; der Seebach fließt in den See und im Osten bis über den Kartenrand. Ufer laufen weich ins Gras.
     v176: Ufer wie am See (Wiese → Sand → nasser Sand → Schlamm), Wasser in den Farben des Seeufers.
     v177/v178: An der Mündung laufen die Uferlinien des Bachs in einer weichen Kurve in die Seeuferlinie ein, sein Ufer geht in den
     Seestrand über (lkShoreCol), und die Fließbewegung geht im Shader stufenlos in die Seebewegung über (water: 5). */
  const CR = { gnd: wGroundAt, taper: [9, 0], min: 0.45 }, CL = { gnd: lkShoreCol, mouth: { R: 5, shoreD: lkShoreD, shoreW: (x, z) => lkW(lkAng(x, z)) } };
  lines.merge(FWM.creekBank(FWORLD.creek, CR), {});
  lines.merge(FWM.creekBank(LCR, CL), {});
  const SP = FWORLD.spring;
  if (SP) lines.merge(FWM.springBed(SP[0], SP[1], wGroundAt), {});
  R.nodes.push(fnode(R.mesh(lines), { shadow: false }));
  /* v125: nur der nördliche Fluss fließt von Osten nach Westen (water: 2) – v176: im ruhigen Muster des großen Sees */
  const cr = new FM.MB(); cr.merge(FWM.creekWater(FWORLD.creek, CR), {});
  R.nodes.push(fnode(R.mesh(cr), { water: 2, shadow: false }));
  /* v177: der Seebach fließt (water: 5, Richtung Westen in den See) und geht an der Mündung in die Seebewegung über; Quelltopf wie der See */
  const sb = new FM.MB(); sb.merge(FWM.creekWater(LCR, CL), {});
  R.nodes.push(fnode(R.mesh(sb), { water: 5, shadow: false }));
  if (SP) { const cw = new FM.MB(); cw.merge(FWM.springPool(SP[0], SP[1]), {}); R.nodes.push(fnode(R.mesh(cw), { water: 4, shadow: false })); }
  if (SP) { const q = FWORLD.creek[1]; R.nodes.push(fnode(fmesh("wspring", FWM.springRocks), { x: SP[0], z: SP[1], ry: Math.atan2(-(q[1] - SP[1]), q[0] - SP[0]) })); }
  worldWaterCheck();
  /* v72: die neue, längere Brücke liegt in der Wegachse (der Hauptweg läuft hier gerade von Süd nach Nord) */
  R.nodes.push(fnode(fmesh("wbridge2", FWM.bridge), { x: FWORLD.bridge[0], y: 0, z: FWORLD.bridge[1], ry: Math.PI / 2 }));
  /* Brücke am Seebach – v75: der Ostuferweg läuft in ihrer Achse darüber (vorher führte kein Weg hin) */
  R.nodes.push(fnode(fmesh("wbridge2", FWM.bridge), { x: 52.6, y: 0, z: 60.3, ry: Math.PI / 2 - Math.atan2(3, 9.5) }));
  /* v75: Angelsteg am Ende des Westwegs – senkrecht zum Bach, beginnt am Wegende und endet mitten im Wasser */
  if (PIER) R.nodes.push(fnode(fmesh("wpier", FWM.pier), { x: PIER.x, y: 0, z: PIER.z, ry: PIER.ry }));
  R.nodes.push(fnode(fmesh("wbench", FM.bench), { x: -83.2, y: 0, z: -55.4, ry: Math.PI }));
  /* v81: Lagerfeuerplatz am Ende des Hauptwegs (camp.js) */
  if (typeof CAMP !== "undefined") CAMP.attach(R);
  /* v107: Hochsitz an der Wildwiese (hunt.js) */
  if (typeof HUNT !== "undefined") HUNT.attach(R);
  const st = new FM.MB();
  st.merge(FM.road(WGRID.x1 - WGRID.x0), { x: (WGRID.x0 + WGRID.x1) / 2, z: 18.5, ry: Math.PI / 2 });
  /* Wege am See (v75: Knoten und Kanten, siehe LAKE_STEM / LAKE_WAY / LAKE_EAST) */
  const LO = { gnd: wGroundAt, roadCol: 0x7c7f86, mouthR: 0.75, teeR: 0.6, leafOk: (x, z) => z > 19.8 };
  const oW = Object.assign({ y: 0.027, ey: 0.0185, caps: [false, false], mouth: [true, false] }, LO);
  const oS = Object.assign({ y: 0.0295, ey: 0.0192, caps: [false, false], mouth: [true, false] }, LO);
  const oE = Object.assign({ y: 0.0315, ey: 0.0198, caps: [false, true], ends: [false, true], mouth: [true, false] }, LO);
  const rW = FWM.wayRaw(FWM.wayStraightAt(LAKE_WAY, LAKE_STEM[LAKE_STEM.length - 1], 1.4), oW);
  const rE = FWM.wayRaw(FWM.wayStraightAt(LAKE_EAST, LAKE_WAY[LAKE_WAY.length - 1], 1.4), oE);
  st.merge(FWM.forestPath(rW, 1.6, Object.assign({}, oW, { prepared: true, tee: [null, { pts: rE, w: 1.6, ey: oE.ey }] })), {});
  st.merge(FWM.forestPath(FWM.wayRaw(LAKE_STEM, oS), 1.6, Object.assign({}, oS, { prepared: true, tee: [null, { pts: rW, w: 1.6, ey: oW.ey }] })), {});
  st.merge(FWM.forestPath(rE, 1.6, Object.assign({}, oE, { prepared: true })), {});
  /* Nachbarfelder */
  const nf = (x, z, w, d, c1, c2) => {
    const m = new FM.MB();
    m.plate(w, d, c1, { y0: 0.015 });
    for (let i = 0; i < Math.floor(d / 0.6); i++) m.plate(w - 0.2, 0.22, c2, { z: -d / 2 + 0.4 + i * 0.6, y0: 0.03 });
    st.merge(m, { x, z });
  };
  FWORLD.fields.forEach(([x, z, w, d], i) => nf(x, z, w, d, i ? 0xb9d466 : 0xe3c35a, i ? 0x9fc055 : 0xd0ac43));
  /* Sägewerkshof: Schotter, Holzstapel, Zaun */
  /* Sägewerkshof: Schotter und Zaun mit Toren im Süden, Norden und Westen (die Holzstapel: worldSyncPiles) */
  const Y = FWORLD.yard, gx = (Y[0] + Y[2]) / 2, gz = (Y[1] + Y[3]) / 2;
  st.merge(FWM.yard(Y[2] - Y[0], Y[3] - Y[1]), { x: (Y[0] + Y[2]) / 2, z: (Y[1] + Y[3]) / 2 });
  const yf = new FM.MB(), fo = { step: 1.2, h: 0.7, post: 0x6e4a2e, rail: 0x9a6a3e };
  FM.fenceLine(yf, Y[0], Y[1], gx - 2, Y[1], fo); FM.fenceLine(yf, gx + 2, Y[1], Y[2], Y[1], fo);
  FM.fenceLine(yf, Y[0], Y[1], Y[0], gz - 2, fo); FM.fenceLine(yf, Y[0], gz + 2, Y[0], Y[3], fo);
  FM.fenceLine(yf, Y[2], Y[1], Y[2], Y[3], fo);
  FM.fenceLine(yf, Y[0], Y[3], gx - 2, Y[3], fo); FM.fenceLine(yf, gx + 2, Y[3], Y[2], Y[3], fo);
  st.add(yf);
  /* Teich im Osten */
  st.merge(FM.pondBank(POND.r), { x: POND.x, z: POND.z });
  R.nodes.push(fnode(R.mesh(st), { shadow: false }));
  R.nodes.push(fnode(fmesh("pond", () => FM.pondWater(POND.r)), { x: POND.x, y: 0.03, z: POND.z, water: 4, shadow: false }));
  FV.foam = fnode(fmesh("pondFoam", () => FM.pondFoam(POND.r)), { x: POND.x, y: 0.042, z: POND.z, alpha: 0.4, shadow: false });
  R.nodes.push(FV.foam);
  R.nodes.push(fnode(fmesh("pondReeds", () => FM.pondReeds(POND.r)), { x: POND.x, z: POND.z, sway: 0.9 }));
  R.nodes.push(fnode(fmesh("pondProps", () => FM.pondProps(POND.r)), { x: POND.x, z: POND.z }));
  FV.ducks = [0, 1, 2].map(i => {
    const n = fnode(fmesh("duck:" + (i === 2 ? 1 : 0), () => FM.duck(i === 2 ? 1 : 0)), { y: 0.03, s: 1.4 });
    R.nodes.push(n);
    return { n, a: i * 2.1, r: [2.6, 1.6, 2.1][i], sp: [0.11, -0.16, 0.13][i], off: i * 0.25 };
  });
  /* v145: gestaltet wie der Teich – Sandufer mit Steinen, Wasser von dunkel (Mitte) zu türkis (Rand), heller Saum, Schilf rund ums Ufer.
     Flache, helle Stellen unter Schilf, Steinkante und Insel (Seekoordinaten), damit nichts mitten im tiefen Wasser steht. */
  const lkSh = [[-29, 4, 3.6], [-34, -4, 3], [-26, 14, 3], [22, -12, 3], [30, 4, 3], [-31, -14, 3], [-12, 10, 4.6], [20, -7.5, 4.2]];
  const lkSkip = ["f_steg", "f_boot"].filter(k => typeof FFISHERY !== "undefined" && FFISHERY[k]).map(k => Math.atan2((FFISHERY[k].z - Lk.z) / Lk.rz, (FFISHERY[k].x - Lk.x) / Lk.rx)).concat([LK_MOUTH]);
  R.nodes.push(fnode(fmesh("lakeShore177", () => FWM.lakeShore(Lk.rx, Lk.rz, (x, z) => wGroundAt(Lk.x + x, Lk.z + z), lkW, [LK_MOUTH])), { x: Lk.x, z: Lk.z, shadow: false }));
  R.nodes.push(fnode(fmesh("lakeWater177", () => FWM.lakeWater(Lk.rx, Lk.rz, lkSh)), { x: Lk.x, y: 0.035, z: Lk.z, water: 4, shadow: false }));
  R.nodes.push(fnode(fmesh("lakeFoam177", () => FWM.lakeFoam(Lk.rx, Lk.rz, [LK_MOUTH])), { x: Lk.x, y: 0.047, z: Lk.z, alpha: 0.4, shadow: false }));
  R.nodes.push(fnode(fmesh("lakeReeds177", () => FWM.lakeReeds(Lk.rx, Lk.rz, lkSkip)), { x: Lk.x, z: Lk.z, sway: 0.9 }));
  const lk = new FM.MB();
  [[-15, 52, 26], [-20, 44, 18], [-12, 62, 16], [36, 36, 14], [44, 52, 12], [-17, 34, 10]].forEach(([x, z, n], i) => lk.merge(FWM.reedPatch(n), { x, z, ry: i }));
  [[-9, 40, 14], [-4, 43, 8], [28, 64, 9]].forEach(([x, z, n]) => lk.merge(FWM.lilyPads(n), { x, z, y: 0.03 }));
  /* Insel mit zwei Bäumen */
  lk.merge((() => { const m = new FM.MB(); m.disc(3.2, 14, 0xd9c48a, { y0: 0.05, wob: 0.12 }); m.disc(2.5, 12, 0x86bf4a, { y0: 0.07, wob: 0.12 }); return m; })(), { x: 2, z: 58 });
  /* v152: dieselben Baummodelle wie im Wald (vorher eigene, alte Kulissenbäume) */
  lk.merge(FWM.tree("buche", 1, 1), { x: 2.6, z: 57.6, s: 1.25 }); lk.merge(FWM.tree("fichte", 1, 2), { x: 1, z: 58.8, s: 0.78 });
  for (let i = 0; i < 7; i++) lk.merge(FWM.boulder(0.5 + rnd() * 0.7), { x: 34 + rnd() * 5 - 2.5, z: 39 + rnd() * 3, ry: rnd() * 6 });
  R.nodes.push(fnode(R.mesh(lk), { sway: 0.4 }));
  /* fällbare Bäume, Hof je Ausbaustufe, Schranken an gesperrten Wegen */
  worldSyncHof(true);
  worldSyncTrees(true);
  worldSyncBarriers();
  worldLocks();
  worldMakeWild();
  worldMakeLife();
}

/* --------------------------- Hof je Ausbaustufe ------------------------- */
function worldHofKey() { const F = S.farm; return (F.stage || 1) + ":" + farmHl() + ":" + ((F.cos && F.cos.on && F.cos.on.tractor) || ""); }
function worldSyncHof(force) {
  const R = FV.R, key = worldHofKey();
  if (!force && key === WV.hofKey) return;
  WV.hofKey = key;
  WV.hof.forEach(n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
  WV.hof = [];
  /* der Zaun wächst mit jeder Ausbaustufe nach Westen, Norden und Osten (v56: FHOF_B); der Südzaun bleibt */
  const stage = S.farm.stage || 1, big = stage >= 4, B = farmHofB(), F0 = B.z1, GX = FGATE.x, WZ = FGATE.wz;
  const add = n => { R.nodes.push(n); WV.hof.push(n); return n; };
  add(fnode(fmesh("hofGround:" + Math.min(stage, 2) + ":" + stage + ":" + farmHl(), () => FWM.hofGround(HOFG, B, Math.min(stage, 2), wGroundAt)), { shadow: false }));
  const b = new FM.MB(), ps = Math.min(3, stage);
  /* Hauptweg vom Querweg zum Südtor, Querweg zum Westtor (endet am Hauptweg – sonst flimmert die Kreuzung) */
  b.merge(FWM.hofPath(2, F0 - WZ + 0.5, ps), { x: GX, z: (F0 + WZ - 0.5) / 2 });
  const we = big ? 0.48 : 0;                         /* v71: Pflaster bis zur Außenkante der Steinmauer */
  b.merge(FWM.hofPath(GX - 1 - B.x0 + we, 1, ps), { x: (GX - 1 + B.x0 - we) / 2, z: WZ });
  /* v75: die Zufahrt endet am Bordstein (vorher 0,2 auf dem Asphalt) und weitet sich mit zwei Ausrundungen */
  b.merge(FWM.hofPath(2, 17.48 - F0, ps), { x: GX, z: (F0 + 17.48) / 2 });
  const dc = ps <= 1 ? 0xb59b6e : ps === 2 ? FM.C.gravel : 0xb8b0a2;
  [-1, 1].forEach(sd => FWM.fillet(b, [GX + sd, 17.48], [0, -1], [sd, 0], 0.7, { y: 0.027, yE: 0.02, col: dc }));
  /* vor dem Westtor bis zum Waldweg (der beginnt am Tor des größten Hofs) – v71: als Feldweg, gerade
     am Tor abgeschnitten und unter dem Anfang des Waldwegs (gleiche Farbe, kein Laub aufs Pflaster) */
  b.merge(FWM.forestPath([[B.x0 - we, WZ], [-24.9, WZ]], 1.8, { y: 0.0275, ey: 0.0155, caps: [false, false], leaves: false, gnd: wGroundAt }), {});
  const wg = [WZ - 1.1, WZ + 1.1];
  if (big) {
    /* Steinmauer ringsum mit Toren im Süden und Westen – knapp außerhalb des Baulands */
    const x0 = B.x0 - 0.3, z0 = B.z0 - 0.3, x1 = B.x1 + 0.3, z1 = B.z1 + 0.3;
    const wall = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az);
      b.merge(FWM.stoneWall(len), { x: (ax + bx) / 2, z: (az + bz) / 2, ry: -Math.atan2(bz - az, bx - ax) });
    };
    wall(x0, z0, x1, z0); wall(x1, z0, x1, z1);
    wall(x0, z1, GX - 2.4, z1); wall(GX + 2.4, z1, x1, z1);
    wall(x0, z0, x0, wg[0]); wall(x0, wg[1], x0, z1);
    b.merge(FWM.stoneGate(), { x: GX, z: z1 });
  } else {
    const k = stage;
    FWM.hofFence(b, B.x0, B.z0, B.x1, B.z0, k, 1);
    FWM.hofFence(b, B.x1, B.z0, B.x1, B.z1, k, 2);
    FWM.hofFence(b, B.x0, B.z1, GX - 2, B.z1, k, 3);
    FWM.hofFence(b, GX + 2, B.z1, B.x1, B.z1, k, 4);
    FWM.hofFence(b, B.x0, B.z0, B.x0, wg[0], k, 5);
    FWM.hofFence(b, B.x0, wg[1], B.x0, B.z1, k, 6);
    b.merge(FM.gate(), { x: GX, z: F0, ry: stage <= 1 ? 0.06 : 0 });
  }
  /* Westtor zum Wald */
  [wg[0] - 0.1, wg[1] + 0.1].forEach(z => b.box(0.18, 1.2, 0.18, stage >= 4 ? 0xa8a094 : FM.C.woodD, { x: B.x0 - (big ? 0.3 : 0), z }));
  if (stage >= 3) {
    /* v70: an der Steinmauer stehen die Laternen weiter draußen – nicht mehr im Torpfeiler oder in der Mauer */
    const m = big ? 0.8 : 0.6, L = FM.lamp(), fl = FM.flowers(), xa = B.x0 - m, xb = B.x1 + m, za = B.z0 - m, zb = F0 + m;
    const gl = big ? [[GX - 2.95, F0 + 1.05], [GX + 2.95, F0 + 1.05]] : [[GX - 2.5, zb], [GX + 2.5, zb]];
    gl.concat([[xa, WZ - 1.8], [xa, WZ + 1.8], [xb, zb], [xa, zb], [xb, za], [xa, za], [-8, 17.2], [18, 17.2]])
      .forEach(([x, z]) => b.merge(L, { x, z }));
    [-10, -6, -2, 10, 12].forEach(x => b.merge(fl, { x, z: F0 + 0.9 }));
  }
  /* v56: Vermessungspflöcke zeigen, bis wohin der Hof mit dem nächsten Ausbau wächst */
  if (farmHl() < FHOF_HL) {
    const N = farmHofB(farmHl() + 1), stake = (x, z) => { b.box(0.08, 0.46, 0.08, 0xb08a5a, { x, z }); b.box(0.1, 0.1, 0.1, 0xd8332b, { x, y: 0.4, z }); };
    for (let x = N.x0; x <= N.x1 + 0.01; x += (N.x1 - N.x0) / Math.round((N.x1 - N.x0) / 4)) stake(x, N.z0);
    for (let z = N.z0 + 4; z < N.z1 - 1; z += 4) if (Math.abs(z - WZ) > 1.6) { stake(N.x0, z); stake(N.x1, z); }
  }
  add(fnode(R.mesh(b)));
  /* v162: Traktor mit Anhänger ist jetzt ein frei platzierbares Objekt (Hof, rund um den Hof oder im Lager); die Maschinenhalle ist entfernt */
  /* Firmenschild am Tor: Name und Logo stehen auf der Tafel (vorn und hinten) */
  const T = brandTex();
  if (T) {
    const g = big ? { y: 2.7, z: F0 + 0.3 + 0.362, w: 2.52, h: 0.46, ry: 0 } : { y: 1.67, z: F0 + 0.045, w: 2.36, h: 0.47, ry: stage <= 1 ? 0.06 : 0 };
    const sg = add(R.node(null, { x: GX, y: 0, z: F0 + (big ? 0.3 : 0), ry: g.ry }));
    R.addChild(sg, R.node(null, { y: g.y, z: g.z - F0 - (big ? 0.3 : 0), decal: { t: big ? T.stone : T.sign, w: g.w, h: g.h } }));
    if (!big) R.addChild(sg, R.node(null, { y: g.y, z: -0.045, ry: Math.PI, decal: { t: T.sign, w: g.w, h: g.h } }));
  }
}

/* --------------------------- Firmenauftritt (v54) ---------------------------
   Logo und Firmenname aus „Lackierung & Logo“ als Bild: auf dem Schild am
   Tor, auf allen Firmenfahrzeugen und als kleiner Aufkleber auf den Paketen.
   Ändert man das Logo, ziehen Schild, Fahrzeuge und Pakete sofort nach. */
function brandLogo() {
  if (typeof livery === "function" && S.player) return livery().logo;
  return { shape: "kreis", mode: "txt", txt: "LG", bg: "#2f6fed", fg: "#ffffff" };
}
function brandName() { return S.player ? S.player.company : FT().short; }
/* Logo wie logoSVG (livery.js), aber direkt auf ein Canvas gemalt */
function brandDrawLogo(c, L, x, y, size) {
  c.save();
  c.translate(x, y); c.scale(size / 100, size / 100);
  const paths = { schild: "M50 6 L90 18 Q90 64 50 94 Q10 64 10 18 Z", raute: "M50 4 L96 50 L50 96 L4 50 Z", sechs: "M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z" };
  let P;
  if (paths[L.shape]) P = new Path2D(paths[L.shape]);
  else if (L.shape === "banner") { P = new Path2D(); const r = 14, x0 = 4, y0 = 22, w = 92, h = 56; P.moveTo(x0 + r, y0); P.arcTo(x0 + w, y0, x0 + w, y0 + h, r); P.arcTo(x0 + w, y0 + h, x0, y0 + h, r); P.arcTo(x0, y0 + h, x0, y0, r); P.arcTo(x0, y0, x0 + w, y0, r); P.closePath(); }
  else { P = new Path2D(); P.arc(50, 50, 44, 0, Math.PI * 2); }
  c.fillStyle = L.bg || "#2f6fed"; c.fill(P);
  c.lineJoin = "round"; c.lineWidth = 5; c.strokeStyle = "#0d1b2a"; c.stroke(P);
  c.save(); c.translate(50, 50); c.scale(0.82, 0.82); c.translate(-50, -50);
  c.globalAlpha = 0.55; c.lineWidth = 2.2 / 0.82; c.strokeStyle = L.fg || "#fff"; c.stroke(P); c.restore();
  c.textAlign = "center"; c.textBaseline = "middle";
  if (L.mode === "sym") {
    c.font = (L.shape === "banner" ? 40 : 46) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    c.fillText(L.sym || "⭐", 50, 54);
  } else {
    const t = String(L.txt || "").slice(0, 3);
    c.font = (t.length > 2 ? 34 : 44) + 'px Bangers,"Baloo 2",sans-serif';
    const yy = L.shape === "schild" ? 56 : 54;
    c.lineWidth = 4.8; c.strokeStyle = "#0d1b2a"; c.strokeText(t, 50, yy);
    c.fillStyle = L.fg || "#fff"; c.fillText(t, 50, yy);
  }
  c.restore();
}
function brandLogoCanvas(cv) {
  cv = cv || document.createElement("canvas");
  cv.width = cv.height = 256;
  const c = cv.getContext("2d");
  c.clearRect(0, 0, 256, 256);
  brandDrawLogo(c, brandLogo(), 8, 8, 240);
  return cv;
}
/* Tafel am Tor: Holz (bis Stufe 3) oder weiße Steintafel (Stufe 4) – Logo links, Name groß */
function brandSignCanvas(stone, cv) {
  cv = cv || document.createElement("canvas");
  const W = 1024, H = 200;
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  if (stone) {
    c.fillStyle = "#f6f1e6"; c.fillRect(0, 0, W, H);
    c.strokeStyle = "#c9c0ae"; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10);
  } else {
    c.fillStyle = "#b57d48"; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? "rgba(90,50,20,.10)" : "rgba(255,230,190,.07)"; c.fillRect(0, i * H / 4, W, H / 4); c.fillStyle = "rgba(70,40,15,.35)"; c.fillRect(0, i * H / 4, W, 3); }
    c.strokeStyle = "#6e4a2e"; c.lineWidth = 12; c.strokeRect(6, 6, W - 12, H - 12);
  }
  brandDrawLogo(c, brandLogo(), 22, 14, 172);
  const name = brandName(), x0 = 210, max = W - x0 - 30;
  let fs = 132;
  c.font = fs + 'px Bangers,"Baloo 2",sans-serif';
  while (c.measureText(name).width > max && fs > 46) { fs -= 4; c.font = fs + 'px Bangers,"Baloo 2",sans-serif'; }
  c.textAlign = "center"; c.textBaseline = "middle";
  const cx = x0 + max / 2, cy = H / 2 + fs * 0.04;
  c.lineJoin = "round";
  if (stone) { c.fillStyle = "#2a2f38"; c.fillText(name, cx, cy); }
  else { c.lineWidth = 12; c.strokeStyle = "#3a2410"; c.strokeText(name, cx, cy); c.fillStyle = "#fff3d6"; c.fillText(name, cx, cy); }
  return cv;
}
/* Bilder einmal je Renderer; brandSync malt sie neu, sobald sich Logo, Name oder Schrift ändern */
function brandTex() {
  if (typeof FV === "undefined" || !FV.R || !FV.R.texture || typeof document === "undefined") return null;
  if (!WV.brand || WV.brand.R !== FV.R) {
    WV.brand = { R: FV.R, key: "", logo: FV.R.texture(brandLogoCanvas()), sign: FV.R.texture(brandSignCanvas(false)), stone: FV.R.texture(brandSignCanvas(true)) };
    WV.brand.key = brandKey();
    if (document.fonts && document.fonts.load) document.fonts.load('80px Bangers').then(() => { WV.brandFont = 1; }).catch(() => {});
  }
  return WV.brand;
}
function brandKey() { return JSON.stringify(brandLogo()) + "|" + brandName() + "|" + (WV.brandFont || 0); }
function brandSync() {
  const T = WV.brand;
  if (!T || !FV.R || T.R !== FV.R) return;
  const k = brandKey();
  if (k === T.key) return;
  T.key = k;
  brandLogoCanvas(T.logo.canvas); FV.R.texUpdate(T.logo);
  brandSignCanvas(false, T.sign.canvas); FV.R.texUpdate(T.sign);
  brandSignCanvas(true, T.stone.canvas); FV.R.texUpdate(T.stone);
  if (typeof farmSyncVehicles === "function") farmSyncVehicles(true);
}
/* Logo-Aufkleber an ein Fahrzeug: Seiten (und hinten), je Modell passend */
const BRAND_AT = {
  van:   [[0.512, 0.6, -0.3, Math.PI / 2, 0.5], [-0.512, 0.6, -0.3, -Math.PI / 2, 0.5], [0, 0.6, -1.012, Math.PI, 0.42]],
  moped: [[0.183, 0.77, -0.44, Math.PI / 2, 0.24], [-0.183, 0.77, -0.44, -Math.PI / 2, 0.24], [0, 0.77, -0.612, Math.PI, 0.24]],
  bike:  [[0, 0.47, 0.672, 0, 0.26], [0.242, 0.47, 0.42, Math.PI / 2, 0.24], [-0.242, 0.47, 0.42, -Math.PI / 2, 0.24]],
  truck: [[0.857, 1.42, 1.4, Math.PI / 2, 0.62], [-0.857, 1.42, 1.4, -Math.PI / 2, 0.62]]
};
function brandVehicle(node, k) {
  const T = brandTex();
  if (!T || !node || node.brand) return;
  node.brand = (BRAND_AT[k] || []).map(([x, y, z, ry, s]) => FV.R.addChild(node, FV.R.node(null, { x, y, z, ry, decal: { t: T.logo, w: s, h: s } })));
}
/* kleiner Aufkleber auf Paketen und Kartons (oben und vorn) */
function brandParcel(node, top, front, s) {
  const T = brandTex();
  if (!T || !node) return;
  FV.R.addChild(node, FV.R.node(null, { y: top + 0.003, rx: -Math.PI / 2, decal: { t: T.logo, w: s, h: s } }));
  if (front) FV.R.addChild(node, FV.R.node(null, { y: top * 0.5, z: front + 0.003, decal: { t: T.logo, w: s * 0.8, h: s * 0.8 } }));
}
/* v70: Paletten auf dem Holzlaster tragen das Hoflogo – sides: 1 rechts, -1 links, 0 hinten */
function brandPallet(node, sides) {
  const T = brandTex();
  if (!T || !node) return;
  (sides || [1, -1, 0]).forEach(k => FV.R.addChild(node, FV.R.node(null, k === 0
    ? { y: 0.33, z: -0.378, ry: Math.PI, decal: { t: T.logo, w: 0.3, h: 0.3 } }
    : { x: 0.378 * k, y: 0.33, ry: k * Math.PI / 2, decal: { t: T.logo, w: 0.3, h: 0.3 } })));
}
/* Ausgezeichnete Hofgebäude: in Stufe 1 noch etwas grau und verwittert */
const WORN_T = new Set(["house", "barn", "silo", "mill", "shed", "bakery"]);
function objVar(o) {
  const F = S.farm;
  if (o.t === "deco" && FDECO[o.k] && FDECO[o.k].weg && typeof wegMask === "function") return "m" + wegMask(o);   /* v71: Nachbarn → Ränder */
  if (WORN_T.has(o.t)) return (F.stage || 1) <= 1 ? "w" : "";
  if (o.t === "sw_halle") return sawMask() + ":" + (typeof pvN === "function" ? pvN() : 0);
  if (o.t === "tractor") return (F.cos && F.cos.on && F.cos.on.tractor) || "rot";
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
    case "sw_halle": { const m = sawMask(), pv = typeof pvN === "function" ? pvN() : 0; return fmesh("sawHall:" + m + ":" + pv, () => FWM.sawHall(m, pv)); }
    case "sw_lager": { const k = sawRepaired() ? 1 : 0; return fmesh("sawLager:" + k, () => FWM.sawLager(k)); }
    case "sw_buero": { const k = F.saw && F.saw.strom ? 1 : 0; return fmesh("sawBuero:" + k, () => FWM.sawBuero(k)); }
    case "sw_lkw": { const k = F.saw && F.saw.lkw ? 1 : 0; return fmesh("sawLkw:" + k, () => FWM.sawLkw(k)); }
    case "kessel": { const k = F.saw && F.saw.motor ? 1 : 0; return fmesh("kessel:" + k, () => FWM.kessel(k)); }
    case "spalter": case "hobel": case "trocken": case "verpack": case "schleif": case "fraese": return fmesh("mach:" + o.t, () => FWM.machine(o.t));
    case "saegebock": return fmesh("saegebock", FWM.saegebock);
    case "junk": return fmesh("junk:" + o.k, () => FWM.junk(o.k));
    case "stall": return fmesh("stall", FWM.stall);
    case "tractor": { const col = (F.cos && F.cos.on && F.cos.on.tractor) || "rot"; return fmesh("trk:" + col, () => { const b = new FM.MB(); b.merge(FWM.tractor(col), { x: -1.1, ry: -Math.PI / 2 }); b.merge(FWM.trailer(), { x: 1.1, ry: -Math.PI / 2 }); return b; }); }
    case "f_plot": { const [w, d] = farmSize(o); return fmesh("fplot:" + w + "x" + d, () => FWM.fPlot(w, d)); }
    case "f_steg": return fmesh("lakeSteg", FWM.lakeSteg);
    case "f_huette": return fmesh("fHuette", FWM.fHuette);
    case "f_boot": return fmesh("fBoot", FWM.fBoot);
    case "f_lager": return fmesh("fLager", FWM.fLager);
    case "f_rauch": return fmesh("smoke", FFM.smoke);
    case "f_kuehl": return fmesh("kuehl", FFM.kuehl);
    case "f_markt": return fmesh("fMarkt", FWM.fMarkt);
    case "bert_car": return fmesh("bertCar", FFM.bertCar);
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
/* v120: zweiter, größerer Zeichner für große Bilder (Trophäenwand).
   v121: gerendert wird doppelt so groß wie ausgegeben (288 → 144 px, groß 576 → 288 px): glatte Kanten und scharf auf
   Handys mit 3-facher Pixeldichte (Lagerzelle 40 px = 120 Gerätepixel – vorher wurden 112 px hochgezogen und wirkten weich). */
const THUMB_N = 144, THUMB_NB = 288;
function thumbR(big) {
  /* v159: big === 2 → Porträt-Größe (512 px ausgegeben, 1024 gerendert) für Figuren im Gespräch */
  const K = big === 2 ? "RP" : big ? "RB" : "R", N = big === 2 ? 1024 : big ? THUMB_NB * 2 : THUMB_N * 2;
  if (THUMB[K] || THUMB.failed) return THUMB[K];
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = N;
    const R = G3.create(cv, { keep: true, shadowSize: 1024, shadowBox: 4, maxDpr: 1 });
    if (!R) { if (!big) THUMB.failed = true; return null; }
    R.resize = () => { R.w = N; R.h = N; R.dpr = 1; };
    R.env.fogR = [400, 800];
    /* v121 Icon-Licht: neutral-warmes Hauptlicht, kühler Himmel, warmer dunkler Boden (Unterseiten setzen sich ab) */
    R.env.sunCol = [0.86, 0.82, 0.74]; R.env.sky = [0.55, 0.59, 0.67]; R.env.ground = [0.29, 0.265, 0.24];
    THUMB[K] = R;
  } catch (e) { if (!big) THUMB.failed = true; }
  return THUMB[K];
}
/* o (v120, optional): { yaw, pitch, big } – eigene Blickrichtung (Trophäen von vorn) und großes Bild */
function thumbOf(key, fn, o) {
  if (THUMB.cache[key]) return THUMB.cache[key];
  o = o || THUMB.opts[key] || {};
  const R = thumbR(o.big);
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
    R.shadowBox = r * 1.6;
    /* ragt das Modell über den Bildrand (lange Bretter, Kisten über Eck),
       wird es mit mehr Abstand noch einmal gerendert – nichts wird abgeschnitten */
    for (const k of [1.3, 1.75, 2.3]) {
      Object.assign(R.cam, { tx: cx, ty: cy, tz: cz, dist: r * (flat ? 3.0 : 3.3) * k, yaw: o.yaw != null ? o.yaw : Math.PI / 4, pitch: o.pitch != null ? o.pitch : flat ? 0.85 : 0.55, fov: 0.55 });
      R.env.sun = thumbSun(R.cam.yaw, R.cam.pitch);
      R.render(1.5);
      const c = thumbCrop(R.canvas, k < 2.2, o.big === 2 ? 512 : o.big ? THUMB_NB : THUMB_N, o);
      if (c) { url = c; break; }
    }
    R.free(m);
  } catch (e) { url = null; }
  THUMB.cache[key] = url;
  return url;
}
/* v121: Licht für alle Bildchen gleich – fest zur Kamera (oben links, leicht von vorn), egal wie das Modell gedreht ist.
   Oberseite hell, linke Fläche im Licht, rechte im Halbschatten: klare Plastizität in jedem Bildchen. */
function thumbSun(yaw, pitch) {
  const cp = Math.cos(pitch), E = [Math.cos(yaw) * cp, Math.sin(pitch), Math.sin(yaw) * cp], rt = [E[2], 0, -E[0]];
  const l = Math.hypot(rt[0], rt[2]) || 1, v = [-0.55 * rt[0] / l + 0.42 * E[0], 0.9 + 0.42 * E[1], -0.55 * rt[2] / l + 0.42 * E[2]], n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
}
/* v121: WebP, wo der Browser es schreiben kann (Chrome/Android: etwa ein Drittel der PNG-Größe), sonst PNG */
function thumbURL(cv) {
  if (THUMB.webp !== false) { try { const u = cv.toDataURL("image/webp", 0.9); if (u.indexOf("data:image/webp") === 0) { THUMB.webp = true; return u; } } catch (e) { /* weiter mit PNG */ } THUMB.webp = false; }
  return cv.toDataURL("image/png");
}
/* Bildchen eng zuschneiden: jedes Modell füllt das Quadrat gleich gut –
   lange Bretter wie runde Laibe, nichts ragt über den Rand.
   v121 Freistellung: dezente dunkle Kontur (Comic-Look, liest sich auf hellem wie dunklem Grund) und ein weicher
   Kontaktschatten unter dem Gegenstand – beides wird einmal ins Bild gerechnet, kostet beim Anzeigen nichts. */
function thumbCrop(src, strict, N, opt) {
  N = N || THUMB_N; opt = opt || {};
  const w = src.width, h = src.height;
  try {
    const a = document.createElement("canvas"); a.width = w; a.height = h;
    const ax = a.getContext("2d"); ax.drawImage(src, 0, 0);
    const px = ax.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return src.toDataURL("image/png");
    /* stößt an den Rand: abgeschnitten – lieber mit mehr Abstand neu */
    if (strict && (x0 <= 1 || y0 <= 1 || x1 >= w - 2 || y1 >= h - 2)) return null;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, k = (N * 0.86) / Math.max(bw, bh), dw = bw * k, dh = bh * k;
    const dx = (N - dw) / 2, dy = (N - dh) / 2 - N * 0.012;
    const o = document.createElement("canvas"); o.width = o.height = N;
    const ox = o.getContext("2d"); ox.imageSmoothingQuality = "high";
    /* Kontaktschatten: flache, weiche Ellipse am Fuß */
    const sx = dx + dw / 2, sy = Math.min(N - N * 0.035, dy + dh - N * 0.012), rx = Math.max(N * 0.12, dw * 0.42), ry = Math.max(N * 0.025, Math.min(N * 0.06, dh * 0.08));
    if (!opt.noShadow) { ox.save(); ox.translate(sx, sy); ox.scale(1, ry / rx);
    const g = ox.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, "rgba(30,22,14,0.30)"); g.addColorStop(0.6, "rgba(30,22,14,0.14)"); g.addColorStop(1, "rgba(30,22,14,0)");
    ox.fillStyle = g; ox.beginPath(); ox.arc(0, 0, rx, 0, Math.PI * 2); ox.fill(); ox.restore(); }
    /* Kontur: Silhouette rundum leicht versetzt, eingefärbt, darunter gelegt */
    const t = document.createElement("canvas"); t.width = t.height = N;
    const tx = t.getContext("2d"), ow = Math.max(1, N * 0.011);
    for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; tx.drawImage(a, x0, y0, bw, bh, dx + Math.cos(an) * ow, dy + Math.sin(an) * ow, dw, dh); }
    tx.globalCompositeOperation = "source-in"; tx.fillStyle = "rgba(38,26,16,0.62)"; tx.fillRect(0, 0, N, N);
    ox.drawImage(t, 0, 0);
    ox.drawImage(a, x0, y0, bw, bh, dx, dy, dw, dh);
    return thumbURL(o);
  } catch (e) { return src.toDataURL("image/png"); }
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
  if (FSHOP_SAW.some(x => x.id === it.id)) return () => FWM.machine(it.id, true);
  if (typeof FM[it.id] === "function" && FMACHINES[it.id]) return () => FM[it.id]();
  return null;
}
function decoModel(k) {
  const D = FDECO[k];
  if (!D) return null;
  /* v71: Dekoweg im Laden – drei Felder am Stück */
  if (D.weg) return () => { const m = new FM.MB(); [[-1, 2], [0, 10], [1, 8]].forEach(([x, mk]) => m.merge(FWM.decoWeg(k, mk), { x })); return m; };
  if (FM[k]) return () => FM[k](D.arg || 1);
  if (D.cos) return () => FWM.cosDeco(k);
  return typeof FFM !== "undefined" && FFM[k] ? () => FFM[k]() : null;
}
/* Bildchen im Laden: erst das Symbol, dann (Bild für Bild) das echte Modell */
THUMB.fns = {};
THUMB.opts = {};
function thumbSpan(key, fn, emoji, lock, o) {
  const lk = lock ? `<i class="th-lk">🔒</i>` : "";
  if (!fn || THUMB.failed || THUMB.cache[key] === null) return `<span class="ic">${lock ? "🔒" : emoji}</span>`;
  THUMB.fns[key] = fn;
  if (o) THUMB.opts[key] = o;
  const url = THUMB.cache[key];
  return url ? `<span class="ic th"><img src="${url}" alt="">${lk}</span>` : `<span class="ic th" data-th="${key}"><b>${emoji}</b>${lk}</span>`;
}
/* Holz- und Hofwaren, Stämme und Werkzeug als 3D-Bildchen – so, wie sie im Spiel liegen */
const ITEM_3D = new Set(["birke", "kiefer", "buche", "eiche", "edelholz", "aeste", "reste", "brennholz", "kaminholz", "pfosten", "bretter", "dielen",
  "balken", "bauholz", "bohlen", "platten", "kisten", "paletten", "moebel", "tueren", "zaun", "schatulle", "mehl", "maismehl",
  /* Hofwaren */
  "weizen", "mais", "tomate", "karotte", "kartoffel", "erdbeere", "kuerbis", "apfel", "kirsche", "birne", "ei", "milch", "wolle",
  "spaket", "rpaket", "hfutter", "kfutter", "sfutter", "schfutter", "brot", "fladen", "apfelkuchen", "muffins", "kirschtorte", "pizza",
  "butter", "pudding", "kaese", "bratwurst", "schinken", "gulasch", "garn", "socken", "pullover",
  /* v53: Fische und Fischwaren */
  "barsch", "forelle", "karpfen", "hecht", "zander", "aal", "wels", "schleie", "rotauge", "rotfeder", "ukelei",
  "abfall", "koeder", "barschfilet", "forellenfilet", "karpfenblau", "zanderfilet", "raeucherforelle", "raeucheraal", "fischplatte",
  "konserve", "fischkiste", "edelbox", "hechtkloesse", "fischbroetchen", "wurm", "profikoeder", "muschel", "krabbe", "krebs"]);
/* v59: Berts Spezialköder (Köderdose mit der Art davor) */
if (typeof FSPEC_BAIT !== "undefined") Object.keys(FSPEC_BAIT).forEach(id => ITEM_3D.add("sk_" + id));
function itemIc(id, lock) {
  const it = FITEMS[id];
  if (!it) return "";
  if (!ITEM_3D.has(id)) return `<span class="ic">${lock ? "🔒" : it.i}</span>`;
  return thumbSpan("item:" + id, () => FWM.item(id), it.i, lock, itemView(id));
}
/* v120: Trophäen von vorn und leicht von der Seite zeigen (statt schräg von oben wie Waren) */
function itemView(id) { return /^tro_/.test(id) ? { yaw: Math.PI / 2 - 0.42, pitch: 0.1, noShadow: true } : ITEM_VIEW[id] || null; }
/* v121: Ausnahmen vom Standard-Blick (schräg von vorn oben) – nur wo sonst das Wichtigste verdeckt wäre:
   Tür und Zaun von vorn (Füllungen, Latten), Schatulle etwas steiler (Deckel mit Einlage) */
const ITEM_VIEW = { tueren: { yaw: Math.PI / 2 - 0.5, pitch: 0.28 }, zaun: { yaw: Math.PI / 2 - 0.45, pitch: 0.3 }, schatulle: { yaw: Math.PI / 4 + 0.15, pitch: 0.62 },
  /* v122: Käselaib und Fladen nicht steil von oben (sonst nur eine gelbe Scheibe), Socken/Pullover etwas steiler (liegen flach) */
  kaese: { pitch: 0.5 }, fladen: { pitch: 0.55 }, socken: { pitch: 0.9 }, pullover: { pitch: 0.75 } };
function toolIc(id, lock) { const T = FTOOLS[id]; return thumbSpan("tool:" + id, () => FWM.tool(id), T ? T.i : ({ sickle: "🌙", water: "🚿" }[id] || "🪓"), lock); }
/* Bild-Adresse eines 3D-Bildchens (für Blasen, fliegende Sachen, Ziehen) – null, wenn es keins gibt */
function itemImg(id) { return ITEM_3D.has(id) && !THUMB.failed ? thumbOf("item:" + id, () => FWM.item(id), itemView(id)) : null; }
function toolImg(id) { return THUMB.failed ? null : thumbOf("tool:" + id, () => FWM.tool(id)); }
/* kleines Bild im Text (Blasen, Überschriften) – sonst das Symbol */
function icHTML(id) { const u = itemImg(id); return u ? `<img class="ii" src="${u}" alt="">` : (FITEMS[id] ? FITEMS[id].i : id); }
/* Tiere als 3D-Modell, im Knopf leicht wippend */
const ANI_3D = { huhn: () => FM.chicken(0), kuh: () => FM.cow(0), schwein: () => FM.pig(0), schaf: () => FM.sheep(0, false), rind: () => FM.beef(0) };
function aniIc(kind, lock) { const A = FANIMALS[kind]; return thumbSpan("ani:" + kind, ANI_3D[kind] || null, A ? A.i : "🐾", lock).replace('class="ic th"', 'class="ic th ani"'); }
function aniHTML(kind) { const fn = ANI_3D[kind], u = fn && !THUMB.failed ? thumbOf("ani:" + kind, fn) : null; return u ? `<img class="ii" src="${u}" alt="">` : FANIMALS[kind].i; }
/* auch Listen außerhalb des Hofs (Aufträge) bekommen ihre Bildchen */
setInterval(() => { if (!THUMB.busy && !THUMB.failed && document.querySelector("[data-th]")) thumbFill(); }, 700);
function thumbFill() {
  /* zuerst, was gerade offen ist (Fenster, Blase, Ausbeute), dann der Rest */
  THUMB.queue = [...$$("#farmSheetIn [data-th], #farmPop [data-th], #farmFx [data-th]"), ...$$("[data-th]")];
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
/* Haustier im Bildchen leicht zur Kamera gedreht – Ziege Tim zeigt ihre Brille */
function petThumbFn(k) {
  const fn = k === "hund" ? FWM.dog : k === "katze" ? FWM.cat : FWM.goat;
  return () => { const b = new FM.MB(); b.merge(fn(), { ry: 0.5 }); return b; };
}
function cosModel(c) {
  if (c.skin && c.skin.barn) return ["barn:" + c.skin.barn, () => skinMB("barn", c.skin.barn)];
  if (c.skin && c.skin.house) return ["house:" + c.skin.house, () => skinMB("house", c.skin.house)];
  if (c.skin && c.skin.tractor) return ["tractor:" + c.skin.tractor, () => FWM.tractor(c.skin.tractor)];
  if (c.pet) return ["petth:" + c.pet, petThumbFn(c.pet)];
  if (c.deco) return ["deco:" + c.deco, () => FWM.cosDeco(c.deco)];
  return [null, null];
}
function cosThumb(c) {
  if (c.skin && c.skin.barn) return thumbOf("barn:" + c.skin.barn, () => skinMB("barn", c.skin.barn));
  if (c.skin && c.skin.house) return thumbOf("house:" + c.skin.house, () => skinMB("house", c.skin.house));
  if (c.skin && c.skin.tractor) return thumbOf("tractor:" + c.skin.tractor, () => FWM.tractor(c.skin.tractor));
  if (c.pet) return thumbOf("petth:" + c.pet, petThumbFn(c.pet));
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
function treeMeshOf(t, hi) {
  if (t.st === "stump" && t.cut && typeof SAW3D !== "undefined") return fmesh("wsc:" + t.id + ":" + t.cut.q + ":" + Math.round(t.cut.ny * 100), () => SAW3D.stumpMesh(t.cut));   /* v85: Sägeschnitt mit Sohle + Bruchstufe */
  if (t.st === "stump") return fmesh("ws:" + t.sp + ":" + t.sz, () => FWM.stump(t.sp, t.sz));
  if (t.st === "sapling") return fmesh("wsap:" + t.sp, () => FWM.sapling(t.sp));
  if (t.st === "fallen") return fmesh("wf:" + t.sp + ":" + t.sz, () => FWM.fallen(t.sp, t.sz));
  const v = t.v != null ? t.v : t.id % 3;       /* v90: Kulissenbäume bringen ihre Variante mit */
  if (hi && FV.meshes[tHiKey(t.sp, t.sz, v)]) return FV.meshes[tHiKey(t.sp, t.sz, v)];      /* v152: feine Stufe (nur wenn schon gebaut) */
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
    n.mesh = treeMeshOf(t); n.smesh = null; e.hi = false; TLOD.dirty = true;
    n.x = t.x; n.z = t.z; n.y = 0; n.rx = 0; n.rz = 0;
    const cs = t.st === "stump" && t.cut;
    n.ry = cs ? t.cut.ry : t.st === "fallen" ? (t.fall || 0) : t.ry;
    n.sx = n.sy = n.sz = cs ? t.cut.sc : t.s || 1;
    n.sway = t.st === "up" ? 0.22 : 0;
    n.visible = true;
  }
}
function treeH(t) { return t.st === "up" ? (FWM.TREE_H[t.sp] || 2.8) * FWM.TH[t.sz] * (t.s || 1) : t.st === "fallen" ? 0.8 : 0.5; }
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
/* ------------------- v56: jeder Waldbaum lässt sich fällen -------------------
   Kulissenbäume sind zusammengefasst je Kachel gezeichnet. Tippt man einen an,
   wird er zu einem echten Baum (S.farm.trees, mit bg = Schlüssel) und die Kachel
   ohne ihn neu gebaut; bgCut merkt sich, welche schon „echt“ sind. */
const BG_R = { birke: 0.55, kiefer: 0.75, fichte: 0.75, buche: 1.0, eiche: 1.05, kirsche: 0.75 };
/* v90: endgültige Form eines Kulissenbaums – genau das, was bgPromote beim Antippen erzeugt (Größenklasse, Maßstab,
   Variante, gerundete Lage). Wird einmal je Baum berechnet und am Baum gemerkt. Die Variante kommt aus dem Schlüssel
   (nicht mehr aus der Baum-Nummer), damit sie schon vor dem Antippen feststeht. */
function bgFinal(b) {
  if (b.fz) return b;
  const Sx = FSPECIES[b.sp] || FSPECIES.buche, area = bgArea(b);
  let sz = 1, bd = 1e9;
  for (let i = 1; i <= Math.min(4, Sx.max); i++) { const d = Math.abs(FWM.TH[i] - b.s); if (d < bd) { bd = d; sz = i; } }
  if (b.sp === "eiche" && area !== "altwald") sz = Math.min(sz, 3);
  b.fz = sz; b.fa = area;
  b.fs = +clamp(b.s / FWM.TH[sz], 0.8, 1.25).toFixed(2);
  b.fv = (((b.k * 2654435761) >>> 0) >>> 11) % 3;
  b.fx = +b.x.toFixed(2); b.fzz = +b.z.toFixed(2); b.fry = +b.ry.toFixed(2);
  return b;
}
/* Kachel mit WV.bgInst abgleichen: Bäume in c.trees stehen als Instanz, alle anderen (angetippt, im Nahaufnahme-Minispiel
   ausgeblendet) nicht. Je Art/Größe/Variante gibt es eine Gruppe mit dem Mesh des echten Baums. */
function bgChunkBuild(c) {
  const have = new Set();
  for (const t of c.trees) have.add(t.k);
  for (const t of c.all || c.trees) {
    const g0 = WV.bgInst.get(t.k), want = have.has(t.k);
    if (want && !g0) {
      bgFinal(t);
      const key = t.sp + ":" + t.fz + ":" + t.fv;
      let g = WV.bgG.get(key);
      if (!g) { g = FV.R.instGroup(fmesh("wt:" + key, () => FWM.tree(t.sp, t.fz, t.fv)), { sway: 0.22 }); WV.bgG.set(key, g); }
      g.add(t.k, t.fx, t.fzz, t.fry, t.fs);
      WV.bgInst.set(t.k, g);
    } else if (!want && g0) { g0.remove(t.k); WV.bgInst.delete(t.k); }
  }
}
/* ---------------- v152: Detailstufen der Waldbäume ----------------
   Nah an der Kamera die feine Stufe (FWM.tree(…, true): Rinde wie in der Ich-Perspektive, feinere Krone mit Blattbüscheln),
   sonst die grobe. Beide Stufen haben dieselbe Lage, Größe, Rindenzeichnung und Kronenform – beim Wechsel ändert sich nur die
   Feinheit, kein anderes Modell. Abstand Auge–Baummitte; größere Bäume wechseln früher, mit Hysterese gegen Flackern.
   Feine Modelle werden erst gebaut, wenn sie gebraucht werden (je Bild höchstens ~6 ms, mindestens eins), bis dahin bleibt die grobe Stufe. */
const TLOD = { near: 17, hyst: 2.5, q: [], qs: new Set(), bad: new Set(), t: 0, eye: null, dirty: true, on: true };
function tHiKey(sp, sz, v) { return "wth:" + sp + ":" + sz + ":" + v; }
function tHiReady(sp, sz, v) { return !!FV.meshes[tHiKey(sp, sz, v)]; }
function tHiWant(sp, sz, v) {
  const k = sp + ":" + sz + ":" + v;
  if (TLOD.qs.has(k) || TLOD.bad.has(k) || tHiReady(sp, sz, v)) return;
  TLOD.qs.add(k); TLOD.q.push([sp, sz, v, k]);
}
function tHiBuild() {
  const t0 = performance.now();
  let built = 0;
  while (TLOD.q.length && (!built || performance.now() - t0 < 6)) {
    const [sp, sz, v, k] = TLOD.q.shift();
    TLOD.qs.delete(k);
    try { fmesh(tHiKey(sp, sz, v), () => FWM.tree(sp, sz, v, true)); built++; } catch (e) { TLOD.bad.add(k); console.warn("Baum fein", k, e); }
  }
  if (built) TLOD.dirty = true;
}
/* Grenzabstand je Baum: Größe (Höhe) zählt mit – ein großer Baum ist aus größerer Entfernung noch groß im Bild */
function tLodLim(sz, s) { return TLOD.near * (0.82 + 0.18 * (FWM.TH[sz] || 1) * (s || 1)); }
function treeLodStep() {
  const R = FV.R;
  if (!R || !R.eye || !S.farm || !TLOD.on) return;
  if (!FV.fp) tHiBuild();                                       /* in der Ich-Perspektive nichts nachbauen (kein Ruckeln beim Sägen) */
  const now = performance.now(), E = R.eye;
  const moved = !TLOD.eye || Math.hypot(E[0] - TLOD.eye[0], E[1] - TLOD.eye[1], E[2] - TLOD.eye[2]) > 0.5;
  if (!moved && !TLOD.dirty && now - TLOD.t < 500) return;
  TLOD.t = now; TLOD.eye = E.slice(); TLOD.dirty = false;
  const HY = TLOD.hyst, dOf = (x, y, z) => Math.hypot(x - E[0], y - E[1], z - E[2]);
  /* echte (fällbare) Bäume: Knoten bekommen das passende Mesh */
  const byId = new Map((S.farm.trees || []).map(t => [t.id, t]));
  for (const [id, e] of WV.trees) {
    if (e.falling) continue;
    const t = byId.get(id);
    if (!t || t.st !== "up") { e.hi = false; continue; }
    const v = t.v != null ? t.v : t.id % 3, d = dOf(t.x, treeH(t) * 0.45, t.z), want = d < tLodLim(t.sz, t.s) + (e.hi ? HY : 0);
    if (want && !tHiReady(t.sp, t.sz, v)) { tHiWant(t.sp, t.sz, v); continue; }
    if (want !== !!e.hi) { e.hi = want; e.node.mesh = treeMeshOf(t, want); e.node.smesh = want ? treeMeshOf(t, false) : null; }
  }
  /* Kulissenbäume: Instanz wandert zwischen der groben und der feinen Gruppe derselben Art/Größe/Variante */
  if (!WV.bgChunks || !WV.bgInst) return;
  WV.bgGH = WV.bgGH || new Map(); WV.bgHi = WV.bgHi || new Map();
  const bgY = t => (FWM.TREE_H[t.sp] || 2.8) * (FWM.TH[t.fz] || 1) * t.fs * 0.45;
  for (const [kk, o] of WV.bgHi) {
    const t = o.t;
    if (WV.bgInst.get(kk) !== o.gH) { WV.bgHi.delete(kk); continue; }          /* inzwischen entfernt (angetippt, Ich-Perspektive) */
    if (dOf(t.fx, bgY(t), t.fzz) > tLodLim(t.fz, t.fs) + HY) {
      o.gH.remove(kk); o.gF.add(kk, t.fx, t.fzz, t.fry, t.fs); WV.bgInst.set(kk, o.gF); WV.bgHi.delete(kk);
    }
  }
  const CH = WGRID.chunk, reach = tLodLim(4, 1.3);
  for (const c of WV.bgChunks.values()) {
    const cx = Math.max(c.x0, Math.min(c.x0 + CH, E[0])), cz = Math.max(c.z0, Math.min(c.z0 + CH, E[2]));
    if (Math.hypot(cx - E[0], cz - E[2]) > reach) continue;
    for (const t of c.trees) {
      if (WV.bgHi.has(t.k)) continue;
      const gF = WV.bgInst.get(t.k);
      if (!gF || !t.fz || dOf(t.fx, bgY(t), t.fzz) >= tLodLim(t.fz, t.fs)) continue;
      if (!tHiReady(t.sp, t.fz, t.fv)) { tHiWant(t.sp, t.fz, t.fv); continue; }
      const key = t.sp + ":" + t.fz + ":" + t.fv;
      let gH = WV.bgGH.get(key);
      if (!gH) { gH = R.instGroup(FV.meshes[tHiKey(t.sp, t.fz, t.fv)], { sway: gF.sway, smesh: gF.mesh }); WV.bgGH.set(key, gH); }
      gF.remove(t.k); gH.add(t.k, t.fx, t.fzz, t.fry, t.fs); WV.bgInst.set(t.k, gH); WV.bgHi.set(t.k, { t, gF, gH });
    }
  }
}
function bgPick(x, y) {
  const R = FV.R, g = R.ground(x, y, 0);
  if (!g || !WV.bgChunks) return null;
  const r = R.ray(x, y), CH = WGRID.chunk;
  let best = null, bt = 1e9;
  for (const c of WV.bgChunks.values()) {
    if (g[0] < c.x0 - 14 || g[0] > c.x0 + CH + 14 || g[2] < c.z0 - 14 || g[2] > c.z0 + CH + 14) continue;
    for (const t of c.trees) {
      if (Math.abs(t.x - g[0]) > 14 || Math.abs(t.z - g[2]) > 14) continue;
      const k = (BG_R[t.sp] || 0.8) * t.s * 0.85;
      const d = R.hitBox(r, [t.x - k, 0, t.z - k], [t.x + k, FWM.TREE_H[t.sp] * t.s, t.z + k]);
      if (d != null && d < bt) { bt = d; best = { c, t }; }
    }
  }
  return best ? { c: best.c, b: best.t, d: bt } : null;
}
function bgArea(b) { const a = areaOfPoint(b.x, b.z); return a === "saege" ? "wald" : a; }
function bgPromote(hit) {
  const F = S.farm, b = bgFinal(hit.b);
  const id = F.trees.reduce((m, t) => Math.max(m, t.id), 0) + 1;
  const t = { id, sp: b.sp, sz: b.fz, mx: b.fz, x: b.fx, z: b.fzz, ry: b.fry, s: b.fs, st: "up", t: 0, dmg: 0, area: b.fa, bg: b.k, v: b.fv };
  F.trees.push(t);
  F.bgCut = F.bgCut || {}; F.bgCut[b.k] = 1;
  hit.c.trees.splice(hit.c.trees.indexOf(b), 1);
  bgChunkBuild(hit.c);
  worldSyncTrees();
  return t;
}
function treeScreen(t, f) { const p = FV.R.project(t.x, treeH(t) * (f == null ? 0.6 : f), t.z); return p ? [p[0], p[1]] : [FV.R.w / 2, FV.R.h / 2]; }
/* gefällter Baum kippt in die gewählte Richtung */
function worldTreeFall(t, dir) {
  const e = WV.trees.get(t.id);
  if (!e) return;
  e.falling = true;
  /* v85: in der Ego-Sicht fällt der Nahaufnahme-Baum selbst (fpsaw.js) – hier nur das Aufschlag-Ende */
  if (typeof SAW3D !== "undefined" && SAW3D.fall(t, dir, () => treeLanded({ e, t, ry: dir }, wnow()))) return;
  WV.falling.push({ e, t, t0: wnow(), ry: dir != null ? dir : Math.random() * 6.28 });
}
function stepFalling() {
  const now = wnow();
  for (let i = WV.falling.length - 1; i >= 0; i--) {
    const F = WV.falling[i], k = clamp((now - F.t0) / 1.0, 0, 1), n = F.e.node;
    /* langsames Ankippen, dann beschleunigt, am Boden ein kleiner Nachfederer */
    const kk = k < 1 ? Math.pow(k, 2.4) : 1, bn = k > 0.9 ? Math.sin((k - 0.9) * 10 * Math.PI) * 0.02 * (1 - k) * 10 : 0;
    n.ry = F.ry; n.rx = kk * Math.PI / 2 * 0.97 + bn; n.sway = 0;
    if (k >= 1) {
      WV.falling.splice(i, 1);
      treeLanded(F, now);
    }
  }
  stepLogs(now);
}
/* Aufschlag: Staub, Schlag, der Stamm zerfällt in einen kurz sichtbaren Holzstapel */
function treeLanded(F, now) {
  F.e.falling = false; F.e.key = "";
  const len = treeH({ st: "up", sz: F.t.sz, s: F.t.s }) * 0.7;
  FV.R.burst({ x: F.t.x + Math.sin(F.ry) * len, y: 0.2, z: F.t.z + Math.cos(F.ry) * len, n: 26, col: [[0.75, 0.68, 0.55, 0.9], [0.55, 0.75, 0.35, 1]], speed: 2.2, up: 1.4, size: 0.12, flat: true, spread: 2 });
  FV.R.burst({ x: F.t.x + Math.sin(F.ry) * len, y: 0.3, z: F.t.z + Math.cos(F.ry) * len, n: 18, col: [[0.95, 0.82, 0.45, 1], [0.78, 0.58, 0.32, 1]], speed: 2.6, up: 2.2, size: 0.07, shape: 1, life: 1 });
  sfx("thud");
  worldSyncTrees(false);
  try {
    const R = FV.R, sp = F.t.sp || "kiefer", nd = fnode(fmesh("pile:3:" + sp, () => FWM.logPile(3, sp)), { x: F.t.x + Math.sin(F.ry) * len * 0.55, z: F.t.z + Math.cos(F.ry) * len * 0.55, ry: F.ry, s: 0.4 });
    R.nodes.push(nd); (WV.logfx = WV.logfx || []).push({ nd, R, t0: now });
  } catch (e) { /* egal */ }
}
function stepLogs(now) {
  const L = WV.logfx;
  if (L) for (let i = L.length - 1; i >= 0; i--) {
    const f = L[i], a = now - f.t0, g = clamp(a / 0.35, 0, 1);
    f.nd.s = a < 1.3 ? 0.4 + 0.6 * (1 - Math.pow(1 - g, 3)) : Math.max(0.01, 1 - (a - 1.3) / 0.4);
    if (a > 1.7) { const k2 = f.R.nodes.indexOf(f.nd); if (k2 >= 0) f.R.nodes.splice(k2, 1); L.splice(i, 1); }
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
      WV.barriers[id] = [AREA_BAR[id]].concat(AREA_BAR2[id] || []).filter(Boolean).map(p => fnode(fmesh("barrier", FWM.barrier), { x: p[0], z: p[1], ry: p[2] }));
      WV.barriers[id].forEach(b => R.nodes.push(b));
    } else if (open && n) {
      delete WV.barriers[id];
      n.forEach(n => {
        const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1);
        for (let k = 0; k < 18; k++) R.emit({ x: n.x + (Math.random() - 0.5) * 2, y: 0.3, z: n.z + (Math.random() - 0.5) * 2, vx: (Math.random() - 0.5) * 2, vy: 1, vz: (Math.random() - 0.5) * 2, life: 0.9, size: 0.2, size2: 0.45, col: [0.95, 0.92, 0.85, 0.7], drag: 2 });
      });
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
  const path = id === "wald" ? FWORLD.paths[0].concat(FWORLD.paths[1].slice(0, 3)) : id === "saege" ? [[-41, -30], [-41, -42], [-41, -54]] : id === "altwald" ? FWORLD.paths[4].slice(2) : LAKE_WAY1;
  WV.dust = { pts: FM.MB ? FWM.smoothLine(path, 5) : path, i: 0, t: 0 };
  worldSyncBarriers();
  farmSyncScene(true);
  save();
  setTimeout(() => { if (sp && FV.on) toast("Tipp: Links wechselst du zwischen " + (id === "see" ? "Hof, Wald und See." : "Hof und Wald."), ""); }, 4200);
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
  ["deer", -24, -48, 4.5, "wald"], ["deer", -60, -54, 5, "wald"], ["deer", -78, -84, 4.5, "altwald"],
  ["hare", 38, 12, 3, null], ["hare", -33, -20, 3, "wald"], ["hare", -24, 19, 2.5, "see"],
  ["squirrel", -36, -66, 2.5, "wald"], ["squirrel", 27.5, -12, 1.8, null], ["heron", -3.5, 29.4, 0.8, "see"],
  ["boar", -72, -48, 4, "wald"], ["boar", -98, -90, 5, "altwald"],
  ["fox", -16, -60, 5, "wald"], ["fox", 48, 9, 4, null], ["fox", -26, 28, 3, "see"],
  ["hedgehog", 42, -13, 2.5, null], ["hedgehog", -24, -52, 3, "wald"]
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
  ["bird", -36, -52, 5, 5, null, 0], ["bird", -36, -52, 6.3, 5.6, null, 0], ["bird", -36, -52, 7.6, 6.2, "wald", 0],
  ["owl", -30, -42, 9, 6, "wald", 1], ["owl", 8, 0, 11, 6.5, null, 2],
  ["bat", 2, -6, 3.6, 3.4, null, 3], ["bat", 2, -6, 4.4, 4, null, 3], ["bat", 2, -6, 3, 3, null, 3],
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
  try { worldMakeWild0(); } catch (e) { console.warn("Wildtiere:", e); WV.wild = WV.wild || []; WV.fly = WV.fly || []; WV.swarm = WV.swarm || []; }
}
function worldMakeWild0() {
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
  /* der Vogelschwarm über der Schatzkiste */
  WV.swarm = Array.from({ length: 11 }, (_, i) => {
    const body = fnode(fmesh("fly:bird", FLY_DEF.bird.mesh), { s: 1.9 + (i % 3) * 0.15, visible: false, alpha: 0 });
    const wl = R.addChild(body, fnode(fmesh("flyW:bird", FLY_DEF.bird.wing), {}));
    const wr = R.addChild(body, fnode(fmesh("flyW:bird", FLY_DEF.bird.wing), { sx: -1 }));
    R.nodes.push(body);
    return { body, wl, wr, a: i * 0.57, r: 1.6 + (i * 0.37) % 2.8, h: 5 + (i * 0.61) % 2.6, sp: (0.75 + (i % 4) * 0.12) * (i % 5 === 4 ? -1 : 1), f: 0, out: 0, i };
  });
}
/* v146: Wild läuft auf dem Wegenetz (team.js): nicht durch Gebäude, Bäume, Felsen, Wasser, Zäune; der Igel schlüpft unter Zäunen durch */
const wildRole = w => w.k === "hedgehog" ? "igel" : "wild";
function wildHome(w) {
  const a = Math.random() * 6.28, d = Math.random() * w.r;
  let x = w.home[0] + Math.cos(a) * d, z = w.home[1] + Math.sin(a) * d;
  if (w.k !== "heron" && typeof navFree === "function") {
    const role = wildRole(w);
    let f = navFree(x, z, role, 4);
    if (role === "wild" && navSide(f[0], f[1]) !== navSide(w.home[0], w.home[1])) f = navFree(w.home[0], w.home[1], role, 4);   /* nicht hinterm Zaun starten */
    x = f[0]; z = f[1];
  }
  w.x = w.tx = x; w.z = w.tz = z; w.path = null; w.ptx = null;
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
    const sp = (w.flee > 0 ? w.D.run : w.D.sp) * dt;
    if (w.flee > 0) w.flee -= dt;
    let hd = null, arrived = false;
    if (w.k === "heron" || typeof wanderPlan !== "function") {
      const dx = w.tx - w.x, dz = w.tz - w.z, dist = Math.hypot(dx, dz);
      if (dist < sp || dist < 0.05) arrived = true; else { w.x += dx / dist * sp; w.z += dz / dist * sp; hd = Math.atan2(dx, dz); }
    } else {
      /* neues Ziel: Weg planen (ist es nicht erreichbar, bleibt das Tier einfach stehen) */
      if (w.ptx !== w.tx || w.ptz !== w.tz) { w.ptx = w.tx; w.ptz = w.tz; wanderPlan(w, w.tx, w.tz, wildRole(w), 4); }
      if (!w.path) arrived = true;
      else { const r = wanderMove(w, sp); hd = r.h; if (r.done) arrived = true; }
    }
    if (arrived) { w.wait = (w.D.still ? 6 : 2) + Math.random() * (w.D.still ? 9 : 5); w.flee = 0; w.node.rx = 0; w.path = null; w.ptx = null; continue; }
    w.node.x = w.x; w.node.z = w.z; w.node.rx = 0;
    if (hd != null) w.node.ry = hd;
    w.node.y = w.D.hop ? Math.abs(Math.sin(time * (w.flee > 0 ? 14 : 9) + w.i)) * 0.12 : Math.abs(Math.sin(time * 8 + w.i)) * 0.02;
  }
  /* Vögel kreisen über dem Wald, Eulen und Fledermäuse nachts */
  const grp = {};
  for (const b of WV.fly) {
    if (grp[b.g] == null) grp[b.g] = wildPres("g" + b.g, dt, wildWin(b.D.win, h));
    const isB = b.k === "bird";
    const on = grp[b.g] && (!b.area || farmAreaOpen(b.area));
    /* ganz weg: beim nächsten Mal woanders auftauchen */
    if (!on && b.f <= 0 && isB && Math.random() < dt * 0.5) { b.c = pick(FWORLD.clearings).slice(0, 2); b.cc = b.c.slice(); }
    b.f = on ? Math.min(1, b.f + fade) : Math.max(0, b.f - fade);
    const mv = Math.min(1, dt * 0.8);
    b.cc[0] += (b.c[0] - b.cc[0]) * mv; b.cc[1] += (b.c[1] - b.cc[1]) * mv;
    const c = b.cc, B = b.body, ox = B.x, oz = B.z;
    if (b.scare > 0) b.scare -= dt;
    const boost = b.scare > 0 ? 2.6 : 1;
    b.a += dt * b.sp * boost;
    if (b.k === "bat") {
      /* Fledermäuse: zackiger Zickzackflug */
      B.x = c[0] + Math.cos(b.a) * b.r + Math.sin(b.a * 2.7 + b.i) * 1.3;
      B.z = c[1] + Math.sin(b.a) * b.r + Math.cos(b.a * 3.1 + b.i) * 1.1;
      B.y = b.h + Math.sin(b.a * 4.3 + b.i) * 0.6 + (b.scare > 0 ? 1.5 : 0);
      const f = Math.sin(time * 26 + b.i) * 0.95;
      b.wl.rz = f; b.wr.rz = -f;
    } else {
      B.x = c[0] + Math.cos(b.a) * b.r; B.z = c[1] + Math.sin(b.a) * b.r;
      B.y = b.h + Math.sin(time * (b.k === "owl" ? 0.7 : 1.3) + b.i) * 0.3 + (b.scare > 0 ? 1.2 : 0);
      /* Eulen: ein paar Flügelschläge, dann lautlos gleiten */
      const f = b.k === "owl" ? ((time * 0.45 + b.i) % 3 < 1 || b.scare > 0 ? Math.sin(time * 7 + b.i) * 0.55 : 0.06) : Math.sin(time * 12 + b.i) * 0.6;
      b.wl.rz = f; b.wr.rz = -f;
    }
    if (Math.hypot(B.x - ox, B.z - oz) > 1e-4) B.ry = Math.atan2(B.x - ox, B.z - oz);
    B.alpha = b.f;
    B.visible = b.f > 0 && Math.abs(B.x - cam.tx) < 70 && Math.abs(B.z - cam.tz) < 70;
  }
  /* der Händler wippt und winkt den Leuten zu */
  if (WV.trader) { const n = WV.trader; n.y = Math.abs(Math.sin(time * 3.2)) * 0.06; n.ry = 0.6 + Math.sin(time * 1.1) * 0.35; n.rz = Math.sin(time * 6.5) * 0.05; }
  /* Schwarm über der Kiste: wirbelt durcheinander, nach dem Ausgraben fliegt er auseinander */
  const tr = farmTreasureCur(), live = !!(tr && !tr.done);
  if (tr) WV.swarmAt = [tr.x, tr.z];
  const sc = WV.swarmAt;
  /* ab und zu blitzt es golden am Kreuz */
  if (live && Math.random() < dt * 1.4) FV.R.emit({ x: tr.x + (Math.random() - 0.5) * 0.8, y: 0.2, z: tr.z + (Math.random() - 0.5) * 0.8, vy: 1.2, life: 0.9, size: 0.12, size2: 0.02, col: [1, 0.86, 0.3, 1], shape: 1, drag: 1.5 });
  /* offene Kiste: Goldglanz steigt auf */
  if (tr && tr.done && Math.random() < dt * 5) FV.R.emit({ x: tr.x + 0.2 + (Math.random() - 0.5) * 0.4, y: 0.32, z: tr.z - 0.1 + (Math.random() - 0.5) * 0.3, vy: 0.9 + Math.random() * 0.6, life: 1.0, size: 0.09, size2: 0.01, col: [1, 0.86, 0.3, 1], shape: 1, drag: 1.2 });
  for (const b of WV.swarm) {
    b.f = live ? Math.min(1, b.f + dt / 2) : Math.max(0, b.f - dt / 2.5);
    b.out = live ? Math.max(0, b.out - dt) : b.out + dt;
    const B = b.body;
    if (!sc || b.f <= 0) { B.visible = false; continue; }
    const ox = B.x, oz = B.z, r = b.r + Math.sin(time * 0.9 + b.i * 1.3) * 0.6 + b.out * 5;
    b.a += dt * b.sp * (live ? 1 : 1.8);
    B.x = sc[0] + Math.cos(b.a) * r; B.z = sc[1] + Math.sin(b.a) * r;
    B.y = b.h + Math.sin(time * 1.7 + b.i * 2.1) * 0.5 + b.out * 2.5;
    if (Math.hypot(B.x - ox, B.z - oz) > 1e-4) B.ry = Math.atan2(B.x - ox, B.z - oz);
    const f = Math.sin(time * 13 + b.i * 1.7) * 0.65;
    b.wl.rz = f; b.wr.rz = -f;
    B.alpha = b.f;
    B.visible = Math.abs(B.x - cam.tx) < 80 && Math.abs(B.z - cam.tz) < 80;
  }
}
/* Kreuz im Boden – nach dem Ausgraben ein offenes Loch mit leerer Kiste */
function worldSyncTreasure() {
  const c = farmTreasureCur(), key = c ? c.t0 + ":" + (c.done ? 1 : 0) : "", R = FV.R;
  if (key === WV.trKey) return;
  WV.trKey = key;
  WV.trNodes.forEach(n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
  WV.trNodes = []; WV.trFx = null; WV.trChest = null;
  if (!c) return;
  const add = (mesh, o) => { const n = fnode(mesh, o); R.nodes.push(n); WV.trNodes.push(n); return n; };
  /* v74: Leuchtfeuer über dem Kreuz – goldene Säule und Ping-Ringe, schon von weitem zu sehen */
  if (!c.done) WV.trFx = {
    x: c.x, z: c.z,
    b1: add(fmesh("trBeam1", () => FWM.lootBeam(0.2, 0.08, 10, 0xffd25a)), { x: c.x, z: c.z, alpha: 0.12, glow: 1, shadow: false }),
    b2: add(fmesh("trBeam2", () => FWM.lootBeam(0.09, 0.035, 10, 0xfff6c8)), { x: c.x, z: c.z, alpha: 0.26, glow: 1, shadow: false }),
    r1: add(fmesh("lootRing", () => FWM.lootRing(0.85, 1.0, 0xffe27a)), { x: c.x, z: c.z, alpha: 0.4, glow: 1, shadow: false }),
    r2: add(fmesh("lootRing", () => FWM.lootRing(0.85, 1.0, 0xffe27a)), { x: c.x, z: c.z, alpha: 0.4, glow: 1, shadow: false })
  };
  if (!c.done) add(fmesh("trX2", () => {
    const b = new FM.MB();
    b.disc(1.05, 14, 0x7a5a36, { y0: 0.04, wob: 0.12 });
    b.noise(0.25, m => { for (let i = 0; i < 7; i++) m.ico(0.1, 0x6a4a2a, { x: Math.cos(i * 0.95) * 0.85, z: Math.sin(i * 0.95) * 0.85, y: 0.05, flat: 0.5, jitter: 0.4 }); });
    [0.785, -0.785].forEach(ry => b.box(1.7, 0.06, 0.28, 0xd23a2a, { ry, y: 0.05, top: 0xe8483a }));
    /* ein Spaten steckt daneben im Boden */
    b.at({ x: 0.95, z: -0.55, rz: -0.25, rx: 0.15 }, m => {
      m.box(0.05, 0.9, 0.05, 0x9a6a3a, { y: 0.25 });
      m.box(0.22, 0.05, 0.05, 0x9a6a3a, { y: 1.12 });
      m.box(0.24, 0.3, 0.03, 0xb8c0c8, { y: 0 });
    });
    return b;
  }), { x: c.x, z: c.z, ry: (c.x * 7) % 1 });
  else {
    /* Grube: aufgeworfener Erdwall rundherum, dunkles Loch, Erdhaufen mit Spaten daneben */
    add(fmesh("trHole2", () => {
      const b = new FM.MB(), dirt = 0x8a6a44, dirtD = 0x6e5236;
      b.disc(1.0, 16, 0x9a7a52, { y0: 0.01, wob: 0.06 });
      b.noise(0.12, m => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; m.sphere(0.2, 7, 4, i % 2 ? dirt : dirtD, { x: Math.cos(a) * 0.66, y: 0.0, z: Math.sin(a) * 0.66, sy: 0.38, sx: 1.25, ry: -a }); } });
      b.disc(0.56, 14, 0x24160a, { y0: 0.03 });
      b.disc(0.42, 12, 0x1a0f06, { y0: 0.032 });
      b.noise(0.1, m => m.sphere(0.48, 9, 5, dirt, { x: 1.15, y: 0.0, z: -0.45, sy: 0.55, bottom: dirtD }));
      b.noise(0.3, m => { for (let i = 0; i < 4; i++) m.ico(0.09, dirtD, { x: 0.75 + i * 0.12, y: 0.03, z: 0.2 + (i % 2) * 0.12, flat: 0.6, jitter: 0.4 }); });
      b.at({ x: 1.2, y: 0.18, z: -0.5, rz: -0.35, rx: 0.2 }, m => {
        m.box(0.05, 0.85, 0.05, 0x9a6a3a, { y: 0.15 });
        m.box(0.22, 0.05, 0.05, 0x9a6a3a, { y: 0.98 });
        m.box(0.24, 0.3, 0.03, 0xb8c0c8, { y: -0.12 });
      });
      return b;
    }), { x: c.x, z: c.z, shadow: false });
    /* Kiste steckt halb im Loch, Deckel offen, voller Münzen */
    WV.trChest = add(fmesh("trChest2", () => {
      const b = new FM.MB(), w = 0x9a6234, wd = 0x7a4a26, g = 0xe2b33a, gl = 0xf6d24a;
      b.box(0.66, 0.42, 0.46, w, { y: -0.16, top: 0x8c2434 });
      [-0.18, -0.04].forEach(y => b.box(0.67, 0.025, 0.47, wd, { y }));
      [-0.3, 0.3].forEach(x => b.box(0.06, 0.44, 0.48, g, { x, y: -0.17 }));
      b.box(0.12, 0.12, 0.03, g, { y: 0.0, z: 0.235 });
      /* Münzberg */
      b.noise(0.15, m => {
        m.sphere(0.27, 9, 5, gl, { y: 0.24, sy: 0.32, sx: 1.05 });
        for (let i = 0; i < 9; i++) m.cyl(0.06, 0.06, 0.02, 8, gl, { x: (Math.random() - 0.5) * 0.44, y: 0.27 + Math.random() * 0.04, z: (Math.random() - 0.5) * 0.28, rx: (Math.random() - 0.5) * 0.9, rz: (Math.random() - 0.5) * 0.9, top: 0xffe27a });
      });
      b.ico(0.06, 0xd8334a, { x: 0.12, y: 0.33, z: 0.05 });
      b.ico(0.05, 0x3fa0e0, { x: -0.14, y: 0.32, z: -0.02 });
      /* Deckel: gewölbt, nach hinten aufgeklappt */
      b.at({ y: 0.26, z: -0.23, rx: -1.95 }, m => {
        m.cyl(0.23, 0.23, 0.66, 9, w, { rz: Math.PI / 2, x: 0.33, z: 0.23, sz: 1, top: wd });
        [-0.3, 0.3].forEach(x => m.cyl(0.24, 0.24, 0.06, 9, g, { rz: Math.PI / 2, x: x + 0.03, z: 0.23 }));
      });
      return b;
    }), { x: c.x + 0.05, z: c.z - 0.05, ry: 0.55 });
    if (WV.trReveal) WV.trChest.visible = false;
  }
}
function worldTreasureDig() {
  const c = farmTreasureCur();
  if (!c || c.done || WV.trReveal) return;
  farmFocusXZ(c.x + 1.5, c.z + 1.5, 18, 600);
  MG.open("dig", {}, res => {
    if (!res || !res.ok) return;
    const r = farmTreasureDig(res.score);
    if (!r) return;
    save();
    /* v74: Truhe steigt aus der Grube – die Belohnung ist schon verbucht, die Show zeigt sie */
    if (FV.R) worldTreasureReveal(c, r);
    farmSyncScene(); renderFarmUI();
  });
}
function farmTreasureView(type, c) {
  if (!FV.on) return;
  try { farmTreasureViewGo(type, c); } catch (e) { console.warn("Schatz-Anzeige", e); }
}
function farmTreasureViewGo(type, c) {
  const Z = FTREASURE_ZONES.find(z => z.id === c.zone);
  if (type === "start") toast("🐦 Ein Vogelschwarm kreist " + (Z ? Z.n : "über dem Gelände") + " – darunter liegt eine Schatzkiste! Such das rote Kreuz.", "ok");
  if (type === "start") worldTreasureIntro(c, Z);
  if (type === "gone") toast("🐦 Der Vogelschwarm ist weg – die Kiste bleibt verborgen.", "");
  farmSyncScene();
}
/* ---------------- v74: Schatzkiste – Erscheinen, Leuchtfeuer, große Öffnungs-Show ---------------- */
const TR_CSS = ["#f6d24a", "#ffae2e", "#ffe27a"];
const TR_COL = [[1, 0.84, 0.3, 1], [1, 0.68, 0.18, 1], [1, 0.92, 0.5, 1]];
const TR_TXT = ["Schatz gefunden!", "Prächtiger Schatz!", "Meisterhaft gegraben!"];
const TR_GEM = [[0.95, 0.2, 0.3, 1], [0.25, 0.65, 1, 1], [0.3, 0.95, 0.6, 1], [0.8, 0.45, 1, 1]];
const TR_GOLD = [1, 0.84, 0.25, 1], TR_DIRT = [[0.55, 0.4, 0.25, 1], [0.45, 0.32, 0.2, 1], [0.66, 0.5, 0.32, 1]];
/* Der Schwarm stürzt von weit her heran, ein Goldfunke schießt aus dem Boden, ein Banner meldet den Fund */
function worldTreasureIntro(c, Z) {
  const R = FV.R;
  if (!R || FV.fp || (typeof MG !== "undefined" && MG.on)) return;
  WV.trIntro = { t: 0, t0: c.t0, shot: false };
  WV.swarm.forEach(b => { b.out = 6 + (b.i % 3) * 0.6; b.f = 0; });
  /* Kamera nur mitnehmen, wenn der Spieler sie gerade nicht anfasst */
  if (!FV.touchAt || performance.now() - FV.touchAt > 4000) farmFocusXZ(c.x + 1, c.z + 1.5, 24, 1300);
  worldLootShow(R.w / 2, R.h / 2, { sub: Z ? Z.n : "Neue Fundstelle", title: "🐦 Schatz gesichtet!", chips: ["Such das rote Kreuz", "3 Stunden Zeit"], r: 1, css: "#ffd25a", ms: 3600 });
  sfx("horn"); setTimeout(() => sfx("pearl"), 260);
}
function stepTreasure(dt, time) {
  const R = FV.R, Rv = WV.trReveal;
  if (WV.trChest && WV.trChest.visible) WV.trChest.ry += angTo(WV.trChest.ry, parcelFace()) * Math.min(1, dt * 5);
  if (Rv) return stepTreasureReveal(Rv, dt, time);
  const X = WV.trFx, tr = farmTreasureCur();
  if (!X || !tr || tr.done) { if (WV.trIntro && (!tr || tr.done)) WV.trIntro = null; return; }
  const I = WV.trIntro, x = X.x, z = X.z;
  let boost = 0, grow = 1;
  if (I) {
    I.t += dt;
    if (!I.shot) {
      I.shot = true;
      R.burst({ x, y: 0.3, z, n: 46, speed: 3.4, up: 4.2, life: 1.3, size: 0.17, size2: 0.02, col: [TR_GOLD, [1, 1, 1, 1]], shape: 3, g: -4, drag: 0.6 });
      R.burst({ x, y: 0.15, z, n: 16, speed: 2, flat: true, up: 0.6, life: 0.9, size: 0.25, size2: 0.7, col: [[0.8, 0.65, 0.4, 0.5]], g: -0.6, drag: 1.6 });
    }
    grow = Math.min(1, I.t / 1.1); grow = 1 - Math.pow(1 - grow, 3);
    boost = Math.max(0, 1 - I.t / 2.2);
    if (I.t > 3.5) WV.trIntro = null;
  }
  const pulse = Math.sin(time * 2.4) * 0.03;
  X.b1.sy = X.b2.sy = Math.max(0.02, grow);
  X.b1.alpha = 0.13 + pulse + boost * 0.4; X.b2.alpha = 0.26 + pulse * 2 + boost * 0.55;
  X.b1.sx = X.b1.sz = 1 + Math.sin(time * 1.7) * 0.12 + boost * 1.2; X.b2.sx = X.b2.sz = 1 + Math.sin(time * 2.9) * 0.15;
  [X.r1, X.r2].forEach((r, i) => {
    const u = (time * 0.36 + i * 0.5) % 1;
    r.sx = r.sz = 0.5 + u * 2.6; r.alpha = (0.5 + boost * 0.3) * (1 - u) * Math.min(1, u * 6);
  });
  /* Glitzern im Boden: ab und zu blitzt ein großer Stern auf */
  if (Math.random() < dt * 1.1) R.emit({ x: x + (Math.random() - 0.5) * 0.9, y: 0.3 + Math.random() * 0.3, z: z + (Math.random() - 0.5) * 0.7, vy: 0.3, life: 0.8, size: 0.5, size2: 0.05, col: [1, 0.95, 0.6, 1], shape: 3 });
  if (Math.random() < dt * (5 + boost * 30)) R.emit({ x: x + (Math.random() - 0.5) * 1.4, y: 0.1, z: z + (Math.random() - 0.5) * 1.2, vy: 1.2 + Math.random() * 1.6, life: 1.2, size: 0.1, size2: 0.01, col: Math.random() < 0.3 ? [1, 1, 1, 1] : TR_GOLD, shape: Math.random() < 0.6 ? 3 : 0 });
}
function worldTreasureRevealEnd() {
  const Rv = WV.trReveal, R = FV.R;
  if (!Rv) return;
  Rv.nodes.forEach(n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
  WV.trReveal = null;
  if (WV.trChest) WV.trChest.visible = true;
  worldTreasureCamBack();
}
/* v167: Kamera für die Truhen-Show – steil von oben und aus der Richtung, in der kein Baum, Busch oder Fels
   zwischen Kamera und Grube steht; so ist die Truhe samt Animation immer zu sehen (vorher konnte die Krone eines
   Baums die Kamera schlucken). Nach der Show fliegt die Kamera in ihre alte Ansicht zurück. */
function worldTreasureCam(c) {
  const R = FV.R; if (!R || FV.fp) return;
  const cam = R.cam, D = 13, P = 1.22, H = Math.cos(P) * D;
  const obs = [];
  const addT = t => { if (Math.hypot(t.x - c.x, t.z - c.z) < 14) obs.push([t.x, t.z, 1.6 + 1.1 * Math.min(2, (t.s || t.fs || 1))]); };
  (S.farm.trees || []).forEach(addT);
  if (WV.bgChunks) for (const ch of WV.bgChunks.values()) (ch.all || ch.trees || []).forEach(addT);
  /* Gebäude/Zäune des Hofs zählen als Hindernis, Felsen und Büsche aus der Waldplanung, falls vorhanden */
  if (WV.rockObs) WV.rockObs.forEach(r => { if (Math.hypot(r.x - c.x, r.z - c.z) < 14) obs.push([r.x, r.z, (r.r || 1) + 0.6]); });
  const dseg = (ox, oz, ex, ez, px, pz) => {          /* Abstand Punkt–Strecke */
    const dx = ex - ox, dz = ez - oz, l2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((px - ox) * dx + (pz - oz) * dz) / l2));
    return Math.hypot(px - (ox + u * dx), pz - (oz + u * dz));
  };
  const cur = cam.yaw; let best = cur, bs = -1e9;
  for (let i = 0; i < 24; i++) {
    const yaw = Math.PI / 4 + (i / 24) * Math.PI * 2, ex = c.x + Math.cos(yaw) * H, ez = c.z + Math.sin(yaw) * H;
    /* je kleiner der Abstand zur Kamera-Linie im Verhältnis zur Baumbreite, desto schlechter */
    let s = 0, worst = 99;
    for (const [x, z, r] of obs) { const d = dseg(c.x, c.z, ex, ez, x, z) - r; if (d < worst) worst = d; if (d < 0) s -= 5 - d * 2; }
    s += Math.min(worst, 3);
    /* Standard-Blickrichtung bevorzugen, wenn sie frei ist */
    s -= Math.abs(Math.atan2(Math.sin(yaw - Math.PI / 4), Math.cos(yaw - Math.PI / 4))) * 0.25;
    if (s > bs) { bs = s; best = yaw; }
  }
  const save = WV.trCamSave = WV.trCamSave || { yaw: cam.yaw, pitch: cam.pitch, d: cam.dist, tx: cam.tx, tz: cam.tz };
  const d0 = Math.atan2(Math.sin(best - cam.yaw), Math.cos(best - cam.yaw));
  FV.camOv = { pitch: cam.pitch };
  WV.trCamAnim = { yaw0: cam.yaw, dy: d0, p0: cam.pitch, d0: cam.dist, tx0: cam.tx, tz0: cam.tz, t0: performance.now(), dur: 1500, tx: c.x, tz: c.z + 0.3, d: D, p: P };
  const id = (FV.focusId || 0) + 1; FV.focusId = id; FV.focusing = true;
  const step = () => {
    const A = WV.trCamAnim; if (FV.focusId !== id || !A) return;
    const k = Math.min(1, (performance.now() - A.t0) / A.dur), f = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    cam.tx = A.tx0 + (A.tx - A.tx0) * f; cam.tz = A.tz0 + (A.tz - A.tz0) * f; cam.dist = A.d0 + (A.d - A.d0) * f; cam.yaw = A.yaw0 + A.dy * f;
    FV.camOv.pitch = A.p0 + (A.p - A.p0) * f;
    clampCam();
    if (k < 1) requestAnimationFrame(step); else FV.focusing = false;
  };
  step();
}
function worldTreasureCamBack() {
  const S0 = WV.trCamSave; WV.trCamSave = null; WV.trCamAnim = null;
  const R = FV.R;
  if (!S0 || !R || FV.fp) { FV.camOv = null; return; }
  const cam = R.cam, from = { yaw: cam.yaw, tx: cam.tx, tz: cam.tz, d: cam.dist, p: FV.camOv ? FV.camOv.pitch : cam.pitch };
  const dy = Math.atan2(Math.sin(S0.yaw - from.yaw), Math.cos(S0.yaw - from.yaw));
  const id = (FV.focusId || 0) + 1; FV.focusId = id; FV.focusing = true;
  const t0 = performance.now(), dur = 1300;
  const step = () => {
    if (FV.focusId !== id) { FV.camOv = null; return; }       /* Spieler hat die Kamera selbst übernommen */
    const k = Math.min(1, (performance.now() - t0) / dur), f = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    cam.tx = from.tx + (S0.tx - from.tx) * f; cam.tz = from.tz + (S0.tz - from.tz) * f; cam.dist = from.d + (S0.d - from.d) * f; cam.yaw = from.yaw + dy * f;
    if (FV.camOv) FV.camOv.pitch = from.p + (Math.min(1, Math.max(0.8, S0.pitch)) - from.p) * f;
    clampCam();
    if (k < 1) requestAnimationFrame(step); else { FV.focusing = false; FV.camOv = null; clampCam(); }
  };
  step();
}
/* Nach dem Graben: Truhe bricht aus der Grube, kreist und springt auf – je nach Sternen größer */
function worldTreasureReveal(c, r) {
  const R = FV.R, x = c.x + 0.05, z = c.z - 0.05, st = r.stars || 1;
  worldTreasureRevealEnd();
  const nodes = [], add = (mesh, o) => { const n = fnode(mesh, o); R.nodes.push(n); nodes.push(n); return n; };
  const Rv = WV.trReveal = { t: 0, ph: 0, r, st, c, nodes, x, z, ticks: 0, cx: c.x, cz: c.z };
  Rv.body = add(fmesh("goldBody", FWM.goldChest), { x, z, y: -0.65, ry: parcelFace(), s: 1.15 });
  Rv.lid = R.addChild(Rv.body, fnode(fmesh("goldLid", FWM.goldLid), { y: 0.5, z: -0.31 }));
  Rv.lit = R.addChild(Rv.body, fnode(fmesh("lootLit", () => { const b = new FM.MB(); b.plate(0.8, 0.52, 0xfff0a0, { y0: 0.01 }); return b; }), { y: 0.495, alpha: 0.8, glow: 1, visible: false }));
  Rv.b1 = add(fmesh("trBeamB1", () => FWM.lootBeam(0.55, 0.24, 11, 0xffd25a)), { x: c.x, z: c.z, alpha: 0.0, glow: 1, shadow: false, sy: 0.02 });
  Rv.b2 = add(fmesh("trBeamB2", () => FWM.lootBeam(0.28, 0.1, 11, 0xfff6c8)), { x: c.x, z: c.z, alpha: 0.0, glow: 1, shadow: false, sy: 0.02 });
  Rv.r1 = add(fmesh("lootRing", () => FWM.lootRing(0.85, 1.0, 0xffe27a)), { x: c.x, z: c.z, alpha: 0, glow: 1, shadow: false });
  Rv.r2 = add(fmesh("lootRingW", () => FWM.lootRing(0.85, 1.0, 0xfff6c8)), { x: c.x, z: c.z, alpha: 0, glow: 1, shadow: false });
  Rv.r3 = add(fmesh("lootRingB", () => FWM.lootRing(0.85, 1.0, 0x7ad6ff)), { x: c.x, z: c.z, alpha: 0, glow: 1, shadow: false });
  worldTreasureCam(c);
  R.burst({ x: c.x, y: 0.1, z: c.z, n: 22, speed: 2.2, flat: true, up: 0.7, life: 0.9, size: 0.3, size2: 0.8, col: [[0.72, 0.58, 0.4, 0.55]], g: -0.5, drag: 1.5 });
  sfx("thud");
}
function stepTreasureReveal(Rv, dt, time) {
  Rv.t += dt;
  const t = Rv.t, R = FV.R, x = Rv.x, z = Rv.z, st = Rv.st, col = TR_COL[st - 1], B = Rv.body, cx = Rv.cx, cz = Rv.cz;
  const TA = 1.4, TB = 0.9, TC = TA + TB;
  if (!farmTreasureCur() && t < TC) { worldTreasureRevealEnd(); return; }
  if (t < TC) {
    if (t < TA) {
      /* A: die Truhe bricht rumpelnd aus der Erde, Dreck fliegt, die Säule wächst aus dem Loch */
      const u = t / TA, e = 1 - Math.pow(1 - u, 3);
      B.y = -0.65 + e * 1.0; B.rz = Math.sin(t * 52) * 0.07 * (1 - u * 0.6); B.rx = Math.sin(t * 41 + 1) * 0.05 * (1 - u * 0.6);
      B.x = x + Math.sin(t * 63) * 0.03 * (1 - u); B.z = z + Math.cos(t * 57) * 0.03 * (1 - u);
      Rv.b1.sy = Rv.b2.sy = Math.max(0.02, e); Rv.b1.alpha = 0.34 * e; Rv.b2.alpha = 0.5 * e;
      const n = Math.random() < dt * 70 ? 1 : 0;
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, d = 0.3 + Math.random() * 0.5; R.emit({ x: cx + Math.cos(a) * d, y: 0.1, z: cz + Math.sin(a) * d, vx: Math.cos(a) * 1.2, vz: Math.sin(a) * 1.2, vy: 2.5 + Math.random() * 3, g: -9, life: 1.0, size: 0.08 + Math.random() * 0.07, size2: 0.05, col: TR_DIRT[(Math.random() * 3) | 0], shape: 1, fade: false }); }
      while (Rv.ticks < 4 && t >= Rv.ticks * 0.33) { sfx("dig"); Rv.ticks++; }
      [Rv.r1, Rv.r2].forEach((r, i) => { const w = (t * 0.9 + i * 0.5) % 1; r.sx = r.sz = 0.6 + w * 1.8; r.alpha = 0.55 * (1 - w) * Math.min(1, w * 6); });
    } else {
      /* B: Aufladen – die Truhe schwebt, dreht sich immer schneller (drei Umdrehungen), Funken strömen hinein */
      const u = (t - TA) / TB, a = u * u;
      if (Rv.ticks < 4) Rv.ticks = 4;
      B.y = 0.35 + u * 0.42 + Math.sin(t * 14) * 0.02 * u; B.rz = Math.sin(t * 46) * 0.05 * a; B.rx = Math.sin(t * 37) * 0.04 * a; B.x = x; B.z = z;
      B.ry = parcelFace() + Math.PI * 6 * u * u;
      B.glow = 0.9 * u; B.sx = B.sy = B.sz = 1.15 * (1 + 0.07 * u);
      Rv.b1.alpha = 0.34 + u * 0.4; Rv.b2.alpha = 0.5 + u * 0.4; Rv.b1.sx = Rv.b1.sz = 1 + u * 0.8; Rv.b2.sx = Rv.b2.sz = 1 + u * 0.5;
      [Rv.r1, Rv.r2, Rv.r3].forEach((r, i) => { const w = (t * (1.2 + u * 2.4) + i * 0.33) % 1; r.sx = r.sz = 0.6 + w * 2.0 * (1 - u * 0.3); r.alpha = (0.45 + u * 0.3) * (1 - w) * Math.min(1, w * 6); });
      const n = Math.random() < dt * (30 + 110 * u) ? 1 : 0;
      for (let i = 0; i < n; i++) { const an = Math.random() * 6.28, d = 1.6 + Math.random() * 0.8; R.emit({ x: cx + Math.cos(an) * d, y: 0.2 + Math.random() * 1.3, z: cz + Math.sin(an) * d, vx: -Math.cos(an) * 3, vz: -Math.sin(an) * 3, vy: 0.4, life: 0.5, size: 0.14, size2: 0.02, col: Math.random() < 0.3 ? [1, 1, 1, 1] : col, shape: 3 }); }
      const tk = [0, 0.2, 0.36, 0.5, 0.62, 0.72, 0.8, 0.87]; while (Rv.ticks - 4 < tk.length && Rv.ticks >= 4 && u * TB >= tk[Rv.ticks - 4]) { sfx("pop"); Rv.ticks++; }
    }
    return;
  }
  if (Rv.ph === 0) {
    /* C: Deckel springt auf – Lichtstoß, Fontäne, Schockwellen */
    Rv.ph = 1; Rv.tb = t;
    B.ry = parcelFace(); B.rz = B.rx = 0; B.glow = 1; Rv.lit.visible = true;
    sfx("thud"); sfx("level"); setTimeout(() => sfx("pearl"), 260); [0, 160, 320].forEach(d => setTimeout(() => sfx("coin"), 420 + d));
    if (st === 3) { setTimeout(() => sfx("level"), 700); setTimeout(() => sfx("pearl"), 950); }
    try { if (navigator.vibrate) navigator.vibrate(st > 1 ? [40, 30, 90, 30, 60] : 30); } catch (e) { /* kein Rütteln */ }
    R.burst({ x, y: 0.9, z, n: 40 + st * 14, speed: 4.2, up: 6, life: 1.6, size: 0.17, size2: 0.02, col: [col, TR_GOLD, [1, 1, 1, 1]], shape: 3, g: -7, drag: 0.4 });
    R.burst({ x, y: 0.9, z, n: 36, speed: 3.6, up: 5.5, life: 1.8, size: 0.1, size2: 0.06, col: [TR_GOLD, [1, 0.74, 0.18, 1]], shape: 0, g: -9, drag: 0.3 });
    R.burst({ x, y: 0.9, z, n: 22 + st * 6, speed: 3.2, up: 5, life: 1.8, size: 0.2, size2: 0.05, col: TR_GEM, shape: 3, g: -6, drag: 0.5 });
    R.burst({ x, y: 0.15, z, n: 18, speed: 2.6, flat: true, up: 0.5, life: 1.0, size: 0.3, size2: 0.9, col: [[1, 0.95, 0.75, 0.55]], g: -0.5, drag: 1.4 });
    const px = FV.R.project(cx, 0.9, cz) || [R.w / 2, R.h / 2];
    const r = Rv.r, chips = ["💶 " + eur(r.m), "🍀 " + r.clover, "⭐ " + r.xp + " EP"];
    worldLootShow(px[0], px[1], { sub: "Schatzkiste · " + "★".repeat(st) + "☆".repeat(3 - st), title: (st > 1 ? "✨ " : "") + TR_TXT[st - 1] + (st > 1 ? " ✨" : ""), chips, r: st === 3 ? 3 : st, css: TR_CSS[st - 1] });
    let d = 500;
    setTimeout(() => { if (FV.on) { coinFly(px[0], px[1], r.m); sfx("coin"); } }, d); d += 420;
    setTimeout(() => { if (FV.on) farmCloverFlyAt(px[0], px[1], r.clover); }, d); d += 300;
    setTimeout(() => { if (FV.on) xpFly(px[0], px[1] - 10, r.xp, 0); }, d);
  }
  const u = t - Rv.tb;
  const kk = Math.min(1, u / 0.5), e = 1 + 2.70158 * Math.pow(kk - 1, 3) + 1.70158 * Math.pow(kk - 1, 2);
  Rv.lid.rx = -2.2 * e; Rv.lid.glow = 0.3;
  /* v98: Truhe setzt auf, bleibt offen und ohne Leuchten kurz stehen, zur Kamera gewandt – dann löst sie sich auf, die offene Truhe in der Grube bleibt */
  const TSd = 2.3 + 4.5, dn = Math.min(1, u / 0.9);
  B.y = 0.77 - dn * 0.65 + (dn >= 1 ? 0 : Math.sin(u * 5) * 0.03 * (1 - dn));
  if (u < TSd) B.ry += angTo(B.ry, parcelFace()) * Math.min(1, dt * 5);
  if (dn >= 1 && !Rv.landed) { Rv.landed = 1; sfx("thud"); R.burst({ x, y: 0.1, z, n: 14, speed: 2.2, flat: true, up: 0.6, life: 0.8, size: 0.25, size2: 0.7, col: [[0.72, 0.58, 0.4, 0.5]], g: -1, drag: 2.2 }); }
  if (u > 2.5) Rv.lit.visible = false;
  B.glow = Math.max(0.14, 0.9 * (1 - u / 1.8));           /* v134: offene Kiste bleibt auch nachts gut sichtbar */ Rv.lit.alpha = 0.85 * Math.max(0, 1 - u / 2.4) + Math.sin(time * 18) * 0.05;
  Rv.b1.alpha = 0.55 * Math.max(0, 1 - u / 2.6); Rv.b2.alpha = 0.8 * Math.max(0, 1 - u / 2.2);
  Rv.b1.sx = Rv.b1.sz = 1.8 + u * 0.7; Rv.b2.sx = Rv.b2.sz = 1.5 + u * 0.4;
  const rw = Math.min(1, u / 0.9); Rv.r1.sx = Rv.r1.sz = 0.8 + rw * 6.5; Rv.r1.alpha = 0.9 * (1 - rw);
  const rw2 = Math.max(0, Math.min(1, (u - 0.2) / 0.9)); Rv.r2.sx = Rv.r2.sz = 0.8 + rw2 * 5; Rv.r2.alpha = 0.7 * (1 - rw2) * (u > 0.2 ? 1 : 0);
  const rw3 = Math.max(0, Math.min(1, (u - 0.4) / 0.9)); Rv.r3.sx = Rv.r3.sz = 0.8 + rw3 * 4; Rv.r3.alpha = 0.6 * (1 - rw3) * (u > 0.4 && st > 1 ? 1 : 0);
  if (u < 1.9) {
    /* Fontäne aus Münzen, Sternen und Edelsteinen */
    const n = Math.random() < dt * (55 + st * 25) ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const gem = Math.random() < 0.18;
      R.emit({ x: x + (Math.random() - 0.5) * 0.5, y: 0.8, z: z + (Math.random() - 0.5) * 0.35, vx: (Math.random() - 0.5) * 2.6, vz: (Math.random() - 0.5) * 2.6, vy: 4.5 + Math.random() * 4, g: -9, drag: 0.3, life: 1.4, size: gem ? 0.17 : 0.1 + Math.random() * 0.06, size2: 0.03, col: gem ? TR_GEM[(Math.random() * 4) | 0] : Math.random() < 0.6 ? TR_GOLD : col, shape: gem ? 3 : Math.random() < 0.5 ? 3 : 0 });
    }
  }
  if (st >= 2 && u < 2.4) {
    /* Goldregen von oben */
    const n = Math.random() < dt * (st === 3 ? 80 : 36) ? 1 : 0;
    for (let i = 0; i < n; i++) R.emit({ x: cx + (Math.random() - 0.5) * 5, y: 5 + Math.random() * 2.5, z: cz + (Math.random() - 0.5) * 5, vx: (Math.random() - 0.5) * 0.4, vy: -(1.5 + Math.random() * 2), g: -1.5, life: 2.2, size: 0.09 + Math.random() * 0.06, size2: 0.05, col: st === 3 && Math.random() < 0.35 ? TR_GEM[(Math.random() * 4) | 0] : TR_GOLD, shape: Math.random() < 0.5 ? 3 : 0 });
  }
  if (st === 3 && !Rv.b2nd && u > 0.6) {
    Rv.b2nd = 1; sfx("collect");
    R.burst({ x, y: 1.0, z, n: 50, speed: 4.8, up: 5.5, life: 1.7, size: 0.22, size2: 0.03, col: TR_GEM, shape: 3, g: -5, drag: 0.5 });
    R.burst({ x, y: 1.0, z, n: 40, speed: 3.4, up: 7.5, life: 1.8, size: 0.14, size2: 0.02, col: [TR_GOLD, [1, 1, 1, 1]], shape: 3, g: -6, drag: 0.4 });
  }
  if (u > TSd) {
    /* Truhe löst sich in Funken auf – die offene Truhe in der Grube bleibt */
    const k = Math.min(1, (u - TSd) / 0.5);
    B.sx = B.sz = 1.15 * (1 - k); B.sy = 1.15 * (1 - k * 0.6); B.y = 0.12 + k * 0.6;
    if (!Rv.gone) { Rv.gone = 1; sfx("pop"); R.burst({ x, y: 0.5, z, n: 26, speed: 2.2, up: 3, life: 1, size: 0.13, size2: 0.01, col: [col, [1, 1, 1, 1]], shape: 3, g: -3, drag: 1 }); if (WV.trChest) WV.trChest.visible = true; }
  }
  if (u > TSd + 0.8) { worldTreasureRevealEnd(); renderFarmUI(); }
}
/* Döring GmbH: Montagewagen und Herr Döring vor dem Sägewerk */
function worldSyncPV() {
  const v = typeof pvVisit === "function" ? pvVisit() : null, key = v ? String(v.t0) : "", R = FV.R;
  if (key === WV.pvKey) return;
  const had = WV.pvKey, P = S.farm && S.farm.pv, rm = n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); };
  WV.pvKey = key;
  /* Dach voll: Döring geht zum Wagen, steigt ein und fährt vom Hof */
  if (!v && had && WV.pvNodes.length === 2 && P && P.leftAt != null && S.time - P.leftAt < 120 && typeof startDrive === "function") {
    const [van, man] = WV.pvNodes;
    WV.pvNodes = []; WV.pvMan = null;
    startDrive(man, [[man.x, man.z], [van.x + 0.8, van.z + 0.5]], () => rm(man));
    WV.pvLeave = setTimeout(() => {
      WV.pvLeave = null;
      startDrive(van, [[van.x, van.z], [-41, -33]].concat(SAW_ROAD), () => rm(van));
      FV.drives.forEach(d => { if (d.node === van) d.sp = 7; });
    }, 1300);
    return;
  }
  WV.pvNodes.forEach(rm);
  WV.pvNodes = [];
  if (!v) return;
  const add = (mesh, o) => { const n = fnode(mesh, o); R.nodes.push(n); WV.pvNodes.push(n); return n; };
  const at = pvAt();
  add(fmesh("solarVan", FWM.solarVan), { x: at[0], z: at[1], ry: -0.55, s: 1.35 });
  WV.pvMan = add(fmesh("pvMan", () => FWM.person({ shirt: 0xf2c230, pants: 0x2f4f7a, hat: "helm", seed: 21 })), { x: at[0] + 1.3, z: at[1] + 1.2, s: 1.35, ry: 0.7 });
}
/* v54: Dörings Wagen parkt vor der Halle – steht dort inzwischen etwas, nimmt er den nächsten freien Platz im Hof */
function pvAt() {
  const free = (x, z) => S.farm.objs.every(o => { const [cx, cz] = farmCenter(o), [w, d] = farmSize(o); return Math.abs(cx - x) > w / 2 + 1.6 || Math.abs(cz - z) > d / 2 + 2.2; });
  if (free(FPV.at[0], FPV.at[1])) return FPV.at;
  let best = null, bd = 1e9;
  for (let z = -51; z <= -33; z += 1) for (let x = -51; x <= -31; x += 1) {
    if (x > -44.5 && x < -37.5 && z > -34.5) continue;                      /* Toreinfahrt frei lassen */
    const d = Math.hypot(x - FPV.at[0], z - FPV.at[1]);
    if (d < bd && free(x, z)) { bd = d; best = [x, z]; }
  }
  return best || FPV.at;
}
function farmPvView(type) {
  if (!FV.on) return;
  if (type === "start") toast("☀️ Die Döring GmbH steht 48 Stunden am Sägewerk – Solarmodule fürs Hallendach!", "ok");
  if (type === "gone" && !pvFull()) toast("☀️ Die Döring GmbH ist weitergefahren – in einer Woche kommt sie wieder.", "");
  farmSyncScene();
}
/* Angebot: Module kaufen, sie landen sofort auf dem Hallendach */
function openPV() {
  FV.sheetFn = openPV;
  const P = pvS(), v = pvVisit(), left = FPV.max - P.n, full = pvFull();
  const hall = farmObj1("sw_halle");
  if (hall && !FV.sheet) { const [x, z] = farmCenter(hall); farmFocusXZ(x + 3.5, z + 5.5, 30, 700); }
  const cells = Array.from({ length: FPV.max }, (_, i) => `<i class="${i < P.n ? "on" : ""}"></i>`).join("");
  const opts = [1, 2, 4, left].filter((k, i, a) => k >= 1 && k <= left && a.indexOf(k) === i);
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">☀️</span>${esc(FPV.firm)}<small>Photovoltaik fürs Sägewerk · ${v ? "noch " + fdur(Math.max(1, v.until - S.time)) + " da" : full ? "Dach ist voll" : "kommt in einer Woche wieder"}</small></div>
    <div class="fpv"><div class="fpv-roof">${cells}</div>
      <div><b>${P.n} / ${FPV.max} Module</b><small>${full ? "Volles Dach: tagsüber laufen die Maschinen ganz von selbst mit Sonnenstrom, der Kessel heizt nur nachts." : `Jedes Modul bringt tagsüber ${FPV.kwh} kWh pro Stunde. Ist das Dach voll, braucht die Säge keinen Kessel mehr.`}</small></div></div>
    <div class="fletter mini"><p>„Moin! Ihr Hallendach liegt ideal zur Sonne. Wir montieren die Module ordentlich in Reih und Glied – ${FPV.price} € pro Stück, alles inklusive.“ – ${esc(FPV.who)}</p></div>
    ${v && left ? `<div class="fs-row fpv-buy">${opts.map(k => `<button class="btn${k === 1 ? "" : " ghost"}" data-pv="${k}">${k === left && k > 1 ? "☀️ Dach voll machen" : k + (k === 1 ? " Modul" : " Module")}<small>${eur(k * FPV.price)}</small></button>`).join("")}</div>` : ""}`, "pv");
  $$("#farmSheetIn [data-pv]").forEach(b => b.onclick = () => {
    const k = pvBuy(+b.dataset.pv);
    if (!k) { sfx("bad"); return; }
    sfx("build"); save(); farmSyncScene(); renderFarmUI();
    if (hall) { puff(hall); const [x, y] = objScreen(hall, 4.2); floatText(x, y, "☀️ +" + k + (k === 1 ? " Modul" : " Module"), "gold"); }
    if (pvFull()) {
      toast("☀️ Das Dach ist voll! Tagsüber laufen die Maschinen jetzt mit Sonnenstrom – Döring packt ein und fährt los.", "ok"); sfx("level");
      /* Kamera bleibt auf dem Wagen, bis er losgefahren ist */
      closeFarmSheet(); { const at = pvAt(); farmFocusXZ(at[0] + 1, at[1] + 4, 32, 600); }
      return;
    }
    openPV();
  });
}
/* --------------------- v56: Holzstapel im Sägewerk ------------------------
   Krügers alte Stämme liegen auf dem Hof – antippen, dann verkaufen oder ins
   Holzlager (erbe.js: farmPileTake). Verkaufte Stapel verschwinden. */
function worldSyncPiles() {
  const R = FV.R, sold = S.farm.piles || {};
  WV.piles = WV.piles || new Map();
  for (const [i, n] of WV.piles) if (sold[i] || n.R !== R) { const k = R.nodes.indexOf(n); if (k >= 0) R.nodes.splice(k, 1); WV.piles.delete(i); }
  FWORLD.piles.forEach(([x, z, ry, n, sp], i) => {
    if (sold[i] || WV.piles.has(i)) return;
    const node = fnode(fmesh("pile:" + n + ":" + sp, () => FWM.logPile(n, sp)), { x, z, ry });
    node.R = R;
    R.nodes.push(node);
    WV.piles.set(i, node);
  });
}
function pickPile(x, y) {
  const R = FV.R, r = R.ray(x, y);
  let best = null, bt = 1e9;
  FWORLD.piles.forEach((p, i) => {
    if (!farmPile(i)) return;
    const T = pileTiles(p), lo = [T[0] - FG / 2, 0, T[2] - FG / 2], hi = [T[1] - FG / 2, 0.85, T[3] - FG / 2];
    const d = R.hitBox(r, lo, hi);
    if (d != null && d < bt) { bt = d; best = i; }
  });
  return best != null ? { i: best, d: bt } : null;
}
function openPile(i) {
  const P = farmPile(i);
  if (!P) return closeFarmSheet();
  FV.sheetFn = () => openPile(i);
  const it = FITEMS[P.id], room = farmRoom(P.id), m = farmPileValue(P);
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🪵</span>Holzstapel<small>${P.n} Stämme ${esc(it.n)} · von Krüger liegen gelassen</small></div>
    <div class="fpile">${icHTML(P.id)}<div><b>${fqty(P.id, P.n)}</b><small>Verkaufen bringt gleich Geld, im Holzlager wird daraus Bauholz. Danach ist der Platz frei.</small></div></div>
    <div class="fs-row">
      <button class="btn" id="fpSell">💰 Verkaufen<small>${eur(m)}</small></button>
      <button class="btn ghost${room < P.n ? " disabled" : ""}" id="fpStore">🏚️ Ins Holzlager<small>${room < P.n ? "nur noch " + Math.max(0, room) + " Platz" : "Platz ist da"}</small></button>
    </div>`, "pile");
  const done = (r) => {
    const n = WV.piles && WV.piles.get(i), p = n ? FV.R.project(n.x, 0.6, n.z) : null;
    if (p) {
      if (r.m) { floatText(p[0], p[1] - 20, "+" + eur(r.m), "gold"); sfx("coin"); }
      else { flyItem(P.id, p[0], p[1], storeBtn(), 0, r.got); sfx("collect"); }
      FV.R.burst({ x: n.x, y: 0.4, z: n.z, n: 18, col: [[0.75, 0.6, 0.4, 1], [0.9, 0.8, 0.6, 1]], speed: 1.8, up: 1.6, size: 0.1, shape: 1 });
    }
    closeFarmSheet(); worldSyncPiles(); renderFarmUI(); save();
  };
  $("#fpSell").onclick = () => { const r = farmPileTake(i, true); if (r) done(r); };
  $("#fpStore").onclick = () => {
    const r = farmPileTake(i, false);
    if (!r) return;
    if (r.full) { sfx("bad"); toast("Im Holzlager ist nicht genug Platz – erst etwas verkaufen oder verarbeiten.", "warn"); return; }
    done(r);
  };
}
/* Haustiere laufen die Hofwege ab.
   v71: Gibt es Dekowege, spazieren sie darauf – Ziege Tim und Katze Minka nur auf den
   Dekowegen, Hofhund Bello auch auf den festen Hofwegen. Sie folgen dem Weg Feld für Feld
   (an Abzweigen zufällig), bleiben mal stehen und wechseln ab und zu auf ein anderes Wegstück.
   Ohne Dekowege bleibt es bei der festen Runde (PET_WAY). Fahrzeuge nutzen die Dekowege nie. */
const PET_WAY = [[5, 10], [5, 4], [5, -2], [5, -9.5], [-1, -9.5], [-7, -9.5], [-12, -9.5]];
const PET_OFF = { hund: -0.18, katze: 0.2, ziege: 0 };
function petTiles(k) {
  const m = typeof farmWegMap === "function" ? farmWegMap() : new Map();
  if (!WV.petG || WV.petG.m !== m) WV.petG = { m, t: {} };
  const C = WV.petG.t;
  if (!(k in C)) {
    const s = new Set(m.keys());
    if (k === "hund" && FSITE.kind === "hof") (FSITE.path || FPATH).forEach(i => { if (i >= 0) { const t = fgXZ(i); s.add(t[0] + "," + t[1]); } });
    C[k] = m.size >= 2 && s.size >= 3 ? s : null;
    /* zusammenhängende Wegstücke – gewechselt wird nur zu einem anderen Stück */
    if (C[k]) {
      const comp = new Map(); let id = 0;
      s.forEach(key => {
        if (comp.has(key)) return;
        const q = [key]; comp.set(key, ++id);
        while (q.length) { const [x, z] = q.pop().split(",").map(Number); [[x, z - 1], [x + 1, z], [x, z + 1], [x - 1, z]].forEach(n => { const nk = n[0] + "," + n[1]; if (s.has(nk) && !comp.has(nk)) { comp.set(nk, id); q.push(nk); } }); }
      });
      C[k].comp = comp; C[k].parts = id;
    }
  }
  return C[k];
}
const petXZ = key => { const t = key.split(",").map(Number); return [t[0] - FG / 2 + 0.5, t[1] - FG / 2 + 0.5]; };
function petNext(k, p, G) {
  if (!G) {
    p.tk = null;
    p.wi = clamp((p.wi == null ? 0 : p.wi) + (Math.random() < 0.5 ? -1 : 1), 0, PET_WAY.length - 1);
    p.tgt = [PET_WAY[p.wi][0] + PET_OFF[k], PET_WAY[p.wi][1]];
    return;
  }
  let next = null;
  if (!p.tk || !G.has(p.tk)) {
    /* erst einmal zum nächsten Wegfeld */
    let bd = 1e9;
    G.forEach(key => { const q = petXZ(key), d = Math.hypot(q[0] - p.x, q[1] - p.z); if (d < bd) { bd = d; next = key; } });
  } else if (G.parts > 1 && Math.random() < 0.04) {
    /* mal auf ein anderes Wegstück */
    const here = G.comp.get(p.tk), all = [...G].filter(q => G.comp.get(q) !== here);
    next = all[Math.floor(Math.random() * all.length)];
  } else {
    const [x, z] = p.tk.split(",").map(Number);
    const nb = [[x, z - 1], [x + 1, z], [x, z + 1], [x - 1, z]].map(q => q[0] + "," + q[1]).filter(q => G.has(q));
    const fw = nb.filter(q => q !== p.prev);
    /* am liebsten geradeaus weiter */
    const st = p.prev ? (() => { const a = p.prev.split(",").map(Number); return (2 * x - a[0]) + "," + (2 * z - a[1]); })() : null;
    next = st && fw.includes(st) && Math.random() < 0.65 ? st : (fw.length ? fw : nb)[Math.floor(Math.random() * (fw.length || nb.length))] || p.tk;
  }
  p.prev = p.tk; p.tk = next;
  const q = petXZ(next);
  p.tgt = [q[0] + PET_OFF[k] * (Math.random() < 0.5 ? 1 : -0.6), q[1] + (Math.random() - 0.5) * 0.25];
}
function worldSyncPets() {
  const R = FV.R, own = {};
  FCOSMETIC.filter(c => c.pet && farmCos(c.id)).forEach(c => { own[c.pet] = 1; });
  for (const [k, p] of WV.pets) if (!own[k]) { const i = R.nodes.indexOf(p.node); if (i >= 0) R.nodes.splice(i, 1); WV.pets.delete(k); }
  Object.keys(own).forEach((k, i) => {
    if (WV.pets.has(k)) return;
    const fn = k === "hund" ? FWM.dog : k === "katze" ? FWM.cat : FWM.goat;
    const j = i * 2 % PET_WAY.length, node = fnode(fmesh("pet:" + k, fn), { x: PET_WAY[j][0], z: PET_WAY[j][1], s: 1.4 });
    R.nodes.push(node);
    WV.pets.set(k, { node, wi: j, tgt: null, tk: null, prev: null, x: PET_WAY[j][0], z: PET_WAY[j][1], wait: 1 + i, sp: k === "hund" ? 1.8 : k === "katze" ? 1.1 : 0.8 });
  });
}
function stepPets(dt, time) {
  for (const [k, p] of WV.pets) {
    const G = petTiles(k);
    if (p.wait > 0) { p.wait -= dt; p.node.y = 0; if (p.wait <= 0) petNext(k, p, G); continue; }
    if (!p.tgt || (G && p.tk && !G.has(p.tk)) || (!G && p.tk)) petNext(k, p, G);
    const t = p.tgt, dx = t[0] - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz), s = p.sp * dt;
    if (d < s) {
      p.x = t[0]; p.z = t[1]; p.tgt = null;
      /* stehen bleiben: Tim grast, Minka setzt sich, Bello schnuppert kurz */
      const r = G ? (k === "ziege" ? 0.2 : k === "katze" ? 0.18 : 0.06) : 0.3;
      if (Math.random() < r) p.wait = (G ? 2.5 : 4) + Math.random() * 6;
      continue;
    }
    p.x += dx / d * s; p.z += dz / d * s;
    p.node.x = p.x; p.node.z = p.z; p.node.ry = Math.atan2(dx, dz);
    p.node.y = Math.abs(Math.sin(time * 10 + p.sp)) * 0.03;
  }
}
/* Mitarbeiter: Figuren, Laufen und Arbeiten siehe team.js */

/* ------------------------------ Ereignisse -------------------------------- */
function worldEvKey() { const c = S.farm.ev && S.farm.ev.cur; return c ? c.k + ":" + c.t0 + ":" + (c.data.done ? 1 : 0) + ":" + (c.data.spots ? c.data.spots.filter(x => x.done).length : "") : ""; }
function worldSyncEvents() {
  const key = worldEvKey(), R = FV.R;
  if (key === WV.evKey) return;
  /* v73: Beim Öffnen der Lieferkiste bleiben die Knoten stehen, bis die Animation fertig ist */
  if (WV.parcelOpen) { WV.evKey = key; return; }
  WV.evKey = key;
  WV.evNodes.forEach(n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
  WV.evNodes = []; WV.parcel = null;
  const c = S.farm.ev && S.farm.ev.cur;
  if (!c || c.data.done) return;
  const add = (mesh, o) => { const n = fnode(mesh, o); R.nodes.push(n); WV.evNodes.push(n); return n; };
  if (c.k === "haendler") {
    /* bunter Marktwagen mit Vordach und Ware, davor der Händler, der winkt */
    /* Theke zur Kamera (Süden), der Händler steht davor auf dem Seitenstreifen */
    add(fmesh("traderCart", FWM.traderCart), { x: 10.2, z: 17.5, ry: Math.PI / 2, s: 1.15 });
    WV.trader = add(fmesh("trader", () => FWM.person({ shirt: 0x8a3ac8, hat: "hut", seed: 7 })), { x: 8.6, z: 19.2, s: 1.35, ry: 0.6 });
  } else WV.trader = null;
  if (c.k === "nachbar") add(fmesh("npc:saege", () => FWM.person(NPC_LOOK.saege)), { x: -32.5, z: -31.4, ry: 0.4, s: 1.35 });
  if (c.k === "hirsch") add(fmesh("stag", () => FWM.deer(true)), { x: c.data.x, z: c.data.z, s: 1.25, glow: 0.35 });
  if (c.k === "reh") add(fmesh("wild:deer", () => FWM.deer(false)), { x: c.data.x, z: c.data.z, s: 1.0, ry: 1 });
  /* v73: Lieferkiste vorm Hoftor – kommt erst, wenn der Lieferwagen sie abgestellt hat */
  if (c.k === "lieferung" && !(WV.parcelIntro && WV.parcelIntro.t0 === c.t0 && !WV.parcelIntro.landed)) worldParcelNodes(c, add);
}
/* Wo sitzt das Ereignis? Für Blase und Kamera */
function worldEvSpots() {
  const c = S.farm.ev && S.farm.ev.cur;
  if (!c || c.data.done || S.time >= c.until) return [];
  const D = FEVENTS[c.k];
  switch (c.k) {
    case "haendler": return [{ x: 9.4, y: 3.1, z: 18.4, ic: "🧑‍💼", act: "haendler" }];
    case "nachbar": return [{ x: -32.5, y: 2.3, z: -31.4, ic: "👴💬", act: "nachbar" }];
    case "hirsch": return [{ x: c.data.x, y: 2.4, z: c.data.z, ic: "🦌✨", act: "hirsch", area: "wald" }];
    case "reh": return [{ x: c.data.x, y: 1.9, z: c.data.z, ic: "🦌", act: "reh" }];
    case "lieferung": return WV.parcelOpen || (WV.parcelIntro && !WV.parcelIntro.landed) ? [] : [{ x: c.data.x, y: 1.5, z: c.data.z, ic: "📦", act: "lieferung" }];
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
    if (r.item) flyItem(r.item, x, y, storeBtn(), 250, r.n || 1);
    sfx("collect"); save(); farmSyncScene(); renderFarmUI();
  };
  switch (s.act) {
    case "haendler": openTrader(); break;
    case "nachbar": openNeighbor(); break;
    case "lieferung": worldParcelOpen(); break;
    case "hirsch": case "reh": {
      const r = farmEvReward(s.act);
      if (r) { floatText(p[0], p[1] - 20, s.act === "hirsch" ? "Ein Glücksbringer!" : s.act === "reh" ? "Wie friedlich …" : "Ein Paket für dich!", "gold"); reward(r, p[0], p[1]); }
      break;
    }
    case "schwarm": if (typeof openFishingAt === "function") openFishingAt(c.data.g); break;
    case "defekt": {
      const h = farmObj1("sw_halle");
      MG.open("gears", { quick: true, title: "Die Säge klemmt!" }, res => { if (res && res.ok && h) { farmMachFix(h); farmXP(10); sfx("collect"); floatText(p[0], p[1], "Läuft wieder!", "gold"); xpFly(p[0], p[1], 10); save(); farmSyncScene(); } });
      break;
    }
  }
}

/* ------------------------- v73: Lieferkiste vorm Hoftor -------------------------
   Ein Lieferwagen kommt die Straße entlang und hält am Tor, die Kiste hüpft vom Wagen auf den Weg vorm Hoftor und
   landet mit Staubwolke. Dann: Lichtsäule, pulsierende Bodenringe, Funkeln und ab und zu ein Hüpfer. Antippen:
   Kamera fährt ran, die Kiste rüttelt sich hoch, der Deckel springt auf, Lichtstoß in der Farbe der Seltenheit
   (Gut · Selten · Episch · Legendär), die Belohnungen fliegen heraus, Funkenregen – dann löst sich die Kiste auf. */
const PARCEL_COL = [[1, 0.9, 0.5, 1], [0.4, 0.82, 1, 1], [0.8, 0.5, 1, 1], [1, 0.66, 0.15, 1]];
const PARCEL_CSS = ["#f6d24a", "#5cc8ff", "#c48aff", "#ffae2e"];
const PARCEL_TXT = ["Gut gepackt!", "Selten!", "Episch!", "Legendär!"];
/* v97: Vorderseite (Schloss, +z) zeigt zur Kamera: Auge liegt bei (cos yaw, sin yaw), +z gedreht um ry zeigt nach (sin ry, cos ry) */
const parcelFace = () => Math.PI / 2 - (FV.R && FV.R.cam ? FV.R.cam.yaw : Math.PI / 4);
function worldParcelNodes(c, add) {
  const R = FV.R, x = c.data.x, z = c.data.z;
  const P = WV.parcel = { x, z, t0: c.t0 };
  P.body = add(fmesh("lootBody", FWM.lootCrate), { x, z, ry: parcelFace(), s: 1.25 });
  P.lid = R.addChild(P.body, fnode(fmesh("lootLid", FWM.lootLid), { y: 0.5, z: -0.31 }));
  P.lit = R.addChild(P.body, fnode(fmesh("lootLit", () => { const b = new FM.MB(); b.plate(0.8, 0.52, 0xfff0a0, { y0: 0.01 }); return b; }), { y: 0.495, alpha: 0.8, glow: 1, visible: false }));
  P.b1 = add(fmesh("lootBeam1", () => FWM.lootBeam(0.5, 0.22, 8, 0xffd25a)), { x, z, alpha: 0, glow: 1, shadow: false });
  P.b2 = add(fmesh("lootBeam2", () => FWM.lootBeam(0.26, 0.1, 8, 0xfff6c8)), { x, z, alpha: 0, glow: 1, shadow: false });
  P.r1 = add(fmesh("lootRing", () => FWM.lootRing(0.85, 1.0, 0xffe27a)), { x, z, alpha: 0, glow: 1, shadow: false });
  P.r2 = add(fmesh("lootRing", () => FWM.lootRing(0.85, 1.0, 0xffe27a)), { x, z, alpha: 0, glow: 1, shadow: false });
}
/* Lieferwagen kommt von Osten die Straße entlang, hält vorm Tor, wirft die Kiste ab und fährt nach Westen weiter */
function worldParcelIntroEnd() {
  const I = WV.parcelIntro, R = FV.R;
  if (!I) return;
  [I.van, I.fly].forEach(n => { if (!n) return; const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); FV.drives = FV.drives.filter(d => d.node !== n); });
  WV.parcelIntro = null;
}
function worldParcelIntro(c) {
  const R = FV.R;
  if (!R) return;
  worldParcelIntroEnd();
  const I = WV.parcelIntro = { t0: c.t0, ph: 0, t: 0, landed: false };
  const van = I.van = fnode(fmesh("lieferwagen", () => FM.van(0xf4c542, 0xd8332b)), { x: 40, y: 0, z: 17.9, s: 1.3, ry: -Math.PI / 2 });
  R.nodes.push(van);
  startDrive(van, [[40, 17.9], [8.4, 17.9]], () => { I.ph = 1; I.t = 0; sfx("clunk"); });
  FV.drives.forEach(d => { if (d.node === van) d.sp = 10; });
  sfx("horn");
}
function stepParcelIntro(I, dt) {
  const R = FV.R, c = S.farm.ev && S.farm.ev.cur;
  if (!c || c.k !== "lieferung" || c.t0 !== I.t0 || c.data.done) { worldParcelIntroEnd(); return; }
  if (I.ph === 0) return;
  I.t += dt;
  const x1 = c.data.x, z1 = c.data.z, v = I.van;
  if (I.ph === 1) {
    /* Kiste hüpft vom Wagen (Heck zeigt nach Osten) in hohem Bogen auf den Weg vorm Tor */
    if (!I.fly && I.t >= 0.35) I.fly = (R.nodes.push(fnode(fmesh("lootBody", FWM.lootCrate), { x: v.x + 1.3, y: 0.9, z: v.z, s: 1.25, shadow: true })), R.nodes[R.nodes.length - 1]);
    if (I.fly) {
      const u = Math.min(1, (I.t - 0.35) / 0.95), e = u * u * (3 - 2 * u), sx = v.x + 1.3, sz = v.z;
      I.fly.x = sx + (x1 - sx) * u; I.fly.z = sz + (z1 - sz) * u;
      I.fly.y = 0.9 * (1 - e) + Math.sin(u * Math.PI) * 2.3;
      I.fly.ry = parcelFace() + (1 - u) * 6.28; I.fly.rz = Math.sin(u * 14) * 0.12 * (1 - u);
      if (u < 1 && Math.random() < dt * 40) R.emit({ x: I.fly.x, y: I.fly.y + 0.3, z: I.fly.z, vy: 0.4, life: 0.5, size: 0.1, size2: 0.01, col: [1, 0.9, 0.5, 1], shape: 3, drag: 1 });
      if (u >= 1) {
        const i = R.nodes.indexOf(I.fly); if (i >= 0) R.nodes.splice(i, 1);
        I.fly = null; I.landed = true; I.ph = 2; I.t = 0;
        sfx("thud");
        R.burst({ x: x1, y: 0.1, z: z1, n: 26, speed: 2.8, flat: true, up: 0.9, life: 0.8, size: 0.3, size2: 0.8, col: [[0.86, 0.8, 0.68, 0.6], [0.78, 0.72, 0.6, 0.5]], g: -1.5, drag: 2.2 });
        R.burst({ x: x1, y: 0.4, z: z1, n: 24, speed: 2.2, up: 4, life: 1.1, size: 0.13, size2: 0.01, col: [PARCEL_COL[0], [1, 1, 1, 1]], shape: 3, g: -7 });
        WV.evKey = null; farmSyncScene();
        if (WV.parcel) { WV.parcel.body.sy = 0.55; WV.parcel.body.sx = WV.parcel.body.sz = 1.45; WV.parcel.land = 0; }
      }
    }
  } else if (I.ph === 2 && I.t > 1.0) {
    I.ph = 3;
    startDrive(v, [[v.x, v.z], [-34, 17.9]], () => worldParcelIntroEnd());
    FV.drives.forEach(d => { if (d.node === v) d.sp = 10; });
  }
}
function stepParcel(dt, time) {
  const I = WV.parcelIntro;
  if (I) stepParcelIntro(I, dt);
  const P = WV.parcel;
  if (!P || !P.body) return;
  const R = FV.R;
  if (WV.parcelOpen) return stepParcelOpen(WV.parcelOpen, P, dt, time);
  /* gelandet: kurzes Nachfedern (Stauchen und Strecken) */
  if (P.land != null) {
    P.land += dt;
    const k = Math.max(0, 1 - P.land * 2.2), s = Math.sin(P.land * 24) * 0.22 * k;
    P.body.sy = 1.25 * (1 - s); P.body.sx = P.body.sz = 1.25 * (1 + s * 0.5);
    if (!k) { P.land = null; P.body.sx = P.body.sy = P.body.sz = 1.25; }
  }
  /* v97: im Stand kein Leuchten mehr (keine Lichtsäule, keine Ringe, kein Funkeln) – die Kiste dreht sich sanft zur Kamera */
  P.body.ry += angTo(P.body.ry, parcelFace()) * Math.min(1, dt * 5);
  /* ab und zu ein Hüpfer: „tipp mich an!“ */
  const k = time % 3.4;
  if (P.land == null) {
    if (k < 0.7) { const u = k / 0.7; P.body.y = Math.sin(u * Math.PI) * 0.3; P.body.rz = Math.sin(u * 22) * 0.07 * (1 - u); P.lid.rx = -Math.sin(u * Math.PI) * 0.3; P.hop = 1; }
    else {
      P.body.y = 0; P.body.rz = 0; P.lid.rx = 0;
      if (P.hop) { P.hop = 0; R.burst({ x: P.x, y: 0.1, z: P.z, n: 7, speed: 1.2, flat: true, up: 0.5, life: 0.5, size: 0.18, size2: 0.45, col: [[0.86, 0.8, 0.68, 0.5]], g: -1, drag: 2.2 }); }
    }
  }
}
/* Antippen: Kamera fährt heran, danach läuft die Öffnungs-Animation (stepParcelOpen) */
function worldParcelOpen() {
  const c = S.farm.ev && S.farm.ev.cur, P = WV.parcel;
  if (!c || c.k !== "lieferung" || c.data.done || !P || WV.parcelOpen) return;
  farmParcelRoll(c);
  WV.parcelOpen = { t: 0, rar: c.data.rar, ph: 0, ticks: 0, r: null };
  farmFocusXZ(P.x, P.z + 0.5, 9.5, 650);
  sfx("tap");
}
function stepParcelOpen(O, P, dt, time) {
  O.t += dt;
  const t = O.t, R = FV.R, x = P.x, z = P.z, col = PARCEL_COL[O.rar], T0 = 0.7, SH = 1.5, TS = 6.9, face = parcelFace();
  if (O.ph === 0) {
    /* Rütteln: wird immer wilder, Funken ziehen nach innen, die Säule schwillt an */
    const u = Math.max(0, t - T0) / SH, a = u * u;
    /* v97 wie bei der Schatztruhe: die Kiste hebt ab und dreht sich immer schneller (zwei Umdrehungen), dabei rüttelt sie */
    const e0 = 1 - Math.pow(1 - Math.min(1, u * 1.6), 2);
    P.body.rz = Math.sin(t * 46) * 0.1 * a; P.body.rx = Math.sin(t * 37 + 1) * 0.07 * a; P.body.y = e0 * 0.55 + Math.sin(t * 14) * 0.02 * u;
    P.body.ry = face + Math.PI * 4 * a;
    P.body.sx = P.body.sz = 1.25 * (1 + 0.06 * u); P.body.sy = 1.25 * (1 - 0.03 * u); P.body.glow = 0.75 * u;
    P.b1.alpha = u * 0.46; P.b2.alpha = u * 0.73; P.b1.sx = P.b1.sz = 1 + u * 0.9; P.b2.sx = P.b2.sz = 1 + u * 0.6;
    [P.r1, P.r2].forEach((r, i) => { const w = (time * (0.55 + u * 1.6) + i * 0.5) % 1; r.sx = r.sz = 0.7 + w * 1.6; r.alpha = 0.6 * (1 - w) * Math.min(1, w * 6); });
    if (t > T0) {
      const n = Math.random() < dt * (14 + 90 * u) ? 1 : 0;
      for (let i = 0; i < n; i++) { const an = Math.random() * 6.28, d = 1.3 + Math.random() * 0.6; R.emit({ x: x + Math.cos(an) * d, y: 0.1 + Math.random() * 0.9, z: z + Math.sin(an) * d, vx: -Math.cos(an) * 2.4, vz: -Math.sin(an) * 2.4, vy: 0.5, life: 0.55, size: 0.1, size2: 0.02, col, shape: 3, drag: 0 }); }
      const tk = [0, 0.28, 0.5, 0.68, 0.82, 0.93]; while (O.ticks < tk.length && t - T0 >= tk[O.ticks]) { sfx("pop"); O.ticks++; }
    }
    if (t >= T0 + SH) {
      /* Deckel springt auf: Lichtstoß, Banner, Belohnungen */
      O.ph = 1; O.tb = t;
      const r = O.r = farmEvReward("lieferung");
      P.lit.visible = true; P.body.rz = P.body.rx = 0; P.body.ry = face; O.y0 = P.body.y;
      sfx("thud");
      if (O.rar === 0) sfx("collect"); else if (O.rar === 1) sfx("pearl"); else { sfx("level"); setTimeout(() => sfx("pearl"), 350); if (O.rar === 3) setTimeout(() => sfx("level"), 700); }
      try { if (navigator.vibrate) navigator.vibrate(O.rar > 1 ? [40, 30, 90] : 25); } catch (e) { /* kein Rütteln */ }
      R.burst({ x, y: 0.55, z, n: 46 + O.rar * 16, speed: 3.4, up: 7, life: 1.4, size: 0.16, size2: 0.01, col: [col, [1, 1, 1, 1], PARCEL_COL[0]], shape: 3, g: -6.5, drag: 0.8 });
      R.burst({ x, y: 0.5, z, n: 18, speed: 2.4, up: 5, life: 1.2, size: 0.12, size2: 0.05, col: [[1, 0.86, 0.3, 1]], g: -9, drag: 0.5 });
      R.burst({ x, y: 0.08, z, n: 20, speed: 3.2, flat: true, up: 0.6, life: 0.7, size: 0.3, size2: 0.9, col: [[col[0], col[1], col[2], 0.55]], g: -0.5, drag: 2.4 });
      worldParcelReward(O, r, P);
      save(); renderFarmUI();
    }
    return;
  }
  /* Phase 1: Deckel klappt auf (mit Überschwingen), Fontäne, Ringe, Säule schießt hoch – dann löst sich alles auf */
  const u = t - O.tb;
  const kk = Math.min(1, u / 0.45), e = 1 + 2.70158 * Math.pow(kk - 1, 3) + 1.70158 * Math.pow(kk - 1, 2);
  P.lid.rx = -2.15 * e; P.lid.glow = 0.3;                  /* v124: offener Deckel (Unterseite) nicht im Schatten */
  /* v97: Kiste setzt wieder auf (Staub) und bleibt offen stehen – ohne Leuchten, zur Kamera gewandt */
  const dn = Math.min(1, u / 0.7);
  if (u < TS) { P.body.y = (O.y0 || 0) * (1 - dn * dn) + (dn >= 1 ? 0 : Math.sin(u * 5) * 0.02 * (1 - dn)); P.body.ry += angTo(P.body.ry, face) * Math.min(1, dt * 5); }
  if (dn >= 1 && !O.landed) { O.landed = 1; sfx("thud"); R.burst({ x, y: 0.1, z, n: 14, speed: 2.2, flat: true, up: 0.6, life: 0.8, size: 0.25, size2: 0.7, col: [[0.86, 0.8, 0.68, 0.5]], g: -1, drag: 2.2 }); }
  P.body.glow = Math.max(0.14, 0.7 * (1 - u / 1.6)); P.lit.alpha = 0.85 * Math.max(0, 1 - u / 2.2) + Math.sin(time * 18) * 0.05; if (u > 2.3) P.lit.visible = false;
  P.b1.alpha = 0.46 * Math.max(0, 1 - u / 2.4); P.b2.alpha = 0.7 * Math.max(0, 1 - u / 2.0);
  P.b1.sx = P.b1.sz = 1.8 + u * 0.6; P.b2.sx = P.b2.sz = 1.5 + u * 0.4;
  const rw = Math.min(1, u / 0.9);
  P.r1.sx = P.r1.sz = 0.8 + rw * 5.5; P.r1.alpha = 0.9 * (1 - rw);
  const rw2 = Math.max(0, Math.min(1, (u - 0.25) / 0.9)); P.r2.sx = P.r2.sz = 0.8 + rw2 * 4; P.r2.alpha = 0.7 * (1 - rw2) * (u > 0.25 ? 1 : 0);
  if (u < 1.6) {
    /* Fontäne aus der Kiste: goldene Münzen und Funken in der Farbe der Seltenheit */
    const n = Math.random() < dt * 80 ? 1 : 0;
    for (let i = 0; i < n; i++) R.emit({ x: x + (Math.random() - 0.5) * 0.5, y: 0.55, z: z + (Math.random() - 0.5) * 0.35, vx: (Math.random() - 0.5) * 2.2, vz: (Math.random() - 0.5) * 2.2, vy: 4 + Math.random() * 3.5, g: -8, drag: 0.3, life: 1.2, size: 0.1 + Math.random() * 0.06, size2: 0.03, col: Math.random() < 0.55 ? [1, 0.84, 0.25, 1] : col, shape: Math.random() < 0.6 ? 3 : 0 });
  }
  if (u > TS) {
    /* Kiste löst sich in Funken auf */
    const k = Math.min(1, (u - TS) / 0.5);
    P.body.sx = P.body.sz = 1.25 * (1 - k); P.body.sy = 1.25 * (1 - k * 0.6); P.body.y = k * 0.4;
    if (!O.gone) { O.gone = 1; sfx("pop"); R.burst({ x, y: 0.4, z, n: 24, speed: 2, up: 3, life: 1, size: 0.12, size2: 0.01, col: [col, [1, 1, 1, 1]], shape: 3, g: -3, drag: 1 }); R.burst({ x, y: 0.3, z, n: 14, speed: 1.6, flat: true, up: 1, life: 0.9, size: 0.25, size2: 0.7, col: [[0.9, 0.9, 0.95, 0.5]], g: -0.6, drag: 1.6 }); }
  }
  if (u > TS + 0.7) { WV.parcelOpen = null; WV.evKey = null; farmSyncScene(); renderFarmUI(); }
}
/* Gemeinsame Show: Lichtblitz an (px|py) und Banner mit Titel und Beute-Chips */
function worldLootShow(px, py, o) {
  const fx = $("#farmFx");
  if (!fx) return;
  const ms = o.ms || 3200;
  const fl = document.createElement("div"); fl.className = "lootflash"; fl.style.setProperty("--c", o.css); fl.style.setProperty("--x", px + "px"); fl.style.setProperty("--y", py + "px");
  fx.appendChild(fl); setTimeout(() => fl.remove(), 900);
  const el = document.createElement("div"); el.className = "lootbanner r" + (o.r || 0); el.style.setProperty("--c", o.css);
  if (o.ms) el.style.animationDuration = (o.ms / 1000 - 0.1).toFixed(2) + "s";
  el.innerHTML = `<small>${esc(o.sub || "")}</small><b>${esc(o.title)}</b><span>${(o.chips || []).map(c => typeof c === "string" ? `<i>${esc(c)}</i>` : `<i class="lb-it">${c.html}</i>`).join("")}</span>`;
  fx.appendChild(el); setTimeout(() => el.remove(), ms);
}
/* Banner (Seltenheit), Lichtblitz und die Belohnungen, die der Reihe nach aus der Kiste fliegen */
function worldParcelReward(O, r, P) {
  const R = FV.R, fx = $("#farmFx");
  const p = R.project(P.x, 0.9, P.z) || [R.w / 2, R.h / 2], px = p[0], py = p[1];
  if (fx && r) {
    const chips = [];
    /* v122: Waren in der Ausbeute-Leiste als 3D-Bildchen statt Emoji */
    (r.items || []).forEach(([id, n]) => chips.push({ html: icHTML(id) + " " + esc(n + "× " + FITEMS[id].n) }));
    if (r.m) chips.push("💶 " + eur(r.m));
    chips.push("🍀 " + r.clover, "⭐ " + r.xp + " EP");
    worldLootShow(px, py, { sub: "Besondere Lieferung", title: (O.rar > 1 ? "✨ " : "") + PARCEL_TXT[O.rar] + (O.rar > 1 ? " ✨" : ""), chips, r: O.rar, css: PARCEL_CSS[O.rar] });
  }
  if (!r) return;
  let d = 450;
  (r.items || []).forEach(([id, n], i) => {
    setTimeout(() => { if (!FV.on) return; flyItem(id, px + (i - ((r.items.length - 1) / 2)) * 26, py, storeBtn(), 0, n); sfx("collect"); }, d); d += 240;
  });
  if (r.m) { const dd = d; setTimeout(() => { if (FV.on) { coinFly(px, py, r.m); sfx("coin"); } }, dd); d += 260; }
  { const dd = d; setTimeout(() => { if (FV.on) { farmCloverFlyAt(px, py, r.clover); } }, dd); d += 240; }
  setTimeout(() => { if (FV.on) xpFly(px, py - 10, r.xp, 0); }, d);
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
  { const sw = 0.22 + WV.gust * 0.9;
    if (WV.bgG) for (const g of WV.bgG.values()) g.sway = sw;
    if (WV.bgGH) for (const g of WV.bgGH.values()) g.sway = sw;
    if (WV.gust > 0.05) for (const e of WV.trees.values()) if (e.node.sway) e.node.sway = sw; }
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
  /* Schatzkiste: das Kreuz antippen */
  const tr = farmTreasureCur();
  if (tr && !tr.done && near(tr.x, 0.05, tr.z, 46)) { worldTreasureDig(); return true; }
  const ho = pickObjT(x, y), ht = pickTree(x, y);
  /* v107: Hochsitz */
  const hu = typeof HUNT !== "undefined" ? HUNT.pick(x, y) : null;
  if (hu && (!ho || hu.d < ho.d) && (!ht || hu.d < ht.d + 0.5)) { sfx("tap"); HUNT.sheet(); return true; }
  /* Holzstapel im Sägewerk */
  const hp = pickPile(x, y);
  if (hp && (!ho || hp.d < ho.d - 0.2) && (!ht || hp.d < ht.d - 0.2)) {
    if (!farmAreaOpen("saege")) { openAreaInfo("saege"); return true; }
    sfx("tap"); openPile(hp.i); return true;
  }
  /* Wildtiere nur, wenn nichts anderes getroffen wurde */
  if (!ho && !ht) for (const w of WV.wild) if (w.node.visible && w.f > 0.5 && near(w.x, 0.4, w.z, 30)) {
    w.flee = 1.8; w.wait = 0;
    const a = Math.atan2(w.z - R.cam.tz, w.x - R.cam.tx) + (Math.random() - 0.5);
    w.tx = w.x + Math.cos(a) * 6; w.tz = w.z + Math.sin(a) * 6;
    sfx("pop");
    if (!w.seen) { w.seen = true; farmXP(1); xpFly(x, y, 1); }
    return true;
  }
  /* v91: Igel im Busch – zieht sich zurück, ein Fund gibt einmal 1 EP */
  if (!ho && !ht && WV.life) for (const q of WV.life.peek) if (q.n.visible && q.f > 0.5 && near(q.n.x, 0.25, q.n.z, 30)) {
    q.hide = 25; sfx("pop");
    if (!q.seen) { q.seen = true; farmXP(1); xpFly(x, y, 1); }
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
  /* Kulissenbaum: wird zum echten Baum (im gesperrten Gebiet: erst die Info) */
  const hb = bgPick(x, y);
  if (hb && (!ho || hb.d < ho.d - 0.2)) {
    const a = bgArea(hb.b);
    if (a && !farmAreaOpen(a)) { openAreaInfo(a); return true; }
    worldTreeTap(bgPromote(hb), x, y);
    save();
    return true;
  }
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
  if (t.st === "sapling") return `<div class="fp-h">🌱 ${esc(S0.n)}-Setzling<small>wird ein Baum in ${fdur(Math.max(1, t.t - S.time))}</small></div>
    <div class="fp-row"><div class="ftool big" data-act="fellsap">${toolIc((S.farm.tools.axe || 1) >= 2 ? "axe2" : "axe1")}<b>Roden</b><small>💪 2</small><small class="ft-plus">${icHTML("aeste")} 1 Bündel Äste</small></div></div>`;
  if (t.st === "fallen") return `<div class="fp-h">🌪️ ${esc(S0.n)} – vom Sturm umgeworfen<small>${fqty(S0.log, Z.logs)} und Äste liegen bereit</small></div>
    <div class="fp-row"><div class="ftool big" data-act="takefallen"><span class="ic">🪵</span><b>Aufsammeln</b><small>ohne Fällen</small></div></div>`;
  /* Werkzeug selbst wählen: Axt (ohne Sprit) oder Säge (schneller, mehr Holz) */
  const tool = treeTool(t), tools = treeTools(t).sort((a, b) => (b === tool) - (a === tool)), T = S.farm.tools;
  const staOf = k => k === "saw" ? Math.round(4 * Z.sta) : Math.round(5 * Z.sta);
  const staCost = tool ? staOf(tool) : 0;
  const grow = t.t && t.sz < t.mx ? ` · wächst: ${FTREE_SIZE[t.sz + 1].n} in ${fdur(Math.max(1, t.t - S.time))}` : "";
  const yieldT = "Baum " + Z.n + " – je größer, desto mehr Holz";
  const sta = farmSta();
  const tid = k => k === "saw" ? ((T.saw || 0) >= 2 ? "saw2" : "saw1") : ((T.axe || 1) >= 2 ? "axe2" : "axe1");
  const btn = tools.length
    ? tools.map(k => {
        const H = treeHaul(t, k), hard = treeHard(t, k);
        /* Vorschau mit denselben Mengen und Einheiten wie danach auf der Karte */
        const plus = `${icHTML(H.log)} ${famt(H.log, H.logs)}${H.logs === 1 ? " Stamm" : " Stämme"} · ${icHTML("aeste")} ${famt("aeste", H.aeste)}${H.reste ? " · " + icHTML("reste") + " " + famt("reste", H.reste) : ""}`;
        return `<div class="ftool big${k === tool && tools.length > 1 ? " pick" : ""}${sta < Math.min(staOf(k), 6) ? " tired" : ""}${hard ? " hard" : ""}" data-act="fell" data-tool="${k}">${toolIc(tid(k))}<b>${k === "saw" ? "Sägen" : hard ? "Fällen (mühsam)" : "Fällen"}</b>
          <small>${esc(FTOOLS[tid(k)].n)} · 💪 ${staOf(k)}${k === "saw" ? " · ⛽ " + eur(FSAW_FUEL[T.saw] || 3) : ""}</small><small class="ft-plus">${plus}</small></div>`;
      }).join("")
    : `<div class="ftool lock"><span class="ic">🔒</span><b>${esc(treeNeedText(t))}</b><small>im Laden</small></div><div class="ftool" data-act="toolshop"><span class="ic">🛒</span><b>Werkzeug</b><small>ansehen</small></div>`;
  return `<div class="fp-h">${icHTML(S0.log)} ${esc(S0.n)} · ${esc(Z.n)} <span class="fp-sz">${"●".repeat(t.sz)}<i>${"●".repeat(4 - t.sz)}</i></span><small>${esc(yieldT)}${grow}</small></div>
    <div class="fp-row">${btn}${tool && sta < staCost ? `<div class="ftool" data-act="food"><span class="ic">🥪</span><b>Brotzeit</b><small>💪 ${Math.floor(sta)}/${farmStaMax()}</small></div>` : ""}</div>
    ${S0.rare ? `<div class="fp-tip">Seltene Wildkirsche: aus ihr wird kostbares Edelholz.</div>` : t.sz >= 4 ? `<div class="fp-tip">Eine uralte Eiche – manchmal steckt Edelholz drin.</div>` : ""}`;
}
function renderTreePop(el, P) {
  const t = farmTree(P.tree);
  if (!t) return closeFarmPop();
  el.className = "on";
  el.innerHTML = `<div class="fp-box">${treePopHTML(t)}</div>`;
  thumbFill();
  el.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
    const a = b.dataset.act;
    if (a === "fell") worldFell(t, b.dataset.tool);
    if (a === "fellsap") {
      const r = farmFellSapling(t);
      if (r === "tired") { openFood(); toast("💪 Zu erschöpft – erst eine Brotzeit.", "warn"); return; }
      if (r) { const [sx, sy] = treeScreen(t, 0.2); flyItem(r.id, sx, sy, storeBtn(), 0, r.n); xpFly(sx, sy, r.xp, 120); sfx("chop"); closeFarmPop(); worldSyncTrees(); save(); }
    }
    if (a === "takefallen") {
      const r = farmTakeFallen(t);
      if (r) { const [sx, sy] = treeScreen(t, 0.2); flyItem(r.id, sx, sy, storeBtn(), 0, r.n); xpFly(sx, sy, r.xp, 120); sfx("collect"); closeFarmPop(); worldSyncTrees(); save(); }
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
/* v59: Obstbaum fällen – gleiches Axt-Minispiel wie im Wald (Hilfsbaum nur für die
   Anzeige), reife Früchte vorher ernten, dann verschwindet der Baum: 2 Bündel Äste,
   Kirschbaum zusätzlich 1 Edelholzstamm. Der Platz im Raster und im Limit wird frei. */
function fruitFell(o) {
  if (!o || o.t !== "tree" || FV.felling) return;
  const F = S.farm, Z = FTREE_SIZE[1];
  if (treeRipe(o) && !doPick(o)) return;
  const got = [["aeste", 2]].concat(o.kind === "kirsche" ? [["edelholz", 1]] : []);
  if (got.some(([id, n]) => farmRoom(id) < n)) { farmFull("holz"); return toast("🪵 Holzplatz voll – verkauf Holz oder bau ihn aus.", "warn"); }
  if (farmSta() < Z.sta) { openFood(); return toast("💪 Zu erschöpft – erst eine Brotzeit.", "warn"); }
  closeFarmPop();
  const [cx, cz] = farmCenter(o), T = treeDef(o);
  const t = { id: "fruit" + o.id, sp: o.kind === "kirsche" ? "kirsche" : "birke", n: T.n, sz: 1, x: cx, z: cz, dmg: 0 };
  const port = innerHeight > innerWidth;
  farmFocusXZ(cx + (port ? 2.6 : 1.2), cz + (port ? 2.6 : 1.2), port ? 23 : 19, 500);
  FV.felling = true;
  MG.open("axe", { tree: t }, res => {
    FV.felling = false;
    if (!res || !res.ok || !F.objs.includes(o)) { save(); return; }
    F.objs = F.objs.filter(x => x !== o);
    (F.staff || []).forEach(s => { const j = s.job; if (j && (j.oid === o.id || (j.oids || []).includes(o.id))) s.job = null; });
    got.forEach(([id, n]) => farmAdd(id, n, 3));
    farmXP(4);
    farmEvent("fell:fruit");
    FV.R.burst({ x: cx, y: 1.2, z: cz, n: 26, col: [[0.45, 0.72, 0.3, 1], [0.36, 0.62, 0.25, 1], [0.86, 0.66, 0.4, 1]], speed: 2.4, up: 3, size: 0.09, shape: 1, life: 1.1 });
    const p = FV.R.project(cx, 0.8, cz);
    if (p) { got.forEach(([id, n], i) => flyItem(id, p[0], p[1], storeBtn(), 300 + i * 120, n)); xpFly(p[0], p[1] - 10, 4, 400); }
    sfx("thud");
    toast("🪓 " + T.n + " gefällt – der Platz ist frei.", "ok");
    farmSyncScene(); save(); renderFarmUI();
  });
}
function worldPopAct(a, o) {
  if (a === "fell") { fruitFell(o); return; }
  if (a === "clear") {
    const [x, y] = objScreen(o);
    puff(o);
    const r = farmClearJunk(o);
    if (!r) { sfx("bad"); toast("💪 Zu erschöpft – erst eine Brotzeit.", "warn"); return; }
    r.got.forEach((g, i) => flyItem(g.id, x, y, storeBtn(), i * 100, g.n));
    if (r.m) coinFly(x, y, r.m);
    xpFly(x, y - 10, r.xp, 120);
    sfx("swish");
    closeFarmPop(); FV.sel = null;
    farmSyncScene(); save();
  }
}
/* Fällen: Werkzeug, Platz und Sprit prüfen, dann das Minispiel */
function worldFell(t, pick) {
  const tool = pick && treeTools(t).includes(pick) ? pick : treeTool(t);
  if (pick && tool === pick) S.farm.toolPref = pick;
  if (!tool) return toast("Dafür brauchst du " + treeNeedText(t) + " – im Laden unter „Werkzeug“.", "warn");
  if (farmRoom(FSPECIES[t.sp].log) < 1) { farmFull("holz"); farmViewFull("holz"); return toast("🪵 Holzplatz voll – verkauf Holz oder bau ihn aus.", "warn"); }
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
  /* v85: die Säge fährt die Kamera selbst vor den Stamm (fpsaw.js), sonst wie bisher oben der Baum, unten das Spiel */
  /* v93: auch die Axt fährt die Kamera selbst vor den Stamm */
  if (!(typeof SAW3D !== "undefined" && SAW3D.can())) farmFocusXZ(t.x + (port ? 2.6 : 1.2), t.z + (port ? 2.6 : 1.2), port ? 23 : 19, 500);
  MG.open(tool === "saw" ? "saw" : "axe", { tree: t }, res => {
    if (!res || !res.ok) { save(); return; }
    const r = farmFell(t, { acc: res.acc, tool, dirOk: res.dirOk, hung: res.hung });
    if (!r) return;
    worldTreeFall(t, res.dir);
    const [sx, sy] = treeScreen(t, 0.5);
    r.got.forEach((g, i) => flyItem(g.id, sx, sy, storeBtn(), 1500 + i * 120, g.n));
    xpFly(sx, sy - 10, r.xp, 1400);
    /* Belohnung: Laub und Späne stieben auf, die Ausbeute als Karte */
    const [cx, cz] = [t.x, t.z];
    FV.R.burst({ x: cx, y: 1.2, z: cz, n: 26, col: [[0.45, 0.72, 0.3, 1], [0.95, 0.8, 0.35, 1], [0.86, 0.66, 0.4, 1]], speed: 2.6, up: 3.2, size: 0.09, shape: 1, life: 1.1 });
    fellReward(t, r, res, tool);
    sfx(r.perfect ? "level" : "collect");
    save(); renderFarmUI();
  });
}
/* Ausbeute nach dem Fällen: was es gab und wofür es Extras gab */
function fellReward(t, r, res, tool) {
  const fx = $("#farmFx");
  if (!fx) return;
  const old = fx.querySelector(".frew"); if (old) old.remove();
  const S0 = FSPECIES[t.sp], Z = FTREE_SIZE[t.sz] || FTREE_SIZE[1], stars = clamp(Math.round(r.q), 1, 5);
  const bonus = [];
  if (r.perfect) bonus.push(tool === "saw" ? "✂️ Perfekter Kerb +1" : "💥 Volltreffer +1");
  if (r.haul && r.haul.saw) bonus.push((r.haul.pro ? "⛓️ Profi-Säge +2" : "⛓️ Kettensäge +1"));
  if (r.crew) bonus.push("🧑‍🌾 Holzfäller +1");
  const el = document.createElement("div");
  el.className = "frew" + (r.perfect ? " gold" : "");
  el.innerHTML = `<b>🌲 ${esc(S0.n)} gefällt!</b><small>${esc(Z.n)} · ${"★".repeat(stars)}<i>${"★".repeat(5 - stars)}</i></small>
    <div class="frew-it">${r.got.map((g, i) => `<span style="animation-delay:${0.15 + i * 0.12}s">${itemIc(g.id)}<em>${FITEMS[g.id].u ? famt(g.id, g.n) : "×" + g.n}</em></span>`).join("")}</div>
    ${bonus.length ? `<div class="frew-b">${bonus.map(x => `<i>${esc(x)}</i>`).join("")}</div>` : ""}
    ${r.lost && r.lost.length ? `<div class="frew-l">📦 Holzplatz voll – liegen gelassen: ${r.lost.map(l => esc(famt(l.id, l.n) + " " + ((l.n === 1 && FITEMS[l.id].sg) || FITEMS[l.id].n))).join(", ")}</div>` : ""}`;
  fx.appendChild(el);
  thumbFill();
  /* v85: ein Tipp irgendwo auf dem Bild schließt die Karte (der Tipp geht trotzdem durch); sonst nach 2,6 s von selbst */
  const onTap = () => kill();
  const kill = () => { document.removeEventListener("pointerdown", onTap, true); el.classList.add("out"); setTimeout(() => el.remove(), 320); };
  /* v96: Karte fängt keine Berührung ab (sonst zeigt iOS beim langen Halten die Textlupe); jeder Tipp aufs Bild schließt sie ohnehin */
  el.style.pointerEvents = "none";
  setTimeout(() => { if (el.isConnected) document.addEventListener("pointerdown", onTap, true); }, 350);
  setTimeout(kill, 2600);
}

/* ------------------------------ Kamera ------------------------------------ */
function farmFocusXZ(x, z, dist, ms) {
  if (!FV.R || FV.fp) return;              /* v107: in der Ich-Perspektive (Sägen, Hochsitz) führt die Sitzung die Kamera */
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
  if (typeof pvVisit === "function" && pvVisit()) { const at = pvAt(); want.push(["pv", at[0] + 1.3, 2.9, at[1] + 1.2, "☀️<b>" + pvN() + "/" + FPV.max + "</b>", "ready", () => openPV()]); }
  { const hg = typeof HUNT !== "undefined" ? HUNT.tagInfo() : null; if (hg) want.push(["hunt", hg.x, hg.y, hg.z, hg.html, hg.cls, () => HUNT.sheet()]); }
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
    /* Steg: Turnier bereit */
    if (o.t === "f_steg" && angelS()) {
      const tour = tourCanStart();
      want.push(["us" + o.id, cx + 1.5, 1.4, cz, "🎣" + (tour ? "🏆" : ""), tour ? "ready" : "", () => openSteg(tour ? "tour" : null)]);
    }
    /* v59: Berts Kombi – fertige Köder zeigt die Maschinen-Blase; hier: alte Bestellung
       aus v58 fertig (✨) oder Bert wartet auf einen Fisch (🐟) */
    if (o.t === "bert_car" && angelS()) {
      const U = angelS(), lure = U.bert.lureQ && S.time >= U.bert.lureQ.end, ask = Object.keys(FSPEC_BAIT).some(id => specS(id) && !specWhy(id));
      if (lure || ask) want.push(["bc" + o.id, cx, objH(o) + 1.2, cz, "🧔" + (lure ? "✨" : "") + (ask ? "🐟" : ""), "ready", () => ask && !lure ? openBertDev() : openMachine(o)]);
    }
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
  if (o.t === "board") return farmOrders().some(x => farmOrderReady(x) && farmOrderArea(x) === (o.k || "hof"));
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
/* v88: Windanimation des Grases – Schaltlogik (kein JS pro Halm; nur ein Uniform-Wert je sichtbarem Chunk-Knoten).
   Stichproben der Bildabstände nur bei voller Bildrate (FV.busy) und sichtbarem Fenster. */
function vegMode(m) {
  if (m !== "static" && m !== "wind" && m !== "auto") return VEGQ.mode;
  VEGQ.mode = m; VEGQ.samples.length = 0; VEGQ.good = 0; VEGQ.banUntil = 0;
  try { localStorage.setItem("logistika_veg", m); } catch (e) {}
  if (m === "static") vegSet(false, "manuell statisch"); else if (m === "wind") vegSet(true, "manuell Wind");
  return m;
}
function vegSet(on, why) { VEGQ.on = on; VEGQ.why = why; }
function vegInfo() {
  return { mode: VEGQ.mode, on: VEGQ.on, why: VEGQ.why, fps: Math.round(VEGQ.fps), chunks: VEGQ.nodes.length, animated: VEGQ.nodes.filter(e => e.node.sway > 0).length,
    grassTris: VEGQ.nodes.reduce((a, e) => a + e.node.mesh.count / 3, 0) };
}
function vegStep(now) {
  if (!VEGQ.nodes.length) return;
  if (typeof document !== "undefined" && document.hidden) { VEGQ.prev = 0; return; }
  const t = performance.now();
  if (!VEGQ.t0) VEGQ.t0 = t;
  if (VEGQ.mode === "wind" && !VEGQ.on) VEGQ.on = true, VEGQ.why = "Modus wind";
  /* Messung: nur Bilder bei voller Rate zählen; Ruhephasen (30 Bilder/s) und Pausen verfälschen sonst */
  if (FV.busy && VEGQ.prev && t - VEGQ.prev < 200) {
    VEGQ.samples.push(t - VEGQ.prev);
    if (VEGQ.samples.length >= 90) {
      const a = VEGQ.samples.slice().sort((x, y) => x - y), mean = a.reduce((x, y) => x + y, 0) / a.length, best = a[Math.floor(a.length * 0.1)];
      VEGQ.samples.length = 0; VEGQ.fps = 1000 / mean;
      if (VEGQ.mode === "auto") {
        if (!VEGQ.on) {
          /* nach einer Sperre wieder an, wenn zwei Fenster in Folge flüssig sind (im Mittel ≥ 36 Bilder/s) */
          VEGQ.good = (mean <= 28 && t > VEGQ.banUntil) ? VEGQ.good + 1 : 0;
          if (VEGQ.good >= 2) { vegSet(true, "auto: " + Math.round(1000 / mean) + " Bilder/s"); VEGQ.good = 0; }
        } else if (mean > 40) {
          /* echter Einbruch unter 25 Bilder/s: Wind sanft aus und 60 s Sperre */
          vegSet(false, "auto: aus bei " + Math.round(1000 / mean) + " Bilder/s"); VEGQ.banUntil = t + 60000;
        }
      }
    }
  }
  VEGQ.prev = FV.busy ? t : 0;
  /* Wind: Stärke folgt dem Wetter in einigen Sekunden, die Richtung dreht sehr langsam */
  const dt = Math.min(0.1, VEGQ.last ? (t - VEGQ.last) / 1000 : 0); VEGQ.last = t;
  const F = S.farm, wk = typeof farmEvOn === "function" && farmEvOn("sturm") ? "sturm" : F && F.wx ? F.wx.k : "sonne";
  VEGQ.wind += ((WIND_WX[wk] || 0.85) - VEGQ.wind) * Math.min(1, dt * 0.35);
  const wa = 0.64 + 0.3 * Math.sin(t / 97000), E = FV.R.env;
  E.wind = [Math.cos(wa), Math.sin(wa), VEGQ.wind, 0];
  /* Amplitude je Chunk: nah an der Kamera voll, sonst aus – immer weich überblendet (≈ 1,5 s), nie hart */
  const c = FV.R.cam, A = VEGQ.on ? VEGQ.grassSway : 0, k = Math.min(1, dt * 1.6);
  for (const e of VEGQ.nodes) {
    const goal = Math.hypot(e.x - c.tx, e.z - c.tz) < VEGQ.range + 12 ? A : 0;
    const n = e.node;
    n.sway += (goal - n.sway) * k;
    if (n.sway < 0.002 && goal === 0) n.sway = 0;
  }
}
function worldBusy() { return !!(WV.falling.length || FV.fp || WV.reveal || WV.dust || WV.parcelOpen || WV.parcelIntro || WV.trReveal || WV.trIntro || (typeof MG !== "undefined" && MG.on) || (S.farm && S.farm.wx && (S.farm.wx.k === "regen" || farmEvOn("sturm")))); }
function worldStep(dt, time) {
  if (!S.farm) return;
  vegStep(time);
  stepFalling();
  stepReveal(dt);
  stepWild(dt, time);
  stepLife(dt, time);
  stepPets(dt, time);
  stepParcel(dt, time);
  stepTreasure(dt, time);
  stepWeather(dt, time);
  treeLodStep();
  const now = wnow();
  /* Baum wippt nach dem Antippen oder wenn er gewachsen ist */
  for (const [id, e] of WV.trees) {
    if (e.pop && !e.falling) {
      const k = Math.max(0, 1 - (now - e.pop) * 2.4);
      const s = Math.sin((now - e.pop) * 20) * 0.06 * k, t = farmTree(id), b = (t && (t.st === "stump" && t.cut ? t.cut.sc : t.s)) || 1;   /* v116: Sägeschnitt-Stumpf behält seinen Maßstab */
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
  if (typeof stepStaff === "function") stepStaff(dt, time);
  if (typeof CAMP !== "undefined") CAMP.step(dt, time);
  if (typeof HUNT !== "undefined") HUNT.step(dt, time);
  if (typeof SAW3D !== "undefined") SAW3D.step(dt, time);
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
  worldSyncTreasure();
  worldSyncPV();
  worldSyncPiles();
  if (!WV.reveal) worldLocks();
  /* Ware auf dem Verkaufsstand */
  S.farm.objs.forEach(o => {
    if (o.t !== "stall" && o.t !== "f_markt") return;
    const e = FV.nodes.get(o.id);
    if (!e || !e.parts.goods) return;
    const ids = stallState(o.t === "f_markt").slots.filter(it => it && !it.sold).map(it => it.id), key = ids.join(",");
    e.parts.goods.visible = ids.length > 0;
    /* die echte Ware auf dem Stand (v53) */
    if (ids.length && e.parts.goods.key !== key) { e.parts.goods.key = key; e.parts.goods.mesh = fmesh("stallG:" + (o.t === "f_markt" ? "m:" : "") + key, () => FWM.stallGoods(ids, o.t === "f_markt")); }
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
  const ev = F.ev && F.ev.cur && FEVENTS[F.ev.cur.k] && S.time < F.ev.cur.until && !F.ev.cur.data.done ? F.ev.cur : null;
  const evT = ev ? FEVENTS[ev.k] : null;
  const left = ev ? Math.max(0, Math.ceil(ev.until - S.time)) : 0;
  const tr = farmTreasureCur(), trL = tr && !tr.done ? Math.max(0, Math.ceil(tr.until - S.time)) : 0;
  const pv = typeof pvVisit === "function" ? pvVisit() : null, pvL = pv ? Math.max(0, Math.ceil(pv.until - S.time)) : 0;
  /* Ereignis-Leisten: kurz ausgeklappt, dann nur noch ein kleines Symbol am Rand –
     antippen klappt sie auf, nochmal antippen zeigt kurz, worum es geht, und
     klappt sie wieder zum Knopf zusammen */
  const now = performance.now(), CO = WV.chipOpen || (WV.chipOpen = {});
  const open = k => { if (!CO[k]) CO[k] = now + 7000; return now < CO[k]; };
  const evK = ev ? "ev:" + ev.k + ":" + ev.t0 : "", trK = trL ? "tr:" + tr.t0 : "", pvK = pvL ? "pv:" + pv.t0 : "";
  const evO = ev ? open(evK) : false, trO = trL ? open(trK) : false, pvO = pvL ? open(pvK) : false;
  const ck = sta + ":" + mx + ":" + F.clover + ":" + wx.n + ":" + farmTod() + ":" + (ev ? ev.k + (ev.k === "defekt" ? "" : Math.ceil(left / 5)) + evO : "") + ":" + (trL ? Math.ceil(trL / 5) + ":" + trO : "") + ":" + (pvL ? Math.ceil(pvL / 30) + ":" + pvO : "");
  if (C._k !== ck) {
    C._k = ck;
    C.innerHTML = `<button class="fchip2" id="fcClover" title="Kleeblätter für den Extras-Laden"><span>🍀</span><b>${F.clover || 0}</b></button>
      <button class="fchip2 wx" id="fcWx" title="Wetter und Tageszeit – wichtig fürs Angeln"><span>${wx.i}</span><b>${esc(FTOD_N[farmTod()])}</b></button>
      ${ev ? `<button class="fchip2 ev${evO ? "" : " mini"}" id="fcEv" title="${esc(evT.n)}"><span>${evT.i}</span>${evO ? `<b>${esc(evT.n)}</b>${ev.k !== "defekt" && left < 999 ? `<small>${fdur(left)}</small>` : ""}` : ""}</button>` : ""}
      ${trL ? `<button class="fchip2 ev tr${trO ? "" : " mini"}" id="fcTr" title="Unter dem Vogelschwarm liegt eine Schatzkiste"><span>🐦</span>${trO ? `<b>Vogelschwarm</b><small>${fdur(trL)}</small>` : ""}</button>` : ""}
      ${pvL ? `<button class="fchip2 ev pv${pvO ? "" : " mini"}" id="fcPv" title="Döring GmbH: Solarmodule am Sägewerk"><span>☀️</span>${pvO ? `<b>Döring Solar</b><small>${fdur(pvL)}</small>` : ""}</button>` : ""}`;
    $("#fcClover").onclick = () => openFarmHouse("extras");
    $("#fcWx").onclick = openWeatherInfo;
    const unfold = k => { CO[k] = performance.now() + 6000; C._k = ""; worldUI(); };
    const fold = (k, b) => { CO[k] = 1; if (b) b.classList.add("fold"); setTimeout(() => { C._k = ""; worldUI(); }, b ? 260 : 0); };
    const tb = $("#fcTr");
    if (tb) tb.onclick = () => {
      if (!trO) return unfold(trK);
      fold(trK, tb);
      const c = farmTreasureCur(), Z = c && FTREASURE_ZONES.find(z => z.id === c.zone);
      if (!c || !Z) return;
      farmFocusXZ(c.x + 1.6, c.z + 1.6, 28, 900);        /* Kamera schaut von Südosten: so liegt das Kreuz etwas über der Mitte */
      toast("🐦 Der Schwarm kreist " + Z.n + " – tipp aufs rote Kreuz!", "");
    };
    const pb = $("#fcPv");
    if (pb) pb.onclick = () => {
      if (!pvO) return unfold(pvK);
      fold(pvK, pb);
      openPV();
    };
    const eb = $("#fcEv");
    if (eb) eb.onclick = () => {
      if (!evO) return unfold(evK);
      fold(evK, eb);
      const s = worldEvSpots()[0];
      if (s) { farmFocusXZ(s.x, s.z + 1, 22, 700); if (s.act === "haendler" || s.act === "nachbar") setTimeout(() => worldEvAct(s), 720); }
      else toast(evT.i + " " + evT.n + (ev.k === "holzpreis" ? ": Rohholz bringt beim Holzhändler und im Großhandel gerade 30 % mehr." : ev.k === "fischpreis" ? ": Ganze Fische bringen im Großhandel gerade 30 % mehr, am Stand steigt der Preisvorschlag." : ev.k === "sturm" ? ": Danach liegen Bäume im Wald – aufsammeln!" : ""), "");
    };
  }
  /* Besucher wartet: einmal pro Sitzung von selbst zeigen */
  /* nur, wenn gerade niemand etwas tut – sonst springt die Kamera mitten aus dem Füttern in den Wald */
  if (v && !WV.visitSeen[v] && !FV.sheet && !FV.place && !FV.pop && !FV.tool && !(typeof MG !== "undefined" && MG.on) && S.farm.tut && S.farm.tut.done && !$("#farmLvl.on")
    && performance.now() - (WV.lastInput || 0) > 12000) {
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
    <div class="fs-sub">${ready ? esc(A.who) + " wartet am Weg – tipp die Figur an oder hier unten." : "Ist alles erfüllt, kommt " + esc(A.who) + " vorbei und gibt das Gebiet frei."}</div>
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
    <div class="finv">${foods.length ? foods.map(id => `<button class="fit" data-eat="${id}">${itemIc(id)}<b>+${FFOOD[id]}</b><small>${famt(id, farmInv(id))}</small></button>`).join("")
      : `<div class="fs-empty">Nichts zu essen im Lager – Äpfel, Brot oder Wurst machen satt.</div>`}</div>
    <div class="fs-sub">Fällen, Sägen und Aufräumen kosten Kraft – gutes Essen gibt mehr Ausdauer.</div>`, "food");
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
      const o = angelS() ? angelOdds(g.id) : farmFishOdds(g.id), sum = Object.values(o).reduce((a, b) => a + b, 0);
      const top = Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, 3);
      return `<div class="fwx-g"><b>${g.i} ${esc(g.n)}</b><span>${top.map(id => `${icHTML(id)} ${Math.round(o[id] / sum * 100)} %`).join(" · ")}</span></div>`;
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
      nachbar: "Nachbar Krüger braucht Holz – er zahlt gut.", holzpreis: "Holzpreise steigen: Rohholz bringt 30 % mehr – für ein paar Stunden.", fischpreis: "Fischpreise steigen: Ganze Fische bringen 30 % mehr – für ein paar Stunden.",
      hirsch: "Ein weißer Hirsch im Wald – ein Glücksbringer!", defekt: "Die Säge im Sägewerk klemmt!",
      lieferung: "Ein Lieferwagen hat eine Kiste vor dem Hoftor abgestellt – tipp sie an!", reh: "Ein Reh steht auf dem Weg."
    }[c.k] || D.n), "");
    if (c.k === "lieferung") worldParcelIntro(c);
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
    <div class="fs-sub">Material kommt vom Sägebock auf dem Hof – sauber repariert gibt mehr EP.</div>`, "repair");
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
    if (rep.id === "lkw") toast("🚛 Krügers Unimog fährt jetzt für dich – 2,5 t Holz pro Fahrt.", "ok");
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
    ${ok ? `<div class="fs-sub">Der Unimog steht im Fuhrpark und am Schuppen bereit.</div><div class="fs-row"><button class="btn tiny" id="flFleet">🚚 Zum Fuhrpark</button></div>`
      : `<div class="fs-sub">${esc(R0.d)}</div><div class="fr-in">${need}</div><button class="btn fgo" id="flGo">🔧 Motor richten</button>`}`, "repair");
  const g = $("#flGo"); if (g) g.onclick = () => worldRepair(R0);
  const f = $("#flFleet"); if (f) f.onclick = () => { closeFarmSheet(); showTab("fleet"); };
}
/* Strom kommt im Speicher an: Leiste nachführen, über dem Kessel aufblitzen */
function farmPowerFx(o, kwh, full) {
  const fen = document.querySelector("#farmSheetIn .fen");
  if (fen) fen.outerHTML = energyHTML();
  if (!FV.R || !document.body.classList.contains("tab-farm") || !kwh) return;
  const [x, y] = objScreen(o, 2.6);
  if (x < 0 || y < 0 || x > FV.R.w || y > FV.R.h) return;
  floatText(x, y, "⚡ +" + kwh + " kWh" + (full ? " · Speicher voll" : ""), "gold");
  const [cx, cz] = farmCenter(o);
  FV.R.burst({ x: cx, y: 2.2, z: cz, n: 10, col: [[1, 0.86, 0.2, 1], [1, 0.62, 0.15, 1]], speed: 1.4, up: 2.4, size: 0.08, g: -2, life: 0.8 });
}
/* Strom im Kessel */
function energyHTML() {
  const sun = typeof pvSun === "function" && pvSun(), full = typeof pvFull === "function" && pvFull(), n = typeof pvN === "function" ? pvN() : 0;
  const cap = farmEnCap(), en = sun ? cap : Math.floor(S.farm.en || 0);
  const mech = typeof staffHas === "function" && staffHas("mechaniker");
  const note = sun ? "☀️ Volles Solardach: tagsüber laufen die Maschinen mit Sonnenstrom – der Kessel bleibt aus. Erst nachts, wenn keine Sonne scheint, heizt er wieder" + (mech ? " – das übernimmt der Mechaniker." : ".")
    : full ? "🌙 Nacht: kein Sonnenstrom. Der Kessel verfeuert Holzreste, Äste oder Brennholz" + (mech ? " – der Mechaniker heizt ein." : " – oder stell einen Mechaniker ein, der nachts einheizt.")
    : !(S.farm.saw && S.farm.saw.motor) ? "Erst den Motor reparieren."
    : "Der Kessel verfeuert Holzreste, Äste oder Brennholz." + (n ? ` ☀️ ${n}/${FPV.max} Solarmodule: +${n * FPV.kwh} kWh je Stunde am Tag.` : "");
  return `<div class="fen${sun ? " sun" : ""}"><span>${sun ? "☀️" : "⚡"}</span><div><b>${sun ? "Sonnenstrom" : "Strom " + en + " / " + cap + " kWh"}</b><i><em style="width:${Math.round(en / cap * 100)}%"></em></i>
    <small>${note}</small></div></div>`;
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
  if (M.bert && typeof bertWorkHTML === "function") h += bertWorkHTML(o);   /* v59: Bert – Kopf, Dauerbestellung, Köder-Entwicklung */
  if (o.broken) h += `<button class="fup2 warn" id="fxFix"><span>⚠️</span><b>Die Säge klemmt</b><small>Antippen und richten – solange steht alles</small></button>`;
  return h;
}
function machExtraBind(o) {
  const u = $("#fxUp");
  if (u) u.onclick = () => { if (farmSawUpgrade(o.t === "sw_halle" ? "saege2" : "kessel2")) { sfx("build"); puff(o); save(); farmSyncScene(); openMachine(o); } else sfx("bad"); };
  const s = $("#fxStall"); if (s) s.onclick = () => openStall(true);
  if (FMACHINES[o.t].bert && typeof bertWorkBind === "function") bertWorkBind(o);
  const f = $("#fxFix"); if (f) f.onclick = () => { closeFarmSheet(); const sp = worldEvSpots().find(x => x.act === "defekt"); if (sp) worldEvAct(sp); else { farmMachFix(o); save(); } };
}
/* Krügers Büro: Überblick, Ausbau, Holzhändler */
function openSawOffice() {
  FV.sheetFn = openSawOffice;
  const F = S.farm, rep = sawRepaired();
  const mach = FSHOP_SAW.map(it => `<span class="fchip mch${fcount(it.id) ? "" : " miss"}" title="${esc(it.n)}">${typeof thumbSpan === "function" ? thumbSpan("shop:" + it.id, shopModel(it), it.i, false) : it.i}<b>${fcount(it.id) ? "✓" : "Lv " + it.lv}</b></span>`).join("");
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏠</span>Büro im Sägewerk<small>${rep ? "alles läuft" : "Reparaturen " + FSAW_REPAIRS.filter(r => F.saw[r.id]).length + "/5"}</small></div>
    ${rep ? energyHTML() : ""}
    <div class="fs-sub">Maschinen im Sägewerk:</div><div class="fr-in">${mach}</div>
    <div class="fs-row"><button class="btn tiny" id="foRep">${rep ? "🏭 Zur Säge" : "🔧 Reparaturen"}</button><button class="btn tiny ghost" id="foShop">🛒 Maschinen kaufen</button><button class="btn tiny ghost" id="foWood">🪵 Holzhändler</button></div>
    <div class="fletter mini"><p>„Dreißig Jahre hat meine Säge gesungen – jetzt singt sie für dich.“ – Erwin Krüger</p></div>`, "office");
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
    else slots.push(`<button class="fstl${it.sold ? " sold" : ""}" data-slot="${i}">${itemIc(it.id)}<b>${esc(fqty(it.id, it.n))}</b><small>${it.sold ? "💰 " + eur(it.p) + " · kassieren" : eur(it.p) + " · wartet"}</small></button>`);
  }
  let pickH = "";
  if (sel && sel.id == null) {
    const ids = Object.keys(F.inv).filter(id => FITEMS[id] && FITEMS[id].v > 0.2 && farmInv(id) > 0 && FITEMS[id].k !== "energy" && FITEMS[id].k !== "bait" && (!market || FITEMS[id].st === "fisch"));
    pickH = `<div class="fs-sub">Was soll auf den Stand?</div><div class="finv">${ids.length ? ids.map(id => `<button class="fit" data-sid="${id}">${itemIc(id)}<b>${famt(id, farmInv(id))}</b><small>${eur(farmStackV(id, 1))}</small></button>`).join("") : `<div class="fs-empty">${market ? "Kein Fisch im Lager." : "Das Lager ist leer."}</div>`}</div>`;
  } else if (sel) {
    const max = farmInv(sel.id), n = clamp(sel.n || 1, 1, Math.max(1, max)), base = stallBase(sel.id, n, market, farmStackV(sel.id, n)), p = Math.round(base * sel.f * 10) / 10;
    const speed = sel.f <= 0.85 ? "schnell weg" : sel.f <= 1.1 ? "normal" : sel.f <= 1.35 ? "dauert länger" : "nur mit Glück";
    pickH = `<div class="fstl-cfg"><b data-stq>${icHTML(sel.id)} ${esc(fqty(sel.id, n))}</b>
      ${max > 1 ? `<div class="fstl-sl"><input type="range" min="1" max="${max}" step="1" value="${n}" data-nr aria-label="Menge"><small><span>${esc(famt(sel.id, 1))}</span><span>${esc(famt(sel.id, max))}</span></small></div>
      <div class="fst-lim-b">${[-10, -1, 1, 10].map(d => `<button class="btn tiny ghost" data-nd="${d}">${d > 0 ? "+" : "−"}${esc(famt(sel.id, Math.abs(d)))}</button>`).join("")}</div>` : ""}
      <div class="fstl-p"><button class="btn tiny ghost" data-f="-0.1">−</button><span><b data-stp>${eur(p)}</b><small>${Math.round(sel.f * 100)} % vom Wert · ${speed}</small></span><button class="btn tiny ghost" data-f="0.1">＋</button></div>
      <button class="btn fgo" id="fsPut">Einstellen</button></div>`;
  }
  const sold = St.slots.filter(it => it && it.sold).length;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">${market ? "🏪" : "🛒"}</span>${market ? "Fischmarkt am See" : "Verkaufsstand an der Straße"}<small>${used}/${cap} Plätze${market ? " · Fisch +15 %" : ""}</small></div>
    <div class="fstls">${slots.join("")}</div>
    ${sold > 1 ? `<button class="btn tiny" id="fsAll">💰 Alles kassieren</button>` : ""}
    ${pickH}
    <div class="fs-sub">Kundschaft kommt vorbei – günstig geht schnell, teuer dauert. ${market ? "" : "Mehr Plätze mit dem Hof-Ausbau."}</div>`, "stall");
  $$("#farmSheetIn [data-pick]").forEach(b => b.onclick = () => { FV.stallSel = { m: !!market, id: null }; openStall(market); });
  $$("#farmSheetIn [data-sid]").forEach(b => b.onclick = () => { FV.stallSel = { m: !!market, id: b.dataset.sid, n: Math.min(farmInv(b.dataset.sid), 1), f: 1 }; openStall(market); });
  /* v144: Feinknöpfe wie bei den Arbeitern (±1 und ±10 Gebinde) statt fester Mengen */
  $$("#farmSheetIn [data-nd]").forEach(b => b.onclick = () => { sel.n = clamp((sel.n || 1) + +b.dataset.nd, 1, Math.max(1, farmInv(sel.id))); sfx("tap"); openStall(market); });
  /* v139: Schieber für jede Menge zwischen 1 und allem – Menge und Preis laufen beim Ziehen mit, Loslassen zeichnet neu */
  const nr = $("#farmSheetIn [data-nr]");
  if (nr) {
    nr.addEventListener("input", () => {
      sel.n = +nr.value;
      const q = $("#farmSheetIn [data-stq]"), pe = $("#farmSheetIn [data-stp]");
      if (q) q.innerHTML = `${icHTML(sel.id)} ${esc(fqty(sel.id, sel.n))}`;
      if (pe) pe.textContent = eur(Math.round(stallBase(sel.id, sel.n, market, farmStackV(sel.id, sel.n)) * sel.f * 10) / 10);
    });
    nr.addEventListener("change", () => openStall(market));
  }
  $$("#farmSheetIn [data-f]").forEach(b => b.onclick = () => { sel.f = clamp(Math.round((sel.f + +b.dataset.f) * 10) / 10, 0.6, 1.8); openStall(market); });
  const put = $("#fsPut");
  if (put) put.onclick = () => {
    const n = clamp(sel.n || 1, 1, farmInv(sel.id)), p = stallBase(sel.id, n, market, farmStackV(sel.id, n)) * sel.f;
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
    const p = d.kind === "sell" ? "+" + eur(Math.round(farmStackV(d.item, d.qty) * d.mult * 10) / 10) + " (+" + Math.round((d.mult - 1) * 100) + " %)" : eur(d.price);
    return `<button class="frec${d.done ? " lock" : ""}" data-deal="${i}" ${d.done ? "disabled" : ""}>${d.item && FITEMS[d.item] ? itemIc(d.item) : `<span class="ic">${d.i}</span>`}<b>${t}</b><small>${d.done ? "erledigt" : p}</small></button>`;
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
    <p>„Hast du Holz für mich? Ich zahl gut – plus ${FNEIGHBOR_CLOVER === 1 ? "ein Kleeblatt" : (["", "", "zwei", "drei", "vier"][FNEIGHBOR_CLOVER] || FNEIGHBOR_CLOVER) + " Kleeblätter"} obendrauf!“</p></div></div>
    <div class="fr-in">${Object.keys(c.data.items).map(id => itemChip(id, c.data.items[id], farmInv(id))).join("")}</div>
    <button class="btn fgo" id="fnGo" ${farmHasAll(c.data.items) ? "" : "disabled"}>🤝 Übergeben · ${eur(m)} + 🍀 ${FNEIGHBOR_CLOVER}</button>
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
    case "f_markt": openStall(true); return true;   /* v59: Fischmarkt = Verkaufsstand wie an der Straße */
    case "f_plot": openPlot(o); return true;
    case "sw_buero": openSawOffice(); return true;
    case "sw_lager": openFarmStore("holz"); return true;
    case "sw_lkw": openLkw(); return true;
    case "sw_halle":
      if (o.broken) { const s = worldEvSpots().find(q => q.act === "defekt"); if (s) { worldEvAct(s); return true; } }
      if (!sawRepaired()) { openSawRepair(); return true; }
      return false;
    case "kessel": if (!(F.saw && F.saw.motor)) { openSawRepair(); return true; } return false;
    case "f_steg": if (typeof openSteg === "function") openSteg(); return true;
    case "f_boot": if (typeof openBoatSheet === "function") openBoatSheet(); return true;
  }
  if (FMACHINES[o.t] && FMACHINES[o.t].saw && !sawRepaired()) { openSawRepair(); return true; }
  return false;
}
/* Tor-Schild: wandert in Stufe 4 mit dem Steintor nach außen */
/* Schild über dem Hoftor – das Tor rückt beim Ausbau mit dem Zaun nach außen */
/* Nachricht antippen: Döring → zum Montagewagen am Sägewerk */
if (typeof MSG_GO !== "undefined") MSG_GO.pv = () => {
  if (typeof showTab === "function") showTab("farm");
  setTimeout(() => {
    if (!FV.R) return;
    closeFarmSheet();
    { const at = pvAt(); farmFocusXZ(at[0] + 1, at[1] + 4, 26, 700); }
    if (typeof pvVisit === "function" && pvVisit()) setTimeout(() => { if (FV.on) openPV(); }, 760);
  }, 250);
};
/* letzte Berührung merken (für Kamera-Fahrten, die nicht stören sollen) */
if (typeof document !== "undefined") document.addEventListener("pointerdown", () => { WV.lastInput = performance.now(); }, true);
function worldGateSign() { const r = farmHofB().z1; return (S.farm.stage || 1) >= 4 ? [FGATE.x, 2.65, r + 0.65] : [FGATE.x, 1.68, r + 0.05]; }
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
  if (F.tut && F.tut.done && farmDailyBonus()) setTimeout(() => toast("🍀 Tagesbonus: 2 Kleeblätter!", "ok"), 900);
}

/* ---------------------- Wohnhaus: Ausbau, Team, Extras --------------------- */
function stageHTML() {
  const F = S.farm, cur = farmHl(), nx = farmStageNext(), chk = farmStageCheck();
  const size = k => { const B = farmHofB(k); return (B.x1 - B.x0) + " × " + (B.z1 - B.z0); };
  const list = FHOF_STAGES.slice(1).map((st, i) => {
    /* v58: erreichte Stufen grün mit ✓ (auch die letzte), die nächste kaufbare gelb.
       v70: zehn Stufen, die großen (neues Aussehen) fett */
    const k = i + 1, done = k <= cur, on = !!nx && k === cur + 1;
    const perks = (k > 1 ? ["Platz: " + size(k) + " Felder (je 1 Kachel nach Westen, Norden und Osten)"] : ["Platz: " + size(1) + " Felder"]).concat(st.perks || [st.d]);
    return `<div class="fstage${on ? " cur" : done ? " ok" : ""}${st.big || k === 1 ? " big" : " small"}"><b>${done ? "✓" : k}</b><div><span>${esc(st.n)}</span><small>${perks.map(esc).join(" · ")}</small></div></div>`;
  }).join("");
  let next = "";
  if (nx) {
    const need = Object.keys(nx.need).map(id => itemChip(id, nx.need[id], farmInv(id))).join("") + `<span class="fchip${S.money < nx.cost ? " miss" : ""}">💶<b>${eur(nx.cost)}</b></span>`;
    next = `<div class="fs-sub">Nächste Stufe: <b>${esc(nx.n)}</b>${flv() < nx.lv ? " · ab Level " + nx.lv : ""}</div><div class="fr-in">${need}</div>
      <button class="btn fgo" id="fsStage" ${chk === true ? "" : "disabled"}>🏡 Hof ausbauen</button>`;
  } else next = `<div class="fs-sub">Größer geht’s nicht – ein echter Wirtschaftshof! 🎉</div>`;
  return `<div class="fstages">${list}</div>${next}<div class="fs-sub">Die großen Stufen (4, 7, 10) brauchen Holz aus Wald und Sägewerk, dazwischen kaufst du nur Land.${nx ? " Die Pflöcke mit roter Spitze rund um den Hof zeigen, bis wohin er dann reicht." : ""}</div>`;
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
    for (let i = 0; i < 90; i++) R.emit({ x: (Math.random() - 0.5) * 26, y: 6 + Math.random() * 3, z: (Math.random() - 0.5) * 26 - 2, vx: (Math.random() - 0.5) * 2, vy: -0.5, vz: (Math.random() - 0.5) * 2, g: -2.2, drag: 0.6, life: 3, size: 0.13, shape: 1, fade: false,
      col: [[0.95, 0.3, 0.35, 1], [0.3, 0.6, 0.95, 1], [0.98, 0.82, 0.25, 1], [0.35, 0.8, 0.45, 1]][i % 4] });
    toast("🏡 " + FHOF_STAGES[farmHl()].n + " – sieh dich um!", "ok");
    renderFarmUI();
  };
}
/* Extras-Laden: Kleeblätter statt Geld. Echtgeld und Werbung sind nur Platzhalter. */
function cosShopHTML() {
  const F = S.farm, today = new Date().toISOString().slice(0, 10);
  const head = `<div class="fcos-top"><div><b>🍀 ${F.clover || 0}</b><small>Kleeblätter gibt’s für Level, Kapitel, Ereignisse und den Tagesbonus.</small></div>
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
