/* =========================================================================
   LOGISTIKA – officefp.js (v254)
   Büro betreten: Nach einem Ladescreen steht man in der Tür des Büros und
   läuft in der Ich-Perspektive durch den Raum. Gebaut wird genau das, was der
   Grundriss (offices.js, officeSVG) zeigt: Boden, Wandfarbe, Fenster, Tür,
   Schreibtische mit dem Personal, Küche, Pflanzen, bei Hallen das Tor zum Hof,
   bei Bürogebäuden Treppe, Empfang und Etagen.
     OFFICE3D.enter(baseId)   Ladescreen, Szene bauen, betreten
     OFFICE3D.leave()         verlassen, alles freigeben
   Plan → Welt: 1 Planeinheit = 4 cm, Planmitte (200|150) = Ursprung,
   Plan-x → Welt-x, Plan-y → Welt-z. Steuerung: Joystick links (gehen),
   wischen (umsehen), Personal antippen; am Desktop WASD/Pfeile und Maus.
   Eigene Engine (gl3d.js), Figuren wie auf dem Hof (FWM.person).
   ========================================================================= */
"use strict";

const OFFICE3D = (() => {
  const PI = Math.PI, K = 0.04;
  const PX = sx => (sx - 200) * K, PZ = sy => (sy - 150) * K;
  const RW = 6.8, RD = 4.8;                                 /* halbe Innenmaße (340 × 240 Planeinheiten) */
  const EYE = 1.62, PR = 0.32, SPEED = 2.3;
  const hx = c => typeof c === "number" ? c : parseInt(String(c).replace("#", ""), 16);
  const mixH = (a, b, k) => hx(avMix(typeof a === "number" ? "#" + a.toString(16).padStart(6, "0") : a, typeof b === "number" ? "#" + b.toString(16).padStart(6, "0") : b, k));
  const ROLE_SHIRT = { disp: 0x3f78c8, fahr: 0xe0892a, ums: 0x4f8a4a, zoll: 0x6a58a8 };
  const ROLE_SAY = {
    disp: ["Die Touren für morgen stehen schon.", "Zwei Ausschreibungen schaue ich mir gerade an.", "Alles im Griff hier."],
    fahr: ["Fahrzeug ist gecheckt – ich bin startklar.", "Die Autobahn war heute frei.", "Wohin geht's als Nächstes?"],
    ums: ["Die Halle ist aufgeräumt.", "Die nächste Ladung ist vorbereitet.", "Paletten sind gezählt."],
    zoll: ["Die Papiere liegen bereit.", "Die Zollanmeldung ist raus.", "Ohne Stempel fährt hier nichts."]
  };
  let O = null;

  const ceilH = b => b.tier === 1 ? 3.6 : 3.0;
  const nameHash = s => [...String(s || "x")].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);

  /* ------------------------------- Raum -------------------------------- */
  /* static: Boden, Wände, Möbel (wirft Schatten) · shell: Decke (kein Schatten) · glow: Lampen, Bildschirme, Fensterlicht */
  function buildRoom(b, fl0) {
    const MB = G3.MB, st = new MB(), shell = new MB(), trim = new MB(), glow = new MB(), ob = [];
    const d = decoOf(b), t = tierOf(b), H = ceilH(b), multi = tierFloors(t) > 1;
    const fl = findBy(FLOORS, d.floor), tint = findBy(FLOOR_TINTS, d.tint), wall = findBy(WALLS, d.wall), kit = findBy(KITCHENS, d.kitchen);
    const fc = tint.mix ? avMix(fl.base, tint.mix, 0.5) : fl.base, fdk = hx(avMix(fc, "#000000", 0.16)), fcol = hx(fc);
    const wc = hx(wall.color), wdk = hx(avMix(wall.color, "#000000", 0.22));
    const rect = (x0, z0, x1, z1) => ob.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]);

    /* Boden mit Muster wie im Plan */
    st.box(2 * RW + 0.4, 0.06, 2 * RD + 0.4, fcol, { y: -0.06 });
    if (fl.pattern === "planks") {
      for (let r = 0, z = -RD; z < RD; z += 0.3, r++) {
        st.plate(2 * RW, 0.012, fdk, { z, y0: 0.002 });
        for (let x = -RW + (r % 2) * 0.6; x < RW; x += 1.2) st.plate(0.012, 0.3, fdk, { x, z: z + 0.15, y0: 0.002 });
      }
    } else if (fl.pattern === "tiles") {
      for (let z = -RD; z <= RD; z += 0.6) st.plate(2 * RW, 0.014, fdk, { z, y0: 0.002 });
      for (let x = -RW; x <= RW; x += 0.6) st.plate(0.014, 2 * RD, fdk, { x, y0: 0.002 });
    } else if (fl.pattern === "carpet") {
      const alt = mixH(fcol, 0x000000, 0.07);
      for (let x = -RW; x < RW - 0.01; x += 0.5) for (let z = -RD; z < RD - 0.01; z += 0.5)
        if ((Math.round((x + RW) / 0.5) + Math.round((z + RD) / 0.5)) % 2) st.plate(0.5, 0.5, alt, { x: x + 0.25, z: z + 0.25, y0: 0.002 });
    }

    /* Wände: Fenster links (Plan x 30, y 140–186), Tür rechts (y 96–130), Tor unten rechts bei Hallen */
    const T = 0.16, wz0 = PZ(140), wz1 = PZ(186), dz0 = PZ(96), dz1 = PZ(130), DOOR_H = 2.15, SILL = 0.85, WTOP = 2.3;
    const dock = b.tier > 0 && fl0 === 0, gx0 = PX(300), GATE_H = Math.min(H - 0.3, 3.0);
    const wallBox = (w, h, d2, o) => st.box(w, h, d2, wc, o);
    wallBox(2 * RW + 2 * T, H, T, { z: -RD - T / 2 });                                      /* hinten */
    if (dock) {
      wallBox(gx0 + RW + T, H, T, { x: (-RW - T + gx0) / 2, z: RD + T / 2 });
      wallBox(RW + T - gx0, H - GATE_H, T, { x: (gx0 + RW + T) / 2, y: GATE_H, z: RD + T / 2 });
      /* Rolltor mit Lamellen und Warnstreifen */
      st.box(RW - gx0, GATE_H, 0.06, 0xb8c3d0, { x: (gx0 + RW) / 2, z: RD + 0.05 });
      for (let y = 0.2; y < GATE_H; y += 0.2) st.box(RW - gx0, 0.025, 0.02, 0x8e9aa8, { x: (gx0 + RW) / 2, y, z: RD + 0.015 });
      for (let x = gx0; x < RW; x += 0.3) st.box(0.15, 0.12, 0.02, 0xf2c230, { x: x + 0.075, y: 0.02, z: RD + 0.012 });
      [gx0 + 0.1, RW - 0.1].forEach(x => st.box(0.14, GATE_H, 0.14, 0x55606c, { x, z: RD - 0.02 }));
    } else wallBox(2 * RW + 2 * T, H, T, { z: RD + T / 2 });
    /* links mit Fenster */
    wallBox(T, H, wz0 + RD, { x: -RW - T / 2, z: (-RD + wz0) / 2 });
    wallBox(T, H, RD - wz1, { x: -RW - T / 2, z: (wz1 + RD) / 2 });
    wallBox(T, SILL, wz1 - wz0, { x: -RW - T / 2, z: (wz0 + wz1) / 2 });
    wallBox(T, H - WTOP, wz1 - wz0, { x: -RW - T / 2, y: WTOP, z: (wz0 + wz1) / 2 });
    st.box(0.26, 0.05, wz1 - wz0 + 0.1, 0xf4f6f8, { x: -RW + 0.05, y: SILL, z: (wz0 + wz1) / 2 });      /* Fensterbank */
    [wz0, (wz0 + wz1) / 2, wz1].forEach(z => st.box(0.08, WTOP - SILL, 0.06, 0xf4f6f8, { x: -RW - 0.02, y: SILL, z }));
    st.box(0.08, 0.06, wz1 - wz0, 0xf4f6f8, { x: -RW - 0.02, y: WTOP - 0.06, z: (wz0 + wz1) / 2 });
    glow.box(0.02, WTOP - SILL, wz1 - wz0, 0xcfe8ff, { x: -RW - T + 0.02, y: SILL, z: (wz0 + wz1) / 2 });
    /* rechts mit Tür */
    wallBox(T, H, dz0 + RD, { x: RW + T / 2, z: (-RD + dz0) / 2 });
    wallBox(T, H, RD - dz1, { x: RW + T / 2, z: (dz1 + RD) / 2 });
    wallBox(T, H - DOOR_H, dz1 - dz0, { x: RW + T / 2, y: DOOR_H, z: (dz0 + dz1) / 2 });
    st.box(0.06, DOOR_H - 0.02, dz1 - dz0 - 0.08, 0xc8b48f, { x: RW + 0.06, z: (dz0 + dz1) / 2 });
    st.box(0.05, 0.04, 0.16, 0x9aa6af, { x: RW + 0.01, y: 1.02, z: dz0 + 0.18 });
    [dz0, dz1].forEach(z => st.box(0.1, DOOR_H + 0.06, 0.06, wdk, { x: RW, z }));
    st.box(0.1, 0.06, dz1 - dz0 + 0.12, wdk, { x: RW, y: DOOR_H, z: (dz0 + dz1) / 2 });
    /* Sockelleisten */
    st.box(2 * RW, 0.08, 0.025, wdk, { z: -RD + 0.012 });
    st.box(dock ? gx0 + RW : 2 * RW, 0.08, 0.025, wdk, { x: dock ? (gx0 - RW) / 2 : 0, z: RD - 0.012 });

    /* Decke, Lampen; Halle: offene Stahlträger */
    shell.box(2 * RW + 0.4, 0.12, 2 * RD + 0.4, 0xf2f4f6, { y: H });
    if (b.tier === 1) for (let z = -RD + 1.2; z < RD; z += 2.4) trim.box(2 * RW, 0.28, 0.16, 0x7d8894, { y: H - 0.28, z });
    for (let x = -RW + 1.9; x < RW - 0.5; x += 3.4) for (let z = -RD + 1.6; z < RD - 0.5; z += 3.2) {
      glow.box(1.2, 0.03, 0.5, 0xfff6dc, { x, y: H - (b.tier === 1 ? 0.36 : 0.04), z });
      if (b.tier === 1) trim.box(0.02, 0.3, 0.02, 0x55606c, { x, y: H - 0.33, z });
    }

    /* Küche (nur im Erdgeschoss) */
    if (fl0 === 0 && kit.id !== "keine") {
      const [kx, ky] = kitchenPos(b), cx = PX(kx), back = PZ(ky - 17), zc = back + 0.33, L = 160 * K;
      st.box(L, 0.86, 0.62, 0xf4f6f8, { x: cx, z: zc });
      st.box(L + 0.04, 0.04, 0.66, 0x8d8f94, { x: cx, y: 0.86, z: zc });
      for (let x = cx - L / 2 + 0.6; x < cx + L / 2 - 0.1; x += 0.6) st.box(0.012, 0.7, 0.01, 0xc9ced6, { x, y: 0.08, z: zc + 0.312 });
      st.box(L, 0.08, 0.6, 0x3a3f48, { x: cx, z: zc + 0.01 });
      /* Herd mit Kochfeld, Spüle mit Hahn */
      st.box(0.62, 0.012, 0.5, 0x1d1d20, { x: cx + PX(kx - 55) - PX(kx), y: 0.9, z: zc });
      [[-0.14, -0.1], [0.14, -0.1], [-0.14, 0.12], [0.14, 0.12]].forEach(([dx, dz]) => st.cyl(0.09, 0.09, 0.006, 12, 0x55555c, { x: cx - 2.2 + dx, y: 0.912, z: zc + dz }));
      st.box(0.6, 0.02, 0.42, 0xb8c0c8, { x: cx - 0.8, y: 0.895, z: zc });
      st.box(0.03, 0.3, 0.03, 0xd8dde2, { x: cx - 0.8, y: 0.9, z: zc - 0.22 });
      st.box(0.03, 0.03, 0.18, 0xd8dde2, { x: cx - 0.8, y: 1.18, z: zc - 0.13 });
      if (kit.id === "nische") st.cyl(0.08, 0.07, 0.24, 10, 0xd9413a, { x: cx + 0.3, y: 0.9, z: zc });          /* Wasserkocher */
      else {
        st.box(0.66, 1.95, 0.64, 0xf6f7f8, { x: cx + 0.44, z: zc });                                               /* Kühlschrank */
        st.box(0.04, 0.5, 0.04, 0x9aa6af, { x: cx + 0.2, y: 1.15, z: zc + 0.33 });
      }
      if (kit.id === "barista") {
        st.box(0.5, 0.42, 0.4, 0xa83526, { x: cx + 2.04, y: 0.9, z: zc - 0.05 });
        st.box(0.52, 0.06, 0.42, 0xd8dde2, { x: cx + 2.04, y: 1.32, z: zc - 0.05 });
        st.cyl(0.035, 0.035, 0.08, 8, 0x2a2a30, { x: cx + 2.04, y: 1.02, z: zc + 0.16, rx: PI / 2 });
        st.cyl(0.04, 0.035, 0.07, 8, 0xf6f1e6, { x: cx + 2.04, y: 0.9, z: zc + 0.1 });
      }
      if (back < -RD + 0.6) st.box(L * 0.7, 0.68, 0.36, 0xf4f6f8, { x: cx - L * 0.15, y: 1.5, z: -RD + 0.18 });   /* Hängeschränke */
      rect(cx - L / 2, back, cx + L / 2, back + 0.66);
      if (kit.id !== "nische") {
        const tx = PX(kx - 5), tz = PZ(ky + 43), tw = 3.0, td = 1.0;
        st.box(tw, 0.04, td, 0xe4d3b6, { x: tx, y: 0.74, z: tz });
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => st.box(0.05, 0.74, 0.05, 0x55606c, { x: tx + sx * (tw / 2 - 0.1), z: tz + sz * (td / 2 - 0.1) }));
        [-0.9, 0, 0.9].forEach(dx => [-1, 1].forEach(s => chair(st, tx + dx, tz + s * 0.72, s > 0 ? 0 : PI, 0xcbd6e2)));
        rect(tx - tw / 2 - 0.1, tz - td / 2 - 0.5, tx + tw / 2 + 0.1, tz + td / 2 + 0.5);
      }
    }

    /* Schreibtische, Stühle, Bildschirme */
    const seats = [];
    for (let i = 0; i < t.desks; i++) {
      if (deskFloor(b, i) !== fl0) continue;
      const [sx, sy] = deskPos(b, i), x = PX(sx), z = PZ(sy), p = b.staff[i];
      st.box(2.08, 0.04, 1.04, 0xe4d3b6, { x, y: 0.72, z, top: 0xead9bd });
      [-1, 1].forEach(s => st.box(0.05, 0.72, 0.96, 0x55606c, { x: x + s * 0.98, z }));
      st.box(1.9, 0.4, 0.03, 0x55606c, { x, y: 0.3, z: z - 0.44 });
      /* Bildschirm vor dem Platz, Tastatur, Unterlagen */
      const mx = x + 0.3;
      st.box(0.08, 0.2, 0.08, 0x2a2a30, { x: mx, y: 0.76, z: z - 0.28 });
      st.box(0.66, 0.42, 0.04, 0x22303f, { x: mx, y: 0.94, z: z - 0.3 });
      glow.box(0.6, 0.36, 0.01, p ? 0x6fa8e8 : 0x2c3a4a, { x: mx, y: 0.97, z: z - 0.277 });
      st.box(0.46, 0.02, 0.15, 0x2a2a30, { x: mx, y: 0.76, z: z + 0.08 });
      st.box(0.3, 0.012, 0.22, 0xfaf6ee, { x: x - 0.6, y: 0.76, z: z - 0.05, ry: 0.2 });
      if (p) st.cyl(0.04, 0.04, 0.1, 8, [0xd9413a, 0x3f78c8, 0xf6f1e6, 0x3f9a5a][i % 4], { x: x - 0.25, y: 0.76, z: z + 0.15 });
      const cz = z + 0.9;
      chair(st, mx, cz, p ? 0 : 0.35, 0x2f3d55);
      rect(x - 1.04, z - 0.52, x + 1.04, z + 0.52);
      rect(mx - 0.32, cz - 0.3, mx + 0.32, cz + 0.36);
      if (p) seats.push({ p, i, x: mx, z: cz });
    }

    /* Pflanzen */
    d.plants.forEach((pid, i) => {
      const it = PLANTS.find(x => x.id === pid); if (!it || plantFloor(b, i) !== fl0) return;
      const [sx, sy] = plantPos(b, i), x = PX(sx), z = PZ(sy), h = it.h * 0.055, pr = 0.14 + it.h * 0.004;
      plant(st, x, z, h, pr, it);
      rect(x - pr - 0.05, z - pr - 0.05, x + pr + 0.05, z + pr + 0.05);
    });

    /* Mehrere Etagen: Treppe (Plan 318–364 / 44–84) und Empfang im Erdgeschoss */
    if (multi) {
      const x0 = PX(318), x1 = PX(364), z0 = PZ(44), z1 = PZ(84), n = 10, sw = (x1 - x0) / n;
      for (let k = 0; k < n; k++) st.box(sw, (k + 1) * (H / n), z1 - z0, k % 2 ? 0xcfd6df : 0xc3cbd5, { x: x0 + sw * (k + 0.5), z: (z0 + z1) / 2 });
      st.box(x1 - x0, 0.05, 0.05, 0x55606c, { x: (x0 + x1) / 2, y: H / 2 + 0.95, z: z1 + 0.02, rz: -Math.atan2(H, x1 - x0) });
      rect(x0, z0, x1, z1 + 0.05);
      if (fl0 === 0) {
        const rx0 = PX(150), rx1 = PX(250), rz0 = PZ(236), rz1 = PZ(258);
        st.box(rx1 - rx0, 1.08, rz1 - rz0, 0xe9dcc0, { x: (rx0 + rx1) / 2, z: (rz0 + rz1) / 2 });
        st.box(rx1 - rx0 + 0.1, 0.05, rz1 - rz0 + 0.1, 0x5d4a32, { x: (rx0 + rx1) / 2, y: 1.08, z: (rz0 + rz1) / 2 });
        rect(rx0, rz0, rx1, rz1);
      }
    }
    return { st, shell, trim, glow, ob, seats, H, door: [RW - 0.7, (dz0 + dz1) / 2], stairs: multi ? [PX(300), PZ(64)] : null };
  }

  function chair(m, x, z, ry, col) {
    m.at({ x, z, ry }, () => {
      for (let k = 0; k < 5; k++) m.box(0.04, 0.03, 0.3, 0x2a2a30, { y: 0.04, ry: k * 2 * PI / 5, z: 0 });
      m.cyl(0.025, 0.025, 0.4, 6, 0x55606c, { y: 0.04 });
      m.cyl(0.23, 0.23, 0.07, 12, col, { y: 0.42 });
      m.box(0.44, 0.48, 0.06, col, { y: 0.56, z: 0.24, rx: -0.1 });
    });
  }
  function plant(m, x, z, h, pr, it) {
    G3.seed(900 + Math.round(x * 13 + z * 7));
    m.cyl(pr, pr * 0.78, 0.34, 12, it.id === "olive" ? 0x8a8f94 : 0xc0673f, { x, z, top: 0x5a3a24 });
    const top = 0.34, c = hx(it.col), cd = mixH(c, 0x000000, 0.2), cl = mixH(c, 0xffffff, 0.15);
    m.noise(0.14, () => {
      if (it.id === "kaktus") {
        m.cyl(0.09, 0.08, h * 0.9, 8, c, { x, z, y: top });
        m.cyl(0.05, 0.05, h * 0.3, 6, cd, { x: x + 0.1, z, y: top + h * 0.35 });
        m.cyl(0.045, 0.045, h * 0.25, 6, cd, { x: x - 0.09, z, y: top + h * 0.5 });
      } else if (it.id === "palme" || it.id === "olive") {
        m.cyl(0.03, 0.025, h * 0.75, 6, 0x7a5233, { x, z, y: top });
        if (it.id === "olive") { m.ico(h * 0.28, c, { x, z, y: top + h * 0.8, jitter: 0.3 }); m.ico(h * 0.2, cl, { x: x + 0.1, z, y: top + h * 0.7, jitter: 0.3 }); }
        else for (let k = 0; k < 7; k++) m.box(0.12, 0.02, h * 0.45, k % 2 ? c : cd, { x, z, y: top + h * 0.75, ry: k * 2 * PI / 7, rx: 0.5 });
      } else {
        m.ico(h * 0.34, c, { x, z, y: top + h * 0.38, jitter: 0.3 });
        m.ico(h * 0.24, cl, { x: x + h * 0.15, z: z + 0.05, y: top + h * 0.3, jitter: 0.3 });
        m.ico(h * 0.22, cd, { x: x - h * 0.14, z: z - 0.04, y: top + h * 0.5, jitter: 0.3 });
      }
    });
  }

  /* Figur am Schreibtisch – Aussehen aus dem Namen (fest je Person), Hemd nach Rolle */
  function lookOf(p) {
    const k = nameHash(p.name), av = p.av || {};
    const w = typeof AV !== "undefined" && AV.sexes ? AV.sexes[((av.sex || 0) % 2 + 2) % 2] === "w" : k % 2 === 0;
    const SK = typeof STAFF_SKIN !== "undefined" ? STAFF_SKIN : [0xf2c9a0], HC = typeof STAFF_HAIR !== "undefined" ? STAFF_HAIR : [0x3a2a1a];
    const hs = w ? ["pferd", "lang", "dutt", "locken"][(k >> 3) % 4] : ["kurz", "scheitel", "buzz", "locken", "glatze"][(k >> 3) % 5];
    const hair = HC[(k >> 2) % HC.length];
    const o = { sit: true, skin: SK[k % SK.length], hair, hs, seed: k % 50, shirt: ROLE_SHIRT[p.role] || 0x3f78c8, pants: 0x2f3a4a };
    if (!w && (k >> 5) % 3 === 1 && hs !== "glatze") o.beard = mixH(hair, 0x000000, 0.15);
    return o;
  }

  /* Wandtafeln: Whiteboard mit echten Zahlen des Standorts, Firmenschild */
  function boardCanvas(b) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 320;
    const g = c.getContext("2d"), t = tierOf(b);
    g.fillStyle = "#fbfcfd"; g.fillRect(0, 0, 512, 320);
    g.strokeStyle = "#8e98a6"; g.lineWidth = 14; g.strokeRect(7, 7, 498, 306);
    g.fillStyle = "#1d3f8f"; g.font = "800 34px 'Baloo 2', system-ui, sans-serif";
    g.fillText("Standort " + N[b.node].short, 30, 62);
    g.fillStyle = "#2a2a30"; g.font = "700 25px 'Baloo 2', system-ui, sans-serif";
    const rows = [
      "Selbst disponiert: " + (b.done || 0) + " Touren",
      "Team: " + b.staff.length + " / " + t.desks + " Plätze",
      "Stellplätze: " + b.vehicles.length + " / " + t.slots,
      "Stimmung: " + Math.round(b.mood) + " %"
    ];
    rows.forEach((r, i) => g.fillText("• " + r, 34, 118 + i * 46));
    g.strokeStyle = "#d9413a"; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 76); g.lineTo(30 + Math.min(440, g.measureText("Standort " + N[b.node].short).width * 1.35), 80); g.stroke();
    return c;
  }
  function signCanvas() {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 200;
    const g = c.getContext("2d"), name = (S.player && S.player.company) || "Spedition";
    g.font = "64px Bangers, 'Baloo 2', system-ui"; g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 12; g.strokeStyle = "#0d1b2a"; g.strokeText(name.toUpperCase(), 512, 104);
    g.fillStyle = (S.livery && S.livery.c1) || (S.player && typeof COMPANY_COLORS !== "undefined" && COMPANY_COLORS[S.player.color]) || "#2f6fed";   /* nur lesen – livery() würde eine Lackierung anlegen */ g.fillText(name.toUpperCase(), 512, 104);
    return c;
  }

  /* ------------------------------ Betreten ----------------------------- */
  function enter(baseId, floor) {
    if (O) return;
    const b = typeof baseById === "function" ? baseById(baseId) : null;
    if (!b) return;
    const el = document.createElement("div");
    el.id = "ofp";
    el.innerHTML = `<canvas id="ofpCv"></canvas>
      <div class="ofp-top"><div class="ofp-plate"><b>${esc(N[b.node].short)}</b><small>${esc(tierOf(b).name)}<span class="ofp-fl"></span></small></div>
        <button class="ofp-x" id="ofpX">🚪 Verlassen</button></div>
      <div class="ofp-floors"></div>
      <div class="ofp-joy" id="ofpJoy"><i></i></div>
      <div class="ofp-say" id="ofpSay"></div>
      <div class="ofp-hint" id="ofpHint">Links gehen · wischen zum Umsehen · Personal antippen</div>
      <div id="officeBoot"></div>`;
    document.body.appendChild(el);
    document.body.classList.add("office3d");
    O = { el, b, floor: Math.max(0, Math.min(tierFloors(tierOf(b)) - 1, floor || 0)), alive: true, meshes: [], nodes: [] };
    el.querySelector("#ofpX").onclick = leave;

    /* Ladescreen wie beim Hof (farmview.js), mit eigenen Texten */
    const ld = el.querySelector("#officeBoot");
    let L = null;
    if (typeof ldMake === "function" && typeof ldStart === "function") {
      ldMake(ld);
      const ti = ld.querySelector(".fbTitle"); if (ti) ti.textContent = N[b.node].short + " · " + tierOf(b).name;
      const box = ld.querySelector(".fbBox"); if (box) box.setAttribute("aria-label", "Das Büro wird geladen");
      ["Licht im Büro geht an …", "Die Rechner fahren hoch …", "Der Kaffee läuft durch …", "Willkommen im Büro!"].forEach((s, i) => { const sp = ld.querySelectorAll(".fbMsg span")[i]; if (sp) sp.textContent = s; });
      L = ldStart(ld, 1500);
    }
    const t0 = performance.now();
    requestAnimationFrame(() => setTimeout(() => {
      if (!O || !O.alive) return;
      let ok = false;
      try { ok = start(); } catch (e) { console.warn("Büro 3D", e); }
      if (!ok) { toast("Die 3D-Ansicht läuft auf diesem Gerät nicht.", "warn"); leave(); return; }
      const wait = Math.max(0, 1700 - (performance.now() - t0));
      setTimeout(() => {
        const out = () => { ld.classList.add("out"); setTimeout(() => ld.remove(), 450); const h = el.querySelector("#ofpHint"); if (h) { h.classList.add("on"); setTimeout(() => h.classList.remove("on"), 5200); } };
        if (L) L.finish().then(out); else out();
      }, wait);
    }, 60));
  }

  function start() {
    const el = O.el, cv = el.querySelector("#ofpCv");
    const R = G3.create(cv, { shadowSize: 2048, shadowBox: 8.5, maxDpr: 1.75 });
    if (!R) return false;
    O.R = R;
    const E = R.env;
    E.sun = G3.norm([-0.55, 0.8, 0.28]); E.sunCol = [0.62, 0.58, 0.52]; E.sky = [0.82, 0.84, 0.88]; E.ground = [0.6, 0.57, 0.52];
    E.fog = [0.86, 0.88, 0.9]; E.fogR = [24, 60]; E.night = 0;
    R.cam.fov = 1.05; R.cam.near = 0.04; R.cam.far = 60; R.cam.dist = 0.05;
    buildFloor(true);
    bindInput();
    O.last = performance.now(); O.t = 0;
    const frame = now => {
      if (!O || !O.alive) return;
      const dt = Math.min(0.05, (now - O.last) / 1000); O.last = now; O.t += dt;
      step(dt);
      try { R.render(O.t); } catch (e) { /* Kontextverlust */ }
      O.raf = requestAnimationFrame(frame);
    };
    O.raf = requestAnimationFrame(frame);
    return true;
  }

  /* Etage aufbauen (beim Betreten und beim Etagenwechsel) */
  function buildFloor(first) {
    const R = O.R, b = O.b;
    O.meshes.forEach(m => R.free(m)); O.meshes = []; R.nodes.length = 0;
    const room = buildRoom(b, O.floor);
    const M = mb => { const m = R.mesh(mb); O.meshes.push(m); return m; };
    R.nodes.push(R.node(M(room.st), { shadow: true }));
    R.nodes.push(R.node(M(room.shell), { shadow: false, glow: 0.55 }));     /* Decke: von unten sonst zu dunkel */
    R.nodes.push(R.node(M(room.trim), { shadow: false }));
    R.nodes.push(R.node(M(room.glow), { shadow: false, glow: 0.85 }));
    /* Personal */
    O.staff = room.seats.map(s => {
      const mb = FWM.person(lookOf(s.p));
      const n = R.node(M(mb), { x: s.x, y: 0, z: s.z, ry: PI, s: 1.45 });
      R.nodes.push(n);
      return Object.assign(s, { n, ph: (nameHash(s.p.name) % 100) / 16 });
    });
    /* Wandtafeln */
    const tb = R.texture(boardCanvas(b)), ts = R.texture(signCanvas());
    R.nodes.push(R.node(null, { x: -2.6, y: 1.55, z: RD - 0.012, ry: PI, decal: { t: tb, w: 2.4, h: 1.5 } }));
    R.nodes.push(R.node(null, { x: -2.4, y: room.H - 0.55, z: -RD + 0.012, decal: { t: ts, w: 4.2, h: 0.82 } }));
    O.ob = room.ob; O.H = room.H;
    /* Startpunkt: in der Tür (EG) bzw. oben an der Treppe */
    const sp = O.floor > 0 && room.stairs ? room.stairs : room.door;
    O.pos = [sp[0], sp[1]]; O.pitch = 0.06;
    O.yaw = Math.atan2(-(0.6 - sp[1]), -(-0.6 - sp[0]));          /* Blick zur Raummitte: Blickrichtung = (−cos yaw, −sin yaw) */
    const fl = O.el.querySelector(".ofp-fl"), multi = tierFloors(tierOf(b)) > 1;
    if (fl) fl.textContent = multi ? " · " + floorName(O.floor) : "";
    const fb = O.el.querySelector(".ofp-floors");
    if (fb) {
      fb.innerHTML = multi ? Array.from({ length: tierFloors(tierOf(b)) }, (_, f) => `<button class="${f === O.floor ? "on" : ""}" data-ofl="${f}">${f === 0 ? "EG" : f + ". OG"}</button>`).join("") : "";
      fb.querySelectorAll("[data-ofl]").forEach(x => x.onclick = () => { const f = +x.dataset.ofl; if (f !== O.floor) { O.floor = f; buildFloor(false); } });
    }
    if (!first) { const s = O.el.querySelector("#ofpSay"); if (s) s.classList.remove("on"); }
  }

  /* ------------------------------ Bewegung ----------------------------- */
  function collide(p) {
    const r = PR;
    p[0] = Math.max(-RW + r, Math.min(RW - r, p[0]));
    p[1] = Math.max(-RD + r, Math.min(RD - r, p[1]));
    for (const [x0, z0, x1, z1] of O.ob) {
      const a = x0 - r, c = z0 - r, bx = x1 + r, d = z1 + r;
      if (p[0] > a && p[0] < bx && p[1] > c && p[1] < d) {
        const pen = [p[0] - a, bx - p[0], p[1] - c, d - p[1]], m = Math.min(...pen);
        if (m === pen[0]) p[0] = a; else if (m === pen[1]) p[0] = bx; else if (m === pen[2]) p[1] = c; else p[1] = d;
      }
    }
  }
  function step(dt) {
    const I = O.in;
    let f = I.jy, s = I.jx;
    if (I.k.w) f += 1; if (I.k.s) f -= 1; if (I.k.d) s += 1; if (I.k.a) s -= 1;
    if (I.k.l) O.yaw -= 1.8 * dt; if (I.k.r) O.yaw += 1.8 * dt;
    const l = Math.hypot(f, s);
    if (l > 1) { f /= l; s /= l; }
    const cy = Math.cos(O.yaw), sy = Math.sin(O.yaw);
    const F = [-cy, -sy], Rt = [sy, -cy];
    if (l > 0.05) {
      O.pos[0] += (F[0] * f + Rt[0] * s) * SPEED * dt;
      O.pos[1] += (F[1] * f + Rt[1] * s) * SPEED * dt;
      collide(O.pos);
      O.bob = (O.bob || 0) + dt * 9 * Math.min(1, l);
    }
    const bob = Math.sin(O.bob || 0) * 0.025 * Math.min(1, l);
    const c = O.R.cam, cp = Math.cos(O.pitch), spp = Math.sin(O.pitch);
    c.yaw = O.yaw; c.pitch = O.pitch;
    const ex = O.pos[0], ey = EYE + bob, ez = O.pos[1];
    c.tx = ex - Math.cos(O.yaw) * cp * c.dist; c.ty = ey - spp * c.dist; c.tz = ez - Math.sin(O.yaw) * cp * c.dist;
    /* Personal: leicht in Bewegung (tippen, umschauen) */
    (O.staff || []).forEach(st => { const t = O.t + st.ph; st.n.ry = PI + Math.sin(t * 0.5) * 0.08; st.n.y = Math.abs(Math.sin(t * 7)) * 0.004; });
    /* Sprechblase folgt der Figur */
    if (O.sayAt) {
      const p = O.R.project(O.sayAt.x, 1.55, O.sayAt.z), el = O.el.querySelector("#ofpSay");
      if (el && p && p[2] < 1) { el.style.left = p[0] + "px"; el.style.top = p[1] + "px"; }
      if (performance.now() > O.sayUntil) { O.sayAt = null; if (el) el.classList.remove("on"); }
    }
  }

  /* ------------------------------- Eingabe ----------------------------- */
  function bindInput() {
    const el = O.el, cv = el.querySelector("#ofpCv"), joy = el.querySelector("#ofpJoy"), knob = joy.querySelector("i");
    const I = O.in = { jx: 0, jy: 0, k: {}, look: null, joyId: null };
    /* Umsehen: auf der Fläche ziehen; kurzer Tipp = Personal ansprechen */
    cv.addEventListener("pointerdown", e => {
      if (I.look) return;
      I.look = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now() };
      try { cv.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
    });
    cv.addEventListener("pointermove", e => {
      const L = I.look; if (!L || L.id !== e.pointerId) return;
      const k = e.pointerType === "mouse" ? 0.0042 : 0.0058;
      O.yaw += (e.clientX - L.x) * k;
      O.pitch = Math.max(-1.1, Math.min(1.1, O.pitch + (e.clientY - L.y) * k));
      L.x = e.clientX; L.y = e.clientY;
    });
    const up = e => {
      const L = I.look; if (!L || L.id !== e.pointerId) return;
      I.look = null;
      if (Math.hypot(e.clientX - L.x0, e.clientY - L.y0) < 8 && performance.now() - L.t < 450) tapAt(e.clientX, e.clientY);
    };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", e => { if (I.look && I.look.id === e.pointerId) I.look = null; });
    /* Joystick */
    const joyMove = e => {
      const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R0 = r.width / 2 - 18;
      let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy);
      if (l > R0) { dx = dx / l * R0; dy = dy / l * R0; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      I.jx = dx / R0; I.jy = -dy / R0;
    };
    joy.addEventListener("pointerdown", e => { I.joyId = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch (x) { /* egal */ } joyMove(e); e.preventDefault(); });
    joy.addEventListener("pointermove", e => { if (I.joyId === e.pointerId) joyMove(e); });
    const joyEnd = e => { if (I.joyId !== e.pointerId) return; I.joyId = null; I.jx = I.jy = 0; knob.style.transform = ""; };
    joy.addEventListener("pointerup", joyEnd); joy.addEventListener("pointercancel", joyEnd);
    /* Tastatur */
    const MAP = { KeyW: "w", ArrowUp: "w", KeyS: "s", ArrowDown: "s", KeyA: "a", KeyD: "d", ArrowLeft: "l", ArrowRight: "r", KeyQ: "l", KeyE: "r" };
    O.key = e => {
      if (e.code === "Escape" && e.type === "keydown") { leave(); return; }
      const k = MAP[e.code]; if (!k) return;
      I.k[k] = e.type === "keydown"; e.preventDefault();
    };
    window.addEventListener("keydown", O.key); window.addEventListener("keyup", O.key);
    O.blur = () => { I.k = {}; I.jx = I.jy = 0; knob.style.transform = ""; };
    window.addEventListener("blur", O.blur);
  }
  function tapAt(x, y) {
    const rc = O.el.querySelector("#ofpCv").getBoundingClientRect(), px = x - rc.left, py = y - rc.top;
    let best = null;
    (O.staff || []).forEach(st => {
      const p = O.R.project(st.x, 1.25, st.z); if (!p || p[2] > 1) return;
      const dd = Math.hypot(p[0] - px, p[1] - py), dist = Math.hypot(st.x - O.pos[0], st.z - O.pos[1]);
      if (dd < 80 && dist < 9 && (!best || dd < best.dd)) best = { st, dd };
    });
    if (!best) return;
    const s = best.st, p = s.p, role = ROLES[p.role], lines = ROLE_SAY[p.role] || ROLE_SAY.disp;
    const el = O.el.querySelector("#ofpSay");
    el.innerHTML = `<b>${esc(p.name)}</b><small>${esc(role ? role.name : "Team")}</small><span>„${esc(lines[(nameHash(p.name) + Math.floor(O.t)) % lines.length])}“</span>`;
    el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
    O.sayAt = { x: s.x, z: s.z }; O.sayUntil = performance.now() + 3800;
  }

  /* ------------------------------ Verlassen ---------------------------- */
  function leave() {
    if (!O) return;
    const o = O; O = null; o.alive = false;
    cancelAnimationFrame(o.raf);
    if (o.key) { window.removeEventListener("keydown", o.key); window.removeEventListener("keyup", o.key); }
    if (o.blur) window.removeEventListener("blur", o.blur);
    try { if (o.R) { o.meshes.forEach(m => o.R.free(m)); const ext = o.R.gl && o.R.gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); } } catch (e) { /* egal */ }
    o.el.classList.add("out");
    document.body.classList.remove("office3d");
    setTimeout(() => o.el.remove(), 300);
  }

  return { enter, leave, isOpen: () => !!O, buildRoom };
})();
