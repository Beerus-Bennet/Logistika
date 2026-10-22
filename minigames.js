/* v85: iOS-Lupe/Textauswahl beim langen Halten unterbinden (außer in Eingabefeldern) */
document.addEventListener("selectstart", e => { const el = e.target && (e.target.closest ? e.target : e.target.parentElement); if (!el || !el.closest("input,textarea,[contenteditable]")) e.preventDefault(); });
/* =========================================================================
   LOGISTIKA – minigames.js
   Kleine Handwerks-Spiele des Erbes, alle im selben Fenster unten:
   Axt (Timing mit Ausdauer), Kettensäge (Fallkerb, Hitze),
   Nageln (Dach, Bauen am See), Kabel anklemmen, Zahnräder einsetzen,
   Förderband flicken, Motor putzen und zusammensetzen, Schatz ausgraben
   und Angeln mit Biss und Drill. Ergebnis kommt per Rückruf zurück.
   ========================================================================= */
const MG = { on: false, kind: null, cb: null, st: null, raf: 0, last: 0 };
const MG_AXE_HP = 21;

MG.open = function (kind, opts, cb) {
  if (MG.on) MG.close(null, true);
  const G = MG_GAMES[kind];
  if (!G) { if (cb) cb({ ok: true, score: 0.6, acc: 0.6 }); return; }
  const el = $("#farmAngel");
  if (!el) return;
  closeFarmPop();
  MG.on = true; MG.kind = kind; MG.cb = cb || null;
  MG.st = Object.assign({ t: 0 }, opts || {});
  el.className = "on mg";
  el.innerHTML = `<div class="fa-box mg-box mgk-${kind}"><button class="fa-x" id="mgX" aria-label="abbrechen">✕</button>
    <div class="fa-h" id="mgH"></div><div class="mg-stage" id="mgStage"></div><div class="fa-msg" id="mgMsg"></div><div class="mg-bar" id="mgBar"></div></div>`;
  $("#mgX").onclick = () => MG.close(G.abort ? G.abort(MG.st) : { ok: false });
  G.start(MG.st);
  MG.last = performance.now();
  const loop = now => {
    if (!MG.on) return;
    MG.raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - MG.last) / 1000);
    MG.last = now;
    MG.st.t += dt;
    if (G.frame) G.frame(MG.st, dt);
  };
  MG.raf = requestAnimationFrame(loop);
  if (FV) FV.touchAt = performance.now();
};
MG.close = function (res, silent) {
  if (!MG.on) return;
  const G = MG_GAMES[MG.kind];
  if (G && G.stop) G.stop(MG.st);
  MG.on = false;
  cancelAnimationFrame(MG.raf);
  const el = $("#farmAngel");
  if (el) { el.className = ""; el.innerHTML = ""; }
  const cb = MG.cb;
  MG.cb = null; MG.kind = null;
  if (cb && !silent) cb(res);
};
function mgH(title, sub) { const h = $("#mgH"); if (h) h.innerHTML = esc(title) + (sub ? `<small>${sub}</small>` : ""); }
/* v69.4: Kopfzeile mit Bild (fertiges HTML) und 3D-Bildchen für Fanggrund und Rute – sonst das Symbol */
function mgHtml(titleHtml, sub) { const h = $("#mgH"); if (h) h.innerHTML = titleHtml + (sub ? `<small>${sub}</small>` : ""); }
function fishThumb(key, fn, emoji) { const u = typeof thumbOf === "function" && typeof THUMB !== "undefined" && !THUMB.failed ? thumbOf(key, fn) : null; return u ? `<img class="ii" src="${u}" alt="">` : emoji; }
function fishGroundIc(G) { return fishThumb("ground:" + G.id, () => FFM.groundIcon(G.id), G.i); }
function fishRodIc(n) { return fishThumb("rod:" + n, () => FFM.rodIcon(n), FRODS[n].i); }
function mgMsg(t, cls) { const m = $("#mgMsg"); if (m) { m.innerHTML = t; m.className = "fa-msg" + (cls ? " " + cls : ""); } }
function mgBar(html) { const b = $("#mgBar"); if (b) b.innerHTML = html; return b; }
function mgStage(html) { const s = $("#mgStage"); if (s) s.innerHTML = html; return s; }
/* kleine Effekte: wackeln/aufploppen, Funken, großes Symbol zum Schluss */
function mgFx(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 460); }
function mgSparks(box, el, col, n) {
  if (!box || !el) return;
  const b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
  const x = r.left - b.left + r.width / 2, y = r.top - b.top + r.height / 2;
  for (let i = 0; i < (n || 8); i++) {
    const s = document.createElement("i"), a = Math.random() * 6.28, d = 16 + Math.random() * 24;
    s.className = "mg-spark";
    s.style.cssText = `left:${x}px;top:${y}px;background:${col};--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px`;
    box.appendChild(s); setTimeout(() => s.remove(), 650);
  }
}
/* die Kettensäge als echtes 3D-Bildchen statt Handsägen-Emoji */
/* Kettensäge im Fällschnitt: das Schwert zeigt nach links in den Stamm, waagerecht */
function mgSawImg() {
  const id = (S.farm && S.farm.tools && S.farm.tools.saw >= 2) ? "saw2" : "saw1";
  const u = typeof thumbOf === "function" ? thumbOf("tool:" + id, () => FWM.tool(id)) : null;
  return u ? `<img src="${u}" alt="Kettensäge" style="transform:rotate(30deg)">` : "⚙️";
}
function mgWin(ic) { const s = $("#mgStage"); if (s) s.insertAdjacentHTML("beforeend", `<div class="mg-win"><b>${ic}</b></div>`); }
/* aufsteigender Text im Spielfeld („PERFEKT!“, „+7“, „Daneben“) */
function mgPop(txt, cls, x, y) {
  const s = $("#mgStage");
  if (!s) return;
  const d = document.createElement("div");
  d.className = "mg-ptxt " + (cls || "");
  d.textContent = txt;
  d.style.left = (x == null ? 50 : x) + "%"; d.style.top = (y == null ? 30 : y) + "%";
  s.appendChild(d); setTimeout(() => d.remove(), 950);
}
/* Konfetti aus der Mitte des Spielfelds */
function mgConfetti(n) {
  const s = $("#mgStage");
  if (!s) return;
  const cols = ["#ffd23f", "#47b84f", "#3f78c8", "#ff6b7d", "#f2731e"];
  const b = s.getBoundingClientRect();
  for (let i = 0; i < (n || 26); i++) {
    const e = document.createElement("i"), a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, d = 50 + Math.random() * 80;
    e.className = "mg-spark conf";
    e.style.cssText = `left:${b.width / 2}px;top:${b.height * 0.55}px;background:${cols[i % cols.length]};--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d + 30).toFixed(1)}px`;
    s.appendChild(e); setTimeout(() => e.remove(), 900);
  }
}
function mgShuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/* Ausdauerleiste fürs Holzfällen */
function mgStaHTML() { const s = Math.floor(farmSta()), m = farmStaMax(); return `<div class="mg-sta"><span>💪</span><i><em style="width:${Math.round(s / m * 100)}%"></em></i><b>${s}</b></div>`; }
/* Brotzeit direkt im Spiel */
function mgFoodHTML() {
  const f = farmFoods().slice(0, 4);
  return f.length ? f.map(id => `<button class="btn tiny ghost" data-eat="${id}">${icHTML(id)} +${FFOOD[id]}</button>`).join("") : `<span class="mg-none">Nichts zu essen im Lager.</span>`;
}
function mgBindFood(after) {
  $$("#mgBar [data-eat]").forEach(b => b.onclick = () => { if (farmEat(b.dataset.eat)) { sfx("collect"); save(); after(); } });
}
/* Fallrichtungen auf dem Bildschirm → Welt (Kamera schaut von Südosten) */
const MG_DIRS = [["↑", -1, -1], ["→", 1, -1], ["↓", 1, 1], ["←", -1, 1]];
function mgDirInfo(t) {
  const len = treeH({ st: "up", sz: t.sz, s: t.s }) * 0.85;
  return MG_DIRS.map(([a, dx, dz]) => {
    const l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
    let block = null;
    for (const o of S.farm.trees) {
      if (o === t || o.st !== "up") continue;
      const px = o.x - t.x, pz = o.z - t.z, along = px * ux + pz * uz, side = Math.abs(px * uz - pz * ux);
      if (along > 0.5 && along < len && side < 1.4) { block = "🌲"; break; }
    }
    if (!block) for (let k = 1; k <= 4; k++) { if (nearPath(t.x + ux * len * k / 4, t.z + uz * len * k / 4) < 1.2) { block = "🛤️"; break; } }
    if (!block && Math.abs(t.x + ux * len) < 15 && Math.abs(t.z + uz * len) < 15) block = "🏠";
    return { a, ry: Math.atan2(ux, uz), block };
  });
}

const MG_GAMES = {
  /* ------------------------------ Axt ------------------------------------ */
  axe: {
    start(st) {
      const t = st.tree, Z = FTREE_SIZE[t.sz], ax = (S.farm.tools.axe || 1) >= 2 ? 1.5 : 1;
      /* je größer der Baum, desto mehr Schläge: Volltreffer 7, gut 3 – Volltreffer in Serie geben Extra-Wucht */
      st.hp = Z.axe || MG_AXE_HP; st.k = ax; st.sta = Z.sta; st.q = 0; st.n = 0; st.p = 0; st.v = 0.75 + t.sz * 0.18; st.dirv = 1; st.combo = 0;
      /* eigentlich zu hart für die Axt: geht, braucht aber deutlich mehr Schläge */
      st.hard = typeof treeHard === "function" && treeHard(t, "axe");
      if (st.hard) { st.hp = Math.round(st.hp * 1.6); st.sta = Z.sta * 1.3; }
      if ((t.dmg || 0) >= st.hp) t.dmg = st.hp - 3;
      st.c = 0.3 + Math.random() * 0.4; st.good = 0.1; st.okw = 0.26; st.cool = 0;
      mgH("🪓 " + (t.n || FSPECIES[t.sp].n) + " fällen · " + Z.n, "Tipp, wenn die Nadel im grünen Feld steht");   /* v59: t.n = Obstbaum */
      mgStage(`<div class="mg-tbar" id="mgT"><i class="ok" id="mgOk"></i><i class="good" id="mgGood"></i><b id="mgNeedle"></b></div>
        <div class="mg-hp" id="mgHpBox"><span>🌳</span><i><em id="mgHp"></em></i></div><div id="mgStaBox">${mgStaHTML()}</div>`);
      $("#mgStage").onpointerdown = e => { e.preventDefault(); MG_GAMES.axe.hit(st); };
      MG_GAMES.axe.zone(st);
      MG_GAMES.axe.bar(st);
      const vt = Math.ceil(st.hp / 7), gt = Math.ceil(st.hp / 3);
      mgMsg(t.dmg ? "Weiter geht’s – der Baum ist schon angeschlagen." : (st.hard ? "Ohne passendes Werkzeug – mühsam, aber es geht: " : "") + `${Z.n === "klein" ? "Kleiner Baum" : Z.n === "groß" ? "Großer Baum" : "Baum"}: ${vt} Volltreffer (dunkelgrün) oder ${gt} gute Schläge – Serien geben Extra-Wucht.`);
      MG_GAMES.axe.hpBar(st);
    },
    bar(st) {
      mgBar(`<button class="btn fa-go" id="mgGo">🪓 Hacken!<small>oder irgendwo oben tippen</small></button>`);
      $("#mgGo").onclick = () => MG_GAMES.axe.hit(st);
    },
    zone(st) {
      const o = $("#mgOk"), g = $("#mgGood");
      if (!o) return;
      o.style.left = (st.c - st.okw / 2) * 100 + "%"; o.style.width = st.okw * 100 + "%";
      g.style.left = (st.c - st.good / 2) * 100 + "%"; g.style.width = st.good * 100 + "%";
    },
    hpBar(st) { const h = $("#mgHp"); if (h) h.style.width = Math.max(0, 100 - (st.tree.dmg || 0) / st.hp * 100) + "%"; const s = $("#mgStaBox"); if (s) s.innerHTML = mgStaHTML(); },
    frame(st, dt) {
      if (st.tired) return;
      st.p += st.dirv * st.v * dt;
      if (st.p > 1) { st.p = 1; st.dirv = -1; } else if (st.p < 0) { st.p = 0; st.dirv = 1; }
      const n = $("#mgNeedle"); if (n) n.style.left = st.p * 100 + "%";
      if (st.cool > 0) st.cool -= dt;
    },
    hit(st) {
      if (st.tired || st.cool > 0 || st.done) return;
      const t = st.tree;
      if (!farmStaUse(st.sta)) { MG_GAMES.axe.tired(st); return; }
      st.cool = 0.18;
      const d = Math.abs(st.p - st.c), q = d < st.good / 2 ? 1 : d < st.okw / 2 ? 0.6 : 0.15;
      st.q += q === 0.15 ? 0 : q; st.n++;
      st.combo = q === 1 ? st.combo + 1 : 0;
      const bonus = st.combo >= 2 ? Math.min(4, st.combo) : 0, dmg = (q === 1 ? 7 : q > 0.5 ? 3 : 0) + bonus;
      t.dmg = (t.dmg || 0) + dmg;
      WV.hit = { id: t.id, t0: wnow() };
      FV.R.burst({ x: t.x + 0.3, y: 0.6, z: t.z + 0.3, n: q === 1 ? 10 + bonus * 3 : 5, col: [[0.9, 0.78, 0.55, 1], [0.75, 0.55, 0.32, 1]], speed: 1.4, up: 1.6, size: 0.07, shape: 1 });
      sfx(q === 1 ? "chop" : q > 0.5 ? "chop" : "bad");
      /* Rückmeldung im Spielfeld: Funken an der Nadel, Zahl steigt auf */
      const nd = $("#mgNeedle"), stg = $("#mgStage");
      if (q === 1) { mgSparks(stg, nd, "#ffd23f", 10 + bonus * 3); mgPop(bonus ? `+${dmg} 🔥 ×${st.combo}` : "+7", "gold", st.p * 100, 8); mgFx($("#mgHpBox"), "mg-shake"); if (bonus) sfx("spark"); }
      else if (q > 0.5) { mgSparks(stg, nd, "#47b84f", 6); mgPop("+3", "green", st.p * 100, 8); }
      else { mgFx($("#mgT"), "mg-shake"); mgPop("Daneben", "red", st.p * 100, 8); }
      mgMsg(q === 1 ? (st.combo >= 2 ? `🔥 Serie ×${st.combo} – Extra-Wucht!` : "💥 Volltreffer!") : q > 0.5 ? "👍 Gut getroffen" : "😬 Daneben – kostet trotzdem Kraft", q === 1 ? "ok" : q > 0.5 ? "" : "bad");
      if (FV.R) FV.touchAt = performance.now();
      st.c = 0.18 + Math.random() * 0.64;
      st.v = Math.min(2.2, st.v + 0.04);
      MG_GAMES.axe.zone(st);
      MG_GAMES.axe.hpBar(st);
      if (t.dmg >= st.hp) {
        st.done = true;
        const acc = st.n ? st.q / st.n : 0.6;
        mgMsg(acc > 0.85 ? "🌲 Sauber gefällt – das gibt einen Stamm extra!" : "🌲 Baum fällt!", "ok");
        mgWin("🌲"); mgConfetti(acc > 0.85 ? 34 : 20); sfx("thud");
        const dir = -2.36 + (Math.random() - 0.5) * 0.8;
        setTimeout(() => MG.close({ ok: true, acc, dir, dirOk: true }), 850);
      }
    },
    tired(st) {
      st.tired = true;
      mgMsg("💪 Keine Kraft mehr – iss was oder mach später weiter, der Baum bleibt angeschlagen.", "bad");
      mgBar(mgFoodHTML() + `<button class="btn tiny" id="mgLater">Später weiter</button>`);
      mgBindFood(() => { st.tired = false; MG_GAMES.axe.bar(st); MG_GAMES.axe.hpBar(st); mgMsg("Frisch gestärkt – weiter!", "ok"); });
      $("#mgLater").onclick = () => MG.close({ ok: false });
    },
    abort() { return { ok: false }; }
  },

  /* -------------------------- Kettensäge ---------------------------------- */
  saw: {
    start(st) {
      const t = st.tree;
      st.ph = 0; st.dirs = mgDirInfo(t); st.prog = 0; st.heat = 0; st.over = 0; st.stall = 0; st.hold = false; st.mk = 0; st.mv = 1; st.snd = 0;
      st.pow = (S.farm.tools.saw || 1) >= 2 ? 1.6 : 1;                 /* Profi-Säge: schneller, wird weniger heiß */
      /* die Fallrichtung sucht der Holzfäller selbst aus: ins Freie, nicht auf Bäume, Wege oder Häuser */
      const free = st.dirs.filter(d => !d.block);
      st.dir = free.length ? free[Math.floor(Math.random() * free.length)] : st.dirs[0];
      st.dirOk = !st.dir.block || !free.length;
      /* v85: Ich-Perspektive (fpsaw.js) – ohne Engine oder in einer anderen Ansicht bleibt es das 2D-Fenster */
      st.fp = null;
      if (typeof SAW3D !== "undefined" && SAW3D.can()) {
        st.fp = SAW3D.begin(t, (S.farm.tools.saw || 1) >= 2 ? "saw2" : "saw1");
        const el = $("#farmAngel"); if (el && st.fp) el.classList.add("mg3d");
        /* 3D: der Kerb zeigt nach rechts – der Baum fällt dorthin; steht dort etwas im Weg, kann er hängen bleiben */
        if (st.fp) { st.dir = { ry: st.fp.fallRy, block: st.fp.fallBlock }; st.dirOk = !st.fp.fallBlock; }
      }
      MG_GAMES.saw.kerb(st);
    },
    /* Fallkerb: nur ein Schnitt im grünen Bereich zählt – daneben heißt nochmal.
       Großer Baum: dicker Stamm, schmalerer Bereich, schnellere Markierung. */
    kerb(st) {
      st.ph = 1; st.miss = 0; st.mk = Math.random() < 0.5 ? 0.95 : 0.6; st.mv = -1;
      const sz = st.tree.sz;
      st.zc = 0.28; st.zh = 0.12 - (sz - 1) * 0.015; st.mspd = 0.75 + sz * 0.12;
      const W = [0, 50, 64, 82, 104][sz], H = [0, 112, 124, 138, 150][sz];
      mgH("⛓️ " + FSPECIES[st.tree.sp].n + " sägen · " + FTREE_SIZE[sz].n, "Fallkerb: tipp, wenn die Markierung im grünen Bereich ist");
      mgStage(`<div class="mg-trunk" id="mgTr" style="width:${W}px;height:${H}px"><i class="tgt" style="bottom:${(st.zc - st.zh) * 100}%;height:${st.zh * 200}%"><u style="bottom:${(0.5 - 0.35 / 2) * 100}%;height:35%"></u></i><b id="mgMk"></b></div>`);
      mgMsg("Erst der Fallkerb – nur im grünen Bereich sägen!", "");
      mgBar(`<button class="btn fa-go" id="mgGo">✂️ Kerb setzen</button>`);
      const go = () => {
        if (st.ph !== 1 || st.wait) return;
        const d = Math.abs(st.mk - st.zc), mk = $("#mgMk"), stg = $("#mgStage");
        if (d > st.zh) {
          /* daneben: kein Kerb, nochmal versuchen */
          st.miss++;
          sfx("bad");
          mgFx($("#mgTr"), "mg-shake");
          mgPop(st.mk > st.zc ? "Zu hoch!" : "Zu tief!", "red", 50, 100 - st.mk * 100 - 10);
          if (st.miss >= 3 && st.zh < 0.14) { st.zh += 0.02; const tg = $("#mgTr .tgt"); if (tg) { tg.style.bottom = (st.zc - st.zh) * 100 + "%"; tg.style.height = st.zh * 200 + "%"; } }
          mgMsg(st.miss >= 3 ? "Daneben – der grüne Bereich ist jetzt etwas breiter. Nochmal!" : "Daneben – so fällt der Baum nicht. Nochmal, auf Kniehöhe!", "bad");
          st.wait = true; setTimeout(() => { st.wait = false; }, 350);
          if (st.fp) SAW3D.ev("miss", st);
          return;
        }
        const perfect = d <= st.zh * 0.35;
        st.p1 = clamp((perfect ? 1 : 0.8 - d / st.zh * 0.25) - st.miss * 0.08, 0.35, 1);
        /* 3D: der V-Kerb braucht zwei Treffer – jeder dringt tiefer in den Stamm (kerbProgress) */
        st.hits = (st.hits || 0) + 1; st.p1sum = (st.p1sum || 0) + st.p1; st.need = st.fp ? 2 : 1;
        sfx("saw");
        if (perfect) { sfx("level"); mgSparks(stg, mk, "#ffd23f", 16); mgPop("PERFEKT!", "gold", 50, 100 - st.mk * 100 - 14); }
        else { sfx("chop"); mgSparks(stg, mk, "#47b84f", 9); mgPop("Treffer!", "green", 50, 100 - st.mk * 100 - 14); }
        if (st.hits < st.need) {
          if (st.fp) SAW3D.ev("notch", st);
          mgMsg("✂️ Erster Schnitt sitzt – noch einmal, tiefer!", "ok");
          st.wait = true; st.mspd *= 1.2; st.zh *= 0.9; st.mv = st.mk > st.zc ? -1 : 1;
          setTimeout(() => { st.wait = false; }, 650);
          return;
        }
        st.p1 = st.p1sum / st.hits;
        /* der Kerb bleibt sichtbar im Stamm */
        const tr = $("#mgTr"); if (tr) tr.insertAdjacentHTML("beforeend", `<i class="notch" style="bottom:${st.mk * 100}%"></i>`);
        st.ph = 1.5;
        if (st.fp) SAW3D.ev("notch", st);
        mgMsg(perfect ? "✂️ Perfekter Kerb – das gibt einen Stamm extra!" : st.miss ? "✂️ Sitzt! Jetzt der Fällschnitt." : "✂️ Sauber gesetzt! Jetzt der Fällschnitt.", "ok");
        setTimeout(() => { if (MG.on && MG.kind === "saw" && st.ph === 1.5) MG_GAMES.saw.cut(st); }, 750);
      };
      $("#mgGo").onclick = go;
      $("#mgStage").onpointerdown = e => { e.preventDefault(); go(); };
      /* 3D: irgendwo auf dem Bild tippen */
      if (st.fp) $("#farmAngel").onpointerdown = e => { if (e.target.closest(".fa-box")) return; e.preventDefault(); go(); };
    },
    cut(st) {
      st.ph = 2;
      mgH("⛓️ Fällschnitt", "Gedrückt halten zum Sägen – loslassen kühlt den Motor");
      st.tw = [0, 58, 72, 90, 112][st.tree.sz] || 86;
      /* Fällschnitt: die Säge setzt rechts in der Kerbspitze an und sägt auf Kerbhöhe quer durch */
      mgStage(`<div class="mg-log2 hold" id="mgLog"><div class="mg-trk" style="width:${st.tw}px;margin-left:${-st.tw / 2}px"><i class="notch"></i><i class="mg-cut" id="mgCut"></i></div><span class="mg-cs" id="mgCs" style="left:calc(50% + ${st.tw / 2 - 15}px)">${mgSawImg()}</span></div>
        <div class="mg-hp"><span>🪵</span><i><em id="mgPr" style="width:0%"></em></i></div><div class="mg-heat"><span>🌡️</span><i><em id="mgHeat"></em></i></div>`);
      mgMsg(st.tree.sz >= 3 ? "Dicker Stamm – halten zum Sägen, den Motor nicht überhitzen." : "Halten zum Sägen – loslassen kühlt den Motor.", "");
      const b = mgBar(`<button class="btn fa-go hold" id="mgGo">⛓️ Halten zum Sägen</button>`).firstChild;
      const on = e => { e.preventDefault(); st.hold = true; b.classList.add("on"); };
      const off = () => { st.hold = false; b.classList.remove("on"); };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
      $("#mgStage").addEventListener("pointerdown", on); $("#mgStage").addEventListener("pointerup", off); $("#mgStage").addEventListener("pointerleave", off);
      if (st.fp) {
        const ov = $("#farmAngel");
        ov.onpointerdown = e => { if (e.target.closest(".fa-box")) return; on(e); };
        ov.onpointerup = off; ov.onpointercancel = off;
      }
    },
    frame(st, dt) {
      const t = st.tree;
      if (st.ph === 1) {
        st.mk += st.mv * dt * (st.mspd || 0.9);
        if (st.mk > 1) { st.mk = 1; st.mv = -1; } else if (st.mk < 0) { st.mk = 0; st.mv = 1; }
        const m = $("#mgMk"); if (m) m.style.bottom = st.mk * 100 + "%";
      }
      if (st.ph !== 2 || st.done) return;
      if (st.stall > 0) { st.stall -= dt; st.heat = Math.max(0, st.heat - dt * 0.5); if (st.stall <= 0) mgMsg("Motor läuft wieder.", ""); }
      else if (st.hold) {
        st.prog += dt * (0.34 - t.sz * 0.04) * (st.p1 > 0.6 ? 1.15 : 1) * (st.pow || 1);
        st.heat += dt * (0.42 + t.sz * 0.05) * (st.pow > 1 ? 0.8 : 1);
        const lg = $("#mgLog");
        if (lg && Math.random() < dt * 30) {
          const tw = st.tw || 86, d = document.createElement("i"), r = lg.getBoundingClientRect(), x = r.width / 2 + tw / 2 - 11 - Math.min(1, st.prog) * (tw - 14);
          d.className = "mg-dust"; d.style.cssText = `left:${x}px;top:${r.height * 0.46}px;--dx:${(Math.random() * 40 - 10).toFixed(0)}px;--dy:${(Math.random() * 30 - 5).toFixed(0)}px`;
          lg.appendChild(d); setTimeout(() => d.remove(), 720);
        }
        st.snd -= dt;
        if (st.snd <= 0) { st.snd = 0.22; sfx("saw"); }
        WV.hit = { id: t.id, t0: wnow() - 0.15 };
        if (Math.random() < dt * 14) FV.R.emit({ x: t.x + 0.35, y: 0.35, z: t.z + 0.35, vx: (Math.random() - 0.3) * 2, vy: 1.2, vz: (Math.random() - 0.3) * 2, g: -4, life: 0.6, size: 0.05, col: [0.95, 0.85, 0.6, 1], shape: 1 });
        if (st.heat >= 1) { st.over++; st.stall = 1.6; st.heat = 0.85; sfx("bad"); if (st.fp) SAW3D.ev("stall", st); mgMsg("🔥 Überhitzt! Der Motor ist aus – kurz warten.", "hot"); }
        if (FV) FV.touchAt = performance.now();
      } else st.heat = Math.max(0, st.heat - dt * 0.65);
      const p = $("#mgPr"), h = $("#mgHeat"), cu = $("#mgCut"), cs = $("#mgCs");
      if (p) p.style.width = Math.min(100, st.prog * 100) + "%";
      const pr = Math.min(1, st.prog);
      if (cu) cu.style.width = `calc(${(pr * 100).toFixed(1)}% - ${(pr * 8).toFixed(1)}px)`;
      if (cs) { const tw = st.tw || 86; cs.style.left = `calc(50% + ${tw / 2 - 15}px - ${Math.round(pr * (tw - 14))}px)`; cs.classList.toggle("on", !!st.hold && !(st.stall > 0)); }
      if (h) { h.style.width = Math.min(100, st.heat * 100) + "%"; h.className = st.heat > 0.75 ? "hot" : ""; }
      if (st.prog >= 1) {
        st.done = true;
        const hung = st.over >= 2 || (!st.dirOk && Math.random() < 0.5);
        /* Stamm extra nur für einen perfekten Kerb (Überhitzen kostet etwas) */
        const acc = clamp(st.p1 * 0.75 + (1 - st.over * 0.25) * 0.25, 0, 1);
        mgMsg(hung ? "😬 Der Baum hängt kurz fest … aber er fällt." : st.dirOk ? "🌲 Baum fällt – genau wie geplant!" : "🌲 Baum fällt!", hung ? "bad" : "ok");
        mgWin("🌲"); mgConfetti(acc > 0.85 ? 34 : 20); sfx("thud");
        setTimeout(() => MG.close({ ok: true, acc, dir: st.dir.ry, dirOk: st.dirOk, hung }), st.fp ? 450 : 900);
      }
    },
    stop(st) {
      const el = $("#farmAngel"); if (el) { el.onpointerdown = el.onpointerup = el.onpointercancel = null; }
      if (st.fp && typeof SAW3D !== "undefined") SAW3D.end(!!st.done);
    },
    abort(st) { if (st.ph === 2 && st.prog > 0.05) toast("Der Baum bleibt stehen – der Sprit ist leider weg.", "warn"); return { ok: false }; }
  },

  /* ----------------------------- Nageln ----------------------------------- */
  nails: {
    start(st) {
      st.total = st.short ? 5 : 8; st.i = 0; st.good = 0; st.okc = 0; st.cur = null; st.wait = 0.5;
      mgH(st.title || "🔨 Dach decken", "Zuschlagen, wenn der Ring genau auf dem Nagelkopf liegt");
      mgStage(`<div class="mg-board" id="mgBoard"></div>`);
      mgMsg("Nagel für Nagel. Tipp, wenn der Ring den Kopf trifft.");
      mgBar(`<div class="mg-count" id="mgCnt">0 / ${st.total}</div>`);
      $("#mgStage").onpointerdown = e => { e.preventDefault(); MG_GAMES.nails.hit(st); };
    },
    spawn(st) {
      const b = $("#mgBoard");
      if (!b) return;
      st.cur = { x: 10 + Math.random() * 80, y: 18 + Math.random() * 64, t: 0, dur: Math.max(0.75, 1.15 - st.i * 0.04) };
      b.innerHTML = Array.from({ length: st.i }, (_, k) => `<span class="mg-done" style="left:${(k * 37 % 90) + 5}%;top:${(k * 53 % 70) + 15}%">●</span>`).join("")
        + `<span class="mg-nail" style="left:${st.cur.x}%;top:${st.cur.y}%"><i id="mgRing"></i><b></b></span>`;
    },
    frame(st, dt) {
      if (st.done) return;
      if (!st.cur) { st.wait -= dt; if (st.wait <= 0) MG_GAMES.nails.spawn(st); return; }
      st.cur.t += dt;
      const k = st.cur.t / st.cur.dur, r = $("#mgRing");
      if (r) { const s = 3.2 - k * 2.9; r.style.transform = `translate(-50%,-50%) scale(${Math.max(0.05, s)})`; }
      if (k > 1.15) MG_GAMES.nails.res(st, 0);
    },
    hit(st) {
      if (!st.cur || st.done) return;
      const s = 3.2 - (st.cur.t / st.cur.dur) * 2.9, d = Math.abs(s - 1);
      MG_GAMES.nails.res(st, d < 0.22 ? 1 : d < 0.55 ? 0.6 : 0);
    },
    res(st, q) {
      const nl = st.cur, bd = $("#mgBoard");
      if (nl && q && bd) { bd.insertAdjacentHTML("beforeend", `<span class="mg-ham" style="left:${nl.x}%;top:${nl.y}%">🔨</span>`); mgSparks(bd, bd.lastElementChild, "#ffd23f", q === 1 ? 7 : 3); }
      if (nl && !q && bd) mgFx(bd, "mg-shake");
      if (q === 1) st.good++; else if (q) st.okc++;
      sfx(q ? "hammer" : "bad");
      mgMsg(q === 1 ? "💥 Sitzt!" : q ? "👍 Geht so" : "😬 Krumm – der nächste!", q === 1 ? "ok" : q ? "" : "bad");
      st.i++; st.cur = null; st.wait = 0.35;
      const c = $("#mgCnt"); if (c) c.textContent = st.i + " / " + st.total;
      if (st.i >= st.total) {
        st.done = true;
        const score = (st.good + st.okc * 0.6) / st.total;
        if (score >= 0.4) { mgMsg("✅ Fertig – " + Math.round(score * 100) + " % sauber genagelt!", "ok"); setTimeout(() => MG.close({ ok: true, score }), 600); }
        else {
          mgMsg("Zu viele krumme Nägel – das hält nicht. Nochmal!", "bad");
          mgBar(`<button class="btn fa-go" id="mgAgain">🔨 Nochmal</button>`);
          $("#mgAgain").onclick = () => MG_GAMES.nails.start(st);
        }
      }
    }
  },

  /* --------------------------- Kabel anklemmen -----------------------------
     Jedes Kabel an die Klemme mit derselben Farbe – antippen und antippen
     oder rüberziehen. Die Reihenfolge ist egal. */
  wires: {
    W: [["pe", "PE", "#3fae3a", "#f2d32a"], ["n", "N", "#2f6fd0"], ["l1", "L1", "#7a4a2a"], ["l2", "L2", "#1d1d20"], ["l3", "L3", "#8a8f96"]],
    bg(w) { return w[3] ? `repeating-linear-gradient(90deg,${w[2]} 0 8px,${w[3]} 8px 16px)` : w[2]; },
    start(st) {
      st.i = 0; st.miss = 0; st.sel = null; st.done = {};
      st.ends = mgShuffle([0, 1, 2, 3, 4]); st.terms = mgShuffle([0, 1, 2, 3, 4]);
      mgH(st.title || "⚡ Elektrik", "Jedes Kabel an die Klemme mit derselben Farbe");
      this.draw(st);
      mgMsg("Kabel antippen, dann die passende Klemme – oder rüberziehen.");
      mgBar(`<div class="mg-count" id="mgCnt">0 / 5</div>`);
    },
    draw(st) {
      const W = this.W;
      mgStage(`<div class="mg-elec" id="mgEl"><svg id="mgWs"></svg><span class="mg-bulb${st.i >= 5 ? " on" : ""}">💡</span>
        <div class="mg-ends">${st.ends.map(i => `<button class="mg-end${st.done[i] ? " done" : ""}${st.sel === i ? " sel" : ""}" data-w="${i}"><i style="background:${this.bg(W[i])}"></i><b></b></button>`).join("")}</div>
        <div class="mg-terms">${st.terms.map(i => `<button class="mg-tm${st.done[i] ? " done" : ""}" data-t="${i}"><i style="background:${this.bg(W[i])}"></i>${W[i][1]}</button>`).join("")}</div></div>`);
      this.lines(st);
      const el = $("#mgEl");
      $$("#mgEl [data-w]").forEach(b => b.onpointerdown = e => { e.preventDefault(); st.sel = +b.dataset.w; st.drag = true; sfx("tap"); $$("#mgEl .mg-end").forEach(x => x.classList.toggle("sel", +x.dataset.w === st.sel)); });
      $$("#mgEl [data-t]").forEach(b => b.onclick = () => { if (st.sel != null) this.connect(st, st.sel, +b.dataset.t, b); });
      el.onpointermove = e => { if (!st.drag || st.sel == null) return; this.temp(st, e); };
      el.onpointerup = e => {
        if (!st.drag) return;
        st.drag = false;
        const t = document.elementFromPoint(e.clientX, e.clientY), tb = t && t.closest && t.closest("[data-t]");
        const tmp = $("#mgTmp"); if (tmp) tmp.remove();
        if (tb && st.sel != null) this.connect(st, st.sel, +tb.dataset.t, tb);
      };
    },
    pos(el, side) {
      const r = el.getBoundingClientRect(), b = $("#mgEl").getBoundingClientRect();
      return side === "end" ? [r.right - b.left - 14, r.top - b.top + r.height / 2] : [r.left - b.left + 2, r.top - b.top + r.height / 2];
    },
    path(a, b) { const mx = (a[0] + b[0]) / 2; return `M${a[0]},${a[1]} C${mx},${a[1] + 18} ${mx},${b[1] + 18} ${b[0]},${b[1]}`; },
    lines(st, fresh) {
      const sv = $("#mgWs");
      if (!sv) return;
      sv.innerHTML = Object.keys(st.done).map(k => {
        const i = +k, e = $(`#mgEl [data-w="${i}"]`), t = $(`#mgEl [data-t="${i}"]`);
        if (!e || !t) return "";
        const w = this.W[i];
        return `<path class="${fresh === i ? "new" : ""}" d="${this.path(this.pos(e, "end"), this.pos(t, "term"))}" stroke="${w[2]}"/>` + (w[3] ? `<path class="${fresh === i ? "new" : ""}" d="${this.path(this.pos(e, "end"), this.pos(t, "term"))}" stroke="${w[3]}" stroke-dasharray="7 9"/>` : "");
      }).join("");
    },
    temp(st, e) {
      const sv = $("#mgWs"), en = $(`#mgEl [data-w="${st.sel}"]`);
      if (!sv || !en) return;
      const b = $("#mgEl").getBoundingClientRect(), p = [e.clientX - b.left, e.clientY - b.top];
      let tmp = $("#mgTmp");
      if (!tmp) { sv.insertAdjacentHTML("beforeend", `<path id="mgTmp" stroke="${this.W[st.sel][2]}" opacity=".7"/>`); tmp = $("#mgTmp"); }
      tmp.setAttribute("d", this.path(this.pos(en, "end"), p));
    },
    connect(st, w, t, tb) {
      if (st.done[w]) return;
      if (w === t) {
        st.done[w] = true; st.i++; st.sel = null; sfx("clunk");
        const W = this.W[w];
        mgMsg("✔️ " + W[1] + " sitzt.", "ok");
        const c = $("#mgCnt"); if (c) c.textContent = st.i + " / 5";
        this.draw(st); this.lines(st, w);
        const tt = $(`#mgEl [data-t="${t}"]`); if (tt) mgSparks($("#mgEl"), tt, W[2], 8);
        if (st.i >= 5) {
          const score = clamp(1 - st.miss * 0.12, 0.3, 1);
          mgMsg("💡 Licht an – die Halle hat wieder Strom!", "ok"); sfx("level");
          mgWin("💡");
          setTimeout(() => MG.close({ ok: true, score }), 900);
        }
      } else {
        st.miss++; sfx("spark");
        mgMsg("⚡ Funken! Die Farbe passt nicht.", "bad");
        if (tb) { mgFx(tb, "mg-shake"); mgSparks($("#mgEl"), tb, "#ffd23f", 10); }
      }
    },
    /* alte Aufrufe (Tests): das nächste Kabel richtig anklemmen */
    pick(st) { const w = [0, 1, 2, 3, 4].find(i => !st.done[i]); if (w != null) this.connect(st, w, w); }
  },

  /* ----------------------- Teile einsetzen (Zahnräder, Band) ---------------- */
  gears: {
    PX: { S: 38, M: 50, L: 62, XL: 74 },
    svg(teeth) {
      const n = teeth, R = 46, r = 37, pts = [];
      for (let i = 0; i < n * 2; i++) {
        const a0 = (i / (n * 2)) * Math.PI * 2, a1 = ((i + 1) / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : R;
        pts.push([Math.cos(a0 + 0.04) * rr, Math.sin(a0 + 0.04) * rr], [Math.cos(a1 - 0.04) * rr, Math.sin(a1 - 0.04) * rr]);
      }
      return `<svg class="mg-gsv" viewBox="-50 -50 100 100"><path d="M${pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L")} Z"/><circle r="9"/></svg>`;
    },
    teeth(k) { return { S: 8, M: 10, L: 12, XL: 14 }[k]; },
    start(st) {
      const n = st.quick ? 2 : 4, sizes = ["S", "M", "L", "XL"];
      st.slots = mgShuffle(sizes).slice(0, n).map(k => ({ k, px: this.PX[k], ok: false }));
      st.parts = mgShuffle(st.slots.map(s => s.k).concat(st.quick ? [] : [pick(sizes)]));
      st.sel = null; st.miss = 0;
      mgH(st.title || "⚙️ Getriebe", "Rad antippen, dann die Achse in derselben Größe");
      this.draw(st);
      mgMsg("Die Achsen zeigen die Größe – S, M, L, XL.");
      mgBar("");
    },
    draw(st) {
      mgStage(`<div class="mg-gearbox${st.slots.every(x => x.ok) ? " mg-spin" : ""}">${st.slots.map((s, i) => `<button class="mg-ax${s.ok ? " ok mg-spin" : ""}" data-s="${i}" style="--d:${s.px}px">${s.ok ? this.svg(this.teeth(s.k)) : ""}<small>${s.k}</small></button>`).join("")}</div>
        <div class="mg-tray">${st.parts.map((k, i) => k ? `<button class="mg-part gp${st.sel === i ? " sel" : ""}" data-p="${i}"><span style="--d:${Math.round(this.PX[k] * 0.72)}px">${this.svg(this.teeth(k))}</span><small>${k}</small></button>` : "").join("")}</div>`);
      $$("#mgStage [data-p]").forEach(b => b.onclick = () => { st.sel = +b.dataset.p; sfx("tap"); this.draw(st); });
      $$("#mgStage [data-s]").forEach(b => b.onclick = () => this.put(st, +b.dataset.s));
    },
    put(st, i) {
      const s = st.slots[i];
      if (s.ok || st.sel == null) return;
      const ord = { S: 1, M: 2, L: 3, XL: 4 };
      if (st.parts[st.sel] === s.k) {
        s.ok = true; st.parts[st.sel] = null; st.sel = null; sfx("clunk"); mgMsg("✔️ Passt!", "ok");
        this.draw(st);
        const b = $(`#mgStage [data-s="${i}"]`); if (b) { mgFx(b, "mg-popin"); mgSparks($("#mgStage"), b, "#ffd23f", 6); }
      } else {
        st.miss++; sfx("bad");
        mgMsg("✖️ Zu " + (ord[st.parts[st.sel]] > ord[s.k] ? "groß" : "klein") + " für diese Achse.", "bad");
        const b = $(`#mgStage [data-s="${i}"]`); if (b) mgFx(b, "mg-shake");
      }
      if (st.slots.every(x => x.ok)) {
        this.draw(st);
        mgMsg("⚙️ Alles greift ineinander – läuft!", "ok"); sfx("level");
        setTimeout(() => MG.close({ ok: true, score: clamp(1 - st.miss * 0.15, 0.3, 1) }), 850);
      }
    }
  },
  belt: {
    P: [["roll", "🛞", "Rolle"], ["gurt", "▬", "Gurt"], ["bolt", "🔩", "Schraube"], ["arm", "📐", "Halter"], ["mot", "⚙️", "Antrieb"]],
    start(st) {
      st.slots = mgShuffle(this.P).slice(0, 4).map(p => ({ k: p[0], i: p[1], n: p[2], ok: false }));
      st.parts = mgShuffle(st.slots.map(s => s.k));
      st.sel = null; st.miss = 0;
      mgH(st.title || "🛞 Förderband", "Teil antippen, dann die Lücke mit demselben Umriss");
      this.draw(st);
      mgMsg("Jede Lücke zeigt blass, was hineingehört.");
      mgBar("");
    },
    draw(st) {
      const info = k => this.P.find(p => p[0] === k), all = st.slots.every(x => x.ok);
      mgStage(`<div class="mg-conv"><div class="mg-holes">${st.slots.map((s, i) => `<button class="mg-hole${s.ok ? " ok" : ""}" data-s="${i}"><span>${s.i}</span></button>`).join("")}</div>
        <div class="mg-band${all ? " run" : ""}"></div><i class="mg-roll l"></i><i class="mg-roll r"></i>${all ? `<span class="mg-log">🪵</span>` : ""}</div>
        <div class="mg-tray">${st.parts.map((k, i) => k ? `<button class="mg-part${st.sel === i ? " sel" : ""}" data-p="${i}"><span>${info(k)[1]}</span><small>${esc(info(k)[2])}</small></button>` : "").join("")}</div>`);
      $$("#mgStage [data-p]").forEach(b => b.onclick = () => { st.sel = +b.dataset.p; sfx("tap"); this.draw(st); });
      $$("#mgStage [data-s]").forEach(b => b.onclick = () => this.put(st, +b.dataset.s));
    },
    put(st, i) {
      const s = st.slots[i];
      if (s.ok || st.sel == null) return;
      if (st.parts[st.sel] === s.k) {
        s.ok = true; st.parts[st.sel] = null; st.sel = null; sfx("clunk"); mgMsg("✔️ " + s.n + " sitzt.", "ok");
        this.draw(st);
        const b = $(`#mgStage [data-s="${i}"]`); if (b) { mgFx(b, "mg-popin"); mgSparks($("#mgStage"), b, "#ffd23f", 6); }
      } else {
        st.miss++; sfx("bad"); mgMsg("✖️ Das passt da nicht rein.", "bad");
        const b = $(`#mgStage [data-s="${i}"]`); if (b) mgFx(b, "mg-shake");
      }
      if (st.slots.every(x => x.ok)) { mgMsg("🛞 Das Band läuft wieder rund!", "ok"); sfx("level"); setTimeout(() => MG.close({ ok: true, score: clamp(1 - st.miss * 0.15, 0.3, 1) }), 900); }
    }
  },

  /* --------------------------- Motor richten ------------------------------- */
  motor: {
    PARTS: [["Kolben", "🛢️"], ["Zündkerze", "🕯️"], ["Luftfilter", "🧽"], ["Deckel", "🔩"]],
    start(st) {
      st.ph = 0; st.miss = 0; st.i = 0;
      st.dirt = Array.from({ length: 6 }, (_, k) => ({ x: 14 + (k % 3) * 34 + Math.random() * 10, y: 22 + Math.floor(k / 3) * 46 + Math.random() * 10, hp: 2 }));
      mgH(st.title || "🔧 Motor", "Erst sauber wischen, dann die Teile der Reihe nach einsetzen");
      this.draw(st);
      mgMsg("🧽 Mit dem Finger über den Dreck wischen.");
      mgBar(`<div class="mg-count" id="mgCnt">Dreck: ${st.dirt.length}</div>`);
    },
    draw(st) {
      if (st.ph === 0) {
        mgStage(`<div class="mg-eng2" id="mgMot"><div class="mg-block">${[0, 1, 2, 3].map(k => `<i style="left:${16 + k * 32}px"></i>`).join("")}</div>
          ${st.dirt.map((d, i) => d.hp > 0 ? `<i class="mg-goo h${d.hp}" data-i="${i}" style="left:${d.x}%;top:${d.y}%"></i>` : "").join("")}<span class="mg-sponge" id="mgSp">🧽</span></div>`);
        const m = $("#mgMot"), sp = $("#mgSp");
        const scrub = e => {
          const r = m.getBoundingClientRect();
          sp.style.display = "block"; sp.style.left = (e.clientX - r.left) + "px"; sp.style.top = (e.clientY - r.top) + "px";
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (el && el.dataset && el.dataset.i != null) {
            const d = st.dirt[+el.dataset.i];
            if (d.hp > 0 && (!d.at || performance.now() - d.at > 110)) {
              d.at = performance.now(); d.hp--; sfx("swish");
              for (let k = 0; k < 3; k++) { const b = document.createElement("i"); b.className = "mg-bub"; b.style.left = (e.clientX - r.left + (Math.random() - 0.5) * 24) + "px"; b.style.top = (e.clientY - r.top + (Math.random() - 0.5) * 16) + "px"; m.appendChild(b); setTimeout(() => b.remove(), 750); }
              if (d.hp > 0) el.className = "mg-goo h" + d.hp; else el.remove();
              this.check(st);
            }
          }
        };
        m.onpointerdown = e => { e.preventDefault(); st.down = true; scrub(e); };
        m.onpointermove = e => { if (st.down) scrub(e); };
        m.onpointerup = m.onpointerleave = () => { st.down = false; sp.style.display = "none"; };
      } else {
        const P = this.PARTS, run = st.i >= 4;
        mgStage(`<div class="mg-eng2${run ? " run" : ""}" style="height:74px"><div class="mg-block" style="top:58%;height:50px;margin-top:-25px">${[0, 1, 2, 3].map(k => `<i style="left:${16 + k * 32}px;height:24px;top:10px"></i>`).join("")}</div>${run ? `<i class="mg-puff"></i><i class="mg-puff" style="animation-delay:.5s"></i>` : ""}</div>
          <div class="mg-slots">${P.map((p, i) => `<span class="${i < st.i ? "on" : i === st.i ? "next" : ""}">${i < st.i ? p[1] : i + 1}<small>${esc(p[0])}</small></span>`).join("")}</div>
          <div class="mg-tray">${st.tray.map(i => i < st.i ? "" : `<button class="mg-part" data-p="${i}"><span>${P[i][1]}</span><small>${esc(P[i][0])}</small></button>`).join("")}</div>`);
        $$("#mgStage [data-p]").forEach(b => b.onclick = () => this.put(st, +b.dataset.p, b));
      }
    },
    check(st) {
      const left = st.dirt.filter(d => d.hp > 0).length;
      const c = $("#mgCnt"); if (c) c.textContent = "Dreck: " + left;
      if (!left) {
        st.ph = 1; st.tray = mgShuffle([0, 1, 2, 3]); st.down = false;
        mgMsg("✨ Blitzblank! Jetzt einsetzen – das leuchtende Feld ist dran.", "ok");
        mgBar(`<div class="mg-count">Teile 0 / 4</div>`);
        this.draw(st);
      }
    },
    put(st, i, b) {
      if (i === st.i) {
        st.i++; sfx("clunk");
        mgBar(`<div class="mg-count">Teile ${st.i} / 4</div>`);
        if (st.i >= 4) { this.draw(st); mgMsg("🔧 Brumm … der Motor springt an!", "ok"); sfx("horn"); setTimeout(() => MG.close({ ok: true, score: clamp(1 - st.miss * 0.15, 0.3, 1) }), 900); return; }
        mgMsg("✔️ " + this.PARTS[i][0] + " sitzt.", "ok");
        this.draw(st);
      } else {
        st.miss++; sfx("bad"); mgMsg("✖️ Erst " + this.PARTS[st.i][0] + ".", "bad");
        if (b) mgFx(b, "mg-shake");
      }
    },
    /* alte Aufrufe (Tests) */
    dirtAll(st) { st.dirt.forEach(d => { d.hp = 0; }); this.check(st); }
  },

  /* ---------------------------- Schatz graben -------------------------------
     Querschnitt durch den Boden unter dem Kreuz: Die Kiste liegt ganz unten.
     Gegraben wird von oben, immer neben schon offenen Löchern. Erde kostet
     einen Spatenstich, Lehm und Wurzeln zwei, Steine drei, durch Fels geht
     nichts. Wer den günstigsten Weg findet, bekommt mehr Münzen. */
  dig: {
    W: 5, H: 5,
    T: { erde: { hp: 1, n: "Erde" }, lehm: { hp: 2, n: "Lehm" }, wurzel: { hp: 2, n: "Wurzeln", i: "🌿" }, stein: { hp: 3, n: "Steine", i: "🪨" },
         fels: { hp: 99, n: "Fels", i: "⛰️" }, kiste: { hp: 1, n: "Kiste", i: "🧰" } },
    start(st) {
      const G = MG_GAMES.dig;
      for (let k = 0; k < 40; k++) {
        G.make(st);
        const o = G.best(st);
        if (o && o.cost >= 6 && o.cost <= 12 && o.direct - o.cost >= 2) { st.opt = o.cost; st.path = o.path; break; }
        if (o && k > 30) { st.opt = o.cost; st.path = o.path; break; }
      }
      st.used = 0; st.done = false;
      mgH("🧰 Schatz ausgraben", "Grab dich mit möglichst wenigen Stichen zur Kiste");
      G.draw(st);
      mgMsg("Erde 1 Stich · Lehm/🌿 Wurzeln 2 · 🪨 Steine 3 · ⛰️ Fels nie. Nur neben offenen Löchern graben.");
    },
    make(st) {
      const G = MG_GAMES.dig, W = G.W, H = G.H;
      st.cx = 1 + Math.floor(Math.random() * 3);
      st.cells = [];
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
        let t;
        if (r === H - 1 && c === st.cx) t = "kiste";
        else {
          const x = Math.random();
          t = x < 0.4 ? "erde" : x < 0.6 ? "lehm" : x < 0.76 ? "wurzel" : x < 0.92 ? "stein" : "fels";
          if (r === 0 && t === "fels") t = "lehm";
          /* direkt unter dem Kreuz ist es oft steinig – außen herum lohnt sich */
          if (c === st.cx && r > 0 && Math.random() < 0.55) t = Math.random() < 0.7 ? "stein" : "fels";
        }
        st.cells.push({ t, hp: G.T[t].hp, dug: false });
      }
    },
    /* günstigster Weg von oben zur Kiste (und der Weg senkrecht hinunter zum Vergleich) */
    best(st) {
      const G = MG_GAMES.dig, W = G.W, H = G.H, N = W * H, cost = i => st.cells[i].t === "fels" ? Infinity : st.cells[i].hp;
      const dist = Array(N).fill(Infinity), prev = Array(N).fill(-1), done = Array(N).fill(false);
      for (let c = 0; c < W; c++) dist[c] = cost(c);
      for (;;) {
        let u = -1;
        for (let i = 0; i < N; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
        if (u < 0) break;
        done[u] = true;
        const r = Math.floor(u / W), c = u % W;
        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
          if (rr < 0 || rr >= H || cc < 0 || cc >= W) return;
          const v = rr * W + cc, d = dist[u] + cost(v);
          if (d < dist[v]) { dist[v] = d; prev[v] = u; }
        });
      }
      const goal = (H - 1) * W + st.cx;
      if (dist[goal] === Infinity) return null;
      const path = [];
      for (let v = goal; v >= 0; v = prev[v]) path.unshift(v);
      let direct = 0;
      for (let r = 0; r < H; r++) direct += cost(r * W + st.cx);
      return { cost: dist[goal], path, direct };
    },
    open(st, i) {
      const W = MG_GAMES.dig.W, r = Math.floor(i / W), c = i % W;
      if (r === 0) return true;
      return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([rr, cc]) => rr >= 0 && rr < MG_GAMES.dig.H && cc >= 0 && cc < W && st.cells[rr * W + cc].dug);
    },
    draw(st) {
      const G = MG_GAMES.dig, W = G.W;
      const cells = st.cells.map((x, i) => {
        const D = G.T[x.t], can = !x.dug && x.t !== "fels" && G.open(st, i), seen = x.t !== "kiste" || x.dug || can || st.done;
        const ic = x.dug ? (x.t === "kiste" ? "🧰" : "") : seen ? (D.i || "") : "❔";
        const cr = !x.dug && x.hp < D.hp ? " cr" + (D.hp - x.hp) : "";
        return `<button class="mg-c t-${x.t}${x.dug ? " dug" : ""}${can ? " can" : ""}${cr}" data-i="${i}" aria-label="${D.n}">${ic}</button>`;
      }).join("");
      mgStage(`<div class="mg-pit"><div class="mg-grass">${Array.from({ length: W }, (_, c) => `<span>${c === st.cx ? `<b class="mg-x">✖</b>` : ""}</span>`).join("")}</div>
        <div class="mg-cells">${cells}</div></div>`);
      $$("#mgStage [data-i]").forEach(b => b.onclick = () => G.dig(st, +b.dataset.i));
      mgBar(`<div class="mg-count">⛏️ Spatenstiche: <b>${st.used}</b></div>`);
    },
    dig(st, i) {
      const G = MG_GAMES.dig, x = st.cells[i];
      if (st.done || !x || x.dug) return;
      if (x.t === "fels") { sfx("bad"); mgMsg("⛰️ Fels – da kommt kein Spaten durch. Außen herum!", "bad"); return; }
      if (!G.open(st, i)) { sfx("bad"); mgMsg("Von oben her graben – nur neben einem schon offenen Loch.", "bad"); return; }
      st.used++; x.hp--; sfx("dig");
      if (FV && FV.R) FV.touchAt = performance.now();
      if (x.hp <= 0) x.dug = true;
      if (x.t === "kiste" && x.dug) {
        st.done = true;
        const score = clamp(st.opt / st.used, 0.35, 1), stars = score >= 0.95 ? 3 : score >= 0.75 ? 2 : 1;
        st.score = score;
        G.draw(st);
        mgMsg(`🧰 Die Schatzkiste! ${st.used} Stiche${st.used <= st.opt ? " – besser geht’s nicht" : ", bestmöglich wären " + st.opt + " gewesen"} · ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`, "ok");
        sfx("collect");
        setTimeout(() => MG.close({ ok: true, score }), 1300);
        return;
      }
      mgMsg(x.dug ? (x.t === "stein" ? "🪨 Die Steine sind raus." : x.t === "wurzel" ? "🌿 Wurzeln durchgestochen." : "Weiter …") : `${G.T[x.t].n}: noch ${x.hp}×`, "");
      G.draw(st);
    }
  },

  /* ------------------------------- Angeln ---------------------------------- */
  fish: {
    start(st) {
      st.ph = "idle"; st.res = null;
      const G = FGROUNDS.find(g => g.id === st.gid) || FGROUNDS[0];
      st.G = G;
      mgHtml(fishGroundIc(G) + " " + esc(G.n), MG_GAMES.fish.sub(st));
      MG_GAMES.fish.idle(st);
    },
    sub(st) {
      const wx = FWEATHER[farmWeather()], U = angelS(), B = FBAITS[U.bait];
      return wx.i + " " + esc(wx.n) + " · " + esc(FTOD_N[farmTod()]) + " · " + fishRodIc(U.rod) + " " + esc(FRODS[U.rod].n) + " · " + icHTML(B.item) + " " + angelBaitN(U.bait) + " Würfe";
    },
    /* Köder wählen – nicht verfügbare grau mit Grund */
    baits(st) {
      const U = angelS();
      return `<div class="mg-baits">${Object.keys(FBAITS).filter(angelBaitShow).map(b => { const B = FBAITS[b], why = angelBaitWhy(b, st.gid, true);
        return `<button class="mg-bait${U.bait === b ? " on" : ""}" data-bait="${b}" ${why ? "disabled" : ""}><span>${icHTML(B.item)}</span><b>${esc(B.n)}</b><small>${why ? esc(why) : angelBaitN(b) + " Würfe"}</small></button>`; }).join("")}</div>`;
    },
    odds(st) {
      const o = angelOdds(st.gid), sum = Object.values(o).reduce((a, b) => a + b, 0);
      return Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, 4).map(id => {
        const p = o[id] / sum;
        return `<span class="mg-odd" title="${esc(FITEMS[id].sg || FITEMS[id].n)}">${icHTML(id)}<small>${esc(FITEMS[id].sg || FITEMS[id].n)} · ${p > 0.999 ? "immer" : p > 0.35 ? "oft" : p > 0.15 ? "mal" : p > 0.04 ? "selten" : "sehr selten"}</small></span>`;
      }).join("");
    },
    idle(st) {
      st.ph = "idle";
      mgHtml(fishGroundIc(st.G) + " " + esc(st.G.n), MG_GAMES.fish.sub(st));
      mgStage(`${MG_GAMES.fish.baits(st)}<div class="mg-water"><div class="mg-odds">${MG_GAMES.fish.odds(st)}</div></div>`);
      if (!st.res) mgMsg("");
      mgBar(`<button class="btn fa-go" id="mgGo">Auswerfen<small>kostet 1 × ${esc(FBAITS[angelS().bait].n)}</small></button>${st.boat ? `<button class="btn tiny ghost" id="mgBack">Zurück</button>` : ""}`);
      $("#mgGo").onclick = () => MG_GAMES.fish.cast(st);
      $$("#mgStage [data-bait]").forEach(b => b.onclick = () => { angelS().bait = b.dataset.bait; sfx("tap"); MG_GAMES.fish.idle(st); });
      const bk = $("#mgBack"); if (bk) bk.onclick = () => MG.close({ ok: true, back: true });
    },
    cast(st) {
      if (farmRoom("barsch") < 1) { farmFull("fisch"); return mgMsg("🧊 Die Kühlkiste ist voll – erst verarbeiten oder verkaufen.", "bad"); }
      if (!farmCast(st.gid)) {
        const B = FBAITS[angelS().bait], why = angelBaitWhy(angelS().bait, st.gid);
        mgMsg(B.i + " " + (why ? esc(B.n) + " geht gerade nicht: " + esc(why) + "." : "Kein Köder mehr.") + " Wähl einen anderen.", "bad");
        return;
      }
      st.ph = "wait"; st.res = null;
      const ev = S.farm.ev && S.farm.ev.cur, sw = farmEvOn("schwarm") && ev.data && ev.data.g === st.gid;
      st.wait = (sw ? 1 : 2) + Math.random() * (sw ? 2 : 4.5);
      sfx("cast");
      if (st.onCast) st.onCast();
      mgHtml(fishGroundIc(st.G) + " " + esc(st.G.n), MG_GAMES.fish.sub(st));
      mgStage(`<div class="mg-water"><span class="mg-bob" id="mgBob">🔴</span></div>`);
      mgMsg("Pssst … warten …");
      mgBar(`<button class="btn fa-go ghost" id="mgGo">… warten</button>`);
      $("#mgGo").onclick = () => { if (st.ph === "wait") { mgMsg("Zu früh – der Köder ist weg.", "bad"); st.ph = "idle"; setTimeout(() => MG_GAMES.fish.idle(st), 700); } else if (st.ph === "bite") MG_GAMES.fish.strike(st); };
      const sg = $("#mgStage");
      sg.onpointermove = sg.onpointerup = sg.onpointercancel = null;
      sg.onpointerdown = e => { e.preventDefault(); if (st.ph === "bite") MG_GAMES.fish.strike(st); };
    },
    frame(st, dt) {
      const bob = $("#mgBob");
      if (st.ph === "wait") {
        st.wait -= dt;
        if (bob) bob.style.transform = `translateY(${Math.sin(st.t * 3) * 3}px)`;
        if (st.wait <= 0) {
          st.ph = "bite"; st.biteT = 0.95;
          st.catch = farmRollCatch(st.gid);
          sfx("bite");
          if (st.onBite) st.onBite();
          mgMsg("❗ Biss! Jetzt anschlagen!", "hot");
          const b = $("#mgGo"); if (b) { b.className = "btn fa-go hot"; b.innerHTML = "❗ Anschlagen!"; }
        }
      } else if (st.ph === "bite") {
        st.biteT -= dt;
        if (bob) bob.style.transform = `translateY(${10 + Math.sin(st.t * 30) * 5}px)`;
        if (st.biteT <= 0) { st.ph = "idle"; sfx("bad"); mgMsg("Zu spät – der Fisch hat den Köder geklaut.", "bad"); if (st.onEnd) st.onEnd(false); setTimeout(() => MG_GAMES.fish.idle(st), 900); }
      } else if (st.ph === "ring") MG_GAMES.fish.ringFrame(st);
    },
    /* ---- Kreis-Drill: grünen Bogen mit Finger oder Maus zum Fisch ziehen ---- */
    strike(st) {
      const R = FRODS[angelS().rod], d = angelDiff(st.catch);
      Object.assign(st, { ph: "ring", d, gw: R.gw, fill: R.fill, drain: R.drain, ctrl: R.ctrl,
        fa: Math.random() * 360, dir: Math.random() < 0.5 ? -1 : 1, fv: 0, ft: 0, spr: 0, p: FRING.start, rt: 0, acc: 0, rl: performance.now(), tgt: null });
      st.ga = st.fa + 180;
      ringTurn(st, d, Math.random);
      const D = st.catch.id ? FFISH[st.catch.id] : null;
      const icon = D ? (D.cls === "gross" ? "🦈" : D.cls === "mittel" ? "🐠" : "🐟") : "❔";
      mgMsg(d > 0.6 ? "💪 Ein starker Fisch! Zieh den grünen Bogen mit dem Finger hinterher." : "Zieh den grünen Bogen zum Fisch – solange er drin ist, füllt sich die Leiste.", d > 0.6 ? "hot" : "");
      const C = 2 * Math.PI * 86;
      mgStage(`<div class="mg-ring"><svg viewBox="0 0 220 220" id="mgRing" aria-label="Kreis-Drill">
          <circle cx="110" cy="110" r="86" class="mg-ring-track"/>
          <circle cx="110" cy="110" r="86" class="mg-ring-arc" id="mgArc" stroke-dasharray="${(st.gw / 360 * C).toFixed(1)} ${C.toFixed(1)}"/>
          <text id="mgFishR" class="mg-ring-fish" text-anchor="middle" dominant-baseline="central">${icon}</text>
          <text x="110" y="110" class="mg-ring-mid" text-anchor="middle" dominant-baseline="central" id="mgRingPct">30 %</text>
        </svg><div class="mg-hp"><span>${icon}</span><i><em id="mgPr"></em></i></div></div>`);
      mgBar(`<button class="btn fa-go ghost" id="mgGo" disabled>Bogen ziehen · Fisch halten</button>`);
      const sg = $("#mgStage"), svg = $("#mgRing");
      const aim = e => { const b = svg.getBoundingClientRect(); st.tgt = Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180 / Math.PI; };
      sg.onpointerdown = e => { e.preventDefault(); st.drag = true; aim(e); try { sg.setPointerCapture(e.pointerId); } catch (x) { /* egal */ } };
      sg.onpointermove = e => { if (st.drag) aim(e); };
      sg.onpointerup = sg.onpointercancel = () => { st.drag = false; st.tgt = null; };
      MG_GAMES.fish.ringDraw(st);
    },
    /* feste Schrittweite über die echte Zeit – läuft bei 10 fps wie bei 60 fps */
    ringFrame(st) {
      const now = performance.now();
      st.acc += Math.min(0.5, (now - st.rl) / 1000);
      st.rl = now;
      while (st.acc >= FRING.step && st.ph === "ring") {
        st.acc -= FRING.step;
        ringStep(st, FRING.step, Math.random);
        if (st.p >= 1) return MG_GAMES.fish.end(st, "ok");
        if (st.p <= 0) return MG_GAMES.fish.end(st, "slack");
        if (st.rt >= FRING.maxT) return MG_GAMES.fish.end(st, "snap");
      }
      if (FV) FV.touchAt = now;
      MG_GAMES.fish.ringDraw(st);
    },
    ringDraw(st) {
      const f = $("#mgFishR"), a = $("#mgArc"), p = $("#mgPr"), t = $("#mgRingPct");
      if (!f) return;
      const r = st.fa * Math.PI / 180;
      f.setAttribute("x", (110 + 86 * Math.cos(r)).toFixed(1));
      f.setAttribute("y", (110 + 86 * Math.sin(r)).toFixed(1));
      a.setAttribute("transform", `rotate(${(st.ga - st.gw / 2).toFixed(1)} 110 110)`);
      a.classList.toggle("hit", ringIn(st));
      p.style.width = (st.p * 100).toFixed(1) + "%";
      t.textContent = Math.round(st.p * 100) + " %";
    },
    end(st, how) {
      st.ph = "idle";
      const sg = $("#mgStage");
      if (sg) sg.onpointermove = sg.onpointerup = sg.onpointercancel = sg.onpointerdown = null;
      if (how !== "ok") {
        sfx("bad");
        mgMsg(how === "snap" ? "💥 Die Schnur ist gerissen – zu lange gedrillt." : "Der Fisch ist entkommen.", "bad");
        if (st.onEnd) st.onEnd(false);
        setTimeout(() => MG_GAMES.fish.idle(st), 1100);
        return;
      }
      const r = farmCatch(st.gid, 3, st.catch);
      st.res = r;
      sfx(r && r.id ? "splash" : "pop");
      if (st.onEnd) st.onEnd(true, r);
      if (!r) mgMsg("Hm, nichts dran.", "");
      else if (r.junk) mgMsg(`${r.i} Nur ${esc(r.junk)}${r.m ? " – mit " + eur(r.m) + " Finderlohn!" : "."}`, "");
      else if (r.full) mgMsg("🧊 Die Kühlkiste ist voll – der Fisch schwimmt wieder.", "bad");
      else mgMsg(`${icHTML(r.id)} <b>${esc(FITEMS[r.id].sg || FITEMS[r.id].n)}</b> · ${fmt(r.cm, 1)} cm · ${fishKgTxt(r.kg)}<br>${qStars(r.q)} ${esc(fishQName(r.q))} · Wert ${eur(r.val)} · +${r.xp} EP${r.rec ? " · 🏆 Neuer Rekord!" : ""}`, "ok");
      save();
      setTimeout(() => { if (MG.on && MG.kind === "fish") MG_GAMES.fish.idle(st); }, r && r.cm ? 2600 : 1300);
    },
    stop(st) { if (st.onStop) st.onStop(); },
    abort() { return { ok: true, back: true }; }
  }
};

/* ---------------------- Kreis-Drill: reine Rechenschritte -------------------
   Ohne DOM, damit sich Fisch und Bogen mit festem Zufall (erbeRng) testen lassen. */
const ringWrap = a => ((a % 360) + 540) % 360 - 180;   /* Winkelabstand −180 … 180 */
function ringIn(st) { return Math.abs(ringWrap(st.fa - st.ga)) <= st.gw / 2; }
/* neues Bewegungsmuster: Tempo, Dauer, Richtungswechsel, Sprint */
function ringTurn(st, d, rng) {
  const L = (k) => FRING[k][0] + (FRING[k][1] - FRING[k][0]) * d;
  if (rng() < L("flip")) st.dir = -st.dir;
  st.fv = L("speed") * (0.8 + rng() * 0.4);
  st.ft = L("turn") * (0.7 + rng() * 0.6);
  st.spr = d > FRING.sprint.from && rng() < (d - FRING.sprint.from) * 1.5 ? FRING.sprint.dur : 0;
}
function ringStep(st, h, rng) {
  st.rt += h;
  st.ft -= h;
  if (st.ft <= 0) ringTurn(st, st.d, rng);
  if (st.spr > 0) st.spr -= h;
  st.fa = (st.fa + st.dir * st.fv * (st.spr > 0 ? FRING.sprint.mult : 1) * h + 360) % 360;
  if (st.tgt != null) {
    const diff = ringWrap(st.tgt - st.ga), m = st.ctrl * h;
    st.ga = (st.ga + clamp(diff, -m, m) + 360) % 360;
  }
  st.p = clamp(st.p + (ringIn(st) ? st.fill : -st.drain) * h, 0, 1);
}
