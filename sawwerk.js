/* =========================================================================
   LOGISTIKA – sawwerk.js (v185)
   Die Maschinen des Sägewerks: Modelle in einem gemeinsamen Stil, die
   Werkstücke und der sichtbare Produktionsablauf.

   Aufbau jeder Maschine (lokal, vor dem Drehen des Objekts):
     links (−x) Zufuhr  →  Mitte Bearbeitung  →  rechts (+x) Ausgabe,
     vorn (+z) steht der Bediener. Boden y = 0, Fundament bis y = 0,06.
   Maßstab wie woodmodels.js: 1 Einheit = 1 Kachel (~2 m).

   Der Ablauf liest nur den Spielstand und ändert nichts daran:
     o.q[0]   laufender Auftrag (start/end → Fortschritt f), o.q[1…] wartende
     o.done   fertige Ware, die auf Abholung wartet
     o.broken Störung
   Was an der Zufuhr liegt, ist schon eingelagertes Material wartender Aufträge,
   was an der Ausgabe liegt, ist genau die abholbereite Ware (dazu bei Maschinen
   mit mehreren Stücken je Auftrag die schon fertigen Stücke des laufenden).
   Gebaut aus den Grundkörpern von gl3d.js (G3.MB); Holzfarben aus woodmodels.js.
   ========================================================================= */
const SWK = (() => {
  "use strict";
  const MB = G3.MB, PI = Math.PI;
  const cv = c => G3.col(c);
  const mix = (a, b, t) => { const A = cv(a), B = cv(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
  const shd = (c, f) => { const A = cv(c); return [Math.min(1, A[0] * f), Math.min(1, A[1] * f), Math.min(1, A[2] * f)]; };
  const hs = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const cl = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const seg = (f, a, b) => cl((f - a) / (b - a));
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ------------------------------ Designsystem ------------------------------
     Rahmen graphitgrau, blanker Stahl satiniert, Gummi fast schwarz, Fundamente
     aus Beton mit gelber Sicherheitslinie. Jede Maschine hat eine gedämpfte
     Akzentfarbe, an der man sie wiedererkennt – keine Regenbogenfarben.     */
  const P = {
    frame: 0x3e454c, frameT: 0x4e575f, frameD: 0x2d3338,
    steel: 0x9ea9b1, steelL: 0xc6cfd5, steelD: 0x747f88,
    alu: 0xcdd3d7, aluD: 0xa3abb1,
    rubber: 0x2c2d31, rubberL: 0x3c3e43, hose: 0x2a2b2f, hoseL: 0x3a3c41,
    concrete: 0xb0aa9e, concreteD: 0x8f897f,
    warnY: 0xf0bf2c, warnK: 0x2b2b2e,
    cab: 0xd9dee1, cabD: 0xb4bcc1,
    screen: 0x24384a, glass: 0x1d2226,
    cloth: 0xf0ece2, clothD: 0xdcd5c6,
    red: 0xd2402f, green: 0x3fae5a, brass: 0xd8b04a,
    dark: 0x1c1f22, sawdust: 0xe6cf9e
  };
  const ACC = {
    spalter: [0xe2a62c, 0xbd8820],   /* Hydraulik-Gelb */
    verpack: [0xdb762c, 0xb35f22],   /* Signalorange */
    fraese:  [0xb94a3b, 0x933a2e],   /* Oxidrot */
    hobel:   [0x3f8a6c, 0x316e56],   /* Maschinengrün */
    schleif: [0x4677a6, 0x375f84],   /* Stahlblau – ersetzt den lila Platzhalter */
    gatter:  [0x2f6c78, 0x255660],   /* Petrol */
    trocken: [0xe8ebed, 0xc9d0d5],   /* Isolierpaneel */
    bock:    [0xf2731e, 0xc95c16]    /* Kettensägen-Orange */
  };
  /* Holz: geschnitten (sägerau), gehobelt, getrocknet, Eiche, Platten, Buche, Kirsche */
  const WD = {
    raw:  { a: 0xc7955a, b: 0xb5844d, top: 0xd1a266, end: 0xe2bd85 },
    pln:  { a: 0xe8c995, b: 0xdcba82, top: 0xf0d6a6, end: 0xf3dcb0 },
    dry:  { a: 0xe2c894, b: 0xd8bc84, top: 0xecd6aa, end: 0xf2e0b8 },
    oak:  { a: 0x9c6b3f, b: 0x8b5d35, top: 0xab7a4b, end: 0xc49866 },
    ply:  { a: 0xd8b27a, b: 0xc79e64, top: 0xe2c08c, end: 0xb98d55 },
    beech: { a: 0xd9ad84, b: 0xc8986e, top: 0xe3bc96, end: 0xeccaa4 },
    cherry: { a: 0xb86c46, b: 0xa45c3a, top: 0xc67c54, end: 0xd59a72 },
    blk:  { a: 0xc29a62, b: 0xb48a54, top: 0xcca46c, end: 0xdcb880 }
  };
  const WT = () => FWM.WT, BK = () => FWM.BARK;
  const SPC = { kiefer: "kiefer", birke: "birke", buche: "buche", eiche: "eiche", edelholz: "kirsche", reste: "kiefer", aeste: "ast" };
  const LOG_R = { kiefer: 0.15, birke: 0.13, buche: 0.16, eiche: 0.18, kirsche: 0.14, ast: 0.05 };
  const LOG_IDS = new Set(["kiefer", "birke", "buche", "eiche", "edelholz"]);

  /* ------------------------------- Bausteine ------------------------------- */
  /* Fundament: Betonplatte, abgesetzte Kante, gelbe Linie um den Arbeitsbereich */
  function pad(b, w, d) {
    b.box(w, 0.06, d, P.concreteD, { top: P.concrete });
    const y = 0.0615, t = 0.035, i = 0.09;
    b.plate(w - 2 * i, t, P.warnY, { y0: y, z: d / 2 - i });
    b.plate(w - 2 * i, t, P.warnY, { y0: y, z: -d / 2 + i });
    b.plate(t, d - 2 * i - t, P.warnY, { y0: y, x: w / 2 - i });
    b.plate(t, d - 2 * i - t, P.warnY, { y0: y, x: -w / 2 + i });
  }
  /* Stab (eckig oder rund mit n Seiten) von A nach B */
  function rod(b, A, B, s, c, n) {
    const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], L = Math.hypot(dx, dy, dz) || 1e-6;
    const rx = Math.acos(Math.max(-1, Math.min(1, dy / L))), ry = Math.atan2(dx, dz);
    if (n) b.cyl(s, s, L, n, c, { x: A[0], y: A[1], z: A[2], rx, ry, notop: true, nobot: true });
    else b.at({ x: A[0], y: A[1], z: A[2], ry, rx }, m => m.box(s, L, s, c));
  }
  /* Schlauch/Rohr durch Punkte (quadratische Bézier-Glättung je Ecke), Rippen als Farbwechsel */
  function tube(b, pts, r, c, c2, n) {
    const P2 = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const A = pts[i - 1], B = pts[i], C = pts[i + 1], a = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], e = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2, (B[2] + C[2]) / 2];
      for (let k = 0; k <= 4; k++) { const t = k / 4, u = 1 - t; P2.push([u * u * a[0] + 2 * u * t * B[0] + t * t * e[0], u * u * a[1] + 2 * u * t * B[1] + t * t * e[1], u * u * a[2] + 2 * u * t * B[2] + t * t * e[2]]); }
    }
    P2.push(pts[pts.length - 1]);
    for (let i = 0; i < P2.length - 1; i++) {
      const A = P2[i], B = P2[i + 1], d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, k = r * 0.5 / L;
      rod(b, [A[0] - d[0] * k, A[1] - d[1] * k, A[2] - d[2] * k], [B[0] + d[0] * k, B[1] + d[1] * k, B[2] + d[2] * k], r, i % 2 && c2 ? c2 : c, n || 6);
    }
  }
  function leg(b, x, z, h, s, c) {
    b.box(s, h, s, c || P.frame, { x, z, y: 0.06, top: P.frameT });
    b.box(s * 1.7, 0.02, s * 1.7, P.frameD, { x, z, y: 0.06 });
  }
  /* Rollentisch entlang x: Oberkante der Rollen auf Höhe y, Breite w (z) */
  function rollerBed(b, x0, x1, y, w, n, legs) {
    const L = x1 - x0, r = 0.04, xm = (x0 + x1) / 2;
    [-1, 1].forEach(s => b.box(L, 0.075, 0.045, P.frame, { x: xm, y: y - 0.095, z: s * (w / 2 + 0.025), top: P.frameT }));
    for (let i = 0; i < n; i++) b.cyl(r, r, w, 8, P.steelL, { rx: PI / 2, x: x0 + (i + 0.5) * L / n, y: y - r, z: -w / 2, top: P.steelD });
    (legs || []).forEach(x => [-1, 1].forEach(s => leg(b, x, s * (w / 2 + 0.025), y - 0.155, 0.045)));
  }
  /* Bedienkasten, Vorderseite +z (vor dem Drehen): Bildschirm, Taster, Not-Aus */
  function ctrlBox(b, o) {
    b.at({ x: o.x, y: o.y, z: o.z, ry: o.ry || 0 }, m => {
      const w = o.w || 0.26, h = o.h || 0.22;
      m.box(w, h, 0.09, P.cab, { top: P.cabD });
      m.box(w * 0.56, h * 0.3, 0.012, o.scr || P.screen, { x: -w * 0.14, y: h * 0.56, z: 0.045 });
      m.cyl(0.02, 0.02, 0.018, 8, P.green, { rx: PI / 2, x: w * 0.3, y: h * 0.7, z: 0.045 });
      m.cyl(0.02, 0.02, 0.018, 8, P.red, { rx: PI / 2, x: w * 0.3, y: h * 0.4, z: 0.045 });
      m.box(0.075, 0.075, 0.008, P.warnY, { x: -w * 0.27, y: h * 0.1, z: 0.045 });
      m.cyl(0.025, 0.03, 0.035, 8, P.red, { rx: PI / 2, x: -w * 0.27, y: h * 0.1 + 0.037, z: 0.05 });
    });
  }
  /* Signalleuchte: Mast mit Fuß; der Kopf ist ein eigenes Teil (Farbe je Zustand) */
  function lampPole(b, x, y, z, h) {
    b.cyl(0.04, 0.045, 0.03, 8, P.frame, { x, y, z });
    b.cyl(0.014, 0.014, h, 6, P.steelD, { x, y: y + 0.03, z });
    return [x, y + 0.03 + h, z];
  }
  const LAMP_C = { g: 0x52e07a, a: 0xffb52e, r: 0xff4b3a, o: 0x5d6267 };
  function lampHead(k) {
    const b = new MB(), c = LAMP_C[k] || LAMP_C.o;
    b.cyl(0.055, 0.055, 0.11, 8, c, { top: mix(c, 0xffffff, 0.35) });
    b.cyl(0.06, 0.06, 0.02, 8, P.frame, { y: 0.11 });
    return b;
  }
  /* Warnstreifen (gelb/schwarz) auf einer +z-Fläche */
  function stripes(b, w, h, x, y, z) {
    const n = Math.max(3, Math.round(w / 0.07));
    for (let i = 0; i < n; i++) b.box(w / n, h, 0.006, i % 2 ? P.warnK : P.warnY, { x: x - w / 2 + (i + 0.5) * w / n, y, z });
  }
  /* Europalette (Länge w entlang x, Breite d), Höhe 0,12 */
  const PAL = { block: 0xc49a64, board: 0xd6ae76, board2: 0xcca46c, end: 0xe2c08c };
  function pallet(b, w, d, o) {
    o = o || {};
    const bx = [-w / 2 + 0.05, 0, w / 2 - 0.05], bz = [-d / 2 + 0.05, 0, d / 2 - 0.05];
    if (!o.noBase) {
      bz.forEach(z => b.box(w, 0.018, 0.09, PAL.board2, { z, left: PAL.end, right: PAL.end }));
      bx.forEach(x => bz.forEach(z => b.box(0.09, 0.07, 0.09, PAL.block, { x, y: 0.018, top: PAL.end })));
      bx.forEach(x => b.box(0.09, 0.018, d, PAL.board2, { x, y: 0.088, front: PAL.end, back: PAL.end }));
    }
    if (!o.noDeck) for (let i = 0; i < 5; i++) b.box(w, 0.016, 0.095, i % 2 ? PAL.board : PAL.board2, { y: 0.106, z: -d / 2 + 0.0475 + i * (d - 0.095) / 4, left: PAL.end, right: PAL.end });
  }
  const PAL_H = 0.122;
  /* Gitterbox (Drahtkorb) w × d × h */
  function gitterbox(b, w, d, h) {
    const c = 0xa8b2b9, cD = 0x7e8a92, y0 = 0.06;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => b.box(0.04, h + 0.06, 0.04, cD, { x: sx * (w / 2 - 0.02), y: y0, z: sz * (d / 2 - 0.02) }));
    b.box(w, 0.04, d, cD, { y: y0 + 0.04 });
    [0.06 + h * 0.5, 0.06 + h].forEach((y, k) => {
      b.box(w, 0.025, 0.025, c, { y: y0 + y, z: d / 2 - 0.0125 });
      b.box(w, 0.025, 0.025, c, { y: y0 + y, z: -d / 2 + 0.0125 });
      b.box(0.025, 0.025, d, c, { y: y0 + y, x: w / 2 - 0.0125 });
      b.box(0.025, 0.025, d, c, { y: y0 + y, x: -w / 2 + 0.0125 });
    });
    const nx = Math.round(w / 0.09), nz = Math.round(d / 0.09);
    for (let i = 1; i < nx; i++) { const x = -w / 2 + i * w / nx; b.box(0.012, h, 0.012, c, { x, y: y0 + 0.08, z: d / 2 - 0.012 }); b.box(0.012, h, 0.012, c, { x, y: y0 + 0.08, z: -d / 2 + 0.012 }); }
    for (let i = 1; i < nz; i++) { const z = -d / 2 + i * d / nz; b.box(0.012, h, 0.012, c, { z, y: y0 + 0.08, x: w / 2 - 0.012 }); b.box(0.012, h, 0.012, c, { z, y: y0 + 0.08, x: -w / 2 + 0.012 }); }
  }

  /* ------------------------------- Werkstücke -------------------------------
     Niedrige Polygonzahl (Dutzende bis wenige Hundert Dreiecke), aber mit dem,
     was man aus der Spielkamera sieht: Rinde je Holzart, helle Stirnseiten mit
     Jahresring, sägeraue gegen gehobelte Oberflächen.                        */
  /* Hirnholz an einer Stirnseite (Achse x, dir ±1) */
  function capX(b, x, dir, r, y, z, sp) {
    const w = WT()[sp] || WT().kiefer, k = BK()[sp] || BK().kiefer, rz = dir > 0 ? -PI / 2 : PI / 2;
    const d = (rr, t, c) => b.cyl(rr, rr, t, 9, c, { rz, x, y, z, nobot: true, top: c });
    d(r * 0.98, 0.003, k.rim); d(r * 0.86, 0.006, w.hirn); d(r * 0.6, 0.009, w.ring); d(r * 0.54, 0.012, mix(w.hirn, w.core, 0.35)); d(r * 0.18, 0.015, w.core);
  }
  function capY(b, y, r, sp, x, z) {
    const w = WT()[sp] || WT().kiefer, k = BK()[sp] || BK().kiefer;
    const d = (rr, t, c) => b.cyl(rr, rr, t, 9, c, { x: x || 0, y, z: z || 0, nobot: true, top: c });
    d(r * 0.98, 0.003, k.rim); d(r * 0.86, 0.006, w.hirn); d(r * 0.6, 0.009, w.ring); d(r * 0.54, 0.012, mix(w.hirn, w.core, 0.35)); d(r * 0.18, 0.015, w.core);
  }
  /* Stamm entlang x von 0 bis 1 (über sx auf Länge skaliert), unten auf y = 0 */
  function logUnit(sp, r) {
    const b = new MB(), k = BK()[sp] || BK().kiefer;
    b.cyl(r, r, 1, 10, k.a, { rz: -PI / 2, y: r, stripe: k.b, notop: true, nobot: true });
    if (sp === "birke") for (let i = 0; i < 6; i++) b.box(0.05, 0.01, 0.035, k.mark, { x: 0.1 + i * 0.15, y: r * 2 - 0.004, z: (hs(i, 3) - 0.5) * r });
    capX(b, 1, 1, r, r, 0, sp); capX(b, 0, -1, r, r, 0, sp);
    return b;
  }
  /* aufgetrennter Stamm entlang x von 0 bis 1: Bretter übereinander, seitlich die Schwarten mit Rinde */
  function cutUnit(sp, r) {
    const b = new MB(), w = WT()[sp] || WT().kiefer, k = BK()[sp] || BK().kiefer, n = 4, H = r * 1.5, h = H / n, wd = r * 1.45;
    for (let i = 0; i < n; i++) b.box(1, h - 0.008, wd, i % 2 ? w.a : w.b, { x: 0.5, y: r - H / 2 + i * h, top: mix(w.a, 0xffffff, 0.12), left: w.hirn, right: w.hirn });
    [-1, 1].forEach(s => {
      b.box(1, H * 0.86, r * 0.2, k.b, { x: 0.5, y: r - H * 0.43, z: s * (wd / 2 + r * 0.11), top: k.a, left: w.hirn, right: w.hirn, front: k.a, back: k.a });
    });
    return b;
  }
  /* Brett/Kantholz entlang x von 0 bis 1 (für Schnittkanten-Wechsel) */
  function plankUnit(C, wd, t, rough) {
    const b = new MB();
    b.box(1, t, wd, C.a, { x: 0.5, top: C.top, left: C.end, right: C.end, front: C.b, back: C.b });
    if (rough) for (let i = 0; i < 5; i++) b.box(0.012, 0.002, wd * 0.98, shd(C.top, 0.9), { x: 0.1 + i * 0.2, y: t });
    return b;
  }
  /* Brett mit Mitte bei x = 0 */
  function board(b, l, wd, t, C, o) {
    o = o || {};
    b.box(l, t, wd, o.c || C.a, { x: o.x || 0, y: o.y || 0, z: o.z || 0, ry: o.ry || 0, rz: o.rz || 0, top: C.top, left: C.end, right: C.end, front: C.b, back: C.b });
  }
  /* aufrechte Stammscheibe (Rolle) */
  function roundUp(b, sp, r, h, x, z) {
    const k = BK()[sp] || BK().kiefer;
    b.cyl(r, r, h, 10, k.a, { x: x || 0, z: z || 0, stripe: k.b, notop: true, nobot: true });
    capY(b, h, r, sp, x, z);
  }
  /* Viertel einer aufrechten Rolle (Winkel 0 … π/2 in der xz-Ebene) */
  function quarter(sp, r, h) {
    const b = new MB(), w = WT()[sp] || WT().kiefer, k = BK()[sp] || BK().kiefer, n = 4, A = [];
    for (let i = 0; i <= n; i++) { const a = i / n * PI / 2; A.push([Math.cos(a) * r, Math.sin(a) * r]); }
    for (let i = 0; i < n; i++) { const p = A[i], q = A[i + 1]; b.quad([p[0], 0, p[1]], [p[0], h, p[1]], [q[0], h, q[1]], [q[0], 0, q[1]], i % 2 ? k.a : k.b); }
    b.quad([0, 0, 0], [0, h, 0], [r, h, 0], [r, 0, 0], w.a);
    b.quad([0, 0, 0], [0, 0, r], [0, h, r], [0, h, 0], w.b);
    const c = [0, h, 0];
    for (let i = 0; i < n; i++) {
      const p = A[i], q = A[i + 1], pi = [p[0] * 0.5, h, p[1] * 0.5], qi = [q[0] * 0.5, h, q[1] * 0.5], po = [p[0] * 0.9, h, p[1] * 0.9], qo = [q[0] * 0.9, h, q[1] * 0.9];
      b.tri(c, qi, pi, w.core);
      b.quad(pi, qi, qo, po, w.hirn);
      b.quad(po, qo, [q[0], h, q[1]], [p[0], h, p[1]], k.rim);
    }
    return b;
  }
  /* Scheit liegend (Dreiecksprisma mit Rinde oben), Länge l entlang x */
  function split(b, sp, l, r, o) {
    const k = BK()[sp] || BK().kiefer, w = WT()[sp] || WT().kiefer;
    b.at(o, m => m.cyl(r, r, l, 3, w.a, { rz: -PI / 2, x: -l / 2, y: r * 0.5, stripe: k.a, top: w.hirn, a0: PI / 6 }));
  }
  /* Ästebündel entlang x, Mitte 0 */
  function branches(b, l) {
    const k = BK().ast;
    for (let i = 0; i < 7; i++) b.cyl(0.03, 0.022, l, 5, i % 2 ? k.a : k.b, { rz: -PI / 2, x: -l / 2, y: 0.03 + Math.floor(i / 4) * 0.05, z: (i % 4 - 1.5) * 0.06 + (hs(i, 2) - 0.5) * 0.02, top: 0xd8c09a });
    b.box(0.03, 0.12, 0.26, 0xc8a46e, { x: -l * 0.25 }); b.box(0.03, 0.12, 0.26, 0xc8a46e, { x: l * 0.25 });
  }
  /* Stapellatten quer (Abstandshalter) */
  function battens(b, l, wd, y, xs) { (xs || [-l * 0.35, l * 0.35]).forEach(x => b.box(0.04, 0.025, wd, 0x8f6a42, { x, y })); }
  function stamp(b, x, y, z) { b.box(0.05, 0.03, 0.004, 0x2f6fb0, { x, y, z }); }
  /* Möbelteil: Stuhl (wie das Lagerbildchen), Schatulle, Tür, Zaunfeld, Kiste */
  function chair(b, C) {
    [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]].forEach(([x, z]) => b.box(0.035, 0.26, 0.035, C.b, { x, z }));
    b.box(0.28, 0.03, 0.28, C.a, { y: 0.26, top: C.top });
    b.box(0.28, 0.24, 0.03, C.a, { y: 0.29, z: -0.125, top: C.top });
    [0.08, 0.17].forEach(y => b.box(0.24, 0.025, 0.02, C.b, { y: 0.29 + y, z: -0.108 }));
  }
  function chest(b) {
    const C = WD.cherry;
    b.box(0.26, 0.12, 0.17, C.a, { top: C.top });
    b.cyl(0.085, 0.085, 0.26, 8, C.b, { rz: -PI / 2, x: -0.13, y: 0.12, sz: 1, top: C.top });
    b.box(0.265, 0.018, 0.175, P.brass, { y: 0.115 });
    b.box(0.04, 0.05, 0.012, P.brass, { y: 0.09, z: 0.088 });
  }
  function door(b, flat) {
    const C = WD.oak, inset = mix(C.a, 0x000000, 0.12);
    if (flat) {
      b.box(0.95, 0.05, 0.44, C.a, { top: C.top, left: C.end, right: C.end });
      [-0.22, 0.22].forEach(x => b.box(0.34, 0.006, 0.3, inset, { x, y: 0.05 }));
      b.cyl(0.018, 0.018, 0.02, 6, P.brass, { x: 0.05, y: 0.05, z: 0.17 });
    } else {
      b.box(0.05, 0.95, 0.44, C.a, { right: C.top, left: C.b, top: C.end });
      [0.25, 0.68].forEach(y => b.box(0.006, 0.3, 0.32, inset, { x: 0.026, y }));
      b.cyl(0.018, 0.018, 0.03, 6, P.brass, { rz: -PI / 2, x: 0.025, y: 0.48, z: 0.16 });
    }
  }
  function fence(b) {
    const C = WD.pln;
    [-0.15, 0.15].forEach(z => b.box(0.95, 0.025, 0.06, C.b, { z, top: C.a }));
    for (let i = 0; i < 7; i++) {
      const x = -0.42 + i * 0.14;
      b.box(0.09, 0.022, 0.42, C.a, { x, y: 0.025, top: C.top, z: -0.02 });
      b.cyl(0.064, 0.0, 0.07, 4, C.a, { rx: PI / 2, x, y: 0.036, z: 0.19, a0: PI / 4, sz: 0.25, sx: 1 });
    }
  }
  /* Zaunfeld aufrecht (Latten senkrecht, Riegel entlang z) – zum Anlehnen ans Gestell */
  function fenceUp(b) {
    const C = WD.pln;
    [0.1, 0.3].forEach(y => b.box(0.025, 0.06, 0.95, C.b, { x: -0.02, y, front: C.a, back: C.a }));
    for (let i = 0; i < 7; i++) {
      const z = -0.42 + i * 0.14;
      b.box(0.022, 0.4, 0.09, C.a, { y: 0.0, z, left: C.top, right: C.top });
      b.cyl(0.064, 0.0, 0.07, 4, C.a, { y: 0.4, z, a0: PI / 4, sx: 0.25 });
    }
  }
  function crate(b) {
    const C = WD.raw;
    b.box(0.4, 0.26, 0.3, C.b, { top: shd(C.b, 0.7) });
    for (let i = 0; i < 3; i++) b.box(0.41, 0.06, 0.31, C.a, { y: 0.02 + i * 0.09, top: C.top });
    b.box(0.36, 0.005, 0.26, 0x6a4a2a, { y: 0.262 });
  }
  function post(b, l, s, C, o) {
    b.at(o || {}, m => {
      m.box(l - 0.12, s, s, C.a, { x: -0.06, top: C.top, left: C.end, front: C.b, back: C.b });
      m.cyl(s * 0.7, 0, 0.12, 4, C.a, { rz: -PI / 2, x: l / 2 - 0.12, y: s / 2, a0: PI / 4 });
    });
  }
  /* Haufen Brennholz (Scheite kreuz und quer), Füllhöhe lv 0…1 in w × d */
  function woodHeap(b, sp, w, d, lv, seed) {
    const n = Math.round(4 + lv * 22);
    for (let i = 0; i < n; i++) {
      const u = hs(i, seed || 1), v = hs(i + 7, seed || 1), layer = Math.floor(i / 6);
      const y = 0.02 + layer * 0.07 * (0.6 + lv * 0.6);
      split(b, sp, 0.3, 0.07, { x: (u - 0.5) * (w - 0.3), y, z: (v - 0.5) * (d - 0.2), ry: (hs(i, 11) - 0.5) * 2.4 });
    }
  }
  function offcuts(b, w, d, n, seed) {
    for (let i = 0; i < n; i++) { const C = i % 3 ? WD.raw : WD.blk; board(b, 0.14 + hs(i, seed) * 0.16, 0.12, 0.05, C, { x: (hs(i, 3) - 0.5) * (w - 0.25), y: Math.floor(i / 4) * 0.05, z: (hs(i, 5) - 0.5) * (d - 0.15), ry: hs(i, 9) * 3 }); }
  }

  /* Ladeeinheit je Ware: fn(b) baut eine Einheit um (0, 0, 0), h = Stapelhöhe, fp = Fläche [l, b] */
  const UNIT = {
    bretter:  { h: 0.12, fp: [1.0, 0.6], fn: b => { battens(b, 1.0, 0.6, 0); for (let L = 0; L < 2; L++) for (let i = 0; i < 3; i++) board(b, 1.0, 0.18, 0.042, WD.raw, { y: 0.025 + L * 0.046, z: (i - 1) * 0.19, c: (i + L) % 2 ? WD.raw.a : WD.raw.b }); } },
    dielen:   { h: 0.11, fp: [1.0, 0.6], fn: b => { battens(b, 1.0, 0.6, 0); for (let L = 0; L < 2; L++) for (let i = 0; i < 3; i++) { board(b, 1.0, 0.18, 0.038, WD.pln, { y: 0.025 + L * 0.042, z: (i - 1) * 0.19 }); b.box(1.0, 0.002, 0.008, shd(WD.pln.a, 0.82), { y: 0.025 + L * 0.042 + 0.038, z: (i - 1) * 0.19 + 0.05 }); } } },
    balken:   { h: 0.17, fp: [1.1, 0.4], fn: b => { battens(b, 1.1, 0.4, 0); [-0.085, 0.085].forEach(z => board(b, 1.1, 0.15, 0.145, WD.raw, { y: 0.025, z })); } },
    bauholz:  { h: 0.17, fp: [1.1, 0.4], fn: b => { battens(b, 1.1, 0.4, 0); [-0.085, 0.085].forEach(z => { board(b, 1.1, 0.15, 0.145, WD.dry, { y: 0.025, z }); stamp(b, 0.2, 0.08, z + 0.076); }); } },
    bohlen:   { h: 0.09, fp: [1.05, 0.6], fn: b => { battens(b, 1.05, 0.6, 0); [-0.14, 0.14].forEach(z => board(b, 1.05, 0.26, 0.065, WD.oak, { y: 0.025, z })); } },
    platten:  { h: 0.085, fp: [0.9, 0.6], fn: b => { battens(b, 0.9, 0.55, 0); for (let i = 0; i < 2; i++) { board(b, 0.88, 0.56, 0.03, WD.ply, { y: 0.025 + i * 0.031 }); b.box(0.881, 0.004, 0.561, shd(WD.ply.end, 0.85), { y: 0.025 + i * 0.031 + 0.013 }); } } },
    pfosten:  { h: 0.12, fp: [0.95, 0.4], fn: b => { battens(b, 0.95, 0.4, 0); [-0.12, 0, 0.12].forEach(z => post(b, 0.95, 0.1, WD.raw, { y: 0.025, z: z - 0.05 })); } },
    kisten:   { h: 0.27, fp: [0.42, 0.32], fn: b => crate(b) },
    paletten: { h: PAL_H + 0.004, fp: [0.86, 0.57], fn: b => pallet(b, 0.86, 0.57) },
    moebel:   { h: 0.56, fp: [0.3, 0.3], fn: b => chair(b, WD.beech), side: true },
    schatulle: { h: 0.21, fp: [0.27, 0.18], fn: b => chest(b), side: true },
    zaun:     { h: 0.055, fp: [0.95, 0.45], fn: b => fence(b) },
    tueren:   { h: 0.055, fp: [0.95, 0.44], fn: b => door(b, true) },
    brennholz: { h: 0.16, fp: [0.7, 0.5], fn: b => woodHeap(b, "birke", 0.7, 0.5, 0.4, 3) },
    kaminholz: { h: 0.16, fp: [0.7, 0.5], fn: b => woodHeap(b, "buche", 0.7, 0.5, 0.4, 5) },
    reste:    { h: 0.12, fp: [0.6, 0.4], fn: b => offcuts(b, 0.6, 0.4, 7, 2) },
    aeste:    { h: 0.12, fp: [1.0, 0.3], fn: b => branches(b, 1.0) }
  };
  /* Stämme als Einheit (liegend, entlang x) */
  LOG_IDS.forEach(id => { const sp = SPC[id], r = LOG_R[sp]; UNIT[id] = { h: r * 1.7, fp: [1.1, r * 2.2], fn: b => b.at({ x: -0.55, sx: 1.1 }, m => m.merge(logUnit(sp, r), {})) }; });
  const unitOf = id => UNIT[id] || UNIT.bretter;

  /* Stapel aus Einheiten ids in einer Fläche: mode "stack" (übereinander, Höhe bis maxH),
     "side" (nebeneinander entlang z, dann Reihen) */
  function stackMB(ids, o) {
    const b = new MB();
    G3.seed(7100 + ids.length);
    let y = o.y || 0, col = 0, k = 0;
    const maxH = o.maxH || 0.9;
    for (const id of ids) {
      const U = unitOf(id);
      if (o.mode === "side" || U.side) {
        const per = o.per || 2, i = k % per, row = Math.floor(k / per), sx = o.sx || 0.32, sz = o.sz || 0.34, lv = o.levels || [0];
        const L = lv[row % lv.length], c = Math.floor(row / lv.length);
        b.at({ x: (o.x || 0) + (c - (o.cols || 1) / 2 + 0.5) * sx, y: L, z: (o.z || 0) + (i - (per - 1) / 2) * sz, ry: o.ry || 0 }, m => U.fn(m));
        k++;
        continue;
      }
      if (y + U.h > maxH + (o.y || 0) && k) { col++; y = o.y || 0; }
      const jit = (hs(k, 7) - 0.5) * 0.04;
      b.at({ x: (o.x || 0) + col * (o.dx || 0) + jit, y, z: (o.z || 0) + col * (o.dz || 0), ry: (o.ry || 0) + (hs(k, 3) - 0.5) * 0.05 }, m => U.fn(m));
      y += U.h; k++;
    }
    return b;
  }

  /* ------------------------------ Maschinen ------------------------------- */
  const BODY = {}, PARTS = {}, SAMPLE = {};

  /* Holzspalter (2 × 2): mobiler Senkrechtspalter – Säule mit Hydraulikzylinder, Keil,
     Spalttisch, Motor mit Öltank, Steuerhebel, Fahrgestell; Gitterbox für die Scheite */
  const SP = { plate: [-0.48, -0.22], tableY: 0.24, crate: [0.52, 0.5, 0.74, 0.8], ramRest: 1.0, logH: 0.42 };
  BODY.spalter = (b, bare) => {
    const A = ACC.spalter, y0 = 0.06;
    if (!bare) pad(b, 1.9, 1.9);
    /* Fahrgestell: Rahmen aus Rechteckrohr, Achse mit zwei Rädern, Deichsel */
    [-0.62, 0.08].forEach(z => b.box(1.45, 0.07, 0.07, P.frame, { x: -0.18, y: y0 + 0.08, z, top: P.frameT }));
    [-0.85, -0.2, 0.45].forEach(x => b.box(0.07, 0.07, 0.7, P.frame, { x, y: y0 + 0.08, z: -0.27, top: P.frameT }));
    b.box(0.06, 0.04, 0.76, P.steelD, { x: 0.32, y: y0 + 0.13, z: -0.27 });
    [-0.7, 0.16].forEach(z => {
      b.cyl(0.15, 0.15, 0.08, 12, P.rubber, { rx: PI / 2, x: 0.32, y: y0 + 0.15, z: z - 0.04, top: P.rubberL });
      b.cyl(0.075, 0.075, 0.085, 8, P.steelL, { rx: PI / 2, x: 0.32, y: y0 + 0.15, z: z - 0.042, top: P.steel });
    });
    [-0.62, 0.08].forEach(z => rod(b, [-0.85, y0 + 0.11, z], [-0.98, y0 + 0.11, -0.27], 0.05, P.frame));
    b.cyl(0.04, 0.04, 0.03, 8, P.steelD, { x: -0.97, y: y0 + 0.09, z: -0.27 });
    leg(b, -0.85, -0.27, 0.08, 0.06);
    /* Spalttisch */
    b.box(0.5, 0.05, 0.46, P.steel, { x: SP.plate[0], y: y0 + 0.13, z: SP.plate[1] + 0.02, top: P.steelL });
    stripes(b, 0.5, 0.03, SP.plate[0], y0 + 0.14, SP.plate[1] + 0.252);
    /* Säule (I-Profil) hinter dem Tisch, oben die Zylinderbrücke */
    const cx = SP.plate[0], cz = -0.56;
    b.box(0.08, 1.35, 0.1, P.frame, { x: cx, y: y0 + 0.13, z: cz });
    [-0.05, 0.05].forEach(dz => b.box(0.2, 1.35, 0.025, P.frameT, { x: cx, y: y0 + 0.13, z: cz + dz }));
    b.box(0.3, 0.07, 0.42, A[1], { x: cx, y: y0 + 1.48, z: -0.4, top: A[0] });
    /* Hydraulikzylinder hängt über dem Tisch */
    b.cyl(0.075, 0.075, 0.44, 10, A[0], { x: cx, y: y0 + 1.04, z: SP.plate[1], top: A[1] });
    b.cyl(0.085, 0.085, 0.05, 10, P.steelD, { x: cx, y: y0 + 1.04, z: SP.plate[1] });
    b.cyl(0.085, 0.085, 0.05, 10, P.steelD, { x: cx, y: y0 + 1.42, z: SP.plate[1] });
    /* Führungsschienen an der Säule für den Keilschlitten */
    [-0.07, 0.07].forEach(dx => b.box(0.025, 0.95, 0.03, P.steelL, { x: cx + dx, y: y0 + 0.45, z: cz + 0.075 }));
    /* Motor + Hydraulikpumpe, Öltank */
    b.box(0.5, 0.36, 0.38, A[0], { x: 0.0, y: y0 + 0.15, z: -0.55, top: A[1] });
    b.box(0.01, 0.2, 0.28, P.dark, { x: 0.255, y: y0 + 0.22, z: -0.55 });
    for (let i = 0; i < 5; i++) b.box(0.012, 0.18, 0.02, P.frameT, { x: 0.26, y: y0 + 0.23, z: -0.66 + i * 0.055 });
    b.box(0.3, 0.12, 0.3, P.frame, { x: 0.0, y: y0 + 0.51, z: -0.55 });
    b.cyl(0.035, 0.035, 0.16, 6, P.steelD, { x: 0.12, y: y0 + 0.5, z: -0.66 });
    b.cyl(0.04, 0.04, 0.04, 8, P.red, { x: -0.1, y: y0 + 0.63, z: -0.5 });
    b.cyl(0.11, 0.11, 0.42, 10, A[0], { rz: -PI / 2, x: -0.3, y: y0 + 0.28, z: 0.0, top: A[1] });
    b.cyl(0.03, 0.03, 0.06, 6, P.frame, { x: -0.05, y: y0 + 0.38, z: 0.0 });
    /* Steuerblock mit zwei Hebeln (Zweihandbedienung), rote Griffe */
    b.box(0.14, 0.1, 0.1, P.frame, { x: -0.18, y: y0 + 0.68, z: -0.02 });
    [-0.22, -0.14].forEach(x => { rod(b, [x, y0 + 0.76, -0.02], [x + 0.02, y0 + 0.98, 0.1], 0.012, P.steelL, 6); b.cyl(0.028, 0.028, 0.06, 8, P.red, { x: x + 0.02, y: y0 + 0.97, z: 0.1 }); });
    rod(b, [-0.18, y0 + 0.13, -0.02], [-0.18, y0 + 0.68, -0.02], 0.03, P.frame);
    /* Hydraulikschläuche: Pumpe → Steuerblock → Zylinder */
    tube(b, [[0.0, y0 + 0.5, -0.38], [-0.08, y0 + 0.75, -0.2], [-0.18, y0 + 0.78, -0.05]], 0.018, P.hose, P.hoseL);
    tube(b, [[-0.2, y0 + 0.78, -0.07], [-0.35, y0 + 1.25, -0.3], [cx + 0.08, y0 + 1.46, SP.plate[1] - 0.05]], 0.018, P.hose, P.hoseL);
    tube(b, [[-0.16, y0 + 0.78, -0.07], [-0.3, y0 + 1.1, -0.32], [cx + 0.08, y0 + 1.06, SP.plate[1] - 0.06]], 0.018, P.hose, P.hoseL);
    /* Signalleuchte auf der Zylinderbrücke */
    lampPole(b, cx + 0.1, y0 + 1.55, -0.55, 0.12);
    /* Gitterbox für die Scheite */
    b.at({ x: SP.crate[0], z: SP.crate[1] }, m => gitterbox(m, SP.crate[2], SP.crate[3], 0.46));
  };
  PARTS.spalter = [
    { k: "ram", at: { x: SP.plate[0], y: SP.ramRest, z: SP.plate[1] }, fn: () => {
      const b = new MB();
      b.cyl(0.032, 0.032, 0.5, 8, P.steelL, { y: 0.16, top: P.steelL });                     /* Kolbenstange */
      b.box(0.2, 0.1, 0.14, P.frame, { y: 0.12, top: P.frameT });                             /* Keilschlitten */
      b.box(0.16, 0.08, 0.2, P.frame, { y: 0.13, z: -0.2 });                                 /* Führung zur Säule */
      /* Keil: Prisma mit Schneide unten (entlang x), poliert */
      const w = 0.2, t = 0.07, h = 0.13;
      b.quad([-w / 2, 0, 0], [-w / 2, h, t], [w / 2, h, t], [w / 2, 0, 0], P.steelL);
      b.quad([w / 2, 0, 0], [w / 2, h, -t], [-w / 2, h, -t], [-w / 2, 0, 0], P.steel);
      b.tri([-w / 2, 0, 0], [-w / 2, h, -t], [-w / 2, h, t], P.steelD);
      b.tri([w / 2, 0, 0], [w / 2, h, t], [w / 2, h, -t], P.steelD);
      return b;
    } },
    { k: "lamp", at: { x: SP.plate[0] + 0.1, y: 0.06 + 1.55 + 0.03 + 0.12, z: -0.55 }, fn: () => lampHead("o"), lamp: true }
  ];
  SAMPLE.spalter = b => roundUp(b, "birke", 0.15, SP.logH, SP.plate[0], SP.plate[1]);

  /* Hobelmaschine (3 × 2): Dickenhobel mit Rollentischen, Haube über der Hobelwelle,
     Handrad, gummierte Vorschubwalzen, Absaugung mit Filtersack; Paletten für Roh- und Hobelware */
  const HB = { y: 0.56, buf: [-1.0, -0.66], out: [1.0, 0.66], len: 0.95 };
  BODY.hobel = (b, bare) => {
    const A = ACC.hobel, y0 = 0.06;
    if (!bare) pad(b, 2.9, 1.9);
    b.box(1.04, 0.05, 0.88, P.frameD, { y: y0 });
    b.box(1.0, 0.41, 0.84, A[1], { y: y0 + 0.05, top: A[0] });
    [-0.25, 0.25].forEach(x => b.box(0.4, 0.28, 0.012, shd(A[1], 0.9), { x, y: y0 + 0.12, z: 0.421 }));
    b.box(1.02, 0.04, 0.62, P.steel, { y: HB.y - 0.04, top: P.alu });
    /* Haube: Wangen, Block, runder Deckel über der Hobelwelle */
    [-0.34, 0.34].forEach(z => b.box(0.84, 0.32, 0.14, A[0], { y: HB.y, z, top: A[1] }));
    b.box(0.8, 0.29, 0.54, P.dark, { y: HB.y });
    b.box(0.84, 0.18, 0.82, A[0], { y: HB.y + 0.3, top: A[1] });
    b.cyl(0.2, 0.2, 0.8, 12, A[0], { rx: PI / 2, y: HB.y + 0.44, z: -0.4, top: A[1] });
    stripes(b, 0.84, 0.035, 0, HB.y + 0.3, 0.411);
    /* Handrad für die Dicke */
    b.cyl(0.03, 0.03, 0.08, 8, P.steelD, { x: 0.28, y: HB.y + 0.48, z: 0.24 });
    b.cyl(0.12, 0.12, 0.022, 14, P.steelL, { x: 0.28, y: HB.y + 0.55, z: 0.24, top: P.steel });
    b.cyl(0.09, 0.09, 0.024, 14, P.dark, { x: 0.28, y: HB.y + 0.551, z: 0.24 });
    [0, PI / 2].forEach(a => b.box(0.2, 0.014, 0.022, P.steelL, { x: 0.28, y: HB.y + 0.56, z: 0.24, ry: a + 0.4 }));
    b.cyl(0.03, 0.03, 0.03, 8, P.steel, { x: 0.28, y: HB.y + 0.56, z: 0.24 });
    b.cyl(0.018, 0.018, 0.09, 6, P.rubber, { x: 0.28 + 0.1, y: HB.y + 0.57, z: 0.24 + 0.04, top: P.rubberL });
    /* Lager der Vorschubwalzen */
    [-0.6, 0.6].forEach(x => [-0.23, 0.23].forEach(z => b.box(0.22, 0.05, 0.04, A[1], { x: x * 0.86, y: HB.y + 0.06, z })));
    /* Motor hinten mit Riemenschutz */
    b.cyl(0.13, 0.13, 0.32, 12, A[1], { rz: -PI / 2, x: -0.38, y: y0 + 0.2, z: -0.56, top: P.frame });
    for (let i = 0; i < 4; i++) b.box(0.3, 0.012, 0.012, shd(A[1], 0.8), { x: -0.22, y: y0 + 0.1 + i * 0.05, z: -0.69 });
    b.box(0.12, 0.34, 0.2, A[0], { x: 0.0, y: y0 + 0.05, z: -0.52, top: A[1] });
    /* Rollentische Zufuhr und Ausgabe */
    rollerBed(b, -1.42, -0.5, HB.y, 0.42, 5, [-1.36]);
    rollerBed(b, 0.5, 1.42, HB.y, 0.42, 5, [1.36]);
    /* Absaugung: Rohr aus der Haube, Gebläse, oben Filtersack, unten Spänesack */
    const ex = 1.02, ez = -0.68;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => rod(b, [ex + sx * 0.17, y0, ez + sz * 0.17], [ex + sx * 0.14, y0 + 0.62, ez + sz * 0.14], 0.025, P.frame));
    b.box(0.34, 0.03, 0.34, P.frame, { x: ex, y: y0 + 0.62, z: ez });
    b.cyl(0.19, 0.17, 0.42, 10, 0xb9b39a, { x: ex, y: y0 + 0.03, z: ez, stripe: 0xc4bea6, top: 0xcab98a });
    b.cyl(0.16, 0.16, 0.13, 10, A[0], { x: ex, y: y0 + 0.65, z: ez, top: A[1] });
    b.cyl(0.07, 0.07, 0.12, 8, A[1], { rz: -PI / 2, x: ex + 0.15, y: y0 + 0.72, z: ez });
    b.cyl(0.2, 0.2, 0.55, 10, P.cloth, { x: ex, y: y0 + 0.78, z: ez, stripe: P.clothD, notop: true });
    b.cyl(0.2, 0.06, 0.12, 10, P.cloth, { x: ex, y: y0 + 1.33, z: ez, top: P.clothD });
    [0.82, 1.32].forEach(y => b.cyl(0.205, 0.205, 0.025, 10, P.steelD, { x: ex, y: y0 + y, z: ez }));
    tube(b, [[0.05, HB.y + 0.6, -0.25], [0.05, HB.y + 0.82, -0.35], [0.6, HB.y + 0.8, -0.62], [ex - 0.16, y0 + 0.71, ez]], 0.055, P.hose, P.hoseL, 8);
    /* Bedienung und Signalleuchte */
    ctrlBox(b, { x: 0.22, y: y0 + 0.18, z: 0.465, w: 0.3, h: 0.24 });
    lampPole(b, -0.36, HB.y + 0.48, 0.28, 0.14);
    /* Paletten: Rohware hinten links, Hobelware vorn rechts */
    b.at({ x: HB.buf[0], y: y0, z: HB.buf[1] }, m => pallet(m, 0.86, 0.57));
    b.at({ x: HB.out[0], y: y0, z: HB.out[1] }, m => pallet(m, 0.86, 0.57));
  };
  PARTS.hobel = [
    { k: "w1", at: { x: -0.52, y: HB.y + 0.085, z: -0.2 }, fn: () => feedRoll(0.4), spin: "rz" },
    { k: "w2", at: { x: 0.52, y: HB.y + 0.085, z: -0.2 }, fn: () => feedRoll(0.4), spin: "rz" },
    { k: "lamp", at: { x: -0.36, y: HB.y + 0.48 + 0.03 + 0.14, z: 0.28 }, fn: () => lampHead("o"), lamp: true }
  ];
  function feedRoll(len) {
    const b = new MB();
    b.cyl(0.05, 0.05, len, 10, P.rubber, { rx: PI / 2, stripe: P.rubberL, top: P.steelD });
    return b;
  }
  SAMPLE.hobel = b => board(b, 0.95, 0.18, 0.042, WD.raw, { x: -0.55, y: HB.y });

  /* Schleifmaschine (3 × 2): Breitbandschleifer – Förderband durch ein Portal, im
     Fenster die laufenden Walzen des Schleifbands, Staubabsaugung mit zwei Säcken,
     Bedienpult mit Display; Rollwagen für die fertigen Teile */
  const SL = { y: 0.525, buf: [-1.12, -0.68], cart: [1.15, 0.68] };
  BODY.schleif = (b, bare) => {
    const A = ACC.schleif, y0 = 0.06;
    if (!bare) pad(b, 2.9, 1.9);
    /* Förderband */
    [-1, 1].forEach(s => b.box(2.84, 0.1, 0.05, P.frame, { y: 0.43, z: s * 0.335, top: P.frameT }));
    [-1.36, 1.36].forEach(x => [-1, 1].forEach(s => leg(b, x, s * 0.31, 0.37, 0.05)));
    b.box(2.8, 0.025, 0.62, P.rubber, { y: SL.y - 0.025, top: P.rubberL });
    [-1.4, 1.4].forEach(x => b.cyl(0.05, 0.05, 0.64, 10, P.steelL, { rx: PI / 2, x, y: SL.y - 0.045, z: -0.32, top: P.steel }));
    /* Portal: Unterbau, Pfosten, Oberteil mit Fenster */
    b.box(1.1, 0.36, 0.94, A[1], { y: y0, top: A[0] });
    [-1, 1].forEach(s => b.box(1.1, 0.25, 0.1, A[0], { y: 0.42, z: s * 0.42 }));
    b.box(1.02, 0.135, 0.74, P.dark, { y: SL.y });
    b.box(1.1, 0.62, 0.84, A[0], { y: 0.66, z: -0.05, top: A[1] });
    /* Vorderwand um das Fenster (Fenster x −0.42 … 0.18, y 0.8 … 1.16) */
    const fz = 0.37, fd = 0.1;
    b.box(0.13, 0.62, fd, A[0], { x: -0.485, y: 0.66, z: fz + fd / 2 - 0.0 });
    b.box(0.37, 0.62, fd, A[0], { x: 0.365, y: 0.66, z: fz + fd / 2 });
    b.box(0.6, 0.14, fd, A[0], { x: -0.12, y: 0.66, z: fz + fd / 2 });
    b.box(0.6, 0.12, fd, A[0], { x: -0.12, y: 1.16, z: fz + fd / 2, top: A[1] });
    b.box(0.6, 0.36, 0.01, 0x262b30, { x: -0.12, y: 0.8, z: fz + 0.005 });
    [[-0.42, 0.8, 0.012, 0.36], [0.18, 0.8, 0.012, 0.36]].forEach(([x, y, w, h]) => b.box(w, h, 0.012, P.steelL, { x, y, z: fz + fd }));
    b.box(0.612, 0.012, 0.012, P.steelL, { x: -0.12, y: 0.8, z: fz + fd }); b.box(0.612, 0.012, 0.012, P.steelL, { x: -0.12, y: 1.16, z: fz + fd });
    /* Schleifband zwischen den Walzen (Kornfarbe) */
    const d1 = [-0.27, 0.9], d2 = [0.04, 1.06], bc = 0x8c7656;
    rod(b, [d1[0] - 0.0, d1[1] + 0.085, fz + 0.035], [d2[0], d2[1] + 0.085, fz + 0.035], 0.02, bc);
    rod(b, [d1[0], d1[1] - 0.085, fz + 0.035], [d2[0], d2[1] - 0.085, fz + 0.035], 0.02, bc);
    b.box(1.1, 0.04, 0.95, A[1], { y: 1.28 });
    stripes(b, 1.1, 0.035, 0, 0.665, 0.48);
    /* Bedienpult rechts mit Display */
    ctrlBox(b, { x: 0.38, y: 0.86, z: 0.47, w: 0.28, h: 0.26 });
    /* Absaugstutzen und Schlauch zur Absaugung hinten rechts */
    [-0.3, 0.25].forEach(x => b.cyl(0.06, 0.06, 0.12, 8, P.steel, { x, y: 1.32, z: -0.2 }));
    tube(b, [[-0.3, 1.43, -0.2], [-0.3, 1.52, -0.32], [0.6, 1.45, -0.55], [0.95, 1.2, -0.72]], 0.05, P.hose, P.hoseL, 8);
    tube(b, [[0.25, 1.43, -0.2], [0.3, 1.5, -0.4], [0.7, 1.42, -0.62]], 0.045, P.hose, P.hoseL, 8);
    const dx = 1.08, dz = -0.72;
    b.box(0.6, 0.42, 0.4, A[1], { x: dx, y: y0, z: dz, top: A[0] });
    b.box(0.01, 0.2, 0.25, P.dark, { x: dx + 0.301, y: y0 + 0.1, z: dz });
    [-0.14, 0.14].forEach(o => { b.cyl(0.14, 0.14, 0.6, 10, P.cloth, { x: dx + o, y: y0 + 0.44, z: dz, stripe: P.clothD, notop: true }); b.cyl(0.14, 0.05, 0.1, 10, P.cloth, { x: dx + o, y: y0 + 1.04, z: dz, top: P.clothD }); b.cyl(0.145, 0.145, 0.03, 10, P.steelD, { x: dx + o, y: y0 + 0.44, z: dz }); });
    b.box(0.62, 0.04, 0.06, P.steelD, { x: dx, y: y0 + 1.06, z: dz });
    lampPole(b, -0.46, 1.32, 0.3, 0.13);
    /* Rollwagen für fertige Teile */
    const cx = SL.cart[0], cz = SL.cart[1];
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      b.box(0.025, 0.72, 0.025, P.steel, { x: cx + sx * 0.26, y: y0 + 0.08, z: cz + sz * 0.22 });
      b.cyl(0.035, 0.035, 0.03, 8, P.rubber, { rx: PI / 2, x: cx + sx * 0.26, y: y0 + 0.04, z: cz + sz * 0.22 - 0.015 });
    });
    [0.2, 0.52].forEach(y => b.box(0.55, 0.025, 0.47, 0xb98a56, { x: cx, y: y0 + y, z: cz, top: 0xc99a64 }));
    b.box(0.03, 0.03, 0.47, P.steelD, { x: cx - 0.3, y: y0 + 0.75, z: cz });
    /* Rohlinge hinten links */
    b.at({ x: SL.buf[0], y: y0, z: SL.buf[1] }, m => pallet(m, 0.62, 0.48));
  };
  PARTS.schleif = [
    { k: "dr1", at: { x: -0.27, y: 0.9, z: 0.4 }, fn: () => drum(0.085), spin: "rz" },
    { k: "dr2", at: { x: 0.04, y: 1.06, z: 0.4 }, fn: () => drum(0.085), spin: "rz" },
    { k: "belt", at: { x: 0, y: 0, z: 0 }, fn: () => { const b = new MB(); for (let i = 0; i < 10; i++) b.box(0.035, 0.008, 0.58, 0x4a4c52, { x: -1.26 + i * 0.28, y: SL.y }); return b; }, belt: 0.28 },
    { k: "lamp", at: { x: -0.46, y: 1.32 + 0.03 + 0.13, z: 0.3 }, fn: () => lampHead("o"), lamp: true }
  ];
  function drum(r) {
    const b = new MB();
    b.cyl(r, r, 0.07, 12, P.steel, { rx: PI / 2, z: -0.035, top: P.steelL });
    b.box(r * 1.8, 0.022, 0.012, P.dark, { y: -0.011, z: 0.036 });
    b.cyl(0.02, 0.02, 0.012, 6, P.red, { rx: PI / 2, z: 0.036 });
    return b;
  }
  SAMPLE.schleif = b => board(b, 0.5, 0.26, 0.05, WD.beech, { x: -0.8, y: SL.y });

  /* Fräse (3 × 2): CNC-Portalfräse – Maschinenbett mit Nutentisch, rotes Portal auf
     Linearführungen, Spindel mit Absaughaube, Energiekette, Schaltschrank mit Bildschirm;
     Ablagegestell für Türen und Zaunfelder */
  const FR = { bed: -0.15, y: 0.512, rack: [1.15, 0.52], buf: [-1.27, 0.05] };
  BODY.fraese = (b, bare) => {
    const A = ACC.fraese, y0 = 0.06;
    if (!bare) pad(b, 2.9, 1.9);
    b.box(1.75, 0.4, 1.1, P.frame, { x: FR.bed, y: y0, top: P.frameT });
    [-0.55, 0.0, 0.45].forEach(x => b.box(0.42, 0.26, 0.01, P.frameD, { x: FR.bed + x, y: y0 + 0.07, z: 0.551 }));
    b.box(1.62, 0.05, 0.96, P.aluD, { x: FR.bed, y: 0.46, top: P.alu });
    for (let i = 0; i < 7; i++) b.box(1.62, 0.003, 0.025, P.aluD, { x: FR.bed, y: 0.51, z: -0.39 + i * 0.13 });
    [-1, 1].forEach(s => { b.box(1.75, 0.08, 0.12, P.frame, { x: FR.bed, y: 0.38, z: s * 0.6, top: P.frameT }); b.box(1.75, 0.04, 0.05, P.steelL, { x: FR.bed, y: 0.46, z: s * 0.6 }); });
    /* Energiekette hinten */
    b.box(1.5, 0.04, 0.1, P.frameD, { x: FR.bed, y: 0.5, z: -0.74 });
    for (let i = 0; i < 12; i++) b.box(0.1, 0.05, 0.08, P.rubber, { x: FR.bed - 0.6 + i * 0.11, y: 0.54, z: -0.74 });
    /* Schaltschrank hinten rechts */
    const sx = 1.18, sz = -0.6;
    b.box(0.44, 1.26, 0.38, P.cab, { x: sx, y: y0, z: sz, top: P.cabD });
    b.box(0.01, 1.1, 0.3, P.cabD, { x: sx + 0.221, y: y0 + 0.08, z: sz });
    b.box(0.02, 0.18, 0.02, P.steelD, { x: sx + 0.23, y: y0 + 0.62, z: sz + 0.1 });
    for (let i = 0; i < 4; i++) b.box(0.3, 0.012, 0.005, P.cabD, { x: sx, y: y0 + 0.1 + i * 0.04, z: sz + 0.191 });
    b.box(0.34, 0.24, 0.012, P.frame, { x: sx, y: y0 + 0.86, z: sz + 0.19 });
    [-0.1, 0.0, 0.1].forEach((x, i) => b.cyl(0.018, 0.018, 0.015, 8, [P.green, P.warnY, P.red][i], { rx: PI / 2, x: sx + x, y: y0 + 0.74, z: sz + 0.19 }));
    tube(b, [[sx - 0.15, y0 + 1.26, sz], [sx - 0.5, y0 + 1.1, sz - 0.1], [FR.bed + 0.75, 0.6, -0.74]], 0.03, P.hose, P.hoseL);
    lampPole(b, sx + 0.12, y0 + 1.26, sz + 0.08, 0.14);
    /* Gestell für fertige Teile vorn rechts: Kufen und zwei Lehnen */
    const rx = FR.rack[0], rz = FR.rack[1];
    [-0.24, 0.24].forEach(dx => b.box(0.06, 0.06, 0.8, 0x8f6a42, { x: rx + dx, y: y0, z: rz }));
    [-0.34, 0.34].forEach(dz => { b.box(0.05, 0.95, 0.05, P.frame, { x: rx + 0.25, y: y0, z: rz + dz }); rod(b, [rx + 0.25, y0 + 0.5, rz + dz], [rx - 0.1, y0, rz + dz], 0.035, P.frame); });
    b.box(0.05, 0.05, 0.75, P.frame, { x: rx + 0.25, y: y0 + 0.92, z: rz });
    /* Ablage für Rohmaterial links */
    b.at({ x: FR.buf[0], y: y0, z: FR.buf[1], ry: PI / 2 }, m => pallet(m, 0.9, 0.36));
  };
  PARTS.fraese = [
    { k: "gx", at: { x: FR.bed, y: 0, z: 0 }, fn: () => {
      const A = ACC.fraese, b = new MB();
      [-1, 1].forEach(s => { b.box(0.24, 0.7, 0.07, A[0], { y: 0.48, z: s * 0.6, top: A[1] }); b.box(0.28, 0.06, 0.12, P.frame, { y: 0.48, z: s * 0.6 }); });
      b.box(0.26, 0.2, 1.34, A[0], { y: 1.17, top: A[1] });
      b.box(0.02, 0.04, 1.2, P.steelL, { x: 0.135, y: 1.25 });
      b.box(0.02, 0.04, 1.2, P.steelL, { x: 0.135, y: 1.2 });
      b.cyl(0.06, 0.06, 0.14, 8, P.frame, { rz: -PI / 2, x: -0.07, y: 1.27, z: 0.69, top: P.frameT });
      return b;
    } },
    { k: "hz", parent: "gx", at: { x: 0, y: 0, z: 0 }, fn: () => {
      const A = ACC.fraese, b = new MB();
      b.box(0.08, 0.3, 0.24, A[1], { x: 0.18, y: 1.0, top: A[0] });
      b.box(0.1, 0.12, 0.16, P.frame, { x: 0.25, y: 0.92 });
      b.cyl(0.075, 0.075, 0.28, 12, P.cab, { x: 0.3, y: 0.7, top: P.cabD });
      b.cyl(0.078, 0.078, 0.06, 12, P.frame, { x: 0.3, y: 0.98 });
      b.cyl(0.04, 0.025, 0.05, 8, P.steelL, { x: 0.3, y: 0.68 });
      b.cyl(0.1, 0.1, 0.06, 12, P.rubber, { x: 0.3, y: 0.63, notop: true });
      return b;
    } },
    { k: "bit", parent: "hz", at: { x: 0.3, y: 0.6, z: 0 }, fn: () => { const b = new MB(); b.cyl(0.013, 0.013, 0.09, 6, P.steelL, {}); b.box(0.03, 0.06, 0.006, P.steel, { y: 0.0 }); return b; }, spin: "ry" },
    { k: "scr", at: { x: 1.18, y: 0.06 + 0.86 + 0.03, z: -0.6 + 0.197 }, fn: () => { const b = new MB(); b.box(0.28, 0.18, 0.006, 0x2f78b8, {}); b.box(0.2, 0.02, 0.008, 0x9ad4ff, { x: -0.03, y: 0.12 }); b.box(0.12, 0.02, 0.008, 0x9ad4ff, { x: -0.07, y: 0.07 }); return b; }, screen: true },
    { k: "lamp", at: { x: 1.3, y: 0.06 + 1.26 + 0.03 + 0.14, z: -0.52 }, fn: () => lampHead("o"), lamp: true }
  ];
  SAMPLE.fraese = b => board(b, 0.95, 0.44, 0.06, WD.oak, { x: FR.bed, y: FR.y });

  /* Verpackungsmaschine (3 × 2): Palettennagler – Spanntisch mit Anschlägen, orangefarbenes
     Portal mit Druckluftnagler, Kompressor mit Kessel; Zufuhr links, Palettenstapel rechts */
  const VP = { y: 0.45, buf: [-1.1, 0.02], out: [1.02, 0.0], comp: [-1.05, -0.74] };
  BODY.verpack = (b, bare) => {
    const A = ACC.verpack, y0 = 0.06;
    if (!bare) pad(b, 2.9, 1.9);
    /* Spanntisch */
    b.box(1.15, 0.05, 0.92, P.steel, { y: VP.y - 0.05, top: P.steelL });
    [[-0.52, -0.4], [0.52, -0.4], [-0.52, 0.4], [0.52, 0.4]].forEach(([x, z]) => leg(b, x, z, VP.y - 0.11, 0.06));
    b.box(1.0, 0.05, 0.05, P.frame, { y: 0.16, z: 0.4 }); b.box(1.0, 0.05, 0.05, P.frame, { y: 0.16, z: -0.4 });
    [[-0.47, -0.32], [0.47, -0.32], [-0.47, 0.32], [0.47, 0.32]].forEach(([x, z]) => { b.box(0.06, 0.07, 0.06, A[0], { x: x + Math.sign(x) * 0.03, y: VP.y, z: z + Math.sign(z) * 0.03 }); });
    stripes(b, 1.15, 0.03, 0, VP.y - 0.045, 0.461);
    /* Fahrschienen des Portals */
    [-1, 1].forEach(s => { b.box(1.4, 0.05, 0.06, P.steelL, { y: VP.y - 0.03, z: s * 0.62 }); [-0.68, 0.68].forEach(x => leg(b, x, s * 0.62, VP.y - 0.09, 0.06)); });
    /* Kompressor: liegender Kessel, Motor, Manometer, Schlauch zum Portal */
    const [kx, kz] = VP.comp;
    [[-0.18, -1], [0.18, -1]].forEach(([dx]) => b.box(0.06, 0.12, 0.26, P.frame, { x: kx + dx, y: y0, z: kz }));
    b.cyl(0.15, 0.15, 0.5, 12, P.red, { rz: -PI / 2, x: kx - 0.25, y: y0 + 0.27, z: kz, top: shd(P.red, 0.85) });
    [-1, 1].forEach(s => b.cyl(0.15, 0.07, 0.06, 12, P.red, { rz: -s * PI / 2, x: kx + s * 0.25, y: y0 + 0.27, z: kz }));
    b.box(0.26, 0.16, 0.2, P.frame, { x: kx - 0.05, y: y0 + 0.42, z: kz, top: P.frameT });
    b.cyl(0.07, 0.07, 0.1, 8, A[0], { rz: -PI / 2, x: kx + 0.08, y: y0 + 0.5, z: kz });
    b.cyl(0.05, 0.05, 0.02, 10, 0xf2f2ee, { rx: PI / 2, x: kx + 0.18, y: y0 + 0.47, z: kz + 0.1 });
    b.box(0.004, 0.035, 0.004, P.red, { x: kx + 0.19, y: y0 + 0.47, z: kz + 0.122, rz: -0.6 });
    tube(b, [[kx + 0.18, y0 + 0.42, kz + 0.05], [kx + 0.5, y0 + 0.5, kz + 0.15], [-0.68, VP.y + 0.05, -0.62]], 0.022, P.hose, 0xc4342a);
    lampPole(b, 0.68, VP.y + 0.02, -0.75, 0.3);
    /* Zufuhr- und Ausgabefläche (Kanthölzer am Boden) */
    [-0.25, 0.25].forEach(dz => b.box(0.62, 0.04, 0.07, 0x8f6a42, { x: VP.buf[0], y: y0, z: VP.buf[1] + dz }));
    b.at({ x: VP.out[0], y: y0, z: VP.out[1] }, m => [-0.25, 0.25].forEach(dz => m.box(0.6, 0.04, 0.07, 0x8f6a42, { z: dz })));
  };
  PARTS.verpack = [
    { k: "gx", at: { x: 0, y: 0, z: 0 }, fn: () => {
      const A = ACC.verpack, b = new MB();
      [-1, 1].forEach(s => { b.box(0.09, 0.66, 0.09, A[0], { y: VP.y + 0.02, z: s * 0.62, top: A[1] }); b.box(0.16, 0.06, 0.1, P.frame, { y: VP.y + 0.02, z: s * 0.62 }); });
      b.box(0.14, 0.13, 1.36, A[0], { y: VP.y + 0.66, top: A[1] });
      b.box(0.02, 0.03, 1.2, P.steelL, { x: 0.08, y: VP.y + 0.72 });
      return b;
    } },
    { k: "hz", parent: "gx", at: { x: 0, y: 0, z: 0 }, fn: () => {
      const A = ACC.verpack, b = new MB();
      b.box(0.12, 0.12, 0.14, P.frame, { x: 0.1, y: VP.y + 0.6, top: P.frameT });
      b.box(0.04, 0.3, 0.04, P.steelL, { x: 0.12, y: VP.y + 0.32 });
      b.box(0.08, 0.2, 0.09, P.rubber, { x: 0.13, y: VP.y + 0.28 });
      b.box(0.05, 0.16, 0.06, A[0], { x: 0.19, y: VP.y + 0.24, rz: 0.25 });
      b.cyl(0.018, 0.012, 0.08, 6, P.steelL, { x: 0.13, y: VP.y + 0.2 });
      tube(b, [[0.1, VP.y + 0.72, 0.0], [0.04, VP.y + 0.6, 0.06], [0.11, VP.y + 0.42, 0.04]], 0.012, P.hose);
      return b;
    } },
    { k: "lamp", at: { x: 0.68, y: VP.y + 0.02 + 0.03 + 0.3, z: -0.75 }, fn: () => lampHead("o"), lamp: true }
  ];
  SAMPLE.verpack = b => b.at({ y: VP.y }, m => pallet(m, 0.86, 0.57));

  /* Trockenkammer (4 × 3): isolierte Kammer aus Sandwichpaneelen, Flügeltor zur
     Ausgabeseite, Lüfter und Dampfabzug auf dem Dach, Schaltkasten mit Temperaturanzeige,
     Gleis mit Trockenwagen und gestapeltem Holz (mit Stapellatten) */
  const TK = { door: 0.75, dz: -0.05, dw: 1.1, dh: 1.48, cartOut: 1.38, cartIn: -0.75, waitAt: [1.42, -1.02], doneAt: [1.42, 1.0] };
  BODY.trocken = (b, bare) => {
    const A = ACC.trocken, y0 = 0.06;
    if (!bare) pad(b, 3.9, 2.9);
    const cx = -0.6, cz = -0.075, W = 2.7, D = 2.55, H = 1.85;
    b.box(W + 0.04, 0.1, D + 0.04, P.steelD, { x: cx, y: y0, z: cz });
    b.box(W, H, D, A[0], { x: cx, y: y0 + 0.1, z: cz, top: 0xd5dbdf });
    for (let i = 1; i < 9; i++) b.box(0.025, H - 0.02, 0.01, A[1], { x: cx - W / 2 + i * W / 9, y: y0 + 0.11, z: cz + D / 2 + 0.003 });
    for (let i = 1; i < 9; i++) { const z = cz - D / 2 + i * D / 9; if (Math.abs(z - TK.dz) > TK.dw / 2 + 0.08) b.box(0.01, H - 0.02, 0.025, A[1], { x: cx + W / 2 + 0.003, y: y0 + 0.11, z }); }
    b.box(W + 0.12, 0.07, D + 0.12, P.steel, { x: cx, y: y0 + 0.1 + H, z: cz, top: P.steelL });
    /* Toröffnung (dunkel) mit Stahlzarge */
    b.box(0.012, TK.dh, TK.dw, P.dark, { x: TK.door + 0.002, y: y0 + 0.1, z: TK.dz });
    b.box(0.05, TK.dh + 0.06, 0.06, P.steelD, { x: TK.door + 0.02, y: y0 + 0.1, z: TK.dz - TK.dw / 2 - 0.03 });
    b.box(0.05, TK.dh + 0.06, 0.06, P.steelD, { x: TK.door + 0.02, y: y0 + 0.1, z: TK.dz + TK.dw / 2 + 0.03 });
    b.box(0.05, 0.06, TK.dw + 0.12, P.steelD, { x: TK.door + 0.02, y: y0 + 0.1 + TK.dh, z: TK.dz });
    /* Gleis aus der Kammer heraus */
    [-0.26, 0.26].forEach(dz => b.box(1.25, 0.035, 0.045, P.steelL, { x: TK.door + 0.6, y: y0, z: TK.dz + dz }));
    for (let i = 0; i < 5; i++) b.box(0.07, 0.025, 0.7, 0x6f5a46, { x: TK.door + 0.12 + i * 0.27, y: y0, z: TK.dz });
    /* Dach: zwei Lüftergehäuse, Dampfabzug mit Regenhaube */
    const ry = y0 + 0.17 + H;
    [-1.45, -0.55].forEach(x => { b.cyl(0.3, 0.3, 0.2, 14, P.steel, { x, y: ry, z: -0.55, notop: true }); b.cyl(0.28, 0.28, 0.1, 14, P.dark, { x, y: ry, z: -0.55 }); [-0.12, 0, 0.12].forEach(d => b.box(0.56, 0.012, 0.012, P.steelL, { x, y: ry + 0.2, z: -0.55 + d })); });
    b.cyl(0.06, 0.06, 0.34, 8, P.steel, { x: 0.25, y: ry, z: 0.5 });
    b.cyl(0.13, 0.0, 0.08, 8, P.steelD, { x: 0.25, y: ry + 0.38, z: 0.5 });
    [0.25].forEach(x => rod(b, [x - 0.08, ry + 0.34, 0.5], [x - 0.08, ry + 0.39, 0.5], 0.01, P.steelD));
    /* Heizungsrohr zum Kessel (isoliert, silbern) */
    tube(b, [[cx - W / 2 - 0.02, y0 + 1.6, cz - 0.6], [cx - W / 2 - 0.12, y0 + 1.3, cz - 0.6], [cx - W / 2 - 0.12, y0 + 0.08, cz - 0.6]], 0.06, 0xc8cdd1, 0xb9bfc4, 8);
    /* Schaltkasten vorn mit Temperaturanzeige und Zeigerthermometer */
    const sx = 0.32, sy = y0 + 0.7, sz = cz + D / 2 + 0.07;
    b.box(0.44, 0.5, 0.12, P.cab, { x: sx, y: sy, z: sz - 0.0, top: P.cabD });
    b.box(0.26, 0.1, 0.01, 0x241a12, { x: sx - 0.04, y: sy + 0.34, z: sz + 0.061 });
    b.cyl(0.07, 0.07, 0.015, 12, 0xf2f2ee, { rx: PI / 2, x: sx - 0.07, y: sy + 0.17, z: sz + 0.06 });
    b.box(0.006, 0.06, 0.006, P.red, { x: sx - 0.07 + 0.02, y: sy + 0.17, z: sz + 0.077, rz: -0.8 });
    [0.1, 0.16].forEach(x => b.cyl(0.018, 0.018, 0.015, 8, x > 0.12 ? P.red : P.green, { rx: PI / 2, x: sx + x, y: sy + 0.17, z: sz + 0.06 }));
    lampPole(b, TK.door - 0.15, ry - 0.07, TK.dz + TK.dw / 2 + 0.25, 0.14);
    /* Lagerplätze am Boden (Kanthölzer) */
    [TK.waitAt, TK.doneAt].forEach(([x, z]) => [-0.2, 0.2].forEach(dz => b.box(0.9, 0.04, 0.07, 0x8f6a42, { x, y: y0, z: z + dz })));
  };
  function dryLeaf(s) {
    const A = ACC.trocken, b = new MB(), w = TK.dw / 2 - 0.01;
    b.box(0.06, TK.dh - 0.02, w, A[0], { x: 0.03, y: 0, z: s * w / 2, top: 0xd5dbdf });
    for (let i = 1; i < 3; i++) b.box(0.012, TK.dh - 0.04, 0.02, A[1], { x: 0.065, y: 0.01, z: s * i * w / 3 });
    b.box(0.03, 0.2, 0.03, P.steelD, { x: 0.075, y: 0.65, z: s * (w - 0.08) });
    [0.15, TK.dh - 0.25].forEach(y => b.box(0.04, 0.1, 0.05, P.steelD, { x: 0.02, y, z: s * 0.02 }));
    return b;
  }
  function fanBlades() { const b = new MB(); [0, PI / 2].forEach(a => b.box(0.48, 0.014, 0.09, 0x6a737a, { ry: a, rx: 0.25 })); b.cyl(0.05, 0.05, 0.04, 8, P.frame, { y: -0.02 }); return b; }
  function dryCart() {
    const b = new MB();
    b.box(1.12, 0.06, 0.62, P.frame, { y: 0.12, top: P.frameT });
    [[-0.42, -0.26], [0.42, -0.26], [-0.42, 0.26], [0.42, 0.26]].forEach(([x, z]) => b.cyl(0.055, 0.055, 0.05, 10, P.steelD, { rx: PI / 2, x, y: 0.095, z: z - 0.025 }));
    b.box(0.04, 0.3, 0.6, P.frame, { x: 0.58, y: 0.18 });
    return b;
  }
  /* Trockenstapel: 3 Lagen Kanthölzer, dazwischen Stapellatten */
  function dryStack(C, stamped) {
    const b = new MB();
    for (let L = 0; L < 3; L++) {
      const y = L * 0.17;
      battens(b, 1.0, 0.6, y, [-0.4, 0, 0.4]);
      [-0.19, 0, 0.19].forEach(z => { board(b, 1.0, 0.15, 0.14, C, { y: y + 0.025, z }); if (stamped) stamp(b, 0.25, y + 0.085, z + 0.076); });
    }
    return b;
  }
  PARTS.trocken = [
    { k: "dl", at: { x: TK.door, y: 0.16, z: TK.dz - TK.dw / 2 }, fn: () => dryLeaf(1) },
    { k: "dr", at: { x: TK.door, y: 0.16, z: TK.dz + TK.dw / 2 }, fn: () => dryLeaf(-1) },
    { k: "f1", at: { x: -1.45, y: 0.06 + 0.17 + 1.85 + 0.13, z: -0.55 }, fn: fanBlades, spin: "ry" },
    { k: "f2", at: { x: -0.55, y: 0.06 + 0.17 + 1.85 + 0.13, z: -0.55 }, fn: fanBlades, spin: "ry" },
    { k: "cart", at: { x: TK.cartOut, y: 0.06, z: TK.dz }, fn: dryCart },
    { k: "disp", at: { x: 0.28, y: 0.06 + 0.7 + 0.35, z: -0.075 + 2.55 / 2 + 0.07 + 0.067 }, fn: () => { const b = new MB(); b.box(0.24, 0.07, 0.006, 0xff8a2a, {}); [-0.07, -0.02, 0.03].forEach(x => b.box(0.03, 0.05, 0.007, 0xffd77d, { x, y: 0.01 })); return b; }, screen: true },
    { k: "lamp", at: { x: TK.door - 0.15, y: 0.06 + 0.17 + 1.85 - 0.07 + 0.03 + 0.14, z: TK.dz + TK.dw / 2 + 0.25 }, fn: () => lampHead("o"), lamp: true }
  ];
  SAMPLE.trocken = b => b.merge(dryStack(WD.dry, true), { x: TK.cartOut, y: 0.06 + 0.15 });

  /* Sägebock (2 × 2, auf dem Hof oder im Sägewerk): zwei Holzböcke in X-Form,
     Hackklotz mit Kettensäge, Kanister; Stämme und Ausbeute daneben */
  const BK2 = { y: 0.6, x0: -0.72, L: 1.45, block: [0.55, 0.58], out: [-0.45, 0.62], buf: [0.1, -0.68] };
  BODY.saegebock = (b, bare) => {
    if (!bare) b.noise(0.1, () => b.plate(1.9, 1.9, 0xc9b48a, { y0: 0.015 }));
    if (!bare) for (let i = 0; i < 14; i++) b.plate(0.08 + hs(i, 1) * 0.08, 0.05 + hs(i, 2) * 0.06, i % 2 ? 0xe9cfa0 : P.sawdust, { x: (hs(i, 3) - 0.5) * 1.3, z: (hs(i, 4) - 0.5) * 0.9, ry: hs(i, 5) * 3, y0: 0.02 });
    const C = FM.C;
    [-0.42, 0.42].forEach(x => {
      rod(b, [x, 0, -0.28], [x, 0.74, 0.2], 0.06, C.woodD);
      rod(b, [x, 0, 0.28], [x, 0.74, -0.2], 0.06, C.wood);
      b.box(0.08, 0.04, 0.08, 0x8a8a8a, { x, y: 0.44, z: 0 });
    });
    rod(b, [-0.42, 0.25, 0.08], [0.42, 0.25, 0.08], 0.05, C.woodD);
    rod(b, [-0.42, 0.25, -0.08], [0.42, 0.25, -0.08], 0.05, C.woodD);
    /* Hackklotz */
    roundUp(b, "eiche", 0.17, 0.32, BK2.block[0], BK2.block[1]);
    /* Kanister */
    b.box(0.16, 0.22, 0.09, P.red, { x: -0.72, z: 0.25, top: shd(P.red, 0.85) });
    b.box(0.08, 0.04, 0.03, P.red, { x: -0.72, y: 0.22, z: 0.25 });
    b.cyl(0.018, 0.018, 0.05, 6, P.warnY, { x: -0.67, y: 0.22, z: 0.25 });
  };
  function chainsaw() {
    const A = ACC.bock, b = new MB();
    b.box(0.2, 0.13, 0.11, A[0], { y: 0, top: A[1] });
    b.box(0.06, 0.04, 0.12, P.frame, { x: -0.13, y: 0.04 });
    rod(b, [-0.04, 0.13, -0.06], [-0.04, 0.2, 0.0], 0.018, P.frame);
    rod(b, [-0.04, 0.2, 0.0], [-0.04, 0.13, 0.06], 0.018, P.frame);
    b.box(0.42, 0.012, 0.055, P.steelL, { x: 0.3, y: 0.05 });
    b.box(0.42, 0.016, 0.006, P.dark, { x: 0.3, y: 0.048, z: 0.03 });
    b.box(0.42, 0.016, 0.006, P.dark, { x: 0.3, y: 0.048, z: -0.03 });
    b.cyl(0.028, 0.028, 0.016, 8, P.steelL, { x: 0.51, y: 0.048 });
    return b;
  }
  PARTS.saegebock = [{ k: "saw", at: { x: BK2.block[0] - 0.12, y: 0.335, z: BK2.block[1], ry: 0.4 }, fn: chainsaw }];
  SAMPLE.saegebock = b => b.at({ x: BK2.x0, y: BK2.y - 0.09, sx: BK2.L }, m => m.merge(logUnit("kiefer", 0.15), {}));

  /* --------------------------- Sägehalle (Gatter) ---------------------------
     Die Säge steht vorn in der offenen Halle (dort sieht man hinein). Der Zuführwagen
     bringt den Stamm auf dem Gleis von rechts bis vor die Säge, die Vorschubwalzen ziehen
     ihn hindurch auf den Rollentisch links; dort liegt er aufgetrennt (Bretter zwischen
     den Schwarten). Ein Querförderband trägt die Ware nach vorn zum Stapelplatz.
     Stufe 1 Gattersäge mit Schwungrad, Kurbel und Pleuel, Stufe 2 Blockbandsäge.  */
  /* Sichtbar ist aus der Spielkamera nur der vordere Streifen der Halle (z > ~1,4) – dort liegt die ganze Linie */
  const HL = { y: 0.18, z: 1.95, gx: 0.3, cartA: 3.55, cartStop: 1.5, band: -2.1, bandZ0: 1.4, bandZ1: 2.45, out: [-2.1, 2.72], deck: [3.9, 2.7], L: 1.6, logY: 0.26 };
  const HR = { kiefer: 0.22, birke: 0.2, buche: 0.23, eiche: 0.26, kirsche: 0.21 };
  /* Kurbeltrieb der Gattersäge: Kurbelwelle (Höhe cy, Radius r) oben am Schwungrad, das Pleuel (Länge L) hängt
     nach unten zum Ausleger am unteren Rahmenbalken – der läuft in der Grube unter dem Stamm */
  const GK = { cy: 0.625, r: 0.125, L: 0.65, fz: 0.82 };
  function hallInterior(b, m, lvl) {
    const saege = m & 4, band = m & 8, y0 = HL.y, A = ACC.gatter, rust = 0x7a5a44, Ly = y0 + HL.logY;
    /* Gleis des Zuführwagens (rechts der Säge) */
    for (let i = 0; i < 8; i++) b.box(0.1, 0.03, 0.9, 0x6a5444, { x: 0.95 + i * 0.47, y: y0, z: HL.z });
    [-0.3, 0.3].forEach(dz => b.box(3.5, 0.05, 0.05, saege ? P.steelL : 0x8a7a6a, { x: 2.6, y: y0 + 0.03, z: HL.z + dz }));
    b.box(0.12, 0.16, 0.8, P.warnY, { x: 0.8, y: y0 + 0.03, z: HL.z });
    stripes(b, 0.12, 0.12, 0.8, y0 + 0.05, HL.z + 0.405);
    /* Rollentisch hinter der Säge (links) */
    b.at({ z: HL.z }, m => rollerBed(m, -1.5, HL.gx - 0.33, Ly, 0.7, 8, [-1.42, -0.3]));
    if (saege && (lvl || 1) >= 2) {
      /* Blockbandsäge: Ständer links, untere Rolle in der Grube, obere über dem Stamm, Band dazwischen (vorn) */
      const gx = HL.gx, wz = HL.z + 0.45;
      b.box(0.26, 2.0, 0.34, A[0], { x: gx - 0.34, y: y0, z: wz, top: A[1] });
      b.box(0.5, 0.2, 0.6, P.concreteD, { x: gx - 0.3, y: y0, z: wz, top: P.concrete });
      b.box(0.24, 0.12, 0.12, A[1], { x: gx - 0.14, y: y0 + 1.19, z: wz });
      b.cyl(0.5, 0.5, 0.05, 18, A[1], { rz: PI / 2, x: gx - 0.1, y: y0 + 1.25, z: wz, top: A[0] });
      b.box(0.012, 0.66, 0.05, P.steelL, { x: gx, y: y0 + 0.14, z: HL.z });
      b.box(0.012, 0.66, 0.03, P.steelD, { x: gx, y: y0 + 0.14, z: wz + 0.45 });
      b.box(0.16, 0.12, 0.14, A[1], { x: gx, y: y0 + 0.82, z: HL.z - 0.02 });
      b.box(0.12, 0.08, 0.42, P.steelD, { x: gx - 0.05, y: y0 + 0.86, z: HL.z + 0.2 });
      stripes(b, 0.26, 0.05, gx - 0.34, y0 + 1.7, wz + 0.171);
      b.cyl(0.15, 0.15, 0.3, 12, A[1], { rz: PI / 2, x: gx - 0.47, y: y0 + 1.25, z: wz, top: P.frame });
      /* Vorschubwalzen vor der Säge */
      [[gx + 0.4, Ly - 0.06], [gx + 0.4, Ly + 0.62]].forEach(([x, y]) => b.cyl(0.06, 0.06, 0.8, 10, P.rubber, { rx: PI / 2, x, y, z: HL.z - 0.4, stripe: P.rubberL, top: P.steelD }));
      [-0.42, 0.42].forEach(dz => b.box(0.08, 0.8, 0.06, A[1], { x: gx + 0.4, y: y0 + 0.08, z: HL.z + dz }));
    } else {
      /* Gattersäge: zwei schwere Ständer, Querhaupt; das Schwungrad vorne treibt über Kurbel und Pleuel den Sägerahmen */
      const gx = HL.gx, fc = saege ? A[0] : rust, fd = saege ? A[1] : 0x5e4535;
      [HL.z - 0.6, HL.z + 0.6].forEach(z => { b.box(0.5, 0.22, 0.34, P.concreteD, { x: gx, y: y0, z, top: P.concrete }); b.box(0.28, 2.1, 0.24, fc, { x: gx, y: y0 + 0.22, z, top: fd }); });
      b.box(0.42, 0.32, 1.5, fc, { x: gx, y: y0 + 2.2, z: HL.z, top: fd });
      [HL.z - 0.5, HL.z + 0.5].forEach(z => b.box(0.05, 2.0, 0.05, P.steelL, { x: gx - 0.17, y: y0 + 0.2, z }));
      if (saege) {
        [[gx + 0.4, Ly - 0.06], [gx + 0.4, Ly + 0.62]].forEach(([x, y]) => b.cyl(0.07, 0.07, 0.9, 10, P.rubber, { rx: PI / 2, x, y, z: HL.z - 0.45, stripe: P.rubberL, top: P.steelD }));
        [-0.47, 0.47].forEach(dz => b.box(0.08, 0.84, 0.06, fd, { x: gx + 0.4, y: y0 + 0.08, z: HL.z + dz }));
        /* Lagerbock der Kurbelwelle vor dem Ständer */
        b.box(0.16, GK.cy + 0.02, 0.12, fd, { x: gx, y: y0, z: HL.z + 0.72 });
        b.cyl(0.05, 0.05, 0.12, 8, P.steelD, { rx: PI / 2, x: gx, y: y0 + GK.cy, z: HL.z + 0.7 });
      } else { b.box(0.03, 1.2, 0.2, 0x9a6a3a, { x: gx - 0.6, y: y0 + 0.05, z: HL.z + 0.4, rz: 1.3 }); b.box(0.03, 1.1, 0.2, 0x9a6a3a, { x: gx + 0.7, y: y0 + 0.05, z: HL.z - 0.3, rz: -1.35, ry: 0.4 }); }
    }
    /* Sägemehl unter und neben der Säge */
    for (let i = 0; i < 7; i++) b.ico(0.14 + hs(i, 8) * 0.1, P.sawdust, { x: HL.gx - 0.25 + (hs(i, 1) - 0.5) * 0.5, y: y0, z: HL.z - 0.55 + (hs(i, 2) - 0.5) * 0.25, flat: 0.28, jitter: 0.4 });
    /* Holzplatz für wartende Stämme (vorn rechts) */
    [-0.75, 0.75].forEach(dx => { b.box(0.1, 0.06, 0.5, 0x6f5a46, { x: HL.deck[0] + dx, y: y0, z: HL.deck[1] }); [-1, 1].forEach(s2 => b.box(0.08, 0.1, 0.06, 0x5a4636, { x: HL.deck[0] + dx, y: y0 + 0.06, z: HL.deck[1] + s2 * 0.24 })); });
    /* Querförderband nach vorn zum Stapelplatz */
    const bx = HL.band, z0 = HL.bandZ0, z1 = HL.bandZ1;
    [-1, 1].forEach(s2 => [z0 + 0.1, z1 - 0.1].forEach(z => b.box(0.06, 0.45, 0.06, P.frame, { x: bx + s2 * 0.38, y: y0, z })));
    if (band) {
      [-1, 1].forEach(s2 => b.box(0.05, 0.08, z1 - z0, P.frame, { x: bx + s2 * 0.38, y: y0 + 0.42, z: (z0 + z1) / 2, top: P.frameT }));
      b.box(0.72, 0.03, z1 - z0, P.rubber, { x: bx, y: y0 + 0.45, z: (z0 + z1) / 2, top: P.rubberL });
      [z0, z1].forEach(z => b.cyl(0.05, 0.05, 0.74, 10, P.steelL, { rz: -PI / 2, x: bx - 0.37, y: y0 + 0.43, z, top: P.steel }));
    } else {
      for (let i = 0; i < 3; i++) b.cyl(0.05, 0.05, 0.72, 6, 0x8a7a6a, { rz: -PI / 2, x: bx - 0.36 + hs(i, 4) * 0.2, y: y0 + 0.05, z: z0 + 0.15 + i * 0.35, ry: hs(i, 5) - 0.5 });
      b.box(0.72, 0.03, 0.6, P.rubber, { x: bx + 0.5, y: y0, z: z1 - 0.3, ry: 0.4 });
    }
    /* Stapelplatz am Bandende (Kanthölzer quer) */
    [-0.3, 0.3].forEach(dx => b.box(0.07, 0.05, 0.46, 0x6f5a46, { x: HL.out[0] + dx, y: y0, z: HL.out[1] }));
    /* Bedienstand mit Signalleuchte neben dem Gleis */
    if (saege) { b.box(0.06, 0.55, 0.06, P.frame, { x: HL.gx + 1.55, y: y0, z: HL.z + 0.62 }); ctrlBox(b, { x: HL.gx + 1.55, y: y0 + 0.55, z: HL.z + 0.65, w: 0.3, h: 0.26 }); lampPole(b, HL.gx + 1.42, y0 + 0.81, HL.z + 0.65, 0.12); }
  }
  /* Teile der Halle (nur wenn die Säge repariert ist) */
  function hallParts(lvl, m) {
    const y0 = HL.y, out = [];
    out.push({ k: "inner", key: "swk:hallin:" + m + ":" + (lvl || 1), at: { x: 0, y: 0, z: 0 }, fn: () => { const b = new MB(); hallInterior(b, m, lvl); return b; } });
    if ((lvl || 1) >= 2) {
      const wz = HL.z + 0.45;
      out.push({ k: "wh1", at: { x: HL.gx, y: y0 - 0.29, z: wz }, fn: () => bandWheel(), spin: "rx" });
      out.push({ k: "wh2", at: { x: HL.gx, y: y0 + 1.25, z: wz }, fn: () => bandWheel(), spin: "rx" });
    } else {
      out.push({ k: "fly", at: { x: HL.gx, y: y0 + GK.cy, z: HL.z + GK.fz }, fn: flywheel, spin: "rz" });
      out.push({ k: "frm", at: { x: HL.gx, y: y0, z: HL.z }, fn: gateFrame });
      out.push({ k: "rod", at: { x: HL.gx, y: y0 + GK.cy, z: HL.z + GK.fz + 0.08 }, fn: () => { const b = new MB(); b.box(0.06, GK.L, 0.04, P.steelD, {}); b.cyl(0.04, 0.04, 0.05, 8, P.steelL, { rx: PI / 2, z: -0.025 }); b.cyl(0.04, 0.04, 0.05, 8, P.steelL, { rx: PI / 2, y: GK.L, z: -0.025 }); return b; } });
    }
    out.push({ k: "cart", at: { x: HL.cartA, y: y0 + 0.08, z: HL.z }, fn: logCart });
    out.push({ k: "belt", at: { x: HL.band, y: y0 + 0.481, z: 0 }, fn: () => { const b = new MB(); for (let i = 0; i < 4; i++) b.box(0.66, 0.008, 0.035, 0x4a4c52, { z: HL.bandZ0 + 0.14 + i * 0.26 }); return b; }, belt: 0.26, beltAxis: "z" });
    out.push({ k: "lamp", at: { x: HL.gx + 1.42, y: y0 + 0.81 + 0.03 + 0.12, z: HL.z + 0.65 }, fn: () => lampHead("o"), lamp: true });
    return out;
  }
  function flywheel() {
    const A = ACC.gatter, b = new MB();
    /* Kranz als Ring (12 Segmente), dahinter dunkel, davor sechs helle Speichen */
    for (let i = 0; i < 12; i++) { const a = i * PI / 6; b.box(0.27, 0.08, 0.09, A[1], { x: Math.cos(a) * 0.46, y: Math.sin(a) * 0.46, z: -0.045, rz: a + PI / 2, top: A[0], front: A[0] }); }
    b.cyl(0.42, 0.42, 0.01, 18, P.dark, { rx: PI / 2, z: -0.05 });
    for (let i = 0; i < 6; i++) b.box(0.07, 0.42, 0.05, A[0], { rz: i * PI / 3, z: -0.025, front: mix(A[0], 0xffffff, 0.15) });
    b.cyl(0.09, 0.09, 0.12, 10, P.steel, { rx: PI / 2, z: -0.06 });
    b.box(0.08, GK.r + 0.08, 0.04, P.steelD, { y: -0.04, z: 0.04 });
    b.cyl(0.035, 0.035, 0.1, 8, P.steelL, { rx: PI / 2, y: GK.r, z: 0.03 });
    return b;
  }
  /* Sägerahmen mit sechs Blättern; unten der Querbalken (läuft in der Grube), Anlenkung oben rechts vorn */
  function gateFrame() {
    const b = new MB(), A = ACC.gatter, w = 0.9, h = 1.3;
    [-w / 2, w / 2].forEach(z => b.box(0.09, h, 0.07, P.steelD, { z }));
    b.box(0.12, 0.1, w + 0.07, P.steelD, { y: h }); b.box(0.12, 0.1, w + 0.07, P.steelD, { y: -0.05 });
    for (let i = 0; i < 5; i++) b.box(0.012, h - 0.02, 0.06, 0xe4ebef, { z: -0.32 + i * 0.16, y: 0.02 });
    b.box(0.08, 0.08, GK.fz + 0.12 - w / 2, P.steelD, { y: -0.04, z: (w / 2 + GK.fz + 0.12) / 2 });
    b.box(0.07, 0.12, 0.07, A[1], { y: -0.06, z: GK.fz + 0.08 });
    return b;
  }
  function bandWheel() {
    const b = new MB(), A = ACC.gatter;
    b.cyl(0.56, 0.56, 0.06, 18, P.steelD, { rz: -PI / 2, x: -0.03, top: P.steel });
    b.cyl(0.5, 0.5, 0.065, 18, P.dark, { rz: -PI / 2, x: -0.032 });
    for (let i = 0; i < 5; i++) b.box(0.07, 0.5, 0.05, A[0], { rx: i * 2 * PI / 5, x: 0.012 });
    b.cyl(0.08, 0.08, 0.1, 8, P.steelL, { rz: -PI / 2, x: -0.05 });
    return b;
  }
  /* Zuführwagen: Plattform auf vier Rädern, zwei Spannböcke hinten */
  function logCart() {
    const b = new MB(), A = ACC.gatter;
    b.box(1.5, 0.12, 0.74, P.frame, { y: 0.06, top: P.frameT });
    [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].forEach(([x, z]) => b.cyl(0.07, 0.07, 0.06, 10, P.steelD, { rx: PI / 2, x, y: 0.05, z: z - 0.03 }));
    [-0.5, 0.5].forEach(x => { b.box(0.1, 0.36, 0.12, A[1], { x, y: 0.18, z: -0.31 }); b.box(0.16, 0.06, 0.16, A[0], { x, y: 0.52, z: -0.28 }); });
    stripes(b, 1.5, 0.04, 0, 0.12, 0.371);
    return b;
  }

  /* ------------------------------- Gesamtmodell ------------------------------ */
  /* bare: ohne Fundament, mit Teilen in Ruhelage und einem Musterstück (Bildchen im Laden) */
  function body(t, bare) {
    G3.seed(4100 + t.length * 7);
    const b = new MB();
    if (BODY[t]) BODY[t](b, bare);
    if (bare) {
      (PARTS[t] || []).forEach(p => { if (!p.parent && !p.screen) { const at = Object.assign({}, p.at); b.merge(p.fn(), at); } });
      (PARTS[t] || []).filter(p => p.parent).forEach(p => { const par = PARTS[t].find(q => q.k === p.parent); b.merge(p.fn(), { x: par.at.x + p.at.x, y: par.at.y + p.at.y, z: par.at.z + p.at.z }); });
      if (SAMPLE[t]) SAMPLE[t](b);
    }
    return b;
  }
  function machine(t, bare) { return body(t, bare); }
  function saegebock(bare) { return body("saegebock", bare); }

  /* --------------------------------- Ablauf ---------------------------------- */
  const EXTRA = { spalter: 4, verpack: 5 };          /* zusätzliche Werkstückknoten (Viertel, Deckbretter) */
  const KINDS = new Set(["spalter", "hobel", "trocken", "verpack", "schleif", "fraese", "saegebock", "sw_halle"]);
  const MK = (key, fn) => typeof fmesh === "function" ? fmesh(key, fn) : null;
  /* Hauptzutat eines Rezepts (größte Menge, bei Gleichstand die erste) */
  function mainIn(r) { let id = null, n = -1; for (const k in (r && r.in) || {}) if (r.in[k] > n) { n = r.in[k]; id = k; } return id; }
  function st(o) {
    const q = o.q || [], job = q[0];
    const ok = typeof machReady === "function" ? machReady(o) : true;
    /* Störung: alles bleibt stehen, wo es ist (nach der Reparatur verschiebt das Spiel die Zeiten um die Ausfallzeit) */
    const now = o.broken ? Math.min(S.time, o.broken) : S.time;
    const f = job ? cl((now - job.start) / Math.max(1e-6, job.end - job.start)) : 0;
    const run = !!(job && job.start <= S.time && f < 1 && !o.broken && ok);
    const r = job && typeof recipeOf === "function" ? recipeOf(o, job.k) : null;
    const waitIn = q.slice(1).map(j => { const rr = typeof recipeOf === "function" ? recipeOf(o, j.k) : null; return rr ? Object.keys(rr.in) : []; });
    const done = []; (o.done || []).forEach(d => { if (!(FITEMS[d.r] && FITEMS[d.r].energy)) for (let i = 0; i < (d.n || 1); i++) done.push(d.r); });
    if (job && f >= 1 && !o.broken) for (let i = 0; i < (job.n || 1); i++) done.push(job.r);          /* fertig, nur noch nicht verbucht */
    return { job, f, run, r, inId: r ? mainIn(r) : null, ins: r ? Object.keys(r.in) : [], outId: job ? job.r : null, n: job ? job.n || 1 : 0, waitIn, done, broken: !!o.broken, ok };
  }
  /* Lampenzustand: grün läuft, gelb blinkt abholbereit, rot blinkt Störung, sonst aus */
  function lampState(s, time) {
    if (s.broken || !s.ok) return Math.sin(time * 6) > 0 ? "r" : "o";
    if (s.run) return "g";
    if (s.done.length) return Math.sin(time * 3) > -0.2 ? "a" : "o";
    return "o";
  }
  /* Partikel an einer lokalen Stelle der Maschine (Drehung des Objekts beachtet) */
  function emitAt(E, lx, ly, lz, p) {
    const R = FV.R, c = Math.cos(E.root.ry), s = Math.sin(E.root.ry);
    const vx = p.vx || 0, vz = p.vz || 0;
    R.emit(Object.assign({}, p, { x: E.root.x + c * lx + s * lz, y: ly, z: E.root.z - s * lx + c * lz, vx: c * vx + s * vz, vz: -s * vx + c * vz }));
  }
  const CHIP = (c) => ({ vy: 1.0, g: -4, life: 0.7, size: 0.04, col: c || [0.95, 0.84, 0.6, 1], shape: 1 });
  /* Knoten setzen */
  function setNode(n, x, y, z, o) { n.x = x; n.y = y; n.z = z; if (o) { n.rx = o.rx || 0; n.ry = o.ry || 0; n.rz = o.rz || 0; } }
  function arc(a, b, t, h) { const e = ease(t); return [lerp(a[0], b[0], e), lerp(a[1], b[1], e) + Math.sin(PI * t) * h, lerp(a[2], b[2], e)]; }
  function setMesh(n, key, fn) { if (n.key !== key) { n.key = key; n.mesh = key ? MK(key, fn) : null; } n.visible = !!key; }

  function attach(o, root, parts, ghost) {
    if (!KINDS.has(o.t) || typeof FV === "undefined" || !FV.R) return;
    const R = FV.R;
    let defs = PARTS[o.t] || [];
    if (o.t === "sw_halle") {
      if (!(typeof sawMask === "function" && sawMask() & 4)) return;
      defs = hallParts(o.lvl || 1, sawMask());
    }
    const N = {};
    defs.forEach(p => {
      const key = p.key || "swk:" + o.t + ":" + p.k + (o.t === "sw_halle" ? ":" + (o.lvl || 1) : "");
      const mesh = p.lamp ? MK("swk:lamp:o", () => lampHead("o")) : MK(key, p.fn);
      const par = p.parent ? N[p.parent] : root;
      N[p.k] = R.addChild(par, fnode(mesh, Object.assign({ shadow: !ghost && !p.lamp && !p.screen }, p.at)));
      N[p.k].rest = Object.assign({}, p.at);
      if (p.screen) N[p.k].visible = !ghost;
    });
    if (ghost) return;
    const add = (k, o2) => (N[k] = R.addChild(root, fnode(null, Object.assign({ visible: false }, o2 || {}))));
    /* Werkstück-, Stapel- und Pufferknoten je Maschine */
    ["wp", "wp2", "buf", "out"].forEach(k => add(k));
    for (let i = 1; i <= (EXTRA[o.t] || 0); i++) add("x" + i);
    parts.swk = { t: o.t, N, defs, E: { root }, last: 0, emitT: 0 };
  }

  /* gemeinsame Hilfen für Stapel an Zufuhr und Ausgabe */
  function showStack(n, ids, keyPre, opt) {
    if (!ids.length) { n.visible = false; n.key = ""; return; }
    const key = keyPre + ":" + ids.join(",");
    setMesh(n, key, () => stackMB(ids, opt));
  }
  const cap = (a, n) => a.slice(0, n);

  const STEP = {};
  /* ---- Holzspalter ---- */
  STEP.spalter = (o, P2, s, time, E) => {
    const N = P2.N, sp = SPC[s.inId] || "birke", r = s.inId === "reste" ? 0.13 : 0.15, h = SP.logH, ty = SP.tableY;
    const [px, pz] = SP.plate;
    /* Wartende Rollen vorn links */
    const wait = s.waitIn.map(ins => SPC[ins[0]] || "birke");
    if (wait.length) setMesh(N.buf, "swk:sp:buf:" + wait.join(","), () => { const b = new MB(); wait.slice(0, 3).forEach((w, i) => roundUp(b, w, 0.14, h * 0.95, -0.72 + i * 0.3, 0.62 - (i % 2) * 0.12)); return b; }); else setMesh(N.buf, "");
    N.buf.x = 0; N.buf.y = 0.06; N.buf.z = 0;
    /* Gitterbox: Füllstand nach der abholbereiten Ware */
    const fillN = s.done.length, fid = s.done[0] || "brennholz";
    if (fillN) setMesh(N.out, "swk:sp:fill:" + fid + ":" + Math.min(6, Math.ceil(fillN / 2)), () => { const b = new MB(); woodHeap(b, fid === "kaminholz" ? "buche" : "birke", SP.crate[2] - 0.1, SP.crate[3] - 0.1, Math.min(1, fillN / 10), 9); return b; }); else setMesh(N.out, "");
    N.out.x = SP.crate[0]; N.out.y = 0.1; N.out.z = SP.crate[1];
    /* Keil und Viertel */
    const qs = [N.x1, N.x2, N.x3, N.x4];
    let ram = SP.ramRest, stage = 0, open = 0;
    if (s.job && s.f > 0) {
      const f = s.f;
      /* drei Hübe: der Keil fährt herunter, dringt ein, die Rolle bricht auf */
      const strokes = [[0.14, 0.38], [0.4, 0.64], [0.66, 0.88]];
      strokes.forEach(([a, b2], i) => {
        const u = seg(f, a, b2);
        if (u > 0 && u < 1) { const down = u < 0.55 ? ease(u / 0.55) : 1 - ease((u - 0.55) / 0.45); ram = lerp(SP.ramRest, ty + h - 0.12 - i * 0.04, down); }
        if (u >= 0.5) stage = i + 1;
        if (u > 0.4 && u < 0.6 && s.run && Math.random() < 0.5) emitAt(E, px, ty + h, pz, Object.assign(CHIP(), { vx: (Math.random() - 0.5) * 1.2, vz: (Math.random() - 0.5) * 1.2, vy: 0.8 }));
      });
      open = stage >= 3 ? 1 : stage >= 2 ? 0.6 : stage >= 1 ? 0.3 : 0;
      const qm = MK("swk:q:" + sp + ":" + r, () => quarter(sp, r, h));
      /* Anfang: die Rolle kommt von der Zufuhr auf den Tisch */
      const inT = seg(f, 0.0, 0.1), throwT = seg(f, 0.9, 1.0);
      qs.forEach((n, i) => {
        n.mesh = qm; n.key = "q"; n.visible = true;
        const a = i * PI / 2, bis = a + PI / 4;
        let x = px, y = ty, z = pz;
        if (inT < 1) { const p = arc([-0.72, 0.06, 0.62], [px, ty, pz], inT, 0.25); x = p[0]; y = p[1]; z = p[2]; }
        const sep = open * (0.05 + (i % 2) * 0.03);
        x += Math.cos(bis) * sep; z -= Math.sin(bis) * sep;
        let tilt = open * 0.18;
        if (throwT > 0) {
          const k = seg(throwT, i * 0.12, 0.64 + i * 0.12);
          const p = arc([x, y, z], [SP.crate[0] + (i - 1.5) * 0.12, 0.2 + Math.min(0.3, fillN * 0.03), SP.crate[1] + (i % 2 - 0.5) * 0.2], k, 0.45);
          x = p[0]; y = p[1]; z = p[2]; tilt += k * 1.2;
          if (k >= 1) n.visible = false;
        }
        n.x = x; n.y = y; n.z = z; n.ry = a;
        n.rx = Math.sin(bis) * tilt; n.rz = -Math.cos(bis) * tilt;
      });
    } else qs.forEach(n => { n.visible = false; });
    N.ram.y = ram;
  };
  /* ---- Hobelmaschine ---- */
  STEP.hobel = (o, P2, s, time, E) => {
    const N = P2.N, y = HB.y, L = HB.len;
    const wait = s.waitIn.map(() => "bretter");
    showStack(N.buf, cap(wait, 3), "swk:hb:buf", { y: 0, maxH: 0.6 });
    N.buf.x = HB.buf[0]; N.buf.y = 0.06 + PAL_H; N.buf.z = HB.buf[1]; N.buf.ry = 0;
    const outIds = cap(s.done, 6);
    showStack(N.out, outIds, "swk:hb:out", { maxH: 0.7 });
    N.out.x = HB.out[0]; N.out.y = 0.06 + PAL_H; N.out.z = HB.out[1];
    const A = N.wp, B = N.wp2;
    if (s.job && s.f < 1) {
      const f = s.f, rawM = MK("swk:pl:raw", () => plankUnit(WD.raw, 0.18, 0.042, true)), plM = MK("swk:pl:pln", () => plankUnit(WD.pln, 0.18, 0.038));
      A.mesh = rawM; B.mesh = plM; A.key = B.key = "m";
      const lift = seg(f, 0, 0.1), feed = seg(f, 0.1, 0.86), off = seg(f, 0.86, 1);
      if (lift < 1) {
        const p = arc([HB.buf[0] - L / 2, 0.06 + PAL_H + Math.min(0.36, wait.length * 0.12), HB.buf[1]], [-0.95 - L / 2, y, 0], lift, 0.3);
        A.visible = true; B.visible = false; A.x = p[0]; A.y = p[1]; A.z = p[2]; A.sx = L;
      } else if (feed < 1) {
        const cxw = lerp(-0.95, 0.95, feed), x0 = cxw - L / 2, c = Math.max(0, Math.min(L, -x0));
        A.visible = L - c > 0.005; A.x = x0 + c; A.y = y; A.z = 0; A.sx = Math.max(0.001, L - c);
        B.visible = c > 0.005; B.x = x0; B.y = y; B.z = 0; B.sx = Math.max(0.001, c);
        if (s.run && Math.random() < 0.35) emitAt(E, -0.44, y + 0.1, 0, Object.assign(CHIP(), { vx: -0.6, vz: (Math.random() - 0.5) * 0.6 }));
      } else {
        const p = arc([0.95 - L / 2, y, 0], [HB.out[0] - L / 2, 0.06 + PAL_H + Math.min(0.66, outIds.length * 0.11), HB.out[1]], off, 0.35);
        A.visible = false; B.visible = true; B.x = p[0]; B.y = p[1]; B.z = p[2]; B.sx = L;
      }
    } else { A.visible = B.visible = false; }
  };
  /* ---- Schleifmaschine ---- */
  STEP.schleif = (o, P2, s, time, E) => {
    const N = P2.N, y = SL.y, L = 0.5, C = s.inId === "edelholz" ? WD.cherry : WD.beech;
    const wait = s.waitIn.map(ins => ins[0] === "edelholz" ? "kirsch" : "buche");
    if (wait.length) setMesh(N.buf, "swk:sl:buf:" + wait.join(","), () => { const b = new MB(); wait.slice(0, 3).forEach((w, i) => { for (let k = 0; k < 3; k++) board(b, 0.5, 0.26, 0.05, w === "kirsch" ? WD.cherry : WD.beech, { y: (i * 3 + k) * 0.052, z: (k - 1) * 0.0 }); }); return b; }); else setMesh(N.buf, "");
    N.buf.x = SL.buf[0]; N.buf.y = 0.06 + PAL_H; N.buf.z = SL.buf[1];
    const cyc = s.job ? Math.max(1, s.n) : 1, cf = s.f * cyc, ci = Math.min(cyc - 1, Math.floor(cf)), g = s.job ? cf - ci : 0;
    const pend = s.job && s.f < 1 ? Math.min(ci, cyc) : 0;
    const outIds = cap(s.done.concat(s.job && s.f < 1 ? Array(pend).fill(s.outId) : []), 6);
    if (outIds.length) setMesh(N.out, "swk:sl:out:" + outIds.join(","), () => { const b = new MB(); outIds.forEach((id, i) => { const lv = i < 3 ? 0.52 + 0.025 : 0.2 + 0.025, k = i % 3, ch = id === "moebel"; b.at({ x: (k - 1) * 0.17, y: lv, z: ch ? 0 : (k % 2 - 0.5) * 0.12, ry: ch ? 0.3 + k * 0.4 : 0.2, s: ch ? 0.5 : 1 }, m => unitOf(id).fn(m)); }); return b; }); else setMesh(N.out, "");
    N.out.x = SL.cart[0]; N.out.y = 0.06; N.out.z = SL.cart[1];
    const A = N.wp, B = N.wp2;
    if (s.job && s.f < 1) {
      const raw = MK("swk:sl:raw:" + (C === WD.cherry ? "k" : "b"), () => plankUnit({ a: shd(C.a, 0.92), b: shd(C.b, 0.92), top: shd(C.top, 0.9), end: C.end }, 0.26, 0.05, true));
      const fin = MK("swk:sl:fin:" + (C === WD.cherry ? "k" : "b"), () => plankUnit({ a: mix(C.a, 0xffffff, 0.12), b: C.a, top: mix(C.top, 0xffffff, 0.18), end: C.end }, 0.26, 0.05));
      A.mesh = raw; B.mesh = fin; A.key = B.key = "m";
      const lift = seg(g, 0, 0.12), feed = seg(g, 0.12, 0.85), off = seg(g, 0.85, 1);
      if (lift < 1) { const p = arc([SL.buf[0] - L / 2, 0.06 + PAL_H + 0.16, SL.buf[1]], [-1.2 - L / 2, y, 0], lift, 0.3); A.visible = true; B.visible = false; A.x = p[0]; A.y = p[1]; A.z = p[2]; A.sx = L; }
      else if (feed < 1) {
        const cxw = lerp(-1.2, 1.15, feed), x0 = cxw - L / 2, c = Math.max(0, Math.min(L, -x0));
        A.visible = L - c > 0.005; A.x = x0 + c; A.y = y; A.z = 0; A.sx = Math.max(0.001, L - c);
        B.visible = c > 0.005; B.x = x0; B.y = y; B.z = 0; B.sx = Math.max(0.001, c);
        if (s.run && Math.random() < 0.3) emitAt(E, 0.56, y + 0.08, (Math.random() - 0.5) * 0.4, { vx: 0.4, vy: 0.5, g: -0.6, drag: 1, life: 1.0, size: 0.05, size2: 0.14, col: [0.93, 0.88, 0.76, 0.5] });
      } else { const p = arc([1.15 - L / 2, y, 0], [SL.cart[0] - L / 2, 0.06 + 0.25, SL.cart[1]], off, 0.3); A.visible = false; B.visible = true; B.x = p[0]; B.y = p[1]; B.z = p[2]; B.sx = L; }
    } else { A.visible = B.visible = false; }
  };
  const id0 = a => a && a.length ? a[0] : null;
  /* ---- Fräse ---- */
  STEP.fraese = (o, P2, s, time, E) => {
    const N = P2.N, y = FR.y, bx = FR.bed;
    const isDoor = s.outId === "tueren";
    const wait = s.waitIn.map(ins => ins.includes("bohlen") ? "tueren" : "zaun");
    if (wait.length) setMesh(N.buf, "swk:fr:buf:" + wait.join(","), () => { const b = new MB(); wait.slice(0, 3).forEach((w, i) => { if (w === "tueren") { board(b, 0.9, 0.3, 0.06, WD.oak, { y: i * 0.13 }); board(b, 0.9, 0.3, 0.03, WD.ply, { y: i * 0.13 + 0.065 }); } else { board(b, 0.9, 0.14, 0.04, WD.raw, { y: i * 0.1, z: -0.08 }); post(b, 0.9, 0.08, WD.raw, { y: i * 0.1, z: 0.07 }); } }); return b; }); else setMesh(N.buf, "");
    N.buf.x = FR.buf[0]; N.buf.y = 0.06 + PAL_H; N.buf.z = FR.buf[1]; N.buf.ry = PI / 2;
    const cyc = s.job ? Math.max(1, s.n) : 1, cf = s.f * cyc, ci = Math.min(cyc - 1, Math.floor(cf)), g = s.job ? cf - ci : 0;
    const pend = s.job && s.f < 1 ? ci : 0;
    const outIds = cap(s.done.concat(Array(pend).fill(s.outId)), 4);
    if (outIds.length) setMesh(N.out, "swk:fr:out:" + outIds.join(","), () => {
      const b = new MB();
      let nd = 0, nz = 0;
      outIds.forEach(id => {
        const k = nd + nz;
        if (id === "tueren") { b.at({ x: 0.16 - k * 0.075, y: 0.06, z: 0, rz: 0.22 }, m => door(m, false)); nd++; }
        else { b.at({ x: 0.17 - k * 0.075, y: 0.06, z: 0, rz: 0.22 }, m => fenceUp(m)); nz++; }
      });
      return b;
    }); else setMesh(N.out, "");
    N.out.x = FR.rack[0]; N.out.y = 0.06; N.out.z = FR.rack[1];
    const gx = N.gx, hz = N.hz, bit = N.bit, A = N.wp;
    let gX = bx + 0.55, hZ = 0, hY = 0;
    if (s.job && s.f < 1) {
      const rawKey = isDoor ? "swk:fr:rd" : "swk:fr:rz", finKey = isDoor ? "swk:fr:fd" : "swk:fr:fz";
      const raw = () => { const b = new MB(); if (isDoor) { board(b, 0.95, 0.44, 0.06, WD.oak); } else { [-0.13, 0.13].forEach(z => board(b, 0.95, 0.12, 0.04, WD.raw, { z })); post(b, 0.95, 0.08, WD.raw, { z: 0 }); } return b; };
      const fin = () => { const b = new MB(); if (isDoor) door(b, true); else fence(b); return b; };
      const slide = seg(g, 0, 0.1), mill = seg(g, 0.1, 0.82), off = seg(g, 0.86, 1);
      const reveal = g >= 0.82;
      setMesh(A, reveal ? finKey : rawKey, reveal ? fin : raw);
      A.ry = 0;
      if (slide < 1) { const p = arc([FR.buf[0], 0.06 + PAL_H + 0.1, FR.buf[1]], [bx, y, 0], slide, 0.3); A.x = p[0]; A.y = p[1]; A.z = p[2]; A.ry = (1 - ease(slide)) * PI / 2; }
      else if (off <= 0) { A.x = bx; A.y = y; A.z = 0; }
      else { const p = arc([bx, y, 0], [FR.rack[0] - 0.05, 0.12, FR.rack[1]], off, 0.5); A.x = p[0]; A.y = p[1]; A.z = p[2]; if (off >= 1) A.visible = false; }
      if (mill > 0 && mill < 1) {
        const u = mill;
        gX = bx + 0.36 * Math.sin(u * PI * 2 * 3) - 0.08; hZ = 0.16 * Math.sin(u * PI * 2 * 2 + 0.5);
        hY = -0.06 * Math.min(1, Math.min(u, 1 - u) * 20);
        if (s.run && Math.random() < 0.45) { const c = Math.cos(0), wx = gX + 0.3; emitAt(E, wx, y + 0.07, hZ, Object.assign(CHIP(isDoor ? [0.78, 0.55, 0.34, 1] : [0.94, 0.82, 0.58, 1]), { vx: (Math.random() - 0.5) * 1.6, vz: (Math.random() - 0.5) * 1.6, vy: 0.9 })); }
      } else if (slide >= 1 && off <= 0) { gX = bx + 0.55; }
      if (g >= 0.82 && g < 0.84 && s.run && Math.random() < 0.6) emitAt(E, bx, y + 0.1, 0, { vx: (Math.random() - 0.5) * 0.8, vy: 0.6, vz: (Math.random() - 0.5) * 0.8, g: -0.5, drag: 1.4, life: 0.9, size: 0.08, size2: 0.2, col: [0.92, 0.86, 0.72, 0.6] });
    } else { A.visible = false; }
    gx.x = lerp(gx.x, gX, 0.25); hz.z = lerp(hz.z, hZ, 0.25); hz.y = lerp(hz.y, hY, 0.3);
    if (N.scr) N.scr.glowS = s.run ? 0.35 + 0.1 * Math.sin(time * 2) : 0;
    if (N.scr) N.scr.tint = s.run ? null : [0.1, 0.13, 0.17, 0.85];
  };
  /* ---- Verpackungsmaschine (Palettennagler) ---- */
  STEP.verpack = (o, P2, s, time, E) => {
    const N = P2.N, y = VP.y;
    /* Zufuhr: je wartendem Auftrag ein Bündel Bretter und Kanthölzer */
    const w = s.waitIn.length;
    if (w) setMesh(N.buf, "swk:vp:buf:" + Math.min(3, w), () => { const b = new MB(); for (let i = 0; i < Math.min(3, w); i++) { b.at({ y: i * 0.15 }, m => { UNIT.bretter.fn(m); }); } b.at({ x: 0, y: Math.min(3, w) * 0.15, z: 0 }, m => [-0.1, 0.1].forEach(z => board(m, 0.8, 0.1, 0.1, WD.raw, { z, y: 0 }))); return b; }); else setMesh(N.buf, "");
    N.buf.x = VP.buf[0]; N.buf.y = 0.1; N.buf.z = VP.buf[1]; N.buf.sx = N.buf.sz = 0.62;
    const cyc = s.job ? Math.max(1, s.n) : 1, cf = s.f * cyc, ci = Math.min(cyc - 1, Math.floor(cf)), g = s.job ? cf - ci : 0;
    const pend = s.job && s.f < 1 ? ci : 0;
    const outIds = cap(s.done.concat(Array(pend).fill("paletten")), 7);
    showStack(N.out, outIds, "swk:vp:out", { maxH: 1.0 });
    N.out.x = VP.out[0]; N.out.y = 0.1; N.out.z = VP.out[1];
    const base = N.wp, deck = [N.x1, N.x2, N.x3, N.x4, N.x5];
    let gX = -0.62, hZ = 0, hY = 0;
    if (s.job && s.f < 1) {
      gX = -0.36;
      setMesh(base, "swk:vp:base", () => { const b = new MB(); pallet(b, 0.86, 0.57, { noDeck: true }); return b; });
      const dm = MK("swk:vp:deck", () => { const b = new MB(); b.box(0.86, 0.016, 0.095, PAL.board, { top: PAL.board, left: PAL.end, right: PAL.end }); return b; });
      const fin = seg(g, 0.84, 1);
      const off = fin > 0 ? arc([0, 0, 0], [VP.out[0], 0.1 - y + Math.min(0.9, outIds.length * (PAL_H + 0.004)), VP.out[1]], fin, 0.35) : [0, 0, 0];
      const bIn = seg(g, 0, 0.07);
      const bp = bIn < 1 ? arc([VP.buf[0], 0.3 - y, VP.buf[1]], [0, 0, 0], bIn, 0.3) : off;
      base.x = bp[0]; base.y = y + bp[1]; base.z = bp[2];
      if (fin >= 1) base.visible = false;
      deck.forEach((n, i) => {
        n.mesh = dm; n.key = "d";
        const a = 0.08 + i * 0.13, u = seg(g, a, a + 0.05), zi = -0.57 / 2 + 0.0475 + i * (0.57 - 0.095) / 4;
        n.visible = u > 0 && fin < 1;
        if (u < 1) { const p = arc([VP.buf[0], 0.32 - y, VP.buf[1]], [0, PAL_H - 0.016, zi], u, 0.25); n.x = p[0]; n.y = y + p[1]; n.z = p[2]; }
        else { n.x = off[0]; n.y = y + PAL_H - 0.016 + off[1]; n.z = zi + off[2]; }
        /* Nageln: Portal fährt über das Brett, der Nagler tippt; dazwischen wartet er am nächsten Brett */
        const nail = seg(g, a + 0.05, a + 0.13);
        if (g >= a - 0.05 && g < a + 0.05) hZ = zi;
        if (nail > 0 && nail < 1) {
          gX = lerp(-0.36, 0.36, nail); hZ = zi; const tap = Math.abs(Math.sin(nail * PI * 6));
          hY = -0.07 * Math.pow(tap, 6);
          if (tap > 0.97 && s.run && Math.random() < 0.6) emitAt(E, gX + 0.13, y + PAL_H + 0.02, zi, { vx: 0, vy: 0.6, vz: 0, g: -0.4, drag: 2, life: 0.4, size: 0.04, size2: 0.12, col: [0.85, 0.85, 0.85, 0.5] });
        }
      });
    } else { base.visible = false; deck.forEach(n => { n.visible = false; }); }
    N.gx.x = lerp(N.gx.x, gX, 0.3); N.hz.z = lerp(N.hz.z, hZ, 0.3); N.hz.y = hY;
  };
  /* ---- Trockenkammer ---- */
  STEP.trocken = (o, P2, s, time, E) => {
    const N = P2.N;
    const w = s.waitIn.length;
    if (w) setMesh(N.buf, "swk:tk:buf:" + Math.min(3, w), () => stackMB(Array(Math.min(3, w)).fill("balken"), { maxH: 0.6 })); else setMesh(N.buf, "");
    N.buf.x = TK.waitAt[0]; N.buf.y = 0.1; N.buf.z = TK.waitAt[1]; N.buf.ry = 0;
    let cartX = TK.cartOut, door = 1, load = null, dry = false;
    const doneN = s.done.length;
    if (s.job && s.f < 1) {
      const f = s.f, inT = seg(f, 0, 0.06), cls = seg(f, 0.06, 0.1), opn = seg(f, 0.9, 0.94), outT = seg(f, 0.94, 1);
      cartX = f < 0.5 ? lerp(TK.cartOut, TK.cartIn, ease(inT)) : lerp(TK.cartIn, TK.cartOut, ease(outT));
      door = f < 0.5 ? 1 - ease(cls) : ease(opn);
      load = "raw"; dry = f >= 0.5;
      if (f > 0.1 && f < 0.9 && s.run) {
        P2.emitT = (P2.emitT || 0) + 1;
        if (Math.random() < 0.08) emitAt(E, 0.25, 2.6, 0.5, { vx: 0.1, vy: 0.5, vz: 0, drag: 0.2, life: 2.6, size: 0.12, size2: 0.55, col: [0.93, 0.94, 0.95, 0.5] });
      }
    } else if (doneN) { load = "dry"; dry = true; }
    /* abholbereit, aber der Wagen ist (noch) belegt oder es ist mehr fertig: Stapel am Boden */
    const floorN = s.job && s.f < 1 ? doneN : Math.max(0, doneN - 2);
    if (floorN) setMesh(N.out, "swk:tk:out:" + Math.min(4, floorN), () => stackMB(Array(Math.min(4, floorN)).fill("bauholz"), { maxH: 0.7 })); else setMesh(N.out, "");
    N.out.x = TK.doneAt[0]; N.out.y = 0.1; N.out.z = TK.doneAt[1];
    N.cart.x = cartX;
    const L = N.wp;
    if (load) { setMesh(L, dry ? "swk:tk:dry" : "swk:tk:raw", () => dry ? dryStack(WD.dry, true) : dryStack(WD.raw, false)); L.x = cartX; L.y = 0.06 + 0.18; L.z = TK.dz; }
    else setMesh(L, "");
    const a = (PI / 2) * 0.92 * door;
    N.dl.ry = a; N.dr.ry = -a;
    if (N.disp) { N.disp.glowS = s.run ? 0.3 + 0.12 * Math.sin(time * 1.3) : 0; N.disp.tint = s.run ? null : [0.12, 0.08, 0.05, 0.85]; }
  };
  /* ---- Sägebock ---- */
  STEP.saegebock = (o, P2, s, time, E) => {
    const N = P2.N, sp = SPC[s.inId] || "kiefer", r = s.inId === "aeste" ? 0.08 : (LOG_R[sp] || 0.15), L = BK2.L, x0 = BK2.x0;
    const wait = s.waitIn.map(ins => ins[0]);
    if (wait.length) setMesh(N.buf, "swk:bk:buf:" + wait.join(","), () => stackMB(cap(wait, 3), { maxH: 0.5 })); else setMesh(N.buf, "");
    N.buf.x = BK2.buf[0]; N.buf.y = 0.02; N.buf.z = BK2.buf[1];
    const outIds = cap(s.done, 4);
    showStack(N.out, outIds, "swk:bk:out", { maxH: 0.5 });
    N.out.x = BK2.out[0]; N.out.y = 0.02; N.out.z = BK2.out[1]; N.out.ry = PI / 2; N.out.sx = N.out.sy = N.out.sz = 0.7;
    const saw = N.saw, A = N.wp, B = N.wp2;
    let sx = saw.rest.x, sy = saw.rest.y, sz = saw.rest.z, sry = saw.rest.ry || 0, srz = 0;
    if (s.job && s.f < 1) {
      const f = s.f, cross = s.outId === "brennholz";
      const logM = s.inId === "aeste" ? MK("swk:bk:ast", () => { const b = new MB(); b.at({ x: 0.5, y: 0 }, m => branches(m, 1)); return b; }) : MK("swk:log:" + sp + ":" + r, () => logUnit(sp, r));
      A.mesh = logM; A.key = "l"; A.visible = true; A.y = BK2.y - r * 0.6; A.z = 0;
      const put = seg(f, 0, 0.08);
      if (cross) {
        /* Ablängen: drei Schnitte von rechts, die Stücke fallen auf den Haufen */
        const k = Math.min(3, Math.floor(seg(f, 0.08, 0.95) * 3)), u = (seg(f, 0.08, 0.95) * 3) % 1, pieceL = L / 4;
        const rem = L - k * pieceL;
        A.x = x0; A.sx = rem;
        const cutX = x0 + rem - pieceL;
        sx = cutX - 0.3; sz = 0.12; sy = BK2.y + r * 1.4 - (u < 0.7 ? ease(u / 0.7) * r * 1.6 : 0); sry = 0; srz = -0.25;
        B.mesh = logM; B.key = "l";
        if (u >= 0.7 && k < 3) { const p = arc([cutX, A.y, 0], [BK2.out[0], 0.05, BK2.out[1]], seg(u, 0.7, 1), 0.2); B.visible = true; B.x = p[0]; B.y = p[1]; B.z = p[2]; B.sx = pieceL; B.rz = seg(u, 0.7, 1) * 1.2; }
        else B.visible = false;
        if (u > 0.05 && u < 0.7 && s.run && Math.random() < 0.6) emitAt(E, cutX, BK2.y, 0.05, Object.assign(CHIP(), { vx: (Math.random() - 0.5) * 0.6, vz: 0.6 + Math.random() * 0.5, vy: 0.5 }));
      } else {
        /* Längsschnitt: die Säge fährt am Stamm entlang, dahinter liegt er aufgetrennt */
        const cut = seg(f, 0.1, 0.86), off = seg(f, 0.88, 1);
        const sawX = lerp(x0 + L - 0.05, x0 + 0.05, cut), c = Math.max(0, Math.min(L, x0 + L - sawX));
        const cutM = MK("swk:cut:" + sp + ":" + r, () => cutUnit(sp, r));
        if (off <= 0) {
          A.x = x0; A.sx = Math.max(0.001, L - c); A.visible = L - c > 0.005;
          B.mesh = cutM; B.key = "c"; B.visible = c > 0.005; B.x = x0 + L - c; B.y = A.y; B.z = 0; B.sx = Math.max(0.001, c); B.rz = 0;
          if (cut > 0) { sx = sawX - 0.35; sz = 0.0; sy = BK2.y + r * 2.0 - 0.02; sry = 0; srz = -0.35 + Math.sin(time * 30) * 0.02; }
          if (cut > 0 && cut < 1 && s.run && Math.random() < 0.6) emitAt(E, sawX, BK2.y + r, 0.1, Object.assign(CHIP(), { vx: 0.4, vz: 0.7, vy: 0.6 }));
        } else {
          A.visible = false;
          const p = arc([x0, A.y, 0], [BK2.out[0] - 0.5, 0.05, BK2.out[1]], off, 0.3);
          B.mesh = cutM; B.visible = off < 1; B.x = p[0]; B.y = p[1]; B.z = p[2]; B.sx = L * 0.7; B.rz = 0;
        }
      }
      if (put < 1) { const p = arc([BK2.buf[0] - 0.5, 0.1, BK2.buf[1]], [x0, A.y, 0], put, 0.3); A.x = p[0]; A.y = p[1]; A.z = p[2]; A.sx = L; B.visible = false; sx = saw.rest.x; sy = saw.rest.y; sz = saw.rest.z; sry = saw.rest.ry; srz = 0; }
    } else { A.visible = B.visible = false; }
    saw.x = lerp(saw.x, sx, 0.2); saw.y = lerp(saw.y, sy, 0.2); saw.z = lerp(saw.z, sz, 0.2); saw.ry = lerp(saw.ry, sry, 0.2); saw.rz = lerp(saw.rz, srz, 0.3);
  };
  /* ---- Sägehalle ---- */
  STEP.sw_halle = (o, P2, s, time, E) => {
    const N = P2.N, y0 = HL.y, Lg = HL.L, Ly = y0 + HL.logY;
    const sp = SPC[s.inId] || "kiefer", isLog = LOG_IDS.has(s.inId), r = HR[sp] || 0.22;
    /* wartende Stämme auf dem Holzplatz vorn rechts */
    const wait = s.waitIn.map(ins => ins[0]);
    if (wait.length) setMesh(N.buf, "swk:hl:buf:" + wait.join(","), () => {
      const b = new MB();
      let yy = 0.1;
      cap(wait, 2).forEach(id => { const sp2 = SPC[id], r2 = HR[sp2] || 0.2; if (LOG_IDS.has(id)) { b.at({ x: -Lg / 2, y: yy, sx: Lg }, m => m.merge(logUnit(sp2, r2), {})); yy += r2 * 1.9; } else { b.at({ y: yy }, m => unitOf(id).fn(m)); yy += unitOf(id).h; } });
      return b;
    }); else setMesh(N.buf, "");
    N.buf.x = HL.deck[0]; N.buf.y = y0; N.buf.z = HL.deck[1];
    /* fertige Ware am Bandende */
    const outIds = cap(s.done, 6);
    showStack(N.out, outIds, "swk:hl:out", { maxH: 0.75 });
    N.out.x = HL.out[0]; N.out.y = y0 + 0.05; N.out.z = HL.out[1]; N.out.sx = N.out.sy = N.out.sz = 0.8;
    const A = N.wp, B = N.wp2, cartN = N.cart;
    let cartX = HL.cartA;
    const x0A = HL.cartA - Lg / 2, x0B = HL.gx - 0.3 - Lg;          /* Stammanfang: auf dem Wagen → ganz durch die Säge */
    if (s.job && s.f < 1) {
      const f = s.f, load = seg(f, 0, 0.08), travel = seg(f, 0.08, 0.78), lift = seg(f, 0.78, 0.86), conv = seg(f, 0.86, 1), back = seg(f, 0.8, 1);
      const x0 = lerp(x0A, x0B, ease(travel));
      cartX = f < 0.8 ? Math.max(HL.cartStop, x0 + Lg / 2) : lerp(HL.cartStop, HL.cartA, ease(back));
      const rawM = isLog ? MK("swk:log:" + sp + ":" + r, () => logUnit(sp, r)) : MK("swk:hl:bdl:" + s.inId, () => { const b = new MB(); b.at({ x: 0.5 }, m => unitOf(s.inId).fn(m)); return b; });
      const cutM = isLog ? MK("swk:cut:" + sp + ":" + r, () => cutUnit(sp, r)) : rawM;
      const top = y0 + 0.08 + 0.18;
      A.mesh = rawM; B.mesh = cutM; A.key = B.key = "m"; A.sy = B.sy = A.sz = B.sz = 1;
      if (load < 1) {
        const p = arc([HL.deck[0] - Lg / 2, y0 + 0.12, HL.deck[1]], [x0A, top, HL.z], load, 0.4);
        A.visible = true; B.visible = false; A.x = p[0]; A.y = p[1]; A.z = p[2]; A.sx = Lg;
      } else if (lift <= 0) {
        /* hinter dem Wagenende liegt der Stamm auf den Walzen und dem Rollentisch (gleiche Höhe) */
        const c = Math.max(0, Math.min(Lg, HL.gx - x0)), yy = Math.min(top, Ly);
        A.visible = Lg - c > 0.005; A.x = x0 + c; A.y = yy; A.z = HL.z; A.sx = Math.max(0.001, Lg - c);
        B.visible = c > 0.005; B.x = x0; B.y = yy; B.z = HL.z; B.sx = Math.max(0.001, c);
        if (c > 0 && c < Lg && s.run && Math.random() < 0.7) emitAt(E, HL.gx - 0.12, yy + r * (0.4 + Math.random()), HL.z + (Math.random() - 0.5) * 0.4, Object.assign(CHIP(), { vx: -0.9, vy: 0.7, vz: (Math.random() - 0.5) * 1.4 }));
      } else {
        A.visible = false;
        let p;
        if (conv <= 0) p = arc([x0B, Ly, HL.z], [HL.band - Lg / 2, y0 + 0.48, HL.bandZ0 + 0.35], lift, 0.4);
        else if (conv < 0.85) p = [HL.band - Lg / 2, y0 + 0.48, lerp(HL.bandZ0 + 0.35, HL.bandZ1 - 0.05, seg(conv, 0, 0.85))];
        else p = arc([HL.band - Lg / 2, y0 + 0.48, HL.bandZ1 - 0.05], [HL.out[0] - Lg / 2 * 0.8, y0 + 0.08 + outIds.length * 0.1, HL.out[1]], seg(conv, 0.85, 1), 0.2);
        B.visible = conv < 1; B.x = p[0]; B.y = p[1]; B.z = p[2]; B.sx = conv > 0.85 ? lerp(Lg, Lg * 0.8, seg(conv, 0.85, 1)) : Lg;
      }
    } else { A.visible = B.visible = false; }
    cartN.x = cartX;
    /* Hallenlicht: die Einrichtung liegt im Schatten des Dachs – mit Strom brennen die Lampen */
    P2.glow = S.farm.saw && S.farm.saw.strom ? 0.24 : 0;
    /* Gatter: Kurbeltrieb – das Schwungrad dreht, Pleuel und Sägerahmen folgen genau */
    if (N.fly) {
      const px = -Math.sin(N.fly.rz) * GK.r, py = Math.cos(N.fly.rz) * GK.r, sq = Math.sqrt(Math.max(0, GK.L * GK.L - px * px));
      /* Pleuel hängt vom Kurbelzapfen zum Ausleger (Rahmen-y 0) */
      N.frm.y = y0 + GK.cy + py - sq;
      N.rod.x = HL.gx + px; N.rod.y = y0 + GK.cy + py; N.rod.rz = Math.atan2(px, -sq);
      if (!s.run) N.fly.rz = lerp(N.fly.rz, Math.round(N.fly.rz / (2 * PI)) * 2 * PI, 0.03);
    }
  };

  function step(dt, time) {
    if (!S.farm || typeof FV === "undefined" || !FV.R) return;
    const cam = FV.R.cam, night = (FV.R.env && FV.R.env.night) || 0;
    for (const o of S.farm.objs) {
      if (!KINDS.has(o.t)) continue;
      const e = FV.nodes.get(o.id);
      if (!e || !e.parts.swk) continue;
      const P2 = e.parts.swk, N = P2.N, s = st(o);
      P2.E.root = e.node;
      /* außer Sicht (weit weg von der Kamera): nur Lampe und Stapel, keine Bewegung */
      const far = Math.hypot(e.node.x - cam.tx, e.node.z - cam.tz) > cam.dist * 1.1 + 6;
      try { if (STEP[o.t] && !(far && P2.last && time - P2.last < 1)) { STEP[o.t](o, P2, s, time, P2.E); P2.last = time; } } catch (err) { if (!P2.err) { P2.err = 1; console.warn("SWK", o.t, err); } }
      /* Arbeitsbeleuchtung: nachts ist eine laufende Maschine angestrahlt (Hallenlicht in der Sägehalle) */
      const wg = Math.max(P2.glow || 0, night * (s.run ? 0.32 : s.done.length ? 0.14 : 0));
      if (o.t !== "sw_halle" && wg > (e.node.glow || 0)) e.node.glow = wg;
      for (const k in N) if (k !== "lamp") N[k].glow = Math.max(wg, N[k].glowS || 0);
      /* drehende Teile und mitlaufende Bänder nur im Betrieb */
      P2.defs.forEach(p => {
        const n = N[p.k];
        if (p.spin && s.run) n[p.spin] += dt * (p.k === "fly" ? 3.2 : p.k.startsWith("wh") ? 9 : p.k === "bit" ? 40 : p.k.startsWith("f") ? 7 : p.k.startsWith("dr") ? 14 : 5);
        if (p.belt && s.run) { const ax = p.beltAxis || "x", v = (time * 0.35) % p.belt; n[ax] = (p.at[ax] || 0) + v - p.belt / 2; }
        if (p.lamp) { const k = lampState(s, time), key = "swk:lamp:" + k; if (n.key !== key) { n.key = key; n.mesh = MK(key, () => lampHead(k)); } n.glow = k === "o" ? 0 : 0.55; }
      });
    }
  }

  /* Modelle für woodmodels.js / worldview.js */
  return { P, ACC, pad, machine, saegebock, body, hallInterior, attach, step, st, UNIT, stackMB, KINDS, lampHead, logUnit, cutUnit };
})();
