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
    l.paint = g ? g.paint : pick(CAR_PAINTS[c.b]);
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
    if (max <= l.me.max) return { ok: false, msg: "Du führst bereits mit einem Limit von " + money(l.me.max) + "." };
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
        body: `${name} ging für ${money(l.price)} an ${l.lead}. Nach ${Math.round(AH_COMMISSION * 100)} % Provision überweisen wir Ihnen ${money(net)}.` });
    } else {
      if (l.garage) { const g = garageById(l.garage); if (g) delete g.consigned; }
      if (l.fleetVeh) {
        const v = makeVehicle(l.fleetVeh.type, false); v.wear = l.fleetVeh.wear; v.kmTotal = l.fleetVeh.km;
        S.fleet.push(v);
      }
      res = "unsold";
      phoneMsg({ from: AH_NAME, kind: "info", title: "Los nicht verkauft",
        body: `${name}: ${l.lead ? "Das Höchstgebot von " + money(l.price) + " blieb unter Ihrem Mindestpreis." : "Leider hat niemand geboten."} ${l.kind === "car" ? "Der Wagen steht wieder in Ihrer Garage." : "Das Fahrzeug ist zurück in Ihrer Flotte."}` });
    }
  } else if (l.lead === "me" && S.money < Math.round(l.price * (1 + AH_PREMIUM))) {
    /* Zahlung nicht gedeckt: der Zuschlag geht an den Unterbieter */
    const next = l.rivals.filter(r => r.max >= l.start).sort((a, b) => b.max - a.max)[0];
    if (next) { l.lead = next.n; l.price = Math.min(l.price, next.max); } else l.lead = null;
    res = "lost";
    phoneMsg({ from: AH_NAME, kind: "trouble", title: "Zuschlag nicht bezahlt",
      body: `Für ${name} war Ihr Konto nicht gedeckt (${money(Math.round(l.price * (1 + AH_PREMIUM)))} inkl. Aufgeld). ${next ? "Der Zuschlag geht an " + next.n + "." : "Das Los geht zurück an den Einlieferer."}` });
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
    phoneMsg({ from: AH_NAME, kind: "good", title: "Herzlichen Glückwunsch zum Zuschlag",
      body: `${name} gehört Ihnen – ${money(l.price)} zuzüglich ${Math.round(AH_PREMIUM * 100)} % Aufgeld, zusammen ${money(cost)}. ${l.kind === "car" ? "Der Wagen steht in Ihrer Garage." : "Das Fahrzeug ist in Ihre Flotte überführt."}` });
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
const PIC_KEY = "logistika-carpics-1";
let PICS = (() => { try { return JSON.parse(localStorage.getItem(PIC_KEY)) || {}; } catch (_) { return {}; } })();
let picsBusy = false;
function plainText(html) {
  if (!html) return "";
  try { return (new DOMParser().parseFromString(String(html), "text/html").body.textContent || "").replace(/\s+/g, " ").trim(); }
  catch (_) { return String(html).replace(/<[^>]*>/g, "").trim(); }
}
async function wikiApi(params) {
  const url = "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&" + params;
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
/* Titelbild der Wikipedia-Artikel suchen, dann Vorschaubild, Urheber und
   Lizenz holen – alles gebündelt in wenigen Anfragen, danach gespeichert. */
async function resolvePics() {
  if (picsBusy || typeof fetch !== "function") return;
  const now = Date.now();
  const todo = CARS.filter(c => !PICS[c.id] || (!PICS[c.id].src && now - (PICS[c.id].t || 0) > 6 * 3600e3));
  if (!todo.length) return;
  picsBusy = true;
  try {
    const files = {};
    todo.forEach(c => { if (c.file) files[c.id] = c.file; });
    const wp = todo.filter(c => c.wp && !c.file);
    for (let i = 0; i < wp.length; i += 40) {
      const batch = wp.slice(i, i + 40);
      const j = await wikiApi("redirects=1&prop=pageimages&piprop=name&pilicense=free&titles=" + batch.map(c => encodeURIComponent(c.wp)).join("%7C"));
      const q = j.query || {}, map = {};
      (q.normalized || []).forEach(n => { map[n.from] = n.to; });
      (q.redirects || []).forEach(n => { map[n.from] = n.to; });
      const fin = t => { let x = t, k = 0; while (map[x] && k++ < 4) x = map[x]; return x; };
      const pages = {};
      (q.pages || []).forEach(p => { pages[p.title] = p; });
      batch.forEach(c => { const p = pages[fin(c.wp)]; if (p && p.pageimage) files[c.id] = p.pageimage.replace(/_/g, " "); });
    }
    const ids = Object.keys(files);
    for (let i = 0; i < ids.length; i += 40) {
      const batch = ids.slice(i, i + 40);
      const j = await wikiApi("prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=960&iiextmetadatafilter=Artist%7CLicenseShortName&titles="
        + batch.map(id => encodeURIComponent("File:" + files[id])).join("%7C"));
      const q = j.query || {}, map = {};
      (q.normalized || []).forEach(n => { map[n.from] = n.to; });
      const pages = {};
      (q.pages || []).forEach(p => { pages[p.title] = p; });
      batch.forEach(id => {
        const t0 = "File:" + files[id], p = pages[map[t0] || t0];
        const ii = p && p.imageinfo && p.imageinfo[0];
        const src = ii && (ii.thumburl || ii.url);
        if (!src || !/^https:\/\/upload\.wikimedia\.org\//.test(src)) return;
        const md = ii.extmetadata || {};
        PICS[id] = { src, page: ii.descriptionurl || "", by: plainText(md.Artist && md.Artist.value).slice(0, 70),
                     lic: plainText(md.LicenseShortName && md.LicenseShortName.value), t: now };
      });
    }
    todo.forEach(c => { if (!PICS[c.id]) PICS[c.id] = { t: now }; });
    try { localStorage.setItem(PIC_KEY, JSON.stringify(PICS)); } catch (_) { /* voll */ }
    applyPics();
  } catch (_) { /* offline oder gesperrt – dann bleiben die Zeichnungen */ }
  picsBusy = false;
}
function picCredit(p) { return "📷 " + (p.by || "Wikimedia Commons") + (p.lic ? " · " + p.lic : ""); }
function applyPics() {
  document.querySelectorAll("[data-carpic]").forEach(el => {
    if (el.querySelector("img")) return;
    const p = PICS[el.dataset.carpic];
    if (!p || !p.src) return;
    el.insertAdjacentHTML("beforeend", picImgHTML(el.dataset.carpic, p));
  });
}
function picImgHTML(id, p) {
  return `<img src="${esc(p.src)}" alt="${esc(carName(CAR[id]))}" loading="lazy" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.remove()">`
    + `<span class="credit">${esc(picCredit(p))}</span>`;
}
/* Gezeichneter Platzhalter, solange kein Foto da ist (oder offline) */
const BODY_PATH = {
  coupe:    "M20 100 L30 83 Q60 76 100 72 L142 50 Q176 40 212 48 L252 68 Q290 74 300 86 L304 100 Z",
  roadster: "M20 100 L28 84 Q70 78 120 74 L148 62 Q168 58 184 70 L250 72 Q292 76 302 88 L304 100 Z",
  suv:      "M22 104 L24 76 Q30 64 60 62 L100 38 L222 38 Q242 40 264 62 L292 66 Q302 70 302 86 L302 104 Z",
  kombi:    "M20 100 L26 82 Q50 74 90 70 L120 46 L262 44 Q280 46 292 64 L300 70 L302 100 Z",
  limo:     "M20 100 L26 82 Q50 74 92 70 L126 46 L214 46 L252 68 Q290 72 300 84 L302 100 Z",
  classic:  "M24 100 Q26 80 60 76 Q80 60 110 58 L150 46 Q185 40 215 52 L240 66 Q290 70 298 86 L300 100 Z"
};
function carSilhouette(body, paint) {
  const wy = body === "suv" ? 102 : 100;
  return `<svg class="ph" viewBox="0 0 320 140" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <ellipse cx="162" cy="${wy + 18}" rx="140" ry="7" fill="rgba(0,0,0,.25)"/>
    <path d="${BODY_PATH[body] || BODY_PATH.coupe}" fill="${paint}" stroke="#0d1b2a" stroke-width="4" stroke-linejoin="round"/>
    ${[82, 248].map(x => `<circle cx="${x}" cy="${wy}" r="19" fill="#1b2330" stroke="#0d1b2a" stroke-width="4"/><circle cx="${x}" cy="${wy}" r="8" fill="#aab4bf"/>`).join("")}
  </svg>`;
}
function carPicHTML(c, paint, big) {
  const p = PICS[c.id], col = paint || (CAR_PAINTS[c.b] || [["", "#888"]])[0][1];
  return `<div class="carpic${big ? " big" : ""}" data-carpic="${c.id}" style="--pc:${col}">${carSilhouette(c.body, col)}${p && p.src ? picImgHTML(c.id, p) : ""}</div>`;
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
  const A = ah();
  if (!A.lots.length) ensureLots(true);
  setTools("market", ahToolsHTML(), bindAhTools);
  $("#viewTitle").textContent = "Auktionshaus";
  const el = $("#tab-market");
  const bf = c => A.brand === "all" || c.b === A.brand;
  let html = "";
  if (A.view === "live") {
    const list = liveLots().filter(l => !l.mine && (l.kind === "veh" ? A.brand === "all" : bf(CAR[l.car]))).sort((a, b) => a.ends - b.ends);
    html = `<div class="ah-head"><b>🔨 ${AH_NAME}</b><small>Laufende Auktionen · ${Math.round(AH_PREMIUM * 100)} % Aufgeld · dein Budget ${money(bidBudget())}</small></div>`
      + (list.length ? list.map(lotCardHTML).join("") : `<div class="empty">Gerade kein Los dieser Marke. Neue Lose kommen laufend dazu.</div>`);
  } else if (A.view === "mine") {
    const list = liveLots().filter(l => l.me.max > 0 || l.mine).sort((a, b) => a.ends - b.ends);
    html = list.length ? list.map(lotCardHTML).join("")
      : `<div class="empty">Du bietest gerade nirgends mit. Unter <b>🔴 Live</b> findest du alle Lose.</div>`;
    const done = A.past.filter(p => p.res !== "other").slice(0, 8);
    if (done.length) html += `<h3 class="grp">Zuletzt</h3><div class="card">${done.map(pastRowHTML).join("")}</div>`;
  } else if (A.view === "garage") {
    const tot = A.garage.reduce((a, g) => a + gValue(g), 0), paid = A.garage.reduce((a, g) => a + g.paid, 0);
    html = A.garage.length
      ? `<div class="card ah-sum"><div class="vname">🏁 Deine Garage<small>${A.garage.length} ${A.garage.length === 1 ? "Auto" : "Autos"} · Klassiker gewinnen oft an Wert, neue Sportwagen verlieren eher. Kilometer als Wertkurier drücken den Preis.</small></div>
          <div class="meta small"><span>Marktwert ${money(tot)}</span><span>bezahlt ${money(paid)}</span><span class="${tot >= paid ? "up" : "down"}">${tot >= paid ? "+" : "−"}${money(Math.abs(tot - paid))}</span></div></div>`
        + A.garage.map(garageCardHTML).join("")
      : `<div class="empty">Noch leer. Ersteigere unter <b>🔴 Live</b> dein erstes Auto – von 10.000 € bis zum Bugatti.</div>`;
  } else if (A.view === "cat") {
    const list = CARS.filter(bf);
    html = `<div class="ah-head"><b>📖 Katalog</b><small>${list.length} Modelle · Marktwert bei Zustandsnote 2 · Fotos: Wikipedia/Wikimedia Commons</small></div>`
      + `<div class="catlist">${list.map(catRowHTML).join("")}</div>`;
  } else {
    html = A.past.length ? `<div class="card">${A.past.map(pastRowHTML).join("")}</div>` : `<div class="empty">Noch keine Auktion beendet.</div>`;
  }
  el.innerHTML = html;
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
  if (!p || !p.src) return `<div class="piccredit">Foto wird von Wikipedia geladen, sobald du online bist.</div>`;
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
  const l = lotById(lotModal);
  if (!l) { lotModal = null; return; }
  const c = l.kind === "car" ? CAR[l.car] : null, t = l.kind === "veh" ? vType(l.vt) : null;
  const need = l.lead ? l.price + ahInc(l.price) : l.start, inc = ahInc(l.price);
  const hist = l.hist.slice(0, 8).map(h => `<div class="hrow${h.w === "me" ? " me" : ""}"><span>${esc(h.w === "me" ? "Du" : h.w)}</span><b>${money(h.a)}</b><small>${clock(h.t)}</small></div>`).join("");
  const limit = l.me.max > 0 ? `<div class="lim">Dein Limit: <b>${money(l.me.max)}</b> – bis dahin bietet das Auktionshaus automatisch für dich.</div>` : "";
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
      <div class="lot-est">Bleibt das Höchstgebot darunter, bekommst du ${g ? "den Wagen" : "das Fahrzeug"} zurück. ${Math.round(AH_COMMISSION * 100)} % Provision beim Verkauf. Die Auktion läuft 8–14 Spielstunden.</div>
      ${f ? `<div class="lot-est">Zum Vergleich: Der Händler zahlt sofort ${money(Math.round(vType(f.type).price * 0.62 * wearValueFactor(f)))}.</div>` : ""}
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
      : R.res === "unsold" ? `Nicht verkauft – ${R.lead ? "das Höchstgebot lag unter deinem Mindestpreis." : "niemand hat geboten."}`
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
  { tx: "Willkommen im <b>" + AH_NAME + "</b>! Hier kommen Sammlerautos und gebrauchte Nutzfahrzeuge unter den Hammer – vom Porsche 924 bis zum Bugatti.",
    target: '#viewTools [data-ahview="live"]' },
  { tx: "Jedes Los hat einen Schätzpreis und eine Endzeit. Tipp auf „bieten“ für das nächste Gebot oder öffne das Los und setz ein <b>Limit</b>: "
    + "Bis dahin bietet das Haus automatisch für dich. Auf jeden Zuschlag kommen 12 % Aufgeld.", target: "#tab-market .card.lot" },
  { tx: "Bietest du mit, wird es am Ende spannend: Die Uhr hält an, der Auktionator ruft „Zum Ersten, zum Zweiten …“ – und du kannst live nachlegen.",
    target: "#tab-market .card.lot .lot-left" },
  { tx: "Ersteigerte Autos stehen in deiner <b>Garage</b>. Klassiker gewinnen oft an Wert, neue Sportwagen verlieren eher. Du kannst sie wieder einliefern – "
    + "oder als Wertkurier fahren lassen. Flottenfahrzeuge versteigerst du direkt unter „Flotte“.", target: '#viewTools [data-ahview="garage"]' }
];
