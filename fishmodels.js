/* =========================================================================
   LOGISTIKA – fishmodels.js
   3D-Modelle für Tante Gesches Fischerei in Warnemünde, gebaut aus den
   Grundkörpern von gl3d.js wie die Hofmodelle (farmmodels.js).
   Maßstab: 1 Einheit = 1 Kachel (~2 m). Ursprung = Mitte der Grundfläche,
   Land auf y = 0, Wasseroberfläche auf WY, Vorderseite zeigt nach +z.
   Die Küste: Wasser nördlich (z < KAI_Z), Kai und Fischerei davor, im
   Westen der Hafen mit Mole, im Osten Leuchtturm, Teepott und Strand.
   ========================================================================= */
const FFM = (() => {
  "use strict";
  const MB = G3.MB, C = FM.C;
  const rnd = () => G3.srand();
  const WY = -0.3;                 /* Wasserspiegel unter der Kaikante */
  const KAI_Z = -4;                /* Kaikante in Weltkoordinaten */
  const K = {
    tar: 0x2e2a28, tarL: 0x3e3734, reet: 0xb7995c, reetD: 0x8d7442, reetL: 0xc9ad70,
    brick: 0xa54532, brickD: 0x8a3727, mortar: 0xd7b6a6, kai: 0xa9a399, kaiTop: 0xc6c0b5, kaiWet: 0x5e5a52,
    hull: 0x1f4f8f, hullRed: 0xb3362c, white: 0xf6f5f0, rope: 0xcdb88c, buoy: 0xf2762e, buoyR: 0xd83a2e,
    sand: 0xe9d6a2, sandD: 0xd6be86, sandW: 0xbfa676, pave: 0xd9d1c2, paveD: 0xc9c0ae, cobble: 0xb7b0a4, cobbleD: 0xa59e92,
    glass: 0x9cc8dc, pipe: 0x1e1e22, net: 0x2d4a3e, green: 0x2f7a4a, yellow: 0xf2c230
  };

  /* ------------------------------- Helfer ------------------------------- */
  /* Walmdach (Reetdach): First entlang x, kürzer als das Haus */
  function hipRoof(b, w, d, h, color, o) {
    o = o || {};
    const x = w / 2, z = d / 2, rx = Math.max(0.2, x - z * (o.hip || 0.7)), t = o.thick || 0.18;
    const side = G3.shade(G3.col(color), 0.86), eave = o.eave || G3.shade(G3.col(color), 0.6);
    b.at(o, () => {
      b.quad([-x, 0, z], [x, 0, z], [rx, h, 0], [-rx, h, 0], color);
      b.quad([x, 0, -z], [-x, 0, -z], [-rx, h, 0], [rx, h, 0], color);
      b.tri([x, 0, z], [x, 0, -z], [rx, h, 0], side);
      b.tri([-x, 0, -z], [-x, 0, z], [-rx, h, 0], side);
      /* dicke Traufkante */
      b.quad([-x, -t, z], [x, -t, z], [x, 0, z], [-x, 0, z], eave);
      b.quad([x, -t, -z], [-x, -t, -z], [-x, 0, -z], [x, 0, -z], eave);
      b.quad([x, -t, z], [x, -t, -z], [x, 0, -z], [x, 0, z], eave);
      b.quad([-x, -t, -z], [-x, -t, z], [-x, 0, z], [-x, 0, -z], eave);
      b.quad([-x, -t, -z], [x, -t, -z], [x, -t, z], [-x, -t, z], eave);
    });
  }
  /* Ring aus kurzen Kästen (Schwimmrohr, Rettungsring, Geländer) */
  function ring(b, R, th, seg, color, o) {
    o = o || {};
    const len = 2 * Math.PI * R / seg * 1.04;
    b.at(o, () => {
      for (let i = 0; i < seg; i++) {
        const a = (i + 0.5) / seg * Math.PI * 2;
        b.box(len, th, th, typeof color === "function" ? color(i) : color, { x: Math.cos(a) * R, z: Math.sin(a) * R, ry: -a + Math.PI / 2, c: true });
      }
    });
  }
  function bollard(b, o) {
    b.at(o || {}, () => {
      b.cyl(0.11, 0.1, 0.22, 8, 0x2b2b30, { top: 0x3a3a40 });
      b.cyl(0.15, 0.15, 0.05, 8, 0x2b2b30, { y: 0.22, top: 0x45454c });
    });
  }
  function crate(b, o, fish) {
    b.at(o || {}, () => {
      b.box(0.42, 0.18, 0.3, o && o.col || 0x2f6fb0, { top: 0x2a5f98 });
      b.box(0.38, 0.02, 0.26, fish ? 0xdfe8ec : 0xf3f6f7, { y: 0.17 });
      if (fish) for (let i = 0; i < 3; i++) b.sphere(0.05, 6, 4, 0x9aa8b0, { x: -0.11 + i * 0.11, y: 0.19, z: (i % 2 - 0.5) * 0.06, sz: 2.4, sy: 0.6, ry: 0.3 * (i - 1) });
    });
  }
  function buoyBall(b, r, color, o) {
    b.at(o || {}, () => {
      b.sphere(r, 10, 7, color, { smooth: true });
      b.cyl(r * 1.01, r * 1.01, r * 0.35, 12, 0xffffff, { y: -r * 0.17, nobot: true, notop: true });
    });
  }
  /* Netz als Gitter aus dünnen Leisten */
  function netPanel(b, w, h, o, color) {
    b.at(o || {}, () => {
      const c = color || K.net;
      for (let i = 0; i <= Math.round(w / 0.12); i++) b.box(0.012, h, 0.012, c, { x: -w / 2 + i * 0.12 });
      for (let j = 0; j <= Math.round(h / 0.12); j++) b.box(w, 0.012, 0.012, c, { y: j * 0.12 });
    });
  }

  /* ----------------------------- Gebäude -------------------------------- */
  /* Fischerhaus: Backstein, weiße Fenster, blaue Klöntür, dickes Reetdach */
  function fhouse() {
    G3.seed(1101);
    const b = new MB();
    b.noise(0.06, () => b.box(4.6, 0.3, 3.5, 0x9c968c, { top: 0x8a857c }));
    b.at({ y: 0.3 }, () => {
      b.noise(0.07, () => b.box(4.3, 1.75, 3.2, K.brick, { top: K.brickD }));
      for (let y = 0.25; y < 1.75; y += 0.25) b.box(4.32, 0.018, 3.22, K.mortar, { y });
      const fz = 1.61;
      FM.windowAt(b, -1.45, 0.55, fz + 0.02, 0.62, 0.66, { frame: 0xffffff, shutter: 0x2f6fb0, flowers: true });
      FM.windowAt(b, 1.45, 0.55, fz + 0.02, 0.62, 0.66, { frame: 0xffffff, shutter: 0x2f6fb0, flowers: true });
      FM.windowAt(b, 2.16, 0.55, -0.6, 0.55, 0.6, { ry: Math.PI / 2, frame: 0xffffff });
      FM.windowAt(b, 2.16, 0.55, 0.7, 0.55, 0.6, { ry: Math.PI / 2, frame: 0xffffff });
      FM.windowAt(b, -2.16, 0.55, 0.0, 0.55, 0.6, { ry: -Math.PI / 2, frame: 0xffffff });
      /* Klöntür: oben und unten getrennt, mit Rautenmuster */
      b.box(0.86, 1.42, 0.05, 0xffffff, { z: fz });
      b.box(0.74, 0.62, 0.07, 0x2f6fb0, { y: 0.04, z: fz + 0.01 });
      b.box(0.74, 0.62, 0.07, 0x2f6fb0, { y: 0.72, z: fz + 0.01 });
      [[-0.18, 0.35, 0.6], [0.18, 0.35, -0.6]].forEach(([x, y, r]) => b.box(0.05, 0.6, 0.08, 0xffffff, { x, y, z: fz + 0.02, rz: r }));
      b.box(0.05, 0.05, 0.05, 0xe9c34a, { x: 0.28, y: 0.7, z: fz + 0.07 });
      /* Rettungsring und Netz an der Wand */
      ring(b, 0.22, 0.07, 14, i => (i >> 1) % 2 ? 0xffffff : 0xe8452f, { x: -0.72, y: 1.25, z: fz + 0.05, rx: Math.PI / 2 });
      netPanel(b, 0.9, 0.9, { x: 2.17, y: 0.25, z: 0.05, ry: Math.PI / 2 });
    });
    b.box(1.1, 0.14, 0.5, 0x9c968c, { z: 1.95 });
    /* Reetdach mit Firstkappe und Schornstein */
    b.at({ y: 2.05 }, () => {
      b.noise(0.07, () => hipRoof(b, 5.0, 4.0, 2.0, K.reet, { hip: 0.65, thick: 0.24, eave: K.reetD }));
      b.box(2.6, 0.16, 0.36, 0x6e5a33, { y: 1.95, c: true });
      b.box(0.42, 1.2, 0.42, K.brick, { x: 1.1, y: 0.9, z: -0.5, top: K.brickD });
      b.box(0.5, 0.1, 0.5, 0x8a857c, { x: 1.1, y: 2.1, z: -0.5 });
      /* Strohbündel an der Traufe – das Reet sieht nicht wie Blech aus */
      for (let i = 0; i < 22; i++) b.box(0.2, 0.05, 0.12, i % 2 ? K.reetD : K.reetL, { x: -2.3 + i * 0.22, y: -0.2, z: 1.98 });
      for (let i = 0; i < 22; i++) b.box(0.2, 0.05, 0.12, i % 2 ? K.reetD : K.reetL, { x: -2.3 + i * 0.22, y: -0.2, z: -1.98 });
    });
    /* Bank und Fischkisten vor dem Haus */
    b.at({ x: 1.45, z: 2.05 }, () => {
      b.box(0.9, 0.06, 0.28, C.wood, { y: 0.3 });
      b.box(0.06, 0.3, 0.24, C.woodD, { x: -0.38 }); b.box(0.06, 0.3, 0.24, C.woodD, { x: 0.38 });
    });
    crate(b, { x: -1.9, z: 2.0, col: 0x2f6fb0 }); crate(b, { x: -1.9, y: 0.18, z: 2.0, col: 0xe8452f, ry: 0.3 });
    return b;
  }

  /* Kühlhaus: weiße Paneele, blaues Rolltor, Kühlaggregat auf dem Dach */
  function kuehl() {
    G3.seed(1111);
    const b = new MB();
    b.box(3.8, 0.2, 2.8, 0x9c968c, { top: 0x8a857c });
    b.at({ y: 0.2 }, () => {
      /* Wände nur bis zum blauen Band – das Band bildet die Dachfläche, damit
         keine zwei Flächen in derselben Höhe liegen (das flackerte) */
      b.box(3.5, 1.75, 2.5, 0xf2f5f7);
      for (let i = 0; i < 15; i++) b.box(0.02, 1.75, 2.52, 0xd9e0e5, { x: -1.73 + i * 0.247 });
      b.box(3.54, 0.3, 2.54, 0x2f6fb0, { y: 1.75, top: 0xe1e6ea });
      /* Attika-Kante rundum */
      b.box(3.54, 0.06, 0.08, 0x2a6098, { y: 2.05, z: 1.23 }); b.box(3.54, 0.06, 0.08, 0x2a6098, { y: 2.05, z: -1.23 });
      b.box(0.08, 0.06, 2.38, 0x2a6098, { y: 2.05, x: 1.73 }); b.box(0.08, 0.06, 2.38, 0x2a6098, { y: 2.05, x: -1.73 });
      /* Rolltor */
      b.box(1.5, 1.45, 0.05, 0x8c98a2, { x: -0.6, z: 1.26 });
      for (let i = 0; i < 12; i++) b.box(1.4, 0.06, 0.07, i % 2 ? 0x3f78c8 : 0x356cb8, { x: -0.6, y: 0.05 + i * 0.115, z: 1.27 });
      /* Tür und Schild mit Eiskristall */
      b.box(0.6, 1.25, 0.06, 0xe1e6ea, { x: 1.0, z: 1.26 });
      b.box(0.04, 0.2, 0.04, 0x8c98a2, { x: 0.78, y: 0.6, z: 1.3 });
      b.at({ x: 1.0, y: 1.45, z: 1.29 }, () => {
        b.box(0.42, 0.42, 0.03, 0x3f9fd6);
        for (let k = 0; k < 3; k++) b.box(0.06, 0.32, 0.02, 0xffffff, { z: 0.02, rz: k * Math.PI / 3, y: 0, c: true });
      });
      /* Laderampe mit gelber Kante */
      b.box(1.8, 0.35, 0.5, 0x8a857c, { x: -0.6, y: -0.2, z: 1.5 });
      b.box(1.8, 0.04, 0.06, K.yellow, { x: -0.6, y: 0.12, z: 1.75 });
    });
    /* Kühlaggregat */
    b.at({ y: 2.25, x: 0.6, z: -0.3 }, () => {
      b.box(1.3, 0.45, 0.8, 0xc9d1d7, { top: 0xbac3ca });
      [-0.3, 0.3].forEach(x => { b.cyl(0.24, 0.24, 0.03, 14, 0x55606a, { x, y: 0.45 }); b.box(0.42, 0.02, 0.04, 0x8c98a2, { x, y: 0.49, ry: 0.7 }); });
    });
    return b;
  }

  /* Netzspeicher: geteerter Holzschuppen, rote Fenster, Netze, Bojen, Riemen */
  function speicher() {
    G3.seed(1121);
    const b = new MB();
    b.box(3.8, 0.14, 2.8, 0x8a857c);
    b.at({ y: 0.14 }, () => {
      FM.plankWall(b, 3.4, 1.7, 2.4, K.tar);
      [[-1.7, -1.2], [1.7, -1.2], [-1.7, 1.2], [1.7, 1.2]].forEach(([x, z]) => b.box(0.12, 1.7, 0.12, K.tarL, { x, z }));
      FM.windowAt(b, -1.0, 0.7, 1.22, 0.5, 0.5, { frame: 0xc0392b, lit: false });
      FM.windowAt(b, 1.72, 0.7, 0.0, 0.5, 0.5, { frame: 0xc0392b, lit: false, ry: Math.PI / 2 });
      /* Doppeltür */
      b.box(1.1, 1.35, 0.05, 0xf3efe6, { x: 0.6, z: 1.21 });
      b.box(0.5, 1.25, 0.07, 0x8a2e24, { x: 0.33, z: 1.22 }); b.box(0.5, 1.25, 0.07, 0x8a2e24, { x: 0.87, z: 1.22 });
      b.at({ y: 1.7 }, () => b.noise(0.04, () => b.roof(3.8, 2.8, 1.25, 0x4a4a50, { gable: K.tar, thick: 0.08 })));
      /* Netze zum Trocknen an der Seite */
      netPanel(b, 1.6, 1.1, { x: -1.73, y: 0.35, z: 0.2, ry: -Math.PI / 2 });
    });
    /* Bojenstapel und Riemen */
    [[1.55, 1.55, K.buoy], [1.25, 1.65, K.buoyR], [1.4, 1.5, K.buoy]].forEach(([x, z, c], i) => buoyBall(b, 0.17, c, { x, y: 0.17 + (i === 2 ? 0.28 : 0), z }));
    b.box(0.06, 1.6, 0.06, C.woodL, { x: -1.4, z: 1.45, rz: 0.25 });
    b.box(0.16, 0.4, 0.04, C.woodL, { x: -1.6, y: 1.35, z: 1.45, rz: 0.25 });
    return b;
  }

  /* Fischhalle: Backsteinhalle mit großen Fenstern, Arbeitstisch, Kisten */
  function fishhalle() {
    G3.seed(1131);
    const b = new MB();
    b.box(3.8, 0.16, 2.8, 0x9c968c, { top: 0x8a857c });
    b.at({ y: 0.16, z: -0.2 }, () => {
      b.noise(0.07, () => b.box(3.6, 1.9, 2.2, K.brick, { top: K.brickD }));
      for (let y = 0.3; y < 1.9; y += 0.3) b.box(3.62, 0.018, 2.22, K.mortar, { y });
      [-1.2, -0.4, 0.4, 1.2].forEach(x => {
        b.box(0.6, 0.95, 0.05, 0xffffff, { x, y: 0.75, z: 1.11 });
        b.box(0.5, 0.85, 0.06, x === -0.4 ? 0x3a2a22 : 0x7fb3cc, { x, y: 0.8, z: 1.12 });
        b.box(0.04, 0.85, 0.07, 0xffffff, { x, y: 0.8, z: 1.12 });
      });
      b.box(0.62, 1.4, 0.1, 0x2f6fb0, { x: -0.4, z: 1.12 });
      /* flaches Satteldach aus Blech */
      b.at({ y: 1.9 }, () => {
        b.noise(0.03, () => b.roof(3.9, 2.5, 0.7, 0x6f8796, { gable: K.brick }));
        for (let i = 0; i < 13; i++) b.box(0.03, 0.03, 2.5, 0x5f7684, { x: -1.8 + i * 0.3, y: 0.36, rx: 0 });
      });
      /* Fischschild */
      b.at({ x: 0.8, y: 1.62, z: 1.13 }, () => {
        b.box(0.9, 0.3, 0.03, 0xffffff);
        b.sphere(0.1, 8, 5, 0x2f6fb0, { z: 0.03, sx: 2.6, sz: 0.3 });
        b.tri([0.32, 0, 0.04], [0.42, 0.1, 0.04], [0.42, -0.1, 0.04], 0x2f6fb0);
      });
    });
    /* Arbeitstisch aus Edelstahl und Kisten mit Fisch auf Eis */
    b.at({ x: 0.9, z: 1.15 }, () => {
      b.box(1.1, 0.06, 0.45, 0xd9e1e6, { y: 0.55 });
      [[-0.5, -0.18], [0.5, -0.18], [-0.5, 0.18], [0.5, 0.18]].forEach(([x, z]) => b.box(0.04, 0.55, 0.04, 0xb9c3ca, { x, z }));
      b.sphere(0.06, 7, 5, 0x9aa8b0, { y: 0.63, sz: 3, sy: 0.6, ry: 0.2 });
    });
    crate(b, { x: -1.3, z: 1.2 }, true); crate(b, { x: -0.85, z: 1.2 }, true); crate(b, { x: -1.05, y: 0.18, z: 1.2, ry: 0.15 }, true);
    return b;
  }

  /* Räucherei: kleines Backsteinhaus mit hohem Schornstein und Buchenholz */
  function smoke() {
    G3.seed(1141);
    const b = new MB();
    b.box(2.9, 0.14, 2.6, 0x9c968c);
    b.at({ y: 0.14, x: -0.35 }, () => {
      b.noise(0.08, () => b.box(1.9, 1.5, 1.8, K.brick, { top: K.brickD }));
      for (let y = 0.25; y < 1.5; y += 0.25) b.box(1.92, 0.018, 1.82, K.mortar, { y });
      b.box(0.6, 1.1, 0.06, 0x3a2a22, { x: 0.35, z: 0.91 });
      b.box(0.7, 0.08, 0.1, 0x6e4a2e, { x: 0.35, y: 1.12, z: 0.91 });
      FM.windowAt(b, -0.45, 0.7, 0.92, 0.4, 0.4, { frame: 0xffffff });
      b.at({ y: 1.5 }, () => b.noise(0.05, () => b.roof(2.2, 2.1, 0.75, 0x7a3a2e, { gable: K.brick })));
      /* Schild mit goldenem Räucherfisch */
      b.at({ x: -0.45, y: 1.3, z: 0.95 }, () => {
        b.box(0.6, 0.22, 0.03, 0x3a2a22);
        b.sphere(0.07, 8, 5, 0xd8a03a, { z: 0.03, sx: 2.6, sz: 0.3 });
      });
    });
    /* Schornstein mit Ruß */
    b.at({ x: 0.85, z: -0.5 }, () => {
      b.noise(0.08, () => b.box(0.5, 3.4, 0.5, K.brick, { top: 0x3a3030 }));
      b.box(0.56, 0.12, 0.56, 0x8a857c, { y: 3.4 });
      b.box(0.52, 0.5, 0.52, 0x4a3a34, { y: 2.9 });
      b.box(0.44, 0.65, 0.06, 0x2a2220, { y: 0.3, z: 0.26 });
    });
    /* Buchenholz */
    b.at({ x: 1.0, z: 0.95 }, () => {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4 - i; j++)
        b.cyl(0.09, 0.09, 0.6, 7, 0xb98a5a, { rx: Math.PI / 2, x: -0.28 + j * 0.18 + i * 0.09, y: 0.09 + i * 0.16, z: -0.3, top: 0xe6d0a8 });
    });
    return b;
  }
  const SMOKE_CHIMNEY = [0.85, 3.6, -0.5];

  /* Futterküche: hellblaue Holzhütte mit Fässern und Eimern */
  function feedk() {
    G3.seed(1151);
    const b = new MB();
    b.box(1.9, 0.12, 1.9, 0x9c968c);
    b.at({ y: 0.12, z: -0.2 }, () => {
      FM.plankWall(b, 1.5, 1.2, 1.2, 0x8fc0d8);
      [[-0.75, -0.6], [0.75, -0.6], [-0.75, 0.6], [0.75, 0.6]].forEach(([x, z]) => b.box(0.08, 1.2, 0.08, 0xffffff, { x, z }));
      b.box(0.5, 0.95, 0.06, 0xffffff, { x: 0.3, z: 0.62 });
      b.box(0.42, 0.88, 0.07, 0x2f6fb0, { x: 0.3, z: 0.63 });
      FM.windowAt(b, -0.35, 0.6, 0.63, 0.32, 0.3, { frame: 0xffffff });
      b.box(1.8, 0.07, 1.6, 0x4a5a66, { y: 1.22, rx: -0.12 });
    });
    /* Fässer und Eimer */
    [[-0.6, 0.7], [-0.25, 0.75]].forEach(([x, z]) => {
      b.cyl(0.18, 0.18, 0.5, 10, 0x2f6fb0, { x, z, top: 0x2a5f98 });
      b.cyl(0.185, 0.185, 0.04, 10, 0x1d4a80, { x, y: 0.12, z }); b.cyl(0.185, 0.185, 0.04, 10, 0x1d4a80, { x, y: 0.38, z });
    });
    b.cyl(0.12, 0.1, 0.2, 10, 0xf6f5f0, { x: 0.65, z: 0.75, notop: true });
    b.cyl(0.1, 0.1, 0.01, 10, 0x8a5a3a, { x: 0.65, y: 0.17, z: 0.75 });
    return b;
  }

  /* Fischbude: Kiosk mit blau-weißer Markise, Stehtische mit Schirm */
  function deli() {
    G3.seed(1161);
    const b = new MB();
    b.noise(0.05, () => b.plate(2.9, 2.9, K.pave, { y0: 0.012 }));
    b.at({ x: -0.3, z: -0.45 }, () => {
      FM.plankWall(b, 2.0, 1.5, 1.5, 0xf6f5f0);
      for (let i = 0; i < 8; i++) b.box(0.1, 1.5, 0.02, i % 2 ? 0x3f78c8 : 0xf6f5f0, { x: -0.875 + i * 0.25, z: 0.76 });
      /* Theke mit Verkaufsluke */
      b.box(1.5, 0.6, 0.1, 0x2b2f38, { y: 0.75, z: 0.77 });
      b.box(1.6, 0.06, 0.3, 0xd9e1e6, { y: 0.72, z: 0.85 });
      for (let i = 0; i < 4; i++) b.sphere(0.05, 6, 4, i % 2 ? 0xd8a03a : 0xe6c48f, { x: -0.5 + i * 0.3, y: 0.8, z: 0.84, sz: 2 });
      /* Markise */
      b.at({ y: 1.42, z: 0.92 }, () => { for (let i = 0; i < 8; i++) b.box(0.25, 0.04, 0.55, i % 2 ? 0xffffff : 0x2f6fb0, { x: -0.875 + i * 0.25, rx: 0.38 }); });
      b.box(2.1, 0.1, 1.6, 0x2f6fb0, { y: 1.5 });
      /* Schild mit Fisch auf dem Dach */
      b.at({ y: 1.6, z: 0.3 }, () => {
        b.box(1.4, 0.45, 0.06, 0xffffff);
        b.sphere(0.12, 8, 5, 0x2f6fb0, { y: 0.22, z: 0.04, sx: 3.2, sz: 0.3 });
        b.tri([0.42, 0.22, 0.05], [0.56, 0.36, 0.05], [0.56, 0.08, 0.05], 0x2f6fb0);
        b.box(0.04, 0.04, 0.04, 0xffffff, { x: -0.25, y: 0.25, z: 0.08 });
      });
    });
    /* Stehtische mit Schirmen */
    [[0.95, 0.9, 0x2f6fb0], [-0.65, 1.0, 0xe8452f]].forEach(([x, z, c]) => b.at({ x, z }, () => {
      b.cyl(0.05, 0.05, 0.75, 6, 0x55606a);
      b.cyl(0.24, 0.24, 0.04, 12, 0xf6f5f0, { y: 0.75 });
      b.cyl(0.02, 0.02, 1.5, 5, 0xffffff, { y: 0.75 });
      b.cone(0.62, 0.25, 8, c, { y: 1.7, a0: 0.2 });
      b.cyl(0.62, 0.62, 0.02, 8, 0xffffff, { y: 1.69, a0: 0.2, nobot: true, notop: true });
    }));
    return b;
  }

  /* Schmiede: Feldsteine, offene Esse mit Glut, Amboss auf dem Klotz */
  function smith() {
    G3.seed(1171);
    const b = new MB();
    b.box(2.9, 0.12, 2.6, 0x8a857c);
    b.at({ y: 0.12, x: -0.25 }, () => {
      b.noise(0.12, () => {
        b.box(2.1, 1.8, 1.9, 0x9a948b, { top: 0x8a847b });
        for (let i = 0; i < 24; i++) b.ico(0.14 + rnd() * 0.06, rnd() < 0.5 ? 0xb3ada3 : 0x86807a, { x: (rnd() - 0.5) * 2, y: 0.15 + rnd() * 1.5, z: 0.95, flat: 0.5, jitter: 0.4 });
      });
      /* Torbogen mit Esse */
      b.box(1.0, 1.25, 0.12, 0x2a2220, { x: 0.25, z: 0.96 });
      b.box(0.55, 0.3, 0.16, C.glow, { x: 0.25, y: 0.35, z: 0.955 });
      b.box(0.62, 0.08, 0.16, 0x55504a, { x: 0.25, y: 0.65, z: 0.96 });
      b.box(1.15, 0.12, 0.15, 0x6e4a2e, { x: 0.25, y: 1.25, z: 0.97 });
      b.at({ y: 1.8 }, () => b.noise(0.04, () => b.roof(2.45, 2.3, 0.9, 0x5a5560, { gable: 0x9a948b })));
      /* Hufeisen-Schild */
      b.at({ x: -0.6, y: 1.45, z: 1.0 }, () => {
        b.box(0.36, 0.36, 0.03, 0x3a2a22);
        for (let k = 0; k < 7; k++) { const a = Math.PI * (0.1 + k / 7.5); b.box(0.06, 0.05, 0.03, 0xc9a24a, { x: Math.cos(a) * 0.1, y: Math.sin(a) * 0.1 - 0.03, z: 0.02, rz: a }); }
      });
    });
    /* Kamin */
    b.at({ x: -1.0, z: -0.55 }, () => { b.noise(0.1, () => b.box(0.45, 3.1, 0.45, 0x8a847b, { top: 0x2a2626 })); b.box(0.52, 0.1, 0.52, 0x6a655e, { y: 3.1 }); });
    /* Amboss auf dem Holzklotz */
    b.at({ x: 1.05, z: 0.9 }, () => {
      b.cyl(0.22, 0.24, 0.42, 10, 0x8a5a34, { top: 0xc9a06a });
      b.box(0.18, 0.12, 0.12, 0x3a3a40, { y: 0.42 });
      b.box(0.42, 0.1, 0.16, 0x45454c, { y: 0.54 });
      b.cone(0.07, 0.18, 6, 0x45454c, { x: 0.28, y: 0.59, rz: -Math.PI / 2 });
    });
    return b;
  }
  const SMITH_CHIMNEY = [-1.25, 3.3, -0.55];

  /* --------------------------- Am und im Wasser --------------------------- */
  /* Kutterliegeplatz: Holzsteg vom Kai aufs Wasser (4 × 7 Kacheln),
     Steg rechts, Liegeplatz für den Kutter links */
  function kutterPier() {
    G3.seed(1201);
    const b = new MB();
    const x0 = 1.45;
    b.noise(0.12, () => { for (let i = 0; i < 26; i++) b.box(1.0, 0.07, 0.25, i % 2 ? 0xa97b4c : 0x9c6f42, { x: x0, y: 0.005, z: -3.4 + i * 0.27 }); });
    b.box(0.08, 0.08, 7.0, 0x6e4a2e, { x: x0 - 0.5, y: -0.1 }); b.box(0.08, 0.08, 7.0, 0x6e4a2e, { x: x0 + 0.5, y: -0.1 });
    for (let z = -3.3; z < 3.4; z += 1.1) {
      b.box(0.14, 1.2, 0.14, 0x5a3e28, { x: x0 - 0.58, y: WY - 0.9, z });
      b.box(0.14, 1.2, 0.14, 0x5a3e28, { x: x0 + 0.58, y: WY - 0.9, z });
      /* Autoreifen als Fender */
      b.cyl(0.14, 0.14, 0.08, 10, 0x1d1d20, { x: x0 - 0.66, y: -0.22, z, rz: Math.PI / 2, top: 0x2a2a2e });
    }
    [-2.9, -0.6, 1.8].forEach(z => bollard(b, { x: x0 - 0.3, z, y: 0.05 }));
    /* Leiter und Laterne am Kopf */
    for (let i = 0; i < 4; i++) b.box(0.3, 0.03, 0.03, 0x8c98a2, { x: x0 + 0.62, y: -0.1 - i * 0.12, z: -3.0 });
    b.at({ x: x0 + 0.38, z: -3.25 }, () => {
      b.cyl(0.04, 0.04, 1.6, 6, 0x2b2b30);
      b.box(0.16, 0.2, 0.16, C.glow, { y: 1.55 });
      b.cone(0.13, 0.12, 4, 0x2b2b30, { y: 1.75, a0: Math.PI / 4 });
    });
    /* Wellen-Schatten im Wasser am Liegeplatz (dunkler Fleck unterm Boot) */
    return b;
  }
  /* Fischkutter: blauer Rumpf mit weißem Streifen, rotes Unterwasserschiff,
     Ruderhaus, Mast mit Ausleger, Netztrommel, Galgen am Heck.
     Bug zeigt nach +z, Wasserlinie auf y = 0 (Knoten auf WY setzen). */
  function kutterBoat(hullC, stripeC, houseRoof) {
    G3.seed(1211);
    const b = new MB();
    const hc = hullC || K.hull, sc = stripeC || K.white, rc = houseRoof || 0xd83a2e;
    /* Spanten von achtern nach vorn: z, halbe Breite, Deckshöhe, Kiel */
    const S = [[-2.45, 0.6, 0.55, -0.32], [-1.9, 0.74, 0.52, -0.42], [-0.8, 0.8, 0.5, -0.46], [0.5, 0.78, 0.52, -0.46], [1.5, 0.64, 0.6, -0.4], [2.2, 0.36, 0.72, -0.26], [2.65, 0.03, 0.84, 0.15]];
    const P = (i, k, s) => {
      const [z, w, h, kl] = S[i];
      if (k === 0) return [s * w, h, z];
      if (k === 1) return [s * w * 0.995, h - 0.11, z];
      if (k === 2) return [s * w * 0.94, -0.02, z];
      return [0, kl, z];
    };
    const cols = [sc, hc, K.hullRed];
    for (let i = 0; i < S.length - 1; i++) {
      for (let k = 0; k < 3; k++) {
        b.quad(P(i, k, 1), P(i + 1, k, 1), P(i + 1, k + 1, 1), P(i, k + 1, 1), cols[k]);
        b.quad(P(i + 1, k, -1), P(i, k, -1), P(i, k + 1, -1), P(i + 1, k + 1, -1), cols[k]);
      }
      /* Schanzkleid von innen und Deck */
      const dh = (j) => S[j][2] - 0.1;
      b.quad(P(i + 1, 0, 1), P(i, 0, 1), [S[i][1] * 0.96, dh(i), S[i][0]], [S[i + 1][1] * 0.96, dh(i + 1), S[i + 1][0]], 0xe9e6dc);
      b.quad(P(i, 0, -1), P(i + 1, 0, -1), [-S[i + 1][1] * 0.96, dh(i + 1), S[i + 1][0]], [-S[i][1] * 0.96, dh(i), S[i][0]], 0xe9e6dc);
      b.quad([-S[i][1] * 0.96, dh(i), S[i][0]], [-S[i + 1][1] * 0.96, dh(i + 1), S[i + 1][0]], [S[i + 1][1] * 0.96, dh(i + 1), S[i + 1][0]], [S[i][1] * 0.96, dh(i), S[i][0]], i % 2 ? 0xb98a5a : 0xb0814f);
    }
    /* Spiegelheck */
    for (let k = 0; k < 3; k++) b.quad(P(0, k, -1), P(0, k, 1), P(0, k + 1, 1), P(0, k + 1, -1), k === 2 ? K.hullRed : hc);
    b.box(0.5, 0.12, 0.02, sc, { y: 0.32, z: -2.46 });
    /* Ruderhaus */
    b.at({ z: -0.85, y: 0.42 }, () => {
      b.box(1.05, 0.9, 1.0, 0xf6f5f0);
      b.box(1.07, 0.3, 1.02, 0x22344a, { y: 0.52 });
      [-0.3, 0, 0.3].forEach(x => b.box(0.04, 0.3, 1.03, 0xf6f5f0, { x, y: 0.52 }));
      b.box(1.2, 0.08, 1.15, rc, { y: 0.9 });
      b.box(0.3, 0.12, 0.3, 0xf6f5f0, { y: 0.98, z: -0.2 });
      b.cyl(0.03, 0.03, 0.5, 5, 0x2b2b30, { x: 0.35, y: 0.98 });
      b.box(0.5, 0.05, 0.08, 0x2b2b30, { x: 0.35, y: 1.42 });
      b.box(0.08, 0.12, 0.08, 0xf2f2f2, { x: -0.35, y: 0.98 });
      ring(b, 0.16, 0.05, 12, i => (i >> 1) % 2 ? 0xffffff : 0xe8452f, { x: 0.53, y: 0.3, rz: Math.PI / 2 });
    });
    /* Auspuff */
    b.cyl(0.06, 0.06, 0.55, 6, 0x2b2b30, { x: -0.35, y: 1.1, z: -1.45, top: 0x111111 });
    /* Mast mit Ausleger und Positionslicht */
    b.at({ z: 1.2, y: 0.5 }, () => {
      b.cyl(0.06, 0.05, 2.3, 6, 0xf6f5f0);
      b.box(0.9, 0.05, 0.05, 0xf6f5f0, { y: 1.75 });
      b.box(0.05, 0.05, 1.9, 0xd9b04a, { y: 0.9, z: -0.85, rx: -0.35 });
      b.box(0.08, 0.08, 0.08, C.glow, { y: 2.3 });
      b.box(0.24, 0.16, 0.01, 0x2f6fb0, { x: 0.13, y: 2.08 });
    });
    /* Netztrommel und Galgen am Heck */
    b.at({ z: -1.85, y: 0.5 }, () => {
      b.cyl(0.28, 0.28, 0.9, 12, 0x2f7a4a, { rz: Math.PI / 2, x: 0.45, y: 0.22, top: 0x45454c });
      [-0.55, 0.55].forEach(x => b.box(0.08, 1.35, 0.08, 0xf2762e, { x, z: -0.35, rx: -0.25 }));
      b.box(1.2, 0.09, 0.09, 0xf2762e, { y: 1.3, z: -0.68 });
    });
    /* Fender, Kisten, Fähnchenbojen */
    [-1.2, 0.3, 1.4].forEach(z => [1, -1].forEach(s => b.sphere(0.09, 7, 5, K.buoy, { x: s * 0.83, y: 0.25, z, sy: 1.5, smooth: true })));
    crate(b, { x: 0.35, y: 0.42, z: 0.4 }, true); crate(b, { x: -0.25, y: 0.42, z: 0.55, col: 0xe8452f, ry: 0.2 });
    b.at({ x: -0.45, y: 0.42, z: 1.85 }, () => { b.cyl(0.02, 0.02, 0.9, 4, 0x2b2b30); b.box(0.2, 0.14, 0.01, 0x111111, { x: 0.1, y: 0.75 }); b.sphere(0.07, 6, 5, K.buoy, { y: 0.05 }); });
    /* Namensschild am Bug */
    [1, -1].forEach(s => b.box(0.01, 0.12, 0.45, 0xf6f5f0, { x: s * 0.58, y: 0.42, z: 1.75, ry: s * -0.4 }));
    return b;
  }

  /* Angelsteg (1 × 5): schmaler Holzsteg mit Geländer, vorn eine Bank */
  function steg() {
    G3.seed(1221);
    const b = new MB();
    b.noise(0.12, () => { for (let i = 0; i < 18; i++) b.box(0.8, 0.06, 0.26, i % 2 ? 0xae7f4e : 0xa07244, { y: 0.02, z: -2.35 + i * 0.27 }); });
    b.box(0.06, 0.07, 4.9, 0x6e4a2e, { x: -0.36, y: -0.08 }); b.box(0.06, 0.07, 4.9, 0x6e4a2e, { x: 0.36, y: -0.08 });
    for (let z = -2.3; z < 2.4; z += 1.15) { b.box(0.1, 1.0, 0.1, 0x5a3e28, { x: -0.42, y: WY - 0.7, z }); b.box(0.1, 1.0, 0.1, 0x5a3e28, { x: 0.42, y: WY - 0.7, z }); }
    /* Geländer an einer Seite */
    for (let z = -2.0; z < 2.4; z += 1.0) b.box(0.05, 0.55, 0.05, 0x8a5a34, { x: 0.36, y: 0.08, z });
    b.box(0.05, 0.05, 4.2, 0xa97b4c, { x: 0.36, y: 0.6, z: 0.2 });
    /* Eimer und Kescher */
    b.cyl(0.1, 0.08, 0.18, 10, 0xd83a2e, { x: 0.18, y: 0.08, z: -1.85, notop: true });
    b.cyl(0.09, 0.09, 0.01, 10, 0x3f8fa5, { x: 0.18, y: 0.22, z: -1.85 });
    b.box(0.03, 0.03, 0.9, 0x8a5a34, { x: -0.25, y: 0.12, z: -1.2, rx: 0.05 });
    ring(b, 0.12, 0.025, 10, 0x2b2b30, { x: -0.25, y: 0.12, z: -1.72 });
    return b;
  }
  /* Angler im Friesennerz, sitzt am Stegende (schaut nach +z) */
  function angler() {
    G3.seed(1231);
    const b = new MB();
    /* Beine baumeln über die Kante */
    [0.09, -0.09].forEach(x => { b.box(0.1, 0.1, 0.32, 0x2f4f8f, { x, y: 0.22, z: 0.14 }); b.box(0.1, 0.32, 0.1, 0x2f4f8f, { x, y: -0.08, z: 0.28 }); b.box(0.11, 0.07, 0.15, 0x2b2b30, { x, y: -0.12, z: 0.32 }); });
    b.at({ y: 0.22 }, () => {
      b.cyl(0.15, 0.12, 0.46, 10, K.yellow, { smooth: true });
      b.cyl(0.155, 0.155, 0.03, 10, 0xd8a91f, { y: 0.2 });
      /* Arme nach vorn zur Rute */
      [0.14, -0.14].forEach(x => b.box(0.08, 0.08, 0.28, K.yellow, { x, y: 0.32, z: 0.12, rx: 0.4 }));
      b.box(0.08, 0.08, 0.08, 0xf0c8a0, { y: 0.24, z: 0.28 });
      /* Kopf mit Südwester */
      b.at({ y: 0.6 }, () => {
        b.sphere(0.1, 9, 7, 0xf0c8a0, { smooth: true });
        b.box(0.03, 0.03, 0.02, 0x2b2b30, { x: 0.04, y: 0.02, z: 0.09 }); b.box(0.03, 0.03, 0.02, 0x2b2b30, { x: -0.04, y: 0.02, z: 0.09 });
        b.cyl(0.11, 0.09, 0.1, 10, K.yellow, { y: 0.05 });
        b.cyl(0.19, 0.17, 0.03, 12, K.yellow, { y: 0.03, z: -0.03, rx: 0.15 });
      });
    });
    return b;
  }
  /* Angelrute: Drehpunkt an den Händen, zeigt nach vorn oben (+z) */
  function rod() {
    const b = new MB();
    b.box(0.03, 0.03, 0.3, 0x2b2b30, { z: -0.05 });
    b.cyl(0.04, 0.04, 0.05, 8, 0x9aa6af, { rz: Math.PI / 2, x: 0.03, y: -0.03, z: 0.02 });
    b.box(0.02, 0.02, 1.7, 0x3a3a40, { z: 0.95 });
    b.box(0.014, 0.014, 0.1, 0xe8452f, { z: 1.82 });
    return b;
  }
  const ROD_TIP = 1.86;
  /* v69.4: Bildchen für die Rute im Angel-Fenster – 1 Lehmanns alte Angel (Holz), 2 Spinnrute (blau),
     3 Raubfischrute (schwarz-gold); schräg liegend mit Rolle, Griff und Schnur */
  function rodIcon(n) {
    G3.seed(4880 + n);
    const b = new MB();
    const C = [null, { blank: 0x8a5a32, grip: 0x5a3a22, reel: 0x9aa6af, ring: 0xd8b060 },
      { blank: 0x2f5f98, grip: 0x2a2a2e, reel: 0xc8ccd0, ring: 0xe8e8ea }, { blank: 0x1d1d20, grip: 0x3a2a1a, reel: 0xd8b048, ring: 0xd8b048 }][n] || null;
    if (!C) return b;
    /* fürs Bildchen kräftiger als die echte Rute – sonst wird sie zum Strich */
    b.at({ ry: -0.785, rx: -0.6 }, m => {   /* quer zur Bildkamera (Blick von 45°), Spitze nach oben */
      m.box(0.16, 0.16, 0.45, C.grip, { z: -0.05 });
      m.cyl(0.2, 0.2, 0.16, 12, C.reel, { rz: Math.PI / 2, x: 0.18, y: -0.16, z: 0.12 });
      m.cyl(0.07, 0.07, 0.2, 8, C.ring, { rz: Math.PI / 2, x: 0.3, y: -0.16, z: 0.12 });
      m.box(0.09, 0.09, 1.25, C.blank, { z: 0.82 });
      for (let i = 0; i < 3; i++) m.box(0.14, 0.14, 0.04, C.ring, { y: 0.02, z: 0.45 + i * 0.35 });
      m.box(0.06, 0.06, 0.1, 0xe8452f, { z: 1.48 });
    });
    return b;
  }
  /* v69.4: Bildchen je Fanggrund – ein Stück Wasser mit dem, was dort zu sehen ist */
  function groundIcon(id) {
    G3.seed(4900 + id.length * 7 + id.charCodeAt(0));
    const b = new MB();
    const water = (r, col) => b.disc(r, 18, col || 0x3f8fc0, { y0: 0.04, wob: 0.06 });
    const stone = (x, z, s, col) => b.ico(s, col || 0x9a948a, { x, y: s * 0.35, z, jitter: 0.45, flat: 0.7 });
    switch (id) {
      case "steg":
        water(1.4);
        b.at({ x: 0.2, z: -0.1, ry: 0.6, s: 0.38 }, m => { for (let i = 0; i < 10; i++) m.box(1.7, 0.07, 0.27, i % 3 ? 0xa86f3c : 0xc08048, { y: 0.25, z: -1.4 + i * 0.3 }); [-0.8, 0.8].forEach(x => [-1.2, 0.2, 1.4].forEach(z => m.cyl(0.07, 0.07, 0.5, 6, 0x6a4a2a, { x, y: -0.1, z }))); });
        break;
      case "rosen":
        water(1.4);
        for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 0.35 + (i % 3) * 0.3; b.disc(0.2 + (i % 2) * 0.06, 9, i % 2 ? 0x4f9a35 : 0x5daa3c, { x: Math.cos(a) * r, z: Math.sin(a) * r, y0: 0.06 }); }
        b.ico(0.11, 0xf6b3cf, { x: 0.1, y: 0.12, z: 0.1 }); b.ico(0.09, 0xffffff, { x: -0.5, y: 0.1, z: 0.4 });
        break;
      case "schilf":
        water(1.4);
        for (let i = 0; i < 16; i++) { const x = (rnd() - 0.5) * 1.6, z = (rnd() - 0.5) * 1.1, h = 0.7 + rnd() * 0.5; b.box(0.04, h, 0.04, rnd() < 0.5 ? 0x6b8f2c : 0x7da23a, { x, z, rz: (rnd() - 0.5) * 0.3 }); if (rnd() < 0.45) b.box(0.07, 0.17, 0.07, 0x7a5233, { x, y: h, z }); }
        break;
      case "stein":
        water(1.4);
        stone(0, 0, 0.55); stone(0.55, 0.3, 0.32, 0x8a847a); stone(-0.5, 0.35, 0.26); b.ico(0.12, 0x5f8a3a, { y: 0.45, flat: 0.3, jitter: 0.5 });
        break;
      case "mitte":
        water(1.4, 0x2a6f9e); b.disc(0.9, 18, 0x1f5f8f, { y0: 0.05 });
        b.cyl(0.14, 0.18, 0.3, 10, 0xf2762e, { y: 0.05 }); b.cyl(0.05, 0.05, 0.25, 6, 0xffffff, { y: 0.35 });
        break;
      case "bach":
        water(1.4);
        b.box(0.5, 0.02, 1.6, 0x8fd0ea, { x: 0.5, y: 0.05, z: -0.4, ry: 0.5 });
        stone(-0.3, 0.5, 0.18); stone(0.1, -0.6, 0.14, 0x8a847a); stone(0.9, 0.1, 0.16);
        for (let i = 0; i < 6; i++) b.box(0.035, 0.6 + rnd() * 0.3, 0.035, 0x6b8f2c, { x: -0.8 + rnd() * 0.3, z: -0.3 + rnd() * 0.6 });
        break;
    }
    return b;
  }
  function bobber() {
    const b = new MB();
    b.sphere(0.055, 8, 6, 0xe8452f, { y: 0.0, smooth: true, bottom: 0xffffff });
    b.cyl(0.008, 0.008, 0.1, 4, 0x2b2b30, { y: 0.04 });
    return b;
  }
  function lineSeg() {
    const b = new MB();
    b.box(0.012, 0.012, 1, 0xf6f6f0, { z: 0.5, y: -0.006 });
    return b;
  }

  /* Reuse (2 × 2): Schwimmrahmen mit Korken – Zustand als Kindknoten */
  function potFrame() {
    G3.seed(1241);
    const b = new MB();
    const s = 0.62;
    [[s, s], [-s, s], [s, -s], [-s, -s]].forEach(([x, z]) => b.cyl(0.12, 0.12, 0.1, 8, 0xd9b77a, { x, y: WY - 0.04, z, top: 0xc9a46a }));
    [[0, s, 0], [0, -s, 0], [s, 0, 1], [-s, 0, 1]].forEach(([x, z, r]) => b.box(1.24, 0.025, 0.025, K.rope, { x, y: WY + 0.03, z, ry: r * Math.PI / 2 }));
    return b;
  }
  /* leere Reuse liegt auf dem Rahmen und wartet auf Köder */
  function potEmpty() {
    G3.seed(1242);
    const b = new MB();
    b.at({ y: WY + 0.05, ry: 0.3 }, () => {
      const w = 0.8, h = 0.42, d = 0.5;
      [[w / 2, d / 2], [-w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]].forEach(([x, z]) => b.box(0.04, h, 0.04, 0x8a5a34, { x, z }));
      [0, h].forEach(y => { b.box(w, 0.035, 0.035, 0x8a5a34, { y, z: d / 2 }); b.box(w, 0.035, 0.035, 0x8a5a34, { y, z: -d / 2 }); b.box(0.035, 0.035, d, 0x8a5a34, { y, x: w / 2 }); b.box(0.035, 0.035, d, 0x8a5a34, { y, x: -w / 2 }); });
      for (let i = 1; i < 6; i++) { b.box(0.01, h, 0.01, K.net, { x: -w / 2 + i * w / 6, z: d / 2 }); b.box(0.01, h, 0.01, K.net, { x: -w / 2 + i * w / 6, z: -d / 2 }); }
      for (let j = 1; j < 3; j++) { b.box(w, 0.01, 0.01, K.net, { y: j * h / 3, z: d / 2 }); b.box(w, 0.01, 0.01, K.net, { y: j * h / 3, z: -d / 2 }); }
      b.cone(0.12, 0.16, 6, K.net, { x: w / 2 - 0.02, y: h / 2, rz: Math.PI / 2 });
    });
    return b;
  }
  /* ausgesetzt: nur die Boje mit Fähnchen schaut heraus */
  function potBuoy(stage) {
    G3.seed(1243 + stage);
    const b = new MB();
    buoyBall(b, 0.17, K.buoyR, { y: WY + 0.07 });
    b.cyl(0.018, 0.018, 0.75, 5, 0x2b2b30, { y: WY + 0.2 });
    b.box(0.24, 0.16, 0.01, stage >= 2 ? K.yellow : 0x111111, { x: 0.12, y: WY + 0.85 });
    b.box(0.02, 0.02, 0.5, K.rope, { y: WY + 0.02, z: 0.28, rx: 0.1 });
    return b;
  }
  /* voll: die Reuse hängt halb aus dem Wasser, darin der Fang */
  function potFull(kind) {
    G3.seed(1247);
    const b = new MB();
    buoyBall(b, 0.17, K.buoyR, { x: -0.42, y: WY + 0.07, z: 0.3 });
    b.at({ y: WY - 0.12, ry: -0.2 }, () => {
      const w = 0.85, h = 0.45, d = 0.52;
      [[w / 2, d / 2], [-w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]].forEach(([x, z]) => b.box(0.04, h, 0.04, 0x8a5a34, { x, z }));
      [h].forEach(y => { b.box(w, 0.035, 0.035, 0x8a5a34, { y, z: d / 2 }); b.box(w, 0.035, 0.035, 0x8a5a34, { y, z: -d / 2 }); b.box(0.035, 0.035, d, 0x8a5a34, { y, x: w / 2 }); b.box(0.035, 0.035, d, 0x8a5a34, { y, x: -w / 2 }); });
      for (let i = 1; i < 6; i++) { b.box(0.01, h, 0.01, K.net, { x: -w / 2 + i * w / 6, z: d / 2 }); b.box(0.01, h, 0.01, K.net, { x: -w / 2 + i * w / 6, z: -d / 2 }); }
      /* der Fang */
      if (kind === "garnele") for (let i = 0; i < 9; i++) b.at({ x: -0.3 + (i % 5) * 0.15, y: 0.32 + (i > 4 ? 0.06 : 0), z: (i % 3 - 1) * 0.12, ry: i * 0.9 }, () => {
        b.sphere(0.05, 6, 4, 0xf08c74, { sz: 2.2, sy: 0.7, smooth: true });
        b.cone(0.03, 0.08, 4, 0xe8735c, { z: -0.12, rx: -Math.PI / 2 });
      });
      else if (kind === "muschel") for (let i = 0; i < 7; i++) b.at({ x: -0.3 + (i % 4) * 0.18, y: 0.33 + (i > 3 ? 0.05 : 0), z: (i % 3 - 1) * 0.12, ry: i * 1.1 }, () => {
        b.sphere(0.07, 7, 5, i % 2 ? 0x2c3a44 : 0x3d4a3a, { sx: 1.5, sy: 0.45, smooth: true });
      });
      else for (let i = 0; i < 5; i++) b.at({ x: -0.28 + i * 0.14, y: 0.34 + (i % 2) * 0.05, z: (i % 3 - 1) * 0.1, ry: i * 1.3 }, () => {
        b.sphere(0.075, 7, 5, i % 2 ? 0xd2582e : 0xe0703a, { sy: 0.5, sx: 1.3, smooth: true });
        [1, -1].forEach(s => { b.box(0.07, 0.03, 0.03, 0xc04a24, { x: s * 0.1, z: 0.06, ry: s * 0.6 }); b.box(0.04, 0.04, 0.04, 0xa83a1c, { x: s * 0.13, z: 0.1 }); });
      });
      b.box(w, 0.02, d, 0x3f8fa5, { y: 0.3 });
    });
    return b;
  }
  /* Muschelleine (2 × 2): zwei Reihen Schwimmer, Seile dazwischen */
  function mlineBase(kind) {
    G3.seed(1251 + (kind === "perlmuschel" ? 5 : 0));
    const b = new MB();
    const pearl = kind === "perlmuschel", fc = pearl ? 0xf6f5f0 : 0x1e1e22, band = pearl ? 0x2f6fb0 : K.buoy;
    [-0.5, 0.5].forEach(z => {
      b.box(1.7, 0.03, 0.03, K.rope, { y: WY + 0.04, z });
      [-0.65, 0, 0.65].forEach(x => {
        b.cyl(0.13, 0.13, 0.42, 10, fc, { rz: Math.PI / 2, x: x + 0.21, y: WY + 0.02, z, top: fc });
        b.cyl(0.135, 0.135, 0.06, 10, band, { rz: Math.PI / 2, x: x + 0.03, y: WY + 0.02, z, nobot: true, notop: true });
      });
    });
    [-0.85, 0.85].forEach(x => b.box(0.03, 0.03, 1.0, K.rope, { x, y: WY + 0.04 }));
    if (pearl) b.box(0.36, 0.24, 0.02, 0xffffff, { x: 0.86, y: WY + 0.35, z: 0.5 }), b.cyl(0.015, 0.015, 0.55, 4, 0x2b2b30, { x: 0.86, y: WY, z: 0.49 });
    return b;
  }
  /* reife Muscheln hängen am Seil aus dem Wasser */
  function mlineFruit(kind) {
    G3.seed(1261 + (kind === "perlmuschel" ? 3 : 0));
    const b = new MB();
    const pearl = kind === "perlmuschel";
    /* Muschelbärte hängen in dicken Trauben am Seil, nass glänzend */
    [-0.5, 0.5].forEach(z => {
      for (let i = 0; i < 8; i++) {
        const x = -0.72 + i * 0.205, y = WY + 0.07 + Math.sin(i * 1.7) * 0.025;
        b.noise(0.25, () => {
          b.ico(0.1, pearl ? 0x8f887c : 0x2c3650, { x, y, z: z + 0.05, jitter: 0.45, flat: 0.85 });
          b.ico(0.085, pearl ? 0xb8b0a0 : 0x45577a, { x: x + 0.08, y: y + 0.03, z: z - 0.06, jitter: 0.45, flat: 0.85 });
          b.ico(0.06, pearl ? 0xd6cfc0 : 0x5d7096, { x: x - 0.04, y: y + 0.07, z: z - 0.01, jitter: 0.4 });
          if (i % 2 === 0) b.box(0.03, 0.14, 0.03, 0x6b8a3a, { x: x - 0.06, y: y + 0.02, z: z + 0.08, rz: 0.5 });
        });
        if (pearl && i % 3 === 1) b.sphere(0.045, 8, 6, 0xffffff, { x, y: y + 0.12, z: z + 0.03, smooth: true });
      }
    });
    return b;
  }
  /* Netzgehege: schwimmender Doppelring, Geländer, Futterautomat */
  function netPen(w, d) {
    G3.seed(1271 + w);
    const b = new MB();
    const R = Math.min(w, d) / 2 - 0.3, seg = Math.max(20, Math.round(R * 9));
    ring(b, R, 0.13, seg, K.pipe, { y: WY + 0.02 });
    ring(b, R + 0.2, 0.13, seg, K.pipe, { y: WY + 0.02 });
    ring(b, R + 0.1, 0.05, seg, 0x45454c, { y: WY + 0.62 });
    for (let i = 0; i < seg; i += 2) {
      const a = i / seg * Math.PI * 2;
      b.box(0.045, 0.6, 0.045, 0x45454c, { x: Math.cos(a) * (R + 0.1), y: WY + 0.04, z: Math.sin(a) * (R + 0.1) });
    }
    /* Netzrand knapp über dem Wasser */
    ring(b, R - 0.06, 0.035, seg, K.net, { y: WY + 0.06 });
    /* Laufsteg aus Gitterrost auf der Kaiseite */
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.3 + i * 0.05);
      b.box(0.45, 0.04, 0.3, 0x8c98a2, { x: Math.cos(a) * (R + 0.1), y: WY + 0.1, z: Math.sin(a) * (R + 0.1), ry: -a + Math.PI / 2 });
    }
    /* Futterautomat mit Solarpaneel */
    b.at({ x: -(R + 0.1) * 0.7, z: -(R + 0.1) * 0.7 }, () => {
      b.cyl(0.18, 0.18, 0.45, 10, K.yellow, { y: WY + 0.08, top: 0xd8a91f });
      b.cone(0.2, 0.15, 10, 0xd8a91f, { y: WY + 0.53 });
      b.box(0.36, 0.02, 0.26, 0x22344a, { y: WY + 0.8, rx: -0.5 });
      b.box(0.03, 0.2, 0.03, 0x45454c, { y: WY + 0.6 });
    });
    return b;
  }
  /* dunkles Wasser im Netz – bekommt den Wasser-Shader */
  function netWater(w, d) {
    const b = new MB();
    const R = Math.min(w, d) / 2 - 0.36, seg = 36;
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      b.triV([0, WY + 0.012, 0], [Math.cos(a1) * R, WY + 0.012, Math.sin(a1) * R], [Math.cos(a0) * R, WY + 0.012, Math.sin(a0) * R], 0x2e7180, 0x22596a, 0x22596a);
    }
    return b;
  }
  /* Regenbogenforelle (Kopf nach +z) */
  function trout(s) {
    const b = new MB();
    b.at({ s: s || 1 }, () => {
      b.sphere(0.07, 9, 6, 0x8a9a5c, { sz: 3.1, sx: 0.75, bottom: 0xe8ecec, smooth: true });
      b.box(0.012, 0.035, 0.32, 0xe8948c, { x: 0.05, z: 0.0 }); b.box(0.012, 0.035, 0.32, 0xe8948c, { x: -0.05, z: 0.0 });
      for (let i = 0; i < 5; i++) b.box(0.02, 0.012, 0.02, 0x2b2f22, { x: (i % 2 - 0.5) * 0.04, y: 0.066, z: -0.12 + i * 0.06 });
      b.tri([0, 0, -0.2], [0, 0.09, -0.3], [0, -0.07, -0.3], 0x55643a);
      b.tri([0, 0, -0.2], [0, -0.07, -0.3], [0, 0.09, -0.3], 0x55643a);
      b.tri([0, 0.06, 0.02], [0, 0.11, -0.06], [0, 0.06, -0.08], 0x55643a);
      b.tri([0, 0.06, 0.02], [0, 0.06, -0.08], [0, 0.11, -0.06], 0x55643a);
      b.box(0.02, 0.02, 0.01, 0x111111, { x: 0.035, y: 0.015, z: 0.17 }); b.box(0.02, 0.02, 0.01, 0x111111, { x: -0.035, y: 0.015, z: 0.17 });
    });
    return b;
  }
  /* Schwarm im Netzgehege: drei Rücken, die durchs Wasser ziehen */
  function fishSchool(v) {
    G3.seed(1281 + (v || 0));
    const b = new MB();
    [[0, 0, 0], [0.17, -0.01, -0.2], [-0.15, -0.015, -0.12]].forEach(([x, y, z], i) => b.merge(trout(i === 0 ? 1 : 0.85), { x, y, z, ry: (i - 1) * 0.12 }));
    return b;
  }
  /* Kiste mit Forellen als Zeichen „abfischen!“ */
  function fishCrate() {
    const b = new MB();
    crate(b, { y: 0 }, true);
    return b;
  }

  /* ------------------------------- Möwe --------------------------------- */
  function gullBody() {
    const b = new MB();
    b.sphere(0.11, 9, 6, 0xf8f8f6, { sz: 2.0, smooth: true });
    b.sphere(0.075, 8, 6, 0xf8f8f6, { y: 0.06, z: 0.18, smooth: true });
    b.box(0.03, 0.025, 0.08, 0xf2c230, { y: 0.05, z: 0.27 });
    b.box(0.08, 0.02, 0.1, 0x2b2b30, { z: -0.24 });
    b.box(0.015, 0.015, 0.01, 0x111111, { x: 0.04, y: 0.08, z: 0.22 }); b.box(0.015, 0.015, 0.01, 0x111111, { x: -0.04, y: 0.08, z: 0.22 });
    return b;
  }
  /* Flügel (rechts, s = 1) mit schwarzer Spitze – Drehpunkt am Körper */
  function gullWing(s) {
    const b = new MB();
    b.box(0.26, 0.015, 0.16, 0xaeb6bd, { x: s * 0.13 });
    b.box(0.2, 0.012, 0.11, 0x9aa3ab, { x: s * 0.34, z: -0.02 });
    b.box(0.08, 0.01, 0.08, 0x1d1d20, { x: s * 0.47, z: -0.03 });
    return b;
  }
  /* sitzende Möwe (für Poller und Deko) */
  function gullSit() {
    const b = new MB();
    b.merge(gullBody(), { y: 0.12 });
    b.box(0.2, 0.05, 0.22, 0xaeb6bd, { y: 0.15, z: -0.03 });
    b.box(0.02, 0.1, 0.02, 0xf2c230, { x: 0.04 }); b.box(0.02, 0.1, 0.02, 0xf2c230, { x: -0.04 });
    return b;
  }

  /* ------------------------------ Kulisse ------------------------------- */
  /* Land: Kopfsteinpflaster am Kai, Wiese, Promenade, Hafengelände */
  function coastLand() {
    G3.seed(1301);
    const b = new MB();
    const noise = (x, z) => Math.sin(x * 0.37 + z * 0.21) * 0.5 + Math.sin(x * 0.11 - z * 0.43) * 0.5;
    for (let x = -60; x < 60; x++)
      for (let z = KAI_Z; z < 60; z++) {
        const cx = x + 0.5, cz = z + 0.5;
        if (cx > 14 && cz < 2.5) continue;                       /* Strand (eigene Schräge) */
        const v = noise(cx, cz);
        let c;
        const yard = Math.abs(cx) < 13 && cz < 13;
        if (yard) c = cz < -2 ? ((x + z) % 2 ? K.cobble : K.cobbleD) : ((x + z) % 2 ? 0xc7c0b0 : 0xbfb8a8);
        else if (cx < -13 && cz < 10) c = (x + z) % 2 ? K.cobble : K.cobbleD;
        else if (cx > 14 && cz < 6) c = (x + z) % 2 ? K.pave : K.paveD;
        else if (cx > 27 && cz < 11) c = v > 0.2 ? K.sandD : v > -0.3 ? 0xc9c48a : 0xa8b866;
        else if (Math.abs(cz - 18.5) < 1.2) c = 0x7c7f86;
        else c = v > 0.35 ? C.grassD : v > -0.2 ? C.grass2 : C.grass;
        b.noise(0.05, () => b.plate(1.0, 1.0, c, { x: cx, z: cz }));
      }
    /* Straße: Mittellinie */
    for (let x = -59.5; x < 60; x += 1.2) b.plate(0.5, 0.08, 0xf3efe6, { x, z: 18.5, y0: 0.005 });
    /* Rand unter dem Gelände */
    b.box(120, 0.6, 64, 0x6b4a2e, { y: -1.3, z: KAI_Z + 32 });
    return b;
  }
  /* Kaimauer mit Pollern, Leitern und dunklem Nassstreifen */
  function quay(x0, x1) {
    G3.seed(1311);
    const b = new MB();
    const len = x1 - x0, mx = (x0 + x1) / 2;
    b.noise(0.06, () => {
      b.box(len, 1.2, 0.5, K.kai, { x: mx, y: WY - 0.9, z: KAI_Z - 0.25, top: K.kaiTop });
      b.box(len, 0.12, 0.6, K.kaiTop, { x: mx, y: -0.08, z: KAI_Z - 0.2 });
    });
    for (let x = x0; x < x1; x += 0.9) b.box(0.88, 0.18, 0.02, (Math.round(x * 3) % 2) ? 0x8f897f : 0x9a948a, { x: x + 0.45, y: WY + 0.1, z: KAI_Z - 0.51 });
    b.box(len, 0.12, 0.02, K.kaiWet, { x: mx, y: WY - 0.02, z: KAI_Z - 0.52 });
    for (let x = x0 + 1.5; x < x1 - 0.5; x += 3.2) bollard(b, { x, z: KAI_Z - 0.25, y: 0.04 });
    for (let x = x0 + 4; x < x1; x += 11) for (let i = 0; i < 4; i++) b.box(0.32, 0.03, 0.03, 0x55606a, { x, y: -0.1 - i * 0.14, z: KAI_Z - 0.53 });
    return b;
  }
  /* Strand mit nassem Saum, flach ins Wasser abfallend */
  function beach(x0, x1) {
    G3.seed(1321);
    const b = new MB();
    const zs = [2.5, 0.5, -1.5, -3.2, -4.6, -6.5];
    const ys = [0.0, 0.0, -0.06, -0.2, -0.34, -0.6];
    const cs = [K.sand, K.sand, K.sandD, K.sandW, 0xa8925f, 0x8f7d52];
    for (let x = x0; x < x1; x += 2) for (let i = 0; i < zs.length - 1; i++) {
      const a = [x, ys[i], zs[i]], bb = [x + 2, ys[i], zs[i]], c = [x + 2, ys[i + 1], zs[i + 1]], d = [x, ys[i + 1], zs[i + 1]];
      b.triV(a, bb, c, cs[i], cs[i], cs[i + 1]);
      b.triV(a, c, d, cs[i], cs[i + 1], cs[i + 1]);
    }
    /* Muscheln und Tang */
    for (let i = 0; i < 70; i++) b.box(0.08, 0.01, 0.05, i % 3 ? 0xf3ead6 : 0x6f7a46, { x: x0 + rnd() * (x1 - x0), y: 0.005, z: -1.5 + rnd() * 3.5, ry: rnd() * 3 });
    return b;
  }
  /* Schaumsaum, wo die Wellen am Strand auslaufen */
  function surf(x0, x1) {
    const b = new MB();
    for (let x = x0; x < x1; x += 1) {
      const z0 = -4.05 + Math.sin(x * 0.7) * 0.18, z1 = -4.05 + Math.sin((x + 1) * 0.7) * 0.18;
      b.quad([x, 0, z0 + 0.22], [x + 1, 0, z1 + 0.22], [x + 1, 0, z1 - 0.12], [x, 0, z0 - 0.12], 0xf4f8f6);
    }
    return b;
  }
  /* Meer: flach am Kai türkis, draußen tiefblau */
  function sea() {
    const b = new MB();
    const lerp = (a, c, t) => { const A = G3.col(a), B = G3.col(c); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
    const colAt = (x, z) => {
      const d = KAI_Z - z, shore = x > 14 ? 1.4 : 1;
      const t = Math.min(1, d / (26 * shore));
      const near = x > 14 ? 0x4fa6ad : 0x3a8a98;
      return t < 0.35 ? lerp(near, 0x2a7096, t / 0.35) : lerp(0x2a7096, 0x1b4d78, (t - 0.35) / 0.65);
    };
    const step = 4;
    for (let x = -84; x < 84; x += step)
      for (let z = -84; z < KAI_Z; z += step) {
        const z2 = Math.min(KAI_Z + 0.1, z + step);
        b.triV([x, 0, z], [x, 0, z2], [x + step, 0, z2], colAt(x, z), colAt(x, z2), colAt(x + step, z2));
        b.triV([x, 0, z], [x + step, 0, z2], [x + step, 0, z], colAt(x, z), colAt(x + step, z2), colAt(x + step, z));
      }
    return b;
  }
  /* Westmole aus Feldsteinen mit grünem Molenfeuer */
  function mole(len) {
    G3.seed(1331);
    const b = new MB();
    for (let z = 0; z < len; z += 0.55) for (let s = -1; s <= 1; s += 2)
      b.noise(0.12, () => b.ico(0.42 + rnd() * 0.2, rnd() < 0.5 ? 0x9a948a : 0x86807a, { x: s * (0.6 + rnd() * 0.3), y: WY - 0.05, z: -z, jitter: 0.5, flat: 0.7 }));
    b.box(1.2, 0.7, len, 0xb0aaa0, { y: WY - 0.4, z: -len / 2, top: 0xbdb7ad });
    b.at({ z: -len - 0.3 }, () => {
      b.cyl(1.0, 1.1, 0.7, 10, 0xb0aaa0, { y: WY - 0.4 });
      b.cyl(0.38, 0.34, 2.6, 10, 0xffffff, { y: 0.3 });
      b.cyl(0.39, 0.39, 0.45, 10, 0x2f8a4a, { y: 1.6 });
      b.cyl(0.24, 0.24, 0.35, 8, C.glow, { y: 2.9 });
      b.cone(0.3, 0.3, 8, 0x2f8a4a, { y: 3.25 });
      b.cyl(0.5, 0.5, 0.05, 10, 0x45454c, { y: 2.88 });
    });
    return b;
  }
  /* Leuchtturm: weißer Turm, zwei Galerien, Laterne, grüne Haube */
  function lighthouse() {
    G3.seed(1341);
    const b = new MB();
    b.noise(0.05, () => b.cyl(1.6, 1.6, 0.35, 16, 0xbdb7ad, { top: 0xc9c3b8 }));
    b.cyl(1.05, 0.82, 6.4, 16, 0xf7f4ee, { y: 0.35, smooth: true });
    [1.6, 3.2, 4.8].forEach(y => FM.windowAt(b, 0, y, 1.0 - y * 0.034, 0.18, 0.32, { frame: 0xd9d3c6 }));
    b.box(0.5, 0.95, 0.05, 0x2f6f5a, { y: 0.35, z: 1.03 });
    b.at({ y: 6.75 }, () => {
      b.cyl(1.2, 1.2, 0.14, 16, 0xc9c3b8);
      ring(b, 1.15, 0.05, 24, 0x2f6f5a, { y: 0.55 });
      for (let i = 0; i < 24; i += 2) { const a = i / 24 * Math.PI * 2; b.box(0.04, 0.5, 0.04, 0x2f6f5a, { x: Math.cos(a) * 1.15, z: Math.sin(a) * 1.15, y: 0.1 }); }
      b.cyl(0.72, 0.72, 0.9, 12, 0xf7f4ee, { y: 0.14 });
      b.cyl(0.85, 0.85, 0.1, 12, 0xc9c3b8, { y: 1.04 });
      b.cyl(0.55, 0.55, 0.85, 10, C.glow, { y: 1.14 });
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; b.box(0.04, 0.85, 0.04, 0x2f6f5a, { x: Math.cos(a) * 0.56, z: Math.sin(a) * 0.56, y: 1.14 }); }
      b.cone(0.66, 0.65, 12, 0x3d6b5a, { y: 1.99 });
      b.cyl(0.04, 0.02, 0.5, 5, 0x2b2b30, { y: 2.6 });
    });
    return b;
  }
  const LIGHT_TOP = 8.3;
  /* Teepott: runder Glasbau mit geschwungenem Schalendach */
  function teepott() {
    G3.seed(1351);
    const b = new MB();
    b.cyl(2.5, 2.5, 0.2, 24, 0xd9d1c2, { top: 0xcfc6b5 });
    b.cyl(2.25, 2.25, 1.05, 24, K.glass, { y: 0.2, stripe: 0xf6f5f0 });
    b.cyl(2.27, 2.27, 0.14, 24, 0xf6f5f0, { y: 0.2 });
    const seg = 48, R = 3.0;
    /* drei Schalen (hyperbolische Paraboloide): Rand hebt und senkt sich dreimal */
    const up = [0, 1, 0];
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      const y0 = 1.55 + 0.85 * Math.cos(3 * a0), y1 = 1.55 + 0.85 * Math.cos(3 * a1);
      const c = [0, 1.4, 0], p0 = [Math.cos(a0) * R, y0, Math.sin(a0) * R], p1 = [Math.cos(a1) * R, y1, Math.sin(a1) * R];
      const m0 = [p0[0] * 0.55, 1.4 + (y0 - 1.4) * 0.45, p0[2] * 0.55], m1 = [p1[0] * 0.55, 1.4 + (y1 - 1.4) * 0.45, p1[2] * 0.55];
      /* weich schattiert: Normalen zeigen nach oben bzw. unten, keine Fächerstreifen */
      const dn = [0, -1, 0];
      b.tri(c, m1, m0, 0xf8f7f2, up, up, up);
      b.tri(m0, m1, p1, 0xf8f7f2, up, up, up); b.tri(m0, p1, p0, 0xf8f7f2, up, up, up);
      b.tri(m1, m0, p0, 0xd6d1c6, dn, dn, dn); b.tri(m1, p0, p1, 0xd6d1c6, dn, dn, dn);
      b.tri(c, m0, m1, 0xd6d1c6, dn, dn, dn);
      const q0 = [p0[0], p0[1] - 0.12, p0[2]], q1 = [p1[0], p1[1] - 0.12, p1[2]];
      b.quad(p0, p1, q1, q0, 0x9fb6c4);
    }
    [0, 2.09, 4.19].forEach(a => b.box(0.14, 1.5, 0.14, 0xf6f5f0, { x: Math.cos(a + Math.PI / 3) * 2.3, z: Math.sin(a + Math.PI / 3) * 2.3, y: 0.2 }));
    return b;
  }
  /* Strandkorb, blau-weiß gestreift (schaut nach +z) */
  function strandkorb(c) {
    G3.seed(1361);
    const b = new MB();
    const col = c || 0x2f6fb0;
    b.box(0.8, 0.12, 0.55, 0xb08a52, { y: 0.0 });
    b.noise(0.06, () => {
      b.box(0.8, 0.85, 0.12, 0xd9c08a, { y: 0.1, z: -0.22 });
      b.box(0.1, 0.55, 0.5, 0xd9c08a, { x: 0.36, y: 0.1 }); b.box(0.1, 0.55, 0.5, 0xd9c08a, { x: -0.36, y: 0.1 });
    });
    for (let i = 0; i < 7; i++) b.box(0.115, 0.6, 0.02, i % 2 ? 0xffffff : col, { x: -0.345 + i * 0.115, y: 0.32, z: -0.15 });
    b.box(0.74, 0.18, 0.4, 0xf6f5f0, { y: 0.12, z: 0.02 });
    b.at({ y: 0.95, z: -0.1 }, () => {
      for (let i = 0; i < 7; i++) b.box(0.12, 0.05, 0.42, i % 2 ? 0xffffff : col, { x: -0.36 + i * 0.12, rx: 0.15 });
      b.box(0.86, 0.06, 0.44, 0xd9c08a, { y: 0.06 });
    });
    return b;
  }
  /* Düne mit Strandhafer */
  function dune(s) {
    G3.seed(1371 + Math.round(s * 10));
    const b = new MB();
    b.noise(0.08, () => b.ico(1.6 * s, K.sand, { y: -0.6 * s, flat: 0.45, jitter: 0.3, detail: 1 }));
    for (let i = 0; i < 26; i++) {
      const a = rnd() * 6.28, r = rnd() * 1.4 * s;
      b.box(0.03, 0.4 + rnd() * 0.3, 0.03, rnd() < 0.5 ? 0x9fb35a : 0xc2c06a, { x: Math.cos(a) * r, y: 0.05 + 0.25 * s * (1 - r / (1.6 * s)), z: Math.sin(a) * r, rz: (rnd() - 0.5) * 0.5, rx: (rnd() - 0.5) * 0.5 });
    }
    return b;
  }
  /* Bäderarchitektur „Am Strom“: schmale Giebelhäuser mit weißer Veranda */
  function townHouse(i) {
    G3.seed(1381 + i);
    const b = new MB();
    const cols = [0xf6e3a6, 0xcfe8dc, 0xcfe0f2, 0xf3d0d0, 0xf6f5f0, 0xf2dcb8];
    const c = cols[i % cols.length], w = 2.4 + (i % 3) * 0.3, h = 2.6 + (i % 2) * 0.6;
    b.box(w, h, 2.6, c);
    for (let f = 0; f < 2; f++) [-w / 4, w / 4].forEach(x => {
      FM.windowAt(b, x, 0.55 + f * 1.2, 1.31, 0.4, 0.55, { frame: 0xffffff, lit: rnd() < 0.5 });
      FM.windowAt(b, x, 0.55 + f * 1.2, -1.31, 0.4, 0.55, { frame: 0xffffff, ry: Math.PI, lit: rnd() < 0.5 });
    });
    /* weiße Veranda zur Straße (−z) */
    b.at({ z: -1.55 }, () => {
      b.box(w * 0.75, 1.1, 0.5, 0xffffff);
      b.box(w * 0.7, 0.75, 0.52, 0xa7d0e2, { y: 0.25 });
      for (let k = 0; k < 4; k++) b.box(0.04, 0.75, 0.53, 0xffffff, { x: -w * 0.35 + k * w * 0.233, y: 0.25 });
    });
    b.at({ y: h }, () => b.noise(0.05, () => b.roof(2.9, w + 0.3, 1.3, i % 2 ? C.roof : 0x5d5560, { ry: Math.PI / 2, gable: c })));
    return b;
  }
  /* Backsteinspeicher am Hafen mit Ladeluken und Kranbalken */
  function warehouse() {
    G3.seed(1391);
    const b = new MB();
    b.noise(0.06, () => b.box(5, 4.2, 3.6, K.brick, { top: K.brickD }));
    for (let y = 0.4; y < 4.2; y += 0.4) b.box(5.02, 0.02, 3.62, K.mortar, { y });
    for (let f = 0; f < 3; f++) {
      b.box(0.9, 0.95, 0.06, 0x2f5a3a, { y: 0.3 + f * 1.3, z: -1.81 });
      [-1.7, 1.7].forEach(x => FM.windowAt(b, x, 0.6 + f * 1.3, -1.82, 0.5, 0.6, { frame: 0xffffff, ry: Math.PI, lit: false }));
    }
    b.box(0.12, 0.12, 1.0, 0x3a2a22, { y: 4.0, z: -2.2 });
    b.at({ y: 4.2 }, () => b.noise(0.04, () => b.roof(5.4, 3.9, 2.0, 0x5d5560, { ry: 0, gable: K.brick })));
    return b;
  }
  /* große Fähre weit draußen */
  function ferry() {
    G3.seed(1401);
    const b = new MB();
    b.box(3.4, 1.3, 16, 0xf6f5f0, { y: -0.4 });
    b.box(3.42, 0.35, 16.02, 0x22344a, { y: -0.4 });
    b.cone(1.7, 3.0, 4, 0xf6f5f0, { z: 8.0, y: -0.4, rx: Math.PI / 2, a0: Math.PI / 4, sx: 1, sy: 1.15 });
    b.box(3.0, 1.0, 10, 0xf6f5f0, { y: 0.9, z: -1 });
    b.box(3.02, 0.25, 10.02, 0x22344a, { y: 1.3, z: -1 });
    b.box(2.6, 0.8, 5, 0xf6f5f0, { y: 1.9, z: 1 });
    b.box(2.62, 0.2, 5.02, 0x22344a, { y: 2.15, z: 1 });
    b.box(1.0, 1.4, 1.2, 0x2f6fb0, { y: 2.7, z: -3, top: 0x1d1d20 });
    return b;
  }
  /* Fahrwassertonne: grün (Spitztonne) oder rot (Stumpftonne) */
  function channelBuoy(red) {
    const b = new MB();
    b.cyl(0.35, 0.3, 0.35, 10, red ? 0xd83a2e : 0x2f8a4a, { y: -0.15 });
    if (red) b.cyl(0.24, 0.24, 0.7, 8, 0xd83a2e, { y: 0.2 });
    else b.cone(0.28, 0.85, 8, 0x2f8a4a, { y: 0.2 });
    b.cyl(0.03, 0.03, 0.4, 4, 0x2b2b30, { y: 0.9 });
    return b;
  }
  /* Gartenzaun (weiß) für den Rand des Betriebs */
  function picket(len) {
    const b = new MB();
    for (let x = 0; x < len; x += 0.25) b.box(0.07, 0.5, 0.03, 0xf6f5f0, { x: x - len / 2 + 0.125 });
    b.box(len, 0.06, 0.04, 0xf6f5f0, { y: 0.15, z: -0.03 }); b.box(len, 0.06, 0.04, 0xf6f5f0, { y: 0.38, z: -0.03 });
    return b;
  }

  /* -------------------------------- Deko -------------------------------- */
  function anker() {
    G3.seed(1501);
    const b = new MB();
    b.noise(0.06, () => b.box(0.5, 0.12, 0.5, 0x9c968c));
    b.at({ y: 0.12 }, () => {
      b.box(0.08, 0.95, 0.08, 0x2b2b30, { y: 0.1 });
      b.box(0.5, 0.06, 0.06, 0x2b2b30, { y: 0.85 });
      ring(b, 0.07, 0.03, 10, 0x2b2b30, { y: 1.1, rx: Math.PI / 2 });
      for (let k = -4; k <= 4; k++) { const a = Math.PI * 1.5 + k * 0.2; b.box(0.08, 0.08, 0.07, 0x2b2b30, { x: Math.cos(a) * 0.32, y: 0.42 + Math.sin(a) * 0.32 }); }
      [1, -1].forEach(s => b.cone(0.07, 0.16, 4, 0x2b2b30, { x: s * 0.36, y: 0.2, rz: s * -0.6 }));
    });
    return b;
  }
  function fischkisten() {
    const b = new MB();
    crate(b, { col: 0x2f6fb0 }); crate(b, { y: 0.18, col: 0xe8452f, ry: 0.2 }); crate(b, { y: 0.36, col: 0xf2c230, ry: -0.15 }, true);
    return b;
  }
  function rettungsring() {
    const b = new MB();
    b.box(0.08, 1.0, 0.08, 0x8a5a34);
    b.box(0.5, 0.06, 0.05, 0x8a5a34, { y: 0.95 });
    ring(b, 0.2, 0.07, 14, i => (i >> 1) % 2 ? 0xffffff : 0xe8452f, { y: 0.62, z: 0.08, rx: Math.PI / 2 });
    return b;
  }
  function bojen() {
    const b = new MB();
    [[0.15, 0.15, K.buoy], [-0.18, 0.1, K.buoyR], [0, -0.18, K.buoy]].forEach(([x, z, c]) => buoyBall(b, 0.17, c, { x, y: 0.17, z }));
    buoyBall(b, 0.15, 0xf6f5f0, { x: 0, y: 0.42, z: 0.02 });
    return b;
  }
  function strandhafer() {
    G3.seed(1511);
    const b = new MB();
    b.noise(0.1, () => b.ico(0.3, K.sand, { y: -0.1, flat: 0.4, jitter: 0.3 }));
    for (let i = 0; i < 18; i++) b.box(0.025, 0.45 + rnd() * 0.25, 0.025, rnd() < 0.5 ? 0x9fb35a : 0xc2c06a, { x: (rnd() - 0.5) * 0.4, z: (rnd() - 0.5) * 0.4, rz: (rnd() - 0.5) * 0.6, rx: (rnd() - 0.5) * 0.6 });
    return b;
  }
  function netzgestell() {
    const b = new MB();
    [-0.85, 0.85].forEach(x => b.box(0.08, 1.2, 0.08, 0x8a5a34, { x }));
    b.box(1.8, 0.06, 0.06, 0x8a5a34, { y: 1.15 });
    netPanel(b, 1.6, 0.9, { y: 0.22 }, 0x3d6b5a);
    b.box(0.2, 0.3, 0.02, 0x3d6b5a, { x: 0.5, y: 0.0, rz: 0.2 });
    return b;
  }
  function moewenpfahl() {
    const b = new MB();
    b.cyl(0.11, 0.12, 1.0, 8, 0x8a5a34, { top: 0x6e4a2e });
    b.merge(gullSit(), { y: 1.0, ry: 0.6 });
    return b;
  }
  function fahnenmast() {
    const b = new MB();
    b.box(0.3, 0.12, 0.3, 0x9c968c);
    b.cyl(0.04, 0.035, 2.4, 6, 0xf6f5f0, { y: 0.12 });
    b.sphere(0.05, 6, 5, 0xe9c34a, { y: 2.55 });
    b.box(0.6, 0.12, 0.01, 0x2f6fb0, { x: 0.3, y: 2.3 });
    b.box(0.6, 0.12, 0.01, 0xffffff, { x: 0.3, y: 2.18 });
    b.box(0.6, 0.12, 0.01, 0xd83a2e, { x: 0.3, y: 2.06 });
    return b;
  }
  function leuchtboje() {
    const b = new MB();
    b.cyl(0.32, 0.28, 0.3, 10, 0xf2c230, { y: WY - 0.1 });
    b.cyl(0.14, 0.12, 0.7, 8, 0xf2c230, { y: WY + 0.2 });
    b.box(0.3, 0.06, 0.02, 0x111111, { y: WY + 0.55 });
    b.cyl(0.08, 0.08, 0.14, 8, C.glow, { y: WY + 0.9 });
    return b;
  }
  function jolle() {
    G3.seed(1521);
    const b = new MB();
    b.at({ y: WY }, () => {
      b.noise(0.05, () => b.cyl(0.32, 0.46, 0.28, 14, 0xf6f5f0, { sx: 0.5, sz: 1.0, ry: Math.PI / 2, y: -0.06, notop: true }));
      b.cyl(0.3, 0.42, 0.26, 14, 0xb98a5a, { sx: -0.47, sz: 0.94, ry: Math.PI / 2, y: -0.05, notop: true, nobot: true });
      b.cyl(0.03, 0.025, 1.9, 5, 0xd9d3c6, { y: 0.1, z: 0.15 });
      b.tri([0, 0.25, 0.12], [0, 1.95, 0.15], [0, 0.3, -0.8], 0xffffff);
      b.tri([0, 0.25, 0.12], [0, 0.3, -0.8], [0, 1.95, 0.15], 0xf3efe6);
      b.tri([0, 0.3, 0.2], [0, 1.6, 0.17], [0, 0.32, 0.75], 0xf2762e);
      b.tri([0, 0.3, 0.2], [0, 0.32, 0.75], [0, 1.6, 0.17], 0xe0682a);
    });
    return b;
  }


  /* ---------------------- Fische und Fischwaren (v53) ----------------------
     Für Bildchen, Verkaufsstand und fliegende Ware: jeder Fisch mit eigener
     Form und Zeichnung (liegend, Flanke nach oben), dazu Filets, Räucherware,
     Konserven, Kisten, Köder, Muscheln, Krabben und Krebse. */
  const cmix = (a, b, t) => { const A = G3.col(a), B = G3.col(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
  const lerpP = (P, t) => { for (let i = 1; i < P.length; i++) if (t <= P[i][0]) { const a = P[i - 1], c = P[i], f = (t - a[0]) / Math.max(1e-6, c[0] - a[0]); return a[1] + (c[1] - a[1]) * f; } return P[P.length - 1][1]; };
  /* Arten: Länge, Höhe, Dicke (Anteil der Höhe), Farben, Zeichnung, Flossen */
  const FISH = {
    barsch:  { L: 1.0, H: 0.36, k: 0.4, back: 0x4f6c34, side: 0xa6b65a, belly: 0xf2ecd2, fin: 0x55663c, low: 0xe8642a, tail: 0xd06a30, bars: 6, barC: 0x2e4420, spiny: true,
               prof: [[0, 0.34], [0.12, 0.3], [0.35, 0.82], [0.55, 1], [0.8, 0.8], [0.93, 0.5], [1, 0.22]], dors: [0.32, 0.78], anal: [0.18, 0.34] },
    forelle: { L: 1.0, H: 0.26, k: 0.45, back: 0x5f6e42, side: 0xc8c0a8, belly: 0xf4f2ec, fin: 0x7a7a58, tail: 0x6e7050, stripe: 0xe8948c, spots: 0x2a2a1c, adipose: true,
               prof: [[0, 0.4], [0.1, 0.36], [0.35, 0.86], [0.55, 1], [0.8, 0.86], [0.94, 0.52], [1, 0.25]], dors: [0.5, 0.66], anal: [0.18, 0.3] },
    karpfen: { L: 1.0, H: 0.42, k: 0.42, back: 0x6a4e24, side: 0xc8962a, belly: 0xf0d890, fin: 0x8a5a32, tail: 0x8a5a32, scales: 0xa87a22, barbels: 1,
               prof: [[0, 0.32], [0.12, 0.3], [0.35, 0.86], [0.5, 1], [0.75, 0.88], [0.92, 0.55], [1, 0.26]], dors: [0.3, 0.72], anal: [0.16, 0.28] },
    hecht:   { L: 1.3, H: 0.22, k: 0.55, back: 0x34502a, side: 0x7a9a4a, belly: 0xf0f0dc, fin: 0x8a7a3a, tail: 0x7a6a34, lspots: 0xd8d890, snout: 0.09,
               prof: [[0, 0.42], [0.1, 0.48], [0.3, 0.92], [0.5, 1], [0.75, 0.92], [0.9, 0.62], [1, 0.32]], dors: [0.14, 0.3], anal: [0.13, 0.28] },
    zander:  { L: 1.15, H: 0.26, k: 0.48, back: 0x55625e, side: 0xb4bcb4, belly: 0xf4f4f0, fin: 0x8a948c, tail: 0x7a847c, bars: 8, barC: 0x4a5652, fspots: 0x2a302c, eye: 0xd8e0c8,
               prof: [[0, 0.38], [0.1, 0.34], [0.32, 0.86], [0.5, 1], [0.78, 0.86], [0.93, 0.5], [1, 0.24]], dors: [0.3, 0.78], anal: [0.18, 0.32] },
    aal:     { L: 1.3, H: 0.11, k: 0.85, back: 0x34341e, side: 0x5a5a2a, belly: 0xe0d080, fin: 0x3e3e24, tail: 0x3e3e24, eel: true,
               prof: [[0, 0.32], [0.12, 0.8], [0.5, 1], [0.86, 0.92], [1, 0.48]], dors: [0.02, 0.6], anal: [0.02, 0.48] },
    wels:    { L: 1.35, H: 0.26, k: 0.7, back: 0x34342e, side: 0x66604e, belly: 0xd8d0c0, fin: 0x3e3c34, tail: 0x3e3c34, mott: 0x2a2a24, barbels: 3,
               prof: [[0, 0.26], [0.2, 0.5], [0.5, 0.82], [0.78, 1], [0.92, 0.86], [1, 0.55]], dors: [0.66, 0.72], anal: [0.04, 0.52], wide: 1.25 },
    schleie: { L: 0.95, H: 0.32, k: 0.48, back: 0x34421e, side: 0x7a7a2a, belly: 0xc8b860, fin: 0x34401e, tail: 0x34401e, eyeR: 0xd84a2a, round: true,
               prof: [[0, 0.44], [0.12, 0.42], [0.35, 0.86], [0.55, 1], [0.8, 0.84], [0.94, 0.5], [1, 0.26]], dors: [0.42, 0.6], anal: [0.2, 0.32] },
    rotauge:  { L: 0.8, H: 0.3, k: 0.4, back: 0x405466, side: 0xd8dce2, belly: 0xf8f8f8, fin: 0xd8724e, tail: 0xb87a62, eyeR: 0xd8342a,
               prof: [[0, 0.32], [0.12, 0.3], [0.35, 0.86], [0.55, 1], [0.8, 0.82], [0.94, 0.48], [1, 0.22]], dors: [0.45, 0.62], anal: [0.18, 0.32] },
    rotfeder: { L: 0.8, H: 0.32, k: 0.4, back: 0x5e6236, side: 0xe0c870, belly: 0xf8f0dc, fin: 0xe8322a, tail: 0xd83a2a, eyeR: 0xe8a030,
               prof: [[0, 0.3], [0.12, 0.3], [0.35, 0.88], [0.55, 1], [0.8, 0.8], [0.94, 0.46], [1, 0.22]], dors: [0.38, 0.52], anal: [0.18, 0.34] },
    ukelei:  { L: 0.62, H: 0.15, k: 0.42, back: 0x56788a, side: 0xe6ecf2, belly: 0xffffff, fin: 0xc8d0d4, tail: 0xb8c4c8,
               prof: [[0, 0.36], [0.12, 0.34], [0.4, 0.9], [0.55, 1], [0.82, 0.82], [0.95, 0.46], [1, 0.24]], dors: [0.4, 0.52], anal: [0.18, 0.38] }
  };
  /* aufrechter Fisch (Länge x, Kopf bei +x, Rücken +y, Flanke ±z) */
  function fishUp(b, F, pal) {
    const P = Object.assign({}, F, pal || {});
    const N = P.eel ? 18 : 12, M = 12, L = P.L, H = P.H;
    const bend = t => P.eel ? Math.sin(t * Math.PI * 2.2 + 0.5) * 0.09 : 0;
    const ring = i => {
      const t = i / N, hh = Math.max(0.004, H / 2 * lerpP(P.prof, t)), ww = hh * P.k * (P.wide && t > 0.7 ? 1 + (P.wide - 1) * (t - 0.7) / 0.3 : 1);
      return { t, x: (t - 0.5) * L, hh, ww, yc: bend(t) };
    };
    const R = []; for (let i = 0; i <= N; i++) R.push(ring(i));
    const colAt = (t, sn, j) => {
      let c = sn > 0.42 ? P.back : sn < -0.32 ? P.belly : P.side;
      if (P.stripe && Math.abs(sn) < 0.16 && t > 0.08 && t < 0.86) c = P.stripe;
      if (P.bars && sn > -0.25 && t > 0.12 && t < 0.78) { const k = (t - 0.12) / 0.66 * P.bars; if (k - Math.floor(k) < 0.42) c = sn > 0.42 ? cmix(P.barC, 0x000000, 0.2) : P.barC; }
      if (P.scales && sn > -0.3 && sn < 0.6 && ((Math.floor(t * 14) + j) % 2 === 0)) c = cmix(c, P.scales, 0.45);
      if (P.mott && ((Math.floor(t * 9) * 7 + j * 3) % 5 === 0) && sn > -0.3) c = P.mott;
      if (t > 0.79 && t < 0.83 && Math.abs(sn) < 0.75) c = cmix(sn > 0.42 ? P.back : P.side, 0x000000, 0.28);   /* Kiemendeckel */
      return c;
    };
    for (let i = 0; i < N; i++) {
      const A = R[i], B = R[i + 1];
      for (let j = 0; j < M; j++) {
        const a0 = j / M * Math.PI * 2, a1 = (j + 1) / M * Math.PI * 2;
        const p = (r, a) => [r.x, r.yc + Math.sin(a) * r.hh, Math.cos(a) * r.ww], n = (r, a) => { const v = [0, Math.sin(a) / r.hh, Math.cos(a) / r.ww], l = Math.hypot(v[1], v[2]) || 1; return [0, v[1] / l, v[2] / l]; };
        const c = colAt((A.t + B.t) / 2, Math.sin((a0 + a1) / 2), j);
        b.tri(p(A, a0), p(B, a0), p(B, a1), c, n(A, a0), n(B, a0), n(B, a1));
        b.tri(p(A, a0), p(B, a1), p(A, a1), c, n(A, a0), n(B, a1), n(A, a1));
      }
    }
    /* Schnauze (Hecht: lang und flach) */
    const E = R[N], nose = [E.x + L * (P.snout || 0.035), E.yc - E.hh * 0.15, 0];
    for (let j = 0; j < M; j++) {
      const a0 = j / M * Math.PI * 2, a1 = (j + 1) / M * Math.PI * 2;
      b.tri([E.x, E.yc + Math.sin(a0) * E.hh, Math.cos(a0) * E.ww], nose, [E.x, E.yc + Math.sin(a1) * E.hh, Math.cos(a1) * E.ww], Math.sin(a0) > 0.3 ? P.back : P.side);
    }
    /* Schwanzwurzel zu */
    const T0 = R[0];
    for (let j = 0; j < M; j++) { const a0 = j / M * Math.PI * 2, a1 = (j + 1) / M * Math.PI * 2; b.tri([T0.x, T0.yc, 0], [T0.x, T0.yc + Math.sin(a1) * T0.hh, Math.cos(a1) * T0.ww], [T0.x, T0.yc + Math.sin(a0) * T0.hh, Math.cos(a0) * T0.ww], P.side); }
    const fin2 = (a, c, d, col) => { b.tri(a, c, d, col); b.tri(a, d, c, col); };
    /* Schwanzflosse */
    const tx = T0.x, th = T0.hh, ty = T0.yc, tl = P.eel ? 0.07 : L * 0.2, ts = P.eel ? 0.05 : H * (P.round ? 0.5 : 0.56);
    if (P.round || P.eel) { fin2([tx, ty + th * 0.7, 0], [tx - tl, ty + ts, 0], [tx - tl * 1.15, ty, 0], P.tail); fin2([tx, ty - th * 0.7, 0], [tx - tl * 1.15, ty, 0], [tx - tl, ty - ts, 0], P.tail); fin2([tx, ty + th * 0.7, 0], [tx - tl * 1.15, ty, 0], [tx, ty - th * 0.7, 0], P.tail); }
    else { fin2([tx, ty + th * 0.8, 0], [tx - tl, ty + ts, 0], [tx - tl * 0.62, ty, 0], P.tail); fin2([tx, ty - th * 0.8, 0], [tx - tl * 0.62, ty, 0], [tx - tl, ty - ts, 0], P.tail); fin2([tx, ty + th * 0.8, 0], [tx - tl * 0.62, ty, 0], [tx, ty - th * 0.8, 0], P.tail); }
    /* Rücken- und Afterflosse entlang des Körpers */
    const top = t => { const r = ring(t * N); return [r.x, r.yc + r.hh * 0.96]; }, bot = t => { const r = ring(t * N); return [r.x, r.yc - r.hh * 0.96]; };
    const fin = (t0, t1, hgt, col, under, spiny) => {
      const steps = Math.max(2, Math.round((t1 - t0) * 16));
      for (let k = 0; k < steps; k++) {
        const u0 = t0 + (t1 - t0) * k / steps, u1 = t0 + (t1 - t0) * (k + 1) / steps, A = under ? bot(u0) : top(u0), B = under ? bot(u1) : top(u1);
        const f0 = Math.sin(Math.PI * (0.15 + 0.85 * k / steps)) * hgt * (spiny && k % 2 ? 0.7 : 1), f1 = Math.sin(Math.PI * (0.15 + 0.85 * (k + 1) / steps)) * hgt;
        const s = under ? -1 : 1;
        fin2([A[0], A[1], 0], [B[0], B[1], 0], [B[0] - 0.02, B[1] + s * f1, 0], col);
        fin2([A[0], A[1], 0], [B[0] - 0.02, B[1] + s * f1, 0], [A[0] - 0.02, A[1] + s * f0, 0], col);
      }
    };
    const fh = P.eel ? 0.035 : H * 0.32;
    if (P.spiny) { fin(P.dors[0] + (P.dors[1] - P.dors[0]) * 0.45, P.dors[1], fh * 1.05, P.fin, false, true); fin(P.dors[0], P.dors[0] + (P.dors[1] - P.dors[0]) * 0.42, fh * 0.8, P.fin); }
    else if (P.fspots) { fin(P.dors[0] + (P.dors[1] - P.dors[0]) * 0.5, P.dors[1], fh, P.fspots, false, true); fin(P.dors[0], P.dors[0] + (P.dors[1] - P.dors[0]) * 0.45, fh * 0.8, P.fin); }
    else fin(P.dors[0], P.dors[1], fh, P.fin);
    if (P.adipose) fin(0.2, 0.25, fh * 0.35, P.fin);
    fin(P.anal[0], P.anal[1], fh * (P.eel ? 1 : 0.7), P.low || P.fin, true);
    /* Brust- und Bauchflossen (flach an der Flanke) */
    if (!P.eel) [1, -1].forEach(sd => {
      const r1 = ring(0.72 * N), r2 = ring(0.5 * N);
      fin2([r1.x, r1.yc - r1.hh * 0.35, sd * r1.ww * 0.98], [r1.x - L * 0.13, r1.yc - r1.hh * 0.55, sd * r1.ww * 1.05], [r1.x - L * 0.1, r1.yc - r1.hh * 0.85, sd * r1.ww * 0.9], P.low || P.fin);
      fin2([r2.x, r2.yc - r2.hh * 0.85, sd * r2.ww * 0.7], [r2.x - L * 0.1, r2.yc - r2.hh * 0.95, sd * r2.ww * 0.8], [r2.x - L * 0.08, r2.yc - r2.hh * 1.15, sd * r2.ww * 0.5], P.low || P.fin);
    });
    /* Tupfen: Forelle dunkel, Hecht hell */
    if (P.spots || P.lspots) for (let k = 0; k < 16; k++) {
      const t = 0.15 + rnd() * 0.65, r = ring(t * N), a = 0.2 + rnd() * 1.1, sd = k % 2 ? 1 : -1;
      b.sphere(P.spots ? 0.012 : 0.016, 5, 3, P.spots || P.lspots, { x: r.x, y: r.yc + Math.sin(a) * r.hh * 0.98, z: sd * Math.cos(a) * r.ww * 0.98, sx: 1.4 });
    }
    /* Auge, Maul, Barteln */
    const re = ring(0.9 * N), ey = re.yc + re.hh * 0.28, ez = re.ww * 0.82, er = Math.max(0.018, H * (P.fspots ? 0.11 : 0.085));
    [1, -1].forEach(sd => {
      b.sphere(er, 8, 6, P.eyeR || P.eye || 0xf4f0e0, { x: re.x, y: ey, z: sd * ez, sz: 0.5 });
      b.sphere(er * 0.6, 8, 6, 0x101010, { x: re.x + 0.003, y: ey, z: sd * (ez + er * 0.2), sz: 0.5 });
    });
    b.box(L * 0.05, 0.008, Math.max(0.02, E.ww * 1.2), 0x2a2018, { x: E.x + L * 0.01, y: E.yc - E.hh * 0.3, c: true, rz: 0.15 });
    if (P.barbels) {
      const bl = P.barbels === 3 ? L * 0.32 : L * 0.06;
      [1, -1].forEach(sd => b.cyl(0.006, 0.003, bl, 4, P.back, { x: E.x + L * 0.02, y: E.yc - E.hh * 0.25, z: sd * E.ww * 0.6, rz: Math.PI / 2 + 0.6, ry: sd * 0.5 }));
      if (P.barbels === 3) [1, -1].forEach(sd => b.cyl(0.004, 0.002, L * 0.08, 4, P.belly, { x: E.x, y: E.yc - E.hh * 0.6, z: sd * E.ww * 0.3, rz: Math.PI * 0.85 }));
    }
    return Math.max(...R.map(r => r.ww)) * (P.wide || 1);
  }
  /* liegender Fisch (Flanke nach oben) */
  function fishLie(b, id, o, pal) {
    const F = FISH[id] || FISH.forelle, tmp = new MB(), w = fishUp(tmp, F, pal);
    /* merge kennt keine äußere Lage – also in zwei Schritten: hinlegen, dann an den Platz */
    const lay = new MB().merge(tmp, { rx: -Math.PI / 2, y: w });
    b.merge(lay, o || {});
    return b;
  }
  const PAPER = 0xf4efe2, BOARD = 0xc9955a;
  const lemon = (b, x, z, y) => { b.sphere(0.07, 8, 5, 0xf2d43a, { x, y: (y || 0) + 0.035, z, sy: 0.55, sz: 0.7 }); b.box(0.12, 0.004, 0.01, 0xfff6c0, { x, y: (y || 0) + 0.07, z }); };
  const herbs = (b, x, z, y, n) => { for (let i = 0; i < (n || 4); i++) b.ico(0.028, i % 2 ? 0x3f8a2a : 0x5aa83a, { x: x + (rnd() - 0.5) * 0.12, y: (y || 0) + 0.03, z: z + (rnd() - 0.5) * 0.12, jitter: 0.4 }); };
  const dish = (b, r, col, o) => { b.at(o || {}, m => { m.cyl(r * 0.78, r, 0.05, 18, col || 0xf6f6f2, { smooth: true, top: cmix(col || 0xf6f6f2, 0xffffff, 0.3) }); m.cyl(r * 0.7, r * 0.7, 0.002, 18, cmix(col || 0xf6f6f2, 0x000000, 0.06), { y: 0.05 }); }); };
  /* Filet: flaches, spitz zulaufendes Stück; Haut am Rand */
  const filet = (b, x, z, ry, meat, skin, len) => b.at({ x, z, ry }, m => {
    const l = len || 0.5;
    m.sphere(0.1, 10, 6, meat, { sx: l / 0.2, sy: 0.32, y: 0.03, smooth: true, bottom: skin });
    for (let k = 0; k < 4; k++) m.box(0.006, 0.004, 0.11, cmix(meat, 0xffffff, 0.35), { x: -l * 0.3 + k * l * 0.18, y: 0.062, ry: 0.5 });
  });
  function tin(b, x, z, ry, y, label, open) {
    b.at({ x, z, ry, y: y || 0 }, m => {
      m.box(0.36, 0.08, 0.22, 0xc8ccd0, { top: open ? 0x9aa0a6 : 0xd8dce0 });
      m.box(0.362, 0.05, 0.222, label, { y: 0.015 });
      m.box(0.12, 0.052, 0.224, 0xf6f1e4, { y: 0.014, x: 0.06 });
      if (open) { m.box(0.32, 0.01, 0.18, 0xd89a6a, { y: 0.075 }); for (let k = 0; k < 4; k++) m.box(0.07, 0.02, 0.16, k % 2 ? 0xe8b08a : 0xc8885a, { x: -0.12 + k * 0.08, y: 0.08 }); m.box(0.36, 0.006, 0.22, 0xd8dce0, { y: 0.11, z: -0.13, rx: -1.2 }); }
      else m.cyl(0.03, 0.03, 0.012, 8, 0xb0b4b8, { y: 0.08, x: -0.13 });
    });
  }
  /* v59: Berts Spezialköder – offene Köderdose, Etikett und Lockteig in den Farben
     der Art, davor die Art in klein, damit man sie auf einen Blick erkennt */
  function specBait(b, sp) {
    const F = FISH[sp], paste = cmix(F.side, 0x7a4a2a, 0.35);
    b.at({ x: 0.16, z: -0.12, s: 0.85 }, m => {
      m.cyl(0.15, 0.15, 0.2, 14, 0x9aa0a6, { smooth: true, top: 0x5a4030 });
      m.cyl(0.152, 0.152, 0.1, 14, F.side, { y: 0.05 });
      m.cyl(0.153, 0.153, 0.02, 14, F.back, { y: 0.15 });
      m.cyl(0.035, 0.035, 0.01, 10, 0xd8332b, { rx: Math.PI / 2, y: 0.1, z: 0.152 });
      for (let k = 0; k < 6; k++) m.ico(0.04, k % 2 ? paste : cmix(paste, 0xffffff, 0.25), { x: (rnd() - 0.5) * 0.16, y: 0.21, z: (rnd() - 0.5) * 0.16, jitter: 0.4 });
    });
    fishLie(b, sp, { x: -0.04, z: 0.16, ry: 0.25, s: 0.5 });
    return b;
  }
  function fishItem(id) {
    G3.seed(7300 + id.length * 31 + id.charCodeAt(0) * 7 + id.charCodeAt(id.length - 1));
    const b = new MB();
    if (FISH[id]) return fishLie(b, id);
    if (id.startsWith("sk_") && FISH[id.slice(3)]) return specBait(b, id.slice(3));
    switch (id) {
      case "abfall":   /* Eimer mit Gräten und Köpfen */
        b.cyl(0.22, 0.27, 0.42, 14, 0x9aa4ac, { smooth: true, top: 0x5a5048 });
        b.cyl(0.275, 0.275, 0.03, 14, 0x7a848c, { y: 0.4 });
        for (let k = 0; k < 2; k++) b.box(0.01, 0.01, 0.5, 0x6a7078, { y: 0.42 + k * 0.001, rx: 0.9 - k * 1.8, z: 0 });
        b.at({ y: 0.44, x: -0.02, rz: 0.4 }, m => { m.box(0.32, 0.018, 0.018, 0xf2ecdc); for (let k = 0; k < 6; k++) m.box(0.012, 0.012, 0.12, 0xf2ecdc, { x: -0.12 + k * 0.05 }); });
        { const t = new MB(); fishUp(t, FISH.barsch); b.merge(new MB().merge(t, { x: -0.3, rx: -0.6 }), { x: 0.08, y: 0.42, z: 0.06, ry: 0.5, s: 0.32 }); }
        b.sphere(0.06, 6, 4, 0x8a6a5a, { x: -0.08, y: 0.43, z: -0.06, sy: 0.6 });
        return b;
      case "koeder":   /* Dose Reusenköder */
        b.cyl(0.16, 0.16, 0.26, 14, 0xc89a3a, { smooth: true, top: 0x6a4a2a });
        b.cyl(0.165, 0.165, 0.12, 14, 0x2f6a3a, { y: 0.07 });
        b.box(0.12, 0.08, 0.01, 0xf6f1e4, { y: 0.09, z: 0.16 });
        for (let k = 0; k < 7; k++) b.ico(0.035, k % 2 ? 0x7a4a2a : 0x9a6038, { x: (rnd() - 0.5) * 0.18, y: 0.27, z: (rnd() - 0.5) * 0.18, jitter: 0.5 });
        b.cyl(0.17, 0.17, 0.02, 14, 0xd8b048, { x: 0.25, y: 0.02, rz: 0.15 });
        return b;
      case "wurm":     /* Dose mit Erde und Tauwürmern */
        b.cyl(0.17, 0.17, 0.22, 14, 0xa8aeb4, { smooth: true, top: 0x4a3424 });
        for (let k = 0; k < 3; k++) b.cyl(0.172, 0.172, 0.012, 14, 0x8a9096, { y: 0.04 + k * 0.07 });
        for (let w = 0; w < 3; w++) {
          let x = (rnd() - 0.5) * 0.12, z = (rnd() - 0.5) * 0.12, y = 0.23, a = rnd() * 6;
          for (let k = 0; k < 9; k++) { b.sphere(0.022, 6, 4, k === 2 ? 0xc86a6a : 0xd88a84, { x, y, z, smooth: true }); a += 0.7 * (w % 2 ? 1 : -1); x += Math.cos(a) * 0.028; z += Math.sin(a) * 0.028; y += k < 4 ? 0.022 : -0.012; }
        }
        return b;
      case "profikoeder":   /* Wobbler: bunter Kunstköder mit Drillingen */
        b.at({ y: 0.08, rz: 0.15 }, m => {
          m.sphere(0.07, 10, 6, 0xf2c230, { sx: 2.6, smooth: true, bottom: 0xf6f1e4 });
          for (let k = 0; k < 3; k++) m.box(0.03, 0.06, 0.142, 0xd8332b, { x: -0.06 + k * 0.06, y: 0.01, c: true });
          m.box(0.08, 0.012, 0.06, 0x9cc8dc, { x: 0.2, y: -0.03, rz: -0.5 });
          [1, -1].forEach(s => m.sphere(0.018, 6, 4, 0x111111, { x: 0.13, y: 0.02, z: s * 0.05 }));
          [-0.08, 0.08].forEach(x => { m.box(0.004, 0.08, 0.004, 0xb0b4b8, { x, y: -0.13 }); [0, 2.1, 4.2].forEach(a => m.box(0.004, 0.004, 0.035, 0xb0b4b8, { x, y: -0.12, ry: a })); });
          m.cyl(0.012, 0.012, 0.03, 6, 0xb0b4b8, { x: 0.18, y: 0.04, rz: Math.PI / 2 });
        });
        for (let k = 0; k < 4; k++) b.box(0.02, 0.02, 0.02, 0xfff6a0, { x: (rnd() - 0.5) * 0.4, y: 0.22 + rnd() * 0.1, z: (rnd() - 0.5) * 0.2, ry: 0.78, rx: 0.78 });
        return b;
      case "barschfilet": {
        /* v58: Barsch auf dem Holzbrett – rosiges Fleisch, grün-goldene Haut mit dunklen Querstreifen */
        const meat = 0xeeb3a2, skin = 0x7a8a3a;
        b.box(0.76, 0.05, 0.5, 0xb88450, { top: 0xc9955a });
        b.at({ y: 0.05 }, m => {
          [[-0.02, -0.09, 0.15, 0.52], [0.04, 0.1, -0.12, 0.48]].forEach(([x, z, ry, l]) => {
            filet(m, x, z, ry, meat, skin, l);
            /* Hautstreifen sichtbar an der Kante, mit den Barsch-Binden */
            m.at({ x, z, ry }, k => { k.box(l * 0.95, 0.02, 0.03, skin, { y: 0.02, z: 0.085 }); for (let s = 0; s < 4; s++) k.box(0.035, 0.024, 0.034, 0x2e3a1e, { x: -l * 0.3 + s * l * 0.2, y: 0.022, z: 0.086 }); });
          });
          lemon(m, 0.29, 0.17, 0.03); herbs(m, -0.27, 0.15, 0.03, 3);
        });
        return b;
      }
      case "zanderfilet": {
        /* v58: Zander auf dunkler Schale – fast weißes Fleisch, silbergraue Haut, Zitronenscheiben */
        const meat = 0xf8f2ea, skin = 0x9aa4a8;
        b.box(0.74, 0.06, 0.48, 0x2e3a40, { top: 0x37454c });
        b.box(0.66, 0.01, 0.4, 0x24302a, { y: 0.06 });
        b.at({ y: 0.04 }, m => {
          [[-0.02, -0.08, 0.15, 0.56], [0.04, 0.1, -0.12, 0.5]].forEach(([x, z, ry, l]) => {
            filet(m, x, z, ry, meat, skin, l);
            m.at({ x, z, ry }, k => k.box(l * 0.95, 0.02, 0.03, skin, { y: 0.02, z: 0.085 }));
          });
          [0.24, 0.3].forEach((x, i) => m.cyl(0.055, 0.055, 0.012, 10, 0xf6dc4a, { x, y: 0.035 + i * 0.006, z: 0.16 - i * 0.03, top: 0xfff2a0 }));
          herbs(m, -0.27, 0.15, 0.03, 3);
        });
        return b;
      }
      case "forellenfilet": {
        const meat = 0xf2946e, skin = 0x8a8a6a;
        /* dunkle Schale, damit die hellen Filets leuchten */
        b.box(0.74, 0.06, 0.48, 0x2e3a40, { top: 0x37454c });
        b.box(0.66, 0.01, 0.4, 0x24302a, { y: 0.06 });
        b.at({ y: 0.04 }, m => {
          filet(m, -0.02, -0.08, 0.15, meat, skin, 0.52); filet(m, 0.04, 0.1, -0.12, meat, skin, 0.48);
          lemon(m, 0.28, 0.16, 0.03); herbs(m, -0.26, 0.14, 0.03, 3);
        });
        return b;
      }
      case "karpfenblau":   /* Karpfen blau: blau gekocht auf dem Teller */
        dish(b, 0.5);
        fishLie(b, "karpfen", { y: 0.05, s: 0.82 }, { back: 0x4a6a8c, side: 0x7a96b4, belly: 0xc8d4e0, fin: 0x5a6a80, tail: 0x5a6a80, scales: 0x6a86a8 });
        lemon(b, 0.32, 0.22, 0.05); lemon(b, -0.3, 0.24, 0.05); herbs(b, 0.0, 0.3, 0.05, 5);
        return b;
      case "raeucherforelle":   /* goldbraun geräuchert auf dem Brett */
        b.box(0.98, 0.05, 0.44, BOARD, { top: 0xd8a868 });
        fishLie(b, "forelle", { y: 0.05, s: 0.86 }, { back: 0x5a2e14, side: 0xc8822a, belly: 0xe8b060, fin: 0x7a4a24, tail: 0x7a4a24, stripe: 0xd8902e, spots: 0x4a2410 });
        herbs(b, 0.36, 0.14, 0.05, 3);
        return b;
      case "raeucheraal":   /* Aalstücke auf Papier */
        b.box(0.8, 0.02, 0.44, PAPER, { top: 0xfaf6ea, ry: 0.1 });
        for (let k = 0; k < 3; k++) b.at({ x: -0.22 + k * 0.22, z: (k - 1) * 0.06, y: 0.07, ry: 0.15 * (k - 1) }, m => {
          m.cyl(0.06, 0.06, 0.18, 10, 0x8a5a24, { rz: Math.PI / 2, x: 0.09, smooth: true, top: 0xf0d8a8 });
          m.box(0.18, 0.012, 0.03, 0x3a2a14, { y: 0.055 });
        });
        lemon(b, 0.3, 0.16, 0.02);
        return b;
      case "fischplatte":
        b.cyl(0.42, 0.48, 0.05, 20, 0xf6f6f2, { sz: 0.7, smooth: true, top: 0xfafaf6 });
        filet(b, -0.18, -0.08, 0.3, 0xf2946e, 0x8a8a6a, 0.34); filet(b, 0.08, -0.12, -0.2, 0xf6e6da, 0x7a8a4a, 0.3);
        b.at({ x: 0.14, z: 0.12, y: 0.05 }, m => { m.cyl(0.05, 0.05, 0.12, 10, 0x8a5a24, { rz: Math.PI / 2, x: 0.06, top: 0xf0d8a8 }); m.cyl(0.05, 0.05, 0.12, 10, 0x8a5a24, { rz: Math.PI / 2, x: -0.08, top: 0xf0d8a8 }); });
        b.cyl(0.07, 0.06, 0.05, 10, 0xf6f6f2, { x: -0.22, z: 0.14, y: 0.04, top: 0xf0f0e0 });
        lemon(b, 0.3, -0.02, 0.05); herbs(b, -0.05, 0.1, 0.05, 6);
        return b;
      case "konserve":   /* drei Fischdosen, eine offen */
        tin(b, -0.04, -0.1, 0.1, 0, 0x2f6fb0); tin(b, 0.02, -0.08, -0.05, 0.08, 0xd8332b); tin(b, 0.06, 0.16, 0.25, 0, 0x2f8a4a, true);
        return b;
      case "fischkiste":   /* Styroporkiste mit Eis und Fischen */
        b.box(0.86, 0.26, 0.56, 0xf4f6f8, { top: 0xffffff });
        b.box(0.78, 0.01, 0.48, 0xdcecf4, { y: 0.24 });
        for (let k = 0; k < 14; k++) b.ico(0.035, 0xeaf6fc, { x: (rnd() - 0.5) * 0.7, y: 0.25, z: (rnd() - 0.5) * 0.4, jitter: 0.5 });
        fishLie(b, "forelle", { y: 0.24, z: -0.1, s: 0.66, ry: 0.06 }); fishLie(b, "barsch", { y: 0.25, z: 0.1, x: 0.04, s: 0.6, ry: -0.08 });
        b.box(0.2, 0.08, 0.01, 0x2f6fb0, { y: 0.08, z: 0.285 });
        return b;
      case "edelbox":   /* dunkle Holzbox mit Goldrand, offen: Zander auf Eis */
        b.box(0.84, 0.2, 0.52, 0x3a2418, { top: 0x2a1810 });
        b.box(0.86, 0.025, 0.54, 0xd8b048, { y: 0.19 });
        b.box(0.76, 0.01, 0.44, 0xe6f2f8, { y: 0.2 });
        for (let k = 0; k < 10; k++) b.ico(0.03, 0xf0f8fc, { x: (rnd() - 0.5) * 0.66, y: 0.21, z: (rnd() - 0.5) * 0.36, jitter: 0.5 });
        fishLie(b, "zander", { y: 0.2, s: 0.6, x: -0.02 });
        b.box(0.84, 0.05, 0.52, 0x3a2418, { y: 0.2, z: -0.27, rx: -1.25, top: 0x4a2e20 });
        b.box(0.06, 0.005, 0.52, 0xd8332b, { y: 0.215, x: 0.3 });
        return b;
      case "hechtkloesse":   /* Schüssel mit Hechtklößchen in heller Soße */
        b.cyl(0.24, 0.36, 0.2, 18, 0xf6f6f2, { smooth: true, top: 0xf2e8c8 });
        b.cyl(0.34, 0.34, 0.01, 18, 0xf0e2b4, { y: 0.18 });
        [[-0.1, -0.06], [0.1, -0.08], [0, 0.1], [0.14, 0.12], [-0.13, 0.12]].forEach(([x, z]) => b.sphere(0.08, 10, 6, 0xf2ead2, { x, z, y: 0.2, sx: 1.3, sy: 0.75, smooth: true }));
        herbs(b, 0, 0, 0.24, 6);
        return b;
      case "fischbroetchen":   /* Brötchen mit Fisch, Zwiebel und Salat */
        b.sphere(0.2, 12, 6, 0xd89a4a, { sx: 1.5, sy: 0.4, smooth: true, bottom: 0xf0d8a0 });
        b.at({ y: 0.06 }, m => {
          m.box(0.58, 0.02, 0.3, 0x5ab83a, { ry: 0.05 });
          m.sphere(0.12, 10, 5, 0xc8ccd4, { sx: 2.2, sy: 0.35, y: 0.04, smooth: true, bottom: 0xf4e6da });
          [-0.1, 0.06, 0.18].forEach(x => m.cyl(0.05, 0.05, 0.012, 10, 0xf6f2f8, { x, y: 0.08, z: 0.04 }));
        });
        b.sphere(0.2, 12, 6, 0xc8822a, { sx: 1.45, sy: 0.55, y: 0.17, smooth: true, bottom: 0xf0d8a0 });
        for (let k = 0; k < 7; k++) b.box(0.02, 0.006, 0.012, 0xf6f1e4, { x: (rnd() - 0.5) * 0.4, y: 0.27, z: (rnd() - 0.5) * 0.18, ry: rnd() * 3 });
        return b;
      case "muschel":   /* drei Teichmuscheln, eine offen */
        [[-0.16, -0.06, 0.4, 0], [0.12, -0.1, -0.3, 0], [0.02, 0.14, 0.1, 1]].forEach(([x, z, ry, open]) => b.at({ x, z, ry }, m => {
          m.sphere(0.1, 10, 6, 0x5a5a2e, { sx: 1.9, sy: 0.32, y: 0.03, smooth: true, bottom: 0x4a4a28 });
          for (let k = 1; k < 4; k++) m.sphere(0.1 - k * 0.022, 10, 4, k % 2 ? 0x6e6a38 : 0x52502a, { sx: 1.9, sy: 0.32, y: 0.035 + k * 0.004, x: -0.04 * k, smooth: true });
          if (open) { m.sphere(0.1, 10, 6, 0x4a4a28, { sx: 1.9, sy: 0.3, y: 0.1, rz: -0.5, x: -0.04, smooth: true, bottom: 0xd8d0e8 }); m.sphere(0.07, 8, 4, 0xf0a060, { sx: 1.8, sy: 0.3, y: 0.06, smooth: true }); }
        }));
        return b;
      case "krabbe": {   /* Wollhandkrabbe: breiter Panzer, Beine wie Speichen, pelzige Scheren */
        const limb = (p0, p1, r, col) => {
          const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], h = Math.hypot(dx, dz), l = Math.hypot(h, dy);
          b.at({ x: p0[0], y: p0[1], z: p0[2], ry: Math.atan2(-dz, dx) }, m => m.at({ rz: Math.atan2(dy, h) - Math.PI / 2 }, q => q.cyl(r, r * 0.8, l, 5, col)));
        };
        const C1 = 0x6e5a30, C2 = 0x5a4826;
        b.sphere(0.17, 12, 6, C1, { y: 0.1, sx: 0.95, sz: 1.2, sy: 0.42, smooth: true, bottom: 0xd8c890 });
        b.box(0.04, 0.01, 0.2, C2, { x: 0.04, y: 0.17 }); b.box(0.12, 0.01, 0.03, C2, { x: -0.02, y: 0.17 });
        [1, -1].forEach(sd => {
          for (let k = 0; k < 4; k++) {
            const a = (-0.55 + k * 0.42) * (sd > 0 ? 1 : 1), bx = Math.sin(a) * 0.14 - 0.02, bz = sd * Math.cos(a) * 0.17;
            const kx = bx + Math.sin(a) * 0.13, kz = bz + sd * Math.cos(a) * 0.13, fx = kx + Math.sin(a) * 0.1, fz = kz + sd * Math.cos(a) * 0.1;
            limb([bx, 0.1, bz], [kx, 0.16, kz], 0.022, C2); limb([kx, 0.16, kz], [fx, 0.0, fz], 0.018, C1);
          }
          /* Scheren nach vorn, mit dunklem „Fell“ */
          limb([0.12, 0.1, sd * 0.1], [0.24, 0.13, sd * 0.2], 0.03, C2);
          b.sphere(0.07, 9, 6, 0x2e2418, { x: 0.3, y: 0.13, z: sd * 0.2, sx: 1.3, smooth: true });
          b.box(0.1, 0.03, 0.03, 0xe0d0a0, { x: 0.38, y: 0.12, z: sd * 0.17, ry: sd * 0.3, c: true });
          b.box(0.08, 0.026, 0.026, 0xe0d0a0, { x: 0.37, y: 0.12, z: sd * 0.23, ry: -sd * 0.2, c: true });
          b.sphere(0.02, 6, 4, 0x111111, { x: 0.15, z: sd * 0.05, y: 0.17 });
        });
        return b;
      }
      case "krebs":   /* Edelkrebs: Panzer, Schwanz, große Scheren, Fühler */
        b.at({ y: 0.06 }, m => {
          m.sphere(0.1, 10, 6, 0x5a2e1e, { sx: 1.7, sy: 0.6, smooth: true, bottom: 0xa8583a });
          for (let k = 0; k < 5; k++) m.sphere(0.075 - k * 0.008, 10, 5, k % 2 ? 0x6a3622 : 0x5a2e1e, { x: -0.2 - k * 0.07, sx: 0.7, sy: 0.55, smooth: true, bottom: 0xa8583a });
          [1, -1].forEach(sd => {
            m.cyl(0.04, 0.0, 0.07, 4, 0x6a3622, { x: -0.56, z: sd * 0.03, rz: Math.PI / 2, sz: 0.3 });
            m.at({ x: 0.14, z: sd * 0.06, ry: sd * 0.45 }, q => { q.box(0.18, 0.035, 0.035, 0x5a2e1e, { x: 0.09, c: true }); q.sphere(0.06, 8, 5, 0x6a3622, { x: 0.25, sx: 1.8, sy: 0.55, smooth: true, bottom: 0xc84a2a }); q.box(0.1, 0.02, 0.02, 0x5a2e1e, { x: 0.37, z: sd * 0.02, c: true }); });
            for (let k = 0; k < 4; k++) m.box(0.02, 0.02, 0.16, 0x5a2e1e, { x: -0.05 - k * 0.05, z: sd * 0.1, y: -0.02, ry: sd * (0.3 - k * 0.2), rx: sd * 0.3, c: true });
            m.cyl(0.004, 0.002, 0.5, 4, 0x8a4a2a, { x: 0.17, z: sd * 0.03, y: 0.02, rz: -Math.PI / 2 + 0.25, ry: sd * 0.35 });
            m.sphere(0.016, 6, 4, 0x111111, { x: 0.17, z: sd * 0.035, y: 0.04 });
          });
        });
        return b;
    }
    return null;
  }

  /* v59: Berts alter Kombi – älterer Kombi mit langem Dach, Chromstoßstangen,
     Rundscheinwerfern und Dachreling. Erinnert nur an einen Mercedes, kein Logo
     (vorn nur eine schlichte runde Plakette). Länge entlang z, vorn = +z. */
  function bertCar() {
    G3.seed(731);
    const b = new MB();
    const P = 0x2f5a46, PD = 0x234536, CH = 0xc9ced3, CHD = 0x8f959b, TY = 0x1d1d20, GL = 0x8fb8cc, IN = 0x3a3330;
    /* im Maßstab der anderen Fahrzeuge (etwa 2,4 lang) */
    b.at({ s: 0.62 }, () => {
      /* Räder mit Chrom-Radkappen */
      [[0.74, 1.15], [-0.74, 1.15], [0.74, -1.2], [-0.74, -1.2]].forEach(([x, z]) => b.at({ x, y: 0.3, z }, () => {
        b.cyl(0.3, 0.3, 0.2, 12, TY, { rz: Math.PI / 2, x: 0.1 * Math.sign(x), top: 0x3a3a3e });
        b.cyl(0.16, 0.16, 0.21, 10, CH, { rz: Math.PI / 2, x: 0.105 * Math.sign(x), top: CH });
      }));
      /* Unterbau, Radläufe dunkel */
      b.box(1.56, 0.5, 3.7, P, { y: 0.28 });
      b.box(1.58, 0.06, 3.72, PD, { y: 0.26 });
      [[1.15], [-1.2]].forEach(([z]) => { b.box(1.6, 0.12, 0.74, PD, { y: 0.58, z }); });
      /* Motorhaube, leicht abfallend, mit Längssicke */
      b.box(1.5, 0.1, 1.05, P, { y: 0.78, z: 1.28, rx: 0.06 });
      b.box(0.04, 0.02, 1.0, PD, { y: 0.885, z: 1.28, rx: 0.06 });
      /* langer Aufbau bis ganz hinten (Kombi) */
      b.box(1.46, 0.08, 2.55, P, { y: 0.78, z: -0.52 });
      b.box(1.4, 0.48, 2.45, GL, { y: 0.86, z: -0.55 });
      /* Säulen und Dach */
      [[0.66], [-0.66]].forEach(([x]) => {
        b.box(0.08, 0.5, 0.1, P, { x, y: 0.85, z: 0.66, rx: -0.42 });
        b.box(0.08, 0.48, 0.1, P, { x, y: 0.86, z: -0.1 });
        b.box(0.08, 0.48, 0.12, P, { x, y: 0.86, z: -0.95 });
        b.box(0.1, 0.48, 0.14, P, { x, y: 0.86, z: -1.72 });
      });
      b.box(1.46, 0.08, 2.6, P, { y: 1.33, z: -0.5 });
      /* Frontscheibe schräg, Heckklappe senkrecht */
      b.box(1.3, 0.5, 0.04, GL, { y: 0.84, z: 0.72, rx: -0.42 });
      b.box(1.34, 0.42, 0.04, GL, { y: 0.88, z: -1.79 });
      b.box(1.46, 0.36, 0.06, P, { y: 0.42, z: -1.82 });
      /* Innenraum durch die Scheiben: dunkle Sitze */
      b.box(1.2, 0.3, 0.4, IN, { y: 0.8, z: 0.15 });
      b.box(1.2, 0.3, 0.4, IN, { y: 0.8, z: -0.6 });
      /* Dachreling mit Stützen, darauf eine Angelrute */
      [[0.6], [-0.6]].forEach(([x]) => {
        b.box(0.04, 0.04, 2.3, CH, { x, y: 1.47, z: -0.5 });
        [0.55, -1.55].forEach(z => b.box(0.05, 0.08, 0.06, CHD, { x, y: 1.41, z }));
      });
      b.box(0.03, 0.03, 2.9, 0x6b4a2b, { x: 0.35, y: 1.52, z: -0.3 });
      b.box(0.08, 0.08, 0.1, 0x2b2b30, { x: 0.35, y: 1.5, z: -1.55 });
      /* Chromstoßstangen vorn und hinten */
      b.box(1.66, 0.13, 0.12, CH, { y: 0.34, z: 1.88 });
      b.box(1.66, 0.13, 0.12, CH, { y: 0.34, z: -1.9 });
      b.box(0.12, 0.13, 0.3, CH, { x: 0.78, y: 0.34, z: 1.76 }); b.box(0.12, 0.13, 0.3, CH, { x: -0.78, y: 0.34, z: 1.76 });
      /* Kühlergrill hochkant mit Chromrahmen, Plakette als schlichte Scheibe */
      b.box(0.5, 0.3, 0.05, CH, { y: 0.48, z: 1.83 });
      b.box(0.42, 0.24, 0.05, 0x2a2c30, { y: 0.51, z: 1.845 });
      for (let i = -2; i <= 2; i++) b.box(0.02, 0.22, 0.02, CHD, { x: i * 0.08, y: 0.52, z: 1.87 });
      b.cyl(0.06, 0.06, 0.03, 10, CH, { rx: Math.PI / 2, y: 0.85, z: 1.82 });
      /* Rundscheinwerfer mit Chromring, Blinker */
      [[0.52], [-0.52]].forEach(([x]) => {
        b.cyl(0.13, 0.13, 0.04, 12, CH, { rx: Math.PI / 2, x, y: 0.55, z: 1.84 });
        b.cyl(0.1, 0.1, 0.05, 12, 0xfff3c4, { rx: Math.PI / 2, x, y: 0.55, z: 1.85 });
        b.box(0.14, 0.06, 0.04, 0xf2a03a, { x: x * 1.38, y: 0.43, z: 1.84 });
      });
      /* Rückleuchten, Kennzeichen hell ohne Schrift */
      b.box(0.2, 0.26, 0.04, 0xb8322a, { x: 0.62, y: 0.5, z: -1.86 }); b.box(0.2, 0.26, 0.04, 0xb8322a, { x: -0.62, y: 0.5, z: -1.86 });
      b.box(0.5, 0.12, 0.03, 0xeeeeea, { y: 0.48, z: -1.87 });
      b.box(0.5, 0.12, 0.03, 0xeeeeea, { y: 0.3, z: 1.95 });
      /* Zierleiste und Türgriffe */
      [[0.79], [-0.79]].forEach(([x]) => {
        b.box(0.02, 0.04, 3.3, CH, { x, y: 0.55, z: 0 });
        b.box(0.02, 0.4, 0.02, PD, { x, y: 0.36, z: 0.3 });
        b.box(0.02, 0.4, 0.02, PD, { x, y: 0.36, z: -0.55 });
        [0.2, -0.65].forEach(z => b.box(0.03, 0.03, 0.12, CH, { x: x * 1.01, y: 0.68, z }));
        b.box(0.05, 0.08, 0.1, PD, { x: x * 1.05, y: 0.82, z: 0.55 });
      });
    });
    return b;
  }

  return {
    bertCar,
    K, WY, KAI_Z, ring, bollard, crate,
    fhouse, kuehl, speicher, fishhalle, smoke, SMOKE_CHIMNEY, feedk, deli, smith, SMITH_CHIMNEY,
    kutterPier, kutterBoat, steg, angler, rod, rodIcon, groundIcon, ROD_TIP, bobber, lineSeg,
    potFrame, potEmpty, potBuoy, potFull, mlineBase, mlineFruit, netPen, netWater, trout, fishSchool, fishCrate,
    gullBody, gullWing, gullSit,
    coastLand, quay, beach, surf, sea, mole, lighthouse, LIGHT_TOP, teepott, strandkorb, dune, townHouse, warehouse, ferry, channelBuoy, picket,
    anker, fischkisten, rettungsring, bojen, strandhafer, netzgestell, moewenpfahl, fahnenmast, leuchtboje, jolle,
    FISH, fishUp, fishLie, fishItem
  };
})();
