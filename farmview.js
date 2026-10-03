/* =========================================================================
   LOGISTIKA – farmview.js
   Die 3D-Hofansicht: Szene aufbauen und mit dem Spielstand abgleichen,
   Kamera (wischen, zoomen), Antippen, Werkzeuge zum Drüberziehen (Saat,
   Sichel, Gießkanne, Futter), Bauen und Verschieben, Fenster für Lager,
   Mühle/Ofen/Molkerei, Ställe, Bestellungen und Laden – dazu Effekte,
   Töne, Level-Feier und Linas Rundgang über den Hof.
   ========================================================================= */
const FV = {
  R: null, on: false, built: false, meshes: {}, nodes: new Map(), ani: new Map(), prod: new Map(),
  veh: new Map(), sel: null, pop: null, tool: null, place: null, ptr: new Map(), gesture: null,
  t0: performance.now(), last: 0, syncAt: 0, smokeAt: 0, sparkAt: 0, clouds: [], sig: "", failed: false,
  vel: [0, 0], shake: new Map(), bounce: new Map(), parked: null, drives: []
};
const FV_BOUNDS = 14.5;
/* Hof-Beträge ohne Cent, Zeiten knapp („2 h“, „1 h 15 min“) */
const eur = n => fmt(Math.round(n), 0) + " €";
function fdur(min) {
  min = Math.max(1, Math.round(min));
  if (min < 60) return min + " min";
  const h = Math.floor(min / 60), m = min % 60;
  return h + " h" + (m ? " " + m + " min" : "");
}

/* --------------------------- Aufbau & DOM ------------------------------ */
function farmDOM() {
  if ($("#farm")) return;
  const s = document.createElement("section");
  s.id = "farm";
  s.innerHTML = `
    <canvas id="farmCv" aria-label="Dein Hof in 3D"></canvas>
    <div id="farmTags"></div>
    <div id="farmFx"></div>
    <div id="farmQuest"></div>
    <div id="farmSide">
      <button class="fbtn" id="fbShop" title="Laden: Felder, Tiere, Gebäude, Deko"><i>🛒</i><span>Laden</span></button>
      <button class="fbtn" id="fbStore" title="Silo und Scheune"><i>🌾</i><span>Lager</span></button>
      <button class="fbtn" id="fbOrders" title="Bestellungen"><i>📋</i><span>Kunden</span><em id="fbOrdN"></em></button>
      <button class="fbtn small" id="fbSnd" title="Ton an/aus"><i>🔊</i></button>
    </div>
    <div id="farmSpeed">
      <button data-speed="0" title="Pause">⏸</button><button data-speed="1">1×</button><button data-speed="3">3×</button><button data-speed="10">10×</button><button data-speed="30">30×</button>
    </div>
    <div id="farmFound"></div>
    <div id="farmPop"></div>
    <div id="farmPlace"></div>
    <div id="farmSheet"><div class="fs-in" id="farmSheetIn"></div></div>
    <div id="farmTut"></div>
    <div id="farmLvl"></div>
    <div id="farmMsg"></div>`;
  document.body.insertBefore(s, $("#mapUI"));
  $("#fbShop").onclick = () => openFarmShop();
  $("#fbStore").onclick = () => openFarmStore("silo");
  $("#fbOrders").onclick = () => openFarmOrders();
  $("#fbSnd").onclick = () => { S.farm.snd = !S.farm.snd; renderFarmUI(); if (S.farm.snd) sfx("pop"); };
  $$("#farmSpeed [data-speed]").forEach(b => {
    b.onclick = () => (+b.dataset.speed === 0 ? togglePause() : setSpeed(+b.dataset.speed));
    b.classList.toggle("on", +b.dataset.speed === S.speed);
  });
  $("#farmSheet").addEventListener("click", e => { if (e.target.id === "farmSheet") closeFarmSheet(); });
  bindFarmInput($("#farmCv"));
}

function farmInit3D() {
  if (FV.R || FV.failed) return !!FV.R;
  const cv = $("#farmCv");
  try {
    FV.R = G3.create(cv, { shadowSize: 2048, shadowBox: 22, maxDpr: 2 });
  } catch (e) { FV.R = null; }
  if (!FV.R) {
    FV.failed = true;
    $("#farm").classList.add("nogl");
    $("#farmMsg").innerHTML = `<div class="fmsg">Dein Gerät kann die 3D-Ansicht nicht anzeigen (WebGL 2 fehlt). Lager, Bestellungen und Laden funktionieren trotzdem über die Knöpfe rechts.</div>`;
    return false;
  }
  FV.R.onRestore = () => { FV.built = false; FV.nodes.clear(); FV.R.nodes.length = 0; farmBuildScene(); };
  const c = FV.R.cam;
  c.tx = -1; c.tz = 0; c.dist = innerHeight > innerWidth ? 40 : 32; c.yaw = Math.PI / 4;
  return true;
}

/* ------------------------------ Meshes -------------------------------- */
function fmesh(key, fn) { return FV.meshes[key] || (FV.meshes[key] = FV.R.mesh(fn())); }
function fnode(mesh, o) { return FV.R.node(mesh, o); }

/* Kulisse: Wiese, Zaun, Wege, Teich, Straße, Wald ringsum, Nachbarfelder */
function farmStatic() {
  const R = FV.R, b = new FM.MB();
  G3.seed(4242);
  b.merge(FM.ground(60, 13), {});
  /* Wege: vom Tor hoch zum Haus, quer vor Haus und Scheune */
  b.merge(FM.path(2, 21), { x: 5, z: 2.5 });
  b.merge(FM.path(16, 1), { x: -3, z: -7.5 });
  b.merge(FM.path(2, 4), { x: 5, z: 15 });
  /* Zaun ringsum mit Lücke fürs Tor */
  const fo = { step: 1.0, h: 0.62, post: 0x8a5a34, rail: 0xcf9a62 };
  const F = new FM.MB();
  FM.fenceLine(F, -13, -13, 13, -13, fo);
  FM.fenceLine(F, -13, -13, -13, 13, fo);
  FM.fenceLine(F, 13, -13, 13, 13, fo);
  FM.fenceLine(F, -13, 13, 3, 13, fo);
  FM.fenceLine(F, 7, 13, 13, 13, fo);
  b.add(F);
  /* Landstraße und Zufahrt */
  b.merge(FM.road(60), { x: 0, z: 18.5, ry: Math.PI / 2 });
  b.merge(FM.road(5), { x: 5, z: 15.6 });
  /* Havel-Bucht im Osten */
  b.merge(FM.lakeShore(6), { x: 21, z: -3 });
  /* Nachbarfelder */
  const nf = (x, z, w, d, c1, c2, ry) => {
    const m = new FM.MB();
    m.plate(w, d, c1, { y0: 0.015 });
    for (let i = 0; i < Math.floor(d / 0.6); i++) m.plate(w - 0.2, 0.22, c2, { z: -d / 2 + 0.4 + i * 0.6, y0: 0.03 });
    b.merge(m, { x, z, ry: ry || 0 });
  };
  nf(-21, -19, 12, 9, 0xe3c35a, 0xd0ac43);
  nf(-21, 24, 10, 7, 0x93c255, 0x7fae46);
  nf(14, 25, 9, 6, 0xd7b46a, 0xc29a52);
  nf(-24, 3, 7, 12, 0xb9d466, 0x9fc055);
  /* Wald und Büsche ringsum */
  const pine = FM.pine(1.0), pine2 = FM.pine(1.3), lt = FM.leafTree(1.0), lt2 = FM.leafTree(1.35), bu = FM.bushes(), rk = FM.rock(1.0);
  const busy = (x, z) => Math.hypot(x - 21, z + 3) < 8 || (Math.abs(x - 5) < 2.4 && z > 12) || Math.abs(z - 18.5) < 1.6
    || (x < -14.5 && x > -27.5 && z < -14 && z > -24) || (x < -15.5 && z > 20 && z < 28) || (x > 9 && x < 19 && z > 21.5) || (x < -20 && z > -4 && z < 10);
  for (let i = 0; i < 520; i++) {
    const x = (G3.srand() - 0.5) * 58, z = (G3.srand() - 0.5) * 58;
    const m = Math.max(Math.abs(x), Math.abs(z));
    if (m < 14.6 || busy(x, z)) continue;
    const k = G3.srand();
    const pick = k < 0.34 ? pine : k < 0.5 ? pine2 : k < 0.7 ? lt : k < 0.8 ? lt2 : k < 0.94 ? bu : rk;
    b.merge(pick, { x, z, ry: G3.srand() * 6.28, s: 0.85 + G3.srand() * 0.4 });
  }
  /* ein paar Bäume an der Straße */
  for (let x = -26; x < 27; x += 4.5) if (Math.abs(x - 5) > 3) b.merge(lt, { x, z: 20.6, s: 0.9 });
  R.nodes.push(fnode(R.mesh(b)));
  /* Wasser */
  R.nodes.push(fnode(R.mesh(FM.lakeWater(6)), { x: 21, y: 0.04, z: -3, water: 1, shadow: false }));
  /* Hoftor */
  R.nodes.push(fnode(fmesh("gate", FM.gate), { x: 5, z: 13 }));
  /* Wolkenschatten: weiche, dunkle Flecken, die langsam über den Hof ziehen */
  for (let i = 0; i < 4; i++) {
    const m = new FM.MB();
    G3.seed(77 + i);
    [[1, 0, 0], [0.8, 1.6, 0.4], [0.7, -1.5, -0.3]].forEach(([r, x, z]) => {
      for (let k = 0; k < 3; k++) m.disc((1 - k * 0.22) * r * 2.4, 22, 0x1d2c3a, { x, z, y: 0.06 + k * 0.004, wob: 0.12 });
    });
    const n = fnode(R.mesh(m), { x: -30 + i * 17, y: 0, z: -10 + (i * 9) % 22, alpha: 0.075, shadow: false });
    FV.clouds.push(n); R.nodes.push(n);
  }
}

/* Modell eines Hofobjekts */
function objMesh(o) {
  switch (o.t) {
    case "house": return fmesh("house", FM.house);
    case "barn": return fmesh("barn", FM.barn);
    case "silo": return fmesh("silo", FM.silo);
    case "bakery": return fmesh("bakery", FM.bakery);
    case "mill": return fmesh("mill", FM.mill);
    case "dairy": return fmesh("dairy", FM.dairy);
    case "board": return fmesh("board", FM.board);
    case "shed": return fmesh("shed", FM.shed);
    case "field": return fmesh("soil", () => FM.fieldSoil(false));
    case "tree": return fmesh("tree:" + o.kind, () => FM.treeMesh(o.kind));
    case "coop": { const [w, d] = farmSize(o); return fmesh("run:" + w + "x" + d, () => FM.coopRun(w, d)); }
    case "cows": { const [w, d] = farmSize(o); return fmesh("pasture:" + w + "x" + d, () => FM.pasture(w, d)); }
    case "deco": return fmesh("deco:" + o.k + ":" + (o.arg || 0), () => FM[o.k](o.arg || 1));
  }
  return null;
}
function objH(o) {
  return { house: 4.7, barn: 4.5, silo: 4.3, mill: 4.4, bakery: 2.9, dairy: 2.9, coop: 0.7, cows: 0.9, field: 0.35, tree: 2.3, board: 1.6, shed: 1.8, deco: 1.0 }[o.t] || 1;
}
/* Knoten für ein Objekt (samt Kindern) */
function buildObjNode(o) {
  const R = FV.R;
  const [cx, cz] = farmCenter(o);
  const root = fnode(objMesh(o), { x: cx, z: cz, ry: o.r ? -Math.PI / 2 : 0 });
  const parts = {};
  if (o.t === "mill") {
    const h = FM.MILL_HUB;
    parts.sails = R.addChild(root, fnode(fmesh("sails", FM.millSails), { x: h[0], y: h[1], z: h[2] }));
  }
  if (o.t === "field") parts.crop = R.addChild(root, fnode(null, { sway: 0.6 }));
  if (o.t === "tree") {
    parts.fruit = R.addChild(root, fnode(fmesh("fruit:" + o.kind, () => FM.treeFruit(o.kind)), { visible: false }));
    root.sway = 0.25;
  }
  if (o.t === "coop") {
    const [w, d] = farmSize(o);
    parts.hut = R.addChild(root, fnode(fmesh("coopHut", FM.coopHut), { x: -w / 2 + 1.05, z: -d / 2 + 0.85 }));
  }
  if (o.t === "cows") {
    const [w, d] = farmSize(o);
    parts.shed = R.addChild(root, fnode(fmesh("cowShed", FM.cowShed), { x: -w / 2 + 1.55, z: -d / 2 + 1.1 }));
  }
  return { node: root, parts, sig: objSig(o) };
}
function objSig(o) { return [o.t, o.x, o.z, o.r, o.lvl || 0, o.kind || "", o.k || ""].join(","); }

function farmBuildScene() {
  const R = FV.R;
  if (!R) return;
  R.nodes.length = 0;
  FV.nodes.clear(); FV.ani.clear(); FV.prod.clear(); FV.clouds = [];
  farmStatic();
  FV.built = true;
  FV.parked = null;
  farmSyncScene(true);
}

/* Szene an den Spielstand angleichen (neue, verschobene, entfernte Objekte) */
function farmSyncScene(force) {
  const R = FV.R;
  if (!R || !FV.built || !farmOn()) return;
  const seen = new Set();
  for (const o of S.farm.objs) {
    seen.add(o.id);
    let e = FV.nodes.get(o.id);
    const sig = objSig(o);
    if (e && e.sig !== sig) {
      R.nodes.splice(R.nodes.indexOf(e.node), 1);
      FV.nodes.delete(o.id); e = null;
      if (o.animals) o.animals.forEach(a => dropAnimal(a.id));
    }
    if (!e) {
      e = buildObjNode(o);
      FV.nodes.set(o.id, e);
      R.nodes.push(e.node);
    }
  }
  for (const [id, e] of FV.nodes) if (!seen.has(id)) {
    R.nodes.splice(R.nodes.indexOf(e.node), 1);
    FV.nodes.delete(id);
  }
  /* Tiere */
  const alive = new Set();
  S.farm.objs.forEach(o => { if (o.animals) o.animals.forEach(a => { alive.add(a.id); ensureAnimal(o, a); }); });
  for (const id of [...FV.ani.keys()]) if (!alive.has(id)) dropAnimal(id);
  farmSyncState();
  farmSyncVehicles(force);
}
/* Zustände ohne Umbau: Saat-Stufen, Früchte, Produkte neben den Tieren */
function farmSyncState() {
  for (const o of S.farm.objs) {
    const e = FV.nodes.get(o.id);
    if (!e) continue;
    if (o.t === "field") {
      const st = fieldStage(o);
      const key = st < 0 ? "" : "crop:" + o.crop + ":" + st;
      if (e.cropKey !== key) {
        e.cropKey = key;
        e.parts.crop.mesh = key ? fmesh(key, () => FM.cropMesh(o.crop, st)) : null;
        e.parts.crop.visible = !!key;
      }
      e.node.glow = 0;
    }
    if (o.t === "tree") {
      const ripe = treeRipe(o);
      e.parts.fruit.visible = ripe;
      const f = Math.min(1, 1 - (o.end - S.time) / FTREES[o.kind].t);
      e.parts.fruit.sx = e.parts.fruit.sy = e.parts.fruit.sz = ripe ? 1 : 0.4 + 0.6 * f;
    }
    if (o.q) machUpdate(o);
  }
}

/* ------------------------------- Tiere -------------------------------- */
function penArea(o) {
  const [w, d] = farmSize(o), [cx, cz] = farmCenter(o);
  const cow = o.t === "cows";
  return {
    x0: cx - w / 2 + 0.45, x1: cx + w / 2 - 0.45, z0: cz - d / 2 + 0.45, z1: cz + d / 2 - 0.45,
    hx: cx - w / 2 + (cow ? 3.0 : 2.15), hz: cz - d / 2 + (cow ? 2.15 : 1.75), cow
  };
}
function penSpot(o) {
  const a = penArea(o);
  for (let i = 0; i < 20; i++) {
    const x = a.x0 + Math.random() * (a.x1 - a.x0), z = a.z0 + Math.random() * (a.z1 - a.z0);
    if (x < a.hx && z < a.hz) continue;
    return [x, z];
  }
  return [(a.x0 + a.x1) / 2 + 0.5, (a.z0 + a.z1) / 2 + 0.5];
}
function ensureAnimal(o, a) {
  let s = FV.ani.get(a.id);
  if (s && s.pen === o.id) return s;
  if (s) dropAnimal(a.id);
  const cow = o.t === "cows";
  const [x, z] = penSpot(o);
  const node = fnode(fmesh((cow ? "cow:" : "chicken:") + (a.v || 0), () => cow ? FM.cow(a.v || 0) : FM.chicken(a.v || 0)), { x, z, ry: Math.random() * 6.28, s: cow ? 1.3 : 1.35 });
  const pn = fnode(fmesh(cow ? "milk" : "egg", cow ? FM.milkBottle : FM.egg), { visible: false });
  FV.R.nodes.push(node, pn);
  s = { id: a.id, pen: o.id, cow, node, pn, x, z, tx: x, tz: z, h: node.ry, mode: "idle", t: Math.random() * 2, ph: Math.random() * 6 };
  if (FV.drop && FV.drop === a.id) { s.y = 3; s.vy = 0; FV.drop = null; }
  FV.ani.set(a.id, s);
  return s;
}
function dropAnimal(id) {
  const s = FV.ani.get(id);
  if (!s) return;
  const R = FV.R;
  [s.node, s.pn].forEach(n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
  FV.ani.delete(id);
}
function animalById(id) {
  for (const o of S.farm.objs) if (o.animals) { const a = o.animals.find(x => x.id === id); if (a) return [o, a]; }
  return [null, null];
}
function stepAnimals(dt, time) {
  for (const s of FV.ani.values()) {
    const [o, a] = animalById(s.id);
    if (!o) continue;
    const st = aniState(a);
    const ar = penArea(o);
    s.t -= dt;
    if (s.y != null) {                                /* frisch gekauft: plumpst rein */
      s.vy -= 18 * dt; s.y += s.vy * dt;
      if (s.y <= 0) { s.y = null; FV.R.burst({ x: s.x, y: 0.05, z: s.z, n: 10, col: [0.86, 0.78, 0.6, 0.9], speed: 1.6, up: 1.2, size: 0.12, flat: true }); }
    }
    if (st === "ready") s.mode = "sit";
    else if (s.mode === "sit") s.mode = "idle";
    if (s.mode === "walk") {
      const dx = s.tx - s.x, dz = s.tz - s.z, d = Math.hypot(dx, dz);
      const sp = (s.cow ? 0.45 : 0.9) * dt;
      if (d < sp || s.t < 0) { s.mode = "idle"; s.t = 1 + Math.random() * 3; }
      else {
        s.x += dx / d * sp; s.z += dz / d * sp;
        const want = Math.atan2(dx, dz);
        let dh = want - s.h; while (dh > Math.PI) dh -= 6.283; while (dh < -Math.PI) dh += 6.283;
        s.h += dh * Math.min(1, dt * 6);
      }
    } else if (s.mode !== "sit" && s.t < 0) {
      const r = Math.random();
      if (r < 0.55) {
        const [x, z] = penSpot(o);
        s.tx = s.x + (x - s.x) * (s.cow ? 0.6 : 0.5); s.tz = s.z + (z - s.z) * (s.cow ? 0.6 : 0.5);
        s.mode = "walk"; s.t = 6;
      } else { s.mode = s.cow || r < 0.8 ? "peck" : "idle"; s.t = 1.2 + Math.random() * 2.5; }
    }
    s.x = clamp(s.x, ar.x0, ar.x1); s.z = clamp(s.z, ar.z0, ar.z1);
    if (s.x < ar.hx && s.z < ar.hz) { if (ar.hx - s.x < ar.hz - s.z) s.x = ar.hx; else s.z = ar.hz; }
    const n = s.node;
    n.x = s.x; n.z = s.z; n.ry = s.h;
    s.ph += dt * (s.mode === "walk" ? (s.cow ? 5 : 14) : 2);
    n.y = s.y != null ? s.y : s.mode === "walk" ? Math.abs(Math.sin(s.ph)) * (s.cow ? 0.025 : 0.05) : s.mode === "sit" ? (s.cow ? -0.02 : -0.04) : 0;
    n.rx = s.mode === "peck" ? (s.cow ? 0.08 + Math.sin(s.ph) * 0.03 : Math.max(0, Math.sin(s.ph * 3.2)) * 0.55) : 0;
    n.rz = s.mode === "walk" && s.cow ? Math.sin(s.ph) * 0.03 : 0;
    const sq = FV.bounce.get("a" + s.id);
    const base = s.cow ? 1.3 : 1.35;
    if (sq) { const k = Math.max(0, 1 - (time - sq) * 3); n.sy = base * (1 + Math.sin((time - sq) * 25) * 0.25 * k); n.sx = n.sz = base * (1 - Math.sin((time - sq) * 25) * 0.1 * k); if (!k) { FV.bounce.delete("a" + s.id); n.sx = n.sy = n.sz = base; } }
    /* Produkt neben dem sitzenden Tier */
    s.pn.visible = st === "ready";
    if (st === "ready") {
      s.pn.x = s.x + Math.sin(s.h + 2.2) * (s.cow ? 0.45 : 0.2);
      s.pn.z = s.z + Math.cos(s.h + 2.2) * (s.cow ? 0.45 : 0.2);
      s.pn.y = Math.abs(Math.sin(time * 3 + s.id)) * 0.04;
      s.pn.ry = time;
    }
  }
}

/* -------------------------- Fahrzeuge am Hof --------------------------- */
const SHED_SLOTS = [[-0.85, 0.05], [0.0, 0.05], [0.85, 0.05]];
function vehModelKey(t) { return t.mode === "b" ? "bike" : t.cap <= 80 ? "moped" : "van"; }
function vehMesh(t) {
  const k = vehModelKey(t);
  return fmesh("veh:" + k, () => k === "bike" ? FM.cargoBike() : k === "moped" ? FM.moped() : FM.van());
}
function shedObj() { return S.farm.objs.find(o => o.t === "shed"); }
function farmSyncVehicles(force) {
  const shed = shedObj();
  if (!shed) return;
  const here = S.fleet.filter(f => f.at === FARM_NODE && f.phase === "idle").slice(0, 3);
  const ids = new Set(here.map(f => f.uid));
  const [sx, sz] = farmCenter(shed);
  const R = FV.R;
  /* weggefahren: aus der Scheune zum Tor und auf die Straße */
  for (const [uid, v] of FV.veh) {
    if (ids.has(uid)) continue;
    const f = S.fleet.find(x => x.uid === uid);
    FV.veh.delete(uid);
    if (!force && f && f.phase !== "idle" && FV.parked) startDrive(v.node, [[v.node.x, v.node.z], [v.node.x, sz + 1.6], [5, sz + 1.6], [5, 13.5], [5, 18.5], [-30, 18.5]], () => {});
    else { const i = R.nodes.indexOf(v.node); if (i >= 0) R.nodes.splice(i, 1); }
  }
  here.forEach((f, i) => {
    let v = FV.veh.get(f.uid);
    const t = vType(f.type);
    const p = SHED_SLOTS[i];
    const x = sx + p[0], z = sz + p[1];
    if (!v) {
      const node = fnode(vehMesh(t), { x, z, ry: 0 });
      R.nodes.push(node);
      v = { node };
      FV.veh.set(f.uid, v);
      /* angekommen: von der Straße durchs Tor in die Scheune */
      if (!force && FV.parked && !FV.parked.has(f.uid)) {
        node.x = 30; node.z = 18.5;
        startDrive(node, [[30, 18.5], [5, 18.5], [5, 13.5], [5, sz + 1.6], [x, sz + 1.6], [x, z]], () => { node.ry = 0; });
      }
    } else if (!v.node.driving) { v.node.x = x; v.node.z = z; v.node.ry = 0; }
  });
  FV.parked = ids;
}
function startDrive(node, pts, done) {
  node.driving = true;
  FV.drives.push({ node, pts, i: 0, done, sp: 4.2 });
}
function stepDrives(dt) {
  const R = FV.R;
  for (let k = FV.drives.length - 1; k >= 0; k--) {
    const d = FV.drives[k], n = d.node;
    const tgt = d.pts[Math.min(d.i + 1, d.pts.length - 1)];
    const dx = tgt[0] - n.x, dz = tgt[1] - n.z, dist = Math.hypot(dx, dz);
    const sp = d.sp * dt;
    if (dist <= sp) {
      n.x = tgt[0]; n.z = tgt[1]; d.i++;
      if (d.i >= d.pts.length - 1) {
        n.driving = false; FV.drives.splice(k, 1);
        if (Math.abs(n.x) > 25) { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); }
        if (d.done) d.done();
      }
      continue;
    }
    n.x += dx / dist * sp; n.z += dz / dist * sp;
    n.ry = Math.atan2(dx, dz);
    n.y = Math.abs(Math.sin(performance.now() / 70)) * 0.015;
  }
}

/* ------------------------------ Licht --------------------------------- */
function farmEnv() {
  const R = FV.R, E = R.env;
  const h = (S.time % 1440) / 60;
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const day = ss(4.3, 6.6, h) * (1 - ss(19.6, 21.8, h));
  const az = ((h - 6) / 14) * Math.PI;                  /* Osten → Westen */
  const el = 0.45 + Math.max(0, Math.sin(((h - 5) / 16) * Math.PI)) * 0.7;
  E.sun = G3.norm([Math.cos(az) * 0.9 + 0.3, Math.sin(el) * 1.4, -Math.sin(az) * 0.5 + 0.45]);
  const g = (c, w) => Math.exp(-((h - c) * (h - c)) / (2 * w * w));
  const warm = Math.max(g(6.2, 1.0), g(20.2, 1.0)) * 0.75 * (day > 0.05 ? 1 : 0);   /* Morgen- und Abendrot */
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const nightLift = 0.32;
  const sunC = mix([0.92, 0.6, 0.4], [0.72, 0.68, 0.58], 1 - warm);
  const k = 0.1 + 0.9 * day;
  E.sunCol = [sunC[0] * k, sunC[1] * k, sunC[2] * k];
  E.sky = mix([0.24, 0.3, 0.48], [0.37, 0.42, 0.5], Math.max(day, 0));
  E.ground = mix([0.13, 0.14, 0.22], [0.25, 0.24, 0.21], day);
  if (day < 0.05) { E.sky = E.sky.map(v => Math.max(v, nightLift * 0.75)); }
  E.night = clamp(1 - day * 3.2, 0, 1);
  E.fog = mix([0.16, 0.2, 0.33], [0.74, 0.85, 0.95], day);
  if (warm > 0.3 && day > 0.05) E.fog = mix(E.fog, [0.98, 0.78, 0.6], (warm - 0.3) * 0.6);
  E.fogR = [R.cam.dist * 1.25 + 14, R.cam.dist * 2.4 + 34];
  const top = mix([0.06, 0.09, 0.2], [0.42, 0.68, 0.94], day), bot = E.fog;
  const css = c => "rgb(" + c.map(v => Math.round(Math.min(1, v) * 255)).join(",") + ")";
  const key = css(top) + css(bot);
  if (key !== FV.skyKey) { FV.skyKey = key; $("#farm").style.background = "linear-gradient(180deg," + css(top) + "," + css(bot) + ")"; }
}

/* ------------------------------ Schleife ------------------------------ */
function farmLoop(now) {
  if (!FV.on) return;
  requestAnimationFrame(farmLoop);
  const R = FV.R;
  if (!R || R.lost()) return;
  /* Akku schonen: ohne Berührung reichen ~30 Bilder pro Sekunde */
  const busy = FV.ptr.size || FV.focusing || FV.tool || FV.place || FV.drives.length || now - (FV.touchAt || 0) < 1500
    || Math.abs(FV.vel[0]) > 0.01 || Math.abs(FV.vel[1]) > 0.01;
  if (!busy && now - (FV.last || 0) < 30) return;
  const dt = Math.min(0.05, (now - (FV.last || now)) / 1000);
  FV.last = now;
  const time = (now - FV.t0) / 1000;
  /* Schwung nach dem Wischen */
  if (!FV.ptr.size && (Math.abs(FV.vel[0]) > 0.01 || Math.abs(FV.vel[1]) > 0.01)) {
    R.cam.tx += FV.vel[0] * dt; R.cam.tz += FV.vel[1] * dt;
    FV.vel[0] *= Math.pow(0.04, dt); FV.vel[1] *= Math.pow(0.04, dt);
    clampCam();
  }
  if (now - FV.syncAt > 400) { FV.syncAt = now; farmSyncScene(false); renderFarmUI(); }
  stepAnimals(dt, time);
  stepDrives(dt);
  /* Mühlenflügel, Wolken, wackelnde Objekte */
  for (const o of S.farm.objs) {
    const e = FV.nodes.get(o.id);
    if (!e) continue;
    if (o.t === "mill") e.parts.sails.rz -= dt * (o.q && o.q.length ? 2.6 : 0.35);
    const b = FV.bounce.get(o.id);
    if (b != null) {
      const k = Math.max(0, 1 - (time - b) * 2.6);
      const s = Math.sin((time - b) * 22) * 0.07 * k;
      e.node.sy = 1 + s; e.node.sx = e.node.sz = 1 - s * 0.5;
      e.node.glow = 0.6 * k;
      if (!k) { FV.bounce.delete(o.id); e.node.sx = e.node.sy = e.node.sz = 1; e.node.glow = 0; }
    } else e.node.glow = FV.sel === o.id ? 0.25 + Math.sin(time * 5) * 0.12 : 0;
    const sh = FV.shake.get(o.id);
    if (sh != null) {
      const k = Math.max(0, 1 - (time - sh) * 2);
      e.node.rz = Math.sin((time - sh) * 30) * 0.06 * k;
      if (!k) { FV.shake.delete(o.id); e.node.rz = 0; }
    }
  }
  FV.clouds.forEach((c, i) => { c.x += dt * (0.35 + i * 0.08); if (c.x > 34) c.x = -34; });
  /* Rauch aus dem Ofen, Funkeln über reifen Feldern */
  if (time - FV.smokeAt > 0.22) {
    FV.smokeAt = time;
    S.farm.objs.forEach(o => {
      if (o.t !== "bakery" || !o.q || !o.q.length) return;
      const [cx, cz] = farmCenter(o), c = FM.BAKERY_CHIMNEY;
      R.emit({ x: cx + c[0] + (Math.random() - 0.5) * 0.1, y: c[1] + 0.1, z: cz + c[2], vx: 0.15, vy: 0.7, vz: -0.05, life: 2.4, size: 0.16, size2: 0.55, col: [0.92, 0.92, 0.95, 0.55], drag: 0.3 });
    });
  }
  if (time - FV.sparkAt > 0.5) {
    FV.sparkAt = time;
    const ripe = S.farm.objs.filter(o => (o.t === "field" && fieldState(o) === "ripe") || (o.t === "tree" && treeRipe(o)));
    if (ripe.length) {
      const o = pick(ripe), [cx, cz] = farmCenter(o);
      R.emit({ x: cx + (Math.random() - 0.5) * 1.4, y: o.t === "tree" ? 1.4 + Math.random() * 0.6 : 0.5, z: cz + (Math.random() - 0.5) * 1.4, vy: 0.3, life: 0.9, size: 0.09, size2: 0.02, col: [1, 0.95, 0.55, 1], shape: 1 });
    }
  }
  farmEnv();
  R.stepParticles(dt);
  R.render(time);
  updateFarmTags();
  positionFarmPop();
  farmTutPoint();
}

/* ------------------------------ Kamera -------------------------------- */
function clampCam() {
  const c = FV.R.cam;
  c.tx = clamp(c.tx, -FV_BOUNDS, FV_BOUNDS);
  c.tz = clamp(c.tz, -FV_BOUNDS, FV_BOUNDS + 3);
  c.dist = clamp(c.dist, 11, 52);
  c.pitch = 0.8 + (c.dist - 11) / 41 * 0.2;
}
function farmFocus(o, dist) {
  if (!FV.R || !o) return;
  const [cx, cz] = farmCenter(o);
  const c = FV.R.cam;
  const s = { tx: c.tx, tz: c.tz, d: c.dist }, e = { tx: cx, tz: cz + 1, d: dist || c.dist };
  const t0 = performance.now(), id = (FV.focusId || 0) + 1;
  FV.focusId = id; FV.focusing = true;
  const step = () => {
    if (FV.focusId !== id) return;
    const k = Math.min(1, (performance.now() - t0) / 600), f = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    c.tx = s.tx + (e.tx - s.tx) * f; c.tz = s.tz + (e.tz - s.tz) * f; c.dist = s.d + (e.d - s.d) * f;
    clampCam();
    if (k < 1) requestAnimationFrame(step); else FV.focusing = false;
  };
  step();
}

/* ------------------------------ Eingabe ------------------------------- */
function canvasXY(e) {
  const r = $("#farmCv").getBoundingClientRect();
  /* Kamera seit dem letzten Bild bewegt? Strahl mit dem aktuellen Stand rechnen */
  if (FV.R) FV.R.updateCamera();
  return [e.clientX - r.left, e.clientY - r.top];
}
function groundAt(x, y) { return FV.R && FV.R.ground(x, y, 0); }
function tileAt(x, y) {
  const g = groundAt(x, y);
  if (!g) return null;
  return [Math.floor(g[0] + FG / 2), Math.floor(g[2] + FG / 2), g];
}
function objAtTile(tx, tz) {
  if (tx < 0 || tz < 0 || tx >= FG || tz >= FG) return null;
  for (const o of S.farm.objs) {
    const [w, d] = farmSize(o);
    if (tx >= o.x && tx < o.x + w && tz >= o.z && tz < o.z + d) return o;
  }
  return null;
}
function pickObj(x, y) {
  const R = FV.R, r = R.ray(x, y);
  let best = null, bt = 1e9;
  for (const o of S.farm.objs) {
    const [w, d] = farmSize(o), [cx, cz] = farmCenter(o), h = objH(o);
    const pad = o.t === "tree" ? 0.2 : 0;
    const t = R.hitBox(r, [cx - w / 2 - pad, 0, cz - d / 2 - pad], [cx + w / 2 + pad, h, cz + d / 2 + pad]);
    if (t != null && t < bt - (o.t === "field" || o.t === "deco" ? 0.4 : 0)) { bt = t; best = o; }
  }
  return best;
}
function pickAnimal(x, y, pen) {
  const g = FV.R.ground(x, y, 0.25);
  if (!g) return null;
  let best = null, bd = 1e9;
  for (const s of FV.ani.values()) {
    if (pen && s.pen !== pen.id) continue;
    const d = Math.hypot(s.x - g[0], s.z - g[2]);
    if (d < (s.cow ? 0.75 : 0.42) && d < bd) { bd = d; best = s; }
  }
  return best;
}

function bindFarmInput(cv) {
  cv.addEventListener("pointerdown", e => {
    if (!FV.R) return;
    cv.setPointerCapture(e.pointerId);
    const [x, y] = canvasXY(e);
    FV.ptr.set(e.pointerId, { x, y, x0: x, y0: y });
    FV.touchAt = performance.now();
    FV.vel = [0, 0];
    FV.focusId = (FV.focusId || 0) + 1; FV.focusing = false;
    if (FV.ptr.size === 2) {
      clearTimeout(FV.lp);
      const [a, b] = [...FV.ptr.values()];
      FV.gesture = { kind: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y), dist0: FV.R.cam.dist };
      return;
    }
    if (FV.ptr.size > 2) return;
    FV.gesture = { kind: "tap", t0: e.timeStamp, x0: x, y0: y, g0: groundAt(x, y), lastT: performance.now(), lx: x, ly: y };
    /* Bauen: am Objekt anfassen und schieben */
    if (FV.place) {
      const tt = tileAt(x, y), P = FV.place;
      if (tt && tt[0] >= P.x - 1 && tt[0] <= P.x + P.w && tt[1] >= P.z - 1 && tt[1] <= P.z + P.d) {
        FV.gesture = { kind: "ghost", ox: tt[0] - P.x, oz: tt[1] - P.z };
        return;
      }
    }
    /* lange drücken: verschieben */
    clearTimeout(FV.lp);
    FV.lp = setTimeout(() => {
      if (!FV.gesture || FV.gesture.kind !== "tap" || FV.place || FV.tool) return;
      const o = pickObj(x, y);
      if (o && o.t !== "house") { FV.gesture = null; startMove(o); }
    }, 520);
  });
  cv.addEventListener("pointermove", e => {
    const p = FV.ptr.get(e.pointerId);
    if (!p || !FV.R) return;
    const [x, y] = canvasXY(e);
    p.x = x; p.y = y;
    const G = FV.gesture;
    if (!G) return;
    if (G.kind === "pinch" && FV.ptr.size >= 2) {
      const [a, b] = [...FV.ptr.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      FV.R.cam.dist = G.dist0 * (G.d0 / Math.max(20, d));
      clampCam();
      return;
    }
    if (G.kind === "ghost") {
      const tt = tileAt(x, y);
      if (tt) movePlace(tt[0] - G.ox, tt[1] - G.oz);
      return;
    }
    if (G.kind === "tap" && Math.hypot(x - G.x0, y - G.y0) > 7) { G.kind = "pan"; clearTimeout(FV.lp); closeFarmPop(); }
    if (G.kind === "pan" && G.g0) {
      const g = groundAt(x, y);
      if (!g) return;
      const c = FV.R.cam, now = performance.now();
      const dx = G.g0[0] - g[0], dz = G.g0[2] - g[2];
      c.tx += dx; c.tz += dz;
      clampCam();
      const dtm = Math.max(1, now - G.lastT) / 1000;
      FV.vel = [dx / dtm * 0.6 + FV.vel[0] * 0.4, dz / dtm * 0.6 + FV.vel[1] * 0.4];
      G.lastT = now;
    }
  });
  const up = e => {
    const p = FV.ptr.get(e.pointerId);
    FV.ptr.delete(e.pointerId);
    clearTimeout(FV.lp);
    if (!p || !FV.R) return;
    const G = FV.gesture;
    if (FV.ptr.size) { if (G && G.kind === "pinch") FV.gesture = null; return; }
    FV.gesture = null;
    if (!G) return;
    if (G.kind === "pan") { if (performance.now() - G.lastT > 90) FV.vel = [0, 0]; return; }
    FV.vel = [0, 0];
    if (G.kind === "tap" && e.timeStamp - G.t0 < 700) farmTap(p.x, p.y);
  };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", e => {
    e.preventDefault();
    if (!FV.R) return;
    FV.R.cam.dist *= Math.exp(e.deltaY * 0.0012);
    clampCam();
  }, { passive: false });
}

/* ------------------------------ Antippen ------------------------------ */
function farmTap(x, y) {
  if (FV.place) {
    const tt = tileAt(x, y);
    if (tt) movePlace(tt[0] - Math.floor(FV.place.w / 2), tt[1] - Math.floor(FV.place.d / 2));
    return;
  }
  const o = pickObj(x, y);
  if (!o) { closeFarmPop(); FV.sel = null; return; }
  const time = (performance.now() - FV.t0) / 1000;
  FV.bounce.set(o.id, time);
  sfx("tap");
  objAction(o, x, y);
}
function objAction(o, x, y) {
  closeFarmPop();
  FV.sel = o.id;
  switch (o.t) {
    case "field": {
      const st = fieldState(o);
      if (st === "empty") openPop(o, "seed");
      else if (st === "ripe") openPop(o, "sickle");
      else openPop(o, "grow");
      break;
    }
    case "tree": {
      if (treeRipe(o)) { doPick(o); FV.sel = null; }
      else openPop(o, "tree");
      break;
    }
    case "coop": case "cows": {
      const got = collectPen(o);
      if (got) { FV.sel = null; break; }
      const s = x != null ? pickAnimal(x, y, o) : null;
      if (s) {
        const [, a] = animalById(s.id);
        if (a && aniState(a) === "busy" && !a.petted && farmPet(o, a)) {
          FV.bounce.set("a" + s.id, (performance.now() - FV.t0) / 1000);
          FV.R.burst({ x: s.x, y: s.cow ? 1.1 : 0.45, z: s.z, n: 5, col: [0.95, 0.3, 0.42, 1], speed: 0.5, up: 1.2, g: 0.6, life: 1.3, size: 0.13, shape: 2 });
          sfx("pet");
          floatText(x, y - 30, "♥ Qualität +1", "pet");
          FV.sel = null; save();
          break;
        }
      }
      openPop(o, "pen");
      break;
    }
    case "bakery": case "mill": case "dairy": {
      const got = farmCollectMach(o);
      if (got.length) { got.forEach((g, i) => flyGain(o, g, i)); sfx("collect"); FV.sel = null; save(); farmSyncState(); break; }
      openMachine(o);
      break;
    }
    case "silo": openFarmStore("silo"); break;
    case "barn": openFarmStore("barn"); break;
    case "board": openFarmOrders(); break;
    case "house": openFarmHouse(); break;
    case "shed": openFarmShed(); break;
    case "deco": openPop(o, "deco"); break;
  }
}

/* ------------------------- Aktionen mit Effekt ------------------------- */
function objScreen(o, h) {
  const [cx, cz] = farmCenter(o);
  const p = FV.R.project(cx, h == null ? objH(o) * 0.6 : h, cz);
  return p || [FV.R.w / 2, FV.R.h / 2];
}
function doHarvest(o, viaDrag) {
  const r = farmHarvest(o);
  if (!r) return false;
  const [cx, cz] = farmCenter(o);
  FV.R.burst({ x: cx, y: 0.3, z: cz, n: 14, col: [[0.95, 0.8, 0.3, 1], [0.55, 0.78, 0.3, 1], [0.9, 0.7, 0.25, 1]], speed: 1.8, up: 2.2, size: 0.07, shape: 1 });
  flyGain(o, r, 0);
  sfx(viaDrag ? "swish" : "collect");
  if (r.n > 2) floatText(...objScreen(o, 0.8), "Rekordernte!", "gold");
  farmSyncState();
  return true;
}
function doPlant(o, crop) {
  if (!farmPlant(o, crop)) return false;
  const [cx, cz] = farmCenter(o);
  FV.R.burst({ x: cx, y: 0.12, z: cz, n: 9, col: [0.55, 0.38, 0.22, 0.95], speed: 1.2, up: 1.2, size: 0.09, flat: true });
  sfx("plant");
  farmSyncState();
  return true;
}
function doWater(o) {
  if (!farmWater(o)) return false;
  const [cx, cz] = farmCenter(o);
  for (let i = 0; i < 16; i++) FV.R.emit({ x: cx + (Math.random() - 0.5) * 1.6, y: o.t === "tree" ? 2.4 : 1.2, z: cz + (Math.random() - 0.5) * 1.6, vy: -2.5, g: -6, life: 0.55, size: 0.06, col: [0.45, 0.72, 1, 0.9] });
  sfx("water");
  floatText(...objScreen(o, 0.9), "💧 schneller · ★+1", "blue");
  return true;
}
function doPick(o) {
  const r = farmPick(o);
  if (!r) return false;
  const time = (performance.now() - FV.t0) / 1000;
  FV.shake.set(o.id, time);
  const [cx, cz] = farmCenter(o);
  const col = { apfel: [0.85, 0.2, 0.17, 1], kirsche: [0.66, 0.06, 0.17, 1], birne: [0.78, 0.82, 0.29, 1] }[o.kind];
  FV.R.burst({ x: cx, y: 1.6, z: cz, n: 10, col: [col, [0.4, 0.7, 0.25, 1]], speed: 1.4, up: 0.6, size: 0.08, g: -7 });
  flyGain(o, r, 0);
  sfx("collect");
  farmSyncState();
  return true;
}
function collectPen(o) {
  const ready = o.animals.filter(a => aniState(a) === "ready");
  if (!ready.length) return false;
  let i = 0;
  for (const a of ready) {
    const r = farmCollect(o, a);
    if (!r) break;
    const s = FV.ani.get(a.id);
    if (s) {
      const p = FV.R.project(s.x, 0.3, s.z);
      if (p) flyItem(FITEMS[r.id].i, p[0], p[1], storeBtn(), i * 70);
      FV.R.burst({ x: s.x, y: 0.2, z: s.z, n: 6, col: s.cow ? [0.95, 0.95, 1, 0.9] : [1, 1, 1, 0.9], speed: 0.8, up: 1.5, size: 0.06, shape: s.cow ? 0 : 1 });
    }
    i++;
  }
  if (i) {
    const [x, y] = objScreen(o, 0.8);
    const id = FANIMALS[o.t === "coop" ? "huhn" : "kuh"].out;
    floatText(x, y, "+" + i + " " + FITEMS[id].i + "  ·  " + qStars(farmQ(id)), "");
    xpFly(x, y, FITEMS[id].xp * i);
    sfx("collect");
    save();
  }
  return i > 0;
}
function doFeed(o, a) {
  const r = farmFeed(o, a);
  if (r === "nofeed") return "nofeed";
  if (!r) return false;
  const s = FV.ani.get(a.id);
  if (s) {
    FV.R.burst({ x: s.x, y: 0.15, z: s.z, n: 8, col: s.cow ? [0.45, 0.68, 0.3, 1] : [0.9, 0.78, 0.45, 1], speed: 0.9, up: 1.2, size: 0.05, shape: 1 });
    FV.bounce.set("a" + s.id, (performance.now() - FV.t0) / 1000);
  }
  sfx("feed");
  return true;
}
function feedAll(o) {
  let n = 0, none = false;
  for (const a of o.animals) {
    if (aniState(a) !== "hungry") continue;
    const r = doFeed(o, a);
    if (r === "nofeed") { none = true; break; }
    if (r) n++;
  }
  if (none && !n) noFeed(o);
  else if (none) toast("Futter reicht nicht für alle – ab in die Futtermühle!", "warn");
  if (n) save();
  return n;
}
function noFeed(o) {
  const A = FANIMALS[o.t === "coop" ? "huhn" : "kuh"];
  toast(FITEMS[A.feed].i + " Kein " + FITEMS[A.feed].n + " mehr. Die Futtermühle macht es aus " + (A.feed === "hfutter" ? "2 Weizen + 1 Mais" : "2 Weizen + 2 Mais") + ".", "warn");
}

/* ------------------------------ Effekte ------------------------------- */
function storeBtn() { return $("#fbStore"); }
function flyGain(o, g, i) {
  const [x, y] = objScreen(o);
  flyItem(FITEMS[g.id].i, x, y, storeBtn(), i * 90, g.n);
  floatText(x, y - 10, "+" + g.n + " " + FITEMS[g.id].i, "");
  if (g.xp) xpFly(x, y, g.xp);
}
function flyItem(icon, x, y, toEl, delay, n) {
  const fx = $("#farmFx");
  if (!fx || !toEl) return;
  const fr = fx.getBoundingClientRect(), tr = toEl.getBoundingClientRect();
  const tx = tr.left + tr.width / 2 - fr.left, ty = tr.top + tr.height / 2 - fr.top;
  const count = Math.min(5, n || 1);
  for (let k = 0; k < count; k++) {
    const el = document.createElement("div");
    el.className = "ffly";
    el.textContent = icon;
    fx.appendChild(el);
    const sx = x + (Math.random() - 0.5) * 30, sy = y + (Math.random() - 0.5) * 20;
    const mx = (sx + tx) / 2 + (Math.random() - 0.5) * 80, my = Math.min(sy, ty) - 60 - Math.random() * 50;
    const a = el.animate([
      { transform: `translate(${sx}px,${sy}px) scale(.4)`, opacity: 0 },
      { transform: `translate(${sx}px,${sy - 26}px) scale(1.25)`, opacity: 1, offset: 0.18 },
      { transform: `translate(${mx}px,${my}px) scale(1.05)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${tx}px,${ty}px) scale(.55)`, opacity: 0.9 }
    ], { duration: 820 + k * 60, delay: (delay || 0) + k * 55, easing: "cubic-bezier(.4,.1,.5,1)", fill: "both" });
    a.onfinish = () => { el.remove(); toEl.classList.remove("ping"); void toEl.offsetWidth; toEl.classList.add("ping"); };
  }
}
function xpFly(x, y, n) {
  if (!n) return;
  const xp = $("#hudLevel");
  floatText(x + 34, y + 6, "+" + n + " XP", "xp");
  if (xp) flyItem("⭐", x, y, xp, 200, 1);
}
function coinFly(x, y, amount) {
  floatText(x, y, "+" + eur(amount), "gold");
  flyItem("🪙", x, y, $("#hudMoney"), 0, 4);
  sfx("coin");
}
function floatText(x, y, txt, cls) {
  const fx = $("#farmFx");
  if (!fx) return;
  const el = document.createElement("div");
  el.className = "ffloat " + (cls || "");
  el.textContent = txt;
  fx.appendChild(el);
  el.style.left = x + "px"; el.style.top = y + "px";
  el.animate([{ transform: "translate(-50%,0) scale(.6)", opacity: 0 }, { transform: "translate(-50%,-22px) scale(1.1)", opacity: 1, offset: 0.2 },
    { transform: "translate(-50%,-58px) scale(1)", opacity: 0 }], { duration: 1400, easing: "ease-out", fill: "both" }).onfinish = () => el.remove();
}

/* -------------------------------- Töne -------------------------------- */
let farmAC = null;
function sfx(kind) {
  if (!S.farm || !S.farm.snd) return;
  try {
    if (!farmAC) farmAC = new (window.AudioContext || window.webkitAudioContext)();
    if (farmAC.state === "suspended") farmAC.resume();
    const ac = farmAC, t = ac.currentTime;
    const tone = (f, d, type, vol, f2, delay) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, t + (delay || 0));
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (delay || 0) + d);
      g.gain.setValueAtTime(0.0001, t + (delay || 0));
      g.gain.exponentialRampToValueAtTime(vol || 0.08, t + (delay || 0) + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (delay || 0) + d);
      o.connect(g); g.connect(ac.destination);
      o.start(t + (delay || 0)); o.stop(t + (delay || 0) + d + 0.02);
    };
    const noise = (d, vol, hp) => {
      const b = ac.createBuffer(1, Math.floor(ac.sampleRate * d), ac.sampleRate), ch = b.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
      const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
      f.type = "highpass"; f.frequency.value = hp || 1200;
      s.buffer = b; g.gain.value = vol || 0.05; s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
    };
    ({
      tap: () => tone(520, 0.06, "triangle", 0.05),
      collect: () => { tone(660, 0.08, "triangle", 0.07); tone(990, 0.1, "triangle", 0.06, null, 0.06); },
      swish: () => noise(0.12, 0.05, 2500),
      plant: () => tone(300, 0.08, "sine", 0.08, 180),
      water: () => noise(0.25, 0.035, 3000),
      feed: () => { noise(0.08, 0.04, 1800); tone(440, 0.05, "triangle", 0.04); },
      coin: () => { tone(1320, 0.07, "square", 0.03); tone(1760, 0.12, "square", 0.03, null, 0.07); },
      pet: () => { tone(880, 0.1, "sine", 0.05, 1200); tone(1100, 0.12, "sine", 0.04, 1500, 0.08); },
      build: () => { noise(0.1, 0.06, 400); tone(200, 0.12, "triangle", 0.08, 120, 0.05); },
      level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, "triangle", 0.07, null, i * 0.11)),
      pop: () => tone(700, 0.05, "sine", 0.06, 900),
      bad: () => tone(220, 0.15, "sawtooth", 0.03, 160)
    }[kind] || (() => {}))();
  } catch (e) { /* kein Ton */ }
}

/* ------------------------- Blasen über Objekten ------------------------ */
function updateFarmTags() {
  const box = $("#farmTags");
  if (!box || !FV.R) return;
  const want = [];
  for (const o of S.farm.objs) {
    if (o.q) {
      machUpdate(o);
      if (o.done.length) {
        const ic = [...new Set(o.done.map(d => FITEMS[d.r].i))].slice(0, 3).join("");
        want.push([o, "ready", ic + (o.done.length > 1 ? "<b>" + o.done.length + "</b>" : ""), objH(o) + 0.4]);
      } else if (o.q.length) {
        const it = o.q[0], f = clamp((S.time - it.start) / Math.max(1, it.end - it.start), 0, 1);
        want.push([o, "work", FITEMS[it.r].i + `<i style="--p:${Math.round(f * 100)}%"></i>`, objH(o) + 0.3]);
      }
    }
    if (o.animals && o.animals.length) {
      const hungry = o.animals.filter(a => aniState(a) === "hungry").length;
      const ready = o.animals.filter(a => aniState(a) === "ready").length;
      if (ready) want.push([o, "ready", FITEMS[FANIMALS[o.t === "coop" ? "huhn" : "kuh"].out].i + "<b>" + ready + "</b>", 1.6]);
      else if (hungry) want.push([o, "hungry", "💭" + FITEMS[FANIMALS[o.t === "coop" ? "huhn" : "kuh"].feed].i, 1.6]);
    }
    if (o.t === "board") {
      const os = farmOrders(), ok = os.filter(farmOrderReady).length;
      if (os.length) want.push([o, ok ? "ready" : "info", "📋<b>" + (ok ? ok + " ✓" : os.length) + "</b>", 1.9]);
    }
    if (o.t === "house" && S.farm.qdone) want.push([o, "ready", "📒✓", 5.2]);
  }
  const keep = new Set();
  want.forEach(([o, cls, html, h]) => {
    const key = "t" + o.id;
    keep.add(key);
    let el = box.querySelector(`[data-k="${key}"]`);
    if (!el) {
      el = document.createElement("button");
      el.dataset.k = key;
      el.onclick = () => { FV.bounce.set(o.id, (performance.now() - FV.t0) / 1000); objAction(o); };
      box.appendChild(el);
    }
    if (el._h !== html || el._c !== cls) { el.innerHTML = html; el.className = "ftag " + cls; el._h = html; el._c = cls; }
    const [cx, cz] = farmCenter(o);
    const p = FV.R.project(cx, h, cz);
    if (!p) { el.style.display = "none"; return; }
    el.style.display = "";
    el.style.transform = `translate(${Math.round(p[0])}px,${Math.round(p[1])}px)`;
  });
  box.querySelectorAll(".ftag").forEach(el => { if (!keep.has(el.dataset.k)) el.remove(); });
  /* Hofschild am Tor */
  let sign = box.querySelector(".fsign");
  if (!sign) { sign = document.createElement("div"); sign.className = "fsign"; box.appendChild(sign); }
  const nm = S.player ? S.player.company : "Hof";
  if (sign._t !== nm) { sign.textContent = nm; sign._t = nm; }
  const sp = FV.R.project(5, 1.68, 13.05);
  if (sp) { sign.style.display = ""; sign.style.transform = `translate(${Math.round(sp[0])}px,${Math.round(sp[1])}px) scale(${clamp(22 / FV.R.cam.dist, 0.45, 1.3).toFixed(2)})`; }
  else sign.style.display = "none";
}

/* ------------------------- Werkzeug-Menü am Objekt ---------------------- */
function openPop(o, kind) {
  FV.pop = { id: o.id, kind };
  renderFarmPop();
}
function closeFarmPop() {
  FV.pop = null;
  const el = $("#farmPop");
  if (el) { el.innerHTML = ""; el.className = ""; }
}
function renderFarmPop() {
  const el = $("#farmPop");
  const P = FV.pop;
  if (!el || !P) return;
  const o = farmObj(P.id);
  if (!o) return closeFarmPop();
  let h = "";
  const lv = level();
  if (P.kind === "seed") {
    h = `<div class="fp-h">Was soll wachsen?<small>Zieh die Saat über leere Felder</small></div><div class="fp-row">`
      + Object.keys(FCROPS).map(id => {
        const c = FCROPS[id], it = FITEMS[id], lock = c.lv > lv;
        const rot = !lock && o.last && o.last !== id ? `<em class="rot" title="Fruchtwechsel: +1 Stern">↻★</em>` : "";
        return `<div class="ftool${lock ? " lock" : ""}" data-tool="seed" data-crop="${id}">
          <span class="ic">${lock ? "🔒" : it.i}</span>${rot}<b>${lock ? "Lv " + c.lv : esc(it.n)}</b><small>${lock ? "" : fdur(c.t) + " · " + eur(c.seed)}</small></div>`;
      }).join("") + `</div>`;
  } else if (P.kind === "sickle") {
    h = `<div class="fp-h">${FITEMS[o.crop].i} ${esc(FITEMS[o.crop].n)} ist reif!<small>Zieh die Sichel über alle reifen Felder</small></div>
      <div class="fp-row"><div class="ftool big" data-tool="sickle"><span class="ic">🌙</span><b>Sichel</b></div></div>`;
  } else if (P.kind === "grow") {
    const left = o.end - S.time, q = Math.min(5, 3 + (o.w ? 1 : 0) + (o.rot ? 1 : 0));
    h = `<div class="fp-h">${FITEMS[o.crop].i} ${esc(FITEMS[o.crop].n)}<small>reif in <span class="fp-left">${fdur(Math.max(1, left))}</span> · ${qStars(q)}</small></div>
      <div class="fp-row">${o.w ? `<div class="ftool done"><span class="ic">💧</span><b>gegossen</b></div>`
        : `<div class="ftool big" data-tool="water"><span class="ic">🚿</span><b>Gießen</b><small>25 % schneller, +1 ★</small></div>`}</div>`;
  } else if (P.kind === "tree") {
    const T = FTREES[o.kind], left = o.end - S.time;
    h = `<div class="fp-h">${FITEMS[o.kind].i} ${esc(T.n)}<small>Früchte in <span class="fp-left">${fdur(Math.max(1, left))}</span>${(o.h || 0) >= 3 ? " · alter Baum: +1 ★" : ""}</small></div>
      <div class="fp-row">${o.w ? `<div class="ftool done"><span class="ic">💧</span><b>gegossen</b></div>`
        : `<div class="ftool big" data-tool="water"><span class="ic">🚿</span><b>Gießen</b><small>25 % schneller, +1 ★</small></div>`}</div>`;
  } else if (P.kind === "pen") {
    const pi = penInfo(o), A = pi.A;
    const hungry = o.animals.filter(a => aniState(a) === "hungry").length;
    const busy = o.animals.filter(a => aniState(a) === "busy");
    const next = busy.length ? Math.min(...busy.map(a => a.fed)) - S.time : 0;
    h = `<div class="fp-h">${A.i} ${o.animals.length} ${o.animals.length === 1 ? A.n : (A.n === "Huhn" ? "Hühner" : "Kühe")} · ${qStars(pi.stars)}
        <small>${esc(pi.keep)} · ${fmt(pi.per, 0)} ${A.unit} je Tier${busy.length ? " · nächstes " + FITEMS[A.out].i + " in " + fdur(Math.max(1, next)) : ""}</small></div>
      <div class="fp-row">
        ${hungry ? `<div class="ftool big" data-tool="feed"><span class="ic">${FITEMS[A.feed].i}</span><b>Füttern</b><small>${farmInv(A.feed)} da · ${hungry} hungrig</small></div>` : ""}
        <div class="ftool" data-act="pen"><span class="ic">🔍</span><b>Stall</b><small>Platz & Tiere</small></div>
        ${!o.animals.length ? `<div class="ftool" data-act="buyani"><span class="ic">${A.i}</span><b>Kaufen</b><small>${eur(animalPrice(o.t === "coop" ? "huhn" : "kuh"))}</small></div>` : ""}
      </div>${busy.length && !hungry ? `<div class="fp-tip">Tipp: Tier antippen und streicheln – ${o.t === "coop" ? "das nächste Ei" : "die nächste Milch"} wird besser.</div>` : ""}`;
  } else if (P.kind === "deco") {
    const D = FDECO[o.k];
    h = `<div class="fp-h">${D.i} ${esc(D.n)}</div><div class="fp-row">
      <div class="ftool" data-act="move"><span class="ic">↔️</span><b>Verschieben</b></div>
      <div class="ftool" data-act="sell"><span class="ic">🗑️</span><b>Verkaufen</b><small>+${eur(Math.round(D.price * 0.5))}</small></div></div>`;
  }
  el.className = "on";
  el.innerHTML = `<div class="fp-box">${h}</div>`;
  el.querySelectorAll("[data-tool]").forEach(t => {
    if (t.classList.contains("lock")) return;
    t.addEventListener("pointerdown", e => startToolDrag(e, t.dataset.tool, t.dataset.crop, o));
  });
  el.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
    const a = b.dataset.act;
    if (a === "pen") { closeFarmPop(); openPen(o); }
    if (a === "buyani") { closeFarmPop(); buyAnimalInto(o.t === "coop" ? "huhn" : "kuh", o); }
    if (a === "move") { closeFarmPop(); startMove(o); }
    if (a === "sell") { const [x, y] = objScreen(o); if (farmRemove(o)) { coinFly(x, y, Math.round(FDECO[o.k].price * 0.5)); closeFarmPop(); farmSyncScene(); save(); } }
  });
  positionFarmPop();
}
function positionFarmPop() {
  const P = FV.pop, el = $("#farmPop");
  if (!P || !el || !el.firstChild || !FV.R) return;
  const o = farmObj(P.id);
  if (!o) return;
  const [cx, cz] = farmCenter(o);
  const p = FV.R.project(cx, objH(o), cz);
  if (!p) return;
  const box = el.firstChild, w = box.offsetWidth, hgt = box.offsetHeight;
  const W = FV.R.w, H = FV.R.h;
  let x = clamp(p[0] - w / 2, 8, W - w - 8), y = p[1] - hgt - 24;
  if (y < 56) y = Math.min(H - hgt - 8, p[1] + 40);
  box.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  const left = el.querySelector(".fp-left");
  if (left && (P.kind === "grow" || P.kind === "tree")) {
    const t = o.end - S.time;
    if (t <= 0) { objAction(o); return; }
    const s = fdur(Math.max(1, t));
    if (left.textContent !== s) left.textContent = s;
  }
}

/* --------------------- Werkzeug ziehen (Hay-Day-Geste) ----------------- */
function startToolDrag(e, kind, crop, origin) {
  e.preventDefault(); e.stopPropagation();
  const ghost = document.createElement("div");
  ghost.className = "fdrag";
  ghost.textContent = { seed: FITEMS[crop] ? FITEMS[crop].i : "🌱", sickle: "🌙", water: "🚿", feed: origin && origin.animals ? FITEMS[FANIMALS[origin.t === "coop" ? "huhn" : "kuh"].feed].i : "🥣" }[kind];
  $("#farm").appendChild(ghost);
  const T = FV.tool = { kind, crop, origin, ghost, moved: false, x0: e.clientX, y0: e.clientY, done: 0, hit: new Set() };
  const fr = $("#farm").getBoundingClientRect();
  const place = (cx, cy) => { ghost.style.transform = `translate(${cx - fr.left}px,${cy - fr.top - 34}px)`; };
  place(e.clientX, e.clientY);
  $("#farmPop").classList.add("dragging");
  const move = ev => {
    place(ev.clientX, ev.clientY);
    if (Math.hypot(ev.clientX - T.x0, ev.clientY - T.y0) > 10) T.moved = true;
    if (!T.moved) return;
    const r = $("#farmCv").getBoundingClientRect();
    applyToolAt(ev.clientX - r.left, ev.clientY - r.top, T);
  };
  const up = ev => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    ghost.remove();
    if (!T.moved) applyToolTo(T.origin, T);          /* nur angetippt: aufs gewählte Objekt */
    FV.tool = null;
    $("#farmPop").classList.remove("dragging");
    if (T.done) save();
    if (T.done || !T.moved) {
      closeFarmPop();
      FV.sel = null;
    } else renderFarmPop();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}
function applyToolAt(x, y, T) {
  const tt = tileAt(x, y);
  if (!tt) return;
  if (T.kind === "feed") {
    const g = tt[2], pen = objAtTile(tt[0], tt[1]);
    let best = null, bd = 1e9;
    for (const s of FV.ani.values()) {
      if (pen && s.pen !== pen.id) continue;
      const [o, a] = animalById(s.id);
      if (!o || !a || aniState(a) !== "hungry") continue;
      const d = Math.hypot(s.x - g[0], s.z - g[2]);
      if (d < (s.cow ? 1.6 : 1.1) && d < bd) { bd = d; best = s; }
    }
    if (best) {
      const [o, a] = animalById(best.id);
      const r = doFeed(o, a);
      if (r === "nofeed") { if (!T.nofeed) { T.nofeed = true; noFeed(o); } }
      else if (r) T.done++;
    }
    return;
  }
  const o = objAtTile(tt[0], tt[1]);
  if (o && !T.hit.has(o.id)) applyToolTo(o, T);
}
function applyToolTo(o, T) {
  if (!o) return;
  let ok = false;
  if (T.kind === "seed" && o.t === "field" && fieldState(o) === "empty") ok = doPlant(o, T.crop);
  else if (T.kind === "sickle" && o.t === "field" && fieldState(o) === "ripe") ok = doHarvest(o, true);
  else if (T.kind === "water" && (o.t === "field" || o.t === "tree")) ok = doWater(o);
  else if (T.kind === "feed" && o.animals) ok = feedAll(o) > 0;
  if (ok) {
    T.hit.add(o.id); T.done++;
    FV.bounce.set(o.id, (performance.now() - FV.t0) / 1000);
    if (T.kind === "seed" && S.money < FCROPS[T.crop].seed && !T.broke) { T.broke = true; toast("Das Geld für Saatgut ist alle.", "warn"); }
  }
}

/* ----------------------------- Bauen & Schieben ----------------------- */
function startPlace(spec, x, z) {
  const R = FV.R;
  if (!R) return;
  cancelPlace();
  const proto = spec.proto;
  const [w, d] = farmSize(proto);
  const at = x != null ? [x, z] : (farmFreeSpot(w, d, R.cam.tx + FG / 2, R.cam.tz + FG / 2) || [FIN0, FIN0]);
  const ghost = fnode(objMesh(proto), { alpha: 0.82, shadow: false });
  const mark = fnode(fmesh("mark:" + w + "x" + d, () => FM.tileMarker(w, d)), { alpha: 0.55, shadow: false, y: 0.01 });
  R.nodes.push(mark, ghost);
  FV.place = { spec, proto, ghost, mark, w, d, x: at[0], z: at[1], r: proto.r || 0, move: spec.move || null };
  if (spec.move) { const e = FV.nodes.get(spec.move.id); if (e) e.node.visible = false; hideAnimalsOf(spec.move, true); }
  movePlace(at[0], at[1]);
  closeFarmPop();
  renderPlaceBar();
  farmFocus({ t: "field", x: at[0], z: at[1], r: 0 });
}
function movePlace(x, z) {
  const P = FV.place;
  if (!P) return;
  P.x = clamp(x, FIN0, FIN1 - P.w); P.z = clamp(z, FIN0, FIN1 - P.d);
  const cx = P.x + P.w / 2 - FG / 2, cz = P.z + P.d / 2 - FG / 2;
  P.ghost.x = P.mark.x = cx; P.ghost.z = P.mark.z = cz;
  P.ghost.ry = P.r ? -Math.PI / 2 : 0;
  P.ok = farmFits(P.x, P.z, P.w, P.d, P.move ? P.move.id : null);
  P.mark.tint = P.ok ? [0.3, 0.85, 0.4, 0.75] : [0.95, 0.25, 0.25, 0.75];
  P.ghost.tint = P.ok ? null : [0.95, 0.3, 0.3, 0.35];
  const b = $("#fpOk"); if (b) b.classList.toggle("disabled", !P.ok);
}
function rotatePlace() {
  const P = FV.place;
  if (!P || P.proto.t === "coop" || P.proto.t === "cows" || P.proto.t === "field") return;
  P.r = P.r ? 0 : 1;
  P.proto.r = P.r;
  const [w, d] = farmSize(P.proto);
  P.w = w; P.d = d;
  const i = FV.R.nodes.indexOf(P.mark);
  P.mark = fnode(fmesh("mark:" + w + "x" + d, () => FM.tileMarker(w, d)), { alpha: 0.55, shadow: false, y: 0.01 });
  FV.R.nodes[i] = P.mark;
  movePlace(P.x, P.z);
}
function confirmPlace() {
  const P = FV.place;
  if (!P || !P.ok) { sfx("bad"); return; }
  if (P.move) {
    const o = P.move;
    o.x = P.x; o.z = P.z; o.r = P.r;
    cancelPlace(true);
    if (o.animals) o.animals.forEach(a => dropAnimal(a.id));
    farmSyncScene();
    puff(o);
    save();
    return;
  }
  const o = farmBuild(Object.assign({}, P.spec.build, { price: P.spec.price, label: P.spec.label }), P.x, P.z, P.r);
  if (!o) return;
  cancelPlace(true);
  farmSyncScene();
  puff(o);
  sfx("build");
  const [x, y] = objScreen(o);
  floatText(x, y, "−" + eur(P.spec.price), "red");
  save();
  /* Felder am Stück: gleich das nächste anbieten */
  if (o.t === "field" && P.spec.again && shopCount(FSHOP[0]) < shopLimit(FSHOP[0])) {
    const it = FSHOP[0];
    const spot = farmFreeSpot(2, 2, P.x + 3, P.z + 1);
    if (spot && S.money >= shopPrice(it)) setTimeout(() => buyShopItem(it, spot), 250);
  }
}
function cancelPlace(keep) {
  const P = FV.place;
  if (!P) return;
  const R = FV.R;
  [P.ghost, P.mark].forEach(n => { const i = R.nodes.indexOf(n); if (i >= 0) R.nodes.splice(i, 1); });
  if (P.move) { const e = FV.nodes.get(P.move.id); if (e) e.node.visible = true; hideAnimalsOf(P.move, false); }
  FV.place = null;
  renderPlaceBar();
}
function hideAnimalsOf(o, hide) {
  if (!o.animals) return;
  o.animals.forEach(a => { const s = FV.ani.get(a.id); if (s) { s.node.visible = !hide; if (hide) s.pn.visible = false; } });
}
function startMove(o) {
  if (FV.tutLock) return;
  sfx("pop");
  startPlace({ proto: Object.assign({}, o), move: o }, o.x, o.z);
}
function renderPlaceBar() {
  const el = $("#farmPlace");
  if (!el) return;
  const P = FV.place;
  if (!P) { el.innerHTML = ""; el.className = ""; return; }
  const rot = !["coop", "cows", "field", "tree"].includes(P.proto.t);
  el.className = "on";
  el.innerHTML = `<div class="fpl-t">${P.move ? "Verschieben" : esc(P.spec.label) + " · " + eur(P.spec.price)}<small>Zieh es an seinen Platz</small></div>
    <button class="fpl-b no" id="fpNo">✕</button>
    ${rot ? `<button class="fpl-b" id="fpRot">↻</button>` : ""}
    <button class="fpl-b ok${P.ok ? "" : " disabled"}" id="fpOk">✓</button>`;
  $("#fpNo").onclick = () => cancelPlace();
  $("#fpOk").onclick = confirmPlace;
  const r = $("#fpRot"); if (r) r.onclick = rotatePlace;
}
function puff(o) {
  const [cx, cz] = farmCenter(o), [w, d] = farmSize(o);
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * 6.28;
    FV.R.emit({ x: cx + Math.cos(a) * w / 2, y: 0.1, z: cz + Math.sin(a) * d / 2, vx: Math.cos(a) * 1.2, vy: 0.6, vz: Math.sin(a) * 1.2, life: 0.9, size: 0.18, size2: 0.4, col: [0.95, 0.92, 0.85, 0.75], drag: 2 });
  }
  FV.bounce.set(o.id, (performance.now() - FV.t0) / 1000);
}

/* ------------------------------- Fenster ------------------------------ */
function openFarmSheet(html, cls) {
  closeFarmPop();
  const s = $("#farmSheet");
  $("#farmSheetIn").innerHTML = `<button class="fs-x" id="fsX" aria-label="schließen">✕</button>` + html;
  s.className = "on " + (cls || "");
  $("#fsX").onclick = closeFarmSheet;
  FV.sheet = cls || "x";
}
function closeFarmSheet() {
  const s = $("#farmSheet");
  if (s) s.className = "";
  FV.sheet = null; FV.sheetFn = null; FV.sheetTick = null;
  FV.sel = null;
}
function refreshSheet() { if (FV.sheet && FV.sheetTick) FV.sheetTick(); }
const itemChip = (id, need, have) => `<span class="fchip${have != null && have < need ? " miss" : ""}">${FITEMS[id].i}<b>${have != null ? have + "/" : ""}${need}</b></span>`;

/* Mühle, Ofen, Molkerei */
function machQueueHTML(o) {
  machUpdate(o);
  const slots = [];
  o.q.forEach((it, i) => {
    const f = i === 0 ? clamp((S.time - it.start) / Math.max(1, it.end - it.start), 0, 1) : 0;
    slots.push(`<div class="fq-s work"><span>${FITEMS[it.r].i}</span><i style="width:${Math.round(f * 100)}%"></i><small>${i === 0 ? fdur(Math.max(1, it.end - S.time)) : "wartet"}</small></div>`);
  });
  o.done.forEach(d => slots.push(`<div class="fq-s done" data-collect="1"><span>${FITEMS[d.r].i}</span><small>fertig ✓</small></div>`));
  for (let i = slots.length; i < o.slots; i++) slots.push(`<div class="fq-s free"><small>frei</small></div>`);
  const sc = slotCost(o);
  return slots.join("") + (sc != null ? `<button class="fq-s buy" id="fqBuy">＋<small>${eur(sc)}</small></button>` : "");
}
function bindMachQueue(o) {
  $$("#farmSheetIn [data-collect]").forEach(b => b.onclick = () => {
    const got = farmCollectMach(o);
    if (got.length) { const [x, y] = objScreen(o); got.forEach((g, i) => { flyItem(FITEMS[g.id].i, x, y, storeBtn(), i * 80, g.n); xpFly(x, y, g.xp); }); sfx("collect"); save(); }
    openMachine(o);
  });
  const bb = $("#fqBuy");
  if (bb) bb.onclick = () => { if (farmBuySlot(o)) { sfx("coin"); save(); openMachine(o); } };
}
function openMachine(o) {
  FV.sheetFn = () => openMachine(o);
  /* jede Sekunde nur die Warteschlange nachführen */
  FV.sheetTick = () => {
    const q = $("#farmSheetIn .fq");
    if (!q) return;
    const h = machQueueHTML(o);
    if (q._h !== h) { q.innerHTML = h; q._h = h; bindMachQueue(o); }
  };
  const M = FMACHINES[o.t], lv = level();
  const rec = M.recipes.map(r => {
    const lock = r.lv > lv, it = FITEMS[r.id];
    const ok = !lock && farmHasAll(r.in);
    return `<button class="frec${lock ? " lock" : ok ? "" : " miss"}" data-rec="${r.id}" ${lock ? "disabled" : ""}>
      <span class="ic">${lock ? "🔒" : it.i}</span>
      <b>${esc(it.n)}${r.out > 1 ? " ×" + r.out : ""}</b>
      <span class="fr-in">${lock ? "ab Level " + r.lv : Object.keys(r.in).map(id => itemChip(id, r.in[id], farmInv(id))).join("")}</span>
      <small>⏱ ${fdur(r.t)} · Wert ${eur(it.v * r.out)}</small>
    </button>`;
  }).join("");
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">${M.i}</span>${esc(M.n)}</div>
    <div class="fq">${machQueueHTML(o)}</div>
    <div class="fs-sub">Tippe ein Rezept an, um es in die Warteschlange zu legen.</div>
    <div class="frecs">${rec}</div>`, "mach");
  $$("#farmSheetIn [data-rec]").forEach(b => b.onclick = () => {
    const r = farmQueue(o, b.dataset.rec);
    if (r === true) {
      sfx("pop");
      farmEvent("queue:" + b.dataset.rec);
      save(); openMachine(o);
    } else if (r === "full") { sfx("bad"); toast("Alle Plätze belegt – warte, bis etwas fertig ist, oder kauf einen Platz dazu.", "warn"); }
    else if (r === "missing") {
      sfx("bad");
      const m = farmMissing(recipeOf(o, b.dataset.rec).in).map(x => x.need + "× " + FITEMS[x.id].n).join(", ");
      toast("Es fehlt: " + m, "warn");
    }
  });
  bindMachQueue(o);
}

/* Silo & Scheune */
function openFarmStore(st) {
  FV.sheetFn = () => openFarmStore(st);
  const ids = Object.keys(FITEMS).filter(id => FITEMS[id].st === st && farmInv(id) > 0);
  const cap = farmStoreCap(st), used = farmStoreUsed(st), uc = storeUpCost(st);
  const sel = FV.storeSel && farmInv(FV.storeSel) > 0 && FITEMS[FV.storeSel].st === st ? FV.storeSel : null;
  openFarmSheet(`<div class="fs-tabs"><button class="${st === "silo" ? "on" : ""}" data-st="silo">🌾 Silo</button><button class="${st === "barn" ? "on" : ""}" data-st="barn">🏚️ Scheune</button></div>
    <div class="fcap"><i style="width:${Math.min(100, used / cap * 100)}%" class="${used / cap > 0.9 ? "full" : ""}"></i><span>${used} / ${cap}</span></div>
    <div class="finv">${ids.length ? ids.map(id => `<button class="fit${sel === id ? " on" : ""}" data-it="${id}"><span>${FITEMS[id].i}</span><b>${farmInv(id)}</b><small>${qStars(farmQ(id))}</small></button>`).join("")
      : `<div class="fs-empty">${st === "silo" ? "Leer. Ernte Felder und Bäume – die Ernte kommt hierher." : "Leer. Eier, Milch, Futter und alles Gebackene landen hier."}</div>`}</div>
    ${sel ? `<div class="fsell"><b>${FITEMS[sel].i} ${esc(FITEMS[sel].n)}</b> · ${qStars(farmQ(sel))} · Wert ${eur(FITEMS[sel].v)}
      <div class="fsell-b">${[1, 5, farmInv(sel)].filter((n, i, a) => n <= farmInv(sel) && a.indexOf(n) === i).map(n => `<button class="btn tiny ghost" data-sell="${n}">${n === farmInv(sel) && n > 1 ? "alle " + n : n + "×"} · ${eur(farmSellPrice(sel, n))}</button>`).join("")}</div>
      <small>Großhandel zahlt sofort, aber nur den halben Wert. Über Bestellungen bekommst du deutlich mehr.</small></div>` : ""}
    ${uc != null ? `<button class="btn fup" id="fsUp">🔨 ${esc(FSTORE[st].n)} ausbauen: +${FSTORE[st].step} Plätze · ${eur(uc)}</button>` : ""}
    <div class="fs-sub">Die Sterne zeigen die Qualität: Gießen, Fruchtwechsel und viel Platz für die Tiere machen Ware besser – das zahlt sich bei jeder Lieferung aus.</div>`, "store");
  $$("#farmSheetIn [data-st]").forEach(b => b.onclick = () => openFarmStore(b.dataset.st));
  $$("#farmSheetIn [data-it]").forEach(b => b.onclick = () => { FV.storeSel = FV.storeSel === b.dataset.it ? null : b.dataset.it; openFarmStore(st); });
  $$("#farmSheetIn [data-sell]").forEach(b => b.onclick = () => {
    const m = farmSell(sel, +b.dataset.sell);
    if (m) { const r = b.getBoundingClientRect(), fr = $("#farmFx").getBoundingClientRect(); coinFly(r.left - fr.left + r.width / 2, r.top - fr.top, m); save(); openFarmStore(st); }
  });
  const up = $("#fsUp");
  if (up) up.onclick = () => { if (farmStoreUp(st)) { sfx("build"); save(); openFarmStore(st); } };
}

/* Stall: Platz, Haltung, Tiere kaufen und verkaufen, Auslauf vergrößern */
function penAnisHTML(o) {
  const A = penInfo(o).A;
  return o.animals.map(a => {
    const st = aniState(a);
    return `<span class="fani ${st}" title="${st === "hungry" ? "hungrig" : st === "ready" ? "fertig" : "frisst"}">${A.i}<i>${st === "hungry" ? "💭" : st === "ready" ? FITEMS[A.out].i : "⏳"}</i></span>`;
  }).join("");
}
function openPen(o) {
  FV.sheetFn = () => openPen(o);
  FV.sheetTick = () => {
    const el = $("#farmSheetIn .fanis");
    if (!el || !o.animals.length) return;
    const h = penAnisHTML(o);
    if (el._h !== h) { el.innerHTML = h; el._h = h; }
  };
  const pi = penInfo(o), A = pi.A, kind = o.t === "coop" ? "huhn" : "kuh";
  const uc = penUpgradeCost(o), nx = FPENS[o.t][o.lvl];
  const nxPer = nx ? nx.m2 / Math.max(1, o.animals.length) : 0;
  const nxSt = nx ? (FKEEP.find(k => nxPer / A.space >= k.r) || FKEEP[4]).st : 0;
  const plural = A.n === "Huhn" ? "Hühner" : "Kühe";
  const add1 = o.animals.length < A.max ? (FKEEP.find(k => pi.p.m2 / (o.animals.length + 1) / A.space >= k.r) || FKEEP[4]).st : null;
  const ani = penAnisHTML(o);
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">${o.t === "coop" ? "🛖" : "🏚️"}</span>${o.t === "coop" ? "Hühnerstall" : "Kuhstall"} · ${o.animals.length}/${A.max} ${plural}</div>
    <div class="fkeep"><div class="fk-st">${qStars(pi.stars)}</div><div><b>${esc(pi.keep)}</b>
      <small>${fmt(pi.p.m2, 0)} ${A.unit} ${o.t === "coop" ? "Auslauf" : "Weide"} · ${fmt(pi.per, 0)} ${A.unit} je Tier (ideal ab ${fmt(A.space * 2, 0)})</small></div></div>
    <div class="fanis">${ani || `<div class="fs-empty">Noch keine ${plural}.</div>`}</div>
    <div class="fs-sub">Je mehr Platz jedes Tier hat, desto besser ${o.t === "coop" ? "die Eier" : "die Milch"}: Mehr Tiere bringen mehr Ware, aber auf engem Raum sinkt die Qualität – und damit der Preis.</div>
    <div class="fpen-b">
      ${o.animals.length < A.max ? `<button class="btn" id="fpBuy">${A.i} ${A.n} kaufen · ${eur(animalPrice(kind))}<small>danach ${qStars(add1)}</small></button>` : ""}
      ${o.animals.length ? `<button class="btn ghost" id="fpSell">${A.n} abgeben · +${eur(Math.round(A.price * 0.5))}</button>` : ""}
      ${uc != null ? `<button class="btn ghost" id="fpUp">📐 ${o.t === "coop" ? "Auslauf" : "Weide"} vergrößern auf ${fmt(nx.m2, 0)} ${A.unit} · ${eur(uc)}<small>dann ${qStars(nxSt)}</small></button>` : ""}
    </div>`, "pen");
  const b = $("#fpBuy"); if (b) b.onclick = () => buyAnimalInto(kind, o, true);
  const s = $("#fpSell"); if (s) s.onclick = () => askConfirm(A.n + " abgeben?", "Du bekommst " + eur(Math.round(A.price * 0.5)) + " zurück. Weniger Tiere haben mehr Platz.", "Abgeben", () => {
    const a = farmSellAnimal(o);
    if (a) { dropAnimal(a.id); sfx("coin"); save(); openPen(o); }
  });
  const u = $("#fpUp"); if (u) u.onclick = () => { if (farmPenUpgrade(o)) { sfx("build"); farmSyncScene(); puff(o); save(); openPen(o); } };
}
function buyAnimalInto(kind, pen, stay) {
  if (!pen) {
    const pens = S.farm.objs.filter(o => o.t === FANIMALS[kind].house);
    pen = pens.sort((a, b) => a.animals.length - b.animals.length)[0];
  }
  if (!farmBuyAnimal(kind, pen)) { sfx("bad"); return; }
  const a = pen.animals[pen.animals.length - 1];
  FV.drop = a.id;
  farmSyncScene();
  sfx("build");
  const [x, y] = objScreen(pen);
  floatText(x, y, FANIMALS[kind].i + " Willkommen!", "");
  save();
  if (stay) openPen(pen); else { closeFarmSheet(); farmFocus(pen); }
}

/* Bestellungen der Dörfer und Losschicken */
function openFarmOrders(sendFor) {
  FV.sheetFn = () => openFarmOrders(FV.sendFor);
  FV.sendFor = sendFor || null;
  const os = farmOrders().sort((a, b) => farmOrderReady(b) - farmOrderReady(a) || a.created - b.created);
  const atFarm = S.fleet.filter(f => f.at === FARM_NODE && f.phase === "idle");
  const vehLine = atFarm.length ? atFarm.map(f => vType(f.type).icon).join(" ") + " am Hof" : "Kein Fahrzeug am Hof – es kommt zur Abholung angefahren.";
  const html = os.map(o => {
    const ready = farmOrderReady(o);
    const q = farmOrderQ(o), pf = 1 + (q - 3) * 0.08;
    const km = o.refDist;
    const head = `<div class="fo-h"><b>${esc(o.shipper)}</b><small>${esc(N[o.to].name)} · ${km} km · ${kgf(o.weight)}</small></div>`;
    const items = `<div class="fo-it">${Object.keys(o.farm.items).map(id => itemChip(id, o.farm.items[id], farmInv(id))).join("")}</div>`;
    const reward = `<div class="fo-r"><span class="fo-m">${eur(Math.round(o.pay * pf))}</span><span class="fo-x">+${o.farm.xp} XP</span>${ready ? `<span class="fo-q">${qStars(q)}${pf !== 1 ? (pf > 1 ? " +" : " ") + Math.round((pf - 1) * 100) + " %" : ""}</span>` : ""}</div>`;
    let send = "";
    if (sendFor === o.id) {
      const opts = farmDispatchOptions(o);
      send = `<div class="fo-send">${opts.length ? opts.slice(0, 4).map((p, i) => `<button class="fo-v${p.late ? " late" : ""}" data-go="${i}">
          <span>${p.t.icon}</span><b>${esc(p.t.brand)}</b><small>${p.here ? "am Hof" : "kommt von " + esc(N[p.f.at].short)} · ${fdur(Math.round(p.ev.time))} · ${eur(p.ev.cost)}${p.late ? " · zu spät" : ""}</small></button>`).join("")
        : `<div class="fs-empty">Kein freies Fahrzeug schafft das gerade (Gewicht ${kgf(o.weight)}, ${km} km${N[o.to].modes.includes("b") ? "" : ", nur auf der Straße"}). Im Markt gibt es mehr.</div>`}</div>`;
      FV.sendOpts = opts;
    }
    return `<div class="fo${ready ? " ready" : ""}${sendFor === o.id ? " open" : ""}" data-o="${o.id}">${head}${items}${reward}
      <div class="fo-b">${ready ? `<button class="btn tiny" data-send="${o.id}">🚚 Liefern</button>` : `<span class="fo-miss">fehlt: ${farmMissing(o.farm.items).map(m => m.need + " " + FITEMS[m.id].i).join(" ")}</span>`}
        <button class="btn tiny ghost" data-drop="${o.id}" title="Bestellung ablehnen">🗑️</button></div>${send}</div>`;
  }).join("");
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">📋</span>Bestellungen<small>${vehLine}</small></div>
    <div class="fos">${html || `<div class="fs-empty">Gerade keine Bestellung. Neue kommen von allein – bald auch aus Potsdam und Berlin.</div>`}</div>
    <div class="fs-sub">Bessere Qualität bringt bis zu 16 % mehr. Unterwegs siehst du die Lieferung auf der Karte und unter „Live“.</div>`, "orders");
  $$("#farmSheetIn [data-send]").forEach(b => b.onclick = () => openFarmOrders(FV.sendFor === b.dataset.send ? null : b.dataset.send));
  $$("#farmSheetIn [data-go]").forEach(b => b.onclick = () => {
    const o = S.orders.find(x => x.id === FV.sendFor), p = FV.sendOpts[+b.dataset.go];
    if (!o || !p) return;
    if (farmSend(o, p)) {
      farmEvent("send");
      sfx("build");
      closeFarmSheet();
      farmSyncVehicles(false);
      renderFarmUI();
    }
  });
  $$("#farmSheetIn [data-drop]").forEach(b => b.onclick = () => {
    const o = S.orders.find(x => x.id === b.dataset.drop);
    if (!o || o.tutF) return;
    S.orders = S.orders.filter(x => x !== o);
    S.farm.lastOrd = S.time - 15;
    save(); openFarmOrders();
  });
}

/* Laden */
function openFarmShop(cat) {
  cat = cat || FV.shopCat || "feld";
  FV.shopCat = cat;
  FV.sheetFn = () => openFarmShop(cat);
  const lv = level();
  const cats = [["feld", "🌱 Felder & Bäume"], ["tier", "🐔 Tiere"], ["bau", "🏗️ Gebäude"], ["deko", "🌷 Deko"]];
  let items;
  if (cat === "deko") {
    items = Object.keys(FDECO).map(k => {
      const D = FDECO[k], lock = D.lv > lv;
      return `<button class="fshop${lock ? " lock" : S.money < D.price ? " poor" : ""}" data-deco="${k}" ${lock ? "disabled" : ""}><span class="ic">${lock ? "🔒" : D.i}</span><b>${esc(D.n)}</b><small>${lock ? "ab Level " + D.lv : eur(D.price)}</small></button>`;
    }).join("");
  } else {
    items = FSHOP.filter(it => it.cat === cat).map(it => {
      const lock = it.lv > lv, n = shopCount(it), lim = shopLimit(it), full = !it.animal && n >= lim;
      const price = shopPrice(it);
      let note = lock ? "ab Level " + it.lv : full ? "Maximum erreicht" + (it.id === "field" ? " – mehr ab dem nächsten Level" : "") : eur(price);
      if (it.animal) {
        const pens = S.farm.objs.filter(o => o.t === FANIMALS[it.animal].house);
        if (!lock && !pens.length) note = "erst Stall bauen";
        else if (!lock && pens.every(p => p.animals.length >= FANIMALS[it.animal].max)) note = "Stall voll";
      }
      return `<button class="fshop${lock || full ? " lock" : S.money < price ? " poor" : ""}" data-shop="${it.id}" ${lock || full ? "disabled" : ""}>
        <span class="ic">${lock ? "🔒" : it.i}</span><b>${esc(it.n)}</b><small>${note}</small>${!lock && !it.animal && lim < 99 ? `<em>${n}/${lim}</em>` : ""}<p>${esc(it.d)}</p></button>`;
    }).join("");
  }
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🛒</span>Laden</div>
    <div class="fs-tabs">${cats.map(([k, l]) => `<button class="${k === cat ? "on" : ""}" data-cat="${k}">${l}</button>`).join("")}</div>
    <div class="fshops">${items}</div>`, "shop");
  $$("#farmSheetIn [data-cat]").forEach(b => b.onclick = () => openFarmShop(b.dataset.cat));
  $$("#farmSheetIn [data-shop]").forEach(b => b.onclick = () => buyShopItem(FSHOP.find(x => x.id === b.dataset.shop)));
  $$("#farmSheetIn [data-deco]").forEach(b => b.onclick = () => {
    const k = b.dataset.deco, D = FDECO[k];
    if (S.money < D.price) return toast("Dafür fehlen " + eur(D.price - S.money) + ".", "warn");
    closeFarmSheet();
    startPlace({ proto: { t: "deco", k, arg: D.arg, r: 0 }, build: { t: "deco", k }, price: D.price, label: D.n });
  });
}
function buyShopItem(it, spot) {
  if (!it) return;
  const price = shopPrice(it);
  if (it.animal) { closeFarmSheet(); buyAnimalInto(it.animal); return; }
  if (S.money < price) { sfx("bad"); return toast("Dafür fehlen " + eur(price - S.money) + ".", "warn"); }
  closeFarmSheet();
  let proto, build;
  if (it.id === "field") { proto = { t: "field" }; build = { t: "field" }; }
  else if (it.tree) { proto = { t: "tree", kind: it.tree }; build = { t: "tree", kind: it.tree }; }
  else { proto = { t: it.id, lvl: 1, animals: [] }; build = { t: it.id }; }
  startPlace({ proto, build, price, label: it.n, again: it.id === "field" }, spot ? spot[0] : null, spot ? spot[1] : null);
}

/* Wohnhaus: Hof-Übersicht, Notizbuch, Gründen, Verkaufen */
function openFarmHouse() {
  FV.sheetFn = openFarmHouse;
  const F = S.farm, q = farmQuest(), val = farmValue();
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏡</span>Hof ${esc(S.player.company)}<small>Erbe von Opa Hinrich · Werder (Havel)</small></div>
    ${q ? `<div class="fquest-card${F.qdone ? " done" : ""}"><b>📒 Opas Notizbuch</b><span>${esc(q.t)}</span>
      <i><em style="width:${Math.round(F.qp / q.n * 100)}%"></em></i><small>${F.qp}/${q.n} · Belohnung ${eur(q.r.m)}${q.r.xp ? " + " + q.r.xp + " XP" : ""}</small>
      ${F.qdone ? `<button class="btn tiny" id="fhClaim">Abholen</button>` : ""}</div>` : ""}
    <div class="fstats">
      <div><b>${fmt(F.stats.harvest, 0)}</b><small>geerntet</small></div><div><b>${fmt(F.stats.made, 0)}</b><small>hergestellt</small></div>
      <div><b>${fmt(F.stats.eggs, 0)}</b><small>Eier</small></div><div><b>${fmt(F.stats.milk, 0)}</b><small>Milch</small></div>
      <div><b>${fmt(F.stats.deliv, 0)}</b><small>Lieferungen</small></div><div><b>${eur(F.stats.earned)}</b><small>Umsatz</small></div>
    </div>
    <div class="fval">Hofwert heute: <b>${eur(val)}</b></div>
    ${farmCanFound() ? `<button class="btn fgo" id="fhFound">🚚 Spedition gründen</button>` : F.logi ? "" : `<div class="fs-sub">Ab Level ${FLOGI_LEVEL} kannst du auch für andere fahren und eine richtige Spedition aufbauen.</div>`}
    ${F.logi ? `<div class="fsell-farm"><b>Hof verkaufen?</b><small>Du kannst den Hof behalten und jederzeit über „Hof“ besuchen – oder ihn verkaufen und mit dem Geld die Spedition ausbauen. Ein Verkauf ist endgültig.</small>
      <button class="btn ghost danger" id="fhSell">Für ${eur(val)} verkaufen</button></div>` : ""}
    <div class="fletter"><b>Opas Brief</b><p>„Mein liebes Enkelkind, der Hof gehört jetzt dir. Die Hühner wollen morgens ihr Futter, der Ofen braucht Geduld, und die Leute in Werder zahlen gut für ehrliche Ware. Lina hilft dir beim Ausliefern – sie kennt jede Abkürzung. Mach was draus. Dein Opa Hinrich“</p></div>
    <div class="fs-row"><button class="btn tiny ghost" id="fhSnd">${F.snd ? "🔊 Ton an" : "🔇 Ton aus"}</button><button class="btn tiny ghost" id="fhTut">🎓 Rundgang mit Lina</button></div>`, "house");
  const c = $("#fhClaim"); if (c) c.onclick = claimQuest;
  const fd = $("#fhFound"); if (fd) fd.onclick = askFound;
  const sl = $("#fhSell"); if (sl) sl.onclick = () => askConfirm("Hof verkaufen?", "Für " + eur(val) + " geht der Hof samt Tieren, Feldern und Lager an einen Nachbarn. Fahrzeuge und Spedition bleiben. Das lässt sich nicht rückgängig machen.", "Verkaufen", () => {
    const p = farmSellAll();
    if (p) { closeFarmSheet(); sfx("coin"); toast("🏡 Hof verkauft für " + eur(p) + ". Viel Erfolg mit der Spedition!", "ok"); showTab("map"); render(); }
  }, true);
  $("#fhSnd").onclick = () => { F.snd = !F.snd; openFarmHouse(); renderFarmUI(); };
  $("#fhTut").onclick = () => { closeFarmSheet(); S.farm.tut = { step: 0, done: false, replay: true }; farmTutShow(); };
}
/* Schuppen: Fahrzeuge am Hof */
function openFarmShed() {
  FV.sheetFn = openFarmShed;
  const here = S.fleet.filter(f => f.at === FARM_NODE);
  const away = S.fleet.filter(f => f.at !== FARM_NODE);
  const row = f => { const t = vType(f.type); return `<div class="fveh"><span>${t.icon}</span><b>${esc(t.name)}</b><small>${kgf(t.cap)} · ${t.speed} km/h · ${phaseLabel(f)}</small></div>`; };
  openFarmSheet(`<div class="fs-h"><span class="fs-ic">🛠️</span>Schuppen</div>
    ${here.length ? here.map(row).join("") : `<div class="fs-empty">Gerade steht kein Fahrzeug am Hof.</div>`}
    ${away.length ? `<div class="fs-sub">Unterwegs oder woanders geparkt:</div>` + away.map(row).join("") : ""}
    <div class="fs-row"><button class="btn tiny" id="fsFleet">🚚 Zum Fuhrpark</button><button class="btn tiny ghost" id="fsMkt">🏪 Fahrzeug kaufen</button></div>`, "shed");
  $("#fsFleet").onclick = () => { closeFarmSheet(); showTab("fleet"); };
  $("#fsMkt").onclick = () => { closeFarmSheet(); showTab("market"); };
}

/* --------------------------- Spedition gründen ------------------------ */
function askFound() {
  askConfirm("Spedition gründen?", "Ab jetzt kommen auch fremde Aufträge: Pakete, Paletten, Express – erst rund um Berlin, später weltweit. Der Hof läuft weiter und liefert wie bisher. Lina zeigt dir, wie Aufträge laufen.", "Gründen", () => {
    if (!farmFoundLogistics()) return;
    closeFarmSheet();
    sfx("level");
    renderFarmUI();
    toast("🚚 " + S.player.company + " fährt jetzt auch für andere!", "ok");
    showTab("map");
    if (map) map.setView(FARM_VIEW.center, 11);
    if (S.tut && !S.tut.done && typeof startTutorial === "function") setTimeout(startTutorial, 700);
  });
}

/* ------------------------------ Oberfläche ---------------------------- */
function renderFarmUI() {
  if (!farmOn() || !$("#farm")) return;
  const n = farmOrders().filter(farmOrderReady).length, all = farmOrders().length;
  const b = $("#fbOrdN");
  if (b) { b.textContent = n ? n + "✓" : all || ""; b.className = n ? "ok" : all ? "" : "zero"; }
  const sb = $("#fbSnd");
  if (sb) sb.firstElementChild.textContent = S.farm.snd ? "🔊" : "🔇";
  const st = $("#fbStore");
  if (st) {
    const full = farmStoreUsed("silo") >= farmStoreCap("silo") || farmStoreUsed("barn") >= farmStoreCap("barn");
    st.classList.toggle("warn", full);
  }
  renderFarmQuest();
  const fd = $("#farmFound");
  if (fd) {
    const can = farmCanFound() && S.farm.tut.done;
    if (can !== fd._can) {
      fd._can = can;
      fd.innerHTML = can ? `<button class="ffound" id="ffGo">🚚 Spedition gründen<small>Level ${FLOGI_LEVEL} geschafft – fahr auch für andere!</small></button>` : "";
      if (can) $("#ffGo").onclick = askFound;
    }
  }
  /* offenes Fenster nachführen – aber nie unter dem Finger */
  if (FV.sheet) {
    const now = performance.now();
    if ((!FV.sheetAt || now - FV.sheetAt > 1000) && !touchDown && now - touchUpAt > 700) { FV.sheetAt = now; refreshSheet(); }
  }
  $$("#farmSpeed [data-speed]").forEach(x => x.classList.toggle("on", +x.dataset.speed === S.speed));
}
function renderFarmQuest() {
  const el = $("#farmQuest");
  if (!el) return;
  const q = farmQuest();
  if (!q || !S.farm.tut.done) { el.innerHTML = ""; return; }
  const key = S.farm.qi + ":" + S.farm.qp + ":" + S.farm.qdone;
  if (el._k === key) return;
  el._k = key;
  el.innerHTML = `<button class="fq-card${S.farm.qdone ? " done" : ""}" id="fqCard"><span>📒</span><div><b>${esc(q.t)}</b>
    ${S.farm.qdone ? `<small>Geschafft! Tippen: ${eur(q.r.m)}${q.r.xp ? " + " + q.r.xp + " XP" : ""}</small>` : `<i><em style="width:${Math.round(S.farm.qp / q.n * 100)}%"></em></i><small>${S.farm.qp}/${q.n}</small>`}</div></button>`;
  $("#fqCard").onclick = () => { if (S.farm.qdone) claimQuest(); else openFarmHouse(); };
}
function claimQuest() {
  const card = $("#fqCard");
  const q = farmQuestClaim();
  if (!q) return;
  const fr = $("#farmFx").getBoundingClientRect();
  const r = card ? card.getBoundingClientRect() : { left: fr.left + 60, top: fr.top + 30, width: 0, height: 0 };
  coinFly(r.left - fr.left + r.width / 2, r.top - fr.top + r.height / 2, q.r.m);
  if (q.r.xp) xpFly(r.left - fr.left + r.width / 2, r.top - fr.top + 20, q.r.xp);
  sfx("level");
  save();
  renderFarmQuest();
  if (FV.sheet === "house") openFarmHouse();
}
function farmViewQuest() { if ($("#farmQuest")) { $("#farmQuest")._k = ""; renderFarmQuest(); } }
function farmViewFull(st) { const b = storeBtn(); if (b) { b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); } sfx("bad"); }

/* ------------------------------ Level-Feier ---------------------------- */
function farmLevelUp(l) {
  if (!farmOn() || activeTab !== "farm" || !$("#farmLvl")) return false;
  const list = FUNLOCK[l] || [];
  const el = $("#farmLvl");
  el.className = "on";
  el.innerHTML = `<div class="flv"><div class="flv-rays"></div><div class="flv-n">Level ${l}</div><div class="flv-t">Geschafft!</div>
    ${list.length ? `<div class="flv-u"><small>Neu freigeschaltet</small>${list.map(x => `<span>${esc(x)}</span>`).join("")}</div>` : `<div class="flv-u"><small>Mehr Felder und Bäume im Laden</small></div>`}
    <button class="btn" id="flvOk">Weiter</button></div>`;
  sfx("level");
  if (FV.R) {
    const c = FV.R.cam;
    for (let i = 0; i < 90; i++) FV.R.emit({ x: c.tx + (Math.random() - 0.5) * 10, y: 7 + Math.random() * 3, z: c.tz + (Math.random() - 0.5) * 10, vx: (Math.random() - 0.5) * 2, vy: -0.5, vz: (Math.random() - 0.5) * 2, g: -2.2, drag: 0.6, life: 3.2, size: 0.12, shape: 1, fade: false,
      col: [[0.95, 0.3, 0.35, 1], [0.3, 0.6, 0.95, 1], [0.98, 0.82, 0.25, 1], [0.35, 0.8, 0.45, 1]][i % 4] });
  }
  $("#flvOk").onclick = () => { el.className = ""; el.innerHTML = ""; renderFarmUI(); };
  return true;
}

/* -------------------------- Linas Rundgang ---------------------------- */
const FTUT = [
  { tx: () => `Moin, ${esc(S.player.name)}! Ich bin Lina. Ich hab deinem Opa jahrelang beim Ausliefern geholfen – und jetzt gehört der Hof dir. Komm, ich zeig dir alles.` },
  { tx: "Der Weizen ist reif! Tipp ein goldenes Feld an und <b>zieh die Sichel über alle reifen Felder</b>.", target: () => firstObj(o => o.t === "field" && fieldState(o) === "ripe"), wait: "harvestField", n: 3 },
  { tx: "Super Ernte! Die landet im Silo. Jetzt neu säen: <b>Tipp ein leeres Feld an und zieh den Weizen über die leeren Felder.</b>", target: () => firstObj(o => o.t === "field" && fieldState(o) === "empty"), wait: "plant", n: 2 },
  { tx: "Gießen macht schneller und bessere Ware. <b>Tipp ein frisch gesätes Feld an und gieß es.</b>", target: () => firstObj(o => o.t === "field" && fieldState(o) === "grow" && !o.w), wait: "water", n: 1 },
  { tx: "Opas Hühner haben gelegt! <b>Tipp den Hühnerstall an</b> – die Eier kommen in die Scheune.", target: () => firstObj(o => o.t === "coop"), wait: "collect:ei", n: 1 },
  { tx: "Jetzt haben sie Hunger. <b>Tipp den Stall an und zieh das Futter über die Hühner.</b> Je mehr Platz sie haben, desto besser die Eier.", target: () => firstObj(o => o.t === "coop"), wait: "feed", n: 1 },
  { tx: "Zeit zum Backen! <b>Tipp den Backofen an und leg ein Brot hinein.</b> Opa hat schon vorgeheizt.", target: () => firstObj(o => o.t === "bakery"), wait: "queue:brot", n: 1 },
  { tx: "Während das Brot backt: Die Äpfel sind reif. <b>Tipp einen Apfelbaum an.</b>", target: () => firstObj(o => o.t === "tree" && treeRipe(o)) || firstObj(o => o.t === "tree"), wait: "harvest:apfel", n: 1 },
  { tx: "Das Brot ist fertig – <b>tipp den Ofen an und hol es raus.</b>", target: () => firstObj(o => o.t === "bakery"), wait: "make:brot", n: 1 },
  { tx: "Die Bäckerei Hahn in Werder wartet auf Brot und Äpfel. <b>Tipp die Bestelltafel an und schick die Lieferung los.</b>", target: () => firstObj(o => o.t === "board"), wait: "send", n: 1, before: farmTutOrder },
  { tx: "Unterwegs! Auf der Karte siehst du die Fahrt, bei Ankunft gibt’s Geld und Erfahrung. Mehr Felder, Tiere und Gebäude findest du im 🛒 Laden, Aufgaben in Opas Notizbuch oben links. Ab Level 4 reden wir übers Fahren für andere. Viel Spaß!" }
];
function firstObj(fn) { return S.farm.objs.find(fn) || null; }
function farmTutOrder() {
  if (S.orders.some(o => o.tutF)) return;
  const o = farmOrderObj("w-werder", "Bäckerei Hahn", { brot: 1, apfel: 3 }, { tutF: true });
  if (o) { o.expire = S.time + 99999; o.deadline = S.time + 99999; S.orders.push(o); }
}
function farmTutShow() {
  const el = $("#farmTut");
  if (!el || !S.farm || !S.farm.tut || S.farm.tut.done) { if (el) { el.innerHTML = ""; el.className = ""; } FV.tutLock = false; return; }
  const T = S.farm.tut, st = FTUT[T.step];
  if (!st) return farmTutEnd();
  if (st.before && !T.replay) st.before();
  T.cnt = T.cnt || 0;
  /* Wiederholung: jeder Schritt hat „Weiter“, nichts muss erst wachsen */
  const wait = st.wait && !T.replay;
  const tx = typeof st.tx === "function" ? st.tx() : st.tx;
  const img = typeof guideArt !== "undefined" && guideArt ? `<img src="${guideArt}" alt="Lina">` : `<span class="ft-fb">👩‍🌾</span>`;
  el.className = "on" + (st.wait ? " wait" : "");
  if (!wait) el.classList.add("free");
  el.innerHTML = `<div class="ft-box"><div class="ft-fig">${img}</div><div class="ft-tx"><b>Lina</b><p>${tx}</p>
    ${wait ? `<small class="ft-step">${T.step}/${FTUT.length - 2}${st.n > 1 ? " · " + Math.min(T.cnt, st.n) + "/" + st.n : ""}</small>` : `<button class="btn tiny" id="ftNext">${T.step === FTUT.length - 1 ? "Los geht’s!" : "Weiter"}</button>`}
    ${T.step === 0 ? `<button class="ft-skip" id="ftSkip">Rundgang überspringen</button>` : ""}</div></div><div class="ft-hand" id="ftHand">👆</div>`;
  const nx = $("#ftNext"); if (nx) nx.onclick = () => farmTutNext();
  const sk = $("#ftSkip"); if (sk) sk.onclick = () => farmTutEnd(true);
  const tg = st.target && st.target();
  if (tg) farmFocus(tg, innerHeight > innerWidth ? 27 : 22);
}
function farmTutNext() {
  const T = S.farm.tut;
  T.step++; T.cnt = 0;
  sfx("pop");
  if (T.step >= FTUT.length) return farmTutEnd();
  save();
  farmTutShow();
}
function farmTutEnd(skip) {
  const T = S.farm.tut;
  T.done = true;
  if (skip) S.orders = S.orders.filter(o => !o.tutF || !o.farm);
  const el = $("#farmTut"); if (el) { el.innerHTML = ""; el.className = ""; }
  if (!T.replay) { S.farm.lastOrd = S.time - 999; farmSpawnOrders(2); }
  renderFarmUI();
  save();
}
/* Signale aus der Spiellogik */
function farmTutSignal(key, n) {
  if (!S.farm || !S.farm.tut || S.farm.tut.done) return;
  const T = S.farm.tut, st = FTUT[T.step];
  if (!st || !st.wait || T.replay) return;
  const k = key.split(":")[0];
  const match = st.wait === key || (st.wait === "plant" && k === "plant") || (st.wait === "feed" && k === "feed") || (st.wait === "harvestField" && key === "harvest:weizen");
  if (!match || T.adv) return;
  T.cnt = (T.cnt || 0) + (st.wait === "harvestField" ? 1 : n || 1);
  if (T.cnt >= (st.n || 1)) { T.adv = true; setTimeout(() => { T.adv = false; farmTutNext(); }, 650); }
  else farmTutShow();
}
/* Zeigefinger über dem Ziel */
function farmTutPoint() {
  const h = $("#ftHand");
  if (!h || !S.farm || !S.farm.tut || S.farm.tut.done) return;
  const st = FTUT[S.farm.tut.step];
  const o = st && st.target && st.target();
  if (!o || FV.sheet || !FV.R) { h.style.display = "none"; return; }
  const [cx, cz] = farmCenter(o);
  const p = FV.R.project(cx, objH(o) * 0.55, cz);
  if (!p) { h.style.display = "none"; return; }
  h.style.display = "";
  h.style.left = p[0] + "px"; h.style.top = p[1] + "px";
}

/* -------------------------- Ein- und Ausblenden ------------------------ */
function farmShow() {
  if (!farmOn()) return;
  farmDOM();
  document.body.classList.add("tab-farm");
  if (!farmInit3D()) { renderFarmUI(); return; }
  if (!FV.built) farmBuildScene();
  FV.on = true;
  FV.last = performance.now();
  requestAnimationFrame(farmLoop);
  renderFarmUI();
  farmTutShow();
}
function farmHide() {
  FV.on = false;
  closeFarmPop();
  if (FV.place) cancelPlace();
  document.body.classList.remove("tab-farm");
}
/* nach außen: Zustand geändert (Lieferung, Kauf aus anderem Reiter) */
function farmRefresh() { if (FV.on) { farmSyncScene(); renderFarmUI(); } }
