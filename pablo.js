/* =========================================================================
   LOGISTIKA – Don Pablo
   Ab Etappe 4 (Luftfracht) ruft gelegentlich Don Pablo an und bietet
   tonnenweise Kokain an. Die Ware wartet in einem Hangar; Kunden heißen nach
   ihren Städten („Mr. Hamburg“) und nehmen ein paar hundert Kilo bis ein paar
   Tonnen. Wer nicht nach einer Stadt heißt („Mr. Banane“), ermittelt verdeckt
   für Interpol – eine Lieferung an ihn beendet das Spiel.
   ========================================================================= */
"use strict";

const PABLO_STAGE = 4;          /* ab der Etappe mit Luftfracht */
const PABLO_BUY = 35;           /* Einkauf €/kg */
const PABLO_SELL = 80;          /* Verkauf €/kg */
const PABLO_COP_SHARE = 0.25;
const PABLO_COP_NAMES = ["Banane", "Schnitzel", "Kartoffel", "Gurke", "Toaster", "Pudding", "Brezel",
  "Bratwurst", "Kohlrabi", "Zitrone", "Staubsauger", "Kaktus", "Radieschen", "Spätzle", "Pfannkuchen",
  "Wackeldackel", "Gartenzwerg", "Rasenmäher", "Sauerkraut", "Blumenkohl"];
const PABLO_BYE = ["Como quieras. Ich ruf wieder an.", "Schade, amigo. Hasta luego.", "Bueno. Du weißt, wo du mich findest."];
const PABLO_OPS = ["Schneesturm", "Weißer Hai", "Nachtfalke", "Puderzucker", "Eisberg", "Lawine", "Polarlicht"];

function pabloState() {
  if (!S.pablo) S.pablo = { kg: 0, at: null, nextOffer: 0, nextCust: 0, bought: 0, sold: 0 };
  return S.pablo;
}
function pabloFree() {
  const promised = S.orders.filter(o => o.pablo).reduce((a, o) => a + o.pablo.kg, 0);
  return Math.max(0, pabloState().kg - promised);
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
function pabloOpenMsg() { return (S.phone && S.phone.msgs || []).find(m => m.kind === "pablo" && (m.state === "ask" || m.state === "offer")); }

function tickPablo() {
  if (S.stage < PABLO_STAGE || S.jail || S.over) return;
  const pb = pabloState();
  if (!pb.nextOffer) pb.nextOffer = S.time + rnd(120, 480);
  const open = pabloOpenMsg();
  if (open && S.time > open.expires) {
    open.state = "gone";
    open.thread.push({ me: false, t: "Zu langsam, amigo. Die Ware ist weg." });
    pb.nextOffer = S.time + rnd(1.5, 3) * 1440;
    if (typeof renderPhone === "function") renderPhone();
  }
  if (!open && S.time >= pb.nextOffer) pabloOffer();
  if (pb.at && pb.kg > 0 && S.time >= (pb.nextCust || 0)) {
    if (S.orders.filter(o => o.pablo).length < 3) pabloCustomer();
    pb.nextCust = S.time + rnd(180, 420);
  }
}

function pabloOffer() {
  const pb = pabloState();
  pb.nextOffer = S.time + rnd(2, 4) * 1440;
  const tons = 8 + Math.floor(Math.random() * 33);
  phoneMsg({
    kind: "pablo", from: "Don Pablo", title: "Hola amigo", body: "",
    state: "ask", expires: S.time + rnd(8, 12) * 60, tons,
    thread: [
      { me: false, t: "Hola amigo. Hier ist Don Pablo." },
      { me: false, t: "Ich hab " + tons + " Tonnen Kokain, reinste Ware. Interesse?" }
    ],
    toastText: "📞 Don Pablo: „Hola amigo …“"
  });
  if (typeof linaTalk === "function") setTimeout(() => linaTalk("pablo"), 600);
}

function pabloReply(msgId, yes) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "ask") return;
  if (!yes) {
    m.thread.push({ me: true, t: "Kein Interesse." }, { me: false, t: pick(PABLO_BYE) });
    m.state = "no";
  } else {
    m.thread.push({ me: true, t: "Zeig her." });
    m.pick = 0;
    m.thread.push({ me: false, list: true });
    m.state = "offer";
    m.expires = Math.max(m.expires, S.time + 8 * 60);
  }
  save(); renderPhone();
}
function pabloStep(msgId, d) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer") return;
  m.pick = clamp((m.pick || 0) + d, 0, m.tons);
  renderPhone();
}
function pabloAll(msgId, on) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer") return;
  m.pick = on ? m.tons : 0;
  renderPhone();
}
function pabloBuy(msgId) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer" || !m.pick) return;
  const kg = m.pick * 1000, cost = kg * PABLO_BUY;
  if (cost > S.money) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn");
  const pb = pabloState();
  if (!pb.at || pb.kg <= 0) {
    const hubs = unlockedNodes().filter(n => n.modes.includes("a"));
    pb.at = pick(hubs.length ? hubs : unlockedNodes()).id;
  }
  S.money -= cost; S.expense += cost;
  logMoney("pablo", "Don Pablo · " + m.pick + " t", -cost);
  pb.kg += kg; pb.bought += kg;
  m.thread.push({ me: true, t: "Ich nehm " + m.pick + " Tonnen." });
  m.thread.push({ me: false, t: "Perfecto. Hangar 7, " + N[pb.at].name + ". Meine Leute melden sich bei dir." });
  m.state = "done"; m.bought = m.pick;
  const first = !pb.bustFree;
  pb.bustFree = true;
  pabloCustomer(first);
  pb.nextCust = S.time + rnd(120, 300);
  toast("❄️ " + m.pick + " t im Hangar " + N[pb.at].short + " – Kunden unter „Aufträge“.", "ok");
  save(); renderPhone(); render();
}
function pabloCancel(msgId) {
  const m = S.phone.msgs.find(x => x.id === msgId);
  if (!m || m.state !== "offer") return;
  m.thread.push({ me: true, t: "Doch nicht." }, { me: false, t: pick(PABLO_BYE) });
  m.state = "no";
  save(); renderPhone();
}

/* Ein Kunde: echte heißen nach ihrer Stadt und wollen dorthin beliefert
   werden. Ermittler tragen irgendeinen anderen Namen. */
function pabloCustomer(safe) {
  const pb = pabloState();
  const free = pabloFree();
  if (!pb.at || free < 300) return null;
  const cities = pabloCities().filter(n => n.id !== pb.at).sort(() => Math.random() - 0.5);
  if (!cities.length) return null;
  const cop = !safe && Math.random() < PABLO_COP_SHARE;
  const kg = Math.min(Math.floor(free / 50) * 50, 300 + Math.floor(Math.random() * 55) * 50);
  if (kg < 300) return null;
  const name = cop ? "Mr. " + pick(PABLO_COP_NAMES) : null;
  /* Am liebsten ein Ziel, das die eigene Flotte gerade auch bedienen kann */
  let fallback = null;
  for (const dest of cities.slice(0, 10)) {
    const fast = plan(pb.at, dest.id, "ware", kg, "time");
    if (!fast) continue;
    const o = {
      id: "A" + (S.seq++), from: pb.at, to: dest.id, cargo: "ware", weight: kg,
      pay: kg * PABLO_SELL, deadline: Math.round(S.time + fast.time * 2.5 + rnd(360, 720)),
      shipper: name || "Mr. " + dest.short, desc: "nimmt " + kgf(kg) + " · Übergabe in " + dest.name, created: S.time,
      refDist: Math.round(fast.dist), refTime: Math.round(fast.time),
      expire: Math.round(S.time + rnd(8, 16) * 60),
      pablo: { kg, cop, city: dest.id }
    };
    if (bestOption(planOptions(o, buildVariants(o)))) { fallback = o; break; }
    if (!fallback) fallback = o;
  }
  if (!fallback) return null;
  S.orders.push(fallback);
  if (typeof renderDirty !== "undefined") renderDirty = true;
  return fallback;
}
function pabloTake(o) { const pb = pabloState(); pb.kg = Math.max(0, pb.kg - o.pablo.kg); }
function pabloGiveBack(o) { pabloState().kg += o.pablo.kg; }
function pabloDelivered(o) { pabloState().sold += o.pablo.kg; }

/* ------------------------------ Spielende -------------------------------- */
function pabloBust(job) {
  const o = job.order;
  S.over = {
    kind: "interpol", who: o.shipper, kg: o.pablo.kg, place: o.to, time: S.time,
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
      <dt>Sichergestellt</dt><dd>${kgf(o.kg)} Kokain</dd>
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
      const live = m.state === "offer", k = m.pick || 0;
      return `<div class="bub in list">
        <div class="sn-lh">Was ich dir geben kann:</div>
        <div class="sn-row">
          <span class="pb-ic">❄️</span>
          <div class="sn-tx"><b>Kokain</b><small>${m.tons} t · ${money(PABLO_BUY * 1000)}/t</small></div>
          ${live ? `<div class="sn-step">
              <button data-pbstep="${m.id}|-1" aria-label="weniger">−</button>
              <b>${k} t</b>
              <button data-pbstep="${m.id}|1" aria-label="mehr">+</button>
            </div>` : (m.bought ? `<span class="sn-got">${m.bought} t</span>` : "")}
        </div>
      </div>`;
    }
    return `<div class="bub ${e.me ? "out" : "in"}">${esc(e.t)}</div>`;
  };
  let acts = "";
  if (m.state === "ask") {
    acts = `<div class="sn-acts">
      <button class="btn tiny" data-pbyes="${m.id}">Zeig her</button>
      <button class="btn tiny ghost" data-pbno="${m.id}">Kein Interesse</button></div>`;
  } else if (m.state === "offer") {
    const k = m.pick || 0, cost = k * 1000 * PABLO_BUY;
    acts = `<div class="sn-sum">${k} t · <b>${money(cost)}</b> <small>Kunden zahlen ${money(PABLO_SELL * 1000)}/t</small></div>
      <div class="sn-acts">
        <button class="btn tiny${k && cost <= S.money ? "" : " disabled"}" data-pbbuy="${m.id}">Kaufen${k ? " · " + money(cost) : ""}</button>
        <button class="btn tiny ghost" data-pball="${m.id}|${k ? 0 : 1}">${k ? "Nichts" : "Alles"}</button>
        <button class="btn tiny ghost" data-pbcancel="${m.id}">Doch nicht</button></div>`;
  } else if (m.state === "gone") {
    acts = `<div class="pmsg-note">Don Pablo hat aufgelegt.</div>`;
  }
  return `<div class="pmsg snus pablo">
    <div class="sn-head">${pabloFace(38)}<div><b>Don Pablo</b><small>${stamp(m.time)} · unterdrückte Nummer</small></div></div>
    <div class="sn-chat">${m.thread.map(bub).join("")}</div>
    ${acts}
  </div>`;
}
function bindPabloMsgs() {
  $$("#modalBody [data-pbyes]").forEach(b => b.onclick = () => pabloReply(b.dataset.pbyes, true));
  $$("#modalBody [data-pbno]").forEach(b => b.onclick = () => pabloReply(b.dataset.pbno, false));
  $$("#modalBody [data-pbstep]").forEach(b => b.onclick = () => { const [id, d] = b.dataset.pbstep.split("|"); pabloStep(id, +d); });
  $$("#modalBody [data-pball]").forEach(b => b.onclick = () => { const [id, on] = b.dataset.pball.split("|"); pabloAll(id, on === "1"); });
  $$("#modalBody [data-pbbuy]").forEach(b => b.onclick = () => pabloBuy(b.dataset.pbbuy));
  $$("#modalBody [data-pbcancel]").forEach(b => b.onclick = () => pabloCancel(b.dataset.pbcancel));
}
function pabloStockHTML() {
  const pb = S.pablo;
  if (!pb || !pb.at || pb.kg <= 0) return "";
  return `<div class="snusbar pablo"><span class="sn-lbl">❄️ Hangar ${esc(N[pb.at].short)} · ${kgf(pb.kg)} Ware</span></div>`;
}
function pabloOrderCard(o, previewRow) {
  const rest = o.deadline - S.time;
  return `<div class="card order gray dark" data-order="${o.id}">
    <div class="card-top">
      <span class="badge gray">❄️ Ware · Don Pablo</span>
      <span class="pay">${money(o.pay)}</span>
    </div>
    <div class="sn-cust">
      <span class="face">${pabloGuy(40)}</span>
      <div><b>${esc(o.shipper)}</b><small>unterdrückte Nummer</small></div>
      <span class="sn-want"><b>${kgf(o.pablo.kg)}</b></span>
    </div>
    <div class="desc">${esc(o.desc)} · ${money(PABLO_SELL * 1000)}/t</div>
    <div class="meta"><span>🛫 Hangar ${esc(N[o.from].short)}</span><span>🏁 ${esc(N[o.to].short)}</span></div>
    <div class="meta small"><span>📏 ${kmf(o.refDist)}</span><span>⏳ ${dur(rest)}</span><span>⚡ ab ${dur(o.refTime)}</span></div>
    ${previewRow}
  </div>`;
}
