/* =========================================================================
   LOGISTIKA – fishview.js
   Die Küste in 3D: Kai, Meer, Mole, Leuchtturm, Teepott, Strand und die
   Häuser am Strom. Dazu alles, was sich bewegt – der Kutter, der zu den
   Fangfahrten ausläuft und wieder anlegt, Möwen, die Fähre am Horizont,
   tanzende Bojen, Forellen im Netzgehege, die aus dem Wasser springen –
   und das Angeln am Steg als kleines Geschicklichkeitsspiel.
   Baut auf farmview.js (FV, fnode, fmesh, Effekte, Töne) auf.
   ========================================================================= */

/* ------------------------------ Kulisse ------------------------------- */
function fishStatic() {
  const R = FV.R, W = FFM.WY;
  G3.seed(7300);
  const b = new FM.MB();
  b.merge(FFM.coastLand(), {});
  b.merge(FFM.quay(-46, 14), {});
  b.merge(FFM.beach(14, 72), {});
  /* Weg vom Tor zum Kai und Zufahrt von der Straße */
  b.merge(FM.path(2, 16, 0xd6cfbf), { x: 5, z: 5 });
  b.merge(FM.road(5), { x: 5, z: 15.6 });
  /* weißer Zaun ums Gelände, Lücke fürs Tor */
  b.merge(FFM.picket(16), { x: -5, z: 13 });
  b.merge(FFM.picket(6), { x: 10, z: 13 });
  b.merge(FFM.picket(16.5), { x: -13, z: 4.75, ry: Math.PI / 2 });
  b.merge(FFM.picket(16.5), { x: 13, z: 4.75, ry: Math.PI / 2 });
  /* Promenade mit Laternen, Leuchtturm und Teepott */
  for (let x = 16; x < 64; x += 5) b.merge(FM.lamp(), { x, z: 5.4 });
  b.merge(FFM.lighthouse(), { x: 18.5, z: 3.4 });
  b.merge(FFM.teepott(), { x: 26.5, z: 3.0 });
  /* Strandkörbe in zwei Reihen, Blick aufs Meer */
  G3.seed(7310);
  const korb = [FFM.strandkorb(0x2f6fb0), FFM.strandkorb(0xd83a2e), FFM.strandkorb(0x2f8a4a)];
  for (let x = 33; x < 66; x += 2.3) for (let r = 0; r < 2; r++) {
    if (G3.srand() < 0.25) continue;
    b.merge(korb[Math.floor(G3.srand() * 3)], { x: x + r * 1.1, z: -1.4 + r * 1.7, ry: Math.PI + (G3.srand() - 0.5) * 0.4 });
  }
  /* Dünen mit Strandhafer, dahinter Kiefern */
  for (let i = 0; i < 16; i++) b.merge(FFM.dune(0.8 + G3.srand() * 0.7), { x: 31 + i * 2.4 + G3.srand(), z: 8 + G3.srand() * 2.2, ry: G3.srand() * 6 });
  /* Häuser „Am Strom“ hinter der Straße */
  let hx = -30;
  for (let i = 0; hx < 32; i++) { b.merge(FFM.townHouse(i), { x: hx, z: 22.8 }); hx += 2.9 + (i % 3) * 0.3; }
  /* Hafen im Westen: Speicher, Kisten, Netze */
  b.merge(FFM.warehouse(), { x: -24, z: 2.2 });
  b.merge(FFM.warehouse(), { x: -31, z: 2.2 });
  b.merge(FFM.warehouse(), { x: -38, z: 2.6 });
  b.merge(FFM.fischkisten(), { x: -19.5, z: -2.6 });
  b.merge(FFM.netzgestell(), { x: -16.5, z: -2.2 });
  b.merge(FFM.bojen(), { x: -20.8, z: -2.4 });
  /* Westmole mit Molenfeuer */
  b.merge(FFM.mole(24), { x: -17, z: -4.5 });
  /* Bäume, Büsche, Kiefern ringsum */
  const pine = FM.pine(1.0), pine2 = FM.pine(1.3), lt = FM.leafTree(1.0), bu = FM.bushes();
  const busy = (x, z) => (Math.abs(x) < 14.5 && z < 14.5) || Math.abs(z - 18.5) < 1.8 || (z > 20.3 && z < 26 && Math.abs(x) < 33)
    || (x < -13 && z < 10.5) || (x > 13.5 && z < 7) || (x > 28 && z < 11.5) || z < -3;
  for (let i = 0; i < 380; i++) {
    const x = (G3.srand() - 0.5) * 116, z = -3 + G3.srand() * 60;
    if (busy(x, z)) continue;
    const k = G3.srand(), far = x > 28;
    const p = far ? (k < 0.6 ? pine : pine2) : k < 0.3 ? pine : k < 0.5 ? lt : k < 0.62 ? bu : k < 0.8 ? pine2 : lt;
    b.merge(p, { x, z, ry: G3.srand() * 6.28, s: 0.85 + G3.srand() * 0.4 });
  }
  R.nodes.push(fnode(R.mesh(b)));
  /* Meer mit Wasser-Shader, Schaumsaum am Strand */
  R.nodes.push(fnode(R.mesh(FFM.sea()), { y: W, water: 1, shadow: false }));
  FV.foam = fnode(R.mesh(FFM.surf(14, 72)), { y: W + 0.014, alpha: 0.42, shadow: false });
  R.nodes.push(FV.foam);
  /* Hoftor mit Schild */
  R.nodes.push(fnode(fmesh("gate", FM.gate), { x: 5, z: 13 }));
  /* Kutter (fährt aus und legt an) */
  FV.boat = { node: fnode(fmesh("kutterBoat", () => FFM.kutterBoat()), { y: W, ry: Math.PI }), s: 0, dir: 0, init: false, h: Math.PI };
  R.nodes.push(FV.boat.node);
  /* zwei Kutter der Nachbarn am Westkai */
  FV.moored = [
    fnode(fmesh("kutterBoatG", () => FFM.kutterBoat(0x2f7a4a, 0xf6f5f0, 0x2f6fb0)), { x: -21.5, y: W, z: -5.6, ry: Math.PI / 2 }),
    fnode(fmesh("kutterBoatR", () => FFM.kutterBoat(0x9a2f28, 0xf6f5f0, 0x2b2b30)), { x: -29, y: W, z: -5.6, ry: -Math.PI / 2 })
  ];
  FV.moored.forEach(n => R.nodes.push(n));
  /* Fahrwassertonnen und Fähre */
  FV.cbuoys = [[1.5, -24, false], [9.5, -25.5, true], [-3, -40, false], [5.5, -42, true]].map(([x, z, red]) => {
    const n = fnode(fmesh("cbuoy:" + red, () => FFM.channelBuoy(red)), { x, y: W, z });
    R.nodes.push(n);
    return n;
  });
  FV.ferry = { node: fnode(fmesh("ferry", FFM.ferry), { x: -95, y: W, z: -56, ry: Math.PI / 2 }), x: -95 + Math.random() * 150 };
  R.nodes.push(FV.ferry.node);
  /* Möwen: kreisen über Hafen, Fischhalle und Strand */
  const wingR = fmesh("gullWR", () => FFM.gullWing(1)), wingL = fmesh("gullWL", () => FFM.gullWing(-1)), body = fmesh("gullB", FFM.gullBody);
  FV.gulls = [[7, -8, 4.5, 4.6], [-2, -4, 6, 5.4], [14, 0, 3.5, 4.2], [30, -3, 7, 4.8], [-22, -8, 5, 5.6], [3, -14, 8, 6.2]].map(([cx, cz, r, h], i) => {
    const n = fnode(body, { s: 0.85 });
    const wr = R.addChild(n, fnode(wingR, { x: 0.07, y: 0.03 })), wl = R.addChild(n, fnode(wingL, { x: -0.07, y: 0.03 }));
    R.nodes.push(n);
    return { n, wr, wl, cx, cz, r, h, a: Math.random() * 6.28, sp: (0.25 + Math.random() * 0.15) * (i % 2 ? 1 : -1), ph: Math.random() * 6 };
  });
  FV.jumps = [];
  FV.gullAt = 0;
}

/* --------------------------- Der Kutter ------------------------------- */
function kutterObj() { return S.farm.objs.find(o => o.t === "kutter") || null; }
/* Fahrweg vom Liegeplatz aufs Meer (Weltkoordinaten) */
function boatPath(o) {
  const [cx, cz] = farmCenter(o);
  const hx = cx - 0.3, hz = cz - 0.2;
  const pts = [[hx, hz], [hx, hz - 5], [hx - 3, hz - 16], [hx - 10, hz - 40], [hx - 14, hz - 64]];
  let L = 0;
  const seg = pts.slice(1).map((p, i) => { const d = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]); L += d; return d; });
  return { pts, seg, L };
}
function boatAt(P, s) {
  let k = 0, r = s;
  while (k < P.seg.length - 1 && r > P.seg[k]) { r -= P.seg[k]; k++; }
  const a = P.pts[k], b = P.pts[k + 1], f = Math.min(1, r / P.seg[k]);
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, b[0] - a[0], b[1] - a[1]];
}
function boatDocked() { return !FV.boat || FV.boat.s < 0.05; }
function stepBoat(dt, time) {
  const B = FV.boat, o = kutterObj();
  if (!B || !o) return;
  machUpdate(o);
  /* Zeitraffer-Fahrt im Rundgang: die Hertha bleibt liegen */
  const away = o.q.some(j => !j.tut);
  const P = boatPath(o);
  if (!B.init) { B.init = true; B.s = away ? P.L : 0; }
  if (away && B.dir !== 1 && B.s < P.L) { if (B.s < 0.05) sfx("horn"); B.dir = 1; }
  if (!away && B.s > 0) B.dir = -1;
  if (B.dir) {
    /* langsam am Kai, draußen mit voller Fahrt; heim geht’s mit vollen Kisten flott */
    const v = (0.7 + Math.min(3.8, Math.min(B.s, P.L - B.s + 2) * 0.35)) * (B.dir < 0 && o.done.length ? 2.6 : 1);
    B.s = clamp(B.s + B.dir * v * dt, 0, P.L);
    if (B.s >= P.L && B.dir > 0) B.dir = 0;
    if (B.s <= 0 && B.dir < 0) {
      B.dir = 0;
      sfx("horn");
      FV.gullAt = time;
      const [cx, cz] = farmCenter(o);
      splash(cx - 0.3, cz - 1.5, 10);
    }
  }
  const [x, z, dx, dz] = boatAt(P, B.s);
  const n = B.node;
  n.visible = B.s < P.L - 0.5;
  n.x = x; n.z = z;
  if (B.dir) {
    const want = Math.atan2(dx * B.dir, dz * B.dir);
    let d = want - B.h; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283;
    B.h += d * Math.min(1, dt * 1.6);
    /* Kielwasser und Abgas */
    if (Math.random() < dt * 22) {
      const sx = x - Math.sin(B.h) * 2.3, sz = z - Math.cos(B.h) * 2.3;
      FV.R.emit({ x: sx + (Math.random() - 0.5) * 0.6, y: FFM.WY + 0.03, z: sz + (Math.random() - 0.5) * 0.6, vx: -Math.sin(B.h) * 0.3, vz: -Math.cos(B.h) * 0.3, life: 2.2, size: 0.2, size2: 0.9, col: [0.95, 0.98, 1, 0.5], drag: 0.4 });
    }
    if (Math.random() < dt * 6) FV.R.emit({ x: x - Math.sin(B.h) * 1.45 - Math.cos(B.h) * 0.35, y: FFM.WY + 1.7, z: z - Math.cos(B.h) * 1.45, vy: 0.6, life: 1.6, size: 0.1, size2: 0.4, col: [0.35, 0.35, 0.38, 0.5], drag: 0.3 });
  }
  n.ry = B.h;
  n.y = FFM.WY + Math.sin(time * 1.3) * 0.03;
  n.rz = Math.sin(time * 0.9) * 0.035 + (B.dir ? 0.02 : 0);
  n.rx = Math.sin(time * 1.1) * 0.02;
}

/* ----------------------- Möwen, Fähre, Bojen ------------------------- */
function stepCoast(dt, time) {
  const B = FV.boat;
  const k = FV.gullAt && time - FV.gullAt < 9;
  (FV.gulls || []).forEach((g, i) => {
    let cx = g.cx, cz = g.cz, r = g.r, h = g.h;
    /* frisch angelegt: die Möwen wollen auch was vom Fang */
    if (k && i < 4 && B) { cx = B.node.x; cz = B.node.z; r = 1.8 + i * 0.5; h = 2.8 + i * 0.4; }
    g.a += g.sp * dt * (k ? 2.2 : 1);
    const tx = cx + Math.cos(g.a) * r, tz = cz + Math.sin(g.a) * r * 0.8, ty = h + Math.sin(g.a * 2 + g.ph) * 0.35;
    const n = g.n;
    n.x += (tx - n.x) * Math.min(1, dt * 1.5); n.z += (tz - n.z) * Math.min(1, dt * 1.5); n.y += (ty - n.y) * Math.min(1, dt * 1.5);
    n.ry = g.a + (g.sp > 0 ? 0 : Math.PI);
    n.rz = (g.sp > 0 ? -1 : 1) * 0.25;
    /* abwechselnd schlagen und gleiten */
    const flap = Math.sin(time * 0.6 + g.ph) > 0.2 || k;
    const w = flap ? Math.sin(time * 9 + g.ph) * 0.65 : 0.12 + Math.sin(time * 1.5 + g.ph) * 0.05;
    g.wr.rz = w; g.wl.rz = -w;
  });
  if (FV.ferry) {
    const F = FV.ferry;
    F.x += dt * 1.1;
    if (F.x > 95) F.x = -95;
    F.node.x = F.x;
    F.node.y = FFM.WY + Math.sin(time * 0.5) * 0.02;
  }
  (FV.cbuoys || []).forEach((n, i) => { n.y = FFM.WY + Math.sin(time * 1.4 + i) * 0.05; n.rz = Math.sin(time * 1.1 + i * 2) * 0.12; n.rx = Math.cos(time * 0.9 + i) * 0.08; });
  (FV.moored || []).forEach((n, i) => { n.y = FFM.WY + Math.sin(time * 1.2 + i * 2) * 0.025; n.rz = Math.sin(time * 0.8 + i) * 0.03; });
  /* Bojen an Reusen und Leinen schaukeln */
  for (const o of S.farm.objs) {
    if (o.t !== "pot" && o.t !== "mline") continue;
    const e = FV.nodes.get(o.id);
    if (!e) continue;
    if (o.t === "pot" && e.parts.st) { e.parts.st.y = Math.sin(time * 1.7 + o.id) * 0.025; e.parts.st.rz = Math.sin(time * 1.3 + o.id) * 0.05; }
    if (o.t === "mline" && !FV.bounce.has(o.id)) e.node.y = Math.sin(time * 1.2 + o.id) * 0.018;
  }
  /* ab und zu ein Möwenschrei */
  if (time - (FV.gullCry || 0) > 22 + Math.random() * 30) { FV.gullCry = time; if (Math.random() < 0.6) sfx("gull"); }
}

/* --------------------------- Forellen ---------------------------------- */
function stepFish(s, o, a, st, dt, time) {
  const ar = penArea(o), n = s.node;
  if (s.y != null) {                          /* frisch eingesetzt: platscht ins Gehege */
    s.vy -= 14 * dt; s.y += s.vy * dt;
    if (s.y <= FFM.WY) { s.y = null; splash(s.x, s.z, 16); }
    else { n.x = s.x; n.z = s.z; n.y = s.y; n.rx = 0.6; return; }
  }
  const fr = s.frenzy && time - s.frenzy < 2.5;
  const sp = fr ? 1.4 : st === "hungry" ? 0.22 : st === "ready" ? 0.5 : 0.38;
  s.ang += s.dir * sp * dt / Math.max(0.4, s.rad);
  s.rad = clamp(s.rad + Math.sin(time * 0.37 + s.id * 1.7) * 0.15 * dt, 0.35, Math.max(0.45, ar.R));
  s.x = ar.cx + Math.cos(s.ang) * s.rad; s.z = ar.cz + Math.sin(s.ang) * s.rad;
  s.h = Math.atan2(-Math.sin(s.ang) * s.dir, Math.cos(s.ang) * s.dir);
  n.x = s.x; n.z = s.z; n.ry = s.h; n.rx = 0;
  n.y = FFM.WY - 0.03 + Math.sin(time * 2.4 + s.id) * 0.012 + (fr ? 0.02 : 0);
  n.rz = Math.sin(time * 6 + s.id) * 0.08;
  if (fr && Math.random() < dt * 10) FV.R.emit({ x: s.x + (Math.random() - 0.5) * 0.5, y: FFM.WY + 0.03, z: s.z + (Math.random() - 0.5) * 0.5, vy: 1.2, g: -6, life: 0.4, size: 0.05, col: [0.9, 0.97, 1, 0.85] });
  if (Math.random() < dt * (st === "ready" ? 0.35 : fr ? 0.5 : 0.04)) fishJump(s.x, s.z, s.h);
  /* Kreise auf dem Wasser verraten den Schwarm */
  if (Math.random() < dt * 1.2) FV.R.emit({ x: s.x, y: FFM.WY + 0.03, z: s.z, life: 1.4, size: 0.08, size2: 0.55, col: [0.85, 0.95, 1, 0.28], drag: 0 });
  /* fertig: eine Kiste Forellen steht auf dem Steg des Geheges */
  s.pn.visible = st === "ready";
  if (s.pn.visible) {
    const a2 = 1.4 + (s.id % 5) * 0.32;
    s.pn.x = ar.cx + Math.cos(a2) * (ar.R + 0.55); s.pn.z = ar.cz + Math.sin(a2) * (ar.R + 0.55);
    s.pn.y = FFM.WY + 0.13 + Math.abs(Math.sin(time * 3 + s.id)) * 0.03; s.pn.ry = -a2;
  }
}
/* ein Fisch springt in einem Bogen aus dem Wasser */
function fishJump(x, z, h, opt) {
  if (!FV.R || !FV.jumps) return;
  const o = opt || {};
  const n = fnode(fmesh("trout", () => FFM.trout(1)), { x, y: FFM.WY, z, s: o.s || 1.1 });
  FV.R.nodes.push(n);
  const len = o.len || 0.8 + Math.random() * 0.4;
  const t0 = (performance.now() - FV.t0) / 1000;
  FV.jumps.push({ n, x0: x, z0: z, x1: o.x1 != null ? o.x1 : x + Math.sin(h) * len, z1: o.z1 != null ? o.z1 : z + Math.cos(h) * len,
    y1: o.y1 != null ? o.y1 : FFM.WY, h: o.h || 0.5 + Math.random() * 0.25, t0, dur: o.dur || 0.75, done: o.done, end: !!o.y1 });
  splash(x, z, 8);
}
function stepJumps(time) {
  const J = FV.jumps || [];
  for (let k = J.length - 1; k >= 0; k--) {
    const j = J[k], f = (time - j.t0) / j.dur, n = j.n;
    if (f >= 1) {
      const i = FV.R.nodes.indexOf(n); if (i >= 0) FV.R.nodes.splice(i, 1);
      if (!j.end) splash(j.x1, j.z1, 10);
      if (j.done) j.done();
      J.splice(k, 1);
      continue;
    }
    n.x = j.x0 + (j.x1 - j.x0) * f; n.z = j.z0 + (j.z1 - j.z0) * f;
    n.y = FFM.WY + (j.y1 - FFM.WY) * f + Math.sin(f * Math.PI) * j.h;
    n.ry = Math.atan2(j.x1 - j.x0, j.z1 - j.z0);
    n.rx = (f - 0.5) * 2.2;
    n.rz = Math.sin(time * 30) * 0.15;
  }
}

/* ------------------------------ Angeln --------------------------------
   Auswerfen kostet einen Köder. Der Schwimmer zuckt manchmal nur (nicht
   ziehen!), taucht er richtig ab, bleibt knapp eine Sekunde zum Anschlagen. */
function stegObj() { return FV.angel ? farmObj(FV.angel.id) : null; }
function rodTip(o, rx) {
  const [cx, cz] = farmCenter(o), L = FFM.ROD_TIP;
  return [cx, 0.52 - Math.sin(rx) * L, cz - 2.48 - Math.cos(rx) * L];
}
function openAngel(o) {
  closeFarmPop();
  FV.sel = null;
  if (FV.angel && FV.angel.id === o.id) return;
  closeAngel();
  FV.angel = { id: o.id, phase: "idle", t: 0, rx: ROD_REST };
  const [cx, cz] = farmCenter(o);
  farmFocusXZ(cx - 0.5, cz - 2.6, innerHeight > innerWidth ? 17 : 15);
  renderAngel("Wirf die Angel aus und warte, bis der Schwimmer richtig abtaucht – dann schnell anschlagen! Zuckt er nur, noch nicht ziehen.");
}
function closeAngel() {
  const A = FV.angel;
  if (!A) return;
  [A.bob, A.line].forEach(n => { if (n && FV.R) { const i = FV.R.nodes.indexOf(n); if (i >= 0) FV.R.nodes.splice(i, 1); } });
  const o = stegObj(), e = o && FV.nodes.get(o.id);
  if (e && e.parts.rod) e.parts.rod.rx = ROD_REST;
  FV.angel = null;
  const el = $("#farmAngel");
  if (el) { el.className = ""; el.innerHTML = ""; }
}
function renderAngel(msg, cls) {
  const el = $("#farmAngel"), A = FV.angel;
  if (!el || !A) return;
  const ph = A.phase, k = farmInv("koeder");
  const btn = ph === "idle" ? `<button class="btn fa-go" id="faGo"${k ? "" : " disabled"}>🎣 Auswerfen<small>1 Köder</small></button>`
    : ph === "bite" ? `<button class="btn fa-go hot" id="faGo">❗ Jetzt ziehen!</button>`
    : ph === "reel" || ph === "cast" ? `<button class="btn fa-go" id="faGo" disabled>…</button>`
    : `<button class="btn fa-go ghost" id="faGo">⏳ Warten …<small>antippen = einholen</small></button>`;
  el.className = "on" + (ph === "bite" ? " bite" : "");
  el.innerHTML = `<div class="fa-box"><button class="fa-x" id="faX" aria-label="schließen">✕</button>
    <div class="fa-h">🎣 Angelsteg<small>${FITEMS.koeder.i} ${famt("koeder", k)} Köder · ${S.farm.stats.angel || 0} Fische gefangen</small></div>
    ${msg != null ? `<div class="fa-msg ${cls || ""}" id="faMsg">${msg}</div>` : `<div class="fa-msg" id="faMsg">${A.msg || ""}</div>`}
    ${btn}${k ? "" : `<div class="fa-tip">Keine Köder: Die Futterküche macht welche aus Fischabfällen – oder im Laden unter „Einkauf“.</div>`}</div>`;
  if (msg != null) { A.msg = msg; }
  $("#faX").onclick = closeAngel;
  $("#faGo").onclick = angelPress;
}
function angelPress() {
  const A = FV.angel, o = stegObj();
  if (!A || !o) return;
  const time = (performance.now() - FV.t0) / 1000;
  if (A.phase === "idle") {
    if (!farmAngelCast()) { sfx("bad"); renderAngel("Keine Köder mehr im Netzspeicher.", "bad"); return; }
    A.phase = "cast"; A.t0 = time;
    const [cx, cz] = farmCenter(o);
    A.target = [cx + (Math.random() - 0.5) * 1.6, cz - 4.2 - Math.random() * 1.8];
    if (!A.bob) { A.bob = fnode(fmesh("bobber", FFM.bobber), { visible: false }); FV.R.nodes.push(A.bob); }
    if (!A.line) { A.line = fnode(fmesh("line", FFM.lineSeg), { visible: false, shadow: false }); FV.R.nodes.push(A.line); }
    sfx("cast");
    renderAngel("Ausgeworfen … jetzt Geduld.");
    save();
    return;
  }
  if (A.phase === "bite") {
    A.phase = "reel"; A.t0 = time;
    const r = farmAngelCatch();
    sfx("reel");
    const [tx, , tz] = rodTip(o, ROD_REST);
    if (r.full) { renderAngel("Das Kühlhaus ist voll – der Fisch schwimmt wieder davon.", "bad"); return; }
    if (r.junk) {
      const p = FV.R.project(A.target[0], 0.3, A.target[1]);
      if (p) { floatText(p[0], p[1] - 20, r.i + (r.m ? " +" + eur(r.m) : ""), r.m ? "gold" : ""); xpFly(p[0], p[1], r.xp || 1); }
      splash(A.target[0], A.target[1], 10);
      renderAngel("Oh – " + r.junk + "! " + (r.m ? "Darin steckt ein Zettel und " + eur(r.m) + " Finderlohn." : "Na ja, auch was gefangen."), "");
    } else {
      fishJump(A.target[0], A.target[1], 0, { x1: tx, z1: tz + 0.4, y1: 0.4, h: 1.1, dur: 0.85, s: r.id === "dorsch" ? 1.6 : r.id === "hering" ? 1.0 : 1.25, done: () => {
        const p = FV.R.project(tx, 0.6, tz);
        if (p) { flyItem(FITEMS[r.id].i, p[0], p[1], storeBtn(), 0, 1); floatText(p[0], p[1] - 24, "+" + famt(r.id, 1) + " " + FITEMS[r.id].i + " · " + qStars(r.q), "gold"); xpFly(p[0], p[1], r.xp); }
        sfx("collect");
      } });
      const nm = r.name || ({ hering: "ein Hering", dorsch: "ein Dorsch", forelle: "eine Forelle", krabbe: "eine Krabbe" }[r.id] || FITEMS[r.id].n);
      renderAngel("Petri Heil! " + nm.charAt(0).toUpperCase() + nm.slice(1) + " hängt am Haken.", "ok");
    }
    save();
    return;
  }
  if (A.phase === "wait") {
    /* zu früh gezogen: Köder weg */
    A.phase = "reel"; A.t0 = time; A.miss = true;
    sfx("bad");
    renderAngel("Zu früh angeschlagen – der Köder ist weg. Warte, bis der Schwimmer richtig abtaucht.", "bad");
  }
}
function stepAngel(dt, time) {
  const A = FV.angel;
  if (!A) return;
  const o = stegObj();
  if (!o) { closeAngel(); return; }
  const e = FV.nodes.get(o.id);
  const rod = e && e.parts.rod;
  let rx = ROD_REST, bobPos = null;
  if (A.phase === "cast") {
    const f = (time - A.t0) / 0.9;
    rx = f < 0.35 ? ROD_REST - f / 0.35 * 0.75 : ROD_REST - 0.75 + Math.min(1, (f - 0.35) / 0.25) * 1.0;
    const tip = rodTip(o, rx);
    if (f > 0.4) {
      const g = Math.min(1, (f - 0.4) / 0.6);
      bobPos = [tip[0] + (A.target[0] - tip[0]) * g, tip[1] + (FFM.WY - tip[1]) * g + Math.sin(g * Math.PI) * 1.2, tip[2] + (A.target[1] - tip[2]) * g];
    } else bobPos = tip;
    if (f >= 1) {
      A.phase = "wait"; A.t0 = time;
      A.bite = time + 2.2 + Math.random() * 3.6;
      A.nibble = Math.random() < 0.6 ? A.t0 + 0.8 + Math.random() * Math.max(0.3, A.bite - A.t0 - 1.6) : null;
      splash(A.target[0], A.target[1], 8);
      renderAngel(null);
    }
  } else if (A.phase === "wait" || A.phase === "bite") {
    let y = FFM.WY + Math.sin(time * 2.2) * 0.012;
    if (A.phase === "wait") {
      rx = ROD_REST + 0.25;
      if (A.nibble && time > A.nibble && time < A.nibble + 0.35) {
        y -= Math.abs(Math.sin((time - A.nibble) * 18)) * 0.035;
        if (!A.nibbled) { A.nibbled = true; FV.R.emit({ x: A.target[0], y: FFM.WY + 0.01, z: A.target[1], life: 0.6, size: 0.1, size2: 0.4, col: [0.95, 0.98, 1, 0.4] }); }
      }
      if (time >= A.bite) {
        A.phase = "bite"; A.t0 = time;
        sfx("bite");
        if (navigator.vibrate) try { navigator.vibrate(80); } catch (err) { /* egal */ }
        splash(A.target[0], A.target[1], 10);
        renderAngel("Biss! Schnell ziehen!", "hot");
      }
    } else {
      const f = time - A.t0;
      y -= 0.09 + Math.sin(time * 26) * 0.02;
      rx = ROD_REST + 0.45 + Math.sin(time * 30) * 0.04;
      if (Math.random() < dt * 25) FV.R.emit({ x: A.target[0] + (Math.random() - 0.5) * 0.2, y: FFM.WY + 0.02, z: A.target[1] + (Math.random() - 0.5) * 0.2, vy: 1.0, g: -6, life: 0.4, size: 0.05, col: [0.9, 0.97, 1, 0.85] });
      if (f > 1.0) {
        A.phase = "reel"; A.t0 = time; A.miss = true;
        sfx("bad");
        renderAngel("Weg ist er! Der Köder ist ab – nochmal versuchen?", "bad");
      }
    }
    bobPos = [A.target[0], y, A.target[1]];
  } else if (A.phase === "reel") {
    const f = Math.min(1, (time - A.t0) / 0.8);
    rx = ROD_REST - 0.5 * Math.sin(f * Math.PI);
    const tip = rodTip(o, rx);
    bobPos = [A.target[0] + (tip[0] - A.target[0]) * f, FFM.WY + (tip[1] - FFM.WY) * f * f, A.target[1] + (tip[2] - A.target[1]) * f];
    if (f >= 1) {
      A.phase = "idle"; A.nibbled = false; A.miss = false;
      renderAngel(null);
    }
  }
  if (rod) rod.rx += (rx - rod.rx) * Math.min(1, dt * 14);
  const show = !!bobPos && A.phase !== "idle";
  if (A.bob) { A.bob.visible = show; if (bobPos) { A.bob.x = bobPos[0]; A.bob.y = bobPos[1]; A.bob.z = bobPos[2]; } }
  if (A.line) {
    A.line.visible = show;
    if (show && rod) {
      const t = rodTip(o, rod.rx);
      const dx = bobPos[0] - t[0], dy = bobPos[1] + 0.05 - t[1], dz = bobPos[2] - t[2], L = Math.hypot(dx, dy, dz) || 0.01;
      A.line.x = t[0]; A.line.y = t[1]; A.line.z = t[2];
      A.line.ry = Math.atan2(dx, dz);
      A.line.rx = -Math.asin(clamp(dy / L, -1, 1));
      A.line.sx = A.line.sy = 1; A.line.sz = L;
    }
  }
}
/* Kamera auf einen Punkt schwenken */
function farmFocusXZ(x, z, dist) {
  if (!FV.R) return;
  const c = FV.R.cam, s = { tx: c.tx, tz: c.tz, d: c.dist };
  const t0 = performance.now(), id = (FV.focusId || 0) + 1;
  FV.focusId = id; FV.focusing = true;
  const step = () => {
    if (FV.focusId !== id) return;
    const k = Math.min(1, (performance.now() - t0) / 650), f = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    c.tx = s.tx + (x - s.tx) * f; c.tz = s.tz + (z - s.tz) * f; c.dist = s.d + (dist - s.d) * f;
    clampCam();
    if (k < 1) requestAnimationFrame(step); else FV.focusing = false;
  };
  step();
}

/* ------------------------------ Takt ---------------------------------- */
function fishStep(dt, time) {
  stepBoat(dt, time);
  stepCoast(dt, time);
  stepJumps(time);
  stepAngel(dt, time);
}

/* ------------------------ Linas Rundgang am Kai ------------------------ */
const FTUT_FISCH = [
  { tx: () => `Moin, ${esc(S.player.name)}! Ich bin Lina. Tante Gesche hat mich jahrelang ihren Fisch ausfahren lassen – und jetzt gehört die Fischerei dir. Komm, ich zeig dir alles.` },
  { tx: "Zwei Reusen sind voller Krabben! <b>Tipp eine volle Reuse an und zieh den Haken über die vollen Reusen.</b>", target: () => firstObj(o => o.t === "pot" && potState(o) === "ripe"), wait: "harvest:krabbe", n: 2, calls: true },
  { tx: "Klasse! Der Fang kommt ins Kühlhaus – und für fast alles gibt es ⭐ <b>Erfahrungspunkte (EP)</b>; der Balken oben zeigt, wie weit es bis zum nächsten Level ist. Jetzt neue Köder rein: <b>Tipp eine leere Reuse an und zieh den Köder über die leeren Reusen.</b>", target: () => firstObj(o => o.t === "pot" && potState(o) === "empty"), wait: "bait", n: 2 },
  { tx: "Die Muschelleine ist erntereif. <b>Tipp sie an</b> – mit etwas Glück steckt eine Perle drin!", target: () => firstObj(o => o.t === "mline" && treeRipe(o)) || firstObj(o => o.t === "mline"), wait: "harvest:muschel", n: 1, calls: true },
  { tx: "Im Netzgehege ist ein Forellenschwarm groß genug. <b>Tipp das Gehege an</b> und fisch ihn ab.", target: () => firstObj(o => o.t === "netz"), wait: "collect:forelle", n: 1 },
  { tx: "Die anderen Forellen haben Hunger. <b>Tipp das Gehege an und zieh das Fischfutter über die Fische.</b> Je mehr Platz sie haben, desto besser die Ware.", target: () => firstObj(o => o.t === "netz"), wait: "feed", n: 1 },
  { tx: "Jetzt geht’s raus! <b>Tipp den Kutter an und schick ihn zum Heringsfang.</b> Tante Gesche hat ihn schon klargemacht – den Diesel zahlst du beim Ablegen.", target: () => firstObj(o => o.t === "kutter"), wait: "queue:hering", n: 1 },
  { tx: "Zack – die erste Fahrt läuft im Zeitraffer: Die Hertha ist schon mit vollen Kisten zurück. <b>Tipp den Kutter an und lade den Fang aus.</b> Später ist sie dafür eine Weile draußen auf See.", target: () => firstObj(o => o.t === "kutter"), wait: "make:hering", n: 1, calls: true },
  { tx: "Frischer Hering! Ein Teil davon wird geräuchert. <b>Tipp die Räucherei an und räuchere Bücklinge.</b>", target: () => firstObj(o => o.t === "smoke"), wait: "queue:buckling", n: 1 },
  { tx: "Die Bücklinge sind goldbraun – <b>tipp die Räucherei an und hol sie raus.</b>", target: () => firstObj(o => o.t === "smoke"), wait: "make:buckling", n: 1, calls: true },
  { tx: "Die Fischbude Am Strom wartet auf Bücklinge und Krabben. <b>Tipp die Bestelltafel an und schick die Lieferung los.</b>", target: () => firstObj(o => o.t === "board"), wait: "send", n: 1, before: farmTutOrder },
  { tx: "Unterwegs! Auf der Karte siehst du die Fahrt, bei Ankunft gibt’s Geld und EP. Oben links liegt jetzt <b>Tante Gesches Logbuch</b>: drei Kapitel, Aufgabe für Aufgabe. Und am <b>Angelsteg</b> kannst du selbst die Rute auswerfen – probier’s mal! Mehr Reusen, Leinen und Gebäude gibt’s im 🛒 Laden. Viel Spaß!" }
];
