/* v313: node d2d-v313.test.js
   Tür-zu-Tür-Kette: Vorlauf/Hauptlauf/Nachlauf, Umfuhr Hafen → Flughafen, Mengenfluss mit Warten,
   Mehrfachfahrten, Kapazität, genau eine Auszahlung, Speichern/Laden (JSON) mitten in der Kette,
   alte laufende Aufträge, Suezkanal kein Kundenort. Lädt die echten Spieldateien (data.js, places.js,
   map.js, game.js) in eine VM; DOM, Zeichnen und Nebenwirkungen sind kleine Attrappen. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = fs.existsSync(path.join(__dirname, 'game.js')) ? __dirname : path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const el = () => ({ classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, style: {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], appendChild() {}, set innerHTML(v) {}, get innerHTML() { return ''; } });
const C = vm.createContext({
  console, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, requestAnimationFrame() {},
  performance: { now: () => 0 }, location: { search: '' }, navigator: { userAgent: 'node' },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: el, body: el(), documentElement: el() },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) }, Image: function () {}
});
const run = (s, f) => vm.runInContext(s, C, { filename: f });
for (const f of ['data.js', 'places.js', 'map.js', 'game.js']) run(read(f), f);
run(`
  var toasts = [];
  function umschlagFactor() { return 1; }
  checkLevel = () => {}; function tickBases() {} function baseDayChange() {} spawnOrders = () => 0; spawnJewels = () => {};
  toast = (m) => toasts.push(m); save = () => {}; render = () => {}; renderInspector = () => {}; mapRedraw = () => {};
  function fresh(stage) {
    S = Object.assign(newGame(), { phase: 'play', stage, money: 1e9, time: 600, lastDay: 0, player: { company: 'Test' } });
    clearRouteCache(); toasts = [];
  }
  function veh(type, at) { const v = makeVehicle(type); v.at = at; S.fleet.push(v); vehSpot(v); return v; }
  function order(from, to, ck, w) {
    const pr = priceOrder(from, to, ck, w);
    const o = { id: 'A' + (S.seq++), from, to, cargo: ck, weight: w, pay: pr.pay, deadline: pr.deadline, pk: PAY_K, shipper: 'Kunde', desc: '', created: S.time,
      refDist: 1, refTime: 1, expire: S.time + 1e6, pick: makeAddr(from), drop: makeAddr(to) };
    withLastMile(o); S.orders.push(o); return o;
  }
  function chainVia(o, mode) { return { label: 'T', legs: chainLegs(o, plan(o.from, o.to, o.cargo, o.weight, 'cost', mode).legs) }; }
  function conserve(j) {
    const L = j.legs; let s = L[0].qty - L[0].ld;
    L.forEach((l, i) => { s += l.ld - l.dn; if (i) s += L[i - 1].dn - l.ld; });
    return Math.abs(s + L[L.length - 1].dn - L[0].qty) < 1e-6;
  }
  /* derselbe Ablauf wie tick() für v313-Ketten, ohne Tageswechsel und Zufallsereignisse */
  function step(dt) {
    S.time += dt;
    for (const v of S.fleet) {
      if (!v.jobId) continue;
      const j = S.jobs.find(x => x.id === v.jobId);
      if (!j) { v.phase = 'idle'; v.jobId = null; continue; }
      if (j.v === D2D_V) d2dTick(v, j, j.legs[v.legIdx], vType(v.type), dt);
    }
  }
`, 'fixtures.js');
const T = (name, fn) => { try { fn(); console.log('ok  ', name); } catch (e) { console.log('FAIL', name); throw e; } };

T('Lokale Direktlieferung: eine Teilstrecke, ein Fahrzeug, Tür zu Tür', () => run(`{
  fresh(1); const b = veh('v-bullitt', 'b-kreuz'); const o = order('b-kreuz', 'b-mitte', 'pak', 20);
  const v = buildVariants(o)[0];
  if (v.legs.length !== 1 || v.legs[0].kind !== 'direkt') throw new Error(JSON.stringify(v.legs.map(l => l.kind)));
  const m0 = S.money; startJob(o, v, assignFor(v, o));
  for (let k = 0; k < 2000 && S.jobs.length; k++) step(1);
  if (S.jobs.length || S.done !== 1 || !(S.money > m0)) throw new Error('nicht zugestellt');
}`));

T('Schiff endet im Hafen, Nachlauf erst nach Warenankunft, Lkw wartet, Teilmengen, eine Auszahlung', () => run(`{
  fresh(3); const ship = veh('v-spits', 'b-westh'); veh('v-scania', 'b-westh'); const t2 = veh('v-scania', 'hannover');
  const o = order('b-westh', 'hannover', 'pal', 40000); const v = chainVia(o, 'i');
  if (v.legs.map(l => l.kind + l.mode).join() !== 'vorr,haupti,nachr') throw new Error(v.legs.map(l => l.kind).join());
  startJob(o, v, assignFor(v, o), v.legs.map(() => []));
  const j = S.jobs[0]; let waited = false, shipDoneOpen = false, partial = false, m0 = S.money, payouts = 0;
  for (let k = 0; k < 40000 && S.jobs.length; k++) {
    if (!conserve(j)) throw new Error('Menge verloren/doppelt');
    S.fleet.forEach(f => { if ((f.load || 0) > vType(f.type).cap) throw new Error('überladen'); });
    if (t2.phase === 'wait' && j.legs[1].dn === 0 && j.legs[2].ld > 0) throw new Error('Nachlauf lädt vor Ankunft');
    if (t2.phase === 'wait' && j.legs[1].dn === 0) waited = true;
    if (j.legs[1].done && S.jobs.length) shipDoneOpen = true;
    if (j.legs[2].dn > 0 && j.legs[2].dn < 40000) partial = true;
    const d0 = S.done; step(2); if (S.done > d0) payouts++;
  }
  if (S.jobs.length) throw new Error('nicht fertig');
  if (!waited || !shipDoneOpen || !partial || payouts !== 1 || S.done !== 1) throw new Error(JSON.stringify({ waited, shipDoneOpen, partial, payouts }));
  if (t2.jobs !== 2) throw new Error('Nachlauf sollte 2 Fahrten haben: ' + t2.jobs);
  for (let k = 0; k < 100; k++) step(2);
  if (S.done !== 1) throw new Error('zweite Auszahlung');
}`));

T('Speichern/Laden (JSON) mitten in der Kette läuft weiter, ohne Doppelzahlung', () => run(`{
  fresh(3); veh('v-spits', 'b-westh'); veh('v-scania', 'b-westh'); veh('v-scania', 'hannover');
  const o = order('b-westh', 'hannover', 'pal', 40000); const v = chainVia(o, 'i');
  startJob(o, v, assignFor(v, o), v.legs.map(() => []));
  const marks = [1500, 3000, 4200];
  for (let k = 0, n = 0; k < 40000 && S.jobs.length; k++) {
    step(2);
    if (marks.includes(++n)) { S = JSON.parse(JSON.stringify(S)); if (!conserve(S.jobs[0])) throw new Error('Menge nach Laden'); }
  }
  if (S.jobs.length || S.done !== 1) throw new Error('nach Neuladen nicht sauber fertig');
}`));

T('Umfuhr Hafen → Flughafen ist eigene Teilstrecke; Flugzeug lädt erst danach', () => run(`{
  fresh(5);
  const o = order('shanghai', 'fra', 'express', 5000);
  const legs = plan('shanghai', 'jebelali', 'express', 5000, 'cost', 's').legs.concat(plan('jebelali', 'fra', 'express', 5000, 'time', 'a').legs);
  const v = { legs: chainLegs(o, legs) };
  if (v.legs.map(l => l.kind).join() !== 'vor,haupt,umfuhr,haupt,nach') throw new Error(v.legs.map(l => l.kind).join());
  const um = v.legs[2], air = v.legs[3];
  if (!(um.dist > 15) || hav(um.pts[1], air.ta) > 0.01 || hav(um.pts[0], nodePt('jebelali')) > 0.01) throw new Error('Umfuhr-Punkte');
  ['v-daily@shanghai', 'v-feeder@shanghai', 'v-daily@jebelali', 'v-a330f@jebelali', 'v-daily@fra'].forEach(x => veh(...x.split('@')));
  startJob(o, v, assignFor(v, o), v.legs.map(() => []));
  const j = S.jobs[0];
  for (let k = 0; k < 40000 && S.jobs.length; k++) { if (j.legs[3].ld > j.legs[2].dn + 1e-9) throw new Error('Flug vor Umfuhr'); step(5); }
  if (S.jobs.length || S.done !== 1) throw new Error('nicht fertig');
}`));

T('Ungeeignete Fahrzeuge und Waren werden abgelehnt; Großmengen am eigenen Kai', () => run(`{
  fresh(4); veh('v-scania', 'hamburg'); veh('v-dafreefer', 'hamburg'); veh('v-caddy', 'hamburg'); veh('v-737', 'ham-air');
  const o = order('hamburg', 'rotterdam', 'kuehl', 30000); const v = chainVia(o, 's');
  const names = l => eligible(l, o, []).map(f => f.type).join();
  if (names(v.legs[0]) !== 'v-dafreefer') throw new Error('Vorlauf: ' + names(v.legs[0]));
  if (names(v.legs[1]) !== '') throw new Error('Hauptlauf: ' + names(v.legs[1]));
  const big = order('hamburg', 'rotterdam', 'schuett', 400000);
  if (big.pickT !== 's' || big.dropT !== 's') throw new Error('Großmenge ohne Kai');
  buildVariants(big).forEach(x => { if (x.legs.some(l => isDoorMode(l.mode))) throw new Error('Schüttgut auf Lkw'); });
}`));

T('Kein Seeschiff, Zug oder Flugzeug fährt bis an eine Kundentür (Stichprobe neuer Aufträge)', () => run(`{
  for (const st of [2, 3, 4, 5, 6]) {
    fresh(st);
    for (let k = 0; k < 40; k++) {
      const o = makeOrder(); if (!o) continue;
      if (o.from === 'suez' || o.to === 'suez') throw new Error('Suezkanal als Kundenort');
      buildVariants(o).forEach(v => {
        const f = v.legs[0], l = v.legs[v.legs.length - 1];
        if (!isDoorMode(f.mode) && !o.pickT) throw new Error('Hauptlauf ab Tür ' + o.from);
        if (!isDoorMode(l.mode) && !o.dropT) throw new Error('Hauptlauf bis Tür ' + o.to);
      });
    }
  }
}`));

T('Alter laufender Auftrag (ohne job.v) bleibt nach alter Logik nutzbar', () => run(`{
  fresh(3); const ship = veh('v-spits', 'b-westh'); const o = order('b-westh', 'magdeburg', 'pal', 20000);
  const net = plan('b-westh', 'magdeburg', 'pal', 20000, 'cost', 'i');
  const job = { id: 'J1', order: o, curLeg: 0, started: S.time, cost: 0, legs: net.legs.map((l, i, a) => ({ mode: l.mode, nodes: l.nodes.slice(), dist: l.dist, maxHop: l.maxHop,
    from: l.from, to: l.to, veh: ship.uid, done: false, a: i === 0 ? addrPt(oPick(o)) : null, b: i === a.length - 1 ? addrPt(oDrop(o)) : null })) };
  S.jobs.push(job); beginLeg(job, 0); S = JSON.parse(JSON.stringify(S));
  for (let k = 0; k < 40000 && S.jobs.length; k++) tick(2);
  if (S.jobs.length || S.done !== 1) throw new Error('Altauftrag hängt');
}`));
console.log('alle v313-Prüfungen bestanden');
