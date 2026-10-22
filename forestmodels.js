/* =========================================================================
   LOGISTIKA – forestmodels.js   (v91, Blumen/Farn/Steine v92)
   Kleine Low-Poly-Modelle für den lebendigen Wald: Wurzeln, Steine, Zweige, Rinde,
   bemooster Stamm, Pilzgruppen, Blumen, Beeren, Vogelnest, verlorene Fundstücke, Pfotenspuren,
   Schmetterling, Lichtschacht. Erweitert FWM (woodmodels.js). Alle Teile sind bewusst grob:
   wenige Dreiecke, gemeinsame Farbtabelle, werden als Kopien in die Boden-Kacheln gebaut (Blumen und Farn in die Wind-Kacheln).
   ========================================================================= */
(() => {
  "use strict";
  const MB = G3.MB;
  const TC = FWM.TREE_C;

  /* Stein: v 0 rund, 1 zwei Brocken, 2 flache Platte; moss = Moos deckt die Oberseite.
     v92: dunkleres, erdiges Grau – das helle Grau las sich von oben als weißer Fleck, das kleine Moosstück darin als Ring. */
  function stone(v, moss) {
    G3.seed(4800 + v * 7 + (moss ? 100 : 0));
    const b = new MB(), g = [0x7f7a70, 0x736e65, 0x878176][v % 3];
    b.noise(0.12, () => {
      if (v === 1) { b.ico(0.17, g, { y: 0.06, jitter: 0.45, flat: 0.7 }); b.ico(0.1, 0x6e695f, { x: 0.2, z: 0.08, y: 0.04, jitter: 0.5, flat: 0.65 }); }
      else if (v === 2) b.ico(0.2, g, { y: 0.03, jitter: 0.35, flat: 0.4, sx: 1.3 });
      else b.ico(0.15, g, { y: 0.06, jitter: 0.5, flat: 0.75 });
    });
    if (moss) b.noise(0.14, () => b.ico(v === 2 ? 0.2 : 0.15, 0x527f33, { y: v === 2 ? 0.07 : 0.12, x: -0.01, flat: 0.42, jitter: 0.3, sx: v === 2 ? 1.2 : 1 }));
    return b;
  }
  /* sichtbare Wurzeln an einem alten Baum: Wurzelanlauf + sechs Wurzeln, die flach auslaufen und im Boden verschwinden */
  function roots(sp) {
    G3.seed(4840 + sp.length);
    const T = TC[sp] || TC.eiche, bark = T.base || T.bark;
    const c = new MB();
    c.noise(0.1, () => {
      c.cyl(0.4, 0.24, 0.3, 8, bark, { nobot: true });
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + 0.35 * Math.sin(i * 2.1), L = 0.8 + 0.4 * (((i * 37) % 5) / 5);
        c.at({ x: Math.cos(a) * 0.2, y: 0.2, z: Math.sin(a) * 0.2, ry: -a }, () => c.cyl(0.12, 0.035, L, 5, bark, { rz: -Math.PI / 2 - 0.28, nobot: true }));
      }
    });
    return c;
  }
  /* Zweig mit Gabel */
  function stick() {
    G3.seed(4860);
    const b = new MB(), c = 0x6a5038;
    b.cyl(0.016, 0.009, 0.75, 4, c, { rz: Math.PI / 2, x: 0.37, y: 0.02, nobot: true });
    b.cyl(0.011, 0.005, 0.3, 3, 0x75583c, { rz: Math.PI / 2 - 0.5, x: 0.1, y: 0.025, z: 0.02, ry: 0.5, nobot: true, notop: true });
    return b;
  }
  /* Rindenstück */
  function bark() {
    G3.seed(4870);
    const b = new MB();
    b.box(0.34, 0.035, 0.18, 0x6a4a34, { top: 0x8a6a4a, nobot: true, ry: 0.2 });
    b.box(0.2, 0.03, 0.12, 0x5e422e, { top: 0x7e5e40, nobot: true, x: 0.2, z: 0.13, ry: -0.5 });
    return b;
  }
  /* langer, bemooster, umgestürzter Stamm (liegt entlang x), v 0/1: Moos an anderer Stelle */
  function mosslog(v) {
    G3.seed(4880 + v);
    const b = new MB();
    b.noise(0.08, () => {
      b.cyl(0.21, 0.17, 2.7, 8, 0x6b5440, { rz: Math.PI / 2, y: 0.21, x: 1.35, top: 0xcfae80 });
      b.cyl(0.07, 0.05, 0.45, 5, 0x6b5440, { rz: Math.PI / 2 - 0.7, x: -0.25, y: 0.3, z: 0.18, ry: 0.5, top: 0xcfae80 });
    });
    b.noise(0.16, () => {
      const xs = v ? [-0.7, 0.45, 0.95] : [-0.9, 0.1, 0.8];
      xs.forEach((x, i) => b.ico(0.15 + 0.03 * i, [0x5f9a3a, 0x4f8a34, 0x6aa642][i], { x, y: 0.38, flat: 0.42, jitter: 0.35, sx: 1.7 }));
      b.ico(0.13, 0x5f8f3a, { x: 0.3, y: 0.15, z: 0.17, flat: 0.5, jitter: 0.3 });
    });
    return b;
  }
  /* Pilzgruppe: kind red | brown | yellow | white – drei Pilze verschiedener Größe */
  const MUSH = { red: [0xd8332b, 0xffffff], brown: [0xb07a45, 0xc89a62], yellow: [0xe0b040, 0xf0cc60], white: [0xe9e0cc, 0xf6efe0] };
  function mushGroup(kind) {
    G3.seed(4900 + kind.length * 3 + kind.charCodeAt(0));
    const b = new MB(), C = MUSH[kind] || MUSH.brown;
    [[0, 0, 1], [0.15, 0.09, 0.68], [-0.1, 0.1, 0.55]].forEach(([x, z, s]) => {
      b.cyl(0.03 * s, 0.03 * s, 0.13 * s, 4, 0xf2ead8, { x, z, nobot: true, notop: true });
      b.cyl(0.1 * s, 0.045 * s, 0.065 * s, 6, C[0], { x, y: 0.115 * s, z, nobot: true });
      if (kind === "red") b.tri([x - 0.03 * s, 0.182 * s, z + 0.005], [x + 0.005 * s, 0.182 * s, z + 0.045 * s], [x + 0.03 * s, 0.182 * s, z - 0.01], 0xffffff);
    });
    return b;
  }
  /* v92: Blumengruppen, lesbar aus der Spielkamera (die schaut steil von oben): klare Blüte nach oben, kräftiger Stängel,
     ein Blatt am Stängel, dunkle Blattrosette am Boden (vorher lag dort ein hellgrünes Blatt voll in der Sonne → heller Fleck).
     v = Farbe (0 weiß, 1 gelb, 2 violett, 3 rosa) + 4 · Form (0 Sternblüten, 1 Ähren/Glocken). Alle Teile stehen auf y = 0,
     der Pflanzenwind biegt sie mit der Höhe – die Rosette am Boden bleibt liegen. */
  const FCOL = [0xf1ede0, 0xf2c640, 0x8a5cd0, 0xe9799f];
  const FMID = [0xf0c23c, 0xd8902a, 0xf3e3a0, 0xf6e6a8];
  const STEM = 0x4c8634, LEAFC = 0x568f38, ROSE = [0x3f6b2b, 0x4a7a31];
  /* Dreieck, dessen Vorderseite nach oben zeigt (die Kamera sieht von oben) */
  const upTri = (b, A, B, C, col) => { const n = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]); if (n > 0) b.tri(A, B, C, col); else b.tri(A, C, B, col); };
  function flowers(v) {
    G3.seed(4920 + v * 7);
    const b = new MB(), ci = v % 4, form = (v >> 2) & 1, c = FCOL[ci], mid = FMID[ci];
    /* beidseitiges Blatt vom Punkt p in Richtung a */
    const leaf = (p, a, len, w, rise, col) => {
      const dx = Math.cos(a), dz = Math.sin(a), sx = -dz * w, sz = dx * w;
      const m = [p[0] + dx * len * 0.5, p[1] + rise * 0.6, p[2] + dz * len * 0.5], t = [p[0] + dx * len, p[1] + rise, p[2] + dz * len];
      const l = [m[0] + sx, m[1], m[2] + sz], r = [m[0] - sx, m[1], m[2] - sz];
      b.tri(p, l, t, col); b.tri(p, t, l, col); b.tri(p, t, r, col); b.tri(p, r, t, col);
    };
    /* Rosette: vier flache, dunkle Blätter knapp über dem Boden */
    for (let i = 0; i < 4; i++) {
      const a = i * 1.57 + v * 0.7, L = 0.11 + 0.03 * (i % 2), w = 0.04, y = 0.008 + i * 0.002, dx = Math.cos(a), dz = Math.sin(a);
      upTri(b, [0, y, 0], [dx * L * 0.5 - dz * w, y, dz * L * 0.5 + dx * w], [dx * L, y, dz * L], ROSE[i % 2]);
      upTri(b, [0, y, 0], [dx * L, y, dz * L], [dx * L * 0.5 + dz * w, y, dz * L * 0.5 - dx * w], ROSE[(i + 1) % 2]);
    }
    const n = form ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const a = i * 2.2 + v * 0.9, d = 0.035 + (i % 2) * 0.05, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = form ? 0.27 + 0.05 * (i % 2) : 0.17 + (i % 3) * 0.045, lean = 0.1 + 0.06 * (i % 2);
      const tx = x + Math.cos(a) * lean * h, tz = z + Math.sin(a) * lean * h;          /* Spitze steht leicht nach außen */
      /* Stängel (dreikantig, zur Spitze schmaler), zur Spitze hin geneigt */
      b.at({ x, z, ry: -a }, () => b.cyl(0.017, 0.011, h, 3, STEM, { nobot: true, notop: true, rz: -lean }));
      leaf([x + (tx - x) * 0.3, h * 0.3, z + (tz - z) * 0.3], a + 1.9, 0.1, 0.025, 0.05, LEAFC);
      if (!form) {
        /* Sternblüte: fünf (weiß sechs) leicht gewölbte Blütenblätter und eine Mitte */
        const P = ci === 0 ? 6 : 5, R0 = 0.072 + (i % 2) * 0.012;
        for (let k = 0; k < P; k++) {
          const q = k / P * 6.2832 + i, l = q - 0.36, r = q + 0.36;
          const C = [tx, h + 0.006, tz], T = [tx + Math.cos(q) * R0, h + 0.02, tz + Math.sin(q) * R0];
          upTri(b, C, [tx + Math.cos(l) * R0 * 0.6, h + 0.014, tz + Math.sin(l) * R0 * 0.6], T, c);
          upTri(b, C, T, [tx + Math.cos(r) * R0 * 0.6, h + 0.014, tz + Math.sin(r) * R0 * 0.6], c);
        }
        b.cone(0.022, 0.024, 4, mid, { x: tx, y: h + 0.008, z: tz, nobot: true });
      } else {
        /* Ähre: drei Glöckchen übereinander, oben kleiner – Glocke hängt, ihr Rand (Scheibe) zeigt nach oben zur Kamera */
        for (let k = 0; k < 3; k++) {
          const f = 0.58 + k / 3 * 0.34, yy = h * f, xx = x + (tx - x) * f, zz = z + (tz - z) * f, r = 0.05 - k * 0.01;
          b.cone(r, 0.05, 5, k === 2 ? mid : c, { x: xx, y: yy + 0.05, z: zz, rx: Math.PI, nobot: true });
          b.disc(r, 5, k === 2 ? mid : c, { x: xx, y: yy + 0.05, z: zz });
        }
        b.cone(0.016, 0.045, 3, c, { x: tx, y: h, z: tz, nobot: true });
      }
    }
    return b;
  }
  /* v92: Farn – sechs Wedel, jeder in drei Abschnitten mit gefiederten Rändern (Zacken nach außen); steigt vom Boden auf und
     neigt sich zur Spitze wieder ab. Nur nach oben zeigende Flächen (Kamera von oben), 36 Dreiecke. */
  function fern() {
    G3.seed(4930);
    const b = new MB();
    for (let i = 0; i < 6; i++) {
      const a = i * 1.047 + 0.35 * Math.sin(i * 3.1), L = 0.48 + 0.1 * ((i * 5) % 3) / 2, cx = Math.cos(a), cz = Math.sin(a), px = -cz, pz = cx;
      const cA = i % 2 ? 0x4a8f33 : 0x58a23c, cB = i % 2 ? 0x3f7d2c : 0x4c9236;
      const S = [[0, 0.03], [0.3, 0.17], [0.62, 0.2], [1, 0.11]].map(([t, y]) => [cx * L * t, y + 0.03 * (i % 3), cz * L * t]);
      const W = [0.02, 0.085, 0.07, 0];
      for (let k = 0; k < 3; k++) {
        const A = S[k], B = S[k + 1], wm = (W[k] + W[k + 1]) / 2 + 0.02;
        /* Fieder links und rechts: Zacke in der Abschnittsmitte, nach vorn gezogen */
        const M = [(A[0] + B[0]) / 2 + cx * 0.03, (A[1] + B[1]) / 2 - 0.02, (A[2] + B[2]) / 2 + cz * 0.03];
        upTri(b, A, [M[0] + px * wm, M[1], M[2] + pz * wm], B, k % 2 ? cB : cA);
        upTri(b, A, B, [M[0] - px * wm, M[1], M[2] - pz * wm], k % 2 ? cA : cB);
      }
    }
    return b;
  }
  /* einzelne Beere (Farbe je Busch) */
  function berry(col) { const b = new MB(); b.sphere(0.04, 5, 3, col, {}); return b; }
  /* heruntergefallene Frucht */
  function fruit(col) { const b = new MB(); b.sphere(0.045, 5, 4, col, { y: 0.04 }); return b; }
  /* Vogelnest mit drei hellblauen Eiern */
  function nest() {
    G3.seed(4940);
    const b = new MB();
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; b.box(0.1, 0.035, 0.03, i % 2 ? 0x7a5a38 : 0x8a6a42, { x: Math.cos(a) * 0.085, z: Math.sin(a) * 0.085, ry: -a + 1.57, top: 0xa88a58 }); }
    b.disc(0.08, 7, 0x5a4228, { y0: 0.03 });
    for (let i = 0; i < 3; i++) b.sphere(0.03, 5, 3, 0xaedae8, { x: Math.cos(i * 2.1) * 0.032, z: Math.sin(i * 2.1) * 0.032, y: 0.055, sy: 1.25 });
    return b;
  }
  /* verlorenes Fundstück: boot | lantern | basket */
  function lost(kind) {
    G3.seed(4960 + kind.length);
    const b = new MB();
    if (kind === "boot") {
      b.box(0.075, 0.14, 0.08, 0x8a4a2a, { top: 0x6a3a22, rz: 1.45, x: 0.04, y: 0.04 });
      b.box(0.16, 0.05, 0.08, 0x6a3a22, { x: 0.02, y: 0.0, z: 0.0, ry: 0.3 });
      b.box(0.17, 0.012, 0.085, 0x3a2a1c, { x: 0.02, y: 0, ry: 0.3 });
    } else if (kind === "lantern") {
      b.box(0.11, 0.015, 0.11, 0x2e2e34);
      b.box(0.085, 0.14, 0.085, 0xf0d070, { y: 0.015, top: 0xf8e6a0 });
      b.cone(0.085, 0.07, 4, 0x2e2e34, { y: 0.155, ry: 0.78 });
      b.cyl(0.012, 0.012, 0.05, 4, 0x2e2e34, { y: 0.225 });
    } else {
      b.cyl(0.13, 0.1, 0.12, 8, 0xb8884a, { top: 0x8a6040 });
      b.cyl(0.14, 0.14, 0.02, 8, 0xa8753e, { y: 0.1, nobot: true });
      b.box(0.28, 0.02, 0.02, 0x8a5e32, { y: 0.15, rx: 0.2 });
      for (let i = 0; i < 3; i++) b.sphere(0.04, 5, 3, [0xd8332b, 0xf2a531, 0x7ac043][i], { x: (i - 1) * 0.06, y: 0.13, z: 0.01 });
    }
    return b;
  }
  /* Pfotenabdruck (flach auf dem Boden; Zehen zeigen nach +z) */
  function paw() {
    const b = new MB(), c = 0x5e4630, y = 0.016, up = [0, 1, 0];
    const fan = (cx, cz, rx, rz, n) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, d = (i + 1) / n * Math.PI * 2; b.tri([cx, y, cz], [cx + Math.cos(d) * rx, y, cz + Math.sin(d) * rz], [cx + Math.cos(a) * rx, y, cz + Math.sin(a) * rz], c, up, up, up); } };
    fan(0, -0.015, 0.035, 0.03, 6);
    [[-0.04, 0.035], [-0.015, 0.058], [0.015, 0.058], [0.04, 0.035]].forEach(([x, z]) => fan(x, z, 0.014, 0.014, 4));
    return b;
  }
  /* Schmetterling: Körper + zwei Flügel (rz schlägt) */
  function butterfly(c) {
    const b = new MB();
    b.box(0.012, 0.012, 0.075, 0x2e2a26, { c: true });
    b.sphere(0.012, 4, 3, 0x2e2a26, { z: 0.045 });
    return b;
  }
  function butterflyWing(c, c2) {
    const b = new MB();
    b.quad([0, 0, 0.03], [0.085, 0.006, 0.045], [0.08, 0.006, -0.01], [0, 0, -0.01], c);
    b.quad([0, 0, -0.01], [0.08, 0.006, -0.01], [0.085, 0.006, 0.045], [0, 0, 0.03], c);
    b.quad([0, 0, -0.01], [0.06, 0.006, -0.01], [0.05, 0.006, -0.06], [0, 0, -0.04], c2 || c);
    b.quad([0, 0, -0.04], [0.05, 0.006, -0.06], [0.06, 0.006, -0.01], [0, 0, -0.01], c2 || c);
    return b;
  }
  /* Lichtschacht: schlanke, durchscheinende Säule (Knoten mit alpha) – gegenläufige Flächen, damit beide Seiten zu sehen sind */
  function lightShaft() {
    const b = new MB(), top = [1.2, 1.2], bot = [2.1, 1.9], H = 6.5, c = 0xfff2c0, n = 6;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, d = (i + 1) / n * Math.PI * 2;
      const t1 = [Math.cos(a) * top[0], H, Math.sin(a) * top[1]], t2 = [Math.cos(d) * top[0], H, Math.sin(d) * top[1]];
      const b1 = [Math.cos(a) * bot[0], 0.05, Math.sin(a) * bot[1]], b2 = [Math.cos(d) * bot[0], 0.05, Math.sin(d) * bot[1]];
      b.quad(b1, t1, t2, b2, c); b.quad(b2, t2, t1, b1, c);
    }
    return b;
  }
  Object.assign(FWM, { stone, roots, stick, bark, mosslog, mushGroup, flowers, fern2: fern, berry, fruit, nest, lost, paw, butterfly, butterflyWing, lightShaft, FLOWER_COLS: FCOL });
})();
