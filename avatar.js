/* =========================================================================
   LOGISTIKA – Charakter-Baukasten
   Comic-Figuren als reines SVG, gebaut auf festen Gesichtspunkten:
   Scheitel y28 · Brauen y72 · Augen y93 · Nase y112 · Mund y122 · Kinn y140.
   Alle Teile beziehen sich auf diese Punkte, damit nichts zusammengewürfelt
   wirkt. Weibliche und männliche Variante teilen den Aufbau und
   unterscheiden sich in Kieferbreite, Brauen, Wimpern und Lippen.
   ========================================================================= */
"use strict";

const AV = {
  sexes: ["w", "m"],

  skins: [
    { id: "porzellan", light: "#fdeeE0", base: "#f8dcc6", shade: "#e3b697", deep: "#c68f6d", lips: "#cf807a", blush: "#f1a79f" },
    { id: "hell",      light: "#fbe2d0", base: "#f0cdb2", shade: "#d9a888", deep: "#bd8664", lips: "#c4736a", blush: "#eb968f" },
    { id: "gebraeunt", light: "#f4caa4", base: "#e4b286", shade: "#c98f64", deep: "#a86f47", lips: "#b3625a", blush: "#d98470" },
    { id: "oliv",      light: "#daa87c", base: "#c79063", shade: "#a57146", deep: "#875730", lips: "#98564d", blush: "#bd6f5b" },
    { id: "braun",     light: "#ab7550", base: "#935b38", shade: "#764324", deep: "#593016", lips: "#773f34", blush: "#95503e" },
    { id: "dunkel",    light: "#744c33", base: "#5a3723", shade: "#44270e", deep: "#321b09", lips: "#562e23", blush: "#6d3628" }
  ],

  hairColors: [
    { id: "blond",     base: "#e3c069", shade: "#b78f3c", light: "#ffeaa8" },
    { id: "goldblond", base: "#cfa044", shade: "#a07526", light: "#f5d68e" },
    { id: "hellbraun", base: "#9e6e3c", shade: "#774d24", light: "#c99c64" },
    { id: "braun",     base: "#6a4124", shade: "#452a13", light: "#93643e" },
    { id: "schwarz",   base: "#2e2724", shade: "#141110", light: "#564a42" },
    { id: "rot",       base: "#b95931", shade: "#8b3c19", light: "#e08c5c" },
    { id: "grau",      base: "#b2bbc5", shade: "#86919d", light: "#e1e7ed" },
    { id: "blau",      base: "#5464ea", shade: "#3540ae", light: "#919eff" }
  ],

  /* Iris: außen, Mitte, Pupillenrand */
  eyeColors: [
    { id: "blau",       light: "#a9e2f6", mid: "#3f8ecb", dark: "#173c63" },
    { id: "eisblau",    light: "#dcf4fc", mid: "#84c8e6", dark: "#2c6c92" },
    { id: "gruen",      light: "#cdeaa6", mid: "#5ea34e", dark: "#22481e" },
    { id: "haselnuss",  light: "#e8c884", mid: "#a4722f", dark: "#492b10" },
    { id: "braun",      light: "#c48d53", mid: "#7a4a1f", dark: "#331b06" },
    { id: "dunkelbraun",light: "#7d5c43", mid: "#402819", dark: "#150c05" },
    { id: "grau",       light: "#e2eaf1", mid: "#8fa0b0", dark: "#38444e" }
  ],

  outfits: [
    { id: "bluse",       name: "Weißes Hemd",  base: "#f6f9fd", shade: "#d3dfee", trim: "#ffffff" },
    { id: "blaujacke",   name: "Arbeitsjacke", base: "#2f6fed", shade: "#1c4cba", trim: "#9dc0ff" },
    { id: "warnweste",   name: "Warnweste",    base: "#f5a623", shade: "#cf8515", trim: "#fff1a8" },
    { id: "kapuzenpulli",name: "Kapuzenpulli", base: "#22a97c", shade: "#15805c", trim: "#8ae4c3" },
    { id: "lederjacke",  name: "Lederjacke",   base: "#3b3a45", shade: "#232229", trim: "#61606d" },
    { id: "latzhose",    name: "Arbeitslatz",  base: "#19b8c9", shade: "#0f8b99", trim: "#a9eef5" }
  ],

  /* Frisuren getrennt, damit jede Variante wirklich passt */
  hairW: ["wellen", "seitenscheitel", "zopf", "dutt", "bob", "locken", "kurz", "glatze"],
  hairM: ["kurz", "seitenscheitel", "undercut", "quiff", "locken", "wellen", "zopf", "glatze"],

  accessories: ["keine", "brille", "cap", "muetze", "headset"],
  beards: ["keiner", "stoppeln", "schnauzer", "vollbart"]
};

const AV_LABEL = {
  sex: { w: "Weiblich", m: "Männlich" },
  hair: {
    wellen: "Lange Wellen", seitenscheitel: "Seitenscheitel", zopf: "Pferdeschwanz",
    dutt: "Dutt", bob: "Bob", locken: "Locken", kurz: "Kurz",
    undercut: "Undercut", quiff: "Tolle", glatze: "Glatze"
  },
  acc: { keine: "Ohne", brille: "Brille", cap: "Cap", muetze: "Mütze", headset: "Headset" },
  beard: { keiner: "Ohne", stoppeln: "Dreitagebart", schnauzer: "Schnauzer", vollbart: "Vollbart" },
  skin: { porzellan: "Porzellan", hell: "Hell", gebraeunt: "Gebräunt", oliv: "Oliv", braun: "Braun", dunkel: "Dunkel" },
  hairColor: { blond: "Blond", goldblond: "Goldblond", hellbraun: "Hellbraun", braun: "Braun",
               schwarz: "Schwarz", rot: "Rot", grau: "Grau", blau: "Blau" },
  eyes: { blau: "Blau", eisblau: "Eisblau", gruen: "Grün", haselnuss: "Haselnuss",
          braun: "Braun", dunkelbraun: "Dunkelbraun", grau: "Grau" }
};

const AV_INK = "#3a2a20";

/* Zwei Farben mischen – für Brauen, die kräftiger als das Haar sein müssen. */
function avMix(a, b, t) {
  const p = (h) => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function avHairList(cfg) { return (cfg && AV.sexes[((cfg.sex % 2) + 2) % 2] === "m") ? AV.hairM : AV.hairW; }

function avLen(cfg, key) {
  return {
    sex: AV.sexes.length, skin: AV.skins.length, hair: avHairList(cfg).length,
    hairColor: AV.hairColors.length, eyes: AV.eyeColors.length,
    outfit: AV.outfits.length, acc: AV.accessories.length, beard: AV.beards.length
  }[key];
}
function avWrap(cfg, key) {
  const len = avLen(cfg, key) || 1;
  return (((cfg[key] || 0) % len) + len) % len;
}
function avDefault() {
  return { sex: 0, skin: 1, hair: 0, hairColor: 0, eyes: 0, outfit: 0, acc: 0, beard: 0 };
}
function avRandom(sex) {
  const cfg = avDefault();
  cfg.sex = sex == null ? Math.floor(Math.random() * 2) : sex;
  cfg.skin = Math.floor(Math.random() * AV.skins.length);
  cfg.hair = Math.floor(Math.random() * (avHairList(cfg).length - 1));   // ohne Glatze
  cfg.hairColor = Math.floor(Math.random() * AV.hairColors.length);
  cfg.eyes = Math.floor(Math.random() * AV.eyeColors.length);
  cfg.outfit = Math.floor(Math.random() * AV.outfits.length);
  cfg.acc = Math.random() < 0.45 ? Math.floor(Math.random() * AV.accessories.length) : 0;
  cfg.beard = AV.sexes[cfg.sex % 2] === "m" && Math.random() < 0.4
    ? 1 + Math.floor(Math.random() * (AV.beards.length - 1)) : 0;
  return cfg;
}

/* --------------------------- Kopfformen ---------------------------------
   Bezugsraum 200 breit. Scheitel y28, Kinn y140 (w) bzw. y142 (m).        */
/* Kopfformen. Breite zu Höhe liegt bei 0,70 (weiblich) bzw. 0,74 (männlich) –
   gemessen am Vorbild. Der männliche Kopf behält die Breite bis weit nach
   unten und knickt dann im Kieferwinkel ab; der weibliche läuft weich aus. */
const HEAD_W =
  "M100 141 C91 141 83.5 137 77.5 129 C69.5 118 63.5 106 61 92 " +
  "C58 77 59 62 65.5 51 C73 37 85 28 100 28 " +
  "C115 28 127 37 134.5 51 C141 62 142 77 139 92 " +
  "C136.5 106 130.5 118 122.5 129 C116.5 137 109 141 100 141 Z";
const HEAD_M =
  "M100 144 C90 144 81.5 140 75.5 132 L66 112 " +
  "C61 102 58 93 57 84 L56.5 62 " +
  "C58 44 74 27 100 27 C126 27 142 44 143.5 62 " +
  "L143 84 C142 93 139 102 134 112 L124.5 132 " +
  "C118.5 140 110 144 100 144 Z";

/* Feste Gesichtspunkte. Alles andere richtet sich danach aus. */
const FACE = { eyeY: 89, eyeDX: 16.5, browY: 73, noseY: 108, mouthY: 120, earY: 82 };

/* --------------------------- Verläufe ------------------------------------ */
function avDefs(u, sk, hc, ec, fit, head, opts) {
  return `<defs>
    <radialGradient id="bg${u}" cx="50%" cy="26%" r="84%">
      <stop offset="0" stop-color="${(opts && opts.bgColor) || "#dcebfd"}"/>
      <stop offset="1" stop-color="${(opts && opts.bgColor2) || "#a6c6ee"}"/>
    </radialGradient>
    <linearGradient id="sk${u}" x1="0.78" y1="0" x2="0.2" y2="1">
      <stop offset="0" stop-color="${sk.light}"/>
      <stop offset="0.45" stop-color="${sk.base}"/>
      <stop offset="1" stop-color="${sk.shade}"/>
    </linearGradient>
    <linearGradient id="hr${u}" x1="0.16" y1="0" x2="0.84" y2="1">
      <stop offset="0" stop-color="${hc.light}"/>
      <stop offset="0.38" stop-color="${hc.base}"/>
      <stop offset="1" stop-color="${hc.shade}"/>
    </linearGradient>
    <linearGradient id="ft${u}" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${fit.base}"/>
      <stop offset="1" stop-color="${fit.shade}"/>
    </linearGradient>
    <radialGradient id="ir${u}" cx="38%" cy="30%" r="74%">
      <stop offset="0" stop-color="${ec.light}"/>
      <stop offset="0.44" stop-color="${ec.mid}"/>
      <stop offset="1" stop-color="${ec.dark}"/>
    </radialGradient>
    <radialGradient id="bl${u}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${sk.blush}" stop-opacity="0.52"/>
      <stop offset="1" stop-color="${sk.blush}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="hd${u}"><path d="${head}"/></clipPath>
    <clipPath id="ey${u}"><path d="${(opts && opts.eyePath) || EYE_OPEN}"/></clipPath>
  </defs>`;
}

/* ----------------------------------- Auge --------------------------------
   Lidöffnung, angeschnittene Iris mit Limbusring und Fasern, Lidschatten,
   zwei Glanzlichter, Wimpernkranz mit Schwung, Lidfalte, Wasserlinie.     */
const EYE_OPEN =
  "M-11.2 0.4 C-8.6 -6 -3.6 -8.8 0.4 -8.8 C4.8 -8.8 9 -5.8 11.2 0.4 " +
  "C8.8 4.8 4.4 6.4 0.4 6.4 C-3.8 6.4 -8.6 4.6 -11.2 0.4 Z";
/* Das männliche Lid ist flacher und läuft außen länger aus. */
const EYE_OPEN_M =
  "M-11.6 0.2 C-9 -4.9 -3.8 -7.3 0.2 -7.3 C4.7 -7.3 9.2 -4.9 11.6 0.2 " +
  "C9.2 3.9 4.6 5.3 0.2 5.3 C-4.1 5.3 -9.2 3.9 -11.6 0.2 Z";

const IRIS_FIBRE = (() => {
  let d = "";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    const x1 = (0.6 + Math.cos(a) * 3.4).toFixed(2), y1 = (-2 + Math.sin(a) * 3.4).toFixed(2);
    const x2 = (0.6 + Math.cos(a) * 6.7).toFixed(2), y2 = (-2 + Math.sin(a) * 6.7).toFixed(2);
    d += `M${x1} ${y1}L${x2} ${y2}`;
  }
  return d;
})();

function avEye(u, sk, ec, ink, cx, flip, fem) {
  /* Augenbreite ≈ 27 % der Gesichtsbreite. Größer wirkt sofort puppenhaft. */
  const s = fem ? 0.93 : 0.88;
  const SHAPE = fem ? EYE_OPEN : EYE_OPEN_M;
  const lash = fem ? 1 : 0.62;                  // Wimpernkranz dünner
  const L = (w) => (w * lash).toFixed(2);
  return `<g transform="translate(${cx} ${FACE.eyeY}) scale(${flip ? -s : s} ${s})">
    <path d="${SHAPE}" fill="#f7f8fc"/>
    <g clip-path="url(#ey${u})">
      <circle cx="0.6" cy="-1.2" r="6.6" fill="url(#ir${u})"/>
      <path d="${IRIS_FIBRE}" stroke="${ec.light}" stroke-width="0.5" opacity="0.3" fill="none" stroke-linecap="round"/>
      <circle cx="0.6" cy="-1.2" r="6.2" fill="none" stroke="${ec.dark}" stroke-width="1.5" opacity="0.92"/>
      <circle cx="0.6" cy="-1.2" r="2.2" fill="#0c0a11"/>
      <path d="M-13 -3 C-9 -9.6 -3.4 -12.2 0.4 -12.2 C5 -12.2 9.8 -9 13 -2.4 L13 -13 L-13 -13 Z"
            fill="${sk.deep}" opacity="0.3"/>
      <ellipse cx="-2.1" cy="-4" rx="2.4" ry="1.85" fill="#ffffff" opacity="0.95"
               transform="rotate(-22 -2.1 -4)"/>
      <circle cx="3.6" cy="0.8" r="1.2" fill="#ffffff" opacity="0.5"/>
      <path d="M-9.6 4.1 C-6 6.3 6 6.3 9.6 3.7" stroke="#ffffff" stroke-width="1.3" fill="none" opacity="0.45"/>
    </g>
    <path d="M-11.2 0.4 C-13.3 -0.6 -13.7 1.9 -11.8 2.7 Z" fill="${sk.lips}" opacity="0.55"/>
    ${fem
      ? `<path d="M-11.6 0.6 C-9 -6.6 -3.6 -9.6 0.4 -9.6 C5.2 -9.6 9.6 -6.4 11.8 0.2
             C9.2 -4.4 4.8 -7 0.4 -7 C-3.8 -7 -8.2 -4.6 -11.6 0.6 Z" fill="${ink}"/>`
      : `<path d="M-11.8 0.4 C-9.4 -5.2 -4 -7.9 0.2 -7.9 C4.8 -7.9 9.6 -5.2 12 0
             C9.4 -3.6 4.8 -5.8 0.2 -5.8 C-4 -5.8 -8.6 -3.8 -11.8 0.4 Z" fill="${ink}"/>`}
    ${fem ? `<path d="M11.4 0 C13.3 -1.2 14.5 -2.8 15.1 -4.2" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M8.7 -4.4 C9.8 -5.7 10.5 -6.7 10.9 -7.6" stroke="${ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M5.7 -6.2 C6.4 -7.3 6.9 -8.2 7.2 -9" stroke="${ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <path d="M2.5 -7.1 C2.9 -8.2 3.1 -8.9 3.2 -9.5" stroke="${ink}" stroke-width="1.15" fill="none" stroke-linecap="round"/>`
    : ``}
    <path d="M-10.8 1.2 C-8.2 4.8 -4 6.4 0.4 6.4 C4.6 6.4 8.6 4.8 11 1"
          stroke="${ink}" stroke-width="${fem ? 1.35 : 1}" fill="none" opacity="${fem ? 0.55 : 0.34}" stroke-linecap="round"/>
    <path d="M-9.4 -2.6 C-6.8 -8.4 -2 -10.7 2 -10.6 C5.6 -10.5 8.8 -8.5 10.8 -5.3"
          stroke="${sk.deep}" stroke-width="1.4" fill="none" opacity="0.28" stroke-linecap="round"/>
    <path d="M-9.4 5.2 C-6 7.8 5 7.8 9.4 4.8"
          stroke="${sk.deep}" stroke-width="1.6" fill="none" opacity="0.32" stroke-linecap="round"/>
  </g>`;
}

/* ------------------------------- Braue -----------------------------------
   Die Braue ist kräftiger als das Haar und sitzt deutlich über dem Lid. */
function avBrow(hcRaw, cx, flip, fem, dy) {
  const hc = { base: avMix(hcRaw.base, "#2a1c12", 0.4), shade: avMix(hcRaw.shade, "#241710", 0.62), light: hcRaw.base };
  const y = (fem ? FACE.browY : FACE.browY + 2.5) + (dy || 0);
  const hairs = fem
    ? ["M-10 -1.6 C-8.8 -3.4 -7 -4.4 -5 -5", "M-6.6 -3.2 C-5.4 -5 -3.4 -6.1 -1.4 -6.5",
       "M-3 -4.3 C-1.8 -6.1 0.4 -7 2.4 -7.2", "M0.6 -5 C1.8 -6.6 4 -7.2 6 -7",
       "M4.2 -5 C5.6 -6.3 7.6 -6.5 9.4 -5.9"]
    : ["M-11 -2.4 C-9.4 -4.6 -7 -5.8 -4.6 -6.4", "M-7 -4 C-5.4 -6.2 -3 -7.3 -0.6 -7.6",
       "M-3 -5.2 C-1.4 -7.2 1.4 -8 3.8 -8", "M1 -5.8 C2.6 -7.4 5.4 -7.8 7.8 -7.4",
       "M5 -5.6 C6.8 -6.8 9 -6.9 11 -6.2"];
  const shape = fem
    ? "M-11.4 -1.2 C-7.6 -7.2 2.2 -8.8 10.6 -4.2 C11.7 -3.6 11.4 -1.9 10 -2.2 " +
      "C2.6 -4 -4.4 -3.4 -10.6 0 C-11.9 0.7 -12.1 -0.4 -11.4 -1.2 Z"
    : "M-12.4 -1.8 C-8.2 -8.2 3 -9.8 12.2 -5 C13.6 -4.2 13.4 -1.4 11.6 -2 " +
      "C3.4 -4.6 -4.6 -4 -11.4 -0.2 C-13 0.5 -13.2 -0.9 -12.4 -1.8 Z";
  return `<g transform="translate(${cx} ${y})${flip ? " scale(-1 1)" : ""} scale(${fem ? 1.12 : 1.14})">
    <path d="${shape}" fill="${hc.shade}" opacity="${fem ? 0.94 : 1}"/>
    <path d="${fem ? "M-10.2 -2.4 C-6.6 -7 2 -8 9.4 -4.4" : "M-11.2 -2.4 C-7 -8 3 -9.2 11 -4.8"}"
          stroke="${hc.light}" stroke-width="1.3" fill="none" opacity="0.38" stroke-linecap="round"/>
    <g stroke="${hc.base}" stroke-width="${fem ? 1.3 : 1.6}" fill="none" opacity="0.72" stroke-linecap="round">
      ${hairs.map(d => `<path d="${d}"/>`).join("")}
    </g></g>`;
}

/* --------------------------- Nase und Mund --------------------------------
   Die Nase ist fast nur Schatten: ein weicher Fleck an der Flanke, eine
   Spitze und angedeutete Nasenlöcher. Eine durchgezogene Linie würde im
   Comic-Gesicht sofort zu schwer wirken.                                   */
function avNose(sk, fem) {
  const w = fem ? 1 : 1.34;                 /* männlich deutlich breiter */
  const y = FACE.noseY;                     /* Unterkante der Nase */
  const X = (d) => (100 + d * w).toFixed(1);
  return `<path d="M${X(-2.6)} ${y - 13} C${X(-4.2)} ${y - 8} ${X(-4.6)} ${y - 4.5} ${X(-3.2)} ${y - 3}"
        stroke="${sk.deep}" stroke-width="${(2.9 * w).toFixed(1)}" fill="none" opacity="0.17" stroke-linecap="round"/>
    <path d="M${X(-3.4)} ${y - 2.6} C${X(-2)} ${y - 0.2} ${X(3.4)} ${y} ${X(4.8)} ${y - 2.2}"
        stroke="${sk.deep}" stroke-width="${(1.9 * w).toFixed(1)}" fill="none" opacity="0.6" stroke-linecap="round"/>
    <ellipse cx="${X(-4.2)}" cy="${y - 1.4}" rx="${(1.65 * w).toFixed(2)}" ry="1" fill="${sk.deep}" opacity="0.34"/>
    <ellipse cx="${X(4.2)}" cy="${y - 1.4}" rx="${(1.65 * w).toFixed(2)}" ry="1" fill="${sk.deep}" opacity="0.34"/>
    <path d="M101.6 ${y - 9} C101.4 ${y - 6} 101.2 ${y - 4} 101 ${y - 3}"
        stroke="${sk.light}" stroke-width="2" fill="none" opacity="0.26" stroke-linecap="round"/>`;
}

function avMouth(sk, ink, fem) {
  const lip = avMix(sk.lips, fem ? "#ffe0d2" : sk.base, fem ? 0.42 : 0.52);
  const y = FACE.mouthY;                    /* Mundspalt */
  const edge = avMix(ink, sk.deep, 0.45);
  if (fem) {
    return `<path d="M89.4 ${y} C92 ${y - 3.4} 95.2 ${y - 3.8} 97.4 ${y - 2.1} L100 ${y - 3.6} L102.6 ${y - 2.1}
             C104.8 ${y - 3.8} 108 ${y - 3.4} 110.6 ${y}
             C107.8 ${y + 7} 92.2 ${y + 7} 89.4 ${y} Z"
          fill="${lip}" stroke="${edge}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M90.9 ${y + 0.3} C95.4 ${y + 1.7} 104.6 ${y + 1.7} 109.1 ${y + 0.3}"
          stroke="${avMix(ink, sk.deep, 0.3)}" stroke-width="1.15" fill="none" opacity="0.5"/>
      <path d="M94.6 ${y + 3.2} C97 ${y + 4.6} 103 ${y + 4.6} 105.4 ${y + 3.2}"
          stroke="#ffffff" stroke-width="1.8" fill="none" opacity="0.42"/>
      <path d="M96.8 ${y - 1.7} C98.1 ${y - 2.6} 101.9 ${y - 2.6} 103.2 ${y - 1.7}"
          stroke="#ffffff" stroke-width="1.25" fill="none" opacity="0.35"/>
      <path d="M93.4 ${y + 7} C96.6 ${y + 8.4} 103.4 ${y + 8.4} 106.6 ${y + 7}"
          stroke="${sk.deep}" stroke-width="1.7" fill="none" opacity="0.22" stroke-linecap="round"/>`;
  }
  /* Männlich: breiter Spalt, flache Lippen, kaum Glanz. */
  return `<path d="M88.4 ${y} C91.6 ${y - 2.4} 95.4 ${y - 2.6} 97.8 ${y - 1.6} L100 ${y - 2.4} L102.2 ${y - 1.6}
           C104.6 ${y - 2.6} 108.4 ${y - 2.4} 111.6 ${y}
           C108.4 ${y + 4.6} 91.6 ${y + 4.6} 88.4 ${y} Z"
        fill="${lip}" stroke="${edge}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M89.8 ${y + 0.2} C95 ${y + 1.4} 105 ${y + 1.4} 110.2 ${y + 0.2}"
        stroke="${avMix(ink, sk.deep, 0.34)}" stroke-width="1.3" fill="none" opacity="0.6"/>
    <path d="M95 ${y + 2.6} C97.6 ${y + 3.4} 102.4 ${y + 3.4} 105 ${y + 2.6}"
        stroke="#ffffff" stroke-width="1.3" fill="none" opacity="0.22"/>
    <path d="M92.6 ${y + 5.4} C96.2 ${y + 6.8} 103.8 ${y + 6.8} 107.4 ${y + 5.4}"
        stroke="${sk.deep}" stroke-width="1.8" fill="none" opacity="0.24" stroke-linecap="round"/>`;
}

/* ------------------------------ Kopf & Gesicht ---------------------------- */
function avHead(u, sk, hc, ec, ink, style, acc, beard, fem) {
  const head = fem ? HEAD_W : HEAD_M;
  const hair = avHair(style, u, hc, sk, ink, fem);
  const extra = avAccessory(acc, u, hc, sk, ink);
  const ey = FACE.earY, eh = fem ? 1 : 1.12;
  const ear = (x, flip) => {
    const d = (v) => x + (flip ? v : -v);
    return `<path d="M${x} ${ey} C${d(5.6 * eh)} ${ey - 3} ${d(8.4 * eh)} ${ey + 6 * eh}
      ${d(8 * eh)} ${ey + 13 * eh} C${d(6.2 * eh)} ${ey + 18 * eh} ${d(2 * eh)} ${ey + 19.5 * eh} ${x} ${ey + 16 * eh}"
      fill="url(#sk${u})" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  };

  return `
    ${ear(fem ? 63 : 60, false)}${ear(fem ? 137 : 140, true)}
    <path d="${head}" fill="url(#sk${u})" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#hd${u})">
      <path d="M62 34 C46 56 46 104 62 130 C72 146 86 152 100 152 L46 152 L46 24 Z"
            fill="${sk.shade}" opacity="0.3"/>
      <path d="M72 96 C76 107 81 114 88 118" stroke="${sk.deep}" stroke-width="3" fill="none" opacity="0.16" stroke-linecap="round"/>
      <path d="M128 96 C124 107 119 114 112 118" stroke="${sk.deep}" stroke-width="3" fill="none" opacity="0.16" stroke-linecap="round"/>
      ${fem ? `<ellipse cx="76" cy="100" rx="14" ry="9" fill="url(#bl${u})"/>
      <ellipse cx="124" cy="100" rx="14" ry="9" fill="url(#bl${u})"/>`
      : `<ellipse cx="74" cy="99" rx="13" ry="7" fill="url(#bl${u})" opacity="0.4"/>
      <ellipse cx="126" cy="99" rx="13" ry="7" fill="url(#bl${u})" opacity="0.4"/>
      <path d="M78 130 C86 137 114 137 122 130" stroke="${sk.deep}" stroke-width="7" fill="none" opacity="0.13" stroke-linecap="round"/>`}
      <path d="M100 130 C95 130 92 128 90 125 C94 128 106 128 110 125 C108 128 105 130 100 130 Z"
            fill="${sk.deep}" opacity="0.16"/>
      ${avBeard(beard, hc, sk, fem)}
    </g>
    ${style === "glatze" ? "" : hair.front}
    ${avEye(u, sk, ec, ink, 100 - FACE.eyeDX, true, fem)}${avEye(u, sk, ec, ink, 100 + FACE.eyeDX, false, fem)}
    ${avBrow(hc, 100 - FACE.eyeDX, true, fem, 0)}${avBrow(hc, 100 + FACE.eyeDX, false, fem, 0.9)}
    ${avNose(sk, fem)}
    ${avMouth(sk, ink, fem)}
    ${avBeardFront(beard, hc, ink)}
    ${style === "glatze" ? `<path d="M74 50 C84 38 100 34 114 40" stroke="#ffffff" stroke-width="5" fill="none" opacity="0.16" stroke-linecap="round"/>` : ""}
    ${extra}
    ${style === "glatze" ? "" : hair.over}`;
}

/* --------------------------------- Bart ----------------------------------- */
function avBeard(beard, hc, sk, fem) {
  if (fem || beard === "keiner") return "";
  if (beard === "stoppeln") {
    return `<path d="M63 104 C67 130 79 146 100 146 C121 146 133 130 137 104
      C133 124 120 132 100 132 C80 132 67 124 63 104 Z" fill="${hc.shade}" opacity="0.22"/>`;
  }
  return `<path d="M61 100 C64 132 76 150 100 150 C124 150 136 132 139 100
      C134 122 118 128 100 128 C82 128 66 122 61 100 Z" fill="${hc.base}" opacity="0.95"/>
    <path d="M69 113 C74 130 83 139 100 141 C117 139 126 130 131 113"
      stroke="${hc.shade}" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>`;
}
function avBeardFront(beard, hc, ink) {
  if (beard === "schnauzer" || beard === "vollbart") {
    return `<path d="M86 115.5 C90.4 110.6 96.8 110 100 112.6 C103.2 110 109.6 110.6 114 115.5
        C108.6 114.2 104.2 114.9 100 116.4 C95.8 114.9 91.4 114.2 86 115.5 Z"
      fill="${hc.base}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>`;
  }
  return "";
}

/* ====================== Eigene Porträts (Bilddateien) =====================
   Wie bei Lina Sturm: liegt unter art/player/<id>.png ein Bild, benutzt das
   Spiel es anstelle der gezeichneten Figur. Fehlt es, bleibt alles beim
   SVG-Baukasten. Siehe art/player/README.md.                              */
const PLAYER_ART_SLOTS = [
  { id: "w1", label: "Porträt 1" }, { id: "w2", label: "Porträt 2" },
  { id: "w3", label: "Porträt 3" }, { id: "w4", label: "Porträt 4" },
  { id: "m1", label: "Porträt 5" }, { id: "m2", label: "Porträt 6" },
  { id: "m3", label: "Porträt 7" }, { id: "m4", label: "Porträt 8" }
];
const playerArt = {};                       /* id -> Dateipfad, wenn geladen */
function playerArtSrc(id) { return playerArt[id] || ""; }
function hasPlayerArt() { return Object.keys(playerArt).length > 0; }
function probePlayerArt(done) {
  let open = 0, any = false;
  PLAYER_ART_SLOTS.forEach(sl => {
    ["png", "webp"].forEach(ext => {
      open++;
      const img = new Image();
      const src = "art/player/" + sl.id + "." + ext;
      img.onload = () => { if (!playerArt[sl.id]) { playerArt[sl.id] = src; any = true; } fin(); };
      img.onerror = fin;
      img.src = src;
    });
  });
  function fin() { if (--open <= 0 && done) done(any); }
  if (!open && done) done(false);
}

/* Porträt für HUD, Karten und Auswahl: Bild, wenn vorhanden, sonst SVG. */
function portraitHTML(cfg, size, opts) {
  const id = cfg && cfg.art;
  if (id && playerArt[id]) {
    return `<img class="pt-art" src="${playerArt[id]}" width="${size}" height="${size}"
            alt="${(opts && opts.label) || "Porträt"}">`;
  }
  return avatarSVG(cfg, size, opts);
}

/* ======================= Rundes Porträt (Spielfigur) ====================== */
function avatarSVG(cfg, size, opts) {
  opts = opts || {};
  cfg = Object.assign(avDefault(), cfg || {});
  const u = "v" + String(opts.uid == null ? Math.random().toString(36).slice(2, 7) : opts.uid).replace(/\W/g, "");
  const fem = AV.sexes[avWrap(cfg, "sex")] === "w";
  const sk = AV.skins[avWrap(cfg, "skin")];
  const hc = AV.hairColors[avWrap(cfg, "hairColor")];
  const ec = AV.eyeColors[avWrap(cfg, "eyes")];
  const fit = AV.outfits[avWrap(cfg, "outfit")];
  const style = avHairList(cfg)[avWrap(cfg, "hair")];
  const acc = AV.accessories[avWrap(cfg, "acc")];
  const beard = fem ? "keiner" : AV.beards[avWrap(cfg, "beard")];
  const ink = AV_INK;
  const head = fem ? HEAD_W : HEAD_M;
  const hair = avHair(style, u, hc, sk, ink, fem);

  /* Ein kurzer, kräftiger Hals – lang und dünn wirkt sofort wie eine Puppe. */
  const nl = fem ? 84 : 81, nr = fem ? 116 : 119;
  const neck = `
    <path d="M${nl} 124 L${nl} 152 C${nl} 161 91 165 100 165
             C109 165 ${nr} 161 ${nr} 152 L${nr} 124 Z"
          fill="url(#sk${u})" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${nl} 128 C92 143 108 143 ${nr} 128 L${nr} 122 L${nl} 122 Z"
          fill="${sk.deep}" opacity="0.4"/>`;

  const shoulders = fem ? "M12 200 C17 176 43 162 74 157 L126 157 C157 162 183 176 188 200 Z"
                        : "M4 200 C10 173 38 159 71 154 L129 154 C162 159 190 173 196 200 Z";
  const torso = `<path d="${shoulders}" fill="url(#ft${u})" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`;

  const bg = opts.bg === false ? "" : `<circle cx="100" cy="100" r="97" fill="url(#bg${u})"/>`;
  const clip = opts.bg === false ? "" : `<clipPath id="cp${u}"><circle cx="100" cy="100" r="97"/></clipPath>`;

  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.label || "Porträt"}">
    ${avDefs(u, sk, hc, ec, fit, head, Object.assign({ eyePath: fem ? EYE_OPEN : EYE_OPEN_M }, opts))}${clip}
    ${bg}
    <g${opts.bg === false ? "" : ` clip-path="url(#cp${u})"`}>
      ${hair.back}${torso}${neck}${avOutfitDetail(fit, u, ink, fem ? 157 : 154)}
      ${avHead(u, sk, hc, ec, ink, style, acc, beard, fem)}
    </g></svg>`;
}

/* ================== Brustbild für Tutorial und Intro ======================
   Bezugsraum 300 × 300. Der Kopf sitzt bei (150, 110), Schultern ab y 196. */
function avatarFigureSVG(cfg, width, opts) {
  opts = opts || {};
  cfg = Object.assign(avDefault(), cfg || {});
  const u = "f" + String(opts.uid == null ? Math.random().toString(36).slice(2, 7) : opts.uid).replace(/\W/g, "");
  const fem = AV.sexes[avWrap(cfg, "sex")] === "w";
  const sk = AV.skins[avWrap(cfg, "skin")];
  const hc = AV.hairColors[avWrap(cfg, "hairColor")];
  const ec = AV.eyeColors[avWrap(cfg, "eyes")];
  const fit = AV.outfits[avWrap(cfg, "outfit")];
  const style = avHairList(cfg)[avWrap(cfg, "hair")];
  const acc = AV.accessories[avWrap(cfg, "acc")];
  const beard = fem ? "keiner" : AV.beards[avWrap(cfg, "beard")];
  const ink = AV_INK;
  const head = fem ? HEAD_W : HEAD_M;
  const hair = avHair(style, u, hc, sk, ink, fem);
  const O = `stroke="${ink}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"`;
  const k = 0.94, hx = 150 - 100 * k, hy = 110 - 84 * k;

  const neck = `
    <path d="M132 152 L132 198 C132 210 168 210 168 198 L168 152 Z" fill="url(#sk${u})" ${O}/>
    <path d="M132 158 C140 178 160 178 168 158 L168 150 L132 150 Z" fill="${sk.deep}" opacity="0.42"/>`;

  const chest = `
    <path d="M30 300 C36 250 78 212 124 202 L176 202 C222 212 264 250 270 300 Z"
          fill="url(#ft${u})" ${O}/>
    <path d="M124 202 L150 234 L176 202 L196 212 L150 258 L104 212 Z" fill="${fit.trim}" ${O}/>
    <path d="M124 202 L108 216 L131 228 Z" fill="${fit.shade}" ${O}/>
    <path d="M176 202 L192 216 L169 228 Z" fill="${fit.shade}" ${O}/>
    ${fit.id === "warnweste" ? `<path d="M74 248 C68 268 64 284 62 300 M226 248 C232 268 236 284 238 300"
        stroke="${fit.trim}" stroke-width="11" fill="none" opacity="0.9" stroke-linecap="round"/>` : ""}
    ${fit.id === "kapuzenpulli" ? `<path d="M134 244 L130 294 M166 244 L170 294"
        stroke="${fit.trim}" stroke-width="5" stroke-linecap="round"/>` : ""}
    <path d="M150 258 L150 300" stroke="${ink}" stroke-width="2.2" opacity="0.3"/>
    <path d="M78 264 C70 278 64 290 60 300" stroke="${fit.shade}" stroke-width="3.4" fill="none" opacity="0.45" stroke-linecap="round"/>
    <path d="M222 264 C230 278 236 290 240 300" stroke="${fit.shade}" stroke-width="3.4" fill="none" opacity="0.45" stroke-linecap="round"/>`;

  return `<svg viewBox="0 0 300 300" width="${width}" height="${width}"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.label || "Figur"}">
    ${avDefs(u, sk, hc, ec, fit, head, Object.assign({ eyePath: fem ? EYE_OPEN : EYE_OPEN_M }, opts))}
    <g transform="rotate(-3 150 150)">
      <g transform="translate(${hx} ${hy}) scale(${k})">${hair.back}</g>
      ${neck}${chest}
      <g transform="translate(${hx} ${hy}) scale(${k})">${avHead(u, sk, hc, ec, ink, style, acc, beard, fem)}</g>
    </g>
  </svg>`;
}

/* --------------------------------- Frisuren -------------------------------
   Jede Frisur besteht aus drei Lagen:
     back  – Masse hinter Kopf und Schultern
     front – Haaransatz und Deckhaar (liegt unter Augen und Brauen)
     over  – Strähnen, die vor Wange und Ohr fallen                          */
function avHair(style, u, hc, sk, ink, fem) {
  const F = `fill="url(#hr${u})" stroke="${ink}" stroke-width="3" stroke-linejoin="round"`;
  const gloss = (d, w) => `<path d="${d}" stroke="${hc.light}" stroke-width="${w || 5}" fill="none" opacity="0.42" stroke-linecap="round"/>`;
  const strand = (d, w) => `<path d="${d}" stroke="${hc.shade}" stroke-width="${w || 1.9}" fill="none" opacity="0.5" stroke-linecap="round"/>`;

  /* Deckhaar und gesichtsrahmende Strähnen sind EINE geschlossene Form.
     Getrennt gezeichnet ergäbe der Umriss an der Schläfe eine harte Kante. */
  const FRONT_LONG =
    `M70 152 C57 134 49 112 49 88 C48 66 56 40 74 26
     C82 20 92 18 100 18 C108 18 118 20 126 26
     C144 40 152 66 151 88 C151 112 143 134 130 152
     C137 146 142 130 143 112 C144 94 142 82 138 70
     C131 55 117 47 104 49 C93 51 84 57 77 66
     C72 76 69 90 68 108 C67 126 66 142 70 152 Z`;
  const FRONT_MED =
    `M72 128 C60 118 50 104 49 88 C48 66 56 40 74 26
     C82 20 92 18 100 18 C108 18 118 20 126 26
     C144 40 152 66 151 88 C150 104 140 118 128 128
     C135 122 142 106 143 94 C144 84 142 78 138 70
     C131 55 117 47 104 49 C93 51 84 57 77 66
     C72 76 69 84 68 96 C67 110 68 122 72 128 Z`;
  /* Kappe ohne Strähnen – für zurückgebundenes und kurzes Haar */
  const capRound =
    `M55 100 C48 56 68 20 100 20 C132 20 152 56 145 100
     C143 84 137 70 124 62 C110 55 90 55 76 62 C63 70 57 84 55 100 Z`;
  const partLine = `
    <path d="M106 50 C112 38 116 28 117 21" stroke="${hc.shade}" stroke-width="2.2" fill="none" opacity="0.4" stroke-linecap="round"/>
    <path d="M100 52 C92 42 84 34 74 30" stroke="${hc.shade}" stroke-width="1.7" fill="none" opacity="0.3" stroke-linecap="round"/>
    <path d="M92 57 C82 52 72 51 62 54" stroke="${hc.shade}" stroke-width="1.7" fill="none" opacity="0.26" stroke-linecap="round"/>`;
  const lockShade = `
    <path d="M60 96 C56 116 57 136 62 150" stroke="${hc.shade}" stroke-width="2" fill="none" opacity="0.38" stroke-linecap="round"/>
    <path d="M140 96 C144 116 143 136 138 150" stroke="${hc.shade}" stroke-width="2" fill="none" opacity="0.38" stroke-linecap="round"/>`;

  let back = "", front = "", over = "";

  if (style === "wellen") {
    back = `<path d="M44 104 C36 54 60 12 100 12 C140 12 164 54 156 104
        C161 140 164 176 160 206 C156 214 142 214 138 204
        C146 166 143 128 134 100 L66 100 C57 128 54 166 62 204
        C58 214 44 214 40 206 C36 176 39 140 44 104 Z" ${F}/>
      ${strand("M52 118 C47 150 47 182 52 202")}
      ${strand("M60 110 C55 142 55 174 59 198")}
      ${strand("M148 118 C153 150 153 182 148 202")}
      ${strand("M140 110 C145 142 145 174 141 198")}`;
    front = `<path d="${FRONT_LONG}" ${F}/>
      ${gloss("M72 44 C86 30 106 24 124 34")}${partLine}${lockShade}`;
  }

  if (style === "seitenscheitel") {
    back = `<path d="M50 102 C42 56 64 16 100 16 C136 16 158 56 150 102
        C153 126 154 148 151 164 C146 170 136 168 134 160
        C140 138 138 118 132 100 L68 100 C62 118 60 138 66 160
        C64 168 54 170 49 164 C46 148 47 126 50 102 Z" ${F}/>
      ${strand("M58 116 C54 136 54 152 57 164")}
      ${strand("M142 116 C146 136 146 152 143 164")}`;
    front = `<path d="${FRONT_MED}" ${F}/>
      ${gloss("M72 46 C86 32 106 26 122 36")}${partLine}`;
  }

  if (style === "bob") {
    back = `<path d="M48 102 C40 54 62 14 100 14 C138 14 160 54 152 102
        C154 118 152 132 146 142 C140 148 130 144 130 136
        C136 124 135 112 131 100 L69 100 C65 112 64 124 70 136
        C70 144 60 148 54 142 C48 132 46 118 48 102 Z" ${F}/>`;
    front = `<path d="${FRONT_MED}" ${F}/>
      ${gloss("M72 44 C86 30 106 24 124 34")}${partLine}`;
  }

  if (style === "zopf") {
    back = `<path d="M50 100 C43 54 66 16 100 16 C134 16 157 54 150 100 L150 108 L50 108 Z" ${F}/>
      <path d="M146 72 C176 82 188 118 178 150 C171 172 154 182 141 176
        C158 154 160 114 142 92 Z" ${F}/>
      ${strand("M152 90 C167 110 168 140 158 162")}
      ${strand("M158 82 C174 104 175 136 166 158")}
      <ellipse cx="146" cy="74" rx="9.5" ry="7.5" fill="${hc.shade}" stroke="${ink}" stroke-width="2.6"/>`;
    front = `<path d="${capRound}" ${F}/>
      ${gloss("M74 44 C88 32 106 28 120 34")}
      ${strand("M80 54 C92 46 110 44 122 50")}
      ${strand("M66 76 C72 62 84 54 96 52")}`;
  }

  if (style === "dutt") {
    back = `<circle cx="100" cy="24" r="21" ${F}/>
      ${strand("M88 18 C96 11 108 11 115 18")}
      ${strand("M86 28 C94 21 108 21 116 28")}`;
    front = `<path d="${capRound}" ${F}/>
      ${gloss("M74 46 C88 34 104 30 118 36")}
      ${strand("M64 78 C72 64 84 56 100 54")}
      ${strand("M136 78 C128 64 116 56 100 54")}`;
  }

  if (style === "locken") {
    /* Eine geschlossene, wellige Silhouette. Einzelne Kreise sehen aus wie
       aufgeklebte Bälle – die Locken kommen aus den Bögen im Inneren. */
    const mass = fem
      ? "M100 14 C124 14 142 26 148 46 C154 62 153 82 150 98 C148 112 146 124 142 132 " +
        "C140 120 137 110 133 104 C137 84 134 62 120 52 C110 45 90 45 80 52 " +
        "C66 62 63 84 67 104 C63 110 60 120 58 132 C54 124 52 112 50 98 " +
        "C47 82 46 62 52 46 C58 26 76 14 100 14 Z"
      : "M100 14 C124 14 141 26 146 46 C150 62 149 80 146 94 C144 104 142 110 139 116 " +
        "C138 104 136 96 133 92 C137 74 133 58 119 50 C110 45 90 45 81 50 " +
        "C67 58 63 74 67 92 C64 96 62 104 61 116 C58 110 56 104 54 94 " +
        "C51 80 50 62 54 46 C59 26 76 14 100 14 Z";
    const curl = (x, y, r, a) =>
      `<path d="M${x - r} ${y} A${r} ${r * 0.82} 0 1 1 ${x + r} ${y}" fill="none"
         stroke="${hc.shade}" stroke-width="2.4" opacity="0.55" stroke-linecap="round"
         transform="rotate(${a} ${x} ${y})"/>`;
    back = `<path d="${mass}" ${F}/>`;
    front = `<path d="${mass}" ${F}/>
      ${curl(72, 44, 9, -12)}${curl(100, 34, 10, 4)}${curl(128, 44, 9, 12)}
      ${curl(64, 70, 8, -20)}${curl(136, 70, 8, 20)}
      ${curl(86, 40, 7, -4)}${curl(114, 40, 7, 6)}
      ${gloss("M84 30 C94 23 110 23 120 29", 4)}`;
    over = "";
  }

  if (style === "kurz") {
    front = `<path d="${capRound}" ${F}/>
      ${gloss("M74 44 C88 32 106 28 120 34")}
      ${strand("M62 82 C68 66 80 56 96 52")}
      ${strand("M138 82 C132 66 120 56 104 52")}
      ${strand("M84 56 C94 51 108 51 116 55")}
      <path d="M58 92 C57 82 58 74 61 68 C64 74 64 84 63 94 Z" ${F}/>
      <path d="M142 92 C143 82 142 74 139 68 C136 74 136 84 137 94 Z" ${F}/>`;
  }

  if (style === "undercut") {
    front = `<path d="M62 76 C57 38 78 18 100 18 C124 18 146 38 141 80
        C133 54 118 46 99 46 C82 46 70 56 62 76 Z" ${F}/>
      <path d="M58 86 C60 72 64 62 70 55" stroke="${sk.deep}" stroke-width="8" fill="none" opacity="0.28" stroke-linecap="round"/>
      <path d="M142 88 C140 74 136 62 130 55" stroke="${sk.deep}" stroke-width="8" fill="none" opacity="0.28" stroke-linecap="round"/>
      ${gloss("M78 34 C90 24 108 24 120 32")}
      ${strand("M84 44 C96 36 110 36 120 42")}`;
  }

  if (style === "quiff") {
    front = `<path d="M60 84 C56 46 74 16 100 16 C126 16 146 40 142 84
        C138 62 130 52 118 48 C106 44 92 46 82 54 C72 62 64 70 60 84 Z" ${F}/>
      <path d="M78 30 C88 12 116 12 124 30 C118 22 92 20 78 30 Z" ${F}/>
      ${gloss("M80 34 C92 22 110 22 122 32")}
      ${strand("M66 76 C72 62 82 54 94 50")}`;
  }

  return { back, front, over };
}

/* -------------------------------- Zubehör --------------------------------- */
function avAccessory(acc, u, hc, sk, ink) {
  const S = `stroke="${ink}" stroke-width="3" stroke-linejoin="round"`;
  if (acc === "cap") {
    return `<path d="M54 68 C50 32 73 12 100 12 C127 12 150 32 146 68 Z" fill="#2f6fed" ${S}/>
      <path d="M54 68 C34 70 22 78 22 87 C22 94 34 97 50 91 L60 74 Z" fill="#1c4cba" ${S}/>
      <path d="M78 24 C88 17 104 15 116 20" stroke="#8fb6ff" stroke-width="4" fill="none" opacity="0.6" stroke-linecap="round"/>
      <circle cx="100" cy="14" r="5" fill="#eaf2fb" ${S}/>`;
  }
  if (acc === "muetze") {
    return `<path d="M53 70 C49 30 73 10 100 10 C127 10 151 30 147 70 Z" fill="#e2465f" ${S}/>
      <rect x="49" y="63" width="102" height="17" rx="8.5" fill="#ffd3d9" ${S}/>
      <circle cx="100" cy="9" r="8" fill="#ffd3d9" ${S}/>
      <path d="M74 27 C86 18 102 16 116 22" stroke="#ff8a9c" stroke-width="4" fill="none" opacity="0.5" stroke-linecap="round"/>`;
  }
  if (acc === "brille") {
    return `<g fill="#bfe4f5" fill-opacity="0.26" stroke="${ink}" stroke-width="2.8">
        <rect x="65" y="82" width="32" height="24" rx="10"/>
        <rect x="103" y="82" width="32" height="24" rx="10"/></g>
      <path d="M97 90 C99 88.4 101 88.4 103 90" stroke="${ink}" stroke-width="2.8" fill="none"/>
      <path d="M65 88 L56 85 M135 88 L144 85" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      <path d="M70 88 L78 88" stroke="#ffffff" stroke-width="2.6" opacity="0.6" stroke-linecap="round"/>
      <path d="M108 88 L116 88" stroke="#ffffff" stroke-width="2.6" opacity="0.6" stroke-linecap="round"/>`;
  }
  if (acc === "headset") {
    return `<path d="M56 92 C50 38 74 14 100 14 C126 14 150 38 144 92"
              fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
      <path d="M56 90 C51 40 74 18 100 18 C126 18 149 40 144 90"
              fill="none" stroke="#4d5a6b" stroke-width="3.2" stroke-linecap="round"/>
      <rect x="40" y="82" width="20" height="30" rx="9.5" fill="#333c49" ${S}/>
      <rect x="140" y="82" width="20" height="30" rx="9.5" fill="#333c49" ${S}/>
      <rect x="45" y="89" width="10" height="17" rx="5" fill="#5d6b7d"/>
      <path d="M50 110 C54 132 70 136 84 130" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>
      <ellipse cx="87" cy="129" rx="6.5" ry="4.6" fill="#2f6fed" ${S}/>`;
  }
  return "";
}

/* ----------------------------- Kleidungsdetail ---------------------------- */
function avOutfitDetail(fit, u, ink, y) {
  const collar = `<path d="M82 ${y} C88 ${y + 17} 112 ${y + 17} 118 ${y}"
    fill="${fit.shade}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  if (fit.id === "warnweste") {
    return `${collar}
      <path d="M64 ${y + 22} L64 ${y + 60} M136 ${y + 22} L136 ${y + 60}"
        stroke="${fit.trim}" stroke-width="9" stroke-linecap="round" opacity="0.95"/>
      <path d="M42 ${y + 34} C64 ${y + 26} 136 ${y + 26} 158 ${y + 34}"
        stroke="${fit.trim}" stroke-width="8" fill="none" opacity="0.9"/>`;
  }
  if (fit.id === "bluse") {
    return `<path d="M84 ${y} L100 ${y + 24} L116 ${y} L130 ${y + 7} L100 ${y + 37} L70 ${y + 7} Z"
      fill="${fit.trim}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M100 ${y + 24} L100 ${y + 40}" stroke="${fit.shade}" stroke-width="2" opacity="0.7"/>`;
  }
  if (fit.id === "kapuzenpulli") {
    return `<path d="M74 ${y} C82 ${y + 26} 118 ${y + 26} 126 ${y}"
        fill="${fit.shade}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M90 ${y + 18} L88 ${y + 40} M110 ${y + 18} L112 ${y + 40}"
        stroke="${fit.trim}" stroke-width="4" stroke-linecap="round"/>`;
  }
  if (fit.id === "lederjacke") {
    return `${collar}
      <path d="M86 ${y + 4} L74 ${y + 40} M114 ${y + 4} L126 ${y + 40}"
        stroke="${fit.trim}" stroke-width="4" fill="none" opacity="0.7" stroke-linecap="round"/>`;
  }
  if (fit.id === "latzhose") {
    return `${collar}
      <path d="M80 ${y + 14} L80 ${y + 44} M120 ${y + 14} L120 ${y + 44}"
        stroke="${fit.trim}" stroke-width="7" stroke-linecap="round" opacity="0.9"/>`;
  }
  return `${collar}
    <path d="M80 ${y + 12} L72 ${y + 42} M120 ${y + 12} L128 ${y + 42}"
      stroke="${fit.trim}" stroke-width="3.4" fill="none" opacity="0.5" stroke-linecap="round"/>`;
}

/* Feste Figur der Disponentin, die durch das Tutorial führt.
   Eigene Erfindung, keiner realen Person nachempfunden. */
const GUIDE = {
  name: "Lina Sturm",
  role: "Disponentin",
  avatar: { sex: 0, skin: 1, hair: 0, hairColor: 0, eyes: 0, outfit: 0, acc: 0, beard: 0 }
};
