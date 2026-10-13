/* =========================================================================
   LOGISTIKA – team.js
   Personal je Station: Hof, Wald & Sägewerk, Fischerei. Wer eingestellt
   ist, erledigt dort die Arbeit von allein – langsamer als man selbst, aber
   ständig: ernten und nachsäen, füttern und einsammeln, Maschinen am Laufen
   halten, Bäume fällen, Reusen leeren, Bestellungen losschicken. Auf dem
   Hof sieht man die Leute hinlaufen und arbeiten.
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
  if (hungry) toast("👷 " + hungry + " Mitarbeiter ohne Brotzeit – heute nur halb so fleißig.", "warn");
}

/* ----------------------------- Arbeitsorte -------------------------------- */
const STAFF_HOME = {
  farmer: [-0.8, -2.2], pfleger: [2.4, 4.2], hofmeister: [-5.5, 1.5], fahrer: [8.2, 12],
  holzfaeller: [-20, -11], saeger: [-24.5, -27], mechaniker: [-26.5, -25.5],
  fischer: [-1.2, 26.2], fischwirt: [2.5, 22.2]
};
function staffHome(role, i) { const h = STAFF_HOME[role] || [0, 0]; return [h[0] + ((i || 0) % 2) * 0.7, h[1] + ((i || 0) % 3) * 0.5]; }
/* Platz neben einem Objekt (zur Kamera hin, also Südosten), Blick darauf */
function staffSpot(o) {
  const [cx, cz] = farmCenter(o), [w, d] = farmSize(o);
  return { x: cx + w / 2 * 0.55 + 0.45, z: cz + d / 2 + 0.55, fx: cx, fz: cz };
}
const staffDist = (s, x, z) => Math.hypot((s.px == null ? x : s.px) - x, (s.pz == null ? z : s.pz) - z);
function staffGap(s) { const R = FSTAFF_ROLES[s.role]; return R.gap * (1 - (s.perk || 0) / 100) * (s.fed === false ? 2 : 1); }

/* ------------------------- Was gibt es zu tun? ---------------------------- */
/* Wie viel soll auf Lager sein? Offene Bestellungen + Futter für die Tiere + ein Grundstock */
function staffOrderNeed(id) {
  let need = 0;
  farmOrders().forEach(o => { if (o.farm && !o.farm.taken && o.farm.items[id]) need += o.farm.items[id]; });
  return need;
}
function staffWant(id) {
  const need = staffOrderNeed(id);
  if (FITEMS[id] && FITEMS[id].k === "feed") {
    let eat = 0;
    S.farm.objs.forEach(o => { if (o.animals && o.animals.length) { const A = FANIMALS[penKind(o)]; if (A && A.feed === id) eat += o.animals.length; } });
    return need + eat * 2 + 2;
  }
  return need + 6;
}
/* Bestes Rezept für eine Maschine: was am meisten fehlt, Zutaten da, Platz im Lager */
function staffPickRecipe(o) {
  const M = FMACHINES[o.t];
  let best = null, bs = 0;
  M.recipes.forEach(r => {
    if (r.lv > flv() || !farmHasAll(r.in) || (r.cost && S.money < r.cost + 50)) return;
    /* was für Bestellungen gebraucht wird, bleibt liegen */
    if (Object.keys(r.in).some(id => farmInv(id) - r.in[id] < staffOrderNeed(id))) return;
    if (FITEMS[r.id].energy) return;
    if (farmRoom(r.id) < r.out) return;
    const sc = staffWant(r.id) - farmInv(r.id) + (o.lastR === rkey(r) ? 0.5 : 0);
    if (sc > bs) { bs = sc; best = r; }
  });
  return best;
}
function staffMachines(role) {
  return S.farm.objs.filter(o => {
    const M = FMACHINES[o.t];
    if (!M || !o.q || M.trips || (o.area && !farmAreaOpen(o.area))) return false;
    if (role === "hofmeister") return !M.saw && !M.fish && o.t !== "saegebock";
    if (role === "saeger") return (M.saw || o.t === "saegebock") && machReady(o);
    if (role === "fischwirt") return !!M.fish;
    return false;
  });
}
/* Maschine: Fertiges abholen, neues Rezept in die Schlange */
function staffMachJob(s) {
  const list = staffMachines(s.role);
  /* der Kessel zuerst, wenn der Strom knapp wird (ohne volles Solardach) */
  if (s.role === "saeger" && !(typeof pvFull === "function" && pvFull())) {
    const k = list.find(o => o.t === "kessel");
    if (k && (S.farm.en || 0) < farmEnCap() * 0.45 && k.q.length < machSlots(k)) {
      const r = FMACHINES.kessel.recipes.find(x => farmHasAll(x.in));
      if (r) return { k: "mach", oid: k.id, rid: rkey(r), what: "heizt den Kessel" };
    }
  }
  let pickO = null, rid = null, what = "";
  for (const o of list) {
    machUpdate(o);
    if (o.done.length && o.done.every(d => farmRoom(d.r) >= d.n)) { pickO = o; what = "holt " + FITEMS[o.done[0].r].n + " ab"; break; }
  }
  if (!pickO) for (const o of list) {
    if (o.t === "kessel" || o.broken || o.q.length + o.done.length >= machSlots(o)) continue;
    const r = staffPickRecipe(o);
    if (r) { pickO = o; rid = rkey(r); what = "macht " + FITEMS[r.id].n; break; }
  }
  if (!pickO) return null;
  return { k: "mach", oid: pickO.id, rid, what };
}
/* Was säen? Was am meisten fehlt (Getreide zählt fürs Futter doppelt), sonst Fruchtwechsel */
function staffCrop(o) {
  let best = null, bs = -1e9;
  const beasts = S.farm.objs.some(x => x.animals && x.animals.length);
  Object.keys(FCROPS).forEach(c => {
    if (!farmCropOk(c) || S.money < FCROPS[c].seed + 20) return;
    const sc = staffWant(c) - farmInv(c) + (beasts && (c === "weizen" || c === "mais") ? 6 : 0) + (o.last && o.last !== c ? 0.6 : 0) - FCROPS[c].t / 2000;
    if (sc > bs) { bs = sc; best = c; }
  });
  return best;
}
function staffFarmerJob(s) {
  const F = S.farm, fields = F.objs.filter(o => o.t === "field"), trees = F.objs.filter(o => o.t === "tree");
  const near = arr => arr.sort((a, b) => { const [ax, az] = farmCenter(a), [bx, bz] = farmCenter(b); return staffDist(s, ax, az) - staffDist(s, bx, bz); });
  const ripe = near(fields.filter(o => fieldState(o) === "ripe" && farmRoom(o.crop) >= 3))[0];
  if (ripe) return { k: "field", oid: ripe.id, what: "erntet " + FITEMS[ripe.crop].n };
  const fruit = near(trees.filter(o => treeRipe(o) && farmRoom(o.kind) >= 4))[0];
  if (fruit) return { k: "pick", oid: fruit.id, what: "pflückt " + FITEMS[fruit.kind].n };
  const empty = near(fields.filter(o => fieldState(o) === "empty" && staffCrop(o)))[0];
  if (empty) return { k: "field", oid: empty.id, what: "sät " + FITEMS[staffCrop(empty)].n };
  const dry = near(fields.filter(o => fieldState(o) === "grow" && !o.w).concat(trees.filter(o => !treeRipe(o) && !o.w)))[0];
  if (dry) return { k: "water", oid: dry.id, what: "gießt" };
  return null;
}
function staffPflegerJob(s) {
  const pens = S.farm.objs.filter(o => FPENS[o.t] && o.animals && !FANIMALS[penKind(o)].fish);
  for (const o of pens) {
    const A = FANIMALS[penKind(o)];
    o.want = Math.min(A.max, Math.max(o.want || 0, o.animals.length));
    const ready = o.animals.filter(a => aniState(a) === "ready");
    if (ready.length && farmRoom(A.out) >= (A.mast ? A.yield : 1)) return { k: "pen", oid: o.id, what: A.mast ? "bringt " + A.pl + " zum Metzger" : "sammelt " + FITEMS[A.out].n + " ein" };
    if (o.animals.some(a => aniState(a) === "hungry") && farmInv(A.feed) > 0) return { k: "pen", oid: o.id, what: "füttert die " + A.pl };
    if (A.mast && o.animals.length < o.want && S.money >= animalPrice(penKind(o)) + 100) return { k: "pen", oid: o.id, what: "holt junge " + A.pl };
  }
  return null;
}
function staffFellerJob(s) {
  const T = S.farm.tools || {}, cand = (S.farm.trees || []).filter(t => {
    if (t.st !== "up" || t.sz >= 4 || (t.mx && t.sz < t.mx)) return false;     /* nur ausgewachsene, keine uralten */
    if (!farmAreaOpen(areaOfPoint(t.x, t.z))) return false;
    const need = treeNeeds(t);
    if (need.saw || (need.axe || 1) > (T.axe || 1)) return false;
    return farmRoom(FSPECIES[t.sp].log) >= FTREE_SIZE[t.sz].logs;
  });
  if (!cand.length) return null;
  cand.sort((a, b) => staffDist(s, a.x, a.z) - staffDist(s, b.x, b.z));
  const t = cand[Math.floor(Math.random() * Math.min(4, cand.length))];
  return { k: "fell", tid: t.id, what: "fällt eine " + FSPECIES[t.sp].n };
}
function staffFischerJob(s) {
  const steg = farmObj1("f_steg");
  if (!steg) return null;
  const pots = S.farm.objs.filter(o => o.t === "pot" && (!o.area || farmAreaOpen(o.area)));
  const room = farmStoreCap("fisch") - farmStoreUsed("fisch");
  const ripe = pots.find(o => potState(o) === "ripe");
  if (ripe && room >= 4) return { k: "haul", oid: ripe.id, what: "leert eine Reuse" };
  const empty = pots.find(o => potState(o) === "empty");
  if (empty && farmBaitItem() && Object.keys(FPOTS).some(farmPotOk)) return { k: "bait", oid: empty.id, what: "beködert eine Reuse" };
  if (room >= 2) return { k: "fish", oid: steg.id, what: "angelt vom Steg" };
  return null;
}
function staffFahrerJob(s) {
  const o = farmOrders().find(x => !x.farm.taken && farmOrderReady(x));
  if (!o) return null;
  const opt = farmDispatchOptions(o).find(p => p.here && !p.late);
  if (!opt) return null;
  const b = farmObj1("board");
  return { k: "send", order: o.id, oid: b ? b.id : null, what: "schickt die Lieferung an " + o.shipper + " los" };
}
function staffFind(s) {
  switch (s.role) {
    case "farmer": return staffFarmerJob(s);
    case "pfleger": return staffPflegerJob(s);
    case "hofmeister": case "saeger": case "fischwirt": return staffMachJob(s);
    case "holzfaeller": return staffFellerJob(s);
    case "fischer": return staffFischerJob(s);
    case "fahrer": return staffFahrerJob(s);
  }
  return null;
}
/* Ziel und Dauer: hinlaufen (5 Einheiten je Spielminute), dann arbeiten */
function staffPlace(s, j) {
  let p = null;
  if (j.tid != null) { const t = farmTree(j.tid); if (t) p = { x: t.x + 0.75, z: t.z + 0.75, fx: t.x, fz: t.z }; }
  else if (j.oid != null) { const o = farmObj(j.oid); if (o) p = staffSpot(o); }
  if (!p) { const h = staffHome(s.role); p = { x: h[0], z: h[1], fx: h[0], fz: h[1] - 1 }; }
  return p;
}
/* Erledigen – erst jetzt passiert es wirklich (alles noch einmal prüfen) */
function staffDo(s, j) {
  const F = S.farm, o = j.oid != null ? farmObj(j.oid) : null;
  let fx = null;
  switch (j.k) {
    case "field":
      if (!o) break;
      if (fieldState(o) === "ripe" && farmRoom(o.crop) >= 3) { const r = farmHarvest(o); if (r) fx = { id: r.id, n: r.n }; }
      if (fieldState(o) === "empty") { const c = staffCrop(o); if (c) farmPlant(o, c); }
      break;
    case "pick": if (o && treeRipe(o) && farmRoom(o.kind) >= 4) { const r = farmPick(o); if (r) fx = { id: r.id, n: r.n }; } break;
    case "water": if (o) farmWater(o); break;
    case "pen": {
      if (!o) break;
      const kind = penKind(o), A = FANIMALS[kind];
      o.animals.filter(a => aniState(a) === "ready").forEach(a => { if (farmRoom(A.out) >= (A.mast ? A.yield : 1)) { const r = farmCollect(o, a); if (r) fx = { id: r.id, n: (fx ? fx.n : 0) + r.n }; } });
      o.animals.filter(a => aniState(a) === "hungry").forEach(a => { if (farmInv(A.feed) > 0) farmFeed(o, a); });
      if (A.mast && o.animals.length < Math.min(A.max, o.want || 0) && S.money >= animalPrice(kind) + 100) farmBuyAnimal(kind, o);
      break;
    }
    case "mach": {
      if (!o) break;
      const got = farmCollectMach(o);
      if (got.length) fx = { id: got[0].id, n: got.reduce((a, g) => a + (g.id === got[0].id ? g.n : 0), 0) };
      const r = j.rid ? recipeOf(o, j.rid) : null;
      if (r && farmHasAll(r.in) && (FITEMS[r.id].energy || farmRoom(r.id) >= r.out)) { if (farmQueue(o, j.rid) === true) o.lastR = j.rid; }
      break;
    }
    case "fell": {
      const t = farmTree(j.tid);
      if (!t || t.st !== "up" || farmRoom(FSPECIES[t.sp].log) < FTREE_SIZE[t.sz].logs) break;
      const r = farmFell(t, { acc: 0.55, tool: "axe" });
      if (r) { fx = { id: FSPECIES[t.sp].log, n: r.logs }; if (typeof worldTreeFall === "function" && typeof FV !== "undefined" && FV.on) try { worldTreeFall(t, Math.atan2(t.x - s.px, t.z - s.pz)); } catch (e) { /* egal */ } }
      break;
    }
    case "haul": case "bait":
      /* Reuse hochziehen und gleich wieder beködert runterlassen */
      if (o && j.k === "haul" && potState(o) === "ripe") { const r = farmHaul(o); if (r) fx = { id: r.id, n: r.n }; }
      if (o && potState(o) === "empty" && farmBaitItem()) { const k = o.last && farmPotOk(o.last) ? o.last : Object.keys(FPOTS).find(farmPotOk); if (k) farmBait(o, k); }
      break;
    case "fish": {
      const odds = farmFishOdds("steg"), id = farmWPick(Object.keys(odds), x => odds[x]);
      if (id && FITEMS[id] && farmRoom(id) > 0) {
        farmAdd(id, 1, 2 + Math.floor(Math.random() * 3));
        F.stats.species = F.stats.species || {};
        F.stats.species[id] = (F.stats.species[id] || 0) + 1; F.stats.catch = (F.stats.catch || 0) + 1;
        farmXP(FITEMS[id].xp); farmEvent("catch");
        fx = { id, n: 1 };
      }
      break;
    }
    case "send": {
      const ord = S.orders.find(x => x.id === j.order);
      if (!ord || !farmOrderReady(ord)) break;
      const opt = farmDispatchOptions(ord).find(p => p.here && !p.late);
      if (opt && farmSend(ord, opt)) { farmEvent("send"); if (typeof farmSyncVehicles === "function" && typeof FV !== "undefined" && FV.on) farmSyncVehicles(false); }
      break;
    }
  }
  if (fx) { s.last = fx.id; if (typeof staffFx === "function") staffFx(s, j, fx); }
}
/* Arbeitstakt: läuft mit dem Erbe-Takt, auch ohne Blick auf den Hof */
function staffWork() {
  const F = S.farm;
  if (!F || !F.staff) return;
  F.staff.forEach((s, i) => {
    const R = FSTAFF_ROLES[s.role];
    if (!R || !R.gap) { s.doing = R ? "hilft, wo es klemmt" : ""; return; }
    if (s.job) {
      if (S.time < s.job.t1) return;
      const j = s.job;
      s.job = null; s.work = S.time; s.px = j.x; s.pz = j.z;
      try { staffDo(s, j); } catch (e) { console.warn("Mitarbeiter:", e); }
      return;
    }
    if (S.time - (s.work || 0) < staffGap(s)) return;
    const j = staffFind(s);
    s.work = S.time;
    if (!j) { s.doing = staffIdleWhy(s); return; }
    /* lange nichts getan: steht wieder an seinem Platz */
    if (S.time - (s.jobEnd || 0) > 25) { const h = staffHome(s.role, i); s.px = h[0]; s.pz = h[1]; }
    const p = staffPlace(s, j), walk = Math.max(1.5, staffDist(s, p.x, p.z) / 5);
    s.job = Object.assign(j, p, { sx: s.px == null ? p.x : s.px, sz: s.pz == null ? p.z : s.pz, t0: S.time, walk, t1: S.time + walk + R.work });
    s.jobEnd = s.job.t1;
    s.doing = j.what;
  });
}
function staffIdleWhy(s) {
  switch (s.role) {
    case "farmer": return "alles bestellt – wartet auf die Ernte";
    case "pfleger": return "die Tiere sind versorgt";
    case "hofmeister": case "saeger": case "fischwirt": return staffMachines(s.role).length ? "Lager reicht oder Zutaten fehlen" : "noch keine Maschinen";
    case "holzfaeller": return "kein ausgewachsener Baum oder Holzplatz voll";
    case "fischer": return farmObj1("f_steg") ? "Kühlkiste voll" : "erst den Steg bauen";
    case "fahrer": return "keine fertige Bestellung oder kein Fahrzeug am Hof";
  }
  return "wartet";
}

/* --------------------------- Aussehen der Leute --------------------------- */
const STAFF_LOOK = {
  farmer:      { shirt: 0x6a9a3a, hat: "hut" },
  pfleger:     { shirt: 0x3f78c8, pants: 0x2f4f6a, hat: "muetze" },
  hofmeister:  { shirt: 0xf6f1e4, pants: 0x55504a },
  fahrer:      { shirt: 0x2f6fb0, hat: "muetze" },
  holzfaeller: { shirt: 0xc8443a, hat: "helm" },
  saeger:      { shirt: 0xf2a531, pants: 0x3a4a5a, hat: "helm" },
  mechaniker:  { shirt: 0x3a4a6a, hat: "helm" },
  fischer:     { shirt: 0x3a6a7a, pants: 0x2a3a4a, hat: "muetze" },
  fischwirt:   { shirt: 0xf6f6f2, pants: 0x3a4a6a }
};
const STAFF_SKIN = [0xf2c9a0, 0xe8b88a, 0xc68a5a, 0x8d5a3a], STAFF_HAIR = [0x3a2a1a, 0x7a4a2a, 0xd8b060, 0x1d1d20, 0xa8a8a8];
/* Werkzeug in der Hand */
function staffTool(role) {
  const M = typeof FWM !== "undefined" ? FWM : null;
  if (!M) return null;
  switch (role) {
    case "farmer": return { fn: () => M.tool("sickle"), s: 0.42 };
    case "pfleger": return { fn: () => M.item("hfutter"), s: 0.3 };
    case "hofmeister": return { fn: () => M.item("mehl"), s: 0.32 };
    case "saeger": return { fn: () => M.tool("saw1"), s: 0.32 };
    case "holzfaeller": return { fn: () => M.tool("axe2"), s: 0.5 };
    case "fischer": return typeof FFM !== "undefined" && FFM.rod ? { fn: () => FFM.rod(), s: 0.9, rod: true } : null;
    case "fischwirt": return { fn: () => M.item("kisten"), s: 0.28 };
    case "mechaniker": return { fn: () => { const b = new FM.MB(); b.box(0.5, 0.3, 0.26, 0xd8332b, { top: 0xb82a24 }); b.box(0.3, 0.06, 0.05, 0x2a2a30, { y: 0.32 }); return b; }, s: 0.45 };
    case "fahrer": return { fn: () => { const b = new FM.MB(); b.box(0.36, 0.5, 0.04, 0x8a6040); b.box(0.3, 0.38, 0.045, 0xfaf6ee, { y: 0.04 }); return b; }, s: 0.5 };
  }
  return null;
}
function staffBody(s) {
  const L = STAFF_LOOK[s.role] || STAFF_LOOK.farmer, k = s.look != null ? s.look : (s.name || "x").length * 37;
  return Object.assign({}, L, { skin: STAFF_SKIN[k % STAFF_SKIN.length], hair: L.hat ? null : STAFF_HAIR[(k >> 2) % STAFF_HAIR.length], seed: k % 50 });
}
/* Werkzeug in der Hand (relativ zur Figur) */
function staffToolAt(T) { return T.rod ? { x: 0.22, y: 0.42, z: 0.1, rx: -0.5, s: T.s } : { x: 0.26, y: 0.3, z: 0.12, s: T.s }; }
/* Figur mit Werkzeug als ein Modell (für Bildchen); f = Schwung 0 … 1 */
function staffModel(s, f) {
  const b = FWM.person(staffBody(s)), T = staffTool(s.role);
  if (T) { const at = Object.assign({}, staffToolAt(T)); if (f) { at.rz = (at.rz || 0) - 0.9 * f; at.y += 0.12 * f; } b.merge(T.fn(), at); }
  return b;
}
function staffIc(s) {
  if (typeof thumbSpan !== "function" || typeof FWM === "undefined") return `<span class="fst-emo">${FSTAFF_ROLES[s.role].i}</span>`;
  const k = "staff:" + s.role + ":" + (s.look != null ? s.look % 400 : s.name);
  return thumbSpan(k, () => staffModel(s), FSTAFF_ROLES[s.role].i).replace('class="ic th"', 'class="ic th ani"');
}

/* --------------------------- Auf dem Hof: Figuren -------------------------- */
function worldSyncStaff() {
  if (typeof FV === "undefined" || !FV.R) return;
  const R = FV.R, F = S.farm, ids = new Set((F.staff || []).map(s => s.id));
  for (const [id, n] of WV.staff) if (!ids.has(id)) { const i = R.nodes.indexOf(n.node); if (i >= 0) R.nodes.splice(i, 1); WV.staff.delete(id); }
  (F.staff || []).forEach((s, i) => {
    if (WV.staff.has(s.id)) return;
    const h = s.px != null ? [s.px, s.pz] : staffHome(s.role, i);
    const node = fnode(fmesh("staffp:" + s.role + ":" + (s.look != null ? s.look % 400 : s.name), () => FWM.person(staffBody(s))), { x: h[0], z: h[1], ry: 0.6 + i, s: 1.45 });
    R.nodes.push(node);
    const T = staffTool(s.role);
    const tool = T ? R.addChild(node, fnode(fmesh("stool:" + s.role, T.fn), staffToolAt(T))) : null;
    WV.staff.set(s.id, { node, tool, ph: i, x: h[0], z: h[1], fx: 0 });
  });
}
/* Jedes Bild: hinlaufen, arbeiten (Werkzeug schwingt), zurück an den Platz */
function stepStaff(dt, time) {
  const F = S.farm;
  if (!F || !F.staff || !WV.staff.size) return;
  F.staff.forEach((s, i) => {
    const e = WV.staff.get(s.id);
    if (!e) return;
    const j = s.job;
    let tx, tz, work = false, face = null;
    if (j) {
      const el = S.time - j.t0;
      if (el < j.walk) { const f = Math.max(0, el / j.walk); tx = j.sx + (j.x - j.sx) * f; tz = j.sz + (j.z - j.sz) * f; }
      else { tx = j.x; tz = j.z; work = true; face = Math.atan2(j.fx - j.x, j.fz - j.z); }
    } else if (S.time - (s.jobEnd || 0) > 8) { const h = staffHome(s.role, i); tx = h[0]; tz = h[1]; }
    else { tx = s.px != null ? s.px : e.x; tz = s.pz != null ? s.pz : e.z; }
    const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz), sp = 6 * dt;
    const n = e.node, moving = d > 0.05;
    if (d > 40) { e.x = tx; e.z = tz; }
    else if (moving) { const k = Math.min(1, sp / d); e.x += dx * k; e.z += dz * k; n.ry = Math.atan2(dx, dz); }
    else if (face != null) n.ry += (((face - n.ry + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 6);
    n.x = e.x; n.z = e.z;
    n.y = moving ? Math.abs(Math.sin(time * 11 + e.ph)) * 0.07 : work ? Math.abs(Math.sin(time * 6 + e.ph)) * 0.03 : Math.abs(Math.sin(time * 2.2 + e.ph)) * 0.02;
    if (e.tool) {
      const T = e.tool;
      if (work) { const sw = Math.sin(time * (s.role === "holzfaeller" ? 7 : 5) + e.ph); T.rz = -0.2 + sw * (s.role === "fischer" ? 0.15 : 0.8); T.rx = s.role === "fischer" ? -0.5 + sw * 0.1 : sw * 0.2; }
      else { T.rz = 0; T.rx = s.role === "fischer" ? -0.5 : 0; }
    }
    /* Holzfäller: Späne fliegen, der Baum wackelt */
    if (work && j && j.k === "fell" && Math.random() < dt * 3 && FV.R) {
      const t = farmTree(j.tid);
      if (t) { WV.hit = { id: t.id, t0: wnow() }; FV.R.burst({ x: t.x + 0.3, y: 0.6, z: t.z + 0.3, n: 4, col: [[0.9, 0.78, 0.55, 1], [0.75, 0.55, 0.32, 1]], speed: 1.2, up: 1.4, size: 0.06, shape: 1 }); }
    }
  });
}
/* fertig: kleiner Effekt am Ort, wenn man hinsieht */
function staffFx(s, j, fx) {
  if (typeof FV === "undefined" || !FV.on || !FV.R || !document.body.classList.contains("tab-farm")) return;
  const p = FV.R.project(j.x, 1.6, j.z);
  if (!p || p[0] < 0 || p[1] < 0 || p[0] > FV.R.w || p[1] > FV.R.h) return;
  FV.R.burst({ x: j.x, y: 0.9, z: j.z, n: 8, col: [[1, 0.86, 0.3, 1], [0.6, 0.85, 0.4, 1]], speed: 1.2, up: 1.8, size: 0.07, shape: 1, life: 0.8 });
  if (FITEMS[fx.id]) floatText(p[0], p[1], "+" + famt(fx.id, fx.n) + " " + FITEMS[fx.id].n, "");
}

/* ------------------------------ Team-Fenster ------------------------------ */
function staffHTML() {
  const F = S.farm;
  const groups = FSTAFF_GROUPS.map(G => {
    const roles = Object.keys(FSTAFF_ROLES).filter(r => FSTAFF_ROLES[r].g === G.id);
    const open = staffGroupOpen(G.id), hired = roles.filter(staffHas).length;
    const cands = open ? staffCands() : [];
    const rows = roles.map(r => {
      const R0 = FSTAFF_ROLES[r], s = F.staff.find(x => x.role === r);
      if (s) return `<div class="fstaff on"><div class="fst-p">${staffIc(s)}</div><div><b>${esc(s.name)} · ${R0.i} ${esc(R0.n)}</b>
          <small>${esc(R0.job)}</small><em class="fst-do">${s.job ? "▶ " : "· "}${esc(s.doing || "wartet")}</em>
          <small>${esc(s.trait)} +${s.perk} % · ${eur(s.wage)} am Tag${s.fed === false ? " · 😟 hungrig" : " · 😊 satt"}</small></div>
          <button class="btn tiny ghost" data-fire="${s.id}">Entlassen</button></div>`;
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
  return `<div class="fs-sub">👷 Ist die nächste Etappe offen, übernehmen deine Leute die alte Station – langsamer als du, aber ohne Pause.</div>
    ${groups}
    <div class="fs-sub">Täglich Lohn + Brotzeit aus dem Lager – hungrig schaffen sie nur die Hälfte.</div>`;
}
function staffBind(again) {
  $$("#farmSheetIn [data-hire]").forEach(b => b.onclick = () => { if (staffHire(b.dataset.hire)) { sfx("build"); save(); farmSyncScene(); again(); } else sfx("bad"); });
  $$("#farmSheetIn [data-fire]").forEach(b => b.onclick = () => askConfirm("Wirklich entlassen?", "Die Stelle wird frei – neue Bewerbungen kommen jeden Tag.", "Entlassen", () => { staffFire(b.dataset.fire); save(); farmSyncScene(); again(); }));
  if (typeof thumbFill === "function") thumbFill();
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
