/* =========================================================================
   LOGISTIKA – farm.js
   Das Erbe: Obsthof bei Werder oder Fischerei in Warnemünde. Spielstand,
   Felder und Reusen, Bäume und Muschelleinen, Tiere und Fische mit
   Platz-Qualität, Masttiere für den Metzger, Gebäude mit Rezepten (auch
   Kutterfahrten mit Diesel und Nebenprodukten), Lager, Einkauf, Angeln,
   Bestellungen aus der Gegend (laufen als echte Aufträge über die
   Disposition), Notizbuch/Logbuch, Übergang zur Spedition und Verkauf.
   Die Darstellung steckt in farmview.js und fishview.js.
   ========================================================================= */

/* ------------------------------ Zustand ------------------------------- */
function farmOn() { return !!(S && S.farm && !S.farm.sold); }
/* vor der Speditionsgründung: nur Hof, eigene Ware, keine fremden Aufträge */
function farmPhase() { return farmOn() && !S.farm.logi; }
function logiOn() { return !S || !S.farm || !!S.farm.logi || !!S.farm.sold; }

const FG = 32;                         /* Raster 32 × 32 Kacheln */
const FIN0 = 3, FIN1 = 29;             /* bebaubar: Kacheln 3 … 28 */
/* Objekte, die im Wasser stehen (Fischerei) */
const FWATER_T = new Set(["pot", "mline", "netz", "kutter", "steg"]);
function needZone(t, k) { return FWATER_T.has(t) || (t === "deco" && FDECO[k] && FDECO[k].water) ? "w" : "l"; }
function objWater(o) { return needZone(o.t, o.k) === "w"; }
function penKind(o) { for (const k in FANIMALS) if (FANIMALS[k].house === o.t) return k; return null; }

function farmNew(kind) {
  kind = FSITES[kind] ? kind : "hof";
  farmUseSite(kind);
  const cap = {};
  FSITE.stores.forEach(st => { cap[st] = 1; });
  const F = {
    v: 1, kind, logi: false, sold: null, snd: true, seq: 1,
    objs: [], inv: {}, cap,
    stats: { harvest: 0, made: 0, eggs: 0, milk: 0, deliv: 0, earned: 0, pearls: 0, angel: 0, trips: 0, meat: 0, prod: {} },
    qi: 0, qp: 0, qdone: false, qv: 3, econ: 2, lastOrd: -999, tut: { step: 0, done: false }, born: S.time, quick: {}
  };
  S.farm = F;
  const add = (t, x, z, extra) => farmAddObj(Object.assign({ t, x, z }, extra || {}));
  if (kind === "fisch") farmStartFisch(add, F); else farmStartHof(add, F);
  return F;
}
function farmStartHof(add, F) {
  add("house", 5, 4);
  add("barn", 11, 4);
  add("silo", 16, 5);
  add("mill", 19, 4, { q: [], done: [], slots: 2 });
  add("bakery", 5, 10, { q: [], done: [], slots: 2 });
  /* Hühnerstall: drei Hühner, eines hat schon gelegt */
  const coop = add("coop", 4, 16, { lvl: 1, animals: [] });
  for (let i = 0; i < 3; i++) coop.animals.push({ id: F.seq++, v: i % 3, fed: S.time - 1, q: 3 });
  /* Felder: drei reif mit Weizen, drei leer */
  [[11, 11], [13, 11], [15, 11], [11, 13], [13, 13], [15, 13]].forEach(([x, z], i) =>
    add("field", x, z, i < 3 ? { crop: "weizen", end: S.time - 1, w: false, rot: 0, last: null } : { crop: null, last: "mais" }));
  add("tree", 21, 9, { kind: "apfel", end: S.time - 1, w: false, h: 2 });
  add("tree", 23, 9, { kind: "apfel", end: S.time - 1, w: false, h: 2 });
  add("board", 19, 25);
  add("shed", 23, 25);
  add("deco", 17, 12, { k: "scarecrow" });
  add("deco", 4, 9, { k: "flowers" });
  add("deco", 10, 9, { k: "flowers" });
  add("deco", 15, 9, { k: "hayBale" });
  add("deco", 22, 27, { k: "mailbox" });
  add("deco", 26, 13, { k: "leafTree", arg: 1.1 });
  add("deco", 9, 21, { k: "bushes" });
  add("deco", 25, 5, { k: "pine", arg: 1.0 });
  /* Startvorrat aus Opas Scheune */
  farmAdd("weizen", 6, 3); farmAdd("mais", 4, 3); farmAdd("hfutter", 6, 3); farmAdd("apfel", 2, 3);
}
/* Tante Gesches Kai: Wasser im Norden (Reihen 3 … 11), Kai auf Reihe 12 */
function farmStartFisch(add, F) {
  const mach = () => ({ q: [], done: [], slots: 2 });
  add("house", 4, 21);
  add("kuehl", 23, 15);
  add("speicher", 23, 19);
  add("fishhalle", 14, 15, mach());
  add("smoke", 9, 15, mach());
  add("feedk", 5, 15, mach());
  add("kutter", 22, 5, mach());
  add("steg", 15, 7);
  /* Netzgehege: ein Schwarm ist groß genug, einer hat Hunger */
  const net = add("netz", 4, 5, { lvl: 1, animals: [] });
  net.animals.push({ id: F.seq++, v: 0, fed: S.time - 1, q: 3 });
  net.animals.push({ id: F.seq++, v: 1, fed: null, q: 3 });
  /* Reusen: zwei voller Krabben, zwei leer */
  [[9, 8], [11, 8], [9, 5], [11, 5]].forEach(([x, z], i) =>
    add("pot", x, z, i < 2 ? { kind: "krabbe", end: S.time - 1, bq: 3 } : { kind: null }));
  /* Muschelleinen: eine erntereif, eine wächst noch */
  add("mline", 17, 6, { kind: "miesmuschel", end: S.time - 1, w: false, h: 2 });
  add("mline", 19, 6, { kind: "miesmuschel", end: S.time + 200, w: false, h: 1 });
  add("board", 19, 25);
  add("shed", 23, 25);
  add("deco", 17, 13, { k: "anker" });
  add("deco", 12, 13, { k: "fischkisten" });
  add("deco", 13, 13, { k: "fischkisten" });
  add("deco", 8, 13, { k: "bojen" });
  add("deco", 27, 13, { k: "rettungsring" });
  add("deco", 10, 21, { k: "netzgestell" });
  add("deco", 22, 27, { k: "mailbox" });
  add("deco", 3, 27, { k: "strandhafer" });
  add("deco", 27, 27, { k: "strandhafer" });
  add("deco", 15, 22, { k: "strandkorb" });
  /* Startvorrat aus Tante Gesches Speicher */
  farmAdd("hering", 3, 3); farmAdd("koeder", 8, 3); farmAdd("fischfutter", 4, 3); farmAdd("abfall", 2, 3);
}

function farmAddObj(o) {
  const F = S.farm;
  o.id = F.seq++;
  o.r = o.r || 0;
  F.objs.push(o);
  return o;
}
function farmObj(id) { return S.farm.objs.find(o => o.id === id) || null; }
/* Kachelgröße eines Objekts (Ausläufe wachsen mit der Ausbaustufe) */
function farmSize(o) {
  let w, d;
  if (FPENS[o.t]) { const P = FPENS[o.t], p = P[Math.min(P.length, o.lvl || 1) - 1]; w = p.w; d = p.d; }
  else if (o.t === "deco") { const s = (FDECO[o.k] || { sz: [1, 1] }).sz; w = s[0]; d = s[1]; }
  else { const s = FSIZE[o.t] || [1, 1]; w = s[0]; d = s[1]; }
  return o.r ? [d, w] : [w, d];
}
/* Weltmitte eines Objekts */
function farmCenter(o) {
  const [w, d] = farmSize(o);
  return [o.x + w / 2 - FG / 2, o.z + d / 2 - FG / 2];
}

/* Kieswege: dort wird nicht gebaut (Hauptweg vom Tor, Querweg vor Haus und Scheune) */
const FPATH = new Set();
for (let j = 8; j < FIN1; j++) { FPATH.add(j * FG + 20); FPATH.add(j * FG + 21); }
for (let i = 5; i < 22; i++) FPATH.add(8 * FG + i);
FSITES.hof.path = FPATH;
/* Belegung des Rasters (ohne das ausgenommene Objekt); Wege zählen als belegt (-1) */
function farmOcc(except) {
  const g = new Int32Array(FG * FG);
  (FSITE.path || FPATH).forEach(k => { g[k] = -1; });
  S.farm.objs.forEach(o => {
    if (except && o.id === except) return;
    const [w, d] = farmSize(o);
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
      const x = o.x + i, z = o.z + j;
      if (x >= 0 && z >= 0 && x < FG && z < FG) g[z * FG + x] = o.id;
    }
  });
  return g;
}
/* passt die Fläche? Im Wasser nur Wasserobjekte, an Land nur Landobjekte */
function zoneOk(x, z, w, d, t, k) {
  if (!FSITE.zone || !t) return true;
  const need = needZone(t, k);
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (FSITE.zone(x + i, z + j) !== need) return false;
  return true;
}
function farmFits(x, z, w, d, except, t, k) {
  if (x < FIN0 || z < FIN0 || x + w > FIN1 || z + d > FIN1) return false;
  if (!zoneOk(x, z, w, d, t, k)) return false;
  const g = farmOcc(except);
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (g[(z + j) * FG + x + i]) return false;
  return true;
}
/* freier Platz möglichst nah an (px, pz) */
function farmFreeSpot(w, d, px, pz, t, k) {
  const g = farmOcc();
  let best = null, bd = Infinity;
  for (let z = FIN0; z + d <= FIN1; z++)
    for (let x = FIN0; x + w <= FIN1; x++) {
      let ok = zoneOk(x, z, w, d, t, k);
      for (let i = 0; i < w && ok; i++) for (let j = 0; j < d; j++) if (g[(z + j) * FG + x + i]) { ok = false; break; }
      if (!ok) continue;
      const dd = Math.hypot(x + w / 2 - (px == null ? 16 : px), z + d / 2 - (pz == null ? 16 : pz));
      if (dd < bd) { bd = dd; best = [x, z]; }
    }
  return best;
}

/* ------------------------------ Lager --------------------------------- */
function farmInv(id) { return (S.farm.inv[id] && S.farm.inv[id].n) || 0; }
function farmQ(id) { const e = S.farm.inv[id]; return e && e.n ? e.q : 0; }
function farmStoreCap(st) { const s = FSTORE[st]; return s.base + s.step * ((S.farm.cap[st] || 1) - 1); }
function farmStoreUsed(st) {
  let n = 0;
  for (const id in S.farm.inv) if (FITEMS[id] && FITEMS[id].st === st) n += S.farm.inv[id].n;
  return n;
}
function farmRoom(id) { const st = FITEMS[id].st; return farmStoreCap(st) - farmStoreUsed(st); }
/* hinzufügen mit Durchschnittsqualität */
function farmAdd(id, n, q) {
  if (!n) return;
  const e = S.farm.inv[id] || (S.farm.inv[id] = { n: 0, q: 3 });
  e.q = (e.q * e.n + (q || 3) * n) / (e.n + n);
  e.n += n;
}
function farmTake(id, n) {
  const e = S.farm.inv[id];
  if (!e || e.n < n) return false;
  e.n -= n;
  if (!e.n) delete S.farm.inv[id];
  return true;
}
function farmHasAll(items) { return Object.keys(items).every(id => farmInv(id) >= items[id]); }
function farmMissing(items) {
  return Object.keys(items).filter(id => farmInv(id) < items[id]).map(id => ({ id, need: items[id] - farmInv(id) }));
}
function qStars(q) { const s = Math.max(1, Math.min(5, Math.round(q || 0))); return "★".repeat(s) + "☆".repeat(5 - s); }

/* ------------------------ Mengen anzeigen -----------------------------
   Gerechnet wird in Gebinden (Sack, Kiste, Schachtel …), gezeigt wird die
   echte Menge: „20 kg Weizen“, „18 Eier“, „2 Brote“, „750 g Butter“.    */
const fnum = x => fmt(x, Math.abs(x - Math.round(x)) > 1e-6 ? 1 : 0);
function famt(id, n) {
  const it = FITEMS[id];
  let x = n * (it.a || 1), u = it.u || "";
  if (u === "g" && x >= 1000) { x /= 1000; u = "kg"; }
  return fnum(x) + (u ? " " + u : "");
}
function fqty(id, n) {
  const it = FITEMS[id], x = n * (it.a || 1);
  if (it.u) return famt(id, n) + " " + it.n;
  return fnum(x) + " " + (Math.abs(x - 1) < 1e-6 && it.sg ? it.sg : it.n);
}
/* „6/18“, „4/6 kg“ – vorhanden/benötigt */
function fpair(id, have, need) {
  const it = FITEMS[id], a = it.a || 1;
  let u = it.u || "", k = 1;
  if (u === "g" && need * a >= 1000) { u = "kg"; k = 1000; }
  return fnum(have * a / k) + "/" + fnum(need * a / k) + (u ? " " + u : "");
}
/* Geldbeträge auf dem Hof: ganze Euro ohne Komma, sonst mit Cent */
function eur(n) {
  const r = Math.round(n * 100) / 100;
  return Math.abs(r - Math.round(r)) < 0.005 ? fmt(Math.round(r), 0) + " €" : fmt(r, 2) + " €";
}

/* ------------------------------- XP ----------------------------------- */
function farmXP(n) {
  if (!n) return;
  S.xp += n;
  checkLevel();
}

/* ---------------------------- Freischaltung --------------------------- */
function farmCropOk(id) { return FCROPS[id] && FCROPS[id].lv <= level(); }
function farmPotOk(id) { return FPOTS[id] && FPOTS[id].lv <= level(); }
/* Lässt sich die Ware im Moment überhaupt herstellen (oder kaufen)? */
function farmCanMake(id, seen) {
  const it = FITEMS[id], lv = level(), objs = S.farm.objs;
  if (!it) return false;
  seen = seen || new Set();
  if (seen.has(id)) return false;
  seen.add(id);
  if (it.k === "crop") return farmCropOk(id);
  if (it.k === "fruit") return objs.some(o => o.t === "tree" && o.kind === id);
  if (farmPotOk(id) && objs.some(o => o.t === "pot")) return true;
  for (const lk in FLINES) {
    const L = FLINES[lk];
    if ((L.out === id || (L.extra && L.extra[id]) || (id === "perle" && L.pearl)) && objs.some(o => o.t === "mline" && o.kind === lk)) return true;
  }
  for (const ak in FANIMALS) { const A = FANIMALS[ak]; if (A.out === id && objs.some(o => o.t === A.house && o.animals.length)) return true; }
  const sh = FSHOP.find(s => s.item === id);
  if (sh && sh.lv <= lv) return true;
  for (const mk in FMACHINES) {
    if (!objs.some(o => o.t === mk)) continue;
    for (const r of FMACHINES[mk].recipes) {
      if (r.lv > lv || (r.id !== id && !(r.by && r.by[id]))) continue;
      if (Object.keys(r.in).every(x => farmCanMake(x, new Set(seen)))) return true;
    }
  }
  return false;
}

/* ------------------------------- Felder ------------------------------- */
function fieldState(o) {
  if (!o.crop) return "empty";
  return S.time >= o.end ? "ripe" : "grow";
}
function fieldStage(o) {
  if (!o.crop) return -1;
  const t = FCROPS[o.crop].t, left = o.end - S.time;
  if (left <= 0) return 3;
  const f = 1 - left / t;
  return f < 0.12 ? 0 : f < 0.5 ? 1 : 2;
}
function farmPlant(o, crop) {
  if (!o || o.t !== "field" || o.crop || !farmCropOk(crop)) return false;
  const c = FCROPS[crop];
  if (S.money < c.seed) { toast("Für Saatgut fehlt das Geld.", "warn"); return false; }
  S.money -= c.seed; S.expense += c.seed;
  o.crop = crop; o.end = S.time + c.t; o.w = false; o.rot = o.last && o.last !== crop ? 1 : 0;
  farmEvent("plant:" + crop);
  return true;
}
function farmWater(o) {
  if (!o) return false;
  if ((o.t === "field" && fieldState(o) === "grow" && !o.w) || ((o.t === "tree" || o.t === "mline") && S.time < o.end && !o.w)) {
    o.w = true; o.end = S.time + (o.end - S.time) * 0.75;
    farmXP(1);
    farmEvent("water"); return true;
  }
  return false;
}
/* Ernte: 2 je Feld, manchmal 3 – Qualität aus Gießen und Fruchtwechsel */
function farmHarvest(o) {
  if (!o || o.t !== "field" || fieldState(o) !== "ripe") return null;
  const id = o.crop;
  let n = 2 + (Math.random() < 0.15 ? 1 : 0);
  if (farmRoom(id) < n) { farmFull(FITEMS[id].st); return null; }
  const q = Math.min(5, 3 + (o.w ? 1 : 0) + (o.rot ? 1 : 0));
  farmAdd(id, n, q);
  o.last = id; o.crop = null; o.w = false; o.rot = 0;
  S.farm.stats.harvest += n;
  farmXP(FITEMS[id].xp * n);
  farmEvent("harvest:" + id, n);
  return { id, n, q, xp: FITEMS[id].xp * n };
}
let farmFullAt = 0;
function farmFull(st) {
  if (performance.now() - farmFullAt < 2500) return;
  farmFullAt = performance.now();
  const S0 = FSTORE[st] || { i: "📦", the: "Das Lager" };
  toast(S0.i + " " + S0.the + " ist voll – liefere etwas aus, verkauf an den Großhandel oder bau aus.", "warn");
  if (typeof farmViewFull === "function") farmViewFull(st);
}

/* ------------------------------- Reusen ------------------------------- */
function potState(o) {
  if (!o.kind) return "empty";
  return S.time >= o.end ? "ripe" : "grow";
}
function potStage(o) {
  if (!o.kind) return -1;
  const left = o.end - S.time;
  if (left <= 0) return 3;
  const f = 1 - left / FPOTS[o.kind].t;
  return f < 0.12 ? 0 : f < 0.5 ? 1 : 2;
}
/* Köder rein, Reuse runter – ein Beutel je Reuse */
function farmBait(o, kind) {
  if (!o || o.t !== "pot" || o.kind || !farmPotOk(kind)) return false;
  if (!farmInv("koeder")) return "nobait";
  const q = farmQ("koeder") || 3;
  farmTake("koeder", 1);
  o.kind = kind; o.end = S.time + FPOTS[kind].t; o.bq = q;
  farmEvent("bait:" + kind);
  return true;
}
/* Reuse hochziehen: 2 Gebinde, manchmal 3; frischer Köder gibt bessere Ware */
function farmHaul(o) {
  if (!o || o.t !== "pot" || potState(o) !== "ripe") return null;
  const id = o.kind, P = FPOTS[id];
  const n = P.yield + (Math.random() < 0.2 ? 1 : 0);
  if (farmRoom(id) < n) { farmFull(FITEMS[id].st); return null; }
  const q = Math.min(5, Math.max(3, Math.round(o.bq || 3)) + (Math.random() < 0.25 ? 1 : 0));
  farmAdd(id, n, q);
  o.last = id; o.kind = null; o.bq = 0;
  S.farm.stats.harvest += n;
  farmXP(FITEMS[id].xp * n);
  farmEvent("harvest:" + id, n);
  return { id, n, q, xp: FITEMS[id].xp * n };
}

/* --------------------------- Bäume & Leinen --------------------------- */
function treeRipe(o) { return S.time >= o.end; }
function treeDef(o) { return o.t === "mline" ? FLINES[o.kind] : FTREES[o.kind]; }
function farmPick(o) {
  if (!o || (o.t !== "tree" && o.t !== "mline") || !treeRipe(o)) return null;
  const T = treeDef(o), id = o.t === "mline" ? T.out : o.kind;
  const n = T.yield + (Math.random() < 0.2 ? 1 : 0);
  if (farmRoom(id) < n) { farmFull(FITEMS[id].st); return null; }
  const extra = [];
  for (const x in T.extra || {}) if (farmRoom(x) >= T.extra[x]) extra.push({ id: x, n: T.extra[x] });
  /* in manchen Muscheln steckt eine Perle – in der allerersten immer */
  let pearl = 0;
  if (T.pearl && (Math.random() < T.pearl || !S.farm.stats.pearls) && farmRoom("perle") >= 1) pearl = 1;
  const q = Math.min(5, 3 + (o.w ? 1 : 0) + ((o.h || 0) >= 3 ? 1 : 0));
  farmAdd(id, n, q);
  extra.forEach(e => farmAdd(e.id, e.n, q));
  if (pearl) farmAdd("perle", 1, Math.min(5, q + 1));
  o.h = (o.h || 0) + 1; o.w = false; o.end = S.time + T.t;
  S.farm.stats.harvest += n;
  let xp = FITEMS[id].xp * n + extra.reduce((s, e) => s + FITEMS[e.id].xp * e.n, 0) + (pearl ? FITEMS.perle.xp : 0);
  farmXP(xp);
  farmEvent("harvest:" + id, n);
  const pearls = (id === "perle" ? n : 0) + pearl;
  if (pearls) { S.farm.stats.pearls = (S.farm.stats.pearls || 0) + pearls; farmEvent("pearl", pearls); }
  return { id, n, q, xp, extra, pearl };
}

/* -------------------------------- Tiere ------------------------------- */
function penInfo(o) {
  const kind = penKind(o), A = FANIMALS[kind];
  const P = FPENS[o.t], p = P[Math.min(P.length, o.lvl || 1) - 1];
  const n = o.animals.length;
  const per = n ? p.m2 / n : p.m2;
  const r = per / A.space;
  let ki = FKEEP.findIndex(x => r >= x.r);
  if (ki < 0) ki = FKEEP.length - 1;
  const k = FKEEP[ki];
  return { A, kind, p, n, per, r, stars: k.st, keep: A.fish ? FKEEP_FISH[ki] : k.n };
}
/* Masttiere wachsen mit jeder Mahlzeit; satt und fertig → wieder hungrig,
   bis sie schlachtreif sind ("ready") */
function aniState(a) {
  if (a.mast) {
    if (a.fed != null && S.time >= a.fed) { a.g = (a.g || 0) + 1; a.fed = null; }
    if ((a.g || 0) >= a.mast) return "ready";
    return a.fed == null ? "hungry" : "busy";
  }
  if (a.fed == null) return "hungry";
  return S.time >= a.fed ? "ready" : "busy";
}
function farmFeed(o, a) {
  if (!a || aniState(a) !== "hungry") return false;
  const A = FANIMALS[penKind(o)];
  if (!farmTake(A.feed, 1)) return "nofeed";
  a.fed = S.time + A.t;
  const q = Math.min(5, penInfo(o).stars + (a.pet ? 1 : 0));
  if (a.mast) { a.qs = (a.qs || 0) + q; a.qn = (a.qn || 0) + 1; a.q = a.qs / a.qn; }
  else a.q = q;
  a.pet = false;
  farmEvent("feed:" + A.feed);
  return true;
}
function farmCollect(o, a) {
  if (!a || aniState(a) !== "ready") return null;
  const kind = penKind(o), A = FANIMALS[kind];
  const F = S.farm;
  F.stats.prod = F.stats.prod || {};
  if (A.mast) {
    /* schlachtreif: ab zum Metzger, zurück kommen Fleischpakete */
    const n = A.yield;
    if (farmRoom(A.out) < n) { farmFull(FITEMS[A.out].st); return null; }
    const q = Math.max(1, Math.min(5, Math.round(a.q || penInfo(o).stars)));
    farmAdd(A.out, n, q);
    o.animals = o.animals.filter(x => x !== a);
    F.stats.meat = (F.stats.meat || 0) + n;
    F.stats.prod[A.out] = (F.stats.prod[A.out] || 0) + n;
    const xp = FITEMS[A.out].xp * n;
    farmXP(xp);
    farmEvent("slaughter:" + kind);
    if (q >= 5) farmEvent("q5:" + A.out);
    return { id: A.out, n, q, xp, gone: true };
  }
  if (farmRoom(A.out) < 1) { farmFull(FITEMS[A.out].st); return null; }
  const q = a.q || penInfo(o).stars;
  farmAdd(A.out, 1, q);
  a.fed = null; a.petted = false;
  if (A.out === "ei") F.stats.eggs++;
  else if (A.out === "milch") F.stats.milk++;
  F.stats.prod[A.out] = (F.stats.prod[A.out] || 0) + 1;
  farmXP(FITEMS[A.out].xp);
  farmEvent("collect:" + A.out);
  if (q >= 5) farmEvent("q5:" + A.out);
  return { id: A.out, n: 1, q, xp: FITEMS[A.out].xp };
}
/* Streicheln: das nächste Produkt wird einen Stern besser (einmal je Durchgang) */
function farmPet(o, a) {
  if (!a || a.petted) return false;
  a.petted = true;
  if (aniState(a) === "busy") a.q = Math.min(5, (a.q || penInfo(o).stars) + 1);
  else a.pet = true;
  return true;
}
function animalPrice(kind) {
  const A = FANIMALS[kind];
  const n = S.farm.objs.filter(o => o.t === A.house).reduce((s, o) => s + o.animals.length, 0);
  return A.price + A.step * n;
}
function farmBuyAnimal(kind, pen) {
  const A = FANIMALS[kind];
  if (!pen || pen.t !== A.house) return toast("Dafür brauchst du erst: " + FPEN_META[A.house].n + ".", "warn"), false;
  if (pen.animals.length >= A.max) return toast(FPEN_META[A.house].n + " ist voll – höchstens " + A.max + " " + A.pl + ".", "warn"), false;
  const price = animalPrice(kind);
  if (S.money < price) return toast("Dafür fehlen " + money(price - S.money) + ".", "warn"), false;
  S.money -= price; S.expense += price;
  logMoney("farm", (A.young || A.n) + " gekauft", -price);
  const a = { id: S.farm.seq++, v: Math.floor(Math.random() * (kind === "huhn" ? 3 : 2)), fed: null, q: 3 };
  if (A.mast) { a.mast = A.mast; a.g = 0; }
  pen.animals.push(a);
  farmXP(Math.max(3, Math.round(A.price / 40)));
  farmEvent("buy:" + kind);
  return true;
}
function farmSellAnimal(pen) {
  if (!pen || !pen.animals.length) return false;
  const kind = penKind(pen), A = FANIMALS[kind];
  const a = pen.animals.pop();
  const back = Math.round(A.price * 0.5);
  S.money += back; S.revenue += back;
  logMoney("farm", A.n + " verkauft", back);
  return a;
}
function penUpgradeCost(o) { const c = FPEN_COST[o.t]; return c[o.lvl] != null ? c[o.lvl] : null; }
function farmPenUpgrade(o) {
  const cost = penUpgradeCost(o);
  if (cost == null) return toast("Größer geht es nicht.", "warn"), false;
  const nx = FPENS[o.t][o.lvl];
  const w = o.r ? nx.d : nx.w, d = o.r ? nx.w : nx.d;
  if (!farmFits(o.x, o.z, w, d, o.id, o.t)) return toast("Kein Platz: Rechts oder unten steht etwas im Weg. Verschieb es (lange drücken) und versuch es nochmal.", "warn"), false;
  if (S.money < cost) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn"), false;
  S.money -= cost; S.expense += cost;
  logMoney("farm", FPEN_META[o.t].area + " vergrößert", -cost);
  o.lvl++;
  farmXP(10);
  farmEvent("pen");
  return true;
}

/* -------------------- Gebäude mit Rezepten (und Kutter) -------------------- */
function machUpdate(o) {
  if (!o.q) return;
  while (o.q.length && o.q[0].end <= S.time) {
    const it = o.q.shift();
    o.done.push({ r: it.r, q: it.q, n: it.n, by: it.by || null });
  }
}
function recipeOf(o, rid) { return FMACHINES[o.t].recipes.find(r => r.id === rid); }
function farmQueue(o, rid) {
  machUpdate(o);
  const r = recipeOf(o, rid);
  if (!r || r.lv > level()) return "locked";
  if (o.q.length + o.done.length >= o.slots) return "full";
  if (!farmHasAll(r.in)) return "missing";
  if (r.cost && S.money < r.cost) return "money";
  let qs = 0, qn = 0;
  for (const id in r.in) { qs += farmQ(id) * r.in[id]; qn += r.in[id]; farmTake(id, r.in[id]); }
  const M = FMACHINES[o.t];
  if (r.cost) {
    S.money -= r.cost; S.expense += r.cost;
    logMoney("farm", (r.trip ? "Diesel · " + r.trip : M.n), -r.cost);
  }
  const start = o.q.length ? o.q[o.q.length - 1].end : S.time;
  /* Im Rundgang geht das allererste Mal schnell (Opa hat vorgeheizt,
     Tante Gesche hat den Kutter schon klargemacht) */
  const F = S.farm;
  F.quick = F.quick || {};
  const quick = F.tut && !F.tut.done && r.tq && !F.quick[rid];
  if (quick) F.quick[rid] = 1;
  /* Fang: mal gute See, mal mäßig – Qualität und Menge schwanken */
  const q = M.trips ? 3 + (Math.random() < 0.35 ? 1 : 0) + (Math.random() < 0.12 ? 1 : 0) : qn ? qs / qn : 3;
  const n = r.out + (r.luck && Math.random() < r.luck ? 1 : 0);
  o.q.push({ r: rid, start, end: start + (quick ? r.tq : r.t), q, n, by: r.by || null });
  return true;
}
function farmCollectMach(o) {
  machUpdate(o);
  if (!o.done.length) return [];
  const got = [];
  const M = FMACHINES[o.t];
  while (o.done.length) {
    const d = o.done[0];
    if (farmRoom(d.r) < d.n) { farmFull(FITEMS[d.r].st); break; }
    const byFull = d.by && Object.keys(d.by).find(b => farmRoom(b) < d.by[b]);
    if (byFull) { farmFull(FITEMS[byFull].st); break; }
    o.done.shift();
    farmAdd(d.r, d.n, d.q);
    if (d.by) for (const b in d.by) farmAdd(b, d.by[b], d.q);
    S.farm.stats.made += d.n;
    const xp = FITEMS[d.r].xp * d.n;
    farmXP(xp);
    farmEvent("make:" + d.r, d.n);
    if (M.trips) { S.farm.stats.trips = (S.farm.stats.trips || 0) + 1; farmEvent("trip:" + d.r); }
    if (d.r === "perle") { S.farm.stats.pearls = (S.farm.stats.pearls || 0) + d.n; farmEvent("pearl", d.n); }
    got.push({ id: d.r, n: d.n, q: d.q, xp, by: d.by });
  }
  return got;
}
function slotCost(o) { return FSLOT_COST[o.slots] || null; }
function farmBuySlot(o) {
  const c = slotCost(o);
  if (c == null) return toast("Mehr Plätze gehen nicht.", "warn"), false;
  if (S.money < c) return toast("Dafür fehlen " + money(c - S.money) + ".", "warn"), false;
  S.money -= c; S.expense += c; o.slots++;
  logMoney("farm", FMACHINES[o.t].n + ": Platz " + o.slots, -c);
  return true;
}

/* ------------------------------ Angeln --------------------------------
   Am Angelsteg: auswerfen kostet einen Köder, beißt etwas an und man zieht
   rechtzeitig, landet ein Fisch im Kühlhaus – oder ein Fundstück.        */
const FANGEL = [
  { id: "hering", w: 46 }, { id: "dorsch", w: 18, lv: 2 }, { id: "forelle", w: 10, n: "eine Meerforelle" }, { id: "krabbe", w: 8 },
  { junk: "einen alten Gummistiefel", i: "👢", w: 6 }, { junk: "eine Flaschenpost aus Dänemark", i: "🍾", w: 4, m: 5 },
  { junk: "ein Büschel Seetang", i: "🌿", w: 5 }, { junk: "eine Qualle – lieber schnell zurück damit", i: "🪼", w: 3 }
];
function farmAngelCast() {
  if (!farmTake("koeder", 1)) return false;
  S.farm.stats.casts = (S.farm.stats.casts || 0) + 1;
  return true;
}
function farmAngelCatch() {
  const lv = level();
  const list = FANGEL.filter(x => !x.lv || x.lv <= lv);
  const c = farmWPick(list, x => x.w);
  if (c.junk) {
    farmXP(1);
    if (c.m) { S.money += c.m; S.revenue += c.m; logMoney("farm", "Flaschenpost-Finderlohn", c.m); }
    S.farm.stats.junk = (S.farm.stats.junk || 0) + 1;
    farmEvent("angel:junk");
    return { junk: c.junk, i: c.i, m: c.m || 0, xp: 1 };
  }
  if (farmRoom(c.id) < 1) { farmFull(FITEMS[c.id].st); return { full: true }; }
  const q = 3 + (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);
  farmAdd(c.id, 1, q);
  const xp = FITEMS[c.id].xp + 3;
  farmXP(xp);
  S.farm.stats.angel = (S.farm.stats.angel || 0) + 1;
  farmEvent("angel");
  farmEvent("angel:" + c.id);
  return { id: c.id, n: 1, q, xp, name: c.n || null };
}

/* ------------------------------ Ausbau -------------------------------- */
function storeUpCost(st) { return FSTORE[st].cost[(S.farm.cap[st] || 1) - 1] || null; }
function farmStoreUp(st) {
  const c = storeUpCost(st);
  if (c == null) return toast("Größer geht es nicht.", "warn"), false;
  if (S.money < c) return toast("Dafür fehlen " + money(c - S.money) + ".", "warn"), false;
  S.money -= c; S.expense += c;
  S.farm.cap[st] = (S.farm.cap[st] || 1) + 1;
  farmEvent("store:" + st);
  logMoney("farm", FSTORE[st].n + " ausgebaut", -c);
  farmXP(8);
  return true;
}
/* Großhandel: sofort Geld, aber nur der halbe Wert */
function farmSellPrice(id, n) {
  const q = farmQ(id) || 3;
  return Math.max(0.1, Math.round(FITEMS[id].v * 0.5 * n * (1 + (q - 3) * 0.08) * 10) / 10);
}
function farmSell(id, n) {
  n = Math.min(n, farmInv(id));
  if (!n) return 0;
  const m = farmSellPrice(id, n);
  farmTake(id, n);
  S.money += m; S.revenue += m;
  S.farm.stats.earned += m;
  logMoney("farm", "Großhandel · " + fqty(id, n), m);
  return m;
}
/* Einkauf beim Bäcker, im Angelladen, beim Edelmetallhandel */
function farmBuySupply(it) {
  const n = it.qty || 1, price = it.price();
  if (farmRoom(it.item) < n) { farmFull(FITEMS[it.item].st); return false; }
  if (S.money < price) { toast("Dafür fehlen " + money(price - S.money) + ".", "warn"); return false; }
  S.money -= price; S.expense += price;
  logMoney("farm", "Einkauf · " + fqty(it.item, n), -price);
  farmAdd(it.item, n, 3);
  farmEvent("buy:" + it.item);
  return true;
}

/* ------------------------------ Laden --------------------------------- */
function shopCount(it) {
  const objs = S.farm.objs;
  const n = t => objs.filter(o => o.t === t).length;
  if (it.id === "field") return n("field");
  if (it.id === "pot") return n("pot");
  if (it.tree) return n("tree");
  if (it.line) return n("mline");
  if (FPENS[it.id] || FMACHINES[it.id]) return n(it.id);
  return 0;
}
function shopPrice(it) {
  if (it.tree) return FTREES[it.tree].price + 20 * S.farm.objs.filter(o => o.t === "tree").length;
  if (it.line) return FLINES[it.line].price + 20 * S.farm.objs.filter(o => o.t === "mline").length;
  if (it.animal) return animalPrice(it.animal);
  return it.price ? it.price(shopCount(it)) : 0;
}
function shopLimit(it) {
  const lv = level();
  if (it.max) return it.max(lv);
  if (it.tree) return Math.min(16, 2 + lv * 2);
  if (it.line) return Math.min(12, 2 + lv * 2);
  if (it.lim) return it.lim(lv);
  return 99;
}
/* Neues Objekt an freier Stelle (die Ansicht lässt es danach verschieben) */
function farmBuild(spec, x, z, r) {
  let o;
  const t = spec.t;
  if (t === "field") o = { t, crop: null, last: null };
  else if (t === "tree") o = { t, kind: spec.kind, end: S.time + FTREES[spec.kind].t, w: false, h: 0 };
  else if (t === "mline") o = { t, kind: spec.kind, end: S.time + FLINES[spec.kind].t, w: false, h: 0 };
  else if (t === "pot") o = { t, kind: null };
  else if (FPENS[t]) o = { t, lvl: 1, animals: [] };
  else if (FMACHINES[t]) o = { t, q: [], done: [], slots: 2 };
  else if (t === "deco") o = { t, k: spec.k, arg: FDECO[spec.k].arg };
  else return null;
  o.x = x; o.z = z; o.r = r || 0;
  if (!farmFits(x, z, ...farmSize(o), null, t, spec.k)) return null;
  if (S.money < spec.price) { toast("Dafür fehlen " + money(spec.price - S.money) + ".", "warn"); return null; }
  S.money -= spec.price; S.expense += spec.price;
  logMoney("farm", spec.label || "Neubau", -spec.price);
  farmAddObj(o);
  const small = t === "field" || t === "pot", plant = t === "tree" || t === "mline";
  farmXP(t === "deco" ? Math.max(1, Math.round(spec.price / 10)) : small ? 2 : plant ? 4 : 25);
  farmEvent("buy:" + t);
  if (plant) farmEvent("buy:" + t + ":" + spec.kind);
  if (t !== "deco" && !small && !plant) farmEvent("build:" + t);
  return o;
}
/* Deko wieder abgeben */
function farmRemove(o) {
  if (!o) return false;
  if (o.t === "deco") {
    const back = Math.round(FDECO[o.k].price * 0.5);
    S.money += back;
    S.farm.objs = S.farm.objs.filter(x => x !== o);
    return true;
  }
  return false;
}

/* ------------------------- Bestellungen der Gegend --------------------- */
function farmAddr() {
  const name = S.player ? S.player.company : FT().short;
  return { lat: FARM_PT[0], lon: FARM_PT[1], t: FT().title(name) + ", " + FSITE.addr, a: FSITE.area };
}
function farmOrderCap() { return Math.min(8, 3 + Math.floor(level() / 2)); }
function farmOrders() { return S.orders.filter(o => o.farm); }
function farmMaxKg() {
  let m = 0;
  S.fleet.forEach(f => { const t = vType(f.type); if (t && (t.mode === "b" || t.mode === "r")) m = Math.max(m, t.cap); });
  return Math.max(25, m * 0.9);
}
function farmWPick(list, wf) {
  const tot = list.reduce((s, x) => s + wf(x), 0);
  let r = Math.random() * tot;
  for (const x of list) { r -= wf(x); if (r <= 0) return x; }
  return list[list.length - 1];
}
/* Wie viele Gebinde bestellt jemand? Märkte und Gastronomie nehmen mehr */
function farmOrderQty(id, lv, big) {
  const k = FITEMS[id].k;
  if (k === "jewel") return 1 + (lv >= 6 && Math.random() < 0.3 ? 1 : 0);
  if (k === "meat") return 1 + Math.floor(Math.random() * (1 + Math.floor(lv / 3) + big));
  let hi;
  if (k === "crop" || k === "fruit" || k === "fang") hi = 2 + Math.ceil(lv * 0.6);
  else if (k === "ani") hi = 2 + Math.ceil(lv / 2);
  else if (k === "pearl") hi = 2 + Math.floor(lv / 2);
  else hi = 2 + Math.floor(lv / 2);
  hi += big;
  const lo = 1 + big;
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
function makeFarmOrder() {
  const lv = level();
  const towns = Object.keys(FTOWNS).filter(id => FTOWNS[id].lv <= lv && N[id] && isUnlocked(id));
  if (!towns.length) return null;
  const busy = new Set(farmOrders().map(o => o.shipper));
  for (let tries = 0; tries < 20; tries++) {
    const town = farmWPick(towns, id => FTOWNS[id].w);
    const c = pick(FTOWNS[town].cust);
    if (busy.has(c[0])) continue;
    const wants = c[1].filter(id => farmCanMake(id));
    if (!wants.length) continue;
    const lines = 1 + (lv >= 2 && Math.random() < 0.5 ? 1 : 0) + (lv >= 4 && Math.random() < 0.3 ? 1 : 0);
    const items = {};
    const pool = wants.slice();
    const big = /Gasthaus|Hotel|Markt|Landbäckerei|Restaurant|Pizzeria|Fleischerei|Imbiss|Kogge|Kiosk/.test(c[0]) ? 1 : 0;
    for (let i = 0; i < lines && pool.length; i++) {
      const id = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      items[id] = farmOrderQty(id, lv, FITEMS[id].k === "jewel" ? 0 : big);
    }
    /* passt aufs größte eigene Fahrzeug */
    const maxKg = farmMaxKg();
    const kg = () => Object.keys(items).reduce((s, id) => s + FITEMS[id].kg * items[id], 0);
    let guard = 40;
    while (kg() > maxKg && guard--) {
      const b = Object.keys(items).sort((a, b2) => FITEMS[b2].kg * items[b2] - FITEMS[a].kg * items[a])[0];
      if (items[b] > 1) items[b]--; else delete items[b];
      if (!Object.keys(items).length) break;
    }
    if (!Object.keys(items).length) continue;
    const order = farmOrderObj(town, c[0], items);
    if (order) return order;
  }
  return null;
}
function farmOrderObj(town, cust, items, extra) {
  const w = Math.max(0.3, Math.round(Object.keys(items).reduce((s, id) => s + FITEMS[id].kg * items[id], 0) * 10) / 10);
  const cargo = FSITE.cargo || "hof";
  const pr = plan(FARM_NODE, town, cargo, w, "time");
  if (!pr) return null;
  const value = Object.keys(items).reduce((s, id) => s + FITEMS[id].v * items[id], 0);
  const dist = pr.dist;
  /* Warenwert zum Hofladenpreis, dazu Liefergebühr – wie im echten Lieferdienst */
  const pay = Math.max(4, Math.round((value * rnd(1.05, 1.22) + 2.5 + dist * 0.45) * 10) / 10);
  const xp = Math.round(Object.keys(items).reduce((s, id) => s + FITEMS[id].xp * items[id], 0) * 1.3 + 4 + dist * 0.3);
  const streets = FTOWN_STREETS[town];
  let drop;
  if (streets) {
    const s = pick(streets);
    drop = { lat: +(s[1] + rnd(-0.0012, 0.0012)).toFixed(5), lon: +(s[2] + rnd(-0.0018, 0.0018)).toFixed(5), t: cust + ", " + s[0] + " " + (1 + Math.floor(Math.random() * 60)), a: N[town].short };
  } else {
    const a = typeof makeAddr === "function" ? makeAddr(town) : nodeAddr(town);
    drop = Object.assign({}, a, { t: cust + ", " + a.t });
  }
  const desc = "Bestellung: " + Object.keys(items).map(id => fqty(id, items[id])).join(", ");
  return Object.assign({
    id: "A" + (S.seq++), from: FARM_NODE, to: town, cargo, weight: w, pay,
    deadline: Math.round(S.time + 1800 + pr.time * 2), shipper: cust, desc, created: S.time,
    refDist: Math.round(pr.dist), refTime: Math.round(pr.time), expire: Math.round(S.time + 1440),
    pick: farmAddr(), drop, farm: { items, xp, town }
  }, extra || {});
}
function farmSpawnOrders(n) {
  if (!farmOn()) return 0;
  let added = 0;
  while (farmOrders().length < farmOrderCap() && added < (n || 1)) {
    const o = makeFarmOrder();
    if (!o) break;
    S.orders.push(o); added++;
  }
  if (added) renderDirty = true;
  return added;
}
function farmOrderReady(o) { return o && o.farm && farmHasAll(o.farm.items); }
function farmOrderQ(o) {
  let s = 0, n = 0;
  for (const id in o.farm.items) { s += (farmQ(id) || 3) * o.farm.items[id]; n += o.farm.items[id]; }
  return n ? s / n : 3;
}
/* Ware geht beim Losfahren vom Hof */
function farmTakeOrder(o) {
  if (!o.farm) return;
  let s = 0, n = 0;
  for (const id in o.farm.items) {
    const k = o.farm.items[id];
    s += (farmQ(id) || 3) * k; n += k;
    farmTake(id, k);
  }
  o.farm.q = n ? s / n : 3;
  o.farm.taken = true;
}
function farmGiveBack(o) {
  if (!o.farm || !o.farm.taken || !farmOn()) return;
  for (const id in o.farm.items) farmAdd(id, o.farm.items[id], o.farm.q || 3);
  o.farm.taken = false;
}
function farmPayFactor(o) { return o.farm ? 1 + ((o.farm.q || 3) - 3) * 0.08 : 1; }
function farmDelivered(o, pay) {
  if (!S.farm) return;
  S.farm.stats.deliv++;
  S.farm.stats.earned += pay;
  farmXP(o.farm.xp);
  farmEvent("deliver");
  farmEvent("deliver:" + o.to);
  toast((FSITE.kind === "fisch" ? "🐟 " : "🧺 ") + o.shipper + " ist zufrieden: +" + money(pay) + " · +" + o.farm.xp + " EP" + (o.farm.q >= 4 ? " · " + qStars(o.farm.q) : ""), "ok");
  S.farm.lastOrd = Math.min(S.farm.lastOrd, S.time - 20);
}

/* ------------------------ Schnell losschicken -------------------------
   Statt des großen Planers: freie Fahrzeuge am Hof, die die Bestellung
   schaffen – mit Fahrzeit und Kosten. Ein Tipp schickt es los.        */
function farmVariant(o, mode) {
  const e = dijkstra(o.from, o.to, mode, "time", o.cargo, o.weight);
  if (!e || !e.length) return null;
  const legs = toLegs(e);
  if (legs.length !== 1) return null;
  const ref = refVeh(mode, o.cargo, o.weight, legs[0].maxHop);
  legs[0].ref = ref ? ref.id : null;
  return { label: "Direkt", legs, dist: legs[0].dist, time: 0, cost: 0 };
}
function farmDispatchOptions(o) {
  const out = [];
  const byMode = {};
  S.fleet.forEach(f => {
    if (f.phase !== "idle") return;
    const t = vType(f.type);
    if (!t || !unlockedModes().includes(t.mode)) return;
    if (!(t.mode in byMode)) byMode[t.mode] = farmVariant(o, t.mode);
    const v = byMode[t.mode];
    if (!v) return;
    if (!canCarry(t, o.cargo, o.weight, v.legs[0].maxHop)) return;
    const ev = evaluate(v, o, [f.uid]);
    if (!ev.ok) return;
    out.push({ f, t, v, ev, eta: S.time + ev.time, late: S.time + ev.time > o.deadline, here: f.at === FARM_NODE });
  });
  return out.sort((a, b) => (a.late - b.late) || (b.here - a.here) || (a.ev.time - b.ev.time));
}
function farmSend(o, opt) {
  if (!farmOrderReady(o)) { toast("Es fehlt noch Ware für " + o.shipper + ".", "warn"); return false; }
  startJob(o, opt.v, [opt.f.uid]);
  toast(opt.t.icon + " " + opt.t.brand + " fährt los: " + o.shipper + " in " + N[o.to].short, "ok");
  save();
  return true;
}

/* ----------------------- Notizbuch / Logbuch -------------------------- */
function farmQuest() { return S.farm && !S.farm.sold && FQUESTS[S.farm.qi] || null; }
/* Wie weit im Notizbuch: Kapitel, erledigt im Kapitel, Aufgaben im Kapitel */
function farmChapter() {
  const q = farmQuest(), c = q ? q.c : FCHAPTERS.length - 1;
  const all = FQUESTS.filter(x => x.c === c), first = FQUESTS.indexOf(all[0]);
  return { c, done: q ? S.farm.qi - first : all.length, n: all.length };
}
function farmDone() { return !!(S.farm && !S.farm.sold && (S.farm.done || S.farm.qi >= FQUESTS.length)); }
function farmEvent(key, n) {
  if (!S.farm) return;
  n = n || 1;
  const q = farmQuest();
  if (q && !S.farm.qdone && q.ev === key) S.farm.qp += n;
  farmQuestCheck();
  if (typeof farmTutSignal === "function") farmTutSignal(key, n);
}
/* Erfüllt? Ereignisse zählen mit, Level und „steht schon“ prüft der Zustand */
function farmQuestCheck() {
  const q = farmQuest();
  if (!q || S.farm.qdone) return;
  if (q.ev === "level" && level() >= q.n) S.farm.qp = q.n;
  if (q.chk) S.farm.qp = q.chk() ? q.n : 0;
  if (S.farm.qp >= q.n) { S.farm.qp = q.n; S.farm.qdone = true; if (typeof farmViewQuest === "function") farmViewQuest(true); }
}
/* Abholen. Gibt { q, chapter, last } zurück – chapter, wenn damit ein
   Kapitel fertig ist, last, wenn das ganze Notizbuch abgehakt ist. */
function farmQuestClaim() {
  const q = farmQuest();
  if (!q || !S.farm.qdone) return null;
  S.money += q.r.m; S.revenue += q.r.m;
  logMoney("farm", FT().book + ": " + q.t, q.r.m);
  S.farm.qi++; S.farm.qp = 0; S.farm.qdone = false;
  farmXP(q.r.xp);
  const nx = farmQuest();
  let chapter = null;
  if (!nx || nx.c !== q.c) {
    chapter = FCHAPTERS[q.c];
    S.money += chapter.r.m; S.revenue += chapter.r.m;
    logMoney("farm", "Kapitel geschafft: " + chapter.n, chapter.r.m);
    farmXP(chapter.r.xp);
  }
  if (!nx) {
    S.farm.done = true;
    S.farm.doneAt = S.time;
    if (farmPhase() && typeof phoneMsg === "function") setTimeout(() => phoneMsg({ from: "Lina Sturm", kind: "info", title: FT().The + " läuft – und jetzt?", body: FT().doneMsg }), 1500);
  }
  farmQuestCheck();
  return { q, chapter, c: q.c, last: !nx };
}

/* --------------------- Spedition gründen, Erbe verkaufen ---------------- */
function farmCanFound() { return farmPhase() && farmDone(); }
function farmFoundLogistics() {
  if (!farmCanFound()) return false;
  S.farm.logi = true;
  S.farm.logiAt = S.time;
  clearRouteCache(); buildNetBuffers();
  spawnOrders(8);
  farmBodyClasses();
  logMoney("farm", "Spedition gegründet", 0);
  save();
  return true;
}
function farmValue() {
  if (!S.farm) return 0;
  let v = (FSITE.base || 45000) + level() * 2000;
  S.farm.objs.forEach(o => {
    if (o.t === "field") v += 350;
    else if (o.t === "pot") v += 120;
    else if (o.t === "tree" || o.t === "mline") v += treeDef(o).price * 4;
    else if (FPENS[o.t]) {
      const A = FANIMALS[penKind(o)];
      v += FPEN_META[o.t].val + FPEN_COST[o.t].slice(0, o.lvl).reduce((a, b) => a + b, 0) + o.animals.length * A.price * (A.mast ? 1.6 : o.t === "cows" ? 1.5 : 1);
    }
    else if (o.t === "deco") v += FDECO[o.k].price;
    else if (FBUILD_VAL[o.t]) v += FBUILD_VAL[o.t];
    if (o.slots) v += FSLOT_COST.slice(0, o.slots).reduce((a, b) => a + b, 0);
  });
  FSITE.stores.forEach(st => { v += FSTORE[st].cost.slice(0, (S.farm.cap[st] || 1) - 1).reduce((a, b) => a + b, 0); });
  for (const id in S.farm.inv) v += FITEMS[id].v * S.farm.inv[id].n * 0.8;
  return Math.round(v / 500) * 500;
}
function farmSellAll() {
  if (!farmOn() || !S.farm.logi) return false;
  const price = farmValue();
  S.money += price; S.revenue += price;
  logMoney("farm", FT().place + " verkauft", price);
  /* offene Bestellungen entfallen; laufende Lieferungen fahren zu Ende */
  S.orders = S.orders.filter(o => !o.farm);
  S.farm = { sold: { t: S.time, price }, kind: S.farm.kind, logi: true, stats: S.farm.stats };
  farmBodyClasses();
  save();
  return price;
}

/* -------------------------------- Takt -------------------------------- */
function farmTick() {
  if (!farmOn() || (S.farm.tut && !S.farm.tut.done)) return;
  farmQuestCheck();
  if (S.time - (S.farm.lastOrd || -999) > 45) {
    S.farm.lastOrd = S.time;
    farmSpawnOrders(1);
  }
}

/* --------------------------- Landkarte -------------------------------- */
/* Die Hof-Knoten gehören nur zu Spielständen mit Hof; Potsdam ist von dort
   aus schon zu Beginn erreichbar. */
if (typeof N !== "undefined" && N.potsdam) N.potsdam.farmX = "hof";
/* ältere Spielstände nachziehen: Gebinde und Preise (v37), Notizbuch (v38, v39) */
function farmMigrate() {
  const F = S.farm;
  if (!F || F.sold) return;
  if ((F.qv || 1) < 2) {
    F.qv = 2;
    F.qi = F.qi >= FQUEST_OLD.length ? FQUEST_OLD[FQUEST_OLD.length - 1] + 1 : FQUEST_OLD[F.qi] || 0;
    F.qp = 0; F.qdone = false;
  }
  if (F.qv < 3) {
    /* v39: neues Kapitel „Vieh & Handwerk“ – an derselben Aufgabe weiter */
    F.qv = 3;
    if (F.done || F.qi >= FQUEST_V2_TITLES.length) F.qi = FQUESTS_HOF.length;
    else { const i = FQUESTS_HOF.findIndex(q => q.t === FQUEST_V2_TITLES[F.qi]); F.qi = i >= 0 ? i : 0; }
  }
  F.quick = F.quick || {};
  const st = F.stats || (F.stats = {});
  ["pearls", "angel", "trips", "meat"].forEach(k => { st[k] = st[k] || 0; });
  st.prod = st.prod || {};
  FSITE.stores.forEach(s => { F.cap[s] = F.cap[s] || 1; });
  if (F.econ >= 2) return;
  F.econ = 2;
  S.orders.forEach(o => {
    if (!o.farm) return;
    const value = Object.keys(o.farm.items).reduce((s, id) => s + FITEMS[id].v * o.farm.items[id], 0);
    o.pay = Math.max(4, Math.round((value * 1.12 + 2.5 + (o.refDist || 3) * 0.45) * 10) / 10);
    o.desc = "Bestellung: " + Object.keys(o.farm.items).map(id => fqty(id, o.farm.items[id])).join(", ");
    o.weight = Math.max(0.3, Math.round(Object.keys(o.farm.items).reduce((s, id) => s + FITEMS[id].kg * o.farm.items[id], 0) * 10) / 10);
  });
  /* Notizbuch: Aufgaben haben jetzt andere Mengen – Fortschritt deckeln */
  const q = farmQuest();
  if (q && F.qp > q.n) F.qp = q.n;
}
function farmBodyClasses() {
  if (S && S.farm) farmUseSite(S.farm.kind);
  farmMigrate();
  if (farmPhase() && S.speed !== 1) { S.speed = 1; lastSpeed = 1; }
  document.body.classList.toggle("has-farm", farmOn());
  document.body.classList.toggle("farm-phase", farmPhase());
  document.body.classList.toggle("site-fisch", !!(S.farm && S.farm.kind === "fisch"));
  const nb = document.querySelector('.navbtn[data-tab="farm"]');
  if (nb && nb.children.length >= 2) { nb.children[0].textContent = FT().tabIcon; nb.children[1].textContent = FT().tab; }
  farmNodeName();
}
function farmNodeName() {
  if (N[FARM_NODE] && S && S.player) { N[FARM_NODE].name = FT().title(S.player.company); N[FARM_NODE].short = FT().short; }
}

/* Hof als Haus auf der großen Karte – antippen öffnet den Hof */
let farmHit = null;
function drawFarmPin(m, z) {
  farmHit = null;
  if (!farmOn() || z < 7) return;
  const sea = FSITE.kind === "fisch";
  m.pin(FARM_PT[0], FARM_PT[1], (c, x, y0) => {
    /* Haus an einem Pfahl über dem Hof – darunter parken die Fahrzeuge */
    const w = z >= 11 ? 34 : 26, h = w * 0.8, lift = z >= 11 ? 40 : 30, y = y0 - lift;
    c.lineWidth = 3; c.strokeStyle = "#0d1b2a";
    c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x, y0 - 4); c.stroke();
    c.beginPath(); c.arc(x, y0 - 3, 3.2, 0, Math.PI * 2); c.fillStyle = sea ? "#2f6fb0" : "#cb4433"; c.fill(); c.stroke();
    rrect(c, x - w / 2 + 2, y - h / 2 + 3, w, h, 7); c.fillStyle = "rgba(13,27,42,0.4)"; c.fill();
    rrect(c, x - w / 2, y - h / 2, w, h, 7); c.fillStyle = sea ? "#eaf6ff" : "#fff4d6"; c.fill();
    c.lineWidth = 2.6; c.strokeStyle = "#0d1b2a"; c.stroke();
    c.beginPath(); c.moveTo(x - w / 2 - 4, y - h / 2 + 2); c.lineTo(x, y - h / 2 - w * 0.45); c.lineTo(x + w / 2 + 4, y - h / 2 + 2); c.closePath();
    c.fillStyle = sea ? "#2f6fb0" : "#cb4433"; c.fill(); c.stroke();
    drawEmoji(c, sea ? "⚓" : "🏡", x, y + 1, h * 0.78);
    if (z >= 10) {
      c.font = "800 12px " + LABEL_FONT; c.textAlign = "center"; c.lineWidth = 3.5; c.strokeStyle = "#fff";
      const t = FT().title(S.player ? S.player.company : "");
      c.strokeText(t, x, y - h / 2 - w * 0.45 - 6); c.fillStyle = "#0d1b2a"; c.fillText(t, x, y - h / 2 - w * 0.45 - 6);
    }
    farmHit = { x, y, r: w * 0.75 };
  });
}
/* Zeile auf der Auftragskarte: was die Kundschaft will, was davon da ist */
function farmOrderHTML(o) {
  if (!o.farm) return "";
  const ready = S.farm && farmOrderReady(o);
  return `<div class="ford">${Object.keys(o.farm.items).map(id => {
    const have = S.farm ? farmInv(id) : 0, need = o.farm.items[id];
    return `<span class="fchip${have < need ? " miss" : ""}">${FITEMS[id].i}<b>${fpair(id, have, need)}</b></span>`;
  }).join("")}<span class="ford-s">${ready ? "✓ alles da" : "fehlt noch"} · +${o.farm.xp} EP</span></div>`;
}

/* Adressen am Hof und in den Dörfern */
function farmNodeAddr(nodeId, kind) {
  if (nodeId === FARM_NODE) {
    const a = farmAddr();
    if (kind === "yard") a.t = "Stellplatz am Schuppen, " + a.t;
    return a;
  }
  const st = FTOWN_STREETS[nodeId] || FTOWN_STREETS_HOF[nodeId] || FTOWN_STREETS_FISCH[nodeId];
  if (!st) return null;
  const s = pick(st);
  const t = s[0] + " " + (1 + Math.floor(Math.random() * 70));
  return { lat: +(s[1] + rnd(-0.0012, 0.0012)).toFixed(5), lon: +(s[2] + rnd(-0.0018, 0.0018)).toFixed(5),
    t: kind === "yard" ? "Stellplatz, " + t : kind === "spaeti" ? "Späti, " + t : t, a: N[nodeId].short };
}
