/* =========================================================================
   LOGISTIKA – officekitchen.js (v263)
   Bewegliche Büroküche für die eigene G3-Engine: getrennte Korpusse/Türen,
   hohle Tassen, Kaffeezustand und Kühlschrankprodukte aus FITEMS.
   Nur Sitzungszustand – keine Waren, Geld oder Spielstände werden verändert.
   v263: Gegenstände lassen sich überall abstellen (Lage „free“), aus der Hand geben (Wurf, Übergabe an Personal: „ext“)
   und zerspringen („broken“). Welche Flächen es gibt und was mit dem Wurf passiert, bestimmt officefp.js.
   ========================================================================= */
"use strict";

const OFFICE_KITCHEN = (() => {
  const PI = Math.PI, RANGE = 2.4;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  /* v259: bewusste Positivliste, keine rohen Fleisch-/Fischwaren oder Lagergebinde. */
  const FOOD = ["milch", "butter", "kaese", "pudding", "erdbeere", "apfelkuchen"];
  const foods = () => typeof FITEMS === "undefined" ? [] : FOOD.filter(id => FITEMS[id]).map(id => ({ id, name: FITEMS[id].sg || FITEMS[id].n }));

  /* Echte Innenwand und Rand, kein Deckel. Maße in Metern, Standfläche y=0. */
  function cupMesh(color) {
    const b = new G3.MB(), n = 20, H = 0.108;
    const p = (r, y, i) => [Math.cos(i / n * 2 * PI) * r, y, Math.sin(i / n * 2 * PI) * r];
    for (let i = 0; i < n; i++) {
      b.quad(p(0.034, 0, i), p(0.044, H, i), p(0.044, H, i + 1), p(0.034, 0, i + 1), color);
      b.quad(p(0.038, H, i), p(0.029, 0.012, i), p(0.029, 0.012, i + 1), p(0.038, H, i + 1), 0xe5dfd4);
      b.quad(p(0.044, H, i), p(0.038, H, i), p(0.038, H, i + 1), p(0.044, H, i + 1), 0xfffaf1);
    }
    b.cyl(0.03, 0.03, 0.012, n, color, { top: 0xeee8de });
    b.box(0.033, 0.012, 0.014, color, { x: 0.052, y: 0.076 });
    b.box(0.014, 0.055, 0.014, color, { x: 0.066, y: 0.03 });
    b.box(0.033, 0.012, 0.014, color, { x: 0.052, y: 0.025 });
    return b;
  }

  function productMesh(id) {
    const b = new G3.MB();
    if (id === "milch") {
      b.box(0.075, 0.18, 0.065, 0xf6f5e9);
      b.box(0.077, 0.065, 0.067, 0x4a8ac4, { y: 0.045 });
      b.box(0.06, 0.024, 0.05, 0xf6f5e9, { y: 0.18 });
      b.cyl(0.012, 0.012, 0.012, 10, 0x4a8ac4, { x: 0.019, y: 0.204 });
    } else if (id === "pudding") {
      b.cyl(0.032, 0.043, 0.075, 16, 0xeee2af);
      b.cyl(0.046, 0.046, 0.005, 16, 0x6b4331, { y: 0.075 });
    } else if (id === "erdbeere") {
      b.box(0.14, 0.028, 0.1, 0xe1e8df);
      for (let i = 0; i < 6; i++) {
        const x = (i % 3 - 1) * 0.038, z = (Math.floor(i / 3) - 0.5) * 0.04;
        b.sphere(0.023, 8, 6, 0xc93b34, { x, y: 0.043, z, sy: 1.1 });
        b.box(0.022, 0.004, 0.015, 0x4b8d45, { x, y: 0.064, z });
      }
    } else if (id === "apfelkuchen") {
      b.box(0.14, 0.012, 0.1, 0xe8e7df);
      b.box(0.12, 0.035, 0.08, 0xae783d, { y: 0.012, top: 0xe5bf76 });
      [-0.035, 0, 0.035].forEach(x => b.box(0.018, 0.006, 0.065, 0xf1d59c, { x, y: 0.047 }));
    } else {
      b.box(0.12, 0.045, 0.075, id === "butter" ? 0xf2d765 : 0xe5b449);
      b.box(0.055, 0.047, 0.077, 0xf2eee2, { x: -0.022 });
    }
    return b;
  }

  function layout(o) {
    const { st, kid, mods, rect, blk, chair, mixH } = o;
    const W = -o.RD, M = 0.6, L = mods.length * M;
    const cx = clamp(o.cx0, -o.RW + 0.05 + L / 2, o.RW - 0.05 - L / 2), x0 = cx - L / 2;
    const back = W + 0.03, front = back + 0.58, UB = 1.42, UT = 2.1;
    const C = kid === "nische" ? 0xf4f6f8 : kid === "einbau" ? 0xe9edf1 : 0xf3efe8;
    const work = kid === "nische" ? 0x8d9097 : kid === "einbau" ? 0xb08a5a : 0x5c6068;
    const D = { x0, x1: x0 + L, cx, L, zf: front + 0.048, mods: [], doors: [], items: [], machine: null, top: null, ex: [] };
    const solid = (w, h, d, color, x, y, z) => {
      st.box(w, h, d, color, { x, y, z });
      blk(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2);
    };
    function carcass(x, y0, y1, depth, shelfY, fridge) {
      const c = fridge ? 0xf3f5f5 : 0xdfe3e8, z = back + depth / 2;
      [-1, 1].forEach(s => solid(0.018, y1 - y0, depth, c, x + s * 0.288, y0, z));
      solid(0.564, y1 - y0, 0.018, c, x, y0, back + 0.009);
      [y0, y1 - 0.018, ...shelfY].forEach(y => solid(0.564, 0.018, depth - 0.018, c, x, y, z + 0.009));
    }
    function door(id, x, y0, y1, z, kind, sign) {
      const d = { id, x: x - (sign || 1) * 0.294, y: y0 + 0.003, z, w: 0.588, h: y1 - y0 - 0.006, kind, sign: sign || 1, color: kind === "fridge" ? 0xf6f7f8 : C };
      D.doors.push(d); return d;
    }
    function cups(d, x, y, z) {
      [-0.15, 0.03, 0.17].forEach((dx, i) => D.items.push({ id: d.id + "-cup" + i, kind: "cup", color: [0xf6f1e6, 0x3f78c8, 0xb94938][i], home: [x + dx, y, z], doorId: d.id, fill: 0 }));
    }
    const run = mods.filter(m => m !== "kuehl").length * M;
    /* v263: Arbeitsplatte als Ablagefläche; Geräte darauf sind Sperrzonen (x0, z0, x1, z1) */
    D.top = { x0, x1: x0 + run, z0: W, z1: front + 0.048, y: 0.9 };
    st.box(L, 0.1, 0.52, 0x3a3f48, { x: cx, z: back + 0.26 });
    solid(run, 0.04, front + 0.048 - (W + 0.002), work, x0 + run / 2, 0.86, (front + 0.048 + W + 0.002) / 2);
    st.box(run, 0.5, 0.01, mixH(C, 0x9aa6b4, 0.25), { x: x0 + run / 2, y: 0.9, z: W + 0.005 });
    mods.forEach((m, i) => {
      const x = x0 + (i + 0.5) * M;
      D.mods.push({ m, x });
      rect(x - 0.3, W, x + 0.3, front + 0.048);
      if (m === "kuehl") {
        carcass(x, 0.1, UT, 0.58, [0.43, 0.81, 1.29, 1.68], true);
        const low = door("fridge-low", x, 0.1, 1.3, front, "fridge", -1);
        const high = door("fridge-high", x, 1.3, UT, front, "fridge", -1);
        foods().forEach((f, k) => {
          const shelf = [0.448, 0.448, 0.828, 1.308, 1.698, 0.828][k];
          D.items.push({ id: "food-" + f.id, kind: "product", productId: f.id, name: f.name, home: [x + (k % 2 ? 0.12 : -0.12), shelf, back + 0.37], doorId: shelf > 1.3 ? high.id : low.id });
        });
        return;
      }
      if (m === "herd" || m === "spuelm") {
        solid(0.594, 0.76, 0.58, m === "herd" ? 0x2a2f36 : C, x, 0.1, back + 0.29);
        st.box(0.42, 0.012, 0.024, 0x9aa3ad, { x, y: 0.76, z: front + 0.016 });
        if (m === "herd") {
          st.box(0.45, 0.36, 0.008, 0x10161c, { x, y: 0.3, z: front + 0.005 });
          st.box(0.56, 0.006, 0.5, 0x15171a, { x, y: 0.9, z: back + 0.29 });
          [-1, 1].forEach(a => [-1, 1].forEach(b => st.cyl(0.078, 0.078, 0.003, 16, 0x4b4f57, { x: x + a * 0.13, y: 0.906, z: back + 0.29 + b * 0.12 })));
          st.box(0.59, 0.06, 0.45, 0xc9ced6, { x, y: UB - 0.06, z: W + 0.225 });
        }
      } else {
        carcass(x, 0.1, 0.86, 0.58, [0.43], false);
        const d = door("base-" + i, x, 0.1, 0.86, front, "cabinet");
        if (m === "kaffee") cups(d, x, 0.448, back + 0.4);
      }
      if (m === "spuele") {
        st.box(0.5, 0.004, 0.42, 0xc8ced6, { x, y: 0.9, z: back + 0.3 });
        st.box(0.42, 0.003, 0.34, 0x8f98a3, { x, y: 0.904, z: back + 0.31 });
        st.cyl(0.018, 0.018, 0.26, 8, 0xd8dde2, { x, y: 0.9, z: W + 0.08 });
        st.box(0.026, 0.026, 0.2, 0xd8dde2, { x, y: 1.14, z: W + 0.17 });
        st.box(0.016, 0.06, 0.016, 0xd8dde2, { x, y: 1.09, z: W + 0.27 });
        D.ex.push([x - 0.04, W, x + 0.04, W + 0.3]);
      }
      if (m === "mikro") {
        solid(0.48, 0.28, 0.36, 0xe1e5ea, x, 0.9, back + 0.26);
        st.box(0.3, 0.2, 0.006, 0x1d2228, { x: x - 0.05, y: 0.94, z: back + 0.443 });
        st.box(0.08, 0.2, 0.006, 0x55606c, { x: x + 0.17, y: 0.94, z: back + 0.443 });
        D.ex.push([x - 0.25, W, x + 0.25, back + 0.45]);
      }
      if (m === "kocher") {
        st.cyl(0.075, 0.075, 0.012, 12, 0x2a2a30, { x, y: 0.9, z: back + 0.3 });
        st.cyl(0.07, 0.06, 0.22, 12, 0xd9413a, { x, y: 0.912, z: back + 0.3 });
        st.box(0.03, 0.12, 0.05, 0x2a2a30, { x: x + 0.08, y: 0.96, z: back + 0.3 });
        D.ex.push([x - 0.09, back + 0.2, x + 0.12, back + 0.4]);
      }
      if (m === "kaffee") {
        const z = back + 0.25, face = z + 0.19, cup = [x - 0.08, 0.932, z + 0.24];
        /* Freier Brühraum vor zurückgesetzter Rückwand, Tank hinten rechts. */
        solid(0.46, 0.43, 0.22, 0xa83526, x, 0.9, z - 0.08);
        solid(0.46, 0.15, 0.38, 0xa83526, x, 1.18, z);
        solid(0.48, 0.035, 0.4, 0xd8dde2, x, 1.33, z);
        st.box(0.34, 0.065, 0.014, 0x26313d, { x, y: 1.245, z: face + 0.009 });
        st.box(0.11, 0.3, 0.17, 0x89aebe, { x: x + 0.16, y: 0.92, z: z - 0.07 });
        st.box(0.22, 0.02, 0.18, 0x6a6f78, { x: cup[0], y: 0.912, z: cup[2] });
        for (let k = 0; k < 5; k++) st.box(0.17, 0.002, 0.006, 0xb4bdc5, { x: cup[0], y: 0.932, z: cup[2] - 0.06 + k * 0.03 });
        st.box(0.115, 0.035, 0.12, 0x24272d, { x: cup[0], y: 1.175, z: z + 0.205 });
        st.cyl(0.014, 0.014, 0.04, 12, 0x363a42, { x: cup[0], y: 1.135, z: cup[2] });
        D.machine = { x, z, face, cup, nozzle: [cup[0], 1.135, cup[2]], button: [x + 0.125, 1.215, face + 0.025] };
        D.ex.push([x - 0.25, W, x + 0.25, face + 0.04]);
        return;
      }
      carcass(x, UB, UT, 0.32, [1.72], false);
      const upper = door("upper-" + i, x, UB, UT, back + 0.32, "cabinet");
      if (m === "unter") cups(upper, x, UB + 0.018, back + 0.22);
    });
    if (kid !== "nische") {
      const tx = clamp(cx - 0.2, -o.RW + 2.4, o.RW - 2.4), tz = front + 2.248;
      st.box(3, 0.04, 1, 0xe4d3b6, { x: tx, y: 0.74, z: tz });
      [-1, 1].forEach(a => [-1, 1].forEach(b => st.box(0.05, 0.74, 0.05, 0x55606c, { x: tx + a * 1.4, z: tz + b * 0.4 })));
      [-0.9, 0, 0.9].forEach(dx => [-1, 1].forEach(s => chair(st, tx + dx, tz + s * 0.72, s > 0 ? 0 : PI, 0xcbd6e2)));
      rect(tx - 1.6, tz - 1, tx + 1.6, tz + 1); blk(tx - 1.5, 0.74, tz - 0.5, tx + 1.5, 0.78, tz + 0.5);
      D.table = [tx, tz];
    }
    return D;
  }

  function mount(D, R, upload, saved, notify, reduced) {
    const K = { doors: [], items: [], held: null, transfer: null, machine: D.machine ? Object.assign({}, D.machine, { status: "idle", elapsed: 0, cupId: null }) : null, sound: null };
    const make = (mb, o) => { const n = R.node(upload(mb), o || {}); R.nodes.push(n); return n; };
    D.doors.forEach(d => {
      const mb = new G3.MB(), s = d.sign, mid = s * d.w / 2;
      mb.box(d.w, d.h, 0.018, d.color, { x: mid });
      const handleX = s * (d.w - 0.055);
      mb.box(d.kind === "fridge" ? 0.016 : 0.018, d.kind === "fridge" ? Math.min(0.45, d.h * 0.55) : 0.14, 0.025, 0x9aa3ad, { x: handleX, y: d.h * 0.45, z: 0.027 });
      if (d.kind === "fridge") mb.box(d.w - 0.06, 0.1, 0.05, 0xe4e9e7, { x: mid, y: 0.045, z: -0.035 });
      const prev = saved && saved.doors.find(p => p.id === d.id), open = prev ? prev.open : 0;
      const node = make(mb, { x: d.x, y: d.y, z: d.z, ry: -s * open * PI / 2 });
      const door = Object.assign({}, d, { node, open, goal: open, busy: false });
      if (d.kind === "fridge") {
        const light = new G3.MB(); light.box(0.4, 0.015, 0.15, 0xfff5ce);
        door.light = make(light, { x: d.x - d.w / 2, y: d.y + d.h - 0.028, z: d.z - 0.3, glow: 0.8, shadow: false, visible: open > 0.1 });
      }
      K.doors.push(door);
    });
    D.items.forEach(it => {
      const old = saved && saved.items.find(p => p.id === it.id);
      const n = make(it.kind === "cup" ? cupMesh(it.color) : productMesh(it.productId));
      /* v263: zusätzlich „free“ (frei abgestellt, mit Lage), „ext“ (Szene führt: geworfen, in der Hand einer Person), „broken“ (zersprungen) */
      const loc = old ? (old.location === "ext" ? (old.pos ? "free" : "home") : old.location) : "home";
      const item = Object.assign({}, it, { node: n, location: loc, fill: old ? old.fill : 0, pos: old && old.pos ? old.pos.slice() : null, ry: old && old.ry || 0 });
      if (it.kind === "cup") {
        const mb = new G3.MB(); mb.cyl(1, 1, 0.0015, 24, 0x59321b, { top: 0x82512c });
        item.liquid = R.addChild(n, R.node(upload(mb), { shadow: false, visible: false }));
      }
      K.items.push(item);
      if (item.location === "held") K.held = item;
    });
    if (K.machine) {
      const M = K.machine;
      if (saved && saved.machine) Object.assign(M, saved.machine);
      const button = new G3.MB();
      /* Zylinderbasis liegt auf der Front, Achse mit -PI/2 eindeutig nach +z. */
      button.cyl(0.031, 0.031, 0.016, 16, 0xf6f4e9, { rx: -PI / 2 });
      M.knob = make(button, { x: M.button[0], y: M.button[1], z: M.button[2], shadow: false });
      const lamp = new G3.MB(); lamp.cyl(0.012, 0.012, 0.008, 16, 0xffffff, { rx: -PI / 2 });
      M.lamps = [0.06, 0.115, 0.17].map(dx => make(lamp, { x: M.x + dx, y: 1.278, z: M.face + 0.02, shadow: false, glow: 0.5 }));
      const str = new G3.MB(); str.cyl(0.006, 0.006, 1, 10, 0x60361d);
      M.stream = make(str, { x: M.cup[0], y: M.cup[1], z: M.cup[2], visible: false, shadow: false });
    }
    const doorOf = item => K.doors.find(d => d.id === item.doorId);
    const accessible = item => { const d = doorOf(item); return d && d.open > 0.95 && !d.busy; };
    const brewing = () => K.machine && K.machine.status === "brewing";
    const busy = () => !!K.transfer;
    const gone = item => item.location === "held" || item.location === "ext" || item.location === "broken";
    function soundStop() {
      if (K.sound) { K.sound.close().catch(() => {}); K.sound = null; }
    }
    function soundStart() {
      if (typeof S === "undefined" || !S.farm || !S.farm.snd) return;
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)(), osc = ac.createOscillator(), gain = ac.createGain();
        K.sound = ac; osc.type = "triangle"; osc.frequency.value = 86; gain.gain.value = 0.015;
        osc.connect(gain); gain.connect(ac.destination); osc.start(); ac.resume().catch(() => {});
      } catch (e) { /* Ton ist optional. */ }
    }
    function move(item, location) {
      const from = [item.node.x, item.node.y, item.node.z];
      item.location = location;
      if (location === "held") K.held = item; else K.held = null;
      K.transfer = { item, from, t: 0 };
    }
    function perform(id) {
      if (id.startsWith("door:")) {
        const d = K.doors.find(x => x.id === id.slice(5));
        if (!d || d.busy) return;
        if (K.transfer && K.transfer.item.doorId === d.id) return;
        d.goal = d.open < 0.5 ? 1 : 0; d.busy = true; return;
      }
      if (busy()) return;
      if (id.startsWith("take:")) {
        const item = K.items.find(i => i.id === id.slice(5));
        if (!item || gone(item) || (item.location === "home" && !accessible(item))) return;
        if (K.held) return notify("Du trägst bereits einen Gegenstand. Stelle ihn zuerst zurück.");
        if (item.location === "machine") {
          if (brewing()) return notify("Der Kaffee läuft noch.");
          K.machine.cupId = null; K.machine.status = "idle";
        }
        move(item, "held"); return;
      }
      if (id === "return") {
        if (!K.held || !accessible(K.held)) return;
        move(K.held, "home"); return;
      }
      const M = K.machine; if (!M) return;
      if (id === "place") {
        if (!K.held || K.held.kind !== "cup" || M.cupId || brewing()) return;
        if (K.held.fill > 0) return notify("Die Tasse ist bereits gefüllt.");
        M.cupId = K.held.id; move(K.held, "machine"); return;
      }
      if (id === "start") {
        if (brewing()) return;
        const cup = K.items.find(i => i.id === M.cupId);
        if (!cup) return notify("Bitte zuerst eine Tasse platzieren.");
        if (cup.fill > 0) return notify("Die Tasse ist bereits gefüllt.");
        M.status = "brewing"; M.elapsed = 0; soundStart();
      }
    }
    function doorHit(d, ray, pad) {
      const n = d.node, c = Math.cos(n.ry), s = Math.sin(n.ry), p = ray.o.map((v, i) => v - [n.x, n.y, n.z][i]);
      const tr = v => [c * v[0] - s * v[2], v[1], s * v[0] + c * v[2]];
      return R.hitBox({ o: tr(p), d: tr(ray.d) }, [Math.min(0, d.sign * d.w) - pad, -pad, -0.055], [Math.max(0, d.sign * d.w) + pad, d.h + pad, 0.055]);
    }
    /* v263: Abstand zur nächsten Küchentür auf dem Strahl (für die Wurfbahn) */
    function doorT(ray) { let m = null; K.doors.forEach(d => { const t = doorHit(d, ray, 0); if (t != null && (m == null || t < m)) m = t; }); return m; }
    /* Dynamische Türen sperren Sicht und Bewegung auch während der Animation. */
    function occludes(ray, distance, except) {
      return K.doors.some(d => d.id !== except && (() => { const t = doorHit(d, ray, 0); return t != null && t < distance - 0.012; })());
    }
    function target(ray, eye, blocked) {
      const hits = [];
      const add = (id, label, lo, hi, extra) => {
        const t = R.hitBox(ray, lo, hi); if (t != null) hits.push(Object.assign({ id, label, t }, extra || {}));
      };
      K.doors.forEach(d => {
        const t = doorHit(d, ray, 0.014);
        if (t != null) hits.push({ id: "door:" + d.id, label: d.busy ? "Tür bewegt sich …" : (d.kind === "fridge" ? "Kühlschrank " : "Schrank ") + (d.open > 0.5 ? "schließen" : "öffnen"), t, doorId: d.id, disabled: d.busy });
      });
      if (!busy()) K.items.forEach(item => {
        if (gone(item)) return;
        if (item.location === "home" && !accessible(item)) return;
        const n = item.node, p = [n.x, n.y, n.z];
        const label = item.kind === "cup" ? item.fill > 0 ? "Kaffee nehmen" : "Tasse nehmen" : item.name + " nehmen";
        add("take:" + item.id, item.location === "machine" && brewing() ? "Kaffee läuft …" : label, [p[0] - 0.07, p[1], p[2] - 0.06], [p[0] + 0.08, p[1] + (item.productId === "milch" ? 0.22 : 0.115), p[2] + 0.06], { disabled: item.location === "machine" && brewing() });
      });
      if (!busy() && K.held && accessible(K.held)) {
        const p = K.held.home;
        add("return", K.held.kind === "cup" ? "Tasse zurückstellen" : "Produkt zurückstellen", [p[0] - 0.085, p[1], p[2] - 0.07], [p[0] + 0.085, p[1] + 0.13, p[2] + 0.07]);
      }
      const M = K.machine;
      if (M) {
        const p = M.button;
        add("start", brewing() ? "Kaffee läuft …" : "Kaffee starten", [p[0] - 0.055, p[1] - 0.05, p[2] - 0.018], [p[0] + 0.055, p[1] + 0.05, p[2] + 0.025], { disabled: brewing() || busy() });
        if (K.held && K.held.kind === "cup" && !M.cupId && !busy()) {
          const p = M.cup;
          add("place", "Tasse platzieren", [p[0] - 0.1, p[1] - 0.005, p[2] - 0.07], [p[0] + 0.1, p[1] + 0.16, p[2] + 0.085]);
        }
      }
      return hits.sort((a, b) => a.t - b.t).find(h => {
        const p = ray.o.map((v, i) => v + ray.d[i] * h.t);
        return Math.hypot(...p.map((v, i) => v - eye[i])) <= RANGE && !blocked(eye, p) && !occludes(ray, h.t, h.doorId);
      }) || null;
    }
    function liquid(it) {
      if (!it.liquid) return;
      it.liquid.visible = it.fill > 0;
      it.liquid.y = 0.014 + it.fill * 0.081;
      it.liquid.sx = it.liquid.sz = 0.029 + (it.liquid.y - 0.012) / 0.096 * 0.009 - 0.0008;
    }
    /* v263: frei abstellen (Fläche und Lage bestimmt die Szene), aus der Hand geben (Wurf, Übergabe), ablegen, zerspringen */
    function dropAt(pos, ry) {
      if (!K.held || busy()) return false;
      const it = K.held; it.pos = pos.slice(); it.ry = ry || 0; move(it, "free"); return true;
    }
    function release() { const it = K.held; if (!it || busy()) return null; K.held = null; it.location = "ext"; return it; }
    function settle(it, pos, ry) { it.pos = pos.slice(); it.ry = ry || 0; it.location = "free"; }
    function shatter(it) { it.location = "broken"; it.fill = 0; it.node.visible = false; }
    function tick(dt, view) {
      K.doors.forEach(d => {
        if (d.busy) {
          const next = d.open + Math.sign(d.goal - d.open) * dt / (reduced ? 0.12 : 0.65);
          d.open = d.goal > d.open ? Math.min(d.goal, next) : Math.max(d.goal, next);
          d.node.ry = -d.sign * ease(d.open) * PI / 2;
          d.busy = Math.abs(d.open - d.goal) > 0.0001;
        }
        if (d.light) d.light.visible = d.open > 0.08;
      });
      const M = K.machine;
      if (M && brewing()) {
        M.elapsed += dt;
        const cup = K.items.find(i => i.id === M.cupId);
        if (cup) cup.fill = clamp((M.elapsed - 0.7) / 6, 0, 1);
        if (K.sound && (typeof S === "undefined" || !S.farm || !S.farm.snd)) soundStop();
        if (M.elapsed >= 7) { M.status = "ready"; soundStop(); notify("Kaffee fertig"); if (typeof sfx === "function") sfx("collect"); }
      }
      const hold = () => {
        const f = [-Math.cos(view.yaw), -Math.sin(view.yaw)], rt = [Math.sin(view.yaw), -Math.cos(view.yaw)];
        return [view.eye[0] + f[0] * 0.38 + rt[0] * 0.18, view.eye[1] - 0.33, view.eye[2] + f[1] * 0.38 + rt[1] * 0.18];
      };
      K.hand = hold();
      K.items.forEach(it => {
        if (it.location === "broken") { it.node.visible = false; return; }
        if (it.location === "ext") { liquid(it); return; }                             /* v263: Lage setzt officefp.js (Wurf, Person) */
        let p = it.location === "held" ? K.hand : it.location === "machine" && M ? M.cup : it.location === "free" && it.pos ? it.pos : it.home;
        const tr = K.transfer;
        if (tr && tr.item === it) {
          tr.t = Math.min(1, tr.t + dt / (reduced ? 0.12 : 0.5));
          p = mix(tr.from, p, ease(tr.t)); p[1] += Math.sin(tr.t * PI) * 0.07;
          if (tr.t >= 1) K.transfer = null;
        }
        [it.node.x, it.node.y, it.node.z] = p;
        it.node.rx = it.node.rz = 0; it.node.ry = it.location === "free" ? it.ry || 0 : 0;
        if (it.kind === "product") it.node.glow = it.location === "home" && accessible(it) ? 0.12 : 0;
        liquid(it);
      });
      if (M) {
        const cup = K.items.find(i => i.id === M.cupId), active = brewing();
        M.knob.z = M.button[2] - (active && M.elapsed < 0.18 ? 0.007 : 0);
        M.lamps.forEach((n, i) => { const c = i === 0 ? 0x5bc986 : i === 1 ? 0xf2bc49 : 0x74b9ee; const on = (i === 0 && !active && M.status !== "ready") || (i === 1 && active) || (i === 2 && M.status === "ready"); n.tint = [...G3.col(c).map(v => v * (on ? 1 : 0.22)), 1]; n.glow = on ? 0.85 : 0; });
        M.stream.visible = active && M.elapsed > 0.7 && M.elapsed < 6.8 && !!cup;
        if (cup) { const y = M.cup[1] + 0.014 + cup.fill * 0.081; M.stream.y = y; M.stream.sy = Math.max(0.001, M.nozzle[1] - y); }
        if (M.stream.visible && !reduced && Math.random() < dt * 8) R.emit({ x: M.cup[0], y: M.cup[1] + 0.11, z: M.cup[2], vy: 0.1, vx: 0.015, life: 0.75, size: 0.014, size2: 0.05, col: [0.94, 0.93, 0.88, 0.22] });
      }
    }
    function colliders() {
      return K.doors.filter(d => d.open > 0.02).map(d => {
        const n = d.node, c = Math.cos(n.ry), s = Math.sin(n.ry), x = n.x + c * d.sign * d.w, z = n.z - s * d.sign * d.w;
        return [Math.min(n.x, x) - 0.02, Math.min(n.z, z) - 0.02, Math.max(n.x, x) + 0.02, Math.max(n.z, z) + 0.02];
      }).concat(K.items.filter(i => i.location === "free" && i.pos && i.pos[1] < 0.05).map(i => [i.pos[0] - 0.06, i.pos[2] - 0.06, i.pos[0] + 0.06, i.pos[2] + 0.06]));   /* v263: Tasse auf dem Boden – man läuft drum herum */
    }
    let focused = null;
    function focus(id) {
      if (focused) focused.tint = null;
      const door = K.doors.find(d => "door:" + d.id === id), item = K.items.find(i => "take:" + i.id === id);
      focused = door ? door.node : item ? item.node : id === "start" && K.machine ? K.machine.knob : null;
      if (focused) focused.tint = [1, 0.86, 0.52, 0.16];
    }
    const snapshot = () => ({ doors: K.doors.map(d => ({ id: d.id, open: d.goal })), items: K.items.map(i => ({ id: i.id, location: i.location === "ext" ? (i.pos ? "free" : "home") : i.location, fill: i.fill, pos: i.pos ? i.pos.slice() : null, ry: i.ry || 0 })), machine: MState() });
    const MState = () => K.machine ? { status: K.machine.status, elapsed: K.machine.elapsed, cupId: K.machine.cupId } : null;
    return Object.assign(K, { target, perform, tick, colliders, snapshot, occludes, focus, dispose: soundStop, dropAt, release, settle, shatter, busy, doorT });
  }
  return { layout, mount, cupMesh, foods };
})();
