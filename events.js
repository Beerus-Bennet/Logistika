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
function breakdown(veh, job, leg) {
  const t = vType(veh.type), K = stageK();
  const acc = t.mode === "r" && Math.random() < 0.18;
  const p = vehPoint(veh), where = nearName(p);
  const drv = typeof driverOf === "function" ? driverOf(veh.uid) : null;
  veh.halt = { icon: acc ? "💥" : "🔧", label: acc ? "Unfall bei " + where : "Panne bei " + where, until: WAIT_DECISION };
  if (acc) { job.order.damaged = true; }
  let choices, def;
  if (t.mode === "b") {
    choices = [{ label: "Selbst flicken", sub: "gratis, etwa eine halbe Stunde" },
               { label: "Zur Fahrradwerkstatt", sub: "sicher, eine Stunde", cost: Math.round(35 * K), insurable: true }];
    def = 0;
  } else if (t.mode === "r") {
    choices = [{ label: "Pannendienst rufen", sub: "meist nach 1 h weiter, sonst Abschleppen", cost: Math.round(120 * K + t.price * 0.002), insurable: true },
               { label: "Abschleppen & Werkstatt", sub: "3–5 h, danach wie neu", cost: Math.round(380 * K + t.price * 0.01), insurable: true },
               { label: "Fahrer versucht es selbst", sub: "gratis – halbe Stunde oder halber Tag" }];
    def = 2;
  } else {
    choices = [{ label: "Techniker einfliegen", sub: "2–4 h", cost: Math.round(900 * K + t.price * 0.004), insurable: true },
               { label: "Auf das Ersatzteil warten", sub: "gratis, 8–14 h" }];
    def = 1;
  }
  decisionMsg({ from: drv ? drv.name : "Fahrer · " + t.name, icon: acc ? "💥" : "🔧", type: "breakdown", ring: true,
    title: (acc ? "Unfall" : t.mode === "r" || t.mode === "b" ? "Panne" : "Technischer Defekt") + " bei " + where,
    body: (acc ? "Blechschaden, niemand verletzt – aber die Ladung hat was abbekommen. " : "")
      + `${t.name} steht mit der Ladung für „${job.order.shipper}“. Frist: ${stamp(job.order.deadline)}. Was soll ich machen?`
      + (acc && !S.insure ? " Ohne Versicherung zieht der Kunde 25 % ab." : ""),
    choices, def, wait: 90, ctx: { uid: veh.uid, job: job.id, acc } });
}
DECISIONS.breakdown = {
  choose(m, idx, cost) {
    const v = S.fleet.find(f => f.uid === m.dec.ctx.uid);
    if (!v || !v.halt) return "Hat sich erledigt.";
    const t = vType(v.type), c = m.dec.choices[idx];
    if (cost) payOut(cost, "repair", c.label + " · " + t.name);
    let mins, txt;
    if (/Pannendienst/.test(c.label)) {
      if (Math.random() < 0.75) { mins = rnd(45, 90); txt = "Der Pannendienst hat's gerichtet."; }
      else { mins = rnd(150, 240); txt = "Pannendienst konnte nicht helfen – abgeschleppt."; v.wear = Math.max(0, wearOf(v) - 25); }
    } else if (/Abschleppen/.test(c.label)) { mins = rnd(180, 300); v.wear = Math.max(0, wearOf(v) - 35); txt = "Abgeschleppt und repariert."; }
    else if (/Techniker/.test(c.label)) { mins = rnd(120, 240); v.wear = Math.max(0, wearOf(v) - 20); txt = "Techniker ist unterwegs."; }
    else if (/Ersatzteil/.test(c.label)) { mins = rnd(480, 840); txt = "Wir warten aufs Ersatzteil."; }
    else if (/Fahrradwerkstatt/.test(c.label)) { mins = 60; v.wear = Math.max(0, wearOf(v) - 30); txt = "Ab in die Werkstatt um die Ecke."; }
    else if (/flicken/.test(c.label)) { mins = rnd(20, 40); txt = "Schlauch geflickt."; }
    else { const ok = Math.random() < 0.5; mins = ok ? rnd(25, 45) : rnd(200, 360); txt = ok ? "Der Fahrer hat es selbst hinbekommen." : "Hat länger gedauert – aber es läuft wieder."; }
    v.halt.until = S.time + Math.round(mins);
    return txt + " Weiter ab " + clock(v.halt.until) + (cost && S.insure && c.insurable ? " · Versicherung zahlt 80 %" : "") + ".";
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
    ctx.beginPath(); ctx.arc(s[0], s[1], rpx, 0, 7);
    ctx.fillStyle = "rgba(226,70,95,0.12)"; ctx.fill();
    ctx.setLineDash([7, 6]); ctx.lineDashOffset = -(performance.now() / 60) % 13;
    ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(226,70,95,0.75)"; ctx.stroke(); ctx.setLineDash([]);
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
