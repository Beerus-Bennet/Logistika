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
    return t.mode === l.mode && canCarry(t, o.cargo, o.weight, l.maxHop);
  })));
}
function contractOffer() {
  let tpl = null;
  for (let i = 0; i < 30 && !tpl; i++) {
    const o = makeOrder();
    if (o && !o.air && CARGO[o.cargo].minStage <= S.stage && o.pay > 0 && fleetCanDo(o)) tpl = o;
  }
  if (!tpl) return null;
  const days = Math.round(rnd(5, 9) + S.stage * 1.5), per = Math.random() < 0.5 ? 1 : Math.random() < 0.7 ? 2 : 3;
  const pay = Math.round(tpl.pay * rnd(1.2, 1.35) / 5) * 5;
  return { id: "V" + (S.seq++), client: tpl.shipper, desc: tpl.desc, cargo: tpl.cargo, from: tpl.from, to: tpl.to,
    weight: tpl.weight, pick: tpl.pick, drop: tpl.drop, per, days, pay, penalty: Math.round(pay * 0.6),
    day: 0, done: 0, missed: 0, pending: [], over: false, refTime: tpl.refTime, refDist: tpl.refDist };
}
function offerContract() {
  const c = contractOffer(); if (!c) return;
  const total = c.per * c.days * c.pay;
  decisionMsg({ from: c.client, kind: "contract", icon: "📑", type: "contract", title: "Angebot: Rahmenvertrag über " + c.days + " Tage",
    body: `Täglich ${c.per}× ${CARGO[c.cargo].name} (${kgf(c.weight)}) von ${N[c.from].short} nach ${N[c.to].short}, je ${money(c.pay)} – `
      + `zusammen ${money(total)}. Pro ausgefallener Fahrt ${money(c.penalty)} Vertragsstrafe. Wer mindestens 90 % schafft, bekommt 15 % Bonus.`,
    choices: [{ label: "Vertrag unterschreiben", sub: "ab morgen früh läuft er" }, { label: "Ablehnen" }], def: 1, wait: 240,
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
function contractOrder(c) {
  const o = { id: "A" + (S.seq++), from: c.from, to: c.to, cargo: c.cargo, weight: c.weight, pay: c.pay,
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
        phoneMsg({ from: c.client, kind: "good", title: "Rahmenvertrag erfüllt", body: `${c.done} von ${n} Fahrten pünktlich erledigt. Vielen Dank – als Anerkennung überweisen wir ${money(bonus)} Bonus.` });
      } else {
        repAdd(regionOf(c), -5);
        phoneMsg({ from: c.client, kind: "info", title: "Vertrag beendet", body: `${c.missed} von ${n} Fahrten sind ausgefallen. Einen Anschlussvertrag wird es so nicht geben.` });
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
    text: "Chef, die Paketlager platzen. Schaffst du in 24 Stunden {n} Paket- oder Expressaufträge?", rew: 900 },
  { id: "gruen", st: 1, title: "Grüne Woche", icon: "🚲", hours: 24, need: 8, test: (j) => j.legs.every(l => l.mode === "b"),
    text: "Die Stadt feiert die Verkehrswende. Wer in 24 Stunden {n} Lieferungen komplett per Rad fährt, bekommt eine Prämie vom Senat.", rew: 700, needBike: true },
  { id: "kuehl", st: 1, title: "Kühlkette", icon: "🧊", hours: 36, need: 5, test: (j) => j.order.cargo === "kuehl",
    text: "Hitzewelle! Die Supermärkte brauchen Nachschub. {n} Kühltransporte in 36 Stunden?", rew: 1100, needFlag: "kuehl" },
  { id: "hochwasser", st: 2, title: "Hochwasserhilfe Dresden", icon: "🌊", hours: 36, spawn: { to: "dresden", cargo: "pal", n: 3, kg: [3000, 6000], desc: "Sandsäcke und Pumpen für die Deiche" },
    text: "Die Elbe steigt. Das THW bittet um drei Transporte mit Sandsäcken und Pumpen nach Dresden – innerhalb von 36 Stunden.", rew: 4200 },
  { id: "messe", st: 3, title: "Messe-Marathon Hannover", icon: "🏛️", hours: 48, spawn: { to: "hannover", cargo: "pal", n: 4, kg: [1500, 5000], desc: "Messestand und Exponate" },
    text: "Vier Aussteller haben ihre Spedition verloren. Bringst du ihre Stände rechtzeitig nach Hannover?", rew: 12000 },
  { id: "hafen", st: 4, title: "Rekordwoche im Hafen", icon: "⚓", hours: 72, need: 3, test: (j) => j.legs.some(l => l.mode === "s" || l.mode === "i"),
    text: "Der Hafen will einen Umschlagrekord. {n} Aufträge mit Schiff in drei Tagen?", rew: 60000, needMode: "is" },
  { id: "luft", st: 4, title: "Luftbrücke", icon: "✈️", hours: 48, need: 3, test: (j) => j.legs.some(l => l.mode === "a"),
    text: "Eine Hilfsorganisation braucht dringend Kapazität in der Luft: {n} Luftfrachtaufträge in 48 Stunden.", rew: 80000, needMode: "a" }
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
  const pool = MISSIONS.filter(missionFits);
  if (!pool.length) return;
  const mi = pick(pool), n = missionNeed(mi);
  const rew = Math.round(mi.rew * stageK() / (mi.st >= 4 ? 18 : mi.st >= 3 ? 6 : mi.st >= 2 ? 2.5 : 1) / 10) * 10;
  decisionMsg({ from: "Lina Sturm", kind: "mission", icon: mi.icon, type: "mission", title: "Mission: " + mi.title,
    body: mi.text.replace("{n}", n) + ` Belohnung: ${money(rew)} und ein besserer Ruf.`,
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
        const o = { id: "A" + (S.seq++), from: f.id, to: mi.spawn.to, cargo: mi.spawn.cargo, weight: w, pay: Math.round(pr.pay * 1.2),
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
    S.xp += 60 + S.stage * 20; repAdd(S.stage, 6); extraStats().missions++;
    missionState().done.push(a.id); missionState().active = null;
    toast(a.icon + " Mission „" + a.title + "“ geschafft: +" + money(a.rew), "ok");
    phoneMsg({ from: "Lina Sturm", kind: "good", title: "Mission geschafft!", body: "Stark, Chef – „" + a.title + "“ erledigt. " + money(a.rew) + " sind gutgeschrieben." });
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
  { id: "jewel", icon: "💎", ok: () => S.fleet.some(f => vType(f.type).flags.includes("kurier")), make: () => ({ n: 2 }), label: t => `${t.n} Wertkurier-Fahrten`, on: "jewel" },
  { id: "norepo", icon: "✅", make: () => ({ n: 3 }), label: t => `${t.n} Aufträge ohne Leerfahrt`, on: "norepo" },
  { id: "rev", icon: "💶", make: () => ({ n: roundK(Math.max(600 * stageK(), (S.revY || 0) * 1.15), 50) }), label: t => `${money(t.n)} Frachterlös an einem Tag`, on: "rev", money: true },
  { id: "mode", icon: "🚢", ok: () => S.fleet.some(f => "isla".includes(vType(f.type).mode)), make: () => {
      const m = pick([...new Set(S.fleet.map(f => vType(f.type).mode).filter(x => "isla".includes(x)))]);
      return { n: 1, m };
    }, label: t => `Ein Auftrag per ${MODE_INFO[t.m].name}`, on: "mode" },
  { id: "punct", icon: "⏰", make: () => ({ n: 4 }), label: t => `${t.n} Zustellungen in Folge pünktlich`, on: "punct" },
  { id: "kuehl", icon: "🧊", ok: () => S.fleet.some(f => vType(f.type).flags.includes("kuehl")), make: () => ({ n: 2 }), label: t => `${t.n} Kühltransporte`, on: "kuehl" }
];
function dailyState() { if (!S.daily) S.daily = { day: -1, tasks: [], rev: 0, streak: 0, claimed: false }; return S.daily; }
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
  if ((job.repo0 || 0) < 0.5) inc("norepo");
  inc("rev", d.rev);
  d.tasks.forEach(t => { if (t.id === "mode" && !t.done && job.legs.some(l => l.mode === t.m)) t.got++; });
  inc("punct", d.streak);
  if (o.cargo === "kuehl") inc("kuehl");
  d.tasks.forEach(t => {
    if (!t.done && t.got >= t.n) {
      t.done = true;
      const r = dailyReward();
      S.money += r; S.revenue += r; S.xp += 25; logMoney("bonus", "Tagesaufgabe: " + TASKS.find(x => x.id === t.id).label(t), r);
      toast("🎯 Tagesaufgabe geschafft: " + TASKS.find(x => x.id === t.id).label(t) + " · +" + money(r), "ok");
    }
  });
  if (!d.claimed && d.tasks.length && d.tasks.every(t => t.done)) {
    d.claimed = true;
    const r = dailyReward() * 2;
    S.money += r; S.revenue += r; S.xp += 50; extraStats().dailySets++;
    logMoney("bonus", "Alle Tagesaufgaben", r);
    toast("🏆 Alle drei Tagesaufgaben! Bonus +" + money(r), "ok");
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
function goalsDay() {
  newDaily();
  if (typeof shareDay === "function") shareDay();
  if (!lively()) return;
  if (level() >= 4 && activeContracts().length < (S.stage >= 4 ? 3 : 2) && S.time >= (S.contractNext || 0)
      && !pendingDecisions().some(m => m.dec.type === "contract")) {
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
  { id: "snus", icon: "🎩", name: "Geschäftspartner", desc: "Erste Dose für Mr. Snus verkauft.", ok: () => extraStats().snusSold >= 1 }
];
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
    body = `<div class="gsub">Neue Aufgaben jeden Morgen · je ${money(dailyReward())}, alle drei zusammen +${money(dailyReward() * 2)}</div>`
      + (d.tasks.length ? d.tasks.map(t => `<div class="gtask${t.done ? " done" : ""}">
          <span class="gi">${T(t).icon}</span>
          <div class="gt"><b>${esc(T(t).label(t))}</b>${bar(Math.min(t.got, t.n), t.n)}
            <small>${T(t).money ? money(Math.min(t.got, t.n)) + " von " + money(t.n) : Math.min(t.got, t.n) + " von " + t.n}</small></div>
          <span class="gok">${t.done ? "✔" : ""}</span></div>`).join("")
        : `<div class="empty">Die ersten Aufgaben gibt es morgen früh.</div>`);
  } else if (goalsTab === "missions") {
    const a = ms.active;
    body = (a ? `<div class="gtask mission"><span class="gi">${a.icon}</span><div class="gt"><b>${esc(a.title)}</b>${bar(a.got, a.need)}
        <small>${a.got} von ${a.need} · bis ${stamp(a.until)} · Belohnung ${money(a.rew)}</small></div></div>`
      : `<div class="empty sm">Gerade keine Mission. Lina meldet sich, wenn es etwas gibt.</div>`)
      + `<div class="sechead sm">Rahmenverträge</div>`
      + (activeContracts().length ? activeContracts().map(c => `<div class="gtask"><span class="gi">📑</span>
        <div class="gt"><b>${esc(c.client)}</b>${bar(c.done, c.per * c.days)}
        <small>${c.per}× täglich ${esc(N[c.from].short)} → ${esc(N[c.to].short)} · ${c.done} erledigt, ${c.missed} ausgefallen · ${S.time < c.start ? "startet " + stamp(c.start) : "Tag " + c.day + " von " + c.days}</small></div></div>`).join("")
        : `<div class="empty sm">Keine laufenden Verträge. Ab Level 4 bieten Großkunden welche an.</div>`);
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
}
function renderGoalsChip() {
  const el = document.getElementById("goalsCount"); if (!el) return;
  const d = dailyState();
  const open = d.tasks.filter(t => !t.done).length;
  el.textContent = d.tasks.length ? (d.tasks.length - open) + "/" + d.tasks.length : "–";
  el.classList.toggle("all", d.tasks.length > 0 && !open);
}
