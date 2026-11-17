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
  function scope(b, x, y, size, col) {
    tube(b, x - 0.1, y, 0, 0.3, 0.013 * size, col || C.black); tube(b, x + 0.17, y, 0, 0.06, 0.021 * size, col || C.black, 0.017 * size); tube(b, x - 0.14, y, 0, 0.05, 0.019 * size, col || C.black, 0.013 * size);
    bx(b, x - 0.03, y - 0.022, 0, 0.022, 0.026, 0.02, C.steelL); bx(b, x + 0.1, y - 0.022, 0, 0.022, 0.026, 0.02, C.steelL);
    b.sphere(0.011, 8, 6, C.glass, { x: x + 0.2, y, z: 0 });
  }
  function rifle(o) {
    const b = new G3.MB(), wood = o.poly ? C.poly : C.wood, woodD = o.poly ? 0x1d1e21 : C.woodD, len = o.len || 0.62;
    bx(b, -0.43, 0.0, 0, 0.34, 0.07, 0.042, wood); bx(b, -0.6, 0.005, 0, 0.04, 0.085, 0.045, woodD);                 /* Schaft und Schaftkappe */
    bx(b, -0.4, 0.04, 0, 0.3, 0.02, 0.04, wood); bx(b, -0.2, -0.065, 0, 0.07, 0.11, 0.042, wood, { rz: -0.35 });      /* Kamm und Pistolengriff */
    bx(b, 0.13, -0.022, 0, 0.27, 0.05, 0.046, wood); bx(b, 0.13, -0.052, 0, 0.27, 0.01, 0.048, woodD);                /* Vorderschaft */
    bx(b, -0.1, 0.012, 0, 0.21, 0.05, 0.042, C.steel); bx(b, -0.1, 0.04, 0, 0.21, 0.008, 0.03, C.steelL);             /* Verschlusskasten */
    tube(b, 0.0, 0.012, 0, len, 0.0115, C.steel); tube(b, len - 0.02, 0.012, 0, 0.045, o.brake ? 0.019 : 0.0145, C.steelL);
    if (o.auto) { tube(b, 0.05, -0.012, 0, 0.3, 0.007, C.steelL); bx(b, -0.04, 0.04, 0.024, 0.05, 0.02, 0.008, C.black); }
    if (o.straight) bx(b, -0.14, 0.032, 0, 0.028, 0.018, 0.014, C.black);
    else if (!o.auto) { b.cyl(0.006, 0.006, 0.06, 8, C.steelL, { x: -0.15, y: 0.026, z: 0.03, rx: Math.PI / 2 }); b.sphere(0.014, 8, 6, C.steelL, { x: -0.15, y: 0.026, z: 0.065 }); }
    bx(b, -0.09, -0.04, 0, o.mag || 0.075, 0.05, 0.03, C.poly);                                                           /* Magazin */
    bx(b, -0.14, -0.04, 0, 0.075, 0.005, 0.03, C.steel);                                                                 /* Abzugsbügel */
    if (o.scope !== false) scope(b, -0.02, 0.07, o.scopeS || 1);
    return b;
  }
  function double(o) {
    const b = new G3.MB(), gold = o.gold, wood = gold ? 0x6a3f24 : C.wood;
    bx(b, -0.43, 0.0, 0, 0.34, 0.07, 0.05, wood); bx(b, -0.6, 0.005, 0, 0.04, 0.085, 0.052, C.woodD);
    bx(b, -0.4, 0.04, 0, 0.3, 0.02, 0.046, wood); bx(b, -0.2, -0.06, 0, 0.065, 0.1, 0.044, wood, { rz: -0.3 });
    bx(b, 0.07, -0.026, 0, 0.17, 0.045, 0.062, wood);                                                                    /* kurzer Vorderschaft */
    bx(b, -0.1, 0.006, 0, 0.17, 0.06, 0.062, gold ? C.goldD : C.steel);                                                  /* Basküle */
    for (const z of [-0.02, 0.02]) { tube(b, -0.02, 0.016, z, 0.62, 0.0135, C.steel); tube(b, 0.58, 0.016, z, 0.02, 0.016, gold ? C.gold : C.steelL); }
    bx(b, 0.3, 0.036, 0, 0.6, 0.008, 0.02, gold ? C.gold : C.steelL);                                                    /* Schiene */
    for (const z of [-0.034, 0.034]) b.box(0.13, 0.05, 0.006, gold ? C.gold : C.steelL, { c: true, x: -0.1, y: 0.006, z });  /* Seitenschlösser */
    bx(b, -0.14, -0.034, 0, 0.07, 0.005, 0.03, gold ? C.gold : C.steel);
    bx(b, -0.02, 0.05, 0, 0.012, 0.012, 0.012, C.black);                                                                  /* Korn */
    if (o.scope) scope(b, -0.02, 0.07, 0.8);
    if (gold) for (let i = 0; i < 3; i++) bx(b, 0.12 + i * 0.16, 0.016, 0, 0.012, 0.062, 0.06, C.gold);
    return b;
  }
  function shotgun() {
    const b = new G3.MB();
    bx(b, -0.5, 0.0, 0, 0.38, 0.075, 0.044, C.wood); bx(b, -0.7, 0.005, 0, 0.04, 0.09, 0.046, C.woodD); bx(b, -0.46, 0.042, 0, 0.34, 0.02, 0.04, C.wood);
    bx(b, -0.26, -0.065, 0, 0.07, 0.11, 0.044, C.wood, { rz: -0.3 }); bx(b, 0.1, -0.03, 0, 0.3, 0.05, 0.06, C.wood);
    bx(b, -0.12, 0.0, 0, 0.18, 0.07, 0.056, C.steelL);                                                                    /* Basküle */
    tube(b, -0.04, 0.02, 0, 0.78, 0.0145, C.steel); tube(b, -0.04, -0.012, 0, 0.78, 0.0145, C.steel);                   /* Über-/Unterlauf */
    bx(b, 0.34, 0.036, 0, 0.74, 0.006, 0.014, C.steelL); b.sphere(0.007, 6, 4, C.brass, { x: 0.73, y: 0.042 });
    bx(b, -0.2, -0.038, 0, 0.07, 0.005, 0.03, C.steel);
    return b;
  }
  function pistol() {
    const b = new G3.MB();
    bx(b, 0.02, 0.05, 0, 0.21, 0.036, 0.03, C.black); bx(b, 0.02, 0.069, 0, 0.21, 0.004, 0.02, 0x30343a);                /* Schlitten */
    bx(b, 0.0, 0.02, 0, 0.19, 0.03, 0.032, C.poly); tube(b, 0.115, 0.048, 0, 0.03, 0.0075, C.steelL);                    /* Rahmen, Lauf */
    bx(b, -0.065, -0.04, 0, 0.05, 0.115, 0.034, C.poly, { rz: 0.2 }); bx(b, -0.085, -0.1, 0, 0.044, 0.012, 0.036, C.poly, { rz: 0.2 });
    bx(b, 0.03, 0.0, 0, 0.055, 0.004, 0.022, C.poly); bx(b, 0.012, 0.012, 0, 0.012, 0.03, 0.012, C.black, { rz: -0.2 });  /* Abzugsbügel, Abzug */
    bx(b, 0.118, 0.073, 0, 0.012, 0.012, 0.01, C.steelL); bx(b, -0.07, 0.073, 0, 0.018, 0.012, 0.02, C.steelL);         /* Korn, Kimme */
    return b;
  }
  function revolver() {
    const b = new G3.MB();
    bx(b, -0.04, 0.03, 0, 0.12, 0.07, 0.034, C.steelL); tube(b, -0.03, 0.04, 0, 0.075, 0.037, C.steel);                  /* Rahmen, Trommel */
    bx(b, 0.19, 0.045, 0, 0.3, 0.034, 0.03, C.steelL); tube(b, 0.04, 0.043, 0, 0.3, 0.012, C.steel);                    /* Laufmantel und Lauf */
    bx(b, -0.11, -0.03, 0, 0.055, 0.12, 0.04, C.wood, { rz: 0.28 }); bx(b, -0.0, -0.002, 0, 0.06, 0.004, 0.026, C.steel);
    bx(b, -0.07, 0.074, 0, 0.02, 0.012, 0.016, C.black); bx(b, 0.33, 0.066, 0, 0.012, 0.014, 0.01, C.black);
    scope(b, 0.05, 0.095, 0.55);
    return b;
  }
  const MODELS = {
    bolt: () => rifle({}), straight: () => rifle({ straight: 1, poly: 1 }), auto: () => rifle({ auto: 1, poly: 1, len: 0.58, scopeS: 0.85 }),
    heavy: () => rifle({ len: 0.58, brake: 1, mag: 0.09, scopeS: 0.8 }), long: () => rifle({ len: 0.72, brake: 1, poly: 1, straight: 1, scopeS: 1.25 }),
    double: () => double({ scope: 1 }), royal: () => double({ gold: 1 }), shotgun, pistol, revolver
  };
  const model = id => { const w = BY[id]; return MODELS[w.model](); };
  /* ------------------------------- Shop -------------------------------- */
  const bar = (v, max) => `<i class="wp-bar"><b style="width:${Math.round(Math.max(4, Math.min(100, v / max * 100)))}%"></b></i>`;
  const fj = n => (n >= 1000 ? (n / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " kJ" : Math.round(n) + " J");
  function eignung(w) {
    const t = [["hirsch", "🦌"], ["keiler", "🐗"], ["fasan", "🐦"]], dm = Math.min(50, w.maxR);
    return t.map(([k, ic]) => `<span class="${canKill(w, k, dm) ? "ok" : "no"}" title="${canKill(w, k, dm) ? "tödlich" : "zu schwach"}">${ic}</span>`).join("");
  }
  function cardHTML(w) {
    const g = G(), mine = owns(w.id), sel = g.sel === w.id && mine;
    const img = typeof thumbSpan === "function" ? thumbSpan("wpn383:" + w.id, () => model(w.id), "🔫", false, { yaw: 0.5, pitch: 0.18, noShadow: true }) : "🔫";
    const act = sel ? `<button class="btn tiny" disabled>✔ Ausgerüstet</button>`
      : mine ? `<button class="btn tiny" data-wp="sel" data-id="${w.id}">Ausrüsten</button>`
      : w.special ? `<button class="btn tiny ghost" disabled>🎡 Nur im Lucky-Rad</button>`
      : `<button class="btn tiny${S.money < w.price ? " ghost" : ""}" data-wp="buy" data-id="${w.id}">Kaufen · ${money(w.price)}</button>`;
    const cyc = w.cyc < 1 ? w.cyc.toLocaleString("de-DE") + " s" : w.cyc.toLocaleString("de-DE") + " s";
    return `<div class="wp-card${sel ? " sel" : ""}${w.special ? " gold" : ""}" data-w="${w.id}">
      <div class="wp-img">${img}</div>
      <div class="wp-main"><b>${esc(w.name)}</b><small>${esc(w.type)} · ${esc(w.cal)}</small>
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
