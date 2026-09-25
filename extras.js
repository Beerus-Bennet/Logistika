/* =========================================================================
   LOGISTIKA – Mehr Leben im Betrieb: Grundgerüst und Wirtschaft

   · Entscheidungen: Anrufe und Nachrichten mit Auswahl. Solange etwas offen
     ist, läuft das Spiel höchstens mit 3×; kommt etwas Neues herein, bremst
     es auf 1×. Wer nicht antwortet, für den entscheidet nach einer Weile
     jemand anderes – meist die billigste Lösung.
   · Treibstoffpreis: schwankt täglich, trifft Diesel- und Kerosinfahrzeuge.
   · Verschleiß und Werkstatt, Flottenversicherung, Kredit, Monatsabschluss
     mit Steuern und der Ruf je Region.
   ========================================================================= */
"use strict";

const STAGE_K = [1, 2.5, 6, 18, 45, 90];
const stageK = () => STAGE_K[Math.min(STAGE_K.length, S.stage) - 1];
/* Tests schalten den Zufall ab, damit nichts dazwischenfunkt */
function calm() { return typeof window !== "undefined" && !!window.LOGISTIKA_CALM; }
function lively() {
  return !calm() && playing() && S.tut && S.tut.done && !S.jail && !S.over && !tutorialRunning();
}
function extraStats() {
  if (!S.stats) S.stats = { bike: 0, modes: {}, vip: 0, nego: 0, beat: 0, contracts: 0, missions: 0,
    dailySets: 0, repairs: 0, loans: 0, streak: 0, best: 0, snusSold: 0 };
  return S.stats;
}
const roundK = (x, step) => Math.max(step, Math.round(x / step) * step);
/* „wartet auf Entscheidung“ – groß, aber speicherbar (Infinity wird beim Speichern zu null) */
const WAIT_DECISION = 9e15;

/* =============================== Tempo ================================= */
function pendingDecisions() {
  return ((S.phone && S.phone.msgs) || []).filter(m => m.dec && !m.dec.done);
}
function speedCap() { return pendingDecisions().length ? 3 : 30; }
function brake(reason) {
  if (S.speed > 1) { setSpeed(1); toast("⏱️ Tempo auf 1× – " + reason, "warn"); }
}

/* ============================ Entscheidungen ============================
   m.dec = { type, choices:[{label, sub, cost}], ctx, def, until, done, pick }
   DECISIONS[type].choose(m, idx) führt aus und liefert den Ergebnistext.  */
const DECISIONS = {};
function decisionMsg(o) {
  const m = {
    from: o.from, kind: o.kind || "call", title: o.title, body: o.body, icon: o.icon || "📞",
    toastText: o.toast || (o.icon || "📞") + " " + o.from + ": " + o.title,
    dec: { type: o.type, choices: o.choices, ctx: o.ctx || {}, def: o.def || 0,
           until: S.time + (o.wait || 90), done: false, ring: !!o.ring }
  };
  phoneMsg(m);
  if (o.brake !== false) brake(o.brakeWhy || o.title);
  if (o.ring) queueCall(m.id);
  return m;
}
function decide(msgId, idx, auto) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || !m.dec || m.dec.done) return;
  const c = m.dec.choices[idx]; if (!c) return;
  const cost = c.cost ? insuredCost(c.cost, c.insurable) : 0;
  if (!auto && cost > 0 && cost > S.money + 1e-6 && !c.debt) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn");
  const h = DECISIONS[m.dec.type];
  let res = h ? h.choose(m, idx, cost) : "";
  m.dec.done = true; m.dec.pick = idx; m.handled = true;
  m.result = (auto ? "Keine Antwort – " : "") + (res || c.label);
  if (callState && callState.id === msgId) closeCall();
  save();
  if (typeof phoneOpen === "function" && phoneOpen()) renderPhone();
  render();
  return res;
}
function tickDecisions() {
  pendingDecisions().forEach(m => { if (S.time >= m.dec.until) decide(m.id, m.dec.def, true); });
}
/* Kosten, die die Flottenversicherung zu 80 % übernimmt */
function insuredCost(cost, insurable) { return insurable && S.insure ? Math.round(cost * 0.2) : cost; }
function payOut(cost, kind, label) {
  if (!cost) return;
  S.money -= cost; S.expense += cost;
  logMoney(kind, label, -cost);
}

function decisionMsgHTML(m) {
  const d = m.dec;
  const acts = d.done ? "" : d.choices.map((c, i) => {
    const cost = c.cost ? insuredCost(c.cost, c.insurable) : 0;
    return `<button class="dchoice${cost > S.money && !c.debt ? " disabled" : ""}" data-dec="${m.id}|${i}">
      <b>${esc(c.label)}${cost ? ` · ${money(cost)}` : ""}${c.insurable && S.insure && c.cost ? ` <em>🛡️ −80 %</em>` : ""}</b>
      ${c.sub ? `<small>${esc(c.sub)}</small>` : ""}</button>`;
  }).join("");
  return `<div class="pmsg call ${m.kind}${m.handled ? " done" : ""}">
    <div class="pmsg-head"><span class="pmsg-from">${m.icon || "📞"} ${esc(m.from)}</span>
      <span class="pmsg-time">${stamp(m.time)} ${phoneTTL(m)}</span></div>
    <b>${esc(m.title)}</b>
    <p>${esc(m.body)}</p>
    ${d.done ? `<div class="pmsg-note ok">✔ ${esc(m.result || "erledigt")}</div>`
      : `<div class="dchoices">${acts}</div>
         <div class="pmsg-note">Ohne Antwort bis ${clock(d.until)}: „${esc(d.choices[d.def].label)}“</div>`}
  </div>`;
}
function bindDecisionMsgs(root) {
  (root || document).querySelectorAll("[data-dec]").forEach(b => b.onclick = () => {
    const [id, i] = b.dataset.dec.split("|"); decide(id, +i);
  });
}

/* ------------------------- Eingehender Anruf -------------------------- */
let callState = null;
const callQueue = [];
function queueCall(id) { if (!callQueue.includes(id)) callQueue.push(id); }
function tickCalls() {
  if (callState || !callQueue.length) return;
  if (typeof walletOpen === "function" && walletOpen()) return;
  if (document.body.classList.contains("invite-open") || document.body.classList.contains("pack-open")) return;
  const id = callQueue.shift();
  const m = S.phone.msgs.find(x => x.id === id);
  if (m && m.dec && !m.dec.done) showCall(m);
}
function callEl() {
  let el = document.getElementById("call");
  if (!el) { el = document.createElement("div"); el.id = "call"; document.body.appendChild(el); }
  return el;
}
function showCall(m) {
  callState = { id: m.id, answered: false };
  const el = callEl();
  el.className = "on";
  document.body.classList.add("call-open");
  el.innerHTML = `<div class="cl-card">
    <div class="cl-top"><small>Diensttelefon</small><b>${esc(m.from)}</b><span>ruft an …</span></div>
    <div class="cl-av"><i></i><i></i><span>${m.icon || "📞"}</span></div>
    <div class="cl-title">${esc(m.title)}</div>
    <div class="wl-slide cl-slide" id="clSlide"><div class="wl-fill" id="clFill"></div>
      <span class="wl-hint">Zum Annehmen wischen</span>
      <button class="wl-knob cl-knob" id="clKnob" aria-label="Zum Annehmen nach rechts wischen">📞</button></div>
    <button class="wl-cancel" id="clLater">Später – liegt im Diensthandy</button>
  </div>`;
  bindSwipe($("#clSlide"), $("#clKnob"), $("#clFill"), () => answerCall(), callState);
  $("#clLater").onclick = () => closeCall();
  if (navigator.vibrate) { try { navigator.vibrate([60, 80, 60]); } catch (_) { /* egal */ } }
}
function answerCall() {
  if (!callState) return;
  const m = S.phone.msgs.find(x => x.id === callState.id);
  if (!m || !m.dec || m.dec.done) return closeCall();
  callState.answered = true;
  const el = callEl();
  el.innerHTML = `<div class="cl-card answered">
    <div class="cl-top"><small>verbunden · ${esc(m.from)}</small><b>${esc(m.title)}</b></div>
    <p class="cl-body">${esc(m.body)}</p>
    <div class="dchoices">${decisionMsgHTML(m).match(/<div class="dchoices">([\s\S]*?)<\/div>\s*<div class="pmsg-note">/)[1]}</div>
    <button class="wl-cancel" id="clLater">Später entscheiden</button>
  </div>`;
  bindDecisionMsgs(el);
  $("#clLater").onclick = () => closeCall();
}
function closeCall() {
  callState = null;
  const el = callEl();
  el.className = ""; el.innerHTML = "";
  document.body.classList.remove("call-open");
}

/* Wischen wie beim Anruf – auch für die Wallet */
function bindSwipe(track, knob, fill, onDone, flag) {
  if (!track || !knob) return;
  let x0 = 0, x = 0, drag = false;
  const max = () => track.clientWidth - knob.offsetWidth - 8;
  const put = (v, anim) => {
    x = clamp(v, 0, max());
    knob.style.transition = fill.style.transition = anim ? "transform .25s ease, width .25s ease" : "none";
    knob.style.transform = `translateX(${x}px)`;
    fill.style.width = (x + knob.offsetWidth + 4) + "px";
    track.style.setProperty("--p", (x / Math.max(1, max())).toFixed(3));
  };
  knob.addEventListener("pointerdown", e => {
    drag = true; x0 = e.clientX - x; if (flag) flag.drag = true;
    try { knob.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
    e.preventDefault();
  });
  knob.addEventListener("pointermove", e => { if (drag) put(e.clientX - x0, false); });
  const end = () => {
    if (!drag) return;
    drag = false; if (flag) flag.drag = false;
    if (x >= max() * 0.9) { put(max(), true); onDone(); } else put(0, true);
  };
  knob.addEventListener("pointerup", end);
  knob.addEventListener("pointercancel", end);
  knob.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); put(max(), true); onDone(); } });
  put(0, false);
}

/* ============================ Treibstoff =============================== */
const FUEL_BASE = 1.72;                         /* €/l Diesel, Mittelwert */
const ELECTRIC = new Set(["v-kumpan", "v-esprinter", "v-volvofhe", "v-br185", "v-vectron"]);
function fuelState() {
  if (!S.fuel) S.fuel = { p: FUEL_BASE, hist: [FUEL_BASE] };
  return S.fuel;
}
function burnsFuel(t) { return t.mode !== "b" && !ELECTRIC.has(t.id); }
/* Etwa 45 % der Kilometerkosten sind Treibstoff – der Rest Reifen, Maut, Lohn */
function fuelFactor(t) { return burnsFuel(t) ? 0.55 + 0.45 * fuelState().p / FUEL_BASE : 1; }
function fuelDay() {
  const f = fuelState();
  const g = (Math.random() + Math.random() + Math.random() - 1.5) * 0.045;
  let p = f.p * Math.exp(g) + (FUEL_BASE - f.p) * 0.08;
  let news = null;
  if (Math.random() < 0.06) {
    const up = Math.random() < 0.55;
    p *= up ? rnd(1.08, 1.16) : rnd(0.86, 0.93);
    news = up ? "Ölpreis zieht an – Diesel wird teurer." : "Ölpreis gibt nach – Diesel wird billiger.";
  }
  f.p = clamp(+p.toFixed(3), 1.32, 2.49);
  f.hist.push(f.p);
  if (f.hist.length > 30) f.hist.shift();
  if (news && lively()) toast("⛽ " + news + " " + fmt(f.p, 2) + " €/l", "warn");
}
function fuelTrend() {
  const h = fuelState().hist;
  const prev = h.length > 1 ? h[h.length - 2] : h[0];
  return (h[h.length - 1] - prev) / prev;
}
function sparkSVG(vals, w, h, col) {
  if (vals.length < 2) return "";
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * w).toFixed(1)},${(h - 2 - (v - lo) / span * (h - 4)).toFixed(1)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

/* =========================== Verschleiß =============================== */
/* Wie viele Kilometer ein Prozent Zustand kosten */
const KM_PER_PCT = { b: 120, r: 450, i: 2500, l: 4000, s: 8000, a: 25000 };
function wearOf(f) { return f.wear || 0; }
function wearValueFactor(f) { return 1 - wearOf(f) / 100 * 0.5; }
function repairCost(f) {
  const t = vType(f.type);
  return Math.round(t.price * (0.02 + wearOf(f) / 100 * 0.06) + 40 * stageK());
}
function repairMinutes(f) {
  const t = vType(f.type);
  const k = t.mode === "b" ? 0.4 : t.mode === "r" ? 1 : 2.5;
  return Math.round((180 + wearOf(f) / 100 * 360) * k);
}
function sendToWorkshop(uid, auto) {
  const f = S.fleet.find(x => x.uid === uid); if (!f) return;
  if (f.phase !== "idle") return toast("Nur freie Fahrzeuge können in die Werkstatt.", "warn");
  const cost = repairCost(f);
  if (!auto && cost > S.money) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn");
  payOut(cost, "repair", "Werkstatt · " + vType(f.type).name);
  f.phase = "service"; f.serviceUntil = S.time + repairMinutes(f);
  extraStats().repairs++;
  if (!auto) toast("🔧 " + vType(f.type).name + " ist in der Werkstatt bis " + clock(f.serviceUntil) + ".", "ok");
  save(); render();
}
function tickWorkshop() {
  S.fleet.forEach(f => {
    if (f.phase === "service" && S.time >= (f.serviceUntil || 0)) {
      f.phase = "idle"; f.wear = 4; delete f.serviceUntil;
      toast("🔧 " + vType(f.type).name + " ist aus der Werkstatt zurück.", "ok", true);
    }
  });
  /* Die Dispo im Büro schickt stark abgenutzte Fahrzeuge selbst zur Werkstatt */
  (S.bases || []).forEach(b => {
    if (b.dispOff || typeof dispoPower !== "function" || dispoPower(b) <= 0) return;
    b.vehicles.forEach(u => {
      const f = S.fleet.find(x => x.uid === u);
      if (f && f.phase === "idle" && wearOf(f) >= 85 && S.money > repairCost(f)) {
        sendToWorkshop(u, true);
        toast("🔧 Dispo " + N[b.node].short + " schickt " + vType(f.type).name + " zur Inspektion.", "ok", true);
      }
    });
  });
}
/* Pannenrisiko je Kilometer – steigt mit dem Verschleiß deutlich an */
function breakdownHazard(t, w) {
  return (1 / (KM_PER_PCT[t.mode] * 45)) * (1 + 30 * Math.pow(w / 100, 2.2));
}
function onDriven(veh, t, km, job, leg) {
  if (calm()) return;
  veh.wear = Math.min(100, wearOf(veh) + km / KM_PER_PCT[t.mode]);
  if (!lively() || !job || job.order.tut || veh.halt) return;
  if (typeof maybeStreife === "function" && maybeStreife(veh, job, leg)) return;
  if (Math.random() < km * breakdownHazard(t, wearOf(veh)) && typeof breakdown === "function") breakdown(veh, job, leg);
}

/* ========================== Versicherung ============================== */
function fleetValue() {
  return S.fleet.reduce((a, f) => a + vType(f.type).price * (f.lease ? 0.5 : 1) * wearValueFactor(f), 0);
}
function insurePremium() { return Math.round(fleetValue() * 0.0006); }
function toggleInsure() {
  S.insure = !S.insure;
  toast(S.insure ? "🛡️ Flottenversicherung abgeschlossen: " + money(insurePremium()) + " am Tag, übernimmt 80 % bei Pannen und Unfällen."
    : "🛡️ Versicherung gekündigt.", "ok");
  save(); render();
}

/* ============================== Kredit ================================= */
const LOAN_BASE = [8000, 30000, 120000, 600000, 2500000, 10000000];
const LOAN_RATE = 0.089;                        /* effektiv p. a. */
const LOAN_DAYS = 60;
function loanOffers() {
  const base = LOAN_BASE[Math.min(LOAN_BASE.length, S.stage) - 1];
  return [0.5, 1, 2].map(k => {
    const P = base * k, r = LOAN_RATE / 365;
    const rate = P * r / (1 - Math.pow(1 + r, -LOAN_DAYS));
    return { amount: P, daily: Math.round(rate), total: Math.round(rate * LOAN_DAYS) };
  });
}
function takeLoan(i) {
  if (S.loan) return toast("Erst den laufenden Kredit abbezahlen.", "warn");
  const o = loanOffers()[i]; if (!o) return;
  S.loan = { amount: o.amount, daily: o.daily, left: LOAN_DAYS, rest: o.total, taken: S.time };
  S.money += o.amount; S.revenue += 0;
  logMoney("loan", "Kredit ausgezahlt · " + LOAN_DAYS + " Tage", o.amount);
  toast("🏦 " + money(o.amount) + " gutgeschrieben. Rate: " + money(o.daily) + " täglich.", "ok");
  save(); render();
}
function repayLoan() {
  const L = S.loan; if (!L) return;
  /* Sondertilgung: Restschuld ohne die noch nicht angefallenen Zinsen */
  const r = LOAN_RATE / 365;
  const principal = Math.round(L.daily * (1 - Math.pow(1 + r, -L.left)) / r);
  if (principal > S.money) return toast("Für die Ablösung fehlen " + money(principal - S.money) + ".", "warn");
  payOut(principal, "loan", "Kredit abgelöst");
  S.loan = null; extraStats().loans++;
  toast("🏦 Kredit abgelöst – schuldenfrei.", "ok");
  save(); render();
}
function loanDay() {
  const L = S.loan; if (!L) return;
  payOut(L.daily, "loan", "Kreditrate");
  L.left--; L.rest = Math.max(0, L.rest - L.daily);
  if (S.money < 0) { repAdd(S.stage, -3); toast("🏦 Mahnung: Das Konto ist im Minus – das spricht sich herum.", "bad"); }
  if (L.left <= 0) { S.loan = null; extraStats().loans++; toast("🏦 Kredit vollständig zurückgezahlt.", "ok"); }
}

/* ========================= Monatsabschluss ============================ */
const TAX_RATE = 0.30;
function taxDay() {
  if (!S.taxFrom && S.taxFrom !== 0) S.taxFrom = S.time;
  if (S.time - S.taxFrom < 30 * 1440) return;
  const sums = ledgerSums(S.taxFrom);            /* nur die offiziellen Bücher */
  const tax = Math.round(Math.max(0, sums.net) * TAX_RATE);
  const month = (S.taxHist = S.taxHist || []).length + 1;
  S.taxHist.unshift({ month, inc: sums.inc, exp: sums.exp, net: sums.net, tax, t: S.time });
  if (S.taxHist.length > 12) S.taxHist.length = 12;
  S.taxFrom = S.time;
  if (tax > 0) payOut(tax, "tax", "Steuern Monat " + month);
  if (lively()) phoneMsg({ from: "Steuerbüro Kranz & Partner", kind: "info", title: "Monatsabschluss " + month,
    body: `Einnahmen ${money(sums.inc)}, Ausgaben ${money(sums.exp)}, Ergebnis ${money(sums.net)}. `
      + (tax > 0 ? `Darauf ${Math.round(TAX_RATE * 100)} % Steuern: ${money(tax)} – bereits abgebucht.` : "Kein Gewinn, also keine Steuern.")
      + " Nebengeschäfte tauchen hier nicht auf." });
}

/* =============================== Ruf ================================== */
function repOf(r) { const v = (S.rep || {})[r]; return v == null ? 50 : v; }
function repAdd(r, d) {
  S.rep = S.rep || {};
  S.rep[r] = clamp(repOf(r) + d, 0, 100);
}
function regionOf(o) { return (N[o.from] && N[o.from].stage) || S.stage; }
function repPayFactor(o) { return 0.9 + repOf(regionOf(o)) / 100 * 0.25; }
/* Sterne als Balken: fünf leere, darüber gefüllte bis zum Wert */
function repStars(v) {
  return `<span class="starbar"><span>☆☆☆☆☆</span><i style="width:${clamp(v, 0, 100)}%">★★★★★</i></span>`;
}

/* ======================== Hooks aus game.js =========================== */
function onOrderSpawn(o) {
  if (!o || o.tut || o.tutNext || o.snus || o.pablo || calm()) return;
  o.pay = Math.round(o.pay * repPayFactor(o));
  if (typeof rivalOnSpawn === "function") rivalOnSpawn(o);
}
function onJobStart(job) {
  const o = job.order, f = S.fleet.find(x => x.uid === job.legs[0].veh);
  if (f) { const rc = repoCost(f, job.legs[0], o, 0); job.repo0 = rc.ok ? rc.d : 0; }
  if (o.rival) { extraStats().beat++; delete o.rival; }
}
function onDelivered(job, pay, late) {
  const o = job.order, st = extraStats();
  if (!o.snus && !o.pablo && !o.tut) {
    /* Guter Ruf wächst langsam und ist schnell verspielt */
    const r = regionOf(o);
    repAdd(r, late ? -2.5 : o.vip ? 8 : 0.45 * (1 - repOf(r) / 110));
    st.streak = late ? 0 : st.streak + 1; st.best = Math.max(st.best, st.streak);
  }
  const modes = new Set(job.legs.map(l => l.mode));
  modes.forEach(m => { st.modes[m] = (st.modes[m] || 0) + 1; });
  if (modes.has("b")) st.bike++;
  if (o.snus) st.snusSold++;
  if (!o.snus && !o.pablo && typeof shareState === "function") shareState().me++;
  if (typeof goalsDelivered === "function") goalsDelivered(job, pay, late);
  if (typeof vipDelivered === "function") vipDelivered(job, pay, late);
}
function onFailed(job, reason) {
  const o = job.order;
  if (o.snus || o.pablo || o.tut) return;
  repAdd(regionOf(o), o.vip ? -12 : -5);
  extraStats().streak = 0;
  if (typeof goalsFailed === "function") goalsFailed(job, reason);
}
function haltLabel(v) {
  if (v.phase === "service") return "🔧 in der Werkstatt bis " + clock(v.serviceUntil || S.time);
  if (!v.halt) return null;
  const h = v.halt;
  return (h.icon || "⛔") + " " + h.label + (h.until < 1e14 ? " · bis " + clock(h.until) : " · wartet auf deine Entscheidung");
}
/* Tempo eines Fahrzeugs: Panne steht, Störungen bremsen */
function moveFactor(veh, leg, job) {
  if (veh.halt && veh.halt.until == null) veh.halt.until = WAIT_DECISION;
  if (veh.halt) {
    if (S.time >= veh.halt.until) {
      toast("🚚 " + vType(veh.type).name + " fährt weiter.", "ok", true);
      delete veh.halt;
    } else return 0;
  }
  return typeof eventFactor === "function" ? eventFactor(veh, leg) : 1;
}

let extraMin = 0, linaAsked = false;
function tickExtras(dtMin) {
  tickWorkshop();
  if (calm()) return;
  /* Einmal erklärt Lina, was jetzt alles passieren kann */
  if (!linaAsked && lively() && level() >= 2 && !(S.tutSeen && S.tutSeen.extras) && typeof linaTalk === "function") {
    linaAsked = true; setTimeout(() => linaTalk("extras"), 1200);
  }
  tickDecisions();
  tickCalls();
  if (typeof tickEvents === "function") tickEvents(dtMin);
  if (typeof tickRivals === "function") tickRivals(dtMin);
  if (typeof tickVip === "function") tickVip(dtMin);
  if (typeof tickGoals === "function") tickGoals(dtMin);
}
function dayExtras(days) {
  if (calm()) return;
  for (let d = 0; d < days; d++) {
    fuelDay();
    loanDay();
    S.fleet.forEach(f => { f.wear = Math.min(100, wearOf(f) + 0.15); });
  }
  if (S.insure && S.fleet.length) payOut(insurePremium() * days, "insure", "Flottenversicherung");
  taxDay();
  if (typeof goalsDay === "function") goalsDay(days);
}

/* ================ Welt-Reiter: Ruf, Treibstoff, Bank, Steuern ================ */
function economyHTML() {
  const regs = STAGES.slice(0, S.stage).map((st, i) => {
    const v = repOf(i + 1), pct = Math.round((0.9 + v / 100 * 0.25 - 1) * 100);
    return `<div class="rep-row"><span>${esc(st.name)}</span><b class="stars" title="${Math.round(v)} / 100">${repStars(v)} <small>${fmt(v / 20, 1)}</small></b>
      <small>${v >= 70 ? "gefragt" : v < 40 ? "angeschlagen" : "solide"} · ${pct >= 0 ? "+" : "−"}${Math.abs(pct)} % Erlös</small></div>`;
  }).join("");
  const f = fuelState(), tr = fuelTrend();
  const offers = loanOffers();
  const L = S.loan;
  const bank = L
    ? `<div class="loanbox"><div><span>Restschuld</span><b>${money(L.rest)}</b></div>
         <div><span>Rate täglich</span><b>${money(L.daily)}</b></div><div><span>Noch</span><b>${L.left} Tage</b></div></div>
       <button class="btn tiny ghost" id="loanRepay">Vorzeitig ablösen</button>`
    : `<div class="loanrow">${offers.map((o, i) => `<button class="loanopt" data-loan="${i}">
         <b>${money(o.amount)}</b><small>${money(o.daily)} täglich</small><small>Zinsen ${money(o.total - o.amount)}</small></button>`).join("")}</div>`;
  const th = (S.taxHist || [])[0];
  const nextTax = (S.taxFrom || 0) + 30 * 1440;
  const cur = ledgerSums(S.taxFrom || 0);
  return `
  <div class="card eco">
    <div class="card-top"><div class="vname">⭐ Ruf<small>Pünktlich hebt ihn, verspätet oder geplatzt senkt ihn. Guter Ruf bringt bessere Preise und mehr Einladungen.</small></div></div>
    <div class="rep-list">${regs}</div>
  </div>
  <div class="card eco">
    <div class="card-top"><div class="vname">⛽ Treibstoff<small>Diesel und Kerosin – trifft alles außer Rad und E-Fahrzeugen</small></div>
      <span class="fuelp ${tr > 0.001 ? "up" : tr < -0.001 ? "down" : ""}"><b>${fmt(f.p, 2)} €/l</b><small>${tr > 0.001 ? "▲" : tr < -0.001 ? "▼" : "•"} ${fmt(Math.abs(tr) * 100, 1)} %</small></span></div>
    ${sparkSVG(f.hist, 300, 44, "#f0812b")}
    <div class="meta small"><span>${(() => { const k = Math.round((fuelFactor({ mode: "r", id: "x" }) - 1) * 100);
      return k === 0 ? "Kilometerkosten wie üblich" : "Kilometerkosten " + (k > 0 ? "+" : "−") + Math.abs(k) + " % ggü. Normalpreis"; })()}</span></div>
  </div>
  <div class="card eco">
    <div class="card-top"><div class="vname">🏦 Hausbank<small>${L ? "Laufender Kredit – die Rate geht täglich ab." : "Schneller wachsen: Kredit mit " + fmt(LOAN_RATE * 100, 1) + " % Zinsen p. a., " + LOAN_DAYS + " Tage Laufzeit"}</small></div></div>
    ${bank}
  </div>
  <div class="card eco">
    <div class="card-top"><div class="vname">🧾 Monatsabschluss<small>Alle 30 Tage: ${Math.round(TAX_RATE * 100)} % Steuern auf den Gewinn der offiziellen Bücher</small></div></div>
    <div class="meta small"><span>Laufender Monat: ${money(cur.net)} Ergebnis</span><span>≈ ${money(Math.max(0, cur.net) * TAX_RATE)} Steuern</span><span>Abschluss ${stamp(nextTax)}</span></div>
    ${th ? `<div class="meta small"><span>Monat ${th.month}: ${money(th.net)} Ergebnis · ${money(th.tax)} Steuern</span></div>` : ""}
  </div>`;
}
function bindEconomy() {
  $$("[data-loan]").forEach(b => b.onclick = () => {
    const o = loanOffers()[+b.dataset.loan];
    askConfirm("Kredit über " + money(o.amount) + "?", "Rate " + money(o.daily) + " täglich für " + LOAN_DAYS + " Tage, zusammen " + money(o.total) + ".",
      "Kredit aufnehmen", () => takeLoan(+b.dataset.loan));
  });
  const r = $("#loanRepay"); if (r) r.onclick = repayLoan;
}

/* ================ Flotten-Reiter: Zustand, Werkstatt, Versicherung ================ */
function fleetExtraHTML() {
  if (!S.fleet.length) return "";
  const f = fuelState(), tr = fuelTrend();
  return `<div class="fleetx">
    <span class="fuelchip ${tr > 0.001 ? "up" : tr < -0.001 ? "down" : ""}">⛽ Diesel ${fmt(f.p, 2)} €/l ${tr > 0.001 ? "▲" : tr < -0.001 ? "▼" : ""}</span>
    <button class="insure ${S.insure ? "on" : ""}" id="insureBtn">🛡️ ${S.insure ? "versichert · " + money(insurePremium()) + "/Tag" : "unversichert – absichern?"}</button>
  </div>`;
}
function vehExtraHTML(v) {
  const w = Math.round(wearOf(v));
  const col = w >= 80 ? "var(--red)" : w >= 55 ? "var(--amber)" : "var(--green)";
  const svc = v.phase === "service";
  return `<div class="wearrow">
    <span class="wearbar" title="Verschleiß"><i style="width:${100 - w}%;background:${col}"></i></span>
    <span class="weartx">🔧 Zustand ${100 - w} %${w >= 80 ? " · Pannengefahr!" : ""}</span>
    ${svc ? `<span class="weartx">bis ${clock(v.serviceUntil)}</span>`
      : v.phase === "idle" && w >= 8 ? `<button class="btn tiny ghost" data-repair="${v.uid}">Werkstatt · ${money(repairCost(v))}</button>` : ""}
  </div>`;
}
function bindFleetExtras() {
  const b = $("#insureBtn"); if (b) b.onclick = toggleInsure;
  $$("#tab-fleet [data-repair]").forEach(x => x.onclick = () => sendToWorkshop(x.dataset.repair));
}
