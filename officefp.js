/* =========================================================================
   LOGISTIKA – officefp.js (v257)
   Büro betreten: Nach einem Ladescreen steht man in der Tür des Büros und
   läuft in der Ich-Perspektive durch den Raum. Gebaut wird genau das, was der
   Grundriss (offices.js, officeSVG) zeigt: Boden, Wandfarbe, Fenster, Tür,
   Schreibtische mit dem Personal, Küche, Pflanzen, bei Hallen das Tor zum Hof,
   bei Bürogebäuden Treppe, Empfang und Etagen.
     OFFICE3D.enter(baseId)   Ladescreen, Szene bauen, betreten
     OFFICE3D.leave()         verlassen, alles freigeben
   Plan → Welt: 1 Planeinheit = 4 cm, Planmitte (200|150) = Ursprung,
   Plan-x → Welt-x, Plan-y → Welt-z. Steuerung: Joystick links (gehen),
   wischen (umsehen), Personal oder Poster antippen; am Desktop WASD/Pfeile und Maus.
   Eigene Engine (gl3d.js).
   v257: Büro-Figuren als eigene Gliederpuppe (FWM.person bleibt für Hof und Wald unverändert):
   Becken auf dem Sitz, Füße am Boden, Oberkörper, Kopf und beide Arme als bewegliche Teile,
   Hände über Zwei-Gelenk-Rechnung (Schulter–Ellbogen–Hand) an Tastatur, Maus, Block, Telefon, Tasse.
   Aussehen aus dem gespeicherten Avatar (p.av), Zufall nur aus der festen Personal-ID (p.id).
   Tätigkeiten je Person zeitversetzt (tippen, Maus, lesen, notieren, telefonieren, Tasse, aufschauen).
   Küche an der hinteren Wand im 60-cm-Raster (kitchenModules in offices.js), Monitorinhalte je Rolle
   aus echten Standortdaten, Poster „Mitarbeiter des Monats“ (b.motm, offices.js), Ansprechen nur mit
   freier Sicht und in Reichweite. Bilder und Netze werden bei Etagenwechsel und Verlassen freigegeben.
   ========================================================================= */
"use strict";

const OFFICE3D = (() => {
  const PI = Math.PI, K = 0.04;
  const PX = sx => (sx - 200) * K, PZ = sy => (sy - 150) * K;
  const RW = 6.8, RD = 4.8;                                 /* halbe Innenmaße (340 × 240 Planeinheiten) */
  const EYE = 1.62, PR = 0.32, SPEED = 2.3;
  const FS = 1.45;                                          /* Maßstab der Figuren (wie auf dem Hof): 1 Figureinheit = 1,45 m */
  const CHAIR_D = 0.8, SEAT_Y = 0.46;                       /* Stuhlmitte hinter der Tischmitte · Sitzfläche = Oberschenkel-Unterseite (0,317 × 1,45) */
  const TALK_RANGE = 6, ARM_A = 0.29, ARM_B = 0.247;       /* Reichweite zum Ansprechen (m) · Oberarm, Unterarm bis Handmitte (Figureinheiten) */
  const hx = c => typeof c === "number" ? c : parseInt(String(c).replace("#", ""), 16);
  const hs6 = c => "#" + (typeof c === "number" ? c.toString(16).padStart(6, "0") : String(c).replace("#", ""));
  const mixH = (a, b, k) => hx(avMix(hs6(a), hs6(b), k));
  const ROLE_COL = { disp: 0x3f78c8, fahr: 0xe0892a, ums: 0x4f8a4a, zoll: 0x6a58a8 };
  let O = null, SEQ = 0;

  const ceilH = b => b.tier === 1 ? 3.6 : 3.0;
  const nameHash = s => [...String(s || "x")].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);
  const rng = seed => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  const clamp1 = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
  const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const angTo = (a, b, k) => { let d = b - a; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; return a + d * k; };

  /* ------------------------------- Raum -------------------------------- */
  /* st: Boden, Wände, Möbel (wirft Schatten) · shell: Decke (kein Schatten) · glow: Lampen, Fensterlicht.
     ob: Rechtecke für die Begehbarkeit (x0, z0, x1, z1) · occ: Kästen [lo, hi] für die Sichtprüfung beim Antippen. */
  function buildRoom(b, fl0) {
    const MB = G3.MB, st = new MB(), shell = new MB(), trim = new MB(), glow = new MB(), ob = [], occ = [];
    const d = decoOf(b), t = tierOf(b), H = ceilH(b), multi = tierFloors(t) > 1;
    const fl = findBy(FLOORS, d.floor), tint = findBy(FLOOR_TINTS, d.tint), wall = findBy(WALLS, d.wall), kit = findBy(KITCHENS, d.kitchen);
    const fc = tint.mix ? avMix(fl.base, tint.mix, 0.5) : fl.base, fdk = hx(avMix(fc, "#000000", 0.16)), fcol = hx(fc);
    const wc = hx(wall.color), wdk = hx(avMix(wall.color, "#000000", 0.22));
    const rect = (x0, z0, x1, z1) => ob.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]);
    const blk = (x0, y0, z0, x1, y1, z1) => occ.push([[Math.min(x0, x1), y0, Math.min(z0, z1)], [Math.max(x0, x1), y1, Math.max(z0, z1)]]);

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
    st.box(2 * RW, 0.08, 0.025, wdk, { z: -RD + 0.0125 });
    st.box(dock ? gx0 + RW : 2 * RW, 0.08, 0.025, wdk, { x: dock ? (gx0 - RW) / 2 : 0, z: RD - 0.0125 });

    /* Decke, Lampen; Halle: offene Stahlträger */
    shell.box(2 * RW + 0.4, 0.12, 2 * RD + 0.4, 0xf2f4f6, { y: H });
    if (b.tier === 1) for (let z = -RD + 1.2; z < RD; z += 2.4) trim.box(2 * RW, 0.28, 0.16, 0x7d8894, { y: H - 0.28, z });
    for (let x = -RW + 1.9; x < RW - 0.5; x += 3.4) for (let z = -RD + 1.6; z < RD - 0.5; z += 3.2) {
      glow.box(1.2, 0.03, 0.5, 0xfff6dc, { x, y: H - (b.tier === 1 ? 0.36 : 0.04), z });
      if (b.tier === 1) trim.box(0.02, 0.3, 0.02, 0x55606c, { x, y: H - 0.33, z });
    }

    /* Küche (nur im Erdgeschoss) */
    let kitchen = null;
    if (fl0 === 0 && kit.id !== "keine") kitchen = buildKitchen(st, kit.id, PX(kitchenPos(b)[0]), H, rect, blk);

    /* Schreibtische, Stühle, Bildschirme, Arbeitsmittel */
    const seats = [], screens = [];
    for (let i = 0; i < t.desks; i++) {
      if (deskFloor(b, i) !== fl0) continue;
      const [sx, sy] = deskPos(b, i), x = PX(sx), z = PZ(sy), p = b.staff[i];
      const mx = x + 0.3, cz = z + CHAIR_D;
      st.box(2.08, 0.04, 1.04, 0xe4d3b6, { x, y: 0.72, z, top: 0xead9bd });
      [-1, 1].forEach(s => st.box(0.05, 0.72, 0.96, 0x55606c, { x: x + s * 0.98, z }));
      st.box(1.9, 0.4, 0.03, 0x55606c, { x, y: 0.3, z: z - 0.44 });
      /* Bildschirm vor dem Platz: Fuß, Gehäuse; der Inhalt kommt als Bild (screenCanvas) bzw. dunkel im Ruhezustand */
      st.box(0.2, 0.012, 0.16, 0x2a2a30, { x: mx, y: 0.76, z: z - 0.3 });
      st.box(0.05, 0.2, 0.04, 0x2a2a30, { x: mx, y: 0.77, z: z - 0.32 });
      st.box(0.66, 0.42, 0.04, 0x22303f, { x: mx, y: 0.94, z: z - 0.3 });
      if (p) screens.push({ i, p, x: mx, y: 1.15, z: z - 0.3 + 0.0205 });
      else glow.box(0.6, 0.36, 0.008, 0x1d2a38, { x: mx, y: 0.97, z: z - 0.276 });
      /* Tastatur mit Tastenreihen, Mauspad, Block mit Stift, Papierstapel, Telefon */
      st.box(0.44, 0.018, 0.15, 0x2a2a30, { x: mx - 0.04, y: 0.76, z: z + 0.12 });
      for (let r = 0; r < 4; r++) st.box(0.4, 0.006, 0.022, 0x4a4f58, { x: mx - 0.04, y: 0.778, z: z + 0.068 + r * 0.033 });
      st.box(0.22, 0.004, 0.19, 0x2f4a6a, { x: mx + 0.34, y: 0.76, z: z + 0.12 });
      st.box(0.15, 0.008, 0.21, 0xf6f1d8, { x: mx + 0.18, y: 0.76, z: z + 0.36, ry: -0.12 });
      for (let r = 0; r < 5; r++) st.box(0.12, 0.002, 0.004, 0x9ab0c8, { x: mx + 0.18 + r * 0.004, y: 0.768, z: z + 0.29 + r * 0.03, ry: -0.12 });
      st.box(0.21, 0.012, 0.3, 0xfaf6ee, { x: mx - 0.5, y: 0.76, z: z + 0.18, ry: 0.22 });
      st.box(0.21, 0.008, 0.3, 0xf0ece2, { x: mx - 0.53, y: 0.772, z: z + 0.17, ry: 0.12 });
      for (let r = 0; r < 6; r++) st.box(0.15, 0.002, 0.006, 0x8a94a2, { x: mx - 0.53 + r * 0.004, y: 0.781, z: z + 0.07 + r * 0.035, ry: 0.12 });
      if (!p) {
        st.box(0.06, 0.03, 0.1, 0x2a2a30, { x: mx + 0.34, y: 0.764, z: z + 0.12 });
        st.box(0.075, 0.01, 0.15, 0x1d1d20, { x: mx - 0.3, y: 0.76, z: z + 0.36 });
        st.box(0.13, 0.008, 0.008, 0x2a4a8a, { x: mx + 0.2, y: 0.768, z: z + 0.42, ry: 0.4 });
      }
      chair(st, mx, cz, p ? 0 : 0.35, 0x2f3d55);
      rect(x - 1.04, z - 0.52, x + 1.04, z + 0.52);
      rect(mx - 0.32, cz - 0.3, mx + 0.32, cz + 0.36);
      blk(x - 1.04, 0.72, z - 0.52, x + 1.04, 0.76, z + 0.52);
      blk(x - 0.95, 0.3, z - 0.455, x + 0.95, 0.7, z - 0.425);
      blk(mx - 0.33, 0.94, z - 0.32, mx + 0.33, 1.36, z - 0.28);
      if (p) seats.push({ p, i, x: mx, z: cz, dz: z });
    }

    /* Pflanzen */
    d.plants.forEach((pid, i) => {
      const it = PLANTS.find(x => x.id === pid); if (!it || plantFloor(b, i) !== fl0) return;
      const [sx, sy] = plantPos(b, i), x = PX(sx), z = PZ(sy), h = it.h * 0.055, pr = 0.14 + it.h * 0.004;
      plant(st, x, z, h, pr, it);
      rect(x - pr - 0.05, z - pr - 0.05, x + pr + 0.05, z + pr + 0.05);
      blk(x - pr, 0, z - pr, x + pr, 0.34 + h * 0.6, z + pr);
    });

    /* Mehrere Etagen: Treppe (Plan 318–364 / 44–84) und Empfang im Erdgeschoss */
    if (multi) {
      const x0 = PX(318), x1 = PX(364), z0 = PZ(44), z1 = PZ(84), n = 10, sw = (x1 - x0) / n;
      for (let k = 0; k < n; k++) st.box(sw, (k + 1) * (H / n), z1 - z0, k % 2 ? 0xcfd6df : 0xc3cbd5, { x: x0 + sw * (k + 0.5), z: (z0 + z1) / 2 });
      st.box(x1 - x0, 0.05, 0.05, 0x55606c, { x: (x0 + x1) / 2, y: H / 2 + 0.95, z: z1 + 0.02, rz: -Math.atan2(H, x1 - x0) });
      rect(x0, z0, x1, z1 + 0.05);
      blk(x0 + 1.2, 0, z0, x1, H, z1);
      if (fl0 === 0) {
        const rx0 = PX(150), rx1 = PX(250), rz0 = PZ(236), rz1 = PZ(258);
        st.box(rx1 - rx0, 1.08, rz1 - rz0, 0xe9dcc0, { x: (rx0 + rx1) / 2, z: (rz0 + rz1) / 2 });
        st.box(rx1 - rx0 + 0.1, 0.05, rz1 - rz0 + 0.1, 0x5d4a32, { x: (rx0 + rx1) / 2, y: 1.08, z: (rz0 + rz1) / 2 });
        rect(rx0, rz0, rx1, rz1);
        blk(rx0, 0, rz0, rx1, 1.13, rz1);
      }
    }

    /* Bilderrahmen für das Poster „Mitarbeiter des Monats“ neben dem Whiteboard */
    const POSTER = { x: -4.5, y: 1.55, w: 0.84, h: 1.12 };
    st.box(POSTER.w + 0.08, POSTER.h + 0.08, 0.03, 0x2a2a30, { x: POSTER.x, y: POSTER.y - POSTER.h / 2 - 0.04, z: RD - 0.015 });
    st.box(POSTER.w + 0.01, POSTER.h + 0.01, 0.006, 0xfbfcfd, { x: POSTER.x, y: POSTER.y - POSTER.h / 2 - 0.005, z: RD - 0.033 });

    return { st, shell, trim, glow, ob, occ, seats, screens, H, kitchen, poster: POSTER, door: [RW - 0.7, (dz0 + dz1) / 2], stairs: multi ? [PX(300), PZ(64)] : null };
  }

  /* v257: Küchenzeile an der hinteren Wand (Innenseite z = −RD), Raster 60 cm.
     Korpus 58 cm tief, hinten 3 cm Luft für die Sockelleiste · Sockel 10 cm hoch und 6 cm zurückgesetzt · Fronten 18 mm vor dem
     Korpus mit 6-mm-Fugen · Arbeitsplatte 4 cm, hinten bis an die Wand, vorn 3 cm Überstand · Hängeschränke 35 cm tief auf gemeinsamer
     Höhe 1,42–2,10 m im selben Raster, nicht über Kühlschrank (Hochschrank bis 2,10 m) und Kaffeemodul · Dunstabzug über dem Herd.
     Vorher: Zeile stand 40 cm vor der Wand, Sockel und Fronten lagen in derselben Ebene (Flimmern/Zickzack an der Front),
     Hängeschränke ragten in den Kühlschrank. */
  function buildKitchen(st, kid, cx0, H, rect, blk) {
    const M = 0.6, mods = kitchenModules(kid), L = mods.length * M;
    const cx = clamp1(cx0, -RW + 0.05 + L / 2, RW - 0.05 - L / 2), x0 = cx - L / 2;
    const WALL = -RD, zb = WALL + 0.03, CD = 0.58, zf = zb + CD, FT = 0.018, zF = zf + FT, TOP0 = 0.86, TOP1 = 0.9, J = 0.003;
    const UB = 1.42, UT = 2.1, UD = 0.35, uzf = WALL + UD;
    const FRONT = kid === "nische" ? 0xf4f6f8 : kid === "einbau" ? 0xe9edf1 : 0xf3efe8;
    const CARC = 0xdfe3e8, PLINTH = 0x3a3f48, HANDLE = 0x9aa3ad;
    const WORK = kid === "nische" ? 0x8d9097 : kid === "einbau" ? 0xb08a5a : 0x5c6068;
    const run = mods.filter(m => m !== "kuehl").length * M;                  /* Unterschränke + Arbeitsplatte */
    /* Sockel (zurückgesetzt), durchgehender Korpus, Arbeitsplatte, Rückwand-Spritzschutz */
    st.box(L, 0.1, CD - 0.06, PLINTH, { x: cx, z: zb + (CD - 0.06) / 2 });
    st.box(run, TOP0 - 0.1, CD, CARC, { x: x0 + run / 2, y: 0.1, z: zb + CD / 2 });
    st.box(run, TOP1 - TOP0, zF + 0.03 - (WALL + 0.002), WORK, { x: x0 + run / 2, y: TOP0, z: (zF + 0.03 + WALL + 0.002) / 2, top: mixH(WORK, 0xffffff, 0.08) });
    st.box(run, 0.5, 0.01, mixH(FRONT, 0x9aa6b4, 0.25), { x: x0 + run / 2, y: TOP1, z: WALL + 0.005 });
    const door = (x, y0, y1, w, o) => {                                       /* Front mit Fuge, Griff waagerecht oben bzw. unten */
      st.box(w - 2 * J, y1 - y0 - 2 * J, FT, (o && o.c) || FRONT, { x, y: y0 + J, z: (o && o.zf != null ? o.zf : zf) + FT / 2 + 0.0005 });
      if (!(o && o.noHandle)) st.box(Math.min(0.2, w * 0.4), 0.012, 0.016, HANDLE, { x, y: o && o.hy != null ? o.hy : y1 - 0.06, z: (o && o.zf != null ? o.zf : zf) + FT + 0.012 });
    };
    const R = { x0, x1: x0 + L, zf: zF + 0.03, cx, L, mods: [] };
    mods.forEach((m, k) => {
      const x = x0 + (k + 0.5) * M;
      R.mods.push({ m, x });
      if (m === "kuehl") {
        /* Hochschrank mit Kühlschrank, bündig mit den Fronten, Griffe zur Zeile hin (Anschlag außen) */
        st.box(M, UT - 0.1, CD, CARC, { x, y: 0.1, z: zb + CD / 2 });
        door(x, 0.1, 1.3, M, { noHandle: true, c: 0xf6f7f8 });
        door(x, 1.3, UT, M, { noHandle: true, c: 0xf6f7f8 });
        [[0.7, 1.24], [1.36, 1.7]].forEach(([a, c]) => st.box(0.016, c - a, 0.022, HANDLE, { x: x - M / 2 + 0.06, y: a, z: zF + 0.014 }));
        st.box(0.12, 0.05, 0.004, 0x2a3a4a, { x, y: 1.18, z: zF + 0.002 });
        rect(x - M / 2, WALL, x + M / 2, zF);
        blk(x - M / 2, 0, WALL, x + M / 2, UT, zF);
        return;
      }
      if (m === "herd") {
        /* Backofen mit Glasfront und Bedienleiste, Kochfeld auf der Platte, Dunstabzug */
        st.box(M - 2 * J, 0.6, FT, 0x2a2f36, { x, y: 0.18, z: zf + FT / 2 + 0.0005 });
        st.box(M - 0.12, 0.34, 0.004, 0x10161c, { x, y: 0.3, z: zF + 0.002 });
        st.box(0.4, 0.014, 0.02, HANDLE, { x, y: 0.72, z: zF + 0.012 });
        door(x, 0.1, 0.18, M, { noHandle: true });
        st.box(M - 2 * J, 0.06, FT, 0x3a4048, { x, y: 0.79, z: zf + FT / 2 + 0.0005 });
        [-0.18, -0.06, 0.06, 0.18].forEach(dx => st.cyl(0.016, 0.016, 0.014, 8, 0xd8dde2, { x: x + dx, y: 0.82, z: zF, rx: PI / 2 }));
        st.box(0.56, 0.006, 0.5, 0x15171a, { x, y: TOP1, z: zb + 0.29 });
        [[-0.13, -0.11, 0.09], [0.13, -0.11, 0.07], [-0.13, 0.12, 0.07], [0.13, 0.12, 0.09]].forEach(([dx, dz, r]) => st.cyl(r, r, 0.002, 16, 0x3a3d44, { x: x + dx, y: TOP1 + 0.006, z: zb + 0.29 + dz }));
        /* Flachschirmhaube unter dem Hängeschrank (kein Kamin vor dem Firmenschild) */
        st.box(M - 0.01, 0.06, UD + 0.1, 0xc9ced6, { x, y: UB - 0.06, z: WALL + (UD + 0.1) / 2 });
        st.box(M - 0.06, 0.004, 0.08, 0x2a2f36, { x, y: UB - 0.064, z: WALL + UD + 0.04 });
      }
      if (m === "herd") { /* Front oben fertig */ }
      else if (m === "spuelm") { door(x, 0.1, TOP0, M, { noHandle: true }); st.box(0.3, 0.012, 0.02, HANDLE, { x, y: TOP0 - 0.05, z: zF + 0.012 }); st.box(0.05, 0.012, 0.004, 0x6fd38a, { x: x + 0.2, y: TOP0 - 0.045, z: zF + 0.002 }); }
      else if (m === "unter" || m === "mikro" || m === "kocher") {
        door(x, TOP0 - 0.16, TOP0, M);                                        /* Schublade */
        door(x, 0.1, TOP0 - 0.16, M, { hy: TOP0 - 0.22 });                    /* Tür */
      } else door(x, 0.1, TOP0, M, { hy: TOP0 - 0.08 });                      /* Spüle, Kaffee: hohe Tür */
      if (m === "spuele") {
        st.box(0.5, 0.004, 0.42, 0xc8ced6, { x, y: TOP1, z: zb + 0.3 });
        st.box(0.42, 0.003, 0.34, 0x8f98a3, { x, y: TOP1 + 0.004, z: zb + 0.31 });
        st.cyl(0.018, 0.018, 0.26, 8, 0xd8dde2, { x, y: TOP1, z: WALL + 0.08 });
        st.box(0.026, 0.026, 0.2, 0xd8dde2, { x, y: TOP1 + 0.24, z: WALL + 0.17 });
        st.box(0.016, 0.06, 0.016, 0xd8dde2, { x, y: TOP1 + 0.19, z: WALL + 0.27 });
        st.box(0.02, 0.012, 0.08, 0x9aa3ad, { x: x + 0.05, y: TOP1 + 0.2, z: WALL + 0.08, ry: 0.4 });
      }
      if (m === "mikro") {
        st.box(0.48, 0.28, 0.36, 0xe1e5ea, { x, y: TOP1, z: zb + 0.26 });
        st.box(0.3, 0.2, 0.004, 0x1d2228, { x: x - 0.05, y: TOP1 + 0.04, z: zb + 0.442 });
        st.box(0.08, 0.2, 0.004, 0x55606c, { x: x + 0.17, y: TOP1 + 0.04, z: zb + 0.442 });
      }
      if (m === "kocher") {
        st.cyl(0.075, 0.075, 0.012, 12, 0x2a2a30, { x, y: TOP1, z: zb + 0.3 });
        st.cyl(0.07, 0.06, 0.22, 12, 0xd9413a, { x, y: TOP1 + 0.012, z: zb + 0.3 });
        st.box(0.03, 0.12, 0.05, 0x2a2a30, { x: x + 0.08, y: TOP1 + 0.06, z: zb + 0.3 });
      }
      if (m === "kaffee") {
        /* Siebträger: ganz auf der Platte, Auslauf und Tasten nach vorn, darüber frei (offenes Brett mit Tassen) */
        const mz = zb + 0.26;
        st.box(0.46, 0.42, 0.38, 0xa83526, { x, y: TOP1, z: mz });
        st.box(0.48, 0.05, 0.4, 0xd8dde2, { x, y: TOP1 + 0.42, z: mz });
        st.box(0.36, 0.06, 0.012, 0xd8dde2, { x, y: TOP1 + 0.31, z: mz + 0.196 });
        st.cyl(0.035, 0.035, 0.06, 10, 0x2a2a30, { x: x - 0.08, y: TOP1 + 0.19, z: mz + 0.2 });
        st.box(0.12, 0.02, 0.02, 0x2a2a30, { x: x - 0.08, y: TOP1 + 0.2, z: mz + 0.25 });
        st.box(0.026, 0.026, 0.11, 0x1d1d20, { x: x - 0.08, y: TOP1 + 0.19, z: mz + 0.3, ry: 0.35 });
        st.box(0.2, 0.012, 0.12, 0x6a6f78, { x: x - 0.08, y: TOP1 + 0.002, z: mz + 0.2 });
        st.cyl(0.032, 0.026, 0.07, 10, 0xf6f1e6, { x: x - 0.08, y: TOP1 + 0.014, z: mz + 0.21 });
        [[0.1, 0x6fd38a], [0.16, 0xf2c230]].forEach(([dx, c]) => st.cyl(0.016, 0.016, 0.012, 10, c, { x: x + dx, y: TOP1 + 0.33, z: mz + 0.19, rx: PI / 2 }));
        st.cyl(0.03, 0.03, 0.02, 12, 0xffffff, { x: x + 0.13, y: TOP1 + 0.21, z: mz + 0.19, rx: PI / 2 });
        st.box(M - 0.04, 0.025, 0.25, FRONT, { x, y: 1.75, z: WALL + 0.125 });
        [-0.18, -0.06, 0.06, 0.18].forEach((dx, n) => st.cyl(0.035, 0.03, 0.08, 10, [0xf6f1e6, 0x3f78c8, 0xf6f1e6, 0xd9413a][n], { x: x + dx, y: 1.775, z: WALL + 0.12 }));
        return;
      }
      /* Hängeschrank im selben Raster */
      st.box(M - 0.002, UT - UB, UD - FT, CARC, { x, y: UB, z: WALL + (UD - FT) / 2 });
      door(x, UB, UT, M, { zf: WALL + UD - FT, hy: UB + 0.05 });
    });
    rect(x0, WALL, x0 + run, zF + 0.03);
    blk(x0, 0, WALL, x0 + run, TOP1, zF + 0.03);
    blk(x0, UB, WALL, x0 + L, UT, uzf);
    /* Esstisch: 1,2 m freie Fläche vor den Fronten (Türen und Schubladen gehen auf), dann Stuhl, dann Tisch */
    if (kid !== "nische") {
      const tw = 3.0, td = 1.0, tx = clamp1(cx - 0.2, -RW + 0.9 + tw / 2, RW - 0.9 - tw / 2), tz = zF + 0.03 + 1.2 + 0.28 + 0.72;
      st.box(tw, 0.04, td, 0xe4d3b6, { x: tx, y: 0.74, z: tz });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => st.box(0.05, 0.74, 0.05, 0x55606c, { x: tx + sx * (tw / 2 - 0.1), z: tz + sz * (td / 2 - 0.1) }));
      [-0.9, 0, 0.9].forEach(dx => [-1, 1].forEach(s => chair(st, tx + dx, tz + s * 0.72, s > 0 ? 0 : PI, 0xcbd6e2)));
      rect(tx - tw / 2 - 0.1, tz - td / 2 - 0.5, tx + tw / 2 + 0.1, tz + td / 2 + 0.5);
      blk(tx - tw / 2, 0.74, tz - td / 2, tx + tw / 2, 0.78, tz + td / 2);
      R.table = [tx, tz];
    }
    return R;
  }

  function chair(m, x, z, ry, col) {
    m.at({ x, z, ry }, () => {
      for (let k = 0; k < 5; k++) m.box(0.04, 0.03, 0.3, 0x2a2a30, { y: 0.04, ry: k * 2 * PI / 5, z: 0 });
      m.cyl(0.025, 0.025, SEAT_Y - 0.11, 6, 0x55606c, { y: 0.04 });
      m.cyl(0.23, 0.23, 0.07, 14, col, { y: SEAT_Y - 0.07 });
      m.box(0.44, 0.5, 0.06, col, { y: SEAT_Y + 0.1, z: 0.24, rx: -0.08 });
      m.box(0.05, 0.16, 0.04, 0x55606c, { y: SEAT_Y - 0.02, z: 0.22 });
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

  /* ---------------------------- Büro-Figur ----------------------------- */
  /* Aussehen aus dem gespeicherten Avatar; was der Avatar nicht kennt (Hose, Schuhe, Tassenfarbe), kommt aus der Personal-ID */
  function lookOf(p) {
    const av = Object.assign(avDefault(), p.av || {}), k = nameHash(p.id || p.name);
    const fem = AV.sexes[avWrap(av, "sex")] === "w";
    const sk = AV.skins[avWrap(av, "skin")], hc = AV.hairColors[avWrap(av, "hairColor")], ec = AV.eyeColors[avWrap(av, "eyes")], fit = AV.outfits[avWrap(av, "outfit")];
    const PANTS = [0x2f3a4a, 0x3d5a80, 0x4a4038, 0x26303c, 0x5a6470, 0x34495e], SHOES = [0x2a2a30, 0x5a3a24, 0x3a3f48, 0xe4e4e0];
    const SHIRT = [0xf2f2ee, 0x8fb0d8, 0xd9e2c8];
    const L = {
      fem, skin: hx(sk.base), skinS: hx(sk.shade), lips: hx(sk.lips), hair: hx(hc.base), hairS: hx(hc.shade), eye: hx(ec.mid),
      outfit: fit.id, oc: hx(fit.base), ocS: hx(fit.shade), ocT: hx(fit.trim),
      style: avHairList(av)[avWrap(av, "hair")], acc: AV.accessories[avWrap(av, "acc")], beard: fem ? "keiner" : AV.beards[avWrap(av, "beard")],
      pants: fit.id === "latzhose" ? hx(fit.base) : PANTS[k % PANTS.length], shoe: SHOES[(k >>> 4) % SHOES.length],
      under: SHIRT[(k >>> 7) % SHIRT.length], hatC: [0x2f6fb0, 0xd9413a, 0x2a2a30, 0x3f9a5a][(k >>> 9) % 4],
      cup: [0xd9413a, 0x3f78c8, 0xf6f1e6, 0x3f9a5a, 0xf2c230][(k >>> 11) % 5], role: p.role
    };
    L.sleeve = L.outfit === "warnweste" ? 0x3a4a5a : L.outfit === "latzhose" ? L.under : L.oc;
    L.tw = fem ? 0.27 : 0.31; L.td = fem ? 0.17 : 0.18; L.sh = fem ? 0.165 : 0.19;
    L.key = [L.fem, L.skin, L.hair, L.eye, L.outfit, L.style, L.acc, L.beard, L.pants, L.shoe, L.under, L.hatC, L.role].join(":");
    return L;
  }

  /* Kugelfläche nur dort, wo keep(Winkel von oben, Winkel von vorn) zutrifft – für Haaransatz, Bart, Mützen */
  function shell(b, r, col, keep, o) {
    o = o || {};
    const seg = o.seg || 18, rings = o.rings || 12, sx = o.sx || 1, sy = o.sy || 1, sz = o.sz || 1, c = o.c || [0, 0, 0];
    const N3 = (i, j) => { const th = j / rings * PI, ph = i / seg * 2 * PI; return [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)]; };
    const P = n => [c[0] + n[0] * r * sx, c[1] + n[1] * r * sy, c[2] + n[2] * r * sz];
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
      const thm = (j + 0.5) / rings * PI; let az = (i + 0.5) / seg * 2 * PI; if (az > PI) az -= 2 * PI;
      if (!keep(thm, az)) continue;
      const a = N3(i, j), bb = N3(i + 1, j), cc = N3(i + 1, j + 1), dd = N3(i, j + 1);
      if (j > 0) b.tri(P(a), P(cc), P(bb), col, a, cc, bb);
      if (j < rings - 1) b.tri(P(a), P(dd), P(cc), col, a, dd, cc);
    }
  }
  const smooth = (e0, e1, x) => ease((x - e0) / (e1 - e0));
  const hairLim = (F, Bk) => (th, az) => th < F + (Bk - F) * smooth(0.55, 2.3, Math.abs(az));

  /* Kopf: Drehpunkt am Hals (Figur y 0,82), Kopfmitte 0,13 darüber, nach +z blickend */
  const HC = [0, 0.13, 0], HR = 0.118, HSY = 1.06;
  function headMesh(L) {
    const b = new G3.MB(), skin = L.skin, hair = L.hair, hairS = L.hairS, brow = L.style === "glatze" ? mixH(L.skinS, 0x000000, 0.2) : mixH(hair, 0x000000, 0.3);
    G3.seed(5100 + (nameHash(L.key) % 997));
    b.sphere(HR, 16, 11, skin, { y: HC[1], sy: HSY, smooth: true });
    [-1, 1].forEach(s => b.sphere(0.026, 8, 6, mixH(skin, L.skinS, 0.4), { x: s * 0.116, y: 0.123, z: -0.004, sx: 0.5, smooth: true }));
    /* Augen: Weiß, Iris in Augenfarbe, Pupille, Glanzpunkt · Brauen · Nase */
    [-1, 1].forEach(s => {
      const ex = s * 0.042;
      b.sphere(0.021, 10, 7, 0xfbfbf8, { x: ex, y: 0.142, z: 0.104, sz: 0.5, smooth: true });
      b.sphere(0.0125, 10, 6, L.eye, { x: ex, y: 0.141, z: 0.1128, sz: 0.4, smooth: true });
      b.sphere(0.0062, 8, 5, 0x15171a, { x: ex, y: 0.141, z: 0.1162, sz: 0.4, smooth: true });
      b.box(0.004, 0.004, 0.002, 0xffffff, { x: ex + 0.004, y: 0.145, z: 0.1185 });
      b.box(0.042, 0.009, 0.012, brow, { x: ex, y: 0.168, z: 0.1045, rz: -s * 0.1 });
    });
    b.sphere(0.017, 10, 7, mixH(skin, L.skinS, 0.45), { y: 0.118, z: 0.113, sy: 1.25, sz: 0.85, smooth: true });
    /* Haare */
    const st = L.style, hc = { c: HC, sy: HSY };
    const S2 = (rm, keep, col, o) => shell(b, HR * rm, col == null ? hair : col, keep, Object.assign({}, hc, o || {}));
    if (st === "kurz") S2(1.05, hairLim(0.92, 1.9));
    else if (st === "seitenscheitel") { S2(1.06, (th, az) => th < (az > 0 ? 0.82 : 0.98) + (1.9 - 0.9) * smooth(0.55, 2.3, Math.abs(az))); b.box(0.13, 0.03, 0.05, hair, { x: 0.02, y: 0.238, z: 0.08, rz: -0.3, rx: 0.45 }); }
    else if (st === "undercut") { S2(1.1, hairLim(0.86, 1.2)); S2(1.02, (th, az) => th > 0.75 && hairLim(1.0, 1.9)(th, az), mixH(hair, skin, 0.45)); }
    const hat = L.acc === "cap" || L.acc === "muetze";
    if (st === "quiff" && hat) S2(1.05, hairLim(0.95, 1.85));
    else if (st === "quiff") { S2(1.05, hairLim(0.95, 1.85)); b.sphere(0.058, 9, 7, hair, { y: 0.245, z: 0.07, sy: 0.75, sz: 1.2, rx: -0.4, smooth: true }); b.sphere(0.046, 8, 6, hairS, { x: 0.02, y: 0.262, z: 0.03, sy: 0.7, smooth: true }); }
    else if (st === "locken") {
      S2(1.04, hairLim(0.9, 1.95));
      const r2 = rng(nameHash(L.key) + 3);
      for (let i = 0; i < 18; i++) {
        const th = 0.25 + r2() * 1.35, az = (r2() * 2 - 1) * PI;
        if (Math.abs(az) < 0.8 && th > 0.75) continue;
        const n = [Math.sin(th) * Math.sin(az), Math.cos(th), Math.sin(th) * Math.cos(az)], rr = HR * 1.04;
        b.sphere(0.034, 7, 5, i % 3 ? hair : hairS, { x: n[0] * rr, y: HC[1] + n[1] * rr * HSY, z: n[2] * rr, smooth: true });
      }
    } else if (st === "wellen") {
      S2(1.07, hairLim(0.86, 2.1));
      b.box(0.25, 0.24, 0.07, hair, { y: -0.09, z: -0.078 });
      [-0.08, 0, 0.08].forEach((dx, n) => b.sphere(0.045, 8, 6, n % 2 ? hairS : hair, { x: dx, y: -0.09, z: -0.075, sz: 0.8, smooth: true }));
      [-1, 1].forEach(s => b.box(0.05, 0.2, 0.07, hair, { x: s * 0.105, y: -0.04, z: -0.025 }));
    } else if (st === "zopf") {
      S2(1.04, hairLim(0.86, 1.9));
      b.sphere(0.028, 8, 6, mixH(hairS, 0xd9413a, 0.5), { y: 0.17, z: -0.128, smooth: true });
      b.box(0.055, 0.2, 0.05, hair, { y: -0.03, z: -0.15, rx: 0.22 });
      b.sphere(0.03, 8, 6, hairS, { y: -0.03, z: -0.137, smooth: true });
    } else if (st === "dutt") {
      S2(1.035, hairLim(0.88, 1.9));
      if (hat) b.sphere(0.05, 10, 7, hair, { y: 0.15, z: -0.14, smooth: true });          /* unter Cap/Mütze: Knoten im Nacken */
      else { b.sphere(0.055, 10, 7, hair, { y: 0.262, z: -0.06, smooth: true }); b.cyl(0.04, 0.04, 0.012, 12, hairS, { y: 0.225, z: -0.05, rx: -0.5 }); }
    } else if (st === "bob") S2(1.1, (th, az) => th < (Math.abs(az) < 0.75 ? 0.92 : 2.05));
    /* Bart */
    if (L.beard === "stoppeln") S2(1.008, (th, az) => th > 1.72 && Math.abs(az) < 1.75, mixH(skin, hair, 0.4));
    else if (L.beard === "schnauzer") b.sphere(0.03, 10, 6, hairS, { y: 0.1, z: 0.111, sy: 0.32, sz: 0.5, smooth: true });
    else if (L.beard === "vollbart") { S2(1.05, (th, az) => th > (Math.abs(az) < 0.5 ? 1.75 : 1.55) && Math.abs(az) < 1.9, hair); b.sphere(0.05, 10, 7, hair, { y: 0.045, z: 0.07, sy: 0.9, smooth: true }); }
    /* Brille, Cap, Mütze, Headset */
    if (L.acc === "brille") {
      const fc = 0x2a2a30;
      [-1, 1].forEach(s => {
        const ex = s * 0.043, z = 0.121;
        b.box(0.05, 0.006, 0.006, fc, { x: ex, y: 0.156, z }); b.box(0.05, 0.006, 0.006, fc, { x: ex, y: 0.124, z });
        b.box(0.006, 0.036, 0.006, fc, { x: ex - 0.025, y: 0.124, z }); b.box(0.006, 0.036, 0.006, fc, { x: ex + 0.025, y: 0.124, z });
        b.box(0.005, 0.005, 0.12, fc, { x: s * 0.118, y: 0.15, z: 0.062 });
      });
      b.box(0.02, 0.005, 0.005, fc, { y: 0.148, z: 0.123 });
    } else if (L.acc === "cap") {
      S2(1.09, hairLim(1.0, 1.25), L.hatC);
      b.box(0.15, 0.012, 0.1, mixH(L.hatC, 0x000000, 0.2), { y: 0.205, z: 0.14, rx: 0.15 });
    } else if (L.acc === "muetze") {
      S2(1.11, hairLim(0.95, 1.3), L.hatC);
      S2(1.13, (th, az) => { const lim = 0.95 + 0.35 * smooth(0.55, 2.3, Math.abs(az)); return th < lim && th > lim - 0.22; }, mixH(L.hatC, 0xffffff, 0.2));
      b.sphere(0.03, 8, 6, 0xf0f0ea, { y: 0.277, smooth: true });
    } else if (L.acc === "headset") {
      for (let k = -3; k <= 3; k++) { const a = k / 3 * 1.45; b.box(0.022, 0.012, 0.026, 0x2a2a30, { x: Math.sin(a) * 0.137, y: HC[1] + Math.cos(a) * 0.137 * HSY, rz: -a }); }
      [-1, 1].forEach(s => b.cyl(0.034, 0.034, 0.03, 12, 0x2a2a30, { x: s * 0.118, y: 0.122, rz: -s * PI / 2 }));
      b.box(0.008, 0.008, 0.16, 0x2a2a30, { x: -0.072, y: 0.105, z: 0.055, ry: 0.87, rx: 0.2 });
      b.sphere(0.012, 8, 6, 0x55606c, { x: -0.03, y: 0.092, z: 0.11, smooth: true });
    }
    return b;
  }
  /* Lider (Blinzeln) und Mund (beim Sprechen) als eigene kleine Teile */
  function lidsMesh(L) {
    const b = new G3.MB();
    [-1, 1].forEach(s => b.sphere(0.0225, 10, 7, L.skin, { x: s * 0.042, y: 0.142, z: 0.105, sz: 0.62, smooth: true }));
    return b;
  }
  function mouthMesh(L) { const b = new G3.MB(); b.box(0.042, 0.009, 0.01, mixH(L.lips, 0x000000, 0.35), { c: true }); return b; }
  const mouthZ = L => L.beard === "vollbart" ? 0.124 : L.beard === "stoppeln" ? 0.115 : 0.109;

  /* Oberkörper: Drehpunkt an der Taille (Figur y 0,42), Kleidung nach Avatar-Outfit, Namensschild in Rollenfarbe */
  function torsoMesh(L) {
    const b = new G3.MB(), tw = L.tw, td = L.td, f = td / 2, base = L.outfit === "warnweste" ? 0x3a4a5a : L.outfit === "latzhose" ? L.under : L.oc;
    b.box(tw - 0.03, 0.16, td - 0.01, base, { y: 0 });
    b.box(tw, 0.22, td, base, { y: 0.14 });
    b.box(tw - 0.07, 0.03, td - 0.04, base, { y: 0.36 });
    b.cyl(0.042, 0.04, 0.1, 10, mixH(L.skin, L.skinS, 0.25), { y: 0.355, smooth: true });
    let fz = 0.003;
    switch (L.outfit) {
      case "bluse":
        [-1, 1].forEach(s => b.box(0.06, 0.034, 0.012, L.ocT, { x: s * 0.03, y: 0.338, z: f - 0.012, rz: s * 0.55, rx: -0.2 }));
        b.box(0.012, 0.3, 0.004, L.ocS, { y: 0.04, z: f + 0.002 });
        [0.1, 0.18, 0.26].forEach(y => b.box(0.008, 0.008, 0.004, 0xc9ced6, { y, z: f + 0.004 }));
        b.box(0.06, 0.06, 0.004, L.ocS, { x: -0.07, y: 0.22, z: f + 0.002 });
        break;
      case "blaujacke":
        b.box(0.01, 0.34, 0.004, L.ocT, { y: 0.02, z: f + 0.002 });
        b.box(tw - 0.1, 0.045, td + 0.012, L.ocS, { y: 0.33 });
        [-1, 1].forEach(s => b.box(0.07, 0.05, 0.004, L.ocS, { x: s * 0.075, y: 0.05, z: f + 0.002 }));
        fz = 0.004; break;
      case "warnweste":
        [-1, 1].forEach(s => b.box(tw / 2 - 0.025, 0.33, 0.012, L.oc, { x: s * (tw / 4 + 0.008), y: 0.01, z: f + 0.004 }));
        b.box(tw - 0.02, 0.33, 0.012, L.oc, { y: 0.01, z: -f - 0.004 });
        [0.09, 0.19].forEach(y => {                                           /* Reflexstreifen nur auf den Westenteilen, nichts steht ab */
          [-1, 1].forEach(q => b.box(tw / 2 - 0.03, 0.024, 0.004, 0xe8ebe0, { x: q * (tw / 4 + 0.008), y, z: f + 0.012 }));
          b.box(tw - 0.03, 0.024, 0.004, 0xe8ebe0, { y, z: -f - 0.012 });
        });
        fz = 0.02; break;
      case "kapuzenpulli":
        b.box(tw - 0.07, 0.09, 0.07, L.ocS, { y: 0.29, z: -f - 0.025 });
        b.box(0.16, 0.08, 0.006, L.ocS, { y: 0.03, z: f + 0.003 });
        [-1, 1].forEach(s => b.box(0.006, 0.07, 0.004, L.ocT, { x: s * 0.025, y: 0.26, z: f + 0.004 }));
        b.box(tw - 0.024, 0.03, td - 0.004, L.ocS, { y: 0 });
        fz = 0.007; break;
      case "lederjacke":
        b.box(0.07, 0.3, 0.004, 0xe8e8e4, { y: 0.05, z: f + 0.002 });
        [-1, 1].forEach(s => b.box(0.05, 0.13, 0.008, L.ocT, { x: s * 0.05, y: 0.22, z: f + 0.004, rz: s * 0.25 }));
        fz = 0.01; break;
      case "latzhose":
        b.box(0.17, 0.22, 0.01, L.oc, { y: 0.0, z: f + 0.004 });
        b.box(tw - 0.02, 0.22, 0.01, L.oc, { y: 0.0, z: -f - 0.004 });
        [-1, 1].forEach(s => {
          b.box(0.035, 0.16, 0.008, L.oc, { x: s * 0.065, y: 0.2, z: f + 0.004 });
          b.box(0.035, 0.012, td + 0.016, L.oc, { x: s * 0.065, y: 0.36 });
          b.box(0.022, 0.022, 0.006, 0xe8c04a, { x: s * 0.065, y: 0.205, z: f + 0.011 });
        });
        fz = 0.012; break;
    }
    b.box(0.056, 0.03, 0.005, 0xffffff, { x: 0.075, y: 0.25, z: f + fz + 0.0025 });
    b.box(0.056, 0.01, 0.006, ROLE_COL[L.role] || 0x3f78c8, { x: 0.075, y: 0.27, z: f + fz + 0.003 });
    return b;
  }
  /* Becken auf dem Sitz, Oberschenkel waagerecht, Unterschenkel senkrecht, Füße flach auf dem Boden */
  function legsMesh(L) {
    const b = new G3.MB(), lx = L.fem ? 0.068 : 0.076, sole = mixH(L.shoe, 0x000000, 0.35);
    b.box(L.tw - 0.012, 0.13, L.td + 0.01, L.pants, { y: 0.317 });
    b.box(L.tw - 0.006, 0.025, L.td + 0.016, L.outfit === "latzhose" ? L.oc : 0x2a2a30, { y: 0.425 });
    [-1, 1].forEach(s => {
      const x = s * lx;
      b.box(0.1, 0.105, 0.36, L.pants, { x, y: 0.317, z: 0.12 });
      b.box(0.09, 0.3, 0.1, L.pants, { x, y: 0.035, z: 0.25 });
      b.box(0.1, 0.05, 0.17, L.shoe, { x, y: 0.008, z: 0.29 });
      b.box(0.104, 0.008, 0.176, sole, { x, y: 0, z: 0.29 });
    });
    return b;
  }
  /* Arme: Oberarm (Drehpunkt Schulter, hängt nach −y) und Unterarm mit Hand (Drehpunkt Ellbogen) */
  function upperMesh(L) {
    const b = new G3.MB();
    b.sphere(0.046, 10, 7, L.sleeve, { smooth: true });
    b.box(0.074, ARM_A, 0.08, L.sleeve, { y: -ARM_A });
    return b;
  }
  function foreMesh(L, side) {
    const b = new G3.MB();
    b.sphere(0.038, 9, 6, L.sleeve, { smooth: true });
    b.box(0.066, 0.2, 0.07, L.sleeve, { y: -0.2 });
    b.box(0.07, 0.022, 0.074, L.outfit === "kapuzenpulli" || L.outfit === "blaujacke" ? L.ocS : L.sleeve, { y: -0.212 });
    b.box(0.062, 0.078, 0.03, L.skin, { y: -0.288 });
    b.box(0.018, 0.046, 0.02, L.skin, { x: -side * 0.034, y: -0.262, z: 0.012, rz: -side * 0.4 });
    return b;
  }
  /* Kleine Dinge in Figureinheiten (Welt / 1,45): Tasse, Telefon, Maus, Stift */
  const U = v => v / FS;
  function cupMesh(c) { const b = new G3.MB(); b.cyl(U(0.04), U(0.036), U(0.1), 12, c, { top: 0x5a3a24 }); b.box(U(0.012), U(0.05), U(0.03), c, { x: U(0.045), y: U(0.025) }); return b; }
  function phoneMesh() { const b = new G3.MB(); b.box(U(0.075), U(0.01), U(0.15), 0x1d1d20, { y: 0 }); b.box(U(0.064), U(0.002), U(0.13), 0x2c4a6a, { y: U(0.01) }); return b; }
  function mouseMesh() { const b = new G3.MB(); b.sphere(U(0.035), 10, 6, 0x2a2a30, { sx: 0.85, sy: 0.45, sz: 1.35, y: U(0.004), smooth: true }); return b; }
  function penMesh() { const b = new G3.MB(); b.cyl(0.006, 0.006, 0.1, 6, 0x2a4a8a, { y: -0.05 }); return b; }

  /* Tätigkeiten: Gewicht je Rolle, Dauer, Haltung (Vorbeugen) */
  const ACTS = {
    type:  { w: { disp: 3, fahr: 1, ums: 1.5, zoll: 2.5 }, d: [4, 10], lean: 0.13 },
    mouse: { w: { disp: 3, fahr: 1.5, ums: 2, zoll: 1.5 }, d: [3, 8], lean: 0.1 },
    read:  { w: { disp: 1, fahr: 2, ums: 2, zoll: 3 }, d: [5, 10], lean: 0.17 },
    note:  { w: { disp: 1.5, fahr: 1, ums: 1.5, zoll: 2 }, d: [3, 7], lean: 0.2 },
    phone: { w: { disp: 2.5, fahr: 2, ums: 1.5, zoll: 1 }, d: [5, 8], lean: -0.03 },
    cup:   { w: { disp: 1, fahr: 1.5, ums: 1, zoll: 1 }, d: [4.6, 4.6], lean: 0.04 },
    look:  { w: { disp: 0.6, fahr: 1, ums: 0.8, zoll: 0.6 }, d: [2, 4], lean: -0.02 }
  };
  function pickAct(F) {
    const keys = Object.keys(ACTS).filter(k => k !== F.act || k === "type");
    const tot = keys.reduce((a, k) => a + (ACTS[k].w[F.L.role] || 1), 0);
    let r = F.rnd() * tot, k = keys[0];
    for (const x of keys) { r -= ACTS[x].w[F.L.role] || 1; if (r <= 0) { k = x; break; } }
    const D = ACTS[k].d;
    F.act = k; F.actT = 0; F.actDur = D[0] + F.rnd() * (D[1] - D[0]);
    F.held = null;
  }

  /* Figur zusammensetzen: Wurzel am Stuhl (Blick zum Bildschirm), alle Teile als Kinder */
  function buildFigure(R, s, M) {
    const L = lookOf(s.p), key = L.key;
    const root = R.node(null, { x: s.x, y: 0, z: s.z, ry: PI, s: FS });
    const part = (k, fn, o) => R.addChild(root, R.node(M(k, fn), o || {}));
    part("legs:" + key, () => legsMesh(L));
    const torso = part("torso:" + key, () => torsoMesh(L), { y: 0.42 });
    const head = part("head:" + key, () => headMesh(L), { y: 0.82 });
    const lids = R.addChild(head, R.node(M("lids:" + L.skin, () => lidsMesh(L)), { visible: false, shadow: false }));
    const mouth = R.addChild(head, R.node(M("mouth:" + L.lips + ":" + L.beard, () => mouthMesh(L)), { y: 0.086, z: mouthZ(L), shadow: false }));
    const arm = [1, -1].map(side => {
      const ua = part("ua:" + L.sleeve, () => upperMesh(L));
      const fa = R.addChild(ua, R.node(M("fa:" + side + ":" + L.sleeve + ":" + L.skin + ":" + L.outfit, () => foreMesh(L, side)), { y: -ARM_A }));
      return { side, ua, fa, S: [side * L.sh, 0.75, 0], T: null, H: [0, 0, 0], pole: [side * 0.25, -1, -0.45] };
    });
    const pen = R.addChild(arm[1].fa, R.node(M("pen", penMesh), { y: -0.27, z: 0.02, rx: 0.5, visible: false, shadow: false }));
    /* Desk-Gegenstände in Figur-Koordinaten (Welt → Figur: x und z gespiegelt, / 1,45) */
    const loc = (dx, y, dz) => [-dx / FS, y / FS, -(dz - CHAIR_D) / FS];
    const P = {
      kb: loc(-0.04, 0.778, 0.12), mouse: loc(0.34, 0.762, 0.12), note: loc(0.18, 0.768, 0.36), papers: loc(-0.52, 0.782, 0.17),
      phone: loc(-0.3, 0.76, 0.36), cup: loc(0.52, 0.76, 0.22), mon: loc(0, 1.15, -0.3)
    };
    const cup = part("cup:" + L.cup, () => cupMesh(L.cup), { x: P.cup[0], y: P.cup[1], z: P.cup[2], ry: 0.6, shadow: false });
    const phone = part("phone", phoneMesh, { x: P.phone[0], y: P.phone[1], z: P.phone[2], ry: -0.1, shadow: false });
    const mouse = part("mouse", mouseMesh, { x: P.mouse[0], y: P.mouse[1], z: P.mouse[2], shadow: false });
    const r0 = rng(nameHash(s.p.id || s.p.name) * 7 + 13);
    const F = Object.assign(s, {
      L, root, torso, head, lids, mouth, arm, pen, cup, phone, mouse, P, rnd: r0,
      lean: 0.1, tw: 0, br: 1, yaw: 0, pitch: 0.2, gaze: [0, 0], gazeT: 0,
      bF: 1.35 + r0() * 0.5, bP: r0() * 6.3, tP: [r0() * 6.3, r0() * 6.3], tF: 8 + r0() * 4,
      blinkAt: 1 + r0() * 4, blinkEnd: 0, talkUntil: 0, attendUntil: 0, lookUntil: 0, nextPeek: 2 + r0() * 6,
      act: null, actT: 0, actDur: 1, held: null, talkN: Math.floor(r0() * 5), lastSay: "", mPos: P.mouse.slice()
    });
    pickAct(F); F.actT = r0() * F.actDur * 0.8;
    arm.forEach(a => { a.T = rest(F, a.side); a.H = a.T.slice(); });
    return root;
  }
  const rest = (F, side) => [side * 0.15, 0.538, 0.3];

  /* Rumpf-Punkt (relativ zur Taille) → Figur-Koordinaten mit Vorbeugen, Drehen, Atmen */
  function torsoPt(F, x, y, z) {
    y *= F.br;
    const cl = Math.cos(F.lean), sl = Math.sin(F.lean), y1 = cl * y - sl * z, z1 = sl * y + cl * z;
    const ct = Math.cos(F.tw), st = Math.sin(F.tw);
    return [ct * x + st * z1, 0.42 + y1, -st * x + ct * z1];
  }
  /* Richtung → Drehwinkel (rx, rz) für ein Glied, das in Ruhe nach −y zeigt (Reihenfolge der Engine: Rz, dann Rx) */
  function dirRot(d) { return [Math.atan2(-d[2], -d[1]), Math.asin(clamp1(d[0], -1, 1))]; }
  function invRxRz(rx, rz, v) {
    const cx = Math.cos(rx), sx = Math.sin(rx), cz = Math.cos(rz), sz = Math.sin(rz);
    const y1 = cx * v[1] + sx * v[2], z1 = -sx * v[1] + cx * v[2];
    return [cz * v[0] + sz * y1, -sz * v[0] + cz * y1, z1];
  }
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  /* Zwei-Gelenk-Rechnung: Schulter S, Ziel T, Ellbogen zeigt Richtung pole */
  function solveArm(a, T) {
    const S = a.S, A = ARM_A, B = ARM_B;
    const dx = T[0] - S[0], dy = T[1] - S[1], dz = T[2] - S[2], d0 = Math.hypot(dx, dy, dz) || 1e-4;
    const d = clamp1(d0, Math.abs(A - B) + 0.03, A + B - 0.003), u = [dx / d0, dy / d0, dz / d0];
    const p = a.pole, pd = p[0] * u[0] + p[1] * u[1] + p[2] * u[2], w = nrm([p[0] - pd * u[0], p[1] - pd * u[1], p[2] - pd * u[2]]);
    const ca = clamp1((A * A + d * d - B * B) / (2 * A * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
    const E = [S[0] + A * (ca * u[0] + sa * w[0]), S[1] + A * (ca * u[1] + sa * w[1]), S[2] + A * (ca * u[2] + sa * w[2])];
    const Hh = [S[0] + u[0] * d, S[1] + u[1] * d, S[2] + u[2] * d];
    const ur = dirRot(nrm([E[0] - S[0], E[1] - S[1], E[2] - S[2]]));
    a.ua.x = S[0]; a.ua.y = S[1]; a.ua.z = S[2]; a.ua.rx = ur[0]; a.ua.rz = ur[1];
    const fr = dirRot(nrm(invRxRz(ur[0], ur[1], [Hh[0] - E[0], Hh[1] - E[1], Hh[2] - E[2]])));
    a.fa.rx = fr[0]; a.fa.rz = fr[1];
    a.H = Hh;
  }

  /* Ein Bild der Figur: Ziele je Tätigkeit, weich nachgeführt, dazu Atmen, Blinzeln, Blick, Sprechen */
  function animFigure(F, dt, now, pl) {
    F.actT += dt;
    if (F.actT >= F.actDur) pickAct(F);
    const A = F.act, P = F.P, k = F.actT, t = O.t, [L, Rr] = F.arm;
    const attend = now < F.attendUntil;
    const headset = F.L.acc === "headset";
    let tL = rest(F, 1), tR = rest(F, -1), look = P.mon, lean = ACTS[A].lean, talk = now < F.talkUntil, pen = false;
    let holdCup = false, holdPhone = false, poleL = [0.25, -1, -0.45], poleR = [-0.25, -1, -0.45];
    const kbL = [P.kb[0] + 0.085, P.kb[1] + 0.024, P.kb[2] - 0.012], kbR = [P.kb[0] - 0.075, P.kb[1] + 0.024, P.kb[2] - 0.012];
    const tap = (ph) => -0.007 * Math.pow(Math.max(0, Math.sin(t * F.tF + ph)), 6);
    let tapL = 0, tapR = 0;
    if (A === "type") {
      tL = [kbL[0] + Math.sin(t * 0.8 + F.tP[0]) * 0.02, kbL[1], kbL[2]];
      tR = [kbR[0] + Math.sin(t * 0.7 + F.tP[1]) * 0.02, kbR[1], kbR[2]];
      tapL = tap(F.tP[0]); tapR = tap(F.tP[1] + 1.7);
      if (Math.sin(t * 0.37 + F.bP) > 0.85) look = P.kb;
    } else if (A === "mouse" || ((A === "phone") && headset)) {
      const m = [P.mouse[0] + Math.sin(t * 1.3 + F.tP[0]) * 0.022 + Math.sin(t * 3.1) * 0.006, P.mouse[1], P.mouse[2] + Math.cos(t * 0.9 + F.tP[1]) * 0.018];
      F.mPos = m;
      tR = [m[0], m[1] + 0.032, m[2] - 0.005];
      tL = A === "phone" ? rest(F, 1) : [kbL[0] + 0.03, kbL[1] + 0.004, kbL[2] + 0.02];
      if (A === "phone") { talk = true; look = [0.6, 0.85, 1.2]; }
    } else if (A === "read") {
      tL = [P.papers[0] - 0.02, P.papers[1] + 0.02, P.papers[2] + 0.04];
      tR = [P.papers[0] - 0.13, P.papers[1] + 0.02, P.papers[2] - 0.06 + Math.sin(k * 0.6) * 0.02];
      look = [P.papers[0] - 0.05, P.papers[1], P.papers[2] - 0.02 + Math.sin(k * 0.5) * 0.05];
    } else if (A === "note") {
      pen = true;
      const line = Math.floor(k * 0.45) % 5;
      tR = [P.note[0] + 0.03 - ((k * 0.45) % 1) * 0.06 + Math.sin(t * 9) * 0.004, P.note[1] + 0.028 + Math.max(0, Math.sin(t * 15)) * 0.003, P.note[2] + 0.05 - line * 0.02];
      tL = [P.note[0] + 0.13, P.note[1] + 0.02, P.note[2] + 0.02];
      look = [P.note[0], P.note[1], P.note[2]];
    } else if (A === "phone") {
      const home = [P.phone[0] + 0.005, P.phone[1] + 0.03, P.phone[2]], hp = torsoPt(F, 0, 0.53, 0.02), ear = [hp[0] + 0.105, hp[1] - 0.02, hp[2] + 0.04];
      const e = F.actDur;
      poleL = [0.9, -0.55, 0.15];
      if (k < 0.8) tL = home;
      else if (k < 1.6) { tL = lerp3(home, ear, ease((k - 0.8) / 0.8)); holdPhone = true; }
      else if (k < e - 1.6) { tL = ear; holdPhone = true; talk = true; look = [0.7, 0.9, 1.3]; }
      else if (k < e - 0.8) { tL = lerp3(ear, home, ease((k - (e - 1.6)) / 0.8)); holdPhone = true; }
      else tL = rest(F, 1);
      tR = [P.mouse[0], P.mouse[1] + 0.032, P.mouse[2] - 0.005];
    } else if (A === "cup") {
      const grab = [P.cup[0] + 0.03, P.cup[1] + 0.045, P.cup[2] - 0.035], hp = torsoPt(F, 0, 0.53, 0.02), mouthP = [hp[0] - 0.03, hp[1] - 0.075, hp[2] + 0.14];
      if (k < 0.9) tR = lerp3(rest(F, -1), grab, ease(k / 0.9));
      else if (k < 1.7) { tR = lerp3(grab, mouthP, ease((k - 0.9) / 0.8)); holdCup = true; }
      else if (k < 3.0) { tR = mouthP; holdCup = true; look = [0, 1.0, 1.2]; }
      else if (k < 3.8) { tR = lerp3(mouthP, grab, ease((k - 3.0) / 0.8)); holdCup = true; }
      else tR = lerp3(grab, rest(F, -1), ease((k - 3.8) / 0.8));
    } else if (A === "look") {
      look = [Math.sin(F.bP * 3) * 0.6, 0.95 + Math.sin(F.bP) * 0.1, 1.1];
      lean = -0.03;
    }
    /* Spieler in der Nähe: gelegentlich aufschauen; angesprochen: zuwenden */
    let toPl = false;
    if (pl.d < 3.4 && pl.front) {
      if (t > F.nextPeek) { F.nextPeek = t + 6 + F.rnd() * 10; if (F.rnd() < 0.45 && !holdCup) F.lookUntil = now + 1500 + F.rnd() * 1300; }
      if (now < F.lookUntil || attend) toPl = true;
    } else if (attend && pl.front) toPl = true;
    if (attend && !holdCup && !holdPhone && A !== "phone") { tL = rest(F, 1); tR = rest(F, -1); lean = 0; pen = false; }
    /* Atmen, Rumpf */
    const kk = 1 - Math.exp(-dt * 3);
    F.br = 1 + Math.sin(t * F.bF + F.bP) * 0.009;
    F.lean += (lean - F.lean) * kk;
    let wantYaw, wantPitch;
    const hp = torsoPt(F, 0, 0.53, 0.02);
    if (toPl) { const dx = pl.l[0] - hp[0], dz = pl.l[2] - hp[2]; wantYaw = Math.atan2(dx, dz); wantPitch = Math.atan2(hp[1] - pl.l[1], Math.hypot(dx, dz)); }
    else {
      if (t > F.gazeT) { F.gazeT = t + 0.7 + F.rnd() * 1.6; F.gaze = [(F.rnd() - 0.5) * 0.12, (F.rnd() - 0.5) * 0.06]; }
      const dx = look[0] - hp[0], dz = look[2] - hp[2];
      wantYaw = Math.atan2(dx, dz) + F.gaze[0]; wantPitch = Math.atan2(hp[1] - look[1], Math.hypot(dx, dz)) + F.gaze[1];
    }
    wantYaw = clamp1(wantYaw, -1.2, 1.2); wantPitch = clamp1(wantPitch, -0.35, 0.7);
    const kh = 1 - Math.exp(-dt * (toPl ? 5 : 3.5));
    F.yaw = angTo(F.yaw, wantYaw, kh); F.pitch += (wantPitch - F.pitch) * kh;
    F.tw += (clamp1(F.yaw * 0.22, -0.25, 0.25) - F.tw) * kk;
    const T = F.torso; T.rx = F.lean; T.ry = F.tw; T.sy = F.br; T.sz = 1 + (F.br - 1) * 1.4;
    const np = torsoPt(F, 0, 0.4, 0);
    F.head.x = np[0]; F.head.y = np[1]; F.head.z = np[2];
    F.head.ry = F.yaw; F.head.rx = F.pitch; F.head.rz = Math.sin(t * 0.31 + F.bP) * 0.025;
    /* Hände weich ans Ziel, dann Arm-Rechnung */
    const kf = 1 - Math.exp(-dt * 7);
    [[L, tL, poleL, tapL], [Rr, tR, poleR, tapR]].forEach(([a, tg, pole, tp]) => {
      a.S = torsoPt(F, a.side * F.L.sh, 0.33, 0);
      a.pole = pole;
      a.T = lerp3(a.T, tg, kf);
      solveArm(a, tp ? [a.T[0], a.T[1] + tp, a.T[2]] : a.T);       /* Tastenanschlag direkt, ohne Nachziehen */
    });
    /* Gegenstände in der Hand */
    if (holdCup) { const h = Rr.H; F.cup.x = h[0] - 0.02; F.cup.y = h[1] - 0.045; F.cup.z = h[2] + 0.03; F.cup.rx = k > 1.7 && k < 3.0 ? -0.5 : -0.1; }
    else { F.cup.x = P.cup[0]; F.cup.y = P.cup[1]; F.cup.z = P.cup[2]; F.cup.rx = 0; }
    if (holdPhone) { const h = L.H; F.phone.x = h[0] - 0.01; F.phone.y = h[1] - 0.04; F.phone.z = h[2]; F.phone.rx = -1.2; F.phone.rz = 0.3; }
    else { F.phone.x = P.phone[0]; F.phone.y = P.phone[1]; F.phone.z = P.phone[2]; F.phone.rx = 0; F.phone.rz = 0; }
    if (A === "mouse" || (A === "phone" && !holdPhone)) { F.mouse.x = Rr.H[0]; F.mouse.z = Rr.H[2] + 0.005; }
    F.pen.visible = pen;
    /* Blinzeln, Sprechen */
    if (t > F.blinkAt) { F.blinkEnd = t + 0.12; F.blinkAt = t + 2.2 + F.rnd() * 4.5; }
    F.lids.visible = t < F.blinkEnd;
    F.mouth.sy = talk ? 1 + 1.8 * Math.abs(Math.sin(t * 11 + F.bP)) * (0.5 + 0.5 * Math.abs(Math.sin(t * 3.3))) : 1;
  }

  /* --------------------------- Wandbilder ------------------------------ */
  /* Whiteboard mit echten Zahlen des Standorts, Firmenschild */
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
  const companyCol = () => (S.livery && S.livery.c1) || (S.player && typeof COMPANY_COLORS !== "undefined" && COMPANY_COLORS[S.player.color]) || "#2f6fed";   /* nur lesen – livery() würde eine Lackierung anlegen */
  function signCanvas() {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 200;
    const g = c.getContext("2d"), name = (S.player && S.player.company) || "Spedition";
    g.font = "64px Bangers, 'Baloo 2', system-ui"; g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 12; g.strokeStyle = "#0d1b2a"; g.strokeText(name.toUpperCase(), 512, 104);
    g.fillStyle = companyCol(); g.fillText(name.toUpperCase(), 512, 104);
    return c;
  }

  /* Bildschirm je Rolle: einfache Logistika-Oberfläche mit echten Standortdaten (keine erfundenen Kennzahlen) */
  const fleetOf = b => b.vehicles.map(u => S.fleet.find(f => f.uid === u)).filter(Boolean);
  const busy = f => f.phase && f.phase !== "idle";
  const monthUnit = (role, n) => { const u = (typeof MOTM_UNIT !== "undefined" && MOTM_UNIT[role]) || ["Einsatz", "Einsätze"]; return n === 1 ? u[0] : u[1]; };
  const monthN = p => typeof staffMonthN === "function" ? Math.round(staffMonthN(p, gameMonth())) : 0;
  function screenData(b, p) {
    const fl = fleetOf(b), R = [];
    const vrow = f => { const v = vType(f.type); return [v ? v.name : "Fahrzeug", busy(f) ? "unterwegs" : "frei", busy(f)]; };
    let title, lines = [];
    if (p.role === "disp") {
      title = "Disposition";
      fl.slice(0, 4).forEach(f => R.push(vrow(f)));
      lines.push(fl.length ? fl.filter(busy).length + " von " + fl.length + " Fahrzeugen unterwegs" : "Noch keine Fahrzeuge am Standort");
      lines.push("Selbst disponiert: " + (b.done || 0) + " Touren");
    } else if (p.role === "fahr") {
      title = "Fahrplan";
      const mine = fl.find(f => f.driver === p.id);
      if (mine) { R.push(vrow(mine)); lines.push("Fest eingeteilt"); }
      else { fl.filter(f => !f.driver).slice(0, 3).forEach(f => R.push(vrow(f))); lines.push("Fahrerpool: Platz für " + driverCap(b) + " Fahrzeuge"); }
    } else if (p.role === "ums") {
      title = "Umschlag";
      fl.filter(f => !busy(f)).slice(0, 3).forEach(f => R.push(vrow(f)));
      lines.push("Umschlagzeit hier: −" + Math.round((1 - umschlagFactor(b.node)) * 100) + " %");
      lines.push("Stellplätze: " + b.vehicles.length + " / " + tierOf(b).slots);
    } else {
      title = "Zoll & Papiere";
      lines.push("Aufschlag auf Aufträge: +" + Math.round(baseBonus(b) * 1000) / 10 + " %");
      lines.push("Zollteam: " + b.staff.filter(s => s.role === "zoll").length + " Person(en)");
    }
    const n = monthN(p);
    lines.push("Mein Monat: " + n + " " + monthUnit(p.role, n));
    return { title, R, lines, day: dayOf(S.time) };
  }
  function screenCanvas(c, b, p) {
    const g = c.getContext("2d"), D = screenData(b, p), W = c.width, Hh = c.height;
    g.fillStyle = "#eef3f9"; g.fillRect(0, 0, W, Hh);
    g.fillStyle = "#2f6fed"; g.fillRect(0, 0, W, 26);
    g.fillStyle = "#fff"; g.font = "800 14px 'Baloo 2', system-ui, sans-serif"; g.textBaseline = "middle";
    g.fillText("LOGISTIKA · " + D.title, 8, 14);
    g.textAlign = "right"; g.font = "700 12px system-ui, sans-serif"; g.fillText("Tag " + D.day, W - 8, 14); g.textAlign = "left";
    let y = 40;
    if (p.role === "disp" || p.role === "ums") {
      /* dekorative Kartenskizze ohne Zahlen */
      g.strokeStyle = "#b9c8da"; g.lineWidth = 2; g.beginPath(); g.moveTo(W - 92, 112); g.bezierCurveTo(W - 70, 60, W - 40, 100, W - 14, 46); g.stroke();
      [[W - 92, 112], [W - 14, 46]].forEach(([x, yy]) => { g.fillStyle = "#d9413a"; g.beginPath(); g.arc(x, yy, 4, 0, 7); g.fill(); });
    }
    g.font = "700 12px system-ui, sans-serif";
    D.R.forEach(([n, s, on]) => {
      g.fillStyle = "#ffffff"; g.fillRect(8, y - 9, p.role === "fahr" || p.role === "zoll" ? W - 16 : W - 108, 18);
      g.fillStyle = "#22303f"; g.fillText(n.length > 18 ? n.slice(0, 17) + "…" : n, 12, y);
      g.fillStyle = on ? "#2f6fed" : "#3f9a5a"; g.textAlign = "right"; g.fillText(s, (p.role === "fahr" || p.role === "zoll" ? W - 12 : W - 112), y); g.textAlign = "left";
      y += 21;
    });
    y = Math.max(y + 2, Hh - 12 - (D.lines.length - 1) * 16);
    g.fillStyle = "#22303f"; g.font = "700 11.5px system-ui, sans-serif";
    D.lines.forEach((l, i) => g.fillText(l, 8, y + i * 16 - (D.lines.length - 1) * 0));
    return JSON.stringify(D);
  }

  /* Poster „Mitarbeiter des Monats“ – aus b.motm (Momentaufnahme mit Name, Rolle, Avatar, Grund) */
  function motmState(b) {
    const m = typeof motmCheck === "function" ? motmCheck(b) : null;
    if (!m) return { kind: "none" };
    if (m.none) return { kind: m.start ? "start" : "none", m };
    let where = null;
    if (!b.staff.some(s => s.id === m.id)) {
      const other = (S.bases || []).find(x => x.staff.some(s => s.id === m.id));
      where = other ? "Inzwischen am Standort " + N[other.node].short : "Inzwischen nicht mehr im Team";
    }
    return { kind: "winner", m, where };
  }
  function wrapText(g, s, x, y, w, lh, max) {
    const words = String(s).split(" "); let line = "", n = 0;
    for (const wd of words) {
      const tt = line ? line + " " + wd : wd;
      if (g.measureText(tt).width > w && line) { g.fillText(line, x, y + n * lh); line = wd; if (++n >= max - 1) break; }
      else line = tt;
    }
    if (line) g.fillText(line, x, y + n * lh);
  }
  const posterKey = b => { const st = motmState(b); return st.kind + ":" + (st.m ? st.m.k + ":" + (st.m.id || "") : "") + ":" + (st.where || "") + ":" + b.staff.length; };
  function posterCanvas(b, img) {
    const c = document.createElement("canvas"); c.width = 384; c.height = 512;
    drawPoster(c, b, img);
    return c;
  }
  function drawPoster(c, b, img) {
    const g = c.getContext("2d"), W = c.width, st = motmState(b), m = st.m, col = companyCol();
    g.fillStyle = "#fffdf6"; g.fillRect(0, 0, W, 512);
    g.fillStyle = col; g.fillRect(0, 0, W, 92);
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "40px Bangers, 'Baloo 2', system-ui"; g.lineWidth = 6; g.strokeStyle = "#0d1b2a";
    g.strokeText("MITARBEITER", W / 2, 32); g.fillText("MITARBEITER", W / 2, 32);
    g.strokeText("DES MONATS", W / 2, 70); g.fillText("DES MONATS", W / 2, 70);
    g.fillStyle = "#0d1b2a"; g.font = "800 17px 'Baloo 2', system-ui, sans-serif";
    g.fillText("Standort " + N[b.node].short + (m && !m.start ? " · " + gameMonthName(m.k) : ""), W / 2, 114);
    /* Porträt */
    const cx = W / 2, cy = 222, r = 84;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.closePath(); g.fillStyle = "#cfe3fb"; g.fill(); g.clip();
    if (st.kind === "winner") {
      if (img) g.drawImage(img, cx - r, cy - r, 2 * r, 2 * r);
      else portrait2D(g, cx, cy, r, m.av);
    } else {
      g.fillStyle = "#9fb3c8"; g.beginPath(); g.arc(cx, cy - 18, 34, 0, 7); g.fill();
      g.beginPath(); g.ellipse(cx, cy + 70, 62, 48, 0, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.font = "800 44px 'Baloo 2', system-ui"; g.fillText("?", cx, cy - 16);
    }
    g.restore();
    g.lineWidth = 6; g.strokeStyle = "#0d1b2a"; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.fillStyle = "#0d1b2a";
    if (st.kind === "winner") {
      g.font = "800 27px 'Baloo 2', system-ui, sans-serif"; g.fillText(m.name, W / 2, 338);
      g.font = "700 17px system-ui, sans-serif"; g.fillStyle = hs6(ROLE_COL[m.role] || 0x3f78c8);
      g.fillText((ROLES[m.role] ? ROLES[m.role].name : "Team"), W / 2, 368);
      g.fillStyle = "#2a2a30"; g.font = "600 16px system-ui, sans-serif";
      wrapText(g, m.why, W / 2, 404, W - 48, 21, 3);
      if (st.where) { g.fillStyle = "#7a8594"; g.font = "italic 600 14px system-ui, sans-serif"; g.fillText(st.where, W / 2, 478); }
    } else {
      g.font = "800 22px 'Baloo 2', system-ui, sans-serif";
      g.fillText(st.kind === "start" ? "Noch offen" : b.staff.length ? "Diesmal niemand" : "Noch kein Team", W / 2, 345);
      g.fillStyle = "#2a2a30"; g.font = "600 16px system-ui, sans-serif";
      wrapText(g, m ? m.why : "Noch kein Personal.", W / 2, 386, W - 56, 21, 4);
    }
    g.textAlign = "left";
    return st;
  }
  /* Ersatz-Porträt in Avatar-Farben, falls das SVG-Bild nicht in die Textur darf */
  function portrait2D(g, cx, cy, r, av) {
    const L = lookOf({ id: "x", av: av || {}, role: "disp" });
    g.fillStyle = hs6(L.sleeve); g.beginPath(); g.ellipse(cx, cy + r * 0.95, r * 0.75, r * 0.5, 0, 0, 7); g.fill();
    g.fillStyle = hs6(L.skin); g.fillRect(cx - r * 0.13, cy + r * 0.2, r * 0.26, r * 0.3);
    g.beginPath(); g.ellipse(cx, cy - r * 0.05, r * 0.42, r * 0.5, 0, 0, 7); g.fill();
    if (L.style !== "glatze") { g.fillStyle = hs6(L.hair); g.beginPath(); g.ellipse(cx, cy - r * 0.32, r * 0.46, r * 0.3, 0, PI, 2 * PI); g.fill(); }
    g.fillStyle = "#15171a"; [-1, 1].forEach(s => { g.beginPath(); g.arc(cx + s * r * 0.15, cy - r * 0.06, r * 0.045, 0, 7); g.fill(); });
    g.strokeStyle = hs6(mixH(L.lips, 0x000000, 0.3)); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy + r * 0.12, r * 0.12, 0.2, PI - 0.2); g.stroke();
  }
  function posterPortrait(b, tex, c) {
    const st = motmState(b);
    if (st.kind !== "winner" || !st.m.av || typeof avatarSVG !== "function") return;
    const img = new Image(), tok = O && O.tok, fl = O && O.floor;
    img.onload = () => {
      if (!O || O.tok !== tok || O.floor !== fl || !tex.tex) return;
      drawPoster(c, b, img);
      try { O.R.texUpdate(tex); } catch (e) { drawPoster(c, b, null); try { O.R.texUpdate(tex); } catch (e2) { /* egal */ } }
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(avatarSVG(st.m.av, 168, { uid: "mm" + b.id, bg: false }));
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
      <div class="ofp-card" id="ofpCard" role="dialog" aria-modal="false" aria-label="Mitarbeiter des Monats"></div>
      <div id="officeBoot"></div>`;
    document.body.appendChild(el);
    document.body.classList.add("office3d");
    const tok = ++SEQ;
    O = { el, b, tok, floor: Math.max(0, Math.min(tierFloors(tierOf(b)) - 1, floor || 0)), alive: true, meshes: [], texs: [], mcache: new Map() };
    el.querySelector("#ofpX").onclick = leave;
    /* Statusleiste dunkel wie die Szene (iPhone: Farbe der Leiste kommt aus theme-color) */
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { O.theme = meta.getAttribute("content"); meta.setAttribute("content", "#0d1b2a"); }

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
    const t0 = performance.now(), live = () => O && O.alive && O.tok === tok;   /* v257: alte Rückrufe nach schnellem Verlassen/Betreten ins Leere laufen lassen */
    requestAnimationFrame(() => setTimeout(() => {
      if (!live()) return;
      let ok = false;
      try { ok = start(); } catch (e) { console.warn("Büro 3D", e); }
      if (!ok) { toast("Die 3D-Ansicht läuft auf diesem Gerät nicht.", "warn"); leave(); return; }
      const wait = Math.max(0, 1700 - (performance.now() - t0));
      setTimeout(() => {
        if (!live()) return;
        const out = () => { if (!live()) return; ld.classList.add("out"); setTimeout(() => ld.remove(), 450); const h = el.querySelector("#ofpHint"); if (h) { h.classList.add("on"); setTimeout(() => h.classList.remove("on"), 5200); } };
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
    O.reduced = reduced();
    buildFloor(true);
    bindInput();
    O.last = performance.now(); O.t = 0;
    const frame = now => {
      if (!O || !O.alive || O.R !== R) return;
      const dt = Math.max(0, Math.min(0.05, (now - O.last) / 1000)); O.last = now; O.t += dt;
      step(dt, now);
      try { R.render(O.t); } catch (e) { /* Kontextverlust */ }
      O.raf = requestAnimationFrame(frame);
    };
    O.raf = requestAnimationFrame(frame);
    return true;
  }

  /* Wer auf dieser Etage sitzt – ändert sich das (Kündigung, Versetzung, Einstellung), wird die Etage neu aufgebaut */
  const staffSig = (b, fl) => tierOf(b).desks + "|" + b.staff.map((s, i) => deskFloor(b, i) === fl ? i + ":" + s.id + ":" + s.role + ":" + JSON.stringify(s.av || {}) : "").join(",");

  /* Etage aufbauen (beim Betreten, Etagenwechsel und wenn sich das Team ändert) – vorher alles Alte freigeben */
  function freeFloor() {
    const R = O.R;
    O.meshes.forEach(m => R.free(m)); O.meshes = []; O.mcache.clear();
    O.texs.forEach(t => R.texFree(t)); O.texs = [];
    R.nodes.length = 0;
  }
  function buildFloor(first, keepPos) {
    const R = O.R, b = O.b;
    freeFloor();
    const room = buildRoom(b, O.floor);
    const M1 = mb => { const m = R.mesh(mb); O.meshes.push(m); return m; };
    const M = (k, fn) => { let m = O.mcache.get(k); if (!m) { m = M1(fn()); O.mcache.set(k, m); } return m; };
    const TX = cv => { const t = R.texture(cv); O.texs.push(t); return t; };
    R.nodes.push(R.node(M1(room.st), { shadow: true }));
    R.nodes.push(R.node(M1(room.shell), { shadow: false, glow: 0.55 }));     /* Decke: von unten sonst zu dunkel */
    R.nodes.push(R.node(M1(room.trim), { shadow: false }));
    R.nodes.push(R.node(M1(room.glow), { shadow: false, glow: 0.85 }));
    /* Personal */
    O.staff = room.seats.map(s => { R.nodes.push(buildFigure(R, s, M)); return s; });
    /* Bildschirme (256 × 160, nur bei geänderten Daten und höchstens alle paar Sekunden neu) */
    O.screens = room.screens.map((s, n) => {
      const c = document.createElement("canvas"); c.width = 256; c.height = 160;
      const sig = screenCanvas(c, b, s.p), t = TX(c);
      R.nodes.push(R.node(null, { x: s.x, y: s.y, z: s.z, decal: { t, w: 0.6, h: 0.36 } }));
      return Object.assign(s, { c, t, sig, next: performance.now() + 10000 + n * 700 });
    });
    /* Wandtafeln, Firmenschild über der Küche, Poster */
    R.nodes.push(R.node(null, { x: -2.6, y: 1.55, z: RD - 0.012, ry: PI, decal: { t: TX(boardCanvas(b)), w: 2.4, h: 1.5 } }));
    R.nodes.push(R.node(null, { x: -2.4, y: room.H - 0.42, z: -RD + 0.012, decal: { t: TX(signCanvas()), w: 3.6, h: 0.703 } }));
    const pc = posterCanvas(b, null), pt = TX(pc), P = room.poster;
    R.nodes.push(R.node(null, { x: P.x, y: P.y, z: RD - 0.037, ry: PI, decal: { t: pt, w: P.w, h: P.h } }));
    O.poster = Object.assign({}, P, { c: pc, t: pt, k: posterKey(b) });
    posterPortrait(b, pt, pc);
    O.ob = room.ob; O.occ = room.occ; O.H = room.H; O.kitchen = room.kitchen;
    O.sig = staffSig(b, O.floor); O.pollAt = performance.now() + 3000;          /* echte Zeit, unabhängig von der Bildrate */
    if (!keepPos) {
      /* Startpunkt: in der Tür (EG) bzw. oben an der Treppe */
      const sp = O.floor > 0 && room.stairs ? room.stairs : room.door;
      O.pos = [sp[0], sp[1]]; O.pitch = 0.06;
      O.yaw = Math.atan2(-(0.6 - sp[1]), -(-0.6 - sp[0]));          /* Blick zur Raummitte: Blickrichtung = (−cos yaw, −sin yaw) */
    } else collide(O.pos);
    const fl = O.el.querySelector(".ofp-fl"), multi = tierFloors(tierOf(b)) > 1;
    if (fl) fl.textContent = multi ? " · " + floorName(O.floor) : "";
    const fb = O.el.querySelector(".ofp-floors");
    if (fb) {
      fb.innerHTML = multi ? Array.from({ length: tierFloors(tierOf(b)) }, (_, f) => `<button class="${f === O.floor ? "on" : ""}" data-ofl="${f}">${f === 0 ? "EG" : f + ". OG"}</button>`).join("") : "";
      fb.querySelectorAll("[data-ofl]").forEach(x => x.onclick = () => { const f = +x.dataset.ofl; if (O && f !== O.floor) { O.floor = f; buildFloor(false); } });
    }
    if (!first) { const s = O.el.querySelector("#ofpSay"); if (s) s.classList.remove("on"); O.sayAt = null; closeCard(); }
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
  function step(dt, now) {
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
    /* v257: Kopfwippen beim Gehen nur noch 1 cm (vorher 2,5 cm), bei „Bewegung reduzieren“ gar nicht */
    const bob = O.reduced ? 0 : Math.sin(O.bob || 0) * 0.01 * Math.min(1, l);
    const c = O.R.cam, cp = Math.cos(O.pitch), spp = Math.sin(O.pitch);
    c.yaw = O.yaw; c.pitch = O.pitch;
    const ex = O.pos[0], ey = (O.dbgEye || EYE) + bob, ez = O.pos[1];          /* dbgEye nur für Browser-Tests (Draufsicht) */
    c.tx = ex - Math.cos(O.yaw) * cp * c.dist; c.ty = ey - spp * c.dist; c.tz = ez - Math.sin(O.yaw) * cp * c.dist;
    /* Personal: Gliederpuppe statt Hüpfen (vorher hob sich die ganze Figur 7-mal pro Sekunde und pendelte um die Hochachse) */
    (O.staff || []).forEach(st => {
      const dx = O.pos[0] - st.x, dz = O.pos[1] - st.z;
      const pl = { d: Math.hypot(dx, dz), front: -dz / FS > -0.3, l: [-dx / FS, EYE / FS, -dz / FS] };
      animFigure(st, dt, now, pl);
    });
    /* Sprechblase folgt dem Kopf */
    if (O.sayAt) {
      const p = O.R.project(O.sayAt.x, 1.62, O.sayAt.z), el = O.el.querySelector("#ofpSay");
      if (el && p && p[2] < 1) { el.style.left = p[0] + "px"; el.style.top = p[1] + "px"; }
      if (now > O.sayUntil) { O.sayAt = null; if (el) el.classList.remove("on"); }
    }
    /* Bildschirme: höchstens ein Bild je Durchgang, nur wenn sich die Daten geändert haben */
    let up = 1;
    (O.screens || []).forEach(s => {
      if (now < s.next || up <= 0) return;
      s.next = now + 12000;
      const sig = JSON.stringify(screenData(O.b, s.p));
      if (sig !== s.sig) { s.sig = screenCanvas(s.c, O.b, s.p); O.R.texUpdate(s.t); up--; }
    });
    /* Team oder Auszeichnung geändert? */
    if (now > O.pollAt) {
      O.pollAt = now + 3000;
      const b = typeof baseById === "function" ? baseById(O.b.id) : null;
      if (!b) { leave(); return; }
      O.b = b;
      if (staffSig(b, O.floor) !== O.sig) { buildFloor(false, true); return; }
      const mk = posterKey(b);
      if (O.poster && mk !== O.poster.k) { O.poster.k = mk; drawPoster(O.poster.c, b, null); O.R.texUpdate(O.poster.t); posterPortrait(b, O.poster.t, O.poster.c); }
    }
  }

  /* ------------------------------- Eingabe ----------------------------- */
  function bindInput() {
    const el = O.el, cv = el.querySelector("#ofpCv"), joy = el.querySelector("#ofpJoy"), knob = joy.querySelector("i");
    const I = O.in = { jx: 0, jy: 0, k: {}, look: null, joyId: null };
    /* Umsehen: auf der Fläche ziehen; kurzer Tipp = ansprechen. Joystick und Umsehen laufen mit zwei Fingern gleichzeitig. */
    cv.addEventListener("pointerdown", e => {
      if (I.look && I.look.id !== e.pointerId && performance.now() - I.look.seen > 1500) I.look = null;   /* verlorener Finger */
      if (I.look) return;
      I.look = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), seen: performance.now() };
      try { cv.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
    });
    cv.addEventListener("pointermove", e => {
      const L = I.look; if (!L || L.id !== e.pointerId) return;
      const k = e.pointerType === "mouse" ? 0.0042 : 0.0058;
      O.yaw += (e.clientX - L.x) * k;
      O.pitch = Math.max(-1.1, Math.min(1.1, O.pitch + (e.clientY - L.y) * k));
      L.x = e.clientX; L.y = e.clientY; L.seen = performance.now();
    });
    const up = e => {
      const L = I.look; if (!L || L.id !== e.pointerId) return;
      I.look = null;
      if (Math.hypot(e.clientX - L.x0, e.clientY - L.y0) < 8 && performance.now() - L.t < 450) tapAt(e.clientX, e.clientY);
    };
    cv.addEventListener("pointerup", up);
    const lost = e => { if (I.look && I.look.id === e.pointerId) I.look = null; };
    cv.addEventListener("pointercancel", lost); cv.addEventListener("lostpointercapture", lost);
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
    joy.addEventListener("pointerup", joyEnd); joy.addEventListener("pointercancel", joyEnd); joy.addEventListener("lostpointercapture", joyEnd);
    /* Tastatur */
    const MAP = { KeyW: "w", ArrowUp: "w", KeyS: "s", ArrowDown: "s", KeyA: "a", KeyD: "d", ArrowLeft: "l", ArrowRight: "r", KeyQ: "l", KeyE: "r" };
    O.key = e => {
      if (e.code === "Escape" && e.type === "keydown") { if (O.cardOpen) closeCard(); else leave(); return; }
      const k = MAP[e.code]; if (!k) return;
      I.k[k] = e.type === "keydown"; e.preventDefault();
    };
    window.addEventListener("keydown", O.key); window.addEventListener("keyup", O.key);
    O.blur = () => { I.k = {}; I.jx = I.jy = 0; I.joyId = null; I.look = null; knob.style.transform = ""; };
    window.addEventListener("blur", O.blur);
  }

  /* Sichtprüfung: verdeckt ein Möbelstück die Strecke Auge → Ziel? */
  function eyePt() { return [O.pos[0], O.R.cam.ty, O.pos[1]]; }
  function blocked(from, to, ignore) {
    const d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]], len = Math.hypot(d[0], d[1], d[2]) || 1e-4;
    const r = { o: from, d: [d[0] / len, d[1] / len, d[2] / len] };
    for (const [lo, hi] of O.occ) {
      if (ignore && ignore(lo, hi)) continue;
      const t = O.R.hitBox(r, lo, hi);
      if (t != null && t < len - 0.05) return true;
    }
    return false;
  }
  function tapAt(x, y) {
    if (O.cardOpen) { closeCard(); return; }
    const rc = O.el.querySelector("#ofpCv").getBoundingClientRect(), px = x - rc.left, py = y - rc.top;
    const ray = O.R.ray(px, py), eye = eyePt();
    let best = null;
    /* 1. Strahl trifft eine Figur (Kasten um Oberkörper und Kopf) */
    (O.staff || []).forEach(st => {
      const t = O.R.hitBox(ray, [st.x - 0.3, 0.45, st.z - 0.42], [st.x + 0.3, 1.62, st.z + 0.22]);
      if (t != null && (!best || t < best.t)) best = { st, t };
    });
    /* 2. knapp daneben: nächster Kopf auf dem Bildschirm (36 px) */
    if (!best) (O.staff || []).forEach(st => {
      const p = O.R.project(st.x, 1.35, st.z); if (!p || p[2] > 1) return;
      const dd = Math.hypot(p[0] - px, p[1] - py);
      if (dd < 36 && (!best || dd < best.dd)) best = { st, dd, t: Math.hypot(st.x - eye[0], 1.35 - eye[1], st.z - eye[2]) };
    });
    /* Poster */
    const P = O.poster, tp = P ? O.R.hitBox(ray, [P.x - P.w / 2 - 0.04, P.y - P.h / 2 - 0.04, RD - 0.06], [P.x + P.w / 2 + 0.04, P.y + P.h / 2 + 0.04, RD]) : null;
    if (tp != null && (!best || tp < best.t)) {
      if (tp > TALK_RANGE + 1.5) return hint("Zu weit weg – geh näher an das Poster heran.");
      if (blocked(eye, [P.x, P.y, RD - 0.04])) return hint("Da steht etwas im Weg.");
      return openCard();
    }
    if (!best) return;
    const s = best.st;
    const vis = [1.42, 1.05].some(h => !blocked(eye, [s.x, h, s.z - 0.05]));
    if (!vis) return hint("Da steht etwas im Weg – geh um den Tisch herum.");
    if (best.t > TALK_RANGE) return hint("Zu weit weg – geh näher an " + s.p.name.split(" ")[0] + " heran.");
    say(s);
  }
  function hint(t) {
    const h = O.el.querySelector("#ofpHint"); if (!h) return;
    h.textContent = t; h.classList.add("on");
    clearTimeout(O.hintT); O.hintT = setTimeout(() => { if (O) h.classList.remove("on"); }, 2600);
  }

  /* Gespräch: was die Person gerade tut, dazu prüfbare Fakten aus dem Spielstand – der Reihe nach, ohne direkte Wiederholung */
  const ACT_SAY = {
    type: { disp: ["Ich trage gerade die nächsten Touren ein.", "Moment, ich tippe noch den Frachtbrief fertig."], fahr: ["Ich schreibe kurz meinen Fahrbericht."], ums: ["Ich trage gerade die Ladeliste ein."], zoll: ["Ich fülle gerade eine Zollanmeldung aus."] },
    mouse: { disp: ["Ich schaue mir gerade die Routen auf der Karte an."], fahr: ["Ich prüfe gerade die Strecke."], ums: ["Ich plane die Rampen für die nächsten Fahrzeuge."], zoll: ["Ich gleiche gerade Tarifnummern ab."] },
    read: { disp: ["Ich lese mir die neuen Anfragen durch."], fahr: ["Ich gehe die Lieferscheine durch."], ums: ["Ich prüfe gerade die Packlisten."], zoll: ["Ich prüfe gerade Ursprungszeugnisse."] },
    note: { disp: ["Kurz notieren, sonst vergesse ich es."], fahr: ["Ich schreibe mir die Ladezeiten auf."], ums: ["Ich notiere mir die Stellplätze."], zoll: ["Ich notiere mir die Fristen."] },
    phone: { disp: ["Einen Moment, ich habe gerade einen Kunden in der Leitung."], fahr: ["Ich spreche mich gerade mit der Rampe ab."], ums: ["Ich kläre noch ein Zeitfenster."], zoll: ["Das Zollamt ist gerade in der Leitung."] },
    cup: { disp: ["Kurze Kaffeepause, dann geht's weiter."] },
    look: { disp: ["Hallo! Kann ich helfen?"] }
  };
  function factLines(s) {
    const b = O.b, p = s.p, out = [], fl = fleetOf(b), n = monthN(p);
    out.push(n ? "Diesen Monat habe ich " + n + " " + monthUnit(p.role, n) + "." : "Diesen Monat ist bei mir noch nichts erfasst.");
    if (p.role === "disp") out.push(fl.length ? fl.filter(busy).length + " von " + fl.length + " Fahrzeugen sind gerade unterwegs." : "Uns fehlen noch Fahrzeuge am Standort.");
    if (p.role === "fahr") { const mine = fl.find(f => f.driver === p.id), v = mine && vType(mine.type); out.push(v ? "Ich fahre fest " + v.name + "." : "Der Fahrerpool reicht gerade für " + driverCap(b) + " Fahrzeuge."); }
    if (p.role === "ums") out.push("Mit unserem Team geht der Umschlag hier " + Math.round((1 - umschlagFactor(b.node)) * 100) + " % schneller.");
    if (p.role === "zoll") out.push("Mit sauberen Papieren gibt es hier +" + Math.round(baseBonus(b) * 1000) / 10 + " % auf die Aufträge.");
    out.push("Die Stimmung im Team liegt bei " + Math.round(b.mood) + " %.");
    const m = b.motm;
    if (m && !m.none && m.id === p.id) out.push("Ich bin " + (lookOf(p).fem ? "Mitarbeiterin" : "Mitarbeiter") + " des Monats " + GAME_MONTHS[((m.k % 12) + 12) % 12] + "!");
    else if (m && !m.none) out.push(m.name.split(" ")[0] + " hängt im " + GAME_MONTHS[((m.k % 12) + 12) % 12] + " als Mitarbeiter des Monats an der Wand.");
    if (p.since != null) out.push("Ich bin seit Tag " + dayOf(p.since) + " dabei.");
    return out;
  }
  function say(s) {
    const p = s.p, role = ROLES[p.role], A = ACT_SAY[s.act] || ACT_SAY.look, al = A[p.role] || A.disp;
    const list = [al[s.talkN % al.length]].concat(factLines(s));
    let i = s.talkN % list.length; if (list[i] === s.lastSay) i = (i + 1) % list.length;
    const line = list[i]; s.lastSay = line; s.talkN++;
    const el = O.el.querySelector("#ofpSay");
    el.innerHTML = `<b>${esc(p.name)}</b><small>${esc(role ? role.name : "Team")}</small><span>„${esc(line)}“</span>`;
    el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
    const now = performance.now();
    s.attendUntil = now + 4800; s.talkUntil = now + Math.min(3200, 900 + line.length * 38);
    O.sayAt = { x: s.x, z: s.z }; O.sayUntil = now + 4200;
  }

  /* Kleine Karte zum Poster */
  function openCard() {
    const b = O.b, st = motmState(b), m = st.m, el = O.el.querySelector("#ofpCard");
    let body;
    if (st.kind === "winner") {
      const cur = b.staff.find(x => x.id === m.id), n = cur ? monthN(cur) : 0, role = ROLES[m.role];
      body = `<div class="ofp-card-face">${m.av && typeof avatarSVG === "function" ? avatarSVG(m.av, 64, { uid: "mc" + b.id, bg: true }) : ""}</div>
        <div class="ofp-card-txt"><small>Mitarbeiter des Monats · ${esc(gameMonthName(m.k))}</small><b>${esc(m.name)}</b>
          <i style="color:${hs6(ROLE_COL[m.role] || 0x3f78c8)}">${esc(role ? role.name : "Team")} · ${esc(N[b.node].short)}</i>
          <p>${esc(m.why)}</p>
          ${cur ? `<p class="dim">Laufender Monat bisher: ${n} ${esc(monthUnit(cur.role, n))}.</p>` : `<p class="dim">${esc(st.where || "")}</p>`}</div>`;
    } else {
      body = `<div class="ofp-card-txt"><small>Mitarbeiter des Monats · ${esc(N[b.node].short)}</small><b>${st.kind === "start" ? "Noch offen" : b.staff.length ? "Diesmal niemand" : "Noch kein Team"}</b>
        <p>${esc(m ? m.why : "Noch kein Personal.")}</p><p class="dim">Gezählt werden disponierte Touren, Fahrten, Lade- und Entladevorgänge und betreute Papiere – jede Person im Vergleich zum Schnitt ihrer Rolle im Unternehmen. Keine Prämie.</p></div>`;
    }
    el.innerHTML = body + `<button class="ofp-card-x" aria-label="Schließen">✕</button>`;
    el.querySelector(".ofp-card-x").onclick = closeCard;
    el.classList.add("on"); O.cardOpen = true;
  }
  function closeCard() { if (!O) return; const el = O.el.querySelector("#ofpCard"); if (el) el.classList.remove("on"); O.cardOpen = false; }

  /* ------------------------------ Verlassen ---------------------------- */
  function leave() {
    if (!O) return;
    const o = O; O = null; o.alive = false;
    cancelAnimationFrame(o.raf);
    clearTimeout(o.hintT);
    if (o.key) { window.removeEventListener("keydown", o.key); window.removeEventListener("keyup", o.key); }
    if (o.blur) window.removeEventListener("blur", o.blur);
    try {
      if (o.R) {
        o.meshes.forEach(m => o.R.free(m)); o.texs.forEach(t => o.R.texFree(t)); o.R.nodes.length = 0;
        const ext = o.R.gl && o.R.gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext();
      }
    } catch (e) { /* egal */ }
    o.meshes = []; o.texs = []; o.staff = []; o.screens = [];
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && o.theme) meta.setAttribute("content", o.theme);
    o.el.classList.add("out");
    document.body.classList.remove("office3d");
    setTimeout(() => o.el.remove(), 300);
  }

  /* _dbg nur für Browser-Tests (Kamera setzen, Zustand lesen) */
  return { enter, leave, isOpen: () => !!O, buildRoom, _dbg: () => O, _tap: (x, y) => tapAt(x, y) };
})();
