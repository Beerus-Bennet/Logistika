/* =========================================================================
   LOGISTIKA – Störungen, Pannen und die Streife

   Störungen liegen sichtbar auf der Karte (Stau, Sturm, Hafenstreik) oder
   betreffen einen ganzen Verkehrsträger (Lokführerstreik, Niedrigwasser).
   Sind eigene Fahrten betroffen, klingelt das Diensttelefon mit Auswahl.
   Pannen hängen am Verschleiß; der Fahrer ruft an und fragt, was er tun soll.
   ========================================================================= */
"use strict";

const ROADS = {
  1: ["auf der A100 am Dreieck Funkturm", "auf der A100 bei Neukölln", "auf der A113 Richtung Schönefeld", "auf der B96 in Tempelhof",
      "am Kaiserdamm", "auf der Frankfurter Allee", "auf der Stadtautobahn am Innsbrucker Platz", "am Alexanderplatz"],
  2: ["auf dem Berliner Ring (A10) bei Potsdam", "auf der A9 bei Dessau", "auf der A2 bei Magdeburg", "auf der A13 Richtung Dresden", "auf der A14 bei Halle"],
  3: ["auf der A7 an den Kasseler Bergen", "auf der A1 bei Bremen", "auf der A3 am Kölner Ring", "auf der A8 am Albaufstieg", "auf der A2 im Ruhrgebiet"],
  4: ["auf dem Brenner", "am Gotthard-Tunnel", "auf dem Périphérique", "auf der M25 vor London", "an der Grenze in Frankfurt (Oder)"],
  5: ["am Grenzübergang Małaszewicze", "auf dem Ring von Moskau", "vor dem Hafen Shanghai"],
  6: ["an der Grenze bei Tijuana", "auf der Autobahn vor Lagos", "am Stadtrand von Nairobi"]
};
const EVENT_DEF = {
  stau:     { mode: "r", icon: "🚧", area: true, dur: [90, 260], factor: 0.35, minStage: 1, w: 5 },
  sturm:    { mode: "a", icon: "🌪️", hub: "air", area: true, dur: [180, 540], factor: 0, minStage: 1, w: 2 },
  sturmsee: { mode: "s", icon: "🌊", hub: "port", area: true, dur: [300, 900], factor: 0, minStage: 4, w: 2 },
  hafen:    { mode: "si", icon: "✊", hub: "port", area: true, dur: [720, 2160], factor: 1, hold: true, minStage: 2, w: 1.5 },
  streik:   { mode: "l", icon: "🚆", global: true, dur: [480, 1800], factor: 0, minStage: 3, w: 1.5 },
  wasser:   { mode: "i", icon: "🏜️", global: true, dur: [1440, 4320], factor: 0.55, minStage: 2, w: 1.5 }
};
function evState() { if (!S.events) S.events = []; return S.events; }
function evActive() { return evState().filter(e => S.time < e.until); }
function evRadiusKm(e) { return e.type === "stau" ? [4, 14, 28, 45, 60, 60][Math.min(6, S.stage) - 1] : 45; }
function evTitle(e) {
  switch (e.type) {
    case "stau": return "Stau " + e.road;
    case "sturm": return "Sturm am " + N[e.node].name + " – Flugbetrieb eingestellt";
    case "sturmsee": return "Orkan vor " + N[e.node].name + " – Schiffe bleiben im Hafen";
    case "hafen": return "Streik im " + N[e.node].name + " – kein Umschlag";
    case "streik": return "Lokführerstreik – Güterzüge stehen";
    case "wasser": return "Niedrigwasser – Binnenschiffe nur mit halber Kraft";
  }
  return "Störung";
}
function evCenter(e) { return e.node ? nodePt(e.node) : e.at; }
function evHits(e, veh) {
  const d = EVENT_DEF[e.type], t = vType(veh.type);
  if (!d.mode.includes(t.mode)) return false;
  if (d.global) return true;
  const p = vehPoint(veh);
  return !!p && hav(p, evCenter(e)) <= evRadiusKm(e);
}
/* Fahrtempo: Faktor der stärksten Störung, die das Fahrzeug gerade trifft */
function eventFactor(veh) {
  let f = 1;
  for (const e of evActive()) {
    const d = EVENT_DEF[e.type];
    if (d.hold || !evHits(e, veh)) continue;
    let k = d.factor;
    if (e.type === "stau" && e.detour && e.detour.includes(veh.uid)) k = 0.8;
    f = Math.min(f, k);
  }
  return f;
}
/* Umschlag steht: Sturm am Flughafen, Hafenstreik */
function hubHold(veh, leg) {
  const t = vType(veh.type);
  const at = veh.phase === "load" ? leg.from : leg.to;
  return evActive().some(e => {
    const d = EVENT_DEF[e.type];
    return d.hub && d.mode.includes(t.mode) && e.node === at;
  });
}
function evAffectedJobs(e) {
  const out = [];
  S.jobs.forEach(j => {
    const f = S.fleet.find(x => x.uid === (j.legs[j.curLeg] || {}).veh);
    if (!f) return;
    const leg = j.legs[j.curLeg], d = EVENT_DEF[e.type], t = vType(f.type);
    const nodeHit = d.hub && d.mode.includes(t.mode) && (leg.from === e.node || leg.to === e.node);
    if (evHits(e, f) || nodeHit || (d.global && d.mode.includes(leg.mode))) out.push({ j, f });
  });
  return out;
}

function spawnEvent() {
  const modes = unlockedModes();
  const used = new Set(S.fleet.map(f => vType(f.type).mode));
  const pool = Object.entries(EVENT_DEF).filter(([k, d]) => S.stage >= d.minStage
    && [...d.mode].some(m => modes.includes(m) && used.has(m))
    && !evActive().some(e => e.type === k && (d.global || k !== "stau")));
  if (!pool.length) return null;
  const tot = pool.reduce((a, [, d]) => a + d.w, 0);
  let r = Math.random() * tot, type = pool[0][0];
  for (const [k, d] of pool) { r -= d.w; if (r <= 0) { type = k; break; } }
  const d = EVENT_DEF[type];
  const e = { id: "E" + (S.seq++), type, from: S.time, until: S.time + Math.round(rnd(d.dur[0], d.dur[1])) };
  if (type === "stau") {
    /* Am liebsten dort, wo gerade eigene Fahrzeuge auf der Straße sind */
    const road = S.fleet.filter(f => (f.phase === "haul" || f.phase === "repo") && vType(f.type).mode === "r");
    const f = road.length && Math.random() < 0.7 ? pick(road) : null;
    const base = f ? vehPoint(f) : nodePt(pick(unlockedNodes().filter(n => n.modes.includes("r"))).id);
    e.at = [base[0] + rnd(-0.02, 0.02), base[1] + rnd(-0.03, 0.03)];
    e.road = pick(ROADS[Math.min(6, S.stage)] || ROADS[1]);
    e.detour = [];
  } else if (d.hub) {
    const kind = d.hub === "air" ? "air" : "port";
    const busy = new Set();
    S.jobs.forEach(j => j.legs.forEach(l => { if (!l.done && d.mode.includes(l.mode)) { busy.add(l.from); busy.add(l.to); } }));
    const nodes = unlockedNodes().filter(n => n.type === kind && [...d.mode].some(m => n.modes.includes(m)));
    if (!nodes.length) return null;
    const hot = nodes.filter(n => busy.has(n.id));
    e.node = (hot.length && Math.random() < 0.7 ? pick(hot) : pick(nodes)).id;
  }
  evState().push(e);
  evNotify(e);
  return e;
}
function evNotify(e) {
  const hit = evAffectedJobs(e);
  const title = evTitle(e);
  if (!hit.length) { toast(EVENT_DEF[e.type].icon + " " + title + " – bis " + clock(e.until) + ".", "warn", true); return; }
  const who = hit.slice(0, 3).map(x => vType(x.f.type).name).join(", ") + (hit.length > 3 ? " …" : "");
  const extra = Math.round((e.until - S.time) * (e.type === "stau" ? 0.5 : 0.8));
  const choices = [];
  if (e.type === "stau") {
    const km = hit.reduce((a, x) => a + Math.max(0, (x.f.routeDist || 0) - (x.f.pos || 0)), 0);
    choices.push({ label: "Umfahren lassen", sub: "kaum Verzug, aber ein Viertel mehr Kilometer", cost: Math.round(km * 0.25 * hit.reduce((a, x) => a + costKmOf(vType(x.f.type)), 0) / hit.length) + 5 });
  }
  choices.push({ label: "Abwarten", sub: "kostet nichts, aber Zeit – Fristen können reißen" });
  choices.push({ label: "Kunden um Aufschub bitten", sub: "Frist +" + dur(extra) + ", dafür 8 % Nachlass" });
  decisionMsg({ from: "Verkehrsleitstelle", icon: EVENT_DEF[e.type].icon, type: "event", title,
    body: `Betroffen: ${who}. Die Störung dauert voraussichtlich bis ${clock(e.until)}.`,
    choices, def: e.type === "stau" ? 1 : 0, wait: 45, ctx: { ev: e.id, jobs: hit.map(x => x.j.id), extra } });
}
DECISIONS.event = {
  choose(m, idx, cost) {
    const e = evState().find(x => x.id === m.dec.ctx.ev);
    const c = m.dec.choices[idx];
    const jobs = m.dec.ctx.jobs.map(id => S.jobs.find(j => j.id === id)).filter(Boolean);
    if (c.label.startsWith("Umfahren") && e) {
      payOut(cost, "drive", "Umleitung · " + evTitle(e));
      jobs.forEach(j => { const u = j.legs[j.curLeg] && j.legs[j.curLeg].veh; if (u) e.detour.push(u); });
      return "Fahrer nehmen die Umleitung (" + money(cost) + ").";
    }
    if (c.label.startsWith("Kunden")) {
      jobs.forEach(j => { j.order.deadline += m.dec.ctx.extra; j.order.pay = Math.round(j.order.pay * 0.92); });
      return "Kunden sind einverstanden: Frist verlängert, 8 % Nachlass.";
    }
    return "Wir warten ab.";
  }
};

/* ------------------------------ Pannen -------------------------------- */
function nearName(p) {
  let best = null, bd = Infinity;
  unlockedNodes().forEach(n => { const d = hav(p, [n.lat, n.lon]); if (d < bd) { bd = d; best = n; } });
  return best ? best.short : "unterwegs";
}
/* Was genau kaputt ist, hängt am Verkehrsträger. Die Kosten richten sich nach
   Fahrzeugwert, Auftragswert und Etappe – ein liegengebliebener Frachter
   kostet etwas anderes als ein platter Reifen am Lastenrad. */
function incidentFor(t, veh, job) {
  const K = stageK(), p = t.price, pay = job.order.pay;
  const r = x => roundK(x, x >= 1e6 ? 10000 : x >= 1e5 ? 1000 : x >= 1e4 ? 100 : 10);
  if (t.mode === "b") return { icon: "🔧", title: "Panne", halt: "Panne", def: 0, who: "Kurier", choices: [
    { label: "Selbst flicken", sub: "gratis, etwa eine halbe Stunde", act: { mins: [20, 40], txt: "Schlauch geflickt." } },
    { label: "Zur Fahrradwerkstatt", sub: "sicher, eine Stunde", cost: Math.round(35 * K), insurable: true, act: { mins: [60, 60], wear: 30, txt: "Ab in die Werkstatt um die Ecke." } }] };
  if (t.mode === "r") {
    const acc = Math.random() < 0.18, big = t.cap >= 7000 && Math.random() < 0.5;
    return { icon: acc ? "💥" : "🔧", title: acc ? "Unfall" : big ? "Motorschaden" : "Panne", halt: acc ? "Unfall" : "Panne", def: 2, who: "Fahrer",
      damaged: acc, cut: 0.25, lead: acc ? "Blechschaden, niemand verletzt – aber die Ladung hat was abbekommen. " : big ? "Der Motor hat Öldruck verloren, ich hab sofort abgestellt. " : "",
      choices: [
        { label: "Pannendienst rufen", sub: "meist nach 1 h weiter, sonst Abschleppen", cost: r(Math.max(120 * K + p * 0.004, pay * 0.06)), insurable: true,
          act: { mins: [45, 90], ok: 0.75, fail: [150, 240], failWear: 25, txt: "Der Pannendienst hat's gerichtet.", failTxt: "Pannendienst konnte nicht helfen – abgeschleppt." } },
        { label: "Abschleppen & Werkstatt", sub: "3–5 h, danach wie neu", cost: r(Math.max(380 * K + p * 0.025, pay * 0.15)), insurable: true,
          act: { mins: [180, 300], wear: 35, txt: "Abgeschleppt und repariert." } },
        { label: "Fahrer versucht es selbst", sub: "gratis – halbe Stunde oder halber Tag",
          act: { mins: [25, 45], ok: 0.5, fail: [200, 360], txt: "Der Fahrer hat es selbst hinbekommen.", failTxt: "Hat länger gedauert – aber es läuft wieder." } }] };
  }
  if (t.mode === "a") {
    const v = pick([
      ["Triebwerksschaden", "Beim Steigflug ist Triebwerk 2 ausgefallen, wir sind sicher wieder unten. Die Maschine ist AOG – Aircraft on Ground. "],
      ["Vogelschlag", "Ein Vogelschwarm beim Start, das linke Triebwerk hat Schaufelschäden. Ohne Boroskop-Inspektion darf sie nicht wieder hoch. "],
      ["Hydraulikleck", "Hydrauliksystem B verliert Druck, wir bleiben am Boden. Das Fahrwerk lässt sich so nicht sicher einfahren. "]]);
    return { icon: "✈️", title: v[0], halt: v[0], lead: v[1], def: 2, wait: 120, who: "Kapitän", choices: [
      { label: "AOG-Team und Ersatzteil einfliegen", sub: "6–12 h, danach wie neu", cost: r(Math.max(900 * K + p * 0.004, pay * 0.3)), insurable: true,
        act: { mins: [360, 720], wear: 35, txt: "Das AOG-Team hat die Maschine wieder flottgemacht." } },
      { label: "Fracht per Charter weiterfliegen", sub: "in 2–4 h geht's weiter – teuer, nicht versichert", cost: r(Math.max(pay * 0.75, p * 0.003)),
        act: { mins: [120, 240], txt: "Die Fracht fliegt mit einer gecharterten Maschine weiter." } },
      { label: "Auf das Ersatzteil warten", sub: "gratis, aber 30–60 h am Boden", act: { mins: [1800, 3600], wear: 20, txt: "Wir warten aufs Ersatzteil." } }] };
  }
  if (t.mode === "s") {
    const v = pick([
      ["Maschinenschaden auf See", "Die Hauptmaschine ist ausgefallen, wir treiben mit Notstrom. "],
      ["Ruderanlage ausgefallen", "Die Ruderanlage reagiert nicht mehr, wir halten nur mit dem Bugstrahlruder Kurs. "],
      ["Brand im Maschinenraum", "Ein Feuer im Maschinenraum ist gelöscht, niemand verletzt – aber ein Hilfsdiesel ist hinüber. "]]);
    return { icon: "🚢", title: v[0], halt: v[0], lead: v[1], def: 2, wait: 120, who: "Kapitänin", choices: [
      { label: "Hochseeschlepper ordern", sub: "zieht uns in den nächsten Hafen, 18–30 h, dort repariert", cost: r(Math.max(2000 * K + p * 0.005, pay * 0.4)), insurable: true,
        act: { mins: [1080, 1800], wear: 25, txt: "Der Schlepper ist längsseits – ab in den Hafen." } },
      { label: "Techniker per Hubschrauber", sub: "8–14 h, klappt meistens", cost: r(Math.max(700 * K + p * 0.0015, pay * 0.15)), insurable: true,
        act: { mins: [480, 840], ok: 0.75, fail: [1440, 2160], wear: 15, txt: "Die Techniker haben die Maschine wieder zum Laufen gebracht.", failTxt: "Die Techniker brauchen ein Teil vom Festland – das dauert." } },
      { label: "Mit halber Kraft weiter", sub: "gratis, aber bis zum Ziel nur halbe Geschwindigkeit", act: { mins: [30, 60], limp: 0.5, txt: "Wir laufen mit halber Kraft weiter." } }] };
  }
  if (t.mode === "i") {
    const v = pick([["Ruderschaden", "Das Ruder klemmt, wir liegen an der Spundwand fest. "],
      ["Grundberührung", "Bei dem Pegel haben wir Grund berührt – Leck ist dicht, aber die Schraube hat was abbekommen. "]]);
    return { icon: "⛴️", title: v[0], halt: v[0], lead: v[1], def: 2, wait: 100, who: "Schiffsführer", choices: [
      { label: "Schlepper anfordern", sub: "6–10 h bis zur Werft, dort repariert", cost: r(Math.max(300 * K + p * 0.01, pay * 0.25)), insurable: true,
        act: { mins: [360, 600], wear: 25, txt: "Der Schlepper bringt uns zur Werft." } },
      { label: "Ladung auf ein Leichterschiff umladen", sub: "4–8 h, dann geht die Fracht weiter", cost: r(Math.max(200 * K + p * 0.006, pay * 0.15)),
        act: { mins: [240, 480], txt: "Umgeladen – es geht weiter." } },
      { label: "Mit halber Kraft weiter", sub: "gratis, aber bis zum Ziel nur halbe Geschwindigkeit", act: { mins: [20, 40], limp: 0.5, txt: "Wir tuckern mit halber Kraft weiter." } }] };
  }
  /* Bahn */
  const v = pick([["Lokschaden", "Die Lok meldet einen Stromrichterfehler und bleibt stehen. "],
    ["Heißläufer", "Ein Achslager am 14. Wagen ist heißgelaufen – der Wagen muss raus. "],
    ["Kupplung gerissen", "Mitten auf der Strecke ist eine Kupplung gerissen, der Zug steht in zwei Teilen. "]]);
  return { icon: "🚆", title: v[0], halt: v[0], lead: v[1], def: 2, wait: 100, who: "Lokführer", choices: [
    { label: "Ersatzlok anmieten", sub: "3–6 h, dann weiter", cost: r(Math.max(500 * K + p * 0.008, pay * 0.2)), insurable: true,
      act: { mins: [180, 360], wear: 20, txt: "Die Ersatzlok ist angekuppelt." } },
    { label: "Diesellok schleppt in den nächsten Bahnhof", sub: "6–10 h, dort repariert", cost: r(Math.max(250 * K + p * 0.004, pay * 0.1)), insurable: true,
      act: { mins: [360, 600], wear: 30, txt: "Abgeschleppt und repariert." } },
    { label: "Auf die Werkstattlok warten", sub: "gratis, aber 16–30 h Stillstand", act: { mins: [960, 1800], wear: 10, txt: "Wir warten auf die Werkstattlok." } }] };
}
function breakdown(veh, job, leg) {
  const t = vType(veh.type), sc = incidentFor(t, veh, job);
  const p = vehPoint(veh), where = nearName(p);
  const drv = typeof driverOf === "function" ? driverOf(veh.uid) : null;
  veh.halt = { icon: sc.icon, label: sc.halt + " bei " + where, until: WAIT_DECISION };
  if (sc.damaged) { job.order.damaged = true; job.order.damageCut = sc.cut || 0.25; }
  /* Pausen zwischen solchen Vorfällen – die Flotte soll nicht dauernd stehen */
  S.nextBreak = S.time + Math.round(rnd(S.stage >= 4 ? 2.5 : 1.5, S.stage >= 4 ? 4.5 : 3) * 1440);
  veh.lastBreak = S.time;
  decisionMsg({ from: drv ? drv.name : sc.who + " · " + t.name, icon: sc.icon, type: "breakdown", ring: true,
    title: sc.title + " bei " + where,
    body: (sc.lead || "") + `${t.name} steht mit der Ladung für „${job.order.shipper}“. Frist: ${stamp(job.order.deadline)}. Was soll ich machen?`
      + (sc.damaged && !isInsured() ? " Ohne Versicherung zieht der Kunde 25 % ab." : ""),
    choices: sc.choices, def: sc.def, wait: sc.wait || 90, ctx: { uid: veh.uid, job: job.id, acc: !!sc.damaged } });
}
DECISIONS.breakdown = {
  choose(m, idx, cost) {
    const v = S.fleet.find(f => f.uid === m.dec.ctx.uid);
    if (!v || !v.halt) return "Hat sich erledigt.";
    const t = vType(v.type), c = m.dec.choices[idx], a = c.act;
    if (cost) payOut(cost, "repair", c.label + " · " + t.name);
    let mins, txt;
    if (a) {
      const ok = a.ok == null || Math.random() < a.ok;
      const span = ok ? a.mins : a.fail;
      mins = rnd(span[0], span[1]);
      if (a.wear) v.wear = Math.max(0, wearOf(v) - a.wear);
      if (!ok && a.failWear) v.wear = Math.max(0, wearOf(v) - a.failWear);
      if (a.limp) v.limp = { k: a.limp, job: v.jobId, leg: v.legIdx };
      txt = ok ? a.txt : a.failTxt || a.txt;
    } else {
      /* ältere Nachrichten ohne hinterlegte Wirkung */
      mins = rnd(60, 240); txt = "Es geht weiter.";
    }
    v.halt.until = S.time + Math.round(mins);
    const when = mins > 900 ? stamp(v.halt.until) : clock(v.halt.until);
    return txt + " Weiter ab " + when + (cost && isInsured() && c.insurable ? " · Versicherung zahlt 80 %" : "") + ".";
  }
};

/* ------------------------------ Streife ------------------------------- */
function maybeStreife(veh, job, leg) {
  const o = job.order;
  if (!o.snus || job.streife || veh.phase !== "haul" || !veh.routeDist) return false;
  if (veh.pos < veh.routeDist * 0.3) return false;
  job.streife = true;
  if (Math.random() > 0.3) return false;
  const where = nearName(vehPoint(veh));
  veh.halt = { icon: "🚓", label: "wartet – Streife bei " + where, until: WAIT_DECISION };
  decisionMsg({ from: "Fahrer · " + vType(veh.type).name, icon: "🚓", type: "streife", ring: true,
    title: "Streife bei " + where + "!",
    body: `Zwei Beamte stehen an der Ecke, ich hab ${o.snus.n} Dosen für ${o.shipper} dabei. Was jetzt?`,
    choices: [{ label: "Ganz normal weiterfahren", sub: "35 % Risiko: Kontrolle, Ware weg" },
              { label: "Umweg fahren", sub: "sicher, 20–30 min später" },
              { label: "Übergabe abbrechen", sub: "Ware zurück ins Lager" }],
    def: 1, wait: 20, ctx: { uid: veh.uid, job: job.id } });
  return true;
}
DECISIONS.streife = {
  choose(m, idx) {
    const v = S.fleet.find(f => f.uid === m.dec.ctx.uid);
    const j = S.jobs.find(x => x.id === m.dec.ctx.job);
    if (!v || !j) { if (v) delete v.halt; return "Hat sich erledigt."; }
    delete v.halt;
    if (idx === 2) { failJob(j, "abgebrochen"); return "Übergabe abgebrochen, Dosen zurück."; }
    if (idx === 1) { v.halt = { icon: "↪️", label: "Umweg um die Streife", until: S.time + Math.round(rnd(20, 30)) }; return "Umweg – sicher ist sicher."; }
    if (Math.random() < 0.35) {
      const o = j.order, sn = snusState();
      sn.lost = (sn.lost || 0) + o.snus.n;
      logMoney("snus", "Kontrolle · " + o.snus.n + " Dosen beschlagnahmt", 0);
      parkHere(v); v.phase = "idle"; v.jobId = null; v.legIdx = -1; v.route = null;
      S.jobs = S.jobs.filter(x => x.id !== j.id);
      toast("🚓 Kontrolle! " + o.snus.n + " Dosen beschlagnahmt – der Fahrer kommt mit einer Verwarnung davon.", "bad");
      return "Kontrolliert – Ware weg.";
    }
    return "Durchgewunken. Glück gehabt.";
  }
};

/* ------------------------------- Takt --------------------------------- */
function tickEvents(dtMin) {
  const before = evState().length;
  S.events = evState().filter(e => S.time < e.until + 60);
  evState().forEach(e => {
    if (!e.ended && S.time >= e.until) { e.ended = true; if (lively()) toast("✅ Vorbei: " + evTitle(e), "ok", true); }
  });
  if (!lively()) return;
  if (!S.evNext) S.evNext = S.time + rnd(900, 1600);
  if (S.time >= S.evNext && S.time > 2 * 1440) {
    S.evNext = S.time + rnd(1000, 2200) / Math.min(1.6, 1 + S.fleet.length / 40);
    if (evActive().length < 2) spawnEvent();
  }
  if (before !== evState().length) mapRedraw();
}

/* ------------------------------- Karte -------------------------------- */
let eventHits = [];
function drawEvents(m) {
  eventHits = [];
  const z = m.zoom;
  evActive().forEach(e => {
    const d = EVENT_DEF[e.type];
    if (d.global) return;
    const c = evCenter(e);
    const s = m.screenPos(c[0], c[1]);
    const edge = m.screenPos(c[0] + evRadiusKm(e) / 111, c[1]);
    const rpx = Math.max(14, Math.abs(s[1] - edge[1]));
    const ctx = m.ctx;
    ctx.save();
    const W = m.width, H = m.height;
    /* Ganz nah dran ist der Kreis riesig: dann nur das sichtbare Stück des Rands zeichnen */
    const far = Math.max(Math.hypot(s[0], s[1]), Math.hypot(s[0] - W, s[1]), Math.hypot(s[0], s[1] - H), Math.hypot(s[0] - W, s[1] - H));
    if (rpx < 1500) {
      ctx.beginPath(); ctx.arc(s[0], s[1], rpx, 0, 7);
      ctx.fillStyle = "rgba(226,70,95,0.12)"; ctx.fill();
      ctx.setLineDash([7, 6]); ctx.lineDashOffset = -(performance.now() / 60) % 13;
      ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(226,70,95,0.75)"; ctx.stroke(); ctx.setLineDash([]);
    } else {
      const inside = far < rpx;
      const ring = [];
      for (let k = 0; k <= 720; k++) { const a = k / 720 * Math.PI * 2; ring.push([s[0] + Math.cos(a) * rpx, s[1] + Math.sin(a) * rpx]); }
      ctx.fillStyle = "rgba(226,70,95,0.12)";
      if (inside) ctx.fillRect(0, 0, W, H);
      else if (Math.hypot(Math.max(0, Math.abs(s[0] - W / 2) - W / 2), Math.max(0, Math.abs(s[1] - H / 2) - H / 2)) < rpx) {
        ctx.beginPath(); ring.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.fill();
      }
      const runs = m.clipRuns(ring, 10);
      ctx.setLineDash([7, 6]); ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(226,70,95,0.75)";
      runs.forEach(r => { m.tracePath(ctx, [r]); ctx.lineDashOffset = -(performance.now() / 60) % 13 + r.start; ctx.stroke(); });
      ctx.setLineDash([]);
    }
    const R = z >= 9 ? 15 : 12;
    ctx.beginPath(); ctx.arc(s[0] + 1.5, s[1] + 2, R, 0, 7); ctx.fillStyle = "rgba(13,27,42,0.4)"; ctx.fill();
    ctx.beginPath(); ctx.arc(s[0], s[1], R, 0, 7); ctx.fillStyle = "#ffe2e7"; ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = "#0d1b2a"; ctx.stroke();
    drawEmoji(ctx, d.icon, s[0], s[1], R * 1.2);
    ctx.restore();
    eventHits.push({ x: s[0], y: s[1], r: R + 6, id: e.id });
  });
  renderEventBar();
}
let evBarKey = "";
function renderEventBar() {
  let el = document.getElementById("eventBar");
  if (!el) {
    el = document.createElement("div"); el.id = "eventBar";
    const ui = document.getElementById("mapUI"); if (!ui) return;
    ui.appendChild(el);
  }
  const list = evActive();
  const key = list.map(e => e.id + e.until).join("|");
  if (key === evBarKey) return;
  evBarKey = key;
  el.innerHTML = list.map(e => `<button class="evchip" data-ev="${e.id}">${EVENT_DEF[e.type].icon} ${esc(evTitle(e).split(" – ")[0])}<small>bis ${clock(e.until)}</small></button>`).join("");
  el.querySelectorAll("[data-ev]").forEach(b => b.onclick = () => {
    const e = evState().find(x => x.id === b.dataset.ev); if (!e) return;
    if (!EVENT_DEF[e.type].global) map.flyTo(evCenter(e), Math.max(map.zoom, e.type === "stau" ? 12 : 9), 700);
    toast(EVENT_DEF[e.type].icon + " " + evTitle(e) + " – bis " + clock(e.until) + ".", "warn");
  });
}
function eventAt(px, py) {
  const h = eventHits.find(h => Math.hypot(h.x - px, h.y - py) < h.r);
  return h ? evState().find(e => e.id === h.id) : null;
}
/* Hinweis im Planer, wenn eine Teilstrecke durch eine Störung führt */
function legEventNote(leg) {
  const notes = [];
  evActive().forEach(e => {
    const d = EVENT_DEF[e.type];
    if (!d.mode.includes(leg.mode)) return;
    const near = d.global || (e.node && (leg.from === e.node || leg.to === e.node))
      || (!e.node && leg.nodes.some(id => hav(nodePt(id), evCenter(e)) <= evRadiusKm(e) * 1.5));
    if (near) notes.push(`${d.icon} ${esc(evTitle(e))} – bis ${clock(e.until)}`);
  });
  return notes.length ? `<div class="warnbox evnote">${notes.join("<br>")}</div>` : "";
}
