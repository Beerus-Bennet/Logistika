/* =========================================================================
   LOGISTIKA – minigames.js
   Kleine Handwerks-Spiele des Erbes, alle im selben Fenster unten:
   Axt (Timing mit Ausdauer), Kettensäge (Fallrichtung, Fallkerb, Hitze),
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
function mgMsg(t, cls) { const m = $("#mgMsg"); if (m) { m.innerHTML = t; m.className = "fa-msg" + (cls ? " " + cls : ""); } }
function mgBar(html) { const b = $("#mgBar"); if (b) b.innerHTML = html; return b; }
function mgStage(html) { const s = $("#mgStage"); if (s) s.innerHTML = html; return s; }
function mgShuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/* Ausdauerleiste fürs Holzfällen */
function mgStaHTML() { const s = Math.floor(farmSta()), m = farmStaMax(); return `<div class="mg-sta"><span>💪</span><i><em style="width:${Math.round(s / m * 100)}%"></em></i><b>${s}</b></div>`; }
/* Brotzeit direkt im Spiel */
function mgFoodHTML() {
  const f = farmFoods().slice(0, 4);
  return f.length ? f.map(id => `<button class="btn tiny ghost" data-eat="${id}">${FITEMS[id].i} +${FFOOD[id]}</button>`).join("") : `<span class="mg-none">Nichts zu essen im Lager.</span>`;
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
      /* 21 Punkte: drei Volltreffer (je 7) oder sieben gute Treffer (je 3) */
      st.hp = MG_AXE_HP; st.k = ax; st.sta = Z.sta; st.q = 0; st.n = 0; st.p = 0; st.v = 0.75 + t.sz * 0.18; st.dirv = 1;
      if ((t.dmg || 0) >= MG_AXE_HP) t.dmg = MG_AXE_HP - 3;
      st.c = 0.3 + Math.random() * 0.4; st.good = 0.1; st.okw = 0.26; st.cool = 0;
      mgH("🪓 " + FSPECIES[t.sp].n + " fällen", "Tipp, wenn die Nadel im grünen Feld steht");
      mgStage(`<div class="mg-tbar" id="mgT"><i class="ok" id="mgOk"></i><i class="good" id="mgGood"></i><b id="mgNeedle"></b></div>
        <div class="mg-hp"><span>🌳</span><i><em id="mgHp"></em></i></div><div id="mgStaBox">${mgStaHTML()}</div>`);
      $("#mgStage").onpointerdown = e => { e.preventDefault(); MG_GAMES.axe.hit(st); };
      MG_GAMES.axe.zone(st);
      MG_GAMES.axe.bar(st);
      mgMsg(t.dmg ? "Weiter geht’s – der Baum ist schon angeschlagen." : "Drei Volltreffer im dunkelgrünen Feld oder sieben gute Schläge im hellgrünen – jeder Schlag kostet Ausdauer.");
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
      t.dmg = (t.dmg || 0) + (q === 1 ? 7 : q > 0.5 ? 3 : 0);
      WV.hit = { id: t.id, t0: wnow() };
      FV.R.burst({ x: t.x + 0.3, y: 0.6, z: t.z + 0.3, n: q === 1 ? 10 : 5, col: [[0.9, 0.78, 0.55, 1], [0.75, 0.55, 0.32, 1]], speed: 1.4, up: 1.6, size: 0.07, shape: 1 });
      sfx(q === 1 ? "chop" : q > 0.5 ? "chop" : "bad");
      mgMsg(q === 1 ? "💥 Volltreffer!" : q > 0.5 ? "👍 Gut getroffen" : "😬 Daneben – kostet trotzdem Kraft", q === 1 ? "ok" : q > 0.5 ? "" : "bad");
      if (FV.R) FV.touchAt = performance.now();
      st.c = 0.18 + Math.random() * 0.64;
      st.v = Math.min(2.2, st.v + 0.04);
      MG_GAMES.axe.zone(st);
      MG_GAMES.axe.hpBar(st);
      if (t.dmg >= st.hp) {
        st.done = true;
        mgMsg("🌲 Baum fällt!", "ok");
        const dir = -2.36 + (Math.random() - 0.5) * 0.8;
        setTimeout(() => MG.close({ ok: true, acc: st.n ? st.q / st.n : 0.6, dir, dirOk: true }), 380);
      }
    },
    tired(st) {
      st.tired = true;
      mgMsg("💪 Keine Kraft mehr. Eine Brotzeit hilft – oder später weitermachen, der Baum bleibt angeschlagen.", "bad");
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
      mgH("🪚 " + FSPECIES[t.sp].n + " sägen", "Erst die Fallrichtung wählen – ins Freie, nicht auf Bäume oder Wege");
      const free = st.dirs.filter(d => !d.block).length;
      mgStage(`<div class="mg-dirs">${st.dirs.map((d, i) => `<button class="mg-dir${d.block ? " blk" : " free"}" data-d="${i}"><b>${d.a}</b><small>${d.block ? d.block : "frei"}</small></button>`).join("")}<div class="mg-tree">🌳</div></div>`);
      mgMsg(free ? "Wohin soll der Baum fallen?" : "Überall steht was im Weg – wähl das kleinste Übel.");
      mgBar("");
      $$("#mgStage [data-d]").forEach(b => b.onclick = () => { st.dir = st.dirs[+b.dataset.d]; st.dirOk = !st.dir.block || !free; MG_GAMES.saw.kerb(st); });
    },
    kerb(st) {
      st.ph = 1;
      mgH("🪚 Fallkerb", "Tipp, wenn die Markierung auf Kniehöhe (grün) ist");
      mgStage(`<div class="mg-trunk"><i class="tgt"></i><b id="mgMk"></b></div>`);
      mgMsg(st.dirOk ? "Gute Richtung. Jetzt der Fallkerb – sauber gesetzt gibt’s mehr Holz." : "Hm, da steht was im Weg … pass beim Schnitt gut auf.", st.dirOk ? "ok" : "bad");
      mgBar(`<button class="btn fa-go" id="mgGo">✂️ Kerb setzen</button>`);
      const go = () => {
        if (st.ph !== 1) return;
        st.p1 = clamp(1 - Math.abs(st.mk - 0.28) / 0.3, 0, 1);
        sfx("saw");
        MG_GAMES.saw.cut(st);
      };
      $("#mgGo").onclick = go;
      $("#mgStage").onpointerdown = e => { e.preventDefault(); go(); };
    },
    cut(st) {
      st.ph = 2;
      mgH("🪚 Fällschnitt", "Gedrückt halten zum Sägen – loslassen kühlt den Motor");
      mgStage(`<div class="mg-hp"><span>🪚</span><i><em id="mgPr" style="width:0%"></em></i></div><div class="mg-heat"><span>🌡️</span><i><em id="mgHeat"></em></i></div>`);
      mgMsg(st.p1 > 0.7 ? "Sauberer Kerb! Jetzt durchsägen." : "Der Kerb sitzt etwas schief. Jetzt durchsägen.", st.p1 > 0.7 ? "ok" : "");
      const b = mgBar(`<button class="btn fa-go hold" id="mgGo">🪚 Halten zum Sägen</button>`).firstChild;
      const on = e => { e.preventDefault(); st.hold = true; b.classList.add("on"); };
      const off = () => { st.hold = false; b.classList.remove("on"); };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
      $("#mgStage").addEventListener("pointerdown", on); $("#mgStage").addEventListener("pointerup", off); $("#mgStage").addEventListener("pointerleave", off);
    },
    frame(st, dt) {
      const t = st.tree;
      if (st.ph === 1) {
        st.mk += st.mv * dt * 0.9;
        if (st.mk > 1) { st.mk = 1; st.mv = -1; } else if (st.mk < 0) { st.mk = 0; st.mv = 1; }
        const m = $("#mgMk"); if (m) m.style.bottom = st.mk * 100 + "%";
      }
      if (st.ph !== 2 || st.done) return;
      if (st.stall > 0) { st.stall -= dt; st.heat = Math.max(0, st.heat - dt * 0.5); if (st.stall <= 0) mgMsg("Motor läuft wieder.", ""); }
      else if (st.hold) {
        st.prog += dt * (0.28 - t.sz * 0.03) * (st.p1 > 0.6 ? 1.15 : 1);
        st.heat += dt * (0.42 + t.sz * 0.05);
        st.snd -= dt;
        if (st.snd <= 0) { st.snd = 0.22; sfx("saw"); }
        WV.hit = { id: t.id, t0: wnow() - 0.15 };
        if (Math.random() < dt * 14) FV.R.emit({ x: t.x + 0.35, y: 0.35, z: t.z + 0.35, vx: (Math.random() - 0.3) * 2, vy: 1.2, vz: (Math.random() - 0.3) * 2, g: -4, life: 0.6, size: 0.05, col: [0.95, 0.85, 0.6, 1], shape: 1 });
        if (st.heat >= 1) { st.over++; st.stall = 1.6; st.heat = 0.85; sfx("bad"); mgMsg("🔥 Überhitzt! Der Motor ist aus – kurz warten.", "hot"); }
        if (FV) FV.touchAt = performance.now();
      } else st.heat = Math.max(0, st.heat - dt * 0.65);
      const p = $("#mgPr"), h = $("#mgHeat");
      if (p) p.style.width = Math.min(100, st.prog * 100) + "%";
      if (h) { h.style.width = Math.min(100, st.heat * 100) + "%"; h.className = st.heat > 0.75 ? "hot" : ""; }
      if (st.prog >= 1) {
        st.done = true;
        const hung = st.over >= 2 || (!st.dirOk && Math.random() < 0.5);
        const acc = clamp(st.p1 * 0.6 + (1 - st.over * 0.25) * 0.4, 0, 1);
        mgMsg(hung ? "😬 Der Baum hängt kurz fest … aber er fällt." : st.dirOk ? "🌲 Baum fällt – genau wie geplant!" : "🌲 Baum fällt!", hung ? "bad" : "ok");
        setTimeout(() => MG.close({ ok: true, acc, dir: st.dir.ry, dirOk: st.dirOk, hung }), 450);
      }
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

  /* --------------------------- Kabel anklemmen ----------------------------- */
  wires: {
    W: [["pe", "Schutzleiter", "#3fae3a", "#f2d32a"], ["n", "Neutralleiter", "#2f6fd0"], ["l1", "Phase L1", "#7a4a2a"], ["l2", "Phase L2", "#1d1d20"], ["l3", "Phase L3", "#8a8f96"]],
    start(st) {
      st.i = 0; st.miss = 0;
      st.order = mgShuffle(this.W.map((w, i) => i));
      mgH(st.title || "⚡ Elektrik", "Erst Schutzleiter (grün-gelb), dann Neutralleiter (blau), dann die Phasen L1, L2, L3");
      this.draw(st);
      mgMsg("Tipp die Kabel in der richtigen Reihenfolge an.");
      mgBar(`<div class="mg-count" id="mgCnt">0 / 5</div>`);
    },
    draw(st) {
      const W = this.W;
      mgStage(`<div class="mg-wires">${st.order.map(i => {
        const w = W[i], done = i < st.i, bg = w[3] ? `repeating-linear-gradient(90deg,${w[2]} 0 10px,${w[3]} 10px 20px)` : w[2];
        return `<button class="mg-wire${done ? " done" : ""}" data-w="${i}" ${done ? "disabled" : ""}><i style="background:${bg}"></i><span>${done ? "✓ " + w[1] : ""}</span></button>`;
      }).join("")}</div><div class="mg-term">${W.map((w, i) => `<span class="${i < st.i ? "on" : ""}">${w[0].toUpperCase()}</span>`).join("")}</div>`);
      $$("#mgStage [data-w]").forEach(b => b.onclick = () => this.pick(st, +b.dataset.w));
    },
    pick(st, i) {
      if (i === st.i) {
        st.i++; sfx("clunk");
        mgMsg("✔️ " + this.W[i][1] + " sitzt.", "ok");
        const c = $("#mgCnt"); if (c) c.textContent = st.i + " / 5";
        this.draw(st);
        if (st.i >= 5) { const score = clamp(1 - st.miss * 0.15, 0.3, 1); mgMsg("💡 Licht an – die Halle hat wieder Strom!", "ok"); setTimeout(() => MG.close({ ok: true, score }), 700); }
      } else {
        st.miss++; sfx("spark");
        mgMsg("⚡ Funken! Falsche Reihenfolge – erst " + this.W[st.i][1] + ".", "bad");
      }
    }
  },

  /* ----------------------- Teile einsetzen (Zahnräder, Band) ---------------- */
  gears: {
    start(st) {
      const n = st.quick ? 2 : 4, sizes = [["S", 34], ["M", 46], ["L", 58], ["XL", 70]];
      st.slots = mgShuffle(sizes).slice(0, n).map(s => ({ k: s[0], px: s[1], ok: false }));
      st.parts = mgShuffle(st.slots.map(s => s.k).concat(st.quick ? [] : [pick(sizes)[0]]));
      st.sel = null; st.miss = 0; st.theme = "gear";
      mgH(st.title || "⚙️ Getriebe", "Rad antippen, dann die passende Achse");
      MG_GAMES.gears.draw(st);
      mgMsg("Jedes Rad muss genau auf seine Achse passen.");
      mgBar("");
    },
    draw(st) {
      const px = k => ({ S: 34, M: 46, L: 58, XL: 70 })[k];
      mgStage(`<div class="mg-axes">${st.slots.map((s, i) => `<button class="mg-axle${s.ok ? " ok" : ""}" data-s="${i}" style="--d:${s.px}px">${s.ok ? `<span class="mg-gear spin" style="--d:${s.px}px">⚙</span>` : `<i></i>`}<small>${s.k}</small></button>`).join("")}</div>
        <div class="mg-tray">${st.parts.map((k, i) => k ? `<button class="mg-part${st.sel === i ? " sel" : ""}" data-p="${i}"><span class="mg-gear" style="--d:${px(k) * 0.8}px">⚙</span><small>${k}</small></button>` : "").join("")}</div>`);
      $$("#mgStage [data-p]").forEach(b => b.onclick = () => { st.sel = +b.dataset.p; sfx("tap"); MG_GAMES.gears.draw(st); });
      $$("#mgStage [data-s]").forEach(b => b.onclick = () => MG_GAMES.gears.put(st, +b.dataset.s));
    },
    put(st, i) {
      const s = st.slots[i];
      if (s.ok || st.sel == null) return;
      if (st.parts[st.sel] === s.k) { s.ok = true; st.parts[st.sel] = null; st.sel = null; sfx("clunk"); mgMsg("✔️ Passt!", "ok"); }
      else { st.miss++; sfx("bad"); mgMsg("✖️ Zu " + ({ S: 1, M: 2, L: 3, XL: 4 }[st.parts[st.sel]] > { S: 1, M: 2, L: 3, XL: 4 }[s.k] ? "groß" : "klein") + " für diese Achse.", "bad"); }
      MG_GAMES.gears.draw(st);
      if (st.slots.every(x => x.ok)) { mgMsg("⚙️ Alles greift ineinander – läuft!", "ok"); setTimeout(() => MG.close({ ok: true, score: clamp(1 - st.miss * 0.15, 0.3, 1) }), 800); }
    }
  },
  belt: {
    P: [["roll", "🛞", "Rolle"], ["gurt", "▬", "Gurtstück"], ["bolt", "🔩", "Schraube"], ["arm", "📐", "Halter"], ["mot", "⚙️", "Antriebsrad"]],
    start(st) {
      st.slots = mgShuffle(this.P).map(p => ({ k: p[0], i: p[1], n: p[2], ok: false }));
      st.parts = mgShuffle(st.slots.map(s => s.k));
      st.sel = null; st.miss = 0;
      mgH(st.title || "🛞 Förderband", "Teil antippen, dann die passende Lücke");
      this.draw(st);
      mgMsg("Jede Lücke zeigt den Umriss des Teils, das hinein gehört.");
      mgBar("");
    },
    draw(st) {
      const P = this.P, info = k => P.find(p => p[0] === k);
      mgStage(`<div class="mg-belt">${st.slots.map((s, i) => `<button class="mg-gap${s.ok ? " ok" : ""}" data-s="${i}"><span>${s.i}</span><small>${s.ok ? "✓" : esc(s.n)}</small></button>`).join("")}</div>
        <div class="mg-tray">${st.parts.map((k, i) => k ? `<button class="mg-part${st.sel === i ? " sel" : ""}" data-p="${i}"><span>${info(k)[1]}</span></button>` : "").join("")}</div>`);
      $$("#mgStage [data-p]").forEach(b => b.onclick = () => { st.sel = +b.dataset.p; sfx("tap"); this.draw(st); });
      $$("#mgStage [data-s]").forEach(b => b.onclick = () => this.put(st, +b.dataset.s));
    },
    put(st, i) {
      const s = st.slots[i];
      if (s.ok || st.sel == null) return;
      if (st.parts[st.sel] === s.k) { s.ok = true; st.parts[st.sel] = null; st.sel = null; sfx("clunk"); mgMsg("✔️ " + s.n + " sitzt.", "ok"); }
      else { st.miss++; sfx("bad"); mgMsg("✖️ Das passt da nicht rein.", "bad"); }
      this.draw(st);
      if (st.slots.every(x => x.ok)) { mgMsg("🛞 Das Band läuft wieder rund!", "ok"); setTimeout(() => MG.close({ ok: true, score: clamp(1 - st.miss * 0.15, 0.3, 1) }), 800); }
    }
  },

  /* --------------------------- Motor richten ------------------------------- */
  motor: {
    PARTS: [["Kolben", "🛢️"], ["Zündkerze", "🕯️"], ["Luftfilter", "🧽"], ["Ventildeckel", "🔩"]],
    start(st) {
      st.ph = 0; st.dirt = Array.from({ length: 8 }, () => ({ x: 8 + Math.random() * 84, y: 12 + Math.random() * 72, hp: 2 })); st.miss = 0; st.i = 0;
      mgH(st.title || "🔧 Motor", "Erst sauber wischen – dann die Teile der Reihe nach einsetzen");
      this.draw(st);
      mgMsg("Wisch über die dreckigen Stellen (antippen oder drüberziehen).");
      mgBar(`<div class="mg-count" id="mgCnt">Dreck: 8</div>`);
    },
    draw(st) {
      if (st.ph === 0) {
        mgStage(`<div class="mg-motor" id="mgMot">${st.dirt.map((d, i) => d.hp > 0 ? `<i class="mg-dirt h${d.hp}" data-i="${i}" style="left:${d.x}%;top:${d.y}%"></i>` : "").join("")}<span class="mg-eng">⚙️</span></div>`);
        const scrub = e => {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (el && el.dataset && el.dataset.i != null) {
            const d = st.dirt[+el.dataset.i];
            if (d.hp > 0 && (!d.at || performance.now() - d.at > 120)) { d.at = performance.now(); d.hp--; sfx("swish"); this.draw(st); this.check(st); }
          }
        };
        const m = $("#mgMot");
        m.onpointerdown = e => { e.preventDefault(); st.down = true; scrub(e); };
        m.onpointermove = e => { if (st.down) scrub(e); };
        m.onpointerup = m.onpointerleave = () => { st.down = false; };
      } else {
        const P = this.PARTS;
        mgStage(`<div class="mg-slots">${P.map((p, i) => `<span class="${i < st.i ? "on" : ""}">${i < st.i ? p[1] : i + 1}<small>${esc(p[0])}</small></span>`).join("")}</div>
          <div class="mg-tray">${st.tray.map(i => i < st.i ? "" : `<button class="mg-part" data-p="${i}"><span>${P[i][1]}</span><small>${esc(P[i][0])}</small></button>`).join("")}</div>`);
        $$("#mgStage [data-p]").forEach(b => b.onclick = () => this.put(st, +b.dataset.p));
      }
    },
    check(st) {
      const left = st.dirt.filter(d => d.hp > 0).length;
      const c = $("#mgCnt"); if (c) c.textContent = "Dreck: " + left;
      if (!left) {
        st.ph = 1; st.tray = mgShuffle([0, 1, 2, 3]);
        mgMsg("✨ Blitzblank! Jetzt einsetzen: Kolben → Zündkerze → Luftfilter → Ventildeckel.", "ok");
        mgBar(`<div class="mg-count">Teile 0 / 4</div>`);
        this.draw(st);
      }
    },
    put(st, i) {
      if (i === st.i) {
        st.i++; sfx("clunk");
        mgBar(`<div class="mg-count">Teile ${st.i} / 4</div>`);
        if (st.i >= 4) { this.draw(st); mgMsg("🔧 Brumm … der Motor springt an!", "ok"); sfx("horn"); setTimeout(() => MG.close({ ok: true, score: clamp(1 - st.miss * 0.15, 0.3, 1) }), 900); return; }
        mgMsg("✔️ " + this.PARTS[i][0] + " sitzt.", "ok");
      } else { st.miss++; sfx("bad"); mgMsg("✖️ Erst " + this.PARTS[st.i][0] + ".", "bad"); }
      this.draw(st);
    }
  },

  /* ---------------------------- Schatz graben ------------------------------- */
  dig: {
    start(st) {
      st.at = Math.floor(Math.random() * 9); st.tries = 0; st.hp = Array(9).fill(2);
      st.hint = [st.at, (st.at + 1 + Math.floor(Math.random() * 8)) % 9];
      mgH("🗝️ Da liegt was!", "Wo die Federn liegen, kreisen die Vögel – grab dort");
      this.draw(st);
      mgMsg("Zweimal tippen, um ein Loch zu graben.");
      mgBar("");
    },
    draw(st) {
      mgStage(`<div class="mg-dig">${st.hp.map((h, i) => `<button class="mg-soil h${h}" data-i="${i}">${h > 0 ? (st.hint.includes(i) && h === 2 ? "🪶" : "") : i === st.at ? "🧰" : "🪨"}</button>`).join("")}</div>`);
      $$("#mgStage [data-i]").forEach(b => b.onclick = () => this.dig(st, +b.dataset.i));
    },
    dig(st, i) {
      if (st.done || st.hp[i] <= 0) return;
      st.hp[i]--; sfx("dig");
      if (st.hp[i] === 0) {
        st.tries++;
        if (i === st.at || st.tries >= 4) {
          st.done = true;
          if (i !== st.at) { st.hp[st.at] = 0; mgMsg("Da! Gleich daneben – eine alte Kiste!", "ok"); }
          else mgMsg("🧰 Eine alte Kiste – voller Münzen!", "ok");
          this.draw(st);
          setTimeout(() => MG.close({ ok: true }), 900);
          return;
        }
        mgMsg("Nur Steine … weiter suchen.", "");
      }
      this.draw(st);
    }
  },

  /* ------------------------------- Angeln ---------------------------------- */
  fish: {
    start(st) {
      st.ph = "idle"; st.res = null;
      const G = FGROUNDS.find(g => g.id === st.gid) || FGROUNDS[0];
      st.G = G;
      mgH(G.i + " " + G.n, MG_GAMES.fish.sub());
      MG_GAMES.fish.idle(st);
    },
    sub() { const wx = FWEATHER[farmWeather()]; return wx.i + " " + esc(wx.n) + " · " + esc(FTOD_N[farmTod()]) + " · 🪱 " + famt("koeder", farmInv("koeder")) + " Köder"; },
    odds(st) {
      const o = farmFishOdds(st.gid), sum = Object.values(o).reduce((a, b) => a + b, 0);
      return Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, 4).map(id => {
        const p = o[id] / sum;
        return `<span class="mg-odd">${FITEMS[id].i}<small>${p > 0.35 ? "oft" : p > 0.15 ? "mal" : p > 0.04 ? "selten" : "sehr selten"}</small></span>`;
      }).join("");
    },
    idle(st) {
      st.ph = "idle";
      mgH(st.G.i + " " + st.G.n, MG_GAMES.fish.sub());
      mgStage(`<div class="mg-water"><div class="mg-odds">${MG_GAMES.fish.odds(st)}</div></div>`);
      if (!st.res) mgMsg(st.boat ? "Mitten auf dem See. Auswerfen und auf den Biss warten." : "Vom Steg aus angeln: Auswerfen und auf den Biss warten.");
      mgBar(`<button class="btn fa-go" id="mgGo">🎣 Auswerfen<small>kostet 1 Köder</small></button>${st.boat ? `<button class="btn tiny ghost" id="mgBack">⛵ Zurück</button>` : ""}`);
      $("#mgGo").onclick = () => MG_GAMES.fish.cast(st);
      const bk = $("#mgBack"); if (bk) bk.onclick = () => MG.close({ ok: true, back: true });
    },
    cast(st) {
      if (farmRoom("barsch") < 1) { farmFull("fisch"); return mgMsg("🧊 Die Kühlkiste ist voll – erst verarbeiten oder verkaufen.", "bad"); }
      if (!farmCast()) {
        mgMsg("🪱 Keine Köder mehr. Die Fischerhütte macht welche aus Fischabfällen – oder im Laden unter „Werkzeug“.", "bad");
        return;
      }
      st.ph = "wait"; st.res = null;
      const sw = farmEvOn("schwarm") && S.farm.ev.cur.data.g === st.gid;
      st.wait = (sw ? 1 : 2) + Math.random() * (sw ? 2 : 4.5);
      sfx("cast");
      if (st.onCast) st.onCast();
      mgH(st.G.i + " " + st.G.n, MG_GAMES.fish.sub());
      mgStage(`<div class="mg-water"><span class="mg-bob" id="mgBob">🔴</span></div>`);
      mgMsg("Pssst … warten …");
      mgBar(`<button class="btn fa-go ghost" id="mgGo">… warten</button>`);
      $("#mgGo").onclick = () => { if (st.ph === "wait") { mgMsg("Zu früh – der Köder ist weg.", "bad"); st.ph = "idle"; setTimeout(() => MG_GAMES.fish.idle(st), 700); } else if (st.ph === "bite") MG_GAMES.fish.strike(st); };
      $("#mgStage").onpointerdown = e => { e.preventDefault(); if (st.ph === "bite") MG_GAMES.fish.strike(st); };
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
      } else if (st.ph === "reel") MG_GAMES.fish.reelStep(st, dt);
    },
    strike(st) {
      st.ph = "reel";
      const f = st.catch.id ? FFISH[st.catch.id] : null, fight = f ? f.fight : 0.15;
      Object.assign(st, { ten: 0.45, prog: 0.15, green: 0, total: 0, slack: 0, fight, burst: 0, hold: false, snd: 0 });
      mgMsg(fight > 0.7 ? "💪 Ein schwerer Brocken! Spannung im grünen Bereich halten." : "Halten zum Kurbeln – Spannung im grünen Bereich halten.", fight > 0.7 ? "hot" : "");
      mgStage(`<div class="mg-reel"><div class="mg-ten"><i class="g"></i><b id="mgTen"></b></div><div class="mg-hp"><span>🐟</span><i><em id="mgPr"></em></i></div></div>`);
      const b = mgBar(`<button class="btn fa-go hold" id="mgGo">🎣 Halten zum Kurbeln</button>`).firstChild;
      const on = e => { e.preventDefault(); st.hold = true; b.classList.add("on"); };
      const off = () => { st.hold = false; b.classList.remove("on"); };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
      const sg = $("#mgStage"); sg.addEventListener("pointerdown", on); sg.addEventListener("pointerup", off); sg.addEventListener("pointerleave", off);
    },
    reelStep(st, dt) {
      st.total += dt;
      /* der Fisch zieht in Stößen */
      st.burst -= dt;
      if (st.burst <= 0) { st.burst = 0.6 + Math.random() * 1.4; st.pull = 0.6 + Math.random() * st.fight * 1.4; }
      const pull = st.burst > 0.25 && st.pull ? st.fight * st.pull * 0.9 : 0;
      st.ten += (st.hold ? 0.55 : -0.5) * dt + pull * dt;
      st.prog += (st.hold ? 0.17 - st.fight * 0.08 : -0.02) * dt - pull * dt * 0.12;
      st.ten = clamp(st.ten, 0, 1.2);
      st.prog = clamp(st.prog, 0, 1);
      if (st.ten > 0.32 && st.ten < 0.78) st.green += dt;
      if (st.hold) { st.snd -= dt; if (st.snd <= 0) { st.snd = 0.35; sfx("reel"); } }
      if (FV) FV.touchAt = performance.now();
      const t = $("#mgTen"), p = $("#mgPr");
      if (t) { t.style.left = Math.min(100, st.ten / 1.0 * 100) + "%"; t.className = st.ten > 0.9 ? "hot" : ""; }
      if (p) p.style.width = st.prog * 100 + "%";
      st.slack = st.ten < 0.1 ? st.slack + dt : 0;
      if (st.ten >= 1) return MG_GAMES.fish.end(st, "snap");
      if (st.slack > 1.4) return MG_GAMES.fish.end(st, "slack");
      if (st.prog >= 1) return MG_GAMES.fish.end(st, "ok");
    },
    end(st, how) {
      st.ph = "idle";
      if (how !== "ok") {
        sfx("bad");
        mgMsg(how === "snap" ? "💥 Die Schnur ist gerissen – zu viel Zug!" : "Die Schnur war zu locker – weg ist er.", "bad");
        if (st.onEnd) st.onEnd(false);
        setTimeout(() => MG_GAMES.fish.idle(st), 1100);
        return;
      }
      const q = 1 + 4 * clamp(st.green / Math.max(0.5, st.total), 0, 1);
      const r = farmCatch(st.gid, q, st.catch);
      st.res = r;
      sfx(r && r.id ? "splash" : "pop");
      if (st.onEnd) st.onEnd(true, r);
      if (!r) mgMsg("Hm, nichts dran.", "");
      else if (r.junk) mgMsg(`${r.i} Nur ${esc(r.junk)}${r.m ? " – mit " + eur(r.m) + " Finderlohn!" : "."}`, "");
      else if (r.full) mgMsg("🧊 Die Kühlkiste ist voll – der Fisch schwimmt wieder.", "bad");
      else mgMsg(`${FITEMS[r.id].i} ${esc(FITEMS[r.id].sg || FITEMS[r.id].n)}! ${qStars(r.q)} · +${r.xp} EP`, "ok");
      save();
      setTimeout(() => { if (MG.on && MG.kind === "fish") MG_GAMES.fish.idle(st); }, 1300);
    },
    stop(st) { if (st.onStop) st.onStop(); },
    abort() { return { ok: true, back: true }; }
  }
};
