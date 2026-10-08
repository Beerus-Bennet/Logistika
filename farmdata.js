/* =========================================================================
   LOGISTIKA – farmdata.js
   Zahlen und Tabellen für den geerbten Hof: Waren, Pflanzen, Bäume, Tiere,
   Gebäude mit Rezepten, Freischaltungen je Level, Kundschaft in den Dörfern
   rund um Werder (Havel) und Opas Notizbuch (Aufgaben mit Belohnung).
   Zeiten in Spielminuten (bei 1× ist eine Spielminute eine Sekunde).
   Die Fischerei an der Ostsee steckt in fishdata.js und hängt sich hier
   ein (FSITES, gemeinsame Tabellen für Waren, Gebäude und Tiere).
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
  wolle:       { n: "Rohwolle",       i: "☁️", k: "ani",   a: 3,   u: "kg",     pk: "Vlies",         v: 6,   kg: 3,    xp: 6,  st: "barn" },
  spaket:      { n: "Schweinefleisch", i: "🥓", k: "meat", a: 5,   u: "kg",     pk: "Fleischpaket",  v: 50,  kg: 5,    xp: 12, st: "barn" },
  rpaket:      { n: "Rindfleisch",    i: "🥩", k: "meat",  a: 5,   u: "kg",     pk: "Fleischpaket",  v: 90,  kg: 5,    xp: 18, st: "barn" },
  hfutter:     { n: "Hühnerfutter",   i: "🥣", k: "feed",  a: 5,   u: "kg",     pk: "Eimer",         v: 2,   kg: 5,    xp: 1,  st: "barn" },
  kfutter:     { n: "Kuhfutter",      i: "🌿", k: "feed",  a: 20,  u: "kg",     pk: "Ballen",        v: 5,   kg: 20,   xp: 1,  st: "barn" },
  sfutter:     { n: "Schweinefutter", i: "🍠", k: "feed",  a: 25,  u: "kg",     pk: "Sack",          v: 7,   kg: 25,   xp: 1,  st: "barn" },
  schfutter:   { n: "Schaffutter",    i: "🍀", k: "feed",  a: 10,  u: "kg",     pk: "Sack",          v: 4,   kg: 10,   xp: 1,  st: "barn" },
  brot:        { n: "Brote",          i: "🍞", k: "bake",  a: 1,   u: "",       pk: "Laib",          v: 4.5, kg: 1,    xp: 4,  st: "barn", sg: "Brot" },
  fladen:      { n: "Maisfladen",     i: "🫓", k: "bake",  a: 4,   u: "",       pk: "4er-Pack",      v: 6,   kg: 0.5,  xp: 6,  st: "barn" },
  apfelkuchen: { n: "Apfelkuchen",    i: "🥧", k: "bake",  a: 1,   u: "",       pk: "Blech",         v: 18,  kg: 1.5,  xp: 10, st: "barn" },
  muffins:     { n: "Möhren-Muffins", i: "🧁", k: "bake",  a: 6,   u: "",       pk: "6er-Box",       v: 9,   kg: 0.6,  xp: 10, st: "barn", sg: "Möhren-Muffin" },
  kirschtorte: { n: "Kirschtorten",   i: "🍰", k: "bake",  a: 1,   u: "",       pk: "Torte",         v: 26,  kg: 2,    xp: 16, st: "barn", sg: "Kirschtorte" },
  pizza:       { n: "Pizzen",         i: "🍕", k: "bake",  a: 1,   u: "",       pk: "Stück",         v: 9,   kg: 0.7,  xp: 14, st: "barn", sg: "Pizza" },
  butter:      { n: "Butter",         i: "🧈", k: "dairy", a: 250, u: "g",      pk: "Stück",         v: 3.2, kg: 0.25, xp: 7,  st: "barn" },
  pudding:     { n: "Pudding",        i: "🍮", k: "dairy", a: 4,   u: "Becher", pk: "4er-Pack",      v: 5,   kg: 0.5,  xp: 8,  st: "barn" },
  kaese:       { n: "Käse",           i: "🧀", k: "dairy", a: 1,   u: "kg",     pk: "Laib",          v: 16,  kg: 1,    xp: 11, st: "barn" },
  bratwurst:   { n: "Bratwürste",     i: "🌭", k: "deli",  a: 10,  u: "",       pk: "10er-Pack",     v: 15,  kg: 1,    xp: 10, st: "barn", sg: "Bratwurst" },
  schinken:    { n: "Schinken",       i: "🍖", k: "deli",  a: 1,   u: "kg",     pk: "Stück",         v: 24,  kg: 1,    xp: 14, st: "barn" },
  gulasch:     { n: "Gulasch",        i: "🥘", k: "deli",  a: 400, u: "g",      pk: "Glas",          v: 9,   kg: 0.5,  xp: 8,  st: "barn" },
  garn:        { n: "Wollknäuel",     i: "🧶", k: "craft", a: 5,   u: "",       pk: "5er-Pack",      v: 15,  kg: 0.5,  xp: 8,  st: "barn", sg: "Wollknäuel" },
  socken:      { n: "Wollsocken",     i: "🧦", k: "craft", a: 1,   u: "Paar",   pk: "Paar",          v: 14,  kg: 0.1,  xp: 12, st: "barn" },
  pullover:    { n: "Pullover",       i: "🧥", k: "craft", a: 1,   u: "",       pk: "Stück",         v: 85,  kg: 0.6,  xp: 25, st: "barn", sg: "Pullover" }
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
   volle Qualität, house = Stalltyp, pl = Mehrzahl, act = was man beim
   Abholen tut. Masttiere (mast = Mahlzeiten bis schlachtreif) geben am Ende
   yield × out und gehen zum Metzger; danach kauft man junge Tiere nach. */
const FANIMALS = {
  huhn:   { n: "Huhn",   pl: "Hühner",  i: "🐔", out: "ei",     feed: "hfutter",   t: 90,  price: 12,  step: 3,  lv: 1, space: 4,    house: "coop",  max: 9, unit: "m²", act: "Eier einsammeln" },
  kuh:    { n: "Kuh",    pl: "Kühe",    i: "🐄", out: "milch",  feed: "kfutter",   t: 240, price: 350, step: 50, lv: 3, space: 1500, house: "cows",  max: 6, unit: "m²", act: "melken" },
  schwein:{ n: "Schwein", pl: "Schweine", i: "🐖", out: "spaket", feed: "sfutter",  t: 150, price: 70,  step: 10, lv: 4, space: 10,   house: "pigs",  max: 8, unit: "m²", mast: 3, yield: 3, young: "Ferkel", act: "zum Metzger bringen" },
  schaf:  { n: "Schaf",  pl: "Schafe",  i: "🐑", out: "wolle",  feed: "schfutter", t: 200, price: 120, step: 15, lv: 5, space: 250,  house: "sheep", max: 8, unit: "m²", act: "scheren" },
  rind:   { n: "Rind",   pl: "Rinder",  i: "🐂", out: "rpaket", feed: "kfutter",   t: 240, price: 220, step: 30, lv: 6, space: 2000, house: "beef",  max: 6, unit: "m²", mast: 4, yield: 4, young: "Kalb", act: "zum Metzger bringen" }
};
/* Auslauf je Ausbaustufe: Kacheln (w × d) und Fläche in m² (bei Fisch m³) */
const FPENS = {
  coop:  [{ w: 4, d: 3, m2: 18 },   { w: 5, d: 4, m2: 32 },   { w: 6, d: 5, m2: 50 },    { w: 7, d: 6, m2: 72 }],
  cows:  [{ w: 6, d: 5, m2: 3000 }, { w: 7, d: 6, m2: 5000 }, { w: 8, d: 7, m2: 7500 },  { w: 9, d: 8, m2: 10500 }],
  pigs:  [{ w: 5, d: 4, m2: 60 },   { w: 6, d: 5, m2: 100 },  { w: 7, d: 6, m2: 150 },   { w: 8, d: 7, m2: 220 }],
  sheep: [{ w: 5, d: 5, m2: 1200 }, { w: 6, d: 5, m2: 1800 }, { w: 7, d: 6, m2: 2600 },  { w: 8, d: 7, m2: 3600 }],
  beef:  [{ w: 6, d: 5, m2: 6000 }, { w: 7, d: 6, m2: 9000 }, { w: 8, d: 7, m2: 12500 }, { w: 9, d: 8, m2: 16000 }]
};
const FPEN_COST = { coop: [0, 60, 150, 320], cows: [0, 200, 450, 900], pigs: [0, 120, 280, 550], sheep: [0, 150, 320, 600], beef: [0, 250, 500, 950] };
/* Namen rund um den Stall: Gebäude, Fläche, Symbol, Wert beim Hofverkauf */
const FPEN_META = {
  coop:  { n: "Hühnerstall",    i: "🛖", area: "Auslauf", val: 1500 },
  cows:  { n: "Kuhstall",       i: "🏚️", area: "Weide",   val: 5000 },
  pigs:  { n: "Schweinestall",  i: "🐷", area: "Auslauf", val: 3500 },
  sheep: { n: "Schafweide",     i: "🐑", area: "Weide",   val: 3000 },
  beef:  { n: "Rinderweide",    i: "🐂", area: "Weide",   val: 6000 }
};
/* Haltung nach Platz je Tier (Verhältnis zum Ideal) */
const FKEEP = [
  { r: 2.0,  st: 5, n: "Bio-Weidehaltung" },
  { r: 1.25, st: 4, n: "Freiland plus" },
  { r: 0.9,  st: 3, n: "Freilandhaltung" },
  { r: 0.5,  st: 2, n: "Bodenhaltung" },
  { r: 0,    st: 1, n: "zu eng – Massenhaltung" }
];

/* Gebäude mit Rezepten. in = Zutaten, t = Minuten, lv = ab Level.
   cost = Geld je Durchgang (Diesel), by = Nebenprodukt, luck = Chance auf
   ein Gebinde extra, tq = Dauer beim allerersten Mal im Rundgang.         */
const FMACHINES = {
  mill: { n: "Futtermühle", i: "🌬️", recipes: [
    { id: "hfutter",   in: { weizen: 1, mais: 1 },    out: 4, t: 20, lv: 1 },
    { id: "kfutter",   in: { weizen: 1, mais: 1 },    out: 1, t: 30, lv: 3 },
    { id: "sfutter",   in: { mais: 1, karotte: 1 },   out: 2, t: 40, lv: 4 },
    { id: "schfutter", in: { weizen: 1, karotte: 1 }, out: 2, t: 35, lv: 5 }
  ] },
  bakery: { n: "Backofen", i: "🔥", recipes: [
    { id: "brot",        in: { weizen: 1 },                                  out: 4, t: 45,  lv: 1, tq: 4 },
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
  ] },
  butcher: { n: "Metzgerei", i: "🔪", recipes: [
    { id: "bratwurst", in: { spaket: 1 },             out: 4,  t: 60,  lv: 5 },
    { id: "schinken",  in: { spaket: 1 },             out: 3,  t: 180, lv: 6 },
    { id: "gulasch",   in: { rpaket: 1, tomate: 1 },  out: 12, t: 150, lv: 7 }
  ] },
  spinnery: { n: "Spinnstube", i: "🧶", recipes: [
    { id: "garn",     in: { wolle: 1 }, out: 2, t: 60,  lv: 5 },
    { id: "socken",   in: { garn: 1 },  out: 3, t: 120, lv: 6 },
    { id: "pullover", in: { garn: 2 },  out: 1, t: 240, lv: 7 }
  ] }
};
const FSLOT_COST = [0, 0, 60, 180, 450, 1000];   /* Preis für Platz 3, 4, 5 … in der Warteschlange */
/* Wert eines Gebäudes beim Verkauf des Hofs */
const FBUILD_VAL = { dairy: 6000, butcher: 7000, spinnery: 4500 };

/* Lager: Grundgröße, Zuwachs und Preise je Ausbaustufe */
const FSTORE = {
  silo: { n: "Silo",    i: "🌾", the: "Das Silo",     base: 60, step: 40, cost: [80, 200, 400, 750, 1200, 2000],
          empty: "Leer. Ernte Felder und Bäume – die Ernte kommt hierher." },
  barn: { n: "Scheune", i: "🏚️", the: "Die Scheune", base: 40, step: 30, cost: [90, 220, 450, 850, 1350, 2200],
          empty: "Leer. Eier, Milch, Futter und alles aus Ofen, Molkerei und Metzgerei landen hier." }
};

/* Kachelgröße der Objekte (Breite × Tiefe) */
const FSIZE = {
  house: [5, 4], barn: [4, 4], silo: [2, 2], bakery: [3, 3], mill: [2, 2], dairy: [3, 3], butcher: [3, 3], spinnery: [3, 3],
  shed: [3, 2], board: [1, 1], gate: [4, 1], field: [2, 2], tree: [2, 2]
};
/* lassen sich nicht verschieben */
const FFIXED = new Set(["house"]);

/* Laden: was es zu kaufen gibt (cat = Reiter) */
const FSHOP_HOF = [
  { id: "field",   cat: "feld", n: "Feld",              i: "🟫", lv: 1, price: o => 15 + 10 * Math.max(0, o - 6), max: lv => Math.min(30, 6 + lv * 2), d: "Für Weizen, Mais, Gemüse – 2 Ernten je Saat." },
  { id: "t-apfel", cat: "feld", n: "Apfelbaum",         i: "🌳", lv: 1, tree: "apfel",   d: "Trägt alle 6 Stunden Äpfel." },
  { id: "t-kirsche", cat: "feld", n: "Kirschbaum",      i: "🌳", lv: 4, tree: "kirsche", d: "Werderaner Kirschen, alle 8 Stunden." },
  { id: "t-birne", cat: "feld", n: "Birnbaum",          i: "🌳", lv: 7, tree: "birne",   d: "Saftige Birnen, alle 9 Stunden." },
  { id: "a-huhn",  cat: "tier", n: "Huhn",              i: "🐔", lv: 1, animal: "huhn",    d: "Legt Eier, frisst Hühnerfutter." },
  { id: "a-kuh",   cat: "tier", n: "Kuh",               i: "🐄", lv: 3, animal: "kuh",     d: "Gibt Milch, frisst Kuhfutter." },
  { id: "a-schwein", cat: "tier", n: "Ferkel",          i: "🐖", lv: 4, animal: "schwein", d: "Frisst Schweinefutter – nach drei Mahlzeiten geht es zum Metzger: 15 kg Fleisch." },
  { id: "a-schaf", cat: "tier", n: "Schaf",             i: "🐑", lv: 5, animal: "schaf",   d: "Frisst Schaffutter und wird geschoren: ein Vlies Rohwolle je Durchgang." },
  { id: "a-rind",  cat: "tier", n: "Kalb",              i: "🐂", lv: 6, animal: "rind",    d: "Frisst Kuhfutter – nach vier Mahlzeiten geht es zum Metzger: 20 kg Rindfleisch." },
  { id: "coop",    cat: "bau",  n: "Hühnerstall",       i: "🛖", lv: 5, price: () => 300,  lim: lv => lv >= 5 ? 2 : 1, d: "Zweiter Stall mit Auslauf für bis zu 9 Hühner." },
  { id: "cows",    cat: "bau",  n: "Kuhstall mit Weide", i: "🏚️", lv: 3, price: () => 500,  lim: lv => lv >= 8 ? 2 : 1, d: "Unterstand und Weide für bis zu 6 Kühe." },
  { id: "pigs",    cat: "bau",  n: "Schweinestall",     i: "🐷", lv: 4, price: () => 400,  lim: () => 1, d: "Stall mit Suhle und Auslauf für bis zu 8 Schweine." },
  { id: "dairy",   cat: "bau",  n: "Molkerei",          i: "🏭", lv: 4, price: () => 800,  lim: () => 1, d: "Butter, Pudding und Käse aus eigener Milch." },
  { id: "sheep",   cat: "bau",  n: "Schafweide",        i: "🐑", lv: 5, price: () => 450,  lim: () => 1, d: "Weide mit Unterstand für bis zu 8 Schafe." },
  { id: "butcher", cat: "bau",  n: "Metzgerei",         i: "🔪", lv: 5, price: () => 900,  lim: () => 1, d: "Bratwurst, Schinken und Gulasch aus eigenem Fleisch." },
  { id: "spinnery", cat: "bau", n: "Spinnstube",        i: "🧶", lv: 5, price: () => 700,  lim: () => 1, d: "Spinnrad und Stricknadeln: Garn, Socken, Pullover." },
  { id: "beef",    cat: "bau",  n: "Rinderweide",       i: "🐂", lv: 6, price: () => 600,  lim: () => 1, d: "Große Weide mit Unterstand für bis zu 6 Rinder." }
];
const FSHOP_CATS_HOF = [["feld", "🌱 Felder & Bäume"], ["tier", "🐔 Tiere"], ["bau", "🏗️ Gebäude"], ["deko", "🌷 Deko"]];
/* Deko: kostet wenig, macht den Hof schön (bringt ein paar XP).
   s = nur auf dem Hof ("hof") oder nur an der Küste ("fisch"); water = steht im Wasser */
const FDECO = {
  flowers:   { n: "Blumenbeet",    i: "🌷", price: 6,  lv: 2, sz: [1, 1] },
  bench:     { n: "Bank",          i: "🪑", price: 10, lv: 2, sz: [1, 1] },
  bushes:    { n: "Busch",         i: "🌿", price: 5,  lv: 1, sz: [1, 1] },
  hayBale:   { n: "Heuballen",     i: "🟨", price: 4,  lv: 1, sz: [1, 1], s: "hof" },
  scarecrow: { n: "Vogelscheuche", i: "🧑‍🌾", price: 12, lv: 2, sz: [1, 1], s: "hof" },
  pumpkins:  { n: "Kürbisse",      i: "🎃", price: 10, lv: 3, sz: [1, 1], s: "hof" },
  lamp:      { n: "Laterne",       i: "🏮", price: 16, lv: 3, sz: [1, 1] },
  leafTree:  { n: "Linde",         i: "🌳", price: 14, lv: 2, sz: [2, 2], arg: 1.1 },
  pine:      { n: "Tanne",         i: "🌲", price: 12, lv: 2, sz: [2, 2], arg: 1.0 },
  cart:      { n: "Erntekarre",    i: "🛒", price: 18, lv: 4, sz: [2, 1], s: "hof" },
  well:      { n: "Brunnen",       i: "⛲", price: 45, lv: 4, sz: [2, 2], s: "hof" },
  beehive:   { n: "Bienenkasten",  i: "🐝", price: 24, lv: 5, sz: [1, 1], s: "hof" },
  mailbox:   { n: "Briefkasten",   i: "📮", price: 8,  lv: 1, sz: [1, 1] },
  rock:      { n: "Findling",      i: "🪨", price: 3,  lv: 1, sz: [1, 1], arg: 1.2 }
};

/* Freischaltungen je Level (Text für die Level-Feier) */
const FUNLOCK_HOF = {
  2: ["🍅 Tomaten", "🫓 Maisfladen", "🌷 Deko: Blumen, Bank, Bäume"],
  3: ["🥕 Karotten", "🐄 Kuhstall mit Weide", "🌿 Kuhfutter", "🥧 Apfelkuchen"],
  4: ["🐷 Schweinestall & Ferkel", "🍠 Schweinefutter", "🏭 Molkerei: Butter & Pudding", "🍒 Kirschbaum", "🧁 Möhren-Muffins"],
  5: ["🐑 Schafweide & Schafe", "🔪 Metzgerei: Bratwurst", "🧶 Spinnstube: Garn", "🥔 Kartoffeln", "🧀 Käse", "🛖 zweiter Hühnerstall"],
  6: ["🐂 Rinderweide & Kälber", "🍖 Schinken", "🧦 Wollsocken", "🍓 Erdbeeren", "🍕 Pizza", "🍰 Kirschtorte"],
  7: ["🥘 Gulasch", "🧥 Pullover", "🎃 Kürbis", "🍐 Birnbaum"]
};

/* Dörfer und Städte mit Kundschaft. lv = ab Level, w = Gewicht beim Würfeln */
const FTOWNS_HOF = {
  "w-werder":     { lv: 1, w: 5, cust: [
    ["Bäckerei Hahn",          ["weizen", "ei", "milch", "butter"]],
    ["Café Inselblick",        ["apfelkuchen", "muffins", "kirschtorte", "pudding", "milch"]],
    ["Edeka Werder",           ["apfel", "tomate", "karotte", "ei", "milch", "brot", "kartoffel", "bratwurst"]],
    ["Gasthaus Zur Havel",     ["tomate", "kartoffel", "ei", "brot", "kaese", "kuerbis", "fladen", "spaket", "gulasch"]]] },
  "w-glindow":    { lv: 1, w: 4, cust: [
    ["Hofladen Glindow",       ["apfel", "ei", "brot", "erdbeere", "birne", "schinken", "socken"]],
    ["Kita Sonnenschein",      ["apfel", "karotte", "milch", "muffins", "birne", "pudding"]]] },
  "w-petzow":     { lv: 2, w: 3, cust: [
    ["Schlosscafé Petzow",     ["apfelkuchen", "kirschtorte", "pudding", "milch", "fladen"]],
    ["Hotel am Schwielowsee",  ["brot", "butter", "ei", "kaese", "erdbeere", "rpaket", "schinken"]]] },
  "w-geltow":     { lv: 2, w: 3, cust: [
    ["Weberei-Café Geltow",    ["muffins", "apfelkuchen", "milch", "fladen", "garn", "socken", "pullover"]],
    ["Landgasthof Geltow",     ["kartoffel", "ei", "tomate", "brot", "mais", "spaket", "bratwurst"]]] },
  "w-caputh":     { lv: 3, w: 3, cust: [
    ["Fischerhütte Caputh",    ["kartoffel", "brot", "tomate", "butter"]],
    ["Wochenmarkt Caputh",     ["apfel", "kirsche", "erdbeere", "karotte", "ei", "tomate", "wolle", "garn"]]] },
  "w-michendorf": { lv: 4, w: 2, cust: [
    ["Landbäckerei Michendorf", ["weizen", "ei", "butter", "milch", "mais"]],
    ["Fleischerei Michendorf",  ["spaket", "rpaket", "bratwurst"]]] },
  "potsdam":      { lv: 3, w: 3, cust: [
    ["Wochenmarkt Bassinplatz", ["apfel", "birne", "kirsche", "tomate", "karotte", "kartoffel", "ei", "schinken"]],
    ["Café am Park",            ["apfelkuchen", "kirschtorte", "pudding", "muffins"]],
    ["Pizzeria im Holländerviertel", ["pizza", "tomate", "kaese", "mais"]],
    ["Wollladen Brandenburger Straße", ["garn", "socken", "pullover"]]] },
  "b-span":       { lv: 5, w: 2, cust: [
    ["Markthalle Spandau",      ["apfel", "kartoffel", "ei", "kaese", "brot", "kuerbis", "bratwurst"]]] },
  "b-char":       { lv: 6, w: 1, cust: [
    ["Restaurant am Lietzensee", ["kaese", "butter", "erdbeere", "kirschtorte", "pizza", "rpaket", "gulasch"]]] },
  "b-kreuz":      { lv: 6, w: 1, cust: [
    ["Markthalle Kreuzberg",    ["kuerbis", "erdbeere", "kaese", "apfelkuchen", "milch", "schinken", "pullover"]]] }
};
/* Straßen der Kundschaft (Lieferadresse) */
const FTOWN_STREETS_HOF = {
  "w-werder": [["Eisenbahnstraße", 52.3772, 12.9367], ["Am Markt", 52.3795, 12.9386], ["Unter den Linden", 52.3768, 12.9320], ["Potsdamer Straße", 52.3752, 12.9445]],
  "w-glindow": [["Glindower Dorfstraße", 52.3636, 12.8958], ["Alpenstraße", 52.3655, 12.8992], ["Am Glindower See", 52.3620, 12.9010]],
  "w-petzow": [["Zelterstraße", 52.3546, 12.9442], ["Fercher Straße", 52.3530, 12.9420]],
  "w-geltow": [["Caputher Chaussee", 52.3730, 12.9880], ["Am Wasser", 52.3755, 12.9915]],
  "w-caputh": [["Straße der Einheit", 52.3460, 12.9998], ["Krughof", 52.3448, 13.0040]],
  "w-michendorf": [["Potsdamer Straße", 52.3138, 13.0262], ["Poststraße", 52.3120, 13.0230]],
  "potsdam": [["Bassinplatz", 52.4007, 13.0600], ["Mittelstraße", 52.4020, 13.0580], ["Brandenburger Straße", 52.3995, 13.0540]]
};

/* Opas Notizbuch: der Hof als Durchlauf in vier Kapiteln. Erst wenn alles
   abgehakt ist, läuft der Hof – dann kommt die Spedition.
   ev = Ereignis, das zählt (n mal) · chk = Zustand, der reicht (z. B. „steht
   schon“) · c = Kapitel · r = Belohnung (€, EP)                          */
const FCHAPTERS_HOF = [
  { n: "Ankommen",   t: "Der erste Tag auf Opas Hof",                 r: { m: 50,  xp: 30 },
    opa: "Felder, Hühner, Ofen – das ist das Herz vom Hof. Wenn das läuft, kommen auch die Leute aus dem Dorf von allein." },
  { n: "Wachsen",    t: "Kühe, Kuchen und die ersten Stammkunden",   r: { m: 100, xp: 60 },
    opa: "Eine Kuh macht Arbeit, aber ohne Milch kein Kuchen. Und die Potsdamer zahlen gut für ehrliche Ware." },
  { n: "Vieh & Handwerk", t: "Schweine, Schafe, Wurst und Wolle",    r: { m: 180, xp: 80 },
    opa: "Ein Hof lebt von Kreisläufen: Was auf dem Feld wächst, frisst das Vieh – und was das Vieh gibt, macht die Küche zu Geld." },
  { n: "Meisterhof", t: "Molkerei, beste Qualität und volle Regale", r: { m: 250, xp: 100 },
    opa: "Gute Ware braucht Platz und Geduld. Gib den Tieren Raum, dann schmeckt man es." }
];
const fcount = t => S.farm.objs.filter(o => o.t === t).length;
const fanimals = t => S.farm.objs.filter(o => o.t === t).reduce((a, o) => a + o.animals.length, 0);
const FQUESTS_HOF = [
  /* Kapitel 1 – Ankommen */
  { c: 0, t: "Ernte 6 Sack Weizen",             ev: "harvest:weizen",   n: 6,  r: { m: 10,  xp: 8 } },
  { c: 0, t: "Backe 4 Brote",                   ev: "make:brot",        n: 4,  r: { m: 15,  xp: 10 } },
  { c: 0, t: "Sammle 6 Schachteln Eier",        ev: "collect:ei",       n: 6,  r: { m: 15,  xp: 10 } },
  { c: 0, t: "Liefere 2 Bestellungen aus",      ev: "deliver",          n: 2,  r: { m: 25,  xp: 15 } },
  { c: 0, t: "Kauf ein neues Feld",             chk: () => fcount("field") >= 7,       n: 1, r: { m: 15, xp: 8 } },
  { c: 0, t: "Gieße 6 Felder",                  ev: "water",            n: 6,  r: { m: 15,  xp: 10 } },
  { c: 0, t: "Mahle 8 Eimer Hühnerfutter",      ev: "make:hfutter",     n: 8,  r: { m: 15,  xp: 10 } },
  { c: 0, t: "Halte 5 Hühner",                  chk: () => fanimals("coop") >= 5,      n: 1, r: { m: 20, xp: 12 } },
  { c: 0, t: "Erreiche Level 2",                ev: "level",            n: 2,  r: { m: 20,  xp: 0 } },
  { c: 0, t: "Pflanze Tomaten auf 2 Feldern",   ev: "plant:tomate",     n: 2,  r: { m: 15,  xp: 10 } },
  { c: 0, t: "Backe 8 Maisfladen",              ev: "make:fladen",      n: 2,  r: { m: 25,  xp: 14 } },
  { c: 0, t: "Stell eine neue Deko auf",        ev: "buy:deco",         n: 1,  r: { m: 10,  xp: 5 } },
  /* Kapitel 2 – Wachsen */
  { c: 1, t: "Erreiche Level 3",                ev: "level",            n: 3,  r: { m: 30,  xp: 0 } },
  { c: 1, t: "Bau den Kuhstall",                chk: () => fcount("cows") >= 1,        n: 1, r: { m: 60, xp: 20 } },
  { c: 1, t: "Halte 2 Kühe",                    chk: () => fanimals("cows") >= 2,      n: 1, r: { m: 40, xp: 16 } },
  { c: 1, t: "Mahle 2 Ballen Kuhfutter",        ev: "make:kfutter",     n: 2,  r: { m: 15,  xp: 10 } },
  { c: 1, t: "Melke 4 Kannen Milch",            ev: "collect:milch",    n: 4,  r: { m: 30,  xp: 16 } },
  { c: 1, t: "Pflanze Karotten auf 2 Feldern",  ev: "plant:karotte",    n: 2,  r: { m: 15,  xp: 10 } },
  { c: 1, t: "Backe 4 Apfelkuchen",             ev: "make:apfelkuchen", n: 4,  r: { m: 30,  xp: 18 } },
  { c: 1, t: "Liefere nach Potsdam",            ev: "deliver:potsdam",  n: 1,  r: { m: 50,  xp: 25 } },
  { c: 1, t: "Liefere 8 Bestellungen aus",      ev: "deliver",          n: 8,  r: { m: 60,  xp: 30 } },
  { c: 1, t: "Erreiche Level 4",                ev: "level",            n: 4,  r: { m: 60,  xp: 0 } },
  /* Kapitel 3 – Vieh & Handwerk */
  { c: 2, t: "Bau den Schweinestall",           chk: () => fcount("pigs") >= 1,        n: 1, r: { m: 60, xp: 20 } },
  { c: 2, t: "Halte 3 Schweine",                chk: () => fanimals("pigs") >= 3,      n: 1, r: { m: 30, xp: 14 } },
  { c: 2, t: "Mische 4 Sack Schweinefutter",    ev: "make:sfutter",     n: 4,  r: { m: 20,  xp: 12 } },
  { c: 2, t: "Bring 2 Schweine zum Metzger",    ev: "slaughter:schwein", n: 2, r: { m: 50,  xp: 24 } },
  { c: 2, t: "Erreiche Level 5",                ev: "level",            n: 5,  r: { m: 80,  xp: 0 } },
  { c: 2, t: "Bau die Schafweide",              chk: () => fcount("sheep") >= 1,       n: 1, r: { m: 60, xp: 20 } },
  { c: 2, t: "Schere 3 Schafe",                 ev: "collect:wolle",    n: 3,  r: { m: 40,  xp: 18 } },
  { c: 2, t: "Bau die Metzgerei",               chk: () => fcount("butcher") >= 1,     n: 1, r: { m: 80, xp: 25 } },
  { c: 2, t: "Mach 40 Bratwürste",              ev: "make:bratwurst",   n: 4,  r: { m: 50,  xp: 22 } },
  { c: 2, t: "Bau die Spinnstube",              chk: () => fcount("spinnery") >= 1,    n: 1, r: { m: 70, xp: 22 } },
  { c: 2, t: "Spinne 20 Wollknäuel",            ev: "make:garn",        n: 4,  r: { m: 40,  xp: 18 } },
  /* Kapitel 4 – Meisterhof */
  { c: 3, t: "Pflanze einen Kirschbaum",        chk: () => S.farm.objs.some(o => o.t === "tree" && o.kind === "kirsche"), n: 1, r: { m: 30, xp: 15 } },
  { c: 3, t: "Bau die Molkerei",                chk: () => fcount("dairy") >= 1,       n: 1, r: { m: 100, xp: 30 } },
  { c: 3, t: "Mach 1 kg Butter",                ev: "make:butter",      n: 4,  r: { m: 50,  xp: 25 } },
  { c: 3, t: "Backe 18 Möhren-Muffins",         ev: "make:muffins",     n: 3,  r: { m: 40,  xp: 20 } },
  { c: 3, t: "Vergrößere einen Auslauf",        chk: () => S.farm.objs.some(o => FPENS[o.t] && o.lvl >= 2), n: 1, r: { m: 60, xp: 25 } },
  { c: 3, t: "Bau das Silo aus",                chk: () => (S.farm.cap.silo || 1) >= 2, n: 1, r: { m: 40, xp: 15 } },
  { c: 3, t: "Erreiche 5 Sterne bei Eiern",     ev: "q5:ei",            n: 1,  r: { m: 80,  xp: 30 } },
  { c: 3, t: "Mach 2 kg Käse",                  ev: "make:kaese",       n: 2,  r: { m: 60,  xp: 25 } },
  { c: 3, t: "Ernte 20 kg Kartoffeln",          ev: "harvest:kartoffel", n: 4, r: { m: 40,  xp: 20 } },
  { c: 3, t: "Erreiche Level 6",                ev: "level",            n: 6,  r: { m: 100, xp: 0 } },
  { c: 3, t: "Bau die Rinderweide",             chk: () => fcount("beef") >= 1,        n: 1, r: { m: 80, xp: 25 } },
  { c: 3, t: "Stricke 3 Paar Wollsocken",       ev: "make:socken",      n: 3,  r: { m: 50,  xp: 22 } },
  { c: 3, t: "Backe 4 Pizzen",                  ev: "make:pizza",       n: 4,  r: { m: 80,  xp: 30 } },
  { c: 3, t: "Backe 2 Kirschtorten",            ev: "make:kirschtorte", n: 2,  r: { m: 100, xp: 35 } },
  { c: 3, t: "Ernte 2 kg Erdbeeren",            ev: "harvest:erdbeere", n: 4,  r: { m: 80,  xp: 30 } },
  { c: 3, t: "Liefere 15 Bestellungen aus",     ev: "deliver",          n: 15, r: { m: 150, xp: 60 } }
];
/* Spielstände vor v38: Index im alten Notizbuch → Index im Notizbuch von v38 */
const FQUEST_OLD = [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 13, 16, 18, 19, 21, 23, 24, 26, 20, 28];
/* Notizbuch von v38 (Titel) – damit Spielstände an derselben Aufgabe weitermachen */
const FQUEST_V2_TITLES = [
  "Ernte 6 Sack Weizen", "Backe 4 Brote", "Sammle 6 Schachteln Eier", "Liefere 2 Bestellungen aus", "Kauf ein neues Feld",
  "Gieße 6 Felder", "Mahle 8 Eimer Hühnerfutter", "Halte 5 Hühner", "Erreiche Level 2", "Pflanze Tomaten auf 2 Feldern",
  "Backe 8 Maisfladen", "Stell eine neue Deko auf", "Erreiche Level 3", "Bau den Kuhstall", "Halte 2 Kühe",
  "Mahle 2 Ballen Kuhfutter", "Melke 4 Kannen Milch", "Pflanze Karotten auf 2 Feldern", "Backe 4 Apfelkuchen", "Liefere nach Potsdam",
  "Liefere 8 Bestellungen aus", "Erreiche Level 4", "Pflanze einen Kirschbaum", "Bau die Molkerei", "Mach 1 kg Butter",
  "Backe 18 Möhren-Muffins", "Vergrößere einen Auslauf", "Bau das Silo aus", "Erreiche 5 Sterne bei Eiern", "Erreiche Level 5",
  "Mach 2 kg Käse", "Ernte 20 kg Kartoffeln", "Erreiche Level 6", "Backe 4 Pizzen", "Backe 2 Kirschtorten",
  "Ernte 2 kg Erdbeeren", "Liefere 15 Bestellungen aus"
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

/* ----------------------------- Erbstücke --------------------------------
   Ein Spielstand hat genau ein Erbe: den Obsthof bei Werder oder die
   Fischerei an der Ostsee (fishdata.js). farmUseSite() schaltet alle
   Tabellen und Texte auf das Erbe des Spielstands um.                    */
const FSITES = {
  hof: {
    kind: "hof", node: "w-hof", pt: [52.3602, 12.9128], view: { center: [52.372, 12.955], zoom: 12 },
    cargo: "hof", stores: ["silo", "barn"], base: 45000, near: "potsdam",
    shop: FSHOP_HOF, cats: FSHOP_CATS_HOF, quests: FQUESTS_HOF, chapters: FCHAPTERS_HOF,
    towns: FTOWNS_HOF, streets: FTOWN_STREETS_HOF, unlock: FUNLOCK_HOF,
    addr: "Plötziner Weg 4", area: "Werder",
    T: {
      place: "Hof", the: "der Hof", The: "Der Hof", at: "auf dem Hof", to: "auf den Hof", of: "vom Hof", gen: "des Hofs",
      title: c => "Hof " + c, short: "Hof", pin: "🏡", tab: "Hof", tabIcon: "🏡", ledger: "Hof",
      hud: "Erbhof · Werder (Havel)", where: "Werder (Havel)", heir: "Erbe von Opa Hinrich",
      elder: "Opa", elderName: "Opa Hinrich", book: "Opas Notizbuch", bookShort: "Notizbuch", bookIcon: "📒",
      letterHead: "Opas Brief",
      letter: "Mein liebes Enkelkind, der Hof gehört jetzt dir. Er ist ein bisschen heruntergekommen, aber das Herz ist gut: Die Hühner wollen morgens ihr Futter, der Ofen braucht Geduld, und die Leute in Werder zahlen gut für ehrliche Ware. Hinterm Zaun wartet der Wald, und irgendwann vielleicht auch der See. Lina hilft dir beim Ausliefern – sie kennt jede Abkürzung. Mach was draus. Dein Opa Hinrich",
      doneHead: "Alles läuft!", doneSub: "Hof, Wald, Sägewerk und See – Opa wäre stolz.",
      doneQuote: "Du hast alles geschafft, was ich aufgeschrieben habe – und noch viel mehr. Hof, Wald, Sägewerk und die Fischerei am See gehören jetzt dir, ganz und gar. Und wenn dir die Gegend zu klein wird: Lina kennt jede Straße bis nach Berlin.",
      doneMsg: "Chef, Opas Notizbuch ist abgehakt – Hof, Sägewerk und Fischerei laufen wie geschmiert. Die Leute fragen ständig, ob wir nicht auch ihre Pakete mitnehmen. "
        + "Wenn du willst, gründen wir eine richtige Spedition – das Erbe läuft nebenher weiter. Tipp im Hof auf „Spedition gründen“.",
      bookHint: "Arbeite Opas Notizbuch ab – elf Kapitel: erst der Hof, dann Wald, Sägewerk und der See. Wenn alles läuft, kannst du eine Spedition gründen und auch für andere fahren.",
      welcome: n => "🏡 Willkommen auf deinem Hof, " + n + "!",
      noOrders: "Gerade keine Bestellung. Neue kommen von allein – bald auch aus Potsdam und Berlin.",
      atHere: "am Hof", vehNone: "Kein Fahrzeug am Hof – es kommt zur Abholung angefahren.",
      sellHead: "Hof verkaufen?", sold: "🏡 Hof verkauft für ",
      sellText: "Für {p} geht der Hof samt Tieren, Feldern und Lager an einen Nachbarn. Fahrzeuge und Spedition bleiben. Das lässt sich nicht rückgängig machen.",
      keepText: "Du kannst den Hof behalten und jederzeit über „Hof“ besuchen – oder ihn verkaufen und mit dem Geld die Spedition ausbauen. Ein Verkauf ist endgültig.",
      valHead: "Hofwert heute", tour: "🎓 Rundgang mit Lina", tourMenu: "🎓 Hof-Rundgang mit Lina",
      foundText: "Ab jetzt kommen auch fremde Aufträge: Pakete, Paletten, Express – erst rund um Berlin, später weltweit. Der Hof läuft weiter und liefert wie bisher. Lina zeigt dir, wie Aufträge laufen.",
      notYet: "Erst die Spedition gründen – das geht, sobald Opas Notizbuch abgehakt ist: Hof, Wald, Sägewerk und See."
    }
  }
};
/* aktuelles Erbe – farmUseSite() setzt alles */
let FSITE = FSITES.hof;
let FARM_NODE = "w-hof";
let FARM_PT = [52.3602, 12.9128];
let FARM_VIEW = { center: [52.372, 12.955], zoom: 12 };
let FSHOP = FSHOP_HOF, FSHOP_CATS = FSHOP_CATS_HOF, FQUESTS = FQUESTS_HOF, FCHAPTERS = FCHAPTERS_HOF;
let FTOWNS = FTOWNS_HOF, FTOWN_STREETS = FTOWN_STREETS_HOF, FUNLOCK = FUNLOCK_HOF;
function farmUseSite(kind) {
  const s = FSITES[kind] || FSITES.hof;
  FSITE = s;
  FARM_NODE = s.node; FARM_PT = s.pt; FARM_VIEW = s.view;
  FSHOP = s.shop; FSHOP_CATS = s.cats; FQUESTS = s.quests; FCHAPTERS = s.chapters;
  FTOWNS = s.towns; FTOWN_STREETS = s.streets; FUNLOCK = s.unlock;
  if (typeof LEDGER_KIND !== "undefined" && LEDGER_KIND.farm) LEDGER_KIND.farm = { icon: s.T.pin, name: s.T.ledger };
  return s;
}
const FT = () => FSITE.T;
