/* =========================================================================
   LOGISTIKA – vehmodels.js (v248)
   3D-Modelle aller Fahrzeuge im Stil der Hofmodelle (FM.MB, gl3d.js) –
   als Bildchen gerendert über dasselbe System wie Silo- und Ladenwaren
   (thumbSpan / thumbOf in worldview.js: Sonne, weiche Schatten, Kontur).
   Vorn ist +z, die Breite liegt auf x, Maße grob in Metern; am Ende wird
   jedes Modell auf eine einheitliche Länge skaliert.
   ========================================================================= */
"use strict";

const VM = (() => {
  const PI = Math.PI;
  const K = {
    ink: 0x2a2a2e, tire: 0x1d1d20, steel: 0x9aa6af, steelD: 0x6f7a84, chrome: 0xd8dde2, glass: 0x8fc4dc, glassD: 0x5f8fae,
    light: 0xfff5c8, rear: 0xd9413a, white: 0xf6f6f2, grey: 0xc9ced6, wood: 0xb57d48, woodL: 0xcf9a62, orange: 0xf08a24, yellow: 0xf2c230
  };
  const BOXC = [0xd9415a, 0x3f78c8, 0x3f9a5a, 0xf08a24, 0x7c5cff, 0x2fb3c4, 0xc9ced6, 0xa83526, 0xf2c230, 0x2e7a50];
  let seed = 1;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  /* --------------------------- kleine Helfer --------------------------- */
  function wheel(b, r, w, x, z, hub) {
    b.at({ x, y: r, z }, () => {
      b.cyl(r, r, w, 12, K.tire, { rz: PI / 2, x: w / 2, top: 0x55555c });
      b.cyl(r * 0.5, r * 0.5, w + 0.02, 8, hub || 0xd8d8d8, { rz: PI / 2, x: (w + 0.02) / 2 });
    });
  }
  const axle = (b, r, w, track, z, hub) => { wheel(b, r, w, -track / 2, z, hub); wheel(b, r, w, track / 2, z, hub); };
  /* Zylinder entlang z, ab z nach vorn */
  const cylZ = (b, r1, r2, len, c, o) => b.cyl(r1, r2, len, o && o.seg || 14, c, Object.assign({ rx: PI / 2, smooth: true }, o));
  /* Stab zwischen zwei Punkten (y, z) in der Ebene x = const */
  function bar(b, x, p, q, t, c) {
    const dy = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dy, dz);
    b.box(t, l, t, c, { x, y: p[0], z: p[1], rx: Math.atan2(dz, dy) });
  }
  /* Spitzer Bug: über Eck gestellter Quader */
  const bow = (b, w, h, z, c, y) => b.box(w / Math.SQRT2, h, w / Math.SQRT2, c, { ry: PI / 4, z, y: y || 0 });

  /* ------------------------------- Räder ------------------------------- */
  function bike(b, o) {
    const fr = o.frame;
    wheel(b, 0.34, 0.05, -0.025, -0.55);
    if (o.trike) axle(b, 0.25, 0.07, 0.8, 1.15); else wheel(b, o.cargo ? 0.25 : 0.34, 0.05, -0.025, o.cargo ? 1.2 : 0.5);
    bar(b, 0, [0.34, -0.55], [0.3, -0.1], 0.05, fr);
    bar(b, 0, [0.3, -0.1], [0.95, -0.2], 0.06, fr);
    bar(b, 0, [0.34, -0.55], [0.92, -0.2], 0.04, fr);
    bar(b, 0, [0.3, -0.1], [0.95, 0.35], 0.06, fr);
    bar(b, 0, [0.95, -0.2], [0.98, 0.3], 0.05, fr);
    b.box(0.16, 0.06, 0.26, K.ink, { y: 0.96, z: -0.22 });
    bar(b, 0, [0.95, 0.35], [1.15, 0.3], 0.05, K.ink);
    b.box(0.55, 0.04, 0.04, K.ink, { y: 1.15, z: 0.3 });
    if (o.cargo) {
      b.box(0.08, 0.06, 1.0, fr, { y: 0.28, z: 0.25 });
      if (!o.trike) bar(b, 0, [0.6, 0.95], [0.25, 1.2], 0.04, fr);
      b.noise(0.06, () => b.box(o.boxW || 0.6, o.boxH || 0.42, 0.75, o.boxC, { y: o.boxY || 0.36, z: 0.7 }));
      if (o.lid) b.box(0.58, 0.46, 0.66, o.lid, { y: (o.boxY || 0.36) + (o.boxH || 0.42), z: 0.7, top: 0xffffff });
    } else {
      b.box(0.24, 0.04, 0.4, K.ink, { y: 0.62, z: -0.5 });
      b.noise(0.08, () => b.box(0.34, 0.3, 0.42, o.bag, { y: 0.66, z: -0.5 }));
      b.box(0.36, 0.05, 0.12, 0x1a1a1e, { y: 0.96, z: -0.5 });
    }
  }
  function moped(b, o) {
    const c = o.c;
    wheel(b, 0.28, 0.1, -0.05, -0.62); wheel(b, 0.28, 0.1, -0.05, 0.62);
    if (o.simson) {
      bar(b, 0, [0.35, -0.5], [0.95, 0.4], 0.08, K.ink);
      b.box(0.3, 0.22, 0.42, c, { y: 0.74, z: 0.2, rx: -0.15 });
      b.box(0.26, 0.08, 0.55, K.ink, { y: 0.86, z: -0.25 });
      b.box(0.36, 0.3, 0.4, c, { y: 0.35, z: -0.3 });
      b.box(0.22, 0.18, 0.3, K.steel, { y: 0.28, z: 0.05 });
    } else {
      b.box(0.36, 0.1, 0.6, c, { y: 0.24, z: 0.05 });
      b.box(0.42, 0.42, 0.68, c, { y: 0.34, z: -0.3, top: c });
      b.box(0.3, 0.08, 0.5, K.ink, { y: 0.76, z: -0.3 });
      b.box(0.42, 0.68, 0.14, c, { y: 0.3, z: 0.42, rx: -0.2 });
    }
    bar(b, 0, [1.02, 0.5], [0.28, 0.62], 0.06, K.steel);
    b.box(0.62, 0.05, 0.05, K.ink, { y: 1.04, z: 0.5 });
    b.sphere(0.07, 8, 6, K.light, { y: 0.92, z: 0.6, smooth: true });
    b.box(0.4, 0.36, 0.42, o.box, { y: 0.84, z: -0.62 });
    b.box(0.41, 0.06, 0.43, 0x00000000 | (o.boxD || 0xb83420), { y: 1.2, z: -0.62 });
  }

  /* ----------------------------- Straße ------------------------------- */
  function van(b, o) {
    const L = o.len, H = o.h, W = o.w, c = o.c, zf = L / 2;
    axle(b, 0.34, 0.24, W - 0.24, zf - 1.0); axle(b, 0.34, 0.24, W - 0.24, -zf + 0.95);
    b.box(W, H - 0.36, L - 1.2, c, { y: 0.36, z: -0.6 });
    b.box(W, 0.72, 1.2, c, { y: 0.36, z: zf - 0.6 });
    b.box(W - 0.02, H - 1.1, 0.75, c, { y: 1.08, z: zf - 1.05 - 0.02 });
    b.box(W - 0.12, (H - 1.1) * 0.85, 0.06, K.glass, { y: 1.1, z: zf - 0.62, rx: -0.55 });
    [-1, 1].forEach(s => b.box(0.03, (H - 1.1) * 0.6, 0.55, K.glass, { x: s * W / 2, y: 1.2, z: zf - 1.05 }));
    if (o.stripe != null) b.box(W + 0.02, 0.16, L - 1.25, o.stripe, { y: 0.62, z: -0.6 });
    b.box(W, 0.14, 0.08, 0x55555c, { y: 0.32, z: zf + 0.02 });
    [-1, 1].forEach(s => b.box(0.24, 0.12, 0.04, K.light, { x: s * (W / 2 - 0.25), y: 0.82, z: zf + 0.01 }));
    if (o.kuehl) b.box(W * 0.6, 0.3, 0.5, K.grey, { y: H, z: zf - 1.6 });
  }
  /* Frontlenker-Fahrerhaus, Front bei z = zf */
  function cab(b, zf, len, y0, h, w, c, o = {}) {
    b.box(w, h, len, c, { y: y0, z: zf - len / 2, top: o.top != null ? o.top : c });
    b.box(w - 0.24, h * 0.36, 0.06, K.glass, { y: y0 + h * 0.52, z: zf + 0.02 });
    [-1, 1].forEach(s => b.box(0.04, h * 0.32, len * 0.42, K.glass, { x: s * w / 2, y: y0 + h * 0.54, z: zf - len * 0.28 }));
    b.box(w * 0.6, h * 0.24, 0.06, 0x3a3a40, { y: y0 + h * 0.14, z: zf + 0.02 });
    [-1, 1].forEach(s => b.box(0.32, 0.16, 0.05, K.light, { x: s * (w / 2 - 0.3), y: y0 + 0.12, z: zf + 0.02 }));
    b.box(w, 0.28, 0.14, 0x3a3a40, { y: y0 - 0.22, z: zf + 0.02 });
    if (o.spoiler) b.box(w - 0.2, o.spoiler, len * 0.8, c, { y: y0 + h, z: zf - len * 0.55, rx: 0.12 });
    if (o.stripe != null) b.box(w + 0.02, h * 0.1, len + 0.02, o.stripe, { y: y0 + h * 0.36, z: zf - len / 2 });
  }
  function truck(b, o) {
    const L = o.len, zf = L / 2, W = 2.5;
    b.box(1.0, 0.36, L - 0.4, K.ink, { y: 0.55, z: 0 });
    axle(b, 0.5, 0.36, 2.0, zf - 1.45); axle(b, 0.5, 0.36, 2.0, -zf + 1.3); if (o.axle3) axle(b, 0.5, 0.36, 2.0, -zf + 2.4);
    cab(b, zf, 2.1, 0.75, 2.35, W, o.cab, { stripe: o.cabStripe });
    const bl = L - 2.35, bz = -zf + bl / 2;
    if (o.body === "tank") {
      cylZ(b, 1.0, 1.0, bl - 0.4, o.bodyC, { y: 2.0, z: -zf + 0.2 });
      b.sphere(1.0, 12, 8, o.bodyC, { y: 2.0, z: -zf + 0.2, sz: 0.25, smooth: true });
      b.box(2.06, 0.3, bl - 0.6, K.orange, { y: 1.85, z: bz });
      [0.3, 0.65].forEach(t => b.cyl(0.25, 0.25, 0.2, 10, K.steel, { y: 2.95, z: -zf + bl * t }));
    } else {
      b.noise(0.03, () => b.box(W, 2.7, bl, o.bodyC, { y: 0.95, z: bz }));
      if (o.stripe != null) b.box(W + 0.02, 0.3, bl - 0.1, o.stripe, { y: 2.2, z: bz });
      if (o.body === "reefer") b.box(1.5, 0.8, 0.3, K.grey, { y: 2.7, z: -zf + bl + 0.12 });
      if (o.body === "swap") b.box(W + 0.04, 0.1, bl, K.steel, { y: 0.9, z: bz });
    }
  }
  /* Sattelzug: Zugmaschine vorn, Auflieger dahinter */
  function semi(b, o) {
    const T = 13.6, W = 2.55, zt = -T / 2 - 1.5, zf = zt + T + 5.0;
    b.box(1.1, 0.42, 6.0, K.ink, { y: 0.6, z: zf - 3.2 });
    axle(b, 0.52, 0.4, 2.0, zf - 1.3); axle(b, 0.52, 0.4, 2.0, zf - 4.6); if (o.tri) axle(b, 0.52, 0.4, 2.0, zf - 5.8);
    cab(b, zf, 2.4, 0.95, o.lowCab ? 2.4 : 2.9, W, o.tc, { spoiler: o.lowCab ? 0 : 0.45, stripe: o.cabStripe });
    b.box(W - 0.3, 0.5, 1.2, K.steel, { y: 0.6, z: zf - 3.3 });
    const t = o.trailer, tc = o.trC, zc = zt + T / 2;
    if (t === "box" || t === "reefer") {
      b.noise(0.03, () => b.box(W, 2.75, T, tc, { y: 1.25, z: zc }));
      b.box(1.4, 0.22, T - 0.4, K.ink, { y: 1.03, z: zc });
      if (o.stripe != null) b.box(W + 0.02, 0.35, T - 0.2, o.stripe, { y: 2.0, z: zc });
      if (t === "reefer") b.box(1.8, 1.2, 0.35, K.grey, { y: 2.5, z: zt + T + 0.15 });
    } else if (t === "tank") {
      b.box(1.3, 0.25, T - 1, K.ink, { y: 1.05, z: zc });
      cylZ(b, 1.2, 1.2, T - 1.0, tc, { y: 2.45, z: zt + 0.5 });
      [zt + 0.5, zt + T - 0.5].forEach((z, i) => b.sphere(1.2, 12, 8, tc, { y: 2.45, z, sz: 0.3, smooth: true }));
      b.box(0.6, 0.12, T - 2, K.steel, { y: 3.62, z: zc });
      b.box(2.44, 0.32, T - 1.2, K.orange, { y: 2.2, z: zc });
    } else if (t === "container") {
      b.box(W - 0.3, 0.25, T - 0.6, K.ink, { y: 1.05, z: zc });
      b.noise(0.04, () => b.box(W, 2.6, 12.2, tc, { y: 1.3, z: zc - 0.3 }));
      for (let z = zc - 6; z < zc + 5.6; z += 0.9) b.box(W + 0.04, 2.5, 0.12, (tc & 0xfefefe) >> 1 | 0x101010, { y: 1.35, z });
    } else {
      b.box(W, 0.4, T - 2.5, K.ink, { y: 0.65, z: zt + (T - 2.5) / 2 });
      b.box(W, 0.45, 2.8, K.ink, { y: 1.05, z: zt + T - 1.1 });
      if (t === "lowbed") {
        b.box(2.4, 0.9, 6.0, K.yellow, { y: 1.05, z: zt + 4.8 });
        b.box(2.0, 1.6, 2.1, K.yellow, { y: 1.95, z: zt + 6.5 });
        b.box(1.9, 0.8, 1.0, K.glass, { y: 2.6, z: zt + 7.1 });
        bar(b, 0, [2.6, zt + 5.5], [3.6, zt + 1.0], 0.35, 0xe0a800);
        bar(b, 0, [3.6, zt + 1.0], [1.3, zt + 0.2], 0.3, 0xe0a800);
        b.box(1.1, 0.5, 0.8, K.steel, { y: 1.05, z: zt + 0.4 });
      } else {
        b.noise(0.04, () => b.box(2.9, 3.1, 7.0, tc, { y: 1.05, z: zt + 5.0 }));
        for (let z = zt + 2.2; z < zt + 8; z += 1.2) b.box(3.0, 2.8, 0.35, 0x6b7480, { y: 1.2, z });
        [zt + 3.5, zt + 6.5].forEach(z => b.cyl(0.35, 0.3, 0.7, 10, K.chrome, { y: 4.15, z }));
      }
    }
    if (t !== "lowbed" && t !== "heavy") [1.3, 2.6, 3.9].forEach(z => axle(b, 0.5, 0.4, 2.0, zt + z));
    else for (let z = 0.6; z < 5.0; z += 1.05) axle(b, 0.42, 0.35, 2.1, zt + z);
  }
  function goldhofer(b) {
    const W = 3.0;
    b.box(W, 0.45, 16.5, K.orange, { y: 0.75, z: -1.75 });
    for (let z = -9.7; z < 6.3; z += 1.1) axle(b, 0.38, 0.3, 2.5, z);
    cylZ(b, 2.0, 2.0, 13, 0xd8dde2, { y: 3.35, z: -8.5 });
    [-8.5, 4.5].forEach(z => b.sphere(2.0, 14, 9, 0xd8dde2, { y: 3.35, z, sz: 0.35, smooth: true }));
    [-6.9, 2.9].forEach(z => b.box(2.4, 1.0, 0.6, K.ink, { y: 1.2, z }));
    b.box(1.2, 0.5, 6.0, K.ink, { y: 0.6, z: 9.5 });
    axle(b, 0.55, 0.42, 2.1, 7.4); axle(b, 0.55, 0.42, 2.1, 8.6); axle(b, 0.55, 0.42, 2.1, 11.2);
    cab(b, 12.8, 2.6, 1.0, 2.7, 2.55, 0x3f78c8, { stripe: K.yellow });
    b.box(2.4, 1.3, 1.0, K.ink, { y: 1.1, z: 9.5 });
  }

  /* --------------------------- Binnenschiff ---------------------------- */
  function hull(b, L, W, D, c, z0, rim) {
    b.noise(0.03, () => {
      b.box(W, D, L - W * 0.7, c, { z: z0 + (L - W * 0.7) / 2 });
      bow(b, W, D, z0 + L - W * 0.7, c);
    });
    if (rim != null) b.box(W + 0.04, D * 0.12, L - W * 0.7, rim, { y: D * 0.12, z: z0 + (L - W * 0.7) / 2 });
  }
  function barge(b, o) {
    const L = o.len, W = o.w, D = o.d || 2.6, z0 = -L / 2;
    hull(b, L, W, D, o.hull, z0, 0xc0392b);
    const h0 = z0 + L * 0.18, h1 = z0 + L * 0.84;
    if (o.kind === "bulk") {
      b.box(W * 0.84, 0.25, h1 - h0, 0x55555c, { y: D, z: (h0 + h1) / 2 });
      b.noise(0.04, () => b.roof(h1 - h0, W * 0.82, 1.0, o.cover, { y: D + 0.25, z: (h0 + h1) / 2, ry: PI / 2, gable: o.cover }));
    } else if (o.kind === "container") {
      seed = L | 0;
      const cl = 6.1, rows = Math.floor((h1 - h0) / cl);
      for (let i = 0; i < rows; i++) for (let s = 0; s < (o.tiers || 2); s++)
        b.box(W * 0.86, 2.5, cl - 0.15, BOXC[Math.floor(rnd() * BOXC.length)], { y: D + s * 2.55, z: h0 + i * cl + cl / 2 });
    } else if (o.kind === "tank") {
      b.box(W * 0.85, 0.6, h1 - h0, 0xc0392b, { y: D, z: (h0 + h1) / 2 });
      [-1, 1].forEach(s => cylZ(b, 0.35, 0.35, h1 - h0 - 2, K.steel, { x: s * W * 0.2, y: D + 0.9, z: h0 + 1, seg: 8 }));
      for (let z = h0 + 6; z < h1 - 3; z += 14) b.box(1.5, 1.6, 1.5, K.chrome, { y: D + 0.6, z });
    }
    if (o.house !== false) {
      const t = o.tall || 0, hz = z0 + L * 0.09;
      b.box(W * 0.82, 2.4, L * 0.15, K.white, { y: D, z: hz });
      b.box(W * 0.6, 2.2 + t, L * 0.1, K.white, { y: D + 2.4, z: hz, top: 0x55555c });
      b.box(W * 0.62, 0.8, L * 0.1 + 0.04, K.glassD, { y: D + 3.4 + t * 0.9, z: hz });
    }
  }

  /* ------------------------------ Schiene ------------------------------ */
  function loco(b, z0, o) {
    const L = 19, c = o.c, zc = z0 + L / 2;
    b.box(2.6, 0.45, L - 3, K.ink, { y: 0.9, z: zc });
    [2.5, 4.4, L - 4.4, L - 2.5].forEach(z => axle(b, 0.55, 0.25, 1.5, z0 + z, K.steel));
    if (o.hood) {
      b.box(3.0, 0.3, L - 1, K.ink, { y: 1.3, z: zc });
      b.box(2.4, 2.0, 11.5, c, { y: 1.6, z: z0 + 6.75 });
      b.box(3.0, 2.7, 3.0, c, { y: 1.6, z: z0 + 14 });
      b.box(2.6, 1.8, 3.0, c, { y: 1.6, z: z0 + 17 });
      b.box(3.02, 0.7, 2.8, K.glass, { y: 3.3, z: z0 + 14 });
      b.box(2.62, 0.2, L - 1.6, K.white, { y: 2.0, z: zc });
    } else {
      b.noise(0.03, () => b.box(3.0, 2.9, L - 1.4, c, { y: 1.3, z: zc }));
      [-1, 1].forEach(s => {
        b.box(2.8, 0.8, 0.06, K.glass, { y: 3.05, z: zc + s * (L / 2 - 0.68), rx: s * -0.25 });
        b.box(3.02, 0.75, 1.2, K.glass, { y: 3.05, z: zc + s * (L / 2 - 1.7) });
      });
      if (o.stripe != null) b.box(3.02, 0.35, L - 1.5, o.stripe, { y: 1.65, z: zc });
      b.box(1.6, 0.3, 7, K.steel, { y: 4.2, z: zc });
      bar(b, 0, [4.5, zc + 1], [5.6, zc + 2.5], 0.08, K.ink);
      bar(b, 0, [5.6, zc + 2.5], [5.7, zc + 0.5], 0.08, K.ink);
      [-1, 1].forEach(s => b.box(0.3, 0.18, 0.05, K.light, { x: s * 0.9, y: 1.7, z: z0 + L - 0.68 }));
    }
  }
  function wagon(b, z0, kind) {
    const L = 15, zc = z0 + L / 2;
    b.box(2.7, 0.35, L - 0.6, K.ink, { y: 0.95, z: zc });
    [2.0, 3.8, L - 3.8, L - 2.0].forEach(z => axle(b, 0.48, 0.22, 1.5, z0 + z, K.steel));
    const a = BOXC[Math.floor(rnd() * BOXC.length)], c2 = BOXC[Math.floor(rnd() * BOXC.length)];
    if (kind === "container") {
      b.noise(0.04, () => { b.box(2.45, 2.6, 6.7, a, { y: 1.3, z: z0 + 3.95 }); b.box(2.45, 2.6, 6.7, c2, { y: 1.3, z: z0 + L - 3.95 }); });
    } else if (kind === "pocket") {
      b.noise(0.03, () => b.box(2.55, 2.8, L - 1.6, K.white, { y: 1.3, z: zc }));
      b.box(2.57, 0.4, L - 1.8, a, { y: 2.2, z: zc });
    } else {
      b.noise(0.05, () => b.box(2.9, 2.5, L - 1.2, 0x7a4a2a, { y: 1.3, z: zc }));
      b.box(2.5, 0.2, L - 2, 0x3a3330, { y: 3.65, z: zc });
    }
  }
  function train(b, o) {
    seed = o.seed || 1;
    const n = o.n || 2, z0 = -(n * 15.4 + 19) / 2;
    for (let i = 0; i < n; i++) wagon(b, z0 + i * 15.4, o.wagon);
    loco(b, z0 + n * 15.4 + 0.2, o);
  }

  /* ----------------------------- Seeschiff ----------------------------- */
  function ship(b, o) {
    const L = o.len, W = o.w, D = o.d, z0 = -L / 2;
    hull(b, L, W * 0.97, D * 0.45, o.bottom != null ? o.bottom : 0xa83526, z0);
    b.at({ y: D * 0.45 }, () => hull(b, L, W, D * 0.55, o.hull, z0));
    seed = L | 0;
    if (o.kind === "container") {
      const bz = z0 + L * (o.bridgeAt || 0.18), bays = Math.floor(L * 0.7 / 6.4);
      for (let i = 0; i < bays; i++) {
        const z = z0 + L * 0.07 + i * 6.4 + 3.1;
        if (Math.abs(z - bz) < 6) continue;
        const tiers = o.tiers - (z > z0 + L * 0.7 ? 2 : 0);
        for (let s = 0; s < tiers; s++) b.box(W * 0.92, 2.5, 6.1, BOXC[Math.floor(rnd() * BOXC.length)], { y: D + s * 2.55, z });
      }
      const top = D + (o.tiers + 2) * 2.55;
      b.box(W * 0.92, top - D, 5, K.white, { y: D, z: bz });
      b.box(W * 0.94, 1.6, 5.04, K.glassD, { y: top - 2.4, z: bz });
      b.cyl(W * 0.07, W * 0.07, (o.tiers + 1) * 2.55, 10, o.funnel != null ? o.funnel : K.ink, { y: D, z: z0 + L * 0.06 });
    } else if (o.kind === "bulk") {
      for (let z = z0 + L * 0.22; z < z0 + L * 0.88; z += L * 0.09) b.box(W * 0.62, 1.5, L * 0.065, o.hatch, { y: D, z });
      for (let z = z0 + L * 0.3; z < z0 + L * 0.85; z += L * 0.18) {
        b.cyl(0.9, 0.9, W * 0.5, 8, K.yellow, { x: -W * 0.3, y: D, z });
        bar(b, -W * 0.3, [D + W * 0.5, z], [D + W * 0.25, z + L * 0.1], 0.6, K.yellow);
      }
      b.box(W * 0.85, W * 0.7, L * 0.12, K.white, { y: D, z: z0 + L * 0.08 });
      b.box(W * 0.87, W * 0.12, L * 0.12 + 0.04, K.glassD, { y: D + W * 0.55, z: z0 + L * 0.08 });
      b.cyl(W * 0.07, W * 0.07, W * 0.95, 10, o.funnel != null ? o.funnel : K.ink, { y: D, z: z0 + L * 0.03 });
    } else if (o.kind === "roro") {
      b.noise(0.02, () => b.box(W, W * 0.95, L * 0.88, o.hull, { y: D, z: z0 + L * 0.45 }));
      b.box(W + 0.05, W * 0.06, L * 0.88, o.stripe, { y: D + W * 0.15, z: z0 + L * 0.45 });
      b.box(W * 0.9, W * 0.16, L * 0.1, K.white, { y: D + W * 0.95, z: z0 + L * 0.83 });
      b.box(W * 0.92, W * 0.08, L * 0.1 + 0.04, K.glassD, { y: D + W * 1.0, z: z0 + L * 0.83 });
    }
  }

  /* ------------------------------ Flugzeug ----------------------------- */
  function plane(b, o) {
    const L = o.len, R = o.r, c = o.c, y = R + (o.gear || 1.2), span = o.span, z0 = -L / 2;
    cylZ(b, R * 0.25, R, L * 0.28, c, { y: y + R * 0.3, z: z0 });
    cylZ(b, R, R, L * 0.58, c, { y, z: z0 + L * 0.28 });
    cylZ(b, R, R * 0.25, L * 0.14, c, { y: y - R * 0.12, z: z0 + L * 0.86 });
    if (o.hump) cylZ(b, R * 0.55, R * 0.55, L * 0.25, c, { y: y + R * 0.72, z: z0 + L * 0.62 });
    b.box(R * 1.1, R * 0.32, L * 0.03, K.glassD, { y: y + R * 0.3, z: z0 + L * 0.94, rx: -0.4 });
    if (o.stripe != null) b.box(R * 2.04, R * 0.2, L * 0.56, o.stripe, { y: y - R * 0.1, z: z0 + L * 0.58 });
    const wy = o.high ? y + R * 0.78 : y - R * 0.55, wz = z0 + L * (o.wingZ || 0.5), cr = o.chord || L * 0.16, sw = o.sweep || 0;
    [-1, 1].forEach(s => b.at({ x: s * span / 4, y: wy, z: wz }, () =>
      b.box(span / 2, R * 0.2, cr, c, { ry: s * sw, rz: s * (o.dih || 0) })));
    const fh = o.fin || R * 2.4;
    b.box(R * 0.16, fh, L * 0.12, o.tail != null ? o.tail : c, { y: y + R * 0.4, z: z0 + L * 0.08, rx: -0.45 });
    const hy = o.tTail ? y + R * 0.4 + fh * 0.9 : y + R * 0.4;
    [-1, 1].forEach(s => b.at({ x: s * span * 0.09, y: hy, z: z0 + L * (o.tTail ? 0.04 : 0.06) }, () =>
      b.box(span * 0.18, R * 0.12, L * 0.07, c, { ry: s * sw })));
    (o.engines || []).forEach(t => [-1, 1].forEach(s => {
      const ex = s * span / 2 * t, er = o.er || R * 0.35, ez = wz + cr * 0.4 - Math.abs(ex) * Math.tan(sw);
      if (o.prop) {
        cylZ(b, er * 0.7, er, er * 4, c, { x: ex, y: wy - er * 0.2, z: ez - er * 2.5 });
        b.cyl(er * 0.45, 0.02, er * 0.6, 8, K.ink, { rx: PI / 2, x: ex, y: wy - er * 0.2, z: ez + er * 1.5 });
        b.box(0.18, er * 4.4, 0.1, 0x4a5060, { x: ex, y: wy - er * 2.4, z: ez + er * 1.6 });
      } else {
        cylZ(b, er * 0.75, er, er * 3.2, o.eng || 0xd8dde2, { x: ex, y: wy - er * 1.2, z: ez - er * 1.2 });
        b.cyl(er * 0.82, er * 0.82, 0.1, 12, K.ink, { rx: PI / 2, x: ex, y: wy - er * 1.2, z: ez + er * 2.02 });
        b.box(er * 0.25, er * 1.2, er * 1.8, o.eng || 0xd8dde2, { x: ex, y: wy - er * 0.5, z: ez });
      }
    }));
    if (o.noseProp) {
      b.cyl(R * 0.3, 0.02, R * 0.5, 8, K.ink, { rx: PI / 2, x: 0, y: y - R * 0.12, z: z0 + L });
      b.box(0.12, R * 2.6, 0.08, 0x4a5060, { y: y - R * 1.42, z: z0 + L + 0.1 });
    }
    const gr = Math.max(0.35, R * 0.22);
    wheel(b, gr, gr * 0.6, -gr * 0.3, z0 + L * 0.88);
    b.box(0.14, y - R * 0.6, 0.14, K.steel, { y: gr, z: z0 + L * 0.88 });
    axle(b, gr * 1.2, gr * 0.8, R * 1.1, wz - cr * 0.2);
    if (o.pod) b.box(R * 1.0, R * 0.6, cr * 1.1, c, { y: y - R * 1.1, z: wz - cr * 0.2 });
  }

  /* ---------------------------- die Modelle ---------------------------- */
  const MODELS = {
    "v-messenger": (b, c) => bike(b, { frame: c || 0xd9415a, bag: 0x2a2f38 }),
    "v-bullitt": (b, c) => bike(b, { frame: c || 0x3f9a5a, cargo: true, boxC: K.woodL, boxH: 0.35 }),
    "v-urbanarrow": (b, c) => bike(b, { frame: 0x2a2f38, cargo: true, boxC: 0x2a2f38, boxY: 0.25, boxH: 0.45, boxW: 0.7, lid: c || K.white }),
    "v-chike": (b, c) => bike(b, { frame: 0x2a2f38, cargo: true, trike: true, boxC: c || 0xf08a24, boxY: 0.4, boxH: 0.7, boxW: 0.85 }),

    "v-simson": (b, c) => moped(b, { c: c || 0x3a8fb7, box: 0xf08a24, boxD: 0xc06a14, simson: true }),
    "v-liberty": (b, c) => moped(b, { c: c || K.white, box: 0xe8452f, boxD: 0xb83420 }),
    "v-kumpan": (b, c) => moped(b, { c: c || 0x7fd1b9, box: 0x2a2f38, boxD: 0x1a1f28 }),

    "v-caddy": (b, c) => van(b, { len: 4.9, h: 1.85, w: 1.85, c: c || 0xc9ced6 }),
    "v-sprinter": (b, c) => van(b, { len: 6.9, h: 2.75, w: 2.0, c: c || K.white, stripe: 0x3f78c8 }),
    "v-esprinter": (b, c) => van(b, { len: 6.9, h: 2.75, w: 2.0, c: c || K.white, stripe: 0x2fb3c4 }),
    "v-crafterkuehl": (b, c) => van(b, { len: 6.8, h: 2.6, w: 2.0, c: c || K.white, kuehl: true, stripe: 0x7cc4ff }),

    "v-daily": (b, c) => truck(b, { len: 7.2, cab: c || K.white, bodyC: 0xe9ecef, body: "box", stripe: 0x3f78c8 }),
    "v-atego": (b, c) => truck(b, { len: 8.6, cab: c || 0xc9ced6, bodyC: K.white, body: "reefer", stripe: 0x7cc4ff }),
    "v-tgm": (b, c) => truck(b, { len: 9.5, cab: c || K.white, bodyC: 0x3f78c8, body: "swap", stripe: K.yellow }),
    "v-eurocargo": (b, c) => truck(b, { len: 8.4, cab: c || K.white, bodyC: 0xd8dde2, body: "tank" }),

    "v-scania": (b, c) => semi(b, { tc: c || 0xa83526, trailer: "box", trC: K.white, stripe: 0xa83526 }),
    "v-actros": (b, c) => semi(b, { tc: c || 0x2a2f38, trailer: "box", trC: 0xd8dde2 }),
    "v-volvofhe": (b, c) => semi(b, { tc: c || 0x2f5fb8, trailer: "box", trC: K.white, stripe: 0x8fc83a, cabStripe: 0x8fc83a }),
    "v-dafreefer": (b, c) => semi(b, { tc: c || K.white, trailer: "reefer", trC: K.white, stripe: 0x7cc4ff, cabStripe: 0xd9415a }),
    "v-manadr": (b, c) => semi(b, { tc: c || K.white, trailer: "tank", trC: 0xd8dde2, cabStripe: 0xd9415a }),
    "v-chassis": (b, c) => semi(b, { tc: c || 0x3f78c8, trailer: "container", trC: 0x3f9a5a, lowCab: true }),
    "v-tieflader": (b, c) => semi(b, { tc: c || K.white, trailer: "lowbed", tri: true }),
    "v-volvoheavy": (b, c) => semi(b, { tc: c || 0xf08a24, trailer: "heavy", trC: 0x6b7480, tri: true, cabStripe: 0x2a2f38 }),
    "v-goldhofer": b => goldhofer(b),

    "v-spits": (b, c) => barge(b, { len: 39, w: 5.05, d: 2.2, kind: "bulk", hull: c || 0x1b3f6b, cover: 0x3f8f4a }),
    "v-kempenaar": (b, c) => barge(b, { len: 55, w: 7.2, d: 2.6, kind: "bulk", hull: c || 0x2a2f38, cover: 0xa83526 }),
    "v-gms": (b, c) => barge(b, { len: 85, w: 9.5, d: 3.0, kind: "container", tiers: 2, hull: c || 0x1b3f6b, tall: 1.5 }),
    "v-tms": (b, c) => barge(b, { len: 110, w: 11.4, d: 3.2, kind: "tank", hull: c || 0xa83526 }),
    "v-gross": (b, c) => barge(b, { len: 135, w: 11.4, d: 3.4, kind: "container", tiers: 3, hull: c || 0x2a2f38, tall: 3 }),
    "v-koppel": (b, c) => {
      b.at({ z: 18 }, () => barge(b, { len: 76, w: 11.4, d: 3.0, kind: "bulk", hull: 0x3a3f48, cover: 0x6b7480, house: false }));
      b.at({ z: -38 }, () => barge(b, { len: 37, w: 11.4, d: 3.2, kind: "none", hull: c || 0xf08a24, tall: 4 }));
    },

    "v-br185": (b, c) => train(b, { c: c || 0xc8102e, wagon: "container", seed: 3 }),
    "v-ludmilla": (b, c) => train(b, { c: c || 0xc8102e, wagon: "hopper", hood: true, seed: 5 }),
    "v-vectron": (b, c) => train(b, { c: c || 0x3f78c8, wagon: "pocket", stripe: K.yellow, seed: 7 }),
    "v-silkroad": (b, c) => train(b, { c: c || 0x2e7a50, wagon: "container", stripe: K.yellow, n: 3, seed: 11 }),

    "v-feeder": (b, c) => ship(b, { len: 150, w: 23, d: 10, kind: "container", tiers: 3, hull: c || 0x3f78c8, bridgeAt: 0.12 }),
    "v-supramax": (b, c) => ship(b, { len: 190, w: 32, d: 14, kind: "bulk", hull: c || 0x2a2f38, hatch: 0xa83526 }),
    "v-panamax": (b, c) => ship(b, { len: 290, w: 32, d: 16, kind: "container", tiers: 5, hull: c || 0x2e7a50, bridgeAt: 0.2 }),
    "v-roro": (b, c) => ship(b, { len: 200, w: 32, d: 9, kind: "roro", hull: c || K.white, bottom: 0x2a2f38, stripe: 0x2f5fb8 }),
    "v-triplee": (b, c) => ship(b, { len: 400, w: 59, d: 20, kind: "container", tiers: 7, hull: c || 0x0d3b66, bottom: 0x42b0d5, bridgeAt: 0.3, funnel: 0x42b0d5 }),
    "v-capesize": (b, c) => ship(b, { len: 290, w: 45, d: 18, kind: "bulk", hull: c || 0x1b2a3a, hatch: 0x6b7480 }),
    "v-hmm": (b, c) => ship(b, { len: 400, w: 61, d: 21, kind: "container", tiers: 7, hull: c || 0xe0662d, bottom: 0x2a2f38, bridgeAt: 0.28 }),

    "v-caravan": (b, c) => plane(b, { len: 12.7, r: 0.85, span: 15.9, high: true, noseProp: true, c: c || K.white, stripe: 0xd9415a, gear: 0.9, chord: 1.9, fin: 2.4 }),
    "v-atr": (b, c) => plane(b, { len: 27, r: 1.4, span: 27, high: true, prop: true, engines: [0.33], er: 0.55, c: c || K.white, stripe: 0x3f78c8, tTail: true, gear: 1.0, chord: 2.6, fin: 4.2, pod: true }),
    "v-737": (b, c) => plane(b, { len: 39.5, r: 1.9, span: 35.8, engines: [0.33], er: 0.95, c: c || K.white, tail: 0xf08a24, stripe: 0xf08a24, sweep: 0.42, dih: 0.06, chord: 5, fin: 6.5 }),
    "v-a330f": (b, c) => plane(b, { len: 58.8, r: 2.8, span: 60.3, engines: [0.34], er: 1.45, c: c || K.white, tail: 0x2f5fb8, stripe: 0x2f5fb8, sweep: 0.5, dih: 0.06, chord: 7.5, fin: 9, pod: true }),
    "v-777f": (b, c) => plane(b, { len: 63.7, r: 3.1, span: 64.8, engines: [0.32], er: 1.9, c: c || K.white, tail: 0x3f9a5a, stripe: 0x3f9a5a, sweep: 0.5, dih: 0.06, chord: 8, fin: 10 }),
    "v-7478f": (b, c) => plane(b, { len: 76.3, r: 3.2, span: 68.4, engines: [0.38, 0.7], er: 1.3, c: c || K.white, tail: 0xa83526, stripe: 0xa83526, hump: true, sweep: 0.6, dih: 0.06, chord: 10, fin: 11 }),
    "v-an124": (b, c) => plane(b, { len: 69, r: 3.6, span: 73.3, high: true, engines: [0.35, 0.62], er: 1.3, c: c || 0xd8dde2, tail: 0x2f5fb8, stripe: 0x2f5fb8, sweep: 0.4, dih: -0.06, chord: 10, fin: 11, pod: true, gear: 0.6 }),

    /* Sonderfahrzeuge: Unimog-Holzlaster (Erbhof) und goldener T1 (Luckybox) */
    "v-holzlaster": (b, c) => {
      const k = c || 0xe0a800;
      b.box(1.0, 0.3, 4.8, K.ink, { y: 0.75, z: 0 });
      axle(b, 0.55, 0.38, 1.6, 1.6); axle(b, 0.55, 0.38, 1.6, -1.7);
      b.box(2.0, 0.7, 1.4, k, { y: 1.05, z: 1.75, top: k });
      b.box(1.2, 0.45, 0.06, 0x3a3a40, { y: 1.15, z: 2.46 });
      b.box(2.0, 1.0, 1.0, k, { y: 1.75, z: 0.7 });
      b.box(1.8, 0.6, 0.06, K.glass, { y: 1.95, z: 1.22, rx: -0.15 });
      [-1, 1].forEach(s => b.box(0.04, 0.55, 0.6, K.glass, { x: s, y: 1.95, z: 0.7 }));
      b.box(2.1, 0.45, 3.1, 0x7a4a2a, { y: 1.05, z: -1.4 });
      b.noise(0.12, () => {
        [-0.6, 0, 0.6].forEach(x => cylZ(b, 0.28, 0.28, 3.2, 0xa0703f, { x, y: 1.78, z: -3.0, seg: 8, smooth: false, top: 0xd9b07a }));
        [-0.3, 0.3].forEach(x => cylZ(b, 0.27, 0.27, 3.1, 0xb9824a, { x, y: 2.3, z: -2.95, seg: 8, smooth: false, top: 0xd9b07a }));
      });
      [-2.95, 0.15].forEach(z => b.box(2.1, 1.1, 0.1, K.ink, { y: 1.5, z }));
    },
    "v-goldbulli": (b, c) => {
      const k = c || 0xd4a017, L = 4.3, W = 1.75;
      axle(b, 0.33, 0.2, W - 0.15, 1.35); axle(b, 0.33, 0.2, W - 0.15, -1.4);
      b.box(W, 0.85, L - 0.2, k, { y: 0.32, z: 0 });
      b.box(W - 0.06, 0.82, L - 0.5, K.white, { y: 1.17, z: -0.05 });
      b.box(W, 0.82, 0.3, k, { y: 0.32, z: L / 2 - 0.05 });
      b.box(W - 0.3, 0.45, 0.06, K.glass, { y: 1.3, z: L / 2 - 0.2, rx: -0.15 });
      [-1, 1].forEach(s => b.box(0.03, 0.4, L - 1.0, K.glass, { x: s * W / 2, y: 1.35, z: -0.1 }));
      b.box(W - 0.6, 0.06, 1.6, K.glass, { y: 1.99, z: -0.2 });
      b.box(0.9, 0.7, 0.04, K.white, { y: 0.4, z: L / 2 + 0.11 });
      [-1, 1].forEach(s => b.sphere(0.12, 8, 6, K.light, { x: s * 0.62, y: 0.95, z: L / 2 + 0.08, smooth: true }));
      b.box(W + 0.05, 0.12, 0.12, K.chrome, { y: 0.32, z: L / 2 + 0.1 }); b.box(W + 0.05, 0.12, 0.12, K.chrome, { y: 0.32, z: -L / 2 + 0.05 });
    }
  };

  /* Modell bauen und auf ~4 Einheiten Länge bringen (die Bildchen-Kamera richtet sich ohnehin nach der Größe) */
  function mesh(id, color) {
    const fn = MODELS[id];
    if (!fn || typeof FM === "undefined") return null;
    if (G3.seed) G3.seed(7000 + id.length * 13);
    const b = new FM.MB();
    fn(b, color);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < b.v.length; i += 9) for (let k = 0; k < 3; k += 2) { const v = b.v[i + k]; if (v < lo) lo = v; if (v > hi) hi = v; }
    const out = new FM.MB();
    out.merge(b, { s: 4 / Math.max(0.5, hi - lo) });
    return out;
  }
  return { mesh, has: id => !!MODELS[id], K };
})();

/* Firmenfarbe "#rrggbb" → Zahl */
const vmCol = c => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? parseInt(c.slice(1), 16) : (typeof c === "number" ? c : null);
/* Blick auf Fahrzeuge: schräg von vorn rechts, etwas flacher als bei Waren */
const VEH_VIEW = { yaw: 1.05, pitch: 0.42 };
/* Fahrzeug-Bildchen wie die Hofwaren (thumbSpan aus worldview.js); ohne 3D das Emoji */
function vehIc(t, color) {
  if (!t) return "";
  const c = vmCol(color);
  if (typeof thumbSpan !== "function" || !VM.has(t.id)) return `<span class="ic">${t.icon}</span>`;
  return thumbSpan("veh:" + t.id + (c != null ? ":" + c.toString(16) : ""), () => VM.mesh(t.id, c), t.icon, false, VEH_VIEW);
}
