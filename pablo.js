/* =========================================================================
   LOGISTIKA – Don Pablo
   Ab Etappe 3 (Deutschland) stellt sich Don Pablo einmal vor; Nachschub an
   Kokain und Crack fragt der Spieler danach selbst im Diensthandy an.
   Die Ware wartet in einem Hangar; Kunden heißen nach
   ihren Städten („Mr. Hamburg“) und nehmen ein paar hundert Kilo bis ein paar
   Tonnen. Wer nicht nach einer Stadt heißt („Mr. Banane“), ermittelt verdeckt
   für Interpol – eine Lieferung an ihn beendet das Spiel.
   ========================================================================= */
"use strict";

const PABLO_STAGE = 3;          /* v302: Erstkontakt schon in Deutschland */
const PABLO_BUY = 35;           /* Einkauf €/kg */
const PABLO_SELL = 80;          /* Verkauf €/kg */
const PABLO_COP_SHARE = 0.25;
const PABLO_COP_NAMES = ["Banane", "Schnitzel", "Kartoffel", "Gurke", "Toaster", "Pudding", "Brezel",
  "Bratwurst", "Kohlrabi", "Zitrone", "Staubsauger", "Kaktus", "Radieschen", "Spätzle", "Pfannkuchen",
  "Wackeldackel", "Gartenzwerg", "Rasenmäher", "Sauerkraut", "Blumenkohl"];
const PABLO_BYE = ["Como quieras. Schreib mir, wenn du etwas brauchst.", "Schade, amigo. Du hast meine Nummer.", "Bueno. Du findest mich unter Kontakte."];
const PABLO_OPS = ["Schneesturm", "Weißer Hai", "Nachtfalke", "Puderzucker", "Eisberg", "Lawine", "Polarlicht"];
/* v302: Beide Waren verwenden die bisherigen fiktiven Spielpreise. */
const PABLO_SORTS = [
  { id: "kokain", name: "Kokain", icon: "❄️" },
  { id: "crack", name: "Crack", icon: "💎" }
];
const pabloSort = id => PABLO_SORTS.find(s => s.id === id) || PABLO_SORTS[0];

function pabloState() {
  if (!S.pablo) S.pablo = { kg: 0, at: null, nextOffer: 0, nextCust: 0, bought: 0, sold: 0 };
  /* v302: Frühere Hangarbestände und Aufträge waren ausschließlich Kokain.
     kg bleibt als Gesamtbestand für bestehende Anzeigen/Buchhaltung erhalten. */
  if (!S.pablo.stock302) {
    S.pablo.stock = { kokain: Math.max(0, S.pablo.kg || 0), crack: 0 };
    S.pablo.stock302 = true;
  }
  return S.pablo;
}
function pabloFree(sort) {
  const pb = pabloState();
  const promised = S.orders.filter(o => o.pablo && (!sort || (o.pablo.sort || "kokain") === sort)).reduce((a, o) => a + o.pablo.kg, 0);
  return Math.max(0, (sort ? pb.stock[sort] || 0 : pb.kg) - promised);
}
/* Kunden sitzen in echten Städten – Berliner Stadtteile zählen nicht */
function pabloCities() {
  return unlockedNodes().filter(n => n.type === "city" && !n.id.startsWith("b-"));
}

/* ------------------------------- Bilder --------------------------------- */
/* Don Pablo: Schatten mit Hut, Sonnenbrille, Zigarre und Goldkette */
function pabloFace(size) {
  return `<svg class="pablo-face" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Don Pablo" style="clip-path:circle(50%)">
    <circle cx="32" cy="32" r="31" fill="#3a2530"/>
    <circle cx="32" cy="27" r="23" fill="#553543" opacity=".5"/>
    <path fill="#0d0a0e" d="M9 64C10 52 18 46 26 44L32 47L38 44C46 46 54 52 55 64Z"/>
    <path fill="#d9d1c3" d="M28 45.5L32 53L36 45.5L32 47.5Z"/>
    <path fill="none" stroke="#d4a73a" stroke-width="1.4" d="M24.5 46.5Q32 55 39.5 46.5"/>
    <ellipse cx="32" cy="31" rx="10.5" ry="13" fill="#1a1419"/>
    <rect x="29" y="40" width="6" height="6" fill="#1a1419"/>
    <path fill="#0d0a0e" d="M20.5 22.5Q21.5 10.5 32 10.5Q42.5 10.5 43.5 22.5Z"/>
    <path fill="#4a3322" d="M20.9 19.4H43.1L43.4 22.3H20.6Z"/>
    <ellipse cx="32" cy="22.6" rx="19" ry="3.6" fill="#0d0a0e"/>
    <rect x="23.2" y="27.4" width="7.6" height="4.6" rx="2" fill="#050406"/>
    <rect x="33.2" y="27.4" width="7.6" height="4.6" rx="2" fill="#050406"/>
    <path d="M30.8 29H33.2" stroke="#050406" stroke-width="1.2"/>
    <path d="M24.6 28.6L26.4 28.6M34.6 28.6L36.4 28.6" stroke="#9fb2c8" stroke-width=".9" stroke-linecap="round"/>
    <path fill="#0d0a0e" d="M27.5 36.2Q32 34.6 36.5 36.2Q32 37.6 27.5 36.2Z"/>
    <rect x="35.5" y="37" width="9" height="2.2" rx="1" fill="#6b4a2f" transform="rotate(-8 35.5 38)"/>
    <circle cx="44.6" cy="36.6" r="1.3" fill="#ff7a2e"/>
    <path d="M45.5 34.5C47.5 31.5 44.5 30 46.5 27" fill="none" stroke="#c9c2cf" stroke-width=".8" opacity=".6" stroke-linecap="round"/>
  </svg>`;
}
/* Kunden: dunkler Umriss mit Sonnenbrille – alle sehen gleich aus, nur der Name verrät etwas */
function pabloGuy(size) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" style="clip-path:circle(50%)">
    <circle cx="32" cy="32" r="31" fill="#4b5261"/>
    <path fill="#15181e" d="M8 64C9 52 18 46 26 44L32 47L38 44C46 46 55 52 56 64Z"/>
    <ellipse cx="32" cy="29" rx="11" ry="13.5" fill="#15181e"/>
    <rect x="29" y="38" width="6" height="7" fill="#15181e"/>
    <rect x="22.6" y="25.5" width="8.2" height="4.8" rx="2" fill="#000"/>
    <rect x="33.2" y="25.5" width="8.2" height="4.8" rx="2" fill="#000"/>
    <path d="M30.8 27.2H33.2" stroke="#000" stroke-width="1.2"/>
    <path d="M24.2 26.8L26.2 26.8M34.8 26.8L36.8 26.8" stroke="#9fb2c8" stroke-width=".9" stroke-linecap="round"/>
  </svg>`;
}

/* ------------------------------- Ablauf --------------------------------- */
function pabloOpenMsg() { return phoneDealerOpen("pablo"); }

function tickPablo() {
  if (S.stage < PABLO_STAGE || S.jail || S.over) return;
  const pb = pabloState();
  /* v302: Nach der Begrüßung keinerlei automatische Nachschub-Anrufe. */
  if (!phoneContactsState().pablo) {
    if (!pb.nextOffer) pb.nextOffer = S.time + rnd(120, 480);
    if (S.time >= pb.nextOffer) pabloOffer();
  }
  if (phoneExpireDealerOffers("pablo") && phoneOpen()) renderPhone();
  if (pb.at && pb.kg > 0 && S.time >= (pb.nextCust || 0)) {
    if (S.orders.filter(o => o.pablo).length < 3) pabloCustomer();
    pb.nextCust = S.time + rnd(180, 420);
  }
}

function pabloOffer(requested) {
  const pb = pabloState();
  const contacts = phoneContactsState();
  if (!requested && contacts.pablo) return null;
  if (requested && !contacts.pablo) return null;
  const block = phoneDealerBlock("pablo");
  if (block) { if (requested) toast(block, "warn"); return null; }
  const open = pabloOpenMsg();
  if (open) return open;
  contacts.pablo = true;
  const m = phoneMsg({
    kind: "pablo", from: "Don Pablo", title: requested ? "Aktueller Bestand" : "Hola amigo", body: "",
    state: requested ? "offer" : "ask", expires: S.time + rnd(8, 12) * 60,
    offer: pabloSupply().map(r => ({ ...r })), pick: {},
    thread: requested ? [{ me: true, t: "Mein Lager ist leer. Was hast du gerade da?" },
      { me: false, t: "Das kann ich dir heute anbieten, amigo." }, { me: false, list: true }]
      : [{ me: false, t: "Hola amigo, Don Pablo hier. Ich habe Kokain und Crack im Sortiment. Interesse?" },
        { me: false, t: "Meine Nummer findest du unter Kontakte. Melde dich dort, wenn dein Lager leer ist. Keine weiteren Werbeanrufe, versprochen." }],
    toastText: "📞 Don Pablo: „Hola amigo …“"
  }, requested);
  save();
  if (!requested && typeof linaTalk === "function") setTimeout(() => linaTalk("pablo"), 600);
  return m;
}
/* v302: Gespeicherte Lieferung statt Neu-Würfeln beim Öffnen. Insgesamt
   weiterhin 8–40 Spieltonnen; Mengen und verfügbare Waren wechseln. */
function pabloSupply() {
  const pb = pabloState();
  if (!pb.supply302) {
    const legacy = pabloOpenMsg();
    if (legacy) {
      pb.supply302 = pabloRows(legacy).map(r => ({ ...r }));
    } else {
      const tons = 8 + Math.floor(Math.random() * 33);
      if (!pb.lastSupply302 || Math.random() < 0.65) {
        const k = Math.max(1, Math.floor(tons * rnd(0.3, 0.7)));
        pb.supply302 = [{ id: "kokain", have: k }, { id: "crack", have: tons - k }];
      } else pb.supply302 = [{ id: pick(PABLO_SORTS).id, have: tons }];
      if (JSON.stringify(pb.supply302) === pb.lastSupply302) {
        if (pb.supply302.length === 1) pb.supply302[0].id = pb.supply302[0].id === "kokain" ? "crack" : "kokain";
        else { pb.supply302[0].have += 1; pb.supply302[1].have -= 1; }
      }
    }
  }
  return pb.supply302;
}
/* v302: Bereits offene Angebote aus alten Spielständen bleiben kaufbar. */
function pabloRows(m) { return m.offer || [{ id: "kokain", have: m.tons }]; }
function pabloPicked(m, id) { return typeof m.pick === "number" ? (id === "kokain" ? m.pick : 0) : (m.pick && m.pick[id]) || 0; }
function pabloPickTotal(m) { return pabloRows(m).reduce((n, r) => n + pabloPicked(m, r.id), 0); }
function pabloPickMap(m) {
  if (typeof m.pick === "number") m.pick = { kokain: m.pick };
  return m.pick || (m.pick = {});
}

function pabloReply(msgId, yes) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.kind !== "pablo" || m.state !== "ask" || m.expires <= S.time) return;
  if (!yes) {
    m.thread.push({ me: true, t: "Kein Interesse." }, { me: false, t: pick(PABLO_BYE) });
    m.state = "no";
  } else {
    m.thread.push({ me: true, t: "Zeig her." });
    m.pick = {};
    m.thread.push({ me: false, list: true });
    m.state = "offer";
    m.expires = Math.max(m.expires, S.time + 8 * 60);
  }
  save(); renderPhone();
}
function pabloStep(msgId, sort, d) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.kind !== "pablo" || m.state !== "offer" || m.expires <= S.time) return;
  const row = pabloRows(m).find(r => r.id === sort);
  if (!row) return;
  const picks = pabloPickMap(m);
  picks[sort] = clamp((picks[sort] || 0) + d, 0, row.have);
  save(); renderPhone();
}
function pabloAll(msgId, on) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.kind !== "pablo" || m.state !== "offer" || m.expires <= S.time) return;
  const picks = pabloPickMap(m);
  pabloRows(m).forEach(r => { picks[r.id] = on ? r.have : 0; });
  save(); renderPhone();
}
function pabloPay(msgId) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.kind !== "pablo" || m.state !== "offer" || m.expires <= S.time) return;
  const block = phoneDealerBlock("pablo");
  if (block) return toast(block, "warn");
  const tons = pabloPickTotal(m);
  if (!tons) return toast("Erst Ware auswählen.", "warn");
  const cost = tons * 1000 * PABLO_BUY;
  if (cost > S.money) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn");
  if (typeof walletPay !== "function") return pabloBuy(msgId);
  walletPay({ to: "Don Pablo", icon: pabloFace(34), eur: cost, memo: tons + " t", onPaid: tx => pabloBuy(msgId, tx) });
}
function pabloBuy(msgId, tx) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.kind !== "pablo" || m.state !== "offer" || m.expires <= S.time) return;
  const block = phoneDealerBlock("pablo");
  if (block) return toast(block, "warn");
  const tons = pabloPickTotal(m);
  if (!tons) return toast("Erst Ware auswählen.", "warn");
  const kg = tons * 1000, cost = kg * PABLO_BUY;
  if (tx && tx.eur !== cost) return toast("Deine Auswahl hat sich geändert. Bitte erneut bestätigen.", "warn");
  if (cost > S.money) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn");
  if (!tx && typeof walletQuote === "function") tx = walletQuote(cost);
  const pb = pabloState();
  if (!pb.at || pb.kg <= 0) {
    /* v302: In Deutschland genügt eine per Lkw erreichbare Lagerhalle;
       erst ab Europa kommen Flughafen-Hangars als Übergabeort hinzu. */
    const hubs = unlockedNodes().filter(n => S.stage < 4
      ? n.type === "city" && !n.id.startsWith("b-") && n.modes.includes("r") : n.modes.includes("a"));
    pb.at = pick(hubs.length ? hubs : unlockedNodes()).id;
  }
  S.money -= cost; S.expense += cost;
  logMoney("pablo", "Don Pablo · " + tons + " t" + (tx ? " · " + solf(tx.sol, 2) + " SOL" : ""), -cost);
  pb.spent = (pb.spent || 0) + cost;
  for (const row of pabloRows(m)) pb.stock[row.id] = (pb.stock[row.id] || 0) + pabloPicked(m, row.id) * 1000;
  pb.kg += kg; pb.bought += kg;
  pb.lastSupply302 = JSON.stringify(pabloRows(m));
  delete pb.supply302;
  m.thread.push({ me: true, t: "Ich nehme " + pabloRows(m).filter(r => pabloPicked(m, r.id)).map(r => pabloPicked(m, r.id) + " t " + pabloSort(r.id).name).join(" und ") + "." });
  if (tx) { m.thread.push({ me: true, tx }); pb.sol = (pb.sol || 0) + tx.sol; }
  const hg = pabloHangar();
  m.thread.push({ me: false, t: "Perfecto. " + (hg ? hg.t : pabloDepotLabel() + " 7") + ", " + N[pb.at].name + ". Meine Leute melden sich." });
  m.state = "done"; m.bought = tons;
  phoneCloseDealerOffers("pablo");
  const first = !pb.bustFree;
  pb.bustFree = true;
  pabloCustomer(first);
  pb.nextCust = S.time + rnd(120, 300);
  toast("📦 " + tons + " t · " + pabloDepotLabel() + " " + N[pb.at].short + " – Kunden unter „Aufträge“.", "ok");
  save(); renderPhone(); render();
}
function pabloCancel(msgId) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer") return;
  pabloSupply();
  m.thread.push({ me: true, t: "Doch nicht." }, { me: false, t: pick(PABLO_BYE) });
  m.state = "no";
  save(); renderPhone();
}

/* Ein Kunde: echte heißen nach ihrer Stadt und wollen dorthin beliefert
   werden. Ermittler tragen irgendeinen anderen Namen. */
function pabloCustomer(safe) {
  const pb = pabloState();
  /* v302: Keine Mischaufträge; auch ein kleiner Rest kann vollständig weg. */
  const sorts = PABLO_SORTS.filter(s => pabloFree(s.id) > 0);
  if (!pb.at || !sorts.length) return null;
  const sort = pick(sorts), free = pabloFree(sort.id);
  const cities = pabloCities().filter(n => n.id !== pb.at).sort(() => Math.random() - 0.5);
  if (!cities.length) return null;
  const cop = !safe && Math.random() < PABLO_COP_SHARE;
  const kg = Math.min(free, 300 + Math.floor(Math.random() * 55) * 50);
  const name = cop ? "Mr. " + pick(PABLO_COP_NAMES) : null;
  /* Am liebsten ein Ziel, das die eigene Flotte gerade auch bedienen kann */
  let fallback = null;
  for (const dest of cities.slice(0, 10)) {
    const fast = plan(pb.at, dest.id, "ware", kg, "time");
    if (!fast) continue;
    const o = {
      id: "A" + (S.seq++), from: pb.at, to: dest.id, cargo: "ware", weight: kg,
      pay: kg * PABLO_SELL, deadline: Math.round(S.time + fast.time * 2.5 + rnd(360, 720)),
      shipper: name || "Mr. " + dest.short, desc: "nimmt " + kgf(kg) + " " + sort.name + " · Übergabe in " + dest.name, created: S.time,
      refDist: Math.round(fast.dist), refTime: Math.round(fast.time),
      expire: Math.round(S.time + rnd(8, 16) * 60),
      pablo: { kg, sort: sort.id, cop, city: dest.id },
      /* Abgeholt im Hangar, übergeben in einer Siedlung am Stadtrand */
      pick: pabloHangar(), drop: typeof makeAddr === "function" ? makeAddr(dest.id, "home") : undefined
    };
    if (typeof withLastMile === "function") withLastMile(o);
    if (bestOption(planOptions(o, buildVariants(o)))) { fallback = o; break; }
    if (!fallback) fallback = o;
  }
  if (!fallback) return null;
  S.orders.push(fallback);
  if (typeof renderDirty !== "undefined") renderDirty = true;
  return fallback;
}
function pabloHangar() {
  const pb = pabloState();
  if (!pb.at) return undefined;
  if (!pb.hangar || pb.hangarAt !== pb.at) {
    pb.hangar = typeof makeAddr === "function" ? makeAddr(pb.at, "hangar") : null;
    pb.hangarAt = pb.at;
  }
  return pb.hangar ? Object.assign({}, pb.hangar) : undefined;
}
function pabloDepotLabel() { return N[pabloState().at] && N[pabloState().at].type === "air" ? "Hangar" : "Lagerhalle"; }
function pabloTake(o) {
  const pb = pabloState(), sort = o.pablo.sort || "kokain";
  pb.stock[sort] = Math.max(0, (pb.stock[sort] || 0) - o.pablo.kg);
  pb.kg = Object.values(pb.stock).reduce((n, kg) => n + kg, 0);
}
function pabloGiveBack(o) {
  const pb = pabloState(), sort = o.pablo.sort || "kokain";
  pb.stock[sort] = (pb.stock[sort] || 0) + o.pablo.kg;
  pb.kg = Object.values(pb.stock).reduce((n, kg) => n + kg, 0);
}
function pabloDelivered(o, pay) { const pb = pabloState(); pb.sold += o.pablo.kg; pb.earned = (pb.earned || 0) + (pay || 0); }

/* ------------------------------ Spielende -------------------------------- */
function pabloBust(job) {
  const o = job.order;
  S.over = {
    kind: "interpol", who: o.shipper, kg: o.pablo.kg, sort: o.pablo.sort || "kokain", place: o.to, time: S.time,
    name: S.player ? S.player.name : "", company: S.player ? S.player.company : "",
    money: S.money, fleet: S.fleet.length, bases: (S.bases || []).length,
    op: pick(PABLO_OPS), file: "IP/" + (100000 + Math.floor(Math.random() * 899999))
  };
  save();
}
let overUI = false;
function overCheck() {
  if (!S.over || overUI) return;
  overUI = true;
  if ($("#modal").classList.contains("open")) closeModal();
  if (typeof endTutorial === "function" && document.body.classList.contains("tut-on")) endTutorial();
  const o = S.over;
  const years = 12 + Math.floor(o.kg / 250);
  reportShow(`<div class="rp interpol">
    <div class="rp-bar-top"><b>INTERPOL</b><span>Abschlussbericht · Operation „${esc(o.op)}“</span></div>
    <div class="rp-meta"><span>Aktenzeichen ${esc(o.file)}</span><span>Tag ${dayOf(o.time)}, ${clock(o.time)}</span></div>
    <dl>
      <dt>Beschuldigt</dt><dd>${esc(o.name || "unbekannt")}, Inhaber von ${esc(o.company || "–")}</dd>
      <dt>Festnahme</dt><dd>bei der Übergabe in ${esc(N[o.place] ? N[o.place].name : "–")}</dd>
      <dt>Verdeckter Ermittler</dt><dd>„${esc(o.who)}“</dd>
      <dt>Sichergestellt</dt><dd>${kgf(o.kg)} ${pabloSort(o.sort).name}</dd>
      <dt>Eingezogen</dt><dd>Firmenvermögen ${money(Math.max(0, o.money))}, ${o.fleet} Fahrzeug${o.fleet === 1 ? "" : "e"}${o.bases ? ", " + o.bases + " Standort" + (o.bases === 1 ? "" : "e") : ""}</dd>
      <dt>Urteil</dt><dd>${years} Jahre Haft</dd>
    </dl>
    <div class="rp-stamp red">FESTGENOMMEN</div>
    <p class="rp-end">Die Spedition ${esc(o.company || "")} ist aufgelöst.<br><b>Das Spiel ist vorbei.</b></p>
    <button class="btn" id="rpNew">Neues Spiel starten</button>
  </div>`);
  $("#rpNew").onclick = wipeAndRestart;
}

/* ------------------------------- Ansicht -------------------------------- */
function pabloMsgHTML(m) {
  const bub = e => {
    if (e.list) {
      const live = m.state === "offer" && m.expires > S.time;
      return `<div class="bub in list">
        <div class="sn-lh">Was ich dir geben kann:</div>
        ${pabloRows(m).map(r => {
          const sort = pabloSort(r.id), k = pabloPicked(m, r.id);
          return `<div class="sn-row"><span class="pb-ic">${sort.icon}</span>
            <div class="sn-tx"><b>${sort.name}</b><small>${r.have} t · ${money(PABLO_BUY * 1000)}/t</small></div>
            ${live ? `<div class="sn-step"><button data-pbstep="${m.id}|${r.id}|-1" aria-label="Weniger ${sort.name}">−</button>
              <b>${k} t</b><button data-pbstep="${m.id}|${r.id}|1" aria-label="Mehr ${sort.name}">+</button></div>`
              : m.bought && k ? `<span class="sn-got">${k} t</span>` : ""}</div>`;
        }).join("")}
      </div>`;
    }
    if (e.tx && typeof walletTxBubble === "function") return walletTxBubble(e.tx);
    return `<div class="bub ${e.me ? "out" : "in"}">${esc(e.t)}</div>`;
  };
  let acts = "";
  if (m.state === "ask") {
    acts = `<div class="sn-acts">
      <button class="btn tiny" data-pbyes="${m.id}">Zeig her</button>
      <button class="btn tiny ghost" data-pbno="${m.id}">Kein Interesse</button></div>`;
  } else if (m.state === "offer") {
    const k = pabloPickTotal(m), cost = k * 1000 * PABLO_BUY;
    acts = `<div class="sn-sum">${k} t · <b>${money(cost)}</b>${k && typeof solf === "function" ? ` <span class="sn-sol">≈ ${solf(solAmt(cost), 0)} SOL</span>` : ""} <small>Kunden zahlen ${money(PABLO_SELL * 1000)}/t · Zahlung in Solana</small></div>
      <div class="sn-acts">
        <button class="btn tiny${k && cost <= S.money ? "" : " disabled"}" data-pbbuy="${m.id}">◎ Bezahlen${k ? " · " + money(cost) : ""}</button>
        <button class="btn tiny ghost" data-pball="${m.id}|${k ? 0 : 1}">${k ? "Nichts" : "Alles"}</button>
        <button class="btn tiny ghost" data-pbcancel="${m.id}">Doch nicht</button></div>`;
  } else if (m.state === "gone") {
    acts = `<div class="pmsg-note">Don Pablo hat aufgelegt.</div>`;
  }
  return `<div class="pmsg snus pablo">
    <div class="sn-head">${pabloFace(38)}<div><b>Don Pablo</b><small>${stamp(m.time)} · Kontakt gespeichert</small></div>${typeof phoneTTL === "function" ? phoneTTL(m) : ""}</div>
    <div class="sn-chat">${m.thread.map(bub).join("")}</div>
    ${acts}
  </div>`;
}
function bindPabloMsgs() {
  $$("#modalBody [data-pbyes]").forEach(b => b.onclick = () => pabloReply(b.dataset.pbyes, true));
  $$("#modalBody [data-pbno]").forEach(b => b.onclick = () => pabloReply(b.dataset.pbno, false));
  $$("#modalBody [data-pbstep]").forEach(b => b.onclick = () => { const [id, sort, d] = b.dataset.pbstep.split("|"); pabloStep(id, sort, +d); });
  $$("#modalBody [data-pball]").forEach(b => b.onclick = () => { const [id, on] = b.dataset.pball.split("|"); pabloAll(id, on === "1"); });
  $$("#modalBody [data-pbbuy]").forEach(b => b.onclick = () => pabloPay(b.dataset.pbbuy));
  $$("#modalBody [data-pbcancel]").forEach(b => b.onclick = () => pabloCancel(b.dataset.pbcancel));
}
function pabloStockHTML() {
  const pb = pabloState();
  if (!pb || !pb.at || pb.kg <= 0) return "";
  const parts = PABLO_SORTS.filter(s => pb.stock[s.id] > 0).map(s => `<span class="sn-chip">${s.icon} ${s.name} <b>${kgf(pb.stock[s.id])}</b></span>`).join("");
  return `<div class="snusbar pablo"><span class="sn-lbl">📦 ${pabloDepotLabel()} ${esc(N[pb.at].short)} · ${kgf(pb.kg)}</span>${parts}</div>`;
}
function pabloOrderCard(o, previewRow) {
  const rest = o.deadline - S.time, sort = pabloSort(o.pablo.sort);
  return `<div class="card order gray dark${typeof flashOn === "function" && flashOn(o.id) ? " flash" : ""}" data-order="${o.id}">
    <div class="card-top">
      <span class="badge gray">${sort.icon} ${sort.name} · Don Pablo</span>
      <span class="pay">${money(o.pay)}</span>
      ${typeof rejectBtnHTML === "function" ? rejectBtnHTML(o.id) : ""}
    </div>
    <div class="sn-cust">
      <span class="face">${pabloGuy(40)}</span>
      <div><b>${esc(o.shipper)}</b><small>unterdrückte Nummer</small></div>
      <span class="sn-want"><b>${kgf(o.pablo.kg)}</b></span>
    </div>
    <div class="desc">${esc(o.desc)} · ${money(PABLO_SELL * 1000)}/t</div>
    <div class="meta addr"><span>📦 ${esc(addrText(oPick(o)))} <small>${esc(N[o.from].short)}</small></span><span>🏁 ${esc(addrText(oDrop(o)))} <small>${esc(N[o.to].short)}</small></span></div>
    <div class="meta small"><span>📏 ${kmf(o.refDist)}</span><span>⏳ ${dur(rest)}</span><span>⚡ ab ${dur(o.refTime)}</span></div>
    ${previewRow}
  </div>`;
}
