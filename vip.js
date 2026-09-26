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
    story: "In der Notaufnahme in Marzahn wird nach einem schweren Unfall jede Minute gezählt. Unsere eigene Fahrbereitschaft ist ausgelastet – wir vertrauen auf Ihre Diskretion und Ihr Tempo." },
  { st: 1, org: "Konzerthaus am Lindenplatz", dept: "Intendanz", mono: "KL",
    sender: "Dr. Clara Weinberg", role: "Intendantin",
    from: "b-char", to: "b-mitte", item: "eine Stradivari-Violine (Leihgabe)", cargo: "schmuck", kg: [2, 4],
    story: "Unser Solist gibt heute Abend sein Debüt in Mitte. Das Instrument liegt noch in der Werkstatt des Geigenbauers in Charlottenburg – versichert, unersetzlich und ab 19 Uhr auf der Bühne erwartet." },
  { st: 1, org: "Internationale Filmtage Berlin", dept: "Festivalleitung", mono: "IF",
    sender: "Jonas Vogt", role: "Leiter Filmlogistik",
    from: "b-ber", to: "b-mitte", item: "die Premierenkopie des Eröffnungsfilms", cargo: "express", kg: [14, 24],
    story: "Die Kopie ist eben am BER gelandet, der rote Teppich liegt schon. Ohne Film keine Weltpremiere – und 1.800 Gäste im Saal." },
  { st: 1, org: "Botschaft des Königreichs Nordland", dept: "Kanzlei", mono: "KN",
    sender: "Ingrid Sørensen", role: "Gesandtin",
    from: "b-tempel", to: "b-mitte", item: "versiegelte Dokumentenmappe", cargo: "schmuck", kg: [1, 2],
    story: "Die Mappe muss vor der Unterzeichnung heute Nachmittag in der Botschaft sein. Kurier des Vertrauens, keine Umwege, keine Fragen." },
  { st: 2, org: "Karosseriewerk Havelland", dept: "Werksleitung", mono: "KH",
    sender: "Markus Brandt", role: "Werkleiter",
    from: "leipzig", to: "potsdam", item: "ein Ersatzgetriebe für die Fertigungsstraße", cargo: "express", kg: [180, 320],
    story: "Das Band steht still – jede Stunde kostet uns ein Vielfaches Ihres Honorars. Das Teil liegt beim Zulieferer in Leipzig bereit." },
  { st: 2, org: "Opernhaus an der Elbe", dept: "Technische Direktion", mono: "OE",
    sender: "Friederike Lindner", role: "Technische Direktorin",
    from: "b-westh", to: "dresden", item: "das Bühnenbild der Premiere", cargo: "sperrig", kg: [2400, 4200],
    story: "Unser Bühnenbild wurde in Berlin gefertigt, der Vorhang hebt sich morgen Abend. Wir bitten um Ihre Erfahrung im Umgang mit empfindlicher Übergröße." },
  { st: 2, org: "Klinikum am Auensee Leipzig", dept: "Zentrallabor", mono: "KA",
    sender: "Prof. Dr. Yusuf Sahin", role: "Chefarzt Labormedizin",
    from: "halle", to: "leipzig", item: "Proben einer klinischen Studie", cargo: "kuehl", kg: [20, 40],
    story: "Die Kühlkette darf keine Sekunde reißen. Die Ergebnisse entscheiden über die Zulassung eines Medikaments." },
  { st: 3, org: "Rennstall Grüne Hölle", dept: "Teamleitung", mono: "GH",
    sender: "Bastian Kruse", role: "Teamchef",
    from: "stuttgart", to: "koeln", item: "ein Ersatzmotor fürs Qualifying", cargo: "express", kg: [160, 240],
    story: "Motorschaden im Training. Morgen früh ist Qualifying – der neue Motor steht beim Werk in Stuttgart." },
  { st: 3, org: "Industrieschau Hannover", dept: "Ausstellerservice", mono: "IH",
    sender: "Nele Hansen", role: "Leiterin Ausstellerservice",
    from: "muenchen", to: "hannover", item: "der Prototyp eines Messestands", cargo: "pal", kg: [1800, 3600],
    story: "Ein Hauptaussteller steht morgen früh ohne Stand da. Wir öffnen um neun – der Vorstand kommt um zehn." },
  { st: 3, org: "Konzerthalle am Elbkai", dept: "Künstlerisches Betriebsbüro", mono: "KE",
    sender: "Dr. Merle Engel", role: "Betriebsdirektorin",
    from: "frankfurt", to: "hamburg", item: "ein Konzertflügel", cargo: "sperrig", kg: [480, 520],
    story: "Der Flügel unseres Gastsolisten muss vor der Generalprobe gestimmt im Großen Saal stehen." },
  { st: 4, org: "Istituto Vaccinale di Milano", dept: "Direzione Logistica", mono: "IV",
    sender: "Dott.ssa Elena Rossi", role: "Leiterin Distribution",
    from: "fra", to: "milano", item: "Impfstoff für eine Notfallkampagne", cargo: "kuehl", kg: [900, 1600],
    story: "Eine Kampagne startet übermorgen früh. Die Chargen sind in Frankfurt freigegeben und warten bei plus fünf Grad." },
  { st: 4, org: "Maison de Couture Paris", dept: "Atelier", mono: "MC",
    sender: "Camille Dubois", role: "Directrice de production",
    from: "b-mitte", to: "paris", item: "die Kollektion für die Modenschau", cargo: "express", kg: [260, 420],
    story: "Die Show beginnt morgen um 20 Uhr, die Kollektion hängt noch im Berliner Atelier. Knitterfrei, bitte." },
  { st: 5, org: "Galerie Whitmore, New York", dept: "Kunsttransport", mono: "GW",
    sender: "Eleanor Whitmore", role: "Galeristin",
    from: "lhr", to: "nyc", item: "ein Gemälde für die Abendauktion", cargo: "schmuck", kg: [60, 120],
    story: "Das Werk muss heute noch nach Manhattan. Versicherungswert achtstellig – wir erwarten allerhöchste Sorgfalt." },
  { st: 5, org: "Raumfahrtzentrum Shanghai", dept: "Integration", mono: "RS",
    sender: "Dr. Wei Chen", role: "Programmleiter",
    from: "fra", to: "pvg", item: "ein Satellitenbauteil", cargo: "express", kg: [400, 700],
    story: "Das Startfenster schließt sich in wenigen Tagen. Das Bauteil ist das letzte fehlende Stück." }
];
const VIP_MIN = [1400, 4800, 16000, 65000, 190000, 420000];

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
    pay, deadline: Math.round(S.time + fast.time * 1.35 + fast.legs.length * 60 + 40),
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
    if (m && m.dec && !m.dec.done) { m.dec.done = true; m.handled = true; m.result = "Frist verstrichen – die Fahrt ging an jemand anderen."; }
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
  setTimeout(() => openInvite(), 400);
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
    body: late ? "Die Lieferung ist angekommen, leider nach der vereinbarten Zeit. Wir werden das bei künftigen Anfragen berücksichtigen."
      : `Sehr geehrte Damen und Herren, ${tpl ? tpl.item : "die Sendung"} ist rechtzeitig eingetroffen. Wir danken Ihnen für Ihren außergewöhnlichen Einsatz. Hochachtungsvoll, ${tpl ? tpl.sender : "die Geschäftsleitung"}` });
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
          <p class="iv-tx">Wir würden uns freuen, Ihnen diese Fahrt anvertrauen zu dürfen.</p>
          <dl class="iv-dl">
            <dt>Gegenstand</dt><dd>${esc(tpl.item)} · ${kgf(o.weight)}</dd>
            <dt>Abholung</dt><dd>${addr(oPick(o))}</dd>
            <dt>Zustellung</dt><dd>${addr(oDrop(o))}</dd>
            <dt>Frist</dt><dd>${stamp(o.deadline)} Uhr <small>(${dur(o.deadline - S.time)})</small></dd>
          </dl>
          <div class="iv-fee"><small>Honorar</small><b>${money(o.pay)}</b></div>
          <p class="iv-rsvp">Um Zusage wird gebeten bis ${clock(v.open.rsvp)} Uhr.<br>Chefsache: Diese Fahrt disponieren Sie persönlich.</p>
          <div class="iv-sig"><span class="iv-hand">${esc(tpl.sender)}</span><small>${esc(tpl.sender)} · ${esc(tpl.role)}</small>
            <div class="iv-seal"><span>${esc(tpl.mono)}</span></div></div>
          <div class="iv-btns">
            <button class="iv-yes" id="ivYes">Mit Vergnügen zusagen</button>
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
function rivalById(id) { return RIVALS.find(r => r.id === id); }
function rivalOnSpawn(o) {
  if (o.vip || o.contract || o.mission || o.jewel) return;
  if (calm()) return;
  const rep = repOf(regionOf(o));
  const p = (0.22 + 0.04 * S.stage) * (1.25 - rep / 100 * 0.5);
  if (Math.random() < p) {
    const r = pick(RIVALS.filter(x => x.st <= S.stage));
    o.rival = { id: r.id, at: Math.round(S.time + rnd(45, 260)) };
  }
  /* Großaufträge: der Kunde lässt mit sich reden */
  const big = o.pay >= 420 * stageK() * (S.stage >= 4 ? 4 : 1);
  if (big && Math.random() < 0.6) o.nego = { ceil: rnd(1.05, 1.38) * (o.rival ? 0.95 : 1), done: false };
}
function shareState() { if (!S.share) S.share = { me: 0 }; return S.share; }
let rivalToast = { n: 0, at: 0, who: null };
function tickRivals() {
  const sh = shareState();
  const lost = S.orders.filter(o => o.rival && S.time >= o.rival.at);
  if (!lost.length) return;
  S.orders = S.orders.filter(o => !lost.includes(o));
  lost.forEach(o => { sh[o.rival.id] = (sh[o.rival.id] || 0) + 1; });
  if (lively()) {
    const r = rivalById(lost[0].rival.id);
    toast(r.icon + " " + r.name + " hat „" + lost[0].shipper + "“" + (lost.length > 1 ? " und " + (lost.length - 1) + " weitere" : "") + " geschnappt.", "warn", true);
  }
  renderDirty = true;
}
function rivalBadgeHTML(o) {
  if (!o.rival) return "";
  const r = rivalById(o.rival.id), left = o.rival.at - S.time;
  return `<div class="rivalrow${left < 30 ? " hot" : ""}" style="--rc:${r.col}">${r.icon} <b>${esc(r.name)}</b> greift in ${dur(Math.max(1, left))} zu</div>`;
}

/* ------------------------------ Verhandeln ------------------------------ */
function negoHTML(o) {
  if (!o.nego) return "";
  const n = o.nego;
  if (n.done) return `<div class="nego done">🤝 ${esc(n.result || "Verhandelt")}</div>`;
  const pct = n.ask || 115;
  return `<div class="nego">
    <div class="nego-h">🤝 Preis verhandeln<small>Großauftrag – der Kunde hat Spielraum${o.rival ? ", aber " + esc(rivalById(o.rival.id).name) + " bietet mit" : ""}</small></div>
    <div class="nego-row">
      <input type="range" min="100" max="150" step="1" value="${pct}" id="negoR" aria-label="Aufschlag in Prozent">
      <div class="nego-v"><b id="negoPay">${money(o.pay * pct / 100)}</b><small id="negoPct">+${pct - 100} %</small></div>
    </div>
    <div class="nego-chat" id="negoChat">${(n.chat || []).map(c => `<div class="bub ${c.me ? "out" : "in"}">${esc(c.t)}</div>`).join("")}</div>
    <div class="nego-btns" id="negoBtns">${n.counter
      ? `<button class="btn tiny" id="negoTake">${money(n.counter)} annehmen</button><button class="btn tiny ghost" id="negoDrop">Ablehnen</button>`
      : `<button class="btn tiny" id="negoGo">Angebot senden</button>`}</div>
  </div>`;
}
function bindNego(o) {
  const r = $("#negoR"); if (!r || !o.nego) return;
  const n = o.nego;
  r.oninput = () => { n.ask = +r.value; $("#negoPay").textContent = money(o.pay * n.ask / 100); $("#negoPct").textContent = "+" + (n.ask - 100) + " %"; };
  const go = $("#negoGo");
  if (go) go.onclick = () => {
    const ask = (n.ask || 115) / 100;
    n.chat = (n.chat || []).concat({ me: true, t: "Wir fahren das für " + money(o.pay * ask) + "." });
    go.disabled = true;
    $("#negoChat").innerHTML += `<div class="bub in typing"><i></i><i></i><i></i></div>`;
    setTimeout(() => {
      if (!planState || planState.order !== o) return;
      if (ask <= n.ceil) {
        o.pay = Math.round(o.pay * ask); n.done = true; n.result = "Einigung bei " + money(o.pay);
        n.chat.push({ me: false, t: "Einverstanden. Wir freuen uns auf die Zusammenarbeit." });
        extraStats().nego++;
        toast("🤝 Einigung: " + money(o.pay), "ok");
      } else if (ask <= n.ceil * 1.12) {
        n.counter = Math.round(o.pay * n.ceil / 10) * 10;
        n.chat.push({ me: false, t: "So weit können wir nicht gehen. " + money(n.counter) + " – das ist unser letztes Wort." });
      } else if (o.rival) {
        n.chat.push({ me: false, t: "Das ist uns zu viel. Dann nehmen wir " + rivalById(o.rival.id).name + "." });
        n.done = true; n.result = "Kunde ging zur Konkurrenz";
        const rv = o.rival.id;
        setTimeout(() => {
          closeModal();
          S.orders = S.orders.filter(x => x !== o);
          const sh = shareState(); sh[rv] = (sh[rv] || 0) + 1;
          toast("🤝 Zu hoch gepokert – " + rivalById(rv).name + " fährt „" + o.shipper + "“.", "bad");
          render();
        }, 1400);
      } else {
        n.chat.push({ me: false, t: "Das liegt deutlich über unserem Budget. Es bleibt beim ausgeschriebenen Preis." });
        n.done = true; n.result = "Kein Aufschlag – es bleibt beim Preis";
      }
      renderPlanner(false);
    }, 900);
  };
  const take = $("#negoTake");
  if (take) take.onclick = () => {
    o.pay = n.counter; n.done = true; n.result = "Einigung bei " + money(o.pay); n.counter = 0;
    n.chat.push({ me: true, t: "Abgemacht." }); extraStats().nego++;
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
    .concat(RIVALS.filter(r => r.st <= S.stage).map(r => ({ name: r.name, icon: r.icon, col: r.col, n: sh[r.id] || 0 })));
  const tot = rows.reduce((a, r) => a + r.n, 0) || 1;
  return `<div class="card eco">
    <div class="card-top"><div class="vname">⚔️ Konkurrenz<small>Wer zu lange wartet, dem schnappen andere Speditionen die Aufträge weg. Anteil der letzten Tage:</small></div></div>
    <div class="share">${rows.map(r => `<div class="share-row"><span>${r.icon} ${esc(r.name)}</span>
      <i style="--w:${Math.round(r.n / tot * 100)}%;--c:${r.col}"></i><b>${Math.round(r.n / tot * 100)} %</b></div>`).join("")}</div>
  </div>`;
}
function shareDay() {
  const sh = shareState();
  Object.keys(sh).forEach(k => { sh[k] = Math.round(sh[k] * 0.8 * 10) / 10; });
}

/* --------------------------- Auftragskarten --------------------------- */
function orderExtraHTML(o) {
  let h = "";
  if (o.contract) {
    const c = contracts().find(x => x.id === o.contract);
    h += `<div class="xrow contract">📑 Rahmenvertrag${c ? " · Tag " + c.day + " von " + c.days + " · Ausfall kostet " + money(c.penalty) : ""}</div>`;
  }
  if (o.mission) h += `<div class="xrow mission">🧭 Teil einer Mission – Frist ${stamp(o.deadline)}</div>`;
  if (o.nego && !o.nego.done) h += `<div class="xrow nego">🤝 Großauftrag – im Planer lässt sich über den Preis reden</div>`;
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
    <div class="xrow vip">Nur du disponierst diese Fahrt – die Dispo fasst sie nicht an.</div>
    ${pv}
  </div>`;
}
