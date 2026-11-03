/* =========================================================================
   LOGISTIKA – lucky3d.js (v268)
   Luckybox in 3D mit der eigenen Engine (gl3d.js, wie Hof und Büro): eine Transportkiste im Aussehen von v266
   (dunkler Korpus, Metallecken, Stahlband, Emblem; die goldene Box schwarz-gold) und ein Glücksrad.
   Jedes Feld des Rads ist ein Preis. Seine Größe entspricht genau seiner Gewinnchance (Chance der Seltenheit ÷ Anzahl
   der Preise dieser Seltenheit) – das Rad zeigt also ehrlich, was rollPrize zieht, und bleibt auf dem gezogenen Preis stehen.
     LUCKY3D.open(host, { gold, odds, prizes, rarity, reduced }) → Steuerung oder null (kein WebGL 2)
       .charge(i, col)       Aufladen, Stufe i (0–3), Licht in der Farbe col
       .burst(col, done)     Deckel springt auf, Lichtsäule, Kiste sinkt, das Rad fährt hoch
       .spin(id, o)          Rad dreht und bleibt auf Preis id stehen; o.onTick(prize), o.onDone()
       .celebrate(col)       Lampen und Gewinnfeld leuchten in der Seltenheitsfarbe
       .close()              alles freigeben
   ========================================================================= */
"use strict";

const LUCKY3D = (() => {
  const PI = Math.PI, TAU = PI * 2;
  /* Reihenfolge auf dem Rad: Seltenheiten wechseln sich ab, keine zwei gleichfarbigen Felder nebeneinander */
  const ORDER = ["cash", "insure", "boost", "fuel", "rep", "bulli", "xp", "coupon", "head", "repair", "mood", "vip"];
  const R_WHEEL = 1.25, HUB_Y = 1.78, CASE_Z = 0.9;
  const hex = c => typeof c === "number" ? c : parseInt(String(c).replace("#", ""), 16);
  const mixc = (a, b, k) => { const A = G3.col(hex(a)), B = G3.col(hex(b)); return [0, 1, 2].map(i => A[i] + (B[i] - A[i]) * k); };
  const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
  const backOut = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

  /* ------------------------------ Texturen ------------------------------ */
  function iconCanvas(icon) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d");
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "88px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
    g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 6; g.shadowOffsetY = 3;
    g.fillText(icon, 64, 70);
    return c;
  }
  function letterCanvas(ch, col) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d");
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = ch === "★" ? "96px sans-serif" : "92px Bangers, 'Baloo 2', sans-serif";
    g.lineWidth = 10; g.strokeStyle = "#0d1420"; g.lineJoin = "round";
    g.strokeText(ch, 64, 70); g.fillStyle = col; g.fillText(ch, 64, 70);
    return c;
  }

  /* ------------------------------- Modelle ------------------------------ */
  /* Farben wie v266: Navy-Stahl mit Stahlband, goldene Box schwarz-gold */
  function palette(gold) {
    return gold
      ? { body: 0x231b0c, top: 0x30261a, lid: 0x2b2214, metal: 0xd6a537, metalL: 0xffe39a, strap: 0xf2c443, ink: 0x0b0803, inner: 0x18120a, letter: "#f2c443", ch: "★" }
      : { body: 0x26344e, top: 0x34476a, lid: 0x2d3d5b, metal: 0x9aa8bd, metalL: 0xe8eef6, strap: 0xc9d4e3, ink: 0x0a0f18, inner: 0x111a29, letter: "#f2c443", ch: "L" };
  }
  /* Kiste: Korpus 1,36 × 0,6 × 0,8 mit Eckschonern, Rahmen, Stahlband, Nieten; Deckel als eigenes Teil (Scharnier hinten) */
  function caseBody(P) {
    const b = new G3.MB(), W = 1.36, H = 0.6, D = 0.8;
    b.box(W, H, D, P.body, { top: P.top });
    /* Rahmen vorn und hinten (Kanten), Bodenleiste */
    [-1, 1].forEach(s => {
      const z = s * (D / 2 + 0.005);
      b.box(W + 0.02, 0.05, 0.03, P.metal, { y: 0, z }); b.box(W + 0.02, 0.05, 0.03, P.metal, { y: H - 0.05, z });
      [-1, 1].forEach(q => b.box(0.05, H, 0.03, P.metal, { x: q * (W / 2 - 0.015), z }));
    });
    /* Eckschoner */
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => [0, H - 0.13].forEach(y => b.box(0.14, 0.13, 0.14, P.metalL, { x: sx * (W / 2 - 0.05), y, z: sz * (D / 2 - 0.05) }))));
    /* Stahlband vorn, oben bleibt frei für den Deckel */
    b.box(0.22, H + 0.006, D + 0.02, P.strap, { y: -0.003 });
    b.box(0.03, H, D + 0.03, P.ink, { x: -0.115 }); b.box(0.03, H, D + 0.03, P.ink, { x: 0.115 });
    /* Nieten auf dem Rahmen */
    [-0.5, -0.32, 0.32, 0.5].forEach(x => [0.07, H - 0.07].forEach(y => b.sphere(0.022, 8, 6, P.metalL, { x, y, z: D / 2 + 0.025, smooth: true })));
    /* Emblem vorn auf dem Band: Ring und dunkle Scheibe */
    b.cyl(0.2, 0.2, 0.05, 24, P.metalL, { y: H * 0.5, z: D / 2 + 0.01, rx: PI / 2 });
    b.cyl(0.165, 0.165, 0.06, 24, P.inner, { y: H * 0.5, z: D / 2 + 0.012, rx: PI / 2 });
    return b;
  }
  function caseLid(P) {
    /* Drehpunkt an der hinteren Oberkante: Deckel liegt bei z 0 … 0,84 (lokal) */
    const b = new G3.MB(), W = 1.42, H = 0.2, D = 0.84;
    b.box(W, H, D, P.lid, { z: D / 2, top: P.top });
    b.box(W + 0.02, 0.04, 0.03, P.metal, { y: 0.0, z: D + 0.005 });
    [-1, 1].forEach(sx => [0.07, D - 0.07].forEach(z => b.box(0.15, H + 0.02, 0.15, P.metalL, { x: sx * (W / 2 - 0.06), y: -0.01, z })));
    b.box(0.22, H + 0.006, D + 0.02, P.strap, { y: -0.003, z: D / 2 });
    b.box(0.03, H, D + 0.03, P.ink, { x: -0.115, z: D / 2 }); b.box(0.03, H, D + 0.03, P.ink, { x: 0.115, z: D / 2 });
    /* Griff oben */
    b.box(0.06, 0.12, 0.06, P.metal, { x: -0.22, y: H, z: D / 2 }); b.box(0.06, 0.12, 0.06, P.metal, { x: 0.22, y: H, z: D / 2 });
    b.box(0.5, 0.06, 0.07, P.metalL, { y: H + 0.1, z: D / 2 });
    return b;
  }
  /* Lichtsäule über der offenen Kiste */
  function beamMesh() { const b = new G3.MB(); b.cyl(0.55, 1.15, 2.6, 24, 0xffffff, { notop: true, nobot: true }); return b; }
  function plate(w, d, col) { const b = new G3.MB(); b.box(w, 0.01, d, col); return b; }
  function blobShadow() { const b = new G3.MB(); b.disc(1, 28, 0x000000); return b; }

  /* Glücksrad: Felder als Fächer (innen dunkler, außen heller), Trennstege, Rand mit Stiften, Nabe; Ständer dahinter */
  function wheelMesh(segs, P) {
    const b = new G3.MB(), R = R_WHEEL, z = 0.06, ink = 0x0d1420;
    const pt = (a, r, zz) => [Math.sin(a) * r, Math.cos(a) * r, zz];
    segs.forEach(s => {
      const n = Math.max(2, Math.ceil(s.w / (TAU / 90))), c = hex(s.col), cIn = mixc(c, 0x0d1420, 0.45), cOut = mixc(c, 0xffffff, 0.18);
      for (let i = 0; i < n; i++) {
        const a0 = s.a0 + s.w * i / n, a1 = s.a0 + s.w * (i + 1) / n;
        b.triV(pt(0, 0, z), pt(a1, R, z), pt(a0, R, z), cIn, cOut, cOut);
      }
    });
    /* Rückseite dunkel */
    for (let i = 0; i < 64; i++) { const a0 = TAU * i / 64, a1 = TAU * (i + 1) / 64; b.tri(pt(0, 0, -0.06), pt(a0, R, -0.06), pt(a1, R, -0.06), 0x111827); }
    /* Rand: Ringwand außen, Frontring, Stifte an den Feldgrenzen */
    const N = 72, R1 = R + 0.13;
    for (let i = 0; i < N; i++) {
      const a0 = TAU * i / N, a1 = TAU * (i + 1) / N;
      b.quad(pt(a0, R1, 0.1), pt(a0, R1, -0.1), pt(a1, R1, -0.1), pt(a1, R1, 0.1), P.metal);           /* außen */
      b.quad(pt(a0, R, 0.1), pt(a0, R1, 0.1), pt(a1, R1, 0.1), pt(a1, R, 0.1), P.metalL);             /* vorn */
      b.quad(pt(a1, R, -0.1), pt(a1, R1, -0.1), pt(a0, R1, -0.1), pt(a0, R, -0.1), P.metal);           /* hinten */
      b.quad(pt(a1, R, 0.1), pt(a1, R, z), pt(a0, R, z), pt(a0, R, 0.1), 0x1a2333);                    /* Innenkante */
    }
    segs.forEach(s => b.cyl(0.03, 0.03, 0.14, 8, P.metalL, { x: Math.sin(s.a0) * (R + 0.02), y: Math.cos(s.a0) * (R + 0.02), z: 0.06, rx: PI / 2 }));
    /* Nabe */
    b.cyl(0.3, 0.3, 0.16, 28, P.metalL, { z: 0.02, rx: PI / 2 });
    b.cyl(0.24, 0.24, 0.17, 28, 0x111a29, { z: 0.025, rx: PI / 2 });
    return b;
  }
  /* Trennstege korrekt: vom Rand der Nabe bis an den Rand, entlang des Winkels */
  function spokes(segs) {
    const b = new G3.MB(), L = R_WHEEL - 0.3;
    segs.forEach(s => b.at({ rz: -s.a0 }, () => b.box(0.035, L, 0.03, 0x0d1420, { y: 0.3, z: 0.065 })));
    return b;
  }
  function standMesh(P) {
    const b = new G3.MB();
    b.box(2.4, 0.14, 1.0, P.body, { y: 0, z: -0.35, top: P.top });
    b.box(2.5, 0.04, 1.06, P.metal, { y: 0.14, z: -0.35 });
    [-1, 1].forEach(s => b.box(0.14, HUB_Y + 0.1, 0.14, P.body, { x: s * 0.62, y: 0.1, z: -0.4, rz: s * 0.32 }));
    b.box(0.18, HUB_Y, 0.18, P.body, { y: 0.1, z: -0.35 });
    b.cyl(0.08, 0.08, 0.4, 12, P.metal, { y: HUB_Y, z: -0.35, rx: PI / 2 });
    return b;
  }
  /* Zeiger oben: Pfeil nach unten mit dunklem Rand, Drehpunkt oben */
  function pointerMesh(P) {
    const b = new G3.MB(), f = 0.07, back = -0.03;
    const tri = (w, h, z, col) => { b.tri([-w, 0, z], [w, 0, z], [0, -h, z], col); b.tri([w, 0, z - 0.06], [-w, 0, z - 0.06], [0, -h, z - 0.06], col); };
    tri(0.17, 0.36, f, 0x0d1420);
    tri(0.13, 0.29, f + 0.012, 0xe2465f);
    b.quad([-0.17, 0, f], [-0.17, 0, back], [0, -0.36, back], [0, -0.36, f], 0x0d1420);
    b.quad([0, -0.36, f], [0, -0.36, back], [0.17, 0, back], [0.17, 0, f], 0x0d1420);
    b.cyl(0.07, 0.07, 0.14, 12, P.metalL, { y: 0, z: 0.0, rx: PI / 2 });
    return b;
  }
  function bulbMesh() { const b = new G3.MB(); b.sphere(0.045, 8, 6, 0xffffff, { smooth: true }); return b; }

  /* ------------------------------- Szene -------------------------------- */
  function open(host, opt) {
    opt = opt || {};
    if (typeof G3 === "undefined") return null;
    const cv = document.createElement("canvas");
    cv.className = "lb-3d";
    host.insertBefore(cv, host.firstChild);
    let R = null;
    try { R = G3.create(cv, { shadowSize: 512, shadowBox: 4, maxDpr: 2 }); } catch (e) { R = null; }
    if (!R) { cv.remove(); return null; }
    const P = palette(!!opt.gold), red = !!opt.reduced, meshes = [], texs = [];
    const M = mb => { const m = R.mesh(mb); meshes.push(m); return m; };
    const T = c => { const t = R.texture(c); texs.push(t); return t; };
    const add = (m, o, parent) => { const n = R.node(m, Object.assign({ shadow: false }, o || {})); if (parent) R.addChild(parent, n); else R.nodes.push(n); return n; };
    const E = R.env;
    E.sun = G3.norm([-0.4, 0.8, 0.65]); E.sunCol = [1.3, 1.22, 1.12]; E.sky = [0.78, 0.84, 0.98]; E.ground = [0.32, 0.34, 0.42];
    E.fog = [0.05, 0.08, 0.14]; E.fogR = [60, 120]; E.night = 0;
    const cam = R.cam; cam.fov = 0.62; cam.yaw = PI / 2; cam.pitch = 0.16;
    const view = { tx: 0, ty: 0.42, tz: CASE_Z, dist: 3.7 }, viewTo = Object.assign({}, view);
    const setView = (o, now) => { Object.assign(viewTo, o); if (now) Object.assign(view, o); };

    /* Felder des Rads aus den Chancen */
    const odds = opt.odds, prizes = opt.prizes, rar = opt.rarity;
    const byR = {}; prizes.forEach(p => { byR[p.r] = (byR[p.r] || 0) + 1; });
    const tot = ["c", "r", "e", "l"].reduce((a, k) => a + (odds[k] || 0), 0);
    let a = 0;
    const segs = ORDER.map(id => prizes.find(p => p.id === id)).filter(Boolean).concat(prizes.filter(p => !ORDER.includes(p.id))).map(p => {
      const w = TAU * (odds[p.r] / tot) / byR[p.r], s = { p, a0: a, w, mid: a + w / 2, col: rar[p.r].col };
      a += w; return s;
    });

    /* Kiste */
    const caseRoot = add(null, { x: 0, y: 0, z: CASE_Z });
    add(M(blobShadow()), { y: 0.005, sx: 0.95, sz: 0.62, alpha: 0.4 }, caseRoot);
    add(M(caseBody(P)), {}, caseRoot);
    const lid = add(M(caseLid(P)), { y: 0.6, z: -0.42 }, caseRoot);
    add(null, { y: 0.3, z: 0.4 + 0.012 + 0.06 + 0.005, decal: { t: T(letterCanvas(P.ch, P.letter)), w: 0.27, h: 0.27 } }, caseRoot);   /* vor der Emblemscheibe */
    const seam = add(M(plate(1.38, 0.82, 0xffffff)), { y: 0.598, glow: 0.4, alpha: 0.95, tint: [1, 1, 1, 1], visible: false }, caseRoot);
    const beam = add(M(beamMesh()), { y: 0.6, glow: 1.2, alpha: 0.0, tint: [1, 1, 1, 1], visible: false }, caseRoot);
    /* Glücksrad: Ständer, Rad (dreht um z), Lampen, Zeiger */
    const wheelRoot = add(null, { y: -5.5, z: 0, visible: false });             /* erst sichtbar, wenn es hochfährt */
    add(M(standMesh(P)), {}, wheelRoot);
    const wheel = add(M(wheelMesh(segs, P)), { y: HUB_Y }, wheelRoot);
    add(M(spokes(segs)), {}, wheel);
    add(null, { z: 0.2, decal: { t: T(letterCanvas(P.ch, P.letter)), w: 0.36, h: 0.36 } }, wheel);                              /* vor der Nabe */
    const iconT = {};
    segs.forEach(s => {
      const r = R_WHEEL * 0.7, size = Math.max(0.2, Math.min(0.44, r * s.w * 0.82));
      const t = iconT[s.p.id] || (iconT[s.p.id] = T(iconCanvas(s.p.icon)));
      add(null, { x: Math.sin(s.mid) * r, y: Math.cos(s.mid) * r, z: 0.07, rz: -s.mid, decal: { t, w: size, h: size } }, wheel);
    });
    const bulbM = M(bulbMesh()), bulbs = [];
    for (let i = 0; i < 24; i++) { const an = TAU * i / 24; bulbs.push(add(bulbM, { x: Math.sin(an) * (R_WHEEL + 0.065), y: HUB_Y + Math.cos(an) * (R_WHEEL + 0.065), z: 0.12, glow: 0.6, tint: [1, 0.92, 0.6, 1] }, wheelRoot)); }
    const ptr = add(M(pointerMesh(P)), { y: HUB_Y + R_WHEEL + 0.3, z: 0.17 }, wheelRoot);                                    /* vor den Stiften */

    /* Zustand */
    const S3 = { t: 0, phase: "idle", amp: 0, seamCol: [1, 1, 1], seamGlow: 0.4, lidA: 0, burstT: -1, riseT: -1, spin: null, ang: Math.random() * TAU, flap: 0, flapV: 0,
      bulbMode: "chase", bulbCol: [1, 0.9, 0.6], winSeg: null, celebrate: -1 };
    wheel.rz = S3.ang;
    let raf = 0, last = performance.now(), alive = true;
    function segAt(ang) { const x = ((ang % TAU) + TAU) % TAU; return segs.find(s => x >= s.a0 && x < s.a0 + s.w) || segs[segs.length - 1]; }

    const frame = now => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; S3.t += dt;
      const t = S3.t;
      /* Kiste: schweben, beim Aufladen ruckeln */
      if (S3.phase === "idle") { caseRoot.y = red ? 0 : 0.04 + Math.sin(t * 2.2) * 0.04; caseRoot.ry = red ? 0 : Math.sin(t * 0.8) * 0.18; caseRoot.rz = 0; caseRoot.rx = 0; }
      else if (S3.phase === "charge") {
        const A = red ? 0 : S3.amp;
        caseRoot.rz = (Math.random() - 0.5) * 0.05 * A; caseRoot.rx = (Math.random() - 0.5) * 0.03 * A; caseRoot.x = (Math.random() - 0.5) * 0.03 * A;
        caseRoot.ry += (0 - caseRoot.ry) * Math.min(1, dt * 6);
        lid.rx = -(0.05 + Math.random() * 0.05) * A;
      }
      seam.visible = S3.phase !== "idle";
      seam.tint = [...S3.seamCol, 1]; seam.glow = S3.seamGlow * (0.85 + 0.15 * Math.sin(t * 30));
      /* Aufspringen, Lichtsäule, Kiste sinkt, Rad fährt hoch */
      if (S3.burstT >= 0) {
        const k = Math.min(1, (t - S3.burstT) / (red ? 0.05 : 0.45));
        lid.rx = -2.1 * backOut(k); caseRoot.rz = 0; caseRoot.rx = 0; caseRoot.x = 0;
        beam.visible = true; beam.tint = [...S3.seamCol, 1];
        const kb = (t - S3.burstT);
        beam.alpha = Math.max(0, 0.42 * Math.min(1, kb / 0.2) * (1 - Math.max(0, kb - 0.6) / 0.8)); beam.sx = beam.sz = 0.6 + Math.min(1, kb / 0.4) * 0.5;
        if (kb > 0.55) { const ks = ease((kb - 0.55) / 0.6); caseRoot.y = -1.6 * ks; caseRoot.sx = caseRoot.sy = caseRoot.sz = 1 - 0.4 * ks; }
        if (kb > 1.6) { caseRoot.visible = false; }
      }
      if (S3.riseT >= 0) {
        const k = Math.min(1, (t - S3.riseT) / (red ? 0.05 : 0.8));
        wheelRoot.visible = true; wheelRoot.y = -5.5 + 5.5 * backOut(k);
      }
      /* Rad drehen (eigene Kurve: schnell an, lange auslaufend, ganz am Ende einrasten) */
      if (S3.spin) {
        const sp = S3.spin, u = Math.min(1, (now - sp.t0) / sp.D);
        const k = 1 - Math.pow(1 - u, 4);
        S3.ang = sp.a0 + (sp.a1 - sp.a0) * k;
        const cur = segAt(S3.ang);
        if (cur !== sp.cur) { sp.cur = cur; S3.flapV -= 9 + 14 * (1 - u); if (sp.onTick) sp.onTick(cur.p); }
        if (u >= 1) { S3.spin = null; S3.ang = sp.a1; if (sp.onDone) setTimeout(sp.onDone, 30); }
      }
      wheel.rz = S3.ang;
      /* Zeiger: federt zurück */
      S3.flapV += (-S3.flap * 120 - S3.flapV * 9) * dt; S3.flap += S3.flapV * dt; S3.flap = Math.max(-0.7, Math.min(0.25, S3.flap));
      ptr.rz = S3.flap;
      /* Lampen: Lauflicht, beim Gewinn Blinken in Seltenheitsfarbe */
      bulbs.forEach((n, i) => {
        let on;
        if (S3.celebrate >= 0) on = Math.floor((t - S3.celebrate) * 8 + (i % 2)) % 2 === 0;
        else if (S3.spin) on = (i + Math.floor(t * 14)) % 3 === 0;
        else on = (i + Math.floor(t * 5)) % 4 === 0;
        const c = S3.celebrate >= 0 ? S3.bulbCol : [1, 0.9, 0.6];
        n.tint = on ? [...c, 1] : [c[0] * 0.25, c[1] * 0.25, c[2] * 0.25, 1]; n.glow = on ? 1.1 : 0.1;
      });
      /* Kamera gleitet zwischen Kiste und Rad */
      ["tx", "ty", "tz", "dist"].forEach(kk => { view[kk] += (viewTo[kk] - view[kk]) * Math.min(1, dt * (red ? 30 : 3.2)); });
      cam.tx = view.tx; cam.ty = view.ty; cam.tz = view.tz; cam.dist = view.dist;
      R.stepParticles(dt);
      try { R.render(S3.t); } catch (e) { /* Kontextverlust */ }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return {
      canvas: cv,
      charge(i, col) {
        S3.phase = "charge"; S3.amp = 1 + i * 0.7; S3.seamCol = G3.col(hex(col)); S3.seamGlow = 0.5 + i * 0.35;
        if (!red) R.burst({ x: 0, y: 0.65, z: CASE_Z, n: 6 + i * 4, speed: 0.6 + i * 0.25, up: 1.2, g: -1.5, life: 0.7, size: 0.05, col: [[...G3.col(hex(col)), 1], [1, 1, 1, 1]] });
      },
      burst(col, done) {
        S3.phase = "burst"; S3.burstT = S3.t; S3.seamCol = G3.col(hex(col)); S3.seamGlow = 1.6;
        if (!red) R.burst({ x: 0, y: 0.75, z: CASE_Z, n: 36, speed: 2.2, up: 3, g: -3, life: 1.1, size: 0.07, spread: 0.6, col: [[...G3.col(hex(col)), 1], [1, 1, 1, 1], [1, 0.92, 0.6, 1]] });
        setTimeout(() => { if (!alive) return; S3.riseT = S3.t; setView({ tx: 0, ty: HUB_Y - 0.12, tz: 0, dist: 6.2 }); }, red ? 0 : 650);
        setTimeout(() => { if (alive && done) done(); }, red ? 60 : 1500);
      },
      spin(id, o) {
        const s = segs.find(x => x.p.id === id) || segs[0];
        /* Ziel: Winkel unter dem Zeiger = Feldmitte ± bis 38 % der Feldbreite; der Winkel wächst (Rad dreht gegen den Uhrzeigersinn) */
        const off = (Math.random() - 0.5) * s.w * 0.76, turns = red ? 1 : 5 + Math.floor(Math.random() * 2);
        let a1 = s.mid + off; while (a1 < S3.ang + turns * TAU) a1 += TAU;
        S3.spin = { t0: performance.now(), D: red ? 900 : o.D || 5200, a0: S3.ang, a1, cur: segAt(S3.ang), onTick: o.onTick, onDone: o.onDone };
        S3.winSeg = s;
      },
      celebrate(col) { S3.celebrate = S3.t; S3.bulbCol = G3.col(hex(col)); if (!red) R.burst({ x: 0, y: HUB_Y + R_WHEEL, z: 0.3, n: 30, speed: 2, up: 2.4, g: -3, life: 1.1, size: 0.06, spread: 0.4, col: [[...G3.col(hex(col)), 1], [1, 1, 1, 1]] }); },
      close() {
        alive = false; cancelAnimationFrame(raf);
        try { meshes.forEach(m => R.free(m)); texs.forEach(t => R.texFree && R.texFree(t)); R.nodes.length = 0; const ext = R.gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); } catch (e) { /* egal */ }
        cv.remove();
      },
      _segs: segs, _state: S3
    };
  }
  return { open, ORDER };
})();
