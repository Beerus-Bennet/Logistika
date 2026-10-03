/* =========================================================================
   LOGISTIKA – farm.js
   Der geerbte Hof: Spielstand, Felder, Bäume, Tiere mit Platz-Qualität,
   Backofen/Mühle/Molkerei, Lager, Bestellungen aus den Dörfern (laufen
   als echte Aufträge über die Disposition), Opas Notizbuch, Übergang zur
   Spedition und Verkauf des Hofs. Die Darstellung steckt in farmview.js.
   ========================================================================= */

/* ------------------------------ Zustand ------------------------------- */
function farmOn() { return !!(S && S.farm && !S.farm.sold); }
/* vor der Speditionsgründung: nur Hof, eigene Ware, keine fremden Aufträge */
function farmPhase() { return farmOn() && !S.farm.logi; }
function logiOn() { return !S || !S.farm || !!S.farm.logi || !!S.farm.sold; }

const FG = 32;                         /* Raster 32 × 32 Kacheln */
const FIN0 = 3, FIN1 = 29;             /* bebaubar: Kacheln 3 … 28 */

function farmNew(kind) {
  const F = {
    v: 1, kind: kind || "hof", logi: false, sold: null, snd: true, seq: 1,
    objs: [], inv: {}, cap: { silo: 1, barn: 1 },
    stats: { harvest: 0, made: 0, eggs: 0, milk: 0, deliv: 0, earned: 0 },
    qi: 0, qp: 0, qdone: false, lastOrd: -999, tut: { step: 0, done: false }, born: S.time
  };
  S.farm = F;
  const add = (t, x, z, extra) => farmAddObj(Object.assign({ t, x, z }, extra || {}));
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
  return F;
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
  if (o.t === "coop" || o.t === "cows") { const p = FPENS[o.t][Math.min(FPENS[o.t].length, o.lvl || 1) - 1]; w = p.w; d = p.d; }
  else if (o.t === "deco") { const s = FDECO[o.k].sz; w = s[0]; d = s[1]; }
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
/* Belegung des Rasters (ohne das ausgenommene Objekt); Wege zählen als belegt (-1) */
function farmOcc(except) {
  const g = new Int32Array(FG * FG);
  FPATH.forEach(k => { g[k] = -1; });
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
function farmFits(x, z, w, d, except) {
  if (x < FIN0 || z < FIN0 || x + w > FIN1 || z + d > FIN1) return false;
  const g = farmOcc(except);
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (g[(z + j) * FG + x + i]) return false;
  return true;
}
/* freier Platz möglichst nah an (px, pz) */
function farmFreeSpot(w, d, px, pz) {
  const g = farmOcc();
  let best = null, bd = Infinity;
  for (let z = FIN0; z + d <= FIN1; z++)
    for (let x = FIN0; x + w <= FIN1; x++) {
      let ok = true;
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
/* Lässt sich die Ware im Moment überhaupt herstellen? */
function farmCanMake(id) {
  const it = FITEMS[id], lv = level(), objs = S.farm.objs;
  if (!it) return false;
  if (it.k === "crop") return farmCropOk(id);
  if (it.k === "fruit") return objs.some(o => o.t === "tree" && o.kind === id);
  if (id === "ei") return objs.some(o => o.t === "coop" && o.animals.length);
  if (id === "milch") return objs.some(o => o.t === "cows" && o.animals.length);
  for (const mk in FMACHINES) {
    const r = FMACHINES[mk].recipes.find(x => x.id === id);
    if (r) return r.lv <= lv && objs.some(o => o.t === mk) && Object.keys(r.in).every(farmCanMake);
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
  if (o.t === "field" && fieldState(o) === "grow" && !o.w) {
    o.w = true; o.end = S.time + (o.end - S.time) * 0.75;
    farmEvent("water"); return true;
  }
  if (o.t === "tree" && S.time < o.end && !o.w) {
    o.w = true; o.end = S.time + (o.end - S.time) * 0.75;
    farmEvent("water"); return true;
  }
  return false;
}
/* Ernte: 2 je Feld, manchmal 3 – Qualität aus Gießen und Fruchtwechsel */
function farmHarvest(o) {
  if (!o || o.t !== "field" || fieldState(o) !== "ripe") return null;
  const id = o.crop;
  let n = 2 + (Math.random() < 0.15 ? 1 : 0);
  if (farmRoom(id) < n) { farmFull("silo"); return null; }
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
  toast((st === "silo" ? "🌾 Das Silo" : "🏚️ Die Scheune") + " ist voll – liefere etwas aus, verkauf an den Großhandel oder bau aus.", "warn");
  if (typeof farmViewFull === "function") farmViewFull(st);
}

/* -------------------------------- Bäume ------------------------------- */
function treeRipe(o) { return S.time >= o.end; }
function farmPick(o) {
  if (!o || o.t !== "tree" || !treeRipe(o)) return null;
  const T = FTREES[o.kind];
  const n = T.yield + (Math.random() < 0.2 ? 1 : 0);
  if (farmRoom(o.kind) < n) { farmFull("silo"); return null; }
  const q = Math.min(5, 3 + (o.w ? 1 : 0) + ((o.h || 0) >= 3 ? 1 : 0));
  farmAdd(o.kind, n, q);
  o.h = (o.h || 0) + 1; o.w = false; o.end = S.time + T.t;
  S.farm.stats.harvest += n;
  farmXP(FITEMS[o.kind].xp * n);
  farmEvent("harvest:" + o.kind, n);
  return { id: o.kind, n, q, xp: FITEMS[o.kind].xp * n };
}

/* -------------------------------- Tiere ------------------------------- */
function penInfo(o) {
  const A = FANIMALS[o.t === "coop" ? "huhn" : "kuh"];
  const p = FPENS[o.t][Math.min(FPENS[o.t].length, o.lvl || 1) - 1];
  const n = o.animals.length;
  const per = n ? p.m2 / n : p.m2;
  const r = per / A.space;
  const k = FKEEP.find(x => r >= x.r) || FKEEP[FKEEP.length - 1];
  return { A, p, n, per, r, stars: k.st, keep: k.n };
}
function aniState(a) {
  if (a.fed == null) return "hungry";
  return S.time >= a.fed ? "ready" : "busy";
}
function farmFeed(o, a) {
  if (!a || aniState(a) !== "hungry") return false;
  const A = FANIMALS[o.t === "coop" ? "huhn" : "kuh"];
  if (!farmTake(A.feed, 1)) return "nofeed";
  a.fed = S.time + A.t;
  a.q = Math.min(5, penInfo(o).stars + (a.pet ? 1 : 0));
  a.pet = false;
  farmEvent("feed:" + A.feed);
  return true;
}
function farmCollect(o, a) {
  if (!a || aniState(a) !== "ready") return null;
  const A = FANIMALS[o.t === "coop" ? "huhn" : "kuh"];
  if (farmRoom(A.out) < 1) { farmFull("barn"); return null; }
  const q = a.q || penInfo(o).stars;
  farmAdd(A.out, 1, q);
  a.fed = null; a.petted = false;
  S.farm.stats[A.out === "ei" ? "eggs" : "milk"]++;
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
  if (!pen || pen.t !== A.house) return toast("Dafür brauchst du erst einen " + (A.house === "coop" ? "Hühnerstall" : "Kuhstall") + ".", "warn"), false;
  if (pen.animals.length >= A.max) return toast("Der Stall ist voll – höchstens " + A.max + " " + (kind === "huhn" ? "Hühner" : "Kühe") + ".", "warn"), false;
  const price = animalPrice(kind);
  if (S.money < price) return toast("Dafür fehlen " + money(price - S.money) + ".", "warn"), false;
  S.money -= price; S.expense += price;
  logMoney("farm", A.n + " gekauft", -price);
  pen.animals.push({ id: S.farm.seq++, v: Math.floor(Math.random() * (kind === "huhn" ? 3 : 2)), fed: null, q: 3 });
  farmXP(kind === "huhn" ? 3 : 8);
  farmEvent("buy:" + kind);
  return true;
}
function farmSellAnimal(pen) {
  if (!pen || !pen.animals.length) return false;
  const kind = pen.t === "coop" ? "huhn" : "kuh";
  const a = pen.animals.pop();
  const back = Math.round(FANIMALS[kind].price * 0.5);
  S.money += back; S.revenue += back;
  logMoney("farm", FANIMALS[kind].n + " verkauft", back);
  return a;
}
function penUpgradeCost(o) { const c = FPEN_COST[o.t]; return c[o.lvl] != null ? c[o.lvl] : null; }
function farmPenUpgrade(o) {
  const cost = penUpgradeCost(o);
  if (cost == null) return toast("Größer geht der Auslauf nicht.", "warn"), false;
  const nx = FPENS[o.t][o.lvl];
  const w = o.r ? nx.d : nx.w, d = o.r ? nx.w : nx.d;
  if (!farmFits(o.x, o.z, w, d, o.id)) return toast("Kein Platz: Rechts oder unten steht etwas im Weg. Verschieb es (lange drücken) und versuch es nochmal.", "warn"), false;
  if (S.money < cost) return toast("Dafür fehlen " + money(cost - S.money) + ".", "warn"), false;
  S.money -= cost; S.expense += cost;
  logMoney("farm", (o.t === "coop" ? "Auslauf" : "Weide") + " vergrößert", -cost);
  o.lvl++;
  farmXP(10);
  farmEvent("pen");
  return true;
}

/* ------------------------- Mühle, Ofen, Molkerei ---------------------- */
function machUpdate(o) {
  if (!o.q) return;
  while (o.q.length && o.q[0].end <= S.time) {
    const it = o.q.shift();
    o.done.push({ r: it.r, q: it.q, n: it.n });
  }
}
function recipeOf(o, rid) { return FMACHINES[o.t].recipes.find(r => r.id === rid); }
function farmQueue(o, rid) {
  machUpdate(o);
  const r = recipeOf(o, rid);
  if (!r || r.lv > level()) return "locked";
  if (o.q.length + o.done.length >= o.slots) return "full";
  if (!farmHasAll(r.in)) return "missing";
  let qs = 0, qn = 0;
  for (const id in r.in) { qs += farmQ(id) * r.in[id]; qn += r.in[id]; farmTake(id, r.in[id]); }
  const start = o.q.length ? o.q[o.q.length - 1].end : S.time;
  /* Opa hat vorgeheizt: das allererste Brot im Tutorial geht schnell */
  const quick = S.farm.tut && !S.farm.tut.done && rid === "brot" && !S.farm.stats.made;
  o.q.push({ r: rid, start, end: start + (quick ? 4 : r.t), q: qn ? qs / qn : 3, n: r.out });
  return true;
}
function farmCollectMach(o) {
  machUpdate(o);
  if (!o.done.length) return [];
  const got = [];
  while (o.done.length) {
    const d = o.done[0];
    if (farmRoom(d.r) < d.n) { farmFull(FITEMS[d.r].st); break; }
    o.done.shift();
    farmAdd(d.r, d.n, d.q);
    S.farm.stats.made += d.n;
    farmXP(FITEMS[d.r].xp * d.n);
    farmEvent("make:" + d.r, d.n);
    got.push({ id: d.r, n: d.n, q: d.q, xp: FITEMS[d.r].xp * d.n });
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

/* ------------------------------ Laden --------------------------------- */
function shopCount(it) {
  const objs = S.farm.objs;
  if (it.id === "field") return objs.filter(o => o.t === "field").length;
  if (it.tree) return objs.filter(o => o.t === "tree").length;
  if (it.id === "coop" || it.id === "cows" || it.id === "dairy") return objs.filter(o => o.t === it.id).length;
  return 0;
}
function shopPrice(it) {
  if (it.tree) return FTREES[it.tree].price + 20 * S.farm.objs.filter(o => o.t === "tree").length;
  if (it.animal) return animalPrice(it.animal);
  return it.price ? it.price(shopCount(it)) : 0;
}
function shopLimit(it) {
  const lv = level();
  if (it.id === "field") return it.max(lv);
  if (it.tree) return Math.min(16, 2 + lv * 2);
  if (it.id === "coop") return lv >= 5 ? 2 : 1;
  if (it.id === "cows") return lv >= 8 ? 2 : 1;
  if (it.id === "dairy") return 1;
  return 99;
}
/* Neues Objekt an freier Stelle (die Ansicht lässt es danach verschieben) */
function farmBuild(spec, x, z, r) {
  let o;
  if (spec.t === "field") o = { t: "field", crop: null, last: null };
  else if (spec.t === "tree") o = { t: "tree", kind: spec.kind, end: S.time + FTREES[spec.kind].t, w: false, h: 0 };
  else if (spec.t === "coop" || spec.t === "cows") o = { t: spec.t, lvl: 1, animals: [] };
  else if (spec.t === "dairy") o = { t: "dairy", q: [], done: [], slots: 2 };
  else if (spec.t === "deco") o = { t: "deco", k: spec.k, arg: FDECO[spec.k].arg };
  else return null;
  o.x = x; o.z = z; o.r = r || 0;
  if (!farmFits(x, z, ...farmSize(o))) return null;
  if (S.money < spec.price) { toast("Dafür fehlen " + money(spec.price - S.money) + ".", "warn"); return null; }
  S.money -= spec.price; S.expense += spec.price;
  logMoney("farm", spec.label || "Hof: Neubau", -spec.price);
  farmAddObj(o);
  farmXP(spec.t === "deco" ? Math.max(1, Math.round(spec.price / 10)) : spec.t === "field" ? 2 : spec.t === "tree" ? 4 : 25);
  farmEvent("buy:" + (spec.t === "tree" ? "tree" : spec.t));
  if (spec.t !== "deco" && spec.t !== "field" && spec.t !== "tree") farmEvent("build:" + spec.t);
  return o;
}
/* Deko oder leeres Feld wieder abgeben */
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

/* ------------------------- Bestellungen der Dörfer --------------------- */
function farmAddr() {
  const name = S.player ? S.player.company : "Hof";
  return { lat: FARM_PT[0], lon: FARM_PT[1], t: "Hof " + name + ", Plötziner Weg 4", a: "Werder" };
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
function makeFarmOrder() {
  const lv = level();
  const towns = Object.keys(FTOWNS).filter(id => FTOWNS[id].lv <= lv && N[id] && isUnlocked(id));
  if (!towns.length) return null;
  const busy = new Set(farmOrders().map(o => o.shipper));
  for (let tries = 0; tries < 20; tries++) {
    const town = farmWPick(towns, id => FTOWNS[id].w);
    const c = pick(FTOWNS[town].cust);
    if (busy.has(c[0])) continue;
    const wants = c[1].filter(farmCanMake);
    if (!wants.length) continue;
    const lines = 1 + (lv >= 2 && Math.random() < 0.5 ? 1 : 0) + (lv >= 4 && Math.random() < 0.3 ? 1 : 0);
    const items = {};
    const pool = wants.slice();
    for (let i = 0; i < lines && pool.length; i++) {
      const id = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      /* Mengen in Gebinden: Gastronomie und Märkte nehmen mehr als ein Kindergarten */
      const k = FITEMS[id].k, big = /Gasthaus|Hotel|Markt|Landbäckerei|Restaurant|Pizzeria/.test(c[0]) ? 1 : 0;
      const hi = (k === "crop" || k === "fruit" ? 2 + Math.ceil(lv * 0.6) : k === "ani" ? 2 + Math.ceil(lv / 2) : 2 + Math.floor(lv / 2)) + big;
      const lo = 1 + big;
      items[id] = lo + Math.floor(Math.random() * (hi - lo + 1));
    }
    /* passt aufs größte eigene Fahrzeug */
    const maxKg = farmMaxKg();
    const kg = () => Object.keys(items).reduce((s, id) => s + FITEMS[id].kg * items[id], 0);
    let guard = 40;
    while (kg() > maxKg && guard--) {
      const big = Object.keys(items).sort((a, b) => FITEMS[b].kg * items[b] - FITEMS[a].kg * items[a])[0];
      if (items[big] > 1) items[big]--; else delete items[big];
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
  const pr = plan(FARM_NODE, town, "hof", w, "time");
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
    id: "A" + (S.seq++), from: FARM_NODE, to: town, cargo: "hof", weight: w, pay,
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
  toast("🧺 " + o.shipper + " ist zufrieden: +" + money(pay) + " · +" + o.farm.xp + " XP" + (o.farm.q >= 4 ? " · " + qStars(o.farm.q) : ""), "ok");
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

/* -------------------------- Opas Notizbuch ---------------------------- */
function farmQuest() { return S.farm && FQUESTS[S.farm.qi] || null; }
function farmEvent(key, n) {
  if (!S.farm) return;
  n = n || 1;
  const q = farmQuest();
  if (q && !S.farm.qdone) {
    if (q.ev === key) S.farm.qp += n;
    if (q.ev === "level" && level() >= q.n) S.farm.qp = q.n;
    if (S.farm.qp >= q.n) { S.farm.qp = q.n; S.farm.qdone = true; if (typeof farmViewQuest === "function") farmViewQuest(true); }
  }
  if (typeof farmTutSignal === "function") farmTutSignal(key, n);
}
function farmQuestClaim() {
  const q = farmQuest();
  if (!q || !S.farm.qdone) return null;
  S.money += q.r.m; S.revenue += q.r.m;
  logMoney("farm", "Opas Notizbuch: " + q.t, q.r.m);
  S.farm.qi++; S.farm.qp = 0; S.farm.qdone = false;
  farmXP(q.r.xp);
  /* nächste Aufgabe evtl. schon erfüllt (Level) */
  const nx = farmQuest();
  if (nx && nx.ev === "level" && level() >= nx.n) { S.farm.qp = nx.n; S.farm.qdone = true; }
  return q;
}

/* --------------------- Spedition gründen, Hof verkaufen ---------------- */
function farmCanFound() { return farmPhase() && level() >= FLOGI_LEVEL; }
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
  let v = 45000 + level() * 2000;
  S.farm.objs.forEach(o => {
    if (o.t === "field") v += 350;
    else if (o.t === "tree") v += FTREES[o.kind].price * 4;
    else if (o.t === "coop") v += 1500 + FPEN_COST.coop.slice(0, o.lvl).reduce((a, b) => a + b, 0) + o.animals.length * FANIMALS.huhn.price;
    else if (o.t === "cows") v += 5000 + FPEN_COST.cows.slice(0, o.lvl).reduce((a, b) => a + b, 0) + o.animals.length * FANIMALS.kuh.price * 1.5;
    else if (o.t === "dairy") v += 6000;
    else if (o.t === "deco") v += FDECO[o.k].price;
    if (o.slots) v += FSLOT_COST.slice(0, o.slots).reduce((a, b) => a + b, 0);
  });
  ["silo", "barn"].forEach(st => { v += FSTORE[st].cost.slice(0, (S.farm.cap[st] || 1) - 1).reduce((a, b) => a + b, 0); });
  for (const id in S.farm.inv) v += FITEMS[id].v * S.farm.inv[id].n * 0.8;
  return Math.round(v / 500) * 500;
}
function farmSellAll() {
  if (!farmOn() || !S.farm.logi) return false;
  const price = farmValue();
  S.money += price; S.revenue += price;
  logMoney("farm", "Hof verkauft", price);
  /* offene Hofbestellungen entfallen; laufende Lieferungen fahren zu Ende */
  S.orders = S.orders.filter(o => !o.farm);
  S.farm = { sold: { t: S.time, price }, kind: S.farm.kind, logi: true, stats: S.farm.stats };
  farmBodyClasses();
  save();
  return price;
}

/* -------------------------------- Takt -------------------------------- */
function farmTick() {
  if (!farmOn() || (S.farm.tut && !S.farm.tut.done)) return;
  if (S.time - (S.farm.lastOrd || -999) > 45) {
    S.farm.lastOrd = S.time;
    farmSpawnOrders(1);
  }
}

/* --------------------------- Landkarte -------------------------------- */
/* Die Hof-Knoten gehören nur zu Spielständen mit Hof; Potsdam ist von dort
   aus schon zu Beginn erreichbar. */
if (typeof N !== "undefined" && N.potsdam) N.potsdam.farmX = true;
/* Spielstände von v36: offene Hofbestellungen auf echte Gebinde und Preise umstellen */
function farmMigrate() {
  if (!S.farm || S.farm.sold || S.farm.econ >= 2) return;
  S.farm.econ = 2;
  S.orders.forEach(o => {
    if (!o.farm) return;
    const value = Object.keys(o.farm.items).reduce((s, id) => s + FITEMS[id].v * o.farm.items[id], 0);
    o.pay = Math.max(4, Math.round((value * 1.12 + 2.5 + (o.refDist || 3) * 0.45) * 10) / 10);
    o.desc = "Bestellung: " + Object.keys(o.farm.items).map(id => fqty(id, o.farm.items[id])).join(", ");
    o.weight = Math.max(0.3, Math.round(Object.keys(o.farm.items).reduce((s, id) => s + FITEMS[id].kg * o.farm.items[id], 0) * 10) / 10);
  });
  /* Notizbuch: Aufgaben haben jetzt andere Mengen – Fortschritt deckeln */
  const q = farmQuest();
  if (q && S.farm.qp > q.n) S.farm.qp = q.n;
}
function farmBodyClasses() {
  farmMigrate();
  document.body.classList.toggle("has-farm", farmOn());
  document.body.classList.toggle("farm-phase", farmPhase());
  farmNodeName();
}
function farmNodeName() {
  if (N[FARM_NODE] && S && S.player) { N[FARM_NODE].name = "Hof " + S.player.company; N[FARM_NODE].short = "Hof"; }
}

/* Hof als Haus auf der großen Karte – antippen öffnet den Hof */
let farmHit = null;
function drawFarmPin(m, z) {
  farmHit = null;
  if (!farmOn() || z < 7) return;
  m.pin(FARM_PT[0], FARM_PT[1], (c, x, y0) => {
    /* Haus an einem Pfahl über dem Hof – darunter parken die Fahrzeuge */
    const w = z >= 11 ? 34 : 26, h = w * 0.8, lift = z >= 11 ? 40 : 30, y = y0 - lift;
    c.lineWidth = 3; c.strokeStyle = "#0d1b2a";
    c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x, y0 - 4); c.stroke();
    c.beginPath(); c.arc(x, y0 - 3, 3.2, 0, Math.PI * 2); c.fillStyle = "#cb4433"; c.fill(); c.stroke();
    rrect(c, x - w / 2 + 2, y - h / 2 + 3, w, h, 7); c.fillStyle = "rgba(13,27,42,0.4)"; c.fill();
    rrect(c, x - w / 2, y - h / 2, w, h, 7); c.fillStyle = "#fff4d6"; c.fill();
    c.lineWidth = 2.6; c.strokeStyle = "#0d1b2a"; c.stroke();
    c.beginPath(); c.moveTo(x - w / 2 - 4, y - h / 2 + 2); c.lineTo(x, y - h / 2 - w * 0.45); c.lineTo(x + w / 2 + 4, y - h / 2 + 2); c.closePath();
    c.fillStyle = "#cb4433"; c.fill(); c.stroke();
    drawEmoji(c, "🏡", x, y + 1, h * 0.78);
    if (z >= 10) {
      c.font = "800 12px " + LABEL_FONT; c.textAlign = "center"; c.lineWidth = 3.5; c.strokeStyle = "#fff";
      const t = "Hof " + (S.player ? S.player.company : "");
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
  }).join("")}<span class="ford-s">${ready ? "✓ alles da" : "fehlt noch"} · +${o.farm.xp} XP</span></div>`;
}

/* Adressen am Hof und in den Dörfern */
function farmNodeAddr(nodeId, kind) {
  if (nodeId === FARM_NODE) {
    const a = farmAddr();
    if (kind === "yard") a.t = "Stellplatz am Schuppen, " + a.t;
    return a;
  }
  const st = FTOWN_STREETS[nodeId];
  if (!st) return null;
  const s = pick(st);
  const t = s[0] + " " + (1 + Math.floor(Math.random() * 70));
  return { lat: +(s[1] + rnd(-0.0012, 0.0012)).toFixed(5), lon: +(s[2] + rnd(-0.0018, 0.0018)).toFixed(5),
    t: kind === "yard" ? "Stellplatz, " + t : kind === "spaeti" ? "Späti, " + t : t, a: N[nodeId].short };
}
