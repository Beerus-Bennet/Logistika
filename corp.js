/* =========================================================================
   LOGISTIKA – Übernahmen
   Wer im Markt vorn liegt, kann eine Konkurrentin kaufen: Firmenwert,
   Verhandlung über bis zu drei Runden mit Gegenangeboten. Nach der
   Übernahme gehören Flotte, Firmensitz, ein Teil des Personals und der
   Marktanteil dir – und die Konkurrentin schnappt keine Aufträge mehr weg.
   v170: Wer 14 Tage am Stück den Markt anführt, lockt Konzerne an (je Welle
   zwei, größer, teurer, schneller). Jede Übernahme läuft als Zeitungs-Show
   mit Stempel, Beute und Imperium-Zähler; dazu kommen Stammkunden.
   ========================================================================= */
"use strict";

/* Zwei neue Mitbewerber für die späteren Etappen */
if (typeof RIVALS !== "undefined" && !RIVALS.some(r => r.id === "atlas")) {
  RIVALS.push({ id: "atlas", name: "Atlas Global Freight", icon: "🌐", col: "#0f8a6a", st: 4 },
              { id: "pacific", name: "Pacific Star Lines", icon: "⭐", col: "#b8860b", st: 5 });
}
const CORP = {
  blitz:   { boss: "Doris Hellwig", role: "Geschäftsführerin", hq: "b-tempel", base: 30000, fleet: 4, tier: 0, modes: "rb",
             about: "Junges Kurier-Start-up aus Tempelhof: schnell, billig, chronisch knapp bei Kasse." },
  rabe:    { boss: "Konrad Rabe", role: "Inhaber in dritter Generation", hq: "b-span", base: 24000, fleet: 3, tier: 0, modes: "r",
             about: "Traditionsspedition seit 1952: treue Kunden, alte Lkw, kein Nachfolger." },
  nord:    { boss: "Ingrid Søndergaard", role: "Vorstandsvorsitzende", hq: "hamburg", base: 160000, fleet: 6, tier: 1, modes: "rli",
             about: "Hamburger Reederei-Tochter mit Hafenlagern und Draht nach Skandinavien." },
  atlas:   { boss: "Pieter van Dijk", role: "CEO", hq: "rotterdam", base: 420000, fleet: 7, tier: 2, modes: "rlis",
             about: "Europaweit vernetzte Kontraktlogistik mit Zentrale im Rotterdamer Hafen." },
  pacific: { boss: "Mei Lin Tan", role: "Managing Director", hq: "singapur", base: 950000, fleet: 8, tier: 2, modes: "rsa",
             about: "Container- und Luftfracht zwischen Asien und Europa, gesteuert aus Singapur." }
};
function corp() { if (!S.corp) S.corp = { owned: {}, talks: {} }; return S.corp; }

/* ============================ v170: Konzern-Wellen ============================
   Je Welle zwei Konzerne aus diesem Pool (danach mit „International“ usw. von vorn).
   v306: Firmenwert aus Flotte/Sitz/Kundenwert, ohne Standort-/Wellenmultiplikation.
   Flotte 6 + 2 × Welle;
   Firmensitz ab Umschlaghalle; sie starten mit mehr Marktanteil als du. */
const CORP_LEAD_DAYS = 14;
const CORP_WAVE_POOL = [
  { k: "kraft", name: "Kraftmann Logistik AG", icon: "🏭", col: "#7a3fb0", boss: "Viktor Kraftmann", role: "Vorstandsvorsitzender",
    about: "Börsennotierter Riese aus dem Ruhrgebiet: 40 Standorte, eigene Werkstätten, Kampfpreise.",
    hello: "Sie hatten zwei schöne Wochen an der Spitze. Die sind jetzt vorbei." },
  { k: "ostwind", name: "Ostwind Express", icon: "🌪️", col: "#d0662a", boss: "Ljudmila Arendt", role: "Gründerin & CEO",
    about: "Mit Risikokapital vollgepumpt: neue Flotte, App-Disposition, wächst um jeden Preis.",
    hello: "Wir haben fünfzig Millionen Risikokapital. Und Sie? Einen Hof." },
  { k: "falkner", name: "Falkner & Partner Holding", icon: "🦅", col: "#2b4c7e", boss: "Dr. Henrike Falkner", role: "Managing Partner",
    about: "Beteiligungsgesellschaft, die Speditionen aufkauft und zusammenlegt – jetzt sind Sie im Visier.",
    hello: "Normalerweise kaufen wir Firmen wie Ihre. Heute machen wir sie erst einmal klein." },
  { k: "vulkan", name: "Vulkan Schwerlast", icon: "🌋", col: "#b3261e", boss: "Bernd Kessler", role: "Inhaber",
    about: "Schwerlast, Projektladung, eigene Kranflotte – wo Vulkan auftaucht, wird es eng.",
    hello: "Wir fahren Turbinen. Ihre Paletten nehmen wir nebenbei mit." },
  { k: "orbis", name: "Orbis Transcontinental", icon: "🛰️", col: "#13707a", boss: "Amara Osei", role: "Chief Executive Officer",
    about: "Weltkonzern mit Satelliten-Tracking und eigenen Terminals auf drei Kontinenten.",
    hello: "Wir haben uns Ihre Zahlen angesehen. Niedlich." },
  { k: "zenit", name: "Zenit Logistics Group", icon: "🔱", col: "#8a6d1f", boss: "Friedrich von Zenk", role: "Aufsichtsratschef",
    about: "Familienkonzern mit Tradition, Geld und Geduld – kauft Marktanteile notfalls mit Verlust.",
    hello: "Meine Familie macht seit 1888 Logistik. Sie seit ein paar Wochen." },
  { k: "eisberg", name: "Eisberg Frischelogistik", icon: "🧊", col: "#2f8fd0", boss: "Svenja Holm", role: "Geschäftsführerin",
    about: "Kühlkette vom Hafen bis ins Regal – mit Kunden, die nie wechseln.",
    hello: "Kühl bleiben gehört bei uns zum Geschäft. Sie werden es merken." },
  { k: "titan", name: "Titan Freight Holding", icon: "🗿", col: "#4a4a58", boss: "Marcus Brandt", role: "CEO",
    about: "Größter Lkw-Bestand des Kontinents. Wer gegen Titan fährt, fährt hinterher.",
    hello: "Genießen Sie Ihren Marktanteil. Solange Sie ihn noch haben." }
];
const CORP_SUFFIX = ["", " International", " Global", " Worldwide"];
/* Konzerne aus dem Spielstand in RIVALS/CORP eintragen (nach Laden, neuem Spiel, neuer Welle) */
let corpSynced = null, corpSyncedN = -1;
function corpSyncRivals(force) {
  if (typeof S === "undefined" || !S || typeof RIVALS === "undefined") return;
  const list = (S.corp && S.corp.rivals) || [];
  if (!force && corpSynced === S && corpSyncedN === list.length) return;
  corpSynced = S; corpSyncedN = list.length;
  for (let i = RIVALS.length - 1; i >= 0; i--) if (RIVALS[i].wave) { delete CORP[RIVALS[i].id]; RIVALS.splice(i, 1); }
  list.forEach(d => {
    RIVALS.push({ id: d.id, name: d.name, icon: d.icon, col: d.col, st: 0, wave: d.wave });
    CORP[d.id] = { boss: d.boss, role: d.role, hq: d.hq, base: d.base, fleet: d.fleet, tier: d.tier, modes: d.modes, about: d.about, hello: d.hello, wave: d.wave };
  });
}
/* Marktführer: mehr Anteil als jede aktive Konkurrentin (oder keine mehr übrig) */
function corpLead() {
  const sh = typeof shareState === "function" ? shareState() : { me: 0 }, me = sh.me || 0;
  if (me <= 0) return false;
  return activeRivals().every(r => (sh[r.id] || 0) <= me);
}
function corpDay() {
  corpSyncRivals();
  if (typeof logiOn === "function" && !logiOn()) return;
  const C = corp();
  try { corpBidCheck(); } catch (e) { console.warn("corpBid", e); }   /* v241: unter 30 % kommen Kaufangebote */
  if (!corpLead()) { C.leadSince = 0; return; }
  if (!C.leadSince) C.leadSince = S.time;
  const big = activeRivals().filter(r => r.wave).length;
  if (S.time - C.leadSince >= CORP_LEAD_DAYS * 1440 && big < 3 && level() >= 5) corpWave();
}
/* ================= v241: Übernahmeangebote, wenn du schwächelst =================
   Fällt dein Marktanteil unter 30 %, meldet sich die stärkste Konkurrentin mit einem Angebot (höchstens alle 6 Tage,
   es gilt 3 Tage). Zur Wahl: ablehnen, 25 % Beteiligung verkaufen (Geld sofort, dafür ein Viertel jedes Monatsgewinns
   an sie, bis du zurückkaufst) oder die ganze Spedition verkaufen (große Einmalzahlung, Neustart in Etappe 1;
   Hof, Erbe, Garage und Geld bleiben). */
const CORP_BID_SHARE = 0.30, CORP_BID_GAP = 6, CORP_STAKE = 0.25;
function corpMyValue() {
  const veh = S.fleet.filter(f => !f.lease && !vType(f.type).special && !f.garage).reduce((a, f) => a + vehValue(f), 0);
  const bases = (S.bases || []).reduce((a, b) => a + (b.rent ? 0 : buyPrice(b.node, OFFICE_TIERS[b.tier]) * 0.6) + b.staff.length * 900 * stageK(), 0);
  const sh = shares().me || 0, good = (veh + bases) * (0.25 + sh) + 30000 * stageK();
  return roundK(veh + bases + good, 1000);
}
function corpBidOpen() { return (S.phone && S.phone.msgs || []).some(m => m.dec && m.dec.type === "buyout" && !m.dec.done); }
function corpBidCheck() {
  if (level() < 5 || !S.player || (typeof tutorialRunning === "function" && tutorialRunning())) return;
  const C = corp(), raw = shareState();
  const tot = Object.keys(raw).reduce((a, k) => a + (raw[k] || 0), 0);
  if (tot < 6) return;                                         /* zu wenig Geschäft, um etwas zu messen */
  const sh = shares();
  if ((sh.me || 0) >= CORP_BID_SHARE || corpBidOpen() || S.time < (C.bidNext || 0)) return;
  const top = activeRivals().map(r => ({ r, n: sh[r.id] || 0 })).sort((a, b) => b.n - a.n)[0];
  if (!top || top.n <= (sh.me || 0)) return;
  const r = top.r, c = CORP[r.id]; if (!c) return;
  const val = corpMyValue();
  const full = roundK(val * rnd(0.95, 1.12), 1000), part = roundK(val * CORP_STAKE * rnd(1.05, 1.2), 1000);
  C.bidNext = S.time + CORP_BID_GAP * 1440; C.bids = (C.bids || 0) + 1;
  const ch = [{ k: "no", label: "Ablehnen", sub: "Wir bleiben unabhängig" }];
  if (!S.stake) ch.push({ k: "stake", label: Math.round(CORP_STAKE * 100) + " % Beteiligung verkaufen", sub: "+" + money(part) + " sofort · " + Math.round(CORP_STAKE * 100) + " % jedes Monatsgewinns an " + r.name + ", Rückkauf jederzeit" });
  ch.push({ k: "all", label: "Ganze Spedition verkaufen", sub: "+" + money(full) + " · Flotte, Büros, Aufträge gehen weg – Neustart in Etappe 1" });
  decisionMsg({ from: c.boss + " · " + r.name, kind: "call", icon: "🤝", type: "buyout", brake: false,
    title: r.name + " will " + S.player.company + " kaufen",
    toast: "🤝 Kaufangebot von " + r.name,
    body: `„Ihr Marktanteil liegt nur noch bei ${Math.round((sh.me || 0) * 100)} %. Wir machen Ihnen ein faires Angebot, solange Ihre Firma noch etwas wert ist.“ Firmenwert laut ${r.name}: ${money(val)}.`,
    choices: ch, def: 0, wait: 3 * 1440, ctx: { id: r.id, full, part } });
}
DECISIONS.buyout = {
  choose(m, idx) {
    const c = m.dec.choices[idx], x = m.dec.ctx, r = rivalById(x.id);
    if (!c || !r) return "Hat sich erledigt.";
    if (c.k === "no") return "Abgelehnt – " + S.player.company + " bleibt unabhängig.";
    if (c.k === "stake") {
      if (S.stake) return "Es gibt schon eine Beteiligung.";
      S.stake = { id: x.id, name: r.name, pct: CORP_STAKE, paid: x.part, at: S.time };
      S.money += x.part; S.revenue += x.part; logMoney("corp", Math.round(CORP_STAKE * 100) + " % Beteiligung an " + r.name, x.part);
      toast("🤝 " + r.name + " hält jetzt " + Math.round(CORP_STAKE * 100) + " % – +" + money(x.part), "ok");
      save(); render();
      return "Beteiligung verkauft: +" + money(x.part) + ". " + r.name + " bekommt " + Math.round(CORP_STAKE * 100) + " % jedes Monatsgewinns.";
    }
    setTimeout(() => askConfirm("Ganze Spedition an " + r.name + " verkaufen?",
      "Du bekommst " + money(x.full) + ". Alle Speditionsfahrzeuge, Büros, Mitarbeiter und laufenden Aufträge gehen an " + r.name + ", du beginnst wieder in Etappe 1. Hof, Erbe, Garage, Level und Geld bleiben. Das lässt sich nicht rückgängig machen.",
      "Verkaufen", () => corpSellAll(x.id, x.full), true), 250);
    return "Komplettverkauf – wartet auf deine Bestätigung.";
  }
};
function corpSellAll(id, price) {
  const r = rivalById(id); if (!r) return;
  const farmJob = f => f.jobId && S.jobs.some(j => j.id === f.jobId && j.order && j.order.farm);
  const keep = f => vType(f.type).special || farmJob(f) || (!f.jobId && typeof FARM_NODE !== "undefined" && f.at === FARM_NODE && !f.lease);
  /* Garagenautos, die als Wertkurier fuhren, kommen zurück in die Garage */
  S.fleet.filter(f => f.garage && !farmJob(f)).forEach(f => { const g = typeof garageById === "function" && garageById(f.garage); if (g) delete g.fleet; });
  const gone = S.fleet.filter(f => !keep(f) || (f.garage && !farmJob(f)));
  if (S.follow && gone.some(f => f.uid === S.follow)) setFollow(null);
  S.fleet = S.fleet.filter(f => !gone.includes(f));
  S.jobs = S.jobs.filter(j => j.order && j.order.farm);
  S.orders = S.orders.filter(o => o.farm);
  S.bases = [];
  S.share = { me: 0 };
  S.stake = null;
  const C = corp(); C.leadSince = 0; C.bidNext = S.time + 14 * 1440;
  S.money += price; S.revenue += price;
  logMoney("corp", "Verkauf der Spedition an " + r.name, price);
  S.stage = 1;
  clearRouteCache(); buildNetBuffers();
  spawnOrders(6);
  phoneMsg({ from: r.name, kind: "info", title: "Übernahme abgeschlossen",
    body: `${r.name} hat die Spedition übernommen: ${gone.length} Fahrzeuge, alle Büros und Aufträge. Auf deinem Konto: +${money(price)}. Du startest wieder in Etappe 1 – mit Kapital im Rücken.` });
  toast("🤝 Spedition verkauft: +" + money(price) + " · Neustart in Etappe 1", "ok");
  save(); render();
}
/* Rückkauf der Beteiligung: Wert heute (Anteil am Firmenwert), mindestens der Verkaufspreis + 10 % */
function corpStakePrice() { return S.stake ? Math.max(roundK(S.stake.paid * 1.1, 1000), roundK(corpMyValue() * S.stake.pct, 1000)) : 0; }
function corpStakeBack() {
  if (!S.stake) return;
  const p = corpStakePrice();
  if (S.money < p) return toast("Für den Rückkauf fehlen " + money(p - S.money) + ".", "warn");
  askConfirm("Beteiligung zurückkaufen?", S.stake.name + " gibt die " + Math.round(S.stake.pct * 100) + " % für " + money(p) + " zurück. Danach gehört dein Gewinn wieder ganz dir.", "Zurückkaufen", () => {
    S.money -= p; S.expense += p; logMoney("corp", "Rückkauf Beteiligung von " + S.stake.name, -p);
    toast("🤝 Beteiligung zurückgekauft – " + S.player.company + " gehört wieder dir allein.", "ok");
    S.stake = null; save(); render();
  });
}
function corpStakeHTML() {
  if (!S.stake) return "";
  return `<div class="corp-lead off"><b>🤝 ${esc(S.stake.name)} hält ${Math.round(S.stake.pct * 100)} % deiner Spedition</b>
    <small>Jeden Monat gehen ${Math.round(S.stake.pct * 100)} % des Gewinns nach Steuern an sie.</small>
    <button class="btn tiny" style="margin-top:6px" onclick="corpStakeBack()">Zurückkaufen · ${money(corpStakePrice())}</button></div>`;
}
/* Firmensitz der Konzerne: große, freigeschaltete Orte (neueste Region zuerst) */
function corpWaveHQ(taken) {
  const used = new Set(Object.values(CORP).map(c => c.hq).concat(taken || []));
  const ids = Object.keys(N).filter(id => isUnlocked(id) && ["city", "port", "rail"].includes(N[id].type) && N[id].modes.includes("r")
    && !used.has(id) && !(typeof baseAtNode === "function" && baseAtNode(id)));
  if (!ids.length) return "b-mitte";
  ids.sort((a, b) => (N[b].stage - N[a].stage) || (a.startsWith("b-") - b.startsWith("b-")));
  return pick(ids.slice(0, 6));
}
function corpWave() {
  const C = corp(), w = C.wave = (C.wave || 0) + 1, sh = shareState(), me = Math.max(3, sh.me || 0);
  C.rivals = C.rivals || [];
  const maxBase = Math.max(30000, ...RIVALS.filter(r => !r.wave && r.st <= S.stage && CORP[r.id]).map(r => CORP[r.id].base));
  const made = [];
  for (let i = 0; i < 2; i++) {
    const n = (w - 1) * 2 + i, T = CORP_WAVE_POOL[n % CORP_WAVE_POOL.length], cyc = Math.min(3, Math.floor(n / CORP_WAVE_POOL.length));
    const d = { id: "w" + w + "_" + T.k, k: T.k, wave: w, name: T.name + CORP_SUFFIX[cyc], icon: T.icon, col: T.col, boss: T.boss, role: T.role,
      about: T.about, hello: T.hello, hq: corpWaveHQ(made.map(m => m.hq)), at: S.time,
      base: roundK(maxBase * (1.5 + 1.5 * w) * rnd(0.95, 1.15), 1000), fleet: 6 + 2 * w,
      tier: Math.min(OFFICE_TIERS.length - 1, 1 + Math.floor(w / 2)), modes: "rbilsa" };
    C.rivals.push(d); made.push(d);
    sh[d.id] = Math.round(me * (1.05 + 0.08 * w) * rnd(0.9, 1.1) * 10) / 10;      /* sie kommen mit Kunden – du verlierst die Spitze */
  }
  C.leadSince = 0;
  corpSyncRivals(true);
  phoneMsg({ from: made[0].boss, kind: "trouble", title: "Kampfansage: " + made[0].name + " und " + made[1].name,
    body: `„${made[0].hello}“ – Zwei Konzerne drängen auf den Markt: ${made[0].name} (${N[made[0].hq].short}) und ${made[1].name} (${N[made[1].hq].short}). Sie schnappen Aufträge schneller weg. Hol dir die Marktführung zurück – dann kannst du sie kaufen.` });
  C.showQ = (C.showQ || []).concat([{ kind: "threat", ids: made.map(m => m.id), wave: w }]);
  save();
}
function corpTick() {
  corpSyncRivals();
  const C = S.corp;
  if (!C || !C.showQ || !C.showQ.length || document.getElementById("corpShow")) return;
  const b = document.body.classList;
  if (b.contains("modal-open") || b.contains("report-open") || b.contains("ask-open") || b.contains("tut-talk")) return;
  if ((typeof activeTab !== "undefined" && activeTab === "farm") || (typeof tutorialRunning === "function" && tutorialRunning())) return;
  corpShow(C.showQ.shift());
}
/* Anzeige im Konkurrenz-Kasten: wie lange schon vorn, wann die Konzerne kommen */
function corpLeadHTML() {
  if ((typeof logiOn === "function" && !logiOn()) || level() < 5) return "";
  const C = corp(), sh = shareState();
  if (!corpLead()) {
    const top = activeRivals().map(r => ({ r, n: sh[r.id] || 0 })).sort((a, b) => b.n - a.n)[0];
    return top && top.n > 0 ? `<div class="corp-lead off"><b>⚔️ ${esc(top.r.name)} führt den Markt an</b><small>Hol dir die Spitze zurück – erst dann kannst du ${top.r.wave ? "den Konzern" : "sie"} kaufen.</small></div>` : "";
  }
  const d = C.leadSince ? (S.time - C.leadSince) / 1440 : 0, left = Math.max(0, CORP_LEAD_DAYS - d), dn = Math.floor(d);
  return `<div class="corp-lead"><b>👑 Marktführer${dn ? " seit " + dn + (dn === 1 ? " Tag" : " Tagen") : ""}</b>
    <small>${left > 0 ? "Noch " + Math.ceil(left) + (Math.ceil(left) === 1 ? " Tag" : " Tage") + " an der Spitze – dann werden größere Konzerne auf dich aufmerksam." : "Die großen Konzerne haben dich im Visier."}</small>
    <i style="--w:${Math.round(Math.min(1, d / CORP_LEAD_DAYS) * 100)}%"></i></div>`;
}
const ownedRival = id => !!(S.corp && S.corp.owned && S.corp.owned[id]);
const activeRivals = () => (typeof RIVALS === "undefined" ? [] : RIVALS.filter(r => r.st <= S.stage && !ownedRival(r.id)));

function shares() {
  const sh = typeof shareState === "function" ? shareState() : { me: 0 };
  const rows = [{ id: "me", n: sh.me || 0 }].concat(activeRivals().map(r => ({ id: r.id, n: sh[r.id] || 0 })));
  const tot = rows.reduce((a, r) => a + r.n, 0) || 1;
  const out = {};
  rows.forEach(r => { out[r.id] = r.n / tot; });
  return out;
}
/* v306: Ein gemeinsam benutztes Flottenangebot pro Firma/Etappe. Die frühere
   Übergabe würfelte Fahrzeuge erst nach dem Kauf; jetzt werden genau die
   bewerteten Fahrzeuge samt Verschleiß übergeben. Gleichmäßig über den
   Preisbereich verteilt statt zufällig nur Flugzeuge oder nur Kleinwagen. */
function corpFleetPlan(id) {
  const c = CORP[id], C = corp(), n = c.fleet + Math.floor(S.stage / 2);
  const key = [S.stage, n, c.modes, !!c.wave].join("|");
  const all = C.fleets306 || (C.fleets306 = {}), old = all[id];
  if (old && old.key === key && old.fleet.length === n && old.fleet.every(f => vType(f.type))) return old;
  let pool = rivalFleet(id).slice().sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
  if (c.wave) pool = pool.slice(0, Math.max(2, Math.ceil(pool.length / 2)));
  pool.reverse();
  let seed = 2166136261;
  for (const ch of id + "|" + key) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const fleet = [];
  for (let i = 0; i < n && pool.length; i++) {
    const k = Math.min(pool.length - 1, Math.floor((i + 0.35 + random() * 0.3) * pool.length / n));
    fleet.push({ type: pool[k].id, wear: Math.round(c.wave ? 4 + random() * 18 : 20 + random() * 35),
      kmTotal: Math.round(c.wave ? 8000 + random() * 82000 : 40000 + random() * 260000) });
  }
  return (all[id] = { key, fleet });
}
/* v306: Derselbe Bewertungsmaßstab für alle Konkurrenten. Der Sitz trägt
   nur seinen tatsächlichen Immobilien-Zeitwert bei; die frühere rohe
   Konzern-Basis und STAGE_K werden nicht noch einmal multipliziert. */
function corpAppraisal(id) {
  const c = CORP[id], plan = corpFleetPlan(id);
  const fleetValue = plan.fleet.reduce((sum, f) => sum + vehValue(f), 0);
  const hqValue = Math.round(buyPrice(c.hq, OFFICE_TIERS[c.tier]) * 0.6);
  const assets = fleetValue + hqValue, share = shares()[id] || 0;
  const goodwill = Math.round(assets * (0.15 + share * 1.8));
  return { fleet: plan.fleet, fleetValue, hqValue, goodwill, total: roundK(assets + goodwill, 1000) };
}
function corpValue(id) { return corpAppraisal(id).total; }
/* v306: Im Angebot ist erkennbar, ob die Flotte etwa Schiffe/Flugzeuge
   enthält – gleiche Fahrzeuganzahl allein sagt wenig über den Wert aus. */
function corpFleetText(fleet) {
  const counts = {};
  fleet.forEach(f => { const mode = vType(f.type).mode; counts[mode] = (counts[mode] || 0) + 1; });
  return Object.keys(MODE_INFO).filter(mode => counts[mode]).map(mode => MODE_INFO[mode].icon + " " + counts[mode]).join(" · ");
}
/* Voraussetzungen: Level 5 und mindestens so viel Marktanteil wie die andere */
function corpReady(id) {
  if (typeof logiOn === "function" && !logiOn()) return { ok: false, why: "erst nach der Speditionsgründung" };
  const sh = shares();
  if (level() < 5) return { ok: false, why: "ab Level 5" };
  if ((sh.me || 0) < (sh[id] || 0)) return { ok: false, why: "erst mehr Marktanteil als " + rivalById(id).name };
  const t = corp().talks[id];
  if (t && t.cool > S.time) return { ok: false, why: "will erst ab " + stamp(t.cool) + " wieder reden" };
  return { ok: true };
}

/* ------------------------------- Welt-Reiter --------------------------- */
function corpHTML() {
  if (typeof RIVALS === "undefined") return "";
  corpSyncRivals();
  const all = RIVALS.filter(r => r.st <= S.stage);
  if (!all.length) return "";
  /* v170: offene Gegner oben (Konzerne zuerst), darunter die Trophäen */
  const C = corp(), sh = shares();
  const open = all.filter(r => !ownedRival(r.id)).sort((a, b) => (b.wave || 0) - (a.wave || 0));
  const won = all.filter(r => ownedRival(r.id)).sort((a, b) => C.owned[b.id].at - C.owned[a.id].at);
  const rows = open.map(r => {
    const c = CORP[r.id], rd = corpReady(r.id), d = (C.rivals || []).find(x => x.id === r.id), fresh = d && S.time - d.at < 2 * 1440;
    return `<div class="corp-row${r.wave ? " wave" : ""}" style="--rc:${r.col}"><span class="cr-i">${r.icon}</span>
      <span class="cr-t"><b>${esc(r.name)}${r.wave ? `<em class="cr-tag">${fresh ? "NEU · " : ""}Konzern</em>` : ""}</b><small>${esc(c.boss)} · ${Math.round((sh[r.id] || 0) * 100)} % Marktanteil · Firmenwert ~${money(corpValue(r.id))}${r.wave ? " · " + (c.fleet + Math.floor(S.stage / 2)) + " Fahrzeuge · Sitz " + esc(N[c.hq].short) : ""}</small></span>
      ${rd.ok ? `<button class="btn tiny" data-corp="${r.id}">🦈 Angebot</button>` : `<span class="cr-st">${esc(rd.why)}</span>`}</div>`;
  }).join("") + won.map(r => {
    const o = C.owned[r.id];
    return `<div class="corp-row owned" style="--rc:${r.col}"><span class="cr-i">${r.icon}<i class="cr-x">✕</i></span>
      <span class="cr-t"><b>${esc(r.name)}</b><small>gehört seit ${stamp(o.at)} zu ${esc(S.player.company)} · ${money(o.price)}</small></span>
      <span class="cr-st">✓ übernommen</span></div>`;
  }).join("");
  const Ow = Object.values(C.owned || {}), veh = Ow.reduce((x, o) => x + (o.veh || 0), 0), paid = Ow.reduce((x, o) => x + (o.price || 0), 0);
  const emp = Ow.length ? `<div class="corp-emp"><b>Deine Unternehmensgruppe</b><span>${Ow.length} ${Ow.length === 1 ? "Firma" : "Firmen"} übernommen${veh ? " · " + veh + " Fahrzeuge übernommen" : ""} · ${money(paid)} investiert</span></div>` : "";
  return `<div class="card eco corp">
    <div class="card-top"><div class="vname">🦈 Übernahmen<small>Kauf eine Konkurrentin: Flotte, Firmensitz, Kunden und Marktanteil gehören dann dir.</small></div></div>
    ${emp}${rows}
  </div>`;
}
function bindCorp() { $$("#tab-world [data-corp]").forEach(b => b.onclick = () => openCorp(b.dataset.corp)); }

/* ------------------------------ Verhandlung ---------------------------- */
let corpOpen = null;
function openCorp(id) {
  const r = rivalById(id), c = CORP[id]; if (!r || !c || ownedRival(id)) return;
  const rd = corpReady(id); if (!rd.ok) return toast(r.name + ": " + rd.why + ".", "warn");
  const C = corp(), appraisal = corpAppraisal(id), val = appraisal.total, sh = shares();
  let t = C.talks[id];
  /* v306: Auch gespeicherte Gespräche auf die einheitliche Bewertung umrechnen;
     Runde, Verhandlungsfortschritt und bestehende Sperrzeiten bleiben erhalten. */
  if (t && !t.done && t.val && t.val !== val) {
    const k = val / t.val; t.res = Math.round(t.res * k);
    if (t.ask) t.ask = roundK(t.ask * k, 1000);
    if (t.offer) t.offer = Math.round(t.offer * k);
    t.val = val;
    t.chat.push({ me: false, t: "Unsere Bewertung nach Flotte, Firmensitz und Kundenbestand beträgt aktuell " + money(val) + "."
      + (t.ask ? " Unser angepasstes Gegenangebot: " + money(t.ask) + "." : "") });
  }
  if (!t || t.done || t.cool <= S.time && t.round >= 3) {
    /* Was sie insgeheim verlangt: je stärker du, desto weicher wird sie */
    const dom = (sh.me || 0) > 2 * (sh[id] || 0) ? 0.94 : 1;
    t = C.talks[id] = { round: 0, val, res: Math.round(val * rnd(0.88, 1.04) * dom * ((C.spite || {})[id] || 1)), chat: [], ask: null, cool: 0 };
    t.chat.push({ me: false, t: c.wave ? `${c.boss}, ${r.name}. Sie wollen einen Konzern kaufen? Mutig. Der Aufsichtsrat hört zu – machen Sie ein Angebot.`
      : `${c.boss}, ${r.name}. Sie wollen uns kaufen? Machen Sie ein Angebot.` });
  }
  /* v306: Die Zusage gilt für diese konkrete Flotte, auch wenn vor dem
     Unterschreiben eine weitere Etappe freigeschaltet wird. */
  t.fleet306 = appraisal.fleet.map(f => ({ ...f }));
  t.appraisal306 = { fleetValue: appraisal.fleetValue, hqValue: appraisal.hqValue, goodwill: appraisal.goodwill };
  corpOpen = id;
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  renderCorp();
}
function rivalFleet(id) {
  const c = CORP[id];
  const pool = VEHICLES.filter(v => !v.special && v.stage <= S.stage && c.modes.includes(v.mode) && unlockedModes().includes(v.mode));
  return pool.length ? pool : VEHICLES.filter(v => !v.special && v.stage <= S.stage && v.mode === "r");
}
function renderCorp(note) {
  const id = corpOpen, r = rivalById(id), c = CORP[id], t = corp().talks[id];
  if (!r || !t) return;
  const sh = shares(), val = t.val, lo = Math.round(val * 0.6), hi = Math.round(val * 1.6);
  const cur = t.offer || Math.round(val * 0.9);
  const hqOk = isUnlocked(c.hq), baseRoom = (S.bases || []).length < maxBases() && !baseAtNode(c.hq);
  $("#modalBody").innerHTML = `<div class="corpm">
    <div class="mhead"><div><div class="mtitle">${r.icon} ${esc(r.name)}</div>
      <div class="msub">${esc(c.boss)} · ${esc(c.role)}</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button></div>
    <p class="lotm-note">${esc(c.about)}</p>
    <div class="specs">
      <div><small>Firmenwert</small><b>${money(val)}</b></div>
      <div><small>Marktanteil</small><b>${Math.round((sh[id] || 0) * 100)} % · deiner ${Math.round((sh.me || 0) * 100)} %</b></div>
      <div><small>Flotte</small><b>${t.fleet306 ? t.fleet306.length : c.fleet + Math.floor(S.stage / 2)} Fahrzeuge</b>${t.fleet306 ? `<small title="Fahrzeuge je Verkehrsträger">${corpFleetText(t.fleet306)}</small>` : ""}</div>
      <div><small>Firmensitz</small><b>${esc(N[c.hq].short)} · ${OFFICE_TIERS[c.tier].name}</b></div>
    </div>
    ${t.appraisal306 ? `<div class="lot-est">Bewertung: Flotte ${money(t.appraisal306.fleetValue)} · Sitz ${money(t.appraisal306.hqValue)} · Kunden & Organisation ${money(t.appraisal306.goodwill)}</div>` : ""}
    <div class="lim">${t.done ? "✔ Übernommen – Flotte, Firmensitz und Marktanteil gehören jetzt " + esc(S.player.company) + "."
      : "Du bekommst: Flotte, " + (hqOk && baseRoom ? "Firmensitz als Büro + " + (c.wave ? 2 + Math.min(2, c.wave) : 2) + " Leute," : "Firmensitz samt Leuten (vorgemerkt – wird dein Büro, sobald Etappe und Standortplatz da sind),") + " " + (c.wave ? 2 + c.wave : 2) + " Stammkunden, Marktanteil, +" + (c.wave ? 5 : 3) + " Ruf."}</div>
    <div class="nego-chat corp-chat">${t.chat.map(m => `<div class="bub ${m.me ? "out" : "in"}">${esc(m.t)}</div>`).join("")}</div>
    ${note ? `<div class="lotm-msg">${esc(note)}</div>` : ""}
    ${t.done ? "" : `<div class="lotm-box">
      <label class="rsv">Dein Angebot <b id="coVal">${money(cur)}</b> <small id="coPct">${Math.round(cur / val * 100)} % des Firmenwerts</small>
        <input type="range" id="coOff" min="${lo}" max="${hi}" step="${Math.max(1000, roundK(val / 200, 1000))}" value="${cur}"></label>
      <div class="lot-est">Runde ${t.round + 1} von 3 · Kapital ${money(S.money)}</div>
      <div class="bidrow">
        ${t.ask ? `<button class="btn" id="coAsk">Gegenangebot annehmen · ${money(t.ask)}</button>` : ""}
        <button class="btn${t.ask ? " ghost" : ""}" id="coGo">Angebot abgeben</button>
      </div></div>`}
    <div class="mbtns"><button class="btn ghost" id="mCancel">${t.done ? "Schließen" : "Später"}</button></div>
  </div>`;
  const close = () => { corpOpen = null; closeModal(); if (activeTab === "world") renderWorld(); };
  $("#mClose").onclick = close; $("#mCancel").onclick = close;
  const sl = $("#coOff");
  if (sl) sl.oninput = () => { t.offer = +sl.value; $("#coVal").textContent = money(t.offer); $("#coPct").textContent = Math.round(t.offer / val * 100) + " % des Firmenwerts"; };
  const go = $("#coGo"); if (go) go.onclick = () => corpOffer(id, +($("#coOff").value));
  const ak = $("#coAsk"); if (ak) ak.onclick = () => corpOffer(id, t.ask, true);
  const ch = $("#modalBody .corp-chat"); if (ch) ch.scrollTop = ch.scrollHeight;
}
/* v160: Ärger bleibt hängen – Aufschlag auf den Verkaufspreis bei späteren Gesprächen (höchstens +30 %) */
function corpSpite(id, f) { const C = corp(); C.spite = C.spite || {}; C.spite[id] = Math.min(1.3, (C.spite[id] || 1) * f); }
function corpOffer(id, amount, takeAsk) {
  const t = corp().talks[id], r = rivalById(id), c = CORP[id];
  if (!t || t.done) return;
  amount = Math.round(amount);
  if (amount > S.money) return renderCorp("Dafür fehlen " + money(amount - S.money) + " – die Hausbank unter „Welt“ hilft.");
  t.chat.push({ me: true, t: takeAsk ? "Einverstanden: " + money(amount) + "." : "Wir bieten " + money(amount) + " für " + r.name + "." });
  t.round++;
  if (takeAsk || amount >= t.res) {
    t.chat.push({ me: false, t: pick(c.wave ? ["Der Aufsichtsrat hat zugestimmt. Glückwunsch – Sie spielen jetzt in einer anderen Liga.", "Unterschrieben. Ich hätte nie gedacht, dass ausgerechnet Sie uns schlucken."]
      : ["Abgemacht. Ich lasse die Verträge aufsetzen.", "Das ist ein faires Angebot. Wir haben einen Deal.", "Schweren Herzens – aber ja. Kümmern Sie sich gut um meine Leute."]) });
    t.done = true;
    corpClose(id, amount);
    return renderCorp();
  }
  if (amount < t.val * 0.6) {
    /* v160: tief beleidigt – aus Prinzip wird es jetzt teurer (bleibt für die nächste Runde bestehen) */
    corpSpite(id, 1.08);
    t.chat.push({ me: false, t: c.wave ? pick([
      `Lächerlich. Für ${money(amount)} bekommen Sie bei uns nicht einmal den Fuhrpark in ${N[c.hq].short}. Der Aufsichtsrat wertet das als Affront – unser Preis steigt.`,
      `Ist das ein Witz? Ein Konzern wie ${r.name} zum Ramschpreis? Ab jetzt nur noch zu höheren Konditionen. Kommen Sie in zwei Tagen wieder.`]) : pick([
      `Das ist eine Beleidigung! Drei Generationen Arbeit, und Sie bieten mir ${money(amount)}? Jetzt erst recht: Aus Prinzip wird ${r.name} für Sie teurer – und das bleibt so.`,
      `Frechheit! Ich habe mir die Seele aus dem Leib gearbeitet, und Sie feilschen um Almosen. Dafür verlange ich ab jetzt MEHR – aus reinem Prinzip. Kommen Sie in zwei Tagen wieder, wenn Sie Respekt gelernt haben.`,
      `So redet man nicht mit mir! Für dieses Angebot bin ich nicht mal bereit zu überlegen. Mein Preis steigt – aus Prinzip. Und jetzt raus hier.`]) });
    t.cool = S.time + 2 * 1440; t.round = 3; t.ask = null;
    save(); return renderCorp();
  }
  if (t.round >= 3) {
    t.chat.push({ me: false, t: "Heute kommen wir nicht zusammen. In zwei Tagen wieder?" });
    t.cool = S.time + 2 * 1440; t.ask = null;
    save(); return renderCorp();
  }
  /* v282: Seriöse Angebote führen zur Annäherung, nie zu einem Strafaufschlag.
     Alte Gespräche können noch überhöhte Reserven enthalten. */
  const previous = t.ask || t.res;
  const target = Math.min(t.res, t.val);
  const counter = roundK(amount + (Math.max(amount, target) - amount) * 0.55, 1000);
  t.ask = Math.max(amount, Math.min(previous, counter));
  t.res = Math.min(t.res, t.ask);
  t.chat.push({ me: false, t: `Danke für Ihr Angebot. Wir können Ihnen entgegenkommen: Für ${money(t.ask)} können wir die Übernahme vereinbaren.` });
  save(); renderCorp();
}
/* ===== v230: Firmensitz einer übernommenen Firma – vorgemerkt statt verkauft ===== */
function corpHqStaff(r, W) {
  const roles = ["disp", "fahr", "disp", "fahr"].slice(0, W ? 2 + Math.min(2, W) : 2), out = [];
  roles.forEach(role => {
    const p = makeCandidate(false); p.role = role; p.skill = clamp(Math.round(W ? rnd(3, 5) : rnd(2, 4.4)), 2, 5);
    p.wage = Math.round(ROLES[role].wage * (0.62 + p.skill * 0.19));
    out.push({ id: p.id, name: p.name, role, skill: p.skill, wage: p.wage, trait: "war vorher bei " + r.name, av: p.av, since: S.time, jobs: 0 });
  });
  return out;
}
/* Macht aus einem vorgemerkten Firmensitz ein Büro – wenn Etappe und Platz es erlauben. Gibt das Büro zurück oder null. */
function corpHqOpen(id, silent) {
  const C = corp(), p = C.hq && C.hq[id], c = CORP[id], r = rivalById(id);
  if (!p || !c || !r) return null;
  if (!isUnlocked(c.hq)) return null;
  ensureOffices();
  if (baseAtNode(c.hq)) {                    /* dort steht schon ein eigenes Büro → Sitz wie früher verkaufen */
    /* v306: Ein doppelter Sitz wird zum Immobilien-Zeitwert verkauft, nicht
       als pauschaler Anteil am gesamten Konzern samt Schiffen/Flugzeugen. */
    const cash = Math.round(buyPrice(c.hq, OFFICE_TIERS[c.tier]) * 0.6);
    S.money += cash; S.revenue += cash; logMoney("corp", "Verkauf Firmensitz " + r.name, cash);
    delete C.hq[id];
    phoneMsg({ from: c.boss, kind: "info", title: "Firmensitz " + r.name + " verkauft", body: `An diesem Ort hast du schon ein Büro – der Firmensitz ging für ${money(cash)} weg.` });
    return null;
  }
  if (S.bases.length >= maxBases()) return null;
  const W = c.wave || 0;
  const b = { id: "S" + (S.seq++), node: c.hq, tier: c.tier, rent: false, staff: p.staff || [], vehicles: [], mood: W ? 80 : 70, opened: S.time, done: 0,
    nextAt: S.time + 30, pausedUntil: 0, pool: null, poolDay: -1, rentDue: S.time + 30 * 1440,
    deco: { floor: "beton", tint: "natur", wall: "weiss", kitchen: "keine", plants: [] } };
  if (!b.staff.length) b.staff = corpHqStaff(r, W);
  const slots = OFFICE_TIERS[b.tier].slots;
  S.fleet.forEach(v => {
    if (b.vehicles.length >= slots || !v.foreign || v.foreign.id !== id || baseOfVehicle(v.uid)) return;
    if (!N[c.hq].modes.includes(vType(v.type).mode)) return;
    v.at = c.hq; b.vehicles.push(v.uid);
  });
  S.bases.push(b);
  delete C.hq[id];
  refreshPool(b);
  if (perks().hhAll && typeof luckyHeadFor === "function") luckyHeadFor(b);
  if (!silent) {
    phoneMsg({ from: c.boss, kind: "good", title: "Firmensitz " + r.name + " ist jetzt dein Büro",
      toastText: "🏢 Firmensitz " + N[c.hq].short + " ist jetzt dein Büro!",
      body: `Der Firmensitz von ${r.name} in ${N[c.hq].name} gehört jetzt zu ${S.player.company}: ${OFFICE_TIERS[b.tier].name}, ${b.staff.length} Leute und ${b.vehicles.length} Fahrzeuge.` });
    save(); render();
  }
  return b;
}
/* Alte Spielstände: Firmen, deren Sitz damals verkauft wurde, bekommen ihn nachträglich zurück (einmalig, Verkaufserlös bleibt als Entschädigung). */
function corpHqRepair() {
  const C = S.corp; if (!C || !C.owned) return;
  C.hq = C.hq || {};
  /* v281: Auch als erledigt markierte Übernahmen einmalig auf verlorene Sitze prüfen. */
  const restore = !C.hqRestore281;
  let n = 0;
  Object.keys(C.owned).forEach(id => {
    const o = C.owned[id], c = CORP[id], r = rivalById(id);
    if (!o || (o.hq && !restore) || !c || !r) return;
    o.hq = 1;
    if (baseAtNode(c.hq) || C.hq[id]) return;
    C.hq[id] = { staff: corpHqStaff(r, c.wave || 0), legacy: true }; n++;
  });
  C.hqRestore281 = true;
  if (n || restore) save();
}
/* Läuft regelmäßig und nach jeder Etappe: vorgemerkte Firmensitze öffnen, sobald es geht. */
function corpHqTry() {
  if (!S.corp) return;
  if (S.corp.owned && (!S.corp.hqRestore281 || Object.values(S.corp.owned).some(o => !o.hq))) corpHqRepair();
  const ids = Object.keys(S.corp.hq || {});
  if (!ids.length) return;
  const had = S.bases.length;
  for (const id of ids) { if (S.bases.length >= maxBases()) break; const legacy = (S.corp.hq[id] || {}).legacy; const b = corpHqOpen(id, false); if (b && legacy) toast("↩️ Rückwirkend: der damals verkaufte Firmensitz ist wieder da.", "ok"); }
}
function corpClose(id, price) {
  const C = corp(), r = rivalById(id), c = CORP[id], W = c.wave || 0;
  const pct = Math.round((shares()[id] || 0) * 100);            /* v170: für die Show – wie viel Markt du gerade geschluckt hast */
  S.money -= price; S.expense += price;
  logMoney("corp", "Übernahme: " + r.name, -price);
  /* Marktanteil wandert zu dir, offene Kaperversuche enden */
  const sh = shareState(); sh.me = (sh.me || 0) + (sh[id] || 0); sh[id] = 0;
  S.orders.forEach(o => { if (o.rival && o.rival.id === id) delete o.rival; });
  /* v306: Exakt die angebotene Flotte statt einer neuen Zufallsziehung. */
  const fleet = C.talks[id] && C.talks[id].fleet306 || corpFleetPlan(id).fleet, got = [];
  const at = isUnlocked(c.hq) ? c.hq : null;
  for (const f of fleet) {
    const t = vType(f.type);
    const v = makeVehicle(t.id, false);
    if (at && N[at].modes.includes(t.mode)) v.at = at;
    v.wear = f.wear; v.kmTotal = f.kmTotal;
    v.foreign = { id, col: r.col };
    S.fleet.push(v); got.push(v);
  }
  /* v230: Der Firmensitz wird NIE mehr sofort verkauft. Ist die Etappe noch gesperrt oder kein Standortplatz frei,
     bleibt er vorgemerkt (samt Leuten) und geht von selbst als Büro auf, sobald beides passt. */
  let baseTxt, hqChip, staffN = 0;
  const hqSt = corpHqStaff(r, W);
  staffN = hqSt.length;
  corp().hq = corp().hq || {};
  corp().hq[id] = { staff: hqSt };
  const nb = corpHqOpen(id, true);
  if (nb) {
    baseTxt = `Firmensitz ${N[c.hq].name} ist jetzt dein ${OFFICE_TIERS[nb.tier].name} – ${staffN} Leute bleiben.`;
    hqChip = `🏢 ${OFFICE_TIERS[nb.tier].name} in ${N[c.hq].short}`;
  } else {
    baseTxt = `Der Firmensitz in ${N[c.hq].name} ist für dich vorgemerkt – ${staffN} Leute warten dort. Er wird automatisch dein Büro, sobald ${isUnlocked(c.hq) ? "ein Standortplatz frei ist (nächste Etappe)" : "die Etappe freigeschaltet ist"}.`;
    hqChip = `🏢 Firmensitz vorgemerkt · ${N[c.hq].short}`;
  }
  /* v170: Stammkunden der Konkurrentin wechseln zu dir – gut bezahlte Aufträge sofort im Auftragsbuch */
  let cust = 0;
  for (let i = 0; i < (W ? 2 + W : 2); i++) {
    const o = typeof makeOrder === "function" ? makeOrder() : null;
    if (!o) continue;
    o.pay = Math.round(o.pay * (W ? 1.4 : 1.25)); o.expire = Math.max(o.expire, S.time + 1440); o.loyal = r.name;
    S.orders.push(o); cust++;
  }
  if (cust) renderDirty = true;
  if (typeof repAdd === "function") repAdd(S.stage, W ? 5 : 3);
  C.owned[id] = { at: S.time, price, veh: got.length, cust, wave: W, hq: 1 };
  if (S.stake && S.stake.id === id) S.stake = null;   /* v241: die Beteiligung gehört jetzt wieder dir */
  phoneMsg({ from: c.boss, kind: "good", title: r.name + " gehört jetzt zu " + S.player.company,
    toastText: "🦈 Übernahme: " + r.name + " gehört dir!",
    body: `${W ? "„Sie haben uns geschlagen. Respekt.“ " : ""}Unterschrieben! ${got.length} Fahrzeuge fahren jetzt für Sie – umlackieren unter „Flotte“. ${baseTxt}${cust ? " " + cust + " Stammkunden wechseln zu Ihnen." : ""}` });
  if (typeof checkAchievements === "function") checkAchievements();
  save(); render();
  /* v170: die große Show – Verhandlungsfenster zu, Zeitung auf */
  const left = activeRivals().length;
  setTimeout(() => {
    if (corpOpen === id) { corpOpen = null; closeModal(); }
    corpShow({ kind: "win", id, price, veh: got.length, pct, hq: hqChip, staff: staffN, cust, rep: W ? 5 : 3, left });
  }, 900);
}

/* ======================= v170: Zeitungs-Show =======================
   „win“: Titelseite mit Schlagzeile, Stempel ÜBERNOMMEN auf dem Logo der
   Gegnerin, Beute-Chips zählen hoch, Krone mit Imperium-Zähler.
   „threat“: neue Konzerne – Stempel KAMPFANSAGE, ihre Eckdaten, Zitat. */
function corpMyLogo(sz) {
  if (typeof liveryOn === "function" && liveryOn() && typeof logoSVG === "function") return `<span class="cs-logo me">${logoSVG(S.livery.logo, sz, "cs")}</span>`;
  const ini = String(S.player.company || "Du").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return `<span class="cs-logo me mono">${esc(ini)}</span>`;
}
function corpShow(ev) {
  if (!ev || document.getElementById("corpShow")) return;
  corpSyncRivals();
  const me = S.player.company, C = corp(), RM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  let head, sub, duel, chips, crown = "", quote, btn, stampT;
  if (ev.kind === "win") {
    const r = rivalById(ev.id), c = CORP[ev.id]; if (!r || !c) return;
    const A = me.toUpperCase(), B = r.name.toUpperCase();
    head = `${A} ÜBERNIMMT ${B}`;
    sub = `${me} und ${r.name} haben die Übernahme für ${money(ev.price)} vereinbart. Der Geschäftsbetrieb wird unter dem Dach von ${me} fortgeführt.`;
    stampT = "ÜBERNOMMEN";
    duel = `<div class="cs-side">${corpMyLogo(84)}<b>${esc(me)}</b></div>
      <div class="cs-arrow">⟸</div>
      <div class="cs-side them" style="--rc:${r.col}"><span class="cs-logo them">${r.icon}<i class="cs-crack"></i></span><b>${esc(r.name)}</b><i class="cs-stamp">${stampT}</i></div>`;
    const ch = [["🚚", ev.veh, " Fahrzeuge", "+"], ["📈", ev.pct, " % Marktanteil", "+"], [null, ev.hq], ev.staff ? ["👥", ev.staff, " Leute übernommen", "+"] : null,
      ev.cust ? ["📋", ev.cust, " Stammkunden", "+"] : null, ["⭐", ev.rep, " Ruf", "+"]].filter(Boolean);
    chips = ch.map((x, i) => `<span class="cs-chip" style="animation-delay:${(RM ? 0.2 : 1.9) + i * 0.17}s">${x[0] ? `${x[0]} ${x[3]}<b data-n="${x[1]}">0</b>${x[2]}` : esc(x[1])}</span>`).join("");
    const Ow = Object.values(C.owned || {}), paid = Ow.reduce((a, o) => a + (o.price || 0), 0);
    crown = `<div class="cs-crown"><b>Unternehmensgruppe: ${Ow.length} ${Ow.length === 1 ? "Übernahme" : "Übernahmen"}</b><small>${money(paid)} investiert · ${Ow.reduce((a, o) => a + (o.veh || 0), 0)} Fahrzeuge übernommen</small></div>`;
    quote = `<b>Übernahme abgeschlossen</b><small>Die Integration von Flotte, Standorten und Personal beginnt.</small>`;
    btn = "Zur Unternehmensübersicht";
  } else {
    const Rs = (ev.ids || []).map(id => ({ r: rivalById(id), c: CORP[id] })).filter(x => x.r && x.c); if (!Rs.length) return;
    head = pick(["KONZERNE GREIFEN AN", "ANGRIFF AUF DEN MARKTFÜHRER", "DIE GROSSEN KOMMEN"]);
    sub = `${Rs.map(x => x.r.name).join(" und ")} drängen auf den Markt – ${me} soll die Spitze verlieren.`;
    stampT = "KAMPFANSAGE";
    duel = `<div class="cs-side">${corpMyLogo(70)}<b>${esc(me)}</b></div><div class="cs-arrow vs">VS</div>
      ${Rs.map(x => `<div class="cs-side them big" style="--rc:${x.r.col}"><span class="cs-logo them">${x.r.icon}</span><b>${esc(x.r.name)}</b></div>`).join("")}<i class="cs-stamp red">${stampT}</i>`;
    chips = Rs.map((x, i) => `<span class="cs-chip threat" style="animation-delay:${(RM ? 0.2 : 1.9) + i * 0.2}s">${x.r.icon} ${esc(x.r.name)} · ${x.c.fleet + Math.floor(S.stage / 2)} Fahrzeuge · Sitz ${esc(N[x.c.hq].short)} · Firmenwert ~${money(corpValue(x.r.id))}</span>`).join("");
    quote = `<b>„${esc(Rs[0].c.hello)}“</b><small>– ${esc(Rs[0].c.boss)}, ${esc(Rs[0].c.role)}, ${esc(Rs[0].r.name)}</small>`;
    crown = `<div class="cs-crown threat"><span>⚔️</span><b>Sie schnappen Aufträge schneller weg</b><small>Hol dir die Marktführung zurück – dann kannst du sie kaufen.</small></div>`;
    btn = "⚔️ Herausforderung annehmen";
  }
  const el = document.createElement("div");
  el.id = "corpShow"; el.className = "cs-" + ev.kind + (RM ? " rm" : "");
  el.innerHTML = `<div class="cs-rays"></div><div class="cs-fx"></div>
    <div class="cs-wrap">
      <div class="cs-paper">
        <div class="cs-mast"><b>Logistik-Kurier</b><small>Sonderausgabe · ${esc(stamp(S.time))}</small></div>
        <h2 class="cs-head${head.length > 34 ? " long" : ""}">${esc(head)}</h2>
        <p class="cs-sub">${esc(sub)}</p>
        <div class="cs-duel">${duel}</div>
      </div>
      <div class="cs-loot">${chips}</div>
      ${crown}
      <div class="cs-quote">${quote}</div>
      <button class="btn cs-go">${btn}</button>
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add("cs-open");
  const later = (ms, f) => setTimeout(() => { if (el.isConnected) f(); }, RM ? Math.min(ms, 300) : ms);
  const snd = k => { if (typeof sfx === "function") try { sfx(k); } catch (e) { /* stumm */ } };
  if (ev.kind !== "win") snd("horn");
  later(1150, () => {
    if (ev.kind !== "win") { snd("thud"); snd("bad"); }
    el.classList.add("hit");
    try { if (navigator.vibrate) navigator.vibrate(ev.kind === "win" ? [60, 40, 120] : [90, 50, 90]); } catch (e) { /* kein Rütteln */ }
  });
  /* Zahlen zählen hoch, jede mit einem Münzklang */
  el.querySelectorAll(".cs-chip").forEach((chip, i) => later(1900 + i * 170, () => {
    snd(ev.kind === "win" ? "coin" : "pop");
    const b = chip.querySelector("b[data-n]"); if (!b) return;
    const to = +b.dataset.n, t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 600); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
    step();
  }));
  /* Goldregen (Sieg) bzw. Funken (Kampfansage) */
  if (!RM) later(1200, () => {
    const fx = el.querySelector(".cs-fx"), n = ev.kind === "win" ? 0 : 22;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.textContent = ev.kind === "win" ? pick(["🪙", "✨", "💶", "⭐"]) : pick(["⚡", "💥"]);
      p.style.left = Math.random() * 100 + "%"; p.style.animationDelay = (Math.random() * 1.6).toFixed(2) + "s";
      p.style.animationDuration = (2.2 + Math.random() * 1.8).toFixed(2) + "s"; p.style.fontSize = (14 + Math.random() * 16).toFixed(0) + "px";
      fx.appendChild(p);
    }
  });
  /* v282: Keine zusätzliche Siegesfanfare bei einer Übernahme. */
  el.querySelector(".cs-go").onclick = () => {
    snd("tap");
    el.classList.add("out");
    setTimeout(() => { el.remove(); document.body.classList.remove("cs-open"); if (typeof activeTab !== "undefined" && activeTab === "world" && typeof renderWorld === "function") renderWorld(); }, 320);
  };
}

if (typeof ACHS !== "undefined") ACHS.push(
  { id: "corp1", icon: "🦈", name: "Haifisch", desc: "Eine Konkurrentin übernommen.", ok: () => Object.keys((S.corp || {}).owned || {}).length >= 1 },
  { id: "corp3", icon: "👑", name: "Platzhirsch", desc: "Drei Konkurrentinnen übernommen.", ok: () => Object.keys((S.corp || {}).owned || {}).length >= 3 }
);
