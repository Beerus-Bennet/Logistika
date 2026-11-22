/* =========================================================================
   LOGISTIKA – Waffenschrank und Waffenshop für den Hochsitz (v383)
   Reale Jagd- und Sportwaffen mit ihren Eckdaten. Gekauft wird im
   Hochsitz-Fenster („Waffenschrank“), eine Sonderwaffe gibt es nur im
   Lucky-Rad. Die Wirkung im Revier (Magazin, Feuerfolge, Energie, Durchschuss,
   Schrot, Reichweite) liest hunt.js aus diesem Katalog.

   Zahlen: Mündungsgeschwindigkeit und Geschossgewicht nach üblichen
   Fabrikpatronen, auf runde Spielwerte gebracht; Preise grob nach
   Händlerangeboten. Die Energie am Ziel rechnet E = ½·m·v² mit einem
   Geschwindigkeitsverlust je Entfernung (lam). Mindestenergie am Ziel
   (NEED): angelehnt an die E100-Regeln des BJagdG (Hochwild 2000 J),
   im Spiel etwas milder.
   Spielstand: S.farm.guns = { own: { id: 1 }, sel: id } – einmalig angelegt,
   die Mauser M18 gehört jedem Jäger von Anfang an.
   ========================================================================= */
"use strict";
const WEAPONS = (() => {
  /* Mindestenergie (J) am Ziel für einen tödlichen Treffer an Schalenwild; Fasan braucht kaum etwas */
  const NEED = { hirsch: 1800, keiler: 1500, fasan: 25 };
  /* v0 m/s, m kg, lam = Strecke (m), auf der die Geschwindigkeit um den Faktor e abnimmt, mag Schuss, cyc s zwischen zwei Schüssen,
     rel s Nachladen, zooms Vergrößerungen, maxR wirksame Reichweite (m), nearD Spawn-Abstand (Einheiten, nur Kurzwaffen/Flinte),
     pen Eindringtiefe im Wild (Tiermaß; 9 = „immer durch“), pellets/cone Schrotgarbe, kick Rückstoß (0..1.4), pen/thru siehe hunt.js */
  const LIST = [
    { id: "m18", name: "Mauser M18", short: "M18", type: "Repetierbüchse", cal: ".308 Win", model: "bolt", v0: 820, m: 0.0117, lam: 1150, mag: 5, cyc: 1.5, rel: 3.2, zooms: [4, 8, 12], maxR: 400, pen: 1, kick: 1, price: 0, snd: "rifle",
      txt: "Die zuverlässige Allround-Büchse für den Anfang. Jeder Jäger beginnt mit ihr.", real: "Zylinderverschluss-Repetierer seit 2018, 5-Schuss-Magazin, Kaliber .308 Win: 11,7 g mit rund 820 m/s – etwa 3,9 kJ an der Mündung." },
    { id: "r8", name: "Blaser R8 Professional", short: "Blaser R8", type: "Geradezug-Repetierer", cal: ".30-06 Spr.", model: "straight", v0: 850, m: 0.0117, lam: 1150, mag: 5, cyc: 0.85, rel: 3, zooms: [4, 8, 12], maxR: 400, pen: 1.1, kick: 1.05, price: 4200, snd: "rifle",
      txt: "Der Geradezug-Verschluss wird nur vor- und zurückgeschoben – schneller zweiter Schuss, aber jeder Zusatzschuss kostet Bewertung.", real: "Geradezugrepetierer mit herausnehmbarem Boxmagazin; je nach Ausstattung ab rund 3.100 € bis über 8.000 €." },
    { id: "sr1", name: "Merkel SR 1", short: "Merkel SR 1", type: "Selbstladebüchse", cal: ".308 Win", model: "auto", v0: 810, m: 0.0117, lam: 1150, mag: 3, cyc: 0.42, rel: 3.2, zooms: [3, 6], maxR: 300, pen: 0.95, kick: 0.9, price: 2900, snd: "rifle",
      txt: "Gasdruck-Selbstlader für Bewegungsjagden: drei Schuss in kurzer Folge. Schnelle Nachschüsse – aber jeder drückt die Bewertung.", real: "In Deutschland darf ein Jagd-Selbstlader nur 2 Patronen im Magazin haben (+1 im Lauf = 3 Schuss)." },
    { id: "dbl", name: "Merkel 140-2", short: "Merkel 140-2", type: "Doppelbüchse", cal: "9,3×74 R", model: "double", v0: 700, m: 0.015, lam: 1050, mag: 2, cyc: 0.3, rel: 3, zooms: [2, 4], maxR: 220, pen: 9, thru: 1, kick: 1.15, price: 9500, snd: "heavy",
      txt: "Zwei Läufe, zwei Schuss in 0,3 Sekunden. Das schwere Geschoss durchschlägt das Wild immer – der Ausschuss ist garantiert.", real: "Doppelbüchse im Kaliber 9,3×74 R: 15 g bei rund 700 m/s, etwa 3,7 kJ; klassische Waffe für Drückjagd und Dickhäuter." },
    { id: "cz375", name: "CZ 550 Magnum", short: "CZ 550", type: "Großwild-Repetierer", cal: ".375 H&H", model: "heavy", v0: 720, m: 0.0194, lam: 1000, mag: 4, cyc: 2.1, rel: 3.6, zooms: [2, 4, 6], maxR: 250, pen: 9, thru: 1, kick: 1.4, price: 3400, snd: "heavy",
      txt: "Das Großwild-Kaliber: 5 Kilojoule, das Geschoss geht immer durch. Langsam im Repetieren, mit heftigem Rückstoß.", real: ".375 Holland & Holland Magnum – Standard für Dickhäuter; 19,4 g bei rund 720 m/s ≈ 5 kJ." },
    { id: "r8wm", name: "Blaser R8 Ultimate", short: "R8 .300 WM", type: "Weitschuss-Repetierer", cal: ".300 Win Mag", model: "long", v0: 940, m: 0.0117, lam: 1500, mag: 3, cyc: 0.9, rel: 3, zooms: [6, 12, 18], maxR: 600, pen: 1.6, kick: 1.2, price: 6900, snd: "magnum",
      txt: "Sehr flache Flugbahn und große Vergrößerung für weite Schüsse – das Geschoss ist schneller am Ziel, du musst weniger vorhalten.", real: ".300 Winchester Magnum: 11,7 g mit rund 940 m/s, etwa 5,2 kJ; Preise der R8 bis ca. 8.100 €." },
    { id: "b525", name: "Browning B525 Sporter", short: "Browning B525", type: "Bockflinte", cal: "12/70", model: "shotgun", v0: 400, m: 0.032, lam: 90, mag: 2, cyc: 0.28, rel: 2.6, zooms: [1.5], maxR: 60, pellets: 24, cone: 0.0105, nearD: [11.5, 14], pen: 0.3, kick: 1.1, price: 2300, snd: "shotgun",
      txt: "Schrot streut: ideal für den Fasan im Flug, aber nur auf kurze Distanz. Für Hirsch und Keiler ist Schrot zu schwach.", real: "Fasan wird mit Schrot Nr. 5–7 bejagt, auf typisch 20–40 m; Normalpatronen 12/70 mit 740 bar, verstärkte mit 1050 bar." },
    { id: "g17", name: "Glock 17 Gen5", short: "Glock 17", type: "Pistole", cal: "9×19 mm", model: "pistol", v0: 360, m: 0.008, lam: 380, mag: 17, cyc: 0.17, rel: 1.9, zooms: [2], maxR: 60, nearD: [11.5, 14], pen: 0.3, kick: 0.35, price: 750, snd: "pistol",
      txt: "17 Schuss, fast ohne Pause: Mit dem Rotpunkt triffst du den Fasan in der Luft. Für Schalenwild fehlt ihr die Kraft.", real: "Standardkapazität 17 Patronen, Länge 202 mm, Lauf 114 mm; 8 g bei rund 360 m/s ≈ 0,5 kJ. In Deutschland ist sie für die Jagd nicht erlaubt (nur Fangschuss) – im Spiel nur fürs Training am Fasan." },
    { id: "rh454", name: "Ruger Super Redhawk", short: "Super Redhawk", type: "Revolver", cal: ".454 Casull", model: "revolver", v0: 500, m: 0.0194, lam: 520, mag: 6, cyc: 0.65, rel: 4.5, zooms: [2], maxR: 90, nearD: [11.5, 18], pen: 1, kick: 1.1, price: 1600, snd: "heavy",
      txt: "Der stärkste Handlauf: sechs Schuss, genug Wucht für Keiler und Hirsch – aber nur im Nahbereich.", real: ".454 Casull: rund 19,4 g bei 500 m/s ≈ 2,4 kJ; in den USA als Handfeuerwaffe für Hirsch und Schwarzwild üblich." },
    { id: "royal", name: "H&H Royal Deluxe „Goldjagd“", short: "Goldjagd", type: "Prunk-Doppelbüchse", cal: ".375 H&H Flanged", model: "royal", v0: 740, m: 0.0194, lam: 1100, mag: 2, cyc: 0.22, rel: 2.4, zooms: [2, 4, 8], maxR: 320, pen: 9, thru: 1, kick: 1, price: 0, special: 1, noMulti: 1, bonus: 0.08, snd: "heavy",
      txt: "Nur im Lucky-Rad zu gewinnen: handgravierte Doppelbüchse mit Goldbeschlägen. Immer Durchschuss, keine Abzüge für Nachschüsse und ein Plus bei der Bewertung.", real: "Holland & Holland ist seit 1835 für Luxus-Doppelbüchsen bekannt; die Royal Deluxe wird individuell graviert gefertigt." }
  ];
  const BY = {}; LIST.forEach(w => { BY[w.id] = w; });

  /* ----------------------------- Spielstand ---------------------------- */
  function G() { if (!S.farm) return null; if (!S.farm.guns) S.farm.guns = { own: { m18: 1 }, sel: "m18" }; return S.farm.guns; }
  const owns = id => { const g = G(); return !!(g && g.own[id]); };
  function cur() { const g = G(); return BY[g && g.own[g.sel] ? g.sel : "m18"]; }
  function list() { return LIST.filter(w => !w.special || owns(w.id)); }
  function owned() { return LIST.filter(w => owns(w.id)); }
  function select(id) { const g = G(); if (!g || !g.own[id]) return false; g.sel = id; if (typeof save === "function") save(); return true; }
  function grant(id) { const g = G(); if (!g || !BY[id] || g.own[id]) return false; g.own[id] = 1; if (typeof save === "function") save(); return true; }
  function buy(id) {
    const w = BY[id], g = G();
    if (!w || !g || g.own[id] || w.special) return "nein";
    if (S.money < w.price) return "geld";
    S.money -= w.price; S.expense = (S.expense || 0) + w.price;
    if (typeof logMoney === "function") logMoney("farm", "Waffe: " + w.name, -w.price);
    g.own[id] = 1; g.sel = id; if (typeof save === "function") save();
    return "ok";
  }
  /* ------------------------------- Physik ------------------------------ */
  const E0 = w => 0.5 * w.m * w.v0 * w.v0;
  const speed = (w, dm) => w.v0 * Math.exp(-dm / w.lam);
  const energy = (w, dm) => 0.5 * w.m * Math.pow(speed(w, dm), 2);
  /* Kann diese Waffe das Stück auf dm Meter töten? (Schrot nur Fasan, Rest nach Energie) */
  function canKill(w, k, dm) {
    if (dm > w.maxR) return false;
    if (w.pellets) return k === "fasan";
    return energy(w, dm) >= NEED[k];
  }
  /* ------------------------------ 3D-Modelle --------------------------- */
  const C = { steel: 0x3b4048, steelL: 0x7a8490, wood: 0x8a5634, woodD: 0x5a3822, poly: 0x2b2d31, gold: 0xe3b23c, goldD: 0xb5841c, black: 0x17181b, glass: 0x6aa7d8, brass: 0xc9a14a };
  const bx = (b, x, y, z, w, h, d, c, o) => b.box(w, h, d, c, Object.assign({ c: true, x, y, z }, o || {}));
  const tube = (b, x, y, z, len, r, c, r2) => b.cyl(r, r2 == null ? r : r2, len, 10, c, { x, y, z, rz: -Math.PI / 2 });
  /* v419: Wenige feste Flächen für Schaftkonturen, offene Bügel und vertiefte
     Mündungen. Keine laufende Simulation oder zusätzlichen WebGL-Kontexte. */
  function profile(b, p, d, c, z = 0) {
    const front = p.map(q => [q[0], q[1], z + d / 2]), back = p.map(q => [q[0], q[1], z - d / 2]);
    for (let i = 1; i < p.length - 1; i++) {
      b.tri(front[0], front[i], front[i + 1], c); b.tri(back[0], back[i + 1], back[i], c);
    }
    for (let i = 0; i < p.length; i++) { const j = (i + 1) % p.length; b.quad(front[i], back[i], back[j], front[j], c); }
  }
  function guard(b, x, y, w, h, c, twin = false) {
    const p = [[-.5, -.25], [-.33, -.5], [.33, -.5], [.5, -.25], [.5, .3], [.35, .5], [-.35, .5], [-.5, .3]];
    const at = (i, inner, z) => [x + p[i][0] * w * (inner ? .77 : 1), y + p[i][1] * h * (inner ? .65 : 1), z];
    for (let i = 0; i < p.length; i++) {
      const j = (i + 1) % p.length;
      b.quad(at(i, false, .008), at(j, false, .008), at(j, true, .008), at(i, true, .008), c);
      b.quad(at(j, false, -.008), at(i, false, -.008), at(i, true, -.008), at(j, true, -.008), c);
      b.quad(at(i, false, -.008), at(j, false, -.008), at(j, false, .008), at(i, false, .008), c);
      b.quad(at(i, true, .008), at(j, true, .008), at(j, true, -.008), at(i, true, -.008), c);
    }
    bx(b, x - w * .17, y + h * .1, 0, .007, h * .5, .008, C.steelL, { rz: -.22 });
    if (twin) bx(b, x + w * .12, y + h * .1, 0, .007, h * .45, .008, C.steelL, { rz: -.22 });
  }
  function muzzle(b, x, y, z, r, c) {
    const at = (a, xx, rr) => [xx, y + Math.cos(a) * rr, z + Math.sin(a) * rr];
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, n = (i + 1) * Math.PI / 6, ri = r * .55;
      b.quad(at(a, x - .025, r), at(n, x - .025, r), at(n, x, r), at(a, x, r), c);
      b.quad(at(a, x, r), at(n, x, r), at(n, x, ri), at(a, x, ri), C.steelL);
      b.quad(at(a, x, ri), at(n, x, ri), at(n, x - .016, ri), at(a, x - .016, ri), C.black);
      b.tri([x - .016, y, z], at(a, x - .016, ri), at(n, x - .016, ri), C.black);
    }
  }
  function scope(b, x, y, size = 1, col = C.black) {
    tube(b, x - .1 * size, y, 0, .27 * size, .013 * size, col);
    tube(b, x + .14 * size, y, 0, .07 * size, .013 * size, col, .024 * size);
    tube(b, x - .15 * size, y, 0, .055 * size, .02 * size, col, .013 * size);
    for (const dx of [-.04, .09]) {
      bx(b, x + dx * size, y - .024, 0, .025, .027, .025, C.steel);
      tube(b, x + (dx - .012) * size, y, 0, .024 * size, .016 * size, C.steelL);
    }
    /* Linsen liegen sichtbar an den Enden statt mitten im geschlossenen Tubus. */
    tube(b, x + .21 * size, y, 0, .002, .019 * size, C.glass);
    tube(b, x - .152 * size, y, 0, .002, .016 * size, C.glass);
    b.cyl(.014 * size, .014 * size, .017 * size, 8, col, { x, y: y + .01 * size });
  }
  function rifle(o) {
    const b = new G3.MB(), wood = o.poly ? C.poly : C.wood, woodD = o.poly ? 0x1d1e21 : C.woodD, len = o.len || 0.62;
    profile(b, [[-.6, -.05], [-.35, -.035], [-.22, .014], [-.28, .05], [-.59, .05]], .045, wood);
    bx(b, -.6, 0, 0, .023, .105, .048, woodD); bx(b, -0.2, -0.065, 0, 0.07, 0.11, 0.042, wood, { rz: -0.35 });
    bx(b, 0.13, -0.022, 0, 0.27, 0.05, 0.046, wood); bx(b, 0.13, -0.052, 0, 0.27, 0.01, 0.048, woodD);                /* Vorderschaft */
    bx(b, -0.1, 0.012, 0, 0.21, 0.05, 0.042, C.steel); bx(b, -0.1, 0.04, 0, 0.21, 0.008, 0.03, C.steelL);             /* Verschlusskasten */
    tube(b, 0.0, 0.012, 0, len, 0.0115, C.steel); muzzle(b, len + .025, .012, 0, o.brake ? .019 : .0145, C.steel);
    if (o.brake) for (const z of [-.018, .018]) bx(b, len + .008, .012, z, .01, .008, .003, C.black);
    bx(b, -.085, .018, .022, .087, .021, .003, C.black);                          /* Auswurffenster */
    bx(b, -.085, .009, .024, .079, .005, .003, C.steelL);
    if (o.auto) {
      bx(b, -.047, .02, .035, .026, .009, .027, C.steelL);                      /* Ladegriff am System; Gasmechanik im Vorderschaft */
    } else {
      if (o.straight) {
        bx(b, -.15, .025, .036, .035, .018, .036, C.steelL, { ry: -.3 });
        b.sphere(.014, 8, 6, C.poly, { x: -.143, y: .014, z: .06 });
      } else {
        b.cyl(.006, .006, .047, 8, C.steelL, { x: -.15, y: .024, z: .021, rx: Math.PI / 2 });
        b.sphere(.014, 8, 6, C.steelL, { x: -.15, y: .024, z: .068 });
      }
    }
    bx(b, -.045, -.044, 0, o.mag || .065, .045, .034, C.poly);                 /* Magazin vor dem Abzug */
    bx(b, -.045, -.069, 0, o.mag || .069, .008, .038, woodD);
    guard(b, -.138, -.043, .082, .06, C.steel);
    if (o.scope !== false) scope(b, -.02, .083, o.scopeS || 1);
    return b;
  }
  function double(o) {
    const b = new G3.MB(), gold = o.gold, wood = gold ? 0x6a3f24 : C.wood;
    profile(b, [[-.6, -.05], [-.35, -.035], [-.22, .012], [-.28, .05], [-.59, .05]], .05, wood);
    bx(b, -.6, 0, 0, .023, .105, .053, C.woodD); bx(b, -0.2, -0.06, 0, 0.065, 0.1, 0.044, wood, { rz: -0.3 });
    bx(b, 0.07, -0.026, 0, 0.17, 0.045, 0.062, wood);                                                                    /* kurzer Vorderschaft */
    bx(b, -0.1, 0.006, 0, 0.17, 0.06, 0.062, gold ? C.goldD : C.steel);                                                  /* Basküle */
    for (const z of [-0.02, 0.02]) { tube(b, -.02, .016, z, .62, .0135, C.steel); muzzle(b, .625, .016, z, .0155, C.steel); }
    bx(b, 0.3, 0.036, 0, 0.6, 0.008, 0.02, gold ? C.gold : C.steelL);                                                    /* Schiene */
    for (const z of [-0.034, 0.034]) b.box(0.13, 0.05, 0.006, gold ? C.gold : C.steelL, { c: true, x: -0.1, y: 0.006, z });  /* Seitenschlösser */
    guard(b, -.14, -.051, .09, .052, gold ? C.gold : C.steel, true);
    bx(b, .59, .049, 0, .012, .013, .008, C.brass);                          /* Korn an der Mündung */
    bx(b, -.13, .043, .01, .067, .009, .013, gold ? C.gold : C.steelL, { ry: -.2 });
    for (const z of [-.038, .038]) {
      b.cyl(.009, .009, .004, 8, C.steel, { x: -.031, y: -.003, z, rx: Math.PI / 2 });
      bx(b, -.027, .014, z, .004, .037, .002, C.black);                      /* Gelenk und Trennfuge */
      if (gold) for (let i = 0; i < 3; i++) bx(b, -.147 + i * .03, .006, z, .013, .022, .003, C.goldD, { rz: .6 });
    }
    if (o.scope) scope(b, -.02, .087, .8);
    return b;
  }
  function shotgun() {
    const b = new G3.MB();
    profile(b, [[-.7, -.055], [-.4, -.033], [-.29, .014], [-.34, .053], [-.69, .053]], .046, C.wood);
    bx(b, -.7, 0, 0, .023, .113, .05, C.woodD);
    bx(b, -0.26, -0.065, 0, 0.07, 0.11, 0.044, C.wood, { rz: -0.3 }); bx(b, 0.1, -0.03, 0, 0.3, 0.05, 0.06, C.wood);
    bx(b, -0.12, 0.0, 0, 0.18, 0.07, 0.056, C.steelL);                                                                    /* Basküle */
    tube(b, -0.04, 0.02, 0, 0.78, 0.0145, C.steel); tube(b, -0.04, -0.012, 0, 0.78, 0.0145, C.steel);                   /* Über-/Unterlauf */
    for (const y of [.02, -.012]) muzzle(b, .765, y, 0, .0155, C.steel);
    bx(b, 0.34, 0.036, 0, 0.74, 0.006, 0.014, C.steelL); b.sphere(0.007, 6, 4, C.brass, { x: 0.73, y: 0.042 });
    guard(b, -.191, -.059, .086, .052, C.steel);
    bx(b, -.15, .042, .01, .06, .01, .014, C.steel, { ry: -.2 });
    for (const z of [-.03, .03]) {
      b.cyl(.009, .009, .004, 8, C.steel, { x: -.041, y: -.006, z, rx: Math.PI / 2 });
      bx(b, -.033, .006, z, .004, .04, .002, C.black);
    }
    bx(b, .07, -.057, 0, .05, .004, .015, C.steelL);                       /* Vorderschaftverschluss */
    return b;
  }
  function pistol() {
    const b = new G3.MB();
    bx(b, .0075, .05, 0, .185, .036, .03, C.black);
    bx(b, .1125, .064, 0, .025, .008, .03, C.black);                       /* offene Schlittenfront um den Lauf */
    bx(b, .1125, .035, 0, .025, .006, .03, C.black);
    for (const z of [-.012, .012]) bx(b, .1125, .049, z, .025, .022, .006, C.black);
    bx(b, .02, .069, 0, .21, .004, .02, 0x30343a);
    bx(b, 0.0, 0.02, 0, 0.19, 0.023, 0.032, C.poly);
    tube(b, .1, .048, 0, .009, .0075, C.steel); muzzle(b, .126, .048, 0, .009, C.steel);
    /* v425: Griff nach hinten geneigt, voller Gen5-Griff ohne Fingerrillen. */
    profile(b, [[-.104,-.087],[-.043,-.087],[-.025,.019],[-.078,.026]], .034, C.poly);
    bx(b, -.074, -.091, 0, .067, .009, .036, C.black);
    guard(b, .025, -.019, .08, .059, C.poly);
    for (const z of [-.016, .016]) {
      for (let i = 0; i < 5; i++) bx(b, -.068 + i * .009, .05, z, .003, .026, .002, C.steel);
      profile(b, [[-.092,-.071],[-.052,-.071],[-.038,-.004],[-.078,.002]], .002, 0x34373b, z * 1.12);
      for (let i=0;i<4;i++) bx(b, .073+i*.009, .05, z, .002, .023, .0015, C.steel);
    }
    bx(b, .028, .057, .016, .036, .014, .002, C.steel);                     /* Patronenlager im Auswurffenster */
    bx(b, .028, .069, 0, .036, .002, .021, C.steel);
    bx(b, .018, .015, .019, .027, .005, .004, C.steel);                      /* Schlittenfang */
    bx(b, .118, .073, 0, .008, .005, .006, C.black); bx(b, -.07, .073, 0, .012, .005, .019, C.black);         /* Korn, Kimme */
    return b;
  }
  /* v444: Ruger Super Redhawk nach dem Original: massiver Edelstahlrahmen mit durchgehender oberer Brücke, kurze dicke Trommel,
     schwerer Lauf mit durchgehendem Unterlauf (verdeckt die Ausstoßerstange), Visierrampe vorn, verstellbares Kimmenblatt hinten,
     Hahn mit breitem Sporn, großer runder Abzugsbügel und schwarzer Gummigriff mit Fingerriefen; Zielfernrohr auf zwei Ringen. */
  function revolver() {
    const b = new G3.MB(), cy = .03, S1 = C.steelL, S2 = C.steel, BLK = C.black;
    /* Rahmen: obere Brücke, Rückwand, vorderer Rahmenteil mit Kranhalterung, Boden unter der Trommel */
    bx(b, -.03, .068, 0, .15, .026, .036, S1);
    bx(b, -.092, .022, 0, .05, .09, .036, S1);
    bx(b, .034, .03, 0, .028, .074, .036, S1);
    bx(b, -.03, -.01, 0, .1, .02, .034, S1);
    /* Trommel (sichtbar im Fenster): kurz, dick, glatt mit Rillen und sechs Kammern auf der Stirnseite */
    tube(b, -.022, cy, 0, .06, .0275, 0x9aa4ae);
    for (const x of [-.048, .004]) tube(b, x, cy, 0, .004, .0285, S2);               /* Trommelkanten */
    for (let i = 0; i < 6; i++) { const a2 = i * Math.PI / 3; tube(b, .009, cy + Math.cos(a2) * .016, Math.sin(a2) * .016, .002, .0066, BLK); }
    tube(b, .009, cy, 0, .002, .005, S2);
    /* Lauf: dick, oben bündig mit der Brücke; darunter der durchgehende Unterlauf bis zur Mündung */
    tube(b, .135, .062, 0, .2, .0185, S1);
    bx(b, .135, .0335, 0, .2, .034, .034, S1);
    bx(b, .135, .0155, 0, .2, .004, .03, S2);
    tube(b, .042, .06, 0, .018, .021, S2);                                  /* Laufübergang am Rahmen */
    muzzle(b, .236, .062, 0, .02, S1);
    bx(b, .12, .0815, 0, .18, .004, .009, S2);                              /* Laufschiene mit Visierkante */
    /* Visier: Rampe mit Korn, hinten verstellbares Kimmenblatt */
    bx(b, .214, .088, 0, .022, .013, .007, BLK, { rz: -.2 }); bx(b, .22, .0955, 0, .006, .006, .0045, 0xd8662b);
    bx(b, -.072, .089, 0, .018, .012, .022, BLK); bx(b, -.072, .0975, .0, .004, .005, .02, S2);
    /* Rahmenfenster, Auswurfseite und Trommelhaube */
    /* Hahn mit Sporn und Abzug */
    bx(b, -.117, .07, 0, .022, .018, .012, S2, { rz: .55 }); bx(b, -.128, .066, 0, .014, .008, .016, S2, { rz: .55 });
    bx(b, -.055, .0, 0, .006, .028, .006, S2, { rz: .25 });
    /* Abzugsbügel (rund, groß) */
    guard(b, -.045, -.028, .075, .064, S1);
    /* Griff: Gummigriff mit Rücken-Wölbung, Fingerriefen vorn, Kappe unten */
    profile(b, [[-.105, .036], [-.06, .036], [-.058, .0], [-.07, -.07], [-.088, -.128], [-.142, -.13], [-.136, -.07], [-.122, -.01]], .04, BLK);
    for (let i = 0; i < 3; i++) bx(b, -.0665 - i * .004, -.024 - i * .03, 0, .005, .013, .042, 0x2a2c31, { rz: .15 });   /* Fingerriefen */
    bx(b, -.115, -.131, 0, .06, .007, .046, S2);
    /* Zielfernrohr auf zwei Ringen (Rahmenfräsung) */
    scope(b, .05, .108, .5);
    return b;
  }
  const MODELS = {
    bolt: () => rifle({}), straight: () => rifle({ straight: 1, poly: 1 }), auto: () => rifle({ auto: 1, poly: 1, len: 0.58, scopeS: 0.85 }),
    heavy: () => rifle({ len: 0.58, brake: 1, mag: 0.09, scopeS: 0.8 }), long: () => rifle({ len: 0.72, brake: 1, poly: 1, straight: 1, scopeS: 1.25 }),
    double: () => double({ scope: 1 }), royal: () => double({ gold: 1 }), shotgun, pistol, revolver
  };
  const model = id => { const w = BY[id]; return MODELS[w.model](); };
  /* v419: Kurze Erklärung des sichtbaren Aufbaus; keine neuen Waffenwerte. */
  const BUILD = {
    bolt: ["Schaft · Zylinderverschluss · Lauf", "Der Kammergriff wird zum Repetieren gedreht und vor/zurück bewegt. Patronen kommen aus dem Magazin vor dem Abzug."],
    straight: ["Schaft · Geradezugverschluss · Lauf", "Der seitliche Kammergriff bewegt den Verschluss gerade vor und zurück. Das Magazin sitzt unter dem System."],
    auto: ["Schaft · Selbstladesystem · Lauf", "Gasdruck betätigt den Verschluss nach dem Schuss. Der seitliche Ladegriff dient zum manuellen Laden; das Magazin sitzt darunter."],
    heavy: ["Schaft · Zylinderverschluss · Lauf", "Der Kammergriff wird zum Repetieren gedreht und vor/zurück bewegt. Vorn am Lauf sitzt eine Mündungsbremse."],
    long: ["Schaft · Geradezugverschluss · langer Lauf", "Geradezugverschluss mit Magazin darunter. Das große Zielfernrohr sitzt über dem System, die Mündungsbremse am Laufende."],
    double: ["Schaft · Kipplaufgelenk · zwei Läufe nebeneinander", "Zum Laden kippt das Laufpaar am Gelenk nach unten. Jeder der beiden Abzüge gehört zu einem Lauf."],
    royal: ["Holzschaft · gravierte Basküle · zwei Läufe", "Zwei Läufe nebeneinander, mit je einem Abzug. Das Laufpaar klappt zum Laden nach unten; Goldbeschläge betonen das Gelenkgehäuse."],
    shotgun: ["Schaft · Kipplaufgelenk · zwei Läufe übereinander", "Der obere Hebel entriegelt das Laufpaar zum Abkippen und Laden. Der einzelne Abzug löst die Läufe nacheinander aus."],
    pistol: ["Schlitten & Lauf · Rahmen · Griffmagazin", "Der Schlitten bewegt sich beim Schuss zurück und wieder vor. Dabei wird eine neue Patrone aus dem Magazin im Griff zugeführt."],
    revolver: ["Hahn · Sechsschusstrommel · Unterlauf", "Die Trommel dreht jeweils die nächste Kammer hinter den Lauf. Der durchgehende Unterlauf verdeckt die Ausstoßerstange; die Visierung sitzt auf Rahmen und Lauf."]
  };
  /* ------------------------------- Shop -------------------------------- */
  const bar = (v, max) => `<i class="wp-bar"><b style="width:${Math.round(Math.max(4, Math.min(100, v / max * 100)))}%"></b></i>`;
  const fj = n => (n >= 1000 ? (n / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " kJ" : Math.round(n) + " J");
  function eignung(w) {
    /* v416: Dieselben Tiermodelle wie die Sammlung, als drei gecachte Bildchen. */
    const t = [["hirsch", "Hirsch"], ["keiler", "Keiler"], ["fasan", "Fasan"]], dm = Math.min(50, w.maxR);
    return t.map(([k, name]) => {
      const ok = canKill(w, k, dm), status = ok ? "geeignet" : "zu schwach";
      const img = typeof thumbSpan === "function" && typeof HUNT !== "undefined"
        ? thumbSpan("wp-animal416:" + k, () => HUNT._trophyBuild({ k, s: .6, m: 2, g: 416 }), "", false, { yaw: 1, pitch: .2, noShadow: true }) : "";
      return `<span class="wp-animal ${ok ? "ok" : "no"}" title="${name}: ${status}" aria-label="${name}: ${status}">${img}<small>${name}</small></span>`;
    }).join("");
  }
  function cardHTML(w) {
    const g = G(), mine = owns(w.id), sel = g.sel === w.id && mine;
    const compact = w.model === "pistol" || w.model === "revolver", build = BUILD[w.model];
    const img = typeof thumbSpan === "function" ? thumbSpan("wpn425:" + w.id, () => model(w.id), "🔫", false, { yaw: 1.16, pitch: .22, big: true, noShadow: true, outline: .0025 }) : "🔫";
    const act = sel ? `<button class="btn tiny" disabled>✔ Ausgerüstet</button>`
      : mine ? `<button class="btn tiny" data-wp="sel" data-id="${w.id}">Ausrüsten</button>`
      : w.special ? `<button class="btn tiny ghost" disabled>🎡 Nur im Lucky-Rad</button>`
      : `<button class="btn tiny${S.money < w.price ? " ghost" : ""}" data-wp="buy" data-id="${w.id}">Kaufen · ${money(w.price)}</button>`;
    const cyc = w.cyc < 1 ? w.cyc.toLocaleString("de-DE") + " s" : w.cyc.toLocaleString("de-DE") + " s";
    return `<div class="wp-card${sel ? " sel" : ""}${w.special ? " gold" : ""}" data-w="${w.id}">
      <div class="wp-preview${compact ? " compact" : ""}"><div class="wp-img" role="img" aria-label="${esc(w.name + ': ' + build[0])}">${img}</div><small>${esc(build[0])}</small></div>
      <div class="wp-main"><b>${esc(w.name)}</b><small>${esc(w.type)} · ${esc(w.cal)}</small>
        <p class="wp-build">${esc(build[1])}</p>
        <div class="wp-eig">${eignung(w)}</div>
        <div class="wp-st"><span>Wucht ${bar(E0(w), 6000)}<em>${fj(E0(w))}</em></span><span>Feuerfolge ${bar(1 / w.cyc, 6)}<em>${w.mag} Schuss · ${cyc}</em></span><span>Reichweite ${bar(w.maxR, 600)}<em>${w.maxR} m</em></span></div>
        <p>${esc(w.txt)}</p><p class="wp-real">ℹ️ ${esc(w.real)}</p>${act}</div></div>`;
  }
  function shop() {
    if (typeof openFarmSheet !== "function" || !G()) return;
    const items = list();
    FV.sheetFn = shop;
    openFarmSheet(`<div class="fs-h"><span class="fs-ic">🔫</span>Waffenschrank<small>${owned().length} von ${LIST.length} Waffen</small></div>
      <div class="fs-sub">Wähle für den Hochsitz die passende Waffe. Starke Büchsen erlegen Hirsch und Keiler, Schnellfeuerwaffen kosten bei Nachschüssen Bewertung, Flinte und Pistole sind für den Fasan im Flug – aber nur auf kurze Distanz. Eine Sonderwaffe gibt es nur im Lucky-Rad.</div>
      <div class="wp-list">${items.map(cardHTML).join("")}${LIST.filter(w => w.special && !owns(w.id)).map(w => `<div class="wp-card lock"><div class="wp-img">❓</div><div class="wp-main"><b>Sonderwaffe</b><small>Nur im Lucky-Rad</small><p>Eine ganz besondere Büchse wartet auf der Gewinnscheibe der Luckybox.</p></div></div>`).join("")}</div>`, "guns");
    document.querySelectorAll("#farmSheetIn [data-wp]").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (btn.dataset.wp === "sel") { select(id); if (typeof sfx === "function") sfx("tap"); }
        else {
          const r = buy(id);
          if (r === "geld") { if (typeof toast === "function") toast("Zu wenig Geld für diese Waffe.", "bad"); return; }
          if (r === "ok") { if (typeof sfx === "function") sfx("coin"); if (typeof toast === "function") toast("🔫 " + BY[id].name + " gekauft und ausgerüstet.", "ok"); if (typeof render === "function") render(); }
        }
        shop();
      };
    });
  }
  return { LIST, BY, NEED, owns, cur, list, owned, select, grant, buy, E0, energy, speed, canKill, model, shop, G };
})();
if (typeof module !== "undefined") module.exports = WEAPONS;
