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
    [0,    [6, 9, 26],     [12, 18, 44],    [26, 32, 62],    [0, 0, 0],       [22, 28, 56],   [16, 21, 44],   [10, 13, 28],  [40, 48, 86],    [14, 18, 38]],
    [4.6,  [6, 9, 26],     [12, 18, 44],    [26, 32, 62],    [0, 0, 0],       [22, 28, 56],   [16, 21, 44],   [10, 13, 28],  [40, 48, 86],    [14, 18, 38]],
    [5.7,  [28, 38, 92],   [110, 80, 120],  [236, 128, 96],  [255, 150, 90],  [70, 64, 104],  [54, 48, 84],   [34, 32, 58],  [255, 150, 130], [70, 60, 100]],
    [6.7,  [84, 132, 208], [200, 168, 184], [255, 196, 130], [255, 200, 130], [132, 130, 170], [108, 116, 140], [70, 90, 100], [255, 205, 170], [150, 140, 170]],
    [8.5,  [72, 132, 214], [140, 192, 238], [206, 228, 246], [255, 240, 210], [130, 160, 196], [96, 132, 150],  [66, 110, 92], [255, 255, 255], [190, 205, 225]],
    [13,   [56, 116, 214], [120, 178, 238], [190, 220, 244], [255, 250, 230], [120, 152, 190], [90, 126, 150],  [60, 104, 90], [255, 255, 255], [185, 200, 222]],
    [17,   [70, 122, 206], [150, 186, 228], [228, 218, 196], [255, 236, 190], [134, 150, 182], [104, 124, 140], [70, 100, 84], [255, 246, 226], [190, 196, 210]],
    [18.6, [84, 112, 184], [216, 172, 140], [255, 208, 132], [255, 206, 120], [150, 128, 150], [120, 108, 122], [74, 82, 76],  [255, 214, 160], [160, 132, 150]],
    [19.7, [58, 76, 150],  [232, 124, 92],  [255, 150, 60],  [255, 140, 60],  [134, 76, 100],  [98, 56, 76],    [52, 44, 56],  [255, 150, 100], [118, 66, 92]],
    [20.4, [40, 44, 108],  [196, 70, 78],   [255, 92, 40],   [255, 86, 36],   [96, 40, 68],    [70, 32, 56],    [34, 26, 40],  [255, 102, 76],  [84, 36, 66]],
    [21.3, [18, 24, 66],   [96, 44, 92],    [196, 66, 72],   [210, 70, 60],   [44, 30, 64],    [32, 24, 50],    [18, 16, 32],  [170, 70, 90],   [40, 28, 64]],
    [22.6, [6, 9, 26],     [12, 18, 44],    [26, 32, 62],    [0, 0, 0],       [22, 28, 56],   [16, 21, 44],   [10, 13, 28],  [40, 48, 86],    [14, 18, 38]],
    [24,   [6, 9, 26],     [12, 18, 44],    [26, 32, 62],    [0, 0, 0],       [22, 28, 56],   [16, 21, 44],   [10, 13, 28],  [40, 48, 86],    [14, 18, 38]]
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
  const STARS = Array.from({ length: 110 }, (_, i) => { const r = k => { const s = Math.sin(i * 39.346 + k * 11.135) * 24634.6345; return s - Math.floor(s); }; return { a: r(1) * 6.2832, e: 0.05 + r(2) * 1.1, m: 0.4 + r(3) * 0.6 }; });

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
    const sc = 0.5, cw = Math.max(2, Math.round(W * sc)), ch = Math.max(2, Math.round(H * sc));
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
    if (sol.az == null) sol.az = fwd + 0.05;                                                  /* Sonne: beim ersten Hinsehen leicht rechts vor dir */
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
    /* Sterne und Mond */
    if (night > 0.05) {
      X.fillStyle = "#fff";
      STARS.forEach(s => {
        const x = sx(s.a); if (x == null || x < -4 || x > cw + 4) return;
        const d = s.a - fwd, y = hy - fs * Math.tan(s.e) / Math.max(0.2, Math.cos(((d + Math.PI) % (2 * Math.PI)) - Math.PI));
        if (y > hy - 2 || y < -4) return;
        X.globalAlpha = night * s.m * (0.7 + 0.3 * Math.sin(time * 1.7 + s.a * 9));
        X.fillRect(x, y, 1.4, 1.4);
      });
      X.globalAlpha = 1;
    }
    const el = sunEl(h), cl = Math.cos(el);
    /* Sonne (bzw. Mond gegenüber) – Scheibe und Lichthof */
    const bodyAz = el >= -0.02 ? sol.az : sol.az + Math.PI, bodyEl = el >= -0.02 ? 0.05 + Math.max(0, el) * 0.85 : -el;
    const bx = sx(bodyAz);
    let sunX = null, sunY = 0, sunV = 0;
    if (bx != null) {
      const dd = ((bodyAz - fwd + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      sunX = bx; sunY = hy - fs * Math.tan(bodyEl) / Math.max(0.2, Math.cos(dd));
      const isSun = el >= -0.02, vis = (1 - wg * 0.85) * (isSun ? 1 : 0.8) * clamp(isSun ? 1 : night * 1.4, 0, 1);
      sunV = vis;
      const sr = fs * (isSun ? 0.052 : 0.03) * (1 + Math.max(0, 0.25 - bodyEl) * 1.2);           /* tief stehend wirkt sie größer */
      const gr = sr * (isSun ? 9 : 5), col = isSun ? P.sun : [225, 232, 255];
      const halo = X.createRadialGradient(sunX, sunY, sr * 0.6, sunX, sunY, gr);
      halo.addColorStop(0, rgb(col, 0.62 * vis)); halo.addColorStop(0.35, rgb(mix(col, P.mid, 0.5), 0.22 * vis)); halo.addColorStop(1, rgb(col, 0));
      X.fillStyle = halo; X.fillRect(sunX - gr, sunY - gr, gr * 2, gr * 2);
      const dsk = X.createRadialGradient(sunX, sunY, 0, sunX, sunY, sr);
      dsk.addColorStop(0, rgb(mix(col, [255, 255, 255], isSun ? 0.35 : 0.1), vis)); dsk.addColorStop(0.85, rgb(col, vis)); dsk.addColorStop(1, rgb(col, 0.0));
      X.fillStyle = dsk; X.beginPath(); X.arc(sunX, sunY, sr, 0, 6.2832); X.fill();
    }
    /* Wolken: weiche Ballen, unten dunkler, oben vom Licht der Sonne gefärbt; im Abendrot lange rote Bänder */
    const evening = clamp(1 - Math.abs(h - 20.0) / 1.9, 0, 1);
    const cloud = (a, e, w, hgt, band) => {
      const x = sx(a); if (x == null) return;
      const d = ((a - fwd + Math.PI * 3) % (Math.PI * 2)) - Math.PI, cd = Math.max(0.25, Math.cos(d));
      if (Math.abs(d) > halfH + 0.4) return;
      const y = hy - fs * Math.tan(e) / cd, wd = fs * w / cd * (band ? 1.5 : 1), ht = wd * (band ? 0.07 : 0.2) * hgt;
      const n = band ? 5 : 6;
      for (let i = 0; i < n; i++) {
        const u = (i / (n - 1)) * 2 - 1, cx = x + u * wd * 0.5, cy = y + (band ? 0 : -Math.cos(u * 1.4) * ht * 0.5) , rx = wd * (band ? 0.3 : 0.27) * (1 - Math.abs(u) * 0.25), ry = ht * (band ? 1 : 0.9 + (1 - Math.abs(u)) * 0.5);
        X.save(); X.translate(cx, cy); X.scale(1, ry / rx);
        const rg = X.createRadialGradient(0, -rx * 0.28, 0, 0, 0, rx);
        const lit = mix(P.cl, P.sun, 0.25 * evening), dk = P.cd;
        rg.addColorStop(0, rgb(lit, (band ? 0.85 : 0.92) * (1 - wg * 0.3))); rg.addColorStop(0.55, rgb(mix(lit, dk, 0.55), 0.6)); rg.addColorStop(1, rgb(dk, 0));
        X.fillStyle = rg; X.beginPath(); X.arc(0, 0, rx, 0, 6.2832); X.fill(); X.restore();
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
  return { draw, env, pal, sunEl, hide };
})();
if (typeof module !== "undefined") module.exports = VISTA;
