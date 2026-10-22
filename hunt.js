/* LOGISTIKA – Jagd: Hochsitz auf der Lichtung im Plötziner Forst (v107)
   ---------------------------------------------------------------------------
   Westlich vom Sägewerk liegt eine große Wildwiese, an ihrem Ostrand steht ein
   hölzerner Hochsitz. Antippen → „Hinaufsteigen“: die Kamera fährt auf die
   Plattform in die Ich-Perspektive (wie beim Sägen, FV.fp). Von oben:
     • Fernglas (🔭): abgedunkeltes Doppelkreis-Bild, Tiere im Kreis werden
       „gespottet“ – Art, Entfernung, mögliche Medaille, Wert.
     • Gewehr (🎯): Zielfernrohr mit Mil-Dot-Absehen, 2× / 4× / 8×, das Bild
       schwankt leicht, „Atem anhalten“ beruhigt es drei Sekunden lang.
     • Schuss: Strahl durch die Bildmitte gegen Trefferzonen am Tier (Kopf,
       Träger, Herz, Lunge, Körper, Lauf), Bäume halten die Kugel auf.
   Kritisch (Herz/Lunge/Kopf/Träger) → das Stück liegt nach wenigen Metern;
   Körper/Lauf → es flüchtet, Schweißfährte, Nachsuche (Medaille gedeckelt);
   vorbei → das Wild auf der Lichtung flüchtet.
   Danach Trophäen-Bildschirm (Kamera kreist um das Stück) und „Trophäe ins
   Lager“ (Lager › Trophäen). Verkauf an Sammler: im Lager und auf dem Markt.

   Begriffe (für alle, die Three.js kennen): Szene = FV.R.nodes, Mesh = fmesh()
   + fnode(), Raycaster = HUNT.zoneHit (Strahl gegen Kugel/Ellipsoid in den
   Tier-Koordinaten), Tween/LERP = eigene Glättung (ss, lerpCam).

   Einbindung: worldview.js (Lichtung frei von Bäumen und Büschen, Wiese,
   attach/step, Antippen, Blase), farmview.js (Nebel), erbe.js (Lager-Reiter),
   farm.js (Sammler zahlen den vollen Wert), game.js (Markt). */
const HUNT = (() => {
  "use strict";
  /* ------------------------------ Lage ------------------------------------ */
  const CX = -78, CZ = -24, CR = 14;                  /* Wildwiese: Mitte, Radius (Welteinheiten ≈ Meter / 4 in der Anzeige) */
  const TW = { x: -62.8, z: -21.8 };                  /* Hochsitz am Ostrand */
  const TRY = Math.atan2(CX - TW.x, CZ - TW.z);       /* Vorderseite (lokal +z) schaut zur Wiesenmitte */
  const PH = 4.4, EYE = 1.62;                         /* Plattformhöhe, Augenhöhe darüber */
  const M_PER_U = 4;                                  /* Anzeige: Meter je Einheit */
  const FOV = 0.95, BINO = 4, ZOOMS = [2, 4, 8];
  const CAMD = 2.5;                                   /* Kamera-Abstand in der Ich-Perspektive: nahe Ebene 0,5 → Brüstung sichtbar */

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ss = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const angN = a => Math.atan2(Math.sin(a), Math.cos(a));
  const rnd = () => Math.random();
  const snd = k => { if (typeof sfx === "function") sfx(k); };

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
  const twL = (lx, ly, lz) => { const p = rot([lx, ly, lz], 0, TRY, 0); return [TW.x + p[0], ly, TW.z + p[2]]; };
  const EYEP = twL(0, PH + EYE, 0.12);

  /* Rand der Wiese: leicht unregelmäßig */
  const edgeR = a => CR * (1 + 0.1 * Math.sin(3 * a + 1.1) + 0.06 * Math.sin(5 * a + 2.3));
  const polar = (x, z) => ({ d: Math.hypot(x - CX, z - CZ), a: Math.atan2(z - CZ, x - CX) });
  function inMeadow(x, z, m) { const p = polar(x, z); return p.d < edgeR(p.a) + (m || 0); }
  /* frei halten: kind "tree" fällbare Bäume, "bg" Kulissenbäume, "bush" Büsche und Waldboden */
  function clear(x, z, kind) {
    const tw = Math.hypot(x - TW.x, z - TW.z);
    if (kind === "tree") return inMeadow(x, z, 2.5) || tw < 4;
    if (kind === "bush") return inMeadow(x, z, -1.2) || tw < 2.6;
    return inMeadow(x, z, 0.6) || tw < 3.4;
  }
  /* Bodenfarbe: helle Wildwiese mit gelblichen Flecken, weicher Übergang zum Waldboden */
  const mixC = (a, b, t) => { const A = typeof a === "number" ? [(a >> 16 & 255) / 255, (a >> 8 & 255) / 255, (a & 255) / 255] : a,
    B = typeof b === "number" ? [(b >> 16 & 255) / 255, (b >> 8 & 255) / 255, (b & 255) / 255] : b; t = clamp(t, 0, 1);
    return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
  function ground(x, z, c, v) {
    const p = polar(x, z), e = edgeR(p.a);
    if (p.d > e + 3) return c;
    const k = clamp((e + 3 - p.d) / 3.5, 0, 1);
    const w = Math.sin(x * 0.45 + z * 0.2) * Math.cos(z * 0.38 - x * 0.12);
    const mead = w > 0.35 ? 0xa6c95a : v > 0.1 ? 0x93c452 : 0x86ba4a;
    return mixC(c, mead, k);
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

  /* Farben */
  const DC = { coat: 0x9a5f34, coatD: 0x7a4626, belly: 0xc49a6a, rump: 0xead9bd, neck: 0x6b4224, hoof: 0x2a221c, nose: 0x2a2220, ant: 0x8c7454, antT: 0xeee2c6 };
  const BC = { coat: 0x5a4a3d, coatD: 0x473a30, ridge: 0x2b231d, snout: 0x9c7d70, tusk: 0xf3ecd9, hoof: 0x1d1814, belly: 0x3d3229 };
  const FC = { body: 0xb5602c, bodyD: 0x8c4520, neck: 0x1c4c57, head: 0x173b45, red: 0xd2281e, ring: 0xf4f1e8, beak: 0xdcc58b, tail: 0x9b6a3b, tailD: 0x5e3e22, wing: 0xa27648, leg: 0x7d7468 };

  /* Rothirsch: Körper (ohne Läufe und Kopf), Lauf, Kopf mit Geweih (Enden je Seite) */
  function deerBody() {
    G3.seed(5101);
    const b = MB();
    b.noise(0.07, m => {
      m.sphere(0.5, 9, 7, DC.coat, { y: 0.96, sx: 0.44, sy: 0.46, sz: 1.0, bottom: DC.belly });
      m.sphere(0.27, 8, 6, DC.coatD, { y: 0.93, z: 0.3, sx: 0.82, sy: 0.92, sz: 1.0 });           /* Brust/Widerrist, dunkler */
      m.sphere(0.13, 7, 5, DC.rump, { y: 1.0, z: -0.44, sx: 1.3, sy: 1.15, sz: 0.38 });           /* Spiegel */
      m.box(0.07, 0.13, 0.05, DC.coatD, { y: 0.98, z: -0.53 });
    });
    return b;
  }
  function deerLeg(front) {
    const b = MB(), L = 0.8;
    b.box(0.1, 0.36, 0.11, front ? DC.coatD : DC.coat, { y: -0.36 });
    b.box(0.055, 0.4, 0.06, DC.coatD, { y: -0.76 });
    b.box(0.07, 0.06, 0.08, DC.hoof, { y: -L, z: 0.01 });
    return b;
  }
  function antlers(b, P, sc) {
    const n = Math.max(3, Math.round(P / 2)), L = 0.42 + sc * 0.34, th = 0.026 + sc * 0.014;
    [-1, 1].forEach(s => {
      /* Stange: vier Glieder, nach außen, oben, leicht zurück */
      const pts = [[s * 0.06, 0.62, 0.3]];
      const dirs = [[s * 0.55, 0.75, -0.25], [s * 0.3, 0.92, -0.2], [s * 0.1, 0.98, -0.12], [-s * 0.15, 0.95, 0.1]];
      dirs.forEach((d, i) => { const l = Math.hypot(...d), q = pts[i]; pts.push([q[0] + d[0] / l * L * 0.27, q[1] + d[1] / l * L * 0.27, q[2] + d[2] / l * L * 0.27]); });
      for (let i = 0; i < 4; i++) beam(b, pts[i], pts[i + 1], th * (1 - i * 0.14), i < 3 ? DC.ant : DC.antT, true);
      /* Enden: Augspross vorn unten, dann Mittelsprossen, oben die Krone */
      for (let k = 0; k < n - 1; k++) {
        const u = (k + 0.6) / (n - 0.3), seg = Math.min(3, Math.floor(u * 4)), f = u * 4 - seg;
        const a = pts[seg], e = pts[seg + 1], base = [lerp(a[0], e[0], f), lerp(a[1], e[1], f), lerp(a[2], e[2], f)];
        const crown = u > 0.72, len = (k === 0 ? 0.17 : crown ? 0.11 : 0.14) * (0.8 + sc * 0.45);
        const dir = k === 0 ? [s * 0.05, 0.35, 0.95] : crown ? [s * (0.2 + k * 0.05), 0.9, k % 2 ? 0.35 : -0.25] : [s * 0.12, 0.55, 0.8];
        const dl = Math.hypot(...dir);
        beam(b, base, [base[0] + dir[0] / dl * len, base[1] + dir[1] / dl * len, base[2] + dir[2] / dl * len], th * 0.72, DC.antT, true);
      }
    });
  }
  function deerHead(P, sc) {
    G3.seed(5102 + P);
    const b = MB();
    b.noise(0.06, m => {
      beam(m, [0, -0.05, -0.02], [0, 0.46, 0.26], 0.085, DC.neck, false);                          /* Träger (Hals) mit Mähne */
      m.sphere(0.13, 7, 5, DC.neck, { y: 0.12, z: 0.06, sx: 0.95, sy: 1.3, sz: 1.0 });
      m.box(0.16, 0.17, 0.3, DC.coat, { y: 0.46, z: 0.36, c: true });                              /* Haupt */
      m.box(0.11, 0.11, 0.18, DC.coatD, { y: 0.42, z: 0.55, c: true });                            /* Äser */
      m.box(0.07, 0.05, 0.04, DC.nose, { y: 0.44, z: 0.645, c: true });
      [-1, 1].forEach(s => {
        m.box(0.03, 0.03, 0.02, 0x15120f, { x: s * 0.075, y: 0.5, z: 0.44, c: true });             /* Lichter */
        m.at({ x: s * 0.09, y: 0.56, z: 0.28, rz: -s * 0.9, rx: -0.2 }, q => q.box(0.05, 0.14, 0.02, DC.coat));   /* Lauscher */
      });
      antlers(m, P, sc);
    });
    return b;
  }
  /* Keiler */
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
      m.sphere(0.13, 8, 6, FC.body, { y: 0.24, sx: 0.85, sy: 0.85, sz: 1.45, bottom: FC.bodyD });
      m.sphere(0.07, 6, 4, FC.wing, { x: 0.08, y: 0.27, z: -0.03, sx: 0.5, sz: 1.6 });
      m.sphere(0.07, 6, 4, FC.wing, { x: -0.08, y: 0.27, z: -0.03, sx: 0.5, sz: 1.6 });
      m.at({ y: 0.28, z: -0.15, rx: 0.33 }, q => {                                                /* langer Stoß, schräg nach oben */
        q.box(0.055, 0.02, 0.32, FC.tail, { z: -0.16, c: true }); q.box(0.022, 0.024, 0.32, FC.tailD, { z: -0.16, c: true });
        q.box(0.03, 0.016, 0.22, FC.tail, { z: -0.42, c: true }); q.box(0.012, 0.02, 0.22, FC.tailD, { z: -0.42, c: true });
      });
      [-1, 1].forEach(s => m.box(0.018, 0.14, 0.02, FC.leg, { x: s * 0.04, y: 0.02, z: 0.02 }));
    });
    return b;
  }
  function phHead() {
    const b = MB();
    b.box(0.055, 0.13, 0.06, FC.neck, { y: 0, z: 0 });
    b.box(0.07, 0.025, 0.07, FC.ring, { y: 0.01 });
    b.sphere(0.045, 6, 4, FC.head, { y: 0.15, z: 0.02 });
    b.box(0.05, 0.035, 0.04, FC.red, { y: 0.15, z: 0.04, c: true });
    b.box(0.018, 0.018, 0.04, FC.beak, { y: 0.145, z: 0.08, c: true });
    return b;
  }
  function phWing(s) {
    const b = MB();
    b.quad([0, 0, 0.08], [s * 0.3, 0.01, 0.03], [s * 0.26, 0.01, -0.1], [0, 0, -0.08], FC.wing);
    b.quad([0, 0, -0.08], [s * 0.26, 0.01, -0.1], [s * 0.3, 0.01, 0.03], [0, 0, 0.08], FC.bodyD);
    return b;
  }
  /* Blutstropfen (Schweiß) am Boden */
  function dropMesh() { const b = MB(); b.disc(0.07, 7, 0x7d1912, { y0: 0.025, wob: 0.3 }); b.disc(0.035, 6, 0x9c2216, { x: 0.09, z: 0.04, y0: 0.026 }); return b; }

  /* ------------------------------ Arten ----------------------------------- */
  /* Trefferzonen in Tierkoordinaten (vor Maßstab). Kopf/Träger hängen am Kopf-Knoten, Läufe an ihren Knoten. */
  const SP = {
    hirsch: { n: "Rothirsch", i: "🦌", walk: 0.85, run: 6.5, s0: 0.98, s1: 1.12, lie: 0.24, hip: [[-0.12, 0.8, 0.34], [0.12, 0.8, 0.34], [-0.12, 0.8, -0.34], [0.12, 0.8, -0.34]], legL: 0.8,
      neck: [0, 1.0, 0.42], body: { c: [0, 0.96, 0], r: [0.22, 0.23, 0.5] }, lung: { c: [0, 0.94, 0.26], r: 0.15 }, heart: { c: [0, 0.86, 0.3], r: 0.08 },
      head: { c: [0, 0.46, 0.4], r: 0.12 }, neckZ: [[0, 0.05, 0.02], [0, 0.42, 0.24]], neckR: 0.09, sens: 1.3, orbit: 3.6, look: 1.0 },
    keiler: { n: "Keiler", i: "🐗", walk: 1.1, run: 6.0, s0: 0.92, s1: 1.15, lie: 0.21, hip: [[-0.11, 0.36, 0.24], [0.11, 0.36, 0.24], [-0.11, 0.36, -0.26], [0.11, 0.36, -0.26]], legL: 0.36,
      neck: [0, 0.6, 0.4], body: { c: [0, 0.53, 0], r: [0.21, 0.23, 0.46] }, lung: { c: [0, 0.52, 0.2], r: 0.13 }, heart: { c: [0, 0.45, 0.24], r: 0.07 },
      head: { c: [0, -0.06, 0.32], r: 0.14 }, neckZ: [[0, 0.02, 0.0], [0, 0.0, 0.14]], neckR: 0.12, sens: 1.0, orbit: 2.6, look: 0.6 },
    fasan: { n: "Fasan", i: "🐦", walk: 0.45, run: 1.8, s0: 1.2, s1: 1.4, lie: 0.1, hip: [], legL: 0,
      neck: [0, 0.3, 0.15], body: { c: [0, 0.24, -0.02], r: [0.13, 0.13, 0.2] }, lung: null, heart: null,
      head: { c: [0, 0.14, 0.03], r: 0.06 }, neckZ: [[0, 0.0, 0.0], [0, 0.1, 0.0]], neckR: 0.04, sens: 1.5, orbit: 1.7, look: 0.4 }
  };
  const MEDALS = [null, { n: "Bronze", i: "🥉", c: "#c47a3a" }, { n: "Silber", i: "🥈", c: "#9aa4b1" }, { n: "Gold", i: "🥇", c: "#e0a51e" }, { n: "Diamant", i: "💎", c: "#38b6d8" }];
  const PRICE = { hirsch: [0, 180, 420, 950, 2600], keiler: [0, 120, 300, 700, 1900], fasan: [0, 40, 90, 200, 520] };
  const XP = { hirsch: [0, 14, 22, 34, 60], keiler: [0, 10, 16, 26, 46], fasan: [0, 4, 7, 11, 20] };
  const ZONE = {
    herz:    { n: "Herzschuss", crit: true, run: [0, 2], cap: 4 },
    lunge:   { n: "Lungenschuss", crit: true, run: [3, 8], cap: 4 },
    kopf:    { n: "Kopfschuss", crit: true, run: [0, 0], cap: 4 },
    hals:    { n: "Trägerschuss", crit: true, run: [0, 0.6], cap: 4 },
    koerper: { n: "Weichschuss", crit: false, run: [15, 24], cap: 2 },
    lauf:    { n: "Laufschuss", crit: false, run: [16, 26], cap: 1 },
    vogel:   { n: "Treffer im Flug", crit: true, run: [0, 0], cap: 4 }
  };
  /* Güte 0 … 1: meist Mittelmaß, selten kapital */
  function drawScore(r) { r = r || rnd; return clamp(0.16 + 0.8 * (r() + r() + r()) / 3 + (r() < 0.06 ? 0.12 : 0), 0, 1); }
  /* Medaille aus Güte und Trefferzone (Weichschuss höchstens Silber, Laufschuss Bronze) */
  function medalOf(score, zone) {
    const Z = ZONE[zone] || ZONE.koerper;
    const e = score + (Z.crit ? 0.04 : 0);
    const m = e >= 0.9 ? 4 : e >= 0.72 ? 3 : e >= 0.5 ? 2 : 1;
    return Math.min(m, Z.cap);
  }
  function traits(k, s) {
    if (k === "hirsch") {
      const P = 2 * Math.round(3 + s * 5);
      return { P, kg: Math.round(92 + s * 115), name: s < 0.38 ? "Junger Rothirsch" : s < 0.68 ? "Rothirsch" : s < 0.86 ? "Kapitaler Rothirsch" : "Mächtiger Rothirsch",
        troph: P + "-Ender Geweih" };
    }
    if (k === "keiler") {
      const cm = Math.round(8 + s * 16);
      return { cm, kg: Math.round(55 + s * 112), name: s < 0.35 ? "Junger Keiler" : s < 0.7 ? "Keiler" : s < 0.88 ? "Kapitaler Keiler" : "Hauptschwein",
        troph: "Keilerwaffen · " + cm + " cm" };
    }
    const cm = Math.round(36 + s * 26);
    return { cm, kg: Math.round((0.95 + s * 0.65) * 10) / 10, name: s < 0.7 ? "Fasanenhahn" : "Prächtiger Fasanenhahn", troph: (s >= 0.7 ? "Pracht-" : "") + "Fasanenfeder · " + cm + " cm" };
  }
  const trophyId = (k, m) => "tro_" + k + "_" + m;
  /* Lager: zwölf Trophäen (Art × Medaille), Sammler zahlen den vollen Wert (farm.js) */
  function registerItems() {
    if (typeof FITEMS === "undefined") return;
    const nm = { hirsch: "Hirschgeweih", keiler: "Keilerwaffen", fasan: "Fasanenfeder" };
    Object.keys(PRICE).forEach(k => [1, 2, 3, 4].forEach(m => {
      FITEMS[trophyId(k, m)] = { n: nm[k] + " (" + MEDALS[m].n + ")", sg: nm[k] + " (" + MEDALS[m].n + ")", i: MEDALS[m].i, k: "troph", a: 1, u: "", pk: "Trophäe", v: PRICE[k][m], kg: k === "fasan" ? 0.1 : 2, xp: 0, st: "troph", hunt: k, medal: m };
    }));
    if (typeof FSTORE !== "undefined") FSTORE.troph = { n: "Trophäen", i: "🏆", the: "Die Trophäenwand", base: 24, step: 12, cost: [400, 900, 1600, 2600, 4000],
      empty: "Noch keine Trophäen. Der Hochsitz steht an der Wildwiese westlich vom Sägewerk." };
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
      else { beam(q, [0.1, -0.25, 0.08], [-0.12, 0.45, 0.1], 0.04, FC.tail, false); beam(q, [0.11, -0.25, 0.1], [-0.11, 0.45, 0.12], 0.018, FC.tailD, false); }
    });
    return b;
  }
  if (typeof FWM !== "undefined" && FWM.item && !FWM.__huntItem) {
    const base = FWM.item; FWM.item = id => /^tro_/.test(id) ? trophyMesh(id) : base(id); FWM.__huntItem = true;
    if (typeof ITEM_3D !== "undefined") Object.keys(PRICE).forEach(k => [1, 2, 3, 4].forEach(m => ITEM_3D.add(trophyId(k, m))));
  }

  /* --------------------------- Treffertest -------------------------------- */
  /* Strahl o + d·t gegen Kugel (c, r) – Eintritt t oder null */
  function raySphere(o, d, c, r) {
    const ox = o[0] - c[0], oy = o[1] - c[1], oz = o[2] - c[2];
    const a = d[0] * d[0] + d[1] * d[1] + d[2] * d[2], b = 2 * (ox * d[0] + oy * d[1] + oz * d[2]), q = ox * ox + oy * oy + oz * oz - r * r;
    const D = b * b - 4 * a * q;
    if (D < 0) return null;
    const s = Math.sqrt(D), t0 = (-b - s) / (2 * a), t1 = (-b + s) / (2 * a);
    return t1 < 0 ? null : Math.max(0, t0);
  }
  function rayEll(o, d, c, r) {
    return raySphere([(o[0] - c[0]) / r[0], (o[1] - c[1]) / r[1], (o[2] - c[2]) / r[2]], [d[0] / r[0], d[1] / r[1], d[2] / r[2]], [0, 0, 0], 1);
  }
  /* Pose eines Tiers (Weltlage + Kopf- und Laufwinkel) → Strahl in Tierkoordinaten testen */
  function zoneHit(k, pose, o, d) {
    const S0 = SP[k], s = pose.s || 1;
    const lo = unrot([(o[0] - pose.x) / s, (o[1] - (pose.y || 0)) / s, (o[2] - pose.z) / s], pose.rx || 0, pose.ry || 0, pose.rz || 0);
    const ld = unrot([d[0] / s, d[1] / s, d[2] / s], pose.rx || 0, pose.ry || 0, pose.rz || 0);
    const hits = [];
    const tb = rayEll(lo, ld, S0.body.c, S0.body.r); if (tb != null) hits.push(["body", tb]);
    /* Kopf und Träger: Punkte des Kopf-Knotens in Tierkoordinaten */
    const hp = pt => { const p = rot(pt, pose.hrx || 0, pose.hry || 0, 0); return [S0.neck[0] + p[0], S0.neck[1] + p[1], S0.neck[2] + p[2]]; };
    const th = raySphere(lo, ld, hp(S0.head.c), S0.head.r); if (th != null) hits.push(["kopf", th]);
    const [n0, n1] = S0.neckZ;
    for (let i = 0; i <= 4; i++) { const u = i / 4, t = raySphere(lo, ld, hp([lerp(n0[0], n1[0], u), lerp(n0[1], n1[1], u), lerp(n0[2], n1[2], u)]), S0.neckR); if (t != null) hits.push(["hals", t]); }
    S0.hip.forEach((h, i) => {
      const a = (pose.legs && pose.legs[i]) || 0;
      for (let j = 1; j <= 4; j++) { const p = rot([0, -S0.legL * j / 4.3, 0], a, 0, 0), t = raySphere(lo, ld, [h[0] + p[0], h[1] + p[1], h[2] + p[2]], 0.065); if (t != null) hits.push(["lauf", t]); }
    });
    if (!hits.length) return null;
    hits.sort((a, b) => a[1] - b[1]);
    let [part, t] = hits[0];
    let zone = part;
    if (part === "body") {
      if (k === "fasan") zone = "vogel";
      else if (S0.heart && raySphere(lo, ld, S0.heart.c, S0.heart.r) != null) zone = "herz";
      else if (S0.lung && raySphere(lo, ld, S0.lung.c, S0.lung.r) != null) zone = "lunge";
      else zone = "koerper";
    } else if (k === "fasan") zone = part === "kopf" ? "kopf" : "vogel";
    return { zone, t };
  }

  /* --------------------------- Spielstand --------------------------------- */
  function st() {
    const F = typeof S !== "undefined" && S.farm;
    if (!F) return null;
    const H = F.hunt || (F.hunt = { stock: 4, at: S.time, shots: 0, kills: 0, log: [], best: 0 });
    /* Wild kommt zurück: alle 90 Spielminuten eins, höchstens vier */
    const gain = Math.floor((S.time - H.at) / 90);
    if (gain > 0) { H.stock = Math.min(4, H.stock + gain); H.at += gain * 90; }
    if (H.stock >= 4) H.at = S.time;
    return H;
  }
  const open = () => typeof farmAreaOpen === "function" && farmAreaOpen("wald");

  /* ------------------------------ Welt ------------------------------------ */
  const W = { root: null, tag: null };
  function attach(R) {
    W.root = fnode(fmesh("hunt_tower_v107", towerMesh), { x: TW.x, y: 0, z: TW.z, ry: TRY });
    R.nodes.push(W.root);
    return W.root;
  }
  /* Antippen in der Welt: Kasten um den Turm */
  function pick(x, y) {
    if (!FV.R || !W.root) return null;
    const R = FV.R, r = R.ray(x, y);
    const d = R.hitBox(r, [TW.x - 1.6, 0, TW.z - 1.6], [TW.x + 1.6, PH + 2.6, TW.z + 1.6]);
    return d != null ? { d } : null;
  }
  function tagInfo() {
    if (!open()) return null;
    const H = st();
    return { x: TW.x, y: PH + 3.2, z: TW.z, html: "🔭" + (H && H.stock ? "<b>" + H.stock + "</b>" : ""), cls: H && H.stock ? "ready" : "" };
  }
  const dots = n => "●".repeat(n) + "○".repeat(Math.max(0, 4 - n));
  function sheet() {
    if (!open()) { if (typeof openAreaInfo === "function") openAreaInfo("wald"); return; }
    const H = st();
    FV.sheetFn = sheet;
    const best = H.best ? MEDALS[H.best].i + " " + MEDALS[H.best].n : "–";
    const wait = H.stock < 4 ? Math.max(1, Math.ceil(90 - (S.time - H.at))) : 0;
    openFarmSheet(`<div class="fs-h"><span class="fs-ic">🔭</span>Hochsitz an der Wildwiese<small>Wild auf der Lichtung: <b class="hu-dots">${dots(H.stock)}</b>${wait ? " · nächstes Stück in " + fdur(wait) : ""}</small></div>
      <div class="fs-sub">Steig hinauf, such das Wild mit dem Fernglas und warte auf den sauberen Schuss. Herz und Lunge bringen die beste Medaille, ein Fehlschuss vertreibt die Tiere.</div>
      <div class="hu-stats"><span>🎯 ${H.shots} Schüsse</span><span>🏆 ${H.kills} Trophäen</span><span>Beste: ${best}</span></div>
      <div class="fs-row"><button class="btn" id="huUp">🪜 Hinaufsteigen</button><button class="btn tiny ghost" id="huStore">🏆 Trophäen ansehen</button></div>`, "hunt");
    $("#huUp").onclick = () => { closeFarmSheet(); begin(); };
    $("#huStore").onclick = () => { closeFarmSheet(); if (typeof openFarmStore === "function") openFarmStore("troph"); };
  }

  /* ------------------------------ Sitzung --------------------------------- */
  let X = null;
  const CAM_KEYS = ["tx", "ty", "tz", "dist", "yaw", "pitch", "fov"];
  const camOf = c => { const o = {}; CAM_KEYS.forEach(k => { o[k] = c[k] || 0; }); return o; };
  /* Ich-Perspektive: Auge E, Blick (th, ph) → Kamerawerte (gl3d: Auge = Ziel + dist · (cos yaw cos pitch, sin pitch, sin yaw cos pitch)) */
  function camLook(E, th, ph, fov, dist) {
    dist = dist || CAMD;
    const d = [Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph)];
    return { tx: E[0] + d[0] * dist, ty: E[1] + d[1] * dist, tz: E[2] + d[2] * dist, dist, yaw: th + Math.PI, pitch: -ph, fov };
  }
  function camLerp(a, b, t) {
    const o = {};
    CAM_KEYS.forEach(k => { o[k] = k === "yaw" ? a.yaw + angN(b.yaw - a.yaw) * t : lerp(a[k], b[k], t); });
    return o;
  }
  /* Kamera kreist um ein liegendes Stück */
  function camOrbit(A, yaw) {
    const c = A.center || [A.x, 0.4, A.z], d = SP[A.k].orbit * (A.s || 1);
    return { tx: c[0], ty: c[1] + 0.05, tz: c[2], dist: d, yaw, pitch: 0.34, fov: 0.72 };
  }

  function canBegin() { return !!(typeof FV !== "undefined" && FV.R && FV.on && !FV.fp && document.body.classList.contains("tab-farm") && !(typeof MG !== "undefined" && MG.on)); }
  function begin() {
    if (!canBegin()) return false;
    const R = FV.R, c = R.cam, H = st();
    FV.focusId = (FV.focusId || 0) + 1; FV.focusing = false;
    const th0 = Math.atan2(CZ - EYEP[2], CX - EYEP[0]);
    X = { mode: "in", p: 0, saved: camOf(c), cur: camOf(c), view: "eye", th: th0, ph: -0.3, zoom: 4, fovNow: FOV, fogR: [34, 68],
      animals: [], aid: 0, nodes: [], drops: [], t: 0, spawnT: 2 + rnd() * 3, flyT: 30 + rnd() * 30, kick: 0, reload: 0, breath: { on: false, t: 0, cd: 0, air: 1 },
      msgT: 0, wv: 0, lastTh: th0, lastPh: -0.3, spot: null, target: null, cam: null, hrv: null, stock0: H.stock };
    FV.fp = X;
    document.body.classList.add("fp3d", "fphunt");
    ui();
    /* Wild, das schon da ist (1–2), der Rest kommt nach und nach aus dem Wald */
    const n0 = Math.min(H.stock, 1 + (rnd() < 0.55 ? 1 : 0));
    for (let i = 0; i < n0; i++) spawn(null, false);
    if (!H.stock) msg("Die Lichtung ist ruhig – das Wild kommt in " + fdur(Math.max(1, Math.ceil(90 - (S.time - H.at)))) + " zurück.", 5);
    else msg("Ziehen zum Umsehen · 🔭 Fernglas zum Suchen", 4.5);
    snd("swish");
    return true;
  }
  function addNode(mesh, o, parent) {
    const n = fnode(mesh, Object.assign({ shadow: true }, o || {}));
    if (parent) FV.R.addChild(parent, n); else { FV.R.nodes.push(n); X.nodes.push(n); }
    return n;
  }

  /* Tier erzeugen: am Rand hereinkommend (enter) oder schon auf der Wiese */
  function spawn(k, enter) {
    const H = st(), live = X.animals.filter(a => a.st !== "gone");
    if (!k) { const r = rnd(); k = r < 0.45 ? "hirsch" : r < 0.8 ? "keiler" : "fasan"; }
    const S0 = SP[k], score = drawScore(), T = traits(k, score), s = lerp(S0.s0, S0.s1, score);
    const towA = Math.atan2(TW.z - CZ, TW.x - CX);
    let a = towA + Math.PI + (rnd() - 0.5) * 3.6;                   /* nicht direkt am Hochsitz */
    const rr = k === "keiler" ? 0.78 + rnd() * 0.25 : 0.15 + rnd() * 0.6;
    let x, z;
    if (enter) { const e = edgeR(a) + 5; x = CX + Math.cos(a) * e; z = CZ + Math.sin(a) * e; }
    else { x = CX + Math.cos(a) * edgeR(a) * rr; z = CZ + Math.sin(a) * edgeR(a) * rr; }
    const A = { id: ++X.aid, k, score, T, s, x, z, y: 0, ry: rnd() * 6.28, rx: 0, rz: 0, st: enter ? "walk" : k === "fasan" ? "peck" : k === "keiler" ? "root" : "graze", t: 2 + rnd() * 5,
      tx: 0, tz: 0, alert: 0, seen: false, ph: rnd() * 6, gait: 0, hits: [], dist: 0, look: 0, hry: 0, hrx: 0.4, legs: [0, 0, 0, 0], fly: null };
    if (enter) { const b = a + (rnd() - 0.5) * 0.8, q = edgeR(b) * (k === "keiler" ? 0.85 : 0.35 + rnd() * 0.4); A.tx = CX + Math.cos(b) * q; A.tz = CZ + Math.sin(b) * q; A.ry = Math.atan2(A.tx - x, A.tz - z); }
    build(A);
    X.animals.push(A);
    return A;
  }
  function build(A) {
    const k = A.k, key = "hunt_" + k;
    if (k === "hirsch") {
      A.node = addNode(fmesh(key + "_b", deerBody), { x: A.x, z: A.z, ry: A.ry, s: A.s });
      A.head = addNode(fmesh(key + "_h" + A.T.P + "_" + Math.round(A.score * 10), () => deerHead(A.T.P, A.score)), { x: SP.hirsch.neck[0], y: SP.hirsch.neck[1], z: SP.hirsch.neck[2] }, A.node);
      A.legN = SP.hirsch.hip.map((h, i) => addNode(fmesh(key + "_l" + (i < 2 ? "f" : "b"), () => deerLeg(i < 2)), { x: h[0], y: h[1], z: h[2] }, A.node));
    } else if (k === "keiler") {
      A.node = addNode(fmesh(key + "_b", boarBody), { x: A.x, z: A.z, ry: A.ry, s: A.s });
      A.head = addNode(fmesh(key + "_h" + Math.round(A.score * 10), () => boarHead(A.score)), { x: SP.keiler.neck[0], y: SP.keiler.neck[1], z: SP.keiler.neck[2] }, A.node);
      A.legN = SP.keiler.hip.map(h => addNode(fmesh(key + "_l", boarLeg), { x: h[0], y: h[1], z: h[2] }, A.node));
    } else {
      A.node = addNode(fmesh(key + "_b", phBody), { x: A.x, z: A.z, ry: A.ry, s: A.s });
      A.head = addNode(fmesh(key + "_h", phHead), { x: SP.fasan.neck[0], y: SP.fasan.neck[1] - 0.08, z: SP.fasan.neck[2] }, A.node);
      A.wings = [-1, 1].map(s => addNode(fmesh(key + "_w" + s, () => phWing(s)), { x: s * 0.07, y: 0.29, z: 0.02, visible: false }, A.node));
      A.legN = [];
    }
  }
  function unbuild(A) {
    const i = FV.R.nodes.indexOf(A.node); if (i >= 0) FV.R.nodes.splice(i, 1);
    const j = X.nodes.indexOf(A.node); if (j >= 0) X.nodes.splice(j, 1);
  }
  const alive = A => A.st !== "gone" && A.st !== "dead" && A.st !== "fall" && A.st !== "drop";
  const distTo = (A, p) => Math.hypot(A.x - p[0], A.z - p[2]);

  /* Unruhe: Schuss, schnelle Bewegung */
  function scare(amount, from, rad, except) {
    X.animals.forEach(A => {
      if (A === except || !alive(A)) return;
      const d = Math.hypot(A.x - from[0], A.z - from[2]);
      if (d > rad) return;
      A.alert += amount * SP[A.k].sens * (A.k === "keiler" ? 1.25 : 1) * clamp(1.4 - d / rad, 0.3, 1.2);
    });
  }
  function fleeFrom(A, from) {
    const a = Math.atan2(A.z - from[2], A.x - from[0]) + (rnd() - 0.5) * 0.9, e = edgeR(a) + 16;
    A.tx = CX + Math.cos(a) * e; A.tz = CZ + Math.sin(a) * e;
    if (A.k === "fasan") return takeOff(A, a);
    A.st = "flee"; A.t = 0;
  }
  function takeOff(A, a) {
    A.st = "fly"; A.t = 0;
    const sp = 6 + rnd() * 2.5;
    A.fly = { vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 3.6, turn: (rnd() - 0.5) * 0.7, top: 6.5 + rnd() * 3 };
    A.wings.forEach(w => { w.visible = true; });
    snd("swish");
  }

  /* Ein Bild Tier-Logik */
  function stepAnimal(A, dt, time) {
    const S0 = SP[A.k], n = A.node;
    A.t -= dt;
    A.alert = Math.max(0, A.alert - dt * 0.05);
    let sp = 0, head = 0.35, look = 0;
    const toward = (tx, tz, v, turn) => {
      const dx = tx - A.x, dz = tz - A.z, d = Math.hypot(dx, dz);
      if (d < 0.15) return d;
      const want = Math.atan2(dx, dz);
      A.ry += clamp(angN(want - A.ry), -turn * dt, turn * dt);
      const step = Math.min(d, v * dt * clamp(1.2 - Math.abs(angN(want - A.ry)) / 1.5, 0.15, 1));
      A.x += Math.sin(A.ry) * step; A.z += Math.cos(A.ry) * step;
      return d;
    };
    if (alive(A) && A.st !== "flee" && A.st !== "hit" && A.st !== "hurt" && A.st !== "fly") {
      if (A.alert > 1) fleeFrom(A, EYEP);
      else if (A.alert > 0.5 && A.st !== "look") { A.st = "look"; A.t = 1.5 + rnd() * 2; }
    }
    switch (A.st) {
      case "graze": head = 2.5; sp = 0;
        if (rnd() < dt * 0.15) { A.x += Math.sin(A.ry) * 0.08; A.z += Math.cos(A.ry) * 0.08; A.gait += 0.6; }
        if (A.t <= 0) { const r = rnd(); if (r < 0.45) { A.st = "look"; A.t = 1.5 + rnd() * 2.5; } else { pickWalk(A); } }
        break;
      case "peck": head = 0.9 + Math.max(0, Math.sin(time * 9 + A.ph)) * 0.6;
        if (A.t <= 0) { if (rnd() < 0.5) { A.st = "look"; A.t = 1 + rnd() * 1.5; } else pickWalk(A); }
        break;
      case "root": head = 0.65 + Math.sin(time * 6 + A.ph) * 0.08; sp = 0.25;
        toward(A.tx, A.tz, 0.25, 1.2);
        if (A.t <= 0) pickWalk(A);
        break;
      case "look": head = 0.15; look = 1;
        if (A.alert > 0.45) A.look = angN(Math.atan2(EYEP[0] - A.x, EYEP[2] - A.z) - A.ry);
        else A.look = Math.sin(time * 0.7 + A.ph) * 0.8;
        if (A.t <= 0 && A.alert < 0.5) { if (A.k === "fasan") { A.st = "peck"; A.t = 2 + rnd() * 3; } else if (A.k === "keiler") { pickWalk(A); } else { A.st = "graze"; A.t = 4 + rnd() * 6; } }
        break;
      case "walk": {
        sp = A.k === "keiler" && A.trot ? 2.2 : S0.walk; head = A.k === "keiler" ? 0.5 : 0.25;
        const d = toward(A.tx, A.tz, sp, 1.6);
        if (d < 0.3 || A.t < -25) { if (A.k === "keiler") { if (rnd() < 0.55) { A.st = "root"; A.t = 1.5 + rnd() * 2.5; A.tx = A.x + Math.sin(A.ry) * 0.6; A.tz = A.z + Math.cos(A.ry) * 0.6; } else pickWalk(A); } else if (A.k === "fasan") { A.st = "peck"; A.t = 2 + rnd() * 4; } else { A.st = "graze"; A.t = 5 + rnd() * 7; } }
        /* Wildschwein: unberechenbar – wechselt unterwegs die Richtung */
        if (A.k === "keiler" && rnd() < dt * 0.35) pickWalk(A, true);
        break;
      }
      case "flee": case "hurt": case "hit": {
        sp = A.st === "hit" ? S0.run * 0.85 : S0.run; head = 0.15;
        toward(A.tx, A.tz, sp, 3.2);
        A.dist += sp * dt;
        if (A.st !== "flee") trail(A);
        if (A.st !== "flee" && A.dist >= A.runL) { A.st = "fall"; A.t = 0.75; A.side = rnd() < 0.5 ? -1 : 1; }
        if (A.st === "flee" && polar(A.x, A.z).d > edgeR(polar(A.x, A.z).a) + 13) { A.st = "gone"; unbuild(A); }
        break;
      }
      case "fly": {
        const f = A.fly;
        A.t += dt * 2;                                                     /* t zählt hier hoch (Flugzeit) */
        const a = Math.atan2(f.vz, f.vx) + f.turn * dt, v = Math.hypot(f.vx, f.vz);
        f.vx = Math.cos(a) * v; f.vz = Math.sin(a) * v;
        f.vy = A.y < f.top ? Math.max(0.6, f.vy - dt * 0.8) : Math.min(0, f.vy + (f.top - A.y) * dt);
        A.x += f.vx * dt; A.z += f.vz * dt; A.y += f.vy * dt;
        A.ry = Math.atan2(f.vx, f.vz); A.rx = -f.vy * 0.06;
        const flap = A.t < 3.4 || Math.sin(A.t * 0.9) > 0.3;
        const wa = flap ? Math.sin(time * 26 + A.ph) * 1.0 : -0.12;
        A.wings.forEach((w, i) => { w.rz = (i ? 1 : -1) * wa; });
        head = 0.1;
        if (polar(A.x, A.z).d > CR + 40) { A.st = "gone"; unbuild(A); }
        break;
      }
      case "drop": {                                                        /* getroffener Vogel fällt */
        A.fly.vy -= 14 * dt; A.y = Math.max(S0.lie, A.y + A.fly.vy * dt); A.x += A.fly.vx * dt * 0.3; A.z += A.fly.vz * dt * 0.3;
        A.rz += dt * 6; A.wings.forEach((w, i) => { w.rz = (i ? 1 : -1) * 0.5; });
        if (A.y <= S0.lie + 0.001) { A.st = "dead"; A.t = 0; A.rz = 1.4; A.rx = 0; A.deadAt = X.t; settle(A); }
        break;
      }
      case "fall": {
        const k = ss(1 - A.t / 0.75);
        A.rz = A.side * k * 1.45; A.y = S0.lie * A.s * k;
        head = 0.2 + k * 0.6;
        if (A.t <= 0) { A.st = "dead"; A.deadAt = X.t; settle(A); }
        break;
      }
      case "dead": head = 0.8; break;
    }
    /* Kopf, Läufe, Gang */
    A.gait += sp * dt * (A.k === "keiler" ? 9 : A.k === "fasan" ? 14 : 5.2);
    A.hrx += (head - A.hrx) * Math.min(1, dt * 4);
    A.hry += ((look ? A.look : 0) * clamp(S0.look, 0, 1) - A.hry) * Math.min(1, dt * 3);
    const run = sp > 2.5, amp = sp > 0.05 ? (run ? 0.75 : 0.42) : 0;
    A.legs = A.legs.map((_, i) => {
      if (A.st === "dead" || A.st === "fall") return (i < 2 ? -0.35 : 0.35);
      const ph = run ? (i < 2 ? 0 : Math.PI) + (i % 2) * 0.35 : [0, Math.PI, Math.PI, 0][i];
      return Math.sin(A.gait + ph) * amp;
    });
    n.x = A.x; n.z = A.z; n.ry = A.ry; n.rz = A.rz; n.rx = A.st === "fly" || A.st === "drop" ? A.rx : run ? Math.sin(A.gait * 2) * 0.05 : A.st === "graze" ? 0.06 : 0;
    n.y = A.st === "fly" || A.st === "drop" ? A.y : A.st === "dead" || A.st === "fall" ? A.y : run ? Math.abs(Math.sin(A.gait)) * 0.12 * A.s : 0;
    if (A.head) { A.head.rx = A.k === "fasan" ? A.hrx * 0.6 - 0.2 : A.hrx - 0.55; A.head.ry = A.hry; }
    (A.legN || []).forEach((L, i) => { L.rx = A.legs[i]; });
  }
  function pickWalk(A, quick) {
    const a = rnd() * 6.28;
    const r = A.k === "keiler" ? 0.8 + rnd() * 0.3 : 0.1 + rnd() * 0.65;
    let tx = CX + Math.cos(a) * edgeR(a) * r, tz = CZ + Math.sin(a) * edgeR(a) * r;
    if (Math.hypot(tx - TW.x, tz - TW.z) < 6) { tx = CX; tz = CZ; }
    if (quick || A.k === "keiler") { const b = A.ry + (rnd() - 0.5) * 2.6, l = 3 + rnd() * 5; tx = A.x + Math.sin(b) * l; tz = A.z + Math.cos(b) * l; if (!inMeadow(tx, tz, 3) || Math.hypot(tx - TW.x, tz - TW.z) < 6) { tx = CX + (A.x - CX) * 0.8; tz = CZ + (A.z - CZ) * 0.8; } }
    A.tx = tx; A.tz = tz; A.st = "walk"; A.t = 0; A.trot = A.k === "keiler" && rnd() < 0.35;
  }
  /* Schweißfährte: alle 0,9 Einheiten ein Tropfen */
  function trail(A) {
    const L = A.lastDrop;
    if (L && Math.hypot(A.x - L[0], A.z - L[1]) < 0.9) return;
    A.lastDrop = [A.x, A.z];
    const n = addNode(fmesh("hunt_drop", dropMesh), { x: A.x + (rnd() - 0.5) * 0.3, z: A.z + (rnd() - 0.5) * 0.3, ry: rnd() * 6.28, shadow: false });
    X.drops.push({ n, a: A.id, x: n.x, z: n.z });
  }
  /* liegendes Stück: Mitte für Kamera und Bildschirm */
  function settle(A) {
    const S0 = SP[A.k], c = rot(S0.body.c.map(v => v * A.s), A.rx, A.ry, A.rz);
    A.center = [A.x + c[0], (A.y || 0) + c[1], A.z + c[2]];
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
      <div class="hu-top"><div class="hu-info"><b>Hochsitz an der Wildwiese</b><small class="hu-sub"></small></div><button class="hu-x" data-hu="exit" aria-label="Hochsitz verlassen">✕</button></div>
      <div class="hu-msg" hidden></div>
      <div class="hu-range" hidden></div>
      <div class="hu-bar"></div>
      <div class="hu-card" hidden></div>`;
    host.appendChild(el);
    X.ui = el;
    X.bar = el.querySelector(".hu-bar"); X.ov = el.querySelector(".hu-ov"); X.marks = el.querySelector(".hu-marks"); X.spotEl = el.querySelector(".hu-spot");
    X.msgEl = el.querySelector(".hu-msg"); X.sub = el.querySelector(".hu-sub"); X.card = el.querySelector(".hu-card"); X.range = el.querySelector(".hu-range");
    renderBar();
    /* Umsehen: ziehen (Maus oder Finger); Mausrad zoomt im Zielfernrohr */
    let P = null;
    el.addEventListener("pointerdown", e => {
      if (e.target.closest("button,.hu-card")) return;
      P = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { el.setPointerCapture(e.pointerId); } catch (er) { /* egal */ }
    });
    el.addEventListener("pointermove", e => {
      if (!P || P.id !== e.pointerId || !X || X.mode !== "hold" || (X.view !== "eye" && X.view !== "bino" && X.view !== "scope")) return;
      const dx = e.clientX - P.x, dy = e.clientY - P.y; P.x = e.clientX; P.y = e.clientY;
      const k = Math.tan(X.fovNow / 2) * 2 / Math.max(200, FV.R.h);
      X.th -= dx * k; X.ph = clamp(X.ph + dy * k, -0.85, 0.42);
    });
    const up = e => { if (P && P.id === e.pointerId) P = null; };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", e => { if (X && X.view === "scope") { e.preventDefault(); zoomStep(e.deltaY < 0 ? 1 : -1); } }, { passive: false });
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-hu]"); if (!b || !X) return;
      e.stopPropagation();
      const a = b.dataset.hu;
      if (a === "exit") return exitAsk();
      if (a === "bino") return setView(X.view === "bino" ? "eye" : "bino");
      if (a === "scope") return setView("scope");
      if (a === "eye") return setView("eye");
      if (a === "zoom") return zoomStep(1, true);
      if (a === "fire") return fire();
      if (a === "go") return goHarvest(X.target);
      if (a === "track") return goTrack(X.target);
      if (a === "keep") return keepTrophy();
      if (a === "sell") return keepTrophy(true);
      if (a === "leave") return end();
      if (a === "stay") { X.card.hidden = true; return; }
    });
    /* Atem anhalten: gedrückt halten */
    el.addEventListener("pointerdown", e => { const b = e.target.closest('[data-hu="breath"]'); if (!b || !X) return; e.preventDefault(); e.stopPropagation(); breath(true); });
    const rel = () => { if (X && X.breath.on) breath(false); };
    el.addEventListener("pointerup", rel); el.addEventListener("pointercancel", rel); el.addEventListener("pointerleave", rel);
    X.key = e => {
      if (!X) return;
      if (e.code === "Space") { e.preventDefault(); breath(e.type === "keydown"); }
      else if (e.type === "keydown" && (e.code === "Enter" || e.code === "KeyF") && X.view === "scope") fire();
      else if (e.type === "keydown" && e.code === "KeyB" && X.view !== "harvest") setView(X.view === "bino" ? "eye" : "bino");
      else if (e.type === "keydown" && e.code === "KeyG" && X.view !== "harvest") setView("scope");
      else if (e.type === "keydown" && e.code === "Escape") { if (X.view === "bino" || X.view === "scope") setView("eye"); else exitAsk(); }
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
    X.ui.className = "v-" + v;
    drawOverlay();
  }
  function setView(v) {
    if (!X || X.mode !== "hold" || X.view === "harvest" || X.view === "track" || X.view === "back") return;
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
    snd("tap");
  }
  function breath(on) {
    const B = X.breath;
    if (on && X.view === "scope" && !B.on && B.cd <= 0 && B.air > 0.3) { B.on = true; B.t = 0; }
    else if (!on && B.on) { B.on = false; B.cd = 1.2 + B.t * 0.6; }
  }
  function exitAsk() {
    if (!X || X.mode !== "hold") return;
    if (X.view === "harvest" || X.view === "track" || X.view === "back") return;
    end();
  }

  /* Overlay: Fernglas (zwei Kreise) oder Zielfernrohr (Mil-Dot) */
  function drawOverlay() {
    if (!X || !X.ov || !FV.R) return;
    const w = FV.R.w, h = FV.R.h, m = Math.min(w, h), cx = w / 2, cy = h / 2, v = X.view;
    let s = "";
    if (v === "bino") {
      const r = m * 0.37, dx = r * 0.62;
      /* weicher Rand nur außen an der Vereinigung beider Kreise (Weichzeichner auf der Maske) */
      s = `<defs><filter id="huB" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${Math.round(r * 0.07)}"/></filter>
        <mask id="huM"><rect width="${w}" height="${h}" fill="#fff"/><g filter="url(#huB)"><circle cx="${cx - dx}" cy="${cy}" r="${r * 0.97}" fill="#000"/><circle cx="${cx + dx}" cy="${cy}" r="${r * 0.97}" fill="#000"/></g></mask></defs>
        <rect width="${w}" height="${h}" fill="#05080a" fill-opacity=".95" mask="url(#huM)"/>
        <g stroke="#e9f2ec" stroke-opacity=".55" stroke-width="1.2"><line x1="${cx - 14}" y1="${cy}" x2="${cx - 5}" y2="${cy}"/><line x1="${cx + 5}" y1="${cy}" x2="${cx + 14}" y2="${cy}"/><line x1="${cx}" y1="${cy - 14}" x2="${cx}" y2="${cy - 5}"/><line x1="${cx}" y1="${cy + 5}" x2="${cx}" y2="${cy + 14}"/></g>
        <circle class="hu-ring" cx="${cx}" cy="${cy}" r="${m * 0.17}" fill="none" stroke="#e9f2ec" stroke-opacity=".28" stroke-width="1" stroke-dasharray="3 5"/>`;
    } else if (v === "scope") {
      const r = m * 0.44, g = r * 0.075;
      let dots = "";
      for (let i = 1; i <= 5; i++) [[g * i, 0], [-g * i, 0], [0, g * i], [0, -g * i]].forEach(([x, y]) => { dots += `<circle cx="${cx + x}" cy="${cy + y}" r="1.9"/>`; });
      s = `<defs><mask id="huM"><rect width="${w}" height="${h}" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#000"/></mask>
        <radialGradient id="huV" cx="50%" cy="50%" r="50%"><stop offset="72%" stop-color="#000" stop-opacity="0"/><stop offset="96%" stop-color="#000" stop-opacity=".7"/><stop offset="100%" stop-color="#000" stop-opacity="1"/></radialGradient></defs>
        <rect width="${w}" height="${h}" fill="#030405" mask="url(#huM)"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#huV)"/>
        <g stroke="#0b0c0d" fill="none"><line x1="${cx - r}" y1="${cy}" x2="${cx - r * 0.3}" y2="${cy}" stroke-width="4"/><line x1="${cx + r * 0.3}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke-width="4"/>
          <line x1="${cx}" y1="${cy + r * 0.3}" x2="${cx}" y2="${cy + r}" stroke-width="4"/><line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy - r * 0.3}" stroke-width="4"/>
          <line x1="${cx - r * 0.3}" y1="${cy}" x2="${cx + r * 0.3}" y2="${cy}" stroke-width="1.1"/><line x1="${cx}" y1="${cy - r * 0.3}" x2="${cx}" y2="${cy + r * 0.3}" stroke-width="1.1"/></g>
        <g fill="#0b0c0d">${dots}</g><circle cx="${cx}" cy="${cy}" r="1.6" fill="#ff3b2e"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="none" stroke="#2a2d30" stroke-width="3"/>`;
    }
    X.ov.innerHTML = s;
    X.ov.setAttribute("viewBox", `0 0 ${w} ${h}`);
    X.ovKey = w + "x" + h + v;
  }

  /* ------------------------------ Schuss ---------------------------------- */
  function aimRay() {
    const R = FV.R;
    R.updateCamera();
    return R.ray(R.w / 2, R.h / 2);
  }
  /* Bäume zwischen Auge und Ziel (Stämme als senkrechte Zylinder) */
  function treeBlock(o, d, tMax) {
    let best = null;
    const test = (x, z, r, hgt) => {
      const ox = o[0] - x, oz = o[2] - z, a = d[0] * d[0] + d[2] * d[2], b = 2 * (ox * d[0] + oz * d[2]), c = ox * ox + oz * oz - r * r, D = b * b - 4 * a * c;
      if (D < 0 || a < 1e-9) return;
      const t = (-b - Math.sqrt(D)) / (2 * a);
      if (t < 0.3 || t > tMax) return;
      const y = o[1] + d[1] * t;
      if (y > hgt || y < 0) return;
      if (best == null || t < best) best = t;
    };
    (S.farm.trees || []).forEach(t => { if (t.st === "up" && Math.abs(t.x - o[0]) < 60 && Math.abs(t.z - o[2]) < 60) test(t.x, t.z, 0.16 + 0.06 * (t.sz || 1), 2.2 + 1.2 * (t.sz || 1)); });
    if (WV.bgChunks) for (const c of WV.bgChunks.values()) {
      if (c.x0 > o[0] + 60 || c.x0 + WGRID.chunk < o[0] - 60 || c.z0 > o[2] + 60 || c.z0 + WGRID.chunk < o[2] - 60) continue;
      c.trees.forEach(t => test(t.fx != null ? t.fx : t.x, t.fzz != null ? t.fzz : t.z, 0.22 * (t.fs || t.s || 1), 3.6));
    }
    return best;
  }
  function poseOf(A) { return { x: A.x, y: A.node.y, z: A.z, ry: A.ry, rx: A.node.rx, rz: A.node.rz, s: A.s, hrx: A.head ? A.head.rx : 0, hry: A.head ? A.head.ry : 0, legs: A.legs }; }
  function fire() {
    if (!X || X.view !== "scope" || X.mode !== "hold") return;
    if (X.reload > 0) { snd("bad"); return; }
    const H = st(), r = aimRay();
    H.shots++;
    X.reload = 1.25; X.kick = 1;
    shotSound();
    /* Mündungsrauch und Rückstoß */
    const fw = r.d, E = FV.R.eye;
    FV.R.burst({ x: E[0] + fw[0] * 1.4, y: E[1] + fw[1] * 1.4 - 0.15, z: E[2] + fw[2] * 1.4, n: 9, col: [[0.86, 0.86, 0.84, 0.55], [0.72, 0.72, 0.74, 0.5]], speed: 0.5, up: 0.35, g: 0.45, drag: 2.4, life: 1.5, size: 0.22, spread: 0.3 });
    let best = null;
    X.animals.forEach(A => {
      if (!alive(A) && !(A.st === "hit" || A.st === "hurt")) return;
      if (A.st === "gone" || A.st === "dead" || A.st === "fall") return;
      const h = zoneHit(A.k, poseOf(A), r.o, r.d);
      if (h && (!best || h.t < best.t)) best = { A, h };
    });
    const tb = treeBlock(r.o, r.d, best ? best.h.t : 90);
    const g = FV.R.ground(FV.R.w / 2, FV.R.h / 2, 0);
    if (best && tb == null) {
      const A = best.A, at = [r.o[0] + r.d[0] * best.h.t, r.o[1] + r.d[1] * best.h.t, r.o[2] + r.d[2] * best.h.t];
      const dm = Math.round(Math.hypot(at[0] - E[0], at[1] - E[1], at[2] - E[2]) * M_PER_U);
      setTimeout(() => hitSound(), Math.min(400, dm * 1.4));
      FV.R.burst({ x: at[0], y: at[1], z: at[2], n: 6, col: [[0.45, 0.1, 0.08, 1], [0.35, 0.25, 0.18, 1]], speed: 0.9, up: 0.6, size: 0.05, life: 0.6, shape: 1 });
      onHit(A, best.h.zone, dm);
      scare(1.6, at, 70, A);
    } else {
      const t = tb != null ? tb : g ? Math.hypot(g[0] - r.o[0], g[1] - r.o[1], g[2] - r.o[2]) : null;
      if (t != null && t < 95) {
        const p = [r.o[0] + r.d[0] * t, Math.max(0.05, r.o[1] + r.d[1] * t), r.o[2] + r.d[2] * t];
        FV.R.burst({ x: p[0], y: p[1], z: p[2], n: 8, col: tb != null ? [[0.55, 0.4, 0.26, 1], [0.7, 0.55, 0.36, 1]] : [[0.5, 0.42, 0.3, 1], [0.38, 0.5, 0.26, 1]], speed: 1.1, up: 1.4, size: 0.06, life: 0.7, shape: 1 });
        scare(1.6, p, 60);
      } else scare(1.4, EYEP, 60);
      msg(tb != null ? "Die Kugel ging in einen Baum – das Wild flüchtet." : "Vorbei! Das Wild flüchtet.", 2.8, "bad");
    }
    save();
  }
  function onHit(A, zone, dm) {
    A.hits.push(zone); A.dm = A.dm || dm;
    const Z = ZONE[zone];
    if (A.k === "fasan") {
      if (A.st === "fly") { A.st = "drop"; A.fly.vy = Math.min(0, A.fly.vy); }
      else { A.st = "fall"; A.t = 0.45; A.side = 1; }
      A.zone = zone; X.target = A;
      msg("Waidmannsheil! " + A.T.name + " · " + Math.round(dm) + " m", 3, "good");
      return;
    }
    /* Zone: die beste kritische zählt, die Medaille deckelt der schlechteste Treffer */
    const crit = A.hits.find(z => ZONE[z].crit);
    A.zone = crit || zone;
    A.cap = Math.min(...A.hits.map(z => ZONE[z].cap));
    const ZZ = ZONE[A.zone];
    X.target = A;
    /* Nachschuss auf ein flüchtendes Stück: es liegt nach wenigen Metern */
    if ((A.st === "hurt" || A.st === "hit") && crit) { A.runL = Math.min(A.runL, A.dist + lerp(0.5, 2.5, rnd())); A.st = "hit"; msg("Waidmannsheil! Nachschuss · " + ZZ.n + " · " + Math.round(dm) + " m", 3.2, "good"); return; }
    if (A.st === "hurt" || A.st === "hit") { A.runL += 2; return; }
    A.dist = 0;
    const away = Math.atan2(A.z - EYEP[2], A.x - EYEP[0]) + (rnd() - 0.5) * 0.8;
    const L = lerp(ZZ.run[0], ZZ.run[1], rnd());
    A.runL = L;
    A.tx = A.x + Math.cos(away) * (L + 30); A.tz = A.z + Math.sin(away) * (L + 30);
    if (ZZ.crit) {
      if (A.runL < 0.3) { A.st = "fall"; A.t = 0.55; A.side = rnd() < 0.5 ? -1 : 1; }
      else A.st = "hit";
      msg("Waidmannsheil! " + ZZ.n + " · " + Math.round(dm) + " m", 3.2, "good");
    } else {
      A.st = "hurt";
      msg("Getroffen – " + ZZ.n + ". Das Stück flüchtet, achte auf die Schweißfährte.", 4, "warn");
    }
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
  function goHarvest(A) {
    if (!X || !A || A.st !== "dead") return;
    X.view = "harvest"; X.hrv = { A, p: 0, from: camOf(FV.R.cam), yaw: Math.atan2(EYEP[2] - A.center[2], EYEP[0] - A.center[0]) };
    X.card.hidden = true; X.spotEl.hidden = true;
    renderBar();
    snd("swish");
  }
  /* Nachsuche: die Kamera geht die Schweißfährte ab bis zum Stück */
  function goTrack(A) {
    if (!X || !A) return;
    const pts = X.drops.filter(d => d.a === A.id).map(d => [d.x, d.z]);
    if (A.center) pts.push([A.center[0], A.center[2]]);
    if (pts.length < 2) return goHarvest(A);
    X.view = "track"; X.trk = { A, pts, u: 0, p: 0, from: camOf(FV.R.cam) };
    X.card.hidden = true;
    renderBar();
    msg("Nachsuche: Folge der Schweißfährte …", 3);
  }
  function harvestCard(A) {
    const zone = A.zone || "koerper", medal = A.k === "fasan" ? medalOf(A.score, "vogel") : Math.min(medalOf(A.score, zone), A.cap || 4);
    A.medal = medal;
    const M = MEDALS[medal], id = trophyId(A.k, medal), price = PRICE[A.k][medal], room = typeof farmRoom === "function" ? farmRoom(id) : 1;
    const hitsTxt = A.hits.length > 1 ? A.hits.map(z => ZONE[z].n).join(" + ") : ZONE[zone].n;
    const rating = Math.round(A.score * 1000) / 10;
    X.card.innerHTML = `<div class="hu-ch"><span class="hu-medal" style="--mc:${M.c}">${M.i}</span><div><small>Waidmannsheil!</small><b>${esc(A.T.name)}</b></div></div>
      <div class="hu-rows">
        <div><span>Gewicht</span><b>${A.k === "fasan" ? String(A.T.kg).replace(".", ",") : A.T.kg} kg</b></div>
        <div><span>Treffer</span><b>${esc(hitsTxt)}${A.k === "fasan" || zone === "vogel" ? "" : ""} · ${A.dm || "?"} m</b></div>
        <div><span>Trophäe</span><b>${esc(A.T.troph)}</b></div>
        <div><span>Bewertung</span><b>${String(rating).replace(".", ",")} Punkte</b></div>
        <div><span>Medaille</span><b style="color:${M.c}">${M.i} ${M.n}</b></div>
        <div><span>Sammlerwert</span><b>${eur(price)}</b></div>
      </div>
      ${A.cap && A.cap < 4 && A.k !== "fasan" ? `<p class="hu-note">${A.cap === 1 ? "Laufschuss" : "Weichschuss"}: höchstens ${MEDALS[A.cap].n}. Mit einem Herz- oder Lungenschuss wäre mehr drin gewesen.</p>` : ""}
      ${room > 0 ? `<button class="btn hu-keep" data-hu="keep">🏆 Trophäe ins Lager legen</button>`
        : `<p class="hu-note">Die Trophäenwand ist voll.</p><button class="btn hu-keep" data-hu="sell">💰 Gleich an einen Sammler verkaufen · ${eur(price)}</button>`}`;
    X.card.hidden = false;
  }
  function keepTrophy(sell) {
    const A = X && X.hrv && X.hrv.A;
    if (!A || A.kept) return;
    A.kept = true;
    const H = st(), id = trophyId(A.k, A.medal);
    if (sell) { S.money += PRICE[A.k][A.medal]; if (typeof logMoney === "function") logMoney("farm", "Trophäe an Sammler: " + A.T.troph, PRICE[A.k][A.medal]); }
    else farmAdd(id, 1, 3);
    H.kills++; H.stock = Math.max(0, H.stock - 1);
    H.best = Math.max(H.best || 0, A.medal);
    H.log.unshift({ k: A.k, m: A.medal, t: S.time, name: A.T.name, troph: A.T.troph, zone: A.zone, dm: A.dm, s: Math.round(A.score * 1000) / 1000 });
    if (H.log.length > 40) H.log.length = 40;
    if (typeof farmXP === "function") farmXP(XP[A.k][A.medal]);
    snd(A.medal >= 3 ? "level" : "collect");
    save();
    X.card.hidden = true;
    unbuild(A); A.st = "gone";
    X.drops.filter(d => d.a === A.id).forEach(d => { d.n.visible = false; });
    msg((sell ? "Verkauft: " : "Im Lager: ") + A.T.troph + " " + MEDALS[A.medal].i, 3.5, "good");
    /* zurück auf den Hochsitz */
    X.view = "back"; X.back = { p: 0, from: camOf(FV.R.cam) };
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
  const doing = A => ({ graze: "äst", peck: "pickt", root: "bricht im Boden", look: A.alert > 0.45 ? "sichert zu dir" : "sichert", walk: "zieht", flee: "flüchtet", hurt: "flüchtet verletzt", hit: "flüchtet", fly: "fliegt", fall: "bricht zusammen", dead: "liegt", drop: "fällt" })[A.st] || "";

  /* ------------------------------ Schritt --------------------------------- */
  function step(dt, time) {
    if (!X) return;
    const R = FV.R, c = R.cam;
    if (!FV.on || !document.body.classList.contains("tab-farm")) { finish(); return; }
    X.t += dt;
    const H = st();
    /* Sicht und Schwanken */
    const B = X.breath;
    if (B.on) { B.t += dt; B.air = Math.max(0, B.air - dt / 3); if (B.air <= 0) { B.on = false; B.cd = 2.4; } }
    else { B.cd = Math.max(0, B.cd - dt); if (B.cd <= 0) B.air = Math.min(1, B.air + dt / 2.5); }
    const swayK = X.view === "scope" ? (B.on ? 0.1 : B.cd > 0 ? 1.7 : 1) : X.view === "bino" ? 0.45 : 0;
    const sw = 0.0042 * swayK, tt = X.t;
    const swX = (Math.sin(tt * 0.83) * 0.6 + Math.sin(tt * 1.97 + 1.3) * 0.4) * sw, swY = (Math.sin(tt * 0.61 + 0.7) * 0.5 + Math.sin(tt * 1.43) * 0.3) * sw + Math.sin(tt * 1.5) * 0.0016 * (B.on ? 0.1 : 1) * (X.view === "scope" ? 1 : 0);
    X.kick = Math.max(0, X.kick - dt * 5.5);
    X.reload = Math.max(0, X.reload - dt);
    const fovT = X.view === "scope" ? FOV / X.zoom : X.view === "bino" ? FOV / BINO : FOV;
    X.fovNow += (fovT - X.fovNow) * Math.min(1, dt * 10);
    const kick = Math.pow(X.kick, 2) * (0.03 + 0.015 * (X.view === "scope" ? 1 : 0));
    const look = camLook(EYEP, X.th + swX, X.ph + swY + kick, X.fovNow);
    /* Unruhe durch schnelles Umsehen (nur ohne Optik, wenn Wild nah ist) */
    const w = Math.hypot(angN(X.th - X.lastTh), X.ph - X.lastPh) / Math.max(dt, 0.001);
    X.lastTh = X.th; X.lastPh = X.ph;
    if (X.view === "eye" && w > 2.2) X.animals.forEach(A => { if (alive(A)) { const d = distTo(A, EYEP); if (d < 20) A.alert += (w - 2.2) * dt * 0.12 * SP[A.k].sens * (20 - d) / 10; } });

    let goal = look;
    if (X.mode === "in") { X.p = Math.min(1, X.p + dt / 1.7); goal = camLerp(X.saved, look, ss(X.p)); if (X.p >= 1) X.mode = "hold"; }
    else if (X.mode === "out") { X.p = Math.min(1, X.p + dt / 1.4); goal = camLerp(X.from, X.saved, ss(X.p)); if (X.p >= 1) { finish(); return; } }
    else if (X.view === "harvest" && X.hrv) {
      const Hv = X.hrv; Hv.p = Math.min(1, Hv.p + dt / 1.5); Hv.yaw += dt * 0.32 * ss(Hv.p);
      goal = camLerp(Hv.from, camOrbit(Hv.A, Hv.yaw), ss(Hv.p));
      if (Hv.p >= 1 && X.card.hidden && !Hv.A.kept) harvestCard(Hv.A);
    } else if (X.view === "track" && X.trk) {
      const T = X.trk; T.p = Math.min(1, T.p + dt / 1.2);
      T.u = Math.min(T.pts.length - 1, T.u + dt * (T.p < 1 ? 0 : Math.max(2.2, T.pts.length / 5)));      /* höchstens ~5 s */
      const i = Math.floor(T.u), f = T.u - i, a = T.pts[i], b = T.pts[Math.min(T.pts.length - 1, i + 1)];
      const px = lerp(a[0], b[0], f), pz = lerp(a[1], b[1], f), ahead = T.pts[Math.min(T.pts.length - 1, i + 2)];
      const dirA = Math.atan2(ahead[1] - pz, ahead[0] - px);
      const walk = camLook([px - Math.cos(dirA) * 2.2, 1.65, pz - Math.sin(dirA) * 2.2], dirA, -0.42, 0.95);
      goal = camLerp(T.from, walk, ss(T.p));
      X.drops.forEach(d => { if (d.a === T.A.id) d.n.glow = 0.4 + Math.sin(time * 6) * 0.3; });
      if (T.u >= T.pts.length - 1.05) { X.drops.forEach(d => { d.n.glow = 0; }); goHarvest(T.A); }
    } else if (X.view === "back" && X.back) {
      const Bk = X.back; Bk.p = Math.min(1, Bk.p + dt / 1.5);
      goal = camLerp(Bk.from, look, ss(Bk.p));
      if (Bk.p >= 1) { X.view = "eye"; X.back = null; X.hrv = null; renderBar(); }
    }
    CAM_KEYS.forEach(k => { c[k] = goal[k]; });
    FV.touchAt = performance.now();
    /* Wild: neue Tiere kommen, solange Bestand da ist */
    const live = X.animals.filter(A => A.st !== "gone");
    const want = Math.min(H.stock, 4) - live.filter(A => !A.kept).length + (X.view === "eye" || X.view === "bino" || X.view === "scope" ? 0 : -9);
    X.spawnT -= dt;
    if (X.mode === "hold" && want > 0 && X.spawnT <= 0) { spawn(null, true); X.spawnT = 9 + rnd() * 14; }
    X.flyT -= dt;
    if (X.mode === "hold" && H.stock > 0 && X.flyT <= 0 && X.view !== "harvest") {
      X.flyT = 45 + rnd() * 50;
      const A = spawn("fasan", false); A.x = CX + (rnd() - 0.5) * 8; A.z = CZ + (rnd() - 0.5) * 8; takeOff(A, Math.atan2(CZ - EYEP[2], CX - EYEP[0]) + (rnd() - 0.5) * 2.4);
    }
    X.animals.forEach(A => { if (A.st !== "gone") stepAnimal(A, dt, time); });
    X.animals = X.animals.filter(A => A.st !== "gone" || A.kept);
    /* nach dem Treffer: liegt das Stück, geht es zum Trophäen-Bildschirm */
    const T = X.target;
    if (T && X.view !== "harvest" && X.view !== "track" && X.view !== "back" && T.st === "dead") {
      if (!T.offered) {
        T.offered = true;
        const wounded = T.hits.every(z => !ZONE[z].crit) || T.hits[0] === "koerper" || T.hits[0] === "lauf";
        const far = T.center && !inMeadow(T.center[0], T.center[2], 1);
        if (wounded || far) { X.card.innerHTML = `<p class="hu-note">${far ? "Das Stück ist im Wald zusammengebrochen." : "Das Stück liegt."} Folge der Schweißfährte.</p><button class="btn hu-keep" data-hu="track">🩸 Nachsuche</button>`; X.card.hidden = false; }
        else setTimeout(() => { if (X && X.target === T && X.view !== "harvest") goHarvest(T); }, 1200);
      }
    }
    /* UI: Markierungen, Spotten, Hinweise */
    if (X.msgT > 0) { X.msgT -= dt; if (X.msgT <= 0) X.msgEl.hidden = true; }
    if (X.ui) {
      const k = R.w + "x" + R.h + X.view; if (X.ovKey !== k) drawOverlay();
      X.sub.innerHTML = `Wild <b class="hu-dots">${dots(H.stock)}</b> · 🎯 ${H.shots} · 🏆 ${H.kills}`;
      uiMarks(dt);
      const bm = X.bar.querySelector(".hu-breath em b"); if (bm) bm.style.width = Math.round(B.air * 100) + "%";
      const fb = X.bar.querySelector(".hu-fire"); if (fb) fb.classList.toggle("wait", X.reload > 0);
      const hb = X.bar.querySelector(".hu-breath"); if (hb) hb.classList.toggle("on", B.on);
    }
  }
  /* Markierungen gespotteter Tiere; im Fernglas: Spotten in der Mitte, Karte zum Tier */
  function uiMarks(dt) {
    const R = FV.R, w = R.w, h = R.h, m = Math.min(w, h);
    let html = "";
    let near = null, nd = 1e9;
    const cr = X.view === "bino" ? aimRayNoUpdate() : null;
    X.animals.forEach(A => {
      if (!A.node || A.st === "gone" || A.kept) return;
      const top = SP[A.k].body.c[1] * 2 * A.s + (A.k === "hirsch" ? 0.6 : 0.25);
      const p = R.project(A.x, (A.node.y || 0) + top, A.z);
      if (!p || p[2] > 1) return;
      /* im Fernglas: Mitte auf dem Tier (Strahl) oder Körpermitte nah an der Bildmitte */
      if (cr && alive(A)) {
        const c = R.project(A.x, (A.node.y || 0) + SP[A.k].body.c[1] * A.s, A.z);
        const hz = zoneHit(A.k, poseOf(A), cr.o, cr.d), d = hz ? 0 : c ? Math.hypot(c[0] - w / 2, c[1] - h / 2) : 1e9;
        if (d < m * 0.17 && d < nd) { nd = d; near = { A, p }; }
      }
      if (p[0] < -20 || p[0] > w + 20 || p[1] < -20 || p[1] > h + 20) return;
      if (A.seen && (X.view === "eye" || X.view === "bino") && A.st !== "dead") html += `<i class="hu-mk${A.st === "flee" || A.st === "hurt" ? " fl" : ""}" style="transform:translate(${Math.round(p[0])}px,${Math.round(p[1] - 6)}px)">${SP[A.k].i}</i>`;
    });
    X.marks.innerHTML = html;
    /* Fernglas: 0,35 s in der Mitte halten → gespottet */
    if (near) {
      const A = near.A;
      if (!X.spot || X.spot.A !== A) X.spot = { A, t: 0 };
      X.spot.t += dt;
      if (X.spot.t > 0.35 && !A.seen) { A.seen = true; snd("xp"); }
      const dm = Math.round(distTo(A, EYEP) * M_PER_U), ch = chance(A);
      X.spotEl.innerHTML = A.seen ? `<b>${SP[A.k].i} ${esc(A.T.name)}</b><span>${dm} m · ${doing(A)}</span><span>Medaille: ${ch.txt}</span><span>Sammlerwert ca. ${eur(ch.v)}</span>`
        : `<b>Erkennen …</b><i style="width:${Math.round(Math.min(1, X.spot.t / 0.35) * 100)}%"></i>`;
      X.spotEl.hidden = false;
      const sw = X.spotEl.offsetWidth || 180, sh = X.spotEl.offsetHeight || 70;
      X.spotEl.style.transform = `translate(${Math.round(clamp(w / 2 - sw / 2, 8, w - sw - 8))}px,${Math.round(clamp(h / 2 + m * 0.21, 64, h - sh - 96))}px)`;      /* unter dem Fadenkreuz */
    } else if (X.view === "bino") { X.spot = null; X.spotEl.hidden = true; }
    /* Entfernungsmesser im Zielfernrohr: Tier in der Mitte */
    if (X.view === "scope") {
      const r = aimRayNoUpdate();
      let best = null;
      X.animals.forEach(A => { if (!A.node || A.st === "gone" || A.st === "dead" || A.kept) return; const hz = zoneHit(A.k, poseOf(A), r.o, r.d); if (hz && (!best || hz.t < best.t)) best = { A, t: hz.t }; });
      X.range.hidden = false;
      X.range.textContent = best ? Math.round(best.t * M_PER_U) + " m" + (best.A.seen ? " · " + best.A.T.name : "") : X.zoom + "×";
    } else X.range.hidden = true;
  }
  function aimRayNoUpdate() { const R = FV.R; return R.ray(R.w / 2, R.h / 2); }

  /* ------------------------------ Ende ------------------------------------ */
  function end() {
    if (!X || X.mode === "out") return;
    X.mode = "out"; X.p = 0; X.from = camOf(FV.R.cam);
    X.view = "eye"; renderBar();
    if (X.card) X.card.hidden = true;
    if (X.ui) X.ui.classList.add("leaving");
    snd("swish");
  }
  function finish() {
    if (!X) return;
    const c = FV.R.cam;
    CAM_KEYS.forEach(k => { c[k] = X.saved[k]; });
    X.nodes.forEach(n => { const i = FV.R.nodes.indexOf(n); if (i >= 0) FV.R.nodes.splice(i, 1); });
    X.drops.forEach(d => { const i = FV.R.nodes.indexOf(d.n); if (i >= 0) FV.R.nodes.splice(i, 1); });
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
    CX, CZ, CR, TW, TRY, PH, EYEP, M_PER_U, SP, ZONE, MEDALS, PRICE,
    clear, ground, inMeadow, edgeR, attach, pick, tagInfo, sheet, begin, step, end, marketHTML, marketBind, trophyId, trophyMesh,
    zoneHit, medalOf, traits, drawScore, camLook, rot, unrot,
    get on() { return !!X; }, get X() { return X; },
    _spawn: (k, enter) => X && spawn(k, enter), _fire: () => fire(), _view: v => setView(v)
  };
})();
if (typeof module !== "undefined") module.exports = HUNT;
