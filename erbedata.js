/* =========================================================================
   LOGISTIKA – erbedata.js
   Die große Welt rund um Opas Hof: Wald im Norden und Westen (Plötziner
   Forst), das alte Sägewerk von Nachbar Krüger, der alte Wald hinter dem
   Bach und der Glindower See im Süden. Hier stehen die Tabellen: Holz und
   Holzwaren, Baumarten, Werkzeug, Ausdauer, Sägewerk mit Reparaturen und
   Maschinen, Gebiete und Freischaltungen, Hof-Ausbaustufen, Mitarbeiter,
   Ereignisse, Kosmetik-Shop, Verkaufsstand und die Kapitel im Notizbuch.
   Die Fischerei am See steht in fishdata.js.
   Welt: 1 Einheit = 1 Kachel (~2 m), Hofmitte = (0, 0), Norden = −z.
   ========================================================================= */

/* ------------------------------ Holz -------------------------------------
   raw = Rohholz (der Holzhändler zahlt dafür den vollen Preis). */
Object.assign(FITEMS, {
  birke:     { n: "Birkenstämme",  sg: "Birkenstamm",  i: "🌳", k: "holz",  a: 1,  u: "",       pk: "Stamm",   v: 16,  kg: 220, xp: 3,  st: "holz", raw: true },
  kiefer:    { n: "Kiefernstämme", sg: "Kiefernstamm", i: "🌲", k: "holz",  a: 1,  u: "",       pk: "Stamm",   v: 20,  kg: 280, xp: 3,  st: "holz", raw: true },
  buche:     { n: "Buchenstämme",  sg: "Buchenstamm",  i: "🍂", k: "holz",  a: 1,  u: "",       pk: "Stamm",   v: 38,  kg: 420, xp: 6,  st: "holz", raw: true },
  eiche:     { n: "Eichenstämme",  sg: "Eichenstamm",  i: "🌰", k: "holz",  a: 1,  u: "",       pk: "Stamm",   v: 60,  kg: 480, xp: 9,  st: "holz", raw: true },
  edelholz:  { n: "Edelholzstämme", sg: "Edelholzstamm", i: "💎", k: "holz", a: 1, u: "",       pk: "Stamm",   v: 130, kg: 260, xp: 18, st: "holz", raw: true },
  aeste:     { n: "Äste",          i: "🥢", k: "holz",  a: 1,  u: "Bündel", pk: "Bündel",  v: 1.5, kg: 12,  xp: 1,  st: "holz", raw: true },
  reste:     { n: "Holzreste",     i: "🪹", k: "holz",  a: 10, u: "kg",     pk: "Sack",    v: 1.2, kg: 10,  xp: 1,  st: "holz", raw: true },
  brennholz: { n: "Brennholz",     i: "🔥", k: "wood",  a: 15, u: "kg",     pk: "Sack",    v: 6,   kg: 15,  xp: 3,  st: "holz" },
  kaminholz: { n: "Kaminholz (Buche)", i: "♨️", k: "wood", a: 10, u: "kg",  pk: "Netz",    v: 9,   kg: 10,  xp: 5,  st: "holz" },
  pfosten:   { n: "Holzpfosten",   sg: "Holzpfosten",  i: "🪧", k: "wood",  a: 4,  u: "",       pk: "Bund",    v: 24,  kg: 32,  xp: 5,  st: "holz" },
  bretter:   { n: "Bretter",       sg: "Brett",        i: "🪵", k: "wood",  a: 10, u: "",       pk: "Bund",    v: 42,  kg: 45,  xp: 6,  st: "holz" },
  balken:    { n: "Balken",        sg: "Balken",       i: "🏗️", k: "wood",  a: 2,  u: "",       pk: "Paar",    v: 48,  kg: 50,  xp: 7,  st: "holz" },
  platten:   { n: "Holzplatten",   sg: "Holzplatte",   i: "🟫", k: "wood",  a: 5,  u: "",       pk: "Stapel",  v: 36,  kg: 40,  xp: 7,  st: "holz" },
  kisten:    { n: "Holzkisten",    sg: "Holzkiste",    i: "📦", k: "wood",  a: 5,  u: "",       pk: "Stapel",  v: 20,  kg: 8,   xp: 4,  st: "holz" },
  paletten:  { n: "Europaletten",  sg: "Europalette",  i: "🗃️", k: "wood",  a: 3,  u: "",       pk: "Stapel",  v: 39,  kg: 75,  xp: 8,  st: "holz" },
  dielen:    { n: "Hobeldielen",   sg: "Hobeldiele",   i: "🛤️", k: "wood",  a: 8,  u: "",       pk: "Bund",    v: 68,  kg: 38,  xp: 10, st: "holz" },
  bauholz:   { n: "Kanthölzer (Bauholz)", sg: "Kantholz", i: "🏠", k: "wood", a: 2, u: "",      pk: "Paar",    v: 80,  kg: 44,  xp: 12, st: "holz" },
  bohlen:    { n: "Eichenbohlen",  sg: "Eichenbohle",  i: "🟤", k: "wood",  a: 2,  u: "",       pk: "Paar",    v: 75,  kg: 50,  xp: 12, st: "holz" },
  moebel:    { n: "Möbelteile (Buche)", sg: "Satz Möbelteile", i: "🪑", k: "wood", a: 1, u: "", pk: "Satz",    v: 85,  kg: 18,  xp: 16, st: "holz" },
  tueren:    { n: "Holztüren",     sg: "Holztür",      i: "🚪", k: "wood",  a: 1,  u: "",       pk: "Stück",   v: 140, kg: 28,  xp: 22, st: "holz" },
  zaun:      { n: "Zaunelemente",  sg: "Zaunelement",  i: "🚧", k: "wood",  a: 2,  u: "",       pk: "Paar",    v: 60,  kg: 30,  xp: 10, st: "holz" },
  schatulle: { n: "Edelholz-Schatullen", sg: "Edelholz-Schatulle", i: "🗝️", k: "wood", a: 1, u: "", pk: "Stück", v: 95, kg: 1.2, xp: 24, st: "holz" },
  pilze:     { n: "Waldpilze",     i: "🍄", k: "wild",  a: 0.5, u: "kg",    pk: "Korb",    v: 9,   kg: 0.6, xp: 4,  st: "barn" },
  /* Strom fürs Sägewerk: landet nicht im Lager, sondern im Kessel */
  strom:     { n: "Strom",         i: "⚡", k: "energy", a: 10, u: "kWh",   pk: "Ladung",  v: 0,   kg: 0,   xp: 1,  st: null, energy: 10 }
});

/* Lager für Holz: Holzplatz am Schuppen, später das Holzlager im Sägewerk */
Object.assign(FSTORE, {
  holz: { n: "Holzplatz", i: "🪵", the: "Der Holzplatz", base: 30, step: 25, cost: [120, 300, 600, 1000, 1600, 2400],
          empty: "Leer. Fäll Bäume mit der Axt – Stämme und Äste kommen hierher." }
});

/* -------------------------- Bäume im Wald -----------------------------
   Größe 1 klein · 2 mittel · 3 groß · 4 uralt. hp = Schläge bei „gut“,
   logs = Stämme, tool = was mindestens nötig ist (axe 1 Axt, axe 2
   Stahlaxt, saw 1 Kettensäge, saw 2 Profi-Säge). */
const FSPECIES = {
  birke:    { n: "Birke",      log: "birke",  max: 2, regrow: 1.0, col: "hell" },
  kiefer:   { n: "Kiefer",     log: "kiefer", max: 3, regrow: 1.2 },
  fichte:   { n: "Fichte",     log: "kiefer", max: 3, regrow: 1.2 },
  buche:    { n: "Buche",      log: "buche",  max: 3, regrow: 1.6 },
  eiche:    { n: "Eiche",      log: "eiche",  max: 4, regrow: 2.4 },
  kirsche:  { n: "Wildkirsche", log: "edelholz", max: 2, regrow: 2.8, rare: true }
};
const FTREE_SIZE = [
  null,
  { n: "klein",  hp: 6,  logs: 1, aeste: 1, tool: { axe: 1 },  sta: 1.0 },
  { n: "mittel", hp: 11, logs: 2, aeste: 2, tool: { axe: 1 },  sta: 1.2 },
  { n: "groß",   hp: 18, logs: 3, aeste: 3, tool: { axe: 2 },  sta: 1.5 },
  { n: "uralt",  hp: 34, logs: 6, aeste: 4, tool: { saw: 2 },  sta: 2.0 }
];
/* Eichen brauchen hartes Werkzeug: ab „mittel“ mindestens die Stahlaxt */
function treeNeeds(t) {
  const need = Object.assign({}, FTREE_SIZE[t.sz].tool);
  if (t.sp === "eiche" && t.sz >= 2 && !need.saw) need.axe = Math.max(need.axe || 0, 2);
  if (t.sp === "eiche" && t.sz >= 3) { delete need.axe; need.saw = Math.max(need.saw || 0, 1); }
  return need;
}
/* Nachwachsen: Stumpf → Setzling → klein → … (Spielminuten je Stufe) */
const FREGROW = { stump: 50, sapling: 70, grow: 160 };

/* ------------------------------ Werkzeug ------------------------------ */
const FTOOLS = {
  axe1:  { n: "Axt",            i: "🪓", kind: "axe", lvl: 1, price: 0,    lv: 1,  d: "Opas alte Axt – für kleine und mittlere Bäume." },
  axe2:  { n: "Stahlaxt",       i: "🪓", kind: "axe", lvl: 2, price: 140,  lv: 3,  d: "Geschmiedeter Kopf, längerer Stiel: 50 % mehr Wucht, auch für große Bäume." },
  saw1:  { n: "Kettensäge",     i: "🪚", kind: "saw", lvl: 1, price: 480,  lv: 7,  req: () => (S.farm.stats.felled || 0) >= 25, reqT: "25 Bäume gefällt",
           d: "Schneller, mehr Holz, auch Eichen. Fallrichtung wählen, nicht überhitzen. Sprit je Baum 3 €. Dazu kommt der Sägebock auf den Hof." },
  saw2:  { n: "Profi-Säge",     i: "🪚", kind: "saw", lvl: 2, price: 1900, lv: 13, req: () => !!(S.farm.areas && S.farm.areas.altwald), reqT: "der alte Wald ist offen",
           d: "Langes Schwert, starker Motor: für die uralten Eichen im alten Wald." }
};
const FSAW_FUEL = [0, 3, 5];          /* Sprit je Baum (€) */

/* ---------------------------- Ausdauer ---------------------------------
   Holzfällen kostet Ausdauer. Sie kommt langsam von selbst zurück – oder
   schneller mit einer Brotzeit aus Hof und Küche. */
const FSTA = { max: 100, regen: 0.25 };   /* je Spielminute */
const FFOOD = {
  apfel: 6, birne: 7, brot: 15, fladen: 12, muffins: 25, apfelkuchen: 35, kirschtorte: 45, pizza: 40,
  bratwurst: 25, schinken: 30, gulasch: 40, kaese: 20, pudding: 15, pilze: 10,
  fischbroetchen: 30, raeucherforelle: 25, hechtkloesse: 30, karpfenblau: 35
};

/* ---------------------------- Holzmaschinen ----------------------------
   Sägebock: auf dem Hof, mit der Kettensäge (Sprit = cost). Sägewerk:
   braucht Strom (en, kWh) aus dem Kessel, der Holzreste verfeuert.      */
Object.assign(FMACHINES, {
  saegebock: { n: "Sägebock", i: "🪚", hof: true, recipes: [
    { id: "brennholz", in: { aeste: 2 },  out: 1, t: 10, lv: 7 },
    { id: "pfosten",   in: { kiefer: 1 }, out: 1, t: 25, lv: 7, cost: 1, by: { reste: 1 } },
    { id: "bretter",   in: { kiefer: 1 }, out: 1, t: 35, lv: 7, cost: 1, by: { reste: 1 } },
    { id: "brennholz", key: "brennholz2", in: { birke: 1 }, out: 3, t: 20, lv: 8, cost: 1 },
    /* mühsam von Hand – im Sägewerk geht das später doppelt so schnell */
    { id: "balken",    in: { kiefer: 2 }, out: 1, t: 50, lv: 8, cost: 2, by: { reste: 1 } }
  ] },
  sw_halle: { n: "Gattersäge", i: "🏭", saw: true, recipes: [
    { id: "bretter",  in: { kiefer: 1 },  out: 2, t: 30, lv: 9,  en: 6, by: { reste: 1 } },
    { id: "balken",   in: { kiefer: 1 },  out: 1, t: 35, lv: 9,  en: 6, by: { reste: 1 } },
    { id: "platten",  in: { birke: 2 },   out: 2, t: 45, lv: 9,  en: 8, by: { reste: 1 } },
    { id: "kisten",   in: { bretter: 1 }, out: 2, t: 20, lv: 9,  en: 3 },
    { id: "pfosten",  in: { kiefer: 1 },  out: 2, t: 25, lv: 9,  en: 5 },
    { id: "bohlen",   in: { eiche: 1 },   out: 2, t: 50, lv: 10, en: 9, by: { reste: 1 } }
  ] },
  kessel: { n: "Kessel & Motor", i: "⚡", saw: true, power: true, recipes: [
    { id: "strom", key: "strom-r", in: { reste: 2 },     out: 3, t: 12, lv: 9, note: "Holzreste verfeuern" },
    { id: "strom", key: "strom-a", in: { aeste: 3 },     out: 2, t: 10, lv: 9, note: "Äste verfeuern" },
    { id: "strom", key: "strom-b", in: { brennholz: 1 }, out: 2, t: 8,  lv: 9, note: "Brennholz verfeuern" }
  ] },
  spalter: { n: "Holzspalter", i: "🪓", saw: true, recipes: [
    { id: "brennholz", in: { reste: 3 },  out: 2, t: 15, lv: 11, en: 2 },
    { id: "brennholz", key: "brennholz-b", in: { birke: 1 }, out: 5, t: 20, lv: 11, en: 3 },
    { id: "kaminholz", in: { buche: 1 },  out: 5, t: 30, lv: 11, en: 4 }
  ] },
  hobel: { n: "Hobelmaschine", i: "🛤️", saw: true, recipes: [
    { id: "dielen", in: { bretter: 1 }, out: 1, t: 35, lv: 12, en: 5, by: { reste: 1 } }
  ] },
  trocken: { n: "Trockenkammer", i: "🌡️", saw: true, recipes: [
    { id: "bauholz", in: { balken: 2 }, out: 2, t: 120, lv: 12, en: 12 }
  ] },
  verpack: { n: "Verpackungsmaschine", i: "🗃️", saw: true, recipes: [
    { id: "paletten", in: { bretter: 1, balken: 1 }, out: 3, t: 30, lv: 13, en: 4 }
  ] },
  schleif: { n: "Schleifmaschine", i: "🪑", saw: true, recipes: [
    { id: "moebel",    in: { buche: 1 },    out: 2, t: 60, lv: 14, en: 6, by: { reste: 1 } },
    { id: "schatulle", in: { edelholz: 1 }, out: 3, t: 90, lv: 14, en: 5 }
  ] },
  fraese: { n: "Fräse", i: "🚪", saw: true, recipes: [
    { id: "zaun",   in: { pfosten: 1, bretter: 1 }, out: 2, t: 40, lv: 14, en: 5 },
    { id: "tueren", in: { bohlen: 1, platten: 1 },  out: 1, t: 80, lv: 14, en: 8 }
  ] }
});
Object.assign(FBUILD_VAL, { saegebock: 600, spalter: 1200, hobel: 1800, trocken: 2400, verpack: 2000, schleif: 2800, fraese: 3200 });
Object.assign(FSIZE, {
  saegebock: [2, 2], junk: [2, 2], stall: [2, 1],
  sw_halle: [10, 6], sw_lager: [6, 4], sw_buero: [3, 3], sw_lkw: [3, 5], kessel: [3, 3],
  spalter: [2, 2], hobel: [3, 2], trocken: [4, 3], verpack: [3, 2], schleif: [3, 2], fraese: [3, 2]
});
["sw_halle", "sw_lager", "sw_buero", "sw_lkw", "kessel", "spalter", "hobel", "trocken", "verpack", "schleif", "fraese", "stall"].forEach(t => FFIXED.add(t));

/* ------------------------------- Gebiete --------------------------------
   locks: Rechtecke [x0, z0, x1, z1], die grau sind, solange das Gebiet zu
   ist; reveal: von hier deckt sich das Gebiet auf; cam: Kameragrenzen.  */
const FAREAS = {
  wald: {
    n: "Plötziner Forst", i: "🌲", lv: 5,
    locks: [[-400, -400, -15.5, 21], [-400, -400, 400, -15.5]], reveal: [-14, -7.5], cam: [-82, -84, 22, 20],
    reqs: [{ t: "Bäume gefällt", n: 3, v: () => S.farm.stats.felled || 0 }],
    who: "Förster Bruno Wendt", whoI: "🧔", whoRole: "Förster",
    msg: "Der Förster hat einen Weg durch den Wald freigegeben.",
    talk: "Moin! Ich bin Bruno, der Förster hier. Dein Opa hat mir immer mit Brennholz geholfen – jetzt bist du dran. Ich hab einen Weg durch den Plötziner Forst freigeschnitten: Birken am Waldrand, Kiefern im Westen, Buchen und Eichen im Norden. Kleine Bäume schaffst du mit der Axt, für die großen brauchst du besseres Werkzeug. Und denk an die Brotzeit!"
  },
  saege: {
    n: "Sägewerk Krüger", i: "🪚", lv: 9,
    locks: [[-42, -42, -16, -16]], reveal: [-29, -17], cam: null,
    reqs: [{ t: "Kettensäge gekauft", n: 1, v: () => Math.min(1, S.farm.tools.saw || 0), yes: true }, { t: "Bäume gefällt", n: 30, v: () => S.farm.stats.felled || 0 }],
    who: "Nachbar Erwin Krüger", whoI: "👴", whoRole: "Nachbar",
    msg: "Nachbar Krüger schenkt dir sein altes Sägewerk.",
    talk: "Tach! Erwin Krüger, von nebenan. Ich seh dich ja jeden Tag mit der Säge im Wald – du hast ein Händchen fürs Holz. Mein altes Sägewerk steht seit Jahren still, mir fehlt die Kraft. Ich schenk es dir. Es ist ziemlich heruntergekommen: Dach, Elektrik, die Säge, das Förderband und der Motor – alles muss gerichtet werden. Aber wenn es läuft, machst du aus jedem Stamm das Dreifache."
  },
  altwald: {
    n: "Alter Wald", i: "🌳", lv: 13,
    locks: [[-400, -400, -58, -58]], reveal: [-50, -62], cam: [-118, -118, 22, 20],
    reqs: [{ t: "Sägewerk repariert", n: 5, v: () => FSAW_REPAIRS.filter(r => S.farm.saw && S.farm.saw[r.id]).length }],
    who: "Förster Bruno Wendt", whoI: "🧔", whoRole: "Förster",
    msg: "Der Förster öffnet den alten Wald hinter dem Bach.",
    talk: "Hinter dem Bach liegt der alte Wald – Eichen, älter als das Dorf. Ein paar davon müssen raus, bevor sie umfallen. Das schafft nur eine Profi-Säge, und du brauchst ein Gefühl für die Fallrichtung. Aus so einem Stamm wird das beste Holz weit und breit."
  },
  see: {
    n: "Glindower See", i: "🎣", lv: 15,
    locks: [[-400, 21, 400, 400]], reveal: [5, 21], cam: [-40, -14.5, 58, 74],
    reqs: [{ t: "Sägewerk repariert", n: 5, v: () => FSAW_REPAIRS.filter(r => S.farm.saw && S.farm.saw[r.id]).length }, { t: "Holzwaren hergestellt", n: 40, v: () => S.farm.stats.woodMade || 0 }],
    who: "Bürgermeisterin Heike Sommer", whoI: "👩‍💼", whoRole: "Bürgermeisterin",
    msg: "Die Gemeinde verpachtet dir das Ufer am Glindower See.",
    talk: "Guten Tag! Heike Sommer, Bürgermeisterin. Die alte Fischerei am Glindower See ist seit Jahren verwaist. Weil Sie so viel für den Ort tun, verpachten wir Ihnen das Ufer. Fangen Sie klein an – ein Steg, eine Hütte. Holz dafür haben Sie ja jetzt genug. Die Restaurants in Werder warten auf frischen Zander!"
  }
};
const FAREA_ORDER = ["wald", "saege", "altwald", "see"];
/* Bedingungen: alle erfüllt? Und als Text („3 Bäume gefällt“) */
Object.values(FAREAS).forEach(A => {
  A.req = () => A.reqs.every(q => q.v() >= q.n);
  A.reqT = A.reqs.map(q => q.yes ? q.t : q.n + " " + q.t).join(" · ");
});
/* Kameragrenzen vor jeder Freischaltung: Hof, Teich und ein Blick über den Zaun */
const FCAM_HOF = [-18.5, -18.5, 22, 20];

/* ------------------------------ Sägewerk --------------------------------
   Lage der Gebäude (Weltmitte), Reparaturen (jeweils ein Minispiel) und
   Plätze für die Maschinen, die man nach und nach dazukauft.           */
const FSAW = {
  objs: [
    { t: "sw_halle", x: -29, z: -31 },
    { t: "sw_lager", x: -37, z: -22 },
    { t: "sw_buero", x: -20.5, z: -21.5 },
    { t: "sw_lkw",   x: -20.5, z: -31.5, r: 0 },
    { t: "kessel",   x: -38.5, z: -32.5 }
  ],
  pads: { spalter: [-24, -21], hobel: [-31.5, -23.5], trocken: [-22, -38], verpack: [-28, -38.5], schleif: [-34, -38.5], fraese: [-38.5, -38] }
};
const FSAW_REPAIRS = [
  { id: "dach",  n: "Dach",          i: "🏚️", game: "nails",  need: { bretter: 4, balken: 2 },  cost: 120,
    d: "Das Dach der Sägehalle ist undicht. Neue Bretter drauf und festnageln – genau dann zuschlagen, wenn der Ring den Nagel trifft." },
  { id: "strom", n: "Elektrik",      i: "⚡", game: "wires",  need: { pfosten: 1 },               cost: 180,
    d: "Die alten Kabel sind morsch. Die neuen Leitungen der Reihe nach anklemmen: erst Schutzleiter, dann Neutralleiter, dann die Phasen." },
  { id: "saege", n: "Sägemaschine",  i: "⚙️", game: "gears",  need: { balken: 2 },                cost: 260,
    d: "Im Getriebe der Gattersäge fehlen Zahnräder. Jedes Rad muss genau auf seine Achse passen, damit alles ineinandergreift." },
  { id: "band",  n: "Förderband",    i: "🛞", game: "belt",   need: { bretter: 2, pfosten: 2 },  cost: 150,
    d: "Rollen und Gurtstücke liegen verstreut. Setz jedes Teil in die passende Lücke." },
  { id: "motor", n: "Motor",         i: "🔧", game: "motor",  need: { reste: 2 },                cost: 220,
    d: "Der Antriebsmotor ist voller Dreck und Harz. Erst sauber wischen, dann die Teile in der richtigen Reihenfolge einsetzen." }
];
/* Krügers alter Unimog: nach der Reparatur ein Fahrzeug der eigenen Flotte */
if (typeof VEHICLES !== "undefined" && !VEHICLES.some(v => v.id === "v-holzlaster")) {
  VEHICLES.push({ id: "v-holzlaster", name: "Mercedes-Benz Unimog 406 (Bj. 1971)", brand: "Holzlaster", mode: "r", cap: 2500, speed: 62, costKm: 0.48,
    daily: 9, price: 0, stage: 1, range: 420, icon: "🚛", flags: ["sperrig"], special: true });
  if (typeof VEH_CO2 !== "undefined") VEH_CO2["v-holzlaster"] = [0.42, 0.6];
}
const FSAW_LKW = { id: "lkw", n: "Alter Holzlaster", i: "🚛", game: "motor", need: { bretter: 2 }, cost: 450, veh: "v-holzlaster",
  d: "Krügers alter Unimog steht seit Jahren unter der Plane. Motor reinigen, Teile einsetzen – dann fährt er wieder: 2,5 t Nutzlast für deine Holzlieferungen." };
/* Maschinen zum Dazukaufen (Laden, Reiter „Sägewerk“) */
const FSHOP_SAW = [
  { id: "spalter", cat: "saege", n: "Holzspalter",          i: "🪓", lv: 11, price: () => 900,  need: { balken: 1 },             lim: () => 1, d: "Brennholz aus Resten und Birken, Kaminholz aus Buche." },
  { id: "hobel",   cat: "saege", n: "Hobelmaschine",        i: "🛤️", lv: 12, price: () => 1400, need: { balken: 2 },             lim: () => 1, d: "Aus rauen Brettern werden glatte Hobeldielen." },
  { id: "trocken", cat: "saege", n: "Trockenkammer",        i: "🌡️", lv: 12, price: () => 1800, need: { bretter: 4, platten: 2 }, lim: () => 1, d: "Trocknet Balken zu formstabilem Bauholz." },
  { id: "verpack", cat: "saege", n: "Verpackungsmaschine",  i: "🗃️", lv: 13, price: () => 1600, need: { balken: 2 },             lim: () => 1, d: "Nagelt Europaletten aus Brettern und Balken." },
  { id: "schleif", cat: "saege", n: "Schleifmaschine",      i: "🪑", lv: 14, price: () => 2200, need: { platten: 2 },            lim: () => 1, d: "Möbelteile aus Buche, Schatullen aus Edelholz." },
  { id: "fraese",  cat: "saege", n: "Fräse",                i: "🚪", lv: 14, price: () => 2600, need: { platten: 2, balken: 2 }, lim: () => 1, d: "Zaunelemente und massive Holztüren." }
];
/* Ausbau im Sägewerk */
const FSAW_UPGRADES = {
  saege2:  { n: "Blockbandsäge statt Gatter", i: "⚙️", lv: 12, cost: 2500, need: { balken: 4 }, d: "Ein Drittel schneller und ein Warteplatz mehr in der Sägehalle." },
  kessel2: { n: "Größerer Kessel",            i: "⚡", lv: 11, cost: 800,  need: { bretter: 2 }, d: "Speichert 300 statt 150 kWh." }
};
const FENERGY_CAP = [150, 300];

/* --------------------------- Hof-Ausbaustufen ---------------------------- */
const FHOF_STAGES = [
  null,
  { n: "Kleiner Bauernhof", d: "Ein bisschen heruntergekommen – aber deiner." },
  { n: "Ausgebauter Hof", lv: 6, cost: 900, need: { kiefer: 6, birke: 6 },
    perks: ["Frischer Anstrich, Zaun repariert, Kieswege", "+20 Plätze in Silo und Scheune", "+1 Warteplatz in allen Hofgebäuden", "Ein Traktor für den Hof"] },
  { n: "Professioneller Betrieb", lv: 11, cost: 3500, need: { bretter: 12, balken: 8, pfosten: 8 },
    perks: ["Pflasterwege, Laternen und Blumen", "+40 Plätze in Silo und Scheune", "Verkaufsstand mit 5 Plätzen", "+1 Warteplatz in allen Hofgebäuden"] },
  { n: "Großer Wirtschaftshof", lv: 17, cost: 9000, need: { bauholz: 8, platten: 10, tueren: 2, zaun: 6 },
    perks: ["Das Gelände wächst – mehr Platz für Felder und Maschinen", "Hoftor aus Stein und Maschinenhalle", "+60 Plätze in Silo und Scheune", "Verkaufsstand mit 6 Plätzen"] }
];
/* Gerümpel auf dem Hof am Anfang: wegräumen gibt EP und ein bisschen Holz */
const FJUNK = {
  reifen:  { n: "Alte Reifen",    i: "🛞", sta: 8,  gain: { reste: 1 } },
  schrott: { n: "Schrotthaufen",  i: "🔩", sta: 12, gain: { reste: 1 }, m: 6 },
  unkraut: { n: "Brennnesseln",   i: "🌿", sta: 6,  gain: { aeste: 1 } },
  bretter: { n: "Morsche Bretter", i: "🪵", sta: 10, gain: { reste: 2 } },
  karre:   { n: "Kaputte Karre",  i: "🛒", sta: 14, gain: { aeste: 1, reste: 1 }, m: 4 }
};

/* ------------------------------ Mitarbeiter ------------------------------- */
const FSTAFF_ROLES = {
  fahrer:      { n: "Fahrer/in",      i: "🚚", lv: 8,  perk: "mehr Liefergeld",                 wage: [26, 42] },
  farmer:      { n: "Landwirt/in",    i: "🧑‍🌾", lv: 8,  perk: "Pflanzen wachsen schneller, gießt mit", wage: [24, 38] },
  mechaniker:  { n: "Mechaniker/in",  i: "🔧", lv: 10, perk: "Reparaturen und Strom günstiger", wage: [34, 52] },
  holzfaeller: { n: "Holzfäller/in",  i: "🪓", lv: 11, perk: "mehr Holz, fällt selbst kleine Bäume", wage: [30, 48] },
  fischer:     { n: "Fischer/in",     i: "🎣", lv: 16, perk: "mehr Fang, fischt selbst",         wage: [30, 48] }
};
const FSTAFF_SLOTS = [[8, 1], [11, 2], [14, 3], [17, 4], [20, 5]];
const FSTAFF_NAMES = ["Jana", "Ole", "Mira", "Henrik", "Ida", "Paul", "Greta", "Lasse", "Emma", "Bruno", "Lotte", "Theo", "Svenja", "Kalle", "Anni", "Jonte", "Wiebke", "Malte", "Ronja", "Fiete"];
const FSTAFF_TRAITS = [
  { t: "fleißig", p: 14 }, { t: "erfahren", p: 18 }, { t: "gemütlich", p: 8 }, { t: "lernt schnell", p: 11 },
  { t: "Frühaufsteher/in", p: 12 }, { t: "Tüftler/in", p: 15 }, { t: "zuverlässig", p: 10 }
];

/* ------------------------------ Ereignisse -------------------------------
   Kleine Überraschungen alle paar Minuten. area = nötiges Gebiet,
   win = Uhrzeit von–bis (Rehe und Hirsche nicht mitten in der Nacht). */
const FEVENTS = {
  sturm:     { n: "Sturm",                  i: "⛈️", area: "wald",  w: 8,  dur: 70 },
  haendler:  { n: "Fliegender Händler",     i: "🧑‍💼", area: null,   w: 9,  dur: 60, daily: true },
  schwarm:   { n: "Fischschwarm",           i: "🐟", area: "see",   w: 9,  dur: 900 },
  nachbar:   { n: "Nachbar braucht Holz",   i: "👴", area: "saege", w: 8,  dur: 1800 },
  holzpreis: { n: "Holzpreise steigen",     i: "📈", area: "wald",  w: 7,  dur: 1800 },
  fischpreis:{ n: "Fischpreise steigen",    i: "📈", area: "see",   w: 7,  dur: 1800 },
  hirsch:    { n: "Ein weißer Hirsch",      i: "🦌", area: "wald",  w: 5,  dur: 90, win: [5, 21] },
  defekt:    { n: "Maschine klemmt",        i: "⚠️", area: "saege", w: 6,  dur: 99999, need: () => sawRepaired() },
  lieferung: { n: "Besondere Lieferung",    i: "📦", area: null,   w: 6,  dur: 900 },
  pilze:     { n: "Wildschweine im Wald",   i: "🍄", area: "wald",  w: 8,  dur: 1200 },
  reh:       { n: "Ein Reh auf dem Weg",    i: "🦌", area: null,   w: 6,  dur: 120, win: [5, 19] }
};

/* --------------------------- Kosmetik-Shop ------------------------------
   Bezahlt mit Kleeblättern 🍀 – die gibt es fürs Spielen (Level, Kapitel,
   Ereignisse, Tagesbonus). Echtgeld und Werbevideos sind nur Platzhalter. */
const FCOSMETIC = [
  { id: "scheune_blau",  cat: "skin",   n: "Scheune in Taubenblau",  i: "🏚️", price: 25, skin: { barn: "blau" } },
  { id: "scheune_gruen", cat: "skin",   n: "Scheune in Moosgrün",    i: "🏚️", price: 25, skin: { barn: "gruen" } },
  { id: "dach_schiefer", cat: "skin",   n: "Wohnhaus mit Schieferdach", i: "🏡", price: 30, skin: { house: "schiefer" } },
  { id: "traktor_gruen", cat: "skin",   n: "Traktor in Grün",        i: "🚜", price: 20, skin: { tractor: "gruen" } },
  { id: "hund",          cat: "pet",    n: "Hofhund Bello",          i: "🐕", price: 40, pet: "hund" },
  { id: "katze",         cat: "pet",    n: "Katze Minka",            i: "🐈", price: 35, pet: "katze" },
  { id: "ziege",         cat: "pet",    n: "Ziege Heidi",            i: "🐐", price: 30, pet: "ziege" },
  { id: "weihnachtsbaum", cat: "saison", n: "Weihnachtsbaum",        i: "🎄", price: 15, deco: "xmas" },
  { id: "kuerbislaterne", cat: "saison", n: "Kürbislaternen",        i: "🎃", price: 12, deco: "lantern" },
  { id: "maibaum",       cat: "saison", n: "Maibaum",                i: "🎏", price: 18, deco: "maypole" },
  { id: "schneemann",    cat: "saison", n: "Schneemann",             i: "⛄", price: 10, deco: "snowman" },
  { id: "osterhase",     cat: "saison", n: "Osterhase aus Holz",     i: "🐰", price: 10, deco: "easter" },
  { id: "brotdose",      cat: "komfort", n: "Große Brotdose",        i: "🥪", price: 30, d: "+25 maximale Ausdauer" },
  { id: "thermos",       cat: "komfort", n: "Thermoskanne",          i: "☕", price: 35, d: "Ausdauer kommt 50 % schneller zurück" },
  { id: "werkzeugguertel", cat: "komfort", n: "Werkzeuggürtel",      i: "🧰", price: 60, d: "+1 Warteplatz in allen Gebäuden" }
];
const FCOS_CATS = [["skin", "🎨 Optik"], ["pet", "🐾 Haustiere"], ["saison", "🎄 Saison"], ["komfort", "☕ Komfort"]];
/* Laden: neue Reiter für Werkzeug, Sägewerk und Extras (Kleeblätter) */
FSHOP_CATS_HOF.splice(3, 0, ["werkzeug", "🪓 Werkzeug"], ["saege", "🪚 Sägewerk"]);
FSHOP_CATS_HOF.push(["extras", "🍀 Extras"]);
FSHOP_HOF.push({ id: "s-koeder", cat: "werkzeug", n: "Köder", i: "🪱", lv: 15, item: "koeder", qty: 10, price: () => 4, d: "Zehn Dosen Würmer und Maden für die Angel." });
/* Deko aus dem Kosmetik-Shop (nur, wenn gekauft) */
Object.assign(FDECO, {
  xmas:    { n: "Weihnachtsbaum",  i: "🎄", price: 0, lv: 1, sz: [2, 2], cos: "weihnachtsbaum" },
  lantern: { n: "Kürbislaternen",  i: "🎃", price: 0, lv: 1, sz: [1, 1], cos: "kuerbislaterne" },
  maypole: { n: "Maibaum",         i: "🎏", price: 0, lv: 1, sz: [1, 1], cos: "maibaum" },
  snowman: { n: "Schneemann",      i: "⛄", price: 0, lv: 1, sz: [1, 1], cos: "schneemann" },
  easter:  { n: "Osterhase",       i: "🐰", price: 0, lv: 1, sz: [1, 1], cos: "osterhase" }
});

/* ----------------------------- Verkaufsstand ------------------------------
   Wie ein Hofladen an der Straße: Ware rein, Preis wählen, Kundschaft
   kommt vorbei. Teurer verkauft sich langsamer. */
const FSTALL = { slots: [3, 3, 5, 6], market: 3, premium: 0.15 };

/* --------------------------- Freischaltungen ---------------------------- */
Object.assign(FUNLOCK_HOF, {
  3: (FUNLOCK_HOF[3] || []).concat(["🪓 Stahlaxt im Laden"]),
  5: (FUNLOCK_HOF[5] || []).concat(["🌲 Der Wald – sobald der Förster vorbeischaut"]),
  6: (FUNLOCK_HOF[6] || []).concat(["🏡 Hof-Ausbau: Stufe 2"]),
  7: (FUNLOCK_HOF[7] || []).concat(["🪚 Kettensäge & Sägebock", "🪵 Bretter, Pfosten, Brennholz"]),
  8: ["👷 Mitarbeiter: Fahrer und Landwirte", "🔥 Brennholz aus Birken", "🏗️ Balken vom Sägebock"],
  9: ["🏭 Das alte Sägewerk – Besuch vom Nachbarn", "📦 Holzkisten, Balken, Holzplatten"],
  10: ["🟤 Eichenbohlen", "🔧 Mechaniker"],
  11: ["🪓 Holzspalter & Kaminholz", "🏡 Hof-Ausbau: Stufe 3", "⚡ Größerer Kessel", "🪓 Holzfäller"],
  12: ["🛤️ Hobelmaschine", "🌡️ Trockenkammer & Bauholz", "⚙️ Blockbandsäge"],
  13: ["🌳 Der alte Wald", "🪚 Profi-Säge", "🗃️ Europaletten"],
  14: ["🪑 Schleifmaschine: Möbelteile & Schatullen", "🚪 Fräse: Türen & Zäune"],
  15: ["🎣 Der Glindower See", "🪵 Steg"],
  16: ["🛖 Fischerhütte: Filets", "⛵ Bootshaus & Ruderboot", "🎣 Fischer"],
  17: ["🔥 Räucherei", "🧊 Fischlager & Konserven", "🏡 Hof-Ausbau: Stufe 4"],
  18: ["❄️ Kühlhaus & Edelfisch-Box", "🍱 Zanderfilet"],
  19: ["🏪 Fischmarkt", "🚤 Motorboot"],
  20: ["🚚 Spedition gründen – sobald das Notizbuch fertig ist"]
});

/* --------------------- Kundschaft für Holz und Fisch ---------------------- */
(function () {
  const add = (town, cust) => { if (FTOWNS_HOF[town]) FTOWNS_HOF[town].cust.push(...cust); };
  add("w-werder", [["Baumarkt Werder", ["bretter", "pfosten", "kisten", "zaun", "brennholz"]], ["Kaminstudio Werder", ["brennholz", "kaminholz"]],
    ["Fischrestaurant Arielle", ["zanderfilet", "forellenfilet", "raeucheraal", "hechtkloesse"]]]);
  add("w-glindow", [["Tischlerei Glindow", ["platten", "dielen", "moebel", "bohlen", "schatulle"]], ["Imbiss am Glindower See", ["fischbroetchen", "raeucherforelle", "barschfilet", "konserve"]]]);
  add("w-petzow", [["Bootsverleih Petzow", ["bretter", "dielen", "pfosten"]], ["Schlosshotel Petzow", ["zanderfilet", "edelbox", "kaminholz", "schatulle"]]]);
  add("w-geltow", [["Zimmerei Geltow", ["balken", "bauholz", "bretter", "pfosten"]], ["Räucherkate Geltow", ["raeucherforelle", "raeucheraal", "fischplatte"]]]);
  add("w-caputh", [["Werft Caputh", ["bohlen", "dielen", "bretter", "balken"]], ["Fischerhütte Caputh", ["karpfenblau", "barschfilet", "fischkiste"]]]);
  add("w-michendorf", [["Holzhandel Michendorf", ["bretter", "balken", "platten", "paletten", "bauholz"]], ["Getränkehandel Michendorf", ["paletten", "kisten"]]]);
  add("potsdam", [["Möbelhaus am Bassin", ["moebel", "tueren", "schatulle"]], ["Fischmarkt Potsdam", ["karpfenblau", "konserve", "fischkiste", "hechtkloesse", "edelbox"]],
    ["Baustoffe Potsdam-West", ["bauholz", "tueren", "zaun", "paletten"]]]);
})();

/* ------------------------- Notizbuch: neue Kapitel -------------------------
   Nach „Meisterhof“ geht es in den Wald, ins Sägewerk und an den See.
   Erst wenn alle elf Kapitel abgehakt sind, kommt die Spedition.       */
const fsaw = id => !!(S.farm.saw && S.farm.saw[id]);
const farea = id => !!(S.farm.areas && S.farm.areas[id]);
FCHAPTERS_HOF.push(
  { n: "Der Wald",           t: "Holz aus dem Plötziner Forst",          r: { m: 300,  xp: 150 },
    opa: "Ein Hof braucht Holz – für den Ofen, für Zäune, für alles. Nimm nie mehr, als nachwächst, dann reicht es für deine Enkel auch noch." },
  { n: "Die Kettensäge",     t: "Erste eigene Holzverarbeitung",          r: { m: 450,  xp: 200 },
    opa: "Aus einem Stamm Bretter zu machen, ist das halbe Handwerk. Die andere Hälfte ist, sie auch gut zu verkaufen." },
  { n: "Das alte Sägewerk",  t: "Krügers Sägewerk wird wieder flott",     r: { m: 700,  xp: 260 },
    opa: "Krüger war der beste Säger im ganzen Havelland. Wenn seine Säge wieder singt, hört man das bis nach Werder." },
  { n: "Holzproduktion",     t: "Vom Stamm bis zum Möbelstück",           r: { m: 1000, xp: 360 },
    opa: "Je mehr Arbeit im Holz steckt, desto mehr ist es wert. Aber ohne gute Leute schafft man das nicht allein." },
  { n: "Am See",             t: "Die Fischerei am Glindower See",         r: { m: 1200, xp: 420 },
    opa: "Am See bin ich als Junge jeden Morgen gewesen. Der Zander beißt, wenn es dämmert – und bei Regen kommen die Aale." },
  { n: "Fischverarbeitung",  t: "Räuchern, kühlen, verkaufen",            r: { m: 1600, xp: 520 },
    opa: "Frischer Fisch ist gut, geräucherter ist besser – und in einer Holzkiste aus dem eigenen Sägewerk sieht er am besten aus." },
  { n: "Wirtschaftshof",     t: "Hof, Wald, Sägewerk und See – alles deins", r: { m: 3000, xp: 800 },
    opa: "Schau dich um: Am Anfang hattest du einen kleinen Hof und eine Axt. Jetzt hast du eine ganze Welt aufgebaut." }
);
FQUESTS_HOF.push(
  /* Kapitel 5 – Der Wald */
  { c: 4, t: "Der Förster gibt den Wald frei",    chk: () => farea("wald"),                   n: 1, r: { m: 30,  xp: 20 } },
  { c: 4, t: "Fälle 8 Birken",                    ev: "fell:birke",        n: 8,  r: { m: 40,  xp: 25 } },
  { c: 4, t: "Fälle 6 Kiefern oder Fichten",      ev: "fell:kiefer",       n: 6,  r: { m: 40,  xp: 25 } },
  { c: 4, t: "Mach eine Brotzeit im Wald",        ev: "eat",               n: 1,  r: { m: 15,  xp: 10 } },
  { c: 4, t: "Verkauf Holz für 200 € an den Holzhändler", chk: () => (S.farm.stats.woodSold || 0) >= 200, n: 1, r: { m: 40, xp: 25 } },
  { c: 4, t: "Kauf die Stahlaxt",                 chk: () => (S.farm.tools.axe || 1) >= 2,   n: 1, r: { m: 30,  xp: 20 } },
  { c: 4, t: "Fälle einen großen Baum",           ev: "fell:big",          n: 1,  r: { m: 50,  xp: 30 } },
  { c: 4, t: "Bau den Hof aus: Stufe 2",          chk: () => (S.farm.stage || 1) >= 2,        n: 1, r: { m: 80,  xp: 50 } },
  { c: 4, t: "Erreiche Level 7",                  ev: "level",             n: 7,  r: { m: 80,  xp: 0 } },
  /* Kapitel 6 – Die Kettensäge */
  { c: 5, t: "Kauf die Kettensäge",               chk: () => (S.farm.tools.saw || 0) >= 1,    n: 1, r: { m: 60,  xp: 30 } },
  { c: 5, t: "Fälle 5 Bäume mit der Kettensäge",  ev: "fell:saw",          n: 5,  r: { m: 60,  xp: 30 } },
  { c: 5, t: "Säge 4 Bund Bretter",               ev: "make:bretter",      n: 4,  r: { m: 60,  xp: 30 } },
  { c: 5, t: "Mach 8 Säcke Brennholz",            ev: "make:brennholz",    n: 8,  r: { m: 50,  xp: 25 } },
  { c: 5, t: "Säge 3 Bund Pfosten",               ev: "make:pfosten",      n: 3,  r: { m: 50,  xp: 25 } },
  { c: 5, t: "Fälle eine Eiche",                  ev: "fell:eiche",        n: 1,  r: { m: 70,  xp: 35 } },
  { c: 5, t: "Liefere 3 Holzbestellungen",        ev: "deliver:wood",      n: 3,  r: { m: 90,  xp: 45 } },
  { c: 5, t: "Erreiche Level 9",                  ev: "level",             n: 9,  r: { m: 120, xp: 0 } },
  /* Kapitel 7 – Das alte Sägewerk */
  { c: 6, t: "Übernimm Krügers Sägewerk",         chk: () => farea("saege"),                  n: 1, r: { m: 50,  xp: 30 } },
  { c: 6, t: "Repariere das Dach",                chk: () => fsaw("dach"),                    n: 1, r: { m: 60,  xp: 35 } },
  { c: 6, t: "Repariere die Elektrik",            chk: () => fsaw("strom"),                   n: 1, r: { m: 60,  xp: 35 } },
  { c: 6, t: "Repariere die Sägemaschine",        chk: () => fsaw("saege"),                   n: 1, r: { m: 70,  xp: 40 } },
  { c: 6, t: "Repariere das Förderband",          chk: () => fsaw("band"),                    n: 1, r: { m: 60,  xp: 35 } },
  { c: 6, t: "Repariere den Motor",               chk: () => fsaw("motor"),                   n: 1, r: { m: 80,  xp: 45 } },
  { c: 6, t: "Heiz den Kessel an",                ev: "make:strom",        n: 2,  r: { m: 40,  xp: 20 } },
  { c: 6, t: "Säge 3 Paar Balken",                ev: "make:balken",       n: 3,  r: { m: 70,  xp: 35 } },
  { c: 6, t: "Mach 4 Stapel Holzkisten",          ev: "make:kisten",       n: 4,  r: { m: 60,  xp: 30 } },
  { c: 6, t: "Bring den alten Holzlaster zum Laufen", chk: () => fsaw("lkw"),                 n: 1, r: { m: 120, xp: 60 } },
  /* Kapitel 8 – Holzproduktion */
  { c: 7, t: "Kauf den Holzspalter",              chk: () => fcount("spalter") >= 1,          n: 1, r: { m: 90,  xp: 40 } },
  { c: 7, t: "Mach 6 Netze Kaminholz",            ev: "make:kaminholz",    n: 6,  r: { m: 80,  xp: 35 } },
  { c: 7, t: "Stell deine erste Mitarbeiterin ein", chk: () => (S.farm.staff || []).length >= 1, n: 1, r: { m: 80, xp: 35 } },
  { c: 7, t: "Kauf die Hobelmaschine",            chk: () => fcount("hobel") >= 1,            n: 1, r: { m: 100, xp: 45 } },
  { c: 7, t: "Hoble 3 Bund Dielen",               ev: "make:dielen",       n: 3,  r: { m: 90,  xp: 40 } },
  { c: 7, t: "Kauf die Trockenkammer",            chk: () => fcount("trocken") >= 1,          n: 1, r: { m: 120, xp: 50 } },
  { c: 7, t: "Trockne 4 Paar Kanthölzer",         ev: "make:bauholz",      n: 4,  r: { m: 110, xp: 50 } },
  { c: 7, t: "Bau den Hof aus: Stufe 3",          chk: () => (S.farm.stage || 1) >= 3,        n: 1, r: { m: 200, xp: 80 } },
  { c: 7, t: "Öffne den alten Wald",              chk: () => farea("altwald"),                n: 1, r: { m: 80,  xp: 40 } },
  { c: 7, t: "Fälle eine uralte Eiche",           ev: "fell:uralt",        n: 1,  r: { m: 200, xp: 90 } },
  { c: 7, t: "Mach 2 Sätze Möbelteile",           ev: "make:moebel",       n: 2,  r: { m: 150, xp: 60 } },
  { c: 7, t: "Erreiche Level 15",                 ev: "level",             n: 15, r: { m: 250, xp: 0 } },
  /* Kapitel 9 – Am See */
  { c: 8, t: "Pachte das Ufer am Glindower See",  chk: () => farea("see"),                    n: 1, r: { m: 80,  xp: 40 } },
  { c: 8, t: "Bau den Steg",                      chk: () => fcount("f_steg") >= 1,           n: 1, r: { m: 100, xp: 45 } },
  { c: 8, t: "Angle 5 Fische",                    ev: "catch",             n: 5,  r: { m: 80,  xp: 40 } },
  { c: 8, t: "Bau die Fischerhütte",              chk: () => fcount("f_huette") >= 1,         n: 1, r: { m: 140, xp: 55 } },
  { c: 8, t: "Filetiere 4 Schalen Barsch",        ev: "make:barschfilet",  n: 4,  r: { m: 100, xp: 45 } },
  { c: 8, t: "Bau das Bootshaus",                 chk: () => fcount("f_boot") >= 1,           n: 1, r: { m: 200, xp: 70 } },
  { c: 8, t: "Fahr mit dem Ruderboot hinaus",     ev: "boat",              n: 1,  r: { m: 60,  xp: 30 } },
  { c: 8, t: "Fang einen Hecht",                  ev: "catch:hecht",       n: 1,  r: { m: 120, xp: 50 } },
  { c: 8, t: "Fang 3 Fische bei Regen oder in der Nacht", ev: "catch:hard", n: 3, r: { m: 150, xp: 60 } },
  { c: 8, t: "Erreiche Level 17",                 ev: "level",             n: 17, r: { m: 300, xp: 0 } },
  /* Kapitel 10 – Fischverarbeitung */
  { c: 9, t: "Bau die Räucherei",                 chk: () => fcount("f_rauch") >= 1,          n: 1, r: { m: 150, xp: 60 } },
  { c: 9, t: "Räuchere 4 Forellen",               ev: "make:raeucherforelle", n: 4, r: { m: 120, xp: 50 } },
  { c: 9, t: "Bau das Fischlager",                chk: () => fcount("f_lager") >= 1,          n: 1, r: { m: 150, xp: 60 } },
  { c: 9, t: "Koch 8 Fischkonserven ein",         ev: "make:konserve",     n: 8,  r: { m: 120, xp: 50 } },
  { c: 9, t: "Pack 2 Frischfischkisten",          ev: "make:fischkiste",   n: 2,  r: { m: 150, xp: 60 } },
  { c: 9, t: "Bau das Kühlhaus",                  chk: () => fcount("f_kuehl") >= 1,          n: 1, r: { m: 300, xp: 90 } },
  { c: 9, t: "Pack eine Edelfisch-Box",           ev: "make:edelbox",      n: 1,  r: { m: 250, xp: 90 } },
  { c: 9, t: "Bau den Fischmarkt",                chk: () => fcount("f_markt") >= 1,          n: 1, r: { m: 300, xp: 90 } },
  { c: 9, t: "Verkauf 10 Sachen am Verkaufsstand", ev: "stall:sold",       n: 10, r: { m: 200, xp: 70 } },
  { c: 9, t: "Erreiche Level 19",                 ev: "level",             n: 19, r: { m: 400, xp: 0 } },
  /* Kapitel 11 – Wirtschaftshof */
  { c: 10, t: "Bau den Hof aus: Stufe 4",         chk: () => (S.farm.stage || 1) >= 4,        n: 1, r: { m: 500, xp: 150 } },
  { c: 10, t: "Kauf das Motorboot",               chk: () => (S.farm.boat || 0) >= 2,         n: 1, r: { m: 300, xp: 100 } },
  { c: 10, t: "Fang einen Zander in der Tiefen Mitte", ev: "catch:mitte:zander", n: 1, r: { m: 250, xp: 90 } },
  { c: 10, t: "Fang 6 verschiedene Fischarten",   chk: () => Object.keys(S.farm.stats.species || {}).length >= 6, n: 1, r: { m: 300, xp: 110 } },
  { c: 10, t: "Stell 3 Mitarbeiter ein",          chk: () => (S.farm.staff || []).length >= 3, n: 1, r: { m: 300, xp: 100 } },
  { c: 10, t: "Liefere insgesamt 40 Bestellungen aus", chk: () => (S.farm.stats.deliv || 0) >= 40, n: 1, r: { m: 400, xp: 120 } },
  { c: 10, t: "Erreiche Level 20",                ev: "level",             n: 20, r: { m: 800, xp: 0 } }
);
/* Index der ersten Aufgabe eines Kapitels */
function FQ_CH_START(c) { const i = FQUESTS_HOF.findIndex(q => q.c === c); return i < 0 ? FQUESTS_HOF.length : i; }
