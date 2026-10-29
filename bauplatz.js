/* =========================================================================
   LOGISTIKA – bauplatz.js (v188)
   Abgelegtes Baumaterial liegt sichtbar und geordnet am Bauplatz.
   Spielstand: S.farm.depot[Bauplatz][Ware] = Gebinde (farm.js, v186). Hier wird
   nur gezeichnet – je Material ein fester Stapel auf Kanthölzern, die Plätze
   sind nach der Bauliste reserviert (nichts verrutscht, wenn mehr dazukommt).
   Beim Ablegen fährt die Kamera hin und die Gebinde landen nacheinander auf
   ihrem Stapel; beim Bauen wird der Stapel sichtbar verbraucht.
   Bauplätze mit Ort: Hütte am See, Hochsitz, Fischerei-Bauplätze, Sägewerk
   (Reparaturen und Halle Stufe 2 vor der Halle, Kessel, Unimog). Der Hof-Ausbau
   hat keinen festen Platz – dort wird nur abgelegt, nicht gezeichnet.
   Modelle der Waren: SWK.UNIT (sawwerk.js), gleicher Look wie im Sägewerk.
   ========================================================================= */
const SITE3D = (() => {
  "use strict";
  const PI = Math.PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const cl = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const hs = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const LOGS = new Set(["kiefer", "birke", "buche", "eiche", "edelholz"]);
  const MAXH = 1.0, GAP = 0.26;
  const W = { R: null, G: {}, fly: [], gone: [] };

  /* --------------------------- Bauliste je Platz --------------------------- */
  function needOf(key) {
    if (key === "rent") return typeof RENT !== "undefined" ? RENT.NEED : null;
    if (key === "hunt") return typeof HUNT !== "undefined" ? HUNT.NEED : null;
    if (key.startsWith("saw:")) { const id = key.slice(4); if (typeof FSAW_LKW !== "undefined" && id === FSAW_LKW.id) return FSAW_LKW.need; const r = typeof FSAW_REPAIRS !== "undefined" && FSAW_REPAIRS.find(x => x.id === id); return r ? r.need : null; }
    if (key.startsWith("up:")) { const U = typeof FSAW_UPGRADES !== "undefined" && FSAW_UPGRADES[key.slice(3)]; return U ? U.need : null; }
    if (typeof FFISHERY !== "undefined" && FFISHERY[key]) return FFISHERY[key].need;
    return null;
  }
  /* Ort: Mitte (Welt), Drehung wie die Knoten (ry), Reihen in lokalen Koordinaten: { z, cx, maxW } – Stapel liegen längs z */
  function anchor(key) {
    const obj = t => S.farm.objs.find(o => o.t === t);
    const of = (o, rows) => { if (!o) return null; const [x, z] = farmCenter(o); return { x, z, ry: o.r ? (o.t === "sw_lkw" ? PI / 2 : -PI / 2) : 0, rows }; };
    if (key === "rent" && typeof RENT !== "undefined") return { x: RENT.H.x, z: RENT.H.z, ry: RENT.H.ry, rows: [{ z: 6.4, cx: 0.7, maxW: 6.2 }] };     /* v192: etwas weiter vor, frei vom Pfad */
    if (key === "hunt" && typeof HUNT !== "undefined") return { x: HUNT.TW.x, z: HUNT.TW.z, ry: HUNT.TRY, rows: [{ z: -0.86, cx: 0.0, maxW: 2.7 }, { z: 0.76, cx: 0.35, maxW: 2.3 }] };     /* innerhalb des Absperrbands (±1,5) */
    if (key.startsWith("saw:")) {
      if (key === "saw:lkw") return of(obj("sw_lkw"), [{ z: 0.2, cx: -2.25, maxW: 1.2 }]);
      return of(obj("sw_halle"), [{ z: 3.75, cx: 1.6, maxW: 4.4 }]);
    }
    if (key === "up:saege2") return of(obj("sw_halle"), [{ z: 3.75, cx: -2.9, maxW: 3.0 }]);
    if (key === "up:kessel2") return of(obj("kessel"), [{ z: 2.15, cx: -0.75, maxW: 1.2 }]);      /* neben der Tür */
    if (typeof FFISHERY !== "undefined" && FFISHERY[key]) {
      const p = S.farm.objs.find(o => o.t === "f_plot" && o.k === key);
      if (!p) return null;
      const [w, d] = farmSize(p);
      /* landseitig (Norden, −z) in Reihen über die Breite des Platzes */
      return of(p, [{ z: -d / 2 + 0.78, cx: 0, maxW: w - 0.35 }, { z: -d / 2 + 2.05, cx: 0, maxW: w - 0.35 }]);
    }
    return null;
  }
  const toWorld = (A, lx, lz) => { const c = Math.cos(A.ry), s = Math.sin(A.ry); return [A.x + c * lx + s * lz, A.z - s * lx + c * lz]; };

  /* ------------------------------ Stapel ----------------------------------- */
  /* Lage jedes Gebindes im Stapel (lokal zum Stapelplatz, Länge entlang z): logs als Pyramide, sonst übereinander, dann daneben */
  function bundles(id, n) {
    const U = SWK.UNIT[id] || SWK.UNIT.bretter, out = [];
    if (LOGS.has(id)) {
      const r = U.h / 1.7, d = r * 2.02;
      let k = 1; while (k * (k + 1) / 2 < n) k++;
      for (let row = 0, i = 0; row < k && i < n; row++) for (let j = 0; j < k - row && i < n; j++, i++)
        out.push({ x: (j - (k - row - 1) / 2) * d, y: row * r * 1.72, z: (hs(i, 3) - 0.5) * 0.06 });
      return { list: out, w: k * d, h: k * r * 1.72 };
    }
    const cols = Math.ceil(n / Math.max(1, Math.floor(MAXH / U.h))), per = Math.ceil(n / cols), w = U.fp[1];   /* gleich hohe Stapel */
    for (let i = 0; i < n; i++) { const c = Math.floor(i / per), L = i % per; out.push({ x: (c - (cols - 1) / 2) * (w + 0.05), y: L * U.h, z: (hs(i, 5) - 0.5) * 0.05, ry: (hs(i, 7) - 0.5) * 0.06 }); }
    return { list: out, w: cols * (w + 0.05) - 0.05, h: Math.min(n, per) * U.h };
  }
  /* Plätze der Stapel nach der Bauliste (volle Menge) – Reihen füllen, je Reihe mittig */
  function layout(key) {
    const need = needOf(key), A = anchor(key);
    if (!need || !A) return null;
    const rows = A.rows.map(r => ({ r, ids: [], w: 0 }));
    let ri = 0;
    Object.keys(need).forEach(id => {
      const w = bundles(id, need[id]).w;
      while (ri < rows.length - 1 && rows[ri].ids.length && rows[ri].w + GAP + w > rows[ri].r.maxW) ri++;
      const R0 = rows[ri]; R0.w += (R0.ids.length ? GAP : 0) + w; R0.ids.push({ id, w });
    });
    const slots = {};
    /* v192: Werkzeugplatz neben der ersten Reihe, wenn dort Platz ist (die Hütte am See hat ihren eigenen in rent.js) */
    const R1 = rows[0], tools = key !== "rent" && R1.w + 1.4 <= R1.r.maxW ? { x: R1.r.cx + R1.w / 2 + 0.45, z: R1.r.z } : null;
    rows.forEach(R0 => { let x = R0.r.cx - R0.w / 2; R0.ids.forEach(({ id, w }) => { slots[id] = { x: x + w / 2, z: R0.r.z, w }; x += w + GAP; }); });
    return { A, need, slots, tools };
  }
  /* ein Gebinde an seiner Stelle bauen (Waren sind entlang x gebaut → um 90° gedreht, damit sie längs z liegen) */
  function unitAt(b, id, p) { b.at({ x: p.x, y: p.y, z: p.z, ry: PI / 2 + (p.ry || 0) }, m => (SWK.UNIT[id] || SWK.UNIT.bretter).fn(m)); }
  function stackMesh(id, full, n) {
    return fmesh("site:" + id + ":" + full + ":" + n, () => {
      const b = new G3.MB(), L = bundles(id, full).list;
      /* zwei Kanthölzer quer unter dem Stapel – auch für Stämme */
      const bw = bundles(id, full).w + 0.12;
      [-0.38, 0.38].forEach(z => b.box(bw, 0.05, 0.07, 0x7d5f40, { z, top: 0x8f6e4a }));
      for (let i = 0; i < n; i++) unitAt(b, id, Object.assign({}, L[i], { y: L[i].y + 0.05 }));
      return b;
    });
  }
  const unitMesh = id => fmesh("site:u:" + id, () => { const b = new G3.MB(); unitAt(b, id, { x: 0, y: 0, z: 0 }); return b; });

  /* --------------------------------- Welt ---------------------------------- */
  function attach(R) { W.R = R; W.G = {}; W.fly = []; W.gone = []; sync(); }
  function group(key, L) {
    let g = W.G[key];
    if (g && g.root.R !== W.R) g = null;
    if (!g) {
      g = W.G[key] = { key, root: fnode(null, { x: L.A.x, z: L.A.z, ry: L.A.ry }), st: {}, pend: {}, L };
      g.root.R = W.R;
      W.R.nodes.push(g.root);
    }
    g.L = L; g.root.x = L.A.x; g.root.z = L.A.z; g.root.ry = L.A.ry;
    return g;
  }
  function dropGroup(g) { const i = W.R ? W.R.nodes.indexOf(g.root) : -1; if (i >= 0) W.R.nodes.splice(i, 1); delete W.G[g.key]; }
  function sync() {
    if (!W.R || !S.farm) return;
    const D = S.farm.depot || {};
    /* Bauplatz leer (gebaut): Stapel werden verbraucht */
    for (const key in W.G) { const d = D[key]; if (!d || !Object.keys(d).some(id => d[id] > 0)) consume(W.G[key]); }
    for (const key in D) {
      const d = D[key];
      if (!d || !Object.keys(d).some(id => d[id] > 0)) continue;
      const L = layout(key);
      if (!L) continue;
      const g = group(key, L);
      for (const id in d) {
        const slot = L.slots[id];
        if (!slot || !(d[id] > 0)) continue;
        const full = L.need[id] || d[id], P = g.pend[id];
        const n = Math.min(full, P ? P.shown : d[id]);
        let s = g.st[id];
        if (!s) { s = g.st[id] = W.R.addChild(g.root, fnode(null, { x: slot.x, z: slot.z })); }
        s.x = slot.x; s.z = slot.z;
        const key2 = id + ":" + full + ":" + n;
        if (s.key !== key2) { s.key = key2; s.mesh = n > 0 ? stackMesh(id, full, n) : null; }
        s.visible = n > 0;
      }
      /* v192: sobald etwas abgelegt ist, steht dort auch ein Werkzeugplatz (Kiste, Säge, Nagelschachtel) */
      if (L.tools) {
        if (!g.tools) g.tools = W.R.addChild(g.root, fnode(fmesh("site:tools192", toolsMesh), {}));
        g.tools.x = L.tools.x; g.tools.z = L.tools.z; g.tools.visible = true;
      }
    }
  }
  function toolsMesh() {
    const b = new G3.MB();
    b.box(0.26, 0.22, 0.5, 0x9a3b2e, { ry: 0.12 }); b.box(0.04, 0.06, 0.36, 0x2a2a2e, { y: 0.24, ry: 0.12 });
    b.box(0.2, 0.012, 0.42, 0x8a8f96, { x: 0.3, y: 0.012, z: 0.05, ry: -0.2 }); b.box(0.06, 0.05, 0.12, 0x8a6a44, { x: 0.34, y: 0.012, z: 0.32, ry: -0.2 });
    b.box(0.1, 0.06, 0.08, 0xc8b27a, { x: -0.22, y: 0, z: -0.2 });
    return b;
  }
  /* --------------------------- Ablegen (Animation) ---------------------------
     put = { Ware: Gebinde } – schon aus dem Lager genommen und im Bauplatz-Lager (farm.js).
     Fenster zu, Kamera zum Platz, Gebinde fallen nacheinander auf ihre Stapel; danach wieder das Fenster. */
  function deliver(key, put, reopen) {
    if (!W.R || !FV.built || FV.fp || typeof SWK === "undefined") return false;
    const L = layout(key);
    if (!L) return false;
    const g = group(key, L), D = (S.farm.depot || {})[key] || {};
    const items = [];
    Object.keys(put).forEach(id => {
      const to = Math.min(L.need[id] || D[id], D[id] || 0), from = Math.max(0, to - put[id]);
      g.pend[id] = { shown: from, to };
      for (let k = from; k < to; k++) items.push({ id, k });
    });
    if (!items.length) return false;
    sync();
    if (typeof closeFarmSheet === "function") closeFarmSheet();
    /* Kamera: auf die Mitte der Stapelreihen, nah genug zum Zusehen */
    let sx = 0, sz = 0, nS = 0;
    Object.keys(put).forEach(id => { const sl = L.slots[id]; if (sl) { sx += sl.x; sz += sl.z; nS++; } });
    const c = toWorld(L.A, sx / Math.max(1, nS), sz / Math.max(1, nS));
    if (typeof farmFocusXZ === "function") farmFocusXZ(c[0], c[1] + 0.6, Math.min(Math.max(FV.R.cam.dist, 13), 17), 700);
    const t0 = performance.now() / 1000 + 0.75, gap = Math.min(0.16, 2.6 / items.length);
    items.forEach((it, i) => W.fly.push({ g, id: it.id, k: it.k, t0: t0 + i * gap, node: null, last: i === items.length - 1 }));
    W.reopen = { key, fn: reopen, at: t0 + items.length * gap + 1.2 };
    return true;
  }
  const FALL = 0.55, BOUNCE = 0.2;
  function stepFly(now) {
    for (let i = W.fly.length - 1; i >= 0; i--) {
      const F = W.fly[i], g = F.g, sl = g.L.slots[F.id];
      if (!sl || !W.G[g.key]) { if (F.node) killNode(F.node); W.fly.splice(i, 1); continue; }
      const u = now - F.t0;
      if (u < 0) continue;
      const full = g.L.need[F.id] || 1, P = bundles(F.id, full).list[F.k] || { x: 0, y: 0, z: 0 };
      const fx = sl.x + P.x, fy = P.y + 0.05, fz = sl.z + P.z;
      if (!F.node) { F.node = W.R.addChild(g.root, fnode(unitMesh(F.id), {})); F.spin = (hs(F.k, F.id.length) - 0.5) * 1.4; F.dx = (hs(F.k, 2) - 0.5) * 0.5; }
      const n = F.node;
      if (u < FALL) {
        const t = u / FALL, e = t * t;
        n.x = fx + F.dx * (1 - t); n.z = fz - 0.4 * (1 - t); n.y = fy + (1 - e) * 3.0; n.ry = (P.ry || 0) + F.spin * (1 - t); n.rz = 0.25 * (1 - t) * Math.sign(F.spin || 1);
      } else {
        if (!F.landed) {
          F.landed = true;
          const pend = g.pend[F.id]; if (pend) pend.shown = Math.max(pend.shown, F.k + 1);
          const w = toWorld(g.L.A, fx, fz);
          W.R.burst({ x: w[0], y: fy + 0.05, z: w[1], n: 7, col: [[0.78, 0.68, 0.5, 0.8], [0.66, 0.58, 0.44, 0.7]], speed: 0.9, up: 0.5, size: 0.09, g: -1.5, life: 0.55, spread: 0.6 });
          if (typeof sfx === "function" && (F.k % 2 === 0 || F.last)) try { sfx("pop"); } catch (e) { /* stumm */ }
          sync();
        }
        const t = (u - FALL) / BOUNCE;
        if (t >= 1) { killNode(n); W.fly.splice(i, 1); { const s = g.st[F.id]; if (s) s.sy = 1; } if (g.pend[F.id] && g.pend[F.id].shown >= g.pend[F.id].to) { delete g.pend[F.id]; sync(); } continue; }
        n.x = fx; n.z = fz; n.ry = P.ry || 0; n.rz = 0; n.y = fy + Math.sin(PI * t) * 0.07 * (1 - t);
        n.visible = false;                         /* der Stapel zeigt das Gebinde schon – das Federn spielt der Stapel */
        const s = g.st[F.id]; if (s) { s.sy = 1 - Math.sin(PI * t) * 0.05; }
      }
    }
    if (W.reopen && now > W.reopen.at && !W.fly.some(F => F.g.key === W.reopen.key)) {
      const r = W.reopen; W.reopen = null;
      if (!FV.sheet && !FV.place && typeof r.fn === "function") try { r.fn(); } catch (e) { console.warn("SITE3D reopen", e); }
    }
  }
  function killNode(n) { const p = n.parent; if (p) { const i = p.children.indexOf(n); if (i >= 0) p.children.splice(i, 1); } }
  /* ------------------------------ Verbrauchen ------------------------------- */
  function consume(g) {
    if (g.gone) return;
    g.gone = performance.now() / 1000;
    W.gone.push(g);
    const A = g.L.A;
    Object.keys(g.st).forEach((id, i) => {
      const s = g.st[id], w = toWorld(A, s.x, s.z);
      setTimeout(() => W.R && W.R.burst({ x: w[0], y: 0.3, z: w[1], n: 12, col: [[0.78, 0.66, 0.48, 0.85], [0.6, 0.5, 0.38, 0.8]], speed: 1.6, up: 1.2, size: 0.12, spread: 0.8, life: 0.9, shape: 1 }), 80 * i);
    });
    delete W.G[g.key];
  }
  function stepGone(now) {
    for (let i = W.gone.length - 1; i >= 0; i--) {
      const g = W.gone[i], t = cl((now - g.gone) / 0.9);
      Object.values(g.st).forEach(s => { s.sy = Math.max(0.02, 1 - t); s.sx = s.sz = 1 - t * 0.3; s.y = -t * 0.05; });
      if (t >= 1) { const k = W.R ? W.R.nodes.indexOf(g.root) : -1; if (k >= 0) W.R.nodes.splice(k, 1); W.gone.splice(i, 1); }
    }
  }
  function step() {
    if (!W.R) return;
    const now = performance.now() / 1000;
    if (W.fly.length || W.reopen) stepFly(now);
    if (W.gone.length) stepGone(now);
  }
  const busy = () => W.fly.length > 0 || W.gone.length > 0;

  /* ------------------------------ Antippen ---------------------------------- */
  function pick(x, y) {
    if (!W.R) return null;
    const ray = W.R.ray(x, y);
    let best = null;
    for (const key in W.G) {
      const g = W.G[key], L = g.L;
      for (const id in g.st) {
        const s = g.st[id];
        if (!s.visible) continue;
        const sl = L.slots[id], w = toWorld(L.A, sl.x, sl.z), r = Math.max(sl.w, 1.1) / 2 + 0.1;
        const d = W.R.hitBox(ray, [w[0] - r, 0, w[1] - r], [w[0] + r, 1.1, w[1] + r]);
        if (d != null && (!best || d < best.d)) best = { d, key };
      }
    }
    return best;
  }
  /* Fenster zum Bauplatz öffnen */
  function open(key) {
    if (key === "rent" && typeof RENT !== "undefined") return RENT.sheet();
    if (key === "hunt" && typeof HUNT !== "undefined") return HUNT.sheet();
    if (key === "saw:lkw" && typeof openLkw === "function") return openLkw();
    if (key.startsWith("saw:") && typeof openSawRepair === "function") return openSawRepair();
    if (key.startsWith("up:") && typeof openMachine === "function") { const o = S.farm.objs.find(x => x.t === (key === "up:kessel2" ? "kessel" : "sw_halle")); if (o) return openMachine(o); }
    const p = S.farm.objs.find(o => o.t === "f_plot" && o.k === key);
    if (p && typeof openPlot === "function") return openPlot(p);
  }
  /* kein Baum, kein Busch auf den Stapelplätzen (für Bauplätze mit eigenem Gelände nicht nötig, aber billig) */
  return { attach, sync, step, deliver, pick, open, busy, layout, needOf, anchor, _W: W };
})();
