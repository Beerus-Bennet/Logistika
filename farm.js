/* =========================================================================
   LOGISTIKA – farm.js
   Das Erbe: Opas Hof bei Werder (Havel). Spielstand, Felder, Obstbäume,
   Tiere mit Platz-Qualität, Masttiere für den Metzger, Gebäude mit
   Rezepten (auch Sägewerk mit Strom und Fischerei), Lager, Einkauf,
   Bestellungen aus der Gegend (laufen als echte Aufträge über die
   Disposition), Notizbuch, Übergang zur Spedition und Verkauf.
   Wald, Sägewerk, See, Mitarbeiter und Ereignisse: erbe.js.
   Die Darstellung steckt in farmview.js, worldview.js und fishview.js.
   ========================================================================= */

/* ------------------------------ Zustand ------------------------------- */
function farmOn() { return !!(S && S.farm && !S.farm.sold); }
/* vor der Speditionsgründung: nur Hof, eigene Ware, keine fremden Aufträge */
function farmPhase() { return farmOn() && !S.farm.logi; }
function logiOn() { return !S || !S.farm || !!S.farm.logi || !!S.farm.sold; }

const FG = 32;                         /* Hofkachel = Welt + FG/2 (das alte 32er-Raster bestimmt nur noch die Umrechnung) */
/* bebaubar (Kacheln, x0/z0 inklusiv, x1/z1 exklusiv) – farmBoundsUpdate() setzt es je Ausbaustufe (erbe.js) */
let FIN = { x0: 1, z0: -2, x1: 31, z1: 30 };
/* Belegungsraster: Kacheln −16 … 47 (Welt −32 … 31) – darin hat auch der größte Hof Platz */
const FGO = -16, FGN = 64;
function fgi(x, z) { x -= FGO; z -= FGO; return x < 0 || z < 0 || x >= FGN || z >= FGN ? -1 : z * FGN + x; }
/* Objekte, die im Wasser stehen (Fischerei) */
const FWATER_T = new Set(["pot", "mline", "netz", "kutter", "steg"]);
function needZone(t, k) { return FWATER_T.has(t) || (t === "deco" && FDECO[k] && FDECO[k].water) ? "w" : "l"; }
function objWater(o) { return needZone(o.t, o.k) === "w"; }
function penKind(o) { for (const k in FANIMALS) if (FANIMALS[k].house === o.t) return k; return null; }

function farmNew() {
  const kind = "hof";
  farmUseSite(kind);
  const F = {
    v: 1, kind, logi: false, sold: null, snd: true, seq: 1,
    objs: [], inv: {}, cap: { silo: 1, barn: 1, holz: 1, fisch: 1 },
    stats: { harvest: 0, made: 0, eggs: 0, milk: 0, deliv: 0, earned: 0, pearls: 0, angel: 0, trips: 0, meat: 0, prod: {} },
    qi: 0, qp: 0, qdone: false, qv: 6, qset: {}, tally: {}, flour: 1, econ: 2, lastOrd: -999, tut: { step: 0, done: false }, born: S.time, quick: {}, xp: 0
  };
  S.farm = F;
  S.xp = 0;
  const add = (t, x, z, extra) => farmAddObj(Object.assign({ t, x, z }, extra || {}));
  farmStartHof(add, F);
  erbeInit(F, true);
  farmBoundsUpdate();
  return F;
}
function farmStartHof(add, F) {
  /* v56: alles zwei Kacheln weiter von der Straße weg (der Hof ist nach Norden gerückt) */
  add("house", 5, 2);
  add("barn", 10, 2);                     /* v53: Scheune steht Rand an Rand am Wohnhaus */
  add("silo", 16, 3);
  add("mill", 19, 2, { q: [], done: [], slots: 2 });
  add("bakery", 5, 8, { q: [], done: [], slots: 2 });
  /* Hühnerstall: drei Hühner, eines hat schon gelegt */
  const coop = add("coop", 4, 14, { lvl: 1, animals: [] });
  for (let i = 0; i < 3; i++) coop.animals.push({ id: F.seq++, v: i % 3, fed: S.time - 1, q: 3 });
  /* Felder: drei reif mit Weizen, drei leer */
  [[11, 9], [13, 9], [15, 9], [11, 11], [13, 11], [15, 11]].forEach(([x, z], i) =>
    add("field", x, z, i < 3 ? { crop: "weizen", end: S.time - 1, w: false, rot: 0, last: null } : { crop: null, last: "mais" }));
  add("tree", 21, 7, { kind: "apfel", end: S.time - 1, w: false, h: 2 });
  add("tree", 23, 7, { kind: "apfel", end: S.time - 1, w: false, h: 2 });
  add("board", 19, 23);
  add("shed", 23, 23);
  add("deco", 17, 10, { k: "scarecrow" });
  add("deco", 4, 7, { k: "flowers" });
  add("deco", 10, 7, { k: "flowers" });
  add("deco", 22, 25, { k: "mailbox" });
  add("deco", 26, 11, { k: "leafTree", arg: 1.1 });
  add("deco", 9, 19, { k: "bushes" });
  add("deco", 25, 3, { k: "pine", arg: 1.0 });
  /* Startvorrat aus Opas Scheune */
  farmAdd("weizen", 6, 3); farmAdd("mais", 4, 3); farmAdd("mehl", 4, 3); farmAdd("hfutter", 6, 3); farmAdd("apfel", 2, 3);
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
  else if (o.t === "f_plot" && typeof FFISHERY !== "undefined" && FFISHERY[o.k]) { w = FFISHERY[o.k].sz[0]; d = FFISHERY[o.k].sz[1]; }
  else { const s = FSIZE[o.t] || [1, 1]; w = s[0]; d = s[1]; }
  return o.r ? [d, w] : [w, d];
}
/* Weltmitte eines Objekts */
function farmCenter(o) {
  const [w, d] = farmSize(o);
  return [o.x + w / 2 - FG / 2, o.z + d / 2 - FG / 2];
}

/* Kieswege: dort wird nicht gebaut (Hauptweg vom Südtor, Querweg vor Haus und Scheune zum Westtor).
   v56: Welt z −10 … −9 (Querweg) und x 4 … 6 (Hauptweg), bis an den Rand des größten Hofs.
   Schlüssel: fgi(x, z) – fgXZ(k) rechnet zurück in Kacheln. */
const FPATH = new Set();
for (let j = 6; j < 30; j++) { FPATH.add(fgi(20, j)); FPATH.add(fgi(21, j)); }
for (let i = -8; i < 22; i++) FPATH.add(fgi(i, 6));
FSITES.hof.path = FPATH;
function fgXZ(k) { return [(k % FGN) + FGO, Math.floor(k / FGN) + FGO]; }
/* Belegung des Rasters (ohne das ausgenommene Objekt); Wege zählen als belegt (-1) */
function farmOcc(except) {
  const g = new Int32Array(FGN * FGN);
  (FSITE.path || FPATH).forEach(k => { if (k >= 0) g[k] = -1; });
  S.farm.objs.forEach(o => {
    if (except && o.id === except) return;
    const [w, d] = farmSize(o);
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
      const k = fgi(o.x + i, o.z + j);
      if (k >= 0) g[k] = o.id;
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
/* ------------------------------ Bauzonen -----------------------------------
   v53: Neben dem Hof gibt es den Sägewerkshof (innerhalb seines Zauns) und den
   Straßenrand (nur für den Verkaufsstand). Sägewerksgebäude bleiben im
   Sägewerk, kleinere Gebäude (Maschinen) dürfen zwischen Hof und Sägewerk
   wechseln; Wohnhaus und Fischerei bleiben, wo sie sind. Kacheln: Welt + 16.
   v56: der Sägewerkshof liegt 12 Kacheln weiter im Nordwesten. */
const FYARD = { x0: -37, x1: -13, z0: -37, z1: -15 };            /* Welt x −53 … −29, z −53 … −31 */
const FROADSIDE = { x0: -14, x1: 60, z0: 32, z1: 33 };           /* Welt z 16 … 17, nördlich der Straße */
/* vor den Toren bleibt frei (Kacheln) */
const FYARD_KEEP = [[-27, -23, -18, -15], [-27, -23, -38, -34], [-38, -34, -28, -24]];
/* Holzstapel am Rand (FWORLD.piles) – solange sie liegen; verkauft ist der Platz frei */
function farmYardKeep() {
  const out = FYARD_KEEP.slice(), sold = (S.farm && S.farm.piles) || {};
  if (typeof FWORLD !== "undefined") FWORLD.piles.forEach((p, i) => { if (!sold[i]) out.push(pileTiles(p)); });
  return out;
}
/* Kacheln unter einem Holzstapel [x0, x1, z0, z1] (Stämme liegen längs z, gedreht um ry) */
function pileTiles([x, z, ry]) {
  const c = Math.cos(ry), s = Math.sin(ry), xs = [], zs = [];
  [[-0.45, -1.45], [0.65, -1.45], [-0.45, 0.05], [0.65, 0.05]].forEach(([a, b]) => { xs.push(x + c * a + s * b); zs.push(z - s * a + c * b); });
  return [Math.floor(Math.min(...xs) + FG / 2), Math.ceil(Math.max(...xs) + FG / 2), Math.floor(Math.min(...zs) + FG / 2), Math.ceil(Math.max(...zs) + FG / 2)];
}
const FSAW_MAIN = new Set(["sw_halle", "sw_lager", "sw_buero", "sw_lkw", "kessel"]);
function farmZones(t, k) {
  if (t === "stall") return ["road"];
  if (FSAW_MAIN.has(t) || (t === "board" && k === "saege")) return ["yard"];
  if (t === "saegebock" || t === "deco" || (FMACHINES[t] && !FMACHINES[t].fish)) return ["hof", "yard"];
  return ["hof"];
}
function farmZoneRect(z) { return z === "yard" ? FYARD : z === "road" ? FROADSIDE : FIN; }
function farmZoneAt(x, z, w, d) {
  for (const zn of ["hof", "yard", "road"]) { const R = farmZoneRect(zn); if (x >= R.x0 && z >= R.z0 && x + w <= R.x1 && z + d <= R.z1) return zn; }
  return null;
}
/* Rechteck frei? (außerhalb des Hofrasters: gegen alle Objekte prüfen) */
function farmFreeRect(x, z, w, d, except) {
  for (const o of S.farm.objs) {
    if (except && o.id === except) continue;
    const [ow, od] = farmSize(o);
    if (x < o.x + ow && o.x < x + w && z < o.z + od && o.z < z + d) return false;
  }
  return true;
}
function farmFits(x, z, w, d, except, t, k) {
  const zn = farmZoneAt(x, z, w, d);
  if (!zn) return false;
  if (t && !farmZones(t, k).includes(zn)) return false;
  if (!t && zn !== "hof") return false;
  if (zn === "yard") {
    if (typeof farmAreaOpen === "function" && !farmAreaOpen("saege")) return false;
    if (farmYardKeep().some(([a, b, c, e]) => x < b && a < x + w && z < e && c < z + d)) return false;
    return farmFreeRect(x, z, w, d, except);
  }
  if (zn === "road") {
    if (x < 24 && x + w > 18) return false;                       /* Einfahrt zum Hof bleibt frei */
    const x0 = x - FG / 2, x1 = x0 + w;
    if (farmRoadKeep().some(([a, b]) => x0 < b && a < x1)) return false;
    return farmFreeRect(x, z, w, d, except);
  }
  if (!zoneOk(x, z, w, d, t, k)) return false;
  const g = farmOcc(except);
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { const k = fgi(x + i, z + j); if (k < 0 || g[k]) return false; }
  return true;
}
/* Straßenrand: was dort schon steht (Welt-x von … bis): Traktor mit Anhänger und der
   fliegende Händler, ab Stufe 3 Laternen und Blumen vor dem Zaun */
function farmRoadKeep() {
  const st = (S.farm && S.farm.stage) || 1, big = st >= 4, out = [[8.4, 12.2]];
  /* v56: Laternen und Blumen stehen jetzt am Zaun, zwei Kacheln vor der Straße – frei bleiben Traktor und die Laternen an der Straße */
  if (st >= 2) out.push(big ? [26.0, 31.4] : [9.0, 14.4]);
  if (st >= 3) [-8, 18].forEach(x => out.push([x - 0.6, x + 0.6]));
  return out;
}
/* freier Platz in einer Zone, möglichst nah an (px, pz) – Kacheln */
function farmZoneSpot(zn, w, d, px, pz, t, k, except) {
  const R = farmZoneRect(zn);
  let best = null, bd = Infinity;
  for (let z = R.z0; z + d <= R.z1; z++) for (let x = R.x0; x + w <= R.x1; x++) {
    const dd = Math.hypot(x + w / 2 - px, z + d / 2 - pz);
    if (dd >= bd || !farmFits(x, z, w, d, except, t, k)) continue;
    bd = dd; best = [x, z];
  }
  return best;
}
/* freier Platz möglichst nah an (px, pz) */
function farmFreeSpot(w, d, px, pz, t, k) {
  const g = farmOcc();
  let best = null, bd = Infinity;
  for (let z = FIN.z0; z + d <= FIN.z1; z++)
    for (let x = FIN.x0; x + w <= FIN.x1; x++) {
      let ok = zoneOk(x, z, w, d, t, k);
      for (let i = 0; i < w && ok; i++) for (let j = 0; j < d; j++) { const q = fgi(x + i, z + j); if (q < 0 || g[q]) { ok = false; break; } }
      if (!ok) continue;
      const dd = Math.hypot(x + w / 2 - (px == null ? 16 : px), z + d / 2 - (pz == null ? 14 : pz));
      if (dd < bd) { bd = dd; best = [x, z]; }
    }
  return best;
}

/* ------------------------------ Lager --------------------------------- */
function farmInv(id) { return (S.farm.inv[id] && S.farm.inv[id].n) || 0; }
function farmQ(id) { const e = S.farm.inv[id]; return e && e.n ? e.q : 0; }
function farmStoreCap(st) {
  const s = FSTORE[st];
  let c = s.base + s.step * ((S.farm.cap[st] || 1) - 1) + (typeof farmStageStoreBonus === "function" ? farmStageStoreBonus(st) : 0);
  if (st === "holz" && S.farm.saw && S.farm.areas && S.farm.areas.saege) c += 60;
  if (st === "fisch") S.farm.objs.forEach(o => { c += FFISH_STORE_BONUS[o.t] || 0; });
  return c;
}
function farmStoreUsed(st) {
  let n = 0;
  for (const id in S.farm.inv) if (FITEMS[id] && FITEMS[id].st === st) n += S.farm.inv[id].n;
  return n;
}
function farmRoom(id) {
  const it = FITEMS[id];
  if (it.energy) return Math.max(0, Math.floor((farmEnCap() - (S.farm.en || 0)) / it.energy));
  return farmStoreCap(it.st) - farmStoreUsed(it.st);
}
/* Fische liegen nach Sternen getrennt: qs[1 … 5] = Stück je Stufe,
   n und q (Summe, Durchschnitt) bleiben für alle anderen Leser gleich */
function farmQsOn(id) { return !!(FITEMS[id] && FITEMS[id].k === "fisch"); }
function farmQsFix(e) {
  e.n = e.qs.reduce((a, b) => a + b, 0);
  e.q = e.n ? e.qs.reduce((a, b, i) => a + b * i, 0) / e.n : 3;
}
/* hinzufügen mit Durchschnittsqualität */
function farmAdd(id, n, q) {
  if (!n) return;
  const e = S.farm.inv[id] || (S.farm.inv[id] = { n: 0, q: 3 });
  if (farmQsOn(id)) {
    e.qs = e.qs || [0, 0, 0, 0, 0, 0];
    e.qs[clamp(Math.round(q || 3), 1, 5)] += n;
    return farmQsFix(e);
  }
  e.q = (e.q * e.n + (q || 3) * n) / (e.n + n);
  e.n += n;
}
/* Fisch: zuerst die schlechtesten Sterne – die guten bleiben für den Verkauf */
function farmTake(id, n) {
  const e = S.farm.inv[id];
  if (!e || e.n < n) return false;
  if (e.qs) {
    for (let s = 1, left = n; s <= 5 && left; s++) { const k = Math.min(left, e.qs[s]); e.qs[s] -= k; left -= k; }
    farmQsFix(e);
  } else e.n -= n;
  if (!e.n) delete S.farm.inv[id];
  return true;
}
/* genau eine Sternstufe */
function farmInvQ(id, q) { const e = S.farm.inv[id]; return e && e.qs ? e.qs[q] || 0 : 0; }
function farmTakeQ(id, q, n) {
  const e = S.farm.inv[id];
  if (!e || !e.qs || (e.qs[q] || 0) < n) return false;
  e.qs[q] -= n;
  farmQsFix(e);
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
  if (!n || !S.farm) return;
  S.farm.xp = (S.farm.xp || 0) + n;
  /* vor der Gründung zeigt die Kopfzeile das Erbe-Level – sonst eigene Feier */
  if (farmPhase()) checkLevel(); else farmCheckLevel();
}
function farmCheckLevel() {
  const l = flv();
  if (l > (S.farm.lvSeen || 1)) {
    S.farm.lvSeen = l;
    farmClover(3, "Level " + l);
    if (!(typeof farmLevelUp === "function" && farmLevelUp(l))) toast("🏡 Erbe-Level " + l + " erreicht!", "ok");
    farmEvent("level");
  }
}

/* ---------------------------- Freischaltung --------------------------- */
function farmCropOk(id) { return FCROPS[id] && FCROPS[id].lv <= flv(); }
/* Lässt sich die Ware im Moment überhaupt herstellen (oder kaufen)? */
function farmCanMake(id, seen) {
  const it = FITEMS[id], lv = flv(), objs = S.farm.objs;
  if (!it) return false;
  seen = seen || new Set();
  if (seen.has(id)) return false;
  seen.add(id);
  if (it.k === "crop") return farmCropOk(id);
  if (it.k === "fruit") return objs.some(o => o.t === "tree" && o.kind === id);
  /* Rohholz: es steht ein passender Baum, den das Werkzeug schafft */
  if (it.k === "holz") return id === "aeste" || id === "reste" ? true
    : (S.farm.trees || []).some(t => FSPECIES[t.sp].log === id && treeOpen(t) && t.st === "up" && treeTool(t));
  if (it.k === "fisch") return FGROUNDS.some(g => farmGroundOk(g) && g.fish[id]) || (Object.keys(FPOTS).some(k => farmPotOk(k) && FPOTS[k].mix[id]) && objs.some(o => o.t === "pot"));
  if (it.k === "wild") return farmAreaOpen("wald");
  if (farmPotOk(id) && objs.some(o => o.t === "pot")) return true;
  for (const lk in FLINES) {
    const L = FLINES[lk];
    if ((L.out === id || (L.extra && L.extra[id]) || (id === "perle" && L.pearl)) && objs.some(o => o.t === "mline" && o.kind === lk)) return true;
  }
  for (const ak in FANIMALS) { const A = FANIMALS[ak]; if (A.out === id && objs.some(o => o.t === A.house && o.animals.length)) return true; }
  const sh = FSHOP.find(s => s.item === id);
  if (sh && sh.lv <= lv) return true;
  for (const mk in FMACHINES) {
    if (!objs.some(o => o.t === mk && machReady(o))) continue;
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
  toast(S0.i + " " + S0.the + " ist voll – liefern, verkaufen oder ausbauen.", "warn");
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
/* Köder rein, Reuse runter – ein Beutel je Reuse (Köderdose, sonst eine Portion Mais) */
function farmBaitItem() { return farmInv("koeder") ? "koeder" : farmInv("mais") ? "mais" : null; }
function farmBait(o, kind) {
  if (!o || o.t !== "pot" || o.kind || !farmPotOk(kind)) return false;
  const b = farmBaitItem();
  if (!b) return "nobait";
  const q = farmQ(b) || 3;
  farmTake(b, 1);
  o.kind = kind; o.end = S.time + FPOTS[kind].t; o.bq = q;
  farmEvent("bait:" + kind);
  return true;
}
/* Reuse hochziehen: 2 Tiere, manchmal 3. Was drin ist, würfelt die Stufe;
   jedes Tier hat Länge, Gewicht und Sterne (frischer Köder hilft) */
function farmHaul(o) {
  if (!o || o.t !== "pot" || potState(o) !== "ripe") return null;
  const P = FPOTS[o.kind];
  const n = P.yield + (Math.random() < 0.2 ? 1 : 0);
  if (farmStoreCap("fisch") - farmStoreUsed("fisch") < n) { farmFull("fisch"); return null; }
  const got = [];
  for (let i = 0; i < n; i++) {
    const sp = farmWPick(Object.keys(P.mix), x => P.mix[x]);
    const s = specRoll(FPOTS[sp], (P.tier - 1) * 0.3), q = specQ(s, ((o.bq || 3) - 1) / 4);
    farmAdd(sp, 1, q);
    got.push({ sp, q, cm: s.cm, kg: s.kg });
    if (angelS()) angelLog(sp, s, q, null);
  }
  const id = o.kind, xp = got.reduce((a, g) => a + FITEMS[g.sp].xp, 0), q = Math.round(got.reduce((a, g) => a + g.q, 0) / n);
  o.last = id; o.kind = null; o.bq = 0;
  S.farm.stats.harvest += n;
  farmXP(xp);
  got.forEach(g => farmEvent("harvest:" + g.sp));
  return { id: got[0].sp, n, q, xp, got };
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
  const q = Math.min(5, penInfo(o).stars);
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
/* Streicheln gibt es nicht mehr als Qualitäts-Trick – die Sterne kommen vom Platz im Stall */
function farmPet() { return false; }
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
  if (!farmFits(o.x, o.z, w, d, o.id, o.t)) return toast("Kein Platz – rechts oder unten steht was im Weg (lange drücken zum Verschieben).", "warn"), false;
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
  if (o.broken) return;                 /* Maschine klemmt: nichts läuft weiter */
  while (o.q.length && o.q[0].end <= S.time) {
    const it = o.q.shift();
    /* Strom fließt gleich in den Speicher – nichts abzuholen */
    if (FITEMS[it.r] && FITEMS[it.r].energy) { farmPowerIn(o, it.n); continue; }
    o.done.push({ r: it.r, q: it.q, n: it.n, by: it.by || null });
  }
}
function farmPowerIn(o, n) {
  const F = S.farm, kwh = FITEMS.strom.energy * n, before = F.en || 0;
  F.en = Math.min(farmEnCap(), before + kwh);
  farmXP(n);
  farmEvent("make:strom", n);
  if (typeof farmPowerFx === "function") farmPowerFx(o, Math.round(F.en - before), F.en >= farmEnCap());
}
/* Rezepte mit gleicher Ware (z. B. Brennholz aus Ästen oder Birke) haben einen eigenen Schlüssel */
const rkey = r => r.key || r.id;
function recipeOf(o, rid) { return FMACHINES[o.t].recipes.find(r => rkey(r) === rid); }
/* Läuft die Maschine überhaupt? (Sägewerk erst nach den Reparaturen) */
function machReady(o) {
  if (o.t === "sw_halle") return sawRepaired();
  if (o.t === "kessel") return !!(S.farm.saw && S.farm.saw.motor);
  if (FMACHINES[o.t] && FMACHINES[o.t].saw) return sawRepaired();
  return true;
}
function kesselSunOff(o, r) { return o.t === "kessel" && !!(FITEMS[r.id] && FITEMS[r.id].energy) && typeof pvSun === "function" && pvSun(); }
function farmQueue(o, rid) {
  machUpdate(o);
  const r = recipeOf(o, rid);
  if (!r || r.lv > flv()) return "locked";
  if (!machReady(o)) return "broken";
  /* v57: speist das volle Solardach ein (tagsüber), heizt der Kessel nicht – Strom aus dem Kessel erst nachts */
  if (kesselSunOff(o, r)) return "sun";
  if (o.broken) return "jam";
  if (o.q.length + o.done.length >= machSlots(o)) return "full";
  if (!farmHasAll(r.in)) return "missing";
  if (r.cost && S.money < r.cost) return "money";
  /* volles Solardach: die Säge braucht keinen Strom aus dem Kessel mehr */
  const sun = typeof pvSun === "function" && pvSun();
  const en = r.en && !sun ? Math.max(1, Math.round(r.en * (1 - staffPerk("mechaniker")))) : 0;
  if (en && (S.farm.en || 0) < en) return "energy";
  if (en) S.farm.en -= en;
  let qs = 0, qn = 0;
  for (const id in r.in) { qs += farmQ(id) * r.in[id]; qn += r.in[id]; farmTake(id, r.in[id]); }
  const M = FMACHINES[o.t];
  if (r.cost) {
    S.money -= r.cost; S.expense += r.cost;
    logMoney("farm", (r.trip ? "Diesel · " + r.trip : "Sprit · " + M.n), -r.cost);
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
  const tk = o.t === "sw_halle" && (o.lvl || 1) >= 2 ? 0.67 : 1;
  const job = { r: r.id, k: rid, start, end: start + (quick ? r.tq : Math.round(r.t * tk)), q, n, by: r.by || null };
  /* die erste Kutterfahrt im Rundgang läuft im Zeitraffer: sofort fertig,
     der Kutter bleibt am Kai */
  if (quick && M.trips) { job.tut = 1; job.end = start; }
  o.q.push(job);
  return true;
}
/* v53: Auftrag aus der Warteschlange nehmen – Zutaten kommen zurück (bei Wartenden auch
   Sprit und Strom); die Nachfolger rücken auf */
function farmUnqueue(o, i) {
  machUpdate(o);
  const job = o.q[i];
  if (!job) return false;
  const r = recipeOf(o, job.k);
  if (r) {
    for (const id in r.in) farmAdd(id, r.in[id], job.q || 3);
    if (i > 0 && r.cost) { S.money += r.cost; S.revenue += r.cost; logMoney("farm", "Abgebrochen: " + FMACHINES[o.t].n, r.cost); }
    if (i > 0 && r.en && !(typeof pvSun === "function" && pvSun())) S.farm.en = Math.min(farmEnCap(), (S.farm.en || 0) + Math.max(1, Math.round(r.en * (1 - staffPerk("mechaniker")))));
  }
  o.q.splice(i, 1);
  let t = i === 0 ? S.time : o.q[i - 1].end;
  for (let k = i; k < o.q.length; k++) { const d = o.q[k].end - o.q[k].start; o.q[k].start = t; o.q[k].end = t + d; t += d; }
  return true;
}
function farmCollectMach(o) {
  machUpdate(o);
  if (!o.done.length) return [];
  const got = [];
  const M = FMACHINES[o.t];
  while (o.done.length) {
    const d = o.done[0];
    if (FITEMS[d.r].energy) {
      /* Strom geht in den Kessel – was nicht reinpasst, verpufft */
      o.done.shift();
      S.farm.en = Math.min(farmEnCap(), (S.farm.en || 0) + FITEMS[d.r].energy * d.n);
      farmXP(d.n);
      farmEvent("make:strom", d.n);
      got.push({ id: d.r, n: d.n, q: 3, xp: d.n, energy: FITEMS[d.r].energy * d.n });
      continue;
    }
    if (farmRoom(d.r) < d.n) { farmFull(FITEMS[d.r].st); break; }
    const byFull = d.by && Object.keys(d.by).find(b => farmRoom(b) < d.by[b]);
    if (byFull) { farmFull(FITEMS[byFull].st); break; }
    o.done.shift();
    farmAdd(d.r, d.n, d.q);
    if (d.by) for (const b in d.by) farmAdd(b, d.by[b], d.q);
    S.farm.stats.made += d.n;
    if (FITEMS[d.r].k === "wood") S.farm.stats.woodMade = (S.farm.stats.woodMade || 0) + d.n;
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
/* Fisch: Sterne zählen mehr (±15 % statt ±8 %); q = bestimmte Sternstufe */
function farmSellPrice(id, n, q) {
  q = q || farmQ(id) || 3;
  const f = FITEMS[id].k === "fisch" ? 0.15 : 0.08;
  return Math.max(0.1, Math.round(FITEMS[id].v * 0.5 * n * (1 + (q - 3) * f) * 10) / 10);
}
function farmSell(id, n, q) {
  /* Fisch ohne Stufe: von unten nach oben, jede Stufe zu ihrem Preis */
  if (!q && farmQsOn(id) && S.farm.inv[id] && S.farm.inv[id].qs) {
    let m = 0;
    for (let s = 1, left = Math.min(n, farmInv(id)); s <= 5 && left; s++) { const k = Math.min(left, farmInvQ(id, s)); if (k) { m += farmSell(id, k, s); left -= k; } }
    return m;
  }
  n = Math.min(n, q ? farmInvQ(id, q) : farmInv(id));
  if (!n) return 0;
  const m = farmSellPrice(id, n, q);
  if (q) farmTakeQ(id, q, n); else farmTake(id, n);
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
  const lv = flv();
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
function farmOrderCap() { return Math.min(8, 3 + Math.floor(flv() / 2)); }
function farmOrders() { return S.orders.filter(o => o.farm); }
/* v53: jede Station hat ihre eigene Bestelltafel – Hof, Sägewerk, Fischerei */
const FORD_AREAS = [{ id: "hof", i: "🏡", n: "Hof" }, { id: "saege", i: "🪚", n: "Sägewerk" }, { id: "see", i: "🎣", n: "Fischerei" }];
function farmItemArea(id) { const it = FITEMS[id]; return !it ? "hof" : it.st === "fisch" ? "see" : it.st === "holz" ? "saege" : "hof"; }
function farmOrderArea(o) {
  if (o.area) return o.area;
  const v = {};
  Object.keys(o.farm.items).forEach(id => { const a = farmItemArea(id); v[a] = (v[a] || 0) + (FITEMS[id].v || 1) * o.farm.items[id]; });
  return Object.keys(v).sort((a, b) => v[b] - v[a])[0] || "hof";
}
function farmOrderAreaOn(a) { return a === "hof" || (typeof farmAreaOpen === "function" && farmAreaOpen(a)); }
/* wie viele offene Angebote je Tafel (angenommene zählen nicht mit) */
function farmAreaCap(a) { return a === "hof" ? farmOrderCap() : Math.min(5, 2 + Math.floor(flv() / 8)); }
function farmOffers(a) { return farmOrders().filter(o => !o.acc && (!a || farmOrderArea(o) === a)); }
/* Annehmen: ab jetzt ohne Frist – das Angebot selbst verfällt nach einem Tag */
const FORD_NOLIMIT = 525600;
function farmAcceptOrder(o, by) {
  if (!o || !o.farm || o.acc) return false;
  o.acc = by || "chef";
  o.accT = S.time;
  o.expire = S.time + FORD_NOLIMIT; o.deadline = S.time + FORD_NOLIMIT;
  return true;
}
/* zurückgeben: ohne Strafe, solange noch nichts unterwegs ist */
function farmReturnOrder(o) {
  if (!o || !o.farm || o.farm.taken || o.tutF) return false;
  S.orders = S.orders.filter(x => x !== o);
  if (o.abo) { const A = (S.farm.abos || []).find(x => x.id === o.abo); if (A) A.miss = (A.miss || 0) + 1; }
  S.farm.lastOrd = S.time - 15;
  return true;
}
function farmMaxKg() {
  let m = 0;
  S.fleet.forEach(f => { const t = vType(f.type); if (t && (t.mode === "b" || t.mode === "r")) m = Math.max(m, t.cap); });
  return Math.max(25, m * 0.9);
}
function farmWPick(list, wf, rng) {
  const tot = list.reduce((s, x) => s + wf(x), 0);
  let r = (rng || Math.random)() * tot;
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
function makeFarmOrder(area) {
  const lv = flv();
  const towns = Object.keys(FTOWNS).filter(id => FTOWNS[id].lv <= lv && N[id] && isUnlocked(id));
  if (!towns.length) return null;
  const busy = new Set(farmOrders().filter(o => !o.acc).map(o => o.shipper));
  for (let tries = 0; tries < 30; tries++) {
    const town = farmWPick(towns, id => FTOWNS[id].w);
    const c = pick(FTOWNS[town].cust);
    if (busy.has(c[0])) continue;
    const wants = c[1].filter(id => FITEMS[id] && (farmCanMake(id) || farmInv(id) > 0) && (!area || farmItemArea(id) === area));
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
    const order = farmOrderObj(town, c[0], items, area ? { area } : null);
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
  const F = S.farm, areas = FORD_AREAS.map(a => a.id).filter(farmOrderAreaOn);
  const lim = areas.length * 3;
  for (let k = 0; k < lim && added < (n || 1) && areas.length; k++) {
    /* reihum: die Tafel mit den wenigsten Angeboten zuerst */
    const a = areas.slice().sort((x, y) => farmOffers(x).length / farmAreaCap(x) - farmOffers(y).length / farmAreaCap(y))[0];
    if (farmOffers(a).length >= farmAreaCap(a)) break;
    const o = makeFarmOrder(a);
    if (!o) { areas.splice(areas.indexOf(a), 1); continue; }
    S.orders.push(o); added++;
  }
  F.ordRot = (F.ordRot || 0) + 1;
  if (added) renderDirty = true;
  return added;
}

/* ---------------------------- Daueraufträge ---------------------------------
   Größere Firmen wollen jede Woche dasselbe: z. B. der Baumarkt 6 Paletten
   Bretter. Fester Bonus je Lieferung, läuft, bis du kündigst. Wird eine Woche
   nicht geliefert, bleibt die Bestellung stehen – nach drei verpassten Wochen
   kündigt die Firma. */
const FABO_WEEK = 10080;
const FABO = [
  { area: "saege", firm: "Baumarkt Werder",        town: "w-werder",  item: "bretter",  pal: 6, per: 2, bonus: 140 },
  { area: "saege", firm: "Zimmerei Geltow",         town: "w-geltow",  item: "balken",   pal: 4, per: 2, bonus: 160 },
  { area: "saege", firm: "Kaminstudio Werder",      town: "w-werder",  item: "brennholz", pal: 5, per: 3, bonus: 110 },
  { area: "saege", firm: "Tischlerei Glindow",      town: "w-glindow", item: "dielen",   pal: 4, per: 2, bonus: 170 },
  { area: "saege", firm: "Palettenwerk Potsdam",    town: "potsdam",   item: "paletten", pal: 6, per: 2, bonus: 150 },
  { area: "hof",   firm: "Großbäckerei Potsdam",    town: "potsdam",   item: "mehl",     pal: 4, per: 3, bonus: 90 },
  { area: "hof",   firm: "Frischemarkt Werder",     town: "w-werder",  item: "ei",       pal: 3, per: 4, bonus: 70 },
  { area: "hof",   firm: "Hotel Havelblick",        town: "w-werder",  item: "milch",    pal: 3, per: 4, bonus: 90 },
  { area: "hof",   firm: "Mosterei Glindow",        town: "w-glindow", item: "apfel",    pal: 4, per: 4, bonus: 80 },
  { area: "see",   firm: "Fischrestaurant Potsdam", town: "potsdam",   item: "raeucherforelle", pal: 3, per: 3, bonus: 130 },
  { area: "see",   firm: "Feinkost Werder",         town: "w-werder",  item: "konserve", pal: 3, per: 4, bonus: 110 },
  { area: "see",   firm: "Kantine Geltow",          town: "w-geltow",  item: "barschfilet", pal: 3, per: 3, bonus: 100 }
];
function farmAboPal(A) { return A.pal + (A.item === "paletten" ? " Stapel " : " Paletten ") + FITEMS[A.item].n; }
function farmAbos() { const F = S.farm; F.abos = F.abos || []; F.aboOff = F.aboOff || []; return F.abos; }
/* passt die Ladung aufs größte eigene Fahrzeug? Sonst weniger Paletten */
function farmAboFit(T) {
  const kg = FITEMS[T.item].kg * T.per, max = farmMaxKg();
  return Math.min(T.pal, Math.floor(max / Math.max(1, kg)));
}
function farmAboOk(T) {
  return FITEMS[T.item] && N[T.town] && (typeof isUnlocked !== "function" || isUnlocked(T.town)) && farmOrderAreaOn(T.area) && (farmCanMake(T.item) || farmInv(T.item) > 0) && flv() >= 6 && farmAboFit(T) >= 2;
}
/* Wochenbestellung erzeugen (angenommen, ohne Frist bis zur nächsten Woche) */
function farmAboOrder(A) {
  const o = farmOrderObj(A.town, A.firm, { [A.item]: A.pal * A.per }, { area: A.area, abo: A.id });
  if (!o) return null;
  farmAcceptOrder(o, "abo");
  o.pay = Math.round((o.pay + A.bonus) * 10) / 10;
  o.desc = "Wochenlieferung: " + farmAboPal(A) + " (" + fqty(A.item, A.pal * A.per) + ")";
  o.aboWeek = (A.n || 0) + (A.miss || 0) + 1;
  S.orders.push(o);
  return o;
}
function farmAboTick() {
  const F = S.farm, abos = farmAbos();
  /* Angebot je Station: höchstens eins offen, höchstens zwei laufende Verträge */
  F.aboOff = F.aboOff.filter(x => x.exp > S.time && farmOrderAreaOn(x.area));
  if (S.time - (F.aboT || -1e9) > 720) {
    F.aboT = S.time;
    FORD_AREAS.forEach(a => {
      if (F.aboOff.some(x => x.area === a.id) || abos.filter(x => x.area === a.id).length >= 2) return;
      const pool = FABO.filter(T => T.area === a.id && farmAboOk(T) && !abos.some(x => x.firm === T.firm));
      if (!pool.length || Math.random() < 0.5) return;
      const T = pick(pool);
      F.aboOff.push(Object.assign({}, T, { id: "abo" + (S.seq++), pal: farmAboFit(T), exp: S.time + 2880 }));
    });
  }
  /* jede Woche: neue Lieferung – oder die alte steht noch (verpasst) */
  abos.slice().forEach(A => {
    if (S.time < A.next) return;
    A.next += FABO_WEEK;
    const open = S.orders.find(o => o.abo === A.id && !o.farm.taken);
    if (open) {
      A.miss = (A.miss || 0) + 1;
      if (A.miss >= 3) {
        farmAboCancel(A.id, true);
        toast("📅 " + A.firm + " hat den Dauerauftrag gekündigt – drei Wochen nichts geliefert.", "bad");
      } else toast("📅 " + A.firm + ": Die Lieferung dieser Woche fehlt noch (" + A.miss + "/3).", "warn");
      return;
    }
    farmAboOrder(A);
    toast("📅 " + A.firm + " bestellt die Wochenlieferung: " + farmAboPal(A) + ".", "ok", true);
  });
}
function farmAboTake(id) {
  const F = S.farm, T = (F.aboOff || []).find(x => x.id === id);
  if (!T) return null;
  F.aboOff = F.aboOff.filter(x => x !== T);
  const A = Object.assign({}, T, { since: S.time, next: S.time + FABO_WEEK, n: 0, miss: 0 });
  delete A.exp;
  farmAbos().push(A);
  farmAboOrder(A);
  return A;
}
function farmAboCancel(id, byFirm) {
  const F = S.farm;
  F.abos = farmAbos().filter(x => x.id !== id);
  S.orders = S.orders.filter(o => o.abo !== id || (o.farm && o.farm.taken));
  if (!byFirm) F.aboOff = (F.aboOff || []).filter(x => x.id !== id);
}
function farmAboDelivered(o) {
  const A = o.abo && farmAbos().find(x => x.id === o.abo);
  if (A) { A.n = (A.n || 0) + 1; A.miss = 0; }
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
  farmAboDelivered(o);
  S.farm.stats.deliv++;
  S.farm.stats.earned += pay;
  /* Fahrer/in im Team: Trinkgeld obendrauf */
  const tip = Math.round(pay * staffPerk("fahrer") * 10) / 10;
  if (tip > 0) { S.money += tip; S.revenue += tip; logMoney("farm", "Bonus Fahrer/in · " + o.shipper, tip); }
  farmXP(o.farm.xp);
  farmEvent("deliver");
  farmEvent("deliver:" + o.to);
  if (Object.keys(o.farm.items).some(id => FITEMS[id] && (FITEMS[id].k === "wood" || FITEMS[id].k === "holz"))) farmEvent("deliver:wood");
  if (Object.keys(o.farm.items).some(id => FITEMS[id] && FITEMS[id].st === "fisch")) farmEvent("deliver:fish");
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

/* ----------------------- Notizbuch / Logbuch --------------------------
   Drei Stränge laufen nebeneinander: Hof (Kapitel 1–4), Wald & Holz (5–8)
   und See (9–10), am Ende der Wirtschaftshof (11). Von jedem Strang steht die
   nächste offene Aufgabe oben links. Gezählt wird alles, was man je gemacht
   hat – wer schon drei Bäume gefällt hat, für den ist „Fälle 3 Bäume“ sofort
   erledigt. Erledigtes wird von selbst abgehakt und ausgezahlt. */
const FQ_STRANDS = [
  { id: "hof",  i: "🌾", n: "Hof",            ch: [0, 1, 2, 3] },
  { id: "wald", i: "🌲", n: "Wald & Holz",    ch: [4, 5, 6, 7], show: () => flv() >= 4 || farmAreaOpen("wald") },
  { id: "see",  i: "🎣", n: "See",            ch: [8, 9],       show: () => flv() >= 13 || farmAreaOpen("see") },
  { id: "end",  i: "⭐", n: "Wirtschaftshof", ch: [10],         show: () => FQUESTS.every((q, k) => q.c >= 10 || farmQDone(k)) }
];
function farmStrands() { return FCHAPTERS.length === 11 ? FQ_STRANDS : [{ id: "all", i: "📒", n: "Notizbuch", ch: FCHAPTERS.map((_, i) => i) }]; }
function farmQDone(i) { return !!(S.farm && S.farm.qset && S.farm.qset[i]); }
/* Fortschritt: Zustand („steht schon“), Level oder alles, was je gezählt wurde */
function farmQProg(q) {
  if (q.chk) return q.chk() ? q.n : 0;
  if (q.ev === "level") return Math.min(q.n, flv());
  return Math.min(q.n, (S.farm.tally && S.farm.tally[q.ev]) || 0);
}
/* Die sichtbaren Aufgaben: je Strang die erste offene */
function farmQActive() {
  if (!S.farm || S.farm.sold || !S.farm.qset) return [];
  const out = [];
  farmStrands().forEach(st => {
    if (st.show && !st.show()) return;
    const i = FQUESTS.findIndex((q, k) => st.ch.includes(q.c) && !farmQDone(k));
    if (i >= 0) out.push({ st, i, q: FQUESTS[i], p: farmQProg(FQUESTS[i]) });
  });
  return out;
}
function farmQuest() { const a = farmQActive(); return a.length ? a[0].q : null; }
function farmChapterOf(c) {
  let done = 0, n = 0;
  FQUESTS.forEach((q, k) => { if (q.c === c) { n++; if (farmQDone(k)) done++; } });
  return { c, done, n };
}
function farmChapter() { const q = farmQuest(); return farmChapterOf(q ? q.c : FCHAPTERS.length - 1); }
function farmDone() { return !!(S.farm && !S.farm.sold && (S.farm.done || (S.farm.qset && FQUESTS.every((q, k) => farmQDone(k))))); }
function farmEvent(key, n) {
  if (!S.farm) return;
  n = n || 1;
  const T = S.farm.tally || (S.farm.tally = {});
  T[key] = (T[key] || 0) + n;
  farmQuestCheck();
  if (typeof farmTutSignal === "function") farmTutSignal(key, n);
}
/* Erledigtes abhaken – auch mehrere auf einmal (nachträglich Geschafftes) */
let farmQBusy = false;
function farmQuestCheck() {
  const F = S.farm;
  if (!F || F.sold || !F.qset || farmQBusy) return;
  if (F.tut && !F.tut.done) return;                              /* erst nach Linas Rundgang */
  farmQBusy = true;
  const got = [];
  try {
    for (let guard = 0; guard < 90; guard++) {
      const a = farmQActive().find(x => x.p >= x.q.n);
      if (!a) break;
      got.push(farmQClaimI(a.i));
    }
  } finally { farmQBusy = false; }
  if (got.length && typeof farmViewQuest === "function") farmViewQuest(got);
}
function farmQClaimI(i) {
  const F = S.farm, q = FQUESTS[i];
  F.qset[i] = 1;
  S.money += q.r.m; S.revenue += q.r.m;
  logMoney("farm", FT().book + ": " + q.t, q.r.m);
  farmXP(q.r.xp);
  const nx = FQUESTS.findIndex((x, k) => !farmQDone(k));
  F.qi = nx < 0 ? FQUESTS.length : nx;
  let chapter = null;
  if (FQUESTS.every((x, k) => x.c !== q.c || farmQDone(k))) {
    chapter = FCHAPTERS[q.c];
    S.money += chapter.r.m; S.revenue += chapter.r.m;
    logMoney("farm", "Kapitel geschafft: " + chapter.n, chapter.r.m);
    farmXP(chapter.r.xp);
  }
  const last = nx < 0;
  if (last && !F.done) {
    F.done = true;
    F.doneAt = S.time;
    if (farmPhase() && typeof phoneMsg === "function") setTimeout(() => phoneMsg({ from: "Lina Sturm", kind: "info", title: FT().The + " läuft – und jetzt?", body: FT().doneMsg }), 1500);
  }
  return { q, i, chapter, c: q.c, last };
}
/* ältere Aufrufe: die erste fertige Aufgabe abholen */
function farmQuestClaim() {
  const a = farmQActive().find(x => x.p >= x.q.n);
  return a ? farmQClaimI(a.i) : null;
}

/* --------------------- Spedition gründen, Erbe verkaufen ---------------- */
function farmCanFound() { return farmPhase() && farmDone(); }
function farmFoundLogistics() {
  if (!farmCanFound()) return false;
  S.farm.logi = true;
  S.farm.logiAt = S.time;
  /* die Spedition fängt bei Level 1 an – das Erbe behält sein Level */
  if (typeof lastLevel !== "undefined") lastLevel = level();
  clearRouteCache(); buildNetBuffers();
  spawnOrders(8);
  farmBodyClasses();
  logMoney("farm", "Spedition gegründet", 0);
  save();
  return true;
}
function farmValue() {
  if (!S.farm) return 0;
  let v = (FSITE.base || 45000) + flv() * 2000;
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
    else if (o.t === "sw_halle" && sawRepaired()) v += 18000;
    if (o.slots) v += FSLOT_COST.slice(0, o.slots).reduce((a, b) => a + b, 0);
  });
  farmStores().forEach(st => { v += FSTORE[st].cost.slice(0, (S.farm.cap[st] || 1) - 1).reduce((a, b) => a + b, 0); });
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
function farmTick(dt) {
  if (!farmOn() || (S.farm.tut && !S.farm.tut.done)) return;
  farmErbeTick(dt || 1);
  /* der Kessel heizt auch, wenn gerade niemand hinschaut */
  const ks = S.farm.objs.find(o => o.t === "kessel");
  if (ks && ks.q && ks.q.length) machUpdate(ks);
  farmQuestCheck();
  if (S.time - (S.farm.lastOrd || -999) > 45) {
    S.farm.lastOrd = S.time;
    farmSpawnOrders(1);
  }
  farmAboTick();
  if (typeof farmBoardsCheck === "function") farmBoardsCheck();
}

/* --------------------------- Landkarte -------------------------------- */
/* Die Hof-Knoten gehören nur zu Spielständen mit Hof; Potsdam ist von dort
   aus schon zu Beginn erreichbar. */
if (typeof N !== "undefined" && N.potsdam) N.potsdam.farmX = "hof";
/* ältere Spielstände nachziehen: Gebinde und Preise (v37), Notizbuch (v38, v39) */
function farmMigrate() {
  let F = S.farm;
  if (!F || F.sold) return;
  /* v40: Die Ostsee-Fischerei gibt es nicht mehr – aus ihr wird Opas Hof */
  if (F.kind === "fisch") { farmConvertFisch(F); F = S.farm; }
  if ((F.qv || 1) < 2) {
    F.qv = 2;
    F.qi = F.qi >= FQUEST_OLD.length ? FQUEST_OLD[FQUEST_OLD.length - 1] + 1 : FQUEST_OLD[F.qi] || 0;
    F.qp = 0; F.qdone = false;
  }
  if (F.qv < 3) {
    /* v39: neues Kapitel „Vieh & Handwerk“ – an derselben Aufgabe weiter */
    F.qv = 3;
    if (F.done || F.qi >= FQUEST_V2_TITLES.length) F.qi = FQ_CH_START(4);
    else { const i = FQUESTS_HOF.findIndex(q => q.t === FQUEST_V2_TITLES[F.qi]); F.qi = i >= 0 ? i : 0; }
  }
  if (F.qv < 4) {
    /* v40: nach „Meisterhof“ geht es weiter – Wald, Sägewerk, See */
    F.qv = 4;
    if (F.done || F.qi >= FQ_CH_START(4)) { F.done = false; F.qi = Math.max(F.qi, FQ_CH_START(4)); F.qp = 0; F.qdone = false; }
  }
  if (F.qv < 5) {
    /* v46: „Fang einen Hecht“ wandert von Kapitel 9 nach Kapitel 11, an seine Stelle
       tritt das Angler-Turnier – spätere Aufgaben rücken eins nach hinten */
    F.qv = 5;
    const hi = FQUESTS_HOF.findIndex(q => q.t === "Fang einen Hecht"), ti = FQUESTS_HOF.findIndex(q => q.t === "Veranstalte das Angler-Turnier");
    if (!F.done && hi >= 0 && F.qi >= hi) F.qi++;
    if (F.qi === ti) { F.qp = 0; F.qdone = false; }
  }
  if (F.qv < 6) {
    /* v48: Notizbuch in drei Strängen, gezählt wird alles bisher Geschaffte */
    F.qv = 6;
    const hi = FQUESTS_HOF.findIndex(q => q.t === "Fang einen Hecht"), ti = FQUESTS_HOF.findIndex(q => q.t === "Veranstalte das Angler-Turnier");
    if (F.qset) {
      /* Stand aus v46: Häkchen hat er schon, aber der Hecht stand noch in Kapitel 9 */
      const o = F.qset; F.qset = {};
      for (const k in o) { const j = +k; F.qset[j === ti ? hi : j >= hi ? j + 1 : j] = 1; }
    } else {
      F.qset = {};
      const upto = F.done ? FQUESTS.length : Math.min(F.qi || 0, FQUESTS.length);
      for (let i = 0; i < upto; i++) F.qset[i] = 1;
      const st = F.stats || {}, T = F.tally = F.tally || {};
      const atLeast = (k, v) => { if (v > (T[k] || 0)) T[k] = v; };
      atLeast("deliver", st.deliv || 0); atLeast("fell", st.felled || 0); atLeast("catch", st.catch || 0);
      for (const id in (st.species || {})) atLeast("catch:" + id, st.species[id]);
      /* gefällte Bäume je Art: Stümpfe und nachwachsende Bäume verraten es */
      (F.trees || []).forEach(t => {
        if (t.st === "up" && !(t.mx && t.sz < t.mx)) return;
        const k = "fell:" + (t.sp === "fichte" ? "kiefer" : t.sp);
        T[k] = (T[k] || 0) + 1;
        if (t.mx >= 3) T["fell:big"] = (T["fell:big"] || 0) + 1;
      });
      const q = FQUESTS[F.qi];
      if (q && q.ev && q.ev !== "level") atLeast(q.ev, F.qdone ? q.n : (F.qp || 0));
    }
  }
  erbeInit(F, false);
  /* Waren und Objekte, die es nicht mehr gibt, verschwinden */
  for (const id in F.inv) if (!FITEMS[id] || !FITEMS[id].st) delete F.inv[id];
  /* Fische nach Sternen getrennt: alte Stapel landen in ihrer gerundeten Stufe */
  for (const id in F.inv) {
    const e = F.inv[id];
    if (farmQsOn(id) && !e.qs) { e.qs = [0, 0, 0, 0, 0, 0]; e.qs[clamp(Math.round(e.q || 3), 1, 5)] = e.n; farmQsFix(e); }
  }
  F.objs = F.objs.filter(farmObjKnown);
  farmBoundsUpdate();
  F.quick = F.quick || {};
  const st = F.stats || (F.stats = {});
  ["pearls", "angel", "trips", "meat"].forEach(k => { st[k] = st[k] || 0; });
  st.prod = st.prod || {};
  farmStores().forEach(s => { F.cap[s] = F.cap[s] || 1; });
  /* v46: Backen braucht jetzt Mehl aus der Mühle – Opa hatte noch welches in der Kammer */
  if (!F.flour) { F.flour = 1; if (S.farm.objs.some(o => o.t === "bakery")) farmAdd("mehl", Math.min(6, Math.max(0, farmRoom("mehl"))), 3); }
  if (F.econ >= 2) return;
  F.econ = 2;
  S.orders.forEach(o => {
    if (!o.farm) return;
    const value = Object.keys(o.farm.items).reduce((s, id) => s + FITEMS[id].v * o.farm.items[id], 0);
    o.pay = Math.max(4, Math.round((value * 1.12 + 2.5 + (o.refDist || 3) * 0.45) * 10) / 10);
    o.desc = "Bestellung: " + Object.keys(o.farm.items).map(id => fqty(id, o.farm.items[id])).join(", ");
    o.weight = Math.max(0.3, Math.round(Object.keys(o.farm.items).reduce((s, id) => s + FITEMS[id].kg * o.farm.items[id], 0) * 10) / 10);
  });
}
function farmObjKnown(o) {
  if (o.t === "deco") return !!FDECO[o.k];
  return !!(FMACHINES[o.t] || FPENS[o.t] || FSIZE[o.t] || FSTORE[o.t] || FFISHERY[o.t] || ["field", "tree", "house", "board", "shed", "junk", "stall", "f_plot", "pot"].includes(o.t));
}
/* Ostsee-Spielstand → Hof bei Werder. Fahrzeuge kommen an den Hof, Aufträge
   an der Küste entfallen, für die Fischerei gibt es einen Verkaufserlös. */
function farmConvertFisch(old) {
  const logi = !!old.logi, xp = old.xp != null ? old.xp : S.xp, sxp = S.xp;
  farmNew();
  const F = S.farm;
  F.logi = logi; F.logiAt = old.logiAt || null; F.snd = old.snd !== false;
  /* wer schon eine Spedition hat, braucht keinen Rundgang mehr */
  if (logi) F.tut = { step: 0, done: true };
  F.xp = xp; F.lvSeen = lvOfXp(xp); S.xp = logi ? sxp : 0;
  F.stats.earned = (old.stats && old.stats.earned) || 0;
  F.stats.deliv = (old.stats && old.stats.deliv) || 0;
  F.stage = 2;
  F.objs = F.objs.filter(o => o.t !== "junk");          /* Stufe 2: schon aufgeräumt */
  F.conv = { at: S.time, money: 5000 };
  S.money += 5000; S.revenue += 5000;
  logMoney("farm", "Verkauf der Ostsee-Fischerei", 5000);
  if (S.player && S.player.origin === 4) S.player.origin = 3;
  const bad = id => typeof id === "string" && /^f-/.test(id);
  const badO = o => o && (bad(o.from) || bad(o.to));
  const gone = new Set(S.jobs.filter(j => badO(j.order)).map(j => j.id));
  S.jobs = S.jobs.filter(j => !gone.has(j.id));
  S.orders = S.orders.filter(o => !badO(o));
  const fa = farmAddr();
  S.fleet.forEach(f => {
    if (bad(f.at) || gone.has(f.jobId) || bad(f.spotAt)) {
      Object.assign(f, { at: FARM_NODE, phase: "idle", jobId: null, legIdx: -1, route: null, routeDist: 0, pos: 0, timer: 0 });
      f.spot = { lat: fa.lat, lon: fa.lon, t: "Stellplatz am Schuppen, " + fa.t, a: fa.a }; f.spotAt = FARM_NODE;
    }
  });
  S.bases = (S.bases || []).filter(b => !bad(b.node));
  farmBoundsUpdate();
}
function farmBodyClasses() {
  /* v55: ein Fehler beim Nachziehen alter Spielstände darf den Hof nicht verstecken */
  try {
    if (S && S.farm) farmUseSite(S.farm.kind);
    farmMigrate();
  } catch (e) {
    console.warn("Hof-Umzug:", e);
    if (typeof logiErr === "function") logiErr("Beim Laden des Hofs: " + (e && e.message), String((e && e.stack) || "").split("\n")[1] || "");
  }
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
    return `<span class="fchip${have < need ? " miss" : ""}" data-it="${id}">${typeof itemIc === "function" ? itemIc(id) : FITEMS[id].i}<b>${fpair(id, have, need)}</b></span>`;
  }).join("")}<span class="ford-s">${ready ? "✓ alles da" : "fehlt noch"} · +${o.farm.xp} EP</span></div>`;
}

/* Adressen am Hof und in den Dörfern */
function farmNodeAddr(nodeId, kind) {
  if (nodeId === FARM_NODE) {
    const a = farmAddr();
    if (kind === "yard") a.t = "Stellplatz am Schuppen, " + a.t;
    return a;
  }
  const st = FTOWN_STREETS[nodeId] || FTOWN_STREETS_HOF[nodeId];
  if (!st) return null;
  const s = pick(st);
  const t = s[0] + " " + (1 + Math.floor(Math.random() * 70));
  return { lat: +(s[1] + rnd(-0.0012, 0.0012)).toFixed(5), lon: +(s[2] + rnd(-0.0018, 0.0018)).toFixed(5),
    t: kind === "yard" ? "Stellplatz, " + t : kind === "spaeti" ? "Späti, " + t : t, a: N[nodeId].short };
}
