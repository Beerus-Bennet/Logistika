/* =========================================================================
   LOGISTIKA – fishview.js
   Der Glindower See: Angeln vom Steg, Bootsfahrten zu den Fanggründen
   (Ruderboot, später Motorboot), Pose und Rute in 3D, Enten und springende
   Fische. Das Angeln selbst (Biss, Drill) ist ein Minispiel in minigames.js,
   Bauplätze und Gebäude am Ufer laufen über worldview.js.
   ========================================================================= */
const FISH = { at: null, boat: null, trip: null, bob: null, ducks: [], jumpAt: 0, rod: 0 };

function fishBoatNode() {
  const R = FV.R, F = S.farm;
  if (!R || !farmObj1("f_boot") || !(F.boat >= 1)) return null;
  const kind = F.boat >= 2 ? "motor" : "row";
  if (FISH.boat && FISH.boat.kind === kind && R.nodes.includes(FISH.boat.node)) return FISH.boat;
  if (FISH.boat) { const i = R.nodes.indexOf(FISH.boat.node); if (i >= 0) R.nodes.splice(i, 1); }
  const node = fnode(fmesh("boat:" + kind, kind === "motor" ? FWM.motorboat : FWM.rowboat), { x: FBOAT_DOCK[0], y: 0.06, z: FBOAT_DOCK[1], s: 1.25 });
  const man = R.addChild(node, fnode(fmesh("boatman", () => FWM.person({ shirt: 0xf2a531, hat: "muetze", seed: 5 })), { y: 0.05, z: kind === "motor" ? -0.5 : 0.25, s: 0.85 }));
  const rod = R.addChild(node, fnode(fmesh("rod", FFM.rod), { x: 0.2, y: 0.6, z: 0.4, rx: ROD_REST, visible: false }));
  R.nodes.push(node);
  FISH.boat = { node, man, rod, kind, x: FBOAT_DOCK[0], z: FBOAT_DOCK[1], at: null };
  return FISH.boat;
}
function fishBobber() {
  const R = FV.R;
  if (FISH.bob && R.nodes.includes(FISH.bob)) return FISH.bob;
  FISH.bob = fnode(fmesh("bobber", () => { const b = new FM.MB(); b.sphere(0.09, 8, 6, 0xd8332b, { bottom: 0xffffff, smooth: true }); b.box(0.02, 0.16, 0.02, 0x2a2a2e, { y: 0.06 }); return b; }), { visible: false, shadow: false, s: 1.6 });
  R.nodes.push(FISH.bob);
  return FISH.bob;
}
/* Angeln an einem Fangplatz – vom Steg oder mit dem Boot */
function openFishingAt(gid) {
  if (!farmAreaOpen("see")) return openAreaInfo("see");
  const G = FGROUNDS.find(g => g.id === gid);
  if (!G) return;
  if (!farmGroundOk(G)) {
    sfx("bad");
    return toast(G.boat === 0 ? "Erst den Steg bauen." : G.boat === 2 ? "Für " + G.n + " brauchst du das Motorboot." : "Erst das Bootshaus mit Ruderboot bauen.", "warn");
  }
  if (gid === "steg" || gid === "u-steg") return fishStart(G, false);
  const B = fishBoatNode();
  if (!B) return;
  if (B.at === gid) return fishStart(G, true);
  fishSail(G, () => fishStart(G, true));
}
function fishStart(G, boat) {
  FISH.at = G.id;
  const st = farmObj1(G.area === "ufer" ? "u_steg" : "f_steg");
  FISH.steg = st ? st.t : null;
  /* Lehmanns Steg zeigt nach Westen in den See */
  if (!boat && st && st.t === "u_steg") { const [x, z] = farmCenter(st); farmFocusXZ(x - 4, z + 1.5, 17, 600); FISH.cast = [x - 5.6, z]; }
  else if (!boat && st) { const [x, z] = farmCenter(st); farmFocusXZ(x + 1.5, z + 4, 17, 600); FISH.cast = [x, z + 5.6]; }
  else if (FISH.boat) { farmFocusXZ(FISH.boat.x + 1, FISH.boat.z + 2, 18, 500); FISH.cast = [FISH.boat.x + 2.2, FISH.boat.z + 1.8]; }
  if (FISH.boat) FISH.boat.rod.visible = !!boat;
  farmSyncScene();
  MG.open("fish", {
    gid: G.id, boat,
    onCast: () => {
      FISH.rod = 1;
      const b = fishBobber();
      b.x = FISH.cast[0] + (Math.random() - 0.5); b.z = FISH.cast[1] + (Math.random() - 0.5); b.y = 0.06; b.visible = true;
      setTimeout(() => FV.R && FV.R.burst({ x: b.x, y: 0.05, z: b.z, n: 8, col: [0.9, 0.96, 1, 0.9], speed: 0.8, up: 1.4, size: 0.07, g: -6, life: 0.6 }), 250);
    },
    onBite: () => { FISH.bite = performance.now(); },
    onEnd: (ok, r) => {
      const b = FISH.bob;
      FISH.bite = 0; FISH.rod = 0;
      if (b) {
        FV.R.burst({ x: b.x, y: 0.05, z: b.z, n: ok ? 16 : 6, col: [0.9, 0.96, 1, 0.9], speed: 1.2, up: 2.4, size: 0.08, g: -6, life: 0.7 });
        b.visible = false;
        if (ok && r && r.id) { const p = FV.R.project(b.x, 0.4, b.z); if (p) { flyItem(FITEMS[r.id].i, p[0], p[1], storeBtn(), 200, 1); xpFly(p[0], p[1] - 10, r.xp, 350); } }
      }
      renderFarmUI();
    },
    onStop: () => { if (FISH.bob) FISH.bob.visible = false; FISH.bite = 0; }
  }, res => {
    FISH.at = null;
    if (FISH.boat) FISH.boat.rod.visible = false;
    farmSyncScene();
    if (boat && FISH.boat && FISH.boat.at && FISH.boat.at !== "dock") fishSail(null);
  });
}
/* Boot fahren: zum Fangplatz oder (G = null) zurück an den Anleger */
function fishSail(G, done) {
  const B = fishBoatNode();
  if (!B) return;
  const to = G ? [G.x - 1.6, G.z - 1.2] : FBOAT_DOCK;
  const sp = (FBOATS[S.farm.boat] || FBOATS[1]).speed * 1.6;
  FISH.trip = { from: [B.x, B.z], to, sp, done, gid: G ? G.id : "dock" };
  B.at = null;
  if (G && !S.farm.stats.boated) { S.farm.stats.boated = 1; }
  if (G) farmEvent("boat");
  sfx(B.kind === "motor" ? "horn" : "splash");
  if (G) toast((B.kind === "motor" ? "🚤 " : "🚣 ") + "Auf zur " + G.n + " …", "");
}
function openBoatSheet() {
  if (!farmAreaOpen("see")) return openAreaInfo("see");
  const F = S.farm, B = FBOATS[F.boat] || FBOATS[1], M = FBOATS[2];
  FV.sheetFn = openBoatSheet;
  const rows = FGROUNDS.filter(g => g.id !== "steg").map(g => {
    const ok = farmGroundOk(g), o = farmFishOdds(g.id), sum = Object.values(o).reduce((a, b) => a + b, 0);
    const top = Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, 3).map(id => FITEMS[id].i).join("");
    const sw = farmEvOn("schwarm") && F.ev.cur.data.g === g.id;
    const d = Math.round(Math.hypot(g.x - FBOAT_DOCK[0], g.z - FBOAT_DOCK[1]) / ((B.speed || 3) * 1.6));
    return `<button class="frec${ok ? "" : " lock"}" data-g="${g.id}" ${ok ? "" : "disabled"}><span class="ic">${ok ? g.i : "🔒"}</span><b>${esc(g.n)}${sw ? " · 🐟 Schwarm!" : ""}</b>
      <span class="fr-in"><span class="fchip">${top}</span></span><small>${ok ? "⛵ ca. " + d + " s Fahrt" : "nur mit dem Motorboot"}</small></button>`;
  }).join("");
  const canM = F.boat < 2;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">${F.boat >= 2 ? "🚤" : "🚣"}</span>Bootshaus<small>${esc(B.n)} · Fanggründe auf dem See</small></div>
    <div class="frecs">${rows}</div>
    ${canM ? `<button class="fup2" id="fbMotor" ${flv() < M.lv ? "disabled" : ""}><span>🚤</span><b>Motorboot kaufen</b><small>${flv() < M.lv ? "ab Level " + M.lv : "schneller, bis in die Tiefe Mitte und zur Bachmündung · " + eur(M.price) + " · " + Object.keys(M.need).map(k => fqty(k, M.need[k])).join(", ")}</small></button>` : ""}
    <div class="fs-sub">Wer wann beißt, hängt von Tageszeit und Wetter ab – tipp oben auf das Wetter.</div>`, "boat");
  $$("#farmSheetIn [data-g]").forEach(b => b.onclick = () => { closeFarmSheet(); openFishingAt(b.dataset.g); });
  const m = $("#fbMotor"); if (m) m.onclick = () => { if (farmBuyBoat()) { sfx("horn"); save(); fishBoatNode(); openBoatSheet(); } else sfx("bad"); };
}
/* Enten auf dem See, springende Fische, Boot und Pose */
function fishMakeLife() {
  const R = FV.R;
  FISH.ducks.forEach(d => { const i = R.nodes.indexOf(d.n); if (i >= 0) R.nodes.splice(i, 1); });
  FISH.ducks = [0, 1, 2, 3].map(i => {
    const n = fnode(fmesh("duck:" + (i % 2), () => FM.duck(i % 2)), { y: 0.04, s: 1.5 });
    R.nodes.push(n);
    return { n, a: i * 1.7, c: [[-4, 44], [-4, 44], [30, 56], [26, 40]][i], r: [4, 3, 3.5, 2.6][i], sp: [0.12, -0.1, 0.09, -0.14][i] };
  });
}
function fishStep(dt, time) {
  const R = FV.R, F = S.farm;
  if (!R || !F) return;
  const open = farmAreaOpen("see");
  if (open && FISH.ducks.length && !R.nodes.includes(FISH.ducks[0].n)) FISH.ducks = [];
  if (open && !FISH.ducks.length) fishMakeLife();
  FISH.ducks.forEach((d, i) => {
    d.a += d.sp * dt;
    d.n.x = d.c[0] + Math.cos(d.a) * d.r; d.n.z = d.c[1] + Math.sin(d.a) * d.r * 0.7;
    d.n.ry = Math.atan2(-Math.sin(d.a) * Math.sign(d.sp), Math.cos(d.a) * 0.7 * Math.sign(d.sp));
    d.n.y = 0.04 + Math.sin(time * 2 + i) * 0.012;
  });
  /* hin und wieder springt ein Fisch */
  if (open && time - FISH.jumpAt > 3 + Math.random() * 4) {
    FISH.jumpAt = time;
    const L = FWORLD.lake, a = Math.random() * 6.28, r = Math.random() * 0.7;
    const x = L.x + Math.cos(a) * L.rx * r, z = L.z + Math.sin(a) * L.rz * r;
    R.burst({ x, y: 0.05, z, n: 7, col: [0.9, 0.96, 1, 0.85], speed: 0.9, up: 1.8, size: 0.07, g: -6, life: 0.7 });
  }
  /* Boot liegt am Anleger oder fährt */
  const B = open ? fishBoatNode() : null;
  if (B) {
    const T = FISH.trip;
    if (T) {
      const dx = T.to[0] - B.x, dz = T.to[1] - B.z, d = Math.hypot(dx, dz), s = T.sp * dt;
      if (d <= s) {
        B.x = T.to[0]; B.z = T.to[1]; B.at = T.gid; FISH.trip = null;
        if (T.done) setTimeout(T.done, 150);
      } else {
        B.x += dx / d * s; B.z += dz / d * s;
        B.node.ry = Math.atan2(dx, dz);
        if (Math.random() < dt * 10) R.emit({ x: B.x - dx / d * 0.9, y: 0.06, z: B.z - dz / d * 0.9, vx: (Math.random() - 0.5) * 0.4, vz: (Math.random() - 0.5) * 0.4, life: 1.4, size: 0.1, size2: 0.35, col: [0.92, 0.96, 1, 0.45], drag: 0.5 });
        const c = R.cam;
        c.tx += (B.x + 1 - c.tx) * Math.min(1, dt * 3); c.tz += (B.z + 2 - c.tz) * Math.min(1, dt * 3);
        clampCam();
        FV.touchAt = performance.now();
      }
      B.man.rx = Math.sin(time * 5) * 0.15;
    } else if (!B.at || B.at === "dock") { B.node.ry = Math.PI; B.x = FBOAT_DOCK[0]; B.z = FBOAT_DOCK[1]; }
    B.node.x = B.x; B.node.z = B.z;
    B.node.y = 0.06 + Math.sin(time * 1.6) * 0.025;
    B.node.rz = Math.sin(time * 1.1) * 0.03;
  }
  /* Pose wippt, beim Biss taucht sie ab */
  if (FISH.bob && FISH.bob.visible) {
    const bite = FISH.bite && performance.now() - FISH.bite < 1200;
    FISH.bob.y = bite ? -0.03 + Math.sin(time * 28) * 0.05 : 0.05 + Math.sin(time * 2.4) * 0.02;
  }
  /* Rute am Steg und im Boot */
  const st = farmObj1(FISH.steg || "f_steg"), e = st && FV.nodes.get(st.id);
  const rx = ROD_REST + (FISH.bite ? 0.32 + Math.sin(time * 18) * 0.12 : FISH.rod ? -0.1 : 0);
  if (e && e.parts.rod) e.parts.rod.rx = rx;
  if (B) B.rod.rx = rx;
}

/* ------------------------- Lehmanns Ufergrundstück ------------------------
   Ein Fenster für alles am Ufer: Angeln mit Köderwahl, Ruten, Reusen,
   Bert Flomann (Turnier, Würmer, Profi-Köder) und das Fangbuch. */
const BERT_IMG = "bert.png";
FV.uferTab = "fish";
function bertFig() { return `<div class="fv-fig img"><img src="${BERT_IMG}" alt="Bert Flomann"></div>`; }
function openUfer(tab) {
  if (!farmAreaOpen("ufer") || !uferS()) return openAreaInfo("ufer");
  const U = uferS();
  if (tab) FV.uferTab = tab;
  FV.sheetFn = () => openUfer();
  const tabs = [["fish", "🎣 Angeln"], ["gear", "🛠️ Ruten"], ["pot", "🪤 Reusen"], ["bert", U.tour.done ? "🧔 Bert" : "🏆 Turnier"], ["log", "📖 Fangbuch"]];
  const body = { fish: uferFishHTML, gear: uferGearHTML, pot: uferPotHTML, bert: uferBertHTML, log: uferLogHTML }[FV.uferTab] || uferFishHTML;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🛶</span>Lehmanns Ufer<small>${esc(FRODS[U.rod].n)} · ${U.log.length ? U.log.length + " Fänge im Fangbuch" : "noch kein Fang"}</small></div>
    <div class="fs-tabs">${tabs.map(([k, n]) => `<button data-ut="${k}" class="${FV.uferTab === k ? "on" : ""}">${n}</button>`).join("")}</div>
    ${body(U)}`, "ufer");
  const on = (sel, fn) => $$("#farmSheetIn " + sel).forEach(b => b.onclick = () => fn(b));
  const redo = ok => { if (ok) { sfx("coin"); save(); } else sfx("bad"); openUfer(); renderFarmUI(); };
  on("[data-ut]", b => { FV.uferTab = b.dataset.ut; sfx("tap"); openUfer(); });
  on("[data-bait]", b => { U.bait = b.dataset.bait; sfx("tap"); save(); openUfer(); });
  on("[data-go]", b => { closeFarmSheet(); openFishingAt(b.dataset.go); });
  on("[data-rod]", b => redo(farmBuyRod(+b.dataset.rod)));
  on("#ufPotBuy", () => { const ok = uferPotBuy(); if (ok) farmSyncScene(); redo(ok); });
  on("#ufPotUp", () => redo(uferPotUp()));
  on("[data-pot]", b => { const o = farmObj(+b.dataset.pot); closeFarmSheet(); if (o) { const [x, z] = farmCenter(o); farmFocusXZ(x, z, 18, 600); } });
  on("#ufTour", () => openTournament());
  on("#ufWorms", () => redo(bertWorms()));
  on("#ufLure", () => redo(bertOrderLures()));
  on("#ufLureGet", () => { if (bertCollect()) { sfx("collect"); toast("✨ " + FBERT.lures.n + " Profi-Köder abgeholt.", "ok"); save(); } else sfx("bad"); openUfer(); });
  /* Restzeit von Berts Bestellung läuft mit */
  const key = () => [U.bert.lureQ ? Math.ceil((U.bert.lureQ.end - S.time) / 5) : "-", Math.floor(S.money / 50), flv()].join("|");
  const k0 = key();
  FV.sheetTick = () => { if (FV.sheet === "ufer" && key() !== k0) openUfer(); };
}
function uferFishHTML(U) {
  const w = uferClassW(U.bait, U.rod), cls = { klein: "kleine", mittel: "mittlere", gross: "große" };
  const chips = Object.keys(FBAITS).map(b => { const B = FBAITS[b], why = uferBaitWhy(b);
    return `<button class="mg-bait${U.bait === b ? " on" : ""}" data-bait="${b}" ${why ? "disabled" : ""}><span>${B.i}</span><b>${esc(B.n)}</b><small>${why ? esc(why) : uferBaitN(b) + " Würfe"}</small></button>`; }).join("");
  const odds = FCLS.filter(c => w[c]).map(c => `${Math.round(w[c] * 100)} % ${cls[c]}`).join(" · ");
  const gs = FGROUNDS.filter(g => g.area === "ufer").map(g => { const ok = farmGroundOk(g);
    return `<button class="frec${ok ? "" : " lock"}" data-go="${g.id}" ${ok ? "" : "disabled"}><span class="ic">${ok ? g.i : "🔒"}</span><b>${esc(g.n)}</b><small>${g.boat ? (ok ? "mit dem Boot" : "braucht das Ruderboot aus dem Bootshaus") : "direkt vom Steg"}</small></button>`; }).join("");
  return `<div class="fs-sub">Köder – bessere Köder locken größere Arten:</div><div class="mg-baits">${chips}</div>
    <div class="fs-sub">${FRODS[U.rod].i} ${esc(FRODS[U.rod].n)} + ${FBAITS[U.bait].i} ${esc(FBAITS[U.bait].n)}: Es beißen <b>${odds}</b> Fische.</div>
    <div class="frecs">${gs}</div>
    <div class="fs-sub">Jeder Fisch hat seine eigene Länge und sein Gewicht. Große, gut genährte Exemplare und ein ruhiger Drill geben mehr Sterne – und Sterne bringen mehr Geld.</div>`;
}
function uferGearHTML(U) {
  const rods = [1, 2, 3].map(n => { const R = FRODS[n], have = U.rod >= n;
    const why = have ? "✓ deine" : U.rod < n - 1 ? "erst " + FRODS[n - 1].n : flv() < R.lv ? "ab Level " + R.lv : S.money < R.price ? "zu wenig Geld" : "";
    return `<div class="uf-row"><span class="ic">${R.i}</span><div><b>${esc(R.n)}</b><small>${n === 1 ? "von Lehmann geschenkt" : "grüner Bereich +" + Math.round(R.zone * 100) + " % · größere Fische"}${n === 3 ? " · nötig für Profi-Köder" : ""}</small></div>
      ${n === 1 ? "" : `<button class="btn tiny" data-rod="${n}" ${why ? "disabled" : ""}>${why || eur(R.price)}</button>`}</div>`; }).join("");
  return `<div class="fs-sub">Ruten</div><div class="uf-list">${rods}</div>
    <div class="fs-sub">Die bessere Rute schiebt die Chancen zu größeren Arten – zusammen mit dem Köder. Mais bleibt Mais: damit beißen immer nur die Kleinen.</div>`;
}
function uferPotHTML(U) {
  const pots = uferPots(), lv = flv(), nx = FPOT_UP[U.potLvl + 1], pc = FUFER.potCost[pots.length];
  const rows = pots.map((o, i) => { const st = potState(o);
    return `<div class="uf-row"><span class="ic">🪤</span><div><b>Reuse ${i + 1}</b><small>${st === "empty" ? "leer – Köder rein" : st === "ripe" ? "voll – hochziehen!" : esc(FPOTS[o.kind].n) + " · noch " + fdur(Math.max(1, o.end - S.time))}</small></div>
      <button class="btn tiny ghost" data-pot="${o.id}">Zeigen</button></div>`; }).join("");
  const tiers = Object.keys(FPOTS).map(id => { const P = FPOTS[id];
    return `<div class="uf-row${U.potLvl >= P.tier ? "" : " lock"}"><span class="ic">${FITEMS[id].i}</span><div><b>Stufe ${P.tier}: ${esc(P.n)}</b><small>${Object.keys(P.mix).map(x => Math.round(P.mix[x] * 100) + " % " + FITEMS[x].n).join(" · ")}</small></div></div>`; }).join("");
  const upWhy = !nx ? "" : lv < nx.lv ? "ab Level " + nx.lv : S.money < nx.cost ? "zu wenig Geld" : "";
  return `<div class="uf-list">${rows}</div>
    ${pc != null && pots.length < FUFER.potSpots.length ? `<button class="btn tiny" id="ufPotBuy" ${S.money < pc ? "disabled" : ""}>🪤 Weitere Reuse · ${eur(pc)}</button>` : ""}
    <div class="fs-sub">Reusenstufen</div><div class="uf-list">${tiers}</div>
    ${nx ? `<button class="btn tiny" id="ufPotUp" ${upWhy ? "disabled" : ""}>${upWhy || "Reusen auf Stufe " + (U.potLvl + 1) + " · " + eur(nx.cost)}</button>` : ""}
    <div class="fs-sub">Tipp auf eine Reuse im Wasser: Köder (Dose oder eine Portion Mais) rein, später mit dem Haken hochziehen. Jedes Tier hat Größe, Gewicht und Sterne – bessere Reusen fangen größere Tiere.</div>`;
}
function uferBertHTML(U) {
  if (!U.tour.done) {
    const ok = tourCanStart(), n = Math.min(FTOUR.need, U.cnt.klein);
    return `<div class="fvisit">${bertFig()}<div class="fv-tx"><b>Angler-Turnier am Ufer</b><small>du richtest aus</small>
      <p>Fünf Angler aus dem Dorf: ${FTOUR.members.map(m => esc(m.n)).join(", ")}. Wer nach ${FTOUR.mins} Minuten das meiste Gewicht im Kescher hat, gewinnt. ${FTOUR.members.length} × ${eur(FTOUR.fee)} Startgeld, ${eur(FTOUR.prize)} Preisgeld.</p></div></div>
      <div class="uf-row"><span class="ic">🐟</span><div><b>Erst selbst üben</b><small>Fang ${FTOUR.need} kleine Fische am Ufer · ${n}/${FTOUR.need}</small></div><span class="uf-bar"><i style="width:${n / FTOUR.need * 100}%"></i></span></div>
      <button class="btn fgo" id="ufTour" ${ok ? "" : "disabled"}>🏆 Turnier veranstalten</button>`;
  }
  const q = U.bert.lureQ, L = FBERT.lures, need = FBERT.lureNeed;
  let lure;
  if (!bertLureOk()) lure = `<div class="fs-empty">🧔 „Ich tüftel an was Großem. Zeig mir erst, dass du mit der Spinnrute umgehen kannst.“<br>
    <small>${U.rod < need.rod ? "Spinnrute fehlt · " : ""}${Math.min(need.mittel, U.cnt.mittel)}/${need.mittel} mittlere Fische am Ufer</small></div>`;
  else if (!q) lure = `<div class="uf-row"><span class="ic">✨</span><div><b>${L.n} Profi-Köder</b><small>für Hecht, Zander und Wels · ${fdur(L.t)} Arbeit</small></div>
    <button class="btn tiny" id="ufLure" ${S.money < L.price ? "disabled" : ""}>${eur(L.price)}</button></div>`;
  else if (S.time >= q.end) lure = `<div class="uf-row"><span class="ic">✨</span><div><b>Profi-Köder fertig</b><small>Bert hat ${q.n} Stück gebaut</small></div><button class="btn tiny" id="ufLureGet">Abholen</button></div>`;
  else lure = `<div class="uf-row"><span class="ic">✨</span><div><b>Bert baut Köder</b><small>noch ${fdur(Math.max(1, q.end - S.time))}</small></div><span class="uf-bar"><i style="width:${Math.round(clamp(1 - (q.end - S.time) / L.t, 0, 1) * 100)}%"></i></span></div>`;
  return `<div class="fvisit">${bertFig()}<div class="fv-tx"><b>Bert Flomann</b><small>Turniersieger · Wurmkasten und Köderwerkstatt</small>
      <p>„Moin! Für ein kleines Entgelt sammel ich dir Tauwürmer – damit beißen Barsche und Forellen.“</p></div></div>
    <div class="uf-row"><span class="ic">🪱</span><div><b>${FBERT.worms.n} Tauwürmer</b><small>du hast ${farmInv("wurm")}</small></div>
      <button class="btn tiny" id="ufWorms" ${S.money < FBERT.worms.price ? "disabled" : ""}>${eur(FBERT.worms.price)}</button></div>
    ${lure}`;
}
function uferLogHTML(U) {
  const best = Object.keys(U.best).map(id => { const b = U.best[id];
    return `<div class="uf-row"><span class="ic">${FITEMS[id].i}</span><div><b>${esc(FITEMS[id].sg || FITEMS[id].n)}</b><small>Rekord: ${fmt(b.cm, 1)} cm · ${fishKgTxt(b.kg)} · ${qStars(b.q)}</small></div></div>`; }).join("");
  const last = U.log.slice(0, 12).map(e => `<div class="uf-row"><span class="ic">${FITEMS[e.sp].i}</span><div><b>${esc(FITEMS[e.sp].sg || FITEMS[e.sp].n)}</b><small>${fmt(e.cm, 1)} cm · ${fishKgTxt(e.kg)} · ${qStars(e.q)} ${esc(fishQName(e.q))}</small></div><small>${eur(specValue(e.sp, e.q))}</small></div>`).join("");
  return U.log.length ? `<div class="fs-sub">🏆 Rekorde</div><div class="uf-list">${best}</div><div class="fs-sub">Letzte Fänge</div><div class="uf-list">${last}</div>`
    : `<div class="fs-empty">Noch leer. Jeder Fang am Ufer und aus den Reusen landet hier – mit Länge, Gewicht und Sternen.</div>`;
}

/* ------------------------------ Angler-Turnier ---------------------------- */
function openTournament() {
  const res = tourStart();
  if (!res) return;
  const T = { min: 0, i: 0, kg: new Map(res.map(p => [p, 0])), log: [] };
  const feed = [];
  res.forEach(p => p.catches.forEach(f => feed.push({ p, f })));
  feed.sort((a, b) => a.f.t - b.f.t);
  FV.sheetFn = null;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏆</span>Angler-Turnier<small>Fünf Angler · ${FTOUR.mins} Minuten · das meiste Gewicht gewinnt</small></div>
    <div class="uf-clock" id="trClock"></div><div class="uf-list" id="trTable"></div><div class="uf-feed" id="trFeed"></div>
    <div class="fs-row"><button class="btn tiny ghost" id="trSkip">Überspringen ⏩</button></div>`, "tour");
  const draw = () => {
    const rows = res.slice().sort((a, b) => T.kg.get(b) - T.kg.get(a));
    const end = T.min >= FTOUR.mins;
    $("#trClock").textContent = end ? "Abpfiff!" : "⏱ Minute " + Math.floor(T.min) + " von " + FTOUR.mins;
    $("#trTable").innerHTML = rows.map((p, i) => `<div class="uf-row${p.bert ? " bert" : ""}"><span class="ic">${i === 0 && end ? "🏆" : p.bert ? `<img src="${BERT_IMG}" alt="">` : p.i}</span>
      <div><b>${i + 1}. ${esc(p.n)}</b><small>${(n => n + (n === 1 ? " Fang" : " Fänge"))(p.catches.filter(f => f.t <= T.min).length)}</small></div><b>${fishKgTxt(T.kg.get(p))}</b></div>`).join("");
    $("#trFeed").innerHTML = T.log.slice(-3).reverse().map(x => `<div>${x}</div>`).join("");
  };
  const step = () => {
    while (T.i < feed.length && feed[T.i].f.t <= T.min) {
      const { p, f } = feed[T.i++];
      T.kg.set(p, T.kg.get(p) + f.kg);
      T.log.push(`${FITEMS[f.sp].i} <b>${esc(p.n)}</b>: ${esc(FITEMS[f.sp].sg)} ${fmt(f.cm, 1)} cm${p.bert && f.t >= FTOUR.mins ? " – <b>kapital!</b>" : ""}`);
      if (p.bert && f.t >= FTOUR.mins) sfx("level");
    }
    draw();
  };
  const finish = () => {
    clearInterval(T.iv);
    T.min = FTOUR.mins + 0.5; step();
    const b = $("#trSkip"); if (b) b.outerHTML = `<button class="btn fgo" id="trBert">🏆 Zur Siegerehrung</button>`;
    $("#trBert").onclick = bertTalk;
  };
  /* eine Turnierminute ≈ 0,7 s; Fenster zu = Ticker stoppt (das Ergebnis ist gespeichert) */
  T.iv = setInterval(() => {
    if (FV.sheet !== "tour") return clearInterval(T.iv);
    T.min += 0.25; step();
    if (T.min >= FTOUR.mins + 0.5) finish();
  }, 175);
  $("#trSkip").onclick = finish;
  step();
}
function bertTalk() {
  if (!tourFinish()) return openUfer("bert");
  save();
  sfx("coin");
  FV.uferTab = "bert";
  openFarmSheet(`<div class="fvisit">${bertFig()}<div class="fv-tx"><b>Bert Flomann</b><small>Sieger des Angler-Turniers</small>
      <p>„Moin! Bert Flomann. Schönes Turnier – und der Barsch zum Schluss war ein Prachtkerl. Pass auf: Ich hab einen Wurmkasten im Garten. Für ein kleines Entgelt sammel ich dir Tauwürmer – damit beißen auch Barsche und Forellen. Und wenn du ordentlich was rausholst, bau ich dir später richtige Köder für die Großen.“</p></div></div>
    <div class="fv-msg">🏆 Startgeld ${eur(FTOUR.members.length * FTOUR.fee)} − Preisgeld ${eur(FTOUR.prize)} · +${FTOUR.xp} EP</div>
    <button class="btn fgo" id="bertOk">🤝 Abgemacht!</button>`, "visit");
  $("#bertOk").onclick = () => openUfer("bert");
  renderFarmUI();
}
