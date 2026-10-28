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
   • Bergen (v135, siehe „Bergen“ unten): kurze Abblende, die Kamera steht nah am liegenden Stück, Überschrift
     „Waidmannsheil!“ oben, Karte mit Medaille und Werten unten, „Trophäe sichern“ zeigt das Präparat genau dieses Stücks.

   v120 – Hirsch, Keiler und Trophäen neu: organische Modelle (skin über Querschnitts-Ringe, Eckfarben, weiche Normalen,
   gleiches Skelett wie vorher), Geweih nach Enden/Güte/Variante, Trophäen als Kopfpräparate je erlegtem Stück
   (S.farm.hunt.coll), Trophäenwand mit großen Bildern und Drehansicht im Lager.
   v135 – Keiler und Fasan neu modelliert, Liegepose aus den Modellpunkten (calcDead), Bergung neu (Kamera, Liegeplatz, Karte).

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
  const CAMD = 2.5, NEAR = 0.35, FAR = 300, TREE_HI = 40;
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
    /* v118: Wiesenfarbe nur noch sehr sanft schwanken lassen. Vorher wechselte sie je Gitterpunkt (4er-Raster) zwischen
       drei deutlich verschiedenen Grüntönen – das ergab große, eckige helle Flecken mitten auf der Wiese. Jetzt ein
       gleichmäßiger Ton mit feiner Abweichung (±3 %), weiche Ränder und die Gräser/Blumen liefern die Lebendigkeit. */
    const n = clamp(0.5 + 0.5 * w * 0.8 + (v > 0.1 ? 0.08 : 0) - 0.04, 0, 1);
    return mixC(c, mixC(0x8cc04e, 0x96c654, n), k);
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
    b.noise(0.04, m => {          /* v130: kaum Verwerfung – aus der Kanzel sieht man Bretter und Pfosten aus nächster Nähe, 0,16 machte sie zackig */
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
      [-1, 1].forEach(s => m.at({ x: s * 0.56, y: rh + 0.16, rz: -s * 0.3 }, q => q.box(1.18, 0.06, 2.3, roof, { c: true, top: roof, bot: 0x6a5a48 })));
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

  /* ======================= v120: organische Tiermodelle ======================
     Warum neu: Der Hirsch bestand aus Kugeln, Quadern und Stäben (Kastenkopf, Stockbeine, Stockgeweih). Jetzt ist jedes
     Teil eine durchgehende Haut über Querschnitts-Ringe (skin): Profil-Tabellen geben Rückenlinie, Bauchlinie und Breite vor,
     die Normalen sind weich, die Fellfarbe wird je Ecke berechnet (Rücken dunkler, Bauch heller, Spiegel, Mähne, Läufe).
     Das Skelett (Gelenkpunkte, Längen der Läufe, Hals- und Kopfdrehpunkt) bleibt exakt wie bisher – Trefferzonen und
     Animation passen also weiter. Alles bleibt im Stil der Engine: Dreiecke mit Eckfarben, keine Texturen, kein Fell-Shader. */
  const RGB = c => Array.isArray(c) ? c : [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
  const mixc = (a, b, t) => { a = RGB(a); b = RGB(b); t = clamp(t, 0, 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  const mulc = (c, f) => [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)];
  const hsh = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  /* ruhige Fellschattierung: zwei weiche Wellen und feines Korn – kein sichtbares Muster */
  const fur = (p, k) => 1 + (k == null ? 1 : k) * (0.04 * Math.sin(p[0] * 21 + p[1] * 13 + 1.3) * Math.sin(p[2] * 17 - p[1] * 23) + 0.03 * Math.sin(p[2] * 7.1 + p[1] * 4.3) + 0.04 * (hsh(p[0], p[1], p[2]) - 0.5));
  /* Profil-Tabelle [[x, a, b, …], …]: weich (Catmull-Rom) zwischen den Stützstellen */
  function prof(T, x) {
    const n = T.length;
    if (x <= T[0][0]) return T[0].slice(1);
    if (x >= T[n - 1][0]) return T[n - 1].slice(1);
    let i = 0; while (i < n - 2 && x > T[i + 1][0]) i++;
    const a = T[Math.max(0, i - 1)], b = T[i], c = T[i + 1], d = T[Math.min(n - 1, i + 2)], t = (x - b[0]) / (c[0] - b[0]), t2 = t * t, t3 = t2 * t;
    const o = [];
    for (let k = 1; k < b.length; k++) { const p0 = a[k], p1 = b[k], p2 = c[k], p3 = d[k]; o.push(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)); }
    return o;
  }
  const v3sub = (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
  const v3crs = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
  const v3n = a => { const l = Math.hypot(a[0], a[1], a[2]); return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0]; };
  const v3dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
  /* Haut über Ringe: P[i][j] = Ring i, Punkt j rundum (geschlossen), C[i][j] = Farbe [r,g,b].
     Normalen aus den Nachbarpunkten (weich), nach außen gerichtet; Dreiecke werden so gewendet, dass die Vorderseite außen liegt.
     o.cap0 / o.cap1: Enden mit einem Fächer schließen (o.tip0 / o.tip1: Spitze statt Mittelpunkt).
     o.ref(i, j, p): Richtung, in die die Normale zeigen soll (für flache Ringe, z. B. die Brettfläche) – sonst vom Ringmittelpunkt weg. */
  function skin(b, P, C, o) {
    o = o || {};
    const n = P.length, m = P[0].length, M = b.M, v = b.v;
    const cen = P.map(R => { let x = 0, y = 0, z = 0; for (const p of R) { x += p[0]; y += p[1]; z += p[2]; } return [x / m, y / m, z / m]; });
    const axis = i => v3n(v3sub(cen[Math.min(n - 1, i + 1)], cen[Math.max(0, i - 1)]));
    const N = P.map((R, i) => R.map((p, j) => {
      const ti = v3sub(P[Math.min(n - 1, i + 1)][j], P[Math.max(0, i - 1)][j]), tj = v3sub(R[(j + 1) % m], R[(j + m - 1) % m]);
      let q = v3n(v3crs(tj, ti));
      if (!q[0] && !q[1] && !q[2]) q = i === 0 ? v3n(v3sub(cen[0], cen[1])) : axis(i);
      if (v3dot(q, o.ref ? o.ref(i, j, p) : v3sub(p, cen[i])) < 0) q = [-q[0], -q[1], -q[2]];
      return q;
    }));
    const put = (p, q, c) => {
      v.push(M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14]);
      const x = M[0] * q[0] + M[4] * q[1] + M[8] * q[2], y = M[1] * q[0] + M[5] * q[1] + M[9] * q[2], z = M[2] * q[0] + M[6] * q[1] + M[10] * q[2], l = Math.hypot(x, y, z) || 1;
      v.push(x / l, y / l, z / l, c[0], c[1], c[2]);
    };
    const tri = (pa, na, ca, pb, nb, cb, pc, nc, cc) => {
      const g = v3crs(v3sub(pb, pa), v3sub(pc, pa));
      if (Math.abs(g[0]) + Math.abs(g[1]) + Math.abs(g[2]) < 1e-14) return;
      if (v3dot(g, [na[0] + nb[0] + nc[0], na[1] + nb[1] + nc[1], na[2] + nb[2] + nc[2]]) < 0) { put(pa, na, ca); put(pc, nc, cc); put(pb, nb, cb); }
      else { put(pa, na, ca); put(pb, nb, cb); put(pc, nc, cc); }
    };
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < m; j++) {
      const j1 = (j + 1) % m;
      tri(P[i][j], N[i][j], C[i][j], P[i + 1][j], N[i + 1][j], C[i + 1][j], P[i + 1][j1], N[i + 1][j1], C[i + 1][j1]);
      tri(P[i][j], N[i][j], C[i][j], P[i + 1][j1], N[i + 1][j1], C[i + 1][j1], P[i][j1], N[i][j1], C[i][j1]);
    }
    [[0, o.cap0, o.tip0, 1, o.n0], [n - 1, o.cap1, o.tip1, n - 2, o.n1]].forEach(([i, cap, tip, k, nq]) => {
      if (!cap) return;
      const c = tip || cen[i], q = nq || v3n(v3sub(cen[i], cen[k])), cc = C[i][0];
      for (let j = 0; j < m; j++) { const j1 = (j + 1) % m; tri(c, q, cc, P[i][j], N[i][j], C[i][j], P[i][j1], N[i][j1], C[i][j1]); }
    });
    return b;
  }
  /* Ring aus Mitte c, Achsen U/V, Halbachsen hu, hv (oben/unten getrennt), Superellipse e; f(j, cos, sin) → Faktor oder [Faktor U, Faktor V] */
  function ring(c, U, V, hu, hvT, hvB, m, e, f) {
    const R = [], ex = 2 / (e || 2);
    for (let j = 0; j < m; j++) {
      const t = (j / m) * Math.PI * 2, cu = Math.cos(t), sv = Math.sin(t);
      const a = Math.sign(cu) * Math.pow(Math.abs(cu), ex), bb = Math.sign(sv) * Math.pow(Math.abs(sv), ex), k = f ? f(j, cu, sv) : 1;
      const ku = Array.isArray(k) ? k[0] : k, kv = Array.isArray(k) ? k[1] : k, h = (sv > 0 ? hvT : hvB) * kv, w = hu * ku;
      R.push([c[0] + U[0] * a * w + V[0] * bb * h, c[1] + U[1] * a * w + V[1] * bb * h, c[2] + U[2] * a * w + V[2] * bb * h]);
    }
    return R;
  }
  /* Ellipsoid (weich, korrekte Normalen auch bei starker Stauchung) */
  function ell(b, c, r, col, m, nr, o) {
    m = m || 10; nr = nr || 7; o = o || {};
    const P = [], C = [];
    for (let i = 1; i < nr; i++) {
      const th = (i / nr) * Math.PI, y = Math.cos(th), s = Math.sin(th), R = [], Cc = [];
      for (let j = 0; j < m; j++) { const t = (j / m) * Math.PI * 2, p = [c[0] + Math.cos(t) * s * r[0], c[1] + y * r[1], c[2] + Math.sin(t) * s * r[2]]; R.push(p); Cc.push(typeof col === "function" ? col(p, y) : RGB(col)); }
      P.push(R); C.push(Cc);
    }
    return skin(b, P, C, { cap0: true, cap1: true, tip0: [c[0], c[1] + r[1], c[2]], tip1: [c[0], c[1] - r[1], c[2]] });
  }
  /* Röhre entlang eines Pfades (Geweih, Waffen): Radius je Punkt, Farbe je Punkt; Rahmen ohne Verdrehen (Parallel-Transport) */
  function tube(b, pts, rad, cols, m, o) {
    o = o || {};
    const n = pts.length, P = [], C = [];
    let U = null;
    for (let i = 0; i < n; i++) {
      const T = v3n(v3sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]));
      if (!U) { const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; U = v3n(v3crs(T, ref)); }
      else { const d = v3dot(U, T); U = v3n([U[0] - T[0] * d, U[1] - T[1] * d, U[2] - T[2] * d]); }
      const V = v3crs(T, U), r = rad[i], R = [], Cc = [];
      for (let j = 0; j < m; j++) {
        const t = (j / m) * Math.PI * 2, k = o.rough ? 1 + (hsh(i * 3.1, j * 1.7, o.rough) - 0.5) * 0.35 : 1;
        R.push([pts[i][0] + (U[0] * Math.cos(t) + V[0] * Math.sin(t)) * r * k, pts[i][1] + (U[1] * Math.cos(t) + V[1] * Math.sin(t)) * r * k, pts[i][2] + (U[2] * Math.cos(t) + V[2] * Math.sin(t)) * r * k]);
        Cc.push(typeof cols[i] === "function" ? cols[i](j) : cols[i]);
      }
      P.push(R); C.push(Cc);
    }
    return skin(b, P, C, { cap0: o.cap0, cap1: o.cap1 !== false, tip1: o.tip ? pts[n - 1] : null });
  }
  /* Punkte auf einer Catmull-Rom-Kurve durch K (gleichmäßig im Parameter) */
  function curve(K, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * (K.length - 1), s = Math.min(K.length - 2, Math.floor(u)), t = u - s;
      const a = K[Math.max(0, s - 1)], p1 = K[s], p2 = K[s + 1], d = K[Math.min(K.length - 1, s + 2)], t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map(k => 0.5 * (2 * p1[k] + (-a[k] + p2[k]) * t + (2 * a[k] - 5 * p1[k] + 4 * p2[k] - d[k]) * t2 + (-a[k] + 3 * p1[k] - 3 * p2[k] + d[k]) * t3)));
    }
    return out;
  }
  const at3 = (pts, u) => { const f = clamp(u, 0, 1) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), t = f - i; return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t), lerp(pts[i][2], pts[i + 1][2], t)]; };

  /* Rothirsch v120 – Farben: Spätsommer-/Herbstdecke, rotbraun, Rücken dunkler, Bauch graubeige, Spiegel cremefarben mit dunklem Saum,
     Hals mit dunkler Brunftmähne, Läufe dunkelbraun, Schalen (Hufe) fast schwarz */
  const DEER = { coat: 0x93603a, back: 0x5f3a24, belly: 0xc0a988, leg: 0x553b2a, legD: 0x3c2a1c, mane: 0x47301f, maneL: 0x6d4b30, nape: 0x5f3e28,
    rump: 0xdcc59c, rumpB: 0x4a3120, face: 0x86603f, brow: 0x6b4730, muzzle: 0x9a7a5b, chin: 0xd3c1a6, nose: 0x1f1814, lip: 0x3a2b21,
    ring: 0xad8f6e, gland: 0x2e2018, hoof: 0x1b1511, earIn: 0xdcc2a6, earRim: 0x3d2b1f, eye: 0x170f0a };
  /* Rumpf: z (hinten → vorn), Rückenlinie, Bauchlinie, halbe Breite. Widerrist bei z≈0,24, Keule hinten tief herabgezogen,
     Bauch hinter den Rippen aufgezogen, tiefe Brust vorn. Passt in die Trefferzone (Ellipsoid 0,2 × 0,22 × 0,5 um y 0,98). */
  const TORSO = [[-0.605, 1.0, 0.955, 0.02], [-0.592, 1.055, 0.885, 0.07], [-0.572, 1.095, 0.83, 0.105], [-0.545, 1.125, 0.775, 0.132], [-0.5, 1.152, 0.71, 0.153], [-0.45, 1.168, 0.675, 0.166], [-0.36, 1.18, 0.655, 0.177], [-0.24, 1.17, 0.73, 0.172],
    [-0.1, 1.16, 0.73, 0.188], [0.04, 1.168, 0.7, 0.196], [0.17, 1.2, 0.675, 0.19], [0.28, 1.228, 0.665, 0.174], [0.38, 1.205, 0.69, 0.16], [0.46, 1.135, 0.75, 0.14], [0.51, 1.07, 0.81, 0.118], [0.545, 1.01, 0.87, 0.085], [0.565, 0.97, 0.91, 0.045], [0.575, 0.945, 0.93, 0.015]];
  function torsoCol(p, sv, z) {
    let c = mixc(DEER.coat, DEER.back, ss((sv - 0.3) / 0.55));
    c = mixc(c, DEER.belly, ss((-sv - 0.42) / 0.38) * (1 - ss((z + 0.36) / -0.12)));
    c = mixc(c, DEER.mane, ss((z - 0.38) / 0.16) * 0.55);                        /* zur Mähne hin dunkler */
    /* Muskelzeichnung ohne Textur: Schulter und Keule etwas heller, die Flanke dahinter etwas dunkler */
    const sh = (1 - ss(Math.abs(z - 0.25) / 0.12)) * (1 - ss(Math.abs(sv - 0.15) / 0.5)), ha = (1 - ss(Math.abs(z + 0.4) / 0.13)) * (1 - ss(Math.abs(sv + 0.05) / 0.55));
    const fl = (1 - ss(Math.abs(z + 0.13) / 0.12)) * (1 - ss(Math.abs(sv + 0.25) / 0.45));
    c = mulc(c, 1 + 0.07 * sh + 0.06 * ha - 0.08 * fl);
    /* Spiegel um den Wedel: heller Fleck auf der Rückseite mit dunklem Saum (Abstand zum Wedelansatz) */
    const rp = Math.hypot(p[0] / 0.125, (p[1] - 0.99) / 0.19, (z + 0.61) / 0.1);
    c = mixc(c, DEER.rumpB, ss((rp - 0.9) / 0.1) * (1 - ss((rp - 1.18) / 0.1)) * 0.55);
    c = mixc(c, DEER.rump, 1 - ss((rp - 0.8) / 0.14));
    return mulc(c, fur(p));
  }
  function deerBodyInto(b) {
    const P = [], C = [], m = 20, nZ = 26;
    for (let i = 0; i <= nZ; i++) {
      const u = i / nZ, z = lerp(TORSO[0][0], TORSO[TORSO.length - 1][0], u * 0.55 + (0.5 - 0.5 * Math.cos(Math.PI * u)) * 0.45),    /* an den Enden dichter: runde Keulen, runde Brust */ [top, bot, hw] = prof(TORSO, z), yc = (top + bot) / 2, hy = (top - bot) / 2;
      const haunch = 1 - ss(Math.abs(z + 0.36) / 0.16), shoulder = 1 - ss(Math.abs(z - 0.27) / 0.12), elbow = 1 - ss(Math.abs(z - 0.33) / 0.1);
      const R = ring([0, yc, z], [1, 0, 0], [0, 1, 0], hw, hy, hy, m, 2.35, (j, cu, sv) => [1 - 0.2 * Math.pow(Math.max(0, sv), 2) + 0.12 * haunch * Math.max(0, -sv) * (1 - Math.abs(sv)) + 0.05 * shoulder * Math.max(0, 1 - Math.abs(sv - 0.2) * 1.5) + 0.1 * elbow * Math.max(0, -sv) * (1 - Math.abs(sv)) * 2, 1]);
      P.push(R); C.push(R.map((p, j) => torsoCol(p, Math.sin((j / m) * Math.PI * 2), z)));
    }
    return skin(b, P, C, { cap0: true, cap1: true });
  }
  function deerBody() { G3.seed(5101); return deerBodyInto(MB()); }
  /* Träger (Hals): kräftig, unten die lange dunkle Brunftmähne mit unruhiger Kante, oben der Nacken */
  /* Halsprofil: t (Ansatz im Rumpf → Kopf), halbe Breite, Tiefe vorn (Kehle/Mähne), Tiefe hinten (Nacken) */
  const NECK = [[0, 0.11, 0.15, 0.13], [0.2, 0.148, 0.225, 0.185], [0.45, 0.12, 0.19, 0.148], [0.72, 0.092, 0.135, 0.105], [0.9, 0.075, 0.1, 0.085], [1, 0.062, 0.078, 0.07]];
  function deerNeckInto(b, t0) {
    const P = [], C = [], m = 16, n = 13, A = [0, -0.2, -0.12], B = [0, 0.535, 0.205];
    for (let i = 0; i <= n; i++) {
      const t = lerp(t0 || 0, 1, i / n), c = [0, lerp(A[1], B[1], t), lerp(A[2], B[2], t) + Math.sin(t * Math.PI) * 0.03];
      const dz = (B[2] - A[2]) + Math.cos(t * Math.PI) * 0.03 * Math.PI, dy = B[1] - A[1], l = Math.hypot(dy, dz), V = [0, -dz / l, dy / l];
      const [hw, hF, hB] = prof(NECK, t), mane = 0.34 * Math.sin(Math.PI * Math.min(1, t / 0.78)) * (t < 0.12 ? t / 0.12 : 1);
      const R = ring(c, [1, 0, 0], V, hw, hF, hB, m, 2.0, (j, cu, sv) => [1, sv > 0 ? 1 + Math.pow(sv, 2) * mane * (0.7 + 0.6 * hsh(i, j, 3)) : 1 - 0.04 * Math.pow(-sv, 3)]);
      P.push(R);
      C.push(R.map((p, j) => {
        const sv = Math.sin((j / m) * Math.PI * 2);
        let c0 = mixc(DEER.nape, DEER.mane, ss((sv + 0.25) / 0.6));
        if (sv > 0.3) c0 = mixc(c0, DEER.maneL, hsh(i, j, 5) * 0.55 * Math.min(1, mane * 3));          /* hellere Haarspitzen in der Mähne */
        c0 = mixc(c0, mixc(DEER.coat, DEER.back, 0.35), ss((0.22 - t) / 0.12) * 0.75);                /* am Ansatz in die Decke übergehen */
        return mulc(c0, fur(p, 1.3));
      }));
    }
    return skin(b, P, C, { cap0: true, cap1: true });
  }
  function deerNeck() { G3.seed(5103); return deerNeckInto(MB()); }
  /* Haupt (Kopf): z nach vorn, Drehpunkt am Hinterhaupt. Stirn, Augenbögen, schmaler werdender Äser, dunkler Windfang (Nase) */
  const HEAD = [[-0.075, 0.035, -0.045, 0.03], [-0.045, 0.078, -0.09, 0.066], [0.0, 0.1, -0.118, 0.082], [0.065, 0.104, -0.124, 0.09], [0.125, 0.088, -0.116, 0.091],
    [0.185, 0.064, -0.104, 0.074], [0.245, 0.045, -0.094, 0.06], [0.305, 0.031, -0.086, 0.051], [0.36, 0.019, -0.081, 0.048], [0.405, 0.006, -0.076, 0.047], [0.435, -0.004, -0.069, 0.044], [0.452, -0.018, -0.058, 0.034], [0.462, -0.034, -0.05, 0.016]];
  const DEYE = [0.073, 0.03, 0.15];
  function headCol(p, sv, z) {
    let c = mixc(DEER.face, DEER.brow, ss((sv - 0.35) / 0.4) * (1 - ss((z - 0.22) / 0.12)));
    c = mixc(c, DEER.mane, ss((0.02 - z) / 0.07) * 0.6);
    c = mixc(c, DEER.muzzle, ss((z - 0.24) / 0.08) * (1 - Math.abs(sv)) );
    c = mixc(c, DEER.chin, ss((-sv - 0.5) / 0.3) * ss((z - 0.26) / 0.08));
    c = mixc(c, DEER.lip, (1 - ss(Math.abs(sv + 0.5) / 0.1)) * ss((z - 0.33) / 0.05) * 0.85);
    c = mixc(c, DEER.nose, ss((z - 0.39) / 0.03) * ss((sv + 0.42) / 0.12));
    const de = Math.hypot(Math.abs(p[0]) - DEYE[0], p[1] - DEYE[1], p[2] - DEYE[2]);
    c = mixc(c, DEER.ring, (1 - ss((de - 0.018) / 0.02)) * 0.8);                   /* heller Augenring */
    const dg = Math.hypot(Math.abs(p[0]) - 0.066, p[1] - 0.032, p[2] - 0.2);
    c = mixc(c, DEER.gland, 1 - ss((dg - 0.006) / 0.014));                         /* Tränengrube vor dem Auge */
    return mulc(c, fur(p, 0.8));
  }
  function deerHeadInto(b, P_, sc, vr) {
    const P = [], C = [], m = 16, nZ = 20;
    for (let i = 0; i <= nZ; i++) {
      const z = lerp(HEAD[0][0], HEAD[HEAD.length - 1][0], i / nZ), [top, bot, hw] = prof(HEAD, z), yc = (top + bot) / 2, hy = (top - bot) / 2;
      const eyeK = 1 - ss(Math.abs(z - DEYE[2]) / 0.05);
      const R = ring([0, yc, z], [1, 0, 0], [0, 1, 0], hw, hy, hy, m, 2.3, (j, cu, sv) => [1 - 0.12 * Math.max(0, sv) * Math.max(0, sv) + 0.07 * eyeK * Math.max(0, 1 - Math.abs(sv - 0.45) * 2), 1]);
      P.push(R); C.push(R.map((p, j) => headCol(p, Math.sin((j / m) * Math.PI * 2), z)));
    }
    skin(b, P, C, { cap0: true, cap1: true });
    [-1, 1].forEach(s => {
      /* Auge: liegt seitlich im Schädel, nur die Wölbung schaut heraus; dunkelbraun mit kleinem Glanzlicht, darüber ein Lidwulst */
      ell(b, [s * DEYE[0], DEYE[1], DEYE[2]], [0.016, 0.0145, 0.019], DEER.eye, 8, 6);
      ell(b, [s * (DEYE[0] + 0.0115), DEYE[1] + 0.006, DEYE[2] + 0.006], [0.0035, 0.0035, 0.0035], 0xf0ebe2, 5, 3);
      ell(b, [s * (DEYE[0] - 0.002), DEYE[1] + 0.013, DEYE[2] - 0.002], [0.018, 0.007, 0.022], DEER.brow, 7, 4);
      ell(b, [s * 0.021, -0.03, 0.455], [0.008, 0.012, 0.006], 0x0b0806, 6, 4);                                       /* Nüstern */
    });
    antlersInto(b, P_, sc, vr);
    return b;
  }
  function deerHead(P, sc, vr) { G3.seed(5102 + P); return deerHeadInto(MB(), P, sc, vr); }

  /* Geweih v120: Rosenstock, Rose, Stange in Leierform (aus, zurück, oben wieder nach vorn), Augsprosse, ab 10 Enden die Eissprosse,
     Mittelsprosse, oben Gabel oder Krone (12-Ender: 3 Kronenenden, 14: 4, 16: 5). Jede Stange ist etwas anders – fester Seed aus
     Enden, Güte und Variante: dasselbe Stück sieht im Revier und an der Wand immer gleich aus. */
  const ANT = { base: 0x4c3a28, mid: 0x6a5136, tip: 0xeadfc6, burr: 0x45352a, ped: 0x6b4a32 };
  function antlerPlan(P) { const n = Math.max(3, Math.round(P / 2)), t = ["aug"]; if (n >= 5) t.push("eis"); t.push("mittel"); return { n, tines: t, crown: n - t.length - 1 }; }
  function antlersInto(b, P, sc, vr) {
    const plan = antlerPlan(P), r = mulberry(P * 131 + (vr || 0) * 977 + Math.round((sc || 0) * 40) * 7 + 11);
    const Ls0 = 0.5 + 0.36 * clamp(sc, 0, 1), r0 = 0.027 + 0.016 * clamp(sc, 0, 1);
    const acol = (t, f) => { const k = hsh(t * 9.1, f || 0, 2.7); let c = t < 0.5 ? mixc(ANT.base, ANT.mid, t / 0.5) : mixc(ANT.mid, ANT.tip, ss((t - 0.62) / 0.34)); return mulc(c, 0.88 + k * 0.24); };
    [-1, 1].forEach(s => {
      const Ls = Ls0 * (1 + (r() - 0.5) * 0.08), spread = 1 + (r() - 0.5) * 0.14, lean = (r() - 0.5) * 0.08;
      const p0 = [s * 0.045, 0.094, 0.032], K = [[0, 0, 0], [0.19, 0.2, -0.19], [0.41, 0.47, -0.31], [0.5 + lean, 0.75, -0.24], [0.43 + lean, 0.98, 0.0]]
        .map(q => [p0[0] + s * q[0] * spread * Ls, p0[1] + q[1] * Ls, p0[2] + q[2] * Ls]);
      const pts = curve(K, 11), rad = pts.map((_, i) => { const u = i / 10; return u > 0.92 ? r0 * 0.4 * (1 - (u - 0.92) / 0.08) + 0.0035 : r0 * (1 - 0.52 * u); });
      /* Rosenstock (kurz, behaart) und Rose (rauer Kranz) */
      tube(b, [[s * 0.026, 0.045, 0.03], [s * 0.038, 0.08, 0.032], p0], [r0 * 1.0, r0 * 1.05, r0 * 1.02], [RGB(DEER.brow), RGB(DEER.brow), RGB(ANT.ped)], 7, { cap1: false });
      const d0 = v3n(v3sub(pts[1], pts[0]));
      tube(b, [[p0[0] - d0[0] * 0.006, p0[1] - d0[1] * 0.006, p0[2] - d0[2] * 0.006], [p0[0] + d0[0] * 0.012, p0[1] + d0[1] * 0.012, p0[2] + d0[2] * 0.012]], [r0 * 1.5, r0 * 1.42], [RGB(ANT.burr), RGB(ANT.burr)], 9, { cap0: true, cap1: true, rough: 3 + s });
      tube(b, pts, rad, pts.map((_, i) => acol(i / 10, s)), 7, { tip: true });
      /* Sprossen */
      const tines = [];
      plan.tines.forEach(k => tines.push(k === "aug" ? { u: 0.07, d: [0.16, 0.32, 0.93], l: 0.36 } : k === "eis" ? { u: 0.15, d: [0.24, 0.44, 0.86], l: 0.27 } : { u: 0.47, d: [0.34, 0.2, 0.92], l: 0.31 }));
      const CR = [{ u: 0.79, d: [0.4, 0.72, 0.56], l: 0.22 }, { u: 0.84, d: [-0.34, 0.78, 0.52], l: 0.2 }, { u: 0.88, d: [0.6, 0.7, -0.3], l: 0.19 }, { u: 0.92, d: [-0.2, 0.72, -0.62], l: 0.17 }];
      if (plan.crown === 1) tines.push({ u: 0.84, d: [0.1, 0.7, 0.7], l: 0.21 });
      else for (let k = 0; k < plan.crown; k++) tines.push(CR[k]);
      tines.forEach((T, ti) => {
        const q = at3(pts, T.u), rb = r0 * (1 - 0.52 * T.u) * 0.84, l = Ls * T.l * (1 + (r() - 0.5) * 0.3);
        const d = v3n([s * T.d[0] + (r() - 0.5) * 0.16, T.d[1] + (r() - 0.5) * 0.12, T.d[2] + (r() - 0.5) * 0.12]);
        const up = T.u > 0.7 ? [-s * 0.15, 0.4, 0] : [0, 1, 0], tp = [], tr = [], tc = [];
        for (let k = 0; k <= 4; k++) {
          const t = k / 4, bend = l * 0.24 * t * t;
          tp.push([q[0] + d[0] * (l * t - rb * 0.4) + up[0] * bend, q[1] + d[1] * (l * t - rb * 0.4) + up[1] * bend, q[2] + d[2] * (l * t - rb * 0.4) + up[2] * bend]);
          tr.push(k === 4 ? 0.003 : rb * (1 - t * 0.72));
          tc.push(acol(lerp(Math.max(0.3, T.u), 1, t), ti));
        }
        tube(b, tp, tr, tc, 5, { tip: true });
      });
    });
    return b;
  }
  /* Lauscher: Blatt, außen Decke, innen hell mit dunklem Rand */
  function deerEarInto(b, s) {
    b.at({ rz: -s * 0.95, rx: -0.2 }, q => {
      ell(q, [0, 0.094, 0], [0.036, 0.096, 0.017], (p, y) => mulc(mixc(DEER.face, DEER.earRim, ss((y - 0.5) / 0.45)), fur(p, 0.6)), 10, 8);
      ell(q, [0, 0.09, 0.0095], [0.024, 0.074, 0.0085], (p, y) => mixc(DEER.earIn, DEER.earRim, Math.max(ss((Math.abs(p[0]) / 0.024 - 0.65) / 0.35), ss((y - 0.6) / 0.4))), 8, 6);
    });
    return b;
  }
  function deerEar(s) { return deerEarInto(MB(), s); }
  function deerTail() { const b = MB(); ell(b, [0, -0.07, -0.02], [0.036, 0.085, 0.03], (p, y) => mulc(mixc(DEER.back, DEER.rumpB, ss((-y + 0.2) / 0.8)), fur(p)), 8, 6); return b; }
  /* Läufe: oben kräftig (Unterarm/Keule), Vorderfußwurzel- bzw. Sprunggelenk als Verdickung, schlanker Röhrenknochen,
     Fesselgelenk, schräge Fessel, gespaltene Schalen, Afterklauen. Länge und Gelenkpunkte wie bisher. */
  const LEG_FU = [[0, 0.044, 0.074, 0], [-0.1, 0.047, 0.068, 0.006], [-0.2, 0.042, 0.05, 0.005], [-0.3, 0.029, 0.035, 0], [-0.362, 0.031, 0.039, 0.002], [-0.41, 0.026, 0.031, 0]];
  const LEG_HU = [[0, 0.08, 0.115, -0.01], [-0.1, 0.07, 0.1, -0.012], [-0.2, 0.048, 0.07, -0.01], [-0.3, 0.031, 0.048, -0.008], [-0.37, 0.027, 0.046, -0.016], [-0.405, 0.026, 0.034, -0.008], [-0.43, 0.025, 0.03, 0]];
  const LEG_LO = [[0.01, 0.031, 0.037, 0], [-0.06, 0.022, 0.026, 0], [-0.24, 0.021, 0.025, 0], [-0.305, 0.027, 0.032, -0.002], [-0.345, 0.023, 0.027, 0.01], [-0.383, 0.026, 0.032, 0.018], [-0.41, 0.03, 0.038, 0.024], [-0.44, 0.033, 0.043, 0.028]];
  function legInto(b, T, colAt, cap1) {
    const P = [], C = [], m = 8, n = 11, y0 = T[0][0], y1 = T[T.length - 1][0], TA = T.slice().reverse();   /* prof braucht aufsteigende Stützstellen */
    for (let i = 0; i <= n; i++) {
      const y = lerp(y0, y1, i / n), [hx, hz, dz] = prof(TA, y), R = ring([0, y, dz], [1, 0, 0], [0, 0, 1], hx, hz, hz, m, 2.1);
      P.push(R); C.push(R.map(p => colAt(p, y)));
    }
    return skin(b, P, C, { cap0: true, cap1 });
  }
  function deerUpper(front) {
    const b = MB();
    legInto(b, front ? LEG_FU : LEG_HU, (p, y) => mulc(mixc(front ? mixc(DEER.coat, DEER.leg, 0.35) : DEER.coat, DEER.leg, ss((-y - 0.12) / 0.26)), fur(p)), false);
    if (!front) ell(b, [0, -0.37, -0.05], [0.022, 0.03, 0.022], DEER.leg, 6, 4);                  /* Fersenhöcker am Sprunggelenk */
    return b;
  }
  function deerLower(front) {
    const b = MB();
    legInto(b, LEG_LO, (p, y) => {
      if (y < -0.388) return mulc(RGB(DEER.hoof), 1 + 0.6 * ss((-0.388 - y) / 0.05) * 0.3);                              /* Schalen */
      return mulc(mixc(DEER.leg, DEER.legD, ss((-y - 0.28) / 0.08)), fur(p, 0.6));
    }, true);
    ell(b, [0, -0.335, -0.03], [0.012, 0.014, 0.012], DEER.hoof, 6, 4);                              /* Afterklauen */
    void front;
    return b;
  }
  /* Keiler v135 – neu modelliert, gleiche Bauweise (Haut über Querschnitts-Ringe, Eckfarben, weiche Normalen), gleiche Trefferzonen.
     Vorher: fast schwarze Wurst mit waagerechtem Rücken, Säulenbeinen ohne Gelenk, runden Scheibenohren und Waffen, die wie
     weiße Stacheln aus der Backe nach unten standen. Jetzt:
     • Rumpf keilförmig: hoher Widerrist mit Buckel, tiefe Brust, aufgezogener Bauch, kleine kompakte Keulen, seitlich schmal
     • Borstenkamm (einzelne Borstenbüschel) vom Haupt bis über den Rücken – liest sich auch auf 150 m als Wildschwein
     • Haupt lang und keilförmig, Rüsselscheibe, kleine hoch sitzende Lichter unter einem Brauenwulst, spitze aufrechte Teller,
       heller Backenbart; Gewehre (unten) wachsen am Gebrech nach außen, oben und hinten, die Haderer (oben) kurz nach außen –
       ihre sichtbare Länge folgt den gespeicherten Zentimetern
     • Läufe mit Gelenk (Vorderfußwurzel bzw. Sprunggelenk), schlanke Röhren, gespaltene Schalen mit Afterklauen
     • Schwarte graubraun mit hellen Grannenspitzen statt fast schwarz: Flanke heller, Rücken und Bauch dunkler */
  const BOAR = { coat: 0x66543f, coatL: 0xa39078, coatD: 0x352b22, ridge: 0x221a14, belly: 0x44382d, leg: 0x33291f, legD: 0x211a15,
    beard: 0x9a8c7b, snout: 0x4d4037, disc: 0x93766a, discD: 0x2b201c, lip: 0x261d17, hoof: 0x17120f, hoofL: 0x433830,
    tusk: 0xf4eedf, tuskB: 0xc8b083, eye: 0x120c08, earIn: 0x2e241d };
  /* Schwarte: dunkler Grund, graubraune Grannenspitzen unregelmäßig verteilt (kein Muster), Rücken und Bauch dunkler, Flanke heller */
  function boarCoat(p, sv, k) {
    const g = hsh(p[0] * 3.1, p[1] * 2.3, p[2] * 2.9), g2 = hsh(p[2] * 1.7 + 3, p[0] * 4.1, p[1] * 3.3);
    let c = mixc(BOAR.coat, BOAR.coatD, ss((sv - 0.5) / 0.42));
    c = mixc(c, BOAR.belly, ss((-sv - 0.3) / 0.5));
    c = mixc(c, BOAR.coatL, g * g * (k == null ? 0.7 : k) * (1 - ss((sv - 0.6) / 0.3)));
    return mulc(c, (0.93 + 0.14 * g2) * fur(p, 1.4));
  }
  const boarHair = (p, sv, k) => boarCoat(p, sv || 0, k);
  const BOAR_T = [[-0.535, 0.555, 0.475, 0.03], [-0.51, 0.615, 0.4, 0.1], [-0.455, 0.65, 0.33, 0.146], [-0.37, 0.668, 0.305, 0.166], [-0.29, 0.678, 0.345, 0.17], [-0.2, 0.69, 0.39, 0.172],
    [-0.06, 0.735, 0.37, 0.19], [0.08, 0.805, 0.322, 0.205], [0.18, 0.86, 0.29, 0.213], [0.27, 0.874, 0.288, 0.212], [0.36, 0.83, 0.318, 0.2], [0.44, 0.752, 0.356, 0.18],
    [0.49, 0.68, 0.392, 0.15], [0.52, 0.61, 0.43, 0.09], [0.535, 0.56, 0.46, 0.03]];
  const crestH = z => ss((z + 0.34) / 0.42) * (1 - ss((z - 0.38) / 0.12));        /* Borstenkamm: über dem Widerrist am höchsten */
  /* Borstenbüschel: kurzer Kegel, unten im Fell verankert, Spitze heller */
  function bristle(b, p, d, l, r, c0, c1) {
    const n = v3n(d), q1 = [p[0] + n[0] * l * 0.55, p[1] + n[1] * l * 0.55, p[2] + n[2] * l * 0.55], q2 = [p[0] + n[0] * l, p[1] + n[1] * l, p[2] + n[2] * l];
    tube(b, [p, q1, q2], [r, r * 0.62, r * 0.12], [RGB(c0), mixc(c0, c1, 0.4), RGB(c1)], 4, { tip: true });
  }
  function boarBody() {
    G3.seed(5201);
    const b = MB(), P = [], C = [], m = 24, nZ = 34;
    for (let i = 0; i <= nZ; i++) {
      const u = i / nZ, z = lerp(BOAR_T[0][0], BOAR_T[BOAR_T.length - 1][0], u * 0.55 + (0.5 - 0.5 * Math.cos(Math.PI * u)) * 0.45), [top, bot, hw] = prof(BOAR_T, z), yc = (top + bot) / 2, hy = (top - bot) / 2;
      const sh = 1 - ss(Math.abs(z - 0.2) / 0.15), ham = 1 - ss(Math.abs(z + 0.38) / 0.14);
      const R = ring([0, yc, z], [1, 0, 0], [0, 1, 0], hw, hy, hy, m, 2.25, (j, cu, sv) => [1 - 0.26 * Math.pow(Math.max(0, sv), 2) - 0.06 * Math.pow(Math.max(0, -sv), 3)
        + 0.07 * sh * Math.max(0, 1 - Math.abs(sv - 0.05) * 1.6) + 0.08 * ham * Math.max(0, 1 - Math.abs(sv + 0.05) * 1.5), 1 + (Math.abs(sv) < 0.95 ? 0.02 * (hsh(i, j, 9) - 0.5) : 0)]);
      P.push(R);
      C.push(R.map((p, j) => {
        const sv = Math.sin((j / m) * Math.PI * 2);
        let c = boarCoat(p, sv);
        c = mixc(c, BOAR.ridge, ss((sv - 0.78) / 0.18) * crestH(z) * 0.85);
        return mixc(c, BOAR.leg, ss((-sv - 0.62) / 0.3) * Math.max(sh, ham) * 0.55);          /* zu den Läufen hin dunkler */
      }));
    }
    skin(b, P, C, { cap0: true, cap1: true });
    /* Borstenkamm: Büschel entlang der Rückenlinie, nach hinten gelegt, über dem Widerrist am längsten */
    const r = mulberry(5203);
    for (let z = -0.32; z <= 0.5; z += 0.019) {
      const h = crestH(z); if (h < 0.06) continue;
      const top = prof(BOAR_T, z)[0];
      [-1, 1].forEach(sd => {
        const x = sd * (0.006 + r() * 0.012), l = (0.016 + 0.046 * h) * (0.75 + r() * 0.5);
        bristle(b, [x, top - 0.016, z + (r() - 0.5) * 0.01], [x * 5, 0.62, -0.8 - r() * 0.3], l, 0.014 + 0.008 * h, BOAR.ridge, mixc(BOAR.ridge, BOAR.coatL, 0.55));
      });
    }
    /* Pürzel (Schwanz), hängend, mit Quaste */
    tube(b, [[0, 0.585, -0.522], [0, 0.545, -0.558], [0, 0.47, -0.572], [0, 0.4, -0.568]], [0.016, 0.012, 0.009, 0.005], [RGB(BOAR.coat), RGB(BOAR.coatD), RGB(BOAR.ridge), RGB(BOAR.ridge)], 5, { tip: true });
    ell(b, [0, 0.4, -0.569], [0.018, 0.042, 0.014], BOAR.ridge, 6, 4);
    return b;
  }
  /* Läufe mit Gelenk: oben Unterarm bzw. Keule (kräftig), unten schlanke Röhre, Fessel, gespaltene Schalen, Afterklauen.
     Nur Optik: die Trefferzonen der Läufe bleiben die gerade Linie wie bisher (SP.keiler.legs, lu 0,36). */
  const BLU = 0.17, BLL = 0.19;
  const BLEG_FU = [[0.02, 0.058, 0.07, 0], [-0.06, 0.05, 0.062, 0.004], [-0.13, 0.035, 0.043, 0.004], [-0.178, 0.03, 0.036, 0]];
  const BLEG_HU = [[0.02, 0.062, 0.084, -0.01], [-0.07, 0.05, 0.066, -0.014], [-0.135, 0.033, 0.046, -0.022], [-0.178, 0.028, 0.04, -0.026]];
  const BLEG_LO = [[0.012, 0.031, 0.036, 0], [-0.03, 0.027, 0.031, 0], [-0.11, 0.022, 0.026, 0.002], [-0.14, 0.025, 0.03, 0.006], [-0.158, 0.023, 0.028, 0.013], [-0.172, 0.022, 0.028, 0.019]];
  const boarLegCol = (p, k) => mulc(mixc(BOAR.leg, BOAR.legD, k), 0.92 + 0.16 * hsh(p[0] * 5, p[1] * 5, p[2] * 5));
  function boarUpperInto(b, front) {
    legInto(b, front ? BLEG_FU : BLEG_HU, (p, y) => mixc(boarCoat(p, 0.1, 0.4), boarLegCol(p, 0), ss((-y - 0.02) / 0.12)), true);
    if (!front) ell(b, [0, -0.168, -0.056], [0.02, 0.026, 0.02], BOAR.leg, 6, 4);          /* Fersenhöcker */
    return b;
  }
  function boarLowerInto(b) {
    legInto(b, BLEG_LO, (p, y) => boarLegCol(p, ss((-y - 0.05) / 0.1)), true);
    [-1, 1].forEach(s => {
      ell(b, [s * 0.0125, -0.178, 0.027], [0.0135, 0.015, 0.023], (p, y) => mixc(BOAR.hoof, BOAR.hoofL, ss((y - 0.2) / 0.7) * 0.6), 7, 5);   /* Schalen */
      ell(b, [s * 0.017, -0.148, -0.021], [0.006, 0.009, 0.008], BOAR.hoof, 5, 3);                                                              /* Afterklauen */
    });
    return b;
  }
  const boarUpper = front => boarUpperInto(MB(), front), boarLower = () => boarLowerInto(MB());
  function boarLeg(front) { const b = MB(); boarUpperInto(b, front); b.at({ y: -BLU, z: front ? 0 : -0.025 }, q => boarLowerInto(q)); return b; }
  /* Haupt: z nach vorn, Drehpunkt am Hinterhaupt; außen um 0,38 nach unten geneigt wie bisher (Haltungen der Animation bleiben gleich) */
  const BOAR_H = [[-0.14, 0.1, -0.12, 0.09], [-0.09, 0.185, -0.215, 0.16], [-0.02, 0.205, -0.235, 0.176], [0.06, 0.19, -0.222, 0.165], [0.14, 0.15, -0.185, 0.133],
    [0.22, 0.112, -0.148, 0.103], [0.3, 0.08, -0.115, 0.08], [0.37, 0.058, -0.094, 0.067], [0.425, 0.045, -0.083, 0.062], [0.462, 0.04, -0.077, 0.064], [0.48, 0.03, -0.069, 0.06], [0.49, 0.0, -0.048, 0.04]];
  function headRing(z, m, i) {
    const [top, bot, hw] = prof(BOAR_H, z), yc = (top + bot) / 2, hy = (top - bot) / 2, back = 1 - ss((z - 0.02) / 0.14), snout = ss((z - 0.24) / 0.1);
    return ring([0, yc, z], [1, 0, 0], [0, 1, 0], hw, hy, hy, m, 2.3 + 0.5 * snout, (j, cu, sv) => [1 - 0.22 * Math.pow(Math.max(0, sv), 2) + 0.07 * back * Math.max(0, -sv) * (1 - Math.abs(sv)) * 2,
      1 + (i != null ? 0.022 * (hsh(i, j, 13) - 0.5) * (z < 0.45 ? 1 : 0) : 0)]);
  }
  /* Punkt auf der Kopfhaut: Längsstelle z, Winkel w um die Achse (0 = Seite, π/2 = oben, −π/2 = unten) */
  function headPt(z, w) { const R = headRing(z, 96), j = Math.round((((w / (Math.PI * 2)) % 1) + 1) % 1 * 96) % 96; return R[j]; }
  const BEYE = [0.13, 0.6];
  function boarHeadCol(p, sv, z, eye) {
    let c = boarCoat(p, sv, 0.62);
    c = mixc(c, BOAR.beard, (1 - ss(Math.abs(z - 0.03) / 0.15)) * ss((-sv - 0.05) / 0.5) * 0.72 * (0.7 + 0.6 * hsh(p[0] * 5, p[1] * 5, p[2] * 5)));    /* Backenbart */
    c = mixc(c, BOAR.snout, ss((z - 0.22) / 0.12));
    c = mixc(c, BOAR.lip, (1 - ss(Math.abs(sv + 0.42) / 0.1)) * ss((z - 0.19) / 0.06) * 0.85);                                                   /* Lefze */
    c = mixc(c, BOAR.disc, ss((z - 0.473) / 0.01));                                                                                               /* Rüsselscheibe */
    const de = Math.hypot(Math.abs(p[0]) - eye[0], p[1] - eye[1], p[2] - eye[2]);
    return mixc(c, BOAR.coatD, (1 - ss((de - 0.012) / 0.02)) * 0.8);                                                                             /* dunkel um die Lichter */
  }
  /* Teller (Ohren): aufrecht, spitz zulaufend, nach vorn offen (Becher), außen Schwarte, innen dunkel mit hellen Haarrändern, Haarpinsel an der Spitze */
  function boarEarInto(b, s) {
    const P = [], C = [], n = 7, m = 10, L = 0.14;
    for (let i = 0; i <= n; i++) {
      const t = i / n, w = 0.05 * Math.pow(1 - t, 0.7) + 0.003, d = 0.012 * (1 - t) + 0.003, R = [], Cc = [];
      for (let j = 0; j < m; j++) {
        const a = (j / m) * Math.PI * 2, cu = Math.cos(a), sv = Math.sin(a), cup = 0.016 * (1 - t) * cu * cu;
        const p = [cu * w, t * L, 0.014 * t * t + sv * d + cup];
        R.push(p);
        const rim = Math.abs(cu) > 0.8 ? 1 : 0;
        Cc.push(sv > 0.2 && !rim ? mixc(BOAR.earIn, BOAR.beard, hsh(i, j, 31) * 0.35) : boarCoat(p, 0.2, 0.7 + rim * 0.3));
      }
      P.push(R); C.push(Cc);
    }
    skin(b, P, C, { cap0: true, cap1: true });
    bristle(b, [0, L * 0.9, 0.012], [0, 1, 0.25], 0.035, 0.008, BOAR.coatD, BOAR.coatL);
    void s;
    return b;
  }
  /* Waffen: Gewehre aus dem Unterkiefer nach außen, oben und hinten gebogen; Haderer aus dem Oberkiefer kurz nach außen und oben.
     w: sichtbare Länge nach den gespeicherten Zentimetern (8 cm → 0,7, 24 cm → 1,5) */
  function boarTusksInto(q, s, cm) {
    const w = 0.7 + clamp((cm - 8) / 16, 0, 1) * 0.8, X = p => [s * p[0], p[1], p[2]];
    const g0 = headPt(0.392, -0.6), gb = [g0[0] - 0.006, g0[1] + 0.004, g0[2]];
    const G = curve([[0, 0, 0], [0.011, 0.019, 0.004], [0.021, 0.038, -0.003], [0.026, 0.056, -0.019], [0.022, 0.069, -0.04]].map(p => X([gb[0] + p[0] * w, gb[1] + p[1] * w, gb[2] + p[2] * w])), 9);
    tube(q, G, G.map((_, i) => { const u = i / 8; return u > 0.9 ? 0.0016 : (0.0125 - 0.0095 * u) * (0.9 + 0.12 * w); }), G.map((_, i) => { const u = i / 8; return u < 0.25 ? mixc(BOAR.tuskB, BOAR.tusk, u / 0.25) : u > 0.8 ? mixc(BOAR.tusk, 0xffffff, (u - 0.8) / 0.2) : RGB(BOAR.tusk); }), 6, { tip: true, cap0: true });
    const h0 = headPt(0.362, -0.4), hb = [h0[0] - 0.007, h0[1], h0[2]];
    const Hd = curve([[0, 0, 0], [0.013, 0.012, -0.003], [0.021, 0.026, -0.014]].map(p => X([hb[0] + p[0] * w * 0.85, hb[1] + p[1] * w * 0.85, hb[2] + p[2] * w * 0.85])), 6);
    tube(q, Hd, Hd.map((_, i) => i === 5 ? 0.0015 : 0.0115 * (1 - i / 6.5)), Hd.map((_, i) => mixc(BOAR.tuskB, BOAR.tusk, Math.min(1, i / 3))), 6, { tip: true, cap0: true });
  }
  function boarHeadInto(b, sc, cm) {
    b.at({ rx: 0.38 }, q => {
      const P = [], C = [], m = 20, nZ = 24, e = headPt(BEYE[0], BEYE[1]), eye = [e[0], e[1], e[2]];
      for (let i = 0; i <= nZ; i++) {
        const z = lerp(BOAR_H[0][0], BOAR_H[BOAR_H.length - 1][0], i / nZ), R = headRing(z, m, i);
        P.push(R); C.push(R.map((p, j) => boarHeadCol(p, Math.sin((j / m) * Math.PI * 2), z, eye)));
      }
      skin(q, P, C, { cap0: true, cap1: true });
      const rr = mulberry(5207);
      [-1, 1].forEach(s => {
        const X = p => [s * p[0], p[1], p[2]];
        ell(q, [s * 0.019, -0.026, 0.488], [0.011, 0.014, 0.005], BOAR.discD, 6, 4);                                      /* Nasenlöcher */
        ell(q, X([eye[0] - 0.003, eye[1], eye[2]]), [0.0095, 0.009, 0.011], BOAR.eye, 7, 5);                              /* Lichter */
        ell(q, X([eye[0] + 0.004, eye[1] + 0.003, eye[2] + 0.004]), [0.0026, 0.0026, 0.0026], 0xe9e4da, 4, 3);
        const br = headPt(0.122, 0.8);
        ell(q, X([br[0] - 0.003, br[1] + 0.003, br[2]]), [0.02, 0.009, 0.03], (p) => boarCoat(p, 0.8, 0.3), 7, 4);      /* Brauenwulst */
        const ep = headPt(0.06, 0.98);
        q.at({ x: s * ep[0], y: ep[1] - 0.012, z: ep[2], rz: -s * 0.4, rx: -0.32 }, o => boarEarInto(o, s));           /* Teller */
        /* Backenbart: helle Büschel unten an den Wangen, nach hinten und unten */
        for (let k = 0; k < 6; k++) {
          const p = headPt(-0.05 + k * 0.032, -0.62 - (k % 2) * 0.22 - rr() * 0.08);
          bristle(q, X([p[0] - 0.007, p[1] + 0.004, p[2]]), [s * (0.3 + rr() * 0.15), -0.4, -0.85], 0.022 + rr() * 0.012, 0.013, mixc(BOAR.coat, BOAR.beard, 0.4), BOAR.beard);
        }
        boarTusksInto(q, s, cm || 8 + sc * 16);
      });
      /* Kamm setzt sich auf dem Haupt fort */
      for (let z = -0.12; z <= 0.04; z += 0.026) { const p = headPt(z, Math.PI / 2); bristle(q, [p[0] + (rr() - 0.5) * 0.02, p[1] - 0.012, p[2]], [0, 0.8, -0.65], 0.03 + 0.02 * ss((0.04 - z) / 0.16), 0.012, BOAR.ridge, mixc(BOAR.ridge, BOAR.coatL, 0.45)); }
    });
    return b;
  }
  function boarHead(sc, cm) { G3.seed(5202); return boarHeadInto(MB(), sc, cm); }
  /* Fasanenhahn v135: organisch wie Hirsch und Keiler statt aus Kugeln und Quadern. Kupferroter Rumpf mit dunklen Schuppenflecken,
     graugrüner Bürzel, angelegte Schwingen mit Querbinden, langer gebänderter Stoß (dieselben Federn wie an der Trophäe), dunkelgrün
     bis violett schillernder Hals mit weißem Ring, rote Rosen (Gesichtslappen), Federohren. Ständer (Beine) als eigene Knoten,
     damit sie im Flug und beim erlegten Stück angezogen sind. Trefferzonen unverändert. */
  const PHC = { copper: 0xc4672c, copperD: 0x8f3f1b, gold: 0xe0aa52, scale: 0x2c1b10, rump: 0x7f8c74, belly: 0x5a3720, wing: 0xc9a46c, wingD: 0x6f5232,
    neck: 0x1c5a52, neckB: 0x23407a, head: 0x2c2a5e, ring: 0xf4f1e8, red: 0xd2281e, redD: 0x9c1a14, beak: 0xdcc58b, leg: 0x8d8379, eye: 0xd9b23a };
  const PH_T = [[-0.215, 0.272, 0.238, 0.02], [-0.19, 0.305, 0.185, 0.06], [-0.12, 0.33, 0.152, 0.09], [-0.03, 0.344, 0.138, 0.1], [0.06, 0.348, 0.14, 0.097],
    [0.13, 0.342, 0.16, 0.082], [0.18, 0.328, 0.192, 0.058], [0.21, 0.31, 0.23, 0.028]];
  function phCol(p, sv, z) {
    let c = mixc(PHC.copper, PHC.gold, ss((sv + 0.1) / 0.6) * 0.35 * (1 - ss((z - 0.1) / 0.08)));
    c = mixc(c, PHC.copperD, ss((z - 0.08) / 0.1) * 0.35);                                          /* Brust tiefer kupferrot */
    c = mixc(c, PHC.rump, ss((-z - 0.06) / 0.08) * ss((sv - 0.2) / 0.4));                            /* Bürzel graugrün */
    c = mixc(c, PHC.belly, ss((-sv - 0.45) / 0.35));
    const sp = hsh(p[0] * 97.3, p[1] * 61.1, p[2] * 83.7);
    if (sp > 0.72) c = mixc(c, PHC.scale, 0.18 + 0.3 * (sp - 0.72) / 0.28);                             /* dunkle Federspitzen, verstreut */
    return mulc(c, 0.94 + 0.12 * hsh(p[2], p[0], p[1]));
  }
  function phBody() {
    G3.seed(5301);
    const b = MB(), P = [], C = [], m = 20, nZ = 22;
    for (let i = 0; i <= nZ; i++) {
      const z = lerp(PH_T[0][0], PH_T[PH_T.length - 1][0], i / nZ), [top, bot, hw] = prof(PH_T, z), yc = (top + bot) / 2, hy = (top - bot) / 2;
      const R = ring([0, yc, z], [1, 0, 0], [0, 1, 0], hw, hy, hy, m, 2.05, (j, cu, sv) => [1 - 0.12 * Math.pow(Math.max(0, sv), 2), 1]);
      P.push(R); C.push(R.map((p, j) => phCol(p, Math.sin((j / m) * Math.PI * 2), z)));
    }
    skin(b, P, C, { cap0: true, cap1: true });
    /* angelegte Schwingen: hell mit dunklen Querbinden, Handschwingen dunkler */
    [-1, 1].forEach(s => b.at({ x: s * 0.088, y: 0.272, z: -0.035, rx: -0.1, rz: s * 0.38 }, q => ell(q, [0, 0, 0], [0.02, 0.046, 0.13],
      (p) => { let c = mixc(PHC.wing, PHC.wingD, Math.sin(p[2] * 70) > 0.45 ? 0.55 : 0); c = mixc(c, PHC.wingD, ss((-p[2] - 0.06) / 0.06) * 0.7); return mulc(c, 0.94 + 0.12 * hsh(p[0], p[1], p[2])); }, 12, 8)));
    /* Stoß: lange gebänderte Schwanzfedern im schmalen Fächer, schräg nach hinten oben */
    [[-2, 0.3], [-1, 0.36], [0, 0.44], [1, 0.4], [2, 0.32], [0.5, 0.25]].forEach(([f, L], i) =>
      b.at({ y: 0.292, z: -0.19, rx: -1.25 - Math.abs(f) * 0.03, rz: f * 0.07 }, q => featherInto(q, L, 0.021, f * 0.03, i * 3 + 2)));
    return b;
  }
  /* Ständer: Lauf mit Sporn und drei Zehen nach vorn, eine nach hinten */
  function phLeg() {
    const b = MB(), c = RGB(PHC.leg);
    tube(b, [[0, 0.02, 0], [0, -0.06, 0.004], [0, -0.13, 0.008]], [0.011, 0.008, 0.007], [mixc(PHC.belly, PHC.leg, 0.4), c, c], 5, { cap0: true });
    [-0.5, 0, 0.5].forEach(a => tube(b, [[0, -0.13, 0.008], [Math.sin(a) * 0.045, -0.136, 0.008 + Math.cos(a) * 0.045]], [0.005, 0.002], [c, c], 4, { tip: true }));
    tube(b, [[0, -0.13, 0.006], [0, -0.135, -0.03]], [0.004, 0.0015], [c, c], 4, { tip: true });
    tube(b, [[0, -0.095, -0.002], [0, -0.097, -0.018]], [0.004, 0.001], [c, c], 4, { tip: true });
    return b;
  }
  function phHead() {
    const b = MB();
    /* Hals: unten weißer Ring, darüber grün, oben blau-violett schillernd */
    tube(b, [[0, -0.03, -0.02], [0, 0.03, -0.006], [0, 0.085, 0.006], [0, 0.125, 0.014]], [0.036, 0.03, 0.025, 0.024], [RGB(PHC.neck), RGB(PHC.neck), RGB(PHC.neckB), RGB(PHC.head)], 10, { cap0: true });
    ell(b, [0, 0.008, -0.01], [0.037, 0.011, 0.037], PHC.ring, 12, 4);
    ell(b, [0, 0.148, 0.022], [0.029, 0.03, 0.042], (p, y) => mixc(PHC.head, PHC.neck, ss((-y + 0.2) / 0.8) * 0.5), 10, 7);
    [-1, 1].forEach(s => {
      ell(b, [s * 0.019, 0.145, 0.036], [0.014, 0.021, 0.025], (p, y) => mixc(PHC.red, PHC.redD, ss((-y + 0.3) / 0.7) * 0.5), 8, 6);    /* Rosen */
      ell(b, [s * 0.027, 0.156, 0.046], [0.005, 0.005, 0.005], PHC.eye, 5, 3);
      ell(b, [s * 0.03, 0.157, 0.047], [0.0025, 0.0025, 0.0025], 0x120c08, 4, 3);
      bristle(b, [s * 0.012, 0.168, 0.004], [s * 0.25, 0.55, -0.8], 0.032, 0.007, PHC.head, PHC.neck);                         /* Federohren */
    });
    tube(b, [[0, 0.142, 0.058], [0, 0.138, 0.076], [0, 0.131, 0.09]], [0.0105, 0.007, 0.0015], [RGB(PHC.beak), RGB(PHC.beak), mixc(PHC.beak, 0x8a7a50, 0.5)], 6, { tip: true });
    return b;
  }
  function phWing(s) {
    const b = MB();
    b.quad([0, 0, 0.08], [s * 0.3, 0.01, 0.03], [s * 0.26, 0.01, -0.1], [0, 0, -0.08], PHC.wing);
    b.quad([0, 0, -0.08], [s * 0.26, 0.01, -0.1], [s * 0.3, 0.01, 0.03], [0, 0, 0.08], PHC.wingD);
    return b;
  }
  /* Blutstropfen (Schweiß) am Boden */
  function dropMesh() { const b = MB(); b.disc(0.07, 7, 0x7d1912, { y0: 0.025, wob: 0.3 }); b.disc(0.035, 6, 0x9c2216, { x: 0.09, z: 0.04, y0: 0.026 }); return b; }
  /* ------------------------------ Arten ----------------------------------- */
  /* Trefferzonen (Tierkoordinaten vor Maßstab). Hals- und Kopfpunkte in Hals- bzw. Kopfkoordinaten. */
  const SP = {
    hirsch: { n: "Rothirsch", i: "🦌", walk: 0.85, sneak: 0.5, run: 10.5, s0: 0.98, s1: 1.12,
      legs: [{ h: [-0.12, 0.84, 0.34], lu: 0.4, ll: 0.44, f: 1 }, { h: [0.12, 0.84, 0.34], lu: 0.4, ll: 0.44, f: 1 }, { h: [-0.12, 0.86, -0.34], lu: 0.42, ll: 0.44, f: 0 }, { h: [0.12, 0.86, -0.34], lu: 0.42, ll: 0.44, f: 0 }],
      neckP: [0, 1.02, 0.4], headP: [0, 0.5, 0.22], body: { c: [0, 0.98, 0], r: [0.2, 0.22, 0.5] }, lung: { c: [0, 0.96, 0.24], r: 0.12 }, heart: { c: [0, 0.88, 0.28], r: 0.07 },
      head: { c: [0, 0.0, 0.18], r: 0.11 }, neckZ: [[0, 0.05, 0.02], [0, 0.46, 0.2]], neckR: 0.095, sens: 1.3,
      rest: { rz: 1.45, f: [-0.38, 0.95], h: [0.42, -0.3], fT: [-0.62, 1.15], hT: [0.7, -0.5], neckT: 0.5, headT: 0.3, legR: [0.034, 0.024, 0.03] } },
    keiler: { n: "Keiler", i: "🐗", walk: 1.1, sneak: 0.8, run: 8.0, s0: 0.92, s1: 1.15,
      legs: [{ h: [-0.11, 0.36, 0.24], lu: 0.36, ll: 0, f: 1 }, { h: [0.11, 0.36, 0.24], lu: 0.36, ll: 0, f: 1 }, { h: [-0.11, 0.36, -0.26], lu: 0.36, ll: 0, f: 0 }, { h: [0.11, 0.36, -0.26], lu: 0.36, ll: 0, f: 0 }],
      neckP: [0, 0.6, 0.4], headP: [0, 0, 0], body: { c: [0, 0.53, 0], r: [0.21, 0.23, 0.46] }, lung: { c: [0, 0.52, 0.2], r: 0.11 }, heart: { c: [0, 0.46, 0.24], r: 0.06 },
      head: { c: [0, -0.06, 0.32], r: 0.14 }, neckZ: [[0, 0.02, 0.0], [0, 0.0, 0.14]], neckR: 0.12, sens: 1.2,
      rest: { rz: 1.5, f: [-0.5, 0.6], h: [0.48, -0.42], fT: [-0.78, 0.85], hT: [0.74, -0.6], neckT: 0.08, headT: 0, legR: [0.03, 0.022, 0.024] } },
    fasan: { n: "Fasan", i: "🐦", walk: 0.45, sneak: 0.35, run: 1.8, s0: 1.2, s1: 1.4, legs: [],
      neckP: [0, 0.22, 0.15], headP: [0, 0, 0], body: { c: [0, 0.24, -0.02], r: [0.13, 0.13, 0.2] }, lung: null, heart: null,
      head: { c: [0, 0.14, 0.03], r: 0.06 }, neckZ: [[0, 0.0, 0.0], [0, 0.1, 0.0]], neckR: 0.04, sens: 1.5,
      rest: { rz: 1.35, neckT: 2.2, headT: 0 } }
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
  /* ============================ Trophäen v120 ===============================
     Jede Trophäe gehört zu einem erlegten Stück: beim Einlagern wird ein Datensatz gespeichert (S.farm.hunt.coll) mit Art,
     Medaille, Güte s (daraus folgen Enden, Waffen- bzw. Federlänge, Gewicht und Name – genau wie im Revier), Variante vr
     (Form der Stangen) sowie Zeit, Treffer und Entfernung. Daraus wird das Modell immer gleich gebaut (fester Seed).
     Die Lagerware bleibt wie bisher (tro_<art>_<medaille>, Preis nach Medaille) – Markt, Lagerplätze und alte Spielstände
     funktionieren unverändert; collSync() hält Datensätze und Lagerbestand deckungsgleich. */
  const WOOD = { a: 0xa36e3c, b: 0x7a4e29, rim: 0x5a391e, back: 0x452c17 };
  const METAL = [null, { c: 0xb8763a, d: 0x7d4d22 }, { c: 0xd3dae2, d: 0x8e98a4 }, { c: 0xeab52c, d: 0xa77a12 }, { c: 0xeab52c, d: 0xa77a12 }];
  const BRASS = { c: 0xcaa552, d: 0x7c6227 };
  const woodCol = (p, k) => { const g = Math.sin(p[0] * 52 + Math.sin(p[1] * 6.3) * 2.2 + Math.sin(p[1] * 17 + p[0] * 3) * 0.5); return mulc(mixc(WOOD.a, WOOD.b, 0.5 + 0.5 * g), (k || 1) * (0.94 + 0.12 * hsh(p[0], p[1], 3))); };
  /* Umriss: oben gewölbt, unten zur weichen Spitze (Wappenschild) – oder oval */
  function shieldOutline(w, h, n, kind) {
    const pts = [];
    for (let j = 0; j < n; j++) {
      const t = (j / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      if (kind === "oval") { pts.push([c * w / 2, s * h / 2]); continue; }
      if (s >= 0) { const e = 2 / 2.8; pts.push([Math.sign(c) * Math.pow(Math.abs(c), e) * w / 2, h * 0.12 + Math.pow(s, e) * h * 0.38]); }
      else { const q = -s; pts.push([Math.sign(c) * Math.pow(Math.abs(c), 0.85) * w / 2 * (1 - 0.2 * q * q), h * 0.12 - Math.pow(q, 0.95) * h * 0.62]); }
    }
    return pts;
  }
  /* Brett: gefaste Kante, gemaserte Fläche, erhabener Spiegel, Zierleiste in der Farbe der Medaille (ab Silber Metall) */
  function shieldInto(b, o) {
    const n = 44, OL = shieldOutline(o.w, o.h, n, o.kind), T = o.t || 0.06, m = o.m || 1;
    const lay = (rings, col, ref) => {
      const P = rings.map(([k, z]) => OL.map(([x, y]) => [x * k, y * k, z]));
      skin(b, P, P.map((R, i) => R.map(p => col(p, i))), { cap0: rings[0][0] === 1, cap1: true, tip0: [0, 0, rings[0][1]], tip1: [0, 0, rings[rings.length - 1][1]], ref, n0: [0, 0, -1], n1: [0, 0, 1] });
    };
    lay([[1, 0], [1, T * 0.72], [0.975, T * 0.95], [0.945, T], [0.8, T], [0.6, T], [0.4, T], [0.2, T]],
      (p, i) => i < 3 ? mulc(RGB(WOOD.rim), 0.92 + 0.14 * hsh(p[0], p[1], 1)) : woodCol(p, 0.92), (i, j, p) => i <= 1 ? [p[0], p[1], 0] : i === 2 ? [p[0], p[1], 0.7] : [0, 0, 1]);
    const T2 = T + 0.014;
    const P2 = [[0.82, T - 0.002], [0.8, T2 - 0.004], [0.78, T2], [0.6, T2], [0.4, T2], [0.2, T2]].map(([k, z]) => OL.map(([x, y]) => [x * k, y * k, z]));
    skin(b, P2, P2.map(R => R.map(p => woodCol(p, 1.05))), { cap1: true, tip1: [0, 0, T2], n1: [0, 0, 1], ref: (i, j, p) => i === 0 ? [p[0], p[1], 0.3] : i === 1 ? [p[0], p[1], 1] : [0, 0, 1] });
    /* Zierleiste */
    const M = m >= 2 ? METAL[m] : { c: WOOD.rim, d: WOOD.back }, lp = OL.map(([x, y]) => [x * 0.885, y * 0.885, T + 0.004]);
    lp.push(lp[0]);
    tube(b, lp, lp.map(() => 0.0075), lp.map(() => RGB(M.c)), 5, { cap1: false });
    if (m === 4) [[-0.36, 0.2], [0.36, 0.2], [0, 0.44]].forEach(([x, y]) => ell(b, [x * o.w, y * o.h, T2 + 0.006], [0.022, 0.022, 0.012], 0x5fd3f0, 4, 3));
    if (m >= 3) [[-0.3, -0.18], [0.3, -0.18]].forEach(([x, y]) => ell(b, [x * o.w, y * o.h, T2 + 0.004], [0.016, 0.016, 0.01], METAL[m].c, 6, 4));
    return b;
  }
  /* Messingschild mit zwei Gravurzeilen und Schrauben */
  function plateInto(b, x, y, z, w) {
    b.box(w, 0.075, 0.012, BRASS.c, { x, y, z: z + 0.006, c: true, front: 0xd8b766 });
    b.box(w * 0.68, 0.009, 0.014, BRASS.d, { x, y: y + 0.013, z: z + 0.007, c: true });
    b.box(w * 0.46, 0.008, 0.014, BRASS.d, { x, y: y - 0.014, z: z + 0.007, c: true });
    [-1, 1].forEach(s => ell(b, [x + s * (w / 2 - 0.016), y, z + 0.013], [0.006, 0.006, 0.004], BRASS.d, 5, 3));
  }
  /* Medaille am rot-weißen Band (Bronze, Silber, Gold; Diamant mit geschliffenem Stein) */
  function medalInto(b, x, y, z, m) {
    const M = METAL[m];
    b.at({ x, y, z }, r => {
      r.box(0.045, 0.13, 0.008, 0xb3202a, { x: -0.024, y: -0.05, rz: 0.3, c: true }); r.box(0.045, 0.13, 0.008, 0xf1ece0, { x: 0.024, y: -0.05, rz: -0.3, c: true });
      r.cyl(0.072, 0.072, 0.02, 18, M.c, { rx: Math.PI / 2, y: -0.13, top: M.c });
      r.cyl(0.054, 0.054, 0.026, 18, M.d, { rx: Math.PI / 2, y: -0.13, top: m === 4 ? M.d : M.c });
      if (m === 4) ell(r, [0, -0.13, 0.034], [0.042, 0.042, 0.026], 0x5fd3f0, 4, 3);
      else ell(r, [0, -0.13, 0.03], [0.022, 0.022, 0.012], M.c, 7, 5);
    });
  }
  /* Fasanenfeder: lanzettlich, braun-oliv mit dunklen Querbinden, dunkler Kiel, leicht gebogen */
  function featherInto(b, L, W, bend, seed) {
    const n = 14, P = [], C = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, w = W * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.95)), 0.7) * (t > 0.85 ? 1 - (t - 0.85) / 0.15 * 0.85 : 1) + 0.002;
      const c = [bend * t * t * L, t * L, 0.004 * Math.sin(t * 3)], R = ring(c, [1, 0, 0], [0, 0, 1], w, 0.0035, 0.0035, 6, 2);
      P.push(R);
      C.push(R.map((p, j) => {
        const bar = Math.sin(t * L * 80 + seed) > 0.72 ? 1 : 0, edge = Math.abs(Math.cos((j / 6) * Math.PI * 2)) > 0.9;
        let c0 = mixc(0xc29a5c, 0x9a7a45, t * 0.7);
        if (bar) c0 = mixc(c0, 0x2e2216, 0.75);
        if (!edge) c0 = mixc(c0, 0x4a3520, 0.2);
        return mulc(c0, 0.92 + 0.16 * hsh(i, j, seed));
      }));
    }
    return skin(b, P, C, { cap0: true, cap1: true });
  }
  /* Stück aus einem Datensatz bauen */
  const REP_S = [0, 0.42, 0.62, 0.8, 0.95];
  const repRec = (k, m) => ({ k, m, s: REP_S[m], vr: 0 });
  const qS = s => Math.round(clamp(s, 0, 1) * 20) / 20;
  function trophyKey(r) { const T = traits(r.k, r.s); return r.k + r.m + "_" + (T.P || T.cm) + "_" + Math.round(qS(r.s) * 20) + "_" + (r.vr || 0) + "_v135"; }
  function trophyBuild(r) {
    const k = r.k, m = r.m || 1, T = traits(k, r.s), sc = qS(r.s), b = MB();
    G3.seed(5400 + m);
    if (k === "hirsch") {
      shieldInto(b, { w: 0.6, h: 0.78, m });
      plateInto(b, 0, -0.305, 0.074, 0.2);
      medalInto(b, 0, -0.4, 0.04, m);
      /* Kopfpräparat: kurzer Träger aus dem Brett, Haupt leicht zur Seite gedreht, Äser etwas gesenkt – mit genau dem Geweih des Stücks */
      b.at({ y: -0.06, z: 0.0, ry: 0.22 }, q => q.at({ rx: 0.95 }, n => {
        deerNeckInto(n, 0.18);
        n.at({ y: 0.5, z: 0.22, rx: -0.42 }, h => {
          deerHeadInto(h, T.P, sc, r.vr || 0);
          [-1, 1].forEach(s => h.at({ x: s * 0.075, y: 0.08, z: 0.02, ry: s * 0.35, rz: -s * 0.15 }, e => deerEarInto(e, s)));
        });
      }));
    } else if (k === "keiler") {
      shieldInto(b, { w: 0.62, h: 0.74, m });
      plateInto(b, 0, -0.26, 0.074, 0.24);
      medalInto(b, 0, -0.36, 0.04, m);
      b.at({ y: 0.02, z: 0.05, ry: 0.2 }, q => {
        /* Halsansatz: Borstenkragen aus dem Brett */
        const P = [], C = [];
        for (let i = 0; i <= 6; i++) { const t = i / 6, R = ring([0, -0.02 + t * 0.03, -0.02 + t * 0.12], [1, 0, 0], [0, 1, 0], lerp(0.2, 0.16, t), lerp(0.24, 0.19, t), lerp(0.24, 0.2, t), 18, 2.2, (j) => 1 + 0.06 * (hsh(i, j, 21) - 0.5));
          P.push(R); C.push(R.map((p, j) => boarHair(p, Math.sin(j / 18 * Math.PI * 2), 0.8))); }
        skin(q, P, C, { cap0: true, cap1: true });
        q.at({ y: 0.02, z: 0.1, rx: -0.08 }, h => boarHeadInto(h, sc, T.cm));
      });
    } else {
      shieldInto(b, { w: 0.4, h: 0.56, kind: "oval", m });
      plateInto(b, 0, -0.19, 0.074, 0.2);
      medalInto(b, 0, -0.27, 0.04, m);
      /* Stoß: lange Schwanzfedern im Fächer, die längste so lang wie das Stück (cm), dazu kurze grün schimmernde Halsfedern */
      const rr = mulberry(Math.round(T.cm) * 31 + (r.vr || 0) * 7 + 5), nF = 3 + m, Lmax = T.cm * 0.0105;
      for (let i = 0; i < nF; i++) {
        const f = i - (nF - 1) / 2, ang = f * 0.21 + (rr() - 0.5) * 0.05, L = Lmax * (1 - Math.abs(f) * 0.09 - rr() * 0.06);
        b.at({ y: -0.09, z: 0.09 + i * 0.004, rz: -ang }, q => featherInto(q, L, 0.026, Math.sign(f) * 0.08 + (rr() - 0.5) * 0.08, i * 3 + 1));
      }
      [-1, 1].forEach(s => b.at({ x: s * 0.03, y: -0.08, z: 0.12, rz: s * 0.9 }, q => featherInto(q, 0.12, 0.018, 0, 9)));
      [-1, 1].forEach(s => ell(b, [s * 0.035, -0.04, 0.115], [0.03, 0.05, 0.01], 0x1d5a4f, 6, 4));
      b.at({ y: -0.1, z: 0.11 }, q => { q.cyl(0.04, 0.034, 0.06, 12, BRASS.c, { rx: Math.PI / 2, top: BRASS.c }); });
    }
    return b;
  }
  function trophyMesh(id) { const it = typeof FITEMS !== "undefined" && FITEMS[id]; return trophyBuild(repRec(it ? it.hunt : "hirsch", it ? it.medal : 1)); }
  if (typeof FWM !== "undefined" && FWM.item && !FWM.__huntItem) {
    const base = FWM.item; FWM.item = id => /^tro_/.test(id) ? trophyMesh(id) : base(id); FWM.__huntItem = true;
    if (typeof ITEM_3D !== "undefined") Object.keys(PRICE).forEach(k => [1, 2, 3, 4].forEach(m => ITEM_3D.add(trophyId(k, m))));
  }
  /* Datensätze ↔ Lagerbestand */
  const uid = () => "t" + Date.now().toString(36) + Math.floor(rnd() * 1e6).toString(36);
  function collSync() {
    const H = st();
    if (!H) return [];
    if (!Array.isArray(H.coll)) H.coll = [];
    if (typeof farmInv !== "function") return H.coll;
    Object.keys(PRICE).forEach(k => [1, 2, 3, 4].forEach(m => {
      const id = trophyId(k, m), have = farmInv(id) || 0, mine = H.coll.filter(r => r.k === k && r.m === m);
      if (mine.length > have) mine.sort((a, b) => a.s - b.s).slice(0, mine.length - have).forEach(r => H.coll.splice(H.coll.indexOf(r), 1));
      else if (mine.length < have) {
        /* Altbestand (vor v120): aus dem Jagdbuch nehmen, was dazu passt – sonst ein Musterstück der Medaille */
        const logs = (H.log || []).filter(L => L.k === k && L.m === m && L.s != null && !H.coll.some(r => r.t === L.t && r.s === L.s));
        for (let i = mine.length; i < have; i++) {
          const L = logs.shift();
          H.coll.push(L ? { u: uid(), k, m, s: L.s, vr: Math.floor(L.s * 997) % 6, t: L.t, zone: L.zone, dm: L.dm, old: 1 } : { u: uid(), k, m, s: REP_S[m], vr: i % 6, old: 2 });
        }
      }
    }));
    return H.coll;
  }
  const recOf = u => collSync().find(r => r.u === u);
  function sellRec(u) {
    const H = st(), r = recOf(u);
    if (!r || typeof farmSell !== "function") return 0;
    const i = H.coll.indexOf(r); H.coll.splice(i, 1);
    const got = farmSell(trophyId(r.k, r.m), 1);
    if (!got) { H.coll.splice(i, 0, r); return 0; }
    return got;
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
  const missing = () => typeof siteMissing === "function" ? siteMissing("hunt", NEED) : [];      /* v186: am Bauplatz Abgelegtes zählt mit */
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
    const rows = Object.keys(NEED).map(id => { const have = siteHave("hunt", id), dep = siteN("hunt", id), need = NEED[id], done = have >= need;
      return `<div class="hu-need${done ? " ok" : ""}"><span class="hu-ni">${ic(id)}</span><b>${esc(fqty(id, need))}</b><small>${dep >= need ? "📦 abgelegt" : dep ? "📦 " + esc(famt(id, dep)) + " abgelegt" + (have > dep ? " · " + esc(famt(id, have - dep)) + " im Lager" : "") : done ? "✓ im Lager" : "im Lager: " + esc(famt(id, have) || "0")}</small></div>`; }).join("");
    openFarmSheet(`<div class="fs-h"><span class="fs-ic">🔨</span>Bauplatz für einen Hochsitz<small>vom Förster an der Wildwiese abgesteckt</small></div>
      <div class="fs-sub">Für den Hochsitz brauchst du Holz aus dem Wald und aus dem Sägewerk. Leg das Material hier ab, dann wird gebaut.</div>
      <div class="hu-needs">${rows}</div>${typeof siteDepHTML === "function" ? siteDepHTML("hunt", NEED) : ""}
      <div class="fs-row"><button class="btn${ok ? "" : " disabled"}" id="huBuild">${ok ? "🔨 Hochsitz bauen" : "🔒 Es fehlt noch Material"}</button></div>`, "hunt");
    if (typeof siteDepBind === "function") siteDepBind("hunt", NEED, buildSheet);   /* v186: Material am Bauplatz ablegen */
    $("#huBuild").onclick = () => { if (!missing().length) { closeFarmSheet(); buildNow(); } else snd("bad"); };
  }
  function buildNow() {
    const H = st();
    if (H.built || missing().length) return false;
    siteTake("hunt", NEED);
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
    let x = CX + Math.cos(a) * CR * 1.22, z = CZ + Math.sin(a) * CR * 1.22;
    if (typeof navFree === "function") { const f = navFree(x, z, "wild", 5); x = f[0]; z = f[1]; }   /* v146: nie in Hindernissen starten */
    const tx = CX + Math.cos(a2) * d2, tz = CZ + Math.sin(a2) * d2;
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
      const nav = typeof wanderPlan === "function";
      /* v146: das Tier läuft auf dem Wegenetz um Gebäude, Zäune, Bäume, Felsen und Wasser herum */
      if (nav && (M.ptx !== M.tx || M.ptz !== M.tz)) { M.ptx = M.tx; M.ptz = M.tz; wanderPlan(M, M.tx, M.tz, "wild", 5); }
      let r = null;
      if (nav && M.path) r = wanderMove(M, sp);
      if ((nav && !M.path && !(r && !r.done)) || (!nav && dist < sp * 1.2) || (r && r.done)) { if (M.leaving) { mwDrop(); return; } M.st = "graze"; M.t = 5 + rnd() * 9; n.rx = 0; M.path = null; M.ptx = null; }
      else {
        if (!nav) { M.x += dx / dist * sp; M.z += dz / dist * sp; }
        n.x = M.x; n.z = M.z;
        const want = nav ? (r && r.h != null ? r.h : n.ry) : Math.atan2(dx, dz); n.ry += angN(want - n.ry) * Math.min(1, dt * 3);
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
    /* v117: Bäume mit zwei Stufen – fein (Nahsicht-Modell, je Art und Variante einmal gebaut und auf die Größe skaliert)
       und grob (Standardmodell). Mit bloßem Auge fein bis TREE_HI, im Fernglas/Zielfernrohr und bei der Bergung alle fein
       (dort schneidet der enge Sichtkegel fast alles weg, die Grafikkarte zeichnet nur die sichtbaren) – siehe revLod */
    X.rv.trees = L.trees.map((t, i) => ({ t, key: "hu" + i, d: Math.hypot(t.x - EYER[0], t.z - EYER[2]), hi: null, g: null }));
    /* feine Modelle nach und nach bauen (je Bild ein paar Millisekunden) – erst die für nahe Bäume, dann der Rest fürs Fernglas */
    const seen = new Set();
    const byD = X.rv.trees.slice().sort((a, b) => a.d - b.d);
    /* v131: zuerst die Mittelstufe für alle Arten (bloßes Auge, ab TREE_HI), dann die feinen Modelle */
    X.rv.queue = byD.map(e => "m:" + e.t.sp + ":" + e.t.v).concat(byD.map(e => "f:" + e.t.sp + ":" + e.t.v)).filter(k => !seen.has(k) && seen.add(k));
    revLod(false);
    if (FWM.grassTuft) L.grass.forEach((t, i) => put(rgroup("hu_gt" + t.v, () => FWM.grassTuft(t.v), { sway: 0.3, shadow: false }), "hg" + i, t.x, t.z, t.ry, t.s));
    if (FWM.fern) L.ferns.forEach((t, i) => put(rgroup("hu_fern", () => FWM.fern(), { sway: 0.2, shadow: false }), "hf" + i, t.x, t.z, t.ry, t.s));
    if (FWM.boulder) L.rocks.forEach((t, i) => put(rgroup("hu_rock", () => FWM.boulder(1), {}), "hr" + i, t.x, t.z, t.ry, t.s));
    if (FWM.deadLog) L.logs.forEach((t, i) => put(rgroup("hu_log", () => FWM.deadLog(), {}), "hl" + i, t.x, t.z, t.ry, t.s));
  }
  const hiKey = t => "wh:" + t.sp + ":" + t.v, midKey = t => "wm:" + t.sp + ":" + t.v;
  /* Bau-Warteschlange abarbeiten: höchstens ~8 ms je Bild (mindestens ein Modell), danach fertige Modelle einsetzen */
  function revBuildStep() {
    const Q = X && X.rv && X.rv.queue;
    if (!Q || !Q.length) return;
    if (typeof FWM.treeRv !== "function") { Q.length = 0; return; }
    const t0 = performance.now();
    do {
      const qk = Q.shift(), [lv, sp, v] = qk.split(":"), lo = lv === "m";
      try { fmesh((lo ? "wm:" : "wh:") + sp + ":" + v, () => FWM.treeRv(sp, 3, +v, lo)); } catch (e) { (X.rv.bad = X.rv.bad || new Set()).add(qk); console.warn("treeRv", sp, e); }
    } while (Q.length && performance.now() - t0 < 8);
    revLod(X.rv.far);
  }
  function revLod(far) {
    if (!X || !X.rv || !X.rv.trees) return;
    X.rv.far = far;
    /* v131: drei Stufen – fein (nah bzw. Fernglas), Mittelstufe (gleiche Optik, weniger Blätter; bloßes Auge ab TREE_HI),
       grob nur noch übergangsweise, bis die Mittelstufe gebaut ist */
    const can = typeof FWM.treeRv === "function", Q = X.rv.queue, bad = X.rv.bad;
    const need = qk => { if (Q && !Q.includes(qk) && !(bad && bad.has(qk))) Q.push(qk); };
    for (const e of X.rv.trees) {
      const t = e.t, wantF = can && (far || e.d < TREE_HI), fR = !!FV.meshes[hiKey(t)], mR = !!FV.meshes[midKey(t)];
      if (can && !mR) need("m:" + t.sp + ":" + t.v);
      if (wantF && !fR) need("f:" + t.sp + ":" + t.v);
      const lv = wantF && fR ? 2 : can && mR ? 1 : 0;
      if (e.hi === lv) continue;
      if (e.g) e.g.remove(e.key);
      e.g = lv === 2 ? rgroup(hiKey(t), () => FWM.treeRv(t.sp, 3, t.v), { sway: 0.22 })
          : lv === 1 ? rgroup(midKey(t), () => FWM.treeRv(t.sp, 3, t.v, true), { sway: 0.22 })
          : rgroup("wt:" + t.sp + ":" + t.sz + ":" + t.v, () => FWM.tree(t.sp, t.sz, t.v), { sway: 0.22 });
      e.g.add(e.key, t.x, t.z, t.ry, lv ? t.s * FWM.TH[t.sz] / FWM.TH[3] : t.s);
      e.hi = lv;
    }
  }
  function revClear() {
    if (!X || !X.rv) return;
    if (X.rv.trees) X.rv.trees.forEach(e => e.g && e.g.remove(e.key));
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
    X = { mode: "in", p: 0, saved: camOf(c), view: "eye", th: thR, th0: thR, skyAz: thR, ph: -0.06, thW, zoom: 8, fovNow: FOV, fogR: [40, 90], inRv: false,
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
    bedClear();                                        /* v135: Liegeplatz weg, Gras zurück – vor revClear */
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
    /* v120: Güte auf drei Stellen gerundet – genau dieser Wert landet im Trophäen-Datensatz, Modell im Revier und an der Wand sind gleich */
    const S0 = SP[k], score = Math.round((pre && pre.score != null ? pre.score : drawScore()) * 1000) / 1000, T = traits(k, score), s = lerp(S0.s0, S0.s1, score);
    const p = pre ? [pre.x, pre.z] : spawnPoint(null, enter);
    const A = { id: ++X.aid, k, score, T, s, x: p[0], z: p[1], y: 0, ry: rnd() * 6.28, rx: 0, rz: 0, v: 0, vT: 0, vx: 0, vz: 0, ph: rnd(), gw: 0, gr: 0,
      st: enter ? "walk" : k === "fasan" ? "peck" : k === "keiler" ? "root" : "graze", t: 2 + rnd() * 5, tx: p[0], tz: p[1], alert: 0, seen: false, hits: [], dist: 0,
      sp: {}, ear: [{ f: 0, k: 0, t: 1 }, { f: 0, k: 0, t: 2 }], cautious: enter, pause: 0, jolt: 0, legsA: [[0, 0], [0, 0], [0, 0], [0, 0]], seed: rnd() * 100, fly: null, vr: pre && pre.vr != null ? pre.vr : Math.floor(rnd() * 6) };
    if (enter) { A.tx = p[2]; A.tz = p[3]; A.ry = Math.atan2(A.tx - A.x, A.tz - A.z); }
    if (pre) {                                         /* v111: das Tier von der Wiese – gleiche Art, gleiche Güte, gleiche Lage und Blickrichtung */
      A.mw = true; A.st = pre.st; A.t = pre.t; A.cautious = false; A.tx = pre.tx; A.tz = pre.tz; A.ry = pre.ry;
    }
    build(A);
    X.animals.push(A);
    return A;
  }
  function build(A) {
    const k = A.k, S0 = SP[k], key = "hu9_" + k;
    if (k === "hirsch") {
      A.node = addNode(fmesh(key + "_b", deerBody), { x: A.x, z: A.z, ry: A.ry, s: A.s });
      A.neck = addNode(fmesh(key + "_n", deerNeck), { x: S0.neckP[0], y: S0.neckP[1], z: S0.neckP[2] }, A.node);
      A.head = addNode(fmesh(key + "_h" + A.T.P + "_" + Math.round(A.score * 20) + "_" + A.vr, () => deerHead(A.T.P, Math.round(A.score * 20) / 20, A.vr)), { x: S0.headP[0], y: S0.headP[1], z: S0.headP[2] }, A.neck);
      A.ears = [-1, 1].map(s => addNode(fmesh(key + "_e" + s, () => deerEar(s)), { x: s * 0.075, y: 0.08, z: 0.02 }, A.head));
      A.tail = addNode(fmesh(key + "_t", deerTail), { x: 0, y: 1.07, z: -0.578 }, A.node);
      A.legN = S0.legs.map(L => { const up = addNode(fmesh(key + "_u" + L.f, () => deerUpper(!!L.f)), { x: L.h[0], y: L.h[1], z: L.h[2] }, A.node); return { up, lo: addNode(fmesh(key + "_l" + L.f, () => deerLower(!!L.f)), { y: -L.lu }, up) }; });
    } else if (k === "keiler") {
      /* v135: neues Modell, Läufe mit Gelenk (oben/unten als eigene Knoten) */
      A.node = addNode(fmesh(key + "_b135", boarBody), { x: A.x, z: A.z, ry: A.ry, s: A.s });
      A.neck = A.head = addNode(fmesh(key + "_h135_" + A.T.cm + "_" + Math.round(A.score * 20), () => boarHead(qS(A.score), A.T.cm)), { x: S0.neckP[0], y: S0.neckP[1], z: S0.neckP[2] }, A.node);
      A.legN = S0.legs.map(L => { const up = addNode(fmesh(key + "_u135" + L.f, () => boarUpper(!!L.f)), { x: L.h[0], y: L.h[1], z: L.h[2] }, A.node); return { up, lo: addNode(fmesh(key + "_l135", boarLower), { y: -BLU, z: L.f ? 0 : -0.025 }, up) }; });
    } else {
      A.node = addNode(fmesh(key + "_b135", phBody), { x: A.x, z: A.z, ry: A.ry, s: A.s });
      A.neck = A.head = addNode(fmesh(key + "_h135", phHead), { x: S0.neckP[0], y: S0.neckP[1], z: S0.neckP[2] }, A.node);
      A.wings = [-1, 1].map(s => addNode(fmesh(key + "_w135" + s, () => phWing(s)), { x: s * 0.07, y: 0.29, z: 0.02, visible: false }, A.node));
      A.feet = [-1, 1].map(s => addNode(fmesh(key + "_f135", phLeg), { x: s * 0.036, y: 0.15, z: 0.01 }, A.node));
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
      case "look": A.vT = 0; neckT = A.k === "hirsch" ? 0.42 : 0.05; headT = A.k === "hirsch" ? 0.24 : 0.2; nyT = Math.sin(time * 0.6 + A.seed) * 0.75; earT = 0.05; if (A.t <= 0 && A.alert < 0.5) { if (A.k === "fasan") { A.st = "peck"; A.t = 2 + rnd() * 3; } else if (A.k === "keiler") pickWalk(A); else { A.st = "graze"; A.t = 5 + rnd() * 8; } } break;
      case "alert": {                                   /* Aufschrecken: Kopf hoch, starr, Lauscher nach vorn – zum Geräusch hin */
        A.vT = 0; neckT = A.k === "hirsch" ? 0.2 : -0.15; headT = 0.3; earT = -0.08; tailT = -0.3; stiff = 11;
        const src = A.src || [EYER[0], EYER[2]];
        nyT = clamp(angN(Math.atan2(src[0] - A.x, src[1] - A.z) - A.ry), -1.1, 1.1);
        if (A.t <= 0) { if (A.alert > 0.7) fleeFrom(A, src); else { A.st = "look"; A.t = 1.5 + rnd(); } }
        break;
      }
      case "walk": {
        A.vT = A.cautious ? S0.sneak : A.k === "keiler" && A.trot ? 2.1 : S0.walk;
        neckT = A.k === "hirsch" ? 0.78 : 0.4; headT = A.k === "hirsch" ? 0.2 : 0.12;
        if (A.cautious && A.k === "hirsch") {
          /* vorsichtig: mitten im Schritt stehen bleiben (ein Vorderlauf in der Luft), sichern, weiter */
          if (A.pause > 0) { A.pause -= dt; A.vT = 0; neckT = 0.3; nyT = Math.sin(time * 0.9 + A.seed) * 0.6; earT = 0.02; }
          else if (rnd() < dt * 0.25) A.pause = 0.7 + rnd() * 1.3;
        }
        const d = steer(A, A.tx, A.tz, 1.5, dt);
        if (d < 0.4 || A.t < -40) { A.cautious = false; if (A.k === "keiler") { if (rnd() < 0.55) { A.st = "root"; A.t = 1.5 + rnd() * 2.5; A.tx = A.x + Math.sin(A.ry) * 0.6; A.tz = A.z + Math.cos(A.ry) * 0.6; } else pickWalk(A); } else if (A.k === "fasan") { A.st = "peck"; A.t = 2 + rnd() * 4; } else { A.st = "graze"; A.t = 6 + rnd() * 8; } }
        if (A.k === "keiler" && rnd() < dt * 0.35) pickWalk(A, true);
        break;
      }
      case "flee": case "hit": case "wounded": {
        A.vT = A.st === "hit" ? S0.run * 0.75 : A.st === "wounded" ? S0.run * 0.85 : S0.run;
        neckT = A.k === "hirsch" ? 1.0 : 0.3; headT = A.k === "hirsch" ? -0.2 : -0.15; earT = 0.55; tailT = -0.95; nyT = 0;
        /* Haken schlagen */
        A.zig -= dt; if (A.zig <= 0) { A.zig = 0.7 + rnd() * 1.1; A.zigA = (rnd() - 0.5) * 0.9; }
        const dx = A.tx - A.x, dz = A.tz - A.z;
        const want = Math.atan2(dx, dz) + A.zigA * clamp(Math.hypot(dx, dz) / 20, 0, 1);
        A.ry += clamp(angN(want - A.ry), -3 * dt, 3 * dt);
        A.dist += A.v * dt;
        if (A.st !== "flee") trail(A);
        if (A.st === "hit" && A.dist >= A.runL) { A.st = "fall"; A.t = 0.8; A.side = rnd() < 0.5 ? -1 : 1; fallStart(A, 0.8); }
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
        const g = deadPose(A).y;
        A.fly.vy -= 14 * dt; A.y = Math.max(g, A.y + A.fly.vy * dt); A.x += A.fly.vx * dt * 0.3; A.z += A.fly.vz * dt * 0.3;
        A.rz += dt * 6; A.wings.forEach((w, i) => { w.rz = (i ? 1 : -1) * 0.5; });
        if (A.y <= g + 0.001) { A.st = "dead"; A.rz = deadPose(A).rz; A.rx = 0; A.deadAt = X.t; A.wings.forEach(w => { w.visible = false; }); { const q = lieSpot(A, A.x, A.z); A.x = q[0]; A.z = q[1]; } settle(A); }
        break;
      }
      case "fall": {
        /* v135: in die berechnete Liegepose sinken (Höhe, Seitenlage, Haupt, Läufe) */
        const dp = deadPose(A), k = ss(1 - A.t / (A.fT || 0.8));
        A.vT = 0; A.rz = dp.rz * k; A.y = dp.y * k; neckT = lerp(0.2, dp.neckT, k); nyT = dp.nyT * k; headT = lerp(0.3, dp.headT, k); stiff = 9;
        if (A.t <= 0) { if (A.fs) { A.x = A.fs.to[0]; A.z = A.fs.to[1]; A.fs = null; } A.st = "dead"; A.deadAt = X.t; A.v = 0; settle(A); }
        break;
      }
      case "dead": { const dp = deadPose(A); A.vT = 0; neckT = dp.neckT; nyT = dp.nyT; headT = dp.headT; earT = 0.4; stiff = 9; break; }
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
      if (A.st === "fall" && A.fs) { const k = ss(1 - A.t / A.fs.T); A.x = lerp(A.fs.x0, A.fs.to[0], k); A.z = lerp(A.fs.z0, A.fs.to[1], k); A.v = 0; }
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
        if (A.st === "dead" || A.st === "fall") return deadLeg(A, i);
        const w = legAng((A.ph + WALK_OFF[i]) % 1, 0.62, ampW, 0.9 * A.gw, !!L.f), r = legAng((A.ph + RUN_OFF[i]) % 1, 0.38, ampR, 1.5, !!L.f);
        return [lerp(w[0], r[0], wR), lerp(w[1], r[1], wR)];
      });
    } else if (A.k === "keiler") {
      A.legsA = S0.legs.map((L, i) => {
        if (A.st === "dead" || A.st === "fall") return deadLeg(A, i);
        /* v135: Gelenk beugt sich beim Vorschwingen (nur Optik – die Trefferzone des Laufs bleibt die gerade Linie) */
        const c = (A.ph * 1.6 + (wR > 0.5 ? RUN_OFF : WALK_OFF)[i]) % 1, fl = Math.max(0, -Math.cos(c * Math.PI * 2)) * (0.45 * A.gw * (1 - wR) + 0.7 * wR);
        return [Math.sin(c * Math.PI * 2) * (0.45 * A.gw * (1 - wR) + 0.8 * wR), L.f ? fl : -fl * 0.6];
      });
    }
    if (A.legN.length) A.legN.forEach((N, i) => { const a = A.legsA[i]; N.up.rx = a[0]; if (N.lo) N.lo.rx = a[1]; N.up.rz = a[2] || 0; });
    if (A.feet) { const tuck = spr(P, "ft", ["fly", "drop", "dead", "fall"].includes(A.st) ? 1.5 : 0, 8, dt); A.feet.forEach(f => { f.rx = tuck; }); }
    /* Kopf, Hals, Lauscher, Wedel über Federn: weich, beim Aufschrecken schnell */
    const nod = A.k === "hirsch" ? Math.sin(A.ph * Math.PI * 4) * 0.05 * A.gw * (1 - wR) : 0;
    const nrx = spr(P, "nrx", neckT + nod, stiff, dt), nry = spr(P, "nry", nyT, stiff * 0.7, dt), hrx = spr(P, "hrx", headT, stiff * 1.2, dt);
    { const r = neckRot(A.k, nrx, nry); A.neck.rx = r[0]; A.neck.ry = r[1]; A.neck.rz = A.st === "dead" ? deadPose(A).nz : A.st === "fall" ? deadPose(A).nz * ss(1 - A.t / (A.fT || 0.8)) : 0; }
    if (A.k === "hirsch") {
      A.head.rx = hrx;
      /* Ohrenspiel: jede Lauscher zuckt für sich, beim Sichern beide nach vorn */
      A.ear.forEach((E, i) => {
        E.t -= dt; if (E.t <= 0) { E.t = 0.8 + rnd() * 2.6; E.f = 0.18 + rnd() * 0.2; E.k = (rnd() - 0.5) * 1.1; }
        E.f -= dt;
        const s = i ? 1 : -1, tw = E.f > 0 ? E.k : 0, look = A.st === "alert" ? clamp(nyT * 0.4, -0.4, 0.4) : 0;
        A.ears[i].rz = spr(P, "erz" + i, s * (earT + (E.f > 0 ? Math.abs(tw) * 0.3 : 0)), 14, dt);
        A.ears[i].ry = spr(P, "ery" + i, tw * 0.6 + look, 12, dt);
      });
      A.tail.rx = spr(P, "trx", tailT + (Math.sin(time * 3 + A.seed) > 0.97 ? -0.6 : 0), 12, dt);
    }
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
      /* v120: im Stehen leichtes Verlagern des Gewichts (kaum sichtbar, aber das Tier wirkt nicht eingefroren) */
      const idle = clamp(1 - A.gw * 3, 0, 1);
      if (idle > 0 && A.k !== "fasan") { n.rz = A.rz + Math.sin(time * 0.37 + A.seed) * 0.011 * idle; n.y += (Math.sin(time * 0.74 + A.seed * 2) * 0.004 - 0.002) * idle * A.s; }
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
  /* v131: ein erlegtes Stück darf nicht in Felsen, Baumstämmen oder Totholz liegen – es sinkt auf dem nächsten freien Fleck zusammen */
  function liePad(A) { return (A.k === "hirsch" ? 1.15 : A.k === "keiler" ? 0.75 : 0.35) * (A.s || 1); }
  function lieBlocked(x, z, pad) {
    const L = revLayout();
    if (L.rocks.some(t => Math.hypot(t.x - x, t.z - z) < 1.05 * t.s + pad)) return true;
    if (L.logs.some(t => { for (const sg of [1, -1]) { const ca = Math.cos(t.ry), sa = Math.sin(t.ry); for (const f of [0.2, 0.8, 1.4]) { if (Math.hypot(t.x + ca * f * t.s - x, t.z - sg * sa * f * t.s - z) < 0.45 * t.s + pad) return true; } } return false; })) return true;
    if (L.trees.some(t => Math.hypot(t.x - x, t.z - z) < 0.5 * t.s * (1 + t.sz * 0.15) + pad * 0.8)) return true;
    return false;
  }
  function lieSpot(A, x, z) {
    const pad = liePad(A);
    if (!lieBlocked(x, z, pad) && fieldE(x, z) < 1.3) return [x, z];
    const a0 = A.ry || 0;
    for (let r = 0.5; r <= 9; r += 0.5) for (let i = 0; i < 16; i++) {
      const a = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 8), px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
      if (!lieBlocked(px, pz, pad) && fieldE(px, pz) < 1.3) return [px, pz];
    }
    return [x, z];
  }
  function fallStart(A, T) {
    /* Zielpunkt aus Ausrutschweg des Laufs ermitteln, dann während des Zusammenbrechens dorthin gleiten */
    const sl = (A.v || 0) / 3.2 * (1 - Math.exp(-3.2 * T)), px = A.x + Math.sin(A.ry) * sl, pz = A.z + Math.cos(A.ry) * sl;
    A.fs = { x0: A.x, z0: A.z, T, to: lieSpot(A, px, pz) };
    A.fT = T; A.legs0 = (A.legsA || []).map(a => a.slice());
  }
  function settle(A) {
    const S0 = SP[A.k], c = rot(S0.body.c.map(v => v * A.s), A.rx, A.ry, A.rz);
    A.center = [A.x + c[0], (A.y || 0) + c[1], A.z + c[2]];
    /* v135: Umriss des liegenden Stücks in Weltkoordinaten (für Kamera, Liegeplatz und Gras) */
    const dp = deadPose(A), o = [A.x, 0, A.z];
    A.box = { mn: add3(dp.mn, o), mx: add3(dp.mx, o) };
    A.foot = dp.pts.map(p => add3(p, o));
  }
  /* ------------------- v135: Liegepose aus den Modellpunkten -------------------
     Vorher lag jedes Stück auf fester Höhe (der Keiler etwa 5 cm über dem Boden), die Läufe standen steif ab und die oben
     liegenden schwebten. Jetzt wird die Pose einmal je Stück aus den echten Eckpunkten der Modelle berechnet:
     • Rumpf in Seitenlage genau auf dem Boden (tiefster Punkt der Haut)
     • jeder Lauf leicht angewinkelt (oben liegende weiter gespreizt), dann um die Längsachse gesenkt, bis er aufliegt
     • Haupt bzw. Träger zum Boden gedreht, bis es aufliegt (beim Hirsch trägt notfalls das Geweih)
     Fest je Stück (Art, Größe, Lage, Seite) – keine Physik, kein Zufall. */
  const neckRot = (k, nrx, nry) => k === "keiler" ? [nrx - 0.55, nry * 0.6] : k === "hirsch" ? [nrx - 0.35, nry] : [nrx * 0.6 - 0.2, nry * 0.6];
  const legDim = (k, L) => k === "keiler" ? [BLU, BLL, L.f ? 0 : -0.025] : [L.lu, L.ll, 0];
  const PTS = new Map();
  function ptsOf(key, fn, every) {
    let P = PTS.get(key);
    if (!P) { const v = fn().v, n = 9 * (every || 3); P = []; for (let i = 0; i < v.length; i += n) P.push([v[i], v[i + 1], v[i + 2]]); PTS.set(key, P); }
    return P;
  }
  /* Haupt (beim Hirsch mit Träger und Geweih) in Halskoordinaten */
  function headPts(A) {
    const S0 = SP[A.k], q = Math.round(A.score * 20) / 20;
    if (A.k === "keiler") return ptsOf("h:k" + A.T.cm + ":" + q, () => boarHead(q, A.T.cm));
    if (A.k === "fasan") return ptsOf("h:f", phHead);
    return ptsOf("h:h" + A.T.P + ":" + q + ":" + A.vr, () => {
      const b = MB(); deerNeckInto(b);
      b.at({ x: S0.headP[0], y: S0.headP[1], z: S0.headP[2], rx: S0.rest.headT }, h => deerHeadInto(h, A.T.P, q, A.vr));
      return b;
    }, 2);
  }
  function calcDead(A) {
    const S0 = SP[A.k], D = S0.rest, side = A.side || 1, rz = side * D.rz, s = A.s;
    const W = (p, y) => { const q = rot([p[0] * s, p[1] * s, p[2] * s], 0, A.ry, rz); return [q[0], y + q[1], q[2]]; };
    const BP = ptsOf("b:" + A.k, A.k === "hirsch" ? deerBody : A.k === "keiler" ? boarBody : phBody);
    let lo = 1e9;
    BP.forEach(p => { lo = Math.min(lo, W(p, 0)[1]); });
    const y = -lo + 0.004 * s, pts = BP.map(p => W(p, y));
    const cost = (gap, a) => (gap < 0 ? -gap * 12 : gap) + Math.abs(a) * 0.03;
    const legs = S0.legs.map(L => {
      const top = L.h[0] * side > 0, base = L.f ? (top ? D.fT : D.f) : (top ? D.hT : D.h), dm = legDim(A.k, L), r = D.legR;
      const samp = th => [[[0, -dm[0] * 0.5, 0], r[0] * 1.3, 0], [[0, -dm[0], 0], r[0], 0], [[0, -dm[1] * 0.5, 0], r[1], 1], [[0, -dm[1], 0.02], r[2], 1]].map(([p, rr, low]) => {
        const q = low ? add3([0, -dm[0], dm[2]], rot(p, base[1], 0, 0)) : p;
        return [add3(L.h, rot(q, base[0], 0, th)), rr];
      });
      let best = 0, bc = 1e9;
      for (let th = -1.45; th <= 1.451; th += 0.025) {
        let gap = 1e9;
        samp(th).forEach(([p, rr]) => { gap = Math.min(gap, W(p, y)[1] - rr * s); });
        const c = cost(gap, th);
        if (c < bc) { bc = c; best = th; }
      }
      samp(best).forEach(([p]) => pts.push(W(p, y)));
      return [base[0], base[1], best];
    });
    /* Haupt: Keiler dreht den Kopf um die Hochachse zum Boden, Hirsch und Fasan legen den Träger seitlich ab */
    const HP = headPts(A), nk = S0.neckP, ax = A.k === "keiler" ? "y" : "z", nr = neckRot(A.k, D.neckT, 0);
    const HW = (p, a) => W(add3(nk, rot(p, nr[0], ax === "y" ? neckRot(A.k, D.neckT, a)[1] : 0, ax === "z" ? a : 0)), y);
    let hb = 0, hc = 1e9;
    for (let a = -1.3; a <= 1.301; a += 0.025) {
      let gap = 1e9;
      for (let i = 0; i < HP.length; i += 2) gap = Math.min(gap, HW(HP[i], a)[1]);
      const c = cost(gap - 0.003, a);
      if (c < hc) { hc = c; hb = a; }
    }
    HP.forEach(p => pts.push(HW(p, hb)));
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    pts.forEach(p => { for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); } });
    return { rz, y, legs, neckT: D.neckT, nyT: ax === "y" ? hb : 0, nz: ax === "z" ? hb : 0, headT: D.headT || 0, mn, mx, pts: pts.filter((_, i) => i % 3 === 0) };
  }
  function deadPose(A) { return A.dp || (A.dp = calcDead(A)); }
  /* Lauf beim Zusammenbrechen: von der letzten Haltung in die Liegepose */
  function deadLeg(A, i) {
    const d = deadPose(A).legs[i], k = A.st === "dead" ? 1 : ss(1 - A.t / (A.fT || 0.8)), a = (A.legs0 && A.legs0[i]) || [0, 0];
    return [lerp(a[0], d[0], k), lerp(a[1] || 0, d[1], k), d[2] * k];
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
      <div class="hu-vig"></div>
      <div class="hu-win" hidden></div>
      <div class="hu-drag" hidden>↔ Wischen dreht die Ansicht</div>
      <div class="hu-card2" hidden></div>
      <div class="hu-fade"></div>`;
    host.appendChild(el);
    X.ui = el;
    ["bar", "ov", "marks", "spotEl", "msgEl", "sub", "range", "vig", "win", "drag", "card", "fadeEl", "windEl"].forEach((k, i) => { X[k] = el.querySelector([".hu-bar", ".hu-ov", ".hu-marks", ".hu-spot", ".hu-msg", ".hu-sub", ".hu-range", ".hu-vig", ".hu-win", ".hu-drag", ".hu-card2", ".hu-fade", ".hu-wind"][i]); });
    renderBar();
    let P = null;
    el.addEventListener("pointerdown", e => {
      if (e.target.closest("button,.hu-card2")) return;
      if (X && X.view === "harvest" && X.hrv && X.hrv.ui < 2) X.hrv.skip = true;          /* v135: Antippen überspringt das Warten */
      P = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { el.setPointerCapture(e.pointerId); } catch (er) { /* egal */ }
    });
    el.addEventListener("pointermove", e => {
      /* v135: beim erlegten Stück dreht Wischen die Ansicht um das Stück (seitlich frei, Neigung begrenzt) */
      if (P && P.id === e.pointerId && X && X.view === "harvest" && X.hrv && X.hrv.cut) {
        const dx = e.clientX - P.x, dy = e.clientY - P.y, Hv = X.hrv; P.x = e.clientX; P.y = e.clientY;
        Hv.uy -= dx * 0.009; Hv.up = clamp(Hv.up + dy * 0.005, -0.22, 0.5);
        if (Math.abs(dx) + Math.abs(dy) > 2) { Hv.dragged = true; if (X.card && !X.card.hidden && !X.card.classList.contains("saved")) X.card.classList.add("hu-min"); }
        return;
      }
      if (!P || P.id !== e.pointerId || !X || X.mode !== "hold" || !["eye", "bino", "scope"].includes(X.view)) return;
      const dx = e.clientX - P.x, dy = e.clientY - P.y; P.x = e.clientX; P.y = e.clientY;
      const k = Math.tan(X.fovNow / 2) * 2 / Math.max(200, FV.R.h);
      /* v130: Blick bleibt im Schussfeld (±65° um die Feldmitte) und geht nicht senkrecht auf den eigenen Boden/Brüstung –
         dahinter liegt nur leere Wiese ohne Wald, darunter nur die Kanzelbretter aus nächster Nähe */
      const t0 = X.th0 != null ? X.th0 : X.th;
      X.th = t0 + clamp(angN(X.th - dx * k - t0), -1.15, 1.15); X.ph = clamp(X.ph + dy * k, -0.34, 0.62);
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
      if (a === "mini") { if (X.card && !X.card.classList.contains("saved")) { X.card.classList.toggle("hu-min"); snd("tap"); } return; }
      if (a === "next") return harvestDone(false);
      if (a === "wall") return harvestDone(true);
    });
    /* v119: Atem halten und gleichzeitig schießen. Vorher löste JEDES pointerup (auch das des zweiten Fingers auf „Schuss“) den
       Atem wieder, und der Schuss kam erst über „click“, den iOS bei gedrücktem ersten Finger oft verschluckt. Jetzt: Atem merkt sich
       seinen eigenen Finger (id) und endet nur mit ihm; „Schuss“ löst schon beim Auflegen des Fingers aus (pointerdown). */
    let breathId = null, fireAt = 0;
    el.addEventListener("pointerdown", e => {
      const f = e.target.closest('[data-hu="fire"]');
      if (f && X) { e.preventDefault(); e.stopPropagation(); fireAt = performance.now(); fire(); return; }
      const b = e.target.closest('[data-hu="breath"]'); if (!b || !X) return;
      e.preventDefault(); e.stopPropagation(); breathId = e.pointerId; breath(true);
    });
    /* Klick auf „Schuss“ nach einem pointerdown-Schuss nicht noch einmal auslösen (Maus/Tastatur-Klick bleibt möglich) */
    el.addEventListener("click", e => { if (e.target.closest('[data-hu="fire"]') && performance.now() - fireAt < 700) e.stopImmediatePropagation(); }, true);
    const rel = e => { if (X && X.breath.on && e.pointerId === breathId) { breathId = null; breath(false); } };
    el.addEventListener("pointerup", rel); el.addEventListener("pointercancel", rel);
    window.addEventListener("pointerup", rel); window.addEventListener("pointercancel", rel);
    X.rel = rel;
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
      if (A.st === "fly") { A.st = "drop"; A.side = 1; A.fly.vy = Math.min(0, A.fly.vy); } else { A.st = "fall"; A.t = 0.45; A.side = 1; fallStart(A, 0.45); }
      A.zone = zone; X.target = A; buzz(22);
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
    X.target = A; buzz(22);
    if (A.hits.some(z => !ZONE[z].kill)) A.capW = true;         /* erst krank, dann erlegt: höchstens Bronze */
    if (A.runL < 0.3) { A.st = "fall"; A.t = 0.55; A.side = rnd() < 0.5 ? -1 : 1; fallStart(A, 0.55); }
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
  /* v135: kurzes Jagdhorn-Motiv zum Erfolg (Blechklang: Sägezahn durch Tiefpass, weicher Einsatz) – leise, gut eine Sekunde,
     je Art ein eigenes Motiv. Nur mit eingeschaltetem Ton (ac() prüft die Einstellung). */
  function hornSound(k) {
    const a = ac(); if (!a) return;
    const N = { keiler: [[392, 0, 0.17], [523, 0.17, 0.17], [659, 0.34, 0.26], [523, 0.62, 0.4]], hirsch: [[523, 0, 0.17], [659, 0.17, 0.17], [784, 0.34, 0.26], [659, 0.62, 0.4]],
      fasan: [[659, 0, 0.13], [784, 0.13, 0.13], [1047, 0.27, 0.36]] }[k] || [];
    const t0 = a.currentTime + 0.02, out = a.createGain(), lp = a.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1500; lp.Q.value = 0.7; out.gain.value = 0.05; lp.connect(out); out.connect(a.destination);
    N.forEach(([f, d, l]) => {
      const o = a.createOscillator(), g = a.createGain(), t = t0 + d;
      o.type = "sawtooth"; o.frequency.setValueAtTime(f * 0.985, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.04); g.gain.setValueAtTime(1, t + l * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + l + 0.08);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + l + 0.12);
    });
  }
  /* ------------------------------ Bergen (v135) ----------------------------------
     Der Moment nach dem Schuss als eigener kleiner Auftritt statt Ergebnisbildschirm:
     A  kurze Abblende, Schnitt nah an das liegende Stück (Bauchseite, schräg zum Haupt, leicht von oben), „Waidmannsheil!“ mit Namen des
        Stücks, leises Jagdhorn, kurzes Rütteln; das Stück leuchtet kurz warm auf
     B  die Kamera fährt in 2,6 s ruhig auf eine Einstellung, in der das Stück den freien Platz zwischen Überschrift und Karte
        füllt (aus den echten Modellpunkten berechnet, für jede Bildschirmgröße) – danach steht sie; Wischen dreht um das Stück
     C  echte Bestmarken unter der Überschrift (erstes Stück überhaupt bzw. der Art, stärkstes bisher, erste Medaille dieser
        Stufe); Karte von unten (breite Bildschirme: rechts): Medaille, Trophäe, Sammlerwert, aufklappbar Gewicht, Treffer,
        Flucht und Güte auf der Medaillenskala. Kleine Bildschirme starten zugeklappt, Wischen klappt sie zu.
     D  „Trophäe sichern“: Knopf sperrt sofort, die Trophäe genau dieses Stücks erscheint (derselbe Datensatz, der gespeichert
        wird), dann „Weiter jagen“ oder „Zur Trophäenwand“
     Antippen überspringt das Warten. Medaille, Güte, Preise, EP und Speicherung rechnen wie bisher. */
  const HV_FOV = 0.62;
  const TIER = [null, "Ordentliches Stück", "Gutes Stück", "Starkes Stück", "Außergewöhnliches Stück"];
  const BARC = [null, "#b4682b", "#76828f", "#d99c14", "#2aa3c8"];          /* Medaillenfarben, kräftig genug für den hellen Balken */
  const SPN = { hirsch: ["Rothirsch", "Dein erster Rothirsch", "Dein stärkster Rothirsch bisher"], keiler: ["Keiler", "Dein erster Keiler", "Dein stärkster Keiler bisher"],
    fasan: ["Fasan", "Dein erster Fasan", "Dein schönster Fasan bisher"] };
  const buzz = p => { try { if (navigator.vibrate && !(navigator.userActivation && !navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) { /* kein Rütteln */ } };
  /* breite Bildschirme (wie die CSS-Regel für #huntUI .hu-card2): Karte rechts statt unten */
  const sideUI = () => innerWidth >= 700 && innerWidth / Math.max(1, innerHeight) >= 1.25;
  function goHarvest(A) {
    if (!X || !A || A.st !== "dead" || X.view === "harvest") return;
    const zone = A.zone || "lunge";
    let medal = medalOf(A.score, A.k === "fasan" ? "vogel" : zone);
    if (A.capW) medal = Math.min(medal, 1);
    A.medal = Math.max(1, medal);
    A.rec = { k: A.k, m: A.medal, s: Math.round(A.score * 1000) / 1000, vr: A.vr || 0 };      /* genau dieser Datensatz wird gespeichert */
    A.feat = feats(A);
    X.view = "harvest";
    X.hrv = { A, t: 0, k: 0, from: camOf(FV.R.cam), yaw: heroYaw(A), pitch: A.k === "fasan" ? 0.62 : 0.52, uy: 0, up: 0, cut: false, ui: 0, fr: sideUI() ? { t: 0.17, b: 0.04, r: 0.47 } : { t: 0.17, b: 0.44, r: 0 }, mt: 0 };
    X.spotEl.hidden = true; X.range.hidden = true; X.marks.innerHTML = ""; X.msgEl.hidden = true; X.msgT = 0;
    breath(false);
    renderBar();
  }
  /* Bestmarken – nur, was die Daten hergeben */
  function feats(A) {
    const H = st(), N = SPN[A.k], log = (H.log || []).filter(L => L.k === A.k), C = collSync().filter(r => r.k === A.k), out = [];
    const had = log.length + C.length + ((H.n && H.n[A.k]) || 0);
    let best = H.top && H.top[A.k] != null ? H.top[A.k] : -1;
    log.forEach(L => { if (L.s != null) best = Math.max(best, L.s); }); C.forEach(r => { best = Math.max(best, r.s); });
    if (!H.kills) out.push("Deine erste Trophäe!");
    else if (!had) out.push(N[1]);
    else if (best >= 0 && A.rec.s > best) out.push(N[2]);
    if (H.best && A.medal > H.best) out.push("Erstmals " + MEDALS[A.medal].n);
    return out;
  }
  /* Blick von der Bauchseite (die Läufe liegen zur Kamera, die obere Flanke zeigt nach oben), schräg zum Haupt, leicht von oben –
     so liest sich das liegende Stück am klarsten. Frei von Bäumen, Felsen und Totholz. */
  function heroYaw(A) {
    const side = A.side || 1, lx = [Math.cos(A.ry), -Math.sin(A.ry)], f = [Math.sin(A.ry), Math.cos(A.ry)];
    const base = Math.atan2(side * lx[1] * 0.85 + f[1] * 0.5, side * lx[0] * 0.85 + f[0] * 0.5), B = A.box;
    const c = [(B.mn[0] + B.mx[0]) / 2, 0, (B.mn[2] + B.mx[2]) / 2];
    for (const o of [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, Math.PI - 0.5, Math.PI + 0.5]) if (camFree(c, base + o, 4.5 * A.s)) return base + o;
    return base;
  }
  function camFree(c, yaw, d) {
    const L = revLayout();
    for (let i = 1; i <= 10; i++) {
      const k = i / 10, x = c[0] + Math.cos(yaw) * d * k, z = c[2] + Math.sin(yaw) * d * k;
      if (L.trees.some(t => Math.hypot(t.x - x, t.z - z) < 0.7 + 0.45 * t.s)) return false;
      if (k < 0.65 && L.rocks.some(t => Math.hypot(t.x - x, t.z - z) < 1.05 * t.s + 0.25)) return false;
      if (k < 0.5 && L.logs.some(t => Math.hypot(t.x - x, t.z - z) < 1.1 * t.s)) return false;
    }
    return true;
  }
  /* Einstellung: kleinster Abstand, bei dem alle Punkte des liegenden Stücks in den freien Bereich passen (zwischen Überschrift
     oben und Karte unten, links/rechts mit Rand); das Stück sitzt mittig in diesem Bereich. Anfahrt: etwas weiter und seitlich. */
  function heroCam(Hv) {
    const A = Hv.A, R = FV.R, P = A.foot, k = Hv.k, tv = Math.tan(HV_FOV / 2), th = tv * R.w / Math.max(1, R.h);
    const yaw = Hv.yaw + Hv.uy - 0.42 * (1 - k) + 0.035 * Math.sin(Hv.t * 0.4) * k, pitch = clamp(Hv.pitch + Hv.up + 0.08 * (1 - k), 0.1, 0.95);
    const cp = Math.cos(pitch), sp = Math.sin(pitch), E = [Math.cos(yaw) * cp, sp, Math.sin(yaw) * cp], rt = [Math.sin(yaw), 0, -Math.cos(yaw)], up = [-Math.cos(yaw) * sp, cp, -Math.sin(yaw) * sp];
    const B = A.box, c = [(B.mn[0] + B.mx[0]) / 2, (B.mn[1] + B.mx[1]) / 2, (B.mn[2] + B.mx[2]) / 2];
    const yTop = 1 - 2 * Hv.fr.t, yBot = -1 + 2 * Hv.fr.b, yMid = (yTop + yBot) / 2, xR = 1 - 2 * (Hv.fr.r || 0), xMid = (xR - 1) / 2;
    const tgt = d => { const o = yMid * tv * d, ox = xMid * th * d; return [c[0] - up[0] * o - rt[0] * ox, c[1] - up[1] * o, c[2] - up[2] * o - rt[2] * ox]; };
    const fits = d => {
      const T = tgt(d), e = [T[0] + E[0] * d, T[1] + E[1] * d, T[2] + E[2] * d];
      for (let i = 0; i < P.length; i++) {
        const p = P[i], v0 = p[0] - e[0], v1 = p[1] - e[1], v2 = p[2] - e[2], zc = -(v0 * E[0] + v1 * E[1] + v2 * E[2]);
        if (zc < 0.4) return false;
        const xs = (v0 * rt[0] + v2 * rt[2]) / (zc * th), ys = (v0 * up[0] + v1 * up[1] + v2 * up[2]) / (zc * tv);
        if (xs > xR - 0.12 || xs < -0.86 || ys > yTop - 0.05 || ys < yBot + 0.05) return false;
      }
      return true;
    };
    let lo = 0.9, hi = 16;
    for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (fits(m)) hi = m; else lo = m; }
    const T = tgt(hi);
    return { tx: T[0], ty: T[1], tz: T[2], dist: hi * (1 + 0.3 * (1 - k)), yaw, pitch, fov: HV_FOV };
  }
  function harvestStep(Hv, dt) {
    Hv.t += dt;
    const t = Hv.t, A = Hv.A;
    X.fade = t < 0.3 ? t / 0.3 : Math.max(0, 1 - (t - 0.3) / 0.45);
    if (!Hv.cut && t >= 0.3) { Hv.cut = true; bedShow(A); }
    Hv.k = 1 - Math.pow(1 - clamp((t - 0.3) / 2.6, 0, 1), 3);
    if (t > 0.55 && Hv.ui === 0) { Hv.ui = 1; showWin(A); }
    if ((t > 1.75 || Hv.skip) && Hv.ui === 1 && t > 0.6) { Hv.ui = 2; showCard(A); }
    /* Hervorheben: warmes Aufleuchten nach dem Schnitt, klingt in gut einer Sekunde ab */
    if (A.node) A.node.glow = t > 0.3 && !A.kept ? 0.22 * Math.exp(-(t - 0.3) * 1.6) : 0;
    /* freien Bereich messen (Überschrift oben, Karte unten) – das Stück rückt weich in dessen Mitte */
    Hv.mt -= dt;
    if (Hv.mt <= 0 && X.ui) {
      Hv.mt = 0.25;
      const r = X.ui.getBoundingClientRect(), h = Math.max(1, r.height);
      if (!X.win.hidden) Hv.ft = clamp((X.win.getBoundingClientRect().bottom - r.top + 6) / h, 0.05, 0.4);
      if (!X.card.hidden) {
        const cr = X.card.getBoundingClientRect(), side = cr.left - r.left > r.width * 0.35;        /* breite Bildschirme: Karte rechts, das Stück links daneben */
        Hv.fb = side ? 0.04 : clamp((r.bottom - cr.top + 8) / h, 0.1, 0.62); Hv.fR = side ? clamp((r.right - cr.left + 10) / Math.max(1, r.width), 0, 0.6) : 0;
        X.drag.style.bottom = Math.round(r.bottom - cr.top + 6) + "px";
      }
    }
    if (Hv.ft != null) Hv.fr.t += (Hv.ft - Hv.fr.t) * Math.min(1, dt * 3);
    if (Hv.fb != null) Hv.fr.b += (Hv.fb - Hv.fr.b) * Math.min(1, dt * 3);
    if (Hv.fR != null) Hv.fr.r += (Hv.fR - (Hv.fr.r || 0)) * Math.min(1, dt * 3);
    if (X.drag && !X.drag.hidden && (Hv.dragged || t > Hv.dragT)) X.drag.classList.add("off");
    return Hv.cut ? heroCam(Hv) : Hv.from;
  }
  /* ---- Liegeplatz: Kontaktschatten, niedergedrücktes Gras, Farbspiel – randlos in die Wiese übergehend ---- */
  /* Farbe der Revier-Wiese genau so, wie das grobe Bodengitter sie an dieser Stelle zeigt (gleiche Dreiecke, gleiche Mischung) */
  function groundColAt(x, z) {
    const N = 44, M = 84, Rm = 240, dx = x - FC.x, dz = z - FC.z, r = Math.hypot(dx, dz);
    let a = Math.atan2(dz, dx); if (a < 0) a += Math.PI * 2;
    const k = clamp(Math.floor(N * Math.pow(r / Rm, 1 / 1.55)), 0, N - 1), j = Math.floor(a / (Math.PI * 2) * M) % M;
    const r0 = Rm * Math.pow(k / N, 1.55), r1 = Rm * Math.pow((k + 1) / N, 1.55), a0 = j / M * Math.PI * 2, a1 = (j + 1) / M * Math.PI * 2;
    const u = clamp((a - a0) / (a1 - a0), 0, 1), v = clamp((r - r0) / (r1 - r0), 0, 1);
    const C = (rr, aa) => revColor(FC.x + Math.cos(aa) * rr, FC.z + Math.sin(aa) * rr);
    const cA = C(r0, a0), cB = C(r0, a1), cC = C(r1, a1), cD = C(r1, a0);
    const w = u >= v ? [1 - u, u - v, v, 0] : [1 - v, 0, u, v - u];
    return [0, 1, 2].map(i => cA[i] * w[0] + cB[i] * w[1] + cC[i] * w[2] + cD[i] * w[3]);
  }
  /* Liegeplatz: innen der weiche Farbverlauf der Wiese (das grobe Bodengitter zeigt aus der Nähe gerade Farbkanten), dazu
     sanfte helle/dunkle Flecken, um das Stück niedergedrücktes, matteres Gras und der Kontaktschatten; außen läuft alles
     genau in die Farbe des Bodengitters aus – keine sichtbare Kante. rad: ganzer Fleck, near: Umkreis des Stücks */
  function bedMesh(A, cx, cz, rad, near) {
    const b = MB(), NR = 22, NS = 64, P = A.foot.filter(p => p[1] < 0.5);
    const col = (x, z) => {
      const d = Math.hypot(x - cx, z - cz), rim = ss((d / rad - 0.7) / 0.3), inner = 1 - ss((d - near * 0.55) / (near * 0.8));
      let c = mixC(revColor(x, z), groundColAt(x, z), rim);
      const w = Math.sin(x * 1.3 + z * 0.7) * Math.sin(z * 1.1 - x * 0.5) + 0.5 * Math.sin(x * 3.7 - z * 2.9);
      c = mulc(c, 1 + 0.045 * w * (1 - rim));
      let ao = 0;
      for (const p of P) { const d2 = (p[0] - x) * (p[0] - x) + (p[2] - z) * (p[2] - z); if (d2 < 0.4) ao += Math.exp(-d2 / 0.028) * (p[1] < 0.08 ? 0.055 : 0.02 * (1 - p[1] / 0.5)); }
      const n = hsh(Math.round(x * 8), Math.round(z * 8), 7), n2 = Math.sin(x * 3.1 + z * 1.7) * Math.sin(z * 2.3 - x * 1.1);
      c = mixC(c, mixC(0x93a84c, 0x6c8a3a, n), inner * (0.1 + 0.1 * n2 + 0.08 * n));               /* niedergedrückt, matter, fleckig */
      return mulc(c, 1 - Math.min(0.42, ao) * (1 - rim));
    };
    const memo = new Map(), pt = (i, j) => {                       /* jede Gitterecke nur einmal berechnen */
      const key = i * 1000 + (j % NS); let v = memo.get(key);
      if (!v) { const r = ringR(i), a = (j % NS) / NS * Math.PI * 2, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; v = [[x - cx, 0, z - cz], col(x, z)]; memo.set(key, v); }
      return v;
    };
    const ringR = i => rad * Math.pow(i / NR, 1.3);
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) {
      const Pa = pt(i, j), Pb = pt(i, j + 1), Pc = pt(i + 1, j + 1), Pd = pt(i + 1, j);
      if (i > 0) b.triV(Pa[0], Pb[0], Pc[0], Pa[1], Pb[1], Pc[1]);
      b.triV(Pa[0], Pc[0], Pd[0], Pa[1], Pc[1], Pd[1]);
    }
    return b;
  }
  function bedShow(A) {
    if (X.bed || !A.box) return;
    const B = A.box, cx = (B.mn[0] + B.mx[0]) / 2, cz = (B.mn[2] + B.mx[2]) / 2, near = Math.max(B.mx[0] - B.mn[0], B.mx[2] - B.mn[2]) / 2 + 0.9, rad = Math.max(4.5, near + 2.8);
    const mesh = FV.R.mesh(bedMesh(A, cx, cz, rad, near)), node = addNode(mesh, { x: cx, y: 0.012, z: cz, shadow: false });
    /* Grasbüschel, die am oder im Stück stünden, solange wegnehmen */
    const L = revLayout(), hid = [];
    L.grass.forEach((g, i) => {
      if (Math.hypot(g.x - cx, g.z - cz) > rad + 0.6 || !A.foot.some(p => Math.hypot(p[0] - g.x, p[2] - g.z) < 0.4 + 0.35 * g.s)) return;
      const G = RG.get("hu_gt" + g.v); if (G) { G.remove("hg" + i); hid.push([G, i, g]); }
    });
    X.bed = { node, mesh, hid };
  }
  function bedClear() {
    if (!X || !X.bed) return;
    const Bd = X.bed; X.bed = null;
    rmNode(Bd.node); if (FV.R && FV.R.free) FV.R.free(Bd.mesh);
    Bd.hid.forEach(([G, i, g]) => { if (FV.R.instGroups.has(G)) G.add("hg" + i, g.x, g.z, g.ry, g.s); });
  }
  /* ---- Oberfläche ---- */
  const fkg = A => (A.k === "fasan" ? fnum(A.T.kg, 1) : A.T.kg) + " kg";
  function showWin(A) {
    const Z = ZONE[A.zone] || ZONE.lunge;
    X.win.innerHTML = `<small>Waidmannsheil!</small><b>${esc(A.T.name)}</b><em>${esc(Z.n)} auf ${A.dm || "?"} m</em>${A.feat.length ? `<div class="hu-feat">${A.feat.map(f => `<span>★ ${esc(f)}</span>`).join("")}</div>` : ""}`;
    X.win.hidden = false; X.win.classList.remove("go"); void X.win.offsetWidth; X.win.classList.add("go");
    X.vig.classList.add("on");
    hornSound(A.k); buzz([16, 70, 28]);
  }
  function cardHTML(A) {
    const M = MEDALS[A.medal], id = trophyId(A.k, A.medal), price = PRICE[A.k][A.medal], room = typeof farmRoom === "function" ? farmRoom(id) : 1;
    const Z = ZONE[A.zone] || ZONE.lunge, bonus = A.capW ? 0 : Z.bonus || 0, eff = clamp(A.score + bonus, 0, 1);
    const note = A.capW ? "Erst krank geschossen – höchstens Bronze." : Z.note || "";
    const fled = Math.round((A.dist || 0) * M_PER_U), flucht = A.k === "fasan" ? ["Uhrzeit", typeof clock === "function" ? clock(S.time) : "–"] : ["Flucht", fled < 2 ? "sofort gelegen" : "nach " + fled + " m"];
    const tick = (v, m) => `<u style="left:${v}%" title="${MEDALS[m].n}"><s>${MEDALS[m].i}</s></u>`;
    return `<div class="hu-ct" data-hu="mini"><span class="hu-md m${A.medal}" style="--mc:${M.c}"><i>${M.i}</i></span>
        <div class="hu-cn"><small>${esc(TIER[A.medal])}</small><b>${esc(M.n)}-Trophäe</b><em>${esc(A.T.troph)}</em></div>
        <span class="hu-val"><small>Sammlerwert</small><b>${eur(price)}</b><i class="hu-tg"></i></span></div>
      <div class="hu-more">
        <div class="hu-c3"><span><small>Gewicht</small><b>${fkg(A)}</b></span><span><small>Treffer</small><b>${esc(Z.n)}</b></span><span><small>${flucht[0]}</small><b>${esc(flucht[1])}</b></span></div>
        <div class="hu-q"><span>Güte <b>${Math.round(A.score * 100)}</b>${bonus ? `<em>+${Math.round(bonus * 100)} ${esc(Z.n)}</em>` : ""}</span>
          <i class="hu-qb" style="--q:${(eff * 100).toFixed(1)}%;--mc:${BARC[A.medal]}"><b></b>${tick(50, 2)}${tick(72, 3)}${tick(90, 4)}</i></div>
        ${note ? `<p class="hu-note">${esc(note)}</p>` : ""}
      </div>
      ${room > 0 ? `<button class="btn hu-keep" data-hu="keep">🏆 Trophäe sichern</button>` : `<button class="btn hu-keep" data-hu="sell">💰 Trophäenwand voll – an Sammler · ${eur(price)}</button>`}`;
  }
  function showCard(A) {
    X.card.innerHTML = cardHTML(A);
    /* kleine Bildschirme: Karte schmal (nur Medaille, Trophäe, Knopf) – Antippen klappt die Werte auf */
    X.card.className = "hu-card2" + (FV.R.h < 560 && !sideUI() ? " hu-min" : ""); X.card.hidden = false;
    X.drag.hidden = false; X.drag.classList.remove("off"); X.hrv.dragT = X.hrv.t + 4.5;
    snd(A.medal >= 3 ? "pearl" : "collect");
    if (A.medal >= 3 && A.box) {                       /* nur bei Gold und Diamant: wenige feine Lichtpunkte hinter dem Stück */
      const B = A.box, cam = FV.R.cam, bx = -Math.cos(cam.yaw) * 0.4, bz = -Math.sin(cam.yaw) * 0.4;
      FV.R.burst({ x: (B.mn[0] + B.mx[0]) / 2 + bx, y: B.mx[1] * 0.6, z: (B.mn[2] + B.mx[2]) / 2 + bz, n: A.medal === 4 ? 14 : 9, col: [[1, 0.88, 0.5, 1], [1, 0.97, 0.8, 1]], speed: 0.25, up: 0.9, g: 0.25, drag: 0.8, life: 1.8, size: 0.012 + 0.01 * Math.min(2, Math.max(B.mx[0] - B.mn[0], B.mx[2] - B.mn[2])), spread: Math.max(B.mx[0] - B.mn[0], B.mx[2] - B.mn[2]) * 0.4 });
    }
  }
  function keepTrophy(sell) {
    const Hv = X && X.hrv, A = Hv && Hv.A;
    if (!A || A.kept || Hv.ui < 2) return;
    A.kept = true;                                                    /* doppeltes Tippen: zweiter Aufruf endet hier */
    X.card.querySelectorAll("button").forEach(b => { b.disabled = true; });
    const H = st(), id = trophyId(A.k, A.medal), price = PRICE[A.k][A.medal];
    let n = 0;
    if (sell) { S.money += price; if (typeof logMoney === "function") logMoney("farm", "Trophäe an Sammler: " + A.T.troph, price); }
    else { collSync(); farmAdd(id, 1, 3); const C = st().coll; C.push(Object.assign({ u: uid() }, A.rec, { t: S.time, zone: A.zone, dm: A.dm, hits: A.hits.slice(0, 4) })); n = C.length; }
    H.kills++; H.stock = Math.max(0, H.stock - 1);
    H.best = Math.max(H.best || 0, A.medal);
    H.n = H.n || {}; H.n[A.k] = (H.n[A.k] || 0) + 1;                   /* v135: je Art zählen und Bestwert merken (für „erster“/„stärkster“) */
    H.top = H.top || {}; H.top[A.k] = Math.max(H.top[A.k] != null ? H.top[A.k] : -1, A.rec.s);
    H.log.unshift({ k: A.k, m: A.medal, t: S.time, name: A.T.name, troph: A.T.troph, zone: A.zone, dm: A.dm, s: A.rec.s });
    if (H.log.length > 40) H.log.length = 40;
    if (typeof farmXP === "function") farmXP(XP[A.k][A.medal]);
    save();
    showSaved(A, sell, n, price);
    snd("clunk"); setTimeout(() => snd("coin"), 150); if (A.medal === 4) setTimeout(() => snd("pearl"), 380);
    buzz(sell ? 20 : [20, 50, 34]);
    X.target = null;
  }
  function showSaved(A, sell, n, price) {
    const M = MEDALS[A.medal];
    X.card.className = "hu-card2 saved" + (sell ? " sold" : "");
    X.card.innerHTML = `<div class="hu-sv"><span class="hu-svimg" style="--mc:${M.c}">${recThumb(A.rec, true)}<i class="hu-shine"></i><em>${M.i}</em></span>
        <div class="hu-svt"><small>${sell ? "Verkauft" : "✓ Gesichert"}</small><b>${esc(A.T.troph)}</b>
          <em>${sell ? "an einen Sammler · +" + eur(price) : M.n + " · an deiner Trophäenwand"}</em>
          <span>${sell ? "" : (n === 1 ? "dein erstes Stück an der Wand" : n + " Stücke an der Wand") + " · "}+${XP[A.k][A.medal]} EP</span></div></div>
      <div class="hu-sb">${sell ? "" : `<button class="btn ghost hu-wall" data-hu="wall">🏆 Trophäenwand</button>`}<button class="btn hu-go" data-hu="next">Weiter jagen</button></div>`;
    X.drag.classList.add("off");
    if (typeof thumbFill === "function") thumbFill();
  }
  /* zurück auf den Hochsitz – oder gleich zur Trophäenwand (Hochsitz verlassen, Lager öffnen) */
  function harvestDone(wall) {
    const Hv = X && X.hrv;
    if (!Hv || !Hv.A.kept || X.view !== "harvest") return;
    X.card.querySelectorAll("button").forEach(b => { b.disabled = true; });
    X.view = "back"; X.back = { t: 0, A: Hv.A, wall: !!wall };
    renderBar(); snd("swish");
  }
  function harvestUIClear() {
    if (!X) return;
    [X.win, X.card].forEach(e => { if (e) { e.hidden = true; e.innerHTML = ""; } });
    if (X.drag) X.drag.hidden = true;
    if (X.vig) X.vig.classList.remove("on");
  }

  /* ---------------------------- Trophäenwand (v120) ----------------------------
     Im Lager-Reiter „Trophäen“: jedes Stück einzeln als großes Bild (das echte 3D-Modell, von vorn), Name, Enden bzw. Länge,
     Medaille, Wert. Antippen öffnet die Nahansicht: das Präparat dreht sich langsam hin und her (eigener kleiner Zeichner,
     läuft nur, solange die Ansicht offen ist), dazu Bewertung, Gewicht, Treffer, Entfernung und Tag des Erlegens. */
  const TVIEW = { yaw: Math.PI / 2 - 0.42, pitch: 0.1, noShadow: true };            /* hängt an der Wand: kein Bodenschatten */
  const WALL = { sel: null };
  const what = (k, T) => k === "hirsch" ? T.P + "-Ender" : k === "keiler" ? "Waffen " + T.cm + " cm" : "Stoß " + T.cm + " cm";
  const fnum = (v, d) => String(Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).replace(".", ",");
  function recThumb(r, big) {
    if (typeof thumbSpan !== "function") return `<span class="ic">${MEDALS[r.m].i}</span>`;
    return thumbSpan("tro:" + trophyKey(r) + (big ? ":b" : ""), () => trophyBuild(r), SP[r.k].i, false, Object.assign({ big: !!big }, TVIEW));
  }
  function wallHTML() {
    const C = collSync().slice().sort((a, b) => b.m - a.m || b.s - a.s || (b.t || 0) - (a.t || 0));
    if (!C.length) return null;
    const sum = C.reduce((t, r) => t + PRICE[r.k][r.m], 0), sel = C.find(r => r.u === WALL.sel);
    if (!sel) WALL.sel = null;
    let det = "";
    if (sel) {
      const T = traits(sel.k, sel.s), M = MEDALS[sel.m], z = sel.zone && ZONE[sel.zone] ? ZONE[sel.zone].n : null;
      const rows = [["Bewertung", fnum(sel.s * 100, 1)], ["Gewicht", (sel.k === "fasan" ? fnum(T.kg, 1) : T.kg) + " kg"], z ? ["Treffer", z] : null, sel.dm ? ["Entfernung", sel.dm + " m"] : null,
        sel.t != null && typeof dayOf === "function" ? ["Erlegt", "Tag " + dayOf(sel.t) + (typeof clock === "function" ? ", " + clock(sel.t) : "")] : null].filter(Boolean);
      det = `<div class="tw-det" style="--mc:${M.c}">
        <div class="tw-stage" id="twStage"><span class="tw-badge">${M.i} ${esc(M.n)}</span></div>
        <div class="tw-info"><b>${esc(T.name)}</b><small>${esc(T.troph)}</small>
          <div class="tw-rows">${rows.map(([a, v]) => `<span><small>${a}</small><b>${esc(String(v))}</b></span>`).join("")}</div>
          ${sel.old === 2 ? `<p class="tw-note">Altbestand – Werte geschätzt.</p>` : ""}
          <div class="tw-btns"><button class="btn tiny ghost" data-twx="1">Schließen</button><button class="btn tiny" data-twsell="${sel.u}">💰 An Sammler · ${eur(PRICE[sel.k][sel.m])}</button></div></div></div>`;
    }
    return `<div class="tw"><div class="tw-head"><b>🏆 Trophäenwand</b><small>${C.length} ${C.length === 1 ? "Stück" : "Stücke"} · Sammlerwert ${eur(sum)}</small></div>${det}
      <div class="tw-grid">${C.map(r => { const T = traits(r.k, r.s), M = MEDALS[r.m];
        return `<button class="tw-c${r.u === WALL.sel ? " on" : ""}" data-tw="${r.u}" style="--mc:${M.c}"><span class="tw-img">${recThumb(r, true)}</span><span class="tw-md">${M.i}</span>
          <b>${esc(T.name)}</b><small>${esc(what(r.k, T))}</small><em>${eur(PRICE[r.k][r.m])}</em></button>`; }).join("")}</div></div>`;
  }
  function wallBind(redraw) {
    $$("#farmSheetIn [data-tw]").forEach(el => el.onclick = () => { WALL.sel = WALL.sel === el.dataset.tw ? null : el.dataset.tw; snd("tap"); redraw(); });
    $$("#farmSheetIn [data-twx]").forEach(el => el.onclick = () => { WALL.sel = null; redraw(); });
    $$("#farmSheetIn [data-twsell]").forEach(el => el.onclick = () => {
      const got = sellRec(el.dataset.twsell);
      if (got) { snd("coin"); WALL.sel = null; save(); if (typeof toast === "function") toast("🏆 Trophäe verkauft: +" + eur(got), "good"); redraw(); }
    });
    const host = $("#twStage"), r = WALL.sel && recOf(WALL.sel);
    if (host && r) turntable(host, r);
    if (typeof thumbFill === "function") thumbFill();
  }
  /* Drehansicht: ein Zeichner für alle Trophäen, Leinwand wird nur umgehängt; Schleife endet, sobald die Ansicht zu ist */
  const TT = { R: null, cv: null, key: null, mesh: null, raf: 0, box: null };
  function turntable(host, r) {
    if (typeof G3 === "undefined") return;
    if (!TT.cv) { TT.cv = document.createElement("canvas"); TT.cv.className = "tw-cv"; }
    host.insertBefore(TT.cv, host.firstChild);
    try {
      if (!TT.R) { TT.R = G3.create(TT.cv, { shadowSize: 1024, shadowBox: 3, maxDpr: 2 }); if (TT.R) TT.R.env.fogR = [400, 800]; }
    } catch (e) { TT.R = null; }
    const R = TT.R;
    if (!R) { host.classList.add("nogl"); host.insertAdjacentHTML("beforeend", recThumb(r, true)); return; }
    const key = trophyKey(r);
    if (TT.key !== key) {
      if (TT.mesh) R.free(TT.mesh);
      TT.mesh = R.mesh(trophyBuild(r)); TT.key = key; R.nodes.length = 0; R.nodes.push(R.node(TT.mesh, {}));
      const b = TT.mesh.box; TT.box = { c: [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2, (b[0][2] + b[1][2]) / 2], r: Math.max(0.3, Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1], b[1][2] - b[0][2]) / 2) };
      R.shadowBox = TT.box.r * 1.6;
    }
    const t0 = performance.now(), B = TT.box;
    cancelAnimationFrame(TT.raf);
    const loop = now => {
      if (!TT.cv.isConnected) { TT.raf = 0; return; }
      const t = (now - t0) / 1000;
      Object.assign(R.cam, { tx: B.c[0], ty: B.c[1], tz: B.c[2], dist: B.r * 3.05, yaw: Math.PI / 2 - 0.2 + Math.sin(t * 0.5) * 0.42, pitch: 0.1 + Math.sin(t * 0.33) * 0.03, fov: 0.55 });
      R.render(t);
      TT.raf = requestAnimationFrame(loop);
    };
    TT.raf = requestAnimationFrame(loop);
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
      goal = harvestStep(X.hrv, dt);
    } else if (X.view === "back" && X.back) {
      const Bk = X.back; Bk.t += dt;
      X.fade = Bk.t < 0.35 ? Bk.t / 0.35 : Math.max(0, 1 - (Bk.t - 0.35) / 0.45);
      if (Bk.t >= 0.35 && !Bk.cut) { Bk.cut = true; harvestUIClear(); bedClear(); unbuild(Bk.A); Bk.A.st = "gone"; X.drops.forEach(d => rmNode(d.n)); X.drops = []; }
      goal = Bk.cut ? look : camOrbitHold();
      if (Bk.t >= 0.8) {
        X.view = "eye"; X.back = null; X.hrv = null; renderBar();
        if (Bk.wall) { X.afterFinish = () => { if (typeof openFarmStore === "function") openFarmStore("troph"); }; end(); }
      }
    }
    if (X.dbgCam) goal = typeof X.dbgCam === "function" ? X.dbgCam() : X.dbgCam;          /* nur für Tests (Kamera frei setzen) */
    CAM_KEYS.forEach(k => { c[k] = goal[k]; });
    /* v153: im Auge-Blick 0,3 statt 1,1 – mit 1,1 m wurden Brüstung, Auflage, Eckpfosten und Dach des eigenen Hochsitzes (0,8–1,2 m vom Auge)
       in scharfen Diagonalen abgeschnitten. 24-Bit-Tiefenpuffer: bei 200 m Entfernung ≈ 1 cm Auflösung, die Ferne flimmert nicht.
       /* v111: nahe Ebene je nach Ansicht weit nach hinten – im Fernglas/Zielfernrohr ist nichts näher als 6 m im Bild,
       dafür bleibt der Tiefenpuffer fein genug, dass Stämme und Äste in der Ferne nicht mehr flimmern oder zerreißen */
    if (X.inRv) { c.near = X.view === "bino" || X.view === "scope" ? 3.2 : X.view === "eye" ? 0.3 : 0.6; c.far = FAR; }
    if (X.inRv && X.rv && X.rv.trees) { const far = X.view !== "eye"; if (X.rv.far !== far) revLod(far); revBuildStep(); }
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
    /* v135: sobald das Stück liegt – kurze Bestätigung, dann (1,1 s später) die Bergung */
    if (T && T.st === "dead" && !T.cf) { T.cf = true; if (["eye", "bino", "scope"].includes(X.view)) { msg("Liegt! " + T.T.name, 1.2, "good"); buzz(14); } }
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
  function camOrbitHold() { return X.hrv && X.hrv.A.box ? heroCam(X.hrv) : camOf(FV.R.cam); }
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
    const c = FV.R.cam, after = X.afterFinish;
    if (X.inRv) leaveRevier();
    CAM_KEYS.forEach(k => { c[k] = X.saved[k]; });
    delete c.near; delete c.far;
    X.nodes.slice().forEach(rmNode);
    if (X.ui && X.ui.parentNode) X.ui.parentNode.removeChild(X.ui);
    if (X.rel) { window.removeEventListener("pointerup", X.rel); window.removeEventListener("pointercancel", X.rel); }
    if (X.key) { window.removeEventListener("keydown", X.key); window.removeEventListener("keyup", X.key); }
    document.body.classList.remove("fp3d", "fphunt");
    FV.fp = null; X = null;
    if (typeof clampCam === "function") clampCam();
    if (typeof save === "function") save();
    if (after) setTimeout(after, 80);                  /* v135: „Zur Trophäenwand“ */
  }

  /* ------------------------------ Markt ----------------------------------- */
  function marketHTML() {
    if (typeof S === "undefined" || !S.farm || !S.farm.inv) return "";
    const ids = Object.keys(S.farm.inv).filter(id => /^tro_/.test(id) && FITEMS[id] && farmInv(id) > 0);
    if (!ids.length) return "";
    ids.sort((a, b) => FITEMS[b].v - FITEMS[a].v);
    const sum = ids.reduce((t, id) => t + farmSellPrice(id, farmInv(id)), 0);
    return `<div class="card hu-mkt"><div class="card-top"><span class="vicon">🏆</span><div class="vname">Trophäen-Sammler<small>Sammler zahlen den vollen Wert – verkauft wird jeweils das schwächste Stück der Stufe</small></div><span class="price">${money(sum)}</span></div>
      <div class="hu-mrows">${ids.map(id => `<div><span>${FITEMS[id].i} ${esc(FITEMS[id].n)} <small>× ${farmInv(id)}</small></span><button class="btn tiny" data-husell="${id}">verkaufen · ${money(farmSellPrice(id, 1))}</button></div>`).join("")}</div></div>`;
  }
  function marketBind() {
    $$("#tab-market [data-husell]").forEach(b => b.onclick = () => {
      const m = farmSell(b.dataset.husell, 1);
      if (m) { collSync(); snd("coin"); save(); if (typeof toast === "function") toast("🏆 Trophäe verkauft: +" + money(m), "good"); renderMarket(); }
    });
  }
  return {
    CX, CZ, CR, TW, TRY, PH, EYEP, EYER, RV, FC, M_PER_U, SP, ZONE, MEDALS, PRICE, NEED, DOT,
    clear, ground, inMeadow, edgeR, fieldE, fieldPt, spawnPoint, attach, pick, tagInfo, sheet, begin, step, end, marketHTML, marketBind, trophyId, trophyMesh,
    wallHTML, wallBind, collSync, trophyBuild, trophyKey,
    _m: { deerBody: () => deerBody(), deerNeck: () => deerNeck(), deerHead: (P, sc, vr) => deerHead(P, sc, vr), deerUpper: f => deerUpper(f), deerLower: f => deerLower(f), deerEar: s => deerEar(s), deerTail: () => deerTail(),
      boarBody: () => boarBody(), boarHead: (sc, cm) => boarHead(sc, cm), boarLeg: f => boarLeg(f), boarUpper: f => boarUpper(f), boarLower: () => boarLower(), phBody: () => phBody(), phHead: () => phHead(), phLeg: () => phLeg(), antlerPlan, qS, REP_S },
    zoneHit, medalOf, traits, drawScore, camLook, rot, unrot, windDrift, holdDots, unlocked, built, buildNow,
    get on() { return !!X; }, get X() { return X; },
    _spawn: (k, enter, pre) => X && X.inRv && spawn(k, enter, pre), toRv, fromRv, _mw: () => MW, _mwSpawn: mwSpawn, _fire: () => fire(), _view: v => setView(v), _rv: () => X && X.rv, TREE_HI,
    _trophyBuild: r => trophyBuild(r), _harvest: A => goHarvest(A), _dead: A => deadPose(A), _keep: s => keepTrophy(s), _done: w => harvestDone(w), _fall: A => { A.st = "fall"; A.t = 0.8; A.side = 1; fallStart(A, 0.8); }, _lie: (A, x, z) => lieSpot(A, x, z), _lieBlocked: (A, x, z) => lieBlocked(x, z, liePad(A)), _layout: () => revLayout(), _collSync: () => collSync(), _sellRec: u => sellRec(u),
    _headPos: A => { const n = A.node, s = A.s, S0 = SP[A.k], hp = rot([S0.headP[0], S0.headP[1], S0.headP[2] + 0.0], A.neck.rx, A.neck.ry, 0), f = rot([0, 0, 0.2], A.head.rx, 0, 0), f2 = rot(f, A.neck.rx, A.neck.ry, 0);
      const l = [(S0.neckP[0] + hp[0] + f2[0]) * s, (S0.neckP[1] + hp[1] + f2[1]) * s, (S0.neckP[2] + hp[2] + f2[2]) * s], w = rot(l, n.rx, n.ry, n.rz); return [n.x + w[0], n.y + w[1], n.z + w[2]]; }
  };
})();
if (typeof module !== "undefined") module.exports = HUNT;
