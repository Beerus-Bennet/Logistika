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
/* v266: Bühne neu gestaltet – ruhiger und hochwertiger. v268: Kiste und Glücksrad in 3D (lucky3d.js).
   v270: Ablauf als zusammenhängende Folge und kürzer (normale Box ≈ 5 s, goldene ≈ 5,5–6 s bis zur lesbaren Karte):
     1. Antippen: kurze Reaktion.  2. Aufladen: Licht aus der Deckelfuge in der Farbe der Box (normal kühl, golden warm) –
     verrät den Gewinn nicht mehr.  3. Deckel öffnet, Licht aus dem Innenraum.  4. Kamerafahrt nach oben zum Rad.
     5. Rad dreht (immer gleich lang je Boxart) und bremst stetig auf dem gezogenen Preis ab.  6. Kurzer Halt, Gewinnerfeld
     leuchtet (bei Episch/Legendär etwas länger).  7. Gewinnkarte.
   Sicherung: Der Gewinn wird beim Antippen genau einmal gezogen und mit der Box zusammen gespeichert (S.lucky.pending);
   angewendet wird er genau einmal beim Enthüllen, Überspringen oder Schließen (lbSettle). Wird die Seite mittendrin neu
   geladen, zeigt das nächste Öffnen diesen Gewinn, ohne eine neue Box zu verbrauchen. Jede Öffnung hat eine Kennung
   (lucky.id) – Zeitgeber und Rückrufe einer alten Öffnung greifen nie auf die nächste zu.
   Überspringen (bei weiteren wartenden Boxen) zeigt sofort das schon gezogene Ergebnis. „Bewegung reduzieren“: keine
   Kamerafahrt, kein Drehen, keine Blitze – kurze Überblendung zur Karte. Töne nur mit eingeschaltetem Spielton (S.farm.snd).
   Einheitliche Symbole (lbIcon) auf Rad, Band, Anzeige und Karte. */
let lucky = null, lbSeq = 0;
const lbReduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
const LB_RANK = { c: 0, r: 1, e: 2, l: 3 };
/* Farbe der Box beim Aufladen (Qualität der Box, nicht des Gewinns) */
const LB_BOXCOL = { std: "#a9d8ff", gold: "#ffd36a" };
/* Zeitplan je Boxart (ms ab dem Antippen; Rad: ta/tb/tc in s = beschleunigen, gleichmäßig, abbremsen) */
const LB_TIME = {
  std: { pulses: 3, step: 250, open: 880, cam: 1150, camD: 1000, spin: 1600, ta: 0.35, tb: 0.5, tc: 1.75, turns: 3 },
  gold: { pulses: 4, step: 240, open: 1080, cam: 1350, camD: 1000, spin: 1800, ta: 0.35, tb: 0.65, tc: 2.0, turns: 4 }
};
const LB_HOLD = { c: 450, r: 550, e: 750, l: 950 };
function luckyEl() {
  let el = document.getElementById("lucky");
  if (!el) { el = document.createElement("div"); el.id = "lucky"; document.body.appendChild(el); }
  return el;
}
/* Zeitgeber gehören zur Öffnung, die sie gestellt hat */
const lbLater = (fn, ms) => { if (!lucky) return; const id = lucky.id; const h = setTimeout(() => { if (lucky && lucky.id === id) fn(); }, ms); lucky.timers.push(h); };
const lbMine = fn => { const id = lucky && lucky.id; return (...a) => { if (lucky && lucky.id === id) fn(...a); }; };

/* ---- Symbole: eigene Zeichnungen (Canvas), gleiche Strichstärke und Größe, gut auf dunklen und farbigen Flächen ---- */
const LB_INK = "#0d1420";
function lbIconPaint(g, id) {
  const TAU = Math.PI * 2;
  const P = (fill, fn, lw) => { g.beginPath(); fn(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw !== 0) { g.lineWidth = lw || 6; g.strokeStyle = LB_INK; g.stroke(); } };
  const HL = (fn, a) => { g.beginPath(); fn(); g.fillStyle = "rgba(255,255,255," + (a || 0.35) + ")"; g.fill(); };
  const line = (pts, w, col) => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y)); g.lineWidth = w; g.strokeStyle = col || LB_INK; g.stroke(); };
  const fat = (pts, col) => { line(pts, 14); line(pts, 7, col); };
  const rr = (x, y, w, h, r) => { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const circ = (x, y, r) => g.arc(x, y, r, 0, TAU);
  const star = (cx, cy, R, r, n) => { n = n || 5; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; g[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.closePath(); };
  g.lineJoin = "round"; g.lineCap = "round";
  switch (id) {
    case "cash":                                                     /* Geldschein und zwei Münzen */
      g.save(); g.translate(60, 48); g.rotate(-0.16);
      P("#5cb87a", () => rr(-46, -26, 92, 52, 8)); HL(() => rr(-40, -20, 80, 12, 5), 0.25);
      P(null, () => rr(-36, -17, 72, 34, 5), 4); P("#a6e2b9", () => circ(0, 0, 10), 4);
      g.restore();
      [[44, 86], [80, 94]].forEach(([x, y]) => { P("#f2c443", () => circ(x, y, 21)); HL(() => circ(x - 6, y - 7, 7), 0.45); P(null, () => circ(x, y, 12), 4); });
      break;
    case "xp":                                                       /* Stern mit Aufwärtspfeil */
      P("#f6c445", () => star(58, 60, 47, 21)); HL(() => star(50, 50, 16, 7), 0.4);
      P("#39b26b", () => circ(94, 94, 20));
      P("#ffffff", () => { g.moveTo(94, 80); g.lineTo(106, 94); g.lineTo(99, 94); g.lineTo(99, 105); g.lineTo(89, 105); g.lineTo(89, 94); g.lineTo(82, 94); g.closePath(); }, 4);
      break;
    case "fuel":                                                     /* Tankkarte mit Zapfsäule */
      P("#3d7be0", () => rr(12, 28, 104, 70, 10)); HL(() => rr(18, 33, 92, 10, 4), 0.25);
      g.fillStyle = "#2a5cae"; g.fillRect(14, 46, 100, 12);
      P("#f2c443", () => rr(22, 68, 22, 17, 3), 4);
      P("#ffffff", () => rr(66, 62, 22, 28, 3), 4); g.fillStyle = "#3d7be0"; g.fillRect(70, 66, 14, 8);
      line([[88, 70], [96, 70], [98, 84], [92, 86]], 5);
      break;
    case "repair":                                                   /* Gutschein mit Schraubenschlüssel */
      g.save(); g.translate(64, 74); g.rotate(0.2);
      P("#ff9d4d", () => rr(-46, -24, 92, 48, 7)); HL(() => rr(-40, -18, 80, 9, 4), 0.25);
      g.setLineDash([5, 6]); line([[22, -18], [22, 18]], 3); g.setLineDash([]);
      g.restore();
      g.save(); g.translate(58, 56); g.rotate(-0.8);
      P("#c3cdd9", () => rr(-8, -18, 16, 62, 7)); P("#c3cdd9", () => circ(0, -30, 18)); HL(() => rr(-4, -12, 5, 48, 2), 0.45);
      P("#4f5c72", () => rr(-6, -50, 12, 18, 3), 4);
      g.restore();
      break;
    case "mood":                                                     /* Kaffeetasse mit Dampf */
      P("#e7dfcf", () => g.ellipse(62, 100, 46, 11, 0, 0, TAU));
      P(null, () => g.arc(96, 68, 12, -1.5, 1.5), 7);
      P("#f7f2e8", () => { g.moveTo(26, 50); g.lineTo(98, 50); g.lineTo(91, 88); g.quadraticCurveTo(62, 106, 33, 88); g.closePath(); });
      HL(() => { g.moveTo(34, 56); g.lineTo(44, 56); g.lineTo(42, 86); g.lineTo(36, 82); g.closePath(); }, 0.6);
      P("#7a4a2a", () => g.ellipse(62, 50, 36, 7, 0, 0, TAU), 4);
      [[50, 0], [70, 1]].forEach(([x, k]) => { g.beginPath(); g.moveTo(x, 38); g.bezierCurveTo(x - 8, 30, x + 8, 22, x - (k ? 2 : -2), 12); g.lineWidth = 5; g.strokeStyle = LB_INK; g.stroke(); });
      break;
    case "rep":                                                      /* Schreiben mit rotem Siegel */
      g.save(); g.translate(56, 60); g.rotate(-0.08);
      P("#fbf5e6", () => rr(-36, -46, 72, 92, 6)); HL(() => rr(-30, -40, 12, 80, 4), 0.35);
      [-28, -15, -2, 11].forEach((y, i) => line([[-22, y], [i === 3 ? 6 : 22, y]], 4, "#8f9bb0"));
      g.restore();
      P("#d8434f", () => { g.moveTo(80, 96); g.lineTo(72, 120); g.lineTo(84, 114); g.lineTo(90, 122); g.lineTo(96, 98); g.closePath(); });
      P("#d8434f", () => star(88, 88, 21, 16, 10)); P("#f0909a", () => circ(88, 88, 9), 4);
      break;
    case "insure":                                                   /* Schild mit Haken */
      P("#3f86e8", () => { g.moveTo(64, 12); g.lineTo(106, 27); g.lineTo(104, 62); g.quadraticCurveTo(100, 98, 64, 117); g.quadraticCurveTo(28, 98, 24, 62); g.lineTo(22, 27); g.closePath(); });
      HL(() => { g.moveTo(64, 20); g.lineTo(64, 108); g.quadraticCurveTo(34, 92, 31, 62); g.lineTo(29, 32); g.closePath(); }, 0.22);
      fat([[44, 64], [58, 80], [86, 46]], "#ffffff");
      break;
    case "coupon":                                                   /* Preisschild mit Prozentzeichen */
      line([[96, 30], [108, 14]], 5);
      g.save(); g.translate(62, 66); g.rotate(-0.62);
      P("#ff8a3d", () => { g.moveTo(-44, -24); g.lineTo(20, -24); g.lineTo(48, 0); g.lineTo(20, 24); g.lineTo(-44, 24); g.closePath(); });
      HL(() => { g.moveTo(-38, -18); g.lineTo(16, -18); g.lineTo(22, -12); g.lineTo(-38, -12); g.closePath(); }, 0.3);
      P("#ffffff", () => circ(24, 0, 6), 4);
      P("#ffffff", () => circ(-28, -9, 6), 4); P("#ffffff", () => circ(-6, 9, 6), 4); fat([[-8, -13], [-26, 13]], "#ffffff");
      g.restore();
      break;
    case "boost":                                                    /* Balken mit Pfeil nach oben */
      [[16, 78, 28], [44, 62, 44], [72, 44, 62]].forEach(([x, y, h]) => { P("#4fb071", () => rr(x, y, 22, h, 3)); HL(() => rr(x + 4, y + 4, 5, h - 8, 2), 0.35); });
      fat([[14, 66], [44, 44], [62, 54], [100, 22]], "#ff8a3d");
      P("#ff8a3d", () => { g.moveTo(112, 12); g.lineTo(108, 38); g.lineTo(86, 18); g.closePath(); }, 5);
      break;
    case "head":                                                     /* Fachkraft mit Stern */
      P("#4a6a9e", () => { g.moveTo(20, 116); g.quadraticCurveTo(22, 76, 64, 74); g.quadraticCurveTo(106, 76, 108, 116); g.closePath(); });
      P("#ffffff", () => { g.moveTo(51, 76); g.lineTo(64, 98); g.lineTo(77, 76); g.closePath(); }, 4);
      P("#d8434f", () => { g.moveTo(60, 82); g.lineTo(68, 82); g.lineTo(71, 104); g.lineTo(64, 111); g.lineTo(57, 104); g.closePath(); }, 4);
      P("#f2c9a0", () => circ(64, 46, 23));
      P("#5a3d28", () => { g.moveTo(41, 44); g.quadraticCurveTo(44, 20, 66, 22); g.quadraticCurveTo(88, 22, 87, 44); g.quadraticCurveTo(76, 32, 54, 36); g.quadraticCurveTo(46, 38, 41, 44); g.closePath(); }, 4);
      P("#f6c445", () => star(100, 28, 19, 8));
      break;
    case "vip":                                                      /* Umschlag mit goldenem Stern-Siegel */
      P("#f7f1e3", () => rr(12, 30, 104, 70, 8)); HL(() => rr(18, 36, 10, 58, 4), 0.4);
      line([[18, 92], [52, 64]], 4, "#a59c88"); line([[110, 92], [76, 64]], 4, "#a59c88");
      P(null, () => { g.moveTo(15, 34); g.lineTo(64, 72); g.lineTo(113, 34); }, 6);
      P("#f2c443", () => star(64, 72, 19, 9));
      break;
    case "bulli":                                                    /* goldener Kleinbus, zweifarbig */
      P("#fff1c4", () => rr(10, 34, 108, 62, 18));
      P("#e0a800", () => { g.moveTo(10, 70); g.lineTo(84, 70); g.lineTo(118, 52); g.lineTo(118, 80); g.arcTo(118, 96, 100, 96, 16); g.lineTo(28, 96); g.arcTo(10, 96, 10, 80, 16); g.closePath(); });
      P(null, () => rr(10, 34, 108, 62, 18));
      [22, 44, 66].forEach(x => P("#9fd8ff", () => rr(x, 44, 17, 15, 3), 4));
      P("#9fd8ff", () => rr(92, 44, 18, 15, 4), 4);
      HL(() => rr(16, 38, 90, 4, 2), 0.6);
      [[34, 98], [94, 98]].forEach(([x, y]) => { P("#1b2433", () => circ(x, y, 13)); P("#d9e2ee", () => circ(x, y, 5), 3); });
      break;
    default:
      P("#9fd8ff", () => circ(64, 64, 40));
  }
}
const LB_ICON = {};
/* Symbol als Canvas (px Kantenlänge, Zeichnung im 128er-Raster) mit weichem Schatten; zwischengespeichert */
function lbIcon(id, px) {
  px = Math.max(16, Math.round(px || 128));
  const key = id + ":" + px;
  if (LB_ICON[key]) return LB_ICON[key];
  const a = document.createElement("canvas"); a.width = a.height = px;
  const ga = a.getContext("2d"); ga.scale(px / 128, px / 128); lbIconPaint(ga, id);
  const c = document.createElement("canvas"); c.width = c.height = px;
  const g = c.getContext("2d");
  g.shadowColor = "rgba(0,0,0,.38)"; g.shadowBlur = px / 40; g.shadowOffsetY = px / 64;
  g.drawImage(a, 0, 0);
  return (LB_ICON[key] = c);
}
const LB_ICONURL = {};
const lbIconURL = (id, px) => { const k = id + ":" + px; try { return LB_ICONURL[k] || (LB_ICONURL[k] = lbIcon(id, px).toDataURL()); } catch (e) { return ""; } };
const lbDpr = () => Math.min(3, Math.max(1, window.devicePixelRatio || 1));
const lbImg = (id, css, cls) => `<img class="${cls || "lb-ico"}" src="${lbIconURL(id, Math.round(css * lbDpr()))}" width="${css}" height="${css}" alt="">`;
/* lange Namen dürfen an der Wortfuge umbrechen (weiches Trennzeichen) */
const LB_BREAK = { Trinkgeldkasse: "Trinkgeld|kasse", Erfahrungsschub: "Erfahrungs|schub", Werkstattgutschein: "Werkstatt|gutschein", Kaffeemaschine: "Kaffee|maschine",
  Empfehlungsschreiben: "Empfehlungs|schreiben", Händlerrabatt: "Händler|rabatt", Hochsaison: "Hoch|saison", Headhunter: "Head|hunter" };
const lbName = n => esc(n).split(" ").map(w => (LB_BREAK[w] || w).replace(/\|/g, "&shy;")).join(" ");

/* ---- Töne (Web Audio, gleicher Kontext wie Hof und Jagd); laufende Klänge werden beim Schließen gestoppt ---- */
function lbAudio() {
  if (typeof S === "undefined" || !S.farm || !S.farm.snd || typeof farmAC === "undefined") return null;
  try { if (!farmAC) farmAC = new (window.AudioContext || window.webkitAudioContext)(); if (farmAC.state === "suspended") farmAC.resume(); return farmAC; } catch (e) { return null; }
}
function lbKeep(n) {
  if (!lucky) return;
  const list = lucky.snd; list.push(n);
  n.onended = () => { const i = list.indexOf(n); if (i >= 0) list.splice(i, 1); };
}
function lbTone(f, d, o) {
  const ac = lbAudio(); if (!ac) return;
  o = o || {};
  const t = ac.currentTime + (o.at || 0), osc = ac.createOscillator(), g = ac.createGain();
  osc.type = o.type || "sine"; osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || 0.05, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  osc.connect(g); g.connect(ac.destination); osc.start(t); osc.stop(t + d + 0.03);
  lbKeep(osc);
}
function lbNoise(d, vol, f0, f1) {
  const ac = lbAudio(); if (!ac) return;
  const b = ac.createBuffer(1, Math.floor(ac.sampleRate * d), ac.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / ch.length);
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(), t = ac.currentTime;
  f.type = "bandpass"; f.Q.value = 0.8; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d);
  s.buffer = b; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
  lbKeep(s);
}
/* Klick je Feldgrenze – bei hoher Drehzahl höchstens alle 55 ms, damit sich die Klicks nicht überlagern */
function lbTick() {
  if (!lucky) return;
  const now = performance.now(); if (now - (lucky.tickAt || 0) < 55) return;
  lucky.tickAt = now;
  lbTone(2100 + Math.random() * 250, 0.022, { type: "square", vol: 0.016 });
}
const LB_FANFARE = { c: [[880, 0]], r: [[784, 0], [1175, 0.09]], e: [[659, 0], [988, 0.08], [1319, 0.16]], l: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3], [1319, 0.44]] };
function lbFanfare(r) { const F = LB_FANFARE[r]; F.forEach(([f, at], i) => lbTone(f, i === F.length - 1 ? 0.7 : 0.24, { type: "triangle", vol: r === "l" ? 0.07 : 0.055, at })); }
const lbBuzz = p => { if (lbReduced() || !navigator.vibrate) return; try { navigator.vibrate(p); } catch (_) { /* egal */ } };

/* ---- Höhe: an der tatsächlich sichtbaren Fläche ausrichten (dynamische Browserleisten, Drehen) ---- */
function lbFitVh() {
  const el = document.getElementById("lucky"); if (!el) return;
  const vv = window.visualViewport, h = vv ? vv.height : window.innerHeight;
  if (h > 0) el.style.setProperty("--lb-h", Math.round(h) + "px");
  el.style.setProperty("--lb-top", Math.round(vv ? vv.offsetTop : 0) + "px");
}
function lbViewport(on) {
  const f = on ? "addEventListener" : "removeEventListener", vv = window.visualViewport;
  window[f]("resize", lbFitVh); window[f]("orientationchange", lbFitVh);
  if (vv) { vv[f]("resize", lbFitVh); vv[f]("scroll", lbFitVh); }
  if (on) lbFitVh();
}

/* Herkunft dieser Box und aktueller Serienfortschritt – zwei verschiedene Dinge, beide ausdrücklich benannt */
function lbStreakHTML() {
  const L = luckyState(), s = L.lastSet >= dayOf(S.time) - 1 ? L.streak || 0 : 0, k = s % 7, left = 7 - k;
  return `<div class="lb-streak" aria-label="Aktueller Serienfortschritt: ${s} ${s === 1 ? "Tag" : "Tage"} in Folge, nächste goldene Box in ${left} ${left === 1 ? "Tag" : "Tagen"}">
    <div class="lb-streak-h">Aktueller Serienfortschritt</div>
    <div class="lb-streak-t"><span>🔥 <b>${s} ${s === 1 ? "Tag" : "Tage"}</b> in Folge</span><span>💎 nächste goldene Box in <b>${left} ${left === 1 ? "Tag" : "Tagen"}</b></span></div>
    <div class="lb-streak-bar">${Array.from({ length: 7 }, (_, i) => `<i class="${i < k ? "on" : ""}${i === 6 ? " gem" : ""}"></i>`).join("")}</div></div>`;
}
function lbOriginHTML(box) {
  const when = box && box.t != null && typeof dayOf === "function" ? ` · Tag ${dayOf(box.t)}` : "";
  return `<span class="lb-src">Herkunft dieser Box</span> ${esc(box.why || "")}${when}`;
}
function openLucky() {
  const L = luckyState();
  if (lucky) return;
  if (L.pending) return lbOpen(null, true);              /* v270: unterbrochene Öffnung – Gewinn zeigen, keine neue Box */
  if (!L.boxes.length) return toast("Keine Luckybox da – alle drei Tagesaufgaben schaffen!", "warn");
  /* goldene zuerst */
  L.boxes.sort((a, b) => (b.kind === "gold") - (a.kind === "gold"));
  lbOpen(L.boxes[0], false);
}
function lbOpen(box, resume) {
  const L = luckyState();
  if (resume) box = { kind: L.pending.kind || "std", why: L.pending.why || "", t: L.pending.t };
  const gold = box.kind === "gold", odds = LUCKY_ODDS[box.kind] || LUCKY_ODDS.std, more = L.boxes.length - (resume ? 0 : 1);
  lucky = { id: ++lbSeq, box, stage: "closed", timers: [], raf: 0, g3: null, snd: [], readyAt: performance.now() + 450, resume };
  if (typeof closeModal === "function") closeModal();
  const el = luckyEl();
  el.className = "on lb" + (gold ? " gold" : "");
  el.removeAttribute("data-r"); el.removeAttribute("data-tease"); el.style.removeProperty("--rc"); el.style.removeProperty("--tc");
  el.style.setProperty("--tc", LB_BOXCOL[gold ? "gold" : "std"]);
  document.body.classList.add("lucky-open");
  const kick = gold ? "Serienbelohnung" : /Sonderfahrt/.test(box.why) ? "Bonus" : "Tagesbelohnung";
  el.innerHTML = `<div class="lb-stage" role="dialog" aria-modal="true" aria-label="${gold ? "Goldene Luckybox" : "Luckybox"}">
    <div class="lb-head">
      <small class="lb-kick">${kick}</small>
      <h2 class="lb-title">${gold ? "Goldene Luckybox" : "Luckybox"}</h2>
      <p class="lb-sub">${resume ? `<span class="lb-src">Schon geöffnet</span> Die Öffnung wurde unterbrochen – hier ist dein Gewinn.` : lbOriginHTML(box)}</p>
      ${more > 0 ? `<p class="lb-more">noch ${more} ${more === 1 ? "weitere Box wartet" : "weitere Boxen warten"}</p>` : ""}
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
      <div class="lb-now" id="lbNow" aria-hidden="true"></div>
      <div class="lb-prize" id="lbPrize" aria-live="polite"></div>
      <div class="lb-flash" id="lbFlash"></div>
    </div>
    <div class="lb-foot" id="lbFoot">${lbStreakHTML()}
      <div class="lb-btns" id="lbBtns"><p class="lb-hint" id="lbHint">Tippe auf die Kiste, um sie zu öffnen</p><button class="lb-later" id="lbLater">Später öffnen</button></div></div>
  </div>`;
  $("#lbCase").onclick = () => spinLucky();
  $("#lbLater").onclick = () => closeLucky();
  lbViewport(true);
  if (resume) {                                         /* Gewinn stand schon fest: direkt zeigen */
    const p = PRIZES.find(x => x.id === L.pending.id) || PRIZES[0];
    lucky.win = p; lucky.stage = "stopped";
    $("#lbCase").hidden = true; $("#lbHint").textContent = "";
    revealLucky(true);
    return;
  }
  /* v268: Kiste und Glücksrad in 3D (lucky3d.js, gl3d.js); ohne WebGL 2 bleibt die Bühne aus v266 */
  if (typeof LUCKY3D !== "undefined") {
    try { lucky.g3 = LUCKY3D.open($("#lbScene"), { gold, odds, prizes: PRIZES, rarity: RARITY, reduced: lbReduced(), icon: lbIcon }); } catch (e) { console.warn("Luckybox 3D", e); lucky.g3 = null; }
    if (lucky.g3) el.classList.add("is3d");
  }
}
function tileHTML(p) {
  return `<div class="lb-tile r-${p.r}" style="--rc:${RARITY[p.r].col}">${lbImg(p.id, 44)}<small>${lbName(p.name.replace("Hauptpreis: ", ""))}</small></div>`;
}
function lbFlash(col, a) {
  const f = $("#lbFlash"); if (!f || lbReduced()) return;
  f.style.setProperty("--fc", col); f.style.setProperty("--fa", a);
  f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
}
/* Anzeige unter dem Rad/Band: Symbol und Name des Felds unter dem Zeiger */
function lbNow(p, final) {
  const now = $("#lbNow"); if (!now || !p) return;
  if (now._id !== p.id) { now._id = p.id; now.innerHTML = lbImg(p.id, 22, "lb-now-ico") + `<span>${esc(p.name.replace("Hauptpreis: ", ""))}</span>`; }
  now.style.setProperty("--rc", RARITY[p.r].col);
  now.classList.add("on"); now.classList.toggle("final", !!final);
}
/* 1.–3. Antippen, Aufladen, Öffnen – der Gewinn wird hier genau einmal gezogen und zusammen mit der Box gespeichert */
function spinLucky() {
  if (!lucky || lucky.stage !== "closed" || performance.now() < lucky.readyAt) return;
  const L = luckyState(), box = lucky.box, at = L.boxes.indexOf(box);
  if (at < 0) { closeLucky(); return; }
  lucky.stage = "charge";
  L.boxes.splice(at, 1);                 /* ab hier gehört der Preis dir */
  L.opened++;
  const win = rollPrize(box.kind);
  L.pending = { id: win.id, kind: box.kind, why: box.why, t: box.t };
  lucky.win = win;
  save();
  const el = luckyEl(), cs = $("#lbCase"), red = lbReduced(), T = LB_TIME[box.kind === "gold" ? "gold" : "std"], g3 = lucky.g3;
  cs.disabled = true; cs.classList.add("tap");
  /* Überspringen (wenn weitere Boxen warten) steht im Aktionsbereich – fern der Kiste, an der Stelle von „Später“ */
  const bt = $("#lbBtns");
  if (luckyState().boxes.length && !red) { bt.innerHTML = `<button class="lb-later lb-skip" id="lbSkip">Animation überspringen</button>`; $("#lbSkip").onclick = () => lbSkip(); }
  else bt.classList.add("hide");
  lbTone(520, 0.09, { type: "triangle", vol: 0.04 }); lbBuzz(10);
  if (g3) g3.tap();
  if (red) {                                           /* Bewegung reduzieren: Deckel auf, kurze Überblendung zur Karte */
    if (g3) g3.openLid(); else cs.classList.add("burst");
    lbLater(() => { lucky.stage = "stopped"; revealLucky(); }, 350);
    return;
  }
  for (let k = 0; k < T.pulses; k++) lbLater(() => {
    if (g3) g3.charge(k, T.pulses); else { cs.classList.add("charge"); cs.style.setProperty("--amp", (0.6 + k * 0.25).toFixed(2)); el.dataset.tease = "c"; }
    lbTone(330 * Math.pow(1.26, k), 0.26, { type: "triangle", vol: 0.04 }); lbBuzz(8 + k * 4);
  }, 120 + k * T.step);
  lbLater(() => {
    lucky.stage = "open";
    if (g3) g3.openLid(); else { cs.classList.remove("charge"); cs.classList.add("burst"); }
    lbNoise(0.42, 0.05, 500, 2600); lbBuzz(20);
  }, T.open);
  if (g3) {
    lbLater(() => g3.toWheel(T.camD), T.cam);
    lbLater(() => lb3dSpin(win, T), T.spin);
  } else lbLater(() => lbRoll(win, T), T.cam + 200);
}
/* 5. Glücksrad in 3D – jedes Feld ein Preis, Feldgröße = Gewinnchance; Klick je Feldgrenze, Name des Felds unter dem Zeiger */
function lb3dSpin(win, T) {
  lucky.stage = "spin";
  lucky.g3.spin(win.id, {
    ta: T.ta, tb: T.tb, tc: T.tc, turns: T.turns,
    onTick: lbMine(p => { lbTick(); lbNow(p); }),
    onDone: lbMine(() => lbStopped(win))
  });
}
/* 6. Halt auf dem Gewinnerfeld, dann die Karte */
function lbStopped(win) {
  if (!lucky || lucky.stage === "done") return;
  lucky.stage = "stopped";
  lbNow(win, true);
  lbTone(1500, 0.06, { type: "triangle", vol: 0.04 }); lbBuzz(18);
  if (lucky.g3) lucky.g3.highlight(RARITY[win.r].col, LB_RANK[win.r]);
  lbLater(() => revealLucky(), LB_HOLD[win.r]);
}
/* Band (ohne WebGL 2): gleiches Bewegungsprofil wie das Rad – beschleunigen, gleichmäßig, stetig abbremsen, kein Nachrücken */
function lbRoll(win, T) {
  lucky.stage = "spin";
  const reel = $("#lbReel"), strip = $("#lbStrip"), WIN = 30, tiles = [];
  for (let i = 0; i < 36; i++) tiles.push(i === WIN ? win : rollPrize(lucky.box.kind));
  strip.innerHTML = tiles.map(tileHTML).join("");
  reel.classList.add("on");
  /* v270: Layoutbreite (offsetWidth) statt getBoundingClientRect – die Einblend-Animation skaliert das Band, das verfälschte
     früher die Kachelbreite, und das Band hielt bis zu anderthalb Kacheln neben dem Gewinn */
  const els = [...strip.children], gap = 10, tw = els[0].offsetWidth + gap, pad = 10, center = reel.clientWidth / 2;
  const target = -(pad + WIN * tw + (tw - gap) / 2 - center) + (Math.random() - 0.5) * tw * 0.5;
  const ta = T.ta, tb = T.tb, tc = T.tc, D = ta + tb + tc, w0 = target / (ta / 2 + tb + tc / 3);
  let t0 = null, idx = -1;
  const pos = t => t < ta ? w0 * t * t / (2 * ta) : t < ta + tb ? w0 * ta / 2 + w0 * (t - ta) : t < D ? w0 * ta / 2 + w0 * tb + w0 * tc * (1 - Math.pow(1 - (t - ta - tb) / tc, 3)) / 3 : target;
  const frame = lbMine(now => {
    if (t0 == null) t0 = now;
    const t = (now - t0) / 1000, x = pos(Math.min(t, D));
    strip.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    const i = Math.floor((center - pad - x) / tw);
    if (i !== idx && i >= 0 && i < els.length) {
      if (els[idx]) els[idx].classList.remove("hot");
      els[i].classList.add("hot"); idx = i; lbTick(); lbNow(tiles[i]);
    }
    if (t < D) lucky.raf = requestAnimationFrame(frame);
    else { els[WIN].classList.add("hot", "win"); lbStopped(win); }
  });
  lucky.raf = requestAnimationFrame(frame);
}
/* Überspringen: sofort das schon gezogene Ergebnis – kein neuer Gewinn */
function lbSkip() {
  if (!lucky || !lucky.win || lucky.stage === "done" || lucky.stage === "closed") return;
  lucky.timers.forEach(clearTimeout); lucky.timers = []; cancelAnimationFrame(lucky.raf);
  const w = lucky.win;
  if (lucky.g3) { lucky.g3.finish(w.id); lucky.g3.highlight(RARITY[w.r].col, 0); }
  lucky.stage = "stopped";
  revealLucky(true);
}
/* Beträge in der Gewinnzeile hochzählen (erste Geldangabe im Text) */
function lbCount(el, txt) {
  const m = /(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s(Mio\. |Mrd\. )?€/.exec(txt);
  if (!m || m[2] || lbReduced()) return;
  const v = parseFloat(m[1].replace(/\./g, "").replace(",", ".")), D = 700, t0 = performance.now(), pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
  const run = lbMine(now => {
    if (!el.isConnected) return;
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
    el.textContent = pre + (k < 1 ? money(Math.round(v * e)) : m[0]) + post;
    if (k < 1) requestAnimationFrame(run);
  });
  requestAnimationFrame(run);
}
function lbSparks(host, n, cols, kind) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "lb-p " + kind;
    const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 120;
    c.style.background = cols[i % cols.length];
    c.style.setProperty("--dx", (Math.cos(a) * d).toFixed(0) + "px");
    c.style.setProperty("--dy", (Math.sin(a) * d * 0.7 - 30).toFixed(0) + "px");
    c.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
    c.style.animationDelay = (Math.random() * 0.15).toFixed(2) + "s";
    host.appendChild(c);
    setTimeout(() => c.remove(), 1900);
  }
}
function lbCoins(host, n) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "lb-coin";
    c.style.left = (Math.random() * 100).toFixed(1) + "%";
    c.style.animationDelay = (Math.random() * 0.7).toFixed(2) + "s";
    c.style.animationDuration = (1.3 + Math.random() * 0.6).toFixed(2) + "s";
    host.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}
/* Gewinn genau einmal anwenden (Enthüllen, Überspringen oder Schließen) */
function lbSettle() {
  if (!lucky || !lucky.win) return null;
  if (lucky.txt != null) return lucky.txt;
  const L = luckyState(), p = lucky.win;
  if (L.pending && L.pending.id === p.id) { delete L.pending; lucky.txt = applyPrize(p); }      /* applyPrize speichert */
  else lucky.txt = p.desc();
  return lucky.txt;
}
/* 7. Enthüllung (fast: ohne Auftritt, z. B. nach Überspringen oder bei „Bewegung reduzieren“) */
function revealLucky(fast) {
  if (!lucky || !lucky.win || lucky.stage === "done") return;
  const p = lucky.win, txt = lbSettle(), rc = RARITY[p.r], el = luckyEl(), red = lbReduced(), quiet = fast || red;
  lucky.stage = "done";
  $("#lbBtns").classList.add("hide");
  el.dataset.r = p.r; el.style.setProperty("--rc", rc.col);
  el.classList.toggle("quiet", quiet);
  lbFanfare(p.r);
  lbBuzz(p.r === "l" ? [60, 50, 120] : p.r === "e" ? [40, 40, 60] : 30);
  if (!quiet && p.r !== "c") lbFlash(rc.col, p.r === "l" ? 0.55 : p.r === "e" ? 0.45 : 0.3);
  $("#lbReel").classList.add("away");
  $("#lbNow").classList.add("away");
  if (!quiet && (p.r === "e" || p.r === "l")) $("#lbRays").classList.add("on");
  const pr = $("#lbPrize");
  pr.innerHTML = `<div class="lb-card r-${p.r}" style="--rc:${rc.col}">
    <span class="lb-card-rar">${rc.name}</span>
    <div class="lb-card-ico">${lbImg(p.id, 96, "lb-card-img")}</div>
    <b class="lb-card-name">${lbName(p.name)}</b>
    <p class="lb-card-txt" id="lbTxt">${esc(txt)}</p></div>`;
  pr.classList.add("on");
  if (!quiet) lbCount($("#lbTxt"), txt);
  if (!quiet) {
    const cols = [rc.col, "#ffffff", p.r === "l" ? "#fff2b0" : "#9fd8ff"];
    const n = { c: 0, r: 10, e: 22, l: 34 }[p.r];
    if (n) lbSparks($("#lbScene"), n, cols, p.r === "e" || p.r === "l" ? "conf" : "spark");
    if (p.r === "l") lbCoins(el, 24);
  }
  /* Knöpfe erscheinen an ihrem festen Platz und werden erst kurz danach aktiv (kein versehentliches Weitertippen) */
  const more = luckyState().boxes.length;
  lbLater(() => {
    const bt = $("#lbBtns");
    bt.innerHTML = `<button class="lb-go" id="lkOk" disabled>${more ? "Nächste Box öffnen" : "Einsammeln"}${more ? `<small>noch ${more}</small>` : ""}</button>${more ? `<button class="lb-later" id="lbLater" disabled>Später</button>` : ""}`;
    bt.classList.remove("hide"); bt.classList.add("arming");
    $("#lkOk").onclick = () => { const m = luckyState().boxes.length; closeLucky(); if (m) openLucky(); };
    const lt = $("#lbLater"); if (lt) lt.onclick = () => closeLucky();
    lbLater(() => {
      bt.classList.remove("arming"); bt.querySelectorAll("button").forEach(b => { b.disabled = false; });
      const ok = $("#lkOk"); if (ok) try { ok.focus({ preventScroll: true }); } catch (e) { /* egal */ }
    }, quiet ? 250 : 450);
  }, quiet ? 0 : 350);
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
    const L0 = lucky;
    L0.timers.forEach(clearTimeout); cancelAnimationFrame(L0.raf);                           /* v266: laufende Effekte beenden */
    L0.snd.slice().forEach(n => { try { n.stop(); } catch (e) { /* schon zu Ende */ } });     /* v270: Klänge stoppen */
    if (L0.g3) { try { L0.g3.close(); } catch (e) { /* egal */ } L0.g3 = null; }              /* v268: 3D-Bühne freigeben */
    /* v266/v270: Wer während des Öffnens schließt (Escape, Zurück), verliert den Gewinn nicht – er wird genau einmal angewendet */
    if (L0.win && L0.stage !== "done") { const p = L0.win; L0.stage = "done"; const txt = lbSettle(); toast(p.icon + " " + p.name + ": " + txt, "ok"); }
  }
  lucky = null;
  lbViewport(false);
  const el = document.getElementById("lucky"); if (!el) return;
  el.className = ""; el.innerHTML = "";
  el.removeAttribute("data-r"); el.removeAttribute("data-tease"); ["--rc", "--tc", "--lb-h", "--lb-top"].forEach(k => el.style.removeProperty(k));
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
  const can = L.boxes.length || L.pending;                               /* v270: unterbrochene Öffnung zählt mit */
  return `<div class="lk-shelf${can ? " has" : ""}">
    <div class="lk-shelf-t"><b>🎁 Luckybox</b><small>3 Tagesaufgaben = 1 Box · 7 Tage in Folge = 💎 · pünktliche Sonderfahrt = Bonus-Box</small></div>
    <div class="lk-shelf-r"><span class="lk-count">🎁 ${std}</span><span class="lk-count gold">💎 ${gold}</span>
      <button class="btn tiny${can ? "" : " disabled"}" id="lkOpen">${!L.boxes.length && L.pending ? "Gewinn ansehen" : "Öffnen"}</button></div>
    <div class="lk-streak">🔥 ${streak} ${streak === 1 ? "Tag" : "Tage"} in Folge alles geschafft · 💎 goldene Box in ${7 - (streak % 7)} ${7 - (streak % 7) === 1 ? "Tag" : "Tagen"}</div>
    ${chips.length ? `<div class="lk-perks">${chips.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : ""}
    <div class="lk-main">Hauptpreis: 🏆 <b>Goldener Bulli</b> – +10 % Erlös pro Tour, nicht käuflich.</div>
  </div>`;
}
