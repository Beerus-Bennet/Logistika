/* =========================================================================
   LOGISTIKA – Auktionshaus Falkenried
   Unter „Markt“ umschaltbar: Lose ansehen, mitbieten (auch mit Limit),
   in der Schlussphase live gegen Sammler und Konkurrenz steigern, eigene
   Autos und Flottenfahrzeuge einliefern. Gekaufte Autos stehen in der
   Garage, gewinnen oder verlieren an Wert – und fahren auf Wunsch als
   Wertkurier mit. Fotos kommen zur Laufzeit von Wikipedia/Wikimedia Commons.
   ========================================================================= */
"use strict";

const AH_NAME = "Auktionshaus Falkenried";
const AH_PREMIUM = 0.12;          /* Aufgeld für den Käufer */
const AH_COMMISSION = 0.08;       /* Provision beim Verkauf */
const AH_LOTS = 8;
const AH_BIDDERS = ["Sammlung Weißenfels", "Dr. Vittorio Salvi", "Scuderia Brandt", "Lady Margot Ashcombe", "Kenji Morimoto",
  "Familie Oppermann", "Telefonbieter aus Monaco", "Autohaus Kranich", "Stiftung Motorkultur", "Online-Bieter 4711",
  "Hanseatische Oldtimer AG", "Pierre-Louis Garnier", "Gräfin von Ahlen", "Motorsport Kessler"];
const AH_SELLERS = ["Nachlass eines Sammlers", "Privatsammlung aus Stuttgart", "Erstbesitz, scheckheftgepflegt", "Scheunenfund",
  "Werksnahe Sammlung", "Aus einem Museum", "Garagenwagen, unfallfrei", "Sammlung am Tegernsee"];
const AH_COND = [null, { n: "makellos", f: 1.3 }, { n: "sehr gut", f: 1 }, { n: "gebraucht", f: 0.78 }, { n: "verbraucht", f: 0.55 }, { n: "restaurierungsbedürftig", f: 0.35 }];
const AH_CLS_W = { young: 15, classic: 20, sport: 19, super: 20, hyper: 17, legend: 9 };


/* Jedes Auto bekommt einen Fahrzeugtyp – damit fährt es als Wertkurier mit */
const carSpeed = c => Math.round(clamp(95 + (c.vmax - 250) * 0.2, 88, 135));
const carCostKm = c => Math.round((c.e === "elektro" ? 0.16 + c.ps / 9000 : 0.28 + c.ps / 1400) * 100) / 100;
CARS.forEach(c => {
  VEHICLES.push({ id: "car-" + c.id, name: carName(c), brand: "Sammlerstück · " + CAR_CLS[c.cls].name, mode: "r",
    cap: c.cap, speed: carSpeed(c), costKm: carCostKm(c), daily: Math.max(3, Math.round(c.val * 0.00012)), price: c.val,
    stage: 1, range: c.e === "elektro" ? 450 : 750, icon: c.body === "suv" ? "🚙" : "🏎️", flags: ["kurier"], special: true, car: c.id });
  if (c.e === "elektro" && typeof ELECTRIC !== "undefined") ELECTRIC.add("car-" + c.id);
});

/* ------------------------------- Zustand ------------------------------- */
function ah() {
  if (!S.ah) S.ah = { on: false, lots: [], garage: [], past: [], idx: {}, seq: 1, view: "live", brand: "all", next: 0 };
  return S.ah;
}
const ahMode = () => !!(S && S.ah && S.ah.on);
const lotById = id => ah().lots.find(l => l.id === id);
const garageById = id => ah().garage.find(g => g.uid === id);
const liveLots = () => ah().lots.filter(l => !l.done);
function ahInc(p) {
  return p < 10000 ? 250 : p < 50000 ? 500 : p < 100000 ? 1000 : p < 250000 ? 2500 : p < 500000 ? 5000
    : p < 1e6 ? 10000 : p < 5e6 ? 25000 : p < 1e7 ? 50000 : 100000;
}
/* auf zwei gültige Stellen runden – Schätzpreise sehen dann aus wie echte */
function nice(v) {
  if (v <= 0) return 0;
  const m = Math.pow(10, Math.floor(Math.log10(v)) - 1);
  return Math.round(v / m) * m;
}
/* Marktindex je Modell: langfristiger Trend × kurzfristige Schwankung */
const carIdx = id => (ah().idx[id] || 1) * ((ah().nz || {})[id] || 1);
const carMarket = c => c.val * carIdx(c.id);
function kmFactor(c, km) {
  const ref = c.cls === "legend" || c.cls === "classic" ? 400000 : c.cls === "young" ? 300000 : 150000;
  return clamp(1.1 - km / ref, 0.5, 1.1);
}
function carValue(c, cond, km, luck) { return carMarket(c) * AH_COND[cond].f * kmFactor(c, km) * (luck || 1); }
function gValue(g) {
  if (g.kind === "veh") return 0;
  return nice(carValue(CAR[g.car], g.cond, g.km, g.luck));
}
function lotName(l) { return l.kind === "veh" ? vType(l.vt).name : carName(CAR[l.car]); }
function wpick(obj) {
  const e = Object.entries(obj), tot = e.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * tot;
  for (const [k, w] of e) { r -= w; if (r <= 0) return k; }
  return e[0][0];
}

/* ------------------------------ Lose bauen ----------------------------- */
function rivalsFor(val, n, trade) {
  const pool = [...AH_BIDDERS];
  if (typeof RIVALS !== "undefined") RIVALS.filter(r => r.st <= S.stage && !(S.corp && S.corp.owned && S.corp.owned[r.id]))
    .forEach(r => pool.push(r.name));
  const names = pool.sort(() => Math.random() - 0.5).slice(0, n);
  const step = v => { const i = ahInc(v); return Math.round(v / i) * i; };
  const out = names.map(nm => ({ n: nm, max: step(val * rnd(trade ? 0.7 : 0.72, trade ? 1.05 : 1.12)) }));
  if (Math.random() < 0.25 && out.length) out[0].max = step(val * rnd(1.1, 1.3));
  return out;
}
function makeLot(opt) {
  const A = ah(), o = opt || {};
  const l = { id: "L" + (A.seq++), hist: [], bids: 0, lead: null, me: { max: 0 }, done: false, seller: pick(AH_SELLERS) };
  const used = new Set(liveLots().map(x => x.car));
  if (o.veh || (!o.car && !o.garage && Math.random() < 0.12)) {
    /* Nutzfahrzeug aus einer Insolvenzmasse – oder dein eigenes */
    let t = o.veh ? vType(o.veh.type) : null;
    if (!t) {
      const pool = VEHICLES.filter(v => !v.special && v.stage <= S.stage && unlockedModes().includes(v.mode) && v.price <= 400000 * stageK());
      t = pick(pool);
      l.seller = pick(["Insolvenzmasse einer Spedition", "Leasingrückläufer", "Flottenauflösung", "Aus einer Konkursmasse"]);
    }
    l.kind = "veh"; l.vt = t.id;
    l.wear = o.veh ? Math.round(wearOf(o.veh)) : Math.round(rnd(18, 70));
    l.km = o.veh ? Math.round(o.veh.kmTotal || 0) : Math.round(rnd(20000, 380000) / 1000) * 1000;
    l.val = Math.round(t.price * 0.7 * (1 - l.wear / 100 * 0.5));
    l.est = [nice(l.val * 0.8), nice(l.val * 1.1)];
  } else {
    let c = o.car ? CAR[o.car] : null;
    for (let k = 0; !c && k < 8; k++) {
      const cls = wpick(AH_CLS_W);
      const cand = CARS.filter(x => x.cls === cls && !used.has(x.id) && (x.id !== "f250" || Math.random() < 0.15));
      if (cand.length) c = pick(cand);
    }
    c = c || pick(CARS);
    l.kind = "car"; l.car = c.id;
    const g = o.garage;
    const ongoing = /seit|ab/.test(c.yrs);
    l.y = g ? g.y : clamp(c.y + Math.round(rnd(-1, 2)), ongoing ? c.y - 1 : c.y - 2, 2026);
    const age = Math.max(0.4, 2026.7 - l.y);
    const per = { hyper: [200, 1500], legend: [150, 1200], super: [1000, 5000], sport: [3000, 14000], classic: [500, 4000], young: [5000, 12000] }[c.cls];
    l.km = g ? Math.round(g.km) : Math.round(age * rnd(per[0], per[1]) / 100) * 100;
    l.cond = g ? g.cond : +wpick(l.y >= 2010 ? { 1: 45, 2: 45, 3: 10 } : { 1: 15, 2: 35, 3: 30, 4: 13, 5: 7 });
    l.paint = g ? g.paint : (paintOfPhoto(c.id) || pick(CAR_PAINTS[c.b]));
    l.luck = g ? g.luck : rnd(0.93, 1.07);
    l.val = Math.round(carValue(c, l.cond, l.km, l.luck));
    l.est = [nice(l.val * 0.85), nice(l.val * 1.12)];
  }
  l.start = nice(l.val * rnd(0.45, 0.62));
  l.price = l.start;
  l.rivals = rivalsFor(l.val, Math.round(rnd(2, 6.4)), l.kind === "veh");
  l.ends = Math.round(S.time + (o.mine ? rnd(480, 840) : rnd(360, 1800)));
  if (o.mine) { l.mine = true; l.reserve = o.reserve || 0; l.seller = S.player ? S.player.company : "Du"; }
  if (o.garage) l.garage = o.garage.uid;
  if (o.veh) l.fleetVeh = { type: o.veh.type, wear: o.veh.wear || 0, km: o.veh.kmTotal || 0 };
  A.lots.push(l);
  return l;
}
function ensureLots(initial) {
  const A = ah();
  let n = liveLots().filter(l => !l.mine).length;
  while (n < AH_LOTS) {
    const l = makeLot();
    if (initial) l.ends = Math.round(S.time + 90 + n * rnd(150, 260));
    n++;
  }
  A.next = S.time + rnd(120, 300);
}

/* ------------------------------- Bieten ------------------------------- */
function setPrice(l, p, who) {
  l.price = Math.round(p); l.lead = who; l.bids++;
  l.hist.unshift({ w: who, a: l.price, t: S.time });
  if (l.hist.length > 30) l.hist.length = 30;
}
function leaderMax(l) {
  if (l.lead === "me") return l.me.max;
  const r = l.rivals.find(x => x.n === l.lead);
  return r ? r.max : l.price;
}
let outbidAt = {};
function outbid(l) {
  if (outbidAt[l.id] && S.time - outbidAt[l.id] < 20) return;
  outbidAt[l.id] = S.time;
  toast("🔨 Überboten: " + lotName(l) + " – jetzt " + money(l.price) + ".", "warn");
}
/* Ein Sammler meldet sich – bietet wie mit einem hinterlegten Limit */
function rivalAct(l, r) {
  const need = l.lead ? l.price + ahInc(l.price) : l.start;
  if (r.max < need || l.lead === r.n) return false;
  if (!l.lead) { setPrice(l, l.start, r.n); return true; }
  const lm = leaderMax(l), prev = l.lead;
  if (r.max > lm) {
    setPrice(l, Math.min(r.max, Math.max(need, lm + ahInc(lm))), r.n);
    if (prev === "me") outbid(l);
  } else {
    setPrice(l, r.max, r.n);
    setPrice(l, Math.min(lm, r.max + ahInc(r.max)), prev);
  }
  return true;
}
function bidBudget() { return Math.max(0, Math.floor(S.money / (1 + AH_PREMIUM))); }
/* Spielergebot: max ist das Limit. Gesteigert wird nur so weit wie nötig. */
function playerBid(l, max) {
  if (!l || l.done) return { ok: false, msg: "Die Auktion ist vorbei." };
  if (l.mine) return { ok: false, msg: "Auf eigene Lose kannst du nicht bieten." };
  max = Math.round(max);
  const need = l.lead ? l.price + ahInc(l.price) : l.start;
  if (l.lead === "me") {
    if (max <= l.me.max) return { ok: false, msg: "Du führst schon – Limit " + money(l.me.max) + "." };
    if (max > bidBudget()) return { ok: false, msg: "Dafür reicht das Kapital nicht (inkl. 12 % Aufgeld)." };
    l.me.max = max; save();
    return { ok: true, msg: "Limit erhöht auf " + money(max) + " – du führst weiter." };
  }
  if (max < need) return { ok: false, msg: "Mindestgebot: " + money(need) + "." };
  if (max > bidBudget()) return { ok: false, msg: "Dafür reicht das Kapital nicht (inkl. 12 % Aufgeld)." };
  l.me.max = max;
  if (!l.lead) { setPrice(l, l.start, "me"); save(); return { ok: true, lead: true, msg: "Erstes Gebot – du führst." }; }
  const lm = leaderMax(l), prev = l.lead;
  if (max > lm) {
    setPrice(l, Math.min(max, Math.max(need, lm + ahInc(lm))), "me");
    save();
    return { ok: true, lead: true, msg: "Du führst mit " + money(l.price) + "." };
  }
  setPrice(l, max, "me");
  setPrice(l, Math.min(lm, max + ahInc(max)), prev);
  save();
  return { ok: true, lead: false, msg: "Sofort überboten – " + prev + " hat ein höheres Limit." };
}

/* ------------------------------- Takt --------------------------------- */
function tickAuction(dt) {
  if (!S.ah) return;             /* erst beim ersten Besuch wird das Haus eröffnet */
  const A = ah();
  if (S.time >= A.next) ensureLots(false);
  liveLots().forEach(l => {
    if (l.hammer) return;
    const hot = l.ends - S.time < 90;
    const p = hot ? 1 / 22 : 1 / 70;
    if (Math.random() < 1 - Math.pow(1 - p, Math.min(dt, 30))) {
      const el = l.rivals.filter(r => r.n !== l.lead && r.max >= (l.lead ? l.price + ahInc(l.price) : l.start));
      if (el.length) { rivalAct(l, pick(el)); renderDirty = true; }
    }
    if (S.time >= l.ends) {
      if ((l.me.max > 0 || l.mine) && canHammer()) { l.hammer = true; startHammer(l); }
      else finishLot(l);
    }
  });
}
function dayAuction(days) {
  if (!S.ah) return;
  const A = ah();
  if (!A.nz) A.nz = {};
  for (let d = 0; d < days; d++) CARS.forEach(c => {
    A.idx[c.id] = clamp((A.idx[c.id] || 1) * (1 + c.tr / 100 / 365), 0.3, 5);
    A.nz[c.id] = clamp(1 + ((A.nz[c.id] || 1) - 1) * 0.97 + (Math.random() - 0.5) * 0.012, 0.85, 1.15);
  });
}
function canHammer() {
  return !calm() && playing() && !tutorialRunning() && !S.jail && !S.over
    && (typeof document === "undefined" || document.visibilityState !== "hidden");
}

/* ---------------------------- Zuschlag -------------------------------- */
function finishLot(l) {
  if (l.done) return;
  const A = ah();
  l.done = true; l.hammer = false;
  const name = lotName(l);
  let res;
  if (l.mine) {
    /* Bietet jemand mindestens den Mindestpreis, steigert das Haus bis dorthin */
    if (l.lead && l.reserve && l.price < l.reserve && leaderMax(l) >= l.reserve) setPrice(l, l.reserve, l.lead);
    const sold = !!l.lead && l.price >= (l.reserve || 0);
    if (sold) {
      const net = Math.round(l.price * (1 - AH_COMMISSION));
      S.money += net;
      logMoney("auction", "Versteigert: " + name, net);
      if (l.garage) A.garage = A.garage.filter(g => g.uid !== l.garage);
      res = "sold";
      phoneMsg({ from: AH_NAME, kind: "good", title: "Zuschlag für Ihr Los",
        body: `${name} ging für ${money(l.price)} an ${l.lead}. Nach ${Math.round(AH_COMMISSION * 100)} % Provision: +${money(net)}.` });
    } else {
      if (l.garage) { const g = garageById(l.garage); if (g) delete g.consigned; }
      if (l.fleetVeh) {
        const v = makeVehicle(l.fleetVeh.type, false); v.wear = l.fleetVeh.wear; v.kmTotal = l.fleetVeh.km;
        S.fleet.push(v);
      }
      res = "unsold";
      phoneMsg({ from: AH_NAME, kind: "info", title: "Los nicht verkauft",
        body: `${name}: ${l.lead ? "Höchstgebot " + money(l.price) + " unter Mindestpreis." : "Kein Gebot."} ${l.kind === "car" ? "Zurück in der Garage." : "Zurück in der Flotte."}` });
    }
  } else if (l.lead === "me" && S.money < Math.round(l.price * (1 + AH_PREMIUM))) {
    /* Zahlung nicht gedeckt: der Zuschlag geht an den Unterbieter */
    const next = l.rivals.filter(r => r.max >= l.start).sort((a, b) => b.max - a.max)[0];
    if (next) { l.lead = next.n; l.price = Math.min(l.price, next.max); } else l.lead = null;
    res = "lost";
    phoneMsg({ from: AH_NAME, kind: "trouble", title: "Zuschlag nicht bezahlt",
      body: `Konto nicht gedeckt für ${name} (${money(Math.round(l.price * (1 + AH_PREMIUM)))} inkl. Aufgeld). ${next ? "Zuschlag geht an " + next.n + "." : "Los geht zurück."}` });
  } else if (l.lead === "me") {
    const cost = Math.round(l.price * (1 + AH_PREMIUM));
    S.money -= cost; S.expense += cost;
    logMoney("auction", "Ersteigert: " + name, -cost);
    if (l.kind === "car") {
      A.garage.push({ uid: "G" + (A.seq++), kind: "car", car: l.car, y: l.y, km: l.km, cond: l.cond, paint: l.paint, luck: l.luck, paid: cost, at: S.time });
    } else {
      const v = makeVehicle(l.vt, false); v.wear = l.wear; v.kmTotal = l.km;
      S.fleet.push(v);
    }
    res = "won";
    phoneMsg({ from: AH_NAME, kind: "good", title: "Glückwunsch zum Zuschlag",
      body: `${name} gehört Ihnen: ${money(l.price)} + ${Math.round(AH_PREMIUM * 100)} % Aufgeld = ${money(cost)}. ${l.kind === "car" ? "Steht in der Garage." : "Ist in der Flotte."}` });
  } else {
    res = l.me.max > 0 ? "lost" : "other";
    if (res === "lost") toast("🔨 " + name + " ging für " + money(l.price) + " an " + l.lead + ".", "warn");
  }
  A.past.unshift({ id: l.id, kind: l.kind, car: l.car, vt: l.vt, price: l.price, lead: l.lead, bids: l.bids, res, t: S.time, paint: l.paint });
  if (A.past.length > 25) A.past.length = 25;
  A.lots = A.lots.filter(x => x.id !== l.id);
  save(); renderDirty = true;
  if (activeTab === "market" && ahMode()) renderAuction();
  return res;
}

/* ------------------------- Garage & Einliefern ------------------------ */
function carToFleet(uid) {
  const g = garageById(uid); if (!g || g.fleet || g.consigned) return;
  const c = CAR[g.car];
  if (c.track) return toast("Keine Straßenzulassung – der " + c.m + " fährt nur auf der Rennstrecke.", "warn");
  if (c.cap < 1) return toast("Kein Kofferraum – für Kurierfahrten ungeeignet.", "warn");
  const v = makeVehicle("car-" + c.id, false);
  v.garage = g.uid; v.wear = [0, 2, 8, 25, 45, 70][g.cond];
  S.fleet.push(v); g.fleet = v.uid;
  toast("🏎️ " + carName(c) + " fährt jetzt als Wertkurier – jeder Kilometer kostet Sammlerwert.", "ok");
  save(); render();
}
function carBack(vuid) {
  const v = S.fleet.find(f => f.uid === vuid); if (!v) return;
  if (v.phase !== "idle") return toast("Der Wagen ist gerade unterwegs.", "warn");
  const g = garageById(v.garage);
  if (S.follow === vuid) setFollow(null);
  if (typeof baseOfVehicle === "function") { const b = baseOfVehicle(vuid); if (b) b.vehicles = b.vehicles.filter(x => x !== vuid); }
  S.fleet = S.fleet.filter(f => f.uid !== vuid);
  if (g) { delete g.fleet; toast("🅿️ " + carName(CAR[g.car]) + " steht wieder in der Garage.", "ok"); }
  save(); render();
}
function consignCar(uid, reserve) {
  const g = garageById(uid); if (!g || g.fleet || g.consigned) return null;
  const l = makeLot({ car: g.car, garage: g, mine: true, reserve });
  g.consigned = l.id;
  toast("🔨 " + carName(CAR[g.car]) + " eingeliefert – Auktion endet " + stamp(l.ends) + ".", "ok");
  save(); renderDirty = true;
  return l;
}
function consignVeh(vuid, reserve) {
  const f = S.fleet.find(x => x.uid === vuid); if (!f) return null;
  const t = vType(f.type);
  if (f.phase !== "idle") { toast("Nur freie Fahrzeuge lassen sich einliefern.", "warn"); return null; }
  if (f.lease || t.special) { toast("Nur eigene Fahrzeuge lassen sich versteigern.", "warn"); return null; }
  const l = makeLot({ veh: f, mine: true, reserve });
  if (S.follow === vuid) setFollow(null);
  if (typeof baseOfVehicle === "function") { const b = baseOfVehicle(vuid); if (b) b.vehicles = b.vehicles.filter(x => x !== vuid); }
  S.fleet = S.fleet.filter(x => x.uid !== vuid);
  toast("🔨 " + t.name + " eingeliefert – Auktion endet " + stamp(l.ends) + ".", "ok");
  save(); render();
  return l;
}
/* Kilometer im Kurierdienst senken den Sammlerwert (extras.js onDriven) */
function carDriven(veh, km) {
  if (!veh.garage || !S.ah) return;
  const g = garageById(veh.garage); if (g) g.km += km;
}

/* ------------------------------- Fotos -------------------------------- */
/* v2: Vorschaubilder in 500 px (eine Standardgröße von Wikimedia, die fast
   immer schon fertig im Cache liegt – große Sondergrößen werden gedrosselt) */
const PIC_KEY = "logistika-carpics-2";
const PIC_W = 500;
try { localStorage.removeItem("logistika-carpics-1"); } catch (_) { /* egal */ }
let PICS = (() => { try { return JSON.parse(localStorage.getItem(PIC_KEY)) || {}; } catch (_) { return {}; } })();
let picsBusy = false;
function plainText(html) {
  if (!html) return "";
  try { return (new DOMParser().parseFromString(String(html), "text/html").body.textContent || "").replace(/\s+/g, " ").trim(); }
  catch (_) { return String(html).replace(/<[^>]*>/g, "").trim(); }
}
/* Zustand für die Anzeige: wie viele Fotos da sind, was zuletzt schiefging */
const PIC_STATE = { err: "", at: 0 };
function withTimeout(ms) {
  const ac = typeof AbortController === "function" ? new AbortController() : null;
  const t = ac ? setTimeout(() => ac.abort(), ms) : 0;
  return { signal: ac ? ac.signal : undefined, done: () => clearTimeout(t) };
}
const errText = e => e && e.name === "AbortError" ? "Zeitüberschreitung" : (e && e.message) || "Netzwerkfehler";
async function wikiApi(params) {
  const url = "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&" + params;
  const to = withTimeout(15000);
  try {
    const r = await fetch(url, { signal: to.signal, credentials: "omit" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { to.done(); }
}
/* Ersatzweg: Kurzfassung des Artikels (anderer Endpunkt, liefert Titelbild) */
async function wikiSummary(title) {
  const to = withTimeout(12000);
  try {
    const r = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")), { signal: to.signal, credentials: "omit" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { to.done(); }
}
/* v78: Wikimedia liefert Vorschaubilder inzwischen von thumb.wikimedia.org – beide Hosts sind in Ordnung */
const okSrc = u => typeof u === "string" && /^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(u);
/* Vorschaubild auf eine Standardbreite setzen (nur bei echten Thumbnails) */
const thumbAt = (u, w) => /\/thumb\//.test(u) ? u.replace(/\/\d+px-([^/]+)$/, "/" + w + "px-$1") : u;
/* Titelbild der Wikipedia-Artikel samt Vorschaubild holen, dann Urheber und
   Lizenz – alles gebündelt in wenigen Anfragen, danach gespeichert. Jeder
   Schritt für sich: scheitert die Urheber-Abfrage, bleiben die Bilder. */
/* v77: eigene Fotos im Spiel selbst (Ordner cars/, siehe carpics.mjs und die GitHub-Aktion
   „Autofotos holen“): cars/credits.json nennt je Auto Datei, Urheber und Lizenz. Die liegen auf derselben
   Seite wie das Spiel – kein Umweg über Wikipedia, klappt auch, wenn Wikipedia blockiert ist. */
let localPics = null;                       /* null: noch nicht gefragt, sonst { id: {...} } (leer, wenn es keine gibt) */
async function loadLocalPics() {
  if (localPics) return localPics;
  try {
    const r = await fetch("cars/credits.json?v=" + (window.LOGI_V || ""), { cache: "no-cache" });
    localPics = r.ok ? await r.json() : {};
  } catch (_) { localPics = {}; }
  if (!localPics || typeof localPics !== "object") localPics = {};
  let n = 0;
  Object.entries(localPics).forEach(([id, p]) => {
    if (!CAR[id] || !p || !p.f) return;
    PICS[id] = { src: "cars/" + p.f, page: p.page || "", by: p.by || "", lic: p.lic || "", t: Date.now(), local: 1 };
    n++;
  });
  /* v79: KI-Zeichnungen (cars/art.json: { id: "art/<id>.png?v=…" }) gehen den Fotos vor und brauchen keinen Comic-Filter */
  let art = {};
  try {
    const r = await fetch("cars/art.json?v=" + (window.LOGI_V || ""), { cache: "no-cache" });
    art = r.ok ? await r.json() : {};
  } catch (_) { art = {}; }
  if (!art || typeof art !== "object") art = {};
  Object.keys(PICS).forEach(id => { if (PICS[id] && PICS[id].art && !(typeof art[id] === "string")) { delete PICS[id]; COMIC_URL.delete(id); COMIC_FAIL.delete(id); n++; } });
  Object.entries(art).forEach(([id, f]) => {
    if (!CAR[id] || typeof f !== "string" || !/^art\/[\w.\-]+(\?v=\d+)?$/.test(f)) return;
    PICS[id] = { src: "cars/" + f, by: "KI-Illustration", lic: "", t: Date.now(), local: 1, art: 1 };
    COMIC_URL.delete(id); COMIC_FAIL.delete(id);
    n++;
  });
  if (n) { savePics(); applyPics(); renderPicStatus(); }
  return localPics;
}
let picRetryT = 0, picRetryN = 0;
async function resolvePics(force) {
  if (picsBusy || typeof fetch !== "function") return;
  if (!localPics) { picsBusy = true; try { await loadLocalPics(); } finally { picsBusy = false; } }
  const now = Date.now();
  if (force) CARS.forEach(c => { if (PICS[c.id] && !PICS[c.id].src) delete PICS[c.id]; });
  const todo = CARS.filter(c => !PICS[c.id] || (!PICS[c.id].src && now - (PICS[c.id].t || 0) > 10 * 60e3));
  if (!todo.length) return;
  picsBusy = true;
  PIC_STATE.err = "";
  renderPicStatus();
  const files = {};
  try {
    todo.forEach(c => { if (c.file) files[c.id] = c.file; });
    /* 1. Titelbild + fertiges Vorschaubild je Artikel */
    const wp = todo.filter(c => c.wp && !c.file);
    try {
      for (let i = 0; i < wp.length; i += 40) {
        const batch = wp.slice(i, i + 40);
        const j = await wikiApi("redirects=1&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=" + PIC_W + "&pilimit=50&pilicense=free&titles="
          + batch.map(c => encodeURIComponent(c.wp)).join("%7C"));
        const q = j.query || {}, map = {};
        (q.normalized || []).forEach(n => { map[n.from] = n.to; });
        (q.redirects || []).forEach(n => { map[n.from] = n.to; });
        const fin = t => { let x = t, k = 0; while (map[x] && k++ < 4) x = map[x]; return x; };
        const pages = {};
        (q.pages || []).forEach(p => { pages[p.title] = p; });
        batch.forEach(c => {
          const p = pages[fin(c.wp)];
          if (!p) return;
          if (p.pageimage) files[c.id] = p.pageimage.replace(/_/g, " ");
          const th = p.thumbnail && p.thumbnail.source;
          if (okSrc(th)) PICS[c.id] = { src: th, page: "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent((p.pageimage || "").replace(/ /g, "_")), by: "", lic: "", t: now };
        });
      }
    } catch (e) { PIC_STATE.err = errText(e); }
    /* 2. Urheber, Lizenz (und für feste Dateinamen auch das Vorschaubild) */
    try {
      const ids = Object.keys(files);
      for (let i = 0; i < ids.length; i += 40) {
        const batch = ids.slice(i, i + 40);
        const j = await wikiApi("prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=" + PIC_W + "&iiextmetadatafilter=Artist%7CLicenseShortName&titles="
          + batch.map(id => encodeURIComponent("File:" + files[id])).join("%7C"));
        const q = j.query || {}, map = {};
        (q.normalized || []).forEach(n => { map[n.from] = n.to; });
        const pages = {};
        (q.pages || []).forEach(p => { pages[p.title] = p; });
        batch.forEach(id => {
          const t0 = "File:" + files[id], p = pages[map[t0] || t0];
          const ii = p && p.imageinfo && p.imageinfo[0];
          if (!ii) return;
          const src = ii.thumburl || ii.url, md = ii.extmetadata || {}, old = PICS[id] && PICS[id].src ? PICS[id] : null;
          if (!old && !okSrc(src)) return;
          PICS[id] = { src: old ? old.src : src, page: ii.descriptionurl || (old && old.page) || "",
                       by: plainText(md.Artist && md.Artist.value).slice(0, 70), lic: plainText(md.LicenseShortName && md.LicenseShortName.value), t: now };
        });
      }
    } catch (e) { if (!PIC_STATE.err) PIC_STATE.err = errText(e); }
    /* 3. Was noch fehlt: einzeln über die Kurzfassung des Artikels */
    const miss = todo.filter(c => !PICS[c.id] || !PICS[c.id].src).filter(c => c.wp);
    let fails = 0;
    for (const c of miss) {
      if (fails >= 6) break;
      try {
        const j = await wikiSummary(c.wp);
        const o = j && j.originalimage, th = j && j.thumbnail;
        let src = null;
        if (o && okSrc(o.source) && (o.width || 9999) <= 800) src = o.source;
        else if (th && okSrc(th.source)) src = thumbAt(th.source, PIC_W);
        if (src) PICS[c.id] = { src, page: j.content_urls && j.content_urls.desktop ? j.content_urls.desktop.page : "", by: "", lic: "Wikimedia Commons", t: now, sum: 1 };
      } catch (e) { fails++; if (!PIC_STATE.err) PIC_STATE.err = errText(e); }
    }
    /* v77: nur merken, dass es für ein Auto kein Foto gibt, wenn die Abfrage selbst geklappt hat – vorher sperrte ein
       Fehlschlag (z. B. kurz offline) alle 77 Autos für zehn Minuten („0 von 77 Fotos geladen“, ohne Fehlermeldung) */
    const gotAny = todo.some(c => PICS[c.id] && PICS[c.id].src);
    if (gotAny && !PIC_STATE.err) todo.forEach(c => { if (!PICS[c.id]) PICS[c.id] = { t: now }; });
    if (picCount() > CARS.length * 0.5) PIC_STATE.err = "";
    /* nichts bekommen: in 45 s, 2 und 5 Minuten noch einmal (solange das Spiel offen ist) */
    if (!gotAny && picRetryN < 3 && !picRetryT) picRetryT = setTimeout(() => { picRetryT = 0; picRetryN++; resolvePics(true); }, [45e3, 120e3, 300e3][picRetryN]);
    if (gotAny) picRetryN = 0;
    savePics();
    applyPics();
  } catch (e) { PIC_STATE.err = errText(e); }
  PIC_STATE.at = Date.now();
  picsBusy = false;
  renderPicStatus();
}
function savePics() { try { localStorage.setItem(PIC_KEY, JSON.stringify(PICS)); } catch (_) { /* voll */ } }
function picCount() { return CARS.filter(c => PICS[c.id] && PICS[c.id].src).length; }
/* Hinweis im Auktionshaus, wenn Fotos fehlen – mit „Erneut versuchen“ */
function picStatusHTML() {
  const n = picCount();
  if (n >= CARS.length * 0.9 && !PIC_STATE.err) return "";
  /* v77: ohne Fotos zeigt das Auktionshaus gezeichnete Autos – der Hinweis bleibt klein */
  const txt = picsBusy ? "📷 Fotos werden geladen …"
    : PIC_STATE.err ? "📷 Wikipedia gerade nicht erreichbar (" + PIC_STATE.err + ") – bis dahin gezeichnete Autos"
    : n ? "📷 " + n + " von " + CARS.length + " Fotos geladen" : "📷 Fotos noch nicht geladen – bis dahin gezeichnete Autos";
  return `<div class="picstat"><span>${esc(txt)}</span>${picsBusy ? "" : `<button class="btn tiny ghost" data-picretry="1">↻ Erneut versuchen</button>`}</div>`;
}
function renderPicStatus() {
  const el = document.querySelector("#tab-market .picstat-slot");
  if (el) { el.innerHTML = picStatusHTML(); bindPicRetry(el); }
}
function bindPicRetry(root) {
  root.querySelectorAll("[data-picretry]").forEach(b => b.onclick = () => {
    COMIC_FAIL.clear(); COMIC_TRY.clear();
    try { localStorage.removeItem(PIC_KEY); } catch (_) { /* egal */ }
    PICS = {}; localPics = null; picRetryN = 0; if (picRetryT) { clearTimeout(picRetryT); picRetryT = 0; }
    resolvePics(true);
    renderPicStatus();
  });
}

/* ------------------- Fotos im Comic-Look (photo.js) ---------------------
   Die Fotos werden nacheinander geladen (nicht alle auf einmal – das mag
   Wikimedia nicht), mit dem Comic-Filter für Autos gezeichnet und als JPEG
   im Foto-Speicher abgelegt. Bis dahin steht die gezeichnete Silhouette da;
   klappt der Filter nicht, kommt das Originalfoto.                      */
const COMIC_URL = new Map(), COMIC_FAIL = new Set(), COMIC_TRY = new Map(), COMIC_Q = [];
let comicBusy = false;
const comicKey = id => location.origin + "/__carcomic/v2/" + id + "-" + (PICS[id] && PICS[id].src ? PICS[id].src.length : 0) + ".jpg";
function wantComic(id, front) {
  if (COMIC_URL.has(id) || COMIC_FAIL.has(id)) return;
  if (PICS[id] && PICS[id].art && PICS[id].src) { COMIC_URL.set(id, PICS[id].src); showCarPic(id); detectPaint(id, PICS[id].src); return; }   /* v79: Zeichnung – kein Filter */
  if (!PICS[id] || !PICS[id].src || typeof comicCar !== "function") return;
  const at = COMIC_Q.indexOf(id);
  if (at >= 0) { if (front && at > 0) { COMIC_Q.splice(at, 1); COMIC_Q.unshift(id); } return; }
  if (front) COMIC_Q.unshift(id); else COMIC_Q.push(id);
  if (!comicBusy) setTimeout(comicNext, 30);
}
async function loadBitmap(blob) {
  if (typeof createImageBitmap === "function") { try { return await createImageBitmap(blob); } catch (_) { /* weiter unten */ } }
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(blob), im = new Image();
    im.onload = () => { res(im); };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Bild")); };
    im.src = u;
  });
}
/* Der Filter rechnet im Hintergrund (Worker), damit nichts ruckelt;
   ohne Worker-Unterstützung eben direkt. */
let comicWorker = null, comicWorkerBad = false, comicSeq = 0;
const comicWait = new Map();
function comicRun(data, W, H) {
  if (!comicWorker && !comicWorkerBad && typeof Worker === "function") {
    try {
      const src = "let phRangeTab = null, phRangeSr = 0; const CAR_FX = " + JSON.stringify(CAR_FX) + ";\n"
        + phGauss.toString() + "\n" + phBilateral.toString() + "\n" + comicCar.toString() + "\n"
        + "onmessage = e => { const d = e.data; comicCar({ width: d.w, height: d.h, data: d.px }, CAR_FX); postMessage({ n: d.n, px: d.px }, [d.px.buffer]); };";
      comicWorker = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
      comicWorker.onmessage = e => { const f = comicWait.get(e.data.n); if (f) { comicWait.delete(e.data.n); f.res(e.data.px); } };
      comicWorker.onerror = () => { comicWorkerBad = true; comicWorker = null; comicWait.forEach(f => f.rej(new Error("worker"))); comicWait.clear(); };
    } catch (_) { comicWorkerBad = true; comicWorker = null; }
  }
  if (!comicWorker) { comicCar(data, CAR_FX); return Promise.resolve(data.data); }
  return new Promise((res, rej) => {
    const n = ++comicSeq, px = new Uint8ClampedArray(data.data);
    comicWait.set(n, { res, rej });
    comicWorker.postMessage({ n, w: W, h: H, px }, [px.buffer]);
  });
}
/* Mögliche Adressen eines Fotos: die gespeicherte, kleinere Standardgröße, Original */
function picUrls(src) {
  const out = [src];
  if (!/^https?:/.test(src)) return out;                 /* eigenes Foto (cars/…) */
  if (/\/thumb\//.test(src)) {
    out.push(thumbAt(src, 330));
    out.push(src.replace(/\/thumb\//, "/").replace(/\/[^/]+$/, ""));
  }
  return [...new Set(out)];
}
const sleepMs = ms => new Promise(r => setTimeout(r, ms));
async function fetchPic(src) {
  let last = null;
  for (const u of picUrls(src)) {
    for (let k = 0; k < 3; k++) {
      const to = withTimeout(20000);
      try {
        const r = await fetch(u, { mode: "cors", credentials: "omit", signal: to.signal });
        if (r.ok) return await r.blob();
        last = new Error("HTTP " + r.status);
        /* gedrosselt: kurz warten und nochmal, sonst die nächste Adresse */
        if (r.status === 429 || r.status === 503) { await sleepMs(1500 * (k + 1) + Math.random() * 600); continue; }
        break;
      } catch (e) { last = e; if (e && e.name === "AbortError") break; await sleepMs(800); }
      finally { to.done(); }
    }
  }
  throw last || new Error("Foto");
}
async function comicNext() {
  const id = COMIC_Q.shift();
  if (!id) { comicBusy = false; return; }
  comicBusy = true;
  try {
    const cache = typeof caches !== "undefined" ? await caches.open("logistika-carpics").catch(() => null) : null;
    const key = comicKey(id);
    let blob = null;
    const hit = cache && await cache.match(key).catch(() => null);
    if (hit) blob = await hit.blob();
    else {
      const bm = await loadBitmap(await fetchPic(PICS[id].src));
      const W0 = bm.width, H0 = bm.height, k = Math.min(1, 640 / W0);
      const W = Math.max(1, Math.round(W0 * k)), H = Math.max(1, Math.round(H0 * k));
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const c = cv.getContext("2d");
      c.imageSmoothingQuality = "high";
      c.drawImage(bm, 0, 0, W, H);
      if (bm.close) bm.close();
      const data = c.getImageData(0, 0, W, H);
      const px = await comicRun(data, W, H);
      c.putImageData(new ImageData(new Uint8ClampedArray(px), W, H), 0, 0);
      blob = await new Promise(res => cv.toBlob(res, "image/jpeg", 0.9));
      if (!blob) throw new Error("JPEG");
      if (cache) cache.put(key, new Response(blob, { headers: { "Content-Type": "image/jpeg" } })).catch(() => {});
    }
    const url = URL.createObjectURL(blob);
    COMIC_URL.set(id, url);
    showCarPic(id);
    detectPaint(id, blob);
  } catch (_) {
    /* später nochmal (z. B. gedrosselt), nach drei Versuchen bleibt das Originalfoto */
    const n = (COMIC_TRY.get(id) || 0) + 1;
    COMIC_TRY.set(id, n);
    if (n < 3) setTimeout(() => wantComic(id), 4000 * n);
    else { COMIC_FAIL.add(id); showCarPic(id); }
  }
  setTimeout(comicNext, 120);
}
/* v154: Lackfarbe aus dem Foto bestimmen – Notiz („Kyalamigrün“) und Autobild passen so immer zusammen */
function hex2lab(h) {
  const n = parseInt(h.replace("#", ""), 16), f = v => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
  return rgb2lab(f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255));
}
function rgb2lab(r, g, b) {
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, Y = r * 0.2126 + g * 0.7152 + b * 0.0722, Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const q = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = q(X), fy = q(Y), fz = q(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function paintFromPixels(d, W, H, list) {
  const labs = list.map(p => hex2lab(p[1])), votes = list.map(() => 0);
  let n = 0, dark = 0;
  const x0 = Math.floor(W * 0.18), x1 = Math.ceil(W * 0.82), y0 = Math.floor(H * 0.32), y1 = Math.ceil(H * 0.66);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * W + x) * 4; if (d[i + 3] < 200) continue;
    const f = v => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
    const L = rgb2lab(f(d[i]), f(d[i + 1]), f(d[i + 2]));
    n++;
    if (L[0] < 20) { dark++; continue; }   /* Reifen, Scheiben, Schatten */
    let b = 0, bd = 1e9;
    labs.forEach((q, k) => { const dd = 0.45 * (L[0] - q[0]) ** 2 + (L[1] - q[1]) ** 2 + (L[2] - q[2]) ** 2; if (dd < bd) { bd = dd; b = k; } });
    votes[b] += 1 + Math.hypot(L[1], L[2]) / 40;   /* kräftige Farben zählen mehr als Grau (Straße, Himmel) */
  }
  if (n < 20) return -1;
  let best = 0; votes.forEach((v, k) => { if (v > votes[best]) best = k; });
  const bl = list.findIndex(p => hex2lab(p[1])[0] < 22);
  if (bl >= 0 && dark / n > 0.5) return bl;
  return best;
}
async function detectPaint(id, src) {
  const p = PICS[id], c = CAR[id];
  if (!p || !c || p.pc || !CAR_PAINTS[c.b]) return;
  try {
    const bm = await loadBitmap(typeof src === "string" ? await (await fetch(src)).blob() : src);
    const W = 96, H = Math.max(24, Math.round(96 * bm.height / bm.width));
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(bm, 0, 0, W, H);
    if (bm.close) bm.close();
    const k = paintFromPixels(cx.getImageData(0, 0, W, H).data, W, H, CAR_PAINTS[c.b]);
    if (k < 0) return;
    p.pc = CAR_PAINTS[c.b][k][0]; savePics();
    if (ahFixPaints()) ahRefreshPaintUI();
  } catch (_) { /* Foto nicht lesbar: Lack bleibt wie gewürfelt */ }
}
function paintOfPhoto(carId) {
  const p = PICS[carId], c = CAR[carId];
  if (!p || !p.pc || !c || !CAR_PAINTS[c.b]) return null;
  return CAR_PAINTS[c.b].find(q => q[0] === p.pc) || null;
}
/* alle Lose, Garage und Verlauf an das Foto angleichen; true = etwas geändert */
function ahFixPaints() {
  if (typeof S === "undefined" || !S || !S.ah) return false;
  const A = S.ah; let ch = false;
  const fix = o => { if (!o || o.kind !== "car") return; const q = paintOfPhoto(o.car); if (q && (!o.paint || o.paint[0] !== q[0])) { o.paint = [q[0], q[1]]; ch = true; } };
  (A.lots || []).forEach(fix); (A.garage || []).forEach(fix); (A.past || []).forEach(fix);
  return ch;
}
function ahRefreshPaintUI() {
  try {
    if (typeof lotModal !== "undefined" && lotModal && typeof refreshLotModal === "function") renderLotModal();
    else if (activeTab === "market" && !document.body.classList.contains("modal-open")) renderAuction();
  } catch (_) { /* egal */ }
}
/* Bild in alle Rahmen dieses Autos setzen (Comic, sonst Original) */
function showCarPic(id) {
  const p = PICS[id];
  if (!p || !p.src) return;
  document.querySelectorAll(`[data-carpic="${id}"]`).forEach(el => {
    el.classList.remove("loading");
    const im = el.querySelector("img");
    if (COMIC_URL.has(id)) {
      if (im) { im.classList.add("cx"); im.removeAttribute("onerror"); im.src = COMIC_URL.get(id); }
      else el.insertAdjacentHTML("beforeend", picImgHTML(id, p));
    } else if (COMIC_FAIL.has(id) && !im) el.insertAdjacentHTML("beforeend", picImgHTML(id, p));
  });
}
function picCredit(p) { if (p.art) return "🎨 KI-Illustration"; return "📷 " + (p.by || "Wikimedia Commons") + (p.lic ? " · " + p.lic : ""); }
function applyPics() {
  document.querySelectorAll("[data-carpic]").forEach(el => {
    const id = el.dataset.carpic;
    if (COMIC_URL.has(id) || COMIC_FAIL.has(id)) showCarPic(id);
    else wantComic(id, el.classList.contains("big"));
  });
}
/* Foto lädt nicht? Der Reihe nach andere Wege probieren, dann aufgeben */
function picFail(im) {
  const n = +(im.dataset.try || 0) + 1;
  im.dataset.try = n;
  const id = im.closest("[data-carpic]") && im.closest("[data-carpic]").dataset.carpic, p = PICS[id];
  const urls = p && p.src ? picUrls(p.src) : [];
  if (!urls[n]) { const cr = im.nextElementSibling; if (cr && cr.classList.contains("credit")) cr.remove(); im.remove(); return; }
  im.src = urls[n];
}
function picImgHTML(id, p) {
  const comic = COMIC_URL.has(id), src = comic ? COMIC_URL.get(id) : p.src;
  return `<img src="${esc(src)}" class="${comic ? "cx" : ""}" alt="${esc(carName(CAR[id]))}" referrerpolicy="no-referrer"${p.art ? ` onerror="this.nextElementSibling&&this.nextElementSibling.remove();this.remove()"` : comic ? "" : ` onerror="picFail(this)"`}>`
    + `<span class="credit">${esc(picCredit(p))}</span>`;
}
/* Gezeichnetes Auto, solange kein Foto da ist (oder offline). v77: statt einer einfachen Silhouette eine
   Seitenansicht im Comic-Stil – Bauform je Modell (Coupé, flacher Mittelmotor-Keil, Roadster, SUV, Kombi,
   Limousine, Klassiker), Lack mit Glanzverlauf, Scheiben, Radhäuser, Felgen, Scheinwerfer und Rückleuchten.
   Front rechts. viewBox 320 × 140, Boden bei y ≈ 121. */
const CAR_ART = {
  coupe:    { body: "M16 96 Q14 84 24 80 Q60 66 104 52 Q132 44 158 44 Q186 45 206 56 L236 70 Q276 74 296 80 Q306 84 305 96 L303 102 Q301 105 294 105 L24 105 Q16 105 16 96 Z",
              win: "M98 64 Q130 51 158 51 Q184 51 200 60 L222 71 L104 69 Z", pil: [[168, 51, 167, 70]], wh: [70, 250], r: 19, door: [128, 206], head: "e", hx: 293, hy: 85,
              shine: "M36 84 Q110 66 200 70 Q262 74 292 82" },
  wedge:    { body: "M14 94 Q14 84 24 80 L70 74 Q110 70 128 64 Q156 48 184 46 Q204 46 216 54 L240 66 Q284 72 300 82 Q308 86 306 96 L304 102 Q302 105 294 105 L22 105 Q14 105 14 94 Z",
              win: "M136 64 Q160 52 184 51 Q200 51 210 58 L228 67 Q182 66 136 66 Z", pil: [], wh: [72, 250], r: 20, door: [150, 222], head: "slim", hx: 292, hy: 84,
              intake: "M98 82 L132 75 L139 93 L105 97 Z", shine: "M30 84 Q120 72 200 70 Q262 72 296 84" },
  roadster: { body: "M14 94 Q14 84 26 80 Q60 76 96 76 L150 75 Q168 74 186 72 L240 72 Q282 74 298 82 Q307 86 305 96 L303 102 Q301 105 294 105 L24 105 Q14 105 14 94 Z",
              shield: "M184 73 L206 54 L213 55 L195 74 Z", hump: "M100 77 Q110 62 126 63 Q136 65 138 76 Z", seat: "M140 76 Q152 66 172 67 L186 73 Z",
              wh: [70, 250], r: 19, door: [150, 214], head: "e", hx: 292, hy: 85, shine: "M34 86 Q130 78 230 76 Q270 76 294 84" },
  suv:      { ty: 70, th: 12, body: "M18 104 L18 74 Q18 64 30 62 L58 60 Q70 46 92 40 Q100 38 112 38 L210 38 Q224 38 236 48 L258 64 Q290 68 300 74 Q306 78 306 92 L306 104 Z",
              win: "M64 61 Q76 50 94 46 L208 46 Q218 46 226 52 L245 64 Z", pil: [[112, 46, 112, 63], [166, 46, 166, 64]], wh: [74, 254], r: 22, wy: 103, door: [118, 222], head: "box", hx: 292, hy: 76,
              rail: "M72 35 H212", clad: "M18 95 H306 V104 H18 Z", shine: "M30 74 Q160 66 296 74" },
  kombi:    { ty: 70, th: 12, body: "M16 100 L16 66 Q16 52 30 50 L72 46 L194 46 Q206 46 214 52 L240 70 Q284 74 298 80 Q306 84 306 96 L304 102 Q302 105 294 105 L24 105 Q16 105 16 100 Z",
              win: "M26 66 L28 57 Q30 53 36 53 L192 53 Q201 53 206 57 L226 70 Z", pil: [[72, 53, 72, 68], [126, 53, 126, 69], [178, 53, 178, 70]], wh: [70, 252], r: 19, door: [130, 214], head: "slim", hx: 292, hy: 85,
              shine: "M26 76 Q150 70 292 80" },
  limo:     { ty: 79, tx: 16, body: "M14 96 Q14 84 24 80 L56 76 L84 74 Q100 54 112 50 Q118 48 128 48 L196 48 Q208 48 216 54 L242 72 Q284 74 298 80 Q307 84 305 96 L303 102 Q301 105 294 105 L22 105 Q14 105 14 96 Z",
              win: "M92 73 Q104 57 114 55 Q119 54 128 54 L194 54 Q204 54 210 59 L228 72 Z", pil: [[160, 54, 160, 72]], wh: [68, 250], r: 19, door: [112, 220], head: "box", hx: 292, hy: 84,
              shine: "M24 84 Q150 74 294 82" },
  classic:  { ty: 81, tx: 20, body: "M20 100 Q14 88 26 82 Q46 76 84 74 Q104 58 130 52 Q156 46 184 50 Q206 54 222 70 Q262 70 286 76 Q304 82 304 96 Q303 104 294 104 L28 104 Q22 104 20 100 Z",
              win: "M96 72 Q110 60 130 56 Q156 51 182 55 Q200 59 212 71 Z", pil: [[156, 53, 156, 72]], wh: [74, 248], r: 18, door: [112, 214], head: "round", hx: 291, hy: 83,
              chrome: 1, shine: "M34 86 Q120 74 220 76 Q266 77 296 86" }
};
let carArtN = 0;
function hexMix(a, b, t) {
  const p = h => { h = String(h).replace("#", ""); if (h.length === 3) h = h.split("").map(x => x + x).join(""); const n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const A = p(a), B = p(b);
  return "#" + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, "0")).join("");
}
function carArtShape(c) {
  const b = (c && c.body) || "coupe";
  if (b === "coupe" && c && (c.cls === "super" || c.cls === "hyper" || c.b === "lambo" || c.b === "bugatti" || (c.b === "ferrari" && c.cls !== "classic"))) return "wedge";
  return CAR_ART[b] ? b : "coupe";
}
function carArt(c, paint) {
  const S = CAR_ART[carArtShape(c)], u = "ca" + (++carArtN), P = paint || "#888", ink = "#0d1b2a";
  const wy = S.wy || 102, R = S.r, dark = hexMix(P, "#000000", 0.32), lite = hexMix(P, "#ffffff", 0.38);
  const wheel = x => {
    const sp = [0, 1, 2, 3, 4].map(k => { const a = k / 5 * Math.PI * 2 - Math.PI / 2; return `M${x} ${wy} L${(x + Math.cos(a) * R * 0.52).toFixed(1)} ${(wy + Math.sin(a) * R * 0.52).toFixed(1)}`; }).join(" ");
    return `<circle cx="${x}" cy="${wy}" r="${R}" fill="#1b2330" stroke="${ink}" stroke-width="3.5"/>`
      + (S.chrome ? `<circle cx="${x}" cy="${wy}" r="${(R * 0.74).toFixed(1)}" fill="none" stroke="#eef1f4" stroke-width="3"/>` : "")
      + `<circle cx="${x}" cy="${wy}" r="${(R * 0.56).toFixed(1)}" fill="${S.chrome ? "#e6eaee" : "#c3ccd5"}" stroke="${ink}" stroke-width="2"/>`
      + (S.chrome ? "" : `<path d="${sp}" stroke="#7d8996" stroke-width="3" stroke-linecap="round"/>`)
      + `<circle cx="${x}" cy="${wy}" r="${(R * 0.17).toFixed(1)}" fill="#6d7885"/>`;
  };
  const head = S.head === "slim" ? `<path d="M${S.hx - 10} ${S.hy - 4} l18 4 l-2 4 l-17 -3 Z" fill="#fff6d0" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`
    : S.head === "box" ? `<rect x="${S.hx - 9}" y="${S.hy - 4}" width="15" height="8" rx="2" fill="#fff6d0" stroke="${ink}" stroke-width="2"/>`
    : S.head === "round" ? `<circle cx="${S.hx}" cy="${S.hy}" r="6" fill="#fff6d0" stroke="${ink}" stroke-width="2"/>`
    : `<ellipse cx="${S.hx}" cy="${S.hy}" rx="8" ry="5" fill="#fff6d0" stroke="${ink}" stroke-width="2"/>`;
  const glass = d => `<path d="${d}" fill="url(#${u}g)" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`;
  return `<svg class="ph art" viewBox="0 0 320 140" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <linearGradient id="${u}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lite}"/><stop offset=".48" stop-color="${P}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <linearGradient id="${u}g" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#d9ebf4"/><stop offset="1" stop-color="#5f7f96"/></linearGradient>
      <clipPath id="${u}c"><path d="${S.body}"/></clipPath>
    </defs>
    <ellipse cx="162" cy="${wy + R - 1}" rx="146" ry="7" fill="rgba(13,27,42,.22)"/>
    ${S.chrome ? `<path d="M8 92 Q8 86 16 86 L28 86 L28 97 L16 97 Q8 97 8 92 Z" fill="#dfe4e9" stroke="${ink}" stroke-width="2.5"/>` : ""}
    <path d="${S.body}" fill="url(#${u}p)"/>
    ${S.clad ? `<path d="${S.clad}" fill="rgba(13,27,42,.28)" clip-path="url(#${u}c)"/>` : ""}
    <g clip-path="url(#${u}c)">${S.wh.map(x => `<circle cx="${x}" cy="${wy}" r="${R + 5}" fill="#141b24"/>`).join("")}
      <path d="M20 ${wy - 2} H300" stroke="rgba(13,27,42,.3)" stroke-width="4"/></g>
    <path d="${S.body}" fill="none" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    ${S.hump ? `<path d="${S.hump}" fill="${dark}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>` : ""}
    ${S.seat ? `<path d="${S.seat}" fill="#2a2f38" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>` : ""}
    ${S.win ? glass(S.win) : ""}${S.shield ? glass(S.shield) : ""}
    ${(S.pil || []).map(q => `<path d="M${q[0]} ${q[1]} L${q[2]} ${q[3]}" stroke="${dark}" stroke-width="5"/>`).join("")}
    ${S.win ? `<path d="${S.win}" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>` : ""}
    ${S.rail ? `<path d="${S.rail}" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>` : ""}
    ${S.intake ? `<path d="${S.intake}" fill="#1b2330" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>` : ""}
    <path d="${S.shine}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="4" stroke-linecap="round"/>
    <path d="M${S.door[0]} 74 L${S.door[0] + 2} ${wy - 4} M${S.door[1]} 74 L${S.door[1] - 2} ${wy - 4}" stroke="rgba(13,27,42,.45)" stroke-width="2"/>
    <path d="M${S.door[1] - 26} 80 h12" stroke="rgba(13,27,42,.55)" stroke-width="3" stroke-linecap="round"/>
    ${S.chrome ? `<path d="M36 89 H282" stroke="#eef1f4" stroke-width="2.5"/><path d="M294 88 L306 88 Q313 88 313 93 Q313 98 306 98 L294 98 Z" fill="#dfe4e9" stroke="${ink}" stroke-width="2.5"/>` : ""}
    ${head}
    <path d="M${S.tx || 17} ${S.ty || 84} l11 -2 l1 ${S.th || 7} l-12 1 Z" fill="#d8333a" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
    ${S.wh.map(wheel).join("")}
  </svg>`;
}
function carPicHTML(c, paint, big) {
  const p = PICS[c.id], col = paint || (CAR_PAINTS[c.b] || [["", "#888"]])[0][1];
  /* Comic fertig (oder Filter gescheitert): Bild gleich mit; sonst erst die
     Silhouette, das Foto kommt aus der Warteschlange nach */
  let ready = p && p.src && (COMIC_URL.has(c.id) || COMIC_FAIL.has(c.id));
  if (p && p.src && !ready) { wantComic(c.id, big); ready = COMIC_URL.has(c.id) || COMIC_FAIL.has(c.id); }
  return `<div class="carpic${big ? " big" : ""}${p && p.src && !ready ? " loading" : ""}" data-carpic="${c.id}" style="--pc:${col}">${carArt(c, col)}${ready ? picImgHTML(c.id, p) : ""}</div>`;
}
function vehPicHTML(t) {
  const mi = MODE_INFO[t.mode];
  return `<div class="carpic veh" style="--pc:${mi.color}"><span class="vbig">${t.icon}</span></div>`;
}
function lotPicHTML(l, big) { return l.kind === "veh" ? vehPicHTML(vType(l.vt)) : carPicHTML(CAR[l.car], l.paint && l.paint[1], big); }

/* ------------------------------ Oberfläche ---------------------------- */
function ahSwitchHTML(on) {
  return `<div class="chiprow first mswitch">
    <button class="fchip${on ? "" : " on"}" data-ahmode="0">🚚 Fahrzeugmarkt</button>
    <button class="fchip${on ? " on" : ""}" data-ahmode="1">🔨 Auktionshaus${S.ah && liveLots().some(l => l.lead === "me") ? " <b>👑</b>" : ""}</button>
  </div>`;
}
function bindAhSwitch(vt) {
  vt.querySelectorAll("[data-ahmode]").forEach(b => b.onclick = () => {
    const on = b.dataset.ahmode === "1";
    ah().on = on;
    if (on && !ah().lots.length) ensureLots(true);
    if (on && !(S.tutSeen && S.tutSeen.auction) && typeof linaTalk === "function") setTimeout(() => linaTalk("auction"), 450);
    $("#viewTitle").textContent = on ? "Auktionshaus" : TAB_TITLE.market;
    save(); renderMarket();
    const vb = $("#view .view-body"); if (vb) vb.scrollTop = 0;
  });
}
const AH_VIEWS = [["live", "🔴 Live"], ["mine", "⭐ Meine Gebote"], ["garage", "🏁 Garage"], ["cat", "📖 Katalog"], ["past", "📜 Ergebnisse"]];
function ahToolsHTML() {
  const A = ah();
  const cnt = { live: liveLots().filter(l => !l.mine).length, mine: liveLots().filter(l => l.me.max > 0 || l.mine).length,
    garage: A.garage.length, cat: CARS.length, past: A.past.length };
  const views = AH_VIEWS.map(([k, lbl]) => chipHTML("data-ahview", k, lbl, cnt[k], A.view === k)).join("");
  let brands = "";
  if (A.view === "live" || A.view === "cat") {
    const src = A.view === "live" ? liveLots().filter(l => !l.mine && l.kind === "car").map(l => CAR[l.car]) : CARS;
    brands = `<div class="chiprow">${chipHTML("data-ahbrand", "all", "Alle", src.length, A.brand === "all")}${CAR_BRANDS.map(([k, n]) =>
      chipHTML("data-ahbrand", k, n, src.filter(c => c.b === k).length, A.brand === k)).join("")}</div>`;
  }
  return ahSwitchHTML(true) + `<div class="chiprow">${views}</div>` + brands;
}
function bindAhTools(vt) {
  bindAhSwitch(vt);
  const A = ah();
  vt.querySelectorAll("[data-ahview]").forEach(b => b.onclick = () => { A.view = b.dataset.ahview; save(); renderAuction(); $("#view .view-body").scrollTop = 0; });
  vt.querySelectorAll("[data-ahbrand]").forEach(b => b.onclick = () => { A.brand = b.dataset.ahbrand === A.brand ? "all" : b.dataset.ahbrand; save(); renderAuction(); });
}
function leftTxt(l) {
  const m = l.ends - S.time;
  return m <= 0 ? "Zuschlag läuft" : m < 60 ? "noch " + Math.max(1, Math.round(m)) + " min" : "noch " + dur(m);
}
function leadHTML(l) {
  if (l.mine) return l.lead ? `<span class="lot-lead mine">Höchstgebot: ${esc(l.lead)}</span>` : `<span class="lot-lead mine">noch kein Gebot</span>`;
  if (l.lead === "me") return `<span class="lot-lead me">👑 Du führst</span>`;
  if (l.me.max > 0) return `<span class="lot-lead out">⚠️ überboten</span>`;
  return l.lead ? `<span class="lot-lead">${esc(l.lead)}</span>` : `<span class="lot-lead">noch kein Gebot</span>`;
}
function lotMeta(l) {
  if (l.kind === "veh") return `${esc(vType(l.vt).brand)} · ${fmt(l.km, 0)} km · Zustand ${100 - l.wear} %`;
  return `${l.y} · ${fmt(l.km, 0)} km · ${esc(l.paint[0])} · Note ${l.cond}`;
}
function bidBtnLabel(l) {
  const need = l.lead ? l.price + ahInc(l.price) : l.start;
  return l.lead === "me" ? "Limit erhöhen" : "bieten · " + money(need);
}
function lotCardHTML(l) {
  const cls = l.kind === "car" ? CAR_CLS[CAR[l.car].cls] : { name: "Nutzfahrzeug", col: "#44546a" };
  const soon = l.ends - S.time < 60;
  return `<div class="card lot${l.mine ? " mine" : ""}${l.lead === "me" ? " leadme" : l.me.max > 0 ? " outbid" : ""}" data-lot="${l.id}">
    <div class="lot-pic" data-lotview="${l.id}">${lotPicHTML(l)}
      <span class="lot-cls" style="--c:${cls.col}">${esc(cls.name)}</span>
      <span class="lot-no">Los ${l.id.slice(1)}</span>
      <span class="lot-left${soon ? " soon" : ""}" data-ll>⏱ ${leftTxt(l)}</span>
    </div>
    <div class="lot-body">
      <div class="lot-name"><b>${esc(lotName(l))}</b><small>${lotMeta(l)}</small></div>
      <div class="lot-row"><span class="lot-price"><small>${l.bids ? "Aktuelles Gebot" : "Startpreis"}</small><b data-lp>${money(l.price)}</b></span><span data-lead>${leadHTML(l)}</span></div>
      <div class="lot-est">Schätzpreis ${money(l.est[0])} – ${money(l.est[1])} · <span data-lb>${l.bids} ${l.bids === 1 ? "Gebot" : "Gebote"}</span>${l.mine ? " · Mindestpreis " + (l.reserve ? money(l.reserve) : "ohne") : ""}</div>
      <div class="buyrow">
        <button class="btn tiny ghost" data-lotview="${l.id}">ansehen</button>
        ${l.mine ? `<span class="lot-mine">🔨 dein Los</span>` : `<button class="btn tiny" data-lotbid="${l.id}">${bidBtnLabel(l)}</button>`}
      </div>
    </div>
  </div>`;
}
function garageCardHTML(g) {
  const c = CAR[g.car], val = gValue(g), d = val - g.paid, pct = g.paid ? d / g.paid * 100 : 0;
  const v = g.fleet && S.fleet.find(f => f.uid === g.fleet);
  const lot = g.consigned && lotById(g.consigned);
  return `<div class="card lot garage" data-g="${g.uid}">
    <div class="lot-pic" data-carview="${c.id}">${carPicHTML(c, g.paint[1])}
      <span class="lot-cls" style="--c:${CAR_CLS[c.cls].col}">${CAR_CLS[c.cls].name}</span>
      ${v ? `<span class="lot-left">🏎️ ${esc(phaseLabel(v))}</span>` : lot ? `<span class="lot-left soon">🔨 im Auktionshaus · ${leftTxt(lot)}</span>` : ""}
    </div>
    <div class="lot-body">
      <div class="lot-name"><b>${esc(carName(c))}</b><small>${g.y} · ${fmt(g.km, 0)} km · ${esc(g.paint[0])} · Note ${g.cond}</small></div>
      <div class="lot-row"><span class="lot-price"><small>Marktwert heute</small><b>${money(val)}</b></span>
        <span class="lot-lead ${d >= 0 ? "me" : "out"}">${d >= 0 ? "▲" : "▼"} ${fmt(Math.abs(pct), 1)} %</span></div>
      <div class="lot-est">Gekauft für ${money(g.paid)} (inkl. Aufgeld) · ${c.track ? "nur Rennstrecke" : "⚖️ " + kgf(c.cap) + " Gepäck · " + carSpeed(c) + " km/h im Schnitt"}</div>
      <div class="buyrow">
        <button class="btn tiny ghost" data-carview="${c.id}">ansehen</button>
        ${lot ? "" : v ? `<button class="btn tiny ghost" data-gback="${v.uid}">🅿️ zurück in die Garage</button>`
          : `<button class="btn tiny ghost" data-gfleet="${g.uid}"${c.track || c.cap < 1 ? " disabled" : ""}>🏎️ als Wertkurier</button>
             <button class="btn tiny" data-gsell="${g.uid}">🔨 einliefern</button>`}
      </div>
    </div>
  </div>`;
}
function catRowHTML(c) {
  const A = ah(), live = liveLots().find(l => l.car === c.id && !l.mine), own = A.garage.some(g => g.car === c.id);
  const tr = carIdx(c.id) - 1;
  return `<button class="catrow" data-carview="${c.id}">
    <span class="cat-pic">${carPicHTML(c)}</span>
    <span class="cat-t"><b>${esc(carName(c))}</b>
      <small>${c.ps} PS · ${c.vmax} km/h${c.acc ? " · " + fmt(c.acc, 1) + " s" : ""} · ${esc(c.yrs)}</small>
      <small><i class="clsdot" style="--c:${CAR_CLS[c.cls].col}"></i>${CAR_CLS[c.cls].name} · ~${money(nice(carMarket(c)))}${Math.abs(tr) > 0.005 ? ` <em class="${tr > 0 ? "up" : "down"}">${tr > 0 ? "▲" : "▼"}${fmt(Math.abs(tr) * 100, 1)} %</em>` : ""}</small>
      ${live || own ? `<small class="cat-tags">${live ? "🔴 gerade im Auktionshaus" : ""}${live && own ? " · " : ""}${own ? "🏁 in deiner Garage" : ""}</small>` : ""}
    </span></button>`;
}
function pastRowHTML(p) {
  const name = p.kind === "veh" ? vType(p.vt).name : carName(CAR[p.car]);
  const r = { won: ["me", "ersteigert"], lost: ["out", "verloren"], sold: ["me", "verkauft"], unsold: ["out", "nicht verkauft"], other: ["", ""] }[p.res] || ["", ""];
  return `<div class="pastrow"><span class="pr-n"><b>${esc(name)}</b><small>${stamp(p.t)} · ${p.bids} Gebote${p.lead ? " · an " + esc(p.lead === "me" ? "dich" : p.lead) : ""}</small></span>
    <span class="pr-p"><b>${p.lead ? money(p.price) : "–"}</b>${r[1] ? `<small class="${r[0]}">${r[1]}</small>` : ""}</span></div>`;
}
function renderAuction() {
  const A = ah(); ahFixPaints();
  if (!A.lots.length) ensureLots(true);
  setTools("market", ahToolsHTML(), bindAhTools);
  $("#viewTitle").textContent = "Auktionshaus";
  const el = $("#tab-market");
  const bf = c => A.brand === "all" || c.b === A.brand;
  let html = "";
  if (A.view === "live") {
    const list = liveLots().filter(l => !l.mine && (l.kind === "veh" ? A.brand === "all" : bf(CAR[l.car]))).sort((a, b) => a.ends - b.ends);
    html = `<div class="ah-head"><b>🔨 ${AH_NAME}</b><small>Laufende Auktionen · ${Math.round(AH_PREMIUM * 100)} % Aufgeld · dein Budget ${money(bidBudget())}</small></div>`
      + (list.length ? list.map(lotCardHTML).join("") : `<div class="empty">Gerade kein Los dieser Marke – es kommen laufend neue.</div>`);
  } else if (A.view === "mine") {
    const list = liveLots().filter(l => l.me.max > 0 || l.mine).sort((a, b) => a.ends - b.ends);
    html = list.length ? list.map(lotCardHTML).join("")
      : `<div class="empty">Noch keine Gebote – alle Lose unter <b>🔴 Live</b>.</div>`;
    const done = A.past.filter(p => p.res !== "other").slice(0, 8);
    if (done.length) html += `<h3 class="grp">Zuletzt</h3><div class="card">${done.map(pastRowHTML).join("")}</div>`;
  } else if (A.view === "garage") {
    const tot = A.garage.reduce((a, g) => a + gValue(g), 0), paid = A.garage.reduce((a, g) => a + g.paid, 0);
    html = A.garage.length
      ? `<div class="card ah-sum"><div class="vname">🏁 Deine Garage<small>${A.garage.length} ${A.garage.length === 1 ? "Auto" : "Autos"} · Klassiker steigen eher, Sportwagen fallen – Kurier-Kilometer drücken den Wert.</small></div>
          <div class="meta small"><span>Marktwert ${money(tot)}</span><span>bezahlt ${money(paid)}</span><span class="${tot >= paid ? "up" : "down"}">${tot >= paid ? "+" : "−"}${money(Math.abs(tot - paid))}</span></div></div>`
        + A.garage.map(garageCardHTML).join("")
      : `<div class="empty">Noch leer – dein erstes Auto gibt’s unter <b>🔴 Live</b>.</div>`;
  } else if (A.view === "cat") {
    const list = CARS.filter(bf);
    html = `<div class="ah-head"><b>📖 Katalog</b><small>${list.length} Modelle · Marktwert bei Zustandsnote 2 · Fotos: Wikipedia/Wikimedia Commons</small></div>`
      + `<div class="catlist">${list.map(catRowHTML).join("")}</div>`;
  } else {
    html = A.past.length ? `<div class="card">${A.past.map(pastRowHTML).join("")}</div>` : `<div class="empty">Noch keine Auktion beendet.</div>`;
  }
  el.innerHTML = `<div class="picstat-slot">${picStatusHTML()}</div>` + html;
  bindPicRetry(el);
  bindAuctionBody(el);
  ahLiveKey = liveKey();
  resolvePics();
}
function bindAuctionBody(el) {
  el.querySelectorAll("[data-lotview]").forEach(b => b.onclick = () => openLot(b.dataset.lotview));
  el.querySelectorAll("[data-lotbid]").forEach(b => b.onclick = () => {
    const l = lotById(b.dataset.lotbid); if (!l) return;
    if (l.lead === "me") return openLot(l.id);
    const r = playerBid(l, l.lead ? l.price + ahInc(l.price) : l.start);
    toast((r.ok ? (r.lead ? "👑 " : "🔨 ") : "") + r.msg, r.ok && r.lead ? "ok" : "warn");
    renderAuction();
  });
  el.querySelectorAll("[data-carview]").forEach(b => b.onclick = () => openCar(b.dataset.carview));
  el.querySelectorAll("[data-gfleet]").forEach(b => b.onclick = () => { carToFleet(b.dataset.gfleet); renderAuction(); });
  el.querySelectorAll("[data-gback]").forEach(b => b.onclick = () => { carBack(b.dataset.gback); renderAuction(); });
  el.querySelectorAll("[data-gsell]").forEach(b => b.onclick = () => openConsign({ garage: b.dataset.gsell }));
}
/* Laufende Zahlen ohne komplettes Neuzeichnen auffrischen */
let ahLiveKey = "";
const liveKey = () => S.ah ? liveLots().map(l => l.id).join(",") + "|" + ah().garage.length + "|" + ah().past.length : "";
function ahLiveTick() {
  if (!S || !S.ah || activeTab !== "market" || !ahMode() || !playing()) return;
  if (typeof touchDown !== "undefined" && touchDown) return;
  if (document.body.classList.contains("modal-open")) { if (lotModal) refreshLotModal(); return; }
  if (liveKey() !== ahLiveKey) { renderAuction(); return; }
  document.querySelectorAll("#tab-market [data-lot]").forEach(card => {
    const l = lotById(card.dataset.lot); if (!l) return;
    const set = (sel, v) => { const e = card.querySelector(sel); if (e && e.innerHTML !== v) e.innerHTML = v; };
    set("[data-lp]", money(l.price));
    set("[data-ll]", "⏱ " + leftTxt(l));
    set("[data-lead]", leadHTML(l));
    set("[data-lb]", l.bids + (l.bids === 1 ? " Gebot" : " Gebote"));
    const bb = card.querySelector("[data-lotbid]"); if (bb) { const t = bidBtnLabel(l); if (bb.textContent !== t) bb.textContent = t; }
    card.classList.toggle("leadme", l.lead === "me");
    card.classList.toggle("outbid", l.lead !== "me" && l.me.max > 0);
  });
}
setInterval(() => { try { ahLiveTick(); } catch (_) { /* nie die Seite stören */ } }, 1000);

/* ----------------------------- Detailansicht --------------------------- */
function specsHTML(c, l) {
  const row = (k, v) => v == null || v === "" ? "" : `<div><small>${k}</small><b>${v}</b></div>`;
  return `<div class="specs">
    ${row("Leistung", c.ps + " PS")}${row("Spitze", c.vmax + " km/h")}${row("0–100 km/h", c.acc ? fmt(c.acc, c.acc % 1 ? (String(c.acc).split(".")[1] || "").length : 0) + " s" : "–")}
    ${row("Motor", esc(c.eng))}${row("Bauzeit", esc(c.yrs))}${row("Gebaut", c.n ? (c.n === 1 ? "Einzelstück" : fmt(c.n, 0) + " Stück") : "laufende Serie")}
    ${l ? row("Baujahr", l.y) + row("Laufleistung", fmt(l.km, 0) + " km") + row("Farbe", esc(l.paint[0])) + row("Zustand", "Note " + l.cond + " · " + AH_COND[l.cond].n) : ""}
    ${row("Als Kurier", c.track ? "keine Straßenzulassung" : c.cap < 1 ? "kein Kofferraum" : kgf(c.cap) + " · " + carSpeed(c) + " km/h · " + fmt(carCostKm(c), 2) + " €/km")}
  </div>`;
}
function creditHTML(c) {
  const p = PICS[c.id];
  if (!p || !p.src) return `<div class="piccredit">✏️ Zeichnung – das Foto kommt, sobald es geladen ist.</div>`;
  if (p.art) return `<div class="piccredit">🎨 KI-Illustration (Gemini)</div>`;
  return `<div class="piccredit">${p.page ? `<a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(picCredit(p))} · Wikimedia Commons</a>` : esc(picCredit(p))}</div>`;
}
let lotModal = null;
function openLot(id) {
  const l = lotById(id); if (!l) return;
  lotModal = id;
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  renderLotModal();
}
function renderLotModal(msg) {
  ahFixPaints();
  const l = lotById(lotModal);
  if (!l) { lotModal = null; return; }
  const c = l.kind === "car" ? CAR[l.car] : null, t = l.kind === "veh" ? vType(l.vt) : null;
  const need = l.lead ? l.price + ahInc(l.price) : l.start, inc = ahInc(l.price);
  const hist = l.hist.slice(0, 8).map(h => `<div class="hrow${h.w === "me" ? " me" : ""}"><span>${esc(h.w === "me" ? "Du" : h.w)}</span><b>${money(h.a)}</b><small>${clock(h.t)}</small></div>`).join("");
  const limit = l.me.max > 0 ? `<div class="lim">Dein Limit: <b>${money(l.me.max)}</b> – bis dahin bietet das Haus automatisch.</div>` : "";
  $("#modalBody").innerHTML = `<div class="lotm">
    <div class="mhead"><div><div class="mtitle">${esc(lotName(l))}</div>
      <div class="msub">Los ${l.id.slice(1)} · ${esc(l.seller)} · endet ${stamp(l.ends)}</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button></div>
    <div class="lotm-pic">${lotPicHTML(l, true)}</div>
    ${c ? creditHTML(c) : ""}
    ${c ? `<p class="lotm-note">${esc(c.note)}</p>` + specsHTML(c, l)
      : `<div class="specs"><div><small>Typ</small><b>${esc(t.brand)}</b></div><div><small>Nutzlast</small><b>${kgf(t.cap)}</b></div>
         <div><small>Tempo</small><b>${t.speed} km/h</b></div><div><small>Zustand</small><b>${100 - l.wear} %</b></div><div><small>Laufleistung</small><b>${fmt(l.km, 0)} km</b></div>
         <div><small>Neupreis</small><b>${money(t.price)}</b></div></div>`}
    <div class="lotm-box" id="lotBox">
      <div class="lotm-price"><small>${l.bids ? "Aktuelles Gebot" : "Startpreis"}</small><b id="lmPrice">${money(l.price)}</b><span id="lmLead">${leadHTML(l)}</span></div>
      <div class="lot-est">Schätzpreis ${money(l.est[0])} – ${money(l.est[1])} · ${l.bids} Gebote · noch <span id="lmLeft">${leftTxt(l).replace("noch ", "")}</span></div>
      ${limit}
      ${msg ? `<div class="lotm-msg">${esc(msg)}</div>` : ""}
      ${l.mine ? `<div class="lim">🔨 Dein Los · Mindestpreis ${l.reserve ? money(l.reserve) : "ohne"} · ${Math.round(AH_COMMISSION * 100)} % Provision beim Verkauf</div>`
        : `<div class="bidrow">
            <button class="btn" id="lmBid1">${l.lead === "me" ? "Limit +" + money(inc) : "Bieten · " + money(need)}</button>
            <button class="btn ghost" id="lmBid5">+${money(inc * 5)}</button>
          </div>
          <div class="limrow"><label>Limit (Maximalgebot)<input id="lmMax" type="number" inputmode="numeric" min="${need}" step="${inc}" value="${Math.max(need, l.me.max + inc)}"></label>
            <button class="btn ghost" id="lmSet">Limit setzen</button></div>
          <div class="lot-est">Budget ${money(bidBudget())} · Käufer zahlen ${Math.round(AH_PREMIUM * 100)} % Aufgeld</div>`}
    </div>
    ${hist ? `<div class="sechead">Gebote</div><div class="hist">${hist}</div>` : ""}
    <div class="mbtns"><button class="btn ghost" id="mCancel">Schließen</button></div>
  </div>`;
  const close = () => { lotModal = null; closeModal(); if (activeTab === "market" && ahMode()) renderAuction(); };
  $("#mClose").onclick = close; $("#mCancel").onclick = close;
  const bid = max => { const r = playerBid(l, max); renderLotModal(r.msg); if (r.ok) toast((r.lead ? "👑 " : "🔨 ") + r.msg, r.lead ? "ok" : "warn", true); };
  const b1 = $("#lmBid1"); if (b1) b1.onclick = () => bid(l.lead === "me" ? l.me.max + inc : need);
  const b5 = $("#lmBid5"); if (b5) b5.onclick = () => bid((l.lead === "me" ? l.me.max : need) + inc * 5);
  const bs = $("#lmSet"); if (bs) bs.onclick = () => bid(+$("#lmMax").value || 0);
  resolvePics();
}
function refreshLotModal() {
  const l = lotById(lotModal);
  if (!l) { const p = $("#lmLeft"); if (p) p.textContent = "beendet"; return; }
  const a = $("#lmPrice"), b = $("#lmLead"), c = $("#lmLeft");
  if (a) a.textContent = money(l.price);
  if (b) b.innerHTML = leadHTML(l);
  if (c) c.textContent = leftTxt(l).replace("noch ", "");
}
function openCar(id) {
  const c = CAR[id]; if (!c) return;
  ahFixPaints();
  const A = ah(), live = liveLots().find(l => l.car === id && !l.mine), own = A.garage.filter(g => g.car === id);
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  const paint = own[0] ? own[0].paint[1] : live ? live.paint[1] : undefined;
  $("#modalBody").innerHTML = `<div class="lotm">
    <div class="mhead"><div><div class="mtitle">${esc(carName(c))}</div>
      <div class="msub">${CAR_CLS[c.cls].name} · Marktwert ~${money(nice(carMarket(c)))} (Note 2)</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button></div>
    <div class="lotm-pic">${carPicHTML(c, paint, true)}</div>
    ${creditHTML(c)}
    <p class="lotm-note">${esc(c.note)}</p>
    ${specsHTML(c, own[0] ? Object.assign({}, own[0]) : null)}
    ${own.length ? `<div class="lim">🏁 In deiner Garage: Marktwert ${money(gValue(own[0]))}, gekauft für ${money(own[0].paid)}.</div>` : ""}
    <div class="mbtns">${live ? `<button class="btn" id="mLot">🔴 Zum Los ${live.id.slice(1)}</button>` : ""}<button class="btn ghost" id="mCancel">Schließen</button></div>
  </div>`;
  $("#mClose").onclick = closeModal; $("#mCancel").onclick = closeModal;
  const ml = $("#mLot"); if (ml) ml.onclick = () => openLot(live.id);
  resolvePics();
}

/* ------------------------------ Einliefern ----------------------------- */
function openConsign(src) {
  const g = src.garage && garageById(src.garage);
  const f = src.veh && S.fleet.find(x => x.uid === src.veh);
  if (!g && !f) return;
  const val = g ? gValue(g) : Math.round(vType(f.type).price * 0.7 * wearValueFactor(f));
  const name = g ? carName(CAR[g.car]) : vType(f.type).name;
  $("#modal").classList.add("open"); document.body.classList.add("modal-open");
  $("#modalBody").innerHTML = `<div class="lotm">
    <div class="mhead"><div><div class="mtitle">🔨 Einliefern</div><div class="msub">${esc(name)} · ${AH_NAME}</div></div>
      <button class="xbtn" id="mClose" aria-label="Schließen">✕</button></div>
    <div class="lotm-pic">${g ? carPicHTML(CAR[g.car], g.paint[1], true) : vehPicHTML(vType(f.type))}</div>
    <div class="lotm-box">
      <div class="lotm-price"><small>Schätzwert</small><b>${money(nice(val))}</b></div>
      <label class="rsv">Mindestpreis <b id="csvVal">ohne</b>
        <input type="range" id="csv" min="0" max="120" step="5" value="0"></label>
      <div class="lot-est">Gebot darunter? Dann kommt ${g ? "der Wagen" : "das Fahrzeug"} zurück · ${Math.round(AH_COMMISSION * 100)} % Provision · läuft 8–14 h.</div>
      ${f ? `<div class="lot-est">Händler zahlt sofort ${money(Math.round(vType(f.type).price * 0.62 * wearValueFactor(f)))}.</div>` : ""}
    </div>
    <div class="mbtns"><button class="btn ghost" id="mCancel">Abbrechen</button><button class="btn" id="csvGo">Einliefern</button></div>
  </div>`;
  const rs = () => { const p = +$("#csv").value; return p ? nice(val * p / 100) : 0; };
  $("#csv").oninput = () => { $("#csvVal").textContent = rs() ? money(rs()) : "ohne"; };
  $("#mClose").onclick = closeModal; $("#mCancel").onclick = closeModal;
  $("#csvGo").onclick = () => {
    const r = rs();
    closeModal();
    const l = g ? consignCar(g.uid, r) : consignVeh(f.uid, r);
    if (l && activeTab === "market") { ah().view = "mine"; renderAuction(); }
  };
}

/* --------------------------- Schlussphase live -------------------------- */
let hammer = null;
const hammerQueue = [];
function hammerEl() {
  let el = document.getElementById("hammer");
  if (!el) { el = document.createElement("div"); el.id = "hammer"; document.body.appendChild(el); }
  return el;
}
function startHammer(l) {
  hammerQueue.push(l.id);
  if (!hammer) nextHammer();
}
function nextHammer() {
  const id = hammerQueue.shift();
  if (!id) return;
  const l = lotById(id);
  if (!l || l.done) return nextHammer();
  hammer = { id, step: 0, n: 0, prev: S.speed, feed: [], result: null };
  if (S.speed > 0) setSpeed(0);
  document.body.classList.add("hammer-open");
  if (typeof closeModal === "function" && document.body.classList.contains("modal-open")) { lotModal = null; closeModal(); }
  renderHammer();
  hammer.timer = setTimeout(hammerStep, 1900);
}
const CALLS = ["Zum Ersten …", "Zum Zweiten …", "Zum Dritten …"];
function hammerFeed(txt, me) {
  hammer.feed.unshift({ txt, me });
  if (hammer.feed.length > 4) hammer.feed.length = 4;
}
function hammerStep() {
  if (!hammer || hammer.result) return;
  const l = lotById(hammer.id);
  if (!l) return hammerClose();
  hammer.n++;
  const p = [0.5, 0.4, 0.28][hammer.step] || 0.2;
  const el = l.rivals.filter(r => r.n !== l.lead && r.max >= (l.lead ? l.price + ahInc(l.price) : l.start));
  let acted = null;
  if (hammer.n < 26) for (const r of el.sort(() => Math.random() - 0.5)) { if (Math.random() < p) { acted = r; break; } }
  if (acted) {
    const before = l.lead;
    rivalAct(l, acted);
    if (l.lead === acted.n) hammerFeed(`${acted.n} bietet ${money(l.price)}${before === "me" ? " – du bist überboten!" : ""}`, false);
    else hammerFeed(`${acted.n} bietet mit – ${l.lead === "me" ? "dein Limit hält: " + money(l.price) : l.lead + " hält mit " + money(l.price)}`, l.lead === "me");
    hammer.step = 0;
    renderHammer(true);
    hammer.timer = setTimeout(hammerStep, 1800);
    return;
  }
  hammer.step++;
  if (hammer.step >= 3) return hammerDone();
  renderHammer();
  hammer.timer = setTimeout(hammerStep, hammer.step === 2 ? 1500 : 1800);
}
function hammerBid(k) {
  if (!hammer || hammer.result) return;
  const l = lotById(hammer.id); if (!l || l.mine) return;
  const need = l.lead ? l.price + ahInc(l.price) : l.start;
  const max = l.lead === "me" ? l.me.max + ahInc(l.price) * k : need + ahInc(l.price) * (k - 1);
  const r = playerBid(l, max);
  hammerFeed(r.ok ? (r.lead ? "Du bietest " + money(l.price) : r.msg) : r.msg, r.ok && r.lead);
  if (r.ok) { hammer.step = 0; clearTimeout(hammer.timer); hammer.timer = setTimeout(hammerStep, 1900); }
  renderHammer(true);
}
function hammerDone() {
  const l = lotById(hammer.id);
  if (!l) return hammerClose();
  const lead = l.lead, price = l.price, mine = l.mine, name = lotName(l), kind = l.kind;
  const res = finishLot(l);
  hammer.result = { res, lead, price, mine, name, kind, cost: Math.round(price * (1 + AH_PREMIUM)) };
  renderHammer();
  if (res === "won" || res === "sold") {
    const host = document.querySelector("#hammer .hm-res");
    if (host && typeof confetti === "function") confetti(host, 50, "#e0a800");
    if (navigator.vibrate) { try { navigator.vibrate([60, 40, 120]); } catch (_) { /* egal */ } }
  }
}
function hammerClose() {
  if (!hammer) return;
  clearTimeout(hammer.timer);
  const prev = hammer.prev;
  hammer = null;
  const el = document.getElementById("hammer");
  if (el) { el.className = ""; el.innerHTML = ""; }
  document.body.classList.remove("hammer-open");
  if (hammerQueue.length) return nextHammer();
  if (prev > 0 && S.speed === 0) setSpeed(prev);
  render();
}
function renderHammer(flash) {
  const el = hammerEl();
  const l = lotById(hammer.id);
  const R = hammer.result;
  el.className = "on";
  if (R) {
    const txt = R.res === "won" ? `Zugeschlagen – für dich! ${money(R.price)} + ${Math.round(AH_PREMIUM * 100)} % Aufgeld = <b>${money(R.cost)}</b>.`
      : R.res === "sold" ? `Verkauft an ${esc(R.lead)} für <b>${money(R.price)}</b>. Nach Provision: ${money(Math.round(R.price * (1 - AH_COMMISSION)))}.`
      : R.res === "unsold" ? `Nicht verkauft – ${R.lead ? "Gebot unter Mindestpreis." : "kein Gebot."}`
      : `Zugeschlagen an ${esc(R.lead || "–")} für <b>${money(R.price)}</b>.`;
    el.innerHTML = `<div class="hm-stage"><div class="hm-top">🔨 ${AH_NAME}</div>
      <div class="hm-res ${R.res === "won" || R.res === "sold" ? "good" : "bad"}"><span class="hm-gavel">🔨</span><b>${R.res === "won" ? "Gewonnen!" : R.res === "sold" ? "Verkauft!" : R.res === "unsold" ? "Kein Zuschlag" : "Leider vorbei"}</b>
        <div class="hm-rname">${esc(R.name)}</div><p>${txt}</p>
        <button class="btn" id="hmOk">${R.res === "won" && R.kind === "car" ? "🏁 Zur Garage" : "Weiter"}</button></div></div>`;
    $("#hmOk").onclick = () => {
      const toGarage = R.res === "won" && R.kind === "car";
      hammerClose();
      if (toGarage) { ah().on = true; ah().view = "garage"; showTab("market"); }
    };
    return;
  }
  if (!l) return;
  const need = l.lead ? l.price + ahInc(l.price) : l.start, inc = ahInc(l.price);
  const can = !l.mine && need <= bidBudget();
  el.innerHTML = `<div class="hm-stage">
    <div class="hm-top">🔨 ${AH_NAME} · Los ${l.id.slice(1)}${l.mine ? " · dein Los" : ""}</div>
    <div class="hm-pic">${lotPicHTML(l, true)}</div>
    <div class="hm-name">${esc(lotName(l))}</div>
    <div class="hm-price${flash ? " flash" : ""}"><small>Höchstgebot</small><b>${money(l.price)}</b>
      <span class="hm-lead ${l.lead === "me" ? "me" : ""}">${l.lead ? (l.lead === "me" ? "👑 Du" : esc(l.lead)) : "noch kein Gebot"}</span></div>
    <div class="hm-call s${hammer.step}">${CALLS[hammer.step] || CALLS[2]}</div>
    <div class="hm-dots">${[0, 1, 2].map(i => `<i class="${i < hammer.step ? "on" : ""}"></i>`).join("")}</div>
    <div class="hm-feed">${hammer.feed.map(f => `<div class="${f.me ? "me" : ""}">${esc(f.txt)}</div>`).join("")}</div>
    ${l.mine ? `<div class="hm-note">Mindestpreis ${l.reserve ? money(l.reserve) : "ohne"} · ${Math.round(AH_COMMISSION * 100)} % Provision</div>`
      : `<div class="hm-btns">
          <button class="btn" id="hmBid"${can ? "" : " disabled"}>${l.lead === "me" ? "Limit +" + money(inc) : "Bieten · " + money(need)}</button>
          <button class="btn ghost" id="hmBid5"${can ? "" : " disabled"}>+${money(inc * 5)}</button>
        </div>
        <div class="hm-note">${can ? "Dein Limit: " + (l.me.max ? money(l.me.max) : "–") + " · Budget " + money(bidBudget()) : "Kein Budget mehr für ein höheres Gebot."}</div>`}
  </div>`;
  const b1 = $("#hmBid"); if (b1) b1.onclick = () => hammerBid(1);
  const b5 = $("#hmBid5"); if (b5) b5.onclick = () => hammerBid(5);
}

/* Lina erklärt das Auktionshaus beim ersten Besuch */
if (typeof LINA_TALKS === "object") LINA_TALKS.auction = [
  { tx: "Willkommen im <b>" + AH_NAME + "</b>! Tipp „bieten“ oder setz ein <b>Limit</b> – bis dahin bietet das Haus für dich (+12 % Aufgeld).",
    target: "#tab-market .card.lot" },
  { tx: "Ersteigerte Autos landen in der <b>Garage</b>. Den Rest – „Zum Ersten …“ – erlebst du am besten live.", target: '#viewTools [data-ahview="garage"]' }
];
