/* =========================================================================
   LOGISTIKA – Übernahmen
   Wer im Markt vorn liegt, kann eine Konkurrentin kaufen: Firmenwert,
   Verhandlung über bis zu drei Runden mit Gegenangeboten. Nach der
   Übernahme gehören Flotte, Firmensitz, ein Teil des Personals und der
   Marktanteil dir – und die Konkurrentin schnappt keine Aufträge mehr weg.
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
             about: "Traditionsspedition seit 1952. Treue Stammkunden, alte Lkw, kein Nachfolger in Sicht." },
  nord:    { boss: "Ingrid Søndergaard", role: "Vorstandsvorsitzende", hq: "hamburg", base: 160000, fleet: 6, tier: 1, modes: "rli",
             about: "Hanseatische Reederei-Tochter mit Lagern im Hafen und guten Kontakten nach Skandinavien." },
  atlas:   { boss: "Pieter van Dijk", role: "CEO", hq: "rotterdam", base: 420000, fleet: 7, tier: 2, modes: "rlis",
             about: "Europaweit vernetzte Kontraktlogistik mit Zentrale im Rotterdamer Hafen." },
  pacific: { boss: "Mei Lin Tan", role: "Managing Director", hq: "singapur", base: 950000, fleet: 8, tier: 2, modes: "rsa",
             about: "Container- und Luftfracht zwischen Asien und Europa, gesteuert aus Singapur." }
};
function corp() { if (!S.corp) S.corp = { owned: {}, talks: {} }; return S.corp; }
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
function corpValue(id) {
  const c = CORP[id], sh = shares();
  return roundK(c.base * stageK() * (0.7 + 1.6 * (sh[id] || 0)), 1000);
}
/* Voraussetzungen: Level 5 und mindestens so viel Marktanteil wie die andere */
function corpReady(id) {
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
  const all = RIVALS.filter(r => r.st <= S.stage);
  if (!all.length) return "";
  const rows = all.map(r => {
    const c = CORP[r.id];
    if (ownedRival(r.id)) {
      const o = corp().owned[r.id];
      return `<div class="corp-row owned" style="--rc:${r.col}"><span class="cr-i">${r.icon}</span>
        <span class="cr-t"><b>${esc(r.name)}</b><small>gehört seit ${stamp(o.at)} zu ${esc(S.player.company)} · ${money(o.price)}</small></span>
        <span class="cr-st">✔ übernommen</span></div>`;
    }
    const rd = corpReady(r.id), sh = shares();
    return `<div class="corp-row" style="--rc:${r.col}"><span class="cr-i">${r.icon}</span>
      <span class="cr-t"><b>${esc(r.name)}</b><small>${esc(c.boss)} · ${Math.round((sh[r.id] || 0) * 100)} % Marktanteil · Firmenwert ~${money(corpValue(r.id))}</small></span>
      ${rd.ok ? `<button class="btn tiny" data-corp="${r.id}">🦈 Angebot</button>` : `<span class="cr-st">${esc(rd.why)}</span>`}</div>`;
  }).join("");
  return `<div class="card eco corp">
    <div class="card-top"><div class="vname">🦈 Übernahmen<small>Kauf eine Konkurrentin: Ihre Flotte, ihr Firmensitz und ihr Marktanteil gehen an dich – und sie schnappt dir keine Aufträge mehr weg.</small></div></div>
    ${rows}
  </div>`;
}
function bindCorp() { $$("#tab-world [data-corp]").forEach(b => b.onclick = () => openCorp(b.dataset.corp)); }

/* ------------------------------ Verhandlung ---------------------------- */
let corpOpen = null;
function openCorp(id) {
  const r = rivalById(id), c = CORP[id]; if (!r || !c || ownedRival(id)) return;
  const rd = corpReady(id); if (!rd.ok) return toast(r.name + ": " + rd.why + ".", "warn");
  const C = corp(), val = corpValue(id), sh = shares();
  let t = C.talks[id];
  if (!t || t.done || t.cool <= S.time && t.round >= 3) {
    /* Was sie insgeheim verlangt: je stärker du, desto weicher wird sie */
    const dom = (sh.me || 0) > 2 * (sh[id] || 0) ? 0.94 : 1;
    t = C.talks[id] = { round: 0, val, res: Math.round(val * rnd(0.95, 1.2) * dom), chat: [], ask: null, cool: 0 };
    t.chat.push({ me: false, t: `Guten Tag. ${c.boss} hier, ${c.role} bei ${r.name}. Ich höre, Sie interessieren sich für unser Haus? Machen Sie mir ein Angebot.` });
  }
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
      <div><small>Flotte</small><b>${c.fleet + Math.floor(S.stage / 2)} Fahrzeuge</b></div>
      <div><small>Firmensitz</small><b>${esc(N[c.hq].short)} · ${OFFICE_TIERS[c.tier].name}</b></div>
    </div>
    <div class="lim">${t.done ? "✔ Übernommen – Flotte, Firmensitz und Marktanteil gehören jetzt " + esc(S.player.company) + "."
      : "Mit der Übernahme: Flotte, " + (hqOk && baseRoom ? "Firmensitz als Büro samt zwei Leuten," : "Erlös aus dem Verkauf des Firmensitzes,") + " ihr Marktanteil und +3 Ruf."}</div>
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
function corpOffer(id, amount, takeAsk) {
  const t = corp().talks[id], r = rivalById(id), c = CORP[id];
  if (!t || t.done) return;
  amount = Math.round(amount);
  if (amount > S.money) return renderCorp("Dafür fehlen " + money(amount - S.money) + " – die Hausbank unter „Welt“ hilft.");
  t.chat.push({ me: true, t: takeAsk ? "Einverstanden: " + money(amount) + "." : "Wir bieten " + money(amount) + " für " + r.name + "." });
  t.round++;
  if (takeAsk || amount >= t.res) {
    t.chat.push({ me: false, t: pick(["Abgemacht. Ich lasse die Verträge aufsetzen.", "Das ist ein faires Angebot. Wir haben einen Deal.", "Schweren Herzens – aber ja. Kümmern Sie sich gut um meine Leute."]) });
    t.done = true;
    corpClose(id, amount);
    return renderCorp();
  }
  if (amount < t.res * 0.7) {
    t.chat.push({ me: false, t: "Das ist eine Frechheit. Melden Sie sich in ein paar Tagen wieder – mit einem ernsthaften Angebot." });
    t.cool = S.time + 2 * 1440; t.round = 3; t.ask = null;
    save(); return renderCorp();
  }
  if (t.round >= 3) {
    t.chat.push({ me: false, t: "Wir kommen heute nicht zusammen. Lassen Sie uns das in zwei Tagen noch einmal versuchen." });
    t.cool = S.time + 2 * 1440; t.ask = null;
    save(); return renderCorp();
  }
  t.ask = roundK((amount + t.res * 1.05) / 2, 1000);
  t.chat.push({ me: false, t: amount >= t.res * 0.9
    ? `Wir sind nah dran. Für ${money(t.ask)} gehört ${r.name} Ihnen.`
    : `Da müssen Sie schon deutlich mehr bieten. Unter ${money(t.ask)} verkaufe ich nicht.` });
  save(); renderCorp();
}
function corpClose(id, price) {
  const C = corp(), r = rivalById(id), c = CORP[id];
  S.money -= price; S.expense += price;
  logMoney("corp", "Übernahme: " + r.name, -price);
  C.owned[id] = { at: S.time, price };
  /* Marktanteil wandert zu dir, offene Kaperversuche enden */
  const sh = shareState(); sh.me = (sh.me || 0) + (sh[id] || 0); sh[id] = 0;
  S.orders.forEach(o => { if (o.rival && o.rival.id === id) delete o.rival; });
  /* Flotte */
  const pool = rivalFleet(id), n = c.fleet + Math.floor(S.stage / 2), got = [];
  const at = isUnlocked(c.hq) ? c.hq : null;
  for (let i = 0; i < n; i++) {
    const t = pick(pool);
    const v = makeVehicle(t.id, false);
    if (at && N[at].modes.includes(t.mode)) v.at = at;
    v.wear = Math.round(rnd(20, 55)); v.kmTotal = Math.round(rnd(40000, 300000));
    v.foreign = { id, col: r.col };
    S.fleet.push(v); got.push(v);
  }
  /* Firmensitz: als Büro übernehmen – oder verkaufen */
  let baseTxt;
  if (at && (S.bases || []).length < maxBases() && !baseAtNode(at)) {
    ensureOffices();
    const b = { id: "S" + (S.seq++), node: at, tier: c.tier, rent: false, staff: [], vehicles: [], mood: 70, opened: S.time, done: 0,
      nextAt: S.time + 30, pausedUntil: 0, pool: null, poolDay: -1, rentDue: S.time + 30 * 1440,
      deco: { floor: "beton", tint: "natur", wall: "weiss", kitchen: "keine", plants: [] } };
    ["disp", "fahr"].forEach(role => {
      const p = makeCandidate(false); p.role = role; p.skill = clamp(Math.round(rnd(2, 4.4)), 2, 4);
      p.wage = Math.round(ROLES[role].wage * (0.62 + p.skill * 0.19));
      b.staff.push({ id: p.id, name: p.name, role, skill: p.skill, wage: p.wage, trait: "war vorher bei " + r.name, av: p.av, since: S.time, jobs: 0 });
    });
    got.forEach(v => { if (b.vehicles.length < OFFICE_TIERS[b.tier].slots && v.at === at) b.vehicles.push(v.uid); });
    S.bases.push(b);
    refreshPool(b);
    baseTxt = `Der Firmensitz in ${N[at].name} ist jetzt dein ${OFFICE_TIERS[b.tier].name} – zwei Leute aus Disposition und Fahrpersonal bleiben.`;
  } else {
    const cash = roundK(price * 0.18, 1000);
    S.money += cash; S.revenue += cash;
    logMoney("corp", "Verkauf Firmensitz " + r.name, cash);
    baseTxt = `Den Firmensitz haben wir verkauft: ${money(cash)}.`;
  }
  if (typeof repAdd === "function") repAdd(S.stage, 3);
  phoneMsg({ from: c.boss, kind: "good", title: r.name + " gehört jetzt zu " + S.player.company,
    body: `Die Verträge sind unterschrieben. ${got.length} Fahrzeuge fahren ab heute für Sie – noch in unseren alten Farben, unter „Flotte“ lassen sie sich umlackieren. ${baseTxt}` });
  toast("🦈 Übernahme: " + r.name + " gehört dir!", "ok");
  if (typeof checkAchievements === "function") checkAchievements();
  save(); render();
}

if (typeof ACHS !== "undefined") ACHS.push(
  { id: "corp1", icon: "🦈", name: "Haifisch", desc: "Eine Konkurrentin übernommen.", ok: () => Object.keys((S.corp || {}).owned || {}).length >= 1 },
  { id: "corp3", icon: "👑", name: "Platzhirsch", desc: "Drei Konkurrentinnen übernommen.", ok: () => Object.keys((S.corp || {}).owned || {}).length >= 3 }
);
