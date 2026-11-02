/* =========================================================================
   LOGISTIKA – vehicon.js (v248)
   Für jedes Fahrzeug ein kleines Low-Poly-3D-Modell (Quader, Zylinder,
   Rümpfe, Flügel). Es wird einmal mit Licht und Schattierung auf ein
   Canvas gerendert (Maler-Algorithmus, ohne WebGL) und als Bild
   zwischengespeichert. vehIconHTML(t, farbe) liefert das <img> fürs Icon,
   bei Fehlern das alte Emoji.
   ========================================================================= */
"use strict";

const VEH3D = (() => {
  /* ------------------------------ Bausteine ----------------------------- */
  const HEX_FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
  function solid(out, verts, faces, c) {
    const n = verts.length, cen = [0, 0, 0];
    verts.forEach(v => { cen[0] += v[0] / n; cen[1] += v[1] / n; cen[2] += v[2] / n; });
    faces.forEach(f => {
      const pts = f.map(i => verts[i]);
      const nm = newell(pts);
      if (Math.hypot(nm[0], nm[1], nm[2]) < 1e-9) return;
      const fc = mid(pts);
      if ((fc[0] - cen[0]) * nm[0] + (fc[1] - cen[1]) * nm[1] + (fc[2] - cen[2]) * nm[2] < 0) pts.reverse();
      out.push({ pts, c });
    });
  }
  function newell(p) {
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return [x, y, z];
  }
  const mid = p => { const m = [0, 0, 0]; p.forEach(v => { m[0] += v[0]; m[1] += v[1]; m[2] += v[2]; }); return m.map(a => a / p.length); };

  function builder() {
    const F = [];
    const M = {
      F,
      /* Quader x0..x1, y0..y1, Breite w um z (o.z); ft/bt: oben vorne/hinten zurückgesetzt, fb: unten vorne, zt: oben schmaler */
      box(x0, x1, y0, y1, w, c, o = {}) {
        const z = o.z || 0, a = z - w / 2, b = z + w / 2, ft = o.ft || 0, bt = o.bt || 0, fb = o.fb || 0, zt = o.zt || 0, bb = o.bb || 0;
        solid(F, [[x0 + bb, y0, a], [x1 - fb, y0, a], [x1 - fb, y0, b], [x0 + bb, y0, b],
          [x0 + bt, y1, a + zt], [x1 - ft, y1, a + zt], [x1 - ft, y1, b - zt], [x0 + bt, y1, b - zt]], HEX_FACES, c);
      },
      /* Schiffsrumpf mit spitzem Bug */
      hull(x0, x1, y0, y1, w, c, bow = 0.12, rake = 0.06) {
        const L = x1 - x0, h = w / 2;
        solid(F, [[x0 + L * 0.01, y0, -h * 0.92], [x1 - L * rake, y0, -h * 0.12], [x1 - L * rake, y0, h * 0.12], [x0 + L * 0.01, y0, h * 0.92],
          [x0, y1, -h], [x1, y1, -h * 0.08], [x1, y1, h * 0.08], [x0, y1, h]], HEX_FACES, c);
        /* breiter Mittelteil bis kurz vor dem Bug */
        solid(F, [[x0 + L * 0.01, y0, -h * 0.92], [x1 - L * bow, y0, -h * 0.92], [x1 - L * bow, y0, h * 0.92], [x0 + L * 0.01, y0, h * 0.92],
          [x0, y1, -h], [x1 - L * bow, y1, -h], [x1 - L * bow, y1, h], [x0, y1, h]], HEX_FACES, c);
      },
      /* Stab zwischen zwei Punkten in der x-y-Ebene */
      beam(p, q, th, c, z = 0, wz) {
        const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * th / 2, ny = dx / l * th / 2, hz = (wz || th) / 2;
        solid(F, [[p[0] - nx, p[1] - ny, z - hz], [q[0] - nx, q[1] - ny, z - hz], [q[0] + nx, q[1] + ny, z - hz], [p[0] + nx, p[1] + ny, z - hz],
          [p[0] - nx, p[1] - ny, z + hz], [q[0] - nx, q[1] - ny, z + hz], [q[0] + nx, q[1] + ny, z + hz], [p[0] + nx, p[1] + ny, z + hz]], HEX_FACES, c);
      },
      /* Kegelstumpf entlang x */
      cylX(x0, x1, r0, r1, cy, cz, c, n = 12, sy = 1) {
        const v = [], f = [];
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; v.push([x0, cy + Math.sin(a) * r0 * sy, cz + Math.cos(a) * r0]); }
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; v.push([x1, cy + Math.sin(a) * r1 * sy, cz + Math.cos(a) * r1]); }
        for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
        if (r0 > 0.001) f.push([...Array(n).keys()]);
        if (r1 > 0.001) f.push([...Array(n).keys()].map(i => n + i));
        solid(F, v, f, c);
      },
      /* Zylinder entlang z (Räder) */
      cylZ(cx, cy, z0, z1, r, c, n = 12) {
        const v = [], f = [];
        for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * Math.PI * 2; v.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z0]); }
        for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * Math.PI * 2; v.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z1]); }
        for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
        f.push([...Array(n).keys()]); f.push([...Array(n).keys()].map(i => n + i));
        solid(F, v, f, c);
      },
      /* Zylinder entlang y (Schornstein, Tankdom) */
      cylY(cx, cz, y0, y1, r, c, n = 10) {
        const v = [], f = [];
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; v.push([cx + Math.cos(a) * r, y0, cz + Math.sin(a) * r]); }
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; v.push([cx + Math.cos(a) * r, y1, cz + Math.sin(a) * r]); }
        for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
        f.push([...Array(n).keys()]); f.push([...Array(n).keys()].map(i => n + i));
        solid(F, v, f, c);
      },
      /* Rad mit heller Nabe; tr = Spurweite (0 = Zweirad) */
      wheel(x, r, w, tr, c = "#23262e", hub = "#c9ced6") {
        const zs = tr ? [-tr / 2, tr / 2] : [0];
        zs.forEach(z => {
          M.cylZ(x, r, z - w / 2, z + w / 2, r, c);
          const s = z >= 0 ? 1 : -1;
          M.cylZ(x, r, z + s * w / 2, z + s * (w / 2 + 0.01 + r * 0.04), r * 0.45, hub, 8);
        });
      },
      /* Tragfläche: Hinterkante Wurzel xr, Wurzeltiefe cr, Spitzentiefe ct, Pfeilung sw, von z0 nach z1 */
      wing(xr, cr, ct, sw, z0, z1, y, dy, th, c) {
        const lt = xr + cr - sw, tt = lt - ct;
        solid(F, [[xr, y, z0], [xr + cr, y, z0], [lt, y + dy, z1], [tt, y + dy, z1],
          [xr, y + th, z0], [xr + cr, y + th, z0], [lt, y + dy + th * 0.6, z1], [tt, y + dy + th * 0.6, z1]], HEX_FACES, c);
      },
      /* Seitenleitwerk in der x-y-Ebene */
      fin(xr, cr, ct, sw, y0, y1, th, c) {
        const lt = xr + cr - sw, tt = lt - ct;
        solid(F, [[xr, y0, -th], [xr + cr, y0, -th], [lt, y1, -th * 0.6], [tt, y1, -th * 0.6],
          [xr, y0, th], [xr + cr, y0, th], [lt, y1, th * 0.6], [tt, y1, th * 0.6]], HEX_FACES, c);
      }
    };
    return M;
  }

  /* --------------------------- kleine Helfer --------------------------- */
  const GLASS = "#2c3d5a", INK = "#23262e", STEEL = "#8e98a6", LIGHT = "#ffe28a", CHROME = "#d6dbe2";
  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const BOXC = ["#e2465f", "#2f6fed", "#20a97a", "#f2a33c", "#7c5cff", "#19b8c9", "#c9ced6", "#a3213b", "#f2c200", "#17805c"];

  /* ------------------------------- Räder ------------------------------- */
  function bike(M, o) {
    const fr = o.frame, fx = o.cargo ? 1.95 : 1.05, fr2 = o.cargo ? 0.26 : 0.34;
    M.wheel(0, 0.34, 0.05, 0);
    if (o.trike) M.wheel(fx, fr2, 0.07, 0.8); else M.wheel(fx, fr2, 0.05, 0);
    M.beam([0, 0.34], [0.45, 0.3], 0.05, fr);
    M.beam([0.45, 0.3], [0.36, 0.95], 0.06, fr);
    M.beam([0, 0.34], [0.36, 0.92], 0.04, fr);
    if (o.cargo) {
      M.beam([0.45, 0.3], [fx, 0.3], 0.07, fr, 0, 0.08);
      M.beam([0.36, 0.92], [0.85, 0.95], 0.05, fr);
      M.beam([0.45, 0.3], [0.85, 0.95], 0.06, fr);
      M.beam([0.85, 0.95], [0.88, 1.15], 0.05, INK);
      M.box(0.84, 0.92, 1.13, 1.18, 0.55, INK);
      if (!o.trike) M.beam([fx - 0.08, 0.5], [fx, fr2], 0.04, fr);
      M.box(0.95, 1.8, o.boxY0 || 0.38, o.boxY1 || 0.85, o.boxW || 0.6, o.boxC, { ft: 0.05 });
      if (o.lid) M.box(1.02, 1.72, o.boxY1, o.boxY1 + 0.45, 0.55, o.lid, { zt: 0.02 });
    } else {
      M.beam([0.36, 0.92], [0.9, 0.95], 0.05, fr);
      M.beam([0.45, 0.3], [0.9, 0.9], 0.06, fr);
      M.beam([0.9, 0.95], [1.05, 0.34], 0.04, fr);
      M.beam([0.9, 0.95], [0.92, 1.12], 0.04, INK);
      M.box(0.88, 0.96, 1.1, 1.15, 0.5, INK);
      M.box(-0.12, 0.3, 0.62, 0.66, 0.2, INK);
      M.box(-0.1, 0.3, 0.66, 0.98, 0.34, o.bag || "#f2a33c", { ft: 0.04 });
    }
    M.box(0.26, 0.48, 0.98, 1.04, 0.14, INK);
  }
  function moped(M, o) {
    const c = o.c;
    M.wheel(0, 0.28, 0.1, 0); M.wheel(1.25, 0.28, 0.1, 0);
    if (o.simson) {
      M.beam([0.1, 0.35], [1.0, 0.95], 0.08, INK);
      M.box(0.5, 0.95, 0.72, 0.95, 0.3, c, { ft: 0.08, bt: 0.06 });
      M.box(0.05, 0.6, 0.85, 0.93, 0.26, INK);
      M.box(0.2, 0.6, 0.3, 0.7, 0.36, c, { bt: 0.1 });
      M.box(0.25, 0.55, 0.28, 0.45, 0.22, STEEL);
    } else {
      M.box(0.35, 0.95, 0.24, 0.34, 0.36, c);
      M.box(-0.05, 0.6, 0.34, 0.78, 0.42, c, { ft: 0.12, bt: 0.1 });
      M.box(0.05, 0.62, 0.78, 0.86, 0.3, INK);
      M.box(0.88, 1.05, 0.3, 1.0, 0.42, c, { bt: 0.1 });
    }
    M.beam([1.02, 1.02], [1.25, 0.28], 0.06, STEEL);
    M.box(0.96, 1.06, 1.02, 1.08, 0.62, INK);
    M.box(1.04, 1.12, 0.88, 0.98, 0.14, LIGHT);
    M.box(-0.2, 0.22, 0.86, 1.22, 0.4, o.box, { ft: 0.04 });
  }

  /* ----------------------------- Straße ------------------------------- */
  function van(M, o) {
    const L = o.len, H = o.h, W = o.w, c = o.c;
    M.wheel(0.95, 0.34, 0.24, W - 0.2); M.wheel(L - 1.0, 0.34, 0.24, W - 0.2);
    M.box(0.05, L - 1.55, 0.36, H, W, c);
    M.box(L - 1.55, L - 0.7, 0.36, 1.12, W, c);
    M.box(L - 1.55, L - 0.7, 1.12, H - 0.06, W - 0.04, GLASS, { ft: 0.62 });
    M.box(L - 1.55, L - 1.4, 1.12, H - 0.06, W + 0.01, c);
    M.box(L - 0.7, L, 0.36, 1.08, W, c, { ft: 0.18 });
    M.box(L - 0.06, L + 0.04, 0.3, 0.5, W, INK);
    M.box(L - 0.04, L + 0.01, 0.82, 0.95, W - 0.25, LIGHT);
    M.box(0.0, 0.08, 0.3, 0.5, W, INK);
    if (o.stripe) M.box(0.4, L - 1.6, 0.6, 0.78, W + 0.02, o.stripe);
    if (o.kuehl) M.box(L - 1.5, L - 0.95, H - 0.06, H + 0.25, W * 0.6, "#c9ced6");
  }
  /* Fahrerhaus eines Lkw (Frontlenker), Front bei x = x1 */
  function cab(M, x1, len, y0, h, w, c, o = {}) {
    M.box(x1 - len, x1, y0, y0 + h, w, c, { ft: 0.12 });
    M.box(x1 - 0.1, x1 + 0.01, y0 + h * 0.52, y0 + h * 0.9, w - 0.25, GLASS, { ft: 0.06 });
    M.box(x1 - len * 0.45, x1 - 0.15, y0 + h * 0.52, y0 + h * 0.88, w + 0.02, GLASS);
    M.box(x1 - 0.06, x1 + 0.05, y0 + 0.15, y0 + h * 0.38, w * 0.62, INK);
    M.box(x1 - 0.03, x1 + 0.06, y0 + 0.2, y0 + 0.38, w - 0.1, LIGHT);
    M.box(x1 - 0.1, x1 + 0.12, y0 - 0.25, y0 + 0.12, w, INK);
    if (o.spoiler) M.box(x1 - len, x1 - 0.3, y0 + h, y0 + h + o.spoiler, w - 0.2, c, { ft: 0.5 });
    if (o.stripe) M.box(x1 - len, x1 - 0.12, y0 + h * 0.36, y0 + h * 0.46, w + 0.02, o.stripe);
  }
  function truck(M, o) {
    const L = o.len, W = 2.5;
    M.box(0.3, L - 2.0, 0.55, 0.95, 1.0, INK);
    M.wheel(1.3, 0.5, 0.35, 2.0); if (o.axle3) M.wheel(2.4, 0.5, 0.35, 2.0); M.wheel(L - 1.45, 0.5, 0.35, 2.0);
    cab(M, L, 2.1, 0.75, 2.35, W, o.cab, { stripe: o.cabStripe });
    if (o.body === "tank") {
      M.cylX(0.2, L - 2.5, 1.0, 1.0, 2.0, 0, o.bodyC, 14);
      M.cylX(L - 2.5, L - 2.35, 1.0, 0.7, 2.0, 0, o.bodyC, 14);
      M.cylY(1.5, 0, 2.9, 3.15, 0.25, STEEL); M.cylY(3.4, 0, 2.9, 3.15, 0.25, STEEL);
      M.box(0.3, L - 2.5, 1.95, 2.25, 2.06, "#ff8c1a");
    } else {
      M.box(0.0, L - 2.25, 1.0, 3.7, W, o.bodyC);
      if (o.stripe) M.box(0.05, L - 2.3, 2.3, 2.6, W + 0.02, o.stripe);
      if (o.body === "reefer") M.box(L - 2.5, L - 2.25, 2.7, 3.5, 1.5, "#c9ced6", { z: 0 });
      if (o.body === "swap") M.box(0.0, L - 2.25, 0.95, 1.05, W + 0.04, STEEL);
    }
  }
  /* Sattelzug: Zugmaschine vorne, Auflieger dahinter */
  function semi(M, o) {
    const T = o.trailerLen || 13.6, X = T - 1.2, W = 2.55;
    /* Zugmaschine */
    M.box(X, X + 6.0, 0.6, 1.05, 1.1, INK);
    M.wheel(X + 1.0, 0.52, 0.4, 2.0); if (o.tri) M.wheel(X + 2.2, 0.52, 0.4, 2.0); M.wheel(X + 4.7, 0.52, 0.4, 2.0);
    cab(M, X + 6.3, 2.4, 0.95, o.lowCab ? 2.4 : 2.9, W, o.tc, { spoiler: o.lowCab ? 0 : 0.5, stripe: o.cabStripe });
    M.box(X + 2.6, X + 3.9, 0.55, 1.1, W - 0.2, STEEL);
    const t = o.trailer, tc = o.trC;
    if (t === "box" || t === "reefer") {
      M.box(0, T, 1.25, 4.0, W, tc);
      M.box(0.2, T - 0.2, 1.05, 1.25, 1.4, INK);
      if (o.stripe) M.box(0.1, T - 0.1, 2.0, 2.35, W + 0.02, o.stripe);
      if (t === "reefer") M.box(T - 0.05, T + 0.3, 2.5, 3.7, 1.8, "#c9ced6");
    } else if (t === "tank") {
      M.box(0.4, T - 0.6, 1.05, 1.3, 1.3, INK);
      M.cylX(0.3, T - 0.4, 1.2, 1.2, 2.45, 0, tc, 16);
      M.cylX(0.0, 0.3, 0.8, 1.2, 2.45, 0, tc, 16); M.cylX(T - 0.4, T - 0.1, 1.2, 0.8, 2.45, 0, tc, 16);
      M.box(1.0, T - 1.0, 3.65, 3.75, 0.6, STEEL);
      M.box(0.5, T - 0.5, 2.3, 2.6, 2.44, "#ff8c1a");
    } else if (t === "container") {
      M.box(0.3, T - 0.3, 1.05, 1.3, W - 0.3, INK);
      M.box(0.2, T - 0.5, 1.3, 4.0, W, tc);
      for (let x = 0.8; x < T - 0.8; x += 0.9) M.box(x, x + 0.12, 1.35, 3.95, W + 0.04, tc === "#2f6fed" ? "#2559c4" : "#00000022");
    } else {
      /* Tieflader / Schwerlast */
      M.box(0.0, T - 2.5, 0.65, 1.05, W, INK);
      M.box(T - 2.5, T + 0.3, 1.05, 1.5, W, INK, { bb: 0.6 });
      if (t === "lowbed") {
        M.box(1.8, 7.8, 1.05, 2.0, 2.4, "#f2c200");
        M.box(5.5, 7.6, 2.0, 3.6, 2.0, "#f2c200");
        M.box(6.6, 7.55, 2.6, 3.4, 1.9, GLASS);
        M.beam([5.5, 2.6], [1.0, 3.6], 0.35, "#e0a800");
        M.beam([1.0, 3.6], [0.2, 1.3], 0.3, "#e0a800");
        M.box(0.0, 0.8, 1.05, 1.6, 1.1, STEEL);
      } else {
        M.box(1.5, 8.5, 1.05, 4.2, 2.9, tc);
        for (let x = 2.2; x < 8.2; x += 1.2) M.box(x, x + 0.35, 1.2, 4.0, 3.0, "#6b7480");
        M.cylY(3.5, 0, 4.2, 4.9, 0.35, CHROME); M.cylY(6.5, 0, 4.2, 4.9, 0.35, CHROME);
      }
    }
    if (t !== "lowbed" && t !== "heavy") [1.3, 2.6, 3.9].forEach(x => M.wheel(x, 0.5, 0.4, 2.0));
    else for (let x = 0.6; x < 5.0; x += 1.05) M.wheel(x, 0.42, 0.35, 2.1);
  }
  function goldhofer(M) {
    const W = 3.0;
    M.box(-2, 14.5, 0.75, 1.2, W, "#f2a33c");
    for (let x = -1.3; x < 14.3; x += 1.1) M.wheel(x, 0.38, 0.3, 2.5);
    M.cylX(-0.5, 12.5, 2.0, 2.0, 3.35, 0, "#c9ced6", 16);
    M.cylX(-1.2, -0.5, 1.2, 2.0, 3.35, 0, "#c9ced6", 16); M.cylX(12.5, 13.2, 2.0, 1.2, 3.35, 0, "#c9ced6", 16);
    M.box(1.0, 1.6, 1.2, 2.2, 2.4, INK); M.box(10.5, 11.1, 1.2, 2.2, 2.4, INK);
    /* Zugmaschine */
    M.box(14.5, 20.5, 0.6, 1.1, 1.2, INK);
    M.wheel(15.4, 0.55, 0.42, 2.1); M.wheel(16.6, 0.55, 0.42, 2.1); M.wheel(19.2, 0.55, 0.42, 2.1);
    cab(M, 20.8, 2.6, 1.0, 2.7, 2.55, "#1b4fc4", { stripe: "#f2c200" });
    M.box(17.0, 18.0, 1.1, 2.4, 2.4, INK);
  }

  /* --------------------------- Binnenschiff ---------------------------- */
  function barge(M, o) {
    const L = o.len, W = o.w, D = o.d || 2.6;
    M.hull(0, L, 0, D, W, o.hull, 0.1, 0.05);
    M.box(0.3, L * 0.97, D, D + 0.2, W * 0.9, "#c0392b", { fb: 0 });
    const h0 = L * 0.18, h1 = L * 0.88;
    if (o.kind === "bulk") {
      M.box(h0, h1, D, D + 1.5, W * 0.84, o.cover || "#2a6f4a", { zt: W * 0.12 });
    } else if (o.kind === "container") {
      const r = rng(L * 7), cl = 6.1, rows = Math.floor((h1 - h0) / cl);
      for (let i = 0; i < rows; i++)
        for (let s = 0; s < (o.tiers || 2); s++)
          M.box(h0 + i * cl + 0.1, h0 + (i + 1) * cl - 0.1, D + s * 2.6, D + (s + 1) * 2.6 - 0.05, W * 0.86, BOXC[Math.floor(r() * BOXC.length)]);
    } else if (o.kind === "tank") {
      M.box(h0, h1, D, D + 0.6, W * 0.85, "#c0392b");
      M.cylX(h0 + 1, h1 - 1, 0.35, 0.35, D + 0.9, W * 0.2, STEEL, 8);
      M.cylX(h0 + 1, h1 - 1, 0.35, 0.35, D + 0.9, -W * 0.2, STEEL, 8);
      for (let x = h0 + 6; x < h1 - 3; x += 14) M.box(x, x + 1.5, D + 0.6, D + 2.2, 1.5, CHROME);
    }
    if (o.house !== false) {
      M.box(0.6, h0 - 0.6, D, D + 2.4, W * 0.82, "#f4f4f2");
      M.box(1.5, h0 - 1.5, D + 2.4, D + 4.6 + (o.tall || 0), W * 0.6, "#f4f4f2");
      M.box(1.5, h0 - 1.5, D + 3.4 + (o.tall || 0), D + 4.3 + (o.tall || 0), W * 0.61, GLASS);
      M.box(h0 - 1.5, h0 - 1.45, D + 3.4 + (o.tall || 0), D + 4.3 + (o.tall || 0), W * 0.55, GLASS);
    }
  }

  /* ------------------------------ Schiene ------------------------------ */
  function loco(M, x0, o) {
    const L = 19, c = o.c;
    M.box(x0 + 1.5, x0 + L - 1.5, 0.9, 1.3, 2.6, INK);
    [2.5, 4.4, L - 4.4, L - 2.5].forEach(x => M.wheel(x0 + x, 0.55, 0.25, 1.5, INK, STEEL));
    if (o.hood) {
      M.box(x0 + 0.5, x0 + L - 0.5, 1.3, 1.6, 3.0, INK);
      M.box(x0 + 1.0, x0 + 12.5, 1.6, 3.6, 2.4, c, { ft: 0.2, bt: 0.2 });
      M.box(x0 + 12.5, x0 + 15.5, 1.6, 4.3, 3.0, c);
      M.box(x0 + 15.5, x0 + 18.5, 1.6, 3.4, 2.6, c, { ft: 0.3 });
      M.box(x0 + 12.6, x0 + 15.4, 3.3, 4.0, 3.02, GLASS);
      M.box(x0 + 1.2, x0 + 18.3, 2.0, 2.2, 2.62, "#f4f4f2");
    } else {
      M.box(x0 + 0.4, x0 + L - 0.4, 1.3, 4.2, 3.0, c, { ft: 0.6, bt: 0.6 });
      M.box(x0 + L - 0.6, x0 + L - 0.1, 3.1, 3.9, 2.6, GLASS, { ft: 0.2 });
      M.box(x0 + L - 2.2, x0 + L - 1.0, 3.1, 3.85, 3.02, GLASS);
      if (o.stripe) M.box(x0 + 0.5, x0 + L - 0.5, 1.6, 1.95, 3.02, o.stripe);
      M.box(x0 + 6, x0 + 13, 4.2, 4.5, 1.6, STEEL);
      M.beam([x0 + 12, 4.5], [x0 + 13.5, 5.6], 0.08, INK);
      M.beam([x0 + 13.5, 5.6], [x0 + 11.5, 5.7], 0.08, INK);
    }
  }
  function wagon(M, x0, kind, seed) {
    const L = 15, r = rng(seed);
    M.box(x0 + 0.3, x0 + L - 0.3, 0.95, 1.3, 2.7, INK);
    [2.0, 3.8, L - 3.8, L - 2.0].forEach(x => M.wheel(x0 + x, 0.48, 0.22, 1.5, INK, STEEL));
    if (kind === "container" || kind === "pocket") {
      const a = BOXC[Math.floor(r() * BOXC.length)], b = BOXC[Math.floor(r() * BOXC.length)];
      if (kind === "pocket") {
        M.box(x0 + 0.8, x0 + L - 0.8, 1.3, 4.1, 2.55, "#f4f4f2");
        M.box(x0 + 0.9, x0 + L - 0.9, 2.2, 2.6, 2.57, a);
      } else {
        M.box(x0 + 0.6, x0 + 7.3, 1.3, 3.9, 2.45, a); M.box(x0 + 7.6, x0 + L - 0.6, 1.3, 3.9, 2.45, b);
      }
    } else if (kind === "hopper") {
      M.box(x0 + 0.6, x0 + L - 0.6, 1.3, 3.8, 2.9, "#7a4a2a", { bb: 1.4, fb: 1.4 });
      M.box(x0 + 1.4, x0 + L - 1.4, 3.6, 3.85, 2.5, "#3a3330");
    } else {
      M.box(x0 + 0.6, x0 + L - 0.6, 1.3, 3.9, 2.6, "#a3213b");
    }
  }
  function train(M, o) {
    const n = o.n || 2;
    for (let i = 0; i < n; i++) wagon(M, i * 15.4, o.wagon, i * 31 + (o.seed || 1));
    loco(M, n * 15.4 + 0.2, o);
  }

  /* ----------------------------- Seeschiff ----------------------------- */
  function ship(M, o) {
    const L = o.len, W = o.w, D = o.d, k = o.kind;
    M.hull(0, L, 0, D * 0.45, W * 0.96, o.bottom || "#a3213b", 0.14, 0.08);
    M.hull(0, L * 1.01, D * 0.45, D, W, o.hull, 0.14, 0.04);
    const r = rng(L);
    if (k === "container") {
      const br = o.bridgeAt || 0.18, bx = L * br;
      const bays = Math.floor(L * 0.72 / 4.2);
      for (let i = 0; i < bays; i++) {
        const x = L * 0.07 + i * 4.2;
        if (Math.abs(x - bx) < 4.5 || x > L * 0.84) continue;
        const tiers = o.tiers - (x > L * 0.74 ? 2 : 0);
        for (let s = 0; s < tiers; s++) M.box(x, x + 4.0, D + s * 1.8, D + (s + 1) * 1.8 - 0.05, W * 0.92, BOXC[Math.floor(r() * BOXC.length)]);
      }
      M.box(bx - 2.2, bx + 2.2, D, D + (o.tiers + 2) * 1.8, W * 0.92, "#f4f4f2");
      M.box(bx - 2.25, bx + 2.25, D + (o.tiers + 1) * 1.8, D + (o.tiers + 1.6) * 1.8, W * 0.94, GLASS);
      M.cylY(L * 0.07 + (o.funnelBack ? 0 : L * 0.05), 0, D, D + (o.tiers + 1) * 1.8, W * 0.08, o.funnel || INK);
    } else if (k === "bulk") {
      for (let x = L * 0.2; x < L * 0.86; x += L * 0.09) M.box(x, x + L * 0.065, D, D + 1.4, W * 0.62, o.hatch || "#2a6f4a");
      for (let x = L * 0.27; x < L * 0.82; x += L * 0.18) {
        M.cylY(x, -W * 0.3, D, D + W * 0.5, 0.8, "#f2c200");
        M.beam([x, D + W * 0.5], [x + L * 0.1, D + W * 0.25], 0.6, "#f2c200", -W * 0.3);
      }
      M.box(L * 0.02, L * 0.14, D, D + W * 0.75, W * 0.85, "#f4f4f2");
      M.box(L * 0.02, L * 0.14, D + W * 0.6, D + W * 0.72, W * 0.87, GLASS);
      M.cylY(L * 0.04, 0, D + W * 0.75, D + W * 0.95, W * 0.07, o.funnel || INK);
    } else if (k === "roro") {
      M.box(L * 0.01, L * 0.97, D, D + W * 0.95, W, o.hull, { ft: L * 0.05 });
      M.box(L * 0.8, L * 0.9, D + W * 0.95, D + W * 1.12, W * 0.9, "#f4f4f2");
      M.box(L * 0.8, L * 0.9, D + W * 1.02, D + W * 1.1, W * 0.92, GLASS);
      M.box(L * 0.03, L * 0.92, D + W * 0.15, D + W * 0.2, W + 0.05, o.stripe || "#2f6fed");
    }
  }

  /* ------------------------------ Flugzeug ----------------------------- */
  function plane(M, o) {
    const L = o.len, R = o.r, c = o.c, y = R + (o.gear || 1.2), span = o.span;
    /* Rumpf: Heck, Mitte, Nase */
    M.cylX(0, L * 0.28, R * 0.25, R, y + R * 0.35, 0, c, 14);
    M.cylX(L * 0.28, L * 0.86, R, R, y, 0, c, 14);
    M.cylX(L * 0.86, L, R, R * 0.2, y - R * 0.15, 0, c, 14);
    if (o.hump) M.cylX(L * 0.62, L * 0.9, R * 0.55, R * 0.55, y + R * 0.75, 0, c, 12);
    M.box(L * 0.93, L * 0.965, y + R * 0.15, y + R * 0.5, R * 0.9, GLASS, { ft: L * 0.01 });
    if (o.stripe) M.cylX(L * 0.3, L * 0.85, R * 1.01, R * 1.01, y, 0, o.stripe, 14, 0.25);
    /* Tragflächen */
    const wy = o.high ? y + R * 0.75 : y - R * 0.55, wx = L * (o.wingX || 0.42), cr = o.chord || L * 0.18;
    [1, -1].forEach(s => M.wing(wx, cr, cr * 0.35, o.sweep || 0, s * R * 0.6, s * span / 2, wy, o.dihedral || 0, R * 0.22, c));
    /* Leitwerk */
    const tTop = y + R * 0.35 + (o.fin || R * 2.4);
    M.fin(L * 0.02, L * 0.16, L * 0.07, o.finSweep ?? L * 0.06, y + R * 0.6, tTop, R * 0.08, o.tail || c);
    const hy = o.tTail ? tTop - R * 0.1 : y + R * 0.4;
    [1, -1].forEach(s => M.wing(L * 0.01, L * 0.1, L * 0.045, o.tTail ? L * 0.02 : L * 0.04, s * R * 0.1, s * span * 0.18, hy, 0, R * 0.12, c));
    /* Triebwerke */
    (o.engines || []).forEach(z => [1, -1].forEach(s => {
      const ez = s * span / 2 * z, er = o.er || R * 0.35, ex = wx + cr - (o.sweep || 0) * z + er * (o.prop ? 1.4 : 1.6);
      if (o.prop) {
        M.cylX(ex - er * 3, ex + er * 1.2, er * 0.7, er, wy - er * 0.3, ez, c, 10);
        M.cylX(ex + er * 1.2, ex + er * 1.6, er * 0.5, 0.01, wy - er * 0.3, ez, INK, 8);
        M.box(ex + er * 1.25, ex + er * 1.35, wy - er * 0.3 - er * 2.2, wy - er * 0.3 + er * 2.2, 0.15, "#4a5060", { z: ez });
      } else {
        M.cylX(ex - er * 2.6, ex + er * 0.6, er * 0.75, er, wy - er * 1.15, ez, o.eng || "#c9ced6", 12);
        M.cylX(ex + er * 0.6, ex + er * 0.65, er * 0.8, er * 0.8, wy - er * 1.15, ez, INK, 12);
        M.box(ex - er * 2.2, ex - er * 0.2, wy - er * 0.4, wy + R * 0.1, er * 0.25, o.eng || "#c9ced6", { z: ez, ft: er * 0.6 });
      }
    }));
    if (o.noseProp) {
      M.cylX(L, L * 1.03, R * 0.3, 0.01, y - R * 0.15, 0, INK, 8);
      M.box(L * 1.0, L * 1.012, y - R * 0.15 - R * 1.3, y - R * 0.15 + R * 1.3, 0.08, "#4a5060");
    }
    /* Fahrwerk */
    const gr = Math.max(0.35, R * 0.22);
    M.wheel(L * 0.88, gr, gr * 0.6, 0); M.box(L * 0.875, L * 0.885, gr, y - R * 0.6, 0.12, STEEL);
    M.wheel(wx + cr * 0.3, gr * 1.2, gr * 0.8, R * 1.0); M.box(wx + cr * 0.25, wx + cr * 0.35, gr, y - R * 0.5, R * 0.9, STEEL);
    if (o.pod) M.box(wx - cr * 0.2, wx + cr * 0.8, y - R * 1.15, y - R * 0.55, R * 0.9, c);
  }

  /* --------------------------- die 48 Modelle --------------------------- */
  const MODELS = {
    "v-messenger": (M, c) => bike(M, { frame: c || "#e2465f", bag: "#2a2f38" }),
    "v-bullitt": (M, c) => bike(M, { frame: c || "#20a97a", cargo: true, boxC: "#c9894a", boxY0: 0.4, boxY1: 0.75, boxW: 0.55 }),
    "v-urbanarrow": (M, c) => bike(M, { frame: "#2a2f38", cargo: true, boxC: "#2a2f38", boxY0: 0.28, boxY1: 0.78, boxW: 0.7, lid: c || "#f4f4f2" }),
    "v-chike": (M, c) => bike(M, { frame: "#2a2f38", cargo: true, trike: true, boxC: c || "#ff6a2b", boxY0: 0.42, boxY1: 1.1, boxW: 0.85 }),

    "v-simson": (M, c) => moped(M, { c: c || "#3a8fb7", box: "#f2a33c", simson: true }),
    "v-liberty": (M, c) => moped(M, { c: c || "#f4f4f2", box: "#e2465f" }),
    "v-kumpan": (M, c) => moped(M, { c: c || "#7fd1b9", box: "#2a2f38" }),

    "v-caddy": (M, c) => van(M, { len: 4.9, h: 1.85, w: 1.85, c: c || "#c9ced6" }),
    "v-sprinter": (M, c) => van(M, { len: 6.9, h: 2.75, w: 2.0, c: c || "#f4f4f2" }),
    "v-esprinter": (M, c) => van(M, { len: 6.9, h: 2.75, w: 2.0, c: c || "#f4f4f2", stripe: "#19b8c9" }),
    "v-crafterkuehl": (M, c) => van(M, { len: 6.8, h: 2.6, w: 2.0, c: c || "#f4f4f2", kuehl: true, stripe: "#7cc4ff" }),

    "v-daily": (M, c) => truck(M, { len: 7.2, cab: c || "#f4f4f2", bodyC: "#e9ecef", body: "box", stripe: "#2f6fed" }),
    "v-atego": (M, c) => truck(M, { len: 8.6, cab: c || "#c9ced6", bodyC: "#f4f4f2", body: "reefer", stripe: "#7cc4ff" }),
    "v-tgm": (M, c) => truck(M, { len: 9.5, cab: c || "#f4f4f2", bodyC: "#2f6fed", body: "swap", stripe: "#f2c200" }),
    "v-eurocargo": (M, c) => truck(M, { len: 8.4, cab: c || "#f4f4f2", bodyC: "#d6dbe2", body: "tank" }),

    "v-scania": (M, c) => semi(M, { tc: c || "#a3213b", trailer: "box", trC: "#f4f4f2", stripe: "#a3213b" }),
    "v-actros": (M, c) => semi(M, { tc: c || "#2a2f38", trailer: "box", trC: "#d6dbe2" }),
    "v-volvofhe": (M, c) => semi(M, { tc: c || "#1b4fc4", trailer: "box", trC: "#f4f4f2", stripe: "#9bd13a", cabStripe: "#9bd13a" }),
    "v-dafreefer": (M, c) => semi(M, { tc: c || "#f4f4f2", trailer: "reefer", trC: "#f4f4f2", stripe: "#7cc4ff", cabStripe: "#e2465f" }),
    "v-manadr": (M, c) => semi(M, { tc: c || "#f4f4f2", trailer: "tank", trC: "#d6dbe2", cabStripe: "#e2465f" }),
    "v-chassis": (M, c) => semi(M, { tc: c || "#2f6fed", trailer: "container", trC: "#20a97a", lowCab: true }),
    "v-tieflader": (M, c) => semi(M, { tc: c || "#f4f4f2", trailer: "lowbed", trC: "#2a2f38", tri: true }),
    "v-volvoheavy": (M, c) => semi(M, { tc: c || "#f2a33c", trailer: "heavy", trC: "#6b7480", tri: true, cabStripe: "#2a2f38" }),
    "v-goldhofer": M => goldhofer(M),

    "v-spits": () => 0, /* Platzhalter, unten gesetzt */
    "v-br185": (M, c) => train(M, { c: c || "#c8102e", wagon: "container", seed: 3 }),
    "v-ludmilla": (M, c) => train(M, { c: c || "#c8102e", wagon: "hopper", hood: true, seed: 5 }),
    "v-vectron": (M, c) => train(M, { c: c || "#2f6fed", wagon: "pocket", stripe: "#f2c200", seed: 7 }),
    "v-silkroad": (M, c) => train(M, { c: c || "#17805c", wagon: "container", stripe: "#f2c200", n: 3, seed: 11 }),

    "v-feeder": (M, c) => ship(M, { len: 150, w: 23, d: 10, kind: "container", tiers: 3, hull: c || "#2f6fed", bridgeAt: 0.12 }),
    "v-supramax": (M, c) => ship(M, { len: 190, w: 32, d: 14, kind: "bulk", hull: c || "#2a2f38", hatch: "#a3213b" }),
    "v-panamax": (M, c) => ship(M, { len: 290, w: 32, d: 16, kind: "container", tiers: 5, hull: c || "#17805c", bridgeAt: 0.2 }),
    "v-roro": (M, c) => ship(M, { len: 200, w: 32, d: 9, kind: "roro", hull: c || "#f4f4f2", bottom: "#2a2f38", stripe: "#1b4fc4" }),
    "v-triplee": (M, c) => ship(M, { len: 400, w: 59, d: 20, kind: "container", tiers: 7, hull: c || "#0d3b66", bottom: "#42b0d5", bridgeAt: 0.3, funnel: "#42b0d5" }),
    "v-capesize": (M, c) => ship(M, { len: 290, w: 45, d: 18, kind: "bulk", hull: c || "#0d1b2a", hatch: "#6b7480" }),
    "v-hmm": (M, c) => ship(M, { len: 400, w: 61, d: 21, kind: "container", tiers: 7, hull: c || "#e0662d", bottom: "#2a2f38", bridgeAt: 0.28 }),

    "v-caravan": (M, c) => plane(M, { len: 12.7, r: 0.85, span: 15.9, high: true, noseProp: true, c: c || "#f4f4f2", stripe: "#e2465f", gear: 0.9, chord: 1.9, wingX: 0.45, fin: 2.4, finSweep: 0.9 }),
    "v-atr": (M, c) => plane(M, { len: 27, r: 1.4, span: 27, high: true, prop: true, engines: [0.33], er: 0.55, c: c || "#f4f4f2", stripe: "#2f6fed", tTail: true, gear: 1.0, chord: 2.6, fin: 4.2, pod: true }),
    "v-737": (M, c) => plane(M, { len: 39.5, r: 1.9, span: 35.8, engines: [0.33], er: 0.95, c: c || "#f4f4f2", tail: "#f2a33c", stripe: "#f2a33c", sweep: 5.5, dihedral: 1.2, chord: 6.5, fin: 6.5, finSweep: 4 }),
    "v-a330f": (M, c) => plane(M, { len: 58.8, r: 2.8, span: 60.3, engines: [0.34], er: 1.45, c: c || "#f4f4f2", tail: "#1b4fc4", stripe: "#1b4fc4", sweep: 10, dihedral: 2, chord: 9.5, fin: 9, finSweep: 6, pod: true }),
    "v-777f": (M, c) => plane(M, { len: 63.7, r: 3.1, span: 64.8, engines: [0.32], er: 1.9, c: c || "#f4f4f2", tail: "#20a97a", stripe: "#20a97a", sweep: 11, dihedral: 2, chord: 10.5, fin: 10, finSweep: 6.5 }),
    "v-7478f": (M, c) => plane(M, { len: 76.3, r: 3.2, span: 68.4, engines: [0.4, 0.72], er: 1.3, c: c || "#f4f4f2", tail: "#a3213b", stripe: "#a3213b", hump: true, sweep: 13, dihedral: 2, chord: 13, fin: 11, finSweep: 8 }),
    "v-an124": (M, c) => plane(M, { len: 69, r: 3.6, span: 73.3, high: true, engines: [0.35, 0.62], er: 1.3, c: c || "#d6dbe2", tail: "#2f6fed", stripe: "#2f6fed", sweep: 9, dihedral: -2.5, chord: 12, fin: 11, finSweep: 6, pod: true, gear: 0.6 })
  };
  MODELS["v-spits"] = (M, c) => barge(M, { len: 39, w: 5.05, d: 2.2, kind: "bulk", hull: c || "#1b3f6b", cover: "#2a6f4a" });
  MODELS["v-kempenaar"] = (M, c) => barge(M, { len: 55, w: 7.2, d: 2.6, kind: "bulk", hull: c || "#2a2f38", cover: "#a3213b" });
  MODELS["v-gms"] = (M, c) => barge(M, { len: 85, w: 9.5, d: 3.0, kind: "container", tiers: 2, hull: c || "#0d3b66", tall: 1.5 });
  MODELS["v-tms"] = (M, c) => barge(M, { len: 110, w: 11.4, d: 3.2, kind: "tank", hull: c || "#a3213b" });
  MODELS["v-gross"] = (M, c) => barge(M, { len: 135, w: 11.4, d: 3.4, kind: "container", tiers: 3, hull: c || "#2a2f38", tall: 3 });
  MODELS["v-koppel"] = (M, c) => {
    barge(M, { len: 76, w: 11.4, d: 3.0, kind: "bulk", hull: "#3a3f48", cover: "#6b7480", house: false });
    const seen = new Set();
    M.F.forEach(f => f.pts.forEach(p => { if (!seen.has(p)) { seen.add(p); p[0] += 37; } }));
    barge(M, { len: 37, w: 11.4, d: 3.2, kind: "none", hull: c || "#f2a33c", tall: 4 });
  };

  /* Sonderfahrzeuge: Unimog-Holzlaster (Erbhof) und goldener T1 (Luckybox) */
  MODELS["v-holzlaster"] = (M, c) => {
    const k = c || "#e0a800";
    M.box(0.3, 5.2, 0.75, 1.05, 1.0, INK);
    M.wheel(1.0, 0.55, 0.38, 1.6); M.wheel(4.3, 0.55, 0.38, 1.6);
    M.box(3.3, 5.3, 1.05, 1.75, 2.0, k, { ft: 0.25 });
    M.box(5.05, 5.32, 1.15, 1.6, 1.2, INK);
    M.box(3.3, 4.3, 1.75, 2.75, 2.0, k, { ft: 0.15 });
    M.box(3.95, 4.18, 1.95, 2.6, 1.9, GLASS, { ft: 0.12 });
    M.box(3.45, 3.95, 1.95, 2.6, 2.02, GLASS);
    M.box(0.1, 3.2, 1.05, 1.5, 2.1, "#7a4a2a");
    [-0.6, 0, 0.6].forEach((z, i) => M.cylX(0.0, 3.25, 0.28, 0.28, 1.8 + (i === 1 ? 0.15 : 0), z, "#a0703f", 8));
    [-0.3, 0.3].forEach(z => M.cylX(0.1, 3.15, 0.27, 0.27, 2.3, z, "#b9824a", 8));
    M.box(0.05, 0.15, 1.5, 2.6, 2.1, INK); M.box(3.1, 3.2, 1.5, 2.6, 2.1, INK);
  };
  MODELS["v-goldbulli"] = (M, c) => {
    const k = c || "#d4a017", L = 4.3, W = 1.75;
    M.wheel(0.75, 0.33, 0.2, W - 0.15); M.wheel(L - 0.8, 0.33, 0.2, W - 0.15);
    M.box(0.0, L, 0.32, 1.15, W, k, { ft: 0.05, bt: 0.1, fb: 0.15, bb: 0.15 });
    M.box(0.15, L - 0.05, 1.15, 1.95, W, "#f4f4f2", { ft: 0.25, bt: 0.2, zt: 0.08 });
    M.box(0.4, L - 0.6, 1.3, 1.75, W - 0.12, GLASS);
    M.box(L - 0.32, L - 0.12, 1.25, 1.75, W - 0.4, GLASS, { ft: 0.12 });
    M.box(0.6, L - 1.0, 1.95, 2.05, W - 0.5, GLASS);
    M.box(L - 0.12, L + 0.04, 0.35, 1.15, 0.9, "#f4f4f2", { ft: 0.06 });
    M.box(L - 0.05, L + 0.06, 0.25, 0.4, W, CHROME); M.box(-0.06, 0.05, 0.25, 0.4, W, CHROME);
    M.box(L - 0.06, L + 0.02, 0.75, 0.9, W - 0.2, LIGHT);
  };

  /* --------------------------- Rendern (2D) ---------------------------- */
  const YAW = -0.62, PITCH = 0.42, LDIR = (() => { const l = [-0.35, 0.85, 0.55], n = Math.hypot(...l); return l.map(v => v / n); })();
  const cy = Math.cos(YAW), sy = Math.sin(YAW), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  const rot = p => { const x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy, y = p[1]; return [x, y * cp - z * sp, y * sp + z * cp]; };
  function rgb(h) {
    h = String(h).replace("#", "");
    if (h.length === 3) h = h.split("").map(x => x + x).join("");
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a];
  }
  function render(id, color, W = 168, H = 112) {
    const fn = MODELS[id];
    if (!fn) return null;
    const M = builder();
    fn(M, color);
    const faces = [];
    M.F.forEach(f => {
      const p = f.pts.map(rot), n = newell(p), l = Math.hypot(n[0], n[1], n[2]);
      if (n[2] <= 1e-9 * l || l < 1e-9) return;
      const nn = [n[0] / l, n[1] / l, n[2] / l];
      const z = p.reduce((a, v) => a + v[2], 0) / p.length;
      const zmax = Math.max(...p.map(v => v[2]));
      faces.push({ p, nn, z: z * 0.7 + zmax * 0.3, c: f.c });
    });
    if (!faces.length) return null;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    faces.forEach(f => f.p.forEach(v => { x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); }));
    const pad = W * 0.06, s = Math.min((W - pad * 2) / (x1 - x0 || 1), (H - pad * 2.4) / (y1 - y0 || 1));
    const ox = (W - (x1 - x0) * s) / 2 - x0 * s, oy = (H - (y1 - y0) * s) / 2 - pad * 0.3;
    const sx = v => ox + v[0] * s, syf = v => oy + (y1 - v[1]) * s;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    if (!g) return null;
    /* weicher Bodenschatten */
    const gx = W / 2, gy = syf([0, y0, 0]) + 2;
    const grd = g.createRadialGradient(gx, gy, 2, gx, gy, (x1 - x0) * s * 0.5);
    grd.addColorStop(0, "rgba(20,30,50,.28)"); grd.addColorStop(1, "rgba(20,30,50,0)");
    g.save(); g.translate(gx, gy); g.scale(1, 0.16); g.translate(-gx, -gy);
    g.fillStyle = grd; g.beginPath(); g.arc(gx, gy, (x1 - x0) * s * 0.5, 0, Math.PI * 2); g.fill(); g.restore();
    faces.sort((a, b) => a.z - b.z);
    g.lineJoin = "round";
    faces.forEach(f => {
      const [r, gg, b, a] = rgb(f.c);
      const d = Math.max(0, f.nn[0] * LDIR[0] + f.nn[1] * LDIR[1] + f.nn[2] * LDIR[2]);
      const k = 0.52 + 0.55 * d;
      const col = `rgba(${Math.min(255, r * k) | 0},${Math.min(255, gg * k) | 0},${Math.min(255, b * k) | 0},${a})`;
      g.beginPath();
      f.p.forEach((v, i) => i ? g.lineTo(sx(v), syf(v)) : g.moveTo(sx(v), syf(v)));
      g.closePath();
      g.fillStyle = col; g.fill();
      g.strokeStyle = col; g.lineWidth = 0.6; g.stroke();
      g.strokeStyle = "rgba(20,24,34,.38)"; g.lineWidth = 0.7; g.stroke();
    });
    return cv.toDataURL("image/png");
  }

  const cache = new Map();
  function url(id, color) {
    const key = id + "|" + (color || "");
    if (!cache.has(key)) {
      let u = null;
      try { u = render(id, color); } catch (e) { console.warn("vehicon", id, e); }
      cache.set(key, u);
    }
    return cache.get(key);
  }
  return { url, has: id => !!MODELS[id], ids: () => Object.keys(MODELS) };
})();

/* Icon für ein Fahrzeug (Typ t), optional in Firmenfarbe; ohne Modell das alte Emoji */
function vehIconHTML(t, color, cls) {
  if (!t) return "";
  const u = typeof document !== "undefined" && VEH3D.has(t.id) ? VEH3D.url(t.id, color) : null;
  return u ? `<img class="v3d${cls ? " " + cls : ""}" src="${u}" alt="${String(t.icon || "").replace(/"/g, "")}" draggable="false">` : (t.icon || "");
}
