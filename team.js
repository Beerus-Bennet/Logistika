/* =========================================================================
   LOGISTIKA – team.js
   Personal je Station: Hof, Wald & Sägewerk, Fischerei. Wer eingestellt
   ist, erledigt dort die Arbeit von allein – langsamer als man selbst, aber
   ständig: ernten und nachsäen, füttern und einsammeln, Maschinen am Laufen
   halten, Bäume fällen, Reusen leeren, Bestellungen losschicken. Aufträge
   laufen als Kette weiter (Tierpfleger → Hofmeister → Landwirt, Fahrer →
   wer die Ware macht). Auf dem Hof sieht man die Leute hinlaufen und
   arbeiten; antippen zeigt ihren Auftrag.
   Logik (läuft auch, wenn man gerade nicht hinsieht) und Ansicht in einem.
   ========================================================================= */

/* ------------------------------- Stellen ---------------------------------- */
function staffDay() { return Math.floor(S.time / 1440); }
/* Wann kann man für eine Station Leute einstellen? Wenn die nächste Etappe offen ist */
function staffGroupOpen(g) {
  if (!S.farm) return false;
  if (g === "hof") return farmAreaOpen("wald");
  if (g === "holz") return farmAreaOpen("see");
  if (g === "see") return farmAreaOpen("see") && flv() >= 19;
  return false;
}
function staffRoleOpen(r) { const R = FSTAFF_ROLES[r]; return !!R && staffGroupOpen(R.g) && flv() >= R.lv; }
function staffRoles() { return Object.keys(FSTAFF_ROLES).filter(staffRoleOpen); }
/* Stellen insgesamt: je offener Aufgabe eine */
function staffSlots() { return staffRoles().length; }
function staffHas(role) { return (S.farm.staff || []).some(s => s.role === role); }
/* Bewerbungen: jeden Tag neu, je offener Aufgabe eine Person */
function staffCands() {
  const F = S.farm, roles = staffRoles().filter(r => !staffHas(r)), sig = staffDay() + ":" + roles.join(",");
  if (!F.cand || F.cand.sig !== sig) {
    const keep = F.cand && F.cand.day === staffDay() ? F.cand.list : [];
    const used = new Set([...F.staff.map(s => s.name), ...keep.map(c => c.name)]);
    const list = [];
    roles.forEach(r => {
      const old = keep.find(c => c.role === r);
      if (old) { list.push(old); return; }
      const R = FSTAFF_ROLES[r], tr = pick(FSTAFF_TRAITS);
      const free = FSTAFF_NAMES.filter(n => !used.has(n)), name = free.length ? pick(free) : pick(FSTAFF_NAMES);
      used.add(name);
      const wage = Math.round(R.wage[0] + (R.wage[1] - R.wage[0]) * ((tr.p - 8) / 10) + Math.random() * 4);
      list.push({ id: "c" + (S.seq++), role: r, name, perk: tr.p, trait: tr.t, wage, look: Math.floor(Math.random() * 1000) });
    });
    F.cand = { day: staffDay(), sig, list };
  }
  return F.cand.list.filter(c => !F.staff.some(s => s.id === c.id) && !staffHas(c.role));
}
function staffHire(cid) {
  const F = S.farm, c = (F.cand && F.cand.list || []).find(x => x.id === cid);
  if (!c) return false;
  if (!staffRoleOpen(c.role)) return toast("Für diese Station kannst du noch niemanden einstellen.", "warn"), false;
  if (staffHas(c.role)) return toast("Für diese Aufgabe hast du schon jemanden.", "warn"), false;
  const fee = c.wage * 2;
  if (S.money < fee) return toast("Für das Antrittsgeld fehlen " + eur(fee - S.money) + ".", "warn"), false;
  S.money -= fee; S.expense += fee;
  logMoney("farm", "Eingestellt: " + c.name + " (" + FSTAFF_ROLES[c.role].n + ")", -fee);
  const h = staffHome(c.role, F.staff.length);
  F.staff.push(Object.assign({}, c, { since: S.time, fed: true, work: S.time - 999, px: h[0], pz: h[1], doing: "fängt gerade an" }));
  farmXP(15);
  farmEvent("staff");
  return true;
}
function staffFire(id) { const F = S.farm; F.staff = F.staff.filter(s => s.id !== id); }
/* Bonus einer Rolle (0 … 0,18) – hungrig nur halb */
function staffPerk(role) {
  if (!S.farm || !S.farm.staff) return 0;
  let p = 0;
  S.farm.staff.forEach(s => { if (s.role === role && !s.away) p = Math.max(p, (s.perk / 100) * (s.fed === false ? 0.5 : 1)); });
  return p;
}
/* Einmal am Tag: Lohn und Verpflegung */
function staffDaily() {
  const F = S.farm;
  if (!F.staff.length) return;
  let pay = 0;
  F.staff.forEach(s => {
    pay += s.wage;
    const food = farmFoods().filter(id => FITEMS[id].k !== "fisch").reverse()[0];
    if (food) { farmTake(food, 1); s.fed = true; } else s.fed = false;
  });
  S.money -= pay; S.expense += pay;
  logMoney("farm", "Löhne Mitarbeiter", -pay);
  const hungry = F.staff.filter(s => !s.fed).length;
  if (hungry) toast("👷 " + hungry + " Mitarbeiter ohne Brotzeit – heute nur halb so fleißig.", "warn");
}

/* ------------------------------ Fortbildung ---------------------------------
   Kostet etwas, die Kraft ist einen Tag weg vom Hof und kommt mit +2 % zurück.
   Je Kraft höchstens alle zwei Wochen. */
const STAFF_TRAIN = { away: 1440, every: 20160, plus: 2, cap: 40 };
/* v57: Während der Fortbildung springt ein Freund / eine Freundin ein – gleiche Arbeit,
   gleicher Lohn (der Lohn läuft einfach weiter). Name und Aussehen stehen in s.away.sub. */
const STAFF_FRIENDS = [["Tom", "m"], ["Lena", "f"], ["Finn", "m"], ["Nele", "f"], ["Jannik", "m"], ["Merle", "f"], ["Bent", "m"], ["Frieda", "f"], ["Mats", "m"], ["Hanna", "f"], ["Lukas", "m"], ["Maja", "f"]];
function staffStandIn(s) { return s && s.away && s.away.sub ? s.away.sub : null; }
/* Name, wie er auf dem Hof gerade zu sehen ist */
function staffName(s) { const b = staffStandIn(s); return b ? b.name + " (für " + s.name + ")" : s.name; }
/* die eigene Kraft (ohne Vertretung) – für Bild und Name im Team-Fenster */
function staffSelf(s) { return s && s.away ? Object.assign({}, s, { away: null }) : s; }
function staffMakeSub(s) {
  const used = new Set((S.farm.staff || []).map(x => x.name)), free = STAFF_FRIENDS.filter(f => !used.has(f[0]));
  const f = (free.length ? free : STAFF_FRIENDS)[Math.floor(Math.random() * (free.length || STAFF_FRIENDS.length))];
  return { name: f[0], g: f[1], look: ((s.look || 0) + 211 + Math.floor(Math.random() * 300)) % 1000 };
}
function staffTrainCost(s) { return Math.round((150 + s.wage * 3) / 10) * 10; }
function staffTrainWait(s) { return Math.max(0, (s.trainT != null ? s.trainT : -1e9) + STAFF_TRAIN.every - S.time); }
function staffTrainOk(s) { return !s.away && !s.ride && staffTrainWait(s) <= 0 && (s.perk || 0) < STAFF_TRAIN.cap && S.money >= staffTrainCost(s); }
function staffTrain(id) {
  const s = (S.farm.staff || []).find(x => x.id === id);
  if (!s || !staffTrainOk(s)) return false;
  const c = staffTrainCost(s);
  S.money -= c; S.expense += c;
  logMoney("farm", "Fortbildung " + s.name, -c);
  s.away = { t0: S.time, until: S.time + STAFF_TRAIN.away, sub: staffMakeSub(s) };
  s.trainT = S.time; s.job = null;
  s.doing = "übernimmt die Arbeit";
  return s.away.sub;
}
/* Fortbildung läuft: die Vertretung arbeitet ganz normal weiter (true). Ist der Tag um,
   übergibt sie/er an Ort und Stelle wieder an die eigene Kraft. */
function staffAwayTick(s, i) {
  if (!s.away.sub) s.away.sub = staffMakeSub(s);        /* ältere Stände: jemand springt nachträglich ein */
  if (S.time < s.away.until) return true;
  const sub = s.away.sub;
  s.away = null;
  s.perk = Math.min(STAFF_TRAIN.cap, (s.perk || 0) + STAFF_TRAIN.plus);
  if (typeof toast === "function") toast("🎓 " + s.name + " ist zurück von der Fortbildung – jetzt +" + s.perk + " %. Danke, " + sub.name + "!", "ok");
  return true;
}
/* ------------------------- Fahrerin im Wagen -------------------------------
   Sie geht zum Fahrzeug, steigt ein und fährt die Lieferung selbst. Ist die
   Fahrt durch, kommt sie zu Fuß von der Straße zurück. */
function staffRideVeh(s) { return s.ride ? S.fleet.find(f => f.uid === s.ride.uid) : null; }
function staffRideGone(s) {
  if (!s.ride) return false;
  if (s.ride.gone) return true;
  const f = staffRideVeh(s);
  return !f || f.at !== FARM_NODE || !(f.phase === "reserved" || f.phase === "load" || f.phase === "idle");
}
function staffRideTick(s, i) {
  const f = staffRideVeh(s), el = S.time - s.ride.t0, gone = staffRideGone(s);
  const back = el > 480 || !f || (el > 3 && f.phase === "idle" && (!f.jobId || f.at !== FARM_NODE) && (gone || f.at === FARM_NODE));
  if (!back) { s.doing = gone ? "fährt die Lieferung" + (s.ride.to && N[s.ride.to] ? " nach " + N[s.ride.to].short : "") : "lädt mit ein und steigt gleich ein"; return false; }
  const was = gone;
  s.ride = null;
  if (was) { s.px = 5; s.pz = 18.6; s.jobEnd = S.time - 9; }
  s.work = -1e9;
  return true;
}
/* Platz am Fahrzeug: am Holzlaster im Sägewerk oder vorm Schuppen */
function staffVehSpot(f) {
  const o = f && f.type === "v-holzlaster" ? farmObj1("sw_lkw") : farmObj1("shed");
  if (!o) return null;
  const p = staffSpot(o, "fahrer");
  return [p.x, p.z, p.fx, p.fz];
}

/* ----------------------------- Arbeitsorte -------------------------------- */
const STAFF_HOME = {
  farmer: [-0.8, -4.2], pfleger: [2.4, 2.2], hofmeister: [-5.5, -0.5], fahrer: [2.3, 8.4],
  holzfaeller: [-33, -15], saeger: [-36.5, -39], mechaniker: [-38.5, -37.5],
  fischer: [-1.2, 26.2], fischwirt: [2.5, 22.2]
};
/* Platz, an dem jemand ohne Arbeit steht – nie in einem Gebäude oder Zaun */
function staffHome(role, i) {
  const h = STAFF_HOME[role] || [0, 0], x = h[0] + ((i || 0) % 2) * 0.7, z = h[1] + ((i || 0) % 3) * 0.5;
  if (typeof S === "undefined" || !S.farm || !S.farm.objs) return [x, z];
  const f = navFree(x, z, role === "farmer" ? "" : role, 6);
  return f[0] === x && f[1] === z ? [x, z] : [f[0], f[1]];
}
/* --------------------------------- Wege -------------------------------------
   Laufwege der Leute: ein Raster aus 1×1-Feldern über Hof, Wald, Sägewerk und
   Seeufer. Gebäude, Ställe, Bäume, Wasser und Zäune sind Hindernisse, Felder
   betritt nur der Landwirt; Wege und Straße laufen sich leichter. Durch Hofzaun
   und Sägewerkszaun geht es nur an den Toren. Gesucht wird mit A*. */
const NAV = { x0: -120, z0: -125, x1: 60, z1: 36, key: "", blk: null, cost: null, W: 0, H: 0 };
function navKey() {
  const F = S.farm;
  let h = farmHl() * 7 + Object.keys(F.areas || {}).length;   /* v70: Hofgröße aus der Ausbaustufe 1 … 10 */
  F.objs.forEach(o => { h = (h * 31 + o.x * 7 + o.z * 13 + (o.r ? 5 : 0) + o.t.length) % 1e9; });
  (F.trees || []).forEach(t => { if (t.st === "up" || t.st === "sapling") h = (h * 17 + t.id) % 1e9; });
  /* v109: Kulissenbäume, Büsche und der Hochsitz zählen mit – sie entstehen erst mit der Welt */
  const w = typeof WV !== "undefined" ? (WV.bgChunks ? WV.bgChunks.size : 0) + "/" + (WV.bushes ? WV.bushes.length : 0) + "/" + (WV.forest && WV.forest.items ? WV.forest.items.length : 0) : "";
  const hu = typeof HUNT !== "undefined" ? (HUNT.built() ? 2 : HUNT.unlocked() ? 1 : 0) : 0;
  return F.objs.length + ":" + h + ":" + w + ":" + hu + ":" + (typeof WV !== "undefined" && WV.rockObs ? WV.rockObs.length : 0);
}
function navIdx(x, z) { return (z - NAV.z0) * NAV.W + (x - NAV.x0); }
function navIn(x, z) { return x >= NAV.x0 && z >= NAV.z0 && x < NAV.x1 && z < NAV.z1; }
function navBuild() {
  const key = navKey();
  if (NAV.blk && NAV.key === key) return NAV;
  NAV.key = key;
  const W = NAV.W = NAV.x1 - NAV.x0, H = NAV.H = NAV.z1 - NAV.z0;
  const blk = NAV.blk = new Uint8Array(W * H), cost = NAV.cost = new Float32Array(W * H).fill(1);
  const P = FWORLD.pond, creeks = [FWORLD.creek].concat(typeof LAKE_CREEK !== "undefined" ? [LAKE_CREEK] : []);
  /* v109: über einen Bach nur über die Planken der Brücke (Länge ±3,3, Breite ±0,85 um die Mitte) */
  const decks = [{ x: FWORLD.bridge[0], z: FWORLD.bridge[1], ry: Math.PI / 2 }, { x: 52.6, z: 60.3, ry: Math.PI / 2 - Math.atan2(3, 9.5) }];
  const onDeck = (cx, cz) => decks.some(b => { const dx = cx - b.x, dz = cz - b.z, al = dx * Math.cos(b.ry) - dz * Math.sin(b.ry), ac = dx * Math.sin(b.ry) + dz * Math.cos(b.ry); return Math.abs(al) <= 3.3 && Math.abs(ac) <= 0.85; });
  const fK = typeof forestK === "function" ? forestK : () => 0;
  /* v75: Wege am See: Stich vom Südtor, Uferweg (Straße bei x = −31 bis Ostuferweg), Ostuferweg (Straße bei x = 40 bis zur Bank) */
  const lakePaths = typeof LAKE_WAY !== "undefined" ? [LAKE_STEM, LAKE_WAY, LAKE_EAST] : [[[5, 19.4], [5, 21.6], [-2, 22.2], [-20, 21.9]], [[5, 21.6], [14, 22.1], [26, 22.1], [38, 21.6]]];
  for (let z = NAV.z0; z < NAV.z1; z++) for (let x = NAV.x0; x < NAV.x1; x++) {
    const cx = x + 0.5, cz = z + 0.5, i = navIdx(x, z);
    if (Math.hypot(cx - P.x, cz - P.z) < P.r + 0.4 || inLake(cx, cz, 0.4)) { blk[i] = 1; continue; }
    if (creeks.some(c => distLine(cx, cz, c) < 1.5)) { if (onDeck(cx, cz)) { cost[i] = 0.45; continue; } blk[i] = 1; continue; }
    /* v109: Wege lohnen sich – quer durch den Wald ist teuer, über die Wiese etwas teurer, im Hof fast gleich */
    cost[i] = inHofMax(cx, cz, 0) ? 1.1 : fK(cx, cz) > 0.35 ? 2.6 : 1.4;
    /* Nachbars Felder: da läuft keiner durch */
    if (inFieldN(cx, cz)) { blk[i] = 1; continue; }
    if (Math.abs(cz - 18.5) < 1.6 && cx > -60 && cx < 60) cost[i] = 0.6;                                   /* Straße */
    if (nearPath(cx, cz) < 0.95 || lakePaths.some(l => distLine(cx, cz, l) < 0.85)) cost[i] = 0.45;     /* Waldwege, Uferweg */
  }
  /* Hofwege */
  (FSITE.path || FPATH).forEach(k => { if (k < 0) return; const t = fgXZ(k), x = t[0] - FG / 2, z = t[1] - FG / 2; if (navIn(x, z)) cost[navIdx(x, z)] = 0.45; });
  const B = farmHofB(), wz = Math.floor(FGATE.wz);
  for (let z = B.z1; z < 18; z++) for (let x = FGATE.x - 1; x < FGATE.x + 1; x++) if (navIn(x, z)) cost[navIdx(x, z)] = 0.45;   /* Weg vom Tor zur Straße */
  for (let x = -26; x < B.x0; x++) if (navIn(x, wz)) cost[navIdx(x, wz)] = 0.45;                                                    /* Westtor zum Wald */
  /* Gebäude, Ställe, Deko … (Felder: 2 – nur der Landwirt) */
  S.farm.objs.forEach(o => {
    const [w, d] = farmSize(o), x0 = o.x - FG / 2, z0 = o.z - FG / 2, v = o.t === "field" ? 2 : 1;
    /* v71: Dekowege sind kein Hindernis – man läuft am liebsten darauf */
    if (o.t === "deco" && FDECO[o.k] && FDECO[o.k].weg) { if (navIn(x0, z0)) cost[navIdx(x0, z0)] = 0.4; return; }
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (navIn(x0 + i, z0 + j)) blk[navIdx(x0 + i, z0 + j)] = v;
  });
  /* Bäume (auch Setzlinge) */
  (S.farm.trees || []).forEach(t => { if ((t.st === "up" || t.st === "sapling") && navIn(Math.floor(t.x), Math.floor(t.z))) blk[navIdx(Math.floor(t.x), Math.floor(t.z))] = 1; });
  /* v109: auch nicht durch Kulissenbäume, Büsche, Baumstümpfe, Totholz und den Hochsitz – aber nie auf einem Weg sperren */
  const stop = (x, z) => { const fx = Math.floor(x), fz = Math.floor(z); if (navIn(fx, fz)) { const k = navIdx(fx, fz); if (NAV.cost[k] > 0.5) blk[k] = 1; } };
  if (typeof WV !== "undefined") {
    if (WV.bgChunks) for (const c of WV.bgChunks.values()) c.trees.forEach(t => stop(t.fx != null ? t.fx : t.x, t.fzz != null ? t.fzz : t.z));
    (WV.bushes || []).forEach(b => { const p = b.position; if (!p || (b.r || 0) < 0.3) return; stop(p[0], p[2]); if (b.r > 0.75) { stop(p[0] + 0.6, p[2]); stop(p[0] - 0.6, p[2]); stop(p[0], p[2] + 0.6); stop(p[0], p[2] - 0.6); } });
    if (WV.forest && WV.forest.items) WV.forest.items.forEach(o => { if (o.k === "mosslog" || o.k === "stump" || o.k === "roots" || o.k === "stone") stop(o.x, o.z); });
    /* v146: Felsen im Wald (nicht durchlaufbar) – jeder Fels sperrt die Felder unter seinem Umfang */
    (WV.rockObs || []).forEach(r => { const rr = r[2] + 0.25; for (let dz = -rr; dz <= rr + 0.01; dz += 0.5) for (let dx = -rr; dx <= rr + 0.01; dx += 0.5) if (dx * dx + dz * dz <= rr * rr + 0.2) stop(r[0] + dx, r[1] + dz); });
  }
  if (typeof HUNT !== "undefined" && (HUNT.built() || HUNT.unlocked())) for (let dz = -1.2; dz <= 1.2; dz += 0.6) for (let dx = -1.2; dx <= 1.2; dx += 0.6) stop(HUNT.TW.x + dx, HUNT.TW.z + dz);
  /* v95: Lagerplatz (Feuer, Sofas, Wände) ist für die Wegsuche gesperrt – hinein führt nur CAMP.routeIn über das Tor */
  if (typeof CAMP !== "undefined" && CAMP.blockedW) for (let z = Math.floor(CAMP.CZ) - 14; z < CAMP.CZ + 14; z++) for (let x = Math.floor(CAMP.CX) - 14; x < CAMP.CX + 14; x++) if (navIn(x, z) && CAMP.blockedW(x + 0.5, z + 0.5)) blk[navIdx(x, z)] = 1;
  return NAV;
}
/* Zäune: [senkrecht?, Linie, von, bis, Lücke von, Lücke bis] – durch geht es nur in der Lücke (Tor) */
function navWalls() {
  const B = farmHofB(), W = FGATE.wz, G = FGATE.x, Y = FWORLD.yard, gx = (Y[0] + Y[2]) / 2, gz = (Y[1] + Y[3]) / 2;
  return [[1, B.x0, B.z0, B.z1, W - 1.2, W + 1.2], [1, B.x1, B.z0, B.z1, 0, 0], [0, B.z0, B.x0, B.x1, 0, 0], [0, B.z1, B.x0, B.x1, G - 2, G + 2],
    [1, Y[0], Y[1], Y[3], gz - 2, gz + 2], [1, Y[2], Y[1], Y[3], 0, 0], [0, Y[1], Y[0], Y[2], gx - 2, gx + 2], [0, Y[3], Y[0], Y[2], gx - 2, gx + 2]];
}
/* geht der Schritt von Feld a nach b (Nachbarn, gerade) durch einen Zaun? */
function navCross(ax, az, bx, bz, walls) {
  if (ax !== bx) {
    const lx = Math.max(ax, bx), c = az + 0.5;
    return walls.some(w => w[0] === 1 && w[1] === lx && c > w[2] && c < w[3] && !(c > w[4] && c < w[5]));
  }
  const lz = Math.max(az, bz), c = ax + 0.5;
  return walls.some(w => w[0] === 0 && w[1] === lz && c > w[2] && c < w[3] && !(c > w[4] && c < w[5]));
}
/* v146: Zäune je nach Wesen – Menschen nutzen die Tore, Wild (Hirsch, Reh, Fuchs …) kommt gar nicht durch, der Igel schlüpft unter allen Zäunen durch */
function navWallsFor(role) {
  if (role === "igel") return [];
  const w = navWalls();
  return role === "wild" ? w.map(q => [q[0], q[1], q[2], q[3], 0, 0]) : w;
}
/* liegt zwischen (x0,z0) und (x1,z1) ein Zaun? */
function navHit(x0, z0, x1, z1, walls) {
  for (const w of walls) {
    if (w[0] === 1) {
      if ((x0 - w[1]) * (x1 - w[1]) >= 0 || x0 === x1) continue;
      const z = z0 + (w[1] - x0) / (x1 - x0) * (z1 - z0);
      if (z > w[2] && z < w[3] && !(z > w[4] && z < w[5])) return true;
    } else {
      if ((z0 - w[1]) * (z1 - w[1]) >= 0 || z0 === z1) continue;
      const x = x0 + (w[1] - z0) / (z1 - z0) * (x1 - x0);
      if (x > w[2] && x < w[3] && !(x > w[4] && x < w[5])) return true;
    }
  }
  return false;
}
/* Zwischenspeicher für Abfragen jedes Bild (Falter): Raster und Zäune höchstens alle 1,5 s prüfen */
function navLive() {
  const t = performance.now();
  if (!NAV.blk || t - (NAV.chk || 0) > 1500) { navBuild(); NAV.chk = t; NAV.cw = navWallsFor("wild"); }
  return NAV;
}
function navBlockedAt(x, z) { navLive(); if (!navIn(Math.floor(x), Math.floor(z))) return false; return NAV.blk[navIdx(Math.floor(x), Math.floor(z))] > 0; }
function navStepBlocked(x0, z0, x1, z1) { navLive(); return navBlockedAt(x1, z1) || navHit(x0, z0, x1, z1, NAV.cw); }
/* auf welcher Seite der Hofzäune liegt ein Punkt (1 = im Hof, 2 = im Sägewerk)? Wild bleibt auf seiner Seite */
function navSide(x, z) {
  const B = farmHofB(), Y = FWORLD.yard;
  return (x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1 ? 1 : 0) | (x > Y[0] && x < Y[2] && z > Y[1] && z < Y[3] ? 2 : 0);
}
/* v146: Tiere laufen auf dem Wegenetz – m = { x, z }; wanderPlan sucht den Weg zum Ziel (auf freiem Feld in der Nähe),
   wanderMove geht ihn Stück für Stück ab. */
function wanderPlan(m, tx, tz, role, maxR) {
  navBuild();
  const f = navFree(tx, tz, role, maxR == null ? 4 : maxR);
  m.path = navPath(m.x, m.z, f[0], f[1], role); m.pi = 1;
  return !!m.path;
}
function wanderMove(m, step) {
  const P = m.path;
  if (!P) return { done: true, h: null };
  let h = null;
  while (step > 1e-6 && m.pi < P.length) {
    const t = P[m.pi], dx = t[0] - m.x, dz = t[1] - m.z, d = Math.hypot(dx, dz);
    if (d > 1e-6) h = Math.atan2(dx, dz);
    if (d <= step) { m.x = t[0]; m.z = t[1]; step -= d; m.pi++; }
    else { m.x += dx / d * step; m.z += dz / d * step; step = 0; }
  }
  if (m.pi >= P.length) { m.path = null; return { done: true, h }; }
  return { done: false, h };
}
function navOk(i, role, si, ti) { const b = NAV.blk[i]; return !b || i === si || i === ti || (b === 2 && role === "farmer"); }
/* A* vom Start zum Ziel – gibt die Wegpunkte zurück (oder null) */
function navPath(sx, sz, tx, tz, role) {
  navBuild();
  const ax = Math.floor(sx), az = Math.floor(sz), bx = Math.floor(tx), bz = Math.floor(tz);
  if (!navIn(ax, az) || !navIn(bx, bz)) return null;
  const si = navIdx(ax, az), ti = navIdx(bx, bz), W = NAV.W, N = NAV.W * NAV.H, walls = navWallsFor(role);
  if (si === ti) return [[sx, sz], [tx, tz]];
  const g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const heap = [], push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const h = (x, z) => { const dx = Math.abs(x - bx), dz = Math.abs(z - bz); return (Math.max(dx, dz) + 0.414 * Math.min(dx, dz)) * 0.4; };
  g[si] = 0; push(h(ax, az), si);
  let it = 0;
  while (heap.length && it++ < 300000) {
    const [, i] = pop();
    if (done[i]) continue;
    done[i] = 1;
    if (i === ti) break;
    const x = (i % W) + NAV.x0, z = Math.floor(i / W) + NAV.z0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const nx = x + dx, nz = z + dz;
      if (!navIn(nx, nz)) continue;
      const j = navIdx(nx, nz);
      if (done[j] || !navOk(j, role, si, ti)) continue;
      if (dx && dz) {
        /* schräg nur, wenn beide geraden Nachbarn frei sind und kein Zaun dazwischen */
        const a = navIdx(x + dx, z), b = navIdx(x, z + dz);
        if (!navOk(a, role, si, ti) || !navOk(b, role, si, ti)) continue;
        if (navCross(x, z, x + dx, z, walls) || navCross(x, z, x, z + dz, walls) || navCross(x + dx, z, nx, nz, walls) || navCross(x, z + dz, nx, nz, walls)) continue;
      } else if (navCross(x, z, nx, nz, walls)) continue;
      const c = (dx && dz ? 1.414 : 1) * NAV.cost[j] * (NAV.blk[j] === 2 ? 2.2 : 1);
      if (g[i] + c < g[j]) { g[j] = g[i] + c; from[j] = i; push(g[j] + h(nx, nz), j); }
    }
  }
  if (from[ti] < 0) return null;
  const cells = [];
  for (let k = ti; k >= 0 && k !== si; k = from[k]) cells.push(k);
  cells.reverse();
  /* Wegpunkte: Feldmitten, gerade Stücke zusammengefasst */
  const pts = [[sx, sz]];
  let pdx = 99, pdz = 99, px = ax, pz = az;
  cells.forEach((k, n) => {
    const x = (k % W) + NAV.x0, z = Math.floor(k / W) + NAV.z0, dx = x - px, dz = z - pz;
    if (n === cells.length - 1) { pts.push([tx, tz]); return; }
    if (dx === pdx && dz === pdz && pts.length > 1) pts[pts.length - 1] = [x + 0.5, z + 0.5]; else pts.push([x + 0.5, z + 0.5]);
    pdx = dx; pdz = dz; px = x; pz = z;
  });
  return pts;
}
function routeLen(r) { let l = 0; for (let i = 1; i < r.length; i++) l += Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); return l; }
/* v71: Laufzeit – Stücke auf Dekowegen zählen nur 70 % (dort ist man gut ein Drittel schneller) */
function staffWalkLen(r) {
  if (typeof farmWegAt !== "function") return routeLen(r);
  let l = 0;
  for (let i = 1; i < r.length; i++) {
    const a = r[i - 1], b = r[i], s = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(s / 0.5));
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
      l += s / n * (farmWegAt(Math.floor(x + FG / 2), Math.floor(z + FG / 2)) ? 0.7 : 1);
    }
  }
  return l;
}
function routeAt(r, d) {
  for (let i = 1; i < r.length; i++) {
    const l = Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]);
    if (d <= l || i === r.length - 1) { const f = l ? Math.min(1, d / l) : 1; return [r[i - 1][0] + (r[i][0] - r[i - 1][0]) * f, r[i - 1][1] + (r[i][1] - r[i - 1][1]) * f, Math.atan2(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1])]; }
    d -= l;
  }
  const e = r[r.length - 1]; return [e[0], e[1], 0];
}
/* freies Feld in der Nähe (für Startplätze und Arbeitsorte) */
function navFree(x, z, role, maxR) {
  navBuild();
  const fx = Math.floor(x), fz = Math.floor(z);
  for (let r = 0; r <= (maxR || 5); r++)
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      const nx = fx + dx, nz = fz + dz;
      if (navIn(nx, nz) && navOk(navIdx(nx, nz), role, -1, -1)) return [nx + 0.5, nz + 0.5];
    }
  return [x, z];
}
/* Arbeitsplatz an einem Objekt: vorn (Süden) in der Mitte, sonst seitlich – nie im Zaun
   oder im Gebäude; der Landwirt steht auf seinem Feld. Blick aufs Objekt. */
function staffSpot(o, role) {
  navBuild();
  const [cx, cz] = farmCenter(o), [w, d] = farmSize(o), x0 = o.x - FG / 2, z0 = o.z - FG / 2;
  if (o.t === "field" && role === "farmer") return { x: x0 + 0.5, z: z0 + d - 0.5, fx: cx, fz: cz };
  const order = n => { const out = [], m = Math.floor((n - 1) / 2); for (let k = 0; k < n; k++) out.push(m + (k % 2 ? -Math.ceil(k / 2) : Math.ceil(k / 2))); return out.filter(v => v >= 0 && v < n); };
  const cands = [];
  order(w).forEach(i => cands.push([x0 + i, z0 + d]));
  order(d).forEach(j => cands.push([x0 + w, z0 + j]));
  order(d).forEach(j => cands.push([x0 - 1, z0 + j]));
  order(w).forEach(i => cands.push([x0 + i, z0 - 1]));
  const ok = cands.find(([x, z]) => navIn(x, z) && navOk(navIdx(x, z), role, -1, -1));
  const c = ok || [x0 + Math.floor(w / 2), z0 + d];
  return { x: c[0] + 0.5, z: c[1] + 0.5, fx: cx, fz: cz };
}
/* direkt vor dem Baum (Kameraseite zuerst) */
function staffTreeSpot(t, role) {
  navBuild();
  const tx = Math.floor(t.x), tz = Math.floor(t.z);
  const c = [[1, 1], [1, 0], [0, 1], [-1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1]].map(([a, b]) => [tx + a, tz + b]).find(([x, z]) => navIn(x, z) && navOk(navIdx(x, z), role, -1, -1));
  const p = c ? [c[0] + 0.5, c[1] + 0.5] : [t.x + 0.75, t.z + 0.75];
  /* ein Stück zum Stamm hin, damit die Axt den Baum trifft */
  const dx = t.x - p[0], dz = t.z - p[1], l = Math.hypot(dx, dz) || 1;
  return { x: p[0] + dx / l * Math.max(0, l - 0.7), z: p[1] + dz / l * Math.max(0, l - 0.7), fx: t.x, fz: t.z };
}
const staffDist = (s, x, z) => Math.hypot((s.px == null ? x : s.px) - x, (s.pz == null ? z : s.pz) - z);
function staffGap(s) { const R = FSTAFF_ROLES[s.role]; return R.gap * (1 - (s.perk || 0) / 100) * (s.fed === false ? 2 : 1); }

/* ------------------------- Was gibt es zu tun? ---------------------------- */
/* Wie viel soll auf Lager sein? Offene Bestellungen + Futter für die Tiere + ein Grundstock */
function staffOrderNeed(id) {
  let need = 0;
  /* angenommene Bestellungen zählen voll, Angebote nur halb (sie können noch verfallen) */
  farmOrders().forEach(o => { if (o.farm && !o.farm.taken && o.farm.items[id]) need += o.farm.items[id] * (o.acc ? 1 : 0.5); });
  need = Math.ceil(need);
  return need;
}
/* Was ein Auftrag gerade braucht, bleibt für ihn liegen (Weizen fürs Hühnerfutter wird nicht zu Mehl) */
function staffReserve(id) {
  let r = staffOrderNeed(id);
  staffTaskList().forEach(T => { if (T.item === id && T.stock) r = Math.max(r, T.stock); });
  return r;
}
function staffWant(id) {
  const need = staffOrderNeed(id);
  if (FITEMS[id] && FITEMS[id].k === "feed") {
    let eat = 0;
    /* v61: Futter nur für Tierarten, die der Pfleger versorgen darf */
    S.farm.objs.forEach(o => { if (o.animals && o.animals.length) { const A = FANIMALS[penKind(o)]; if (A && A.feed === id && staffKindOn(penKind(o))) eat += o.animals.length; } });
    return need + eat * 2 + 2;
  }
  return need + 6;
}
/* v66: was noch in Warteschlangen steckt und später ins Lager kommt (Hauptware + Nebenprodukte) */
function staffPending(st, id) {   /* id: nur diese Ware */
  let n = 0;
  S.farm.objs.forEach(o => {
    if (!o.q) return;
    o.q.concat(o.done || []).forEach(j => {
      if (FITEMS[j.r] && FITEMS[j.r].st === st && !FITEMS[j.r].energy && (!id || j.r === id)) n += j.n;
      if (j.by) for (const b in j.by) if (FITEMS[b] && FITEMS[b].st === st && (!id || b === id)) n += j.by[b];
    });
  });
  return n;
}
/* v65: Passt das Ergebnis ins Lager? Zutaten aus demselben Lager machen beim Start Platz
   (Bretter → Paletten geht auch bei vollem Holzplatz) */
function staffRoomFor(r) {
  const st = FITEMS[r.id].st;
  let freed = 0;
  for (const id in r.in) if (FITEMS[id] && FITEMS[id].st === st) freed += r.in[id];
  return farmStoreCap(st) - farmStoreUsed(st) - staffPending(st) + freed >= r.out;
}
/* v65: Wie dringend? Was im Verhältnis zum Bedarf am wenigsten da ist, zuerst */
function staffRecipeScore(o, r) { return staffWant(r.id) - farmInv(r.id) - staffPending(FITEMS[r.id].st, r.id) + (o.lastR === rkey(r) ? 0.5 : 0); }   /* v66: auch was schon läuft */
/* Bestes Rezept für eine Maschine (ohne Auftrag): was am meisten fehlt, Zutaten da, Platz im Lager */
function staffPickRecipe(o, role) {   /* v61: role = wessen Freigaben gelten */
  const M = FMACHINES[o.t];
  /* v63: mit Freigaben gilt „freigegeben = bitte machen“ – solange Zutaten und Lagerplatz da sind,
     auch über den Grundstock hinaus (was am meisten fehlt, zuerst) */
  let best = null, bs = role && staffWlOn(role) ? -Infinity : 0;
  M.recipes.forEach(r => {
    if (r.lv > flv() || (role && !staffWlHas(role, r.id)) || !farmHasAll(r.in) || (r.cost && S.money < r.cost + 50)) return;
    /* was für Bestellungen und Aufträge gebraucht wird, bleibt liegen */
    if (Object.keys(r.in).some(id => farmInv(id) - r.in[id] < staffReserve(id))) return;
    if (FITEMS[r.id].energy) return;
    if (!staffRoomFor(r)) return;
    if (staffLimHit(r.id, staffPending(FITEMS[r.id].st, r.id))) return;          /* v138: deine Mengengrenze */
    const sc = staffRecipeScore(o, r);
    if (sc > bs) { bs = sc; best = r; }
  });
  return best;
}
/* „für den Sägebock“, „für das Kühlhaus“, „für die Räucherei“ */
function staffMachThe(t) {
  const n = FMACHINES[t].n, den = ["bakery", "saegebock", "kessel", "spalter", "f_markt"], das = ["f_lager", "f_kuehl"];
  return (den.includes(t) ? "den " : das.includes(t) ? "das " : "die ") + n;
}
function staffMachRole(o) { const M = FMACHINES[o.t]; return M.bert ? "bert" : M.fish ? "fischwirt" : (M.saw || o.t === "saegebock") ? "saeger" : "hofmeister"; }
function staffMachines(role, all) {   /* v137: all = auch deaktivierte Maschinen (für die Freigabe-Liste) */
  return S.farm.objs.filter(o => {
    const M = FMACHINES[o.t];
    if (!M || !o.q || M.trips || M.bert || (o.area && !farmAreaOpen(o.area)) || (o.off && !all)) return false;
    if ((M.saw || o.t === "saegebock") && !machReady(o)) return false;
    return staffMachRole(o) === role;
  });
}
/* Welche eigene Maschine macht diese Ware? (am liebsten eine, für die alles da ist) */
function staffRecipeFor(id, role) {
  let best = null;
  S.farm.objs.forEach(o => {
    const M = FMACHINES[o.t];
    if (!M || !o.q || M.trips || M.bert || (o.area && !farmAreaOpen(o.area)) || o.off) return;     /* v137: deaktiviert – Arbeiter lassen sie in Ruhe */
    if ((M.saw || o.t === "saegebock") && !machReady(o)) return;
    const mr = staffMachRole(o);
    if (role && mr !== role) return;
    M.recipes.forEach(r => {
      if (r.id !== id || r.lv > flv() || FITEMS[r.id].energy) return;
      const ok = farmHasAll(r.in);
      if (!best || (ok && !best.ok)) best = { o, r, ok, role: mr };
    });
  });
  return best;
}
/* Wer macht diese Ware? Feld/Obst → Landwirt, Tiere → Tierpfleger, Maschine → wer sie betreut,
   Stämme und Äste → Holzfäller, Fisch → Fischer. null: das kann keiner (nur du). */
function staffMaker(id) {
  if (FCROPS[id] || FTREES[id]) return { role: "farmer" };
  for (const k in FANIMALS) if (FANIMALS[k].out === id) return { role: "pfleger", kind: k };
  if (id === "aeste" || Object.keys(FSPECIES).some(sp => FSPECIES[sp].log === id)) return { role: "holzfaeller" };
  const m = staffRecipeFor(id);
  if (m) return { role: m.role };
  /* v58: jede Fischart irgendeines Fanggrunds und die Reusentiere – nicht die Köder (auch Lager „fisch“) */
  if (typeof FGROUNDS !== "undefined" && FGROUNDS.some(g => g.fish[id])) return { role: "fischer" };
  if (typeof FPOTS !== "undefined" && FPOTS[id]) return { role: "fischer" };
  return null;
}

/* ------------------------------- Aufträge ----------------------------------
   Jede Kraft hat eine kleine Auftragsliste. Aufträge kommen von dir (Kraft
   antippen → „Auftrag geben“), vom Kollegen (Tierpfleger braucht Futter →
   Hofmeister; dem fehlt Weizen → Landwirt) oder vom Fahrer (der Bestellung
   fehlt Ware). Ein Auftrag heißt: von Ware X n Stück machen – oder bis so viel
   im Lager liegt, wie der Auftraggeber braucht. Fehlt dafür etwas, geht ein
   Unterauftrag an den, der es macht; gibt es dafür niemanden, landet er bei dir.
   Ein hängender Auftrag hält niemanden auf: dann wird erst einmal anderes
   erledigt, und nach einer Weile ohne Fortschritt verfällt er.             */
function staffTaskList() { const F = S.farm; return (F && (F.tasks || (F.tasks = []))) || []; }
function staffTasksOf(role) {
  /* Bestellungen: die lukrativste zuerst */
  const pay = T => { if (!T.item.startsWith("order:")) return 0; const o = S.orders.find(x => x.id === T.item.slice(6)); return o ? o.pay + (o.fav ? 1e6 : 0) : 0; };
  return staffTaskList().filter(T => T.role === role).sort((a, b) => (b.prio - a.prio) || (pay(b) - pay(a)) || (a.t0 - b.t0));
}
function staffOf(role) { return (S.farm.staff || []).find(s => s.role === role) || null; }
function staffItemName(item, n) {
  if (item.startsWith("ani:")) { const A = FANIMALS[item.slice(4)]; return A ? (A.young || A.n) + " kaufen" : item; }
  if (item.startsWith("order:")) { const o = S.orders.find(x => x.id === item.slice(6)); return "Lieferung " + (o ? o.shipper : ""); }
  const it = FITEMS[item];
  return it ? ((n === 1 && it.sg) || it.n) : item;
}
/* gleich fertig gerendert (die Blase soll beim Öffnen nicht mehr umspringen) */
function staffItemIcNow(item) {
  if (item.startsWith("order:")) return `<span class="ic">📋</span>`;
  if (item.startsWith("ani:")) { const u = typeof aniHTML === "function" ? aniHTML(item.slice(4)) : ""; return `<span class="ic${/<img/.test(u) ? " th" : ""}">${u || "🐾"}</span>`; }
  const u = typeof itemImg === "function" ? itemImg(item) : null;
  return u ? `<span class="ic th"><img src="${u}" alt=""></span>` : `<span class="ic">${FITEMS[item] ? FITEMS[item].i : "📦"}</span>`;
}
function staffIcNow(s) {
  const u = typeof thumbOf === "function" && typeof FWM !== "undefined" && !THUMB.failed ? thumbOf("staff:" + staffKey(s), () => staffModel(s)) : null;
  return u ? `<span class="ic th"><img src="${u}" alt=""></span>` : `<span class="fst-emo">${FSTAFF_ROLES[s.role].i}</span>`;
}
function staffItemIc(item) {
  if (item.startsWith("ani:")) return typeof aniIc === "function" ? aniIc(item.slice(4)) : `<span class="ic">${(FANIMALS[item.slice(4)] || {}).i || "🐾"}</span>`;
  if (item.startsWith("order:")) return `<span class="ic">📋</span>`;
  return typeof icOf === "function" ? icOf(item) : `<span class="ic">${FITEMS[item] ? FITEMS[item].i : "📦"}</span>`;
}
function staffTaskDone(T) {
  if (T.item.startsWith("order:")) { const o = S.orders.find(x => x.id === T.item.slice(6)); return !o || !o.farm || o.farm.taken; }
  if (T.made >= T.n) return true;
  return T.stock != null && !T.item.startsWith("ani:") && farmInv(T.item) >= T.stock;
}
/* neuer Auftrag – oder der vorhandene für dieselbe Ware wird aufgestockt */
function staffEnsureTask(o) {
  const F = S.farm, list = staffTaskList();
  let role = o.role;
  if (role !== "chef" && (!role || !staffHas(role))) role = "chef";
  const key = role + ":" + o.item;
  F.taskMute = F.taskMute || {};
  if (o.from !== "chef" && F.taskMute[key] > S.time) return null;
  if (o.parent) {
    /* keine Schleifen: dieselbe Ware nicht noch einmal weiter oben in der Kette */
    let p = list.find(x => x.id === o.parent), depth = 0;
    while (p) { if (p.item === o.item) return null; depth++; p = list.find(x => x.id === p.parent); }
    if (depth >= 4) return null;
  }
  const ex = list.find(T => T.role === role && T.item === o.item);
  if (ex) {
    /* hatte sich die Kraft das selbst vorgenommen, zählt jetzt der Kollege (oder du) als Auftraggeber */
    if (ex.from === ex.role && o.from !== ex.role) Object.assign(ex, { from: o.from, fromId: o.fromId || null, note: o.note || ex.note, parent: o.parent || null, why: o.why || ex.why });
    if (o.stock) ex.stock = Math.max(ex.stock || 0, o.stock);
    if (o.from === "chef") { ex.n += o.n; ex.prio = Math.max(ex.prio || 0, 2); }
    else ex.n = Math.max(ex.n, ex.made + o.n);
    if (o.prio) ex.prio = Math.max(ex.prio || 0, o.prio);
    return ex;
  }
  if (list.filter(T => T.role === role).length >= (o.prio === 3 ? 9 : 6)) return null;
  const T = { id: "T" + (S.seq++), role, item: o.item, n: Math.max(1, Math.round(o.n || 1)), made: 0, stock: o.stock || null,
    from: o.from, fromId: o.fromId || null, note: o.note || "", why: o.why || "", parent: o.parent || null, t0: S.time, tp: S.time, prio: o.prio || (o.from === "chef" ? 2 : 1), wait: "" };
  list.push(T);
  if (role === "chef") staffChefNote(T);
  return T;
}
/* Auftrag weg (mit allen Unteraufträgen). Von dir gelöscht: kommt eine Weile nicht wieder */
function staffTaskDel(id, byChef) {
  const F = S.farm, list = staffTaskList(), T = list.find(x => x.id === id);
  if (!T) return false;
  const gone = new Set([id]);
  let grew = true;
  while (grew) { grew = false; list.forEach(x => { if (x.parent && gone.has(x.parent) && !gone.has(x.id)) { gone.add(x.id); grew = true; } }); }
  F.tasks = list.filter(x => !gone.has(x.id));
  if (byChef && T.from !== "chef") { F.taskMute = F.taskMute || {}; F.taskMute[T.role + ":" + T.item] = S.time + 180; }
  return true;
}
/* Fortschritt: was eine Kraft gemacht hat, zählt für ihre Aufträge */
function staffCredit(role, id, n) {
  staffTaskList().forEach(T => { if (T.role === role && T.item === id) { T.made += n; T.tp = S.time; } });
}
/* Du gibst einen Auftrag */
function staffAssign(role, item) {
  const n = staffDefaultN(item);
  const T = staffEnsureTask({ role, item, n, from: "chef" });
  if (T) { T.tp = S.time; const s = staffOf(role); if (s && !s.job) s.work = -999; }
  return T;
}
function staffDefaultN(item) {
  if (item.startsWith("ani:") || item.startsWith("order:")) return 1;
  if (FCROPS[item] || FTREES[item]) return 6;
  for (const k in FANIMALS) if (FANIMALS[k].out === item) return FANIMALS[k].mast ? FANIMALS[k].yield : 3;
  const m = staffRecipeFor(item);
  if (m) return m.r.out * 2;
  if (FITEMS[item] && FITEMS[item].st === "fisch") return 3;
  return 4;
}
/* Was kann man einer Kraft auftragen? */
function staffOptions(role) {
  const F = S.farm, out = [];
  const add = (item, lock) => { if (!out.some(x => x.item === item)) out.push({ item, lock: !!lock }); };
  if (role === "farmer") {
    Object.keys(FCROPS).forEach(c => add(c, !farmCropOk(c)));
    F.objs.filter(o => o.t === "tree").forEach(o => add(o.kind));
  } else if (role === "pfleger") {
    F.objs.filter(o => FPENS[o.t]).forEach(o => { const k = penKind(o), A = FANIMALS[k]; if (!A || A.fish) return; if (o.animals.length) add(A.out); add("ani:" + k, o.animals.length >= A.max); });
  } else if (role === "hofmeister" || role === "saeger" || role === "fischwirt") {
    staffMachines(role, true).forEach(o => FMACHINES[o.t].recipes.forEach(r => { if (!FITEMS[r.id].energy) add(r.id, r.lv > flv()); }));
  } else if (role === "holzfaeller") {
    const T0 = F.tools || {};
    ["birke", "kiefer", "fichte", "buche", "kirsche"].forEach(sp => { if (FSPECIES[sp]) add(FSPECIES[sp].log); });
    if ((T0.axe || 1) >= 2) add(FSPECIES.eiche.log);
    add("aeste");
  } else if (role === "fischer") {
    /* v58: alle Arten aller Fanggründe (gesperrt, wenn das Boot fehlt) und die Reusentiere –
       vorher landete die Listenposition von forEach als „gesperrt“ in add() */
    if (typeof FGROUNDS !== "undefined") {
      const ids = [...new Set(FGROUNDS.flatMap(g => Object.keys(g.fish)))];
      ids.forEach(id => add(id, !FGROUNDS.some(g => g.fish[id] && farmGroundOk(g))));
    }
    if (typeof FPOTS !== "undefined") Object.keys(FPOTS).forEach(k => add(k, !(farmPotOk(k) && staffPotsOn())));
  } else if (role === "fahrer") {
    farmOrders().filter(o => !o.farm.taken).sort((a, b) => (!!b.fav - !!a.fav) || (!!b.acc - !!a.acc) || b.pay - a.pay).forEach(o => add("order:" + o.id));
  }
  return out.filter(x => x.item.startsWith("order:") || x.item.startsWith("ani:") || FITEMS[x.item]);
}
/* ------------------------------ v61: Freigaben ------------------------------
   Statt einzelner Aufträge legst du je Beruf fest, was die Kraft machen darf. Gilt für den
   eigenen Plan und für Aufträge der Kollegen. Gespeichert je Beruf in S.farm.wl[role] – nur die
   abgeschalteten Einträge (id: false), alles andere ist an (auch neu Verfügbares).
   Fahrer/in: Modus S.farm.fahrMode = "all" | "ready" | "abo". Fischer/in und Mechaniker/in: keine Freigaben. */
const STAFF_WL = ["farmer", "pfleger", "hofmeister", "holzfaeller", "saeger", "fischwirt", "fischer"];   /* v64: Fischer = Köder */
const STAFF_FAHR = { all: "Alle Aufträge", ready: "Nur lieferbare", abo: "Nur Daueraufträge" };
function staffWlOn(role) { return STAFF_WL.includes(role); }
function staffWl(role) { const F = S.farm; F.wl = F.wl || {}; return F.wl[role] || (F.wl[role] = {}); }
function staffWlHas(role, id) { return !staffWlOn(role) || staffWl(role)[id] !== false; }
function staffWlSet(role, id, on) { const W = staffWl(role); if (on) delete W[id]; else W[id] = false; }
/* v138: Mengengrenze je Ware (Landwirt/in, Sägewerker/in): Kachel gedrückt halten → Schieber. Gespeichert in Gebinden
   (S.farm.lim[id], fehlt = keine Grenze). Ist sie erreicht (Lager + was schon wächst bzw. in der Maschine läuft), wird
   nichts mehr gesät, geerntet, gepflückt oder ohne Auftrag produziert. Aufträge für Bestellungen gehen weiter. */
/* v142: alle Berufe mit Freigaben außer Tierpfleger/in (dort ergibt es keinen Sinn); Fahrer/in und Mechaniker/in haben keine.
   Grenze jetzt in der Anzeige-Einheit (S.farm.limU: Stück, kg, l …) – jede Zahl einstellbar, z. B. 68 Paletten.
   Die Grenze deckelt nur das Herstellen – nutzen dürfen die Ware alle (v143: kein Vorrat für den Fischer). */
const STAFF_LIM = ["farmer", "saeger", "hofmeister", "holzfaeller", "fischwirt"];   /* v143: Fischer/in nicht – die Grenze deckelt nur das Herstellen, nutzen dürfen alle */
function staffLimU(id) {
  const F = S.farm;
  if (F.lim && !F.limV2) {                        /* v138 speicherte in Gebinden – einmal umrechnen */
    F.limU = F.limU || {};
    for (const k in F.lim) if (FITEMS[k] && F.lim[k] > 0) F.limU[k] = F.lim[k] * (FITEMS[k].a || 1);
    delete F.lim; F.limV2 = 1;
  }
  if (F.limU && !F.limV3) { for (const k in F.limU) if (k.startsWith("f:")) delete F.limU[k]; F.limV3 = 1;    /* v143: Fischer-Vorrat (v142) entfernt */
  }
  const L = F.limU; return L && L[id] > 0 ? L[id] : 0;
}
const limIt = key => FITEMS[key];
function staffLim(id) { const u = staffLimU(id); return u ? u / (limIt(id).a || 1) : 0; }       /* in Gebinden (fürs Vergleichen) */
function staffLimSet(id, u) { const F = S.farm; staffLimU(id); F.limU = F.limU || {}; F.limV2 = 1; u = Math.round(u); if (u > 0) F.limU[id] = u; else delete F.limU[id]; }
function staffLimHit(id, extra) { const l = staffLim(id); return l > 0 && farmInv(id) + (extra || 0) >= l - 1e-9; }
/* was auf den Feldern schon wächst (je Feld 2 Gebinde) */
function staffGrowing(c) { return S.farm.objs.filter(o => o.t === "field" && o.crop === c).length * 2; }
/* Schieber: 0 … Lagerplatz dieser Ware (mindestens 100), jede Einheit einzeln */
function staffLimMax(id) { const it = limIt(id), a = it.a || 1; let cap = 0; try { cap = it.st ? farmStoreCap(it.st) * a : 0; } catch (e) { cap = 0; } return Math.max(100, Math.round(cap), staffLimU(id)); }
/* Schlüssel der Grenze je Kachel (= Ware) */
const limKey = (role, id) => id;
function staffLimTxt(key, u, fish) { const it = limIt(key); return u ? (fish ? "behält " : "bis ") + famt(key.replace(/^f:/, ""), u / (it.a || 1)) : (fish ? "kein Vorrat" : "keine Grenze"); }
function staffFahrMode() { return STAFF_FAHR[S.farm.fahrMode] ? S.farm.fahrMode : "all"; }
/* Darf der Fahrer diese Bestellung bedienen? (B: nur fertige – das prüft der Aufrufer zusätzlich) */
function staffFahrOk(o) { return staffFahrMode() !== "abo" || !!o.abo; }
/* Tierarten zu einem Produkt – zentral aus FANIMALS */
function staffKindsOf(product) { return Object.keys(FANIMALS).filter(k => FANIMALS[k].out === product && !FANIMALS[k].fish); }
function staffKindOn(kind) { const A = FANIMALS[kind]; return !!A && staffWlHas("pfleger", A.out); }
/* Alle Einträge eines Berufs aus den Daten (nicht aus dem, was gerade auf dem Hof steht) */
function staffWlAll(role) {
  const uniq = a => [...new Set(a)];
  if (role === "farmer") return Object.keys(FCROPS).concat(Object.keys(FTREES));
  if (role === "pfleger") return uniq(Object.keys(FANIMALS).filter(k => !FANIMALS[k].fish).map(k => FANIMALS[k].out));
  if (role === "holzfaeller") return uniq(Object.keys(FSPECIES).map(sp => FSPECIES[sp].log));
  /* v64: Fischer/in – welche Köder; „Reusenköder“ schaltet das Beködern der Reusen */
  if (role === "fischer") return ["mais", "wurm", "profikoeder"].concat(Object.keys(FSPEC_BAIT).map(k => "sk_" + k), ["koeder"]);
  const out = [];
  for (const t in FMACHINES) {
    const M = FMACHINES[t];
    if (M.trips || M.bert || staffMachRole({ t }) !== role) continue;
    M.recipes.forEach(r => { if (FITEMS[r.id] && !FITEMS[r.id].energy) out.push(r.id); });
  }
  return uniq(out);
}
/* Warum (noch) nicht? Leer = verfügbar. ctx wird je Zeichnen einmal berechnet. */
function staffWlCtx(role) {
  const F = S.farm, c = { logs: new Set(), mach: new Set() };
  if (role === "holzfaeller") (F.trees || []).forEach(t => { if (t.st === "up" && treeOpen(t)) c.logs.add(FSPECIES[t.sp].log); });
  else F.objs.forEach(o => { if (FMACHINES[o.t] && o.q && (!o.area || farmAreaOpen(o.area)) && machReady(o)) c.mach.add(o.t); });
  return c;
}
function staffWlLock(role, id, c) {
  const F = S.farm;
  if (role === "farmer") {
    if (FCROPS[id]) return farmCropOk(id) ? "" : "ab Level " + FCROPS[id].lv;
    return F.objs.some(o => o.t === "tree" && o.kind === id) ? "" : "kein Baum";
  }
  if (role === "pfleger") {
    const ks = staffKindsOf(id);
    if (ks.every(k => FANIMALS[k].lv > flv())) return "ab Level " + Math.min(...ks.map(k => FANIMALS[k].lv));
    return ks.some(k => F.objs.some(o => o.t === FANIMALS[k].house)) ? "" : "kein Stall";
  }
  if (role === "fischer") {
    const U = angelS(), B = FBAITS[id];
    if (!U) return "erst den Steg bauen";
    if (id === "koeder") return F.objs.some(o => o.t === "pot") ? "" : "keine Reuse";
    if (!B) return "";
    if (B.tour && !U.tour.done) return "nach dem Turnier";
    if (B.spec && !specDone(B.spec)) return "erst bei Bert entwickeln";
    if (B.rod && U.rod < B.rod) return "braucht die " + FRODS[B.rod].n;
    return "";
  }
  if (role === "holzfaeller") {
    if (id === FSPECIES.eiche.log && ((F.tools || {}).axe || 1) < 2) return "braucht Stahlaxt";
    return c.logs.has(id) ? "" : "kein Baum erreichbar";
  }
  let lv = 99, built = false;
  for (const t in FMACHINES) {
    const M = FMACHINES[t];
    if (M.trips || M.bert || staffMachRole({ t }) !== role) continue;
    const r = M.recipes.find(x => x.id === id);
    if (!r) continue;
    lv = Math.min(lv, r.lv || 1);
    if (c.mach.has(t)) built = true;
  }
  return lv > flv() ? "ab Level " + lv : built ? "" : "Maschine fehlt";
}
/* Laden: deine alten Einzelaufträge an Berufe mit Freigaben verschwinden (es gibt keinen Knopf mehr dafür) */
function staffWlInit(F) {
  if ((F.wlV || 0) >= 2) return;   /* v64: 2 = auch die Fischer-Aufträge */
  F.wlV = 2;
  F.tasks = (F.tasks || []).filter(T => !(T.from === "chef" && (staffWlOn(T.role) || T.role === "fahrer")));
}
/* Für dich: Lina sagt Bescheid, wenn die Kette an etwas hängt, das keiner macht */
function staffChefNote(T) {
  const F = S.farm;
  F.taskNote = F.taskNote || {};
  const day = staffDay();
  if (F.taskNote[T.item] === day || typeof phoneMsg !== "function") return;
  F.taskNote[T.item] = day;
  phoneMsg({ from: "Lina Sturm", kind: "info", title: "Es fehlt: " + staffItemName(T.item),
    body: "Chef, " + (T.note ? T.note + " " : "") + "fehlt " + staffItemName(T.item) + " – " + (T.why || "das macht bei uns niemand") + ". Steht im Haus unter „Team“ bei „Für dich“." });
}
/* Unterauftrag: wer macht die fehlende Ware? */
function staffSub(T, s, item, n, stock) {
  const mk = staffMaker(item);
  let why = "";
  if (!mk) why = "das macht bei uns niemand";
  else if (!staffHas(mk.role)) why = "dafür fehlt noch " + FSTAFF_ROLES[mk.role].n;
  return staffEnsureTask({ role: mk ? mk.role : "chef", item, n, stock, from: s.role, fromId: s.id, parent: T.id, note: "für " + staffItemName(T.item), why });
}
/* Aufräumen und Bedarf melden – alle paar Spielminuten */
function staffFavPlan() {
  const F = S.farm, fa = staffOf("fahrer"), mode = fa ? staffFahrMode() : null;
  const favs = farmOrders().filter(o => o.fav && !o.farm.taken);
  /* Fahrer/in nimmt Favoriten sofort an (ohne Limit) und plant sie ein */
  if (fa && mode === "all") favs.filter(o => !o.acc && farmOrderAreaOn(farmOrderArea(o)) && Object.keys(o.farm.items).every(id => farmCanMake(id) || farmInv(id) >= o.farm.items[id]))
    .forEach(o => { if (farmAcceptOrder(o, "fahrer") && typeof toast === "function") toast("⭐ " + staffName(fa) + " hat den Favoriten von " + o.shipper + " sofort angenommen.", "ok", true); });
  favs.filter(o => o.acc).forEach(o => {
    if (fa && mode !== "ready" && staffFahrOk(o)) { staffEnsureTask({ role: "fahrer", item: "order:" + o.id, n: 1, from: "order", fromId: o.id, note: o.shipper, prio: 3 }); return; }
    /* ohne Fahrer/in: dem, der es macht (sonst dir), direkt auftragen */
    if (farmOrderReady(o)) return;
    Object.keys(o.farm.items).forEach(id => {
      const miss = o.farm.items[id] - farmInv(id); if (miss <= 0) return;
      const mk = staffMaker(id);
      staffEnsureTask({ role: mk ? mk.role : "chef", item: id, n: miss, stock: o.farm.items[id], from: "order", fromId: o.id, note: "Favorit " + o.shipper, prio: 3 });
    });
  });
  /* Priorität nach unten weitergeben: Unteraufträge eines Favoriten sind genauso dringend */
  const list = staffTaskList();
  list.forEach(T => { if (T.item.startsWith("order:")) { const o = S.orders.find(x => x.id === T.item.slice(6)); if (o && o.fav) T.prio = 3; } });
  for (let k = 0; k < 5; k++) { let ch = false; list.forEach(T => { if (!T.parent) return; const p = list.find(x => x.id === T.parent); if (p && (p.prio || 0) === 3 && (T.prio || 0) < 3) { T.prio = 3; ch = true; } }); if (!ch) break; }
}
function staffPlan() {
  const F = S.farm, list = staffTaskList();
  /* fertig, verfallen, Kraft entlassen */
  F.tasks = list.filter(T => {
    if (staffTaskDone(T)) { const s = staffOf(T.role); if (s) { s.doneT = (s.doneT || []).slice(-2).concat(staffItemName(T.item)); } return false; }
    /* Fortschritt zählt auch: Frucht wächst, Maschine läuft, ein Unterauftrag kommt voran */
    let last = Math.max(T.tp || T.t0, T.alive || 0);
    list.forEach(c => { if (c.parent === T.id) last = Math.max(last, c.tp || c.t0, c.alive || 0); });
    const idle = S.time - last;
    if (T.role === "chef" ? S.time - T.t0 > 1440 : idle > (T.prio >= 2 ? 2880 : 720)) return false;
    return true;
  });
  F.tasks.forEach(T => { if (T.role !== "chef" && !staffHas(T.role)) T.role = "chef"; });
  const ids = new Set(F.tasks.map(T => T.id));
  F.tasks = F.tasks.filter(T => !T.parent || ids.has(T.parent));
  /* v164: Favoriten (★ an der Bestellung) haben höchste Dringlichkeit (prio 3) – für den Auftrag selbst und alle Unteraufträge */
  staffFavPlan();
  /* Tierpfleger: wie viele Tiere sollen es sein? Und fehlt Futter? */
  const pf = staffOf("pfleger");
  F.objs.forEach(o => { if (FPENS[o.t] && o.animals) o.want = Math.max(o.want || 0, o.animals.length); });
  if (pf) F.objs.filter(o => FPENS[o.t] && o.animals && o.animals.length && staffKindOn(penKind(o))).forEach(o => {   /* v61: nur freigegebene Arten */
    const A = FANIMALS[penKind(o)];
    if (!A || A.fish) return;
    const hungry = o.animals.filter(a => aniState(a) === "hungry").length, inv = farmInv(A.feed);
    if (!hungry || inv >= hungry) return;
    const need = o.animals.length * 2;
    const mk = staffMaker(A.feed);
    staffEnsureTask({ role: mk ? mk.role : "chef", item: A.feed, n: need - inv, stock: need, from: "pfleger", fromId: pf.id, note: "für die " + A.pl,
      why: !mk ? "keine Mühle" : !staffHas(mk.role) ? "dafür fehlt noch " + FSTAFF_ROLES[mk.role].n : "" });
  });
  /* Maschine steht still, weil für kein Rezept alles da ist: die Kraft nimmt sich das
     nötigste Rezept vor – die fehlenden Zutaten gehen als Aufträge weiter
     (Räucherei → Brennholz vom Sägewerker, Forellen vom Fischer; Backofen → Mehl …) */
  ["hofmeister", "saeger", "fischwirt"].forEach(role => {
    const s = staffOf(role);
    if (!s || staffTasksOf(role).length >= 3) return;
    staffMachines(role).forEach(o => {
      if (o.t === "kessel" || o.q.length || o.done.length || o.broken) return;
      const M = FMACHINES[o.t], ok = r => r.lv <= flv() && !FITEMS[r.id].energy && staffWlHas(role, r.id) && staffRoomFor(r);
      if (M.recipes.some(r => ok(r) && farmHasAll(r.in))) return;
      let best = null, bs = 0;
      M.recipes.forEach(r => { if (!ok(r)) return; const sc = staffWant(r.id) - farmInv(r.id); if (sc > bs) { bs = sc; best = r; } });
      if (best && !staffTaskList().some(T => T.item === best.id)) staffEnsureTask({ role, item: best.id, n: best.out, from: role, fromId: s.id, note: "für " + staffMachThe(o.t) });
    });
  });
  /* Fahrer/in: nimmt die lukrativsten Angebote selbst an (höchstens drei offen) und
     arbeitet die angenommenen von oben nach unten ab – die Kette verteilt sie weiter */
  const fa = staffOf("fahrer");
  if (fa) {
    /* v61: Modus – „Alle“ wie bisher; „Nur lieferbare“ nimmt nichts vorab an und lässt nichts für
       Bestellungen produzieren; „Nur Daueraufträge“ bedient nur die Wochenlieferungen */
    const mode = staffFahrMode();
    F.tasks = F.tasks.filter(T => T.role !== "fahrer" || !T.item.startsWith("order:") || (mode !== "ready" && staffFahrOk(S.orders.find(x => x.id === T.item.slice(6)) || {})));
    const accOpen = farmOrders().filter(x => x.acc && !x.farm.taken && !x.abo).length;
    if (mode === "all" && accOpen < 3) {
      const o = farmOrders().filter(x => !x.acc && !x.farm.taken && farmOrderAreaOn(farmOrderArea(x)) && Object.keys(x.farm.items).every(id => farmCanMake(id) || farmInv(id) >= x.farm.items[id]))
        .sort((a, b) => (!!b.fav - !!a.fav) || b.pay - a.pay)[0];
      if (o && farmAcceptOrder(o, "fahrer")) {
        if (typeof toast === "function") toast("📋 " + staffName(fa) + " hat die Bestellung von " + o.shipper + " angenommen (" + eur(o.pay) + ").", "ok", true);
        if (typeof renderDirty !== "undefined") renderDirty = true;
      }
    }
    const open = staffTasksOf("fahrer").filter(T => T.item.startsWith("order:")).length;
    if (mode !== "ready" && open < 3) {
      const o = farmOrders().filter(x => x.acc && !x.farm.taken && staffFahrOk(x) && !staffTaskList().some(T => T.item === "order:" + x.id))
        .sort((a, b) => (!!b.fav - !!a.fav) || b.pay - a.pay)[0];
      if (o) staffEnsureTask({ role: "fahrer", item: "order:" + o.id, n: 1, from: "order", fromId: o.id, note: o.shipper });
    }
  }
}

/* --------------------------- Arbeit nach Auftrag --------------------------- */
const staffNear = (s, arr, at) => arr.sort((a, b) => { const [ax, az] = at ? at(a) : farmCenter(a), [bx, bz] = at ? at(b) : farmCenter(b); return staffDist(s, ax, az) - staffDist(s, bx, bz); });
/* Braucht ein Auftrag des Landwirts gerade mehr Felder mit dieser Frucht? */
function staffCropNeed(c) {
  const T = staffTasksOf("farmer").find(x => x.item === c && !staffTaskDone(x));
  if (!T) return false;
  const growing = S.farm.objs.filter(o => o.t === "field" && o.crop === c && fieldState(o) === "grow").length;
  return growing * 2 < T.n - T.made;
}
/* Der Landwirt nimmt bis zu vier Felder auf einem Gang mit (die nächsten zum ersten) */
function staffBatch(first, list, n) {
  const [cx, cz] = farmCenter(first);
  const d = o => { const c = farmCenter(o); return Math.hypot(c[0] - cx, c[1] - cz); };
  return [first].concat(list.filter(o => o !== first).sort((a, b) => d(a) - d(b)).slice(0, (n || 4) - 1)).map(o => o.id);
}
function staffTaskJob(s, T) {
  const F = S.farm, item = T.item, name = staffItemName(item);
  /* v61: Freigaben gelten auch für Aufträge der Kollegen */
  /* v65: Ausnahme – Zwischenprodukt, das die Kraft für ein eigenes freigegebenes Rezept braucht (Balken für Paletten) */
  if (staffWlOn(s.role) && !item.startsWith("ani:") && !staffWlHas(s.role, item) && !(T.from === s.role && T.parent)) { T.wait = name + " – bei " + s.name + " nicht freigegeben"; return null; }
  T.wait = "";
  switch (s.role) {
    case "farmer": {
      if (FCROPS[item]) {
        const fields = F.objs.filter(o => o.t === "field");
        const ripeL = fields.filter(o => fieldState(o) === "ripe" && o.crop === item && farmRoom(item) >= 3), ripe = staffNear(s, ripeL)[0];
        if (ripe) return { k: "field", oid: ripe.id, oids: staffBatch(ripe, ripeL, Math.min(4, Math.max(1, Math.floor(farmRoom(item) / 3)))), crop: item, what: "erntet " + name };
        if (!farmCropOk(item)) { T.wait = name + " erst ab Level " + FCROPS[item].lv; return null; }
        if (staffCropNeed(item)) {
          const emptyL = fields.filter(o => fieldState(o) === "empty"), empty = staffNear(s, emptyL)[0];
          if (empty && S.money >= FCROPS[item].seed) return { k: "field", oid: empty.id, oids: staffBatch(empty, emptyL), crop: item, what: "sät " + name };
          const other = staffNear(s, fields.filter(o => fieldState(o) === "ripe" && o.crop !== item && staffWlHas("farmer", o.crop) && farmRoom(o.crop) >= 3))[0];
          if (other) return { k: "field", oid: other.id, crop: item, what: "erntet " + FITEMS[other.crop].n + ", sät " + name };
        }
        const dryL = fields.filter(o => o.crop === item && fieldState(o) === "grow" && !o.w), dry = staffNear(s, dryL)[0];
        if (dry) return { k: "water", oid: dry.id, oids: staffBatch(dry, dryL), what: "gießt den " + name };
        const growing = fields.filter(o => o.crop === item && fieldState(o) === "grow").length;
        if (growing) T.alive = S.time;
        T.wait = growing ? name + " wächst auf " + growing + (growing > 1 ? " Feldern" : " Feld") : "kein Feld frei – das nächste bekommt " + name;
        return null;
      }
      if (FTREES[item]) {
        const trees = F.objs.filter(o => o.t === "tree" && o.kind === item);
        if (!trees.length) { T.wait = "kein " + FTREES[item].n + " auf dem Hof"; return null; }
        const ripe = staffNear(s, trees.filter(o => treeRipe(o) && farmRoom(item) >= 4))[0];
        if (ripe) return { k: "pick", oid: ripe.id, what: "pflückt " + name };
        const dry = staffNear(s, trees.filter(o => !treeRipe(o) && !o.w))[0];
        if (dry) return { k: "water", oid: dry.id, what: "gießt den " + FTREES[item].n };
        T.wait = "die Bäume tragen noch"; T.alive = S.time;
        return null;
      }
      return null;
    }
    case "pfleger": {
      if (item.startsWith("ani:")) {
        const kind = item.slice(4), A = FANIMALS[kind], pens = F.objs.filter(o => o.t === A.house && o.animals.length < A.max);
        /* lieber in einen Stall, in dem es bei fünf Sternen bleibt */
        const pen = staffNear(s, pens.filter(o => o.animals.length < staffPen5(o)))[0] || (T.from === "chef" ? staffNear(s, pens)[0] : null);
        if (!pen) { T.wait = !F.objs.some(o => o.t === A.house) ? "erst den Stall bauen" : pens.length ? "mehr " + A.pl + " nur mit weniger Sternen – erst den Auslauf vergrößern" : "der Stall ist voll"; return null; }
        if (S.money < animalPrice(kind)) { T.wait = "zu wenig Geld"; return null; }
        return { k: "pen", oid: pen.id, buy: kind, what: "holt " + (A.young || A.n) };
      }
      const kind = Object.keys(FANIMALS).find(k => FANIMALS[k].out === item), A = FANIMALS[kind];
      if (!A) return null;
      const pens = F.objs.filter(o => o.t === A.house && o.animals && o.animals.length);
      if (!pens.length) { T.wait = "keine " + A.pl + " auf dem Hof"; return null; }
      for (const o of pens) {
        if (o.animals.some(a => aniState(a) === "ready") && farmRoom(A.out) >= (A.mast ? A.yield : 1)) return { k: "pen", oid: o.id, what: A.mast ? "bringt " + A.pl + " zum Metzger" : "sammelt " + name + " ein" };
        const hungry = o.animals.filter(a => aniState(a) === "hungry").length;
        if (hungry && farmInv(A.feed) > 0) return { k: "pen", oid: o.id, what: "füttert die " + A.pl };
        if (hungry) { staffSub(T, s, A.feed, o.animals.length * 2 - farmInv(A.feed), o.animals.length * 2); T.wait = "wartet auf " + staffItemName(A.feed); }
      }
      if (!T.wait) { T.wait = "die " + A.pl + " sind satt – bald gibt es " + name; T.alive = S.time; }
      return null;
    }
    case "hofmeister": case "saeger": case "fischwirt": {
      const m = staffRecipeFor(item, s.role);
      if (!m) { T.wait = "keine Maschine dafür"; return null; }
      const o = m.o, r = m.r;
      machUpdate(o);
      if (o.done.length && o.done.every(d => farmRoom(d.r) >= d.n)) return { k: "mach", oid: o.id, rid: null, what: "holt " + FITEMS[o.done[0].r].n + " ab" };
      if (o.broken) { T.wait = FMACHINES[o.t].n + " klemmt"; return null; }
      const free = machSlots(o) - o.q.length - o.done.length;
      const coming = o.q.filter(q => q.r === item).reduce((a, q) => a + q.n, 0);
      const left = T.n - T.made - coming;
      if (left <= 0) { T.wait = name + " läuft schon (" + FMACHINES[o.t].n + ")"; T.alive = S.time; return null; }
      if (free <= 0) { T.wait = FMACHINES[o.t].n + " ist voll belegt"; T.alive = S.time; return null; }
      if (farmRoom(item) < r.out) { T.wait = "kein Platz im Lager"; return null; }
      if (r.cost && S.money < r.cost) { T.wait = "zu wenig Geld für Sprit"; return null; }
      const sun = typeof pvSun === "function" && pvSun();
      if (r.en && !sun && (F.en || 0) < r.en) {
        const k = staffMachJob(s, true);
        if (k) return k;
        T.wait = "wartet auf Strom"; return null;
      }
      const batches = Math.max(1, Math.min(free, Math.ceil(left / r.out)));
      const miss = Object.keys(r.in).filter(id => farmInv(id) < r.in[id]);
      if (!miss.length) return { k: "mach", oid: o.id, rid: rkey(r), task: T.id, what: "macht " + name };
      miss.forEach(id => staffSub(T, s, id, r.in[id] * batches - farmInv(id), r.in[id] * batches));
      T.wait = "wartet auf " + miss.map(id => staffItemName(id)).join(" und ");
      return null;
    }
    case "holzfaeller": {
      const j = staffFellerJob(s, t => staffWlHas("holzfaeller", FSPECIES[t.sp].log) && (item === "aeste" || FSPECIES[t.sp].log === item));
      if (j) return j;
      T.wait = "gerade kein ausgewachsener Baum dafür";
      return null;
    }
    case "fischer": {
      /* v58: gezielt für die bestellte Art – bester Köder, bester Fanggrund; was beißt, bleibt Glück */
      const j = staffFischerJob(s, item);
      if (j) { T.wait = ""; return j; }
      T.wait = s.fwhy || "Kühlkiste voll";
      return null;
    }
    case "fahrer": {
      if (!item.startsWith("order:")) return null;
      const o = S.orders.find(x => x.id === item.slice(6));
      if (!o || o.farm.taken || !staffFahrOk(o) || staffFahrMode() === "ready") return null;   /* v61 */
      if (farmOrderReady(o)) {
        const opt = staffSendOpt(o);
        if (opt) return staffSendJob(o, opt);
        T.wait = "kein freies Fahrzeug – alle unterwegs oder zu klein"; return null;
      }
      const miss = Object.keys(o.farm.items).filter(id => farmInv(id) < o.farm.items[id]);
      miss.forEach(id => staffSub(T, s, id, o.farm.items[id] - farmInv(id), o.farm.items[id]));
      T.wait = "wartet auf " + miss.map(id => staffItemName(id)).join(", ");
      return null;
    }
  }
  return null;
}

/* ------------------------- Arbeit ohne Auftrag ---------------------------- */
/* Maschine: Fertiges abholen, neues Rezept in die Schlange */
function staffMachJob(s, onlyPower) {
  const list = staffMachines(s.role);
  /* der Kessel zuerst, wenn der Strom knapp wird (ohne volles Solardach) */
  if ((s.role === "saeger" || s.role === "mechaniker") && !(typeof pvSun === "function" && pvSun())) {
    const k = list.find(o => o.t === "kessel");
    if (k && (S.farm.en || 0) < farmEnCap() * 0.45 && k.q.length < machSlots(k)) {
      const r = FMACHINES.kessel.recipes.find(x => farmHasAll(x.in));
      if (r) return { k: "mach", oid: k.id, rid: rkey(r), what: "heizt den Kessel" };
    }
  }
  if (onlyPower) return null;
  let pickO = null, rid = null, what = "";
  for (const o of list) {
    machUpdate(o);
    if (o.done.length && o.done.every(d => farmRoom(d.r) >= d.n)) { pickO = o; what = "holt " + FITEMS[o.done[0].r].n + " ab"; break; }
  }
  /* v65: über alle Maschinen das Dringendste – nicht immer die erste (sonst frisst die Fischerhütte alle
     Forellen, bevor die Räucherei drankommt); volle Warteschlangen zählen etwas weniger */
  if (!pickO) {
    let bs = -Infinity;
    for (const o of list) {
      if (o.t === "kessel" || o.broken || o.q.length + o.done.length >= machSlots(o)) continue;
      const r = staffPickRecipe(o, s.role);
      if (!r) continue;
      const sc = staffRecipeScore(o, r) - o.q.length * 2;
      if (sc > bs) { bs = sc; pickO = o; rid = rkey(r); what = "macht " + FITEMS[r.id].n; }
    }
  }
  if (!pickO) return null;
  return { k: "mach", oid: pickO.id, rid, what };
}
/* Was säen? Was Aufträge brauchen, dann was fehlt (Getreide zählt fürs Futter mehr), dann Fruchtwechsel */
function staffCrop(o) {
  let best = null, bs = -1e9;
  const feed = {};
  /* v61: Futter-Getreide nur für Tierarten, die der Pfleger versorgen darf */
  S.farm.objs.forEach(x => { if (x.animals && x.animals.length) { const k = penKind(x), A = FANIMALS[k]; const m = A && staffKindOn(k) && staffRecipeFor(A.feed); if (m) for (const id in m.r.in) feed[id] = 1; } });
  Object.keys(FCROPS).forEach(c => {
    if (!farmCropOk(c) || !staffWlHas("farmer", c) || S.money < FCROPS[c].seed + 20 || staffLimHit(c, staffGrowing(c))) return;
    const sc = (staffCropNeed(c) ? 50 : 0) + staffWant(c) - farmInv(c) + (feed[c] ? 6 : 0) + (o.last && o.last !== c ? 0.6 : 0) - FCROPS[c].t / 2000;
    if (sc > bs) { bs = sc; best = c; }
  });
  return best;
}
function staffFarmerJob(s) {
  const F = S.farm, fields = F.objs.filter(o => o.t === "field"), trees = F.objs.filter(o => o.t === "tree");
  /* v61: nur freigegebene Früchte ernten, gießen, pflücken */
  const on = c => staffWlHas("farmer", c) && !staffLimHit(c);                 /* v138: Grenze erreicht = liegen lassen */
  const ripeL = fields.filter(o => fieldState(o) === "ripe" && on(o.crop) && farmRoom(o.crop) >= 3), ripe = staffNear(s, ripeL)[0];
  if (ripe) {
    const same = ripeL.filter(o => o.crop === ripe.crop);
    const ids = staffBatch(ripe, same, Math.min(4, Math.max(1, Math.floor(farmRoom(ripe.crop) / 3))));
    return { k: "field", oid: ripe.id, oids: ids, what: "erntet " + FITEMS[ripe.crop].n + (ids.length > 1 ? " (" + ids.length + " Felder)" : "") };
  }
  const fruit = staffNear(s, trees.filter(o => treeRipe(o) && on(o.kind) && farmRoom(o.kind) >= 4))[0];
  if (fruit) return { k: "pick", oid: fruit.id, what: "pflückt " + FITEMS[fruit.kind].n };
  const emptyL = fields.filter(o => fieldState(o) === "empty" && staffCrop(o)), empty = staffNear(s, emptyL)[0];
  if (empty) { const ids = staffBatch(empty, emptyL); return { k: "field", oid: empty.id, oids: ids, what: "sät " + FITEMS[staffCrop(empty)].n + (ids.length > 1 ? " (" + ids.length + " Felder)" : "") }; }
  const dryL = fields.filter(o => fieldState(o) === "grow" && !o.w && on(o.crop)), dryF = staffNear(s, dryL)[0];
  if (dryF) { const ids = staffBatch(dryF, dryL); return { k: "water", oid: dryF.id, oids: ids, what: "gießt " + (ids.length > 1 ? ids.length + " Felder" : "ein Feld") }; }
  const dry = staffNear(s, trees.filter(o => !treeRipe(o) && !o.w && on(o.kind)))[0];
  if (dry) return { k: "water", oid: dry.id, what: "gießt den " + FTREES[dry.kind].n };
  return null;
}
/* Wie viele Tiere soll ein Stall haben? Nie mehr, als mit fünf Sternen Platz haben –
   die Pflegerin achtet auf beste Haltung. Masttiere: so viele wie 5★ erlaubt;
   sonst: so viele, wie es schon waren (höchstens bis 5★). */
function staffPen5(o) {
  const A = FANIMALS[penKind(o)], P = FPENS[o.t], p = P[Math.min(P.length, o.lvl || 1) - 1];
  return Math.max(1, Math.floor(p.m2 / (A.space * 2) + 1e-9));
}
function staffPenTarget(o) {
  const kind = penKind(o), A = FANIMALS[kind];
  if (!A || A.fish) return 0;
  const five = staffPen5(o);
  if (!A.mast) return Math.min(A.max, o.want || 0, five);
  return Math.min(A.max, five);
}
function staffPflegerJob(s) {
  /* v61: nur Tierarten, deren Produkt freigegeben ist – sammeln, füttern und nachkaufen */
  const pens = S.farm.objs.filter(o => FPENS[o.t] && o.animals && FANIMALS[penKind(o)] && !FANIMALS[penKind(o)].fish && staffKindOn(penKind(o)));
  for (const o of pens) {
    const A = FANIMALS[penKind(o)];
    const ready = o.animals.filter(a => aniState(a) === "ready");
    if (ready.length && farmRoom(A.out) >= (A.mast ? A.yield : 1)) return { k: "pen", oid: o.id, what: A.mast ? "bringt " + A.pl + " zum Metzger" : "sammelt " + FITEMS[A.out].n + " ein" };
    if (o.animals.some(a => aniState(a) === "hungry") && farmInv(A.feed) > 0) return { k: "pen", oid: o.id, what: "füttert die " + A.pl };
  }
  /* leere Plätze wieder auffüllen (Masttiere nach dem Metzger, Ferkel in den neuen Stall) */
  for (const o of pens) {
    const kind = penKind(o), A = FANIMALS[kind];
    if (o.animals.length < staffPenTarget(o) && o.animals.length < A.max && S.money >= animalPrice(kind) + 100)
      return { k: "pen", oid: o.id, buy: kind, auto: true, what: "holt " + (A.young ? A.young : "junge " + A.pl) };
  }
  return null;
}
function staffFellerJob(s, want) {
  const T = S.farm.tools || {}, cand = (S.farm.trees || []).filter(t => {
    if (t.st !== "up" || t.sz >= 4 || (t.mx && t.sz < t.mx)) return false;     /* nur ausgewachsene, keine uralten */
    if (!farmAreaOpen(areaOfPoint(t.x, t.z))) return false;
    if (want && !want(t)) return false;
    const need = treeNeeds(t);
    if (need.saw || (need.axe || 1) > (T.axe || 1)) return false;
    return farmRoom(FSPECIES[t.sp].log) >= FTREE_SIZE[t.sz].logs;
  });
  if (!cand.length) return null;
  cand.sort((a, b) => staffDist(s, a.x, a.z) - staffDist(s, b.x, b.z));
  const t = cand[Math.floor(Math.random() * Math.min(4, cand.length))];
  return { k: "fell", tid: t.id, what: "fällt eine " + FSPECIES[t.sp].n };
}
/* v58: Der Fischer bleibt am Ende des Stegs (auf den Planken, Blick aufs Wasser) – die Reusen
   bearbeitet er von dort aus, ohne übers Wasser zu laufen */
function staffPotsOn() { return S.farm.objs.some(o => o.t === "pot" && (!o.area || farmAreaOpen(o.area))); }
function staffStegSpot(steg) {
  const [cx, cz] = farmCenter(steg), [, d] = farmSize(steg);
  return [cx, cz + d / 2 - 0.6, cx, cz + d / 2 + 3];
}
/* v64: Köder für die Reusen – nur wenn „Reusenköder“ freigegeben ist; sonst bleiben die Reusen leer.
   Ohne Dosen nimmt er Mais, falls auch Mais freigegeben ist. */
function staffPotBait() {
  if (!staffWlHas("fischer", "koeder")) return null;
  return farmInv("koeder") ? "koeder" : staffWlHas("fischer", "mais") && farmInv("mais") ? "mais" : null;
}
function staffFischerJob(s, target) {
  s.fwhy = "";
  const steg = farmObj1("f_steg");
  if (!steg) { s.fwhy = "erst den Steg bauen"; return null; }
  const at = staffStegSpot(steg);
  const pots = S.farm.objs.filter(o => o.t === "pot" && (!o.area || farmAreaOpen(o.area)));
  const room = farmStoreCap("fisch") - farmStoreUsed("fisch");
  const potT = target && FPOTS[target];
  if (!target || potT) {
    /* Reusen: bei einem Auftrag nur die, in denen die bestellte Art stecken kann */
    const ripe = pots.find(o => potState(o) === "ripe" && (!potT || (FPOTS[o.kind] && FPOTS[o.kind].mix[target])));
    if (ripe && room >= 4) return { k: "haul", oid: ripe.id, at, what: "leert eine Reuse" };
    const kind = potT ? Object.keys(FPOTS).filter(k => farmPotOk(k) && FPOTS[k].mix[target]).sort((a, b) => FPOTS[b].mix[target] - FPOTS[a].mix[target])[0] : null;
    const empty = pots.find(o => potState(o) === "empty");
    if (empty && staffPotBait() && (potT ? kind : Object.keys(FPOTS).some(farmPotOk))) return { k: "bait", oid: empty.id, kind, at, what: "beködert eine Reuse" };
    if (potT) {
      s.fwhy = !pots.length ? "keine Reuse am Steg" : !kind ? "dafür fehlt die Reusenstufe" : !staffWlHas("fischer", "koeder") ? "Reusenköder nicht freigegeben" : !staffPotBait() ? "kein Reusenköder" : room < 4 ? "Kühlkiste voll" : "Reusen liegen noch im Wasser";
      return null;
    }
  }
  if (room < 2) { s.fwhy = "Kühlkiste voll"; return null; }
  const P = staffFishPlan(target);
  if (P.why) { s.fwhy = P.why; return null; }
  const G = FGROUNDS.find(g => g.id === P.gid);
  return { k: "fish", oid: steg.id, gid: P.gid, bait: P.bait, at, what: G && G.boat ? "angelt (" + G.n + ")" : "angelt vom Steg" };
}
/* v61: Fahrzeug für eine Lieferung – am liebsten eins am Hof (dann fährt die Kraft mit), sonst ein freies
   von unterwegs, das pünktlich ankommt (es holt die Ware am Hof ab – genau wie bei „Liefern“ von Hand) */
function staffSendOpt(o, veh) {
  const all = farmDispatchOptions(o);
  return all.find(p => p.here && p.f.uid === veh && !p.late) || all.find(p => p.here && !p.late) || all.find(p => p.here)
    || all.find(p => p.f.uid === veh && !p.late) || all.find(p => !p.late) || null;
}
function staffSendJob(o, opt) {
  const from = !opt.here && N[opt.f.at] ? " (" + opt.t.brand + " kommt von " + N[opt.f.at].short + ")" : "";
  return { k: "send", order: o.id, veh: opt.f.uid, at: opt.here ? staffVehSpot(opt.f) : null, what: (opt.here ? "fährt die Lieferung an " : "schickt die Lieferung an ") + o.shipper + from };
}
function staffFahrerJob(s) {
  /* v61: angenommen wird erst beim Losschicken (staffDo „send“) – Moduswechsel unterwegs nimmt nichts an */
  /* fertige Bestellungen: angenommene zuerst, dann die lukrativste */
  const ready = farmOrders().filter(x => !x.farm.taken && staffFahrOk(x) && farmOrderReady(x)).sort((a, b) => (!!b.fav - !!a.fav) || (!!b.acc - !!a.acc) || b.pay - a.pay);
  let o = null, opt = null;
  for (const x of ready) { opt = staffSendOpt(x); if (opt && !opt.late) { o = x; break; } }
  if (!o) return null;
  return staffSendJob(o, opt);
}
/* Mechaniker/in: nachts (kein Sonnenstrom) oder wenn der Strom knapp wird, den Kessel anheizen */
function staffMechJob(s) {
  const k = S.farm.objs.find(o => o.t === "kessel" && o.q && machReady(o) && (!o.area || farmAreaOpen(o.area)));
  if (!k || (typeof pvSun === "function" && pvSun())) return null;
  machUpdate(k);
  const night = farmTod() === "nacht";
  /* wartet eine Maschine im Sägewerk auf Strom, heizt er auch tagsüber */
  const wait = staffTaskList().some(T => T.wait === "wartet auf Strom");
  if (!night && !wait && (S.farm.en || 0) > farmEnCap() * 0.3) return null;
  if ((S.farm.en || 0) >= farmEnCap() * 0.9 || k.q.length >= machSlots(k)) return null;
  const r = FMACHINES.kessel.recipes.find(x => farmHasAll(x.in));
  return r ? { k: "mach", oid: k.id, rid: rkey(r), what: night ? "heizt nachts den Kessel ein" : "heizt den Kessel ein" } : null;
}
function staffAutoJob(s) {
  switch (s.role) {
    case "mechaniker": return staffMechJob(s);
    case "farmer": return staffFarmerJob(s);
    case "pfleger": return staffPflegerJob(s);
    case "hofmeister": case "saeger": case "fischwirt": return staffMachJob(s);
    case "holzfaeller": return staffFellerJob(s, t => staffWlHas("holzfaeller", FSPECIES[t.sp].log) && !staffLimHit(FSPECIES[t.sp].log));   /* v61, v142: Grenze */
    case "fischer": return staffFischerJob(s);
    case "fahrer": return staffFahrerJob(s);
  }
  return null;
}
/* Erst die Aufträge (deine zuerst), dann der eigene Plan – so steht nie jemand herum */
function staffFind(s) {
  for (const T of staffTasksOf(s.role)) {
    if (staffTaskDone(T)) continue;
    const j = staffTaskJob(s, T);
    if (j) { j.task = T.id; return j; }
  }
  return staffAutoJob(s);
}
/* Ziel und Dauer: hinlaufen (5 Einheiten je Spielminute), dann arbeiten */
function staffPlace(s, j) {
  let p = null;
  if (j.k === "home") { const h = staffHome(s.role, j.i); return { x: h[0], z: h[1], fx: h[0], fz: h[1] + 1 }; }
  if (j.at) return { x: j.at[0], z: j.at[1], fx: j.at[2], fz: j.at[3] };
  if (j.tid != null) { const t = farmTree(j.tid); if (t) p = staffTreeSpot(t, s.role); }
  else if (j.oid != null) { const o = farmObj(j.oid); if (o) p = staffSpot(o, s.role); }
  if (!p) { const h = staffHome(s.role); p = { x: h[0], z: h[1], fx: h[0], fz: h[1] + 1 }; }
  return p;
}
/* Losgehen: Weg suchen (A*), Laufzeit nach Weglänge (5 Einheiten je Spielminute) */
const STAFF_CALL = 10, STAFF_CALL_TXT = "Telefonat mit dem Büro";   /* v106: Spielminuten, Anzeigetext */
/* v157: Anrufen geht erst, wenn es ein Büro gibt, das die Leute anrufen können */
const staffHasOffice = () => !!(S.bases && S.bases.length);
const staffCalling = s => !!(staffHasOffice() && s && s.job && s.job.cT1 != null && S.time < s.job.cT1 && s.job.k !== "lunch");
function staffGo(s, i, j) {
  const R = FSTAFF_ROLES[s.role], h = s.px != null ? [s.px, s.pz] : staffHome(s.role, i);
  const p = staffPlace(s, j);
  let r = null;
  const stops = [];                                        /* v112: Halte im Weg (Werkzeug ablegen / abholen) */
  try {
    const C = typeof CAMP !== "undefined" ? CAMP : null, inC = C && C.blockedW(h[0], h[1]), toC = C && j.k === "lunch" && C.slotAt(p.x, p.z);
    if (inC || toC) {
      /* v95: im Lagerplatz nur über das Tor und den Ring ums Feuer (nie durchs Feuer, Sofas oder Wände) */
      const g = C.gate();
      let head = inC ? C.routeOut(h[0], h[1]) : (navPath(h[0], h[1], g[0], g[1], s.role) || [[h[0], h[1]], g]);
      if (inC && head.stops) head.stops.forEach(st => stops.push(Object.assign({}, st)));
      if (toC) { const ri = C.routeIn(toC); r = head.concat(ri.slice(1)); (ri.stops || []).forEach(st => stops.push(Object.assign({}, st, { i: head.length + st.i - 1 }))); }
      else r = head.concat((navPath(g[0], g[1], p.x, p.z, s.role) || [g, [p.x, p.z]]).slice(1));
    } else r = navPath(h[0], h[1], p.x, p.z, s.role);
  } catch (e) { console.warn("Weg:", e); }
  const route = (r || [[h[0], h[1]], [p.x, p.z]]).map(q => [Math.round(q[0] * 100) / 100, Math.round(q[1] * 100) / 100]);
  const len = routeLen(route), home = j.k === "home";
  let walk = Math.max(home ? 0.4 : 1, staffWalkLen(route) / 5);   /* v71: auf Dekowegen schneller */
  if (r && stops.length) {
    stops.forEach(st => { st.d = routeLen(route.slice(0, st.i + 1)); st.w = STAFF_STOP_W; });
    j.stops = stops; walk += stops.length * STAFF_STOP_W / 5;
  }
  /* mehrere Felder: eins nach dem anderen (etwas länger, aber ein Gang statt vier) */
  if (j.oids && j.oids.length > 1) j.spots = j.oids.map(id => { const o = farmObj(id), q = o ? staffSpot(o, s.role) : p; return [q.x, q.z, q.fx, q.fz]; });
  const work = home ? 0 : R.work * (j.spots ? 1 + 0.55 * (j.spots.length - 1) : 1);
  /* v106: Das Büro ruft an und erklärt die Aufgabe (10 Spielminuten) – erst danach geht es los.
     Nur bei Aufträgen, und nur wenn für diesen Auftrag heute noch nicht angerufen wurde. */
  const ckey = j.k + ":" + (j.task || ""), call = !!(staffHasOffice() && j.task && j.k !== "lunch" && !home && !(s.callKey === ckey && S.time - (s.callAt || -1e9) < 600)) ? STAFF_CALL : 0;
  if (call) { s.callKey = ckey; s.callAt = S.time; }
  s.job = Object.assign(j, p, { route, len, sx: h[0], sz: h[1], t0: S.time + call, walk, t1: S.time + call + walk + work, cT1: call ? S.time + call : null });
  if (!home) { s.jobEnd = s.job.t1; s.doing = call ? STAFF_CALL_TXT : j.what; }
  return s.job;
}
/* wo ist jemand gerade auf seinem Weg? */
const STAFF_STOP_W = 4;     /* v112: Dauer eines Halts, als Wegstrecke gerechnet (≈ 0,8 Spielminuten) */
/* Zeitleiste eines Wegs mit Halten: Strecke + Wartezeiten. Liefert die Strecke ohne Halte (geo) und ggf. den laufenden Halt mit Fortschritt p (0…1),
   dazu, ob das Werkzeug gerade auf der Plane liegt (ground) und wie hoch es gerade gehoben wird (lift 0…1) */
function staffTimeline(j) {
  const L = j.len || routeLen(j.route), W = j.stops.reduce((a, q) => a + q.w, 0), f = Math.min(1, Math.max(0, (S.time - j.t0) / j.walk)), dd = f * (L + W);
  let acc = 0, info = null, ground = j.stops[0].kind === "pick", lift = 0;
  for (const st of j.stops) {
    const a = st.d + acc, midF = st.kind === "drop" ? 0.45 : 0.5;
    if (dd >= a + st.w * midF) ground = st.kind === "drop";
    if (dd >= a && dd < a + st.w) {
      const p = (dd - a) / st.w; info = { kind: st.kind, p, st };
      lift = st.kind === "drop" ? (p >= 0.45 ? Math.max(0, 1 - (p - 0.45) / 0.17) : 0) : (p >= 0.34 && p < 0.5 ? (p - 0.34) / 0.16 : 0);
      return { geo: st.d, info, ground, lift };
    }
    if (dd >= a + st.w) acc += st.w; else break;
  }
  return { geo: Math.max(0, dd - acc), info: null, ground, lift: 0 };
}
function staffRoutePos(j) {
  const el = S.time - j.t0;
  if (j.stops && j.stops.length && j.route) {
    const T = staffTimeline(j), q = routeAt(j.route, T.geo);
    if (T.info) { const st = T.info.st; q[2] = Math.atan2(st.tx - q[0], st.tz - q[1]); }
    q[3] = T.info; return q;
  }
  if (!j.route) { const f = Math.min(1, Math.max(0, el / j.walk)); return [j.sx + (j.x - j.sx) * f, j.sz + (j.z - j.sz) * f, Math.atan2(j.x - j.sx, j.z - j.sz)]; }
  return routeAt(j.route, Math.min(1, Math.max(0, el / j.walk)) * (j.len || routeLen(j.route)));
}
function staffAtHome(s, i) { if (s.px == null) return true; const h = staffHome(s.role, i); return Math.hypot(s.px - h[0], s.pz - h[1]) < 0.9; }
/* Erledigen – erst jetzt passiert es wirklich (alles noch einmal prüfen) */
function staffDo(s, j) {
  const F = S.farm, o = j.oid != null ? farmObj(j.oid) : null, got = [];
  const gain = (id, n) => { if (id && n > 0) { got.push({ id, n }); staffCredit(s.role, id, n); } };
  switch (j.k) {
    case "lunch": return;   /* v81: Mittagspause am Lagerfeuer – nichts zu erledigen */
    case "field":
      (j.oids || [j.oid]).map(farmObj).forEach(o => {
        if (!o || o.t !== "field") return;
        if (fieldState(o) === "ripe" && staffWlHas("farmer", o.crop) && farmRoom(o.crop) >= 3) { const r = farmHarvest(o); if (r) gain(r.id, r.n); }
        if (fieldState(o) === "empty") {
          const c = j.crop && farmCropOk(j.crop) && staffWlHas("farmer", j.crop) && staffCropNeed(j.crop) ? j.crop : staffCrop(o);
          if (c && S.money >= FCROPS[c].seed) farmPlant(o, c);
        }
      });
      break;
    case "pick": if (o && treeRipe(o) && staffWlHas("farmer", o.kind) && farmRoom(o.kind) >= 4) { const r = farmPick(o); if (r) gain(r.id, r.n); } break;
    case "water": (j.oids || [j.oid]).map(farmObj).forEach(o => { if (o && staffWlHas("farmer", o.t === "field" ? o.crop : o.kind)) farmWater(o); }); break;   /* v61: nur Freigegebenes */
    case "pen": {
      if (!o) break;
      const kind = penKind(o), A = FANIMALS[kind];
      if (!staffKindOn(kind)) break;   /* v61: Freigabe kann sich unterwegs geändert haben */
      o.animals.filter(a => aniState(a) === "ready").forEach(a => { if (farmRoom(A.out) >= (A.mast ? A.yield : 1)) { const r = farmCollect(o, a); if (r) gain(r.id, r.n); } });
      o.animals.filter(a => aniState(a) === "hungry").forEach(a => { if (farmInv(A.feed) > 0) farmFeed(o, a); });
      if (j.buy) {
        /* bis zu zwei Tiere je Gang (eigener Plan), auf deinen Auftrag genau eins */
        const B = FANIMALS[j.buy], times = j.auto ? 2 : 1;
        for (let k = 0; k < times; k++) {
          if (o.t !== B.house || !staffKindOn(j.buy) || o.animals.length >= B.max || S.money < animalPrice(j.buy) + (j.auto ? 100 : 0)) break;
          if (j.auto && o.animals.length >= staffPenTarget(o)) break;
          if (farmBuyAnimal(j.buy, o)) staffCredit(s.role, "ani:" + j.buy, 1);
        }
      }
      break;
    }
    case "mach": {
      if (!o) break;
      farmCollectMach(o).forEach(g => { if (!FITEMS[g.id].energy) gain(g.id, g.n); });
      const r = j.rid ? recipeOf(o, j.rid) : null;
      /* v65: Zwischenprodukt für ein eigenes freigegebenes Rezept ist erlaubt (siehe staffTaskJob) */
      const own = j.task && staffTaskList().some(T => T.id === j.task && T.from === s.role && T.parent);
      if (r && (staffWlHas(s.role, r.id) || own) && farmHasAll(r.in) && (FITEMS[r.id].energy || staffRoomFor(r))) {
        const T0 = j.task && staffTaskList().find(T => T.id === j.task);              /* v141: Herkunft merken */
        const why = own ? "Zwischenprodukt" + (T0 ? " für " + staffItemName((staffTaskList().find(P => P.id === T0.parent) || {}).item || T0.item) : "") : T0 ? "Auftrag" + (T0.from && T0.from !== s.role ? " von " + (FSTAFF_ROLES[T0.from] ? FSTAFF_ROLES[T0.from].n : T0.from) : "") + (T0.note ? " " + T0.note : "") : "Freigabe";
        if (farmQueueBy(s.role + "|" + why, o, j.rid) === true) o.lastR = j.rid;
      }
      /* v66: gleich die freien Plätze der Warteschlange füllen – je Platz neu entscheiden, was am dringendsten ist
         (gleiche Regeln: Freigabe, Zutaten, Reserve für Bestellungen, Lagerplatz, 15 % Luft) */
      if (o.t !== "kessel" && !o.broken && FMACHINES[o.t] && !FMACHINES[o.t].trips) for (let k = 0; k < 12 && o.q.length + o.done.length < machSlots(o); k++) {
        const r2 = staffPickRecipe(o, s.role);
        if (!r2 || farmQueueBy(s.role + "|Freigabe", o, rkey(r2)) !== true) break;
        o.lastR = rkey(r2);
      }
      break;
    }
    case "fell": {
      const t = farmTree(j.tid);
      if (!t || t.st !== "up" || farmRoom(FSPECIES[t.sp].log) < FTREE_SIZE[t.sz].logs) break;
      const r = farmFell(t, { acc: 0.55, tool: "axe" });
      if (r) {
        r.got.forEach(g => gain(g.id, g.n));
        if (typeof worldTreeFall === "function" && typeof FV !== "undefined" && FV.on) try { worldTreeFall(t, Math.atan2(t.x - s.px, t.z - s.pz)); } catch (e) { /* egal */ }
      }
      break;
    }
    case "haul": case "bait":
      /* Reuse hochziehen und gleich wieder beködert runterlassen */
      if (o && j.k === "haul" && potState(o) === "ripe") { const r = farmHaul(o, true); if (r) (r.got || [{ sp: r.id }]).forEach(g => gain(g.sp, 1)); }
      { const b = staffPotBait(); if (o && potState(o) === "empty" && b) { const k = j.kind && farmPotOk(j.kind) ? j.kind : farmPotBest(); if (k) farmBait(o, k, b); } }   /* v64: beste Stufe, freigegebener Köder */
      break;
    case "fish": {
      /* v58: ein Wurf = ein Köder; Art, Länge, Gewicht und Sterne wie beim Spieler */
      if (farmStoreCap("fisch") - farmStoreUsed("fisch") < 1 || typeof staffFishCatch !== "function") break;
      const c = staffFishCatch(j.gid || "steg", j.bait || "mais");
      if (!c) break;
      const id = c.id;
      farmAdd(id, 1, c.q, c.s.kg);
      /* v59: eigene Statistik – Notizbuch-Aufgaben zählen nur deine Fänge */
      F.stats.staffSpecies = F.stats.staffSpecies || {};
      F.stats.staffSpecies[id] = (F.stats.staffSpecies[id] || 0) + 1; F.stats.staffCatch = (F.stats.staffCatch || 0) + 1;
      farmXP(FITEMS[id].xp);
      angelLog(id, c.s, c.q, null, true);
      gain(id, 1);
      break;
    }
    case "send": {
      const ord = S.orders.find(x => x.id === j.order);
      if (!ord || !farmOrderReady(ord) || !staffFahrOk(ord)) break;   /* v61: Modus kann sich unterwegs geändert haben */
      const opt = staffSendOpt(ord, j.veh);
      if (opt && !ord.acc) farmAcceptOrder(ord, "fahrer");
      if (opt && farmSend(ord, opt)) {
        staffCredit(s.role, "order:" + ord.id, 1); farmEvent("send");
        s.lastTxt = (s.lastTxt || []).concat("Lieferung an " + ord.shipper).slice(-3);   /* v69.8 */
        /* sie steigt selbst ein – nur wenn das Fahrzeug am Hof steht */
        if (opt.here) s.ride = { uid: opt.f.uid, t0: S.time, to: ord.to };
        if (typeof farmSyncVehicles === "function" && typeof FV !== "undefined" && FV.on) farmSyncVehicles(false);
      }
      break;
    }
  }
  /* v69.8: „Zuletzt“ im Popup = was die Kraft wirklich gebracht hat (neueste zuerst, höchstens drei) */
  if (got.length) s.lastTxt = (s.lastTxt || []).concat(got.map(g => staffItemName(g.id, g.n))).slice(-3);
  if (got.length) { s.last = got[0].id; if (typeof staffFx === "function") staffFx(s, j, got[0]); }
}
/* Arbeitstakt: läuft mit dem Erbe-Takt, auch ohne Blick auf den Hof */
/* v81: Mittagspause 12–13 Uhr am Lagerfeuer (camp.js). Wer weit weg ist, geht früher los und kommt gegen 12 an;
   wer gerade arbeitet, macht das noch fertig. Jede Kraft hat einen festen Platz (worker_slot_01 … 09). */
const LUNCH0 = 720, LUNCH1 = 780;
function staffLunch(s, i) {
  if (typeof CAMP === "undefined") return false;
  const day = Math.floor(S.time / 1440), m = S.time % 1440;
  if (m < 660 || m >= LUNCH1 - 3 || s.lunchDay === day || (s.job && s.job.k === "lunch")) return false;
  if (s.job && s.job.k !== "home") return false;
  const sl = CAMP.slotFor(s, Object.keys(FSTAFF_ROLES).indexOf(s.role));
  if (!sl) { s.lunchDay = day; return false; }
  const p = s.px != null ? [s.px, s.pz] : staffHome(s.role, i);
  if (m < LUNCH0 - (Math.hypot(p[0] - sl.x, p[1] - sl.z) * 1.3 / 5 + 3)) return false;
  s.lunchDay = day;
  if (s.job) { const q = staffRoutePos(s.job); s.px = q[0]; s.pz = q[1]; s.job = null; }
  staffGo(s, i, { k: "lunch", what: "Mittagspause", at: [sl.x, sl.z, sl.fx, sl.fz] });
  s.job.t1 = day * 1440 + LUNCH1; s.jobEnd = s.job.t1; s.work = S.time; s.doing = "Mittagspause";
  return true;
}
function staffWork() {
  const F = S.farm;
  if (!F || !F.staff) return;
  staffWlInit(F);
  if (F.staff.length && S.time - (F.taskT || 0) >= 3) { F.taskT = S.time; try { staffPlan(); } catch (e) { console.warn("Aufträge:", e); } }
  F.staff.forEach((s, i) => {
    const R = FSTAFF_ROLES[s.role];
    if (!R || !R.gap) { s.doing = R ? "hilft, wo es klemmt" : ""; return; }
    if (!s.away && !s.ride && staffLunch(s, i)) return;
    /* auf Fortbildung: einen Tag weg, danach etwas besser */
    if (s.away) { if (!staffAwayTick(s, i)) return; }
    /* Fahrerin unterwegs: kommt zurück, wenn die Lieferung durch ist */
    if (s.ride) { if (!staffRideTick(s, i)) return; }
    if (s.job) {
      const j = s.job;
      if (S.time < j.t1) {
        /* auf dem Heimweg darf neue Arbeit dazwischenkommen */
        if (j.k !== "home" || S.time - (s.work || 0) < staffGap(s)) return;
        const nj = staffFind(s);
        s.work = S.time;
        if (!nj) return;
        const p = staffRoutePos(j); s.px = p[0]; s.pz = p[1];
        staffGo(s, i, nj);
        return;
      }
      s.job = null; s.px = j.x; s.pz = j.z;
      if (j.k === "home") return;
      s.work = S.time;
      if (j.k === "lunch") { s.work = S.time - staffGap(s) - 1; s.jobEnd = S.time - 9; }   /* v112: nach dem Essen gleich weiter – Werkzeug holen, neue Arbeit oder heim */
      try { staffDo(s, j); } catch (e) { console.warn("Mitarbeiter:", e); }
      return;
    }
    if (S.time - (s.work || 0) < staffGap(s)) return;
    const j = staffFind(s);
    s.work = S.time;
    if (!j) {
      const T = staffTasksOf(s.role).find(x => x.wait); s.doing = T ? T.wait : staffIdleWhy(s);
      /* nichts zu tun: auf dem Weg zurück an den eigenen Platz */
      if (S.time - (s.jobEnd || 0) > 8 && !staffAtHome(s, i)) staffGo(s, i, { k: "home", i });
      return;
    }
    staffGo(s, i, j);
  });
}
/* v63: Warum steht die Maschinen-Kraft? Der echte Grund statt „Lager reicht oder Zutaten fehlen“ */
function staffMachWhy(s) {
  const list = staffMachines(s.role).filter(o => o.t !== "kessel");
  if (!list.length) return staffMachines(s.role, true).some(o => o.t !== "kessel" && o.off) ? "alle Maschinen deaktiviert" : "noch keine Maschinen";
  let free = false, room = false, ok = false, money = false;
  const full = new Set();   /* v67: welches Lager ist voll? */
  const need = new Set();
  list.forEach(o => {
    machUpdate(o);
    if (o.broken || o.q.length + o.done.length >= machSlots(o)) return;
    free = true;
    FMACHINES[o.t].recipes.forEach(r => {
      if (r.lv > flv() || FITEMS[r.id].energy || !staffWlHas(s.role, r.id)) return;
      if (!staffRoomFor(r)) { room = true; full.add(FITEMS[r.id].st); return; }
      const miss = Object.keys(r.in).filter(id => farmInv(id) - r.in[id] < staffReserve(id));
      if (miss.length) { miss.forEach(id => need.add(id)); return; }
      if (r.cost && S.money < r.cost + 50) { money = true; return; }
      ok = true;
    });
  });
  if (!free) return "alle Plätze belegt";
  if (ok) return "fängt gleich an";
  const fullTxt = [...full].map(st => FSTORE[st] ? FSTORE[st].n : st).join(" und ") + " voll";
  if (need.size) return "Zutaten fehlen: " + [...need].slice(0, 3).map(id => staffItemName(id)).join(", ") + (room ? " · " + fullTxt : "");
  if (room) return fullTxt;
  if (money) return "zu wenig Geld";
  return "nichts freigegeben";
}
function staffIdleWhy(s) {
  /* v61: ganz ohne Freigabe sagt die Kraft das auch */
  if (staffWlOn(s.role) && s.role !== "pfleger" && !staffWlAll(s.role).some(id => staffWlHas(s.role, id))) return s.role === "holzfaeller" ? "keine Holzart freigegeben" : "nichts freigegeben";
  switch (s.role) {
    case "farmer": return "alles bestellt – wartet auf die Ernte";
    case "pfleger": {
      if (!staffWlAll("pfleger").some(p => staffWlHas("pfleger", p))) return "kein Tierprodukt freigegeben";
      const hungry = S.farm.objs.find(o => FPENS[o.t] && o.animals && staffKindOn(penKind(o)) && o.animals.some(a => aniState(a) === "hungry"));
      if (hungry) return "wartet auf " + staffItemName(FANIMALS[penKind(hungry)].feed);
      return "die Tiere sind versorgt";
    }
    case "hofmeister": case "saeger": case "fischwirt": return staffMachWhy(s);
    case "holzfaeller": return "kein ausgewachsener Baum der freigegebenen Arten oder Holzplatz voll";
    case "fischer": return s.fwhy || (farmObj1("f_steg") ? "Kühlkiste voll" : "erst den Steg bauen");
    case "fahrer": return (staffFahrMode() === "abo" ? "kein fertiger Dauerauftrag" : "keine fertige Bestellung") + " oder kein freies Fahrzeug";
    case "mechaniker": return typeof pvSun === "function" && pvSun() ? "Sonnenstrom läuft – hilft, wo es klemmt" : "Kessel läuft – hilft, wo es klemmt";
  }
  return "wartet";
}

/* --------------------------- Aussehen der Leute --------------------------- */
/* v112: Arbeitskleidung passend zum Beruf. garb = Kleidungsstück (siehe woodmodels.js person), gc = dessen Farbe, boots = Stiefel,
   hat = Kopfbedeckung (ohne: Frisur), alt = andere Hemdfarben (je Person eine davon) */
const STAFF_LOOK = {
  farmer:      { shirt: 0xd9cfa8, alt: [0xd9cfa8, 0xb8c98a, 0xe6c46a], pants: 0x5b4636, garb: "bib", gc: 0x3f5f8f, hat: "stroh", boots: 0x5a3d26 },
  pfleger:     { shirt: 0x5a9a6a, alt: [0x5a9a6a, 0x7aa0c8, 0xc89a6a], pants: 0x6a5a45, garb: "vest", gc: 0xb8a678, boots: 0x3a6a3a, cargo: true },
  hofmeister:  { shirt: 0xf4efe4, pants: 0x4a4a52, garb: "apron", gc: 0xf3f0e6, hat: "baecker", boots: 0x3a3330 },
  fahrer:      { shirt: 0x2f6fb0, alt: [0x2f6fb0, 0x5a6a7a, 0x8a3a3a], pants: 0x2f3640, garb: "hivis", gc: 0xf08a24, hat: "cap", hatC: 0x2f6fb0, boots: 0x2a2a30, cargo: true },
  holzfaeller: { shirt: 0xc8443a, alt: [0xc8443a, 0x2f6a4a, 0xb8742a], pants: 0x3a4a5a, garb: "plaid", hat: "helmf", hatC: 0xf2742a, boots: 0x4a3a2a },
  saeger:      { shirt: 0xd9d2c0, alt: [0xd9d2c0, 0xa8b4c0, 0xc8b08a], pants: 0x5a4a3a, garb: "leather", gc: 0x7a5232, hat: "helmg", hatC: 0xf2c231, boots: 0x3a3a3a },
  mechaniker:  { shirt: 0x3a5a8a, alt: [0x3a5a8a, 0x4a6a4a, 0x6a4a8a], pants: 0x3a5a8a, garb: "overall", boots: 0x2a2a30 },
  fischer:     { shirt: 0xe0b030, pants: 0x5a6a3a, garb: "bib", gc: 0x5a6a3a, hat: "strick", hatC: 0x2b4a6a, boots: 0x2a3a2a },
  fischwirt:   { shirt: 0xf6f6f2, pants: 0x3a4a6a, garb: "kittel", gc: 0x3a78b8, boots: 0xe8e8e8 }
};
const STAFF_SKIN = [0xf2c9a0, 0xe8b88a, 0xc68a5a, 0x8d5a3a], STAFF_HAIR = [0x3a2a1a, 0x7a4a2a, 0xd8b060, 0x1d1d20, 0xa8a8a8, 0x8a3a1a];
const STAFF_HAIRDO = ["kurz", "scheitel", "pferd", "lang", "dutt", "locken", "buzz", "glatze"];
/* Werkzeug in der Hand */
function staffTool(role) {
  const M = typeof FWM !== "undefined" ? FWM : null;
  if (!M) return null;
  switch (role) {
    case "farmer": return { fn: () => M.tool("sickle"), s: 0.42, grip: true };
    case "pfleger": return { fn: () => M.item("hfutter"), s: 0.3 };
    case "hofmeister": return { fn: () => M.item("mehl"), s: 0.32 };
    case "saeger": return { fn: () => M.tool("saw1"), s: 0.32, grip: true };
    case "holzfaeller": return { fn: () => M.tool("axe2"), s: 0.5, grip: true };
    case "fischer": return typeof FFM !== "undefined" && FFM.rod ? { fn: () => FFM.rod(), s: 0.9, rod: true } : null;
    case "fischwirt": return { fn: () => M.item("kisten"), s: 0.28 };
    case "mechaniker": return { fn: () => { const b = new FM.MB(); b.box(0.5, 0.3, 0.26, 0xd8332b, { top: 0xb82a24 }); b.box(0.3, 0.06, 0.05, 0x2a2a30, { y: 0.32 }); return b; }, s: 0.45, grip: true };
    case "fahrer": return { fn: () => { const b = new FM.MB(); b.box(0.36, 0.5, 0.04, 0x8a6040); b.box(0.3, 0.38, 0.045, 0xfaf6ee, { y: 0.04 }); return b; }, s: 0.5, grip: true };
  }
  return null;
}
function staffBody(s) {
  const b = staffStandIn(s), L = STAFF_LOOK[s.role] || STAFF_LOOK.farmer, k = b ? b.look : s.look != null ? s.look : (s.name || "x").length * 37;
  const hs = STAFF_HAIRDO[(k >> 3) % STAFF_HAIRDO.length], hair = STAFF_HAIR[(k >> 2) % STAFF_HAIR.length];
  const o = Object.assign({}, L, { skin: STAFF_SKIN[k % STAFF_SKIN.length], hair, hs, seed: k % 50 });
  if (L.alt) o.shirt = L.alt[(k >> 1) % L.alt.length];
  if (L.garb === "overall") o.pants = o.shirt;                                         /* Overall: Hose in Hemdfarbe */
  if (L.garb === "plaid" && o.shirt === 0x2f6a4a) o.gc = 0x1f4a32;
  if (!(hs === "pferd" || hs === "lang" || hs === "dutt") && ((k >> 5) % 3 === 1 || hs === "glatze")) o.beard = hs === "glatze" ? 0x3a2a1a : mixHairBeard(hair);   /* Bart: bei Glatze häufiger */
  return o;
}
const mixHairBeard = c => { const r = (c >> 16) & 255, g = (c >> 8) & 255, bl = c & 255; return ((r * 0.85) << 16) | ((g * 0.85) << 8) | (bl * 0.85 | 0); };
const staffKey = s => { const b = staffStandIn(s); return s.role + ":" + (b ? "v" + b.look : s.look != null ? s.look % 400 : s.name); };
/* Werkzeug in der Hand (relativ zur Figur – für das Bildchen) */
function staffToolAt(T) { return T.rod ? { x: 0.22, y: 0.42, z: 0.1, rx: -0.5, s: T.s } : { x: 0.26, y: 0.3, z: 0.12, s: T.s }; }
/* … und relativ zur Schulter des beweglichen Arms (auf dem Hof) */
const STAFF_SHOULDER = { x: 0.19, y: 0.78, z: 0 };
function staffToolOnArm(T) { return T.rod ? { x: 0.03, y: -0.36, z: 0.1, rx: -0.5, s: T.s } : T.grip ? { x: 0.02, y: -0.5, z: 0.02, s: T.s } : { x: 0.07, y: -0.48, z: 0.12, s: T.s }; }
/* Werkzeug richtig in der Faust (im Arm: Arm zeigt nach unten (−y), vorn ist +z).
   Sichel: Griff nach vorn, Klinge waagerecht zur Körpermitte; Axt: Stiel nach vorn,
   Schneide nach unten; Säge hängt am oberen Griff, Schwert nach vorn. */
function staffGrip(role) {
  const M = FWM, B = () => new FM.MB();
  const rot = (m, k, a) => B().merge(m, { [k]: a }), mv = (m, x, y, z) => B().merge(m, { x, y, z });
  switch (role) {
    case "farmer": { let m = rot(M.tool("sickle"), "rz", 0.5); m = mv(m, 0, 0.4, 0); return rot(m, "rx", Math.PI / 2); }
    case "holzfaeller": { let m = rot(M.tool("axe2"), "rz", 0.55); m = mv(m, 0, -0.14, 0); m = rot(m, "rz", -Math.PI / 2); return rot(m, "ry", -Math.PI / 2); }
    case "saeger": return mv(M.tool("saw1"), 0, -0.62, 0.1);
    case "mechaniker": { const b = B(); b.box(0.5, 0.3, 0.26, 0xd8332b, { top: 0xb82a24 }); b.box(0.3, 0.06, 0.05, 0x2a2a30, { y: 0.32 }); return mv(b, 0, -0.38, 0); }
    case "fahrer": { const b = B(); b.box(0.36, 0.5, 0.04, 0x8a6040); b.box(0.3, 0.38, 0.045, 0xfaf6ee, { y: 0.04 }); b.box(0.14, 0.05, 0.06, 0xb0b4b8, { y: 0.47 }); return rot(mv(b, 0, -0.04, 0), "rx", Math.PI / 2); }
  }
  return null;
}
/* Figur mit Werkzeug als ein Modell (für Bildchen) */
function staffModel(s) {
  const b = FWM.person(staffBody(s)), T = staffTool(s.role);
  if (T) b.merge(T.fn(), staffToolAt(T));
  return b;
}
function staffIc(s) {
  if (typeof thumbSpan !== "function" || typeof FWM === "undefined") return `<span class="fst-emo">${FSTAFF_ROLES[s.role].i}</span>`;
  return thumbSpan("staff:" + staffKey(s), () => staffModel(s), FSTAFF_ROLES[s.role].i).replace('class="ic th"', 'class="ic th ani"');
}

/* --------------------------- Auf dem Hof: Figuren --------------------------
   Körper ohne rechten Arm; der Arm hängt als eigenes Teil an der Schulter –
   so kann er Sichel, Axt oder Rute schwingen, beim Laufen pendeln und winken. */
/* v106: Arm mit Handy am Ohr (Ellbogen angewinkelt) – Drehpunkt wie arm(): an der Schulter */
function staffPhoneArm(o) {
  /* MB.box steht auf seiner Grundfläche (y = 0 unten); Drehungen wirken um diesen Punkt. Schulter = Ursprung, +z = vorn */
  const b = new FM.MB(), shirt = o.shirt || 0x3f78c8, skin = o.skin || 0xf2c9a0;
  b.at({ rx: -0.5 }, m => m.box(0.07, 0.2, 0.08, shirt, { y: -0.2 }));                       /* Oberarm: hängt, etwas nach vorn → Ellbogen */
  b.box(0.064, 0.31, 0.074, shirt, { y: -0.176, z: 0.096, rx: -0.284, rz: 0.097 });            /* Unterarm: vom Ellbogen hoch zum Ohr */
  b.box(0.06, 0.065, 0.07, skin, { x: -0.03, y: 0.12, z: 0.01, c: true });                     /* Hand am Ohr */
  b.box(0.016, 0.13, 0.055, 0x232a36, { x: -0.062, y: 0.125, z: 0.02, rx: 0.35, c: true });    /* Handy: dunkler Rahmen … */
  b.box(0.006, 0.11, 0.045, 0xe9edf2, { x: -0.05, y: 0.125, z: 0.02, rx: 0.35, c: true });     /* … helle Rückseite nach außen */
  return b;
}
function worldSyncStaff() {
  if (typeof FV === "undefined" || !FV.R) return;
  const R = FV.R, F = S.farm, ids = new Set((F.staff || []).map(s => s.id));
  if (typeof CAMP !== "undefined") CAMP.tidy(ids);
  for (const [id, n] of WV.staff) if (!ids.has(id)) { const i = R.nodes.indexOf(n.node); if (i >= 0) R.nodes.splice(i, 1); if (n.gt) { const g = R.nodes.indexOf(n.gt); if (g >= 0) R.nodes.splice(g, 1); } WV.staff.delete(id); }
  (F.staff || []).forEach((s, i) => {
    const old = WV.staff.get(s.id), key = staffKey(s);
    if (old && old.key === key) return;
    /* v57: Vertretung kommt oder geht – neue Figur an derselben Stelle */
    if (old) { const k = R.nodes.indexOf(old.node); if (k >= 0) R.nodes.splice(k, 1); if (old.gt) { const g = R.nodes.indexOf(old.gt); if (g >= 0) R.nodes.splice(g, 1); } WV.staff.delete(s.id); }
    const h = old ? [old.x, old.z] : s.px != null ? [s.px, s.pz] : staffHome(s.role, i), body = staffBody(s);
    const node = fnode(fmesh("staffb:" + staffKey(s), () => FWM.person(Object.assign({}, body, { armR: false }))), { x: h[0], z: h[1], ry: 0.6 + i, s: 1.45 });
    R.nodes.push(node);
    const arm = R.addChild(node, fnode(fmesh("starm:" + body.shirt + ":" + body.skin, () => FWM.arm(body)), Object.assign({ rz: 0.08 }, STAFF_SHOULDER)));
    const armM = arm.mesh, armPh = fmesh("starmph:" + body.shirt + ":" + body.skin, () => staffPhoneArm(body));
    const T = staffTool(s.role);
    const tool = T ? R.addChild(arm, fnode(fmesh((T.grip ? "sgrip:" : "stool:") + s.role, T.grip ? () => staffGrip(s.role) || T.fn() : T.fn), staffToolOnArm(T))) : null;
    /* v95: Kopf als eigenes Teil (sitzend: Blick, Nicken, Kopfschütteln) – nur sichtbar, solange die Sitzfigur ohne Kopf gezeigt wird */
    const head = R.addChild(node, fnode(fmesh("sthead:" + staffKey(s), () => FWM.head(body)), { y: 0.8 }));
    head.visible = false;
    /* v112: Sitzarm (gebeugt) und das Werkzeug, wie es auf der Plane am Feuer liegt */
    const armSitM = fmesh("starmsit:" + body.shirt + ":" + body.skin, () => FWM.armSit(body));
    const gt = T ? fnode(fmesh("sgt:" + s.role, T.fn), { s: T.s * 1.45, visible: false, shadow: true }) : null;
    if (gt) R.nodes.push(gt);
    WV.staff.set(s.id, { node, arm, tool, head, ph: i, x: h[0], z: h[1], fx: 0, wave: null, key, armM, armPh, armSitM, gt });
  });
}
const angTo = (a, b) => (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
const staffSS = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
/* v112: Hinsetzen – 1,2 s: zum Feuer drehen, rückwärts an den Sitz, in die Knie; am Ende erst die Sitzfigur. true = noch in Bewegung */
function staffSitDown(s, e, sl, dt) {
  const n = e.node, A = e.arm, P = CAMP.pose(sl);
  e.riseT = null; e.sitT = (e.sitT || 0) + dt;
  const t = e.sitT, kx = Math.min(1, dt * 2.4);
  e.x += (sl.x - e.x) * kx; e.z += (sl.z - e.z) * kx; n.x = e.x; n.z = e.z;
  n.ry += angTo(n.ry, sl.ry + P.turn) * Math.min(1, dt * 5);
  if (e.tool) e.tool.visible = false;
  if (t < 1.2) {
    const sq = staffSS((t - 0.5) / 0.7);
    n.y = -0.15 * sq; n.rx = -0.1 * sq;
    if (A) { A.rx += (-0.3 * sq - A.rx) * Math.min(1, dt * 8); A.rz += (0.18 * sq + 0.08 * (1 - sq) - A.rz) * Math.min(1, dt * 8); }
    return true;
  }
  e.sitT = 0; e.isSit = true; e.mStand = e.mStand || n.mesh;
  n.mesh = fmesh("staffs:" + e.key, () => FWM.person(Object.assign({}, staffBody(s), { armR: false, sit: true, noHead: true })));
  n.rx = 0; n.y = CAMP.SIT_Y;
  if (A) { A.mesh = e.armSitM; A.y = STAFF_SHOULDER.y; A.rx = 0; A.rz = 0; }
  if (e.head) { e.head.visible = true; e.head.rx = e.head.ry = e.head.rz = 0; }
  return false;
}
/* v112: Aufstehen – 1,15 s: vorbeugen, Hände aufs Knie, Stehfigur, hochdrücken. true = noch in Bewegung */
function staffRise(s, e, dt) {
  const n = e.node, A = e.arm;
  e.sitT = 0; e.riseT = (e.riseT == null ? 0 : e.riseT) + dt;
  const t = e.riseT;
  if (t < 0.6) {
    const k = staffSS(t / 0.6);
    n.rx = 0.4 * k; n.y = CAMP.SIT_Y;
    if (e.head) { e.head.rx = 0.2 * k; e.head.ry *= 1 - k * 0.5; }
    if (A) A.rx += (0.25 * k - A.rx) * Math.min(1, dt * 8);
    return true;
  }
  if (t < 1.15) {
    if (e.isSit) {
      e.isSit = false; n.mesh = e.mStand || n.mesh;
      if (A) { A.mesh = e.armM; A.y = STAFF_SHOULDER.y; A.rz = 0.08; }
      if (e.head) e.head.visible = false;
    }
    const k = (t - 0.6) / 0.55;
    n.rx = 0.4 * (1 - staffSS(k)); n.y = Math.sin(Math.PI * Math.min(1, k)) * 0.09;
    if (A) { A.rx += (0 - A.rx) * Math.min(1, dt * 8); }
    return true;
  }
  e.riseT = null; n.rx = 0; n.y = 0;
  return false;
}
/* v112: Liegt das Werkzeug gerade auf der Plane am Feuer? → { ground, x, z, ry, lift } oder null */
const STAFF_LAY = { farmer: 1, holzfaeller: 1, saeger: 1, fischer: 1, fahrer: 1 };
function staffToolSpot(s, e) {
  if (typeof CAMP === "undefined") return null;
  const j = s.job, C = CAMP;
  if (j && j.stops && j.stops.length && j.route) {
    const T = staffTimeline(j), st = j.stops[0];
    return { ground: T.ground, x: st.tx, z: st.tz, ry: st.ry, lift: T.lift };
  }
  const sl = C.slotOf(s.id);
  if (sl && (e.isSit || e.riseT != null || e.sitT || C.blockedW(e.x, e.z))) { const T = C.toolSpot(sl); return { ground: true, x: T.x, z: T.z, ry: T.ry, lift: 0 }; }
  return null;
}
function staffGroundTool(s, e, tg) {
  const g = e.gt; if (!g) return;
  if (!tg || !tg.ground) { g.visible = false; return; }
  const lay = STAFF_LAY[s.role] ? 1 : 0;
  g.visible = true; g.x = tg.x; g.z = tg.z; g.ry = tg.ry + (lay ? 0 : 0); g.rx = lay ? -1.5 : 0; g.y = 0.07 + tg.lift * 0.3;
}
/* Jedes Bild: hinlaufen, arbeiten (Arm schwingt das Werkzeug), winken, zurück an den Platz */
function stepStaff(dt, time) {
  const F = S.farm;
  if (!F || !F.staff) return;
  /* neu eingestellt (oder nach dem Laden): Figur nachziehen */
  if (FV.R && (WV.staff.size !== F.staff.length || F.staff.some(s => { const e = WV.staff.get(s.id); return e && e.key !== staffKey(s); }))) worldSyncStaff();
  if (!WV.staff.size) return;
  const now = wnow();
  /* v95: Gespräch der Sitzenden – eine Regie für alle am Feuer */
  if (typeof CAMP !== "undefined") {
    const ids = [];
    F.staff.forEach(s => { const e = WV.staff.get(s.id), sl = e && e.isSit && CAMP.slotOf(s.id); if (sl) ids.push(sl.id); });
    CAMP.talkStep(dt, time, ids);
  }
  F.staff.forEach((s, i) => {
    const e = WV.staff.get(s.id);
    if (!e) return;
    const j = s.job, n = e.node, A = e.arm, calling = staffCalling(s);
    /* v106: Telefonat mit dem Büro – Anzeigetext folgt dem Zustand */
    if (calling) s.doing = STAFF_CALL_TXT; else if (j && s.doing === STAFF_CALL_TXT) s.doing = j.what;
    /* v81: Mittagspause – angekommen: hinsetzen (Sitzfigur), danach wieder aufstehen.
       v112: weich – erst zum Feuer umdrehen, rückwärts an den Sitz, in die Knie; beim Aufstehen vorbeugen, Hände aufs Knie, hoch */
    const sl = j && j.k === "lunch" && S.time - j.t0 >= j.walk && typeof CAMP !== "undefined" ? CAMP.slotOf(s.id) : null;
    if (sl && !e.isSit) { if (staffSitDown(s, e, sl, dt)) return; }
    else if (!sl && (e.isSit || e.riseT != null)) { if (staffRise(s, e, dt)) return; }
    else if (e.sitT) e.sitT = 0;
    /* angetippt: stehen bleiben, zu dir drehen, einmal winken */
    const wv = e.wave != null && !calling ? now - e.wave : 99;
    if (wv < 1.9) {
      const eye = FV.R.eye || [FV.R.cam.tx + 20, 0, FV.R.cam.tz + 20];
      const r0 = e.wr0 != null ? e.wr0 : n.ry, k = Math.min(1, wv / 0.3);
      n.ry = r0 + angTo(r0, Math.atan2(eye[0] - e.x, eye[2] - e.z)) * (1 - (1 - k) * (1 - k));
      n.y = e.isSit ? CAMP.SIT_Y : 0;
      if (A) {
        const up = Math.min(1, wv / 0.25, (1.9 - wv) / 0.3);
        A.rz = 0.08 + up * (2.45 + Math.sin(wv * 13) * 0.35);
        A.rx = 0;
      }
      return;
    }
    /* unterwegs mit dem Wagen: nicht auf dem Hof (auf Fortbildung arbeitet die Vertretung) */
    const off = !!(s.ride && staffRideGone(s));
    const tg = off ? null : staffToolSpot(s, e), noHand = !!(tg && tg.ground);        /* v112: Werkzeug liegt auf der Plane */
    staffGroundTool(s, e, tg);
    n.visible = !off; if (A) A.visible = !off; if (e.tool) e.tool.visible = !off && !noHand; if (e.head) e.head.visible = !off && !!e.isSit;
    if (off) return;
    if (sl) {
      const P = CAMP.pose(sl), k = Math.min(1, dt * 5), G = CAMP.talkOf(sl.id), kx = Math.min(1, dt * 4);
      /* v95: vom Standpunkt vor dem Sofa rückwärts auf den Sitz, dabei zum Feuer umdrehen */
      e.x += (sl.x - e.x) * kx; e.z += (sl.z - e.z) * kx; n.x = e.x; n.z = e.z; if (e.tool) e.tool.visible = false;
      n.ry += angTo(n.ry, sl.ry + P.turn) * Math.min(1, dt * 6);
      n.y += (CAMP.SIT_Y + Math.sin(time * 1.6 + e.ph) * 0.006 - n.y) * Math.min(1, dt * 8); n.rx += (P.lean - n.rx) * k;
      if (e.head) { e.head.visible = true; e.head.ry = G.yaw + G.shk; e.head.rx = G.pit + G.nod; e.head.rz = G.roll; }
      if (A) { if (A.mesh !== e.armSitM) A.mesh = e.armSitM; A.rx += (-G.ges * 0.9 + Math.sin(time * 0.8 + e.ph) * 0.03 - A.rx) * k; A.rz += (P.az * 0.15 + G.ges * 0.12 - A.rz) * k; }
      return;
    }
    let tx, tz, work = false, face = null, onRoute = false, rh = null, dwell = null;
    if (j) {
      const el = S.time - j.t0;
      if (el < j.walk) { const p = staffRoutePos(j); tx = p[0]; tz = p[1]; rh = p[2]; onRoute = true; dwell = p[3] || null; }
      else if (j.spots) {
        /* von Feld zu Feld */
        const per = (j.t1 - j.t0 - j.walk) / j.spots.length, q = j.spots[Math.min(j.spots.length - 1, Math.floor((el - j.walk) / per))];
        tx = q[0]; tz = q[1]; work = true; face = Math.atan2(q[2] - q[0], q[3] - q[1]);
      }
      else { tx = j.x; tz = j.z; work = j.k !== "home"; face = Math.atan2(j.fx - j.x, j.fz - j.z); }
    } else { tx = s.px != null ? s.px : e.x; tz = s.pz != null ? s.pz : e.z; }
    const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz), sp = 6 * dt;
    let moving = d > 0.05;
    if (d > 40) { e.x = tx; e.z = tz; }
    else if (onRoute && d < 2.5) {
      /* auf dem Weg: genau der Wegspur folgen (auch bei schneller Uhr) */
      moving = !dwell;
      e.x = tx; e.z = tz;
      if (rh != null) n.ry += angTo(n.ry, rh) * Math.min(1, dt * 12);
    }
    else if (moving) { const k = Math.min(1, Math.max(sp, d * dt * 3) / d); e.x += dx * k; e.z += dz * k; n.ry += angTo(n.ry, Math.atan2(dx, dz)) * Math.min(1, dt * 12); }
    else if (face != null) n.ry += angTo(n.ry, face) * Math.min(1, dt * 6);
    if (work && moving && d > 0.3) work = false;
    n.x = e.x; n.z = e.z;
    n.y = moving ? Math.abs(Math.sin(time * 11 + e.ph)) * 0.07 : work ? Math.abs(Math.sin(time * 6 + e.ph)) * 0.03 : Math.abs(Math.sin(time * 2.2 + e.ph)) * 0.02;
    /* v112: Halt an der Werkzeugplane – hinstellen, bücken, ablegen (oder aufnehmen), aufrichten */
    let bend = 0;
    if (dwell) {
      const p = dwell.p; bend = p < 0.2 ? staffSS(p / 0.2) : p < 0.65 ? 1 : 1 - staffSS((p - 0.65) / 0.35);
      n.rx = 0.85 * bend; n.y = -0.22 * bend; n.ry += angTo(n.ry, rh != null ? rh : n.ry) * Math.min(1, dt * 12);
    } else if (n.rx) { n.rx *= Math.max(0, 1 - dt * 10); if (Math.abs(n.rx) < 0.004) n.rx = 0; }
    if (A && e.armPh) { const want = calling ? e.armPh : e.armM; if (A.mesh !== want) A.mesh = want; if (e.tool) e.tool.visible = !calling && !e.isSit && !noHand; }
    if (A && calling) {
      /* am Ohr, ruhig; beim Reden wippt er leicht und dreht sich ein wenig hin und her */
      const k2 = Math.min(1, dt * 6);
      A.rx += (Math.sin(time * 1.3 + e.ph) * 0.025 - A.rx) * k2; A.rz += (0 - A.rz) * k2;
      n.y = Math.abs(Math.sin(time * 2.6 + e.ph)) * 0.012;
      n.ry += Math.sin(time * 0.7 + e.ph * 2) * 0.004;
    } else if (A && dwell) {
      /* Arm zum Boden: beim Bücken nach vorn unten, mit dem Werkzeug in der Hand bis zum Ablegen */
      const k2 = Math.min(1, dt * 9);
      A.rx += (-0.1 - 0.7 * bend - A.rx) * k2; A.rz += (0.1 - A.rz) * k2;
    } else if (A) {
      const rod = s.role === "fischer";
      if (work) {
        const sw = Math.sin(time * (s.role === "holzfaeller" ? 7 : 5) + e.ph);
        if (rod) { A.rx = -0.55 + sw * 0.08; A.rz = 0.1; }
        else if (s.role === "fahrer") { A.rx = -0.75 + sw * 0.05; A.rz = 0.12; }
        else if (s.role === "pfleger" || s.role === "hofmeister" || s.role === "fischwirt" || s.role === "mechaniker") { A.rx = -0.35 + sw * 0.35; A.rz = 0.12; }
        else if (s.role === "farmer") { A.rx = -0.7 + sw * 0.18; A.rz = 0.3 + sw * 0.28; }   /* Sichel: waagerecht durchs Korn */
        else if (s.role === "saeger") { A.rx = -0.5 + sw * 0.1; A.rz = 0.1; }               /* Säge: ruhig halten, sie rüttelt */
        else { A.rx = -1.0 + sw * 1.0; A.rz = 0.1; }                                        /* Axt: von oben nach vorn */
      } else if (moving) { A.rx = Math.sin(time * 11 + e.ph) * 0.5; A.rz = 0.08; }
      else { A.rx += (0 - A.rx) * Math.min(1, dt * 6); A.rz += (0.08 - A.rz) * Math.min(1, dt * 6); }
    }
    /* Holzfäller: Späne fliegen, der Baum wackelt */
    if (work && j && j.k === "fell" && Math.random() < dt * 3 && FV.R) {
      const t = farmTree(j.tid);
      if (t) { WV.hit = { id: t.id, t0: wnow() }; FV.R.burst({ x: t.x + 0.3, y: 0.6, z: t.z + 0.3, n: 4, col: [[0.9, 0.78, 0.55, 1], [0.75, 0.55, 0.32, 1]], speed: 1.2, up: 1.4, size: 0.06, shape: 1 }); }
    }
  });
  /* offene Blase über einer Kraft: Text aktuell halten */
  if (FV.pop && FV.pop.kind === "staff") {
    const P = FV.pop, el = $("#farmPop");
    /* v106: kleine Sprechblase folgt der Figur jedes Bild, nach kurzer Zeit blendet sie aus */
    if (P.sayT != null && el && el.firstChild) {
      const age = now - P.sayT;
      if (age > 2.9) { closeFarmPop(); return; }
      if (age > 2.5) el.firstChild.classList.add("out");
      positionStaffPop(el, P);
    }
    if (FV.pop && now - (WV.staffPopAt || 0) > 0.5) { WV.staffPopAt = now; renderStaffPop($("#farmPop"), FV.pop); }
  }
}
/* fertig: kleiner Effekt am Ort, wenn man hinsieht */
function staffFx(s, j, fx) {
  if (typeof FV === "undefined" || !FV.on || !FV.R || !document.body.classList.contains("tab-farm")) return;
  const p = FV.R.project(j.x, 1.6, j.z);
  if (!p || p[0] < 0 || p[1] < 0 || p[0] > FV.R.w || p[1] > FV.R.h) return;
  FV.R.burst({ x: j.x, y: 0.9, z: j.z, n: 8, col: [[1, 0.86, 0.3, 1], [0.6, 0.85, 0.4, 1]], speed: 1.2, up: 1.8, size: 0.07, shape: 1, life: 0.8 });
  if (FITEMS[fx.id]) floatText(p[0], p[1], "+" + famt(fx.id, fx.n) + " " + FITEMS[fx.id].n, "");
}

/* ------------------------- Antippen: Blase mit Auftrag ---------------------- */
/* Trifft der Finger eine Kraft? (Figur von den Füßen bis über den Kopf) */
function staffTap(x, y) {
  if (typeof FV === "undefined" || !FV.R || !WV.staff.size) return false;
  let best = null, bd = 1e9;
  for (const [id, e] of WV.staff) {
    if (!e.node.visible) continue;
    /* v106: Sitzende sind niedriger – sonst trifft der Finger am Feuer eine Figur weiter vorn, die man gar nicht sieht */
    const y0 = e.node.y || 0, top = FV.R.project(e.x, y0 + (e.isSit ? 1.2 : 1.75), e.z), bot = FV.R.project(e.x, y0, e.z);
    if (!top || !bot) continue;
    /* eng um die Figur – wer daneben auf ein Gebäude tippt, meint das Gebäude */
    const h = Math.max(20, bot[1] - top[1]), w = Math.max(13, h * 0.3);
    if (y < top[1] - 6 || y > bot[1] + 5 || Math.abs(x - bot[0]) > w) continue;
    const d = Math.abs(x - bot[0]) + Math.abs(y - (top[1] + bot[1]) / 2) * 0.3;
    if (d < bd) { bd = d; best = id; }
  }
  if (best == null) return false;
  const e = WV.staff.get(best), sB = (S.farm.staff || []).find(x => x.id === best);
  if (!staffCalling(sB) && !(sB && sB.job && sB.job.k === "lunch")) { e.wave = wnow(); e.wr0 = e.node.ry; }
  closeFarmPop();
  FV.sel = null;
  FV.pop = { kind: "staff", id: best, add: false };
  renderFarmPop();
  popFresh();
  sfx("tap");
  return true;
}
function staffWho(T) {
  if (T.from === "chef") return "dir";
  if (T.from === "order") return "📋 Bestellung " + (T.note || "");
  const R0 = FSTAFF_ROLES[T.from], s = (S.farm.staff || []).find(x => x.id === T.fromId) || staffOf(T.from);
  return R0 ? R0.i + " " + R0.n.replace("/in", "") + (s ? " " + s.name : "") : T.from;
}
/* Woher kommt der Auftrag? Die ganze Kette: Landwirt ← Hofmeister ← Tierpfleger */
function staffChainText(T) {
  const list = staffTaskList(), parts = [];
  let x = T, k = 0;
  while (x && k++ < 5) {
    parts.push(staffWho(x) + (x.from !== "order" && x.note ? " (" + x.note + ")" : ""));
    if (x.from === "order") break;
    x = list.find(p => p.id === x.parent);
  }
  return "von " + parts.join(" ← ");
}
function staffTaskRow(T, now) {
  const order = T.item.startsWith("order:");
  return `<div class="fst-t${T.wait ? " wait" : ""}">${now ? staffItemIcNow(T.item) : staffItemIc(T.item)}<div><b>${esc(staffItemName(T.item, T.n))}${order ? "" : ` <i>${Math.min(T.made, T.n)}/${T.n}</i>`}${T.prio === 2 ? ` <u>dein Auftrag</u>` : ""}</b>
    <small>${esc(staffChainText(T))}</small>${T.wait ? `<em>⏳ ${esc(T.wait)}</em>` : ""}</div><button class="fst-x" data-tdel="${T.id}" title="Auftrag löschen">✕</button></div>`;
}
function staffPopHTML(s, P) {
  const R0 = FSTAFF_ROLES[s.role], tasks = staffTasksOf(s.role).filter(T => !staffTaskDone(T));
  const cur = s.job && s.job.task ? staffTaskList().find(T => T.id === s.job.task) : null;
  let h = `<div class="fp-h fst-h"><span class="fst-pi">${staffIcNow(s)}</span><div>${esc(staffName(s))} · ${R0.i} ${esc(R0.n)}
    <small>${s.job ? "▶ " : "· "}${esc(s.doing || "wartet")}${cur ? " · für " + esc(staffWho(cur)) : s.job ? " · eigener Plan" : ""}</small></div></div>`;
  if (!R0.gap || s.role === "mechaniker") return h + `<div class="fst-none">Arbeitet ohne Aufträge: nachts heizt er den Kessel für Strom, Reparaturen und Strom werden günstiger, nichts klemmt mehr.</div>`;
  const wl = staffWlOn(s.role), fahr = s.role === "fahrer";
  h += tasks.length ? `<div class="fst-ts">${tasks.map(T => staffTaskRow(T, true)).join("")}</div>`
    : `<div class="fst-none">Kein Auftrag – arbeitet ${wl || fahr ? "nach deinen Freigaben" : "nach eigenem Plan"}.${s.lastTxt && s.lastTxt.length ? `<br>Zuletzt: ${esc(s.lastTxt.slice().reverse().join(", "))}` : s.doneT && s.doneT.length ? `<br>Zuletzt erledigt: ${esc(s.doneT.slice(-2).join(", "))}` : ""}</div>`;
  /* v61: Freigaben statt „Auftrag geben“ (Fischer/in behält den Knopf) */
  if (wl) return h + staffWlHTML(s, P);
  if (fahr) return h + staffFahrHTML(s);
  if (P.add) {
    const opts = staffOptions(s.role);
    h += `<div class="fst-add-h">Was soll ${esc(staffStandIn(s) ? staffStandIn(s).name : s.name)} machen?<small>Nochmal tippen = mehr</small></div><div class="fp-row fst-opts">`
      + (opts.length ? opts.map(o => `<div class="ftool${o.lock ? " lock" : ""}" data-tgive="${esc(o.item)}">${staffItemIcNow(o.item)}<b>${esc(staffItemName(o.item, 2))}</b><small>${o.lock ? "noch nicht" : "×" + staffDefaultN(o.item)}</small></div>`).join("")
        : `<div class="fst-none">Gerade gibt es nichts, was ${esc(staffStandIn(s) ? staffStandIn(s).name : s.name)} machen kann.</div>`) + `</div>`;
  } else h += `<button class="btn tiny fst-give" data-tadd="1">＋ Auftrag geben</button>`;
  return h;
}
/* v61: Freigabe-Kacheln – an (grün, ✓), aus (blass) oder gesperrt (mit Grund) */
function staffWlHTML(s, P) {
  const role = s.role, c = staffWlCtx(role), name = esc(staffStandIn(s) ? staffStandIn(s).name : s.name), lim = STAFF_LIM.includes(role);
  const items = staffWlAll(role).map(id => ({ id, lock: staffWlLock(role, id, c), on: staffWlHas(role, id) }));
  const n = items.filter(x => x.on && !x.lock).length, free = items.filter(x => !x.lock).length;
  /* v138: Schieber für die Mengengrenze der gedrückt gehaltenen Kachel */
  let ed = "";
  if (lim && P && P.lim && FITEMS[P.lim]) {
    /* v142: jede Einheit einzeln (Schieber) plus Feinknöpfe; Fischer/in: Vorrat, der nicht angerührt wird */
    const id = P.lim, key = limKey(role, id), U = staffLimU(key), mx = staffLimMax(key), fish = role === "fischer";
    ed = `<div class="fst-lim" data-limbox>
      <div class="fst-lim-h">${staffItemIcNow(id)}<b>${fish ? "Vorrat" : "Grenze"} für ${esc(staffItemName(id, 2))}</b><span data-limv>${esc(staffLimTxt(key, U, fish))}</span></div>
      <input type="range" min="0" max="${mx}" step="1" value="${U}" data-limr aria-label="Grenze">
      <div class="fst-lim-b">${[-10, -1, 0, 1, 10].map(d => `<button class="btn tiny ghost" data-limd="${d}">${d === 0 ? "keine" : (d > 0 ? "+" : "−") + Math.abs(d)}</button>`).join("")}</div>
      <div class="fst-lim-f"><small>im Lager ${esc(famt(id, farmInv(id)))} · ${fish ? name + " nimmt diesen Köder nur, solange mehr da ist" : name + " " + (role === "farmer" ? "sät, erntet und pflückt" : role === "holzfaeller" ? "fällt" : "produziert") + " nur bis zur Grenze; Bestellungen gehen vor"}</small><button class="btn tiny" data-limok>Fertig</button></div></div>`;
  }
  const sub = (x) => {
    if (x.lock) return esc(x.lock);
    const key = limKey(role, x.id), L = lim ? staffLimU(key) : 0;
    if (role === "fischer" && x.id === "koeder" && !L) return x.on ? "✓ füllt Reusen" : "aus · Reusen bleiben leer";
    if (!x.on) return x.id === "koeder" && role === "fischwirt" ? "aus · Fischer nimmt Mais" : "aus";
    if (!L) return "✓ an";
    return (staffLimHit(key) ? "⛔ " : "✓ ") + esc(staffLimTxt(key, L));
  };
  return `<div class="fst-add-h">${role === "fischer" ? "Welche Köder darf " + name + " nehmen?" : "Was darf " + name + " machen?"}<small>${n} von ${free} an · antippen = an/aus${lim ? " · halten = " + (role === "fischer" ? "Vorrat" : "Grenze") : ""}</small></div>${ed}<div class="fp-row fst-opts">`
    + items.map(x => `<div class="ftool wl${x.on && !x.lock ? " wl-on" : ""}${x.lock ? " lock" : ""}${lim && staffLimU(limKey(role, x.id)) ? " wl-lim" : ""}${P && P.lim === x.id ? " wl-sel" : ""}" data-wl="${esc(x.id)}">${staffItemIcNow(x.id)}<b>${esc(staffItemName(x.id, 2))}</b>`
      + `<small>${sub(x)}</small></div>`).join("") + `</div>`;
}
/* v61: Fahrer/in – genau ein Modus */
function staffFahrHTML(s) {
  const m = staffFahrMode(), name = esc(staffStandIn(s) ? staffStandIn(s).name : s.name);
  const tip = { all: "nimmt lukrative Angebote an und liefert alles, was fertig ist – auch Daueraufträge",
    ready: "liefert nur, was gerade komplett im Lager ist – nimmt nichts vorab an", abo: "liefert nur Daueraufträge" }[m];
  return `<div class="fst-add-h">Was soll ${name} liefern?<small>${tip}</small></div>
    <div class="fs-row fst-mode">${Object.keys(STAFF_FAHR).map(k => `<button class="btn tiny${k === m ? "" : " ghost"}" data-fmode="${k}">${STAFF_FAHR[k]}</button>`).join("")}</div>`;
}
/* nur neu zeichnen, wenn sich etwas geändert hat (sonst flackert die Blase) – force nach deinem Tippen */
function renderStaffPop(el, P, force) {
  if (!el) return;
  const s = (S.farm.staff || []).find(x => x.id === P.id);
  if (!s) return closeFarmPop();
  /* v81/v106: in der Mittagspause oder im Telefonat zeigt jede Kraft nur eine kleine Sprechblase über ihrem Kopf (folgt kurz, dann weg) */
  const say = s.job && s.job.k === "lunch" ? { k: "lunch", ic: "🍽️", tx: "Mittagspause" } : staffCalling(s) ? { k: "call", ic: "📞", tx: "Im Telefonat" } : null;
  if (say) {
    if (P.sayT == null) P.sayT = wnow();
    if (force !== true && el._sh === "say:" + say.k && el.querySelector(".saym")) { positionStaffPop(el, P); return; }
    el._sh = "say:" + say.k; el.classList.add("on");
    el.innerHTML = `<div class="fp-box saym"><span class="si">${say.ic}</span><b>${say.tx}</b></div>`;
    positionStaffPop(el, P);
    return;
  }
  if (force !== true && P.limDrag) { positionStaffPop(el, P); return; }      /* v138: Schieber nicht beim Ziehen neu zeichnen */
  const h = staffPopHTML(s, P);
  if (force !== true && el._sh === h && el.querySelector(".fstp")) { positionStaffPop(el, P); return; }
  el._sh = h;
  el.classList.add("on");
  el.innerHTML = `<div class="fp-box fstp">${h}</div>`;
  el.querySelectorAll("[data-tdel]").forEach(b => b.onclick = ev => { ev.stopPropagation(); if (staffTaskDel(b.dataset.tdel, true)) { sfx("pop"); save(); } renderStaffPop(el, P, true); });
  el.querySelectorAll("[data-tadd]").forEach(b => b.onclick = ev => { ev.stopPropagation(); P.add = true; renderStaffPop(el, P, true); });
  /* v61: Freigabe umschalten / Fahrer-Modus wählen – gilt sofort und bleibt gespeichert */
  el.querySelectorAll("[data-wl]").forEach(b => {
    /* v138: gedrückt halten (Landwirt/in, Sägewerker/in) öffnet den Schieber für die Mengengrenze */
    if (STAFF_LIM.includes(s.role)) {
      let tm = 0;
      const stop = () => clearTimeout(tm);
      b.addEventListener("pointerdown", () => {
        b._held = false; stop();
        tm = setTimeout(() => { if (b.classList.contains("lock")) return; b._held = true; P.lim = b.dataset.wl; sfx("pop"); renderStaffPop(el, P, true); }, 450);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(t => b.addEventListener(t, stop));
      b.addEventListener("contextmenu", e => e.preventDefault());
    }
    b.onclick = ev => {
      ev.stopPropagation();
      if (b._held) { b._held = false; return; }            /* das Loslassen nach dem Halten schaltet nicht um */
      if (b.classList.contains("lock")) { sfx("bad"); return; }
      staffWlSet(s.role, b.dataset.wl, !staffWlHas(s.role, b.dataset.wl));
      sfx("tap"); save(); renderStaffPop(el, P, true);
    };
  });
  const lr = el.querySelector("[data-limr]");
  if (lr) {
    /* v142: Schieber in einzelnen Einheiten, Feinknöpfe −10/−1/keine/+1/+10 */
    const key = limKey(s.role, P.lim), fish = s.role === "fischer";
    const show = () => { const v = el.querySelector("[data-limv]"); if (v) v.textContent = staffLimTxt(key, +lr.value, fish); };
    const commit = () => { staffLimSet(key, +lr.value); P.limDrag = false; save(); renderStaffPop(el, P, true); };
    lr.addEventListener("pointerdown", ev => { ev.stopPropagation(); P.limDrag = true; });
    lr.addEventListener("input", show);
    lr.addEventListener("change", () => { sfx("tap"); commit(); });
    el.querySelectorAll("[data-limd]").forEach(b => b.onclick = ev => {
      ev.stopPropagation();
      const d = +b.dataset.limd;
      lr.value = d === 0 ? 0 : clamp(+lr.value + d, 0, +lr.max);
      sfx("tap"); commit();
    });
    el.querySelector("[data-limbox]").addEventListener("click", ev => ev.stopPropagation());
    el.querySelector("[data-limok]").onclick = ev => { ev.stopPropagation(); staffLimSet(key, +lr.value); P.lim = null; P.limDrag = false; sfx("tap"); save(); renderStaffPop(el, P, true); };
  }
  el.querySelectorAll("[data-fmode]").forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    S.farm.fahrMode = b.dataset.fmode;
    sfx("tap"); save(); renderStaffPop(el, P, true);
  });
  el.querySelectorAll("[data-tgive]").forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    if (b.classList.contains("lock")) { sfx("bad"); return; }
    if (staffAssign(s.role, b.dataset.tgive)) { sfx("build"); save(); const e = WV.staff.get(s.id); if (e) { e.wave = wnow(); e.wr0 = e.node.ry; } } else { sfx("bad"); toast("Die Auftragsliste ist voll – erst einen löschen.", "warn"); }
    P.add = false; renderStaffPop(el, P, true);
  });
  if (typeof thumbFill === "function") thumbFill();
  positionStaffPop(el, P);
}
function positionStaffPop(el, P) {
  const e = WV.staff.get(P.id), box = el && el.firstChild;
  if (!e || !box || !FV.R) return;
  const say = box.classList.contains("saym"), y0 = e.node.y || 0, p = FV.R.project(e.x, y0 + (say ? 1.62 : 2.35), e.z), f = FV.R.project(e.x, y0, e.z);
  if (!p) return;
  const w = box.offsetWidth, hgt = box.offsetHeight, W = FV.R.w, H = FV.R.h;
  let x = clamp(p[0] - w / 2, 8, W - w - 8), y = p[1] - hgt - (say ? 9 : 10);
  /* oben kein Platz: unter die Füße, damit die Kraft sichtbar bleibt */
  if (y < 56) y = Math.min(H - hgt - 8, (f ? f[1] : p[1] + 70) + 14);
  y = clamp(y, 8, Math.max(8, H - hgt - 8));
  box.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}

/* ------------------------------ Team-Fenster ------------------------------ */
function staffHTML() {
  const F = S.farm;
  const mine = staffTasksOf("chef").filter(T => !staffTaskDone(T));
  const forYou = mine.length ? `<div class="fteam you"><div class="fteam-h"><span>📋</span><b>Für dich</b><small>daran hängt gerade eine Kette</small></div>
    ${mine.map(T => `<div class="fst-t wait">${staffItemIc(T.item)}<div><b>${esc(staffItemName(T.item, T.n))} <i>${Math.max(0, (T.stock || T.n) - farmInv(T.item))} fehlen</i></b>
      <small>${esc(staffChainText(T))}</small>${T.why ? `<em>💡 ${esc(T.why)}</em>` : ""}</div><button class="fst-x" data-tdel="${T.id}" title="Auftrag löschen">✕</button></div>`).join("")}</div>` : "";
  const groups = FSTAFF_GROUPS.map(G => {
    const roles = Object.keys(FSTAFF_ROLES).filter(r => FSTAFF_ROLES[r].g === G.id);
    const open = staffGroupOpen(G.id), hired = roles.filter(staffHas).length;
    const cands = open ? staffCands() : [];
    const rows = roles.map(r => {
      const R0 = FSTAFF_ROLES[r], s = F.staff.find(x => x.role === r);
      if (s) {
        const ts = staffTasksOf(r).filter(T => !staffTaskDone(T));
        return `<div class="fstaff on"><div class="fst-p">${staffIc(staffSelf(s))}</div><div><b>${esc(s.name)} · ${R0.i} ${esc(R0.n)}</b>
          <small>${esc(R0.job)}</small><em class="fst-do">${s.job ? "▶ " : "· "}${esc(s.doing || "wartet")}</em>
          ${ts.length ? `<small class="fst-tl">📋 ${ts.map(T => esc(staffItemName(T.item, T.n)) + " (" + esc(staffWho(T)) + ")").join(" · ")}</small>` : ""}
          <small>${esc(s.trait)} +${s.perk} % · ${eur(s.wage)} am Tag${s.fed === false ? " · 😟 hungrig" : " · 😊 satt"}</small>
          ${staffTrainHTML(s)}</div>
          <div class="fst-btns"><button class="btn tiny" data-loc="${s.id}" ${s.ride && staffRideGone(s) ? "disabled" : ""}>📍 Orten</button>
          <button class="btn tiny ghost" data-fire="${s.id}">Entlassen</button></div></div>`;
      }
      if (!open || flv() < R0.lv) return `<div class="fstaff lock"><div class="fst-p"><span class="fst-emo">${R0.i}</span></div><div><b>${esc(R0.n)}</b><small>${esc(R0.job)}</small><small>🔒 ${open ? "ab Level " + R0.lv : esc(G.lock)}</small></div></div>`;
      const c = cands.find(x => x.role === r);
      if (!c) return `<div class="fstaff lock"><div class="fst-p"><span class="fst-emo">${R0.i}</span></div><div><b>${esc(R0.n)}</b><small>Morgen kommt eine neue Bewerbung.</small></div></div>`;
      return `<div class="fstaff cand"><div class="fst-p">${staffIc(c)}</div><div><b>${esc(c.name)} · ${R0.i} ${esc(R0.n)}</b><small>${esc(R0.job)}</small>
          <small>${esc(c.trait)} +${c.perk} % · ${eur(c.wage)} am Tag</small></div>
          <button class="btn tiny" data-hire="${c.id}" ${S.money < c.wage * 2 ? "disabled" : ""}>Einstellen<small>${eur(c.wage * 2)}</small></button></div>`;
    }).join("");
    const auto = open && roles.filter(r => FSTAFF_ROLES[r].gap).every(staffHas);
    return `<div class="fteam${open ? "" : " lock"}"><div class="fteam-h"><span>${G.i}</span><b>${esc(G.n)}</b><small>${open ? (auto ? "✓ läuft von allein" : hired + "/" + roles.length + " eingestellt") : "🔒 " + esc(G.lock)}</small></div>${rows}</div>`;
  }).join("");
  return `<div class="fs-sub">👷 Ist die nächste Etappe offen, übernehmen deine Leute die alte Station – langsamer als du, aber ohne Pause. Tipp eine Kraft auf dem Hof an: Sie zeigt ihre Aufträge, und du legst fest, was sie machen darf.</div>
    ${forYou}${groups}
    <div class="fs-sub">Täglich Lohn + Brotzeit aus dem Lager – hungrig schaffen sie nur die Hälfte.</div>`;
}
/* Fortbildung: Knopf oder Hinweis, wann es wieder geht */
function staffTrainHTML(s) {
  if (s.away) return `<small class="fst-tr away">🎓 auf Fortbildung – zurück in ${esc(fdur(Math.max(1, s.away.until - S.time)))}${staffStandIn(s) ? " · " + esc(staffStandIn(s).name) + " springt ein" : ""}</small>`;
  if ((s.perk || 0) >= STAFF_TRAIN.cap) return `<small class="fst-tr">🎓 Bestform: mehr geht nicht</small>`;
  const w = staffTrainWait(s);
  if (w > 0) return `<small class="fst-tr">🎓 nächste Fortbildung in ${Math.ceil(w / 1440)} ${Math.ceil(w / 1440) === 1 ? "Tag" : "Tagen"}</small>`;
  const c = staffTrainCost(s);
  return `<button class="btn tiny ghost fst-train" data-train="${s.id}" ${S.money < c || (s.ride && staffRideGone(s)) ? "disabled" : ""}>🎓 Fortbildung · ${eur(c)}<small>1 Tag weg, danach +${STAFF_TRAIN.plus} %</small></button>`;
}
/* Wo steckt …? Kamera hin, Blase auf */
function staffLocate(id) {
  const s = (S.farm.staff || []).find(x => x.id === id);
  if (!s) return;
  if (typeof closeFarmSheet === "function") closeFarmSheet();
  if (typeof showTab === "function" && !document.body.classList.contains("tab-farm")) showTab("farm");
  setTimeout(() => {
    if (typeof FV === "undefined" || !FV.R) return;
    worldSyncStaff();
    const e = WV.staff.get(id);
    if (!e) return;
    farmFocusXZ(e.x, e.z, Math.min(FV.R.cam.dist, 18), 700);
    setTimeout(() => {
      const e2 = WV.staff.get(id);
      if (!e2) return;
      e2.wave = wnow(); e2.wr0 = e2.node.ry;
      closeFarmPop(); FV.sel = null;
      FV.pop = { kind: "staff", id, add: false };
      renderFarmPop(); popFresh();
    }, 720);
  }, 220);
}
function staffBind(again) {
  $$("#farmSheetIn [data-loc]").forEach(b => b.onclick = () => { sfx("tap"); staffLocate(b.dataset.loc); });
  $$("#farmSheetIn [data-train]").forEach(b => b.onclick = () => {
    const s = S.farm.staff.find(x => x.id === b.dataset.train);
    if (!s) return;
    askConfirm("Fortbildung für " + s.name + "?", "Kostet " + eur(staffTrainCost(s)) + ". " + s.name + " ist einen Tag weg und kommt mit +" + STAFF_TRAIN.plus + " % zurück. Wieder möglich in zwei Wochen.", "Anmelden", () => {
      const sub = staffTrain(s.id);
      if (!sub) { sfx("bad"); again(); return; }
      sfx("coin"); save();
      staffSubPopup(s, again);
    });
  });
  $$("#farmSheetIn [data-hire]").forEach(b => b.onclick = () => { if (staffHire(b.dataset.hire)) { sfx("build"); save(); farmSyncScene(); again(); } else sfx("bad"); });
  $$("#farmSheetIn [data-fire]").forEach(b => b.onclick = () => askConfirm("Wirklich entlassen?", "Die Stelle wird frei – neue Bewerbungen kommen jeden Tag.", "Entlassen", () => { staffFire(b.dataset.fire); save(); farmSyncScene(); again(); }));
  $$("#farmSheetIn [data-tdel]").forEach(b => b.onclick = () => { staffTaskDel(b.dataset.tdel, true); sfx("pop"); save(); again(); });
  if (typeof thumbFill === "function") thumbFill();
}
/* v57: Meldung nach dem Anmelden – ein Freund / eine Freundin springt für den Tag ein */
function staffSubPopup(s, back) {
  const b = staffStandIn(s), R0 = FSTAFF_ROLES[s.role];
  if (!b) { if (back) back(); return; }
  const fr = b.g === "f" ? "meine Freundin " + b.name : "meinen Kumpel " + b.name, pr = b.g === "f" ? "Sie" : "Er";
  FV.sheetFn = null;
  /* v159: Porträt in hoher Auflösung, Figur von vorn und vollständig im Rahmen */
  const pu = typeof thumbOf === "function" && typeof FWM !== "undefined" && !THUMB.failed ? thumbOf("staffP:" + staffKey(s), () => staffModel(s), { big: 2, yaw: Math.PI / 2 - 0.3, pitch: 0.14, noShadow: true }) : null;
  const fig = pu ? `<img src="${pu}" alt="${esc(s.name)}">` : `<span class="stp-emo">${R0.i}</span>`;
  openFarmSheet(`<div class="stp">
      <div class="stp-fig">${fig}</div>
      <div class="stp-body">
        <div class="stp-name">${esc(s.name)}</div>
        <div class="stp-role">${R0.i} ${esc(R0.n)}<span>Fortbildung</span></div>
        <p class="stp-q">„Danke, Chef! Damit morgen nichts liegen bleibt, hab ich ${esc(fr)} gefragt. ${pr} macht meine Arbeit für denselben Lohn – bis ich zurück bin.“</p>
      </div>
    </div>
    <div class="stp-info"><div><b>🎓 Fortbildung</b><span>${esc(s.name)} ist einen Tag weg und kommt mit +${STAFF_TRAIN.plus} % zurück.</span></div>
      <div><b>🤝 Vertretung</b><span>${esc(b.name)} arbeitet bis dahin auf dem Hof.</span></div></div>
    <button class="btn fgo" id="fsSubOk">👍 Alles klar</button>`, "visit");
  $("#fsSubOk").onclick = () => { if (back) back(); else closeFarmSheet(); };
}
/* Neue Station fürs Personal offen: Lina sagt Bescheid (einmal je Station) */
function staffGroupCheck() {
  const F = S.farm;
  if (!F || F.sold || (F.tut && !F.tut.done) || flv() < 8) return;
  F.teamSeen = F.teamSeen || {};
  FSTAFF_GROUPS.forEach(G => {
    if (F.teamSeen[G.id] || !staffGroupOpen(G.id)) return;
    F.teamSeen[G.id] = S.time;
    if (typeof phoneMsg === "function") phoneMsg({ from: "Lina Sturm", kind: "info", title: "Personal für " + G.n,
      body: "Chef, ab jetzt kannst du für " + G.n + " Leute einstellen – sie erledigen dort alles von allein. Schau im Haus unter „Team“." });
  });
}
