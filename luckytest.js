/* =========================================================================
   LOGISTIKA – luckytest.js (v271)
   Luckybox-Testbühne zum schnellen Durchprobieren am Handy oder Rechner:
       index.html?test&lucky
   Nur im Testmodus (eigener Spielstand „logistika.test.v3“) – der echte Spielstand bleibt unberührt.
   Ohne „lucky“ in der Adresse tut diese Datei nichts.
   Bietet: Boxen geben (normal, golden, Bonus), nächsten Gewinn festlegen (Seltenheit oder Preis), „Bewegung reduzieren“
   und „ohne WebGL 2“ simulieren, Ton an/aus, Serie einstellen, fertige Abläufe (Neuladen mitten im Drehen, Schließen
   während des Drehens, goldene Box bei kurzer Serie, viele Boxen am Stück) und eine Prüfung der Chancen (20 000 Ziehungen
   mit der echten Ziehung). Die Chancen und Preise selbst werden nicht verändert – das Festlegen gilt nur hier.
   ========================================================================= */
"use strict";

const LB_TEST = (() => {
  const on = typeof TEST_MODE !== "undefined" && TEST_MODE && /[?&]lucky(=|&|$)/.test(location.search);
  /* reduced/no3d werden von lucky.js abgefragt (lbReduced, lbOpen) */
  const T = { on, reduced: null, no3d: false, force: "", origRoll: null };
  if (!on) return T;
  const KEY = "logistika.lbtest";                       /* Einstellungen der Testbühne (sessionStorage) */
  try { Object.assign(T, JSON.parse(sessionStorage.getItem(KEY) || "{}")); } catch (e) { /* egal */ }
  const keep = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ reduced: T.reduced, no3d: T.no3d, force: T.force, open: T.open })); } catch (e) { /* egal */ } };
  const RN = { c: "Gewöhnlich", r: "Selten", e: "Episch", l: "Legendär" };
  let el = null, pill = null, iv = 0;

  /* Gewinn festlegen: nur die eine Ziehung beim Antippen (Stufe „charge“, noch kein Gewinn) – Füllkacheln im Band bleiben zufällig */
  function hook() {
    if (T.origRoll || typeof rollPrize !== "function") return;
    T.origRoll = rollPrize;
    window.rollPrize = function (kind) {
      const f = T.force, mine = typeof lucky !== "undefined" && lucky && lucky.stage === "charge" && !lucky.win;
      if (mine && f.startsWith("r:")) { const list = PRIZES.filter(p => p.r === f.slice(2)); return list[Math.floor(Math.random() * list.length)]; }
      if (mine && f.startsWith("p:")) { const p = PRIZES.find(x => x.id === f.slice(2)); if (p) return p; }
      return T.origRoll(kind);
    };
  }
  const playingNow = () => typeof playing === "function" && playing();
  function found() {
    try {
      if (typeof INTRO === "undefined" || !INTRO.draft) startIntro();
      INTRO.draft.name = INTRO.draft.name || "Tessa"; INTRO.draft.company = INTRO.draft.company || "Testspedition";
      if (INTRO.draft.origin == null) INTRO.draft.origin = 0;
      beginFounding(); finishFounding();
      /* Hof-Rundgang auf der Testbühne überspringen (nur dieser Test-Spielstand) */
      const skipTut = () => { if (S.farm && S.farm.tut && !S.farm.tut.done) { if (typeof farmTutEnd === "function") farmTutEnd(true); else S.farm.tut.done = true; } };
      skipTut(); setTimeout(skipTut, 1200); setTimeout(skipTut, 3500);
    } catch (e) { console.warn("Testfirma", e); toast("Testfirma ließ sich nicht anlegen – bitte das Intro kurz selbst durchklicken.", "warn"); }
    render();
  }
  const L = () => luckyState();
  function give(kind, n, why) {
    for (let i = 0; i < (n || 1); i++) {
      const k = kind === "mix" ? (i % 4 === 3 ? "gold" : "std") : kind;
      const w = why || (k === "gold" ? "7 Tage in Folge alles geschafft" : kind === "bonus" ? "Dankeschön für die Sonderfahrt" : "alle Tagesaufgaben geschafft");
      L().boxes.push({ kind: k === "bonus" ? "std" : k, why: w, t: S.time });
    }
    save(); if (typeof renderGoalsChip === "function") renderGoalsChip();
    render();
  }
  function setStreak(n) {
    const st = L(); st.streak = Math.max(0, n); st.lastSet = n > 0 ? dayOf(S.time) : -9; save(); render();
  }
  function openBox() { if (!L().boxes.length && !L().pending) give("std", 1); openLucky(); }
  /* fertige Abläufe */
  const SCEN = {
    reload() {
      if (!L().boxes.length) give("std", 1);
      try { sessionStorage.setItem(KEY + ".hint", "reload"); } catch (e) { /* egal */ }
      openLucky();
      setTimeout(() => { const c = document.getElementById("lbCase"); if (c) c.click(); }, 700);
      setTimeout(() => location.reload(), 700 + 2600);
    },
    close() {
      if (!L().boxes.length) give("std", 1);
      openLucky();
      setTimeout(() => { const c = document.getElementById("lbCase"); if (c) c.click(); }, 700);
      setTimeout(() => { if (typeof lucky !== "undefined" && lucky) closeLucky(); }, 700 + 2400);
    },
    goldShort() { setStreak(2); give("gold", 1); L().boxes.sort((a, b) => (b.kind === "gold") - (a.kind === "gold")); openLucky(); },
    many() { give("std", 15); openLucky(); }
  };
  /* Chancen mit der echten Ziehung prüfen */
  function odds() {
    const out = {}, N = 20000;
    ["std", "gold"].forEach(kind => {
      const c = { c: 0, r: 0, e: 0, l: 0 };
      for (let i = 0; i < N; i++) c[T.origRoll(kind).r]++;
      out[kind] = c;
    });
    const row = (kind, k) => {
      const exp = LUCKY_ODDS[kind][k], got = out[kind][k] / N * 100;
      return `<td>${exp} %</td><td class="${Math.abs(got - exp) > 1.2 ? "lbt-bad" : ""}">${got.toFixed(1)} %</td>`;
    };
    const box = el.querySelector("#lbtOdds");
    box.innerHTML = `<table class="lbt-tab"><tr><th></th><th colspan="2">normal</th><th colspan="2">golden</th></tr>
      <tr><th></th><th>soll</th><th>ist</th><th>soll</th><th>ist</th></tr>
      ${["c", "r", "e", "l"].map(k => `<tr><th>${RN[k]}</th>${row("std", k)}${row("gold", k)}</tr>`).join("")}</table>
      <small>${N.toLocaleString("de-DE")} Ziehungen je Boxart mit der echten Ziehung (rollPrize), ohne Festlegung. Abweichungen um ±1 % sind Zufall.</small>`;
  }

  function statusHTML() {
    if (!playingNow()) return `<p class="lbt-warn">Der Test-Spielstand hat noch keine Firma. <button class="lbt-b main" data-a="found">Testfirma anlegen</button></p>`;
    const st = L(), std = st.boxes.filter(b => b.kind !== "gold").length, gold = st.boxes.length - std;
    const p = st.pending && PRIZES.find(x => x.id === st.pending.id);
    const last = (st.log || []).slice(0, 4).map(x => { const q = PRIZES.find(y => y.id === x.id); return q ? `${esc(q.name.replace("Hauptpreis: ", ""))} <i>${RN[q.r]}</i>` : ""; }).filter(Boolean);
    const chips = typeof perkChips === "function" ? perkChips() : [];
    const s = st.lastSet >= dayOf(S.time) - 1 ? st.streak || 0 : 0;
    return `<div class="lbt-stat">
      <span>🎁 <b>${std}</b> normal</span><span>💎 <b>${gold}</b> golden</span><span>geöffnet <b>${st.opened || 0}</b></span><span>🔥 Serie <b>${s}</b></span>
      ${p ? `<span class="lbt-pend">Unterbrochener Gewinn gespeichert: <b>${esc(p.name)}</b> – „Luckybox öffnen“ zeigt ihn</span>` : ""}
      </div>
      ${last.length ? `<div class="lbt-sub">Letzte Gewinne: ${last.join(" · ")}</div>` : ""}
      ${chips.length ? `<div class="lbt-sub">Aktive Wirkungen: ${chips.map(esc).join(" · ")}</div>` : ""}
      <div class="lbt-sub">Goldener Bulli: ${typeof ownsBulli === "function" && ownsBulli() ? "schon in der Flotte → als Gewinn kommt der Jackpot" : "noch nicht in der Flotte"}</div>`;
  }
  function render() {
    if (!el) return;
    const forceOpts = [["", "Zufall (echte Chancen)"]].concat(["c", "r", "e", "l"].map(k => ["r:" + k, "Seltenheit: " + RN[k]]))
      .concat(PRIZES.map(p => ["p:" + p.id, RN[p.r] + " – " + p.name.replace("Hauptpreis: ", "")]));
    const snd = typeof S !== "undefined" && S && S.farm;
    el.querySelector("#lbtBody").innerHTML = `
      <div id="lbtStatus">${statusHTML()}</div>
      <button class="lbt-b big" data-a="open">🎁 Luckybox öffnen</button>
      <h4>Boxen</h4>
      <div class="lbt-row">
        <button class="lbt-b" data-a="std">+1 normal</button><button class="lbt-b" data-a="gold">+1 golden</button>
        <button class="lbt-b" data-a="bonus">+1 Bonus</button><button class="lbt-b" data-a="mix">+10 gemischt</button>
        <button class="lbt-b ghost" data-a="clear">alle entfernen</button>
      </div>
      <h4>Nächster Gewinn</h4>
      <select id="lbtForce" class="lbt-sel">${forceOpts.map(([v, n]) => `<option value="${v}"${T.force === v ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>
      <small>Gilt für jede weitere Öffnung, bis du „Zufall“ wählst. Nur auf dieser Testbühne.</small>
      <h4>Darstellung</h4>
      <label class="lbt-chk"><input type="checkbox" id="lbtRed"${T.reduced ? " checked" : ""}> „Bewegung reduzieren“ simulieren</label>
      <label class="lbt-chk"><input type="checkbox" id="lbtNo3d"${T.no3d ? " checked" : ""}> ohne WebGL 2 (Band statt 3D)</label>
      <label class="lbt-chk${snd ? "" : " off"}"><input type="checkbox" id="lbtSnd"${snd && S.farm.snd ? " checked" : ""}${snd ? "" : " disabled"}> Ton${snd ? "" : " (nur mit Hof im Spielstand)"}</label>
      <div class="lbt-row"><span>Serie:</span><button class="lbt-b" data-a="s-">−1 Tag</button><button class="lbt-b" data-a="s+">+1 Tag</button><button class="lbt-b ghost" data-a="s0">auf 0</button></div>
      <h4>Abläufe</h4>
      <div class="lbt-row col">
        <button class="lbt-b" data-a="goldShort">Goldene Box bei kurzer Serie (Herkunft ≠ Fortschritt)</button>
        <button class="lbt-b" data-a="many">15 Boxen am Stück (mit „Animation überspringen“)</button>
        <button class="lbt-b" data-a="close">Schließen während das Rad dreht</button>
        <button class="lbt-b" data-a="reload">Seite neu laden, während das Rad dreht</button>
        <button class="lbt-b" data-a="odds">Chancen prüfen (20 000 Ziehungen)</button>
      </div>
      <div id="lbtOdds"></div>
      <h4>Am Handy zusätzlich prüfen</h4>
      <ul class="lbt-ul">
        <li>Handy drehen (Querformat) – Bühne links, Knöpfe rechts.</li>
        <li>Während eine Box offen ist, nach oben/unten wischen, damit Safaris Leisten ein- und ausfahren – „Nächste Box öffnen“ muss ganz sichtbar bleiben.</li>
        <li>Mehrfach schnell auf die Kiste und auf „Nächste Box öffnen“ tippen – es darf immer nur eine Box aufgehen.</li>
        <li>„Bewegung reduzieren“ auch echt in den iOS-Einstellungen (Bedienungshilfen → Bewegung) probieren.</li>
      </ul>`;
  }
  function onClick(e) {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a;
    if (a === "found") return found();
    if (!playingNow()) return toast("Erst die Testfirma anlegen.", "warn");
    if (a === "open") return openBox();
    if (a === "std" || a === "gold" || a === "bonus") return give(a, 1);
    if (a === "mix") return give("mix", 10);
    if (a === "clear") { L().boxes = []; delete L().pending; save(); if (typeof renderGoalsChip === "function") renderGoalsChip(); return render(); }
    if (a === "s+" || a === "s-") { const st = L(), s = st.lastSet >= dayOf(S.time) - 1 ? st.streak || 0 : 0; return setStreak(s + (a === "s+" ? 1 : -1)); }
    if (a === "s0") return setStreak(0);
    if (a === "odds") return odds();
    if (SCEN[a]) return SCEN[a]();
  }
  function onChange(e) {
    const t = e.target;
    if (t.id === "lbtForce") T.force = t.value;
    if (t.id === "lbtRed") T.reduced = t.checked ? true : null;
    if (t.id === "lbtNo3d") T.no3d = t.checked;
    if (t.id === "lbtSnd" && S.farm) { S.farm.snd = t.checked; save(); }
    keep();
  }
  function show(open) {
    T.open = open; keep();
    el.classList.toggle("on", open); pill.classList.toggle("hide", open);
    clearInterval(iv);
    if (open) { render(); iv = setInterval(() => { const s = el.querySelector("#lbtStatus"); if (s && !(typeof lucky !== "undefined" && lucky)) s.innerHTML = statusHTML(); }, 700); }
  }
  function mount() {
    hook();
    pill = document.createElement("button");
    pill.id = "lbtPill"; pill.textContent = "🧪 Luckybox-Test";
    pill.onclick = () => show(true);
    el = document.createElement("div");
    el.id = "lbTest";
    el.innerHTML = `<div class="lbt-sheet" role="dialog" aria-label="Luckybox-Testbühne">
      <div class="lbt-head"><b>🧪 Luckybox-Testbühne</b><button class="lbt-x" id="lbtX" aria-label="Testbühne einklappen">×</button></div>
      <p class="lbt-note">Nur im Testmodus mit eigenem Spielstand – dein echter Spielstand bleibt unberührt.</p>
      <div id="lbtBody"></div></div>`;
    document.body.appendChild(el); document.body.appendChild(pill);
    el.querySelector("#lbtX").onclick = () => show(false);
    el.addEventListener("click", onClick); el.addEventListener("change", onChange);
    show(T.open !== false);
    let hint = null; try { hint = sessionStorage.getItem(KEY + ".hint"); sessionStorage.removeItem(KEY + ".hint"); } catch (e) { /* egal */ }
    if (hint === "reload") setTimeout(() => toast("Neu geladen mitten im Drehen. Der Gewinn ist gespeichert – „Luckybox öffnen“ zeigt ihn, ohne eine neue Box zu verbrauchen.", "ok"), 900);
  }
  document.addEventListener("DOMContentLoaded", () => setTimeout(mount, 400));
  return T;
})();
