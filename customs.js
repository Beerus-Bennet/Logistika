/* =========================================================================
   LOGISTIKA – Zoll
   Ab Etappe 4 gehen Fahrten über Zollgrenzen (Schweiz, Norwegen, Türkei,
   Großbritannien, Übersee). Für jede solche Fahrt braucht es eine
   Zollanmeldung. Selbst disponierte Fahrten prüft der Chef selbst: Rechnung
   gegen Anmeldung vergleichen, Fehler antippen, abschicken – auf Zeit.
   Fehlerfrei = Grüne Spur, sonst Stichprobe oder Beschau an der Grenze.
   Büros mit Zoll & Papiere erledigen das selbst. Wer es liegen lässt,
   bezahlt einen Zollagenten – und hofft.
   ========================================================================= */
"use strict";

const EU_CC = new Set(["Deutschland", "Niederlande", "Belgien", "Frankreich", "Spanien", "Portugal", "Italien", "Österreich",
  "Tschechien", "Polen", "Ungarn", "Rumänien", "Griechenland", "Dänemark", "Schweden", "Finnland", "Lettland"]);
const NODE_CC = {
  rotterdam: "Niederlande", ams: "Niederlande", antwerpen: "Belgien", bruessel: "Belgien",
  paris: "Frankreich", cdg: "Frankreich", lehavre: "Frankreich", lyon: "Frankreich", marseille: "Frankreich",
  barcelona: "Spanien", valencia: "Spanien", madrid: "Spanien", algeciras: "Spanien", lissabon: "Portugal",
  milano: "Italien", genua: "Italien", rom: "Italien", neapel: "Italien", zuerich: "Schweiz", wien: "Österreich",
  praha: "Tschechien", warschau: "Polen", gdansk: "Polen", malasz: "Polen", budapest: "Ungarn", bukarest: "Rumänien",
  constanta: "Rumänien", istanbul: "Türkei", piraeus: "Griechenland", kopenhagen: "Dänemark", goeteborg: "Schweden",
  stockholm: "Schweden", oslo: "Norwegen", helsinki: "Finnland", riga: "Lettland",
  london: "Vereinigtes Königreich", felixstowe: "Vereinigtes Königreich", lhr: "Vereinigtes Königreich", manchester: "Vereinigtes Königreich",
  minsk: "Belarus", moskau: "Russland", ekb: "Russland", astana: "Kasachstan", khorgos: "Kasachstan",
  urumqi: "China", lanzhou: "China", xian: "China", chongqing: "China", wuhan: "China", shanghai: "China", pvg: "China",
  ningbo: "China", shenzhen: "China", hongkong: "Hongkong", busan: "Südkorea", tokio: "Japan", nrt: "Japan", osaka: "Japan",
  singapur: "Singapur", portklang: "Malaysia", jakarta: "Indonesien", mumbai: "Indien", delhi: "Indien", chennai: "Indien",
  colombo: "Sri Lanka", jebelali: "Vereinigte Arabische Emirate", suez: "Ägypten",
  nyc: "USA", chicago: "USA", memphis: "USA", lax: "USA", houston: "USA", miami: "USA", savannah: "USA", anchorage: "USA",
  vancouver: "Kanada", montreal: "Kanada", panama: "Panama", santos: "Brasilien", mexiko: "Mexiko", veracruz: "Mexiko",
  buenos: "Argentinien", santiago: "Chile", callao: "Peru", lagos: "Nigeria", casablanca: "Marokko", mombasa: "Kenia",
  nairobi: "Kenia", durban: "Südafrika", kapstadt: "Südafrika", sydney: "Australien", melbourne: "Australien",
  perth: "Australien", auckland: "Neuseeland"
};
const nodeCC = id => NODE_CC[id] || "Deutschland";
const zoneOf = cc => EU_CC.has(cc) ? "EU" : cc;
const CC_SUFFIX = { "Vereinigtes Königreich": "Ltd.", USA: "Inc.", Kanada: "Inc.", Schweiz: "AG", Norwegen: "AS", Türkei: "A.Ş.",
  Japan: "K.K.", Südkorea: "Co., Ltd.", China: "Co., Ltd.", Hongkong: "Ltd.", Singapur: "Pte. Ltd.", Indien: "Pvt. Ltd.",
  Australien: "Pty Ltd", Neuseeland: "Ltd.", Brasilien: "Ltda.", Mexiko: "S.A. de C.V.", Argentinien: "S.A.", Chile: "SpA" };
const CONSIGNEE = [["Northgate", "Meridian", "Harbourline", "Atlas", "Kestrel", "Bluewater", "Summit", "Ironbridge", "Crescent", "Lakeshore"],
  ["Trading", "Imports", "Supply", "Distribution", "Industries", "Wholesale", "Logistics"]];
const GOODS = {
  pak: [["Fahrradersatzteile", "8714 99 50", 32], ["Bücher, gebunden", "4901 99 00", 18], ["T-Shirts aus Baumwolle", "6109 10 00", 40], ["Laborbedarf aus Kunststoff", "3926 90 97", 55]],
  express: [["Getriebeteile für Kraftfahrzeuge", "8708 40 50", 120], ["Halbleitermodule", "8542 31 90", 900], ["Medizinische Instrumente", "9018 90 84", 650]],
  pal: [["Mineralwasser in PET-Flaschen", "2201 10 19", 0.6], ["Handwerkzeuge", "8205 59 80", 14], ["Keramische Fliesen", "6907 21 00", 1.8]],
  kuehl: [["Käse, gerieben", "0406 20 00", 9], ["Frische Erdbeeren", "0810 10 00", 5], ["Impfstoffe", "3002 41 00", 380]],
  schuett: [["Weichweizen", "1001 99 00", 0.25], ["Steinkohle", "2701 12 90", 0.12], ["Kies", "2517 10 10", 0.03]],
  adr: [["Lacke, entzündbar", "3208 90 19", 7], ["Lithium-Ionen-Akkus", "8507 60 00", 60]],
  sperrig: [["Rotorblatt für Windkraftanlage", "8503 00 99", 22], ["Leistungstransformator", "8504 23 00", 35]],
  cont: [["Möbel aus Holz", "9403 60 10", 6], ["Elektrische Haushaltsgeräte", "8516 60 80", 11], ["Spielzeug", "9503 00 70", 9]]
};
const INCOTERMS = ["EXW", "FCA", "CPT", "CIP", "DAP", "DPU", "DDP"];
const SEA_TERMS = ["FOB", "CFR", "CIF"];
const MODE_CODE = { r: "3 · Straße", l: "2 · Eisenbahn", i: "8 · Binnenschiff", s: "1 · Seeverkehr", a: "4 · Luftverkehr", b: "3 · Straße" };

/* ------------------------------ Grenze? ------------------------------ */
function customsLeg(job) {
  const o = job.order, z0 = zoneOf(nodeCC(o.from));
  if (zoneOf(nodeCC(o.to)) === z0 && job.legs.every(l => zoneOf(nodeCC(l.to)) === z0)) return -1;
  return job.legs.findIndex(l => zoneOf(nodeCC(l.to)) !== z0);
}
function zollPower() {
  return Math.max(0, ...(S.bases || []).map(b => typeof rolePower === "function" ? rolePower(b, "zoll") : 0));
}
function zollHelper() {
  for (const b of S.bases || []) { const s = b.staff.find(x => x.role === "zoll"); if (s) return s; }
  return null;
}
function cstats() { if (!S.cst) S.cst = { green: 0, done: 0, fines: 0 }; return S.cst; }
if (typeof LEDGER_KIND === "object" && !LEDGER_KIND.customs) LEDGER_KIND.customs = { icon: "🛃", name: "Zoll" };

/* Aus extras.js onJobStart */
function customsOnStart(job) {
  const o = job.order;
  if (o.tut || o.snus || o.pablo || job.customs) return;
  const li = customsLeg(job);
  if (li < 0) return;
  const b = o.viaBase && typeof baseById === "function" ? baseById(o.viaBase) : null;
  const zp = b && typeof rolePower === "function" ? rolePower(b, "zoll") : 0;
  job.customs = { leg: li, st: zp > 0 ? "auto" : "open", zp, cc: nodeCC(job.legs[li].to), from: nodeCC(o.from) };
  if (job.customs.st === "open" && lively())
    toast("🛃 " + o.shipper + " geht nach " + job.customs.cc + " – Zollanmeldung unter „Live“ prüfen, sonst übernimmt ein Zollagent.", "warn");
}

/* ------------------------------ Dokumente ----------------------------- */
function makeDecl(job) {
  const o = job.order, c = job.customs;
  const g = pick(GOODS[o.cargo] || GOODS.pak);
  const legMode = job.legs[c.leg].mode;
  const sea = legMode === "s" || legMode === "i";
  const term = pick(sea ? SEA_TERMS.concat(["DAP", "FCA"]) : INCOTERMS);
  const kg = Math.max(1, Math.round(o.weight));
  const pcs = Math.max(1, Math.round(kg / (o.cargo === "pal" ? 650 : o.cargo === "cont" ? 9000 : o.cargo === "schuett" ? kg : 18)));
  const val = Math.round(kg * g[2] * rnd(0.85, 1.2) * 100) / 100;
  const cname = pick(CONSIGNEE[0]) + " " + pick(CONSIGNEE[1]) + " " + (CC_SUFFIX[c.cc] || "Ltd.");
  const place = N[job.legs[c.leg].to].short;
  return [
    { k: "exp", l: "Versender", v: o.shipper + ", " + N[o.from].short },
    { k: "con", l: "Empfänger", v: cname + ", " + N[o.to].short },
    { k: "good", l: "Waren\u00ADbezeichnung", v: g[0] },
    { k: "hs", l: "Zoll\u00ADtarif\u00ADnummer", v: g[1] },
    { k: "kg", l: "Rohmasse", v: kg, f: v => fmt(v, 0) + " kg" },
    { k: "pcs", l: "Packstücke", v: pcs, f: v => fmt(v, 0) },
    { k: "val", l: "Rechnungs\u00ADbetrag", v: val, f: v => fmt(v, 2) + " €" },
    { k: "orig", l: "Ursprungs\u00ADland", v: c.from },
    { k: "dest", l: "Bestim\u00ADmungs\u00ADland", v: c.cc },
    { k: "inco", l: "Liefer\u00ADbedingung", v: term + " " + place },
    { k: "mode", l: "Verkehrs\u00ADzweig an der Grenze", v: MODE_CODE[legMode] },
    { k: "pref", l: "Präferenz\u00ADnachweis", v: EU_CC.has(c.from) && ["Schweiz", "Norwegen", "Türkei", "Vereinigtes Königreich", "Kanada", "Japan", "Südkorea", "Mexiko", "Chile"].includes(c.cc) ? "Ursprungserklärung auf der Rechnung" : "keiner" }
  ];
}
/* Typische Fehler eines Azubis – manche fallen sofort auf, manche nicht */
function swapDigits(s) {
  const a = String(s), idx = [];
  for (let i = 0; i < a.length - 1; i++) if (/\d/.test(a[i]) && /\d/.test(a[i + 1]) && a[i] !== a[i + 1]) idx.push(i);
  if (!idx.length) return null;
  const i = pick(idx);
  return a.slice(0, i) + a[i + 1] + a[i] + a.slice(i + 2);
}
function bumpDigit(s) {
  const a = String(s), idx = [];
  for (let i = 0; i < a.length; i++) if (/\d/.test(a[i])) idx.push(i);
  const i = pick(idx.slice(Math.max(0, idx.length - 6)));
  const d = (+a[i] + (Math.random() < 0.5 ? 1 : 9)) % 10;
  return a.slice(0, i) + d + a.slice(i + 1);
}
function dropLetter(s) {
  const w = s.split(" "), i = w.findIndex(x => x.length > 5 && /^[A-Za-zÄÖÜäöüß]+$/.test(x));
  if (i < 0) return null;
  const x = w[i], j = 1 + Math.floor(Math.random() * (x.length - 2));
  w[i] = x.slice(0, j) + x.slice(j + 1);
  return w.join(" ");
}
const OTHER_CC = ["China", "Türkei", "Polen", "Indien", "USA", "Vereinigtes Königreich", "Schweiz", "Österreich", "Niederlande"];
function corrupt(row) {
  switch (row.k) {
    case "hs": return Math.random() < 0.5 ? swapDigits(row.v) || bumpDigit(row.v) : bumpDigit(row.v);
    case "kg": { const s = swapDigits(String(row.v)); return s && +s !== row.v ? +s : row.v * 10; }
    case "pcs": return row.v > 9 ? (+swapDigits(String(row.v)) || row.v + 1) : row.v + pick([1, 2, -1].filter(d => row.v + d > 0));
    case "val": return Math.random() < 0.5 ? Math.round(row.v * 10) / 100 : +(swapDigits(row.v.toFixed(2)) || (row.v * 10).toFixed(2));
    case "orig": return pick(OTHER_CC.filter(x => x !== row.v));
    case "dest": return pick(OTHER_CC.filter(x => x !== row.v));
    case "inco": { const [t, ...p] = row.v.split(" "); return pick(INCOTERMS.concat(SEA_TERMS).filter(x => x !== t)) + " " + p.join(" "); }
    case "con": case "exp": return dropLetter(row.v);
    case "mode": return pick(Object.values(MODE_CODE).filter(x => x !== row.v));
    case "good": return null;
    case "pref": return row.v === "keiner" ? null : "keiner";
  }
  return null;
}
function customsDifficulty() {
  const st = Math.max(4, S.stage);
  return { rows: st >= 5 ? 12 : 10, errs: st >= 6 ? 4 : st >= 5 ? 3 : 2, time: st >= 6 ? 50 : st >= 5 ? 55 : 60 };
}
function buildGame(job) {
  const all = makeDecl(job), D = customsDifficulty();
  const keep = new Set(["exp", "con", "good", "hs", "kg", "pcs", "val", "orig", "dest", "inco"]);
  const rows = all.filter(r => keep.has(r.k) || D.rows > 10).slice(0, D.rows);
  const cand = rows.filter(r => !["good"].includes(r.k)).sort(() => Math.random() - 0.5);
  let n = 0;
  for (const r of cand) {
    if (n >= D.errs) break;
    const bad = corrupt(r);
    if (bad == null || String(bad) === String(r.v)) continue;
    r.bad = bad; n++;
  }
  rows.forEach(r => { r.decl = r.bad != null ? r.bad : r.v; r.flag = false; });
  return { rows, errs: n, time: D.time };
}

/* ------------------------------- Spiel -------------------------------- */
let cuGame = null;
function customsEl() {
  let el = document.getElementById("customs");
  if (!el) { el = document.createElement("div"); el.id = "customs"; document.body.appendChild(el); }
  return el;
}
const showVal = (r, v) => r.f ? r.f(v) : esc(String(v));
function openCustoms(jobId) {
  const job = S.jobs.find(j => j.id === jobId);
  if (!job || !job.customs || job.customs.st !== "open") return toast("Für diese Fahrt ist keine Zollanmeldung offen.", "warn");
  if (cuGame) return;
  const g = buildGame(job);
  const helper = zollPower() > 0 ? zollHelper() : null;
  cuGame = { job: job.id, g, left: g.time + (helper ? 10 : 0), prev: S.speed, helper, done: false, hint: null };
  if (helper) {
    const r = g.rows.find(x => x.bad != null);
    if (r) cuGame.hint = helper.name + " aus dem Büro: „Schau dir " + r.l.replace(/\u00AD/g, "") + " genau an.“";
  }
  if (S.speed > 0) setSpeed(0);
  if (typeof closeModal === "function") closeModal();
  document.body.classList.add("customs-open");
  renderCustoms();
  cuGame.timer = setInterval(() => {
    if (!cuGame || cuGame.done) return;
    cuGame.left -= 0.25;
    const bar = document.getElementById("cuTime");
    if (bar) { bar.style.width = clamp(cuGame.left / (g.time + (cuGame.helper ? 10 : 0)) * 100, 0, 100) + "%"; bar.classList.toggle("low", cuGame.left < 10); }
    const t = document.getElementById("cuSec"); if (t) t.textContent = Math.max(0, Math.ceil(cuGame.left)) + " s";
    if (cuGame.left <= 0) submitCustoms(true);
  }, 250);
}
function renderCustoms() {
  const el = customsEl(), job = S.jobs.find(j => j.id === cuGame.job), g = cuGame.g;
  const o = job ? job.order : null;
  el.className = "on";
  if (cuGame.done) return renderCustomsResult();
  el.innerHTML = `<div class="cu-stage">
    <div class="cu-head"><b>🛃 Zollanmeldung</b><small>${o ? esc(o.shipper) + " · " + esc(job.customs.from) + " → " + esc(job.customs.cc) : ""}</small>
      <div class="cu-timer"><i id="cuTime" style="width:100%"></i></div><span class="cu-sec" id="cuSec">${Math.ceil(cuGame.left)} s</span></div>
    <div class="cu-intro">Links die <b>Handelsrechnung</b>, rechts was der Azubi angemeldet hat. Tipp auf jede Angabe, die nicht stimmt.
      ${g.errs} ${g.errs === 1 ? "Fehler steckt" : "Fehler stecken"} drin.</div>
    ${cuGame.hint ? `<div class="cu-hint">💡 ${esc(cuGame.hint)}</div>` : ""}
    <div class="cu-doc">
      <div class="cu-row cu-th"><span>Angabe</span><span>Rechnung</span><span>Anmeldung</span></div>
      ${g.rows.map((r, i) => `<button class="cu-row${r.flag ? " flag" : ""}" data-cu="${i}">
        <span class="cu-l">${esc(r.l)}</span><span class="cu-inv">${showVal(r, r.v)}</span><span class="cu-dec">${showVal(r, r.decl)}</span></button>`).join("")}
    </div>
    <div class="cu-btns"><button class="btn ghost" id="cuAgent">Zollagent · ${money(agentFee())}</button><button class="btn" id="cuGo">Anmeldung abschicken</button></div>
  </div>`;
  el.querySelectorAll("[data-cu]").forEach(b => b.onclick = () => {
    const r = g.rows[+b.dataset.cu]; r.flag = !r.flag; b.classList.toggle("flag", r.flag);
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (_) { /* egal */ } }
  });
  $("#cuGo").onclick = () => submitCustoms(false);
  $("#cuAgent").onclick = () => { const j = S.jobs.find(x => x.id === cuGame.job); closeCustoms(); if (j) useAgent(j); };
}
const agentFee = () => roundK(90 * stageK(), 10);
function useAgent(job) {
  if (!job.customs || job.customs.st !== "open") return;
  const fee = agentFee();
  if (typeof payOut === "function") payOut(fee, "customs", "Zollagent · " + job.order.shipper);
  job.customs.st = "agent";
  toast("🛃 Der Zollagent kümmert sich um " + job.order.shipper + " (" + money(fee) + ").", "ok", true);
  save(); render();
}
function submitCustoms(timeout) {
  if (!cuGame || cuGame.done) return;
  const g = cuGame.g;
  const missed = g.rows.filter(r => r.bad != null && !r.flag).length;
  const wrong = g.rows.filter(r => r.bad == null && r.flag).length;
  const found = g.rows.filter(r => r.bad != null && r.flag).length;
  const mist = missed + wrong;
  cuGame.done = true; cuGame.res = { missed, wrong, found, mist, timeout };
  clearInterval(cuGame.timer);
  const job = S.jobs.find(j => j.id === cuGame.job);
  if (job && job.customs) {
    job.customs.st = mist === 0 ? "green" : mist === 1 ? "check" : "bad";
    job.customs.mist = mist;
    const C = cstats(); C.done++;
    if (mist === 0) {
      C.green++;
      job.order.pay = Math.round(job.order.pay * 1.04);
      S.xp += 20 + 10 * S.stage;
      if (typeof repAdd === "function" && typeof regionOf === "function") repAdd(regionOf(job.order), 1);
    }
  }
  if (typeof checkAchievements === "function") checkAchievements();
  save();
  renderCustomsResult();
}
function renderCustomsResult() {
  const el = customsEl(), R = cuGame.res, g = cuGame.g;
  const st = R.mist === 0 ? ["green", "🟢 Grüne Spur", "Fehlerfrei – der Lkw rollt ohne Halt über die Grenze. Der Kunde legt 4 % drauf."]
    : R.mist === 1 ? ["check", "🟡 Stichprobe", "Ein Fehler ist durchgerutscht. An der Grenze gibt’s eine kurze Kontrolle – etwa ein, zwei Stunden."]
    : ["bad", "🔴 Beschau", `${R.mist} Fehler – der Zoll schaut sich die Ladung genau an. Das dauert Stunden und kostet ein Bußgeld.`];
  el.innerHTML = `<div class="cu-stage">
    <div class="cu-res ${st[0]}"><b>${st[1]}</b><p>${R.timeout ? "⏰ Die Zeit ist abgelaufen. " : ""}${st[2]}</p></div>
    <div class="cu-doc">
      ${g.rows.map(r => {
        const cls = r.bad != null ? (r.flag ? "ok" : "miss") : (r.flag ? "wrong" : "");
        const tag = cls === "ok" ? "✔ gefunden" : cls === "miss" ? "übersehen" : cls === "wrong" ? "war richtig" : "";
        return `<div class="cu-row res ${cls}"><span class="cu-l">${esc(r.l)}${tag ? `<em>${tag}</em>` : ""}</span><span class="cu-inv">${showVal(r, r.v)}</span><span class="cu-dec">${showVal(r, r.decl)}</span></div>`;
      }).join("")}
    </div>
    <div class="cu-btns"><button class="btn" id="cuOk">Weiter</button></div>
  </div>`;
  $("#cuOk").onclick = closeCustoms;
}
function closeCustoms() {
  if (!cuGame) return;
  clearInterval(cuGame.timer);
  const prev = cuGame.prev;
  cuGame = null;
  const el = document.getElementById("customs");
  if (el) { el.className = ""; el.innerHTML = ""; }
  document.body.classList.remove("customs-open");
  if (prev > 0 && S.speed === 0) setSpeed(prev);
  render();
}

/* ------------------------------ An der Grenze -------------------------- */
function resolveCustoms(job) {
  const c = job.customs, K = stageK(), o = job.order;
  let res = c.st;
  if (res === "open" || res === "agent") {
    if (res === "open") {
      const fee = agentFee();
      if (typeof payOut === "function") payOut(fee, "customs", "Zollagent · " + o.shipper);
    }
    const x = Math.random();
    res = x < 0.45 ? "green" : x < 0.8 ? "check" : "bad";
    c.mist = res === "bad" ? 2 : res === "check" ? 1 : 0;
  } else if (res === "auto") {
    const p = clamp(0.5 + c.zp * 0.06, 0.5, 0.92), x = Math.random();
    res = x < p ? "green" : x < p + (1 - p) * 0.7 ? "check" : "bad";
    c.mist = res === "bad" ? 2 : res === "check" ? 1 : 0;
  }
  c.res = res;
  const mins = res === "green" ? 0 : res === "check" ? Math.round(rnd(60, 120)) : Math.round(rnd(180, 360));
  c.holdUntil = S.time + mins;
  if (res === "bad") {
    const fine = roundK(120 * K * Math.max(2, c.mist || 2), 10);
    if (typeof payOut === "function") payOut(fine, "customs", "Bußgeld Zoll · " + o.shipper);
    cstats().fines += fine;
    c.fine = fine;
  }
  if (lively()) {
    const msg = res === "green" ? "🟢 " + o.shipper + ": Grüne Spur nach " + c.cc + "."
      : res === "check" ? "🟡 Stichprobe beim Zoll (" + c.cc + "): " + o.shipper + " steht bis " + clock(c.holdUntil) + "."
      : "🔴 Beschau beim Zoll (" + c.cc + "): " + o.shipper + " steht bis " + clock(c.holdUntil) + ", Bußgeld " + money(c.fine) + ".";
    toast(msg, res === "green" ? "ok" : "warn", res === "green");
  }
}
/* Aus game.js: Entladen am Grenzort wartet, bis der Zoll fertig ist */
function customsHold(veh, job, leg) {
  const c = job && job.customs;
  if (!c || c.cleared || veh.phase !== "unload" || job.legs.indexOf(leg) !== c.leg) return false;
  if (c.holdUntil == null) resolveCustoms(job);
  if (S.time < c.holdUntil) return true;
  c.cleared = true;
  return false;
}
function customsLabel(v) {
  const job = v.jobId && S.jobs.find(j => j.id === v.jobId), c = job && job.customs;
  if (!c || c.cleared || c.holdUntil == null || S.time >= c.holdUntil || v.phase !== "unload") return null;
  return (c.res === "bad" ? "🔴 Beschau beim Zoll" : "🟡 Stichprobe beim Zoll") + " · bis " + clock(c.holdUntil);
}
/* Live-Karte */
function customsJobHTML(j) {
  const c = j.customs;
  if (!c) return "";
  if (c.cleared || c.holdUntil != null) {
    const r = c.res || c.st;
    return `<div class="cu-chip ${r}">🛃 ${r === "green" ? "Grüne Spur" : r === "check" ? "Stichprobe" : "Beschau"} · ${esc(c.cc)}${c.cleared ? " · abgefertigt" : ""}</div>`;
  }
  const lab = { open: "Zollanmeldung offen", auto: "Büro erledigt die Papiere", agent: "Zollagent beauftragt", green: "Grüne Spur angemeldet",
    check: "1 Fehler in der Anmeldung", bad: (c.mist || 2) + " Fehler in der Anmeldung" }[c.st];
  return `<div class="cu-chip ${c.st}">🛃 ${lab} · nach ${esc(c.cc)}
    ${c.st === "open" ? `<button class="btn tiny" data-customs="${j.id}">prüfen</button>` : ""}</div>`;
}

/* Erfolg */
if (typeof ACHS !== "undefined") ACHS.push(
  { id: "zoll1", icon: "🟢", name: "Grüne Spur", desc: "Eine fehlerfreie Zollanmeldung.", ok: () => cstats().green >= 1 },
  { id: "zoll10", icon: "🛃", name: "Zollprofi", desc: "10 fehlerfreie Zollanmeldungen.", ok: () => cstats().green >= 10 }
);
