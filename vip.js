/* =========================================================================
   LOGISTIKA – Einladungen zur Sonderfahrt, Konkurrenz und Verhandlungen

   Sonderfahrten sind selten, eilig und fürstlich bezahlt. Sie kommen als
   Einladung mit Siegel – annehmen kann nur der Chef selbst, die Dispo darf
   sie nicht anfassen. Die Konkurrenz schnappt sich Ausschreibungen, wenn man
   zu lange wartet. Bei Großaufträgen lässt sich über den Preis reden.
   ========================================================================= */
"use strict";

/* ------------------------------ Einladungen ------------------------------ */
const VIP_JOBS = [
  { st: 1, org: "Universitätsklinikum Spreebogen", dept: "Institut für Transfusionsmedizin", mono: "US",
    sender: "Prof. Dr. med. Hanna Reimers", role: "Direktorin Transfusionsmedizin",
    from: "b-mitte", to: "b-marz", item: "Blutkonserven der Gruppe 0 negativ", cargo: "kuehl", kg: [8, 14],
    story: "Schwerer Unfall – die Notaufnahme in Marzahn braucht Blut, jede Minute zählt." },
  { st: 1, org: "Konzerthaus am Lindenplatz", dept: "Intendanz", mono: "KL",
    sender: "Dr. Clara Weinberg", role: "Intendantin",
    from: "b-char", to: "b-mitte", item: "eine Stradivari-Violine (Leihgabe)", cargo: "schmuck", kg: [2, 4],
    story: "Debüt heute Abend – die Geige liegt noch beim Geigenbauer in Charlottenburg." },
  { st: 1, org: "Internationale Filmtage Berlin", dept: "Festivalleitung", mono: "IF",
    sender: "Jonas Vogt", role: "Leiter Filmlogistik",
    from: "b-ber", to: "b-mitte", item: "die Premierenkopie des Eröffnungsfilms", cargo: "express", kg: [14, 24],
    story: "Die Kopie ist am BER gelandet, 1.800 Gäste warten – ohne Film keine Premiere." },
  { st: 1, org: "Botschaft des Königreichs Nordland", dept: "Kanzlei", mono: "KN",
    sender: "Ingrid Sørensen", role: "Gesandtin",
    from: "b-tempel", to: "b-mitte", item: "versiegelte Dokumentenmappe", cargo: "schmuck", kg: [1, 2],
    story: "Die Mappe muss vor der Unterzeichnung heute Nachmittag hier sein. Keine Fragen." },
  { st: 2, org: "Karosseriewerk Havelland", dept: "Werksleitung", mono: "KH",
    sender: "Markus Brandt", role: "Werkleiter",
    from: "leipzig", to: "potsdam", item: "ein Ersatzgetriebe für die Fertigungsstraße", cargo: "express", kg: [180, 320],
    story: "Das Band steht still – das Teil liegt beim Zulieferer in Leipzig." },
  { st: 2, org: "Opernhaus an der Elbe", dept: "Technische Direktion", mono: "OE",
    sender: "Friederike Lindner", role: "Technische Direktorin",
    from: "b-westh", to: "dresden", item: "das Bühnenbild der Premiere", cargo: "sperrig", kg: [2400, 4200],
    story: "Premiere morgen Abend, das Bühnenbild steht noch in Berlin – empfindliche Übergröße." },
  { st: 2, org: "Klinikum am Auensee Leipzig", dept: "Zentrallabor", mono: "KA",
    sender: "Prof. Dr. Yusuf Sahin", role: "Chefarzt Labormedizin",
    from: "halle", to: "leipzig", item: "Proben einer klinischen Studie", cargo: "kuehl", kg: [20, 40],
    story: "Die Kühlkette darf nicht reißen – es geht um die Zulassung eines Medikaments." },
  { st: 3, org: "Rennstall Grüne Hölle", dept: "Teamleitung", mono: "GH",
    sender: "Bastian Kruse", role: "Teamchef",
    from: "stuttgart", to: "koeln", item: "ein Ersatzmotor fürs Qualifying", cargo: "express", kg: [160, 240],
    story: "Motorschaden! Morgen früh ist Qualifying, der Ersatz steht in Stuttgart." },
  { st: 3, org: "Industrieschau Hannover", dept: "Ausstellerservice", mono: "IH",
    sender: "Nele Hansen", role: "Leiterin Ausstellerservice",
    from: "muenchen", to: "hannover", item: "der Prototyp eines Messestands", cargo: "pal", kg: [1800, 3600],
    story: "Ein Hauptaussteller hat keinen Stand – wir öffnen morgen um neun." },
  { st: 3, org: "Konzerthalle am Elbkai", dept: "Künstlerisches Betriebsbüro", mono: "KE",
    sender: "Dr. Merle Engel", role: "Betriebsdirektorin",
    from: "frankfurt", to: "hamburg", item: "ein Konzertflügel", cargo: "sperrig", kg: [480, 520],
    story: "Der Flügel muss vor der Generalprobe im Großen Saal stehen." },
  { st: 4, org: "Istituto Vaccinale di Milano", dept: "Direzione Logistica", mono: "IV",
    sender: "Dott.ssa Elena Rossi", role: "Leiterin Distribution",
    from: "fra", to: "milano", item: "Impfstoff für eine Notfallkampagne", cargo: "kuehl", kg: [900, 1600],
    story: "Kampagnenstart übermorgen – die Chargen warten in Frankfurt bei +5 °C." },
  { st: 4, org: "Maison de Couture Paris", dept: "Atelier", mono: "MC",
    sender: "Camille Dubois", role: "Directrice de production",
    from: "b-mitte", to: "paris", item: "die Kollektion für die Modenschau", cargo: "express", kg: [260, 420],
    story: "Show morgen um 20 Uhr, die Kollektion hängt noch in Berlin. Knitterfrei, bitte." },
  { st: 5, org: "Galerie Whitmore, New York", dept: "Kunsttransport", mono: "GW",
    sender: "Eleanor Whitmore", role: "Galeristin",
    from: "lhr", to: "nyc", item: "ein Gemälde für die Abendauktion", cargo: "schmuck", kg: [60, 120],
    story: "Das Werk muss heute nach Manhattan – Versicherungswert achtstellig." },
  { st: 5, org: "Raumfahrtzentrum Shanghai", dept: "Integration", mono: "RS",
    sender: "Dr. Wei Chen", role: "Programmleiter",
    from: "fra", to: "pvg", item: "ein Satellitenbauteil", cargo: "express", kg: [400, 700],
    story: "Das Startfenster schließt bald – das Bauteil ist das letzte fehlende Stück." }
];
const VIP_MIN = [3500, 12000, 40000, 160000, 475000, 1050000];   /* v244: mit Spielaufschlag (×2,5) */

function vipState() { if (!S.vip) S.vip = { next: 0, open: null, done: 0 }; return S.vip; }
function vipCandidates() {
  return VIP_JOBS.filter(v => v.st <= S.stage && N[v.from] && N[v.to] && isUnlocked(v.from) && isUnlocked(v.to)
    && plan(v.from, v.to, v.cargo, v.kg[0], "time"));
}
function makeVipOrder(tpl) {
  const weight = Math.round(rnd(tpl.kg[0], tpl.kg[1]) * 10) / 10;
  const fast = plan(tpl.from, tpl.to, tpl.cargo, weight, "time");
  const pr = priceOrder(tpl.from, tpl.to, tpl.cargo, weight);
  if (!fast || !pr) return null;
  const pay = Math.round(Math.max(pr.pay * rnd(5.5, 8.5), VIP_MIN[Math.min(6, S.stage) - 1] * rnd(0.9, 1.35)) / 10) * 10;
  const o = {
    id: "A" + (S.seq++), from: tpl.from, to: tpl.to, cargo: tpl.cargo, weight, vip: { org: tpl.org, mono: tpl.mono },
    pay, pk: PAY_K, deadline: Math.round(S.time + fast.time * 1.35 + fast.legs.length * 60 + 40),
    shipper: tpl.org, desc: tpl.item, created: S.time,
    refDist: Math.round(fast.dist), refTime: Math.round(fast.time),
    expire: 0, pick: makeAddr(tpl.from), drop: makeAddr(tpl.to)
  };
  withLastMile(o);
  o.deadline += 20;
  return o;
}
function tickVip() {
  const v = vipState();
  if (!lively() || level() < 3) return;
  if (!v.next) v.next = S.time + rnd(1.5, 3) * 1440;
  /* offene Einladung verfällt */
  if (v.open && S.time > v.open.rsvp) {
    const m = S.phone.msgs.find(x => x.id === v.open.msg);
    if (m && m.dec && !m.dec.done) { m.dec.done = true; m.handled = true; m.result = "Frist verpasst – die Fahrt ging an andere."; }
    toast("✉️ Die Einladung von " + v.open.o.shipper + " ist verfallen.", "warn");
    v.open = null; closeInvite();
  }
  if (v.open || S.time < v.next) return;
  if (S.orders.some(o => o.vip) || S.jobs.some(j => j.order.vip)) return;
  const pool = vipCandidates();
  const tpl = pool.length ? pick(pool.filter(t => t.st >= S.stage - 1).length ? pool.filter(t => t.st >= S.stage - 1) : pool) : null;
  const rep = repOf(S.stage);
  v.next = S.time + rnd(3, 5.5) * 1440 * (rep >= 70 ? 0.8 : rep < 35 ? 1.3 : 1);
  if (!tpl) return;
  const o = makeVipOrder(tpl);
  if (!o) return;
  const rsvp = S.time + Math.round(rnd(25, 40));
  const m = decisionMsg({ from: tpl.org, kind: "invite", icon: "✉️", type: "invite", title: "Einladung zur Sonderfahrt",
    toast: "✉️ Einladung zur Sonderfahrt – " + tpl.org, brakeWhy: "Einladung zur Sonderfahrt",
    body: tpl.item + " · Honorar " + money(o.pay),
    choices: [{ label: "Zusagen" }, { label: "Höflich absagen" }], def: 1, wait: rsvp - S.time + 1,
    ctx: { tpl: VIP_JOBS.indexOf(tpl) } });
  v.open = { o, msg: m.id, rsvp, tpl: VIP_JOBS.indexOf(tpl) };
  /* v236: das Einladungsfenster öffnet erst, wenn man nicht gerade schießt/angelt/sägt */
  const showInv = () => { if (!vipState().open || vipState().open.msg !== m.id) return; if (typeof uiBusy === "function" && uiBusy()) return setTimeout(showInv, 1500); openInvite(); };
  setTimeout(showInv, 400);
}
DECISIONS.invite = {
  choose(m, idx) {
    const v = vipState();
    if (!v.open || v.open.msg !== m.id) return "Nicht mehr aktuell.";
    const o = v.open.o;
    v.open = null;
    closeInvite();
    if (idx !== 0) return "Mit Bedauern abgesagt.";
    o.expire = o.deadline;
    S.orders.unshift(o);
    toast("✉️ Zugesagt: " + o.shipper + " – jetzt disponieren!", "ok");
    setTimeout(() => { if (S.orders.includes(o)) openPlanner(o.id); }, 350);
    return "Zugesagt – Chefsache.";
  }
};
function vipDelivered(job, pay, late) {
  const o = job.order; if (!o.vip) return;
  const v = vipState(); v.done++; extraStats().vip++;
  if (!late && typeof luckyGive === "function") luckyGive("std", "Dankeschön für die Sonderfahrt");
  const tpl = VIP_JOBS.find(t => t.org === o.shipper);
  phoneMsg({ from: o.shipper, kind: "good", title: late ? "Angekommen – wenn auch spät" : "Mit großem Dank",
    body: late ? "Angekommen – leider zu spät. Das merken wir uns."
      : `Pünktlich angekommen: ${tpl ? tpl.item : "die Sendung"}. Herzlichen Dank! – ${tpl ? tpl.sender : "die Geschäftsleitung"}` });
}

/* ------------------------------ Einladung (Ansicht) ------------------------------ */
function inviteEl() {
  let el = document.getElementById("invite");
  if (!el) { el = document.createElement("div"); el.id = "invite"; document.body.appendChild(el); }
  return el;
}
function openInvite() {
  const v = vipState(); if (!v.open) return;
  const o = v.open.o, tpl = VIP_JOBS[v.open.tpl];
  const el = inviteEl();
  el.className = "on";
  document.body.classList.add("invite-open");
  const addr = a => esc(addrText(a, true));
  el.innerHTML = `<div class="iv-stage">
    <div class="iv-env" id="ivEnv">
      <div class="iv-back"></div>
      <div class="iv-card" id="ivCard">
        <div class="iv-in">
          <div class="iv-lh"><b>${esc(tpl.org)}</b><small>${esc(tpl.dept)}</small></div>
          <div class="iv-rule"></div>
          <div class="iv-date">${esc(N[o.from].name.split(" (")[0])}, ${stamp(S.time)} Uhr</div>
          <h2 class="iv-h">Einladung zur Sonderfahrt</h2>
          <p class="iv-sal">Sehr geehrte Damen und Herren von ${esc(S.player.company)},</p>
          <p class="iv-tx">${esc(tpl.story)}</p>
          <p class="iv-tx">Wir zählen auf Sie.</p>
          <dl class="iv-dl">
            <dt>Gegenstand</dt><dd>${esc(tpl.item)} · ${kgf(o.weight)}</dd>
            <dt>Abholung</dt><dd>${addr(oPick(o))}</dd>
            <dt>Zustellung</dt><dd>${addr(oDrop(o))}</dd>
            <dt>Frist</dt><dd>${stamp(o.deadline)} Uhr <small>(${dur(o.deadline - S.time)})</small></dd>
          </dl>
          <div class="iv-fee"><small>Honorar</small><b>${money(o.pay)}</b></div>
          <p class="iv-rsvp">Zusage bis ${clock(v.open.rsvp)} Uhr.<br>Chefsache: Sie disponieren persönlich.</p>
          <div class="iv-sig"><span class="iv-hand">${esc(tpl.sender)}</span><small>${esc(tpl.sender)} · ${esc(tpl.role)}</small>
            <div class="iv-seal"><span>${esc(tpl.mono)}</span></div></div>
          <div class="iv-btns">
            <button class="iv-yes" id="ivYes">Gern zusagen</button>
            <button class="iv-no" id="ivNo">Höflich absagen</button>
          </div>
        </div>
      </div>
      <div class="iv-front"><div class="iv-addr"><small>Persönlich · per Boten</small><b>${esc(S.player.company)}</b><i>Geschäftsführung</i></div></div>
      <div class="iv-flap"></div><div class="iv-wax"><span>${esc(tpl.mono)}</span></div>
    </div>
    <button class="iv-later" id="ivLater">Später – liegt im Diensthandy</button>
  </div>`;
  const env = $("#ivEnv");
  const openIt = () => { env.classList.add("open"); setTimeout(() => env.classList.add("out"), 650); };
  env.onclick = e => { if (!env.classList.contains("open")) openIt(); };
  setTimeout(openIt, 900);
  $("#ivYes").onclick = e => { e.stopPropagation(); const m = v.open && S.phone.msgs.find(x => x.id === v.open.msg); if (m) decide(m.id, 0); };
  $("#ivNo").onclick = e => { e.stopPropagation(); const m = v.open && S.phone.msgs.find(x => x.id === v.open.msg); if (m) decide(m.id, 1); };
  $("#ivLater").onclick = () => closeInvite();
}
function closeInvite() {
  const el = document.getElementById("invite"); if (!el) return;
  el.className = ""; el.innerHTML = "";
  document.body.classList.remove("invite-open");
}
function inviteMsgHTML(m) {
  const v = vipState(), live = v.open && v.open.msg === m.id && !m.dec.done;
  return `<div class="pmsg invite${m.handled ? " done" : ""}">
    <div class="pmsg-head"><span class="pmsg-from">✉️ ${esc(m.from)}</span><span class="pmsg-time">${stamp(m.time)} ${phoneTTL(m)}</span></div>
    <b>${esc(m.title)}</b><p>${esc(m.body)}</p>
    ${live ? `<div class="dchoices"><button class="dchoice gold" data-openinvite="1"><b>✉️ Einladung öffnen</b><small>Antwort bis ${clock(v.open.rsvp)}</small></button></div>`
      : `<div class="pmsg-note ok">✔ ${esc(m.result || "erledigt")}</div>`}
  </div>`;
}

/* ------------------------------- Konkurrenz ------------------------------- */
const RIVALS = [
  { id: "blitz", name: "Blitzfracht", icon: "⚡", col: "#e2465f", st: 1 },
  { id: "rabe", name: "Rabe & Söhne", icon: "🪶", col: "#44546a", st: 1 },
  { id: "nord", name: "Nordstern Cargo", icon: "🧭", col: "#1667c4", st: 3 }
];
function rivalById(id) { if (typeof corpSyncRivals === "function") corpSyncRivals(); return RIVALS.find(r => r.id === id); }
/* v245: Beziehungsstufe des Kunden (kunden.js) – 0 Neukunde … 3 Bevorzugter Logistikpartner */
function custTierOf(o) { return typeof custTier === "function" && typeof custOf === "function" && !o.series ? custTier(custOf(o.shipper)) : 0; }
const negoBig = o => o.pay / (420 * stageK() * (S.stage >= 4 ? 4 : 1));
function rivalOnSpawn(o) {
  if (o.vip || o.contract || o.mission || o.jewel) return;
  if (calm()) return;
  const rep = repOf(regionOf(o)), tier = custTierOf(o);
  /* v245: Bevorzugte Logistikpartner schreiben seltener aus */
  const p = (0.22 + 0.04 * S.stage) * (1.25 - rep / 100 * 0.5) * (tier >= 3 ? 0.5 : 1);
  if (typeof corpSyncRivals === "function") corpSyncRivals();
  const pool = RIVALS.filter(x => x.st <= S.stage && !(S.corp && S.corp.owned && S.corp.owned[x.id]));
  /* v170: Konzerne (Wellen nach langer Marktführung) greifen öfter und schneller zu */
  const nBig = pool.filter(x => x.wave).length;
  if (pool.length && Math.random() < Math.min(0.8, p * (1 + 0.12 * nBig))) {
    const wt = x => x.wave ? 1.5 + 0.5 * x.wave : 1;
    let u = Math.random() * pool.reduce((a, x) => a + wt(x), 0), r = pool[0];
    for (const x of pool) { u -= wt(x); if (u <= 0) { r = x; break; } }
    /* Angebotsfrist: bis dahin entscheidet der Kunde – Stammkunden warten länger auf die Zusage */
    o.rival = { id: r.id, at: Math.round(S.time + rnd(45, 260) / (r.wave ? 1.25 + 0.1 * r.wave : 1) * (1 + 0.25 * Math.max(0, tier - 1))) };
  }
  /* Großaufträge: der Kunde lässt mit sich reden – Stammkunden auch bei kleineren Aufträgen */
  const big = negoBig(o), h = typeof storyHash === "function" ? storyHash(o.id) % 10 : Math.floor(Math.random() * 10);
  if ((big >= 1 && h < 6) || (tier >= 2 && big >= 0.5 && h < 8)) o.nego = { ceil: negoModel(o).ceil, m: 1, done: false };
}
function shareState() { if (!S.share) S.share = { me: 0 }; return S.share; }
let rivalToast = { n: 0, at: 0, who: null };
function tickRivals() {
  if (typeof corpTick === "function") corpTick();          /* v170: Konzerne nachladen, Zeitungs-Show sobald Platz ist */
  const sh = shareState();
  const lost = S.orders.filter(o => o.rival && S.time >= o.rival.at);
  if (!lost.length) return;
  S.orders = S.orders.filter(o => !lost.includes(o));
  lost.forEach(o => { sh[o.rival.id] = (sh[o.rival.id] || 0) + 1; });
  /* v252: keine Einblendung mehr – die Vergabe erscheint als Meldung in der Zeitung im Diensthandy */
  lost.forEach(o => { try { pressRivalWin(o, rivalById(o.rival.id)); } catch (e) { console.warn("Zeitung", e); } });
  renderDirty = true;
}
/* Ausschreibung: es gibt tatsächlich ein Konkurrenzangebot – ohne Zusage bis zur Vergabe geht der Auftrag an den Mitbewerber */
function rivalBadgeHTML(o) {
  if (!o.rival) return "";
  const r = rivalById(o.rival.id), left = o.rival.at - S.time;
  return `<div class="rivalrow${left < 30 ? " hot" : ""}" style="--rc:${r.col}"><b>Ausschreibung</b> · Vergabe in ${dur(Math.max(1, left))} · Mitbewerber: ${r.icon} ${esc(r.name)}</div>`;
}

/* ------------------------------ Verhandeln ------------------------------ */
/* v245: Spielraum aus nachvollziehbaren Faktoren statt Zufall. Nur ein kleiner, unbekannter Rest (±2 %) bleibt – das interne
   Budget des Kunden. Die angezeigte Einschätzung wird mit der Beziehungsstufe genauer. */
function negoModel(o) {
  const tier = custTierOf(o), c = typeof custOf === "function" ? custOf(o.shipper) : null, cg = CARGO[o.cargo] || {};
  const f = [["Marktüblicher Spielraum", 0.06]];
  if (o.cargo === "express") f.push(["Dringlichkeit (Express)", 0.06]);
  else if (o.refTime && o.deadline - (o.created || S.time) < o.refTime * 1.4) f.push(["Enges Zeitfenster", 0.04]);
  const big = negoBig(o);
  if (big >= 3) f.push(["Großes Auftragsvolumen", 0.04]); else if (big >= 1.5) f.push(["Größeres Auftragsvolumen", 0.02]);
  if ((o.refDist || 0) > 800) f.push(["Lange Strecke", 0.02]);
  if (["kuehl", "adr", "sperrig"].includes(o.cargo)) f.push(["Spezialladung (" + (cg.name || o.cargo) + ")", 0.03]);
  if (tier >= 2) f.push([typeof CUST_NAME !== "undefined" ? CUST_NAME[tier] : "Stammkunde", 0.03 * (tier - 1)]);
  if (c && c.n >= 2 && c.late > c.n * 0.3) f.push(["Verspätungen in der Vergangenheit", -0.04]);
  if (o.rival) { const r = rivalById(o.rival.id); f.push(["Konkurrenzangebot" + (r ? " von " + r.name : ""), -0.05]); }
  const sum = f.reduce((a, x) => a + x[1], 0);
  const noise = typeof storyHash === "function" ? ((storyHash(o.id + "n") % 41) - 20) / 1000 : 0;
  const ceil = clamp(1 + sum + noise, 1.02, 1.32), band = [0.05, 0.04, 0.025, 0.02][tier];
  return { f, ceil, lo: clamp(1 + sum - band, 1, 1.4), hi: clamp(1 + sum + band, 1.01, 1.4), tier };
}
let negoCost = null;
function negoRisk(o, ask, M) {
  if (ask <= M.lo + 0.001) return ["ok", "Sicher – liegt im üblichen Rahmen"];
  if (ask <= (M.lo + M.hi) / 2 + 0.001) return ["mid", "Gute Chancen"];
  if (ask <= M.hi + 0.001) return ["warn", "Riskant – Gegenangebot oder Ablehnung möglich"];
  return ["bad", o.rival ? "Sehr riskant – der Kunde kann an " + rivalById(o.rival.id).name + " vergeben" : "Sehr riskant – der Kunde lehnt wahrscheinlich ab"];
}
function negoMarginHTML(o, ask) {
  if (negoCost == null) return "";
  const pr = Math.round(o.pay * ask) - negoCost;
  return `Deckungsbeitrag bei diesem Preis: <b class="${pr >= 0 ? "good" : "bad"}">${money(pr)}</b> · Kosten ${money(negoCost)}`;
}
function negoHTML(o, cost) {
  if (!o.nego) return "";
  const n = o.nego;
  if (n.done) return `<div class="nego done">🤝 ${esc(n.result || "Verhandelt")}</div>`;
  const M = negoModel(o);
  if (!n.m) { n.ceil = M.ceil; n.m = 1; }      /* Aufträge aus älteren Ständen: Spielraum nach dem neuen Modell */
  negoCost = cost == null ? null : cost;
  const pct = n.ask || Math.round(M.lo * 100), rk = negoRisk(o, pct / 100, M);
  const pc = x => (x >= 0 ? "+" : "−") + Math.abs(Math.round(x * 100)) + " %";
  return `<div class="nego">
    <div class="nego-h">Preis verhandeln<small>${o.rival ? "Ausschreibung mit Konkurrenzangebot – zu viel Aufschlag kann den Auftrag kosten" : "Der Kunde hat Spielraum beim Preis"}</small></div>
    <div class="nego-f">${M.f.map(([t, v]) => `<span class="${v < 0 ? "neg" : ""}">${esc(t)} <b>${pc(v)}</b></span>`).join("")}</div>
    <div class="nego-est">Einschätzung: Aufschlag von etwa <b>${pc(M.lo - 1)}</b> bis <b>${pc(M.hi - 1)}</b> realistisch${M.tier >= 2 ? " (gute Kenntnis des Kunden)" : M.tier === 0 ? " (neuer Kunde – unsichere Einschätzung)" : ""}</div>
    <div class="nego-row">
      <input type="range" min="100" max="140" step="1" value="${pct}" id="negoR" aria-label="Aufschlag in Prozent">
      <div class="nego-v"><b id="negoPay">${money(o.pay * pct / 100)}</b><small id="negoPct">+${pct - 100} %</small></div>
    </div>
    <div class="nego-risk ${rk[0]}" id="negoRisk">${esc(rk[1])}</div>
    <div class="nego-mg" id="negoMg">${negoMarginHTML(o, pct / 100)}</div>
    <div class="nego-chat" id="negoChat">${(n.chat || []).map(c => `<div class="bub ${c.me ? "out" : "in"}">${esc(c.t)}</div>`).join("")}</div>
    <div class="nego-btns" id="negoBtns">${n.counter
      ? `<button class="btn tiny" id="negoTake">${money(n.counter)} annehmen</button><button class="btn tiny ghost" id="negoDrop">Ablehnen</button>`
      : `<button class="btn tiny" id="negoGo">Angebot senden</button>`}</div>
  </div>`;
}
function bindNego(o) {
  const r = $("#negoR"); if (!r || !o.nego) return;
  const n = o.nego, M = negoModel(o);
  r.oninput = () => {
    n.ask = +r.value; $("#negoPay").textContent = money(o.pay * n.ask / 100); $("#negoPct").textContent = "+" + (n.ask - 100) + " %";
    const rk = negoRisk(o, n.ask / 100, M), el = $("#negoRisk"); if (el) { el.className = "nego-risk " + rk[0]; el.textContent = rk[1]; }
    const mg = $("#negoMg"); if (mg) mg.innerHTML = negoMarginHTML(o, n.ask / 100);
  };
  const go = $("#negoGo");
  if (go) go.onclick = () => {
    const ask = (n.ask || Math.round(M.lo * 100)) / 100;
    n.chat = (n.chat || []).concat({ me: true, t: "Wir übernehmen den Transport für " + money(o.pay * ask) + "." });
    go.disabled = true;
    $("#negoChat").innerHTML += `<div class="bub in typing"><i></i><i></i><i></i></div>`;
    setTimeout(() => {
      if (!planState || planState.order !== o) return;
      if (ask <= n.ceil) {
        o.pay = Math.round(o.pay * ask); n.done = true; n.result = "Einigung bei " + money(o.pay);
        n.chat.push({ me: false, t: "Einverstanden. Wir freuen uns auf die Zusammenarbeit." });
        extraStats().nego++;
        toast("🤝 Einigung: " + money(o.pay), "ok");
      } else if (ask <= n.ceil + 0.06) {
        n.counter = Math.round(o.pay * n.ceil / 10) * 10;
        n.chat.push({ me: false, t: "Das liegt über unserem Budget. Wir können " + money(n.counter) + " anbieten – das ist unser letztes Angebot." });
      } else if (o.rival) {
        n.chat.push({ me: false, t: "Das liegt deutlich über dem Angebot von " + rivalById(o.rival.id).name + ". Wir vergeben den Auftrag dorthin." });
        n.done = true; n.result = "Kunde hat an die Konkurrenz vergeben";
        const rv = o.rival.id;
        setTimeout(() => {
          closeModal();
          S.orders = S.orders.filter(x => x !== o);
          const sh = shareState(); sh[rv] = (sh[rv] || 0) + 1;
          toast("🤝 Preis zu hoch angesetzt – „" + o.shipper + "“ hat an " + rivalById(rv).name + " vergeben.", "bad");
          render();
        }, 1400);
      } else {
        n.chat.push({ me: false, t: "Das liegt deutlich über unserem Budget – es bleibt beim ausgeschriebenen Preis." });
        n.done = true; n.result = "Kein Aufschlag – es bleibt beim ausgeschriebenen Preis";
      }
      renderPlanner(false);
    }, 900);
  };
  const take = $("#negoTake");
  if (take) take.onclick = () => {
    o.pay = n.counter; n.done = true; n.result = "Einigung bei " + money(o.pay); n.counter = 0;
    n.chat.push({ me: true, t: "Einverstanden." }); extraStats().nego++;
    renderPlanner(false);
  };
  const drop = $("#negoDrop");
  if (drop) drop.onclick = () => {
    n.done = true; n.counter = 0; n.result = "Gegenangebot abgelehnt – ausgeschriebener Preis";
    n.chat.push({ me: true, t: "Dann bleiben wir beim ausgeschriebenen Preis." });
    renderPlanner(false);
  };
}

/* ---------------------- Welt-Reiter: Marktanteil ---------------------- */
function rivalsHTML() {
  const sh = shareState();
  const rows = [{ name: S.player ? S.player.company : "Du", icon: "🏠", col: "#19b8c9", n: sh.me || 0 }]
    .concat(RIVALS.filter(r => r.st <= S.stage && !(S.corp && S.corp.owned && S.corp.owned[r.id])).map(r => ({ name: r.name, icon: r.icon, col: r.col, n: sh[r.id] || 0, wave: r.wave })));
  const tot = rows.reduce((a, r) => a + r.n, 0) || 1;
  return `<div class="card eco">
    <div class="card-top"><div class="vname">⚔️ Konkurrenz<small>Jede gelieferte Tour zählt für dich, jeder weggeschnappte Auftrag für die Konkurrenz; alte Werte verblassen täglich um 20 %. Unter 30 % kommen Kaufangebote. Anteil der letzten Tage:</small></div></div>
    ${typeof corpLeadHTML === "function" ? corpLeadHTML() : ""}
    ${typeof corpStakeHTML === "function" ? corpStakeHTML() : ""}
    <div class="share">${rows.map(r => `<div class="share-row${r.wave ? " wave" : ""}"><span>${r.icon} ${esc(r.name)}${r.wave ? `<em>Konzern</em>` : ""}</span>
      <i style="--w:${Math.round(r.n / tot * 100)}%;--c:${r.col}"></i><b>${Math.round(r.n / tot * 100)} %</b></div>`).join("")}</div>
  </div>`;
}
function shareDay() {
  const sh = shareState();
  Object.keys(sh).forEach(k => { sh[k] = Math.round(sh[k] * 0.8 * 10) / 10; });
  if (typeof corpDay === "function") try { corpDay(); } catch (e) { console.warn("corpDay", e); }   /* v170: Marktführung zählen, Konzern-Wellen */
}

/* --------------------------- Auftragskarten --------------------------- */
function orderExtraHTML(o) {
  let h = "";
  if (o.contract) {
    const c = contracts().find(x => x.id === o.contract);
    h += `<div class="xrow contract">📑 Rahmenvertrag${c ? " · Tag " + c.day + " von " + c.days + " · Ausfall kostet " + money(c.penalty) : ""}</div>`;
  }
  if (o.mission) h += `<div class="xrow mission">🧭 Teil einer Mission – Frist ${stamp(o.deadline)}</div>`;
  if (o.nego && !o.nego.done) h += `<div class="xrow nego">🤝 Preis verhandelbar · dein Angebot gibst du im Planer ab</div>`;
  if (o.nego && o.nego.done && o.nego.result) h += `<div class="xrow nego done">🤝 ${esc(o.nego.result)}</div>`;
  return h + rivalBadgeHTML(o);
}
function vipCardHTML(o, pv) {
  const cg = CARGO[o.cargo];
  return `<div class="card order vipcard${flashOn(o.id) ? " flash" : ""}" data-order="${o.id}">
    <div class="vip-ribbon">✉️ Sonderfahrt · Chefsache</div>
    <div class="card-top">
      <span class="badge" style="--c:#f1d488">${cg.icon} ${cg.name}</span>
      <span class="pay gold">${money(o.pay)}</span>
    </div>
    <div class="ship">${esc(o.shipper)}</div>
    <div class="desc">${esc(o.desc)}</div>
    <div class="meta addr"><span>📍 ${esc(oPick(o).t)} <small>${esc(N[o.from].short)}</small></span><span>🏁 ${esc(oDrop(o).t)} <small>${esc(oDrop(o).a || N[o.to].short)}</small></span></div>
    <div class="meta small"><span>⚖️ ${kgf(o.weight)}</span><span>📏 ${kmf(o.refDist)}</span>
      <span class="${o.deadline - S.time < 90 ? "bad" : ""}">⏳ bis ${clock(o.deadline)} · noch ${dur(o.deadline - S.time)}</span></div>
    <div class="xrow vip">Nur du disponierst – die Dispo fasst sie nicht an.</div>
    ${pv}
  </div>`;
}

/* ------------------- v252: Wirtschaftsmeldungen (Zeitung im Diensthandy) ------------------- */
const PRESS_MAX = 40;
function pressState() { if (!S.press) S.press = { items: [], unread: 0 }; return S.press; }
function pressAdd(a) {
  const P = pressState();
  P.items.unshift(Object.assign({ id: "pr" + S.time + "_" + Math.floor(Math.random() * 1e6), time: S.time }, a));
  if (P.items.length > PRESS_MAX) P.items.length = PRESS_MAX;
  P.unread = Math.min(99, (P.unread || 0) + 1);
  if (typeof renderPhoneBadge === "function") renderPhoneBadge(false);
  if (typeof phoneOpen === "function" && phoneOpen() && typeof renderPhone === "function") renderPhone();
}
/* Vergabe an einen Mitbewerber: sachlich, nur mit Daten aus der Ausschreibung */
function pressRivalWin(o, r) {
  const cg = CARGO[o.cargo], me = S.player && S.player.company ? S.player.company : "Ihre Spedition";
  const from = N[o.from] ? N[o.from].short : "", to = (oDrop(o).a || (N[o.to] ? N[o.to].short : ""));
  const what = (cg ? cg.name : "Fracht") + ", " + kgf(o.weight);
  pressAdd({
    kind: "tender", col: r.col,
    head: o.shipper + " vergibt Transportauftrag an " + r.name,
    lead: from + " – " + to,
    body: o.shipper + " hat den ausgeschriebenen Transport von " + from + " nach " + to + " (" + what + ") an " + r.name +
      " vergeben. Der Auftragswert lag laut Ausschreibung bei " + money(o.pay) + ". " +
      me + " hatte bis zum Ablauf der Angebotsfrist keine Zusage abgegeben."
  });
}
function pressHTML() {
  const P = pressState();
  const items = P.items.filter(a => S.time - a.time < 1440 * 7);
  const head = `<div class="np-mast"><div class="np-name">Logistik-Kurier</div><div class="np-sub">Wirtschaft · Transport · Handel <span>Tag ${Math.floor(S.time / 1440) + 1}</span></div></div>`;
  if (!items.length) return head + `<div class="empty">Keine aktuellen Meldungen.</div>`;
  return head + items.map(a => `<article class="np-art" style="--rc:${a.col || "#59616d"}">
      <div class="np-meta"><span class="np-res">${a.kind === "tender" ? "Ausschreibungen" : "Wirtschaft"}</span><span>${esc(stamp(a.time))}</span></div>
      <h3 class="np-head">${esc(a.head)}</h3>
      ${a.lead ? `<div class="np-lead">${esc(a.lead)}</div>` : ""}
      <p class="np-body">${esc(a.body)}</p>
    </article>`).join("");
}
