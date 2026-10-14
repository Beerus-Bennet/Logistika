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
  /* Band entlang einer Linie: ein durchgehender Streifen mit gemeinsamen Ecken
     (keine überlappenden Stücke – die flimmerten beim Zoomen), optional mit
     dunklerem Rand und runden Enden */
  function ribbon(b, pts, w, color, y, edge, caps) {
    const n = pts.length;
    if (n < 2) return;
    const N = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)];
      const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      /* Gehrung: an Knicken etwas breiter, damit die Breite gleich bleibt (begrenzt) */
      let k = 1;
      if (i > 0 && i < n - 1) {
        const d1x = p[0] - a[0], d1z = p[1] - a[1], l1 = Math.hypot(d1x, d1z) || 1, d2x = c[0] - p[0], d2z = c[1] - p[1], l2 = Math.hypot(d2x, d2z) || 1;
        const cos = (d1x * d2x + d1z * d2z) / (l1 * l2);
        k = Math.min(1.6, 1 / Math.max(0.6, Math.sqrt((1 + cos) / 2)));
      }
      return [-dz / l * k, dx / l * k];
    });
    const at = (i, f) => [pts[i][0] + N[i][0] * f, y, pts[i][1] + N[i][1] * f];
    const hw = w / 2;
    for (let i = 1; i < n; i++) {
      b.quad(at(i - 1, hw), at(i, hw), at(i, -hw), at(i - 1, -hw), color);
      if (edge) {
        const e1 = (i0, f) => { const q = at(i0, f); q[1] -= 0.004; return q; };
        b.quad(e1(i - 1, hw * 1.25), e1(i, hw * 1.25), e1(i, hw), e1(i - 1, hw), edge);
        b.quad(e1(i - 1, -hw), e1(i, -hw), e1(i, -hw * 1.25), e1(i - 1, -hw * 1.25), edge);
      }
    }
    if (!caps) return;
    /* runde Enden: Halbkreis in Laufrichtung nach außen */
    [[0, -1], [n - 1, 1]].forEach(([i, dir]) => {
      const p = pts[i], nx = N[i][0], nz = N[i][1], l = Math.hypot(nx, nz) || 1, tx = nz / l * dir, tz = -nx / l * dir;
      const seg = 8, rr = [[hw, color, y]].concat(edge ? [[hw * 1.25, edge, y - 0.004]] : []);
      rr.reverse().forEach(([r, col, yy]) => {
        for (let k = 0; k < seg; k++) {
          const a0 = Math.PI * k / seg, a1 = Math.PI * (k + 1) / seg;
          /* von der einen Seite (Normale) über die Spitze (Tangente) zur anderen */
          const P0 = [p[0] + (nx / l * Math.cos(a0) + tx * Math.sin(a0)) * r, yy, p[1] + (nz / l * Math.cos(a0) + tz * Math.sin(a0)) * r];
          const P1 = [p[0] + (nx / l * Math.cos(a1) + tx * Math.sin(a1)) * r, yy, p[1] + (nz / l * Math.cos(a1) + tz * Math.sin(a1)) * r];
          const C0 = [p[0], yy, p[1]];
          const up = (P0[2] - C0[2]) * (P1[0] - C0[0]) - (P0[0] - C0[0]) * (P1[2] - C0[2]);
          if (up > 0) b.tri(C0, P0, P1, col); else b.tri(C0, P1, P0, col);
        }
      });
    });
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
  /* o.y: Höhe (jeder Weg etwas anders – an Kreuzungen flimmert dann nichts),
     o.ends: [Anfang, Ende] laufen in eine kleine Lichtung mit Baumstamm-Bank aus */
  function forestPath(pts, w, o) {
    o = o || {};
    G3.seed(3900 + pts.length);
    const b = new MB(), P = smoothLine(pts, 6), y = o.y || 0.025, W = w || 1.7;
    (o.ends || []).forEach((on, k) => {
      if (!on) return;
      const p = k ? P[P.length - 1] : P[0], q = k ? P[P.length - 2] : P[1];
      const dx = p[0] - q[0], dz = p[1] - q[1], l = Math.hypot(dx, dz) || 1;
      b.disc(W * 1.15, 14, 0xa89064, { x: p[0] + dx / l * 0.6, z: p[1] + dz / l * 0.6, y0: y - 0.006 });
      /* Bank aus einem halben Stamm am Rand der Lichtung */
      const bx = p[0] + dx / l * 1.5, bz = p[1] + dz / l * 1.5, ry = Math.atan2(dx, dz) + Math.PI / 2;
      b.at({ x: bx, z: bz, ry }, m => { m.cyl(0.2, 0.2, 1.3, 8, 0x8a6040, { rz: Math.PI / 2, x: 0.65, y: 0.2, top: 0xd8b07a }); [-0.45, 0.45].forEach(xx => m.box(0.14, 0.16, 0.3, 0x6b4a30, { x: xx })); });
    });
    b.noise(0.012, () => ribbon(b, P, W, 0xb69a6a, y, 0x8f7c55, true));
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
  function sawHall(m, pv) {
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
    /* Solarmodule der Döring GmbH auf der vorderen Dachfläche: zwei Reihen,
       jede mittig – so sieht es mit jeder Zahl von Modulen symmetrisch aus */
    if (dach && pv) solarRoof(b, pv);
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
  /* Dach 10,6 × 6,6, First 1,6 hoch: vordere Fläche von der Traufe (z = 3,3) bis zum First */
  const PV_COLS = 8, PV_ROWS = 2, PV_W = 1.0, PV_L = 1.55, PV_GAP = 0.12;
  function solarPanel(m) {
    m.box(PV_W, 0.05, PV_L, 0xc8d0d8, { c: false });                                   /* Rahmen */
    m.box(PV_W - 0.08, 0.06, PV_L - 0.08, 0x1d3566, { y: 0.0, top: 0x24427e });          /* Zellen */
    for (let i = 1; i < 3; i++) m.box(0.015, 0.065, PV_L - 0.1, 0x6f8fc8, { x: -PV_W / 2 + i * PV_W / 3 });
    for (let i = 1; i < 6; i++) m.box(PV_W - 0.1, 0.065, 0.015, 0x6f8fc8, { z: -PV_L / 2 + i * PV_L / 6 });
  }
  function solarRoof(b, n) {
    n = Math.min(n, PV_COLS * PV_ROWS);
    const a = Math.atan2(1.6, 3.3), per = [Math.ceil(n / 2), Math.floor(n / 2)];
    b.at({ y: 2.95, z: 3.3, rx: a }, m => {
      per.forEach((k, r) => {
        const sAlong = 0.32 + PV_L / 2 + r * (PV_L + 0.1);
        /* Montageschienen unter der Reihe */
        if (k) [-PV_L * 0.3, PV_L * 0.3].forEach(dz => m.box(k * (PV_W + PV_GAP), 0.04, 0.05, 0x8a929a, { y: 0.02, z: -sAlong + dz }));
        for (let i = 0; i < k; i++) m.at({ x: (i - (k - 1) / 2) * (PV_W + PV_GAP), y: 0.05, z: -sAlong }, solarPanel);
      });
    });
  }
  /* Montagewagen der Döring GmbH: weißer Transporter mit Sonne, Leiter und Modul auf dem Dach */
  function solarVan() {
    G3.seed(4810);
    const b = FM.van(0xf6f6f2);
    [-1, 1].forEach(sx => {
      b.cyl(0.2, 0.2, 0.02, 12, 0xf2c230, { rz: Math.PI / 2, x: sx * 0.51, y: 0.78, z: -0.35 });
      for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; b.box(0.02, 0.05, 0.1, 0xf2a531, { x: sx * 0.515, y: 0.78 + Math.sin(an) * 0.28, z: -0.35 + Math.cos(an) * 0.28, rx: -an }); }
      b.box(0.02, 0.1, 0.9, 0xf2a531, { x: sx * 0.51, y: 0.42, z: 0.05 });
    });
    b.at({ y: 1.2, z: -0.25 }, m => {
      [-0.38, 0.38].forEach(x => m.box(0.04, 0.05, 1.3, 0x55555c, { x }));
      m.at({ y: 0.06, rx: 0.05 }, mm => { mm.box(0.9, 0.04, 1.2, 0xc8d0d8); mm.box(0.84, 0.05, 1.14, 0x1d3566, { top: 0x24427e }); });
      [-0.46, 0.46].forEach(x => m.box(0.04, 0.04, 1.6, 0xb8c0c8, { x, y: 0.12, z: 0.1 }));
      for (let i = 0; i < 6; i++) m.box(0.92, 0.03, 0.03, 0xb8c0c8, { y: 0.12, z: -0.6 + i * 0.27 });
    });
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
  /* Stellplatz des Holzlasters: repariert steht dort nur noch der Platz –
     der Laster selbst ist ein Fahrzeug (holzTruck) und fährt los */
  function sawLkw(ok) {
    if (ok) {
      G3.seed(4031);
      const b = new MB();
      b.noise(0.05, () => b.plate(2.6, 4.8, 0x8f8a80, { y0: 0.014 }));
      [-1.2, 1.2].forEach(x => b.plate(0.08, 4.6, 0xf2efe6, { x, y0: 0.02 }));
      b.plate(2.4, 0.08, 0xf2efe6, { z: -2.3, y0: 0.02 });
      b.box(0.5, 0.12, 0.25, 0x8a6040, { x: 0.8, z: -2.1 }); b.box(0.5, 0.12, 0.25, 0x8a6040, { x: -0.8, z: -2.1 });
      return b;
    }
    return holzTruckMB(false);
  }
  function holzTruck() { return holzTruckMB(true); }
  function holzTruckMB(ok) {
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
  function machine(t, bare) {
    G3.seed(4100 + t.length);
    const b = new MB();
    /* bare: ohne Bodenplatte – für die Bildchen im Laden */
    const base = (w, d) => { if (!bare) b.box(w, 0.12, d, 0x8a857c); };
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
  /* Ware auf dem Stand: v53 – die echten Waren als kleine Modelle nebeneinander */
  function stallGoods(ids, wide) {
    const b = new MB();
    if (ids && ids.length) {
      const W = wide ? 3.6 : 1.5, n = ids.length, rows = n > 3 && !wide ? 2 : 1, per = Math.ceil(n / rows);
      ids.forEach((id, i) => {
        const m = item(id);
        if (!m) return;
        const r = Math.floor(i / per), k = i % per, cnt = Math.min(per, n - r * per);
        b.merge(m, { x: (k - (cnt - 1) / 2) * (W / Math.max(3, per)), y: 0.7, z: rows > 1 ? (r ? 0.16 : -0.14) : 0, s: wide ? 0.42 : 0.3, ry: (i % 2 ? 0.25 : -0.2) });
      });
      return b;
    }
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
    /* Augen in der Glutfarbe – leuchten nachts wie echtes Augenleuchten */
    [-1, 1].forEach(s => b.sphere(0.018, 5, 3, 0xffd47e, { x: s * 0.042, y: 0.37, z: 0.39 }));
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
  /* Nachtschwärmer: Eule (im Flug, Augen leuchten nachts) und Fledermaus */
  function owl() {
    const b = new MB(), c = 0x8a6a48, l = 0xd2bc94;
    b.sphere(0.12, 8, 6, c, { sz: 1.45, bottom: l });
    b.sphere(0.1, 8, 6, c, { y: 0.05, z: 0.15 });
    b.sphere(0.075, 8, 5, l, { y: 0.045, z: 0.2, sz: 0.55 });                       /* Gesichtsschleier */
    [-1, 1].forEach(s => {
      b.sphere(0.024, 6, 4, 0xffd47e, { x: s * 0.034, y: 0.065, z: 0.245 });         /* Augen */
      b.sphere(0.011, 5, 3, 0x1d1d20, { x: s * 0.034, y: 0.065, z: 0.266 });
      b.cone(0.024, 0.07, 4, c, { x: s * 0.06, y: 0.12, z: 0.12, rz: -s * 0.25 });   /* Federohren */
    });
    b.cone(0.016, 0.05, 4, 0x5a4a30, { rx: Math.PI / 2 + 0.5, y: 0.03, z: 0.25 });   /* Schnabel */
    b.box(0.16, 0.025, 0.14, c, { y: -0.01, z: -0.2, top: 0x7a5a3c });              /* Schwanz */
    return b;
  }
  function owlWing() {
    const b = new MB(), c = 0x7a5a3c, l = 0xb89a70;
    b.quad([0, 0, 0.1], [0.24, 0.01, 0.09], [0.34, 0.015, 0.0], [0, 0, -0.08], c);
    b.tri([0, 0, -0.08], [0.34, 0.015, 0.0], [0.26, 0.012, -0.1], c);
    b.quad([0, 0, -0.08], [0.34, 0.015, 0.0], [0.24, 0.01, 0.09], [0, 0, 0.1], l);
    b.tri([0, 0, -0.08], [0.26, 0.012, -0.1], [0.34, 0.015, 0.0], l);
    [0.1, 0.18, 0.26].forEach(x => b.box(0.012, 0.004, 0.12, 0x5a4028, { x, y: 0.012, z: 0.0 }));
    return b;
  }
  function bat() {
    const b = new MB(), c = 0x5a4844;
    b.sphere(0.045, 6, 4, c, { sz: 1.5 });
    b.sphere(0.034, 6, 4, c, { y: 0.012, z: 0.07 });
    [-1, 1].forEach(s => b.cone(0.013, 0.045, 3, c, { x: s * 0.018, y: 0.035, z: 0.07 }));
    return b;
  }
  function batWing() {
    const b = new MB(), c = 0x3e3230;
    /* Flughaut mit gezackter Hinterkante – von beiden Seiten sichtbar */
    const P = [[0, 0, 0.035], [0.1, 0.02, 0.05], [0.21, 0.012, 0.025], [0.17, 0, -0.03], [0.125, 0, -0.008], [0.08, 0, -0.05], [0.035, 0, -0.012], [0, 0, -0.04]];
    for (let i = 1; i < P.length - 1; i++) { b.tri(P[0], P[i], P[i + 1], c); b.tri(P[0], P[i + 1], P[i], c); }
    b.box(0.2, 0.012, 0.012, 0x2e2422, { x: 0.1, y: 0.012, z: 0.035, rz: -0.08 });   /* Arm */
    return b;
  }
  /* Igel: rundlicher Körper voller Stacheln, helle Schnauze */
  function hedgehog() {
    G3.seed(4590);
    const b = new MB(), sp = 0x5a4a3a;
    b.sphere(0.12, 8, 5, 0x6a5848, { y: 0.08, sy: 0.65, sz: 1.25 });
    for (let r = 0; r < 4; r++) for (let k = -2; k <= 2; k++) {
      const z = 0.08 - r * 0.07, a = k * 0.42;
      b.cone(0.03, 0.09, 3, r % 2 ? sp : 0x4a3c30, { x: Math.sin(a) * 0.08, y: 0.08 + Math.cos(a) * 0.06, z, rz: -a * 1.2, rx: -0.7 - r * 0.15 });
    }
    b.cone(0.055, 0.11, 5, 0xc8aa84, { rx: Math.PI / 2, y: 0.06, z: 0.11 });
    b.sphere(0.016, 5, 3, 0x1d1d20, { y: 0.06, z: 0.225 });
    [-1, 1].forEach(s => b.sphere(0.012, 4, 3, 0x1d1d20, { x: s * 0.03, y: 0.09, z: 0.15 }));
    [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.07], [0.06, 0.07]].forEach(([x, z]) => b.box(0.03, 0.04, 0.03, 0x4a3c30, { x, z }));
    return b;
  }
  /* Graureiher: steht im flachen Wasser am Seeufer */
  function heron() {
    const b = new MB(), g = 0x9aa2ac, w = 0xeceef0, d = 0x3a3c44;
    [-1, 1].forEach(s => b.box(0.022, 0.44, 0.022, 0xc8a050, { x: s * 0.045 }));
    b.sphere(0.12, 8, 5, g, { y: 0.54, sz: 1.6, rx: -0.3 });
    [-1, 1].forEach(s => b.box(0.03, 0.09, 0.28, 0x6a707a, { x: s * 0.105, y: 0.5, z: -0.06, rx: -0.3, top: d })); /* Schwingen */
    b.box(0.08, 0.03, 0.14, d, { y: 0.48, z: -0.24, rx: -0.5 });                    /* Schwanz */
    b.cyl(0.032, 0.026, 0.32, 5, w, { y: 0.6, z: 0.14, rx: 0.25 });                  /* Hals */
    b.sphere(0.05, 6, 4, w, { y: 0.92, z: 0.22, sz: 1.2 });
    b.box(0.014, 0.014, 0.14, d, { y: 0.95, z: 0.12, rx: 0.3 });                     /* Schopf */
    b.cone(0.018, 0.17, 4, 0xe0a030, { rx: Math.PI / 2, y: 0.91, z: 0.26 });          /* Schnabel */
    [-1, 1].forEach(s => b.sphere(0.01, 4, 3, 0x1d1d20, { x: s * 0.04, y: 0.93, z: 0.25 }));
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
    /* Kopf (Boxen stehen auf y), Schnauze, Nase und Ziegenbart */
    const F = 0.45;                                                     /* Vorderseite des Kopfs */
    b.box(0.18, 0.21, 0.24, 0xf2ece0, { y: 0.55, z: 0.33 });
    b.box(0.11, 0.09, 0.08, 0xe9e1d2, { y: 0.53, z: F + 0.02 });
    b.box(0.05, 0.02, 0.012, 0x8a6a5a, { y: 0.595, z: F + 0.065 });
    b.box(0.04, 0.09, 0.03, 0xd8cfbf, { y: 0.45, z: F + 0.01 });
    [-1, 1].forEach(s => b.box(0.03, 0.15, 0.03, 0x8a7a6a, { x: s * 0.05, y: 0.74, z: 0.28, rx: -0.5 }));
    [-1, 1].forEach(s => b.box(0.08, 0.035, 0.05, 0xe3dbcb, { x: s * 0.12, y: 0.69, z: 0.28, rz: s * 0.3 }));
    /* Ziege Tim: schwarze, eckige Hornbrille – etwas breiter als der Kopf, Augen dahinter */
    const blk = 0x111113, fz = F + 0.012;
    [-1, 1].forEach(s => {
      const x = s * 0.051;
      b.box(0.064, 0.046, 0.006, 0xe9f4fc, { x, y: 0.638, z: F + 0.004 });                 /* Glas */
      b.box(0.022, 0.024, 0.008, 0x1d1d20, { x: x - s * 0.007, y: 0.65, z: F + 0.008 });  /* Pupille */
      b.box(0.096, 0.022, 0.022, blk, { x, y: 0.683, z: fz });                              /* oben kräftig */
      b.box(0.096, 0.013, 0.02, blk, { x, y: 0.625, z: fz });                               /* unten schmal */
      b.box(0.017, 0.08, 0.022, blk, { x: x + s * 0.0395, y: 0.625, z: fz });
      b.box(0.013, 0.08, 0.02, blk, { x: x - s * 0.0415, y: 0.625, z: fz });
      b.box(0.014, 0.018, 0.2, blk, { x: s * 0.1, y: 0.685, z: F - 0.09 });                /* Bügel */
    });
    b.box(0.03, 0.014, 0.02, blk, { y: 0.672, z: fz });                                     /* Steg */
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
    /* armR: false – der rechte Arm kommt als eigenes, bewegliches Teil dazu (arm()) */
    [-1, 1].forEach(s => { if (s === 1 && o.armR === false) return; b.box(0.07, 0.34, 0.08, shirt, { x: s * 0.19, y: 0.44, rz: s * 0.08 }); });
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
  /* Arm zum Bewegen: Drehpunkt an der Schulter, hängt nach unten, mit Hand */
  function arm(o) {
    o = o || {};
    const b = new MB();
    b.box(0.07, 0.34, 0.08, o.shirt || 0x3f78c8, { y: -0.34 });
    b.box(0.062, 0.065, 0.072, o.skin || 0xf2c9a0, { y: -0.4 });
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

  /* ---------------------- Fliegender Händler ---------------------------
     Bunter Marktwagen: Seitenklappe als gestreiftes Vordach, Theke mit Ware,
     Wimpelkette und ein großes Münzschild auf dem Dach. Theke zeigt nach −x. */
  function traderCart() {
    G3.seed(5600);
    const b = new MB(), body = 0x7a4ac8, trim = 0xf2c230, dark = 0x2a2a30;
    [[0.5, 0.75], [-0.5, 0.75], [0.5, -0.8], [-0.5, -0.8]].forEach(([x, z]) => {
      b.cyl(0.22, 0.22, 0.14, 10, dark, { rz: Math.PI / 2, x: x > 0 ? x + 0.07 : x - 0.07, y: 0.22, z, top: 0x9aa6af });
    });
    b.box(1.1, 0.2, 2.3, 0x4a3a5a, { y: 0.24 });
    /* Fahrerhaus vorn */
    b.box(1.08, 0.75, 0.6, 0xf3f4f6, { y: 0.42, z: 0.85 });
    b.box(1.0, 0.3, 0.05, C.glass, { y: 0.82, z: 1.16, rx: -0.25 });
    b.box(1.1, 0.08, 0.62, trim, { y: 1.17, z: 0.85 });
    /* Kofferaufbau, links (−x) offen */
    b.box(1.12, 1.2, 1.6, body, { y: 0.42, z: -0.35, top: 0x6a3ab8 });
    b.box(0.05, 0.75, 1.5, 0xfff3d6, { x: -0.54, y: 0.62, z: -0.35 });                /* Innenwand hell */
    b.box(0.3, 0.12, 1.55, 0xc9955a, { x: -0.7, y: 0.78, z: -0.35, top: 0xd8a868 });      /* Theke */
    b.box(0.05, 0.4, 1.55, 0xb8884a, { x: -0.84, y: 0.4, z: -0.35 });
    /* Ware: Äpfel, Kürbis, Gläser, Kisten */
    b.noise(0.12, m => {
      for (let i = 0; i < 7; i++) m.sphere(0.07, 6, 4, [0xd8332b, 0xf2a531, 0x7ac043][i % 3], { x: -0.7 + (i % 2) * 0.08, y: 0.97, z: -0.95 + i * 0.1 });
      m.sphere(0.13, 7, 5, 0xe8781e, { x: -0.68, y: 1.0, z: -0.05, sy: 0.75 });
      [0, 1, 2].forEach(i => { m.cyl(0.05, 0.05, 0.14, 7, 0xf2c230, { x: -0.72, y: 0.9, z: 0.12 + i * 0.12 }); m.cyl(0.055, 0.055, 0.03, 7, 0xd8332b, { x: -0.72, y: 1.04, z: 0.12 + i * 0.12 }); });
      m.box(0.26, 0.18, 0.3, 0xc9955a, { x: -0.95, y: 0.0, z: -0.6 });
      m.box(0.24, 0.18, 0.28, 0xb8884a, { x: -1.0, y: 0.0, z: -0.25, ry: 0.3 });
      for (let i = 0; i < 4; i++) m.sphere(0.06, 6, 4, 0xd8332b, { x: -0.95 + (i % 2) * 0.08, y: 0.22, z: -0.66 + (i >> 1) * 0.1 });
    });
    /* Klappe als Vordach, gestreift */
    for (let i = 0; i < 6; i++) b.box(0.9, 0.05, 0.27, i % 2 ? 0xfff3d6 : 0xd8332b, { x: -0.95, y: 1.55, z: -1.03 + i * 0.27, rz: -0.32 });
    [-1.08, 0.38].forEach(z => b.box(0.04, 0.85, 0.04, 0x9aa6af, { x: -1.32, y: 0.0, z }));
    /* Wimpelkette */
    for (let i = 0; i < 7; i++) {
      const z = -1.1 + i * 0.25, col = [0xd8332b, 0xf2c230, 0x3f78c8, 0x47b84f][i % 4];
      b.tri([-1.36, 1.38, z], [-1.36, 1.38, z + 0.2], [-1.36, 1.2, z + 0.1], col);
      b.tri([-1.36, 1.38, z + 0.2], [-1.36, 1.38, z], [-1.36, 1.2, z + 0.1], col);
    }
    /* Münzschild auf dem Dach */
    b.box(0.06, 0.5, 0.06, dark, { y: 1.62, z: -0.35 });
    b.cyl(0.36, 0.36, 0.08, 16, trim, { rx: Math.PI / 2, y: 2.25, z: -0.39, top: 0xffd84a });
    b.cyl(0.24, 0.24, 0.1, 16, 0xe2a91c, { rx: Math.PI / 2, y: 2.25, z: -0.4, top: 0xf2c230 });
    b.box(0.08, 0.26, 0.04, 0xb8860b, { y: 2.12, z: -0.29 });
    return b;
  }

  /* ------------------------ Waren und Werkzeug --------------------------
     Kleine Modelle für Bildchen in Rezepten, Lager und Laden: Stämme je
     Holzart, Bretter, Balken, Platten, Kisten … und die Werkzeuge. */
  const WOOD = { bright: 0xd9b47c, mid: 0xb98550, dark: 0x9a6a3a };
  const LOG_SP = { birke: "birke", kiefer: "kiefer", buche: "buche", eiche: "eiche", edelholz: "kirsche" };
  function logs(b, sp, n) {
    const T = TREE_C[sp] || TREE_C.kiefer, P = [[-0.17, 0.16], [0.17, 0.16], [0, 0.44]].slice(0, n || 3);
    P.forEach(([x, y]) => {
      b.cyl(0.16, 0.16, 1.1, 9, T.bark, { rx: Math.PI / 2, x, y, z: -0.55, top: 0xe6c99a });
      b.cyl(0.1, 0.1, 0.01, 9, 0xd2b07c, { rx: Math.PI / 2, x, y, z: 0.552 });           /* Jahresring */
      if (sp === "birke") for (let i = 0; i < 5; i++) b.box(0.08, 0.025, 0.12, T.mark, { x: x + 0.13, y: y + 0.04 * (i % 3), z: -0.45 + i * 0.2 });
    });
  }
  function planks(b, n, w, t, l, col, cols) {
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      b.box(w, t, l, i % 2 ? col : mix(col, 0xffffff, 0.08), { x: (c - (cols - 1) / 2) * (w + 0.02), y: r * (t + 0.005), z: (rnd() - 0.5) * 0.06 });
    }
  }
  function strap(b, w, h, z) { b.box(w + 0.04, 0.03, 0.06, 0xd8332b, { y: h, z }); [-1, 1].forEach(s => b.box(0.03, h + 0.02, 0.06, 0xd8332b, { x: s * (w / 2 + 0.02), z })); }
  function item(id) {
    G3.seed(5100 + id.length * 13 + id.charCodeAt(0));
    const b = new MB();
    switch (id) {
      case "birke": case "kiefer": case "buche": case "eiche": case "edelholz":
        logs(b, LOG_SP[id]);
        if (id === "edelholz") [[0.1, 0.62, 0.3], [-0.15, 0.4, -0.2]].forEach(([x, y, z]) => b.ico(0.06, 0xffe066, { x, y, z }));
        return b;
      case "aeste":
        for (let i = 0; i < 7; i++) b.cyl(0.035, 0.025, 1.1, 5, 0x7a5a3a, { rx: Math.PI / 2 + (rnd() - 0.5) * 0.15, ry: (rnd() - 0.5) * 0.2, x: (i % 4) * 0.07 - 0.1, y: 0.04 + Math.floor(i / 4) * 0.06, z: -0.55 });
        b.box(0.34, 0.03, 0.05, 0xd8b07a, { y: 0.12 }); return b;
      case "reste":
        sack(b, null, { col: 0xb89a68, dark: 0xa88a58, open: true });
        for (let i = 0; i < 9; i++) b.box(0.08, 0.025, 0.045, 0xe9cfa0, { x: 0.2 + (rnd() - 0.5) * 0.4, y: 0.02, z: 0.3 + (rnd() - 0.5) * 0.3, ry: rnd() * 3 });
        for (let i = 0; i < 5; i++) b.box(0.07, 0.02, 0.04, 0xe9cfa0, { x: (rnd() - 0.5) * 0.12, y: 0.81, z: (rnd() - 0.5) * 0.12, ry: rnd() * 3 });
        return b;
      case "brennholz":
        for (let i = 0; i < 9; i++) b.cyl(0.13, 0.13, 0.55, 3, i % 3 ? 0x8a6040 : 0x7a5032, { rx: Math.PI / 2, ry: 0, rz: (i % 2) * 1.05, x: (i % 3 - 1) * 0.22, y: 0.11 + Math.floor(i / 3) * 0.18, z: -0.27, top: 0xe6c99a });
        return b;
      case "kaminholz":
        for (let i = 0; i < 7; i++) b.cyl(0.1, 0.1, 0.45, 8, TREE_C.buche.bark, { rx: Math.PI / 2, x: [-0.2, 0, 0.2, -0.1, 0.1, -0.2, 0.2][i], y: [0.1, 0.1, 0.1, 0.27, 0.27, 0.27, 0.27][i] + (i > 4 ? 0.0 : 0), z: -0.22, top: 0xe6c99a });
        for (let i = 0; i < 4; i++) b.box(0.62, 0.03, 0.03, 0xf2731e, { y: 0.06 + i * 0.12, z: 0.24 });
        for (let i = 0; i < 4; i++) b.box(0.03, 0.42, 0.03, 0xf2731e, { x: -0.27 + i * 0.18, z: 0.24 });
        return b;
      case "pfosten":
        for (let i = 0; i < 4; i++) {
          const x = (i % 2 - 0.5) * 0.18, y = 0.09 + Math.floor(i / 2) * 0.18;
          b.box(0.16, 0.16, 1.1, WOOD.mid, { x, y: y - 0.08, z: -0.1 });
          b.cone(0.11, 0.25, 4, WOOD.bright, { rx: Math.PI / 2, x, y, z: 0.45, a0: Math.PI / 4 });
        }
        strap(b, 0.38, 0.38, -0.2); return b;
      case "bretter": planks(b, 10, 0.26, 0.05, 1.3, WOOD.mid, 2); strap(b, 0.56, 0.27, 0.3); strap(b, 0.56, 0.27, -0.35); return b;
      case "dielen": planks(b, 8, 0.24, 0.045, 1.4, WOOD.bright, 2); for (let i = 0; i < 4; i++) b.box(0.005, 0.01, 1.4, 0xb8884a, { x: -0.24 + i * 0.16, y: 0.175 }); strap(b, 0.52, 0.19, 0); return b;
      case "balken": [-0.14, 0.14].forEach(x => b.box(0.24, 0.24, 1.5, WOOD.mid, { x, top: 0xc99560 })); b.box(0.24, 0.24, 1.5, WOOD.mid, { y: 0.25, top: 0xc99560 }); return b;
      case "bauholz":
        [-0.13, 0.13].forEach(x => { b.box(0.22, 0.22, 1.5, 0xe0c48e, { x, top: 0xead2a0 }); b.box(0.12, 0.08, 0.005, 0x2f6fb0, { x, y: 0.1, z: 0.752 }); });
        b.box(0.22, 0.22, 1.5, 0xe0c48e, { y: 0.23, top: 0xead2a0 }); return b;
      case "bohlen": [0, 0.13].forEach((y, i) => b.box(0.42, 0.11, 1.4, i ? 0x8a5a34 : 0x7a4c2a, { y, z: i * 0.05, top: 0x9a6a40 })); return b;
      case "platten": for (let i = 0; i < 5; i++) b.box(0.95, 0.06, 0.75, i % 2 ? 0x9a6a3a : 0x8a5a30, { y: i * 0.065, x: (rnd() - 0.5) * 0.05, z: (rnd() - 0.5) * 0.05, top: 0xb98550 }); return b;
      case "kisten": {
        const crate = (x, y, z, ry) => b.at({ x, y, z, ry }, m => {
          m.box(0.5, 0.36, 0.4, 0xc9955a, { top: 0xb8884a });
          for (let i = 0; i < 3; i++) m.box(0.52, 0.03, 0.42, 0xa8753e, { y: 0.06 + i * 0.12 });
          m.box(0.46, 0.01, 0.36, 0x6a4a2a, { y: 0.361 });
        });
        crate(-0.27, 0, 0, 0.05); crate(0.27, 0, 0.02, -0.04); crate(0, 0.38, 0, 0.1); return b;
      }
      case "paletten":
        for (let k = 0; k < 3; k++) b.at({ y: k * 0.16 }, m => {
          [-0.42, 0, 0.42].forEach(x => [-0.32, 0, 0.32].forEach(z => m.box(0.13, 0.08, 0.13, 0xc9a06a, { x, z })));
          for (let i = 0; i < 5; i++) m.box(1.1, 0.03, 0.14, 0xd8b07a, { y: 0.08, z: -0.36 + i * 0.18 });
          [-0.42, 0, 0.42].forEach(x => m.box(0.13, 0.03, 0.85, 0xc09060, { x, y: 0.11 }));
        });
        return b;
      case "moebel":
        [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => b.box(0.06, 0.45, 0.06, 0xb8884a, { x, z }));
        b.box(0.5, 0.05, 0.5, 0xc9955a, { y: 0.45 });
        b.box(0.5, 0.45, 0.05, 0xc9955a, { y: 0.5, z: -0.22 });
        [0.15, 0.3].forEach(y => b.box(0.44, 0.04, 0.03, 0xb8884a, { y: 0.5 + y, z: -0.21 }));
        return b;
      case "tueren":
        b.box(0.7, 1.4, 0.08, 0xa8653c, { top: 0x9a5a34 });
        [[0.4, 0.35], [0.95, 0.35]].forEach(([y]) => b.box(0.52, 0.42, 0.02, 0x8a5030, { y, z: 0.045 }));
        b.sphere(0.04, 6, 4, 0xf2c230, { x: 0.26, y: 0.7, z: 0.07 });
        b.box(0.8, 0.06, 0.12, 0x6a4024, { y: 1.4 });
        return b;
      case "zaun":
        for (let i = 0; i < 6; i++) { b.box(0.1, 0.8, 0.04, 0xd8b07a, { x: -0.5 + i * 0.2 }); b.cone(0.07, 0.1, 4, 0xd8b07a, { x: -0.5 + i * 0.2, y: 0.8, a0: Math.PI / 4, sz: 0.4 }); }
        [0.18, 0.6].forEach(y => b.box(1.25, 0.08, 0.04, 0xb8884a, { y, z: -0.04 }));
        return b;
      case "mehl": case "maismehl": {
        const c = id === "mehl" ? 0xf1ece0 : 0xf2d77a, d = id === "mehl" ? 0xd8cfb8 : 0xd8b84a;
        b.box(0.46, 0.62, 0.3, c, { top: d });
        b.box(0.46, 0.1, 0.22, d, { y: 0.62 });
        b.box(0.3, 0.2, 0.01, id === "mehl" ? 0x3f78c8 : 0x2f8a4a, { y: 0.22, z: 0.151 });
        b.cone(0.05, 0.16, 4, 0xf2c230, { y: 0.24, z: 0.16, sz: 0.3 });
        return b;
      }
      case "schatulle":
        b.box(0.6, 0.3, 0.4, 0xa8553c, { top: 0x9a4a34 });
        b.cyl(0.2, 0.2, 0.6, 10, 0xb8603e, { rz: Math.PI / 2, x: 0.3, y: 0.3, sy: 0.6 });
        b.box(0.62, 0.04, 0.42, 0xf2c230, { y: 0.28 });
        b.box(0.1, 0.12, 0.03, 0xf2c230, { y: 0.24, z: 0.2 });
        return b;
    }
    return goods(id, b);
  }

  /* ------------------------------ Hofwaren -------------------------------
     Säcke, Kisten, Schalen, Backwaren, Milch und Fleisch – so, wie sie im
     Hofladen liegen. Gleiches Licht und gleicher Low-Poly-Stil wie das Holz. */
  const JUTE = 0xd8bf8c, JUTE_D = 0xc4a874, CARD = 0xcdbf9f, CRATE = 0xc9955a, CRATE_D = 0xa8753e;
  /* Jutesack: bauchig, oben zugebunden, vorne ein farbiges Etikett */
  function sack(b, label, o) {
    o = o || {};
    const c = o.col || JUTE, d = o.dark || JUTE_D;
    /* breiter Sack mit Schultern, oben abgebunden und aufgeplustert */
    b.at({ ry: Math.PI / 4 }, m => {
      m.noise(0.05, mm => {
        mm.cyl(0.33, 0.35, 0.46, 10, c, { sz: 0.72, smooth: true, bottom: d });
        mm.cyl(0.33, 0.12, 0.2, 10, c, { y: 0.46, sz: 0.72, smooth: true });
      });
      m.cyl(0.12, 0.12, 0.05, 8, 0x8a6040, { y: 0.64 });
      m.cyl(0.12, o.open ? 0.22 : 0.17, 0.12, 9, d, { y: 0.68, top: o.open ? 0x6a5030 : d });
      if (label != null) { m.box(0.34, 0.26, 0.02, 0xfaf4e4, { y: 0.12, z: 0.25 }); m.box(0.26, 0.15, 0.022, label, { y: 0.17, z: 0.255 }); }
    });
  }
  /* flache Obstkiste aus Latten */
  function crate(b, w, d) {
    b.box(w, 0.06, d, CRATE_D);
    [-1, 1].forEach(s => { b.box(w, 0.2, 0.04, CRATE, { y: 0.04, z: s * (d / 2 - 0.02), top: 0xd8a868 }); b.box(0.04, 0.2, d, CRATE, { x: s * (w / 2 - 0.02), y: 0.04, top: 0xd8a868 }); });
    b.box(w + 0.01, 0.03, 0.045, CRATE_D, { y: 0.13, z: d / 2 - 0.02 });
  }
  /* Früchte im Raster auf einer Fläche verteilen */
  function fill(b, w, d, r, y, fn) {
    const nx = Math.max(1, Math.floor(w / (r * 2.05))), nz = Math.max(1, Math.floor(d / (r * 2.05)));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = (i - (nx - 1) / 2) * r * 2.05 + (rnd() - 0.5) * r * 0.2, z = (j - (nz - 1) / 2) * r * 2.05 + (rnd() - 0.5) * r * 0.2;
      fn(x, y + (rnd() - 0.5) * r * 0.25, z, i * nz + j);
    }
  }
  /* Pappschale (Erdbeeren, Kirschen) */
  function punnet(b, w, d, col) { b.cyl(w * 0.62, w * 0.72, 0.16, 4, col, { a0: Math.PI / 4, sz: d / w, top: mix(col, 0x000000, 0.35) }); }
  function goods(id, b) {
    switch (id) {
      case "weizen":
        sack(b, 0xf0c64a, { open: true });
        for (let i = 0; i < 7; i++) {
          const a = (i - 3) * 0.2, x = Math.sin(a) * 0.22, rz = -a * 0.9;
          b.at({ x: x * 0.4, y: 0.84, z: (i % 2) * 0.05 - 0.02, rz }, m => { m.box(0.016, 0.34, 0.016, 0xc8a040, { y: 0 }); m.cyl(0.035, 0.012, 0.16, 6, 0xf0c64a, { y: 0.32 }); });
        }
        return b;
      case "mais":
        sack(b, 0xf2c230);
        [[-0.18, 0.4], [0.16, 0.32]].forEach(([x, ry], i) => b.at({ x, y: 0.08, z: 0.42, ry, rz: Math.PI / 2 - 0.08 }, m => {
          m.noise(0.12, mm => mm.cyl(0.075, 0.05, 0.42, 8, 0xf2c230, { y: -0.21 }));
          m.cone(0.09, 0.3, 5, 0x7ab648, { y: -0.27, rz: Math.PI, sz: 0.6 });
        }));
        return b;
      case "tomate":
        crate(b, 0.82, 0.58);
        fill(b, 0.7, 0.48, 0.12, 0.2, (x, y, z) => { b.sphere(0.12, 10, 7, 0xe03a2a, { x, y, z, sy: 0.82, smooth: true }); b.box(0.07, 0.02, 0.02, 0x3f8a2a, { x, y: y + 0.1, z, ry: rnd() * 3 }); b.box(0.02, 0.02, 0.07, 0x3f8a2a, { x, y: y + 0.1, z }); });
        return b;
      case "karotte":
        for (let i = 0; i < 6; i++) {
          const x = (i % 3 - 1) * 0.11, y = 0.07 + Math.floor(i / 3) * 0.1, z = (rnd() - 0.5) * 0.06;
          b.cone(0.07, 0.62, 7, 0xf2731e, { x, y, z: z - 0.05, rx: Math.PI / 2, smooth: true });
          for (let k = 0; k < 3; k++) b.box(0.025, 0.025, 0.32, 0x5aa83a, { x: x + (k - 1) * 0.03, y: y + (k - 1) * 0.02, z: z - 0.24, ry: (k - 1) * 0.35, rx: -0.2 });
        }
        b.box(0.4, 0.05, 0.05, 0xd8332b, { y: 0.1, z: -0.02 });
        return b;
      case "kartoffel":
        b.noise(0.06, m => m.cyl(0.3, 0.36, 0.55, 10, JUTE, { top: 0x8a6a40 }));
        b.cyl(0.34, 0.31, 0.08, 10, JUTE_D, { y: 0.52 });
        b.noise(0.15, m => {
          fill(m, 0.46, 0.46, 0.1, 0.6, (x, y, z) => m.ico(0.1, 0xc19a5b, { x, y, z, flat: 0.75, jitter: 0.35 }));
          [[0.34, 0.06, 0.32], [0.12, 0.06, 0.44]].forEach(([x, y, z]) => m.ico(0.1, 0xc19a5b, { x, y, z, flat: 0.7, jitter: 0.35 }));
        });
        return b;
      case "erdbeere":
        punnet(b, 0.7, 0.5, 0x4f9a52);
        fill(b, 0.56, 0.38, 0.085, 0.2, (x, y, z) => { b.cone(0.085, 0.14, 7, 0xe0303a, { x, y: y + 0.12, z, rx: Math.PI, smooth: true }); b.cyl(0.07, 0.04, 0.03, 6, 0x3f8a2a, { x, y: y + 0.11, z }); });
        return b;
      case "kuerbis":
        for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; b.sphere(0.24, 9, 7, 0xf08a24, { x: Math.cos(a) * 0.17, y: 0.3, z: Math.sin(a) * 0.17, sy: 1.15, sx: 0.8, ry: -a, smooth: true }); }
        b.sphere(0.3, 10, 7, 0xe07a1a, { y: 0.3, sy: 0.85, smooth: true });
        b.cyl(0.05, 0.035, 0.18, 6, 0x6b8f2c, { y: 0.55, rz: 0.25 });
        return b;
      case "apfel": case "birne":
        crate(b, 0.82, 0.58);
        fill(b, 0.7, 0.48, 0.12, 0.2, (x, y, z, k) => {
          if (id === "apfel") { b.sphere(0.12, 10, 7, k % 3 ? 0xd8332b : 0x9ac43a, { x, y, z, smooth: true }); b.box(0.015, 0.06, 0.015, 0x6a4a2a, { x, y: y + 0.11, z }); }
          else { b.sphere(0.11, 9, 7, 0xc8d24a, { x, y, z, smooth: true }); b.sphere(0.07, 8, 6, 0xc8d24a, { x, y: y + 0.12, z, smooth: true }); b.box(0.015, 0.06, 0.015, 0x6a4a2a, { x, y: y + 0.2, z }); }
        });
        if (id === "apfel") b.box(0.12, 0.012, 0.06, 0x4f9a3a, { x: 0.05, y: 0.34, z: 0.05, ry: 0.6 });
        return b;
      case "kirsche":
        punnet(b, 0.62, 0.46, 0xf6f1e4);
        fill(b, 0.5, 0.36, 0.07, 0.19, (x, y, z, k) => {
          b.sphere(0.07, 9, 6, 0xa3132a, { x, y: y + 0.03, z, smooth: true });
          if (k % 2 === 0) b.box(0.012, 0.16, 0.012, 0x4a7a2a, { x: x + 0.03, y: y + 0.08, z, rz: -0.4 });
        });
        return b;
      case "ei":
        b.box(0.66, 0.1, 0.44, CARD, { top: 0xb8aa8a });
        b.box(0.66, 0.04, 0.44, CARD, { y: 0.1, z: -0.36, rx: -1.1 });
        for (let i = 0; i < 6; i++) b.sphere(0.085, 9, 7, i === 2 ? 0xf6ead4 : 0xe8c8a0, { x: (i % 3 - 1) * 0.2, y: 0.17, z: (Math.floor(i / 3) - 0.5) * 0.19, sy: 1.25, smooth: true });
        return b;
      case "milch": {
        const st = 0xc8d0d8, st2 = 0xa8b2bc;
        b.cyl(0.26, 0.26, 0.48, 14, st, { smooth: true });
        b.cyl(0.26, 0.13, 0.16, 14, st, { y: 0.48, smooth: true });
        b.cyl(0.13, 0.13, 0.12, 12, st, { y: 0.62, smooth: true });
        b.cyl(0.16, 0.16, 0.05, 12, st2, { y: 0.72 });
        b.cyl(0.05, 0.05, 0.04, 8, st2, { y: 0.77 });
        b.cyl(0.265, 0.265, 0.06, 14, 0x3f78c8, { y: 0.2 });
        [-1, 1].forEach(sx => b.box(0.04, 0.14, 0.05, st2, { x: sx * 0.27, y: 0.46 }));
        return b;
      }
      case "wolle":
        b.noise(0.12, m => { for (let i = 0; i < 9; i++) m.ico(0.17 + rnd() * 0.06, i % 2 ? 0xeee3c8 : 0xf6efdc, { x: (i % 3 - 1) * 0.2 + (rnd() - 0.5) * 0.06, y: 0.13 + (i === 4 ? 0.12 : 0), z: (Math.floor(i / 3) - 1) * 0.17, flat: 0.75, jitter: 0.4, bottom: 0xd8c8a4 }); });
        return b;
      case "spaket": case "rpaket": {
        const meat = id === "spaket" ? 0xef9a92 : 0xb3343c, fat = id === "spaket" ? 0xfbe6dc : 0xf2d8d0;
        b.box(0.72, 0.05, 0.5, 0x2a2a30, { top: 0x3a3a42 });
        b.noise(0.08, m => m.box(0.6, 0.12, 0.4, meat, { y: 0.05 }));
        [-0.12, 0.08].forEach(z => b.box(0.58, 0.012, 0.035, fat, { y: 0.17, z, ry: id === "spaket" ? 0 : 0.3 }));
        if (id === "rpaket") [[-0.15, -0.05], [0.1, 0.1], [0.18, -0.1]].forEach(([x, z]) => b.box(0.08, 0.012, 0.02, fat, { x, y: 0.17, z, ry: rnd() * 3 }));
        b.box(0.22, 0.012, 0.16, 0xfaf4e4, { x: 0.18, y: 0.175, z: 0.1 });
        b.box(0.14, 0.013, 0.04, id === "spaket" ? 0xd8332b : 0x2f6fb0, { x: 0.18, y: 0.176, z: 0.12 });
        return b;
      }
      case "hfutter":
        b.cyl(0.28, 0.34, 0.5, 12, 0xa8b0b8, { top: 0x8a929a });
        b.noise(0.2, m => m.cyl(0.33, 0.33, 0.03, 12, 0xe8c060, { y: 0.48 }));
        b.noise(0.2, m => { for (let i = 0; i < 10; i++) m.ico(0.035, 0xd8a840, { x: (rnd() - 0.5) * 0.4, y: 0.52, z: (rnd() - 0.5) * 0.4 }); });
        b.cyl(0.345, 0.345, 0.04, 12, 0x8a929a, { y: 0.46 });
        b.at({ y: 0.5 }, m => { m.box(0.02, 0.02, 0.5, 0x6a6a72, { y: 0.22, rx: 0 }); [-1, 1].forEach(s => m.box(0.02, 0.24, 0.02, 0x6a6a72, { z: s * 0.25, rx: s * 0.4 })); });
        return b;
      case "kfutter":
        b.noise(0.14, m => m.box(0.9, 0.46, 0.5, 0xd2c45a, { top: 0xc4b84a }));
        [-0.2, 0.2].forEach(x => b.box(0.03, 0.47, 0.51, 0xd8332b, { x }));
        b.noise(0.2, m => { for (let i = 0; i < 6; i++) m.box(0.02, 0.1, 0.02, 0xb8a840, { x: (rnd() - 0.5) * 0.8, y: 0.46, z: (rnd() - 0.5) * 0.4, rz: (rnd() - 0.5) }); });
        return b;
      case "sfutter": sack(b, 0xef9a92, { col: 0xc8a06a, dark: 0xb08a58 }); return b;
      case "schfutter": sack(b, 0x5aa83a, { col: 0xe0d0a8, dark: 0xc8b88e }); return b;
      case "brot":
        b.sphere(0.34, 12, 8, 0xc98a3a, { y: 0.17, sy: 0.55, sz: 1.35, bottom: 0xa86a2a, smooth: true });
        [-0.18, 0, 0.18].forEach(z => b.box(0.24, 0.02, 0.05, 0xf0c88a, { y: 0.335, z, ry: 0.5 }));
        return b;
      case "fladen":
        for (let i = 0; i < 4; i++) {
          b.noise(0.08, m => m.cyl(0.36, 0.36, 0.045, 14, 0xe8c070, { x: (rnd() - 0.5) * 0.05, y: i * 0.05, z: (rnd() - 0.5) * 0.05, top: 0xf0d088 }));
        }
        for (let i = 0; i < 6; i++) b.cyl(0.035, 0.035, 0.006, 6, 0xb8803a, { x: Math.cos(i * 1.1) * 0.2, y: 0.2, z: Math.sin(i * 1.1) * 0.2 });
        return b;
      case "apfelkuchen":
        b.box(0.92, 0.1, 0.64, 0x5a5a62, { top: 0x4a4a52 });
        b.box(0.86, 0.1, 0.58, 0xe0b060, { y: 0.03, top: 0xe8c070 });
        for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) b.cyl(0.06, 0.06, 0.02, 6, 0xf2d878, { x: -0.36 + j * 0.145, y: 0.13, z: -0.21 + i * 0.14, sz: 0.5 });
        for (let i = 0; i < 4; i++) b.box(0.86, 0.025, 0.03, 0xc98a3a, { y: 0.15, z: -0.21 + i * 0.14 });
        return b;
      case "muffins":
        b.box(0.72, 0.12, 0.48, 0xf6f1e4, { top: 0xe8e0cc });
        for (let i = 0; i < 6; i++) {
          const x = (i % 3 - 1) * 0.22, z = (Math.floor(i / 3) - 0.5) * 0.22;
          b.cyl(0.08, 0.1, 0.12, 9, 0xf2a531, { x, y: 0.1, z, stripe: 0xe8902a });
          b.sphere(0.1, 9, 6, 0xc98a3a, { x, y: 0.23, z, sy: 0.7, smooth: true });
          b.sphere(0.06, 8, 5, 0xfaf6ee, { x, y: 0.28, z, sy: 0.6, smooth: true });
          b.cone(0.02, 0.06, 5, 0xf2731e, { x, y: 0.31, z, rz: 0.6 });
        }
        return b;
      case "kirschtorte":
        b.cyl(0.46, 0.46, 0.04, 16, 0xe8e8ec);
        b.cyl(0.4, 0.4, 0.12, 16, 0x5a3020, { y: 0.04, smooth: true });
        b.cyl(0.4, 0.4, 0.04, 16, 0xfaf4ee, { y: 0.16, smooth: true });
        b.cyl(0.4, 0.4, 0.1, 16, 0x5a3020, { y: 0.2, smooth: true });
        b.cyl(0.41, 0.41, 0.05, 16, 0xfaf4ee, { y: 0.3, smooth: true });
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.sphere(0.055, 7, 5, 0xfaf4ee, { x: Math.cos(a) * 0.3, y: 0.37, z: Math.sin(a) * 0.3, sy: 0.8 }); b.sphere(0.045, 7, 5, 0xb3132a, { x: Math.cos(a) * 0.3, y: 0.43, z: Math.sin(a) * 0.3, smooth: true }); }
        b.noise(0.2, m => { for (let i = 0; i < 9; i++) m.box(0.04, 0.012, 0.015, 0x3a2014, { x: (rnd() - 0.5) * 0.36, y: 0.355, z: (rnd() - 0.5) * 0.36, ry: rnd() * 3 }); });
        return b;
      case "pizza":
        b.cyl(0.52, 0.52, 0.05, 18, 0xc99a5a, { top: 0xd8a868 });
        b.cyl(0.46, 0.46, 0.05, 16, 0xe8c070, { y: 0.03 });
        b.cyl(0.4, 0.4, 0.03, 16, 0xd8401e, { y: 0.06 });
        b.noise(0.1, m => { for (let i = 0; i < 7; i++) m.cyl(0.11, 0.11, 0.012, 7, 0xf8e08a, { x: Math.cos(i * 0.9) * 0.2, y: 0.085, z: Math.sin(i * 0.9) * 0.22, sx: 1.3 }); });
        for (let i = 0; i < 6; i++) b.cyl(0.07, 0.07, 0.015, 9, 0xa82a2a, { x: Math.cos(i * 1.05 + 0.4) * 0.26, y: 0.095, z: Math.sin(i * 1.05 + 0.4) * 0.26 });
        [[0.05, 0.05], [-0.15, 0.12], [0.12, -0.18]].forEach(([x, z]) => b.box(0.06, 0.012, 0.04, 0x3f8a2a, { x, y: 0.1, z, ry: x * 9 }));
        return b;
      case "butter":
        b.box(0.5, 0.22, 0.28, 0xf8e27a, { top: 0xfbe98e });
        b.box(0.3, 0.235, 0.29, 0xe2b33a, { x: 0.105, top: 0xf2c84a });
        b.box(0.16, 0.1, 0.005, 0x3f78c8, { x: 0.12, y: 0.07, z: 0.147 });
        return b;
      case "pudding":
        b.box(0.66, 0.03, 0.66, 0xe8e0cc);
        for (let i = 0; i < 4; i++) {
          const x = (i % 2 - 0.5) * 0.3, z = (Math.floor(i / 2) - 0.5) * 0.3;
          b.cyl(0.12, 0.14, 0.12, 10, 0xfaf6ee, { x, y: 0.03, z });
          b.cyl(0.13, 0.1, 0.14, 10, 0xf2d060, { x, y: 0.15, z, top: 0xa0521e, smooth: true });
          b.sphere(0.035, 6, 4, 0xb3132a, { x, y: 0.31, z });
        }
        return b;
      case "kaese": {
        b.cyl(0.42, 0.42, 0.28, 18, 0xf2c84a, { top: 0xf6d870, smooth: true });
        b.cyl(0.425, 0.425, 0.02, 18, 0xd8a838, { y: 0.27 });
        /* ein Keil davor */
        const Y = 0xf6d870, h = 0.24;
        b.at({ x: 0.35, z: 0.42, ry: -0.5 }, m => {
          m.tri([0, 0, 0], [0.32, 0, -0.1], [0.32, 0, 0.1], Y); m.tri([0, h, 0], [0.32, h, 0.1], [0.32, h, -0.1], Y);
          m.quad([0, 0, 0], [0, h, 0], [0.32, h, -0.1], [0.32, 0, -0.1], 0xf0c040); m.quad([0, 0, 0], [0.32, 0, 0.1], [0.32, h, 0.1], [0, h, 0], 0xf0c040);
          m.quad([0.32, 0, -0.1], [0.32, h, -0.1], [0.32, h, 0.1], [0.32, 0, 0.1], 0xd8a838);
          [[0.12, 0.08, 0.035], [0.22, 0.16, -0.03]].forEach(([x, y, z]) => m.sphere(0.025, 6, 4, 0xd8a838, { x, y, z: z + 0.012 }));
        });
        [[0.3, 0.1, 0.2], [-0.25, 0.16, 0.3], [0.05, 0.08, 0.41]].forEach(([x, y, z]) => b.sphere(0.035, 6, 4, 0xd8a838, { x, y, z }));
        return b;
      }
      case "bratwurst":
        b.box(0.8, 0.04, 0.5, 0xfaf6ee, { top: 0xe8e0cc });
        for (let i = 0; i < 10; i++) {
          const z = (i % 5 - 2) * 0.09, y = 0.07 + Math.floor(i / 5) * 0.08;
          b.cyl(0.042, 0.042, 0.58, 8, 0xc06a3a, { rz: Math.PI / 2, x: 0.29, y, z, smooth: true });
          [-0.29, 0.29].forEach(x => b.sphere(0.042, 7, 5, 0xb05a32, { x, y, z }));
        }
        return b;
      case "schinken":
        b.box(0.86, 0.05, 0.56, 0xc99a5a, { top: 0xd8a868 });
        b.sphere(0.3, 11, 8, 0xd87070, { y: 0.3, sx: 1.25, sz: 0.95, bottom: 0xb85a5a, smooth: true });
        b.sphere(0.31, 11, 8, 0xa8603a, { x: -0.04, y: 0.33, sx: 1.18, sy: 0.8, sz: 0.9, smooth: true });
        b.cyl(0.05, 0.05, 0.3, 7, 0xf6efe0, { rz: Math.PI / 2, x: 0.6, y: 0.24 });
        b.sphere(0.07, 7, 5, 0xf6efe0, { x: 0.6, y: 0.24 });
        return b;
      case "gulasch":
        b.cyl(0.22, 0.22, 0.42, 14, 0x8a2a1a, { smooth: true });
        b.cyl(0.222, 0.222, 0.2, 14, 0xfaf4e4, { y: 0.11 });
        b.cyl(0.18, 0.2, 0.06, 14, 0x9a3a2a, { y: 0.42 });
        b.cyl(0.21, 0.21, 0.07, 14, 0xd8332b, { y: 0.47, top: 0xfaf4ee });
        b.box(0.14, 0.08, 0.005, 0xa8603a, { y: 0.17, z: 0.223 });
        return b;
      case "garn": {
        const cols = [0xd8332b, 0x3f78c8, 0xf2c230, 0x47b84f, 0xf6f1e4];
        [[-0.22, 0, 0], [0.22, 0, 0.02], [0, 0, 0.24], [-0.05, 0, -0.2], [0, 0.26, 0.02]].forEach(([x, y, z], i) => {
          b.sphere(0.17, 10, 7, cols[i], { x, y: y + 0.17, z, smooth: true });
          for (let k = 0; k < 3; k++) b.cyl(0.175, 0.175, 0.012, 10, mix(cols[i], 0xffffff, 0.3), { x, y: y + 0.17, z, rx: 0.6 + k * 0.5, ry: k });
        });
        return b;
      }
      case "socken":
        [[-0.17, 0, 0], [0.17, 0.12, 0.08]].forEach(([x, ry, y]) => b.at({ x, y, ry }, m => {
          m.box(0.22, 0.1, 0.52, 0xf2ead8, { z: -0.12, top: 0xf8f2e4 });
          m.box(0.22, 0.1, 0.26, 0xf2ead8, { z: 0.22, x: 0.07, ry: 0.55, top: 0xf8f2e4 });
          [-0.33, -0.2, -0.07].forEach((z, k) => m.box(0.225, 0.105, 0.06, k === 1 ? 0x3f78c8 : 0xd8332b, { z }));
          m.box(0.225, 0.105, 0.09, 0xd8332b, { z: 0.3, x: 0.11, ry: 0.55 });
        }));
        return b;
      case "pullover":
        b.box(0.62, 0.12, 0.56, 0x3f78c8, { top: 0x4a88d8 });
        [-0.14, 0.02, 0.18].forEach(z => b.box(0.62, 0.005, 0.04, 0xf6f1e4, { y: 0.122, z }));
        b.cyl(0.11, 0.11, 0.04, 10, 0x2f5f98, { y: 0.11, z: -0.24, sz: 0.6 });
        [-1, 1].forEach(s => b.box(0.12, 0.13, 0.5, 0x3a70b8, { x: s * 0.22, y: 0.0, z: 0.02, top: 0x4580c8 }));
        return b;
    }
    /* v53: Fische und Fischwaren */
    return typeof FFM !== "undefined" && FFM.fishItem ? FFM.fishItem(id) : null;
  }
  /* Werkzeug: Opas Axt, Stahlaxt, Kettensäge, Profi-Säge */
  function tool(id) {
    G3.seed(5300 + id.length);
    const b = new MB();
    if (id === "axe1" || id === "axe2") {
      const steel = id === "axe2", L = steel ? 1.25 : 1.0;
      b.at({ rz: -0.55 }, m => {
        m.box(0.07, L, 0.06, steel ? 0xc9955a : 0x8a6040, { y: 0 });
        if (steel) m.box(0.08, 0.22, 0.07, 0xd8332b, { y: 0.02 });
        m.box(0.12, 0.14, 0.08, steel ? 0x6f7a84 : 0x4a4440, { y: L - 0.14 });
        m.cone(0.16, 0.3, 4, steel ? 0xc8d0d8 : 0x6a5a4a, { rz: -Math.PI / 2, x: 0.05, y: L - 0.07, sz: 0.3, a0: Math.PI / 4 });
        if (!steel) m.box(0.05, 0.05, 0.085, 0x8a4a2a, { x: 0.12, y: L - 0.1 });
      });
      return b;
    }
    if (id === "saw1" || id === "saw2") {
      const pro = id === "saw2", body = pro ? 0xf2c230 : 0xf2731e, bar = pro ? 1.2 : 0.85;
      b.box(0.4, 0.36, 0.62, body, { y: 0.0, top: pro ? 0xe2b020 : 0xe2631e });
      b.box(0.34, 0.14, 0.46, 0x2a2a30, { y: 0.36, z: -0.04 });
      b.box(0.08, 0.2, 0.34, 0x2a2a30, { y: 0.5, z: -0.12 });                          /* Griff oben */
      b.box(0.44, 0.07, 0.07, 0x2a2a30, { y: 0.46, z: 0.22 });                          /* Bügel vorn */
      [-1, 1].forEach(s => b.box(0.07, 0.4, 0.07, 0x2a2a30, { x: s * 0.2, y: 0.1, z: 0.22 }));
      b.box(0.05, 0.18, bar, 0xd0d6dc, { y: 0.1, z: 0.31 + bar / 2 });                   /* Schwert */
      b.box(0.07, 0.035, bar, 0x2a2a30, { y: 0.27, z: 0.31 + bar / 2 });                 /* Kette oben */
      b.box(0.07, 0.035, bar, 0x2a2a30, { y: 0.07, z: 0.31 + bar / 2 });                 /* Kette unten */
      b.cyl(0.09, 0.09, 0.07, 10, 0x2a2a30, { rz: Math.PI / 2, x: -0.035, y: 0.19, z: 0.31 + bar });
      if (pro) b.box(0.42, 0.06, 0.2, 0x2a2a30, { y: 0.2, z: -0.24 });
      return b;
    }
    if (id === "sickle") {
      /* Sichel: Holzgriff und gebogene Klinge */
      b.at({ rz: -0.5 }, m => {
        m.cyl(0.05, 0.045, 0.5, 8, 0x9a6a3a, { y: -0.5 });
        m.cyl(0.055, 0.055, 0.04, 8, 0x6a4a2a, { y: 0.0 });
        for (let i = 0; i < 9; i++) {
          const a0 = Math.PI * 0.05 + i / 9 * Math.PI * 0.95, a1 = Math.PI * 0.05 + (i + 1) / 9 * Math.PI * 0.95, r = 0.36;
          const x0 = Math.cos(a0) * r - r, y0 = Math.sin(a0) * r + 0.04, x1 = Math.cos(a1) * r - r, y1 = Math.sin(a1) * r + 0.04;
          const len = Math.hypot(x1 - x0, y1 - y0) + 0.01, w = 0.09 * (1 - i / 11);
          m.box(len, w, 0.025, 0xc8d0d8, { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - w / 2, rz: Math.atan2(y1 - y0, x1 - x0), top: 0xe6eef2 });
        }
      });
      return b;
    }
    if (id === "water") {
      /* Gießkanne mit Brause */
      b.cyl(0.26, 0.28, 0.5, 14, 0x3f9a5a, { smooth: true, top: 0x2f7a46 });
      b.cyl(0.27, 0.27, 0.05, 14, 0x2f7a46, { y: 0.45 });
      b.cyl(0.04, 0.05, 0.62, 8, 0x3f9a5a, { x: 0.22, y: 0.12, rz: -0.95 });
      b.cyl(0.07, 0.11, 0.07, 10, 0xd8b84a, { x: 0.5, y: 0.47, rz: -0.95 });
      b.at({ y: 0.5 }, m => { m.box(0.05, 0.3, 0.05, 0x2f7a46, { x: -0.22 }); m.box(0.05, 0.05, 0.05, 0x2f7a46, { x: -0.15, y: 0.3 }); m.box(0.3, 0.05, 0.05, 0x2f7a46, { x: -0.08, y: 0.3, rz: -0.2 }); });
      return b;
    }
    return null;
  }
  /* Ladung beim Beladen: Kiste, Sack, Korb */
  function cargo(k) {
    G3.seed(5400 + k);
    const b = new MB();
    if (k === 1) { b.sphere(0.17, 8, 6, 0xd8c49a, { y: 0.17, sy: 1.1 }); b.cyl(0.05, 0.08, 0.08, 6, 0xd8c49a, { y: 0.34 }); b.box(0.12, 0.02, 0.02, 0x8a6040, { y: 0.35 }); }
    else if (k === 2) { b.cyl(0.17, 0.14, 0.2, 10, 0xb8884a, { top: 0x8a6040 }); for (let i = 0; i < 5; i++) b.sphere(0.06, 6, 4, [0xd8332b, 0xf2a531, 0x7ac043][i % 3], { x: Math.cos(i * 1.3) * 0.08, y: 0.22, z: Math.sin(i * 1.3) * 0.08 }); }
    else { b.box(0.32, 0.24, 0.28, 0xc9955a, { top: 0xb8884a }); b.box(0.34, 0.03, 0.3, 0xa8753e, { y: 0.1 }); }
    return b;
  }

  return {
    traderCart, solarVan, item, tool, cargo,
    TREE_C, TH, tree, stump, sapling, fallen, logPile, fern, mushrooms, deadLog, boulder, bgPine, bgLeaf, bgBirch, hofGround, hofPath, hofFence,
    terrain, ribbon, smoothLine, forestPath, creekBank, creekWater, bridge, barrier,
    lakeShore, lakeWater, reedPatch, lilyPads,
    sawHall, SAW_BLADE, sawBlades, sawLager, sawBuero, sawLkw, holzTruck, kessel, KESSEL_CHIMNEY, machine, saegebock, yard,
    junk, stall, stallGoods, tractor, trailer, machineHall, stoneWall, stoneGate,
    fPlot, lakeSteg, fHuette, fBoot, fLager, fMarkt, rowboat, motorboat,
    deer, hare, boar, fox, squirrel, bird, birdWing, owl, owlWing, bat, batWing, hedgehog, heron, dog, cat, goat, person, arm, cosDeco
  };
})();
