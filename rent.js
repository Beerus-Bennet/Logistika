/* ==========================================================================
   v182: Hütte am See – aufbauen und vermieten
   Auf der Freifläche westlich vom Glindower See steht eine verfallene Blockhütte. Mit Holz aus dem Sägewerk und Geld
   wird daraus eine zweistöckige, rustikale Hütte mit Veranda, die man vermietet:
   – Miete je Tag, jede Woche überwiesen (Mietminderung bei liegengebliebenen Problemen, Zurückhalten bei überfälliger
     Instandhaltung).
   – Alle 90 Tage ist eine Instandhaltung fällig; innerhalb dieser 90 Tage meldet der Mieter 1–2 Probleme (nie gleichzeitig),
     die man mit einem kleinen Betrag repariert.
   – Leben an der Hütte: abends Licht in den Fenstern (nachts aus), Rauch aus dem Kamin, der Mieter sitzt auf der Veranda
     oder läuft herum; an Werktagen fährt er morgens mit dem Auto los und parkt nachmittags wieder auf dem Erdfleck an der
     Straße. Ein Trampelpfad führt von der Hütte zur Straße; Pfad und Parkfleck werden mit der Zeit deutlicher.
   Spielstand: S.farm.rent. Angebunden in worldview.js (attach, pick, tagInfo, step, clear) und erbe.js (tick).
   ========================================================================== */
const RENT = (() => {
  /* ------------------------------ Daten ------------------------------------ */
  const LV = 18;                                                       /* ab Level */
  const COST = 9000;                                                   /* Baukosten in € */
  const NEED = { bauholz: 6, balken: 6, bretter: 8, dielen: 4, platten: 4, tueren: 2 };   /* Baumaterial (Gebinde) */
  const DAY = 1440, CYCLE = 90 * DAY;                                  /* Spielminuten */
  const RENT_DAY = 120;                                                /* Miete je Tag */
  const MAINT = 900;                                                   /* Instandhaltung alle 90 Tage */
  const ISSUES = {
    heizung: { n: "Heizung bleibt kalt",       i: "🔥", c: 180, t: "Die Heizung bleibt seit heute Morgen kalt – drinnen wird es richtig frisch." },
    wasser:  { n: "Wasserhahn tropft",          i: "🚰", c: 60,  t: "In der Küche tropft der Wasserhahn die ganze Nacht. Ich krieg kein Auge zu." },
    fenster: { n: "Fenster klemmt",             i: "🪟", c: 80,  t: "Das Schlafzimmerfenster oben klemmt und lässt sich nicht mehr richtig schließen." },
    dach:    { n: "Dach undicht",               i: "🏚️", c: 240, t: "Beim letzten Regen kam es oben durchs Dach – da steht jetzt ein Eimer." },
    strom:   { n: "Sicherung fliegt raus",      i: "💡", c: 120, t: "Ständig fliegt die Sicherung raus, sobald ich Wasser koche. Kannst du jemanden schicken?" },
    abfluss: { n: "Abfluss verstopft",          i: "🛁", c: 90,  t: "Der Abfluss in der Dusche ist verstopft, das Wasser läuft kaum noch ab." },
    tuer:    { n: "Haustür schließt nicht",     i: "🚪", c: 70,  t: "Die Haustür hat sich verzogen und schließt nicht mehr richtig." },
    maeuse:  { n: "Mäuse in der Speisekammer",  i: "🐭", c: 110, t: "In der Speisekammer sind Mäuse – die haben meine Haferflocken gefunden." }
  };
  const NAMES = ["Jonas Berger", "Mia Hoffmann", "Lukas Wendland", "Sophie Krause", "Tim Vogel", "Lea Schubert", "Felix Brandt", "Emma Lorenz"];
  const SHIRTS = [0x3f78c8, 0xc8553f, 0x4f8a4a, 0x8a5ab8, 0xd8a03a, 0x3a8a8a];
  const CARS = [0x3f78c8, 0xc23a32, 0xe4e4e0, 0x2f6b4a, 0x34363c, 0xd9a93a];

  /* ------------------------------ Lage ------------------------------------- */
  /* Hütte: Mitte H, Front (Veranda) zeigt nach +z, leicht zum See gedreht. Lokale Maße: Haus x ±2,6, z ±2,1; Veranda z 2,1–4,0 */
  const H = { x: -39, z: 31.5, ry: 0.3 };
  const HW = 2.6, HD = 2.1, DECK = 0.43, VZ = 4.0;
  const cs = Math.cos(H.ry), sn = Math.sin(H.ry);
  const Wp = (lx, lz) => [H.x + lx * cs + lz * sn, H.z - lx * sn + lz * cs];           /* lokal → Welt */
  const Lp = (x, z) => { const dx = x - H.x, dz = z - H.z; return [dx * cs - dz * sn, dx * sn + dz * cs]; };   /* Welt → lokal */
  const SIT_L = [-1.6, 3.12];                                          /* Sitzplatz auf der Bank (lokal) */
  const DOOR = Wp(0.5, 2.4), STEPS = Wp(0.5, 4.9), SIT = Wp(SIT_L[0], SIT_L[1]);
  const CHIMNEY = Wp(-HW - 0.35, -0.2);
  /* Plätze, an denen der Mieter steht und sich umschaut (vor und neben der Hütte, Blick zum See) */
  const SPOTS = [Wp(3.6, 6.4), Wp(-3.2, 6.8), Wp(4.4, 2.2), Wp(1.2, 8.6), Wp(6.4, 5.6)];
  /* Parkfleck an der Straße (Auto längs, Front nach +x) und Trampelpfad von den Stufen zur Straße */
  const CAR = { x: -46, z: 21.4 };
  const CARDOOR = [CAR.x - 0.2, CAR.z + 1.05];
  const PATH = [STEPS, Wp(-2.8, 4.85), Wp(-4.6, 3.5), Wp(-5.0, -0.6),     /* v192: Bogen enger an der Veranda – vorn liegt das Baumaterial */
                [-44.2, 27.6], [-43.2, 23.6], [-42.6, 21.0], [-42.4, 19.52]];
  const CAR_IN = [[-150, 19.1], [CAR.x - 7, 19.1], [CAR.x - 3.6, 19.5], [CAR.x - 1.6, 20.9], [CAR.x, 21.4]];
  const CAR_OUT = [[CAR.x, 21.4], [CAR.x + 1.8, 21.2], [CAR.x + 3.6, 20.0], [CAR.x + 5.8, 19.1], [100, 19.1]];

  /* Hier wachsen keine Kulissenbäume und Büsche: Hütte, Pfad, Parkfleck */
  function segD(x, z, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); }
  function clear(x, z) {
    if (Math.hypot(x - H.x, z - H.z) < 7.5) return true;
    for (let i = 1; i < PATH.length; i++) if (segD(x, z, PATH[i - 1], PATH[i]) < 1.9) return true;
    return Math.hypot((x - CAR.x) / 4.6, (z - CAR.z) / 2.8) < 1;
  }

  /* ---------------------------- Spielstand --------------------------------- */
  const unlocked = () => typeof farmAreaOpen === "function" && farmAreaOpen("see") && flv() >= LV;
  function st() {
    const F = typeof S !== "undefined" && S.farm;
    if (!F) return null;
    return F.rent || (F.rent = { built: 0, earned: 0, fixed: 0 });
  }
  const built = () => { const T = st(); return !!(T && T.built); };
  const missing = () => typeof siteMissing === "function" ? siteMissing("rent", NEED) : [];      /* v186: am Bauplatz Abgelegtes zählt mit */
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function newTenant() {
    const T = st(), used = T.ten ? T.ten.n : null, names = NAMES.filter(n => n !== used);
    return { n: names[rint(0, names.length - 1)], shirt: SHIRTS[rint(0, SHIRTS.length - 1)], pants: [0x3a4a5a, 0x4a3a2a, 0x2a2a30][rint(0, 2)],
      hair: [0x3a2a1a, 0x6a4a2a, 0xc9a050, 0x2a2a2a][rint(0, 3)], skin: [0xf2c9a0, 0xe0b088, 0xc68e64][rint(0, 2)], car: CARS[rint(0, CARS.length - 1)], seed: rint(1, 9999), wd: rint(0, 6) };
  }
  /* 1–2 Probleme je 90-Tage-Zyklus: das erste nach 8–45 Tagen, ein zweites mindestens 20 Tage später, spätestens am Tag 82 */
  function planIssues(c0) {
    const t1 = c0 + Math.round((8 + Math.random() * 37) * DAY), out = [t1];
    if (Math.random() < 0.5) { const t2 = Math.max(t1 + 20 * DAY, c0 + Math.round((50 + Math.random() * 28) * DAY)); if (t2 <= c0 + 82 * DAY) out.push(t2); }
    return out;
  }
  const maintDue = T => T.cs + CYCLE;
  /* Mietfaktor: überfällige Instandhaltung (> 7 Tage) → keine Miete; Problem länger als 2 Tage offen → halbe Miete */
  function rentF(T, now) {
    if (now > maintDue(T) + 7 * DAY) return 0;
    if (T.iss && now - T.iss.t0 > 2 * DAY) return 0.5;
    return 1;
  }

  /* --------------------------- Takt (erbe.js) ------------------------------ */
  function tick() {
    const T = st();
    if (!T) return;
    announce(T);
    if (!T.built) return;
    const now = S.time, d = Math.max(0, now - (T.lt == null ? now : T.lt));
    T.lt = now;
    if (!T.ten) { if (now >= T.moveIn) moveIn(T); return; }
    T.acc = (T.acc || 0) + RENT_DAY * d / DAY * rentF(T, now);
    for (let k = 0; k < 20 && now >= T.pay; k++) { payRent(T); T.pay += 7 * DAY; }
    if (now >= maintDue(T) && !T.mMsg) {
      T.mMsg = 1;
      phone({ from: "Lina Sturm", kind: "trouble", title: "Hütte am See: Instandhaltung fällig",
        body: "Chef, bei der Hütte am See steht die Instandhaltung an (alle 90 Tage, " + eur(MAINT) + "). Wenn sie länger als eine Woche liegen bleibt, hält " + T.ten.n + " die Miete zurück." });
    }
    if (!T.iss && T.plan && T.plan.length && now >= T.plan[0] && now < maintDue(T)) spawnIssue(T);
  }
  function phone(m) { if (typeof phoneMsg === "function") phoneMsg(Object.assign({ go: "rent", goLabel: "Zur Hütte" }, m)); }
  function moveIn(T) {
    const t = T.next || newTenant();
    T.next = null;
    T.ten = Object.assign(t, { since: S.time });
    T.cs = S.time; T.plan = planIssues(S.time); T.acc = 0; T.pay = S.time + 7 * DAY; T.mMsg = 0; T.iss = null;
    phone({ from: t.n, kind: "good", title: "Eingezogen in die Hütte am See",
      body: "Hallo! Ich bin heute in die Hütte am See eingezogen – traumhaft hier, mit Blick aufs Wasser. Die Miete (" + eur(RENT_DAY) + " am Tag) überweise ich jede Woche. Wenn etwas ist, melde ich mich. Viele Grüße, " + t.n });
    if (typeof save === "function") save();
  }
  function payRent(T) {
    const m = Math.round(T.acc || 0);
    T.acc = 0;
    if (m <= 0) { if (typeof toast === "function") toast("🏡 " + T.ten.n + " hält die Miete zurück – erst die Instandhaltung machen.", "warn"); return; }
    S.money += m; S.revenue += m;
    if (S.farm.stats) S.farm.stats.earned = (S.farm.stats.earned || 0) + m;
    T.earned = (T.earned || 0) + m;
    if (typeof logMoney === "function") logMoney("farm", "Miete Hütte am See", m);
    const full = Math.round(RENT_DAY * 7);
    if (typeof toast === "function") toast("🏡 Miete von " + T.ten.n + ": +" + eur(m) + (m < full - 1 ? " (gemindert)" : ""), "good");
  }
  function spawnIssue(T) {
    const keys = Object.keys(ISSUES).filter(k => k !== T.lastIss), k = keys[rint(0, keys.length - 1)], I = ISSUES[k];
    T.plan.shift();
    T.iss = { k, t0: S.time, c: Math.max(30, Math.round(I.c * (0.85 + Math.random() * 0.3) / 5) * 5) };
    T.lastIss = k;
    phone({ from: T.ten.n, kind: "trouble", title: I.i + " " + I.n, body: "„" + I.t + "“ Kannst du dich bitte darum kümmern? – " + T.ten.n });
    if (typeof save === "function") save();
  }
  function repair() {
    const T = st();
    if (!T || !T.iss) return false;
    const c = T.iss.c, I = ISSUES[T.iss.k];
    if (S.money < c) { toast("Dafür fehlt das Geld (" + eur(c) + ").", "warn"); return false; }
    S.money -= c; S.expense = (S.expense || 0) + c;
    if (typeof logMoney === "function") logMoney("farm", "Reparatur Hütte: " + I.n, -c);
    T.iss = null; T.fixed = (T.fixed || 0) + 1;
    if (typeof farmXP === "function") farmXP(10);
    toast(I.i + " Repariert – " + T.ten.n + " bedankt sich!", "good");
    save();
    return true;
  }
  const maintOpen = T => T.ten && S.time >= maintDue(T) - 10 * DAY;
  function maintain() {
    const T = st();
    if (!T || !maintOpen(T)) return false;
    if (S.money < MAINT) { toast("Dafür fehlt das Geld (" + eur(MAINT) + ").", "warn"); return false; }
    S.money -= MAINT; S.expense = (S.expense || 0) + MAINT;
    if (typeof logMoney === "function") logMoney("farm", "Instandhaltung Hütte am See", -MAINT);
    T.cs = S.time; T.plan = planIssues(S.time); T.mMsg = 0;
    if (typeof farmXP === "function") farmXP(30);
    toast("🔧 Instandhaltung erledigt – die nächste ist in 90 Tagen fällig.", "good");
    save();
    return true;
  }
  /* Freischaltung: einmal Bescheid von Nachbar Krüger */
  function announce(T) {
    if (T.ann || T.built || !unlocked()) return;
    T.ann = S.time;
    phone({ from: "Erwin Krüger", kind: "info", title: "Die alte Hütte am See", goLabel: "Zur Hütte",
      body: "Moin! Westlich vom See verfällt die alte Blockhütte, die zu deinem Hof gehört. Bau sie wieder auf – mit Holz aus dem Sägewerk – und vermiete sie. Leute aus der Stadt reißen sich um sowas am Wasser! Erwin" });
  }
  if (typeof MSG_GO !== "undefined") MSG_GO.rent = () => {
    if (typeof showTab === "function") showTab("farm");
    setTimeout(() => { if (!FV.R) return; if (typeof closeFarmSheet === "function") closeFarmSheet(); if (typeof farmFocusXZ === "function") farmFocusXZ(H.x + 2, H.z + 4, 24, 700); setTimeout(() => { if (FV.on) sheet(); }, 760); }, 250);
  };

  /* ------------------------------ Bauen ------------------------------------ */
  function buildCheck() {
    if (!unlocked()) return "Erst ab Level " + LV + ".";
    if (missing().length) return "Es fehlt noch Material.";
    if (S.money < COST) return "Dafür fehlt das Geld (" + eur(COST) + ").";
    return true;
  }
  function buildNow(q) {
    const T = st();
    if (T.built || buildCheck() !== true) return false;
    if (q != null) T.q = Math.round(Math.max(0, Math.min(1, q)) * 100);   /* v192: Bauqualität aus dem Nagel-Spiel (nur Anzeige) */
    siteTake("rent", NEED);
    S.money -= COST; S.expense = (S.expense || 0) + COST;
    if (typeof logMoney === "function") logMoney("farm", "Hütte am See aufgebaut", -COST);
    T.built = S.time; T.lt = S.time;
    T.next = newTenant();
    const d0 = Math.floor(S.time / DAY);
    T.moveIn = Math.max(S.time + 360, (d0 + 1) * DAY + 600);           /* am nächsten Tag um 10 Uhr, frühestens in 6 Stunden */
    W.grow = { t: 0 };
    syncWorld();
    if (FV.R) for (let i = 0; i < 5; i++) setTimeout(() => FV.R && FV.R.burst({ x: H.x, y: 0.5 + i * 1.1, z: H.z, n: 16, col: [[0.75, 0.62, 0.45, 1], [0.6, 0.5, 0.38, 1]], speed: 2.4, up: 1.6, size: 0.13, spread: 3.2, life: 1.1, shape: 1 }), i * 160);
    sfx("build"); setTimeout(() => sfx("build"), 300); setTimeout(() => sfx("level"), 900);
    if (typeof farmXP === "function") farmXP(150);
    if (typeof farmEvent === "function") farmEvent("build:rent");
    setTimeout(() => toast("🏡 Die Hütte steht! " + T.next.n + " zieht morgen um 10 Uhr ein.", "good"), 1100);
    save();
    return true;
  }

  /* ------------------------------ Modelle ---------------------------------- */
  const MB = () => new G3.MB();
  const rnd = () => G3.srand();
  const C = {
    log: 0x8a5a36, log2: 0x7b4f2f, logEnd: 0xc79c6a, board: 0x6e4a2e, batten: 0x58391f, roof: 0x4c3b33, roofD: 0x3b2e28,
    trim: 0xe6d8bf, shutter: 0x3f6b4a, door: 0x5a3a22, deck: 0xa8794a, deckD: 0x8a6038, post: 0x7a5232, stone: 0x8f8a80, stone2: 0xa39e94,
    glass: 0x3e5263, lit: 0xffd480, green: 0x5f8a3a, green2: 0x4e7a32
  };
  /* Fenster: Rahmen, Glas, Sprossen, Läden; ry dreht die Fensterebene (0 = Front +z). lit: nur die leuchtende Scheibe (eigenes Mesh) */
  function win(b, x, y, z, w, h, ry, o) {
    o = o || {};
    b.at({ x, y, z, ry }, () => {
      if (o.lit) {
        b.box(w - 0.04, h - 0.04, 0.02, C.lit, { y: 0.02, z: 0.05 });
        b.box(0.05, h - 0.02, 0.03, C.trim, { y: 0.01, z: 0.065 });
        b.box(w - 0.02, 0.05, 0.03, C.trim, { y: h / 2 - 0.025, z: 0.065 });
        return;
      }
      b.box(w + 0.16, h + 0.16, 0.06, C.trim, { y: -0.08 });
      b.box(w, h, 0.07, C.glass, { z: 0.012 });
      b.box(0.05, h - 0.01, 0.09, C.trim, { y: 0.005, z: 0.01 });
      b.box(w - 0.01, 0.05, 0.09, C.trim, { y: h / 2 - 0.025, z: 0.01 });
      b.box(w + 0.26, 0.06, 0.16, C.trim, { y: -0.12, z: 0.05 });
      if (o.shutter !== false) [-1, 1].forEach(s => {
        b.box(w * 0.5, h + 0.08, 0.05, C.shutter, { x: s * w * 0.8, y: -0.04, z: 0.02 });
        b.box(w * 0.42, 0.04, 0.06, 0x2f5238, { x: s * w * 0.8, y: h * 0.2, z: 0.03 });
        b.box(w * 0.42, 0.04, 0.06, 0x2f5238, { x: s * w * 0.8, y: h * 0.75, z: 0.03 });
      });
    });
  }
  /* Rundholz-Wand: Stämme liegen waagerecht, abwechselnd hell/dunkel; along = "x" oder "z" */
  function logRow(b, along, c, y, L, col, r) {
    if (along === "x") b.cyl(r, r, L, 8, col, { rz: Math.PI / 2, x: L / 2, y, z: c, top: C.logEnd });
    else b.cyl(r, r, L, 8, col, { rx: Math.PI / 2, z: -L / 2, y, x: c, top: C.logEnd });
  }
  function foundation(b) {
    b.noise(0.1, () => {
      b.box(HW * 2 + 0.3, 0.36, HD * 2 + 0.3, C.stone, {});
      for (let i = 0; i < 26; i++) {
        const t = i / 26, side = i % 4, u = (t * 4) % 1;
        const p = side === 0 ? [-HW + u * HW * 2, HD + 0.16] : side === 1 ? [HW + 0.16, -HD + u * HD * 2] : side === 2 ? [HW - u * HW * 2, -HD - 0.16] : [-HW - 0.16, HD - u * HD * 2];
        b.ico(0.13 + rnd() * 0.06, rnd() < 0.5 ? C.stone2 : C.stone, { x: p[0], y: 0.12 + rnd() * 0.1, z: p[1], flat: 0.5, jitter: 0.3 });
      }
    });
  }
  function chimney(b, top) {
    const cx = -HW - 0.35, cz = -0.2;
    b.noise(0.12, () => {
      for (let y = 0, k = 0; y < top; y += 0.32, k++) {
        const hh = Math.min(0.32, top - y);
        b.box(0.72, hh - 0.02, 0.86, k % 2 ? C.stone : C.stone2, { x: cx, y, z: cz });
        if (k % 2 === 0) b.box(0.3, hh - 0.04, 0.05, 0x6f6a62, { x: cx - 0.15, y: y + 0.02, z: cz + 0.44 });
      }
    });
    return [cx, cz];
  }
  /* Fertige Hütte (lokal: Front +z), ohne leuchtende Fenster */
  function hutMesh() {
    G3.seed(8201);
    const b = MB();
    foundation(b);
    /* Erdgeschoss: Rundholz, Ecken stehen über */
    b.noise(0.06, () => {
      for (let i = 0; i < 8; i++) {
        const y = 0.5 + i * 0.25, col = i % 2 ? C.log2 : C.log;
        logRow(b, "x", HD, y, HW * 2 + 0.4, col, 0.13); logRow(b, "x", -HD, y, HW * 2 + 0.4, col, 0.13);
        logRow(b, "z", HW, y + 0.125, HD * 2 + 0.4, i % 2 ? C.log : C.log2, 0.13); logRow(b, "z", -HW, y + 0.125, HD * 2 + 0.4, i % 2 ? C.log : C.log2, 0.13);
      }
      b.box(HW * 2 - 0.1, 2.1, HD * 2 - 0.1, C.log2, { y: 0.4 });              /* Füllung hinter den Stämmen */
    });
    /* Obergeschoss: Bretter mit Deckleisten */
    b.box(HW * 2 + 0.3, 0.12, HD * 2 + 0.3, C.batten, { y: 2.42 });
    b.noise(0.05, () => {
      b.box(HW * 2, 1.68, HD * 2, C.board, { y: 2.52 });
      for (let x = -HW + 0.2; x <= HW - 0.1; x += 0.42) [HD, -HD].forEach(z => b.box(0.06, 1.68, 0.05, C.batten, { x, y: 2.52, z: z + Math.sign(z) * 0.025 }));
      for (let z = -HD + 0.2; z <= HD - 0.1; z += 0.42) [HW, -HW].forEach(x => b.box(0.05, 1.68, 0.06, C.batten, { x: x + Math.sign(x) * 0.025, y: 2.52, z }));
    });
    /* Giebel vorn und hinten (Dachfirst längs z) */
    const top = 4.2, rise = 2.0, gc = G3.col(C.board);
    [HD, -HD].forEach(z => {
      const A = [-HW, top, z], B = [HW, top, z], P = [0, top + rise, z];
      b.triV(A, B, P, gc, gc, gc); b.triV(A, P, B, gc, gc, gc);
      for (let x = -HW + 0.3; x < HW - 0.2; x += 0.42) { const hh = rise * (1 - Math.abs(x) / HW) - 0.05; if (hh > 0.1) b.box(0.06, hh, 0.05, C.batten, { x, y: top, z: z + Math.sign(z) * 0.03 }); }
    });
    /* Dach: zwei steile Flächen mit Schindelreihen, Überstand an allen Seiten */
    const a = Math.atan2(rise, HW), L = Math.hypot(HW, rise) + 0.5, DZ = HD * 2 + 0.8;
    [1, -1].forEach(s => b.at({ y: top + rise + 0.04, rz: -s * a }, () => {
      b.box(L, 0.14, DZ, C.roof, { x: s * L / 2 });
      for (let k = 1; k * 0.32 < L; k++) b.box(0.07, 0.05, DZ, C.roofD, { x: s * k * 0.32, y: 0.13 });
    }));
    b.box(0.32, 0.14, DZ + 0.04, C.roofD, { y: top + rise - 0.02 });
    /* Fenster und Tür: Erdgeschoss vorn (unter der Veranda), Obergeschoss, Giebel, Seiten, hinten */
    win(b, -1.55, 1.1, HD + 0.08, 0.8, 0.85, 0); win(b, 2.0, 1.1, HD + 0.08, 0.7, 0.85, 0);
    win(b, -1.3, 2.85, HD + 0.08, 0.75, 0.9, 0); win(b, 1.3, 2.85, HD + 0.08, 0.75, 0.9, 0);
    win(b, 0, 4.55, HD + 0.08, 0.6, 0.6, 0, { shutter: false });
    win(b, 1.2, 1.1, -HD - 0.08, 0.8, 0.85, Math.PI); win(b, -1.0, 2.85, -HD - 0.08, 0.75, 0.9, Math.PI);
    win(b, HW + 0.08, 1.1, 0.6, 0.8, 0.85, Math.PI / 2); win(b, HW + 0.08, 2.85, -0.4, 0.75, 0.9, Math.PI / 2);
    win(b, -HW - 0.08, 2.85, 1.0, 0.75, 0.9, -Math.PI / 2);
    b.box(1.1, 1.9, 0.08, C.trim, { x: 0.5, y: 0.43, z: HD + 0.06 });
    b.noise(0.08, () => { for (let i = 0; i < 5; i++) b.box(0.17, 1.76, 0.06, C.door, { x: 0.5 - 0.36 + i * 0.18, y: 0.43, z: HD + 0.11 }); });
    b.box(0.06, 0.06, 0.06, 0xd8b050, { x: 0.82, y: 1.3, z: HD + 0.16 });
    /* Kamin an der linken Seite, über den First */
    chimney(b, top + rise + 0.7);
    b.box(0.86, 0.1, 1.0, 0x6f6a62, { x: -HW - 0.35, y: top + rise + 0.7, z: -0.2 });
    /* Veranda: Dielen, Unterbau, Pfosten, Geländer, Pultdach, Stufen */
    b.box(HW * 2 + 0.4, 0.36, VZ - HD, C.deckD, { y: 0, z: (HD + VZ) / 2 });
    b.noise(0.08, () => { for (let z = HD + 0.05; z < VZ; z += 0.24) b.box(HW * 2 + 0.4, 0.08, 0.22, C.deck, { y: 0.36, z: z + 0.11 }); });
    const posts = [-HW - 0.05, -0.15, 1.15, HW + 0.05];
    posts.forEach(x => { b.box(0.15, 1.02, 0.15, C.post, { x, y: DECK, z: VZ - 0.1 }); b.box(0.2, 0.06, 0.2, C.deckD, { x, y: DECK + 1.02, z: VZ - 0.1 }); });
    const rail = (x0, z0, x1, z1) => {
      const l = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      b.box(0.08, 0.07, l, C.post, { x: mx, y: DECK + 0.82, z: mz, ry }); b.box(0.06, 0.05, l, C.post, { x: mx, y: DECK + 0.14, z: mz, ry });
      for (let t = 0.11; t < l - 0.05; t += 0.22) b.box(0.05, 0.68, 0.05, C.deck, { x: x0 + (x1 - x0) * t / l, y: DECK + 0.14, z: z0 + (z1 - z0) * t / l });
    };
    rail(posts[0], VZ - 0.1, posts[1], VZ - 0.1); rail(posts[2], VZ - 0.1, posts[3], VZ - 0.1);
    rail(-HW - 0.05, HD + 0.15, -HW - 0.05, VZ - 0.1); rail(HW + 0.05, HD + 0.15, HW + 0.05, VZ - 0.1);
    /* schmales Vordach über Tür und Fenstern – die Veranda davor bleibt offen (von oben sieht man, wer dort sitzt) */
    b.at({ y: 2.62, z: HD + 0.05, rx: 0.32 }, () => {
      b.box(HW * 2 + 0.5, 0.09, 1.0, C.roof, { z: 0.5 });
      for (let z = 0.2; z < 0.95; z += 0.3) b.box(HW * 2 + 0.5, 0.04, 0.06, C.roofD, { y: 0.08, z });
    });
    [-2.0, -0.1, 1.15, 2.2].forEach(x => b.box(0.08, 0.08, 0.75, C.post, { x, y: 2.05, z: HD + 0.42, rx: -0.75 }));
    b.box(1.3, 0.15, 0.36, C.deckD, { x: 0.5, y: 0, z: VZ + 0.45 }); b.box(1.3, 0.29, 0.34, C.deckD, { x: 0.5, y: 0, z: VZ + 0.15 });
    b.box(1.3, 0.04, 0.36, C.deck, { x: 0.5, y: 0.15, z: VZ + 0.45 }); b.box(1.3, 0.04, 0.34, C.deck, { x: 0.5, y: 0.29, z: VZ + 0.15 });
    /* Bank vorn auf der offenen Veranda (Sitzhöhe für die Figur, Blick nach vorn), Tischchen, Blumenkübel, Laterne */
    const BZ = SIT_L[1] + 0.12;
    b.box(1.3, 0.06, 0.42, C.deck, { x: SIT_L[0], y: DECK + 0.38, z: BZ });
    b.box(1.3, 0.4, 0.06, C.deck, { x: SIT_L[0], y: DECK + 0.5, z: BZ - 0.22, rx: -0.15 });
    [SIT_L[0] - 0.55, SIT_L[0] + 0.55].forEach(x => b.box(0.07, 0.38, 0.36, C.deckD, { x, y: DECK, z: BZ }));
    b.box(0.5, 0.05, 0.5, C.deck, { x: -0.55, y: DECK + 0.48, z: BZ }); b.box(0.08, 0.48, 0.08, C.deckD, { x: -0.55, y: DECK, z: BZ });
    b.box(0.08, 0.12, 0.08, 0xf6f1e6, { x: -0.48, y: DECK + 0.53, z: BZ - 0.05 });
    [[2.1, VZ - 0.45], [2.45, HD + 0.45]].forEach(([x, z]) => { b.cyl(0.18, 0.14, 0.32, 8, 0xb8603a, { x, y: DECK, z }); b.ico(0.26, C.green, { x, y: DECK + 0.48, z, jitter: 0.35 }); });
    b.box(0.16, 0.24, 0.16, 0x2a2a2e, { x: 1.25, y: 1.95, z: HD + 0.14 });
    /* Brennholz an der rechten Seite unter einem Brettdach */
    b.noise(0.1, () => {
      for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) b.cyl(0.11, 0.11, 0.7, 7, k % 3 ? 0x9a6a40 : 0x86593a, { rx: 0, rz: Math.PI / 2, x: HW + 0.35 + 0.35, y: 0.13 + r * 0.21, z: -1.3 + k * 0.26 + (r % 2) * 0.12, top: 0xd8b07a });
    });
    b.box(0.9, 0.06, 2.8, C.roof, { x: HW + 0.62, y: 1.05, z: -0.15, rz: -0.25 });
    /* Regentonne an der hinteren Ecke */
    b.cyl(0.32, 0.3, 0.8, 10, 0x6b4a30, { x: HW + 0.45, z: -HD - 0.45 }); b.cyl(0.33, 0.33, 0.05, 10, 0x3a3a40, { x: HW + 0.45, y: 0.6, z: -HD - 0.45 });
    return b;
  }
  /* Leuchtende Fenster: f = 0 Erdgeschoss (+ Laterne), 1 Obergeschoss und Giebel */
  function litMesh(f) {
    const b = MB(), L = { lit: true };
    if (f === 0) {
      win(b, -1.55, 1.1, HD + 0.08, 0.8, 0.85, 0, L); win(b, 2.0, 1.1, HD + 0.08, 0.7, 0.85, 0, L);
      win(b, 1.2, 1.1, -HD - 0.08, 0.8, 0.85, Math.PI, L); win(b, HW + 0.08, 1.1, 0.6, 0.8, 0.85, Math.PI / 2, L);
      b.box(0.1, 0.14, 0.04, C.lit, { x: 1.25, y: 2.0, z: HD + 0.23 });
    } else {
      win(b, -1.3, 2.85, HD + 0.08, 0.75, 0.9, 0, L); win(b, 1.3, 2.85, HD + 0.08, 0.75, 0.9, 0, L);
      win(b, 0, 4.55, HD + 0.08, 0.6, 0.6, 0, L);
      win(b, -1.0, 2.85, -HD - 0.08, 0.75, 0.9, Math.PI, L); win(b, HW + 0.08, 2.85, -0.4, 0.75, 0.9, Math.PI / 2, L); win(b, -HW - 0.08, 2.85, 1.0, 0.75, 0.9, -Math.PI / 2, L);
    }
    return b;
  }
  /* ------------------- v192: Verfallene Hütte, nachvollziehbar gebaut -------------------
     Eine Blockhütte, die lange leer stand: Steinsockel, Bodenbalken mit Dielen, Rundholzwände mit verkämmten Ecken,
     Tür- und Fensteröffnungen mit Zargen, Dachstuhl (Firstbalken, Sparren) mit alten Dachbrettern. Die rechte vordere
     Ecke ist eingestürzt: dort fehlen die oberen Wandlagen, die Sparren sind abgebrochen, das Dach ist offen, die
     Stämme liegen darunter im Gras. Bauzustand (stage) nach dem echten Spielstand (abgelegtes Material, siehe phase()):
       0 verfallen – Schutt liegt, wo er hingefallen ist, Unkraut in der Hütte
       1 Baustelle eingerichtet – Schutt sortiert auf einem Ausschusshaufen, Unkraut weg, Sägebock und Werkzeugkiste
       2 gesichert, Dach in Arbeit – Stützen an der eingestürzten Wand, neue Sparren und Latten, Dachlücken mit neuen
         Brettern geschlossen, Leiter am Dach
     Lokal: Front (Tür, Veranda) +z. */
  const RW = { log: [0x8a5a36, 0x7b4f2f, 0x86644a, 0x7a6654, 0x6f5a48, 0x80583a], damp: 0x5c4532, end: [0xb8956a, 0xa89478, 0xc2a37a],
    roof: [0x6b5a4c, 0x5e4e42, 0x75624f, 0x544840, 0x6e5f52], fresh: 0xc49a64, fresh2: 0xd2a970, frame: 0x6a4a30, moss: 0x5f7f3a, moss2: 0x4f6e32,
    net: 0x4e5a48, float: 0xd8743a, metal: 0x4a4a50, rope: 0xc8b088, tool: 0x9a3b2e };
  /* Dreieck mit Normale nach oben (Wicklung prüfen, wie triUp in woodmodels.js) */
  const triUp = (b, A, B, Cc, ca, cb, cc) => { const k = (B[2] - A[2]) * (Cc[0] - A[0]) - (B[0] - A[0]) * (Cc[2] - A[2]); if (k > 0) b.triV(A, B, Cc, ca, cb, cc); else b.triV(A, Cc, B, ca, cc, cb); };
  const hh = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const pk = (arr, a, b) => arr[Math.floor(hh(a, b) * arr.length) % arr.length];
  /* Stamm von a0 bis a1 (along "x": Wand längs x bei z = c; "z": längs z bei x = c); brk: Bruchende (Splitter) an a0/a1 */
  function logSeg(b, along, c, y, a0, a1, col, end, brk) {
    const L = a1 - a0, r = 0.13;
    if (L < 0.05) return;
    if (along === "x") b.cyl(r, r, L, 8, col, { rz: Math.PI / 2, x: a1, y, z: c, top: end });
    else b.cyl(r, r, L, 8, col, { rx: Math.PI / 2, z: a0, y, x: c, top: end });
    (brk || []).forEach(k => {      /* Splitter: kurzer, spitz zulaufender Stummel am Bruchende */
      const at = k ? a1 : a0, d = k ? 1 : -1;
      if (along === "x") b.cyl(r * 0.85, r * 0.25, 0.16, 6, col, { rz: -d * Math.PI / 2, x: at, y, z: c + 0.02, top: end });
      else b.cyl(r * 0.85, r * 0.25, 0.16, 6, col, { rx: d * Math.PI / 2, z: at, y, x: c + 0.02, top: end });
    });
  }
  const LY = i => 0.5 + i * 0.25;                                       /* Höhe der Lage i (Wände längs x), längs z +0,125 */
  const RA = 0.55, EAVE = HW + 0.35, RIDGE = 2.5 + HW * Math.tan(RA), RL = EAVE / Math.cos(RA), DZR = HD * 2 + 0.7;
  function ruinMesh(stage) {
    G3.seed(8202);
    const b = MB(), E = HW + 0.2, Dd = HD + 0.2;
    foundation(b);
    /* feuchter, dunklerer Sockelrand mit Moos auf der Schattenseite (hinten) */
    b.noise(0.1, () => { for (let k = 0; k < 7; k++) b.ico(0.16 + hh(k, 1) * 0.08, k % 2 ? RW.moss : RW.moss2, { x: -2.3 + k * 0.75, y: 0.3, z: -HD - 0.24, flat: 0.35, jitter: 0.3 }); });
    /* Boden: dunkler Unterboden, Bodenbalken, Dielen (rechts vorn verrottet) */
    b.box(HW * 2 - 0.05, 0.01, HD * 2 - 0.05, 0x3e3226, { y: 0.362 });
    for (let z = -HD + 0.3; z < HD; z += 0.6) b.box(HW * 2 - 0.1, 0.1, 0.11, 0x5a4330, { y: 0.37, z });
    b.noise(0.1, () => {
      for (let x = -HW + 0.17, i = 0; x < HW - 0.1; x += 0.28, i++) {
        const col = pk([0x8a6e50, 0x7d644a, 0x94785a], i, 3);
        if (x > 1.25) b.box(0.25, 0.05, HD + 0.2 - hh(i, 4) * 0.5, col, { x, y: 0.47, z: -HD / 2 - 0.1 - 0.25 + hh(i, 4) * 0.25 });   /* vorn weggefault */
        else if (i === 6 || i === 11) b.box(0.25, 0.05, HD * 0.9, col, { x, y: 0.47, z: -HD * 0.5 });                           /* einzelne fehlen halb */
        else b.box(0.25, 0.05, HD * 2 - 0.1, col, { x, y: 0.47 });
      }
    });
    /* ------------------------- Wände (Rundholz) ------------------------- */
    b.noise(0.07, () => {
      for (let i = 0; i < 8; i++) {
        const y = LY(i), cA = i === 0 ? RW.damp : pk(RW.log, i, 1), cB = i === 0 ? RW.damp : pk(RW.log, i, 2), cC = i === 0 ? RW.damp : pk(RW.log, i, 5), eA = pk(RW.end, i, 1);
        /* Rückwand: ganz, Fenster (vernagelt) in den Lagen 3–5 */
        if (i >= 3 && i <= 5) { logSeg(b, "x", -HD, y, -E, 0.75, cA, eA); logSeg(b, "x", -HD, y, 1.65, E, cA, eA); }
        else logSeg(b, "x", -HD, y, -E, E, cA, eA);
        /* Front: Tür (−0,05…1,05) bis Lage 6, Fenster (−2,05…−1,05) Lagen 3–5; rechts ab Lage 5 eingestürzt */
        const door = i <= 6, wnd = i >= 3 && i <= 5;
        if (i < 7) {
          logSeg(b, "x", HD, y, -E, wnd ? -2.05 : -0.05, cB, eA);
          if (wnd) logSeg(b, "x", HD, y, -1.05, -0.05, cB, eA);
          if (i <= 4) logSeg(b, "x", HD, y, 1.05, E, cB, eA);
        } else logSeg(b, "x", HD, y, -E, 1.35, cB, eA, [1]);      /* Sturz über der Tür, rechts abgebrochen */
        if (door && i > 4) { /* nichts rechts der Tür */ }
        /* linke Wand ganz (Kamin außen), rechte Wand ab Lage 5 vorn weggebrochen (gestuft) */
        logSeg(b, "z", -HW, y + 0.125, -Dd, Dd, cC, eA);
        if (i <= 4) logSeg(b, "z", HW, y + 0.125, -Dd, Dd, cC, eA);
        else logSeg(b, "z", HW, y + 0.125, -Dd, [-0.3, -0.65, -1.05][i - 5], cC, eA, [1]);
      }
    });
    /* Moos an der untersten Lage hinten und links (Schattenseite) */
    [[-1.6, -HD - 0.12, 0], [0.4, -HD - 0.12, 0], [2.0, -HD - 0.12, 0], [-HW - 0.12, -1.2, 1], [-HW - 0.12, 0.9, 1]].forEach(([x, z], k) => b.ico(0.12, k % 2 ? RW.moss : RW.moss2, { x, y: 0.6, z, flat: 0.45, jitter: 0.3 }));
    /* Zargen: Tür und Fenster, alte Nägel, Tür hängt schief offen */
    [-0.1, 1.1].forEach(x => b.box(0.1, 1.76, 0.34, RW.frame, { x, y: 0.37, z: HD }));
    b.box(1.3, 0.1, 0.34, RW.frame, { x: 0.5, y: 2.12, z: HD });
    [-2.1, -1.0].forEach(x => b.box(0.08, 0.78, 0.32, RW.frame, { x, y: 1.14, z: HD }));
    b.box(1.18, 0.08, 0.4, RW.frame, { x: -1.55, y: 1.08, z: HD + 0.03 }); b.box(1.18, 0.07, 0.32, RW.frame, { x: -1.55, y: 1.9, z: HD });
    b.box(0.95, 0.05, 0.03, 0x5a6a72, { x: -1.55, y: 1.2, z: HD - 0.05, rz: 0.5 });                  /* Rest der Scheibe */
    b.at({ x: -0.06, y: 0.42, z: HD + 0.17, ry: 1.15 }, m => {                                          /* Tür, an einer Angel offen */
      m.noise(0.08, () => { for (let k = 0; k < 4; k++) m.box(0.26, 1.62, 0.05, pk([0x6a4a2e, 0x5e4430, 0x735238], k, 9), { x: 0.14 + k * 0.27, rz: k === 3 ? 0.03 : 0 }); });
      m.box(1.06, 0.08, 0.06, 0x553a24, { x: 0.53, y: 0.3, z: 0.04 }); m.box(1.06, 0.08, 0.06, 0x553a24, { x: 0.53, y: 1.2, z: 0.04 });
    });
    /* hinten: Fenster mit zwei Brettern über Kreuz vernagelt */
    [0.7, 1.7].forEach(x => b.box(0.08, 0.78, 0.32, RW.frame, { x, y: 1.14, z: -HD }));
    [0.55, -0.55].forEach(r => b.box(1.15, 0.14, 0.04, 0x7a6450, { x: 1.2, y: 1.5, z: -HD - 0.19, rz: r }));
    [[0.75, 1.75], [1.62, 1.75], [0.75, 1.24], [1.62, 1.24]].forEach(([x, y]) => b.box(0.03, 0.03, 0.03, RW.metal, { x, y, z: -HD - 0.22 }));
    /* ------------------------- Dachstuhl und Dach ------------------------- */
    const Ns = 8, zr = k => -DZR / 2 + 0.15 + k * (DZR - 0.3) / (Ns - 1);
    b.box(0.17, 0.17, DZR, 0x6a4c34, { y: RIDGE - 0.2 });                                              /* Firstbalken */
    b.box(0.14, RIDGE - 2.4, 0.14, RW.frame, { x: -0.6, y: 2.38, z: HD - 0.05 });                       /* Stiel unter dem First vorn (links der Tür) */
    b.box(0.12, 0.12, 1.0, RW.frame, { x: -0.3, y: RIDGE - 0.32, z: HD - 0.05, ry: Math.PI / 2 });
    const slope = (s, fn) => b.at({ y: RIDGE, rz: -s * RA }, fn);
    for (let k = 0; k < Ns; k++) {
      const z = zr(k);
      slope(-1, m => m.box(RL, 0.14, 0.1, 0x6e5038, { x: -RL / 2, y: -0.14, z }));                     /* links: alle Sparren */
      const broken = z > 0.1;                                                                             /* rechts vorn eingestürzt */
      if (!broken) slope(1, m => m.box(RL, 0.14, 0.1, 0x6e5038, { x: RL / 2, y: -0.14, z }));
      else if (stage >= 2) slope(1, m => m.box(RL, 0.14, 0.1, RW.fresh, { x: RL / 2, y: -0.14, z }));     /* neue Sparren */
      else { const l = RL * (0.25 + 0.2 * hh(k, 8)); slope(1, m => { m.box(l, 0.14, 0.1, 0x6e5038, { x: l / 2, y: -0.14, z }); m.cyl(0.05, 0.015, 0.14, 5, 0x6e5038, { rz: -Math.PI / 2, x: l, y: -0.07, z }); }); }
    }
    /* Giebel: hinten senkrechte Bretter (zwei fehlen), vorn nur links */
    const gable = (z, xmin, xmax, skip) => {
      for (let x = -HW + 0.15, i = 0; x < HW - 0.05; x += 0.3, i++) {
        if (x < xmin || x > xmax || skip.includes(i)) continue;
        const h = (EAVE - Math.abs(x) - 0.35) * Math.tan(RA) + 0.1;
        if (h > 0.12) b.box(0.27, h, 0.05, pk(RW.roof, i, z > 0 ? 6 : 7), { x, y: 2.4, z: z + Math.sign(z) * 0.18 });
      }
    };
    gable(-HD, -9, 9, [3, 12]); gable(HD, -9, -0.75, [2]);
    /* Dachbretter längs z: links fast geschlossen (Lücken), rechts nur hinten, Bruchkante unregelmäßig */
    b.noise(0.08, () => {
      for (let u = 0.12, i = 0; u < RL + 0.05; u += 0.27, i++) {
        const cL = pk(RW.roof, i, 11), cR = pk(RW.roof, i, 12);
        const gapL = i === 4 || i === 8, halfL = i === 6;
        if (gapL && stage >= 2) slope(-1, m => m.box(0.25, 0.05, DZR, RW.fresh2, { x: -u }));
        else if (!gapL && !halfL) slope(-1, m => m.box(0.25, 0.05, DZR, cL, { x: -u }));
        else if (halfL) slope(-1, m => m.box(0.25, 0.05, DZR * 0.55, cL, { x: -u, z: -DZR * 0.225 }));
        const zEnd = -0.25 - hh(i, 13) * 0.55, L = zEnd + DZR / 2;
        if (i !== 5) slope(1, m => m.box(0.25, 0.05, L, cR, { x: u, z: -DZR / 2 + L / 2 }));
        if (stage >= 2 && i % 2 === 0) slope(1, m => m.box(0.06, 0.04, DZR / 2 - zEnd, RW.fresh2, { x: u, z: zEnd + (DZR / 2 - zEnd) / 2 }));   /* neue Latten */
      }
      /* alte Nägel in Reihen über den Sparren (links) */
      for (let k = 0; k < Ns; k += 2) for (let u = 0.3; u < RL; u += 0.54) slope(-1, m => m.box(0.03, 0.02, 0.03, RW.metal, { x: -u, y: 0.05, z: zr(k) }));
      /* Moos am unteren Rand der Schattenseite */
      [[-RL + 0.25, -1.6], [-RL + 0.3, -0.4], [-RL + 0.55, -2.0]].forEach(([u, z], k) => slope(-1, m => m.ico(0.14, k % 2 ? RW.moss : RW.moss2, { x: u, y: 0.04, z, flat: 0.3, jitter: 0.3 })));
    });
    chimney(b, 4.5);
    b.box(0.86, 0.1, 1.0, 0x6f6a62, { x: -HW - 0.35, y: 4.5, z: -0.2 });
    /* ------------------------- Veranda (Reste) ------------------------- */
    b.box(HW * 2 + 0.4, 0.3, 0.16, 0x6e5034, { y: 0, z: VZ - 0.1 }); b.box(0.16, 0.3, VZ - HD, 0x6e5034, { x: -HW, y: 0, z: (HD + VZ) / 2 });
    [-2.3, -1.2, -0.1, 1.0, 2.1].forEach(x => b.box(0.12, 0.26, VZ - HD - 0.1, 0x5e4430, { x, y: 0.04, z: (HD + VZ) / 2 }));
    b.noise(0.08, () => {
      [[0, 1, 0], [1, 1, 0], [2, 0.6, -1.1], [4, 0.75, 0.6], [5, 1, 0], [7, 0.45, -1.5]].forEach(([k, f, dx]) => {
        const Lb = (HW * 2 + 0.3) * f; b.box(Lb, 0.06, 0.22, pk([0x9a7a58, 0x8a6e50, 0xa08060], k, 14), { x: dx, y: 0.32, z: HD + 0.17 + k * 0.24 });
      });
    });
    b.box(0.15, 1.45, 0.15, 0x6e5034, { x: -HW - 0.05, y: 0.3, z: VZ - 0.1 });
    b.box(0.15, 0.62, 0.15, 0x6e5034, { x: -0.15, y: 0.3, z: VZ - 0.1 }); b.cyl(0.07, 0.02, 0.12, 5, 0x6e5034, { x: -0.15, y: 0.92, z: VZ - 0.1 });
    b.box(1.3, 0.07, 0.07, 0x6e5034, { x: -HW + 0.6, y: 1.2, z: VZ - 0.1, rz: -0.05 });
    b.box(1.3, 0.28, 0.34, 0x5e4430, { x: 0.5, y: 0, z: VZ + 0.18 }); b.box(1.3, 0.04, 0.34, 0x9a7a58, { x: 0.5, y: 0.28, z: VZ + 0.18 });
    /* --------------------- Fischerei: was vom alten Fischer blieb --------------------- */
    /* Netz an zwei Nägeln neben der Tür, hängt durch, mit Korkschwimmern */
    const NX0 = -0.95, NX1 = -0.25, NY = 1.92, NZ = HD + 0.17;
    for (let r = 0; r < 6; r++) { const y = NY - r * 0.16, sag = 0.1 * (1 - r / 6); b.box(NX1 - NX0 - r * 0.05, 0.015, 0.015, RW.net, { x: (NX0 + NX1) / 2, y: y - sag, z: NZ }); }
    for (let c = 0; c < 6; c++) { const x = NX0 + c * (NX1 - NX0) / 5; b.box(0.015, 0.85 - Math.abs(c - 2.5) * 0.05, 0.015, RW.net, { x: x + (c - 2.5) * 0.012, y: NY - 0.9 + Math.abs(c - 2.5) * 0.05, z: NZ }); }
    for (let c = 0; c < 4; c++) b.ico(0.04, RW.float, { x: NX0 + 0.08 + c * 0.18, y: NY - 0.02, z: NZ + 0.02 });
    [NX0, NX1].forEach(x => b.box(0.03, 0.03, 0.06, RW.metal, { x, y: NY, z: NZ - 0.02 }));
    /* Laterne am Haken links der Tür (aus) */
    b.box(0.03, 0.03, 0.18, RW.metal, { x: -0.22 + 0.13, y: 1.95, z: HD + 0.22 });
    b.box(0.13, 0.18, 0.13, RW.metal, { x: -0.09, y: 1.68, z: HD + 0.3 }); b.box(0.1, 0.12, 0.1, 0x9aa8a0, { x: -0.09, y: 1.71, z: HD + 0.3 });
    /* alte Angel lehnt rechts der Tür, Kiste mit Seil und Eimer auf der Veranda, Fass an der Ecke */
    b.box(0.035, 2.3, 0.035, 0x5a4030, { x: 1.55, y: 0.36, z: HD + 0.25, rz: -0.18 }); b.cyl(0.06, 0.06, 0.05, 8, RW.metal, { x: 1.62, y: 0.75, z: HD + 0.3, rx: Math.PI / 2 });
    b.noise(0.1, () => { for (let k = 0; k < 3; k++) b.box(0.62, 0.11, 0.42, pk([0x8a6a44, 0x7d5f3c], k, 15), { x: -2.1, y: 0.35 + k * 0.12, z: 3.3 }); });
    for (let k = 0; k < 3; k++) b.cyl(0.18 - k * 0.015, 0.18 - k * 0.015, 0.04, 10, k % 2 ? 0xb39a72 : RW.rope, { x: -2.1, y: 0.71 + k * 0.04, z: 3.3 });
    b.cyl(0.17, 0.14, 0.32, 9, 0x7a5a38, { x: -1.45, y: 0.35, z: 3.45 }); b.cyl(0.175, 0.175, 0.03, 9, RW.metal, { x: -1.45, y: 0.6, z: 3.45 }); b.cyl(0.155, 0.155, 0.03, 9, RW.metal, { x: -1.45, y: 0.41, z: 3.45 });
    b.cyl(0.3, 0.28, 0.78, 10, 0x6b4a30, { x: -HW - 0.55, z: 1.7 }); [0.12, 0.62].forEach(y => b.cyl(0.31, 0.31, 0.04, 10, RW.metal, { x: -HW - 0.55, y, z: 1.7 }));
    /* ------------------------- Schutt / Baustelle ------------------------- */
    if (stage === 0) {
      /* die Stämme der eingestürzten Ecke liegen darunter im Gras, die Dachbretter daneben und drinnen */
      [[HW + 0.6, 0.6, 0.12], [HW + 1.0, 1.25, -0.2], [HW + 0.75, 1.0, 0.05, 0.26]].forEach(([x, z, ry, y]) => b.cyl(0.13, 0.13, 2.0, 8, pk(RW.log, x * 10, z * 10), { rx: Math.PI / 2, x, y: y || 0.13, z: z - 1.0, ry, top: RW.end[0] }));
      [[HW + 1.5, 2.3, 0.4], [HW + 0.4, 2.7, 1.2], [1.8, 1.0, 0.6, 0.53]].forEach(([x, z, ry, y]) => b.box(0.25, 0.05, 1.5, pk(RW.roof, x, z), { x, y: y || 0.05, z, ry, rx: y ? 0.18 : 0 }));
      /* Unkraut in der Hütte (wo die Dielen fehlen), am Sockel und ein junger Strauch in der Ecke */
      [[1.7, 0.9, 0.22], [2.2, 1.6, 0.18], [1.5, 1.7, 0.16], [2.1, 0.3, 0.2]].forEach(([x, z, r]) => b.ico(r, C.green, { x, y: 0.4, z, flat: 0.7, jitter: 0.4 }));
      b.ico(0.5, C.green2, { x: 1.95, y: 0.7, z: 1.2, jitter: 0.4 }); b.ico(0.34, C.green, { x: 2.15, y: 1.05, z: 1.5, jitter: 0.4 });
    } else {
      /* Ausschuss: Stämme und kaputte Bretter sortiert hinten rechts, auf zwei Kanthölzern */
      const SX = HW + 1.6, SZ = -2.5;
      [-0.6, 0.6].forEach(dz => b.box(1.0, 0.08, 0.1, 0x6a5038, { x: SX, z: SZ + dz }));
      [-0.14, 0.14].forEach((dx, k) => b.cyl(0.13, 0.13, 1.9, 8, pk(RW.log, k, 20), { rx: Math.PI / 2, x: SX + dx, y: 0.21, z: SZ - 0.95, top: RW.end[1] }));
      b.cyl(0.13, 0.13, 1.7, 8, pk(RW.log, 3, 20), { rx: Math.PI / 2, x: SX, y: 0.44, z: SZ - 0.8, top: RW.end[1] });
      [[0.42, 0.06], [0.52, -0.1], [0.62, 0.12]].forEach(([y, r], k) => b.box(0.25, 0.05, 1.2 - k * 0.2, pk(RW.roof, k, 21), { x: SX - 0.05 + k * 0.05, y: y + 0.17, z: SZ + 0.1, ry: r }));
      /* Arbeitsplatz rechts vor der Hütte: Sägebock mit Brett, Werkzeugkiste */
      const WX = HW + 1.35, WZ = 2.7;
      [-0.45, 0.45].forEach(dz => { [-0.32, 0.32].forEach(r => b.box(0.07, 0.75, 0.07, 0x8a6a44, { x: WX, z: WZ + dz, rx: 0, rz: r })); });
      b.box(0.12, 0.1, 1.1, 0x9a7a52, { x: WX, y: 0.68, z: WZ });
      b.box(0.25, 0.05, 1.6, RW.fresh, { x: WX, y: 0.79, z: WZ + 0.1, ry: 0.06 });
      b.box(0.5, 0.24, 0.28, RW.tool, { x: WX + 0.2, y: 0, z: WZ + 1.15, ry: 0.3 }); b.box(0.38, 0.06, 0.04, 0x2a2a2e, { x: WX + 0.2, y: 0.3, z: WZ + 1.15, ry: 0.3 });
      b.box(0.04, 0.03, 0.26, 0x8a6a44, { x: WX + 0.05, y: 0.25, z: WZ + 1.12, ry: 0.3 }); b.box(0.1, 0.06, 0.05, RW.metal, { x: WX + 0.1, y: 0.25, z: WZ + 1.0, ry: 0.3 });
      /* die wenigen Unkrautbüschel bleiben nur außen an den Ecken */
      [[-HW - 0.3, -HD - 0.3], [HW + 0.3, -HD - 0.35]].forEach(([x, z]) => b.ico(0.2, C.green2, { x, y: 0.08, z, flat: 0.7, jitter: 0.4 }));
    }
    if (stage >= 2) {
      /* Stützen an der eingestürzten Wand (frisches Holz, schräg vom Boden an die Wand) */
      [-1.45, -0.55].forEach(z => { const x0 = HW + 1.25, y1 = 1.85, x1 = HW + 0.16, L = Math.hypot(x0 - x1, y1), a = Math.atan2(y1, x0 - x1);
        b.box(L, 0.1, 0.1, RW.fresh, { x: (x0 + x1) / 2, y: y1 / 2 - 0.05, z, rz: -a }); b.box(0.3, 0.1, 0.24, 0x8a6a44, { x: x0 + 0.05, y: 0, z }); });
      /* Leiter an der linken Traufe vorn */
      b.at({ x: -EAVE - 0.55, y: 0, z: 1.55, rz: -0.24 }, m => { [-0.22, 0.22].forEach(z => m.box(0.06, 2.75, 0.06, RW.fresh, { z })); for (let y = 0.3; y < 2.7; y += 0.32) m.box(0.05, 0.05, 0.44, RW.fresh2, { y }); });
    }
    return b;
  }
  /* v192: Boden der Baustelle – festgetretene Erde um die Hütte mit weichem Rand ins Gras, vor Tür und Stufen
     dunkler und fester, etwas Kies, ein feuchter Fleck unter dem Fass, Grasbüschel am Rand. Lokal wie die Hütte. */
  function yardMesh() {
    G3.seed(8205);
    const b = MB(), gnd = typeof wGroundAt === "function" ? wGroundAt : () => 0x7fb444, y = 0.016, seg = 40;
    const CX = 0.4, CZ = 1.3, RX = 5.4, RZ = 5.0;
    const wob = a => 1 + 0.07 * Math.sin(a * 3 + 0.8) + 0.05 * Math.sin(a * 7 + 2.1);
    const dirt = G3.col(0x9b8562), dirt2 = G3.col(0x8c7653), hard = G3.col(0x857050), damp = G3.col(0x7a6648);
    const L = (lx, lz) => { const w = Wp(lx, lz); return G3.col(gnd(w[0], w[1])); };
    const colAt = (x, z) => {
      let c = mixC(0x9b8562, 0x8c7653, 0.5 + 0.5 * Math.sin(x * 1.3 + z * 0.9));
      const dDoor = Math.hypot((x - 0.5) / 1.6, (z - 5.0) / 1.3);          /* vor den Stufen festgetreten */
      if (dDoor < 1) c = c.map((v, i) => v + (hard[i] - v) * (1 - dDoor));
      const dW = Math.hypot((x - HW - 1.4) / 1.3, (z - 2.9) / 1.6);        /* Arbeitsplatz */
      if (dW < 1) c = c.map((v, i) => v + (hard[i] - v) * (1 - dW) * 0.7);
      const dB = Math.hypot(x + HW + 0.55, z - 1.7) / 0.9;                  /* feucht unter dem Fass */
      if (dB < 1) c = c.map((v, i) => v + (damp[i] - v) * (1 - dB));
      return c;
    };
    const P = (a, k) => { const w = wob(a) * k; return [CX + Math.cos(a) * RX * w, CZ + Math.sin(a) * RZ * w]; };
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      /* drei Ringe innen (Farbe nach Lage), dann der Rand ins Gras */
      const ks = [0, 0.4, 0.75, 1];
      for (let r = 0; r < 3; r++) {
        const A = P(a0, ks[r]), B = P(a1, ks[r]), C2 = P(a1, ks[r + 1]), D = P(a0, ks[r + 1]);
        const cA = colAt(A[0], A[1]), cB = colAt(B[0], B[1]), cC = colAt(C2[0], C2[1]), cD = colAt(D[0], D[1]);
        if (r === 0) triUp(b, [A[0], y, A[1]], [C2[0], y, C2[1]], [D[0], y, D[1]], cA, cC, cD);
        else { triUp(b, [A[0], y, A[1]], [B[0], y, B[1]], [C2[0], y, C2[1]], cA, cB, cC); triUp(b, [A[0], y, A[1]], [C2[0], y, C2[1]], [D[0], y, D[1]], cA, cC, cD); }
      }
      const A = P(a0, 1), B = P(a1, 1), C2 = P(a1, 1.28), D = P(a0, 1.28);
      triUp(b, [A[0], y, A[1]], [B[0], y, B[1]], [C2[0], y - 0.001, C2[1]], colAt(A[0], A[1]), colAt(B[0], B[1]), L(C2[0], C2[1]));
      triUp(b, [A[0], y, A[1]], [C2[0], y - 0.001, C2[1]], [D[0], y - 0.001, D[1]], colAt(A[0], A[1]), L(C2[0], C2[1]), L(D[0], D[1]));
    }
    /* Kies und Steinchen, nicht unter der Hütte */
    for (let i = 0; i < 46; i++) {
      const a = hh(i, 31) * Math.PI * 2, r = 0.3 + hh(i, 32) * 0.95, p = P(a, r);
      if (Math.abs(p[0]) < HW + 0.35 && p[1] > -HD - 0.35 && p[1] < VZ + 0.6) continue;
      b.ico(0.035 + hh(i, 33) * 0.05, hh(i, 34) < 0.5 ? 0x9c958a : 0x8a847a, { x: p[0], y: y, z: p[1], flat: 0.45, jitter: 0.3 });
    }
    /* Grasbüschel am Rand (wo kaum jemand läuft) */
    for (let i = 0; i < 18; i++) {
      const a = (i + hh(i, 35)) / 18 * Math.PI * 2, p = P(a, 0.93 + hh(i, 36) * 0.12);
      if (Math.hypot(p[0] - 0.5, p[1] - 5.2) < 2 || (p[0] < -3 && p[1] > 2)) continue;          /* nicht am Weg */
      for (let k = 0; k < 4; k++) b.box(0.03, 0.18 + hh(i, k) * 0.14, 0.03, k % 2 ? 0x6f9e3c : 0x5d8a34, { x: p[0] + (k - 1.5) * 0.05, y, z: p[1] + hh(k, i) * 0.06, rz: (k - 1.5) * 0.25, rx: (hh(i, k + 4) - 0.5) * 0.4 });
    }
    return b;
  }
  /* Bauzustand nach dem Spielstand: Material am Bauplatz (S.farm.depot.rent) – siehe Kopf von ruinMesh */
  function phase() {
    const T = st();
    if (T && T.built) return 3;
    const D = (typeof S !== "undefined" && S.farm && S.farm.depot && S.farm.depot.rent) || {};
    const full = Object.keys(NEED).filter(id => (D[id] || 0) >= NEED[id]).length, any = Object.keys(D).some(id => D[id] > 0);
    return full >= 3 ? 2 : any ? 1 : 0;
  }
  const PHASES = ["Verfallen", "Baustelle eingerichtet", "Gesichert · Dach in Arbeit", "Fertig · vermietbar"];
  /* Auto des Mieters: kleiner Kombi, Front +z */
  function carMesh(col) {
    G3.seed(8203);
    const b = MB();
    [[0.42, 0.62], [-0.42, 0.62], [0.42, -0.6], [-0.42, -0.6]].forEach(([x, z]) => FM.wheel(b, 0.19, 0.1, { x: x > 0 ? x - 0.09 : x - 0.01, y: 0.19, z }));
    b.box(0.92, 0.36, 1.92, col, { y: 0.17 });
    b.box(0.86, 0.36, 1.2, col, { y: 0.53, z: -0.22 });
    b.box(0.8, 0.3, 0.05, 0x3a4a5a, { y: 0.57, z: 0.39, rx: -0.45 });
    b.box(0.8, 0.28, 0.04, 0x3a4a5a, { y: 0.58, z: -0.83 });
    [-1, 1].forEach(s => b.box(0.03, 0.26, 1.04, 0x3a4a5a, { x: s * 0.435, y: 0.6, z: -0.22 }));
    b.box(0.84, 0.05, 1.1, mixC(col, 0x000000, 0.25), { y: 0.89, z: -0.22 });
    b.box(0.94, 0.1, 0.06, 0x55555c, { y: 0.2, z: 0.96 }); b.box(0.94, 0.1, 0.06, 0x55555c, { y: 0.2, z: -0.96 });
    [-1, 1].forEach(s => { b.box(0.18, 0.08, 0.03, 0xfff5c8, { x: s * 0.3, y: 0.4, z: 0.97 }); b.box(0.16, 0.08, 0.03, 0xc8302a, { x: s * 0.32, y: 0.42, z: -0.97 }); });
    return b;
  }
  function mixC(a, c, t) { const A = G3.col(a), B = G3.col(c); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; }
  /* Trampelpfad (schmal, mündet in die Straße) und Briefkasten */
  function pathMesh() {
    const b = MB();
    const gnd = typeof wGroundAt === "function" ? wGroundAt : null;
    b.merge(FWM.forestPath(PATH, 1.0, { y: 0.024, ey: 0.017, gnd, roadCol: 0x7c7f86, mouthR: 0.6, caps: [true, false], mouth: [false, true], ends: [false, false], leafOk: (x, z) => z > 20 }), {});
    b.box(0.08, 0.95, 0.08, 0x6b4a30, { x: -41.4, z: 20.3 });
    b.box(0.26, 0.22, 0.4, 0x3f6b4a, { x: -41.4, y: 0.92, z: 20.3 }); b.box(0.04, 0.12, 0.04, 0xd8332b, { x: -41.25, y: 1.12, z: 20.42 });
    return b;
  }
  /* Parkfleck: festgefahrene Erde mit Reifenspuren, weicher Rand ins Gras */
  function padMesh() {
    G3.seed(8204);
    const b = MB(), gnd = typeof wGroundAt === "function" ? wGroundAt : () => 0x7fb444, seg = 28, y = 0.02;
    const R = a => [3.4 * (1 + 0.08 * Math.sin(a * 3 + 0.6)), 1.55 * (1 + 0.1 * Math.sin(a * 2 + 1.4))];
    const P = (a, k) => { const r = R(a); return [CAR.x + 0.2 + Math.cos(a) * r[0] * k, y, CAR.z - 0.15 + Math.sin(a) * r[1] * k]; };
    const dirt = G3.col(0x9a7d56), dirt2 = G3.col(0x8a6e4a);
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, c = [CAR.x + 0.2, y, CAR.z - 0.15];
      b.triV(c, P(a1, 1), P(a0, 1), dirt2, dirt, dirt);
      const A = P(a0, 1), B = P(a1, 1), Cc = P(a1, 1.45), D = P(a0, 1.45);
      b.triV(A, B, Cc, dirt, dirt, G3.col(gnd(Cc[0], Cc[2])));
      b.triV(A, Cc, D, dirt, G3.col(gnd(Cc[0], Cc[2])), G3.col(gnd(D[0], D[2])));
    }
    [-0.42, 0.42].forEach(dz => b.box(4.6, 0.004, 0.2, 0x7a6040, { x: CAR.x - 0.6, y: y + 0.002, z: CAR.z + dz, ry: 0.06 }));
    return b;
  }

  /* ------------------------------- Welt ------------------------------------ */
  const W = { ruin: null, ruins: [], yard: null, stage: -1, hut: null, lit: [], path: null, pad: null, man: null, car: null, grow: null, chk: 0 };
  function attach(R) {
    /* v192: drei Bauzustände der Ruine (eigene Meshes, nur einer sichtbar), Boden der Baustelle */
    W.ruins = [0, 1, 2].map(k => fnode(fmesh("rent_ruin" + k + "_v192", () => ruinMesh(k)), { x: H.x, z: H.z, ry: H.ry, visible: false }));
    W.ruin = W.ruins[0];
    W.yard = fnode(fmesh("rent_yard_v192", yardMesh), { x: H.x, z: H.z, ry: H.ry, visible: false, shadow: false });
    W.stage = -1;
    W.hut = fnode(fmesh("rent_hut_v182", hutMesh), { x: H.x, z: H.z, ry: H.ry, visible: false });
    W.lit = [0, 1].map(f => fnode(fmesh("rent_lit" + f + "_v182", () => litMesh(f)), { x: H.x, z: H.z, ry: H.ry, visible: false, glow: 0.6, shadow: false }));
    W.path = fnode(fmesh("rent_path_v182", pathMesh), { visible: false, shadow: false });
    W.pad = fnode(fmesh("rent_pad_v182", padMesh), { visible: false, shadow: false });
    R.nodes.push(W.yard, ...W.ruins, W.hut, W.lit[0], W.lit[1], W.path, W.pad);
    W.man = null; W.car = null; W.manKey = W.carKey = null;
    syncWorld();
  }
  function syncWorld() {
    if (!W.hut) return;
    const T = st(), open = typeof farmAreaOpen === "function" && farmAreaOpen("see"), b = !!(T && T.built);
    const ph = phase();
    W.ruins.forEach((n, k) => { n.visible = open && !b && ph === k; });
    W.ruin = W.ruins[Math.min(2, ph)];
    /* sichtbarer Wechsel des Bauzustands (nicht beim Laden): Staub an der Hütte */
    if (W.stage >= 0 && ph !== W.stage && ph < 3 && FV.R) FV.R.burst({ x: H.x, y: 0.6, z: H.z, n: 22, col: [[0.75, 0.66, 0.5, 0.8], [0.62, 0.55, 0.42, 0.7]], speed: 1.8, up: 1.2, size: 0.16, spread: 3.4, life: 1.0, g: -1.2 });
    W.stage = ph;
    W.yard.visible = open;
    if (!W.grow) W.hut.visible = b;
    const days = t => (S.time - t) / DAY;
    /* v192: der Trampelpfad zur Straße ist immer da – zugewachsen an der Ruine, ausgetretener, sobald gearbeitet wird */
    W.path.visible = open;
    W.path.alpha = b ? Math.min(1, 0.75 + days(T.built) / 12) : [0.38, 0.58, 0.7][ph];
    W.pad.visible = !!(T && T.ten);
    W.pad.alpha = T && T.ten ? Math.min(1, 0.3 + days(T.ten.since) / 14 * 0.7) : 1;
    if (T && T.ten) ensureActors(T.ten); else dropActors();
  }
  function ensureActors(t) {
    const R = FV.R, key = t.n + t.seed;
    if (W.manKey === key) return;
    dropActors();
    const look = { shirt: t.shirt, pants: t.pants, hair: t.hair, skin: t.skin, seed: t.seed % 50 };
    W.manStand = fmesh("rent_man:" + key, () => FWM.person(look));
    W.manSit = fmesh("rent_mans:" + key, () => FWM.person(Object.assign({ sit: true }, look)));
    W.man = fnode(W.manStand, { x: DOOR[0], z: DOOR[1], s: 1.35, visible: false });
    W.car = fnode(fmesh("rent_car:" + t.car, () => carMesh(t.car)), { x: CAR.x, z: CAR.z, ry: Math.PI / 2, s: 1.3, visible: false });
    R.nodes.push(W.man, W.car);
    W.manKey = key;
    W.m = { key: "door", route: [], vis: false, sit: false, idle: 0 };
    W.c = { st: null, pts: null, i: 0 };
  }
  function dropActors() {
    const R = FV.R;
    [W.man, W.car].forEach(n => { if (!n || !R) return; const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
    W.man = W.car = null; W.manKey = null;
  }
  function pick(x, y) {
    if (!FV.R || !W.hut || (!W.hut.visible && !W.ruin.visible)) return null;
    const d = FV.R.hitBox(FV.R.ray(x, y), [H.x - 3.6, 0, H.z - 3.4], [H.x + 3.6, W.hut.visible ? 6.6 : 4.2, H.z + 4.2]);
    return d != null ? { d } : null;
  }
  function tagInfo() {
    const T = st();
    if (!T || !W.hut) return null;
    if (!T.built) { if (!unlocked()) return null; const ok = buildCheck() === true; return { x: H.x, y: 4.9, z: H.z, html: "🔨" + (ok ? "✅" : "🪵"), cls: ok ? "ready" : "" }; }
    if (T.iss) return { x: H.x, y: 7.2, z: H.z, html: "🏡" + ISSUES[T.iss.k].i + "❗", cls: "ready" };
    if (T.ten && S.time >= maintDue(T)) return { x: H.x, y: 7.2, z: H.z, html: "🏡🔧", cls: "ready" };
    return null;
  }

  /* --------------------------- Tagesablauf --------------------------------- */
  function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const WALK = 25;                                                     /* Spielminuten zum Auto bzw. vom Auto zur Tür (Pfad ≈ 25 Einheiten) */
  function plan(t, day) {
    const r = rng(t.seed * 7919 + day * 104729);
    const wd = (day + t.wd) % 7 < 5, work = (wd ? r() < 0.88 : r() < 0.08) && day > Math.floor(t.since / DAY);   /* am Einzugstag bleibt er zu Hause */
    const wake = work ? 375 + r() * 40 : 450 + r() * 70, leave = Math.max(wake + 25, 410 + r() * 70), back = 930 + r() * 120, sleep = 1350 + r() * 60;
    return { work, wake, leave, back, sleep, r1: r() };
  }
  /* Was macht der Mieter gerade? → { k: "in" | "away" | "toCar" | "fromCar" | "bench" | "spot", s: Platz } */
  function doing(t, now) {
    const day = Math.floor(now / DAY), m = now - day * DAY, P = plan(t, day);
    if (now < t.since + 30) return { k: "fromCar" };
    if (m < P.wake || m >= P.sleep) return { k: "in" };
    if (P.work) {
      if (m < P.leave) return { k: "in" };
      if (m < P.leave + WALK) return { k: "toCar" };
      if (m < P.back) return { k: "away" };
      if (m < P.back + WALK) return { k: "fromCar" };
    }
    const slot = Math.floor(m / 45), r = rng(t.seed * 31 + day * 977 + slot * 13)(), rain = S.farm.wx && S.farm.wx.k === "regen";
    if (m > 1290) return r < 0.35 ? { k: "bench" } : { k: "in" };       /* ab 21:30 höchstens noch auf der Veranda */
    if (r < 0.4) return { k: "in" };
    if (r < 0.72 || rain) return { k: "bench" };
    return { k: "spot", s: Math.floor(r * 997) % SPOTS.length };
  }
  function lightsOn(t, now) {
    const day = Math.floor(now / DAY), m = now - day * DAY, P = plan(t, day), d = doing(t, now).k;
    if (d === "away" || d === "toCar") return [false, false];
    return [m >= 1080 && m < P.sleep - 30, m >= P.sleep - 75 && m < P.sleep];
  }
  /* Wege: Veranda (Tür, Bank) → Stufen → Wiese; zum Auto über den Trampelpfad */
  const posOf = (k, s) => k === "door" ? DOOR : k === "bench" ? SIT : k === "steps" ? STEPS : k === "car" ? CARDOOR : SPOTS[s || 0];
  const regOf = k => k === "door" || k === "bench" ? "v" : k === "car" ? "c" : "y";
  function route(from, to, s) {
    const pts = [], a = regOf(from), b = regOf(to);
    if (a === "v" && b !== "v") pts.push(STEPS);
    if (a === "c") PATH.slice(0, -1).reverse().forEach(p => pts.push(p));           /* vom Auto direkt auf den Pfad (nicht erst an die Straße) */
    if (b === "c") { if (a !== "c") PATH.slice(1, -1).forEach(p => pts.push(p)); }
    else if (b === "v" && a !== "v") pts.push(STEPS);
    pts.push(posOf(to, s));
    return pts;
  }
  /* Höhe: auf der Veranda auf den Dielen, auf den Stufen dazwischen */
  function yAt(x, z) { const l = Lp(x, z); if (Math.abs(l[0]) > HW + 0.1 || l[1] < HD - 0.2 || l[1] > VZ + 0.7) return 0; return l[1] <= VZ ? DECK : DECK * Math.max(0, 1 - (l[1] - VZ) / 0.7); }

  function stepMan(dt, time, t) {
    const M = W.m, n = W.man, now = S.time, D = doing(t, now), sp = 1.15 * Math.min(3, Math.max(1, S.speed || 1));
    const want = D.k === "in" ? "door" : D.k === "away" || D.k === "toCar" ? "car" : D.k === "fromCar" ? "door" : D.k === "bench" ? "bench" : "spot";
    /* aus dem Haus bzw. vom Auto: Figur erscheint an der Tür bzw. am Auto */
    if (!M.vis) {
      if (D.k === "away" || D.k === "in") { n.visible = false; M.key = D.k === "away" ? "car" : "door"; return; }
      if (W.c.st !== "parked") { n.visible = false; return; }          /* solange das Auto fährt, sitzt er drin */
      const p = posOf(M.key);
      n.x = p[0]; n.z = p[1]; n.visible = true; M.vis = true; M.route = []; M.goal = null;
    }
    const goal = want + (want === "spot" ? D.s : "");
    if (M.goal !== goal) {
      if (M.sit) { M.sit = false; n.mesh = W.manStand; n.y = 0; }
      M.goal = goal; M.route = route(M.key, want, D.s); M.dest = want; M.s = D.s;
    }
    if (M.route.length) {
      const tg = M.route[0], dx = tg[0] - n.x, dz = tg[1] - n.z, dist = Math.hypot(dx, dz), st = sp * dt;
      if (dist <= st) { n.x = tg[0]; n.z = tg[1]; M.route.shift(); }
      else { n.x += dx / dist * st; n.z += dz / dist * st; n.ry += angN(Math.atan2(dx, dz) - n.ry) * Math.min(1, dt * 8); }
      n.y = yAt(n.x, n.z) + Math.abs(Math.sin(time * 9)) * 0.05;
      n.rz = Math.sin(time * 9) * 0.04;
      if (!M.route.length) {
        M.key = M.dest;
        if (M.dest === "door" || M.dest === "car") { n.visible = false; M.vis = false; if (M.dest === "car") W.c.go = true; }
        if (M.dest === "bench") { M.sit = true; n.mesh = W.manSit; n.x = SIT[0]; n.z = SIT[1]; n.ry = H.ry; n.y = DECK; n.rz = 0; }
      }
      return;
    }
    n.rz = 0;
    if (M.sit) { n.y = DECK + Math.sin(time * 1.3) * 0.004; return; }
    /* stehen und sich umschauen (meist Richtung See) */
    n.y = yAt(n.x, n.z);
    M.idle -= dt;
    if (M.idle <= 0) { M.idle = 3 + Math.random() * 4; M.face = Math.atan2(-14 - n.x, 44 - n.z) + (Math.random() - 0.5) * 1.6; }
    if (M.face != null) n.ry += angN(M.face - n.ry) * Math.min(1, dt * 2);
  }
  const angN = a => Math.atan2(Math.sin(a), Math.cos(a));
  /* Auto: parkt, fährt morgens weg (nach Osten), kommt nachmittags von Westen zurück */
  function stepCar(dt, t) {
    const c = W.c, n = W.car, D = doing(t, S.time).k;
    if (c.st == null) { c.st = D === "away" || D === "fromCar" ? "away" : "parked"; place(n, c.st); }
    /* losfahren, sobald der Mieter eingestiegen ist; war die Abfahrt längst (Hof nicht offen), ist das Auto einfach weg */
    if (c.st === "parked" && (c.go || D === "away" && !W.m.vis)) {        /* läuft er noch zum Auto, wartet es */
      c.go = false;
      if (D === "away" && S.time - lastLeave(t) > 20) { c.st = "away"; place(n, "away"); }
      else { c.st = "out"; c.pts = CAR_OUT; c.i = 1; }
    }
    /* zurück: zur Heimkehr fährt es von Westen heran; ist der Mieter längst zu Hause, steht es einfach wieder da */
    if (c.st === "away" && D !== "away" && D !== "toCar") {
      if (D === "fromCar") { c.st = "in"; c.pts = CAR_IN; c.i = 1; n.x = CAR_IN[0][0]; n.z = CAR_IN[0][1]; n.ry = Math.PI / 2; n.visible = true; W.m.key = "car"; }
      else { c.st = "parked"; place(n, "parked"); if (!W.m.vis) W.m.key = "door"; }
    }
    if (c.st === "out" || c.st === "in") {
      const tg = c.pts[c.i], dx = tg[0] - n.x, dz = tg[1] - n.z, dist = Math.hypot(dx, dz);
      const near = Math.hypot(n.x - CAR.x, n.z - CAR.z), v = Math.min(9, 1.6 + near * 0.55) * Math.min(3, Math.max(1, S.speed || 1)) * dt;
      if (dist <= v) { n.x = tg[0]; n.z = tg[1]; c.i++; }
      else { n.x += dx / dist * v; n.z += dz / dist * v; n.ry += angN(Math.atan2(dx, dz) - n.ry) * Math.min(1, dt * 5); }
      n.y = Math.abs(Math.sin(performance.now() / 70)) * 0.012;
      if (c.i >= c.pts.length) {
        if (c.st === "out") { c.st = "away"; place(n, "away"); }
        else { c.st = "parked"; place(n, "parked"); }
      }
    }
  }
  function place(n, s) { n.visible = s !== "away"; n.x = CAR.x; n.z = CAR.z; n.ry = Math.PI / 2; n.y = 0; }
  function lastLeave(t) { const day = Math.floor(S.time / DAY); return day * DAY + plan(t, day).leave + WALK; }

  function step(dt, time) {
    if (!W.hut) return;
    W.chk -= dt;
    if (W.chk <= 0) { W.chk = 1.5; syncWorld(); }
    if (W.grow) {                                                     /* die Hütte wächst aus dem Boden und federt nach */
      const G = W.grow; G.t += dt;
      const k = G.t / 1.3, e = k < 1 ? 1 - Math.pow(1 - k, 3) : 1 + Math.sin((k - 1) * 9) * 0.05 * Math.max(0, 1 - (k - 1) * 2.5);
      W.hut.visible = true; W.hut.sy = Math.max(0.05, e); W.hut.sx = W.hut.sz = 1 + (1 - Math.min(1, k)) * 0.12;
      if (G.t > 2.2) { W.hut.sx = W.hut.sy = W.hut.sz = 1; W.grow = null; }
    }
    const T = st(), t = T && T.ten;
    const L = t && W.man ? lightsOn(t, S.time) : [false, false];
    W.lit[0].visible = L[0] && !W.grow; W.lit[1].visible = L[1] && !W.grow;
    if (!t || !W.man || !W.car) return;
    stepCar(dt, t);
    stepMan(dt, time, t);
    /* Rauch aus dem Kamin, wenn geheizt wird (morgens und abends, nicht bei kaputter Heizung) */
    const m = S.time % DAY, d = doing(t, S.time).k, heat = d !== "away" && d !== "toCar" && (m < 600 || m > 1020) && !(T.iss && T.iss.k === "heizung");
    if (heat && Math.random() < dt * 4) {
      const p = Wp(-HW - 0.35, -0.2);
      FV.R.emit({ x: p[0] + (Math.random() - 0.5) * 0.2, y: 7.0, z: p[1], vx: 0.25 + Math.random() * 0.2, vy: 0.7, vz: 0.1, g: 0.05, life: 3.2, size: 0.22, size2: 0.75, col: [0.82, 0.82, 0.84, 0.42], drag: 0.6 });
    }
  }

  /* ------------------------------- Fenster --------------------------------- */
  const tage = n => n === 1 ? "1 Tag" : n + " Tagen";
  function sheet() {
    const T = st();
    if (!T) return;
    FV.sheetFn = sheet;
    if (!T.built) return buildSheet();
    const t = T.ten;
    if (!t) {
      openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏡</span>Hütte am See<small>frisch aufgebaut</small></div>
        ${phaseHTML()}<div class="fs-sub">${esc(T.next ? T.next.n : "Ein Mieter")} hat zugesagt und zieht ${S.time < T.moveIn ? "in " + fdur(Math.max(1, T.moveIn - S.time)) : "gleich"} ein. Die Miete beträgt ${eur(RENT_DAY)} am Tag und kommt jede Woche.</div>`, "rent");
      return;
    }
    const due = maintDue(T), f = rentF(T, S.time), I = T.iss && ISSUES[T.iss.k];
    const issH = I ? `<div class="rent-iss"><b>${I.i} ${esc(I.n)}</b><p>„${esc(I.t)}“</p>
        <small>gemeldet vor ${fdur(Math.max(1, S.time - T.iss.t0))}${S.time - T.iss.t0 > 2 * DAY ? " · " + esc(t.n) + " mindert die Miete um die Hälfte" : " · nach 2 Tagen mindert " + esc(t.n) + " die Miete"}</small>
        <button class="btn fgo" id="rnFix">🛠️ Reparieren · ${eur(T.iss.c)}</button></div>` : `<div class="fs-sub">✅ Alles in Ordnung – ${esc(t.n)} ist zufrieden.</div>`;
    const mLeft = due - S.time;
    const mH = mLeft > 10 * DAY ? `<div class="fs-sub">🔧 Instandhaltung in ${tage(Math.ceil(mLeft / DAY))} fällig (${eur(MAINT)}).</div>`
      : `<div class="rent-iss"><b>🔧 Instandhaltung ${mLeft > 0 ? "in " + tage(Math.ceil(mLeft / DAY)) + " fällig" : "fällig seit " + tage(Math.max(1, Math.floor(-mLeft / DAY)))}</b>
        <small>${mLeft > -7 * DAY ? "Ist sie länger als 7 Tage überfällig, hält " + esc(t.n) + " die Miete zurück." : esc(t.n) + " hält die Miete zurück, bis sie erledigt ist."}</small>
        <button class="btn${mLeft > 0 ? " ghost" : " fgo"}" id="rnMaint">🔧 Instandhaltung · ${eur(MAINT)}</button></div>`;
    const payIn = Math.max(1, T.pay - S.time);
    openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏡</span>Hütte am See<small>Mieter: ${esc(t.n)} · seit Tag ${Math.floor(t.since / DAY) + 1}</small></div>
      <div class="hu-stats"><span>💶 ${eur(RENT_DAY)} / Tag${f < 1 ? (f ? " · gemindert" : " · zurückgehalten") : ""}</span><span>📅 nächste Miete in ${payIn > DAY ? tage(Math.ceil(payIn / DAY)) : fdur(payIn)} (≈ ${eur(Math.round((T.acc || 0) + RENT_DAY * payIn / DAY * f))})</span><span>Σ ${eur(T.earned || 0)} eingenommen</span></div>
      ${issH}${mH}`, "rent");
    const ui = () => { if (typeof renderFarmUI === "function") renderFarmUI(); };
    const fx = $("#rnFix"); if (fx) fx.onclick = () => { if (repair()) { sfx("coin"); sheet(); ui(); } else sfx("bad"); };
    const mt = $("#rnMaint"); if (mt) mt.onclick = () => { if (maintain()) { sfx("build"); sheet(); ui(); } else sfx("bad"); };
  }
  /* v192: Bauzustand als Schrittleiste – derselbe Zustand, den die Hütte in der Welt zeigt (phase()) */
  function phaseHTML() {
    const ph = phase(), T = st();
    const hint = ["Lege das erste Material am Bauplatz ab – dann wird die Baustelle eingerichtet.", "Sind 3 Materialien vollständig da, wird die Hütte gesichert und der Dachstuhl ergänzt.",
      "Alles da? Dann geht es ans Nageln – danach steht die Hütte.", T && T.q != null ? "Bauqualität " + T.q + " % – " + (T.q >= 90 ? "meisterhaft" : T.q >= 70 ? "sauber" : T.q >= 50 ? "ordentlich" : "hält") : "Fertig gebaut"][ph];
    return `<div class="rn-ph">${PHASES.map((n, k) => `<span class="${k < ph ? "done" : k === ph ? "cur" : ""}"><i></i>${esc(n)}</span>`).join("")}</div><div class="fs-sub rn-phh">${esc(hint)}</div>`;
  }
  function buildSheet() {
    FV.sheetFn = buildSheet;
    const lvOk = flv() >= LV, chk = buildCheck();
    const ic = id => typeof icHTML === "function" ? icHTML(id) : FITEMS[id].i;
    const rows = Object.keys(NEED).map(id => siteRowHTML("rent", NEED, id, ic)).join("")
      + `<div class="hu-need${S.money >= COST ? " ok" : ""}"><span class="hu-ni">💶</span><b>${eur(COST)}</b><small>${S.money >= COST ? "✓ da" : "auf dem Konto: " + eur(S.money)}</small></div>`;
    openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏚️</span>Verfallene Hütte am See<small>${lvOk ? "gehört zu deinem Hof" : "ab Level " + LV}</small></div>
      <div class="fs-sub">Die alte Blockhütte westlich vom See ist eingestürzt. Mit Holz aus dem Sägewerk wird daraus eine zweistöckige Hütte mit Veranda – zum Vermieten: ${eur(RENT_DAY)} Miete am Tag, alle 90 Tage eine Instandhaltung (${eur(MAINT)}), ab und zu eine kleine Reparatur.</div>
      ${phaseHTML()}<div class="hu-needs">${rows}</div>${siteDepHTML("rent", NEED)}
      <div class="fs-row"><button class="btn${chk === true ? "" : " disabled"}" id="rnBuild">${chk === true ? "🔨 Hütte aufbauen" : "🔒 " + esc(chk)}</button></div>`, "rent");
    siteDepBind("rent", NEED, buildSheet);   /* v186: Material am Bauplatz ablegen */
    $("#rnBuild").onclick = () => {
      if (buildCheck() !== true) { sfx("bad"); return; }
      closeFarmSheet();
      if (typeof MG !== "undefined" && MG.open) MG.open("nails", { short: true, title: "Hütte aufbauen" }, res => { if (res && res.ok) buildNow(res.score); });
      else buildNow();
    };
  }

  return { phase, PHASES, H, NEED, COST, LV, RENT_DAY, MAINT, ISSUES, CYCLE, PATH, CAR, clear, attach, pick, tagInfo, sheet, step, tick, built, unlocked, buildNow, repair, maintain,
    _st: st, _doing: (t, now) => doing(t, now), _plan: (t, d) => plan(t, d), _lights: (t, now) => lightsOn(t, now), _W: W, _spawnIssue: () => spawnIssue(st()) };
})();
