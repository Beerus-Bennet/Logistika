/* =========================================================================
   LOGISTIKA – camp.js  (v81)
   Der Lagerfeuerplatz am Ende des Waldwegs (Weg 1, nach Nordwesten):
   runde Feuerstelle, drei geschwungene Sofas im offenen U zur Kamera hin, dunkle
   Holzwand, Pflanzen in mehreren Tiefen, Kies, Gartenlampen, Korbsessel.
   Hier machen alle Mitarbeiter von 12 bis 13 Uhr Mittagspause (team.js).

   Aufbau (alles austauschbar, nichts verteilt sich übers Spiel):
     CAMP.slots      neun feste Sitzplätze worker_slot_01 … worker_slot_09
     CAMP.build()    Modelle (Kies, Feuerstelle, Sofas, Wand, Pflanzen, Lampen …)
     CAMP.attach(R)  Szene in die Welt setzen   CAMP.step(dt,t)  Feuer, Funken, Lampen
     CAMP.assign / remove / slotOf / free   Belegung (gespeichert in S.farm.camp)
     CAMP.pose(slot) Sitzhaltung – hier kann später eine Animation einsteigen
     CAMP.near(x,z,r) / CAMP.clear(x,z,kind)   Freihalten von Bäumen und Kulisse
   Örtliche Achsen: x = Bildschirm rechts, z = zur Kamera hin (Süd-Ost), Feuer im Ursprung;
   der Platz hängt an einem Knoten bei (CX,CZ) mit Drehung π/4.
   ========================================================================= */
const CAMP = (() => {
  "use strict";
  const CX = -53, CZ = -120.5, RY = Math.PI / 4, S2 = Math.SQRT1_2;
  const toW = (lx, lz) => [CX + (lx + lz) * S2, CZ + (lz - lx) * S2];
  const toL = (x, z) => { const dx = x - CX, dz = z - CZ; return [(dx - dz) * S2, (dx + dz) * S2]; };
  const rad = d => d * Math.PI / 180;

  /* ------------------------------ Sitzplätze ------------------------------ */
  /* Gruppe, Radius um die Feuerstelle, Winkel (0° = rechts, 90° = hinten) */
  const SEATS = [
    ["left", 2.5, 205], ["left", 2.5, 180], ["left", 2.5, 155],
    ["back", 2.9, 116], ["back", 2.9, 90], ["back", 2.9, 64],
    ["right", 2.4, 24], ["right", 2.4, 0], ["right", 2.4, -24]
  ];
  /* Haltung je Platz: Drehung (rad) weg vom Feuer, Arm (rx vor/zurück, rz zur Seite), Neigung – keine zwei gleich */
  const POSES = [
    { turn: 0.16, arm: -0.8, az: 0.1, lean: 0.03 }, { turn: -0.12, arm: -1.0, az: 0.14, lean: -0.04 }, { turn: 0.22, arm: -0.7, az: 0.08, lean: 0.06 },
    { turn: -0.10, arm: -0.95, az: 0.12, lean: 0.02 }, { turn: 0.06, arm: -0.85, az: 0.18, lean: -0.05 }, { turn: 0.2, arm: -1.05, az: 0.08, lean: 0.04 },
    { turn: -0.2, arm: -0.75, az: 0.14, lean: 0.05 }, { turn: 0.1, arm: -0.9, az: 0.1, lean: -0.03 }, { turn: -0.14, arm: -0.8, az: 0.16, lean: 0.01 }
  ];
  const SIT_Y = 0.04;            /* Standhöhe der sitzenden Figur (Kies) */
  const SEAT_OFF = 0.10;         /* v95: Sitzmitte der Figur liegt so weit vor der Sofamitte (Richtung Feuer) */
  const slots = SEATS.map((s, i) => {
    const a = rad(s[2]), r = s[1] - SEAT_OFF;            /* v95: Becken vorn auf der Sitzfläche – die Unterschenkel hängen vor der Sofakante frei */
    const lx = Math.cos(a) * r, lz = -Math.sin(a) * r, w = toW(lx, lz), f = toW(0, 0);
    return {
      id: "worker_slot_" + String(i + 1).padStart(2, "0"), n: i + 1, group: s[0], seat: s[0] + "_" + (SEATS.slice(0, i + 1).filter(q => q[0] === s[0]).length),
      lx: +lx.toFixed(3), lz: +lz.toFixed(3), x: +w[0].toFixed(3), z: +w[1].toFixed(3), fx: f[0], fz: f[1],
      ry: Math.atan2(f[0] - w[0], f[1] - w[1]), pose: POSES[i], R: s[1], ang: s[2]
    };
  });
  const byId = id => slots.find(s => s.id === id) || null;

  /* Belegung: S.farm.camp.slots = { slotId: staffId } – fest gespeichert, nichts springt zufällig um */
  function store() { const F = typeof S !== "undefined" && S.farm; if (!F) return null; F.camp = F.camp || {}; F.camp.slots = F.camp.slots || {}; return F.camp.slots; }
  function slotOf(staffId) { const m = store(); if (!m) return null; const id = Object.keys(m).find(k => m[k] === staffId); return id ? byId(id) : null; }
  function workerOf(slotId) { const m = store(); return m ? m[slotId] || null : null; }
  function free() { const m = store() || {}; return slots.filter(s => !m[s.id]); }
  function assign(slotId, staffId) {
    const m = store(), sl = byId(slotId);
    if (!m || !sl || (m[slotId] && m[slotId] !== staffId)) return false;
    Object.keys(m).forEach(k => { if (m[k] === staffId) delete m[k]; });
    m[slotId] = staffId; return true;
  }
  function remove(slotId) { const m = store(); if (!m || !m[slotId]) return false; delete m[slotId]; return true; }
  /* Wer weg ist (entlassen, ersetzt), gibt den Platz frei */
  function tidy(ids) { const m = store(); if (!m) return; Object.keys(m).forEach(k => { if (!ids.has(m[k])) delete m[k]; }); }
  /* Platz für eine Kraft: der eigene, sonst der zur Rolle passende (Reihenfolge der Rollen), sonst der erste freie */
  function slotFor(s, roleIdx) {
    let sl = slotOf(s.id);
    if (sl) return sl;
    const pref = slots[roleIdx] && !workerOf(slots[roleIdx].id) ? slots[roleIdx] : free()[0];
    if (pref && assign(pref.id, s.id)) return pref;
    return null;
  }
  /* Haltung für die Figur (team.js ruft das je Bild auf) */
  function pose(sl) { return sl.pose; }

  /* ------------- v95: Wege im Lagerplatz – ums Feuer herum, nie hindurch ------------- */
  /* Von außen (Tor, vorn offen) bis zum Ring um die Feuerstelle (Halbmesser RING, außerhalb der Steine und
     Flammen, innerhalb der Füße der Sitzenden), dort auf dem Bogen zum Platz und zuletzt auf den Standpunkt
     direkt vor der Sofakante. Der Weg zurück ist derselbe rückwärts. Alles örtlich (Feuer im Ursprung). */
  const RING = 1.5, STAND = 0.62, IN_Z = 5.4, OUT_Z = 8.2;
  const polar = (a, r) => [Math.cos(a) * r, -Math.sin(a) * r];
  const angOf = (lx, lz) => Math.atan2(-lz, lx);
  const normA = d => { d = (d + Math.PI) % (2 * Math.PI); if (d <= 0) d += 2 * Math.PI; return d - Math.PI; };
  function arcPts(a0, a1, r) {
    const d = normA(a1 - a0), n = Math.max(1, Math.ceil(Math.abs(d) / rad(14))), o = [];
    for (let i = 1; i <= n; i++) o.push(polar(a0 + d * i / n, r));
    return o;
  }
  const wpts = L => L.map(q => { const w = toW(q[0], q[1]); return [+w[0].toFixed(2), +w[1].toFixed(2)]; });
  /* Hindernisse für die Wegsuche (A*): Platz mit Wänden und Sofas ist von außen gesperrt, hinein führen nur die Wege oben */
  function blockedL(lx, lz) { return Math.abs(lx) < 7.6 && lz > -6.4 && lz < 7.0; }
  function blockedW(x, z) { const l = toL(x, z); return blockedL(l[0], l[1]); }
  function gate() { const w = toW(0, OUT_Z); return [w[0], w[1]]; }
  function standPt(sl) { return polar(rad(sl.ang), sl.R - STAND); }
  function slotAt(x, z, d) {
    let b = null, bd = d || 0.9;
    slots.forEach(s => { const q = Math.hypot(s.x - x, s.z - z); if (q < bd) { bd = q; b = s; } });
    return b;
  }
  function routeIn(sl) {
    const a0 = -Math.PI / 2, L = [[0, OUT_Z], [0, IN_Z], polar(a0, RING)].concat(arcPts(a0, rad(sl.ang), RING));
    L.push(standPt(sl));
    return wpts(L);
  }
  function routeOut(x, z) {
    const l = toL(x, z), sl = slotAt(x, z), a0 = -Math.PI / 2, L = [[l[0], l[1]]];
    if (sl) { L.push(standPt(sl)); }
    if (sl || l[1] < IN_Z - 0.3) {
      const a = sl ? rad(sl.ang) : angOf(l[0], l[1]);
      L.push(polar(a, RING));
      arcPts(a, a0, RING).forEach(q => L.push(q));
      L.push([0, IN_Z]);
    }
    L.push([0, OUT_Z]);
    return wpts(L);
  }

  /* ------------- v95: Gespräch der Sitzenden (Blick, Nicken, Kopfschütteln) -------------
     Eine Regie für alle, die gerade sitzen: abwechselnd spricht einer (unregelmäßig lang, manchmal Pause);
     die anderen schauen meist zum Sprecher, manchmal zu einem Nachbarn oder ins Feuer, nicken zwischendurch,
     selten schütteln sie den Kopf. Ergebnis je Platz: Kopfdrehung/-neigung (relativ zum Körper) und Armgeste. */
  const TK = { sp: null, spT: 0, pause: 0, st: {} };
  const rr = (a, b) => a + Math.random() * (b - a);
  function talkOf(id) {
    return TK.st[id] || (TK.st[id] = { tg: null, tg0: 0, yaw: 0, pit: 0, roll: 0, nodT: -9, nodA: 0, shkT: -9, shkA: 0, gesT: -9, gesA: 0, lag: rr(0.7, 1.5), ph: rr(0, 6), nod: 0, shk: 0, ges: 0 });
  }
  function talkReset() { TK.sp = null; TK.spT = 0; TK.st = {}; }
  function talkStep(dt, time, ids) {
    if (!ids.length) { TK.sp = null; return; }
    if (time > TK.spT || (TK.sp && !ids.includes(TK.sp))) {
      const pausing = !TK.sp ? false : Math.random() < 0.18;
      const others = ids.filter(i => i !== TK.sp);
      TK.sp = pausing || !others.length ? null : others[Math.floor(Math.random() * others.length)];
      TK.spT = time + (TK.sp ? rr(2.4, 7.5) : rr(0.8, 2));
    }
    ids.forEach(id => {
      const sl = byId(id), g = talkOf(id), me = id === TK.sp;
      if (time > g.tg0) {
        const others = ids.filter(i => i !== id), r = Math.random();
        if (!others.length || r > 0.93) g.tg = "fire";
        else if (me) g.tg = others[Math.floor(Math.random() * others.length)];
        else if (TK.sp && r < 0.72) g.tg = TK.sp;
        else if (r < 0.9) g.tg = others[Math.floor(Math.random() * others.length)];
        else g.tg = "fire";
        g.tg0 = time + (me ? rr(1.2, 3.2) : rr(1.0, 3.6)) * (g.tg === "fire" ? 0.6 : 1);
      }
      if (g.tg !== "fire" && !ids.includes(g.tg)) g.tg0 = 0;
      let tx = sl.fx, tz = sl.fz, pit = 0.16;
      if (g.tg && g.tg !== "fire") { const o = byId(g.tg); tx = o.x; tz = o.z; pit = 0.02; }
      const body = sl.ry + sl.pose.turn, want = Math.max(-1.1, Math.min(1.1, normA(Math.atan2(tx - sl.x, tz - sl.z) - body)));
      const k = Math.min(1, dt * 3.4 / g.lag);
      g.yaw += (want - g.yaw) * k;
      /* Sprecher: lebhaft (kleine Nick-Wellen, hin und wieder eine Handbewegung); Zuhörer: ruhig */
      const live = me ? Math.sin(time * 2.1 + g.ph) * 0.05 + Math.sin(time * 3.7 + g.ph * 2) * 0.03 : Math.sin(time * 0.9 + g.ph) * 0.018;
      g.pit += (pit + live - g.pit) * Math.min(1, dt * 4);
      g.roll += ((me ? Math.sin(time * 1.3 + g.ph) * 0.05 : 0) - g.roll) * Math.min(1, dt * 3);
      /* Nicken (Zuhörer, wenn der Sprecher spricht), Kopfschütteln selten, Handbewegung des Sprechers */
      if (!me && TK.sp && g.tg === TK.sp && time - g.nodT > 1.6 && Math.random() < dt * 0.16) { g.nodT = time; g.nodA = rr(0.1, 0.2); }
      if (!me && TK.sp && time - g.shkT > 25 && Math.random() < dt * 0.012) { g.shkT = time; g.shkA = rr(0.16, 0.26); }
      if (me && time - g.gesT > 1.2 && Math.random() < dt * 0.45) { g.gesT = time; g.gesA = rr(0.25, 0.6); }
      const a = time - g.nodT, b = time - g.shkT, c = time - g.gesT;
      g.nod = a < 1.1 ? Math.sin(a * 8) * g.nodA * Math.exp(-a * 2.6) : 0;
      g.shk = b < 1.4 ? Math.sin(b * 9) * g.shkA * Math.exp(-b * 2.0) : 0;
      g.ges = c < 1.3 ? Math.sin(Math.min(1, c / 1.3) * Math.PI) * g.gesA : 0;
      g.speaking = me;
    });
  }

  /* ------------------------- Freihalten für die Welt ------------------------ */
  function near(x, z, r) { return Math.hypot(x - CX, z - CZ) < r; }
  /* kind "tree": fällbarer Baum (Kreis), "bg": Kulissenbaum (Kreis + Sichtkeil zur Kamera) */
  function clear(x, z, kind) {
    const l = toL(x, z);
    if (kind === "tree") return near(x, z, 7.2) || (l[1] > -8.2 && l[1] < 7.6 && Math.abs(l[0]) < 9.2) || (l[1] > 0 && l[1] < 12 && Math.abs(l[0]) < 6.5);
    if (near(x, z, 8.6) || (l[1] > -10 && l[1] < 8.5 && Math.abs(l[0]) < 10.6)) return true;
    return l[1] > 0 && l[1] < 17 && Math.abs(l[0]) < 10.5;           /* Sicht vom Weg her auf die Sofas */
  }

  /* -------------------------------- Farben -------------------------------- */
  const K = {
    anth: 0x3b3e43, anthD: 0x2c2f33, rim: 0x777b81, stone: 0x4a4d52, ash: 0x1e1b19,
    wal: 0x4a3224, chest: 0x654431, walD: 0x39251b,
    taupe: 0xa6978a, greige: 0xb7ad9e, sand: 0xcfc3aa, slate: 0x6d7987, slateD: 0x58636f,
    gr1: 0x77828f, gr2: 0x8a95a1, gr3: 0x636e7a, gr4: 0x9aa4ae,
    leafD: 0x2e4a2b, moss: 0x4b6c35, olive: 0x5d6b2f, leaf: 0x3a7a3b, leaf2: 0x2f6a34, fernC: 0x558a3a, wine: 0x7a2f3a,
    wicker: 0x9d7b52, wickerD: 0x7e5f3c, warm: 0xfff0c8
  };

  /* ------------------------------ Bausteine ------------------------------- */
  const rnd = () => G3.srand();
  const mixc = (a, b, t) => { const A = G3.col(a), B = G3.col(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };

  /* Eingang: der Kies läuft als schmaler werdender Streifen in den Sandweg aus (Farbverlauf), mit weniger Steinen nach außen */
  function funnel(b) {
    const st = [[-1.2, 2.7], [0, 2.3], [1.1, 1.75], [2.2, 1.35], [3.4, 1.1], [4.8, 0.95], [6.2, 0.9]];
    const P = L => [0, 5.3 + L];
    for (let i = 0; i < 26; i++) {
      const L = -0.5 + Math.pow(rnd(), 1.4) * 5.5, p = P(L), w = st.reduce((m, q) => (q[0] <= L ? q[1] : m), 2.7) * 0.7, r = 0.04 + rnd() * 0.05;
      b.ico(r, [K.gr2, K.gr3, K.gr4][i % 3], { x: p[0] + (rnd() * 2 - 1) * w, y: 0.036, z: p[1], jitter: 0.3, flat: 0.45, ry: rnd() * 6 });
    }
  }
  /* Kies: unregelmäßiger Platz, Steinrand mit Öffnung zum Weg, kleine Steine */
  function gravel(b) {
    G3.seed(8101);
    const R0 = 5.1, Y = 0.04;
    b.disc(R0, 36, K.gr1, { y0: Y, wob: 0.045 });
    for (let i = 0; i < 16; i++) {
      const a = rnd() * 6.28, d = Math.sqrt(rnd()) * (R0 - 1.4), r = 0.55 + rnd() * 1.1;
      b.disc(r, 12, [K.gr2, K.gr3, K.gr4, K.gr1][i % 4], { x: Math.cos(a) * d, z: Math.sin(a) * d, y0: Y + 0.002 * (1 + (i % 4)), wob: 0.18 });
    }
    for (let i = 0; i < 110; i++) {
      const a = rnd() * 6.28, d = 1.5 + Math.sqrt(rnd()) * (R0 - 1.7), r = 0.05 + rnd() * 0.07;
      if (d < 1.55) continue;
      b.ico(r, [K.gr2, K.gr3, K.gr4, 0x70798a][i % 4], { x: Math.cos(a) * d, y: Y + r * 0.1, z: Math.sin(a) * d, jitter: 0.3, flat: 0.45, ry: rnd() * 6 });
    }
    /* Randsteine – offen zum Weg (vorn, leicht links) */
    const N = 38;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + rnd() * 0.05, px = Math.cos(a), pz = Math.sin(a);
      if (pz > 0.45 && Math.abs(px) < 0.46) continue;                      /* Zugang */
      const r = 0.2 + rnd() * 0.12, d = R0 + 0.05 + rnd() * 0.12;
      b.ico(r, mixc(K.stone, K.rim, rnd() * 0.6), { x: px * d, y: Y - r * 0.15, z: pz * d, jitter: 0.22, flat: 0.55, ry: rnd() * 6, sx: 1.2 });
    }
    funnel(b);
  }

  /* Feuerstelle: Ring aus dunklem Naturstein, hellere Deckplatten, Asche, Holzscheite */
  function pit(b) {
    G3.seed(8102);
    const N = 15, R = 0.98;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, px = Math.cos(a) * R, pz = Math.sin(a) * R, ry = -a + Math.PI / 2;
      const h = 0.4 + rnd() * 0.07;
      b.box(0.52, h, 0.42, mixc(K.anthD, K.anth, rnd()), { x: px, y: 0.04, z: pz, ry, top: K.stone });
      b.box(0.56, 0.07, 0.46, mixc(K.rim, 0x8a8e94, rnd() * 0.6), { x: px, y: 0.04 + h, z: pz, ry });
    }
    b.disc(0.9, 18, K.ash, { y0: 0.2 });
    b.disc(0.55, 12, 0x3b2c22, { y0: 0.202 });
    for (let i = 0; i < 7; i++) {                                           /* gegeneinander gelehnte Scheite */
      const a = (i / 7) * Math.PI * 2 + 0.3, r = 0.46 + (i % 2) * 0.12;
      b.at({ x: Math.cos(a) * r, y: 0.2, z: Math.sin(a) * r, ry: Math.PI - a }, () =>
        b.cyl(0.085 - (i % 3) * 0.008, 0.07, 0.95 - (i % 2) * 0.12, 7, [0x5b4030, 0x4a3326, 0x6b4a36][i % 3], { rz: -0.5 - (i % 3) * 0.06, top: 0x8a6a4a }));
    }
    for (let i = 0; i < 4; i++) {                                           /* liegende Holzstücke außen */
      const a = rnd() * 6.28, r = 0.55 + rnd() * 0.2;
      b.cyl(0.07, 0.07, 0.5, 6, 0x4a3326, { x: Math.cos(a) * r, y: 0.27, z: Math.sin(a) * r, rz: Math.PI / 2, ry: rnd() * 3, top: 0x7a5a3e });
    }
    /* Außenstein-Kranz im Kies, damit die Stelle sitzt */
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28 + 0.2, r = 1.55 + rnd() * 0.15; b.ico(0.14 + rnd() * 0.05, K.stone, { x: Math.cos(a) * r, y: 0.04, z: Math.sin(a) * r, jitter: 0.25, flat: 0.5, ry: rnd() * 6 }); }
  }

  /* Sofa: n Plätze auf einem Kreisbogen (Radius R, Mittenwinkel phi0, Abstand dphi in Grad) */
  function sofa(b, R, phis, opt) {
    opt = opt || {};
    const dphi = Math.abs(phis[1] - phis[0]), last = phis.length - 1;
    const wAt = r => 2 * r * Math.sin(rad(dphi) / 2) * 0.985;
    phis.forEach((ph, i) => {
      const a = rad(ph), ry = a + Math.PI / 2, P = r => [Math.cos(a) * r, -Math.sin(a) * r];
      let [x, z] = P(R);
      b.box(wAt(R + 0.02), 0.26, 0.86, K.anthD, { x, z, y: 0.04, ry, top: K.anth });                           /* Rahmen / Sockel */
      b.box(wAt(R) * 0.97, 0.2, 0.78, opt.seat || K.taupe, { x, z, y: 0.3, ry, top: mixc(opt.seat || K.taupe, 0xffffff, 0.08) });  /* Sitzkissen */
      [x, z] = P(R + 0.4);
      b.box(wAt(R + 0.4) * 0.99, 0.28, 0.22, K.anthD, { x, z, y: 0.3, ry });                                    /* Rückenrahmen */
      b.at({ x, y: 0.506, z, ry }, () => b.box(wAt(R + 0.4) * 0.93, 0.48, 0.2, opt.back || K.greige, { rx: -0.16, top: mixc(K.greige, 0xffffff, 0.1) }));  /* Rückenkissen */
      /* Füße */
      [-1, 1].forEach(s => { const q = P(R + (s > 0 ? 0.35 : -0.3)); b.box(0.09, 0.06, 0.09, 0x1d1f22, { x: q[0], z: q[1], y: 0, ry }); });
    });
    /* Armlehnen an beiden Enden */
    [[phis[0], Math.sign(phis[0] - phis[1])], [phis[last], Math.sign(phis[last] - phis[last - 1])]].forEach(([ph, s]) => {
      const a = rad(ph + s * (dphi / 2 + 1.5)), ry = a + Math.PI / 2, x = Math.cos(a) * (R + 0.08), z = -Math.sin(a) * (R + 0.08);
      b.box(0.17, 0.48, 0.98, K.anth, { x, z, y: 0.04, ry, top: K.anthD });
      b.box(0.2, 0.05, 1.02, K.wal, { x, z, y: 0.526, ry });
    });
    /* lose Zierkissen */
    (opt.cush || []).forEach(([k, col, t]) => {
      const a = rad(phis[k]), r = R + 0.22, ry = a + Math.PI / 2;
      b.at({ x: Math.cos(a) * r, y: 0.508, z: -Math.sin(a) * r, ry }, () => b.box(0.42, 0.4, 0.14, col, { rx: -0.35, rz: t }));
    });
  }

  /* Rückwand: senkrechte, dunkle Holzlatten (Walnuss / Kastanie im Wechsel) mit Deckbalken */
  function wall(b) {
    G3.seed(8103);
    const Z = -5.5, XW = 7.1, ZF = 5.7, w = 0.3, col = i => i % 3 === 0 ? K.chest : i % 3 === 1 ? K.wal : K.walD;
    /* Rückwand */
    for (let x = -XW + 0.2, i = 0; x < XW - 0.2; x += w + 0.015, i++) b.box(w, 2.55 + (rnd() - 0.5) * 0.12, 0.14, col(i), { x: x + w / 2, y: 0, z: Z + (rnd() - 0.5) * 0.02, top: K.walD });
    b.box(2 * XW + 0.4, 0.1, 0.26, K.walD, { y: 2.58, z: Z });
    b.box(2 * XW + 0.2, 0.14, 0.2, K.walD, { z: Z + 0.1 });
    /* Seitenwände links und rechts: docken an die Rückwand an, nur die Blickseite bleibt offen */
    [-1, 1].forEach(sd => {
      for (let z = Z + 0.2, i = 0; z < ZF; z += w + 0.015, i++) b.box(0.14, 2.55 + (rnd() - 0.5) * 0.12, w, col(i + 1), { x: sd * XW, y: 0, z: z + w / 2, top: K.walD });
      b.box(0.26, 0.1, ZF - Z + 0.3, K.walD, { x: sd * XW, y: 2.58, z: (Z + ZF) / 2 });
      b.box(0.2, 0.14, ZF - Z, K.walD, { x: sd * XW - sd * 0.1, z: (Z + ZF) / 2 });
      b.box(0.3, 2.7, 0.3, K.walD, { x: sd * XW, z: ZF });                                    /* Endpfosten vorn */
    });
    b.box(0.36, 2.72, 0.38, K.walD, { x: -XW, z: Z - 0.03 }); b.box(0.36, 2.72, 0.38, K.walD, { x: XW, z: Z - 0.03 });
  }

  /* ---------------------------- Pflanzen (Tiefen) ---------------------------- */
  function leaf(b, x, z, ry, len, w, tilt, col, y0) {
    b.at({ x, y: y0 || 0, z, ry }, () => {
      b.at({ rx: -tilt }, () => {
        b.box(w, 0.025, len, col, { z: len / 2 });
        b.box(0.03, 0.03, len * 0.96, mixc(col, 0x203a1e, 0.45), { z: len / 2, y: 0.018 });
      });
    });
  }
  function tropical(b, x, z, s) {                                           /* große Blätter, Bananen-Art */
    const n = 6 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) leaf(b, x, z, (i / n) * 6.28 + rnd() * 0.5, (1.1 + rnd() * 0.6) * s, 0.42 * s, 0.7 + rnd() * 0.5, mixc(K.leaf, K.leaf2, rnd()), 0.08);
    b.cyl(0.05 * s, 0.07 * s, 0.35 * s, 5, K.moss, { x, z });
  }
  function fernC(b, x, z, s) {
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28 + rnd() * 0.3;
      leaf(b, x, z, a, (0.7 + rnd() * 0.3) * s, 0.12 * s, 0.35 + rnd() * 0.5, mixc(K.fernC, K.moss, rnd() * 0.6), 0.04);
    }
  }
  function shrub(b, x, z, r, col) { b.ico(r, col || mixc(K.leafD, K.moss, rnd()), { x, y: r * 0.25, z, jitter: 0.32, flat: 0.8, detail: 1, ry: rnd() * 6 }); }
  function grass(b, x, z, s, col) {
    for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, d = rnd() * 0.12 * s; b.cone(0.025, (0.45 + rnd() * 0.35) * s, 4, col || mixc(K.olive, 0x8fa24a, rnd()), { x: x + Math.cos(a) * d, z: z + Math.sin(a) * d, rz: (rnd() - 0.5) * 0.5, rx: (rnd() - 0.5) * 0.5 }); }
  }
  function accent(b, x, z, s) {                                             /* Blattschmuckpflanze mit Weinrot */
    for (let i = 0; i < 7; i++) leaf(b, x, z, (i / 7) * 6.28, 0.5 * s, 0.2 * s, 0.9 + rnd() * 0.3, mixc(K.wine, 0x9a4a55, rnd()), 0.06);
  }
  function hanging(b, x, z, h) {                                            /* hängende Zweige an der Wand */
    b.cyl(0.015, 0.01, h, 4, K.walD, { x, y: 2.6 - h, z });
    for (let i = 0; i < 6; i++) b.ico(0.07 + rnd() * 0.04, mixc(K.leaf, K.moss, rnd()), { x: x + (rnd() - 0.5) * 0.14, y: 2.6 - h + rnd() * h, z: z + (rnd() - 0.5) * 0.1, jitter: 0.3, flat: 0.5 });
  }
  function plants(b) {
    G3.seed(8104);
    const ok = (x, z) => Math.hypot(x, z) > 4.1 && !(z > 3.2 && Math.abs(x + 1) < 1.9);
    /* hinten, vor der Wand: Pflanzenband ohne Gleichmaß */
    for (let x = -6.4, i = 0; x < 6.5; x += 0.75 + rnd() * 0.55, i++) {
      const z = -3.9 - rnd() * 0.6, k = i % 6;
      if (k === 0) tropical(b, x, z - 0.1, 1.0 + rnd() * 0.45);
      else if (k === 1) shrub(b, x, z + 0.2, 0.55 + rnd() * 0.3);
      else if (k === 2) fernC(b, x, z + 0.3, 1.1);
      else if (k === 3) grass(b, x, z + 0.4, 1.3);
      else if (k === 4) shrub(b, x, z, 0.7 + rnd() * 0.3, mixc(K.olive, K.leafD, rnd()));
      else accent(b, x, z + 0.5, 1.0);
    }
    /* seitlich links / rechts */
    [-1, 1].forEach(sd => {
      for (let i = 0; i < 12; i++) {
        const x = sd * (4.4 + rnd() * 1.8), z = -3.6 + i * 0.62 + (rnd() - 0.5) * 0.4;
        if (!ok(x, z) || z > 3.4) continue;
        const k = (i + (sd > 0 ? 2 : 0)) % 5;
        if (k === 0) tropical(b, x, z, 0.9 + rnd() * 0.4);
        else if (k === 1) shrub(b, x, z, 0.5 + rnd() * 0.3);
        else if (k === 2) fernC(b, x, z, 1.0);
        else if (k === 3) grass(b, x, z, 1.2);
        else shrub(b, x, z, 0.4 + rnd() * 0.25, mixc(K.moss, K.olive, rnd()));
      }
    });
    /* Bodendecker und Gräser vor dem Kiesrand */
    for (let i = 0; i < 46; i++) {
      const a = rnd() * 6.28, d = 5.55 + rnd() * 1.6, x = Math.cos(a) * d, z = Math.sin(a) * d * 0.95;
      if (z > 3.0 && Math.abs(x + 1) < 1.9) continue;
      if (i % 3 === 0) b.ico(0.22 + rnd() * 0.2, mixc(K.moss, K.leafD, rnd()), { x, y: 0.05, z, jitter: 0.3, flat: 0.4, ry: rnd() * 6 });
      else grass(b, x, z, 0.9 + rnd() * 0.5);
    }
    /* hängende Zweige an der Wand */
  }

  /* Alles, was über die Wände ragt, wird abgeschnitten: Dreiecke mit einer Ecke hinter der Rückwand oder außerhalb der Seitenwände entfallen */
  function trim(m) {
    const out = new G3.MB(), v = m.v, ZB = -5.36, XB = 6.94;
    for (let i = 0; i + 26 < v.length; i += 27) {
      let bad = false;
      for (let k = 0; k < 3; k++) { const x = v[i + k * 9], z = v[i + k * 9 + 2]; if (z < ZB || Math.abs(x) > XB) bad = true; }
      if (!bad) for (let j = 0; j < 27; j++) out.v.push(v[i + j]);
    }
    return out;
  }
  /* Korbsessel links vorn und Steine / kleiner Tisch rechts vorn */
  function furniture(b) {
    G3.seed(8105);
    b.at({ x: -4.1, z: 2.7, ry: Math.atan2(4.1, -2.7) + Math.PI }, () => {                     /* Sessel schaut zum Feuer */
      b.box(0.9, 0.12, 0.85, K.wickerD, { y: 0.14 });
      b.box(0.8, 0.14, 0.75, K.sand, { y: 0.26, top: 0xdacdb4 });
      b.box(0.84, 0.62, 0.12, K.wicker, { y: 0.26, z: -0.4, rx: -0.14 });
      [-1, 1].forEach(s => { b.box(0.1, 0.34, 0.8, K.wicker, { x: s * 0.46, y: 0.2 }); b.box(0.13, 0.05, 0.84, K.wickerD, { x: s * 0.46, y: 0.54 }); });
      [[-0.38, -0.34], [0.38, -0.34], [-0.38, 0.34], [0.38, 0.34]].forEach(([x, z]) => b.cyl(0.04, 0.04, 0.16, 5, K.wickerD, { x, z }));
      b.box(0.36, 0.34, 0.12, K.slate, { y: 0.4, z: -0.2, x: 0.1, rx: -0.4, rz: 0.15 });
    });
    [[4.5, 2.4, 0.38], [4.95, 3.1, 0.26], [4.1, 3.2, 0.2]].forEach(([x, z, r]) => b.ico(r, mixc(K.stone, K.rim, rnd() * 0.5), { x, y: r * 0.1, z, jitter: 0.25, flat: 0.7, ry: rnd() * 6 }));
    b.cyl(0.3, 0.3, 0.42, 10, K.wal, { x: 3.7, z: 2.4, top: K.chest });                      /* Hocker / Beistelltisch */
    b.cyl(0.15, 0.15, 0.06, 8, K.anth, { x: 3.7, y: 0.42, z: 2.4 });
  }

  /* Lampen: Pfosten + Schirm (starr) – Birnen und Lichtinseln sind eigene Knoten */
  const LAMPS = [[-4.3, -2.6, 0.95], [4.3, -2.2, 0.85], [-1.9, -4.5, 0.75], [2.4, -4.5, 0.9], [-4.8, 1.8, 0.7], [4.7, 1.2, 0.8], [-3.3, 4.0, 0.6]];
  function lampPosts(b) {
    LAMPS.forEach(([x, z, h]) => {
      b.cyl(0.035, 0.045, h, 6, 0x24262a, { x, z });
      b.cone(0.16, 0.14, 8, 0x2b2d31, { x, y: h, z });
      b.cyl(0.03, 0.03, 0.05, 6, 0x24262a, { x, y: h - 0.02, z });
    });
  }
  function lampBulbs() { const b = new G3.MB(); LAMPS.forEach(([x, z, h]) => b.sphere(0.09, 7, 5, K.warm, { x, y: h - 0.06, z })); return b; }
  function lampHalo() {
    const b = new G3.MB(); let k = 0;
    LAMPS.forEach(([x, z]) => [[1.6, 0.0], [1.15, 0.002], [0.7, 0.004], [0.34, 0.006]].forEach(([r, dy]) => b.disc(r, 16, 0xffbf66, { x, z, y0: 0.058 + dy + (k % 3) * 0.0002, wob: 0.06 })), k++);
    return b;
  }
  /* Ein großer, gleichmäßiger Lichtkreis vom Feuer über den ganzen Platz (statt vieler kleiner Lampenkreise):
     sieben ineinanderliegende Scheiben, außen schwach, innen stärker – weicher Verlauf */
  function fireGlowMesh() {
    const b = new G3.MB();
    [6.6, 5.8, 5.0, 4.2, 3.4, 2.6, 1.9].forEach((r, i) => b.disc(r, 28, 0xff9a3a, { y0: 0.075 + i * 0.002, wob: 0.03 }));
    return b;
  }
  function flame(r, h, col) { const b = new G3.MB(); b.cone(r, h, 7, col, { top: col }); return b; }

  /* ------------------------------ Gesamtes Modell ----------------------------- */
  function build() {
    const b = new G3.MB();
    gravel(b); pit(b);
    sofa(b, 2.5, [205, 180, 155], { cush: [[0, K.slate, 0.2], [2, K.sand, -0.15]] });
    sofa(b, 2.9, [116, 90, 64], { cush: [[0, K.sand, 0.1], [1, K.slate, -0.2], [2, K.slateD, 0.15]] });
    sofa(b, 2.4, [24, 0, -24], { cush: [[1, K.slate, 0.1]] });
    const pl = new G3.MB(); plants(pl); b.add(trim(pl));
    wall(b); furniture(b); lampPosts(b);
    return b;
  }

  /* --------------------------------- Szene --------------------------------- */
  const ST = { root: null, fl: [], halo: null, fglow: null, bulbs: null, sp: 0, ph: 0 };
  function attach(R) {
    ST.fl = []; ST.root = fnode(fmesh("camp_v81", build), { x: CX, y: 0, z: CZ, ry: RY });
    R.nodes.push(ST.root);
    const add = (key, fn, o) => R.addChild(ST.root, fnode(fmesh(key, fn), Object.assign({ shadow: false }, o)));
    ST.fglow = add("camp_fglow", fireGlowMesh, { alpha: 0.1, glow: 1 });
    [[0.38, 0.95, 0xff6a1a, 0.9], [0.26, 0.78, 0xffa52e, 0.95], [0.14, 0.58, 0xffe58a, 1.0]].forEach(([r, h, c, a], i) =>
      ST.fl.push(add("camp_fl" + i, () => flame(r, h, c), { y: 0.24, alpha: a, glow: 1 })));
    ST.fl.push(add("camp_fl3", () => flame(0.2, 0.7, 0xff7a1a), { x: 0.22, y: 0.24, z: 0.1, alpha: 0.85, glow: 1 }));
    ST.fl.push(add("camp_fl4", () => flame(0.18, 0.62, 0xff9a26), { x: -0.2, y: 0.24, z: -0.12, alpha: 0.85, glow: 1 }));
    add("camp_embers", () => { const m = new G3.MB(); m.disc(0.55, 12, 0xff5a12, { y0: 0.215 }); m.disc(0.3, 10, 0xffb040, { y0: 0.218 }); return m; }, { glow: 1 });
    ST.bulbs = add("camp_bulbs", lampBulbs, { glow: 1 });
    return ST.root;
  }
  /* je Bild: Flammen züngeln, Funken, Lichtinseln nachts */
  function step(dt, time) {
    if (!ST.root || typeof FV === "undefined" || !FV.R) return;
    const R = FV.R, c = R.cam, near2 = c && Math.hypot(c.tx - CX, c.tz - CZ) < 60;
    if (!near2) return;
    const t = time || 0;
    ST.fl.forEach((n, i) => {
      const f = 0.86 + 0.16 * Math.sin(t * (7 + i * 1.7) + i * 2.1) + 0.07 * Math.sin(t * 17.3 + i);
      n.sy = f; n.sx = n.sz = 0.94 + 0.08 * Math.sin(t * (5.3 + i) + i); n.ry = Math.sin(t * 2.3 + i) * 0.5; n.rz = Math.sin(t * 3.1 + i * 1.3) * 0.05;
    });
    const fl = 1 + 0.09 * Math.sin(t * 9.1) + 0.05 * Math.sin(t * 23.7);
    const night = R.env && R.env.night != null ? R.env.night : 0;
    if (ST.fglow) ST.fglow.alpha = (0.035 + 0.085 * night) * fl;
    ST.sp += dt;
    if (ST.sp > 0.16) {
      ST.sp = 0;
      R.burst({ x: CX + (Math.random() - 0.5) * 0.4, y: 0.7, z: CZ + (Math.random() - 0.5) * 0.4, n: 1, col: [[1, 0.72, 0.25, 1], [1, 0.5, 0.15, 1]], speed: 0.35, up: 1.7, size: 0.045, shape: 1, life: 1.3 });
    }
  }

  return { GRAVEL: K.gr1, CX, CZ, RY, slots, SIT_Y, SEAT_OFF, RING, gate, routeIn, routeOut, standPt, slotAt, blockedL, blockedW, talkStep, talkOf, talkReset, byId, toW, toL, store, slotOf, workerOf, free, assign, remove, tidy, slotFor, pose, near, clear, build, attach, step, LAMPS };
})();
