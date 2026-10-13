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
    S.farm.objs.forEach(o => { if (o.animals && o.animals.length) { const A = FANIMALS[penKind(o)]; if (A && A.feed === id) eat += o.animals.length; } });
    return need + eat * 2 + 2;
  }
  return need + 6;
}
/* Bestes Rezept für eine Maschine (ohne Auftrag): was am meisten fehlt, Zutaten da, Platz im Lager */
function staffPickRecipe(o) {
  const M = FMACHINES[o.t];
  let best = null, bs = 0;
  M.recipes.forEach(r => {
    if (r.lv > flv() || !farmHasAll(r.in) || (r.cost && S.money < r.cost + 50)) return;
    /* was für Bestellungen und Aufträge gebraucht wird, bleibt liegen */
    if (Object.keys(r.in).some(id => farmInv(id) - r.in[id] < staffReserve(id))) return;
    if (FITEMS[r.id].energy) return;
    if (farmRoom(r.id) < r.out) return;
    const sc = staffWant(r.id) - farmInv(r.id) + (o.lastR === rkey(r) ? 0.5 : 0);
    if (sc > bs) { bs = sc; best = r; }
  });
  return best;
}
/* „für den Sägebock“, „für das Kühlhaus“, „für die Räucherei“ */
function staffMachThe(t) {
  const n = FMACHINES[t].n, den = ["bakery", "saegebock", "kessel", "spalter", "f_markt"], das = ["f_lager", "f_kuehl"];
  return (den.includes(t) ? "den " : das.includes(t) ? "das " : "die ") + n;
}
function staffMachRole(o) { const M = FMACHINES[o.t]; return M.fish ? "fischwirt" : (M.saw || o.t === "saegebock") ? "saeger" : "hofmeister"; }
function staffMachines(role) {
  return S.farm.objs.filter(o => {
    const M = FMACHINES[o.t];
    if (!M || !o.q || M.trips || (o.area && !farmAreaOpen(o.area))) return false;
    if ((M.saw || o.t === "saegebock") && !machReady(o)) return false;
    return staffMachRole(o) === role;
  });
}
/* Welche eigene Maschine macht diese Ware? (am liebsten eine, für die alles da ist) */
function staffRecipeFor(id, role) {
  let best = null;
  S.farm.objs.forEach(o => {
    const M = FMACHINES[o.t];
    if (!M || !o.q || M.trips || (o.area && !farmAreaOpen(o.area))) return;
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
  if (FITEMS[id] && FITEMS[id].st === "fisch" && typeof FGROUNDS !== "undefined" && FGROUNDS[0].fish[id]) return { role: "fischer" };
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
  return staffTaskList().filter(T => T.role === role).sort((a, b) => (b.prio - a.prio) || (a.t0 - b.t0));
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
    if (o.from === "chef") { ex.n += o.n; ex.prio = 2; }
    else ex.n = Math.max(ex.n, ex.made + o.n);
    return ex;
  }
  if (list.filter(T => T.role === role).length >= 6) return null;
  const T = { id: "T" + (S.seq++), role, item: o.item, n: Math.max(1, Math.round(o.n || 1)), made: 0, stock: o.stock || null,
    from: o.from, fromId: o.fromId || null, note: o.note || "", why: o.why || "", parent: o.parent || null, t0: S.time, tp: S.time, prio: o.from === "chef" ? 2 : 1, wait: "" };
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
    staffMachines(role).forEach(o => FMACHINES[o.t].recipes.forEach(r => { if (!FITEMS[r.id].energy) add(r.id, r.lv > flv()); }));
  } else if (role === "holzfaeller") {
    const T0 = F.tools || {};
    ["birke", "kiefer", "fichte", "buche", "kirsche"].forEach(sp => { if (FSPECIES[sp]) add(FSPECIES[sp].log); });
    if ((T0.axe || 1) >= 2) add(FSPECIES.eiche.log);
    add("aeste");
  } else if (role === "fischer") {
    if (typeof FGROUNDS !== "undefined") Object.keys(FGROUNDS[0].fish).forEach(add);
  } else if (role === "fahrer") {
    farmOrders().filter(o => !o.farm.taken).forEach(o => add("order:" + o.id));
  }
  return out.filter(x => x.item.startsWith("order:") || x.item.startsWith("ani:") || FITEMS[x.item]);
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
function staffPlan() {
  const F = S.farm, list = staffTaskList();
  /* fertig, verfallen, Kraft entlassen */
  F.tasks = list.filter(T => {
    if (staffTaskDone(T)) { const s = staffOf(T.role); if (s) { s.doneT = (s.doneT || []).slice(-2).concat(staffItemName(T.item)); } return false; }
    /* Fortschritt zählt auch: Frucht wächst, Maschine läuft, ein Unterauftrag kommt voran */
    let last = Math.max(T.tp || T.t0, T.alive || 0);
    list.forEach(c => { if (c.parent === T.id) last = Math.max(last, c.tp || c.t0, c.alive || 0); });
    const idle = S.time - last;
    if (T.role === "chef" ? S.time - T.t0 > 1440 : idle > (T.prio === 2 ? 2880 : 720)) return false;
    return true;
  });
  F.tasks.forEach(T => { if (T.role !== "chef" && !staffHas(T.role)) T.role = "chef"; });
  const ids = new Set(F.tasks.map(T => T.id));
  F.tasks = F.tasks.filter(T => !T.parent || ids.has(T.parent));
  /* Tierpfleger: wie viele Tiere sollen es sein? Und fehlt Futter? */
  const pf = staffOf("pfleger");
  F.objs.forEach(o => { if (FPENS[o.t] && o.animals) o.want = Math.max(o.want || 0, o.animals.length); });
  if (pf) F.objs.filter(o => FPENS[o.t] && o.animals && o.animals.length).forEach(o => {
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
      const M = FMACHINES[o.t], ok = r => r.lv <= flv() && !FITEMS[r.id].energy && farmRoom(r.id) >= r.out;
      if (M.recipes.some(r => ok(r) && farmHasAll(r.in))) return;
      let best = null, bs = 0;
      M.recipes.forEach(r => { if (!ok(r)) return; const sc = staffWant(r.id) - farmInv(r.id); if (sc > bs) { bs = sc; best = r; } });
      if (best && !staffTaskList().some(T => T.item === best.id)) staffEnsureTask({ role, item: best.id, n: best.out, from: role, fromId: s.id, note: "für " + staffMachThe(o.t) });
    });
  });
  /* Fahrer/in: die nächste Bestellung, die noch nicht fertig ist */
  const fa = staffOf("fahrer");
  if (fa) {
    const open = staffTasksOf("fahrer").filter(T => T.item.startsWith("order:")).length;
    if (open < 2) {
      const o = farmOrders().filter(x => !x.farm.taken && x.deadline > S.time + 60 && !staffTaskList().some(T => T.item === "order:" + x.id))
        .sort((a, b) => a.deadline - b.deadline)[0];
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
function staffTaskJob(s, T) {
  const F = S.farm, item = T.item, name = staffItemName(item);
  T.wait = "";
  switch (s.role) {
    case "farmer": {
      if (FCROPS[item]) {
        const fields = F.objs.filter(o => o.t === "field");
        const ripe = staffNear(s, fields.filter(o => fieldState(o) === "ripe" && o.crop === item && farmRoom(item) >= 3))[0];
        if (ripe) return { k: "field", oid: ripe.id, crop: item, what: "erntet " + name };
        if (!farmCropOk(item)) { T.wait = name + " erst ab Level " + FCROPS[item].lv; return null; }
        if (staffCropNeed(item)) {
          const empty = staffNear(s, fields.filter(o => fieldState(o) === "empty"))[0];
          if (empty && S.money >= FCROPS[item].seed) return { k: "field", oid: empty.id, crop: item, what: "sät " + name };
          const other = staffNear(s, fields.filter(o => fieldState(o) === "ripe" && o.crop !== item && farmRoom(o.crop) >= 3))[0];
          if (other) return { k: "field", oid: other.id, crop: item, what: "erntet " + FITEMS[other.crop].n + ", sät " + name };
        }
        const dry = staffNear(s, fields.filter(o => o.crop === item && fieldState(o) === "grow" && !o.w))[0];
        if (dry) return { k: "water", oid: dry.id, what: "gießt den " + name };
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
        const kind = item.slice(4), A = FANIMALS[kind], pen = staffNear(s, F.objs.filter(o => o.t === A.house && o.animals.length < A.max))[0];
        if (!pen) { T.wait = F.objs.some(o => o.t === A.house) ? "der Stall ist voll" : "erst den Stall bauen"; return null; }
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
      const sun = typeof pvFull === "function" && pvFull();
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
      const j = staffFellerJob(s, t => item === "aeste" || FSPECIES[t.sp].log === item);
      if (j) return j;
      T.wait = "gerade kein ausgewachsener Baum dafür";
      return null;
    }
    case "fischer": {
      /* welcher Fisch anbeißt, ist Glück – kommt lange keiner, verfällt der Auftrag */
      const j = staffFischerJob(s);
      if (j) { T.wait = ""; return j; }
      T.wait = "Kühlkiste voll";
      return null;
    }
    case "fahrer": {
      if (!item.startsWith("order:")) return null;
      const o = S.orders.find(x => x.id === item.slice(6));
      if (!o || o.farm.taken) return null;
      if (farmOrderReady(o)) {
        const opt = farmDispatchOptions(o).find(p => p.here && !p.late) || farmDispatchOptions(o).find(p => p.here);
        if (opt) { const b = farmObj1("board"); return { k: "send", order: o.id, oid: b ? b.id : null, what: "schickt die Lieferung an " + o.shipper + " los" }; }
        T.wait = "kein freies Fahrzeug am Hof"; return null;
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
  if (s.role === "saeger" && !(typeof pvFull === "function" && pvFull())) {
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
  if (!pickO) for (const o of list) {
    if (o.t === "kessel" || o.broken || o.q.length + o.done.length >= machSlots(o)) continue;
    const r = staffPickRecipe(o);
    if (r) { pickO = o; rid = rkey(r); what = "macht " + FITEMS[r.id].n; break; }
  }
  if (!pickO) return null;
  return { k: "mach", oid: pickO.id, rid, what };
}
/* Was säen? Was Aufträge brauchen, dann was fehlt (Getreide zählt fürs Futter mehr), dann Fruchtwechsel */
function staffCrop(o) {
  let best = null, bs = -1e9;
  const feed = {};
  S.farm.objs.forEach(x => { if (x.animals && x.animals.length) { const A = FANIMALS[penKind(x)]; const m = A && staffRecipeFor(A.feed); if (m) for (const id in m.r.in) feed[id] = 1; } });
  Object.keys(FCROPS).forEach(c => {
    if (!farmCropOk(c) || S.money < FCROPS[c].seed + 20) return;
    const sc = (staffCropNeed(c) ? 50 : 0) + staffWant(c) - farmInv(c) + (feed[c] ? 6 : 0) + (o.last && o.last !== c ? 0.6 : 0) - FCROPS[c].t / 2000;
    if (sc > bs) { bs = sc; best = c; }
  });
  return best;
}
function staffFarmerJob(s) {
  const F = S.farm, fields = F.objs.filter(o => o.t === "field"), trees = F.objs.filter(o => o.t === "tree");
  const ripe = staffNear(s, fields.filter(o => fieldState(o) === "ripe" && farmRoom(o.crop) >= 3))[0];
  if (ripe) return { k: "field", oid: ripe.id, what: "erntet " + FITEMS[ripe.crop].n };
  const fruit = staffNear(s, trees.filter(o => treeRipe(o) && farmRoom(o.kind) >= 4))[0];
  if (fruit) return { k: "pick", oid: fruit.id, what: "pflückt " + FITEMS[fruit.kind].n };
  const empty = staffNear(s, fields.filter(o => fieldState(o) === "empty" && staffCrop(o)))[0];
  if (empty) return { k: "field", oid: empty.id, what: "sät " + FITEMS[staffCrop(empty)].n };
  const dry = staffNear(s, fields.filter(o => fieldState(o) === "grow" && !o.w).concat(trees.filter(o => !treeRipe(o) && !o.w)))[0];
  if (dry) return { k: "water", oid: dry.id, what: "gießt" };
  return null;
}
/* Wie viele Tiere soll ein Stall haben? Masttiere: so viele, wie mit drei Sternen
   Platz haben (oder mehr, wenn du schon mehr hattest); sonst: so viele, wie es schon waren */
function staffPenTarget(o) {
  const kind = penKind(o), A = FANIMALS[kind];
  if (!A || A.fish) return 0;
  if (!A.mast) return Math.min(A.max, o.want || 0);
  const P = FPENS[o.t], p = P[Math.min(P.length, o.lvl || 1) - 1];
  return Math.min(A.max, Math.max(o.want || 0, Math.max(1, Math.floor(p.m2 / (A.space * 0.9)))));
}
function staffPflegerJob(s) {
  const pens = S.farm.objs.filter(o => FPENS[o.t] && o.animals && FANIMALS[penKind(o)] && !FANIMALS[penKind(o)].fish);
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
function staffAutoJob(s) {
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
  if (j.tid != null) { const t = farmTree(j.tid); if (t) p = { x: t.x + 0.75, z: t.z + 0.75, fx: t.x, fz: t.z }; }
  else if (j.oid != null) { const o = farmObj(j.oid); if (o) p = staffSpot(o); }
  if (!p) { const h = staffHome(s.role); p = { x: h[0], z: h[1], fx: h[0], fz: h[1] - 1 }; }
  return p;
}
/* Erledigen – erst jetzt passiert es wirklich (alles noch einmal prüfen) */
function staffDo(s, j) {
  const F = S.farm, o = j.oid != null ? farmObj(j.oid) : null, got = [];
  const gain = (id, n) => { if (id && n > 0) { got.push({ id, n }); staffCredit(s.role, id, n); } };
  switch (j.k) {
    case "field":
      if (!o) break;
      if (fieldState(o) === "ripe" && farmRoom(o.crop) >= 3) { const r = farmHarvest(o); if (r) gain(r.id, r.n); }
      if (fieldState(o) === "empty") {
        const c = j.crop && farmCropOk(j.crop) && staffCropNeed(j.crop) ? j.crop : staffCrop(o);
        if (c && S.money >= FCROPS[c].seed) farmPlant(o, c);
      }
      break;
    case "pick": if (o && treeRipe(o) && farmRoom(o.kind) >= 4) { const r = farmPick(o); if (r) gain(r.id, r.n); } break;
    case "water": if (o) farmWater(o); break;
    case "pen": {
      if (!o) break;
      const kind = penKind(o), A = FANIMALS[kind];
      o.animals.filter(a => aniState(a) === "ready").forEach(a => { if (farmRoom(A.out) >= (A.mast ? A.yield : 1)) { const r = farmCollect(o, a); if (r) gain(r.id, r.n); } });
      o.animals.filter(a => aniState(a) === "hungry").forEach(a => { if (farmInv(A.feed) > 0) farmFeed(o, a); });
      if (j.buy) {
        /* bis zu zwei Tiere je Gang (eigener Plan), auf deinen Auftrag genau eins */
        const B = FANIMALS[j.buy], times = j.auto ? 2 : 1;
        for (let k = 0; k < times; k++) {
          if (o.t !== B.house || o.animals.length >= B.max || S.money < animalPrice(j.buy) + (j.auto ? 100 : 0)) break;
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
      if (r && farmHasAll(r.in) && (FITEMS[r.id].energy || farmRoom(r.id) >= r.out)) { if (farmQueue(o, j.rid) === true) o.lastR = j.rid; }
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
      if (o && j.k === "haul" && potState(o) === "ripe") { const r = farmHaul(o); if (r) (r.got || [{ sp: r.id }]).forEach(g => gain(g.sp, 1)); }
      if (o && potState(o) === "empty" && farmBaitItem()) { const k = o.last && farmPotOk(o.last) ? o.last : Object.keys(FPOTS).find(farmPotOk); if (k) farmBait(o, k); }
      break;
    case "fish": {
      const odds = farmFishOdds("steg"), id = farmWPick(Object.keys(odds), x => odds[x]);
      if (id && FITEMS[id] && farmRoom(id) > 0) {
        farmAdd(id, 1, 2 + Math.floor(Math.random() * 3));
        F.stats.species = F.stats.species || {};
        F.stats.species[id] = (F.stats.species[id] || 0) + 1; F.stats.catch = (F.stats.catch || 0) + 1;
        farmXP(FITEMS[id].xp); farmEvent("catch");
        gain(id, 1);
      }
      break;
    }
    case "send": {
      const ord = S.orders.find(x => x.id === j.order);
      if (!ord || !farmOrderReady(ord)) break;
      const opt = farmDispatchOptions(ord).find(p => p.here && !p.late) || farmDispatchOptions(ord).find(p => p.here);
      if (opt && farmSend(ord, opt)) { staffCredit(s.role, "order:" + ord.id, 1); farmEvent("send"); if (typeof farmSyncVehicles === "function" && typeof FV !== "undefined" && FV.on) farmSyncVehicles(false); }
      break;
    }
  }
  if (got.length) { s.last = got[0].id; if (typeof staffFx === "function") staffFx(s, j, got[0]); }
}
/* Arbeitstakt: läuft mit dem Erbe-Takt, auch ohne Blick auf den Hof */
function staffWork() {
  const F = S.farm;
  if (!F || !F.staff) return;
  if (F.staff.length && S.time - (F.taskT || 0) >= 3) { F.taskT = S.time; try { staffPlan(); } catch (e) { console.warn("Aufträge:", e); } }
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
    if (!j) { const T = staffTasksOf(s.role).find(x => x.wait); s.doing = T ? T.wait : staffIdleWhy(s); return; }
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
    case "pfleger": {
      const hungry = S.farm.objs.find(o => FPENS[o.t] && o.animals && o.animals.some(a => aniState(a) === "hungry"));
      if (hungry) return "wartet auf " + staffItemName(FANIMALS[penKind(hungry)].feed);
      return "die Tiere sind versorgt";
    }
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
const staffKey = s => s.role + ":" + (s.look != null ? s.look % 400 : s.name);
/* Werkzeug in der Hand (relativ zur Figur – für das Bildchen) */
function staffToolAt(T) { return T.rod ? { x: 0.22, y: 0.42, z: 0.1, rx: -0.5, s: T.s } : { x: 0.26, y: 0.3, z: 0.12, s: T.s }; }
/* … und relativ zur Schulter des beweglichen Arms (auf dem Hof) */
const STAFF_SHOULDER = { x: 0.19, y: 0.78, z: 0 };
function staffToolOnArm(T) { return T.rod ? { x: 0.03, y: -0.36, z: 0.1, rx: -0.5, s: T.s } : { x: 0.07, y: -0.48, z: 0.12, s: T.s }; }
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
function worldSyncStaff() {
  if (typeof FV === "undefined" || !FV.R) return;
  const R = FV.R, F = S.farm, ids = new Set((F.staff || []).map(s => s.id));
  for (const [id, n] of WV.staff) if (!ids.has(id)) { const i = R.nodes.indexOf(n.node); if (i >= 0) R.nodes.splice(i, 1); WV.staff.delete(id); }
  (F.staff || []).forEach((s, i) => {
    if (WV.staff.has(s.id)) return;
    const h = s.px != null ? [s.px, s.pz] : staffHome(s.role, i), body = staffBody(s);
    const node = fnode(fmesh("staffb:" + staffKey(s), () => FWM.person(Object.assign({}, body, { armR: false }))), { x: h[0], z: h[1], ry: 0.6 + i, s: 1.45 });
    R.nodes.push(node);
    const arm = R.addChild(node, fnode(fmesh("starm:" + body.shirt + ":" + body.skin, () => FWM.arm(body)), Object.assign({ rz: 0.08 }, STAFF_SHOULDER)));
    const T = staffTool(s.role);
    const tool = T ? R.addChild(arm, fnode(fmesh("stool:" + s.role, T.fn), staffToolOnArm(T))) : null;
    WV.staff.set(s.id, { node, arm, tool, ph: i, x: h[0], z: h[1], fx: 0, wave: null });
  });
}
const angTo = (a, b) => (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
/* Jedes Bild: hinlaufen, arbeiten (Arm schwingt das Werkzeug), winken, zurück an den Platz */
function stepStaff(dt, time) {
  const F = S.farm;
  if (!F || !F.staff) return;
  /* neu eingestellt (oder nach dem Laden): Figur nachziehen */
  if (WV.staff.size !== F.staff.length && FV.R) worldSyncStaff();
  if (!WV.staff.size) return;
  const now = wnow();
  F.staff.forEach((s, i) => {
    const e = WV.staff.get(s.id);
    if (!e) return;
    const j = s.job, n = e.node, A = e.arm;
    /* angetippt: stehen bleiben, zu dir drehen, einmal winken */
    const wv = e.wave != null ? now - e.wave : 99;
    if (wv < 1.9) {
      const eye = FV.R.eye || [FV.R.cam.tx + 20, 0, FV.R.cam.tz + 20];
      const r0 = e.wr0 != null ? e.wr0 : n.ry, k = Math.min(1, wv / 0.3);
      n.ry = r0 + angTo(r0, Math.atan2(eye[0] - e.x, eye[2] - e.z)) * (1 - (1 - k) * (1 - k));
      n.y = 0;
      if (A) {
        const up = Math.min(1, wv / 0.25, (1.9 - wv) / 0.3);
        A.rz = 0.08 + up * (2.45 + Math.sin(wv * 13) * 0.35);
        A.rx = 0;
      }
      return;
    }
    let tx, tz, work = false, face = null;
    if (j) {
      const el = S.time - j.t0;
      if (el < j.walk) { const f = Math.max(0, el / j.walk); tx = j.sx + (j.x - j.sx) * f; tz = j.sz + (j.z - j.sz) * f; }
      else { tx = j.x; tz = j.z; work = true; face = Math.atan2(j.fx - j.x, j.fz - j.z); }
    } else if (S.time - (s.jobEnd || 0) > 8) { const h = staffHome(s.role, i); tx = h[0]; tz = h[1]; }
    else { tx = s.px != null ? s.px : e.x; tz = s.pz != null ? s.pz : e.z; }
    const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz), sp = 6 * dt;
    const moving = d > 0.05;
    if (d > 40) { e.x = tx; e.z = tz; }
    else if (moving) { const k = Math.min(1, sp / d); e.x += dx * k; e.z += dz * k; n.ry += angTo(n.ry, Math.atan2(dx, dz)) * Math.min(1, dt * 12); }
    else if (face != null) n.ry += angTo(n.ry, face) * Math.min(1, dt * 6);
    n.x = e.x; n.z = e.z;
    n.y = moving ? Math.abs(Math.sin(time * 11 + e.ph)) * 0.07 : work ? Math.abs(Math.sin(time * 6 + e.ph)) * 0.03 : Math.abs(Math.sin(time * 2.2 + e.ph)) * 0.02;
    if (A) {
      const rod = s.role === "fischer";
      if (work) {
        const sw = Math.sin(time * (s.role === "holzfaeller" ? 7 : 5) + e.ph);
        if (rod) { A.rx = -0.55 + sw * 0.08; A.rz = 0.1; }
        else if (s.role === "fahrer") { A.rx = -0.9 + sw * 0.05; A.rz = 0.15; }
        else if (s.role === "pfleger" || s.role === "hofmeister" || s.role === "fischwirt") { A.rx = -0.35 + sw * 0.35; A.rz = 0.12; }
        else { A.rx = -0.7 + sw * 0.75; A.rz = 0.12 + sw * 0.1; }       /* Sichel, Axt, Säge */
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
  if (FV.pop && FV.pop.kind === "staff" && now - (WV.staffPopAt || 0) > 0.5) { WV.staffPopAt = now; renderStaffPop($("#farmPop"), FV.pop); }
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
    const top = FV.R.project(e.x, 1.75, e.z), bot = FV.R.project(e.x, 0, e.z);
    if (!top || !bot) continue;
    /* eng um die Figur – wer daneben auf ein Gebäude tippt, meint das Gebäude */
    const h = Math.max(20, bot[1] - top[1]), w = Math.max(13, h * 0.3);
    if (y < top[1] - 6 || y > bot[1] + 5 || Math.abs(x - bot[0]) > w) continue;
    const d = Math.abs(x - bot[0]) + Math.abs(y - (top[1] + bot[1]) / 2) * 0.3;
    if (d < bd) { bd = d; best = id; }
  }
  if (best == null) return false;
  const e = WV.staff.get(best);
  e.wave = wnow(); e.wr0 = e.node.ry;
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
  let h = `<div class="fp-h fst-h"><span class="fst-pi">${staffIcNow(s)}</span><div>${esc(s.name)} · ${R0.i} ${esc(R0.n)}
    <small>${s.job ? "▶ " : "· "}${esc(s.doing || "wartet")}${cur ? " · für " + esc(staffWho(cur)) : s.job ? " · eigener Plan" : ""}</small></div></div>`;
  if (!R0.gap) return h + `<div class="fst-none">Arbeitet ohne Aufträge: Reparaturen und Strom werden günstiger, nichts klemmt mehr.</div>`;
  h += tasks.length ? `<div class="fst-ts">${tasks.map(T => staffTaskRow(T, true)).join("")}</div>`
    : `<div class="fst-none">Kein Auftrag – arbeitet nach eigenem Plan.${s.doneT && s.doneT.length ? `<br>Zuletzt erledigt: ${esc(s.doneT.slice(-2).join(", "))}` : ""}</div>`;
  if (P.add) {
    const opts = staffOptions(s.role);
    h += `<div class="fst-add-h">Was soll ${esc(s.name)} machen?<small>Nochmal tippen = mehr</small></div><div class="fp-row fst-opts">`
      + (opts.length ? opts.map(o => `<div class="ftool${o.lock ? " lock" : ""}" data-tgive="${esc(o.item)}">${staffItemIcNow(o.item)}<b>${esc(staffItemName(o.item, 2))}</b><small>${o.lock ? "noch nicht" : "×" + staffDefaultN(o.item)}</small></div>`).join("")
        : `<div class="fst-none">Gerade gibt es nichts, was ${esc(s.name)} machen kann.</div>`) + `</div>`;
  } else h += `<button class="btn tiny fst-give" data-tadd="1">＋ Auftrag geben</button>`;
  return h;
}
/* nur neu zeichnen, wenn sich etwas geändert hat (sonst flackert die Blase) – force nach deinem Tippen */
function renderStaffPop(el, P, force) {
  if (!el) return;
  const s = (S.farm.staff || []).find(x => x.id === P.id);
  if (!s) return closeFarmPop();
  const h = staffPopHTML(s, P);
  if (force !== true && el._sh === h && el.querySelector(".fstp")) { positionStaffPop(el, P); return; }
  el._sh = h;
  el.classList.add("on");
  el.innerHTML = `<div class="fp-box fstp">${h}</div>`;
  el.querySelectorAll("[data-tdel]").forEach(b => b.onclick = ev => { ev.stopPropagation(); if (staffTaskDel(b.dataset.tdel, true)) { sfx("pop"); save(); } renderStaffPop(el, P, true); });
  el.querySelectorAll("[data-tadd]").forEach(b => b.onclick = ev => { ev.stopPropagation(); P.add = true; renderStaffPop(el, P, true); });
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
  const p = FV.R.project(e.x, 2.35, e.z), f = FV.R.project(e.x, 0, e.z);
  if (!p) return;
  const w = box.offsetWidth, hgt = box.offsetHeight, W = FV.R.w, H = FV.R.h;
  let x = clamp(p[0] - w / 2, 8, W - w - 8), y = p[1] - hgt - 10;
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
        return `<div class="fstaff on"><div class="fst-p">${staffIc(s)}</div><div><b>${esc(s.name)} · ${R0.i} ${esc(R0.n)}</b>
          <small>${esc(R0.job)}</small><em class="fst-do">${s.job ? "▶ " : "· "}${esc(s.doing || "wartet")}</em>
          ${ts.length ? `<small class="fst-tl">📋 ${ts.map(T => esc(staffItemName(T.item, T.n)) + " (" + esc(staffWho(T)) + ")").join(" · ")}</small>` : ""}
          <small>${esc(s.trait)} +${s.perk} % · ${eur(s.wage)} am Tag${s.fed === false ? " · 😟 hungrig" : " · 😊 satt"}</small></div>
          <button class="btn tiny ghost" data-fire="${s.id}">Entlassen</button></div>`;
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
  return `<div class="fs-sub">👷 Ist die nächste Etappe offen, übernehmen deine Leute die alte Station – langsamer als du, aber ohne Pause. Tipp eine Kraft auf dem Hof an: Sie zeigt ihren Auftrag, und du kannst einen neuen geben.</div>
    ${forYou}${groups}
    <div class="fs-sub">Täglich Lohn + Brotzeit aus dem Lager – hungrig schaffen sie nur die Hälfte.</div>`;
}
function staffBind(again) {
  $$("#farmSheetIn [data-hire]").forEach(b => b.onclick = () => { if (staffHire(b.dataset.hire)) { sfx("build"); save(); farmSyncScene(); again(); } else sfx("bad"); });
  $$("#farmSheetIn [data-fire]").forEach(b => b.onclick = () => askConfirm("Wirklich entlassen?", "Die Stelle wird frei – neue Bewerbungen kommen jeden Tag.", "Entlassen", () => { staffFire(b.dataset.fire); save(); farmSyncScene(); again(); }));
  $$("#farmSheetIn [data-tdel]").forEach(b => b.onclick = () => { staffTaskDel(b.dataset.tdel, true); sfx("pop"); save(); again(); });
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
