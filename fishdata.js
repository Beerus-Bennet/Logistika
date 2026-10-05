/* =========================================================================
   LOGISTIKA – fishdata.js
   Das zweite Erbe: Tante Gesches Fischerei in Warnemünde. Kutter mit
   Fangfahrten, Reusen für Krabben und Garnelen, Muschelleinen (mit Perlen),
   ein Netzgehege für Forellen, Fischhalle, Räucherei, Futterküche,
   Fischbude und eine Schmiede für Perlenschmuck. Kundschaft an der Küste
   zwischen Kühlungsborn und Graal-Müritz, Tante Gesches Logbuch in drei
   Kapiteln. Preise: Direktvermarktung an der Ostseeküste, Stand 2026.
   ========================================================================= */

Object.assign(FITEMS, {
  /* frischer Fang (Kühlhaus) */
  hering:          { n: "Hering",            i: "🐟", k: "fang",  a: 2,   u: "kg", pk: "Kiste",     v: 7,    kg: 2,    xp: 2,  st: "kuehl" },
  dorsch:          { n: "Dorsch",            i: "🐡", k: "fang",  a: 2,   u: "kg", pk: "Kiste",     v: 24,   kg: 2,    xp: 5,  st: "kuehl" },
  forelle:         { n: "Forellen",          i: "🐠", k: "fang",  a: 4,   u: "",   pk: "Kiste",     v: 18,   kg: 1.4,  xp: 3,  st: "kuehl", sg: "Forelle" },
  krabbe:          { n: "Krabben",           i: "🦀", k: "fang",  a: 1,   u: "kg", pk: "Kiste",     v: 9,    kg: 1,    xp: 3,  st: "kuehl" },
  garnele:         { n: "Garnelen",          i: "🦐", k: "fang",  a: 0.5, u: "kg", pk: "Schale",    v: 10,   kg: 0.5,  xp: 4,  st: "kuehl" },
  muschel:         { n: "Miesmuscheln",      i: "🐚", k: "fang",  a: 2,   u: "kg", pk: "Netz",      v: 9,    kg: 2,    xp: 2,  st: "kuehl" },
  /* verarbeitet (Kühlhaus) */
  heringsfilet:    { n: "Heringsfilet",      i: "🍣", k: "filet", a: 1,   u: "kg", pk: "Schale",    v: 10,   kg: 1,    xp: 4,  st: "kuehl" },
  dorschfilet:     { n: "Dorschfilet",       i: "🍥", k: "filet", a: 1,   u: "kg", pk: "Schale",    v: 28,   kg: 1,    xp: 7,  st: "kuehl" },
  buckling:        { n: "Bücklinge",         i: "🎏", k: "smoke", a: 4,   u: "",   pk: "4er-Pack",  v: 9,    kg: 1,    xp: 5,  st: "kuehl", sg: "Bückling" },
  raeucherforelle: { n: "Räucherforellen",   i: "🍢", k: "smoke", a: 1,   u: "",   pk: "Stück",     v: 6.5,  kg: 0.3,  xp: 4,  st: "kuehl", sg: "Räucherforelle" },
  fischbroetchen:  { n: "Fischbrötchen",     i: "🥪", k: "deli",  a: 6,   u: "",   pk: "Tablett",   v: 27,   kg: 1,    xp: 10, st: "kuehl", sg: "Fischbrötchen" },
  backfisch:       { n: "Backfischbrötchen", i: "🍤", k: "deli",  a: 6,   u: "",   pk: "Tablett",   v: 36,   kg: 1.2,  xp: 14, st: "kuehl", sg: "Backfischbrötchen" },
  krabbenbroetchen:{ n: "Krabbenbrötchen",   i: "🥙", k: "deli",  a: 6,   u: "",   pk: "Tablett",   v: 45,   kg: 1,    xp: 16, st: "kuehl", sg: "Krabbenbrötchen" },
  fischsuppe:      { n: "Fischsuppe",        i: "🍲", k: "deli",  a: 0.5, u: "l",  pk: "Glas",      v: 9,    kg: 0.6,  xp: 6,  st: "kuehl" },
  /* Speicher: Köder, Futter, Einkauf, Perlen, Schmuck */
  abfall:          { n: "Fischabfälle",      i: "🦴", k: "waste", a: 1,   u: "kg", pk: "Eimer",     v: 0.4,  kg: 1,    xp: 0,  st: "speicher" },
  koeder:          { n: "Köder",             i: "🪱", k: "feed",  a: 0.5, u: "kg", pk: "Beutel",    v: 1.5,  kg: 0.5,  xp: 1,  st: "speicher" },
  fischfutter:     { n: "Fischfutter",       i: "🫘", k: "feed",  a: 2,   u: "kg", pk: "Eimer",     v: 3,    kg: 2,    xp: 1,  st: "speicher" },
  broetchen:       { n: "Brötchen",          i: "🥖", k: "buy",   a: 6,   u: "",   pk: "6er-Tüte",  v: 2.4,  kg: 0.4,  xp: 0,  st: "speicher", sg: "Brötchen" },
  silber:          { n: "Silberdraht",       i: "⛓️", k: "buy",   a: 10,  u: "g",  pk: "Rolle",     v: 11,   kg: 0.01, xp: 0,  st: "speicher" },
  perle:           { n: "Perlen",            i: "🦪", k: "pearl", a: 1,   u: "",   pk: "Stück",     v: 12,   kg: 0.002, xp: 6, st: "speicher", sg: "Perle" },
  perlring:        { n: "Perlenringe",       i: "💍", k: "jewel", a: 1,   u: "",   pk: "Etui",      v: 65,   kg: 0.05, xp: 20, st: "speicher", sg: "Perlenring" },
  perlkette:       { n: "Perlenketten",      i: "📿", k: "jewel", a: 1,   u: "",   pk: "Etui",      v: 240,  kg: 0.08, xp: 45, st: "speicher", sg: "Perlenkette" },
  diadem:          { n: "Perlendiademe",     i: "👑", k: "jewel", a: 1,   u: "",   pk: "Schatulle", v: 520,  kg: 0.2,  xp: 80, st: "speicher", sg: "Perlendiadem" }
});

/* Reusen: was man mit Köder fangen kann (wie Saat auf dem Feld) */
const FPOTS = {
  krabbe:  { n: "Krabben",  t: 90,  lv: 1, yield: 2 },
  garnele: { n: "Garnelen", t: 150, lv: 3, yield: 2 }
};
/* Muschelleinen (wie Obstbäume): yield je Ernte, pearl = Chance auf eine Perle */
const FLINES = {
  miesmuschel: { n: "Miesmuschel-Leine", i: "🐚", out: "muschel", t: 360, yield: 3, price: 40,  lv: 1, pearl: 0.25 },
  perlmuschel: { n: "Perlmuschel-Leine", i: "🦪", out: "perle",   t: 480, yield: 2, price: 160, lv: 4, extra: { muschel: 1 } }
};

/* Netzgehege: Forellen schwärmen in Gruppen à 50 Fische */
FANIMALS.forelle = { n: "Forellenschwarm", pl: "Forellenschwärme", i: "🐠", out: "forelle", feed: "fischfutter", t: 150, price: 45, step: 10, lv: 1,
  space: 25, house: "netz", max: 8, unit: "m³", act: "abfischen", fish: true };
FPENS.netz = [{ w: 4, d: 4, m2: 100 }, { w: 5, d: 5, m2: 160 }, { w: 6, d: 6, m2: 240 }, { w: 7, d: 7, m2: 340 }];
FPEN_COST.netz = [0, 180, 380, 700];
FPEN_META.netz = { n: "Netzgehege", i: "🕸️", area: "Gehege", val: 4000 };
/* Haltung im Wasser: Platz je Schwarm in m³ */
const FKEEP_FISH = ["Bio-Aquakultur", "viel Raum", "artgerecht", "eng", "zu dicht"];

Object.assign(FMACHINES, {
  kutter: { n: "Kutter „Hertha“", i: "🛥️", trips: true, recipes: [
    { id: "hering",  in: {},            cost: 8,  out: 4, t: 60,  lv: 1, luck: 0.3,  tq: 14, trip: "Heringe vor Warnemünde" },
    { id: "dorsch",  in: { koeder: 1 }, cost: 14, out: 3, t: 120, lv: 2, luck: 0.25, trip: "Dorsch an der Kadetrinne" },
    { id: "garnele", in: {},            cost: 12, out: 4, t: 100, lv: 3, luck: 0.3,  trip: "Garnelen mit der Kurre" }
  ] },
  fishhalle: { n: "Fischhalle", i: "🔪", recipes: [
    { id: "heringsfilet", in: { hering: 1 },  out: 1, t: 20, lv: 1, by: { abfall: 1 } },
    { id: "dorschfilet",  in: { dorsch: 1 },  out: 1, t: 30, lv: 2, by: { abfall: 1 } },
    { id: "perle",        in: { muschel: 2 }, out: 1, t: 45, lv: 3, note: "Muscheln öffnen" }
  ] },
  smoke: { n: "Räucherei", i: "🔥", recipes: [
    { id: "buckling",        in: { hering: 1 },  out: 2, t: 60, lv: 1, tq: 10 },
    { id: "raeucherforelle", in: { forelle: 1 }, out: 4, t: 90, lv: 2 }
  ] },
  feedk: { n: "Futterküche", i: "🪣", recipes: [
    { id: "koeder",      in: { abfall: 1 }, out: 2, t: 15, lv: 1 },
    { id: "fischfutter", in: { hering: 1 }, out: 2, t: 25, lv: 1 }
  ] },
  deli: { n: "Fischbude", i: "🥪", recipes: [
    { id: "fischbroetchen",   in: { heringsfilet: 1, broetchen: 1 },             out: 1, t: 25, lv: 2 },
    { id: "backfisch",        in: { dorschfilet: 1, broetchen: 1 },              out: 1, t: 35, lv: 3 },
    { id: "krabbenbroetchen", in: { garnele: 2, broetchen: 1 },                  out: 1, t: 30, lv: 4 },
    { id: "fischsuppe",       in: { dorschfilet: 1, muschel: 1, garnele: 1 },    out: 6, t: 90, lv: 5 }
  ] },
  smith: { n: "Schmiede", i: "⚒️", recipes: [
    { id: "perlring",  in: { perle: 1, silber: 1 },  out: 1, t: 60,  lv: 4 },
    { id: "perlkette", in: { perle: 6, silber: 2 },  out: 1, t: 180, lv: 5 },
    { id: "diadem",    in: { perle: 10, silber: 4 }, out: 1, t: 300, lv: 6 }
  ] }
});
Object.assign(FBUILD_VAL, { deli: 5000, smith: 9000 });

Object.assign(FSTORE, {
  kuehl:    { n: "Kühlhaus",    i: "🧊", the: "Das Kühlhaus",    base: 50, step: 30, cost: [90, 220, 450, 850, 1350, 2200],
              empty: "Leer. Fang, Filets, Räucherfisch und alles aus der Fischbude kommt hierher." },
  speicher: { n: "Netzspeicher", i: "🪢", the: "Der Netzspeicher", base: 40, step: 30, cost: [80, 200, 400, 750, 1200, 2000],
              empty: "Leer. Köder, Fischfutter, Brötchen, Silber, Perlen und Schmuck lagern hier." }
});

Object.assign(FSIZE, {
  kuehl: [4, 3], speicher: [4, 3], fishhalle: [4, 3], smoke: [3, 3], feedk: [2, 2], deli: [3, 3], smith: [3, 3],
  kutter: [4, 7], steg: [1, 5], pot: [2, 2], mline: [2, 2]
});
FFIXED.add("kutter"); FFIXED.add("steg");

Object.assign(FDECO, {
  anker:       { n: "Anker",          i: "⚓", price: 12, lv: 1, sz: [1, 1], s: "fisch" },
  fischkisten: { n: "Fischkisten",    i: "📦", price: 5,  lv: 1, sz: [1, 1], s: "fisch" },
  rettungsring:{ n: "Rettungsring",   i: "🛟", price: 8,  lv: 1, sz: [1, 1], s: "fisch" },
  bojen:       { n: "Bojenstapel",    i: "🟠", price: 6,  lv: 1, sz: [1, 1], s: "fisch" },
  strandhafer: { n: "Strandhafer",    i: "🌾", price: 4,  lv: 1, sz: [1, 1], s: "fisch" },
  strandkorb:  { n: "Strandkorb",     i: "🏖️", price: 25, lv: 2, sz: [1, 1], s: "fisch" },
  netzgestell: { n: "Netzgestell",    i: "🕸️", price: 15, lv: 2, sz: [2, 1], s: "fisch" },
  moewenpfahl: { n: "Möwe auf Pfahl", i: "🐦", price: 9,  lv: 2, sz: [1, 1], s: "fisch" },
  fahnenmast:  { n: "Fahnenmast",     i: "🚩", price: 14, lv: 3, sz: [1, 1], s: "fisch" },
  leuchtboje:  { n: "Leuchtboje",     i: "🚨", price: 20, lv: 3, sz: [1, 1], s: "fisch", water: true },
  jolle:       { n: "Jolle",          i: "⛵", price: 60, lv: 4, sz: [2, 2], s: "fisch", water: true }
});

const FSHOP_FISCH = [
  { id: "pot",           cat: "wasser", n: "Reuse",             i: "🪤", lv: 1, price: o => 18 + 10 * Math.max(0, o - 4), max: lv => Math.min(16, 4 + lv * 2), d: "Mit Köder bestücken – fängt Krabben, ab Level 3 auch Garnelen." },
  { id: "l-miesmuschel", cat: "wasser", n: "Miesmuschel-Leine", i: "🐚", lv: 1, line: "miesmuschel", d: "Muscheln wachsen am Seil – alle 6 Stunden 6 kg, manchmal mit Perle." },
  { id: "l-perlmuschel", cat: "wasser", n: "Perlmuschel-Leine", i: "🦪", lv: 4, line: "perlmuschel", d: "Perlmuscheln: alle 8 Stunden zwei Perlen und ein Netz Muscheln." },
  { id: "a-forelle",     cat: "tier",   n: "Forellenschwarm",   i: "🐠", lv: 1, animal: "forelle", d: "50 junge Regenbogenforellen fürs Netzgehege – fressen Fischfutter." },
  { id: "deli",          cat: "bau",    n: "Fischbude",         i: "🥪", lv: 2, price: () => 450,  lim: () => 1, d: "Fischbrötchen, Backfisch, Krabbenbrötchen und Fischsuppe." },
  { id: "smith",         cat: "bau",    n: "Schmiede",          i: "⚒️", lv: 4, price: () => 1200, lim: () => 1, d: "Silber und Perlen: Ringe, Ketten und ein Diadem." },
  { id: "netz",          cat: "bau",    n: "Netzgehege",        i: "🕸️", lv: 5, price: () => 600,  lim: lv => lv >= 5 ? 2 : 1, d: "Zweites schwimmendes Gehege für bis zu 8 Schwärme." },
  { id: "s-koeder",      cat: "kauf",   n: "Köder",             i: "🪱", lv: 1, item: "koeder",    qty: 2, price: () => 4,    d: "2 Beutel aus dem Angelladen. Selbst gemacht in der Futterküche ist es billiger." },
  { id: "s-broetchen",   cat: "kauf",   n: "Brötchen",          i: "🥖", lv: 2, item: "broetchen", qty: 3, price: () => 7.2,  d: "18 Brötchen vom Bäcker am Kirchplatz – für die Fischbude." },
  { id: "s-silber",      cat: "kauf",   n: "Silberdraht",       i: "⛓️", lv: 4, item: "silber",    qty: 1, price: () => 11,   d: "10 g Silberdraht vom Edelmetallhandel – für die Schmiede." }
];
const FSHOP_CATS_FISCH = [["wasser", "🌊 Reusen & Leinen"], ["tier", "🐠 Fische"], ["bau", "🏗️ Gebäude"], ["kauf", "🛍️ Einkauf"], ["deko", "⚓ Deko"]];

const FUNLOCK_FISCH = {
  2: ["🐡 Dorschfang mit dem Kutter", "🥪 Fischbude: Fischbrötchen", "🍥 Dorschfilet", "🍢 Räucherforelle", "🏖️ Deko: Strandkorb, Netzgestell"],
  3: ["🦐 Garnelen: Kutter und Reusen", "🍤 Backfischbrötchen", "🦪 Perlen aus Muscheln (Fischhalle)", "🚨 Leuchtboje"],
  4: ["⚒️ Schmiede: Perlenringe", "🦪 Perlmuschel-Leine", "🥙 Krabbenbrötchen", "⛵ Jolle"],
  5: ["📿 Perlenkette", "🍲 Fischsuppe", "🕸️ zweites Netzgehege"],
  6: ["👑 Perlendiadem"]
};

const FTOWNS_FISCH = {
  "f-warne":    { lv: 1, w: 5, cust: [
    ["Fischbude Am Strom",           ["hering", "buckling", "fischbroetchen", "backfisch", "krabbenbroetchen", "krabbe"]],
    ["Hotel Seeblick",               ["dorschfilet", "heringsfilet", "muschel", "garnele", "raeucherforelle", "fischsuppe", "forelle"]],
    ["Restaurant Leuchtfeuer",       ["dorsch", "forelle", "muschel", "krabbe", "garnele", "fischsuppe"]],
    ["Juwelier Bernstein & Perle",   ["perle", "perlring", "perlkette", "diadem"]]] },
  "f-markgraf": { lv: 1, w: 3, cust: [
    ["Campingplatz-Kiosk Heide",     ["fischbroetchen", "buckling", "krabbe", "hering"]],
    ["Waldhotel Rostocker Heide",    ["forelle", "raeucherforelle", "muschel", "dorschfilet"]]] },
  "f-rostock":  { lv: 2, w: 4, cust: [
    ["Fischmarkt Stadthafen",        ["hering", "dorsch", "forelle", "muschel", "krabbe", "garnele", "buckling"]],
    ["Restaurant Hansekogge",        ["dorschfilet", "heringsfilet", "garnele", "muschel", "fischsuppe", "raeucherforelle"]],
    ["Feinkost am Neuen Markt",      ["buckling", "raeucherforelle", "krabbenbroetchen", "fischsuppe", "perle"]],
    ["Goldschmiede am Kröpeliner Tor", ["perlring", "perlkette", "diadem", "perle"]]] },
  "f-doberan":  { lv: 2, w: 3, cust: [
    ["Bahnhofscafé an der Molli",    ["fischbroetchen", "krabbenbroetchen", "buckling", "backfisch"]],
    ["Gasthof am Münster",           ["forelle", "dorschfilet", "raeucherforelle", "fischsuppe"]]] },
  "f-graal":    { lv: 3, w: 2, cust: [
    ["Kurhaus-Café Graal",           ["raeucherforelle", "krabbenbroetchen", "fischsuppe", "fischbroetchen"]],
    ["Strandkiosk Müritz",           ["fischbroetchen", "backfisch", "buckling"]]] },
  "f-kuehl":    { lv: 3, w: 3, cust: [
    ["Seebrücken-Imbiss",            ["fischbroetchen", "backfisch", "krabbenbroetchen", "buckling"]],
    ["Restaurant Bootshafen",        ["dorsch", "muschel", "garnele", "fischsuppe", "dorschfilet"]],
    ["Schmuck an der Strandpromenade", ["perlring", "perlkette"]]] },
  "f-heilig":   { lv: 4, w: 2, cust: [
    ["Grandhotel Weiße Stadt",       ["garnele", "dorschfilet", "raeucherforelle", "fischsuppe", "perlkette", "diadem"]]] },
  "f-wismar":   { lv: 6, w: 1, cust: [
    ["Fischmarkt Alter Hafen",       ["hering", "dorsch", "buckling", "forelle", "muschel"]],
    ["Juwelier am Wismarer Markt",   ["perlkette", "diadem", "perlring"]]] }
};
const FTOWN_STREETS_FISCH = {
  "f-warne":    [["Am Strom", 54.1782, 12.0893], ["Kirchenplatz", 54.1758, 12.0838], ["Mühlenstraße", 54.1772, 12.0852], ["Seestraße", 54.1806, 12.0838], ["Kurhausstraße", 54.1790, 12.0800]],
  "f-markgraf": [["Budentannenweg", 54.1988, 12.1520], ["Dünenweg", 54.2008, 12.1488]],
  "f-rostock":  [["Am Stadthafen", 54.0935, 12.1372], ["Kröpeliner Straße", 54.0890, 12.1338], ["Neuer Markt", 54.0887, 12.1405], ["Lange Straße", 54.0912, 12.1362]],
  "f-doberan":  [["Mollistraße", 54.1062, 11.9101], ["Am Markt", 54.1085, 11.9068], ["Klosterstraße", 54.1098, 11.8995]],
  "f-graal":    [["Rostocker Straße", 54.2532, 12.2418], ["Seestraße", 54.2575, 12.2352]],
  "f-kuehl":    [["Ostseeallee", 54.1519, 11.7552], ["Strandstraße", 54.1508, 11.7418], ["Hafenstraße", 54.1527, 11.7383]],
  "f-heilig":   [["Prof.-Dr.-Vogel-Straße", 54.1441, 11.8441], ["Seedeich", 54.1456, 11.8409]],
  "f-wismar":   [["Am Alten Hafen", 53.8975, 11.4582], ["Am Markt", 53.8914, 11.4654]]
};

const FCHAPTERS_FISCH = [
  { n: "Ankommen",       t: "Der erste Tag an Tante Gesches Kai",           r: { m: 50,  xp: 30 },
    opa: "Die See gibt, was sie will – aber wer früh rausfährt, hat volle Kisten. Und vergiss die Reusen nicht, die Krabben warten nicht." },
  { n: "Wachsen",        t: "Fischbrötchen, Dorsch und die ersten Stammkunden", r: { m: 100, xp: 60 },
    opa: "Ein Fischbrötchen am Strom verkauft sich von allein. Aber nur, wenn der Hering frisch ist – nicht von gestern." },
  { n: "Meisterbetrieb", t: "Perlen, Schmuck und die feinen Hotels",         r: { m: 250, xp: 100 },
    opa: "In jeder hundertsten Muschel steckt ein kleines Wunder. Wer Geduld hat, macht daraus Schmuck, den man nicht vergisst." }
];
const FQUESTS_FISCH = [
  /* Kapitel 1 – Ankommen */
  { c: 0, t: "Hol 6 Kisten Krabben aus den Reusen", ev: "harvest:krabbe",     n: 6, r: { m: 10, xp: 8 } },
  { c: 0, t: "Fahr 2-mal zum Heringsfang",          ev: "trip:hering",        n: 2, r: { m: 15, xp: 10 } },
  { c: 0, t: "Räuchere 16 Bücklinge",               ev: "make:buckling",      n: 4, r: { m: 15, xp: 10 } },
  { c: 0, t: "Liefere 2 Bestellungen aus",          ev: "deliver",            n: 2, r: { m: 25, xp: 15 } },
  { c: 0, t: "Füttere die Forellen 6-mal",          ev: "feed:fischfutter",   n: 6, r: { m: 15, xp: 10 } },
  { c: 0, t: "Fische 4 Kisten Forellen ab",         ev: "collect:forelle",    n: 4, r: { m: 20, xp: 12 } },
  { c: 0, t: "Ernte 12 kg Miesmuscheln",            ev: "harvest:muschel",    n: 6, r: { m: 15, xp: 10 } },
  { c: 0, t: "Finde 2 Perlen in den Muscheln",      chk: () => (S.farm.stats.pearls || 0) >= 2, n: 1, r: { m: 20, xp: 12 } },
  { c: 0, t: "Fang einen Fisch an der Angel",       ev: "angel",              n: 1, r: { m: 15, xp: 10 } },
  { c: 0, t: "Erreiche Level 2",                    ev: "level",              n: 2, r: { m: 20, xp: 0 } },
  { c: 0, t: "Filetiere 4 kg Hering",               ev: "make:heringsfilet",  n: 4, r: { m: 15, xp: 10 } },
  { c: 0, t: "Stell eine neue Reuse auf",           chk: () => fcount("pot") >= 5, n: 1, r: { m: 15, xp: 8 } },
  /* Kapitel 2 – Wachsen */
  { c: 1, t: "Bau die Fischbude",                   chk: () => fcount("deli") >= 1, n: 1, r: { m: 60, xp: 20 } },
  { c: 1, t: "Kauf Brötchen beim Bäcker",           ev: "buy:broetchen",      n: 1, r: { m: 10, xp: 5 } },
  { c: 1, t: "Mach 2 Tabletts Fischbrötchen",       ev: "make:fischbroetchen", n: 2, r: { m: 30, xp: 16 } },
  { c: 1, t: "Fang 6 kg Dorsch",                    ev: "make:dorsch",        n: 3, r: { m: 30, xp: 16 } },
  { c: 1, t: "Mach 8 kg Fischfutter",               ev: "make:fischfutter",   n: 4, r: { m: 15, xp: 10 } },
  { c: 1, t: "Räuchere 8 Forellen",                 ev: "make:raeucherforelle", n: 8, r: { m: 30, xp: 16 } },
  { c: 1, t: "Erreiche Level 3",                    ev: "level",              n: 3, r: { m: 30, xp: 0 } },
  { c: 1, t: "Vergrößere das Netzgehege",           chk: () => S.farm.objs.some(o => o.t === "netz" && o.lvl >= 2), n: 1, r: { m: 50, xp: 20 } },
  { c: 1, t: "Halte 4 Forellenschwärme",            chk: () => fanimals("netz") >= 4, n: 1, r: { m: 40, xp: 16 } },
  { c: 1, t: "Liefere nach Rostock",                ev: "deliver:f-rostock",  n: 1, r: { m: 50, xp: 25 } },
  { c: 1, t: "Liefere 8 Bestellungen aus",          ev: "deliver",            n: 8, r: { m: 60, xp: 30 } },
  { c: 1, t: "Erreiche Level 4",                    ev: "level",              n: 4, r: { m: 60, xp: 0 } },
  /* Kapitel 3 – Meisterbetrieb */
  { c: 2, t: "Bau die Schmiede",                    chk: () => fcount("smith") >= 1, n: 1, r: { m: 100, xp: 30 } },
  { c: 2, t: "Sammle 6 Perlen",                     ev: "pearl",              n: 6, r: { m: 40, xp: 20 } },
  { c: 2, t: "Schmiede 2 Perlenringe",              ev: "make:perlring",      n: 2, r: { m: 60, xp: 25 } },
  { c: 2, t: "Häng eine Perlmuschel-Leine aus",     chk: () => S.farm.objs.some(o => o.t === "mline" && o.kind === "perlmuschel"), n: 1, r: { m: 40, xp: 15 } },
  { c: 2, t: "Hol 6 Schalen Garnelen aus den Reusen", ev: "harvest:garnele",  n: 6, r: { m: 40, xp: 20 } },
  { c: 2, t: "Mach 2 Tabletts Krabbenbrötchen",     ev: "make:krabbenbroetchen", n: 2, r: { m: 50, xp: 22 } },
  { c: 2, t: "Bau das Kühlhaus aus",                chk: () => (S.farm.cap.kuehl || 1) >= 2, n: 1, r: { m: 40, xp: 15 } },
  { c: 2, t: "Erreiche 5 Sterne bei Forellen",      ev: "q5:forelle",         n: 1, r: { m: 80, xp: 30 } },
  { c: 2, t: "Erreiche Level 5",                    ev: "level",              n: 5, r: { m: 80, xp: 0 } },
  { c: 2, t: "Koche 3 l Fischsuppe",                ev: "make:fischsuppe",    n: 6, r: { m: 60, xp: 25 } },
  { c: 2, t: "Fädle eine Perlenkette auf",          ev: "make:perlkette",     n: 1, r: { m: 100, xp: 35 } },
  { c: 2, t: "Erreiche Level 6",                    ev: "level",              n: 6, r: { m: 100, xp: 0 } },
  { c: 2, t: "Schmiede ein Perlendiadem",           ev: "make:diadem",        n: 1, r: { m: 150, xp: 50 } },
  { c: 2, t: "Liefere 15 Bestellungen aus",         ev: "deliver",            n: 15, r: { m: 150, xp: 60 } }
];

/* Netzknoten an der Küste (Feld 10 = "fisch") */
NODES.push(
  ["f-hafen",    "Fischerei",        54.1788, 12.0878, "EUR", 1, "br", "city", "Fischerei",      "fisch"],
  ["f-warne",    "Warnemünde",       54.1745, 12.0800, "EUR", 1, "br", "city", "Warnemünde",     "fisch"],
  ["f-markgraf", "Markgrafenheide",  54.1995, 12.1530, "EUR", 1, "br", "city", "Markgrafenheide", "fisch"],
  ["f-rostock",  "Rostock",          54.0887, 12.1405, "EUR", 1, "br", "city", "Rostock",        "fisch"],
  ["f-doberan",  "Bad Doberan",      54.1066, 11.9089, "EUR", 1, "br", "city", "Bad Doberan",    "fisch"],
  ["f-heilig",   "Heiligendamm",     54.1458, 11.8430, "EUR", 1, "br", "city", "Heiligendamm",   "fisch"],
  ["f-kuehl",    "Kühlungsborn",     54.1505, 11.7460, "EUR", 1, "br", "city", "Kühlungsborn",   "fisch"],
  ["f-graal",    "Graal-Müritz",     54.2550, 12.2390, "EUR", 1, "br", "city", "Graal-Müritz",   "fisch"],
  ["f-wismar",   "Wismar",           53.8920, 11.4650, "EUR", 1, "br", "city", "Wismar",         "fisch"]
);
CARGO.fang = { name: "Fang & Feinkost", icon: "🐟", req: [], rate: 1.0, minStage: 99, minKg: 0.01, maxKg: 5000 };

/* Wasser liegt auf den Kachelreihen 3 … 11 (Norden), an Land davor */
const FISH_KAI = 12;
const FPATH_FISCH = new Set();
for (let i = 3; i < 29; i++) FPATH_FISCH.add(FISH_KAI * 32 + i);           /* Kai an der Wasserkante */
for (let j = FISH_KAI + 1; j < 29; j++) { FPATH_FISCH.add(j * 32 + 20); FPATH_FISCH.add(j * 32 + 21); }  /* Weg vom Tor zum Kai */

FSITES.fisch = {
  kind: "fisch", node: "f-hafen", pt: [54.1788, 12.0878], view: { center: [54.150, 12.000], zoom: 11 },
  cargo: "fang", stores: ["kuehl", "speicher"], base: 60000, near: null,
  shop: FSHOP_FISCH, cats: FSHOP_CATS_FISCH, quests: FQUESTS_FISCH, chapters: FCHAPTERS_FISCH,
  towns: FTOWNS_FISCH, streets: FTOWN_STREETS_FISCH, unlock: FUNLOCK_FISCH,
  addr: "Am Strom 31", area: "Warnemünde",
  path: FPATH_FISCH,
  /* "w" = Wasser, "l" = Land */
  zone: (x, z) => z < FISH_KAI ? "w" : "l",
  T: {
    place: "Fischerei", the: "die Fischerei", The: "Die Fischerei", at: "in der Fischerei", to: "in die Fischerei", of: "von der Fischerei", gen: "der Fischerei",
    title: c => "Fischerei " + c, short: "Fischerei", pin: "⚓", tab: "Hafen", tabIcon: "⚓", ledger: "Fischerei",
    hud: "Erbe · Fischerei Warnemünde", where: "Warnemünde", heir: "Erbe von Tante Gesche",
    elder: "Tante Gesche", elderName: "Tante Gesche", book: "Gesches Logbuch", bookShort: "Logbuch", bookIcon: "📘",
    letterHead: "Tante Gesches Brief",
    letter: "Moin! Kutter, Räucherei, Reusen und Leinen gehören jetzt dir. Fahr raus, wenn die See ruhig ist, räuchere mit Buchenholz und geh sorgsam mit den Muscheln um – in manchen steckt ein Schatz. Lina fährt deine Ware aus, die kennt jede Fischbude zwischen Kühlungsborn und Graal-Müritz. Deine Tante Gesche",
    doneHead: "Die Fischerei läuft!", doneSub: "Alles abgehakt – Tante Gesche wäre stolz.",
    doneQuote: "Du hast alles geschafft, was in meinem Logbuch steht. Die Fischerei ist jetzt deine, ganz und gar. Und wenn dir die Küste zu klein wird: Lina kennt jede Straße bis nach Berlin.",
    doneMsg: "Chef, Tante Gesches Logbuch ist abgehakt, die Fischerei läuft. Die Händler am Stadthafen fragen ständig, ob wir nicht auch ihre Pakete mitnehmen. "
      + "Wenn du willst, gründen wir eine richtige Spedition – die Fischerei läuft nebenher weiter. Tipp am Hafen auf „Spedition gründen“.",
    bookHint: "Arbeite Tante Gesches Logbuch ab – drei Kapitel. Wenn die Fischerei läuft, kannst du eine Spedition gründen und auch für andere fahren.",
    welcome: n => "⚓ Willkommen an der Küste, " + n + "!",
    noOrders: "Gerade keine Bestellung. Neue kommen von allein – bald auch aus Rostock und Kühlungsborn.",
    atHere: "an der Fischerei", vehNone: "Kein Fahrzeug an der Fischerei – es kommt zur Abholung angefahren.",
    sellHead: "Fischerei verkaufen?", sold: "⚓ Fischerei verkauft für ",
    sellText: "Für {p} gehen Kutter, Räucherei, Gehege und Lager an einen Fischer aus dem Ort. Fahrzeuge und Spedition bleiben. Das lässt sich nicht rückgängig machen.",
    keepText: "Du kannst die Fischerei behalten und jederzeit über „Hafen“ besuchen – oder sie verkaufen und mit dem Geld die Spedition ausbauen. Ein Verkauf ist endgültig.",
    valHead: "Wert der Fischerei heute", tour: "🎓 Rundgang mit Lina", tourMenu: "🎓 Rundgang an der Fischerei",
    foundText: "Ab jetzt kommen auch fremde Aufträge: Pakete, Paletten, Express – erst an der Küste und in Berlin, später weltweit. Die Fischerei läuft weiter und liefert wie bisher. Lina zeigt dir, wie Aufträge laufen.",
    notYet: "Erst die Spedition gründen – das geht, sobald Tante Gesches Logbuch abgehakt ist."
  }
};
