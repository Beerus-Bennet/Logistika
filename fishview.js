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
  if (!angelS()) { sfx("bad"); return toast("Erst den Steg bauen – dort liegt Lehmanns alte Angel.", "warn"); }
  if (gid === "steg") return fishStart(G, false);
  const B = fishBoatNode();
  if (!B) return;
  if (B.at === gid) return fishStart(G, true);
  fishSail(G, () => fishStart(G, true));
}
function fishStart(G, boat) {
  FISH.at = G.id;
  const st = farmObj1("f_steg");
  if (!boat && st) { const [x, z] = farmCenter(st); farmFocusXZ(x + 1.5, z + 4, 17, 600); FISH.cast = [x, z + 5.6]; }
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
        if (ok && r && r.id) { const p = FV.R.project(b.x, 0.4, b.z); if (p) { flyItem(r.id, p[0], p[1], storeBtn(), 200, 1); xpFly(p[0], p[1] - 10, r.xp, 350); } }
      }
      renderFarmUI();
    },
    onStop: () => { if (FISH.bob) FISH.bob.visible = false; FISH.bite = 0; }
  }, res => {
    FISH.at = null;
    if (FISH.boat) FISH.boat.rod.visible = false;
    farmSyncScene();
    if (boat && FISH.boat && FISH.boat.at && FISH.boat.at !== "dock") fishSail(null);
    /* v59: neue Art gefangen – Bert fragt nach dem Fisch */
    setTimeout(bertAskOpen, 350);
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
    const ok = farmGroundOk(g), o = angelS() ? angelOdds(g.id) : farmFishOdds(g.id), sum = Object.values(o).reduce((a, b) => a + b, 0);
    const top = Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, 3).map(id => icHTML(id)).join("");
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
  const st = farmObj1("f_steg"), e = st && FV.nodes.get(st.id);
  const rx = ROD_REST + (FISH.bite ? 0.32 + Math.sin(time * 18) * 0.12 : FISH.rod ? -0.1 : 0);
  if (e && e.parts.rod) e.parts.rod.rx = rx;
  if (B) B.rod.rx = rx;
}

/* ------------------------------- Am Steg ----------------------------------
   Ein Fenster für alles rund ums Angeln: Fanggrund und Köder, Ruten, Reusen,
   Angler-Turnier, Bert Flomann (Würmer, Profi-Köder) und das Fangbuch. */
const BERT_IMG = "bert.png";
FV.stegTab = "fish";
function bertFig() { return `<div class="fv-fig img"><img src="${BERT_IMG}" alt="Bert Flomann"></div>`; }
/* Lina beim ersten Besuch am Steg: Lehmanns alte Angel */
function stegLina() {
  const U = angelS(), img = typeof guideArt !== "undefined" && guideArt ? `<img src="${guideArt}" alt="Lina Sturm">` : "👩";
  FV.sheetFn = null;
  openFarmSheet(`<div class="fvisit"><div class="fv-fig img">${img}</div><div class="fv-tx"><b>Lina Sturm</b><small>Disponentin</small>
      <p>„Chef, der Steg steht! Der alte Lehmann hat dir seine Angel dagelassen – einfach, aber sie fängt. Die Weißfische hier beißen auf Mais, den hast du im Silo. Wenn du ein paar gefangen hast, könnten wir mal ein Angler-Turnier veranstalten.“</p></div></div>
    <div class="fv-msg">🎣 ${esc(FRODS[1].n)} · 🪤 eine Reuse am Steg</div>
    <button class="btn fgo" id="fvGo">👍 Danke, Lina!</button>`, "visit");
  $("#fvGo").onclick = () => { U.linaSeen = true; save(); openSteg("fish"); };
}
function openSteg(tab) {
  if (!farmObj1("f_steg") || !angelS()) return toast("Erst den Steg bauen.", "warn");
  const U = angelS();
  if (!U.linaSeen) return stegLina();
  if (tab) FV.stegTab = tab;
  FV.sheetFn = () => openSteg();
  /* v58: Turnier ist ein eigener Reiter, solange es noch aussteht.
     v59: Bert hat keinen Reiter mehr – er steht mit dem Kombi am Ufer (Werkstatt) */
  if ((FV.stegTab === "tour" && U.tour.done) || FV.stegTab === "bert") FV.stegTab = "fish";
  const tabs = [["fish", "🎣 Angeln"], ["gear", "🛠️ Ruten"], ["pot", "🪤 Reusen"]].concat(U.tour.done ? [] : [["tour", "🏆 Turnier"]], [["log", "📖 Fangbuch"]]);
  const body = { fish: stegFishHTML, gear: stegGearHTML, pot: stegPotHTML, tour: stegTourHTML, log: stegLogHTML }[FV.stegTab] || stegFishHTML;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🪵</span>Am Steg<small>${esc(FRODS[U.rod].n)} · ${U.log.length ? U.log.length + " Fänge im Fangbuch" : "noch kein Fang"}</small></div>
    <div class="fs-tabs">${tabs.map(([k, n]) => `<button data-ut="${k}" class="${FV.stegTab === k ? "on" : ""}">${n}</button>`).join("")}</div>
    ${body(U)}`, "steg");
  const on = (sel, fn) => $$("#farmSheetIn " + sel).forEach(b => b.onclick = () => fn(b));
  const redo = ok => { if (ok) { sfx("coin"); save(); } else sfx("bad"); openSteg(); renderFarmUI(); };
  on("[data-ut]", b => { FV.stegTab = b.dataset.ut; sfx("tap"); openSteg(); });
  on("[data-bait]", b => { U.bait = b.dataset.bait; sfx("tap"); save(); openSteg(); });
  on("[data-go]", b => { closeFarmSheet(); openFishingAt(b.dataset.go); });
  on("[data-rod]", b => redo(farmBuyRod(+b.dataset.rod)));
  on("#ufPotBuy", () => { const ok = angelPotBuy(); if (ok) farmSyncScene(); redo(ok); });
  on("#ufPotUp", () => redo(angelPotUp()));
  on("[data-pot]", b => { const o = farmObj(+b.dataset.pot); closeFarmSheet(); if (o) { const [x, z] = farmCenter(o); farmFocusXZ(x, z, 18, 600); } });
  on("#ufTour", () => { if (!U.tour.paid && !tourStart()) return redo(false); renderFarmUI(); openTournament(); });
  /* Geld und Level ändern die Knöpfe */
  const key = () => [Math.floor(S.money / 50), flv()].join("|");
  const k0 = key();
  FV.sheetTick = () => { if (FV.sheet === "steg" && key() !== k0) openSteg(); };
}
function stegFishHTML(U) {
  const w = angelClassW(U.bait, U.rod), cls = { klein: "kleine", mittel: "mittlere", gross: "große" };
  const chips = Object.keys(FBAITS).filter(angelBaitShow).map(b => { const B = FBAITS[b], why = angelBaitWhy(b);
    return `<button class="mg-bait${U.bait === b ? " on" : ""}" data-bait="${b}" ${why ? "disabled" : ""}><span>${icHTML(B.item)}</span><b>${esc(B.n)}</b><small>${why ? esc(why) : angelBaitN(b) + " Würfe"}</small></button>`; }).join("");
  const sp = FBAITS[U.bait].spec, odds = sp ? "nur " + esc(FFISH[sp].n) : FCLS.filter(c => w[c]).map(c => `${Math.round(w[c] * 100)} % ${cls[c]}`).join(" · ");
  const gs = FGROUNDS.map(g => { const ok = farmGroundOk(g);
    return `<button class="frec${ok ? "" : " lock"}" data-go="${g.id}" ${ok ? "" : "disabled"}><span class="ic">${ok ? g.i : "🔒"}</span><b>${esc(g.n)}</b><small>${g.boat === 0 ? "direkt vom Steg" : ok ? "mit dem Boot" : g.boat === 2 ? "braucht das Motorboot" : "braucht das Ruderboot"}</small></button>`; }).join("");
  return `<div class="fs-sub">Köder – bessere Köder locken größere Arten:</div><div class="mg-baits">${chips}</div>
    <div class="fs-sub">${FRODS[U.rod].i} ${esc(FRODS[U.rod].n)} + ${FBAITS[U.bait].i} ${esc(FBAITS[U.bait].n)}: Es beißen <b>${odds}</b>${sp ? "" : " Fische"}.</div>
    <div class="frecs">${gs}</div>
    <div class="fs-sub">Jeder Fisch hat seine eigene Länge und sein Gewicht – daraus kommen die Sterne. Große Fische ziehen im Kreis schneller und sprunghafter; eine bessere Rute macht den grünen Bogen breiter.</div>`;
}
function stegGearHTML(U) {
  const rods = [1, 2, 3].map(n => { const R = FRODS[n], have = U.rod >= n;
    const why = have ? "✓ deine" : U.rod < n - 1 ? "erst " + FRODS[n - 1].n : flv() < R.lv ? "ab Level " + R.lv : S.money < R.price ? "Zu wenig Geld – benötigt: " + eur(R.price) : "";
    return `<div class="uf-row"><span class="ic">${R.i}</span><div><b>${esc(R.n)}</b><small>grüner Bogen ${R.gw}° · ${n === 1 ? "von Lehmann geschenkt" : "größere Fische"}${n === 3 ? " · nötig für Profi-Köder" : ""}</small></div>
      ${n === 1 ? "" : `<button class="btn tiny" data-rod="${n}" ${why ? "disabled" : ""}>${why || eur(R.price)}</button>`}</div>`; }).join("");
  return `<div class="fs-sub">Ruten</div><div class="uf-list">${rods}</div>
    <div class="fs-sub">Die bessere Rute schiebt die Chancen zu größeren Arten und macht den Drill leichter: breiterer Bogen, Leiste füllt sich schneller und leert sich langsamer. Mais bleibt Mais – damit beißen nur die Kleinen.</div>`;
}
function stegPotHTML(U) {
  const pots = angelPots(), lv = flv(), nx = FPOT_UP[U.potLvl + 1], pc = FANGEL.potCost[pots.length];
  const rows = pots.map((o, i) => { const st = potState(o);
    return `<div class="uf-row"><span class="ic">🪤</span><div><b>Reuse ${i + 1}</b><small>${st === "empty" ? "leer – Köder rein" : st === "ripe" ? "voll – hochziehen!" : esc(FPOTS[o.kind].n) + " · noch " + fdur(Math.max(1, o.end - S.time))}</small></div>
      <button class="btn tiny ghost" data-pot="${o.id}">Zeigen</button></div>`; }).join("");
  const tiers = Object.keys(FPOTS).map(id => { const P = FPOTS[id];
    return `<div class="uf-row${U.potLvl >= P.tier ? "" : " lock"}">${itemIc(id)}<div><b>Stufe ${P.tier}: ${esc(P.n)}</b><small>${Object.keys(P.mix).map(x => Math.round(P.mix[x] * 100) + " % " + FITEMS[x].n).join(" · ")}</small></div></div>`; }).join("");
  const upWhy = !nx ? "" : lv < nx.lv ? "ab Level " + nx.lv : S.money < nx.cost ? "Zu wenig Geld – benötigt: " + eur(nx.cost) : "";
  return `<div class="uf-list">${rows}</div>
    ${pc != null && pots.length < FANGEL.potSpots.length ? `<button class="btn tiny" id="ufPotBuy" ${S.money < pc ? "disabled" : ""}>${S.money < pc ? "Zu wenig Geld – benötigt: " + eur(pc) : "🪤 Weitere Reuse · " + eur(pc)}</button>` : ""}
    <div class="fs-sub">Reusenstufen</div><div class="uf-list">${tiers}</div>
    ${nx ? `<button class="btn tiny" id="ufPotUp" ${upWhy ? "disabled" : ""}>${upWhy || "Reusen auf Stufe " + (U.potLvl + 1) + " · " + eur(nx.cost)}</button>` : ""}
    <div class="fs-sub">Tipp auf eine Reuse im Wasser: Reusenköder (oder eine Portion Mais) rein, später mit dem Haken hochziehen. Jedes Tier hat Größe, Gewicht und Sterne – bessere Reusen fangen größere Tiere.</div>`;
}
/* fünf Teilnehmer, alle gleich dargestellt: Initialen, Ort, kurze Vorstellung */
function tourMemberRow(m, extra) {
  return `<div class="uf-row"><span class="ic"><span class="uf-ini">${esc(m.ini)}</span></span><div><b>${esc(m.n)}</b><small>${esc(m.from)} · ${esc(m.about)}</small></div>${extra || ""}</div>`;
}
function stegTourHTML(U) {
  {
    const ok = tourCanStart(), n = Math.min(FTOUR.need, U.cnt.klein), c = tourCost(), miss = U.tour.paid ? 0 : c - S.money;
    const btn = U.tour.paid ? "🏆 Turnier fortsetzen" : !ok ? "🏆 Turnier veranstalten" : miss > 0 ? "Es fehlen " + eur(miss) : "🏆 Turnier veranstalten · " + eur(c);
    return `<div class="lk-poster"><b>🏆 Angler-Turnier am Glindower See</b>
        <p>Fünf Angler aus der Gegend, ${FTOUR.mins} Minuten, das meiste Gesamtgewicht gewinnt. Du richtest aus: ${eur(FTOUR.cost)} Veranstaltung + ${eur(FTOUR.prize)} Preisgeld für den Sieger.</p></div>
      <div class="uf-list">${FTOUR.members.map(m => tourMemberRow(m)).join("")}</div>
      <div class="uf-row"><span class="ic">🐟</span><div><b>Erst selbst üben</b><small>Fang ${FTOUR.need} kleine Fische · ${n}/${FTOUR.need}</small></div><span class="uf-bar"><i style="width:${n / FTOUR.need * 100}%"></i></span></div>
      <button class="btn fgo" id="ufTour" ${U.tour.paid || (ok && miss <= 0) ? "" : "disabled"}>${btn}</button>`;
  }
}
/* ------------------------- v59: Berts alter Kombi -------------------------
   Bert steht nach dem Turnier mit seinem Kombi am Ufer. Antippen öffnet direkt die Werkstatt (Tauwürmer,
   Profi-Köder, Spezialköder) mit Dauerbestellung; die Köder-Entwicklung liegt hinter einem Knopf. */
/* Berts Werkstatt (farmview.openMachine): oben unter dem Titel Bert (bertTopHTML),
   bei der Warteschlange alte Bestellung und Dauerbestellung (bertWorkHTML über machExtraHTML),
   ganz unten der Knopf zur Köder-Entwicklung (bertDevBtnHTML) */
function bertTopHTML() {
  return `<div class="fvisit">${bertFig()}<div class="fv-tx"><b>Bert Flomann</b><small>Turniersieger · Köderwerkstatt im Kofferraum</small>
      <p>„Moin! Was darf's sein? Würmer hab ich immer, und bring mir ruhig mal einen Fisch vorbei – dann bau ich dir einen Spezialköder.“</p></div></div>`;
}
function bertWorkHTML(o) {
  const U = angelS();
  if (!U) return "";
  const keep = U.bert.keep || 0, need = FBERT.lureNeed, old = U.bert.lureQ;
  const oldH = !old ? "" : S.time >= old.end
    ? `<div class="uf-row"><span class="ic">✨</span><div><b>Profi-Köder fertig</b><small>deine alte Bestellung · ${old.n} Stück</small></div><button class="btn tiny" id="bLureGet">Abholen</button></div>`
    : `<div class="uf-row"><span class="ic">✨</span><div><b>Bert baut Profi-Köder</b><small>deine alte Bestellung · noch ${fdur(Math.max(1, old.end - S.time))}</small></div></div>`;
  const lureH = bertLureOk() ? "" : `<div class="fs-empty">„Für die richtig Großen tüftel ich an Profi-Ködern. Zeig mir erst, dass du mit der Spinnrute umgehen kannst.“<br>
    <small>${U.rod < need.rod ? "Spinnrute fehlt · " : ""}${Math.min(need.mittel, U.cnt.mittel)}/${need.mittel} mittlere Fische</small></div>`;
  return `${oldH}${lureH}
    <div class="fs-sub">🪱 Dauerbestellung: Bert hält Tauwürmer vorrätig (du hast ${farmInv("wurm")}). Er legt neue in die Werkstatt, sobald ein Platz frei ist und das Geld reicht.</div>
    <div class="fs-row">${FBERT_KEEP.map(k => `<button class="btn tiny${k === keep ? "" : " ghost"}" data-keep="${k}">${k ? k + " Stück" : "aus"}</button>`).join("")}</div>`;
}
function bertDevBtnHTML() {
  const ask = Object.keys(FSPEC_BAIT).filter(id => specS(id) && !specWhy(id)).length;
  const dev = Object.keys(FSPEC_BAIT).filter(id => { const s = specS(id); return s && s.dev && !specDone(id); }).length;
  return `<button class="fup2" id="bDev"><span>🎯</span><b>Köder-Entwicklung</b><small>${ask ? "🐟 " + ask + " Fisch" + (ask > 1 ? "e" : "") + " für Bert bereit" : dev ? "⏳ Bert entwickelt" : "Fisch übergeben – Bert entwickelt einen Köder nur für diese Art"}</small></button>`;
}
function bertWorkBind(o) {
  const U = angelS(), on = (sel, fn) => $$("#farmSheetIn " + sel).forEach(b => b.onclick = () => fn(b));
  on("#bLureGet", () => { if (bertCollect()) { sfx("collect"); toast("✨ " + FBERT.lures.n + " Profi-Köder abgeholt.", "ok"); save(); } else sfx("bad"); openMachine(o); });
  on("[data-keep]", b => { U.bert.keep = +b.dataset.keep; sfx("tap"); bertKeepTick(); save(); openMachine(o); });
  on("#bDev", () => { sfx("tap"); openBertDev(); });
}
/* Köder-Entwicklung: alle Arten – ❓, entdeckt (Fisch übergeben), in Arbeit, fertig */
function openBertDev() {
  const U = angelS(), o = bertCar();
  if (!U || !o) return;
  FV.sheetFn = openBertDev;
  const spec = Object.keys(FSPEC_BAIT).map(id => {
    const s = specS(id), f = FFISH[id];
    if (!s) return `<div class="uf-row lock"><span class="ic">❓</span><div><b>???</b><small>noch nicht selbst gefangen</small></div></div>`;
    let st, right = "";
    if (specDone(id)) { const n = farmInv("sk_" + id); st = "✓ entwickelt" + (n ? " · " + n + " im Lager" : "") + " · in der Werkstatt bestellen"; }
    else if (s.dev) { st = "⏳ Bert entwickelt – noch " + fdur(Math.max(1, s.dev.end - S.time)); right = `<span class="uf-bar"><i style="width:${Math.round(clamp(1 - (s.dev.end - S.time) / FSPEC_DEV, 0, 1) * 100)}%"></i></span>`; }
    else { const why = specWhy(id); st = "entdeckt · Entwicklung " + fdur(FSPEC_DEV); right = `<button class="btn tiny" data-give="${id}" ${why ? "disabled" : ""}>${why ? esc(why) : "🐟 übergeben"}</button>`; }
    return `<div class="uf-row">${itemIc(specDone(id) ? "sk_" + id : id)}<div><b>${esc(f.sg)}-Köder</b><small>${st}<br>5 Stück ${eur(FSPEC_BAIT[id])} + 2 Tauwürmer${f.cls === "gross" ? " · braucht die " + esc(FRODS[3].n) : ""}</small></div>${right}</div>`;
  }).join("");
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🎯</span>Köder-Entwicklung<small>Berts alter Kombi</small></div>
    <button class="btn tiny ghost" id="bBack">‹ Zurück zur Werkstatt</button>
    <div class="fs-sub">Bring Bert einen Fisch, den du selbst gefangen hast – in ${fdur(FSPEC_DEV)} entwickelt er einen Köder, auf den nur diese Art beißt.</div>
    <div class="uf-list">${spec}</div>`, "bert");
  $("#bBack").onclick = () => { sfx("tap"); openMachine(o); };
  $$("#farmSheetIn [data-give]").forEach(b => b.onclick = () => {
    const id = b.dataset.give;
    if (specGive(id)) { sfx("coin"); toast("🐟 Bert hat den " + FFISH[id].sg + " – in " + fdur(FSPEC_DEV) + " ist der Köder fertig.", "ok"); save(); renderFarmUI(); } else sfx("bad");
    openBertDev();
  });
  /* Restzeiten laufen mit */
  const key = () => Object.values(U.spec || {}).map(s => s.dev ? Math.ceil((s.dev.end - S.time) / 5) : "").join(",");
  const k0 = key();
  FV.sheetTick = () => { if (FV.sheet === "bert" && key() !== k0) openBertDev(); };
}
/* Nach dem Angeln: Bert fragt nach einer neu entdeckten Art */
function bertAskOpen() {
  const U = angelS(), id = U && U.bert.ask;
  if (!id) return;
  U.bert.ask = null;
  save();
  const s = specS(id);
  if (!bertCar() || !s || s.dev || s.done) return;
  const why = specWhy(id);
  FV.sheetFn = null;
  openFarmSheet(`<div class="fvisit">${bertFig()}<div class="fv-tx"><b>Bert Flomann</b><small>am Kombi</small>
      <p>„Guter Fang! Gib mir so einen, dann schau ich, ob ich einen Köder bauen kann, den die besonders mögen.“</p></div></div>
    <div class="fv-msg">${itemIc(id)} ${esc(FFISH[id].sg)} · Entwicklung ${fdur(FSPEC_DEV)}</div>
    <button class="btn fgo" id="baGive" ${why ? "disabled" : ""}>${why ? esc(why) : "🐟 Fisch übergeben"}</button>
    <button class="btn tiny ghost" id="baLater">Später</button>`, "visit");
  $("#baGive").onclick = () => {
    if (specGive(id)) { sfx("coin"); toast("🐟 Bert hat den " + FFISH[id].sg + " – in " + fdur(FSPEC_DEV) + " ist der Köder fertig.", "ok"); save(); renderFarmUI(); closeFarmSheet(); }
    else sfx("bad");
  };
  $("#baLater").onclick = () => { sfx("tap"); closeFarmSheet(); };
}
function stegLogHTML(U) {
  const best = Object.keys(U.best).map(id => { const b = U.best[id];
    return `<div class="uf-row">${itemIc(id)}<div><b>${esc(FITEMS[id].sg || FITEMS[id].n)}</b><small>Rekord: ${fmt(b.cm, 1)} cm · ${fishKgTxt(b.kg)} · ${qStars(b.q)}</small></div></div>`; }).join("");
  const last = U.log.slice(0, 12).map(e => `<div class="uf-row">${itemIc(e.sp)}<div><b>${e.by === "staff" ? "👷 " : ""}${esc(FITEMS[e.sp].sg || FITEMS[e.sp].n)}</b><small>${fmt(e.cm, 1)} cm · ${fishKgTxt(e.kg)} · ${qStars(e.q)} ${esc(fishQName(e.q))}</small></div><small>${eur(specValue(e.sp, e.q, e.kg))}</small></div>`).join("");
  /* v58: abgeschlossenes Turnier steht im Fangbuch */
  const tour = U.tour.done ? `<div class="uf-list"><div class="uf-row"><span class="ic">🏆</span><div><b>Angler-Turnier veranstaltet</b><small>${U.tour.at != null ? esc(stamp(U.tour.at)) + " · " : ""}abgeschlossen</small></div></div></div>` : "";
  return tour + (U.log.length ? `<div class="fs-sub">🏆 Rekorde</div><div class="uf-list">${best}</div><div class="fs-sub">Letzte Fänge</div><div class="uf-list">${last}</div>`
    : `<div class="fs-empty">Noch leer. Jeder Fang beim Angeln und aus den Reusen landet hier – mit Länge, Gewicht und Sternen.</div>`);
}

/* ------------------------------ Angler-Turnier ----------------------------
   Alle fünf Teilnehmer sehen gleich aus und werden gleich behandelt. Der Ticker
   spielt die Fänge in zeitlicher Reihenfolge ab; erst die Siegerehrung zeigt,
   wer gewonnen hat. */
function openTournament() {
  const res = tourResult();
  if (!res) return;
  const T = { min: 0, i: 0, kg: new Map(res.map(p => [p, 0])), log: [], best: 0 };
  const feed = [];
  res.forEach(p => p.catches.forEach(f => feed.push({ p, f })));
  feed.sort((a, b) => a.f.t - b.f.t || a.p.ord - b.p.ord);
  FV.sheetFn = null;
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏆</span>Angler-Turnier<small>Fünf Angler · ${FTOUR.mins} Minuten · das meiste Gewicht gewinnt</small></div>
    <div class="uf-clock" id="trClock"></div><div class="uf-list" id="trTable"></div><div class="uf-feed" id="trFeed"></div>
    <div class="fs-row"><button class="btn tiny ghost" id="trSkip">Überspringen ⏩</button></div>`, "tour");
  const draw = () => {
    const end = T.min >= FTOUR.mins;
    const rows = res.slice().sort((a, b) => T.kg.get(b) - T.kg.get(a) || a.ord - b.ord);
    $("#trClock").textContent = end ? "Abpfiff!" : "⏱ Minute " + Math.floor(T.min) + " von " + FTOUR.mins;
    $("#trTable").innerHTML = rows.map((p, i) => {
      const got = p.catches.filter(f => f.t <= T.min), top = got.length ? Math.max(...got.map(f => f.kg)) : 0;
      return `<div class="uf-row" data-m="${p.ord}"><span class="ic"><span class="uf-ini">${esc(p.ini)}</span></span>
        <div><b>${i + 1}. ${esc(p.n)}</b><small>${got.length} ${got.length === 1 ? "Fang" : "Fänge"}${top ? " · größter " + fishKgTxt(top) : ""}</small></div><b>${fishKgTxt(T.kg.get(p))}</b></div>`;
    }).join("");
    $("#trFeed").innerHTML = T.log.slice(-3).reverse().map(x => `<div>${x}</div>`).join("");
    $$("#trTable [data-m]").forEach(r => r.onclick = () => { const p = res.find(x => x.ord === +r.dataset.m); if (p) toast(p.ini + " · " + p.n + " aus " + p.from + ": " + p.about, ""); });
  };
  const step = () => {
    while (T.i < feed.length && feed[T.i].f.t <= T.min) {
      const { p, f } = feed[T.i++];
      T.kg.set(p, T.kg.get(p) + f.kg);
      const big = f.kg > T.best;
      if (big) T.best = f.kg;
      T.log.push(`${icHTML(f.sp)} <b>${esc(p.n)}</b>: ${esc(FITEMS[f.sp].sg)} ${fmt(f.cm, 1)} cm${big && T.i > 1 ? " · 🏅 größter Fisch bisher" : ""}`);
    }
    draw();
  };
  const finish = () => {
    clearInterval(T.iv);
    T.min = FTOUR.mins + 0.5; step();
    const b = $("#trSkip"); if (b) b.outerHTML = `<button class="btn fgo" id="trCer">🏆 Zur Siegerehrung</button>`;
    $("#trCer").onclick = () => tourCeremony(res);
  };
  /* eine Turnierminute ≈ 0,7 s; Fenster zu = Ticker stoppt (Ergebnis kommt aus dem Seed) */
  T.iv = setInterval(() => {
    if (FV.sheet !== "tour") return clearInterval(T.iv);
    T.min += 0.25; step();
    if (T.min >= FTOUR.mins + 0.5) finish();
  }, 175);
  $("#trSkip").onclick = finish;
  step();
}
/* Siegerehrung: erst hier zeigt sich der Sieger mit Bild */
function tourCeremony(res) {
  const w = res.slice().sort(tourRank)[0];
  if (!tourFinish()) return openSteg("fish");
  save();
  sfx("level");
  FV.stegTab = "fish";
  bertCarPlace();   /* v59: Bert parkt seinen Kombi am Ufer */
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏆</span>Siegerehrung<small>${esc(w.n)} gewinnt mit ${fishKgTxt(w.total)}</small></div>
    <div class="fvisit">${bertFig()}<div class="fv-tx"><b>Bert Flomann</b><small>Sieger des Angler-Turniers</small>
      <p>„Moin! Bert Flomann. Schönes Turnier – hat Spaß gemacht. Pass auf: Ich hab einen Wurmkasten im Garten. Für ein kleines Entgelt sammel ich dir Tauwürmer – damit beißen Barsche, Forellen und Karpfen. Und wenn du ordentlich was rausholst, bau ich dir später richtige Köder für die Großen. Du findest mich mit meinem alten Kombi am Ufer.“</p></div></div>
    <div class="fv-msg">🏆 ${eur(FTOUR.prize)} Preisgeld an ${esc(w.n)} · ${eur(FTOUR.cost)} Veranstaltungskosten · +${FTOUR.xp} EP</div>
    <button class="btn fgo" id="bertOk">🤝 Abgemacht!</button>`, "visit");
  $("#bertOk").onclick = () => { closeFarmSheet(); const c = bertCar(); if (c) { const [x, z] = farmCenter(c); farmFocusXZ(x, z, 18, 700); } toast("🚙 Bert parkt seinen Kombi am Ufer – tipp ihn an.", "ok"); };
  renderFarmUI();
}
