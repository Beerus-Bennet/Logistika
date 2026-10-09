/* =========================================================================
   LOGISTIKA – fishdata.js
   Die Fischerei am Glindower See – die dritte große Phase des Erbes.
   Erst ein Steg, dann Fischerhütte, Bootshaus, Fischlager, Räucherei,
   Kühlhaus und Fischmarkt; jedes Gebäude braucht Holz aus dem eigenen
   Sägewerk. Gefischt wird mit der Angel vom Steg oder vom Boot aus an
   sechs Stellen im See – welche Fische beißen, hängt von Tageszeit und
   Wetter ab. Verarbeitung: ausnehmen, filetieren, räuchern, veredeln.
   (Die frühere Ostsee-Fischerei gibt es nicht mehr; alte Spielstände
   werden beim Laden in einen Hof umgewandelt, siehe farm.js.)
   ========================================================================= */

/* ------------------------------- Fische ---------------------------------
   Je Fisch: kg, Preis (€, Direktvermarktung Havelland 2026), fight =
   wie stark er beim Drillen zieht (0 … 1). */
const FFISH = {
  barsch:  { n: "Barsche",      sg: "Barsch",      i: "🐟", kg: 0.4, v: 4,   xp: 4,  fight: 0.30 },
  forelle: { n: "Forellen",     sg: "Forelle",     i: "🐠", kg: 0.6, v: 7,   xp: 5,  fight: 0.45 },
  karpfen: { n: "Karpfen",      sg: "Karpfen",     i: "🎏", kg: 2.5, v: 13,  xp: 8,  fight: 0.55 },
  hecht:   { n: "Hechte",       sg: "Hecht",       i: "🦈", kg: 3.5, v: 20,  xp: 12, fight: 0.75 },
  zander:  { n: "Zander",       sg: "Zander",      i: "🐡", kg: 2.0, v: 26,  xp: 14, fight: 0.60 },
  aal:     { n: "Aale",         sg: "Aal",         i: "🐍", kg: 1.0, v: 30,  xp: 16, fight: 0.70 },
  wels:    { n: "Welse",        sg: "Wels",        i: "🐋", kg: 9.0, v: 45,  xp: 25, fight: 0.95 },
  schleie: { n: "Gold-Schleien", sg: "Gold-Schleie", i: "🏆", kg: 1.4, v: 150, xp: 60, fight: 0.50 }
};
Object.keys(FFISH).forEach(id => {
  const f = FFISH[id];
  FITEMS[id] = { n: f.n, sg: f.sg, i: f.i, k: "fisch", a: 1, u: "", pk: "Stück", v: f.v, kg: f.kg, xp: f.xp, st: "fisch" };
});
Object.assign(FITEMS, {
  abfall:          { n: "Fischabfälle",       i: "🦴", k: "waste", a: 1,  u: "kg", pk: "Eimer",    v: 0.3, kg: 1,   xp: 0,  st: "fisch" },
  koeder:          { n: "Köder",              sg: "Köder", i: "🪱", k: "bait", a: 1, u: "", pk: "Dose", v: 0.4, kg: 0.1, xp: 0, st: "fisch" },
  barschfilet:     { n: "Barschfilets",       sg: "Barschfilet", i: "🍣", k: "filet", a: 2, u: "", pk: "Schale", v: 7, kg: 0.4, xp: 6, st: "fisch" },
  forellenfilet:   { n: "Forellenfilets",     sg: "Forellenfilet", i: "🍥", k: "filet", a: 2, u: "", pk: "Schale", v: 9, kg: 0.4, xp: 6, st: "fisch" },
  karpfenblau:     { n: "Karpfen blau",       i: "🍽️", k: "filet", a: 1,  u: "",   pk: "Stück",    v: 18,  kg: 2,   xp: 9,  st: "fisch", sg: "Karpfen blau" },
  zanderfilet:     { n: "Zanderfilets",       sg: "Zanderfilet", i: "🍱", k: "filet", a: 2, u: "", pk: "Schale", v: 32, kg: 0.6, xp: 16, st: "fisch" },
  raeucherforelle: { n: "Räucherforellen",    sg: "Räucherforelle", i: "🍢", k: "smoke", a: 1, u: "", pk: "Stück", v: 11, kg: 0.4, xp: 8, st: "fisch" },
  raeucheraal:     { n: "Räucheraal",         i: "🍤", k: "smoke", a: 0.5, u: "kg", pk: "Stück",   v: 42,  kg: 0.5, xp: 20, st: "fisch" },
  fischplatte:     { n: "Räucherfisch-Platten", sg: "Räucherfisch-Platte", i: "🥗", k: "smoke", a: 1, u: "", pk: "Platte", v: 28, kg: 1, xp: 14, st: "fisch" },
  konserve:        { n: "Fischkonserven",     sg: "Fischkonserve", i: "🥫", k: "deli", a: 1, u: "", pk: "Dose", v: 4.5, kg: 0.3, xp: 5, st: "fisch" },
  fischkiste:      { n: "Frischfischkisten",  sg: "Frischfischkiste", i: "🧊", k: "deli", a: 1, u: "", pk: "Kiste", v: 26, kg: 6, xp: 10, st: "fisch" },
  edelbox:         { n: "Edelfisch-Boxen",    sg: "Edelfisch-Box", i: "🎁", k: "deli", a: 1, u: "", pk: "Box", v: 120, kg: 3, xp: 40, st: "fisch" },
  hechtkloesse:    { n: "Hechtklößchen",      i: "🥟", k: "deli", a: 6,  u: "",   pk: "6er-Schale", v: 7, kg: 0.5, xp: 7, st: "fisch", sg: "Hechtklößchen" },
  fischbroetchen:  { n: "Fischbrötchen",      sg: "Fischbrötchen", i: "🥪", k: "deli", a: 1, u: "", pk: "Stück", v: 4, kg: 0.2, xp: 4, st: "fisch" }
});
/* frühere Ostsee-Tabellen gibt es nicht mehr – leer, damit nichts bricht */
const FPOTS = {};
const FLINES = {};
const FKEEP_FISH = ["Bio-Aquakultur", "viel Raum", "artgerecht", "eng", "zu dicht"];

/* Lager für Fisch: erst eine Kühlkiste in der Hütte, Fischlager und
   Kühlhaus legen ordentlich drauf */
FSTORE.fisch = { n: "Kühlkiste", i: "🧊", the: "Die Kühlkiste", base: 24, step: 16, cost: [150, 350, 700, 1200, 1900, 2800],
  empty: "Leer. Angle vom Steg oder fahr mit dem Boot raus – der Fang kommt hierher." };
const FFISH_STORE_BONUS = { f_lager: 40, f_kuehl: 60 };

/* ------------------------------ Gebäude ---------------------------------
   Werden an festen Plätzen am Ufer gebaut: Holz aus dem Sägewerk + Geld,
   dazu ein kurzes Bau-Minispiel. x/z = Weltmitte, sz = Kacheln. */
const FFISHERY = {
  f_steg:   { n: "Steg",         i: "🪵", lv: 15, x: 8,   z: 28.5, sz: [2, 6], need: { bretter: 6, pfosten: 4 },              cost: 150,
              d: "Ein Holzsteg ins Wasser: hier angelst du, hier legen später die Boote an." },
  f_huette: { n: "Fischerhütte", i: "🛖", lv: 16, x: 0,   z: 24,   sz: [4, 3], need: { balken: 4, bretter: 6, platten: 2 },   cost: 400,
              d: "Ausnehmen, filetieren, Köder aus Fischabfällen. Mit Kühlkiste für den Fang." },
  f_boot:   { n: "Bootshaus",    i: "⛵", lv: 16, x: 18,  z: 27.5, sz: [5, 5], need: { balken: 6, bretter: 8, dielen: 2 },    cost: 900,
              d: "Mit Ruderboot: raus auf den See zu den besten Stellen." },
  f_lager:  { n: "Fischlager",   i: "🧊", lv: 17, x: -8,  z: 24,   sz: [4, 3], need: { balken: 4, platten: 4, kisten: 4 },    cost: 700,
              d: "+40 Plätze für Fisch. Konservenküche und Frischfischkisten." },
  f_rauch:  { n: "Räucherei",    i: "🔥", lv: 17, x: 27,  z: 24.5, sz: [3, 3], need: { bretter: 4, balken: 2, bohlen: 2 },    cost: 600,
              d: "Räuchert mit Brennholz aus dem Sägewerk: Räucherforelle, Räucheraal, Fischplatten." },
  f_kuehl:  { n: "Kühlhaus",     i: "❄️", lv: 18, x: -16, z: 25,   sz: [4, 4], need: { platten: 6, bauholz: 2, tueren: 1 },   cost: 2200,
              d: "+60 Plätze. Edelfisch-Boxen und Hechtklößchen für die feinen Restaurants." },
  f_markt:  { n: "Fischmarkt",   i: "🏪", lv: 19, x: 35,  z: 23.5, sz: [5, 3], need: { bauholz: 4, dielen: 4, zaun: 2 },      cost: 1800,
              d: "Verkaufsstand direkt am See: Fisch bringt hier 15 % mehr. Dazu Fischbrötchen." }
};
const FFISHERY_ORDER = ["f_steg", "f_huette", "f_boot", "f_lager", "f_rauch", "f_kuehl", "f_markt"];
Object.keys(FFISHERY).forEach(t => { FSIZE[t] = FFISHERY[t].sz; FFIXED.add(t); });
FSIZE.f_plot = [3, 3];
FFIXED.add("f_plot");
Object.assign(FBUILD_VAL, { f_steg: 800, f_huette: 2500, f_boot: 5000, f_lager: 3500, f_rauch: 3000, f_kuehl: 9000, f_markt: 7000 });

Object.assign(FMACHINES, {
  f_huette: { n: "Fischerhütte", i: "🛖", fish: true, recipes: [
    { id: "barschfilet",   in: { barsch: 3 },  out: 2, t: 20, lv: 16, by: { abfall: 1 } },
    { id: "forellenfilet", in: { forelle: 2 }, out: 2, t: 25, lv: 16, by: { abfall: 1 } },
    { id: "karpfenblau",   in: { karpfen: 1 }, out: 1, t: 30, lv: 16, by: { abfall: 1 } },
    { id: "koeder",        in: { abfall: 1 },  out: 5, t: 10, lv: 16 },
    { id: "zanderfilet",   in: { zander: 1 },  out: 1, t: 30, lv: 18, by: { abfall: 1 } }
  ] },
  f_rauch: { n: "Räucherei", i: "🔥", fish: true, recipes: [
    { id: "raeucherforelle", in: { forelle: 1, brennholz: 1 },        out: 2, t: 60, lv: 17 },
    { id: "raeucheraal",     in: { aal: 1, brennholz: 1 },            out: 2, t: 90, lv: 18 },
    { id: "fischplatte",     in: { raeucherforelle: 1, barschfilet: 1 }, out: 1, t: 40, lv: 18 }
  ] },
  f_lager: { n: "Fischlager", i: "🧊", fish: true, recipes: [
    { id: "konserve",   in: { barsch: 2, tomate: 1 },      out: 4, t: 45, lv: 17 },
    { id: "fischkiste", in: { barschfilet: 2, kisten: 1 }, out: 1, t: 20, lv: 17 }
  ] },
  f_kuehl: { n: "Kühlhaus", i: "❄️", fish: true, recipes: [
    { id: "hechtkloesse", in: { hecht: 1, ei: 1, brot: 1 },               out: 3, t: 50, lv: 18 },
    { id: "edelbox",      in: { zanderfilet: 1, raeucheraal: 1, kisten: 1 }, out: 1, t: 60, lv: 18 }
  ] },
  f_markt: { n: "Fischmarkt", i: "🏪", fish: true, recipes: [
    { id: "fischbroetchen", in: { barschfilet: 1, brot: 1 }, out: 4, t: 15, lv: 19 }
  ] }
});

/* ------------------------------- Boote ---------------------------------- */
const FBOATS = [
  null,
  { n: "Ruderboot", i: "🚣", speed: 3.2, lv: 16 },
  { n: "Motorboot", i: "🚤", speed: 8,   lv: 19, price: 6500, need: { dielen: 4, bohlen: 2 } }
];
const FBOAT_DOCK = [18, 31.5];

/* ------------------------------ Angelplätze -------------------------------
   boat: 0 = vom Steg, 1 = Ruderboot reicht, 2 = nur mit Motorboot.
   fish = Gewicht beim Würfeln (dann noch × Tageszeit × Wetter). */
const FGROUNDS = [
  { id: "steg",  n: "Am Steg",        i: "🪵", x: 8,   z: 32.5, boat: 0, fish: { barsch: 50, forelle: 14, karpfen: 22, aal: 4, hecht: 4 } },
  { id: "rosen", n: "Seerosenbucht",  i: "🪷", x: -9,  z: 40,   boat: 1, fish: { karpfen: 40, barsch: 28, hecht: 8, schleie: 1.2 } },
  { id: "schilf", n: "Schilfgürtel",  i: "🌾", x: -15, z: 52,   boat: 1, fish: { hecht: 30, karpfen: 24, barsch: 18, aal: 6, schleie: 1.6 } },
  { id: "stein", n: "Steinkante",     i: "🪨", x: 34,  z: 41,   boat: 1, fish: { barsch: 40, zander: 18, hecht: 12 } },
  { id: "mitte", n: "Tiefe Mitte",    i: "🌊", x: 14,  z: 50,   boat: 2, fish: { zander: 30, barsch: 24, hecht: 10, wels: 7 } },
  { id: "bach",  n: "Bachmündung",    i: "🏞️", x: 42,  z: 57,   boat: 2, fish: { forelle: 45, aal: 14, barsch: 14 } }
];
/* Tageszeit: Morgen 5–9, Tag 9–17, Abend 17–21, Nacht 21–5 */
const FFISH_TIME = {
  barsch:  { tag: 1.3 },
  forelle: { morgen: 2.0, abend: 1.3 },
  karpfen: { tag: 1.4, abend: 1.2 },
  hecht:   { tag: 1.3, morgen: 1.3 },
  zander:  { abend: 2.2, nacht: 2.6, tag: 0.5 },
  aal:     { nacht: 4.0, abend: 1.5, tag: 0.3 },
  wels:    { nacht: 3.0, abend: 1.4, tag: 0.4 },
  schleie: { morgen: 1.8 }
};
/* Wetter */
const FWEATHER = {
  sonne:  { n: "Sonne",    i: "☀️", w: 40 },
  wolken: { n: "Bewölkt",  i: "⛅", w: 30 },
  regen:  { n: "Regen",    i: "🌧️", w: 20 },
  nebel:  { n: "Nebel",    i: "🌁", w: 10 }
};
const FFISH_WX = {
  karpfen: { sonne: 1.4 },
  hecht:   { wolken: 1.6, regen: 1.2 },
  zander:  { wolken: 1.5, nebel: 1.8 },
  aal:     { regen: 2.2 },
  wels:    { wolken: 1.3, regen: 1.3 },
  schleie: { regen: 3.0, nebel: 1.5 },
  forelle: { regen: 1.3 }
};
/* was manchmal statt eines Fisches am Haken hängt */
const FJUNK_FISH = [
  { junk: "einen alten Gummistiefel", i: "👢", w: 4 },
  { junk: "ein Büschel Seegras", i: "🌿", w: 5 },
  { junk: "eine Flaschenpost aus Potsdam", i: "🍾", w: 2, m: 5 }
];
