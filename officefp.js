/* =========================================================================
   LOGISTIKA – officefp.js (v301)
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
   v263: Kaffee auf jeder freien Fläche abstellen (Tische, Arbeitsplatte, Küchentisch, Fensterbank, Empfang, Boden),
   Personal anbieten (nachvollziehbare Zu- oder Absage, Übergabe am Henkel), Tasse werfen (Flugbahn mit Schwerkraft,
   zerspringt, Kaffee und Scherben 5 Spielminuten an der logischen Stelle), Treffer an Kopf oder Rumpf tödlich mit
   sichtbarer Verletzung und Folgen im Spielstand. Tätigkeiten neu nach echtem Ablauf: ergonomischer Schreibtisch,
   Hände mit Fingern und Griffen, Handgelenk-IK; Tippen, Maus, Lesen, Schreiben (Block heranziehen, Stift nehmen),
   Telefonieren (Handy an der Wange), Trinken (Henkel, Becher kippt, Kopf leicht zurück, vor der Brust halten).
   ========================================================================= */
"use strict";

const OFFICE3D = (() => {
  const PI = Math.PI, K = 0.04;
  const PX = sx => (sx - 200) * K, PZ = sy => (sy - 150) * K;
  const RW = 6.8, RD = 4.8;                                 /* halbe Innenmaße (340 × 240 Planeinheiten) */
  const EYE = 1.62, PR = 0.32, SPEED = 2.3;
  const FS = 1.45;                                          /* Maßstab der Figuren (wie auf dem Hof): 1 Figureinheit = 1,45 m */
  const CHAIR_D = 0.72, SEAT_Y = 0.46;                       /* Stuhlmitte hinter der Tischmitte · Sitzfläche = Oberschenkel-Unterseite (0,317 × 1,45) */
  const TALK_RANGE = 6, ARM_A = 0.22, ARM_B = 0.211;      /* Reichweite zum Ansprechen (m) · Oberarm, Unterarm bis Handgelenk (Figureinheiten, v263) */
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
  /* v301: Dieselben Treppenmaße für Modell, Kollision und Etagenzugang. */
  function stairwell(b,floor){
    const count=tierFloors(tierOf(b));if(count<2)return null;
    const x0=PX(318),x1=PX(364),z0=PZ(44),z1=PZ(84),dest=[];
    if(floor+1<count)dest.push({floor:floor+1,label:'↑ Zum '+floorName(floor+1)});
    if(floor>0)dest.push({floor:floor-1,label:'↓ Zum '+floorName(floor-1)});
    return {lo:[x0,0,z0],hi:[x1,ceilH(b),z1],entry:[PX(300),(z0+z1)/2],gate:x0-PR-.10,dest};
  }
  /* st: Boden, Wände, Möbel (wirft Schatten) · shell: Decke (kein Schatten) · glow: Lampen, Fensterlicht.
     ob: Rechtecke für die Begehbarkeit (x0, z0, x1, z1) · occ: Kästen [lo, hi] für die Sichtprüfung beim Antippen. */
  function buildRoom(b, fl0) {
    const MB = G3.MB, st = new MB(), shell = new MB(), trim = new MB(), glow = new MB(), ob = [], occ = [], surf = [], phys = [];
    const d = decoOf(b), t = tierOf(b), H = ceilH(b), multi = tierFloors(t) > 1;
    const fl = findBy(FLOORS, d.floor), tint = findBy(FLOOR_TINTS, d.tint), wall = findBy(WALLS, d.wall), kit = findBy(KITCHENS, d.kitchen);
    const fc = tint.mix ? avMix(fl.base, tint.mix, 0.5) : fl.base, fdk = hx(avMix(fc, "#000000", 0.16)), fcol = hx(fc);
    const wc = hx(wall.color), wdk = hx(avMix(wall.color, "#000000", 0.22));
    const rect = (x0, z0, x1, z1) => ob.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]);
    const blk = (x0, y0, z0, x1, y1, z1) => occ.push([[Math.min(x0, x1), y0, Math.min(z0, z1)], [Math.max(x0, x1), y1, Math.max(z0, z1)]]);
    /* v263: Ablageflächen (Rechteck in x/z, Höhe y, Sperrzonen ex für das, was schon darauf steht) */
    const top = (x0, z0, x1, z1, y, ex, kind) => surf.push({ x0, z0, x1, z1, y, ex: ex || [], kind });

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
    top(-RW, wz0 - 0.04, -RW + 0.18, wz1 + 0.04, SILL + 0.05, [], "sill");
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
    if (kitchen && kitchen.top) top(kitchen.top.x0, kitchen.top.z0, kitchen.top.x1, kitchen.top.z1, kitchen.top.y, kitchen.ex, "work");
    if (kitchen && kitchen.table) top(kitchen.table[0] - 1.5, kitchen.table[1] - 0.5, kitchen.table[0] + 1.5, kitchen.table[1] + 0.5, 0.78, [], "table");

    /* Schreibtische, Stühle, Bildschirme, Arbeitsmittel */
    const seats = [], screens = [];
    for (let i = 0; i < t.desks; i++) {
      if (deskFloor(b, i) !== fl0) continue;
      const [sx, sy] = deskPos(b, i), x = PX(sx), z = PZ(sy), p = b.staff[i];
      const mx = x + 0.3, cz = z + CHAIR_D;
      st.box(2.08, 0.04, 1.04, 0xe4d3b6, { x, y: 0.72, z, top: 0xead9bd });
      [-1, 1].forEach(s => st.box(0.05, 0.72, 0.96, 0x55606c, { x: x + s * 0.98, z }));
      st.box(1.9, 0.4, 0.03, 0x55606c, { x, y: 0.3, z: z - 0.44 });
      /* Bildschirm vor dem Platz: Fuß, Gehäuse; der Inhalt kommt als Bild (screenCanvas) bzw. dunkel im Ruhezustand.
         v263: ergonomisch – Bildschirm etwa eine Armlänge vor den Augen, Tastatur und Maus 15–20 cm von der Tischkante,
         Block rechts neben der Maus, Becher dahinter, Telefon links: Ellbogen bleiben gebeugt und am Körper. */
      st.box(0.2, 0.012, 0.16, 0x2a2a30, { x: mx, y: 0.76, z: z - 0.06 });
      st.box(0.05, 0.2, 0.04, 0x2a2a30, { x: mx, y: 0.77, z: z - 0.08 });
      st.box(0.66, 0.42, 0.04, 0x22303f, { x: mx, y: 0.94, z: z - 0.06 });
      if (p) screens.push({ i, p, x: mx, y: 1.15, z: z - 0.06 + 0.0205 });
      else glow.box(0.6, 0.36, 0.008, 0x1d2a38, { x: mx, y: 0.97, z: z - 0.036 });
      /* Tastatur mit Tastenreihen, Mauspad, Block mit Linien, Papierstapel, Telefon */
      st.box(0.44, 0.018, 0.15, 0x2a2a30, { x: mx - 0.04, y: 0.76, z: z + 0.25 });
      /* v282: Einzelne Tasten mit Zwischenräumen statt vier durchgehender Balken. */
      for (let r = 0; r < 4; r++) for (let k = 0; k < 12; k++)
        st.box(0.027, 0.006, 0.022, k === 11 ? 0x7b8da1 : 0x657080, { x: mx - 0.222 + k * 0.033, y: 0.778, z: z + 0.198 + r * 0.026 });
      st.box(0.18, 0.006, 0.022, 0x8b96a4, { x: mx - 0.04, y: 0.778, z: z + 0.302 });
      st.box(0.22, 0.004, 0.19, 0x2f4a6a, { x: mx + 0.31, y: 0.76, z: z + 0.25 });
      if (!p) {
        st.box(0.15, 0.008, 0.21, 0xf6f1d8, { x: mx + 0.55, y: 0.76, z: z + 0.33, ry: -0.2 });
        for (let r = 0; r < 5; r++) { const v = -0.06 + r * 0.03; st.box(0.11, 0.002, 0.003, 0x9ab0c8, { x: mx + 0.55 - 0.199 * v, y: 0.768, z: z + 0.33 + 0.98 * v, ry: -0.2 }); }
      }
      st.box(0.21, 0.012, 0.3, 0xfaf6ee, { x: mx - 0.62, y: 0.76, z: z + 0.22, ry: 0.22 });
      st.box(0.21, 0.008, 0.3, 0xf0ece2, { x: mx - 0.65, y: 0.772, z: z + 0.21, ry: 0.12 });
      for (let r = 0; r < 6; r++) st.box(0.15, 0.002, 0.006, 0x8a94a2, { x: mx - 0.65 + r * 0.004, y: 0.781, z: z + 0.11 + r * 0.035, ry: 0.12 });
      if (!p) {
        st.box(0.06, 0.03, 0.1, 0x2a2a30, { x: mx + 0.31, y: 0.764, z: z + 0.25 });
        st.box(0.075, 0.01, 0.15, 0x1d1d20, { x: mx - 0.43, y: 0.76, z: z + 0.3 });
        st.box(0.13, 0.008, 0.008, 0x2a4a8a, { x: mx + 0.57, y: 0.768, z: z + 0.36, ry: 0.7 });
      }
      chair(st, mx, cz, p ? 0 : 0.35, 0x2f3d55);
      /* v263: Tischplatte als Ablage – frei bleiben Monitorfuß, Tastatur, Mauspad, Block, Papiere, Telefon,
         bei besetzten Plätzen auch die eigene Tasse und der Bereich, in dem Unterarme und Hände arbeiten */
      const ex = [[mx - 0.12, z - 0.16, mx + 0.12, z + 0.03], [mx - 0.27, z + 0.165, mx + 0.19, z + 0.335], [mx + 0.19, z + 0.145, mx + 0.43, z + 0.355],
        [mx + 0.44, z + 0.21, mx + 0.66, z + 0.455], [mx - 0.79, z + 0.04, mx - 0.48, z + 0.4], [mx - 0.48, z + 0.215, mx - 0.38, z + 0.385]];
      if (p) ex.push([mx + 0.27, z + 0.045, mx + 0.45, z + 0.155], [mx - 0.32, z + 0.335, mx + 0.46, z + 0.52]);
      top(x - 1.04, z - 0.52, x + 1.04, z + 0.52, 0.76, ex, "desk");
      /* Rückenlehne und Sitz besetzter Stühle halten eine geworfene Tasse auf */
      if (p) phys.push([[mx - 0.22, SEAT_Y + 0.1, cz + 0.2], [mx + 0.22, SEAT_Y + 0.6, cz + 0.29]], [[mx - 0.23, SEAT_Y - 0.07, cz - 0.23], [mx + 0.23, SEAT_Y, cz + 0.23]]);
      rect(x - 1.04, z - 0.52, x + 1.04, z + 0.52);
      rect(mx - 0.32, cz - 0.3, mx + 0.32, cz + 0.36);
      const own = ob.slice(-2);
      blk(x - 1.04, 0.72, z - 0.52, x + 1.04, 0.76, z + 0.52);
      blk(x - 0.95, 0.3, z - 0.455, x + 0.95, 0.7, z - 0.425);
      blk(mx - 0.33, 0.94, z - 0.08, mx + 0.33, 1.36, z - 0.04);
      if (p) seats.push({ p, i, x: mx, z: cz, dz: z, own });
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
      /* v301: Handlauf folgt der Steigung und reicht über die ganze Treppe. */
      st.box(Math.hypot(x1-x0,H),0.05,0.05,0x55606c,{x:(x0+x1)/2,y:H/2+.90,z:z1+.02,rz:Math.atan2(H,x1-x0),c:true});
      rect(x0, z0, x1, z1 + 0.05);
      blk(x0 + 1.2, 0, z0, x1, H, z1);
      const reception = fl0 === 0 ? receptionPlan(b) : null;
      if (reception) {
        const rx0 = PX(reception.x0), rx1 = PX(reception.x1), rz0 = PZ(reception.y0), rz1 = PZ(reception.y1);
        st.box(rx1 - rx0, 1.08, rz1 - rz0, 0xe9dcc0, { x: (rx0 + rx1) / 2, z: (rz0 + rz1) / 2 });
        st.box(rx1 - rx0 + 0.1, 0.05, rz1 - rz0 + 0.1, 0x5d4a32, { x: (rx0 + rx1) / 2, y: 1.08, z: (rz0 + rz1) / 2 });
        rect(rx0, rz0, rx1, rz1);
        blk(rx0, 0, rz0, rx1, 1.13, rz1);
        top(rx0 - 0.05, rz0 - 0.05, rx1 + 0.05, rz1 + 0.05, 1.13, [], "counter");
      }
    }

    /* Bilderrahmen für das Poster „Mitarbeiter des Monats“ neben dem Whiteboard */
    const POSTER = { x: -4.5, y: 1.55, w: 0.84, h: 1.12 };
    st.box(POSTER.w + 0.08, POSTER.h + 0.08, 0.03, 0x2a2a30, { x: POSTER.x, y: POSTER.y - POSTER.h / 2 - 0.04, z: RD - 0.015 });
    st.box(POSTER.w + 0.01, POSTER.h + 0.01, 0.006, 0xfbfcfd, { x: POSTER.x, y: POSTER.y - POSTER.h / 2 - 0.005, z: RD - 0.033 });

    top(-RW, -RD, RW, RD, 0, null, "floor");                    /* Boden: Sperrzonen sind alle Möbel (ob), siehe dropSpot */
    return { st, shell, trim, glow, ob, occ, surf, phys, carpet: fl.pattern === "carpet", seats, screens, H, kitchen, poster: POSTER, door: [RW - 0.7, (dz0 + dz1) / 2], stairs: multi ? [PX(300), PZ(64)] : null, stairwell:stairwell(b,fl0) };
  }

  /* v259: Küche mit getrennten Korpussen, Türen und Zuständen in officekitchen.js. */
  function buildKitchen(st, kid, cx0, H, rect, blk) {
    return OFFICE_KITCHEN.layout({ st, kid, cx0, H, rect, blk, RW, RD, mods: kitchenModules(kid), chair, mixH });
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
    /* v299: Verwurzelte Pflanzen mit zusammenhängenden Ästen und beidseitigen,
       gekrümmten Blättern. Lokaler Zufall verändert keine anderen Raummodelle. */
    const rnd=rng(nameHash(it.id+':'+x.toFixed(3)+':'+z.toFixed(3))),c=hx(it.col),soil=0.305;
    const polar=(a,r,y)=>[Math.cos(a)*r,y,Math.sin(a)*r],add=(a,b)=>a.map((v,i)=>v+b[i]);
    const curve=(a,b,d,t)=>a.map((v,i)=>v*(1-t)*(1-t)+2*b[i]*t*(1-t)+d[i]*t*t);
    const stem=(a,b,r0,r1,col)=>{
      const d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d);if(len<0.00001)return;
      const A=a.map((v,i)=>v-d[i]/len*r0*.35);
      m.cyl(r0,r1,len+(r0+r1)*.35,6,col,{x:A[0],y:A[1],z:A[2],rx:Math.acos(d[1]/len),ry:Math.atan2(d[0],d[2]),smooth:true,nobot:true,notop:true});
    };
    const leaf=(a,b,d,w,col,o)=>{
      o=o||{};const n=o.n||6,side=nrm([d[2]-a[2],0,a[0]-d[0]]),cuts=o.split?[-1,-0.60,-0.28,0,0.28,0.60,1]:o.stripe?[-1,-0.2,0.2,1]:[-1,0,1];
      const rows=Array.from({length:n+1},(_,i)=>{
        const u=i/n,P=curve(a,b,d,u),lobes=o.split?1-.40*Math.exp(-Math.pow((u-.4375)/.032,2))-.46*Math.exp(-Math.pow((u-.625)/.032,2))-.43*Math.exp(-Math.pow((u-.8125)/.032,2)):1;
        const ww=w*Math.pow(Math.sin(PI*u),o.strap?0.55:0.8)*lobes;
        return cuts.map(s=>[P[0]+side[0]*ww*s,P[1]+(1-Math.abs(s))*ww*0.12,P[2]+side[2]*ww*s]);
      });
      for(let j=0;j<n;j++)for(let k=0;k<cuts.length-1;k++){
        const A=rows[j][k],B=rows[j][k+1],C=rows[j+1][k+1],D=rows[j+1][k];
        const top=o.stripe&&k===1?0xd6e4b0:col;
        /* Monstera: achteckig gerundete Blattfenster, keine rechteckig ausgesparten Kacheln. */
        if(o.split&&j===8&&(k===1||k===4)){
          const point=(u,v)=>lerp3(lerp3(A,B,u),lerp3(D,C,u),v);
          for(let q=0;q<8;q++){
            const at=(i,inner)=>{const a=i/8*2*PI,x=Math.cos(a),y=Math.sin(a),r=inner?.40:.5/Math.max(Math.abs(x),Math.abs(y));return point(.5+x*r,.5+y*r);};
            const E=at(q,false),F=at(q,true),G=at(q+1,true),H=at(q+1,false);
            m.quad(E,F,G,H,top);m.quad(H,G,F,E,o.under||mixH(col,0x9dba8a,.30));
          }
          continue;
        }
        m.quad(A,D,C,B,top);m.quad(B,C,D,A,o.under||mixH(col,0x9dba8a,0.30));
      }
    };
    m.at({x,z},()=>{
      /* Nach oben weiter Topf, geschlossene Standfläche, sichtbarer Rand und vertiefte Erde. */
      const pc=it.id==='olive'?0x909995:it.id==='monstera'?0xe6dfd0:0xb97250,N=20;
      m.cyl(pr*0.80,pr*1.06,0.025,N,mixH(pc,0x4b3329,0.15),{smooth:true});
      const rings=[[0.025,pr*0.74],[0.30,pr],[0.315,pr*1.025],[0.34,pr*1.025],[0.34,pr*0.88],[0.30,pr*0.88]];
      for(let j=1;j<rings.length;j++)for(let i=0;i<N;i++){
        const a=i/N*2*PI,b=(i+1)/N*2*PI,[y0,r0]=rings[j-1],[y1,r1]=rings[j];
        m.quad(polar(a,r0,y0),polar(a,r1,y1),polar(b,r1,y1),polar(b,r0,y0),j===3?mixH(pc,0xffffff,0.10):pc);
      }
      m.cyl(pr*0.88,pr*0.88,0.005,N,0x493a29,{y:0.30});
      for(let i=0;i<9;i++){
        const a=i*2.4,r=pr*(0.25+rnd()*0.48),p=polar(a,r,soil+0.001),rr=0.006+rnd()*0.006;
        m.tri(add(p,[-rr,0,-rr]),add(p,[0,0,rr]),add(p,[rr,0,-rr]),it.id==='kaktus'?0xc2af8c:0x66533a);
      }
      if(it.id==='gruenlilie'){
        for(let i=0;i<22;i++){
          const a=i*2.399,rise=h*(0.40+rnd()*0.28),reach=h*(0.38+rnd()*0.22),tip=soil+(i<14?-.10+rnd()*h*.15:.07+rnd()*h*.22);
          leaf(polar(a,0.008,soil-0.008),polar(a,reach*0.6,soil+rise),polar(a,reach,tip),0.016+rnd()*0.009,mixH(c,0x245b35,rnd()*0.25),{strap:true,stripe:true,n:8});
        }
      }else if(it.id==='monstera'){
        for(let i=0;i<9;i++){
          const a=i*2.399+rnd()*0.22,level=0.32+i/8*0.45,r=h*(0.045+rnd()*0.10),A=polar(a,r,soil+h*level),len=h*(0.26+rnd()*0.09);
          const root=polar(a,0.018,soil-0.01),mid=polar(a,r*0.35,soil+h*level*0.63);
          stem(root,mid,0.009,0.007,0x487442);stem(mid,A,0.007,0.004,0x487442);
          const B=add(A,polar(a,len*0.52,0.03)),D=add(A,polar(a,len,-len*0.28));
          leaf(A,B,D,len*0.43,mixH(c,0x174c32,rnd()*0.22),{split:i>1,n:16});
        }
      }else if(it.id==='ficus'||it.id==='olive'){
        const olive=it.id==='olive',wood=olive?0x81745b:0x75533a;
        const trunk=t=>[h*0.025*Math.sin(t*5),soil-0.01+h*t,h*0.018*Math.sin(t*3)];
        for(let i=0;i<5;i++)stem(trunk(i*.18),trunk((i+1)*.18),0.023*(1-i*.13),0.023*(1-(i+1)*.13),wood);
        for(let i=0;i<10;i++){
          const a=i*2.399+0.2,t=0.40+i*.044,A=trunk(t),len=h*(0.25+rnd()*0.11)*(1-(t-.4)*.9);
          const B=add(A,polar(a,len*0.45,h*0.08)),D=add(A,polar(a,len,h*0.10));
          const mid=curve(A,B,D,.5);stem(A,mid,0.010,0.006,wood);stem(mid,D,0.006,0.0028,wood);
          for(let j=0;j<(olive?8:6);j++){
            const u=.18+Math.floor(j/2)*(olive?.23:.33),root=curve(A,B,D,u),az=a+(j%2?1:-1)*(olive?0.85:0.70),l=h*(olive?0.095:0.14)*(0.85+rnd()*.25);
            const C=add(root,polar(az,l*.55,l*.28)),E=add(root,polar(az,l,-l*.15));
            leaf(root,C,E,l*(olive?0.105:0.29),mixH(c,olive?0xa8b79a:0x245e3a,rnd()*.35),{n:4,under:olive?0xb0b8a0:0x8dac70});
          }
        }
      }else if(it.id==='palme'){
        const tips=[];
        for(let i=0;i<3;i++){
          const a=i*2.1,H=h*(0.68+i*.07),A=polar(a,.028,soil-.008),B=polar(a,.035,soil+H*.52),D=polar(a,.09,soil+H);
          stem(A,B,.015,.012,0x6c8050);stem(B,D,.012,.008,0x7c8e56);tips.push(D);
        }
        for(let i=0;i<8;i++){
          const a=i*2.399,A=tips[i%3],len=h*(.36+rnd()*.08),B=add(A,polar(a,len*.6,h*.14)),D=add(A,polar(a,len,-h*.18));
          for(let j=0;j<8;j++)stem(curve(A,B,D,j/8),curve(A,B,D,(j+1)/8),.004*(1-j*.09),.004*(1-(j+1)*.09),0x789653);
          for(let j=1;j<=7;j++)for(const s of [-1,1]){
            const u=j/8,P=curve(A,B,D,u),l=h*(.13+.05*Math.sin(PI*u))*(1-u*.35),az=a+s*1.05;
            leaf(P,add(P,polar(az,l*.6,.012)),add(P,polar(az,l,-l*.36)),h*.011,mixH(c,0x29613e,rnd()*.25),{n:3,strap:true});
          }
        }
      }else if(it.id==='kaktus'){
        for(let k=0;k<3;k++){
          const cx=k===0?0:k===1?-.108:.103,cz=k===2?.04:0,r=k===0?.068:.044,H=h*(k===0?.83:k===1?.48:.59),N=32;
          const rings=[[0,.94],[H-r,1],[H-r*.58,.90],[H-r*.18,.57],[H,0]];
          for(let j=1;j<rings.length;j++)for(let i=0;i<N;i++){
            const a=i/N*2*PI,b=(i+1)/N*2*PI,P=(t,q)=>[cx+Math.cos(t)*r*q*(.88+.12*Math.cos(t*8)),soil-0.005,cz+Math.sin(t)*r*q*(.88+.12*Math.cos(t*8))];
            const A=P(a,rings[j-1][1]),B=P(a,rings[j][1]),C=P(b,rings[j][1]),D=P(b,rings[j-1][1]);
            A[1]+=rings[j-1][0];D[1]+=rings[j-1][0];B[1]+=rings[j][0];C[1]+=rings[j][0];
            m.quad(A,B,C,D,i%4===1||i%4===2?c:mixH(c,0x31573c,.23));
          }
          for(let j=1;j<=5;j++)for(let i=0;i<8;i++){
            const a=i/8*2*PI,y=soil+H*(.12+j*.13),P=[cx+Math.cos(a)*(r+.001),y,cz+Math.sin(a)*(r+.001)],S=[-Math.sin(a)*.004,0,Math.cos(a)*.004];
            const T=[P[0]+Math.cos(a)*.012,y+.004,P[2]+Math.sin(a)*.012];
            m.tri(add(P,S),add(P,[0,.005,0]),T,0xd8c79f);m.tri(T,add(P,[0,-.005,0]),add(P,S.map(v=>-v)),0xa59571);
          }
        }
      }
    });
  }

  /* ---------------------------- Büro-Figur ----------------------------- */
  /* Aussehen aus dem gespeicherten Avatar; was der Avatar nicht kennt (Hose, Schuhe, Tassenfarbe), kommt aus der Personal-ID */
  function lookOf(p) {
    const av = Object.assign(avDefault(), p.av || {}), k = nameHash(p.id || p.name);
    const fem = AV.sexes[avWrap(av, "sex")] === "w";
    /* v259: natürliche Haarpalette im 3D-Büro; gespeicherte Avatare bleiben unverändert. */
    const hc0 = AV.hairColors[avWrap(av, "hairColor")], hc = hc0.id === "blau" ? AV.hairColors[3 + k % 2] : hc0;
    const sk = AV.skins[avWrap(av, "skin")], ec = AV.eyeColors[avWrap(av, "eyes")], fit = AV.outfits[avWrap(av, "outfit")];
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
    L.tw = fem ? 0.27 : 0.31; L.td = fem ? 0.17 : 0.18; L.sh = fem ? 0.145 : 0.165;
    L.key = [L.fem, L.skin, L.hair, L.eye, L.outfit, L.style, L.acc, L.beard, L.pants, L.shoe, L.under, L.hatC, L.role].join(":");
    return L;
  }

  /* Kugelfläche nur dort, wo keep(Winkel von oben, Winkel von vorn) zutrifft – für Trefferflecken. */
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

  /* v298: Jede Längsreihe endet exakt an ihrer Haarlinie. Die Kappe liegt vollständig
     außerhalb der Kopfoberfläche, auch zwischen deren gröberen Dreiecken. */
  function hairCap(b, col, front, back, o) {
    o = o || {};
    const N=o.curl?48:28, M=o.curl?24:12, cap=[];
    const shape=(u,az,inner) => {
      const edge=front+(back-front)*smooth(0.55,2.3,Math.abs(az))+(o.part ? Math.sin(az)*0.07 : 0);
      const th=u*edge, curl=o.curl ? Number(o.curl)*Math.sin(th)*(0.5+0.5*Math.sin(az*7+th*2)*Math.sin(th*8))*0.075 : 0;
      const lift=(o.lift||0)*Math.exp(-Math.pow((th-0.42)/0.55,2))*Math.sin(th)*1.7*Math.max(0,Math.cos(az));
      const r=HR*(inner ? 1.006 : (o.rad||1.065)+(o.shave?0.045*(1-smooth(.85,1.45,th)):0)+curl+lift+(o.part ? Math.sin(az-0.6)*Math.sin(th)*0.025 : 0));
      const wave=(o.long||0)*smooth(0.9,1.7,Math.abs(az))*smooth(1.1,2.4,th);
      const n=[Math.sin(th)*Math.sin(az),Math.cos(th),Math.sin(th)*Math.cos(az)];
      return {p:[n[0]*r,HC[1]+n[1]*r*HSY-wave,n[2]*r],n:nrm([n[0],n[1]/HSY,n[2]]),th};
    };
    const point=(u,az,inner)=>{
      const v=shape(u,az,inner),e=0.001;
      if(u>0&&!inner){
        const A=shape(u-e,az).p,B=shape(u+e,az).p,C=shape(u,az-e).p,D=shape(u,az+e).p;
        const x=B.map((v,i)=>v-A[i]),y=D.map((v,i)=>v-C[i]);
        v.n=nrm([x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]]);
      }
      return v;
    };
    for(let j=0;j<=M;j++) cap.push(Array.from({length:N+1},(_,i)=>point(j/M,i/N*2*PI>PI?i/N*2*PI-2*PI:i/N*2*PI)));
    for(let j=0;j<M;j++)for(let i=0;i<N;i++){
      const A=cap[j][i],B=cap[j][i+1],C=cap[j+1][i+1],D=cap[j+1][i];
      const cc=o.shave?mixH(col,o.shave,smooth(.85,1.45,(A.th+B.th+C.th+D.th)/4)):col;
      if(j) b.tri(A.p,C.p,B.p,cc,A.n,C.n,B.n);
      b.tri(A.p,D.p,C.p,cc,A.n,D.n,C.n);
    }
    for(let i=0;i<N;i++){
      const a=i/N*2*PI,bb=(i+1)/N*2*PI, A=cap[M][i],B=cap[M][i+1];
      const C=point(1,bb>PI?bb-2*PI:bb,true),D=point(1,a>PI?a-2*PI:a,true);
      b.quad(A.p,B.p,C.p,D.p,mixH(col,0x000000,0.12));
    }
  }
  function hairMesh(L) {
    const b=new G3.MB(),st=L.style,hat=L.acc==='cap'||L.acc==='muetze',cap=(f,bk,o,c)=>hairCap(b,c==null?L.hair:c,f,bk,o);
    if(st==='glatze')return b;
    if(st==='undercut'){
      /* v300: Deckhaar und kurze Seiten bilden eine Fläche, keinen überhängenden Helmrand. */
      cap(1.0,1.92,{rad:1.04,shave:mixH(L.hair,L.skin,.23),lift:hat?0:.07});
    }else if(st==='quiff')cap(0.96,1.92,{lift:hat?0:0.28});
    else if(st==='seitenscheitel')cap(0.98,1.98,{part:true,lift:hat?0:0.08});
    else if(st==='locken')cap(0.98,2.0,{curl:hat?0.35:1,lift:hat?0:0.035});
    else if(st==='bob'||st==='wellen')cap(0.94,st==='bob'?2.42:2.5,{long:st==='bob'?0.015:0.06,curl:st==='wellen'?(hat?0.25:0.45):0});
    else {
      cap(0.96,1.95);
      if(st==='zopf'){
        b.sphere(0.028,12,10,L.hair,{y:0.075,z:-0.145,sy:3.2,sz:0.8,rx:0.12,smooth:true});
        b.sphere(0.026,10,7,L.hairS,{y:0.17,z:-0.124,sy:0.45,smooth:true});
      }else if(st==='dutt')b.sphere(hat?0.038:0.043,14,10,L.hair,{y:hat?0.14:0.25,z:hat?-0.133:-0.062,sy:0.85,smooth:true});
    }
    return b;
  }

  /* Kopf: Drehpunkt am Hals (Figur y 0,82), Kopfmitte 0,13 darüber, nach +z blickend */
  const HC = [0, 0.13, 0], HR = 0.118, HSY = 1.06;
  /* v300: Bart ausschließlich vor den Ohren, mit durchgehender Wangen-/Kieferlinie.
     Die seitliche Grenze liegt vor der Kopfmitte; hinten am Nacken bleibt Haut. */
  function beardMesh(L) {
    const b=new G3.MB(),full=L.beard==='vollbart',stubble=L.beard==='stoppeln';
    if(full||stubble){
      const N=28,M=12,azMax=1.34,col=full?L.hairS:mixH(L.skin,L.hair,.40);
      const at=(i,j,inside)=>{
        const az=(i/N*2-1)*azMax,u=j/M,side=smooth(.25,1.25,Math.abs(az));
        const top=full?2.02-.44*side:1.72-.14*side,bottom=2.86-.34*side,th=top+(bottom-top)*u;
        const fade=smooth(0,.16,u)*(1-smooth(.84,1,u))*(1-smooth(.82,1,Math.abs(i/N*2-1)));
        const r=HR*(inside?1.008:1.014+(full?.028:.010)*fade);
        const n=[Math.sin(th)*Math.sin(az),Math.cos(th),Math.sin(th)*Math.cos(az)];
        return {p:[n[0]*r,HC[1]+n[1]*r*HSY,n[2]*r],n:nrm([n[0],n[1]/HSY,n[2]])};
      };
      for(let j=0;j<M;j++)for(let i=0;i<N;i++){
        const A=at(i,j),B=at(i+1,j),C=at(i+1,j+1),D=at(i,j+1);
        b.tri(A.p,D.p,C.p,col,A.n,D.n,C.n);b.tri(A.p,C.p,B.p,col,A.n,C.n,B.n);
      }
      const edge=(i,j,k,l)=>{const A=at(i,j).p,B=at(k,l).p,C=at(k,l,true).p,D=at(i,j,true).p;b.quad(A,B,C,D,col);};
      for(let i=0;i<N;i++){edge(i,0,i+1,0);edge(i+1,M,i,M);}
      for(let j=0;j<M;j++){edge(0,j+1,0,j);edge(N,j,N,j+1);}
    }
    if(full||L.beard==='schnauzer')b.sphere(.026,14,8,L.hairS,{y:.100,z:.1124,sy:.21,sz:.24,smooth:true});
    return b;
  }
  /* v300: Mütze mit geschlossenem, analytischem Umschlag statt ausgeschnittenen
     Kugelkacheln. Genügend Abstand zwischen Kappe und Band verhindert Flimmern. */
  function hatMesh(L) {
    const b=new G3.MB();
    if(L.acc==='muetze'){
      hairCap(b,L.hatC,.95,1.3,{rad:1.14,lift:.015});
      const N=28,edge=a=>.95+.35*smooth(.55,2.3,Math.abs(a)),at=(i,u,inside)=>{
        const a=i/N*2*PI,az=a>PI?a-2*PI:a,th=edge(az)-.19+u*.205,r=HR*(inside?1.135:1.175);
        const n=[Math.sin(th)*Math.sin(a),Math.cos(th),Math.sin(th)*Math.cos(a)];
        return {p:[n[0]*r,HC[1]+n[1]*r*HSY,n[2]*r],n:nrm([n[0],n[1]/HSY,n[2]])};
      };
      for(let i=0;i<N;i++){
        const A=at(i,0),B=at(i+1,0),C=at(i+1,1),D=at(i,1),col=mixH(L.hatC,0xffffff,i%2?.11:.08);
        b.tri(A.p,D.p,C.p,col,A.n,D.n,C.n);b.tri(A.p,C.p,B.p,col,A.n,C.n,B.n);
        b.quad(B.p,A.p,at(i,0,true).p,at(i+1,0,true).p,col);
        b.quad(D.p,C.p,at(i+1,1,true).p,at(i,1,true).p,col);
      }
      b.sphere(.026,12,8,0xf0f0ea,{y:.285,smooth:true});
    }else if(L.acc==='cap'){
      hairCap(b,L.hatC,1.0,1.25,{rad:1.125});
      const N=16,M=3,at=(i,j,under)=>{
        const a=(i/N*2-1)*.85,u=j/M,th=1+.25*smooth(.55,2.3,Math.abs(a)),r=HR*1.125;
        return [Math.sin(th)*Math.sin(a)*r+Math.sin(a)*.008*u,HC[1]+Math.cos(th)*r*HSY-.006*u-.008*u*u-(under?.0025:0),Math.sin(th)*Math.cos(a)*r+.06*Math.pow(Math.cos(a),1.4)*u];
      };
      const col=mixH(L.hatC,0x000000,.18);
      for(let i=0;i<N;i++)for(let j=0;j<M;j++){
        b.quad(at(i,j),at(i,j+1),at(i+1,j+1),at(i+1,j),L.hatC);
        b.quad(at(i+1,j,true),at(i+1,j+1,true),at(i,j+1,true),at(i,j,true),col);
      }
      for(let i=0;i<N;i++)b.quad(at(i,M),at(i,M,true),at(i+1,M,true),at(i+1,M),col);
      for(let j=0;j<M;j++){b.quad(at(0,j),at(0,j,true),at(0,j+1,true),at(0,j+1),col);b.quad(at(N,j+1),at(N,j+1,true),at(N,j,true),at(N,j),col);}
    }
    return b;
  }
  /* v300: Durchgehende Brillenbügel und ein zusammenhängender Kopfhörerbogen. */
  function headTube(b,points,r,col){
    for(let i=1;i<points.length;i++){
      const a=points[i-1],d=points[i].map((v,k)=>v-a[k]),len=Math.hypot(...d);
      limb(b,a,d.map(v=>v/len),len,r,r,col);
      if(i<points.length-1)b.sphere(r,6,4,col,{x:points[i][0],y:points[i][1],z:points[i][2],smooth:true});
    }
  }
  function glassesMesh(){
    const b=new G3.MB(),fc=0x2a2a30;
    [-1,1].forEach(s=>{
      const ex=s*.043,z=.121;
      b.box(.05,.006,.006,fc,{x:ex,y:.156,z});b.box(.05,.006,.006,fc,{x:ex,y:.124,z});
      b.box(.006,.036,.006,fc,{x:ex-.025,y:.124,z});b.box(.006,.036,.006,fc,{x:ex+.025,y:.124,z});
      headTube(b,[[s*.071,.147,.121],[s*.096,.147,.102],[s*.123,.147,.053],[s*.124,.143,-.004],[s*.127,.130,-.014]],.0024,fc);
    });
    b.box(.034,.005,.005,fc,{y:.148,z:.123});return b;
  }
  function headsetMesh(){
    const b=new G3.MB(),N=24,at=(i,r,z)=>{
      const a=(i/N*2-1)*PI/2;return [Math.sin(a)*r,HC[1]+Math.cos(a)*r*HSY,z];
    };
    for(let i=0;i<N;i++){
      const r=HR*1.18,inside=HR*1.12,z=.010;
      b.quad(at(i,r,-z),at(i,r,z),at(i+1,r,z),at(i+1,r,-z),0x2a2a30);
      b.quad(at(i,inside,z),at(i,inside,-z),at(i+1,inside,-z),at(i+1,inside,z),0x59616a);
      b.quad(at(i,r,z),at(i,inside,z),at(i+1,inside,z),at(i+1,r,z),0x333d48);
      b.quad(at(i,inside,-z),at(i,r,-z),at(i+1,r,-z),at(i+1,inside,-z),0x333d48);
    }
    [-1,1].forEach(s=>{
      b.cyl(.034,.034,.030,16,0x2a2a30,{x:s*.118,y:.123,rz:-s*PI/2,smooth:true});
      b.cyl(.030,.030,.010,16,0x59616a,{x:s*.113,y:.123,rz:-s*PI/2,smooth:true});
    });
    headTube(b,[[-.148,.109,0],[-.134,.090,.075],[-.068,.086,.122],[-.028,.090,.128]],.003,0x333d48);
    b.sphere(.010,10,6,0x55606c,{x:-.028,y:.090,z:.128,sy:.65,sz:.7,smooth:true});return b;
  }
  function headMesh(L) {
    const b = new G3.MB(), skin = L.skin, hair = L.hair, brow = L.style === "glatze" ? mixH(L.skinS, 0x000000, 0.2) : mixH(hair, 0x000000, 0.3);
    G3.seed(5100 + (nameHash(L.key) % 997));
    b.sphere(HR, 24, 16, skin, { y: HC[1], sy: HSY, smooth: true });
    [-1, 1].forEach(s => b.sphere(0.026, 8, 6, mixH(skin, L.skinS, 0.4), { x: s * 0.116, y: 0.123, z: -0.004, sx: 0.5, smooth: true }));
    /* Augen: Weiß, Iris in Augenfarbe, Pupille, Glanzpunkt · Brauen · Nase */
    [-1, 1].forEach(s => {
      const ex = s * 0.042;
      b.sphere(0.017, 12, 8, 0xfbfbf8, { x: ex, y: 0.142, z: 0.109, sy: 0.8, sz: 0.25, smooth: true });
      b.sphere(0.008, 12, 8, L.eye, { x: ex, y: 0.141, z: 0.1132, sz: 0.18, smooth: true });
      b.sphere(0.0042, 10, 7, 0x15171a, { x: ex, y: 0.141, z: 0.1145, sz: 0.15, smooth: true });
      b.box(0.004, 0.004, 0.002, 0xffffff, { x: ex + 0.004, y: 0.144, z: 0.1155 });
      b.box(0.032, 0.006, 0.006, brow, { x: ex, y: 0.165, z: 0.107, rz: -s * 0.07 });
    });
    b.sphere(0.012, 10, 7, mixH(skin, L.skinS, 0.25), { y: 0.117, z: 0.115, sy: 1.15, sz: 0.65, smooth: true });
    /* v298: Geschlossene Haarkappe mit einer durchgehenden Haarlinie statt
       ausgeschnittener Kugelkacheln und aufgesetzter eckiger Haarblöcke. */
    b.merge(hairMesh(L), {});
    b.merge(beardMesh(L),{});
    /* Brille, Cap, Mütze, Headset */
    if (L.acc === "brille") {
      b.merge(glassesMesh(),{});
    } else if (L.acc === "cap"||L.acc==='muetze') {
      b.merge(hatMesh(L),{});
    } else if (L.acc === "headset") {
      b.merge(headsetMesh(),{});
    }
    return b;
  }
  /* Lider (Blinzeln) und Mund (beim Sprechen) als eigene kleine Teile */
  function lidsMesh(L) {
    const b = new G3.MB();
    [-1, 1].forEach(s => b.sphere(0.018, 12, 8, L.skin, { x: s * 0.042, y: 0.142, z: 0.110, sy: 0.8, sz: 0.32, smooth: true }));
    return b;
  }
  function mouthMesh(L) { const b = new G3.MB(); b.box(0.042, 0.009, 0.01, mixH(L.lips, 0x000000, 0.35), { c: true }); return b; }
  const mouthZ = L => L.beard === "vollbart" ? 0.109 : L.beard === "stoppeln" ? 0.115 : 0.109;

  /* v300: Gemeinsames Schnittmuster für Rumpf und aufliegende Kleidung. Die Schulter
     reicht bis zum Ärmelansatz; Träger folgen Vorderseite, Schulter und Rücken. */
  const TORSO_PROFILE=[[0,.88,.92],[.14,1,1],[.30,1,1],[.335,.98,.96],[.36,.70,.75]];
  function torsoSize(L,y){
    const p=TORSO_PROFILE;let i=0;while(i<p.length-2&&y>p[i+1][0])i++;
    const a=p[i],b=p[i+1],t=clamp1((y-a[0])/(b[0]-a[0]),0,1);
    return [L.tw*(a[1]+(b[1]-a[1])*t)/2,L.td*(a[2]+(b[2]-a[2])*t)/2];
  }
  function torsoSurface(L,x,y,side,offset){
    const [w,d]=torsoSize(L,y);x=clamp1(x,-w+.001,w-.001);
    return [x,y,side*(d-Math.max(0,Math.abs(x)-(w-.024))+(offset||0))];
  }
  function clothPanel(b,L,x0,x1,ys,side,col,offset){
    /* Auch dort unterteilen, wo ein schmaler Träger über die Schulterfase läuft.
       Sonst schneidet die Dreiecksmitte trotz anliegender Ecken durch den Stoff. */
    const knots=ys.slice(),lo=ys[0],hi=ys[ys.length-1];
    for(let i=1;i<TORSO_PROFILE.length;i++){
      const a=TORSO_PROFILE[i-1],c=TORSO_PROFILE[i],w0=L.tw*a[1]/2,w1=L.tw*c[1]/2;
      if(c[0]>lo&&c[0]<hi)knots.push(c[0]);
      if(w0===w1)continue;
      for(const x of [x0,x1])for(const edge of [.024,.001]){
        const t=(Math.abs(x)+edge-w0)/(w1-w0),y=a[0]+t*(c[0]-a[0]);
        if(t>0&&t<1&&y>lo&&y<hi)knots.push(y);
      }
    }
    ys=[...new Set(knots)].sort((a,b)=>a-b);
    const row=y=>{
      const [w]=torsoSize(L,y),a=clamp1(x0,-w+.001,w-.001),c=clamp1(x1,-w+.001,w-.001);
      return [a,clamp1(-w+.024,a,c),clamp1(w-.024,a,c),c].map(x=>torsoSurface(L,x,y,side,offset));
    };
    for(let i=1;i<ys.length;i++){
      const lo=row(ys[i-1]),hi=row(ys[i]);
      for(let j=0;j<3;j++){
        const A=lo[j],B=lo[j+1],C=hi[j+1],D=hi[j];
        if(side>0)b.quad(A,B,C,D,col);else b.quad(A,D,C,B,col);
      }
    }
  }
  function overallStraps(L,vest){
    const b=new G3.MB(),ys=vest?[.34,.36,.3615]:[.205,.26,.30,.335,.36,.3615],half=vest?.024:.016,offset=vest?.004:.002;
    [-1,1].forEach(s=>{
      const x=s*(vest?.073:.065),x0=x-half,x1=x+half;
      clothPanel(b,L,x0,x1,ys,1,L.oc,offset);clothPanel(b,L,x0,x1,ys,-1,L.oc,offset);
      b.quad(torsoSurface(L,x0,.3615,1,offset),torsoSurface(L,x1,.3615,1,offset),torsoSurface(L,x1,.3615,-1,offset),torsoSurface(L,x0,.3615,-1,offset),L.oc);
    });
    return b;
  }
  function hoodMesh(L){
    const b=new G3.MB(),ys=[.359,.337,.303,.267,.245],ws=[.053,.074,.076,.058,.018];
    const rows=ys.map((y,j)=>Array.from({length:5},(_,i)=>{
      const s=i/2-1,fold=.003+.020*Math.sin(j/4*PI)*(1-s*s);
      return torsoSurface(L,s*ws[j],y,-1,fold);
    }));
    const normal=(j,i)=>{
      const A=rows[j][Math.max(0,i-1)],B=rows[j][Math.min(4,i+1)],C=rows[Math.max(0,j-1)][i],D=rows[Math.min(4,j+1)][i];
      const x=B.map((v,k)=>v-A[k]),y=D.map((v,k)=>v-C[k]);
      return nrm([x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]]);
    };
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){
      const A=rows[j][i],B=rows[j][i+1],C=rows[j+1][i+1],D=rows[j+1][i];
      b.tri(A,B,C,L.ocS,normal(j,i),normal(j,i+1),normal(j+1,i+1));b.tri(A,C,D,L.ocS,normal(j,i),normal(j+1,i+1),normal(j+1,i));
    }
    for(let j=0;j<4;j++)for(const i of [0,4]){
      const A=rows[j][i],B=rows[j+1][i],C=torsoSurface(L,B[0],B[1],-1,.001),D=torsoSurface(L,A[0],A[1],-1,.001);
      if(i)b.quad(B,A,D,C,L.ocS);else b.quad(A,B,C,D,L.ocS);
    }
    /* Angelegter Kragen, keine Kugel auf dem Rücken. */
    b.cyl(.049,.047,.012,16,L.ocS,{y:.351,nobot:true,notop:true,smooth:true});
    for(let i=0;i<16;i++){
      const a=i/16*2*PI,c=(i+1)/16*2*PI,P=(r,t)=>[Math.cos(t)*r,.363,Math.sin(t)*r];
      b.quad(P(.047,a),P(.042,a),P(.042,c),P(.047,c),L.ocS);
    }
    return b;
  }
  /* Oberkörper: Drehpunkt an der Taille (Figur y 0,42), Kleidung nach Avatar-Outfit, Namensschild in Rollenfarbe */
  function torsoMesh(L) {
    const b = new G3.MB(), tw = L.tw, td = L.td, f = td / 2, base = L.outfit === "warnweste" ? 0x3a4a5a : L.outfit === "latzhose" ? L.under : L.oc;
    /* v259: ein durchgehender, abgeschrägter Rumpf statt drei gestapelter Quader. */
    const ring = (w, d, y) => {
      const q = 0.024, x = w / 2, z = d / 2;
      return [[-x + q, y, -z], [x - q, y, -z], [x, y, -z + q], [x, y, z - q], [x - q, y, z], [-x + q, y, z], [-x, y, z - q], [-x, y, -z + q]];
    };
    const rings = TORSO_PROFILE.map(([y,w,d])=>ring(tw*w,td*d,y));
    for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < 8; j++)
      b.quad(rings[k][j], rings[k + 1][j], rings[k + 1][(j + 1) % 8], rings[k][(j + 1) % 8], base);
    for (let j = 0; j < 8; j++) b.tri([0, 0.36, 0], rings[4][(j + 1) % 8], rings[4][j], base);
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
        b.box(0.09, 0.018, 0.07, L.ocS, { y: 0.35, z: -0.012 });
        [-1, 1].forEach(s => b.box(0.07, 0.05, 0.004, L.ocS, { x: s * 0.075, y: 0.05, z: f + 0.002 }));
        fz = 0.003; break;
      case "warnweste":
        [-1,1].forEach(s=>clothPanel(b,L,s>0?.016:-tw/2+.012,s>0?tw/2-.012:-.016,[.01,.14,.30,.34],1,L.oc,.004));
        clothPanel(b,L,-tw/2+.012,tw/2-.012,[.01,.14,.30,.34],-1,L.oc,.004);
        b.merge(overallStraps(L,true),{});
        [.09,.19].forEach(y=>{
          [-1,1].forEach(s=>clothPanel(b,L,s>0?.016:-tw/2+.012,s>0?tw/2-.012:-.016,[y,y+.024],1,0xe8ebe0,.0055));
          clothPanel(b,L,-tw/2+.012,tw/2-.012,[y,y+.024],-1,0xe8ebe0,.0055);
        });
        fz = 0.004; break;
      case "kapuzenpulli":
        b.merge(hoodMesh(L),{});
        b.box(0.16, 0.08, 0.006, L.ocS, { y: 0.03, z: f + 0.003 });
        [-1, 1].forEach(s => b.box(0.006, 0.07, 0.004, L.ocT, { x: s * 0.025, y: 0.26, z: f + 0.004 }));
        b.box(tw - 0.024, 0.03, td - 0.004, L.ocS, { y: 0 });
        fz = 0.003; break;
      case "lederjacke":
        b.box(0.07, 0.3, 0.004, 0xe8e8e4, { y: 0.05, z: f + 0.002 });
        [-1, 1].forEach(s => b.box(0.05, 0.13, 0.008, L.ocT, { x: s * 0.05, y: 0.22, z: f + 0.004, rz: s * 0.25 }));
        fz = 0.007; break;
      case "latzhose":
        clothPanel(b,L,-.085,.085,[0,.14,.22],1,L.oc,.002);
        clothPanel(b,L,-tw/2+.012,tw/2-.012,[0,.14,.22],-1,L.oc,.002);
        b.merge(overallStraps(L),{});
        [-1, 1].forEach(s => {
          const p=torsoSurface(L,s*.065,.215,1,.004);
          b.box(.022,.022,.003,0xe8c04a,{x:p[0],y:.205,z:p[2]});
        });
        fz = 0.003; break;
    }
    /* v282: Gefasstes Namensschild, getrennte Tiefen verhindern Flimmern. */
    const badgeZ = torsoSurface(L,.075,.265,1,fz+.003)[2];
    b.box(0.072, 0.042, 0.004, 0x263747, { x: 0.075, y: 0.244, z: badgeZ });
    b.box(0.066, 0.036, 0.002, 0xf5f5ef, { x: 0.075, y: 0.247, z: badgeZ + 0.003 });
    b.box(0.066, 0.008, 0.001, ROLE_COL[L.role] || 0x3f78c8, { x: 0.075, y: 0.275, z: badgeZ + 0.0045 });
    [0.258, 0.251].forEach((y, i) => b.box(i ? 0.029 : 0.045, 0.002, 0.001, 0x596574, { x: 0.07, y, z: badgeZ + 0.0045 }));
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
  /* v300: Ein Ärmelprofil statt überlappender Kugel und Zylinder am Gelenk. */
  function sleeveMesh(col,rings){
    const b=new G3.MB(),N=14;
    const rows=rings.map(([y,r],i)=>{
      const A=rings[Math.max(0,i-1)],B=rings[Math.min(rings.length-1,i+1)],slope=(B[1]-A[1])/(B[0]-A[0]);
      return Array.from({length:N+1},(_,j)=>{const a=j/N*2*PI,c=Math.cos(a),s=Math.sin(a);return {p:[c*r,y,s*r],n:r?nrm([c,-slope,s]):[0,1,0]};});
    });
    for(let i=1;i<rows.length;i++)for(let j=0;j<N;j++){
      const A=rows[i-1][j],B=rows[i-1][j+1],C=rows[i][j+1],D=rows[i][j];
      if(rings[i-1][1])b.tri(A.p,B.p,C.p,col,A.n,B.n,C.n);
      b.tri(A.p,C.p,D.p,col,A.n,C.n,D.n);
    }
    return b;
  }
  function upperMesh(L) {
    return sleeveMesh(L.sleeve,[[.025,0],[.022,.017],[.012,.029],[0,.035],[-.055,.035],[-ARM_A+.012,.031],[-ARM_A,.033]]);
  }
  function foreMesh(L, side) {
    const b=sleeveMesh(L.sleeve,[[.030,0],[.025,.018],[.012,.030],[0,.033],[-.035,.032],[-ARM_B,.024]]),col=L.outfit === "kapuzenpulli" || L.outfit === "blaujacke" ? L.ocS : L.sleeve;
    /* v298: Rundes Bündchen mit echter Öffnung. Keine geschlossene Würfelkappe am Handgelenk. */
    const N=16, y0=-ARM_B-0.002,y1=-ARM_B+0.018;
    for(let i=0;i<N;i++){
      const a=i/N*2*PI,c=(i+1)/N*2*PI;
      const P=(r,y,t)=>[Math.cos(t)*r,y,Math.sin(t)*r];
      b.quad(P(0.026,y0,a),P(0.026,y1,a),P(0.026,y1,c),P(0.026,y0,c),col);
      b.quad(P(0.018,y0,c),P(0.018,y1,c),P(0.018,y1,a),P(0.018,y0,a),mixH(col,0x000000,0.12));
      b.quad(P(0.026,y0,c),P(0.018,y0,c),P(0.018,y0,a),P(0.026,y0,a),col);
    }
    return b;
  }
  /* v263: Hand mit Daumen und vier zweigliedrigen Fingern. Handkoordinaten: Ursprung Handmitte, +z zu den Fingern,
     −y Handfläche, Daumen auf der Körperseite (x = −side · …). Je Griff sind die Finger unterschiedlich gebeugt. */
  const PALM = 0.034;
  const FING = [[0.0195, 0.025, 0.022, 0.0062], [0.0065, 0.027, 0.024, 0.0063], [-0.0065, 0.026, 0.022, 0.0058], [-0.0195, 0.02, 0.018, 0.0052]];
  const FAN = [0.12, 0.04, -0.04, -0.1];
  const GRIPS = {
    rest:   { f: [[0.5, 0.7], [0.55, 0.75], [0.6, 0.8], [0.65, 0.85]], th: [0.55, -0.35, 0.75] },
    type:   { f: [[0.38, 0.62], [0.32, 0.6], [0.36, 0.62], [0.45, 0.66]], th: [0.55, -0.45, 0.7], fan: 0.4 },
    mouse:  { f: [[0.3, 0.42], [0.28, 0.42], [0.42, 0.55], [0.55, 0.7]], th: [0.75, -0.35, 0.5] },
    pen:    { f: [[0.6, 0.55], [0.95, 0.85], [1.35, 1.45], [1.45, 1.5]], pinch: true },
    cup:    { f: [[1.05, 1.25], [1.1, 1.3], [1.15, 1.3], [1.2, 1.3]], th: [0.3, -0.15, 0.95] },
    phone:  { f: [[0.8, 0.75], [0.85, 0.8], [0.9, 0.85], [0.95, 0.9]], th: [0.35, -0.5, 0.8] },
    spread: { f: [[0.15, 0.2], [0.12, 0.18], [0.15, 0.2], [0.2, 0.25]], th: [0.9, -0.2, 0.45], fan: 1 },
    open:   { f: [[0.08, 0.12], [0.06, 0.1], [0.08, 0.12], [0.12, 0.14]], th: [0.7, 0.05, 0.7], fan: 0.8 }
  };
  const PINCH = side => [-side * 0.0225, -0.034, 0.055];
  function fingerPts(side, grip, i) {
    const G = GRIPS[grip], [m, l1, l2] = FING[i], [a1, a2] = G.f[i], fx = -side * FAN[i] * (G.fan || 0);
    const d1 = nrm([fx, -Math.sin(a1), Math.cos(a1)]), d2 = nrm([fx, -Math.sin(a1 + a2), Math.cos(a1 + a2)]);
    const p0 = [-side * m, 0, 0.023], p1 = p0.map((v, k) => v + d1[k] * l1);
    return { p0, p1, p2: p1.map((v, k) => v + d2[k] * l2), d1, d2 };
  }
  function thumbPts(side, grip) {
    const G = GRIPS[grip], t0 = [-side * 0.026, -0.004, 0];
    let d1, d2;
    if (G.pinch) { d1 = nrm(PINCH(side).map((v, k) => v - t0[k])); d2 = d1; }
    else { d1 = nrm([-side * G.th[0], G.th[1], G.th[2]]); d2 = nrm([-side * G.th[0] * 0.5, G.th[1] - 0.35, G.th[2]]); }
    const t1 = t0.map((v, k) => v + d1[k] * 0.03);
    return { t0, t1, t2: t1.map((v, k) => v + d2[k] * 0.027), d1, d2 };
  }
  /* Stift zwischen Daumen und Zeigefinger, Spitze vorn unten, Ende auf der Daumenfalte */
  function penPose(side) {
    const pin = PINCH(side), top = [-side * 0.024, 0.006, 0.004], d = nrm(top.map((v, k) => v - pin[k]));
    const tip = pin.map((v, k) => v - d[k] * 0.02), c = tip.map((v, k) => v + d[k] * 0.045);
    return { tip, c, rx: Math.acos(clamp1(d[1], -1, 1)), ry: Math.atan2(d[0], d[2]) };
  }
  function limb(b, p, d, len, r0, r1, col) {
    b.cyl(r0, r1, len, 7, col, { x: p[0], y: p[1], z: p[2], rx: Math.acos(clamp1(d[1], -1, 1)), ry: Math.atan2(d[0], d[2]), smooth: true });
  }
  function handMesh(L, side, grip) {
    const b = new G3.MB(), c = L.skin, cs = mixH(L.skin, L.skinS, 0.35);
    grip = GRIPS[grip] ? grip : "rest";
    /* v298: Ein durchgehendes Profil von der schmalen Handwurzel bis zu den Knöcheln.
       Der hintere Ring reicht in das offene Bündchen; keine zwei Hautkugeln mehr. */
    const rings=[[-0.046,0.012,0.008],[-0.034,0.014,0.009],[-0.018,0.023,0.0105],[0.004,0.028,0.011],[0.026,0.026,0.010]];
    const V=rings.map(([z,w,h],i)=>{
      const A=rings[Math.max(0,i-1)],B=rings[Math.min(rings.length-1,i+1)],dz=B[0]-A[0],dw=(B[1]-A[1])/dz,dh=(B[2]-A[2])/dz;
      return Array.from({length:17},(_,j)=>{const a=j/16*2*PI,x=Math.cos(a),y=Math.sin(a);return {p:[x*w,y*h,z],n:nrm([x/w,y/h,-dw*x*x/w-dh*y*y/h])};});
    });
    for(let i=1;i<V.length;i++)for(let j=0;j<16;j++){
      const A=V[i-1][j],B=V[i][j],C=V[i][j+1],D=V[i-1][j+1];
      b.tri(A.p,C.p,B.p,c,A.n,C.n,B.n);b.tri(A.p,D.p,C.p,c,A.n,D.n,C.n);
    }
    for(let j=0;j<16;j++){
      b.tri([0,0,rings[0][0]],V[0][j+1].p,V[0][j].p,c);
      b.tri([0,0,rings[4][0]],V[4][j].p,V[4][j+1].p,c);
    }
    for (let i = 0; i < 4; i++) {
      const f = fingerPts(side, grip, i), r = FING[i][3] * 0.82;
      b.sphere(r * 1.08, 7, 5, c, { x: f.p0[0], y: f.p0[1], z: f.p0[2], smooth: true });
      limb(b, f.p0, f.d1, FING[i][1], r, r, c);
      b.sphere(r * 0.98, 7, 5, c, { x: f.p1[0], y: f.p1[1], z: f.p1[2], smooth: true });
      limb(b, f.p1, f.d2, FING[i][2], r * 0.95, r * 0.9, c);
      b.sphere(r * 0.9, 7, 5, cs, { x: f.p2[0], y: f.p2[1], z: f.p2[2], smooth: true });
    }
    const t = thumbPts(side, grip), r = 0.0075;
    b.sphere(r * 1.25, 7, 5, c, { x: t.t0[0], y: t.t0[1], z: t.t0[2], smooth: true });
    limb(b, t.t0, t.d1, 0.03, r * 1.15, r, c);
    b.sphere(r, 7, 5, c, { x: t.t1[0], y: t.t1[1], z: t.t1[2], smooth: true });
    limb(b, t.t1, t.d2, 0.027, r * 0.95, r * 0.85, c);
    b.sphere(r * 0.88, 7, 5, cs, { x: t.t2[0], y: t.t2[1], z: t.t2[2], smooth: true });
    return b;
  }
  /* Kontaktpunkt je Griff in Handkoordinaten: Fingerkuppe, Handfläche, Stiftspitze, Henkel, Telefonmitte */
  function gripOff(side, grip) {
    const tip = (g, dy) => { const p = fingerPts(side, g, 1).p2; return [p[0], p[1] - dy, p[2]]; };
    switch (grip) {
      case "type": return tip("type", 0.006);
      case "spread": return tip("spread", 0.005);
      case "mouse": return [0, -0.014, 0.012];
      case "pen": return penPose(side).tip;
      case "cup": return [-side * 0.002, -0.022, 0.03];
      case "phone": return [0, -0.024, 0.012];
      case "open": return [0, -0.013, 0.02];
      default: return [0, -0.013, 0.004];
    }
  }
  /* Handdrehung je Griff (Figur-Koordinaten, Reihenfolge der Engine) */
  const HROT = {
    type: s => [0.14, -s * 0.18, -s * 0.12], mouse: s => [0.1, -s * 0.06, -s * 0.08], rest: s => [0.02, -s * 0.32, -s * 0.3],
    spread: s => [0.04, -s * 0.22, 0], pen: s => [0.32, -s * 0.38, -s * 0.9], cup: s => [0.05, -s * 0.12, -s * 1.45],
    phone: s => [0.12, -s * 0.1, -s * 0.15], ear: s => [-2.69, 0, -s * PI / 2], open: s => [-PI / 2, s * 0.2, PI]
  };
  /* Kleine Dinge in Figureinheiten (Welt / 1,45): Telefon, Maus, Stift; Becher wie in der Küche (Meter, Knoten mit 1/FS) */
  const U = v => v / FS;
  const MUG_HANDLE = [0.066, 0.057, 0], MUG_RIM = 0.04, MUG_H = 0.108;
  function mugMesh(c) { const b = OFFICE_KITCHEN.cupMesh(c); b.cyl(0.0358, 0.0358, 0.0015, 16, 0x59321b, { y: 0.086, top: 0x82512c }); return b; }
  function phoneMesh() { const b = new G3.MB(); b.box(U(0.075), U(0.01), U(0.15), 0x1d1d20, { y: 0 }); b.box(U(0.064), U(0.002), U(0.13), 0x2c4a6a, { y: U(0.01) }); return b; }
  /* v298: Die Maus blickt wie die Figur nach +z: flache Tasten vorn, hohe Handauflage
     hinten. Integrierte Tastenschalen statt aufgeklebter ovaler Knöpfe. */
  const MOUSE_ANCHOR=[0,U(0.032),U(-0.010)];
  function mouseMesh() {
    const b=new G3.MB(),N=16;
    const height=(x,z)=>0.004+0.030*Math.sqrt(Math.max(0,1-(x/0.033)**2-((z+0.004)/0.055)**2))*(1-0.22*smooth(-0.02,0.05,z));
    const P=(x,z)=>{
      const y=height(x,z),e=0.0001;
      return {p:[U(x),U(y),U(z)],n:nrm([-(height(x+e,z)-height(x-e,z))/(2*e),1,-(height(x,z+e)-height(x,z-e))/(2*e)])};
    };
    /* Gerade gemeinsame Tastennaht statt einer Farbkante quer durch radiale Dreiecke. */
    const zs=[-0.059,-0.057,-0.053,-0.048,-0.042,-0.035,-0.028,-0.021,-0.014,-0.007,0,0.006,0.012,0.018,0.024,0.030,0.036,0.041,0.045,0.048,0.050,0.051];
    const rows=zs.map(z=>{
      const w=0.033*Math.sqrt(Math.max(0,1-((z+0.004)/0.055)**2));
      return Array.from({length:N+1},(_,i)=>P(w*Math.sin((i/N-0.5)*PI),z));
    });
    for(let j=0;j<rows.length-1;j++){
      const col=zs[j]>=0.006?0x45515d:0x303942;
      for(let i=0;i<N;i++){
        const A=rows[j][i],B=rows[j][i+1],C=rows[j+1][i+1],D=rows[j+1][i];
        b.tri(A.p,D.p,C.p,col,A.n,D.n,C.n);b.tri(A.p,C.p,B.p,col,A.n,C.n,B.n);
      }
      const A=rows[j][0].p,B=rows[j+1][0].p,C=rows[j][N].p,D=rows[j+1][N].p;
      const down=p=>[p[0],0,p[2]];
      b.quad(A,down(A),down(B),B,0x1b242d);b.quad(C,D,down(D),down(C),0x1b242d);
      b.quad(down(A),down(C),down(D),down(B),0x1b242d);
    }
    for(let i=0;i<8;i++){
      const z=0.008+i*0.005,z1=z+0.005,x=0.00055;
      const p=(xx,zz)=>[U(xx),U(height(xx,zz)+0.00025),U(zz)];
      b.quad(p(-x,z),p(-x,z1),p(x,z1),p(x,z),0x17212a);
    }
    b.cyl(U(0.0038),U(0.0038),U(0.005),14,0x8b99a4,{x:U(-0.0025),y:U(height(0,0.022)-0.0018),z:U(0.022),rz:-PI/2,smooth:true});
    return b;
  }
  function penMesh() { const b = new G3.MB(); b.cyl(0.0035, 0.0035, 0.09, 8, 0x2a4a8a, { y: -0.045 }); return b; }
  /* v263: Schreibblock mit Linien (Meter, Knoten mit 1/FS) – die Person zieht ihn zum Schreiben heran und schiebt ihn danach zurück */
  function noteMesh() {
    const b = new G3.MB();
    b.box(0.15, 0.008, 0.21, 0xf6f1d8);
    b.box(0.15, 0.004, 0.018, 0x3f78c8, { y: 0.008, z: -0.096 });
    for (let r = 0; r < 5; r++) b.box(0.11, 0.0015, 0.003, 0x9ab0c8, { y: 0.008, z: -0.06 + r * 0.03 });
    return b;
  }
  function penMeshM() { const b = new G3.MB(); b.cyl(0.005, 0.005, 0.13, 8, 0x2a4a8a, { y: -0.065 }); b.cyl(0.0052, 0.0052, 0.012, 8, 0xd8dde2, { y: 0.053 }); return b; }
  const NOTE_REST = { x: 0.55, z: 0.33, ry: -0.2 }, NOTE_WRITE = { x: 0.36, z: 0.42, ry: -0.34 };
  function notePose(F) {
    const e = ease(F.noteK || 0), dx = NOTE_REST.x + (NOTE_WRITE.x - NOTE_REST.x) * e, dz = NOTE_REST.z + (NOTE_WRITE.z - NOTE_REST.z) * e;
    const ry = NOTE_REST.ry + (NOTE_WRITE.ry - NOTE_REST.ry) * e;
    return { c: [-dx / FS, 0.768 / FS, -(dz - CHAIR_D) / FS], ry, u: [-Math.cos(ry), 0, Math.sin(ry)], v: [-Math.sin(ry), 0, -Math.cos(ry)] };
  }
  const notePt = (N, u, v, h) => [N.c[0] + (N.u[0] * u + N.v[0] * v) / FS, N.c[1] + (h || 0) / FS, N.c[2] + (N.u[2] * u + N.v[2] * v) / FS];

  /* Tätigkeiten: Gewicht je Rolle, Dauer, Haltung (Vorbeugen) */
  const ACTS = {
    type:  { w: { disp: 3, fahr: 1, ums: 1.5, zoll: 2.5 }, d: [10, 18], lean: 0.06 },
    mouse: { w: { disp: 3, fahr: 1.5, ums: 2, zoll: 1.5 }, d: [7, 13], lean: 0.05 },
    read:  { w: { disp: 1, fahr: 2, ums: 2, zoll: 3 }, d: [9, 15], lean: 0.075 },
    note:  { w: { disp: 1.5, fahr: 1, ums: 1.5, zoll: 2 }, d: [9.5, 14], lean: 0.15 },
    phone: { w: { disp: 2.5, fahr: 2, ums: 1.5, zoll: 1 }, d: [11, 16], lean: 0.0 },
    cup:   { w: { disp: 1, fahr: 1.5, ums: 1, zoll: 1 }, d: [9.5, 13], lean: 0.04 },
    look:  { w: { disp: 0.6, fahr: 1, ums: 0.8, zoll: 0.6 }, d: [3, 5], lean: -0.02 }
  };
  function pickAct(F) {
    const keys = Object.keys(ACTS).filter(k => (k !== F.act || k === "type") && !(k === "cup" && F.act === "gift"));   /* v263: nach geschenktem Kaffee nicht gleich zum eigenen Becher */
    const tot = keys.reduce((a, k) => a + (ACTS[k].w[F.L.role] || 1), 0);
    let r = F.rnd() * tot, k = keys[0];
    for (const x of keys) { r -= ACTS[x].w[F.L.role] || 1; if (r <= 0) { k = x; break; } }
    const D = ACTS[k].d;
    F.act = k; F.actT = 0; F.actDur = D[0] + F.rnd() * (D[1] - D[0]);
    F.held = null; F.cupKeys = null;
  }

  /* Figur zusammensetzen: Wurzel am Stuhl (Blick zum Bildschirm), alle Teile als Kinder */
  function buildFigure(R, s, M) {
    const L = lookOf(s.p), key = L.key;
    const root = R.node(null, { x: s.x, y: 0, z: s.z, ry: PI, s: FS });
    const part = (k, fn, o) => R.addChild(root, R.node(M(k, fn), o || {}));
    part("legs:" + key, () => legsMesh(L));
    const torso = part("torso:" + key, () => torsoMesh(L), { y: 0.42 });
    const head = part("head:" + key, () => headMesh(L), { y: 0.82, s: 0.94 });
    const lids = R.addChild(head, R.node(M("lids:" + L.skin, () => lidsMesh(L)), { visible: false, shadow: false }));
    const mouth = R.addChild(head, R.node(M("mouth:" + L.lips + ":" + L.beard, () => mouthMesh(L)), { y: 0.086, z: mouthZ(L), shadow: false }));
    const arm = [1, -1].map(side => {
      const ua = part("ua:" + L.sleeve, () => upperMesh(L));
      const fa = R.addChild(ua, R.node(M("fa:" + side + ":" + L.sleeve + ":" + L.skin + ":" + L.outfit, () => foreMesh(L, side)), { y: -ARM_A }));
      const hand = part("hand:" + side + ":" + L.skin + ":rest", () => handMesh(L, side, "rest"), { shadow: true });
      return { side, ua, fa, hand, S: [side * L.sh, 0.75, 0], T: null, H: [0, 0, 0], pole: [side * 0.25, -1, -0.45], g: "rest", r: null, C: null };
    });
    const pp = penPose(-1);
    const pen = R.addChild(arm[1].hand, R.node(M("pen", penMesh), { x: pp.c[0], y: pp.c[1], z: pp.c[2], rx: pp.rx, ry: pp.ry, visible: false, shadow: false }));
    /* Desk-Gegenstände in Figur-Koordinaten (Welt → Figur: x und z gespiegelt, / 1,45); Lage wie in buildRoom (v263) */
    const loc = (dx, y, dz) => [-dx / FS, y / FS, -(dz - CHAIR_D) / FS];
    const P = {
      kb: loc(-0.04, 0.778, 0.25), mouse: loc(0.31, 0.762, 0.25), papers: loc(-0.64, 0.782, 0.22), paperHold: loc(-0.55, 0.784, 0.33), phone: loc(-0.43, 0.76, 0.3), cup: loc(0.33, 0.76, 0.1), mon: loc(0, 1.15, -0.06)
    };
    const cup = part("mug:" + L.cup, () => mugMesh(L.cup), { x: P.cup[0], y: P.cup[1], z: P.cup[2], ry: PI, s: 1 / FS, shadow: false });
    const phone = part("phone", phoneMesh, { x: P.phone[0], y: P.phone[1], z: P.phone[2], ry: -0.1, shadow: false });
    const mouse = part("mouse", mouseMesh, { x: P.mouse[0], y: P.mouse[1], z: P.mouse[2], shadow: false });
    const note = part("note", noteMesh, { y: 0.76 / FS, s: 1 / FS, shadow: false });
    const penRest = R.addChild(note, R.node(M("penM", penMeshM), { x: 0.035, y: 0.0135, z: 0.01, rz: PI / 2, ry: 0.6, shadow: false }));
    const r0 = rng(nameHash(s.p.id || s.p.name) * 7 + 13);
    const F = Object.assign(s, {
      L, root, torso, head, lids, mouth, arm, pen, penRest, note, noteK: 0, cup, phone, mouse, P, rnd: r0, M,
      lean: 0.1, tw: 0, br: 1, yaw: 0, pitch: 0.2, gaze: [0, 0], gazeT: 0,
      bF: 1.35 + r0() * 0.5, bP: r0() * 6.3, tP: [r0() * 6.3, r0() * 6.3], tF: 8 + r0() * 4,
      blinkAt: 1 + r0() * 4, blinkEnd: 0, talkUntil: 0, attendUntil: 0, lookUntil: 0, nextPeek: 2 + r0() * 6,
      act: null, actT: 0, actDur: 1, held: null, talkN: Math.floor(r0() * 5), lastSay: "", mPos: P.mouse.slice()
    });
    pickAct(F); F.actT = 0;
    arm.forEach(a => { a.T = rest(F, a.side); a.H = a.T.slice(); });
    return root;
  }
  const rest = (F, side) => [side * 0.15, 0.561, 0.32];

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
  /* v260: Ellbogen bleiben außen/unten; die Tischplatte und der Kopf sind Sperrbereiche. */
  const elbowCircle = Array.from({ length: 24 }, (_, i) => [Math.cos(i * PI / 12), Math.sin(i * PI / 12)]);
  const DESK_LO = [-0.74 / FS, 0.72 / FS, (CHAIR_D - 0.52) / FS], DESK_HI = [1.34 / FS, 0.76 / FS, (CHAIR_D + 0.52) / FS];
  function segmentBox(A, B, lo, hi, pad) {
    let t0 = 0, t1 = 1;
    for (let i = 0; i < 3; i++) {
      const d = B[i] - A[i];
      if (Math.abs(d) < 1e-8) { if (A[i] < lo[i] - pad || A[i] > hi[i] + pad) return false; }
      else {
        let a = (lo[i] - pad - A[i]) / d, b = (hi[i] + pad - A[i]) / d;
        if (a > b) [a, b] = [b, a];
        t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return false;
      }
    }
    return true;
  }
  function pointSegment(P, A, B) {
    const d = B.map((v, i) => v - A[i]), q = P.map((v, i) => v - A[i]);
    const k = clamp1(q.reduce((s, v, i) => s + v * d[i], 0) / (d.reduce((s, v) => s + v * v, 0) || 1), 0, 1);
    return Math.hypot(...P.map((v, i) => v - A[i] - d[i] * k));
  }
  function nodePoint(n, p) {
    const M = G3.trs(G3.ID(), n.x, n.y, n.z, n.rx, n.ry, n.rz, n.sx, n.sy, n.sz);
    return [0, 1, 2].map(i => M[i] * p[0] + M[i + 4] * p[1] + M[i + 8] * p[2] + M[i + 12]);
  }
  function solveArm(a, T, F, dt) {
    const S = a.S, A = ARM_A, B = ARM_B;
    /* v260: jedes Handziel bleibt auf seiner Körperseite. */
    T = T.slice(); T[0] = a.side * Math.max(0.045, a.side * T[0]);
    const delta = T.map((v, i) => v - S[i]), d0 = Math.hypot(...delta) || 1e-4;
    const d = clamp1(d0, 0.1, A + B - 0.006), u = delta.map(v => v / d0);
    const p = a.pole, pd = p.reduce((s, v, i) => s + v * u[i], 0), w = nrm(p.map((v, i) => v - pd * u[i]));
    const v = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const ca = clamp1((A * A + d * d - B * B) / (2 * A * d), -1, 1), radius = A * Math.sqrt(1 - ca * ca);
    const C = S.map((v, i) => v + A * ca * u[i]), Hh = S.map((v, i) => v + d * u[i]);
    const head = F ? nodePoint(F.head, HC) : null;
    let E = null, score = Infinity;
    const candidates = elbowCircle.map(([c, s]) => C.map((q, i) => q + radius * (w[i] * c + v[i] * s)));
    const limited = [];
    if (a.E) {
      const prev = a.E.map((q, i) => q - C[i]), k = prev.reduce((s, q, i) => s + q * u[i], 0), dir = nrm(prev.map((q, i) => q - k * u[i]));
      const tangent = [u[1] * dir[2] - u[2] * dir[1], u[2] * dir[0] - u[0] * dir[2], u[0] * dir[1] - u[1] * dir[0]];
      for (const f of [-1, -0.5, 0, 0.5, 1]) {
        const angle = f * Math.min(0.12, (dt || 1 / 60) * 3.2);
        limited.push(C.map((q, i) => q + radius * (dir[i] * Math.cos(angle) + tangent[i] * Math.sin(angle))));
      }
    }
    /* Erst nahe Fortsetzungen der letzten Pose prüfen: kein Umspringen der Ellbogenebene. */
    for (const q of limited.concat(candidates)) {
      const ep = a.el || [a.side * 0.23, S[1] - 0.17, 0.1];                   /* v263: bevorzugte Ellbogenlage je Tätigkeit */
      let cost = (q[0] - ep[0]) ** 2 * 4 + (q[1] - ep[1]) ** 2 * 2 + (q[2] - ep[2]) ** 2;
      if (a.E) cost += q.reduce((sum, v, i) => sum + (v - a.E[i]) ** 2, 0) * 0.8;
      if (a.side * q[0] < 0.15) cost += 100 + (0.15 - a.side * q[0]) * 100;
      if (q[1] > S[1] + 0.015) cost += 100 + (q[1] - S[1]) * 100;
      if (segmentBox(S, q, DESK_LO, DESK_HI, 0.03) || segmentBox(q, Hh, DESK_LO, DESK_HI, 0.03)) cost += 1000;
      if (head && pointSegment(head, q, Hh) < HR * 0.94 + 0.024) cost += 1000;
      if (limited.length && !limited.includes(q) && score < 100) break;
      if (cost < score) { score = cost; E = q; }
    }
    const ur = dirRot(nrm(E.map((v, i) => v - S[i])));
    a.ua.x = S[0]; a.ua.y = S[1]; a.ua.z = S[2]; a.ua.rx = ur[0]; a.ua.rz = ur[1];
    const fr = dirRot(nrm(invRxRz(ur[0], ur[1], Hh.map((v, i) => v - E[i]))));
    a.fa.rx = fr[0]; a.fa.rz = fr[1]; a.H = Hh; a.E = E;
  }

  /* v263: Tätigkeiten nach echtem Ablauf. Jede Hand bekommt ein Ziel: Kontaktpunkt c (Figur-Koordinaten), Griff g, Drehung r,
     Kontaktgriff o. Daraus folgt das Handgelenk; Arm-IK wie v260, die Hand setzt am Handgelenk an. Gegenstände (Becher, Telefon,
     Maus) folgen der tatsächlichen Hand, solange sie gegriffen sind – nichts schwebt, nichts springt. */
  const R3 = (r, v) => nodePoint({ x: 0, y: 0, z: 0, rx: r[0], ry: r[1], rz: r[2], sx: 1, sy: 1, sz: 1 }, v);
  const OFFS = new Map();
  const offOf = (side, g) => { const k = side + ":" + g; if (!OFFS.has(k)) OFFS.set(k, gripOff(side, g)); return OFFS.get(k); };
  const want = (c, g, side, r, o) => ({ c, g, r: r || HROT[g](side), o: o || g });
  const kbAt = (F, side, tap) => { const P = F.P.kb; return want([P[0] + side * 0.072, P[1] + 0.004 + (tap || 0), P[2] - 0.008], "type", side); };
  const restOn = (F, side) => want([side * 0.135, DESK_HI[1] + 0.001, DESK_LO[2] + 0.065], "rest", side);
  function mouseAt(F, mv) {
    const P = F.P.mouse, t = O.t, s = O.reduced ? 0 : mv;
    return want([P[0] + Math.sin(t * 0.6 + F.tP[0]) * 0.012 * s, P[1] + MOUSE_ANCHOR[1], P[2] + MOUSE_ANCHOR[2] + Math.cos(t * 0.45 + F.tP[1]) * 0.009 * s], "mouse", -1);
  }
  /* Becher: Henkel, Rand am Mund, Halten vor der Brust; psi = Drehung um die Hochachse (PI: Henkel rechts, 0: links) */
  const mugRot = (psi, tilt) => [psi ? tilt : -tilt, psi, 0];
  const mugAnchor = (base, psi, tilt) => { const h = R3(mugRot(psi, tilt), MUG_HANDLE); return base.map((v, i) => v + h[i] / FS); };
  const mugFromAnchor = (a, psi, tilt) => { const h = R3(mugRot(psi, tilt), MUG_HANDLE); return a.map((v, i) => v - h[i] / FS); };
  function mugAtMouth(F, psi, tilt) {
    const m = nodePoint(F.head, [0, 0.088, 0.128]), rim = R3(mugRot(psi, tilt), [0, MUG_H, psi ? MUG_RIM : -MUG_RIM]);
    return m.map((v, i) => v - rim[i] / FS);
  }
  const mugChest = (F, side) => torsoPt(F, side * 0.07, 0.12, F.L.td / 2 + 0.16);
  /* Schlüsselbilder [Zeit, Ort, Kippung]; Ort: "home" | "chest" | "mouth" | Punkt in Figur-Koordinaten */
  function mugPlan(F, side, psi, keys, k, home) {
    const place = (p, tilt) => p === "home" ? home : p === "chest" ? mugChest(F, side) : p === "mouth" ? mugAtMouth(F, psi, tilt) : p;
    let i = 0; while (i < keys.length - 2 && k >= keys[i + 1][0]) i++;
    const [t0, p0, a0] = keys[i], [t1, p1, a1] = keys[i + 1], e = ease((k - t0) / Math.max(1e-3, t1 - t0)), tilt = a0 + (a1 - a0) * e;
    const base = lerp3(place(p0, tilt), place(p1, tilt), e);
    if (p0 !== p1 && (p0 === "home" || p1 === "home" || p0 === "chest" && Array.isArray(p1))) base[1] += Math.sin(e * PI) * 0.02;
    return { base, tilt };
  }
  /* Eigener Becher: greifen, anheben, ansetzen, trinken (Becher kippt, Kopf leicht zurück), vor der Brust halten,
     bei längerer Pause ein zweiter Schluck, abstellen, loslassen */
  function cupKeys(D) {
    const K = [[0, "home", 0], [0.85, "home", 0], [1.8, "chest", 0], [2.3, "mouth", 0.25], [3.0, "mouth", 0.8], [3.7, "mouth", 0.25], [4.3, "chest", 0]];
    const h0 = 4.3, h1 = D - 2.3;
    if (h1 - h0 > 3.4) { const s = (h0 + h1) / 2 - 1.05; K.push([s, "chest", 0], [s + 0.5, "mouth", 0.25], [s + 1.05, "mouth", 0.7], [s + 1.6, "mouth", 0.25], [s + 2.1, "chest", 0]); }
    K.push([h1, "chest", 0], [D - 1.1, "home", 0], [D + 99, "home", 0]);
    return K;
  }
  /* Schreiben: Stiftspitze läuft Zeile für Zeile über den Block, kleine Buchstabenschleifen, Wortabstände mit angehobenem Stift */
  function writePt(F, w) {
    const P = F.P, LINE = 3.3, RET = 0.45, per = LINE + RET, n = Math.floor(w / per), lt = w - n * per;
    let u, lift = 0, v = -0.06 + (n % 5) * 0.03;
    if (lt < LINE) {
      u = -0.045 + 0.09 * lt / LINE + 0.0025 * Math.sin(lt * 31);
      v += 0.0022 * Math.sin(lt * 23 + 0.7) + 0.0012 * Math.sin(lt * 51);
      const wd = (lt % 0.95) / 0.95; if (wd > 0.84) lift = 0.006 * Math.sin((wd - 0.84) / 0.16 * PI);
    } else { const e = ease((lt - LINE) / RET); u = 0.045 - 0.09 * e; v += 0.03 * e; lift = 0.012 * Math.sin(e * PI) + 0.004; }
    if (O.reduced) { lift = 0; }
    return notePt(notePose(F), u, v, lift + 0.0015);
  }
  const setNode = (n, p, r) => { n.x = p[0]; n.y = p[1]; n.z = p[2]; n.rx = r[0]; n.ry = r[1]; n.rz = r[2]; };

  /* v284: Bei Tischkontakt folgt die Hand der Unterarmrichtung, bleibt aber mit der Handfläche unten.
     Telefon- und Henkelgriffe behalten ihre gezielt vorgegebene Ausrichtung. */
  function deskWrist(a, I) {
    if (!["type", "mouse", "rest", "spread"].includes(I.g)) return I.r;
    const d = a.E && a.H ? a.H.map((v, i) => v - a.E[i]) : I.c.map((v, i) => v - a.S[i]);
    if (Math.hypot(d[0], d[2]) < 0.01) return I.r;
    return [clamp1(I.r[0], -0.3, 0.45), clamp1(Math.atan2(d[0], d[2]), -1.25, 1.25), clamp1(I.r[2], -0.22, 0.22)];
  }
  /* v315: Die Blase bleibt über dem Kopf der Person und wird nicht mit dem Bild skaliert. Nur waagerecht
     wird sie so weit zurechtgerückt, dass sie ganz zu sehen ist; liegt der Kopf nicht im Bild, verschwindet sie
     (vorher klebte sie am Bildrand fest und schrumpfte dort zu einer schmalen Textspalte). */
  function bubblePosition(x, y, w, h, boxW, boxH) {
    const pad = 8, half = Math.min(boxW, w - pad * 2) / 2;
    if (x < 0 || x > w || y < 0 || y > h + 40) return null;
    return [clamp1(x, pad + half, Math.max(pad + half, w - pad - half)), Math.max(y, boxH + 4)];
  }
  function animFigure(F, dt, now, pl) {
    if (!F.shock && !O.deaths) F.actT += dt;
    if (!F.shock && !O.deaths && F.actT >= F.actDur) { if (F.act === "gift") giftDone(F); pickAct(F); }
    const A = F.act, P = F.P, k = F.actT, D = F.actDur, t = O.t, [L, Rr] = F.arm, reduce = O.reduced;
    const attend = now < F.attendUntil, headset = F.L.acc === "headset";
    const tap = ph => reduce ? 0 : -0.003 * Math.pow(Math.max(0, Math.sin(t * F.tF + ph)), 6);
    const grab = (a, b, c, d) => k < a ? 0 : k < b ? ease((k - a) / (b - a)) : k < c ? 1 : k < d ? 1 - ease((k - c) / (d - c)) : 0;
    let IL = kbAt(F, 1), IR = mouseAt(F, 0), look = P.mon, lean = ACTS[A] ? ACTS[A].lean : 0.04, talk = now < F.talkUntil;
    let cupP = null, phoneP = null, writing = false, carrying = false, sip = 0, headRz = 0, yawWide = 0.65, twBias = 0, mouseOn = A === "mouse";
    if (A === "type") {
      const sw = reduce ? 0 : 0.008;
      IL = kbAt(F, 1, tap(F.tP[0])); IL.c[0] += Math.sin(t * 0.5 + F.tP[0]) * sw;
      IR = kbAt(F, -1, tap(F.tP[1] + 1.7)); IR.c[0] += Math.sin(t * 0.47 + F.tP[1]) * sw;
      if (!reduce && (t + F.bP * 3) % 7.3 < 0.7) look = P.kb;                          /* kurzer Blick auf die Tastatur */
    } else if (A === "mouse" || (A === "phone" && headset)) {
      IR = mouseAt(F, 1); mouseOn = true;
      if (A === "phone") talk = true;
    } else if (A === "read") {
      IL = want([P.paperHold[0], P.paperHold[1], P.paperHold[2] - Math.min(1, k / D) * 0.02], "spread", 1);
      look = [P.papers[0] + Math.sin(k * 2.4) * 0.025, P.papers[1], P.papers[2] + (k / D - 0.5) * 0.07];
      yawWide = 0.85; mouseOn = true;
    } else if (A === "note") {
      /* Block mit den Fingerspitzen heranziehen, Stift nehmen, schreiben, Stift ablegen, Block zurückschieben;
         linke Hand ruht auf dem Tisch, Blick auf die Stiftspitze */
      const pull = k < 0.6 ? 0 : k < 1.3 ? ease((k - 0.6) / 0.7) : k < D - 1.3 ? 1 : k < D - 0.7 ? 1 - ease((k - (D - 1.3)) / 0.6) : 0;
      if (k >= 0.6 && k < D - 0.7) F.noteK = pull;
      const N = notePose(F), corner = notePt(N, 0.06, 0.095, 0.002), penAt = notePt(N, 0.035, 0.01, 0.0045);
      writing = k >= 1.75 && k < D - 1.7;
      let c = null, g = "pen";
      if (k < 1.3 || (k >= D - 1.6 && k < D - 0.7)) { c = corner; g = "spread"; }
      else if (k < 1.9 || k >= D - 2.0) c = penAt;
      else c = writePt(F, k - 1.9);
      if (c) IR = want(c, g, -1);
      IL = restOn(F, 1);
      if (c) look = c;
      yawWide = 0.85; twBias = -0.07;
    } else if (A === "phone") {
      /* Telefon mit links vom Tisch ans Ohr: Display an der Wange, Ellbogen unten, Kopf leicht zum Telefon geneigt */
      const ear = nodePoint(F.head, [0.127, 0.084, 0.05]);
      const up = k < 0.8 ? 0 : k < 2.0 ? ease((k - 0.8) / 1.2) : k < D - 2.0 ? 1 : k < D - 0.8 ? 1 - ease((k - (D - 2.0)) / 1.2) : 0;
      const pos = lerp3(P.phone, ear, up); pos[1] += Math.sin(up * PI) * 0.03;
      phoneP = { pos, rot: lerp3([0, -0.1, 0], [0.42, F.yaw * 0.8, PI / 2], up), g: grab(0.55, 0.8, D - 0.8, D - 0.55) };
      if (k < D - 0.5) { IL = want(pos, k < 0.55 ? "rest" : "phone", 1, lerp3(HROT.phone(1), HROT.ear(1), up), "phone"); if (up > 0.3) IL.el = [0.1, 0.58, 0.2]; }
      talk = k > 2.2 && k < D - 2.2;
      if (up > 0.9) { look = [Math.sin(t * 0.31 + F.bP) * 0.45, 0.92 + Math.sin(t * 0.47) * 0.08, 1.25]; headRz = -0.18; }
      carrying = k > 0.8 && k < D - 0.8;
    } else if (A === "cup") {
      IL = restOn(F, 1); /* v284: Beim Trinken ruht die freie Hand statt weiterzutippen. */
      const pl2 = mugPlan(F, -1, PI, F.cupKeys || (F.cupKeys = cupKeys(D)), k, P.cup);
      cupP = { base: pl2.base, tilt: pl2.tilt, g: grab(0.55, 0.85, D - 1.1, D - 0.85) };
      if (k < D - 0.9) { const r = HROT.cup(-1); IR = want(mugAnchor(pl2.base, PI, pl2.tilt), k < 0.55 ? "open" : "cup", -1, [r[0] - pl2.tilt, r[1], r[2]], "cup"); if (pl2.base[1] > 0.62) IR.el = [-0.17, 0.56, 0.17]; }
      sip = pl2.tilt; look = [0, 1, 1.4];
      carrying = k > 0.85 && k < D - 1.1;
    } else if (A === "look") {
      IL = restOn(F, 1); IR = restOn(F, -1);
      look = [Math.sin(F.bP) * 0.3, 0.98, 1.3];
    } else if (A === "gift" && F.gift) {
      /* v263: angebotene Tasse am Henkel übernehmen, trinken, auf dem eigenen Tisch abstellen */
      const g = F.gift, s = g.side, psi = s < 0 ? PI : 0, meet = toLoc(F, g.meet), spot = toLoc(F, g.spot);
      const keys = [[0, meet, 0], [1.2, meet, 0], [2.2, "mouth", 0.25], [2.85, "mouth", 0.75], [3.5, "mouth", 0.25], [4.1, "chest", 0], [5.3, spot, 0], [99, spot, 0]];
      const pl2 = mugPlan(F, s, psi, keys, k, spot);
      g.plan = { base: pl2.base, tilt: pl2.tilt, g: grab(0.9, 1.15, 5.3, 5.55), psi };
      const r = HROT.cup(s), I = want(mugAnchor(pl2.base, psi, pl2.tilt), k < 0.9 ? "open" : "cup", s, [r[0] - pl2.tilt, r[1], r[2]], "cup");
      if (pl2.base[1] > 0.62) I.el = [s * 0.17, 0.56, 0.17];
      if (k < 5.6) { if (s > 0) IL = I; else IR = I; }
      look = k < 1.3 ? meet : k < 4.1 ? [0, 1, 1.4] : spot;
      sip = pl2.tilt; lean = k > 4.1 && k < 5.6 ? 0.12 : 0.05; carrying = true;
    }
    /* v263: Schock (tote Kollegin, toter Kollege) und Schreck (klirrende Tasse): Blick dorthin, bei Schock Hände vor den Mund */
    const shock = F.shock && O.t >= F.shock.at ? F.shock : null;
    const fright = !shock && F.startle && now < F.startle.until ? F.startle : null;
    const seeW = shock ? (shock.F.dead ? deadHead(shock.F) : shock.pt) : fright ? fright.pt : null;
    if (shock) {
      if (O.t - shock.at < 3.4) { IL = want(nodePoint(F.head, [0.03, 0.08, 0.17]), "open", 1); IR = want(nodePoint(F.head, [-0.03, 0.08, 0.17]), "open", -1); }
      else { IL = restOn(F, 1); IR = restOn(F, -1); }
      /* v284: Der Notfall unterbricht auch Gegenstände und Blickautomatiken. */
      lean = 0; writing = false; talk = now < F.talkUntil;
      mouseOn = false; cupP = null; phoneP = null; carrying = false; sip = 0;
    }
    if (seeW) look = toLoc(F, seeW);
    let toPl = false;
    if (pl.d < 3.4 && pl.front && !carrying && !seeW) {
      if (t > F.nextPeek) { F.nextPeek = t + 10 + F.rnd() * 12; if (F.rnd() < 0.35) F.lookUntil = now + 1200 + F.rnd() * 900; }
      toPl = now < F.lookUntil || attend;
    } else if (attend && pl.front && !carrying && !seeW) toPl = true;
    if (attend && !carrying && !shock) { IL = kbAt(F, 1); IR = kbAt(F, -1); lean = 0.025; writing = false; mouseOn = false; }
    const kk = 1 - Math.exp(-dt * 2.8);
    F.br = 1 + (reduce ? 0 : Math.sin(t * F.bF * 0.7 + F.bP) * 0.003);
    F.lean += (lean - F.lean) * kk;
    const hp = torsoPt(F, 0, 0.53, 0.02);
    let wantYaw, wantPitch;
    if (toPl) {
      const dx = pl.l[0] - hp[0], dz = pl.l[2] - hp[2]; wantYaw = Math.atan2(dx, dz); wantPitch = Math.atan2(hp[1] - pl.l[1], Math.hypot(dx, dz));
    } else {
      if (t > F.gazeT) { F.gazeT = t + 2 + F.rnd() * 3; F.gaze = reduce ? [0, 0] : [(F.rnd() - 0.5) * 0.045, (F.rnd() - 0.5) * 0.025]; }
      const dx = look[0] - hp[0], dz = look[2] - hp[2];
      wantYaw = Math.atan2(dx, dz) + F.gaze[0]; wantPitch = Math.atan2(hp[1] - look[1], Math.hypot(dx, dz)) + F.gaze[1];
    }
    if (sip > 0.3 && !seeW) { wantYaw = 0; wantPitch = -0.06 - (sip - 0.3) * 0.3; }       /* beim Trinken Kopf leicht zurück */
    const wide = seeW ? 1.2 : yawWide;
    wantYaw = clamp1(wantYaw, -wide, wide); wantPitch = clamp1(wantPitch, -0.25, seeW ? 0.6 : 0.7);
    const kh = 1 - Math.exp(-dt * (fright ? 7 : 2.8));
    F.yaw = angTo(F.yaw, wantYaw, kh); F.pitch += (wantPitch - F.pitch) * kh;
    F.tw += (clamp1(F.yaw * (seeW ? 0.3 : 0.12) + twBias, seeW ? -0.22 : -0.1, seeW ? 0.22 : 0.1) - F.tw) * kk;
    F.hrz = (F.hrz || 0) + (headRz - (F.hrz || 0)) * kh;
    const T = F.torso; T.rx = F.lean; T.ry = F.tw; T.sy = F.br; T.sz = 1 + (F.br - 1) * 0.5;
    const np = torsoPt(F, 0, 0.4, 0);
    F.head.x = np[0]; F.head.y = np[1]; F.head.z = np[2];
    F.head.ry = F.yaw; F.head.rx = F.pitch; F.head.rz = F.hrz;
    if (now < (F.shakeUntil || 0) && !reduce) F.head.ry += Math.sin((F.shakeUntil - now) / 900 * PI * 4) * 0.2;   /* Kopfschütteln beim Ablehnen */

    /* Arme: Handdrehung glätten, Griff (Fingerstellung) wechseln, Handgelenk-Ziel mit begrenzter Geschwindigkeit anfahren */
    [[L, IL], [Rr, IR]].forEach(([a, I]) => {
      a.S = torsoPt(F, a.side * F.L.sh, 0.33, 0);
      a.pole = [a.side * 0.28, -1, 0.12]; a.el = I.el || null;
      const kr = 1 - Math.exp(-dt * 7);
      const wrist = deskWrist(a, I);
      a.r = a.r ? a.r.map((v, i) => angTo(v, wrist[i], kr)) : wrist.slice();
      if (a.g !== I.g) { a.g = I.g; a.hand.mesh = F.M("hand:" + a.side + ":" + F.L.skin + ":" + I.g, () => handMesh(F.L, a.side, I.g)); }
      const off = R3(a.r, offOf(a.side, I.o)), back = R3(a.r, [0, 0, -PALM]);
      const goal = I.c.map((v, i) => v - off[i] + back[i]);
      goal[0] = a.side * Math.max(0.045, a.side * goal[0]);
      if (goal[2] > DESK_LO[2] - 0.03) goal[1] = Math.max(DESK_HI[1] + 0.02, goal[1]);
      const desired = goal.map((v, i) => (v - a.T[i]) * 6), speed = Math.hypot(...desired), maxSpeed = 0.55;
      if (speed > maxSpeed) desired.forEach((v, i) => { desired[i] = v * maxSpeed / speed; });
      a.V = lerp3(a.V || [0, 0, 0], desired, 1 - Math.exp(-dt * 12));
      a.T = a.T.map((v, i) => v + a.V[i] * dt);
      solveArm(a, a.T, F, dt);
      const fw = R3(a.r, [0, 0, PALM]), o2 = R3(a.r, offOf(a.side, I.o));
      a.hand.x = a.H[0] + fw[0]; a.hand.y = a.H[1] + fw[1]; a.hand.z = a.H[2] + fw[2];
      a.hand.rx = a.r[0]; a.hand.ry = a.r[1]; a.hand.rz = a.r[2];
      a.C = [a.hand.x + o2[0], a.hand.y + o2[1], a.hand.z + o2[2]];
    });
    /* Gegenstände folgen der greifenden Hand */
    if (cupP) {
      const anc = lerp3(mugAnchor(cupP.base, PI, cupP.tilt), Rr.C, cupP.g);
      setNode(F.cup, mugFromAnchor(anc, PI, cupP.tilt), mugRot(PI, cupP.tilt));
    } else setNode(F.cup, P.cup, [0, PI, 0]);
    if (phoneP) setNode(F.phone, lerp3(phoneP.pos, L.C, phoneP.g), phoneP.rot);
    else setNode(F.phone, P.phone, [0, -0.1, 0]);
    if (mouseOn && Rr.g === "mouse") {
      F.mouse.ry=Rr.hand.ry;
      const a=R3([0,F.mouse.ry,0],MOUSE_ANCHOR);
      F.mouse.x=Rr.C[0]-a[0];F.mouse.z=Rr.C[2]-a[2];
    }
    F.pen.visible = writing; F.penRest.visible = !writing;
    const N = notePose(F); F.note.x = N.c[0]; F.note.z = N.c[2]; F.note.ry = N.ry + PI;
    F.held = phoneP && phoneP.g > 0.5 ? "phone" : cupP && cupP.g > 0.5 ? "cup" : null;
    if (A === "gift" && F.gift) giftCup(F, k);
    if (t > F.blinkAt) { F.blinkEnd = t + 0.12; F.blinkAt = t + 3 + F.rnd() * 4.5; }
    if (sip > 0.6 && F.sipBlink !== F.actT - (F.actT % 100)) { F.sipBlink = F.actT - (F.actT % 100); F.blinkEnd = t + 0.5; }   /* beim Schluck kurz die Augen zu */
    F.lids.visible = t < F.blinkEnd;
    F.mouth.sy = talk && !reduce ? 1 + 0.8 * Math.abs(Math.sin(t * 8 + F.bP)) : shock ? 1.5 : 1;
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

  /* Bildschirm je Rolle: einfache Logistika-Oberfläche mit echten Standortdaten (keine erfundenen Kennzahlen) */
  const fleetOf = b => b.vehicles.map(u => S.fleet.find(f => f.uid === u)).filter(Boolean);
  const busy = f => f.phase && f.phase !== "idle";
  const monthUnit = (role, n) => { const u = (typeof MOTM_UNIT !== "undefined" && MOTM_UNIT[role]) || ["Einsatz", "Einsätze"]; return n === 1 ? u[0] : u[1]; };
  const monthN = p => typeof staffMonthN === "function" ? Math.round(staffMonthN(p, gameMonth())) : 0;
  /* v298: Bildschirmfokus nur aus echten Aufträgen und Fahrzeugen dieses Standorts.
     Disposition/Zoll/Umschlag zeigen einen Standortvorgang, keine erfundene persönliche
     Auftragszuweisung. Beim Fahrpersonal hat die feste Fahrzeugbindung Vorrang. */
  function screenData(b, p) {
    const fl=fleetOf(b), ids=new Set((b.vehicles||[]));
    /* v313: „wait“ = Fahrzeug wartet in der Tür-zu-Tür-Kette auf Ware */
    const phase=f=>(f&&typeof haltLabel==='function'&&haltLabel(f))||({idle:"Bereit",reserved:"Eingeplant",wait:"Wartet auf Ware",repo:"Anfahrt",load:"Beladen",haul:"Unterwegs",unload:"Entladen",service:"Werkstatt"}[f&&f.phase]||"Bereit");
    const name=id=>typeof N!=="undefined"&&N[id]?(N[id].short||N[id].name):String(id||"–");
    const actor=O&&(O.staff||[]).find(f=>f.p&&f.p.id===p.id);
    const interrupted=actor&&(actor.shock||actor.dead||O.deaths), pause=actor&&["cup","gift"].includes(actor.act);
    const activity=interrupted?"Arbeit unterbrochen":pause?"Kaffeepause":({type:"Erfasst Daten",mouse:"Prüft Vorgang",read:"Liest Unterlagen",note:"Schreibt Notizen",phone:"Telefoniert",look:"Prüft Übersicht"}[actor&&actor.act]||"Arbeitsübersicht");
    const local=(S.jobs||[]).filter(j=>j.order&&((j.order.viaBase===b.id)||(j.legs||[]).some(l=>ids.has(l.veh))));
    const rank=Math.max(0,(b.staff||[]).filter(x=>x.role===p.role).findIndex(x=>x.id===p.id));
    const mine=fl.find(f=>f.driver===p.id);
    let jobs=local, job=null;
    if(p.role==='fahr') jobs=mine?local.filter(j=>(j.legs||[]).some(l=>l.veh===mine.uid&&!l.done)):local;
    if(p.role==='ums'){
      jobs=local.filter(j=>(j.legs||[]).some(l=>!l.done&&((l.from===b.node)||(l.to===b.node))));
      const loading=jobs.filter(j=>(j.legs||[]).some((l,i)=>!l.done&&i===(j.curLeg||0)&&fl.some(f=>f.uid===l.veh&&f.jobId===j.id&&((f.phase==='load'&&l.from===b.node)||(f.phase==='unload'&&l.to===b.node)))));
      if(loading.length)jobs=loading;
    }
    if(jobs.length)job=(p.role==='fahr'&&mine&&jobs.find(j=>j.id===mine.jobId))||jobs[rank%jobs.length];
    const title=({disp:"Disposition",fahr:"Fahrplan",ums:"Umschlag",zoll:"Zoll & Papiere"}[p.role]||"Arbeitsplatz");
    const view=p.role==='fahr'&&!mine?'Fahrerpool':({disp:"Tourenkoordination",fahr:"Tourenplan",ums:"Ladeübersicht",zoll:"Frachtpapiere"}[p.role]||"Vorgangsübersicht");
    let work=null;
    if(job){
      const legs=job.legs||[], leg=(mine&&legs.find(l=>l.veh===mine.uid&&!l.done))||legs[job.curLeg||0]||legs.find(l=>!l.done)||legs[0];
      const f=leg&&S.fleet.find(f=>f.uid===leg.veh),o=job.order,cargo=typeof CARGO!=="undefined"&&CARGO[o.cargo],kg=Number(o.weight);
      const weight=Number.isFinite(kg)&&kg>0?(kg>=1000?(kg/1000).toLocaleString('de-DE',{maximumFractionDigits:1})+' t':kg.toLocaleString('de-DE',{maximumFractionDigits:1})+' kg'):'';
      const v=f&&vType(f.type);
      work={id:o.id||job.id,jobId:job.id,from:name(o.from),to:name(o.to),cargo:cargo?cargo.name:String(o.cargo||"Fracht"),weight,
        vehicle:v?v.name:"Transportkette",status:f&&f.jobId===job.id&&legs.indexOf(leg)===(job.curLeg||0)?phase(f):"Eingeplant",leg:leg?legs.indexOf(leg)+1:0,total:legs.length};
    }
    return {title,view,person:p.name||"Team",activity,paused:!!(pause||interrupted),work,
      R:(mine?[mine]:fl).slice(0,3).map(f=>{const v=vType(f.type);return [v?v.name:"Fahrzeug",phase(f),busy(f)];}),
      lines:[fl.filter(busy).length+" aktive Fahrzeuge · "+fl.length+" am Standort","Mein Monat: "+monthN(p)+" "+monthUnit(p.role,monthN(p))],
      site:name(b.node),day:dayOf(S.time)};
  }
  /* v284: Pixelbreite statt Zeichenanzahl; lange Statuszeilen umbrechen. */
  function fitScreenText(g, text, width) {
    let out = String(text);
    if (g.measureText(out).width <= width) return out;
    while (out.length && g.measureText(out + "…").width > width) out = out.slice(0, -1);
    return out + "…";
  }
  function screenLines(g, text, width) {
    const out = []; let line = "";
    String(text).split(/\s+/).forEach(word => {
      const next = line ? line + " " + word : word;
      if (line && g.measureText(next).width > width) { out.push(line); line = word; } else line = next;
    });
    if (line) out.push(line);
    return out.map(l => fitScreenText(g, l, width));
  }
  function screenCanvas(c, b, p, data) {
    const g=c.getContext("2d"),D=data||screenData(b,p),W=384,H=240;
    g.save();g.scale(c.width/W,c.height/H);g.textBaseline="middle";g.textAlign="left";
    g.fillStyle="#e8eef5";g.fillRect(0,0,W,H);
    g.fillStyle="#2f6fed";g.fillRect(0,0,W,30);
    g.fillStyle="#ffffff";g.font="700 17px system-ui, sans-serif";g.fillText(fitScreenText(g,D.title,W-90),10,15);
    g.font="600 12px system-ui, sans-serif";g.textAlign="right";g.fillText("Tag "+D.day,W-10,15);g.textAlign="left";
    g.fillStyle="#25384c";g.font="700 12px system-ui, sans-serif";g.fillText(fitScreenText(g,D.person,212),10,45);
    g.fillStyle=D.paused?"#657485":"#286e57";g.font="600 11px system-ui, sans-serif";g.textAlign="right";g.fillText(D.activity,W-10,45);g.textAlign="left";
    g.fillStyle="#ffffff";g.fillRect(8,59,W-16,139);
    g.fillStyle="#34495e";g.font="700 14px system-ui, sans-serif";g.fillText(D.view,18,76);
    if(D.work){
      const d=D.work;
      g.fillStyle="#526b82";g.font="600 11px system-ui, sans-serif";g.textAlign="right";g.fillText(fitScreenText(g,String(d.id),130),W-18,76);g.textAlign="left";
      g.fillStyle="#1f3449";g.font="600 13px system-ui, sans-serif";
      ["Von: "+d.from,"Nach: "+d.to,d.cargo+(d.weight?" · "+d.weight:"")].forEach((t,i)=>g.fillText(fitScreenText(g,t,W-36),18,101+i*21));
      g.fillStyle="#607184";g.font="600 11px system-ui, sans-serif";g.fillText(fitScreenText(g,d.vehicle,W-36),18,163);
      g.fillStyle="#e4edf8";g.fillRect(16,177,W-32,16);
      g.fillStyle="#244b77";g.font="700 11px system-ui, sans-serif";g.fillText(fitScreenText(g,d.status,W-164),21,185);
      g.textAlign="right";g.fillText("Abschnitt "+d.leg+" / "+d.total,W-22,185);g.textAlign="left";
    }else{
      g.fillStyle="#526779";g.font="600 12px system-ui, sans-serif";
      g.fillText("Keine laufenden Standortvorgänge",18,101);
      if(!D.R.length)g.fillText("Noch keine Fahrzeuge zugeordnet",18,130);
      D.R.slice(0,3).forEach(([n,status,on],i)=>{
        const y=126+i*24;g.fillStyle="#f1f5f9";g.fillRect(16,y-9,W-32,20);
        const label=fitScreenText(g,status,142),space=g.measureText(label).width;
        g.fillStyle="#263e55";g.fillText(fitScreenText(g,n,W-52-space),21,y);
        g.textAlign="right";g.fillStyle=on?"#2f6fed":"#286e57";g.fillText(label,W-22,y);g.textAlign="left";
      });
    }
    g.fillStyle="#526779";g.font="600 10px system-ui, sans-serif";
    g.fillText(fitScreenText(g,D.lines[0],W-20),10,211);
    g.fillText(fitScreenText(g,D.site+" · "+D.lines[1],W-20),10,228);
    g.restore();return JSON.stringify(D);
  }
  /* v298: Aktuelle Tätigkeit und Auftragsstatus zeitnah zeigen. Höchstens eine
     Textur pro Bild aktualisieren, nur bei inhaltlicher Änderung. */
  function updateScreens(now) {
    let budget=1;
    (O.screens||[]).forEach(s=>{
      if(now<s.next||!budget)return;
      s.next=now+900;
      const data=screenData(O.b,s.p),sig=JSON.stringify(data);
      if(sig!==s.sig){s.sig=screenCanvas(s.c,O.b,s.p,data);O.R.texUpdate(s.t);budget--;}
    });
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
      <div class="ofp-aim" aria-hidden="true"></div>
      <div class="ofp-actions"><small id="ofpCarry" role="status"></small><button id="ofpAction" hidden></button><button id="ofpThrow" hidden>Tasse werfen</button></div>
      <div class="ofp-joy" id="ofpJoy"><i></i></div>
      <div class="ofp-say" id="ofpSay"></div>
      <div class="ofp-hint" id="ofpHint">Links gehen · wischen zum Umsehen · Personal antippen · Treppe betreten oder antippen</div>
      <div class="ofp-card" id="ofpCard" role="dialog" aria-modal="false" aria-label="Mitarbeiter des Monats"></div>
      <div id="officeBoot"></div>`;
    document.body.appendChild(el);
    document.body.classList.add("office3d");
    const tok = ++SEQ;
    O = { el, b, tok, floor: Math.max(0, Math.min(tierFloors(tierOf(b)) - 1, floor || 0)), alive: true, meshes: [], texs: [], mcache: new Map(), kitchenStates: new Map(), spills: new Map(), fx: [], later: [] };
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

  /* v315: Ruckelbremse. Kommt das Gerät nicht auf ~30 Bilder/s (viele Mitarbeiter, kleines Handy, Stromsparmodus),
     sinkt die Auflösung stufenweise (Schatten und Figuren bleiben gleich). Nur abwärts, damit nichts hin und her springt;
     Messung ohne die ersten Sekunden (Shader, Texturen) und ohne Pausen im Hintergrund. */
  const QUALITY = [1, 0.8, 0.65, 0.5];
  function governQuality(R, raw, now) {
    const g = O.gov || (O.gov = { ema: 16, level: 0, since: now, last: now });
    if (raw > 1500 || document.hidden) { g.since = now; return; }          /* Pause, Tabwechsel, Ladehänger */
    g.ema += (raw - g.ema) * 0.08;
    if (now - g.since < 2500 || now - g.last < 1500 || g.level >= QUALITY.length - 1) return;
    if (g.ema > 30) { g.level++; g.last = now; g.ema = 16; R.scale = QUALITY[g.level]; }
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
      const raw = now - O.last;
      const dt = Math.max(0, Math.min(0.05, raw / 1000)); O.last = now; O.t += dt;
      governQuality(R, raw, now);
      step(dt, now);
      if (!O || !O.alive || O.R !== R) return;
      R.stepParticles(dt);
      try { R.render(O.t); } catch (e) { /* Kontextverlust */ }
      updateAction();
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
    /* v263: laufende Übergaben abschließen, fliegende Tasse zerbricht, Kaffee und Scherben bleiben für diese Etage gemerkt */
    (O.staff || []).forEach(F => { if (F.gift) giftDone(F); });
    if (O.fly && O.kitRuntime) { O.kitRuntime.shatter(O.fly.it); O.fly = null; }
    if (O.kitFloor != null) O.spills.set(O.kitFloor, (O.fx || []).filter(f => f.d.persist && f.fade == null && S.time < f.d.until).map(f => {
      const d = Object.assign({}, f.d, { grow: false, v: null });
      if (d.type === "shard") { d.pos = d.pos.slice(); d.pos[1] = surfBelow(d.pos[0], d.pos[2], d.pos[1]).y + 0.002; d.rot = [0, d.rot[1], 0]; }
      return d;
    }));
    O.fx = []; O.later = [];
    if (O.kitRuntime) {
      const state = O.kitRuntime.snapshot();
      /* v259: Etagenwechsel stellt Getragenes zurück; Team-Neuaufbau erhält die Hand. */
      if (O.kitFloor !== O.floor) state.items.forEach(i => { if (i.location === "held") i.location = "home"; });
      O.kitchenStates.set(O.kitFloor, state); O.kitRuntime.dispose(); O.kitRuntime = null;
    }
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
    /* Bildschirme (384 × 240, nur bei geänderten Daten neu) */
    O.screens = room.screens.map((s, n) => {
      const c = document.createElement("canvas"); c.width = 384; c.height = 240;
      const sig = screenCanvas(c, b, s.p), t = TX(c);
      R.nodes.push(R.node(null, { x: s.x, y: s.y, z: s.z, decal: { t, w: 0.6, h: 0.36 } }));
      return Object.assign(s, { c, t, sig, next: performance.now() + 600 + n * 23 });
    });
    /* v301: Standorttafel und Personalposter; kein Firmenschriftzug an der Küchenwand. */
    R.nodes.push(R.node(null, { x: -2.6, y: 1.55, z: RD - 0.012, ry: PI, decal: { t: TX(boardCanvas(b)), w: 2.4, h: 1.5 } }));
    const pc = posterCanvas(b, null), pt = TX(pc), P = room.poster;
    R.nodes.push(R.node(null, { x: P.x, y: P.y, z: RD - 0.037, ry: PI, decal: { t: pt, w: P.w, h: P.h } }));
    O.poster = Object.assign({}, P, { c: pc, t: pt, k: posterKey(b) });
    posterPortrait(b, pt, pc);
    O.ob = room.ob; O.occ = room.occ; O.H = room.H; O.kitchen = room.kitchen;O.stairwell=room.stairwell;
    O.surf = room.surf; O.phys = room.phys; O.carpet = room.carpet;               /* v263 */
    O.kitFloor = O.floor;
    O.kitRuntime = room.kitchen ? OFFICE_KITCHEN.mount(room.kitchen, R, M1, O.kitchenStates.get(O.floor), hint, O.reduced) : null;
    /* v263: Markierung zum Abstellen, Kaffee und Scherben dieser Etage (noch keine 5 Spielminuten alt) */
    O.ghost = R.node(M1(ringMesh()), { visible: false, shadow: false, glow: 0.9 }); R.nodes.push(O.ghost);
    const back = O.spills.get(O.floor) || []; O.spills.delete(O.floor);
    back.forEach(d => { if (S.time < d.until) fxAdd(d); });
    O.sig = staffSig(b, O.floor); O.pollAt = performance.now() + 3000;          /* echte Zeit, unabhängig von der Bildrate */
    if (!keepPos) {
      /* Startpunkt: in der Tür (EG) bzw. oben an der Treppe */
      const sp = O.floor > 0 && room.stairs ? room.stairs : room.door;
      O.pos = safeLanding(sp,sp===room.stairs?room.stairwell.gate:null); O.pitch = 0.06;
      O.yaw = Math.atan2(-(0.6 - sp[1]), -(-0.6 - sp[0]));          /* Blick zur Raummitte: Blickrichtung = (−cos yaw, −sin yaw) */
    } else collide(O.pos);
    const fl = O.el.querySelector(".ofp-fl"), multi = tierFloors(tierOf(b)) > 1;
    if (fl) fl.textContent = multi ? " · " + floorName(O.floor) : "";
    const fb = O.el.querySelector(".ofp-floors");
    if (fb) {
      fb.innerHTML = multi ? Array.from({ length: tierFloors(tierOf(b)) }, (_, f) => `<button class="${f === O.floor ? "on" : ""}" data-ofl="${f}">${f === 0 ? "EG" : f + ". OG"}</button>`).join("") : "";
      fb.querySelectorAll("[data-ofl]").forEach(x => x.onclick = () => changeFloor(+x.dataset.ofl,false));
    }
    if (!first) { const s = O.el.querySelector("#ofpSay"); if (s) s.classList.remove("on"); O.sayAt = null; closeCard(); }
  }

  /* v301: Gemeinsamer Etagenwechsel für Treppen und die vorhandenen Etagenknöpfe.
     Kein gespeicherter Zustand; die bestehenden Aufräum-/Aufbauwege bleiben zuständig. */
  function stopOfficeInput(){
    if(!O)return;
    if(O.in){O.in.jx=O.in.jy=0;O.in.k={};O.in.look=null;O.in.joyId=null;}
    const knob=O.el.querySelector('.ofp-joy i');if(knob)knob.style.transform='';
  }
  function safeLanding(anchor,gate){
    const ob=O.ob.concat(O.kitRuntime?O.kitRuntime.colliders():[]),r=PR+.025;
    const free=p=>(gate==null||p[0]<=gate-.10)&&Math.abs(p[0])<=RW-r&&Math.abs(p[1])<=RD-r&&!ob.some(([x0,z0,x1,z1])=>p[0]>x0-r&&p[0]<x1+r&&p[1]>z0-r&&p[1]<z1+r);
    if(free(anchor))return anchor.slice();
    let best=null,dist=Infinity;
    for(let x=-RW+r;x<=RW-r;x+=.25)for(let z=-RD+r;z<=RD-r;z+=.25){
      const p=[x,z],d=Math.hypot(x-anchor[0],z-anchor[1]);if(d<dist&&free(p)){best=p;dist=d;}
    }
    return best||anchor.slice();
  }
  function nearStairs(){return !!(O&&O.stairwell&&Math.hypot(O.pos[0]-O.stairwell.entry[0],O.pos[1]-O.stairwell.entry[1])<=2.4);}
  function changeFloor(f,viaStairs){
    if(!O||!Number.isInteger(f)||f<0||f>=tierFloors(tierOf(O.b))||f===O.floor)return false;
    if(viaStairs&&(!nearStairs()||Math.abs(f-O.floor)!==1))return false;
    stopOfficeInput();closeCard();O.floor=f;buildFloor(false);
    if(viaStairs&&O.stairwell){
      O.pos=safeLanding(O.stairwell.entry,O.stairwell.gate);O.pitch=.06;
      O.yaw=Math.atan2(-(.6-O.pos[1]),-(-.6-O.pos[0]));
    }
    syncOfficeCamera(0);return true;
  }
  function useStairs(){
    if(!nearStairs()||O.cardOpen)return false;
    const dest=O.stairwell.dest,from=O.floor;
    if(dest.length===1)return changeFloor(dest[0].floor,true);
    if(!dest.length)return false;
    stopOfficeInput();O.cardOpen=true;O.stairChoice=true;
    const el=O.el.querySelector('#ofpCard');el.setAttribute('aria-label','Treppenhaus');el.classList.add('ofp-card-stairs','on');
    el.innerHTML=`<div class="ofp-card-txt"><small>Treppenhaus · ${esc(floorName(from))}</small><b>Wohin möchtest du gehen?</b><div class="ofp-stair-options">${dest.map(d=>`<button data-stair-floor="${d.floor}">${esc(d.label)}</button>`).join('')}</div></div><button class="ofp-card-x" aria-label="Schließen">✕</button>`;
    el.querySelector('.ofp-card-x').onclick=closeCard;
    el.querySelectorAll('[data-stair-floor]').forEach(button=>button.onclick=()=>{if(O&&O.floor===from)changeFloor(+button.dataset.stairFloor,true);});
    const first=el.querySelector('[data-stair-floor]');if(first)first.focus({preventScroll:true});return true;
  }
  function walkedIntoStairs(before){
    const t=O.stairwell;if(!t||O.cardOpen)return false;
    return before[0]<t.gate&&O.pos[0]>=t.gate&&O.pos[1]>t.lo[2]+PR&&O.pos[1]<t.hi[2]-PR&&useStairs();
  }

  /* ------------------------------ Bewegung ----------------------------- */
  function collide(p) {
    const r = PR;
    p[0] = Math.max(-RW + r, Math.min(RW - r, p[0]));
    p[1] = Math.max(-RD + r, Math.min(RD - r, p[1]));
    for (const [x0, z0, x1, z1] of O.ob.concat(O.kitRuntime ? O.kitRuntime.colliders() : [])) {
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
    if(O.stairChoice)f=s=0;
    if (I.k.l) O.yaw -= 1.8 * dt; if (I.k.r) O.yaw += 1.8 * dt;
    const l = Math.hypot(f, s);
    if (l > 1) { f /= l; s /= l; }
    const cy = Math.cos(O.yaw), sy = Math.sin(O.yaw);
    const F = [-cy, -sy], Rt = [sy, -cy];
    if (l > 0.05) {
      const before=O.pos.slice();
      O.pos[0] += (F[0] * f + Rt[0] * s) * SPEED * dt;
      O.pos[1] += (F[1] * f + Rt[1] * s) * SPEED * dt;
      collide(O.pos);
      if(walkedIntoStairs(before))return;
      O.bob = (O.bob || 0) + dt * 9 * Math.min(1, l);
    }
    syncOfficeCamera(l);
    if (O.kitRuntime) { O.kitRuntime.tick(dt, { eye: O.eye, yaw: O.yaw }); collide(O.pos); }
    stepCoffee(dt);                                                              /* v263: Wurf, Spuren, verzögerte Reaktionen */
    if (!O) return;                                                              /* v264: Festnahme hat das Büro geschlossen */
    /* Personal: Gliederpuppe statt Hüpfen (vorher hob sich die ganze Figur 7-mal pro Sekunde und pendelte um die Hochachse) */
    (O.staff || []).forEach(st => {
      const dx = O.pos[0] - st.x, dz = O.pos[1] - st.z;
      const pl = { d: Math.hypot(dx, dz), front: -dz / FS > -0.3, l: [-dx / FS, EYE / FS, -dz / FS] };
      if (st.dead) animDead(st, dt); else animFigure(st, dt, now, pl);
    });
    /* Sprechblase folgt dem Kopf */
    if (O.sayAt) {
      const p = O.R.project(O.sayAt.x, 1.62, O.sayAt.z), el = O.el.querySelector("#ofpSay");
      if (el && p && p[2] < 1) {
        const pos = bubblePosition(p[0], p[1], O.el.clientWidth, O.el.clientHeight, el.offsetWidth, el.offsetHeight);
        if (pos) { el.style.left = pos[0] + "px"; el.style.top = pos[1] + "px"; el.style.visibility = "visible"; }
        else el.style.visibility = "hidden";
      } else if (el) el.style.visibility = "hidden";
      if (now > O.sayUntil) { O.sayAt = null; if (el) el.classList.remove("on"); }
    }
    updateScreens(now);
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
  function syncOfficeCamera(l){
    /* v301: Auch unmittelbar nach dem Etagenwechsel stimmen Blickziel und Auge. */
    const bob=O.reduced?0:Math.sin(O.bob||0)*.01*Math.min(1,l),c=O.R.cam,cp=Math.cos(O.pitch),sp=Math.sin(O.pitch);
    c.yaw=O.yaw;c.pitch=O.pitch;const ex=O.pos[0],ey=(O.dbgEye||EYE)+bob,ez=O.pos[1];
    c.tx=ex-Math.cos(O.yaw)*cp*c.dist;c.ty=ey-sp*c.dist;c.tz=ez-Math.sin(O.yaw)*cp*c.dist;O.eye=[ex,ey,ez];
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
    /* v259: UI-Tipps erreichen nie Canvas/Joystick. Aktion beim Auslösen erneut prüfen. */
    const action = el.querySelector("#ofpAction");
    action.addEventListener("pointerdown", e => e.stopPropagation());
    action.onclick = e => { e.stopPropagation(); const hit = actionTarget(); if (hit && !hit.disabled) performAction(hit); };
    const thr = el.querySelector("#ofpThrow");                                     /* v263 */
    thr.addEventListener("pointerdown", e => e.stopPropagation());
    thr.onclick = e => { e.stopPropagation(); throwCup(); };
    /* Tastatur */
    const MAP = { KeyW: "w", ArrowUp: "w", KeyS: "s", ArrowDown: "s", KeyA: "a", KeyD: "d", ArrowLeft: "l", ArrowRight: "r", KeyQ: "l", KeyE: "r" };
    O.key = e => {
      if (e.code === "Escape" && e.type === "keydown") { if (O.cardOpen) closeCard(); else leave(); return; }
      if(e.code==='KeyF'&&e.type==='keydown'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){if(!e.repeat){const hit=actionTarget();if(hit&&!hit.disabled)performAction(hit);}e.preventDefault();return;}
      const k = MAP[e.code]; if (!k) return;
      I.k[k] = e.type === "keydown"; e.preventDefault();
    };
    window.addEventListener("keydown", O.key); window.addEventListener("keyup", O.key);
    O.blur = () => { I.k = {}; I.jx = I.jy = 0; I.joyId = null; I.look = null; knob.style.transform = ""; };
    window.addEventListener("blur", O.blur);
  }

  /* Sichtprüfung: verdeckt ein Möbelstück die Strecke Auge → Ziel? */
  function eyePt() { return O.eye || [O.pos[0], EYE, O.pos[1]]; }
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
  /* v259: kontextabhängige Interaktion über Blickrichtung, mit Reichweite und Sichtprüfung. */
  function actionTarget(ray) {
    if (!O || !O.R || O.cardOpen) return null;
    const R = O.R, eye = eyePt();
    ray = ray || R.ray(R.w / 2, R.h / 2);
    let best = O.kitRuntime ? O.kitRuntime.target(ray, eye, blocked) : null;
    const z = PZ(96) + 0.18;
    const t = R.hitBox(ray, [RW - 0.11, 0.9, z - 0.14], [RW + 0.035, 1.16, z + 0.14]);
    if (t != null && (!best || t < best.t)) {
      const p = ray.o.map((v, i) => v + ray.d[i] * t);
      if (Math.hypot(...p.map((v, i) => v - eye[i])) < 2.4 && !blocked(eye, p)) best = { id: "leave", label: "Zurückkehren", t };
    }
    const stair=stairTarget(ray,eye);if(stair&&(!best||stair.t<best.t))best=stair;
    /* v263: Wer im Blick sitzt oder liegt, verdeckt, was dahinter ist; mit Kaffee in der Hand: anbieten. Sonst: abstellen. */
    const who = staffHit(ray);
    if (who && (!best || who.t < best.t)) return offerTarget(who, eye);
    const drop = dropSpot(ray, eye);
    if (drop && (!best || drop.t < best.t)) best = drop;
    return best;
  }
  function stairTarget(ray,eye){
    if(!nearStairs())return null;const s=O.stairwell,t=O.R.hitBox(ray,s.lo,s.hi);if(t==null)return null;
    const p=ray.o.map((v,i)=>v+ray.d[i]*t);
    if(Math.hypot(...p.map((v,i)=>v-eye[i]))>2.6||blocked(eye,p,(lo,hi)=>lo[0]===s.lo[0]+1.2&&hi[0]===s.hi[0]&&lo[2]===s.lo[2]))return null;
    return {id:'stairs',label:s.dest.length===1?s.dest[0].label:'Treppe benutzen',t};
  }
  function performAction(hit) {
    if(hit.id==='stairs')return useStairs();
    if (hit.id === "leave") return leave();
    if (hit.id === "drop") { if (O.kitRuntime) O.kitRuntime.dropAt(hit.pos, hit.ry); return; }
    if (hit.id === "offer") return offerTo(hit.F);
    if (O.kitRuntime) O.kitRuntime.perform(hit.id);
  }
  function updateAction() {
    if (!O) return;
    const hit = actionTarget(), button = O.el.querySelector("#ofpAction"), aim = O.el.querySelector(".ofp-aim");
    button.hidden = !hit; button.disabled = !!(hit && hit.disabled);
    if (hit && button.textContent !== hit.label) button.textContent = hit.label;
    aim.classList.toggle("active", !!hit);
    if (O.kitRuntime) O.kitRuntime.focus(hit && hit.id);
    const carry = O.el.querySelector("#ofpCarry"), K = O.kitRuntime;
    carry.textContent = K && K.held ? "In der Hand: " + (K.held.kind === "cup" ? K.held.fill > 0 ? "Kaffee" : "Leere Tasse" : K.held.name) : "";
    /* v263: Werfen nur mit einer Tasse in der Hand; Ring zeigt, wo abgestellt wird */
    O.el.querySelector("#ofpThrow").hidden = !(K && K.held && K.held.kind === "cup" && !K.busy() && !O.fly && !O.cardOpen);
    if (O.ghost) {
      const g = !!(hit && hit.id === "drop"); O.ghost.visible = g;
      if (g) { O.ghost.x = hit.pos[0]; O.ghost.y = hit.pos[1] + 0.003; O.ghost.z = hit.pos[2]; }
    }
  }
  function tapAt(x, y) {
    if (O.cardOpen) { closeCard(); return; }
    const rc = O.el.querySelector("#ofpCv").getBoundingClientRect(), px = x - rc.left, py = y - rc.top;
    const ray = O.R.ray(px, py), eye = eyePt();
    const action = actionTarget(ray);
    if (action) {
      if (!action.disabled) performAction(action);
      else if (action.id === "offer") hint("Geh näher an " + action.F.p.name.split(" ")[0] + " heran, um den Kaffee zu übergeben.");
      return;
    }
    let best = null;
    /* 1. Strahl trifft eine Figur (Kasten um Oberkörper und Kopf; v263: liegend um den Körper) */
    (O.staff || []).forEach(st => {
      const [lo, hi] = figBox(st), t = O.R.hitBox(ray, lo, hi);
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
    if (s.dead) return hint(s.p.name + " ist tot.");
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
  const SHOCK_SAY = ["Ich … ich kann jetzt nicht reden.", "Der Notarzt ist unterwegs.", "Warum hast du das getan?", "Ich zittere immer noch."];
  function say(s) {
    if (O.deaths) return speak(s, SHOCK_SAY[s.talkN++ % SHOCK_SAY.length]);           /* v263: nach einem Todesfall */
    const p = s.p, A = ACT_SAY[s.act] || ACT_SAY.look, al = A[p.role] || A.disp;
    const list = [al[s.talkN % al.length]].concat(factLines(s));
    let i = s.talkN % list.length; if (list[i] === s.lastSay) i = (i + 1) % list.length;
    const line = list[i]; s.lastSay = line; s.talkN++;
    speak(s, line);
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
  function closeCard() { if (!O) return; const el = O.el.querySelector("#ofpCard"); if (el) {el.classList.remove("on","ofp-card-stairs");el.setAttribute('aria-label','Mitarbeiter des Monats');} O.cardOpen = false;O.stairChoice=false; }

  /* ------------------ v263: Kaffee abstellen, anbieten, werfen ------------------ */
  /* Abstellen auf jeder freien Fläche (Tische, Arbeitsplatte, Küchentisch, Fensterbank, Empfang, Boden).
     Anbieten: Die Person entscheidet nachvollziehbar (telefoniert, hat gerade den eigenen Kaffee in der Hand,
     hat eben erst einen bekommen, trinkt keinen Kaffee, spät am Abend, kein Platz auf dem Tisch); sonst nimmt sie
     die Tasse, trinkt und stellt sie auf ihren Tisch. Keine Wirkung auf Stimmung oder Geld.
     Werfen: Flugbahn mit Schwerkraft gegen Wände, Decke, Boden, Möbel, offene Küchentüren, Stuhllehnen und Personen;
     die Tasse zerspringt beim ersten Aufprall. Kaffee und Scherben bleiben 5 Spielminuten (S.time) dort, wo sie
     landen: waagerechte Fläche → an der Stelle; Wand, Möbelfront, Decke, Person → Fleck dort, Lache auf der höchsten
     Fläche darunter. Kopf- oder Rumpftreffer: Die Person stirbt sofort (Wunsch v263) – sichtbare Verletzung,
     Sturz vom Stuhl bzw. Zusammensacken, Blutlache, Schock im Team, Folgen im Spielstand wie beim Ausscheiden. */
  const GRAV = 9.81, CUP_R = 0.045, CUP_C = 0.054, THROW_V = 8.5, OFFER_RANGE = 1.35, SPILL_MIN = 5;
  const COFFEE = 0x4a2812, COFFEE_HI = 0x6b3d1d, COFFEE_CARPET = 0x3a2412, BLOOD = 0x5e0b0d, BLOOD_HI = 0x7d1214;
  const GIFTS = new Map();                                   /* Personal-ID → Spielzeit der letzten angenommenen Tasse (nur Sitzung) */
  const toLoc = (F, w) => [-(w[0] - F.x) / FS, w[1] / FS, -(w[2] - F.z) / FS];
  const toWorld = (F, l) => [F.x - l[0] * FS, l[1] * FS, F.z - l[2] * FS];     /* Wurzel noch ungedreht (lebende Figur) */
  function rootWorld(F, l) {
    const r = F.root, M = G3.trs(new Float32Array(16), r.x, r.y, r.z, r.rx, r.ry, r.rz, r.sx, r.sy, r.sz);
    return [0, 1, 2].map(i => M[i] * l[0] + M[i + 4] * l[1] + M[i + 8] * l[2] + M[i + 12]);
  }
  const deadHead = F => rootWorld(F, nodePoint(F.head, HC));
  /* Punkt aus Eltern- in Knotenkoordinaten (Umkehrung von T · Ry · Rx · Rz · S) */
  function invNode(n, p) {
    let v = [p[0] - n.x, p[1] - n.y, p[2] - n.z];
    const cy = Math.cos(n.ry), sy = Math.sin(n.ry); v = [cy * v[0] - sy * v[2], v[1], sy * v[0] + cy * v[2]];
    const cx = Math.cos(n.rx), sx = Math.sin(n.rx); v = [v[0], cx * v[1] + sx * v[2], -sx * v[1] + cx * v[2]];
    const cz = Math.cos(n.rz), sz = Math.sin(n.rz); v = [cz * v[0] + sz * v[1], -sz * v[0] + cz * v[1], v[2]];
    return [v[0] / n.sx, v[1] / n.sy, v[2] / n.sz];
  }
  function later(ms, fn) { (O.later || (O.later = [])).push({ at: performance.now() + ms, fn }); }

  /* Strecke a → a + d gegen Kasten (mit Flächennormale) und Kugel; t in [0, 1], Start im Inneren zählt nicht */
  function segBox(a, d, lo, hi) {
    let t0 = 0, t1 = 1, ax = -1, sg = 0;
    for (let k = 0; k < 3; k++) {
      if (Math.abs(d[k]) < 1e-9) { if (a[k] < lo[k] || a[k] > hi[k]) return null; continue; }
      let u = (lo[k] - a[k]) / d[k], w = (hi[k] - a[k]) / d[k], s = -1;
      if (u > w) { const q = u; u = w; w = q; s = 1; }
      if (u > t0) { t0 = u; ax = k; sg = s; }
      if (w < t1) t1 = w;
      if (t0 > t1) return null;
    }
    if (ax < 0) return null;
    const n = [0, 0, 0]; n[ax] = sg; return { t: t0, n };
  }
  function segSphere(a, d, c, r) {
    const m = [a[0] - c[0], a[1] - c[1], a[2] - c[2]], A = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
    const B = 2 * (m[0] * d[0] + m[1] * d[1] + m[2] * d[2]), C = m[0] * m[0] + m[1] * m[1] + m[2] * m[2] - r * r;
    if (C < 0 || A < 1e-12) return null;
    const D = B * B - 4 * A * C; if (D < 0) return null;
    const t = (-B - Math.sqrt(D)) / (2 * A); if (t < 0 || t > 1) return null;
    return { t, n: [0, 1, 2].map(i => (m[i] + d[i] * t) / r) };
  }
  /* Kasten um den Oberkörper (mit Oberarmen) in Weltkoordinaten */
  function torsoBox(F) {
    const L = F.L, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    [-1, 1].forEach(sx => [0.02, 0.36].forEach(y => [-1, 1].forEach(sz => {
      const w = toWorld(F, torsoPt(F, sx * (L.tw / 2 + 0.04), y, sz > 0 ? L.td / 2 + 0.03 : -L.td / 2));
      for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], w[i]); hi[i] = Math.max(hi[i], w[i]); }
    })));
    return [lo, hi];
  }
  /* Kasten zum Antippen und als Hindernis: sitzend bzw. liegend */
  function figBox(F) {
    const D = F.dead;
    if (D && D.kind === "fall") {
      const a = F.x + D.dn * 0.15, b = F.x + D.dn * 1.5;
      return [[Math.min(a, b), 0, F.z - 0.55], [Math.max(a, b), 0.45, F.z + 0.2]];
    }
    return [[F.x - 0.3, 0.45, F.z - 0.42], [F.x + 0.3, 1.62, F.z + 0.22]];
  }
  const deadRects = () => (O.staff || []).filter(F => F.dead && F.dead.kind === "fall").map(F => { const [lo, hi] = figBox(F); return [lo[0], lo[2], hi[0], hi[2]]; });
  function staffHit(ray) {
    let best = null;
    (O.staff || []).forEach(F => { const [lo, hi] = figBox(F), t = O.R.hitBox(ray, lo, hi); if (t != null && (!best || t < best.t)) best = { F, t }; });
    return best;
  }

  /* Erster Aufprall einer Kugel (Radius r) auf der Strecke a → a + d */
  function sweep(a, d, r) {
    let best = null;
    const take = (h, kind, extra) => { if (h && h.t >= 0 && h.t <= 1 && (!best || h.t < best.t)) best = Object.assign({ t: h.t, n: h.n, kind }, extra || {}); };
    [[0, -RW + r, 1], [0, RW - r, -1], [2, -RD + r, 1], [2, RD - r, -1], [1, r, 1], [1, O.H - r, -1]].forEach(([ax, v, sg]) => {
      if (d[ax] * sg >= 0) return;
      const t = (v - a[ax]) / d[ax]; if (t < 0 || t > 1) return;
      const n = [0, 0, 0]; n[ax] = sg;
      take({ t, n }, ax === 1 ? (sg > 0 ? "floor" : "ceiling") : "wall");
    });
    for (const box of (O.occ || []).concat(O.phys || [])) take(segBox(a, d, box[0].map(v => v - r), box[1].map(v => v + r)), "furn", { box });
    const K = O.kitRuntime, len = Math.hypot(d[0], d[1], d[2]);
    if (K && K.doorT && len > 1e-6) {
      const dn = d.map(v => v / len), t = K.doorT({ o: a, d: dn });
      if (t != null && t - r <= len) { const hz = Math.hypot(dn[0], dn[2]) || 1; take({ t: Math.max(0, t - r) / len, n: [-dn[0] / hz, 0, -dn[2] / hz] }, "furn"); }
    }
    (O.staff || []).forEach(F => {
      if (F.dead) { const [lo, hi] = figBox(F); take(segBox(a, d, lo.map(v => v - r), hi.map(v => v + r)), "body", { F }); return; }
      take(segSphere(a, d, toWorld(F, nodePoint(F.head, HC)), 0.165 + r), "staff", { F, part: "head" });
      const tb = torsoBox(F);
      take(segBox(a, d, tb[0].map(v => v - r), tb[1].map(v => v + r)), "staff", { F, part: "torso" });
      take(segBox(a, d, [F.x - 0.2 - r, 0, F.z - 0.55 - r], [F.x + 0.2 + r, SEAT_Y + 0.12 + r, F.z + 0.12 + r]), "staff", { F, part: "legs" });
    });
    if (best) { best.c = a.map((v, i) => v + d[i] * best.t); best.p = best.c.map((v, i) => v - best.n[i] * r); }
    return best;
  }

  /* Höchste Ablagefläche unter (x, z) bis zur Höhe y – dorthin fällt oder läuft, was von oben kommt */
  function surfBelow(x, z, y) {
    let best = null;
    for (const s of O.surf || []) {
      if (s.y > y + 0.01 || x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
      if (!best || s.y > best.y) best = s;
    }
    return best || { y: 0, x0: -RW, x1: RW, z0: -RD, z1: RD, kind: "floor" };
  }
  /* Abstellen: erste Fläche unter dem Blick, frei, in Reichweite, nicht verdeckt, Henkel zeigt nach rechts */
  function dropSpot(ray, eye) {
    const K = O.kitRuntime;
    if (!K || !K.held || K.busy() || ray.d[1] > -0.08) return null;
    let h = null;
    for (const s of O.surf || []) {
      if (eye[1] < s.y + 0.1) continue;
      const t = (s.y - ray.o[1]) / ray.d[1];
      if (!(t > 0) || (h && t >= h.t)) continue;
      const p = [ray.o[0] + ray.d[0] * t, s.y, ray.o[2] + ray.d[2] * t];
      if (p[0] < s.x0 || p[0] > s.x1 || p[2] < s.z0 || p[2] > s.z1) continue;
      h = { t, p, s };
    }
    if (!h) return null;
    const { p, s } = h, m = CUP_R + 0.012;
    if (Math.hypot(p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]) > 2.4) return null;
    if (p[0] < s.x0 + m || p[0] > s.x1 - m || p[2] < s.z0 + m || p[2] > s.z1 - m) return null;
    const ex = s.kind === "floor" ? O.ob.concat(K.colliders(), deadRects(), [[O.pos[0] - PR, O.pos[1] - PR, O.pos[0] + PR, O.pos[1] + PR]]) : s.ex;
    if (ex.some(r => p[0] > r[0] - m && p[0] < r[2] + m && p[2] > r[1] - m && p[2] < r[3] + m)) return null;
    if (K.items.some(i => i !== K.held && i.location === "free" && i.pos && Math.abs(i.pos[1] - p[1]) < 0.03 && Math.hypot(i.pos[0] - p[0], i.pos[2] - p[2]) < 2 * CUP_R + 0.02)) return null;
    if (blocked(eye, p) || K.occludes(ray, h.t)) return null;
    return { id: "drop", label: "Hier abstellen", t: h.t, pos: p, ry: PI / 2 - O.yaw };
  }

  /* ------------------------------ Anbieten ------------------------------ */
  function offerTarget(who, eye) {
    const K = O.kitRuntime, F = who.F;
    if (!K || !K.held || K.busy() || K.held.kind !== "cup" || K.held.fill < 0.05 || F.dead || F.gift) return null;
    if ([1.42, 1.05].every(h => blocked(eye, [F.x, h, F.z - 0.05]))) return null;
    const d = Math.hypot(F.x - eye[0], F.z - eye[2]);
    if (d > 3.2) return null;
    return d <= OFFER_RANGE ? { id: "offer", label: "Kaffee anbieten", t: who.t, F } : { id: "offer", label: "Näher ran zum Übergeben", t: who.t, F, disabled: true };
  }
  /* Freier Platz auf dem eigenen Tisch, mit der übernehmenden Hand erreichbar (außerhalb von Tastatur, Maus, Block …) */
  function giftSpot(F, side) {
    const K = O.kitRuntime, mx = F.x, z = F.dz;
    const C = side < 0 ? [[0.5, 0.12], [0.17, 0.06], [0.62, 0.12]] : [[-0.6, 0.46], [-0.75, 0.46], [-0.36, 0.12]];
    for (const [dx, dz] of C) {
      const x = mx + dx, zz = z + dz;
      if (!K.items.some(i => i.location === "free" && i.pos && Math.abs(i.pos[1] - 0.76) < 0.03 && Math.hypot(i.pos[0] - x, i.pos[2] - zz) < 2 * CUP_R + 0.02)) return [x, 0.76, zz];
    }
    return null;
  }
  const THANKS = ["Oh, danke! Genau das brauche ich jetzt.", "Für mich? Das ist aber nett – danke!", "Danke! Den kann ich gut gebrauchen.", "Kaffee? Du bist ein Schatz, danke!"];
  function offerTo(F) {
    const K = O.kitRuntime;
    if (!K || !K.held || K.held.kind !== "cup" || K.held.fill < 0.05 || F.dead || F.gift) return;
    const p = F.p, hr = Math.floor((S.time % 1440) / 60), hs = nameHash(p.id || p.name), last = GIFTS.get(p.id);
    const side = K.hand[0] < F.x ? 1 : -1;                     /* Spieler links von der Person (Welt −x) → linke Hand */
    let no = null;
    if (O.deaths) no = "Ich … ich bekomme jetzt nichts runter.";
    else if (F.act === "phone") no = "Gerade nicht – ich telefoniere.";
    else if (F.held === "cup") no = "Danke, ich hab gerade noch meinen.";
    else if (last != null && S.time - last < 90) no = "Danke, einer reicht mir fürs Erste.";
    else if (hs % 7 === 0) no = "Lieb gemeint – aber ich trinke keinen Kaffee.";
    else if ((hr >= 20 || hr < 5) && hs % 3 !== 0) no = "So spät noch? Dann kann ich nachher nicht schlafen.";
    const spot = no ? null : giftSpot(F, side);
    if (!no && !spot) no = "Danke, aber auf meinem Tisch ist gerade kein Platz.";
    if (no) { speak(F, no, { shake: true }); return; }
    const from = K.hand.slice(), it = K.release(); if (!it) return;
    GIFTS.set(p.id, S.time);
    /* Übergabepunkt: von der Schulter Richtung Spielerhand, höchstens 45 cm, auf der Körperseite der Hand, über der Tischkante */
    const sh = toWorld(F, torsoPt(F, side * F.L.sh, 0.33, 0)), dv = from.map((v, i) => v - sh[i]), dl = Math.hypot(...dv) || 1;
    let meet = sh.map((v, i) => v + dv[i] * Math.min(1, 0.45 / dl));
    const ml = toLoc(F, meet); ml[0] = side * Math.max(0.12, side * ml[0]); ml[2] = Math.max(0.05, ml[2]); ml[1] = clamp1(ml[1], 0.98 / FS, 1.25 / FS);
    meet = toWorld(F, ml);
    F.gift = { it, side, from, meet, spot, ry: side < 0 ? 0 : PI, sipped: false, plan: null };
    F.act = "gift"; F.actT = 0; F.actDur = 6.6; F.held = null;
    speak(F, THANKS[(hs + (F.giftN = (F.giftN || 0) + 1)) % THANKS.length]);
  }
  /* Lage der übergebenen Tasse (Weltknoten): erst von der Spielerhand zum Übergabepunkt, dann in der Hand der Person */
  function giftCup(F, k) {
    const g = F.gift, pl = g.plan; if (!pl) return;
    const a = g.side > 0 ? F.arm[0] : F.arm[1];
    let base = pl.base;
    if (k < 0.9) base = lerp3(toLoc(F, g.from), pl.base, ease(k / 0.9));
    else if (pl.g > 0 && a.C) base = mugFromAnchor(lerp3(mugAnchor(pl.base, pl.psi, pl.tilt), a.C, pl.g), pl.psi, pl.tilt);
    const w = toWorld(F, base), r = mugRot(pl.psi, pl.tilt), n = g.it.node;
    n.x = w[0]; n.y = w[1]; n.z = w[2]; n.rx = r[0]; n.ry = r[1] + PI; n.rz = 0;
    if (k >= 2.9 && !g.sipped) { g.sipped = true; g.it.fill = Math.max(0, g.it.fill - 0.12); }
  }
  function giftDone(F) {
    const g = F.gift; if (!g) return;
    F.gift = null;
    if (O.kitRuntime && g.it.location === "ext") O.kitRuntime.settle(g.it, g.spot, g.ry);
  }
  function giftAbort(F) {                                        /* Tasse bleibt dort, wo sie gerade ist – auf der Fläche darunter */
    const g = F.gift; if (!g) return;
    F.gift = null;
    const n = g.it.node, s = surfBelow(n.x, n.z, n.y + 0.02);
    if (O.kitRuntime && g.it.location === "ext") O.kitRuntime.settle(g.it, [n.x, s.y, n.z], g.ry);
  }
  /* Sprechblase über der Person */
  function speak(s, line, o) {
    const p = s.p, role = ROLES[p.role], el = O.el.querySelector("#ofpSay");
    el.innerHTML = `<b>${esc(p.name)}</b><small>${esc(role ? role.name : "Team")}</small><span>„${esc(line)}“</span>`;
    el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
    const now = performance.now();
    s.attendUntil = now + 4800; s.talkUntil = now + Math.min(3200, 900 + line.length * 38);
    if (o && o.shake) s.shakeUntil = now + 900;
    O.sayAt = { x: s.x, z: s.z }; O.sayUntil = now + 4200;
  }

  /* ------------------------------- Werfen ------------------------------- */
  /* Gezielt wird über das Fadenkreuz: Die Flugbahn von der Hand führt durch den ersten Punkt unter dem Blick. */
  function throwCup() {
    const K = O && O.kitRuntime;
    if (!K || !K.held || K.held.kind !== "cup" || K.busy() || O.fly) return;
    const R = O.R, ray = R.ray(R.w / 2, R.h / 2);
    const c0 = [clamp1(K.hand[0], -RW + 0.06, RW - 0.06), K.hand[1] + CUP_C, clamp1(K.hand[2], -RD + 0.06, RD - 0.06)];
    const aim = sweep(ray.o, ray.d.map(v => v * 25), 0);
    const P = aim ? aim.p : ray.o.map((v, i) => v + ray.d[i] * 8);
    const T = clamp1(Math.hypot(P[0] - c0[0], P[1] - c0[1], P[2] - c0[2]) / THROW_V, 0.06, 0.9);
    const v = P.map((q, i) => (q - c0[i]) / T + (i === 1 ? 0.5 * GRAV * T : 0));
    const it = K.release(); if (!it) return;
    O.fly = { it, c: c0, v, rx: 0, rz: 0, wx: 6 + Math.random() * 5, wz: (Math.random() - 0.5) * 6, fill: it.fill, t: 0 };
    O.throwN = (O.throwN || 0) + 1;
  }
  function stepFly(dt) {
    const f = O.fly; if (!f) return;
    let left = dt;
    while (left > 1e-6) {
      const h = Math.min(left, 1 / 120); left -= h;
      const v0 = f.v.slice(); f.v[1] -= GRAV * h;
      const d = [(v0[0] + f.v[0]) / 2 * h, (v0[1] + f.v[1]) / 2 * h, (v0[2] + f.v[2]) / 2 * h];
      const hit = sweep(f.c, d, CUP_R);
      if (hit) { f.c = hit.c; return impact(f, hit); }
      f.c = f.c.map((x, i) => x + d[i]); f.t += h;
      if (f.t > 4) return impact(f, { kind: "floor", n: [0, 1, 0], c: f.c, p: [f.c[0], 0, f.c[2]] });
    }
    if (!O.reduced) { f.rx += f.wx * dt; f.rz += f.wz * dt; }
    const n = f.it.node, cx = Math.cos(f.rx), sx = Math.sin(f.rx), cz = Math.cos(f.rz), sz = Math.sin(f.rz);
    n.rx = f.rx; n.ry = 0; n.rz = f.rz;
    n.x = f.c[0] + sz * CUP_C; n.y = f.c[1] - cx * cz * CUP_C; n.z = f.c[2] - sx * cz * CUP_C;   /* Drehpunkt ist der Tassenboden */
    if (f.it.liquid) f.it.liquid.visible = false;
    /* offene Tasse: unterwegs schwappt Kaffee heraus */
    if (f.fill > 0.04 && !O.reduced && Math.random() < dt * 45) {
      O.R.emit({ x: f.c[0], y: f.c[1], z: f.c[2], vx: f.v[0] * 0.85 + (Math.random() - 0.5) * 0.6, vy: f.v[1] * 0.85 + Math.random() * 0.4, vz: f.v[2] * 0.85 + (Math.random() - 0.5) * 0.6,
        g: -GRAV, drag: 0.4, life: 0.5, size: 0.016, col: [0.3, 0.17, 0.08, 1], fade: false });
      f.fill = Math.max(0, f.fill - 0.006);
    }
  }
  function impact(f, hit) {
    const K = O.kitRuntime, R = O.R, it = f.it, n = hit.n, p = hit.p;
    O.fly = null;
    const sp = Math.hypot(f.v[0], f.v[1], f.v[2]) || 1, dir = f.v.map(v => v / sp);
    if (K) K.shatter(it);
    crashSound(Math.min(1, sp / 8));
    const col = G3.col(it.color || 0xf6f1e6);
    R.burst({ x: p[0], y: p[1], z: p[2], n: 12, spread: 0.06, speed: 1.3, up: 1.1, g: -9, life: 0.45, size: 0.012, col: [[col[0], col[1], col[2], 1], [0.96, 0.94, 0.9, 1]] });
    if (f.fill > 0.03) R.burst({ x: p[0], y: p[1], z: p[2], n: Math.round(12 + f.fill * 18), spread: 0.08, speed: 1.7, up: 1.3, g: -9.8, life: 0.55, size: 0.018, col: [[0.33, 0.19, 0.09, 1], [0.42, 0.25, 0.12, 1]] });
    shards(p, f.v, n, it.color || 0xf6f1e6);
    if (f.fill > 0.03) spillAt(hit, dir, f.fill);
    if (hit.kind === "staff" && (hit.part === "head" || hit.part === "torso")) killStaff(hit.F, p, dir, hit.part, f.fill);
    else if (hit.kind === "staff") { ouch(hit.F); startle(p, hit.F); }
    else startle(p, null);
  }
  /* Scherben: Splitter in Tassenfarbe mit glasierter Innenseite und der Henkel als Ganzes */
  function shards(p, v, n, color) {
    const dot = v[0] * n[0] + v[1] * n[1] + v[2] * n[2], rv = v.map((x, i) => (x - 2 * dot * n[i]) * 0.22);
    for (let k = 0; k < 8; k++) {
      const a = Math.random() * 2 * PI, s = 0.4 + Math.random() * 1.3;
      fxAdd({ type: "shard", persist: true, until: S.time + SPILL_MIN, col: color, k, handle: k === 0,
        pos: p.map((x, i) => x + n[i] * 0.03), rot: [Math.random() * 6, Math.random() * 6, Math.random() * 6],
        v: [rv[0] + Math.cos(a) * s, rv[1] + 0.6 + Math.random() * 1.4, rv[2] + Math.sin(a) * s], w: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 30] });
    }
  }
  /* Wohin der Kaffee kommt (logische Stelle) */
  function spillAt(hit, dir, fill) {
    const n = hit.n, p = hit.p;
    let on = null, at = null, flat = false;
    if (n[1] > 0.7 && hit.kind !== "staff" && hit.kind !== "body") {
      if (hit.kind === "floor") on = surfBelow(p[0], p[2], 0);
      else if (hit.box && Math.min(hit.box[1][0] - hit.box[0][0], hit.box[1][2] - hit.box[0][2]) >= 0.2)
        on = { y: hit.box[1][1], x0: hit.box[0][0], x1: hit.box[1][0], z0: hit.box[0][2], z1: hit.box[1][2], kind: "box" };
      if (on) { at = [p[0] + dir[0] * 0.06, on.y, p[2] + dir[2] * 0.06]; flat = true; }
    }
    if (!at) {
      /* senkrecht oder von unten: Fleck an der Trefferstelle, der Rest läuft bzw. tropft nach unten */
      if (hit.kind !== "staff" && hit.kind !== "body") fxAdd({ type: "blob", persist: true, until: S.time + SPILL_MIN, pos: p.map((x, i) => x + n[i] * 0.004), n, r: 0.05 + fill * 0.07, col: COFFEE, hi: null, seed: (O.throwN || 1) * 31 + 7, drip: Math.abs(n[1]) < 0.7 ? [0, 1] : null });
      const off = hit.kind === "staff" || hit.kind === "body" ? 0.25 : Math.abs(n[1]) > 0.7 ? 0 : 0.1;
      const x = clamp1(p[0] + n[0] * off, -RW + 0.1, RW - 0.1), z = clamp1(p[2] + n[2] * off, -RD + 0.1, RD - 0.1);
      on = surfBelow(x, z, p[1]); at = [x, on.y, z];
    }
    const carpet = on.kind === "floor" && O.carpet;
    const r = Math.sqrt(0.04 * fill) * (carpet ? 0.65 : 1) * (flat ? 1 : 0.8);
    at[0] = clamp1(at[0], on.x0 + r * 0.45, on.x1 - r * 0.45); at[2] = clamp1(at[2], on.z0 + r * 0.45, on.z1 - r * 0.45);
    at[1] = on.y + 0.003;
    fxAdd({ type: "blob", persist: true, until: S.time + SPILL_MIN, pos: at, n: [0, 1, 0], ry: Math.atan2(dir[0], dir[2]), r, col: carpet ? COFFEE_CARPET : COFFEE, hi: carpet ? null : COFFEE_HI, seed: (O.throwN || 1) * 17 + 3, grow: true, growT: 0.6 });
  }

  /* ----------------------------- Spuren-Netze ---------------------------- */
  /* Unregelmäßige Lache in der xz-Ebene (Normale +y), mit Tropfen daneben; drip [x, z]: Laufspuren in diese Richtung */
  function blobInto(b, r, col, hi, seed, drip) {
    const g = rng(seed), n = 20, rr = [];
    for (let i = 0; i < n; i++) rr.push(r * (0.74 + g() * 0.36));
    const sm = rr.map((v, i) => (v * 2 + rr[(i + 1) % n] + rr[(i + n - 1) % n]) / 4);
    const P = (i, s, y) => { const a = i / n * 2 * PI; return [Math.cos(a) * sm[i % n] * s, y || 0, Math.sin(a) * sm[i % n] * s]; };
    for (let i = 0; i < n; i++) b.tri([0, 0, 0], P(i + 1, 1), P(i, 1), col);
    if (hi != null) for (let i = 0; i < n; i++) b.tri([r * 0.1, 0.0012, -r * 0.08], P(i + 1, 0.5, 0.0012), P(i, 0.5, 0.0012), hi);
    const k = 3 + Math.floor(g() * 4);
    for (let j = 0; j < k; j++) { const a = g() * 2 * PI, d = r * (1.0 + g() * 0.55); b.disc(r * (0.06 + g() * 0.09), 8, col, { x: Math.cos(a) * d, z: Math.sin(a) * d }); }
    if (drip) for (let j = 0; j < 3; j++) {
      const o = (g() - 0.5) * r * 1.1, len = r * (0.8 + g() * 1.8), w = 0.006 + g() * 0.006, q = [drip[1], -drip[0]];
      const c = [q[0] * o + drip[0] * (r * 0.4 + len / 2), q[1] * o + drip[1] * (r * 0.4 + len / 2)];
      b.plate(drip[0] ? len : w, drip[0] ? w : len, col, { x: c[0], z: c[1] });
      b.disc(w * 0.9, 8, col, { x: q[0] * o + drip[0] * (r * 0.4 + len), z: q[1] * o + drip[1] * (r * 0.4 + len) });
    }
    return b;
  }
  function shardMesh(color, k) {
    const b = new G3.MB(), g = rng(k * 977 + 13), n = 3 + (k % 3), h = 0.006, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * 2 * PI + g() * 0.6, r = 0.012 + g() * 0.02; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    for (let i = 0; i < n; i++) {
      const a = pts[i], c = pts[(i + 1) % n];
      b.tri([0, h, 0], [c[0], h, c[1]], [a[0], h, a[1]], color);
      b.tri([0, 0, 0], [a[0], 0, a[1]], [c[0], 0, c[1]], 0xeee8de);
      b.quad([a[0], 0, a[1]], [a[0], h, a[1]], [c[0], h, c[1]], [c[0], 0, c[1]], 0xd8d2c6);
    }
    return b;
  }
  function handleMesh(color) {                                   /* Henkel, flach liegend */
    const b = new G3.MB();
    b.box(0.033, 0.014, 0.012, color, { x: -0.006, z: -0.0275 }); b.box(0.033, 0.014, 0.012, color, { x: -0.006, z: 0.0275 });
    b.box(0.012, 0.014, 0.067, color, { x: 0.011 });
    return b;
  }
  function ringMesh() {
    const b = new G3.MB(), n = 24, P = (r, a) => [Math.cos(a) * r, 0, Math.sin(a) * r];
    for (let i = 0; i < n; i++) { const a = i / n * 2 * PI, c = (i + 1) / n * 2 * PI; b.quad(P(0.05, a), P(0.05, c), P(0.06, c), P(0.06, a), 0xffffff); }
    return b;
  }
  /* Spuren: Lachen, Flecken, Scherben. Sie bleiben über Etagenwechsel erhalten (persist) und verblassen nach until (S.time). */
  function fxAdd(d) {
    const R = O.R, fx = { d, nodes: [], meshes: [], born: O.t, fade: null, ph: null };
    const M1 = mb => { const m = R.mesh(mb); O.meshes.push(m); fx.meshes.push(m); return m; };
    if (d.type === "shard") {
      fx.nodes.push(R.node(M1(d.handle ? handleMesh(d.col) : shardMesh(d.col, d.k)), { x: d.pos[0], y: d.pos[1], z: d.pos[2], rx: d.rot[0], ry: d.rot[1], rz: d.rot[2], shadow: false }));
      if (d.v) fx.ph = { v: d.v.slice(), w: d.w.slice() };
    } else {
      const o = { x: d.pos[0], y: d.pos[1], z: d.pos[2], shadow: false }, nn = d.n || [0, 1, 0];
      if (nn[1] > 0.9) o.ry = d.ry || 0;
      else if (nn[1] < -0.9) o.rx = PI;
      else { o.rx = PI / 2; o.ry = Math.atan2(nn[0], nn[2]); }
      if (d.grow) o.sx = o.sz = 0.25;
      fx.nodes.push(R.node(M1(blobInto(new G3.MB(), d.r, d.col, d.hi, d.seed, d.drip)), o));
    }
    fx.nodes.forEach(n => R.nodes.push(n));
    (O.fx || (O.fx = [])).push(fx);
    return fx;
  }
  function fxRemove(fx) {
    const R = O.R;
    fx.nodes.forEach(n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
    fx.meshes.forEach(m => { R.free(m); const i = O.meshes.indexOf(m); if (i >= 0) O.meshes.splice(i, 1); });
    O.fx = O.fx.filter(x => x !== fx);
  }
  function stepFx(dt) {
    for (const fx of (O.fx || []).slice()) {
      const d = fx.d, nd = fx.nodes[0];
      if (fx.ph) {
        const ph = fx.ph; ph.v[1] -= GRAV * dt;
        const p = [nd.x + ph.v[0] * dt, nd.y + ph.v[1] * dt, nd.z + ph.v[2] * dt];
        if (Math.abs(p[0]) > RW - 0.02) { p[0] = Math.sign(p[0]) * (RW - 0.02); ph.v[0] *= -0.3; }
        if (Math.abs(p[2]) > RD - 0.02) { p[2] = Math.sign(p[2]) * (RD - 0.02); ph.v[2] *= -0.3; }
        if (p[1] > O.H - 0.02) { p[1] = O.H - 0.02; ph.v[1] = -Math.abs(ph.v[1]) * 0.3; }
        const gy = surfBelow(p[0], p[2], nd.y + 0.004).y + 0.002;
        if (p[1] <= gy) {
          p[1] = gy;
          if (Math.abs(ph.v[1]) < 0.7) { fx.ph = null; d.v = null; nd.rx = 0; nd.rz = 0; }
          else { ph.v[1] *= -0.28; ph.v[0] *= 0.5; ph.v[2] *= 0.5; ph.w = ph.w.map(x => x * 0.5); }
        }
        nd.x = p[0]; nd.y = p[1]; nd.z = p[2];
        if (fx.ph && !O.reduced) { nd.rx += ph.w[0] * dt; nd.ry += ph.w[1] * dt; nd.rz += ph.w[2] * dt; }
        d.pos = p; d.rot = [nd.rx, nd.ry, nd.rz];
      }
      if (d.grow) {
        const k = clamp1((O.t - fx.born) / (d.growT || 0.6), 0, 1), s = 0.25 + 0.75 * (1 - Math.pow(1 - k, 3));
        nd.sx = nd.sz = s; if (k >= 1) d.grow = false;
      }
      if (fx.fade == null && S.time >= d.until) fx.fade = 0;
      if (fx.fade != null) {
        fx.fade += dt;
        const a = Math.max(0, 1 - fx.fade / 1.2);
        fx.nodes.forEach(n => { n.alpha = a; });
        if (a <= 0) fxRemove(fx);
      }
    }
  }
  function crashSound(loud) {
    if (typeof S === "undefined" || !S.farm || !S.farm.snd) return;
    try {
      const ac = O.ac || (O.ac = new (window.AudioContext || window.webkitAudioContext)()), t0 = ac.currentTime;
      const len = 0.35, buf = ac.createBuffer(1, Math.floor(ac.sampleRate * len), ac.sampleRate), dd = buf.getChannelData(0);
      for (let i = 0; i < dd.length; i++) { const x = i / dd.length; dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 3) * Math.min(1, x * 100); }
      const src = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; hp.type = "highpass"; hp.frequency.value = 1800; g.gain.value = 0.22 * loud;
      src.connect(hp); hp.connect(g); g.connect(ac.destination); src.start(t0);
      for (let k = 0; k < 4; k++) {
        const o = ac.createOscillator(), gg = ac.createGain(), ts = t0 + 0.01 + Math.random() * 0.12;
        o.type = "triangle"; o.frequency.value = 2600 + Math.random() * 2800;
        gg.gain.setValueAtTime(0.0001, ts); gg.gain.exponentialRampToValueAtTime(0.05 * loud + 0.001, ts + 0.005); gg.gain.exponentialRampToValueAtTime(0.0001, ts + 0.12);
        o.connect(gg); gg.connect(ac.destination); o.start(ts); o.stop(ts + 0.14);
      }
      if (ac.resume) ac.resume().catch(() => {});
    } catch (e) { /* Ton ist optional */ }
  }

  /* ---------------------------- Reaktionen ----------------------------- */
  const CRASH_SAY = ["Hey, pass doch auf!", "Schon wieder eine Tasse?!", "Alles in Ordnung bei dir?"];
  function startle(pt, except) {
    const now = performance.now(); let near = null, nd = 3.2;
    (O.staff || []).forEach(G => {
      if (G.dead || G === except || G.gift) return;
      G.startle = { pt: pt.slice(), until: now + 1300 + G.rnd() * 500 };
      const d = Math.hypot(G.x - pt[0], G.z - pt[2]);
      if (d < nd) { nd = d; near = G; }
    });
    if (near && !except && !O.deaths && now > (O.sayUntil || 0)) {
      const n = O.crashN = (O.crashN || 0) + 1;
      later(450, () => { if (O.staff.includes(near) && !near.dead) speak(near, n === 1 ? "Huch! Was war das denn?" : CRASH_SAY[(n - 2) % CRASH_SAY.length]); });
    }
  }
  function ouch(F) {
    const n = O.ouchN = (O.ouchN || 0) + 1;
    speak(F, ["Au! Spinnst du?!", "Aua! Was soll das?!", "Hey! Bist du verrückt geworden?"][(n - 1) % 3]);
    F.startle = { pt: eyePt().slice(), until: performance.now() + 2600 };
  }

  /* ------------------------------ Todesfall ------------------------------ */
  /* Sturzseite: dorthin, wohin der Wurf drückt, sonst zur anderen Seite; ist beides verstellt, sackt die Person im Stuhl zusammen */
  function fallSide(F, dirX) {
    const pref = dirX >= 0 ? 1 : -1, own = F.own || [];
    const rects = O.ob.concat(O.kitRuntime ? O.kitRuntime.colliders() : [], deadRects(), [[O.pos[0] - PR, O.pos[1] - PR, O.pos[0] + PR, O.pos[1] + PR]]);
    for (const fx of [pref, -pref]) {
      const xa = F.x + fx * 0.3, xb = F.x + fx * 1.55, r = [Math.min(xa, xb), F.z - 0.3, Math.max(xa, xb), F.z + 0.22];
      if (r[0] < -RW + 0.05 || r[2] > RW - 0.05) continue;
      if (rects.some(o => !own.includes(o) && o[0] < r[2] && o[2] > r[0] && o[1] < r[3] && o[3] > r[1])) continue;
      return fx;
    }
    return 0;
  }
  /* Gegenstand aus der Figur lösen (bleibt in der Welt liegen, wenn die Figur stürzt) */
  function detach(F, n) {
    const r = F.root, i = r.children.indexOf(n); if (i < 0) return;
    r.children.splice(i, 1); n.parent = null;
    const w = toWorld(F, [n.x, n.y, n.z]);
    n.x = w[0]; n.y = w[1]; n.z = w[2]; n.ry = PI + n.ry; n.sx *= FS; n.sy *= FS; n.sz *= FS;
    O.R.nodes.push(n);
  }
  /* Kugelkappe um die Richtung dir (unregelmäßiger Rand) für shell() */
  function capKeep(dir, ang, g) {
    return (th, az) => {
      const v = [Math.sin(th) * Math.sin(az), Math.cos(th), Math.sin(th) * Math.cos(az)];
      const a = Math.acos(clamp1(v[0] * dir[0] + v[1] * dir[1] + v[2] * dir[2], -1, 1));
      return a < ang * (1 + 0.22 * Math.sin(v[0] * 37 + v[1] * 23 + v[2] * 29 + g));
    };
  }
  /* Sichtbare Verletzung an der Trefferstelle: Kopf (Platzwunde mit Rinnsal) oder Oberkörper (durchgeblutete Kleidung) */
  function wound(F, hit, part, fill) {
    const R = O.R, lp = toLoc(F, hit), g = nameHash(F.p.id) % 97;
    const M1 = mb => { const m = R.mesh(mb); O.meshes.push(m); return m; };
    if (part === "head") {
      const Hn = F.head, q = invNode(Hn, lp), L = F.L;
      const d = nrm([(q[0] - HC[0]) / HR, (q[1] - HC[1]) / (HR * HSY), (q[2] - HC[2]) / HR]);
      const hairy = L.style !== "glatze" && d[2] < 0.55 && d[1] > -0.25;
      const rr = L.acc === "muetze" ? 1.16 : L.acc === "cap" ? 1.12 : hairy ? 1.11 : 1.025;
      const b = new G3.MB(), cap = (dir, ang, rm, col) => shell(b, HR * rr * rm, col, capKeep(dir, ang, g), { c: HC, sy: HSY, seg: 96, rings: 56 });
      cap(d, 0.36, 1.0, 0x6a0e10);                                  /* verschmiertes Blut */
      cap(d, 0.19, 1.004, 0xa5191d);                                /* Platzwunde */
      cap(d, 0.07, 1.008, 0x2b0506);                                /* Riss */
      const down = nrm([d[0] * 0.55, -0.85, d[2] * 0.55]);
      [0.25, 0.42, 0.6, 0.78, 0.92].forEach((s, i) => cap(nrm(lerp3(d, down, s)), 0.075 - i * 0.008, 1.002, 0x7a1214));   /* Rinnsal */
      R.addChild(Hn, R.node(M1(b), { shadow: false }));
      return;
    }
    const T = F.torso, q = invNode(T, lp), L = F.L, hw = L.tw / 2, hd = L.td / 2, y = clamp1(q[1], 0.05, 0.31);
    let o, drip;
    if (Math.abs(q[2]) / hd >= Math.abs(q[0]) / hw) {
      const sz = q[2] >= 0 ? 1 : -1;
      o = { x: clamp1(q[0], -hw + 0.04, hw - 0.04), y, z: sz * (hd + 0.024), rx: sz * PI / 2 }; drip = [0, sz];
    } else {
      const sx = q[0] >= 0 ? 1 : -1;
      o = { x: sx * (hw + 0.014), y, z: clamp1(q[2], -hd + 0.03, hd - 0.03), rz: -sx * PI / 2 }; drip = [sx, 0];
    }
    const b = new G3.MB();
    if (fill > 0.03) b.at({ y: -0.0008 }, () => blobInto(b, 0.08, COFFEE, null, g + 5, null));       /* Kaffee auf der Kleidung */
    blobInto(b, 0.05, 0x6a0e10, null, g, drip);
    b.at({ y: 0.0006 }, () => blobInto(b, 0.022, 0xa5191d, null, g + 1, null));
    b.at({ y: 0.0012 }, () => b.disc(0.008, 8, 0x2b0506));
    R.addChild(T, R.node(M1(b), Object.assign({ s: 1 / FS, shadow: false }, o)));
  }
  function killStaff(F, hit, dir, part, fill) {
    if (F.dead) return;
    if (F.gift) giftAbort(F);
    const Hn = F.head, dl = [-dir[0], dir[1], -dir[2]];             /* Wurfrichtung in Figur-Koordinaten */
    const armDir = F.arm.map(a => {
      const S0 = a.S, E = a.E || S0.map((v, i) => v + (i === 1 ? -ARM_A : 0)), Hh = a.H || E;
      return [nrm(E.map((v, i) => v - S0[i])), nrm(Hh.map((v, i) => v - E[i]))];
    });
    wound(F, hit, part, fill);
    const dn = fallSide(F, dir[0]), kind = dn ? "fall" : "slump", s = dl[0] >= 0 ? 1 : -1;
    let pose;
    if (kind === "fall") {
      const bot = -dn;                                              /* dn = +1: Kopf zur Welt-+x-Seite, Figur-−x liegt unten */
      pose = { lean: 0.12, hrx: 0.25, hry: 0, hrz: dn * 0.85,
        up: F.arm.map(a => a.side === bot ? nrm([-dn * 0.05, -0.25, 1]) : nrm([-dn * 0.7, -0.3, 0.65])),
        fo: F.arm.map(a => a.side === bot ? nrm([-dn * 0.1, 0.35, 1]) : nrm([-dn * 0.6, 0.1, 0.8])) };
    } else {
      pose = { lean: -0.18, hrx: 0.62, hry: s * 0.18, hrz: s * 0.55,
        up: F.arm.map(a => nrm([a.side * 0.22, -1, 0.04])), fo: F.arm.map(a => nrm([a.side * 0.12, -1, 0.14])) };
    }
    const fwd = clamp1(dl[2], -1, 1), sideK = clamp1(dl[0], -1, 1), hk = part === "head" ? 0.45 : 0.15;
    F.dead = { t: 0, kind, dn, part, pose, pool: null,
      from: { lean: F.lean, tw: F.tw, hrx: Hn.rx, hry: Hn.ry, hrz: Hn.rz, up: armDir.map(x => x[0]), fo: armDir.map(x => x[1]) },
      jl: fwd * 0.18, jp: fwd * hk, jr: -sideK * hk };
    F.act = "dead"; F.held = null; F.pen.visible = false; F.talkUntil = 0; F.attendUntil = 0;
    /* Tasse, Telefon, Maus bleiben auf dem Tisch liegen */
    [[F.cup, F.P.cup, PI], [F.phone, F.P.phone, -0.1], [F.mouse, [F.mouse.x, F.P.mouse[1], F.mouse.z], 0]].forEach(([n, p, ry]) => {
      n.x = p[0]; n.y = p[1]; n.z = p[2]; n.rx = 0; n.ry = ry; n.rz = 0;
      if (kind === "fall") detach(F, n);
    });
    F.penRest.visible = true; if (kind === "fall") detach(F, F.note);
    if (O.sayAt && Math.abs(O.sayAt.x - F.x) < 0.01 && Math.abs(O.sayAt.z - F.z) < 0.01) { O.sayUntil = 0; }
    /* Folgen im Spielstand – wie beim Ausscheiden (offices.js fire), ohne Abfindung */
    const b = (typeof baseById === "function" && baseById(O.b.id)) || O.b, p = F.p, role = ROLES[p.role];
    try {
      if (S.fleet) S.fleet.forEach(f => { if (f.driver === p.id) f.driver = null; });
      b.staff = b.staff.filter(x => x.id !== p.id);
      b.mood = Math.max(0, (b.mood || 0) - 40);
      O.b = b; O.sig = staffSig(b, O.floor);
      if (typeof phoneMsg === "function") phoneMsg({
        from: N[b.node].name, kind: "trouble", title: "Todesfall im Büro", baseId: b.id,
        body: p.name + " (" + (role ? role.name : "Team") + ") ist im Büro " + N[b.node].short + " von einer geworfenen Kaffeetasse am "
          + (part === "head" ? "Kopf" : "Oberkörper") + " getroffen worden und noch am Arbeitsplatz gestorben. Notarzt und Polizei waren vor Ort. Das Team ist schwer erschüttert.",
        toastText: "⚠️ " + p.name + " ist im Büro " + N[b.node].short + " gestorben."
      });
      /* v264: Festnahme vormerken (S.jail „pending“, snus.js) – auch beim Neuladen oder vorzeitigen Verlassen kommt die U-Haft */
      if (typeof jailUhaft === "function") jailUhaft({ who: p.name, place: b.node, baseId: b.id });
      if (typeof save === "function") save();
      if (typeof render === "function") render();
    } catch (e) { console.warn("Büro: Todesfall", e); }
    O.deaths = (O.deaths || 0) + 1;
    /* Team: Schreck, Blick zur Person, Hände vor den Mund; wer am nächsten sitzt, ruft um Hilfe */
    let near = null, nd = 1e9;
    (O.staff || []).forEach(G => {
      if (G === F || G.dead) return;
      if (G.gift) giftAbort(G);
      const d = Math.hypot(G.x - F.x, G.z - F.z);
      G.shock = { at: O.t + 0.25 + d * 0.06, F, pt: hit.slice() };
      G.act = "look"; G.actT = 0; G.actDur = 1e9; G.held = null; G.startle = null;
      if (d < nd) { nd = d; near = G; }
    });
    const first = p.name.split(" ")[0];
    if (near) later(1300, () => { if (O.staff.includes(near) && !near.dead) speak(near, first + "?! … Oh nein! Ruft sofort einen Notarzt!"); });
    later(near ? 4200 : 1200, () => hint(p.name + " ist tot. Notarzt und Polizei sind verständigt."));
    /* v264: Die Polizei kommt und führt dich hinaus; danach zeigt snus.js die Festnahme und die U-Haft */
    if (!O.police) {
      O.police = true;
      later(near ? 8200 : 5200, () => {
        hint("Die Polizei ist da. Du wirst festgenommen.");
        const st = O.el.querySelector("#ofpHint"); if (st) { clearTimeout(O.hintT); O.hintT = setTimeout(() => { if (O) st.classList.remove("on"); }, 6000); }
        later(3000, () => { if (O) leave(); });
      });
    }
  }
  /* Zusammenbruch: kurzer Ruck vom Aufprall, dann erschlafft; Sturz seitlich vom Stuhl oder Zusammensacken im Stuhl */
  function animDead(F, dt) {
    const D = F.dead, k = (D.t += dt), P0 = D.from, Q = D.pose, rt = F.root;
    const jerk = k < 0.28 ? Math.sin(k / 0.28 * PI) : 0;
    const u = ease((k - 0.1) / (D.kind === "fall" ? 0.75 : 0.9)), mixA = (a, b) => a + (b - a) * u;
    F.br = 1; F.lean = mixA(P0.lean, Q.lean) + jerk * D.jl; F.tw = mixA(P0.tw, 0);
    const T = F.torso; T.rx = F.lean; T.ry = F.tw; T.sy = 1; T.sz = 1;
    const np = torsoPt(F, 0, 0.4, 0), Hn = F.head;
    Hn.x = np[0]; Hn.y = np[1]; Hn.z = np[2];
    Hn.rx = mixA(P0.hrx, Q.hrx) + jerk * D.jp; Hn.ry = mixA(P0.hry, Q.hry); Hn.rz = mixA(P0.hrz, Q.hrz) + jerk * D.jr;
    if (D.kind === "fall") {
      const f = clamp1((k - 0.15) / 0.6, 0, 1), th = f * f;
      const bounce = !O.reduced && k > 0.75 ? Math.exp(-(k - 0.75) * 8) * Math.sin((k - 0.75) * 20) * 0.05 : 0;
      rt.rz = D.dn * (1.47 * th - bounce);
      rt.y = 0.17 * Math.sin(Math.abs(rt.rz)) / Math.sin(1.47);
    }
    F.arm.forEach((a, i) => {
      const S0 = torsoPt(F, a.side * F.L.sh, 0.33, 0), up = nrm(lerp3(P0.up[i], Q.up[i], u)), fo = nrm(lerp3(P0.fo[i], Q.fo[i], u));
      const ur = dirRot(up), fr = dirRot(nrm(invRxRz(ur[0], ur[1], fo)));
      a.ua.x = S0[0]; a.ua.y = S0[1]; a.ua.z = S0[2]; a.ua.rx = ur[0]; a.ua.rz = ur[1]; a.fa.rx = fr[0]; a.fa.rz = fr[1];
      const W = S0.map((v, j) => v + up[j] * ARM_A + fo[j] * ARM_B);           /* Handgelenk; Hand schlaff in Verlängerung des Unterarms */
      a.hand.x = W[0] + fo[0] * PALM; a.hand.y = W[1] + fo[1] * PALM; a.hand.z = W[2] + fo[2] * PALM;
      a.hand.rx = Math.asin(clamp1(-fo[1], -1, 1)); a.hand.ry = Math.atan2(fo[0], fo[2]); a.hand.rz = 0;
      if (a.g !== "rest") { a.g = "rest"; a.hand.mesh = F.M("hand:" + a.side + ":" + F.L.skin + ":rest", () => handMesh(F.L, a.side, "rest")); }
    });
    F.lids.visible = k > 0.1; F.mouth.sy = 1.45;
    if (!D.pool && k > (D.kind === "fall" ? 0.95 : 0.7)) {
      const src = D.part === "head" ? deadHead(F) : rootWorld(F, torsoPt(F, 0, 0.18, 0));
      let x = src[0], z = src[2];
      if (D.kind === "slump") { const w = toWorld(F, [0, 0, 0.2]); z = w[2]; }          /* tropft vor dem Sitz auf den Boden */
      const carpet = O.carpet, r = (D.part === "head" ? 0.26 : 0.2) * (D.kind === "slump" ? 0.55 : 1) * (carpet ? 0.75 : 1);
      D.pool = fxAdd({ type: "blob", persist: false, until: Infinity, pos: [x, 0.004, z], n: [0, 1, 0], ry: nameHash(F.p.id) % 6, r,
        col: carpet ? 0x3f0909 : BLOOD, hi: carpet ? null : BLOOD_HI, seed: nameHash(F.p.id) % 991, grow: true, growT: 8 });
    }
  }
  function stepCoffee(dt) {
    stepFly(dt);
    stepFx(dt);
    if (O.later && O.later.length) {
      const now = performance.now(), due = O.later.filter(l => now >= l.at);
      if (due.length) { O.later = O.later.filter(l => now < l.at); due.forEach(l => { if (!O) return; try { l.fn(); } catch (e) { console.warn("Büro", e); } }); }
    }
  }

  /* ------------------------------ Verlassen ---------------------------- */
  function leave() {
    if (!O) return;
    const o = O; O = null; o.alive = false;
    cancelAnimationFrame(o.raf);
    if (o.kitRuntime) o.kitRuntime.dispose();
    if (o.ac) { try { o.ac.close(); } catch (e) { /* egal */ } }
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
  return { enter, leave, isOpen: () => !!O, buildRoom, _dbg: () => O, _tap: (x, y) => tapAt(x, y),
    _t: { throwCup, offerTo, killStaff, actionTarget, performAction, sweep, surfBelow } };       /* _t nur für Browser-Tests (v263) */
})();
