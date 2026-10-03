/* =========================================================================
   LOGISTIKA – farmdata.js
   Zahlen und Tabellen für den geerbten Hof: Waren, Pflanzen, Bäume, Tiere,
   Gebäude mit Rezepten, Freischaltungen je Level, Kundschaft in den Dörfern
   rund um Werder (Havel) und Opas Notizbuch (Aufgaben mit Belohnung).
   Zeiten in Spielminuten (bei 1× ist eine Spielminute eine Sekunde).
   ========================================================================= */

/* Waren werden in üblichen Gebinden gehandelt (Sack, Kiste, Schachtel …).
   Je Einheit: a = Menge im Gebinde, u = Maßeinheit ("" = Stück), pk = Gebinde,
   v = Preis in € (Direktvermarktung, Stand 2026), kg = Gewicht,
   xp beim Erzeugen, st = Lager. n = Name (bei Stück die Mehrzahl), sg = Einzahl. */
const FITEMS = {
  weizen:      { n: "Weizen",         i: "🌾", k: "crop",  a: 10,  u: "kg",     pk: "Sack",          v: 4,   kg: 10,   xp: 1,  st: "silo" },
  mais:        { n: "Mais",           i: "🌽", k: "crop",  a: 10,  u: "kg",     pk: "Sack",          v: 4.5, kg: 10,   xp: 2,  st: "silo" },
  tomate:      { n: "Tomaten",        i: "🍅", k: "crop",  a: 2,   u: "kg",     pk: "Kiste",         v: 7,   kg: 2,    xp: 3,  st: "silo" },
  karotte:     { n: "Karotten",       i: "🥕", k: "crop",  a: 2,   u: "kg",     pk: "Bund",          v: 5,   kg: 2,    xp: 3,  st: "silo" },
  kartoffel:   { n: "Kartoffeln",     i: "🥔", k: "crop",  a: 5,   u: "kg",     pk: "Sack",          v: 6,   kg: 5,    xp: 4,  st: "silo" },
  erdbeere:    { n: "Erdbeeren",      i: "🍓", k: "crop",  a: 0.5, u: "kg",     pk: "Schale",        v: 4,   kg: 0.5,  xp: 5,  st: "silo" },
  kuerbis:     { n: "Kürbisse",       i: "🎃", k: "crop",  a: 1,   u: "",       pk: "Stück",         v: 4,   kg: 3,    xp: 7,  st: "silo", sg: "Kürbis" },
  apfel:       { n: "Äpfel",          i: "🍎", k: "fruit", a: 2,   u: "kg",     pk: "Kiste",         v: 6,   kg: 2,    xp: 3,  st: "silo" },
  kirsche:     { n: "Kirschen",       i: "🍒", k: "fruit", a: 0.5, u: "kg",     pk: "Schale",        v: 5,   kg: 0.5,  xp: 4,  st: "silo" },
  birne:       { n: "Birnen",         i: "🍐", k: "fruit", a: 2,   u: "kg",     pk: "Kiste",         v: 7,   kg: 2,    xp: 5,  st: "silo" },
  ei:          { n: "Eier",           i: "🥚", k: "ani",   a: 6,   u: "",       pk: "6er-Schachtel", v: 2.4, kg: 0.4,  xp: 2,  st: "barn", sg: "Ei" },
  milch:       { n: "Milch",          i: "🥛", k: "ani",   a: 5,   u: "l",      pk: "Kanne",         v: 5,   kg: 5.2,  xp: 4,  st: "barn" },
  hfutter:     { n: "Hühnerfutter",   i: "🥣", k: "feed",  a: 5,   u: "kg",     pk: "Eimer",         v: 2,   kg: 5,    xp: 1,  st: "barn" },
  kfutter:     { n: "Kuhfutter",      i: "🌿", k: "feed",  a: 20,  u: "kg",     pk: "Ballen",        v: 5,   kg: 20,   xp: 1,  st: "barn" },
  brot:        { n: "Brote",          i: "🍞", k: "bake",  a: 1,   u: "",       pk: "Laib",          v: 4.5, kg: 1,    xp: 4,  st: "barn", sg: "Brot" },
  fladen:      { n: "Maisfladen",     i: "🫓", k: "bake",  a: 4,   u: "",       pk: "4er-Pack",      v: 6,   kg: 0.5,  xp: 6,  st: "barn" },
  apfelkuchen: { n: "Apfelkuchen",    i: "🥧", k: "bake",  a: 1,   u: "",       pk: "Blech",         v: 18,  kg: 1.5,  xp: 10, st: "barn" },
  muffins:     { n: "Möhren-Muffins", i: "🧁", k: "bake",  a: 6,   u: "",       pk: "6er-Box",       v: 9,   kg: 0.6,  xp: 10, st: "barn", sg: "Möhren-Muffin" },
  kirschtorte: { n: "Kirschtorten",   i: "🍰", k: "bake",  a: 1,   u: "",       pk: "Torte",         v: 26,  kg: 2,    xp: 16, st: "barn", sg: "Kirschtorte" },
  pizza:       { n: "Pizzen",         i: "🍕", k: "bake",  a: 1,   u: "",       pk: "Stück",         v: 9,   kg: 0.7,  xp: 14, st: "barn", sg: "Pizza" },
  butter:      { n: "Butter",         i: "🧈", k: "dairy", a: 250, u: "g",      pk: "Stück",         v: 3.2, kg: 0.25, xp: 7,  st: "barn" },
  pudding:     { n: "Pudding",        i: "🍮", k: "dairy", a: 4,   u: "Becher", pk: "4er-Pack",      v: 5,   kg: 0.5,  xp: 8,  st: "barn" },
  kaese:       { n: "Käse",           i: "🧀", k: "dairy", a: 1,   u: "kg",     pk: "Laib",          v: 16,  kg: 1,    xp: 11, st: "barn" }
};

/* Pflanzen: t = Wachstum, seed = Saatgut je Feld (€), lv = ab Level */
const FCROPS = {
  weizen:    { t: 120, seed: 1, lv: 1 },
  mais:      { t: 240, seed: 2, lv: 1 },
  tomate:    { t: 360, seed: 3, lv: 2 },
  karotte:   { t: 420, seed: 3, lv: 3 },
  kartoffel: { t: 600, seed: 4, lv: 5 },
  erdbeere:  { t: 720, seed: 6, lv: 6 },
  kuerbis:   { t: 900, seed: 8, lv: 7 }
};
/* Obstbäume: t = bis zur nächsten Ernte, yield Früchte je Ernte */
const FTREES = {
  apfel:   { n: "Apfelbaum",  t: 360, yield: 3, price: 30, lv: 1 },
  kirsche: { n: "Kirschbaum", t: 480, yield: 3, price: 60, lv: 4 },
  birne:   { n: "Birnbaum",   t: 540, yield: 3, price: 90, lv: 7 }
};
/* Tiere: Futter je Durchgang, t = bis zum Produkt, space = Platz je Tier für
   volle Qualität (m²), house = Stalltyp */
const FANIMALS = {
  huhn: { n: "Huhn", i: "🐔", out: "ei",    feed: "hfutter", t: 90,  price: 12,  step: 3,  lv: 1, space: 4,    house: "coop",  max: 9, unit: "m²" },
  kuh:  { n: "Kuh",  i: "🐄", out: "milch", feed: "kfutter", t: 240, price: 350, step: 50, lv: 3, space: 1500, house: "cows",  max: 6, unit: "m²" }
};
/* Auslauf je Ausbaustufe: Kacheln (w × d) und Fläche in m² */
const FPENS = {
  coop: [{ w: 4, d: 3, m2: 18 }, { w: 5, d: 4, m2: 32 }, { w: 6, d: 5, m2: 50 }, { w: 7, d: 6, m2: 72 }],
  cows: [{ w: 6, d: 5, m2: 3000 }, { w: 7, d: 6, m2: 5000 }, { w: 8, d: 7, m2: 7500 }, { w: 9, d: 8, m2: 10500 }]
};
const FPEN_COST = { coop: [0, 60, 150, 320], cows: [0, 200, 450, 900] };
/* Haltung nach Platz je Tier (Verhältnis zum Ideal) */
const FKEEP = [
  { r: 2.0,  st: 5, n: "Bio-Weidehaltung" },
  { r: 1.25, st: 4, n: "Freiland plus" },
  { r: 0.9,  st: 3, n: "Freilandhaltung" },
  { r: 0.5,  st: 2, n: "Bodenhaltung" },
  { r: 0,    st: 1, n: "zu eng – Massenhaltung" }
];

/* Gebäude mit Rezepten. in = Zutaten, t = Minuten, lv = ab Level */
const FMACHINES = {
  mill: { n: "Futtermühle", i: "🌬️", recipes: [
    { id: "hfutter", in: { weizen: 1, mais: 1 }, out: 4, t: 20, lv: 1 },
    { id: "kfutter", in: { weizen: 1, mais: 1 }, out: 1, t: 30, lv: 3 }
  ] },
  bakery: { n: "Backofen", i: "🔥", recipes: [
    { id: "brot",        in: { weizen: 1 },                                  out: 4, t: 45,  lv: 1 },
    { id: "fladen",      in: { mais: 1, ei: 1 },                             out: 2, t: 75,  lv: 2 },
    { id: "apfelkuchen", in: { weizen: 1, apfel: 1, ei: 1 },                 out: 2, t: 120, lv: 3 },
    { id: "muffins",     in: { weizen: 1, karotte: 1, ei: 1, milch: 1 },     out: 3, t: 100, lv: 4 },
    { id: "pizza",       in: { weizen: 1, tomate: 1, kaese: 1 },             out: 4, t: 150, lv: 6 },
    { id: "kirschtorte", in: { weizen: 1, kirsche: 2, ei: 1, butter: 1 },    out: 2, t: 180, lv: 6 }
  ] },
  dairy: { n: "Molkerei", i: "🧀", recipes: [
    { id: "butter",  in: { milch: 1 },        out: 2, t: 60,  lv: 4 },
    { id: "pudding", in: { milch: 1, ei: 1 }, out: 2, t: 70,  lv: 4 },
    { id: "kaese",   in: { milch: 2 },        out: 1, t: 120, lv: 5 }
  ] }
};
const FSLOT_COST = [0, 0, 60, 180, 450, 1000];   /* Preis für Platz 3, 4, 5 … in der Warteschlange */

/* Lager: Grundgröße, Zuwachs und Preise je Ausbaustufe */
const FSTORE = {
  silo: { n: "Silo",    base: 60, step: 40, cost: [80, 200, 400, 750, 1200, 2000] },
  barn: { n: "Scheune", base: 40, step: 30, cost: [90, 220, 450, 850, 1350, 2200] }
};

/* Kachelgröße der Objekte (Breite × Tiefe) */
const FSIZE = {
  house: [5, 4], barn: [4, 4], silo: [2, 2], bakery: [3, 3], mill: [2, 2], dairy: [3, 3],
  shed: [3, 2], board: [1, 1], gate: [4, 1], field: [2, 2], tree: [2, 2]
};

/* Laden: was es zu kaufen gibt (cat = Reiter) */
const FSHOP = [
  { id: "field",   cat: "feld", n: "Feld",              i: "🟫", lv: 1, price: o => 15 + 10 * Math.max(0, o - 6), max: lv => Math.min(30, 6 + lv * 2), d: "Für Weizen, Mais, Gemüse – 2 Ernten je Saat." },
  { id: "t-apfel", cat: "feld", n: "Apfelbaum",         i: "🌳", lv: 1, tree: "apfel",   d: "Trägt alle 6 Stunden Äpfel." },
  { id: "t-kirsche", cat: "feld", n: "Kirschbaum",      i: "🌳", lv: 4, tree: "kirsche", d: "Werderaner Kirschen, alle 8 Stunden." },
  { id: "t-birne", cat: "feld", n: "Birnbaum",          i: "🌳", lv: 7, tree: "birne",   d: "Saftige Birnen, alle 9 Stunden." },
  { id: "a-huhn",  cat: "tier", n: "Huhn",              i: "🐔", lv: 1, animal: "huhn",  d: "Legt Eier, frisst Hühnerfutter." },
  { id: "a-kuh",   cat: "tier", n: "Kuh",               i: "🐄", lv: 3, animal: "kuh",   d: "Gibt Milch, frisst Kuhfutter." },
  { id: "coop",    cat: "bau",  n: "Hühnerstall",       i: "🛖", lv: 5, price: () => 300,  d: "Zweiter Stall mit Auslauf für bis zu 9 Hühner." },
  { id: "cows",    cat: "bau",  n: "Kuhstall mit Weide", i: "🏚️", lv: 3, price: () => 500,  d: "Unterstand und Weide für bis zu 6 Kühe." },
  { id: "dairy",   cat: "bau",  n: "Molkerei",          i: "🏭", lv: 4, price: () => 800,  d: "Butter, Pudding und Käse aus eigener Milch." }
];
/* Deko: kostet wenig, macht den Hof schön (bringt ein paar XP) */
const FDECO = {
  flowers:   { n: "Blumenbeet",    i: "🌷", price: 6,  lv: 2, sz: [1, 1] },
  bench:     { n: "Bank",          i: "🪑", price: 10,  lv: 2, sz: [1, 1] },
  bushes:    { n: "Busch",         i: "🌿", price: 5,  lv: 1, sz: [1, 1] },
  hayBale:   { n: "Heuballen",     i: "🟨", price: 4,  lv: 1, sz: [1, 1] },
  scarecrow: { n: "Vogelscheuche", i: "🧑‍🌾", price: 12, lv: 2, sz: [1, 1] },
  pumpkins:  { n: "Kürbisse",      i: "🎃", price: 10,  lv: 3, sz: [1, 1] },
  lamp:      { n: "Laterne",       i: "🏮", price: 16,  lv: 3, sz: [1, 1] },
  leafTree:  { n: "Linde",         i: "🌳", price: 14,  lv: 2, sz: [2, 2], arg: 1.1 },
  pine:      { n: "Tanne",         i: "🌲", price: 12,  lv: 2, sz: [2, 2], arg: 1.0 },
  cart:      { n: "Erntekarre",    i: "🛒", price: 18,  lv: 4, sz: [2, 1] },
  well:      { n: "Brunnen",       i: "⛲", price: 45, lv: 4, sz: [2, 2] },
  beehive:   { n: "Bienenkasten",  i: "🐝", price: 24,  lv: 5, sz: [1, 1] },
  mailbox:   { n: "Briefkasten",   i: "📮", price: 8,  lv: 1, sz: [1, 1] },
  rock:      { n: "Findling",      i: "🪨", price: 3,   lv: 1, sz: [1, 1], arg: 1.2 }
};

/* Freischaltungen je Level (Text für die Level-Feier) */
const FUNLOCK = {
  2: ["🍅 Tomaten", "🫓 Maisfladen", "🌷 Deko: Blumen, Bank, Bäume"],
  3: ["🥕 Karotten", "🐄 Kuhstall mit Weide", "🌿 Kuhfutter", "🥧 Apfelkuchen"],
  4: ["🚚 Spedition gründen", "🏭 Molkerei: Butter & Pudding", "🍒 Kirschbaum", "🧁 Möhren-Muffins"],
  5: ["🥔 Kartoffeln", "🧀 Käse", "🛖 zweiter Hühnerstall"],
  6: ["🍓 Erdbeeren", "🍕 Pizza", "🍰 Kirschtorte"],
  7: ["🎃 Kürbis", "🍐 Birnbaum"]
};
const FLOGI_LEVEL = 4;           /* ab hier fährt man auch für andere */

/* Der Hof liegt zwischen Werder und Glindow im Obstanbaugebiet an der Havel */
const FARM_NODE = "w-hof";
const FARM_PT = [52.3602, 12.9128];
const FARM_VIEW = { center: [52.372, 12.955], zoom: 12 };

/* Dörfer und Städte mit Kundschaft. lv = ab Level, w = Gewicht beim Würfeln */
const FTOWNS = {
  "w-werder":     { lv: 1, w: 5, cust: [
    ["Bäckerei Hahn",          ["weizen", "ei", "milch", "butter"]],
    ["Café Inselblick",        ["apfelkuchen", "muffins", "kirschtorte", "pudding", "milch"]],
    ["Edeka Werder",           ["apfel", "tomate", "karotte", "ei", "milch", "brot", "kartoffel"]],
    ["Gasthaus Zur Havel",     ["tomate", "kartoffel", "ei", "brot", "kaese", "kuerbis", "fladen"]]] },
  "w-glindow":    { lv: 1, w: 4, cust: [
    ["Hofladen Glindow",       ["apfel", "ei", "brot", "erdbeere", "birne"]],
    ["Kita Sonnenschein",      ["apfel", "karotte", "milch", "muffins", "birne", "pudding"]]] },
  "w-petzow":     { lv: 2, w: 3, cust: [
    ["Schlosscafé Petzow",     ["apfelkuchen", "kirschtorte", "pudding", "milch", "fladen"]],
    ["Hotel am Schwielowsee",  ["brot", "butter", "ei", "kaese", "erdbeere"]]] },
  "w-geltow":     { lv: 2, w: 3, cust: [
    ["Weberei-Café Geltow",    ["muffins", "apfelkuchen", "milch", "fladen"]],
    ["Landgasthof Geltow",     ["kartoffel", "ei", "tomate", "brot", "mais"]]] },
  "w-caputh":     { lv: 3, w: 3, cust: [
    ["Fischerhütte Caputh",    ["kartoffel", "brot", "tomate", "butter"]],
    ["Wochenmarkt Caputh",     ["apfel", "kirsche", "erdbeere", "karotte", "ei", "tomate"]]] },
  "w-michendorf": { lv: 4, w: 2, cust: [
    ["Landbäckerei Michendorf", ["weizen", "ei", "butter", "milch", "mais"]]] },
  "potsdam":      { lv: 3, w: 3, cust: [
    ["Wochenmarkt Bassinplatz", ["apfel", "birne", "kirsche", "tomate", "karotte", "kartoffel", "ei"]],
    ["Café am Park",            ["apfelkuchen", "kirschtorte", "pudding", "muffins"]],
    ["Pizzeria im Holländerviertel", ["pizza", "tomate", "kaese", "mais"]]] },
  "b-span":       { lv: 5, w: 2, cust: [
    ["Markthalle Spandau",      ["apfel", "kartoffel", "ei", "kaese", "brot", "kuerbis"]]] },
  "b-char":       { lv: 6, w: 1, cust: [
    ["Restaurant am Lietzensee", ["kaese", "butter", "erdbeere", "kirschtorte", "pizza"]]] },
  "b-kreuz":      { lv: 6, w: 1, cust: [
    ["Markthalle Kreuzberg",    ["kuerbis", "erdbeere", "kaese", "apfelkuchen", "milch"]]] }
};
/* Straßen der Kundschaft (Lieferadresse) */
const FTOWN_STREETS = {
  "w-werder": [["Eisenbahnstraße", 52.3772, 12.9367], ["Am Markt", 52.3795, 12.9386], ["Unter den Linden", 52.3768, 12.9320], ["Potsdamer Straße", 52.3752, 12.9445]],
  "w-glindow": [["Glindower Dorfstraße", 52.3636, 12.8958], ["Alpenstraße", 52.3655, 12.8992], ["Am Glindower See", 52.3620, 12.9010]],
  "w-petzow": [["Zelterstraße", 52.3546, 12.9442], ["Fercher Straße", 52.3530, 12.9420]],
  "w-geltow": [["Caputher Chaussee", 52.3730, 12.9880], ["Am Wasser", 52.3755, 12.9915]],
  "w-caputh": [["Straße der Einheit", 52.3460, 12.9998], ["Krughof", 52.3448, 13.0040]],
  "w-michendorf": [["Potsdamer Straße", 52.3138, 13.0262], ["Poststraße", 52.3120, 13.0230]],
  "potsdam": [["Bassinplatz", 52.4007, 13.0600], ["Mittelstraße", 52.4020, 13.0580], ["Brandenburger Straße", 52.3995, 13.0540]]
};

/* Opas Notizbuch: Aufgaben der Reihe nach. ev = Ereignis, n = Anzahl */
const FQUESTS = [
  { t: "Ernte 6 Sack Weizen",          ev: "harvest:weizen", n: 6,  r: { m: 10,  xp: 8 } },
  { t: "Backe 4 Brote",                ev: "make:brot",      n: 4,  r: { m: 15,  xp: 10 } },
  { t: "Sammle 6 Schachteln Eier",     ev: "collect:ei",     n: 6,  r: { m: 15,  xp: 10 } },
  { t: "Liefere 2 Bestellungen aus",   ev: "deliver",        n: 2,  r: { m: 25,  xp: 15 } },
  { t: "Kauf ein neues Feld",          ev: "buy:field",      n: 1,  r: { m: 15,  xp: 8 } },
  { t: "Gieße 6 Felder",               ev: "water",          n: 6,  r: { m: 15,  xp: 10 } },
  { t: "Mahle 8 Eimer Hühnerfutter",   ev: "make:hfutter",   n: 8,  r: { m: 15,  xp: 10 } },
  { t: "Kauf 2 Hühner",                ev: "buy:huhn",       n: 2,  r: { m: 20,  xp: 12 } },
  { t: "Pflanze Tomaten",              ev: "plant:tomate",   n: 2,  r: { m: 15,  xp: 10 } },
  { t: "Backe 2 Packungen Maisfladen", ev: "make:fladen",    n: 2,  r: { m: 25,  xp: 14 } },
  { t: "Bau den Kuhstall",             ev: "build:cows",     n: 1,  r: { m: 60, xp: 20 } },
  { t: "Melke 4 Kannen Milch",         ev: "collect:milch",  n: 4,  r: { m: 30,  xp: 16 } },
  { t: "Backe Apfelkuchen",            ev: "make:apfelkuchen", n: 2, r: { m: 30, xp: 18 } },
  { t: "Liefere nach Potsdam",         ev: "deliver:potsdam", n: 1, r: { m: 50, xp: 25 } },
  { t: "Erreiche Level 4",             ev: "level",          n: 4,  r: { m: 60, xp: 0 } },
  { t: "Bau die Molkerei",             ev: "build:dairy",    n: 1,  r: { m: 100, xp: 30 } },
  { t: "Mach 4 Stück Butter",          ev: "make:butter",    n: 4,  r: { m: 50, xp: 25 } },
  { t: "Vergrößere einen Auslauf",     ev: "pen",            n: 1,  r: { m: 60, xp: 25 } },
  { t: "Liefere 10 Bestellungen aus",  ev: "deliver",        n: 10, r: { m: 120, xp: 50 } },
  { t: "Erreiche 5 Sterne bei Eiern",  ev: "q5:ei",          n: 1,  r: { m: 100, xp: 40 } }
];

/* ------------------- Netzknoten rund um den Hof ----------------------
   Sie gehören nur zu Spielständen mit Hof (Feld 10 = "hof"); ältere
   Spielstände sehen sie nicht. Rad und Moped kommen überallhin.      */
NODES.push(
  ["w-hof",        "Hof",              52.3602, 12.9128, "EUR", 1, "br", "city", "Hof",        "hof"],
  ["w-werder",     "Werder (Havel)",   52.3786, 12.9352, "EUR", 1, "br", "city", "Werder",     "hof"],
  ["w-glindow",    "Glindow",          52.3640, 12.8965, "EUR", 1, "br", "city", "Glindow",    "hof"],
  ["w-petzow",     "Petzow",           52.3548, 12.9445, "EUR", 1, "br", "city", "Petzow",     "hof"],
  ["w-geltow",     "Geltow",           52.3742, 12.9895, "EUR", 1, "br", "city", "Geltow",     "hof"],
  ["w-caputh",     "Caputh",           52.3456, 13.0003, "EUR", 1, "br", "city", "Caputh",     "hof"],
  ["w-michendorf", "Michendorf",       52.3133, 13.0256, "EUR", 1, "br", "city", "Michendorf", "hof"]
);
/* Hofware: nur für Bestellungen aus den Dörfern, nie in Ausschreibungen */
CARGO.hof = { name: "Hofware", icon: "🧺", req: [], rate: 1.0, minStage: 99, minKg: 0.1, maxKg: 5000 };
