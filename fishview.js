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
  const st = farmObj1("f_steg"), e = st && FV.nodes.get(st.id);
  const rx = ROD_REST + (FISH.bite ? 0.32 + Math.sin(time * 18) * 0.12 : FISH.rod ? -0.1 : 0);
  if (e && e.parts.rod) e.parts.rod.rx = rx;
  if (B) B.rod.rx = rx;
}
