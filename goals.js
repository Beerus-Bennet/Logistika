/* =========================================================================
   LOGISTIKA – Ziele: Rahmenverträge, Missionen, Tagesaufgaben, Erfolge

   · Rahmenverträge: feste Menge je Tag über mehrere Tage, gut bezahlt, harte
     Vertragsstrafe bei Ausfall. Die Dispo darf sie fahren.
   · Missionen von Lina: kleine Geschichten mit Frist und Belohnung.
   · Tagesaufgaben: drei pro Tag, dazu Erfolge mit Abzeichen.
   ========================================================================= */
"use strict";

/* =============================== Verträge =============================== */
function contracts() { if (!S.contracts) S.contracts = []; return S.contracts; }
function activeContracts() { return contracts().filter(c => !c.over); }
/* Kann die eigene Flotte das überhaupt fahren? Sonst wäre der Vertrag eine Falle. */
function fleetCanDo(o) {
  return buildVariants(o).some(v => v.legs.every(l => S.fleet.some(f => {
    const t = vType(f.type);
    /* v313: Straße und Rad dürfen mehrmals fahren (wie eligible in game.js) */
    if (t.mode === l.mode && typeof isDoorMode === "function" && isDoorMode(l.mode)) return canCarry(t, o.cargo, 0, l.maxHop) && t.cap * D2D_TRIPS >= o.weight;
    return t.mode === l.mode && canCarry(t, o.cargo, o.weight, l.maxHop);
  })));
}
function contractOffer(tpl0) {
  let tpl = tpl0 || null;   /* v244: Stammkunden bieten einen Vertrag über genau ihre Strecke an */
  for (let i = 0; i < 30 && !tpl; i++) {
    const o = makeOrder();
    if (o && !o.air && CARGO[o.cargo].minStage <= S.stage && o.pay > 0 && fleetCanDo(o)) tpl = o;
  }
  if (!tpl) return null;
  const days = Math.round(rnd(5, 9) + S.stage * 1.5), per = Math.random() < 0.5 ? 1 : Math.random() < 0.7 ? 2 : 3;
  const pay = Math.round(tpl.pay * rnd(1.2, 1.35) / 5) * 5;
  return { id: "V" + (S.seq++), client: tpl.shipper, desc: tpl.desc, cargo: tpl.cargo, from: tpl.from, to: tpl.to, cid: tpl.cid, gi: tpl.gi,
    weight: tpl.weight, pick: tpl.pick, drop: tpl.drop, per, days, pay, penalty: Math.round(pay * 0.6),
    day: 0, done: 0, missed: 0, pending: [], over: false, refTime: tpl.refTime, refDist: tpl.refDist };
}
function offerContract(tpl) {
  if (typeof logiOn === "function" && !logiOn()) return;
  const c = contractOffer(tpl); if (!c) return;
  const total = c.per * c.days * c.pay;
  decisionMsg({ from: c.client, kind: "contract", icon: "📑", type: "contract", title: "Angebot: Rahmenvertrag über " + c.days + " Tage",
    body: `Täglich ${c.per}× ${CARGO[c.cargo].name} (${kgf(c.weight)}) ${N[c.from].short} → ${N[c.to].short}, je ${money(c.pay)} `
      + `(gesamt ${money(total)}). Ausfall: −${money(c.penalty)} · ab 90 % erfüllt +15 % Bonus.`,
    choices: [{ label: "Vertrag unterschreiben", sub: "startet morgen früh" }, { label: "Ablehnen" }], def: 1, wait: 240,
    ctx: { c } });
}
DECISIONS.contract = {
  choose(m, idx) {
    if (idx !== 0) return "Abgelehnt.";
    const c = m.dec.ctx.c;
    c.start = (Math.floor(S.time / 1440) + 1) * 1440 + 6 * 60;
    contracts().push(c);
    return "Unterschrieben – ab " + stamp(c.start) + ".";
  }
};
/* v387: Machbarkeit prüfen – Rücksprache mit den Büros vor der Unterschrift.
   Je Büro: liegt der Abholort in seiner Reichweite, gibt es Fahrpersonal, passende Fahrzeuge für die ganze Kette einer
   Variante, und schafft die Strecke die 20-Stunden-Frist einer Vertragsfahrt? Daraus: wie viele der täglichen Fahrten das
   Büro übernehmen kann (Fahrzeugketten × Umläufe am Tag, gedeckelt durch Fahrpersonal, abzüglich laufender Verträge in seiner
   Reichweite). Gesamturteil: Summe der Büros gegen die geforderte Tagesmenge. Nur Anzeige – am Vertrag ändert sich nichts. */
function contractFeasibility(c) {
  const o = { id: "probe", from: c.from, to: c.to, cargo: c.cargo, weight: c.weight, pay: c.pay, pk: PAY_K, cid: c.cid, gi: c.gi, created: S.time,
    deadline: S.time + 1200, expire: S.time + 1200, refDist: c.refDist, refTime: c.refTime, pick: Object.assign({}, c.pick), drop: Object.assign({}, c.drop) };
  let vars = []; try { vars = buildVariants(o); } catch (e) { vars = []; }
  const fits = (f, l) => { const t = vType(f.type); if (!t || t.mode !== l.mode) return false;
    if (typeof isDoorMode === "function" && isDoorMode(l.mode)) return canCarry(t, o.cargo, 0, l.maxHop) && t.cap * D2D_TRIPS >= o.weight;
    return canCarry(t, o.cargo, o.weight, l.maxHop); };
  const modesTxt = v => [...new Set(v.legs.map(l => MODE_VEH[l.mode] || l.mode))].join(" + ");
  const fast = vars.slice().sort((a, b) => a.time - b.time)[0];
  const rows = (S.bases || []).map(b => {
    const name = N[b.node] ? N[b.node].short : b.node, km = Math.round(hav(N[b.node], N[c.from])), reach = typeof reachKm === "function" ? reachKm(b) : 400;
    if (km > reach) return { name, ok: false, n: 0, why: "Zu weit weg: " + km + " km bis " + N[c.from].short + " (Reichweite " + Math.round(reach) + " km)" };
    const drivers = typeof roleCount === "function" ? roleCount(b, "fahr") : 1;
    if (!drivers) return { name, ok: false, n: 0, why: "Kein Fahrpersonal im Büro" };
    const fleet = (b.vehicles || []).map(u => S.fleet.find(f => f.uid === u)).filter(Boolean);
    let best = null;
    vars.forEach(v => { const sets = Math.min(...v.legs.map(l => fleet.filter(f => fits(f, l)).length));
      if (sets > 0 && v.time <= 1200) { const per = clamp(Math.floor(960 / Math.max(60, v.time * 2)), 1, 4), n = sets * per; if (!best || n > best.n) best = { n, v }; } });
    if (!best) return { name, ok: false, n: 0, why: fast && fast.time > 1200 ? "Strecke dauert länger als die Tagesfrist (" + Math.round(fast.time / 60) + " h)" : "Kein passendes Fahrzeug" + (fast ? " (braucht " + modesTxt(fast) + ")" : "") };
    const team = (typeof driverCap === "function" ? driverCap(b) : drivers) + (typeof assignedDriverIds === "function" ? assignedDriverIds(b).size : 0);
    const inReach = activeContracts().filter(k => N[k.from] && hav(N[b.node], N[k.from]) <= reach).reduce((x, k) => x + k.per, 0);
    const n = Math.max(0, Math.min(best.n, Math.max(1, team)) - inReach);
    return n > 0 ? { name, ok: true, n: Math.min(n, c.per), why: "Kann " + Math.min(n, c.per) + " von " + c.per + " Fahrten täglich übernehmen · " + modesTxt(best.v) + (inReach ? " · " + inReach + " Vertragsfahrten laufen schon" : "") }
      : { name, ok: false, n: 0, why: "Ausgelastet: " + inReach + " Vertragsfahrten täglich laufen schon" };
  });
  const sum = rows.reduce((a, r) => a + r.n, 0);
  const ok = rows.length ? sum >= c.per : fleetCanDo(o);
  const sumTxt = rows.length ? (ok ? "Machbar: Die Büros schaffen zusammen " + c.per + " von " + c.per + " Fahrten täglich."
      : "Nicht machbar: zusammen nur " + sum + " von " + c.per + " Fahrten täglich – es droht die Vertragsstrafe.")
    : ok ? "Kein Büro zum Nachfragen – die Flotte hätte passende Fahrzeuge, geplant wird aber nur von Hand." : "Kein Büro und kein passendes Fahrzeug in der Flotte.";
  return { ok, sum, rows, sumTxt, t: S.time };
}
/* Daumen als Vektorbild (Form nach Material Icons „thumb_up“, Apache-2.0), grün = ja, rot und gedreht = nein */
const FEAS_THUMB = ok => `<i class="fth ${ok ? "yes" : "no"}"><svg viewBox="0 0 24 24" aria-label="${ok ? "ja" : "nein"}"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg></i>`;
function contractFeasHTML(m) {
  const F = m.dec.feas;
  if (!F) return `<button class="dfeas" data-feas="${m.id}">🔎 Machbarkeit prüfen <small>Rücksprache mit den Büros</small></button>`;
  return `<div class="feas ${F.ok ? "yes" : "no"}"><div class="feas-sum">${FEAS_THUMB(F.ok)}<b>${esc(F.sumTxt)}</b></div>
    ${F.rows.map(r => `<div class="feas-row ${r.ok ? "yes" : "no"}">${FEAS_THUMB(r.ok)}<span><b>${esc(r.name)}</b><small>${esc(r.why)}</small></span></div>`).join("")}
    <small class="feas-t">Stand ${clock(F.t)}</small></div>`;
}
function contractOrder(c) {
  const o = { id: "A" + (S.seq++), from: c.from, to: c.to, cargo: c.cargo, weight: c.weight, pay: c.pay, pk: PAY_K, cid: c.cid, gi: c.gi,
    deadline: Math.round(S.time + 20 * 60), shipper: c.client, desc: c.desc + " · Rahmenvertrag", created: S.time,
    refDist: c.refDist, refTime: c.refTime, expire: Math.round(S.time + 20 * 60), contract: c.id,
    pick: Object.assign({}, c.pick), drop: Object.assign({}, c.drop) };
  return o;
}
function tickContracts() {
  activeContracts().forEach(c => {
    if (S.time >= c.start && c.day < c.days && S.time >= (c.nextAt || c.start)) {
      for (let i = 0; i < c.per; i++) { const o = contractOrder(c); S.orders.unshift(o); c.pending.push(o.id); }
      c.day++; c.nextAt = c.start + c.day * 1440;
      renderDirty = true;
    }
    /* Verfallene Vertragsfahrten zählen als Ausfall */
    c.pending = c.pending.filter(id => {
      if (S.orders.some(o => o.id === id) || S.jobs.some(j => j.order.id === id)) return true;
      if ((c.doneIds || []).includes(id)) return false;
      c.missed++;
      payOut(c.penalty, "fail", "Vertragsstrafe · " + c.client);
      repAdd(regionOf(c), -4);
      toast("📑 Vertragsfahrt für " + c.client + " ausgefallen: −" + money(c.penalty), "bad");
      return false;
    });
    if (c.day >= c.days && !c.pending.length) {
      c.over = true;
      const n = c.per * c.days, ok = c.missed <= Math.floor(n * 0.1);
      if (ok) {
        const bonus = Math.round(n * c.pay * 0.15);
        S.money += bonus; S.revenue += bonus; logMoney("bonus", "Vertragsbonus · " + c.client, bonus);
        repAdd(regionOf(c), 8); extraStats().contracts++;
        phoneMsg({ from: c.client, kind: "good", title: "Rahmenvertrag erfüllt", body: `${c.done} von ${n} Fahrten erledigt – danke! ${money(bonus)} Bonus ist überwiesen.` });
      } else {
        repAdd(regionOf(c), -5);
        phoneMsg({ from: c.client, kind: "info", title: "Vertrag beendet", body: `${c.missed} von ${n} Fahrten ausgefallen – kein Anschlussvertrag.` });
      }
    }
  });
}
function contractDelivered(o) {
  const c = contracts().find(x => x.id === o.contract); if (!c) return;
  c.done++; (c.doneIds = c.doneIds || []).push(o.id);
  c.pending = c.pending.filter(id => id !== o.id);
}

/* =============================== Missionen =============================== */
const MISSIONS = [
  { id: "weihnacht", st: 1, title: "Weihnachtsgeschäft", icon: "🎄", hours: 24, need: 12, test: (j) => ["pak", "express"].includes(j.order.cargo),
    text: "Chef, die Paketlager platzen! {n} Paket- oder Expressaufträge in 24 h?", rew: 900 },
  { id: "gruen", st: 1, title: "Grüne Woche", icon: "🚲", hours: 24, need: 8, test: (j) => j.legs.every(l => l.mode === "b"),
    text: "Verkehrswende! {n} Lieferungen komplett per Rad in 24 h – der Senat zahlt.", rew: 700, needBike: true },
  { id: "kuehl", st: 1, title: "Kühlkette", icon: "🧊", hours: 36, need: 5, test: (j) => j.order.cargo === "kuehl",
    text: "Hitzewelle! {n} Kühltransporte für die Supermärkte in 36 h?", rew: 1100, needFlag: "kuehl" },
  { id: "hochwasser", st: 2, title: "Hochwasserhilfe Dresden", icon: "🌊", hours: 36, spawn: { to: "dresden", cargo: "pal", n: 3, kg: [3000, 6000], desc: "Sandsäcke und Pumpen für die Deiche" },
    text: "Die Elbe steigt! 3 Transporte Sandsäcke & Pumpen nach Dresden in 36 h.", rew: 4200 },
  { id: "messe", st: 3, title: "Messe-Marathon Hannover", icon: "🏛️", hours: 48, spawn: { to: "hannover", cargo: "pal", n: 4, kg: [1500, 5000], desc: "Messestand und Exponate" },
    text: "4 Aussteller ohne Spedition – bring ihre Stände in 48 h nach Hannover.", rew: 12000 },
  { id: "hafen", st: 4, title: "Rekordwoche im Hafen", icon: "⚓", hours: 72, need: 3, test: (j) => j.legs.some(l => l.mode === "s" || l.mode === "i"),
    text: "Der Hafen will einen Rekord: {n} Aufträge per Schiff in 3 Tagen?", rew: 60000, needMode: "is" },
  { id: "luft", st: 4, title: "Luftbrücke", icon: "✈️", hours: 48, need: 3, test: (j) => j.legs.some(l => l.mode === "a"),
    text: "Hilfsflüge gesucht: {n} Luftfrachtaufträge in 48 h.", rew: 80000, needMode: "a" }
];
function missionState() { if (!S.missions) S.missions = { active: null, done: [], next: 0 }; return S.missions; }
function missionFits(mi) {
  if (mi.st > S.stage) return false;
  if (missionState().done.includes(mi.id) && Math.random() < 0.6) return false;
  const types = S.fleet.map(f => vType(f.type));
  if (mi.needBike && !types.some(t => t.mode === "b")) return false;
  if (mi.needFlag && !types.some(t => t.flags.includes(mi.needFlag))) return false;
  if (mi.needMode && !types.some(t => mi.needMode.includes(t.mode))) return false;
  if (mi.spawn && (!isUnlocked(mi.spawn.to) || !plan("b-mitte", mi.spawn.to, mi.spawn.cargo, mi.spawn.kg[0], "cost"))) return false;
  return true;
}
function missionNeed(mi) { return mi.need ? Math.max(3, Math.round(mi.need * (S.fleet.length >= 6 ? 1 : 0.7))) : mi.spawn.n; }
function offerMission() {
  if (typeof logiOn === "function" && !logiOn()) return;
  const pool = MISSIONS.filter(missionFits);
  if (!pool.length) return;
  const mi = pick(pool), n = missionNeed(mi);
  const rew = Math.round(mi.rew * stageK() / (mi.st >= 4 ? 18 : mi.st >= 3 ? 6 : mi.st >= 2 ? 2.5 : 1) / 10) * 10;
  decisionMsg({ from: "Lina Sturm", kind: "mission", icon: mi.icon, type: "mission", title: "Mission: " + mi.title,
    body: mi.text.replace("{n}", n) + ` Belohnung: ${money(rew)} + Ruf.`,
    choices: [{ label: "Machen wir!" }, { label: "Diesmal nicht" }], def: 1, wait: 180, ctx: { id: mi.id, n, rew } });
}
DECISIONS.mission = {
  choose(m, idx) {
    if (idx !== 0) return "Vielleicht beim nächsten Mal.";
    const mi = MISSIONS.find(x => x.id === m.dec.ctx.id);
    const a = { id: mi.id, title: mi.title, icon: mi.icon, need: m.dec.ctx.n, got: 0, rew: m.dec.ctx.rew,
      until: S.time + mi.hours * 60, orders: [] };
    if (mi.spawn) {
      const froms = unlockedNodes().filter(n => n.id !== mi.spawn.to && n.modes.includes("r")).sort(() => Math.random() - 0.5);
      for (const f of froms) {
        if (a.orders.length >= mi.spawn.n) break;
        const w = Math.round(rnd(mi.spawn.kg[0], mi.spawn.kg[1]) / 10) * 10;
        const pr = priceOrder(f.id, mi.spawn.to, mi.spawn.cargo, w);
        if (!pr) continue;
        const o = { id: "A" + (S.seq++), from: f.id, to: mi.spawn.to, cargo: mi.spawn.cargo, weight: w, pay: Math.round(pr.pay * 1.2), pk: PAY_K,
          deadline: a.until, shipper: "Mission: " + mi.title, desc: mi.spawn.desc, created: S.time,
          refDist: Math.round(pr.ref.dist), refTime: Math.round(pr.fastest.time), expire: a.until, mission: mi.id,
          pick: makeAddr(f.id), drop: makeAddr(mi.spawn.to) };
        S.orders.unshift(o); a.orders.push(o.id);
      }
      a.need = a.orders.length;
    }
    missionState().active = a;
    return "Mission läuft bis " + stamp(a.until) + ".";
  }
};
function missionDelivered(job, late) {
  const a = missionState().active; if (!a) return;
  const mi = MISSIONS.find(x => x.id === a.id);
  const hit = mi.spawn ? job.order.mission === a.id : mi.test(job);
  if (!hit) return;
  a.got++;
  if (a.got >= a.need) {
    S.money += a.rew; S.revenue += a.rew; logMoney("bonus", "Mission " + a.title, a.rew);
    addXP(60 + S.stage * 20); repAdd(S.stage, 6); extraStats().missions++;
    missionState().done.push(a.id); missionState().active = null;
    toast(a.icon + " Mission „" + a.title + "“ geschafft: +" + money(a.rew), "ok");
    phoneMsg({ from: "Lina Sturm", kind: "good", title: "Mission geschafft!", body: "Stark, Chef! „" + a.title + "“ erledigt: +" + money(a.rew) + "." });
    checkLevel();
  }
}
function tickMissions() {
  const ms = missionState(), a = ms.active;
  if (a && S.time > a.until) {
    ms.active = null;
    S.orders = S.orders.filter(o => o.mission !== a.id);
    repAdd(S.stage, -2);
    toast(a.icon + " Mission „" + a.title + "“ nicht geschafft (" + a.got + "/" + a.need + ").", "warn");
  }
  if (!lively() || level() < 3) return;
  if (!ms.next) ms.next = S.time + rnd(2.5, 4) * 1440;
  if (!ms.active && S.time >= ms.next && !pendingDecisions().some(m => m.dec.type === "mission")) {
    ms.next = S.time + rnd(5, 8) * 1440;
    offerMission();
  }
}

/* ============================ Tagesaufgaben ============================ */
const TASKS = [
  { id: "n", icon: "📦", make: () => ({ n: clamp(3 + S.stage + Math.floor(S.fleet.length * 1.2), 3, 40) }), label: t => `${t.n} Aufträge zustellen`, on: "done" },
  { id: "bike", icon: "🚲", ok: () => S.fleet.some(f => vType(f.type).mode === "b"), make: () => ({ n: 3 + Math.floor(Math.random() * 3) }), label: t => `${t.n} Lieferungen komplett per Rad`, on: "bike" },
  { id: "jewel", icon: "💎", ok: () => S.fleet.some(f => vType(f.type).flags.includes("kurier")) && !(typeof logiOn === "function" && !logiOn()), make: () => ({ n: 2 }), label: t => `${t.n} Wertkurier-Fahrten`, on: "jewel" },
  { id: "rev", icon: "💶", make: () => ({ n: roundK(Math.max(600 * stageK(), (S.revY || 0) * 1.15), 50) }), label: t => `${money(t.n)} Frachterlös an einem Tag`, on: "rev", money: true },
  { id: "mode", icon: "🚢", ok: () => S.fleet.some(f => "isla".includes(vType(f.type).mode)), make: () => {
      const m = pick([...new Set(S.fleet.map(f => vType(f.type).mode).filter(x => "isla".includes(x)))]);
      return { n: 1, m };
    }, label: t => `Ein Auftrag per ${MODE_INFO[t.m].name}`, on: "mode" },
  { id: "punct", icon: "⏰", make: () => ({ n: 4 }), label: t => `${t.n} Zustellungen in Folge pünktlich`, on: "punct" },
  { id: "kuehl", icon: "🧊", ok: () => S.fleet.some(f => vType(f.type).flags.includes("kuehl")), make: () => ({ n: 2 }), label: t => `${t.n} Kühltransporte`, on: "kuehl" }
];
function dailyState() {
  if (!S.daily) S.daily = { day: -1, tasks: [], rev: 0, streak: 0, claimed: false };
  /* v58: gestrichene Aufgaben („Ohne Leerfahrt“) aus alten Ständen ersetzen */
  const d = S.daily;
  if (d.tasks.some(t => !TASKS.some(x => x.id === t.id))) {
    d.tasks = d.tasks.filter(t => TASKS.some(x => x.id === t.id));
    const pool = TASKS.filter(t => (!t.ok || t.ok()) && !d.tasks.some(x => x.id === t.id)).sort(() => Math.random() - 0.5);
    while (d.tasks.length < 3 && pool.length) { const t = pool.shift(); d.tasks.push(Object.assign({ id: t.id, got: 0, done: false }, t.make())); }
  }
  return d;
}
function newDaily() {
  const d = dailyState();
  S.revY = d.rev;
  const pool = TASKS.filter(t => !t.ok || t.ok());
  const pickN = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  d.day = dayOf(S.time); d.rev = 0; d.streak = 0; d.claimed = false;
  d.tasks = pickN.map(t => Object.assign({ id: t.id, got: 0, done: false }, t.make()));
}
function dailyReward() { return roundK(150 * stageK(), 10); }
function goalsDelivered(job, pay, late) {
  if (calm()) return;
  const o = job.order, d = dailyState();
  if (o.contract) contractDelivered(o);
  missionDelivered(job, late);
  if (o.snus || o.pablo) { checkAchievements(); return; }
  d.rev += pay;
  d.streak = late ? 0 : d.streak + 1;
  const inc = (id, v) => d.tasks.forEach(t => { if (t.id === id && !t.done) t.got = v != null ? v : t.got + 1; });
  inc("n");
  if (job.legs.every(l => l.mode === "b")) inc("bike");
  if (o.jewel) inc("jewel");
  inc("rev", d.rev);
  d.tasks.forEach(t => { if (t.id === "mode" && !t.done && job.legs.some(l => l.mode === t.m)) t.got++; });
  inc("punct", d.streak);
  if (o.cargo === "kuehl") inc("kuehl");
  d.tasks.forEach(t => {
    if (!t.done && t.got >= t.n) {
      t.done = true;
      const r = dailyReward();
      S.money += r; S.revenue += r; addXP(25); logMoney("bonus", "Tagesaufgabe: " + TASKS.find(x => x.id === t.id).label(t), r);
      toast("🎯 Tagesaufgabe geschafft: " + TASKS.find(x => x.id === t.id).label(t) + " · +" + money(r), "ok");
    }
  });
  if (!d.claimed && d.tasks.length && d.tasks.every(t => t.done)) {
    d.claimed = true;
    const r = dailyReward() * 2;
    S.money += r; S.revenue += r; addXP(50); extraStats().dailySets++;
    logMoney("bonus", "Alle Tagesaufgaben", r);
    toast("🏆 Alle drei Tagesaufgaben! Bonus +" + money(r), "ok");
    if (typeof luckyDailySet === "function") luckyDailySet();
  }
  checkAchievements();
  checkLevel();
}
function goalsFailed(job) {
  const d = dailyState(); d.streak = 0;
  d.tasks.forEach(t => { if (t.id === "punct" && !t.done) t.got = 0; });
  if (job.order.contract) {
    const c = contracts().find(x => x.id === job.order.contract);
    if (c) { c.pending = c.pending.filter(id => id !== job.order.id); c.missed++; payOut(c.penalty, "fail", "Vertragsstrafe · " + c.client); }
  }
}
/* v261: gemeinsame Bremse für alle Vertragsangebote (täglicher Zufallsvertrag und Stammkunden-Vertrag):
   ab Level 4, höchstens 2 (ab Etappe 4: 3) laufende Verträge, kein unbeantwortetes Angebot, und nach jedem Angebot
   mindestens 4–7 Spieltage Pause. Vorher hatten Stammkunden keine Grenze – bei mehreren Stammkunden kamen Angebote
   gleichzeitig und im Dauerfeuer. */
function contractMayOffer() {
  return level() >= 4 && activeContracts().length < (S.stage >= 4 ? 3 : 2) && S.time >= (S.contractNext || 0)
    && !pendingDecisions().some(m => m.dec.type === "contract");
}
function goalsDay() {
  newDaily();
  if (typeof shareDay === "function") shareDay();
  if (!lively()) return;
  if (contractMayOffer()) {
    S.contractNext = S.time + rnd(4, 7) * 1440;
    if (S.time > 3 * 1440) offerContract();
  }
}
let goalsTick = 0;
function tickGoals() {
  if (dailyState().day !== dayOf(S.time)) newDaily();
  tickContracts();
  tickMissions();
  if (++goalsTick % 20 === 0) checkAchievements();
}

/* ================================ Erfolge ================================ */
const ACHS = [
  { id: "first", icon: "📦", name: "Erste Zustellung", desc: "Der Anfang ist gemacht.", ok: () => S.done >= 1 },
  { id: "d100", icon: "💯", name: "Hundert Zustellungen", desc: "100 Aufträge zugestellt.", ok: () => S.done >= 100 },
  { id: "d1000", icon: "🏅", name: "Tausendsassa", desc: "1.000 Aufträge zugestellt.", ok: () => S.done >= 1000 },
  { id: "bike50", icon: "🚲", name: "Pedalritter", desc: "50 Lieferungen per Rad.", ok: () => extraStats().bike >= 50 },
  { id: "ship", icon: "🛥️", name: "Leinen los", desc: "Erste Fracht per Schiff.", ok: () => (extraStats().modes.i || 0) + (extraStats().modes.s || 0) >= 1 },
  { id: "rail", icon: "🚆", name: "Auf Schiene", desc: "Erste Fracht per Bahn.", ok: () => (extraStats().modes.l || 0) >= 1 },
  { id: "air", icon: "✈️", name: "Abgehoben", desc: "Erste Luftfracht.", ok: () => (extraStats().modes.a || 0) >= 1 },
  { id: "vip1", icon: "✉️", name: "Geladener Gast", desc: "Erste Sonderfahrt erledigt.", ok: () => extraStats().vip >= 1 },
  { id: "vip5", icon: "🎩", name: "Erste Adresse", desc: "Fünf Sonderfahrten erledigt.", ok: () => extraStats().vip >= 5 },
  { id: "nego", icon: "🤝", name: "Verhandlungssache", desc: "Fünfmal einen besseren Preis herausgeholt.", ok: () => extraStats().nego >= 5 },
  { id: "beat", icon: "⚔️", name: "Schneller als die Konkurrenz", desc: "25 umkämpfte Aufträge geholt.", ok: () => extraStats().beat >= 25 },
  { id: "contract", icon: "📑", name: "Vertragstreu", desc: "Einen Rahmenvertrag erfüllt.", ok: () => extraStats().contracts >= 1 },
  { id: "mission", icon: "🧭", name: "Auftrag erfüllt", desc: "Eine Mission von Lina geschafft.", ok: () => extraStats().missions >= 1 },
  { id: "punct", icon: "⏰", name: "Uhrwerk", desc: "20 Zustellungen in Folge pünktlich.", ok: () => extraStats().best >= 20 },
  { id: "daily7", icon: "🎯", name: "Fleißig", desc: "Siebenmal alle Tagesaufgaben geschafft.", ok: () => extraStats().dailySets >= 7 },
  { id: "million", icon: "💰", name: "Millionär", desc: "Eine Million auf dem Konto.", ok: () => S.money >= 1e6 },
  { id: "tenmio", icon: "🏦", name: "Großspediteur", desc: "Zehn Millionen auf dem Konto.", ok: () => S.money >= 1e7 },
  { id: "office", icon: "🏢", name: "Eigene Adresse", desc: "Das erste Büro eröffnet.", ok: () => (S.bases || []).length >= 1 },
  { id: "stage3", icon: "🇩🇪", name: "Ganz Deutschland", desc: "Etappe 3 erreicht.", ok: () => S.stage >= 3 },
  { id: "stage6", icon: "🌍", name: "Die ganze Welt", desc: "Etappe 6 erreicht.", ok: () => S.stage >= 6 },
  { id: "green", icon: "🌱", name: "Klimaretter", desc: "Eine Tonne CO₂ mit dem Rad gespart.", ok: () => typeof co2State === "function" && co2State().bikeKm * CO2_VAN_KM >= 1000 },
  { id: "repair", icon: "🔧", name: "Gut gepflegt", desc: "Zehnmal in der Werkstatt.", ok: () => extraStats().repairs >= 10 },
  { id: "loan", icon: "🏦", name: "Schuldenfrei", desc: "Einen Kredit zurückgezahlt.", ok: () => extraStats().loans >= 1 },
  { id: "snus", icon: "🎩", name: "Geschäftspartner", desc: "Erste Dose für Mr. Snus verkauft.", ok: () => extraStats().snusSold >= 1 },
  /* v200: Jagd – aus hunt.js (HUNT.stats), nur wenn die Jagd geladen ist */
  { id: "hunt1", icon: "🦌", name: "Waidmannsheil", desc: "Die erste Trophäe gesichert.", ok: () => huntSt().kills >= 1 },
  { id: "huntgold", icon: "🥇", name: "Kapitales Stück", desc: "Eine Trophäe in Gold oder Diamant.", ok: () => huntSt().best >= 3 },
  { id: "huntrare", icon: "✦", name: "Seltener Anblick", desc: "Ein seltenes Stück erlegt.", ok: () => huntSt().rare >= 2 },
  { id: "huntdex", icon: "📖", name: "Gut dokumentiert", desc: "20 Merkmale im Jagdbuch eingetragen.", ok: () => huntSt().dex >= 20 },
  { id: "huntjobs", icon: "📋", name: "Rechte Hand des Försters", desc: "Zehn Jagdaufträge erfüllt.", ok: () => huntSt().jobs >= 10 }
];
function huntSt() { return typeof HUNT !== "undefined" && HUNT.stats && typeof S !== "undefined" && S.farm ? HUNT.stats() : { kills: 0, best: 0, rare: -1, dex: 0, jobs: 0 }; }
function checkAchievements() {
  S.ach = S.ach || {};
  const got = [];
  ACHS.forEach(a => {
    if (S.ach[a.id]) return;
    let ok = false; try { ok = a.ok(); } catch (_) { ok = false; }
    if (!ok) return;
    S.ach[a.id] = S.time;
    const r = roundK(100 * stageK(), 10);
    S.money += r; S.revenue += r; logMoney("bonus", "Erfolg: " + a.name, r);
    got.push({ a, r });
  });
  if (!got.length || !lively()) return;
  /* Alter Spielstand: mehrere auf einmal – eine Meldung statt einer Flut */
  if (got.length === 1) toast("🏆 Erfolg freigeschaltet: " + got[0].a.icon + " " + got[0].a.name + " · +" + money(got[0].r), "ok");
  else toast("🏆 " + got.length + " Erfolge freigeschaltet: " + got.map(g => g.a.icon).join(" ") + " · +" + money(got.reduce((x, g) => x + g.r, 0)) + " – unter 🎯 Ziele", "ok");
}

/* ============================ Ziele-Ansicht ============================ */
/* v420: Eigene Tagesaufgaben-Zeichnungen mit Logistika-Kontur und festen
   Farben. Nur Anzeige; Verkehrsmittel aus der gespeicherten Aufgabe lesen. */
const DAILY_TASK_ART = {
  n: `<path fill="#e5b56f" d="M9 20 31 10 55 20 33 31Z"/><path fill="#c58a47" d="M9 20 33 31V58L9 47Z"/><path fill="#efc988" d="M33 31 55 20V47L33 58Z"/>
    <path fill="#fff3d5" d="m20 15 24 11v12l-7 3V29L13 18Z"/><path fill="#fffaf0" d="m14 34 11 5v9l-11-5Z" stroke-width="1.8"/>`,
  bike: `<circle cx="15" cy="46" r="10" fill="#edf4f5"/><circle cx="49" cy="46" r="10" fill="#edf4f5"/>
    <path d="M15 46 26 28 36 46H15L32 34 49 46 42 23H36" stroke-width="4.6"/><path d="M15 46 26 28 36 46H15L32 34 49 46 42 23H36" stroke="#2fa85c" stroke-width="2.2"/>
    <path d="M23 27H31M5 32H23"/><rect x="5" y="12" width="17" height="17" rx="2" fill="#e5b56f"/><path d="M13 12V21" stroke="#fff3d5" stroke-width="4"/>`,
  jewel: `<path d="M25 19v-7h14v7" stroke-width="4"/><path fill="#1d6a8b" d="m48 22 8-4v31l-8 6Z"/><rect x="7" y="22" width="42" height="33" rx="5" fill="#2e8eb8"/>
    <path d="M13 29H43" stroke="#7cc9dd"/><path fill="#f6c445" d="m20 39 6-7h10l6 7-11 12Z"/><path d="m20 39 22 0m-16-7 5 19 5-19" stroke-width="1.5"/>`,
  rev: `<g transform="rotate(-8 28 28)"><rect x="6" y="12" width="44" height="30" rx="4" fill="#52ad78"/><path d="M12 18H44V36H12Z" stroke="#23764b" stroke-width="2"/><ellipse cx="28" cy="27" rx="7" ry="9" fill="#c4edd0"/></g>
    <circle cx="35" cy="48" r="10" fill="#dfaa2e"/><circle cx="50" cy="43" r="10" fill="#f6c445"/><path d="M35 43v10M50 38v10" stroke="#916a20"/><path d="M45 37q3-3 7-2" stroke="#fff0ab" stroke-width="2"/>`,
  punct: `<rect x="26" y="4" width="12" height="6" rx="2" fill="#7f929e"/><circle cx="31" cy="33" r="23" fill="#f6c445"/><circle cx="31" cy="33" r="18" fill="#fffaf0"/>
    <path d="M31 19v14l9 5M16 33h2M31 47v2M44 33h2"/><circle cx="31" cy="33" r="2" fill="#0d1b2a"/>
    <circle cx="49" cy="49" r="11" fill="#2fa85c"/><path d="m43 49 4 4 8-9" stroke="#fffaf0" stroke-width="3"/>`,
  kuehl: `<path fill="#a8dcec" d="m9 19 20-9 26 10-20 10Z"/><path fill="#3f98bf" d="m9 19 26 11v27L9 46Z"/><path fill="#6dbbd7" d="m35 30 20-10v27L35 57Z"/>
    <path d="M14 17 40 28v26" stroke="#e0f4f8" stroke-width="3"/><g stroke="#fffaf0" stroke-width="2.3"><path d="M24 30v18m-8-14 16 10m-16 0 16-10M21 32l3 2 3-2m-6 14 3-2 3 2"/></g>`,
  rail: `<path d="M5 54H59M9 60H59M13 52l4 9m13-9 4 9m13-9 4 9" stroke="#7f929e" stroke-width="2"/>
    <path fill="#2f6fed" d="M7 26h33l15 9v12H7Z"/><path fill="#ec7044" d="M29 13h13l13 17v17H29Z"/><path fill="#a8dcec" d="M34 18h6l9 12H34Z"/>
    <path fill="#79929e" d="M7 26h22v18H7Z"/><path d="M12 31h11m-11 6h11" stroke="#dce8eb" stroke-width="2"/><path d="M7 44H54" stroke="#f6c445" stroke-width="4"/>
    <circle cx="16" cy="49" r="4" fill="#0d1b2a"/><circle cx="29" cy="49" r="4" fill="#0d1b2a"/><circle cx="46" cy="49" r="4" fill="#0d1b2a"/><path d="m33 12 7-7 7 7M34 4H51" stroke-width="2"/>`,
  barge: `<path fill="#fffaf0" d="M7 22H22V39H7Z"/><path fill="#9fd4e7" d="M11 27h7v6h-7Z" stroke-width="1.7"/><path d="M5 21H23"/>
    <rect x="27" y="29" width="13" height="11" rx="1" fill="#ed9643"/><rect x="40" y="29" width="13" height="11" rx="1" fill="#f6c445"/>
    <path fill="#348d71" d="M5 39H59L50 53H14Z"/><path d="M10 44H51" stroke="#8dcbb0" stroke-width="2"/><path d="M7 58q5 3 10 0t10 0 10 0 10 0 10 0" stroke="#4ca7c6" stroke-width="2"/>`,
  ship: `<path fill="#fffaf0" d="M7 18H21V39H7Z"/><path d="M6 18H23M11 14v4"/><path d="M11 24h6m-6 6h6" stroke="#548aab" stroke-width="3"/>
    <rect x="25" y="21" width="13" height="11" fill="#ed9643"/><rect x="25" y="32" width="13" height="10" fill="#2fa85c"/><rect x="38" y="27" width="13" height="15" fill="#f6c445"/>
    <path fill="#2f6fed" d="M4 39h45l11-6-7 19H14Z"/><path d="M11 45H46" stroke="#a8dcec" stroke-width="2"/><path d="M7 58q5 3 10 0t10 0 10 0 10 0 10 0" stroke="#4ca7c6" stroke-width="2"/>`,
  air: `<path fill="#fffaf0" d="M29 10q3-8 6 0l1 16 22 13v6l-22-8v12l7 5v5l-11-4-11 4v-5l7-5V37L6 45v-6l22-13Z"/>
    <path fill="#90c6df" d="M28 27 6 39v6l22-8m8-10 22 12v6l-22-8"/><path d="M29 17h6M32 48v7" stroke="#467c9a"/><path d="M17 37v8m30-8v8" stroke-width="5"/>`
};
function dailyTaskIcon(t) {
  const key = t.id === "mode" ? ({ l: "rail", i: "barge", s: "ship", a: "air" }[t.m] || "n") : t.id;
  return `<svg class="daily-icon" data-goal-icon="${esc(key)}" viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="#0d1b2a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${DAILY_TASK_ART[key] || DAILY_TASK_ART.n}</svg>`;
}
let goalsTab = "today";
function openGoals() {
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  renderGoals();
}
function goalsOpen() { return $("#modal").classList.contains("open") && !!$("#modalBody .goals"); }
function renderGoals() {
  const d = dailyState(), ms = missionState();
  const bar = (a, b) => `<span class="gbar"><i style="width:${clamp(a / Math.max(1, b) * 100, 0, 100)}%"></i></span>`;
  let body = "";
  if (goalsTab === "today") {
    const T = t => TASKS.find(x => x.id === t.id);
    body = (typeof luckyShelfHTML === "function" ? luckyShelfHTML() : "")
      + `<div class="gsub">Jeden Morgen neu · je ${money(dailyReward())} · alle drei: +${money(dailyReward() * 2)} + 🎁 Luckybox</div>`
      + (d.tasks.length ? d.tasks.map(t => `<div class="gtask${t.done ? " done" : ""}">
          <span class="gi daily-gi">${dailyTaskIcon(t)}</span>
          <div class="gt"><b>${esc(T(t).label(t))}</b>${bar(Math.min(t.got, t.n), t.n)}
            <small>${T(t).money ? money(Math.min(t.got, t.n)) + " von " + money(t.n) : Math.min(t.got, t.n) + " von " + t.n}</small></div>
          <span class="gok">${t.done ? "✔" : ""}</span></div>`).join("")
        : `<div class="empty">Die ersten Aufgaben gibt es morgen früh.</div>`);
  } else if (goalsTab === "missions") {
    const a = ms.active;
    body = (a ? `<div class="gtask mission"><span class="gi">${a.icon}</span><div class="gt"><b>${esc(a.title)}</b>${bar(a.got, a.need)}
        <small>${a.got} von ${a.need} · bis ${stamp(a.until)} · Belohnung ${money(a.rew)}</small></div></div>`
      : `<div class="empty sm">Gerade keine Mission – Lina meldet sich.</div>`)
      + `<div class="sechead sm">Rahmenverträge</div>`
      + (activeContracts().length ? activeContracts().map(c => `<div class="gtask"><span class="gi">📑</span>
        <div class="gt"><b>${esc(c.client)}</b>${bar(c.done, c.per * c.days)}
        <small>${c.per}× täglich ${esc(N[c.from].short)} → ${esc(N[c.to].short)} · ${c.done} erledigt, ${c.missed} ausgefallen · ${S.time < c.start ? "startet " + stamp(c.start) : "Tag " + c.day + " von " + c.days}</small></div></div>`).join("")
        : `<div class="empty sm">Keine Verträge – Angebote kommen ab Level 4.</div>`);
  } else {
    const got = ACHS.filter(a => S.ach && S.ach[a.id]).length;
    body = `<div class="gsub">${got} von ${ACHS.length} freigeschaltet</div><div class="achs">` + ACHS.map(a => {
      const on = S.ach && S.ach[a.id];
      return `<div class="ach${on ? " on" : ""}"><span>${on ? a.icon : "🔒"}</span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div>`;
    }).join("") + `</div>`;
  }
  $("#modalBody").innerHTML = `<div class="goals">
    <div class="mhead"><div><div class="mtitle">🎯 Ziele</div><div class="msub">Tagesaufgaben, Missionen und Erfolge</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button></div>
    <div class="seg gtabs">
      <button data-gtab="today" class="${goalsTab === "today" ? "on" : ""}"><i>🎯</i>Heute</button>
      <button data-gtab="missions" class="${goalsTab === "missions" ? "on" : ""}"><i>🧭</i>Missionen</button>
      <button data-gtab="ach" class="${goalsTab === "ach" ? "on" : ""}"><i>🏆</i>Erfolge</button>
    </div>
    <div class="glist">${body}</div>
    <div class="mbtns"><button class="btn ghost" id="mCancel">Schließen</button></div>
  </div>`;
  $("#mClose").onclick = closeModal; $("#mCancel").onclick = closeModal;
  $$("#modalBody [data-gtab]").forEach(b => b.onclick = () => { goalsTab = b.dataset.gtab; renderGoals(); });
  const lo = $("#lkOpen"); if (lo) lo.onclick = () => openLucky();
}
function renderGoalsChip() {
  const el = document.getElementById("goalsCount"); if (!el) return;
  const d = dailyState();
  const open = d.tasks.filter(t => !t.done).length;
  const boxes = S.lucky ? S.lucky.boxes.length + (S.lucky.pending ? 1 : 0) : 0;      /* v270: unterbrochene Öffnung zählt mit */
  el.textContent = boxes ? "🎁" + boxes : d.tasks.length ? (d.tasks.length - open) + "/" + d.tasks.length : "–";
  el.classList.toggle("all", d.tasks.length > 0 && !open && !boxes);
  el.classList.toggle("gift", boxes > 0);
}
