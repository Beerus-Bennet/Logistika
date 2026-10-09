/* =========================================================================
   LOGISTIKA – erbe.js
   Spiellogik der großen Welt rund um den Hof: Erbe-Level, Gebiete und ihre
   Freischaltung, Bäume (wachsen nach), Werkzeug und Ausdauer, Holzhändler,
   Sägewerk mit Reparaturen, Strom und Maschinen, die Fischerei am See mit
   Bauplätzen, Booten, Fanggründen, Tageszeit und Wetter, Hof-Ausbaustufen,
   Gerümpel, Mitarbeiter, Ereignisse, Kleeblätter mit Kosmetik-Shop und der
   Verkaufsstand. Darstellung: worldview.js, fishview.js, minigames.js.
   ========================================================================= */

/* ------------------------------- Level ----------------------------------
   Das Erbe hat ein eigenes Level (Hof, Wald, Sägewerk, See). Vor der
   Gründung ist es das Spiel-Level; danach fängt die Spedition bei 1 an. */
function lvOfXp(xp) { return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp || 0) / 50)) + 1); }
function flv() { return S && S.farm ? lvOfXp(S.farm.xp) : 1; }

/* --------------------------- Zufall mit Samen ---------------------------- */
function erbeRng(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ------------------------------ Welt-Layout ------------------------------
   Wege (Polylinien) und Sperrflächen für Bäume – gebraucht beim Erzeugen
   der Bäume und beim Bau der Kulisse. */
const FWORLD = {
  pond: { x: 22.5, z: -3, r: 5.6 },
  lake: { x: 14, z: 48, rx: 36, rz: 22 },
  yard: [-42, -42, -16, -18],                      /* Sägewerkshof x0, z0, x1, z1 */
  /* Weg vom Westtor zum Sägewerk, von dort in den Wald (Hauptweg nach Norden, Abzweig nach Westen) */
  paths: [
    [[-13, -7.5], [-22, -7.5], [-29, -11], [-29, -18]],
    [[-29, -42], [-28, -52], [-24, -60], [-20, -68], [-22, -80], [-30, -92], [-38, -104]],
    [[-42, -30], [-52, -30], [-60, -36], [-70, -40], [-78, -44]],
    [[-24, -60], [-12, -58], [0, -54], [10, -46], [16, -38], [18, -26]],
    [[-20, -68], [-34, -70], [-48, -66], [-58, -60]]
  ],
  /* Bach von Nordosten nach Südwesten, Brücke am Hauptweg */
  creek: [[30, -82], [14, -76], [0, -72], [-14, -66], [-24, -64], [-36, -60], [-48, -52], [-62, -50], [-80, -46], [-96, -48]],
  clearings: [[-12, -36, 6], [-48, -42, 6.5], [6, -64, 5.5], [-66, -72, 6], [-40, -84, 5]],
  rocks: [-56, -86, 9],
  /* Feldgehölz am Hof: kleine Bäume für die Axt (Ost und am Teich) */
  hofTrees: [[17.4, -11, "birke", 1], [16.4, -8.9, "birke", 1], [17.6, 6.5, "kiefer", 1], [17.9, 10.5, "birke", 1], [18.4, -13.8, "kiefer", 1],
             [20.2, -12.8, "birke", 2], [25.5, -11.6, "birke", 1], [29.5, -6.5, "kiefer", 1], [29.8, 2.6, "birke", 1], [26.5, 7.8, "kiefer", 2]]
};
function distSeg(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / l2, 0, 1);
  return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t);
}
function distLine(px, pz, line) { let d = 1e9; for (let i = 1; i < line.length; i++) d = Math.min(d, distSeg(px, pz, line[i - 1], line[i])); return d; }
function nearPath(x, z) { let d = 1e9; for (const p of FWORLD.paths) d = Math.min(d, distLine(x, z, p)); return d; }
function inYard(x, z, m) { const y = FWORLD.yard; m = m || 0; return x > y[0] - m && x < y[2] + m && z > y[1] - m && z < y[3] + m; }
function inLake(x, z, m) { const L = FWORLD.lake; const a = (x - L.x) / (L.rx + (m || 0)), b = (z - L.z) / (L.rz + (m || 0)); return a * a + b * b < 1; }
/* Wo im Wald? Für Baumarten und Freischaltung */
function forestZone(x, z) {
  if (x < -58 && z < -58) return "alt";
  if (x > -45 && z > -50 && (x < -15.5 || z < -15.5)) return "birke";
  if (x < -45) return "kiefer";
  return "misch";
}
function areaOfPoint(x, z) {
  if (z > 21) return "see";
  if (x < -58 && z < -58) return "altwald";
  if (inYard(x, z)) return "saege";
  if (x < -15.5 || z < -15.5) return "wald";
  return null;
}
/* Freier Platz für einen Baum? (Wege, Bach, Hof, Teich, Lichtungen, Felsen) */
function treeSpotOk(x, z, pathGap) {
  if (Math.abs(x) < 16 && Math.abs(z) < 16) return false;
  if (z > 19.5) return false;                                       /* Straße und See */
  if (Math.hypot(x - FWORLD.pond.x, z - FWORLD.pond.z) < FWORLD.pond.r + 1.8) return false;
  if (x > 14 && x < 33 && z > -17 && z < 17) return false;          /* Teichwiese: dort steht das Feldgehölz extra */
  if (inYard(x, z, 2)) return false;
  if (nearPath(x, z) < (pathGap || 2.4)) return false;
  if (distLine(x, z, FWORLD.creek) < 2.6) return false;
  for (const c of FWORLD.clearings) if (Math.hypot(x - c[0], z - c[1]) < c[2]) return false;
  if (Math.hypot(x - FWORLD.rocks[0], z - FWORLD.rocks[1]) < FWORLD.rocks[2] * 0.7) return false;
  if (x < -22 && x > -36 && z > -12 && z < 4) return false;         /* Nachbars Feld im Westen */
  return true;
}
/* Fällbare Bäume: am Hof, entlang der Waldwege, an Lichtungen. Feste
   Saat, damit jeder Spielstand dieselbe Welt hat. */
function erbeMakeTrees() {
  const rnd = erbeRng(90210), out = [];
  let id = 1;
  const add = (sp, sz, x, z, area) => out.push({ id: id++, sp, sz, mx: sz, x: +x.toFixed(2), z: +z.toFixed(2), ry: +(rnd() * 6.28).toFixed(2), s: +(0.9 + rnd() * 0.2).toFixed(2), st: "up", t: 0, dmg: 0, area });
  FWORLD.hofTrees.forEach(([x, z, sp, sz]) => add(sp, sz, x, z, null));
  const pickSp = zone => {
    const r = rnd();
    if (zone === "birke") return r < 0.62 ? "birke" : r < 0.86 ? "kiefer" : r < 0.97 ? "fichte" : "kirsche";
    if (zone === "kiefer") return r < 0.55 ? "kiefer" : r < 0.85 ? "fichte" : r < 0.95 ? "birke" : "buche";
    if (zone === "misch") return r < 0.34 ? "buche" : r < 0.56 ? "eiche" : r < 0.78 ? "kiefer" : r < 0.93 ? "birke" : "kirsche";
    return r < 0.75 ? "eiche" : "buche";
  };
  let tries = 0;
  while (out.length < 175 && tries++ < 12000) {
    const x = -96 + rnd() * 128, z = -112 + rnd() * 124;
    if (!treeSpotOk(x, z, 2.2)) continue;
    const zone = forestZone(x, z);
    /* fällbar nur in Wegnähe oder am Rand einer Lichtung */
    const np = nearPath(x, z);
    let edge = np < 7.5;
    for (const c of FWORLD.clearings) if (Math.hypot(x - c[0], z - c[1]) < c[2] + 4) edge = true;
    if (!edge) continue;
    if (out.some(t => Math.hypot(t.x - x, t.z - z) < 2.6)) continue;
    const sp = pickSp(zone), S0 = FSPECIES[sp];
    let sz = zone === "alt" ? (rnd() < 0.55 ? 4 : 3) : 1 + Math.floor(rnd() * Math.min(3, S0.max) + 0.15);
    sz = Math.min(sz, S0.max);
    if (sp === "eiche" && zone !== "alt") sz = Math.min(sz, 3);
    add(sp, sz, x, z, zone === "alt" ? "altwald" : "wald");
  }
  return out;
}

/* -------------------------------- Init ----------------------------------- */
function erbeInit(F, fresh) {
  if (F.xp == null) {
    F.xp = S.xp || 0;
    /* vor der Gründung war alles EP des Hofs – die Spedition beginnt bei null */
    if (!F.logi) S.xp = 0;
  }
  F.lvSeen = F.lvSeen || lvOfXp(F.xp);
  F.areas = F.areas || {};
  F.areaQ = F.areaQ || [];
  F.tools = F.tools || { axe: 1, saw: 0 };
  if (F.sta == null) { F.sta = FSTA.max; F.staT = S.time; }
  F.stage = F.stage || (fresh ? 1 : 2);
  F.saw = F.saw || {};
  F.en = F.en || 0; F.enLv = F.enLv || 0;
  F.boat = F.boat || 0;
  F.staff = F.staff || [];
  F.ev = F.ev || { cur: null, next: S.time + 12 };
  /* ältere Stände: der Händler blieb zehn Stunden – jetzt eine */
  if (F.ev.cur && FEVENTS[F.ev.cur.k] && F.ev.cur.until - F.ev.cur.t0 > FEVENTS[F.ev.cur.k].dur && F.ev.cur.k === "haendler") F.ev.cur.until = Math.min(F.ev.cur.until, Math.max(S.time + 5, F.ev.cur.t0 + FEVENTS.haendler.dur));
  F.clover = F.clover != null ? F.clover : 5;
  F.cos = F.cos || { own: {}, on: {} };
  F.stall = F.stall || { slots: [], coins: 0 };
  F.mstall = F.mstall || { slots: [], coins: 0 };
  F.wx = F.wx || { k: "sonne", until: S.time + 60 };
  F.wild = F.wild || [];
  F.cap = F.cap || {};
  ["silo", "barn", "holz", "fisch"].forEach(s => { F.cap[s] = F.cap[s] || 1; });
  const st = F.stats || (F.stats = {});
  ["felled", "woodSold", "woodMade", "catch", "repairs", "cleared", "stallSold", "events"].forEach(k => { st[k] = st[k] || 0; });
  st.species = st.species || {};
  if (!F.trees || !F.trees.length) F.trees = erbeMakeTrees();
  /* kein Baum im Teich: zu nah am Ufer → ein Stück vom Wasser weg */
  const P = FWORLD.pond, safe = P.r * 1.3 + 1.2;
  F.trees.forEach(t => {
    const dx = t.x - P.x, dz = t.z - P.z, d = Math.hypot(dx, dz);
    if (d < safe) { const k = safe / Math.max(0.1, d); t.x = +(P.x + dx * k).toFixed(2); t.z = +(P.z + dz * k).toFixed(2); }
  });
  /* Sägewerk steht von Anfang an – verfallen, bis Krüger es verschenkt */
  if (!F.objs.some(o => o.t === "sw_halle")) {
    FSAW.objs.forEach(d => {
      const [w, dd] = FSIZE[d.t];
      farmAddObj({ t: d.t, x: Math.round(d.x - w / 2 + FG / 2), z: Math.round(d.z - dd / 2 + FG / 2), r: 0, area: "saege",
        q: FMACHINES[d.t] ? [] : undefined, done: FMACHINES[d.t] ? [] : undefined, slots: FMACHINES[d.t] ? 2 : undefined, lvl: 1 });
    });
  }
  /* Verkaufsstand am Tor */
  if (!F.objs.some(o => o.t === "stall")) {
    const p = farmFits(23, 27, 2, 1, null, "stall") ? [23, 27] : farmFreeSpot(2, 1, 24, 26, "stall");
    if (p) farmAddObj({ t: "stall", x: p[0], z: p[1], r: 0 });
  }
  if (fresh) erbeJunk(F);
}
/* Gerümpel auf dem frisch geerbten Hof */
function erbeJunk(F) {
  [["reifen", 24, 14], ["unkraut", 8, 23], ["schrott", 26, 20], ["bretter", 3, 12], ["karre", 12, 24], ["unkraut", 25, 4]].forEach(([k, x, z]) => {
    if (farmFits(x, z, 2, 2, null, "junk")) farmAddObj({ t: "junk", k, x, z, r: 0 });
  });
}
/* Lager, die es gerade gibt */
function farmStores() {
  const s = ["silo", "barn", "holz"];
  if (S.farm && (farmAreaOpen("see") || Object.keys(S.farm.inv).some(id => FITEMS[id] && FITEMS[id].st === "fisch"))) s.push("fisch");
  return s;
}

/* -------------------------------- Gebiete -------------------------------- */
function farmAreaOpen(id) { return !!(S.farm && S.farm.areas && S.farm.areas[id]); }
function farmAreaReady(id) {
  const A = FAREAS[id];
  if (!A || farmAreaOpen(id)) return false;
  if (id === "altwald" && !farmAreaOpen("wald")) return false;
  if (id === "saege" && !farmAreaOpen("wald")) return false;
  return flv() >= A.lv && (!A.req || A.req());
}
/* Text, warum ein Gebiet noch zu ist */
function farmAreaWhy(id) {
  const A = FAREAS[id];
  const parts = [];
  if (flv() < A.lv) parts.push("ab Level " + A.lv);
  (A.reqs || []).forEach(q => { if (q.v() < q.n) parts.push(q.yes ? q.t : q.n + " " + q.t + " (" + Math.min(q.v(), q.n) + "/" + q.n + ")"); });
  return parts.length ? parts.join(" · ") : "gleich ist es so weit";
}
/* Bedingungen erfüllt → Ereignis vormerken (die Ansicht zeigt es) */
function farmAreaCheck() {
  const F = S.farm;
  FAREA_ORDER.forEach(id => { if (farmAreaReady(id) && !F.areaQ.includes(id)) F.areaQ.push(id); });
}
function farmAreaUnlock(id) {
  const F = S.farm;
  if (farmAreaOpen(id)) return false;
  F.areas[id] = S.time;
  F.areaQ = F.areaQ.filter(x => x !== id);
  farmXP(id === "see" ? 120 : id === "saege" ? 90 : 60);
  farmClover(3, "Neues Gebiet");
  if (id === "see") erbeFishPlots();
  farmEvent("area:" + id);
  return true;
}
/* Kameragrenzen: Hof plus alles, was offen ist */
function farmCamRect() {
  let r = FCAM_HOF.slice();
  FAREA_ORDER.forEach(id => {
    const A = FAREAS[id];
    if (!farmAreaOpen(id) || !A.cam) return;
    r = [Math.min(r[0], A.cam[0]), Math.min(r[1], A.cam[1]), Math.max(r[2], A.cam[2]), Math.max(r[3], A.cam[3])];
  });
  return r;
}

/* ------------------------------- Bäume ----------------------------------- */
function treeOpen(t) { return !t.area || farmAreaOpen(t.area); }
/* Zustand nachziehen: Stumpf → Setzling → klein → wächst bis zur alten Größe */
function treeUpdate(t) {
  const sp = FSPECIES[t.sp];
  let guard = 6;
  while (guard-- > 0 && t.t && S.time >= t.t) {
    if (t.st === "stump") { t.st = "sapling"; t.t = t.t + FREGROW.sapling * sp.regrow; }
    else if (t.st === "sapling") { t.st = "up"; t.sz = 1; t.dmg = 0; t.t = t.sz < t.mx ? t.t + FREGROW.grow * sp.regrow : 0; }
    else if (t.st === "fallen") { t.st = "stump"; t.t = t.t + FREGROW.stump * sp.regrow; }
    else if (t.st === "up" && t.sz < t.mx) { t.sz++; t.t = t.sz < t.mx ? t.t + FREGROW.grow * sp.regrow : 0; }
    else t.t = 0;
  }
}
function farmTreesTick() { (S.farm.trees || []).forEach(treeUpdate); }
function farmTree(id) { return (S.farm.trees || []).find(t => t.id === id) || null; }
/* Welches Werkzeug passt? Gibt "axe" | "saw" | null (fehlt) zurück */
function treeTool(t) {
  const need = treeNeeds(t), T = S.farm.tools;
  if (need.saw) return (T.saw || 0) >= need.saw ? "saw" : null;
  if ((T.saw || 0) >= 1) return "saw";
  return (T.axe || 1) >= (need.axe || 1) ? "axe" : null;
}
function treeNeedText(t) {
  const need = treeNeeds(t);
  if (need.saw) return need.saw >= 2 ? "Profi-Säge" : "Kettensäge";
  return need.axe >= 2 ? "Stahlaxt" : "Axt";
}
/* Ausdauer: kommt von selbst langsam zurück */
function farmStaMax() { return FSTA.max + (farmCos("brotdose") ? 25 : 0); }
function farmSta() {
  const F = S.farm;
  const k = farmCos("thermos") ? 1.5 : 1;
  F.sta = Math.min(farmStaMax(), F.sta + Math.max(0, S.time - (F.staT || S.time)) * FSTA.regen * k);
  F.staT = S.time;
  return F.sta;
}
function farmStaUse(n) { farmSta(); if (S.farm.sta < n) return false; S.farm.sta -= n; return true; }
function farmEat(id) {
  const v = FFOOD[id];
  if (!v || farmInv(id) < 1) return 0;
  farmSta();
  if (S.farm.sta >= farmStaMax() - 0.5) return 0;
  farmTake(id, 1);
  S.farm.sta = Math.min(farmStaMax(), S.farm.sta + v);
  farmEvent("eat");
  return v;
}
/* Essbares im Lager, das Beste zuerst */
function farmFoods() { return Object.keys(FFOOD).filter(id => farmInv(id) > 0).sort((a, b) => FFOOD[b] - FFOOD[a]); }
/* Holzplatz frei? Vor dem Fällen prüfen */
function treeYieldPreview(t) { const Z = FTREE_SIZE[t.sz]; return { log: FSPECIES[t.sp].log, logs: Z.logs, aeste: Z.aeste }; }
/* Gefällt: res = { acc: 0…1, tool: "axe"|"saw", dirOk } */
function farmFell(t, res) {
  if (!t || t.st !== "up") return null;
  const F = S.farm, sp = FSPECIES[t.sp], Z = FTREE_SIZE[t.sz];
  const acc = clamp(res.acc || 0, 0, 1);
  const saw = res.tool === "saw";
  let logs = Z.logs + (acc > 0.85 ? 1 : 0) + (saw && res.dirOk ? (t.sz >= 3 ? 1 : 0) : 0);
  if (staffPerk("holzfaeller") && Math.random() < staffPerk("holzfaeller") * 3) logs++;
  let aeste = Z.aeste, reste = saw ? Math.max(1, Math.round(t.sz / 2)) : 0;
  let q = clamp(2 + acc * 3 + (saw && res.dirOk ? 0.3 : 0) - (saw && res.hung ? 0.8 : 0), 1, 5);
  const got = [];
  const give = (id, n, qq) => {
    const room = farmRoom(id), k = Math.min(n, room);
    if (k > 0) { farmAdd(id, k, qq); got.push({ id, n: k, q: qq, xp: FITEMS[id].xp * k }); }
    return k;
  };
  /* Uralte Eichen: manchmal steckt Edelholz drin */
  if (t.sz === 4 && Math.random() < 0.5) give("edelholz", 1, 5);
  give(sp.log, logs, q);
  give("aeste", aeste, 3);
  if (reste) give("reste", reste, 3);
  if (!got.length) { farmFull("holz"); return null; }
  let xp = got.reduce((s, g) => s + g.xp, 0) + t.sz * 2 + (saw ? 2 : 0);
  farmXP(xp);
  F.stats.felled++;
  F.stats.fellSp = F.stats.fellSp || {};
  F.stats.fellSp[t.sp] = (F.stats.fellSp[t.sp] || 0) + 1;
  t.st = "stump"; t.dmg = 0;
  t.t = S.time + FREGROW.stump * sp.regrow;
  farmEvent("fell");
  farmEvent("fell:" + (t.sp === "fichte" ? "kiefer" : t.sp));
  if (t.sz >= 3) farmEvent("fell:big");
  if (t.sz >= 4) farmEvent("fell:uralt");
  if (saw) farmEvent("fell:saw");
  return { got, xp, q, logs };
}
/* Windwurf nach dem Sturm: liegender Stamm, Holz ohne Fällen */
function farmTakeFallen(t) {
  if (!t || t.st !== "fallen") return null;
  const sp = FSPECIES[t.sp], Z = FTREE_SIZE[Math.max(1, t.sz)];
  const n = Math.min(Z.logs, farmRoom(sp.log));
  if (n < 1) { farmFull("holz"); return null; }
  farmAdd(sp.log, n, 3);
  const a = Math.min(Z.aeste, farmRoom("aeste")); if (a > 0) farmAdd("aeste", a, 3);
  const xp = FITEMS[sp.log].xp * n + 2;
  farmXP(xp);
  t.st = "stump"; t.t = S.time + FREGROW.stump * sp.regrow;
  farmEvent("windwurf");
  return { id: sp.log, n, xp };
}

/* ------------------------------ Werkzeug --------------------------------- */
function farmToolOwned(id) { const T = FTOOLS[id], o = S.farm.tools; return T.kind === "axe" ? (o.axe || 1) >= T.lvl : (o.saw || 0) >= T.lvl; }
function farmBuyTool(id) {
  const T = FTOOLS[id];
  if (!T || farmToolOwned(id)) return false;
  if (flv() < T.lv) { toast("Erst ab Level " + T.lv + ".", "warn"); return false; }
  if (T.req && !T.req()) { toast("Dafür brauchst du erst: " + T.reqT + ".", "warn"); return false; }
  if (S.money < T.price) { toast("Dafür fehlen " + eur(T.price - S.money) + ".", "warn"); return false; }
  S.money -= T.price; S.expense += T.price;
  logMoney("farm", T.n + " gekauft", -T.price);
  if (T.kind === "axe") S.farm.tools.axe = T.lvl; else S.farm.tools.saw = T.lvl;
  farmXP(10 + T.lvl * 10);
  farmEvent("tool:" + id);
  /* Mit der Kettensäge kommt der Sägebock auf den Hof */
  if (id === "saw1" && !S.farm.objs.some(o => o.t === "saegebock")) {
    const p = farmFreeSpot(2, 2, 25, 22);
    if (p) farmAddObj({ t: "saegebock", x: p[0], z: p[1], r: 0, q: [], done: [], slots: 2 });
  }
  return true;
}

/* ---------------------------- Holzhändler -------------------------------- */
function farmWoodPrice(id, n) {
  const it = FITEMS[id], q = farmQ(id) || 3;
  const k = it.raw ? 1 : 0.5;
  const boom = farmEvOn("holzpreis") && it.raw ? 1.3 : 1;
  return Math.max(0.5, Math.round(it.v * k * n * (1 + (q - 3) * 0.08) * boom * 10) / 10);
}
function farmSellWood(id, n) {
  n = Math.min(n, farmInv(id));
  if (!n) return 0;
  const m = farmWoodPrice(id, n);
  farmTake(id, n);
  S.money += m; S.revenue += m;
  S.farm.stats.earned += m;
  S.farm.stats.woodSold += m;
  logMoney("farm", "Holzhändler · " + fqty(id, n), m);
  farmEvent("sellwood", Math.round(m));
  return m;
}

/* ------------------------------- Sägewerk -------------------------------- */
function sawRepaired() { return !!(S.farm && S.farm.saw && FSAW_REPAIRS.every(r => S.farm.saw[r.id])); }
function sawNext() { return FSAW_REPAIRS.find(r => !S.farm.saw[r.id]) || null; }
function farmRepairCost(rep) { return Math.round(rep.cost * (1 - staffPerk("mechaniker"))); }
function farmRepairCheck(rep) {
  if (!farmAreaOpen("saege")) return "zu";
  const miss = farmMissing(rep.need);
  if (miss.length) return "missing";
  if (S.money < farmRepairCost(rep)) return "money";
  return true;
}
/* Erfolgreich repariert (nach dem Minispiel): Material und Geld weg */
function farmRepairDone(rep, score) {
  const F = S.farm;
  if (F.saw[rep.id]) return false;
  const c = farmRepairCost(rep);
  for (const id in rep.need) farmTake(id, rep.need[id]);
  S.money -= c; S.expense += c;
  logMoney("farm", "Reparatur Sägewerk · " + rep.n, -c);
  F.saw[rep.id] = S.time;
  F.stats.repairs++;
  farmXP(40 + Math.round((score || 0.5) * 30));
  farmEvent("repair:" + rep.id);
  if (rep.id === "lkw") {
    const v = makeVehicle(rep.veh, false);
    v.gift = true; v.at = FARM_NODE;
    const fa = farmAddr();
    v.spot = { lat: fa.lat, lon: fa.lon, t: "Stellplatz am Schuppen, " + fa.t, a: fa.a }; v.spotAt = FARM_NODE;
    S.fleet.push(v);
  }
  if (sawRepaired()) { farmClover(5, "Sägewerk läuft"); }
  return true;
}
function farmEnCap() { return FENERGY_CAP[S.farm.enLv || 0]; }
/* Maschine im Sägewerk kaufen: steht dann auf ihrem Platz */
function farmBuySawMachine(it) {
  const t = it.id;
  if (!farmAreaOpen("saege") || !sawRepaired()) { toast("Erst das Sägewerk reparieren.", "warn"); return null; }
  if (S.farm.objs.some(o => o.t === t)) return null;
  if (flv() < it.lv) { toast("Erst ab Level " + it.lv + ".", "warn"); return null; }
  const price = it.price(), miss = farmMissing(it.need || {});
  if (miss.length) { toast("Es fehlt: " + miss.map(m => fqty(m.id, m.need)).join(", "), "warn"); return null; }
  if (S.money < price) { toast("Dafür fehlen " + eur(price - S.money) + ".", "warn"); return null; }
  S.money -= price; S.expense += price;
  for (const id in (it.need || {})) farmTake(id, it.need[id]);
  logMoney("farm", it.n + " gekauft", -price);
  const p = FSAW.pads[t], [w, d] = FSIZE[t];
  const o = farmAddObj({ t, x: Math.round(p[0] - w / 2 + FG / 2), z: Math.round(p[1] - d / 2 + FG / 2), r: 0, area: "saege", q: [], done: [], slots: 2 });
  farmXP(30);
  farmEvent("build:" + t);
  return o;
}
function farmSawUpgrade(id) {
  const U = FSAW_UPGRADES[id], F = S.farm;
  if (!U || (id === "saege2" && (farmObj1("sw_halle") || {}).lvl >= 2) || (id === "kessel2" && F.enLv >= 1)) return false;
  if (flv() < U.lv) return toast("Erst ab Level " + U.lv + ".", "warn"), false;
  const miss = farmMissing(U.need);
  if (miss.length) return toast("Es fehlt: " + miss.map(m => fqty(m.id, m.need)).join(", "), "warn"), false;
  if (S.money < U.cost) return toast("Dafür fehlen " + eur(U.cost - S.money) + ".", "warn"), false;
  S.money -= U.cost; S.expense += U.cost;
  for (const k in U.need) farmTake(k, U.need[k]);
  logMoney("farm", U.n, -U.cost);
  if (id === "saege2") { const h = farmObj1("sw_halle"); h.lvl = 2; h.slots = Math.max(h.slots, 3); }
  if (id === "kessel2") F.enLv = 1;
  farmXP(40);
  farmEvent("upgrade:" + id);
  return true;
}
function farmObj1(t) { return S.farm.objs.find(o => o.t === t) || null; }

/* ------------------------------- Fischerei ------------------------------- */
function erbeFishPlots() {
  FFISHERY_ORDER.forEach(t => {
    if (S.farm.objs.some(o => o.t === t || (o.t === "f_plot" && o.k === t))) return;
    const B = FFISHERY[t], [w, d] = B.sz;
    farmAddObj({ t: "f_plot", k: t, x: Math.round(B.x - w / 2 + FG / 2), z: Math.round(B.z - d / 2 + FG / 2), r: 0, area: "see" });
  });
}
function farmFishBuildCheck(t) {
  const B = FFISHERY[t];
  if (!farmAreaOpen("see")) return "zu";
  if (flv() < B.lv) return "lv";
  if (farmMissing(B.need).length) return "missing";
  if (S.money < B.cost) return "money";
  return true;
}
function farmFishBuild(t) {
  const B = FFISHERY[t], F = S.farm;
  const plot = F.objs.find(o => o.t === "f_plot" && o.k === t);
  if (!plot || farmFishBuildCheck(t) !== true) return null;
  for (const id in B.need) farmTake(id, B.need[id]);
  S.money -= B.cost; S.expense += B.cost;
  logMoney("farm", B.n + " gebaut", -B.cost);
  F.objs = F.objs.filter(o => o !== plot);
  const [w, d] = B.sz;
  const o = farmAddObj({ t, x: Math.round(B.x - w / 2 + FG / 2), z: Math.round(B.z - d / 2 + FG / 2), r: 0, area: "see" });
  if (FMACHINES[t]) { o.q = []; o.done = []; o.slots = 2; }
  if (t === "f_boot") F.boat = Math.max(F.boat || 0, 1);
  farmXP(60 + Math.round(B.cost / 40));
  farmEvent("build:" + t);
  return o;
}
function farmBuyBoat() {
  const B = FBOATS[2], F = S.farm;
  if ((F.boat || 0) >= 2) return false;
  if (!farmObj1("f_boot")) return toast("Erst das Bootshaus bauen.", "warn"), false;
  if (flv() < B.lv) return toast("Erst ab Level " + B.lv + ".", "warn"), false;
  const miss = farmMissing(B.need);
  if (miss.length) return toast("Es fehlt: " + miss.map(m => fqty(m.id, m.need)).join(", "), "warn"), false;
  if (S.money < B.price) return toast("Dafür fehlen " + eur(B.price - S.money) + ".", "warn"), false;
  S.money -= B.price; S.expense += B.price;
  for (const k in B.need) farmTake(k, B.need[k]);
  logMoney("farm", "Motorboot gekauft", -B.price);
  F.boat = 2;
  farmXP(80);
  farmEvent("boat:motor");
  return true;
}
/* Tageszeit */
function farmTod() {
  const h = (S.time % 1440) / 60;
  return h >= 5 && h < 9 ? "morgen" : h >= 9 && h < 17 ? "tag" : h >= 17 && h < 21 ? "abend" : "nacht";
}
const FTOD_N = { morgen: "Morgen", tag: "Tag", abend: "Abend", nacht: "Nacht" };
/* Wetter wechselt alle ein, zwei Stunden */
function farmWeather() {
  const F = S.farm;
  if (!F.wx || S.time >= F.wx.until) {
    const keys = Object.keys(FWEATHER);
    let k = farmWPick(keys, x => FWEATHER[x].w);
    if (F.wx && k === F.wx.k && Math.random() < 0.5) k = farmWPick(keys, x => FWEATHER[x].w);
    F.wx = { k, until: S.time + 50 + Math.floor(Math.random() * 70) };
  }
  return F.wx.k;
}
/* Wer beißt hier gerade? Gewichte × Tageszeit × Wetter × Schwarm */
function farmFishOdds(gid) {
  const G = FGROUNDS.find(g => g.id === gid) || FGROUNDS[0];
  const tod = farmTod(), wx = farmWeather();
  const sw = farmEvOn("schwarm") && S.farm.ev.cur.data && S.farm.ev.cur.data.g === gid;
  const out = {};
  for (const id in G.fish) {
    let w = G.fish[id] * ((FFISH_TIME[id] || {})[tod] || 1) * ((FFISH_WX[id] || {})[wx] || 1);
    if (sw) w *= FFISH[id].v >= 20 ? 3 : 1.6;
    out[id] = w;
  }
  return out;
}
function farmCast() { if (!farmTake("koeder", 1)) return false; S.farm.stats.casts = (S.farm.stats.casts || 0) + 1; return true; }
/* Was hängt am Haken? Beim Biss gewürfelt, damit der Drill zum Fisch passt */
function farmRollCatch(gid) {
  if (Math.random() < 0.07) return { junk: farmWPick(FJUNK_FISH, x => x.w) };
  const odds = farmFishOdds(gid);
  return { id: farmWPick(Object.keys(odds), x => odds[x]) };
}
/* Fang: q = Qualität aus dem Drill (1 … 5), pre = Ergebnis von farmRollCatch */
function farmCatch(gid, q, pre) {
  pre = pre || farmRollCatch(gid);
  if (pre.junk) {
    const j = pre.junk;
    farmXP(1);
    if (j.m) { S.money += j.m; S.revenue += j.m; logMoney("farm", "Flaschenpost-Finderlohn", j.m); }
    return { junk: j.junk, i: j.i, m: j.m || 0, xp: 1 };
  }
  const id = pre.id;
  if (farmRoom(id) < 1) { farmFull("fisch"); return { full: true, id }; }
  q = clamp(Math.round(q || 3), 1, 5);
  farmAdd(id, 1, q);
  const xp = FITEMS[id].xp + 2;
  farmXP(xp);
  const F = S.farm;
  F.stats.catch++;
  F.stats.species[id] = (F.stats.species[id] || 0) + 1;
  farmEvent("catch");
  farmEvent("catch:" + id);
  farmEvent("catch:" + gid + ":" + id);
  if (farmWeather() === "regen" || farmTod() === "nacht") farmEvent("catch:hard");
  return { id, n: 1, q, xp };
}
/* Fanggründe, die man gerade erreicht */
function farmGroundOk(g) { return g.boat === 0 ? !!farmObj1("f_steg") : (S.farm.boat || 0) >= g.boat; }

/* --------------------------- Hof-Ausbaustufen ---------------------------- */
function farmStageNext() { return FHOF_STAGES[(S.farm.stage || 1) + 1] || null; }
function farmStageCheck() {
  const N0 = farmStageNext();
  if (!N0) return "max";
  if (flv() < N0.lv) return "lv";
  if (farmMissing(N0.need).length) return "missing";
  if (S.money < N0.cost) return "money";
  return true;
}
function farmStageUp() {
  if (farmStageCheck() !== true) return false;
  const N0 = farmStageNext(), F = S.farm;
  S.money -= N0.cost; S.expense += N0.cost;
  for (const id in N0.need) farmTake(id, N0.need[id]);
  logMoney("farm", "Hof ausgebaut: " + N0.n, -N0.cost);
  F.stage = (F.stage || 1) + 1;
  farmBoundsUpdate();
  farmXP(60 + F.stage * 40);
  farmClover(4, "Hof ausgebaut");
  farmEvent("stage");
  return true;
}
/* Bebaubare Fläche: in Stufe 4 zwei Kacheln mehr nach jeder Seite */
function farmBoundsUpdate() {
  const big = S.farm && (S.farm.stage || 1) >= 4;
  FIN0 = big ? 1 : 3; FIN1 = big ? 31 : 29;
}
function farmStageStoreBonus(st) { const s = S.farm.stage || 1; return st === "silo" || st === "barn" ? [0, 0, 20, 60, 120][s] : 0; }
function farmStageSlotBonus() { const s = S.farm.stage || 1; return s >= 3 ? 2 : s >= 2 ? 1 : 0; }
function machSlots(o) {
  let n = o.slots || 2;
  if (FMACHINES[o.t] && FMACHINES[o.t].hof !== false && !FMACHINES[o.t].saw && !FMACHINES[o.t].fish) n += farmStageSlotBonus();
  if (farmCos("werkzeugguertel")) n += 1;
  return n;
}

/* -------------------------------- Gerümpel ------------------------------- */
function farmClearJunk(o) {
  const J = FJUNK[o.k] || FJUNK.unkraut;
  if (!farmStaUse(J.sta)) return null;
  const got = [];
  for (const id in J.gain) { const n = Math.min(J.gain[id], farmRoom(id)); if (n > 0) { farmAdd(id, n, 3); got.push({ id, n, xp: 0 }); } }
  if (J.m) { S.money += J.m; S.revenue += J.m; }
  S.farm.objs = S.farm.objs.filter(x => x !== o);
  S.farm.stats.cleared++;
  farmXP(5);
  farmEvent("clear");
  return { got, m: J.m || 0, xp: 5 };
}

/* ------------------------------ Mitarbeiter ------------------------------ */
function staffSlots() { let n = 0; FSTAFF_SLOTS.forEach(([lv, k]) => { if (flv() >= lv) n = k; }); return n; }
function staffDay() { return Math.floor(S.time / 1440); }
function staffCands() {
  const F = S.farm;
  if (!F.cand || F.cand.day !== staffDay()) {
    const roles = Object.keys(FSTAFF_ROLES).filter(r => flv() >= FSTAFF_ROLES[r].lv);
    const list = [], names = FSTAFF_NAMES.filter(n => !F.staff.some(s => s.name === n));
    roles.forEach(r => {
      const R = FSTAFF_ROLES[r], tr = pick(FSTAFF_TRAITS);
      const name = names.splice(Math.floor(Math.random() * names.length), 1)[0] || pick(FSTAFF_NAMES);
      const wage = Math.round(R.wage[0] + (R.wage[1] - R.wage[0]) * ((tr.p - 8) / 10) + Math.random() * 4);
      list.push({ id: "c" + (S.seq++), role: r, name, perk: tr.p, trait: tr.t, wage, av: typeof avRandom === "function" ? avRandom() : null });
    });
    F.cand = { day: staffDay(), list };
  }
  return F.cand.list.filter(c => !F.staff.some(s => s.id === c.id));
}
function staffHire(cid) {
  const F = S.farm, c = (F.cand && F.cand.list || []).find(x => x.id === cid);
  if (!c) return false;
  if (F.staff.length >= staffSlots()) return toast("Mehr Leute gehen gerade nicht – ab dem nächsten Level.", "warn"), false;
  const fee = c.wage * 2;
  if (S.money < fee) return toast("Für das Antrittsgeld fehlen " + eur(fee - S.money) + ".", "warn"), false;
  S.money -= fee; S.expense += fee;
  logMoney("farm", "Eingestellt: " + c.name + " (" + FSTAFF_ROLES[c.role].n + ")", -fee);
  F.staff.push(Object.assign({}, c, { since: S.time, fed: true, work: S.time }));
  farmXP(15);
  farmEvent("staff");
  return true;
}
function staffFire(id) { const F = S.farm; F.staff = F.staff.filter(s => s.id !== id); }
/* Bonus einer Rolle (0 … 0,18) – hungrig nur halb */
function staffPerk(role) {
  if (!S.farm || !S.farm.staff) return 0;
  let p = 0;
  S.farm.staff.forEach(s => { if (s.role === role) p = Math.max(p, (s.perk / 100) * (s.fed === false ? 0.5 : 1)); });
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
  if (hungry) toast("👷 " + hungry + " Mitarbeiter ohne Brotzeit – heute nur halb so fleißig. Back was im Ofen!", "warn");
}
/* Arbeiten von allein: Holz, Fisch, Gießen */
function staffWork() {
  const F = S.farm;
  F.staff.forEach(s => {
    const gap = s.role === "holzfaeller" ? 60 : s.role === "fischer" ? 45 : s.role === "farmer" ? 20 : 0;
    if (!gap || S.time - (s.work || 0) < gap) return;
    s.work = S.time;
    if (s.role === "holzfaeller" && farmAreaOpen("wald")) {
      const id = Math.random() < 0.5 ? "birke" : "kiefer";
      if (farmRoom(id) > 0) { farmAdd(id, 1, 3); s.last = id; }
    }
    if (s.role === "fischer" && farmObj1("f_steg")) {
      const odds = farmFishOdds("steg"), id = farmWPick(Object.keys(odds), x => odds[x]);
      if (farmRoom(id) > 0) { farmAdd(id, 1, 3); s.last = id; F.stats.species[id] = (F.stats.species[id] || 0) + 1; }
    }
    if (s.role === "farmer") {
      F.objs.filter(o => o.t === "field" && fieldState(o) === "grow" && !o.w).slice(0, 2).forEach(o => { o.w = true; o.end = S.time + (o.end - S.time) * 0.75; });
    }
  });
}

/* ------------------------------- Ereignisse ------------------------------- */
function farmEvOn(k) { const c = S.farm && S.farm.ev && S.farm.ev.cur; return !!(c && c.k === k && S.time < c.until); }
function farmEvTick() {
  const F = S.farm, E = F.ev;
  if (E.cur && S.time >= E.cur.until) farmEvEnd();
  if (E.cur || S.time < E.next) return;
  const keys = Object.keys(FEVENTS).filter(k => {
    const D = FEVENTS[k];
    if (D.daily && (E.days || {})[k] === staffDay()) return false;   /* der Händler kommt nur einmal am Tag */
    if (D.area && !farmAreaOpen(D.area)) return false;
    if (D.need && !D.need()) return false;
    if (D.win) { const h = (S.time % 1440) / 60; if (D.win[0] < D.win[1] ? h < D.win[0] || h >= D.win[1] : h < D.win[0] && h >= D.win[1]) return false; }
    if (k === "defekt" && staffPerk("mechaniker")) return false;
    return true;
  });
  if (!keys.length) { E.next = S.time + 10; return; }
  const k = farmWPick(keys, x => FEVENTS[x].w);
  farmEvStart(k);
}
function farmEvStart(k) {
  const F = S.farm, D = FEVENTS[k];
  const c = { k, t0: S.time, until: S.time + D.dur, data: {} };
  if (D.daily) { F.ev.days = F.ev.days || {}; F.ev.days[k] = staffDay(); }
  if (k === "schwarm") { const gs = FGROUNDS.filter(farmGroundOk); c.data.g = (gs.length ? pick(gs) : FGROUNDS[0]).id; }
  if (k === "nachbar") {
    const pool = ["bretter", "balken", "kisten", "pfosten", "platten", "brennholz"].filter(id => flv() >= 9);
    const a = pick(pool), b = pick(pool.filter(x => x !== a));
    c.data.items = { [a]: 2 + Math.floor(Math.random() * 3), [b]: 1 + Math.floor(Math.random() * 2) };
  }
  if (k === "haendler") c.data.deals = farmTraderDeals();
  if (k === "hirsch" || k === "schatz") {
    const cl = FWORLD.clearings.filter(q => (q[0] > -58 || q[1] > -58) || farmAreaOpen("altwald"));
    const q = pick(cl);
    c.data.x = q[0] + (Math.random() - 0.5) * 3; c.data.z = q[1] + (Math.random() - 0.5) * 3;
  }
  if (k === "pilze") {
    c.data.spots = [];
    for (let i = 0; i < 5; i++) {
      const t = pick(F.trees.filter(t => t.area === "wald"));
      if (t) c.data.spots.push({ x: t.x + 1.3 * Math.cos(i * 2), z: t.z + 1.3 * Math.sin(i * 2), done: false });
    }
  }
  if (k === "reh") {
    const onForest = farmAreaOpen("wald") && Math.random() < 0.6;
    const p = onForest ? pick(FWORLD.paths)[1] : [18 + Math.random() * 8, -14 + Math.random() * 6];
    c.data.x = p[0]; c.data.z = p[1];
  }
  if (k === "lieferung") { c.data.x = 5 + (Math.random() - 0.5) * 2; c.data.z = 15.2; }
  if (k === "defekt") { const h = farmObj1("sw_halle"); if (h) h.broken = S.time; }
  if (k === "sturm") c.data.hit = false;
  F.ev.cur = c;
  F.stats.events++;
  if (typeof farmEvView === "function") farmEvView("start", c);
}
function farmEvEnd() {
  const F = S.farm, c = F.ev.cur;
  if (!c) return;
  if (c.k === "sturm" && !c.data.hit) farmStormHit(c);
  if (c.k === "defekt") { const h = farmObj1("sw_halle"); if (h && h.broken) farmMachFix(h); }
  F.ev.cur = null;
  F.ev.next = S.time + 8 + Math.floor(Math.random() * 7);
  if (typeof farmEvView === "function") farmEvView("end", c);
}
/* Sturm vorbei: ein paar Bäume liegen am Boden */
function farmStormHit(c) {
  c.data.hit = true;
  const up = S.farm.trees.filter(t => t.st === "up" && t.sz >= 2 && treeOpen(t) && t.area);
  const hit = [];
  for (let i = 0; i < 3 && up.length; i++) {
    const t = up.splice(Math.floor(Math.random() * up.length), 1)[0];
    t.st = "fallen"; t.t = S.time + 600; t.fall = Math.random() * 6.28;
    hit.push(t.id);
  }
  c.data.fallen = hit;
}
/* Maschine wieder flott: die Zeit des Ausfalls wird drangehängt */
function farmMachFix(o) {
  if (!o.broken) return;
  const lost = S.time - o.broken;
  (o.q || []).forEach(it => { it.start += lost; it.end += lost; });
  o.broken = 0;
  if (farmEvOn("defekt")) { S.farm.ev.cur.until = S.time; }
}
/* Händler: drei Angebote */
function farmTraderDeals() {
  const lv = flv(), deals = [];
  deals.push({ kind: "buy", id: "kirsche-setzling", n: "Edelholz-Stamm (Walnuss)", item: "edelholz", qty: 1, price: 95, i: "💎" });
  const sellable = Object.keys(S.farm.inv).filter(id => FITEMS[id] && FITEMS[id].v >= 4 && farmInv(id) >= 2 && FITEMS[id].k !== "energy");
  if (sellable.length) { const id = pick(sellable); deals.push({ kind: "sell", item: id, qty: Math.min(4, farmInv(id)), mult: 1.4, i: FITEMS[id].i }); }
  deals.push({ kind: "clover", qty: 2, price: 60 + lv * 10, i: "🍀" });
  return deals;
}
function farmTraderDeal(i) {
  const c = S.farm.ev.cur;
  if (!c || c.k !== "haendler") return false;
  const d = c.data.deals[i];
  if (!d || d.done) return false;
  if (d.kind === "buy" || d.kind === "clover") {
    if (S.money < d.price) return toast("Dafür fehlen " + eur(d.price - S.money) + ".", "warn"), false;
    if (d.kind === "buy" && farmRoom(d.item) < d.qty) return farmFull(FITEMS[d.item].st), false;
    S.money -= d.price; S.expense += d.price;
    logMoney("farm", "Fliegender Händler", -d.price);
    if (d.kind === "buy") farmAdd(d.item, d.qty, 5); else farmClover(d.qty, "Händler");
  } else {
    if (farmInv(d.item) < d.qty) return toast("Davon ist nicht mehr genug da.", "warn"), false;
    const m = Math.round(FITEMS[d.item].v * d.qty * d.mult * 10) / 10;
    farmTake(d.item, d.qty);
    S.money += m; S.revenue += m; S.farm.stats.earned += m;
    logMoney("farm", "Fliegender Händler · " + fqty(d.item, d.qty), m);
  }
  d.done = true;
  farmXP(5);
  return true;
}
/* Nachbar holt die Ware selbst ab: guter Preis, ein Kleeblatt dazu */
function farmNeighborDeliver() {
  const c = S.farm.ev.cur;
  if (!c || c.k !== "nachbar") return false;
  if (!farmHasAll(c.data.items)) return toast("Es fehlt: " + farmMissing(c.data.items).map(m => fqty(m.id, m.need)).join(", "), "warn"), false;
  const m = Math.round(Object.keys(c.data.items).reduce((s, id) => s + FITEMS[id].v * c.data.items[id], 0) * 1.5);
  for (const id in c.data.items) farmTake(id, c.data.items[id]);
  S.money += m; S.revenue += m; S.farm.stats.earned += m;
  logMoney("farm", "Nachbar Krüger", m);
  farmXP(25);
  farmClover(2, "Nachbar");
  farmEvent("deliver:wood");
  c.until = S.time;
  return m;
}
/* Belohnungen der kleinen Ereignisse */
function farmEvReward(kind) {
  const c = S.farm.ev.cur;
  if (!c) return null;
  let r = null;
  if (kind === "hirsch" && c.k === "hirsch" && !c.data.done) { c.data.done = true; farmClover(3, "Weißer Hirsch"); farmXP(25); r = { clover: 3, xp: 25 }; c.until = S.time + 1; }
  if (kind === "reh" && c.k === "reh" && !c.data.done) { c.data.done = true; farmXP(5); r = { xp: 5 }; c.until = S.time + 1; }
  if (kind === "lieferung" && c.k === "lieferung" && !c.data.done) {
    c.data.done = true;
    const gifts = [["brot", 3], ["apfelkuchen", 1], ["bretter", 1], ["koeder", 6], ["brennholz", 2]].filter(([id]) => FITEMS[id] && FITEMS[id].st && farmRoom(id) > 0);
    const g = gifts.length ? pick(gifts) : null;
    if (g) farmAdd(g[0], Math.min(g[1], farmRoom(g[0])), 4);
    farmClover(1, "Lieferung"); farmXP(10);
    r = { item: g && g[0], n: g && g[1], clover: 1, xp: 10 }; c.until = S.time + 1;
  }
  if (kind === "schatz" && c.k === "schatz" && !c.data.done) {
    c.data.done = true;
    const m = 50 + Math.floor(Math.random() * 150), cl = 1 + Math.floor(Math.random() * 4);
    S.money += m; S.revenue += m; logMoney("farm", "Schatz im Wald", m);
    farmClover(cl, "Schatz");
    farmXP(30);
    r = { m, clover: cl, xp: 30 };
    if (Math.random() < 0.35 && farmRoom("edelholz") > 0) { farmAdd("edelholz", 1, 5); r.item = "edelholz"; r.n = 1; }
    c.until = S.time + 1;
  }
  return r;
}
function farmMushroom(i) {
  const c = S.farm.ev.cur;
  if (!c || c.k !== "pilze") return null;
  const s = c.data.spots[i];
  if (!s || s.done) return null;
  if (farmRoom("pilze") < 1) { farmFull("barn"); return null; }
  s.done = true;
  farmAdd("pilze", 1, 4);
  farmXP(3);
  if (c.data.spots.every(x => x.done)) c.until = S.time + 1;
  return { id: "pilze", n: 1, xp: 3 };
}

/* ------------------------- Kleeblätter & Kosmetik ------------------------- */
function farmClover(n, why) {
  if (!S.farm || !n) return;
  S.farm.clover = (S.farm.clover || 0) + n;
  if (typeof farmCloverFly === "function") farmCloverFly(n, why);
}
function farmCos(id) { return !!(S.farm && S.farm.cos && S.farm.cos.own[id]); }
function farmCosBuy(id) {
  const C = FCOSMETIC.find(c => c.id === id), F = S.farm;
  if (!C || F.cos.own[id]) return false;
  if ((F.clover || 0) < C.price) return toast("Dafür fehlen " + (C.price - (F.clover || 0)) + " 🍀.", "warn"), false;
  F.clover -= C.price;
  F.cos.own[id] = S.time;
  if (C.skin) Object.assign(F.cos.on, C.skin);
  farmEvent("cos:" + id);
  return true;
}
/* Tagesbonus: einmal am Tag (echte Tage) */
function farmDailyBonus() {
  const F = S.farm, d = new Date().toISOString().slice(0, 10);
  if (F.daily === d) return 0;
  F.daily = d;
  farmClover(2, "Tagesbonus");
  return 2;
}

/* ------------------------------ Verkaufsstand ----------------------------- */
function stallObj(market) { return market ? farmObj1("f_markt") : farmObj1("stall"); }
function stallState(market) { return market ? S.farm.mstall : S.farm.stall; }
function stallCap(market) { return market ? FSTALL.market : FSTALL.slots[(S.farm.stage || 1) - 1]; }
function stallBase(id, n, market) { return FITEMS[id].v * n * (market && FITEMS[id].st === "fisch" ? 1 + FSTALL.premium : 1); }
function stallPut(market, id, n, price) {
  const St = stallState(market);
  if (St.slots.filter(Boolean).length >= stallCap(market)) return toast("Alle Plätze im Stand sind belegt.", "warn"), false;
  if (farmInv(id) < n) return false;
  farmTake(id, n);
  const q = 3;
  const free = St.slots.findIndex(x => !x);
  const it = { id, n, p: Math.round(price * 10) / 10, t: S.time, q };
  if (free >= 0) St.slots[free] = it; else St.slots.push(it);
  farmEvent("stall:put");
  return true;
}
function stallTake(market, i) {
  const St = stallState(market), it = St.slots[i];
  if (!it) return false;
  if (it.sold) { S.money += it.p; S.revenue += it.p; S.farm.stats.earned += it.p; logMoney("farm", (market ? "Fischmarkt" : "Verkaufsstand") + " · " + fqty(it.id, it.n), it.p); St.slots[i] = null; return it.p; }
  if (farmRoom(it.id) < it.n) return farmFull(FITEMS[it.id].st), false;
  farmAdd(it.id, it.n, it.q || 3); St.slots[i] = null;
  return true;
}
function stallCollectAll(market) {
  const St = stallState(market);
  let m = 0;
  St.slots.forEach((it, i) => { if (it && it.sold) m += stallTake(market, i) || 0; });
  return m;
}
/* Kundschaft kommt vorbei: teurer → seltener */
function stallTick(market, dt) {
  const St = stallState(market);
  if (market && !stallObj(true)) return;
  St.slots.forEach(it => {
    if (!it || it.sold) return;
    const base = stallBase(it.id, it.n, market) * (market && farmEvOn("fischpreis") ? 1.3 : 1);
    const r = it.p / Math.max(0.1, base);
    const chance = 0.045 * clamp(1.9 - r, 0.08, 1.4) * dt;
    if (Math.random() < chance) {
      it.sold = true;
      S.farm.stats.stallSold++;
      farmXP(Math.max(1, Math.round(FITEMS[it.id].xp * it.n * 0.5)));
      farmEvent("stall:sold", 1);
    }
  });
}

/* --------------------------------- Takt ---------------------------------- */
function farmErbeTick(dt) {
  const F = S.farm;
  if (!F || F.sold) return;
  farmSta();
  farmTreesTick();
  farmAreaCheck();
  farmWeather();
  farmEvTick();
  staffWork();
  stallTick(false, dt || 1);
  stallTick(true, dt || 1);
  const day = staffDay();
  if (F.day == null) F.day = day;
  if (day > F.day) { F.day = day; staffDaily(); }
}
