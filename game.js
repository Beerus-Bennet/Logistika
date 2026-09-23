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
    showNet: true, fog: true, autoDispatch: false, follow: null,
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
    let rv, fill, anchor = null;
    if (owned.length && Math.random() < 0.6) {
      const f = pick(owned);
      rv = vType(f.type); fill = rnd(0.72, 1.0);
      /* Anschlussaufträge: ein Teil der zugeschnittenen Ladung wartet genau
         dort, wo das Fahrzeug gerade frei steht. Wer darauf achtet, fährt
         ohne Leerfahrt weiter. */
      if (f.phase === "idle" && Math.random() < 0.45) anchor = f.at;
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
    const sh = pick(SHIPPERS[ck] || SHIPPERS.pak);
    return {
      id: "A" + (S.seq++), from: a.id, to: b.id, cargo: ck, weight,
      pay: pr.pay, deadline: pr.deadline,
      shipper: sh[0], desc: sh[1], created: S.time,
      refDist: Math.round(pr.ref.dist), refTime: Math.round(pr.fastest.time),
      expire: Math.round(S.time + rnd(400, 1500))
    };
  }
  return null;
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
  const sh = pick(SHIPPERS[ck] || SHIPPERS.pak);
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
      const o = tutOrderObj(f.at, n.id, c.ck, c.weight, pr, { tut: true });
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
    const o = tutOrderObj(leg.to, n.id, c.ck, c.weight, pr, { tutNext: true, tutVeh: f.uid });
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
    const sh = pick(SHIPPERS[ck] || SHIPPERS.pak);
    return {
      id: "A" + (S.seq++), from: a.id, to: b.id, cargo: ck, weight, pay, air: true,
      deadline: Math.round(S.time + fast.time * rnd(1.25, 1.55) + 240),
      shipper: sh[0], desc: sh[1] + " · per Luftfracht", created: S.time,
      refDist: Math.round(fast.dist), refTime: Math.round(fast.time),
      expire: Math.round(S.time + rnd(300, 900))
    };
  }
  return null;
}

function orderCap() {
  return Math.min(48, 6 + S.stage * 3 + Math.floor(S.fleet.length * 0.9));
}
function spawnOrders(max) {
  const cap = orderCap();
  let added = 0;
  /* Mr. Snus' Privatkunden zählen nicht gegen das Auftragsbuch */
  while (S.orders.filter(o => !o.snus && !o.pablo).length < cap && added < (max || 3)) {
    /* Ab Etappe 4 ist ein gutes Viertel reine Luftfracht – mit eigener
       Maschine noch etwas mehr. */
    const airShare = S.fleet.some(f => vType(f.type).mode === "a") ? 0.36 : 0.26;
    const o = (unlockedModes().includes("a") && Math.random() < airShare && makeAirOrder()) || makeOrder();
    if (!o) break;
    S.orders.push(o); added++;
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
    jobId: null, legIdx: -1, route: null, routeDist: 0, pos: 0, timer: 0, kmTotal: 0, jobs: 0
  };
}
function acquire(typeId, lease, deliverTo) {
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
  if (deliverTo && N[deliverTo] && N[deliverTo].modes.includes(t.mode)) v.at = deliverTo;
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
    const val = Math.round(t.price * 0.62);
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
function repoCost(veh, leg) {
  if (veh.at === leg.from) return { t: 0, d: 0, ok: true, edges: [] };
  const t = vType(veh.type);
  const e = repoPath(veh.at, leg.from, t.mode);
  if (!e || !e.length) return { t: Infinity, d: 0, ok: false, edges: [] };
  const d = e.reduce((a, x) => a + x.dist, 0);
  return { t: (d / t.speed) * 60, d, ok: true, edges: e };
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

function assignFor(variant, order) {
  const used = [];
  return variant.legs.map(leg => {
    const list = eligible(leg, order, used);
    if (!list.length) return null;
    list.sort((a, b) => {
      const ra = repoCost(a, leg), rb = repoCost(b, leg);
      if (Math.abs(ra.t - rb.t) > 1) return ra.t - rb.t;
      return vType(a.type).costKm - vType(b.type).costKm;
    });
    used.push(list[0].uid);
    return list[0].uid;
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
    ev.detail.forEach(d => { if (d.repo && d.repo.ok) { repoKm += d.repo.d; repoEur += d.repo.d * d.t.costKm; } });
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
  if (!o) return;
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
  const detail = variant.legs.map((leg, i) => {
    const mi = MODE_INFO[leg.mode];
    const veh = S.fleet.find(f => f.uid === assign[i]);
    if (!veh) { ok = false; return { leg, veh: null, repo: null, time: (leg.dist / 50) * 60, cost: 0 }; }
    const t = vType(veh.type);
    const repo = repoCost(veh, leg);
    if (!repo.ok) { ok = false; }
    const lt = (leg.dist / t.speed) * 60 + (repo.ok ? repo.t : 0) + mi.umschlag * 1.8;
    const lc = (leg.dist + (repo.ok ? repo.d : 0)) * t.costKm;
    cost += lc; time += lt;
    return { leg, veh, repo, time: lt, cost: lc, t };
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
      : `<span class="vo-b ${rc.d > 15 ? "bad" : "warn"}">↩️ ${kmf(rc.d)} leer<small>${dur(rc.t)} · −${money(rc.d * t.costKm)}</small></span>`;
  return `<button class="vopt${on ? " on" : ""}" data-leg="${i}" data-uid="${f.uid}" aria-pressed="${on}">
    <span class="vo-ic">${t.icon}</span>
    <span class="vo-tx"><b>${esc(t.name)}</b><small>📍 ${esc(N[f.at].name)}</small></span>
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
    orderId: o.id, vi: ps.vi, ids, at: leg.from,
    label: `${mi.icon} ${mi.name} · ab ${kgf(o.weight)}${cg.req.length ? " · " + cg.req.map(flagName).join(" + ") : ""}`
      + `${leg.maxHop > 400 ? " · Reichweite " + kmf(leg.maxHop) : ""}`,
    title: o.shipper, from: N[leg.from].name
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
  const start = N[v.legs[0].from];
  const span = Math.max(12, v.legs.reduce((a, l) => a + l.dist, 0) * 1.3);
  const others = new Map();
  v.legs.forEach(l => eligible(l, o, []).forEach(f => {
    if (selUids.has(f.uid) || others.has(f.uid)) return;
    if (hav([start.lat, start.lon], [N[f.at].lat, N[f.at].lon]) > span) return;
    others.set(f.uid, f);
  }));
  [...others.values()].slice(0, 8).forEach(f => vehs.push({ f, sel: false }));

  /* Punkte sammeln und in Web-Mercator projizieren */
  const ids = [];
  v.legs.forEach(l => l.nodes.forEach(id => ids.push(id)));
  vehs.forEach(x => {
    ids.push(x.f.at);
    if (x.repo && x.repo.ok) x.repo.edges.forEach(e => ids.push(e.to));
  });
  const ll = unwrapLons(ids.map(id => [N[id].lat, N[id].lon]));
  const W = {};
  ids.forEach((id, k) => { if (!W[id]) W[id] = [projX(ll[k][1]), projY(ll[k][0])]; });
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
  /* Route */
  v.legs.forEach(l => {
    const pts = l.nodes.map(P), c = MODE_INFO[l.mode].color;
    svg += `<polyline points="${pl(pts)}" class="pm-out"/><polyline points="${pl(pts)}" class="pm-route" style="stroke:${c}"/>`;
  });
  /* Leerfahrten der gewählten Fahrzeuge */
  vehs.forEach(x => {
    if (!x.sel || !x.repo || !x.repo.ok || x.repo.d < 0.5) return;
    const pts = [P(x.f.at)].concat(x.repo.edges.map(e => P(e.to)));
    svg += `<polyline points="${pl(pts)}" class="pm-repo-out"/><polyline points="${pl(pts)}" class="pm-repo"/>`;
  });
  /* Umschlagpunkte zwischen zwei Teilstrecken */
  v.legs.slice(1).forEach(l => { const p = P(l.from); svg += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" class="pm-hub"/>`; });

  /* Abholung und Ziel */
  const f1 = n => n.toFixed(1);
  const label = (p, txt, below, cls) => `<text x="${f1(clamp(p[0], 30, PM_W - 30))}" y="${f1(clamp(p[1] + (below ? 23 : -15), 11, PM_H - 4))}" class="pm-lbl${cls ? " " + cls : ""}">${esc(txt)}</text>`;
  const pickP = P(o.from), dropP = P(o.to);
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
    const id = x.f.at, base = P(id);
    const onMarker = id === o.from || id === o.to || v.legs.some(l => l.from === id);
    const k = used[id] = (used[id] || 0) + 1;
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
  svg += vsvg + label(pickP, N[o.from].short, pickBelow) + label(dropP, N[o.to].short, dropBelow);

  /* Satz darunter: gibt es eine Leerfahrt, und was kostet sie? */
  const rep = ev.detail.filter(d => d.veh && d.repo && d.repo.ok && d.repo.d >= 0.5);
  let line;
  if (ev.detail.some(d => !d.veh)) {
    line = `<div class="pm-sum bad">🚫 Für ${ev.detail.length > 1 ? "mindestens eine Teilstrecke" : "diese Strecke"} ist gerade kein passendes Fahrzeug frei.</div>`;
  } else if (!rep.length) {
    const f = ev.detail[0].veh;
    line = `<div class="pm-sum ok">✅ Keine Leerfahrt – ${esc(vType(f.type).brand)} steht schon in ${esc(N[o.from].short)}.</div>`;
  } else {
    const km = rep.reduce((a, d) => a + d.repo.d, 0), mn = rep.reduce((a, d) => a + d.repo.t, 0);
    const eur = rep.reduce((a, d) => a + d.repo.d * d.t.costKm, 0);
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
  ev.detail.forEach(d => { if (d.veh && d.repo && d.repo.ok) repoEur += d.repo.d * d.t.costKm; });

  const legHtml = ev.detail.map((d, i) => {
    const mi = MODE_INFO[d.leg.mode];
    const list = eligible(d.leg, o, ps.assign.filter((u, k) => k !== i && u));
    const all = d.veh && !list.some(x => x.uid === d.veh.uid) ? [d.veh, ...list] : list;
    /* Nach Anfahrt sortiert: wer schon am Ladeort steht, steht oben. */
    const rows = all.map(f => ({ f, t: vType(f.type), rc: repoCost(f, d.leg) }))
      .sort((a, b) => (a.rc.ok ? a.rc.d : 1e9) - (b.rc.ok ? b.rc.d : 1e9) || a.t.costKm - b.t.costKm);
    const LIMIT = 3;
    let shown = ps.showAll && ps.showAll[i] ? rows : rows.slice(0, LIMIT);
    const selRow = rows.find(r => r.f.uid === ps.assign[i]);
    if (selRow && !shown.includes(selRow)) shown = shown.concat(selRow);
    const more = rows.length - shown.length;
    const via = d.leg.nodes.length > 2
      ? `<div class="via">über ${d.leg.nodes.slice(1, -1).map(n => esc(N[n].short)).join(" · ")}</div>` : "";
    return `<div class="leg">
      <div class="leg-head"><span class="mode-chip" style="--c:${mi.color}">${mi.icon} ${mi.name}</span>
        <span class="leg-dist">${kmf(d.leg.dist)}</span></div>
      <div class="leg-route">${esc(N[d.leg.from].name)} <b>→</b> ${esc(N[d.leg.to].name)}</div>
      ${via}
      ${rows.length
        ? `<div class="vpick" data-leg="${i}">
             <div class="vp-h">Fahrzeug wählen <small>· nächstes zuerst</small></div>
             ${shown.map(r => vehOptHTML(r, i, r.f.uid === ps.assign[i])).join("")}
             ${more > 0 ? `<button class="vmore" data-more="${i}">+ ${more} weitere${more === 1 ? "s" : ""} Fahrzeug${more === 1 ? "" : "e"} zeigen</button>` : ""}
           </div>`
        : `<div class="warnbox">Kein freies Fahrzeug: ${mi.name}, mind. ${kgf(o.weight)}${cg.req.length ? ", " + cg.req.map(flagName).join(" + ") : ""}${d.leg.maxHop > 400 ? ", Reichweite " + kmf(d.leg.maxHop) : ""}.</div>`}
      ${modeNote(d.leg, o, ps)}
      ${rows.length ? "" : missingHelpHTML(d.leg, o, i)}
      ${d.repo && !d.repo.ok ? `<div class="warnbox">Dieses Fahrzeug erreicht den Ladeort nicht.</div>` : ""}
    </div>`;
  }).join("");

  $("#modalBody").innerHTML = `
    <div class="mhead">
      <div><div class="mtitle">${cg.icon} ${esc(o.shipper)}</div>
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
    <div class="sum">
      <div><span>Transportkosten</span><b>${ev.ok ? money(ev.cost) : "—"}</b>
        ${ev.ok ? `<small class="${repoEur > 0.005 ? "bad" : "good"}">${repoEur > 0.005 ? "davon Leerfahrt " + money(repoEur) : "ohne Leerfahrt"}</small>` : ""}</div>
      <div><span>Laufzeit</span><b>${ev.ok ? dur(ev.time) : "—"}</b></div>
      <div><span>Ankunft</span><b class="${ev.ok ? (late ? "bad" : "good") : ""}">${ev.ok ? stamp(eta) + (late ? " · zu spät" : "") : "—"}</b></div>
      <div><span>Deckungsbeitrag</span><b class="${ev.ok ? (profit > 0 ? "good" : "bad") : ""}">${ev.ok ? money(profit) : "—"}</b></div>
    </div>
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
  if (ev.ok) $("#mAccept").onclick = () => acceptOrder(ps.vi);
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

function startJob(o, variant, assign) {
  const job = {
    id: "J" + (S.seq++), order: o, curLeg: 0, started: S.time, cost: 0,
    legs: variant.legs.map((leg, i) => ({
      mode: leg.mode, nodes: leg.nodes.slice(), dist: leg.dist, maxHop: leg.maxHop,
      from: leg.from, to: leg.to, veh: assign[i], done: false
    }))
  };
  job.legs.forEach(l => { const f = S.fleet.find(x => x.uid === l.veh); if (f) f.phase = "reserved"; });
  if (o.snus && typeof snusTake === "function") snusTake(o);
  if (o.pablo && typeof pabloTake === "function") pabloTake(o);
  S.jobs.push(job);
  S.orders = S.orders.filter(x => x.id !== o.id);
  beginLeg(job, 0);
}

/* ---------------------------- Auto-Disposition -------------------------- */
const AUTO_LEVEL = 2;                 /* vorher disponiert man von Hand */
function autoAllowed() { return level() >= AUTO_LEVEL; }
function autoDispatch() {
  if (!S.autoDispatch || !autoAllowed()) return;
  /* Fahrzeuge mit Standort werden von ihrem eigenen Team disponiert. */
  const bound = assignedUids();
  const freeFleet = S.fleet.filter(f => !bound.has(f.uid));
  const idleModes = new Set();
  freeFleet.forEach(f => { if (f.phase === "idle") idleModes.add(vType(f.type).mode); });
  if (!idleModes.size) return;
  dispatchPool = new Set(freeFleet.map(f => f.uid));
  try { autoDispatchRun(idleModes); } finally { dispatchPool = null; }
}
function autoDispatchRun(idleModes) {
  const inPool = (f) => !dispatchPool || dispatchPool.has(f.uid);
  /* Mr. Snus' Kundschaft bleibt Handarbeit */
  const cands = S.orders.filter(o => !o.snus && !o.pablo).sort((a, b) => b.pay - a.pay);
  let examined = 0, taken = 0;
  for (const o of cands) {
    if (examined++ > 30 || taken >= 3) break;
    if (!S.fleet.some(f => f.phase === "idle" && inPool(f))) break;
    const variants = buildVariants(o);
    for (const v of variants) {
      if (!v.legs.every(l => idleModes.has(l.mode))) continue;
      const assign = assignFor(v, o);
      if (assign.some(x => !x)) continue;
      const ev = evaluate(v, o, assign);
      if (!ev.ok) continue;
      const over = (S.time + ev.time) - o.deadline;
      if (over > 6 * 60) continue;
      const expPay = over > 0 ? o.pay * Math.max(0.2, 1 - (over / 60) * 0.04) : o.pay;
      if (expPay - ev.cost <= ev.cost * 0.12) continue;
      startJob(o, v, assign);
      taken++;
      idleModes.clear();
      S.fleet.forEach(f => { if (f.phase === "idle" && inPool(f)) idleModes.add(vType(f.type).mode); });
      break;
    }
  }
}

/* ------------------------------- Simulation ----------------------------- */
function legCoords(leg) {
  if (!leg._c) leg._c = unwrapLons(leg.nodes.map(id => [N[id].lat, N[id].lon]));
  return leg._c;
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
  if (veh.at !== leg.from) {
    const r = repoCost(veh, leg);
    if (!r.ok) { failJob(job, "Leerfahrt zum Ladeort nicht möglich"); return; }
    veh.phase = "repo";
    veh.route = unwrapLons([[N[veh.at].lat, N[veh.at].lon]].concat(r.edges.map(e => [N[e.to].lat, N[e.to].lon])));
    veh.routeDist = pathLen(veh.route);
  } else {
    veh.phase = "load";
    veh.timer = MODE_INFO[leg.mode].umschlag * rnd(0.8, 1.25) * umschlagFactor(leg.from);
    veh.route = null; veh.routeDist = 0;
  }
}

function failJob(job, reason) {
  job.legs.forEach(l => {
    const f = S.fleet.find(x => x.uid === l.veh);
    if (f && f.jobId === job.id || (f && f.phase === "reserved")) { f.phase = "idle"; f.jobId = null; f.legIdx = -1; f.route = null; }
  });
  /* Privatkunde von Mr. Snus / Don Pablo: keine Vertragsstrafe, die Ware geht zurück ins Lager */
  if (job.order.pablo) {
    if (typeof pabloGiveBack === "function") pabloGiveBack(job.order);
    S.jobs = S.jobs.filter(j => j.id !== job.id);
    toast("❄️ " + job.order.shipper + " ist abgesprungen – die Ware liegt wieder im Hangar.", "warn");
    return;
  }
  if (job.order.snus) {
    if (typeof snusGiveBack === "function") snusGiveBack(job.order);
    S.jobs = S.jobs.filter(j => j.id !== job.id);
    toast("🥫 " + job.order.shipper + " hat abgesagt – Dosen wieder im Lager.", "warn");
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
  S.money += pay; S.revenue += pay; S.done++;
  if (o.snus) {
    logMoney("snus", o.shipper + " · " + o.snus.n + " Dosen", pay);
    if (typeof snusDelivered === "function") snusDelivered(o);
  } else if (o.pablo) {
    logMoney("pablo", o.shipper + " · " + kgf(o.pablo.kg), pay);
    if (typeof pabloDelivered === "function") pabloDelivered(o);
  } else logMoney("job", o.shipper + " · " + N[o.from].short + " → " + N[o.to].short, pay);
  if (job.cost > 0) logMoney("drive", "Fahrt und Umschlag · " + o.shipper, -job.cost);
  S.xp += Math.max(3, Math.round(Math.pow(Math.max(1, pay), 0.55) / 2.2));
  S.jobs = S.jobs.filter(j => j.id !== job.id);
  if (late) toast("⏰ Verspätet zugestellt: " + o.shipper, "warn", true);
  checkLevel();
}

let lastLevel = 1;
function checkLevel() {
  const l = level();
  if (l > lastLevel) {
    lastLevel = l;
    toast("🎉 Level " + l + " erreicht!", "ok");
    if (S.fog) toast("🌫️ Der Nebel lichtet sich: " + kmf(fogRadiusKm(S.stage, l)) + " Sichtweite.", "ok");
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
  }

  for (const veh of S.fleet) {
    if (!veh.jobId) continue;
    const job = S.jobs.find(j => j.id === veh.jobId);
    if (!job) { veh.phase = "idle"; veh.jobId = null; veh.route = null; continue; }
    const leg = job.legs[veh.legIdx];
    if (!leg) continue;
    const t = vType(veh.type);

    if (veh.phase === "load" || veh.phase === "unload") {
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
      const step = (t.speed * (typeof vehSpeedFactor === "function" ? vehSpeedFactor(veh) : 1) * dtMin) / 60;
      veh.pos += step; veh.kmTotal += step;
      if (veh.phase === "haul") {
        S.kmTotal += step;
        S.co2 += step * (CO2[t.mode] || 0.05) * (job.order.weight / 1000);
      }
      if (veh.pos >= veh.routeDist) {
        const cost = veh.routeDist * t.costKm;
        S.money -= cost; S.expense += cost; job.cost += cost;
        veh.pos = 0; veh.route = null;
        if (veh.phase === "repo") {
          veh.at = leg.from;
          veh.phase = "load"; veh.timer = MODE_INFO[leg.mode].umschlag * rnd(0.8, 1.25) * umschlagFactor(leg.from);
        } else {
          veh.at = leg.to;
          veh.phase = "unload"; veh.timer = MODE_INFO[leg.mode].umschlag * rnd(0.55, 0.95) * umschlagFactor(leg.to);
        }
      }
    }
  }

  const before = S.orders.length;
  S.orders = S.orders.filter(o => o.expire > S.time && o.deadline > S.time + 30);
  if (S.orders.length !== before) renderDirty = true;
  if (S.time - S.lastSpawn > 120) { S.lastSpawn = S.time; if (spawnOrders(3 + Math.floor(S.fleet.length / 6))) renderDirty = true; }
  tickBases(dtMin);
  if (typeof tickSnus === "function") tickSnus(dtMin);
  if (typeof tickPablo === "function") tickPablo(dtMin);
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
function vehPos(v) {
  return (v.phase === "repo" || v.phase === "haul") && v.route
    ? routePointAt(v.route, v.pos) : [N[v.at].lat, N[v.at].lon];
}
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

const TYPE_GLYPH = { city: "🏙", port: "⚓", air: "🛫", rail: "🚉" };

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
  el.innerHTML = `<div class="fog-note">🌫️ erschlossen: ${kmf(km)} um jeden Standort</div>`;
}

function drawWorld(m, ctx) {
  const z = m.zoom;
  drawFog(m, ctx);

  // 1. Infrastrukturnetz (vorprojiziert, gebündelt gezeichnet)
  if (S.showNet) {
    const minZoomFor = { s: 0, i: 3.8, l: 3.4, r: 4.6, a: 3.6, b: 8.5 };
    for (const mode of ["s", "i", "l", "r", "a", "b"]) {
      const buf = netBuffers[mode];
      if (!buf || !buf.length) continue;
      if (z < minZoomFor[mode]) continue;
      const mi = MODE_INFO[mode];
      const close = z >= 8.5;                       // Stadtmaßstab: sehr zurückhaltend
      m.segments(buf, {
        color: mi.color,
        width: mode === "a" ? 1 : (close ? 1.5 : 2),
        alpha: mode === "a" ? 0.15 : (close ? 0.2 : 0.32),
        dash: mode === "a" ? [3, 7] : (mode === "s" ? [9, 6] : (close ? [7, 7] : []))
      });
    }
  }

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

  // 3. Vorschau im Planungsdialog
  if (planState) {
    const v = planState.variants[planState.vi];
    v.legs.forEach(l => {
      const mi = MODE_INFO[l.mode];
      m.line(legCoords(l), {
        color: mi.color, width: 5, dash: [10, 8],
        dashOffset: -(performance.now() / 45) % 18,
        outline: "rgba(16,34,47,0.6)", outlineWidth: 3
      });
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
    const big = n.type !== "city" || z >= 8;
    const labelOk = n.type !== "city" ? z >= 5.4 : z >= 10.2;
    const r = z < 4 ? 5 : (big ? 9 : 7);
    m.pin(n.lat, n.lon, (c, x, y) => {
      c.beginPath(); c.arc(x + 1.5, y + 2, r, 0, 7); c.fillStyle = "rgba(16,34,47,0.45)"; c.fill();
      c.beginPath(); c.arc(x, y, r, 0, 7);
      c.fillStyle = n.type === "port" ? "#9fd7ef" : n.type === "air" ? "#ffc3cd" : n.type === "rail" ? "#d6c9ff" : "#ffe4a0";
      c.fill();
      c.lineWidth = 2.2; c.strokeStyle = "#10222f"; c.stroke();
      if (z >= 6.5) {
        c.font = (r + 2) + "px system-ui, sans-serif";
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(TYPE_GLYPH[n.type] || "•", x, y + 0.5);
      }
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

  // 5. Fahrzeuge
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
      c.font = (r - 1) + "px system-ui, 'Apple Color Emoji','Segoe UI Emoji', sans-serif";
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = "#0d1b2a";
      c.fillText(t.icon, x, y + 1);
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

/* Stehen mehrere Fahrzeuge am selben Ort, lagen sie bisher exakt
   übereinander – man sah nur eins. Jetzt rücken sie im Kreis auseinander,
   damit man auf einen Blick sieht, wer wo steht. Versatz in Bildpunkten. */
function vehFan() {
  const groups = new Map();
  S.fleet.forEach(v => {
    if ((v.phase === "repo" || v.phase === "haul") && v.route) return;
    const g = groups.get(v.at); if (g) g.push(v.uid); else groups.set(v.at, [v.uid]);
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

function onMapTap(px, py) {
  if (!playing()) return;
  let best = null, bestD = 26;
  const fan = vehFan();
  S.fleet.forEach(v => {
    const p = (v.phase === "repo" || v.phase === "haul") && v.route
      ? routePointAt(v.route, v.pos) : [N[v.at].lat, N[v.at].lon];
    if (!p) return;
    const s = map.screenPos(p[0], p[1]);
    const fo = fan[v.uid] || [0, 0];
    const d = Math.hypot(s[0] + fo[0] - px, s[1] + fo[1] - py);
    if (d < bestD) { bestD = d; best = { kind: "veh", id: v.uid }; }
  });
  if (!best) {
    unlockedNodes().forEach(n => {
      const s = map.screenPos(n.lat, n.lon);
      const d = Math.hypot(s[0] - px, s[1] - py);
      if (d < bestD) { bestD = d; best = { kind: "node", id: n.id }; }
    });
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
}

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
  snus:  { icon: "🥫", name: "Snus" },
  pablo: { icon: "❄️", name: "Don Pablo" }
};
function logMoney(kind, label, amount) {
  if (!S.ledger) S.ledger = [];
  if (!amount) return;
  S.ledger.unshift({ t: S.time, k: kind, l: label, a: Math.round(amount) });
  if (S.ledger.length > 260) S.ledger.length = 260;
}
function ledgerSums(fromTime) {
  let inc = 0, exp = 0;
  (S.ledger || []).forEach(e => {
    if (fromTime != null && e.t < fromTime) return;
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
  const rows = (S.ledger || []);
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
  el.textContent = hiddenToasts && low ? msg + "  (+" + hiddenToasts + ")" : msg;
  if (low) hiddenToasts = 0;
  box.appendChild(el);
  while (box.children.length > 2) box.removeChild(box.firstChild);
  setTimeout(() => el.classList.add("out"), 3000);
  setTimeout(() => el.remove(), 3600);
}

function phaseLabel(v) {
  const job = S.jobs.find(j => j.id === v.jobId);
  const leg = job ? job.legs[v.legIdx] : null;
  switch (v.phase) {
    case "idle": return "bereit in " + N[v.at].name;
    case "reserved": return "disponiert, wartet auf Vorlauf";
    case "repo": return "Leerfahrt nach " + (leg ? N[leg.from].short : "?");
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
}

/* ---------------------- Leerfahrt-Vorschau je Auftrag ---------------------
   Was würde passieren, wenn man den Auftrag jetzt annimmt: welches Fahrzeug
   übernimmt, muss es erst leer anfahren, und was kostet das? Gerechnet wird
   wie im Planer (Verkehrsträger, Reichweite, Kapazität), nur ohne Dialog.
   Zwischengespeichert, solange sich an der freien Flotte nichts ändert.  */
let previewSig = "";
const previewCache = new Map();
function dispatchPreview(o) {
  const sig = S.stage + "|" + S.fleet.map(f => f.uid + ":" + f.phase + "@" + f.at).join(",");
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
const ORDER_SORTS = [["pay", "💶 Erlös"], ["near", "📍 Wenig Leerfahrt"], ["due", "⏳ Frist"]];
function renderOrders() {
  const el = $("#tab-orders");
  if (!S.orders.length) { el.innerHTML = `<div class="empty">Gerade keine Ausschreibungen. In ein paar Stunden kommen neue herein.</div>`; return; }
  const mode = S.orderSort || "pay";
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
  const pin = o => o.tut ? 2 : o.tutNext ? 1 : 0;
  rows.sort((a, b) => pin(b.o) - pin(a.o) || by(a, b));
  const bar = `<div class="osort">${ORDER_SORTS.map(([k, l]) =>
    `<button data-sort="${k}" class="${k === mode ? "on" : ""}">${l}</button>`).join("")}</div>`;
  const stock = (typeof snusStockHTML === "function" ? snusStockHTML() : "")
    + (typeof pabloStockHTML === "function" ? pabloStockHTML() : "");
  el.innerHTML = bar + stock + rows.map(({ o, p }) => {
    if (o.snus && typeof snusOrderCard === "function") return snusOrderCard(o, previewHTML(p));
    if (o.pablo && typeof pabloOrderCard === "function") return pabloOrderCard(o, previewHTML(p));
    const cg = CARGO[o.cargo];
    const rest = o.deadline - S.time;
    const tight = rest < o.refTime * 1.25;
    return `<div class="card order${o.tut ? " tut" : ""}${o.tutNext ? " tutnext" : ""}" data-order="${o.id}">
      ${o.tut ? `<div class="tutribbon">⭐ Linas Übungsauftrag</div>` : ""}
      ${o.tutNext ? `<div class="tutribbon">⭐ Anschlussauftrag ab ${esc(N[o.from].short)}</div>` : ""}
      <div class="card-top">
        <span class="badge" style="--c:${tight ? "#ff5c78" : "#ffc12e"}">${cg.icon} ${cg.name}</span>
        ${o.air ? `<span class="badge air">✈️ Luftfracht</span>` : ""}
        <span class="pay">${money(o.pay)}</span>
      </div>
      <div class="ship">${esc(o.shipper)}</div>
      <div class="desc">${esc(o.desc)}</div>
      <div class="meta"><span>📍 ${esc(N[o.from].short)}</span><span>🏁 ${esc(N[o.to].short)}</span></div>
      <div class="meta small">
        <span>⚖️ ${kgf(o.weight)}</span><span>📏 ${kmf(o.refDist)}</span>
        <span>⏳ ${dur(rest)}</span><span>⚡ ab ${dur(o.refTime)}</span>
      </div>
      ${previewHTML(p)}
    </div>`;
  }).join("");
  $$("#tab-orders .order").forEach(c => c.onclick = () => openPlanner(c.dataset.order));
  $$("#tab-orders [data-sort]").forEach(b => b.onclick = () => {
    S.orderSort = b.dataset.sort; save(); renderOrders();
    $("#view .view-body") && ($("#view .view-body").scrollTop = 0);
  });
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
    return `<div class="card job" data-job="${j.id}">
      <div class="card-top">
        <span class="badge" style="--c:${late ? "#ff5c78" : "#7cd6a0"}">${cg.icon} ${cg.name}</span>
        <span class="pay">${money(o.pay)}</span>
      </div>
      <div class="ship">${esc(o.shipper)}</div>
      <div class="meta small"><span>${esc(N[o.from].short)} → ${esc(N[o.to].short)}</span>
        <span>⚖️ ${kgf(o.weight)}</span><span>⏳ ${late ? "überfällig" : dur(o.deadline - S.time)}</span></div>
      <div class="chain">${j.legs.map((l, i) => {
        const mi = MODE_INFO[l.mode];
        const st = l.done ? "done" : (i === j.curLeg ? "now" : "wait");
        return `<span class="chip-leg ${st}" style="--c:${mi.color}">${mi.icon}</span>`;
      }).join('<i class="arrow">›</i>')}</div>
      <div class="bar"><i style="width:${prog}%"></i></div>
      <div class="meta small"><span>${veh ? esc(phaseLabel(veh)) : "wartet"}</span><span>${Math.round(prog)} %</span></div>
      <div class="buyrow">
        <button class="btn tiny ghost" data-zoom="${j.id}">🗺️ Route zeigen</button>
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
    j.legs.forEach(l => l.nodes.forEach(id => pts.push([N[id].lat, N[id].lon])));
    map.fitBounds(pts, 80, 11);
    closeSheet();
  });
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
  const head = `<div class="card auto${autoAllowed() ? "" : " locked"}">
      <div class="card-top"><div class="vname">Auto-Disposition<small>${autoAllowed()
        ? "Das Spiel nimmt passende, profitable Aufträge selbst an."
        : "Ab Level " + AUTO_LEVEL + ". Die ersten Aufträge disponierst du von Hand – danach weißt du, worauf es ankommt."}</small></div>
      ${autoAllowed()
        ? `<button class="toggle ${S.autoDispatch ? "on" : ""}" id="autoBtn"><i></i></button>`
        : `<span class="lockchip">🔒 Lv ${AUTO_LEVEL}</span>`}</div>
      ${S.fleet.length ? `<div class="meta small"><span>💤 ${idle} von ${S.fleet.length} im Leerlauf</span><span>🅿️ ${money(fix)}/Tag Fixkosten</span></div>` : ""}
      ${S.fleet.length ? `<div class="locrow"><span class="loclbl">Frei stehen:</span>${locChips || `<span class="locchip none">gerade keins – alle unterwegs</span>`}</div>` : ""}
      ${S.fleet.length > 3 && idle > S.fleet.length * 0.6
        ? `<div class="warnbox">Mehr als die Hälfte der Flotte steht still und kostet trotzdem. Weniger Fahrzeuge oder größere Etappen wären günstiger.</div>` : ""}
      </div>`;
  if (!S.fleet.length) {
    el.innerHTML = head + `<div class="empty">Noch kein Fahrzeug. Hol dir im <b>Markt</b> ein Lastenrad oder einen Kastenwagen.</div>`;
    bindAuto(); return;
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
      <div class="buyrow">
        ${v.phase !== "idle" ? `<button class="btn tiny ${S.follow === v.uid ? "" : "ghost"}" data-follow="${v.uid}">
          ${S.follow === v.uid ? "📡 verfolgt" : "📡 live verfolgen"}</button>` : ""}
        ${v.phase === "idle" ? `<button class="btn tiny ghost" data-release="${v.uid}">${v.lease ? "Leasing beenden" : "verkaufen · " + money(Math.round(t.price * 0.62))}</button>` : ""}
      </div>
    </div>`;
  }).join("");
  $$("#tab-fleet [data-release]").forEach(b => b.onclick = () => release(b.dataset.release));
  $$("#tab-fleet [data-follow]").forEach(b => b.onclick = () => {
    setFollow(S.follow === b.dataset.follow ? null : b.dataset.follow);
    closeSheet();
  });
  bindAuto();
}
function bindAuto() {
  const b = $("#autoBtn");
  if (b) b.onclick = () => {
    S.autoDispatch = !S.autoDispatch;
    b.classList.toggle("on", S.autoDispatch);
    toast(S.autoDispatch ? "Auto-Disposition aktiv." : "Auto-Disposition aus.", "ok");
  };
}
function flagName(f) {
  return { kuehl: "Kühlung", adr: "Gefahrgut", sperrig: "Schwerlast", container: "Container", schuett: "Schüttgut" }[f] || f;
}

function renderMarket() {
  const groups = ["b", "r", "i", "l", "s", "a"];
  const mf = marketFocus && S.orders.some(o => o.id === marketFocus.orderId) ? marketFocus : null;
  if (!mf) marketFocus = null;
  let html = "";
  if (mf) html += `<div class="card shopfocus">
      <div class="vname">🎯 Passend für „${esc(mf.title)}“<small>${esc(mf.label)} · Überführung nach ${esc(mf.from)} inklusive</small></div>
      <div class="buyrow">
        <button class="btn tiny" id="mfBack">↩ zurück zum Auftrag</button>
        <button class="btn tiny ghost" id="mfAll">alle Fahrzeuge zeigen</button>
      </div></div>`;
  groups.forEach(m => {
    const list = VEHICLES.filter(v => v.mode === m && (!mf || mf.ids.includes(v.id)));
    if (!list.length) return;
    const mi = MODE_INFO[m];
    const avail = unlockedModes().includes(m);
    html += `<h3 class="grp" style="--c:${mi.color}">${mi.icon} ${mi.name}${avail ? "" : " <small>· ab Etappe " + firstStageWith(m) + "</small>"}</h3>`;
    html += list.map(t => {
      const locked = t.stage > S.stage || !avail;
      const lease = t.daily + t.price * LEASE_RATE;
      return `<div class="card shop${locked ? " locked" : ""}${mf ? " match" : ""}">
        <div class="card-top"><span class="vicon">${t.icon}</span>
          <div class="vname">${esc(t.name)}<small>${esc(t.brand)}</small></div>
          <span class="price">${money(t.price)}</span></div>
        <div class="meta small">
          <span>⚖️ ${kgf(t.cap)}</span><span>🏎️ ${t.speed} km/h</span>
          <span>⛽ ${fmt(t.costKm, 2)} €/km</span><span>📏 ${kmf(t.range)}</span>
        </div>
        ${t.flags.length ? `<div class="flags">${t.flags.map(f => `<i>${flagName(f)}</i>`).join("")}</div>` : ""}
        ${locked
          ? `<div class="lockrow">🔒 ab Etappe ${Math.max(t.stage, firstStageWith(m))}</div>`
          : `<div class="buyrow">
               <button class="btn tiny${S.money >= t.price ? "" : " disabled"}" data-buy="${t.id}">kaufen</button>
               <button class="btn tiny ghost" data-lease="${t.id}">leasen · ${money(lease)}/Tag</button>
             </div>`}
      </div>`;
    }).join("");
  });
  $("#tab-market").innerHTML = html;
  /* Im Fokus: Kauf wird an den Ladeort überführt, danach zurück zum Auftrag */
  const buy = (id, lease) => {
    const v = acquire(id, lease, mf ? mf.at : null);
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
        <span>🌱 ${fmt(S.co2 / 1000, 1)} t CO₂</span>
        <span>🚚 ${S.fleet.length} Fahrzeuge</span><span>⭐ ${S.xp} XP</span>
      </div>
      <div class="meta small"><span>Einnahmen ${money(S.revenue)}</span><span>Ausgaben ${money(S.expense)}</span></div>
    </div>
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
        ${S.tutSeen && S.tutSeen.snus ? `<button class="btn tiny ghost" data-talk="snus">🥫 Mr. Snus erklärt</button>` : ""}
        ${S.tutSeen && S.tutSeen.pablo ? `<button class="btn tiny ghost" data-talk="pablo">❄️ Don Pablo erklärt</button>` : ""}
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

function renderWorld() {
  $("#tab-world").innerHTML =
    `<div class="sechead" style="margin-top:0">Etappen</div>` + stagesHTML() +
    `<div class="sechead">Kontor</div>` + infoHTML();
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
  } else {
    document.body.classList.add("tab-map");
    map.setView(st.center, st.zoom);
    startIntro();
  }

  $$(".navbtn").forEach(b => b.onclick = () => {
    showTab(activeTab === b.dataset.tab && b.dataset.tab !== "map" ? "map" : b.dataset.tab);
  });
  $("#viewClose").onclick = () => showTab("map");

  $$("[data-speed]").forEach(b => {
    b.classList.toggle("on", +b.dataset.speed === S.speed);
    b.onclick = () => setSpeed(+b.dataset.speed);
  });
  if (S.speed > 0) lastSpeed = S.speed;
  $("#pauseBtn").onclick = togglePause;
  renderPause();
  $("#netBtn").classList.toggle("on", S.showNet);
  $("#netBtn").onclick = () => {
    S.showNet = !S.showNet;
    $("#netBtn").classList.toggle("on", S.showNet);
    mapRedraw();
  };
  $("#homeBtn").onclick = () => {
    setFollow(null);
    const s = STAGES[S.stage - 1];
    map.flyTo(s.center, s.zoom, 900);
  };
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
  $("#hudMoney").onclick = openLedger;
  $("#hudAvatar").onclick = () => { if (typeof openFigure === "function") openFigure(); };
  $("#hudAvatar").title = "Figur ändern – auch aus einem Foto";
  renderPhoneBadge();
  $("#zoomIn").onclick = () => map.zoomBy(1);
  $("#zoomOut").onclick = () => map.zoomBy(-1);
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
  window.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); } });

  /* Spieluhr: 1 Sekunde Echtzeit = 1 Spielminute bei Tempo 1× */
  let last = performance.now(), acc = 0, autoTimer = 0, baseTick = 0;
  function frame(now) {
    const real = Math.min(0.4, (now - last) / 1000);
    last = now;
    if (clockRunning()) {
      tick(real * S.speed);
      autoTimer += real;
      if (autoTimer > 1.2) { autoTimer = 0; autoDispatch(); }
    }
    if (playing()) tickFollow();
    /* Haft oder Spielende: eigene Vollbildanzeige, die Uhr steht */
    if (S.jail && typeof jailCheck === "function") jailCheck();
    if (S.over && typeof overCheck === "function") overCheck();
    acc += real;
    if (acc > 0.9 && playing()) {
      acc = 0; renderHud(); renderPause();
      if (activeTab !== "market" && activeTab !== "world" && activeTab !== "bases") render();
      /* Der Büroreiter zeichnet Grundrisse und Porträts – der reicht seltener. */
      else if (activeTab === "bases" && ++baseTick % 4 === 0) render();
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
