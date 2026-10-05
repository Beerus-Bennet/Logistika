/* =========================================================================
   LOGISTIKA – farmmodels.js
   Alle 3D-Modelle des Hofs, prozedural aus Grundkörpern gebaut (gl3d.js).
   Maßstab: 1 Einheit = 1 Kachel (~2 m). Ursprung = Mitte der Grundfläche,
   Boden auf y = 0, Vorderseite zeigt nach +z.
   ========================================================================= */
const FM = (() => {
  "use strict";
  const C = {
    grass: 0x86bf4a, grass2: 0x79b441, grass3: 0x93c957, grassD: 0x67a238,
    soil: 0x8a5a33, soilD: 0x6e4528, soilL: 0x9c6a3e, dirt: 0xd2b88a, gravel: 0xdccca6,
    wood: 0xb57d48, woodD: 0x8a5a34, woodL: 0xcf9a62, plank: 0xc48b55,
    red: 0xcb4433, redD: 0xa83526, white: 0xf6f1e6, cream: 0xf4e4c4, beam: 0x6e4a2e,
    roof: 0xc4553b, roofD: 0x9e3f2c, slate: 0x5d5560, blueRoof: 0x3f78c8, green: 0x3f8f4a,
    stone: 0xbab4a8, stoneD: 0x98928a, brick: 0xc46a43, brickD: 0xa85434,
    metal: 0xbcc6cd, metalD: 0x9aa6af, black: 0x2a2a2e, glow: 0xffd77d, glass: 0x8fc4dc,
    water: 0x3f9fd6, sand: 0xe9d49b, leaf: 0x5cab3a, leafD: 0x468f2c, leafL: 0x79c24a,
    hay: 0xe8c45a, hayD: 0xcfa640, wheat: 0xf0c64a, sprout: 0x8fd14f
  };
  const MB = G3.MB;
  const rnd = () => G3.srand();

  /* ------------------------------- Helfer ------------------------------- */
  function plankWall(b, w, h, d, color, o) {
    /* Wand aus Brettern: leichte Farbstreifen */
    b.noise(0.12, () => {
      const n = Math.max(2, Math.round(w / 0.28));
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + (i + 0.5) * (w / n);
        b.box(w / n * 0.98, h, d, color, Object.assign({ x }, o || {}));
      }
    });
  }
  function windowAt(b, x, y, z, w, h, o) {
    o = o || {};
    const fr = o.frame || C.white;
    b.box(w + 0.12, h + 0.12, 0.05, fr, { x, y: y - 0.06, z, ry: o.ry || 0 });
    b.at({ x, y, z, ry: o.ry || 0 }, () => {
      b.box(w, h, 0.07, o.lit === false ? C.glass : C.glow, { z: 0.01 });
      /* Sprossen etwas kürzer als die Scheibe, sonst flackern die Kanten */
      b.box(0.05, h - 0.01, 0.09, fr, { y: 0.005, z: 0.01 });
      b.box(w - 0.01, 0.05, 0.09, fr, { y: h / 2 - 0.025, z: 0.01 });
      if (o.shutter) {
        /* Läden liegen ein Stück vor dem Rahmen (nicht in derselben Ebene) */
        b.box(w * 0.48, h + 0.06, 0.05, o.shutter, { x: -w * 0.76, y: -0.03, z: 0.012 });
        b.box(w * 0.48, h + 0.06, 0.05, o.shutter, { x: w * 0.76, y: -0.03, z: 0.012 });
      }
      if (o.flowers) {
        b.box(w + 0.1, 0.14, 0.18, C.woodD, { y: -0.16, z: 0.08 });
        for (let i = 0; i < 5; i++)
          b.ico(0.07, [0xe8425a, 0xf6c445, 0xf08bc2, 0xffffff][i % 4], { x: -w / 2 + 0.08 + i * (w / 4.4), y: -0.02, z: 0.1 });
      }
    });
  }
  function fenceLine(b, x0, z0, x1, z1, o) {
    o = o || {};
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / (o.step || 1))), ang = Math.atan2(z1 - z0, x1 - x0);
    const post = o.post || C.woodD, rail = o.rail || C.wood, h = o.h || 0.55;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      b.box(0.09, h, 0.09, post, { x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, top: post });
    }
    b.at({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, ry: -ang }, () => {
      b.box(len, 0.06, 0.04, rail, { y: h * 0.45 });
      b.box(len, 0.06, 0.04, rail, { y: h * 0.82 });
    });
  }
  function rectFence(b, w, d, o) {
    const x = w / 2, z = d / 2;
    fenceLine(b, -x, -z, x, -z, o);
    fenceLine(b, -x, z, x, z, o);
    fenceLine(b, -x, -z, -x, z, o);
    fenceLine(b, x, -z, x, z, o);
  }
  function wheel(b, r, w, o) {
    b.at(o, () => {
      b.cyl(r, r, w, 12, C.black, { rz: Math.PI / 2, x: w / 2, top: 0x55555c });
      b.cyl(r * 0.45, r * 0.45, w + 0.01, 8, 0xd8d8d8, { rz: Math.PI / 2, x: (w + 0.01) / 2 });
    });
  }
  function bush(b, r, o) {
    b.at(o || {}, () => b.noise(0.18, () => {
      b.ico(r, C.leaf, { y: r * 0.75, jitter: 0.3 });
      b.ico(r * 0.7, C.leafL, { x: r * 0.55, y: r * 0.6, z: r * 0.2, jitter: 0.3 });
      b.ico(r * 0.65, C.leafD, { x: -r * 0.5, y: r * 0.55, z: -r * 0.2, jitter: 0.3 });
    }));
  }

  /* ----------------------------- Gebäude -------------------------------- */
  function house() {
    G3.seed(11);
    const b = new MB();
    b.noise(0.06, () => b.box(4.6, 0.32, 3.5, C.stone, { top: C.stoneD }));
    b.at({ y: 0.32 }, () => {
      b.box(4.3, 2.3, 3.2, C.cream);
      /* Fachwerk vorn (+z) und an den Seiten */
      const fz = 1.61;
      [-2.12, -1.1, 0, 1.1, 2.12].forEach(x => b.box(0.14, 2.3, 0.05, C.beam, { x, z: fz }));
      b.box(4.3, 0.14, 0.05, C.beam, { y: 1.12, z: fz });
      b.box(4.3, 0.14, 0.05, C.beam, { y: 2.18, z: fz });
      b.box(4.3, 0.14, 0.05, C.beam, { y: 0.02, z: fz });
      [[-1.6, 0.5], [1.6, -0.5]].forEach(([x, s]) => b.box(0.12, 1.25, 0.05, C.beam, { x, y: 1.13, z: fz, rz: s }));
      [-1.0, 1.0].forEach(z => b.box(0.05, 2.3, 0.14, C.beam, { x: 2.16, z }));
      b.box(0.05, 0.14, 3.2, C.beam, { x: 2.16, y: 1.12 });
      [-1.0, 1.0].forEach(z => b.box(0.05, 2.3, 0.14, C.beam, { x: -2.16, z }));
      b.box(0.05, 0.14, 3.2, C.beam, { x: -2.16, y: 1.12 });
      /* Fenster mit grünen Läden und Blumenkästen */
      windowAt(b, -1.55, 0.6, fz + 0.03, 0.55, 0.62, { shutter: C.green, flowers: true });
      windowAt(b, 1.55, 0.6, fz + 0.03, 0.55, 0.62, { shutter: C.green, flowers: true });
      windowAt(b, -0.55, 1.55, fz + 0.03, 0.5, 0.5, { shutter: C.green });
      windowAt(b, 0.55, 1.55, fz + 0.03, 0.5, 0.5, { shutter: C.green });
      windowAt(b, 2.18, 0.6, 0, 0.5, 0.58, { ry: Math.PI / 2, shutter: C.green });
      /* Tür */
      b.box(0.82, 1.42, 0.06, C.white, { x: 0.12, z: fz + 0.02 });
      b.noise(0.1, () => b.box(0.7, 1.35, 0.08, C.woodD, { x: 0.12, z: fz + 0.03 }));
      b.box(0.06, 0.06, 0.06, 0xe9c34a, { x: 0.38, y: 0.7, z: fz + 0.09 });
    });
    b.box(1.1, 0.16, 0.5, C.stoneD, { x: 0.12, z: 1.95 });
    /* Dach mit Überstand und Schornstein */
    b.at({ y: 2.62 }, () => {
      b.noise(0.05, () => b.roof(4.9, 3.9, 1.95, C.roof, { gable: C.cream, thick: 0.1 }));
      [-0.5, 0.5].forEach(z => b.box(4.92, 0.05, 0.05, C.roofD, { y: 1.95 * (1 - Math.abs(z) * 2 / 3.9 * 0.9) * 0.0 }));
      b.box(0.42, 1.5, 0.42, C.brick, { x: 1.3, y: 0.6, z: -0.6, top: C.brickD });
      b.box(0.5, 0.12, 0.5, C.stoneD, { x: 1.3, y: 2.1, z: -0.6 });
      /* Gaube */
      b.at({ x: -0.9, y: 0.55, z: 0.9 }, () => {
        b.box(0.8, 0.7, 0.9, C.cream, {});
        windowAt(b, 0, 0.18, 0.46, 0.4, 0.38, { shutter: null });
        b.roof(1.0, 1.1, 0.45, C.roof, { y: 0.7, ry: Math.PI / 2, gable: C.cream });
      });
    });
    /* Bank neben der Tür */
    b.at({ x: 1.35, z: 1.95 }, () => {
      b.box(0.9, 0.06, 0.28, C.wood, { y: 0.3 });
      b.box(0.06, 0.3, 0.24, C.woodD, { x: -0.38 }); b.box(0.06, 0.3, 0.24, C.woodD, { x: 0.38 });
    });
    return b;
  }

  function barn() {
    G3.seed(21);
    const b = new MB();
    b.box(3.7, 0.18, 3.5, C.stoneD);
    b.at({ y: 0.18 }, () => {
      plankWall(b, 3.5, 2.3, 3.3, C.red);
      /* weiße Kanten */
      [[-1.75, -1.65], [1.75, -1.65], [-1.75, 1.65], [1.75, 1.65]].forEach(([x, z]) => b.box(0.14, 2.3, 0.14, C.white, { x, z }));
      b.box(3.6, 0.12, 0.08, C.white, { y: 2.22, z: 1.66 });
      /* großes Tor mit Kreuz */
      b.at({ z: 1.67 }, () => {
        b.box(1.9, 1.75, 0.06, C.white);
        b.noise(0.1, () => b.box(1.75, 1.62, 0.07, C.redD, { y: 0.0 }));
        b.box(0.08, 1.62, 0.09, C.white, {});
        [[-0.45, 0.82], [0.45, -0.82]].forEach(([x, r]) => {
          b.box(0.08, 2.05, 0.09, C.white, { x, y: -0.2, rz: r * 0.55 + (r > 0 ? 0.06 : -0.06) });
        });
        /* Heuboden-Luke */
        b.box(0.8, 0.62, 0.06, C.white, { y: 2.0 });
        b.box(0.66, 0.5, 0.08, C.hay, { y: 2.06 });
        b.noise(0.2, () => { for (let i = 0; i < 6; i++) b.box(0.06, 0.18, 0.04, C.hayD, { x: -0.25 + i * 0.1, y: 2.04, z: 0.06, rz: (rnd() - 0.5) * 0.6 }); });
      });
      windowAt(b, 1.77, 1.1, 0.6, 0.45, 0.45, { ry: Math.PI / 2, lit: false });
      windowAt(b, 1.77, 1.1, -0.6, 0.45, 0.45, { ry: Math.PI / 2, lit: false });
    });
    b.at({ y: 2.48 }, () => {
      b.noise(0.04, () => b.gambrel(3.9, 3.8, 1.9, C.slate, { gable: C.red }));
      b.box(3.95, 0.08, 0.1, 0x4a434d, { y: 1.88 });
      /* Wetterhahn */
      b.at({ x: 0, y: 1.9 }, () => {
        b.box(0.04, 0.55, 0.04, C.black);
        b.box(0.32, 0.04, 0.04, C.black, { y: 0.32 });
        b.box(0.04, 0.04, 0.32, C.black, { y: 0.32 });
        b.box(0.24, 0.16, 0.03, C.black, { y: 0.5 });
        b.box(0.07, 0.1, 0.03, C.black, { x: 0.12, y: 0.6 });
      });
    });
    /* Heuballen am Tor */
    b.cyl(0.32, 0.32, 0.55, 10, C.hay, { rz: Math.PI / 2, x: 1.6, y: 0.32, z: 2.1, top: C.hayD });
    b.cyl(0.32, 0.32, 0.55, 10, C.hay, { rz: Math.PI / 2, x: 1.4, y: 0.32, z: 2.55, ry: 0.4, top: C.hayD });
    return b;
  }

  function silo() {
    G3.seed(31);
    const b = new MB();
    b.cyl(0.95, 0.95, 0.2, 14, C.stoneD);
    b.cyl(0.82, 0.82, 3.1, 14, C.metal, { y: 0.2, stripe: C.metalD, notop: true });
    [0.9, 1.6, 2.3, 3.0].forEach(y => b.cyl(0.85, 0.85, 0.08, 14, 0x8c98a2, { y }));
    b.cone(0.9, 0.85, 14, 0xd25b3f, { y: 3.3 });
    b.cyl(0.12, 0.12, 0.2, 8, 0x8c98a2, { y: 4.1 });
    /* Leiter */
    b.at({ z: 0.86 }, () => {
      b.box(0.04, 3.0, 0.04, C.black, { x: -0.16, y: 0.25 }); b.box(0.04, 3.0, 0.04, C.black, { x: 0.16, y: 0.25 });
      for (let y = 0.4; y < 3.2; y += 0.28) b.box(0.32, 0.03, 0.03, C.black, { y });
    });
    /* Schild mit Ähre */
    b.box(0.6, 0.45, 0.04, C.white, { y: 1.15, z: 0.84 });
    b.box(0.08, 0.32, 0.05, C.wheat, { y: 1.2, z: 0.85 });
    return b;
  }

  function bakery() {
    G3.seed(41);
    const b = new MB();
    b.box(2.9, 0.16, 2.5, C.stoneD);
    b.at({ y: 0.16, x: -0.35 }, () => {
      b.noise(0.12, () => b.box(1.9, 1.7, 2.0, C.brick, { top: C.brickD }));
      /* Mörtelfugen */
      for (let y = 0.3; y < 1.7; y += 0.28) b.box(1.92, 0.025, 2.02, 0xe2b79a, { y });
      windowAt(b, -0.45, 0.85, 1.02, 0.45, 0.5, { shutter: 0x2f6fb0 });
      b.box(0.6, 1.15, 0.06, C.woodD, { x: 0.45, z: 1.02 });
      b.box(0.7, 0.08, 0.1, C.white, { x: 0.45, y: 1.17, z: 1.02 });
      /* Ladenschild mit Brezel */
      b.at({ x: 0.45, y: 1.45, z: 1.13 }, () => {
        b.box(0.04, 0.04, 0.3, C.black, { z: -0.1 });
        b.cyl(0.18, 0.18, 0.04, 12, 0xd99a45, { rx: Math.PI / 2, y: -0.2, z: 0.05, top: 0xc0802f });
      });
      b.at({ y: 1.7 }, () => b.noise(0.05, () => b.roof(2.3, 2.4, 1.0, C.roof, { gable: C.cream })));
    });
    /* Steinofen mit Glut */
    b.at({ x: 0.95, y: 0.16, z: 0.1 }, () => {
      b.noise(0.12, () => {
        b.box(1.1, 0.55, 1.4, C.stone, { top: C.stoneD });
        b.sphere(0.62, 10, 6, C.stone, { y: 0.55, sy: 0.85 });
      });
      b.box(0.5, 0.42, 0.1, 0x3a2a22, { y: 0.56, z: 0.56 });
      b.box(0.38, 0.28, 0.12, C.glow, { y: 0.58, z: 0.57 });
      b.cyl(0.13, 0.11, 1.2, 8, C.stoneD, { y: 0.9, z: -0.3 });
    });
    /* Holzstapel */
    b.at({ x: 1.05, z: 1.05 }, () => {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++)
        b.cyl(0.1, 0.1, 0.55, 7, C.woodL, { rx: Math.PI / 2, x: -0.2 + j * 0.2 + i * 0.1, y: 0.1 + i * 0.18, z: -0.28, top: 0xe3c08f });
    });
    return b;
  }
  /* Rauch- und Glutstelle relativ zur Bäckerei */
  const BAKERY_CHIMNEY = [0.95, 2.4, -0.2];

  function mill() {
    G3.seed(51);
    const b = new MB();
    b.cyl(1.05, 1.05, 0.18, 8, C.stoneD, { a0: Math.PI / 8 });
    b.noise(0.06, () => b.cyl(0.95, 0.62, 3.0, 8, 0xf1e9d8, { y: 0.18, a0: Math.PI / 8 }));
    b.box(0.5, 0.9, 0.06, C.woodD, { y: 0.18, z: 0.9 });
    b.box(0.6, 0.06, 0.12, C.white, { y: 1.1, z: 0.88 });
    windowAt(b, 0, 1.85, 0.73, 0.32, 0.36, { lit: true });
    b.at({ y: 3.15 }, () => {
      b.cyl(0.7, 0.7, 0.18, 8, C.woodD, { a0: Math.PI / 8 });
      b.noise(0.05, () => b.cone(0.78, 0.95, 8, C.roof, { y: 0.15, a0: Math.PI / 8 }));
    });
    /* Galerie */
    b.cyl(0.98, 0.98, 0.06, 8, C.woodD, { y: 1.45, a0: Math.PI / 8 });
    /* Säcke */
    b.sphere(0.2, 7, 5, 0xe9dcc0, { x: 0.75, y: 0.32, z: 0.85, sy: 1.25 });
    b.sphere(0.18, 7, 5, 0xdfcfae, { x: 0.45, y: 0.28, z: 1.05, sy: 1.25 });
    return b;
  }
  /* Flügel: drehen um die z-Achse, Nabe vorn oben am Turm */
  function millSails() {
    G3.seed(52);
    const b = new MB();
    b.cyl(0.12, 0.12, 0.22, 8, C.woodD, { rx: Math.PI / 2, z: -0.05 });
    for (let k = 0; k < 4; k++) {
      b.at({ rz: k * Math.PI / 2 }, () => {
        b.box(0.08, 1.95, 0.06, C.woodD, { y: 0.1, c: false });
        b.at({ y: 0.35, x: 0.19 }, () => {
          b.box(0.3, 1.6, 0.02, 0xfaf3e3, { z: 0.024 });
          for (let i = 0; i < 6; i++) b.box(0.34, 0.03, 0.05, C.wood, { y: i * 0.3 });
        });
      });
    }
    return b;
  }
  const MILL_HUB = [0, 3.35, 0.82];

  function dairy() {
    G3.seed(61);
    const b = new MB();
    b.box(3.0, 0.16, 2.4, C.stoneD);
    b.at({ y: 0.16, x: -0.3 }, () => {
      b.box(2.1, 1.75, 1.9, 0xf7f6f1);
      b.box(2.12, 0.3, 1.92, 0x3f78c8, { top: 0x3f78c8 });
      windowAt(b, -0.5, 0.75, 0.97, 0.5, 0.48, { frame: 0x3f78c8 });
      b.box(0.62, 1.2, 0.06, 0x3f78c8, { x: 0.5, z: 0.97 });
      b.at({ y: 1.75 }, () => b.noise(0.04, () => b.roof(2.45, 2.25, 0.85, C.blueRoof, { gable: 0xf7f6f1 })));
      /* Kuhflecken als Logo */
      b.box(0.5, 0.36, 0.04, C.white, { x: 0.5, y: 1.4, z: 0.97 });
      [[-0.1, 0.1], [0.12, -0.05], [0.0, -0.08]].forEach(([x, y]) => b.box(0.12, 0.09, 0.05, C.black, { x: 0.5 + x, y: 1.55 + y, z: 0.97 }));
    });
    /* Edelstahltank */
    b.at({ x: 1.05, z: -0.2 }, () => {
      b.cyl(0.42, 0.42, 1.7, 12, 0xd9e1e6, { stripe: 0xc6cfd6 });
      b.cone(0.44, 0.25, 12, 0xc6cfd6, { y: 1.7 });
      for (let i = 0; i < 3; i++) b.box(0.05, 0.5, 0.05, 0x8c98a2, { x: Math.cos(i * 2.1) * 0.32, z: Math.sin(i * 2.1) * 0.32, y: -0.3 });
    });
    /* große Milchkanne */
    b.at({ x: 1.1, z: 0.8 }, () => {
      b.cyl(0.2, 0.2, 0.45, 10, 0xdfe5e9);
      b.cyl(0.2, 0.1, 0.12, 10, 0xdfe5e9, { y: 0.45 });
      b.cyl(0.12, 0.12, 0.08, 10, 0xb9c3ca, { y: 0.57 });
    });
    return b;
  }

  /* Hühnerstall (nur das Häuschen, 1,6 × 1,4) */
  function coopHut() {
    G3.seed(71);
    const b = new MB();
    [[-0.65, -0.5], [0.65, -0.5], [-0.65, 0.5], [0.65, 0.5]].forEach(([x, z]) => b.box(0.1, 0.35, 0.1, C.woodD, { x, z }));
    b.at({ y: 0.35 }, () => {
      plankWall(b, 1.5, 1.0, 1.2, C.woodL);
      b.box(0.3, 0.4, 0.06, 0x3a2a22, { x: 0.3, y: 0.08, z: 0.6 });
      windowAt(b, -0.35, 0.45, 0.6, 0.28, 0.24, { lit: true, frame: C.white });
      b.at({ y: 1.0 }, () => b.noise(0.04, () => b.roof(1.85, 1.6, 0.6, C.red, { gable: C.woodL })));
      /* Nestkasten seitlich */
      b.box(0.35, 0.45, 0.9, C.wood, { x: 0.9, y: 0.25 });
      b.box(0.42, 0.06, 1.0, C.red, { x: 0.92, y: 0.72, rz: -0.35 });
    });
    /* Rampe */
    b.box(0.3, 0.04, 0.75, C.wood, { x: 0.3, y: 0.18, z: 0.92, rx: 0.45 });
    return b;
  }
  /* Auslauf: Zaun w × d, Boden, Futtertrog und Tränke */
  function coopRun(w, d) {
    G3.seed(72 + w * 7 + d);
    const b = new MB();
    b.noise(0.1, () => b.plate(w - 0.1, d - 0.1, C.dirt, { y0: 0.012 }));
    for (let i = 0; i < w * d * 2; i++) b.box(0.08, 0.01, 0.08, 0xc2a676, { x: (rnd() - 0.5) * (w - 0.4), y: 0.014, z: (rnd() - 0.5) * (d - 0.4) });
    rectFence(b, w - 0.1, d - 0.1, { step: 0.7, h: 0.5, post: C.woodD, rail: C.woodL });
    /* Trog vorn rechts */
    b.at({ x: w / 2 - 0.8, z: d / 2 - 0.45 }, () => {
      b.box(0.8, 0.16, 0.24, C.woodD);
      b.box(0.7, 0.04, 0.16, 0xd8b65a, { y: 0.15 });
    });
    b.cyl(0.18, 0.15, 0.1, 10, 0x8c98a2, { x: w / 2 - 1.6, z: d / 2 - 0.4 });
    b.cyl(0.14, 0.14, 0.02, 10, C.water, { x: w / 2 - 1.6, y: 0.09, z: d / 2 - 0.4 });
    return b;
  }

  /* Kuhstall: offener Unterstand 2,6 × 1,8 */
  function cowShed() {
    G3.seed(81);
    const b = new MB();
    b.noise(0.1, () => b.plate(2.6, 1.8, 0xc9ad78, { y0: 0.01 }));
    plankWall(b, 2.6, 1.5, 0.12, C.woodD, { z: -0.84 });
    b.box(0.12, 1.4, 1.8, C.woodD, { x: -1.24 });
    b.box(0.12, 1.4, 1.8, C.woodD, { x: 1.24 });
    [-1.2, 0, 1.2].forEach(x => b.box(0.12, 1.55, 0.12, C.beam, { x, z: 0.85 }));
    b.noise(0.05, () => b.box(2.95, 0.1, 2.25, C.red, { y: 1.55, rx: 0.12, top: C.redD }));
    /* Heu im Unterstand */
    b.noise(0.2, () => { b.box(1.2, 0.35, 0.6, C.hay, { x: -0.5, z: -0.45, top: C.hayD }); b.ico(0.32, C.hay, { x: 0.6, y: 0.1, z: -0.45, flat: 0.6, jitter: 0.4 }); });
    return b;
  }
  /* Weide: weißer Zaun, Tränke, Heuraufe */
  function pasture(w, d) {
    G3.seed(82 + w * 7 + d);
    const b = new MB();
    b.noise(0.1, () => b.plate(w - 0.1, d - 0.1, 0x86c246, { y0: 0.01 }));
    for (let i = 0; i < w * d; i++) b.ico(0.08, [0xffffff, 0xf6d64a, 0xe9e2ff][i % 3], { x: (rnd() - 0.5) * (w - 0.6), y: 0.03, z: (rnd() - 0.5) * (d - 0.6), flat: 0.5 });
    rectFence(b, w - 0.1, d - 0.1, { step: 1.0, h: 0.7, post: 0xf3efe6, rail: 0xfaf7f0 });
    b.at({ x: w / 2 - 1.0, z: d / 2 - 0.5 }, () => {
      b.box(1.1, 0.3, 0.35, C.stoneD);
      b.box(1.0, 0.03, 0.27, C.water, { y: 0.27 });
    });
    return b;
  }

  function board() {
    G3.seed(91);
    const b = new MB();
    b.box(0.1, 1.5, 0.11, C.woodD, { x: -0.565 });
    b.box(0.1, 1.5, 0.11, C.woodD, { x: 0.565 });
    b.noise(0.1, () => b.box(1.2, 0.85, 0.08, C.wood, { y: 0.55 }));
    b.box(1.35, 0.06, 0.32, C.red, { y: 1.45, rx: 0.2 });
    [[-0.32, 0.95, 0xffffff], [0.05, 0.98, 0xfff3c2], [0.36, 0.9, 0xffffff], [-0.2, 0.7, 0xffe2e2], [0.25, 0.68, 0xffffff]].forEach(([x, y, c]) =>
      b.box(0.26, 0.2, 0.02, c, { x, y, z: 0.05, rz: (rnd() - 0.5) * 0.2 }));
    return b;
  }

  /* Schuppen mit Pultdach, vorn offen (3 × 2) */
  function shed() {
    G3.seed(95);
    const b = new MB();
    b.noise(0.1, () => b.plate(2.8, 1.8, 0xb9ab8c, { y0: 0.012 }));
    plankWall(b, 2.8, 1.6, 0.1, C.wood, { z: -0.85 });
    b.box(0.1, 1.5, 1.76, C.woodD, { x: -1.36, z: 0.02 });
    b.box(0.1, 1.5, 1.76, C.woodD, { x: 1.36, z: 0.02 });
    [-1.37, 1.37].forEach(x => b.box(0.14, 1.45, 0.13, C.beam, { x, z: 0.87 }));
    b.box(3.1, 0.08, 2.2, 0x6f9a8a, { y: 1.55, rx: 0.14 });
    for (let i = 0; i < 8; i++) b.box(0.04, 0.04, 2.2, 0x5d8577, { x: -1.4 + i * 0.4, y: 1.615, rx: 0.14 });
    /* Werkbank */
    b.box(0.9, 0.06, 0.4, C.woodL, { x: 0.8, y: 0.6, z: -0.6 });
    b.box(0.06, 0.6, 0.35, C.woodD, { x: 0.4, z: -0.6 }); b.box(0.06, 0.6, 0.35, C.woodD, { x: 1.2, z: -0.6 });
    return b;
  }

  /* Hoftor mit Querbalken für das Hofschild */
  function gate() {
    G3.seed(97);
    const b = new MB();
    [-1.6, 1.6].forEach(x => { b.box(0.22, 2.2, 0.22, C.woodD, { x }); b.box(0.32, 0.12, 0.32, C.beam, { x, y: 2.2 }); });
    b.box(3.6, 0.18, 0.18, C.beam, { y: 2.0 });
    b.noise(0.06, () => b.box(2.4, 0.5, 0.08, C.wood, { y: 1.42 }));
    b.box(0.04, 0.3, 0.04, C.black, { x: -0.9, y: 1.68 }); b.box(0.04, 0.3, 0.04, C.black, { x: 0.9, y: 1.68 });
    return b;
  }

  /* ------------------------------- Felder ------------------------------- */
  function fieldSoil(rotation) {
    G3.seed(101);
    const b = new MB();
    b.noise(0.06, () => b.box(1.9, 0.08, 1.9, C.soilD, { top: C.soil }));
    for (let i = 0; i < 4; i++) b.noise(0.08, () => b.box(1.75, 0.07, 0.2, rotation ? 0x9a6c40 : C.soilL, { y: 0.06, z: -0.66 + i * 0.44 }));
    return b;
  }
  /* Pflanzen je Sorte und Stufe (0 Saat, 1 klein, 2 halb, 3 reif) */
  const PLANT_SPOTS = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) PLANT_SPOTS.push([-0.58 + i * 0.58, -0.6 + j * 0.6]);
  function cropMesh(kind, stage) {
    G3.seed(200 + stage * 13 + kind.length * 7);
    const b = new MB();
    const g = [0.25, 0.5, 0.78, 1][stage];
    PLANT_SPOTS.forEach(([x, z], k) => {
      const jx = x + (rnd() - 0.5) * 0.08, jz = z + (rnd() - 0.5) * 0.08, ry = rnd() * 6.28;
      b.at({ x: jx, z: jz, y: 0.08, ry }, () => {
        if (stage === 0) { b.ico(0.05, 0x5b8f2c, { y: 0.03, flat: 0.6 }); b.box(0.02, 0.08, 0.02, C.sprout, { y: 0.02 }); return; }
        PLANT[kind](b, g, stage === 3, k);
      });
    });
    return b;
  }
  const PLANT = {
    weizen(b, g, ripe) {
      const c = ripe ? C.wheat : g > 0.6 ? 0xb9d453 : C.sprout;
      /* dichter Horst: Halme im Kreis, reif mit dicken goldenen Ähren */
      if (g > 0.6) b.cyl(0.16, 0.12, 0.08 * g, 6, ripe ? 0xd7a93a : 0x9cc24a, { top: ripe ? 0xe8bd47 : 0xa9cf52 });
      for (let i = 0; i < 11; i++) {
        const a = i / 11 * 6.28 + (i % 3) * 0.3, r = 0.04 + (i % 3) * 0.055;
        b.at({ x: Math.cos(a) * r, z: Math.sin(a) * r, rz: Math.cos(a) * 0.2, rx: Math.sin(a) * 0.2 }, () => {
          b.box(0.03, 0.45 * g, 0.03, ripe ? 0xdcae3c : c);
          if (g > 0.6) b.box(0.065, 0.17, 0.065, c, { y: 0.45 * g, top: ripe ? 0xfbdc6c : c });
          if (ripe) b.box(0.012, 0.09, 0.012, 0xf3d27a, { y: 0.45 * g + 0.17 });
        });
      }
    },
    mais(b, g, ripe) {
      b.cyl(0.035, 0.025, 0.95 * g, 5, 0x6fae3a);
      for (let i = 0; i < 4; i++) b.box(0.3 * g, 0.02, 0.07, i % 2 ? 0x6fae3a : 0x82c04a, { y: (0.25 + i * 0.17) * g, ry: i * 1.7, x: 0, rz: 0.4 });
      if (g > 0.6) b.at({ y: 0.55 * g, x: 0.05, rz: -0.3 }, () => {
        b.sphere(0.06, 6, 5, ripe ? 0xf5d142 : 0xa6cf55, { sy: 2.2 });
        b.box(0.05, 0.16, 0.05, 0x9ac750, { y: -0.04, x: -0.03, rz: 0.4 });
      });
      if (g > 0.75) b.cone(0.05, 0.16, 4, ripe ? 0xd9b64a : 0x9ac750, { y: 0.95 * g });
    },
    tomate(b, g, ripe, k) {
      b.noise(0.2, () => { b.ico(0.17 * g + 0.04, C.leafD, { y: 0.16 * g, jitter: 0.35 }); b.ico(0.12 * g, C.leaf, { y: 0.32 * g, x: 0.05, jitter: 0.35 }); });
      b.box(0.02, 0.45 * g, 0.02, C.woodL, { x: -0.13 });
      if (g > 0.6) for (let i = 0; i < 4; i++) {
        const a = i * 1.7 + k;
        b.sphere(0.055, 7, 5, ripe ? 0xe8452f : i % 2 ? 0x9ccf4f : 0xc9d55a, { x: Math.cos(a) * 0.14 * g, y: (0.14 + (i % 2) * 0.14) * g, z: Math.sin(a) * 0.14 * g, smooth: true });
      }
    },
    karotte(b, g, ripe) {
      for (let i = 0; i < 5; i++) b.box(0.02, 0.28 * g, 0.06, i % 2 ? 0x5aa83a : 0x6cbc44, { ry: i * 1.25, rz: 0.3, y: 0.0 });
      if (ripe) b.cone(0.06, 0.08, 6, 0xf28a2e, { y: -0.02 });
      if (g > 0.6) b.cyl(0.055, 0.06, 0.03, 6, 0xf28a2e, { y: -0.01 });
    },
    kartoffel(b, g, ripe) {
      b.noise(0.2, () => b.ico(0.16 * g + 0.03, ripe ? 0x7aa04a : C.leaf, { y: 0.12 * g, jitter: 0.4, flat: 0.75 }));
      if (ripe) for (let i = 0; i < 4; i++) b.ico(0.035, 0xffffff, { x: Math.cos(i * 1.6) * 0.12, y: 0.22, z: Math.sin(i * 1.6) * 0.12 });
    },
    erdbeere(b, g, ripe) {
      for (let i = 0; i < 5; i++) b.box(0.1 * g + 0.02, 0.02, 0.1 * g + 0.02, i % 2 ? 0x4c9a2e : 0x5fae3a, { ry: i * 1.25, x: Math.cos(i * 1.25) * 0.06, z: Math.sin(i * 1.25) * 0.06, y: 0.04 + i * 0.012 });
      if (g > 0.6) for (let i = 0; i < 3; i++) b.cone(0.04, 0.07, 6, ripe ? 0xe0283a : 0xf3f0c8, { x: Math.cos(i * 2.1) * 0.12, y: 0.06, z: Math.sin(i * 2.1) * 0.12, rx: Math.PI });
    },
    kuerbis(b, g, ripe) {
      for (let i = 0; i < 3; i++) b.box(0.18 * g, 0.02, 0.14 * g, C.leaf, { ry: i * 2.1, x: Math.cos(i * 2.1) * 0.12 * g, z: Math.sin(i * 2.1) * 0.12 * g, y: 0.03 });
      if (g > 0.6) b.sphere(0.17 * g, 9, 6, ripe ? 0xf08a24 : 0x9dbb3a, { y: 0.12 * g, sy: 0.75, smooth: true });
      if (g > 0.6) b.box(0.03, 0.08, 0.03, 0x6b8f2c, { y: 0.24 * g });
    }
  };

  /* -------------------------------- Bäume ------------------------------- */
  const TREE = {
    apfel: { leaf: [0x5aab3a, 0x6dbd45, 0x4d9a30], fruit: 0xd9332b, shape: 1.0 },
    kirsche: { leaf: [0x4f9e35, 0x5fae3a, 0x3f8a2a], fruit: 0xa8102c, shape: 1.0, pair: true },
    birne: { leaf: [0x67b043, 0x79c24a, 0x58a038], fruit: 0xc8d24a, shape: 1.25, pear: true }
  };
  function treeMesh(kind) {
    G3.seed(300 + kind.length * 11);
    const T = TREE[kind] || TREE.apfel;
    const b = new MB();
    b.noise(0.12, () => {
      b.cyl(0.13, 0.09, 0.95, 6, 0x8b5e3c, { top: 0x7a5233 });
      b.box(0.06, 0.4, 0.06, 0x8b5e3c, { y: 0.7, x: 0.1, rz: -0.6 });
      b.box(0.06, 0.35, 0.06, 0x8b5e3c, { y: 0.75, x: -0.08, rz: 0.6 });
    });
    b.noise(0.16, () => {
      b.ico(0.62, T.leaf[0], { y: 1.35, sy: T.shape * 0.95, jitter: 0.25, detail: 1 });
      b.ico(0.42, T.leaf[1], { x: 0.4, y: 1.15, z: 0.22, jitter: 0.3 });
      b.ico(0.4, T.leaf[2], { x: -0.38, y: 1.2, z: -0.2, jitter: 0.3 });
      b.ico(0.36, T.leaf[1], { x: -0.1, y: 1.75 * (T.shape > 1 ? 1.08 : 1), z: 0.25, jitter: 0.3 });
    });
    return b;
  }
  /* Früchte am Baum (eigener Knoten – nur sichtbar, wenn reif) */
  function treeFruit(kind) {
    G3.seed(330 + kind.length);
    const T = TREE[kind] || TREE.apfel;
    const b = new MB();
    const spots = [[0.45, 1.25, 0.35], [-0.35, 1.05, 0.42], [0.1, 1.0, 0.6], [-0.55, 1.4, 0.05], [0.55, 1.55, -0.1], [0.2, 1.75, 0.45],
      [-0.25, 1.65, 0.42], [0.62, 1.05, -0.2], [-0.15, 1.35, 0.6], [0.3, 1.45, 0.55]];
    spots.forEach(([x, y, z]) => {
      if (T.pair) { b.sphere(0.06, 6, 5, T.fruit, { x: x - 0.04, y, z, smooth: true }); b.sphere(0.06, 6, 5, T.fruit, { x: x + 0.05, y: y - 0.03, z, smooth: true }); b.box(0.015, 0.1, 0.015, 0x4a7a2a, { x, y: y + 0.04, z }); }
      else if (T.pear) { b.sphere(0.09, 7, 6, T.fruit, { x, y, z, sy: 1.3, smooth: true }); }
      else { b.sphere(0.1, 7, 6, T.fruit, { x, y, z, smooth: true }); b.box(0.015, 0.06, 0.015, 0x5a3a20, { x, y: y + 0.1, z }); }
    });
    return b;
  }

  /* -------------------------------- Tiere ------------------------------- */
  function chicken(variant) {
    G3.seed(400 + (variant || 0));
    const b = new MB();
    const body = variant === 1 ? 0xb8662c : variant === 2 ? 0x2d2a2a : 0xfaf6ee;
    const wing = variant === 1 ? 0x9a5222 : variant === 2 ? 0x1e1c1c : 0xece4d6;
    b.box(0.02, 0.1, 0.02, 0xf0a030, { x: 0.05, z: 0.02 }); b.box(0.02, 0.1, 0.02, 0xf0a030, { x: -0.05, z: 0.02 });
    b.box(0.06, 0.012, 0.07, 0xf0a030, { x: 0.05, z: 0.04 }); b.box(0.06, 0.012, 0.07, 0xf0a030, { x: -0.05, z: 0.04 });
    b.at({ y: 0.2 }, () => {
      b.sphere(0.13, 9, 7, body, { sy: 0.85, sz: 1.15, smooth: true });
      b.sphere(0.07, 7, 5, wing, { x: 0.11, sy: 0.7, sz: 1.3, smooth: true });
      b.sphere(0.07, 7, 5, wing, { x: -0.11, sy: 0.7, sz: 1.3, smooth: true });
      /* Schwanz */
      b.cone(0.07, 0.16, 5, wing, { z: -0.14, y: 0.04, rx: -1.1 });
      /* Kopf */
      b.at({ z: 0.12, y: 0.13 }, () => {
        b.sphere(0.075, 8, 6, body, { smooth: true });
        b.cone(0.03, 0.07, 4, 0xf2b230, { z: 0.07, rx: Math.PI / 2, y: -0.005 });
        b.box(0.025, 0.06, 0.08, 0xe03c31, { y: 0.07 });
        b.box(0.02, 0.05, 0.025, 0xe03c31, { y: -0.06, z: 0.05 });
        b.box(0.022, 0.022, 0.01, C.black, { x: 0.068, y: 0.015, z: 0.03, ry: 0.4 });
        b.box(0.022, 0.022, 0.01, C.black, { x: -0.068, y: 0.015, z: 0.03, ry: -0.4 });
      });
    });
    return b;
  }
  function cow(variant) {
    G3.seed(450 + (variant || 0));
    const b = new MB();
    const base = variant === 1 ? 0x8a5a36 : 0xf7f4ee, spot = variant === 1 ? 0xf7f4ee : 0x2b2b2e;
    [[0.17, 0.33], [-0.17, 0.33], [0.17, -0.33], [-0.17, -0.33]].forEach(([x, z]) => {
      b.box(0.1, 0.36, 0.1, base, { x, z, y: 0.04 });
      b.box(0.11, 0.06, 0.11, 0x3a3030, { x, z });
    });
    b.at({ y: 0.6 }, () => {
      b.box(0.5, 0.36, 0.95, base, { c: true });
      b.box(0.46, 0.3, 0.9, base, { c: true, y: 0.03, x: 0, sz: 1.0 });
      /* Flecken */
      [[0.252, 0.05, 0.1, 0.25, 0.18], [-0.252, -0.04, -0.2, 0.3, 0.16], [0.252, -0.05, -0.28, 0.18, 0.14], [0, 0.182, 0.12, 0.26, 0.3]].forEach(([x, y, z, w, h], i) => {
        if (i === 3) b.box(w, 0.012, h, spot, { x, y, z });
        else b.box(0.012, h, w, spot, { x, y, z });
      });
      b.box(0.2, 0.12, 0.22, 0xf1b3a8, { y: -0.22, z: -0.2 });
      /* Schwanz */
      b.box(0.03, 0.4, 0.03, base, { z: -0.48, y: -0.12, rx: 0.15 });
      b.box(0.06, 0.1, 0.06, spot, { z: -0.51, y: -0.34 });
      /* Kopf */
      b.at({ z: 0.55, y: 0.1, rx: 0.25 }, () => {
        b.box(0.3, 0.3, 0.32, base, { c: true });
        b.box(0.18, 0.012, 0.1, spot, { y: 0.152, z: -0.02 });
        b.box(0.3, 0.16, 0.12, 0xf1b3a8, { c: true, z: 0.2, y: -0.06 });
        b.box(0.04, 0.03, 0.02, 0x7a4a44, { x: 0.07, z: 0.265, y: -0.04 }); b.box(0.04, 0.03, 0.02, 0x7a4a44, { x: -0.07, z: 0.265, y: -0.04 });
        b.box(0.04, 0.05, 0.02, C.black, { x: 0.1, y: 0.06, z: 0.165 }); b.box(0.04, 0.05, 0.02, C.black, { x: -0.1, y: 0.06, z: 0.165 });
        b.box(0.14, 0.06, 0.04, base, { x: 0.2, y: 0.08, rz: -0.3 }); b.box(0.14, 0.06, 0.04, base, { x: -0.2, y: 0.08, rz: 0.3 });
        b.cone(0.03, 0.12, 5, 0xefe6cf, { x: 0.1, y: 0.15, rz: -0.4 }); b.cone(0.03, 0.12, 5, 0xefe6cf, { x: -0.1, y: 0.15, rz: 0.4 });
      });
    });
    return b;
  }
  function egg() {
    const b = new MB();
    b.sphere(0.06, 8, 6, 0xf6ead4, { y: 0.07, sy: 1.25, smooth: true });
    return b;
  }
  function milkBottle() {
    const b = new MB();
    b.cyl(0.07, 0.07, 0.16, 10, 0xffffff, { smooth: true });
    b.cyl(0.07, 0.035, 0.07, 10, 0xffffff, { y: 0.16, smooth: true });
    b.cyl(0.04, 0.04, 0.04, 10, 0x3f78c8, { y: 0.23 });
    return b;
  }
  /* Futternapf-Symbol über hungrigen Tieren gibt es als HTML – hier nur der Trog */

  /* Schwein: rosa Hausschwein (0) oder Buntes Bentheimer mit Flecken (1) */
  function pig(variant) {
    G3.seed(470 + (variant || 0));
    const b = new MB();
    const skin = 0xf3aaa2, dark = 0xe28d86, spot = 0x332a2a;
    [[0.11, 0.19], [-0.11, 0.19], [0.11, -0.19], [-0.11, -0.19]].forEach(([x, z]) => {
      b.box(0.08, 0.2, 0.08, skin, { x, z, y: 0.02 });
      b.box(0.085, 0.04, 0.085, 0x6e5048, { x, z });
    });
    b.at({ y: 0.36 }, () => {
      b.sphere(0.2, 11, 8, skin, { sy: 0.86, sz: 1.5, smooth: true });
      if (variant === 1) [[0.15, 0.04, -0.12, 0.1], [-0.14, 0.02, 0.06, 0.08], [0.0, 0.15, -0.18, 0.09], [-0.12, -0.02, -0.2, 0.07]].forEach(([x, y, z, r]) =>
        b.sphere(r, 7, 5, spot, { x, y, z, sx: Math.abs(x) > 0.05 ? 0.45 : 1, sy: Math.abs(x) > 0.05 ? 1 : 0.4, smooth: true }));
      /* Ringelschwanz */
      for (let i = 0; i < 5; i++) b.box(0.025, 0.025, 0.04, dark, { x: Math.cos(i * 1.4) * 0.025, y: 0.06 + Math.sin(i * 1.4) * 0.025, z: -0.3 - i * 0.012 });
      /* Kopf mit Rüssel, Schlappohren */
      b.at({ z: 0.29, y: 0.04 }, () => {
        b.sphere(0.13, 10, 7, skin, { sz: 0.92, smooth: true });
        b.cyl(0.068, 0.07, 0.07, 12, 0xf7bab3, { rx: Math.PI / 2, z: 0.09, y: -0.025, top: 0xe8968f });
        b.box(0.018, 0.026, 0.01, 0x7a3c3c, { x: 0.024, y: -0.025, z: 0.162 }); b.box(0.018, 0.026, 0.01, 0x7a3c3c, { x: -0.024, y: -0.025, z: 0.162 });
        b.box(0.024, 0.024, 0.01, C.black, { x: 0.07, y: 0.04, z: 0.1, ry: 0.5 }); b.box(0.024, 0.024, 0.01, C.black, { x: -0.07, y: 0.04, z: 0.1, ry: -0.5 });
        [1, -1].forEach(s => b.cone(0.055, 0.12, 4, variant === 1 ? spot : dark, { x: s * 0.085, y: 0.09, z: 0.0, rx: 0.9, rz: -s * 0.35 }));
      });
    });
    return b;
  }
  /* Schaf: Schwarzkopf (0) oder helles Merino (1); geschoren schmal und hell */
  function sheep(variant, shorn) {
    G3.seed(490 + (variant || 0) * 3 + (shorn ? 1 : 0));
    const b = new MB();
    const wool = variant === 1 ? 0xeee5d3 : 0xf8f5ee, face = variant === 1 ? 0xeedfca : 0x2c2727, leg = variant === 1 ? 0xd8c7ae : 0x2c2727;
    [[0.1, 0.17], [-0.1, 0.17], [0.1, -0.17], [-0.1, -0.17]].forEach(([x, z]) => b.box(0.05, 0.26, 0.05, leg, { x, z }));
    b.at({ y: 0.4 }, () => {
      if (shorn) b.sphere(0.15, 10, 7, 0xf1e5d6, { sy: 0.9, sz: 1.5, smooth: true });
      else b.noise(0.07, () => {
        b.at({ sz: 1.3 }, () => b.ico(0.22, wool, { jitter: 0.18, detail: 1 }));
        [[0.13, 0.08, 0.12], [-0.13, 0.08, 0.1], [0.12, 0.1, -0.14], [-0.12, 0.09, -0.15], [0, 0.17, 0], [0, 0.12, -0.24], [0.15, -0.05, 0], [-0.15, -0.05, -0.02]].forEach(([x, y, z]) =>
          b.ico(0.1, wool, { x, y, z, jitter: 0.3 }));
      });
      b.ico(0.05, shorn ? 0xf1e5d6 : wool, { z: shorn ? -0.22 : -0.3, y: 0.02 });
      b.at({ z: shorn ? 0.24 : 0.29, y: 0.1, rx: 0.3 }, () => {
        b.sphere(0.075, 8, 6, face, { sz: 1.4, sy: 1.05, smooth: true });
        [1, -1].forEach(s => b.box(0.1, 0.035, 0.05, face, { x: s * 0.08, y: 0.03, z: -0.02, rz: s * 0.4 }));
        b.box(0.02, 0.02, 0.01, variant === 1 ? C.black : 0xf2e6c8, { x: 0.045, y: 0.025, z: 0.07 }); b.box(0.02, 0.02, 0.01, variant === 1 ? C.black : 0xf2e6c8, { x: -0.045, y: 0.025, z: 0.07 });
        if (!shorn) b.ico(0.06, wool, { y: 0.07, z: -0.03, jitter: 0.3 });
      });
    });
    return b;
  }
  /* Mastrind: Angus schwarz (0) oder Hochlandrind mit Hörnern und Zottelfell (1) */
  function beef(variant) {
    G3.seed(460 + (variant || 0));
    const b = new MB();
    const hl = variant === 1, base = hl ? 0xa9592c : 0x2b2827, dark = hl ? 0x8a4521 : 0x1d1b1a;
    [[0.19, 0.33], [-0.19, 0.33], [0.19, -0.33], [-0.19, -0.33]].forEach(([x, z]) => {
      b.box(0.12, 0.34, 0.12, base, { x, z, y: 0.04 });
      b.box(0.13, 0.06, 0.13, 0x2a2222, { x, z });
    });
    b.at({ y: 0.6 }, () => {
      b.noise(hl ? 0.18 : 0.05, () => {
        b.box(0.58, 0.42, 1.0, base, { c: true });
        b.box(0.52, 0.2, 0.9, base, { c: true, y: 0.2 });
        if (hl) for (let i = 0; i < 14; i++) b.box(0.05, 0.16, 0.05, dark, { x: (i % 2 ? 1 : -1) * 0.29, y: -0.2, z: -0.45 + (i >> 1) * 0.14, rz: (i % 2 ? -1 : 1) * 0.15 });
      });
      b.box(0.03, 0.42, 0.03, base, { z: -0.51, y: -0.18, rx: 0.12 });
      b.box(0.07, 0.12, 0.07, dark, { z: -0.53, y: -0.4 });
      b.at({ z: 0.58, y: 0.1, rx: 0.3 }, () => {
        b.noise(hl ? 0.15 : 0.04, () => b.box(0.32, 0.32, 0.34, base, { c: true }));
        b.box(0.3, 0.17, 0.12, hl ? 0x6a3a22 : 0x3a3434, { c: true, z: 0.21, y: -0.07 });
        b.box(0.04, 0.03, 0.02, C.black, { x: 0.07, z: 0.275, y: -0.05 }); b.box(0.04, 0.03, 0.02, C.black, { x: -0.07, z: 0.275, y: -0.05 });
        if (hl) {
          b.noise(0.2, () => { for (let i = 0; i < 7; i++) b.box(0.06, 0.16, 0.04, 0xc06a33, { x: -0.15 + i * 0.05, y: 0.08, z: 0.17, rx: 0.2 }); });
          [1, -1].forEach(s => b.at({ x: s * 0.17, y: 0.12 }, () => { b.cone(0.045, 0.32, 6, 0xefe4c8, { rz: -s * 1.2 }); b.box(0.04, 0.04, 0.04, 0x4a3a2a, { x: s * 0.27, y: 0.13 }); }));
        } else {
          b.box(0.04, 0.05, 0.02, 0x8a6a5a, { x: 0.1, y: 0.06, z: 0.175 }); b.box(0.04, 0.05, 0.02, 0x8a6a5a, { x: -0.1, y: 0.06, z: 0.175 });
        }
        b.box(0.15, 0.07, 0.04, base, { x: 0.21, y: 0.06, rz: -0.3 }); b.box(0.15, 0.07, 0.04, base, { x: -0.21, y: 0.06, rz: 0.3 });
      });
    });
    return b;
  }
  /* Wollknäuel neben dem Schaf, wenn es zum Scheren bereit ist */
  function woolBall() {
    G3.seed(497);
    const b = new MB();
    b.noise(0.1, () => b.ico(0.1, 0xf8f5ee, { y: 0.09, jitter: 0.3 }));
    b.box(0.14, 0.012, 0.012, 0xe8dcc4, { y: 0.12, ry: 0.5 });
    return b;
  }

  /* Schweinestall: Matsch, Suhle, Trog, Holzzaun (Hütte als eigener Knoten) */
  function pigRun(w, d) {
    G3.seed(74 + w * 7 + d);
    const b = new MB();
    b.noise(0.1, () => b.plate(w - 0.1, d - 0.1, 0x9a7650, { y0: 0.012 }));
    for (let i = 0; i < w * d * 2; i++) b.box(0.1, 0.01, 0.06, i % 3 ? 0x86663f : 0xd8be6a, { x: (rnd() - 0.5) * (w - 0.4), y: 0.015, z: (rnd() - 0.5) * (d - 0.4), ry: rnd() * 3 });
    /* Suhle */
    b.at({ x: w / 2 - 1.3, z: -d / 2 + 1.3 }, () => {
      b.disc(0.75, 16, 0x5d4430, { y0: 0.02, wob: 0.12 });
      b.disc(0.5, 14, 0x4f3a2a, { y0: 0.025, wob: 0.15 });
    });
    rectFence(b, w - 0.1, d - 0.1, { step: 0.8, h: 0.55, post: 0x6e4a2e, rail: 0x9a6a3c });
    b.at({ x: w / 2 - 0.9, z: d / 2 - 0.45 }, () => {
      b.box(1.0, 0.18, 0.28, 0x8c98a2);
      b.box(0.9, 0.04, 0.2, 0xb08a52, { y: 0.17 });
    });
    return b;
  }
  /* Schweinehütte mit rundem Wellblechdach (1,6 × 1,3) */
  function pigHut() {
    G3.seed(76);
    const b = new MB();
    plankWall(b, 1.5, 0.75, 0.08, C.woodL, { z: -0.6 });
    b.box(0.08, 0.75, 1.2, C.woodD, { x: -0.72 }); b.box(0.08, 0.75, 1.2, C.woodD, { x: 0.72 });
    for (let i = 0; i <= 8; i++) {
      const a = i / 8 * Math.PI, a2 = (i + 1) / 8 * Math.PI;
      if (i === 8) break;
      const y0 = 0.75 + Math.sin(a) * 0.45, y1 = 0.75 + Math.sin(a2) * 0.45, x0 = Math.cos(a) * 0.82, x1 = Math.cos(a2) * 0.82;
      b.quad([x0, y0, 0.7], [x0, y0, -0.7], [x1, y1, -0.7], [x1, y1, 0.7], i % 2 ? 0xb8463a : 0xc9554a);
      b.quad([x1, y1, 0.7], [x1, y1, -0.7], [x0, y0, -0.7], [x0, y0, 0.7], 0x8e3a30);
    }
    b.noise(0.2, () => b.box(1.2, 0.15, 0.6, C.hay, { y: 0.0, z: -0.2, top: C.hayD }));
    return b;
  }
  /* Schafweide: Wiese mit Klee, niedriger Holzzaun, Heuraufe, Wanne */
  function sheepPasture(w, d) {
    G3.seed(86 + w * 7 + d);
    const b = new MB();
    b.noise(0.1, () => b.plate(w - 0.1, d - 0.1, 0x93c955, { y0: 0.01 }));
    for (let i = 0; i < w * d * 1.4; i++) b.ico(0.06, [0xffffff, 0xd9a7e8, 0x5fae3a][i % 3], { x: (rnd() - 0.5) * (w - 0.6), y: 0.025, z: (rnd() - 0.5) * (d - 0.6), flat: 0.5 });
    rectFence(b, w - 0.1, d - 0.1, { step: 0.9, h: 0.5, post: 0x5c3d24, rail: 0x8a6038 });
    b.at({ x: w / 2 - 0.9, z: d / 2 - 0.5 }, () => {
      b.box(0.7, 0.5, 0.5, C.woodD);
      for (let i = 0; i < 6; i++) b.box(0.03, 0.4, 0.03, C.woodL, { x: -0.3 + i * 0.12, y: 0.5, z: 0.22 });
      b.noise(0.2, () => b.box(0.62, 0.25, 0.4, C.hay, { y: 0.5, top: C.hayD }));
    });
    b.cyl(0.28, 0.25, 0.18, 12, 0x8c98a2, { x: w / 2 - 2.1, z: d / 2 - 0.45 });
    b.cyl(0.24, 0.24, 0.02, 12, C.water, { x: w / 2 - 2.1, y: 0.16, z: d / 2 - 0.45 });
    return b;
  }
  /* Unterstand für die Schafe (1,9 × 1,3) */
  function sheepShelter() {
    G3.seed(88);
    const b = new MB();
    b.noise(0.1, () => b.plate(1.9, 1.3, 0xc9ad78, { y0: 0.012 }));
    plankWall(b, 1.9, 1.0, 0.1, 0x9c6b3e, { z: -0.6 });
    b.box(0.12, 0.95, 1.24, 0x7a5233, { x: -0.91, z: 0.02 }); b.box(0.12, 0.95, 1.24, 0x7a5233, { x: 0.91, z: 0.02 });
    b.box(0.15, 1.05, 0.13, C.beam, { x: -0.915, z: 0.62 }); b.box(0.15, 1.05, 0.13, C.beam, { x: 0.915, z: 0.62 });
    b.noise(0.05, () => b.box(2.15, 0.08, 1.65, 0x6b8f6b, { y: 1.05, rx: 0.14, top: 0x5c7d5c }));
    b.noise(0.2, () => b.ico(0.25, C.hay, { x: 0.4, y: 0.08, z: -0.3, flat: 0.6, jitter: 0.4 }));
    return b;
  }
  /* Rinderweide: dunkler Holzzaun mit drei Latten, Rundraufe, Tränke */
  function beefPasture(w, d) {
    G3.seed(84 + w * 7 + d);
    const b = new MB();
    b.noise(0.1, () => b.plate(w - 0.1, d - 0.1, 0x7fbb48, { y0: 0.01 }));
    for (let i = 0; i < w * d * 0.8; i++) b.ico(0.07, [0xf6d64a, 0xffffff][i % 2], { x: (rnd() - 0.5) * (w - 0.6), y: 0.03, z: (rnd() - 0.5) * (d - 0.6), flat: 0.5 });
    const F = new MB();
    rectFence(F, w - 0.1, d - 0.1, { step: 1.1, h: 0.8, post: 0x4a3322, rail: 0x6e4a2e });
    b.add(F);
    /* Rundraufe mit Heu */
    b.at({ x: w / 2 - 1.2, z: d / 2 - 1.1 }, () => {
      b.cyl(0.45, 0.45, 0.42, 12, 0x2f5d3a, { notop: true });
      b.noise(0.15, () => b.cyl(0.4, 0.38, 0.5, 12, C.hay, { top: C.hayD }));
    });
    b.at({ x: -w / 2 + 2.6, z: d / 2 - 0.45 }, () => {
      b.box(1.1, 0.32, 0.38, C.stoneD);
      b.box(1.0, 0.03, 0.29, C.water, { y: 0.29 });
    });
    return b;
  }
  /* Offener Unterstand für Rinder (2,7 × 1,8) */
  function beefShelter() {
    G3.seed(85);
    const b = new MB();
    b.noise(0.1, () => b.plate(2.7, 1.8, 0xbfa36e, { y0: 0.01 }));
    plankWall(b, 2.7, 1.5, 0.12, 0x5c3d24, { z: -0.84 });
    b.box(0.12, 1.4, 1.8, 0x5c3d24, { x: -1.29 }); b.box(0.12, 1.4, 1.8, 0x5c3d24, { x: 1.29 });
    [-1.25, 0, 1.25].forEach(x => b.box(0.12, 1.55, 0.12, C.beam, { x, z: 0.85 }));
    b.noise(0.05, () => b.box(3.0, 0.1, 2.25, 0x3f6f4a, { y: 1.55, rx: 0.12, top: 0x355f3f }));
    b.noise(0.2, () => b.box(1.3, 0.38, 0.6, C.hay, { x: -0.45, z: -0.45, top: C.hayD }));
    return b;
  }

  /* Landfleischerei: Laden mit Markise, Schaufenster mit Würsten, Räucherkamin */
  function butcher() {
    G3.seed(63);
    const b = new MB();
    b.box(3.0, 0.16, 2.6, C.stoneD);
    b.at({ y: 0.16, x: -0.2 }, () => {
      b.box(2.3, 1.85, 2.1, 0xf6f1e8);
      b.box(2.32, 0.5, 2.12, 0xb8463a, { top: 0xb8463a });
      for (let i = 0; i < 9; i++) b.box(0.2, 0.2, 0.02, i % 2 ? 0xffffff : 0xe9e4da, { x: -1.0 + i * 0.25, y: 0.55, z: 1.06 });
      /* Schaufenster mit Würsten */
      b.box(1.1, 0.75, 0.05, C.white, { x: -0.45, y: 0.62, z: 1.06 });
      b.box(1.0, 0.65, 0.06, 0xcfe6ef, { x: -0.45, y: 0.67, z: 1.07 });
      for (let i = 0; i < 6; i++) b.cyl(0.03, 0.03, 0.26, 6, i % 2 ? 0xa8442e : 0xc9683f, { x: -0.85 + i * 0.16, y: 0.95, z: 1.1, rz: 0.06 * (i % 3 - 1) });
      b.box(0.62, 1.3, 0.06, 0x7a2d26, { x: 0.65, z: 1.06 });
      b.box(0.06, 0.06, 0.06, 0xe9c34a, { x: 0.45, y: 0.65, z: 1.11 });
      /* Markise rot-weiß */
      b.at({ x: -0.1, y: 1.55, z: 1.25 }, () => {
        for (let i = 0; i < 9; i++) b.box(0.24, 0.05, 0.62, i % 2 ? 0xffffff : 0xc93d32, { x: -0.96 + i * 0.24, rx: 0.42 });
        b.box(2.2, 0.12, 0.04, 0xc93d32, { y: -0.16, z: 0.28 });
      });
      /* Schild mit Schwein */
      b.at({ x: -0.45, y: 1.68, z: 1.08 }, () => {
        b.box(0.9, 0.24, 0.04, 0xffffff);
        b.sphere(0.08, 8, 6, 0xf3aaa2, { z: 0.03, sx: 1.4, sz: 0.4 });
      });
      b.at({ y: 1.85 }, () => b.noise(0.04, () => b.roof(2.6, 2.4, 0.95, C.roof, { gable: 0xf6f1e8 })));
    });
    /* Räucherkammer mit Kamin */
    b.at({ x: 1.13, z: -0.35 }, () => {
      b.noise(0.1, () => b.box(0.7, 1.4, 0.9, C.brick, { top: C.brickD }));
      b.box(0.3, 1.2, 0.3, C.brickD, { y: 1.4 });
      b.box(0.38, 0.08, 0.38, C.stoneD, { y: 2.6 });
      b.box(0.36, 0.5, 0.05, 0x3a2a22, { y: 0.2, z: 0.46 });
    });
    /* Kühlaggregat */
    b.box(0.5, 0.45, 0.35, 0xdfe5e9, { x: 1.2, z: 0.85 });
    b.cyl(0.14, 0.14, 0.04, 10, 0x8c98a2, { x: 1.2, y: 0.25, z: 1.03, rx: Math.PI / 2 });
    return b;
  }
  const BUTCHER_CHIMNEY = [1.15, 2.75, -0.35];
  /* Spinnstube: Fachwerkhäuschen mit großem Spinnrad und Körben voll Wolle */
  function spinnery() {
    G3.seed(66);
    const b = new MB();
    b.box(2.9, 0.16, 2.6, C.stoneD);
    b.at({ y: 0.16, x: -0.25 }, () => {
      b.box(2.1, 1.7, 2.0, 0xf3ead6);
      const fz = 1.01;
      [-1.03, -0.35, 0.35, 1.03].forEach(x => b.box(0.12, 1.7, 0.05, C.beam, { x, z: fz }));
      b.box(2.1, 0.12, 0.05, C.beam, { y: 0.85, z: fz }); b.box(2.1, 0.12, 0.05, C.beam, { y: 1.62, z: fz });
      windowAt(b, -0.68, 0.95, fz + 0.03, 0.42, 0.45, { shutter: 0x3f8f4a, flowers: true });
      b.box(0.55, 1.05, 0.06, 0x3f8f4a, { x: 0.65, z: fz + 0.01 });
      b.at({ y: 1.7 }, () => b.noise(0.05, () => b.roof(2.45, 2.35, 1.0, C.slate, { gable: 0xf3ead6 })));
      /* Wollknäuel-Schild */
      b.at({ x: 0, y: 1.3, z: fz + 0.05 }, () => { b.box(0.3, 0.3, 0.03, C.white); b.sphere(0.1, 8, 6, 0xd9415a, { z: 0.04, sz: 0.5 }); });
    });
    /* Spinnrad vor dem Haus */
    b.at({ x: 1.05, z: 0.75 }, () => {
      b.box(0.5, 0.05, 0.14, C.woodD, { y: 0.25 });
      b.box(0.05, 0.3, 0.05, C.woodD, { x: -0.2 }); b.box(0.05, 0.3, 0.05, C.woodD, { x: 0.2 });
      b.box(0.05, 0.5, 0.05, C.woodD, { x: 0.05, y: 0.25 });
      b.at({ x: 0.05, y: 0.72, rz: 0 }, () => {
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; b.box(0.07, 0.04, 0.04, C.wood, { x: Math.cos(a) * 0.28, y: Math.sin(a) * 0.28, rz: a + Math.PI / 2 }); }
        for (let i = 0; i < 6; i++) b.box(0.02, 0.56, 0.02, C.woodL, { rz: i * Math.PI / 6, y: -0.28 + 0.28, c: true });
      });
    });
    /* Körbe mit bunter Wolle */
    [[-1.05, 1.0, 0xd9415a], [-0.6, 1.1, 0x3f78c8], [1.1, -0.4, 0xf2c230]].forEach(([x, z, c]) => b.at({ x, z }, () => {
      b.cyl(0.22, 0.17, 0.2, 10, 0xb08a52, { notop: true });
      b.sphere(0.1, 8, 6, c, { x: -0.06, y: 0.2, smooth: true }); b.sphere(0.09, 8, 6, 0xf8f5ee, { x: 0.08, y: 0.18, smooth: true });
    }));
    return b;
  }

  /* ------------------------------ Fahrzeuge ----------------------------- */
  function cargoBike(color) {
    G3.seed(501);
    const b = new MB();
    const fr = color || 0x2f6fed;
    wheel(b, 0.2, 0.05, { x: -0.025, y: 0.2, z: -0.55 });
    wheel(b, 0.15, 0.05, { x: -0.025, y: 0.15, z: 0.62 });
    b.box(0.05, 0.05, 1.15, fr, { y: 0.28, z: 0.05 });
    b.box(0.05, 0.45, 0.05, fr, { y: 0.28, z: -0.3, rx: -0.25 });
    b.box(0.2, 0.05, 0.28, C.black, { y: 0.72, z: -0.38 });
    b.box(0.05, 0.5, 0.05, fr, { y: 0.28, z: 0.25, rx: 0.15 });
    b.box(0.42, 0.04, 0.04, C.black, { y: 0.8, z: 0.3 });
    /* Kiste vorn */
    b.noise(0.1, () => b.box(0.48, 0.3, 0.5, C.woodL, { y: 0.32, z: 0.42 }));
    b.box(0.4, 0.08, 0.42, 0xe8452f, { y: 0.6, z: 0.42 });
    return b;
  }
  function moped(color) {
    G3.seed(511);
    const b = new MB();
    const body = color || 0x3fa57a;
    wheel(b, 0.2, 0.08, { x: -0.04, y: 0.2, z: -0.45 });
    wheel(b, 0.2, 0.08, { x: -0.04, y: 0.2, z: 0.48 });
    b.box(0.24, 0.26, 0.6, body, { y: 0.3, z: -0.05 });
    b.box(0.22, 0.08, 0.42, C.black, { y: 0.58, z: -0.12 });
    b.box(0.3, 0.12, 0.25, body, { y: 0.48, z: 0.38, rx: 0.3 });
    b.box(0.05, 0.4, 0.05, 0x9aa6af, { y: 0.4, z: 0.5, rx: 0.3 });
    b.box(0.5, 0.04, 0.04, C.black, { y: 0.82, z: 0.6 });
    b.sphere(0.07, 8, 6, 0xfff5c8, { y: 0.72, z: 0.66 });
    /* Kurierbox hinten */
    b.box(0.36, 0.3, 0.34, 0xe8452f, { y: 0.62, z: -0.44 });
    b.box(0.37, 0.05, 0.35, 0xb83420, { y: 0.92, z: -0.44 });
    return b;
  }
  function van(color) {
    G3.seed(521);
    const b = new MB();
    const body = color || 0xf3f4f6;
    [[0.46, 0.6], [-0.46, 0.6], [0.46, -0.65], [-0.46, -0.65]].forEach(([x, z]) => wheel(b, 0.2, 0.1, { x: x > 0 ? x - 0.1 : x, y: 0.2, z }));
    b.box(1.0, 0.75, 2.0, body, { y: 0.22 });
    b.box(0.98, 0.42, 0.7, body, { y: 0.97, z: -0.15 });
    b.box(0.96, 0.32, 0.5, body, { y: 0.97, z: 0.55, rx: -0.15 });
    b.box(0.9, 0.3, 0.05, C.glass, { y: 1.0, z: 0.82, rx: -0.35 });
    b.box(0.03, 0.26, 0.5, C.glass, { x: 0.5, y: 1.05, z: 0.35 }); b.box(0.03, 0.26, 0.5, C.glass, { x: -0.5, y: 1.05, z: 0.35 });
    b.box(1.02, 0.12, 2.02, 0x2f6fed, { y: 0.55 });
    b.box(0.9, 0.12, 0.05, 0x55555c, { y: 0.3, z: 1.0 });
    b.box(0.18, 0.1, 0.03, 0xfff5c8, { x: 0.32, y: 0.55, z: 1.01 }); b.box(0.18, 0.1, 0.03, 0xfff5c8, { x: -0.32, y: 0.55, z: 1.01 });
    return b;
  }

  /* -------------------------------- Deko -------------------------------- */
  function pine(h) {
    G3.seed(600 + Math.round(h * 10));
    const b = new MB();
    b.cyl(0.12, 0.1, 0.5, 6, 0x6e4a2e);
    b.noise(0.14, () => {
      b.cone(0.75, 1.2 * h, 7, 0x2f7a3a, { y: 0.35 });
      b.cone(0.6, 1.0 * h, 7, 0x358542, { y: 0.35 + 0.65 * h });
      b.cone(0.42, 0.85 * h, 7, 0x3d9149, { y: 0.35 + 1.25 * h });
    });
    return b;
  }
  function leafTree(s) {
    G3.seed(620 + Math.round(s * 10));
    const b = new MB();
    b.cyl(0.16, 0.12, 1.2 * s, 6, 0x7a5233);
    b.noise(0.16, () => {
      b.ico(0.85 * s, 0x4f9e35, { y: 1.6 * s, jitter: 0.25, detail: 1 });
      b.ico(0.55 * s, 0x5fae3a, { x: 0.5 * s, y: 1.4 * s, z: 0.3 * s, jitter: 0.3 });
      b.ico(0.5 * s, 0x468f2c, { x: -0.5 * s, y: 1.5 * s, z: -0.25 * s, jitter: 0.3 });
    });
    return b;
  }
  function bushes() { G3.seed(640); const b = new MB(); bush(b, 0.35); return b; }
  function flowers() {
    G3.seed(650);
    const b = new MB();
    b.noise(0.15, () => b.plate(0.9, 0.9, 0x6fae3a, { y0: 0.015 }));
    for (let i = 0; i < 14; i++) {
      const x = (rnd() - 0.5) * 0.75, z = (rnd() - 0.5) * 0.75;
      b.box(0.02, 0.18, 0.02, 0x4c9a2e, { x, z });
      b.ico(0.06, [0xe8425a, 0xf6c445, 0xf08bc2, 0xffffff, 0x8f6bff][i % 5], { x, y: 0.2, z });
    }
    return b;
  }
  function rock(s) {
    G3.seed(660 + Math.round(s * 10));
    const b = new MB();
    b.noise(0.1, () => { b.ico(0.3 * s, 0xa9a39a, { y: 0.12 * s, jitter: 0.5, flat: 0.6 }); b.ico(0.18 * s, 0x9a948b, { x: 0.25 * s, y: 0.08 * s, z: 0.1 * s, jitter: 0.5, flat: 0.6 }); });
    return b;
  }
  function hayBale() {
    const b = new MB();
    b.noise(0.12, () => b.cyl(0.35, 0.35, 0.6, 12, C.hay, { rz: Math.PI / 2, x: 0.3, y: 0.35, top: C.hayD }));
    return b;
  }
  function scarecrow() {
    G3.seed(670);
    const b = new MB();
    b.box(0.07, 1.4, 0.07, C.woodD);
    b.box(0.9, 0.06, 0.06, C.woodD, { y: 1.05 });
    b.box(0.42, 0.45, 0.2, 0x3f78c8, { y: 0.75 });
    b.box(0.85, 0.16, 0.18, 0xd94a3a, { y: 1.0 });
    b.sphere(0.15, 8, 6, 0xf2deb0, { y: 1.35 });
    b.cyl(0.24, 0.24, 0.03, 10, 0xd9b04a, { y: 1.45 });
    b.cone(0.13, 0.25, 8, 0xd9b04a, { y: 1.47 });
    b.box(0.03, 0.03, 0.02, C.black, { x: 0.06, y: 1.38, z: 0.14 }); b.box(0.03, 0.03, 0.02, C.black, { x: -0.06, y: 1.38, z: 0.14 });
    return b;
  }
  function mailbox() {
    const b = new MB();
    b.box(0.06, 0.8, 0.06, C.woodD);
    b.box(0.22, 0.2, 0.34, 0xf2c230, { y: 0.8 });
    b.box(0.03, 0.18, 0.03, 0xe03c31, { x: 0.13, y: 0.9, z: 0.1 });
    return b;
  }
  function well() {
    G3.seed(680);
    const b = new MB();
    b.noise(0.12, () => b.cyl(0.5, 0.5, 0.5, 10, C.stone, { top: C.stoneD }));
    b.cyl(0.42, 0.42, 0.02, 10, C.water, { y: 0.45 });
    b.box(0.08, 1.2, 0.08, C.woodD, { x: 0.45 }); b.box(0.08, 1.2, 0.08, C.woodD, { x: -0.45 });
    b.box(1.0, 0.06, 0.06, C.woodD, { y: 1.0 });
    b.roof(1.2, 0.9, 0.45, C.roof, { y: 1.15, gable: C.wood });
    b.box(0.2, 0.18, 0.2, C.woodL, { y: 0.7 });
    return b;
  }
  function pumpkins() {
    G3.seed(690);
    const b = new MB();
    [[0, 0, 0.2], [0.3, 0.1, 0.14], [-0.2, 0.25, 0.12]].forEach(([x, z, r]) => {
      b.sphere(r, 9, 6, 0xf08a24, { x, y: r * 0.75, z, sy: 0.75, smooth: true });
      b.box(0.03, 0.08, 0.03, 0x6b8f2c, { x, y: r * 1.5, z });
    });
    return b;
  }
  function cart() {
    G3.seed(700);
    const b = new MB();
    wheel(b, 0.28, 0.06, { x: 0.5, y: 0.28, z: 0 }); wheel(b, 0.28, 0.06, { x: -0.56, y: 0.28, z: 0 });
    b.noise(0.1, () => b.box(1.0, 0.1, 0.7, C.woodL, { y: 0.38 }));
    plankWall(b, 1.0, 0.25, 0.05, C.wood, { y: 0.48, z: 0.33 });
    plankWall(b, 1.0, 0.25, 0.05, C.wood, { y: 0.48, z: -0.33 });
    b.box(0.05, 0.25, 0.7, C.wood, { y: 0.48, x: 0.48 });
    b.box(0.05, 0.05, 0.9, C.woodD, { y: 0.4, x: -0.4, z: 0.7, ry: 0.0, rz: 0 });
    [[0, 0, 0xd9332b], [0.2, 0.1, 0xd9332b], [-0.2, -0.1, 0xe8452f], [0.1, -0.15, 0xf28a2e]].forEach(([x, z, c]) => b.sphere(0.1, 7, 5, c, { x, y: 0.55, z }));
    return b;
  }
  function bench() {
    const b = new MB();
    b.box(1.0, 0.06, 0.3, C.wood, { y: 0.32 });
    b.box(1.0, 0.25, 0.05, C.wood, { y: 0.45, z: -0.14 });
    b.box(0.06, 0.32, 0.26, C.woodD, { x: -0.42 }); b.box(0.06, 0.32, 0.26, C.woodD, { x: 0.42 });
    return b;
  }
  function lamp() {
    const b = new MB();
    b.box(0.06, 1.5, 0.06, 0x3a3a40);
    b.box(0.18, 0.2, 0.18, C.glow, { y: 1.5 });
    b.cone(0.16, 0.12, 4, 0x3a3a40, { y: 1.7, a0: Math.PI / 4 });
    return b;
  }
  function beehive() {
    const b = new MB();
    b.box(0.5, 0.15, 0.5, C.woodD);
    b.box(0.46, 0.2, 0.46, 0xf6d64a, { y: 0.15 }); b.box(0.46, 0.2, 0.46, 0xf2c230, { y: 0.35 });
    b.box(0.56, 0.06, 0.56, C.white, { y: 0.55 });
    return b;
  }

  /* ------------------------------- Gelände ------------------------------ */
  /* Rasen mit Farbflecken; Hofgrund heller, Mähstreifen wie bei Hay Day */
  function ground(size, inner) {
    G3.seed(900);
    const b = new MB();
    const n = size, h = size / 2;
    const noise = (x, z) => Math.sin(x * 0.37 + z * 0.21) * 0.5 + Math.sin(x * 0.11 - z * 0.43) * 0.5 + Math.sin((x + z) * 0.9) * 0.15;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = -h + i + 0.5, z = -h + j + 0.5;
        const inside = Math.abs(x) < inner && Math.abs(z) < inner;
        const v = noise(x, z);
        let c;
        if (inside) c = (i + j) % 2 ? 0x8cc650 : 0x86c04b;
        else c = v > 0.35 ? C.grassD : v > -0.2 ? C.grass2 : C.grass;
        b.noise(0.05, () => b.plate(1.0, 1.0, c, { x, z }));
      }
    /* Rand (Kante unter dem Gelände) */
    b.box(size, 0.6, size, 0x6b4a2e, { y: -0.63, top: 0x6b4a2e });
    return b;
  }
  function path(w, d, color) {
    G3.seed(910 + w * 3 + d);
    const b = new MB();
    b.noise(0.06, () => b.plate(w, d, color || C.gravel, { y0: 0.02 }));
    for (let i = 0; i < w * d * 1.5; i++) b.ico(0.05, 0xc2b28a, { x: (rnd() - 0.5) * (w - 0.2), y: 0.02, z: (rnd() - 0.5) * (d - 0.2), flat: 0.4 });
    return b;
  }
  /* ---------------------------- Teich -------------------------------- */
  const pondR = (r, a) => r * (1 + 0.13 * Math.sin(2 * a + 0.6) + 0.07 * Math.sin(3 * a + 2.1) + 0.04 * Math.sin(5 * a + 0.3));
  const lerpC = (a, b, t) => { const A = G3.col(a), B = G3.col(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
  /* Ringe zwischen zwei Abständen vom Ufer, Farbe läuft weich über */
  function ringBand(b, r, d0, d1, c0, c1, y, seg) {
    seg = seg || 64;
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      const P = (a, d) => { const R = pondR(r, a) + d; return [Math.cos(a) * R, y, Math.sin(a) * R]; };
      const p00 = P(a0, d0), p01 = P(a1, d0), p10 = P(a0, d1), p11 = P(a1, d1);
      b.triV(p00, p11, p01, c0, c1, c0);
      b.triV(p00, p10, p11, c0, c1, c1);
    }
  }
  function pondBank(r) {
    const b = new MB();
    ringBand(b, r, 1.0, 0.5, 0x7fb444, 0xc9b98c, 0.012);        /* Wiese → trockener Sand */
    ringBand(b, r, 0.5, 0.15, 0xc9b98c, 0x968566, 0.016);       /* Sand → nasser Sand */
    ringBand(b, r, 0.15, -0.35, 0x968566, 0x75704f, 0.018);     /* Uferschlamm unter dem Wasserrand */
    /* Steine am Ufer */
    G3.seed(941);
    for (let i = 0; i < 9; i++) {
      const a = rnd() * 6.28, R = pondR(r, a) + 0.35 + rnd() * 0.5;
      b.noise(0.1, () => b.ico(0.12 + rnd() * 0.12, rnd() < 0.5 ? 0xa9a39a : 0x8f8a82, { x: Math.cos(a) * R, y: 0.03, z: Math.sin(a) * R, jitter: 0.5, flat: 0.55 }));
    }
    return b;
  }
  /* Wasser: tief in der Mitte, türkis und hell am Rand */
  function pondWater(r) {
    const b = new MB(), seg = 72, rings = [0, 0.35, 0.62, 0.82, 0.93, 1.0], cols = [0x174f7a, 0x1d5f8d, 0x2a7aa6, 0x3f96b4, 0x62adb4, 0x8cbca8];
    const P = (a, f) => { const R = f >= 1 ? pondR(r, a) + 0.06 : pondR(r, a) * f; return [Math.cos(a) * R, 0, Math.sin(a) * R]; };
    for (let k = 0; k < rings.length - 1; k++)
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
        const f0 = rings[k], f1 = rings[k + 1];
        if (f0 === 0) { b.triV([0, 0, 0], P(a1, f1), P(a0, f1), cols[0], cols[1], cols[1]); continue; }
        b.triV(P(a0, f0), P(a1, f0), P(a1, f1), cols[k], cols[k], cols[k + 1]);
        b.triV(P(a0, f0), P(a1, f1), P(a0, f1), cols[k], cols[k + 1], cols[k + 1]);
      }
    return b;
  }
  /* heller Saum, wo das Wasser ans Ufer schwappt */
  function pondFoam(r) {
    const b = new MB();
    ringBand(b, r, 0.0, 0.12, 0xf2f7f4, 0xf2f7f4, 0, 72);
    return b;
  }
  /* Schilf mit Rohrkolben – eigener Knoten, wiegt im Wind */
  function pondReeds(r) {
    G3.seed(951);
    const b = new MB();
    [0.5, 1.25, 2.3, 3.4, 4.3, 5.4].forEach(a0 => {
      for (let i = 0; i < 11; i++) {
        const a = a0 + (rnd() - 0.5) * 0.35, R = pondR(r, a) + (rnd() - 0.55) * 0.55;
        const x = Math.cos(a) * R, z = Math.sin(a) * R, h = 0.45 + rnd() * 0.5;
        b.at({ x, z, rx: (rnd() - 0.5) * 0.25, rz: (rnd() - 0.5) * 0.25 }, () => {
          b.box(0.03, h, 0.03, rnd() < 0.5 ? 0x5c8f34 : 0x6fa23d);
          if (rnd() < 0.45) b.box(0.06, 0.15, 0.06, 0x6b4426, { y: h - 0.05 });
          if (rnd() < 0.5) b.box(0.012, 0.32, 0.07, 0x78ad44, { y: 0.02, rz: 0.35, x: 0.03 });
        });
      }
    });
    return b;
  }
  /* Seerosen, Steg und Ruderboot (liegen auf dem Wasser, ohne Wasser-Shader) */
  function pondProps(r) {
    G3.seed(961);
    const b = new MB();
    [[0.6, 0.55], [0.85, 0.5], [0.72, 0.62], [3.7, 0.55], [3.9, 0.48], [3.55, 0.62], [5.0, 0.6]].forEach(([a, f], i) => {
      const R = pondR(r, a) * f, x = Math.cos(a) * R, z = Math.sin(a) * R, s = 0.17 + rnd() * 0.09, ry = rnd() * 6.28;
      b.at({ x, z, y: 0.055, ry }, () => {
        const seg = 12;
        for (let k = 1; k < seg; k++) {            /* Blatt mit Kerbe */
          const p0 = k / seg * Math.PI * 2, p1 = (k + 1) / seg * Math.PI * 2;
          b.tri([0, 0, 0], [Math.cos(p1) * s, 0, Math.sin(p1) * s], [Math.cos(p0) * s, 0, Math.sin(p0) * s], k % 2 ? 0x4c9a3a : 0x55a542);
        }
        if (i % 3 === 0) { b.ico(0.055, 0xf6a7c8, { y: 0.03, x: s * 0.2, flat: 0.7 }); b.ico(0.025, 0xffe27a, { y: 0.06, x: s * 0.2 }); }
      });
    });
    /* Steg Richtung Hof */
    const a = Math.PI, R0 = pondR(r, a);
    b.at({ x: Math.cos(a) * (R0 - 0.9), z: Math.sin(a) * (R0 - 0.9) + 0.4, ry: 0 }, () => {
      /* Keine zwei Flächen auf gleicher Höhe – sonst flackert es beim Schwenken */
      b.noise(0.12, () => { for (let i = 0; i < 10; i++) b.box(0.26, 0.05, 0.62, i % 2 ? 0xb07d4c : 0xa1703f, { x: -1.2 + i * 0.27, y: 0.2 }); });
      b.box(2.75, 0.06, 0.08, 0x7a5233, { y: 0.13, z: 0.24 }); b.box(2.75, 0.06, 0.08, 0x7a5233, { y: 0.13, z: -0.24 });
      /* Pfosten stehen seitlich neben den Planken und ragen als Poller darüber */
      [-1.2, -0.25, 0.7, 1.28].forEach(x => { b.box(0.1, 0.55, 0.1, 0x6b4a2e, { x, y: -0.2, z: 0.37 }); b.box(0.1, 0.55, 0.1, 0x6b4a2e, { x, y: -0.2, z: -0.37 }); });
      /* Ruderboot am Steg: offener Rumpf, Boden unter der Wasserlinie */
      b.at({ x: 0.1, z: 0.86, y: -0.06, ry: 0.12 }, () => {
        b.noise(0.08, () => b.cyl(0.38, 0.52, 0.3, 14, 0x3f78c8, { sx: 0.44, sz: 1.0, ry: Math.PI / 2, notop: true }));
        /* Innenwand (gespiegelt, damit man von oben hineinsieht) */
        b.cyl(0.35, 0.49, 0.29, 14, 0x9a6a3c, { sx: -0.41, sz: 0.94, ry: Math.PI / 2, notop: true, nobot: true, y: 0.012 });
        b.cyl(0.36, 0.36, 0.02, 14, 0x8a5a34, { sx: 0.4, sz: 0.94, ry: Math.PI / 2, y: 0.1 });
        b.box(0.12, 0.035, 0.4, 0xc48b55, { y: 0.215, x: 0.26 }); b.box(0.12, 0.035, 0.44, 0xc48b55, { y: 0.205, x: -0.24 });
        b.box(0.88, 0.022, 0.035, 0xcf9a62, { y: 0.262, z: 0.06, ry: 0.22 });
      });
    });
    return b;
  }
  function duck(v) {
    G3.seed(980 + (v || 0));
    const b = new MB();
    const body = v ? 0x9a7a5a : 0x8e8a82, head = v ? 0x8a6a4a : 0x1f6b3a;
    b.sphere(0.13, 9, 6, body, { y: 0.06, sy: 0.6, sz: 1.35, smooth: true });
    b.cone(0.07, 0.12, 5, v ? 0x6f5236 : 0xf2f0ea, { z: -0.17, y: 0.1, rx: -1.25 });
    if (!v) b.box(0.02, 0.025, 0.16, 0xf6f6f6, { y: 0.11, x: 0, z: 0.0 });
    b.at({ z: 0.13, y: 0.2 }, () => {
      b.box(0.07, 0.1, 0.07, v ? body : 0xffffff, { y: -0.08 });
      b.sphere(0.07, 8, 6, head, { smooth: true });
      b.box(0.06, 0.025, 0.09, 0xf2a531, { z: 0.08, y: -0.01 });
      b.box(0.018, 0.018, 0.01, 0x15161a, { x: 0.065, y: 0.015, z: 0.03 }); b.box(0.018, 0.018, 0.01, 0x15161a, { x: -0.065, y: 0.015, z: 0.03 });
    });
    return b;
  }
  function lakeShore(r) {
    G3.seed(920);
    const b = new MB();
    b.disc(r + 0.9, 28, C.sand, { y0: 0, wob: 0.06 });
    for (let i = 0; i < 14; i++) {
      const a = rnd() * 6.28, rr = r + 0.4 + rnd() * 0.5;
      b.box(0.03, 0.4 + rnd() * 0.3, 0.03, 0x6b8f2c, { x: Math.cos(a) * rr, z: Math.sin(a) * rr, rz: (rnd() - 0.5) * 0.4 });
      b.box(0.05, 0.12, 0.05, 0x7a5233, { x: Math.cos(a) * rr, y: 0.45, z: Math.sin(a) * rr });
    }
    return b;
  }
  function lakeWater(r) {
    const b = new MB();
    b.disc(r, 36, C.water, { wob: 0.05 });
    return b;
  }
  function road(len) {
    G3.seed(930);
    const b = new MB();
    b.plate(1.8, len, 0x7c7f86, { y0: 0.03 });
    for (let z = -len / 2 + 0.5; z < len / 2; z += 1.2) b.plate(0.08, 0.5, 0xf3efe6, { z, y0: 0.035 });
    b.plate(0.12, len, 0xb9b3a6, { x: 0.96, y0: 0.032 }); b.plate(0.12, len, 0xb9b3a6, { x: -0.96, y0: 0.032 });
    return b;
  }

  /* Bauvorschau-Fläche (Gitter) */
  function tileMarker(w, d) {
    const b = new MB();
    /* helle Fläche plus Rahmen mit Eckpfosten – bleibt um jedes Objekt sichtbar */
    b.plate(w + 0.3, d + 0.3, 0xffffff, { y0: 0.03 });
    const x = w / 2 + 0.12, z = d / 2 + 0.12, t = 0.14;
    b.box(w + 0.38, 0.08, t, 0xffffff, { z: z });
    b.box(w + 0.38, 0.08, t, 0xffffff, { z: -z });
    b.box(t, 0.08, d + 0.38, 0xffffff, { x: x });
    b.box(t, 0.08, d + 0.38, 0xffffff, { x: -x });
    [[x, z], [-x, z], [x, -z], [-x, -z]].forEach(([px, pz]) => b.box(0.18, 0.5, 0.18, 0xffffff, { x: px, z: pz }));
    return b;
  }

  return {
    C, house, barn, silo, bakery, mill, millSails, MILL_HUB, BAKERY_CHIMNEY, dairy, coopHut, coopRun, cowShed, pasture,
    board, shed, gate, fieldSoil, cropMesh, treeMesh, treeFruit, chicken, cow, egg, milkBottle,
    cargoBike, moped, van, pine, leafTree, bushes, flowers, rock, hayBale, scarecrow, mailbox, well, pumpkins, cart, bench,
    lamp, beehive, ground, path, lakeShore, lakeWater, road, tileMarker, fenceLine, rectFence, MB,
    pondR, pondBank, pondWater, pondFoam, pondReeds, pondProps, duck,
    pig, sheep, beef, woolBall, pigRun, pigHut, sheepPasture, sheepShelter, beefPasture, beefShelter,
    butcher, BUTCHER_CHIMNEY, spinnery, windowAt, plankWall, wheel, bush, ringBand
  };
})();
