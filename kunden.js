/* =========================================================================
   LOGISTIKA – v244: Kunden, kleine Geschichten, Auftragsserien, Meilensteine

   · Jeder Speditionsauftrag bekommt einen Titel und ein kurzes Zitat des
     Auftraggebers (wer, was, warum) – deterministisch je Auftrag.
   · Stammkunden: wer oft und pünktlich beliefert wird, kommt öfter wieder
     und zahlt etwas mehr (ab 3 / 5 / 10 Lieferungen +4 / +8 / +12 %). Ab 5
     Lieferungen bietet er einen Liefervertrag an (bestehende Rahmenverträge).
   · Auftragsserien: gelegentlich drei zusammenhängende Fahrten mit Bonus –
     freiwillig, immer mit der eigenen Straßenflotte fahrbar.
   · Meilensteine: zusätzliche Erfolge mit kleiner, einmaliger Belohnung.
   ========================================================================= */
"use strict";

/* ----------------------------- Geschichten ------------------------------ */
const STORY_TITLE = {
  pak: ["{k} wartet auf die Sendung", "Zustellung vor Ladenschluss", "Kleines Paket, großer Kunde", "Heute noch, bitte!", "Post für {k}"],
  express: ["Wettlauf gegen die Uhr", "Jede Minute zählt", "Eilt! {k} braucht es heute", "Stillstand droht", "Notfall bei {k}"],
  pal: ["Nachschub fürs Lager", "Paletten für {k}", "Volle Ladefläche", "Das Regal ist leer", "Wochenlieferung für {k}"],
  kuehl: ["Die Kühlkette darf nicht reißen", "Frische für {k}", "Kalt ankommen ist alles", "Temperatur im Blick"],
  adr: ["Heiße Fracht mit Papieren", "Gefahrgut für {k}", "Nur mit ADR-Schein", "Vorsicht, Klasse 3"],
  sperrig: ["Zu groß für jede Lücke", "Schwerlast für {k}", "Mit Begleitfahrzeug", "Das passt nicht in den Sprinter"],
  cont: ["Kisten vom Kai", "Container für {k}", "Die Box muss weiter", "Vom Hafen ins Land"],
  schuett: ["Lose Ladung, große Menge", "Schüttgut für {k}", "Eine Schiffsladung voll", "Nachschub fürs Werk"]
};
const STORY_QUOTE = {
  pak: ["Unsere Kundin hat heute Geburtstag – das Paket muss pünktlich da sein.", "Ohne die Unterlagen platzt morgen früh der Termin.",
    "Die Ware ist verkauft, nur noch nicht geliefert.", "Wir haben es versprochen – lassen Sie uns nicht hängen."],
  express: ["Die Linie steht, bis das Teil da ist. Jede Stunde kostet uns Geld.", "Wenn das heute nicht ankommt, verlieren wir den Kunden.",
    "Wir zahlen gut – aber nur, wenn es wirklich schnell geht.", "Der Techniker wartet schon vor Ort."],
  pal: ["Unser Lager ist fast leer, das Wochenende steht vor der Tür.", "Die Filialen bestellen nach – bitte zuverlässig liefern.",
    "Normale Ware, aber wir brauchen einen Partner, auf den Verlass ist.", "Pünktlich ist uns wichtiger als schnell."],
  kuehl: ["Über acht Grad dürfen wir die Ware nicht annehmen.", "Morgen früh ist Markttag – die Ware muss frisch sein.",
    "Ein Temperaturprotokoll gehört dazu, sonst gibt es Ärger mit der Kontrolle.", "Wir hatten schon einmal eine unterbrochene Kühlkette – nie wieder."],
  adr: ["Nur mit ADR-Fahrzeug und Papieren – da machen wir keine Ausnahme.", "Das Werk braucht den Nachschub, sonst steht die Produktion.",
    "Sauber gekennzeichnet, ruhig gefahren – mehr wollen wir nicht.", "Die Behörden schauen bei uns genau hin."],
  sperrig: ["Das Stück ist breiter als eine Fahrspur – die Genehmigung liegt vor.", "Ohne Tieflader geht hier nichts.",
    "Der Kran steht schon bereit, der Aufbau ist für morgen geplant.", "Einmal im Jahr so ein Teil – das muss sitzen."],
  cont: ["Das Schiff ist pünktlich, jetzt müssen die Boxen weiter.", "Im Container steckt die halbe Jahresproduktion.",
    "Zoll ist erledigt – jetzt zählt nur noch der Transport.", "Die Liegegebühren laufen – bitte zügig abholen."],
  schuett: ["Das Werk verbraucht jeden Tag eine Schiffsladung.", "Lose geschüttet, aber bitte trocken.",
    "Per Lkw wären es zehn Fahrten – per Schiff eine.", "Die Halde ist fast leer."]
};
const storyHash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100003, 7);
const storyShort = n => String(n || "").replace(/\s*(GmbH|AG|KG|SE|& Co\.?)\b.*$/, "").split(/\s+/).slice(0, 3).join(" ");
function orderStory(o) {
  if (!o || o.title) return;
  const k = STORY_TITLE[o.cargo] ? o.cargo : "pak", h = storyHash(o.id + o.shipper);
  o.title = STORY_TITLE[k][h % STORY_TITLE[k].length].replace("{k}", storyShort(o.shipper));
  o.quote = STORY_QUOTE[k][(h >> 3) % STORY_QUOTE[k].length];
}

/* ------------------------------ Stammkunden ----------------------------- */
function custOf(name) { S.cust = S.cust || {}; return S.cust[name] || null; }
function custTier(c) {
  if (!c || c.n < 3 || c.late > c.n * 0.3) return 0;
  return c.n >= 10 ? 3 : c.n >= 5 ? 2 : 1;
}
const CUST_BONUS = [1, 1.04, 1.08, 1.12], CUST_NAME = ["", "Stammkunde", "Guter Stammkunde", "Partner"];
/* Wer schon mehrmals beliefert wurde, meldet sich öfter (game.js pickShipper fragt das ab) */
function custWeight(name) { const c = custOf(name); return c && c.n >= 2 ? (c.late > c.n * 0.3 ? 1 : 3) : 1; }
const custPlain = o => !(o.snus || o.pablo || o.farm || o.tut || o.tutNext || o.vip || o.jewel || o.contract);
function kundenOnSpawn(o) {
  if (!o || !custPlain(o)) return;
  orderStory(o);
  const t = custTier(custOf(o.shipper));
  if (t) { o.reg = t; o.pay = Math.round(o.pay * CUST_BONUS[t]); }
  /* ab 5 Lieferungen: einmal ein Liefervertrag (bestehender Rahmenvertrag, mit genau dieser Strecke) */
  const c = custOf(o.shipper);
  if (c && c.n >= 5 && !c.offer && t >= 2 && typeof offerContract === "function" && typeof fleetCanDo === "function" && fleetCanDo(o) && !o.air) {
    c.offer = S.time;
    try { offerContract(o); } catch (e) { console.warn("Liefervertrag", e); }
  }
}
function kundenDelivered(job, pay, late) {
  const o = job.order, st = extraStats();
  if (o.to && o.from && N[o.to] && N[o.from] && (N[o.to].stage >= 4 || N[o.from].stage >= 4) && !o.farm) st.intl = (st.intl || 0) + 1;
  if (o.series) seriesDelivered(o, pay, late);
  if (!custPlain(o) && !o.series) return;
  S.cust = S.cust || {};
  const c = S.cust[o.shipper] = S.cust[o.shipper] || { n: 0, late: 0, first: S.time };
  const before = custTier(c);
  c.n++; if (late) c.late++; c.last = S.time;
  st.custMax = Math.max(st.custMax || 0, c.n);
  const now = custTier(c);
  if (now > before && typeof lively === "function" && lively())
    toast("⭐ " + o.shipper + " ist jetzt " + CUST_NAME[now] + " – künftige Aufträge +" + Math.round((CUST_BONUS[now] - 1) * 100) + " %", "ok");
}

/* ----------------------------- Auftragsserien --------------------------- */
const SERIES = [
  { k: "ernte", name: "Die große Erntelieferung", firm: "Landwirtschaftsbetrieb Sonnenfeld", icon: "🌾",
    steps: [["Leere Erntekisten zum Hof", "Die Ernte beginnt morgen – ohne Kisten stehen die Helfer mit leeren Händen da."],
      ["Frische Ernte ins Regionallager", "Was heute gepflückt wird, muss heute noch ins Kühllager."],
      ["Ware zum Großmarkt", "Der Großmarkt öffnet um vier – unsere Ware soll als Erste da sein."]] },
  { k: "umzug", name: "Werkstatt Hoffmann zieht um", firm: "Werkstatt Hoffmann", icon: "🔧",
    steps: [["Werkzeug und Regale abholen", "Die alte Halle muss bis Monatsende leer sein."],
      ["Maschinenteile zur neuen Halle", "Die neue Halle ist bezugsfertig – jetzt fehlen nur noch die Maschinen."],
      ["Reparierte Teile zurück zu den Kunden", "Die Kunden warten auf ihre Teile – der Umzug darf das nicht verzögern."]] },
  { k: "filiale", name: "Bäckerei Morgenstern eröffnet eine Filiale", firm: "Bäckerei Morgenstern", icon: "🥖",
    steps: [["Mehl und Zutaten für die Backstube", "Für die Eröffnung backen wir doppelt – ohne Mehl geht nichts."],
      ["Ofenteile zur neuen Filiale", "Der Ofenbauer kommt morgen früh, die Teile müssen vorher da sein."],
      ["Die ersten Brötchen zum Eröffnungsfest", "Eröffnung ist um sieben – die Gäste sollen frische Brötchen bekommen."]] }
];
/* Gewicht so, dass das größte eigene Straßen-/Radfahrzeug es trägt */
function seriesLoad() {
  const own = S.fleet.map(f => vType(f.type)).filter(t => t && !t.car && !t.special && (t.mode === "r" || t.mode === "b"));
  if (!own.length) return null;
  const cap = Math.max(...own.map(t => t.cap));
  const ck = cap >= 300 ? "pal" : "pak", cg = CARGO[ck];
  return { ck, w: clamp(Math.round(cap * rnd(0.45, 0.75)), cg.minKg, Math.min(cg.maxKg, cap)) };
}
function seriesOrder(S0, step, from) {
  const tpl = SERIES.find(x => x.k === S0.k); if (!tpl) return null;
  const L = seriesLoad(); if (!L) return null;
  const nodes = unlockedNodes().filter(n => n.modes.includes("r") || n.modes.includes("b"));
  for (let k = 0; k < 40; k++) {
    const a = from && N[from] ? N[from] : pick(nodes), b = pick(nodes);
    if (!a || !b || a.id === b.id) continue;
    const air = hav([a.lat, a.lon], [b.lat, b.lon]);
    if (air < 2 || air > (S.stage === 1 ? 30 : S.stage === 2 ? 160 : 400)) continue;
    const pr = priceOrder(a.id, b.id, L.ck, L.w);
    if (!pr || !pr.ref.legs.every(l => l.mode === "r" || l.mode === "b")) continue;
    const st = tpl.steps[step - 1];
    const o = { id: "A" + (S.seq++), from: a.id, to: b.id, cargo: L.ck, weight: L.w, pay: Math.round(pr.pay * 1.1), deadline: pr.deadline + 240, pk: PAY_K,
      shipper: tpl.firm, desc: st[0], title: tpl.name + " · " + step + "/3", quote: st[1], created: S.time,
      refDist: Math.round(pr.ref.dist), refTime: Math.round(pr.fastest.time), expire: Math.round(S.time + 1440), series: { id: S0.id, step, of: 3 },
      pick: makeAddr(a.id), drop: makeAddr(b.id) };
    withLastMile(o);
    return o;
  }
  return null;
}
function seriesOffer() {
  if (S.series || !lively() || (typeof logiOn === "function" && !logiOn()) || logiDoneN() < 15) return;
  if (S.time < (S.seriesNext || 0) || Math.random() > 0.35) return;
  S.seriesNext = S.time + 4 * 1440;
  const done = (extraStats().seriesK || []);
  const pool = SERIES.filter(x => !done.includes(x.k)), tpl = pick(pool.length ? pool : SERIES);
  if (!seriesLoad()) return;
  decisionMsg({ from: tpl.firm, kind: "contract", icon: tpl.icon, type: "series", title: "Auftragsserie: " + tpl.name, brake: false,
    body: `Drei zusammenhängende Fahrten: ${tpl.steps.map((s, i) => (i + 1) + ". " + s[0]).join(" · ")}. Jede Fahrt wird normal bezahlt, nach der dritten gibt es einen Bonus. Die nächste Fahrt startet dort, wo die vorige endet.`,
    choices: [{ label: "Serie annehmen", sub: "die erste Fahrt kommt gleich ins Auftragsbuch" }, { label: "Ablehnen" }], def: 1, wait: 360, ctx: { k: tpl.k } });
}
DECISIONS.series = {
  choose(m, idx) {
    if (idx !== 0) return "Abgelehnt.";
    if (S.series) return "Es läuft schon eine Serie.";
    const S0 = { id: "R" + (S.seq++), k: m.dec.ctx.k, step: 1, pays: 0, at: S.time };
    const o = seriesOrder(S0, 1, null);
    if (!o) return "Gerade passt keine Strecke – vielleicht beim nächsten Mal.";
    S0.cur = o.id; S.series = S0; S.orders.unshift(o);
    toast("🔗 Serie angenommen – Fahrt 1/3 liegt im Auftragsbuch.", "ok");
    return "Angenommen – Fahrt 1/3 bereit.";
  }
};
function seriesDelivered(o, pay, late) {
  const S0 = S.series; if (!S0 || o.series.id !== S0.id) return;
  S0.pays += pay; if (late) S0.late = (S0.late || 0) + 1;
  if (o.series.step >= 3) {
    const tpl = SERIES.find(x => x.k === S0.k), bonus = Math.round(S0.pays * (S0.late ? 0.15 : 0.35));
    S.money += bonus; S.revenue += bonus; logMoney("bonus", "Serienbonus · " + (tpl ? tpl.name : "Serie"), bonus);
    const st = extraStats(); st.series = (st.series || 0) + 1; st.seriesK = (st.seriesK || []).concat(S0.k);
    if (typeof phoneMsg === "function") phoneMsg({ from: tpl ? tpl.firm : "Kunde", kind: "good", title: "Serie geschafft: " + (tpl ? tpl.name : ""),
      body: `Alle drei Fahrten erledigt${S0.late ? " (eine davon zu spät)" : ""}. Bonus: +${money(bonus)}. Gern wieder!` });
    S.series = null;
    return;
  }
  const nx = seriesOrder(S0, o.series.step + 1, o.to);
  if (!nx) { S.series = null; toast("🔗 Serie beendet – für die nächste Fahrt fand sich keine Strecke.", "warn"); return; }
  S0.step = o.series.step + 1; S0.cur = nx.id; S.orders.unshift(nx);
  toast("🔗 " + nx.title + " – die nächste Fahrt startet in " + N[nx.from].short + ".", "ok");
}
/* Verfallen oder abgelehnt: Serie vorbei */
function seriesTick() {
  const S0 = S.series; if (!S0 || !S0.cur) return;
  if (S.orders.some(o => o.id === S0.cur) || S.jobs.some(j => j.order.id === S0.cur)) return;
  S.series = null;
  if (typeof phoneMsg === "function") phoneMsg({ from: (SERIES.find(x => x.k === S0.k) || {}).firm || "Kunde", kind: "trouble", title: "Serie abgebrochen",
    body: "Eine Fahrt der Serie ist verfallen oder wurde abgelehnt – den Bonus gibt es diesmal nicht." });
}
function logiDoneN() { return typeof logiDone === "function" ? logiDone() : S.done || 0; }
function kundenTick() { try { seriesTick(); } catch (e) { console.warn("Serie", e); } }
function kundenDay() { try { seriesOffer(); } catch (e) { console.warn("Serie", e); } }

/* ------------------------------ Meilensteine ---------------------------- */
if (typeof ACHS !== "undefined") ACHS.push(
  { id: "heavy1", icon: "🏗️", name: "Schwergewicht", desc: "Den ersten eigenen Schwerlasttransporter gekauft.", ok: () => S.fleet.some(f => { const t = vType(f.type); return t && t.flags.includes("sperrig") && !t.special; }) },
  { id: "special1", icon: "🧊", name: "Spezialist", desc: "Die erste neue Fahrzeugklasse: Kühl-, Gefahrgut- oder Containerfahrzeug.", ok: () => S.fleet.some(f => { const t = vType(f.type); return t && !t.special && ["kuehl", "adr", "container"].some(x => t.flags.includes(x)); }) },
  { id: "cust10", icon: "🤝", name: "Hausspediteur", desc: "Zehn Lieferungen für denselben Kunden.", ok: () => (extraStats().custMax || 0) >= 10 },
  { id: "series1", icon: "🔗", name: "Am Stück", desc: "Die erste Auftragsserie abgeschlossen.", ok: () => (extraStats().series || 0) >= 1 },
  { id: "intl1", icon: "🌐", name: "Über die Grenze", desc: "Die erste internationale Lieferung.", ok: () => (extraStats().intl || 0) >= 1 }
);

/* ------------------------- Auftragskarte: Zusätze ------------------------ */
/* Besonderheiten als kleine Marken (Stammkunde, Serie, Einführung, Express, verhandelbar, Vertrag) */
function orderSpecialHTML(o) {
  const t = [];
  if (o.intro === "ship") t.push(["intro", "🎓 Einführung: Schifffahrt"]);
  if (o.series) t.push(["series", "🔗 Serie " + o.series.step + "/3 · Bonus am Ende"]);
  if (o.reg) t.push(["reg", "⭐ " + CUST_NAME[o.reg] + " · +" + Math.round((CUST_BONUS[o.reg] - 1) * 100) + " %"]);
  if (o.contract) t.push(["contract", "📑 Liefervertrag"]);
  if (o.cargo === "express") t.push(["express", "⚡ Express · enge Frist, mehr Geld"]);
  else if (!o.acc && o.deadline - S.time < (o.refTime || 0) * 1.25) t.push(["tight", "⏳ knappe Frist"]);
  return t.length ? `<div class="o-tags">${t.map(([c, x]) => `<span class="o-tag ${c}">${esc(x)}</span>`).join("")}</div>` : "";
}
