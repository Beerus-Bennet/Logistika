/* LOGISTIKA – Jagd: Hochsitz an der Wildwiese (v107, v108)
   ---------------------------------------------------------------------------
   Kein Three.js, keine Fremdbibliothek: gezeichnet wird mit unserer eigenen
   Engine gl3d.js (WebGL direkt im HTML5-Canvas), die Oberfläche der Jagd ist
   DOM/CSS/SVG.

   v108 – Ablauf
   • Freischaltung: erst wenn das Sägewerk fertig repariert ist (sawRepaired).
     Vorher gibt es keinen Hochsitz, keine Blase, keinen Lager-Reiter.
     Dann ruft der Förster an, an der Wildwiese ist ein Bauplatz abgesteckt;
     dort Material abgeben (Kiefernstämme, Balken, Bretter, Pfosten,
     Äste-Bündel) → der Hochsitz wächst aus dem Boden.
   • Hinaufsteigen: Kamera fährt auf die Plattform, kurze Überblendung, dann
     steht man im weiten Revier: eine große Wiese mit Waldrand, das Wild
     150–240 m entfernt. Die Wiese auf der Karte bleibt so klein wie sie ist –
     das Revier liegt weit außerhalb der Karte und wird nur in der
     Ich-Perspektive gezeigt.
   • Wenig Wild (1–2), lange Warten und Suchen mit dem Fernglas.
   • Zielfernrohr 4×/8×/12×, deutliches Schwanken, Atem anhalten (3 s) macht
     den Schuss erst möglich, Wind versetzt das Geschoss (Hinweis zum
     Vorhalten), Geschossflugzeit (laufendes Wild vorhalten).
   • Nur Herz, Lunge, Kopf oder Träger erlegen; Körper- und Laufschüsse:
     das Stück flüchtet krank in den Wald – keine Trophäe.
   • Einsammeln: Überblendung, die Kamera steht in der Totalen und schwenkt um
     das Stück, goldene Funken, die Medaille blendet groß auf, dann schmale
     Leisten oben und unten – die Mitte bleibt frei.

   Begriffe für Three.js-Kenner: Szene = FV.R.nodes, Mesh = fmesh() + fnode(),
   Gruppe/Bone = Kind-Knoten (R.addChild), InstancedMesh = R.instGroup,
   Raycaster = zoneHit (Strahl gegen Kugeln/Ellipsoid im Tier), Tween = ss/lerp. */
const HUNT = (() => {
  "use strict";
  /* ------------------------------ Lage ------------------------------------ */
  const CX = -78, CZ = -24, CR = 14;                  /* Wildwiese auf der Karte */
  const TW = { x: -62.8, z: -21.8 };                  /* Hochsitz am Ostrand */
  const TRY = Math.atan2(CX - TW.x, CZ - TW.z);
  const PH = 4.4, EYE = 1.62;
  const M_PER_U = 4;                                  /* Anzeige: Meter je Einheit */
  /* Revier – nur in der Ich-Perspektive, weit außerhalb der Karte (WGRID endet bei x = −160) */
  const RV = { x: -470, z: -40 }, RVRY = -Math.PI / 2;               /* Hochsitz im Revier, schaut nach Westen (−x) */
  const FC = { x: RV.x - 50, z: RV.z }, FRX = 44, FRZ = 32;           /* Feld: Ellipse vor dem Hochsitz */
  const FOV = 0.95, BINO = 7, ZOOMS = [4, 8, 12];
  const CAMD = 2.5, NEAR = 0.35, FAR = 300, TREE_HI = 80;
  const V0 = 820;                                     /* Mündungsgeschwindigkeit m/s */
  const WIND_K = 5.85e-4;                             /* Abdrift: rad je m/s Seitenwind */
  const DOT = 0.002;                                  /* Haltepunkt-Abstand im Absehen (rad) */
  const NEED = { kiefer: 6, balken: 4, bretter: 3, pfosten: 2, aeste: 10 };   /* Baumaterial (Gebinde) */

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ss = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const angN = a => Math.atan2(Math.sin(a), Math.cos(a));
  const rnd = () => Math.random();
  const snd = k => { if (typeof sfx === "function") sfx(k); };
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* Drehung wie gl3d.js trs(): R = Ry · Rx · Rz */
  function rot(v, rx, ry, rz) {
    let [x, y, z] = v;
    if (rz) { const c = Math.cos(rz), s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c]; }
    if (rx) { const c = Math.cos(rx), s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c]; }
    if (ry) { const c = Math.cos(ry), s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c]; }
    return [x, y, z];
  }
  function unrot(v, rx, ry, rz) {
    let [x, y, z] = v;
    if (ry) { const c = Math.cos(-ry), s = Math.sin(-ry); [x, z] = [x * c + z * s, -x * s + z * c]; }
    if (rx) { const c = Math.cos(-rx), s = Math.sin(-rx); [y, z] = [y * c - z * s, y * s + z * c]; }
    if (rz) { const c = Math.cos(-rz), s = Math.sin(-rz); [x, y] = [x * c - y * s, x * s + y * c]; }
    return [x, y, z];
  }
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const twL = (lx, ly, lz) => { const p = rot([lx, ly, lz], 0, TRY, 0); return [TW.x + p[0], ly, TW.z + p[2]]; };
  const rvL = (lx, ly, lz) => { const p = rot([lx, ly, lz], 0, RVRY, 0); return [RV.x + p[0], ly, RV.z + p[2]]; };
  const EYEP = twL(0, PH + EYE, 0.12);                /* Auge auf dem Hochsitz der Karte */
  const EYER = rvL(0, PH + EYE, 0.12);                /* Auge auf dem Hochsitz im Revier */

  /* Wildwiese auf der Karte */
  const edgeR = a => CR * (1 + 0.1 * Math.sin(3 * a + 1.1) + 0.06 * Math.sin(5 * a + 2.3));
  const polar = (x, z) => ({ d: Math.hypot(x - CX, z - CZ), a: Math.atan2(z - CZ, x - CX) });
  function inMeadow(x, z, m) { const p = polar(x, z); return p.d < edgeR(p.a) + (m || 0); }
  function clear(x, z, kind) {
    const tw = Math.hypot(x - TW.x, z - TW.z);
    if (kind === "tree") return inMeadow(x, z, 2.5) || tw < 4;
    if (kind === "bush") return inMeadow(x, z, -1.2) || tw < 2.6;
    return inMeadow(x, z, 0.6) || tw < 3.4;
  }
  const hexC = a => typeof a === "number" ? [(a >> 16 & 255) / 255, (a >> 8 & 255) / 255, (a & 255) / 255] : a;
  const mixC = (a, b, t) => { const A = hexC(a), B = hexC(b); t = clamp(t, 0, 1); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
  function ground(x, z, c, v) {
    const p = polar(x, z), e = edgeR(p.a);
    if (p.d > e + 3) return c;
    const k = clamp((e + 3 - p.d) / 3.5, 0, 1);
    const w = Math.sin(x * 0.45 + z * 0.2) * Math.cos(z * 0.38 - x * 0.12);
    return mixC(c, w > 0.35 ? 0xa6c95a : v > 0.1 ? 0x93c452 : 0x86ba4a, k);
  }
  /* Feld im Revier: 0 = Mitte, 1 = Waldrand (unregelmäßig) */
  function fieldE(x, z) {
    const dx = (x - FC.x) / FRX, dz = (z - FC.z) / FRZ, a = Math.atan2(dz, dx);
    return Math.hypot(dx, dz) / (1 + 0.08 * Math.sin(3 * a + 0.7) + 0.05 * Math.sin(7 * a + 2.1));
  }
  function fieldPt(e, a) {                            /* Punkt bei Randfaktor e in Richtung a (von der Feldmitte) */
    const k = e * (1 + 0.08 * Math.sin(3 * a + 0.7) + 0.05 * Math.sin(7 * a + 2.1));
    return [FC.x + Math.cos(a) * FRX * k, FC.z + Math.sin(a) * FRZ * k];
  }

  /* ------------------------------ Modelle --------------------------------- */
  const MB = () => new G3.MB();
  /* Balken/Rundholz von a nach b (MB-Teile stehen auf ihrer Grundfläche; Drehung um diesen Punkt) */
  function beam(b, a, e, r, col, round) {
    const v = [e[0] - a[0], e[1] - a[1], e[2] - a[2]], L = Math.hypot(v[0], v[1], v[2]) || 1, n = v.map(q => q / L);
    const o = { x: a[0], y: a[1], z: a[2], rz: -Math.asin(clamp(n[0], -1, 1)), rx: Math.atan2(n[2], n[1]) };
    if (round) b.cyl(r, r * 0.92, L, 6, col, o); else b.box(r * 2, L, r * 2, col, o);
  }
  function towerMesh() {
    G3.seed(7707);
    const b = MB(), W = 0x8a6440, Wd = 0x6a4a2e, Wl = 0xa98457, roof = 0x4a4d44, roofD = 0x3a3c36;
    const top = 0.82, bot = 1.08;
    b.noise(0.16, m => {
      /* vier Stämme, leicht gespreizt */
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => beam(m, [sx * bot, 0, sz * bot], [sx * top, PH, sz * top], 0.09, Wd, true));
      /* Kreuzverstrebungen auf allen vier Seiten, zwei Lagen */
      const at = (sx, sz, y) => { const k = y / PH, r = lerp(bot, top, k); return [sx * r, y, sz * r]; };
      [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]].forEach(([A, B]) => {
        [[0.35, 2.2], [2.25, 4.15]].forEach(([y0, y1]) => {
          beam(m, at(A[0], A[1], y0), at(B[0], B[1], y1), 0.045, W, true);
          beam(m, at(B[0], B[1], y0), at(A[0], A[1], y1), 0.045, W, true);
        });
        beam(m, at(A[0], A[1], 2.22), at(B[0], B[1], 2.22), 0.05, W, true);
      });
      /* Plattform aus Brettern */
      for (let i = 0; i < 9; i++) m.box(0.2, 0.08, 1.95, i % 2 ? Wl : 0xb08b5c, { x: -0.86 + i * 0.215, y: PH - 0.02 });
      m.box(2.0, 0.1, 0.1, Wd, { y: PH - 0.1, z: 0.95 }); m.box(2.0, 0.1, 0.1, Wd, { y: PH - 0.1, z: -0.95 });
      /* Kanzel: Eckpfosten, Brüstung (Bretter), Auflage vorn, Dach */
      const H = PH + 0.06;
      [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]].forEach(([x, z]) => m.box(0.09, 2.0, 0.09, Wd, { x, y: H, z }));
      const planks = (len, along, y0, n, fix) => { for (let i = 0; i < n; i++) fix(i, y0 + i * 0.205); };
      /* Seiten (x = ±0.9) und hinten (z = −0.9, mit Einstieg) */
      planks(0, 0, H, 4, (i, y) => {
        [-0.92, 0.92].forEach(x => m.box(0.05, 0.19, 1.82, i % 2 ? W : Wl, { x, y }));
        m.box(0.62, 0.19, 0.05, i % 2 ? W : Wl, { x: -0.58, y, z: -0.92 });
        m.box(0.62, 0.19, 0.05, i % 2 ? W : Wl, { x: 0.58, y, z: -0.92 });
        m.box(1.82, 0.19, 0.05, i % 2 ? Wl : W, { y, z: 0.92 });
      });
      /* Gewehrauflage mit grünem Filz */
      m.box(1.9, 0.07, 0.22, Wd, { y: H + 0.82, z: 0.92 });
      m.box(1.6, 0.03, 0.16, 0x3f5a3a, { y: H + 0.89, z: 0.92 });
      /* Sitzbrett */
      m.box(1.2, 0.06, 0.34, Wl, { y: PH + 0.48, z: -0.55 });
      [-0.5, 0.5].forEach(x => m.box(0.06, 0.44, 0.3, Wd, { x, y: PH + 0.04, z: -0.55 }));
      /* Dach: zwei Flächen (Satteldach quer), dunkle Pappe */
      const rh = H + 2.0;
      [-1, 1].forEach(s => m.at({ x: s * 0.56, y: rh + 0.16, rz: -s * 0.3 }, q => q.box(1.18, 0.06, 2.3, roof, { c: true, top: roof, bot: roofD })));
      m.box(0.08, 0.08, 2.32, roofD, { y: rh + 0.31 });
      /* Leiter hinten */
      const L0 = [0, 0, -2.05], L1 = [0, PH + 0.05, -0.98];
      [-0.3, 0.3].forEach(dx => beam(m, [L0[0] + dx, 0, L0[2]], [L1[0] + dx, L1[1], L1[2]], 0.045, Wd, true));
      for (let i = 1; i < 14; i++) { const k = i / 14; m.box(0.62, 0.04, 0.05, W, { y: lerp(0, L1[1], k), z: lerp(L0[2], L1[2], k) }); }
    });
    return b;
  }
  /* Bauplatz: abgesteckt, Flatterband, Stammstapel, Bretter, Bock, Schild */
  function siteMesh() {
    G3.seed(7710);
    const b = MB(), W = 0x8a6440, Wd = 0x6a4a2e;
    b.noise(0.12, m => {
      m.plate(3.4, 3.4, 0x8a7350, { y0: 0.012 });
      [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]].forEach(([x, z]) => m.box(0.08, 0.9, 0.08, 0xd9c49a, { x, z }));
      [[[-1.5, -1.5], [1.5, -1.5]], [[1.5, -1.5], [1.5, 1.5]], [[1.5, 1.5], [-1.5, 1.5]], [[-1.5, 1.5], [-1.5, -1.5]]].forEach(([A, B]) => {
        for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 1) / 6; beam(m, [lerp(A[0], B[0], u0), 0.78, lerp(A[1], B[1], u0)], [lerp(A[0], B[0], u1), 0.76, lerp(A[1], B[1], u1)], 0.018, i % 2 ? 0xffffff : 0xe2465f, false); }
      });
      for (let i = 0; i < 5; i++) m.cyl(0.13, 0.12, 2.2, 7, Wd, { rz: Math.PI / 2, x: 1.1 - (i % 3) * 0.02, y: 0.13 + Math.floor(i / 3) * 0.22, z: -0.9 + (i % 3) * 0.27 + Math.floor(i / 3) * 0.13, top: 0xcfae80 });
      for (let i = 0; i < 4; i++) m.box(1.6, 0.05, 0.24, i % 2 ? 0xb08b5c : 0xa98457, { x: 0.2, y: 0.02 + i * 0.055, z: 0.75 });
      [-0.25, 0.25].forEach(x => { beam(m, [x - 0.2, 0, -0.1], [x, 0.55, -0.1], 0.03, W, true); beam(m, [x + 0.2, 0, -0.1], [x, 0.55, -0.1], 0.03, W, true); });
      m.box(0.9, 0.06, 0.08, W, { y: 0.52, z: -0.1 });
      m.box(0.07, 1.25, 0.07, Wd, { x: -1.25, z: 1.3 });
      m.box(0.55, 0.36, 0.04, 0xead9b4, { x: -1.25, y: 0.95, z: 1.33 });
    });
    return b;
  }

  /* Farben */
  const DC = { coat: 0x9a5f34, coatD: 0x7a4626, belly: 0xc49a6a, rump: 0xead9bd, neck: 0x6b4224, hoof: 0x2a221c, nose: 0x2a2220, ant: 0x8c7454, antT: 0xeee2c6, earIn: 0xd6a98a };
  const BC = { coat: 0x5a4a3d, coatD: 0x473a30, ridge: 0x2b231d, snout: 0x9c7d70, tusk: 0xf3ecd9, hoof: 0x1d1814, belly: 0x3d3229 };
  const FC_ = { body: 0xb5602c, bodyD: 0x8c4520, neck: 0x1c4c57, head: 0x173b45, red: 0xd2281e, ring: 0xf4f1e8, beak: 0xdcc58b, tail: 0x9b6a3b, tailD: 0x5e3e22, wing: 0xa27648, leg: 0x7d7468 };
  const FCc = FC_;

  /* Rothirsch mit Gelenken: Rumpf · Träger (Hals) · Haupt (Kopf) · Lauscher · Wedel · Läufe (Ober- und Unterteil) */
  function deerBody() {
    G3.seed(5101);
    const b = MB();
    b.noise(0.07, m => {
      m.sphere(0.5, 10, 7, DC.coat, { y: 0.98, sx: 0.42, sy: 0.45, sz: 1.0, bottom: DC.belly });
      m.sphere(0.27, 8, 6, DC.coatD, { y: 0.97, z: 0.3, sx: 0.82, sy: 0.9, sz: 1.0 });
      m.sphere(0.12, 7, 5, DC.rump, { y: 0.99, z: -0.41, sx: 1.35, sy: 1.2, sz: 0.55 });          /* Spiegel (heller Fleck am Hinterteil) */
    });
    return b;
  }
  function deerNeck() {
    const b = MB();
    b.noise(0.06, m => {
      beam(m, [0, -0.05, -0.03], [0, 0.5, 0.22], 0.1, DC.neck, false);
      m.sphere(0.14, 7, 5, DC.neck, { y: 0.1, z: 0.04, sx: 0.95, sy: 1.35, sz: 1.0 });   /* Mähne am Widerrist */
    });
    return b;
  }
  function antlers(b, P, sc, base) {
    base = base || [0, 0.62, 0.3];
    const n = Math.max(3, Math.round(P / 2)), L = 0.42 + sc * 0.34, th = 0.026 + sc * 0.014;
    [-1, 1].forEach(s => {
      const pts = [[base[0] + s * 0.06, base[1], base[2]]];
      const dirs = [[s * 0.55, 0.75, -0.25], [s * 0.3, 0.92, -0.2], [s * 0.1, 0.98, -0.12], [-s * 0.15, 0.95, 0.1]];
      dirs.forEach((d, i) => { const l = Math.hypot(...d), q = pts[i]; pts.push([q[0] + d[0] / l * L * 0.27, q[1] + d[1] / l * L * 0.27, q[2] + d[2] / l * L * 0.27]); });
      for (let i = 0; i < 4; i++) beam(b, pts[i], pts[i + 1], th * (1 - i * 0.14), i < 3 ? DC.ant : DC.antT, true);
      for (let k = 0; k < n - 1; k++) {
        const u = (k + 0.6) / (n - 0.3), seg = Math.min(3, Math.floor(u * 4)), f = u * 4 - seg;
        const a = pts[seg], e = pts[seg + 1], q = [lerp(a[0], e[0], f), lerp(a[1], e[1], f), lerp(a[2], e[2], f)];
        const crown = u > 0.72, len = (k === 0 ? 0.17 : crown ? 0.11 : 0.14) * (0.8 + sc * 0.45);
        const dir = k === 0 ? [s * 0.05, 0.35, 0.95] : crown ? [s * (0.2 + k * 0.05), 0.9, k % 2 ? 0.35 : -0.25] : [s * 0.12, 0.55, 0.8];
        const dl = Math.hypot(...dir);
        beam(b, q, [q[0] + dir[0] / dl * len, q[1] + dir[1] / dl * len, q[2] + dir[2] / dl * len], th * 0.72, DC.antT, true);
      }
    });
  }
  function deerHead(P, sc) {
    G3.seed(5102 + P);
    const b = MB();
    b.noise(0.06, m => {
      m.box(0.15, 0.16, 0.28, DC.coat, { y: 0.02, z: 0.13, c: true });
      m.box(0.1, 0.1, 0.16, DC.coatD, { y: -0.03, z: 0.31, c: true });
      m.box(0.07, 0.05, 0.04, DC.nose, { y: -0.02, z: 0.395, c: true });
      [-1, 1].forEach(s => m.box(0.028, 0.03, 0.02, 0x15120f, { x: s * 0.07, y: 0.05, z: 0.16, c: true }));
      antlers(m, P, sc, [0, 0.09, 0.04]);
    });
    return b;
  }
  function deerEar(s) { const b = MB(); b.at({ rz: -s * 0.85, rx: -0.15 }, q => { q.box(0.055, 0.14, 0.022, DC.coat); q.box(0.035, 0.1, 0.006, DC.earIn, { y: 0.02, z: 0.013 }); }); return b; }
  function deerTail() { const b = MB(); b.box(0.07, 0.14, 0.05, DC.coatD, { y: -0.14 }); b.box(0.06, 0.12, 0.012, DC.rump, { y: -0.13, z: -0.028 }); return b; }
  function deerUpper(front) { const b = MB(); b.noise(0.05, m => { if (front) m.box(0.1, 0.42, 0.11, DC.coatD, { y: -0.4 }); else { m.box(0.13, 0.44, 0.15, DC.coat, { y: -0.42 }); } }); return b; }
  function deerLower(front) { const b = MB(); b.box(0.055, 0.4, 0.06, DC.coatD, { y: -0.4 }); b.box(0.072, 0.06, 0.085, DC.hoof, { y: front ? -0.44 : -0.44, z: 0.01 }); return b; }
  function boarBody() {
    G3.seed(5201);
    const b = MB();
    b.noise(0.12, m => {
      m.sphere(0.5, 9, 7, BC.coat, { y: 0.5, sx: 0.4, sy: 0.4, sz: 0.95, bottom: BC.belly });     /* Rumpf */
      m.sphere(0.27, 8, 6, BC.coatD, { y: 0.55, z: 0.22, sx: 0.8, sy: 0.85, sz: 1.15, bottom: BC.belly });   /* hohe Schulter */
      beam(m, [0, 0.77, 0.32], [0, 0.71, -0.2], 0.022, BC.ridge, false);                        /* Borstenkamm */
      for (let i = 0; i < 6; i++) m.box(0.035, 0.07, 0.05, BC.ridge, { y: 0.76 - i * 0.012, z: 0.3 - i * 0.1, rx: -0.3 });
      m.box(0.025, 0.16, 0.025, BC.ridge, { y: 0.44, z: -0.46, rx: 0.5 });                       /* Pürzel */
    });
    return b;
  }
  function boarLeg() { const b = MB(); b.box(0.09, 0.26, 0.1, BC.coatD, { y: -0.3 }); b.box(0.07, 0.05, 0.08, BC.hoof, { y: -0.34 }); return b; }
  function boarHead(sc) {
    G3.seed(5202);
    const b = MB(), tl = 0.06 + sc * 0.06;
    b.noise(0.1, m => {
      /* Kopf als langer Keil, leicht nach unten; vorn die helle Scheibe (Wurf) */
      m.at({ y: 0.02, z: 0.08, rx: Math.PI / 2 + 0.38 }, q => q.cyl(0.17, 0.07, 0.52, 6, BC.coatD, { a0: Math.PI / 6, top: BC.snout }));
      m.box(0.15, 0.12, 0.035, BC.snout, { y: -0.2, z: 0.57, c: true, front: 0xb29384 });
      [-1, 1].forEach(s => {
        m.box(0.022, 0.022, 0.02, 0x0e0b09, { x: s * 0.075, y: 0.0, z: 0.3, c: true });
        m.at({ x: s * 0.1, y: 0.1, z: 0.12, rz: -s * 0.55, rx: -0.3 }, q => q.box(0.07, 0.13, 0.03, BC.coatD));
        /* Waffen: aus dem Unterkiefer nach außen und oben */
        beam(m, [s * 0.065, -0.2, 0.5], [s * (0.1 + tl * 0.35), -0.2 + tl * 0.85, 0.47 + tl * 0.15], 0.013 + sc * 0.006, BC.tusk, true);
      });
    });
    return b;
  }
  /* Fasanenhahn */
  function phBody() {
    G3.seed(5301);
    const b = MB();
    b.noise(0.12, m => {
      m.sphere(0.13, 8, 6, FCc.body, { y: 0.24, sx: 0.85, sy: 0.85, sz: 1.45, bottom: FCc.bodyD });
      m.sphere(0.07, 6, 4, FCc.wing, { x: 0.08, y: 0.27, z: -0.03, sx: 0.5, sz: 1.6 });
      m.sphere(0.07, 6, 4, FCc.wing, { x: -0.08, y: 0.27, z: -0.03, sx: 0.5, sz: 1.6 });
      m.at({ y: 0.28, z: -0.15, rx: 0.33 }, q => {                                                /* langer Stoß, schräg nach oben */
        q.box(0.055, 0.02, 0.32, FCc.tail, { z: -0.16, c: true }); q.box(0.022, 0.024, 0.32, FCc.tailD, { z: -0.16, c: true });
        q.box(0.03, 0.016, 0.22, FCc.tail, { z: -0.42, c: true }); q.box(0.012, 0.02, 0.22, FCc.tailD, { z: -0.42, c: true });
      });
      [-1, 1].forEach(s => m.box(0.018, 0.14, 0.02, FCc.leg, { x: s * 0.04, y: 0.02, z: 0.02 }));
    });
    return b;
  }
  function phHead() {
    const b = MB();
    b.box(0.055, 0.13, 0.06, FCc.neck, { y: 0, z: 0 });
    b.box(0.07, 0.025, 0.07, FCc.ring, { y: 0.01 });
    b.sphere(0.045, 6, 4, FCc.head, { y: 0.15, z: 0.02 });
    b.box(0.05, 0.035, 0.04, FCc.red, { y: 0.15, z: 0.04, c: true });
    b.box(0.018, 0.018, 0.04, FCc.beak, { y: 0.145, z: 0.08, c: true });
    return b;
  }
  function phWing(s) {
    const b = MB();
    b.quad([0, 0, 0.08], [s * 0.3, 0.01, 0.03], [s * 0.26, 0.01, -0.1], [0, 0, -0.08], FCc.wing);
    b.quad([0, 0, -0.08], [s * 0.26, 0.01, -0.1], [s * 0.3, 0.01, 0.03], [0, 0, 0.08], FCc.bodyD);
    return b;
  }
  /* Blutstropfen (Schweiß) am Boden */
  function dropMesh() { const b = MB(); b.disc(0.07, 7, 0x7d1912, { y0: 0.025, wob: 0.3 }); b.disc(0.035, 6, 0x9c2216, { x: 0.09, z: 0.04, y0: 0.026 }); return b; }
  /* ------------------------------ Arten ----------------------------------- */
  /* Trefferzonen (Tierkoordinaten vor Maßstab). Hals- und Kopfpunkte in Hals- bzw. Kopfkoordinaten. */
  const SP = {
    hirsch: { n: "Rothirsch", i: "🦌", walk: 0.85, sneak: 0.5, run: 10.5, s0: 0.98, s1: 1.12, lie: 0.24,
      legs: [{ h: [-0.12, 0.84, 0.34], lu: 0.4, ll: 0.44, f: 1 }, { h: [0.12, 0.84, 0.34], lu: 0.4, ll: 0.44, f: 1 }, { h: [-0.12, 0.86, -0.34], lu: 0.42, ll: 0.44, f: 0 }, { h: [0.12, 0.86, -0.34], lu: 0.42, ll: 0.44, f: 0 }],
      neckP: [0, 1.02, 0.4], headP: [0, 0.5, 0.22], body: { c: [0, 0.98, 0], r: [0.2, 0.22, 0.5] }, lung: { c: [0, 0.96, 0.24], r: 0.12 }, heart: { c: [0, 0.88, 0.28], r: 0.07 },
      head: { c: [0, 0.0, 0.18], r: 0.11 }, neckZ: [[0, 0.05, 0.02], [0, 0.46, 0.2]], neckR: 0.095, sens: 1.3, orbit: 8.6 },
    keiler: { n: "Keiler", i: "🐗", walk: 1.1, sneak: 0.8, run: 8.0, s0: 0.92, s1: 1.15, lie: 0.21,
      legs: [{ h: [-0.11, 0.36, 0.24], lu: 0.36, ll: 0, f: 1 }, { h: [0.11, 0.36, 0.24], lu: 0.36, ll: 0, f: 1 }, { h: [-0.11, 0.36, -0.26], lu: 0.36, ll: 0, f: 0 }, { h: [0.11, 0.36, -0.26], lu: 0.36, ll: 0, f: 0 }],
      neckP: [0, 0.6, 0.4], headP: [0, 0, 0], body: { c: [0, 0.53, 0], r: [0.21, 0.23, 0.46] }, lung: { c: [0, 0.52, 0.2], r: 0.11 }, heart: { c: [0, 0.46, 0.24], r: 0.06 },
      head: { c: [0, -0.06, 0.32], r: 0.14 }, neckZ: [[0, 0.02, 0.0], [0, 0.0, 0.14]], neckR: 0.12, sens: 1.2, orbit: 6.4 },
    fasan: { n: "Fasan", i: "🐦", walk: 0.45, sneak: 0.35, run: 1.8, s0: 1.2, s1: 1.4, lie: 0.1, legs: [],
      neckP: [0, 0.22, 0.15], headP: [0, 0, 0], body: { c: [0, 0.24, -0.02], r: [0.13, 0.13, 0.2] }, lung: null, heart: null,
      head: { c: [0, 0.14, 0.03], r: 0.06 }, neckZ: [[0, 0.0, 0.0], [0, 0.1, 0.0]], neckR: 0.04, sens: 1.5, orbit: 3.4 }
  };
  const MEDALS = [null, { n: "Bronze", i: "🥉", c: "#c47a3a" }, { n: "Silber", i: "🥈", c: "#9aa4b1" }, { n: "Gold", i: "🥇", c: "#e0a51e" }, { n: "Diamant", i: "💎", c: "#38b6d8" }];
  const PRICE = { hirsch: [0, 180, 420, 950, 2600], keiler: [0, 120, 300, 700, 1900], fasan: [0, 40, 90, 200, 520] };
  const XP = { hirsch: [0, 14, 22, 34, 60], keiler: [0, 10, 16, 26, 46], fasan: [0, 4, 7, 11, 20] };
  /* kill: erlegt (Trophäe), sonst flüchtet das Stück krank und ist verloren. bonus: Medaillen-Zuschlag, cap: höchste Medaille */
  const ZONE = {
    herz:    { n: "Herzschuss", kill: true, run: [0, 3], cap: 4, bonus: 0.05 },
    lunge:   { n: "Lungenschuss", kill: true, run: [6, 16], cap: 4, bonus: 0.02 },
    hals:    { n: "Trägerschuss", kill: true, run: [0, 0.5], cap: 3, bonus: 0 },
    kopf:    { n: "Kopfschuss", kill: true, run: [0, 0], cap: 2, bonus: 0, note: "Kopfschuss – das Haupt ist beschädigt, höchstens Silber." },
    koerper: { n: "Weichschuss", kill: false },
    lauf:    { n: "Laufschuss", kill: false },
    vogel:   { n: "Treffer im Flug", kill: true, run: [0, 0], cap: 4, bonus: 0 }
  };
  function drawScore(r) { r = r || rnd; return clamp(0.16 + 0.8 * (r() + r() + r()) / 3 + (r() < 0.06 ? 0.12 : 0), 0, 1); }
  function medalOf(score, zone) {
    const Z = ZONE[zone];
    if (!Z || !Z.kill) return 0;
    const e = score + Z.bonus;
    return Math.min(e >= 0.9 ? 4 : e >= 0.72 ? 3 : e >= 0.5 ? 2 : 1, Z.cap);
  }
  function traits(k, s) {
    if (k === "hirsch") {
      const P = 2 * Math.round(3 + s * 5);
      return { P, kg: Math.round(92 + s * 115), name: s < 0.38 ? "Junger Rothirsch" : s < 0.68 ? "Rothirsch" : s < 0.86 ? "Kapitaler Rothirsch" : "Mächtiger Rothirsch", troph: P + "-Ender Geweih" };
    }
    if (k === "keiler") {
      const cm = Math.round(8 + s * 16);
      return { cm, kg: Math.round(55 + s * 112), name: s < 0.35 ? "Junger Keiler" : s < 0.7 ? "Keiler" : s < 0.88 ? "Kapitaler Keiler" : "Hauptschwein", troph: "Keilerwaffen · " + cm + " cm" };
    }
    const cm = Math.round(36 + s * 26);
    return { cm, kg: Math.round((0.95 + s * 0.65) * 10) / 10, name: s < 0.7 ? "Fasanenhahn" : "Prächtiger Fasanenhahn", troph: (s >= 0.7 ? "Pracht-" : "") + "Fasanenfeder · " + cm + " cm" };
  }
  const trophyId = (k, m) => "tro_" + k + "_" + m;
  function registerItems() {
    if (typeof FITEMS === "undefined") return;
    const nm = { hirsch: "Hirschgeweih", keiler: "Keilerwaffen", fasan: "Fasanenfeder" };
    Object.keys(PRICE).forEach(k => [1, 2, 3, 4].forEach(m => {
      FITEMS[trophyId(k, m)] = { n: nm[k] + " (" + MEDALS[m].n + ")", sg: nm[k] + " (" + MEDALS[m].n + ")", i: MEDALS[m].i, k: "troph", a: 1, u: "", pk: "Trophäe", v: PRICE[k][m], kg: k === "fasan" ? 0.1 : 2, xp: 0, st: "troph", hunt: k, medal: m };
    }));
    if (typeof FSTORE !== "undefined") FSTORE.troph = { n: "Trophäen", i: "🏆", the: "Die Trophäenwand", base: 24, step: 12, cost: [400, 900, 1600, 2600, 4000],
      empty: "Noch keine Trophäen. Steig auf den Hochsitz an der Wildwiese." };
  }
  registerItems();
  /* Trophäe als 3D-Bildchen: Brett mit Geweih, Waffen oder Feder, Medaille unten */
  function trophyMesh(id) {
    const it = typeof FITEMS !== "undefined" && FITEMS[id], k = it ? it.hunt : "hirsch", m = it ? it.medal : 1;
    G3.seed(5400 + m);
    const b = MB(), mc = [0, 0xc47a3a, 0xb9c2cc, 0xe8b02a, 0x52c8e8][m];
    b.at({ rx: -0.35 }, q => {
      q.cyl(0.42, 0.42, 0.08, 7, 0x6b4428, { rx: Math.PI / 2, a0: Math.PI / 14, top: 0x7d5232 });
      q.cyl(0.12, 0.12, 0.1, 10, mc, { rx: Math.PI / 2, y: -0.3, top: mc });
      if (k === "hirsch") q.at({ y: -0.42, z: 0.05, s: 1.15 }, r => antlers(r, m * 2 + 6, 0.35 + m * 0.15));
      else if (k === "keiler") [-1, 1].forEach(s => beam(q, [s * 0.06, -0.05, 0.08], [s * 0.3, 0.32, 0.12], 0.035, BC.tusk, true));
      else { beam(q, [0.1, -0.25, 0.08], [-0.12, 0.45, 0.1], 0.04, FCc.tail, false); beam(q, [0.11, -0.25, 0.1], [-0.11, 0.45, 0.12], 0.018, FCc.tailD, false); }
    });
    return b;
  }
  if (typeof FWM !== "undefined" && FWM.item && !FWM.__huntItem) {
    const base = FWM.item; FWM.item = id => /^tro_/.test(id) ? trophyMesh(id) : base(id); FWM.__huntItem = true;
    if (typeof ITEM_3D !== "undefined") Object.keys(PRICE).forEach(k => [1, 2, 3, 4].forEach(m => ITEM_3D.add(trophyId(k, m))));
  }
  if (typeof FWM !== "undefined" && FWM.item && !FWM.__huntItem) {
    const base = FWM.item; FWM.item = id => /^tro_/.test(id) ? trophyMesh(id) : base(id); FWM.__huntItem = true;
    if (typeof ITEM_3D !== "undefined") Object.keys(PRICE).forEach(k => [1, 2, 3, 4].forEach(m => ITEM_3D.add(trophyId(k, m))));
  }

  /* --------------------------- Treffertest -------------------------------- */
  function raySphere(o, d, c, r) {
    const ox = o[0] - c[0], oy = o[1] - c[1], oz = o[2] - c[2];
    const a = d[0] * d[0] + d[1] * d[1] + d[2] * d[2], b = 2 * (ox * d[0] + oy * d[1] + oz * d[2]), q = ox * ox + oy * oy + oz * oz - r * r;
    const D = b * b - 4 * a * q;
    if (D < 0) return null;
    const s = Math.sqrt(D), t0 = (-b - s) / (2 * a), t1 = (-b + s) / (2 * a);
    return t1 < 0 ? null : Math.max(0, t0);
  }
  function rayEll(o, d, c, r) { return raySphere([(o[0] - c[0]) / r[0], (o[1] - c[1]) / r[1], (o[2] - c[2]) / r[2]], [d[0] / r[0], d[1] / r[1], d[2] / r[2]], [0, 0, 0], 1); }
  /* Pose: Lage (x, y, z, rx, ry, rz, s), Hals (nrx, nry), Kopf (hrx), Läufe [[oben, unten], …] */
  function zoneHit(k, pose, o, d) {
    const S0 = SP[k], s = pose.s || 1;
    const lo = unrot([(o[0] - pose.x) / s, (o[1] - (pose.y || 0)) / s, (o[2] - pose.z) / s], pose.rx || 0, pose.ry || 0, pose.rz || 0);
    const ld = unrot([d[0] / s, d[1] / s, d[2] / s], pose.rx || 0, pose.ry || 0, pose.rz || 0);
    const hits = [];
    const tb = rayEll(lo, ld, S0.body.c, S0.body.r); if (tb != null) hits.push(["body", tb]);
    const nk = p => add3(S0.neckP, rot(p, pose.nrx || 0, pose.nry || 0, 0));                 /* Halskoordinaten → Tier */
    const hd = p => nk(add3(S0.headP, rot(p, pose.hrx || 0, 0, 0)));                         /* Kopfkoordinaten → Tier */
    const th = raySphere(lo, ld, hd(S0.head.c), S0.head.r); if (th != null) hits.push(["kopf", th]);
    const [n0, n1] = S0.neckZ;
    for (let i = 0; i <= 4; i++) { const u = i / 4, t = raySphere(lo, ld, nk([lerp(n0[0], n1[0], u), lerp(n0[1], n1[1], u), lerp(n0[2], n1[2], u)]), S0.neckR); if (t != null) hits.push(["hals", t]); }
    S0.legs.forEach((L, i) => {
      const a = (pose.legs && pose.legs[i]) || [0, 0];
      for (let j = 1; j <= 4; j++) {
        const up = rot([0, -L.lu * j / 4, 0], a[0], 0, 0), t = raySphere(lo, ld, add3(L.h, up), 0.06); if (t != null) hits.push(["lauf", t]);
        if (L.ll) { const lp = add3(L.h, rot(add3([0, -L.lu, 0], rot([0, -L.ll * j / 4.2, 0], a[1], 0, 0)), a[0], 0, 0)), t2 = raySphere(lo, ld, lp, 0.045); if (t2 != null) hits.push(["lauf", t2]); }
      }
    });
    if (!hits.length) return null;
    hits.sort((a, b) => a[1] - b[1]);
    const [part, t] = hits[0];
    let zone = part;
    if (part === "body") {
      if (k === "fasan") zone = "vogel";
      else if (S0.heart && raySphere(lo, ld, S0.heart.c, S0.heart.r) != null) zone = "herz";
      else if (S0.lung && raySphere(lo, ld, S0.lung.c, S0.lung.r) != null) zone = "lunge";
      else zone = "koerper";
    } else if (k === "fasan") zone = part === "kopf" ? "kopf" : "vogel";
    return { zone, t };
  }
  /* Wind: Abdrift (rad) und Haltepunkte (Punkte des Absehens). windDir = wohin er weht, aim = Schussrichtung (beides Welt-Winkel atan2(z, x)) */
  function windDrift(v, windDir, aim) { return v * Math.sin(windDir - aim) * WIND_K; }
  const holdDots = drift => -drift / DOT;

  /* --------------------------- Spielstand --------------------------------- */
  const unlocked = () => typeof sawRepaired === "function" && typeof farmAreaOpen === "function" && farmAreaOpen("saege") && sawRepaired();
  function st() {
    const F = typeof S !== "undefined" && S.farm;
    if (!F) return null;
    const H = F.hunt || (F.hunt = { stock: 2, at: S.time, shots: 0, kills: 0, lost: 0, log: [], best: 0 });
    if (H.built == null) H.built = (H.shots > 0 || H.kills > 0) ? S.time : 0;       /* v107: wer schon gejagt hat, behält den Hochsitz */
    if (H.v108 == null) { H.v108 = 1; H.stock = Math.min(H.stock, 2); }
    /* Wild kommt zurück: alle 120 Spielminuten eins, höchstens zwei */
    const gain = Math.floor((S.time - H.at) / 120);
    if (gain > 0) { H.stock = Math.min(2, H.stock + gain); H.at += gain * 120; }
    if (H.stock >= 2) H.at = S.time;
    return H;
  }
  const built = () => { const H = st(); return !!(H && H.built); };

  /* ------------------------------ Welt ------------------------------------ */
  const W = { root: null, site: null, grow: null, chk: 0 };
  function attach(R) {
    W.root = fnode(fmesh("hunt_tower_v107", towerMesh), { x: TW.x, y: 0, z: TW.z, ry: TRY, visible: false });
    W.site = fnode(fmesh("hunt_site_v108", siteMesh), { x: TW.x, y: 0, z: TW.z, ry: TRY, visible: false });
    R.nodes.push(W.root, W.site);
    syncWorld();
    return W.root;
  }
  function syncWorld() {
    if (!W.root) return;
    const ok = unlocked(), b = built();
    if (!W.grow) W.root.visible = b;
    W.site.visible = ok && !b;
  }
  function pick(x, y) {
    if (!FV.R || !W.root || (!W.root.visible && !W.site.visible)) return null;
    const R = FV.R, r = R.ray(x, y);
    const top = W.root.visible ? PH + 2.6 : 1.4;
    const d = R.hitBox(r, [TW.x - 1.8, 0, TW.z - 1.8], [TW.x + 1.8, top, TW.z + 1.8]);
    return d != null ? { d } : null;
  }
  const missing = () => typeof farmMissing === "function" ? farmMissing(NEED) : [];
  function tagInfo() {
    if (!unlocked()) return null;
    const H = st();
    if (!H.built) { const ok = !missing().length; return { x: TW.x, y: 2.2, z: TW.z, html: "🔨" + (ok ? "✅" : "🪵"), cls: ok ? "ready" : "" }; }
    return { x: TW.x, y: PH + 3.2, z: TW.z, html: "🔭" + (H.stock ? "<b>" + H.stock + "</b>" : "") + (MW.A && MW.A.node.visible && !X ? (MW.A.k === "hirsch" ? "🦌" : "🐗") : ""), cls: H.stock ? "ready" : "" };
  }
  const dots = n => "●".repeat(n) + "○".repeat(Math.max(0, 2 - n));
  function sheet() {
    if (!unlocked() && !built()) return;
    const H = st();
    FV.sheetFn = sheet;
    if (!H.built) return buildSheet();
    const best = H.best ? MEDALS[H.best].i + " " + MEDALS[H.best].n : "–";
    const wait = H.stock < 2 ? Math.max(1, Math.ceil(120 - (S.time - H.at))) : 0;
    openFarmSheet(`<div class="fs-h"><span class="fs-ic">🔭</span>Hochsitz an der Wildwiese<small>Wild im Revier: <b class="hu-dots">${dots(H.stock)}</b>${wait ? " · nächstes Stück in " + fdur(wait) : ""}</small></div>
      <div class="fs-sub">Oben öffnet sich das Revier: das Wild steht 150 bis 240 Meter entfernt. Such es mit dem Fernglas, halte den Atem an und achte auf den Wind. Nur Herz, Lunge, Kopf oder Träger bringen eine Trophäe.</div>
      <div class="hu-stats"><span>🎯 ${H.shots} Schüsse</span><span>🏆 ${H.kills} Trophäen</span>${H.lost ? `<span>🩸 ${H.lost} krank geflüchtet</span>` : ""}<span>Beste: ${best}</span></div>
      <div class="fs-row"><button class="btn" id="huUp">🪜 Hinaufsteigen</button><button class="btn tiny ghost" id="huStore">🏆 Trophäen ansehen</button></div>`, "hunt");
    $("#huUp").onclick = () => { closeFarmSheet(); begin(); };
    $("#huStore").onclick = () => { closeFarmSheet(); if (typeof openFarmStore === "function") openFarmStore("troph"); };
  }
  function buildSheet() {
    FV.sheetFn = buildSheet;
    const miss = missing(), ok = !miss.length;
    const ic = id => typeof icHTML === "function" ? icHTML(id) : FITEMS[id].i;
    const rows = Object.keys(NEED).map(id => { const have = farmInv(id), need = NEED[id], done = have >= need;
      return `<div class="hu-need${done ? " ok" : ""}"><span class="hu-ni">${ic(id)}</span><b>${esc(fqty(id, need))}</b><small>${done ? "✓ da" : "im Lager: " + esc(famt(id, have) || "0")}</small></div>`; }).join("");
    openFarmSheet(`<div class="fs-h"><span class="fs-ic">🔨</span>Bauplatz für einen Hochsitz<small>vom Förster an der Wildwiese abgesteckt</small></div>
      <div class="fs-sub">Für den Hochsitz brauchst du Holz aus dem Wald und aus dem Sägewerk. Leg das Material hier ab, dann wird gebaut.</div>
      <div class="hu-needs">${rows}</div>
      <div class="fs-row"><button class="btn${ok ? "" : " disabled"}" id="huBuild">${ok ? "🔨 Hochsitz bauen" : "🔒 Es fehlt noch Material"}</button></div>`, "hunt");
    $("#huBuild").onclick = () => { if (!missing().length) { closeFarmSheet(); buildNow(); } else snd("bad"); };
  }
  function buildNow() {
    const H = st();
    if (H.built || missing().length) return false;
    Object.keys(NEED).forEach(id => farmTake(id, NEED[id]));
    H.built = S.time; H.stock = 2; H.at = S.time;
    W.site.visible = false;
    W.grow = { t: 0 }; W.root.visible = true; W.root.sy = 0.05;
    if (FV.R) for (let i = 0; i < 4; i++) setTimeout(() => FV.R && FV.R.burst({ x: TW.x, y: 0.4 + i * 1.2, z: TW.z, n: 14, col: [[0.75, 0.62, 0.45, 1], [0.6, 0.5, 0.38, 1]], speed: 2.2, up: 1.6, size: 0.12, spread: 2.4, life: 1.1, shape: 1 }), i * 180);
    snd("build"); setTimeout(() => snd("build"), 300); setTimeout(() => snd("level"), 900);
    if (typeof farmXP === "function") farmXP(40);
    if (typeof farmFocusXZ === "function") farmFocusXZ(TW.x + 4, TW.z + 6, 26, 800);
    if (typeof toast === "function") setTimeout(() => toast("🔭 Der Hochsitz steht – steig hinauf, das Revier wartet.", "good"), 1100);
    save();
    return true;
  }
  /* Freischaltung: einmal Bescheid vom Förster */
  function announce() {
    const H = st();
    if (!H || H.ann || H.built || !unlocked()) return;
    H.ann = S.time;
    if (typeof phoneMsg === "function") phoneMsg({ from: "Förster Bruno Wendt", kind: "info", title: "Ein Hochsitz für die Wildwiese", go: "hunt", goLabel: "Zum Bauplatz",
      body: "Moin! Seit Krügers Sägewerk wieder läuft, kommt das Wild zurück. An der Wildwiese westlich vom Sägewerk habe ich dir einen Bauplatz für einen Hochsitz abgesteckt. Bring " +
        Object.keys(NEED).map(id => fqty(id, NEED[id])).join(", ") + " – dann kannst du ins Revier. Waidmannsheil, Bruno" });
    save();
  }
  if (typeof MSG_GO !== "undefined") MSG_GO.hunt = () => {
    if (typeof showTab === "function") showTab("farm");
    setTimeout(() => { if (!FV.R) return; if (typeof closeFarmSheet === "function") closeFarmSheet(); if (typeof farmFocusXZ === "function") farmFocusXZ(TW.x + 4, TW.z + 6, 26, 700); setTimeout(() => { if (FV.on) sheet(); }, 760); }, 250);
  };
  function worldStep(dt) {
    if (!W.root) return;
    W.chk -= dt;
    if (W.chk <= 0) { W.chk = 1.5; syncWorld(); announce(); }
    mwStep(dt, W.tm = (W.tm || 0) + dt);
    if (W.grow) {                                        /* der Hochsitz wächst aus dem Boden und federt nach */
      const G = W.grow; G.t += dt;
      const k = G.t / 1.1, e = k < 1 ? 1 - Math.pow(1 - k, 3) : 1 + Math.sin((k - 1) * 9) * 0.06 * Math.max(0, 1 - (k - 1) * 2.5);
      W.root.sy = Math.max(0.05, e); W.root.sx = W.root.sz = 1 + (1 - Math.min(1, k)) * 0.15;
      if (G.t > 2) { W.root.sx = W.root.sy = W.root.sz = 1; W.grow = null; }
    }
  }

  /* ------------------------ Wild auf der Wildwiese (v111) ------------------ */
  /* Wenn der Hochsitz steht und Wild im Revier ist, zieht hin und wieder ein Hirsch oder Keiler über die Wiese
     auf der Karte: tritt vom Waldrand herein, äst ein paar Dutzend Sekunden, zieht wieder ab. Steigt man in
     dieser Zeit auf den Hochsitz, steht genau dieses Tier (gleiche Art, gleiche Güte, gleiche Lage zum Hochsitz)
     im Revier vor dir. Bleibt es dort unversehrt, ist es beim Abstieg wieder auf der Wiese. */
  const MW = { A: null, t: 10 };
  const A_CT = Math.atan2(TW.z - CZ, TW.x - CX);                          /* Wiesenmitte → Hochsitz */
  let rvAng = null;
  const aCR = () => rvAng != null ? rvAng : (rvAng = Math.atan2(EYER[2] - FC.z, EYER[0] - FC.x));
  /* Wiese → Revier: gleicher Winkel zum Hochsitz, gleicher Randfaktor */
  function toRv(x, z, emax) {
    const dx = x - CX, dz = z - CZ, e = Math.min(Math.hypot(dx, dz) / CR, emax || 0.8);
    return fieldPt(e, Math.atan2(dz, dx) - A_CT + aCR());
  }
  function fromRv(x, z) {
    const e = Math.min(fieldE(x, z), 0.95), a = Math.atan2((z - FC.z) / FRZ, (x - FC.x) / FRX) - aCR() + A_CT;
    return [CX + Math.cos(a) * e * CR, CZ + Math.sin(a) * e * CR];
  }
  function mwSpawn() {
    const hr = (S.time % 1440) / 60;
    const k = hr >= 21 || hr < 5 ? "keiler" : hr >= 17 ? (rnd() < 0.55 ? "hirsch" : "keiler") : (rnd() < 0.78 ? "hirsch" : "keiler");
    const score = drawScore(), a = A_CT + Math.PI + (rnd() - 0.5) * 2.2, a2 = a + Math.PI + (rnd() - 0.5) * 1.4, d2 = CR * (0.15 + rnd() * 0.45);
    const x = CX + Math.cos(a) * CR * 1.22, z = CZ + Math.sin(a) * CR * 1.22, tx = CX + Math.cos(a2) * d2, tz = CZ + Math.sin(a2) * d2;
    const s = k === "hirsch" ? 1.05 + score * 0.3 : 1.05 + score * 0.25;
    const mesh = k === "hirsch" ? fmesh("wild:deer", () => FWM.deer(false)) : fmesh("wild:boar", FWM.boar);
    const node = fnode(mesh, { x, z, s, ry: Math.atan2(tx - x, tz - z), visible: false, alpha: 0 });
    FV.R.nodes.push(node);
    MW.A = { k, score, node, x, z, tx, tz, st: "walk", t: 0, stay: 25 + rnd() * 35, leaving: false, ph: rnd() * 6.28 };
  }
  function mwDrop() {
    const M = MW.A; if (!M) return;
    const i = FV.R ? FV.R.nodes.indexOf(M.node) : -1; if (i >= 0) FV.R.nodes.splice(i, 1);
    MW.A = null; MW.t = 55 + rnd() * 70;
  }
  function mwStep(dt, time) {
    if (!FV.R || typeof S === "undefined" || !S.farm) return;
    const H = st(), M = MW.A, farm = FV.on && document.body.classList.contains("tab-farm");
    if (!H || !H.built) { if (M) mwDrop(); return; }
    if (!M) {
      if (X || FV.fp || !farm || H.stock <= 0) return;
      MW.t -= dt; if (MW.t <= 0) mwSpawn();
      return;
    }
    const n = M.node;
    if (X || FV.fp) { n.visible = false; return; }                          /* oben auf dem Hochsitz: das Tier steht im Revier */
    if (M.leaving && H.stock <= 0) M.stay = 0;
    M.stay -= dt;
    const e = Math.hypot(M.x - CX, M.z - CZ) / CR;
    if (M.st === "graze") {
      M.t -= dt;
      n.x = M.x; n.z = M.z;
      n.y = M.k === "keiler" ? Math.abs(Math.sin(time * 5 + M.ph)) * 0.015 : 0;
      n.rx = M.k === "hirsch" ? (Math.sin(time * 0.6 + M.ph) > -0.35 ? 0.2 : 0) : 0.08;
      if (M.t <= 0) {
        if (M.stay <= 0) { const a = A_CT + Math.PI + (rnd() - 0.5) * 2.6; M.tx = CX + Math.cos(a) * CR * 1.3; M.tz = CZ + Math.sin(a) * CR * 1.3; M.leaving = true; M.st = "walk"; }
        else { const b = rnd() * 6.28, l = 3 + rnd() * 5; let tx = M.x + Math.cos(b) * l, tz = M.z + Math.sin(b) * l; if (Math.hypot(tx - CX, tz - CZ) > CR * 0.72) { tx = CX + (tx - CX) * 0.5; tz = CZ + (tz - CZ) * 0.5; } M.tx = tx; M.tz = tz; M.st = "walk"; }
      }
    } else {
      const dx = M.tx - M.x, dz = M.tz - M.z, dist = Math.hypot(dx, dz), sp = (M.k === "hirsch" ? 1.25 : 0.95) * dt;
      if (dist < sp * 1.2) { if (M.leaving) { mwDrop(); return; } M.st = "graze"; M.t = 5 + rnd() * 9; n.rx = 0; }
      else {
        M.x += dx / dist * sp; M.z += dz / dist * sp; n.x = M.x; n.z = M.z;
        const want = Math.atan2(dx, dz); n.ry += angN(want - n.ry) * Math.min(1, dt * 3);
        n.y = Math.abs(Math.sin(time * 7.5 + M.ph)) * 0.025; n.rx = 0;
      }
    }
    const al = clamp((1.2 - e) / 0.22, 0, 1), cam = FV.R.cam;
    n.alpha = al; n.visible = al > 0 && Math.abs(M.x - cam.tx) < 70 && Math.abs(M.z - cam.tz) < 70;
  }
  /* Aufstieg: das Tier von der Wiese ins Revier setzen */
  function mwToRevier() {
    const M = MW.A; if (!M || !X) return false;
    const [x, z] = toRv(M.x, M.z), [tx, tz] = toRv(M.tx, M.tz), grazing = M.st === "graze";
    const A = spawn(M.k, false, { score: M.score, x, z, tx, tz, st: grazing ? "graze" : "walk", t: grazing ? Math.max(3, M.t) : 0, ry: Math.atan2(tx - x, tz - z) });
    M.xfer = A.id; M.node.visible = false;
    X.spawnT = 45 + rnd() * 40; X.firstSpawn = false;
    return true;
  }
  /* Abstieg: lebt das Tier noch und ist ruhig, steht es wieder auf der Wiese – sonst ist es fort */
  function mwFromRevier() {
    const M = MW.A; if (!M || !M.xfer || !X) return;
    const A = X.animals.find(a => a.id === M.xfer);
    M.xfer = null;
    if (!A || !alive(A) || !["graze", "look", "walk", "root", "peck"].includes(A.st) || A.kept) { mwDrop(); return; }
    const [x, z] = fromRv(A.x, A.z), [tx, tz] = fromRv(A.tx, A.tz);
    M.x = x; M.z = z; M.tx = tx; M.tz = tz; M.node.x = x; M.node.z = z;
    M.st = A.st === "walk" ? "walk" : "graze"; M.t = 4 + rnd() * 6; M.leaving = false; M.stay = Math.max(M.stay, 15);
  }

  /* ------------------------------ Revier ---------------------------------- */
  /* Boden: Polargitter um die Feldmitte, Wiese → Waldrand → Waldboden; Farben je Ecke */
  function revColor(x, z) {
    const e = fieldE(x, z), n1 = Math.sin(x * 0.21 + z * 0.13) * Math.cos(z * 0.17 - x * 0.07), n2 = Math.sin(x * 0.9 + 1.7) * Math.sin(z * 0.7 - 0.4);
    let c = mixC(0x96cc58, 0xb4d466, clamp(n1 * 0.9 + 0.3, 0, 1));
    c = mixC(c, 0x86bd4c, clamp(n2 * 0.6, 0, 0.5));
    if (Math.abs(Math.sin((x - FC.x) * 0.35 + (z - FC.z) * 0.12)) > 0.93) c = mixC(c, 0x9fca5c, 0.35);       /* Mähstreifen, sanft */
    const forest = mixC(0x55752f, 0x6b6a37, clamp(n1 * 0.5 + 0.4, 0, 1));
    return mixC(c, forest, clamp((e - 0.96) / 0.22, 0, 1));
  }
  function revGround() {
    const b = MB(), N = 44, M = 84, Rm = 240;
    const ring = k => Rm * Math.pow(k / N, 1.55);
    for (let k = 0; k < N; k++) for (let j = 0; j < M; j++) {
      const a0 = j / M * Math.PI * 2, a1 = (j + 1) / M * Math.PI * 2, r0 = ring(k), r1 = ring(k + 1);
      const P = (r, a) => { const x = FC.x + Math.cos(a) * r, z = FC.z + Math.sin(a) * r; return [[x - FC.x, 0, z - FC.z], revColor(x, z)]; };
      const A = P(r0, a0), B = P(r0, a1), C = P(r1, a1), D = P(r1, a0);
      /* Umlauf so, dass die Flächen nach oben zeigen (sonst fallen sie der Rückseiten-Auslese zum Opfer) */
      if (k > 0) b.triV(A[0], B[0], C[0], A[1], B[1], C[1]);
      b.triV(A[0], C[0], D[0], A[1], C[1], D[1]);
    }
    return b;
  }
  /* Bäume, Gras, Farn, Steine fest verteilt (gleicher Samen → gleiches Revier) */
  let REV = null;
  function revLayout() {
    if (REV) return REV;
    const r = mulberry(1907), trees = [], grass = [], ferns = [], rocks = [], logs = [];
    const grid = new Map(), cell = 3, key = (x, z) => Math.floor(x / cell) + ":" + Math.floor(z / cell);
    const near = (x, z, d) => { const cx = Math.floor(x / cell), cz = Math.floor(z / cell); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = grid.get((cx + i) + ":" + (cz + j)); if (L && L.some(t => Math.hypot(t[0] - x, t[1] - z) < d)) return true; } return false; };
    const put = (x, z) => { const k = key(x, z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push([x, z]); };
    const SPS = ["kiefer", "kiefer", "fichte", "fichte", "buche", "eiche", "birke"];
    for (let i = 0; i < 9000 && trees.length < 560; i++) {
      const a = r() * Math.PI * 2, d = 8 + Math.pow(r(), 0.75) * 150, x = FC.x + Math.cos(a) * d, z = FC.z + Math.sin(a) * d * 0.9;
      const e = fieldE(x, z), tw = Math.hypot(x - RV.x, z - RV.z);
      if (e < 1.05 || tw < 4.5) continue;
      if (e < 1.35 && r() < 0.35) continue;
      if (near(x, z, e < 1.4 ? 2.7 : 3.3)) continue;
      put(x, z);
      const sp = SPS[Math.floor(r() * SPS.length)], sz = e < 1.25 ? 2 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3);
      trees.push({ sp, sz: sp === "eiche" ? Math.min(sz, 3) : Math.min(sz, 4), v: Math.floor(r() * 3), x, z, ry: r() * 6.28, s: 0.9 + r() * 0.3 });
    }
    /* ein paar einzelne Bäume und Büsche im Feld – Deckung für das Wild */
    [[0.55, 2.3], [0.72, 0.4], [0.62, -1.7], [0.35, 3.6], [0.82, -2.6]].forEach(([e, a], i) => { const [x, z] = fieldPt(e, a); trees.push({ sp: i % 2 ? "eiche" : "buche", sz: 3, v: i % 3, x, z, ry: i * 1.3, s: 1.05 }); });
    for (let i = 0; i < 2600 && grass.length < 640; i++) { const a = r() * 6.283, e = Math.sqrt(r()) * 1.02, [x, z] = fieldPt(e, a); if (Math.hypot(x - RV.x, z - RV.z) < 9) continue; grass.push({ v: Math.floor(r() * 4), x, z, ry: r() * 6.28, s: 0.55 + r() * 0.55 }); }
    for (let i = 0; i < 400 && ferns.length < 90; i++) { const a = r() * 6.283, e = 0.93 + r() * 0.2, [x, z] = fieldPt(e, a); ferns.push({ x, z, ry: r() * 6.28, s: 0.9 + r() * 0.6 }); }
    for (let i = 0; i < 12; i++) { const a = r() * 6.283, e = 0.3 + r() * 0.75, [x, z] = fieldPt(e, a); rocks.push({ x, z, ry: r() * 6.28, s: 0.6 + r() * 0.8 }); }
    for (let i = 0; i < 6; i++) { const a = r() * 6.283, e = 0.88 + r() * 0.15, [x, z] = fieldPt(e, a); logs.push({ x, z, ry: r() * 6.28, s: 1 + r() * 0.4 }); }
    REV = { trees, grass, ferns, rocks, logs };
    return REV;
  }
  const RG = new Map();                                 /* Instanzgruppen des Reviers (bleiben, werden geleert) */
  function rgroup(key, fn, o) {
    let g = RG.get(key);
    if (!g || !FV.R.instGroups.has(g)) { g = FV.R.instGroup(fmesh(key, fn), o || {}); RG.set(key, g); }
    return g;
  }
  function revBuild() {
    const L = revLayout(), R = FV.R;
    X.rv = { keys: [] };
    X.rv.ground = addNode(fmesh("hunt_rv_ground", revGround), { x: FC.x, y: 0, z: FC.z, shadow: false });
    X.rv.tower = addNode(fmesh("hunt_tower_v107", towerMesh), { x: RV.x, y: 0, z: RV.z, ry: RVRY });
    const put = (g, k, x, z, ry, s) => { g.add(k, x, z, ry, s); X.rv.keys.push([g, k]); };
    /* v113: nahe Bäume (bis TREE_HI Einheiten vom Hochsitz) mit dem fein gebauten Nahsicht-Modell – im Fernglas sah das grobe Standardmodell wie Felsbrocken/Kisten aus */
    L.trees.forEach((t, i) => { const hi = FWM.treeRv && Math.hypot(t.x - EYER[0], t.z - EYER[2]) < TREE_HI; put(rgroup((hi ? "wr:" : "wt:") + t.sp + ":" + t.sz + ":" + t.v, () => hi ? FWM.treeRv(t.sp, t.sz, t.v) : FWM.tree(t.sp, t.sz, t.v), { sway: 0.22 }), "hu" + i, t.x, t.z, t.ry, t.s); });
    if (FWM.grassTuft) L.grass.forEach((t, i) => put(rgroup("hu_gt" + t.v, () => FWM.grassTuft(t.v), { sway: 0.3, shadow: false }), "hg" + i, t.x, t.z, t.ry, t.s));
    if (FWM.fern) L.ferns.forEach((t, i) => put(rgroup("hu_fern", () => FWM.fern(), { sway: 0.2, shadow: false }), "hf" + i, t.x, t.z, t.ry, t.s));
    if (FWM.boulder) L.rocks.forEach((t, i) => put(rgroup("hu_rock", () => FWM.boulder(1), {}), "hr" + i, t.x, t.z, t.ry, t.s));
    if (FWM.deadLog) L.logs.forEach((t, i) => put(rgroup("hu_log", () => FWM.deadLog(), {}), "hl" + i, t.x, t.z, t.ry, t.s));
  }
  function revClear() {
    if (!X || !X.rv) return;
    X.rv.keys.forEach(([g, k]) => g.remove(k));
    [X.rv.ground, X.rv.tower].forEach(n => n && rmNode(n));
    X.rv = null;
  }

  /* ------------------------------ Sitzung --------------------------------- */
  let X = null;
  const CAM_KEYS = ["tx", "ty", "tz", "dist", "yaw", "pitch", "fov"];
  const camOf = c => { const o = {}; CAM_KEYS.forEach(k => { o[k] = c[k] || 0; }); return o; };
  function camLook(E, th, ph, fov, dist) {
    dist = dist || CAMD;
    const d = [Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph)];
    return { tx: E[0] + d[0] * dist, ty: E[1] + d[1] * dist, tz: E[2] + d[2] * dist, dist, yaw: th + Math.PI, pitch: -ph, fov };
  }
  function camLerp(a, b, t) { const o = {}; CAM_KEYS.forEach(k => { o[k] = k === "yaw" ? a.yaw + angN(b.yaw - a.yaw) * t : lerp(a[k], b[k], t); }); return o; }
  const eye = () => X && X.inRv ? EYER : EYEP;

  function canBegin() { return !!(typeof FV !== "undefined" && FV.R && FV.on && !FV.fp && document.body.classList.contains("tab-farm") && !(typeof MG !== "undefined" && MG.on)); }
  function begin() {
    if (!canBegin() || !built()) return false;
    const R = FV.R, c = R.cam, H = st();
    FV.focusId = (FV.focusId || 0) + 1; FV.focusing = false;
    const thW = Math.atan2(CZ - EYEP[2], CX - EYEP[0]), thR = Math.atan2(FC.z - EYER[2], FC.x - EYER[0]);
    X = { mode: "in", p: 0, saved: camOf(c), view: "eye", th: thR, ph: -0.06, thW, zoom: 8, fovNow: FOV, fogR: [40, 90], inRv: false,
      animals: [], aid: 0, nodes: [], drops: [], t: 0, kick: 0, reload: 0, breath: { on: false, t: 0, cd: 0, air: 1 },
      msgT: 0, lastTh: thR, lastPh: -0.06, spot: null, target: null, hrv: null, fade: 0,
      wind: { dir: rnd() * Math.PI * 2, v0: 1.5 + rnd() * 4.5, v: 3 }, spawnT: 0, flyT: 70 + rnd() * 50, firstSpawn: true };
    FV.fp = X;
    document.body.classList.add("fp3d", "fphunt");
    ui();
    snd("swish");
    return true;
  }
  /* im Revier angekommen: Wild planen */
  function enterRevier() {
    const R = FV.R, c = R.cam, H = st();
    X.inRv = true; X.fogR = [70, 230];
    c.near = NEAR; c.far = FAR;
    revBuild();
    if (!mwToRevier() && H.stock && rnd() < 0.4) spawn(null, false);
    X.spawnT = X.animals.length ? 35 + rnd() * 45 : 12 + rnd() * 22;
    if (!H.stock) msg("Das Revier ist ruhig – das Wild kommt in " + fdur(Math.max(1, Math.ceil(120 - (S.time - H.at)))) + " zurück.", 6);
    else msg(X.animals.length ? "Da draußen steht Wild – such es mit dem Fernglas." : "Warten und beobachten … such den Waldrand mit dem Fernglas ab.", 6);
  }
  function leaveRevier() {
    const c = FV.R.cam;
    mwFromRevier();
    X.animals.forEach(unbuild); X.animals = [];
    X.drops.forEach(d => rmNode(d.n)); X.drops = [];
    revClear();
    X.inRv = false; X.fogR = [40, 90];
    delete c.near; delete c.far;
  }
  function addNode(mesh, o, parent) {
    const n = fnode(mesh, Object.assign({ shadow: true }, o || {}));
    if (parent) FV.R.addChild(parent, n); else { FV.R.nodes.push(n); X.nodes.push(n); }
    return n;
  }
  function rmNode(n) { const i = FV.R.nodes.indexOf(n); if (i >= 0) FV.R.nodes.splice(i, 1); const j = X ? X.nodes.indexOf(n) : -1; if (j >= 0) X.nodes.splice(j, 1); }

  /* --------------------------- Tiere: Aufbau ------------------------------ */
  /* Platz im Feld, 150–240 m vom Hochsitz */
  function spawnPoint(r, enter) {
    r = r || rnd;
    for (let i = 0; i < 80; i++) {
      const a = Math.atan2(FC.z - EYER[2], FC.x - EYER[0]) + (r() - 0.5) * 1.3, d = 38 + r() * 22;
      const x = EYER[0] + Math.cos(a) * d, z = EYER[2] + Math.sin(a) * d;
      if (fieldE(x, z) < 0.88) {
        if (!enter) return [x, z];
        const b = Math.atan2(z - FC.z, x - FC.x), [ex, ez] = fieldPt(1.12, b + (r() - 0.5) * 0.5);
        if (Math.hypot(ex - EYER[0], ez - EYER[2]) > 30) return [ex, ez, x, z];
      }
    }
    return [FC.x - 6, FC.z, FC.x - 6, FC.z];
  }
  function spawn(k, enter, pre) {
    if (!k) { const r = rnd(); k = r < 0.58 ? "hirsch" : r < 0.92 ? "keiler" : "fasan"; }
    const S0 = SP[k], score = pre && pre.score != null ? pre.score : drawScore(), T = traits(k, score), s = lerp(S0.s0, S0.s1, score);
    const p = pre ? [pre.x, pre.z] : spawnPoint(null, enter);
    const A = { id: ++X.aid, k, score, T, s, x: p[0], z: p[1], y: 0, ry: rnd() * 6.28, rx: 0, rz: 0, v: 0, vT: 0, vx: 0, vz: 0, ph: rnd(), gw: 0, gr: 0,
      st: enter ? "walk" : k === "fasan" ? "peck" : k === "keiler" ? "root" : "graze", t: 2 + rnd() * 5, tx: p[0], tz: p[1], alert: 0, seen: false, hits: [], dist: 0,
      sp: {}, ear: [{ f: 0, k: 0, t: 1 }, { f: 0, k: 0, t: 2 }], cautious: enter, pause: 0, jolt: 0, legsA: [[0, 0], [0, 0], [0, 0], [0, 0]], seed: rnd() * 100, fly: null };
    if (enter) { A.tx = p[2]; A.tz = p[3]; A.ry = Math.atan2(A.tx - A.x, A.tz - A.z); }
    if (pre) {                                         /* v111: das Tier von der Wiese – gleiche Art, gleiche Güte, gleiche Lage und Blickrichtung */
      A.mw = true; A.st = pre.st; A.t = pre.t; A.cautious = false; A.tx = pre.tx; A.tz = pre.tz; A.ry = pre.ry;
    }
    build(A);
    X.animals.push(A);
    return A;
  }
  function build(A) {
    const k = A.k, S0 = SP[k], key = "hu8_" + k;
    if (k === "hirsch") {
      A.node = addNode(fmesh(key + "_b", deerBody), { x: A.x, z: A.z, ry: A.ry, s: A.s });
      A.neck = addNode(fmesh(key + "_n", deerNeck), { x: S0.neckP[0], y: S0.neckP[1], z: S0.neckP[2] }, A.node);
      A.head = addNode(fmesh(key + "_h" + A.T.P + "_" + Math.round(A.score * 10), () => deerHead(A.T.P, A.score)), { x: S0.headP[0], y: S0.headP[1], z: S0.headP[2] }, A.neck);
      A.ears = [-1, 1].map(s => addNode(fmesh(key + "_e" + s, () => deerEar(s)), { x: s * 0.075, y: 0.08, z: 0.02 }, A.head));
      A.tail = addNode(fmesh(key + "_t", deerTail), { x: 0, y: 1.07, z: -0.5 }, A.node);
      A.legN = S0.legs.map(L => { const up = addNode(fmesh(key + "_u" + L.f, () => deerUpper(!!L.f)), { x: L.h[0], y: L.h[1], z: L.h[2] }, A.node); return { up, lo: addNode(fmesh(key + "_l" + L.f, () => deerLower(!!L.f)), { y: -L.lu }, up) }; });
    } else if (k === "keiler") {
      A.node = addNode(fmesh(key + "_b", boarBody), { x: A.x, z: A.z, ry: A.ry, s: A.s });
      A.neck = A.head = addNode(fmesh(key + "_h" + Math.round(A.score * 10), () => boarHead(A.score)), { x: S0.neckP[0], y: S0.neckP[1], z: S0.neckP[2] }, A.node);
      A.legN = S0.legs.map(L => ({ up: addNode(fmesh(key + "_l", boarLeg), { x: L.h[0], y: L.h[1], z: L.h[2] }, A.node), lo: null }));
    } else {
      A.node = addNode(fmesh(key + "_b", phBody), { x: A.x, z: A.z, ry: A.ry, s: A.s });
      A.neck = A.head = addNode(fmesh(key + "_h", phHead), { x: S0.neckP[0], y: S0.neckP[1], z: S0.neckP[2] }, A.node);
      A.wings = [-1, 1].map(s => addNode(fmesh(key + "_w" + s, () => phWing(s)), { x: s * 0.07, y: 0.29, z: 0.02, visible: false }, A.node));
      A.legN = [];
    }
  }
  function unbuild(A) { if (A.node) rmNode(A.node); }
  const alive = A => A.st !== "gone" && A.st !== "dead" && A.st !== "fall" && A.st !== "drop";

  /* gedämpfte Feder (kritisch gedämpft): weiche, natürliche Übergänge */
  function spr(o, k, target, w, dt) {
    const x = o[k] != null ? o[k] : target, v = o[k + "v"] || 0, h = Math.min(dt, 0.8 / w);
    const nv = v + (w * w * (target - x) - 2 * w * v) * h, nx = x + nv * h;
    o[k] = nx; o[k + "v"] = nv; return nx;
  }

  /* Unruhe: Schuss, Bewegung, Witterung */
  function scare(amount, from, rad, except) {
    X.animals.forEach(A => {
      if (A === except || !alive(A)) return;
      const d = Math.hypot(A.x - from[0], A.z - from[2]);
      if (d > rad) return;
      A.alert += amount * SP[A.k].sens * clamp(1.4 - d / rad, 0.4, 1.2);
      A.src = [from[0], from[2]];
    });
  }
  function fleeFrom(A, from) {
    const away = Math.atan2(A.z - from[1], A.x - from[0]);
    const b = away + (rnd() - 0.5) * 0.9, [ex, ez] = fieldPt(1.45, Math.atan2(A.z + Math.sin(b) * 20 - FC.z, A.x + Math.cos(b) * 20 - FC.x));
    A.tx = ex; A.tz = ez; A.zig = 0.5 + rnd(); A.zigA = 0;
    if (A.k === "fasan") return takeOff(A, away);
    if (A.st !== "flee") { A.st = "flee"; A.t = 0; A.leap = A.k === "hirsch" ? 0.42 : 0; }
  }
  function takeOff(A, a) {
    A.st = "fly"; A.t = 0;
    const sp = 6.5 + rnd() * 3;
    A.fly = { vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 3.6, turn: (rnd() - 0.5) * 0.6, top: 7 + rnd() * 3 };
    A.wings.forEach(w => { w.visible = true; });
    snd("swish");
  }

  /* ------------------------ Tiere: Verhalten und Gang --------------------- */
  const WALK_OFF = [0.25, 0.75, 0.0, 0.5], RUN_OFF = [0.56, 0.66, 0.0, 0.1];
  function legAng(c, duty, amp, lift, front) {
    let a1, a2;
    if (c < duty) { const u = c / duty; a1 = lerp(-amp, amp, u); a2 = front ? 0.04 : -0.04; }
    else { const u = (c - duty) / (1 - duty), e = 0.5 - 0.5 * Math.cos(Math.PI * u); a1 = lerp(amp, -amp, e); a2 = Math.sin(Math.PI * u) * lift * (front ? 1 : 0.8); }
    return [a1 + (front ? 0 : 0.1), a2 + (front ? 0 : -0.12)];
  }
  function stepAnimal(A, dt, time) {
    const S0 = SP[A.k], n = A.node, P = A.sp;
    A.t -= dt;
    A.alert = Math.max(0, A.alert - dt * 0.04);
    /* Witterung: weht der Wind vom Hochsitz zum Tier, riecht es dich langsam */
    if (alive(A) && X.wind.v > 2) { const a = Math.atan2(A.z - EYER[2], A.x - EYER[0]); if (Math.cos(angN(a - X.wind.dir)) > 0.94) A.alert += dt * 0.02 * X.wind.v / 3; }
    let neckT = 0.2, nyT = 0, headT = 0.1, earT = 0.15, tailT = 0, stiff = 5;
    if (alive(A) && !["flee", "hit", "wounded", "fly"].includes(A.st)) {
      if (A.alert > 1) fleeFrom(A, A.src || [EYER[0], EYER[2]]);
      else if (A.alert > 0.5 && A.st !== "alert") { A.st = "alert"; A.t = 1.4 + rnd() * 2.2; A.jolt = 1; A.vT = 0; A.pause = 0; }
    }
    const towardA = Math.atan2(EYER[0] - A.x, EYER[2] - A.z);
    switch (A.st) {
      case "graze": {
        A.vT = 0; neckT = 2.55; headT = -0.45 + Math.max(0, Math.sin(time * 6.5 + A.seed)) * 0.06 * (Math.sin(time * 0.7 + A.seed) > 0 ? 1 : 0.2);
        nyT = Math.sin(time * 0.23 + A.seed) * 0.35;
        if (A.stepT > 0) { A.stepT -= dt; A.vT = 0.32; } else if (rnd() < dt * 0.12) A.stepT = 1.2 + rnd();
        if (A.t <= 0) { if (rnd() < 0.55) { A.st = "look"; A.t = 2 + rnd() * 3; } else pickWalk(A); }
        break;
      }
      case "peck": A.vT = 0; neckT = 0.9 + Math.max(0, Math.sin(time * 9 + A.seed)) * 0.6; if (A.t <= 0) { if (rnd() < 0.5) { A.st = "look"; A.t = 1 + rnd() * 1.5; } else pickWalk(A); } break;
      case "root": A.vT = 0.22; neckT = 0.6 + Math.sin(time * 6 + A.seed) * 0.08; steer(A, A.tx, A.tz, 1.2, dt); if (A.t <= 0) pickWalk(A); break;
      case "look": A.vT = 0; neckT = 0.05; headT = 0.2; nyT = Math.sin(time * 0.6 + A.seed) * 0.75; earT = 0.05; if (A.t <= 0 && A.alert < 0.5) { if (A.k === "fasan") { A.st = "peck"; A.t = 2 + rnd() * 3; } else if (A.k === "keiler") pickWalk(A); else { A.st = "graze"; A.t = 5 + rnd() * 8; } } break;
      case "alert": {                                   /* Aufschrecken: Kopf hoch, starr, Lauscher nach vorn – zum Geräusch hin */
        A.vT = 0; neckT = -0.15; headT = 0.3; earT = -0.08; tailT = -0.3; stiff = 11;
        const src = A.src || [EYER[0], EYER[2]];
        nyT = clamp(angN(Math.atan2(src[0] - A.x, src[1] - A.z) - A.ry), -1.1, 1.1);
        if (A.t <= 0) { if (A.alert > 0.7) fleeFrom(A, src); else { A.st = "look"; A.t = 1.5 + rnd(); } }
        break;
      }
      case "walk": {
        A.vT = A.cautious ? S0.sneak : A.k === "keiler" && A.trot ? 2.1 : S0.walk;
        neckT = A.k === "hirsch" ? 0.45 : 0.4; headT = 0.12;
        if (A.cautious && A.k === "hirsch") {
          /* vorsichtig: mitten im Schritt stehen bleiben (ein Vorderlauf in der Luft), sichern, weiter */
          if (A.pause > 0) { A.pause -= dt; A.vT = 0; neckT = 0.0; nyT = Math.sin(time * 0.9 + A.seed) * 0.6; earT = 0.02; }
          else if (rnd() < dt * 0.25) A.pause = 0.7 + rnd() * 1.3;
        }
        const d = steer(A, A.tx, A.tz, 1.5, dt);
        if (d < 0.4 || A.t < -40) { A.cautious = false; if (A.k === "keiler") { if (rnd() < 0.55) { A.st = "root"; A.t = 1.5 + rnd() * 2.5; A.tx = A.x + Math.sin(A.ry) * 0.6; A.tz = A.z + Math.cos(A.ry) * 0.6; } else pickWalk(A); } else if (A.k === "fasan") { A.st = "peck"; A.t = 2 + rnd() * 4; } else { A.st = "graze"; A.t = 6 + rnd() * 8; } }
        if (A.k === "keiler" && rnd() < dt * 0.35) pickWalk(A, true);
        break;
      }
      case "flee": case "hit": case "wounded": {
        A.vT = A.st === "hit" ? S0.run * 0.75 : A.st === "wounded" ? S0.run * 0.85 : S0.run;
        neckT = A.k === "hirsch" ? 0.9 : 0.3; headT = A.k === "hirsch" ? -0.35 : -0.15; earT = 0.55; tailT = -0.95; nyT = 0;
        /* Haken schlagen */
        A.zig -= dt; if (A.zig <= 0) { A.zig = 0.7 + rnd() * 1.1; A.zigA = (rnd() - 0.5) * 0.9; }
        const dx = A.tx - A.x, dz = A.tz - A.z;
        const want = Math.atan2(dx, dz) + A.zigA * clamp(Math.hypot(dx, dz) / 20, 0, 1);
        A.ry += clamp(angN(want - A.ry), -3 * dt, 3 * dt);
        A.dist += A.v * dt;
        if (A.st !== "flee") trail(A);
        if (A.st === "hit" && A.dist >= A.runL) { A.st = "fall"; A.t = 0.8; A.side = rnd() < 0.5 ? -1 : 1; }
        if ((A.st === "flee" || A.st === "wounded") && fieldE(A.x, A.z) > 1.32) {
          if (A.st === "wounded") lostMsg(A);
          A.st = "gone"; unbuild(A);
        }
        break;
      }
      case "fly": {
        const f = A.fly;
        A.t += dt * 2;
        const a = Math.atan2(f.vz, f.vx) + f.turn * dt, v = Math.hypot(f.vx, f.vz);
        f.vx = Math.cos(a) * v; f.vz = Math.sin(a) * v;
        f.vy = A.y < f.top ? Math.max(0.6, f.vy - dt * 0.8) : Math.min(0, f.vy + (f.top - A.y) * dt);
        A.x += f.vx * dt; A.z += f.vz * dt; A.y += f.vy * dt; A.vx = f.vx; A.vz = f.vz;
        A.ry = Math.atan2(f.vx, f.vz); A.rx = -f.vy * 0.06;
        const flap = A.t < 3.4 || Math.sin(A.t * 0.9) > 0.3;
        A.wings.forEach((w, i) => { w.rz = (i ? 1 : -1) * (flap ? Math.sin(time * 26 + A.seed) * 1.0 : -0.12); });
        neckT = 0.1;
        if (fieldE(A.x, A.z) > 2.2) { A.st = "gone"; unbuild(A); }
        break;
      }
      case "drop": {
        A.fly.vy -= 14 * dt; A.y = Math.max(S0.lie, A.y + A.fly.vy * dt); A.x += A.fly.vx * dt * 0.3; A.z += A.fly.vz * dt * 0.3;
        A.rz += dt * 6; A.wings.forEach((w, i) => { w.rz = (i ? 1 : -1) * 0.5; });
        if (A.y <= S0.lie + 0.001) { A.st = "dead"; A.rz = 1.4; A.rx = 0; A.deadAt = X.t; settle(A); }
        break;
      }
      case "fall": {
        const k = ss(1 - A.t / 0.8);
        A.vT = 0; A.rz = A.side * k * 1.45; A.y = S0.lie * A.s * k; neckT = 0.2 + k * 0.4; headT = 0.3;
        if (A.t <= 0) { A.st = "dead"; A.deadAt = X.t; settle(A); }
        break;
      }
      case "dead": A.vT = 0; neckT = 0.55; headT = 0.35; earT = 0.4; break;
    }
    /* Tempo weich anpassen, beim Aufspringen schnell */
    const acc = A.vT > A.v ? (A.st === "flee" || A.st === "hit" || A.st === "wounded" ? 2.6 : 2) : 3.2;
    if (A.st !== "fly" && A.st !== "drop") {
      A.v += (A.vT - A.v) * Math.min(1, dt * acc);
      if (A.st === "graze" || A.st === "alert" || A.st === "look" || A.st === "dead" || A.st === "fall") { /* stehen: keine Drehung nötig */ }
      const step = A.v * dt;
      A.vx = Math.sin(A.ry) * A.v; A.vz = Math.cos(A.ry) * A.v;
      A.x += A.vx * dt; A.z += A.vz * dt;
      if (A.st === "fall" || A.st === "dead") { A.vx = A.vz = 0; }
      void step;
    }
    /* Gang: Schritt ↔ Galopp nach Tempo; in der Pause bleibt die Phase stehen (Lauf in der Luft) */
    const v = A.v, wR = clamp((v - 2.4) / 2.6, 0, 1);
    const fw = v / (0.95 * A.s), fr = v / (2.7 * A.s);
    if (!(A.pause > 0)) A.ph = (A.ph + dt * lerp(fw, fr, wR)) % 1;
    const wantW = A.pause > 0 ? A.gw : clamp(v / 0.5, 0, 1);
    A.gw += (wantW - A.gw) * Math.min(1, dt * 5);
    const ampW = 0.36 * A.gw * (1 - wR), ampR = 0.82 * wR;
    if (A.k === "hirsch") {
      A.legsA = S0.legs.map((L, i) => {
        if (A.st === "dead" || A.st === "fall") { const k = A.st === "dead" ? 1 : ss(1 - A.t / 0.8); return [lerp(0, L.f ? -0.35 : 0.45, k), lerp(0, 0.9, k)]; }
        const w = legAng((A.ph + WALK_OFF[i]) % 1, 0.62, ampW, 0.9 * A.gw, !!L.f), r = legAng((A.ph + RUN_OFF[i]) % 1, 0.38, ampR, 1.5, !!L.f);
        return [lerp(w[0], r[0], wR), lerp(w[1], r[1], wR)];
      });
      A.legN.forEach((N, i) => { N.up.rx = A.legsA[i][0]; N.lo.rx = A.legsA[i][1]; });
    } else if (A.k === "keiler") {
      A.legsA = S0.legs.map((L, i) => {
        if (A.st === "dead" || A.st === "fall") return [L.f ? -0.4 : 0.4, 0];
        const c = (A.ph * 1.6 + (wR > 0.5 ? RUN_OFF : WALK_OFF)[i]) % 1;
        return [Math.sin(c * Math.PI * 2) * (0.45 * A.gw * (1 - wR) + 0.8 * wR), 0];
      });
      A.legN.forEach((N, i) => { N.up.rx = A.legsA[i][0]; });
    }
    /* Kopf, Hals, Lauscher, Wedel über Federn: weich, beim Aufschrecken schnell */
    const nod = A.k === "hirsch" ? Math.sin(A.ph * Math.PI * 4) * 0.05 * A.gw * (1 - wR) : 0;
    const nrx = spr(P, "nrx", neckT + nod, stiff, dt), nry = spr(P, "nry", nyT, stiff * 0.7, dt), hrx = spr(P, "hrx", headT, stiff * 1.2, dt);
    if (A.k === "hirsch") {
      A.neck.rx = nrx - 0.35; A.neck.ry = nry; A.head.rx = hrx;
      /* Ohrenspiel: jede Lauscher zuckt für sich, beim Sichern beide nach vorn */
      A.ear.forEach((E, i) => {
        E.t -= dt; if (E.t <= 0) { E.t = 0.8 + rnd() * 2.6; E.f = 0.18 + rnd() * 0.2; E.k = (rnd() - 0.5) * 1.1; }
        E.f -= dt;
        const s = i ? 1 : -1, tw = E.f > 0 ? E.k : 0, look = A.st === "alert" ? clamp(nyT * 0.4, -0.4, 0.4) : 0;
        A.ears[i].rz = spr(P, "erz" + i, s * (earT + (E.f > 0 ? Math.abs(tw) * 0.3 : 0)), 14, dt);
        A.ears[i].ry = spr(P, "ery" + i, tw * 0.6 + look, 12, dt);
      });
      A.tail.rx = spr(P, "trx", tailT + (Math.sin(time * 3 + A.seed) > 0.97 ? -0.6 : 0), 12, dt);
    } else if (A.k === "keiler") { A.neck.rx = nrx - 0.55; A.neck.ry = nry * 0.6; }
    else { A.neck.rx = nrx * 0.6 - 0.2; }
    /* Rumpf: Atmen, Wippen im Schritt, Galopp mit Flugphase, Absprung, Schreck-Ruck */
    A.jolt = Math.max(0, A.jolt - dt * 3);
    if (A.leap > 0) A.leap -= dt;
    const lp = A.leap > 0 ? Math.sin((1 - A.leap / 0.42) * Math.PI) : 0;
    const gal = wR * Math.pow(Math.max(0, Math.sin(A.ph * Math.PI * 2)), 1.5);
    const bobW = -0.018 * (1 - Math.cos(A.ph * Math.PI * 4)) * A.gw * (1 - wR);
    n.x = A.x; n.z = A.z; n.ry = A.ry; n.rz = A.rz;
    if (A.st === "fly" || A.st === "drop") { n.y = A.y; n.rx = A.rx; }
    else if (A.st === "dead" || A.st === "fall") { n.y = A.y; n.rx = 0; }
    else {
      n.y = (bobW + gal * 0.2 + lp * 0.42 + A.jolt * 0.05) * A.s;
      n.rx = wR * Math.sin(A.ph * Math.PI * 2 + 1.2) * 0.1 - lp * 0.22 + (A.st === "graze" && A.k === "hirsch" ? 0.08 : 0) - A.jolt * 0.04;
      n.sy = 1 + Math.sin(time * 2.4 + A.seed) * 0.006;
    }
  }
  function steer(A, tx, tz, turn, dt) {
    const dx = tx - A.x, dz = tz - A.z, d = Math.hypot(dx, dz);
    if (d > 0.15) A.ry += clamp(angN(Math.atan2(dx, dz) - A.ry), -turn * dt, turn * dt);
    return d;
  }
  function pickWalk(A, quick) {
    let tx, tz;
    for (let i = 0; i < 20; i++) {
      const b = A.ry + (rnd() - 0.5) * (quick ? 2.6 : 3.4), l = (A.k === "keiler" ? 3 : 4) + rnd() * (A.k === "keiler" ? 5 : 9);
      tx = A.x + Math.sin(b) * l; tz = A.z + Math.cos(b) * l;
      const de = Math.hypot(tx - EYER[0], tz - EYER[2]);
      if (fieldE(tx, tz) < (A.k === "keiler" ? 0.98 : 0.86) && de > 32) break;
      tx = FC.x - 8; tz = FC.z;
    }
    A.tx = tx; A.tz = tz; A.st = "walk"; A.t = 0; A.trot = A.k === "keiler" && rnd() < 0.35; A.cautious = A.k === "hirsch" && rnd() < 0.5;
  }
  function trail(A) {
    const L = A.lastDrop;
    if (L && Math.hypot(A.x - L[0], A.z - L[1]) < 1.1) return;
    A.lastDrop = [A.x, A.z];
    const n = addNode(fmesh("hunt_drop", dropMesh), { x: A.x + (rnd() - 0.5) * 0.3, z: A.z + (rnd() - 0.5) * 0.3, ry: rnd() * 6.28, shadow: false });
    X.drops.push({ n, a: A.id });
  }
  function settle(A) {
    const S0 = SP[A.k], c = rot(S0.body.c.map(v => v * A.s), A.rx, A.ry, A.rz);
    A.center = [A.x + c[0], (A.y || 0) + c[1], A.z + c[2]];
  }
  function lostMsg(A) {
    const H = st();
    H.lost = (H.lost || 0) + 1; H.stock = Math.max(0, H.stock - 1);
    msg("Krank geschossen (" + ZONE[A.hits[0]].n + ") – das Stück ist im Wald verschwunden. Keine Trophäe.", 5, "bad");
    X.target = null; save();
  }

  /* ------------------------------ Eingabe --------------------------------- */
  function ui() {
    const host = $("#farm");
    if (!host) return;
    const el = document.createElement("div");
    el.id = "huntUI";
    el.innerHTML = `<svg class="hu-ov" width="100%" height="100%"></svg>
      <div class="hu-marks"></div>
      <div class="hu-spot" hidden></div>
      <div class="hu-top"><div class="hu-info"><b>Hochsitz · Revier</b><small class="hu-sub"></small></div><div class="hu-wind" title="Wind"><i>➤</i><span></span></div><button class="hu-x" data-hu="exit" aria-label="Hochsitz verlassen">✕</button></div>
      <div class="hu-msg" hidden></div>
      <div class="hu-range" hidden></div>
      <div class="hu-bar"></div>
      <div class="hu-reveal" hidden></div>
      <div class="hu-banner" hidden></div>
      <div class="hu-strip" hidden></div>
      <div class="hu-fade"></div>`;
    host.appendChild(el);
    X.ui = el;
    ["bar", "ov", "marks", "spotEl", "msgEl", "sub", "range", "reveal", "banner", "strip", "fadeEl", "windEl"].forEach((k, i) => { X[k] = el.querySelector([".hu-bar", ".hu-ov", ".hu-marks", ".hu-spot", ".hu-msg", ".hu-sub", ".hu-range", ".hu-reveal", ".hu-banner", ".hu-strip", ".hu-fade", ".hu-wind"][i]); });
    renderBar();
    let P = null;
    el.addEventListener("pointerdown", e => {
      if (e.target.closest("button,.hu-strip")) return;
      P = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { el.setPointerCapture(e.pointerId); } catch (er) { /* egal */ }
    });
    el.addEventListener("pointermove", e => {
      if (!P || P.id !== e.pointerId || !X || X.mode !== "hold" || !["eye", "bino", "scope"].includes(X.view)) return;
      const dx = e.clientX - P.x, dy = e.clientY - P.y; P.x = e.clientX; P.y = e.clientY;
      const k = Math.tan(X.fovNow / 2) * 2 / Math.max(200, FV.R.h);
      X.th -= dx * k; X.ph = clamp(X.ph + dy * k, -0.6, 0.38);
    });
    const up = e => { if (P && P.id === e.pointerId) P = null; };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", e => { if (X && X.view === "scope") { e.preventDefault(); zoomStep(e.deltaY < 0 ? 1 : -1); } }, { passive: false });
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-hu]"); if (!b || !X) return;
      e.stopPropagation();
      const a = b.dataset.hu;
      if (a === "exit") return end();
      if (a === "bino") return setView(X.view === "bino" ? "eye" : "bino");
      if (a === "scope") return setView("scope");
      if (a === "eye") return setView("eye");
      if (a === "zoom") return zoomStep(1, true);
      if (a === "fire") return fire();
      if (a === "keep") return keepTrophy();
      if (a === "sell") return keepTrophy(true);
    });
    el.addEventListener("pointerdown", e => { const b = e.target.closest('[data-hu="breath"]'); if (!b || !X) return; e.preventDefault(); e.stopPropagation(); breath(true); });
    const rel = () => { if (X && X.breath.on) breath(false); };
    el.addEventListener("pointerup", rel); el.addEventListener("pointercancel", rel); el.addEventListener("pointerleave", rel);
    X.key = e => {
      if (!X) return;
      if (e.code === "Space") { e.preventDefault(); breath(e.type === "keydown"); }
      else if (e.type === "keydown" && (e.code === "Enter" || e.code === "KeyF") && X.view === "scope") fire();
      else if (e.type === "keydown" && e.code === "KeyB") setView(X.view === "bino" ? "eye" : "bino");
      else if (e.type === "keydown" && e.code === "KeyG") setView("scope");
      else if (e.type === "keydown" && e.code === "Escape") { if (X.view === "bino" || X.view === "scope") setView("eye"); else end(); }
    };
    window.addEventListener("keydown", X.key); window.addEventListener("keyup", X.key);
  }
  function renderBar() {
    if (!X || !X.bar) return;
    const v = X.view;
    let h = "";
    if (v === "eye") h = `<button class="hu-b" data-hu="bino"><i>🔭</i><span>Fernglas</span></button><button class="hu-b hu-main" data-hu="scope"><i>🎯</i><span>Gewehr</span></button>`;
    else if (v === "bino") h = `<button class="hu-b" data-hu="eye"><i>↩</i><span>Absetzen</span></button><button class="hu-b hu-main" data-hu="scope"><i>🎯</i><span>Gewehr</span></button>`;
    else if (v === "scope") h = `<button class="hu-b" data-hu="eye"><i>↩</i><span>Absetzen</span></button><button class="hu-b" data-hu="zoom"><i class="hu-z">${X.zoom}×</i><span>Zoom</span></button>
      <button class="hu-b hu-breath" data-hu="breath"><i>🫁</i><span>Atem</span><em><b></b></em></button><button class="hu-fire" data-hu="fire" aria-label="Schießen"><span>Schuss</span></button>`;
    X.bar.innerHTML = h;
    X.bar.className = "hu-bar v-" + v;
    X.ui.className = "v-" + v + (X.mode === "out" ? " leaving" : "");
    drawOverlay();
  }
  function setView(v) {
    if (!X || X.mode !== "hold" || !X.inRv || !["eye", "bino", "scope"].includes(X.view)) return;
    if (X.view === v) return;
    X.view = v;
    if (v !== "scope") breath(false);
    X.spot = null; X.spotEl.hidden = true;
    renderBar();
    snd(v === "eye" ? "swish" : "tap");
  }
  function zoomStep(d, cycle) {
    const i = ZOOMS.indexOf(X.zoom);
    X.zoom = cycle ? ZOOMS[(i + 1) % ZOOMS.length] : ZOOMS[clamp(i + d, 0, ZOOMS.length - 1)];
    const z = X.bar.querySelector(".hu-z"); if (z) z.textContent = X.zoom + "×";
    X.ovKey = ""; snd("tap");
  }
  function breath(on) {
    const B = X.breath;
    if (on && X.view === "scope" && !B.on && B.cd <= 0 && B.air > 0.35) { B.on = true; B.t = 0; }
    else if (!on && B.on) { B.on = false; B.cd = 1.4 + B.t * 0.5; }
  }

  /* Overlay: Fernglas (zwei Kreise) oder Zielfernrohr (Absehen mit Haltepunkten, die mit dem Zoom mitwachsen) */
  function drawOverlay() {
    if (!X || !X.ov || !FV.R) return;
    const w = FV.R.w, h = FV.R.h, m = Math.min(w, h), cx = w / 2, cy = h / 2, v = X.view;
    let s = "";
    if (v === "bino") {
      const r = m * 0.37, dx = r * 0.62;
      s = `<defs><filter id="huB" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${Math.round(r * 0.07)}"/></filter>
        <mask id="huM"><rect width="${w}" height="${h}" fill="#fff"/><g filter="url(#huB)"><circle cx="${cx - dx}" cy="${cy}" r="${r * 0.97}" fill="#000"/><circle cx="${cx + dx}" cy="${cy}" r="${r * 0.97}" fill="#000"/></g></mask></defs>
        <rect width="${w}" height="${h}" fill="#05080a" fill-opacity=".95" mask="url(#huM)"/>
        <g stroke="#e9f2ec" stroke-opacity=".55" stroke-width="1.2"><line x1="${cx - 14}" y1="${cy}" x2="${cx - 5}" y2="${cy}"/><line x1="${cx + 5}" y1="${cy}" x2="${cx + 14}" y2="${cy}"/><line x1="${cx}" y1="${cy - 14}" x2="${cx}" y2="${cy - 5}"/><line x1="${cx}" y1="${cy + 5}" x2="${cx}" y2="${cy + 14}"/></g>`;
    } else if (v === "scope") {
      const r = m * 0.44, f = (h / 2) / Math.tan(FOV / X.zoom / 2), g = DOT * f;
      let dots = "";
      if (g >= 6) for (let i = 1; i * g < r * 0.29; i++) [[g * i, 0], [-g * i, 0], [0, g * i]].forEach(([x, y]) => { dots += `<circle cx="${cx + x}" cy="${cy + y}" r="${i % 5 ? 1.7 : 2.4}"/>`; });
      s = `<defs><mask id="huM"><rect width="${w}" height="${h}" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#000"/></mask>
        <radialGradient id="huV" cx="50%" cy="50%" r="50%"><stop offset="72%" stop-color="#000" stop-opacity="0"/><stop offset="96%" stop-color="#000" stop-opacity=".7"/><stop offset="100%" stop-color="#000" stop-opacity="1"/></radialGradient></defs>
        <rect width="${w}" height="${h}" fill="#030405" mask="url(#huM)"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#huV)"/>
        <g stroke="#0b0c0d" fill="none"><line x1="${cx - r}" y1="${cy}" x2="${cx - r * 0.3}" y2="${cy}" stroke-width="4"/><line x1="${cx + r * 0.3}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke-width="4"/>
          <line x1="${cx}" y1="${cy + r * 0.3}" x2="${cx}" y2="${cy + r}" stroke-width="4"/><line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy - r * 0.3}" stroke-width="4"/>
          <line x1="${cx - r * 0.3}" y1="${cy}" x2="${cx + r * 0.3}" y2="${cy}" stroke-width="1"/><line x1="${cx}" y1="${cy - r * 0.3}" x2="${cx}" y2="${cy + r * 0.3}" stroke-width="1"/></g>
        <g fill="#0b0c0d">${dots}</g><circle cx="${cx}" cy="${cy}" r="1.5" fill="#ff3b2e"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="none" stroke="#2a2d30" stroke-width="3"/>`;
    }
    X.ov.innerHTML = s;
    X.ov.setAttribute("viewBox", `0 0 ${w} ${h}`);
    X.ovKey = w + "x" + h + v + X.zoom;
  }

  /* ------------------------------ Schuss ---------------------------------- */
  const aimRay = () => { const R = FV.R; R.updateCamera(); return R.ray(R.w / 2, R.h / 2); };
  const aimRayNoUpdate = () => { const R = FV.R; return R.ray(R.w / 2, R.h / 2); };
  function treeBlock(o, d, tMax) {
    let best = null;
    const L = revLayout();
    L.trees.forEach(t => {
      const ox = o[0] - t.x, oz = o[2] - t.z, a = d[0] * d[0] + d[2] * d[2], b = 2 * (ox * d[0] + oz * d[2]), r = 0.18 * t.s * (1 + t.sz * 0.15), c = ox * ox + oz * oz - r * r, D = b * b - 4 * a * c;
      if (D < 0 || a < 1e-9) return;
      const tt = (-b - Math.sqrt(D)) / (2 * a);
      if (tt < 0.3 || tt > tMax) return;
      const y = o[1] + d[1] * tt;
      if (y < 0 || y > 2.4 + t.sz * 0.9) return;
      if (best == null || tt < best) best = tt;
    });
    return best;
  }
  function poseOf(A, dt) {
    dt = dt || 0;
    return { x: A.x + A.vx * dt, y: A.node.y, z: A.z + A.vz * dt, ry: A.ry, rx: A.node.rx, rz: A.node.rz, s: A.s,
      nrx: A.neck ? A.neck.rx : 0, nry: A.neck ? A.neck.ry : 0, hrx: A.head && A.head !== A.neck ? A.head.rx : 0, legs: A.legsA };
  }
  function fire() {
    if (!X || X.view !== "scope" || X.mode !== "hold" || !X.inRv) return;
    if (X.reload > 0) { snd("bad"); return; }
    const H = st(), r0 = aimRay(), E = FV.R.eye;
    H.shots++;
    X.reload = 1.5; X.kick = 1;
    shotSound();
    FV.R.burst({ x: E[0] + r0.d[0] * 1.4, y: E[1] + r0.d[1] * 1.4 - 0.15, z: E[2] + r0.d[2] * 1.4, n: 9, col: [[0.86, 0.86, 0.84, 0.55], [0.72, 0.72, 0.74, 0.5]], speed: 0.5, up: 0.35, g: 0.45, drag: 2.4, life: 1.5, size: 0.22, spread: 0.3 });
    /* Wind versetzt das Geschoss seitlich */
    const aim = Math.atan2(r0.d[2], r0.d[0]), dr = windDrift(X.wind.v, X.wind.dir, aim);
    const c = Math.cos(dr), s = Math.sin(dr), d = [r0.d[0] * c - r0.d[2] * s, r0.d[1], r0.d[0] * s + r0.d[2] * c];
    let best = null;
    X.animals.forEach(A => {
      if (!A.node || ["gone", "dead", "fall", "drop"].includes(A.st)) return;
      const dist = Math.hypot(A.x - E[0], A.z - E[2]), tf = dist * M_PER_U / V0;           /* Flugzeit: laufendes Wild vorhalten */
      const h = zoneHit(A.k, poseOf(A, tf), r0.o, d);
      if (h && (!best || h.t < best.h.t)) best = { A, h, tf };
    });
    const tb = treeBlock(r0.o, d, best ? best.h.t : 260);
    if (best && tb == null) {
      const A = best.A, at = [r0.o[0] + d[0] * best.h.t, r0.o[1] + d[1] * best.h.t, r0.o[2] + d[2] * best.h.t];
      const dm = Math.round(Math.hypot(at[0] - E[0], at[1] - E[1], at[2] - E[2]) * M_PER_U);
      setTimeout(() => { if (!X) return; hitSound(); FV.R.burst({ x: at[0], y: at[1], z: at[2], n: 6, col: [[0.45, 0.1, 0.08, 1], [0.35, 0.25, 0.18, 1]], speed: 0.9, up: 0.6, size: 0.05, life: 0.6, shape: 1 }); onHit(A, best.h.zone, dm); scare(1.6, at, 140, A); }, Math.round(best.tf * 1000) + 60);
    } else {
      let t = tb;
      if (t == null && d[1] < -1e-4) t = -r0.o[1] / d[1];
      if (t != null && t < 260) {
        const p = [r0.o[0] + d[0] * t, Math.max(0.05, r0.o[1] + d[1] * t), r0.o[2] + d[2] * t];
        setTimeout(() => { if (!X) return; FV.R.burst({ x: p[0], y: p[1], z: p[2], n: 9, col: tb != null ? [[0.55, 0.4, 0.26, 1], [0.7, 0.55, 0.36, 1]] : [[0.5, 0.42, 0.3, 1], [0.38, 0.5, 0.26, 1]], speed: 1.1, up: 1.4, size: 0.08, life: 0.8, shape: 1 }); scare(1.7, p, 140); }, Math.round(t * M_PER_U / V0 * 1000) + 60);
      } else scare(1.5, E, 140);
      msg(tb != null ? "Die Kugel ging in einen Baum – das Wild flüchtet." : "Vorbei! Das Wild flüchtet.", 3, "bad");
    }
    save();
  }
  function onHit(A, zone, dm) {
    if (!X || !A.node || A.st === "gone") return;
    A.hits.push(zone); A.dm = A.dm || dm;
    const Z = ZONE[zone];
    if (A.k === "fasan") {
      if (A.st === "fly") { A.st = "drop"; A.fly.vy = Math.min(0, A.fly.vy); } else { A.st = "fall"; A.t = 0.45; A.side = 1; }
      A.zone = zone; X.target = A;
      msg("Waidmannsheil! " + A.T.name + " · " + dm + " m", 3, "good");
      return;
    }
    if (!Z.kill) {
      /* Körper oder Lauf: das Stück flüchtet krank – keine Trophäe */
      if (!A.hits.some(z => ZONE[z].kill)) {
        A.st = "wounded"; fleeFrom(A, [EYER[0], EYER[2]]); A.st = "wounded";
        msg("Getroffen – aber kein guter Schuss (" + Z.n + "). Das Stück flüchtet.", 3.5, "warn");
      }
      return;
    }
    A.zone = zone;
    const running = A.st === "wounded" || A.st === "flee" || A.st === "hit";
    A.dist = 0; A.runL = lerp(Z.run[0], Z.run[1], rnd());
    X.target = A;
    if (A.hits.some(z => !ZONE[z].kill)) A.capW = true;         /* erst krank, dann erlegt: höchstens Bronze */
    if (A.runL < 0.3) { A.st = "fall"; A.t = 0.55; A.side = rnd() < 0.5 ? -1 : 1; }
    else { if (!running) fleeFrom(A, [EYER[0], EYER[2]]); A.st = "hit"; }
    msg("Waidmannsheil! " + Z.n + " · " + dm + " m", 3.2, "good");
  }

  /* ------------------------------ Töne ------------------------------------ */
  function ac() { if (typeof farmAC === "undefined" || !S.farm || !S.farm.snd) return null; try { if (!farmAC) farmAC = new (window.AudioContext || window.webkitAudioContext)(); if (farmAC.state === "suspended") farmAC.resume(); return farmAC; } catch (e) { return null; } }
  function noiseBuf(a, d, decay) { const b = a.createBuffer(1, Math.floor(a.sampleRate * d), a.sampleRate), ch = b.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, decay || 2); return b; }
  function burstSnd(a, t, d, vol, f, type, decay) {
    const s = a.createBufferSource(), g = a.createGain(), fl = a.createBiquadFilter();
    s.buffer = noiseBuf(a, d, decay); fl.type = type || "lowpass"; fl.frequency.value = f; g.gain.value = vol;
    s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t);
  }
  function shotSound() {
    const a = ac(); if (!a) return;
    const t = a.currentTime;
    burstSnd(a, t, 0.5, 0.55, 2600, "lowpass", 3);
    burstSnd(a, t, 0.08, 0.35, 5000, "highpass", 1);
    const o = a.createOscillator(), g = a.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.45);
    /* Echo vom Waldrand */
    burstSnd(a, t + 0.38, 0.6, 0.12, 900, "lowpass", 2.5);
    burstSnd(a, t + 0.85, 0.7, 0.05, 700, "lowpass", 2.5);
    /* Repetieren */
    [0.7, 0.86].forEach((dl, i) => { const q = a.createOscillator(), h = a.createGain(); q.type = "square"; q.frequency.value = i ? 1500 : 900; h.gain.setValueAtTime(0.03, t + dl); h.gain.exponentialRampToValueAtTime(0.0001, t + dl + 0.03); q.connect(h); h.connect(a.destination); q.start(t + dl); q.stop(t + dl + 0.04); });
  }
  function hitSound() {
    const a = ac(); if (!a) return;
    const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.09);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.14);
  }
  /* ------------------------------ Bergen ---------------------------------- */
  /* Kino: Abblende, Schnitt zur Totalen, Kran zurück und Schwenk, Funken, Medaille, dann schmale Leisten */
  function goHarvest(A) {
    if (!X || !A || A.st !== "dead" || X.view === "harvest") return;
    const zone = A.zone || "lunge";
    let medal = medalOf(A.score, A.k === "fasan" ? "vogel" : zone);
    if (A.capW) medal = Math.min(medal, 1);
    A.medal = Math.max(1, medal);
    /* Kamera-Yaw für die Flanke: lokale +x-Achse des Tiers zeigt in Welt-Richtung −ry */
    const yaw0 = -A.ry + (rnd() < 0.5 ? 0 : Math.PI) + 0.45;
    X.view = "harvest"; X.hrv = { A, t: 0, from: camOf(FV.R.cam), yaw0, cut: false, fx: 0, ui: 0 };
    X.spotEl.hidden = true; X.range.hidden = true; X.marks.innerHTML = "";
    breath(false);
    renderBar();
  }
  function harvestCam(Hv, dt) {
    const A = Hv.A, c = A.center, S0 = SP[A.k];
    const k = ss((Hv.t - 0.4) / 5.5), sz = A.s * (A.k === "fasan" ? 0.45 : A.k === "keiler" ? 0.8 : 1);
    const yaw = Hv.yaw0 + 1.15 * k + Math.max(0, Hv.t - 5.9) * 0.05;
    return { tx: c[0], ty: c[1] + 0.25 * (1 - k) + 0.15, tz: c[2], dist: lerp(3.0, S0.orbit, k) * sz + (A.k === "hirsch" ? 0 : 0), yaw, pitch: lerp(0.1, 0.36, k), fov: 0.72 };
  }
  function harvestStep(Hv, dt, time) {
    Hv.t += dt;
    const t = Hv.t;
    /* Abblenden 0 … 0,4 s, Schnitt, Aufblenden bis 0,9 s */
    X.fade = t < 0.4 ? t / 0.4 : Math.max(0, 1 - (t - 0.4) / 0.5);
    if (!Hv.cut && t >= 0.4) Hv.cut = true;
    /* Funken: goldene Lichtpunkte steigen um das Stück auf */
    if (t > 1.5 && t < 3.3) {
      Hv.fx -= dt;
      if (Hv.fx <= 0) {
        Hv.fx = 0.12;
        const c = Hv.A.center, a = rnd() * 6.28, r = 0.6 + rnd() * 0.9;
        FV.R.burst({ x: c[0] + Math.cos(a) * r, y: 0.1, z: c[2] + Math.sin(a) * r, n: 3, col: [[1, 0.86, 0.4, 1], [1, 0.95, 0.7, 1]], speed: 0.25, up: 1.4, g: 0.35, drag: 0.6, life: 2.2, size: 0.06, spread: 0.4 });
      }
    }
    if (t > 1.45 && Hv.ui === 0) { Hv.ui = 1; showReveal(Hv.A); }
    if (t > 3.6 && Hv.ui === 1) { Hv.ui = 2; showPanels(Hv.A); }
    return Hv.cut ? harvestCam(Hv, dt) : Hv.from;
  }
  function showReveal(A) {
    const M = MEDALS[A.medal];
    X.reveal.innerHTML = `<div class="hu-rays" style="--mc:${M.c}"></div><div class="hu-bigmedal" style="--mc:${M.c}">${M.i}</div><b>${M.n}</b><small>${esc(A.T.troph)}</small>`;
    X.reveal.hidden = false; X.reveal.classList.remove("go"); void X.reveal.offsetWidth; X.reveal.classList.add("go");
    snd(A.medal >= 3 ? "pearl" : "collect"); if (A.medal >= 3) setTimeout(() => snd("level"), 350);
  }
  function showPanels(A) {
    const M = MEDALS[A.medal], zone = A.zone || "lunge", id = trophyId(A.k, A.medal), price = PRICE[A.k][A.medal], room = typeof farmRoom === "function" ? farmRoom(id) : 1;
    const hitsTxt = A.hits.map(z => ZONE[z].n).filter((v, i, a) => a.indexOf(v) === i).join(" + ");
    const note = A.capW ? "Erst krank geschossen – höchstens Bronze." : ZONE[zone] && ZONE[zone].note ? ZONE[zone].note : "";
    X.banner.innerHTML = `<span class="hu-bm" style="--mc:${M.c}">${M.i}</span><div><small>Waidmannsheil!</small><b>${esc(A.T.name)}</b><em>${esc(A.T.troph)} · ${A.k === "fasan" ? String(A.T.kg).replace(".", ",") : A.T.kg} kg</em></div>`;
    X.strip.innerHTML = `<div class="hu-chips"><span><small>Treffer</small><b>${esc(hitsTxt)}</b></span><span><small>Entfernung</small><b>${A.dm || "?"} m</b></span>
        <span><small>Bewertung</small><b>${String(Math.round(A.score * 1000) / 10).replace(".", ",")}</b></span><span><small>Wert</small><b>${eur(price)}</b></span></div>
      ${note ? `<p class="hu-note">${esc(note)}</p>` : ""}
      ${room > 0 ? `<button class="btn hu-keep" data-hu="keep">🏆 Trophäe ins Lager legen</button>` : `<button class="btn hu-keep" data-hu="sell">💰 Trophäenwand voll – an Sammler verkaufen · ${eur(price)}</button>`}`;
    X.reveal.classList.add("away");
    X.banner.hidden = false; X.strip.hidden = false;
  }
  function keepTrophy(sell) {
    const A = X && X.hrv && X.hrv.A;
    if (!A || A.kept) return;
    A.kept = true;
    const H = st(), id = trophyId(A.k, A.medal), price = PRICE[A.k][A.medal];
    if (sell) { S.money += price; if (typeof logMoney === "function") logMoney("farm", "Trophäe an Sammler: " + A.T.troph, price); }
    else farmAdd(id, 1, 3);
    H.kills++; H.stock = Math.max(0, H.stock - 1);
    H.best = Math.max(H.best || 0, A.medal);
    H.log.unshift({ k: A.k, m: A.medal, t: S.time, name: A.T.name, troph: A.T.troph, zone: A.zone, dm: A.dm, s: Math.round(A.score * 1000) / 1000 });
    if (H.log.length > 40) H.log.length = 40;
    if (typeof farmXP === "function") farmXP(XP[A.k][A.medal]);
    snd("coin");
    save();
    X.banner.hidden = true; X.strip.hidden = true; X.reveal.hidden = true;
    msg((sell ? "Verkauft: " : "Im Lager: ") + A.T.troph + " " + MEDALS[A.medal].i, 3.5, "good");
    X.view = "back"; X.back = { t: 0, A };
    X.target = null;
  }

  /* ------------------------------ Hinweise -------------------------------- */
  function msg(t, sec, cls) {
    if (!X || !X.msgEl) return;
    X.msgEl.textContent = t; X.msgEl.className = "hu-msg" + (cls ? " " + cls : ""); X.msgEl.hidden = false;
    X.msgT = sec || 3;
  }
  function chance(A) {
    const m = medalOf(A.score, "lunge"), lo = Math.max(1, m - (A.score % 0.18 < 0.09 ? 1 : 0));
    return { lo, hi: m, txt: lo === m ? MEDALS[m].i + " " + MEDALS[m].n : MEDALS[lo].i + "–" + MEDALS[m].i + " " + MEDALS[lo].n + " bis " + MEDALS[m].n, v: PRICE[A.k][m] };
  }
  const doing = A => ({ graze: "äst", peck: "pickt", root: "bricht im Boden", look: "sichert", alert: "hat etwas bemerkt", walk: A.cautious ? "zieht vorsichtig" : "zieht", flee: "flüchtet", wounded: "flüchtet krank", hit: "flüchtet", fly: "fliegt", fall: "bricht zusammen", dead: "liegt", drop: "fällt" })[A.st] || "";
  /* woher der Wind kommt, aus Sicht des Schützen (acht Richtungen) */
  const windFrom = (dir, th) => {
    const rel = angN(dir + Math.PI - th), i = Math.round(rel / (Math.PI / 4));
    return ["von vorn", "von vorn rechts", "von rechts", "von hinten rechts", "von hinten", "von hinten links", "von links", "von vorn links"][(i + 8) % 8];
  };

  /* ------------------------------ Schritt --------------------------------- */
  function step(dt, time) {
    worldStep(dt);
    if (!X) return;
    const R = FV.R, c = R.cam;
    if (!FV.on || !document.body.classList.contains("tab-farm")) { finish(); return; }
    X.t += dt;
    const H = st();
    /* Wind: Grundstärke plus Böen, die Richtung dreht langsam */
    const Wd = X.wind; Wd.v = Math.max(0, Wd.v0 + Math.sin(X.t * 0.31) * 1.2 + Math.sin(X.t * 1.13 + 1) * 0.6); Wd.dir += Math.sin(X.t * 0.05) * dt * 0.02;
    /* Atem und Schwanken: ohne Atem anhalten ist ein Schuss auf 180 m Glückssache */
    const B = X.breath;
    if (B.on) { B.t += dt; B.air = Math.max(0, B.air - dt / 3); if (B.air <= 0) { B.on = false; B.cd = 2.6; } }
    else { B.cd = Math.max(0, B.cd - dt); if (B.cd <= 0) B.air = Math.min(1, B.air + dt / 4); }
    const swayK = X.view === "scope" ? (B.on ? 0.09 : B.cd > 0 ? 1.8 : 1) : X.view === "bino" ? 0.3 : 0;
    const sw = 0.0068 * swayK, tt = X.t;
    const swX = (Math.sin(tt * 0.83) * 0.55 + Math.sin(tt * 1.97 + 1.3) * 0.3 + Math.sin(tt * 4.1 + 0.4) * 0.15) * sw;
    const swY = (Math.sin(tt * 0.61 + 0.7) * 0.45 + Math.sin(tt * 1.43) * 0.3) * sw + (X.view === "scope" ? Math.sin(tt * 1.45) * 0.003 * (B.on ? 0.05 : 1) + Math.max(0, Math.sin(tt * 7.3)) * 0.0009 * (B.on ? 0.2 : 1) : 0);
    X.kick = Math.max(0, X.kick - dt * 4.5);
    X.reload = Math.max(0, X.reload - dt);
    const fovT = X.view === "scope" ? FOV / X.zoom : X.view === "bino" ? FOV / BINO : FOV;
    X.fovNow += (fovT - X.fovNow) * Math.min(1, dt * 10);
    const kick = Math.pow(X.kick, 2) * (X.view === "scope" ? 0.05 : 0.03);
    const look = camLook(eye(), X.th + swX, X.ph + swY + kick, X.fovNow);
    const w = Math.hypot(angN(X.th - X.lastTh), X.ph - X.lastPh) / Math.max(dt, 0.001);
    X.lastTh = X.th; X.lastPh = X.ph;
    if (X.view === "eye" && w > 2.2) X.animals.forEach(A => { if (alive(A)) { const d = Math.hypot(A.x - EYER[0], A.z - EYER[2]); if (d < 25) { A.alert += (w - 2.2) * dt * 0.1 * SP[A.k].sens; A.src = [EYER[0], EYER[2]]; } } });

    let goal = look;
    if (X.mode === "in") {
      /* hoch auf den Hochsitz der Karte, dann Überblendung ins Revier */
      X.p = Math.min(1, X.p + dt / 2.0);
      if (X.p < 0.8) { goal = camLerp(X.saved, camLook(EYEP, X.thW, -0.12, FOV), ss(X.p / 0.8)); X.fade = clamp((X.p - 0.62) / 0.18, 0, 1); }
      else { if (!X.inRv) enterRevier(); goal = camLook(EYER, X.th, X.ph, FOV); X.fade = clamp(1 - (X.p - 0.8) / 0.2, 0, 1); }
      if (X.p >= 1) { X.mode = "hold"; X.fade = 0; }
    } else if (X.mode === "out") {
      X.p = Math.min(1, X.p + dt / 1.8);
      if (X.p < 0.22) { goal = X.from; X.fade = X.p / 0.22; }
      else { if (X.inRv) leaveRevier(); const k = (X.p - 0.22) / 0.78; goal = camLerp(camLook(EYEP, X.thW, -0.12, FOV), X.saved, ss(k)); X.fade = clamp(1 - k * 3, 0, 1); }
      if (X.p >= 1) { finish(); return; }
    } else if (X.view === "harvest" && X.hrv) {
      goal = harvestStep(X.hrv, dt, time);
    } else if (X.view === "back" && X.back) {
      const Bk = X.back; Bk.t += dt;
      X.fade = Bk.t < 0.35 ? Bk.t / 0.35 : Math.max(0, 1 - (Bk.t - 0.35) / 0.45);
      if (Bk.t >= 0.35 && !Bk.cut) { Bk.cut = true; unbuild(Bk.A); Bk.A.st = "gone"; X.drops.forEach(d => rmNode(d.n)); X.drops = []; }
      goal = Bk.cut ? look : camOrbitHold();
      if (Bk.t >= 0.8) { X.view = "eye"; X.back = null; X.hrv = null; renderBar(); }
    }
    if (X.dbgCam) goal = typeof X.dbgCam === "function" ? X.dbgCam() : X.dbgCam;          /* nur für Tests (Kamera frei setzen) */
    CAM_KEYS.forEach(k => { c[k] = goal[k]; });
    /* v111: nahe Ebene je nach Ansicht weit nach hinten – im Fernglas/Zielfernrohr ist nichts näher als 6 m im Bild,
       dafür bleibt der Tiefenpuffer fein genug, dass Stämme und Äste in der Ferne nicht mehr flimmern oder zerreißen */
    if (X.inRv) { c.near = X.view === "bino" || X.view === "scope" ? 3.2 : X.view === "eye" ? 1.1 : 0.6; c.far = FAR; }
    FV.touchAt = performance.now();
    /* Wild: wenig, weit weg – und man muss warten */
    if (X.inRv && X.mode === "hold") {
      const live = X.animals.filter(A => A.st !== "gone" && !A.kept);
      X.spawnT -= dt;
      if (X.spawnT <= 0 && ["eye", "bino", "scope"].includes(X.view)) {
        if (live.length < Math.min(2, H.stock)) { spawn(null, true); if (X.firstSpawn) { X.firstSpawn = false; } }
        X.spawnT = 40 + rnd() * 50;
      }
      X.flyT -= dt;
      if (H.stock > 0 && X.flyT <= 0 && ["eye", "bino", "scope"].includes(X.view)) {
        X.flyT = 80 + rnd() * 60;
        const A = spawn("fasan", false), a0 = Math.atan2(FC.z - EYER[2], FC.x - EYER[0]) + (rnd() - 0.5) * 1.6, dd = 26 + rnd() * 18;
        A.x = EYER[0] + Math.cos(a0) * dd; A.z = EYER[2] + Math.sin(a0) * dd; A.y = 0.3; takeOff(A, a0 + Math.PI / 2 * (rnd() < 0.5 ? 1 : -1));
      }
    }
    X.animals.forEach(A => { if (A.st !== "gone") stepAnimal(A, dt, time); });
    X.animals = X.animals.filter(A => A.st !== "gone" || A.kept);
    const T = X.target;
    if (T && T.st === "dead" && ["eye", "bino", "scope"].includes(X.view) && X.t - T.deadAt > 1.1) goHarvest(T);
    /* Oberfläche */
    if (X.msgT > 0) { X.msgT -= dt; if (X.msgT <= 0) X.msgEl.hidden = true; }
    if (X.ui) {
      X.ui.style.setProperty("--fade", X.fade.toFixed(3));
      const k = R.w + "x" + R.h + X.view + X.zoom; if (X.ovKey !== k) drawOverlay();
      X.sub.innerHTML = `Wild <b class="hu-dots">${dots(H.stock)}</b> · 🎯 ${H.shots} · 🏆 ${H.kills}`;
      const rel = angN(X.wind.dir - X.th);                          /* Pfeil: wohin der Wind weht, relativ zur Blickrichtung (oben = vorn) */
      X.windEl.querySelector("i").style.transform = `rotate(${(rel * 180 / Math.PI - 90).toFixed(0)}deg)`;
      X.windEl.querySelector("span").textContent = (Math.round(X.wind.v * 10) / 10).toString().replace(".", ",") + " m/s";
      uiMarks(dt);
      const bm = X.bar.querySelector(".hu-breath em b"); if (bm) bm.style.width = Math.round(B.air * 100) + "%";
      const fb = X.bar.querySelector(".hu-fire"); if (fb) fb.classList.toggle("wait", X.reload > 0);
      const hb = X.bar.querySelector(".hu-breath"); if (hb) hb.classList.toggle("on", B.on);
    }
  }
  function camOrbitHold() { return X.hrv ? harvestCam(X.hrv, 0) : camOf(FV.R.cam); }
  function uiMarks(dt) {
    const R = FV.R, w = R.w, h = R.h, m = Math.min(w, h);
    let html = "", near = null, nd = 1e9;
    const view = X.view, cr = view === "bino" || view === "scope" ? aimRayNoUpdate() : null;
    if (["eye", "bino", "scope"].includes(view)) X.animals.forEach(A => {
      if (!A.node || A.st === "gone" || A.kept) return;
      const top = SP[A.k].body.c[1] * 2 * A.s + (A.k === "hirsch" ? 0.7 : 0.3);
      const p = R.project(A.x, (A.node.y || 0) + top, A.z);
      if (!p || p[2] > 1) return;
      if (view === "bino" && alive(A)) {
        const c = R.project(A.x, (A.node.y || 0) + SP[A.k].body.c[1] * A.s, A.z);
        const hz = zoneHit(A.k, poseOf(A), cr.o, cr.d), d = hz ? 0 : c ? Math.hypot(c[0] - w / 2, c[1] - h / 2) : 1e9;
        if (d < m * 0.17 && d < nd) { nd = d; near = { A, p }; }
      }
      if (p[0] < -20 || p[0] > w + 20 || p[1] < -20 || p[1] > h + 20) return;
      if (A.seen && (view === "eye" || view === "bino") && A.st !== "dead") html += `<i class="hu-mk${["flee", "wounded", "hit"].includes(A.st) ? " fl" : ""}" style="transform:translate(${Math.round(p[0])}px,${Math.round(p[1] - 6)}px)">${SP[A.k].i}</i>`;
    });
    X.marks.innerHTML = html;
    if (near) {
      const A = near.A;
      if (!X.spot || X.spot.A !== A) X.spot = { A, t: 0 };
      X.spot.t += dt;
      if (X.spot.t > 0.6 && !A.seen) { A.seen = true; snd("xp"); }
      const dm = Math.round(Math.hypot(A.x - EYER[0], A.z - EYER[2]) * M_PER_U), ch = chance(A);
      X.spotEl.innerHTML = A.seen ? `<b>${SP[A.k].i} ${esc(A.T.name)}</b><span>${dm} m · ${doing(A)}</span><span>Medaille: ${ch.txt}</span><span>Sammlerwert ca. ${eur(ch.v)}</span>`
        : `<b>Erkennen … ${dm} m</b><i style="width:${Math.round(Math.min(1, X.spot.t / 0.6) * 100)}%"></i>`;
      X.spotEl.hidden = false;
      const sw = X.spotEl.offsetWidth || 180, sh = X.spotEl.offsetHeight || 70;
      X.spotEl.style.transform = `translate(${Math.round(clamp(w / 2 - sw / 2, 8, w - sw - 8))}px,${Math.round(clamp(h / 2 + m * 0.21, 64, h - sh - 96))}px)`;
    } else if (view === "bino") { X.spot = null; X.spotEl.hidden = true; }
    /* Zielfernrohr: Entfernung, Wind und Haltepunkt */
    if (view === "scope") {
      let best = null;
      X.animals.forEach(A => { if (!A.node || ["gone", "dead"].includes(A.st) || A.kept) return; const hz = zoneHit(A.k, poseOf(A), cr.o, cr.d); if (hz && (!best || hz.t < best.t)) best = { A, t: hz.t }; });
      const aim = Math.atan2(cr.d[2], cr.d[0]), dots2 = holdDots(windDrift(X.wind.v, X.wind.dir, aim)), hd = Math.round(Math.abs(dots2) * 2) / 2;
      const hint = hd >= 0.5 ? ` · ${String(hd).replace(".", ",")} Pkt. ${dots2 > 0 ? "rechts" : "links"} halten` : "";
      X.range.hidden = false;
      X.range.innerHTML = (best ? `<b>${Math.round(best.t * M_PER_U)} m</b>${best.A.seen ? " · " + esc(best.A.T.name) : ""}` : `<b>${X.zoom}×</b>`) + `<small>🍃 ${String(Math.round(X.wind.v * 10) / 10).replace(".", ",")} m/s ${windFrom(X.wind.dir, aim)}${hint}</small>`;
    } else X.range.hidden = true;
  }

  /* ------------------------------ Ende ------------------------------------ */
  function end() {
    if (!X || X.mode === "out" || X.mode === "in") return;
    if (X.view === "harvest" || X.view === "back") return;
    X.mode = "out"; X.p = 0; X.from = camOf(FV.R.cam);
    breath(false);
    X.view = "eye"; renderBar();
    snd("swish");
  }
  function finish() {
    if (!X) return;
    const c = FV.R.cam;
    if (X.inRv) leaveRevier();
    CAM_KEYS.forEach(k => { c[k] = X.saved[k]; });
    delete c.near; delete c.far;
    X.nodes.slice().forEach(rmNode);
    if (X.ui && X.ui.parentNode) X.ui.parentNode.removeChild(X.ui);
    if (X.key) { window.removeEventListener("keydown", X.key); window.removeEventListener("keyup", X.key); }
    document.body.classList.remove("fp3d", "fphunt");
    FV.fp = null; X = null;
    if (typeof clampCam === "function") clampCam();
    if (typeof save === "function") save();
  }

  /* ------------------------------ Markt ----------------------------------- */
  function marketHTML() {
    if (typeof S === "undefined" || !S.farm || !S.farm.inv) return "";
    const ids = Object.keys(S.farm.inv).filter(id => /^tro_/.test(id) && FITEMS[id] && farmInv(id) > 0);
    if (!ids.length) return "";
    ids.sort((a, b) => FITEMS[b].v - FITEMS[a].v);
    const sum = ids.reduce((t, id) => t + farmSellPrice(id, farmInv(id)), 0);
    return `<div class="card hu-mkt"><div class="card-top"><span class="vicon">🏆</span><div class="vname">Trophäen-Sammler<small>Sammler zahlen den vollen Wert – Diamant bringt am meisten</small></div><span class="price">${money(sum)}</span></div>
      <div class="hu-mrows">${ids.map(id => `<div><span>${FITEMS[id].i} ${esc(FITEMS[id].n)} <small>× ${farmInv(id)}</small></span><button class="btn tiny" data-husell="${id}">verkaufen · ${money(farmSellPrice(id, 1))}</button></div>`).join("")}</div></div>`;
  }
  function marketBind() {
    $$("#tab-market [data-husell]").forEach(b => b.onclick = () => {
      const m = farmSell(b.dataset.husell, 1);
      if (m) { snd("coin"); save(); if (typeof toast === "function") toast("🏆 Trophäe verkauft: +" + money(m), "good"); renderMarket(); }
    });
  }
  return {
    CX, CZ, CR, TW, TRY, PH, EYEP, EYER, RV, FC, M_PER_U, SP, ZONE, MEDALS, PRICE, NEED, DOT,
    clear, ground, inMeadow, edgeR, fieldE, fieldPt, spawnPoint, attach, pick, tagInfo, sheet, begin, step, end, marketHTML, marketBind, trophyId, trophyMesh,
    zoneHit, medalOf, traits, drawScore, camLook, rot, unrot, windDrift, holdDots, unlocked, built, buildNow,
    get on() { return !!X; }, get X() { return X; },
    _spawn: (k, enter) => X && X.inRv && spawn(k, enter), toRv, fromRv, _mw: () => MW, _mwSpawn: mwSpawn, _fire: () => fire(), _view: v => setView(v)
  };
})();
if (typeof module !== "undefined") module.exports = HUNT;
