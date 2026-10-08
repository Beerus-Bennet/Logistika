/* =========================================================================
   LOGISTIKA – woodmodels.js
   3D-Modelle für die große Welt: Waldbäume nach Art und Größe (mit Stumpf,
   Setzling, Windwurf), Waldboden-Kleinkram, Wege, Bach und Brücke, der See
   mit Ufer, Schilf und Seerosen, Krügers Sägewerk (verfallen und repariert)
   mit Maschinen, Gerümpel und Ausbaustufen am Hof, Fischerei-Gebäude und
   Boote, Wildtiere, Haustiere, Leute und Saison-Deko.
   Gebaut aus den Grundkörpern von gl3d.js wie farmmodels.js (FM).
   Maßstab: 1 Einheit = 1 Kachel (~2 m), Boden y = 0, vorne = +z.
   ========================================================================= */
const FWM = (() => {
  "use strict";
  const MB = G3.MB, C = FM.C;
  const rnd = () => G3.srand();
  const mix = (a, b, t) => { const A = G3.col(a), B = G3.col(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };

  /* ------------------------------- Bäume -------------------------------- */
  const TH = [0, 1.0, 1.55, 2.15, 3.0];        /* Höhenfaktor je Größe */
  const TREE_C = {
    birke:   { bark: 0xeeeae0, mark: 0x2c2a28, leaf: 0x8cc84b, leaf2: 0xa2d35a },
    kiefer:  { bark: 0xa8653c, mark: 0x7a4426, leaf: 0x3d7a3a, leaf2: 0x4a8a42 },
    fichte:  { bark: 0x6b4a30, mark: 0x4a3322, leaf: 0x2c6236, leaf2: 0x336e3d },
    buche:   { bark: 0x9b9a92, mark: 0x7c7b74, leaf: 0x5ea53b, leaf2: 0x6fb845 },
    eiche:   { bark: 0x6b4a30, mark: 0x4e3523, leaf: 0x4f8f30, leaf2: 0x5c9e37 },
    kirsche: { bark: 0x7a3d2c, mark: 0x5a2a1e, leaf: 0x5aa640, leaf2: 0xf4c6d6 }
  };
  function trunk(b, r0, r1, h, c, o) { b.cyl(r0, r1, h, 7, c, Object.assign({ top: c }, o || {})); }
  function tree(sp, sz, v) {
    G3.seed(3000 + sz * 97 + (v || 0) * 13 + sp.length * 7);
    const b = new MB(), T = TREE_C[sp] || TREE_C.buche, k = TH[sz] || 1;
    if (sp === "birke") {
      const h = 2.0 * k;
      trunk(b, 0.11 * k, 0.07 * k, h, T.bark);
      for (let i = 0; i < 5 + sz * 2; i++) b.box(0.07 * k + 0.02, 0.035, 0.03, T.mark, { y: 0.2 + rnd() * h * 0.9, ry: rnd() * 6.28, z: 0.1 * k, c: true });
      b.noise(0.16, () => {
        b.ico(0.62 * k, T.leaf, { y: h * 0.82, jitter: 0.35, flat: 1.25 });
        b.ico(0.42 * k, T.leaf2, { x: 0.32 * k, y: h * 0.62, z: 0.12 * k, jitter: 0.35 });
        b.ico(0.4 * k, T.leaf, { x: -0.28 * k, y: h * 0.7, z: -0.2 * k, jitter: 0.35 });
      });
    } else if (sp === "kiefer") {
      const h = 2.6 * k;
      trunk(b, 0.14 * k, 0.09 * k, h, T.bark);
      b.noise(0.14, () => {
        b.ico(0.7 * k, T.leaf, { y: h + 0.1 * k, jitter: 0.3, flat: 0.55 });
        b.ico(0.5 * k, T.leaf2, { x: 0.45 * k, y: h - 0.25 * k, z: 0.15 * k, jitter: 0.35, flat: 0.6 });
        b.ico(0.48 * k, T.leaf, { x: -0.4 * k, y: h - 0.15 * k, z: -0.25 * k, jitter: 0.35, flat: 0.6 });
        if (sz >= 2) b.box(0.05 * k, 0.05 * k, 0.6 * k, T.bark, { y: h * 0.72, ry: rnd() * 3, rx: 0.4 });
      });
    } else if (sp === "fichte") {
      trunk(b, 0.12 * k, 0.1 * k, 0.6 * k, T.bark);
      b.noise(0.12, () => {
        const L = 3 + Math.min(2, sz);
        for (let i = 0; i < L; i++) {
          const f = 1 - i / L;
          b.cone((0.85 - i * 0.05) * k * (0.55 + f * 0.45), 1.05 * k, 7, i % 2 ? T.leaf2 : T.leaf, { y: 0.35 * k + i * 0.62 * k, a0: i * 0.4 });
        }
      });
    } else if (sp === "buche") {
      const h = 1.7 * k;
      trunk(b, 0.15 * k, 0.11 * k, h, T.bark);
      b.box(0.06 * k, 0.06 * k, 0.55 * k, T.bark, { y: h * 0.8, ry: 0.6, rx: -0.6 });
      b.noise(0.15, () => {
        b.ico(0.95 * k, T.leaf, { y: h + 0.4 * k, jitter: 0.25, detail: 1 });
        b.ico(0.62 * k, T.leaf2, { x: 0.6 * k, y: h + 0.15 * k, z: 0.25 * k, jitter: 0.3 });
        b.ico(0.6 * k, T.leaf, { x: -0.55 * k, y: h + 0.25 * k, z: -0.3 * k, jitter: 0.3 });
      });
    } else if (sp === "eiche") {
      const h = 1.45 * k, big = sz >= 4;
      trunk(b, (big ? 0.34 : 0.2) * k, (big ? 0.2 : 0.14) * k, h, T.bark);
      /* knorrige Äste */
      for (let i = 0; i < 3; i++) b.cyl(0.08 * k, 0.04 * k, 0.9 * k, 5, T.bark, { y: h * 0.85, ry: i * 2.1, rz: 0.9, top: T.bark });
      if (big) for (let i = 0; i < 5; i++) b.ico(0.16 * k, 0x3f6b2a, { x: Math.cos(i * 1.3) * 0.32 * k, y: 0.1 + rnd() * h * 0.6, z: Math.sin(i * 1.3) * 0.32 * k, flat: 0.5, jitter: 0.4 });
      b.noise(0.17, () => {
        b.ico(0.95 * k, T.leaf, { y: h + 0.55 * k, jitter: 0.32, flat: 0.75, detail: 1 });
        b.ico(0.7 * k, T.leaf2, { x: 0.75 * k, y: h + 0.3 * k, z: 0.3 * k, jitter: 0.35, flat: 0.8 });
        b.ico(0.7 * k, T.leaf, { x: -0.7 * k, y: h + 0.35 * k, z: -0.35 * k, jitter: 0.35, flat: 0.8 });
        b.ico(0.6 * k, T.leaf2, { x: 0.1 * k, y: h + 0.4 * k, z: 0.78 * k, jitter: 0.35, flat: 0.8 });
      });
      if (big) for (let i = 0; i < 4; i++) b.box(0.5 * k, 0.12, 0.14, T.bark, { x: Math.cos(i * 1.6) * 0.35 * k, y: 0.04, z: Math.sin(i * 1.6) * 0.35 * k, ry: -i * 1.6, rz: 0.12 });
    } else if (sp === "kirsche") {
      const h = 1.5 * k;
      trunk(b, 0.13 * k, 0.09 * k, h, T.bark);
      for (let i = 0; i < 4; i++) b.cyl(0.135 * k, 0.135 * k, 0.03, 7, T.mark, { y: 0.25 + i * h * 0.22, notop: true, nobot: true });
      b.noise(0.15, () => {
        b.ico(0.78 * k, T.leaf, { y: h + 0.35 * k, jitter: 0.3 });
        b.ico(0.5 * k, T.leaf, { x: 0.45 * k, y: h + 0.15 * k, z: 0.2 * k, jitter: 0.3 });
      });
      /* Blüten: daran erkennt man die seltene Wildkirsche schon von Weitem */
      for (let i = 0; i < 12; i++) {
        const a = rnd() * 6.28, e = rnd() * 1.2 - 0.2, r = 0.8 * k, q = 0.09 * k + 0.04;
        b.box(q, q, q, i % 3 ? 0xfbe3ec : 0xffffff, { x: Math.cos(a) * Math.cos(e) * r, y: h + 0.35 * k + Math.sin(e) * r * 0.9, z: Math.sin(a) * Math.cos(e) * r, ry: a, rx: e, c: true });
      }
    }
    return b;
  }
  /* Baumstumpf mit Jahresringen */
  function stump(sp, sz) {
    G3.seed(3400 + sz);
    const b = new MB(), T = TREE_C[sp] || TREE_C.buche, k = TH[sz] || 1;
    const r = (sp === "eiche" ? 0.2 : 0.14) * k + 0.04;
    b.cyl(r * 1.15, r, 0.28, 8, T.bark, { top: 0xe6c99a });
    b.cyl(r * 0.6, r * 0.6, 0.006, 8, 0xc9a674, { y: 0.28, nobot: true });
    b.cyl(r * 0.25, r * 0.25, 0.008, 8, 0xb48a5a, { y: 0.281, nobot: true });
    for (let i = 0; i < 3; i++) b.box(r * 1.1, 0.07, 0.08, T.bark, { x: Math.cos(i * 2.1) * r, y: 0.02, z: Math.sin(i * 2.1) * r, ry: -i * 2.1 });
    for (let i = 0; i < 4; i++) b.box(0.08, 0.03, 0.05, 0xd8b98a, { x: (rnd() - 0.5) * 1.2, y: 0.015, z: (rnd() - 0.5) * 1.2, ry: rnd() * 3 });
    return b;
  }
  function sapling(sp) {
    G3.seed(3500 + sp.length);
    const b = new MB(), T = TREE_C[sp] || TREE_C.buche;
    b.cyl(0.03, 0.02, 0.45, 5, T.bark);
    if (sp === "fichte" || sp === "kiefer") { b.cone(0.18, 0.35, 6, T.leaf, { y: 0.25 }); b.cone(0.13, 0.28, 6, T.leaf2, { y: 0.45 }); }
    else { b.ico(0.16, T.leaf, { y: 0.48, jitter: 0.3 }); b.ico(0.1, T.leaf2, { x: 0.1, y: 0.38, jitter: 0.3 }); }
    b.cyl(0.14, 0.14, 0.03, 8, 0x6e5233, { nobot: true });
    return b;
  }
  /* umgestürzter Baum (Windwurf): Stamm liegt längs der x-Achse */
  function fallen(sp, sz) {
    G3.seed(3600 + sz);
    const b = new MB(), T = TREE_C[sp] || TREE_C.buche, k = TH[sz] || 1;
    const len = (sp === "fichte" || sp === "kiefer" ? 2.6 : 2.0) * k, r = 0.13 * k;
    b.cyl(r, r * 0.6, len, 7, T.bark, { rz: -Math.PI / 2, y: r, top: 0xe6c99a });
    b.noise(0.16, () => {
      b.ico(0.6 * k, T.leaf, { x: len * 0.9, y: 0.35 * k, jitter: 0.4, flat: 0.55 });
      b.ico(0.42 * k, T.leaf2, { x: len * 0.75, y: 0.3 * k, z: 0.4 * k, jitter: 0.4, flat: 0.55 });
    });
    /* Wurzelteller */
    b.cyl(0.45 * k, 0.45 * k, 0.12, 8, 0x5a3f28, { rz: Math.PI / 2, x: 0.02, y: 0.4 * k, top: 0x4a3322 });
    return b;
  }
  /* Holzstapel (Stämme) */
  function logPile(n, sp) {
    G3.seed(3700 + n);
    const b = new MB(), T = TREE_C[sp || "kiefer"];
    let i = 0;
    for (let row = 0; i < n && row < 4; row++) for (let j = 0; j < 4 - row && i < n; j++, i++)
      b.cyl(0.13, 0.13, 1.4, 7, T.bark, { rx: Math.PI / 2, x: -0.4 + j * 0.27 + row * 0.135, y: 0.13 + row * 0.23, z: -0.7, top: 0xe6c99a });
    return b;
  }

  /* ---------------------------- Waldboden ------------------------------- */
  function fern() {
    G3.seed(3800);
    const b = new MB();
    for (let i = 0; i < 7; i++) b.box(0.07, 0.02, 0.5, i % 2 ? 0x4f9a35 : 0x5fae3f, { ry: i * 0.9, rx: -0.5, y: 0.12, z: 0, c: true });
    return b;
  }
  function mushrooms(red) {
    G3.seed(3810);
    const b = new MB();
    [[0, 0, 1], [0.15, 0.1, 0.7], [-0.12, 0.08, 0.6]].forEach(([x, z, s]) => {
      b.cyl(0.03 * s, 0.03 * s, 0.12 * s, 6, 0xf2ead8, { x, z });
      b.sphere(0.09 * s, 8, 4, red ? 0xd8332b : 0xc28a4e, { x, y: 0.12 * s, z, sy: 0.6 });
      if (red) for (let k = 0; k < 3; k++) b.box(0.025, 0.012, 0.025, 0xffffff, { x: x + (k - 1) * 0.04 * s, y: 0.165 * s, z: z + 0.02 });
    });
    return b;
  }
  function deadLog() {
    G3.seed(3820);
    const b = new MB();
    b.cyl(0.16, 0.14, 1.6, 7, 0x6b5440, { rz: Math.PI / 2, y: 0.15, x: 0.8, top: 0xcfae80 });
    b.ico(0.12, 0x4f7f33, { x: 0.2, y: 0.28, flat: 0.5, jitter: 0.4 });
    return b;
  }
  function boulder(s) {
    G3.seed(3830 + Math.round(s * 10));
    const b = new MB();
    b.noise(0.12, () => { b.ico(0.6 * s, 0x9a948a, { y: 0.25 * s, jitter: 0.45, flat: 0.7 }); b.ico(0.35 * s, 0x8a847a, { x: 0.5 * s, y: 0.15 * s, z: 0.2 * s, jitter: 0.5, flat: 0.6 }); });
    b.ico(0.18 * s, 0x5f8a3a, { y: 0.55 * s, flat: 0.3, jitter: 0.5 });
    return b;
  }

  /* Kulissenbäume (nicht fällbar): sehr wenige Dreiecke, weil es Tausende sind */
  function bgPine(v) {
    G3.seed(3850 + v);
    const b = new MB(), c = [0x2c6236, 0x336e3d, 0x2f7a3a][v % 3];
    b.cyl(0.11, 0.08, 0.5, 5, 0x6b4a30, { notop: true, nobot: true });
    b.noise(0.12, () => { b.cone(0.8, 1.5, 6, c, { y: 0.35, nobot: true, a0: v }); b.cone(0.58, 1.3, 6, G3.shade(G3.col(c), 1.12), { y: 1.15, nobot: true, a0: v + 0.5 }); });
    return b;
  }
  function bgLeaf(v) {
    G3.seed(3860 + v);
    const b = new MB(), c = [0x4f9e35, 0x5c9e37, 0x468f2c, 0x6fb845][v % 4];
    b.cyl(0.13, 0.1, 1.2, 5, v % 4 === 3 ? 0x9b9a92 : 0x6b4a30, { notop: true, nobot: true });
    b.noise(0.14, () => b.ico(0.95, c, { y: 1.75, jitter: 0.3, flat: 0.9 }));
    return b;
  }
  function bgBirch(v) {
    G3.seed(3870 + v);
    const b = new MB();
    b.cyl(0.08, 0.06, 1.6, 5, 0xeeeae0, { notop: true, nobot: true });
    b.box(0.09, 0.03, 0.03, 0x2c2a28, { y: 0.6, z: 0.06 }); b.box(0.09, 0.03, 0.03, 0x2c2a28, { y: 1.1, z: 0.06, ry: 1.2 });
    b.noise(0.14, () => b.ico(0.6, v % 2 ? 0x8cc84b : 0xa2d35a, { y: 1.75, jitter: 0.35, flat: 1.2 }));
    return b;
  }

  /* --------------------------- Hof je Ausbaustufe ------------------------ */
  /* Wiese im Hof: Stufe 1 trocken und fleckig, danach sattes Grün */
  function hofGround(size, inner, stage) {
    G3.seed(900);
    const b = new MB(), h = size / 2;
    const noise = (x, z) => Math.sin(x * 0.37 + z * 0.21) * 0.5 + Math.sin(x * 0.11 - z * 0.43) * 0.5 + Math.sin((x + z) * 0.9) * 0.15;
    for (let i = 0; i < size; i++)
      for (let j = 0; j < size; j++) {
        const x = -h + i + 0.5, z = -h + j + 0.5, v = noise(x, z);
        const inside = Math.abs(x) < inner && Math.abs(z) < inner;
        let c;
        if (inside && stage <= 1) c = v > 0.55 ? 0xb5a46a : (i + j) % 2 ? 0x9cbf55 : 0x95b84f;
        else if (inside) c = (i + j) % 2 ? 0x8cc650 : 0x86c04b;
        else c = v > 0.35 ? C.grassD : v > -0.2 ? C.grass2 : C.grass;
        b.noise(0.05, () => b.plate(1.0, 1.0, c, { x, z }));
      }
    return b;
  }
  /* Weg: Stufe 1 Erde mit Unkraut, 2 Kies, 3+ Pflaster */
  function hofPath(w, d, stage) {
    G3.seed(910 + w * 3 + d + stage);
    const b = new MB();
    if (stage <= 1) {
      b.noise(0.1, () => b.plate(w, d, 0xb59b6e, { y0: 0.02 }));
      for (let i = 0; i < w * d * 0.6; i++) b.ico(0.08, rnd() < 0.5 ? 0x7faa45 : 0x6f9a3a, { x: (rnd() - 0.5) * (w - 0.2), y: 0.03, z: (rnd() - 0.5) * (d - 0.2), flat: 0.6, jitter: 0.5 });
    } else if (stage === 2) {
      b.noise(0.06, () => b.plate(w, d, C.gravel, { y0: 0.02 }));
      for (let i = 0; i < w * d * 1.5; i++) b.ico(0.05, 0xc2b28a, { x: (rnd() - 0.5) * (w - 0.2), y: 0.02, z: (rnd() - 0.5) * (d - 0.2), flat: 0.4 });
    } else {
      b.plate(w, d, 0x9a948a, { y0: 0.018 });
      b.noise(0.12, () => {
        for (let x = -w / 2 + 0.25; x < w / 2 - 0.05; x += 0.5)
          for (let z = -d / 2 + 0.25; z < d / 2 - 0.05; z += 0.5)
            b.plate(0.44, 0.44, rnd() < 0.5 ? 0xc8c0b2 : 0xb8b0a2, { x: x + (Math.round(z * 2) % 2 ? 0.12 : 0), z, y0: 0.026 });
      });
    }
    return b;
  }
  /* Zaun: Stufe 1 morsch und lückenhaft, 2 frisch, 3 weiß gestrichen */
  function hofFence(b, x0, z0, x1, z1, stage, seedK) {
    G3.seed(990 + seedK);
    if (stage <= 1) {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const ax = x0 + (x1 - x0) * t0, az = z0 + (z1 - z0) * t0, bx = x0 + (x1 - x0) * t1, bz = z0 + (z1 - z0) * t1;
        const r = rnd();
        if (r < 0.14) continue;                                   /* Lücke */
        const post = r < 0.3 ? 0x6a5a48 : 0x7a6550;
        b.box(0.09, 0.55, 0.09, post, { x: ax, z: az, rz: (rnd() - 0.5) * 0.25, rx: (rnd() - 0.5) * 0.25 });
        if (r < 0.24) continue;                                   /* nur der Pfosten steht noch */
        const ang = Math.atan2(bz - az, bx - ax), l = Math.hypot(bx - ax, bz - az);
        b.at({ x: (ax + bx) / 2, z: (az + bz) / 2, ry: -ang }, () => {
          b.box(l, 0.06, 0.04, 0x9a8466, { y: 0.26, rz: r > 0.8 ? 0.25 : 0 });
          if (r < 0.7) b.box(l, 0.06, 0.04, 0x9a8466, { y: 0.45 });
        });
      }
      return;
    }
    const o = stage === 2 ? { step: 1.0, h: 0.62, post: 0x8a5a34, rail: 0xcf9a62 } : { step: 1.0, h: 0.7, post: 0xf6f1e6, rail: 0xfaf7f0 };
    FM.fenceLine(b, x0, z0, x1, z1, o);
  }

  /* ------------------------------ Gelände ------------------------------- */
  /* Gitter mit Farbe je Eckpunkt: weiche Übergänge Wiese → Waldboden → Sand */
  function terrain(x0, z0, x1, z1, cell, colFn) {
    const b = new MB();
    const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell);
    const C0 = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) C0.push(colFn(x0 + i * cell, z0 + j * cell));
    const c = (i, j) => C0[j * (nx + 1) + i];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const xa = x0 + i * cell, xb = xa + cell, za = z0 + j * cell, zb = za + cell;
      b.triV([xa, 0, za], [xa, 0, zb], [xb, 0, zb], c(i, j), c(i, j + 1), c(i + 1, j + 1));
      b.triV([xa, 0, za], [xb, 0, zb], [xb, 0, za], c(i, j), c(i + 1, j + 1), c(i + 1, j));
    }
    return b;
  }
  /* Band entlang einer Linie (Waldweg, Bach): y über dem Boden */
  function ribbon(b, pts, w, color, y, edge) {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], c = pts[i];
      const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const nx = -dz / l * w / 2, nz = dx / l * w / 2;
      const ext = 0.5 * w;
      const ax = a[0] - dx / l * (i > 1 ? ext * 0.6 : 0), az = a[1] - dz / l * (i > 1 ? ext * 0.6 : 0);
      const cx = c[0] + dx / l * (i < pts.length - 1 ? ext * 0.6 : 0), cz = c[1] + dz / l * (i < pts.length - 1 ? ext * 0.6 : 0);
      b.quad([ax + nx, y, az + nz], [cx + nx, y, cz + nz], [cx - nx, y, cz - nz], [ax - nx, y, az - nz], color);
      if (edge) {
        b.quad([ax + nx * 1.25, y - 0.004, az + nz * 1.25], [cx + nx * 1.25, y - 0.004, cz + nz * 1.25], [cx + nx, y - 0.004, cz + nz], [ax + nx, y - 0.004, az + nz], edge);
        b.quad([ax - nx, y - 0.004, az - nz], [cx - nx, y - 0.004, cz - nz], [cx - nx * 1.25, y - 0.004, cz - nz * 1.25], [ax - nx * 1.25, y - 0.004, az - nz * 1.25], edge);
      }
    }
  }
  /* Polylinie glätten (Catmull-Rom), damit Wege und Bach weich laufen */
  function smoothLine(pts, n) {
    if (pts.length < 3) return pts;
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b2, c, d) => 0.5 * (2 * b2 + (-a + c) * t + (2 * a - 5 * b2 + 4 * c - d) * t2 + (-a + 3 * b2 - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function forestPath(pts, w) {
    G3.seed(3900 + pts.length);
    const b = new MB(), P = smoothLine(pts, 6);
    b.noise(0.05, () => ribbon(b, P, w || 1.7, 0xb69a6a, 0.025, 0x8f7c55));
    /* Laub und Steinchen auf dem Weg */
    for (let i = 0; i < P.length; i++) {
      const p = P[Math.floor(rnd() * P.length)];
      b.plate(0.14, 0.1, rnd() < 0.5 ? 0xc49a52 : 0x9a8f7a, { x: p[0] + (rnd() - 0.5) * 1.2, z: p[1] + (rnd() - 0.5) * 1.2, ry: rnd() * 3, y0: 0.032 });
    }
    return b;
  }
  /* Bach: Ufer (Kies) und Wasser getrennt, damit das Wasser glitzern kann */
  function creekBank(pts) {
    G3.seed(3910);
    const b = new MB(), P = smoothLine(pts, 6);
    b.noise(0.06, () => ribbon(b, P, 3.6, 0xb7a78a, 0.012));
    for (let i = 0; i < P.length * 0.6; i++) {
      const p = P[Math.floor(rnd() * P.length)], s = rnd() < 0.5 ? 1 : -1;
      b.ico(0.12 + rnd() * 0.12, rnd() < 0.5 ? 0x9a948b : 0xaaa498, { x: p[0] + s * (1.3 + rnd() * 0.5), y: 0.05, z: p[1] + (rnd() - 0.5) * 0.8, flat: 0.55, jitter: 0.4 });
    }
    return b;
  }
  function creekWater(pts) {
    const b = new MB(), P = smoothLine(pts, 6);
    ribbon(b, P, 2.3, 0x3f8fc0, 0.03);
    return b;
  }
  function bridge() {
    G3.seed(3920);
    const b = new MB();
    b.noise(0.1, () => { for (let i = 0; i < 9; i++) b.box(0.32, 0.08, 2.2, i % 2 ? C.wood : C.woodL, { x: -1.35 + i * 0.34, y: 0.22 }); });
    [-1.5, 1.5].forEach(x => [-1.05, 1.05].forEach(z => b.box(0.1, 0.75, 0.1, C.woodD, { x, z })));
    [-1.05, 1.05].forEach(z => b.box(3.1, 0.07, 0.07, C.woodD, { y: 0.68, z }));
    return b;
  }
  /* rot-weiße Schranke an gesperrten Wegen, mit Schild */
  function barrier() {
    G3.seed(3930);
    const b = new MB();
    b.box(0.12, 0.9, 0.12, 0x3a3a40, { x: -1.0 });
    for (let i = 0; i < 6; i++) b.box(0.34, 0.1, 0.1, i % 2 ? 0xffffff : 0xd8332b, { x: -0.8 + i * 0.34, y: 0.72 });
    b.box(0.08, 0.6, 0.08, 0x3a3a40, { x: 1.05 });
    b.box(0.7, 0.45, 0.04, 0xf6f1e6, { x: -1.0, y: 0.95, z: 0.07 });
    b.box(0.6, 0.06, 0.02, 0xd8332b, { x: -1.0, y: 1.28, z: 0.1 });
    b.box(0.1, 0.18, 0.02, 0x2a2a2e, { x: -1.0, y: 1.08, z: 0.1 });
    return b;
  }

  /* -------------------------------- See ---------------------------------- */
  const lakeR = (rx, rz, a) => { const w = 1 + 0.05 * Math.sin(3 * a + 0.7) + 0.03 * Math.sin(5 * a + 1.9); return [Math.cos(a) * rx * w, Math.sin(a) * rz * w]; };
  function lakeShore(rx, rz) {
    G3.seed(3940);
    const b = new MB(), seg = 96;
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      const P = (a, d, y) => { const p = lakeR(rx + d, rz + d, a); return [p[0], y, p[1]]; };
      b.triV(P(a0, 2.6, 0.006), P(a1, 2.6, 0.006), P(a1, 0.4, 0.008), mix(0x86bf4a, 0xd9c48a, 0.15), mix(0x86bf4a, 0xd9c48a, 0.15), 0xe3cf95);
      b.triV(P(a0, 2.6, 0.006), P(a1, 0.4, 0.008), P(a0, 0.4, 0.008), mix(0x86bf4a, 0xd9c48a, 0.15), 0xe3cf95, 0xe3cf95);
      b.triV(P(a0, 0.4, 0.008), P(a1, 0.4, 0.008), P(a1, -1.2, 0.01), 0xe3cf95, 0xe3cf95, 0x9fb58a);
      b.triV(P(a0, 0.4, 0.008), P(a1, -1.2, 0.01), P(a0, -1.2, 0.01), 0xe3cf95, 0x9fb58a, 0x9fb58a);
    }
    return b;
  }
  function lakeWater(rx, rz) {
    const b = new MB(), seg = 96;
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      const p0 = lakeR(rx, rz, a0), p1 = lakeR(rx, rz, a1);
      const q0 = lakeR(rx * 0.55, rz * 0.55, a0), q1 = lakeR(rx * 0.55, rz * 0.55, a1);
      b.triV([0, 0, 0], [q1[0], 0, q1[1]], [q0[0], 0, q0[1]], 0x1f5f8f, 0x2a6f9e, 0x2a6f9e);
      b.triV([q0[0], 0, q0[1]], [q1[0], 0, q1[1]], [p1[0], 0, p1[1]], 0x2a6f9e, 0x2a6f9e, 0x5fb2cf);
      b.triV([q0[0], 0, q0[1]], [p1[0], 0, p1[1]], [p0[0], 0, p0[1]], 0x2a6f9e, 0x5fb2cf, 0x5fb2cf);
    }
    return b;
  }
  function reedPatch(n) {
    G3.seed(3950 + n);
    const b = new MB();
    for (let i = 0; i < n; i++) {
      const x = (rnd() - 0.5) * 2.6, z = (rnd() - 0.5) * 1.6, h = 0.7 + rnd() * 0.6;
      b.box(0.035, h, 0.035, rnd() < 0.5 ? 0x6b8f2c : 0x7da23a, { x, z, rz: (rnd() - 0.5) * 0.3, rx: (rnd() - 0.5) * 0.3 });
      if (rnd() < 0.4) b.box(0.06, 0.16, 0.06, 0x7a5233, { x, y: h, z });
    }
    return b;
  }
  function lilyPads(n) {
    G3.seed(3960 + n);
    const b = new MB();
    for (let i = 0; i < n; i++) {
      const x = (rnd() - 0.5) * 3, z = (rnd() - 0.5) * 2.4, r = 0.18 + rnd() * 0.12;
      b.disc(r, 9, rnd() < 0.5 ? 0x4f9a35 : 0x5daa3c, { x, z, y0: 0.012 });
      if (rnd() < 0.35) b.ico(0.08, rnd() < 0.5 ? 0xffffff : 0xf6b3cf, { x, y: 0.06, z });
    }
    return b;
  }

  /* ------------------------------ Sägewerk ------------------------------ */
  /* Sägehalle: m = Reparaturen (dach, strom, saege, band) als Bits */
  function sawHall(m) {
    G3.seed(4000);
    const b = new MB();
    const dach = m & 1, strom = m & 2, saege = m & 4, band = m & 8;
    const wallC = dach ? 0x9a6a3e : 0x6f5a46, plankC = dach ? 0xb07a48 : 0x7d6650;
    b.box(10, 0.18, 6, 0x8a857c, { top: 0x9a948a });
    /* Rückwand und Seiten aus Brettern, vorne offen */
    b.at({ y: 0.18 }, () => {
      FM.plankWall(b, 10, 2.6, 0.12, plankC, { z: -2.94 });
      [-4.94, 4.94].forEach(x => b.at({ x, ry: Math.PI / 2 }, () => FM.plankWall(b, 5.9, 2.6, 0.12, plankC)));
      for (let i = 0; i < 6; i++) b.box(0.18, 2.75, 0.18, 0x5a3f28, { x: -4.9 + i * 1.96, z: 2.9 });
      if (!dach) { b.box(1.1, 0.9, 0.14, 0x3a2e24, { x: -2, y: 1.2, z: -2.92 }); b.box(0.8, 0.6, 0.14, 0x3a2e24, { x: 3, y: 0.9, z: -2.92 }); }
      /* Fenster in der Rückwand */
      [-3, 0, 3].forEach(x => { b.box(0.9, 0.6, 0.05, dach ? 0xffffff : 0x55504a, { x, y: 1.6, z: -2.85 }); b.box(0.78, 0.48, 0.06, dach ? (strom ? C.glow : C.glass) : 0x2a2622, { x, y: 1.66, z: -2.84 }); });
    });
    /* Dach: ganz oder mit Löchern */
    b.at({ y: 2.95 }, () => {
      if (dach) b.noise(0.05, () => b.roof(10.6, 6.6, 1.6, 0x6f7a80, { gable: wallC, thick: 0.1 }));
      else {
        for (let i = 0; i < 6; i++) b.box(0.12, 0.12, 6.4, 0x4a3a2c, { x: -5 + i * 2, y: 0.8, rx: 0 });
        b.roof(3.2, 6.6, 1.6, 0x5a6268, { x: -3.6, gable: wallC, thick: 0.1 });
        b.at({ x: 3.1 }, () => b.quad([-1.4, 0, 3.3], [1.6, 0, 3.3], [1.6, 1.6, 0], [-1.4, 1.6, 0], 0x5a6268));
        b.box(1.4, 0.06, 1.0, 0x5a6268, { x: 1.5, y: -2.8, z: 1.6, ry: 0.5, rz: 0.2 });
      }
    });
    /* Gattersäge in der Mitte: Rahmen, Sägeblätter, Wagen auf Schienen */
    b.at({ y: 0.18, x: 0.5 }, () => {
      [-0.8, 0.8].forEach(x => b.box(0.22, 2.3, 0.3, saege ? 0x2f6fb0 : 0x7a6a5a, { x }));
      b.box(1.85, 0.25, 0.32, saege ? 0x2f6fb0 : 0x7a6a5a, { y: 2.2 });
      if (saege) for (let i = 0; i < 5; i++) b.box(0.03, 1.5, 0.2, 0xd9e1e6, { x: -0.45 + i * 0.22, y: 0.55 });
      else { b.box(0.03, 1.2, 0.2, 0x9a6a3a, { x: -0.2, y: 0.4, rz: 0.4 }); b.box(0.03, 1.2, 0.2, 0x9a6a3a, { x: 0.6, y: 0.2, rz: 1.3, z: 1.5 }); }
      /* Schienen und Stammwagen */
      [-0.35, 0.35].forEach(x => b.box(0.06, 0.06, 5.4, 0x55504a, { x, y: 0.02 }));
      b.box(1.1, 0.18, 0.9, 0x6e4a2e, { y: 0.1, z: 1.4 });
      b.cyl(0.32, 0.32, 2.2, 8, 0xa8653c, { rx: Math.PI / 2, y: 0.6, z: 1.4 - 1.1, top: 0xe6c99a });
    });
    /* Förderband: Rollen und Gurt (oder Einzelteile am Boden) */
    b.at({ y: 0.18, x: -3.1, z: 0.4 }, () => {
      [-1.6, 1.6].forEach(z => [-0.35, 0.35].forEach(x => b.box(0.08, 0.6, 0.08, 0x55504a, { x, z })));
      if (band) {
        b.box(0.8, 0.08, 3.6, 0x2a2a2e, { y: 0.62 });
        for (let i = 0; i < 9; i++) b.cyl(0.07, 0.07, 0.78, 6, 0x9aa6af, { rz: Math.PI / 2, x: 0.39, y: 0.58, z: -1.6 + i * 0.4 });
        b.cyl(0.25, 0.25, 1.4, 8, 0xa8653c, { rx: Math.PI / 2, y: 0.95, z: -0.9, top: 0xe6c99a });
      } else {
        for (let i = 0; i < 4; i++) b.cyl(0.07, 0.07, 0.78, 6, 0x8a7a6a, { rz: Math.PI / 2, x: 0.4 + rnd() * 0.6, y: 0.07, z: -1.5 + i * 0.9, ry: rnd() });
        b.box(0.8, 0.04, 1.2, 0x2a2a2e, { x: 0.8, y: 0.02, z: 0.6, ry: 0.4 });
      }
    });
    /* Strom: Lampe und Leitung zum Kesselhaus */
    if (strom) {
      [-2.5, 2.5].forEach(x => { b.box(0.04, 0.5, 0.04, 0x2a2a2e, { x, y: 2.4, z: 0.4 }); b.box(0.3, 0.16, 0.3, C.glow, { x, y: 2.25, z: 0.4 }); });
      b.box(0.3, 0.4, 0.15, 0x9aa6af, { x: -4.7, y: 1.2, z: 2.0 });
      b.box(0.04, 0.04, 0.6, 0xd8332b, { x: -4.7, y: 1.5, z: 2.2 });
    }
    /* Sägespäne */
    for (let i = 0; i < 10; i++) b.ico(0.18 + rnd() * 0.15, dach ? 0xe9cfa0 : 0x9a8a72, { x: (rnd() - 0.5) * 8, y: 0.18, z: 1.2 + rnd() * 1.6, flat: 0.25, jitter: 0.4 });
    if (!dach) for (let i = 0; i < 8; i++) b.ico(0.22, 0x5f7f3a, { x: (rnd() - 0.5) * 9.5, y: 0.2, z: 2.6 + rnd() * 0.6, flat: 0.5, jitter: 0.5 });
    return b;
  }
  const SAW_BLADE = [0.5, 0.73, 0];        /* Lage der Sägeblätter (für die Animation) */
  function sawBlades() {
    const b = new MB();
    for (let i = 0; i < 5; i++) b.box(0.03, 1.5, 0.2, 0xe6eef2, { x: -0.45 + i * 0.22 });
    b.box(1.2, 0.08, 0.26, 0x9aa6af, { y: 1.5 });
    return b;
  }
  /* Holzlager: offener Schuppen mit Stapeln */
  function sawLager(ok) {
    G3.seed(4010);
    const b = new MB();
    b.box(6, 0.12, 4, 0x8a857c);
    for (let i = 0; i < 4; i++) [-1.8, 1.8].forEach(z => b.box(0.16, 2.2, 0.16, 0x5a3f28, { x: -2.8 + i * 1.86, z }));
    b.at({ y: 2.2 }, () => ok ? b.box(6.4, 0.12, 4.4, 0x6f7a80, { rx: 0.08 }) : b.box(3.4, 0.12, 4.4, 0x5a6268, { x: -1.4, rx: 0.08, rz: 0.06 }));
    b.merge(logPile(9, "kiefer"), { x: -1.4, z: -1.2 });
    b.merge(logPile(7, "birke"), { x: 1.5, z: -1.2 });
    b.merge(logPile(5, "eiche"), { x: 0, z: 0.4 });
    return b;
  }
  function sawBuero(ok) {
    G3.seed(4020);
    const b = new MB();
    b.box(3, 0.12, 3, 0x8a857c);
    b.at({ y: 0.12, z: -0.1 }, () => {
      FM.plankWall(b, 2.6, 1.7, 2.4, ok ? 0x4f7a5a : 0x5a5a50);
      FM.windowAt(b, -0.6, 0.7, 1.22, 0.55, 0.5, ok ? { frame: 0xffffff } : { frame: 0x8a7a6a, lit: false });
      if (!ok) [-0.75, -0.45].forEach(x => b.box(0.7, 0.09, 0.05, 0x8a6a4a, { x: x + 0.15, y: 0.98, z: 1.28, rz: x > -0.6 ? 0.4 : -0.4 }));
      b.box(0.6, 1.2, 0.06, ok ? 0x2f6fb0 : 0x4a3a2c, { x: 0.6, z: 1.21 });
      b.at({ y: 1.7 }, () => b.roof(3.0, 2.8, 0.8, ok ? 0x9e3f2c : 0x5a5050, { gable: ok ? 0x4f7a5a : 0x5a5a50 }));
      b.box(1.4, 0.32, 0.05, ok ? 0xf6f1e6 : 0x9a948a, { y: 1.5, z: 1.25 });
    });
    return b;
  }
  /* Krügers Unimog: unter der Plane und rostig – oder frisch flott */
  function sawLkw(ok) {
    G3.seed(4030);
    const b = new MB();
    const body = ok ? 0x3f7a4a : 0x6a5a48, tire = ok ? 0x1d1d20 : 0x3a3530;
    [[-0.8, -1.4], [0.8, -1.4], [-0.8, 1.3], [0.8, 1.3]].forEach(([x, z]) => b.cyl(0.42, 0.42, 0.32, 10, tire, { rz: Math.PI / 2, x: x + 0.16, y: ok ? 0.42 : 0.34, z, top: 0x8a8a8a }));
    b.at({ y: ok ? 0.6 : 0.5 }, () => {
      b.box(1.7, 0.25, 4.4, 0x2a2a2e);
      b.box(1.7, 1.2, 1.4, body, { y: 0.25, z: 1.4, top: ok ? 0x356a3f : 0x5a4a3a });
      b.box(1.5, 0.5, 0.05, ok ? C.glass : 0x3a3530, { y: 0.85, z: 2.11 });
      b.box(1.8, 0.4, 2.6, body, { y: 0.25, z: -0.9 });
      if (ok) for (let i = 0; i < 3; i++) b.cyl(0.18, 0.18, 2.6, 7, 0xa8653c, { rx: Math.PI / 2, x: -0.45 + i * 0.45, y: 0.85, z: -2.2, top: 0xe6c99a });
      [-0.55, 0.55].forEach(x => b.box(0.22, 0.14, 0.04, ok ? 0xfff5c8 : 0x55504a, { x, y: 0.5, z: 2.11 }));
    });
    if (!ok) {
      /* Plane drüber, Gras drumherum */
      b.box(2.0, 0.08, 4.2, 0x5a6a48, { y: 1.95, rz: 0.06 });
      b.box(0.06, 1.0, 4.0, 0x5a6a48, { x: 1.0, y: 1.0, rz: -0.12 });
      for (let i = 0; i < 6; i++) b.ico(0.25, 0x5f8a3a, { x: (rnd() - 0.5) * 2.4, y: 0.15, z: (rnd() - 0.5) * 4.6, flat: 0.6, jitter: 0.5 });
    }
    return b;
  }
  /* Kesselhaus mit Schornstein: Kessel + Motor fürs Sägewerk */
  function kessel(ok) {
    G3.seed(4040);
    const b = new MB();
    b.box(3, 0.12, 3, 0x8a857c);
    b.at({ y: 0.12 }, () => {
      b.noise(0.08, () => b.box(2.6, 1.8, 2.6, ok ? C.brick : 0x8a5a48, { top: C.brickD }));
      for (let y = 0.3; y < 1.8; y += 0.3) b.box(2.62, 0.018, 2.62, 0xd7b6a6, { y });
      b.box(0.9, 1.2, 0.06, ok ? 0x3a3a40 : 0x2a2420, { x: 0.4, z: 1.31 });
      if (ok) b.box(0.5, 0.3, 0.07, C.glow, { x: 0.4, y: 0.2, z: 1.32 });
      b.at({ y: 1.8 }, () => b.roof(2.9, 2.9, 0.6, ok ? 0x6f7a80 : 0x5a5a50, { gable: C.brick }));
      b.box(0.5, ok ? 2.6 : 1.6, 0.5, C.brick, { x: -0.8, z: -0.7, top: 0x3a3030 });
      if (!ok) b.ico(0.3, 0x5f8a3a, { x: -0.8, y: 1.7, z: -0.7, jitter: 0.5 });
    });
    return b;
  }
  const KESSEL_CHIMNEY = [-0.8, 2.85, -0.7];
  /* Maschinen zum Dazukaufen */
  function machine(t) {
    G3.seed(4100 + t.length);
    const b = new MB();
    const base = (w, d) => b.box(w, 0.12, d, 0x8a857c);
    if (t === "spalter") {
      base(2, 2);
      b.box(0.5, 0.6, 1.4, 0xd8a028, { y: 0.12 });
      b.box(0.2, 1.0, 0.2, 0x3a3a40, { y: 0.7, z: -0.4 });
      b.box(0.08, 0.4, 0.3, 0xd9e1e6, { y: 1.0, z: -0.4 });
      b.cyl(0.22, 0.22, 0.5, 8, 0xa8653c, { y: 0.72, z: 0.3, top: 0xe6c99a });
      for (let i = 0; i < 6; i++) b.box(0.12, 0.12, 0.45, 0xc9955a, { x: 0.65 + (i % 3) * 0.13, y: 0.12 + Math.floor(i / 3) * 0.12, z: 0.4, ry: 0.2 });
    } else if (t === "hobel") {
      base(3, 2);
      b.box(2.2, 0.8, 0.9, 0x2f8a6a, { y: 0.12, top: 0x2a7a5e });
      b.box(0.6, 0.4, 0.95, 0x3a3a40, { y: 0.92 });
      b.box(2.6, 0.06, 0.5, 0xe6c99a, { y: 0.95, z: 0.05 });
      b.box(0.3, 0.5, 0.3, 0x9aa6af, { x: -0.9, y: 0.92 });
    } else if (t === "trocken") {
      base(4, 3);
      b.box(3.6, 2.0, 2.6, 0xd9e1e6, { y: 0.12, top: 0xc0c9cf });
      b.box(1.4, 1.6, 0.05, 0x6f7a80, { x: -0.6, y: 0.12, z: 1.31 });
      b.box(0.4, 0.3, 0.06, 0xd8332b, { x: 1.0, y: 1.3, z: 1.31 });
      [-0.8, 0.8].forEach(x => b.cyl(0.18, 0.18, 0.5, 8, 0x9aa6af, { x, y: 2.12, z: -0.5 }));
    } else if (t === "verpack") {
      base(3, 2);
      b.box(1.8, 0.9, 1.2, 0xf2a531, { y: 0.12, top: 0xe09424 });
      b.box(0.8, 0.5, 1.25, 0x3a3a40, { x: -0.4, y: 1.02 });
      for (let i = 0; i < 3; i++) b.box(1.2, 0.14, 0.8, 0xd8b07a, { x: 0.9, y: 0.12 + i * 0.16, z: 0.2 });
    } else if (t === "schleif") {
      base(3, 2);
      b.box(1.6, 0.85, 0.9, 0x8a5ac8, { y: 0.12, top: 0x7a4ab8 });
      b.cyl(0.32, 0.32, 0.12, 12, 0xe0d0b0, { rz: Math.PI / 2, x: 0.86, y: 0.75 });
      b.box(1.0, 0.08, 0.5, 0xc9955a, { x: -0.2, y: 0.97 });
    } else if (t === "fraese") {
      base(3, 2);
      b.box(1.8, 0.9, 1.0, 0xc8443a, { y: 0.12, top: 0xb8382e });
      b.box(0.3, 0.9, 0.3, 0x3a3a40, { y: 1.02 });
      b.cyl(0.1, 0.06, 0.3, 8, 0xd9e1e6, { y: 0.75, z: 0 });
      b.box(1.4, 0.1, 0.06, 0x9aa6af, { y: 1.85 });
    }
    return b;
  }
  /* Sägebock auf dem Hof: Bock mit Stamm, daneben die Kettensäge */
  function saegebock() {
    G3.seed(4200);
    const b = new MB();
    b.noise(0.1, () => b.plate(1.9, 1.9, 0xc9b48a, { y0: 0.015 }));
    [-0.55, 0.55].forEach(x => { b.box(0.08, 0.7, 0.08, C.woodD, { x, z: 0.2, rx: 0.35 }); b.box(0.08, 0.7, 0.08, C.woodD, { x, z: -0.2, rx: -0.35 }); });
    b.cyl(0.16, 0.16, 1.6, 8, 0xa8653c, { rz: Math.PI / 2, x: 0.8, y: 0.7, top: 0xe6c99a });
    b.box(0.32, 0.18, 0.14, 0xf2731e, { x: 0.55, y: 0.05, z: 0.6 });
    b.box(0.5, 0.04, 0.08, 0x9aa6af, { x: 0.85, y: 0.08, z: 0.6 });
    for (let i = 0; i < 6; i++) b.ico(0.08, 0xe9cfa0, { x: (rnd() - 0.5) * 1.2, y: 0.02, z: (rnd() - 0.5) * 1.2, flat: 0.3 });
    b.merge(logPile(4, "kiefer"), { x: 0.4, z: -1.15, s: 0.6 });
    return b;
  }
  /* Sägewerkshof: Schotter, Späne, Stapel */
  function yard(w, d) {
    G3.seed(4210);
    const b = new MB();
    b.noise(0.07, () => b.plate(w, d, 0xbfb196, { y0: 0.014 }));
    for (let i = 0; i < w * d * 0.12; i++) b.plate(0.22, 0.16, rnd() < 0.5 ? 0xe9cfa0 : 0xa59a84, { x: (rnd() - 0.5) * (w - 1), z: (rnd() - 0.5) * (d - 1), ry: rnd() * 3, y0: 0.02 });
    return b;
  }

  /* ------------------------------- Hof ---------------------------------- */
  function junk(k) {
    G3.seed(4300 + k.length);
    const b = new MB();
    if (k === "reifen") {
      for (let i = 0; i < 4; i++) b.cyl(0.38, 0.38, 0.22, 10, 0x1d1d20, { y: i * 0.22, x: (i % 2) * 0.06, top: 0x3a3a40 });
      b.cyl(0.38, 0.38, 0.22, 10, 0x1d1d20, { rx: 1.2, x: 0.7, y: 0.3, z: 0.4, top: 0x3a3a40 });
    } else if (k === "schrott") {
      b.noise(0.2, () => {
        for (let i = 0; i < 9; i++) b.box(0.2 + rnd() * 0.5, 0.06 + rnd() * 0.2, 0.2 + rnd() * 0.4, rnd() < 0.5 ? 0x8a5a3a : 0x7a7a80, { x: (rnd() - 0.5) * 1.2, y: rnd() * 0.3, z: (rnd() - 0.5) * 1.2, ry: rnd() * 3, rz: (rnd() - 0.5) * 0.6 });
      });
      b.cyl(0.25, 0.25, 0.5, 8, 0x5a6a7a, { rz: 1.4, x: 0.3, y: 0.25, z: -0.4 });
    } else if (k === "unkraut") {
      for (let i = 0; i < 16; i++) b.box(0.05, 0.5 + rnd() * 0.4, 0.05, rnd() < 0.5 ? 0x4f8f30 : 0x5f9a35, { x: (rnd() - 0.5) * 1.5, z: (rnd() - 0.5) * 1.5, rz: (rnd() - 0.5) * 0.5 });
      for (let i = 0; i < 6; i++) b.ico(0.2, 0x4a8a2c, { x: (rnd() - 0.5) * 1.3, y: 0.25, z: (rnd() - 0.5) * 1.3, jitter: 0.5 });
    } else if (k === "bretter") {
      for (let i = 0; i < 7; i++) b.box(1.5, 0.05, 0.22, rnd() < 0.5 ? 0x7a6a50 : 0x8a7458, { y: 0.05 + i * 0.05, z: (rnd() - 0.5) * 0.6, ry: (rnd() - 0.5) * 0.7 });
      b.ico(0.2, 0x5f8a3a, { x: 0.6, y: 0.1, z: 0.5, jitter: 0.5 });
    } else if (k === "karre") {
      FM.wheel(b, 0.3, 0.06, { x: -0.5, y: 0.2, z: 0, rz: 0.3 });
      b.box(1.1, 0.08, 0.7, 0x7a6a50, { y: 0.32, rz: -0.25 });
      b.box(1.0, 0.25, 0.05, 0x6a5a44, { y: 0.4, z: 0.33, rz: -0.25 });
      b.box(0.05, 0.05, 1.0, 0x5a4a38, { x: 0.7, y: 0.15, z: 0.2, ry: 0.4 });
      b.ico(0.22, 0x5f8a3a, { x: 0.3, y: 0.1, z: -0.4, jitter: 0.5 });
    }
    return b;
  }
  /* Verkaufsstand an der Straße */
  function stall() {
    G3.seed(4310);
    const b = new MB();
    b.box(1.8, 0.7, 0.7, C.wood, { y: 0, top: C.woodL });
    [-0.85, 0.85].forEach(x => b.box(0.08, 1.6, 0.08, C.woodD, { x, z: -0.3 }));
    for (let i = 0; i < 6; i++) b.box(0.32, 0.04, 0.9, i % 2 ? 0xffffff : 0xd8332b, { x: -0.8 + i * 0.32, y: 1.55, z: 0.05, rx: 0.3 });
    b.box(1.2, 0.3, 0.05, 0xf6f1e6, { y: 1.15, z: -0.33 });
    return b;
  }
  /* Ware auf dem Stand: Kisten mit Farbe */
  function stallGoods() {
    const b = new MB();
    [[-0.55, 0xd9332b], [0, 0xf2c230], [0.55, 0x6fae3a]].forEach(([x, c]) => {
      b.box(0.42, 0.14, 0.32, C.woodL, { x, y: 0.7 });
      for (let k = 0; k < 4; k++) b.sphere(0.07, 7, 5, c, { x: x - 0.12 + (k % 2) * 0.24, y: 0.86, z: -0.07 + Math.floor(k / 2) * 0.14 });
    });
    return b;
  }
  function tractor(col) {
    G3.seed(4320);
    const b = new MB(), c = col === "gruen" ? 0x2f8a4a : 0xc8443a;
    FM.wheel(b, 0.42, 0.22, { x: -0.55, y: 0.42, z: -0.45 }); FM.wheel(b, 0.42, 0.22, { x: 0.55, y: 0.42, z: -0.45 });
    FM.wheel(b, 0.26, 0.16, { x: -0.48, y: 0.26, z: 0.75 }); FM.wheel(b, 0.26, 0.16, { x: 0.48, y: 0.26, z: 0.75 });
    b.box(0.8, 0.5, 1.5, c, { y: 0.35, z: 0.25, top: G3.shade(G3.col(c), 0.9) });
    b.box(0.85, 0.85, 0.8, c, { y: 0.55, z: -0.4 });
    b.box(0.75, 0.55, 0.05, C.glass, { y: 1.0, z: 0.01 });
    b.box(0.95, 0.06, 0.95, 0x2a2a2e, { y: 1.42, z: -0.4 });
    b.cyl(0.05, 0.05, 0.6, 6, 0x2a2a2e, { x: 0.25, y: 0.85, z: 0.75 });
    return b;
  }
  function trailer() {
    const b = new MB();
    FM.wheel(b, 0.3, 0.12, { x: -0.6, y: 0.3, z: 0 }); FM.wheel(b, 0.3, 0.12, { x: 0.6, y: 0.3, z: 0 });
    b.box(1.4, 0.08, 1.8, C.woodD, { y: 0.5 });
    FM.plankWall(b, 1.4, 0.35, 0.05, C.wood, { y: 0.58, z: 0.88 }); FM.plankWall(b, 1.4, 0.35, 0.05, C.wood, { y: 0.58, z: -0.88 });
    b.noise(0.1, () => b.box(1.2, 0.3, 1.5, C.hay, { y: 0.58 }));
    b.box(0.06, 0.06, 0.9, 0x3a3a40, { y: 0.45, z: 1.3 });
    return b;
  }
  /* Maschinenhalle (Stufe 4) */
  function machineHall() {
    G3.seed(4330);
    const b = new MB();
    b.box(6, 0.1, 4, 0x9a948a);
    FM.plankWall(b, 6, 2.4, 0.12, 0x6f8a9a, { y: 0.1, z: -1.94 });
    [-2.94, 2.94].forEach(x => b.at({ x, y: 0.1, ry: Math.PI / 2 }, () => FM.plankWall(b, 3.9, 2.4, 0.12, 0x6f8a9a)));
    b.at({ y: 2.5 }, () => b.roof(6.4, 4.4, 1.0, 0x5a6268, { gable: 0x6f8a9a }));
    for (let i = 0; i < 4; i++) b.box(1.2, 0.04, 0.8, 0x203a5a, { x: -2.1 + i * 1.4, y: 3.05, z: 1.0, rx: -0.42 });
    return b;
  }
  /* Steinmauer-Abschnitt und Torbogen (Stufe 4) */
  function stoneWall(len) {
    G3.seed(4340 + Math.round(len));
    const b = new MB();
    b.noise(0.12, () => { for (let x = -len / 2 + 0.3; x < len / 2; x += 0.6) b.box(0.62, 0.55 + rnd() * 0.08, 0.35, rnd() < 0.5 ? 0xb8b0a2 : 0xa8a094, { x, top: 0x9a948a }); });
    return b;
  }
  function stoneGate() {
    G3.seed(4350);
    const b = new MB();
    [-2.1, 2.1].forEach(x => b.noise(0.1, () => b.box(0.6, 2.4, 0.6, 0xb8b0a2, { x, top: 0x9a948a })));
    b.box(4.8, 0.4, 0.6, 0xa8a094, { y: 2.4 });
    b.box(2.6, 0.5, 0.06, 0xf6f1e6, { y: 2.45, z: 0.32 });
    b.box(0.06, 0.06, 0.8, 0xd8332b, { x: 2.1, y: 2.9, z: 0, ry: 0 });
    return b;
  }

  /* ----------------------------- Fischerei ------------------------------ */
  function fPlot(w, d) {
    G3.seed(4400 + w * 3 + d);
    const b = new MB();
    const x = w / 2 - 0.15, z = d / 2 - 0.15;
    /* Pflöcke mit Absperrband rundherum, gut sichtbar auch im Wasser */
    [[-x, -z], [x, -z], [x, z], [-x, z]].forEach(([px, pz]) => { b.box(0.12, 0.9, 0.12, 0xf2a531, { x: px, y: -0.2, z: pz }); b.box(0.16, 0.08, 0.16, 0xd8332b, { x: px, y: 0.7, z: pz }); });
    [[[-x, -z], [x, -z]], [[x, -z], [x, z]], [[x, z], [-x, z]], [[-x, z], [-x, -z]]].forEach(([a, c]) => {
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(2, Math.round(len / 0.5));
      for (let i = 0; i < n; i++) {
        const t0 = (i + 0.05) / n, t1 = (i + 0.95) / n;
        const ax = a[0] + (c[0] - a[0]) * t0, az = a[1] + (c[1] - a[1]) * t0, bx = a[0] + (c[0] - a[0]) * t1, bz = a[1] + (c[1] - a[1]) * t1;
        b.box(Math.hypot(bx - ax, bz - az), 0.06, 0.03, i % 2 ? 0xffffff : 0xd8332b, { x: (ax + bx) / 2, y: 0.5, z: (az + bz) / 2, ry: -Math.atan2(c[1] - a[1], c[0] - a[0]) });
      }
    });
    /* Bauschild mit Hammer vorne */
    [-0.35, 0.35].forEach(px => b.box(0.06, 1.0, 0.06, C.woodD, { x: px, z: z - 0.4 }));
    b.box(1.0, 0.6, 0.05, 0xf6f1e6, { y: 0.75, z: z - 0.37 });
    b.box(0.9, 0.08, 0.06, 0xf2a531, { y: 1.0, z: z - 0.35 });
    b.box(0.08, 0.32, 0.06, 0x6b4a30, { x: -0.1, y: 0.55, z: z - 0.33, rz: 0.6 });
    b.box(0.24, 0.1, 0.07, 0x5a6268, { x: 0.0, y: 0.7, z: z - 0.33, rz: 0.6 });
    /* ein paar Bretter liegen schon bereit */
    for (let i = 0; i < 3; i++) b.box(1.2, 0.05, 0.2, C.woodL, { x: -x + 1, y: 0.03 + i * 0.05, z: z - 1.1, ry: 0.1 * i });
    return b;
  }
  /* Steg: 2 breit, 6 lang, ragt nach +z ins Wasser */
  function lakeSteg() {
    G3.seed(4410);
    const b = new MB();
    b.noise(0.12, () => { for (let i = 0; i < 20; i++) b.box(1.7, 0.07, 0.27, i % 3 ? C.wood : C.woodL, { y: 0.1, z: -2.85 + i * 0.3 }); });
    for (let i = 0; i < 4; i++) [-0.8, 0.8].forEach(x => b.cyl(0.07, 0.07, 0.9, 6, C.woodD, { x, y: -0.7, z: -2.6 + i * 1.75 }));
    [-0.82, 0.82].forEach(x => b.box(0.06, 0.06, 2.6, C.woodD, { x, y: 0.55, z: 1.6 }));
    [-0.82, 0.82].forEach(x => [0.3, 2.9].forEach(z => b.box(0.06, 0.45, 0.06, C.woodD, { x, y: 0.12, z })));
    return b;
  }
  function fHuette() {
    G3.seed(4420);
    const b = new MB();
    b.box(4, 0.12, 3, 0x8a857c);
    b.at({ y: 0.12, z: -0.15 }, () => {
      FM.plankWall(b, 3.4, 1.6, 2.4, 0x5a7a8a);
      FM.windowAt(b, -0.9, 0.7, 1.22, 0.5, 0.45, { frame: 0xffffff, shutter: 0xd8332b });
      b.box(0.6, 1.2, 0.06, 0xf6f1e6, { x: 0.8, z: 1.21 });
      b.at({ y: 1.6 }, () => b.roof(3.8, 2.9, 0.9, 0x8a6a4a, { gable: 0x5a7a8a }));
      FM.windowAt(b, 1.72, 0.7, 0, 0.45, 0.4, { ry: Math.PI / 2, frame: 0xffffff });
    });
    /* Netze, Reuse und Kisten vorm Haus */
    for (let i = 0; i < 8; i++) b.box(0.012, 1.0, 0.012, 0x2d4a3e, { x: -1.8, y: 0.15, z: -0.9 + i * 0.12 });
    for (let j = 0; j < 8; j++) b.box(0.012, 0.012, 0.9, 0x2d4a3e, { x: -1.8, y: 0.15 + j * 0.12, z: -0.48 });
    b.box(0.44, 0.2, 0.32, 0x2f6fb0, { x: 1.4, z: 1.25 }); b.box(0.44, 0.2, 0.32, 0xf2a531, { x: 1.4, y: 0.2, z: 1.25, ry: 0.3 });
    return b;
  }
  /* Bootshaus: halb an Land, halb überm Wasser (+z) */
  function fBoot() {
    G3.seed(4430);
    const b = new MB();
    for (let i = 0; i < 4; i++) [-2.2, 2.2].forEach(x => b.cyl(0.1, 0.1, 1.4, 6, C.woodD, { x, y: -0.9, z: -1.6 + i * 1.3 }));
    b.noise(0.1, () => { b.box(5, 0.12, 1.6, C.wood, { y: 0.1, z: -1.7 }); [-2.0, 2.0].forEach(x => b.box(0.9, 0.12, 5, C.woodL, { x, y: 0.1 })); });
    FM.plankWall(b, 5, 2.0, 0.1, 0x8a3a2e, { y: 0.22, z: -2.45 });
    [-2.45, 2.45].forEach(x => b.at({ x, y: 0.22, ry: Math.PI / 2 }, () => FM.plankWall(b, 4.9, 2.0, 0.1, 0x8a3a2e)));
    b.box(5, 0.5, 0.1, 0x8a3a2e, { y: 1.72, z: 2.45 });
    b.at({ y: 2.22 }, () => b.roof(5.4, 5.4, 1.2, 0x3a4a5a, { ry: Math.PI / 2, gable: 0x8a3a2e }));
    b.box(1.6, 0.32, 0.05, 0xf6f1e6, { y: 1.95, z: 2.52 });
    return b;
  }
  function fLager() {
    G3.seed(4440);
    const b = new MB();
    b.box(4, 0.12, 3, 0x8a857c);
    b.at({ y: 0.12, z: -0.1 }, () => {
      b.box(3.6, 1.7, 2.5, 0xe6eef2, { top: 0xd0d9de });
      for (let i = 0; i < 12; i++) b.box(0.02, 1.7, 2.52, 0xc9d3d9, { x: -1.7 + i * 0.31 });
      b.box(1.3, 1.3, 0.05, 0x5a7a8a, { x: -0.7, z: 1.26 });
      b.box(1.6, 0.35, 0.05, 0x2f6fb0, { x: 0.9, y: 1.2, z: 1.27 });
      b.at({ y: 1.7 }, () => b.roof(3.9, 2.8, 0.6, 0x5a6268, { gable: 0xe6eef2 }));
    });
    for (let i = 0; i < 3; i++) b.box(0.44, 0.2, 0.32, i % 2 ? 0x2f6fb0 : 0xd9e1e6, { x: 1.3, y: i * 0.2, z: 1.35 });
    return b;
  }
  function fMarkt() {
    G3.seed(4450);
    const b = new MB();
    b.noise(0.06, () => b.plate(5, 3, 0xd9d1c2, { y0: 0.012 }));
    [[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.2], [2.2, 1.2]].forEach(([x, z]) => b.box(0.1, 2.1, 0.1, C.woodD, { x, z }));
    for (let i = 0; i < 9; i++) b.box(0.52, 0.05, 2.8, i % 2 ? 0xffffff : 0x2f6fb0, { x: -2.1 + i * 0.52, y: 2.1, rx: 0.12 });
    b.box(4, 0.8, 0.8, C.wood, { z: 0.4, top: 0xd9e1e6 });
    for (let i = 0; i < 6; i++) b.sphere(0.09, 7, 5, 0x9aa8b0, { x: -1.5 + i * 0.6, y: 0.86, z: 0.4, sz: 2.6, sy: 0.55 });
    b.box(2.4, 0.4, 0.05, 0xf6f1e6, { y: 1.6, z: 1.25 });
    b.box(0.8, 0.1, 0.02, 0x2f6fb0, { y: 1.65, z: 1.28 });
    return b;
  }
  function rowboat() {
    G3.seed(4460);
    const b = new MB();
    const S = [[-1.0, 0.15], [-0.7, 0.38], [0, 0.45], [0.7, 0.38], [1.05, 0.05]];
    for (let i = 0; i < S.length - 1; i++) {
      const [z0, w0] = S[i], [z1, w1] = S[i + 1];
      [1, -1].forEach(s => b.quad([s * w0, 0.3, z0], [s * w1, 0.3, z1], [s * w1 * 0.7, -0.05, z1], [s * w0 * 0.7, -0.05, z0], i % 2 ? 0x2f6fb0 : 0x3f78c8));
      b.quad([-w0 * 0.7, -0.05, z0], [w0 * 0.7, -0.05, z0], [w1 * 0.7, -0.05, z1], [-w1 * 0.7, -0.05, z1], 0xc9955a);
      b.quad([-w0 * 0.85, 0.08, z0], [w0 * 0.85, 0.08, z0], [w1 * 0.85, 0.08, z1], [-w1 * 0.85, 0.08, z1], 0xc9955a);
    }
    b.box(0.85, 0.05, 0.22, C.woodL, { y: 0.22, z: -0.1 });
    [-1, 1].forEach(s => b.box(0.04, 0.04, 1.2, C.woodL, { x: s * 0.55, y: 0.28, z: 0, ry: s * 0.25 }));
    return b;
  }
  function motorboat() {
    G3.seed(4470);
    const b = new MB();
    b.box(1.0, 0.4, 2.2, 0xf6f5f0, { y: -0.05 });
    b.box(1.02, 0.1, 2.22, 0x2f6fb0, { y: 0.1 });
    b.cone(0.5, 0.6, 4, 0xf6f5f0, { rx: Math.PI / 2, y: 0.15, z: 1.1, a0: Math.PI / 4, sy: 0.8 });
    b.box(0.8, 0.05, 0.6, 0xc9955a, { y: 0.35, z: -0.3 });
    b.box(0.7, 0.35, 0.05, C.glass, { y: 0.35, z: 0.3, rx: -0.4 });
    b.box(0.25, 0.45, 0.25, 0x2a2a2e, { y: 0.0, z: -1.15 });
    return b;
  }

  /* ------------------------------ Wildtiere ----------------------------- */
  function deer(white) {
    G3.seed(4500);
    const b = new MB(), c = white ? 0xf4f2ec : 0xa86a3c, d = white ? 0xdedad0 : 0x8a5430;
    b.box(0.32, 0.3, 0.75, c, { y: 0.6 });
    [[-0.11, -0.28], [0.11, -0.28], [-0.11, 0.28], [0.11, 0.28]].forEach(([x, z]) => b.box(0.06, 0.6, 0.06, d, { x, z }));
    b.box(0.13, 0.42, 0.13, c, { y: 0.8, z: 0.36, rx: 0.4 });
    b.box(0.16, 0.16, 0.28, c, { y: 1.15, z: 0.5 });
    b.box(0.06, 0.06, 0.06, 0x1d1d20, { y: 1.15, z: 0.65 });
    [-1, 1].forEach(s => { b.box(0.03, 0.25, 0.03, white ? 0xe8d8a0 : 0x6b4a30, { x: s * 0.07, y: 1.3, z: 0.45, rz: s * 0.4 }); b.box(0.03, 0.12, 0.03, white ? 0xe8d8a0 : 0x6b4a30, { x: s * 0.14, y: 1.42, z: 0.45, rz: -s * 0.4 }); });
    b.box(0.08, 0.1, 0.05, 0xffffff, { y: 0.66, z: -0.39 });
    return b;
  }
  function hare() {
    const b = new MB();
    b.sphere(0.13, 7, 5, 0x9a7a5a, { y: 0.14, sz: 1.3 });
    b.sphere(0.08, 7, 5, 0x9a7a5a, { y: 0.24, z: 0.13 });
    [-1, 1].forEach(s => b.box(0.03, 0.18, 0.05, 0x8a6a4a, { x: s * 0.035, y: 0.36, z: 0.11, rx: -0.3 }));
    b.sphere(0.04, 6, 4, 0xffffff, { y: 0.16, z: -0.17 });
    return b;
  }
  function boar() {
    const b = new MB();
    b.box(0.34, 0.32, 0.7, 0x4a3a30, { y: 0.24 });
    b.box(0.06, 0.12, 0.6, 0x3a2e26, { y: 0.56 });
    b.box(0.24, 0.24, 0.26, 0x4a3a30, { y: 0.24, z: 0.44 });
    b.box(0.12, 0.1, 0.06, 0x8a6a5a, { y: 0.24, z: 0.58 });
    [-1, 1].forEach(s => b.box(0.02, 0.07, 0.02, 0xf2ead8, { x: s * 0.07, y: 0.28, z: 0.58, rz: s * 0.4 }));
    [[-0.11, -0.25], [0.11, -0.25], [-0.11, 0.22], [0.11, 0.22]].forEach(([x, z]) => b.box(0.07, 0.12, 0.07, 0x2a221c, { x, z }));
    return b;
  }
  function fox() {
    const b = new MB();
    b.box(0.2, 0.18, 0.5, 0xd86a2a, { y: 0.22 });
    [[-0.07, -0.18], [0.07, -0.18], [-0.07, 0.18], [0.07, 0.18]].forEach(([x, z]) => b.box(0.04, 0.22, 0.04, 0x2a221c, { x, z }));
    b.box(0.16, 0.15, 0.18, 0xd86a2a, { y: 0.34, z: 0.3 });
    b.cone(0.06, 0.16, 4, 0xe8eae6, { rx: Math.PI / 2, y: 0.36, z: 0.4 });
    [-1, 1].forEach(s => b.cone(0.04, 0.1, 4, 0xd86a2a, { x: s * 0.05, y: 0.42, z: 0.28 }));
    b.cyl(0.07, 0.03, 0.4, 6, 0xd86a2a, { rx: -1.9, y: 0.3, z: -0.24, top: 0xffffff });
    return b;
  }
  function squirrel() {
    const b = new MB();
    b.sphere(0.06, 6, 4, 0xb85a28, { y: 0.07, sy: 1.3 });
    b.sphere(0.045, 6, 4, 0xb85a28, { y: 0.15, z: 0.03 });
    b.cyl(0.05, 0.07, 0.18, 6, 0xc8682e, { y: 0.08, z: -0.07, rx: -0.4 });
    return b;
  }
  function bird(c) {
    const b = new MB();
    b.sphere(0.06, 6, 4, c || 0x3a3a40, { sz: 1.6 });
    b.cone(0.02, 0.05, 4, 0xf2a531, { rx: Math.PI / 2, z: 0.1 });
    return b;
  }
  function birdWing(c) {
    const b = new MB();
    b.quad([0, 0, 0.05], [0.18, 0.01, 0.02], [0.16, 0.01, -0.06], [0, 0, -0.05], c || 0x3a3a40);
    b.quad([0, 0, -0.05], [0.16, 0.01, -0.06], [0.18, 0.01, 0.02], [0, 0, 0.05], c || 0x3a3a40);
    return b;
  }
  /* Haustiere */
  function dog() {
    const b = new MB();
    b.box(0.24, 0.2, 0.5, 0xc89a5a, { y: 0.24 });
    [[-0.08, -0.18], [0.08, -0.18], [-0.08, 0.18], [0.08, 0.18]].forEach(([x, z]) => b.box(0.06, 0.24, 0.06, 0xb8884a, { x, z }));
    b.box(0.2, 0.2, 0.22, 0xc89a5a, { y: 0.4, z: 0.3 });
    b.box(0.1, 0.08, 0.1, 0x2a221c, { y: 0.4, z: 0.43 });
    [-1, 1].forEach(s => b.box(0.05, 0.12, 0.08, 0x8a5a2a, { x: s * 0.1, y: 0.44, z: 0.28 }));
    b.cyl(0.03, 0.02, 0.25, 5, 0xc89a5a, { rx: -0.8, y: 0.38, z: -0.27 });
    return b;
  }
  function cat() {
    const b = new MB();
    b.box(0.16, 0.14, 0.36, 0x6a6a72, { y: 0.16 });
    [[-0.05, -0.12], [0.05, -0.12], [-0.05, 0.12], [0.05, 0.12]].forEach(([x, z]) => b.box(0.04, 0.16, 0.04, 0x5a5a62, { x, z }));
    b.sphere(0.09, 7, 5, 0x6a6a72, { y: 0.3, z: 0.2 });
    [-1, 1].forEach(s => b.cone(0.035, 0.07, 4, 0x5a5a62, { x: s * 0.05, y: 0.37, z: 0.2 }));
    b.cyl(0.02, 0.02, 0.3, 5, 0x5a5a62, { rx: -1.1, y: 0.2, z: -0.18 });
    return b;
  }
  function goat() {
    const b = new MB();
    b.box(0.26, 0.26, 0.55, 0xf2ece0, { y: 0.32 });
    [[-0.08, -0.2], [0.08, -0.2], [-0.08, 0.2], [0.08, 0.2]].forEach(([x, z]) => b.box(0.06, 0.32, 0.06, 0xdcd4c4, { x, z }));
    b.box(0.16, 0.2, 0.22, 0xf2ece0, { y: 0.56, z: 0.32 });
    [-1, 1].forEach(s => b.box(0.03, 0.14, 0.03, 0x8a7a6a, { x: s * 0.05, y: 0.72, z: 0.28, rx: -0.5 }));
    b.box(0.05, 0.08, 0.04, 0xdcd4c4, { y: 0.44, z: 0.42 });
    return b;
  }
  /* Leute: Förster, Nachbar, Bürgermeisterin, Mitarbeiter */
  function person(o) {
    o = o || {};
    G3.seed(4600 + (o.seed || 0));
    const b = new MB();
    const shirt = o.shirt || 0x3f78c8, pants = o.pants || 0x3a4a5a, skin = o.skin || 0xf2c9a0, hat = o.hat;
    [-0.07, 0.07].forEach(x => b.box(0.09, 0.42, 0.11, pants, { x }));
    b.box(0.3, 0.38, 0.18, shirt, { y: 0.42 });
    [-1, 1].forEach(s => b.box(0.07, 0.34, 0.08, shirt, { x: s * 0.19, y: 0.44, rz: s * 0.08 }));
    b.sphere(0.12, 8, 6, skin, { y: 0.92 });
    if (o.hair) b.sphere(0.125, 8, 4, o.hair, { y: 0.95, sy: 0.8 });
    if (hat === "hut") { b.cyl(0.2, 0.2, 0.03, 10, 0x4a5a3a, { y: 1.0 }); b.cyl(0.12, 0.1, 0.12, 10, 0x4a5a3a, { y: 1.02 }); b.box(0.03, 0.06, 0.06, 0xd8332b, { x: 0.11, y: 1.06 }); }
    if (hat === "muetze") b.sphere(0.13, 8, 4, 0x2f6fb0, { y: 1.0, sy: 0.6 });
    if (hat === "helm") b.sphere(0.135, 8, 4, 0xf2a531, { y: 1.0, sy: 0.65 });
    if (o.beard) b.box(0.16, 0.1, 0.06, o.beard, { y: 0.84, z: 0.1 });
    b.box(0.03, 0.03, 0.02, 0x1d1d20, { x: 0.04, y: 0.95, z: 0.115 }); b.box(0.03, 0.03, 0.02, 0x1d1d20, { x: -0.04, y: 0.95, z: 0.115 });
    if (o.tool === "axt") { b.box(0.03, 0.5, 0.03, C.woodD, { x: 0.22, y: 0.3, rz: 0.2 }); b.box(0.12, 0.08, 0.02, 0x9aa6af, { x: 0.27, y: 0.55, rz: 0.2 }); }
    return b;
  }
  /* Saison-Deko */
  function cosDeco(k) {
    G3.seed(4700 + k.length);
    const b = new MB();
    if (k === "xmas") {
      b.cyl(0.1, 0.08, 0.3, 6, 0x6b4a30);
      for (let i = 0; i < 4; i++) b.cone(0.75 - i * 0.15, 0.7, 8, i % 2 ? 0x2f7a3a : 0x2c6e36, { y: 0.25 + i * 0.42 });
      for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, y = 0.4 + rnd() * 1.4, r = (0.72 - (y - 0.3) * 0.4) * 0.95; b.sphere(0.06, 6, 4, [0xd8332b, 0xf2c230, 0x3f78c8, 0xffffff][i % 4], { x: Math.cos(a) * r, y, z: Math.sin(a) * r }); }
      b.ico(0.12, 0xf2c230, { y: 2.12 });
    } else if (k === "lantern") {
      [[0, 0, 0.22], [0.32, 0.12, 0.16]].forEach(([x, z, r]) => {
        b.sphere(r, 9, 6, 0xf08a24, { x, y: r * 0.8, z, sy: 0.8 });
        b.box(r * 0.5, r * 0.25, 0.02, C.glow, { x, y: r * 0.85, z: z + r * 0.92 });
        b.box(0.03, 0.08, 0.03, 0x6b8f2c, { x, y: r * 1.6, z });
      });
    } else if (k === "maypole") {
      b.cyl(0.07, 0.05, 3.2, 6, 0xf6f1e6);
      b.cyl(0.4, 0.4, 0.06, 10, 0x2f7a3a, { y: 2.6 });
      for (let i = 0; i < 6; i++) b.box(0.03, 1.8, 0.02, [0xd8332b, 0x3f78c8, 0xf2c230][i % 3], { x: Math.cos(i) * 0.35, y: 0.9, z: Math.sin(i) * 0.35, rz: Math.cos(i) * 0.15, rx: Math.sin(i) * 0.15 });
      b.ico(0.35, 0x4f9a35, { y: 3.2, jitter: 0.3 });
    } else if (k === "snowman") {
      b.sphere(0.35, 9, 7, 0xffffff, { y: 0.32, smooth: true });
      b.sphere(0.25, 9, 7, 0xffffff, { y: 0.78, smooth: true });
      b.sphere(0.17, 9, 7, 0xffffff, { y: 1.12, smooth: true });
      b.cone(0.04, 0.18, 6, 0xf08a24, { rx: Math.PI / 2, y: 1.12, z: 0.16 });
      b.cyl(0.13, 0.13, 0.18, 8, 0x2a2a2e, { y: 1.24 });
      b.cyl(0.2, 0.2, 0.02, 8, 0x2a2a2e, { y: 1.24 });
    } else if (k === "easter") {
      b.box(0.5, 0.06, 0.4, C.woodD);
      b.sphere(0.22, 8, 6, 0xd9b07a, { y: 0.28, sy: 1.1 });
      b.sphere(0.14, 8, 6, 0xd9b07a, { y: 0.58 });
      [-1, 1].forEach(s => b.box(0.05, 0.25, 0.04, 0xc9a06a, { x: s * 0.06, y: 0.78, rz: s * 0.15 }));
      [[0.25, 0.1, 0xf6b3cf], [-0.22, 0.12, 0x8fd1f0], [0.15, -0.14, 0xf2e34a]].forEach(([x, z, c]) => b.sphere(0.06, 7, 5, c, { x, y: 0.1, z, sy: 1.3 }));
    }
    return b;
  }

  return {
    TREE_C, TH, tree, stump, sapling, fallen, logPile, fern, mushrooms, deadLog, boulder, bgPine, bgLeaf, bgBirch, hofGround, hofPath, hofFence,
    terrain, ribbon, smoothLine, forestPath, creekBank, creekWater, bridge, barrier,
    lakeShore, lakeWater, reedPatch, lilyPads,
    sawHall, SAW_BLADE, sawBlades, sawLager, sawBuero, sawLkw, kessel, KESSEL_CHIMNEY, machine, saegebock, yard,
    junk, stall, stallGoods, tractor, trailer, machineHall, stoneWall, stoneGate,
    fPlot, lakeSteg, fHuette, fBoot, fLager, fMarkt, rowboat, motorboat,
    deer, hare, boar, fox, squirrel, bird, birdWing, dog, cat, goat, person, cosDeco
  };
})();
