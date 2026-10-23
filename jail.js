/* =========================================================================
   LOGISTIKA – Haftzelle (v114)
   Warte- und Ladebild für die 14 Tage Haft: eine kleine 3D-Zelle mit eigener Engine-Szene (gl3d.js, nicht Three.js).
   Die Figur des Spielers sitzt im oberen Bett eines Doppelstockbetts (Hautfarbe, Haarfarbe und Bart kommen aus dem Charakter).
   Damit es nicht langweilig wird: die Figur seufzt, schaut sich um, streckt sich und winkt; eine Ratte (Hubert) holt Krümel;
   der Wasserhahn tropft; Staub tanzt im Lichtstrahl (echter Schatten der Gitterstäbe auf dem Boden); ab und zu fliegt ein Vogel am
   Fenster vorbei und ein Wärter läuft draußen am Gitter entlang. Antippen: Figur, Ratte, Hahn, Fenster.
   Der Fortschritt steht dreifach da: Balken, 14 Kalenderfelder (abgehakt) und Strichliste an der Wand (je Tag ein Strich).
   API:  JAIL3D.open(host, { days, who })  → Steuerung oder null (kein WebGL 2)
         ctl.update({ k, money, jobs })  k = 0…1     ctl.finish(cb)  Tür auf, Blitz, dann cb     ctl.close()
   ========================================================================= */
"use strict";

const JAIL3D = (() => {
  const MB = G3.MB, PI = Math.PI;
  const WH = 1.85, X0 = -1.7, X1 = 1.7, Z0 = -1.3, Z1 = 1.3;           /* Zelle: Wandhöhe, Grundriss */
  const UM = 0.92, LM = 0.38;                                           /* Matratzenoberkante oben / unten */
  const BUNK = { x0: -1.25, x1: 0.05, z0: -1.25, z1: -0.68 };
  const WIN = { z0: -0.25, z1: 0.4, y0: 1.0, y1: 1.5 };               /* Fenster in der linken Wand (x = X0) */
  const SEAT = { x: -0.3, z: -0.93, ry: 0.35 };                          /* Hüfte auf der Matratze, Knie an der Bettkante, Blick leicht zur Kamera */
  const SIT_Y = UM + 0.115;                                              /* Oberkante Hüfte: Oberschenkel liegen flach auf Decke (Matratze + Decke 0,012) */
  const LIGHT = [0.7, -0.45, -0.55];                                   /* Richtung des Lichts durchs Fenster: schräg über das Bett */
  /* Weg eines Strahls vom Fenster bis Boden oder Rückwand (Parameter t) */
  const rayLen = (y, z) => Math.min((y - 0.035) / -LIGHT[1], (z - (Z0 + 0.01)) / -LIGHT[2]);
  const WALL_T = 0.12;
  const TALLY = { x: 0.12, y: 1.2, w: 0.62 };                          /* Strichliste an der Rückwand */
  const ORANGE = 0xe8731a;
  const TIPS = [
    "Manchmal sind die besten Ideen in schwierigen Zeiten geboren.",
    "Fixkosten und Löhne laufen auch hinter Gittern weiter.",
    "Büros mit Personal arbeiten ohne dich weiter.",
    "Nach der Haft: Kunden vorher genau ansehen – nicht jeder Käufer ist echt.",
    "Die Ratte heißt Hubert. Sie ist die Einzige, die dich besucht. Tipp sie an.",
    "Der Kantinenkaffee schmeckt nach … Kaffee. Fast.",
    "Tipp: Tippe auf den Wasserhahn, das Fenster oder auf dich selbst.",
    "Jeder Strich an der Wand ist ein Tag weniger.",
    "Hofgang um drei. Danach wieder Warten."
  ];
  const SAY = { man: ["Alles gut.", "Nur noch ein paar Tage …", "Ich vermisse die Lieferungen.", "Hallo?", "Das war's wert. Fast."], rat: ["Hubert!", "Quiek!", "Krümel!"], tap: ["Tropf.", "Tropf, tropf …", "Der Hahn tropft."], win: ["Freiheit …", "Schöner Tag draußen.", "Ein Vogel!"] };

  const hex = c => typeof c === "number" ? c : parseInt(String(c).replace("#", ""), 16);
  const mixc = (a, b, t) => { const A = G3.col(a), B = G3.col(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };

  /* ------------------------------- Aussehen -------------------------------- */
  function look() {
    const L = { skin: 0xf2c9a0, hair: 0x6a4124, hs: "buzz", beard: 0, seed: 11 };
    try {
      const a = S.player.avatar;
      L.skin = hex(AV.skins[a.skin % AV.skins.length].base);
      L.hair = hex(AV.hairColors[a.hairColor % AV.hairColors.length].base);
      const man = AV.sexes[a.sex % 2] === "m";
      L.hs = "glatze";                                                   /* glatte Low-Poly-Glatze wie die Standardfiguren */
      if (false && a.beard > 0 && man) L.beard = hex(mixc(L.hair, 0x000000, 0.12).map(v => Math.round(v * 255)).reduce((s, v) => (s << 8) | v, 0));
    } catch (e) { /* Standard */ }
    return L;
  }

  /* ------------------------------ Bausteine -------------------------------- */
  /* Mauer in eigenen Koordinaten: x entlang der Wand, y nach oben, Innenseite zeigt nach +z; Loch (Fenster) optional */
  function wall(b, len, hole) {
    const mortar = 0x4a3a30;
    const slab = (x0, x1, y0, y1) => { if (x1 - x0 > 0.001 && y1 - y0 > 0.001) b.box(x1 - x0, y1 - y0, WALL_T, mortar, { x: (x0 + x1) / 2, y: y0, z: -WALL_T / 2 }); };
    if (hole) { slab(-len / 2, hole.x0, 0, WH); slab(hole.x1, len / 2, 0, WH); slab(hole.x0, hole.x1, 0, hole.y0); slab(hole.x0, hole.x1, hole.y1, WH); }
    else slab(-len / 2, len / 2, 0, WH);
    const bh = 0.115, bw = 0.33, g = 0.014;
    let row = 0;
    b.noise(0.2, () => {
      for (let y = 0; y < WH - 0.02; y += bh + g, row++) {
        const off = (row % 2) * bw / 2;
        for (let x = -len / 2 - off; x < len / 2; x += bw + g) {
          const x0 = Math.max(x, -len / 2 + 0.005), x1 = Math.min(x + bw, len / 2 - 0.005);
          if (x1 - x0 < 0.06) continue;
          if (hole && x1 > hole.x0 - 0.04 && x0 < hole.x1 + 0.04 && y + bh > hole.y0 - 0.04 && y < hole.y1 + 0.04) continue;
          const low = y < 0.55;
          b.box(x1 - x0, bh, 0.03, low ? 0x4f8f90 : 0xa07458, { x: (x0 + x1) / 2, y, z: 0, nobot: true });
        }
      }
    });
    b.box(len, 0.05, 0.05, 0x3a6c6e, { y: 0.55, z: 0.02 });                      /* Absatzleiste der Sockelfarbe */
  }

  function cellStatic() {
    const b = new MB();
    G3.seed(1414);
    /* Boden */
    b.noise(0.1, () => {
      for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
        const x = X0 + i * 0.425, z = Z0 + j * (2.6 / 6);
        b.box(0.425 - 0.008, 0.03, 2.6 / 6 - 0.008, (i + j) % 2 ? 0x9a9aa2 : 0xb2b1b8, { x: x + 0.2125, z: z + 1.3 / 6, nobot: true });
      }
    });
    b.box(1.1, 0.03, 2.6, 0x4a4b50, { x: X1 + 0.55, z: 0 });                     /* Flur hinter dem Gitter */
    /* Wände */
    b.at({ z: Z0 }, () => wall(b, 3.4, null));
    b.at({ x: X0, ry: PI / 2 }, () => wall(b, 2.6, { x0: -WIN.z1, x1: -WIN.z0, y0: WIN.y0, y1: WIN.y1 }));
    b.at({ x: X1 + 1.1, ry: -PI / 2 }, () => b.box(2.6, WH, 0.1, 0x3a3d44, { x: 0, z: -0.05 }));   /* Flurwand */
    /* Fenstergitter in der linken Wand: vier Stäbe, Querstab, Sims */
    const wzc = (WIN.z0 + WIN.z1) / 2;
    [-0.12, 0.03, 0.18, 0.33].forEach(z => b.cyl(0.016, 0.016, WIN.y1 - WIN.y0 + 0.04, 6, 0x2a2d33, { x: X0 - 0.03, y: WIN.y0 - 0.02, z }));
    b.box(0.04, 0.025, WIN.z1 - WIN.z0 + 0.1, 0x2a2d33, { x: X0 - 0.03, y: 1.25, z: wzc });
    b.box(0.17, 0.04, WIN.z1 - WIN.z0 + 0.12, 0x6a6a70, { x: X0 - 0.03, y: WIN.y0 - 0.04, z: wzc });
    /* Rohr an der linken Wand mit Ventilrad */
    b.at({ x: X0 + 0.07, y: 1.62, z: Z0 + 0.1, rx: PI / 2 }, () => b.cyl(0.035, 0.035, 2.4, 8, 0x4b5258, { }));
    b.cyl(0.05, 0.05, 0.05, 8, 0x3b4046, { x: X0 + 0.07, y: 1.6, z: 0.9 });
    b.at({ x: X0 + 0.1, y: 1.62, z: 0.9, rz: PI / 2 }, () => b.cyl(0.07, 0.07, 0.015, 8, 0x9a3b2e, { }));
    /* Doppelstockbett */
    const { x0, x1, z0, z1 } = BUNK, steel = 0x3b3f48, steelL = 0x555b66, lenX = x1 - x0, wZ = z1 - z0;
    [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([x, z]) => b.box(0.05, 1.55, 0.05, steel, { x, z, y: 0 }));
    [LM, UM].forEach(m => {
      b.box(lenX + 0.05, 0.05, 0.04, steelL, { x: (x0 + x1) / 2, y: m - 0.1, z: z1 });
      b.box(lenX + 0.05, 0.05, 0.04, steel, { x: (x0 + x1) / 2, y: m - 0.1, z: z0 });
      b.box(0.04, 0.05, wZ, steel, { x: x0, y: m - 0.1, z: (z0 + z1) / 2 });
      b.box(0.04, 0.05, wZ, steel, { x: x1, y: m - 0.1, z: (z0 + z1) / 2 });
      b.box(lenX - 0.04, 0.02, wZ - 0.04, 0x30343b, { x: (x0 + x1) / 2, y: m - 0.1, z: (z0 + z1) / 2 });
      b.noise(0.06, () => b.box(lenX - 0.04, 0.08, wZ - 0.04, 0x5f8cc8, { x: (x0 + x1) / 2, y: m - 0.08, z: (z0 + z1) / 2 }));
      b.box(lenX * 0.5, 0.012, wZ - 0.03, m === UM ? 0x3f7fd0 : 0x2f69b8, { x: x1 - lenX * 0.3, y: m - 0.003, z: (z0 + z1) / 2 });   /* Decke */
      b.box(0.3, 0.06, wZ * 0.8, 0xf4f2ee, { x: x0 + 0.2, y: m - 0.01, z: (z0 + z1) / 2, rz: 0.04 });                       /* Kissen */
    });
    b.box(lenX - 0.05, 0.04, 0.03, steelL, { x: (x0 + x1) / 2, y: 1.22, z: z0 });                                 /* Rückwand-Holm oben */
    /* Leiter am rechten Bettende */
    [z0 + 0.12, z0 + 0.42].forEach(z => b.box(0.035, UM + 0.1, 0.035, steelL, { x: x1 + 0.07, z, y: 0 }));
    for (let i = 0; i < 5; i++) b.box(0.03, 0.03, 0.34, steelL, { x: x1 + 0.07, y: 0.15 + i * 0.18, z: z0 + 0.27 });
    /* Kiste unter dem Bett */
    b.box(0.45, 0.17, 0.3, 0x6b4a2c, { x: -0.55, z: -0.95, y: 0.03 });
    b.box(0.47, 0.03, 0.32, 0x7d5a38, { x: -0.55, z: -0.95, y: 0.2 });
    b.box(0.12, 0.07, 0.01, 0x9a9ea5, { x: -0.55, z: -0.79, y: 0.1 });
    /* Tisch und Hocker */
    const tx = 1.25, tz = -0.95;
    b.box(0.62, 0.04, 0.46, 0xb07a45, { x: tx, z: tz, y: 0.43 });
    [[-0.28, -0.2], [0.28, -0.2], [-0.28, 0.2], [0.28, 0.2]].forEach(([dx, dz]) => b.box(0.04, 0.43, 0.04, 0x6e4a2a, { x: tx + dx, z: tz + dz }));
    b.cyl(0.032, 0.03, 0.07, 8, 0x9aa0a8, { x: tx + 0.2, z: tz - 0.1, y: 0.47 });
    [[0xd9c27a, 0.03], [0x4a6f8a, 0.025], [0xa8473a, 0.03]].forEach(([c, h], i) => b.box(0.2 - i * 0.02, h, 0.14, c, { x: tx - 0.15, z: tz + 0.03, y: 0.47 + i * 0.03, ry: i * 0.18 }));
    b.box(0.14, 0.006, 0.2, 0xf2f0e6, { x: tx + 0.02, z: tz + 0.11, y: 0.47, ry: 0.25 });
    b.cyl(0.13, 0.12, 0.28, 8, 0x555b66, { x: 1.05, z: -0.35, y: 0 }); b.cyl(0.14, 0.14, 0.03, 8, 0x6a7080, { x: 1.05, z: -0.35, y: 0.28 });
    /* Waschbecken und Klo an der linken Wand */
    const steelW = 0x9aa0a8, steelD = 0x6f757d;
    b.box(0.3, 0.48, 0.38, steelD, { x: X0 + 0.17, z: 0.1, y: 0 });
    b.box(0.34, 0.07, 0.46, steelW, { x: X0 + 0.19, z: 0.1, y: 0.48 });
    b.box(0.22, 0.02, 0.34, 0x3f444b, { x: X0 + 0.2, z: 0.1, y: 0.545 });
    b.cyl(0.018, 0.018, 0.14, 6, steelW, { x: X0 + 0.07, z: 0.1, y: 0.55 });
    b.at({ x: X0 + 0.07, y: 0.68, z: 0.1, rz: -PI / 2 }, () => b.cyl(0.016, 0.016, 0.13, 6, steelW, { }));
    b.box(0.26, 0.28, 0.34, steelD, { x: X0 + 0.15, z: 0.62, y: 0 });
    b.cyl(0.15, 0.11, 0.12, 8, steelW, { x: X0 + 0.28, z: 0.62, y: 0.28 });
    b.box(0.14, 0.3, 0.3, steelD, { x: X0 + 0.08, z: 0.62, y: 0.4 });
    /* Regal mit Büchern und Pflanze, Lampe */
    b.box(0.58, 0.03, 0.16, 0x7a5532, { x: -1.22, z: Z0 + 0.1, y: 1.45 });
    [0.1, 0.4].forEach(dx => b.box(0.03, 0.12, 0.1, 0x555b66, { x: -1.22 - 0.25 + dx * 1.3, z: Z0 + 0.08, y: 1.33 }));
    [[0x3a5fa8, 0.17], [0xa8473a, 0.14], [0xd9c27a, 0.16], [0x4f7a4a, 0.13]].forEach(([c, h], i) => b.box(0.045, h, 0.11, c, { x: -1.44 + i * 0.05, z: Z0 + 0.09, y: 1.48, rz: i === 3 ? -0.2 : 0 }));
    b.cyl(0.05, 0.04, 0.07, 7, 0xa8663a, { x: -1.08, z: Z0 + 0.1, y: 1.48 });
    for (let i = 0; i < 5; i++) b.cone(0.03, 0.14, 4, i % 2 ? 0x4f9a46 : 0x3f8a3c, { x: -1.08 + (i - 2) * 0.014, z: Z0 + 0.1, y: 1.54, rz: (i - 2) * 0.3 });
    b.box(0.12, 0.08, 0.1, 0x3b3f48, { x: X0 + 0.06, z: 0.95, y: 1.68 });
    b.cyl(0.05, 0.05, 0.02, 8, 0x3b3f48, { x: X0 + 0.14, z: 0.95, y: 1.64, rz: PI / 2 });
    /* Gitterwand (Zellentür): Stäbe, Rahmen, Schloss */
    const dz0 = 0.15, dz1 = 1.28;
    for (let z = dz0 + 0.07; z < dz1; z += 0.11) b.cyl(0.02, 0.02, WH, 6, 0x2a2d33, { x: X1, z });
    [0.06, 0.95, WH - 0.05].forEach(y => b.box(0.05, 0.06, dz1 - dz0 + 0.06, 0x2a2d33, { x: X1, z: (dz0 + dz1) / 2, y }));
    [dz0, dz1 + 0.02].forEach(z => b.box(0.09, WH, 0.09, 0x23262b, { x: X1, z }));
    b.box(0.09, 0.24, 0.13, 0x6b717a, { x: X1 - 0.03, z: dz0 + 0.14, y: 0.9 });
    b.box(0.03, 0.07, 0.03, 0x15171a, { x: X1 - 0.075, z: dz0 + 0.14, y: 0.98 });
    b.box(0.15, 0.1, 0.03, 0x0a0a0c, { x: 0.3, z: Z0 + 0.012, y: 0.03 });                   /* Rattenloch */
    b.box(0.19, 0.02, 0.04, 0x2c3a3e, { x: 0.3, z: Z0 + 0.02, y: 0.13 });
    /* Gully */
    b.box(0.24, 0.012, 0.18, 0x1d1f23, { x: 0.45, z: 0.55, y: 0.03 });
    for (let i = 0; i < 4; i++) b.box(0.012, 0.014, 0.17, 0x55595f, { x: 0.37 + i * 0.05, z: 0.55, y: 0.03 });
    return b;
  }

  /* Der Gefangene: Rumpf (Drehpunkt Hüfte), Kopf (Hals), zwei Arme (Schulter), zwei Beine (Hüfte + Knie) */
  function prisoner(L) {
    const body = { shirt: ORANGE, pants: ORANGE, skin: L.skin, seed: L.seed };
    const T0 = FWM.person(Object.assign({}, body, { noLegs: true, noArms: true, noHead: true }));
    const T = new MB(); T.merge(T0, { y: -0.417 });
    T.box(0.1, 0.05, 0.02, 0xe8e4da, { y: 0.74 - 0.417, z: 0.093 });                            /* weißer Kragen */
    T.box(0.07, 0.045, 0.012, 0x2a2a30, { x: 0.075, y: 0.62 - 0.417, z: 0.094 });               /* Nummernschild */
    T.box(0.3, 0.025, 0.19, mixc(ORANGE, 0x000000, 0.25), { y: 0.42 - 0.417 });                  /* Gürtelnaht */
    const H = new MB(); H.merge(FWM.head({ skin: L.skin, hair: L.hair, hs: L.hs, beard: L.beard, seed: L.seed }), {});
    const armM = FWM.arm({ shirt: ORANGE, skin: L.skin });
    const th = new MB(); th.box(0.092, 0.1, 0.3, ORANGE, { y: -0.05, z: 0.14 });
    const sh = new MB(); sh.box(0.09, 0.33, 0.1, ORANGE, { y: -0.31 }); sh.box(0.098, 0.05, 0.15, 0x2a2a30, { y: -0.34, z: 0.03 });
    return { T, H, armM, th, sh };
  }

  function ratMesh() {
    const b = new MB();
    b.sphere(0.05, 8, 5, 0x6a6a72, { sx: 1.5, sy: 0.85, y: 0.045 });
    b.sphere(0.034, 7, 5, 0x77777f, { x: 0, y: 0.05, z: 0.075 });
    b.cone(0.016, 0.04, 5, 0xe2a0a0, { y: 0.045, z: 0.115, rx: PI / 2, nobot: true });
    [-1, 1].forEach(s => { b.sphere(0.017, 6, 4, 0xe2a0a0, { x: s * 0.03, y: 0.083, z: 0.06 }); b.box(0.01, 0.01, 0.01, 0x111114, { x: s * 0.018, y: 0.06, z: 0.103 }); });
    [-1, 1].forEach(s => { b.box(0.012, 0.03, 0.02, 0xc89090, { x: s * 0.03, y: 0, z: 0.04 }); b.box(0.012, 0.03, 0.02, 0xc89090, { x: s * 0.03, y: 0, z: -0.05 }); });
    return b;
  }
  const ratTail = () => { const b = new MB(); for (let i = 0; i < 4; i++) b.box(0.01 - i * 0.002, 0.01 - i * 0.002, 0.05, 0xd8a0a0, { y: 0.03, z: -0.07 - i * 0.045 }); return b; };
  function birdMesh() {
    const b = new MB();
    b.sphere(0.03, 6, 4, 0x1a1a1f, { sx: 0.8, sy: 0.7, sz: 1.5 });
    b.sphere(0.02, 6, 4, 0x1a1a1f, { y: 0.015, z: 0.04 });
    b.cone(0.008, 0.025, 4, 0xe8a020, { y: 0.015, z: 0.065, rx: PI / 2, nobot: true });
    return b;
  }
  const wingMesh = s => { const b = new MB(); b.box(0.05, 0.006, 0.035, 0x1a1a1f, { x: s * 0.03 }); return b; };
  /* Lichtprisma durch einen Ausschnitt des Fensters (z0…z1) – Boden oder Rückwand begrenzen es */
  function prism(b, za, zb, col) {
    const D = LIGHT, W = WIN, x = X0 + 0.02;
    const top = [[za, W.y0], [zb, W.y0], [zb, W.y1], [za, W.y1]].map(([z, y]) => [x, y, z]);
    const bot = top.map(p => { const t = rayLen(p[1], p[2]); return [p[0] + D[0] * t, p[1] + D[1] * t, p[2] + D[2] * t]; });
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad(top[i], top[j], bot[j], bot[i], col); b.quad(top[i], bot[i], bot[j], top[j], col); }
  }
  function beamMesh() { const b = new MB(); prism(b, WIN.z0, WIN.z1, 0xfff0c0); return b; }
  /* God Rays: vier schmale, hellere Streifen zwischen den Fensterstäben */
  function raysMesh() {
    const b = new MB(), w = (WIN.z1 - WIN.z0) / 4;
    for (let i = 0; i < 4; i++) { const c = WIN.z0 + (i + 0.5) * w; prism(b, c - w * 0.28, c + w * 0.28, 0xffe9a0); }
    return b;
  }
  const cupMesh = () => {
    const b = new MB();
    b.cyl(0.04, 0.034, 0.075, 8, 0xd2d8de, { }); b.cyl(0.033, 0.033, 0.01, 8, 0x5a3a22, { y: 0.066 });
    b.box(0.012, 0.045, 0.012, 0xd2d8de, { x: 0.05, y: 0.015 }); b.box(0.03, 0.012, 0.012, 0xd2d8de, { x: 0.04, y: 0.05 });
    return b;
  };
  const bookMesh = () => {
    const b = new MB();
    b.box(0.2, 0.035, 0.28, 0x1f3f7a, { }); b.box(0.185, 0.026, 0.265, 0xf4efe2, { x: 0.006, y: 0.005 }); b.box(0.2, 0.036, 0.28, 0x1f3f7a, { y: 0.0, nobot: true, top: 0x1f3f7a });
    b.box(0.12, 0.004, 0.03, 0xf2c230, { y: 0.0355, z: 0.05 });
    return b;
  };
  function guardMesh() {
    const b = new MB();
    const u = 0x25364f;
    b.box(0.09, 0.4, 0.1, 0x1c2433, { x: -0.06 }); b.box(0.09, 0.4, 0.1, 0x1c2433, { x: 0.06 });
    b.box(0.3, 0.38, 0.17, u, { y: 0.4 });
    [-1, 1].forEach(s => b.box(0.07, 0.34, 0.08, u, { x: s * 0.19, y: 0.42 }));
    b.sphere(0.12, 8, 6, 0xe0b890, { y: 0.92 });
    b.cyl(0.14, 0.14, 0.05, 9, 0x1c2433, { y: 1.0 }); b.box(0.2, 0.02, 0.1, 0x111620, { y: 1.0, z: 0.14 });
    b.box(0.05, 0.05, 0.12, 0x222, { x: -0.19, y: 0.42, z: 0.1 });
    return b;
  }

  /* ------------------------------ Leinwände -------------------------------- */
  function canv(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function drawPoster() {
    const c = canv(200, 280), g = c.getContext("2d");
    g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 200, 280);
    g.fillStyle = "#cfc09c"; g.fillRect(0, 0, 200, 8); g.fillRect(0, 272, 200, 8);
    const sky = g.createLinearGradient(0, 20, 0, 160); sky.addColorStop(0, "#9fc4e0"); sky.addColorStop(1, "#f0d9a8");
    g.fillStyle = sky; g.fillRect(14, 20, 172, 150);
    g.fillStyle = "#59606a"; g.beginPath(); g.moveTo(14, 170); g.lineTo(70, 70); g.lineTo(98, 118); g.lineTo(130, 54); g.lineTo(186, 170); g.closePath(); g.fill();
    g.fillStyle = "#f2f4f6"; g.beginPath(); g.moveTo(70, 70); g.lineTo(58, 92); g.lineTo(84, 92); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(130, 54); g.lineTo(116, 80); g.lineTo(146, 80); g.closePath(); g.fill();
    g.fillStyle = "#2e3138"; g.font = "800 27px Arial Black, Arial, sans-serif"; g.textAlign = "center";
    ["BESSERE", "ZEITEN", "KOMMEN"].forEach((t, i) => g.fillText(t, 100, 205 + i * 30));
    return c;
  }
  function drawPicture() {
    const c = canv(160, 200), g = c.getContext("2d");
    g.fillStyle = "#7a5a3a"; g.fillRect(0, 0, 160, 200); g.fillStyle = "#e8e2d4"; g.fillRect(10, 10, 140, 180);
    const sky = g.createLinearGradient(0, 18, 0, 120); sky.addColorStop(0, "#8ec2ea"); sky.addColorStop(1, "#d8ecf6");
    g.fillStyle = sky; g.fillRect(18, 18, 124, 164);
    g.fillStyle = "#6fa04a"; g.fillRect(18, 128, 124, 54);
    [[50, 150, 1], [100, 142, 1.2], [78, 160, 0.8]].forEach(([x, y, s]) => { g.fillStyle = "#4a3426"; g.fillRect(x - 3 * s, y - 6 * s, 6 * s, 14 * s); g.fillStyle = "#2c6a3a"; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x, y - 52 * s + i * 16 * s); g.lineTo(x - (14 + i * 8) * s, y - 34 * s + i * 16 * s); g.lineTo(x + (14 + i * 8) * s, y - 34 * s + i * 16 * s); g.closePath(); g.fill(); } });
    return c;
  }
  function drawSmile() {
    const c = canv(120, 120), g = c.getContext("2d");
    g.fillStyle = "#e8c860"; g.fillRect(4, 4, 112, 112); g.fillStyle = "#d8b84c"; g.fillRect(4, 100, 112, 16);
    g.strokeStyle = "#3a2e18"; g.lineWidth = 6; g.lineCap = "round";
    g.beginPath(); g.arc(60, 60, 34, 0, 7); g.stroke();
    g.fillStyle = "#3a2e18"; g.beginPath(); g.arc(48, 50, 5, 0, 7); g.arc(72, 50, 5, 0, 7); g.fill();
    g.beginPath(); g.arc(60, 64, 18, 0.2, PI - 0.2); g.stroke();
    return c;
  }
  /* Strichliste: je Tag ein Strich, jeder fünfte kreuzt die vier davor */
  function drawTally(n, days) {
    const c = canv(512, 256), g = c.getContext("2d");
    g.clearRect(0, 0, 512, 256);
    g.lineCap = "round";
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < Math.min(n, days); i++) {
      const grp = Math.floor(i / 5), j = i % 5, col = grp % 4, row = Math.floor(grp / 4);
      const x0 = 28 + col * 122, y0 = 40 + row * 100;
      g.strokeStyle = "rgba(226,222,208," + (0.8 + rnd() * 0.15) + ")"; g.lineWidth = 6 + rnd() * 2;
      g.beginPath();
      if (j < 4) { const x = x0 + j * 22 + rnd() * 3; g.moveTo(x, y0 + rnd() * 4); g.lineTo(x + (rnd() - 0.5) * 5, y0 + 66 + rnd() * 6); }
      else { g.moveTo(x0 - 8, y0 + 60); g.lineTo(x0 + 88, y0 + 6); }
      g.stroke();
    }
    return c;
  }

  /* -------------------------------- Szene --------------------------------- */
  function open(host, opt) {
    opt = opt || {};
    const DAYS = opt.days || 14;
    host.innerHTML = `<div class="jl3" id="jl3">
      <canvas id="jlCv"></canvas><div class="jl-vig"></div>
      <div class="jl-top"><div class="jl-plate"><i class="jl-bars"><u></u><u></u><u></u><u></u></i><b>GEFÄNGNIS</b></div>
        <p>Du verbüßt eine Haftstrafe von<br><b>${DAYS} Tagen</b></p><small>JVA Moabit · Zelle 214</small></div>
      <div class="jl-say" id="jlSay"></div>
      <div class="jl-bot">
        <div class="jl-bar"><i id="jlFill"></i></div>
        <div class="jl-days" id="jlDays">Tag <b>1</b> / ${DAYS} (0 %)</div>
        <div class="jl-cells" id="jlCells">${Array.from({ length: DAYS }, (_, i) => `<span${i ? "" : " class=\"cur\""}>${i + 1}</span>`).join("")}</div>
        <div class="jl-stats"><span>Kontostand <b id="jlMoney">–</b></span><span>Ohne dich zugestellt <b id="jlJobs">0</b></span></div>
        <div class="jl-tip"><i>💡</i><div><b>Tipp:</b><span id="jlTip">${TIPS[0]}</span></div></div>
      </div><div class="jl-flash" id="jlFlash"></div></div>`;
    const cv = host.querySelector("#jlCv");
    let R = null;
    try { R = G3.create(cv, { shadowSize: 1024, shadowBox: 3.6, maxDpr: 1.75 }); } catch (e) { R = null; }
    if (!R) { host.innerHTML = ""; return null; }
    const lookv = look();
    const mesh = mb => R.mesh(mb);
    const E = R.env;
    E.sun = (() => { const l = Math.hypot(LIGHT[0], LIGHT[1], LIGHT[2]); return [-LIGHT[0] / l, -LIGHT[1] / l, -LIGHT[2] / l]; })();
    E.sunCol = [1.55, 1.3, 0.92]; E.sky = [0.78, 0.82, 0.95]; E.ground = [0.52, 0.48, 0.48];
    E.fog = [0.07, 0.08, 0.11]; E.fogR = [40, 90]; E.night = 0;
    const meshes = [];
    const M = mb => { const m = mesh(mb); meshes.push(m); return m; };
    const add = (m, o, parent) => { const n = R.node(m, o); if (parent) R.addChild(parent, n); else R.nodes.push(n); return n; };

    add(M(cellStatic()), { shadow: true });
    const sky = add(M((() => { const b = new MB(); b.box(0.02, 0.5, 0.65, 0xbfe0f6, { x: X0 - WALL_T + 0.005, y: WIN.y0, z: (WIN.z0 + WIN.z1) / 2 }); return b; })()), { glow: 0.9, shadow: false });
    const beam = add(M(beamMesh()), { alpha: 0.05, glow: 1.4, shadow: false });
    const rays = add(M(raysMesh()), { alpha: 0.1, glow: 1.6, shadow: false });
    add(M(cupMesh()), { x: 0.34, y: 0.03, z: -0.5, ry: 0.6 });
    add(M(bookMesh()), { x: -0.98, y: UM + 0.012, z: -1.0, ry: 0.35 });
    /* Wanddekor */
    const tex = { poster: R.texture(drawPoster()), pic: R.texture(drawPicture()), smile: R.texture(drawSmile()) };
    const tallyCv = drawTally(0, DAYS); const tally = { t: R.texture(tallyCv), cv: tallyCv };
    add(null, { x: 0.3, y: 1.58, z: Z0 + 0.006, decal: { t: tex.poster, w: 0.18, h: 0.25 } });
    add(null, { x: TALLY.x, y: TALLY.y, z: Z0 + 0.006, decal: { t: tally.t, w: TALLY.w, h: TALLY.w / 2 } });
    add(null, { x: X0 + 0.006, y: 1.28, z: -0.95, ry: PI / 2, decal: { t: tex.pic, w: 0.28, h: 0.35 } });
    add(null, { x: X0 + 0.006, y: 0.95, z: -0.55, ry: PI / 2, decal: { t: tex.smile, w: 0.17, h: 0.17 } });

    /* Gefangener */
    const P = prisoner(lookv), pm = { T: M(P.T), H: M(P.H), arm: M(P.armM), th: M(P.th), sh: M(P.sh) };
    const root = add(null, { x: SEAT.x, y: SIT_Y - 0.417, z: SEAT.z, ry: SEAT.ry });
    const torso = add(pm.T, { y: 0.417 }, root);
    const headN = add(pm.H, { y: 0.383 }, torso);
    const armL = add(pm.arm, { x: -0.19, y: 0.363 }, torso), armR = add(pm.arm, { x: 0.19, y: 0.363 }, torso);
    const hipL = add(pm.th, { x: -0.07, y: 0.417, z: 0 }, root), hipR = add(pm.th, { x: 0.07, y: 0.417, z: 0 }, root);
    const knL = add(pm.sh, { z: 0.29, y: -0.05 }, hipL), knR = add(pm.sh, { z: 0.29, y: -0.05 }, hipR);

    /* Ratte */
    const rat = add(M(ratMesh()), { x: 0.3, y: 0.03, z: -1.27, ry: 0, visible: false });
    const rtail = add(M(ratTail()), {}, rat);
    /* Tropfen */
    const drop = add(M((() => { const b = new MB(); b.sphere(0.012, 6, 4, 0xbfe4ff, { sy: 1.4 }); return b; })()), { x: X0 + 0.07, y: 0.66, z: 0.1, visible: false, shadow: false });
    /* Vogel */
    const bird = add(M(birdMesh()), { x: X0 - 0.09, y: 1.3, z: 0.5, visible: false, shadow: false });
    const wL = add(M(wingMesh(-1)), { x: -0.01 }, bird), wR = add(M(wingMesh(1)), { x: 0.01 }, bird);
    /* Wärter hinter dem Gitter */
    const guard = add(M(guardMesh()), { x: 2.25, y: 0, z: 1.8, ry: PI, s: 1.0, visible: false });
    const torch = add(M((() => { const b = new MB(); b.sphere(0.05, 6, 4, 0xfff0b0, { }); return b; })()), { glow: 1, shadow: false }, guard);
    torch.x = -0.22; torch.y = 0.45; torch.z = 0.14;
    /* Lampe */
    const lampG = add(M((() => { const b = new MB(); b.sphere(0.055, 7, 5, 0xffd27a, {}); return b; })()), { x: X0 + 0.18, y: 1.66, z: 0.95, glow: 1, shadow: false });

    const cam = R.cam;
    cam.fov = 0.55; cam.pitch = 0.6; cam.yaw = 1.1;
    const fit = () => {
      const a = (cv.clientWidth || 1) / (cv.clientHeight || 1);
      cam.dist = Math.max(6, 2.5 / (2 * Math.tan(cam.fov / 2) * Math.min(a, 0.95)));
      cam.tx = -0.42; cam.ty = 0.82; cam.tz = -0.25;
      cam.far = cam.dist * 3 + 40;
    };

    /* -------------------------- Zustand und Animation -------------------------- */
    const st = { t: 0, k: 0, done: 0, pose: "idle", poseT: 2, wave: 0, say: 0, rat: { s: "hide", t: 2, x: 0.3, z: -1.27, tx: 0, tz: 0, bite: 0 }, drop: { t: 1, y: 0.66, on: false },
      bird: { t: 6, x: 0, on: false }, guard: { t: 7, on: false }, dust: 0, tip: 0, tipT: 3, closed: false, finishing: false };
    const POSE = {
      idle:    { lean: 0.17, hx: 0.1, hy: 0, aL: 0.5, aR: 0.5, zL: 0.05, zR: 0.05 },
      lookL:   { lean: 0.1, hx: 0.05, hy: 0.75, aL: 0.62, aR: 0.62, zL: 0.05, zR: 0.05 },
      lookR:   { lean: 0.1, hx: 0.05, hy: -0.7, aL: 0.62, aR: 0.62, zL: 0.05, zR: 0.05 },
      sigh:    { lean: 0.3, hx: 0.4, hy: 0, aL: 0.4, aR: 0.4, zL: 0.0, zR: 0.0 },
      stretch: { lean: -0.2, hx: -0.3, hy: 0, aL: 2.9, aR: 2.9, zL: 0.3, zR: 0.3 },
      think:   { lean: 0.22, hx: 0.2, hy: 0.25, aL: 0.62, aR: 1.75, zL: 0.05, zR: 0.1 },
      wave:    { lean: 0.02, hx: -0.05, hy: 0.15, aL: 0.62, aR: 2.5, zL: 0.05, zR: 0.35 },
      window:  { lean: 0.08, hx: -0.12, hy: -0.85, aL: 0.62, aR: 0.62, zL: 0.05, zR: 0.05 }
    };
    const cur = Object.assign({}, POSE.idle);
    const NEXT = ["idle", "lookL", "idle", "sigh", "lookR", "think", "idle", "stretch", "window"];
    let nextI = 0;
    const damp = (a, b, dt, k) => a + (b - a) * (1 - Math.exp(-k * dt));
    const say = (txt, x, y) => { const el = host.querySelector("#jlSay"); if (!el) return; el.textContent = txt; el.style.left = x + "px"; el.style.top = y + "px"; el.classList.remove("on"); void el.offsetWidth; el.classList.add("on"); };
    const proj = (x, y, z) => R.project(x, y, z);

    function step(dt) {
      st.t += dt;
      const t = st.t;
      /* Pose */
      st.poseT -= dt;
      if (st.wave > 0) { st.wave -= dt; st.pose = "wave"; }
      else if (st.poseT <= 0) { st.pose = NEXT[nextI++ % NEXT.length]; if (Math.random() < 0.4) nextI += 1; st.poseT = st.pose === "stretch" ? 3 : 2.2 + Math.random() * 2.5; }
      const tg = POSE[st.pose] || POSE.idle;
      Object.keys(tg).forEach(k => { cur[k] = damp(cur[k], tg[k], dt, 4.2); });
      const br = Math.sin(t * 1.9) * 0.012, fid = st.pose === "idle" ? Math.sin(t * 7) * 0.02 : 0;
      torso.rx = cur.lean + br; torso.sy = 1 + br * 0.6;
      headN.rx = cur.hx + Math.sin(t * 1.3) * 0.02; headN.ry = cur.hy;
      const wv = st.pose === "wave" ? Math.sin(t * 11) * 0.35 : 0;
      armL.rx = -cur.aL; armR.rx = -cur.aR + fid; armL.rz = -cur.zL; armR.rz = cur.zR + wv;
      hipL.rx = Math.sin(t * 1.1) * 0.05; hipR.rx = Math.sin(t * 1.1 + 1.5) * 0.05;
      knL.rx = Math.sin(t * 1.5 + 0.4) * 0.32 + 0.1; knR.rx = Math.sin(t * 1.5 + 2.2) * 0.32 + 0.1;
      /* Tropfen */
      const d = st.drop; d.t -= dt;
      if (d.t <= 0 && !d.on) { d.on = true; d.y = 0.68; drop.visible = true; }
      if (d.on) { d.y -= (0.4 + (0.68 - d.y) * 9) * dt; drop.y = d.y; drop.sy = 1 + (0.68 - d.y) * 2; if (d.y <= 0.56) { d.on = false; drop.visible = false; d.t = 1.4 + Math.random() * 1.2; R.burst({ x: X0 + 0.07, y: 0.57, z: 0.1, n: 5, speed: 0.25, up: 0.5, size: 0.012, g: -2, col: [[0.75, 0.9, 1, 0.9]], life: 0.5, spread: 0.02 }); } }
      /* Staub im Lichtstrahl */
      st.dust -= dt;
      if (st.dust <= 0) {
        st.dust = 0.07;
        const u = Math.random(), v = Math.random(), s = Math.random();
        const z = WIN.z0 + (WIN.z1 - WIN.z0) * u, y = WIN.y0 + (WIN.y1 - WIN.y0) * v, tt = (0.1 + s * 0.85) * rayLen(y, z);
        R.emit({ x: X0 + 0.02 + LIGHT[0] * tt, y: y + LIGHT[1] * tt, z: z + LIGHT[2] * tt, vx: (Math.random() - 0.5) * 0.03, vy: (Math.random() - 0.4) * 0.02, vz: (Math.random() - 0.5) * 0.03, g: 0, drag: 0.1, life: 3.5 + Math.random() * 3, size: 0.012 + Math.random() * 0.01, col: [1, 0.95, 0.75, 0.75] });
      }
      st.steam = (st.steam || 0) - dt;
      if (st.steam <= 0) { st.steam = 0.22; R.emit({ x: 0.34 + (Math.random() - 0.5) * 0.02, y: 0.11, z: -0.5, vx: (Math.random() - 0.5) * 0.02, vy: 0.08, vz: (Math.random() - 0.5) * 0.02, g: 0, drag: 0.3, life: 1.6, size: 0.018, size2: 0.05, col: [1, 1, 1, 0.45] }); }
      /* Ratte: versteckt → läuft zu Krümeln → knabbert → schaut → zurück */
      const r = st.rat; r.t -= dt;
      const go = (tx, tz, sp) => { const dx = tx - r.x, dz = tz - r.z, l = Math.hypot(dx, dz); if (l < 0.03) return true; r.x += dx / l * sp * dt; r.z += dz / l * sp * dt; rat.ry = Math.atan2(dx, dz); rat.y = 0.03 + Math.abs(Math.sin(t * 22)) * 0.012; return false; };
      if (r.s === "hide") { rat.visible = false; if (r.t <= 0) { r.s = "in"; rat.visible = true; r.x = 0.3; r.z = -1.27; r.tx = -0.1 + Math.random() * 0.5; r.tz = 0.1 + Math.random() * 0.5; } }
      else if (r.s === "in") { if (go(r.tx, r.tz, 0.55)) { r.s = "eat"; r.t = 2.2 + Math.random() * 2; } }
      else if (r.s === "eat") { rat.rx = Math.sin(t * 16) * 0.12; if (r.t <= 0) { rat.rx = 0; r.s = Math.random() < 0.5 ? "look" : "out"; r.t = 1.2; } }
      else if (r.s === "look") { rat.rx = -0.7; rat.y = 0.045; if (r.t <= 0) { rat.rx = 0; r.s = "out"; } }
      else if (r.s === "out" || r.s === "flee") { if (go(0.3, -1.27, r.s === "flee" ? 1.5 : 0.6)) { r.s = "hide"; r.t = 5 + Math.random() * 6; } }
      rat.x = r.x; rat.z = r.z; rtail.ry = Math.sin(t * 6) * 0.35;
      /* Vogel */
      const bd = st.bird; bd.t -= dt;
      if (!bd.on && bd.t <= 0) { bd.on = true; bd.x = 0.55; bird.visible = true; }
      if (bd.on) { bd.x -= 0.55 * dt; bird.z = bd.x; bird.y = 1.3 + Math.sin(bd.x * 9) * 0.04; bird.ry = PI; wL.rz = Math.sin(t * 30) * 0.7; wR.rz = -Math.sin(t * 30) * 0.7; if (bd.x < -0.4) { bd.on = false; bird.visible = false; bd.t = 7 + Math.random() * 6; } }
      /* Wärter */
      const gd = st.guard; gd.t -= dt;
      if (!gd.on && gd.t <= 0) { gd.on = true; gd.z = 1.9; guard.visible = true; }
      if (gd.on) { gd.z -= 0.55 * dt; guard.z = gd.z; guard.rz = Math.sin(t * 7) * 0.02; guard.y = Math.abs(Math.sin(t * 7)) * 0.015; if (gd.z < -1.6) { gd.on = false; guard.visible = false; gd.t = 9 + Math.random() * 8; } }
      /* Lampe flackert leicht */
      lampG.glow = 0.8 + (Math.sin(t * 13) * Math.sin(t * 3.1) > 0.92 ? -0.5 : 0) + Math.sin(t * 2) * 0.1;
      /* Himmel und Licht über die Haftzeit: Morgen → Abend */
      const k = st.k;
      sky.tint = [...mixc(0x9ed0f0, 0xf08a4a, Math.min(1, k * 1.05)), 0.55];
      E.sunCol = mixc([1.55, 1.34, 0.95], [1.5, 1.0, 0.66], k);
      beam.tint = [...mixc(0xfff0c0, 0xffb070, k), 0.6]; rays.tint = [...mixc(0xffe9a0, 0xffa860, k), 0.7]; rays.alpha = 0.055 + Math.sin(t * 0.8) * 0.02;
      /* Tipps */
      st.tipT -= dt;
      if (st.tipT <= 0) { st.tipT = 3.6; const el = host.querySelector("#jlTip"); if (el) { el.parentNode.classList.add("sw"); setTimeout(() => { if (el.isConnected) { el.textContent = TIPS[++st.tip % TIPS.length]; el.parentNode.classList.remove("sw"); } }, 260); } }
    }

    /* -------------------------------- Eingabe -------------------------------- */
    cv.addEventListener("pointerdown", ev => {
      const rc = cv.getBoundingClientRect(), x = ev.clientX - rc.left, y = ev.clientY - rc.top;
      const T = [
        ["man", proj(SEAT.x, UM + 0.25, SEAT.z + 0.1), 85],
        ["rat", proj(st.rat.x, 0.06, st.rat.z), 60],
        ["tap", proj(X0 + 0.1, 0.62, 0.1), 55],
        ["win", proj(X0, 1.25, (WIN.z0 + WIN.z1) / 2), 70]
      ].filter(q => q[1]).map(([k, p, r]) => [k, p, r, Math.hypot(p[0] - x, p[1] - y)]).filter(q => q[3] < q[2]).sort((a, b) => a[3] - b[3]);
      if (!T.length) return;
      const [k, p] = T[0], L = SAY[k];
      say(L[Math.floor(Math.random() * L.length)], p[0], p[1] - 40);
      if (k === "man") { st.wave = 2.2; }
      else if (k === "rat") { if (st.rat.s !== "hide") st.rat.s = "flee"; else { st.rat.t = 0; } }
      else if (k === "tap") { st.drop.t = 0; setTimeout(() => { st.drop.t = 0; }, 380); }
      else { st.bird.t = 0; st.pose = "window"; st.poseT = 2.5; }
    });

    /* -------------------------------- Schleife -------------------------------- */
    let raf = 0, last = performance.now(), alive = true;
    const frame = now => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      fit();
      step(dt);
      R.stepParticles(dt);
      try { R.render(st.t); } catch (e) { /* Kontextverlust o. Ä. */ }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const ctl = {
      R, st,
      update(o) {
        if (!alive) return;
        const k = Math.max(0, Math.min(1, o.k || 0));
        st.k = k;
        const done = Math.floor(k * DAYS + 1e-6), day = Math.min(DAYS, 1 + done);
        const fill = host.querySelector("#jlFill"), days = host.querySelector("#jlDays");
        if (fill) fill.style.width = Math.round(k * 100) + "%";
        if (days) days.innerHTML = "Tag <b>" + day + "</b> / " + DAYS + " (" + Math.round(k * 100) + " %)";
        if (done !== st.done) {
          const prev = st.done; st.done = done;
          host.querySelectorAll("#jlCells span").forEach((s, i) => { s.classList.toggle("x", i < done); s.classList.toggle("cur", i === done && done < DAYS); });
          const c = tally.cv; const nc = drawTally(done, DAYS); c.getContext("2d").clearRect(0, 0, c.width, c.height); c.getContext("2d").drawImage(nc, 0, 0); R.texUpdate(tally.t);
          if (done > prev) {
            const g = (done - 1) % 5, grp = Math.floor((done - 1) / 5), px = 28 + (grp % 4) * 122 + (g < 4 ? g * 22 : 40), py = 40 + Math.floor(grp / 4) * 100 + 33;
            R.burst({ x: TALLY.x - TALLY.w / 2 + px / 512 * TALLY.w, y: TALLY.y + TALLY.w / 4 - py / 256 * TALLY.w / 2, z: Z0 + 0.05, n: 8, speed: 0.2, up: 0.25, size: 0.014, g: -0.6, col: [[0.9, 0.88, 0.8, 0.9]], life: 0.8, spread: 0.03 });
          }
        }
        if (o.money != null) { const e = host.querySelector("#jlMoney"); if (e) e.textContent = o.moneyTxt || o.money; }
        if (o.jobs != null) { const e = host.querySelector("#jlJobs"); if (e) e.textContent = o.jobs; }
      },
      finish(cb) {
        if (st.finishing) return; st.finishing = true;
        const f = host.querySelector("#jlFlash");
        if (f) f.classList.add("on");
        setTimeout(() => { if (cb) cb(); }, 650);
      },
      close() {
        if (!alive) return; alive = false; cancelAnimationFrame(raf);
        try { meshes.forEach(m => R.free(m)); const ext = R.gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); } catch (e) { /* egal */ }
        host.innerHTML = "";
      }
    };
    return ctl;
  }

  return { open, look, cellStatic, prisoner, ratMesh, beamMesh, raysMesh, cupMesh, bookMesh, SIT_Y, guardMesh, birdMesh, TIPS, SAY, UM, LM, BUNK, WIN, SEAT, LIGHT };
})();
