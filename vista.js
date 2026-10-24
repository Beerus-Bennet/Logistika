/* =========================================================================
   LOGISTIKA – vista.js  (v101)
   Die Aussicht hinter der Welt, nur in der Ich-Perspektive (Fällen mit Axt/Säge).
   Hinter der 3D-Szene liegt eine Panorama-Ebene (2D-Canvas, halbe Auflösung):
     Himmel nach Uhrzeit (Nacht – Morgenrot – Tag – goldene Stunde – roter Sonnenuntergang – Dämmerung),
     Sonne (rot und groß am Horizont) samt Lichthof, Mond und Sterne, Wolken, ein See mit Spiegelung,
     drei gestaffelte Bergketten mit Dunst und Wiesen davor.
   Die 3D-Welt geht am Horizont in denselben Dunst über (VISTA.env färbt den Nebel).
   Der Himmel ist reine Kulisse: Er richtet sich nach der Kamera, die Sonne steht beim Hinsehen leicht rechts vor dir.
   API:  VISTA.draw(R, time)   nach R.render(): zeichnet oder versteckt die Ebene (aktiv, solange FV.fp gesetzt ist)
         VISTA.env(E, h)       Nebel- und Lichtfarbe der Szene an die Aussicht anpassen (nur in der Ich-Perspektive)
         VISTA.pal(h)          Farbpalette zur Stunde h (0 … 24), Testhilfe
   ========================================================================= */
const VISTA = (() => {
  "use strict";
  /* Stunde, Zenit, Himmelsmitte, Horizont, Sonne, ferne Berge, mittlere Hügel, nahe Hügel, Wolke hell, Wolke dunkel */
  const KF = [
    [0,    [3, 6, 20],     [9, 15, 40],     [26, 36, 70],    [0, 0, 0],       [22, 28, 56],   [16, 21, 44],   [10, 13, 28],  [40, 48, 86],    [14, 18, 38]],
    [4.6,  [3, 6, 20],     [9, 15, 40],     [26, 36, 70],    [0, 0, 0],       [22, 28, 56],   [16, 21, 44],   [10, 13, 28],  [40, 48, 86],    [14, 18, 38]],
    [5.7,  [28, 38, 92],   [110, 80, 120],  [236, 128, 96],  [255, 150, 90],  [70, 64, 104],  [54, 48, 84],   [34, 32, 58],  [255, 150, 130], [70, 60, 100]],
    [6.7,  [84, 132, 208], [200, 168, 184], [255, 196, 130], [255, 200, 130], [132, 130, 170], [108, 116, 140], [70, 90, 100], [255, 205, 170], [150, 140, 170]],
    [8.5,  [72, 132, 214], [140, 192, 238], [206, 228, 246], [255, 240, 210], [130, 160, 196], [96, 132, 150],  [66, 110, 92], [255, 255, 255], [190, 205, 225]],
    [13,   [56, 116, 214], [120, 178, 238], [190, 220, 244], [255, 250, 230], [120, 152, 190], [90, 126, 150],  [60, 104, 90], [255, 255, 255], [185, 200, 222]],
    [17,   [70, 122, 206], [150, 186, 228], [228, 218, 196], [255, 236, 190], [134, 150, 182], [104, 124, 140], [70, 100, 84], [255, 246, 226], [190, 196, 210]],
    [18.6, [84, 112, 184], [216, 172, 140], [255, 208, 132], [255, 206, 120], [150, 128, 150], [120, 108, 122], [74, 82, 76],  [255, 214, 160], [160, 132, 150]],
    [19.7, [58, 76, 150],  [232, 124, 92],  [255, 150, 60],  [255, 140, 60],  [134, 76, 100],  [98, 56, 76],    [52, 44, 56],  [255, 150, 100], [118, 66, 92]],
    [20.4, [40, 44, 108],  [196, 70, 78],   [255, 92, 40],   [255, 86, 36],   [96, 40, 68],    [70, 32, 56],    [34, 26, 40],  [255, 102, 76],  [84, 36, 66]],
    [21.3, [18, 24, 66],   [96, 44, 92],    [196, 66, 72],   [210, 70, 60],   [44, 30, 64],    [32, 24, 50],    [18, 16, 32],  [170, 70, 90],   [40, 28, 64]],
    [22.6, [3, 6, 20],     [9, 15, 40],     [26, 36, 70],    [0, 0, 0],       [22, 28, 56],   [16, 21, 44],   [10, 13, 28],  [40, 48, 86],    [14, 18, 38]],
    [24,   [3, 6, 20],     [9, 15, 40],     [26, 36, 70],    [0, 0, 0],       [22, 28, 56],   [16, 21, 44],   [10, 13, 28],  [40, 48, 86],    [14, 18, 38]]
  ];
  const NAMES = ["zen", "mid", "hor", "sun", "far", "hill", "near", "cl", "cd"];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rgb = (c, a) => a == null || a >= 1 ? "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")" : "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a.toFixed(3) + ")";
  function pal(h) {
    h = ((h % 24) + 24) % 24;
    let i = 0;
    while (i < KF.length - 2 && h > KF[i + 1][0]) i++;
    const a = KF[i], b = KF[i + 1], t = clamp((h - a[0]) / (b[0] - a[0] || 1), 0, 1), s = t * t * (3 - 2 * t), o = {};
    NAMES.forEach((n, k) => { o[n] = mix(a[k + 1], b[k + 1], s); });
    return o;
  }
  /* Sonnenhöhe (Bogenmaß): geht gegen 5:36 auf, gegen 20:30 unter (negativ = unter dem Horizont) */
  const sunEl = h => 0.95 * Math.sin(Math.PI * (h - 5.6) / 14.9);
  const grey = (c, g) => { const l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; return mix(c, [l * 0.92, l * 0.95, l], g); };

  /* Zacken-/Höhenprofil, in der Richtung periodisch (ganze Frequenzen): Summe aus Dreieckswellen */
  const tri = x => Math.abs(((x / (2 * Math.PI)) % 1 + 1) % 1 * 2 - 1);
  const wave = (a, ks, ph) => { let s = 0, n = 0; ks.forEach((k, i) => { const w = 1 / Math.pow(k, 0.7); s += w * tri(k * a + ph[i % ph.length]); n += w; }); return s / n; };
  const FAR_K = [3, 5, 8, 13, 21, 34, 55], FAR_P = [0.4, 1.9, 3.1, 0.7, 2.6, 4.4, 5.2];
  const HILL_K = [4, 7, 11, 19, 31], HILL_P = [2.2, 0.3, 5.1, 3.6, 1.1];
  const NEAR_K = [6, 10, 17, 27], NEAR_P = [5.5, 1.4, 2.9, 0.2];
  const dipAt = a => { const d = ((a - (sol.az == null ? 0 : sol.az) + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return 1 - 0.85 * Math.exp(-Math.pow(d / 0.3, 2)); };
  const farE = a => (0.022 + 0.1 * Math.pow(wave(a, FAR_K, FAR_P), 1.5)) * dipAt(a);
  const hillE = a => 0.012 + 0.04 * wave(a, HILL_K, HILL_P);
  const nearE = a => 0.004 + 0.016 * wave(a, NEAR_K, NEAR_P);
  /* Wolken: Richtung, Höhe, Breite (Bogenmaß), Wölbung; fest verteilt */
  const CLOUDS = Array.from({ length: 14 }, (_, i) => { const r = k => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }; return { a: r(1) * 6.2832, e: 0.1 + r(2) * 0.36, w: 0.16 + r(3) * 0.26, hgt: 0.5 + r(4) * 0.7, sp: 0.6 + r(5) * 0.8 }; });
  /* ------------------------------------------------------------------------------------------
     v133 Nachthimmel: Milchstraße (einmal berechnete Textur), ~4 000 Sterne in Spektralfarben
     (helle mit Lichthof, die hellsten mit Strahlen), Mond mit Phase/Maren/Kratern, Wolken als
     vorgerechnete, gelockte Bilder (unten Schatten, oben Licht, nachts silberner Mondrand),
     Sternschnuppen, Himmelsdrehung (15° je Stunde), Lichtglocke von Potsdam/Berlin am Horizont.
     Alles hängt nur an Richtung (Azimut a, Höhe e) und wird wie bisher über sx(a) und
     y = hy − fs·tan(e)/cos(d) aufs Bild gebracht.
     ------------------------------------------------------------------------------------------ */
  const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const E_TOP = 1.45, MW_T = 3.2;
  /* Ebene der Milchstraße: Pol-Richtung, Basis in der Ebene (Länge 0 = Kern) */
  const nv = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const GP = nv([0.74, 0.3, -0.6]), GU = nv([GP[1], -GP[0], 0]), GV = [GP[1] * GU[2] - GP[2] * GU[1], GP[2] * GU[0] - GP[0] * GU[2], GP[0] * GU[1] - GP[1] * GU[0]];
  const dirOf = (a, e) => [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
  const galOf = v => { const b = Math.asin(clamp(v[0] * GP[0] + v[1] * GP[1] + v[2] * GP[2], -1, 1)); return [Math.atan2(v[0] * GV[0] + v[1] * GV[1] + v[2] * GV[2], v[0] * GU[0] + v[1] * GU[1] + v[2] * GU[2]), b]; };
  /* 3D-Wertrauschen (für Milchstraße und Wolken) */
  const hash3 = (x, y, z) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const L = (a, b, t) => a + (b - a) * t;
    return L(L(L(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), L(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
             L(L(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), L(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
  }
  const fbm = (x, y, z, o) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < (o || 4); i++) { s += a * vnoise(x * f, y * f, z * f); n += a; a *= 0.5; f *= 2.03; } return s / n; };

  /* Sterne: gleichmäßig über den Himmel plus gehäuft entlang der Milchstraße */
  let STARS = null;
  function stars() {
    if (STARS) return STARS;
    const r = rng(90210), out = [];
    const COLS = [[168, 196, 255], [214, 226, 255], [246, 246, 255], [255, 238, 206], [255, 206, 158]];
    const colOf = () => { const q = r(); return q < 0.12 ? 0 : q < 0.34 ? 1 : q < 0.72 ? 2 : q < 0.9 ? 3 : 4; };
    const push = (a, e, m) => { if (e < 0.015 || e > E_TOP) return; out.push({ a, e, m, c: colOf(), tw: r() * 6.28, ts: 1.3 + r() * 2.4 }); };
    for (let i = 0; i < 3200; i++) { const e = Math.asin(r() * Math.sin(E_TOP)), a = r() * 6.2832; push(a, e, Math.pow(r(), 3.2)); }
    for (let i = 0; i < 1900; i++) {
      const l = r() * 6.2832, g = (r() + r() + r() - 1.5) * 0.16, cl = Math.cos(l), sl = Math.sin(l), cg = Math.cos(g), sg = Math.sin(g);
      const v = [GU[0] * cl * cg + GV[0] * sl * cg + GP[0] * sg, GU[1] * cl * cg + GV[1] * sl * cg + GP[1] * sg, GU[2] * cl * cg + GV[2] * sl * cg + GP[2] * sg];
      push(Math.atan2(v[2], v[0]), Math.asin(clamp(v[1], -1, 1)), Math.pow(r(), 4) * 0.7);
    }
    out.sort((p, q) => p.c - q.c);
    return (STARS = { list: out, cols: COLS.map(c => rgb(c)) });
  }
  /* Milchstraße: Textur über Azimut (Breite, 0 … 2π) und Höhe (0 … E_TOP); einmal berechnet */
  let MW = null;
  function milky() {
    if (MW) return MW;
    const W = 900, H = 300, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"), img = g.createImageData(W, H), d = img.data;
    for (let j = 0; j < H; j++) {
      const e = Math.atan((1 - (j + 0.5) / H) * MW_T);                     /* Zeilen gleichmäßig in tan(Höhe): je Bildspalte linear */
      for (let i = 0; i < W; i++) {
        const a = (i + 0.5) / W * 6.2832, v = dirOf(a, e), [l, b] = galOf(v);
        const n1 = fbm(v[0] * 6 + 7, v[1] * 6, v[2] * 6, 5), n2 = fbm(v[0] * 15 + 3, v[1] * 15 + 9, v[2] * 15, 3), n3 = fbm(v[0] * 34, v[1] * 34 + 5, v[2] * 34 + 2, 2);
        const core = 0.55 + 0.45 * Math.cos(l), wob = (n1 - 0.5) * 0.09;
        let I = Math.exp(-Math.pow((b + wob) / (0.12 + 0.06 * core), 2)) * (0.35 + 0.9 * Math.pow(n1, 1.6)) * (0.45 + 0.75 * core);
        I += Math.exp(-Math.pow(b / 0.42, 2)) * 0.1 * (0.6 + 0.6 * n2);
        /* dunkles Staubband in der Mitte, zum Kern hin kräftiger, ausgefranst */
        I *= 1 - 0.7 * Math.exp(-Math.pow((b - 0.012 - (n2 - 0.5) * 0.06) / (0.03 + 0.02 * n1), 2)) * (0.3 + 0.7 * core) * (0.6 + 0.5 * n2);
        I *= 0.55 + 0.9 * n3 * n3;                                                /* feine Sternwolken-Körnung */
        I = clamp(I, 0, 1.2);
        const warm = core * core * 0.8, k = (j * W + i) * 4;
        d[k] = 186 + 60 * warm; d[k + 1] = 196 + 36 * warm; d[k + 2] = 236 - 30 * warm; d[k + 3] = clamp(I * 210, 0, 255);
      }
    }
    g.putImageData(img, 0, 0);
    return (MW = { c, W, H });
  }
  /* Leuchtpunkt für helle Sterne (weiß, wird per globalAlpha und Größe angepasst); mit Strahlen für die hellsten */
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    const mk = (col, spikes) => {
      const N = 64, c = document.createElement("canvas"); c.width = c.height = N;
      const g = c.getContext("2d"), m = N / 2, rg = g.createRadialGradient(m, m, 0, m, m, m);
      rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.06, rgb(col, 0.95)); rg.addColorStop(0.18, rgb(col, 0.32)); rg.addColorStop(0.45, rgb(col, 0.08)); rg.addColorStop(1, rgb(col, 0));
      g.fillStyle = rg; g.fillRect(0, 0, N, N);
      if (spikes) {
        g.globalCompositeOperation = "lighter";
        [[1, 0.05], [0.05, 1]].forEach(([sxk, syk]) => {
          const lg = g.createRadialGradient(m, m, 0, m, m, m);
          lg.addColorStop(0, rgb(col, 0.55)); lg.addColorStop(1, rgb(col, 0));
          g.save(); g.translate(m, m); g.scale(sxk, syk); g.translate(-m, -m); g.fillStyle = lg; g.fillRect(0, 0, N, N); g.restore();
        });
      }
      return c;
    };
    const C = [[168, 196, 255], [214, 226, 255], [246, 246, 255], [255, 238, 206], [255, 206, 158]];
    return (SPR = { glow: C.map(c => mk(c, false)), spike: C.map(c => mk(c, true)) });
  }
  /* Mond: Scheibe mit Randverdunklung, Maren und Kratern, beleuchtet nach Phase (0 Neumond … 0,5 Vollmond … 1) */
  const MOON = { key: "", c: null };
  function moonSprite(ph) {
    const key = Math.round(ph * 48) + "";
    if (MOON.key === key && MOON.c) return MOON.c;
    const N = 160, c = MOON.c || document.createElement("canvas"); c.width = c.height = N;
    const g = c.getContext("2d"), img = g.createImageData(N, N), d = img.data, R0 = N / 2 - 1.5;
    const pa = ph * 2 * Math.PI, L = [Math.sin(pa), 0, -Math.cos(pa)];
    const CR = []; { const r = rng(4242); for (let i = 0; i < 26; i++) CR.push([r() * 1.6 - 0.8, r() * 1.6 - 0.8, 0.03 + Math.pow(r(), 2) * 0.12]); }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = (x + 0.5 - N / 2) / R0, v = (y + 0.5 - N / 2) / R0, rr = u * u + v * v, k = (y * N + x) * 4;
      if (rr > 1.0) { d[k + 3] = 0; continue; }
      const z = Math.sqrt(1 - rr);
      /* Albedo: Hochland hell, Maren (große dunkle Flecken) und Krater */
      let al = 0.88 - 0.36 * clamp((fbm(u * 2.2 + 4, v * 2.2 + 1, z * 2.2, 4) - 0.5) * 3.2 + 0.12, 0, 1);
      al *= 0.94 + 0.12 * fbm(u * 14, v * 14, z * 14, 2);
      for (const [cx, cy, cr] of CR) { const dd = Math.hypot(u - cx, v - cy) / cr; if (dd < 1.15) al *= dd < 0.8 ? 0.93 : dd < 1 ? 1.1 : 1; }
      const lam = u * L[0] + v * L[1] + z * L[2], lit = clamp(lam * 3 + 0.15, 0, 1);       /* weicher Terminator */
      const limb = 0.72 + 0.28 * z, b = al * limb * (0.05 + 0.95 * lit);
      const edge = clamp((1 - Math.sqrt(rr)) * R0 * 0.9, 0, 1);
      d[k] = 255 * b * 0.97; d[k + 1] = 255 * b * 0.98; d[k + 2] = 255 * b; d[k + 3] = 255 * edge * clamp(0.25 + lit * 3, 0, 1);
    }
    g.putImageData(img, 0, 0);
    MOON.key = key; MOON.c = c;
    return c;
  }
  /* Wolken: Formen als Dichte- und Lichtmaske, je Farbstimmung eingefärbt (Zwischenspeicher) */
  let CLS = null;
  function cloudShapes() {
    if (CLS) return CLS;
    CLS = [];
    for (let s = 0; s < 6; s++) {
      const r = rng(7000 + s * 31), W = 420, H = 150, mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
      const D = mk(), Lc = mk(), dg = D.getContext("2d"), lg = Lc.getContext("2d"), base = H * 0.8;
      const puffs = [];
      for (let i = 0; i < 46; i++) {
        const u = r(), prof = Math.pow(Math.max(0, 1 - Math.pow(u * 2 - 1, 2)), 0.75), x = 40 + (W - 80) * u;
        const rad = (12 + r() * 30) * (0.55 + 0.6 * prof), y = base - prof * H * (0.18 + r() * 0.42) + rad * 0.3;
        puffs.push([x, Math.min(base - rad * 0.2, y), rad]);
      }
      for (let i = 0; i < 70; i++) { const p = puffs[(r() * puffs.length) | 0], a = -Math.PI * r(), rd = p[2] * (0.25 + r() * 0.3); puffs.push([p[0] + Math.cos(a) * p[2] * 0.9, p[1] + Math.sin(a) * p[2] * 0.85, rd]); }
      puffs.forEach(([x, y, rd]) => {
        const g1 = dg.createRadialGradient(x, y, 0, x, y, rd);
        g1.addColorStop(0, "rgba(255,255,255,0.9)"); g1.addColorStop(0.6, "rgba(255,255,255,0.55)"); g1.addColorStop(1, "rgba(255,255,255,0)");
        dg.fillStyle = g1; dg.beginPath(); dg.arc(x, y, rd, 0, 6.2832); dg.fill();
        const g2 = lg.createRadialGradient(x - rd * 0.15, y - rd * 0.45, 0, x - rd * 0.15, y - rd * 0.45, rd * 0.95);
        g2.addColorStop(0, "rgba(255,255,255,0.95)"); g2.addColorStop(0.55, "rgba(255,255,255,0.35)"); g2.addColorStop(1, "rgba(255,255,255,0)");
        lg.fillStyle = g2; lg.beginPath(); lg.arc(x, y, rd, 0, 6.2832); lg.fill();
      });
      /* flache Unterseite: unten weich abschneiden */
      const fade = dg.createLinearGradient(0, base - 6, 0, H);
      fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(1, "rgba(0,0,0,1)");
      dg.globalCompositeOperation = "destination-out"; dg.fillStyle = fade; dg.fillRect(0, base - 6, W, H);
      lg.globalCompositeOperation = "destination-in"; lg.drawImage(D, 0, 0);
      CLS.push({ D, L: Lc, W, H, col: null, key: "", rim: null });
    }
    return CLS;
  }
  const q8 = c => c.map(v => Math.round(v / 8) * 8);
  function tintCloud(S0, lit, dark, alpha) {
    const key = q8(lit).join() + "|" + q8(dark).join() + "|" + alpha.toFixed(2);
    if (S0.key === key && S0.col) return S0.col;
    const c = S0.col || document.createElement("canvas"); c.width = S0.W; c.height = S0.H;
    const g = c.getContext("2d");
    g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, S0.W, S0.H);
    g.fillStyle = rgb(dark); g.fillRect(0, 0, S0.W, S0.H);
    g.globalCompositeOperation = "destination-in"; g.drawImage(S0.D, 0, 0);
    const t = TMP(S0.W, S0.H), tg = t.getContext("2d");
    tg.globalCompositeOperation = "source-over"; tg.clearRect(0, 0, S0.W, S0.H); tg.fillStyle = rgb(lit); tg.fillRect(0, 0, S0.W, S0.H);
    tg.globalCompositeOperation = "destination-in"; tg.drawImage(S0.L, 0, 0);
    g.globalCompositeOperation = "source-atop"; g.drawImage(t, 0, 0);
    g.globalCompositeOperation = "destination-in"; g.fillStyle = "rgba(0,0,0," + alpha + ")"; g.fillRect(0, 0, S0.W, S0.H);
    g.globalCompositeOperation = "source-over";
    S0.col = c; S0.key = key;
    return c;
  }
  function rimCloud(S0) {
    if (S0.rim) return S0.rim;
    const c = document.createElement("canvas"); c.width = S0.W; c.height = S0.H;
    const g = c.getContext("2d");
    g.fillStyle = "rgb(214,224,248)"; g.fillRect(0, 0, S0.W, S0.H);
    g.globalCompositeOperation = "destination-in"; g.drawImage(S0.L, 0, 0);
    /* nur der Rand: Inneres (Dichte) abziehen */
    g.globalCompositeOperation = "destination-out"; g.globalAlpha = 0.55; g.drawImage(S0.D, 0, 0);
    S0.rim = c;
    return c;
  }
  let TMPC = null;
  const TMP = (w, h) => { if (!TMPC) TMPC = document.createElement("canvas"); if (TMPC.width !== w || TMPC.height !== h) { TMPC.width = w; TMPC.height = h; } return TMPC; };
  /* Sternschnuppe */
  const SHOOT = { next: 0, cur: null };
  const angN = a => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

  let cv = null, ctx = null, glow = null, key = "";
  const sol = { az: null };
  function mount() {
    if (cv && cv.isConnected) return true;
    const host = document.getElementById("farm");
    if (!host) return false;
    cv = document.createElement("canvas");
    cv.id = "fpVista";
    cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:none;pointer-events:none";
    host.insertBefore(cv, host.firstChild);
    ctx = cv.getContext("2d");
    glow = document.createElement("div");
    glow.id = "fpGlow";
    glow.style.cssText = "position:absolute;inset:0;display:none;pointer-events:none;mix-blend-mode:screen;z-index:1";
    host.appendChild(glow);
    return !!ctx;
  }
  function hide() {
    if (cv && cv.style.display !== "none") cv.style.display = "none";
    if (glow && glow.style.display !== "none") glow.style.display = "none";
    sol.az = null;
  }
  function weather() {
    const F = typeof S !== "undefined" && S.farm, wx = F && F.wx ? F.wx.k : "";
    const storm = typeof farmEvOn === "function" && farmEvOn("sturm");
    return storm ? 0.85 : wx === "regen" ? 0.7 : wx === "nebel" ? 0.8 : wx === "wolken" ? 0.45 : 0;
  }

  function draw(R, time) {
    const fp = typeof FV !== "undefined" ? FV.fp : null;
    if (!fp) { hide(); return; }
    if (!mount()) return;
    const W = R.w, H = R.h;
    if (!W || !H) return;
    const h0 = (S.time % 1440) / 60, nt0 = clamp((sunEl(h0) < 0 ? -sunEl(h0) : 0) * 7, 0, 1) * (h0 > 12 || h0 < 6 ? 1 : 0);
    /* v133: nachts volle Bildschärfe (Sterne, Mond), tagsüber reicht die halbe Auflösung für die weichen Verläufe */
    const sc = nt0 > 0.02 ? Math.min(R.dpr || 1, 2) : 0.5, cw = Math.max(2, Math.round(W * sc)), ch = Math.max(2, Math.round(H * sc));
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    cv.style.display = "block";
    /* beim Hinein-/Herausfahren der Kamera ein- und ausblenden */
    const sm = x => x * x * (3 - 2 * x);
    cv.style.opacity = fp.mode === "in" ? sm(clamp(fp.p, 0, 1)).toFixed(3) : fp.mode === "out" ? (1 - sm(clamp(fp.p, 0, 1))).toFixed(3) : "1";
    const c = R.cam, eye = R.eye, h = (S.time % 1440) / 60, wg = weather();
    const asp = W / H, tf = Math.tan((c.fov || 0.85) / 2), f = (H / 2) / tf;               /* Brennweite in Pixeln */
    const fwd = Math.atan2(-Math.sin(c.yaw), -Math.cos(c.yaw));                               /* Blickrichtung (Himmelsrichtung im Bogenmaß) */
    const halfH = Math.atan(tf * asp) + 0.2;
    let P = pal(h);
    if (wg > 0) NAMES.forEach(n => { P[n] = grey(P[n], wg * 0.75); });
    /* Horizonthöhe auf dem Bild: Punkt am Horizont in Blickrichtung */
    const S0 = 4000, hp = R.project(eye[0] + Math.cos(fwd) * S0, eye[1], eye[2] + Math.sin(fwd) * S0);
    if (!hp) return;
    const hy = hp[1] * sc, fs = f * sc;
    if (sol.az == null) sol.az = fp.skyAz != null ? fp.skyAz - 0.35 : fwd + 0.05;                 /* v133: Hochsitz – Sonne/Mond über dem Feld */                                                  /* Sonne: beim ersten Hinsehen leicht rechts vor dir */
    const X = ctx;
    X.setTransform(1, 0, 0, 1, 0, 0);
    /* Himmel */
    const top = hy - fs * 1.45, g = X.createLinearGradient(0, top, 0, hy + 2);
    g.addColorStop(0, rgb(P.zen)); g.addColorStop(0.62, rgb(P.mid)); g.addColorStop(1, rgb(P.hor));
    X.fillStyle = g; X.fillRect(0, 0, cw, ch);
    if (top > 0) { X.fillStyle = rgb(P.zen); X.fillRect(0, 0, cw, Math.max(0, top)); }
    /* Hilfsfunktionen: Richtung → Bildposition */
    const sx = a => { const q = R.project(eye[0] + Math.cos(a) * S0, eye[1], eye[2] + Math.sin(a) * S0); return q ? q[0] * sc : null; };
    const night = clamp((sunEl(h) < 0 ? -sunEl(h) : 0) * 7, 0, 1) * (h > 12 || h < 6 ? 1 : 0);
    const el = sunEl(h), cl = Math.cos(el);
    /* Mondphase nach Spieltag (29,5 Tage); Mondlicht hellt den Himmel auf und schluckt schwache Sterne */
    const day = Math.floor(S.time / 1440), mph = ((day + 9.5) % 29.53) / 29.53, moonI = 0.5 - 0.5 * Math.cos(mph * 2 * Math.PI);
    const rot = h * 0.2618;                                                                       /* Himmel dreht sich mit 15° je Stunde */
    const yOf = (a, e) => { const d = angN(a - fwd), c0 = Math.cos(d); return c0 < 0.2 ? null : hy - fs * Math.tan(e) / c0; };
    if (night > 0.05) {
      const vis = night * (1 - wg * 0.85);
      /* Lichtglocke der Städte im Osten, darüber ein Hauch Luftleuchten */
      const glowAz = 0.35, gd = angN(glowAz - fwd);
      if (Math.abs(gd) < halfH + 0.9) {
        const gx = sx(glowAz), gw = fs * 1.1;
        if (gx != null) { X.save(); X.translate(gx, hy); X.scale(1, 0.32); const rg = X.createRadialGradient(0, 0, 0, 0, 0, gw); rg.addColorStop(0, rgb([92, 70, 72], 0.55 * night)); rg.addColorStop(0.5, rgb([60, 52, 70], 0.22 * night)); rg.addColorStop(1, rgb([40, 40, 70], 0)); X.fillStyle = rg; X.fillRect(-gw, -gw, gw * 2, gw * 2); X.restore(); }
      }
      const ag = X.createLinearGradient(0, hy - fs * 0.2, 0, hy);
      ag.addColorStop(0, rgb([40, 80, 76], 0)); ag.addColorStop(0.75, rgb([46, 92, 84], 0.13 * night)); ag.addColorStop(1, rgb([60, 70, 96], 0.2 * night));
      X.fillStyle = ag; X.fillRect(0, hy - fs * 0.2, cw, fs * 0.2);
      /* Milchstraße: Textur in Kacheln aufs Bild (Azimut-Spalten × Höhen-Zeilen) */
      const M = milky(), mwA = vis * (1 - moonI * 0.55);
      if (mwA > 0.03) {
        /* Spalten auf ganzen Pixeln, lückenlos aneinander; in jeder Spalte ist die Höhe linear in tan(e) → ein Bild je Spalte */
        X.globalAlpha = mwA;
        const step = Math.max(4, Math.round(cw / 40));
        let xPrev = null, aPrev = null;
        for (let px = 0; px <= cw + step; px += step) {
          const xx = Math.min(px, cw), ry = R.ray(xx / sc, hy / sc), a = Math.atan2(ry.d[2], ry.d[0]);   /* Bildspalte → Azimut */
          if (aPrev != null) { const da = angN(a - aPrev); if (Math.abs(da) > 1) { xPrev = xx; aPrev = a; continue; } }
          if (xPrev != null && xx > xPrev) {
            const da = angN(a - aPrev), am = aPrev + da / 2, cd = Math.cos(angN(am - fwd));
            const u0 = ((((aPrev - rot) % 6.2832) + 6.2832) % 6.2832) / 6.2832 * M.W, uw = Math.max(0.3, da / 6.2832 * M.W);
            const yTop = hy - fs * MW_T / cd, hh = hy - yTop;
            if (u0 + uw <= M.W) X.drawImage(M.c, u0, 0, uw, M.H, xPrev, yTop, xx - xPrev, hh);
            else { const u1 = M.W - u0, f1 = u1 / uw; X.drawImage(M.c, u0, 0, u1, M.H, xPrev, yTop, (xx - xPrev) * f1, hh); X.drawImage(M.c, 0, 0, uw - u1, M.H, xPrev + (xx - xPrev) * f1, yTop, (xx - xPrev) * (1 - f1), hh); }
          }
          xPrev = xx; aPrev = a;
          if (xx >= cw) break;
        }
        X.globalAlpha = 1;
      }
      /* Sterne: schwache als Punkte (je Farbe ein Durchgang), helle mit Lichthof, die hellsten mit Strahlen */
      const ST = stars(), SP = sprites(), dim = 1 - moonI * 0.5, pxs = sc, big = [];
      let cur = -1;
      for (const st of ST.list) {
        const a = st.a + rot, d = angN(a - fwd); if (Math.abs(d) > halfH) continue;
        const y = yOf(a, st.e); if (y == null || y > hy - 1 || y < -6) continue;
        const x = sx(a); if (x == null || x < -6 || x > cw + 6) continue;
        const m = st.m, hz = clamp((hy - y) / (fs * 0.12), 0, 1);                           /* am Horizont im Dunst schwächer */
        const tw = m > 0.35 ? 0.78 + 0.22 * Math.sin(time * st.ts + st.tw) : 1;
        const al = vis * hz * tw * (m > 0.5 ? 1 : dim) * (0.3 + 0.7 * Math.sqrt(m));
        if (al < 0.03) continue;
        if (m > 0.62) { big.push([x, y, m, st.c, al]); continue; }
        if (st.c !== cur) { cur = st.c; X.fillStyle = ST.cols[cur]; }
        const r = (0.85 + m * 1.4) * pxs;
        X.globalAlpha = al; X.fillRect(x - r * 0.5, y - r * 0.5, r, r);
      }
      X.globalCompositeOperation = "lighter";
      for (const [x, y, m, c, al] of big) {
        const r = (5 + (m - 0.62) * 26) * pxs, img = m > 0.93 ? SP.spike[c] : SP.glow[c];
        X.globalAlpha = Math.min(1, al * 1.1); X.drawImage(img, x - r, y - r, r * 2, r * 2);
      }
      X.globalCompositeOperation = "source-over"; X.globalAlpha = 1;
      /* Sternschnuppe: alle 15 … 45 s, kurz und schnell, mit glühendem Schweif */
      if (!SHOOT.next) SHOOT.next = time + 6 + Math.random() * 12;
      if (!SHOOT.cur && time > SHOOT.next && vis > 0.5) {
        SHOOT.cur = { t0: time, a: fwd + (Math.random() - 0.5) * halfH * 1.4, e: 0.35 + Math.random() * 0.5, da: (Math.random() < 0.5 ? -1 : 1) * (0.12 + Math.random() * 0.14), de: -(0.06 + Math.random() * 0.1), dur: 0.55 + Math.random() * 0.5 };
        SHOOT.next = time + 15 + Math.random() * 30;
      }
      const C = SHOOT.cur;
      if (C) {
        const k = (time - C.t0) / C.dur;
        if (k >= 1 || k < 0) SHOOT.cur = null;
        else {
          const hd = Math.min(1, k * 1.25), tl = Math.max(0, hd - 0.35);
          const pa = [C.a + C.da * hd, C.e + C.de * hd], pb = [C.a + C.da * tl, C.e + C.de * tl];
          const xa = sx(pa[0]), ya = yOf(pa[0], pa[1]), xb = sx(pb[0]), yb = yOf(pb[0], pb[1]);
          if (xa != null && xb != null && ya != null && yb != null) {
            const fa = Math.sin(Math.PI * k) * vis, lg = X.createLinearGradient(xb, yb, xa, ya);
            lg.addColorStop(0, "rgba(200,220,255,0)"); lg.addColorStop(1, rgb([235, 242, 255], fa));
            X.strokeStyle = lg; X.lineWidth = 1.6 * pxs; X.lineCap = "round"; X.beginPath(); X.moveTo(xb, yb); X.lineTo(xa, ya); X.stroke();
            X.globalCompositeOperation = "lighter"; X.globalAlpha = fa; const r = 5 * pxs; X.drawImage(SP.glow[1], xa - r, ya - r, r * 2, r * 2);
            X.globalCompositeOperation = "source-over"; X.globalAlpha = 1;
          }
        }
      }
    }
    /* Sonne (bzw. Mond gegenüber) – Scheibe und Lichthof */
    /* v133: nachts steht der Mond vor dir, etwas rechts und hoch genug, um ihn beim Hochschauen zu sehen */
    const bodyAz = el >= -0.02 ? sol.az : sol.az + 0.5, bodyEl = el >= -0.02 ? 0.05 + Math.max(0, el) * 0.85 : 0.3 + Math.min(0.95, -el) * 0.14;
    const bx = sx(bodyAz);
    let sunX = null, sunY = 0, sunV = 0;
    if (bx != null) {
      const dd = ((bodyAz - fwd + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      sunX = bx; sunY = hy - fs * Math.tan(bodyEl) / Math.max(0.2, Math.cos(dd));
      const isSun = el >= -0.02, vis = (1 - wg * 0.85) * (isSun ? 1 : 0.8) * clamp(isSun ? 1 : night * 1.4, 0, 1);
      sunV = vis;
      if (!isSun) {
        /* v133: Mond als Bild mit Phase; Lichthof nach Helligkeit, feiner Ring bei Dunst */
        const mr = fs * 0.036 * (1 + Math.max(0, 0.25 - bodyEl) * 0.8), gl = mr * 7, mi = 0.15 + 0.85 * moonI;
        const halo = X.createRadialGradient(sunX, sunY, mr * 0.9, sunX, sunY, gl);
        halo.addColorStop(0, rgb([200, 214, 245], 0.4 * vis * mi)); halo.addColorStop(0.3, rgb([150, 170, 220], 0.12 * vis * mi)); halo.addColorStop(1, rgb([120, 140, 200], 0));
        X.fillStyle = halo; X.fillRect(sunX - gl, sunY - gl, gl * 2, gl * 2);
        if (wg > 0.2) { X.strokeStyle = rgb([190, 200, 230], 0.06 * wg * vis * mi); X.lineWidth = mr * 0.5; X.beginPath(); X.arc(sunX, sunY, mr * 5, 0, 6.2832); X.stroke(); }
        X.globalAlpha = clamp(vis * 1.15, 0, 1); X.drawImage(moonSprite(mph), sunX - mr, sunY - mr, mr * 2, mr * 2); X.globalAlpha = 1;
      } else {
      const sr = fs * (isSun ? 0.052 : 0.03) * (1 + Math.max(0, 0.25 - bodyEl) * 1.2);           /* tief stehend wirkt sie größer */
      const gr = sr * (isSun ? 9 : 5), col = isSun ? P.sun : [225, 232, 255];
      const halo = X.createRadialGradient(sunX, sunY, sr * 0.6, sunX, sunY, gr);
      halo.addColorStop(0, rgb(col, 0.62 * vis)); halo.addColorStop(0.35, rgb(mix(col, P.mid, 0.5), 0.22 * vis)); halo.addColorStop(1, rgb(col, 0));
      X.fillStyle = halo; X.fillRect(sunX - gr, sunY - gr, gr * 2, gr * 2);
      const dsk = X.createRadialGradient(sunX, sunY, 0, sunX, sunY, sr);
      dsk.addColorStop(0, rgb(mix(col, [255, 255, 255], isSun ? 0.35 : 0.1), vis)); dsk.addColorStop(0.85, rgb(col, vis)); dsk.addColorStop(1, rgb(col, 0.0));
      X.fillStyle = dsk; X.beginPath(); X.arc(sunX, sunY, sr, 0, 6.2832); X.fill();
      }
    }
    /* Wolken: weiche Ballen, unten dunkler, oben vom Licht der Sonne gefärbt; im Abendrot lange rote Bänder */
    const evening = clamp(1 - Math.abs(h - 20.0) / 1.9, 0, 1);
    /* v133: Wolken aus vorgerechneten, gelockten Formen – unten Schatten, oben Licht; nachts dunkel vor den Sternen, mit silbernem Mondrand */
    const CS = cloudShapes(), lit = mix(P.cl, P.sun, 0.25 * evening), dkc = P.cd, cAl = night > 0.5 ? 0.9 : 0.95 * (1 - wg * 0.25);
    const moonA = el < -0.02 && sunX != null ? sol.az + 0.5 : null;
    let ci = 0;
    const cloud = (a, e, w, hgt, band) => {
      const x = sx(a); if (x == null) return;
      const d = angN(a - fwd), cd = Math.max(0.25, Math.cos(d));
      if (Math.abs(d) > halfH + 0.5) return;
      const S0 = CS[(ci++) % CS.length], y = hy - fs * Math.tan(e) / cd, wd = fs * w / cd * (band ? 2.2 : 1.7), ht = wd * S0.H / S0.W * (band ? 0.35 : 0.55 + hgt * 0.45);
      X.drawImage(tintCloud(S0, lit, dkc, cAl), x - wd / 2, y - ht * 0.8, wd, ht);
      if (moonA != null && sunV > 0.05) {
        const md = Math.abs(angN(a - moonA)), rk = Math.exp(-Math.pow(md / 0.6, 2)) * sunV * (0.2 + 0.5 * moonI) * night;
        if (rk > 0.03) { X.globalAlpha = Math.min(1, rk * 1.3); X.globalCompositeOperation = "lighter"; X.drawImage(rimCloud(S0), x - wd / 2, y - ht * 0.8, wd, ht); X.globalCompositeOperation = "source-over"; X.globalAlpha = 1; }
      }
    };
    const drift = time * 0.004;
    CLOUDS.forEach((k, i) => { if (i < 8 + Math.round(wg * 6)) cloud(k.a + drift * k.sp, k.e * (1 + wg * 0.1), k.w * (1 + wg * 0.5), k.hgt, false); });
    if ((evening > 0.05 || h > 17.2 && h < 21.8)) for (let i = 0; i < 6; i++) cloud(i * 1.05 + 0.4 + drift * 0.6, 0.025 + (i % 3) * 0.05 + (i % 2) * 0.02, 0.45 + (i % 3) * 0.12, 0.7, true);
    /* Gelände: Berge, See, Hügel – jede Kette ein Polygon, oben die Farbe der Kette, unten im Dunst */
    const a0 = fwd - halfH, a1 = fwd + halfH, N = 110, pts = [];
    for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N, x = sx(a); if (x != null) pts.push({ a, x, d: Math.abs(((a - fwd + Math.PI * 3) % (Math.PI * 2)) - Math.PI) }); }
    if (pts.length < 2) return;
    const ridge = (fn, col, base, haze, zoom) => {
      X.beginPath(); X.moveTo(pts[0].x, hy + base + 60);
      pts.forEach(p => X.lineTo(p.x, hy + base - fs * Math.tan(fn(p.a)) * (zoom || 1) / Math.max(0.3, Math.cos(p.d))));
      X.lineTo(pts[pts.length - 1].x, hy + base + 60); X.closePath();
      const lg = X.createLinearGradient(0, hy - fs * 0.16, 0, hy + base + 6);
      lg.addColorStop(0, rgb(col)); lg.addColorStop(1, rgb(mix(col, P.hor, haze)));
      X.fillStyle = lg; X.fill();
    };
    ridge(farE, P.far, 4, 0.75);
    /* See mit Spiegelung von Himmel und Sonne */
    const wy0 = hy + 2, wy1 = hy + fs * 0.03;
    const wg2 = X.createLinearGradient(0, wy0, 0, wy1);
    wg2.addColorStop(0, rgb(mix(P.hor, P.far, 0.18))); wg2.addColorStop(1, rgb(mix(P.mid, P.hill, 0.45)));
    X.fillStyle = wg2; X.fillRect(0, wy0, cw, wy1 - wy0 + 3);
    if (sunX != null && sunV > 0.05 && el > -0.02 && el < 0.7) {
      const rr = fs * 0.05, st = X.createLinearGradient(0, wy0, 0, wy1 + fs * 0.05);
      st.addColorStop(0, rgb(P.sun, 0.75 * sunV)); st.addColorStop(1, rgb(P.sun, 0));
      X.fillStyle = st;
      for (let i = 0; i < 12; i++) {
        const yy = wy0 + (wy1 - wy0 + 8) * (i / 12), ww = rr * (1.7 - i * 0.07) * (0.7 + 0.3 * Math.sin(time * 2.3 + i * 1.9));
        X.fillRect(sunX - ww, yy, ww * 2, Math.max(1, (wy1 - wy0) / 14));
      }
    }
    ridge(hillE, P.hill, fs * 0.036, 0.5);
    ridge(nearE, P.near, fs * 0.05, 0.28);
    /* Wiese davor bis zum Bildrand (wird von der 3D-Welt verdeckt) */
    const ly = hy + fs * 0.05, lg = X.createLinearGradient(0, ly, 0, ly + fs * 0.5);
    lg.addColorStop(0, rgb(mix(P.near, P.hor, 0.25))); lg.addColorStop(1, rgb(mix(P.near, [20, 40, 24], 0.5)));
    X.fillStyle = lg; X.fillRect(0, ly - 1, cw, ch);
    /* Lichthof über der ganzen Szene (Sonne vorn, tief) – Bildmitte-Wert dämpfen, damit die Kerbe sichtbar bleibt */
    if (sunX != null && sunV > 0.05 && el > -0.02 && el < 0.55) {
      const k = clamp(1 - el / 0.55, 0, 1) * sunV * 0.34, gx = sunX / sc, gy = sunY / sc, gr = f * 0.9;
      const gk = (gx | 0) + ":" + (gy | 0) + ":" + k.toFixed(2) + P.sun[0];
      if (gk !== key) {
        key = gk;
        glow.style.background = "radial-gradient(circle at " + gx.toFixed(0) + "px " + gy.toFixed(0) + "px," + rgb(P.sun, k) + " 0," + rgb(P.sun, k * 0.35) + " " + (gr * 0.45).toFixed(0) + "px," + rgb(P.sun, 0) + " " + gr.toFixed(0) + "px)";
      }
      glow.style.display = "block";
    } else if (glow.style.display !== "none") glow.style.display = "none";
  }

  /* Nebel und Licht der Szene an die Aussicht anpassen (nur Ich-Perspektive); h = Stunde */
  function env(E, h) {
    const P = pal(h), wg = weather();
    const hor = wg > 0 ? grey(P.hor, wg * 0.6) : P.hor, mid = wg > 0 ? grey(P.mid, wg * 0.6) : P.mid;
    const fog = mix(hor, mid, 0.18).map(v => clamp(v / 255, 0, 1));
    /* im Dunkeln etwas Licht lassen, bei Tag fast der alte Nebel */
    E.fog = mix(E.fog, fog, 0.85);
    const w = clamp(1 - Math.abs(h - 19.9) / 2.4, 0, 1);                                        /* Abendrot-Gewicht */
    if (w > 0 && E.sunCol) { const sc = mix(E.sunCol, P.sun.map(v => v / 255 * 0.95), 0.55 * w); E.sunCol = sc; }
    if (w > 0 && E.sky) E.sky = mix(E.sky, [0.5, 0.36, 0.42], 0.25 * w);
  }
  return { draw, env, pal, sunEl, hide, _mw: () => milky().c };
})();
if (typeof module !== "undefined") module.exports = VISTA;
