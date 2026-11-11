/* =========================================================================
   LOGISTIKA – jagdtest.js (v353)
   Jagd-Testbühne zum schnellen Durchprobieren des Hochsitzes am Handy oder Rechner:
       index.html?test&jagd
   Nur im Testmodus (eigener Spielstand „logistika.test.v3“) – der echte Spielstand bleibt unberührt.
   Ohne „jagd“ in der Adresse tut diese Datei nichts.
   Bietet: Hochsitz sofort betreten (Spiel wird bei Bedarf gegründet, Hochsitz gilt als gebaut), viel Wild auf kurze
   Entfernung stellen (Hirsch, Keiler, Fasan, gemischt, Fasan im Flug), Wild ruhig halten (kein Abspringen), Bestand
   unbegrenzt, Tageszeit wählen, alles Wild entfernen. Trefferwertung, Medaillen und Preise sind die echten.
   ========================================================================= */
"use strict";

const JAGD_TEST = (() => {
  const on = typeof TEST_MODE !== "undefined" && TEST_MODE && /[?&]jagd(=|&|$)/.test(location.search);
  const T = { on, calm: true, dist: 60 };
  if (!on) return T;
  let el = null, pill = null;
  const inRv = () => typeof HUNT !== "undefined" && HUNT.X && HUNT.X.inRv && HUNT.X.mode === "hold";
  const say = (t, k) => { if (typeof toast === "function") toast(t, k || "ok"); };
  /* Spiel gründen (falls nötig), Hof zeigen, Hochsitz als gebaut eintragen */
  function ready() {
    try {
      if (!S || S.phase === "intro" || !S.player) {
        if (typeof INTRO === "undefined" || !INTRO.draft) startIntro();
        INTRO.draft.name = INTRO.draft.name || "Tessa"; INTRO.draft.company = INTRO.draft.company || "Testrevier"; INTRO.draft.origin = 3;
        beginFounding(); finishFounding();
      }
      if (!S.farm) return false;
      S.farm.tut = { step: 0, done: true };
      const H = S.farm.hunt = S.farm.hunt || {}; if (!H.built) H.built = S.time; H.stock = 6; H.at = S.time;
      if (!document.body.classList.contains("tab-farm")) { showTab("farm"); }
      farmShow();
      return true;
    } catch (e) { say("Testbühne: " + e.message, "warn"); return false; }
  }
  function enter() {
    if (!ready()) return;
    const go = n => {
      if (inRv()) { show(false); return; }
      if (typeof FV !== "undefined" && FV.R && FV.built && !FV.boot && !HUNT.on) HUNT.begin();
      if (n > 0) setTimeout(() => go(n - 1), 500); else say("Der Hof lädt noch – bitte gleich noch einmal „Hochsitz betreten“.", "warn");
    };
    go(60);
  }
  /* Wild auf Wunschentfernung vor den Hochsitz stellen: breitseits, nebeneinander versetzt */
  function put(k, n) {
    if (!inRv()) { say("Erst den Hochsitz betreten.", "warn"); return; }
    const E = HUNT.EYER, F = HUNT.FC, dx = F.x - E[0], dz = F.z - E[2], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l, d0 = T.dist / HUNT.M_PER_U;
    const live = HUNT.X.animals.filter(A => A.st !== "gone").length;
    for (let i = 0; i < n; i++) {
      const j = live + i, side = ((j % 5) - 2) * (k === "fasan" ? 1.2 : 2.6), d = d0 + Math.floor(j / 5) * 3 + (j % 2) * 0.8, kk = k === "mix" ? ["hirsch", "keiler", "fasan"][j % 3] : k;
      HUNT._spawn(kk, false, { x: E[0] + ux * d - uz * side, z: E[2] + uz * d + ux * side, st: kk === "fasan" ? "peck" : kk === "keiler" ? "root" : "graze", t: 600, tx: F.x, tz: F.z,
        ry: Math.atan2(-uz, ux) + (j % 2 ? Math.PI : 0) + (Math.random() - 0.5) * 0.5, score: 0.2 + Math.random() * 0.78 });
    }
    S.farm.hunt.stock = 6; show(false);
  }
  function clearAll() {
    if (!inRv()) return;
    HUNT.X.animals.forEach(A => { if (A.st !== "dead" && A.st !== "fall" && A.st !== "drop") { if (A.node) { const i = FV.R.nodes.indexOf(A.node); if (i >= 0) FV.R.nodes.splice(i, 1); } A.st = "gone"; } });
  }
  function clock(h) { S.time = Math.floor(S.time / 1440) * 1440 + h * 60; say("Uhrzeit: " + h + ":00"); }
  function render() {
    const b = (a, t, c) => `<button class="btn tiny ${c || "ghost"}" data-jt="${a}">${t}</button>`;
    el.querySelector("#jtBody").innerHTML = `
      <div class="jt-row">${b("enter", "🪜 Hochsitz betreten", "")}</div>
      <div class="jt-h">Wild stellen · Entfernung ${[40, 60, 100, 160].map(d => `<button class="jt-d${T.dist === d ? " on" : ""}" data-jt="d${d}">${d} m</button>`).join("")}</div>
      <div class="jt-row">${b("hirsch", "🦌 3 Hirsche")}${b("keiler", "🐗 3 Keiler")}${b("fasan", "🐦 4 Fasane")}</div>
      <div class="jt-row">${b("mix", "🎯 9 gemischt")}${b("fly", "🕊️ Fasan im Flug")}${b("clear", "🧹 Wild entfernen")}</div>
      <div class="jt-h">Verhalten und Licht</div>
      <div class="jt-row">${b("calm", (T.calm ? "✅" : "⬜") + " Wild bleibt ruhig")}${b("h12", "☀️ Mittag")}${b("h20", "🌇 Abend")}${b("h23", "🌙 Nacht")}</div>
      <p class="jt-note">Bestand ist unbegrenzt. Wertung, Medaillen und Trefferbild sind die echten. Erlegtes Wild wie gewohnt bergen.</p>`;
  }
  function show(open) { el.classList.toggle("on", !!open); pill.hidden = !!open; if (open) render(); }
  function onClick(e) {
    const t = e.target.closest("[data-jt]"); if (!t) return;
    const a = t.dataset.jt;
    if (a === "enter") enter();
    else if (/^d\d+$/.test(a)) { T.dist = +a.slice(1); render(); }
    else if (a === "hirsch" || a === "keiler") put(a, 3);
    else if (a === "fasan") put(a, 4);
    else if (a === "mix") put("mix", 9);
    else if (a === "fly") { if (inRv()) { const ok = HUNT._flyEvent(); say(ok ? "Ein Fasan streicht ab." : "Gerade nicht möglich (schon einer in der Luft oder zu viel Wild).", ok ? "ok" : "warn"); show(false); } }
    else if (a === "clear") clearAll();
    else if (a === "calm") { T.calm = !T.calm; render(); }
    else if (/^h\d+$/.test(a)) clock(+a.slice(1));
  }
  function mount() {
    pill = document.createElement("button"); pill.id = "jtPill"; pill.textContent = "🧪 Jagd-Test"; pill.onclick = () => show(true);
    el = document.createElement("div"); el.id = "jgTest";
    el.innerHTML = `<div class="jt-sheet" role="dialog" aria-label="Jagd-Testbühne"><div class="jt-head"><b>🧪 Jagd-Testbühne</b><button class="jt-x" id="jtX" aria-label="Testbühne einklappen">×</button></div>
      <p class="jt-note">Nur im Testmodus mit eigenem Spielstand – dein echter Spielstand bleibt unberührt.</p><div id="jtBody"></div></div>`;
    document.body.appendChild(el); document.body.appendChild(pill);
    el.querySelector("#jtX").onclick = () => show(false);
    el.addEventListener("click", onClick);
    show(true);
    /* Wild ruhig halten und Bestand auffüllen */
    setInterval(() => {
      if (!inRv()) return;
      if (S.farm && S.farm.hunt) S.farm.hunt.stock = 6;
      if (T.calm) HUNT.X.animals.forEach(A => { if (["graze", "root", "peck", "look", "walk", "alert"].includes(A.st)) { A.alert = 0; if (A.st === "alert") A.st = "look"; } });
    }, 250);
  }
  document.addEventListener("DOMContentLoaded", () => setTimeout(mount, 450));
  return T;
})();
