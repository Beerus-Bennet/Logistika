/* =========================================================================
   LOGISTIKA – Luckybox
   Wer an einem Tag alle drei Tagesaufgaben schafft, bekommt eine Luckybox.
   Sieben volle Tage in Folge geben eine goldene, eine pünktliche
   Sonderfahrt eine als Dankeschön. Beim Öffnen läuft ein Band mit Preisen
   durch und bleibt auf dem Gewinn stehen. Hauptpreis: der Goldene Bulli.
   v266: Öffnen-Bühne neu gestaltet (siehe Abschnitt „Öffnen“), Logik unverändert.
   v268: Kiste und Glücksrad in 3D (lucky3d.js); ohne WebGL 2 die Bühne aus v266.
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
  { id: "head", r: "e", icon: "🕴️", name: "Headhunter", desc: () => (S.bases || []).length ? "Eine ★★★★★-Fachkraft bewirbt sich – in jedem Büro, ohne Gebühr" : "Noch kein Büro – dafür " + money(luckyCash() * 3) },
  { id: "vip", r: "e", icon: "✉️", name: "Insider-Tipp", desc: () => level() >= 3 ? "Sonderfahrt-Einladung kommt in wenigen Stunden" : "Noch zu früh für Einladungen – dafür " + money(luckyCash() * 3) },
  { id: "bulli", r: "l", icon: "🏆", name: "Hauptpreis: Goldener Bulli", desc: () => ownsBulli()
      ? "Den hast du schon – dafür der Jackpot: " + money(luckyJackpot())
      : "VW T1 Samba „Goldstück“: 900 kg, 95 km/h, +10 % Erlös pro Tour. Nicht käuflich." }
];
const LUCKY_ODDS = { std: { c: 55, r: 28, e: 13, l: 4 }, gold: { c: 25, r: 40, e: 27, l: 8 } };
const luckyCash = () => roundK(rnd(300, 800) * stageK(), 10);
const luckyXP = () => 60 + level() * 40;
const luckyJackpot = () => roundK(25000 * stageK(), 100);
const ownsBulli = () => S.fleet.some(f => f.type === "v-goldbulli");

function luckyState() { if (!S.lucky) S.lucky = { boxes: [], opened: 0, streak: 0, lastSet: -9, log: [] }; return S.lucky; }
/* v156: Headhunter-Bewerbung für ein Büro (einmalig je Büro); gibt die Kandidatin/den Kandidaten zurück oder null */
function luckyHeadFor(b) {
  if (!b || (b.pool || []).some(x => x.hh)) return null;   /* wartet dort schon eine */
  const c = makeCandidate(false); c.skill = 5; c.fee = 0; c.wage = Math.round(ROLES[c.role].wage * 1.6);
  c.trait = "kommt über den Headhunter – und weiß das auch"; c.hh = true;
  (b.pool = b.pool || []).unshift(c);
  return { name: c.name, role: c.role, b };
}
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
    case "xp": addXP(luckyXP()); checkLevel(); break;
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
      /* v156: jedes Büro bekommt seine eigene ★★★★★-Fachkraft (eine je Büro und Gewinn) – auch Büros, die später dazukommen */
      const bs = S.bases || [];
      if (bs.length) {
        P.hhAll = true;
        const got = bs.map(b => luckyHeadFor(b)).filter(Boolean);
        txt = got.length === 1 ? got[0].name + " (" + ROLES[got[0].role].name + ", ★★★★★) wartet in " + N[got[0].b.node].short + " – ohne Gebühr."
          : got.length ? got.length + " ★★★★★-Fachkräfte warten – in jedem Büro eine, ohne Gebühr." : "In allen Büros wartet schon eine Headhunter-Fachkraft.";
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
/* v266: Bühne neu gestaltet – ruhiger und hochwertiger (dunkle Transportkiste mit Metallkanten statt Comic-Geschenk,
   klare Schrift, Gewinnchancen dezent, aber immer sichtbar) und mit mehr Belohnungsgefühl:
   1. Aufladen: Die Kiste ruckelt stärker, aus der Fuge dringt Licht, das Stufe für Stufe bis zur Farbe des Gewinns steigt
      (Gewöhnlich bleibt hell, Selten wird grün, Episch violett, Legendär gold) – mit steigenden Tönen.
   2. Band: läuft mit leisem Klicken je Feld, wird langsamer, das Feld unter der Markierung leuchtet, am Ende rastet es mittig ein.
   3. Enthüllung: Blitz in der Seltenheitsfarbe, Strahlenkranz, Karte dreht sich herein, Beträge zählen hoch, Funken bzw. Konfetti,
      bei Legendär zusätzlich Goldregen und ein kurzes Beben. Danach Fortschritt zur goldenen Box.
   Chancen, Preise und Wirkungen sind unverändert (rollPrize, applyPrize). Töne nur mit eingeschaltetem Spielton (S.farm.snd),
   „Bewegung reduzieren“ kürzt alles auf das Nötige. */
let lucky = null;
const lbReduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
const LB_RANK = { c: 0, r: 1, e: 2, l: 3 };
function luckyEl() {
  let el = document.getElementById("lucky");
  if (!el) { el = document.createElement("div"); el.id = "lucky"; document.body.appendChild(el); }
  return el;
}
const lbLater = (fn, ms) => { if (!lucky) return; const id = setTimeout(() => { if (lucky) fn(); }, ms); lucky.timers.push(id); };
/* Töne (Web Audio, gleicher Kontext wie Hof und Jagd) */
function lbAudio() {
  if (typeof S === "undefined" || !S.farm || !S.farm.snd || typeof farmAC === "undefined") return null;
  try { if (!farmAC) farmAC = new (window.AudioContext || window.webkitAudioContext)(); if (farmAC.state === "suspended") farmAC.resume(); return farmAC; } catch (e) { return null; }
}
function lbTone(f, d, o) {
  const ac = lbAudio(); if (!ac) return;
  o = o || {};
  const t = ac.currentTime + (o.at || 0), osc = ac.createOscillator(), g = ac.createGain();
  osc.type = o.type || "sine"; osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || 0.05, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  osc.connect(g); g.connect(ac.destination); osc.start(t); osc.stop(t + d + 0.03);
}
function lbNoise(d, vol, f0, f1) {
  const ac = lbAudio(); if (!ac) return;
  const b = ac.createBuffer(1, Math.floor(ac.sampleRate * d), ac.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / ch.length);
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(), t = ac.currentTime;
  f.type = "bandpass"; f.Q.value = 0.8; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d);
  s.buffer = b; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
}
const lbTick = () => lbTone(2100 + Math.random() * 250, 0.022, { type: "square", vol: 0.016 });
const LB_FANFARE = { c: [[880, 0]], r: [[784, 0], [1175, 0.09]], e: [[659, 0], [988, 0.08], [1319, 0.16]], l: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3], [1319, 0.44]] };
function lbFanfare(r) { const F = LB_FANFARE[r]; F.forEach(([f, at], i) => lbTone(f, i === F.length - 1 ? 0.7 : 0.24, { type: "triangle", vol: r === "l" ? 0.07 : 0.055, at })); }
const lbBuzz = p => { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (_) { /* egal */ } } };

function lbStreakHTML() {
  const L = luckyState(), s = L.lastSet >= dayOf(S.time) - 1 ? L.streak || 0 : 0, k = s % 7, left = 7 - k;
  return `<div class="lb-streak" aria-label="Serie ${s} Tage, goldene Box in ${left} Tagen">
    <div class="lb-streak-t"><span>🔥 Serie <b>${s} ${s === 1 ? "Tag" : "Tage"}</b></span><span>💎 Goldene Box in <b>${left} ${left === 1 ? "Tag" : "Tagen"}</b></span></div>
    <div class="lb-streak-bar">${Array.from({ length: 7 }, (_, i) => `<i class="${i < k ? "on" : ""}${i === 6 ? " gem" : ""}"></i>`).join("")}</div></div>`;
}
function openLucky() {
  const L = luckyState();
  if (!L.boxes.length) return toast("Keine Luckybox da – alle drei Tagesaufgaben schaffen!", "warn");
  if (lucky) return;
  /* goldene zuerst */
  L.boxes.sort((a, b) => (b.kind === "gold") - (a.kind === "gold"));
  const box = L.boxes[0], gold = box.kind === "gold", odds = LUCKY_ODDS[box.kind] || LUCKY_ODDS.std, more = L.boxes.length - 1;
  lucky = { box, stage: "closed", timers: [], raf: 0, g3: null };
  if (typeof closeModal === "function") closeModal();
  const el = luckyEl();
  el.className = "on lb" + (gold ? " gold" : "");
  el.removeAttribute("data-r"); el.removeAttribute("data-tease"); el.style.removeProperty("--rc"); el.style.removeProperty("--tc");
  document.body.classList.add("lucky-open");
  const kick = gold ? "Serienbelohnung" : /Sonderfahrt/.test(box.why) ? "Bonus" : "Tagesbelohnung";
  el.innerHTML = `<div class="lb-stage" role="dialog" aria-modal="true" aria-label="${gold ? "Goldene Luckybox" : "Luckybox"}">
    <div class="lb-head">
      <small class="lb-kick">${kick}</small>
      <h2 class="lb-title">${gold ? "Goldene Luckybox" : "Luckybox"}</h2>
      <p class="lb-sub">${esc(box.why)}${more ? ` · <b>noch ${more} ${more === 1 ? "weitere" : "weitere"}</b>` : ""}</p>
    </div>
    <div class="lb-odds" aria-label="Gewinnchancen">
      <div class="lb-oddbar">${["c", "r", "e", "l"].map(k => `<i style="flex:${odds[k]};--rc:${RARITY[k].col}"></i>`).join("")}</div>
      <div class="lb-oddrow">${["c", "r", "e", "l"].map(k => `<span style="--rc:${RARITY[k].col}"><i></i>${RARITY[k].name}<b>${odds[k]} %</b></span>`).join("")}</div>
    </div>
    <div class="lb-scene" id="lbScene">
      <div class="lb-rays" id="lbRays"></div>
      <button class="lb-case" id="lbCase" aria-label="Luckybox öffnen">
        <span class="lb-shadow"></span>
        <span class="lb-beam"></span>
        <span class="lb-body"><i class="lb-strap"></i><span class="lb-emb"><span>${gold ? "★" : "L"}</span></span><i class="lb-rivet a"></i><i class="lb-rivet b"></i></span>
        <span class="lb-seam"></span>
        <span class="lb-lid"><i class="lb-strap"></i><i class="lb-handle"></i></span>
      </button>
      <div class="lb-reel" id="lbReel"><div class="lb-strip" id="lbStrip"></div><div class="lb-mark"></div></div>
      <div class="lb-prize" id="lbPrize" aria-live="polite"></div>
      <div class="lb-flash" id="lbFlash"></div>
    </div>
    <div class="lb-now" id="lbNow" aria-hidden="true"></div>
    <p class="lb-hint" id="lbHint">Tippe auf die Kiste, um sie zu öffnen</p>
    <div class="lb-foot" id="lbFoot">${lbStreakHTML()}
      <div class="lb-btns" id="lbBtns"><button class="lb-later" id="lbLater">Später öffnen</button></div></div>
  </div>`;
  $("#lbCase").onclick = () => spinLucky();
  $("#lbLater").onclick = () => closeLucky();
  /* v268: Kiste und Glücksrad in 3D (lucky3d.js, gl3d.js); ohne WebGL 2 bleibt die Bühne aus v266 */
  if (typeof LUCKY3D !== "undefined") {
    try { lucky.g3 = LUCKY3D.open($("#lbScene"), { gold, odds, prizes: PRIZES, rarity: RARITY, reduced: lbReduced() }); } catch (e) { console.warn("Luckybox 3D", e); lucky.g3 = null; }
    if (lucky.g3) el.classList.add("is3d");
  }
}
function tileHTML(p) {
  return `<div class="lb-tile r-${p.r}" style="--rc:${RARITY[p.r].col}"><span>${p.icon}</span><small>${esc(p.name.replace("Hauptpreis: ", ""))}</small></div>`;
}
function lbFlash(col, a) {
  const f = $("#lbFlash"); if (!f || lbReduced()) return;
  f.style.setProperty("--fc", col); f.style.setProperty("--fa", a);
  f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
}
/* 1. Aufladen: Licht steigt Stufe für Stufe bis zur Seltenheit des Gewinns */
function spinLucky() {
  if (!lucky || lucky.stage !== "closed") return;
  lucky.stage = "charge";
  const L = luckyState();
  L.boxes.shift();                       /* ab hier gehört der Preis dir */
  L.opened++;
  const win = rollPrize(lucky.box.kind);
  lucky.win = win;
  save();
  const el = luckyEl(), cs = $("#lbCase"), red = lbReduced(), top = LB_RANK[win.r], order = ["c", "r", "e", "l"];
  $("#lbHint").textContent = ""; $("#lbBtns").classList.add("hide");
  cs.classList.add("charge"); cs.disabled = true;
  const step = red ? 0 : 380;
  for (let i = 0; i <= top; i++) lbLater(() => {
    el.dataset.tease = order[i]; el.style.setProperty("--tc", RARITY[order[i]].col);
    cs.style.setProperty("--amp", (1 + i * 0.6).toFixed(2));
    lbTone(330 * Math.pow(1.335, i), 0.32, { type: "triangle", vol: 0.045 }); lbBuzz(12 + i * 10);
    if (i) lbFlash(RARITY[order[i]].col, 0.18 + i * 0.06);
    if (lucky.g3) lucky.g3.charge(i, RARITY[order[i]].col);
  }, 180 + i * step);
  lbLater(() => {
    cs.classList.add("burst"); lbFlash(RARITY[win.r].col, 0.5); lbNoise(0.45, 0.06, 500, 3200); lbBuzz(30);
    if (lucky.g3) lucky.g3.burst(RARITY[win.r].col, () => { if (lucky) lb3dSpin(win); });
    else lbLater(() => lbRoll(win), red ? 0 : 320);
  }, red ? 250 : 180 + top * step + 650);
}
/* v268: Glücksrad in 3D – jedes Feld ein Preis, Feldgröße = Gewinnchance; Klick je Feldgrenze, Name des Felds unter dem Zeiger */
function lb3dSpin(win) {
  lucky.stage = "spin";
  const now = $("#lbNow"), red = lbReduced();
  if (now) now.classList.add("on");
  lucky.g3.spin(win.id, {
    D: red ? 900 : win.r === "l" ? 6400 : win.r === "e" ? 5800 : 5200,
    onTick: p => { lbTick(); if (now) { now.textContent = p.icon + " " + p.name.replace("Hauptpreis: ", ""); now.style.setProperty("--rc", RARITY[p.r].col); } },
    onDone: () => { if (!lucky) return; lbBuzz(18); lucky.g3.celebrate(RARITY[win.r].col); revealLucky(); }
  });
}
/* 2. Band: eigene Bewegung statt CSS-Übergang, damit es klickt, das Feld unter der Markierung leuchtet und am Ende einrastet */
function lbRoll(win) {
  lucky.stage = "spin";
  const reel = $("#lbReel"), strip = $("#lbStrip"), WIN = 38, tiles = [];
  for (let i = 0; i < 46; i++) tiles.push(i === WIN ? win : rollPrize("std"));
  strip.innerHTML = tiles.map(tileHTML).join("");
  reel.classList.add("on");
  const els = [...strip.children], gap = 10, tw = els[0].getBoundingClientRect().width + gap, pad = 10, center = reel.clientWidth / 2;
  const target = -(pad + WIN * tw + (tw - gap) / 2 - center), jit = (Math.random() - 0.5) * tw * 0.56;
  const red = lbReduced(), D = red ? 900 : win.r === "l" ? 5600 : win.r === "e" ? 5000 : 4500, SNAP = red ? 0 : 340;
  let t0 = null, idx = -1;
  const ease = u => 1 - Math.pow(1 - u, 5);
  const frame = now => {
    if (!lucky) return;
    if (t0 == null) t0 = now;
    const t = now - t0;
    let x;
    if (t < D) x = (target + jit) * ease(t / D);
    else { const u = Math.min(1, (t - D) / Math.max(1, SNAP)), e = u * u * (3 - 2 * u); x = target + jit * (1 - e); }
    strip.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    const i = Math.floor((center - pad - x) / tw);
    if (i !== idx && i >= 0 && i < els.length) {
      if (els[idx]) els[idx].classList.remove("hot");
      els[i].classList.add("hot"); idx = i;
      if (t < D) { lbTick(); if (t > D * 0.6) lbBuzz(4); }
    }
    if (t < D + SNAP) lucky.raf = requestAnimationFrame(frame);
    else { els[WIN].classList.add("hot"); lbBuzz(18); revealLucky(); }
  };
  lucky.raf = requestAnimationFrame(frame);
}
/* Beträge in der Gewinnzeile hochzählen (erste Geldangabe im Text) */
function lbCount(el, txt) {
  const m = /(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s(Mio\. |Mrd\. )?€/.exec(txt);
  if (!m || m[2] || lbReduced()) return;
  const v = parseFloat(m[1].replace(/\./g, "").replace(",", ".")), D = 900, t0 = performance.now(), pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
  const run = now => {
    if (!lucky || !el.isConnected) return;
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
    el.textContent = pre + (k < 1 ? money(Math.round(v * e)) : m[0]) + post;
    if (k < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}
function lbSparks(host, n, cols, kind) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "lb-p " + kind;
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 170;
    c.style.background = cols[i % cols.length];
    c.style.setProperty("--dx", (Math.cos(a) * d).toFixed(0) + "px");
    c.style.setProperty("--dy", (Math.sin(a) * d * 0.8 - 40).toFixed(0) + "px");
    c.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
    c.style.animationDelay = (Math.random() * 0.18).toFixed(2) + "s";
    host.appendChild(c);
    setTimeout(() => c.remove(), 2200);
  }
}
function lbCoins(host, n) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "lb-coin";
    c.style.left = (Math.random() * 100).toFixed(1) + "%";
    c.style.animationDelay = (Math.random() * 0.9).toFixed(2) + "s";
    c.style.animationDuration = (1.4 + Math.random() * 0.8).toFixed(2) + "s";
    host.appendChild(c);
    setTimeout(() => c.remove(), 3600);
  }
}
/* 3. Enthüllung */
function revealLucky() {
  if (!lucky || !lucky.win || lucky.stage === "done") return;
  const p = lucky.win, txt = applyPrize(p), rc = RARITY[p.r], el = luckyEl(), red = lbReduced();
  lucky.stage = "done";
  el.dataset.r = p.r; el.style.setProperty("--rc", rc.col);
  lbFanfare(p.r);
  lbBuzz(p.r === "l" ? [80, 60, 80, 60, 160] : p.r === "e" ? [40, 40, 60] : 30);
  lbLater(() => {
    lbFlash(rc.col, p.r === "l" ? 0.85 : p.r === "e" ? 0.7 : 0.5);
    $("#lbReel").classList.add("away");
    if (p.r !== "c") $("#lbRays").classList.add("on");
    const pr = $("#lbPrize");
    pr.innerHTML = `<div class="lb-card r-${p.r}" style="--rc:${rc.col}">
      <span class="lb-card-rar">${rc.name}</span>
      <div class="lb-card-ico"><span>${p.icon}</span></div>
      <b class="lb-card-name">${esc(p.name)}</b>
      <p class="lb-card-txt" id="lbTxt">${esc(txt)}</p></div>`;
    pr.classList.add("on");
    lbCount($("#lbTxt"), txt);
    const scene = $("#lbScene");
    if (!red) {
      const cols = [rc.col, "#ffffff", p.r === "l" ? "#fff2b0" : "#9fd8ff"];
      lbSparks(scene, p.r === "l" ? 70 : p.r === "e" ? 44 : p.r === "r" ? 22 : 10, cols, p.r === "c" || p.r === "r" ? "spark" : "conf");
      if (p.r === "l") { lbCoins(el, 46); el.classList.add("quake"); lbLater(() => el.classList.remove("quake"), 650); }
    }
    const more = luckyState().boxes.length;
    lbLater(() => {
      const bt = $("#lbBtns");
      bt.innerHTML = `<button class="lb-go" id="lkOk">${more ? "Nächste Box öffnen" : "Einsammeln"}${more ? `<small>noch ${more}</small>` : ""}</button>${more ? `<button class="lb-later" id="lbLater">Später</button>` : ""}`;
      bt.classList.remove("hide");
      $("#lkOk").onclick = () => { const m = luckyState().boxes.length; closeLucky(); if (m) setTimeout(openLucky, 120); };
      const lt = $("#lbLater"); if (lt) lt.onclick = () => closeLucky();
      const ok = $("#lkOk"); if (ok) try { ok.focus({ preventScroll: true }); } catch (e) { /* egal */ }
    }, red ? 0 : 700);
  }, red ? 0 : 380);
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
  if (lucky) {
    lucky.timers.forEach(clearTimeout); cancelAnimationFrame(lucky.raf);                       /* v266: laufende Effekte beenden */
    if (lucky.g3) { try { lucky.g3.close(); } catch (e) { /* egal */ } lucky.g3 = null; }     /* v268: 3D-Bühne freigeben */
    /* v266: Wer während des Öffnens schließt (Escape, Zurück), verliert den Gewinn nicht – vorher war er weg */
    if (lucky.win && lucky.stage !== "done") { const p = lucky.win; lucky.stage = "done"; const txt = applyPrize(p); toast(p.icon + " " + p.name + ": " + txt, "ok"); }
  }
  lucky = null;
  const el = document.getElementById("lucky"); if (!el) return;
  el.className = ""; el.innerHTML = "";
  el.removeAttribute("data-r"); el.removeAttribute("data-tease"); el.style.removeProperty("--rc"); el.style.removeProperty("--tc");
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
    <div class="lk-shelf-t"><b>🎁 Luckybox</b><small>3 Tagesaufgaben = 1 Box · 7 Tage in Folge = 💎 · pünktliche Sonderfahrt = Bonus-Box</small></div>
    <div class="lk-shelf-r"><span class="lk-count">🎁 ${std}</span><span class="lk-count gold">💎 ${gold}</span>
      <button class="btn tiny${L.boxes.length ? "" : " disabled"}" id="lkOpen">Öffnen</button></div>
    <div class="lk-streak">🔥 ${streak} ${streak === 1 ? "Tag" : "Tage"} in Folge alles geschafft · 💎 goldene Box in ${7 - (streak % 7)} ${7 - (streak % 7) === 1 ? "Tag" : "Tagen"}</div>
    ${chips.length ? `<div class="lk-perks">${chips.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : ""}
    <div class="lk-main">Hauptpreis: 🏆 <b>Goldener Bulli</b> – +10 % Erlös pro Tour, nicht käuflich.</div>
  </div>`;
}
