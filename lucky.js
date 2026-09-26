/* =========================================================================
   LOGISTIKA – Luckybox
   Wer an einem Tag alle drei Tagesaufgaben schafft, bekommt eine Luckybox.
   Sieben volle Tage in Folge geben eine goldene, eine pünktliche
   Sonderfahrt eine als Dankeschön. Beim Öffnen läuft ein Band mit Preisen
   durch und bleibt auf dem Gewinn stehen. Hauptpreis: der Goldene Bulli.
   ========================================================================= */
"use strict";

/* Das Sonderfahrzeug gibt es nur aus der Box – nicht im Markt */
VEHICLES.push({ id: "v-goldbulli", name: "VW T1 Samba „Goldstück“", brand: "Sonderedition · Luckybox", mode: "r",
  cap: 900, speed: 95, costKm: 0.24, daily: 8, price: 48000, stage: 1, range: 600, icon: "🚐", flags: ["kurier"], special: true });

const RARITY = {
  c: { name: "Gewöhnlich", col: "#8fa3b8" },
  r: { name: "Selten", col: "#2fa85c" },
  e: { name: "Episch", col: "#8a5cff" },
  l: { name: "Legendär", col: "#e0a800" }
};
const PRIZES = [
  { id: "cash", r: "c", icon: "💶", name: "Trinkgeldkasse", desc: () => money(luckyCash()) + " bar auf die Hand" },
  { id: "xp", r: "c", icon: "⭐", name: "Erfahrungsschub", desc: () => "+" + luckyXP() + " Erfahrung" },
  { id: "fuel", r: "c", icon: "⛽", name: "Tankkarte", desc: () => "24 Stunden Diesel und Kerosin zum halben Preis" },
  { id: "repair", r: "c", icon: "🔧", name: "Werkstattgutschein", desc: () => "Die nächste Inspektion ist gratis" },
  { id: "mood", r: "r", icon: "☕", name: "Kaffeemaschine fürs Team", desc: () => (S.bases || []).length ? "Stimmung +15 in allen Büros" : "Noch kein Büro – dafür " + money(luckyCash() * 2) },
  { id: "rep", r: "r", icon: "🤝", name: "Empfehlungsschreiben", desc: () => "Ruf +6 in " + STAGES[S.stage - 1].name },
  { id: "insure", r: "r", icon: "🛡️", name: "Rundum-Schutz", desc: () => "7 Tage Flottenversicherung gratis" },
  { id: "coupon", r: "r", icon: "🏷️", name: "Händlerrabatt", desc: () => "−20 % auf das nächste gekaufte Fahrzeug" },
  { id: "boost", r: "e", icon: "📈", name: "Hochsaison", desc: () => "24 Stunden lang +20 % auf alle Frachterlöse" },
  { id: "head", r: "e", icon: "🕴️", name: "Headhunter", desc: () => (S.bases || []).length ? "Eine ★★★★★-Fachkraft in deinen Bewerbungen – ohne Vermittlungsgebühr" : "Noch kein Büro – dafür " + money(luckyCash() * 3) },
  { id: "vip", r: "e", icon: "✉️", name: "Insider-Tipp", desc: () => level() >= 3 ? "Die nächste Einladung zur Sonderfahrt kommt in den nächsten Stunden" : "Noch zu früh für Einladungen – dafür " + money(luckyCash() * 3) },
  { id: "bulli", r: "l", icon: "🏆", name: "Hauptpreis: Goldener Bulli", desc: () => ownsBulli()
      ? "Den hast du schon – dafür der Jackpot: " + money(luckyJackpot())
      : "VW T1 Samba „Goldstück“: 900 kg, 95 km/h, fährt jede Tour mit +10 % Erlös. Gibt es nicht zu kaufen." }
];
const LUCKY_ODDS = { std: { c: 55, r: 28, e: 13, l: 4 }, gold: { c: 25, r: 40, e: 27, l: 8 } };
const luckyCash = () => roundK(rnd(300, 800) * stageK(), 10);
const luckyXP = () => 60 + level() * 40;
const luckyJackpot = () => roundK(25000 * stageK(), 100);
const ownsBulli = () => S.fleet.some(f => f.type === "v-goldbulli");

function luckyState() { if (!S.lucky) S.lucky = { boxes: [], opened: 0, streak: 0, lastSet: -9, log: [] }; return S.lucky; }
function perks() { if (!S.perk) S.perk = {}; return S.perk; }
function luckyGive(kind, why) {
  const L = luckyState();
  L.boxes.push({ kind, why, t: S.time });
  toast((kind === "gold" ? "💎 Goldene Luckybox" : "🎁 Luckybox") + " bekommen – " + why + ". Unter 🎯 öffnen!", "ok");
  if (typeof renderGoalsChip === "function") renderGoalsChip();
}
/* Aus goals.js: alle drei Tagesaufgaben geschafft */
function luckyDailySet() {
  const L = luckyState(), today = dayOf(S.time);
  L.streak = L.lastSet === today - 1 ? L.streak + 1 : L.lastSet === today ? L.streak : 1;
  L.lastSet = today;
  luckyGive("std", "alle Tagesaufgaben geschafft");
  if (L.streak > 0 && L.streak % 7 === 0) luckyGive("gold", L.streak + " Tage in Folge alles geschafft");
}
function rollPrize(kind) {
  const odds = LUCKY_ODDS[kind] || LUCKY_ODDS.std;
  const tot = Object.values(odds).reduce((a, b) => a + b, 0);
  let x = Math.random() * tot, r = "c";
  for (const k of ["c", "r", "e", "l"]) { x -= odds[k]; if (x <= 0) { r = k; break; } }
  return pick(PRIZES.filter(p => p.r === r));
}
function applyPrize(p) {
  const P = perks();
  let txt = p.desc();
  switch (p.id) {
    case "cash": { const v = luckyCash(); S.money += v; S.revenue += v; logMoney("bonus", "Luckybox: Trinkgeldkasse", v); txt = "+" + money(v); break; }
    case "xp": S.xp += luckyXP(); checkLevel(); break;
    case "fuel": P.fuelUntil = S.time + 1440; break;
    case "repair": P.freeRepair = (P.freeRepair || 0) + 1; break;
    case "mood":
      if ((S.bases || []).length) S.bases.forEach(b => { b.mood = clamp(b.mood + 15, 0, 100); });
      else { const v = luckyCash() * 2; S.money += v; S.revenue += v; logMoney("bonus", "Luckybox", v); }
      break;
    case "rep": repAdd(S.stage, 6); break;
    case "insure": P.insureUntil = S.time + 7 * 1440; break;
    case "coupon": P.coupon = 0.2; break;
    case "boost": P.boostUntil = S.time + 1440; break;
    case "head": {
      const b = (S.bases || []).slice().sort((a, c) => c.tier - a.tier)[0];
      if (b) {
        const c = makeCandidate(false); c.skill = 5; c.fee = 0; c.wage = Math.round(ROLES[c.role].wage * 1.6);
        c.trait = "kommt über den Headhunter – und weiß das auch"; c.hh = true;
        (b.pool = b.pool || []).unshift(c);
        txt = c.name + " (" + ROLES[c.role].name + ", ★★★★★) wartet in " + N[b.node].short + " – ohne Vermittlungsgebühr.";
      } else { const v = luckyCash() * 3; S.money += v; S.revenue += v; logMoney("bonus", "Luckybox", v); }
      break;
    }
    case "vip":
      if (level() >= 3 && typeof vipState === "function") vipState().next = S.time + rnd(60, 360);
      else { const v = luckyCash() * 3; S.money += v; S.revenue += v; logMoney("bonus", "Luckybox", v); }
      break;
    case "bulli":
      if (ownsBulli()) { const v = luckyJackpot(); S.money += v; S.revenue += v; logMoney("bonus", "Luckybox: Jackpot", v); }
      else {
        const v = makeVehicle("v-goldbulli", false);
        S.fleet.push(v);
        logMoney("fleet", "Luckybox: Goldener Bulli", 0);
      }
      break;
  }
  const L = luckyState();
  L.log.unshift({ id: p.id, t: S.time }); if (L.log.length > 20) L.log.length = 20;
  save(); render();
  return txt;
}
/* Wirkungen, die game.js und extras.js abfragen */
function perkFuel() { return S.perk && S.time < (S.perk.fuelUntil || 0) ? 0.5 : 1; }
function perkInsured() { return !!(S.perk && S.time < (S.perk.insureUntil || 0)); }
function payBoost(job) {
  let k = S.perk && S.time < (S.perk.boostUntil || 0) ? 1.2 : 1;
  if (job.legs.some(l => { const f = S.fleet.find(x => x.uid === l.veh); return f && f.type === "v-goldbulli"; })) k *= 1.1;
  return k;
}
/* Preis mit Gutschein – eingelöst wird erst beim Kauf (useCoupon) */
function couponPrice(price) { return S.perk && S.perk.coupon ? Math.round(price * (1 - S.perk.coupon)) : price; }
function useCoupon() {
  if (!S.perk || !S.perk.coupon) return;
  S.perk.coupon = 0;
  toast("🏷️ Händlerrabatt eingelöst: −20 % auf dieses Fahrzeug.", "ok");
}
function perkChips() {
  const P = S.perk || {}, out = [];
  if (S.time < (P.fuelUntil || 0)) out.push("⛽ Tankkarte bis " + clock(P.fuelUntil));
  if (S.time < (P.boostUntil || 0)) out.push("📈 Hochsaison bis " + clock(P.boostUntil));
  if (S.time < (P.insureUntil || 0)) out.push("🛡️ gratis versichert bis " + stamp(P.insureUntil));
  if (P.freeRepair) out.push("🔧 " + P.freeRepair + "× Werkstatt gratis");
  if (P.coupon) out.push("🏷️ −20 % aufs nächste Fahrzeug");
  return out;
}

/* ------------------------------ Öffnen ------------------------------ */
let lucky = null;
function luckyEl() {
  let el = document.getElementById("lucky");
  if (!el) { el = document.createElement("div"); el.id = "lucky"; document.body.appendChild(el); }
  return el;
}
function openLucky() {
  const L = luckyState();
  if (!L.boxes.length) return toast("Keine Luckybox da – alle drei Tagesaufgaben schaffen!", "warn");
  if (lucky) return;
  /* goldene zuerst */
  L.boxes.sort((a, b) => (b.kind === "gold") - (a.kind === "gold"));
  const box = L.boxes[0];
  lucky = { box, stage: "closed" };
  if (typeof closeModal === "function") closeModal();
  const el = luckyEl();
  el.className = "on" + (box.kind === "gold" ? " gold" : "");
  document.body.classList.add("lucky-open");
  el.innerHTML = `<div class="lk-stage">
    <div class="lk-top"><b>${box.kind === "gold" ? "💎 Goldene Luckybox" : "🎁 Luckybox"}</b><small>${esc(box.why)}${L.boxes.length > 1 ? " · noch " + (L.boxes.length - 1) + " weitere" : ""}</small></div>
    <div class="lk-box" id="lkBox"><div class="lk-lid"></div><div class="lk-body"></div><div class="lk-rib"></div><div class="lk-bow"><i></i><i></i></div></div>
    <div class="lk-hint" id="lkHint">Antippen zum Öffnen</div>
    <div class="lk-reel" id="lkReel"><div class="lk-strip" id="lkStrip"></div><div class="lk-mark"></div></div>
    <div class="lk-prize" id="lkPrize"></div>
    <button class="wl-cancel" id="lkLater">Später öffnen</button>
    <div class="lk-odds">${["c", "r", "e", "l"].map(k => `<span>${RARITY[k].name} ${LUCKY_ODDS[box.kind][k]} %</span>`).join(" · ")}</div>
  </div>`;
  $("#lkBox").onclick = () => spinLucky();
  $("#lkLater").onclick = () => closeLucky();
}
function tileHTML(p) {
  return `<div class="lk-tile" style="--rc:${RARITY[p.r].col}"><span>${p.icon}</span><small>${esc(p.name.replace("Hauptpreis: ", ""))}</small></div>`;
}
function spinLucky() {
  if (!lucky || lucky.stage !== "closed") return;
  lucky.stage = "spin";
  const L = luckyState();
  L.boxes.shift();                       /* ab hier gehört der Preis dir */
  L.opened++;
  const win = rollPrize(lucky.box.kind);
  lucky.win = win;
  save();
  const WIN = 34, tiles = [];
  for (let i = 0; i < 42; i++) tiles.push(i === WIN ? win : rollPrize("std"));
  const box = $("#lkBox"); box.classList.add("shake");
  $("#lkHint").textContent = "…";
  $("#lkLater").style.visibility = "hidden";
  setTimeout(() => {
    box.classList.add("open");
    const reel = $("#lkReel"), strip = $("#lkStrip");
    strip.innerHTML = tiles.map(tileHTML).join("");
    reel.classList.add("on");
    const tw = strip.firstElementChild.getBoundingClientRect().width + 8;
    const center = reel.clientWidth / 2;
    const jitter = (Math.random() - 0.5) * (tw * 0.5);
    const x = -(WIN * tw + tw / 2 - center + jitter);
    requestAnimationFrame(() => {
      strip.style.transition = "transform 4.6s cubic-bezier(.08,.72,.12,1)";
      strip.style.transform = `translateX(${x}px)`;
    });
    setTimeout(() => revealLucky(), 4800);
  }, 700);
}
function revealLucky() {
  if (!lucky || !lucky.win) return;
  const p = lucky.win, txt = applyPrize(p);
  lucky.stage = "done";
  const el = $("#lkPrize"), rc = RARITY[p.r];
  el.innerHTML = `<div class="lk-card r-${p.r}" style="--rc:${rc.col}">
    <small>${rc.name}</small><span>${p.icon}</span><b>${esc(p.name)}</b><p>${esc(txt)}</p>
    <button class="btn" id="lkOk">${luckyState().boxes.length ? "Nächste Box öffnen" : "Einsammeln"}</button></div>`;
  el.classList.add("on");
  $("#lkHint").textContent = "";
  if (p.r === "l" || p.r === "e") confetti(el, p.r === "l" ? 60 : 30, rc.col);
  if (navigator.vibrate) { try { navigator.vibrate(p.r === "l" ? [80, 60, 80, 60, 160] : 30); } catch (_) { /* egal */ } }
  $("#lkOk").onclick = () => { const more = luckyState().boxes.length; closeLucky(); if (more) setTimeout(openLucky, 120); };
}
function confetti(host, n, col) {
  const cols = [col, "#ffffff", "#19b8c9", "#ff8a3d", "#2fa85c"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "lk-conf";
    c.style.left = (50 + (Math.random() - 0.5) * 30) + "%";
    c.style.background = cols[i % cols.length];
    c.style.setProperty("--dx", ((Math.random() - 0.5) * 320).toFixed(0) + "px");
    c.style.setProperty("--dy", (-(120 + Math.random() * 260)).toFixed(0) + "px");
    c.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
    c.style.animationDelay = (Math.random() * 0.15).toFixed(2) + "s";
    host.appendChild(c);
    setTimeout(() => c.remove(), 1800);
  }
}
function closeLucky() {
  lucky = null;
  const el = document.getElementById("lucky"); if (!el) return;
  el.className = ""; el.innerHTML = "";
  document.body.classList.remove("lucky-open");
  if (typeof renderGoalsChip === "function") renderGoalsChip();
}
/* Regal im Ziele-Fenster */
function luckyShelfHTML() {
  const L = luckyState();
  const std = L.boxes.filter(b => b.kind !== "gold").length, gold = L.boxes.filter(b => b.kind === "gold").length;
  const chips = perkChips();
  /* Wer gestern nicht alles geschafft hat, fängt wieder bei null an */
  const streak = L.lastSet >= dayOf(S.time) - 1 ? L.streak || 0 : 0;
  return `<div class="lk-shelf${L.boxes.length ? " has" : ""}">
    <div class="lk-shelf-t"><b>🎁 Luckybox</b><small>Alle drei Tagesaufgaben = 1 Box · 7 Tage in Folge = 💎 goldene Box · pünktliche Sonderfahrt = Dankeschön-Box</small></div>
    <div class="lk-shelf-r"><span class="lk-count">🎁 ${std}</span><span class="lk-count gold">💎 ${gold}</span>
      <button class="btn tiny${L.boxes.length ? "" : " disabled"}" id="lkOpen">Öffnen</button></div>
    <div class="lk-streak">🔥 ${streak} ${streak === 1 ? "Tag" : "Tage"} in Folge alles geschafft · 💎 goldene Box in ${7 - (streak % 7)} ${7 - (streak % 7) === 1 ? "Tag" : "Tagen"}</div>
    ${chips.length ? `<div class="lk-perks">${chips.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : ""}
    <div class="lk-main">Hauptpreis: 🏆 der <b>Goldene Bulli</b> – VW T1 Samba „Goldstück“, +10 % Erlös auf jeder Tour, nicht käuflich.</div>
  </div>`;
}
