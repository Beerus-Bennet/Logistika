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
  hofTrees: [[18.3, -11, "birke", 1], [18.2, 14.2, "birke", 1], [18.4, 6.5, "kiefer", 1], [17.9, 10.5, "birke", 1], [18.4, -13.8, "kiefer", 1],
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
  /* Schatzkisten: alle drei Tage (die erste kommt noch heute, wenn es nicht zu spät ist) */
  F.tr = F.tr || { next: Math.floor(S.time / 1440), plan: 0, cur: null, found: 0, zone: null };
  /* ältere Stände: das zufällige „Vögel kreisen“ gibt es nicht mehr – die Kiste kommt jetzt nach Plan */
  if (F.ev.cur && F.ev.cur.k === "schatz") { F.ev.cur = null; F.ev.next = S.time + 10; F.tr.next = Math.min(F.tr.next, Math.floor(S.time / 1440)); }
  /* ältere Stände: der Händler blieb zehn Stunden – jetzt eine */
  if (F.ev.cur && FEVENTS[F.ev.cur.k] && F.ev.cur.until - F.ev.cur.t0 > FEVENTS[F.ev.cur.k].dur && F.ev.cur.k === "haendler") F.ev.cur.until = Math.min(F.ev.cur.until, Math.max(S.time + 5, F.ev.cur.t0 + FEVENTS.haendler.dur));
  F.clover = F.clover != null ? F.clover : 5;
  F.cos = F.cos || { own: {}, on: {} };
  F.stall = F.stall || { slots: [], coins: 0 };
  /* v53: Heuballen vom Weg, Scheune Rand an Rand ans Wohnhaus */
  if (!F.v53) {
    F.v53 = 1;
    F.objs = F.objs.filter(o => !(o.t === "deco" && o.k === "hayBale" && o.x === 15 && o.z === 9));
    const h = F.objs.find(o => o.t === "house"), b = F.objs.find(o => o.t === "barn");
    if (h && b && b.x === h.x + 6 && b.z === h.z && !b.r && !h.r && !F.objs.some(o => o !== b && o !== h && o.x <= h.x + 5 && o.x + farmSize(o)[0] > h.x + 5 && o.z < b.z + 4 && o.z + farmSize(o)[1] > b.z)) b.x = h.x + 5;
  }
  /* v53: Wildschweine mit Pilzen gibt es nicht mehr – Ereignis, Pilze im Lager und am Stand verschwinden */
  if (F.ev && F.ev.cur && F.ev.cur.k === "pilze") F.ev.cur = null;
  if (F.inv && F.inv.pilze) delete F.inv.pilze;
  if (F.stall.slots) F.stall.slots = F.stall.slots.map(x => x && x.id === "pilze" ? null : x);
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
  /* Verkaufsstand an der Straße (v53: nicht mehr im Hof) */
  if (!F.objs.some(o => o.t === "stall")) {
    const p = farmZoneSpot("road", 2, 1, 16, 32.5, "stall");
    if (p) farmAddObj({ t: "stall", x: p[0], z: p[1], r: 0 });
  } else {
    const st = F.objs.find(o => o.t === "stall");
    /* v54: nicht im Traktor, nicht vor Laternen – sonst an den nächsten freien Platz */
    st.r = 0;
    if (!farmFits(st.x, st.z, ...farmSize(st), st.id, "stall")) { const p = farmZoneSpot("road", ...farmSize(st), 16, 32.5, "stall", null, st.id); if (p) { st.x = p[0]; st.z = p[1]; } }
  }
  if (fresh) erbeJunk(F);
  /* Lehmanns Ufer aus dem Testbuild gehört jetzt zum See; mit Steg gibt es die Angel */
  if (F.ufer) { F.angel = F.angel || F.ufer; delete F.ufer; }
  if (F.areas.ufer) delete F.areas.ufer;
  F.areaQ = F.areaQ.filter(id => FAREAS[id]);
  F.objs = F.objs.filter(o => o.t !== "u_steg");
  F.objs.forEach(o => { if (o.area === "ufer") o.area = "see"; });
  if (F.objs.some(o => o.t === "f_steg")) angelInit(F);
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
/* Welche Werkzeuge passen zu diesem Baum? Der Spieler wählt selbst –
   die Säge ist schneller und bringt mehr Holz, kostet aber Sprit. */
function treeTools(t) {
  const need = treeNeeds(t), T = S.farm.tools, out = [];
  if (!need.saw && (T.axe || 1) >= (need.axe || 1)) out.push("axe");
  if ((T.saw || 0) >= (need.saw || 1)) out.push("saw");
  /* v53: jeder Baum lässt sich fällen – ohne passendes Werkzeug eben mühsam mit der Axt */
  if (!out.length) out.push("axe");
  return out;
}
/* passt das Werkzeug eigentlich nicht? Dann braucht die Axt deutlich mehr Schläge */
function treeHard(t, tool) {
  const need = treeNeeds(t), T = S.farm.tools;
  if (tool === "saw") return false;
  return !!need.saw || (T.axe || 1) < (need.axe || 1);
}
/* Setzling roden: ein Bündel Äste, dann treibt der Stumpf wieder aus */
function farmFellSapling(t) {
  if (!t || t.st !== "sapling") return null;
  if (farmRoom("aeste") < 1) { farmFull("holz"); return null; }
  if (!farmStaUse(2)) return "tired";
  farmAdd("aeste", 1, 3);
  farmXP(2);
  t.st = "stump"; t.dmg = 0; t.sz = 0;
  t.t = S.time + FREGROW.stump * FSPECIES[t.sp].regrow;
  farmEvent("fell:sapling");
  return { id: "aeste", n: 1, xp: 2 };
}
function treeTool(t) {
  const l = treeTools(t), pref = S.farm.toolPref;
  if (!l.length) return null;
  return l.includes(pref) ? pref : l.includes("saw") ? "saw" : l[0];
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
/* Ertrag je Werkzeug: je größer der Baum, desto mehr Stämme; die Kettensäge
   bringt einen Stamm mehr und Holzreste, die Profi-Säge noch einen */
function treeHaul(t, tool) {
  const Z = FTREE_SIZE[t.sz] || FTREE_SIZE[1], T = S.farm.tools, saw = tool === "saw", pro = saw && (T.saw || 0) >= 2;
  return { log: FSPECIES[t.sp].log, logs: Z.logs + (saw ? 1 : 0) + (pro ? 1 : 0), aeste: Z.aeste, reste: saw ? Math.max(1, Math.round(t.sz / 2)) + (pro ? 1 : 0) : 0, saw, pro };
}
/* Gefällt: res = { acc: 0…1, tool: "axe"|"saw", dirOk } */
function farmFell(t, res) {
  if (!t || t.st !== "up") return null;
  const F = S.farm, sp = FSPECIES[t.sp];
  const acc = clamp(res.acc || 0, 0, 1);
  const H = treeHaul(t, res.tool), saw = H.saw;
  /* sauber gearbeitet (Volltreffer, perfekter Kerb): ein Stamm extra */
  const perfect = acc > 0.85;
  let logs = H.logs + (perfect ? 1 : 0), crew = false;
  if (staffPerk("holzfaeller") && Math.random() < staffPerk("holzfaeller") * 3) { logs++; crew = true; }
  let aeste = H.aeste, reste = H.reste;
  let q = clamp(2 + acc * 3 + (saw && res.dirOk ? 0.3 : 0) - (saw && res.hung ? 0.8 : 0), 1, 5);
  const got = [], lost = [];
  /* was nicht mehr in den Holzplatz passt, wird ehrlich als „liegen gelassen“ gemeldet */
  const give = (id, n, qq) => {
    const room = farmRoom(id), k = Math.min(n, room);
    if (k > 0) { farmAdd(id, k, qq); got.push({ id, n: k, q: qq, xp: FITEMS[id].xp * k }); }
    if (k < n) lost.push({ id, n: n - k });
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
  return { got, lost, xp, q, logs, perfect, crew, haul: H };
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

/* ------------------------- Photovoltaik (Döring GmbH) ---------------------- */
function pvS() { const F = S.farm; if (!F) return null; return F.pv || (F.pv = { n: 0, visit: null, next: 0 }); }
function pvN() { const P = S.farm && S.farm.pv; return P ? P.n || 0 : 0; }
function pvFull() { return pvN() >= FPV.max; }
/* v53: Sonnenstrom gibt es nur bei Tag – nachts muss der Kessel ran (das übernimmt der Mechaniker) */
function pvSun() { return pvFull() && farmTod() !== "nacht"; }
function pvVisit() { const P = S.farm && S.farm.pv, v = P && P.visit; return v && S.time < v.until ? v : null; }
/* kommt, sobald das Sägewerk ein heiles Dach hat und Level 15 erreicht ist */
function pvCanCome() { const F = S.farm; return flv() >= FPV.lv && farmAreaOpen("saege") && !!(F.saw && F.saw.dach) && !pvFull(); }
function pvTick() {
  const F = S.farm, P = pvS();
  if (!P) return;
  /* Sonnenstrom: tagsüber je Modul ein paar kWh, mit vollem Dach immer genug */
  const t0 = P.t == null ? S.time : P.t;
  P.t = S.time;
  if (pvSun()) F.en = farmEnCap();
  else if (P.n && S.time > t0 && farmTod() !== "nacht") F.en = Math.min(farmEnCap(), (F.en || 0) + P.n * FPV.kwh * (S.time - t0) / 60);
  /* Besuch: 48 Stunden, danach eine Woche Pause */
  if (P.visit && S.time >= P.visit.until) {
    P.visit = null;
    P.next = Math.floor(S.time / 1440) + FPV.again;
    if (typeof farmPvView === "function") farmPvView("gone");
  }
  if (!P.visit && !(F.tut && !F.tut.done) && pvCanCome() && Math.floor(S.time / 1440) >= (P.next || 0)) {
    P.visit = { t0: S.time, until: S.time + FPV.stay };
    if (typeof phoneMsg === "function") phoneMsg({ from: FPV.firm, kind: "info", title: "Solarstrom fürs Sägewerk", go: "pv", goLabel: "Zum Montagewagen",
      body: "Moin! Wir stehen 48 Stunden mit dem Montagewagen am Sägewerk. Pro Modul " + FPV.price + " € – tagsüber laufen Kessel und Säge mit Sonnenstrom, nachts hilft der Kessel. Gruß, " + FPV.who });
    if (typeof farmPvView === "function") farmPvView("start");
  }
}
function pvBuy(k) {
  const P = pvS();
  k = Math.min(k || 1, FPV.max - P.n);
  if (!pvVisit() || k < 1) return 0;
  const cost = k * FPV.price;
  if (S.money < cost) { toast("Dafür fehlen " + eur(cost - S.money) + ".", "warn"); return 0; }
  S.money -= cost; S.expense += cost;
  logMoney("farm", "Photovoltaik · " + k + (k === 1 ? " Modul" : " Module"), -cost);
  P.n += k;
  farmXP(4 * k);
  farmEvent("pv", k);
  if (pvFull()) {
    S.farm.en = farmEnCap();
    farmEvent("pv:full");
    /* fertig montiert – Döring steigt ein und fährt davon (er kommt nicht wieder) */
    P.visit = null; P.leftAt = S.time; P.next = 1e9;
    if (typeof phoneMsg === "function") phoneMsg({ from: FPV.firm, kind: "good", title: "Alle Module montiert",
      body: "Moin! Ihr Hallendach ist voll – " + FPV.max + " Module, sauber in Reih und Glied. Kessel und Säge laufen jetzt mit Sonnenstrom. Danke für den Auftrag! Gruß, " + FPV.who });
  }
  return k;
}
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
  let x = Math.round(p[0] - w / 2 + FG / 2), z = Math.round(p[1] - d / 2 + FG / 2);
  /* v53: steht da schon etwas (verschoben), dann daneben */
  if (!farmFits(x, z, w, d, null, t)) { const q = farmZoneSpot("yard", w, d, x + w / 2, z + d / 2, t); if (q) [x, z] = q; }
  const o = farmAddObj({ t, x, z, r: 0, area: "saege", q: [], done: [], slots: 2 });
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
/* v53: Bestelltafeln am Sägewerk (am Tor im Hof) und an der Fischerei (am Uferweg) */
const FBOARDS = { saege: { x: -33, z: -22 }, see: { x: 6, z: 20 } };
function farmBoardsCheck() {
  const F = S.farm;
  if (!F || !F.areas || (typeof FSITE !== "undefined" && FSITE.kind !== "hof")) return;
  for (const a in FBOARDS) {
    if (!farmAreaOpen(a) || F.objs.some(o => o.t === "board" && o.k === a)) continue;
    farmAddObj({ t: "board", k: a, area: a, x: FBOARDS[a].x + FG / 2, z: FBOARDS[a].z + FG / 2, r: 0, fix: a === "see" || undefined });
    if (typeof FV !== "undefined" && FV.on && typeof farmSyncScene === "function") try { farmSyncScene(); } catch (e) { /* egal */ }
  }
}

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
  /* mit dem Steg beginnt das Angeln: Lehmanns alte Angel, erste Reuse, Lina meldet sich */
  if (t === "f_steg") angelInit(F);
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
/* Auswerfen: kostet einen Wurf des gewählten Köders (Angel gibt es ab dem Steg) */
function farmCast(gid) {
  const U = angelS();
  if (!U || !angelBaitUse(U.bait)) return false;
  S.farm.stats.casts = (S.farm.stats.casts || 0) + 1;
  return true;
}
/* Was hängt am Haken? Beim Biss gewürfelt: Art, Länge, Gewicht, Sterne –
   daraus ergibt sich, wie schwer der Drill im Kreis wird */
function farmRollCatch(gid) {
  if (Math.random() < 0.07) return { junk: farmWPick(FJUNK_FISH, x => x.w) };
  return angelRoll(gid);
}
/* Fang: pre = Ergebnis von farmRollCatch. Die Sterne kommen aus dem Fisch
   selbst (Größe und Kondition), nicht aus dem Drill. */
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
  q = pre.cm ? specQ(pre) : clamp(Math.round(q || 3), 1, 5);
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
  const r = { id, n: 1, q, xp };
  if (pre.cm) Object.assign(r, angelLog(id, pre, q, gid));
  return r;
}
/* Fanggründe, die man gerade erreicht */
function farmGroundOk(g) { return g.boat === 0 ? !!farmObj1("f_steg") : (S.farm.boat || 0) >= g.boat; }

/* --------------------------------- Angeln ---------------------------------
   Ab dem Steg: Lehmanns alte Angel, Köder (Mais, Berts Würmer, Profi-Köder)
   und bessere Ruten bestimmen, welche Klasse beißt; jeder Fang hat Länge,
   Gewicht und Sterne. Dazu Bert Flomann, das Angler-Turnier und die Reusen. */
function angelS() { return S.farm && S.farm.angel || null; }
/* Kachel für eine Weltmitte (wie die Bauplätze am See) */
function angelTile(wx, wz, w, d) { return [Math.round(wx - w / 2 + FG / 2), Math.round(wz - d / 2 + FG / 2)]; }
/* Zustand, Lehmanns alte Angel und die erste Reuse; Lina meldet sich einmal */
function angelInit(F) {
  const U = F.angel || (F.angel = {});
  U.rod = U.rod || 1;
  if (!FBAITS[U.bait]) U.bait = "mais";
  U.mais = U.mais || 0;
  U.potLvl = U.potLvl || 1;
  U.tour = U.tour || { done: false };
  /* Turnier aus dem ersten Testbuild: Ergebnis lag im Spielstand – weg damit */
  if ((U.tour.v || 0) < 3) { delete U.tour.res; U.tour.v = 3; }
  U.bert = U.bert || { met: false, lureQ: null, call: false };
  U.log = U.log || [];
  U.best = U.best || {};
  U.cnt = U.cnt || { klein: 0, mittel: 0, gross: 0 };
  /* Reusen liegen an festen Plätzen neben dem Steg */
  F.objs.filter(o => o.t === "pot" && o.area === "see").forEach((o, i) => {
    const p = FANGEL.potSpots[i];
    if (p) [o.x, o.z] = angelTile(p[0], p[1], 2, 2);
  });
  if (!angelPots().length) angelPotPlace(0);
  if (!U.linaMsg && typeof phoneMsg === "function") {
    U.linaMsg = true;
    phoneMsg({ from: "Lina Sturm", kind: "info", title: "Lehmanns alte Angel",
      body: "Chef, der Steg steht! Der alte Lehmann hat dir seine Angel dagelassen – sie liegt am Steg. Die Weißfische beißen auf Mais aus deinem Silo. Tipp einfach auf den Steg." });
  }
}
function angelPots() { return S.farm.objs.filter(o => o.t === "pot" && o.area === "see"); }
function angelPotPlace(i) {
  const p = FANGEL.potSpots[i], [x, z] = angelTile(p[0], p[1], 2, 2);
  return farmAddObj({ t: "pot", kind: null, x, z, r: 0, area: "see" });
}
/* weitere Reuse an den nächsten Platz */
function angelPotBuy() {
  const i = angelPots().length, cost = FANGEL.potCost[i];
  if (cost == null || i >= FANGEL.potSpots.length) return false;
  if (S.money < cost) return toast("Dafür fehlen " + eur(cost - S.money) + ".", "warn"), false;
  S.money -= cost; S.expense += cost;
  logMoney("farm", "Reuse am Steg", -cost);
  angelPotPlace(i);
  farmXP(10);
  farmEvent("buy:pot");
  return true;
}
/* Reusen eine Stufe besser: mehr Arten, größere Tiere */
function angelPotUp() {
  const U = angelS(), N0 = U && FPOT_UP[U.potLvl + 1];
  if (!N0) return false;
  if (flv() < N0.lv) return toast("Erst ab Level " + N0.lv + ".", "warn"), false;
  if (S.money < N0.cost) return toast("Dafür fehlen " + eur(N0.cost - S.money) + ".", "warn"), false;
  S.money -= N0.cost; S.expense += N0.cost;
  logMoney("farm", "Reusen Stufe " + (U.potLvl + 1), -N0.cost);
  U.potLvl++;
  farmXP(20);
  farmEvent("upgrade:pot");
  return true;
}
function farmBuyRod(n) {
  const U = angelS(), R = FRODS[n];
  if (!U || !R || U.rod >= n) return false;
  if (U.rod < n - 1) return toast("Erst die " + FRODS[n - 1].n + ".", "warn"), false;
  if (flv() < R.lv) return toast("Erst ab Level " + R.lv + ".", "warn"), false;
  if (S.money < R.price) return toast("Dafür fehlen " + eur(R.price - S.money) + ".", "warn"), false;
  S.money -= R.price; S.expense += R.price;
  logMoney("farm", R.n + " gekauft", -R.price);
  U.rod = n;
  farmXP(30);
  farmEvent("buy:rod");
  return true;
}
/* Köder: wie viele Würfe, und warum gerade keiner geht */
function angelBaitN(b) {
  const B = FBAITS[b], U = angelS();
  return b === "mais" ? (U.mais || 0) + farmInv("mais") * B.per : farmInv(B.item);
}
function angelBaitWhy(b) {
  const B = FBAITS[b], U = angelS();
  if (B.tour && !U.tour.done) return "nach dem Turnier";
  if (B.rod && U.rod < B.rod) return "braucht die " + FRODS[B.rod].n;
  if (angelBaitN(b) > 0) return "";
  return b === "mais" ? "kein Mais im Silo" : b === "wurm" ? "bei Bert holen" : "bei Bert bestellen";
}
/* Ein Sack Mais reicht für zehn Würfe */
function angelBaitUse(b) {
  const B = FBAITS[b], U = angelS();
  if (angelBaitWhy(b)) return false;
  if (b !== "mais") return farmTake(B.item, 1);
  if (U.mais > 0) { U.mais--; return true; }
  if (!farmTake("mais", 1)) return false;
  U.mais = B.per - 1;
  return true;
}
/* Rute und Köder gemeinsam: Grundgewichte des Köders, die Rute schiebt
   Gewicht zur größten erlaubten Klasse. Nicht erlaubte Klassen bleiben 0. */
function angelClassW(bait, rod) {
  const w = Object.assign({}, FBAITS[bait].mix), R = FRODS[rod] || FRODS[1];
  const ks = FCLS.filter(c => w[c] > 0);
  if (ks.length > 1 && R.shift) {
    const top = ks[ks.length - 1], rest = ks.slice(0, -1), sum = rest.reduce((s, c) => s + w[c], 0);
    rest.forEach(c => { const cut = Math.min(w[c] - 0.1, R.shift * w[c] / sum); w[c] -= cut; w[top] += cut; });
  }
  return w;
}
/* Wer beißt hier – nach Klasse, dann nach Fanggrund × Tageszeit × Wetter.
   Hat ein Fanggrund keine Art einer Klasse, rückt die nächstkleinere nach. */
function angelOdds(gid, bait, rod) {
  const U = angelS(), odds = farmFishOdds(gid), w = angelClassW(bait || U.bait, rod || U.rod), out = {};
  let carry = 0;
  FCLS.slice().reverse().forEach(c => {
    const ids = Object.keys(odds).filter(id => FFISH[id].cls === c), sum = ids.reduce((s, id) => s + odds[id], 0);
    const wc = (w[c] || 0) + carry;
    if (!wc) return;
    if (!sum) { carry = wc; return; }
    carry = 0;
    ids.forEach(id => { out[id] = wc * odds[id] / sum; });
  });
  return out;
}
function angelRoll(gid, rng) {
  const U = angelS(), o = angelOdds(gid);
  const id = farmWPick(Object.keys(o), x => o[x], rng);
  return Object.assign({ id }, specRoll(FFISH[id], FRODS[U.rod].size + FBAITS[U.bait].size, rng));
}
/* Länge in den Grenzen der Art (bonus schiebt nach oben), Kondition ±15 %,
   Gewicht daraus. r = Größe 0 … 1 innerhalb der Art. */
function specRoll(D, bonus, rng) {
  rng = rng || Math.random;
  const r = 1 - Math.pow(1 - rng(), 1 + 2 * (bonus || 0));
  const cm = Math.round((D.cm[0] + (D.cm[1] - D.cm[0]) * r) * 10) / 10;
  const cond = 0.85 + rng() * 0.3;
  const base = D.k != null ? D.k * Math.pow(cm / 100, 3) : D.kg[0] + (D.kg[1] - D.kg[0]) * r;
  return { cm, kg: Math.round(base * cond * 1000) / 1000, r, cond };
}
/* Sterne: beim Angeln Größe (75 %) und Kondition (25 %); bei Reusen zählt
   die Köderqualität mit (bait 0 … 1: 60 % Größe, 20 % Kondition, 20 % Köder) */
function specQ(s, bait) {
  const c = (s.cond - 0.85) / 0.3;
  const score = bait == null ? 0.75 * s.r + 0.25 * c : 0.6 * s.r + 0.2 * c + 0.2 * clamp(bait, 0, 1);
  return 1 + FQCUT.filter(x => score >= x).length;
}
/* Wert eines einzelnen Fangs beim Händler (voller Preis, Sterne ±15 %) */
function specValue(id, q) { return Math.round(FITEMS[id].v * (1 + (q - 3) * 0.15) * 100) / 100; }
/* Fangbuch: die letzten 50 Fänge, Rekord je Art (nach Gewicht); gid = Angeln */
function angelLog(id, s, q, gid) {
  const U = angelS(), e = { sp: id, cm: s.cm, kg: s.kg, q, gid, t: S.time };
  U.log.unshift(e);
  if (U.log.length > 50) U.log.length = 50;
  const b = U.best[id], rec = !b || s.kg > b.kg;
  if (rec) U.best[id] = { cm: s.cm, kg: s.kg, q, t: S.time };
  const c = FFISH[id] && FFISH[id].cls;
  if (c && gid) U.cnt[c] = (U.cnt[c] || 0) + 1;
  return { cm: s.cm, kg: s.kg, val: specValue(id, q), rec };
}
/* Schwierigkeit im Kreis (0 … 1): Kampfkraft der Art, Größe, Sterne */
function angelDiff(c) {
  if (!c || !c.id || !FFISH[c.id]) return FRING.junkD;
  return clamp(0.5 * FFISH[c.id].fight + 0.3 * (c.r || 0) + 0.2 * (specQ(c) - 1) / 4, 0, 1);
}

/* ------------------------------ Bert Flomann ------------------------------ */
function bertLureOk() {
  const U = angelS();
  return !!(U && U.tour.done && U.rod >= FBERT.lureNeed.rod && U.cnt.mittel >= FBERT.lureNeed.mittel);
}
function bertWorms() {
  const U = angelS(), W = FBERT.worms;
  if (!U || !U.tour.done) return false;
  if (farmRoom("wurm") < W.n) return farmFull("fisch"), false;
  if (S.money < W.price) return toast("Dafür fehlen " + eur(W.price - S.money) + ".", "warn"), false;
  S.money -= W.price; S.expense += W.price;
  logMoney("farm", "Tauwürmer von Bert", -W.price);
  farmAdd("wurm", W.n, 3);
  return true;
}
function bertOrderLures() {
  const U = angelS(), L = FBERT.lures;
  if (!bertLureOk() || U.bert.lureQ) return false;
  if (S.money < L.price) return toast("Dafür fehlen " + eur(L.price - S.money) + ".", "warn"), false;
  S.money -= L.price; S.expense += L.price;
  logMoney("farm", "Profi-Köder bei Bert bestellt", -L.price);
  U.bert.lureQ = { n: L.n, end: S.time + L.t };
  return true;
}
function bertCollect() {
  const U = angelS(), Q = U && U.bert.lureQ;
  if (!Q || S.time < Q.end) return false;
  if (farmRoom("profikoeder") < Q.n) return farmFull("fisch"), false;
  farmAdd("profikoeder", Q.n, 3);
  U.bert.lureQ = null;
  return true;
}
/* im Takt: Bert meldet sich einmal, wenn er Profi-Köder baut */
function angelTick() {
  const U = angelS();
  if (!U || !bertLureOk() || U.bert.call) return;
  U.bert.call = true;
  if (typeof phoneMsg === "function") phoneMsg({ from: "Bert Flomann", kind: "info", title: "Neue Köder aus der Werkstatt",
    body: "Moin! Du holst ja ordentlich Barsche raus. Ich hab in der Garage was gebastelt: Profi-Köder für die richtig Großen – Hecht und Wels. Mit der Raubfischrute hält das auch. Bestell sie bei mir am Steg, in zwei Stunden sind sie fertig." });
}

/* ------------------------------ Angler-Turnier ----------------------------
   Fünf Angler, alle nach derselben Logik. Erst wird gewertet, dann wird die
   Gewinnerrolle intern festgelegt: Der Turniersieger (FTOUR_WINNER) erhält die
   beste Ergebnisliste, deren bisheriger Besitzer seine. Gespeichert wird nur
   der Seed – das Ergebnis lässt sich daraus jederzeit gleich berechnen. */
function tourCanStart() { const U = angelS(); return !!(U && !U.tour.done && U.cnt.klein >= FTOUR.need); }
function tourCost() { return FTOUR.cost + FTOUR.prize; }
/* ein Angler: 3–7 Fänge, meist kleine Fische, verteilt über 26 Minuten */
function tourAngler(rng) {
  const G = FGROUNDS.find(g => g.id === "steg");
  const ids = c => Object.keys(G.fish).filter(id => FFISH[id].cls === c && id !== "schleie");
  const n = 3 + Math.floor(rng() * 5), out = [];
  for (let i = 0; i < n; i++) {
    const sp = farmWPick(ids(rng() < 0.7 ? "klein" : "mittel"), x => G.fish[x], rng);
    out.push(Object.assign({ sp, t: 1 + Math.floor(rng() * FTOUR.mins) }, specRoll(FFISH[sp], 0.2, rng)));
  }
  out.sort((a, b) => a.t - b.t);
  const total = Math.round(out.reduce((s, f) => s + f.kg, 0) * 1000) / 1000;
  return { catches: out, total, top: Math.max(...out.map(f => f.kg)), last: out[out.length - 1].t };
}
/* Wertung: Gesamtgewicht, dann größter Fisch, dann früherer letzter Fang,
   zuletzt die Reihenfolge der ersten Wertung (r) – damit ist sie strikt */
function tourRank(a, b) { return b.total - a.total || b.top - a.top || a.last - b.last || a.r - b.r; }
function tourRoll(seed) {
  const rng = erbeRng(seed);
  const lists = FTOUR.members.map(() => tourAngler(rng));
  lists.slice().sort((a, b) => b.total - a.total || b.top - a.top || a.last - b.last).forEach((l, i) => { l.r = i; });
  /* Gewinnerrolle festlegen: beste Liste und Liste des Siegers tauschen */
  const w = FTOUR.members.findIndex(m => m.n === FTOUR_WINNER), b = lists.findIndex(l => l.r === 0);
  if (w >= 0 && b !== w) [lists[w], lists[b]] = [lists[b], lists[w]];
  const res = FTOUR.members.map((m, i) => Object.assign({ n: m.n, ini: m.ini, from: m.from, about: m.about }, lists[i]));
  /* Startreihenfolge (Anzeige bei Gleichstand) wird gelost – unabhängig vom Ergebnis */
  const r2 = erbeRng(seed + 7919);
  res.map(p => [p, r2()]).sort((a, b) => a[1] - b[1]).forEach(([p], i) => { p.ord = i; });
  console.assert(res.slice().sort(tourRank)[0].n === FTOUR_WINNER, "Turnier: Sieger falsch");
  return res;
}
/* Turnier veranstalten: 100 € Veranstaltung + 200 € Preisgeld, genau einmal */
function tourStart() {
  const U = angelS();
  if (!tourCanStart()) return null;
  if (!U.tour.paid) {
    const c = tourCost();
    if (S.money < c) { toast("Für das Turnier fehlen " + eur(c - S.money) + ".", "warn"); return null; }
    S.money -= c; S.expense += c;
    logMoney("farm", "Angler-Turnier: Veranstaltung", -FTOUR.cost);
    logMoney("farm", "Angler-Turnier: Preisgeld für den Sieger", -FTOUR.prize);
    U.tour.paid = true;
    U.tour.seed = 1 + Math.floor(Math.random() * 2e9);
    save();
  }
  return tourRoll(U.tour.seed);
}
function tourResult() { const U = angelS(); return U && U.tour.paid ? tourRoll(U.tour.seed) : null; }
/* Siegerehrung: kein Geld mehr (ist beim Start bezahlt), EP und Bert – einmalig */
function tourFinish() {
  const U = angelS();
  if (!U || U.tour.done || !U.tour.paid) return false;
  U.tour.done = true;
  U.bert.met = true;
  farmXP(FTOUR.xp);
  farmEvent("tour");
  if (typeof phoneMsg === "function") phoneMsg({ from: "Bert Flomann", kind: "info", title: "Petri Heil!",
    body: "Moin! Schönes Turnier war das. Wie versprochen: Für ein kleines Entgelt sammel ich dir Tauwürmer aus meinem Wurmkasten – damit beißen Barsche, Forellen und Karpfen. Komm einfach an den Steg." });
  return true;
}

/* ------------------------------- Reusen ----------------------------------- */
/* Wunschziel freigeschaltet? Level und Reusenstufe */
function farmPotOk(id) { const U = angelS(); return !!(FPOTS[id] && FPOTS[id].lv <= flv() && U && U.potLvl >= FPOTS[id].tier); }

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
/* Bebaubare Fläche: jede Ausbaustufe eine Kachel mehr nach jeder Seite –
   26 × 26, 28 × 28, 30 × 30 und am Ende das ganze Gelände mit 32 × 32 Kacheln.
   (Weiter geht es nicht: Teich im Osten, Straße im Süden, Wald im Norden und Westen.) */
const FHOF_R = [13, 13, 14, 15, 16];
function farmHofR() { return FHOF_R[Math.min(4, (S.farm && S.farm.stage) || 1)]; }
function farmBoundsUpdate() {
  const r = farmHofR();
  FIN0 = FG / 2 - r; FIN1 = FG / 2 + r;
  /* das Feldgehölz im Osten rückt ein Stück vom neuen Zaun weg – und bleibt trotzdem vom Teich weg */
  const MOVE = [[17.4, -11, 18.3, -11], [16.4, -8.9, 18.2, 14.2], [17.6, 6.5, 18.4, 6.5]];
  if (S.farm && S.farm.trees) S.farm.trees.forEach(t => {
    if (t.area || t.x <= 15 || t.x >= 17.8 || Math.abs(t.z) >= 17) return;
    const m = MOVE.find(m => Math.abs(t.x - m[0]) < 0.05 && Math.abs(t.z - m[1]) < 0.05);
    if (m) { t.x = m[2]; t.z = m[3]; return; }
    t.x = +(17.8 + Math.max(0, t.x - 16.4) * 0.5).toFixed(2);
    const P = FWORLD.pond, safe = P.r * 1.3 + 1.2, dx = t.x - P.x;
    if (Math.hypot(dx, t.z - P.z) < safe) t.z = +(P.z + Math.sign(t.z - P.z || -1) * Math.sqrt(Math.max(0, safe * safe - dx * dx))).toFixed(2);
  });
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

/* Mitarbeiter: siehe team.js (Personal je Station, arbeitet von allein) */

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
  if (k === "hirsch") {
    const cl = FWORLD.clearings.filter(q => (q[0] > -58 || q[1] > -58) || farmAreaOpen("altwald"));
    const q = pick(cl);
    c.data.x = q[0] + (Math.random() - 0.5) * 3; c.data.z = q[1] + (Math.random() - 0.5) * 3;
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
  return r;
}

/* ------------------------------ Schatzkisten -----------------------------
   Alle drei Spieltage liegt irgendwo im offenen Gelände eine Kiste
   vergraben: ein Kreuz im Boden, darüber kreist ein Vogelschwarm. Sie ist
   drei Stunden lang zu finden (Start zwischen 7 und 15 Uhr), dann ziehen
   die Vögel weiter. Ausgraben ist ein Minispiel – drin sind Geld und ein
   Kleeblatt. */
const FTREASURE = { every: 3, dur: 180, from: 7, to: 15 };
const FTREASURE_ZONES = [
  { id: "teich",   area: null,      n: "über der Wiese am Teich",     box: [17.5, -14.5, 29, 14], at: [-1, 0] },
  { id: "see",     area: "see",     n: "über dem Seeufer",            box: [-22, 23.5, 42, 33],     at: [12, 30] },
  { id: "wald",    area: "wald",    n: "über einer Lichtung im Wald", clear: true,                  at: [-22, -44] },
  { id: "altwald", area: "altwald", n: "über dem Alten Wald",         clear: true,                  at: [-66, -72] }
];
function farmTreasureCur() { const T = S.farm && S.farm.tr, c = T && T.cur; return c && S.time < c.until ? c : null; }
/* Platz frei? Kein Wasser, kein Weg, kein Baum, kein Gebäude, kein Feld */
function treasureSpotOk(x, z, area) {
  const F = S.farm, P = FWORLD.pond, L = FWORLD.lake;
  if (areaOfPoint(x, z) !== area) return false;
  /* nur dort, wo die Kamera auch hinkommt */
  const cr = farmCamRect();
  if (x < cr[0] + 1 || x > cr[2] - 1 || z < cr[1] + 1 || z > cr[3] + 6) return false;
  if (Math.abs(x) < 17 && Math.abs(z) < 17) return false;
  if (Math.hypot(x - P.x, z - P.z) < P.r + 3) return false;
  if (Math.hypot((x - L.x) / L.rx, (z - L.z) / L.rz) < 1.15) return false;
  if (nearPath(x, z) < 1.8 || distLine(x, z, FWORLD.creek) < 3) return false;
  if (inYard(x, z, 2)) return false;
  if (x > -37 && x < -21 && z > -13 && z < 5) return false;          /* Nachbars Feld im Westen */
  if (x > 33.5 && x < 46.5 && z > -11 && z < 7) return false;        /* und im Osten */
  if (F.trees.some(t => Math.hypot(t.x - x, t.z - z) < 2.4)) return false;
  for (const o of F.objs) {
    const [cx, cz] = farmCenter(o), [w, d] = farmSize(o);
    if (Math.abs(cx - x) < w / 2 + 1.6 && Math.abs(cz - z) < d / 2 + 1.6) return false;
  }
  if (typeof FFISHERY !== "undefined") for (const k in FFISHERY) {
    const f = FFISHERY[k];
    if (Math.abs(f.x - x) < f.sz[0] / 2 + 2 && Math.abs(f.z - z) < f.sz[1] / 2 + 2) return false;
  }
  const c = F.ev && F.ev.cur;
  if (c && c.data && c.data.x != null && Math.hypot(c.data.x - x, c.data.z - z) < 4) return false;
  return true;
}
function farmTreasureSpot() {
  const T = S.farm.tr;
  let zones = FTREASURE_ZONES.filter(Z => !Z.area || farmAreaOpen(Z.area));
  if (zones.length > 1 && T.zone) zones = zones.filter(Z => Z.id !== T.zone);      /* nicht zweimal am selben Ort */
  while (zones.length) {
    const Z = zones.splice(Math.floor(Math.random() * zones.length), 1)[0];
    const cl = Z.clear ? FWORLD.clearings.filter(c => areaOfPoint(c[0], c[1]) === Z.area) : null;
    for (let i = 0; i < 90; i++) {
      let x, z;
      /* Lichtung: in der hinteren (nordwestlichen) Hälfte – die Kamera schaut von Südosten, vorne verdecken die Randbäume das Kreuz */
      if (cl) { const c = pick(cl), a = Math.PI * (0.9 + Math.random() * 0.7), r = Math.sqrt(Math.random()) * (c[2] - 1.2); x = c[0] + Math.cos(a) * r; z = c[1] + Math.sin(a) * r; }
      else { const b = Z.box; x = b[0] + Math.random() * (b[2] - b[0]); z = b[1] + Math.random() * (b[3] - b[1]); }
      if (treasureSpotOk(x, z, Z.area)) return { x: +x.toFixed(2), z: +z.toFixed(2), zone: Z.id };
    }
  }
  return null;
}
/* Startzeit am Tag d: zufällig zwischen 7 und 15 Uhr */
function farmTreasurePlan(d) { return d * 1440 + FTREASURE.from * 60 + Math.floor(Math.random() * (FTREASURE.to - FTREASURE.from) * 60); }
function farmTreasureTick() {
  const F = S.farm, T = F.tr;
  if (!T || (F.tut && !F.tut.done)) return;
  if (T.cur) {
    if (S.time < T.cur.until) return;
    const c = T.cur;
    T.cur = null;
    if (!c.done && typeof farmTreasureView === "function") farmTreasureView("gone", c);
    else if (typeof farmTreasureView === "function") farmTreasureView("clear", c);
    return;
  }
  const d = Math.floor(S.time / 1440);
  if (d < T.next) return;
  if (!T.plan || T.plan < d * 1440) {
    let p = farmTreasurePlan(d);
    if (S.time > d * 1440 + FTREASURE.to * 60) p = farmTreasurePlan(d + 1);          /* heute zu spät → morgen */
    else if (p < S.time) p = S.time + 5 + Math.floor(Math.random() * 25);
    T.plan = p;
  }
  if (S.time < T.plan) return;
  const sp = farmTreasureSpot();
  if (!sp) { T.plan = S.time + 30; return; }
  T.cur = { t0: S.time, until: S.time + FTREASURE.dur, x: sp.x, z: sp.z, zone: sp.zone, done: false };
  T.zone = sp.zone; T.plan = 0; T.next = d + FTREASURE.every;
  if (typeof farmTreasureView === "function") farmTreasureView("start", T.cur);
}
/* Ausgegraben: Münzen (je nach Level, gut gegraben gibt mehr) und ein Kleeblatt */
function farmTreasureDig(score) {
  const F = S.farm, c = farmTreasureCur();
  if (!c || c.done) return null;
  c.done = true;
  c.until = Math.min(c.until, S.time + 30);                                           /* das offene Loch bleibt noch kurz */
  const k = 0.8 + Math.random() * 0.25 + clamp(score == null ? 0.6 : score, 0, 1) * 0.3;
  const m = Math.max(50, Math.round((80 + flv() * 15) * k / 5) * 5);
  S.money += m; S.revenue += m; F.stats.earned = (F.stats.earned || 0) + m;
  logMoney("farm", "Schatzkiste", m);
  farmClover(1, "Schatzkiste");
  farmXP(20);
  F.tr.found = (F.tr.found || 0) + 1;
  F.stats.events++;
  return { m, clover: 1, xp: 20 };
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
  farmTreasureTick();
  pvTick();
  staffWork();
  if (typeof staffGroupCheck === "function") staffGroupCheck();
  stallTick(false, dt || 1);
  stallTick(true, dt || 1);
  angelTick();
  const day = staffDay();
  if (F.day == null) F.day = day;
  if (day > F.day) { F.day = day; staffDaily(); }
}
