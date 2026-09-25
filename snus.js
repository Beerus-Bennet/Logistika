/* =========================================================================
   LOGISTIKA – Mr. Snus
   Nebengeschäft ab Level 2: Ab und zu schreibt Mr. Snus aufs Diensttelefon.
   Wer zusagt, bekommt seine Liste, kauft Dosen für 5 € ins Lager und
   beliefert danach private Kunden (graue Aufträge) für 10 € pro Dose.
   ========================================================================= */
"use strict";

const SNUS_LEVEL = 2;          /* ab diesem Level meldet er sich */
const SNUS_BUY = 5;            /* Einkauf pro Dose */
const SNUS_SELL = 10;          /* Verkauf pro Dose */

/* Sorten. Die Dosenbilder zeichnet das Spiel selbst (Farbe, Marke, Symbol). */
const SNUS_SORTS = [
  { id: "cuba-cherry",       brand: "Cuba",   name: "Cherry",      lid: "#d7263d", ink: "#ffffff", glyph: "🍒" },
  { id: "cuba-peach",        brand: "Cuba",   name: "Peach",       lid: "#ff9a4d", ink: "#3a1600", glyph: "🍑" },
  { id: "cuba-blueberry",    brand: "Cuba",   name: "Blueberry",   lid: "#4453c9", ink: "#ffffff", glyph: "🫐" },
  { id: "pablo-frosted-ice", brand: "Pablo",  name: "Frosted Ice", lid: "#a6e6f7", ink: "#0f3d57", glyph: "❄️" },
  { id: "garant-extreme",    brand: "Garant", name: "Extreme",     lid: "#ffd21f", ink: "#141414", glyph: "⚡" },
  { id: "garant-cherry",     brand: "Garant", name: "Cherry",      lid: "#86122e", ink: "#ffffff", glyph: "🍒" },
  { id: "pablo-kiwi",        brand: "Pablo",  name: "Kiwi",        lid: "#79c043", ink: "#123d0f", glyph: "🥝" }
];
const snusSort = id => SNUS_SORTS.find(s => s.id === id);
const snusLabel = s => s.brand + " " + s.name;

/* Kundschaft: private Leute mit ganz normalen Jobs */
const SNUS_JOBS = ["Bauarbeiter", "Kurierfahrer", "Barbier", "Türsteher", "Lagerist", "Taxifahrer",
  "Gerüstbauer", "Koch", "Fitnesstrainer", "Security", "Elektriker", "Spätibesitzer", "Dachdecker",
  "Maler", "Busfahrer", "Student", "Gastronom", "Mechaniker"];
const SNUS_BYE = ["Kein Ding. Ich meld mich.", "Alles klar, Bruder. Bis dann.", "Safe. Du weißt, wo du mich findest.",
  "Easy, nächstes Mal."];
const SNUS_DEAL = ["Deal 🤝", "Geht klar 🤝", "Läuft 🤝"];

/* Zivilfahnder: verraten sich durch ihr Verhalten, nicht durch Herkunft –
   sie zahlen auffällig mehr, wollen gleich eine große Menge, haben „deine
   Nummer von einem Kumpel“, tragen Hemd und sind glatt rasiert.
   Namen kommen aus demselben Topf wie bei allen anderen Kunden.           */
const SNUS_COP_SHARE = 0.18;
/* Großzügige Stammkunden: zahlen auch mehr und wollen mehr – sind aber echt.
   Den Unterschied sieht man nur am Aussehen: Fahnder tragen weißes Hemd UND
   sind glatt rasiert, die hier nie beides zugleich. */
const SNUS_RICH_SHARE = 0.16;
const SNUS_RICH_JOBS = ["Barbershop-Besitzer", "Bauunternehmer", "Clubbetreiber", "Fußballtrainer", "Autohändler",
  "Gastronom", "Berater", "Projektleiter", "Tattoo-Künstler"];
const SNUS_RICH_LINES = [
  "Für die ganze Baustelle: {n}× {s}. Ich leg was drauf, wenn's heute noch klappt.",
  "Hab Geburtstag 🎉 {n}× {s}, Trinkgeld ist drin.",
  "Mein Kumpel Kevin schwört auf dich. {n}× {s}, zahl gern mehr.",
  "Für die Jungs vom Verein: {n}× {s}. Passt schon mit dem Preis."
];
const SNUS_JAIL_DAYS = 14;
const SNUS_COP_JOBS = ["Angestellter", "Berater", "Sachbearbeiter", "Vertriebler", "Projektleiter"];
const SNUS_COP_LINES = [
  "Hab deine Nummer von 'nem Kumpel. Brauch {n}× {s}, zahl auch mehr.",
  "Bin neu in der Gegend. {n}× {s} – Geld ist kein Problem.",
  "Kumpel meinte, du kannst liefern. {n}× {s}, heute noch, ich leg was drauf."
];

function snusState() {
  if (!S.snus) S.snus = { stock: {}, at: null, nextOffer: 0, nextCust: 0, bought: 0, sold: 0 };
  return S.snus;
}
/* Der Späti, in dem die Ware liegt – mit Adresse */
function snusShop() {
  const sn = snusState();
  if (!sn.at) return undefined;
  if (!sn.shop || sn.shopAt !== sn.at) {
    sn.shop = typeof makeAddr === "function" ? makeAddr(sn.at, "spaeti") : null;
    sn.shopAt = sn.at;
  }
  return sn.shop ? Object.assign({}, sn.shop) : undefined;
}
function snusTotal() { const st = snusState().stock; return Object.values(st).reduce((a, n) => a + n, 0); }
/* Dosen, die noch keinem offenen Kundenauftrag versprochen sind */
function snusFree(id) {
  const have = snusState().stock[id] || 0;
  const promised = S.orders.filter(o => o.snus && o.snus.sort === id).reduce((a, o) => a + o.snus.n, 0);
  return Math.max(0, have - promised);
}

/* ------------------------------- Bilder --------------------------------- */
/* Das Logo von Mr. Snus: Dose von oben, dunkler Deckel mit goldenem Ring,
   darauf sein Zylinder. forImage = eigenständiges SVG (für die Karte). */
function snusLogo(size, forImage) {
  return `<svg ${forImage ? 'xmlns="http://www.w3.org/2000/svg" ' : 'class="snus-logo" '}viewBox="0 0 48 48" width="${size}" height="${size}" role="img" aria-label="Mr. Snus">
    <circle cx="24" cy="24" r="22.5" fill="#cfd6df" stroke="#0d1b2a" stroke-width="2"/>
    <circle cx="24" cy="24" r="19.2" fill="#1c2230" stroke="#0d1b2a" stroke-width="1.2"/>
    <circle cx="24" cy="24" r="16.6" fill="none" stroke="#d4a73a" stroke-width="1.3"/>
    <path d="M17.6 21.2L18.4 9.8Q24 8.6 29.6 9.8L30.4 21.2Z" fill="#f3ead7"/>
    <rect x="17.8" y="17.4" width="12.4" height="2.5" fill="#d4a73a"/>
    <ellipse cx="24" cy="21.6" rx="10.6" ry="2.4" fill="#f3ead7"/>
    <text x="24" y="28.4" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="4.2" fill="#d4a73a">MR.</text>
    <text x="24" y="35.2" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="7.2" letter-spacing=".4" fill="#f3ead7">SNUS</text>
    <path d="M8.5 17A17 17 0 0 1 19 5.8" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
/* Mr. Snus: nur ein Schatten im Profil, mit Zylinder und hochgeschlagenem
   Kragen – wie ein Inkognito-Symbol. Eigene Zeichnung, keine Vorlage.     */
function snusFace(size) {
  return `<svg class="snus-face" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Mr. Snus" style="clip-path:circle(50%)">
    <circle cx="32" cy="32" r="31" fill="#3b4250"/>
    <circle cx="32" cy="26" r="24" fill="#4c5564" opacity=".55"/>
    <path fill="#0b0e13" d="M21.5 23.5C18.3 28.5 18.4 36 23.2 41.4L25.2 46.8C19.6 48.8 11 52.5 6.5 60.5L7 64H57L57.5 60.5
      C54.8 53.6 47.5 50.3 40.4 48.2L38.3 44.4C40.2 43.5 41.8 42.2 42 40.3C42.1 39.2 41.4 38.4 41.6 37.7L43.1 36.6
      L41.9 35.6L43.3 34.7L42.6 33.1L46.4 31.6C46.1 30.6 43.2 27.4 42.4 25.6L42.7 23.2Z"/>
    <path fill="#0b0e13" d="M21.4 22.6L22.3 5.2Q31.2 3.6 40.1 5.2L41.2 22.6Z"/>
    <path fill="#262c36" d="M21.6 17.6H41L41.2 21.4H21.4Z"/>
    <path fill="none" stroke="#5d6777" stroke-width=".7" opacity=".6" d="M39.4 6.2L40.3 17.2"/>
    <path fill="#0b0e13" d="M12.4 24.4C19 21.2 38 20.4 50.6 22.9C51.6 23.4 50.9 24.4 49.6 24.5C37.5 25.5 20.5 26.2 13 25.5C11.9 25.3 11.8 24.7 12.4 24.4Z"/>
    <path fill="#1b212b" d="M40.4 48.2L46.8 41.4L48.2 50.9Z"/>
    <path fill="#1b212b" d="M25.2 46.8L21.4 41.8L19.8 49.2Z"/>
    <path fill="none" stroke="#7d8898" stroke-width=".8" stroke-linejoin="round" opacity=".55"
      d="M42.7 23.2L42.4 25.6C43.2 27.4 46.1 30.6 46.4 31.6L42.6 33.1L43.3 34.7L41.9 35.6L43.1 36.6L41.6 37.7
      C41.4 38.4 42.1 39.2 42 40.3C41.8 42.2 40.2 43.5 38.3 44.4"/>
  </svg>`;
}
/* Dose von oben: Deckel in Sortenfarbe, Marke, Symbol, Sorte */
function snusCan(s, size) {
  return `<svg class="snus-can" viewBox="0 0 48 48" width="${size}" height="${size}" role="img" aria-label="${esc(snusLabel(s))}">
    <circle cx="24" cy="24" r="22.5" fill="#e6ebf1" stroke="#0d1b2a" stroke-width="2"/>
    <circle cx="24" cy="24" r="19" fill="${s.lid}" stroke="#0d1b2a" stroke-width="1.4"/>
    <circle cx="24" cy="24" r="15.2" fill="none" stroke="${s.ink}" stroke-opacity=".35" stroke-width="1"/>
    <path d="M10 17A16 16 0 0 1 22 8.4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.2" stroke-linecap="round"/>
    <text x="24" y="18.6" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="6.4" letter-spacing=".6" fill="${s.ink}">${esc(s.brand.toUpperCase())}</text>
    <text x="24" y="31.2" text-anchor="middle" font-size="11">${s.glyph}</text>
    <text x="24" y="38.6" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700"
      font-size="4.7" fill="${s.ink}">${esc(s.name)}</text>
  </svg>`;
}

/* ------------------------------- Ablauf --------------------------------- */
function snusOpenMsg() { return (S.phone && S.phone.msgs || []).find(m => m.kind === "snus" && (m.state === "ask" || m.state === "offer")); }

function tickSnus() {
  if (typeof level !== "function" || level() < SNUS_LEVEL) return;
  if (S.jail || S.over) return;              /* im Knast ruft keiner an */
  const sn = snusState();
  /* Erstes Mal kurz nach Level 2, danach alle paar Spieltage */
  if (!sn.nextOffer) sn.nextOffer = S.time + rnd(60, 240);
  const open = snusOpenMsg();
  if (open && S.time > open.expires) {
    open.state = "gone";
    open.thread.push({ me: false, t: "Hat sich erledigt. Ich meld mich wieder." });
    sn.nextOffer = S.time + rnd(1.0, 2.2) * 1440;
    if (typeof renderPhone === "function") renderPhone();
  }
  if (!open && S.time >= sn.nextOffer) snusOffer();
  /* Kundschaft meldet sich, solange Dosen im Lager liegen */
  if (sn.at && snusTotal() > 0 && S.time >= (sn.nextCust || 0)) {
    const openCust = S.orders.filter(o => o.snus).length;
    if (openCust < 4) snusCustomer();
    sn.nextCust = S.time + rnd(70, 160);
  }
}

function snusOffer() {
  const sn = snusState();
  sn.nextOffer = S.time + rnd(1.2, 2.8) * 1440;
  phoneMsg({
    kind: "snus", from: "Mr. Snus", title: "Jo brauchst du Snus?", body: "",
    state: "ask", expires: S.time + rnd(6, 10) * 60,
    thread: [{ me: false, t: "Jo brauchst du Snus?" }],
    toastText: "💬 Mr. Snus: „Jo brauchst du Snus?“"
  });
  /* Beim ersten Mal erklärt Lina, worauf man sich einlässt */
  if (typeof linaTalk === "function") setTimeout(() => linaTalk("snus"), 600);
}

/* Seine Liste: ein paar Sorten, jeweils eine hohe zweistellige Zahl bis
   Anfang der Hunderter. */
function snusList() {
  const n = 3 + Math.floor(Math.random() * 3);
  const sorts = [...SNUS_SORTS].sort(() => Math.random() - 0.5).slice(0, n);
  return sorts.map(s => ({ id: s.id, have: 68 + Math.floor(Math.random() * 61) }));
}

function snusReply(msgId, yes) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "ask") return;
  if (!yes) {
    m.thread.push({ me: true, t: "Nein, danke mein Akh" }, { me: false, t: pick(SNUS_BYE) });
    m.state = "no";
  } else {
    m.thread.push({ me: true, t: "Ja was hast du da?" });
    m.offer = snusList();
    m.pick = {};
    m.offer.forEach(r => { m.pick[r.id] = 0; });
    m.thread.push({ me: false, list: true });
    m.state = "offer";
    m.expires = Math.max(m.expires, S.time + 6 * 60);
  }
  save(); renderPhone();
}

function snusStep(msgId, id, d) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer") return;
  const row = m.offer.find(r => r.id === id); if (!row) return;
  m.pick[id] = clamp((m.pick[id] || 0) + d, 0, row.have);
  renderPhone();
}
function snusAll(msgId, on) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer") return;
  m.offer.forEach(r => { m.pick[r.id] = on ? r.have : 0; });
  renderPhone();
}
function snusPicked(m) { return m.offer.reduce((a, r) => a + (m.pick[r.id] || 0), 0); }

/* Übergabeort: ein Stadtteil in der Nähe der eigenen Fahrzeuge */
function snusDropNode() {
  const near = new Set();
  S.fleet.forEach(f => near.add(f.at));
  const spots = [...near].map(id => N[id]).filter(Boolean);
  const cands = unlockedNodes().filter(n => n.type === "city"
    && spots.some(p => hav([p.lat, p.lon], [n.lat, n.lon]) < 25));
  const pool = cands.length ? cands : unlockedNodes().filter(n => n.type === "city");
  return pick(pool.length ? pool : unlockedNodes()).id;
}

/* Kaufen: erst die Wallet, bezahlt wird in Solana – danach geht die Ware raus */
function snusPay(msgId) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer") return;
  const n = snusPicked(m);
  if (!n) return toast("Erst Dosen auswählen.", "warn");
  const cost = n * SNUS_BUY;
  if (cost > S.money) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn");
  if (typeof walletPay !== "function") return snusBuy(msgId);
  walletPay({ to: "Mr. Snus", icon: snusLogo(34), eur: cost, memo: n + " Dosen", onPaid: tx => snusBuy(msgId, tx) });
}
function snusBuy(msgId, tx) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer") return;
  const n = snusPicked(m);
  if (!n) return toast("Erst Dosen auswählen.", "warn");
  const cost = n * SNUS_BUY;
  if (cost > S.money) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn");
  if (!tx && typeof walletQuote === "function") tx = walletQuote(cost);
  const sn = snusState();
  if (!sn.at || snusTotal() === 0) sn.at = snusDropNode();
  S.money -= cost; S.expense += cost;
  logMoney("snus", "Mr. Snus · " + n + " Dosen" + (tx ? " · " + solf(tx.sol, 2) + " SOL" : ""), -cost);
  if (tx) sn.sol = (sn.sol || 0) + tx.sol;
  sn.spent = (sn.spent || 0) + cost;
  const parts = [];
  m.offer.forEach(r => {
    const k = m.pick[r.id] || 0;
    if (!k) return;
    sn.stock[r.id] = (sn.stock[r.id] || 0) + k;
    parts.push(k + "× " + snusLabel(snusSort(r.id)));
  });
  sn.bought += n;
  m.thread.push({ me: true, t: "Nehm ich: " + parts.join(", ") + "." });
  if (tx) m.thread.push({ me: true, tx });
  const shop = snusShop();
  m.thread.push({ me: false, t: pick(SNUS_DEAL) + " Liegt beim " + (shop ? shop.t + ", " + N[sn.at].short : "Späti in " + N[sn.at].short) + ". Die Jungs melden sich bei dir." });
  m.state = "done";
  m.bought = n;
  /* Die ersten Kunden sind schnell da – und beim allerersten Einkauf echt */
  const first = !sn.bustFree;
  sn.bustFree = true;
  snusCustomer(first); snusCustomer(first);
  sn.nextCust = S.time + rnd(60, 120);
  toast("[[snus]] " + n + " Dosen im Lager in " + N[sn.at].short + " – Kunden unter „Aufträge“.", "ok");
  save(); renderPhone(); render();
}
function snusCancel(msgId) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer") return;
  m.thread.push({ me: true, t: "Doch nicht, sorry." }, { me: false, t: pick(SNUS_BYE) });
  m.state = "no";
  save(); renderPhone();
}

/* Kundengesicht: eindeutig männlich – kurze Frisur, oft mit Bart. Lange
   Wellen oder Zopf wirken im kleinen Rund schnell weiblich. */
function snusGuy() {
  const av = avRandom(AV.sexes.indexOf("m"));
  const short = ["kurz", "undercut", "quiff", "glatze"];
  const hairs = avHairList(av);
  const ok = short.map(h => hairs.indexOf(h)).filter(i => i >= 0);
  if (ok.length) av.hair = pick(ok);
  if (Math.random() < 0.65) av.beard = 1 + Math.floor(Math.random() * (AV.beards.length - 1));
  return av;
}

/* Ein privater Kunde möchte ein paar Dosen einer Sorte, die noch da ist.
   safe = sicher kein Fahnder (die allerersten Kunden). */
function snusCustomer(safe) {
  const sn = snusState();
  if (!sn.at) return null;
  const sorts = SNUS_SORTS.filter(s => snusFree(s.id) > 0);
  if (!sorts.length) return null;
  const s = pick(sorts);
  const roll = Math.random();
  const cop = !safe && snusFree(s.id) >= 8 && roll < SNUS_COP_SHARE;
  const rich = !cop && !safe && snusFree(s.id) >= 6 && roll < SNUS_COP_SHARE + SNUS_RICH_SHARE;
  const n = cop ? Math.min(snusFree(s.id), 16 + Math.floor(Math.random() * 21))
          : rich ? Math.min(snusFree(s.id), 8 + Math.floor(Math.random() * 17))
                 : Math.min(snusFree(s.id), 2 + Math.floor(Math.random() * 11));
  const from = N[sn.at];
  const weight = 1;
  /* Die Kundschaft wohnt am Stadtrand in den großen Siedlungen:
     Marzahn, Gropiusstadt, Märkisches Viertel, Falkenhagener Feld … */
  let to = null, drop = null, fast = null;
  for (let k = 0; k < 6 && !fast; k++) {
    const est = typeof berlinEstate === "function" ? berlinEstate(sn.at, 30) : null;
    if (est) { to = N[est.node]; drop = est.addr; }
    else {
      const dests = unlockedNodes().filter(x => x.id !== sn.at && x.type === "city")
        .map(x => ({ x, d: hav([from.lat, from.lon], [x.lat, x.lon]) }))
        .filter(q => q.d > 1.2 && q.d < 30)
        .sort((a, b) => a.d - b.d).slice(0, 12);
      if (!dests.length) return null;
      to = pick(dests).x; drop = typeof makeAddr === "function" ? makeAddr(to.id, "home") : null;
    }
    fast = plan(sn.at, to.id, "snus", weight, "time");
  }
  if (!fast) return null;
  const last = pick(STAFF_LAST);
  const who = { name: pick(STAFF_FIRST_M) + " " + last[0] + ".", job: pick(cop ? SNUS_COP_JOBS : rich ? SNUS_RICH_JOBS : SNUS_JOBS), av: snusGuy() };
  const shirt = AV.outfits.findIndex(x => x.id === "bluse");
  const otherOutfit = () => 1 + Math.floor(Math.random() * (AV.outfits.length - 1));
  if (cop) {                                  /* Hemd, glatt rasiert, ordentlich kurz */
    who.av.beard = 0; who.av.acc = 0; who.av.outfit = shirt;
    who.av.hair = Math.max(0, avHairList(who.av).indexOf("kurz"));
  } else if (rich) {
    /* Nie beides zugleich: im Hemd dann mit Bart – oder ohne Hemd */
    if (Math.random() < 0.5) { who.av.outfit = shirt; if (!who.av.beard) who.av.beard = 1 + Math.floor(Math.random() * (AV.beards.length - 1)); }
    else if (who.av.outfit === shirt) who.av.outfit = otherOutfit();
  } else if (who.av.outfit === shirt) who.av.outfit = otherOutfit();
  if (who.av.outfit === shirt && !cop && !who.av.beard) who.av.beard = 1;     /* Sicherheitsnetz */
  const each = cop ? 13 + Math.floor(Math.random() * 3) : rich ? 12 + Math.floor(Math.random() * 4) : SNUS_SELL;
  const o = {
    id: "A" + (S.seq++), from: sn.at, to: to.id, cargo: "snus", weight,
    pay: n * each, deadline: Math.round(S.time + fast.time * 2.5 + rnd(150, 300)),
    shipper: who.name,
    desc: cop || rich ? pick(cop ? SNUS_COP_LINES : SNUS_RICH_LINES).replace("{n}", n).replace("{s}", snusLabel(s)) : "will " + n + "× " + snusLabel(s),
    created: S.time,
    refDist: Math.round(fast.dist), refTime: Math.round(fast.time),
    expire: Math.round(S.time + rnd(5, 12) * 60),
    snus: { sort: s.id, n, who, each, cop, kind: cop ? "cop" : rich ? "rich" : "normal" },
    pick: snusShop(), drop: drop || undefined
  };
  if (typeof withLastMile === "function") withLastMile(o);
  S.orders.push(o);
  if (typeof renderDirty !== "undefined") renderDirty = true;
  return o;
}

/* Angenommen: Dosen gehen aus dem Lager. Geplatzt: sie kommen zurück. */
function snusTake(o) {
  const st = snusState().stock;
  st[o.snus.sort] = Math.max(0, (st[o.snus.sort] || 0) - o.snus.n);
}
function snusGiveBack(o) {
  const st = snusState().stock;
  st[o.snus.sort] = (st[o.snus.sort] || 0) + o.snus.n;
}
function snusDelivered(o, pay) { const sn = snusState(); sn.sold += o.snus.n; sn.earned = (sn.earned || 0) + (pay || 0); }
/* Was die Dispo stutzig macht: mehr als der übliche Preis oder eine auffällig
   große Menge. Das trifft Fahnder UND großzügige Stammkunden. */
function snusSuspicious(o) { return !!o.snus && (o.snus.each > SNUS_SELL || o.snus.n >= 16); }
function snusWhy(o) {
  return o.snus.each > SNUS_SELL ? "zahlt " + money(o.snus.each) + " pro Dose statt " + money(SNUS_SELL)
    : "will gleich " + o.snus.n + " Dosen";
}

/* ---------------------------- Festnahme & Haft --------------------------
   Übergabe an einen Zivilfahnder: Ware beschlagnahmt, kein Geld, 14 Tage
   Haft. Die Zeit läuft im Schnelldurchlauf weiter – Fixkosten, Löhne und
   Miete auch. Wer Büros mit Personal hat, dessen Team arbeitet weiter.   */
let jailUI = false;
function snusBust(job) {
  const o = job.order;
  S.jail = {
    state: "arrest", from: S.time, until: S.time + SNUS_JAIL_DAYS * 1440,
    who: o.snus.who.name, n: o.snus.n, sort: o.snus.sort, pay: o.pay, place: o.to,
    money0: S.money, done0: S.done
  };
  logMoney("snus", "Beschlagnahmt: " + o.snus.n + " Dosen bei " + o.snus.who.name, 0);
  const sn = snusState(); sn.lost = (sn.lost || 0) + o.snus.n;
  save();
}
function jailCheck() {
  if (!S.jail || jailUI) return;
  jailUI = true;
  if (typeof closeModal === "function" && $("#modal").classList.contains("open")) closeModal();
  if (S.jail.state === "arrest") return jailArrestScreen();
  jailServe();
}
function reportShow(html) {
  const el = $("#report");
  el.innerHTML = html;
  el.classList.add("on");
  document.body.classList.add("report-open");
}
function reportHide() {
  $("#report").classList.remove("on");
  $("#report").innerHTML = "";
  document.body.classList.remove("report-open");
}
function jailArrestScreen() {
  const j = S.jail, s = snusSort(j.sort);
  reportShow(`<div class="rp jail">
    <div class="rp-head"><b>🚔 Festnahme</b><span>Polizeidirektion ${esc(N[j.place].short)} · Tag ${dayOf(S.time)}, ${clock(S.time)}</span></div>
    <p><b>„${esc(j.who)}“</b> war ein Zivilfahnder. Bei der Übergabe in ${esc(N[j.place].name)} klicken die Handschellen.</p>
    <dl>
      <dt>Beschlagnahmt</dt><dd>${j.n} Dosen ${esc(s ? snusLabel(s) : "Snus")}</dd>
      <dt>Kaufpreis der Ware</dt><dd>${money(j.n * SNUS_BUY)} – weg</dd>
      <dt>Vereinbarter Preis</dt><dd>${money(j.pay)} – siehst du nie</dd>
      <dt>Urteil</dt><dd>${SNUS_JAIL_DAYS} Tage Haft</dd>
    </dl>
    <div class="rp-stamp">U-HAFT</div>
    <p class="rp-note">Die Zeit läuft weiter – Fixkosten, Löhne und Miete auch. Büros mit Personal arbeiten ohne dich weiter.</p>
    <button class="btn" id="rpGo">Haft antreten</button>
  </div>`);
  $("#rpGo").onclick = () => { S.jail.state = "serving"; save(); jailServe(); };
}
/* Die 14 Tage im Schnelldurchlauf, mit Fortschrittsbalken */
function jailServe() {
  const j = S.jail;
  reportShow(`<div class="rp jail">
    <div class="rp-head"><b>🔒 Haft</b><span>JVA Moabit · Zelle 214</span></div>
    <div class="rp-days" id="rpDays">Tag 1 von ${SNUS_JAIL_DAYS}</div>
    <div class="rp-bar"><i id="rpBar"></i></div>
    <p class="rp-note">Hofgang, Kantine, Warten.</p>
  </div>`);
  const total = j.until - j.from;
  const t0 = performance.now(), minMs = 2800;
  muteToasts = true;
  const step = () => {
    if (!S.jail) return;
    const target = j.from + total * Math.min(1, (performance.now() - t0) / minMs);
    let guard = 0;
    while (S.time < Math.min(target, j.until) && guard++ < 400) tick(Math.min(10, j.until - S.time));
    const k = (S.time - j.from) / total;
    const bar = $("#rpBar"), days = $("#rpDays");
    if (bar) bar.style.width = Math.round(Math.min(1, k) * 100) + "%";
    if (days) days.textContent = "Tag " + Math.min(SNUS_JAIL_DAYS, 1 + Math.floor(k * SNUS_JAIL_DAYS)) + " von " + SNUS_JAIL_DAYS;
    if (S.time < j.until - 0.01) return requestAnimationFrame(step);
    muteToasts = false;
    jailOut();
  };
  requestAnimationFrame(step);
}
function jailOut() {
  const j = S.jail;
  const diff = S.money - j.money0, jobs = S.done - j.done0;
  reportShow(`<div class="rp jail">
    <div class="rp-head"><b>🚪 Entlassen</b><span>Tag ${dayOf(S.time)}, ${clock(S.time)}</span></div>
    <p>${SNUS_JAIL_DAYS} Tage sind rum. So sieht die Firma jetzt aus:</p>
    <dl>
      <dt>Kontostand</dt><dd class="${diff >= 0 ? "good" : "bad"}">${money(S.money)} (${diff >= 0 ? "+" : "−"}${money(Math.abs(diff))})</dd>
      <dt>Ohne dich zugestellt</dt><dd>${jobs} Auftr${jobs === 1 ? "ag" : "äge"}</dd>
      <dt>Snus im Lager</dt><dd>${snusTotal()} Dosen</dd>
    </dl>
    <p class="rp-note">Mr. Snus meldet sich wieder. Schau dir die Kunden vorher genau an.</p>
    <button class="btn" id="rpGo">Zurück an die Arbeit</button>
  </div>`);
  $("#rpGo").onclick = () => {
    S.jail = null; jailUI = false;
    reportHide(); save();
    if (typeof renderPause === "function") renderPause();
    render();
  };
}

/* ------------------------------- Ansicht -------------------------------- */
function snusMsgHTML(m) {
  const bub = e => {
    if (e.list) {
      const rows = m.offer.map(r => {
        const s = snusSort(r.id), k = m.pick[r.id] || 0, live = m.state === "offer";
        return `<div class="sn-row">
          ${snusCan(s, 38)}
          <div class="sn-tx"><b>${esc(snusLabel(s))}</b><small>${r.have} Dosen · ${money(SNUS_BUY)}/Dose</small></div>
          ${live ? `<div class="sn-step">
              <button data-snstep="${m.id}|${r.id}|-10" aria-label="weniger">−</button>
              <b>${k}</b>
              <button data-snstep="${m.id}|${r.id}|10" aria-label="mehr">+</button>
            </div>` : (m.pick && m.pick[r.id] ? `<span class="sn-got">${m.pick[r.id]}×</span>` : "")}
        </div>`;
      }).join("");
      return `<div class="bub in list"><div class="sn-lh">Was ich grad dahab:</div>${rows}</div>`;
    }
    if (e.tx && typeof walletTxBubble === "function") return walletTxBubble(e.tx);
    return `<div class="bub ${e.me ? "out" : "in"}">${esc(e.t)}</div>`;
  };
  let acts = "";
  if (m.state === "ask") {
    acts = `<div class="sn-acts">
      <button class="btn tiny" data-snyes="${m.id}">Ja was hast du da?</button>
      <button class="btn tiny ghost" data-snno="${m.id}">Nein, danke mein Akh</button></div>`;
  } else if (m.state === "offer") {
    const n = snusPicked(m), cost = n * SNUS_BUY;
    acts = `<div class="sn-sum">${n} Dosen · <b>${money(cost)}</b>${n && typeof solf === "function" ? ` <span class="sn-sol">≈ ${solf(solAmt(cost), 2)} SOL</span>` : ""} <small>Verkauf später ${money(SNUS_SELL)}/Dose · bezahlt wird in Solana</small></div>
      <div class="sn-acts">
        <button class="btn tiny${n && cost <= S.money ? "" : " disabled"}" data-snbuy="${m.id}">◎ Bezahlen${n ? " · " + money(cost) : ""}</button>
        <button class="btn tiny ghost" data-snall="${m.id}|${n ? 0 : 1}">${n ? "Nichts" : "Alles"}</button>
        <button class="btn tiny ghost" data-sncancel="${m.id}">Doch nicht</button></div>`;
  } else if (m.state === "gone") {
    acts = `<div class="pmsg-note">Mr. Snus ist offline.</div>`;
  }
  return `<div class="pmsg snus">
    <div class="sn-head">${snusFace(38)}<div><b>Mr. Snus</b><small>${stamp(m.time)}</small></div>${typeof phoneTTL === "function" ? phoneTTL(m) : ""}</div>
    <div class="sn-chat">${m.thread.map(bub).join("")}</div>
    ${acts}
  </div>`;
}
function bindSnusMsgs() {
  $$("#modalBody [data-snyes]").forEach(b => b.onclick = () => snusReply(b.dataset.snyes, true));
  $$("#modalBody [data-snno]").forEach(b => b.onclick = () => snusReply(b.dataset.snno, false));
  $$("#modalBody [data-snstep]").forEach(b => b.onclick = () => {
    const [id, sort, d] = b.dataset.snstep.split("|"); snusStep(id, sort, +d);
  });
  $$("#modalBody [data-snall]").forEach(b => b.onclick = () => {
    const [id, on] = b.dataset.snall.split("|"); snusAll(id, on === "1");
  });
  $$("#modalBody [data-snbuy]").forEach(b => b.onclick = () => snusPay(b.dataset.snbuy));
  $$("#modalBody [data-sncancel]").forEach(b => b.onclick = () => snusCancel(b.dataset.sncancel));
}

/* Lagerzeile über der Auftragsliste */
function snusStockHTML() {
  const sn = S.snus;
  if (!sn || !sn.at || snusTotal() <= 0) return "";
  const parts = SNUS_SORTS.filter(s => sn.stock[s.id] > 0)
    .map(s => `<span class="sn-chip">${snusCan(s, 18)}${sn.stock[s.id]}</span>`).join("");
  return `<div class="snusbar"><span class="sn-lbl">${snusLogo(18)} Snus-Lager ${esc(N[sn.at].short)} · ${snusTotal()} Dosen</span>${parts}</div>`;
}
/* Grauer Auftrag eines privaten Kunden */
function snusOrderCard(o, previewRow) {
  const s = snusSort(o.snus.sort), w = o.snus.who;
  const rest = o.deadline - S.time;
  return `<div class="card order gray${typeof flashOn === "function" && flashOn(o.id) ? " flash" : ""}" data-order="${o.id}">
    <div class="card-top">
      <span class="badge gray">${snusLogo(16)} Snus · privat</span>
      <span class="pay">${money(o.pay)}</span>
      ${typeof rejectBtnHTML === "function" ? rejectBtnHTML(o.id) : ""}
    </div>
    ${o.snus.flagged ? `<div class="sn-flag">🕵️ <b>Dispo: verdächtig</b> – ${esc(snusWhy(o))}. Weißes Hemd <b>und</b> glatt rasiert? Dann Finger weg. Sonst einfach ein großzügiger Kunde.</div>` : ""}
    <div class="sn-cust">
      <span class="face">${w.av ? avatarSVG(w.av, 40, { uid: "sc" + o.id, bg: true }) : ""}</span>
      <div><b>${esc(w.name)}</b><small>${esc(w.job)}</small></div>
      <span class="sn-want">${snusCan(s, 30)}<b>${o.snus.n}×</b></span>
    </div>
    <div class="desc">${esc(o.desc)} · ${money(o.snus.each || SNUS_SELL)}/Dose</div>
    <div class="meta addr"><span>📦 ${esc(addrText(oPick(o)))} <small>${esc(N[o.from].short)}</small></span><span>🏠 ${esc(addrText(oDrop(o)))} <small>${esc(oDrop(o).a || N[o.to].short)}</small></span></div>
    <div class="meta small"><span>📏 ${kmf(o.refDist)}</span><span>⏳ ${dur(rest)}</span><span>⚡ ab ${dur(o.refTime)}</span></div>
    ${previewRow}
  </div>`;
}

/* ------------------------------ Schattenbuch ------------------------------
   Einkauf, Verkauf und Gewinn der Nebengeschäfte – versteckt hinter dem
   Taschenrechner im Diensthandy. In der offiziellen Kasse steht davon nichts. */
function shadowTotals() {
  const sn = S.snus || {}, pb = S.pablo || {};
  /* Ältere Spielstände: aus den Buchungen nachrechnen */
  const fromLedger = (k, sign) => (S.ledger || []).filter(e => e.k === k && Math.sign(e.a) === sign).reduce((a, e) => a + Math.abs(e.a), 0);
  if (S.snus && sn.spent == null) { sn.spent = fromLedger("snus", -1); sn.earned = fromLedger("snus", 1); }
  if (S.pablo && pb.spent == null) { pb.spent = fromLedger("pablo", -1); pb.earned = fromLedger("pablo", 1); }
  /* Ware, die gerade unterwegs zum Kunden ist, gehört noch zum Bestand */
  const snWay = S.jobs.filter(j => j.order.snus).reduce((a, j) => a + j.order.snus.n, 0);
  const pbWay = S.jobs.filter(j => j.order.pablo).reduce((a, j) => a + (j.order.pablo.kg || 0), 0);
  return {
    sn: { bought: sn.bought || 0, sold: sn.sold || 0, lost: sn.lost || 0, stock: (S.snus ? snusTotal() : 0) + snWay, way: snWay,
          spent: sn.spent || 0, earned: sn.earned || 0 },
    pb: { bought: pb.bought || 0, sold: pb.sold || 0, stock: (pb.kg || 0) + pbWay, way: pbWay, spent: pb.spent || 0, earned: pb.earned || 0 }
  };
}
function shadowBookHTML() {
  const t = shadowTotals();
  const any = t.sn.bought || t.pb.bought;
  if (!any) return `<div class="calc">
      <div class="calc-disp">0</div>
      <div class="empty">Nichts zu verbergen. Noch.</div>
    </div>`;
  const pm = n => `<b class="${n >= 0 ? "good" : "bad"}">${n >= 0 ? "+" : "−"}${money(Math.abs(n))}</b>`;
  /* Gewinn wie beim Kaufmann: Verkauf minus Einkauf, der Rest im Lager zählt
     zum Einkaufspreis mit – sonst stünde nach jedem Großeinkauf ein Minus da. */
  const snStock = t.sn.stock * SNUS_BUY, pbStock = t.pb.stock * PABLO_BUY;
  const snP = t.sn.earned - t.sn.spent + snStock, pbP = t.pb.earned - t.pb.spent + pbStock, all = snP + pbP;
  const cash = t.sn.earned - t.sn.spent + t.pb.earned - t.pb.spent;
  const rows = (S.ledger || []).filter(e => e.k === "snus" || e.k === "pablo").slice(0, 14).map(e => `<div class="ldrow">
      <span class="ldi">${e.k === "snus" ? snusLogo(18) : "❄️"}</span>
      <span class="ldl">${esc(e.l)}<small>Tag ${dayOf(e.t)}, ${clock(e.t)}</small></span>
      ${pm(e.a)}
    </div>`).join("");
  return `<div class="shadow">
    <div class="calc-disp ${all >= 0 ? "" : "neg"}">${all >= 0 ? "" : "−"}${money(Math.abs(all))}</div>
    <div class="sb-sub">Gewinn aus Nebengeschäften · Kasse ${cash >= 0 ? "+" : "−"}${money(Math.abs(cash))}, Rest liegt im Lager</div>
    ${typeof solKnown === "function" ? (() => { const r = solKnown(), paid = ((S.snus && S.snus.sol) || 0) + ((S.pablo && S.pablo.sol) || 0);
      return `<div class="sb-sol"><span>◎ 1 SOL = <b>${fmt(r.eur, 2)} €</b> <i class="${r.live ? "live" : ""}">${r.live ? "● live" : "offline"} · ${solAge(r)}</i></span>
        ${paid ? `<span>an Verkäufer: <b>${solf(paid, 2)} SOL</b></span>` : ""}</div>`; })() : ""}
    ${t.sn.bought ? `<div class="sb-card">
      <div class="sb-h">${snusLogo(22)} <b>Mr. Snus</b><span>${pm(snP)}</span></div>
      <div class="sb-row"><span>Eingekauft</span><span>${t.sn.bought} Dosen</span><b class="bad">−${money(t.sn.spent)}</b></div>
      ${S.snus && S.snus.sol ? `<div class="sb-row muted"><span>davon per Wallet</span><span></span><span>${solf(S.snus.sol, 2)} SOL</span></div>` : ""}
      <div class="sb-row"><span>Verkauft</span><span>${t.sn.sold} Dosen</span><b class="good">+${money(t.sn.earned)}</b></div>
      ${t.sn.lost ? `<div class="sb-row"><span>Beschlagnahmt</span><span>${t.sn.lost} Dosen</span><b class="bad">−${money(t.sn.lost * SNUS_BUY)}</b></div>` : ""}
      <div class="sb-row muted"><span>Im Lager${t.sn.way ? " + unterwegs" : ""}</span><span>${t.sn.stock} Dosen</span><b>+${money(snStock)}</b></div>
    </div>` : ""}
    ${t.pb.bought ? `<div class="sb-card dark">
      <div class="sb-h">❄️ <b>Don Pablo</b><span>${pm(pbP)}</span></div>
      <div class="sb-row"><span>Eingekauft</span><span>${kgf(t.pb.bought)}</span><b class="bad">−${money(t.pb.spent)}</b></div>
      ${S.pablo && S.pablo.sol ? `<div class="sb-row muted"><span>davon per Wallet</span><span></span><span>${solf(S.pablo.sol, 0)} SOL</span></div>` : ""}
      <div class="sb-row"><span>Verkauft</span><span>${kgf(t.pb.sold)}</span><b class="good">+${money(t.pb.earned)}</b></div>
      <div class="sb-row muted"><span>Im Hangar${t.pb.way ? " + unterwegs" : ""}</span><span>${kgf(t.pb.stock)}</span><b>+${money(pbStock)}</b></div>
    </div>` : ""}
    ${rows ? `<div class="sb-list"><div class="sb-lh">Letzte Buchungen</div>${rows}</div>` : ""}
    <div class="sb-note">Dieses Buch gibt es offiziell nicht – in der Kasse taucht davon nichts auf.</div>
  </div>`;
}
