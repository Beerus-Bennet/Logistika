/* =========================================================================
   LOGISTIKA – Spiellogik
   ========================================================================= */
"use strict";

/* ---------------------------- Hilfsfunktionen --------------------------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const R_EARTH = 6371;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function hav(a, b) {
  const t = Math.PI / 180;
  const dLat = (b[0] - a[0]) * t, dLon = (b[1] - a[1]) * t;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(s)));
}
function money(n) {
  const a = Math.abs(n);
  if (a >= 1e9) return fmt(n / 1e9, 2) + " Mrd. €";
  if (a >= 1e6) return fmt(n / 1e6, 2) + " Mio. €";
  if (a >= 1e4) return Math.round(n).toLocaleString("de-DE") + " €";
  return fmt(n, a < 100 ? 2 : 0) + " €";
}
function fmt(n, d) { return n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }); }
function kgf(n) {
  if (n >= 1e6) return fmt(n / 1e6, n >= 1e7 ? 0 : 1) + " kt";
  if (n >= 1000) return fmt(n / 1000, n >= 1e4 ? 0 : 1) + " t";
  if (n < 10 && Math.round(n) !== n) return fmt(n, n < 1 ? 2 : 1).replace(/0$/, "") + " kg";
  return Math.round(n) + " kg";
}
function kmf(n) { return Math.round(n).toLocaleString("de-DE") + " km"; }
function dur(min) {
  min = Math.max(0, Math.round(min));
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  if (d > 0) return d + " T " + h + " h";
  if (h > 0) return h + " h " + m + " min";
  return m + " min";
}
function clock(t) {
  const h = Math.floor((t % 1440) / 60), m = Math.floor(t % 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
function dayOf(t) { return Math.floor(t / 1440) + 1; }
function stamp(t) { return "Tag " + dayOf(t) + ", " + clock(t); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ------------------------------ Min-Heap -------------------------------- */
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(p, v) {
    const a = this.a; a.push([p, v]);
    let i = a.length - 1;
    while (i > 0) { const par = (i - 1) >> 1; if (a[par][0] <= a[i][0]) break; const t = a[par]; a[par] = a[i]; a[i] = t; i = par; }
  }
  pop() {
    const a = this.a; if (!a.length) return null;
    const top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        const t = a[m]; a[m] = a[i]; a[i] = t; i = m;
      }
    }
    return top;
  }
}

/* ------------------------------ Weltmodell ------------------------------ */
const N = {};
const ADJ = {};
NODES.forEach(a => {
  N[a[0]] = { id: a[0], name: a[1], lat: a[2], lon: a[3], land: a[4], stage: a[5], modes: a[6], type: a[7], short: a[8] };
});
const noLand = new Set();
NO_LAND_LINK.forEach(p => { noLand.add(p[0] + ">" + p[1]); noLand.add(p[1] + ">" + p[0]); });

function addEdge(a, b, mode) {
  if (!N[a] || !N[b] || a === b) return;
  const list = ADJ[a] = ADJ[a] || [];
  if (list.some(e => e.to === b && e.mode === mode)) return;
  const d = hav([N[a].lat, N[a].lon], [N[b].lat, N[b].lon]);
  list.push({ to: b, mode, dist: d });
  (ADJ[b] = ADJ[b] || []).push({ to: a, mode, dist: d });
}

(function buildWorld() {
  const ids = Object.keys(N);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const A = N[ids[i]], B = N[ids[j]];
      if (A.land !== B.land) continue;
      if (noLand.has(A.id + ">" + B.id)) continue;
      const lim = LAND_LIMITS[A.land] || { r: 600, l: 1200 };
      const d = hav([A.lat, A.lon], [B.lat, B.lon]);
      if (A.modes.includes("r") && B.modes.includes("r") && d <= lim.r) addEdge(A.id, B.id, "r");
      if (A.modes.includes("l") && B.modes.includes("l") && d <= lim.l) addEdge(A.id, B.id, "l");
      if (A.modes.includes("b") && B.modes.includes("b") && d <= 24) addEdge(A.id, B.id, "b");
    }
  }
  SEA_ROUTES.forEach(p => addEdge(p[0], p[1], "s"));
  INLAND_ROUTES.forEach(p => addEdge(p[0], p[1], "i"));
  EXTRA_EDGES.forEach(p => addEdge(p[0], p[1], p[2]));
  const air = ids.filter(id => N[id].modes.includes("a"));
  for (let i = 0; i < air.length; i++)
    for (let j = i + 1; j < air.length; j++) {
      const d = hav([N[air[i]].lat, N[air[i]].lon], [N[air[j]].lat, N[air[j]].lon]);
      if (d <= 13500) addEdge(air[i], air[j], "a");
    }
})();

/* --------------------------- Fahrzeugfähigkeit -------------------------- */
function vType(id) { return VEHICLES.find(v => v.id === id); }
/* Kilometerkosten mit aktuellem Treibstoffpreis (extras.js) */
function costKmOf(t) { return t.costKm * (typeof fuelFactor === "function" ? fuelFactor(t) : 1); }

function meetsReq(v, cargoKey) {
  const req = (CARGO[cargoKey] || { req: [] }).req;
  for (const r of req) if (!v.flags.includes(r)) return false;
  return true;
}
function canCarry(v, cargoKey, weight, maxHop) {
  if (v.cap < weight) return false;
  if (!meetsReq(v, cargoKey)) return false;
  if (maxHop != null && v.range && maxHop > v.range) return false;
  return true;
}
/* Referenzfahrzeug: das günstigste verfügbare Fahrzeug eines Verkehrsträgers,
   das diese Ladung über diese Etappenlänge tatsächlich fahren könnte.
   Es bestimmt Routingkosten und Frachtpreis. */
let refMemo = new Map();
function refVeh(mode, cargoKey, weight, dist) {
  const bucket = dist == null ? "x" : Math.ceil(dist / 200);
  const key = mode + "|" + cargoKey + "|" + weight + "|" + bucket + "|" + S.stage;
  if (refMemo.has(key)) return refMemo.get(key);
  let best = null;
  for (const v of VEHICLES) {
    if (v.mode !== mode) continue;
    if (v.stage > S.stage) continue;
    if (!canCarry(v, cargoKey, weight, dist)) continue;
    if (!best || v.costKm < best.costKm) best = v;
  }
  if (refMemo.size > 4000) refMemo.clear();
  refMemo.set(key, best);
  return best;
}
function hasUsableMode(node, cargoKey, weight) {
  const um = unlockedModes();
  for (const m of node.modes) if (um.includes(m) && refVeh(m, cargoKey, weight, null)) return true;
  return false;
}

/* -------------------------------- Routing ------------------------------- */
let routeMemo = new Map();

function dijkstra(from, to, modes, metric, cargoKey, weight) {
  const dist = new Map(), prev = new Map();
  const startKey = from + "|-";
  dist.set(startKey, 0);
  const heap = new Heap();
  heap.push(0, startKey);
  let bestKey = null;
  while (heap.size) {
    const top = heap.pop();
    const d = top[0], key = top[1];
    if (d > (dist.get(key) ?? Infinity)) continue;
    const cut = key.lastIndexOf("|");
    const node = key.slice(0, cut), pm = key.slice(cut + 1);
    if (node === to) { bestKey = key; break; }
    const edges = ADJ[node] || [];
    for (const e of edges) {
      if (!modes.includes(e.mode)) continue;
      if (!isUnlocked(e.to)) continue;
      const ref = refVeh(e.mode, cargoKey, weight, e.dist);
      if (!ref) continue;
      const mi = MODE_INFO[e.mode];
      let w = metric === "time" ? (e.dist / ref.speed) * 60 : e.dist * ref.costKm;
      if (pm !== "-" && pm !== e.mode) {
        const um = Math.max(MODE_INFO[pm].umschlag, mi.umschlag);
        w += metric === "time" ? um : um * 4;
      }
      const nk = e.to + "|" + e.mode;
      const nd = d + w;
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        prev.set(nk, { key, edge: e });
        heap.push(nd, nk);
      }
    }
  }
  if (!bestKey) return null;
  const out = [];
  let cur = bestKey;
  while (prev.has(cur)) {
    const p = prev.get(cur);
    out.unshift({ to: p.edge.to, mode: p.edge.mode, dist: p.edge.dist, from: p.key.slice(0, p.key.lastIndexOf("|")) });
    cur = p.key;
  }
  return out;
}

function toLegs(edges) {
  const legs = [];
  edges.forEach(e => {
    const last = legs[legs.length - 1];
    if (last && last.mode === e.mode) {
      last.nodes.push(e.to); last.dist += e.dist;
      last.maxHop = Math.max(last.maxHop, e.dist);
    } else {
      legs.push({ mode: e.mode, nodes: [e.from, e.to], dist: e.dist, maxHop: e.dist });
    }
  });
  legs.forEach(l => { l.from = l.nodes[0]; l.to = l.nodes[l.nodes.length - 1]; });
  return legs;
}

function plan(from, to, cargoKey, weight, metric) {
  const key = from + ">" + to + "|" + cargoKey + "|" + weight + "|" + metric + "|" + S.stage;
  if (routeMemo.has(key)) return routeMemo.get(key);
  const edges = dijkstra(from, to, unlockedModes(), metric, cargoKey, weight);
  let res = null;
  if (edges && edges.length) {
    const legs = toLegs(edges);
    let t = 0, c = 0;
    legs.forEach((l, i) => {
      const ref = refVeh(l.mode, cargoKey, weight, l.maxHop) || refVeh(l.mode, cargoKey, weight, null);
      const mi = MODE_INFO[l.mode];
      l.ref = ref ? ref.id : null;
      t += (l.dist / (ref ? ref.speed : 50)) * 60 + mi.umschlag * 1.8;
      if (i > 0) t += Math.max(MODE_INFO[legs[i - 1].mode].umschlag, mi.umschlag) * 0.5;
      c += l.dist * (ref ? ref.costKm : 1);
    });
    res = { legs, time: t, cost: c, dist: legs.reduce((a, l) => a + l.dist, 0) };
  }
  if (routeMemo.size > 600) routeMemo.clear();
  routeMemo.set(key, res);
  return res;
}
function clearRouteCache() { routeMemo.clear(); refMemo.clear(); repoMemo.clear(); }

/* ------------------------------ Spielstand ------------------------------ */
const SAVE_KEY = "logistika.save.v3";
let S = null;

function newGame() {
  return {
    phase: "intro", player: null, tut: { done: false },
    money: 0, xp: 0, stage: 1, time: 6 * 60, speed: 1,
    fleet: [], orders: [], jobs: [], seq: 1, lastSpawn: -999, lastDay: 0,
    done: 0, late: 0, failed: 0, kmTotal: 0, co2: 0, revenue: 0, expense: 0,
    showNet: false, fog: true, follow: null, dispoMoved: true,
    bases: [], phone: { msgs: [], unread: 0 }, ledger: []
  };
}
function playing() { return S && S.phase === "play"; }
/* Während des Tutorials steht die Welt still – sonst laufen die ersten
   Fristen schon ab, während Lina noch redet. */
function tutorialRunning() { return document.body.classList.contains("tut-on"); }
function clockRunning() { return playing() && S.speed > 0 && !tutorialRunning() && !S.jail && !S.over; }
let lastSpeed = 1;
function setSpeed(v) {
  /* 30× nur, solange nichts anliegt (extras.js) */
  if (v > 3 && typeof speedCap === "function" && v > speedCap()) {
    const p = pendingDecisions()[0];
    toast("⏱️ Erst entscheiden: " + (p ? p.title : "offene Anfrage") + " – bis dahin höchstens 3×.", "warn");
    v = speedCap();
  }
  if (v > 0) lastSpeed = v;
  S.speed = v;
  $$("[data-speed]").forEach(b => b.classList.toggle("on", +b.dataset.speed === S.speed));
  renderPause();
  save();
}
function togglePause() {
  if (tutorialRunning()) return toast("Erst das Tutorial zu Ende – danach läuft die Uhr.", "warn", true);
  setSpeed(S.speed > 0 ? 0 : lastSpeed || 1);
}
function renderPause() {
  const b = $("#pauseBtn"); if (!b) return;
  const halted = !clockRunning();
  b.classList.toggle("paused", halted);
  b.firstElementChild.textContent = halted ? "▶" : "⏸";
  b.title = halted ? "Spiel fortsetzen" : "Spiel anhalten";
}
function level() { return Math.max(1, Math.floor(Math.sqrt(S.xp / 50)) + 1); }
function xpForLevel(l) { return Math.round(50 * (l - 1) ** 2); }
function unlockedModes() { return STAGES[S.stage - 1].modes; }
function isUnlocked(id) { return N[id] && N[id].stage <= S.stage; }
function unlockedNodes() { return Object.values(N).filter(n => n.stage <= S.stage); }
function dailyCost(f) { const t = vType(f.type); return t.daily + (f.lease ? t.price * LEASE_RATE : 0); }

/* ------------------------------- Aufträge ------------------------------- */
function cargoPool() {
  return Object.keys(CARGO).filter(k => CARGO[k].minStage <= S.stage);
}

function makeOrder() {
  const um = unlockedModes();
  for (let attempt = 0; attempt < 30; attempt++) {
    const ck = pick(cargoPool());
    const cg = CARGO[ck];
    const cands = VEHICLES.filter(v => v.stage <= S.stage && um.includes(v.mode) && meetsReq(v, ck));
    if (!cands.length) continue;

    /* Der Markt reagiert auf die eigene Flotte: ein Teil der Ausschreibungen
       ist auf vorhandene Fahrzeuge zugeschnitten, der Rest bleibt gemischt
       und kleinteilig. */
    const owned = [];
    S.fleet.forEach(f => {
      const t = vType(f.type);
      if (!t || t.stage > S.stage || !um.includes(t.mode) || !meetsReq(t, ck)) return;
      owned.push(f);
      if (f.phase === "idle") { owned.push(f); owned.push(f); }   // freie Kapazität zieht Ladung an
    });
    let rv, fill, anchor = null, anchorVeh = null;
    if (owned.length && Math.random() < 0.6) {
      const f = pick(owned);
      rv = vType(f.type); fill = rnd(0.72, 1.0);
      /* Anschlussaufträge: ein Teil der zugeschnittenen Ladung wartet genau
         dort, wo das Fahrzeug gerade frei steht. Wer darauf achtet, fährt
         ohne Leerfahrt weiter. */
      if (f.phase === "idle" && Math.random() < 0.45) { anchor = f.at; anchorVeh = f; }
    } else {
      const sorted = [...cands].sort((a, b) => a.cap - b.cap);
      const idx = Math.floor(Math.pow(Math.random(), 1.5) * sorted.length);
      rv = sorted[Math.min(sorted.length - 1, idx)];
      fill = rnd(0.5, 1.0);
    }
    let weight = Math.round(rv.cap * fill);
    weight = clamp(weight, cg.minKg, Math.min(cg.maxKg, rv.cap));
    if (weight < 1) continue;

    const pool = unlockedNodes().filter(n => hasUsableMode(n, ck, weight));
    if (pool.length < 2) continue;
    let a = pick(pool);
    if (anchor && pool.some(n => n.id === anchor)) a = N[anchor];
    const b = pick(pool);
    if (a.id === b.id) continue;
    const air = hav([a.lat, a.lon], [b.lat, b.lon]);
    if (S.stage === 1 && air > 45) continue;
    if (S.stage === 2 && air > 400) continue;
    if (air < 1.5) continue;

    const pr = priceOrder(a.id, b.id, ck, weight);
    if (!pr || pr.pay < 5) continue;
    /* Auftraggeber mit eigener Adresse. Wer schon im Namen sagt, wo er sitzt
       („Apotheke am Rosenthaler Platz“), wird genau dort abgeholt. Wartet die
       Ladung dort, wo ein Fahrzeug frei steht, liegt sie gleich nebenan. */
    const sp = anchorVeh && a.id === anchorVeh.at ? vehSpot(anchorVeh) : null;
    const sh = pickShipper(ck, a.id, !sp);
    const home = sh.home;
    const o = {
      id: "A" + (S.seq++), from: a.id, to: b.id, cargo: ck, weight,
      pay: pr.pay, deadline: pr.deadline,
      shipper: sh[0], desc: sh[1], created: S.time,
      refDist: Math.round(pr.ref.dist), refTime: Math.round(pr.fastest.time),
      expire: Math.round(S.time + rnd(400, 1500)),
      pick: home ? home.addr : sp ? addrNear(a.id, sp.lat, sp.lon) : makeAddr(a.id), drop: makeAddr(b.id)
    };
    withLastMile(o);
    return o;
  }
  return null;
}

/* Auftraggeber passend zum Abholort: ortsgebundene nur in ihrem Stadtteil */
function pickShipper(ck, fromId, allowHome) {
  const list = SHIPPERS[ck] || SHIPPERS.pak;
  const fits = list.filter(sh => {
    const h = typeof SHIPPER_HOME !== "undefined" && SHIPPER_HOME[sh[0]];
    return !h || (allowHome && h[0] === fromId);
  });
  const sh = pick(fits.length ? fits : list);
  const home = allowHome && typeof shipperHome === "function" ? shipperHome(sh[0]) : null;
  return { 0: sh[0], 1: sh[1], home: home && home.node === fromId ? home : null };
}

/* Die letzten Meter zur Tür: Frist und angezeigte Strecke wachsen mit.
   Gerechnet mit Radtempo in der Stadt, sonst Lieferwagen. */
function withLastMile(o) {
  const km = lastMileKm(o);
  o.refDist = Math.round(o.refDist + km);
  o.deadline = Math.round(o.deadline + (km / (S.stage === 1 ? 15 : 40)) * 60 * 1.3);
  return o;
}

/* Frachtpreis und Frist einer Relation. Der Preis richtet sich nach der
   kostenoptimalen Route, die Frist nach der schnellsten. */
function priceOrder(from, to, ck, weight) {
  const cg = CARGO[ck];
  const ref = plan(from, to, ck, weight, "cost");
  if (!ref) return null;
  const fastest = plan(from, to, ck, weight, "time") || ref;
  const tons = weight / 1000;
  let tkm = 0, handling = 0;
  ref.legs.forEach(l => {
    const mi = MODE_INFO[l.mode];
    tkm += l.dist * tons * mi.tariff;
    handling += mi.handleFix + tons * mi.handleTon;
  });
  const core = Math.max(ref.cost, tkm);
  const urgency = ck === "express" ? rnd(1.25, 1.6) : rnd(1.0, 1.15);
  const margin = rnd(1.42, 1.85);
  const pay = Math.round((core + handling + BASE_FEE) * cg.rate * urgency * margin);
  const slack = ck === "express" ? rnd(1.22, 1.5) : rnd(1.6, 2.6);
  const posBuffer = fastest.legs.length * 180 + fastest.time * 0.3;
  return { pay, ref, fastest, deadline: Math.round(S.time + fastest.time * slack + posBuffer + 120) };
}

/* Linas Übungsauftrag: startet genau dort, wo ein freies Fahrzeug steht,
   und ist mit genau diesem Fahrzeug fahrbar. So sieht man im Tutorial
   einmal von Anfang bis Ende, wie ein Auftrag ohne Leerfahrt aussieht. */
function tutCargo(t) {
  const ck = ["pak", "express", "pal"].find(k => CARGO[k].minStage <= S.stage && meetsReq(t, k) && CARGO[k].minKg <= t.cap);
  if (!ck) return null;
  const cg = CARGO[ck];
  return { ck, weight: clamp(Math.round(t.cap * 0.55), cg.minKg, Math.min(cg.maxKg, t.cap)) };
}
/* Ziele in angenehmer Entfernung (um 5 km), die der Verkehrsträger erreicht */
function tutDests(from, t, avoid) {
  const here = N[from];
  return unlockedNodes()
    .filter(n => n.id !== from && n.id !== avoid && n.modes.includes(t.mode))
    .map(n => ({ n, d: hav([here.lat, here.lon], [n.lat, n.lon]) }))
    .filter(x => x.d >= 1.5 && (!t.range || x.d < t.range * 0.6))
    .sort((p, q) => Math.abs(p.d - 5) - Math.abs(q.d - 5))
    .slice(0, 10)
    .map(x => x.n);
}
function tutOrderObj(from, to, ck, weight, pr, extra) {
  const sh = pickShipper(ck, from, false);
  return Object.assign({
    id: "A" + (S.seq++), from, to, cargo: ck, weight,
    pay: pr.pay, deadline: Math.round(S.time + pr.fastest.time * 3 + 300),
    shipper: sh[0], desc: sh[1], created: S.time,
    refDist: Math.round(pr.ref.dist), refTime: Math.round(pr.fastest.time),
    expire: Math.round(S.time + 2400)
  }, extra);
}
function makeTutorialOrder() {
  const idle = S.fleet.filter(f => f.phase === "idle");
  /* Das kleinste Fahrzeug zuerst – mit dem Lastenrad ist die Übung kurz. */
  idle.sort((a, b) => vType(a.type).cap - vType(b.type).cap);
  for (const f of idle) {
    const t = vType(f.type), c = tutCargo(t);
    if (!c) continue;
    for (const n of tutDests(f.at, t)) {
      const pr = priceOrder(f.at, n.id, c.ck, c.weight);
      if (!pr) continue;
      const sp = vehSpot(f);
      const o = tutOrderObj(f.at, n.id, c.ck, c.weight, pr,
        { tut: true, pick: addrNear(f.at, sp.lat, sp.lon, 0.22 + Math.random() * 0.12), drop: makeAddr(n.id) });
      const best = bestOption(planOptions(o, buildVariants(o)));
      if (!best || best.repoKm > 0.5) continue;
      /* Die Übung soll sich lohnen – sonst lernt man das Falsche. */
      o.pay = Math.max(o.pay, Math.round(best.ev.cost * 2.4 + 14));
      S.orders.unshift(o);
      return o;
    }
  }
  return null;
}
/* Anschlussauftrag: startet dort, wo das Übungsfahrzeug nach der Zustellung
   steht. Sobald es angekommen ist, zeigt die Liste dafür ✅ – der Beweis,
   dass es auch ohne Leerfahrt weitergeht. */
function makeFollowupOrder(job) {
  const leg = job.legs[job.legs.length - 1];
  const f = S.fleet.find(x => x.uid === leg.veh);
  if (!f) return null;
  const t = vType(f.type), c = tutCargo(t);
  if (!c) return null;
  const arrive = job.legs.reduce((a, l) => a + (l.dist / t.speed) * 60 + MODE_INFO[l.mode].umschlag * 2.2, 0);
  for (const n of tutDests(leg.to, t, job.order.from)) {
    const pr = priceOrder(leg.to, n.id, c.ck, c.weight);
    if (!pr) continue;
    const d = oDrop(job.order);
    const o = tutOrderObj(leg.to, n.id, c.ck, c.weight, pr,
      { tutNext: true, tutVeh: f.uid, pick: addrNear(leg.to, d.lat, d.lon, 0.22 + Math.random() * 0.12), drop: makeAddr(n.id) });
    const fits = buildVariants(o).some(v => v.legs.every(l => l.mode === t.mode && canCarry(t, o.cargo, o.weight, l.maxHop)));
    if (!fits) continue;
    o.deadline += Math.round(arrive);
    o.expire += Math.round(arrive);
    o.pay = Math.max(o.pay, Math.round(pr.ref.dist * t.costKm * 2.4 + 14));
    S.orders.unshift(o);
    return o;
  }
  return null;
}

/* ---------------------------- Luftfracht ---------------------------------
   Eigene Ausschreibungen von Flughafen zu Flughafen. Ohne sie fand die
   Routenplanung fast immer einen billigeren Weg über Straße, Schiene oder
   See – die Flieger standen herum. Diese hier sind eilig: nur wer fliegt,
   schafft die Frist. Zugeschnitten auf eigene Maschinen, wo es welche gibt. */
function makeAirOrder() {
  if (!unlockedModes().includes("a")) return null;
  const airports = unlockedNodes().filter(n => n.modes.includes("a"));
  if (airports.length < 2) return null;
  const types = VEHICLES.filter(v => v.mode === "a" && v.stage <= S.stage);
  const planes = S.fleet.filter(f => vType(f.type).mode === "a");
  for (let attempt = 0; attempt < 24; attempt++) {
    const own = planes.length && Math.random() < 0.65 ? pick(planes) : null;
    const t = own ? vType(own.type) : pick(types);
    const cks = ["express", "pak", "kuehl", "adr"].filter(k => CARGO[k].minStage <= S.stage && meetsReq(t, k));
    if (!cks.length) continue;
    const ck = pick(cks), cg = CARGO[ck];
    const weight = Math.round(clamp(t.cap * rnd(0.4, 0.95), cg.minKg, Math.min(cg.maxKg, t.cap)));
    /* Abflug gern dort, wo die eigene Maschine gerade frei steht */
    const a = own && own.phase === "idle" && N[own.at].modes.includes("a") && Math.random() < 0.6
      ? N[own.at] : pick(airports);
    const b = pick(airports.filter(n => n.id !== a.id));
    if (!b) continue;
    const d = hav([a.lat, a.lon], [b.lat, b.lon]);
    if (d < 250 || d > t.range * 0.95) continue;
    const fast = plan(a.id, b.id, ck, weight, "time");
    if (!fast || !fast.legs.some(l => l.mode === "a")) continue;
    const tons = weight / 1000;
    let handling = 0, tkm = 0;
    fast.legs.forEach(l => { const mi = MODE_INFO[l.mode]; handling += mi.handleFix + tons * mi.handleTon; tkm += l.dist * tons * mi.tariff; });
    const core = Math.max(fast.cost, tkm);
    const pay = Math.round((core + handling + BASE_FEE) * cg.rate * rnd(1.35, 1.7) * rnd(1.35, 1.65));
    const sh = pickShipper(ck, a.id, false);
    return {
      id: "A" + (S.seq++), from: a.id, to: b.id, cargo: ck, weight, pay, air: true,
      deadline: Math.round(S.time + fast.time * rnd(1.25, 1.55) + 240),
      shipper: sh[0], desc: sh[1] + " · per Luftfracht", created: S.time,
      refDist: Math.round(fast.dist), refTime: Math.round(fast.time),
      expire: Math.round(S.time + rnd(300, 900)),
      pick: makeAddr(a.id), drop: makeAddr(b.id)
    };
  }
  return null;
}

/* --------------------------- Wertsachen-Kurier ---------------------------
   Juweliere, Uhrmacher, Auktionshäuser: kleine, teure Stücke quer durch
   Berlin. Nur Kuriere mit persönlicher Übergabe (Rad, Moped) dürfen sie
   fahren. Das Honorar richtet sich nach dem Warenwert – so lohnt sich das
   Fahrrad auch dann noch, wenn längst Schiffe und Flieger unterwegs sind. */
function jewelOpen() { return S.orders.filter(o => o.jewel).length; }
function makeJewelOrder() {
  const districts = unlockedNodes().filter(n => n.id.startsWith("b-") && n.type === "city");
  if (districts.length < 2) return null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const job = pick(JEWEL_JOBS);
    const home = typeof shipperHome === "function" ? shipperHome(job.from) : null;
    const a = home ? N[home.node] : pick(districts);
    const b = pick(districts.filter(n => n.id !== a.id));
    if (!b) continue;
    const weight = +(job.kg * rnd(0.8, 1.25)).toFixed(2);
    const fast = plan(a.id, b.id, "schmuck", weight, "time");
    if (!fast) continue;
    const mult = JEWEL_STAGE_MULT[Math.min(JEWEL_STAGE_MULT.length, S.stage) - 1];
    const value = Math.round(rnd(job.value[0], job.value[1]) * mult / 100) * 100;
    /* Versicherter Kurier: ein paar Promille vom Warenwert plus Grundgebühr */
    const pay = Math.round(value * rnd(0.0035, 0.006) + 22 + fast.dist * 1.6);
    /* Frist so, dass es auch mit dem Rad (19–22 km/h) gut zu schaffen ist */
    const bikeMin = (fast.dist * 1.15 / 19) * 60;
    const o = {
      id: "A" + (S.seq++), from: a.id, to: b.id, cargo: "schmuck", weight, jewel: { item: job.item, value },
      pay, deadline: Math.round(S.time + bikeMin * 1.9 + rnd(45, 90)),
      shipper: job.from, desc: job.item + " " + job.why + " · Warenwert " + money(value), created: S.time,
      refDist: Math.round(fast.dist), refTime: Math.round(fast.time),
      expire: Math.round(S.time + rnd(120, 300)),
      pick: home ? home.addr : makeAddr(a.id), drop: makeAddr(b.id)
    };
    withLastMile(o);
    return o;
  }
  return null;
}
function spawnJewels() {
  /* Wer Rad oder Moped hat, bekommt ein paar mehr davon */
  const couriers = S.fleet.some(f => vType(f.type).flags.includes("kurier"));
  const max = (couriers ? 4 : 2) - (S.stage <= 2 ? 1 : 0);
  if (jewelOpen() >= max) return;
  const o = makeJewelOrder();
  if (o) { S.orders.push(o); renderDirty = true; if (typeof onOrderSpawn === "function") onOrderSpawn(o); }
}

function orderCap() {
  return Math.min(48, 6 + S.stage * 3 + Math.floor(S.fleet.length * 0.9));
}
function spawnOrders(max) {
  const cap = orderCap();
  let added = 0;
  /* Mr. Snus' Privatkunden und die Wertsachen zählen nicht gegen das Auftragsbuch */
  while (S.orders.filter(o => !o.snus && !o.pablo && !o.jewel).length < cap && added < (max || 3)) {
    /* Ab Etappe 4 ist ein gutes Viertel reine Luftfracht – mit eigener
       Maschine noch etwas mehr. */
    const airShare = S.fleet.some(f => vType(f.type).mode === "a") ? 0.36 : 0.26;
    const o = (unlockedModes().includes("a") && Math.random() < airShare && makeAirOrder()) || makeOrder();
    if (!o) break;
    S.orders.push(o); added++;
    if (typeof onOrderSpawn === "function") onOrderSpawn(o);
  }
  return added;
}

/* ------------------------------- Fahrzeuge ------------------------------ */
function homeFor(mode) {
  const cand = unlockedNodes().filter(n => n.modes.includes(mode));
  if (!cand.length) return "b-mitte";
  const berlin = cand.filter(n => n.id.startsWith("b-"));
  return (berlin[0] || cand[0]).id;
}

function makeVehicle(typeId, lease) {
  const t = vType(typeId);
  return {
    uid: "F" + (S.seq++), type: typeId, at: homeFor(t.mode), phase: "idle", lease: !!lease,
    jobId: null, legIdx: -1, route: null, routeDist: 0, pos: 0, timer: 0, kmTotal: 0, jobs: 0, spot: null
  };
}
function acquire(typeId, lease, deliverTo, deliverAddr) {
  const t = vType(typeId);
  if (!t) return;
  if (t.stage > S.stage) return toast("Erst ab Etappe " + t.stage + " verfügbar.", "warn");
  if (!lease) {
    if (S.money < t.price) return toast("Nicht genug Kapital – versuch es mit Leasing.", "warn");
    S.money -= t.price; S.expense += t.price;
    logMoney("fleet", "Gekauft: " + t.name, -t.price);
  } else if (S.money < 0) {
    return toast("Bei negativem Kontostand kein neues Leasing.", "warn");
  } else {
    logMoney("fleet", "Geleast: " + t.name, 0);
  }
  const v = makeVehicle(typeId, lease);
  /* Aus dem Planer heraus gekauft: Überführung direkt an den Ladeort */
  if (deliverTo && N[deliverTo] && N[deliverTo].modes.includes(t.mode)) {
    v.at = deliverTo;
    if (deliverAddr) setSpot(v, addrPt(deliverAddr), deliverAddr);   /* direkt vor die Tür des Kunden */
  }
  S.fleet.push(v);
  toast((lease ? "Geleast: " : "Gekauft: ") + t.name + " – stationiert in " + N[v.at].name, "ok");
  render();
  return v;
}

function release(uid) {
  if (S.follow === uid) setFollow(null);
  const f = S.fleet.find(x => x.uid === uid);
  if (!f) return;
  if (f.phase !== "idle") return toast("Fahrzeug ist im Einsatz.", "warn");
  const t = vType(f.type);
  if (f.lease) {
    toast(t.name + " – Leasing beendet.", "ok");
  } else {
    const val = Math.round(t.price * 0.62 * (typeof wearValueFactor === "function" ? wearValueFactor(f) : 1));
    S.money += val; S.revenue += val;
    toast(t.name + " verkauft für " + money(val), "ok");
  }
  S.fleet = S.fleet.filter(x => x.uid !== uid);
  render();
}

/* Auf welche Fahrzeuge die Disposition zugreifen darf. null = ganze Flotte,
   sonst die Menge eines Standorts (siehe offices.js). */
let dispatchPool = null;
function eligible(leg, order, excludeUids) {
  return S.fleet.filter(v => {
    if (v.phase !== "idle") return false;
    if (dispatchPool && !dispatchPool.has(v.uid)) return false;
    if (excludeUids && excludeUids.includes(v.uid)) return false;
    const t = vType(v.type);
    if (t.mode !== leg.mode) return false;
    return canCarry(t, order.cargo, order.weight, leg.maxHop);
  });
}

let repoMemo = new Map();
function repoPath(from, to, mode) {
  const k = from + ">" + to + "|" + mode + "|" + S.stage;
  if (repoMemo.has(k)) return repoMemo.get(k);
  const e = dijkstra(from, to, mode, "time", "pal", 0);
  if (repoMemo.size > 3000) repoMemo.clear();
  repoMemo.set(k, e);
  return e;
}
/* Anfahrt eines freien Fahrzeugs zum Ladepunkt: vom eigenen Stellplatz über
   das Netz bis vor die Tür des Auftraggebers (bei der ersten Teilstrecke)
   bzw. bis zum Umschlagterminal. pts = die gefahrene Linie. */
function repoCost(veh, leg, order, i) {
  const t = vType(veh.type);
  const O = vehPoint(veh), T = legStartPt(leg, order, i || 0);
  if (veh.at === leg.from) {
    const d = hav(O, T);
    return { t: (d / t.speed) * 60, d, ok: true, edges: [], pts: [O, T] };
  }
  const e = repoPath(veh.at, leg.from, t.mode);
  if (!e || !e.length) return { t: Infinity, d: 0, ok: false, edges: [], pts: [] };
  const pts = pathPts([veh.at].concat(e.map(x => x.to)), O, T);
  const d = pathLen(pts);
  return { t: (d / t.speed) * 60, d, ok: true, edges: e, pts };
}

/* --------------------------- Dispositionsdialog ------------------------- */
let planState = null;

function buildVariants(o) {
  const fast = plan(o.from, o.to, o.cargo, o.weight, "time");
  const cheap = plan(o.from, o.to, o.cargo, o.weight, "cost");
  const list = [];
  if (fast) list.push({ label: "Schnellste Route", ...fast });
  if (cheap) {
    const sig = (p) => p.legs.map(l => l.mode + ">" + l.to).join("|");
    if (!fast || sig(cheap) !== sig(fast)) list.push({ label: "Günstigste Route", ...cheap });
  }
  return list;
}

/* ------------------------- Das passende Fahrzeug -------------------------
   Nicht einfach das nächstbeste: Gerechnet wird in Euro, was ein Fahrzeug
   für diese Teilstrecke kostet –
   · Fahrt: Anfahrt und Strecke mal Kilometerkosten,
   · Blockade: die Fixkosten der Zeit, in der es gebunden ist – und zwar umso
     teurer, je leerer es fährt (ein 24-Tonner für eine Uhr fehlt dann für
     die nächste Palettenladung),
   · Warten: ein kleiner Preis je Minute Anfahrt,
   · Verspätung: wer die Frist reißt, fällt nach hinten.
   Das Günstigste gewinnt – also Rad für die Uhr, Lkw für die Paletten. */
function legTimeRest(variant, from) {
  let t = 0;
  for (let k = from; k < variant.legs.length; k++) {
    const l = variant.legs[k], ref = l.ref ? vType(l.ref) : null;
    t += (l.dist / (ref ? ref.speed : 50)) * 60 + MODE_INFO[l.mode].umschlag * 1.8;
  }
  return t;
}
function vehScore(f, leg, order, i, n, tBefore, tAfter) {
  const t = vType(f.type), rc = repoCost(f, leg, order, i);
  if (!rc.ok) return { s: Infinity, rc, t, util: 0 };
  const dist = order ? pathLen(legPts(leg, order, i, n)) : leg.dist;
  const legT = (dist / t.speed) * 60 + rc.t;
  const util = order ? Math.min(1, order.weight / t.cap) : 1;
  const drive = (dist + rc.d) * costKmOf(t);
  const block = (t.daily / 1440) * legT * (1 + 3 * (1 - util));
  const wait = rc.t * 0.03;
  let late = 0;
  if (order && order.deadline) {
    const eta = S.time + (tBefore || 0) + legT + MODE_INFO[leg.mode].umschlag * 1.8 + (tAfter || 0);
    if (eta > order.deadline) late = 1000 + (eta - order.deadline) * 5;
  }
  return { s: drive + block + wait + late, rc, t, util, legT };
}
function assignFor(variant, order) {
  const used = [], n = variant.legs.length;
  let tAcc = 0;
  return variant.legs.map((leg, li) => {
    const list = eligible(leg, order, used);
    if (!list.length) return null;
    const rest = legTimeRest(variant, li + 1);
    let best = null, bestSc = null;
    for (const f of list) {
      const sc = vehScore(f, leg, order, li, n, tAcc, rest);
      if (!best || sc.s < bestSc.s - 0.001 || (Math.abs(sc.s - bestSc.s) <= 0.001 && sc.rc.t < bestSc.rc.t)) { best = f; bestSc = sc; }
    }
    used.push(best.uid);
    tAcc += (isFinite(bestSc.legT) ? bestSc.legT : 0) + MODE_INFO[leg.mode].umschlag * 1.8;
    return best.uid;
  });
}

/* Alle Routenvarianten eines Auftrags mit der Fahrzeugzuteilung, die die
   eigene Flotte gerade hergibt – samt Leerfahrt und Deckungsbeitrag. */
function planOptions(o, variants) {
  return variants.map((v, vi) => {
    const assign = assignFor(v, o);
    if (!assign.every(Boolean)) return { vi, v, assign, ok: false };
    const ev = evaluate(v, o, assign);
    let repoKm = 0, repoEur = 0;
    ev.detail.forEach(d => { if (d.repo && d.repo.ok) { repoKm += d.repo.d; repoEur += d.repo.d * costKmOf(d.t); } });
    return { vi, v, assign, ok: ev.ok, ev, repoKm, repoEur, profit: o.pay - ev.cost, late: S.time + ev.time > o.deadline };
  });
}
/* Beste Variante: pünktlich vor verspätet, dann der höchste Deckungsbeitrag.
   Leerfahrten stecken in den Kosten – wer weit anfahren muss, verliert. */
function bestOption(opts) {
  let best = null;
  for (const p of opts) {
    if (!p.ok) continue;
    if (!best || (best.late && !p.late) || (best.late === p.late && p.profit > best.profit + 0.005)) best = p;
  }
  return best;
}

function openPlanner(orderId, preferVi) {
  const o = S.orders.find(x => x.id === orderId);
  /* Karte angetippt, die Ausschreibung ist aber gerade abgelaufen oder vergeben */
  if (!o) { toast("Diese Ausschreibung ist gerade abgelaufen.", "warn"); render(); return; }
  const variants = buildVariants(o);
  if (!variants.length) return toast("Mit deinen Verkehrsträgern gibt es dafür keine Route.", "warn");
  /* Vorausgewählt wird die Variante, die mit der eigenen Flotte am meisten
     übrig lässt – nicht stur die schnellste, die vielleicht gar kein freies
     Fahrzeug hat (z. B. Straße, obwohl nur das Lastenrad frei ist).
     Zurück aus dem Markt: die Route, für die gerade eingekauft wurde. */
  const opts = planOptions(o, variants);
  const best = preferVi != null && opts[preferVi] ? opts[preferVi] : bestOption(opts);
  const vi = best ? best.vi : 0;
  planState = { order: o, variants, vi, assign: best ? best.assign.map(u => u || null) : assignFor(variants[0], o), showAll: {} };
  renderPlanner(true);
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  if (typeof tutSignal === "function") tutSignal("openPlanner", o);
}
/* Eigener Ja/Nein-Dialog. Das eingebaute confirm() ist in eingebetteten
   Rahmen gesperrt und antwortet dort stillschweigend mit „nein“ – Knöpfe
   taten dann einfach nichts. */
function askConfirm(title, text, okLabel, onOk, danger) {
  const box = $("#askBox");
  box.innerHTML = `
    <div class="ask-t">${esc(title)}</div>
    <div class="ask-x">${esc(text)}</div>
    <div class="ask-b">
      <button class="btn ghost" id="askNo">Abbrechen</button>
      <button class="btn${danger ? " danger-solid" : ""}" id="askYes">${esc(okLabel)}</button>
    </div>`;
  $("#ask").classList.add("on");
  document.body.classList.add("ask-open");
  const close = () => { $("#ask").classList.remove("on"); document.body.classList.remove("ask-open"); };
  $("#askNo").onclick = close;
  $("#askYes").onclick = () => { close(); onOk(); };
}

function closeModal() {
  const wasPlanner = !!planState;
  $("#modal").classList.remove("open"); document.body.classList.remove("modal-open");
  planState = null; mapRedraw();
  if (wasPlanner && typeof tutSignal === "function") tutSignal("plannerClosed");
}

function evaluate(variant, order, assign) {
  let cost = 0, time = 0, ok = true;
  const last = variant.legs.length - 1;
  const detail = variant.legs.map((leg, i) => {
    const mi = MODE_INFO[leg.mode];
    /* Von der Tür des Auftraggebers bis zur Tür des Empfängers */
    const dist = order ? pathLen(legPts(leg, order, i, last + 1)) : leg.dist;
    const veh = S.fleet.find(f => f.uid === assign[i]);
    if (!veh) { ok = false; return { leg, veh: null, repo: null, time: (dist / 50) * 60, cost: 0, dist }; }
    const t = vType(veh.type);
    const repo = repoCost(veh, leg, order, i);
    if (!repo.ok) { ok = false; }
    const lt = (dist / t.speed) * 60 + (repo.ok ? repo.t : 0) + mi.umschlag * 1.8;
    const lc = (dist + (repo.ok ? repo.d : 0)) * costKmOf(t);
    cost += lc; time += lt;
    return { leg, veh, repo, time: lt, cost: lc, t, dist };
  });
  return { detail, cost, time, ok };
}

/* Eine Zeile der Fahrzeugauswahl: was es ist, wo es gerade steht und was
   die Anfahrt zum Ladeort kosten würde. Ersetzt die frühere Klappliste –
   darin war auf dem Handy nur ein abgeschnittener Name zu sehen. */
function vehOptHTML(r, i, on) {
  const { f, t, rc } = r;
  const here = rc.ok && rc.d < 0.5;
  const badge = !rc.ok
    ? `<span class="vo-b bad">kommt nicht hin</span>`
    : here
      ? `<span class="vo-b ok">✅ vor Ort</span>`
      : `<span class="vo-b ${rc.d > 15 ? "bad" : "warn"}">↩️ ${kmf(rc.d)} leer<small>${dur(rc.t)} · −${money(rc.d * costKmOf(t))}</small></span>`;
  /* Auslastung: wie viel der Nutzlast die Ladung belegt */
  const u = r.sc ? r.sc.util : 1;
  const uTxt = u >= 0.995 ? "voll" : u >= 0.1 ? Math.round(u * 100) + " %" : u >= 0.001 ? fmt(u * 100, 1) + " %" : "< 0,1 %";
  const util = r.sc ? `<i class="vo-u${u < 0.02 && t.cap >= 500 ? " big" : ""}">⚖️ ${uTxt} ausgelastet${u < 0.02 && t.cap >= 500 ? " · überdimensioniert" : ""}</i>` : "";
  return `<button class="vopt${on ? " on" : ""}${r.best ? " best" : ""}" data-leg="${i}" data-uid="${f.uid}" aria-pressed="${on}">
    <span class="vo-ic">${t.icon}</span>
    <span class="vo-tx"><b>${r.best ? `<em class="vo-best">💡 passt am besten</em>` : ""}${esc(t.name)}</b><small>📍 ${esc(vehSpot(f).t)} · ${esc(N[f.at].short)}</small>${util}</span>
    ${badge}
  </button>`;
}

/* ---------------- Fahrzeug fehlt: direkt zum passenden im Markt -------------
   Welche Typen könnten diese Teilstrecke fahren? Gibt es einen eigenen, der
   nur gerade unterwegs ist? Der Knopf springt in den Markt, zeigt nur die
   passenden, und nach dem Kauf geht es zurück zum Auftrag.               */
function fitTypes(leg, o) {
  return VEHICLES.filter(t => t.mode === leg.mode && canCarry(t, o.cargo, o.weight, leg.maxHop))
    .sort((a, b) => a.price - b.price);
}
function missingHelpHTML(leg, o, i) {
  const fit = fitTypes(leg, o);
  const now = fit.filter(t => t.stage <= S.stage && unlockedModes().includes(t.mode));
  const busy = S.fleet.filter(f => f.phase !== "idle" && fit.some(t => t.id === f.type));
  const busyNote = busy.length
    ? `<div class="modenote busynote">⏳ ${busy.slice(0, 2).map(f => vType(f.type).icon + " " + esc(vType(f.type).name) + " · " + esc(phaseLabel(f))).join("<br>")}</div>`
    : "";
  if (!fit.length) return busyNote + `<div class="modenote">Kein Fahrzeug im Spiel schafft diese Teilstrecke – nimm die andere Route oder einen anderen Auftrag.</div>`;
  if (!now.length) {
    const st = Math.min(...fit.map(t => Math.max(t.stage, firstStageWith(t.mode))));
    return busyNote + `<button class="btn tiny ghost disabled shopjump">🔒 Passendes Fahrzeug erst ab Etappe ${st}</button>`;
  }
  const from = now[0].price;
  /* Reicht das Geld nicht, steht gleich die Leasingrate dabei */
  const lease = Math.min(...now.map(t => t.daily + t.price * LEASE_RATE));
  const price = S.money >= from ? "ab " + money(from) : "Leasing ab " + money(lease) + "/Tag";
  return busyNote + `<button class="btn tiny shopjump" data-shop="${i}">🛒 ${now.length === 1 ? esc(now[0].name) : now.length + " passende Fahrzeuge"} im Markt · ${price}</button>`;
}
let marketFocus = null;          /* { orderId, leg, ids, label, at } solange der Markt gefiltert ist */
function openShopFor(legIdx) {
  const ps = planState; if (!ps) return;
  const o = ps.order, leg = ps.variants[ps.vi].legs[legIdx];
  const cg = CARGO[o.cargo], mi = MODE_INFO[leg.mode];
  const ids = fitTypes(leg, o).filter(t => t.stage <= S.stage && unlockedModes().includes(t.mode)).map(t => t.id);
  marketFocus = {
    orderId: o.id, vi: ps.vi, ids, at: leg.from, addr: legIdx === 0 ? oPick(o) : null,
    label: `${mi.icon} ${mi.name} · ab ${kgf(o.weight)}${cg.req.length ? " · " + cg.req.map(flagName).join(" + ") : ""}`
      + `${leg.maxHop > 400 ? " · Reichweite " + kmf(leg.maxHop) : ""}`,
    title: o.shipper, from: legIdx === 0 ? addrText(oPick(o), true) : N[leg.from].name
  };
  closeModal();
  showTab("market");
  $("#view .view-body").scrollTop = 0;
}
function backToOrder() {
  const f = marketFocus; marketFocus = null;
  if (f && S.orders.some(o => o.id === f.orderId)) {
    showTab("orders");
    openPlanner(f.orderId, f.vi);
  } else { toast("Der Auftrag ist inzwischen weg.", "warn"); render(); }
}

/* Freie Fahrzeuge eines anderen Verkehrsträgers tauchen in der Auswahl
   nicht auf. Damit das nicht wie ein Fehler aussieht, steht hier warum –
   etwa: Lastenräder kommen nicht bis zum Flughafen. */
function modeNote(leg, o, ps) {
  const other = S.fleet.filter(f => f.phase === "idle" && vType(f.type).mode !== leg.mode
    && canCarry(vType(f.type), o.cargo, o.weight, null));
  if (!other.length) return "";
  const modes = [...new Set(other.map(f => vType(f.type).mode))];
  const why = modes.map(m => {
    const mi = MODE_INFO[m];
    const alt = ps.variants.findIndex((x, k) => k !== ps.vi && x.legs.some(l => l.mode === m));
    if (alt >= 0) return `${mi.icon} ${mi.name} geht über „${ps.variants[alt].label}“`;
    const stop = leg.nodes.find(id => !N[id].modes.includes(m));
    if (stop) return `${mi.icon} ${mi.name} kommt nicht bis ${N[stop].short}`;
    return `${mi.icon} ${mi.name} schafft diese Strecke nicht`;
  }).join(" · ");
  return `<div class="modenote">ℹ️ Diese Teilstrecke geht nur per ${MODE_INFO[leg.mode].icon} ${MODE_INFO[leg.mode].name}. ${why}.</div>`;
}

/* ------------------------- Minikarte im Planer -------------------------
   Zeigt Abholung, Ziel, die Route und wo die Fahrzeuge gerade stehen. Die
   gestrichelte Linie ist die Leerfahrt. Unterlegt mit denselben OSM-Kacheln
   wie die große Karte; fehlen die, bleibt eine schlichte Fläche.          */
const PM_W = 360, PM_H = 180;
function planMapHTML(ps, ev) {
  const v = ps.variants[ps.vi], o = ps.order;
  const selUids = new Set(ps.assign.filter(Boolean));
  const vehs = [];
  ev.detail.forEach((d, i) => { if (d.veh) vehs.push({ f: d.veh, sel: true, repo: d.repo }); });
  /* Weitere freie Fahrzeuge, die eine Teilstrecke fahren könnten – nur die
     in der Nähe, sonst schrumpft der Ausschnitt auf Briefmarkengröße. */
  const pickA = oPick(o), dropA = oDrop(o), start = addrPt(pickA);
  const span = Math.max(12, v.legs.reduce((a, l) => a + l.dist, 0) * 1.3);
  const others = new Map();
  v.legs.forEach(l => eligible(l, o, []).forEach(f => {
    if (selUids.has(f.uid) || others.has(f.uid)) return;
    if (hav(start, vehPoint(f)) > span) return;
    others.set(f.uid, f);
  }));
  [...others.values()].slice(0, 8).forEach(f => vehs.push({ f, sel: false }));

  /* Punkte sammeln – Netzknoten, die beiden Türen, Stellplätze und
     Leerfahrten – und in Web-Mercator projizieren */
  const keys = [], raw = [];
  const add = (k, p) => { keys.push(k); raw.push(p); };
  v.legs.forEach(l => l.nodes.forEach(id => add(id, nodePt(id))));
  add("@pick", start); add("@drop", addrPt(dropA));
  vehs.forEach(x => {
    add("@v" + x.f.uid, vehPoint(x.f));
    if (x.sel && x.repo && x.repo.ok && x.repo.pts && x.repo.d >= 0.5) x.repo.pts.forEach((p, k) => add("@r" + x.f.uid + "_" + k, p));
  });
  const ll = unwrapLons(raw);
  const W = {};
  keys.forEach((id, k) => { if (!W[id]) W[id] = [projX(ll[k][1]), projY(ll[k][0])]; });
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  Object.values(W).forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  const padX = 34, padY = 30;
  const dx = Math.max(1e-7, x1 - x0), dy = Math.max(1e-7, y1 - y0);
  const z = clamp(Math.min(Math.log2((PM_W - 2 * padX) / dx), Math.log2((PM_H - 2 * padY) / dy)), 1, 14.2);
  const sc = Math.pow(2, z), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const X = wx => (wx - cx) * sc + PM_W / 2, Y = wy => (wy - cy) * sc + PM_H / 2;
  const P = id => [X(W[id][0]), Y(W[id][1])];
  const pct = (a, b) => (a / b * 100).toFixed(3) + "%";

  /* Kacheln */
  const tz = clamp(Math.round(z), 0, 18), n = Math.pow(2, tz), tw = WORLD / n, ts = tw * sc;
  const tx0 = Math.floor((cx - PM_W / 2 / sc) / tw), tx1 = Math.floor((cx + PM_W / 2 / sc) / tw);
  const ty0 = Math.max(0, Math.floor((cy - PM_H / 2 / sc) / tw)), ty1 = Math.min(n - 1, Math.floor((cy + PM_H / 2 / sc) / tw));
  let tiles = "";
  if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) <= 12) {
    for (let tx = tx0; tx <= tx1; tx++) for (let ty = ty0; ty <= ty1; ty++) {
      const src = TILE_SOURCES.osm.url.replace("{z}", tz).replace("{x}", ((tx % n) + n) % n).replace("{y}", ty);
      tiles += `<img src="${src}" alt="" draggable="false" style="left:${pct((tx * tw - cx) * sc + PM_W / 2, PM_W)};top:${pct((ty * tw - cy) * sc + PM_H / 2, PM_H)};width:${pct(ts + 0.6, PM_W)};height:${pct(ts + 0.6, PM_H)}">`;
    }
  }

  const pl = pts => pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  let svg = "";
  /* Route – von Tür zu Tür */
  const nl = v.legs.length;
  v.legs.forEach((l, i) => {
    const city = id => N[id].type === "city";
    const ids = l.nodes.slice(), a = i === 0, b = i === nl - 1;
    if (a && city(ids[0]) && (ids.length > 1 || b)) ids.shift();
    if (b && ids.length && city(ids[ids.length - 1]) && (ids.length > 1 || a)) ids.pop();
    const ks = (a ? ["@pick"] : []).concat(ids, b ? ["@drop"] : []);
    const pts = ks.map(P), c = MODE_INFO[l.mode].color;
    svg += `<polyline points="${pl(pts)}" class="pm-out"/><polyline points="${pl(pts)}" class="pm-route" style="stroke:${c}"/>`;
  });
  /* Leerfahrten der gewählten Fahrzeuge */
  vehs.forEach(x => {
    if (!x.sel || !x.repo || !x.repo.ok || x.repo.d < 0.5 || !x.repo.pts) return;
    const pts = x.repo.pts.map((p, k) => P("@r" + x.f.uid + "_" + k));
    svg += `<polyline points="${pl(pts)}" class="pm-repo-out"/><polyline points="${pl(pts)}" class="pm-repo"/>`;
  });
  /* Umschlagpunkte zwischen zwei Teilstrecken */
  v.legs.slice(1).forEach(l => { const p = P(l.from); svg += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" class="pm-hub"/>`; });

  /* Abholung und Ziel */
  const f1 = n => n.toFixed(1);
  const label = (p, txt, below, cls) => `<text x="${f1(clamp(p[0], 30, PM_W - 30))}" y="${f1(clamp(p[1] + (below ? 23 : -15), 11, PM_H - 4))}" class="pm-lbl${cls ? " " + cls : ""}">${esc(txt)}</text>`;
  const pickP = P("@pick"), dropP = P("@drop");
  const marker = (p, glyph, fill) => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="11" class="pm-node" style="fill:${fill}"/>
    <text x="${f1(p[0])}" y="${f1(p[1] + 4.5)}" class="pm-gl">${glyph}</text>`;
  const anchors = [pickP, dropP].concat(v.legs.slice(1).map(l => P(l.from)));

  /* Fahrzeuge – mehrere am selben Ort werden aufgefächert, eins am
     Abholort rückt neben die Kiste statt sie zu verdecken. Steht eins nur
     knapp daneben, wird es weggeschoben und mit einem Strich an seinen
     echten Standort gebunden – sonst läge es genau auf der Kiste. */
  const FAN = [[-19, -13], [19, -13], [-19, 13], [19, 13], [0, -24], [0, 24], [-30, 0], [30, 0]];
  const MIN = 27;
  const used = {};
  const order = [...vehs].sort((a, b) => (b.sel ? 1 : 0) - (a.sel ? 1 : 0));
  const placed = order.map(x => {
    const id = x.f.at, base = P("@v" + x.f.uid);
    const onMarker = anchors.some(m => Math.hypot(m[0] - base[0], m[1] - base[1]) < 8);
    const slot = base[0].toFixed(0) + "," + base[1].toFixed(0);
    const k = used[slot] = (used[slot] || 0) + 1;
    const off = onMarker ? FAN[(k - 1) % FAN.length] : (k === 1 ? [0, 0] : FAN[(k - 2) % FAN.length]);
    let p = [base[0] + off[0], base[1] + off[1]];
    if (!onMarker) {
      for (const m of anchors) {
        const dx = p[0] - m[0], dy = p[1] - m[1], d = Math.hypot(dx, dy);
        if (d < MIN) p = d > 0.5 ? [m[0] + dx / d * MIN, m[1] + dy / d * MIN] : [m[0], m[1] - MIN];
      }
    }
    p = [clamp(p[0], 13, PM_W - 13), clamp(p[1], 13, PM_H - 13)];
    return { x, id, base, p };
  });

  /* Beschriftungen so legen, dass sie sich nicht gegenseitig verdecken:
     steht das Fahrzeug mit Leerfahrt über der Kiste, kommt dessen Name
     nach oben und der der Kiste nach unten – und umgekehrt. */
  const repV = placed.find(q => q.x.sel && q.x.repo && q.x.repo.ok && q.x.repo.d >= 0.5);
  let pickBelow = pickP[1] < PM_H * 0.45;
  if (repV && Math.hypot(repV.p[0] - pickP[0], repV.p[1] - pickP[1]) < 90) pickBelow = repV.p[1] < pickP[1];
  let dropBelow = dropP[1] < PM_H * 0.45;
  if (Math.abs(dropP[0] - pickP[0]) < 60 && Math.abs(dropP[1] - pickP[1]) < 40) dropBelow = !pickBelow;

  svg += marker(pickP, "📦", "#ffe4a0") + marker(dropP, "🏁", "#ffffff");
  let vsvg = "";
  placed.forEach(({ x, id, base, p }) => {
    const t = vType(x.f.type);
    const r = x.sel ? 11 : 8.5;
    const mc = MODE_INFO[t.mode].color;
    if (Math.hypot(p[0] - base[0], p[1] - base[1]) > 1) vsvg += `<line x1="${f1(base[0])}" y1="${f1(base[1])}" x2="${f1(p[0])}" y2="${f1(p[1])}" class="pm-tie"/>`;
    vsvg += `<g class="pm-veh${x.sel ? " sel" : ""}"><circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r}" style="stroke:${x.sel ? mc : "#8a9bb0"}"/>
      <text x="${f1(p[0])}" y="${f1(p[1] + (x.sel ? 4.2 : 3.4))}" style="font-size:${x.sel ? 12 : 9.5}px">${t.icon}</text></g>`;
  });
  if (repV) {
    const up = Math.hypot(repV.p[0] - pickP[0], repV.p[1] - pickP[1]) < 90 ? repV.p[1] <= pickP[1] : repV.p[1] > PM_H * 0.6;
    vsvg += label(repV.p, N[repV.id].short + " · " + kmf(repV.x.repo.d) + " leer", !up, "warn");
  }
  svg += vsvg + label(pickP, pickA.a || N[o.from].short, pickBelow) + label(dropP, dropA.a || N[o.to].short, dropBelow);

  /* Satz darunter: gibt es eine Leerfahrt, und was kostet sie? */
  const rep = ev.detail.filter(d => d.veh && d.repo && d.repo.ok && d.repo.d >= 0.5);
  let line;
  if (ev.detail.some(d => !d.veh)) {
    line = `<div class="pm-sum bad">🚫 Für ${ev.detail.length > 1 ? "mindestens eine Teilstrecke" : "diese Strecke"} ist gerade kein passendes Fahrzeug frei.</div>`;
  } else if (!rep.length) {
    const f = ev.detail[0].veh;
    line = `<div class="pm-sum ok">✅ Keine Leerfahrt – ${esc(vType(f.type).brand)} steht schon um die Ecke, ${esc(pickA.t)}.</div>`;
  } else {
    const km = rep.reduce((a, d) => a + d.repo.d, 0), mn = rep.reduce((a, d) => a + d.repo.t, 0);
    const eur = rep.reduce((a, d) => a + d.repo.d * costKmOf(d.t), 0);
    const f = rep[0].veh;
    line = `<div class="pm-sum warn">↩️ Leerfahrt ${kmf(km)} · ${dur(mn)} · kostet ${money(eur)} – ${esc(vType(f.type).brand)} kommt aus ${esc(N[f.at].short)}.</div>`;
  }

  return `<div class="pmap">
      <div class="pm-box" style="aspect-ratio:${PM_W}/${PM_H}">
        <div class="pm-tiles">${tiles}</div>
        <svg viewBox="0 0 ${PM_W} ${PM_H}" preserveAspectRatio="none" aria-hidden="true">${svg}</svg>
      </div>
      <div class="pm-key"><span>📦 Abholung</span><span>🏁 Ziel</span><span><i class="k-route"></i>Route</span><span><i class="k-repo"></i>Leerfahrt</span>${others.size ? `<span class="k-other">◯ weitere freie</span>` : ""}</div>
      ${line}
    </div>`;
}

function renderPlanner(fit) {
  const ps = planState; if (!ps) return;
  const o = ps.order, cg = CARGO[o.cargo];
  const v = ps.variants[ps.vi];
  const ev = evaluate(v, o, ps.assign);
  const profit = o.pay - ev.cost;
  const eta = S.time + ev.time;
  const late = eta > o.deadline;
  let repoEur = 0;
  /* Unter 500 m ist das nur die Anfahrt um die Ecke, keine Leerfahrt */
  ev.detail.forEach(d => { if (d.veh && d.repo && d.repo.ok && d.repo.d >= 0.5) repoEur += d.repo.d * costKmOf(d.t); });

  const legHtml = ev.detail.map((d, i) => {
    const mi = MODE_INFO[d.leg.mode];
    const list = eligible(d.leg, o, ps.assign.filter((u, k) => k !== i && u));
    const all = d.veh && !list.some(x => x.uid === d.veh.uid) ? [d.veh, ...list] : list;
    /* Beste Wahl zuerst – dieselbe Rechnung wie bei der automatischen Zuteilung */
    let tB = 0;
    for (let k = 0; k < i; k++) tB += ev.detail[k].time;
    const rest = legTimeRest(v, i + 1);
    const rows = all.map(f => { const sc = vehScore(f, d.leg, o, i, ev.detail.length, tB, rest); return { f, t: sc.t, rc: sc.rc, sc }; })
      .sort((a, b) => a.sc.s - b.sc.s || a.rc.t - b.rc.t);
    if (rows.length > 1 && isFinite(rows[0].sc.s)) rows[0].best = true;
    const LIMIT = 3;
    let shown = ps.showAll && ps.showAll[i] ? rows : rows.slice(0, LIMIT);
    const selRow = rows.find(r => r.f.uid === ps.assign[i]);
    if (selRow && !shown.includes(selRow)) shown = shown.concat(selRow);
    const more = rows.length - shown.length;
    const via = d.leg.nodes.length > 2
      ? `<div class="via">über ${d.leg.nodes.slice(1, -1).map(n => esc(N[n].short)).join(" · ")}</div>` : "";
    return `<div class="leg">
      <div class="leg-head"><span class="mode-chip" style="--c:${mi.color}">${mi.icon} ${mi.name}</span>
        <span class="leg-dist">${kmf(d.dist || d.leg.dist)}</span></div>
      <div class="leg-route">${esc(i === 0 ? addrText(oPick(o), true) : N[d.leg.from].name)} <b>→</b> ${esc(i === ev.detail.length - 1 ? addrText(oDrop(o), true) : N[d.leg.to].name)}</div>
      ${via}
      ${rows.length
        ? `<div class="vpick" data-leg="${i}">
             <div class="vp-h">Fahrzeug wählen <small>· passendstes zuerst</small></div>
             ${shown.map(r => vehOptHTML(r, i, r.f.uid === ps.assign[i])).join("")}
             ${more > 0 ? `<button class="vmore" data-more="${i}">+ ${more} weitere${more === 1 ? "s" : ""} Fahrzeug${more === 1 ? "" : "e"} zeigen</button>` : ""}
           </div>`
        : `<div class="warnbox">Kein freies Fahrzeug: ${mi.name}, mind. ${kgf(o.weight)}${cg.req.length ? ", " + cg.req.map(flagName).join(" + ") : ""}${d.leg.maxHop > 400 ? ", Reichweite " + kmf(d.leg.maxHop) : ""}.</div>`}
      ${modeNote(d.leg, o, ps)}
      ${typeof legEventNote === "function" ? legEventNote(d.leg) : ""}
      ${rows.length ? "" : missingHelpHTML(d.leg, o, i)}
      ${d.repo && !d.repo.ok ? `<div class="warnbox">Dieses Fahrzeug erreicht den Ladeort nicht.</div>` : ""}
    </div>`;
  }).join("");

  $("#modalBody").innerHTML = `
    <div class="mhead">
      <div><div class="mtitle">${o.snus && typeof snusLogo === "function" ? snusLogo(24) : cg.icon} ${esc(o.shipper)}</div>
      <div class="msub">${esc(o.desc)}</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button>
    </div>
    <div class="kpis">
      <div><span>Ladung</span><b>${cg.name} · ${kgf(o.weight)}</b></div>
      <div><span>Relation</span><b>${esc(N[o.from].short)} → ${esc(N[o.to].short)}</b></div>
      <div><span>Frachterlös</span><b class="good">${money(o.pay)}</b></div>
      <div><span>Zustellfrist</span><b>${stamp(o.deadline)}</b></div>
    </div>
    ${planMapHTML(ps, ev)}
    ${ps.variants.length > 1 ? `<div class="vswitch">${ps.variants.map((x, i) =>
      `<button class="${i === ps.vi ? "on" : ""}" data-variant="${i}">${x.label}</button>`).join("")}</div>` : ""}
    <div class="legs">${legHtml}</div>
    ${typeof negoHTML === "function" ? negoHTML(o) : ""}
    <div class="sum">
      <div><span>Transportkosten</span><b>${ev.ok ? money(ev.cost) : "—"}</b>
        ${ev.ok ? `<small class="${repoEur > 0.005 ? "bad" : "good"}">${repoEur > 0.005 ? "davon Leerfahrt " + money(repoEur) : "ohne Leerfahrt"}</small>` : ""}</div>
      <div><span>Laufzeit</span><b>${ev.ok ? dur(ev.time) : "—"}</b></div>
      <div><span>Ankunft</span><b class="${ev.ok ? (late ? "bad" : "good") : ""}">${ev.ok ? stamp(eta) + (late ? " · zu spät" : "") : "—"}</b></div>
      <div><span>Deckungsbeitrag</span><b class="${ev.ok ? (profit > 0 ? "good" : "bad") : ""}">${ev.ok ? money(profit) : "—"}</b></div>
    </div>
    ${o.tut || o.tutNext ? "" : `<button class="rejectlink" id="mReject">🗑️ Ausschreibung ablehnen${o.snus || o.pablo ? " und Kunden blockieren" : ""}</button>`}
    <div class="mbtns">
      <button class="btn ghost" id="mCancel">Abbrechen</button>
      <button class="btn${ev.ok ? "" : " disabled"}" id="mAccept">${ev.ok ? "Auftrag annehmen" : "Fahrzeug fehlt"}</button>
    </div>`;

  $$("#modalBody .pm-tiles img").forEach(img => {
    if (img.complete && !img.naturalWidth) img.remove();
    else img.onerror = () => img.remove();
  });
  $$("#modalBody [data-variant]").forEach(b => b.onclick = () => {
    ps.vi = +b.dataset.variant;
    ps.assign = assignFor(ps.variants[ps.vi], o);
    ps.showAll = {};
    renderPlanner(true);
  });
  $$("#modalBody .vopt").forEach(b => b.onclick = () => {
    ps.assign[+b.dataset.leg] = b.dataset.uid; renderPlanner(false);
  });
  $$("#modalBody [data-shop]").forEach(b => b.onclick = () => openShopFor(+b.dataset.shop));
  $$("#modalBody [data-more]").forEach(b => b.onclick = () => {
    ps.showAll = ps.showAll || {}; ps.showAll[+b.dataset.more] = true; renderPlanner(false);
  });
  $("#mCancel").onclick = () => closeModal();
  $("#mClose").onclick = () => closeModal();
  const rj = $("#mReject");
  if (rj) rj.onclick = () => rejectOrder(o.id);
  if (ev.ok) $("#mAccept").onclick = () => acceptOrder(ps.vi);
  if (typeof bindNego === "function") bindNego(o);
  if (fit) {
    const pts = [];
    v.legs.forEach(l => l.nodes.forEach(id => pts.push([N[id].lat, N[id].lon])));
    map.fitBounds(pts, 80, 11);
  }
  mapRedraw();
  if (typeof tutRefresh === "function") tutRefresh();
}

function acceptOrder(vi) {
  const ps = planState; if (!ps) return;
  const o = ps.order, v = ps.variants[vi];
  startJob(o, v, ps.assign);
  /* Erst Lina Bescheid geben, dann schließen – sonst hielte sie das
     Schließen für ein Abbrechen und schickte einen zurück zur Liste. */
  const tut = tutorialRunning();
  if (typeof tutSignal === "function") tutSignal("orderAccepted", o);
  closeModal();
  if (!tut) toast("Auftrag angenommen: " + o.shipper, "ok");   /* im Tutorial sagt Lina das */
  render();
}

/* Ausschreibung ablehnen: verschwindet ohne Folgen. Bei Mr. Snus' Kunden
   werden die Dosen wieder frei. */
function rejectOrder(id) {
  const o = S.orders.find(x => x.id === id);
  if (!o || o.tut || o.tutNext) return;
  S.orders = S.orders.filter(x => x.id !== id);
  if (planState && planState.order.id === id) closeModal();
  if (selected && selected.id === id) { selected = null; renderInspector(); }
  toast(o.snus || o.pablo ? "🚫 " + o.shipper + " blockiert." : "Ausschreibung abgelehnt: " + o.shipper, "ok");
  save(); render(); mapRedraw();
}
/* Angenommenen Auftrag abbrechen: Privatkunden von Mr. Snus und Don Pablo
   ohne Folgen (Ware zurück ins Lager), reguläre gegen Vertragsstrafe. */
function cancelJob(id) {
  const j = S.jobs.find(x => x.id === id);
  if (!j) return;
  const o = j.order;
  if (o.snus || o.pablo) {
    failJob(j, "abgebrochen");
  } else {
    askConfirm("Auftrag stornieren?", o.shipper + ": Der Auftraggeber berechnet 20 % Vertragsstrafe (" + money(Math.round(o.pay * 0.2)) + "). Das Fahrzeug bleibt, wo es gerade ist.",
      "Stornieren", () => { failJob(j, "storniert"); save(); render(); }, true);
    return;
  }
  save(); render();
}

function startJob(o, variant, assign) {
  const job = {
    id: "J" + (S.seq++), order: o, curLeg: 0, started: S.time, cost: 0,
    legs: variant.legs.map((leg, i, all) => ({
      mode: leg.mode, nodes: leg.nodes.slice(), dist: leg.dist, maxHop: leg.maxHop,
      from: leg.from, to: leg.to, veh: assign[i], done: false,
      a: i === 0 ? addrPt(oPick(o)) : null, b: i === all.length - 1 ? addrPt(oDrop(o)) : null
    }))
  };
  job.legs.forEach(l => { const f = S.fleet.find(x => x.uid === l.veh); if (f) f.phase = "reserved"; });
  if (o.snus && typeof snusTake === "function") snusTake(o);
  if (o.pablo && typeof pabloTake === "function") pabloTake(o);
  S.jobs.push(job);
  S.orders = S.orders.filter(x => x.id !== o.id);
  if (typeof onJobStart === "function") onJobStart(job);
  beginLeg(job, 0);
}

/* ------------------------------ Disposition -------------------------------
   Automatisch disponiert wird nur noch im Büro: Wer dort jemanden aus der
   Disposition sitzen hat, dessen Team verteilt die Aufträge auf die Fahrzeuge
   des Standorts (siehe offices.js). Fahrzeuge ohne Büro teilt der Chef selbst
   ein. Hier steht die Rechnung, mit der das Team entscheidet.

   opt.accept(o)  – welche Ausschreibungen in Frage kommen (Einzugsgebiet)
   opt.maxTake    – wie viele es in dieser Runde höchstens annimmt
   opt.onStart(o) – nach jeder Annahme (Zuschlag, Zähler, Fahrerlimit)
   Die Fahrzeuge kommen aus dispatchPool.                                 */
function dispatchRun(opt) {
  const inPool = f => !dispatchPool || dispatchPool.has(f.uid);
  const idleModes = () => {
    const m = new Set();
    S.fleet.forEach(f => { if (f.phase === "idle" && inPool(f)) m.add(vType(f.type).mode); });
    return m;
  };
  let modes = idleModes();
  if (!modes.size) return 0;
  /* Mr. Snus' Kundschaft fährt die Dispo mit – außer wer auffällig viel zahlt
     oder auffällig viel will: den lässt sie liegen und sagt Bescheid. Ob der
     wirklich ein Fahnder ist (Hemd, glatt rasiert) oder einfach großzügig,
     muss der Chef selbst entscheiden. Don Pablos Ware fasst sie nicht an. */
  S.orders.forEach(o => {
    if (!o.snus || o.snus.flagged || typeof snusSuspicious !== "function" || !snusSuspicious(o) || !opt.accept(o)) return;
    o.snus.flagged = true;
    toast("🕵️ Dispo lässt „" + o.shipper + "“ liegen: " + snusWhy(o) + " – bitte selbst prüfen.", "warn");
  });
  const cands = S.orders.filter(o => !o.pablo && !o.vip && !o.tut && !o.tutNext && !(o.snus && o.snus.flagged) && opt.accept(o))
    .sort((a, b) => b.pay - a.pay);
  let examined = 0, taken = 0;
  for (const o of cands) {
    if (examined++ > 30 || taken >= (opt.maxTake || 1)) break;
    if (!modes.size) break;
    for (const v of buildVariants(o)) {
      if (!v.legs.every(l => modes.has(l.mode))) continue;
      const assign = assignFor(v, o);
      if (assign.some(x => !x)) continue;
      const ev = evaluate(v, o, assign);
      if (!ev.ok) continue;
      /* Verspätung kostet Ruf – die Dispo nimmt nur, was sie pünktlich schafft */
      const over = (S.time + ev.time) - o.deadline;
      if (over > 0) continue;
      if (o.pay - ev.cost <= ev.cost * 0.10) continue;
      if (opt.onBefore) opt.onBefore(o);
      startJob(o, v, assign);
      taken++;
      if (opt.onStart) opt.onStart(o, assign);
      modes = idleModes();
      break;
    }
  }
  return taken;
}

/* -------------------------------- CO₂ ------------------------------------
   Je gefahrenem Kilometer nach Fahrzeug und Beladung (VEH_CO2), Leerfahrten
   eingeschlossen. Dazu Tonnenkilometer für die Kennzahl g CO₂ je tkm und
   die Ersparnis der Räder gegenüber einem Kastenwagen.                   */
function co2State() {
  if (!S.eco) S.eco = { kg: 0, empty: 0, tkm: 0, bikeKm: 0, byMode: {} };
  return S.eco;
}
function addCO2(veh, t, km, loadKg) {
  const f = VEH_CO2[t.id] || [0.2, 0.3];
  const share = t.cap > 0 ? Math.min(1, loadKg / t.cap) : 0;
  const kg = km * (f[0] + (f[1] - f[0]) * share);
  const e = co2State();
  e.kg += kg;
  if (!loadKg) e.empty += kg;
  e.tkm += km * loadKg / 1000;
  e.byMode[t.mode] = (e.byMode[t.mode] || 0) + kg;
  if (t.mode === "b") e.bikeKm += km;
}
function co2f(kg) { return kg >= 1000 ? fmt(kg / 1000, kg >= 1e5 ? 0 : 1) + " t" : fmt(kg, kg < 10 ? 1 : 0) + " kg"; }

/* ------------------------------- Simulation ----------------------------- */
function legCoords(leg) {
  /* a = Tür des Auftraggebers, b = Tür des Empfängers (nur bei Aufträgen) */
  if (!leg._c) leg._c = unwrapLons(pathPts(leg.nodes, leg.a, leg.b));
  return leg._c;
}
/* Linie über die Netzknoten, beginnend/endend an einer Adresse. Stadtteile
   sind nur Knoten im Netz: von der Tür geht es direkt zum nächsten echten
   Wegpunkt statt erst zur Mitte des Stadtteils (sonst entstehen Zacken).
   Häfen, Flughäfen und Terminals werden immer angefahren. */
function pathPts(nodes, a, b) {
  const ids = nodes.slice();
  const city = id => N[id] && N[id].type === "city";
  if (a && ids.length && city(ids[0]) && (ids.length > 1 || b)) ids.shift();
  if (b && ids.length && city(ids[ids.length - 1]) && (ids.length > 1 || a)) ids.pop();
  const pts = ids.map(nodePt);
  if (a) pts.unshift(a);
  if (b) pts.push(b);
  return pts;
}
/* Gefahrene Linie einer Teilstrecke im Planer – dieselbe wie später auf der Karte */
function legPts(leg, order, i, n) {
  return pathPts(leg.nodes, order && i === 0 ? addrPt(oPick(order)) : null, order && i === n - 1 ? addrPt(oDrop(order)) : null);
}

/* ------------------------------- Adressen --------------------------------
   Aufträge holen beim Auftraggeber ab und liefern beim Empfänger – beide
   mit eigener Adresse (places.js). Fahrzeuge parken nach der Zustellung
   dort, wo sie abgeladen haben.                                          */
function nodePt(id) { return [N[id].lat, N[id].lon]; }
function nodeAddr(id) { const n = N[id]; return { lat: n.lat, lon: n.lon, t: n.name, a: n.short }; }
function ensureAddr(o) {
  if (!o.pick) o.pick = (typeof makeAddr === "function" && makeAddr(o.from)) || nodeAddr(o.from);
  if (!o.drop) o.drop = (typeof makeAddr === "function" && makeAddr(o.to)) || nodeAddr(o.to);
  return o;
}
function oPick(o) { return ensureAddr(o).pick; }
function oDrop(o) { return ensureAddr(o).drop; }
function legStartPt(leg, order, i) { return i === 0 && order ? addrPt(oPick(order)) : nodePt(leg.from); }
function lastMileKm(o) { return hav(addrPt(oPick(o)), nodePt(o.from)) + hav(nodePt(o.to), addrPt(oDrop(o))); }
const normLon = lon => ((lon + 540) % 360) - 180;
function setSpot(v, p, addr) {
  v.spot = { lat: +p[0].toFixed(5), lon: +normLon(p[1]).toFixed(5), t: addr ? addr.t : N[v.at].name, a: addr ? addr.a : N[v.at].short };
  v.spotAt = v.at;
}
/* Wo ein Fahrzeug parkt. Neue Fahrzeuge stehen auf dem Firmenhof des
   Stadtteils – gibt es dort schon einen, stellen sie sich dazu. */
function vehSpot(v) {
  if (!v.spot || v.spotAt !== v.at) {
    const mate = S.fleet.find(f => f !== v && f.spot && f.spotAt === v.at && /^Stellplatz/.test(f.spot.t));
    const a = mate ? Object.assign({}, mate.spot) : ((typeof makeAddr === "function" && makeAddr(v.at, "yard")) || nodeAddr(v.at));
    v.spot = { lat: a.lat, lon: a.lon, t: a.t, a: a.a }; v.spotAt = v.at;
  }
  return v.spot;
}
function vehPoint(v) {
  if ((v.phase === "repo" || v.phase === "haul") && v.route) return routePointAt(v.route, v.pos);
  return addrPt(vehSpot(v));
}
function pathLen(route) {
  let d = 0;
  for (let i = 1; i < route.length; i++) d += hav(route[i - 1], route[i]);
  return d;
}
function routePointAt(route, pos) {
  if (!route || route.length < 2) return route ? route[0] : null;
  let acc = 0;
  for (let i = 1; i < route.length; i++) {
    const d = hav(route[i - 1], route[i]);
    if (acc + d >= pos) {
      const f = d === 0 ? 0 : (pos - acc) / d;
      return [route[i - 1][0] + (route[i][0] - route[i - 1][0]) * f,
              route[i - 1][1] + (route[i][1] - route[i - 1][1]) * f];
    }
    acc += d;
  }
  return route[route.length - 1];
}

function beginLeg(job, idx) {
  const leg = job.legs[idx];
  const veh = S.fleet.find(f => f.uid === leg.veh);
  if (!veh) { failJob(job, "Fahrzeug nicht mehr verfügbar"); return; }
  veh.jobId = job.id; veh.legIdx = idx; veh.pos = 0;
  const r = repoCost(veh, leg, job.order, idx);
  if (!r.ok) { failJob(job, "Leerfahrt zum Ladeort nicht möglich"); return; }
  if (r.d > 0.03) {                      /* erst hinfahren – zur Tür oder zum Terminal */
    veh.phase = "repo";
    veh.route = unwrapLons(r.pts);
    veh.routeDist = pathLen(veh.route);
  } else {
    veh.phase = "load";
    veh.timer = MODE_INFO[leg.mode].umschlag * rnd(0.8, 1.25) * umschlagFactor(leg.from) * (job.fastLoad ? 0.6 : 1);
    veh.route = null; veh.routeDist = 0;
  }
}

/* Fahrzeug bleibt dort stehen, wo es gerade ist (statt zurückzuspringen) */
function parkHere(f) {
  const moving = (f.phase === "repo" || f.phase === "haul") && f.route;
  if (!moving) return;
  const p = routePointAt(f.route, f.pos);
  const job = S.jobs.find(j => j.id === f.jobId), leg = job && job.legs[f.legIdx];
  const cands = leg ? [f.at, leg.from, leg.to] : [f.at];
  let best = f.at, bd = Infinity;
  cands.forEach(id => { if (!N[id]) return; const d = hav(p, nodePt(id)); if (d < bd) { bd = d; best = id; } });
  f.at = best;
  setSpot(f, p, { t: "abgestellt unterwegs", a: N[best].short });
}
function failJob(job, reason) {
  if (typeof onFailed === "function") onFailed(job, reason);
  job.legs.forEach(l => {
    const f = S.fleet.find(x => x.uid === l.veh);
    if (f && f.jobId === job.id || (f && f.phase === "reserved")) {
      parkHere(f);
      f.phase = "idle"; f.jobId = null; f.legIdx = -1; f.route = null; delete f.halt;
    }
  });
  /* Privatkunde von Mr. Snus / Don Pablo: keine Vertragsstrafe, die Ware geht zurück ins Lager */
  if (job.order.pablo) {
    if (typeof pabloGiveBack === "function") pabloGiveBack(job.order);
    S.jobs = S.jobs.filter(j => j.id !== job.id);
    toast("❄️ " + job.order.shipper + (reason === "abgebrochen" ? ": Übergabe abgebrochen" : " ist abgesprungen") + " – die Ware liegt wieder im Hangar.", "warn");
    return;
  }
  if (job.order.snus) {
    if (typeof snusGiveBack === "function") snusGiveBack(job.order);
    S.jobs = S.jobs.filter(j => j.id !== job.id);
    toast("[[snus]] " + job.order.shipper + (reason === "abgebrochen" ? ": Übergabe abgebrochen" : " hat abgesagt") + " – Dosen wieder im Lager.", "warn");
    return;
  }
  const fee = Math.round(job.order.pay * 0.2);
  S.money -= fee; S.expense += fee; S.failed++;
  logMoney("fail", job.order.shipper + " · " + reason, -fee);
  S.jobs = S.jobs.filter(j => j.id !== job.id);
  toast("❌ Auftrag geplatzt (" + reason + "): -" + money(fee), "bad");
}

function finishLeg(job, veh) {
  const leg = job.legs[veh.legIdx];
  leg.done = true;
  veh.phase = "idle"; veh.jobId = null; veh.legIdx = -1; veh.route = null; veh.jobs++;
  job.curLeg++;
  if (job.curLeg < job.legs.length) { beginLeg(job, job.curLeg); return; }

  const o = job.order;
  /* Übergabe an verdeckte Ermittler: statt Geld gibt es Handschellen */
  if (o.snus && o.snus.cop && typeof snusBust === "function") {
    S.jobs = S.jobs.filter(j => j.id !== job.id);
    snusBust(job);
    return;
  }
  if (o.pablo && o.pablo.cop && typeof pabloBust === "function") {
    S.jobs = S.jobs.filter(j => j.id !== job.id);
    pabloBust(job);
    return;
  }
  const late = S.time > o.deadline;
  let pay = o.pay;
  if (late) {
    const h = (S.time - o.deadline) / 60;
    pay = Math.round(pay * Math.max(0.2, 1 - h * 0.04));
    S.late++;
  }
  /* Unfall unterwegs: ohne Versicherung zieht der Kunde ein Viertel ab */
  if (o.damaged && !S.insure) { pay = Math.round(pay * 0.75); toast("💥 Beschädigte Ladung: " + o.shipper + " zieht 25 % ab.", "warn"); }
  S.money += pay; S.revenue += pay; S.done++;
  if (o.snus) {
    logMoney("snus", o.shipper + " · " + o.snus.n + " Dosen", pay);
    if (typeof snusDelivered === "function") snusDelivered(o, pay);
  } else if (o.pablo) {
    logMoney("pablo", o.shipper + " · " + kgf(o.pablo.kg), pay);
    if (typeof pabloDelivered === "function") pabloDelivered(o, pay);
  } else logMoney("job", o.shipper + " · " + N[o.from].short + " → " + N[o.to].short, pay);
  if (job.cost > 0) logMoney("drive", "Fahrt und Umschlag · " + o.shipper, -job.cost);
  S.xp += Math.max(3, Math.round(Math.pow(Math.max(1, pay), 0.55) / 2.2));
  S.jobs = S.jobs.filter(j => j.id !== job.id);
  if (typeof onDelivered === "function") onDelivered(job, pay, late);
  if (late) toast("⏰ Verspätet zugestellt: " + o.shipper, "warn", true);
  checkLevel();
}

let lastLevel = 1;
function checkLevel() {
  const l = level();
  if (l > lastLevel) {
    lastLevel = l;
    toast("🎉 Level " + l + " erreicht!", "ok");
    if (S.fog) toast("☁️ Der Nebel lichtet sich: " + kmf(fogRadiusKm(S.stage, l)) + " Sichtweite.", "ok");
    const nx = STAGES[S.stage];
    if (nx && l >= nx.reqLevel) toast("🌍 Etappe „" + nx.name + "“ kann freigeschaltet werden.", "ok");
  }
}

function tick(dtMin) {
  S.time += dtMin;
  const d = Math.floor(S.time / 1440);
  if (d > S.lastDay) {
    const days = d - S.lastDay;
    S.lastDay = d;
    const fix = S.fleet.reduce((a, f) => a + dailyCost(f), 0) * days;
    if (fix > 0) { S.money -= fix; S.expense += fix; logMoney("fleet", "Tagesfixkosten Flotte", -fix); }
    baseDayChange(days);
    if (typeof dayExtras === "function") dayExtras(days);
  }

  for (const veh of S.fleet) {
    if (!veh.jobId) continue;
    const job = S.jobs.find(j => j.id === veh.jobId);
    if (!job) { veh.phase = "idle"; veh.jobId = null; veh.route = null; continue; }
    const leg = job.legs[veh.legIdx];
    if (!leg) continue;
    const t = vType(veh.type);

    if (veh.phase === "load" || veh.phase === "unload") {
      if (typeof hubHold === "function" && hubHold(veh, leg)) continue;   /* Sturm, Streik am Umschlagplatz */
      veh.timer -= dtMin;
      if (veh.timer <= 0) {
        if (veh.phase === "load") {
          veh.phase = "haul";
          veh.route = legCoords(leg);
          veh.routeDist = pathLen(veh.route);
          veh.pos = 0;
        } else {
          finishLeg(job, veh);
        }
      }
      continue;
    }
    if (veh.phase === "repo" || veh.phase === "haul") {
      const mf = typeof moveFactor === "function" ? moveFactor(veh, leg, job) : 1;
      const step = (t.speed * (typeof vehSpeedFactor === "function" ? vehSpeedFactor(veh) : 1) * mf * dtMin) / 60;
      veh.pos += step; veh.kmTotal += step;
      if (step > 0 && typeof onDriven === "function") onDriven(veh, t, step, job, leg);
      if (veh.phase === "haul") S.kmTotal += step;
      addCO2(veh, t, step, veh.phase === "haul" ? job.order.weight : 0);
      if (veh.pos >= veh.routeDist) {
        const cost = veh.routeDist * costKmOf(t);
        S.money -= cost; S.expense += cost; job.cost += cost;
        const end = veh.route[veh.route.length - 1];
        const li = job.legs.indexOf(leg), lastLeg = li === job.legs.length - 1;
        veh.pos = 0; veh.route = null;
        if (veh.phase === "repo") {
          veh.at = leg.from;
          setSpot(veh, end, li === 0 ? oPick(job.order) : nodeAddr(leg.from));
          veh.phase = "load"; veh.timer = MODE_INFO[leg.mode].umschlag * rnd(0.8, 1.25) * umschlagFactor(leg.from) * (job.fastLoad ? 0.6 : 1);
        } else {
          veh.at = leg.to;
          setSpot(veh, end, lastLeg && leg.b ? oDrop(job.order) : nodeAddr(leg.to));
          veh.phase = "unload"; veh.timer = MODE_INFO[leg.mode].umschlag * rnd(0.55, 0.95) * umschlagFactor(leg.to);
        }
      }
    }
  }

  const before = S.orders.length;
  S.orders = S.orders.filter(o => o.expire > S.time && o.deadline > S.time + 30);
  if (S.orders.length !== before) renderDirty = true;
  if (S.time - S.lastSpawn > 120) { S.lastSpawn = S.time; if (spawnOrders(3 + Math.floor(S.fleet.length / 6))) renderDirty = true; }
  /* Anfangs nur ab und zu ein Juwelier, später regelmäßig */
  if (S.time - (S.lastJewel || -999) > (S.stage <= 2 ? 150 : 75)) { S.lastJewel = S.time; spawnJewels(); }
  if (typeof prunePhone === "function") prunePhone();
  tickBases(dtMin);
  if (typeof tickSnus === "function") tickSnus(dtMin);
  if (typeof tickPablo === "function") tickPablo(dtMin);
  if (typeof tickExtras === "function") tickExtras(dtMin);
}

/* ------------------------------- Etappen -------------------------------- */
function unlockStage() {
  const next = STAGES[S.stage];
  if (!next) return toast("Die ganze Welt gehört dir bereits.", "ok");
  if (level() < next.reqLevel) return toast("Dafür brauchst du Level " + next.reqLevel + ".", "warn");
  if (S.money < next.cost) return toast("Investition von " + money(next.cost) + " nötig.", "warn");
  S.money -= next.cost; S.expense += next.cost; S.stage++;
  logMoney("stage", "Etappe " + next.name + " freigeschaltet", -next.cost);
  clearRouteCache(); buildNetBuffers();
  toast("🌍 Etappe " + S.stage + " freigeschaltet: " + next.name, "ok");
  spawnOrders(6);
  map.flyTo(next.center, next.zoom, 1600);
  render();
}

/* --------------------------- Kartendarstellung -------------------------- */
let map = null;
let selected = null;
function mapRedraw() { if (map) map.redraw(); }

/* ------------------------- Live-Verfolgung ------------------------------ */
function vehPos(v) { return vehPoint(v); }
function setFollow(uid) {
  S.follow = uid || null;
  if (uid) {
    const v = S.fleet.find(f => f.uid === uid);
    if (v) {
      const p = vehPos(v);
      if (p) map.flyTo(p, Math.max(map.zoom, v.phase === "haul" ? 6 : 9), 700);
    }
  }
  renderFollowBar();
  if (activeTab === "jobs" || activeTab === "fleet") render();
}
function followNext() {
  const moving = S.fleet.filter(f => f.phase === "haul" || f.phase === "repo");
  const list = moving.length ? moving : S.fleet;
  if (!list.length) return toast("Noch kein Fahrzeug unterwegs.", "warn");
  const i = list.findIndex(f => f.uid === S.follow);
  setFollow(list[(i + 1) % list.length].uid);
}
function renderFollowBar() {
  const bar = $("#followBar");
  const v = S.follow ? S.fleet.find(f => f.uid === S.follow) : null;
  const note = $("#fogNote");
  if (note) note.style.display = v ? "none" : "";
  if (!v) { bar.classList.remove("on"); bar.innerHTML = ""; return; }
  const t = vType(v.type);
  bar.classList.add("on");
  bar.innerHTML = `<div class="follow-chip"><i class="dot"></i>
    <span>${t.icon} ${esc(phaseLabel(v))}</span>
    <button id="followOff" aria-label="Verfolgung beenden">✕</button></div>`;
  $("#followOff").onclick = () => setFollow(null);
}
function tickFollow() {
  if (!S.follow || map.animating()) return;
  const v = S.fleet.find(f => f.uid === S.follow);
  if (!v) return setFollow(null);
  const p = vehPos(v);
  if (p) map.panTo(p);
}

const TYPE_GLYPH = { city: "🏙️", port: "⚓", air: "🛫", rail: "🚉" };

/* ------------------------------ Emojis auf der Karte ------------------------------
   Canvas setzt Emojis je nach Gerät und Zeichen unterschiedlich: manche sitzen
   tief, manche rechts (🛥️, ✈️ …), weil die Schriftmetrik nicht zur Grafik passt.
   Darum wird jedes Emoji einmal groß gezeichnet, sein sichtbarer Umriss
   ausgemessen und als Bildchen gespeichert. Gezeichnet wird dann genau um die
   Mitte der sichtbaren Pixel – und alle gleich groß, egal ob breit oder hoch. */
const EMOJI_FONT = "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','Twemoji Mozilla',system-ui,sans-serif";
const emojiCache = new Map();
function emojiSprite(ch) {
  let sp = emojiCache.get(ch);
  if (sp !== undefined) return sp;
  sp = null;
  try {
    const F = 96, W = F * 2;
    const cv = document.createElement("canvas");
    cv.width = cv.height = W;
    const c = cv.getContext("2d", { willReadFrequently: true });
    c.font = F + "px " + EMOJI_FONT;
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#0d1b2a";
    c.fillText(ch, W / 2, W / 2);
    const d = c.getImageData(0, 0, W, W).data;
    let x0 = W, y0 = W, x1 = -1, y1 = -1;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 >= x0 && y1 >= y0) {
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      const out = document.createElement("canvas");
      out.width = w; out.height = h;
      out.getContext("2d").drawImage(cv, x0, y0, w, h, 0, 0, w, h);
      sp = { cv: out, w, h };
    }
  } catch (e) { sp = null; }
  emojiCache.set(ch, sp);
  return sp;
}
/* size = Kantenlänge des gedachten Quadrats, in das das Emoji passt */
function drawEmoji(c, ch, x, y, size) {
  const sp = emojiSprite(ch);
  if (!sp) {                                     /* Notlösung: wie früher als Text */
    c.font = Math.round(size) + "px " + EMOJI_FONT;
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#0d1b2a";
    c.fillText(ch, x, y + 1);
    return;
  }
  const k = size / Math.max(sp.w, sp.h);
  const w = sp.w * k, h = sp.h * k;
  const q = c.imageSmoothingQuality;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(sp.cv, x - w / 2, y - h / 2, w, h);
  c.imageSmoothingQuality = q;
}

/* Das Infrastrukturnetz ändert sich nur beim Etappenwechsel. Einmal
   projizieren spart pro Bild mehrere tausend Rechnungen. */
let netBuffers = {};
/* Für die Darstellung reicht ein Grundgerüst: je Knoten und Verkehrsträger
   nur die kürzesten Verbindungen. Geroutet wird weiterhin über das volle Netz,
   aber die Karte bleibt lesbar statt zum Spinnennetz zu werden. */
const NET_KEEP = { r: 3, l: 3, b: 3, i: 99, s: 99, a: 99 };

function buildNetBuffers() {
  const um = unlockedModes();
  const acc = {};
  const seen = new Set();
  Object.keys(ADJ).forEach(a => {
    if (!isUnlocked(a)) return;
    const byMode = {};
    ADJ[a].forEach(e => {
      if (!isUnlocked(e.to) || !um.includes(e.mode)) return;
      (byMode[e.mode] = byMode[e.mode] || []).push(e);
    });
    Object.keys(byMode).forEach(mode => {
      const list = byMode[mode].sort((x, y) => x.dist - y.dist).slice(0, NET_KEEP[mode] || 3);
      list.forEach(e => {
        const k = (a < e.to ? a + e.to : e.to + a) + mode;
        if (seen.has(k)) return; seen.add(k);
        const A = N[a], B = N[e.to];
        let lon2 = B.lon;
        while (lon2 - A.lon > 180) lon2 -= 360;
        while (A.lon - lon2 > 180) lon2 += 360;
        const p1 = map.projectPoint(A.lat, A.lon), p2 = map.projectPoint(B.lat, lon2);
        (acc[mode] = acc[mode] || []).push(p1[0], p1[1], p2[0], p2[1]);
      });
    });
  });
  netBuffers = {};
  Object.keys(acc).forEach(k => { netBuffers[k] = Float64Array.from(acc[k]); });
}

/* ---------------------- Nebel über unerschlossenem Gebiet ---------------- */
let fogCv = null, fogC = null, lastFogKm = 0;

function drawFog(m, ctx) {
  if (!S.fog) return;
  const km = fogRadiusKm(S.stage, level());
  const W = m.width, H = m.height;
  const q = Math.min(1, m.dpr) * 0.55;            // Nebel braucht keine volle Auflösung
  if (!fogCv) { fogCv = document.createElement("canvas"); fogC = fogCv.getContext("2d"); }
  const cw = Math.max(1, Math.round(W * q)), ch = Math.max(1, Math.round(H * q));
  if (fogCv.width !== cw || fogCv.height !== ch) { fogCv.width = cw; fogCv.height = ch; }
  const f = fogC;
  f.setTransform(q, 0, 0, q, 0, 0);
  f.globalCompositeOperation = "source-over";
  f.clearRect(0, 0, W, H);
  f.fillStyle = "rgba(19,39,63,0.88)";
  f.fillRect(0, 0, W, H);
  f.globalCompositeOperation = "destination-out";

  const world = 256 * Math.pow(2, m.zoom);
  let anyVisible = false;

  // Lichtkegel um jeden erschlossenen Standort
  unlockedNodes().forEach(n => {
    const pxPerKm = (world / 360) / (111.32 * Math.max(0.15, Math.cos(n.lat * Math.PI / 180)));
    const r = Math.max(30, km * pxPerKm);
    const p = m.screenPos(n.lat, n.lon);
    if (p[0] < -r || p[0] > W + r || p[1] < -r || p[1] > H + r) return;
    anyVisible = true;
    const g = f.createRadialGradient(p[0], p[1], r * 0.62, p[0], p[1], r);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    f.fillStyle = g;
    f.beginPath(); f.arc(p[0], p[1], r, 0, 7); f.fill();
  });

  // Die eigenen Routen leuchten frei
  f.strokeStyle = "rgba(0,0,0,0.92)";
  f.lineCap = "round"; f.lineJoin = "round";
  f.lineWidth = Math.max(16, Math.min(46, 8 + m.zoom * 3));
  S.jobs.forEach(job => job.legs.forEach(l => {
    const c = legCoords(l);
    f.beginPath();
    c.forEach((pt, i) => {
      const p = m.screenPos(pt[0], pt[1]);
      if (i === 0) f.moveTo(p[0], p[1]); else f.lineTo(p[0], p[1]);
    });
    f.stroke();
  }));

  // Fahrzeuge tragen ihr eigenes Licht
  S.fleet.forEach(v => {
    const pos = vehPos(v);
    if (!pos) return;
    const p = m.screenPos(pos[0], pos[1]);
    const r = 46;
    const g = f.createRadialGradient(p[0], p[1], 8, p[0], p[1], r);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    f.fillStyle = g;
    f.beginPath(); f.arc(p[0], p[1], r, 0, 7); f.fill();
  });

  f.globalCompositeOperation = "source-over";
  ctx.drawImage(fogCv, 0, 0, W, H);

  if (km !== lastFogKm) { lastFogKm = km; renderFogNote(km); }
}

function renderFogNote(km) {
  const el = $("#fogNote");
  if (!el) return;
  if (!S.fog) { el.innerHTML = ""; return; }
  el.innerHTML = `<div class="fog-note">☁️ erschlossen: ${kmf(km)} um jeden Standort</div>`;
}

function drawWorld(m, ctx) {
  const z = m.zoom;
  drawFog(m, ctx);

  // 1. Das Verkehrsnetz als Linienteppich bleibt aus (der Schalter ist weg) –
  //    sichtbar sind die Strecken der laufenden Aufträge.

  // 2. Laufende Aufträge – die aktive Teilstrecke läuft sichtbar mit
  const dashOff = -(performance.now() / 40) % 22;
  S.jobs.forEach(job => {
    job.legs.forEach((l, i) => {
      const mi = MODE_INFO[l.mode];
      const active = !l.done && i === job.curLeg;
      m.line(legCoords(l), {
        color: mi.color, width: l.done ? 3 : (active ? 5.5 : 4),
        alpha: l.done ? 0.3 : (active ? 1 : 0.6),
        dash: active ? [13, 9] : [], dashOffset: active ? dashOff : 0,
        outline: "rgba(13,27,42,0.5)", outlineWidth: l.done ? 2 : 3
      });
    });
  });

  // 3. Vorschau im Planungsdialog – mit den letzten Metern bis zur Tür
  if (planState) {
    const v = planState.variants[planState.vi], o = planState.order, n = v.legs.length;
    v.legs.forEach((l, i) => {
      const mi = MODE_INFO[l.mode];
      m.line(unwrapLons(legPts(l, o, i, n)), {
        color: mi.color, width: 5, dash: [10, 8],
        dashOffset: -(performance.now() / 45) % 18,
        outline: "rgba(16,34,47,0.6)", outlineWidth: 3
      });
    });
  }
  // 3b. Angetippte Ausschreibung: gestrichelt von der Abholung zum Ziel
  const selOrder = selected && selected.kind === "order" ? S.orders.find(o => o.id === selected.id) : null;
  if (selOrder && !planState) {
    m.line(unwrapLons([addrPt(oPick(selOrder)), addrPt(oDrop(selOrder))]), {
      color: "#ffc12e", width: 4, dash: [9, 7], dashOffset: -(performance.now() / 45) % 16,
      outline: "rgba(13,27,42,0.55)", outlineWidth: 3
    });
  }

  // 4. Knoten
  const showLabel = z >= 5.4;
  const placed = [];
  const fits = (x, y, w) => {
    for (const p of placed) if (Math.abs(p[0] - x) < (p[2] + w) / 2 + 4 && Math.abs(p[1] - y) < 13) return false;
    placed.push([x, y, w]); return true;
  };
  const hot = new Set();
  S.jobs.forEach(j => { hot.add(j.order.from); hot.add(j.order.to); });
  if (planState) { hot.add(planState.order.from); hot.add(planState.order.to); }
  unlockedNodes().forEach(n => {
    /* Stadtteile sind nur Knoten im Netz – aus der Nähe zählt die Adresse,
       also dort kein Punkt mehr mitten auf der Kreuzung. Häfen, Flughäfen
       und Terminals bleiben: das sind echte Orte. */
    if (n.type === "city" && z >= CITY_DOT_MAX_Z) return;
    const big = n.type !== "city" || z >= 8;
    const labelOk = n.type !== "city" ? z >= 5.4 : z >= 10.2;
    const r = z < 4 ? 5 : (big ? 9 : 7);
    m.pin(n.lat, n.lon, (c, x, y) => {
      c.beginPath(); c.arc(x + 1.5, y + 2, r, 0, 7); c.fillStyle = "rgba(16,34,47,0.45)"; c.fill();
      c.beginPath(); c.arc(x, y, r, 0, 7);
      c.fillStyle = n.type === "port" ? "#9fd7ef" : n.type === "air" ? "#ffc3cd" : n.type === "rail" ? "#d6c9ff" : "#ffe4a0";
      c.fill();
      c.lineWidth = 2.2; c.strokeStyle = "#10222f"; c.stroke();
      if (z >= 6.5 && TYPE_GLYPH[n.type]) drawEmoji(c, TYPE_GLYPH[n.type], x, y, r * 1.2);
      if (labelOk || (hot.has(n.id) && z >= 2.0)) {
        const label = n.short;
        c.font = "700 11px " + LABEL_FONT;
        const w = c.measureText(label).width;
        if (fits(x, y + r + 8, w)) {
          c.textAlign = "center"; c.textBaseline = "top";
          c.lineWidth = 3.5; c.strokeStyle = "rgba(255,246,227,0.92)";
          c.strokeText(label, x, y + r + 2);
          c.fillStyle = "#12232f";
          c.fillText(label, x, y + r + 2);
        }
      }
    });
  });

  // 5. Büros und Stecknadeln der Aufträge
  if (typeof drawEvents === "function") drawEvents(m);
  drawBases(m, z);
  drawPins(m, z);

  // 6. Fahrzeuge
  const now = performance.now();
  const fan = vehFan();
  S.fleet.forEach(v => {
    const t = vType(v.type);
    const p = vehPos(v);
    if (!p) return;
    const moving = v.phase === "haul" || v.phase === "repo";
    const mi = MODE_INFO[t.mode];
    const bob = moving ? Math.sin(now / 260 + v.uid.length) * 2 : 0;
    const r = moving ? 15 : 12.5;
    const fo = fan[v.uid];
    m.pin(p[0], p[1], (c, x, y) => {
      if (fo) { x += fo[0]; y += fo[1]; }
      y += bob;
      if (moving) {                                   // Pulsierender Ring = fährt gerade
        const k = (now / 1100) % 1;
        c.beginPath(); c.arc(x, y, r + 4 + k * 11, 0, 7);
        c.strokeStyle = mi.color; c.globalAlpha = 0.45 * (1 - k);
        c.lineWidth = 3; c.stroke(); c.globalAlpha = 1;
      }
      c.beginPath(); c.arc(x + 2, y + 2.5, r, 0, 7); c.fillStyle = "rgba(13,27,42,0.4)"; c.fill();
      c.beginPath(); c.arc(x, y, r, 0, 7);
      c.fillStyle = "#ffffff"; c.fill();
      c.lineWidth = 3; c.strokeStyle = mi.color; c.stroke();
      c.lineWidth = 2.4; c.strokeStyle = "#0d1b2a";
      c.beginPath(); c.arc(x, y, r + 1.6, 0, 7); c.stroke();
      drawEmoji(c, t.icon, x, y, r * 1.3);
      if (!moving) {
        c.beginPath(); c.arc(x + r * 0.72, y - r * 0.72, 4, 0, 7);
        c.fillStyle = "#9fb0c2"; c.fill();
        c.lineWidth = 1.8; c.strokeStyle = "#0d1b2a"; c.stroke();
      }
      const isSel = selected && selected.kind === "veh" && selected.id === v.uid;
      if (S.follow === v.uid || isSel) {
        c.beginPath(); c.arc(x, y, r + 7, 0, 7);
        c.lineWidth = 3; c.strokeStyle = S.follow === v.uid ? "#19b8c9" : "#e2465f";
        c.setLineDash([6, 5]); c.lineDashOffset = -(now / 60) % 11;
        c.stroke(); c.setLineDash([]);
      }
    });
  });
}
const LABEL_FONT = "'Baloo 2', system-ui, sans-serif";
const CITY_DOT_MAX_Z = 9;

/* ------------------------------ Stecknadeln -------------------------------
   Gelb: offene Ausschreibung beim Auftraggeber. Grau: Kundschaft von
   Mr. Snus und Don Pablo. Orange: angenommen und in Arbeit – steht an der
   Abholung, bis geladen ist, danach am Ziel. Liegen Nadeln zu dicht, werden
   sie zu einer mit Zahl zusammengefasst; Antippen zoomt hinein.        */
/* Mr. Snus' Logo als Bild für die Karte (einmal aus dem SVG gebaut) */
const SNUS_PIN = "@snus";
let snusImg = null;
function snusPinImg() {
  if (snusImg) return snusImg.complete ? snusImg : null;
  if (typeof snusLogo !== "function") return null;
  snusImg = new Image();
  snusImg.onload = () => mapRedraw();
  snusImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(snusLogo(64, true));
  return null;
}
const PIN_COL = { yellow: "#ffc12e", orange: "#ff8a3d", gray: "#a3aebb", white: "#ffffff" };
let pinHits = [];
function jobPicked(j) {
  if (j.curLeg > 0 || j.legs[0].done) return true;
  const v = S.fleet.find(f => f.uid === j.legs[0].veh);
  return !!(v && v.jobId === j.id && v.legIdx === 0 && (v.phase === "haul" || v.phase === "unload"));
}
/* Wo die Nadel steht: bei regulären Aufträgen am Abholort des Auftraggebers,
   bei Mr. Snus und Don Pablo beim Kunden in der Siedlung – abgeholt wird
   dort ja nur das eigene Lager. */
const shady = o => !!(o && (o.snus || o.pablo));
function orderPinPt(o) { return addrPt(shady(o) ? oDrop(o) : oPick(o)); }
function jobPinPt(j) { return addrPt(jobPicked(j) ? oDrop(j.order) : oPick(j.order)); }
function mapPins() {
  const out = [];
  S.jobs.forEach(j => {
    const picked = jobPicked(j);
    out.push({ kind: "job", id: j.id, p: jobPinPt(j), col: "orange", icon: picked ? "🏁" : j.order.snus ? SNUS_PIN : CARGO[j.order.cargo].icon, prio: 2 });
    /* Noch nicht abgeholt: das Ziel steht schon als kleine Fahne da */
    if (!picked) out.push({ kind: "job", id: j.id, p: addrPt(oDrop(j.order)), col: "white", icon: "🏁", prio: -1, flag: true });
  });
  S.orders.forEach(o => {
    const grey = o.snus || o.pablo;
    const star = o.tut || o.tutNext || o.vip;   /* Linas Übung / Sonderfahrt: eigene Nadel, nie gebündelt */
    out.push({ kind: "order", id: o.id, p: orderPinPt(o), col: grey ? "gray" : "yellow",
      icon: o.vip ? "✉️" : star ? "⭐" : o.snus ? SNUS_PIN : o.pablo ? "❄️" : CARGO[o.cargo].icon, prio: star ? 3 : grey ? 0 : 1, solo: !!star });
  });
  return out;
}
function pinSize(z) { return z >= 11 ? 11.5 : z >= 8 ? 10 : z >= 5 ? 8.5 : 7; }
/* Tropfenform: Kopf oben, Spitze auf dem Punkt. Tinte, Schatten und ein
   heller Glanz wie bei den übrigen Kartenmarken. */
function drawPinShape(c, x, y, R, fill, icon, opts) {
  opts = opts || {};
  const h = R * 2.05, cx = x, cy = y - h;
  const ty = (R * R) / h, tx = Math.sqrt(R * R - ty * ty), a0 = Math.atan2(ty, tx);
  const path = (ox, oy) => {
    c.beginPath();
    c.moveTo(x + ox, y + oy);
    c.lineTo(cx + tx + ox, cy + ty + oy);
    c.arc(cx + ox, cy + oy, R, a0, Math.PI - a0, true);
    c.closePath();
  };
  c.beginPath(); c.ellipse(x + 1, y + 1, R * 0.62, R * 0.24, 0, 0, 7); c.fillStyle = "rgba(13,27,42,0.35)"; c.fill();
  path(2, 2.5); c.fillStyle = "rgba(13,27,42,0.38)"; c.fill();
  path(0, 0); c.fillStyle = fill; c.fill();
  c.lineWidth = 2.4; c.strokeStyle = "#0d1b2a"; c.lineJoin = "round"; c.stroke();
  c.beginPath(); c.arc(cx, cy, R * 0.66, 0, 7); c.fillStyle = "#fff8e8"; c.fill();
  c.lineWidth = 1.4; c.strokeStyle = "rgba(13,27,42,0.55)"; c.stroke();
  c.beginPath(); c.arc(cx - R * 0.08, cy - R * 0.1, R * 0.86, Math.PI * 1.08, Math.PI * 1.45);
  c.lineWidth = 2; c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineCap = "round"; c.stroke();
  if (opts.count) {
    c.font = "800 " + Math.round(R * 0.95) + "px " + LABEL_FONT;
    c.fillStyle = "#0d1b2a"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(opts.count > 99 ? "99+" : String(opts.count), cx, cy + 1);
  } else if (icon === SNUS_PIN) {
    const img = snusPinImg();
    if (img) c.drawImage(img, cx - R * 0.62, cy - R * 0.62, R * 1.24, R * 1.24);
  } else if (icon) {
    drawEmoji(c, icon, cx, cy, R * 0.98);
  }
  if (opts.sel) {
    c.beginPath(); c.arc(cx, cy, R + 5, 0, 7);
    c.lineWidth = 3; c.strokeStyle = "#e2465f"; c.setLineDash([6, 5]);
    c.lineDashOffset = -(performance.now() / 60) % 11; c.stroke(); c.setLineDash([]);
  }
  return [cx, cy];
}
function drawPins(m, z) {
  const R = pinSize(z);
  const list = mapPins().map(p => ({ ...p, s: m.screenPos(p.p[0], p.p[1]) }))
    .filter(p => p.s[0] > -40 && p.s[0] < m.width + 40 && p.s[1] > -40 && p.s[1] < m.height + 60);
  /* Nahe Nadeln bündeln – die wichtigste liegt oben */
  list.sort((a, b) => b.prio - a.prio);
  const groups = [];
  const near = R * 2.1;
  list.forEach(p => {
    const g = !p.solo && groups.find(q => !q.solo && Math.hypot(q.s[0] - p.s[0], q.s[1] - p.s[1]) < near);
    if (g) g.items.push(p); else groups.push({ s: p.s, items: [p], solo: !!p.solo });
  });
  pinHits = [];
  const ctx = m.ctx;
  /* Ausgewählte Ausschreibung: ihr Ziel als weiße Fahne */
  if (selected && selected.kind === "order") {
    const o = S.orders.find(x => x.id === selected.id);
    if (o) {
      /* Gegenstück zur Nadel: das Ziel – bei Schattenkunden das eigene Lager */
      const d = shady(o) ? oPick(o) : oDrop(o), s2 = m.screenPos(d.lat, d.lon);
      drawPinShape(ctx, s2[0], s2[1], R * 0.85, PIN_COL.white, shady(o) ? "📦" : "🏁");
    }
  }
  groups.slice().reverse().forEach(g => {
    /* Ziel-Fähnchen zählen im Bündel nicht mit */
    const real = g.items.filter(p => !p.flag);
    if (real.length) g.items = real;
    const top = g.items[0];
    const col = g.items.some(p => p.col === "orange") ? "orange" : top.col;
    const isSel = g.items.length === 1 && !top.flag && selected && selected.kind === top.kind && selected.id === top.id;
    const r = isSel ? R * 1.18 : top.flag ? R * 0.8 : R;
    const head = drawPinShape(ctx, g.s[0], g.s[1], r, PIN_COL[col], top.icon, { count: g.items.length > 1 ? g.items.length : 0, sel: isSel });
    pinHits.push({ x: head[0], y: head[1], r: r + 6, items: g.items, s: g.s });
  });
}
function rrect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
/* Eigene Büros: kleines Haus in der Firmenfarbe an ihrer Adresse */
function baseAddr(b) {
  if (!b.addr) b.addr = (typeof makeAddr === "function" && makeAddr(b.node, "office")) || nodeAddr(b.node);
  return b.addr;
}
let baseHits = [];
function drawBases(m, z) {
  baseHits = [];
  if (!S.bases || !S.bases.length || z < 5) return;
  const col = S.player ? COMPANY_COLORS[S.player.color] : "#2f6fed";
  S.bases.forEach(b => {
    const a = baseAddr(b);
    m.pin(a.lat, a.lon, (c, x, y) => {
      const w = z >= 11 ? 26 : 20, h = w * 0.78;
      rrect(c, x - w / 2 + 2, y - h / 2 + 2.5, w, h, 5); c.fillStyle = "rgba(13,27,42,0.4)"; c.fill();
      rrect(c, x - w / 2, y - h / 2, w, h, 5); c.fillStyle = "#fff8e8"; c.fill();
      c.lineWidth = 2.4; c.strokeStyle = "#0d1b2a"; c.stroke();
      c.beginPath(); c.moveTo(x - w / 2 - 3, y - h / 2 + 1); c.lineTo(x, y - h / 2 - w * 0.42); c.lineTo(x + w / 2 + 3, y - h / 2 + 1); c.closePath();
      c.fillStyle = col; c.fill(); c.stroke();
      drawEmoji(c, "🏢", x, y + 1, h * 0.74);
      baseHits.push({ x, y, r: w * 0.8, id: b.id });
    });
  });
}

/* Stehen mehrere Fahrzeuge am selben Ort, lagen sie bisher exakt
   übereinander – man sah nur eins. Jetzt rücken sie im Kreis auseinander,
   damit man auf einen Blick sieht, wer wo steht. Versatz in Bildpunkten. */
function vehFan() {
  const groups = new Map();
  S.fleet.forEach(v => {
    if ((v.phase === "repo" || v.phase === "haul") && v.route) return;
    const sp = vehSpot(v), k = sp.lat.toFixed(4) + "," + sp.lon.toFixed(4);
    const g = groups.get(k); if (g) g.push(v.uid); else groups.set(k, [v.uid]);
  });
  const off = {};
  groups.forEach(list => {
    if (list.length < 2) return;
    const R = list.length === 2 ? 14 : Math.min(26, 12 + list.length * 2);
    const turn = list.length === 2 ? 0 : -Math.PI / 2;
    list.forEach((uid, i) => {
      const a = turn + i * 2 * Math.PI / list.length;
      off[uid] = [Math.cos(a) * R, Math.sin(a) * R];
    });
  });
  return off;
}

/* Nach dem Antippen der Karte schickt der Browser noch einen „Klick“ an
   dieselbe Stelle hinterher. Liegt dort inzwischen ein Knopf der Infokarte,
   würde der sonst gleich mit ausgelöst (z. B. „In der Auftragsliste“). */
let mapTapAt = 0;
function onMapTap(px, py) {
  if (!playing()) return;
  mapTapAt = performance.now();
  let best = null, bestD = 26;
  const fan = vehFan();
  S.fleet.forEach(v => {
    const p = vehPoint(v);
    if (!p) return;
    const s = map.screenPos(p[0], p[1]);
    const fo = fan[v.uid] || [0, 0];
    const d = Math.hypot(s[0] + fo[0] - px, s[1] + fo[1] - py);
    if (d < bestD) { bestD = d; best = { kind: "veh", id: v.uid }; }
  });
  /* Nadelkopf zählt – etwas großzügiger, er ist das Ziel des Fingers */
  pinHits.forEach(h => {
    const d = Math.hypot(h.x - px, h.y - py) - 4;
    if (d < h.r && d < bestD) {
      bestD = d;
      best = h.items.length > 1 ? { kind: "cluster", items: h.items.map(i => ({ kind: i.kind, id: i.id })), at: map.fromScreen(h.s[0], h.s[1]) }
        : { kind: h.items[0].kind, id: h.items[0].id };
    }
  });
  if (!best && typeof eventAt === "function") {
    const ev = eventAt(px, py);
    if (ev) { toast(EVENT_DEF[ev.type].icon + " " + evTitle(ev) + " – bis " + clock(ev.until) + ".", "warn"); return; }
  }
  baseHits.forEach(h => {
    const d = Math.hypot(h.x - px, h.y - py);
    if (d < h.r && d < bestD) { bestD = d; best = { kind: "base", id: h.id }; }
  });
  if (!best) {
    unlockedNodes().forEach(n => {
      if (n.type === "city" && map.zoom >= CITY_DOT_MAX_Z) return;
      const s = map.screenPos(n.lat, n.lon);
      const d = Math.hypot(s[0] - px, s[1] - py);
      if (d < bestD) { bestD = d; best = { kind: "node", id: n.id }; }
    });
  }
  /* Bündel: hineinzoomen, bis die Nadeln einzeln stehen */
  if (best && best.kind === "cluster") {
    const pts = best.items.map(it => {
      const o = it.kind === "order" ? S.orders.find(x => x.id === it.id) : null;
      const j = it.kind === "job" ? S.jobs.find(x => x.id === it.id) : null;
      return o ? orderPinPt(o) : j ? jobPinPt(j) : null;
    }).filter(Boolean);
    /* Alle an derselben Adresse (z. B. mehrere Kunden am eigenen Lager) –
       Zoomen trennt sie nie, also eine kleine Auswahl zeigen. */
    let spread = 0;
    pts.forEach(a => pts.forEach(b => { spread = Math.max(spread, hav(a, b)); }));
    if (pts.length > 1 && (spread < 0.03 || map.zoom >= 17.5)) {
      selected = { kind: "cluster", items: best.items };
      renderInspector();
      mapRedraw();
      return;
    }
    if (pts.length > 1) map.fitBounds(pts, 90, Math.max(map.zoom + 1.5, 13));
    else map.flyTo(best.at, map.zoom + 2, 600);
    selected = null;
    renderInspector();
    return;
  }
  selected = best;
  renderInspector();
  mapRedraw();
}

function renderInspector() {
  const el = $("#inspector");
  if (!selected) { el.classList.remove("on"); el.innerHTML = ""; return; }
  if (selected.kind === "veh") {
    const v = S.fleet.find(f => f.uid === selected.id);
    if (!v) { selected = null; return renderInspector(); }
    const t = vType(v.type);
    const job = S.jobs.find(j => j.id === v.jobId);
    el.innerHTML = `<button class="xbtn" id="insClose">✕</button>
      <div class="ins-title">${t.icon} ${esc(t.name)}</div>
      <div class="ins-sub">${esc(t.brand)} · ${kgf(t.cap)} · ${t.speed} km/h · ${v.lease ? "Leasing" : "Eigentum"}</div>
      <div class="ins-row">${phaseLabel(v)}</div>
      ${job ? `<div class="ins-row">Auftrag: ${esc(job.order.shipper)} → ${esc(N[job.order.to].short)}</div>` : ""}
      <div class="ins-row small">Laufleistung ${kmf(v.kmTotal)} · ${v.jobs} Teilstrecken · ${money(dailyCost(v))}/Tag</div>
      <button class="btn tiny ${S.follow === v.uid ? "" : "ghost"}" id="insFollow">
        ${S.follow === v.uid ? "📡 Verfolgung beenden" : "📡 live verfolgen"}</button>`;
  } else if (selected.kind === "order") {
    const o = S.orders.find(x => x.id === selected.id);
    if (!o) { selected = null; return renderInspector(); }
    const cg = CARGO[o.cargo], pa = oPick(o), da = oDrop(o);
    const icon = o.snus && typeof snusLogo === "function" ? snusLogo(18) : o.pablo ? "❄️" : cg.icon;
    el.innerHTML = `<button class="xbtn" id="insClose">✕</button>
      <div class="ins-title">${icon} ${esc(o.shipper)} <span class="ins-pin ${o.snus || o.pablo ? "gray" : "yellow"}">offen</span></div>
      <div class="ins-sub">${esc(o.desc)}</div>
      <div class="ins-addr"><span>📍 ${esc(addrText(pa, true))}</span><span>🏁 ${esc(addrText(da, true))}</span></div>
      <div class="ins-row small">⚖️ ${kgf(o.weight)} · 💶 ${money(o.pay)} · ⏳ ${dur(o.deadline - S.time)}</div>
      ${previewHTML(dispatchPreview(o))}
      <div class="ins-btns">
        <button class="btn tiny" id="insPlan">📋 Planen &amp; annehmen</button>
        <button class="btn tiny ghost" id="insList">In der Auftragsliste</button>
        ${o.tut || o.tutNext ? "" : `<button class="btn tiny ghost danger" id="insReject">🗑️</button>`}
      </div>`;
  } else if (selected.kind === "job") {
    const j = S.jobs.find(x => x.id === selected.id);
    if (!j) { selected = null; return renderInspector(); }
    const o = j.order, cur = j.legs[j.curLeg];
    const veh = cur ? S.fleet.find(f => f.uid === cur.veh) : null;
    const picked = jobPicked(j);
    el.innerHTML = `<button class="xbtn" id="insClose">✕</button>
      <div class="ins-title">${o.snus && typeof snusLogo === "function" ? snusLogo(18) : CARGO[o.cargo].icon} ${esc(o.shipper)} <span class="ins-pin orange">in Arbeit</span></div>
      <div class="ins-addr"><span class="${picked ? "done" : ""}">📍 ${esc(addrText(oPick(o), true))}</span><span>🏁 ${esc(addrText(oDrop(o), true))}</span></div>
      <div class="ins-row">${veh ? vType(veh.type).icon + " " + esc(phaseLabel(veh)) : "wartet auf Vorlauf"}</div>
      <div class="ins-row small">⚖️ ${kgf(o.weight)} · 💶 ${money(o.pay)} · ⏳ ${S.time > o.deadline ? "überfällig" : dur(o.deadline - S.time)}</div>
      <div class="ins-btns">
        ${veh ? `<button class="btn tiny ${S.follow === veh.uid ? "" : "ghost"}" id="insFollowJob" data-uid="${veh.uid}">📡 live verfolgen</button>` : ""}
        <button class="btn tiny ghost" id="insJobs">Unter „Live“ zeigen</button>
      </div>`;
  } else if (selected.kind === "cluster") {
    const rows = selected.items.map(it => {
      const o = it.kind === "order" ? S.orders.find(x => x.id === it.id) : null;
      const j = it.kind === "job" ? S.jobs.find(x => x.id === it.id) : null;
      const oo = o || (j && j.order);
      if (!oo) return "";
      const icon = oo.snus && typeof snusLogo === "function" ? snusLogo(18) : oo.pablo ? "❄️" : CARGO[oo.cargo].icon;
      const tag = o ? `<span class="ins-pin ${shady(o) ? "gray" : "yellow"}">offen</span>` : `<span class="ins-pin orange">in Arbeit</span>`;
      return `<button class="ins-pick" data-k="${it.kind}" data-id="${esc(it.id)}">${icon} <b>${esc(oo.shipper)}</b> ${tag}<small>${money(oo.pay)}</small></button>`;
    }).filter(Boolean);
    if (!rows.length) { selected = null; return renderInspector(); }
    el.innerHTML = `<button class="xbtn" id="insClose">✕</button>
      <div class="ins-title">📍 ${rows.length} Aufträge an einer Adresse</div>
      <div class="ins-picks">${rows.join("")}</div>`;
    el.querySelectorAll(".ins-pick").forEach(b => b.onclick = () => {
      selected = { kind: b.dataset.k, id: b.dataset.id };
      renderInspector(); mapRedraw();
    });
  } else if (selected.kind === "base") {
    const b = (S.bases || []).find(x => x.id === selected.id);
    if (!b) { selected = null; return renderInspector(); }
    const t = OFFICE_TIERS[b.tier];
    el.innerHTML = `<button class="xbtn" id="insClose">✕</button>
      <div class="ins-title">🏢 ${esc(t ? t.name : "Büro")} ${esc(N[b.node].short)}</div>
      <div class="ins-addr"><span>📍 ${esc(addrText(baseAddr(b), true))}</span></div>
      <div class="ins-row small">👥 ${b.staff.length} im Team · 🚚 ${b.vehicles.length} Fahrzeug${b.vehicles.length === 1 ? "" : "e"}</div>
      <div class="ins-btns"><button class="btn tiny" id="insBase">Büro öffnen</button></div>`;
  } else {
    const n = N[selected.id];
    const here = S.fleet.filter(f => f.at === n.id && f.phase === "idle").length;
    const modes = n.modes.split("").map(m => MODE_INFO[m].icon + " " + MODE_INFO[m].name).join(" · ");
    const open = S.orders.filter(o => o.from === n.id).length;
    el.innerHTML = `<button class="xbtn" id="insClose">✕</button>
      <div class="ins-title">${TYPE_GLYPH[n.type] || "📍"} ${esc(n.name)}</div>
      <div class="ins-sub">${modes}</div>
      <div class="ins-row small">${here} Fahrzeug(e) bereit · ${open} offene Ausschreibung(en)</div>`;
  }
  el.classList.add("on");
  const c = $("#insClose");
  if (c) c.onclick = () => { selected = null; renderInspector(); mapRedraw(); };
  const f = $("#insFollow");
  if (f) f.onclick = () => { setFollow(S.follow === selected.id ? null : selected.id); renderInspector(); };
  const pl = $("#insPlan");
  if (pl) pl.onclick = () => { const id = selected.id; selected = null; renderInspector(); openPlanner(id); };
  const ir = $("#insReject");
  if (ir) ir.onclick = () => rejectOrder(selected.id);
  const li = $("#insList");
  if (li) li.onclick = () => { const id = selected.id; selected = null; renderInspector(); showInList("orders", id); };
  const fj = $("#insFollowJob");
  if (fj) fj.onclick = () => { setFollow(fj.dataset.uid); selected = null; renderInspector(); };
  const jb = $("#insJobs");
  if (jb) jb.onclick = () => { const id = selected.id; selected = null; renderInspector(); showInList("jobs", id); };
  const ib = $("#insBase");
  if (ib) ib.onclick = () => { const id = selected.id; selected = null; renderInspector(); showTab("bases"); if (typeof openOffice === "function") openOffice(id); };
}
/* Aus der Karte in die Liste: Reiter öffnen, Karte hinscrollen, kurz aufleuchten */
function showInList(tab, id) {
  showTab(tab);
  const sel = tab === "orders" ? `#tab-orders .card[data-order="${id}"]` : `#tab-jobs .card[data-job="${id}"]`;
  requestAnimationFrame(() => {
    const card = document.querySelector(sel);
    if (!card) return toast("Der Auftrag ist gerade nicht mehr da.", "warn");
    const box = $("#view .view-body");
    box.scrollTop += card.getBoundingClientRect().top - box.getBoundingClientRect().top - 60;
    card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
    flashId = id; flashUntil = performance.now() + 2600;
  });
}
let flashId = null, flashUntil = 0;
const flashOn = id => flashId === id && performance.now() < flashUntil;

/* --------------------------------- UI ----------------------------------- */
let lastToast = 0, hiddenToasts = 0;
/* ------------------------------- Kassenbuch -------------------------------
   Jede Buchung landet hier. Damit muss keine Meldung mehr über dem Menü
   stehen bleiben, nur damit man sie gelesen hat. */
const LEDGER_KIND = {
  job:   { icon: "📦", name: "Frachterlös" },
  drive: { icon: "⛽", name: "Fahrtkosten" },
  fail:  { icon: "❌", name: "Vertragsstrafe" },
  fleet: { icon: "🚚", name: "Fuhrpark" },
  base:  { icon: "🏢", name: "Standort" },
  rent:  { icon: "🗓️", name: "Miete" },
  staff: { icon: "👥", name: "Personal" },
  deco:  { icon: "🪴", name: "Einrichtung" },
  stage: { icon: "🌍", name: "Etappe" },
  snus:  { icon: "🎩", name: "Snus" },
  pablo: { icon: "❄️", name: "Don Pablo" },
  repair: { icon: "🔧", name: "Werkstatt" },
  loan:  { icon: "🏦", name: "Kredit" },
  tax:   { icon: "🧾", name: "Steuern" },
  insure: { icon: "🛡️", name: "Versicherung" },
  bonus: { icon: "🏆", name: "Prämie" }
};
function logMoney(kind, label, amount) {
  if (!S.ledger) S.ledger = [];
  if (!amount) return;
  S.ledger.unshift({ t: S.time, k: kind, l: label, a: Math.round(amount) });
  if (S.ledger.length > 260) S.ledger.length = 260;
}
const SHADOW_KINDS = new Set(["snus", "pablo"]);
function ledgerSums(fromTime, shadow) {
  let inc = 0, exp = 0;
  (S.ledger || []).forEach(e => {
    if (fromTime != null && e.t < fromTime) return;
    if (SHADOW_KINDS.has(e.k) !== !!shadow) return;
    if (e.a >= 0) inc += e.a; else exp -= e.a;
  });
  return { inc, exp, net: inc - exp };
}
function openLedger() {
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  renderLedger();
}
function renderLedger() {
  if (!$("#modal").classList.contains("open")) return;
  const day = Math.floor(S.time / 1440) * 1440;
  const today = ledgerSums(day), all = ledgerSums();
  /* Nebengeschäfte stehen nur im Schattenbuch auf dem Diensthandy */
  const rows = (S.ledger || []).filter(e => !SHADOW_KINDS.has(e.k));
  let html = "", lastDay = null;
  rows.forEach(e => {
    const d = dayOf(e.t);
    if (d !== lastDay) {
      lastDay = d;
      const ds = ledgerSums(Math.floor(e.t / 1440) * 1440);
      const dayRows = rows.filter(x => dayOf(x.t) === d);
      const di = dayRows.filter(x => x.a > 0).reduce((a, x) => a + x.a, 0);
      const de = -dayRows.filter(x => x.a < 0).reduce((a, x) => a + x.a, 0);
      html += `<div class="ldday"><span>Tag ${d}</span>
        <b class="${di - de >= 0 ? "good" : "bad"}">${di - de >= 0 ? "+" : "−"}${money(Math.abs(di - de))}</b></div>`;
    }
    const ki = LEDGER_KIND[e.k] || { icon: "•", name: "" };
    html += `<div class="ldrow">
      <span class="ldi">${ki.icon}</span>
      <span class="ldl">${esc(e.l)}<small>${clock(e.t)} · ${ki.name}</small></span>
      <b class="${e.a >= 0 ? "good" : "bad"}">${e.a >= 0 ? "+" : "−"}${money(Math.abs(e.a))}</b>
    </div>`;
  });
  if (!rows.length) html = `<div class="empty">Noch keine Buchungen.</div>`;

  $("#modalBody").innerHTML = `
    <div class="mhead">
      <div><div class="mtitle">💶 Kasse</div>
      <div class="msub">Kontostand ${money(S.money)}</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button>
    </div>
    <div class="kpis">
      <div><span>Heute ein</span><b class="good">${money(today.inc)}</b></div>
      <div><span>Heute aus</span><b class="bad">${money(today.exp)}</b></div>
      <div><span>Heute Saldo</span><b class="${today.net >= 0 ? "good" : "bad"}">${today.net >= 0 ? "+" : "−"}${money(Math.abs(today.net))}</b></div>
      <div><span>Gesamt Saldo</span><b class="${all.net >= 0 ? "good" : "bad"}">${all.net >= 0 ? "+" : "−"}${money(Math.abs(all.net))}</b></div>
    </div>
    <div class="ledger">${html}</div>
    <div class="mbtns"><button class="btn ghost" id="mCancel">Schließen</button></div>`;
  $("#mClose").onclick = closeModal;
  $("#mCancel").onclick = closeModal;
}

let muteToasts = false;          /* im Zeitraffer (Haft) keine Meldungsflut */
function toast(msg, kind, low) {
  if (muteToasts) return;
  const now = performance.now();
  /* Nebensächliche Meldungen nicht im Sekundentakt stapeln */
  if (low && now - lastToast < 2600) { hiddenToasts++; return; }
  lastToast = now;
  const box = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast " + (kind || "");
  const txt = hiddenToasts && low ? msg + "  (+" + hiddenToasts + ")" : msg;
  if (txt.includes("[[snus]]") && typeof snusLogo === "function") el.innerHTML = esc(txt).replace("[[snus]]", snusLogo(18));
  else el.textContent = txt;
  if (low) hiddenToasts = 0;
  box.appendChild(el);
  while (box.children.length > 2) box.removeChild(box.firstChild);
  setTimeout(() => el.classList.add("out"), 3000);
  setTimeout(() => el.remove(), 3600);
}

function phaseLabel(v) {
  if (typeof haltLabel === "function") { const h = haltLabel(v); if (h) return h; }
  const job = S.jobs.find(j => j.id === v.jobId);
  const leg = job ? job.legs[v.legIdx] : null;
  switch (v.phase) {
    case "idle": return "bereit · " + vehSpot(v).t + ", " + N[v.at].short;
    case "reserved": return "disponiert, wartet auf Vorlauf";
    case "repo": return leg && leg.from === v.at ? "fährt zur Abholung" : "Leerfahrt nach " + (leg ? N[leg.from].short : "?");
    case "load": return "wird beladen";
    case "haul": return "unterwegs nach " + (leg ? N[leg.to].short : "?");
    case "unload": return "wird entladen";
    default: return v.phase;
  }
}

let hudAvatarKey = "";
function renderHud() {
  if (S.player) {
    const av = S.player.avatar;
    const key = (av.photo ? "p" + av.photo.length + av.photo.slice(-32) : "")
      + JSON.stringify(Object.assign({}, av, { photo: null })) + S.player.color;
    if (key !== hudAvatarKey) {
      hudAvatarKey = key;
      $("#hudAvatar").innerHTML = portraitHTML(S.player.avatar, 42, { uid: "hud", bg: false });
      $("#hudAvatar").style.background = COMPANY_COLORS[S.player.color] + "33";
    }
    $("#hudCompany").textContent = S.player.company;
    $("#hudName").textContent = S.player.name + " · " + ORIGINS[S.player.origin].name;
  }
  const m = $("#hudMoney");
  m.textContent = money(S.money);
  m.classList.toggle("bad", S.money < 0);
  $("#hudLevel").textContent = "Lv " + level();
  $("#hudStage").textContent = "Etappe " + S.stage + " · " + STAGES[S.stage - 1].name;
  $("#hudTime").textContent = stamp(S.time);
  const l = level(), a = xpForLevel(l), b = xpForLevel(l + 1);
  $("#xpFill").style.width = clamp(((S.xp - a) / (b - a)) * 100, 0, 100) + "%";
  const badge = (id, n) => {
    const el = $(id); if (!el) return;
    el.textContent = n > 99 ? "99+" : n;
    el.classList.toggle("zero", !n);
  };
  badge("#badgeOrders", S.orders.length);
  badge("#badgeJobs", S.jobs.length);
  badge("#badgeFleet", S.fleet.length);
  badge("#badgeBases", (S.bases || []).length);
  renderPhoneBadge();
  if (typeof renderGoalsChip === "function") renderGoalsChip();
}

/* ---------------------- Leerfahrt-Vorschau je Auftrag ---------------------
   Was würde passieren, wenn man den Auftrag jetzt annimmt: welches Fahrzeug
   übernimmt, muss es erst leer anfahren, und was kostet das? Gerechnet wird
   wie im Planer (Verkehrsträger, Reichweite, Kapazität), nur ohne Dialog.
   Zwischengespeichert, solange sich an der freien Flotte nichts ändert.  */
let previewSig = "";
const previewCache = new Map();
function dispatchPreview(o) {
  const sig = S.stage + "|" + S.fleet.map(f => f.uid + ":" + f.phase + "@" + f.at + (f.spot ? "~" + f.spot.lat + "," + f.spot.lon : "")).join(",");
  if (sig !== previewSig) { previewSig = sig; previewCache.clear(); }
  const hit = previewCache.get(o.id);
  if (hit) return hit;
  const variants = buildVariants(o);
  const best = bestOption(planOptions(o, variants));
  const r = best
    ? { ok: true, veh: S.fleet.find(f => f.uid === best.assign[0]), repoKm: best.repoKm, repoEur: best.repoEur, profit: best.profit }
    : { ok: false, why: missingReason(o, variants) };
  previewCache.set(o.id, r);
  return r;
}
function missingReason(o, variants) {
  if (!variants.length) return "keine Route mit deinen Verkehrsträgern";
  const idle = S.fleet.filter(f => f.phase === "idle");
  if (!idle.length) return S.fleet.length ? "alle Fahrzeuge sind unterwegs" : "noch kein Fahrzeug";
  const have = new Set(idle.map(f => vType(f.type).mode));
  let miss = null;
  variants.forEach(v => {
    const m = [...new Set(v.legs.map(l => l.mode))].filter(x => !have.has(x));
    if (!miss || m.length < miss.length) miss = m;
  });
  if (miss && miss.length) {
    const mi = MODE_INFO[miss[0]];
    const busy = S.fleet.some(f => vType(f.type).mode === miss[0]);
    return mi.icon + " " + mi.name + " nötig – " + (busy ? "deins ist gerade unterwegs" : "dafür fehlt dir ein Fahrzeug");
  }
  if (!idle.some(f => vType(f.type).cap >= o.weight)) return "zu schwer für deine freien Fahrzeuge";
  const cg = CARGO[o.cargo];
  if (cg.req.length && !idle.some(f => meetsReq(vType(f.type), o.cargo))) return "braucht " + cg.req.map(flagName).join(" + ");
  return "Reichweite oder Kapazität reicht nicht";
}
function previewHTML(p) {
  if (!p.ok) return `<div class="vhintrow"><span class="vhint none">🚫 ${esc(p.why)}</span></div>`;
  const t = vType(p.veh.type);
  if (p.repoKm < 0.5) return `<div class="vhintrow"><span class="vhint ontime">✅ ${t.icon} ${esc(t.brand)} steht am Abholort · keine Leerfahrt</span></div>`;
  return `<div class="vhintrow"><span class="vhint">↩️ ${t.icon} ${esc(t.brand)} aus ${esc(N[p.veh.at].short)} · ${kmf(p.repoKm)} Leerfahrt · −${money(p.repoEur)}</span></div>`;
}

function followRelevant(o) {
  const f = S.fleet.find(x => x.uid === o.tutVeh);
  if (!f) return false;
  if (f.phase === "idle") return f.at === o.from;
  const j = S.jobs.find(x => x.id === f.jobId) || S.jobs.find(x => x.legs.some(l => l.veh === f.uid && !l.done));
  return !!j && j.legs[j.legs.length - 1].to === o.from;
}
function rejectBtnHTML(id) {
  return `<button class="rejectbtn" data-reject="${id}" aria-label="Ausschreibung ablehnen" title="Ablehnen">✕</button>`;
}
/* ------------------------ Werkzeugleiste über der Liste ------------------------
   Sitzt fest zwischen Titel und Liste, scrollt also nicht mit weg. Neu gebaut
   wird sie nur, wenn sich etwas ändert – sonst springt die Chipreihe zurück. */
function setTools(tab, html, bind) {
  const vt = $("#viewTools");
  if (!vt) return;
  if (!html) { if (vt._k) { vt.innerHTML = ""; vt._k = ""; vt._tab = ""; } vt.classList.remove("on"); return; }
  vt.classList.add("on");
  if (vt._k === html) return;
  const keep = vt._tab === tab ? [...vt.querySelectorAll(".chiprow")].map(r => r.scrollLeft) : [];
  vt.innerHTML = html; vt._k = html; vt._tab = tab;
  vt.querySelectorAll(".chiprow").forEach((r, i) => { if (keep[i]) r.scrollLeft = keep[i]; });
  bind(vt);
}
const chipHTML = (attr, key, label, n, on, extra) =>
  `<button class="fchip${on ? " on" : ""}${n === 0 && !on ? " zero" : ""}${extra ? " " + extra : ""}" ${attr}="${key}">${label}${n != null ? ` <b>${n}</b>` : ""}</button>`;

const ORDER_SORTS = [["pay", "💶", "Erlös"], ["near", "📍", "Leerfahrt"], ["due", "⏳", "Frist"]];
const ORDER_CHIP = { pak: "Pakete", express: "Express", pal: "Paletten", kuehl: "Kühlware", schuett: "Schüttgut",
  adr: "Gefahrgut", sperrig: "Schwerlast", cont: "Container", schmuck: "Schmuck", snus: "Snus", ware: "Don Pablo" };
function orderMatches(o, p, f) {
  if (f === "all") return true;
  if (f === "ok") return p.ok;
  if (f === "air") return !!o.air;
  return o.cargo === f;
}
function orderToolsHTML(rows, mode, filt) {
  const seg = `<div class="seg" aria-label="Sortieren">${ORDER_SORTS.map(([k, i, l]) =>
    `<button data-sort="${k}" class="${k === mode ? "on" : ""}"><i>${i}</i>${l}</button>`).join("")}</div>`;
  const n = {};
  rows.forEach(({ o }) => { n[o.cargo] = (n[o.cargo] || 0) + 1; if (o.air) n.air = (n.air || 0) + 1; });
  const kinds = Object.keys(CARGO).filter(k => n[k] || k === filt);
  const icon = k => k === "snus" && typeof snusLogo === "function" ? snusLogo(14) : CARGO[k].icon;
  const chips = [chipHTML("data-of", "all", "Alle", rows.length, filt === "all"),
    chipHTML("data-of", "ok", "✅ jetzt machbar", rows.filter(r => r.p.ok).length, filt === "ok")];
  if (n.air || filt === "air") chips.push(chipHTML("data-of", "air", "✈️ Luftfracht", n.air || 0, filt === "air"));
  kinds.forEach(k => chips.push(chipHTML("data-of", k, icon(k) + " " + (ORDER_CHIP[k] || CARGO[k].name), n[k] || 0, filt === k)));
  return seg + `<div class="chiprow">${chips.join("")}</div>`;
}
function renderOrders() {
  const el = $("#tab-orders");
  if (!S.orders.length) {
    setTools("orders", "");
    el.innerHTML = `<div class="empty">Gerade keine Ausschreibungen. In ein paar Stunden kommen neue herein.</div>`; return;
  }
  const mode = S.orderSort || "pay";
  const filt = S.orderFilter || "all";
  const rows = S.orders.map(o => ({ o, p: dispatchPreview(o) }));
  const by = {
    pay: (a, b) => b.o.pay - a.o.pay,
    /* Fahrbare zuerst, darunter nach Leerfahrt, bei Gleichstand der Gewinn */
    near: (a, b) => (a.p.ok ? 0 : 1) - (b.p.ok ? 0 : 1)
      || (a.p.ok ? (a.p.repoKm - b.p.repoKm) || (b.p.profit - a.p.profit) : b.o.pay - a.o.pay),
    due: (a, b) => a.o.deadline - b.o.deadline
  }[mode] || ((a, b) => b.o.pay - a.o.pay);
  /* Der Anschlussauftrag bleibt nur oben, solange das Übungsfahrzeug
     dorthin unterwegs ist oder dort steht – danach ist er ein ganz normaler. */
  S.orders.forEach(o => { if (o.tutNext && !followRelevant(o)) { delete o.tutNext; delete o.tutVeh; } });
  const pin = o => o.tut ? 3 : o.tutNext ? 2 : o.vip ? 1 : 0;
  rows.sort((a, b) => pin(b.o) - pin(a.o) || by(a, b));
  setTools("orders", orderToolsHTML(rows, mode, filt), vt => {
    vt.querySelectorAll("[data-sort]").forEach(b => b.onclick = () => {
      S.orderSort = b.dataset.sort; save(); renderOrders();
      $("#view .view-body") && ($("#view .view-body").scrollTop = 0);
    });
    vt.querySelectorAll("[data-of]").forEach(b => b.onclick = () => {
      S.orderFilter = b.dataset.of === S.orderFilter ? "all" : b.dataset.of; save(); renderOrders();
      $("#view .view-body") && ($("#view .view-body").scrollTop = 0);
    });
  });
  /* Linas Übungsaufträge bleiben immer sichtbar, egal welcher Filter */
  const shown = rows.filter(r => pin(r.o) || orderMatches(r.o, r.p, filt));
  const stock = (typeof snusStockHTML === "function" ? snusStockHTML() : "")
    + (typeof pabloStockHTML === "function" ? pabloStockHTML() : "");
  const none = shown.length ? "" : `<div class="empty">Keine Ausschreibung passt zu diesem Filter.
    <button class="btn tiny ghost" id="ofReset">Alle zeigen</button></div>`;
  el.innerHTML = stock + none + shown.map(({ o, p }) => {
    if (o.snus && typeof snusOrderCard === "function") return snusOrderCard(o, previewHTML(p));
    if (o.pablo && typeof pabloOrderCard === "function") return pabloOrderCard(o, previewHTML(p));
    if (o.vip && typeof vipCardHTML === "function") return vipCardHTML(o, previewHTML(p));
    const cg = CARGO[o.cargo];
    const rest = o.deadline - S.time;
    const tight = rest < o.refTime * 1.25;
    return `<div class="card order${o.tut ? " tut" : ""}${o.tutNext ? " tutnext" : ""}${flashOn(o.id) ? " flash" : ""}" data-order="${o.id}">
      ${o.tut ? `<div class="tutribbon">⭐ Linas Übungsauftrag</div>` : ""}
      ${o.tutNext ? `<div class="tutribbon">⭐ Anschlussauftrag ab ${esc(N[o.from].short)}</div>` : ""}
      <div class="card-top">
        <span class="badge" style="--c:${tight ? "#ff5c78" : o.jewel ? "#b9a6ff" : "#ffc12e"}">${cg.icon} ${cg.name}</span>
        ${o.air ? `<span class="badge air">✈️ Luftfracht</span>` : ""}
        <span class="pay">${money(o.pay)}</span>
        ${o.tut || o.tutNext ? "" : rejectBtnHTML(o.id)}
      </div>
      <div class="ship">${esc(o.shipper)}</div>
      <div class="desc">${esc(o.desc)}</div>
      ${typeof orderExtraHTML === "function" ? orderExtraHTML(o) : ""}
      <div class="meta addr"><span>📍 ${esc(oPick(o).t)} <small>${esc(N[o.from].short)}</small></span><span>🏁 ${esc(oDrop(o).t)} <small>${esc(oDrop(o).a || N[o.to].short)}</small></span></div>
      <div class="meta small">
        ${o.jewel ? `<span class="jewelonly">🚲🛵 nur Rad &amp; Moped</span>` : ""}<span>⚖️ ${kgf(o.weight)}</span><span>📏 ${kmf(o.refDist)}</span>
        <span>⏳ ${dur(rest)}</span><span>⚡ ab ${dur(o.refTime)}</span>
      </div>
      ${previewHTML(p)}
    </div>`;
  }).join("");
  $$("#tab-orders .order").forEach(c => c.onclick = () => openPlanner(c.dataset.order));
  $$("#tab-orders [data-reject]").forEach(b => b.onclick = (e) => { e.stopPropagation(); rejectOrder(b.dataset.reject); });
  const rs = $("#ofReset");
  if (rs) rs.onclick = () => { S.orderFilter = "all"; save(); renderOrders(); };
}

function renderJobs() {
  const el = $("#tab-jobs");
  if (!S.jobs.length) { el.innerHTML = `<div class="empty">Kein laufender Auftrag. Nimm unter <b>Aufträge</b> eine Ausschreibung an.</div>`; return; }
  el.innerHTML = S.jobs.map(j => {
    const o = j.order, cg = CARGO[o.cargo];
    const doneDist = j.legs.filter(l => l.done).reduce((a, l) => a + l.dist, 0);
    const cur = j.legs[j.curLeg];
    const veh = cur ? S.fleet.find(f => f.uid === cur.veh) : null;
    const curProg = veh && veh.phase === "haul" && veh.routeDist ? veh.pos : 0;
    const total = j.legs.reduce((a, l) => a + l.dist, 0);
    const prog = clamp(((doneDist + curProg) / total) * 100, 0, 100);
    const late = S.time > o.deadline;
    return `<div class="card job${flashOn(j.id) ? " flash" : ""}${o.vip ? " vipjob" : ""}" data-job="${j.id}">
      ${o.vip ? `<div class="vip-ribbon">✉️ Sonderfahrt · ${esc(o.shipper)}</div>` : ""}
      <div class="card-top">
        <span class="badge" style="--c:${late ? "#ff5c78" : "#7cd6a0"}">${cg.icon} ${cg.name}</span>
        <span class="pay">${money(o.pay)}</span>
      </div>
      <div class="ship">${esc(o.shipper)}</div>
      <div class="meta small"><span>${esc(oPick(o).t)} → ${esc(oDrop(o).t)}</span>
        <span>⚖️ ${kgf(o.weight)}</span><span>⏳ ${late ? "überfällig" : dur(o.deadline - S.time)}</span></div>
      <div class="chain">${j.legs.map((l, i) => {
        const mi = MODE_INFO[l.mode];
        const st = l.done ? "done" : (i === j.curLeg ? "now" : "wait");
        return `<span class="chip-leg ${st}" style="--c:${mi.color}">${mi.icon}</span>`;
      }).join('<i class="arrow">›</i>')}</div>
      <div class="bar"><i style="width:${prog}%"></i></div>
      <div class="meta small"><span>${veh ? esc(phaseLabel(veh)) : "wartet"}</span><span>${Math.round(prog)} %</span></div>
      <div class="buyrow">
        ${typeof packable === "function" && packable(j) ? `<button class="btn tiny packbtn" data-pack="${j.id}">📦 Selbst beladen · +8 %</button>` : ""}
        <button class="btn tiny ghost" data-zoom="${j.id}">🗺️ Route zeigen</button>
        <button class="btn tiny ghost danger" data-canceljob="${j.id}">${o.snus || o.pablo ? "✋ Übergabe abbrechen" : "✕ Stornieren"}</button>
        ${veh ? `<button class="btn tiny ${S.follow === veh.uid ? "" : "ghost"}" data-follow="${veh.uid}">
          ${S.follow === veh.uid ? "📡 verfolgt" : "📡 live verfolgen"}</button>` : ""}
      </div>
    </div>`;
  }).join("");
  $$("#tab-jobs [data-zoom]").forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    const j = S.jobs.find(x => x.id === b.dataset.zoom);
    if (!j) return;
    setFollow(null);
    const pts = [];
    j.legs.forEach(l => legCoords(l).forEach(p => pts.push(p)));
    map.fitBounds(pts, 80, 14);
    closeSheet();
  });
  $$("#tab-jobs [data-canceljob]").forEach(b => b.onclick = (e) => { e.stopPropagation(); cancelJob(b.dataset.canceljob); });
  $$("#tab-jobs [data-pack]").forEach(b => b.onclick = (e) => { e.stopPropagation(); openPack(b.dataset.pack); });
  $$("#tab-jobs [data-follow]").forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    setFollow(S.follow === b.dataset.follow ? null : b.dataset.follow);
    closeSheet();
  });
}

function renderFleet() {
  const el = $("#tab-fleet");
  const idleFleet = S.fleet.filter(f => f.phase === "idle");
  const idle = idleFleet.length;
  const fix = S.fleet.reduce((a, f) => a + dailyCost(f), 0);
  /* Standort-Überblick: wo die einsatzbereiten Fahrzeuge gerade stehen,
     damit man vor dem Disponieren schon sieht, wo die Flotte sich ballt. */
  const byNode = new Map();
  idleFleet.forEach(f => byNode.set(f.at, (byNode.get(f.at) || 0) + 1));
  const locChips = [...byNode.entries()].sort((a, b) => b[1] - a[1])
    .map(([id, n]) => `<span class="locchip">📍 ${esc(N[id].short)} <b>${n}</b></span>`).join("");
  const head = `<div class="card auto">
      <div class="card-top"><div class="vname">🗂️ Disposition<small>Von allein fahren nur Fahrzeuge, die einem Büro mit jemandem aus der
        Disposition gehören. Alle anderen teilst du selbst ein.</small></div></div>
      ${dispoRowsHTML()}
      ${typeof fleetExtraHTML === "function" ? fleetExtraHTML() : ""}
      ${S.fleet.length ? `<div class="meta small"><span>💤 ${idle} von ${S.fleet.length} im Leerlauf</span><span>🅿️ ${money(fix)}/Tag Fixkosten</span></div>` : ""}
      ${S.fleet.length ? `<div class="locrow"><span class="loclbl">Frei stehen:</span>${locChips || `<span class="locchip none">gerade keins – alle unterwegs</span>`}</div>` : ""}
      ${S.fleet.length > 3 && idle > S.fleet.length * 0.6
        ? `<div class="warnbox">Mehr als die Hälfte der Flotte steht still und kostet trotzdem. Weniger Fahrzeuge oder größere Etappen wären günstiger.</div>` : ""}
      </div>`;
  if (!S.fleet.length) {
    el.innerHTML = head + `<div class="empty">Noch kein Fahrzeug. Hol dir im <b>Markt</b> ein Lastenrad oder einen Kastenwagen.</div>`;
    bindDispo(); return;
  }
  const order = { b: 0, r: 1, i: 2, l: 3, s: 4, a: 5 };
  const fleet = [...S.fleet].sort((a, b) => order[vType(a.type).mode] - order[vType(b.type).mode]);
  el.innerHTML = head + fleet.map(v => {
    const t = vType(v.type);
    const prog = v.routeDist ? clamp((v.pos / v.routeDist) * 100, 0, 100) : 0;
    return `<div class="card veh-card">
      <div class="card-top"><span class="vicon">${t.icon}</span>
        <div class="vname">${esc(t.name)}<small>${esc(t.brand)} · ${kgf(t.cap)} · ${t.speed} km/h</small></div>
        <span class="tag ${v.lease ? "lease" : "own"}">${v.lease ? "Leasing" : "Eigentum"}</span>
      </div>
      <div class="status ${v.phase}">${esc(phaseLabel(v))}</div>
      ${v.phase === "repo" || v.phase === "haul" ? `<div class="bar"><i style="width:${prog}%"></i></div>` : ""}
      ${t.flags.length ? `<div class="flags">${t.flags.map(f => `<i>${flagName(f)}</i>`).join("")}</div>` : ""}
      <div class="meta small"><span>⛽ ${fmt(t.costKm, 2)} €/km</span><span>🅿️ ${money(dailyCost(v))}/Tag</span><span>🛣️ ${kmf(v.kmTotal)}</span></div>
      ${typeof vehExtraHTML === "function" ? vehExtraHTML(v) : ""}
      ${vehDispoHTML(v)}
      <div class="buyrow">
        ${v.phase !== "idle" ? `<button class="btn tiny ${S.follow === v.uid ? "" : "ghost"}" data-follow="${v.uid}">
          ${S.follow === v.uid ? "📡 verfolgt" : "📡 live verfolgen"}</button>` : ""}
        ${v.phase === "idle" ? `<button class="btn tiny ghost" data-release="${v.uid}">${v.lease ? "Leasing beenden" : "verkaufen · " + money(Math.round(t.price * 0.62 * (typeof wearValueFactor === "function" ? wearValueFactor(v) : 1)))}</button>` : ""}
      </div>
    </div>`;
  }).join("");
  $$("#tab-fleet [data-release]").forEach(b => b.onclick = () => release(b.dataset.release));
  $$("#tab-fleet [data-follow]").forEach(b => b.onclick = () => {
    setFollow(S.follow === b.dataset.follow ? null : b.dataset.follow);
    closeSheet();
  });
  bindDispo();
}
/* Überblick: welches Büro disponiert wie viele Fahrzeuge, was bleibt beim Chef */
function dispoRowsHTML() {
  const bases = typeof basesOf === "function" ? basesOf() : [];
  const own = S.fleet.filter(f => !baseOfVehicle(f.uid)).length;
  const rows = bases.map(b => {
    const n = b.vehicles.length, cap = dispCap(b);
    const st = rolePower(b, "disp") <= 0 ? ["none", "ohne Disponent"] : b.dispOff ? ["off", "pausiert"]
      : basePaused(b) ? ["off", "steht still"] : ["on", "disponiert"];
    return `<button class="drow" data-gobase="${b.id}">
      <span class="dn">${tierOf(b).icon} <b>${esc(N[b.node].short)}</b></span>
      <span class="dv">🚚 ${n}${cap ? ` <small>/ ${cap} betreubar</small>` : ""}</span>
      <span class="dst ${st[0]}">${st[1]}</span></button>`;
  }).join("");
  return `<div class="drows">${rows}
      <div class="drow self"><span class="dn">✋ <b>Selbst</b></span><span class="dv">🚚 ${own}</span><span class="dst self">du teilst ein</span></div>
    </div>
    ${bases.length ? "" : `<button class="btn tiny" id="goBases">🏢 Büro eröffnen – dann fährt die Flotte von allein</button>`}`;
}
/* Pro Fahrzeug: wer es disponiert – direkt hier umhängen */
function vehDispoHTML(v) {
  const bases = S.bases || [];
  if (!bases.length) return "";
  const cur = baseOfVehicle(v.uid);
  return `<label class="vdispo">🗂️ Disposition
    <select data-vbase="${v.uid}">
      <option value=""${cur ? "" : " selected"}>✋ selbst einteilen</option>
      ${bases.map(b => {
        const full = b.vehicles.length >= tierOf(b).slots && b !== cur;
        return `<option value="${b.id}"${b === cur ? " selected" : ""}${full ? " disabled" : ""}>${tierOf(b).icon} Büro ${esc(N[b.node].short)}${full ? " · Hof voll" : ""}${rolePower(b, "disp") <= 0 ? " · ohne Disponent" : ""}</option>`;
      }).join("")}
    </select></label>`;
}
function bindDispo() {
  if (typeof bindFleetExtras === "function") bindFleetExtras();
  const gb = $("#goBases");
  if (gb) gb.onclick = () => showTab("bases");
  $$("#tab-fleet [data-gobase]").forEach(b => b.onclick = () => showTab("bases"));
  $$("#tab-fleet [data-vbase]").forEach(sel => sel.onchange = () => {
    sel.blur();
    if (sel.value) assignVehicle(sel.value, sel.dataset.vbase);
    else unassignVehicle(sel.dataset.vbase);
  });
}
function flagName(f) {
  return { kuehl: "Kühlung", adr: "Gefahrgut", sperrig: "Schwerlast", container: "Container", schuett: "Schüttgut", kurier: "Wertkurier" }[f] || f;
}

/* ------------------------------ Markt-Filter ------------------------------ */
const MKT_CATS = [["all", "Alle"], ["rad", "🚲 Rad"], ["moped", "🛵 Moped"], ["van", "🚐 Transporter"], ["lkw", "🚛 Lkw"],
  ["i", "🛥️ Binnenschiff"], ["l", "🚆 Schiene"], ["s", "🚢 Seeschiff"], ["a", "✈️ Flugzeug"]];
const MKT_SORTS = [["std", "Nach Art"], ["price", "Preis ↑"], ["priceD", "Preis ↓"], ["cap", "Nutzlast"],
  ["km", "€ je km"], ["day", "€ je Tag"], ["speed", "Tempo"], ["range", "Reichweite"]];
const MKT_FLAGS = [["kurier", "💎 Wertkurier"], ["kuehl", "🧊 Kühlung"], ["adr", "☣️ Gefahrgut"], ["sperrig", "🏗️ Schwerlast"],
  ["container", "📮 Container"], ["schuett", "⛏️ Schüttgut"]];
function vehCat(t) {
  if (t.mode === "b") return "rad";
  if (t.mode === "r") return t.icon === "🛵" ? "moped" : t.icon === "🚛" ? "lkw" : "van";
  return t.mode;
}
function mktState() {
  if (!S.mkt) S.mkt = { cat: "all", sort: "std", avail: false, afford: false, flags: [] };
  return S.mkt;
}
function vehLocked(t) { return t.stage > S.stage || !unlockedModes().includes(t.mode); }
/* Alles außer der Kategorie – damit die Zahlen an den Kategorien stimmen */
function mktPass(t, f) {
  if (f.avail && vehLocked(t)) return false;
  if (f.afford && t.price > S.money) return false;
  return f.flags.every(fl => t.flags.includes(fl));
}
function mktActive(f) { return f.cat !== "all" || f.avail || f.afford || f.flags.length > 0; }
function marketToolsHTML(f) {
  const base = VEHICLES.filter(t => mktPass(t, f));
  const cats = MKT_CATS.map(([k, l]) => chipHTML("data-mcat", k, l,
    k === "all" ? base.length : base.filter(t => vehCat(t) === k).length, f.cat === k)).join("");
  const sel = `<label class="fchip sel" title="Sortieren">↕<select id="mktSort" aria-label="Sortieren">${MKT_SORTS.map(([k, l]) =>
    `<option value="${k}"${f.sort === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const tg = (k, l, on) => `<button class="fchip tg${on ? " on" : ""}" data-mtg="${k}">${l}</button>`;
  const opts = [sel, `<span class="chipdiv"></span>`, tg("avail", "🔓 freigeschaltet", f.avail), tg("afford", "💶 bezahlbar", f.afford),
    `<span class="chipdiv"></span>`, ...MKT_FLAGS.map(([k, l]) => tg("flag:" + k, l, f.flags.includes(k)))];
  if (mktActive(f)) opts.push(`<button class="fchip reset" data-mreset="1">✕ zurücksetzen</button>`);
  return `<div class="chiprow first">${cats}</div><div class="chiprow">${opts.join("")}</div>`;
}
function bindMarketTools(vt) {
  const f = mktState();
  const again = () => { save(); renderMarket(); $("#view .view-body") && ($("#view .view-body").scrollTop = 0); };
  vt.querySelectorAll("[data-mcat]").forEach(b => b.onclick = () => { f.cat = b.dataset.mcat === f.cat ? "all" : b.dataset.mcat; again(); });
  vt.querySelectorAll("[data-mtg]").forEach(b => b.onclick = () => {
    const k = b.dataset.mtg;
    if (k.startsWith("flag:")) {
      const fl = k.slice(5);
      f.flags = f.flags.includes(fl) ? f.flags.filter(x => x !== fl) : [...f.flags, fl];
    } else f[k] = !f[k];
    again();
  });
  const so = vt.querySelector("#mktSort");
  if (so) so.onchange = () => { so.blur(); f.sort = so.value; again(); };
  const rs = vt.querySelector("[data-mreset]");
  if (rs) rs.onclick = () => { Object.assign(f, { cat: "all", avail: false, afford: false, flags: [] }); again(); };
}
const MKT_SORT_FN = {
  price: (a, b) => a.price - b.price, priceD: (a, b) => b.price - a.price, cap: (a, b) => b.cap - a.cap,
  km: (a, b) => a.costKm - b.costKm, day: (a, b) => a.daily - b.daily, speed: (a, b) => b.speed - a.speed,
  range: (a, b) => b.range - a.range
};

function renderMarket() {
  const groups = ["b", "r", "i", "l", "s", "a"];
  const mf = marketFocus && S.orders.some(o => o.id === marketFocus.orderId) ? marketFocus : null;
  if (!mf) marketFocus = null;
  let html = "";
  const f = mktState();
  if (mf) setTools("market", "");
  else setTools("market", marketToolsHTML(f), bindMarketTools);
  const shopCard = t => {
    const m = t.mode, avail = unlockedModes().includes(m);
    const locked = t.stage > S.stage || !avail;
    const lease = t.daily + t.price * LEASE_RATE;
    return `<div class="card shop${locked ? " locked" : ""}${mf ? " match" : ""}">
        <div class="card-top"><span class="vicon">${t.icon}</span>
          <div class="vname">${esc(t.name)}<small>${esc(t.brand)}</small></div>
          <span class="price">${money(t.price)}</span></div>
        <div class="meta small">
          <span>⚖️ ${kgf(t.cap)}</span><span>🏎️ ${t.speed} km/h</span>
          <span>⛽ ${fmt(t.costKm, 2)} €/km</span><span>🅿️ ${money(t.daily)}/Tag</span><span>📏 ${kmf(t.range)}</span>
        </div>
        ${t.flags.length ? `<div class="flags">${t.flags.map(f => `<i>${flagName(f)}</i>`).join("")}</div>` : ""}
        ${locked
          ? `<div class="lockrow">🔒 ab Etappe ${Math.max(t.stage, firstStageWith(m))}</div>`
          : `<div class="buyrow">
               <button class="btn tiny${S.money >= t.price ? "" : " disabled"}" data-buy="${t.id}">kaufen</button>
               <button class="btn tiny ghost" data-lease="${t.id}">leasen · ${money(lease)}/Tag</button>
             </div>`}
      </div>`;
  };
  if (mf) html += `<div class="card shopfocus">
      <div class="vname">🎯 Passend für „${esc(mf.title)}“<small>${esc(mf.label)} · Überführung zu ${esc(mf.from)} inklusive</small></div>
      <div class="buyrow">
        <button class="btn tiny" id="mfBack">↩ zurück zum Auftrag</button>
        <button class="btn tiny ghost" id="mfAll">alle Fahrzeuge zeigen</button>
      </div></div>`;
  /* Im Fokus zählt nur, was die Strecke schafft; sonst greifen die Filter */
  const pass = t => mf ? mf.ids.includes(t.id) : mktPass(t, f) && (f.cat === "all" || vehCat(t) === f.cat);
  const sortFn = !mf && MKT_SORT_FN[f.sort];
  if (sortFn) {
    const list = VEHICLES.filter(pass).sort((a, b) => sortFn(a, b) || a.price - b.price);
    const lbl = (MKT_SORTS.find(x => x[0] === f.sort) || [])[1];
    if (list.length) html += `<div class="sortnote">${list.length} Fahrzeug${list.length === 1 ? "" : "e"} · sortiert nach ${esc(lbl)}</div>`;
    html += list.map(shopCard).join("");
  } else groups.forEach(m => {
    const list = VEHICLES.filter(v => v.mode === m && pass(v));
    if (!list.length) return;
    const mi = MODE_INFO[m];
    const avail = unlockedModes().includes(m);
    html += `<h3 class="grp" style="--c:${mi.color}">${mi.icon} ${mi.name}${avail ? "" : " <small>· ab Etappe " + firstStageWith(m) + "</small>"}</h3>`;
    html += list.map(shopCard).join("");
  });
  if (!mf && !VEHICLES.some(pass)) html += `<div class="empty">Kein Fahrzeug passt zu diesen Filtern.
    <button class="btn tiny ghost" id="mfReset">Filter zurücksetzen</button></div>`;
  $("#tab-market").innerHTML = html;
  const mr = $("#mfReset");
  if (mr) mr.onclick = () => { Object.assign(f, { cat: "all", avail: false, afford: false, flags: [] }); save(); renderMarket(); };
  /* Im Fokus: Kauf wird an den Ladeort überführt, danach zurück zum Auftrag */
  const buy = (id, lease) => {
    const v = acquire(id, lease, mf ? mf.at : null, mf ? mf.addr : null);
    if (v && mf) backToOrder();
  };
  $$("#tab-market [data-buy]").forEach(b => b.onclick = () => buy(b.dataset.buy, false));
  $$("#tab-market [data-lease]").forEach(b => b.onclick = () => buy(b.dataset.lease, true));
  if (mf) {
    $("#mfBack").onclick = backToOrder;
    $("#mfAll").onclick = () => { marketFocus = null; renderMarket(); };
  }
}
function firstStageWith(mode) {
  for (const st of STAGES) if (st.modes.includes(mode)) return st.n;
  return 6;
}

function stagesHTML() {
  return STAGES.map(st => {
    const state = st.n < S.stage ? "done" : st.n === S.stage ? "cur" : "lock";
    const next = st.n === S.stage + 1;
    const okLvl = level() >= st.reqLevel, okMoney = S.money >= st.cost;
    return `<div class="card stage ${state}">
      <div class="card-top"><span class="stnum">${st.n}</span>
        <div class="vname">${esc(st.name)}<small>${esc(st.info)}</small></div></div>
      <div class="meta small">
        <span>🚦 Level ${st.reqLevel}</span>
        <span>💰 ${st.cost ? money(st.cost) : "kostenlos"}</span>
        <span>🧭 ${st.modes.split("").map(m => MODE_INFO[m].icon).join(" ")}</span>
      </div>
      ${next ? `<button class="btn tiny${okLvl && okMoney ? "" : " disabled"}" id="unlockBtn">
        ${okLvl ? (okMoney ? "freischalten" : "Kapital fehlt: " + money(st.cost - S.money)) : "noch Level " + st.reqLevel + " nötig"}</button>` : ""}
      ${state === "cur" ? `<div class="lockrow ok">aktuell freigespielt</div>` : ""}
      ${state === "done" ? `<div class="lockrow ok">abgeschlossen</div>` : ""}
    </div>`;
  }).join("");
}

function infoHTML() {
  const punkt = S.done + S.late ? Math.round((S.done - S.late) / S.done * 100) : 100;
  return `
    ${S.player ? `<div class="card">
      <div class="card-top">
        <span class="hud-av" style="width:46px;height:46px;background:${COMPANY_COLORS[S.player.color]}33">
          ${portraitHTML(S.player.avatar, 46, { uid: "info", bg: false })}</span>
        <div class="vname">${esc(S.player.company)}<small>${esc(S.player.name)} · ${ORIGINS[S.player.origin].name}</small></div>
      </div></div>` : ""}
    <div class="card">
      <div class="vname">Deine Bilanz<small>Spieltag ${dayOf(S.time)}</small></div>
      <div class="meta small">
        <span>📦 ${S.done} zugestellt</span><span>⏰ ${S.late} verspätet</span><span>❌ ${S.failed} geplatzt</span>
        <span>🎯 ${punkt} % pünktlich</span><span>🛣️ ${kmf(S.kmTotal)}</span>
        <span>🚚 ${S.fleet.length} Fahrzeuge</span><span>⭐ ${S.xp} XP</span>
      </div>
      <div class="meta small"><span>Einnahmen ${money(S.revenue)}</span><span>Ausgaben ${money(S.expense)}</span></div>
    </div>
    ${co2HTML()}
    <div class="card"><div class="vname">So spielst du<small>Kurzanleitung</small></div>
      <ol class="how">
        <li>Unter <b>Aufträge</b> eine Ausschreibung antippen.</li>
        <li>Unter jedem Auftrag steht, welches Fahrzeug ihn übernehmen würde: ✅ steht schon am Abholort, ↩️ müsste erst leer hinfahren.</li>
        <li>In der Planung zeigt die Minikarte Abholung, Ziel und deine Fahrzeuge – die gestrichelte Linie ist die Leerfahrt.</li>
        <li>Nach der Zustellung steht das Fahrzeug am Ziel. Ein Auftrag, der genau dort startet, kommt ohne Leerfahrt aus.</li>
        <li>XP bringen Level, Level und Kapital schalten unter <b>Etappen</b> die nächste Weltregion frei.</li>
      </ol>
      <div class="buyrow">
        <button class="btn tiny ghost" id="tutAgainBtn">🎓 Tutorial mit Lina nochmal</button>
        <button class="btn tiny ghost" data-talk="offices">🏢 Büro-Tutorial</button>
        ${S.tutSeen && S.tutSeen.snus ? `<button class="btn tiny ghost" data-talk="snus">${typeof snusLogo === "function" ? snusLogo(16) : "🎩"} Mr. Snus erklärt</button>` : ""}
        ${S.tutSeen && S.tutSeen.pablo ? `<button class="btn tiny ghost" data-talk="pablo">❄️ Don Pablo erklärt</button>` : ""}
        ${S.tutSeen && S.tutSeen.extras ? `<button class="btn tiny ghost" data-talk="extras">🎯 Ziele, Konkurrenz, Pannen</button>` : ""}
      </div></div>
    <div class="card"><div class="vname">Tipp<small>${esc(pick(TIPS))}</small></div></div>
    <div class="card"><div class="vname">Verkehrsträger<small>Legende</small></div>
      <div class="legend">${Object.values(MODE_INFO).map(m =>
        `<span><i style="background:${m.color}"></i>${m.icon} ${m.name}</span>`).join("")}</div>
      <div class="legend" style="margin-top:8px">
        <span><i style="background:#ffe4a0;border-radius:50%;width:11px;height:11px"></i>🏙 Stadt</span>
        <span><i style="background:#9fd7ef;border-radius:50%;width:11px;height:11px"></i>⚓ Hafen</span>
        <span><i style="background:#ffc3cd;border-radius:50%;width:11px;height:11px"></i>🛫 Flughafen</span>
        <span><i style="background:#d6c9ff;border-radius:50%;width:11px;height:11px"></i>🚉 Terminal</span>
      </div></div>
    <div class="card"><div class="vname">Spielstand<small>wird automatisch im Browser gesichert</small></div>
      <button class="btn tiny ghost" id="resetBtn">neues Spiel starten</button></div>
    <p class="attr">Kartendaten © OpenStreetMap-Mitwirkende, ODbL. LOGISTIKA ist ein freies Hobbyprojekt.</p>`;
}

/* Klimabilanz: gesamt, je Tonnenkilometer, Anteil der Leerfahrten, nach
   Verkehrsträger und was die Räder gegenüber dem Kastenwagen sparen */
function co2HTML() {
  const e = co2State();
  const perTkm = e.tkm > 0.5 ? Math.round(e.kg * 1000 / e.tkm) : null;
  const emptyPct = e.kg > 0 ? Math.round(e.empty / e.kg * 100) : 0;
  const saved = e.bikeKm * CO2_VAN_KM;
  const modes = Object.keys(MODE_INFO).filter(m => e.byMode[m] > 0.05 || (m === "b" && e.bikeKm > 0));
  const bench = perTkm == null ? "" : perTkm < 60 ? "sehr sauber" : perTkm < 120 ? "ordentlich" : perTkm < 300 ? "viel Straße" : "viel Luftfracht";
  return `<div class="card">
      <div class="vname">🌱 Klimabilanz<small>CO₂ aus allen gefahrenen Kilometern, Leerfahrten eingeschlossen</small></div>
      <div class="kpis co2">
        <div><span>Ausgestoßen</span><b>${co2f(e.kg)}</b></div>
        <div><span>je Tonnenkilometer</span><b>${perTkm == null ? "—" : perTkm + " g"}</b>${bench ? `<small>${bench}</small>` : ""}</div>
        <div><span>davon Leerfahrten</span><b class="${emptyPct > 30 ? "bad" : ""}">${emptyPct} %</b></div>
        <div><span>Mit dem Rad gespart</span><b class="good">${co2f(saved)}</b><small>${kmf(e.bikeKm)} geradelt</small></div>
      </div>
      ${modes.length ? `<div class="meta small">${modes.map(m => `<span>${MODE_INFO[m].icon} ${co2f(e.byMode[m] || 0)}</span>`).join("")}</div>` : ""}
      <div class="co2note">Zum Vergleich: Lkw ≈ 80–110 g, Güterzug ≈ 15–30 g, Binnenschiff ≈ 30 g, Containerschiff ≈ 10 g, Luftfracht ≈ 300–600 g je Tonnenkilometer (mit Wirkung in großer Höhe gut das Doppelte). Kleine Lieferwagen liegen wegen der geringen Zuladung weit darüber. E-Lastenräder fahren praktisch emissionsfrei.</div>
    </div>`;
}

function renderWorld() {
  $("#tab-world").innerHTML =
    `<div class="sechead" style="margin-top:0">Etappen</div>` + stagesHTML() +
    (typeof economyHTML === "function" ? `<div class="sechead">Geschäft</div>` + economyHTML() + (typeof rivalsHTML === "function" ? rivalsHTML() : "") : "") +
    `<div class="sechead">Kontor</div>` + infoHTML();
  if (typeof bindEconomy === "function") bindEconomy();
  const b = $("#unlockBtn");
  if (b) b.onclick = unlockStage;
  const ta = $("#tutAgainBtn");
  if (ta) ta.onclick = () => { S.tut = { done: false }; startTutorial(); };
  $$("#tab-world [data-talk]").forEach(b => b.onclick = () => replayTalk(b.dataset.talk));
  const r = $("#resetBtn");
  if (r) r.onclick = () => {
    askConfirm("Neues Spiel", "Der aktuelle Spielstand wird gelöscht. Das lässt sich nicht rückgängig machen.",
      "Löschen und neu starten", wipeAndRestart, true);
  };
}

const TAB_TITLE = { orders: "Aufträge", jobs: "Live-Verfolgung", fleet: "Fuhrpark",
                   bases: "Standorte & Personal", market: "Fahrzeugmarkt", world: "Welt & Kontor" };
let activeTab = "map";
let lastPanel = "orders";
let renderDirty = true;
let touchDown = false, touchUpAt = 0;

function showTab(name) {
  if (name !== "market") marketFocus = null;     /* Markt-Fokus gilt nur für den direkten Sprung */
  activeTab = name;
  if (name !== "map") lastPanel = name;
  $$(".navbtn").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
  $$(".tabpane").forEach(p => p.classList.toggle("on", p.id === "tab-" + name));
  $("#view").classList.toggle("on", name !== "map");
  document.body.classList.toggle("tab-map", name === "map");
  if (name !== "map") $("#viewTitle").textContent = TAB_TITLE[name] || "";
  applyPadding();
  render();
  if (typeof tutTabHook === "function") tutTabHook(name);
}
function openSheet() { showTab(lastPanel); }
function closeSheet() { showTab("map"); }

function render() {
  renderHud();
  /* Während eines Ziehvorgangs bleibt die Liste stehen. */
  if (document.body.classList.contains("dragging-staff")) return;
  /* Auswahlliste gerade offen (z. B. Büro zuordnen): nicht unter dem Finger neu bauen */
  const ae = document.activeElement;
  if (ae && ae.tagName === "SELECT" && ae.closest("#view")) return;
  if (activeTab !== "orders" && activeTab !== "market") setTools(activeTab, "");
  ({ orders: renderOrders, jobs: renderJobs, fleet: renderFleet, bases: renderBases,
     market: renderMarket, world: renderWorld }[activeTab] || function () {})();
  renderDirty = false;
}

/* ------------------------------ Speichern ------------------------------- */
/* Beim Neustart darf das Wegspeichern beim Verlassen der Seite (pagehide)
   den gerade gelöschten Spielstand nicht wieder zurückschreiben. */
let noSave = false;
function save() {
  if (noSave) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* Speicher voll */ }
}
function wipeAndRestart() {
  noSave = true;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* egal */ }
  location.reload();
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d.money !== "number" || !Array.isArray(d.fleet)) return null;
    d.fleet = d.fleet.filter(f => vType(f.type));
    if (!("dispoMoved" in d)) d.dispoMoved = false;   /* Stand vor der Büro-Disposition */
    d.jobs = (d.jobs || []).filter(j => j.legs && j.legs.every(l => N[l.from] && N[l.to]));
    d.orders = (d.orders || []).filter(o => N[o.from] && N[o.to] && CARGO[o.cargo]);
    return d;
  } catch (e) { return null; }
}

/* Die Karte weicht auf breiten Bildschirmen dem Seitenpanel aus. */
function applyPadding() {
  if (!map) return;
  const wide = window.innerWidth >= 860;
  map.setPadding(0, wide && activeTab !== "map" ? 430 : 0);
}
function syncPadding() { applyPadding(); setTimeout(applyPadding, 340); }
/* Die Kopfleiste ist je nach Gerät und Schrift unterschiedlich hoch. Die
   Ansichten docken exakt darunter an – sonst blitzt zwischen beiden ein
   Streifen Karte durch. */
function syncHeadH() {
  const h = $("#hud");
  if (!h || !h.offsetHeight) return;
  /* exakte (auch krumme) Höhe – sonst bleibt ein Pixel Spalt oder Überlappung */
  document.documentElement.style.setProperty("--head-h", h.getBoundingClientRect().height.toFixed(2) + "px");
}
if (typeof ResizeObserver === "function") {
  const hud = document.getElementById("hud");
  if (hud) new ResizeObserver(syncHeadH).observe(hud);
}
window.addEventListener("resize", syncHeadH);

/* --------------------------------- Start -------------------------------- */
function boot() {
  S = Object.assign(newGame(), load() || {});
  lastLevel = level();
  ensureOffices();
  /* Eigene Porträts suchen; gefundene tauchen in der Charaktererstellung auf. */
  probePlayerArt(any => {
    if (!any) return;
    if ($("#intro").classList.contains("on") && typeof renderIntro === "function") renderIntro();
    if (S.player) { hudAvatarKey = ""; renderHud(); }
  });

  map = createMap($("#map"), { onDraw: drawWorld, onTap: onMapTap, onUserPan: () => { if (S.follow) setFollow(null); } });
  map.setZoomRange(2, 17);
  const st = STAGES[S.stage - 1];
  buildNetBuffers();
  window.addEventListener("resize", syncPadding);
  window.addEventListener("orientationchange", syncPadding);

  if (playing()) {
    probeGuideArt();
    document.body.classList.remove("locked");
    showTab("map");
    setTimeout(() => map.setView(st.center, st.zoom), 60);
    if (!S.orders.length) spawnOrders(8);
    renderFollowBar();
    renderFogNote(fogRadiusKm(S.stage, level()));
    /* Ältere Spielstände: Die Auto-Disposition ist ins Büro umgezogen */
    if (!S.dispoMoved) {
      S.dispoMoved = true;
      const had = S.autoDispatch;
      delete S.autoDispatch;
      if (had || S.fleet.length > 1) setTimeout(() => {
        phoneMsg({ from: "Lina Sturm", kind: "info", title: "Disposition jetzt im Büro",
          body: "Chef, die Auto-Disposition gibt’s nicht mehr extra – das erledigen jetzt die Leute aus der Disposition in deinen Büros. "
            + "Ordne Fahrzeuge einem Büro mit Disponent zu (geht auch direkt unter „Flotte“), dann fahren sie von allein. "
            + "Alle anderen teilst du selbst ein. Und die Dispo nimmt jetzt immer das passende Fahrzeug – kein Sattelzug mehr für eine Uhr." });
        save();
      }, 1500);
    }
    /* Mitten im Tutorial neu geladen: Lina macht weiter. Wer schon weiter
       ist, bekommt es nicht nachträglich aufgedrückt. */
    if (S.tut && S.tut.done === false) {
      if (level() < 3 && typeof startTutorial === "function") setTimeout(startTutorial, 900);
      else S.tut.done = true;
    }
  } else {
    document.body.classList.add("tab-map");
    map.setView(st.center, st.zoom);
    startIntro();
  }

  $$(".navbtn").forEach(b => b.onclick = () => {
    showTab(activeTab === b.dataset.tab && b.dataset.tab !== "map" ? "map" : b.dataset.tab);
  });
  $("#viewClose").onclick = () => showTab("map");
  $("#inspector").addEventListener("click", e => {
    if (performance.now() - mapTapAt < 400) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  /* Nach der Auswahl gibt jede Liste den Fokus wieder ab – sonst hält die
     Ansicht das Neuzeichnen an (siehe render). */
  document.addEventListener("change", e => {
    if (e.target && e.target.tagName === "SELECT") setTimeout(() => e.target.blur(), 0);
  }, true);

  $$("[data-speed]").forEach(b => {
    b.classList.toggle("on", +b.dataset.speed === S.speed);
    b.onclick = () => setSpeed(+b.dataset.speed);
  });
  if (S.speed > 0) lastSpeed = S.speed;
  $("#pauseBtn").onclick = togglePause;
  renderPause();
  $("#fogBtn").classList.toggle("on", S.fog);
  $("#fogBtn").onclick = () => {
    S.fog = !S.fog;
    $("#fogBtn").classList.toggle("on", S.fog);
    lastFogKm = 0;
    renderFogNote(fogRadiusKm(S.stage, level()));
    if (!S.fog) $("#fogNote").innerHTML = "";
    mapRedraw();
  };
  $("#liveBtn").onclick = followNext;
  $("#phoneBtn").onclick = openPhone;
  const gbtn = $("#goalsBtn"); if (gbtn) gbtn.onclick = () => { if (typeof openGoals === "function") openGoals(); };
  $("#hudMoney").onclick = openLedger;
  $("#hudAvatar").onclick = () => { if (typeof openFigure === "function") openFigure(); };
  $("#hudAvatar").title = "Figur ändern – auch aus einem Foto";
  renderPhoneBadge();
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
  window.addEventListener("keydown", e => {
    if (e.key !== "Escape" || tutorialRunning()) return;
    if (typeof walletOpen === "function" && walletOpen()) walletClose();
    else if (document.body.classList.contains("call-open")) closeCall();
    else if (document.body.classList.contains("invite-open")) closeInvite();
    else if (document.body.classList.contains("pack-open")) packEnd(false, true);
    else closeModal();
  });
  /* Kein Hineinzoomen der ganzen Seite per Doppeltipp oder Zwei-Finger-Geste
     (iOS ignoriert user-scalable=no) – die Karte zoomt selbst mit + / − und
     Pinch auf der Karte. */
  document.addEventListener("dblclick", e => e.preventDefault(), { passive: false });
  ["gesturestart", "gesturechange"].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
  /* Solange ein Finger auf dem Schirm liegt (und kurz danach), wird die
     offene Liste nicht neu gezeichnet – sonst verschwindet die Karte oder
     der Knopf unter dem Finger und der Tipp geht ins Leere. */
  document.addEventListener("pointerdown", () => { touchDown = true; }, true);
  const lift = () => { touchDown = false; touchUpAt = performance.now(); };
  document.addEventListener("pointerup", lift, true);
  document.addEventListener("pointercancel", lift, true);

  /* Spieluhr: 1 Sekunde Echtzeit = 1 Spielminute bei Tempo 1× */
  let last = performance.now(), acc = 0, baseTick = 0;
  function frame(now) {
    const real = Math.min(0.4, (now - last) / 1000);
    last = now;
    if (clockRunning()) tick(real * S.speed);
    if (playing()) tickFollow();
    /* Haft oder Spielende: eigene Vollbildanzeige, die Uhr steht */
    if (S.jail && typeof jailCheck === "function") jailCheck();
    if (S.over && typeof overCheck === "function") overCheck();
    acc += real;
    if (acc > 0.9 && playing()) {
      acc = 0; renderHud(); renderPause();
      /* Im Tutorial steht die Uhr – nichts ändert sich, also auch nichts neu zeichnen */
      const hold = touchDown || performance.now() - touchUpAt < 450 || tutorialRunning();
      if (!hold) {
        if (activeTab !== "market" && activeTab !== "world" && activeTab !== "bases") render();
        /* Der Büroreiter zeichnet Grundrisse und Porträts – der reicht seltener. */
        else if (activeTab === "bases" && ++baseTick % 4 === 0) render();
      }
      if (selected) renderInspector();
      renderFollowBar();
    }
    mapRedraw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  setInterval(save, 6000);
  document.addEventListener("visibilitychange", save);
  window.addEventListener("pagehide", save);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
}
document.addEventListener("DOMContentLoaded", boot);
