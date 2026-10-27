/* =========================================================================
   LOGISTIKA – woodmodels.js
   3D-Modelle für die große Welt: Waldbäume nach Art und Größe (mit Stumpf,
   Setzling, Windwurf), Waldboden-Kleinkram, Wege, Bach und Brücke, der See
   mit Ufer, Schilf und Seerosen, Krügers Sägewerk (verfallen und repariert)
   mit Maschinen, Gerümpel und Ausbaustufen am Hof, Fischerei-Gebäude und
   Boote, Wildtiere, Haustiere, Leute und Saison-Deko.
   Gebaut aus den Grundkörpern von gl3d.js wie farmmodels.js (FM).
   Maßstab: 1 Einheit = 1 Kachel (~2 m), Boden y = 0, vorne = +z.
   ========================================================================= */
const FWM = (() => {
  "use strict";
  const MB = G3.MB, C = FM.C;
  const rnd = () => G3.srand();
  const mix = (a, b, t) => { const A = G3.col(a), B = G3.col(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };

  /* ------------------------------- Bäume -------------------------------- */
  const TH = [0, 1.0, 1.55, 2.15, 3.0];        /* Höhenfaktor je Größe */
  /* v56: Farben nach den echten Bäumen – Birke weiß mit schwarzen Flecken, Kiefer oben fuchsrot,
     Fichte dunkel blaugrün, Buche glatt silbergrau, Eiche dunkel und rissig, Kirsche rotbraun geringelt */
  const TREE_C = {
    birke:   { bark: 0xefece3, mark: 0x26241f, base: 0x4d4943, leaf: 0x92c652, leaf2: 0xaad460, leaf3: 0x78ad46 },
    kiefer:  { bark: 0xc9743f, mark: 0x7a4426, base: 0x6e5646, leaf: 0x3f6d4b, leaf2: 0x4e7e58, leaf3: 0x335d40 },
    fichte:  { bark: 0x5e4232, mark: 0x4a3322, base: 0x4a3426, leaf: 0x24502f, leaf2: 0x2d5d39, leaf3: 0x1c4327 },
    buche:   { bark: 0xa8a79f, mark: 0x8a8981, base: 0x8f8e86, leaf: 0x5ea63b, leaf2: 0x72b84a, leaf3: 0x4c9231 },
    eiche:   { bark: 0x5b4535, mark: 0x3d2d21, base: 0x4a382b, leaf: 0x4b7c2b, leaf2: 0x5b8e35, leaf3: 0x3d6923 },
    kirsche: { bark: 0x6c3631, mark: 0xa27560, base: 0x5a2e2a, leaf: 0x5a9c3d, leaf2: 0x6aac46, leaf3: 0x4a8a32, bloom: 0xfbe6ee, fruit: 0xc0242c }
  };
  /* Gesamthöhe je Art bei Größe 1 (für Tippfläche, Blasen und die Kulissenbäume) */
  const TREE_H = { birke: 2.7, kiefer: 3.0, fichte: 3.1, buche: 2.8, eiche: 2.5, kirsche: 2.5 };
  function trunk(b, r0, r1, h, c, o) { b.cyl(r0, r1, h, 7, c, Object.assign({ top: c }, o || {})); }
  /* schräger Ast von (0, y) in Richtung a (um y) mit Neigung e (0 = waagrecht, 1.57 = senkrecht) */
  function limb(b, y, a, e, len, r, c, seg) {
    b.at({ y, ry: -a }, () => b.cyl(r, r * 0.55, len, seg || 5, c, { rz: -(Math.PI / 2 - e), notop: true, nobot: true }));
    return [Math.cos(a) * Math.cos(e) * len, y + Math.sin(e) * len, Math.sin(a) * Math.cos(e) * len];
  }
  /* kurzer, spitz zulaufender Aststummel mit geschlossener Spitze (Kiefer) */
  function stub(b, y, a, e, len, r, c, seg) {
    b.at({ y, ry: -a }, () => b.cyl(r, r * 0.3, len, seg || 4, c, { rz: -(Math.PI / 2 - e), nobot: true }));
  }
  /* ---- v152: Bausteine für beide Detailstufen (nah/fern) ----
     Lage, Größe und Grundform sind in beiden Stufen gleich – die Silhouette bleibt beim Wechsel. Formzufall kommt aus Hashes
     statt aus dem Zahlenstrom, damit die Zusatzteile der feinen Stufe die grobe nicht verschieben. */
  const hsh = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const cA = c => typeof c === "number" ? G3.col(c) : c;
  const mixA = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const briA = (a, f) => [Math.min(1, a[0] * f), Math.min(1, a[1] * f), Math.min(1, a[2] * f)];
  const nrm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  /* Ikosaeder in drei Feinheiten (20, 80, 320 Flächen) mit den Eltern jeder neuen Ecke – gleiche Flächenfolge wie MB.ico */
  const ICOL = (() => {
    const t = (1 + Math.sqrt(5)) / 2;
    const V0 = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm3);
    const F0 = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const L = [{ V: V0, F: F0, par: [], n0: 12 }];
    for (let l = 1; l <= 2; l++) {
      const P = L[l - 1], V = P.V.slice(), par = P.V.map(() => null), cache = {}, F = [];
      const mid = (a, b) => { const k = a < b ? a + "_" + b : b + "_" + a; if (cache[k] == null) { V.push(nrm3([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2])); par.push([a, b]); cache[k] = V.length - 1; } return cache[k]; };
      P.F.forEach(([a, b, c]) => { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); F.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
      L.push({ V, F, par, n0: P.V.length });
    }
    return L;
  })();
  /* Laubpalette je Wolke: s = 0 normal, +1 heller (Sonnenseite/oben), −1 dunkler (innen/unten) – nie schwarz, nie grell */
  const pal = (T, s) => s > 0 ? [T.leaf2, mixA(cA(T.leaf2), cA(T.leaf), 0.5), T.leaf] : s < 0 ? [T.leaf, T.leaf3, briA(cA(T.leaf3), 0.86)] : [T.leaf2, T.leaf, T.leaf3];
  /* Laubwolke. Fern: Ikosaeder (lv 0 = 20 Flächen); nah: eine Stufe feiner und kleine Blattbüschel auf der Oberfläche
     (brechen die großen Flächen und die glatte Kontur auf). Farbe von oben hell über mittel nach unten dunkel, leicht
     gestreut; Licht-Normale halb von der Fläche, halb von der Kronenmitte vc nach außen – die Krone wirkt wie ein Volumen
     statt wie lose Platten, keine fast schwarzen Unterseiten. */
  function leafClump(b, c, r, cols, o) {
    o = o || {};
    const lv = Math.min(2, (o.lv || 0) + (o.hi ? 1 : 0)), fl = o.flat || 1, j = o.jitter == null ? 0.35 : o.jitter, sd = o.seed || 0;
    const vc = o.vc || c, vfl = o.vfl || fl, wv = o.wv == null ? 0.55 : o.wv;
    const L = cA(cols[0]), Mm = cA(cols[1]), D = cA(cols[2]);
    let K = ICOL[0].V.map((d, i) => 1 + (hsh(sd * 7.1 + i * 0.37, 1.7) - 0.5) * j);
    for (let l = 1; l <= lv; l++) { const I = ICOL[l], Kp = K; K = I.V.map((d, i) => i < I.n0 ? Kp[i] : (Kp[I.par[i][0]] + Kp[I.par[i][1]]) / 2 * (1 + (hsh(sd * 3.3 + i * 0.53 + l, 4.1) - 0.5) * j * 0.45 / l)); }
    const I = ICOL[lv], V = I.V;
    const P = V.map((d, i) => [c[0] + d[0] * r * K[i], c[1] + d[1] * r * K[i] * fl, c[2] + d[2] * r * K[i]]);
    for (let fi = 0; fi < I.F.length; fi++) {
      const [a, e, g] = I.F[fi], A = P[a], B = P[e], C = P[g];
      const ny = (V[a][1] + V[e][1] + V[g][1]) / 3, q = hsh(sd * 1.3 + fi * 0.71, 2.9), q2 = hsh(sd * 2.1 + fi * 1.13, 6.3);
      if (o.cutLow != null && ny < o.cutLow) continue;
      let col = ny > 0.4 ? mixA(L, Mm, q * 0.45) : ny > -0.22 ? mixA(Mm, q < 0.5 ? L : D, 0.12 + q * 0.3) : mixA(D, Mm, q * 0.3);
      col = briA(col, (o.dim || 1) * (0.93 + 0.14 * q2));
      const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
      const fn = nrm3([u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]);
      const m = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3];
      const rn = nrm3([m[0] - vc[0], (m[1] - vc[1]) / (vfl * vfl), m[2] - vc[2]]);
      const n = nrm3([fn[0] * (1 - wv) + rn[0] * wv, fn[1] * (1 - wv) + rn[1] * wv, fn[2] * (1 - wv) + rn[2] * wv]);
      b.tri(A, B, C, col, n, n, n);
    }
    if (o.hi && o.tufts) {
      const nT = o.tufts, lo = o.tuftLo == null ? -0.55 : o.tuftLo;
      for (let i = 0; i < nT; i++) {
        const yy = 1 - (1 - lo) * (i + 0.5) / nT, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = i * 2.39996 + sd * 1.7;
        /* Büschel sitzen halb in der Wolke – die Kontur wird unruhiger, aber kaum größer als die grobe Stufe (kein Sprung beim Wechsel) */
        const kk = 0.8 + 0.08 * hsh(sd + i, 8.1), p = [c[0] + Math.cos(a) * rr * r * kk, c[1] + yy * r * kk * fl, c[2] + Math.sin(a) * rr * r * kk];
        leafClump(b, p, r * (0.2 + 0.1 * hsh(sd + i * 1.7, 3.7)), cols, { flat: Math.min(1.2, fl * 1.1), jitter: 0.45, seed: sd * 1.9 + i * 3.1 + 1, vc, vfl, wv: 0.7, dim: 1.02 });
      }
    }
  }
  /* Fichten-Etage: Sternform mit S Astspitzen (hängen etwas), dazwischen eingezogene Buchten; nah mit gewölbtem Mittelring
     und dunkler Unterseite (Ich-Perspektive schaut von unten hinein) */
  function spruceLayer(b, y, rad, hh, a0, cols, hi, sd) {
    const S = hi ? 14 : 9, L = cA(cols[0]), Mm = cA(cols[1]), D = cA(cols[2]), droop = hh * 0.14, apex = [0, y + hh, 0], ring = [], mid = [];
    for (let i = 0; i < 2 * S; i++) {
      const a = a0 + i * Math.PI / S, tip = i % 2 === 0, rr = rad * (tip ? 1 + (hsh(sd + i * 0.7, 2.2) - 0.5) * 0.16 : 0.8);
      ring.push([Math.cos(a) * rr, y - (tip ? droop : droop * 0.2), Math.sin(a) * rr]);
      if (hi) { const q = ring[i], m = 0.44; mid.push([q[0] * (1 - m) * 1.08, q[1] + (apex[1] - q[1]) * m, q[2] * (1 - m) * 1.08]); }
    }
    const put = (A, B, C, col, up) => {
      const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
      let fn = nrm3([u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]);
      const mx = (A[0] + B[0] + C[0]) / 3, mz = (A[2] + B[2] + C[2]) / 3, l = Math.hypot(mx, mz) || 1;
      const rn = up ? nrm3([mx / l, rad / hh + 0.2, mz / l]) : [0, -1, 0];
      if (fn[0] * rn[0] + fn[1] * rn[1] + fn[2] * rn[2] < 0) { const t = B; B = C; C = t; fn = [-fn[0], -fn[1], -fn[2]]; }
      const n = nrm3([fn[0] * 0.5 + rn[0] * 0.5, fn[1] * 0.5 + rn[1] * 0.5, fn[2] * 0.5 + rn[2] * 0.5]);
      b.tri(A, B, C, col, n, n, n);
    };
    for (let i = 0; i < 2 * S; i++) {
      const i2 = (i + 1) % (2 * S), q = hsh(sd * 1.7 + i, 4.4), q2 = hsh(sd + i * 2.3, 1.1);
      const cTop = briA(mixA(Mm, L, 0.2 + 0.45 * q), 0.95 + 0.1 * q2), cLow = briA(mixA(D, Mm, 0.35 + 0.35 * q), 0.95 + 0.1 * q2);
      if (hi) { put(ring[i], ring[i2], mid[i2], cLow, true); put(ring[i], mid[i2], mid[i], cLow, true); put(mid[i], mid[i2], apex, cTop, true); }
      else put(ring[i], ring[i2], apex, mixA(cLow, cTop, 0.5), true);
    }
    if (hi) { const un = [0, y + hh * 0.06, 0], cu = briA(D, 0.8); for (let i = 0; i < 2 * S; i++) put(ring[(i + 1) % (2 * S)], ring[i], un, cu, false); }
  }
  /* Waldbaum je Art (sp), Größe (sz 1…4) und Variante (v 0…2). hi = feine Stufe (nah in der Hof-/Waldansicht und
     Ich-Perspektive), sonst grob (fern, Kulissenbäume). Aufbau: zuerst der Stamm (treebark.js, endet bei b.tk; b.tp = r unten,
     r oben, Höhe, Neigung; b.scars = Astansätze für die Narben), danach Äste und Krone – die Ich-Perspektive ersetzt nur den Stamm.
     v152: Stamm mit derselben Rinde wie in der Ich-Perspektive (vorher 7-Eck-Rohr mit aufgesetzten Klötzchen/Scheiben),
     Kronen als zusammenhängendes Volumen (Farbverlauf, Volumenlicht, nah feiner und mit Blattbüscheln). */
  function tree(sp, sz, v, hi) {
    v = v || 0; hi = !!hi;
    G3.seed(3000 + sz * 97 + v * 13 + sp.length * 7);
    const b = new MB(), T = TREE_C[sp] || TREE_C.buche, k = TH[sz] || 1, H = (TREE_H[sp] || 2.8) * k;
    const lean = (rnd() - 0.5) * 0.05, sd = v * 1.7 + sz * 0.37 + sp.length * 0.61;
    const fa = a => Math.atan2(Math.cos(a), Math.sin(a));              /* Astrichtung (cos a, sin a) → Rindenwinkel atan2(x, z) */
    /* extra: Teile am Stamm, die nicht zur Krone zählen (Maße FTREE_DIM), die Ich-Perspektive aber mitnimmt (b.keep) – Aststummel */
    const stem = (tp, scars, extra) => {
      let ok = false;
      if (typeof TBARK !== "undefined") { try { b.merge(TBARK.trunk(sp, sz, v, tp, { lod: hi ? 1 : 2, scars }), {}); ok = true; } catch (e) { console.warn("Rinde", sp, e); } }
      if (!ok) b.at({ rz: tp[3] || 0 }, () => trunk(b, tp[0], tp[1], tp[2], T.bark));
      if (extra) { const k0 = b.v.length; extra(); b.keep = [[k0, b.v.length]]; }
      b.tk = b.v.length; b.tp = tp; b.scars = scars || null;
    };
    if (sp === "birke") {
      /* schlank, cremeweiße Rinde mit schwarzen Querbändern, Fuß dunkel und rissig; graue Äste, lockere, luftige Krone mit hängenden Zweigen */
      const h = H * 0.84, r = 0.07 * k + 0.02, al = lean * 2;
      const LB = [0, 1, 2, 3].map(i => ({ y: h * (0.42 + i * 0.12), a: i * 2.2 + v, len: (0.55 - i * 0.06) * k }));
      stem([r * 1.15, r * 0.45, h, al], LB.map(l => [l.y, fa(l.a)]));
      b.at({ rz: al }, () => {
        const lc = mixA(cA(T.bark), [0.42, 0.4, 0.37], 0.42);
        const ends = LB.map(l => limb(b, l.y, l.a, 0.85, l.len, 0.028 * k + 0.008, lc, hi ? 6 : 5));
        ends.push([0, h, 0]);
        const cv = [0, h * 0.84, 0];
        ends.forEach((p, i) => {
          const rr = (0.33 - i * 0.015) * k + 0.05, c = [p[0], p[1] + 0.05 * k, p[2]], cs = i % 3 === 0 ? pal(T, 1) : i % 3 === 1 ? pal(T, 0) : pal(T, -1);
          leafClump(b, c, rr, cs, { hi, flat: 1.45, jitter: 0.5, seed: sd + i * 3.7, vc: lerp3(c, cv, 0.4), tufts: 6 });
          /* hängende Zweige: schmale Spitzen nach unten (nah doppelt so viele, feiner) */
          for (let j = 0; j < (hi ? 4 : 2); j++) {
            const a = j < 2 ? j * 3.1 + i : j * 3.1 + i + 1.55, d = rr * (j < 2 ? 0.8 : 0.62), ln = 0.42 * k * (j < 2 ? 1 : 0.78 + 0.2 * hsh(sd + i, j));
            b.cone((0.09 * k + 0.02) * (hi ? 0.82 : 1), ln, hi ? 6 : 5, j % 2 ? T.leaf3 : T.leaf, { x: p[0] + Math.cos(a) * d, y: p[1] - 0.1 * k, z: p[2] + Math.sin(a) * d, rx: Math.PI, nobot: true });
          }
        });
        leafClump(b, [0.05 * k, h + 0.22 * k, 0], 0.16 * k + 0.03, pal(T, 1), { hi, flat: 1.6, jitter: 0.35, seed: sd + 31, vc: cv, tufts: 4 });
      });
    } else if (sp === "kiefer") {
      /* hoher, gerader Stamm: unten graubraune Schuppenborke, oben fuchsrot; trockene Aststummel; Krone nur ganz oben – flache, schirmartige Nadelwolken */
      const h = H * 0.86, r = 0.1 * k + 0.02, stubs = [];
      for (let i = 0; i < 2 + sz; i++) stubs.push({ y: h * (0.35 + rnd() * 0.3), a: rnd() * 6.28 });
      stem([r * 1.1, r * 0.55, h, lean], null, () => b.at({ rz: lean }, () => stubs.forEach(s => stub(b, s.y, s.a, -0.3, r * 1.1 * (1 - 0.5 * s.y / h) + 0.12 * k, 0.017 * k + 0.007, T.mark, hi ? 5 : 4))));
      b.at({ rz: lean }, () => {
        const n = 3 + Math.min(sz, 3), cv = [0, h + 0.05 * k, 0];
        for (let i = 0; i < n; i++) {
          const a = i * 2.4 + v * 1.3, y = h * (0.72 + (i / n) * 0.2), len = (0.38 + rnd() * 0.25) * k, e = 0.35 + rnd() * 0.3;
          const p = limb(b, y, a, e, len, 0.035 * k, T.bark, hi ? 6 : 5), c = [p[0], p[1] + 0.05 * k, p[2]];
          leafClump(b, c, (0.36 + rnd() * 0.12) * k, pal(T, i % 2 ? 1 : 0), { hi, flat: 0.42, jitter: 0.4, seed: sd + i * 2.9, vc: lerp3(c, cv, 0.5), vfl: 0.5, tufts: 7, tuftLo: -0.2 });
          leafClump(b, [p[0] * 0.8, p[1] - 0.12 * k, p[2] * 0.8], 0.24 * k, pal(T, -1), { hi, flat: 0.4, jitter: 0.4, seed: sd + i * 2.9 + 11, vc: cv, vfl: 0.5 });
        }
        leafClump(b, [0, h + 0.06 * k, 0], 0.46 * k, pal(T, 0), { hi, flat: 0.45, jitter: 0.35, seed: sd + 41, vc: cv, vfl: 0.5, tufts: 8, tuftLo: -0.2 });
        leafClump(b, [0.15 * k, h + 0.2 * k, -0.1 * k], 0.3 * k, pal(T, 1), { hi, flat: 0.45, jitter: 0.35, seed: sd + 43, vc: cv, vfl: 0.5, tufts: 5, tuftLo: -0.1 });
      });
    } else if (sp === "fichte") {
      /* dicht und kegelförmig bis fast zum Boden, dunkel blaugrün; Etagen mit hängenden Astspitzen, Spitze schmal */
      const r = 0.08 * k + 0.02;
      stem([r * 1.2, r, 0.5 * k, 0], null);
      const L = 5 + Math.min(3, sz), hb = 0.28 * k, ht = H - hb;
      for (let i = 0; i < L; i++) {
        const f = i / L, y = hb + f * ht * 0.92, rad = (0.78 * (1 - f) + 0.12) * k, hh = (0.52 + 0.1 * (1 - f)) * k;
        spruceLayer(b, y - 0.06 * k, rad, hh, i * 0.7 + v, pal(T, i % 3 === 1 ? 1 : i % 3 === 2 ? -1 : 0), hi, sd + i * 2.3);
      }
      spruceLayer(b, H - 0.42 * k, 0.07 * k + 0.03, 0.45 * k, v, pal(T, 1), false, sd + 77);
    } else if (sp === "buche") {
      /* glatter silbergrauer Stamm mit Wurzelanlauf und „Augen“, teilt sich in steile Äste; dichte, breite, eiförmige Krone in frischem Grün */
      const h = H * 0.3, r = 0.12 * k + 0.02, TA = [0, 1, 2].map(i => i * 2.1 + v);
      stem([r * 1.2, r * 0.9, h, lean], TA.map(a => [h * 0.92, fa(a)]));
      b.at({ rz: lean }, () => {
        const tops = TA.map(a => limb(b, h * 0.92, a, 1.08, 0.7 * k, r * 0.6, T.bark, hi ? 7 : 5));
        const cv = [0, H * 0.62, 0];
        leafClump(b, [0, H * 0.6, 0], 0.9 * k, pal(T, 0), { hi, lv: 1, flat: 1.0, jitter: 0.18, seed: sd + 1, vc: cv, tufts: 12 });
        for (let i = 0; i < 4; i++) {
          const a = i * 1.57 + v * 0.7, d = 0.62 * k, c = [Math.cos(a) * d, H * (0.5 + (i % 2) * 0.08), Math.sin(a) * d];
          leafClump(b, c, 0.55 * k, pal(T, i % 2 ? 1 : 0), { hi, flat: 0.95, jitter: 0.25, seed: sd + 5 + i * 2.2, vc: lerp3(c, cv, 0.5), tufts: 6 });
        }
        const c = [tops[0][0] * 0.3, H * 0.84, tops[0][2] * 0.3];
        leafClump(b, c, 0.52 * k, pal(T, 1), { hi, flat: 0.95, jitter: 0.25, seed: sd + 17, vc: lerp3(c, cv, 0.5), tufts: 6 });
      });
    } else if (sp === "eiche") {
      /* kurzer, dicker, tief gefurchter Stamm mit Wurzelanlauf; knorrige, weit ausladende Äste; breite, unregelmäßige Krone mit Lücken */
      const big = sz >= 4, h = H * 0.36, r = (big ? 0.24 : 0.16) * k + 0.03;
      const n = 4 + (big ? 1 : 0), LE = [];
      for (let i = 0; i < n; i++) LE.push({ a: i * (6.28 / n) + v + rnd() * 0.4, e: 0.38 + rnd() * 0.35, len: (0.75 + rnd() * 0.3) * k });
      stem([r * 1.25, r * 0.85, h, 0], null);
      const ends = LE.map(l => {
        const p = limb(b, h * 0.92, l.a, l.e, l.len, r * 0.55, T.bark, hi ? 7 : 5);
        /* ein Knick: der Ast biegt nach oben */
        b.at({ x: p[0], y: p[1], z: p[2] }, () => limb(b, 0, l.a + 0.5, 0.95, 0.35 * k, r * 0.3, T.bark, hi ? 6 : 5));
        return p;
      });
      /* v128: Moospolster am Stamm gehören zum Stamm – die Ego-Sicht ersetzt den Stamm und lässt sie weg (b.skip), sonst hingen sie nach dem Kerb in der Luft */
      const ms = b.v.length;
      if (big) for (let i = 0; i < 4; i++) b.ico(0.13 * k, 0x3f6b2a, { x: Math.cos(i * 1.6) * r, y: 0.2 + rnd() * h * 0.6, z: Math.sin(i * 1.6) * r, flat: 0.5, jitter: 0.4 });
      b.skip = [[ms, b.v.length]];
      const cv = [0, H * 0.72, 0];
      ends.forEach((p, i) => {
        const c = [p[0] * 1.05, p[1] + 0.35 * k, p[2] * 1.05];
        leafClump(b, c, (0.62 + rnd() * 0.15) * k, pal(T, i % 2 ? 1 : 0), { hi, flat: 0.72, jitter: 0.38, seed: sd + i * 4.1, vc: lerp3(c, cv, 0.5), tufts: 7 });
        leafClump(b, [p[0] * 0.75, p[1] + 0.05 * k, p[2] * 0.75], 0.38 * k, pal(T, -1), { hi, flat: 0.7, jitter: 0.4, seed: sd + i * 4.1 + 2, vc: cv, tufts: 3 });
      });
      leafClump(b, [0, H * 0.78, 0], 0.7 * k, pal(T, 0), { hi, flat: 0.7, jitter: 0.35, seed: sd + 51, vc: cv, tufts: 8 });
    } else if (sp === "kirsche") {
      /* rotbrauner Stamm mit hellen, unterbrochenen Querbändern; aufrechte, eiförmige Krone mit roten Kirschen */
      const h = H * 0.4, r = 0.1 * k + 0.02, TA = [0, 1, 2].map(i => i * 2.1 + v);
      stem([r * 1.1, r * 0.8, h, lean], null);
      b.at({ rz: lean }, () => {
        const tops = TA.map(a => limb(b, h * 0.92, a, 1.0, 0.5 * k, r * 0.55, T.bark, hi ? 6 : 5));
        const clumps = [[0, H * 0.62, 0, 0.62]].concat(tops.map(p => [p[0] * 1.15, p[1] + 0.22 * k, p[2] * 1.15, 0.42]), [[0, H * 0.84, 0, 0.4]]);
        const cv = [0, H * 0.68, 0];
        clumps.forEach(([x, y, z, rr], i) => leafClump(b, [x, y, z], rr * k, pal(T, i % 2 ? 1 : 0), { hi, flat: 1.12, jitter: 0.28, seed: sd + i * 3.3, vc: lerp3([x, y, z], cv, 0.5), tufts: 6 }));
        /* v70: runde rote Kirschen (paarweise am Stiel) außen auf der Krone – so erkennt man die
           seltene Wildkirsche schon von Weitem (vorher eckige weiße Blüten) */
        b.noise(0.05, () => clumps.forEach(([x, y, z, rr], i) => {
          for (let j = 0; j < 2; j++) {
            const a = j * 3.1 + i * 1.3 + v, e = 0.2 + j * 0.35, d = rr * k * 0.96, s = 0.042 * k + 0.026;
            const cx = x + Math.cos(a) * Math.cos(e) * d, cy = y + Math.sin(e) * d, cz = z + Math.sin(a) * Math.cos(e) * d;
            const ox = -Math.sin(a) * s * 0.95, oz = Math.cos(a) * s * 0.95;
            b.sphere(s, 7, 5, T.fruit, { x: cx + ox, y: cy - s * 0.3, z: cz + oz, smooth: true });
            b.sphere(s, 7, 5, j === 1 ? 0x9a1422 : T.fruit, { x: cx - ox, y: cy - s * 0.6, z: cz - oz, smooth: true });
            b.box(0.014, s * 1.5, 0.014, 0x4a6a2a, { x: cx, y: cy + s * 0.35, z: cz });
          }
        }));
      });
    }
    return b;
  }

  /* v117: Bäume für die Nahsicht (Fernglas/Zielfernrohr im Revier) – ersetzt das v113-Modell.
     Bei 7-facher Vergrößerung wirkten große Laubklumpen wie Felsflächen. Jetzt: Kronen aus vielen kleinen Blättern
     bzw. Nadelbüscheln; ihre Licht-Normalen zeigen von der Kronenmitte nach außen, so wird die Krone wie ein Volumen
     beleuchtet und die Blätter geben Struktur und eine ausgefranste Silhouette. Ein dunkler Kern verhindert Durchblick.
     Stämme sind gewachsene Röhren (Wurzelanlauf, Furchen, weiche Normalen), Äste gebogene Röhren. Alle fünf Waldarten;
     gleiche Höhe, Farben und Fußpunkt wie tree(sp, sz, v). */
  /* Einheits-Ikosaeder, einmal unterteilt (80 Flächen) – Kern der Laubwolken (einmal berechnet) */
  let ICO1 = null;
  function icoUnit() {
    if (ICO1) return ICO1;
    const t = (1 + Math.sqrt(5)) / 2, nz = p => { const l = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]); return [p[0] / l, p[1] / l, p[2] / l]; };
    const V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nz);
    const F0 = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]], cache = {}, F = [];
    const mid = (a, b) => { const k = a < b ? a + "_" + b : b + "_" + a; if (cache[k] == null) { V.push(nz([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2])); cache[k] = V.length - 1; } return cache[k]; };
    F0.forEach(([a, b, c]) => { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); F.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
    return (ICO1 = { V, F });
  }
  /* lo (v131): Mittelstufe für die Revier-Sicht mit bloßem Auge – gleiche Gestalt, Farben und Blattoptik wie das feine Modell,
     aber etwa ein Viertel der Blätter (dafür größer), weniger Rindensegmente; ca. 1 500 statt 6 000 Dreiecke */
  function treeRv(sp, sz, v, lo) {
    v = v || 0; lo = !!lo;
    if (!TREE_C[sp] || sp === "kirsche") return tree(sp, sz, v);
    G3.seed(7000 + sz * 97 + v * 13 + sp.length * 7);
    const b = new MB(), T = TREE_C[sp], k = TH[sz] || 1, H = TREE_H[sp] * k, PI = Math.PI;
    const add = (a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], sub = (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
    const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
    const crs = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
    const nrm = a => { const l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const ru = () => nrm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]);
    const bri = (c, f) => { const a = G3.col(c); return [Math.min(1, a[0] * f), Math.min(1, a[1] * f), Math.min(1, a[2] * f)]; };
    /* Dreieck so gewendet, dass es zur Seite o sichtbar ist (Rückseiten werden ausgelesen); Licht-Normale n */
    /* schnelles Schreiben direkt in den Puffer (das Modell liegt im Ursprung, keine Transformation nötig) */
    let F = new Float32Array(9 * 3 * 6000), nF = 0;
    const cc = c => typeof c === "number" ? G3.col(c) : c;
    const v3 = (P, N, q) => { F[nF++] = P[0]; F[nF++] = P[1]; F[nF++] = P[2]; F[nF++] = N[0]; F[nF++] = N[1]; F[nF++] = N[2]; F[nF++] = q[0]; F[nF++] = q[1]; F[nF++] = q[2]; };
    const put = (A, B, C, c, na, nb, nc) => {
      if (nF + 27 > F.length) { const G = new Float32Array(F.length * 2); G.set(F); F = G; }
      const q = cc(c); v3(A, na, q); v3(B, nb, q); v3(C, nc, q);
    };
    const face = (A, B, C, c, n, o) => {
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], wx = C[0] - A[0], wy = C[1] - A[1], wz = C[2] - A[2], r = o || n;
      if ((uy * wz - uz * wy) * r[0] + (uz * wx - ux * wz) * r[1] + (ux * wy - uy * wx) * r[2] < 0) put(A, C, B, c, n, n, n); else put(A, B, C, c, n, n, n);
    };
    const face3 = (A, B, C, c, na, nb, nc, o) => {
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], wx = C[0] - A[0], wy = C[1] - A[1], wz = C[2] - A[2];
      if ((uy * wz - uz * wy) * o[0] + (uz * wx - ux * wz) * o[1] + (ux * wy - uy * wx) * o[2] < 0) put(A, C, B, c, na, nc, nb); else put(A, B, C, c, na, nb, nc);
    };
    /* Röhre entlang P mit Radien Rr: weiche Normalen, Farbe je Abschnitt/Ecke, optional Furchen (wob) */
    const tube = (P, Rr, seg, colAt, o) => {
      o = o || {};
      if (lo) seg = Math.max(3, Math.round(seg * 0.6));
      const n = P.length, rings = [];
      let t0 = nrm(sub(P[1], P[0])), U = Math.abs(t0[1]) < 0.9 ? nrm(crs(t0, [0, 1, 0])) : nrm(crs(t0, [1, 0, 0]));
      for (let i = 0; i < n; i++) {
        const Ti = nrm(sub(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)]));
        U = nrm(sub(U, scl(Ti, dot(U, Ti))));
        const W = crs(Ti, U), ring = [];
        for (let j = 0; j < seg; j++) {
          const a = j / seg * 2 * PI + (o.a0 || 0), d = add(scl(U, Math.cos(a)), scl(W, Math.sin(a)));
          ring.push([add(P[i], scl(d, Rr[i] * (o.wob ? o.wob(i / (n - 1), j, a) : 1))), d]);
        }
        rings.push(ring);
      }
      for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
        const j2 = (j + 1) % seg, A = rings[i][j], B = rings[i][j2], C = rings[i + 1][j2], D = rings[i + 1][j], c = colAt(i, j);
        const out = nrm(add(add(A[1], B[1]), add(C[1], D[1])));
        face3(A[0], B[0], C[0], c, A[1], B[1], C[1], out);
        face3(A[0], C[0], D[0], c, A[1], C[1], D[1], out);
      }
      if (o.cap) { const L = rings[n - 1], top = P[n - 1], up = nrm(sub(P[n - 1], P[n - 2])); for (let j = 0; j < seg; j++) face(top, L[j][0], L[(j + 1) % seg][0], colAt(n - 2, j), up); }
      return rings;
    };
    /* Ast: gebogene Röhre von p0 in Richtung (a, e), biegt sich nach oben; liefert Punkte */
    const bough = (p0, a, e, len, r0, r1, bend, col, seg) => {
      const d = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)], P = [], R = [], m = 4;
      const wig = ru();
      for (let i = 0; i <= m; i++) {
        const t = i / m;
        P.push(add(add(p0, scl(d, len * t)), [wig[0] * len * 0.08 * Math.sin(t * PI), bend * len * t * t, wig[2] * len * 0.08 * Math.sin(t * PI)]));
        R.push(r0 + (r1 - r0) * t);
      }
      tube(P, R, seg || 5, (i) => bri(col, 0.92 + 0.12 * (i % 2)), {});
      return P;
    };
    /* Stamm: leicht geneigt und gebogen, Wurzelanlauf, Furchen */
    const stem = (r0, r1, h, o) => {
      o = o || {};
      const n = o.n || 8, seg = o.seg || 10, fl = o.flare == null ? 0.6 : o.flare, lx = (rnd() - 0.5) * (o.lean || 0.05) * h, lz = (rnd() - 0.5) * (o.lean || 0.05) * h;
      const P = [], R = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        P.push([lx * t * t + Math.sin(t * 5 + v) * (o.wig || 0.01) * h, t * h - (i === 0 ? 0.04 : 0), lz * t * t + Math.cos(t * 4 + v) * (o.wig || 0.01) * h]);
        R.push((r0 + (r1 - r0) * t) * (1 + fl * Math.pow(1 - t, 6)));
      }
      tube(P, R, seg, o.col, { wob: o.wob, cap: o.cap });
      return { P, R, at: t => { const f = t * n, i = Math.min(n - 1, Math.floor(f)), u = f - i; return [P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u, P[i][2] + (P[i + 1][2] - P[i][2]) * u]; },
        rad: t => { const f = t * n, i = Math.min(n - 1, Math.floor(f)), u = f - i; return R[i] + (R[i + 1] - R[i]) * u; } };
    };
    /* Wurzelanläufe: kurze, flach auslaufende Röhren am Stammfuß */
    const roots = (r, nr, col) => {
      for (let i = 0; i < nr; i++) {
        const a = i / nr * 2 * PI + rnd() * 0.5 + v, d = [Math.cos(a), 0, Math.sin(a)], L = r * (1.6 + rnd() * 0.8);
        const P = [[d[0] * r * 0.3, r * 0.9, d[2] * r * 0.3], [d[0] * r * 0.8, r * 0.38, d[2] * r * 0.8], [d[0] * L, 0.02, d[2] * L]];
        tube(P, [r * 0.42, r * 0.3, r * 0.08], 5, () => bri(col, 0.9 + rnd() * 0.15), {});
      }
    };
    /* ein Blatt (kleines Dreieck), zur Außenseite N gewendet, leicht verdreht */
    const leafAt = (p, N, s, c, el, tilt) => {
      const m = nrm(add(N, scl(ru(), tilt == null ? 0.55 : tilt)));
      const e1 = nrm(crs(m, Math.abs(m[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), rot = rnd() * PI * 2;
      const u = add(scl(e1, Math.cos(rot)), scl(crs(m, e1), Math.sin(rot))), w = crs(m, u), L = s * (el || 1.25);
      /* Raute: Spitze, Seite, Stiel, Seite – runder als ein Dreieck, wirkt wie ein Blatt */
      const A = add(p, scl(u, L)), B = add(p, scl(w, s * 0.55)), C = add(p, scl(u, -L * 0.7)), D = add(p, scl(w, -s * 0.55));
      const n = nrm(add(N, scl(m, 0.3)));
      face(A, B, C, c, n, m); face(A, C, D, bri(c, 0.94), n, m);
    };
    /* Laubwolke: Ellipsoid (c, R) aus n Blättern der Größe s; Farben [hell, mittel, dunkel].
       Heißer Pfad (Tausende Blätter je Baum): reine Zahlen statt kleiner Felder, direkt in den Puffer */
    const cloud = (c, R, n, s, cols, o) => {
      o = o || {};
      if (lo) { n = Math.max(10, Math.round(n * 0.26)); s *= 1.75; }
      const ph = rnd() * 6.28, ph2 = rnd() * 6.28, lump = o.lump == null ? 0.2 : o.lump;
      const sh = (x, y, z) => 1 + lump * Math.sin(x * 3.3 + ph) * Math.cos(z * 2.9 + ph2) + lump * 0.6 * Math.sin(y * 4.1 + ph2);
      const cx = c[0], cy = c[1], cz = c[2], Rx = R[0], Ry = R[1], Rz = R[2];
      if (o.core !== false) {
        /* Kern: etwas dunkler als das Laub, rund, mit denselben Beulen wie die Blätter – Lücken zeigen Laubschatten
           statt Himmel oder schwarzer Löcher */
        const kc = o.coreK || 0.82, I = icoUnit(), cT = cc(cols[2]), cM = cc(cols[1]);
        const P = I.V.map(d => { const f = kc * sh(d[0], d[1], d[2]) * (1 + (rnd() - 0.5) * 0.1); return [cx + d[0] * Rx * f, cy + d[1] * Ry * f, cz + d[2] * Rz * f]; });
        /* weiche Normalen (Ellipsoid) – der Kern wirkt wie Laubschatten hinter den Blättern, nicht wie große Flächen */
        const Nn = I.V.map(d => nrm([d[0] / Rx, d[1] / Ry, d[2] / Rz]));
        for (const [i, j, l] of I.F) {
          const A = P[i], B = P[j], C = P[l], hy = (I.V[i][1] + I.V[j][1] + I.V[l][1]) / 3, q = rnd();
          const col = bri(mix(cT, cM, q * 0.45), (hy < -0.3 ? 0.52 : 0.7) * (0.88 + rnd() * 0.2));
          face3(A, B, C, col, Nn[i], Nn[j], Nn[l], nrm(sub(scl(add(add(A, B), C), 1 / 3), c)));
        }
      }
      const C0 = cc(cols[0]), C1 = cc(cols[1]), C2 = cc(cols[2]), SUN = o.sun != null ? cc(o.sun) : null;
      const tl = (o.tilt == null ? 0.55 : o.tilt) * 2, EL = o.el || 1.25, upN = o.upN || 0.15, Bs = o.basis || null, one = !!o.one;
      for (let i = 0; i < n; i++) {
        const yy = 1 - 2 * (i + rnd()) / n, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = i * 2.39996 + rnd() * 0.6;
        if (o.cutLow != null && yy < o.cutLow) continue;
        const dx = Math.cos(a) * rr, dy = yy, dz = Math.sin(a) * rr;
        const t = (0.86 + 0.2 * Math.sqrt(rnd())) * sh(dx, dy, dz);
        let px = cx + dx * Rx * t, py = cy + dy * Ry * t, pz = cz + dz * Rz * t;
        let Nx = dx / Rx, Ny = dy / Ry + upN, Nz = dz / Rz, l;
        if (Bs) {   /* gedrehte Wolke (Basis Bs = [x-Achse, y-Achse, z-Achse]) */
          const ox = px - cx, oy = py - cy, oz = pz - cz;
          px = cx + Bs[0][0] * ox + Bs[1][0] * oy + Bs[2][0] * oz; py = cy + Bs[0][1] * ox + Bs[1][1] * oy + Bs[2][1] * oz; pz = cz + Bs[0][2] * ox + Bs[1][2] * oy + Bs[2][2] * oz;
          const qx = Nx, qy = Ny, qz = Nz;
          Nx = Bs[0][0] * qx + Bs[1][0] * qy + Bs[2][0] * qz; Ny = Bs[0][1] * qx + Bs[1][1] * qy + Bs[2][1] * qz; Nz = Bs[0][2] * qx + Bs[1][2] * qy + Bs[2][2] * qz;
        }
        l = Math.sqrt(Nx * Nx + Ny * Ny + Nz * Nz); Nx /= l; Ny /= l; Nz /= l;
        /* Farbe: unten dunkel, Mitte gemischt, oben hell; selten ein Sonnenfleck */
        const hf = (yy + 1) / 2, q = rnd();
        let A0 = C2, A1 = C1, f = q * 0.5;
        if (hf >= 0.62) { A0 = C0; A1 = C1; f = q * 0.55; } else if (hf >= 0.3) { A0 = C1; A1 = q < 0.5 ? C2 : C0; f = q * 0.6; }
        let cr = A0[0] + (A1[0] - A0[0]) * f, cg = A0[1] + (A1[1] - A0[1]) * f, cb = A0[2] + (A1[2] - A0[2]) * f;
        if (q > 0.92 && SUN) { cr += (SUN[0] - cr) * 0.45; cg += (SUN[1] - cg) * 0.45; cb += (SUN[2] - cb) * 0.45; }
        const br = (0.86 + 0.4 * (t - 0.86)) * (0.92 + rnd() * 0.16);
        cr = Math.min(1, cr * br); cg = Math.min(1, cg * br); cb = Math.min(1, cb * br);
        /* Blattebene: Normale m = N + Zufall (zur Außenseite gekippt) */
        let mx = Nx + (rnd() - 0.5) * tl, my = Ny + (rnd() - 0.5) * tl, mz = Nz + (rnd() - 0.5) * tl;
        if (mx * Nx + my * Ny + mz * Nz < 0.25) { mx += Nx; my += Ny; mz += Nz; }
        l = Math.sqrt(mx * mx + my * my + mz * mz); mx /= l; my /= l; mz /= l;
        /* e1 ⟂ m, dann um m gedreht */
        let ex, ey, ez;
        if (Math.abs(my) < 0.9) { ex = -mz; ey = 0; ez = mx; } else { ex = 0; ey = mz; ez = -my; }
        l = Math.sqrt(ex * ex + ey * ey + ez * ez); ex /= l; ey /= l; ez /= l;
        const fx = my * ez - mz * ey, fy = mz * ex - mx * ez, fz = mx * ey - my * ex, rot = rnd() * 6.2832, co = Math.cos(rot), si = Math.sin(rot);
        const ux = ex * co + fx * si, uy = ey * co + fy * si, uz = ez * co + fz * si;
        const wx = my * uz - mz * uy, wy = mz * ux - mx * uz, wz = mx * uy - my * ux;
        const ss = s * (0.7 + rnd() * 0.6), L = ss * EL, W = ss * 0.55;
        let nx = Nx + mx * 0.3, ny = Ny + my * 0.3, nz = Nz + mz * 0.3; l = Math.sqrt(nx * nx + ny * ny + nz * nz); nx /= l; ny /= l; nz /= l;
        if (nF + 54 > F.length) { const G = new Float32Array(F.length * 2); G.set(F); F = G; }
        /* Raute A (Spitze), B, C (Stiel), D; (u, w, m) ist rechtshändig → A, B, C zeigt zu m */
        const Ax = px + ux * L, Ay = py + uy * L, Az = pz + uz * L, Bx = px + wx * W, By = py + wy * W, Bz = pz + wz * W;
        const Cx = px - ux * L * 0.7, Cy = py - uy * L * 0.7, Cz = pz - uz * L * 0.7, Dx = px - wx * W, Dy = py - wy * W, Dz = pz - wz * W;
        const w9 = (x, y, z, k2) => { F[nF++] = x; F[nF++] = y; F[nF++] = z; F[nF++] = nx; F[nF++] = ny; F[nF++] = nz; F[nF++] = cr * k2; F[nF++] = cg * k2; F[nF++] = cb * k2; };
        if (one) { w9(Ax, Ay, Az, 1); w9(Bx, By, Bz, 1); w9(Dx, Dy, Dz, 0.9); continue; }   /* Nadel: ein schmales Dreieck */
        w9(Ax, Ay, Az, 1); w9(Bx, By, Bz, 1); w9(Cx, Cy, Cz, 1);
        w9(Ax, Ay, Az, 0.94); w9(Cx, Cy, Cz, 0.94); w9(Dx, Dy, Dz, 0.94);
      }
    };
    const LC = [T.leaf2, T.leaf, T.leaf3];

    if (sp === "buche") {
      /* glatter, silbergrauer Stamm mit leichter Fleckung; steile Äste; dichte, breite, eiförmige Krone, frisches Grün */
      const h = H * 0.36, r = 0.12 * k + 0.03;
      const S = stem(r * 1.12, r * 0.82, h, { flare: 0.7, seg: 12, n: 6, col: (i, j) => bri(mix(mix(T.bark, 0x6f7a6a, 0.35), (i + j * 3) % 7 === 0 ? 0x6f7068 : T.base, ((i * 5 + j * 3) % 4) * 0.08), 0.95 + ((i * 7 + j * 11) % 5) * 0.03) });
      roots(r, 5, T.bark);
      const top = S.at(1), ends = [];
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26 + v + rnd() * 0.3, P = bough(S.at(0.86 + rnd() * 0.1), a, 1.0 + rnd() * 0.25, (0.6 + rnd() * 0.25) * k, r * 0.5, r * 0.18, 0.2, T.bark, 6);
        ends.push(P[P.length - 1]);
      }
      const cy = H * 0.64;
      cloud([top[0], cy, top[2]], [0.95 * k, 0.72 * k, 0.95 * k], 1000, 0.072 * k, LC, { lump: 0.16, sun: 0xb8d870 });
      ends.forEach((e, i) => cloud([e[0] * 1.15, Math.max(e[1] + 0.16 * k, H * 0.52), e[2] * 1.15], [0.48 * k, 0.4 * k, 0.48 * k], 220, 0.068 * k, LC, { lump: 0.22, sun: 0xb8d870 }));
      cloud([top[0] + 0.1 * k, H * 0.82, top[2] - 0.06 * k], [0.55 * k, 0.32 * k, 0.55 * k], 240, 0.068 * k, LC, { lump: 0.2, sun: 0xb8d870 });
    } else if (sp === "eiche") {
      /* kurzer, dicker Stamm mit tiefen Längsfurchen; knorrige, weit ausladende Äste mit Knick; unregelmäßige Krone mit Lücken */
      const big = sz >= 4, h = H * 0.34, r = (big ? 0.21 : 0.15) * k + 0.03;
      const S = stem(r * 1.18, r * 0.85, h, { flare: 0.9, seg: 12, n: 6, lean: 0.12, wig: 0.025,
        wob: (t, j) => 1 + ((j % 2) ? -0.07 : 0.05) * (1 - t * 0.3), col: (i, j) => j % 2 ? bri(T.mark, 0.9 + ((i + j) % 3) * 0.06) : bri(T.bark, 0.95 + ((i * 3 + j) % 4) * 0.05) });
      roots(r, 6, T.base);
      const n = 5 + (big ? 1 : 0), ends = [];
      for (let i = 0; i < n; i++) {
        const a = i * (6.28 / n) + v + rnd() * 0.5, e = 0.32 + rnd() * 0.35, len = (0.7 + rnd() * 0.3) * k;
        const P = bough(S.at(0.84 + rnd() * 0.14), a, e, len, r * 0.55, r * 0.3, 0.25, T.bark, 6);
        const p = P[P.length - 1], Q = bough(p, a + (rnd() - 0.5) * 1.0, 0.7 + rnd() * 0.4, len * 0.55, r * 0.3, r * 0.12, 0.15, T.bark, 5);
        ends.push([p, Q[Q.length - 1]]);
      }
      const OC = [T.leaf2, T.leaf, T.leaf3];
      ends.forEach(([p, q], i) => {
        cloud([q[0], q[1] + 0.12 * k, q[2]], [(0.5 + rnd() * 0.12) * k, (0.36 + rnd() * 0.08) * k, (0.5 + rnd() * 0.12) * k], 270, 0.072 * k, OC, { lump: 0.26, sun: 0xa8c060 });
        cloud([(p[0] + q[0]) * 0.45, p[1] + 0.05 * k, (p[2] + q[2]) * 0.45], [0.36 * k, 0.26 * k, 0.36 * k], 120, 0.068 * k, OC, { lump: 0.26 });
      });
      cloud([0, H * 0.8, 0], [0.62 * k, 0.32 * k, 0.62 * k], 320, 0.072 * k, OC, { lump: 0.24, sun: 0xa8c060 });
    } else if (sp === "birke") {
      /* schlank, weiße Rinde mit schwarzen Querstrichen, Fuß dunkel und rissig; dünne, aufstrebende Äste, lichte Krone mit hängenden Zweigen */
      const h = H * 0.9, r = 0.07 * k + 0.02;
      const baseT = 0.14 + rnd() * 0.04, jag = j => baseT + ((j * 7 + v * 3) % 5) * 0.012;
      const S = stem(r * 1.12, r * 0.38, h, { flare: 0.35, seg: 10, n: 10, lean: 0.09, wig: 0.012,
        col: (i, j) => (i / 10 < jag(j)) ? ((j % 2) ? bri(T.mark, 1.4) : bri(T.base, 1 + (i % 2) * 0.1)) : bri(T.bark, 0.96 + ((i * 3 + j * 5) % 4) * 0.02) });
      /* schwarze Querstriche (Lentizellen): dünne, waagrechte Striche mit spitzen Enden, dicht auf der Rinde; oben mehr */
      for (let i = 0; i < (lo ? 18 : 64); i++) {
        const t = baseT + 0.03 + Math.pow(rnd(), 0.8) * 0.78, a0 = rnd() * 6.28, span = 0.3 + rnd() * 0.8, hh = (0.005 + rnd() * 0.008) * k, c = S.at(t), rr = S.rad(t) * 1.02 + 0.004;
        const m = 4, pt = (a, y) => [c[0] + Math.cos(a) * rr, c[1] + y, c[2] + Math.sin(a) * rr];
        for (let q = 0; q < m; q++) {
          const a1 = a0 + span * q / m, a2 = a0 + span * (q + 1) / m, t1 = hh * Math.sin(PI * q / m) + 0.0015, t2 = hh * Math.sin(PI * (q + 1) / m) + 0.0015;
          const nn = nrm([Math.cos((a1 + a2) / 2), 0, Math.sin((a1 + a2) / 2)]);
          face(pt(a1, -t1), pt(a2, -t2), pt(a2, t2), T.mark, nn); face(pt(a1, -t1), pt(a2, t2), pt(a1, t1), T.mark, nn);
        }
      }
      const ends = [];
      for (let i = 0; i < 6; i++) {
        const t = 0.42 + i * 0.09 + rnd() * 0.04, a = i * 2.3 + v + rnd() * 0.4;
        const P = bough(S.at(t), a, 0.75 + rnd() * 0.35, (0.5 - i * 0.04) * k, 0.028 * k + 0.006, 0.008 * k + 0.003, 0.1, T.bark, 5);
        ends.push(P[P.length - 1]);
      }
      const top = S.at(1); ends.push(top);
      const BC = [T.leaf2, T.leaf, T.leaf3];
      ends.forEach((e, i) => {
        const rr = (0.34 - i * 0.012) * k;
        cloud([e[0], e[1] + 0.05 * k, e[2]], [rr, rr * 1.2, rr], 210, 0.056 * k, BC, { lump: 0.36, sun: 0xd8e88a, coreK: 0.55, tilt: 0.8 });
        /* hängende Zweige mit Blättchen */
        for (let j = 0; j < (lo ? 2 : 5); j++) {
          const a = j * 1.26 + i + rnd() * 0.6, d0 = rr * (0.6 + rnd() * 0.4);
          let p = [e[0] + Math.cos(a) * d0, e[1] - rr * 0.1, e[2] + Math.sin(a) * d0];
          const L = (0.28 + rnd() * 0.22) * k, st = lo ? 3 : 6;
          tube([p, add(p, [Math.cos(a) * L * 0.12, -L * 0.5, Math.sin(a) * L * 0.12]), add(p, [Math.cos(a) * L * 0.24, -L, Math.sin(a) * L * 0.24])], [0.006 * k, 0.004 * k, 0.002], 3, () => 0x5a4a3c, {});
          for (let q = 0; q < st; q++) {
            const p2 = add(p, [Math.cos(a) * L * 0.04, -L / st, Math.sin(a) * L * 0.04]);
            const N = nrm([Math.cos(a), 0.2, Math.sin(a)]);
            leafAt(add(p2, scl(ru(), 0.02 * k)), N, 0.048 * k, bri(BC[(q + j) % 3], 0.9 + rnd() * 0.18), 1.3, 0.9);
            leafAt(add(p2, scl(ru(), 0.03 * k)), N, 0.042 * k, bri(BC[(q + j + 1) % 3], 0.9 + rnd() * 0.18), 1.3, 0.9);
            p = p2;
          }
        }
      });
    } else if (sp === "kiefer") {
      /* hoher, gerader Stamm: unten graubraun und grob gefurcht, oben fuchsrot und glatter; Krone nur oben – flache, schirmartige Nadelpolster */
      const h = H * 0.84, r = 0.1 * k + 0.02;
      const S = stem(r * 1.05, r * 0.5, h, { flare: 0.45, seg: 10, n: 10, lean: 0.08, wig: 0.012,
        wob: (t, j) => t < 0.45 ? 1 + ((j % 2) ? -0.06 : 0.04) : 1,
        col: (i, j) => { const t = i / 10; return t < 0.38 ? (j % 2 ? bri(T.mark, 0.75) : bri(T.base, 1 + (i % 2) * 0.08)) : t < 0.5 ? mix(T.base, T.bark, (t - 0.38) / 0.12) : bri(T.bark, 0.94 + ((i + j) % 3) * 0.05); } });
      for (let i = 0; i < 3 + sz; i++) {       /* abgestorbene Aststummel am Schaft */
        const t = 0.3 + rnd() * 0.35, a = rnd() * 6.28;
        bough(S.at(t), a, -0.1 + rnd() * 0.3, 0.16 * k, 0.018 * k + 0.006, 0.006 * k, 0, T.mark, 4);
      }
      const NC = [T.leaf2, T.leaf, T.leaf3];
      /* Nadelpolster: flache Wolke aus vielen schmalen, langen Nadelbüscheln, oben heller */
      const tuft = (c, rx, ry, n) => cloud(c, [rx, ry, rx], n, 0.042 * k, NC, { lump: 0.18, el: 2.7, tilt: 0.85, upN: 0.35, coreK: 0.62, sun: 0x7aa070 });
      const nb = 5 + Math.min(sz, 3);
      for (let i = 0; i < nb; i++) {
        const t = 0.68 + (i / nb) * 0.3, a = i * 2.4 + v * 1.3, e = 0.2 + rnd() * 0.45, len = (0.45 + rnd() * 0.3) * k * (1.1 - (i / nb) * 0.4);
        const P = bough(S.at(t), a, e, len, 0.04 * k, 0.015 * k, 0.15, T.bark, 5), q = P[P.length - 1], m2 = P[2];
        tuft([q[0], q[1] + 0.06 * k, q[2]], (0.32 + rnd() * 0.1) * k, 0.16 * k, 210);
        if (i % 2 === 0) tuft([m2[0], m2[1] + 0.05 * k, m2[2]], 0.2 * k, 0.1 * k, 70);
      }
      const top = S.at(1);
      tuft([top[0], top[1] + 0.1 * k, top[2]], 0.36 * k, 0.19 * k, 230);
      tuft([top[0] + 0.12 * k, top[1] + 0.26 * k, top[2] - 0.08 * k], 0.2 * k, 0.12 * k, 80);
    } else {
      /* Fichte: Quirle aus hängenden Ästen mit Nadelfransen um einen dunklen Kern; unten lang, oben kurz und aufrecht */
      const r = 0.08 * k + 0.02, hb = 0.2 * k, ht = H - hb;
      const S = stem(r * 1.3, r * 0.12, H * 0.88, { flare: 0.5, seg: 8, n: 6, lean: 0.02, wig: 0.004, col: (i, j) => j % 2 ? bri(T.mark, 0.95) : bri(T.bark, 0.95 + (i % 2) * 0.08) });
      const FC = [T.leaf2, T.leaf, T.leaf3];
      b.cone(0.4 * k, ht * 0.95, 9, bri(T.leaf3, 0.62), { y: hb + 0.05 * k, a0: v, nobot: true });
      const L = (lo ? 9 : 15) + Math.min(3, sz);
      for (let i = 0; i < L; i++) {
        const f = i / L, y = hb + f * (H * 0.86 - hb), len = (0.86 * Math.pow(1 - f, 0.95) + 0.08) * k, nb = Math.max(lo ? 4 : 5, Math.round((lo ? 6 : 8) * (1 - f * 0.4)));
        for (let j = 0; j < nb; j++) {
          const a = j * (2 * PI / nb) + i * 0.83 + v + (rnd() - 0.5) * 0.45, dir = [Math.cos(a), 0, Math.sin(a)];
          const droop = (0.3 - f * 0.28) * (0.8 + rnd() * 0.4), ll = len * (0.82 + rnd() * 0.32), w = (0.15 + 0.08 * (1 - f)) * k * (lo ? 1.3 : 1);
          const p0 = add(S.at(Math.min(1, y / (H * 0.88))), scl(dir, r * 0.5)), m = lo ? 2 : 4, Sp = [];
          for (let q = 0; q <= m; q++) { const t = q / m; Sp.push(add(p0, [dir[0] * ll * t, (-droop * (1.7 * t - 0.9 * t * t) + 0.03 * t) * ll + (rnd() - 0.5) * 0.02 * k, dir[2] * ll * t])); }
          if (f < 0.6) tube([Sp[0], Sp[m >> 1], Sp[m]], [0.014 * k, 0.009 * k, 0.003], 3, () => bri(T.bark, 0.8), {});
          const sd = nrm(crs(dir, [0, 1, 0]));
          const Nt = nrm([dir[0] * 0.6, 1, dir[2] * 0.6]), Nh = nrm([dir[0], -0.1, dir[2]]);
          const c0 = bri(FC[(i + j) % 3], 0.8 + 0.25 * f + rnd() * 0.12);
          for (const s of [1, -1]) {
            /* hängender Nadelvorhang, Unterkante fein gezackt (je Abschnitt zwei Zacken), nach außen gewendet */
            const E = Sp.map((P, q) => { const t = q / m, ww = w * (1 - 0.6 * t) * (0.8 + rnd() * 0.4); return add(add(add(P, scl(sd, s * ww * 0.75)), scl(dir, ww * 0.2)), [0, -ww * (0.6 + rnd() * 0.35), 0]); });
            const o = nrm(add(add(dir, scl(sd, s * 0.9)), [0, -0.15, 0]));
            for (let q = 0; q < m; q++) {
              const c = bri(c0, 0.9 + 0.05 * q);
              face(Sp[q], Sp[q + 1], E[q + 1], c, Nh, o); face(Sp[q], E[q + 1], E[q], bri(c, 0.95), Nh, o);
              const M = scl(add(E[q], E[q + 1]), 0.5), dz = w * (1 - 0.6 * q / m);
              if (!lo) face(E[q], M, add(scl(add(E[q], M), 0.5), [0, -dz * (0.2 + rnd() * 0.25), 0]), bri(c, 0.86), Nh, o);
              if (!lo) face(M, E[q + 1], add(scl(add(M, E[q + 1]), 0.5), [0, -dz * (0.2 + rnd() * 0.25), 0]), bri(c, 0.9), Nh, o);
              /* Oberseite: aufgestellte, hellere Nadeln */
              const U = add(add(scl(add(Sp[q], Sp[q + 1]), 0.5), scl(sd, s * dz * 0.75)), [0, w * 0.22, 0]);
              face(Sp[q], Sp[q + 1], U, bri(c, 1.14), Nt, nrm(add([0, 1, 0], scl(sd, s * 0.5))));
            }
          }
          /* helle Triebspitze */
          const tp = Sp[m];
          face(add(tp, scl(sd, 0.035 * k)), add(tp, scl(sd, -0.035 * k)), add(add(tp, scl(dir, 0.12 * k)), [0, 0.035 * k, 0]), bri(T.leaf2, 1.25), Nt, [0, 1, 0]);
        }
      }
      /* Leittrieb */
      const tp = S.at(1);
      for (let j = 0; j < 6; j++) {
        const a = j * 1.05 + v, d = [Math.cos(a), 0, Math.sin(a)], hh = (0.14 + (j % 2) * 0.06) * k;
        face(add(tp, scl(d, 0.035 * k)), add(tp, scl([-d[2], 0, d[0]], 0.03 * k)), add(add(tp, scl(d, 0.012 * k)), [0, hh, 0]), bri(T.leaf2, 1.3), nrm([d[0], 0.5, d[2]]), d);
        face(add(tp, scl(d, 0.035 * k)), add(tp, scl([d[2], 0, -d[0]], 0.03 * k)), add(add(tp, scl(d, 0.012 * k)), [0, hh, 0]), bri(T.leaf2, 1.15), nrm([d[0], 0.5, d[2]]), d);
      }
    }
    /* Grundkörper (Kerne, Kegel) aus b.v und die direkt geschriebenen Dreiecke zusammenlegen */
    const out = new Float32Array(b.v.length + nF);
    out.set(b.v); out.set(F.subarray(0, nF), b.v.length);
    b.v = out;
    return b;
  }
  /* Kulissenbaum (nicht einzeln gezeichnet, Tausende im Wald): dieselbe Gestalt und Farbe wie
     tree(sp, 1), aber nur ein paar Dutzend Dreiecke. Höhe = TREE_H[sp]. */
  function bgTree(sp, v) {
    v = v || 0;
    G3.seed(3850 + v * 11 + sp.length * 31);
    const b = new MB(), T = TREE_C[sp] || TREE_C.buche, H = TREE_H[sp] || 2.8;
    const tr = (r0, r1, h, c) => b.cyl(r0, r1, h, 5, c, { notop: true, nobot: true });
    if (sp === "birke") {
      tr(0.09, 0.04, H * 0.86, T.bark);
      b.box(0.11, 0.04, 0.03, T.mark, { y: H * 0.36, z: 0.065, nobot: true });
      b.cyl(0.1, 0.09, H * 0.15, 5, T.base, { notop: true, nobot: true });
      b.noise(0.14, () => {
        b.ico(0.4, [T.leaf, T.leaf2, T.leaf3][v % 3], { y: H * 0.6, x: 0.12, jitter: 0.45, flat: 1.5 });
        b.ico(0.34, T.leaf2, { y: H * 0.84, x: -0.05, z: -0.06, jitter: 0.45, flat: 1.45 });
        b.cone(0.16, 0.55, 4, T.leaf3, { x: -0.26, y: H * 0.6, rx: Math.PI, nobot: true });
      });
    } else if (sp === "kiefer") {
      tr(0.12, 0.07, H * 0.88, T.bark);
      tr(0.125, 0.1, H * 0.4, T.base);
      b.noise(0.12, () => {
        b.ico(0.62, T.leaf, { y: H * 0.9, jitter: 0.35, flat: 0.45 });
        b.ico(0.44, v % 2 ? T.leaf2 : T.leaf3, { x: 0.4, y: H * 0.78, z: 0.12 * (v - 1), jitter: 0.35, flat: 0.45 });
      });
    } else if (sp === "fichte") {
      tr(0.09, 0.08, 0.5, T.bark);
      b.noise(0.1, () => {
        const L = 3, hb = 0.3, ht = H - hb;
        for (let i = 0; i < L; i++) {
          const f = i / L, y = hb + f * ht * 0.82, rad = 0.8 * (1 - f) + 0.16;
          b.cone(rad, ht * 0.46, 7, i % 2 ? T.leaf2 : T.leaf, { y, a0: i * 0.6 + v, nobot: true });
        }
      });
    } else if (sp === "buche") {
      tr(0.13, 0.1, H * 0.4, T.bark);
      b.noise(0.12, () => {
        b.ico(0.86, [T.leaf, T.leaf2, T.leaf][v % 3], { y: H * 0.62, jitter: 0.22, flat: 1.05, bottom: T.leaf3, sx: 1.12, sz: 1.12 });
        b.ico(0.45, T.leaf3, { x: 0.45 * (v - 1), y: H * 0.45, z: 0.3, jitter: 0.25 });
      });
    } else if (sp === "eiche") {
      tr(0.2, 0.15, H * 0.4, T.bark);
      b.noise(0.14, () => {
        b.ico(0.72, T.leaf, { x: -0.38, y: H * 0.7, z: 0.15 * (v - 1), jitter: 0.38, flat: 0.68, bottom: T.leaf3 });
        b.ico(0.66, v % 2 ? T.leaf2 : T.leaf3, { x: 0.42, y: H * 0.66, z: -0.12, jitter: 0.38, flat: 0.7 });
      });
    } else {
      tr(0.12, 0.09, H * 0.44, T.bark);
      b.cyl(0.13, 0.13, 0.04, 5, T.mark, { y: H * 0.2, notop: true, nobot: true });
      b.noise(0.12, () => b.ico(0.66, T.leaf, { y: H * 0.68, jitter: 0.25, flat: 1.2, bottom: T.leaf3 }));
      /* v70: runde Kirschen statt eckiger Blüten */
      for (let i = 0; i < 4; i++) { const a = i * 1.57 + v, e = (i % 2) * 0.5; b.sphere(0.085, 7, 4, i % 2 ? 0x9a1422 : T.fruit, { x: Math.cos(a) * Math.cos(e) * 0.64, y: H * 0.68 + Math.sin(e) * 0.74, z: Math.sin(a) * Math.cos(e) * 0.64, smooth: true }); }
    }
    return b;
  }
  /* Baumstumpf mit Jahresringen */
  function stump(sp, sz) {
    G3.seed(3400 + sz);
    const b = new MB(), T = TREE_C[sp] || TREE_C.buche, k = TH[sz] || 1;
    const r = (sp === "eiche" ? 0.2 : 0.14) * k + 0.04;
    /* v152: Rinde wie am stehenden Baum (treebark.js), oben die helle Schnittfläche mit Jahresringen */
    let ok = false;
    if (typeof TBARK !== "undefined") { try { b.merge(TBARK.trunk(sp, sz, 0, [r * 1.15, r, 0.28, 0], { lod: 2 }), {}); ok = true; } catch (e) { /* alt */ } }
    if (ok) b.cyl(r * 0.94, r * 0.94, 0.006, 14, 0xe6c99a, { y: 0.28, nobot: true });
    else b.cyl(r * 1.15, r, 0.28, 8, T.bark, { top: 0xe6c99a });
    b.cyl(r * 0.6, r * 0.6, 0.006, 8, 0xc9a674, { y: ok ? 0.286 : 0.28, nobot: true });
    b.cyl(r * 0.25, r * 0.25, 0.008, 8, 0xb48a5a, { y: ok ? 0.287 : 0.281, nobot: true });
    for (let i = 0; i < 3; i++) b.box(r * 1.1, 0.07, 0.08, T.bark, { x: Math.cos(i * 2.1) * r, y: 0.02, z: Math.sin(i * 2.1) * r, ry: -i * 2.1 });
    for (let i = 0; i < 4; i++) b.box(0.08, 0.03, 0.05, 0xd8b98a, { x: (rnd() - 0.5) * 1.2, y: 0.015, z: (rnd() - 0.5) * 1.2, ry: rnd() * 3 });
    return b;
  }
  function sapling(sp) {
    G3.seed(3500 + sp.length);
    const b = new MB(), T = TREE_C[sp] || TREE_C.buche;
    /* v152: gleiche Gestaltung wie die großen Bäume – Rindenfarbe der Art (Birke mit dunklem Fuß), Laubwolken bzw. Fichtenetagen */
    b.cyl(0.03, 0.02, 0.45, 6, sp === "kiefer" ? T.base : T.bark);
    if (sp === "birke") b.cyl(0.032, 0.03, 0.07, 6, T.base, { notop: true, nobot: true });
    if (sp === "fichte") { spruceLayer(b, 0.22, 0.18, 0.3, 0.3, pal(T, 0), false, 3); spruceLayer(b, 0.42, 0.12, 0.26, 0.9, pal(T, 1), false, 5); }
    else if (sp === "kiefer") { b.cone(0.18, 0.35, 6, T.leaf, { y: 0.25 }); b.cone(0.13, 0.28, 6, T.leaf2, { y: 0.45 }); }
    else { leafClump(b, [0, 0.48, 0], 0.16, pal(T, 0), { jitter: 0.3, seed: sp.length, vc: [0, 0.45, 0] }); leafClump(b, [0.1, 0.38, 0], 0.1, pal(T, 1), { jitter: 0.3, seed: sp.length + 2, vc: [0, 0.45, 0] }); }
    b.cyl(0.14, 0.14, 0.03, 8, 0x6e5233, { nobot: true });
    return b;
  }
  /* umgestürzter Baum (Windwurf): Stamm liegt längs der x-Achse */
  function fallen(sp, sz) {
    G3.seed(3600 + sz);
    const b = new MB(), T = TREE_C[sp] || TREE_C.buche, k = TH[sz] || 1;
    const len = (sp === "fichte" || sp === "kiefer" ? 2.6 : 2.0) * k, r = 0.13 * k;
    /* v152: liegender Stamm mit derselben Rinde wie stehend, Laub wie die Kronen (Farbverlauf, Volumenlicht) */
    let ok = false;
    if (typeof TBARK !== "undefined") { try { b.merge(TBARK.trunk(sp, sz, 0, [r, r * 0.6, len, 0], { lod: 2 }), { rz: -Math.PI / 2, y: r }); ok = true; } catch (e) { /* alt */ } }
    if (!ok) b.cyl(r, r * 0.6, len, 7, T.bark, { rz: -Math.PI / 2, y: r, top: 0xe6c99a });
    if (T.leaf2) {
      const cv = [len * 0.85, 0.3 * k, 0.15 * k];
      leafClump(b, [len * 0.9, 0.35 * k, 0], 0.6 * k, pal(T, 0), { flat: 0.55, jitter: 0.4, seed: sz * 3.1 + sp.length, vc: cv });
      leafClump(b, [len * 0.75, 0.3 * k, 0.4 * k], 0.42 * k, pal(T, 1), { flat: 0.55, jitter: 0.4, seed: sz * 3.1 + sp.length + 5, vc: cv });
    }
    /* Wurzelteller */
    b.cyl(0.45 * k, 0.45 * k, 0.12, 8, 0x5a3f28, { rz: Math.PI / 2, x: 0.02, y: 0.4 * k, top: 0x4a3322 });
    return b;
  }
  /* Holzstapel (Stämme) */
  function logPile(n, sp) {
    G3.seed(3700 + n);
    const b = new MB(), T = TREE_C[sp || "kiefer"];
    let i = 0;
    for (let row = 0; i < n && row < 4; row++) for (let j = 0; j < 4 - row && i < n; j++, i++)
      b.cyl(0.13, 0.13, 1.4, 7, T.bark, { rx: Math.PI / 2, x: -0.4 + j * 0.27 + row * 0.135, y: 0.13 + row * 0.23, z: -0.7, top: 0xe6c99a });
    return b;
  }

  /* ---------------------------- Waldboden ------------------------------- */
  function fern() {
    G3.seed(3800);
    const b = new MB();
    for (let i = 0; i < 7; i++) b.box(0.07, 0.02, 0.5, i % 2 ? 0x4f9a35 : 0x5fae3f, { ry: i * 0.9, rx: -0.5, y: 0.12, z: 0, c: true });
    return b;
  }
  function mushrooms(red) {
    G3.seed(3810);
    const b = new MB();
    [[0, 0, 1], [0.15, 0.1, 0.7], [-0.12, 0.08, 0.6]].forEach(([x, z, s]) => {
      b.cyl(0.03 * s, 0.03 * s, 0.12 * s, 6, 0xf2ead8, { x, z });
      b.sphere(0.09 * s, 8, 4, red ? 0xd8332b : 0xc28a4e, { x, y: 0.12 * s, z, sy: 0.6 });
      if (red) for (let k = 0; k < 3; k++) b.box(0.025, 0.012, 0.025, 0xffffff, { x: x + (k - 1) * 0.04 * s, y: 0.165 * s, z: z + 0.02 });
    });
    return b;
  }
  function deadLog() {
    G3.seed(3820);
    const b = new MB();
    b.cyl(0.16, 0.14, 1.6, 7, 0x6b5440, { rz: Math.PI / 2, y: 0.15, x: 0.8, top: 0xcfae80 });
    b.ico(0.12, 0x4f7f33, { x: 0.2, y: 0.28, flat: 0.5, jitter: 0.4 });
    return b;
  }
  /* ------------------------------- Büsche (v86) -------------------------------
     Sieben Typen (Tabelle: BUSH.TYPES in bushes.js). bush(id, v) baut Formvariante v (0…2) des Typs auf Nenngröße
     (Mitte der Höhen- und Breitenbereiche); Höhe/Breite je Busch kommen aus der Instanz-Skalierung.
     Alle aus wenigen Ikosaedern/Kegeln/Zylindern bzw. flachen Dreiecken (Farn) – gemeinsame Farbtabelle je Typ. */
  const BUSH_ORDER = ["round_shrub", "spreading_shrub", "evergreen_shrub", "fern_shrub", "berry_shrub", "young_shrub", "seasonal_shrub"];
  function bush(id, v) {
    v = v || 0;
    const T = BUSH.BY_ID[id];
    if (!T) return new MB();
    G3.seed(5200 + BUSH_ORDER.indexOf(id) * 131 + v * 17);
    const P = T.palette, b = new MB(), R = (a, c) => a + (c - a) * rnd(), pick = arr => arr[Math.floor(rnd() * arr.length) % arr.length];
    const blob = (r, c, x, y, z, o) => b.ico(r, c, Object.assign({ x, y, z, jitter: 0.35, flat: 0.85 }, o || {}));
    /* Zweig von (x,0,z) mit Neigung e (0 = waagrecht … 1,57 = senkrecht) in Richtung a; Rückgabe Spitze */
    const twig = (a, e, len, r, c, x0, y0, z0) => {
      x0 = x0 || 0; y0 = y0 || 0; z0 = z0 || 0;
      b.at({ x: x0, y: y0, z: z0, ry: -a }, () => b.cyl(r, r * 0.6, len, 5, c, { rz: -(Math.PI / 2 - e), notop: true, nobot: true }));
      return [x0 + Math.cos(a) * Math.cos(e) * len, y0 + Math.sin(e) * len, z0 + Math.sin(a) * Math.cos(e) * len];
    };
    /* Beere: Oktaeder (8 Dreiecke) */
    const berry = (x, y, z, r, c) => b.at({ x, y, z }, () => {
      const t = [0, r, 0], u = [0, -r, 0], q = [[r, 0, 0], [0, 0, r], [-r, 0, 0], [0, 0, -r]];
      for (let i = 0; i < 4; i++) { b.tri(t, q[(i + 1) % 4], q[i], c); b.tri(u, q[i], q[(i + 1) % 4], c); }
    });
    if (id === "round_shrub") {
      /* kompakt, kugelig bis abgeflacht: ein großes, drei bis vier mittlere, zwei bis vier kleine Volumen */
      const cs = [P.mid, P.mid, P.dark, P.light];
      blob(R(0.32, 0.37), P.mid, R(-0.03, 0.03), 0.3, R(-0.03, 0.03), { jitter: 0.3 });
      const n = 3 + (v % 2), a0 = rnd() * 6.28;
      for (let i = 0; i < n; i++) { const a = a0 + (i + R(-0.25, 0.25)) * 6.28 / n, d = R(0.15, 0.24); blob(R(0.2, 0.27), i % 2 ? P.dark : pick(cs), Math.cos(a) * d, R(0.17, 0.3), Math.sin(a) * d); }
      const m = 2 + Math.floor(rnd() * 3);
      for (let i = 0; i < m; i++) { const a = rnd() * 6.28, d = R(0.05, 0.3); blob(R(0.11, 0.16), i === 0 ? P.light : pick(cs), Math.cos(a) * d, R(0.42, 0.52), Math.sin(a) * d, { flat: 0.9 }); }
    } else if (id === "spreading_shrub") {
      /* niedrig und breit: seitlich ausladende, flache Cluster, dunkler Kern, einzelne sichtbare Äste */
      blob(0.3, P.dark, 0, 0.1, 0, { flat: 0.5, sx: 1.7, sz: 1.2, jitter: 0.3 });
      const n = 5 + (v % 2), a0 = rnd() * 6.28;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i + R(-0.2, 0.2)) * 6.28 / n, d = R(0.3, 0.52);
        blob(R(0.17, 0.26), i % 3 === 0 ? P.olive : P.mid, Math.cos(a) * d, R(0.1, 0.22), Math.sin(a) * d * 0.7, { flat: R(0.5, 0.65), sx: R(1.4, 1.9), sz: R(0.9, 1.25), ry: R(0, 3.1) });
      }
      blob(0.18, P.olive, R(-0.15, 0.15), R(0.26, 0.32), R(-0.1, 0.1), { flat: 0.55, sx: 1.4, ry: R(0, 3) });
      for (let i = 0; i < 3; i++) { const a = a0 + 0.8 + i * 2.1 + R(-0.3, 0.3); twig(a, R(0.35, 0.7), R(0.4, 0.55), 0.022, P.twig, Math.cos(a) * 0.12, 0.05, Math.sin(a) * 0.1); }
    } else if (id === "evergreen_shrub") {
      /* gestaffelte, leicht versetzte Zweigschichten mit gezackter Kontur – keine glatte Kegelform */
      b.cyl(0.035, 0.03, 0.18, 5, P.trunk, { nobot: true });
      const n = 4 + (v % 2), cs = [P.dark, P.fir, P.dark, P.light, P.fir];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), r = (0.42 - 0.3 * t) * R(0.9, 1.12);
        b.cone(r, R(0.3, 0.38), 6 + (i + v) % 2, cs[(i + v) % cs.length], { y: 0.12 + i * 0.15, x: R(-0.05, 0.05), z: R(-0.05, 0.05), ry: R(0, 3), sx: R(0.88, 1.15), sz: R(0.88, 1.15) });
      }
      for (let i = 0; i < 3; i++) { const a = R(0, 6.28); b.at({ x: Math.cos(a) * 0.26, y: 0.14 + R(0, 0.15), z: Math.sin(a) * 0.26, ry: -a }, () => b.cone(0.11, 0.3, 5, P.dark, { rz: -R(0.6, 0.9) })); }
      b.cone(0.07, 0.2, 5, P.light, { y: 0.12 + n * 0.15 + 0.02 });
    } else if (id === "fern_shrub") {
      /* Wedel aus einem Mittelpunkt: je Segment zwei Fiederblättchen (oben hell, unten dunkel), zwei Ebenen */
      const leaf = (p, q, side, w, top, bot) => {
        const m = [p[0] + (q[0] - p[0]) * 0.85, p[1] + (q[1] - p[1]) * 0.85 + 0.012, side * w];
        if (side > 0) { b.tri(p, m, q, top); b.tri(p, q, m, bot); } else { b.tri(p, q, m, top); b.tri(p, m, q, bot); }
      };
      const nf = 9 + (v % 2), a0 = rnd() * 6.28;
      for (let f = 0; f < nf; f++) {
        const a = a0 + (f + R(-0.2, 0.2)) * 6.28 / nf, inner = f % 3 === 0, len = (inner ? R(0.26, 0.34) : R(0.38, 0.5)), lift = inner ? 0.34 : 0.22, wd = R(0.07, 0.09);
        const top = f % 2 ? P.fresh : P.light, segs = 6;
        b.at({ ry: -a, y: 0.03 + (inner ? 0.04 : 0) }, () => {
          const pts = []; for (let i = 0; i <= segs; i++) { const t = i / segs; pts.push([t * len, lift * t * (1.15 - 0.75 * t), 0]); }
          for (let i = 0; i < segs; i++) {
            const w = wd * Math.sin(Math.PI * (i + 0.7) / (segs + 0.9)) + 0.012;
            leaf(pts[i], pts[i + 1], 1, w, top, P.dark); leaf(pts[i], pts[i + 1], -1, w, top, P.dark);
          }
          const e = pts[segs]; b.tri(e, [e[0] - 0.04, e[1] + 0.005, 0.02], [e[0] - 0.04, e[1] + 0.005, -0.02], top); b.tri(e, [e[0] - 0.04, e[1] + 0.005, -0.02], [e[0] - 0.04, e[1] + 0.005, 0.02], P.dark);
        });
      }
      blob(0.06, P.dark, 0, 0.04, 0, { flat: 0.7, jitter: 0.2 });
    } else if (id === "berry_shrub") {
      /* verzweigt, mitteldicht, wenige kleine Beeren (je Cluster zwei bis drei) */
      const n = 4 + (v % 2), a0 = rnd() * 6.28, cl = [];
      blob(R(0.17, 0.2), P.dark, 0, 0.24, 0, { jitter: 0.35 });
      cl.push([0, 0.3, 0, 0.19]);
      for (let i = 0; i < n; i++) {
        const a = a0 + (i + R(-0.2, 0.2)) * 6.28 / n, e = R(0.85, 1.25), len = R(0.32, 0.46), tip = twig(a, e, len, 0.02, P.twig);
        const rr = R(0.14, 0.2); blob(rr, i % 2 ? P.mid : P.dark, tip[0], tip[1] + 0.02, tip[2], { flat: 0.85 }); cl.push([tip[0], tip[1] + 0.02, tip[2], rr]);
        if (i % 2 === 0) blob(0.1, P.mid, tip[0] * 0.5, tip[1] * 0.55, tip[2] * 0.5, { flat: 0.9 });
      }
      cl.forEach(([x, y, z, r], i) => {
        const k = 2 + ((i + v) % 2);
        for (let j = 0; j < k; j++) { const an = rnd() * 6.28, up = R(0.2, 0.9), d = r * 0.98; berry(x + Math.cos(an) * d * (1 - up * 0.6), y + up * d * 0.8, z + Math.sin(an) * d * (1 - up * 0.6), 0.034, j % 2 ? P.berry : P.berry2); }
      });
    } else if (id === "young_shrub") {
      /* offen und luftig: dünne Triebe in verschiedene Richtungen, kleine Laubbüschel an den Spitzen und in halber Höhe */
      const n = 6 + (v % 2), a0 = rnd() * 6.28;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i + R(-0.3, 0.3)) * 6.28 / n, e = R(0.9, 1.45), len = R(0.35, 0.8) * (i % 3 === 0 ? 0.65 : 1), tip = twig(a, e, len, 0.016, P.twig, R(-0.04, 0.04), 0, R(-0.04, 0.04));
        blob(R(0.075, 0.12), i % 2 ? P.light : P.mid, tip[0], tip[1] + 0.02, tip[2], { flat: 0.75, jitter: 0.4 });
        const t = R(0.45, 0.65); blob(R(0.05, 0.08), i % 2 ? P.mid : P.light, tip[0] * t + R(-0.03, 0.03), tip[1] * t, tip[2] * t + R(-0.03, 0.03), { flat: 0.7, jitter: 0.4 });
      }
    } else if (id === "seasonal_shrub") {
      /* kompakt, klumpig: Cluster in Olivgrün, Goldgelb, Rost und Bronze */
      const seq = [P.gold, P.rust, P.olive, P.olive, P.gold, P.bronze, P.olive, P.gold];
      blob(R(0.24, 0.28), P.olive, 0, 0.24, 0, { jitter: 0.42, flat: 0.95 });
      const n = 6 + (v % 2), a0 = rnd() * 6.28;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i + R(-0.3, 0.3)) * 6.28 / n, d = R(0.1, 0.3), y = R(0.14, 0.46);
        blob(R(0.12, 0.2), seq[(i + v) % seq.length], Math.cos(a) * d * (1.3 - y), y, Math.sin(a) * d * (1.3 - y), { jitter: 0.45, flat: R(0.85, 1.1) });
      }
    }
    /* auf Nennmaß bringen: Höhe = Mitte des Höhenbereichs, größte Breite = Mitte des Breitenbereichs */
    const Hn = (T.h[0] + T.h[1]) / 2, Wn = (T.w[0] + T.w[1]) / 2;
    let xa = 1e9, xb = -1e9, za = 1e9, zb = -1e9, yb = 0;
    for (let i = 0; i < b.v.length; i += 9) { const x = b.v[i], y = b.v[i + 1], z = b.v[i + 2]; if (x < xa) xa = x; if (x > xb) xb = x; if (z < za) za = z; if (z > zb) zb = z; if (y > yb) yb = y; }
    const kw = Wn / Math.max(xb - xa, zb - za, 0.01), kh = Hn / Math.max(yb, 0.01);
    for (let i = 0; i < b.v.length; i += 9) { b.v[i] = (b.v[i] - (xa + xb) / 2) * kw; b.v[i + 1] = Math.max(0, b.v[i + 1] * kh); b.v[i + 2] = (b.v[i + 2] - (za + zb) / 2) * kw; }
    return b;
  }
  /* Grasbüschel (grass_tuft, v87): sechs bis acht schlanke, leicht gebogene Halme, je zwei Segmente (unten olivgrün, oben heller), beidseitig
     (Rückseite dunkler) – 36–48 Dreiecke, drei Varianten. Nennmaß 0,3 hoch, 0,26 breit (Instanz skaliert 0,75–1,35 × 0,85–1,5). */
  function grassTuft(v) {
    v = v || 0;
    G3.seed(5600 + v * 23);
    const P = BUSH.GRASS.palette, b = new MB(), R = (a, c) => a + (c - a) * rnd();
    const n = 6 + (v % 3), a0 = rnd() * 6.28;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i + R(-0.25, 0.25)) * 6.28 / n, h = R(0.22, 0.38) * (i % 3 === 0 ? 1.2 : 1), lean = R(0.06, 0.15), rb = R(0, 0.04);
      const ox = Math.cos(a), oz = Math.sin(a), px = -oz, pz = ox, w = R(0.05, 0.07);
      const at = (d, y, k) => [rb * ox + ox * d + px * k, y, rb * oz + oz * d + pz * k];
      const L = at(0, 0, -w / 2), Rr = at(0, 0, w / 2), ML = at(lean * 0.45, h * 0.55, -w * 0.32), MR = at(lean * 0.45, h * 0.55, w * 0.32), T = at(lean * 1.3, h, 0);
      const cLo = i % 2 ? P.mid : P.olive, cHi = i % 2 ? P.light : P.mid, dk = x => mix(x, 0x30401a, 0.35);
      b.tri(L, Rr, MR, cLo); b.tri(L, MR, ML, cLo); b.tri(ML, MR, T, cHi);
      b.tri(L, MR, Rr, dk(cLo)); b.tri(L, ML, MR, dk(cLo)); b.tri(ML, T, MR, dk(cHi));
    }
    return b;
  }
  function boulder(s) {
    G3.seed(3830 + Math.round(s * 10));
    const b = new MB();
    b.noise(0.12, () => { b.ico(0.6 * s, 0x9a948a, { y: 0.25 * s, jitter: 0.45, flat: 0.7 }); b.ico(0.35 * s, 0x8a847a, { x: 0.5 * s, y: 0.15 * s, z: 0.2 * s, jitter: 0.5, flat: 0.6 }); });
    b.ico(0.18 * s, 0x5f8a3a, { y: 0.55 * s, flat: 0.3, jitter: 0.5 });
    return b;
  }

  /* alte Kulissenbäume (nur noch für die Insel im See) */
  function bgPine(v) {
    G3.seed(3850 + v);
    const b = new MB(), c = [0x2c6236, 0x336e3d, 0x2f7a3a][v % 3];
    b.cyl(0.11, 0.08, 0.5, 5, 0x6b4a30, { notop: true, nobot: true });
    b.noise(0.12, () => { b.cone(0.8, 1.5, 6, c, { y: 0.35, nobot: true, a0: v }); b.cone(0.58, 1.3, 6, G3.shade(G3.col(c), 1.12), { y: 1.15, nobot: true, a0: v + 0.5 }); });
    return b;
  }
  function bgLeaf(v) {
    G3.seed(3860 + v);
    const b = new MB(), c = [0x4f9e35, 0x5c9e37, 0x468f2c, 0x6fb845][v % 4];
    b.cyl(0.13, 0.1, 1.2, 5, v % 4 === 3 ? 0x9b9a92 : 0x6b4a30, { notop: true, nobot: true });
    b.noise(0.14, () => b.ico(0.95, c, { y: 1.75, jitter: 0.3, flat: 0.9 }));
    return b;
  }
  function bgBirch(v) {
    G3.seed(3870 + v);
    const b = new MB();
    b.cyl(0.08, 0.06, 1.6, 5, 0xeeeae0, { notop: true, nobot: true });
    b.box(0.09, 0.03, 0.03, 0x2c2a28, { y: 0.6, z: 0.06 }); b.box(0.09, 0.03, 0.03, 0x2c2a28, { y: 1.1, z: 0.06, ry: 1.2 });
    b.noise(0.14, () => b.ico(0.6, v % 2 ? 0x8cc84b : 0xa2d35a, { y: 1.75, jitter: 0.35, flat: 1.2 }));
    return b;
  }

  /* --------------------------- Hof je Ausbaustufe ------------------------ */
  /* Wiese im Hof: Stufe 1 trocken und fleckig, danach sattes Grün */
  /* v56: G = Fläche (Welt, ganze Kacheln), B = Hof innerhalb des Zauns; außerhalb Wiese mit den
     Farben des Geländes (ground(x, z) → [r, g, b], gleiche Dreiecke – keine Kante am Rand) */
  function hofGround(G, B, stage, ground) {
    G3.seed(900);
    const b = new MB();
    const noise = (x, z) => Math.sin(x * 0.37 + z * 0.21) * 0.5 + Math.sin(x * 0.11 - z * 0.43) * 0.5 + Math.sin((x + z) * 0.9) * 0.15;
    for (let i = 0; i < G.x1 - G.x0; i++)
      for (let j = 0; j < G.z1 - G.z0; j++) {
        const x = G.x0 + i + 0.5, z = G.z0 + j + 0.5, v = noise(x, z);
        const inside = x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1;
        if (!inside && ground) {
          const xa = x - 0.5, za = z - 0.5, xb = xa + 1, zb = za + 1;
          b.triV([xa, 0, za], [xa, 0, zb], [xb, 0, zb], ground(xa, za), ground(xa, zb), ground(xb, zb));
          b.triV([xa, 0, za], [xb, 0, zb], [xb, 0, za], ground(xa, za), ground(xb, zb), ground(xb, za));
          continue;
        }
        let c;
        if (inside && stage <= 1) c = v > 0.55 ? 0xb5a46a : (i + j) % 2 ? 0x9cbf55 : 0x95b84f;
        else if (inside) c = (i + j) % 2 ? 0x8cc650 : 0x86c04b;
        else c = v > 0.35 ? C.grassD : v > -0.2 ? C.grass2 : C.grass;
        b.noise(0.05, () => b.plate(1.0, 1.0, c, { x, z }));
      }
    return b;
  }
  /* Weg: Stufe 1 Erde mit Unkraut, 2 Kies, 3+ Pflaster */
  /* v71: Dekowege – ein Feld (1 × 1, Mitte 0/0). mask: Nachbarweg im 1 Norden, 2 Osten, 4 Süden,
     8 Westen. Zum Nachbarn hin reicht der Belag bis an die Feldkante (nahtlos), sonst ist er
     etwas schmaler und hat einen Rand. */
  const WEG_C = {
    wegKies:     { base: 0xcfbf95, edge: 0xa3946f, dot: [0xe6dab8, 0xab9b76] },
    wegRinde:    { base: 0x6b4830, edge: 0x4a3222, dot: [0x93684a, 0x553824] },
    wegPflaster: { base: 0x948e84, edge: 0xd6cec0, st: [0xc8c0b2, 0xb6ae9f] },
    wegHolz:     { base: 0x4a3a2a, edge: 0x5e4630, pl: [0xb98b5a, 0xa77b4d] },
    wegPlatten:  { st: [0xbdb6a9, 0xa8a296], top: [0xcdc6b9, 0xb9b3a7] }
  };
  function decoWeg(k, mask) {
    const m = mask || 0;
    G3.seed(4700 + k.length * 7 + m);
    const b = new MB(), T = WEG_C[k] || WEG_C.wegKies;
    const N = m & 1, E = m & 2, S = m & 4, W = m & 8, I = 0.4, y = 0.021;
    if (k === "wegPlatten") {
      /* Trittplatten: eine in der Mitte, dazu je eine auf der Kante nach Osten und Süden (die
         Platte auf der Westkante legt das westliche Feld) – so liegen sie im halben Feld-Abstand */
      const slab = (x, z, r, i) => b.cyl(r, r * 0.96, 0.035, 7, T.st[i % 2], { x, z, y: y - 0.01, sx: 0.9 + rnd() * 0.2, ry: rnd() * 3, top: T.top[i % 2] });
      slab((rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.06, 0.27, 0);
      if (E) slab(0.5, (rnd() - 0.5) * 0.05, 0.19, 1);
      if (S) slab((rnd() - 0.5) * 0.05, 0.5, 0.19, 1);
      return b;
    }
    const x0 = W ? -0.5 : -I, x1 = E ? 0.5 : I, z0 = N ? -0.5 : -I, z1 = S ? 0.5 : I;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
    b.noise(k === "wegRinde" ? 0.1 : 0.05, () => b.plate(w, d, T.base, { x: cx, z: cz, y0: y }));
    if (k === "wegPflaster") {
      const nx = Math.max(1, Math.round(w / 0.5)), nz = Math.max(1, Math.round(d / 0.5)), sx = w / nx, sz = d / nz;
      b.noise(0.1, () => { for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++)
        b.plate(sx - 0.06, sz - 0.06, T.st[(i + j) % 2], { x: x0 + (i + 0.5) * sx, z: z0 + (j + 0.5) * sz, y0: y + 0.004 }); });
    } else if (k === "wegHolz") {
      /* Bohlen quer zur Laufrichtung */
      const alongX = (E || W) && !(N || S), n = Math.max(3, Math.round((alongX ? w : d) / 0.17)), step = (alongX ? w : d) / n;
      b.noise(0.12, () => { for (let i = 0; i < n; i++) {
        const c = T.pl[i % 2];
        if (alongX) b.box(step - 0.025, 0.03, d - 0.02, c, { x: x0 + (i + 0.5) * step, y, z: cz });
        else b.box(w - 0.02, 0.03, step - 0.025, c, { x: cx, y, z: z0 + (i + 0.5) * step });
      } });
    } else {
      /* Kies und Rindenmulch: ein paar Steinchen bzw. Holzstückchen */
      for (let i = 0; i < 6; i++) {
        const px = cx + (rnd() - 0.5) * (w - 0.12), pz = cz + (rnd() - 0.5) * (d - 0.12), c = T.dot[i % 2];
        if (k === "wegRinde") b.box(0.1, 0.012, 0.045, c, { x: px, y: y + 0.002, z: pz, ry: rnd() * 3 });
        else b.ico(0.035, c, { x: px, y: y + 0.006, z: pz, flat: 0.45, jitter: 0.3 });
      }
    }
    /* Rand nur an offenen Seiten: Bordstein (Pflaster), Kantholz (Holz), sonst ein dunkler Saum */
    const e = 0.07, high = k === "wegPflaster" || k === "wegHolz", eh = high ? 0.045 : 0.006, ey = high ? y - 0.005 : y + 0.003;
    const edge = (ex, ez, ew, ed) => high ? b.box(ew, eh, ed, T.edge, { x: ex, y: ey, z: ez }) : b.plate(ew, ed, T.edge, { x: ex, z: ez, y0: ey });
    if (!N) edge(cx, z0 + e / 2, w, e);
    if (!S) edge(cx, z1 - e / 2, w, e);
    if (!W) edge(x0 + e / 2, cz, e, d);
    if (!E) edge(x1 - e / 2, cz, e, d);
    return b;
  }
  function hofPath(w, d, stage) {
    G3.seed(910 + w * 3 + d + stage);
    const b = new MB();
    if (stage <= 1) {
      b.noise(0.1, () => b.plate(w, d, 0xb59b6e, { y0: 0.02 }));
      for (let i = 0; i < w * d * 0.6; i++) b.ico(0.08, rnd() < 0.5 ? 0x7faa45 : 0x6f9a3a, { x: (rnd() - 0.5) * (w - 0.2), y: 0.03, z: (rnd() - 0.5) * (d - 0.2), flat: 0.6, jitter: 0.5 });
    } else if (stage === 2) {
      b.noise(0.06, () => b.plate(w, d, C.gravel, { y0: 0.02 }));
      for (let i = 0; i < w * d * 1.5; i++) b.ico(0.05, 0xc2b28a, { x: (rnd() - 0.5) * (w - 0.2), y: 0.02, z: (rnd() - 0.5) * (d - 0.2), flat: 0.4 });
    } else {
      b.plate(w, d, 0x9a948a, { y0: 0.018 });
      b.noise(0.12, () => {
        for (let x = -w / 2 + 0.25; x < w / 2 - 0.05; x += 0.5)
          for (let z = -d / 2 + 0.25; z < d / 2 - 0.05; z += 0.5)
            b.plate(0.44, 0.44, rnd() < 0.5 ? 0xc8c0b2 : 0xb8b0a2, { x: x + (Math.round(z * 2) % 2 ? 0.12 : 0), z, y0: 0.026 });
      });
    }
    return b;
  }
  /* Zaun: Stufe 1 morsch und lückenhaft, 2 frisch, 3 weiß gestrichen */
  function hofFence(b, x0, z0, x1, z1, stage, seedK) {
    G3.seed(990 + seedK);
    if (stage <= 1) {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const ax = x0 + (x1 - x0) * t0, az = z0 + (z1 - z0) * t0, bx = x0 + (x1 - x0) * t1, bz = z0 + (z1 - z0) * t1;
        const r = rnd();
        if (r < 0.14) continue;                                   /* Lücke */
        const post = r < 0.3 ? 0x6a5a48 : 0x7a6550;
        b.box(0.09, 0.55, 0.09, post, { x: ax, z: az, rz: (rnd() - 0.5) * 0.25, rx: (rnd() - 0.5) * 0.25 });
        if (r < 0.24) continue;                                   /* nur der Pfosten steht noch */
        const ang = Math.atan2(bz - az, bx - ax), l = Math.hypot(bx - ax, bz - az);
        b.at({ x: (ax + bx) / 2, z: (az + bz) / 2, ry: -ang }, () => {
          b.box(l, 0.06, 0.04, 0x9a8466, { y: 0.26, rz: r > 0.8 ? 0.25 : 0 });
          if (r < 0.7) b.box(l, 0.06, 0.04, 0x9a8466, { y: 0.45 });
        });
      }
      return;
    }
    const o = stage === 2 ? { step: 1.0, h: 0.62, post: 0x8a5a34, rail: 0xcf9a62 } : { step: 1.0, h: 0.7, post: 0xf6f1e6, rail: 0xfaf7f0 };
    FM.fenceLine(b, x0, z0, x1, z1, o);
  }

  /* ------------------------------ Gelände ------------------------------- */
  /* Gitter mit Farbe je Eckpunkt: weiche Übergänge Wiese → Waldboden → Sand */
  function terrain(x0, z0, x1, z1, cell, colFn) {
    const b = new MB();
    const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell);
    const C0 = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) C0.push(colFn(x0 + i * cell, z0 + j * cell));
    const c = (i, j) => C0[j * (nx + 1) + i];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const xa = x0 + i * cell, xb = xa + cell, za = z0 + j * cell, zb = za + cell;
      b.triV([xa, 0, za], [xa, 0, zb], [xb, 0, zb], c(i, j), c(i, j + 1), c(i + 1, j + 1));
      b.triV([xa, 0, za], [xb, 0, zb], [xb, 0, za], c(i, j), c(i + 1, j + 1), c(i + 1, j));
    }
    return b;
  }
  /* =========================================================================
     v75: Wegenetz. Ein Weg ist eine Polylinie (geglättet), seine Enden sind Knoten:
       – Mündung (o.mouth): das Ende liegt an der Bordsteinkante. Kanten-Snap (snapEnd): die
         letzten Meter laufen genau senkrecht auf die Kante zu; je Seite eine Ausrundung (fillet),
         deren Tangentenlänge aus dem Winkel berechnet wird (t = r / tan(θ/2)); davor auf dem
         Asphalt ein weicher Staubfächer (Vertex-Farben von Kies zu Asphalt).
       – Abzweig (o.tee): das Ende liegt auf der Mittellinie eines anderen Weges – Ausrundungen
         zwischen den beiden Wegkanten, egal in welchem Winkel (T- und Y-Kreuzung).
       – Steg/Brückenkopf (o.snap mit Richtung): das Ende wird auf den Knotenpunkt gelegt und läuft
         in dessen Achse an.
       – sonst: runde Kappe (oder gerade abgeschnitten, z. B. am Tor).
     Ränder (o.gnd = Bodenfarbe je Punkt): statt eines harten dunklen Streifens ein Verlauf von
     Kiesbraun zur Bodenfarbe darunter – der Weg liegt sichtbar AUF dem Boden und „schwebt“ nicht.
     ========================================================================= */
  const WAY_COL = 0xb69a6a, WAY_RIM = 0x8f7c55;
  /* Dreiecke immer mit Normale nach oben (Reihenfolge wird geprüft), mit und ohne Farbverlauf */
  const up3 = (b, A, B, Cc, col) => { const k = (B[2] - A[2]) * (Cc[0] - A[0]) - (B[0] - A[0]) * (Cc[2] - A[2]); if (k > 0) b.tri(A, B, Cc, col); else b.tri(A, Cc, B, col); };
  const triUp = (b, A, B, Cc, ca, cb, cc) => { const k = (B[2] - A[2]) * (Cc[0] - A[0]) - (B[0] - A[0]) * (Cc[2] - A[2]); if (k > 0) b.triV(A, B, Cc, ca, cb, cc); else b.triV(A, Cc, B, ca, cc, cb); };
  const quadUp = (b, A, B, Cc, D, ca, cb, cc, cd) => { triUp(b, A, B, Cc, ca, cb, cc); triUp(b, A, Cc, D, ca, cc, cd); };
  const lerp3 = (a, c, t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t];
  const unit = (x, z) => { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
  /* weicher Rand zwischen zwei Punkten der Kante (a, c) mit Richtung nach außen (da, dc): innen ein schmaler,
     ruhiger Streifen (Randton, etwas zur Bodenfarbe hin gemischt – kein schwarzer „Schatten“), außen ein kurzer
     Verlauf genau in die Bodenfarbe. So bleibt die Kante im Low-Poly-Stil klar, aber der Weg liegt auf dem Boden. */
  const RIM_IN = 0.15, RIM_OUT = 0.15;
  function softEdge(b, a, c, da, dc, y, EC, gnd) {
    const m = (p, d, k) => [p[0] + d[0] * k, y, p[1] + d[1] * k];
    const A0 = m(a, da, 0), C0 = m(c, dc, 0), A1 = m(a, da, RIM_IN), C1 = m(c, dc, RIM_IN), A2 = m(a, da, RIM_IN + RIM_OUT), C2 = m(c, dc, RIM_IN + RIM_OUT);
    const g = q => G3.col(gnd(q[0], q[2])), gA1 = g(A1), gC1 = g(C1), tA = lerp3(EC, gA1, 0.3), tC = lerp3(EC, gC1, 0.3);
    quadUp(b, A0, C0, C1, A1, tA, tC, tC, tA);
    quadUp(b, A1, C1, C2, A2, tA, tC, g(C2), g(A2));
  }

  /* Band entlang einer Linie: ein durchgehender Streifen mit gemeinsamen Ecken (keine überlappenden
     Stücke – die flimmerten beim Zoomen), optional mit Rand und runden Enden.
     ey (v70): eigene Höhe für den Rand – liegt er unter allen Wegflächen, laufen Abzweige sauber ineinander.
     gnd (v75): Bodenfarbe je Punkt → weicher Rand (Verlauf vom Randton zur Bodenfarbe) */
  function ribbon(b, pts, w, color, y, edge, caps, ey, gnd) {
    const yE = ey != null ? ey : y - 0.004;
    const n = pts.length;
    if (n < 2) return;
    const N = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)];
      const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1;
      /* Gehrung: an Knicken etwas breiter, damit die Breite gleich bleibt (begrenzt) */
      let k = 1;
      if (i > 0 && i < n - 1) {
        const d1x = p[0] - a[0], d1z = p[1] - a[1], l1 = Math.hypot(d1x, d1z) || 1, d2x = c[0] - p[0], d2z = c[1] - p[1], l2 = Math.hypot(d2x, d2z) || 1;
        const cos = (d1x * d2x + d1z * d2z) / (l1 * l2);
        k = Math.min(1.6, 1 / Math.max(0.6, Math.sqrt((1 + cos) / 2)));
      }
      return [-dz / l * k, dx / l * k];
    });
    const at = (i, f) => [pts[i][0] + N[i][0] * f, y, pts[i][1] + N[i][1] * f];
    const hw = w / 2, soft = !!(gnd && edge != null), rimW = hw * 0.25;
    const EC = edge != null ? G3.col(edge) : null;
    const e1 = (i0, f) => { const q = at(i0, f); q[1] = yE; return q; };
    for (let i = 1; i < n; i++) {
      b.quad(at(i - 1, hw), at(i, hw), at(i, -hw), at(i - 1, -hw), color);
      if (edge == null) continue;
      if (soft) [1, -1].forEach(s => {
        const A = e1(i - 1, s * hw), B = e1(i, s * hw);
        softEdge(b, [A[0], A[2]], [B[0], B[2]], [N[i - 1][0] * s, N[i - 1][1] * s], [N[i][0] * s, N[i][1] * s], yE, EC, gnd);
      });
      else {
        b.quad(e1(i - 1, hw + rimW), e1(i, hw + rimW), e1(i, hw), e1(i - 1, hw), edge);
        b.quad(e1(i - 1, -hw), e1(i, -hw), e1(i, -hw - rimW), e1(i - 1, -hw - rimW), edge);
      }
    }
    if (!caps) return;
    /* runde Enden: Halbkreis in Laufrichtung nach außen (caps: true oder [Anfang, Ende]) */
    [[0, -1], [n - 1, 1]].forEach(([i, dir], e) => {
      if (Array.isArray(caps) && !caps[e]) return;
      const p = pts[i], nx = N[i][0], nz = N[i][1], l = Math.hypot(nx, nz) || 1, tx = nz / l * dir, tz = -nx / l * dir, seg = 10;
      const pt = (a, r, yy) => [p[0] + (nx / l * Math.cos(a) + tx * Math.sin(a)) * r, yy, p[1] + (nz / l * Math.cos(a) + tz * Math.sin(a)) * r];
      for (let k = 0; k < seg; k++) {
        const a0 = Math.PI * k / seg, a1 = Math.PI * (k + 1) / seg;
        if (edge != null) {
          if (soft) { const p0 = pt(a0, hw, yE), p1 = pt(a1, hw, yE); softEdge(b, [p0[0], p0[2]], [p1[0], p1[2]], unit(p0[0] - p[0], p0[2] - p[1]), unit(p1[0] - p[0], p1[2] - p[1]), yE, EC, gnd); }
          else up3(b, [p[0], yE, p[1]], pt(a0, hw + rimW, yE), pt(a1, hw + rimW, yE), edge);
        }
        up3(b, [p[0], y, p[1]], pt(a0, hw, y), pt(a1, hw, y), color);
      }
    });
  }
  /* Ausrundung in der Ecke Cn zwischen zwei Kanten. u1, u2 = Richtungen entlang der beiden Kanten, weg
     von der Ecke (Einheitsvektoren). Winkel θ zwischen ihnen → Tangentenlänge t = r / tan(θ/2), Mittelpunkt
     auf der Winkelhalbierenden im Abstand r / sin(θ/2). Gefüllt wird das Stück zwischen Ecke und Bogen
     (Wegfarbe, Höhe o.y), am Bogen ein weicher Rand ins Gras (Höhe o.yE, unter allen Wegflächen).
     Schmale Überlappstreifen entlang beider Kanten, damit an den Nähten nichts durchblitzt. */
  function fillet(b, Cn, u1, u2, r, o) {
    const cosT = Math.max(-0.985, Math.min(0.985, u1[0] * u2[0] + u1[1] * u2[1])), th = Math.acos(cosT);
    const t = r / Math.tan(th / 2), d = r / Math.sin(th / 2), bi = unit(u1[0] + u2[0], u1[1] + u2[1]);
    const O = [Cn[0] + bi[0] * d, Cn[1] + bi[1] * d];
    const T1 = [Cn[0] + u1[0] * t, Cn[1] + u1[1] * t], T2 = [Cn[0] + u2[0] * t, Cn[1] + u2[1] * t];
    const a1 = Math.atan2(T1[1] - O[1], T1[0] - O[0]);
    let da = Math.atan2(T2[1] - O[1], T2[0] - O[0]) - a1;
    while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const seg = Math.max(4, Math.ceil(Math.abs(da) / (Math.PI / 18)));
    const y = o.y, yE = o.yE, fc = o.col != null ? o.col : WAY_COL, EC = G3.col(o.rim != null ? o.rim : WAY_RIM);
    const K = [Cn[0], y + 0.0004, Cn[1]], P = k => { const a = a1 + da * k / seg; return [O[0] + Math.cos(a) * r, O[1] + Math.sin(a) * r]; };
    for (let k = 0; k < seg; k++) {
      const p0 = P(k), p1 = P(k + 1);
      up3(b, K, [p0[0], y + 0.0004, p0[1]], [p1[0], y + 0.0004, p1[1]], fc);
      /* v77: der Bogenrand liegt eine Spur ÜBER dem Rand des Weges (und am Abzweig über dem des Hauptweges):
         am Tangentenpunkt überlappen sich beide Ränder – lagen sie gleich hoch, gewann der äußere, grasfarbene
         Teil des Wegrands und es blitzte ein heller Keil ins Gras („Zacken“ an Mündungen und Abzweigen) */
      if (o.gnd) softEdge(b, p0, p1, unit(O[0] - p0[0], O[1] - p0[1]), unit(O[0] - p1[0], O[1] - p1[1]), Math.max(yE, o.yE2 || 0) + 0.0006, EC, o.gnd);
    }
    /* Überlapp: je Kante ein 0,06 breiter Streifen von der Ecke bis zum Tangentenpunkt, halb in den Weg hinein */
    [[u1, u2, t], [u2, u1, t]].forEach(([u, v, len]) => {
      const A = [Cn[0] - v[0] * 0.05, Cn[1] - v[1] * 0.05], B = [A[0] + u[0] * len, A[1] + u[1] * len], Cc = [B[0] + v[0] * 0.08, B[1] + v[1] * 0.08], D = [A[0] + v[0] * 0.08, A[1] + v[1] * 0.08];
      quadUp(b, [A[0], y + 0.0004, A[1]], [B[0], y + 0.0004, B[1]], [Cc[0], y + 0.0004, Cc[1]], [D[0], y + 0.0004, D[1]], G3.col(fc), G3.col(fc), G3.col(fc), G3.col(fc));
    });
    return { T1, T2, O, t };
  }
  /* Kanten-Snap: das Ende (end = 0 Anfang, 1 Ende) läuft auf den letzten L Einheiten genau in Richtung n
     (Einheitsvektor zum Knoten hin) an. Punkte in dieser Zone fallen weg, zwei neue liegen auf der Achse
     (der zweite hält die Glättung gerade). at: Knotenpunkt (sonst bleibt der Endpunkt). */
  function snapEnd(pts, end, L, n, at) {
    const P = end ? pts.slice() : pts.slice().reverse();
    const e = at ? [at[0], at[1]] : P[P.length - 1];
    P[P.length - 1] = e;
    let dir = n;
    if (!dir) { const q = P[P.length - 2]; dir = unit(e[0] - q[0], e[1] - q[1]); }
    while (P.length > 2) { const q = P[P.length - 2]; if ((e[0] - q[0]) * dir[0] + (e[1] - q[1]) * dir[1] < L) P.splice(P.length - 2, 1); else break; }
    P.splice(P.length - 1, 0, [e[0] - dir[0] * L, e[1] - dir[1] * L], [e[0] - dir[0] * L * 0.5, e[1] - dir[1] * L * 0.5]);
    return end ? P : P.reverse();
  }
  /* Mündung in die Straße: Ende p liegt am Bordstein, die Kante läuft in Richtung edge (Standard: Straße
     entlang x). Zwei Ausrundungen (Wegfarbe) und vor der Kante ein Staubfächer auf dem Asphalt. */
  function wayMouth(b, P, end, W, o) {
    const p = end ? P[P.length - 1] : P[0], q = end ? P[P.length - 2] : P[1];
    const t = unit(p[0] - q[0], p[1] - q[1]), e = o.mouthEdge || [1, 0], hw = W / 2, r = o.mouthR || 0.85;
    let nx = -e[1], nz = e[0]; if (nx * t[0] + nz * t[1] < 0) { nx = -nx; nz = -nz; }
    const dn = nx * t[0] + nz * t[1] || 1;
    [-1, 1].forEach(sd => {
      const sx = p[0] - t[1] * hw * sd, sz = p[1] + t[0] * hw * sd;
      const lam = -((sx - p[0]) * nx + (sz - p[1]) * nz) / dn, Cn = [sx + t[0] * lam, sz + t[1] * lam];
      let u2 = [e[0], e[1]]; if ((Cn[0] - p[0]) * u2[0] + (Cn[1] - p[1]) * u2[1] < 0) u2 = [-u2[0], -u2[1]];
      fillet(b, Cn, [-t[0], -t[1]], u2, r, o);
    });
    if (o.roadCol == null) return;
    /* Staubfächer: beginnt hinter dem Bordstein (o.curbW), 0,42 tief, höchstens 30 % Kiesfarbe; läuft zur Straßenfarbe aus */
    const base = G3.col(o.roadCol), dust = mix(o.roadCol, WAY_COL, 0.3), L = hw + r * 0.6, D = 0.42, c0 = o.curbW || 0.12, Y = 0.033;
    const pt = (u, v) => [p[0] + e[0] * u * L + nx * (c0 + v * D), Y, p[1] + e[1] * u * L + nz * (c0 + v * D)];
    const cw = (u, v) => { const k = Math.max(0, 1 - u * u) * (1 - v); return lerp3(base, dust, k * k * (3 - 2 * k)); };
    const NU = 10, NV = 3;
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const ua = -1 + 2 * i / NU, ub = -1 + 2 * (i + 1) / NU, va = j / NV, vb = (j + 1) / NV;
      quadUp(b, pt(ua, va), pt(ub, va), pt(ub, vb), pt(ua, vb), cw(ua, va), cw(ub, va), cw(ub, vb), cw(ua, vb));
    }
  }
  /* Abzweig: Ende p liegt auf der Mittellinie des Hauptweges M (geglättet, Breite mW). Für beide Seiten des
     Abzweigs: Schnitt der Seitenlinie mit der Kante des Hauptweges = Ecke, dort eine Ausrundung. */
  function wayTee(b, P, end, W, M, mW, o) {
    const p = end ? P[P.length - 1] : P[0], q = end ? P[P.length - 2] : P[1];
    const t = unit(p[0] - q[0], p[1] - q[1]), hw = W / 2, r = o.teeR || 0.7;
    /* nächster Punkt der Mittellinie des Hauptweges und die Richtung dort */
    const near = (x, z) => {
      let best = 1e9, F = null, m = null;
      for (let i = 1; i < M.length; i++) {
        const a = M[i - 1], c = M[i], dx = c[0] - a[0], dz = c[1] - a[1], l2 = dx * dx + dz * dz || 1;
        const k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), fx = a[0] + dx * k, fz = a[1] + dz * k, d = Math.hypot(x - fx, z - fz);
        if (d < best - 1e-6) { best = d; F = [fx, fz]; m = unit(dx, dz); }
      }
      return { F, m };
    };
    /* Ecke = Schnitt der Seitenlinie des Abzweigs mit der Kante des Hauptweges (Kante = Mittellinie + mW/2) */
    const corner = (sx, sz, F, m) => {
      let nM = [-m[1], m[0]]; if (nM[0] * (q[0] - F[0]) + nM[1] * (q[1] - F[1]) < 0) nM = [-nM[0], -nM[1]];
      const E0 = [F[0] + nM[0] * mW / 2, F[1] + nM[1] * mW / 2], dn = nM[0] * t[0] + nM[1] * t[1];
      if (Math.abs(dn) < 0.15) return null;                    /* fast parallel – kein sauberer Abzweig */
      const lam = -((sx - E0[0]) * nM[0] + (sz - E0[1]) * nM[1]) / dn;
      return [sx + t[0] * lam, sz + t[1] * lam];
    };
    const N0 = near(p[0], p[1]);
    if (!N0.F) return;
    [-1, 1].forEach(sd => {
      const sx = p[0] - t[1] * hw * sd, sz = p[1] + t[0] * hw * sd;
      let Cn = corner(sx, sz, N0.F, N0.m);
      if (!Cn) return;
      /* Richtung entlang der Kante weg vom Abzweig; dann die Kante dort neu messen, wo das Fillet anliegt
         (Mitte des Schenkels) – so liegt es auch an einer leicht gebogenen Kante sauber an */
      let u2 = [N0.m[0], N0.m[1]]; if ((Cn[0] - p[0]) * u2[0] + (Cn[1] - p[1]) * u2[1] < 0) u2 = [-u2[0], -u2[1]];
      const N1 = near(Cn[0] + u2[0] * r * 0.6, Cn[1] + u2[1] * r * 0.6), C1 = N1.F && corner(sx, sz, N1.F, N1.m);
      if (C1) { Cn = C1; u2 = [N1.m[0], N1.m[1]]; if ((Cn[0] - p[0]) * u2[0] + (Cn[1] - p[1]) * u2[1] < 0) u2 = [-u2[0], -u2[1]]; }
      fillet(b, Cn, [-t[0], -t[1]], u2, r, o);
    });
  }
  /* v77: Übergang in eine Fläche (Tor des Sägewerkshofs): auf den letzten F.L Einheiten läuft der Weg samt
     Rand in die Farbe der Fläche (F.col) aus – eine Schicht knapp über dem Weg, am Ende einfarbig wie der Schotter
     des Hofs. Vorher endete der Weg mit harter Kante und dunklem Rand mitten im Tor. */
  const YARD_COL = 0xbfb196;
  function wayFade(b, P0, end, W, F, y, gnd) {
    const P = end ? P0 : P0.slice().reverse(), n = P.length, hw = W / 2, L = F.L || 2;
    const T = G3.col(F.col != null ? F.col : YARD_COL), FC = G3.col(WAY_COL), EC = G3.col(WAY_RIM), Y = y + 0.0008;
    const S = new Array(n); S[n - 1] = 0;
    for (let i = n - 2; i >= 0; i--) S[i] = S[i + 1] + Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]);
    let i0 = n - 1; while (i0 > 0 && S[i0 - 1] < L) i0--;
    const pts = [], ss = [];
    if (i0 > 0) { const a = P[i0 - 1], c = P[i0], u = (S[i0 - 1] - L) / ((S[i0 - 1] - S[i0]) || 1); pts.push([a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u]); ss.push(L); }
    for (let i = i0; i < n; i++) { pts.push(P[i]); ss.push(S[i]); }
    const m = pts.length;
    if (m < 2) return;
    const N = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], c = pts[Math.min(m - 1, i + 1)], u = unit(c[0] - a[0], c[1] - a[1]); return [-u[1], u[0]]; });
    const K = s => { const t = Math.max(0, Math.min(1, 1 - s / L)); return t * t * (3 - 2 * t); };
    const at = (i, f) => [pts[i][0] + N[i][0] * f, Y, pts[i][1] + N[i][1] * f];
    const g = q => G3.col(gnd(q[0], q[2]));
    for (let i = 1; i < m; i++) {
      const k0 = K(ss[i - 1]), k1 = K(ss[i]), f0 = lerp3(FC, T, k0), f1 = lerp3(FC, T, k1);
      quadUp(b, at(i - 1, -hw), at(i, -hw), at(i, hw), at(i - 1, hw), f0, f1, f1, f0);
      if (!gnd) continue;
      [1, -1].forEach(sd => {
        const A0 = at(i - 1, sd * hw), B0 = at(i, sd * hw), A1 = at(i - 1, sd * (hw + RIM_IN)), B1 = at(i, sd * (hw + RIM_IN));
        const A2 = at(i - 1, sd * (hw + RIM_IN + RIM_OUT)), B2 = at(i, sd * (hw + RIM_IN + RIM_OUT));
        const tA = lerp3(lerp3(EC, g(A1), 0.3), T, k0), tB = lerp3(lerp3(EC, g(B1), 0.3), T, k1);
        quadUp(b, A0, B0, B1, A1, tA, tB, tB, tA);
        quadUp(b, A1, B1, B2, A2, tA, tB, g(B2), g(A2));
      });
    }
  }
  /* Polylinie glätten (Catmull-Rom), damit Wege und Bach weich laufen.
     v75: cen = zentripetal (Barry–Goldman, α = 0,5): kein Überschwingen, wenn kurze und lange Stücke
     aufeinander folgen – vorher schlug die Kurve vor einer kurzen geraden Einmündung kurz über das Ende hinaus
     und zurück, die Wegränder knickten dort ab („abgehackte“ Rundungen). Enden werden gespiegelt verlängert,
     damit der Weg am Ende genau in Richtung des letzten Stücks läuft. */
  function smoothLine(pts, n, cen) {
    if (pts.length < 3) return pts;
    const out = [], N = pts.length;
    for (let i = 0; i < N - 1; i++) {
      const p1 = pts[i], p2 = pts[i + 1];
      if (!cen) {
        const p0 = pts[Math.max(0, i - 1)], p3 = pts[Math.min(N - 1, i + 2)];
        for (let k = 0; k < n; k++) {
          const t = k / n, t2 = t * t, t3 = t2 * t;
          const f = (a, b2, c, d) => 0.5 * (2 * b2 + (-a + c) * t + (2 * a - 5 * b2 + 4 * c - d) * t2 + (-a + 3 * b2 - 3 * c + d) * t3);
          out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
        continue;
      }
      const p0 = i > 0 ? pts[i - 1] : [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]], p3 = i < N - 2 ? pts[i + 2] : [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
      const dt = (a, c) => Math.max(1e-4, Math.sqrt(Math.hypot(c[0] - a[0], c[1] - a[1])));
      const t0 = 0, t1 = t0 + dt(p0, p1), t2 = t1 + dt(p1, p2), t3 = t2 + dt(p2, p3);
      const L = (a, c, ta, tb, t) => [a[0] + (c[0] - a[0]) * (t - ta) / (tb - ta), a[1] + (c[1] - a[1]) * (t - ta) / (tb - ta)];
      for (let k = 0; k < n; k++) {
        const t = t1 + (t2 - t1) * k / n;
        const A1 = L(p0, p1, t0, t1, t), A2 = L(p1, p2, t1, t2, t), A3 = L(p2, p3, t2, t3, t);
        const B1 = L(A1, A2, t0, t2, t), B2 = L(A2, A3, t1, t3, t);
        out.push(L(B1, B2, t1, t2, t));
      }
    }
    out.push(pts[N - 1]);
    return out;
  }
  /* v75: Stützpunkte eines Weges nach dem Kanten-Snap – an der Straße läuft der Weg senkrecht an (Straße entlang x),
     an Knoten (Steg, Brückenkopf) in deren Achse. worldview braucht sie auch für Abzweige (die Kante des Hauptweges). */
  function wayRaw(pts, o) {
    let raw = pts;
    (o.mouth || []).forEach((on, k) => {
      if (!on || o.snapRoad === false) return;
      const e = k ? raw[raw.length - 1] : raw[0], q = k ? raw[raw.length - 2] : raw[1];
      raw = snapEnd(raw, k, (o.mouthR || 0.85) + 0.7, [0, e[1] > q[1] ? 1 : -1]);
    });
    (o.snap || []).forEach((S, k) => { if (S) raw = snapEnd(raw, k, S.L || 1.4, S.dir, S.at); });
    return raw;
  }
  /* v75: Hauptweg an einem Abzweig gerade ziehen: Q ist ein Stützpunkt (oft ein Knick), an dem ein anderer Weg
     beginnt. Davor und dahinter kommt je ein Punkt auf der mittleren Richtung dazu – die Glättung läuft dort gerade
     durch und die Ausrundungen des Abzweigs liegen sauber an der Wegkante (sonst blieb am Knick ein Grasspalt). */
  function wayStraightAt(pts, Q, L) {
    const i = pts.findIndex(r => Math.hypot(r[0] - Q[0], r[1] - Q[1]) < 0.05);
    if (i <= 0 || i >= pts.length - 1) return pts;
    const a = pts[i - 1], c = pts[i + 1], q = pts[i], d1 = unit(q[0] - a[0], q[1] - a[1]), d2 = unit(c[0] - q[0], c[1] - q[1]), m = unit(d1[0] + d2[0], d1[1] + d2[1]);
    const k = Math.min(L || 1.4, Math.hypot(q[0] - a[0], q[1] - a[1]) * 0.4, Math.hypot(c[0] - q[0], c[1] - q[1]) * 0.4);
    return pts.slice(0, i).concat([[q[0] - m[0] * k, q[1] - m[1] * k], q, [q[0] + m[0] * k, q[1] + m[1] * k]], pts.slice(i + 1));
  }
  /* Waldweg. o.y: Höhe (jeder Weg etwas anders – an Kreuzungen flimmert dann nichts),
     o.ends: [Anfang, Ende] laufen in eine kleine Lichtung mit Baumstamm-Bank aus,
     o.mouth: [Anfang, Ende] münden in die Straße (o.mouthR Radius, o.roadCol für den Staubfächer),
     o.tee: [Anfang, Ende] = { pts, w } Hauptweg, auf dessen Mittellinie das Ende liegt,
     o.snap: [Anfang, Ende] = { at, dir, L } Knoten (Steg, Brückenkopf), auf den das Ende ausgerichtet wird,
     o.gnd: Bodenfarbe je Punkt (weiche Ränder), o.prepared: pts sind schon durch wayRaw gelaufen */
  function forestPath(pts, w, o) {
    o = o || {};
    G3.seed(3900 + pts.length);
    const W = w || 1.7, y = o.y || 0.025, yE = o.ey != null ? o.ey : y - 0.004;
    const raw = o.prepared ? pts : wayRaw(pts, o);
    const b = new MB(), P = smoothLine(raw, 6, true);
    (o.ends || []).forEach((on, k) => {
      if (!on) return;
      const p = k ? P[P.length - 1] : P[0], q = k ? P[P.length - 2] : P[1];
      const dx = p[0] - q[0], dz = p[1] - q[1], l = Math.hypot(dx, dz) || 1;
      const cx = p[0] + dx / l * 0.6, cz = p[1] + dz / l * 0.6, R0 = W * 1.15, sg = 16;
      if (o.gnd) {
        /* v75: Lichtung mit weichem Rand wie die Wege */
        const EC = G3.col(WAY_RIM), PC = G3.col(0xa89064), Q = a => [cx + Math.cos(a) * R0, cz + Math.sin(a) * R0];
        for (let k2 = 0; k2 < sg; k2++) {
          const a0 = k2 / sg * Math.PI * 2, a1 = (k2 + 1) / sg * Math.PI * 2, q0 = Q(a0), q1 = Q(a1);
          triUp(b, [cx, y - 0.006, cz], [q0[0], y - 0.006, q0[1]], [q1[0], y - 0.006, q1[1]], PC, PC, PC);
          softEdge(b, q0, q1, [Math.cos(a0), Math.sin(a0)], [Math.cos(a1), Math.sin(a1)], y - 0.0065, lerp3(EC, PC, 0.4), o.gnd);
        }
      } else b.disc(R0, 14, 0xa89064, { x: cx, z: cz, y0: y - 0.006 });
      /* Bank aus einem halben Stamm am Rand der Lichtung */
      const bx = p[0] + dx / l * 1.5, bz = p[1] + dz / l * 1.5, ry = Math.atan2(dx, dz) + Math.PI / 2;
      b.at({ x: bx, z: bz, ry }, m => { m.cyl(0.2, 0.2, 1.3, 8, 0x8a6040, { rz: Math.PI / 2, x: 0.65, y: 0.2, top: 0xd8b07a }); [-0.45, 0.45].forEach(xx => m.box(0.14, 0.16, 0.3, 0x6b4a30, { x: xx })); });
    });
    b.noise(0.012, () => ribbon(b, P, W, WAY_COL, y, WAY_RIM, o.caps || true, yE, o.gnd));
    const fo = { y, yE, gnd: o.gnd, roadCol: o.roadCol, mouthR: o.mouthR, teeR: o.teeR, mouthEdge: o.mouthEdge };
    (o.fade || []).forEach((F, k) => { if (F) wayFade(b, P, k, W, F, y, o.gnd); });
    (o.mouth || []).forEach((on, k) => { if (on) wayMouth(b, P, k, W, fo); });
    (o.tee || []).forEach((T, k) => { if (T) wayTee(b, P, k, W, smoothLine(T.pts, 6, true), T.w || 1.8, Object.assign({}, fo, { yE2: T.ey || 0 })); });
    /* Laub und Steinchen auf dem Weg – v71: nicht auf Hofpflaster oder Straße (o.leafOk), abschaltbar (o.leaves) */
    for (let i = 0; i < P.length && o.leaves !== false; i++) {
      const p = P[Math.floor(rnd() * P.length)], lx = p[0] + (rnd() - 0.5) * 1.2, lz = p[1] + (rnd() - 0.5) * 1.2, c = rnd() < 0.5 ? 0xc49a52 : 0x9a8f7a, ry = rnd() * 3;
      if (o.leafOk && !o.leafOk(lx, lz)) continue;
      b.plate(0.14, 0.1, c, { x: lx, z: lz, ry, y0: Math.max(0.032, y + 0.006) });
    }
    return b;
  }

  /* ------------------------------- Bach ----------------------------------
     v75: Breite je Punkt (Verjüngung zur Quelle hin), Kiesufer mit weichem Übergang ins Gras,
     Quelle mit Felsen. o.taper = [Anfang, Ende]: Länge, auf der die Breite bis o.min (Anteil) schrumpft. */
  function creekScale(P, o) {
    const T = (o && o.taper) || [0, 0], mn = (o && o.min) || 0.4, n = P.length, L = [0];
    for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const tot = L[n - 1], ease = u => u * u * (3 - 2 * u);
    return L.map(s => {
      let f = 1;
      if (T[0] > 0 && s < T[0]) f = Math.min(f, mn + (1 - mn) * ease(s / T[0]));
      if (T[1] > 0 && tot - s < T[1]) f = Math.min(f, mn + (1 - mn) * ease((tot - s) / T[1]));
      return f;
    });
  }
  /* Band mit Breite je Punkt (w · f[i]); fade > 0: außen ein Verlauf zur Bodenfarbe (gnd) */
  function bandW(b, P, f, w, color, y, gnd, fade, onlyFade) {
    const n = P.length, cc = G3.col(color);
    const N = P.map((p, i) => { const a = P[Math.max(0, i - 1)], c = P[Math.min(n - 1, i + 1)]; const u = unit(c[0] - a[0], c[1] - a[1]); return [-u[1], u[0]]; });
    const at = (i, s) => [P[i][0] + N[i][0] * s, y, P[i][1] + N[i][1] * s];
    for (let i = 1; i < n; i++) {
      const h0 = w / 2 * f[i - 1], h1 = w / 2 * f[i];
      if (!onlyFade) b.quad(at(i - 1, h0), at(i, h1), at(i, -h1), at(i - 1, -h0), color);
      if (fade && gnd) [1, -1].forEach(s => {
        const A = at(i - 1, s * h0), B = at(i, s * h1), Cc = at(i, s * (h1 + fade)), D = at(i - 1, s * (h0 + fade));
        quadUp(b, A, B, Cc, D, cc, cc, G3.col(gnd(Cc[0], Cc[2])), G3.col(gnd(D[0], D[2])));
      });
    }
  }
  function creekBank(pts, o) {
    G3.seed(3910);
    const b = new MB(), P = smoothLine(pts, 6), f = creekScale(P, o);
    b.noise(0.06, () => bandW(b, P, f, 3.6, 0xb7a78a, 0.012, null, 0));
    if (o && o.gnd) bandW(b, P, f, 3.6, 0xb7a78a, 0.012, o.gnd, 0.35, true);
    for (let i = 0; i < P.length * 0.6; i++) {
      const k = Math.floor(rnd() * P.length), p = P[k], s = rnd() < 0.5 ? 1 : -1;
      b.ico((0.12 + rnd() * 0.12) * (0.6 + 0.4 * f[k]), rnd() < 0.5 ? 0x9a948b : 0xaaa498, { x: p[0] + s * (1.3 + rnd() * 0.5) * f[k], y: 0.05, z: p[1] + (rnd() - 0.5) * 0.8, flat: 0.55, jitter: 0.4 });
    }
    return b;
  }
  function creekWater(pts, o) {
    const b = new MB(), P = smoothLine(pts, 6), f = creekScale(P, o);
    bandW(b, P, f, 2.3, 0x3f8fc0, 0.03, null, 0);
    return b;
  }
  /* Quelle am Bachanfang: Kiesbett und Quelltopf (Weltkoordinaten, damit der Rand weich ins Gras läuft) */
  function springBed(x, z, gnd) {
    const b = new MB(), seg = 24, R1 = 2.2, R2 = 2.8, y = 0.0125, sand = G3.col(0xb7a78a);
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, wob = a => 1 + 0.08 * Math.sin(a * 3 + 1.3);
      const P = (a, r) => [x + Math.cos(a) * r * wob(a), y, z + Math.sin(a) * r * wob(a)];
      triUp(b, [x, y, z], P(a0, R1), P(a1, R1), sand, sand, sand);
      if (gnd) { const q0 = P(a0, R2), q1 = P(a1, R2); quadUp(b, P(a0, R1), P(a1, R1), q1, q0, sand, sand, G3.col(gnd(q1[0], q1[2])), G3.col(gnd(q0[0], q0[2]))); }
    }
    return b;
  }
  function springPool(x, z) {
    const b = new MB();
    b.disc(1.45, 18, 0x3f8fc0, { x, z, y0: 0.03, wob: 0.08 });
    return b;
  }
  /* Felsen hinter dem Quelltopf (lokal: der Bach läuft nach +x weg, die Felsen liegen bei −x) */
  function springRocks() {
    G3.seed(3975);
    const b = new MB(), g1 = 0x8f8a80, g2 = 0xa39e94, moss = 0x5f8a3a;
    b.noise(0.12, () => {
      b.ico(1.05, g1, { x: -1.7, y: 0.35, z: 0.1, flat: 0.75, jitter: 0.35 });
      b.ico(0.75, g2, { x: -1.35, y: 0.95, z: -0.55, flat: 0.8, jitter: 0.35 });
      b.ico(0.6, g1, { x: -1.2, y: 0.2, z: 1.15, flat: 0.7, jitter: 0.4 });
      b.ico(0.55, g2, { x: -0.9, y: 0.15, z: -1.35, flat: 0.65, jitter: 0.4 });
      b.ico(0.38, g1, { x: 0.1, y: 0.08, z: 1.5, flat: 0.6, jitter: 0.4 });
      b.ico(0.32, g2, { x: 0.3, y: 0.06, z: -1.45, flat: 0.6, jitter: 0.4 });
      /* Moospolster und Farn */
      b.ico(0.42, moss, { x: -1.9, y: 1.0, z: 0.25, flat: 0.45, jitter: 0.3 });
      b.ico(0.3, moss, { x: -1.0, y: 0.38, z: 1.25, flat: 0.45, jitter: 0.3 });
    });
    /* das Wasser rinnt über den vorderen Stein in den Topf */
    b.box(0.5, 0.04, 0.24, 0x6fb7e0, { x: -0.9, y: 0.5, z: 0.05, rz: -0.85 });
    b.box(0.3, 0.04, 0.16, 0xbfe4f6, { x: -0.62, y: 0.26, z: 0.03, rz: -0.6 });
    return b;
  }

  /* v72: Brücke als Teil des Weges. Länge 5,8 (vorher 3,1 – kürzer als Bach plus Ufer), leicht gewölbt:
     die Enden liegen auf Wegniveau und gehen mit Rampe in den Belag über; Balken, Pfosten und Geländer folgen
     der Wölbung; an beiden Enden ein Querbalken als Auflager. Lokale x-Achse = Gehrichtung. */
  function bridge() {
    G3.seed(3920);
    const b = new MB();
    const HL = 2.9, A = 0.3, h = x => 0.03 + A * (1 - (x / HL) * (x / HL)), sl = x => -2 * A * x / (HL * HL);
    const n = 19, pitch = 2 * HL / n;
    b.noise(0.1, () => { for (let i = 0; i < n; i++) { const x = -HL + (i + 0.5) * pitch; b.box(pitch - 0.02, 0.07, 2.0, i % 2 ? C.wood : C.woodL, { x, y: h(x), rz: Math.atan(sl(x)) }); } });
    /* Längsbalken unter dem Belag, folgen der Wölbung */
    [-0.88, 0.88].forEach(z => { for (let i = 0; i < n; i += 1) { const x = -HL + (i + 0.5) * pitch; b.box(pitch + 0.02, 0.1, 0.12, C.woodD, { x, y: h(x) - 0.1, z, rz: Math.atan(sl(x)) }); } });
    /* Auflager: Querbalken (Stamm) an den Enden */
    [-HL - 0.02, HL + 0.02].forEach(x => b.cyl(0.13, 0.13, 2.1, 8, C.woodD, { x, y: 0.1, z: -1.05, rx: Math.PI / 2, top: 0x7a5a38 }));
    /* Pfosten und Handlauf */
    const PX = [-2.6, -1.3, 0, 1.3, 2.6];
    [-1.02, 1.02].forEach(z => {
      PX.forEach(x => b.box(0.1, 0.62, 0.1, C.woodD, { x, y: h(x) - 0.02, z }));
      for (let i = 0; i < PX.length - 1; i++) {
        const xa = PX[i], xb = PX[i + 1], ya = h(xa) + 0.58, yb = h(xb) + 0.58, len = Math.hypot(xb - xa, yb - ya);
        const mx = (xa + xb) / 2, my = (ya + yb) / 2, ang = Math.atan2(yb - ya, xb - xa);
        b.box(len + 0.08, 0.07, 0.07, C.woodD, { x: mx, y: my, z, rz: ang, c: true });
        b.box(len, 0.05, 0.05, C.woodD, { x: mx, y: my - 0.26, z, rz: ang, c: true });
      }
    });
    return b;
  }
  /* v75: Angelsteg statt „Brücke ins Nichts“. Lokale x-Achse = vom Ufer (x = 0, Wegende) ins Wasser.
     Schmaler Laufsteg (1,15) und ein breiterer Kopf (0,75 × 2,0) – er endet mitten im Bach, das andere Ufer
     bleibt frei. Kein Geländer am Laufsteg (sonst sieht er aus wie eine Brücke), dafür Poller, Eimer und Angel. */
  function pier() {
    G3.seed(3951);
    const b = new MB(), LW = 1.3, LH = 0.95, L = LW + LH, top = 0.15;
    const deck = (x0, x1, w) => { const n = Math.max(1, Math.round((x1 - x0) / 0.27)), p = (x1 - x0) / n; for (let i = 0; i < n; i++) b.box(p - 0.025, 0.05, w, i % 2 ? C.wood : C.woodL, { x: x0 + (i + 0.5) * p, y: top - 0.05 }); };
    b.noise(0.1, () => { deck(0.12, LW, 1.1); deck(LW, L, 2.0); });
    /* Längsbalken und Querbalken unter dem Belag */
    [-0.42, 0.42].forEach(z => b.box(L - 0.1, 0.08, 0.1, C.woodD, { x: (L + 0.1) / 2, y: top - 0.13, z }));
    b.box(0.12, 0.08, 2.0, C.woodD, { x: LW + 0.05, y: top - 0.13 });
    b.box(0.12, 0.08, 2.0, C.woodD, { x: L - 0.06, y: top - 0.13 });
    /* Auflager am Ufer: ein Stamm quer, halb im Boden – der Weg endet genau hier */
    b.cyl(0.11, 0.11, 1.3, 8, C.woodD, { x: 0.06, y: 0.03, z: -0.65, rx: Math.PI / 2, top: 0x7a5a38 });
    /* Pfähle (stehen im Wasser, nur oben sichtbar) */
    /* v77: die Pfähle enden 5 mm unter dem Belag – vorher lagen ihre Köpfe genau in der Belagfläche und flimmerten
       (Z-Fighting, geprüft mit zcheck.js) */
    [[0.7, -0.5], [0.7, 0.5], [LW + 0.05, -0.92], [LW + 0.05, 0.92], [L - 0.06, -0.92], [L - 0.06, 0.92]].forEach(([x, z]) => b.cyl(0.06, 0.06, top + 0.25 - 0.055, 6, C.woodD, { x, y: -0.25, z }));
    /* Poller an den äußeren Ecken, Tau am einen */
    [[L - 0.08, -0.95], [L - 0.08, 0.95]].forEach(([x, z]) => { b.cyl(0.075, 0.075, 0.42, 7, 0x6a4a2e, { x, y: top - 0.02, z, top: 0x8a6a48 }); });
    b.cyl(0.085, 0.085, 0.06, 7, 0xd8c8a0, { x: L - 0.08, y: top + 0.26, z: 0.95 });
    /* Eimer und eine angelehnte Angel */
    b.cyl(0.11, 0.13, 0.2, 9, 0x6c8fa8, { x: LW + 0.35, y: top + 0.003, z: -0.6, top: 0x3f8fc0 });
    b.box(0.025, 0.025, 1.5, 0x5a4030, { x: LW + 0.5, y: top + 0.35, z: 0.25, rx: 0.5, ry: 0.4 });
    /* v125: klar als Angelsteg erkennbar – Schild mit Fisch, Laterne, Angeln mit Schnur und Pose, Fischeimer, Kiste mit Netz,
       Rettungsring, Ruderboot am Steg */
    const SG = 0xe9d6a8, FB = 0x3f8fc0;
    /* Schild am Stegbeginn (zeigt zum Weg, −x): Pfosten, Brett, Fisch aus Quadern */
    b.cyl(0.04, 0.04, 1.05, 6, C.woodD, { x: 0.42, y: top - 0.05, z: -0.72 });
    b.box(0.05, 0.36, 0.66, SG, { x: 0.42, y: top + 0.78, z: -0.72 });
    b.box(0.055, 0.045, 0.7, C.woodD, { x: 0.42, y: top + 1.12, z: -0.72 });
    b.box(0.03, 0.1, 0.3, FB, { x: 0.385, y: top + 0.88, z: -0.72 });
    b.box(0.03, 0.06, 0.1, 0x5ab0e0, { x: 0.385, y: top + 0.9, z: -0.72 });
    b.box(0.03, 0.14, 0.08, FB, { x: 0.385, y: top + 0.86, z: -0.5 });
    b.box(0.032, 0.03, 0.03, 0x1a1a1a, { x: 0.37, y: top + 0.93, z: -0.82 });
    b.box(0.03, 0.05, 0.5, 0xb55a3a, { x: 0.385, y: top + 0.77, z: -0.72 });
    /* Laterne auf Pfosten (nachts warm leuchtend) */
    b.cyl(0.035, 0.035, 0.95, 6, C.woodD, { x: 0.42, y: top - 0.05, z: 0.72 });
    b.box(0.13, 0.17, 0.13, 0xffd67d, { x: 0.42, y: top + 0.9, z: 0.72 });
    b.box(0.17, 0.035, 0.17, 0x2a2a2a, { x: 0.42, y: top + 1.07, z: 0.72 });
    b.box(0.17, 0.03, 0.17, 0x2a2a2a, { x: 0.42, y: top + 0.87, z: 0.72 });
    /* zwei Angeln in Haltern am Kopf, Schnur und rot-weiße Pose im Wasser */
    [[LW + 0.28, 0.82], [LW + 0.78, 0.86]].forEach(([x, z], i) => {
      b.box(0.05, 0.28, 0.05, C.woodD, { x, y: top, z: z - 0.04 });
      b.box(0.022, 0.022, 1.45, 0x6a4a2e, { x, y: top + 0.36, z: z + 0.5, rx: -0.32 });
      b.box(0.006, 0.55, 0.006, 0xe8e8e8, { x, y: top - 0.2, z: z + 1.15 });
      b.ico(0.032, 0xd8334a, { x, y: top - 0.16, z: z + 1.15 });
      b.ico(0.02, 0xffffff, { x, y: top - 0.12, z: z + 1.15 });
    });
    /* Fischeimer mit zwei Fischen, Kiste mit Netz */
    [[0.0, 0.09, 0x7fa8c0], [0.07, -0.1, 0xd9a24a]].forEach(([dz, rz, c]) => b.box(0.045, 0.15, 0.04, c, { x: LW + 0.32, y: top + 0.2, z: -0.6 + dz, rz }));
    b.box(0.34, 0.2, 0.26, 0xa87a46, { x: LW + 0.3, y: top, z: -0.15, ry: 0.2 });
    b.box(0.36, 0.03, 0.28, 0x7a5a38, { x: LW + 0.3, y: top + 0.2, z: -0.15, ry: 0.2 });
    b.box(0.26, 0.035, 0.2, 0x4f9a5a, { x: LW + 0.3, y: top + 0.235, z: -0.15, ry: 0.2 });
    /* Rettungsring flach am Kopf */
    for (let k = 0; k < 12; k++) { const an = k / 12 * Math.PI * 2; b.box(0.09, 0.035, 0.05, k % 2 ? 0xf2f2f2 : 0xd8334a, { x: L - 0.38 + Math.cos(an) * 0.15, y: top, z: -0.62 + Math.sin(an) * 0.15, ry: -an }); }
    /* Ruderboot am Steg (liegt im Wasser, Bug zeigt flussauf) */
    const bx = L - 0.55, bz = 1.55;
    b.box(0.58, 0.13, 1.5, 0x2d6f94, { x: bx, y: -0.07, z: bz });
    b.box(0.045, 0.16, 1.5, 0x2d6f94, { x: bx - 0.3, y: -0.03, z: bz });
    b.box(0.045, 0.16, 1.5, 0x2d6f94, { x: bx + 0.3, y: -0.03, z: bz });
    b.box(0.56, 0.16, 0.05, 0x2d6f94, { x: bx, y: -0.03, z: bz - 0.76 });
    b.box(0.56, 0.16, 0.05, 0x2d6f94, { x: bx, y: -0.03, z: bz + 0.76 });
    b.box(0.5, 0.03, 1.4, 0xcfa46a, { x: bx, y: 0.045, z: bz });
    b.box(0.5, 0.035, 0.16, 0xa87a46, { x: bx, y: 0.09, z: bz + 0.1 });
    b.box(0.015, 0.015, 0.9, 0x8a6a48, { x: bx + 0.18, y: 0.12, z: bz - 0.25, ry: 0.25 });
    b.box(0.01, 0.01, 0.8, 0xd8c8a0, { x: L - 0.2, y: top + 0.25, z: 1.1 });
    return b;
  }
  /* v73: Lieferkiste (Besondere Lieferung): Holzkiste mit Messingbeschlag und Schloss. Der Deckel ist ein eigenes
     Teil mit dem Gelenk im Ursprung (hinten), damit er beim Öffnen aufklappen kann. */
  /* v134: Innenleben der offenen Kiste – statt flacher Platten ein Münzhaufen aus vielen schrägen Münzen mit Edelsteinen,
     und die Deckel-Innenseite mit Holzrahmen, gepolstertem Futter (vier Kissen), Goldpaspel und Nieten */
  function chestHeap(b, gems) {
    const GC = [0xe8b830, 0xf6d24a, 0xd9a22a, 0xffe27a];
    b.box(0.76, 0.03, 0.48, 0x5a1420, { y: 0.435 });
    for (let i = 0; i < 74; i++) {
      const a = rnd() * 6.2832, rr = Math.sqrt(rnd()), x = Math.cos(a) * rr * 0.34, z = Math.sin(a) * rr * 0.2;
      const hgt = 0.1 * Math.pow(Math.max(0, 1 - (x * x / 0.1156 + z * z / 0.04)), 0.8);
      const c = GC[(rnd() * 4) | 0];
      b.cyl(0.062 + rnd() * 0.012, 0.062 + rnd() * 0.012, 0.014, 9, c, { x, z, y: 0.455 + hgt + rnd() * 0.012, rx: (rnd() - 0.5) * 0.9, rz: (rnd() - 0.5) * 0.9, ry: rnd() * 6.28, top: G3.shade(G3.col(c), 1.18) });
    }
    gems.forEach(([x, z, c, r]) => b.ico(r, c, { x, y: 0.455 + 0.1 * Math.pow(Math.max(0, 1 - (x * x / 0.1156 + z * z / 0.04)), 0.8) + r * 0.7, z, jitter: 0.12 }));
  }
  function lidInside(b, red, redHi, wood, gold) {
    [0.03, 0.61].forEach(z => b.box(0.92, 0.03, 0.06, wood, { y: -0.03, z, bot: G3.shade(G3.col(wood), 0.9) }));
    [-0.43, 0.43].forEach(x => b.box(0.06, 0.03, 0.52, wood, { x, y: -0.03, z: 0.32, bot: G3.shade(G3.col(wood), 0.9) }));
    b.box(0.80, 0.03, 0.54, red, { y: -0.042, z: 0.32, bot: red });
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => b.box(0.37, 0.024, 0.23, redHi, { x: sx * 0.195, z: 0.32 + sz * 0.13, y: -0.062, bot: redHi, top: red })));
    b.box(0.80, 0.014, 0.016, gold, { y: -0.07, z: 0.32, bot: gold });
    b.box(0.016, 0.014, 0.54, gold, { y: -0.07, z: 0.32, bot: gold });
    [-0.4, 0, 0.4].forEach(x => [-0.26, 0, 0.26].forEach(dz => b.ico(0.02, gold, { x, y: -0.07, z: 0.32 + dz, flat: 0.5 })));
  }
  function lootCrate() {
    G3.seed(3960);
    const b = new MB(), w = 0x9a6234, wd = 0x7a4a26, g = 0xe2b33a, gl = 0xf6d24a;
    /* v124: offen sichtbar – der Korpus ist innen hohl (Futter, Münzhaufen, Rahmenbretter), vorher schwarze Fläche */
    b.noise(0.1, () => {
      b.box(0.9, 0.44, 0.62, w, { top: 0xb98a52 });
      [0.12, 0.25, 0.38].forEach(y => b.box(0.905, 0.018, 0.625, wd, { y }));
      b.box(0.9, 0.06, 0.06, w, { y: 0.44, z: 0.28, top: wd });
      b.box(0.9, 0.06, 0.06, w, { y: 0.44, z: -0.28, top: wd });
      b.box(0.06, 0.06, 0.5, w, { y: 0.44, x: 0.42, top: wd });
      b.box(0.06, 0.06, 0.5, w, { y: 0.44, x: -0.42, top: wd });
    });
    chestHeap(b, [[-0.2, -0.08, 0xd8334a, 0.05], [0.04, 0.06, 0x3fa0e0, 0.055], [0.22, -0.05, 0x58d68d, 0.05], [-0.06, -0.13, 0xffe27a, 0.04]]);
    /* v77: Eckbeschläge 5 mm vor den Seitenflächen (lagen bündig darauf und flimmerten) */
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => b.box(0.08, 0.52, 0.08, g, { x: sx * 0.415, z: sz * 0.275, y: -0.01 }));
    [-0.22, 0.22].forEach(x => b.box(0.07, 0.505, 0.635, g, { x, y: -0.002 }));
    b.box(0.15, 0.17, 0.04, gl, { y: 0.27, z: 0.325 });
    b.box(0.05, 0.07, 0.05, 0x3a2412, { y: 0.32, z: 0.335 });
    return b;
  }
  function lootLid() {
    G3.seed(3961);
    const b = new MB(), w = 0x9a6234, wl = 0xb9783f, g = 0xe2b33a, gl = 0xf6d24a;
    b.noise(0.1, () => {
      b.box(0.92, 0.12, 0.64, w, { z: 0.32, bot: 0x9a6234 });
      b.box(0.84, 0.09, 0.56, wl, { y: 0.12, z: 0.32 });
    });
    lidInside(b, 0x9a2638, 0xc03a50, 0x7a4a26, g);
    [-0.22, 0.22].forEach(x => b.box(0.07, 0.125, 0.645, g, { x, z: 0.32 }));
    /* Stern auf dem Deckel */
    b.box(0.17, 0.02, 0.17, gl, { y: 0.205, z: 0.32, ry: 0.785 });
    b.box(0.17, 0.02, 0.17, gl, { y: 0.209, z: 0.32 });
    return b;
  }
  /* v74: Schatztruhe aus der Grube – dunkles Holz, Goldbeschläge, Edelsteine; Deckel stufig gewölbt, Scharnier im Ursprung */
  function goldChest() {
    G3.seed(3970);
    const b = new MB(), w = 0x7a4a26, wd = 0x5c3517, g = 0xe2b33a, gl = 0xf6d24a;
    /* v124: Korpus innen hohl mit rotem Futter, Rahmenbrettern und Münzhaufen (vorher schwarze Fläche) */
    b.noise(0.08, () => {
      b.box(0.9, 0.44, 0.62, w, { top: 0x8c2434 });
      [0.1, 0.22, 0.34].forEach(y => b.box(0.905, 0.018, 0.625, wd, { y }));
      b.box(0.9, 0.06, 0.06, w, { y: 0.44, z: 0.28, top: wd });
      b.box(0.9, 0.06, 0.06, w, { y: 0.44, z: -0.28, top: wd });
      b.box(0.06, 0.06, 0.5, w, { y: 0.44, x: 0.42, top: wd });
      b.box(0.06, 0.06, 0.5, w, { y: 0.44, x: -0.42, top: wd });
    });
    chestHeap(b, [[-0.22, -0.08, 0xd8334a, 0.055], [0.04, 0.07, 0x3fa0e0, 0.06], [0.24, -0.04, 0x58d68d, 0.055], [-0.04, -0.14, 0xffe27a, 0.045], [0.14, -0.12, 0xd8334a, 0.05]]);
    b.box(0.94, 0.06, 0.66, g, { y: 0.0 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => b.box(0.09, 0.54, 0.09, g, { x: sx * 0.41, z: sz * 0.27, y: -0.02 }));
    [-0.24, 0.24].forEach(x => b.box(0.08, 0.505, 0.635, g, { x, y: -0.002 }));
    b.box(0.17, 0.2, 0.04, gl, { y: 0.27, z: 0.325 });
    b.box(0.06, 0.08, 0.05, 0x3a2412, { y: 0.31, z: 0.335 });
    b.ico(0.06, 0xd8334a, { x: -0.33, y: 0.3, z: 0.325 });
    b.ico(0.06, 0x3fa0e0, { x: 0.33, y: 0.3, z: 0.325 });
    return b;
  }
  function goldLid() {
    G3.seed(3971);
    const b = new MB(), w = 0x7a4a26, wl = 0x93602f, g = 0xe2b33a, gl = 0xf6d24a;
    b.noise(0.08, () => {
      b.box(0.94, 0.1, 0.64, w, { z: 0.32, bot: w });
      b.box(0.94, 0.09, 0.52, wl, { y: 0.1, z: 0.32 });
      b.box(0.94, 0.08, 0.34, w, { y: 0.19, z: 0.32 });
    });
    /* v77: die Goldbänder stehen 6 mm über den Stufen (ihre Oberseiten lagen genau in den Stufenflächen) */
    [-0.24, 0.24].forEach(x => { b.box(0.08, 0.106, 0.65, g, { x, z: 0.32 }); b.box(0.08, 0.096, 0.53, g, { x, y: 0.1, z: 0.32 }); b.box(0.08, 0.086, 0.35, g, { x, y: 0.19, z: 0.32 }); });
    b.ico(0.08, 0x3fe09a, { y: 0.3, z: 0.32 });
    lidInside(b, 0x8c1c30, 0xb02c46, 0x5c3517, g);
    return b;
  }
  /* Lichtsäule (Zylinder, nach oben schmaler) und Bodenring – werden halbdurchsichtig gezeichnet */
  function lootBeam(r1, r2, h, col) {
    const b = new MB();
    b.cyl(r1, r2, h, 12, col || 0xfff1b0, { nobot: true, notop: true });
    return b;
  }
  function lootRing(r1, r2, col) {
    const b = new MB(), seg = 28, y = 0.04;
    const up3 = (A, B, C) => { const c = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]); if (c > 0) b.tri(A, B, C, col); else b.tri(A, C, B, col); };
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, P = (r, a) => [Math.cos(a) * r, y, Math.sin(a) * r];
      up3(P(r1, a0), P(r2, a0), P(r2, a1)); up3(P(r1, a0), P(r2, a1), P(r1, a1));
    }
    return b;
  }
  /* rot-weiße Schranke an gesperrten Wegen, mit Schild */
  function barrier() {
    G3.seed(3930);
    const b = new MB();
    b.box(0.12, 0.9, 0.12, 0x3a3a40, { x: -1.0 });
    for (let i = 0; i < 6; i++) b.box(0.34, 0.1, 0.1, i % 2 ? 0xffffff : 0xd8332b, { x: -0.8 + i * 0.34, y: 0.72 });
    b.box(0.08, 0.6, 0.08, 0x3a3a40, { x: 1.05 });
    b.box(0.7, 0.45, 0.04, 0xf6f1e6, { x: -1.0, y: 0.95, z: 0.07 });
    b.box(0.6, 0.06, 0.02, 0xd8332b, { x: -1.0, y: 1.28, z: 0.1 });
    b.box(0.1, 0.18, 0.02, 0x2a2a2e, { x: -1.0, y: 1.08, z: 0.1 });
    return b;
  }

  /* -------------------------------- See ---------------------------------- */
  const lakeR = (rx, rz, a) => { const w = 1 + 0.05 * Math.sin(3 * a + 0.7) + 0.03 * Math.sin(5 * a + 1.9); return [Math.cos(a) * rx * w, Math.sin(a) * rz * w]; };
  /* v145: Ufer wie am Teich – Wiese → trockener Sand → nasser Sand → Uferschlamm unter dem Wasserrand, Steine am Ufer */
  function lakeBand(b, rx, rz, d0, d1, c0, c1, y, seg) {
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      const P = (a, d) => { const p = lakeR(rx + d, rz + d, a); return [p[0], y, p[1]]; };
      const p00 = P(a0, d0), p01 = P(a1, d0), p10 = P(a0, d1), p11 = P(a1, d1);
      b.triV(p00, p11, p01, c0, c1, c0);
      b.triV(p00, p10, p11, c0, c1, c1);
    }
  }
  function lakeShore(rx, rz) {
    G3.seed(3940);
    const b = new MB(), seg = 128;
    lakeBand(b, rx, rz, 1.9, 0.8, 0x86bf4a, 0xc9b98c, 0.006, seg);        /* Wiese → trockener Sand */
    lakeBand(b, rx, rz, 0.8, 0.2, 0xc9b98c, 0xa89878, 0.008, seg);        /* Sand → nasser Sand */
    lakeBand(b, rx, rz, 0.2, -1.4, 0xa89878, 0x75704f, 0.01, seg);        /* Uferschlamm unter dem Wasserrand */
    for (let i = 0; i < 34; i++) {
      const a = rnd() * 6.28, p = lakeR(rx + 0.4 + rnd() * 0.9, rz + 0.4 + rnd() * 0.9, a);
      b.noise(0.1, () => b.ico(0.18 + rnd() * 0.22, rnd() < 0.5 ? 0xa9a39a : 0x8f8a82, { x: p[0], y: 0.04, z: p[1], jitter: 0.5, flat: 0.55 }));
    }
    return b;
  }
  /* v145: Wasser wie am Teich – tief und dunkel in der Mitte, türkis und hell zum Ufer hin; flache Stellen (sh: [[x, z, r], …] in
     Seekoordinaten: Schilf, Steinkante, Insel) werden heller, damit Schilf und Steine nicht mitten im tiefen Wasser stehen */
  const LAKE_F = [0, 0.35, 0.62, 0.82, 0.93, 1.0], LAKE_C = [0x174f7a, 0x1d5f8d, 0x2a7aa6, 0x3f96b4, 0x62adb4, 0x8cbca8];
  function lakeWater(rx, rz, sh) {
    const b = new MB(), seg = 128, NR = 18, shoals = sh || [];
    const grad = f => { let k = 0; while (k < LAKE_F.length - 2 && f > LAKE_F[k + 1]) k++; return mix(LAKE_C[k], LAKE_C[k + 1], Math.min(1, (f - LAKE_F[k]) / (LAKE_F[k + 1] - LAKE_F[k]))); };
    const fOf = i => i >= NR ? 1 : 1 - Math.pow(1 - i / NR, 1.6);
    const V = (a, i) => {
      const f = fOf(i), p = i >= NR ? lakeR(rx + 0.08, rz + 0.08, a) : lakeR(rx * f, rz * f, a);
      let c = grad(f), s = 0;
      shoals.forEach(([x, z, r]) => { const d2 = ((p[0] - x) * (p[0] - x) + (p[1] - z) * (p[1] - z)) / (r * r); s = Math.max(s, Math.exp(-d2)); });
      if (s > 0.01) c = mix(c, 0x6fb8b6, s * 0.75);
      return [[p[0], 0, p[1]], c];
    };
    const memo = new Map(), get = (i, j) => { const k = i * 1000 + (j % seg); let v = memo.get(k); if (!v) { v = V((j % seg) / seg * Math.PI * 2, i); memo.set(k, v); } return v; };
    for (let i = 0; i < NR; i++) for (let j = 0; j < seg; j++) {
      const A = get(i, j), B = get(i, j + 1), C2 = get(i + 1, j + 1), D = get(i + 1, j);
      if (i === 0) { b.triV([0, 0, 0], C2[0], D[0], grad(0), C2[1], D[1]); continue; }
      b.triV(A[0], B[0], C2[0], A[1], B[1], C2[1]);
      b.triV(A[0], C2[0], D[0], A[1], C2[1], D[1]);
    }
    return b;
  }
  /* v145: heller Saum, wo das Wasser ans Ufer schwappt (eigener Knoten, halb durchsichtig – wie am Teich) */
  function lakeFoam(rx, rz) { const b = new MB(); lakeBand(b, rx, rz, 0, 0.25, 0xf2f7f4, 0xf2f7f4, 0, 128); return b; }
  /* v145: Schilf mit Rohrkolben in Gruppen rund ums Ufer (wiegt im Wind) – an Stellen ohne Steg */
  function lakeReeds(rx, rz, skip) {
    G3.seed(3970);
    const b = new MB();
    [0.35, 0.9, 1.6, 2.2, 2.75, 3.3, 3.75, 4.35, 5.0, 5.55, 6.0].forEach(a0 => {
      if ((skip || []).some(s => Math.abs(Math.atan2(Math.sin(a0 - s), Math.cos(a0 - s))) < 0.22)) return;
      for (let i = 0; i < 16; i++) {
        const a = a0 + (rnd() - 0.5) * 0.18, d = (rnd() - 0.6) * 1.4, p = lakeR(rx + d, rz + d, a), h = 0.6 + rnd() * 0.6;
        b.at({ x: p[0], z: p[1], rx: (rnd() - 0.5) * 0.25, rz: (rnd() - 0.5) * 0.25 }, () => {
          b.box(0.04, h, 0.04, rnd() < 0.5 ? 0x5c8f34 : 0x6fa23d);
          if (rnd() < 0.45) b.box(0.08, 0.18, 0.08, 0x6b4426, { y: h - 0.06 });
          if (rnd() < 0.5) b.box(0.016, 0.42, 0.09, 0x78ad44, { y: 0.02, rz: 0.35, x: 0.04 });
        });
      }
    });
    return b;
  }
  function reedPatch(n) {
    G3.seed(3950 + n);
    const b = new MB();
    for (let i = 0; i < n; i++) {
      const x = (rnd() - 0.5) * 2.6, z = (rnd() - 0.5) * 1.6, h = 0.7 + rnd() * 0.6;
      b.box(0.035, h, 0.035, rnd() < 0.5 ? 0x6b8f2c : 0x7da23a, { x, z, rz: (rnd() - 0.5) * 0.3, rx: (rnd() - 0.5) * 0.3 });
      if (rnd() < 0.4) b.box(0.06, 0.16, 0.06, 0x7a5233, { x, y: h, z });
    }
    return b;
  }
  function lilyPads(n) {
    G3.seed(3960 + n);
    const b = new MB();
    for (let i = 0; i < n; i++) {
      const x = (rnd() - 0.5) * 3, z = (rnd() - 0.5) * 2.4, r = 0.18 + rnd() * 0.12;
      b.disc(r, 9, rnd() < 0.5 ? 0x4f9a35 : 0x5daa3c, { x, z, y0: 0.012 });
      if (rnd() < 0.35) b.ico(0.08, rnd() < 0.5 ? 0xffffff : 0xf6b3cf, { x, y: 0.06, z });
    }
    return b;
  }

  /* ------------------------------ Sägewerk ------------------------------ */
  /* Sägehalle: m = Reparaturen (dach, strom, saege, band) als Bits */
  function sawHall(m, pv) {
    G3.seed(4000);
    const b = new MB();
    const dach = m & 1, strom = m & 2, saege = m & 4, band = m & 8;
    const wallC = dach ? 0x9a6a3e : 0x6f5a46, plankC = dach ? 0xb07a48 : 0x7d6650;
    b.box(10, 0.18, 6, 0x8a857c, { top: 0x9a948a });
    /* Rückwand und Seiten aus Brettern, vorne offen */
    b.at({ y: 0.18 }, () => {
      FM.plankWall(b, 10, 2.6, 0.12, plankC, { z: -2.94 });
      [-4.94, 4.94].forEach(x => b.at({ x, ry: Math.PI / 2 }, () => FM.plankWall(b, 5.9, 2.6, 0.12, plankC)));
      for (let i = 0; i < 6; i++) b.box(0.18, 2.75, 0.18, 0x5a3f28, { x: -4.9 + i * 1.96, z: 2.9 });
      if (!dach) { b.box(1.1, 0.9, 0.14, 0x3a2e24, { x: -2, y: 1.2, z: -2.92 }); b.box(0.8, 0.6, 0.14, 0x3a2e24, { x: 3, y: 0.9, z: -2.92 }); }
      /* Fenster in der Rückwand */
      [-3, 0, 3].forEach(x => { b.box(0.9, 0.6, 0.05, dach ? 0xffffff : 0x55504a, { x, y: 1.6, z: -2.85 }); b.box(0.78, 0.48, 0.06, dach ? (strom ? C.glow : C.glass) : 0x2a2622, { x, y: 1.66, z: -2.84 }); });
    });
    /* Dach: ganz oder mit Löchern */
    b.at({ y: 2.95 }, () => {
      if (dach) b.noise(0.05, () => b.roof(10.6, 6.6, 1.6, 0x6f7a80, { gable: wallC, thick: 0.1 }));
      else {
        for (let i = 0; i < 6; i++) b.box(0.12, 0.12, 6.4, 0x4a3a2c, { x: -5 + i * 2, y: 0.8, rx: 0 });
        b.roof(3.2, 6.6, 1.6, 0x5a6268, { x: -3.6, gable: wallC, thick: 0.1 });
        b.at({ x: 3.1 }, () => b.quad([-1.4, 0, 3.3], [1.6, 0, 3.3], [1.6, 1.6, 0], [-1.4, 1.6, 0], 0x5a6268));
        b.box(1.4, 0.06, 1.0, 0x5a6268, { x: 1.5, y: -2.8, z: 1.6, ry: 0.5, rz: 0.2 });
      }
    });
    /* Solarmodule der Döring GmbH auf der vorderen Dachfläche: zwei Reihen,
       jede mittig – so sieht es mit jeder Zahl von Modulen symmetrisch aus */
    if (dach && pv) solarRoof(b, pv);
    /* Gattersäge in der Mitte: Rahmen, Sägeblätter, Wagen auf Schienen */
    b.at({ y: 0.18, x: 0.5 }, () => {
      [-0.8, 0.8].forEach(x => b.box(0.22, 2.3, 0.3, saege ? 0x2f6fb0 : 0x7a6a5a, { x }));
      b.box(1.85, 0.25, 0.32, saege ? 0x2f6fb0 : 0x7a6a5a, { y: 2.2 });
      if (saege) for (let i = 0; i < 5; i++) b.box(0.03, 1.5, 0.2, 0xd9e1e6, { x: -0.45 + i * 0.22, y: 0.55 });
      else { b.box(0.03, 1.2, 0.2, 0x9a6a3a, { x: -0.2, y: 0.4, rz: 0.4 }); b.box(0.03, 1.2, 0.2, 0x9a6a3a, { x: 0.6, y: 0.2, rz: 1.3, z: 1.5 }); }
      /* Schienen und Stammwagen */
      [-0.35, 0.35].forEach(x => b.box(0.06, 0.06, 5.4, 0x55504a, { x, y: 0.02 }));
      b.box(1.1, 0.18, 0.9, 0x6e4a2e, { y: 0.1, z: 1.4 });
      b.cyl(0.32, 0.32, 2.2, 8, 0xa8653c, { rx: Math.PI / 2, y: 0.6, z: 1.4 - 1.1, top: 0xe6c99a });
    });
    /* Förderband: Rollen und Gurt (oder Einzelteile am Boden) */
    b.at({ y: 0.18, x: -3.1, z: 0.4 }, () => {
      [-1.6, 1.6].forEach(z => [-0.35, 0.35].forEach(x => b.box(0.08, 0.6, 0.08, 0x55504a, { x, z })));
      if (band) {
        b.box(0.8, 0.08, 3.6, 0x2a2a2e, { y: 0.62 });
        for (let i = 0; i < 9; i++) b.cyl(0.07, 0.07, 0.78, 6, 0x9aa6af, { rz: Math.PI / 2, x: 0.39, y: 0.58, z: -1.6 + i * 0.4 });
        b.cyl(0.25, 0.25, 1.4, 8, 0xa8653c, { rx: Math.PI / 2, y: 0.95, z: -0.9, top: 0xe6c99a });
      } else {
        for (let i = 0; i < 4; i++) b.cyl(0.07, 0.07, 0.78, 6, 0x8a7a6a, { rz: Math.PI / 2, x: 0.4 + rnd() * 0.6, y: 0.07, z: -1.5 + i * 0.9, ry: rnd() });
        b.box(0.8, 0.04, 1.2, 0x2a2a2e, { x: 0.8, y: 0.02, z: 0.6, ry: 0.4 });
      }
    });
    /* Strom: Lampe und Leitung zum Kesselhaus */
    if (strom) {
      [-2.5, 2.5].forEach(x => { b.box(0.04, 0.5, 0.04, 0x2a2a2e, { x, y: 2.4, z: 0.4 }); b.box(0.3, 0.16, 0.3, C.glow, { x, y: 2.25, z: 0.4 }); });
      b.box(0.3, 0.4, 0.15, 0x9aa6af, { x: -4.7, y: 1.2, z: 2.0 });
      b.box(0.04, 0.04, 0.6, 0xd8332b, { x: -4.7, y: 1.5, z: 2.2 });
    }
    /* Sägespäne */
    for (let i = 0; i < 10; i++) b.ico(0.18 + rnd() * 0.15, dach ? 0xe9cfa0 : 0x9a8a72, { x: (rnd() - 0.5) * 8, y: 0.18, z: 1.2 + rnd() * 1.6, flat: 0.25, jitter: 0.4 });
    if (!dach) for (let i = 0; i < 8; i++) b.ico(0.22, 0x5f7f3a, { x: (rnd() - 0.5) * 9.5, y: 0.2, z: 2.6 + rnd() * 0.6, flat: 0.5, jitter: 0.5 });
    return b;
  }
  /* Dach 10,6 × 6,6, First 1,6 hoch: vordere Fläche von der Traufe (z = 3,3) bis zum First */
  const PV_COLS = 8, PV_ROWS = 2, PV_W = 1.0, PV_L = 1.55, PV_GAP = 0.12;
  function solarPanel(m) {
    m.box(PV_W, 0.05, PV_L, 0xc8d0d8, { c: false });                                   /* Rahmen */
    m.box(PV_W - 0.08, 0.06, PV_L - 0.08, 0x1d3566, { y: 0.0, top: 0x24427e });          /* Zellen */
    for (let i = 1; i < 3; i++) m.box(0.015, 0.065, PV_L - 0.1, 0x6f8fc8, { x: -PV_W / 2 + i * PV_W / 3 });
    for (let i = 1; i < 6; i++) m.box(PV_W - 0.1, 0.065, 0.015, 0x6f8fc8, { z: -PV_L / 2 + i * PV_L / 6 });
  }
  function solarRoof(b, n) {
    n = Math.min(n, PV_COLS * PV_ROWS);
    const a = Math.atan2(1.6, 3.3), per = [Math.ceil(n / 2), Math.floor(n / 2)];
    b.at({ y: 2.95, z: 3.3, rx: a }, m => {
      per.forEach((k, r) => {
        const sAlong = 0.32 + PV_L / 2 + r * (PV_L + 0.1);
        /* Montageschienen unter der Reihe */
        if (k) [-PV_L * 0.3, PV_L * 0.3].forEach(dz => m.box(k * (PV_W + PV_GAP), 0.04, 0.05, 0x8a929a, { y: 0.02, z: -sAlong + dz }));
        for (let i = 0; i < k; i++) m.at({ x: (i - (k - 1) / 2) * (PV_W + PV_GAP), y: 0.05, z: -sAlong }, solarPanel);
      });
    });
  }
  /* Montagewagen der Döring GmbH: weißer Transporter mit Sonne, Leiter und Modul auf dem Dach */
  function solarVan() {
    G3.seed(4810);
    const b = FM.van(0xf6f6f2);
    [-1, 1].forEach(sx => {
      b.cyl(0.2, 0.2, 0.02, 12, 0xf2c230, { rz: -sx * Math.PI / 2, x: sx * 0.515, y: 0.78, z: -0.35 });   /* v77: vor dem Zierstreifen, nicht darin */
      for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; b.box(0.02, 0.05, 0.1, 0xf2a531, { x: sx * 0.515, y: 0.78 + Math.sin(an) * 0.28, z: -0.35 + Math.cos(an) * 0.28, rx: -an }); }
      b.box(0.02, 0.1, 0.9, 0xf2a531, { x: sx * 0.51, y: 0.42, z: 0.05 });
    });
    b.at({ y: 1.2, z: -0.25 }, m => {
      [-0.38, 0.38].forEach(x => m.box(0.04, 0.05, 1.3, 0x55555c, { x }));
      m.at({ y: 0.06, rx: 0.05 }, mm => { mm.box(0.9, 0.04, 1.2, 0xc8d0d8); mm.box(0.84, 0.05, 1.14, 0x1d3566, { top: 0x24427e }); });
      [-0.46, 0.46].forEach(x => m.box(0.04, 0.04, 1.6, 0xb8c0c8, { x, y: 0.12, z: 0.1 }));
      for (let i = 0; i < 6; i++) m.box(0.92, 0.03, 0.03, 0xb8c0c8, { y: 0.12, z: -0.6 + i * 0.27 });
    });
    return b;
  }
  const SAW_BLADE = [0.5, 0.73, 0];        /* Lage der Sägeblätter (für die Animation) */
  function sawBlades() {
    const b = new MB();
    for (let i = 0; i < 5; i++) b.box(0.03, 1.5, 0.2, 0xe6eef2, { x: -0.45 + i * 0.22 });
    b.box(1.2, 0.08, 0.26, 0x9aa6af, { y: 1.5 });
    return b;
  }
  /* Holzlager: offener Schuppen mit Stapeln */
  function sawLager(ok) {
    G3.seed(4010);
    const b = new MB();
    b.box(6, 0.12, 4, 0x8a857c);
    for (let i = 0; i < 4; i++) [-1.8, 1.8].forEach(z => b.box(0.16, 2.2, 0.16, 0x5a3f28, { x: -2.8 + i * 1.86, z }));
    b.at({ y: 2.2 }, () => ok ? b.box(6.4, 0.12, 4.4, 0x6f7a80, { rx: 0.08 }) : b.box(3.4, 0.12, 4.4, 0x5a6268, { x: -1.4, rx: 0.08, rz: 0.06 }));
    b.merge(logPile(9, "kiefer"), { x: -1.4, z: -1.2 });
    b.merge(logPile(7, "birke"), { x: 1.5, z: -1.2 });
    b.merge(logPile(5, "eiche"), { x: 0, z: 0.4 });
    return b;
  }
  function sawBuero(ok) {
    G3.seed(4020);
    const b = new MB();
    b.box(3, 0.12, 3, 0x8a857c);
    b.at({ y: 0.12, z: -0.1 }, () => {
      FM.plankWall(b, 2.6, 1.7, 2.4, ok ? 0x4f7a5a : 0x5a5a50);
      FM.windowAt(b, -0.6, 0.7, 1.22, 0.55, 0.5, ok ? { frame: 0xffffff } : { frame: 0x8a7a6a, lit: false });
      if (!ok) [-0.75, -0.45].forEach(x => b.box(0.7, 0.09, 0.05, 0x8a6a4a, { x: x + 0.15, y: 0.98, z: 1.28, rz: x > -0.6 ? 0.4 : -0.4 }));
      b.box(0.6, 1.2, 0.06, ok ? 0x2f6fb0 : 0x4a3a2c, { x: 0.6, z: 1.21 });
      b.at({ y: 1.7 }, () => b.roof(3.0, 2.8, 0.8, ok ? 0x9e3f2c : 0x5a5050, { gable: ok ? 0x4f7a5a : 0x5a5a50 }));
      b.box(1.4, 0.32, 0.05, ok ? 0xf6f1e6 : 0x9a948a, { y: 1.5, z: 1.25 });
    });
    return b;
  }
  /* Krügers Unimog: unter der Plane und rostig – oder frisch flott */
  /* Stellplatz des Holzlasters: repariert steht dort nur noch der Platz –
     der Laster selbst ist ein Fahrzeug (holzTruck) und fährt los */
  function sawLkw(ok) {
    if (ok) {
      G3.seed(4031);
      const b = new MB();
      /* Stellplatz klar über dem Hofboden (y 0,014) – sonst flimmert er */
      b.noise(0.05, () => b.plate(2.6, 4.8, 0x8f8a80, { y0: 0.034 }));
      [-1.2, 1.2].forEach(x => b.plate(0.08, 4.6, 0xf2efe6, { x, y0: 0.042 }));
      b.plate(2.4, 0.08, 0xf2efe6, { z: -2.3, y0: 0.042 });
      b.box(0.5, 0.12, 0.25, 0x8a6040, { x: 0.8, z: -2.1 }); b.box(0.5, 0.12, 0.25, 0x8a6040, { x: -0.8, z: -2.1 });
      return b;
    }
    return holzTruckMB(false);
  }
  function holzTruck() { return holzTruckMB(true); }
  /* v70: volle Palette fürs Beladen – Europalette mit Bretterstapel und zwei Spanngurten */
  function palletLoad() {
    G3.seed(4060);
    const b = new MB();
    [-0.3, 0, 0.3].forEach(x => b.box(0.12, 0.08, 0.76, 0xb08a58, { x }));
    for (let i = 0; i < 5; i++) b.box(0.76, 0.03, 0.12, 0xc9a06a, { y: 0.08, z: -0.32 + i * 0.16 });
    b.noise(0.05, () => { for (let j = 0; j < 4; j++) b.box(0.72, 0.1, 0.72, j % 2 ? 0xe2c18e : 0xd6b07a, { y: 0.11 + j * 0.105, top: 0xf0d6a8 }); });
    [-0.22, 0.22].forEach(z => b.box(0.745, 0.44, 0.035, 0x2a5aa0, { y: 0.108, z }));
    return b;
  }
  function holzTruckMB(ok) {
    G3.seed(4030);
    const b = new MB();
    const body = ok ? 0x3f7a4a : 0x6a5a48, tire = ok ? 0x1d1d20 : 0x3a3530;
    [[-0.8, -1.4], [0.8, -1.4], [-0.8, 1.3], [0.8, 1.3]].forEach(([x, z]) => b.cyl(0.42, 0.42, 0.32, 10, tire, { rz: Math.PI / 2, x: x + 0.16, y: ok ? 0.42 : 0.34, z, top: 0x8a8a8a }));
    b.at({ y: ok ? 0.6 : 0.5 }, () => {
      b.box(1.7, 0.25, 4.4, 0x2a2a2e);
      b.box(1.7, 1.2, 1.4, body, { y: 0.25, z: 1.4, top: ok ? 0x356a3f : 0x5a4a3a });
      b.box(1.5, 0.5, 0.05, ok ? C.glass : 0x3a3530, { y: 0.85, z: 2.11 });
      b.box(1.8, 0.4, 2.6, body, { y: 0.25, z: -0.9 });
      /* v70: leere Ladefläche mit Holzboden und niedrigen Bordwänden – beladen wird
         erst auf dem Stellplatz, mit Paletten (palletLoad, Logo als Aufkleber) */
      if (ok) {
        b.noise(0.06, () => { for (let i = 0; i < 6; i++) b.box(0.29, 0.03, 2.56, i % 2 ? 0x8a6a48 : 0x7d5f40, { x: -0.725 + i * 0.29, y: 0.65, z: -0.9 }); });
        [-0.87, 0.87].forEach(x => b.box(0.06, 0.16, 2.6, 0x2e5c38, { x, y: 0.65, z: -0.9 }));
        b.box(1.8, 0.16, 0.06, 0x2e5c38, { y: 0.65, z: -2.17 });
        b.box(1.8, 0.5, 0.08, 0x2e5c38, { y: 0.65, z: 0.36 });
      }
      [-0.55, 0.55].forEach(x => b.box(0.22, 0.14, 0.04, ok ? 0xfff5c8 : 0x55504a, { x, y: 0.5, z: 2.11 }));
    });
    if (!ok) {
      /* Plane drüber, Gras drumherum */
      b.box(2.0, 0.08, 4.2, 0x5a6a48, { y: 1.95, rz: 0.06 });
      b.box(0.06, 1.0, 4.0, 0x5a6a48, { x: 1.0, y: 1.0, rz: -0.12 });
      for (let i = 0; i < 6; i++) b.ico(0.25, 0x5f8a3a, { x: (rnd() - 0.5) * 2.4, y: 0.15, z: (rnd() - 0.5) * 4.6, flat: 0.6, jitter: 0.5 });
    }
    return b;
  }
  /* Kesselhaus mit Schornstein: Kessel + Motor fürs Sägewerk */
  function kessel(ok) {
    G3.seed(4040);
    const b = new MB();
    b.box(3, 0.12, 3, 0x8a857c);
    b.at({ y: 0.12 }, () => {
      b.noise(0.08, () => b.box(2.6, 1.8, 2.6, ok ? C.brick : 0x8a5a48, { top: C.brickD }));
      for (let y = 0.3; y < 1.8; y += 0.3) b.box(2.62, 0.018, 2.62, 0xd7b6a6, { y });
      b.box(0.9, 1.2, 0.06, ok ? 0x3a3a40 : 0x2a2420, { x: 0.4, z: 1.31 });
      if (ok) b.box(0.5, 0.3, 0.07, C.glow, { x: 0.4, y: 0.2, z: 1.32 });
      b.at({ y: 1.8 }, () => b.roof(2.9, 2.9, 0.6, ok ? 0x6f7a80 : 0x5a5a50, { gable: C.brick }));
      b.box(0.5, ok ? 2.6 : 1.6, 0.5, C.brick, { x: -0.8, z: -0.7, top: 0x3a3030 });
      if (!ok) b.ico(0.3, 0x5f8a3a, { x: -0.8, y: 1.7, z: -0.7, jitter: 0.5 });
    });
    return b;
  }
  const KESSEL_CHIMNEY = [-0.8, 2.85, -0.7];
  /* Maschinen zum Dazukaufen */
  function machine(t, bare) {
    G3.seed(4100 + t.length);
    const b = new MB();
    /* bare: ohne Bodenplatte – für die Bildchen im Laden */
    const base = (w, d) => { if (!bare) b.box(w, 0.12, d, 0x8a857c); };
    if (t === "spalter") {
      base(2, 2);
      b.box(0.5, 0.6, 1.4, 0xd8a028, { y: 0.12 });
      b.box(0.2, 1.0, 0.2, 0x3a3a40, { y: 0.7, z: -0.4 });
      b.box(0.08, 0.4, 0.3, 0xd9e1e6, { y: 1.0, z: -0.4 });
      b.cyl(0.22, 0.22, 0.5, 8, 0xa8653c, { y: 0.72, z: 0.3, top: 0xe6c99a });
      for (let i = 0; i < 6; i++) b.box(0.12, 0.12, 0.45, 0xc9955a, { x: 0.65 + (i % 3) * 0.13, y: 0.12 + Math.floor(i / 3) * 0.12, z: 0.4, ry: 0.2 });
    } else if (t === "hobel") {
      base(3, 2);
      b.box(2.2, 0.8, 0.9, 0x2f8a6a, { y: 0.12, top: 0x2a7a5e });
      b.box(0.6, 0.4, 0.95, 0x3a3a40, { y: 0.92 });
      b.box(2.6, 0.06, 0.5, 0xe6c99a, { y: 0.95, z: 0.05 });
      b.box(0.3, 0.5, 0.3, 0x9aa6af, { x: -0.9, y: 0.92 });
    } else if (t === "trocken") {
      base(4, 3);
      b.box(3.6, 2.0, 2.6, 0xd9e1e6, { y: 0.12, top: 0xc0c9cf });
      b.box(1.4, 1.6, 0.05, 0x6f7a80, { x: -0.6, y: 0.12, z: 1.31 });
      b.box(0.4, 0.3, 0.06, 0xd8332b, { x: 1.0, y: 1.3, z: 1.31 });
      [-0.8, 0.8].forEach(x => b.cyl(0.18, 0.18, 0.5, 8, 0x9aa6af, { x, y: 2.12, z: -0.5 }));
    } else if (t === "verpack") {
      base(3, 2);
      b.box(1.8, 0.9, 1.2, 0xf2a531, { y: 0.12, top: 0xe09424 });
      b.box(0.8, 0.5, 1.25, 0x3a3a40, { x: -0.4, y: 1.02 });
      for (let i = 0; i < 3; i++) b.box(1.2, 0.14, 0.8, 0xd8b07a, { x: 0.9, y: 0.12 + i * 0.16, z: 0.2 });
    } else if (t === "schleif") {
      base(3, 2);
      b.box(1.6, 0.85, 0.9, 0x8a5ac8, { y: 0.12, top: 0x7a4ab8 });
      b.cyl(0.32, 0.32, 0.12, 12, 0xe0d0b0, { rz: Math.PI / 2, x: 0.86, y: 0.75 });
      b.box(1.0, 0.08, 0.5, 0xc9955a, { x: -0.2, y: 0.97 });
    } else if (t === "fraese") {
      base(3, 2);
      b.box(1.8, 0.9, 1.0, 0xc8443a, { y: 0.12, top: 0xb8382e });
      b.box(0.3, 0.9, 0.3, 0x3a3a40, { y: 1.02 });
      b.cyl(0.1, 0.06, 0.3, 8, 0xd9e1e6, { y: 0.75, z: 0 });
      b.box(1.4, 0.1, 0.06, 0x9aa6af, { y: 1.85 });
    }
    return b;
  }
  /* Sägebock auf dem Hof: Bock mit Stamm, daneben die Kettensäge */
  function saegebock() {
    G3.seed(4200);
    const b = new MB();
    b.noise(0.1, () => b.plate(1.9, 1.9, 0xc9b48a, { y0: 0.015 }));
    [-0.55, 0.55].forEach(x => { b.box(0.08, 0.7, 0.08, C.woodD, { x, z: 0.2, rx: 0.35 }); b.box(0.08, 0.7, 0.08, C.woodD, { x, z: -0.2, rx: -0.35 }); });
    b.cyl(0.16, 0.16, 1.6, 8, 0xa8653c, { rz: Math.PI / 2, x: 0.8, y: 0.7, top: 0xe6c99a });
    b.box(0.32, 0.18, 0.14, 0xf2731e, { x: 0.55, y: 0.05, z: 0.6 });
    b.box(0.5, 0.04, 0.08, 0x9aa6af, { x: 0.85, y: 0.08, z: 0.6 });
    for (let i = 0; i < 6; i++) b.ico(0.08, 0xe9cfa0, { x: (rnd() - 0.5) * 1.2, y: 0.02, z: (rnd() - 0.5) * 1.2, flat: 0.3 });
    b.merge(logPile(4, "kiefer"), { x: 0.4, z: -1.15, s: 0.6 });
    return b;
  }
  /* Sägewerkshof: Schotter, Späne, Stapel */
  function yard(w, d) {
    G3.seed(4210);
    const b = new MB();
    b.plate(w, d, YARD_COL, { y0: 0.014 });          /* v77: einfarbig – die Wege laufen am Tor genau in diese Farbe aus */
    for (let i = 0; i < w * d * 0.12; i++) b.plate(0.22, 0.16, rnd() < 0.5 ? 0xe9cfa0 : 0xa59a84, { x: (rnd() - 0.5) * (w - 1), z: (rnd() - 0.5) * (d - 1), ry: rnd() * 3, y0: 0.02 });
    return b;
  }

  /* ------------------------------- Hof ---------------------------------- */
  function junk(k) {
    G3.seed(4300 + k.length);
    const b = new MB();
    if (k === "reifen") {
      for (let i = 0; i < 4; i++) b.cyl(0.38, 0.38, 0.22, 10, 0x1d1d20, { y: i * 0.22, x: (i % 2) * 0.06, top: 0x3a3a40 });
      b.cyl(0.38, 0.38, 0.22, 10, 0x1d1d20, { rx: 1.2, x: 0.7, y: 0.3, z: 0.4, top: 0x3a3a40 });
    } else if (k === "schrott") {
      b.noise(0.2, () => {
        for (let i = 0; i < 9; i++) b.box(0.2 + rnd() * 0.5, 0.06 + rnd() * 0.2, 0.2 + rnd() * 0.4, rnd() < 0.5 ? 0x8a5a3a : 0x7a7a80, { x: (rnd() - 0.5) * 1.2, y: rnd() * 0.3, z: (rnd() - 0.5) * 1.2, ry: rnd() * 3, rz: (rnd() - 0.5) * 0.6 });
      });
      b.cyl(0.25, 0.25, 0.5, 8, 0x5a6a7a, { rz: 1.4, x: 0.3, y: 0.25, z: -0.4 });
    } else if (k === "unkraut") {
      for (let i = 0; i < 16; i++) b.box(0.05, 0.5 + rnd() * 0.4, 0.05, rnd() < 0.5 ? 0x4f8f30 : 0x5f9a35, { x: (rnd() - 0.5) * 1.5, z: (rnd() - 0.5) * 1.5, rz: (rnd() - 0.5) * 0.5 });
      for (let i = 0; i < 6; i++) b.ico(0.2, 0x4a8a2c, { x: (rnd() - 0.5) * 1.3, y: 0.25, z: (rnd() - 0.5) * 1.3, jitter: 0.5 });
    } else if (k === "bretter") {
      for (let i = 0; i < 7; i++) b.box(1.5, 0.05, 0.22, rnd() < 0.5 ? 0x7a6a50 : 0x8a7458, { y: 0.05 + i * 0.05, z: (rnd() - 0.5) * 0.6, ry: (rnd() - 0.5) * 0.7 });
      b.ico(0.2, 0x5f8a3a, { x: 0.6, y: 0.1, z: 0.5, jitter: 0.5 });
    } else if (k === "karre") {
      FM.wheel(b, 0.3, 0.06, { x: -0.5, y: 0.2, z: 0, rz: 0.3 });
      b.box(1.1, 0.08, 0.7, 0x7a6a50, { y: 0.32, rz: -0.25 });
      b.box(1.0, 0.25, 0.05, 0x6a5a44, { y: 0.4, z: 0.33, rz: -0.25 });
      b.box(0.05, 0.05, 1.0, 0x5a4a38, { x: 0.7, y: 0.15, z: 0.2, ry: 0.4 });
      b.ico(0.22, 0x5f8a3a, { x: 0.3, y: 0.1, z: -0.4, jitter: 0.5 });
    }
    return b;
  }
  /* Verkaufsstand an der Straße */
  function stall() {
    G3.seed(4310);
    const b = new MB();
    b.box(1.8, 0.7, 0.7, C.wood, { y: 0, top: C.woodL });
    [-0.85, 0.85].forEach(x => b.box(0.08, 1.6, 0.08, C.woodD, { x, z: -0.3 }));
    for (let i = 0; i < 6; i++) b.box(0.32, 0.04, 0.9, i % 2 ? 0xffffff : 0xd8332b, { x: -0.8 + i * 0.32, y: 1.55, z: 0.05, rx: 0.3 });
    b.box(1.2, 0.3, 0.05, 0xf6f1e6, { y: 1.15, z: -0.33 });
    return b;
  }
  /* Ware auf dem Stand: v53 – die echten Waren als kleine Modelle nebeneinander */
  function stallGoods(ids, wide) {
    const b = new MB();
    if (ids && ids.length) {
      const W = wide ? 3.6 : 1.5, n = ids.length, rows = n > 3 && !wide ? 2 : 1, per = Math.ceil(n / rows);
      ids.forEach((id, i) => {
        const m = item(id);
        if (!m) return;
        const r = Math.floor(i / per), k = i % per, cnt = Math.min(per, n - r * per);
        b.merge(m, { x: (k - (cnt - 1) / 2) * (W / Math.max(3, per)), y: 0.7, z: rows > 1 ? (r ? 0.16 : -0.14) : 0, s: wide ? 0.42 : 0.3, ry: (i % 2 ? 0.25 : -0.2) });
      });
      return b;
    }
    [[-0.55, 0xd9332b], [0, 0xf2c230], [0.55, 0x6fae3a]].forEach(([x, c]) => {
      b.box(0.42, 0.14, 0.32, C.woodL, { x, y: 0.7 });
      for (let k = 0; k < 4; k++) b.sphere(0.07, 7, 5, c, { x: x - 0.12 + (k % 2) * 0.24, y: 0.86, z: -0.07 + Math.floor(k / 2) * 0.14 });
    });
    return b;
  }
  function tractor(col) {
    G3.seed(4320);
    const b = new MB(), c = col === "gruen" ? 0x2f8a4a : 0xc8443a;
    FM.wheel(b, 0.42, 0.22, { x: -0.55, y: 0.42, z: -0.45 }); FM.wheel(b, 0.42, 0.22, { x: 0.55, y: 0.42, z: -0.45 });
    FM.wheel(b, 0.26, 0.16, { x: -0.48, y: 0.26, z: 0.75 }); FM.wheel(b, 0.26, 0.16, { x: 0.48, y: 0.26, z: 0.75 });
    b.box(0.8, 0.5, 1.5, c, { y: 0.35, z: 0.25, top: G3.shade(G3.col(c), 0.9) });
    b.box(0.85, 0.85, 0.8, c, { y: 0.55, z: -0.4 });
    b.box(0.75, 0.55, 0.05, C.glass, { y: 1.0, z: 0.01 });
    b.box(0.95, 0.06, 0.95, 0x2a2a2e, { y: 1.42, z: -0.4 });
    b.cyl(0.05, 0.05, 0.6, 6, 0x2a2a2e, { x: 0.25, y: 0.85, z: 0.75 });
    return b;
  }
  function trailer() {
    const b = new MB();
    FM.wheel(b, 0.3, 0.12, { x: -0.6, y: 0.3, z: 0 }); FM.wheel(b, 0.3, 0.12, { x: 0.6, y: 0.3, z: 0 });
    b.box(1.4, 0.08, 1.8, C.woodD, { y: 0.5 });
    FM.plankWall(b, 1.4, 0.35, 0.05, C.wood, { y: 0.58, z: 0.88 }); FM.plankWall(b, 1.4, 0.35, 0.05, C.wood, { y: 0.58, z: -0.88 });
    b.noise(0.1, () => b.box(1.2, 0.3, 1.5, C.hay, { y: 0.58 }));
    b.box(0.06, 0.06, 0.9, 0x3a3a40, { y: 0.45, z: 1.3 });
    return b;
  }
  /* Maschinenhalle (Stufe 4) */
  function machineHall() {
    G3.seed(4330);
    const b = new MB();
    b.box(6, 0.1, 4, 0x9a948a);
    FM.plankWall(b, 6, 2.4, 0.12, 0x6f8a9a, { y: 0.1, z: -1.94 });
    [-2.94, 2.94].forEach(x => b.at({ x, y: 0.1, ry: Math.PI / 2 }, () => FM.plankWall(b, 3.9, 2.4, 0.12, 0x6f8a9a)));
    b.at({ y: 2.5 }, () => b.roof(6.4, 4.4, 1.0, 0x5a6268, { gable: 0x6f8a9a }));
    for (let i = 0; i < 4; i++) b.box(1.2, 0.04, 0.8, 0x203a5a, { x: -2.1 + i * 1.4, y: 3.05, z: 1.0, rx: -0.42 });
    return b;
  }
  /* Steinmauer-Abschnitt und Torbogen (Stufe 4) */
  function stoneWall(len) {
    G3.seed(4340 + Math.round(len));
    const b = new MB();
    b.noise(0.12, () => { for (let x = -len / 2 + 0.3; x < len / 2; x += 0.6) b.box(0.62, 0.55 + rnd() * 0.08, 0.35, rnd() < 0.5 ? 0xb8b0a2 : 0xa8a094, { x, top: 0x9a948a }); });
    return b;
  }
  function stoneGate() {
    G3.seed(4350);
    const b = new MB();
    [-2.1, 2.1].forEach(x => b.noise(0.1, () => b.box(0.6, 2.4, 0.6, 0xb8b0a2, { x, top: 0x9a948a })));
    b.box(4.8, 0.4, 0.6, 0xa8a094, { y: 2.4 });
    b.box(2.6, 0.5, 0.06, 0xf6f1e6, { y: 2.45, z: 0.32 });
    return b;
  }

  /* ----------------------------- Fischerei ------------------------------ */
  function fPlot(w, d) {
    G3.seed(4400 + w * 3 + d);
    const b = new MB();
    const x = w / 2 - 0.15, z = d / 2 - 0.15;
    /* Pflöcke mit Absperrband rundherum, gut sichtbar auch im Wasser */
    [[-x, -z], [x, -z], [x, z], [-x, z]].forEach(([px, pz]) => { b.box(0.12, 0.9, 0.12, 0xf2a531, { x: px, y: -0.2, z: pz }); b.box(0.16, 0.08, 0.16, 0xd8332b, { x: px, y: 0.7, z: pz }); });
    [[[-x, -z], [x, -z]], [[x, -z], [x, z]], [[x, z], [-x, z]], [[-x, z], [-x, -z]]].forEach(([a, c]) => {
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(2, Math.round(len / 0.5));
      for (let i = 0; i < n; i++) {
        const t0 = (i + 0.05) / n, t1 = (i + 0.95) / n;
        const ax = a[0] + (c[0] - a[0]) * t0, az = a[1] + (c[1] - a[1]) * t0, bx = a[0] + (c[0] - a[0]) * t1, bz = a[1] + (c[1] - a[1]) * t1;
        b.box(Math.hypot(bx - ax, bz - az), 0.06, 0.03, i % 2 ? 0xffffff : 0xd8332b, { x: (ax + bx) / 2, y: 0.5, z: (az + bz) / 2, ry: -Math.atan2(c[1] - a[1], c[0] - a[0]) });
      }
    });
    /* Bauschild mit Hammer vorne */
    [-0.35, 0.35].forEach(px => b.box(0.06, 1.0, 0.06, C.woodD, { x: px, z: z - 0.4 }));
    b.box(1.0, 0.6, 0.05, 0xf6f1e6, { y: 0.75, z: z - 0.37 });
    b.box(0.9, 0.08, 0.06, 0xf2a531, { y: 1.0, z: z - 0.35 });
    b.box(0.08, 0.32, 0.06, 0x6b4a30, { x: -0.1, y: 0.55, z: z - 0.33, rz: 0.6 });
    b.box(0.24, 0.1, 0.07, 0x5a6268, { x: 0.0, y: 0.7, z: z - 0.33, rz: 0.6 });
    /* ein paar Bretter liegen schon bereit */
    for (let i = 0; i < 3; i++) b.box(1.2, 0.05, 0.2, C.woodL, { x: -x + 1, y: 0.03 + i * 0.05, z: z - 1.1, ry: 0.1 * i });
    return b;
  }
  /* Steg: 2 breit, 6 lang, ragt nach +z ins Wasser */
  function lakeSteg() {
    G3.seed(4410);
    const b = new MB();
    b.noise(0.12, () => { for (let i = 0; i < 20; i++) b.box(1.7, 0.07, 0.27, i % 3 ? C.wood : C.woodL, { y: 0.1, z: -2.85 + i * 0.3 }); });
    /* v59: Anlauf an Land – das Ufer endet vor dem Steg, also sechs Bohlen mehr bis auf den Sand,
       eine Schwelle im Boden und zwei Stützen (nur Optik, die Kachelfläche bleibt 2 × 6) */
    b.noise(0.12, () => { for (let i = 1; i <= 6; i++) b.box(1.7, 0.07, 0.27, i % 3 ? C.wood : C.woodL, { y: 0.1, z: -2.85 - i * 0.3 }); });
    b.box(1.9, 0.12, 0.3, C.woodD, { y: 0, z: -4.7 });
    [-0.8, 0.8].forEach(x => b.cyl(0.07, 0.07, 0.3, 6, C.woodD, { x, y: -0.2, z: -3.7 }));
    for (let i = 0; i < 4; i++) [-0.8, 0.8].forEach(x => b.cyl(0.07, 0.07, 0.9, 6, C.woodD, { x, y: -0.7, z: -2.6 + i * 1.75 }));
    [-0.82, 0.82].forEach(x => b.box(0.06, 0.06, 2.6, C.woodD, { x, y: 0.55, z: 1.6 }));
    [-0.82, 0.82].forEach(x => [0.3, 2.9].forEach(z => b.box(0.06, 0.45, 0.06, C.woodD, { x, y: 0.12, z })));
    return b;
  }
  function fHuette() {
    G3.seed(4420);
    const b = new MB();
    b.box(4, 0.12, 3, 0x8a857c);
    b.at({ y: 0.12, z: -0.15 }, () => {
      FM.plankWall(b, 3.4, 1.6, 2.4, 0x5a7a8a);
      FM.windowAt(b, -0.9, 0.7, 1.22, 0.5, 0.45, { frame: 0xffffff, shutter: 0xd8332b });
      b.box(0.6, 1.2, 0.06, 0xf6f1e6, { x: 0.8, z: 1.21 });
      b.at({ y: 1.6 }, () => b.roof(3.8, 2.9, 0.9, 0x8a6a4a, { gable: 0x5a7a8a }));
      FM.windowAt(b, 1.72, 0.7, 0, 0.45, 0.4, { ry: Math.PI / 2, frame: 0xffffff });
    });
    /* Netze, Reuse und Kisten vorm Haus */
    for (let i = 0; i < 8; i++) b.box(0.012, 1.0, 0.012, 0x2d4a3e, { x: -1.8, y: 0.15, z: -0.9 + i * 0.12 });
    for (let j = 0; j < 8; j++) b.box(0.012, 0.012, 0.9, 0x2d4a3e, { x: -1.8, y: 0.15 + j * 0.12, z: -0.48 });
    b.box(0.44, 0.2, 0.32, 0x2f6fb0, { x: 1.4, z: 1.25 }); b.box(0.44, 0.2, 0.32, 0xf2a531, { x: 1.4, y: 0.2, z: 1.25, ry: 0.3 });
    return b;
  }
  /* Bootshaus: halb an Land, halb überm Wasser (+z) */
  function fBoot() {
    G3.seed(4430);
    const b = new MB();
    for (let i = 0; i < 4; i++) [-2.2, 2.2].forEach(x => b.cyl(0.1, 0.1, 1.4, 6, C.woodD, { x, y: -0.9, z: -1.6 + i * 1.3 }));
    b.noise(0.1, () => { b.box(5, 0.12, 1.6, C.wood, { y: 0.1, z: -1.7 }); [-2.0, 2.0].forEach(x => b.box(0.9, 0.12, 5, C.woodL, { x, y: 0.1 })); });
    FM.plankWall(b, 5, 2.0, 0.1, 0x8a3a2e, { y: 0.22, z: -2.45 });
    [-2.45, 2.45].forEach(x => b.at({ x, y: 0.22, ry: Math.PI / 2 }, () => FM.plankWall(b, 4.9, 2.0, 0.1, 0x8a3a2e)));
    b.box(5, 0.5, 0.1, 0x8a3a2e, { y: 1.72, z: 2.45 });
    b.at({ y: 2.22 }, () => b.roof(5.4, 5.4, 1.2, 0x3a4a5a, { ry: Math.PI / 2, gable: 0x8a3a2e }));
    b.box(1.6, 0.32, 0.05, 0xf6f1e6, { y: 1.95, z: 2.52 });
    return b;
  }
  function fLager() {
    G3.seed(4440);
    const b = new MB();
    b.box(4, 0.12, 3, 0x8a857c);
    b.at({ y: 0.12, z: -0.1 }, () => {
      b.box(3.6, 1.7, 2.5, 0xe6eef2, { top: 0xd0d9de });
      for (let i = 0; i < 12; i++) b.box(0.02, 1.7, 2.52, 0xc9d3d9, { x: -1.7 + i * 0.31 });
      b.box(1.3, 1.3, 0.05, 0x5a7a8a, { x: -0.7, z: 1.26 });
      b.box(1.6, 0.35, 0.05, 0x2f6fb0, { x: 0.9, y: 1.2, z: 1.27 });
      b.at({ y: 1.7 }, () => b.roof(3.9, 2.8, 0.6, 0x5a6268, { gable: 0xe6eef2 }));
    });
    for (let i = 0; i < 3; i++) b.box(0.44, 0.2, 0.32, i % 2 ? 0x2f6fb0 : 0xd9e1e6, { x: 1.3, y: i * 0.2, z: 1.35 });
    return b;
  }
  function fMarkt() {
    G3.seed(4450);
    const b = new MB();
    b.noise(0.06, () => b.plate(5, 3, 0xd9d1c2, { y0: 0.012 }));
    [[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.2], [2.2, 1.2]].forEach(([x, z]) => b.box(0.1, 2.1, 0.1, C.woodD, { x, z }));
    for (let i = 0; i < 9; i++) b.box(0.52, 0.05, 2.8, i % 2 ? 0xffffff : 0x2f6fb0, { x: -2.1 + i * 0.52, y: 2.1, rx: 0.12 });
    b.box(4, 0.8, 0.8, C.wood, { z: 0.4, top: 0xd9e1e6 });
    for (let i = 0; i < 6; i++) b.sphere(0.09, 7, 5, 0x9aa8b0, { x: -1.5 + i * 0.6, y: 0.86, z: 0.4, sz: 2.6, sy: 0.55 });
    b.box(2.4, 0.4, 0.05, 0xf6f1e6, { y: 1.6, z: 1.25 });
    b.box(0.8, 0.1, 0.02, 0x2f6fb0, { y: 1.65, z: 1.28 });
    return b;
  }
  /* v58: Ruderboot als kleine nordische Karve – spitz an beiden Enden, Klinkerplanken
     (drei überlappende Gänge, dunkle Fugen), hochgezogene geschwungene Steven, geteertes Holz */
  function rowboat() {
    G3.seed(4460);
    const b = new MB();
    const S = [[-1.12, 0.04], [-0.85, 0.3], [-0.35, 0.45], [0.35, 0.45], [0.85, 0.3], [1.12, 0.04]];
    /* drei Plankengänge je Seite: Höhe unten/oben, Breitenfaktor unten/oben */
    const strakes = [[-0.06, 0.08, 0.62, 0.8, 0x5e3f26], [0.08, 0.2, 0.82, 0.94, 0x6e4a2c], [0.2, 0.32, 0.95, 1.04, 0x7a5232]];
    /* Planke als flacher Quader von (x0, z0) nach (x1, z1) – von allen Seiten sichtbar */
    const plank = (x0, z0, x1, z1, y, h, t, col, tilt) => {
      const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz) + 0.02;
      b.at({ x: (x0 + x1) / 2, y, z: (z0 + z1) / 2, ry: Math.atan2(dx, dz) }, m => m.box(t, h, len, col, { rz: tilt || 0 }));
    };
    for (let i = 0; i < S.length - 1; i++) {
      const [z0, w0] = S[i], [z1, w1] = S[i + 1];
      strakes.forEach(([y0, y1, f0, f1, col]) => [1, -1].forEach(s => {
        const f = (f0 + f1) / 2;
        plank(s * w0 * f, z0, s * w1 * f, z1, (y0 + y1) / 2, y1 - y0 + 0.02, 0.035, col, -s * 0.35);
        /* dunkle Fuge an der Oberkante: der nächste Gang überlappt */
        plank(s * w0 * (f1 + 0.01), z0, s * w1 * (f1 + 0.01), z1, y1, 0.018, 0.02, 0x2e2016);
      }));
      plank(0, z0, 0, z1, -0.05, 0.04, Math.max(0.12, (w0 + w1) * 0.62), 0x3a2a1c);     /* Kiel/Boden außen */
      plank(0, z0, 0, z1, 0.07, 0.02, Math.max(0.1, (w0 + w1) * 0.78), 0x8a6a44);       /* Bodenbretter innen */
    }
    /* Spanten innen und Dollbord oben */
    [-0.6, -0.2, 0.2, 0.6].forEach(z => b.box(0.82, 0.03, 0.04, 0x5a3c24, { y: 0.1, z }));
    /* zwei Ruderbänke */
    [-0.1, 0.62].forEach(z => b.box(0.84, 0.045, 0.2, 0x8a6440, { y: 0.24, z }));
    /* Steven vorn und hinten: steigen auf und rollen sich am Ende nach innen */
    [1, -1].forEach(s => {
      for (let k = 0; k < 6; k++) {
        const t = k / 5, y = 0.08 + t * 0.52, z = s * (1.1 + Math.sin(t * Math.PI * 0.9) * 0.14 - t * t * 0.08);
        b.box(0.07, 0.12, 0.07, k % 2 ? 0x3a2a1c : 0x4a3424, { y, z, rx: -s * (0.2 + t * 0.9) });
      }
      b.sphere(0.05, 6, 4, 0x3a2a1c, { y: 0.64, z: s * 1.08 });
    });
    /* zwei Riemen mit Blättern, schräg an den Seiten */
    [-1, 1].forEach(s => b.at({ x: s * 0.58, y: 0.3, ry: s * 0.25 }, m => {
      m.box(0.035, 0.035, 1.3, C.woodL);
      m.box(0.05, 0.012, 0.26, 0xb08458, { z: -0.62 });
    }));
    return b;
  }
  function motorboat() {
    G3.seed(4470);
    const b = new MB();
    b.box(1.0, 0.4, 2.2, 0xf6f5f0, { y: -0.05 });
    b.box(1.02, 0.1, 2.22, 0x2f6fb0, { y: 0.1 });
    b.cone(0.5, 0.6, 4, 0xf6f5f0, { rx: Math.PI / 2, y: 0.15, z: 1.1, a0: Math.PI / 4, sy: 0.8 });
    b.box(0.8, 0.05, 0.6, 0xc9955a, { y: 0.35, z: -0.3 });
    b.box(0.7, 0.35, 0.05, C.glass, { y: 0.35, z: 0.3, rx: -0.4 });
    b.box(0.25, 0.45, 0.25, 0x2a2a2e, { y: 0.0, z: -1.15 });
    return b;
  }

  /* ------------------------------ Wildtiere ----------------------------- */
  function deer(white) {
    G3.seed(4500);
    const b = new MB(), c = white ? 0xf4f2ec : 0xa86a3c, d = white ? 0xdedad0 : 0x8a5430;
    b.box(0.32, 0.3, 0.75, c, { y: 0.6 });
    [[-0.11, -0.28], [0.11, -0.28], [-0.11, 0.28], [0.11, 0.28]].forEach(([x, z]) => b.box(0.06, 0.6, 0.06, d, { x, z }));
    b.box(0.13, 0.42, 0.13, c, { y: 0.8, z: 0.36, rx: 0.4 });
    b.box(0.16, 0.16, 0.28, c, { y: 1.15, z: 0.5 });
    b.box(0.06, 0.06, 0.06, 0x1d1d20, { y: 1.15, z: 0.65 });
    [-1, 1].forEach(s => { b.box(0.03, 0.25, 0.03, white ? 0xe8d8a0 : 0x6b4a30, { x: s * 0.07, y: 1.3, z: 0.45, rz: s * 0.4 }); b.box(0.03, 0.12, 0.03, white ? 0xe8d8a0 : 0x6b4a30, { x: s * 0.14, y: 1.42, z: 0.45, rz: -s * 0.4 }); });
    b.box(0.08, 0.1, 0.05, 0xffffff, { y: 0.66, z: -0.39 });
    return b;
  }
  function hare() {
    const b = new MB();
    b.sphere(0.13, 7, 5, 0x9a7a5a, { y: 0.14, sz: 1.3 });
    b.sphere(0.08, 7, 5, 0x9a7a5a, { y: 0.24, z: 0.13 });
    [-1, 1].forEach(s => b.box(0.03, 0.18, 0.05, 0x8a6a4a, { x: s * 0.035, y: 0.36, z: 0.11, rx: -0.3 }));
    b.sphere(0.04, 6, 4, 0xffffff, { y: 0.16, z: -0.17 });
    return b;
  }
  function boar() {
    const b = new MB();
    b.box(0.34, 0.32, 0.7, 0x4a3a30, { y: 0.24 });
    b.box(0.06, 0.12, 0.6, 0x3a2e26, { y: 0.56 });
    b.box(0.24, 0.24, 0.26, 0x4a3a30, { y: 0.24, z: 0.44 });
    b.box(0.12, 0.1, 0.06, 0x8a6a5a, { y: 0.24, z: 0.58 });
    [-1, 1].forEach(s => b.box(0.02, 0.07, 0.02, 0xf2ead8, { x: s * 0.07, y: 0.28, z: 0.58, rz: s * 0.4 }));
    [[-0.11, -0.25], [0.11, -0.25], [-0.11, 0.22], [0.11, 0.22]].forEach(([x, z]) => b.box(0.07, 0.12, 0.07, 0x2a221c, { x, z }));
    return b;
  }
  function fox() {
    const b = new MB();
    b.box(0.2, 0.18, 0.5, 0xd86a2a, { y: 0.22 });
    [[-0.07, -0.18], [0.07, -0.18], [-0.07, 0.18], [0.07, 0.18]].forEach(([x, z]) => b.box(0.04, 0.22, 0.04, 0x2a221c, { x, z }));
    b.box(0.16, 0.15, 0.18, 0xd86a2a, { y: 0.34, z: 0.3 });
    b.cone(0.06, 0.16, 4, 0xe8eae6, { rx: Math.PI / 2, y: 0.36, z: 0.4 });
    [-1, 1].forEach(s => b.cone(0.04, 0.1, 4, 0xd86a2a, { x: s * 0.05, y: 0.42, z: 0.28 }));
    b.cyl(0.07, 0.03, 0.4, 6, 0xd86a2a, { rx: -1.9, y: 0.3, z: -0.24, top: 0xffffff });
    /* Augen in der Glutfarbe – leuchten nachts wie echtes Augenleuchten */
    [-1, 1].forEach(s => b.sphere(0.018, 5, 3, 0xffd47e, { x: s * 0.042, y: 0.37, z: 0.39 }));
    return b;
  }
  function squirrel() {
    const b = new MB();
    b.sphere(0.06, 6, 4, 0xb85a28, { y: 0.07, sy: 1.3 });
    b.sphere(0.045, 6, 4, 0xb85a28, { y: 0.15, z: 0.03 });
    b.cyl(0.05, 0.07, 0.18, 6, 0xc8682e, { y: 0.08, z: -0.07, rx: -0.4 });
    return b;
  }
  function bird(c) {
    const b = new MB();
    b.sphere(0.06, 6, 4, c || 0x3a3a40, { sz: 1.6 });
    b.cone(0.02, 0.05, 4, 0xf2a531, { rx: Math.PI / 2, z: 0.1 });
    return b;
  }
  function birdWing(c) {
    const b = new MB();
    b.quad([0, 0, 0.05], [0.18, 0.01, 0.02], [0.16, 0.01, -0.06], [0, 0, -0.05], c || 0x3a3a40);
    b.quad([0, 0, -0.05], [0.16, 0.01, -0.06], [0.18, 0.01, 0.02], [0, 0, 0.05], c || 0x3a3a40);
    return b;
  }
  /* Nachtschwärmer: Eule (im Flug, Augen leuchten nachts) und Fledermaus */
  function owl() {
    const b = new MB(), c = 0x8a6a48, l = 0xd2bc94;
    b.sphere(0.12, 8, 6, c, { sz: 1.45, bottom: l });
    b.sphere(0.1, 8, 6, c, { y: 0.05, z: 0.15 });
    b.sphere(0.075, 8, 5, l, { y: 0.045, z: 0.2, sz: 0.55 });                       /* Gesichtsschleier */
    [-1, 1].forEach(s => {
      b.sphere(0.024, 6, 4, 0xffd47e, { x: s * 0.034, y: 0.065, z: 0.245 });         /* Augen */
      b.sphere(0.011, 5, 3, 0x1d1d20, { x: s * 0.034, y: 0.065, z: 0.266 });
      b.cone(0.024, 0.07, 4, c, { x: s * 0.06, y: 0.12, z: 0.12, rz: -s * 0.25 });   /* Federohren */
    });
    b.cone(0.016, 0.05, 4, 0x5a4a30, { rx: Math.PI / 2 + 0.5, y: 0.03, z: 0.25 });   /* Schnabel */
    b.box(0.16, 0.025, 0.14, c, { y: -0.01, z: -0.2, top: 0x7a5a3c });              /* Schwanz */
    return b;
  }
  function owlWing() {
    const b = new MB(), c = 0x7a5a3c, l = 0xb89a70;
    b.quad([0, 0, 0.1], [0.24, 0.01, 0.09], [0.34, 0.015, 0.0], [0, 0, -0.08], c);
    b.tri([0, 0, -0.08], [0.34, 0.015, 0.0], [0.26, 0.012, -0.1], c);
    b.quad([0, 0, -0.08], [0.34, 0.015, 0.0], [0.24, 0.01, 0.09], [0, 0, 0.1], l);
    b.tri([0, 0, -0.08], [0.26, 0.012, -0.1], [0.34, 0.015, 0.0], l);
    [0.1, 0.18, 0.26].forEach(x => b.box(0.012, 0.004, 0.12, 0x5a4028, { x, y: 0.012, z: 0.0 }));
    return b;
  }
  function bat() {
    const b = new MB(), c = 0x5a4844;
    b.sphere(0.045, 6, 4, c, { sz: 1.5 });
    b.sphere(0.034, 6, 4, c, { y: 0.012, z: 0.07 });
    [-1, 1].forEach(s => b.cone(0.013, 0.045, 3, c, { x: s * 0.018, y: 0.035, z: 0.07 }));
    return b;
  }
  function batWing() {
    const b = new MB(), c = 0x3e3230;
    /* Flughaut mit gezackter Hinterkante – von beiden Seiten sichtbar */
    const P = [[0, 0, 0.035], [0.1, 0.02, 0.05], [0.21, 0.012, 0.025], [0.17, 0, -0.03], [0.125, 0, -0.008], [0.08, 0, -0.05], [0.035, 0, -0.012], [0, 0, -0.04]];
    for (let i = 1; i < P.length - 1; i++) { b.tri(P[0], P[i], P[i + 1], c); b.tri(P[0], P[i + 1], P[i], c); }
    b.box(0.2, 0.012, 0.012, 0x2e2422, { x: 0.1, y: 0.012, z: 0.035, rz: -0.08 });   /* Arm */
    return b;
  }
  /* Igel: rundlicher Körper voller Stacheln, helle Schnauze */
  function hedgehog() {
    G3.seed(4590);
    const b = new MB(), sp = 0x5a4a3a;
    b.sphere(0.12, 8, 5, 0x6a5848, { y: 0.08, sy: 0.65, sz: 1.25 });
    for (let r = 0; r < 4; r++) for (let k = -2; k <= 2; k++) {
      const z = 0.08 - r * 0.07, a = k * 0.42;
      b.cone(0.03, 0.09, 3, r % 2 ? sp : 0x4a3c30, { x: Math.sin(a) * 0.08, y: 0.08 + Math.cos(a) * 0.06, z, rz: -a * 1.2, rx: -0.7 - r * 0.15 });
    }
    b.cone(0.055, 0.11, 5, 0xc8aa84, { rx: Math.PI / 2, y: 0.06, z: 0.11 });
    b.sphere(0.016, 5, 3, 0x1d1d20, { y: 0.06, z: 0.225 });
    [-1, 1].forEach(s => b.sphere(0.012, 4, 3, 0x1d1d20, { x: s * 0.03, y: 0.09, z: 0.15 }));
    [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.07], [0.06, 0.07]].forEach(([x, z]) => b.box(0.03, 0.04, 0.03, 0x4a3c30, { x, z }));
    return b;
  }
  /* Graureiher: steht im flachen Wasser am Seeufer */
  function heron() {
    const b = new MB(), g = 0x9aa2ac, w = 0xeceef0, d = 0x3a3c44;
    [-1, 1].forEach(s => b.box(0.022, 0.44, 0.022, 0xc8a050, { x: s * 0.045 }));
    b.sphere(0.12, 8, 5, g, { y: 0.54, sz: 1.6, rx: -0.3 });
    [-1, 1].forEach(s => b.box(0.03, 0.09, 0.28, 0x6a707a, { x: s * 0.105, y: 0.5, z: -0.06, rx: -0.3, top: d })); /* Schwingen */
    b.box(0.08, 0.03, 0.14, d, { y: 0.48, z: -0.24, rx: -0.5 });                    /* Schwanz */
    b.cyl(0.032, 0.026, 0.32, 5, w, { y: 0.6, z: 0.14, rx: 0.25 });                  /* Hals */
    b.sphere(0.05, 6, 4, w, { y: 0.92, z: 0.22, sz: 1.2 });
    b.box(0.014, 0.014, 0.14, d, { y: 0.95, z: 0.12, rx: 0.3 });                     /* Schopf */
    b.cone(0.018, 0.17, 4, 0xe0a030, { rx: Math.PI / 2, y: 0.91, z: 0.26 });          /* Schnabel */
    [-1, 1].forEach(s => b.sphere(0.01, 4, 3, 0x1d1d20, { x: s * 0.04, y: 0.93, z: 0.25 }));
    return b;
  }
  /* Haustiere */
  function dog() {
    const b = new MB();
    b.box(0.24, 0.2, 0.5, 0xc89a5a, { y: 0.24 });
    [[-0.08, -0.18], [0.08, -0.18], [-0.08, 0.18], [0.08, 0.18]].forEach(([x, z]) => b.box(0.06, 0.24, 0.06, 0xb8884a, { x, z }));
    b.box(0.2, 0.2, 0.22, 0xc89a5a, { y: 0.4, z: 0.3 });
    b.box(0.1, 0.08, 0.1, 0x2a221c, { y: 0.4, z: 0.43 });
    [-1, 1].forEach(s => b.box(0.05, 0.12, 0.08, 0x8a5a2a, { x: s * 0.1, y: 0.44, z: 0.28 }));
    b.cyl(0.03, 0.02, 0.25, 5, 0xc89a5a, { rx: -0.8, y: 0.38, z: -0.27 });
    return b;
  }
  function cat() {
    const b = new MB();
    b.box(0.16, 0.14, 0.36, 0x6a6a72, { y: 0.16 });
    [[-0.05, -0.12], [0.05, -0.12], [-0.05, 0.12], [0.05, 0.12]].forEach(([x, z]) => b.box(0.04, 0.16, 0.04, 0x5a5a62, { x, z }));
    b.sphere(0.09, 7, 5, 0x6a6a72, { y: 0.3, z: 0.2 });
    [-1, 1].forEach(s => b.cone(0.035, 0.07, 4, 0x5a5a62, { x: s * 0.05, y: 0.37, z: 0.2 }));
    b.cyl(0.02, 0.02, 0.3, 5, 0x5a5a62, { rx: -1.1, y: 0.2, z: -0.18 });
    return b;
  }
  function goat() {
    const b = new MB();
    b.box(0.26, 0.26, 0.55, 0xf2ece0, { y: 0.32 });
    [[-0.08, -0.2], [0.08, -0.2], [-0.08, 0.2], [0.08, 0.2]].forEach(([x, z]) => b.box(0.06, 0.32, 0.06, 0xdcd4c4, { x, z }));
    /* Kopf (Boxen stehen auf y), Schnauze, Nase und Ziegenbart */
    const F = 0.45;                                                     /* Vorderseite des Kopfs */
    b.box(0.18, 0.21, 0.24, 0xf2ece0, { y: 0.55, z: 0.33 });
    b.box(0.11, 0.09, 0.08, 0xe9e1d2, { y: 0.53, z: F + 0.02 });
    b.box(0.05, 0.02, 0.012, 0x8a6a5a, { y: 0.595, z: F + 0.065 });
    b.box(0.04, 0.09, 0.03, 0xd8cfbf, { y: 0.45, z: F + 0.01 });
    [-1, 1].forEach(s => b.box(0.03, 0.15, 0.03, 0x8a7a6a, { x: s * 0.05, y: 0.74, z: 0.28, rx: -0.5 }));
    [-1, 1].forEach(s => b.box(0.08, 0.035, 0.05, 0xe3dbcb, { x: s * 0.12, y: 0.69, z: 0.28, rz: s * 0.3 }));
    /* Ziege Tim: schwarze, eckige Hornbrille – etwas breiter als der Kopf, Augen dahinter */
    const blk = 0x111113, fz = F + 0.012;
    [-1, 1].forEach(s => {
      const x = s * 0.051;
      b.box(0.064, 0.046, 0.006, 0xe9f4fc, { x, y: 0.638, z: F + 0.004 });                 /* Glas */
      b.box(0.022, 0.024, 0.008, 0x1d1d20, { x: x - s * 0.007, y: 0.65, z: F + 0.008 });  /* Pupille */
      b.box(0.096, 0.022, 0.022, blk, { x, y: 0.683, z: fz });                              /* oben kräftig */
      b.box(0.096, 0.013, 0.02, blk, { x, y: 0.625, z: fz });                               /* unten schmal */
      b.box(0.017, 0.08, 0.022, blk, { x: x + s * 0.0395, y: 0.625, z: fz });
      b.box(0.013, 0.08, 0.02, blk, { x: x - s * 0.0415, y: 0.625, z: fz });
      b.box(0.014, 0.018, 0.2, blk, { x: s * 0.1, y: 0.685, z: F - 0.09 });                /* Bügel */
    });
    b.box(0.03, 0.014, 0.02, blk, { y: 0.672, z: fz });                                     /* Steg */
    return b;
  }
  /* Kopf mit Haar, Mütze/Hut/Helm, Bart und Augen; yo = Versatz in y (0 = Lage am Körper, −0,8 = um den Hals)
     v112: Frisuren o.hs (kurz, scheitel, pferd, lang, dutt, locken, buzz, glatze) – nur ohne Kopfbedeckung sichtbar;
     Kopfbedeckungen: hut, stroh, cap, baecker, strick, muetze, helm, helmf (Gehörschutz), helmg (Schutzbrille) */
  function hairdo(b, o, yo) {
    const h = o.hair, hs = o.hs || "kurz";
    if (h == null || hs === "glatze") return;
    const hc = mix(h, 0x000000, 0.12);
    if (hs === "buzz") { b.sphere(0.123, 8, 4, h, { y: 0.94 + yo, sy: 0.78 }); return; }
    b.sphere(0.127, 8, 4, h, { y: 0.95 + yo, sy: 0.82 });                                  /* Kappe */
    if (hs === "scheitel") { b.box(0.16, 0.05, 0.2, hc, { x: 0.035, y: 1.0 + yo, z: 0.0, rz: -0.18 }); b.box(0.03, 0.07, 0.17, hc, { x: -0.115, y: 0.9 + yo }); }
    else if (hs === "pferd") { b.sphere(0.05, 6, 4, hc, { y: 0.985 + yo, z: -0.115 }); b.box(0.05, 0.18, 0.05, h, { y: 0.8 + yo, z: -0.145, rx: 0.14 }); b.box(0.06, 0.02, 0.06, 0xd8332b, { y: 0.97 + yo, z: -0.125 }); }
    else if (hs === "lang") { b.box(0.26, 0.3, 0.06, h, { y: 0.66 + yo, z: -0.1 }); [-1, 1].forEach(q => b.box(0.04, 0.2, 0.1, hc, { x: q * 0.12, y: 0.78 + yo, z: -0.04 })); }
    else if (hs === "dutt") { b.sphere(0.065, 7, 5, hc, { y: 1.075 + yo, z: -0.03 }); b.box(0.03, 0.06, 0.1, h, { y: 0.9 + yo, z: -0.115 }); }
    else if (hs === "locken") { for (let i = 0; i < 9; i++) { const q = i / 9 * 6.283, up = i % 3; b.sphere(0.052, 6, 4, i % 2 ? h : hc, { x: Math.cos(q) * 0.105, y: 0.98 + yo + up * 0.02, z: Math.sin(q) * 0.105 }); } b.sphere(0.06, 6, 4, h, { y: 1.05 + yo }); }
    else { b.box(0.05, 0.05, 0.02, hc, { x: 0.05, y: 1.0 + yo, z: 0.12, rz: 0.4 }); }       /* kurz: Stirnsträhne */
  }
  function headParts(b, o, yo) {
    const skin = o.skin || 0xf2c9a0, hat = o.hat;
    b.sphere(0.12, 8, 6, skin, { y: 0.92 + yo });
    if (o.hair && !hat) hairdo(b, o, yo);
    if (hat === "hut") { b.cyl(0.2, 0.2, 0.03, 10, 0x4a5a3a, { y: 1.0 + yo }); b.cyl(0.12, 0.1, 0.12, 10, 0x4a5a3a, { y: 1.02 + yo }); b.box(0.03, 0.06, 0.06, 0xd8332b, { x: 0.11, y: 1.06 + yo }); }
    if (hat === "stroh") { b.cyl(0.235, 0.235, 0.02, 12, 0xe2c870, { y: 1.0 + yo }); b.cyl(0.125, 0.115, 0.1, 10, 0xe8d080, { y: 1.01 + yo }); b.cyl(0.128, 0.128, 0.03, 10, 0x9a3a2a, { y: 1.03 + yo, notop: true, nobot: true }); }
    if (hat === "cap") { b.sphere(0.13, 8, 4, o.hatC || 0x2f6fb0, { y: 1.0 + yo, sy: 0.62 }); b.box(0.17, 0.02, 0.12, mix(o.hatC || 0x2f6fb0, 0x000000, 0.2), { y: 1.0 + yo, z: 0.15, rx: 0.12 }); }
    if (hat === "baecker") { b.cyl(0.125, 0.125, 0.07, 10, 0xf6f4ee, { y: 1.0 + yo }); b.sphere(0.15, 9, 5, 0xfaf8f2, { y: 1.06 + yo, sy: 0.55 }); }
    if (hat === "strick") { b.sphere(0.13, 8, 4, o.hatC || 0x2b4a6a, { y: 0.995 + yo, sy: 0.72 }); b.cyl(0.133, 0.133, 0.035, 9, mix(o.hatC || 0x2b4a6a, 0xffffff, 0.2), { y: 0.985 + yo, notop: true, nobot: true }); b.sphere(0.03, 5, 4, 0xe8e8e0, { y: 1.1 + yo }); }
    if (hat === "muetze") b.sphere(0.13, 8, 4, 0x2f6fb0, { y: 1.0 + yo, sy: 0.6 });
    if (hat === "helm" || hat === "helmf" || hat === "helmg") {
      const hc = o.hatC || (hat === "helmg" ? 0xf2c231 : 0xf2a531);
      b.sphere(0.135, 8, 4, hc, { y: 1.0 + yo, sy: 0.65 });
      b.box(0.2, 0.02, 0.05, mix(hc, 0x000000, 0.18), { y: 1.0 + yo, z: 0.12 });                       /* Krempe vorn */
      if (hat === "helmf") [-1, 1].forEach(q => { b.box(0.05, 0.09, 0.08, 0x2f5a3a, { x: q * 0.135, y: 0.9 + yo }); b.box(0.01, 0.02, 0.07, 0x2a2a2e, { x: q * 0.07, y: 1.07 + yo }); });    /* Gehörschutz */
      if (hat === "helmg") { b.box(0.19, 0.05, 0.03, 0x2a2e36, { y: 0.98 + yo, z: 0.125 }); [-1, 1].forEach(q => b.box(0.07, 0.035, 0.012, 0xcfe8f4, { x: q * 0.045, y: 0.985 + yo, z: 0.143 })); }   /* Schutzbrille */
    }
    if (o.beard) b.box(0.16, 0.1, 0.06, o.beard, { y: 0.84 + yo, z: 0.1 });
    b.box(0.03, 0.03, 0.02, 0x1d1d20, { x: 0.04, y: 0.95 + yo, z: 0.115 }); b.box(0.03, 0.03, 0.02, 0x1d1d20, { x: -0.04, y: 0.95 + yo, z: 0.115 });
  }
  /* v95: der Kopf allein, Drehpunkt am Hals (Ursprung = Halsansatz, y = 0,8 am Körper) – für Gespräch, Nicken, Kopfschütteln */
  function head(o) {
    o = o || {};
    G3.seed(4600 + (o.seed || 0));
    const b = new MB();
    headParts(b, o, -0.8);
    return b;
  }
  /* v112: Arbeitskleidung je Beruf. o.garb: bib (Latzhose/Wathose), apron (Schürze), leather (Lederschürze), vest (Weste mit Taschen),
     hivis (Warnweste), plaid (Flanell mit Hosenträgern), overall (Overall mit Brusttasche und Werkzeuggürtel), kittel (Kittel mit blauer Schürze);
     o.gc = Farbe des Kleidungsstücks, o.boots = Stiefelfarbe, o.cargo = aufgesetzte Hosentaschen */
  function garbParts(b, o) {
    const T = 0.095, gc = o.gc || 0x3f5f8f, dk = mix(gc, 0x000000, 0.25), lt = mix(gc, 0xffffff, 0.18);
    switch (o.garb) {
      case "bib": {
        b.box(0.31, 0.11, 0.19, gc, { y: 0.4 });
        b.box(0.2, 0.26, 0.02, gc, { y: 0.42, z: T });
        [-1, 1].forEach(q => {
          b.box(0.04, 0.2, 0.02, gc, { x: q * 0.07, y: 0.62, z: T });
          b.box(0.04, 0.016, 0.2, gc, { x: q * 0.07, y: 0.8 });
          b.box(0.04, 0.34, 0.016, gc, { x: q * 0.07, y: 0.46, z: -T });
          b.box(0.026, 0.026, 0.01, 0xe8c04a, { x: q * 0.07, y: 0.66, z: T + 0.012 });
        });
        b.box(0.1, 0.075, 0.012, dk, { y: 0.52, z: T + 0.012 });
        b.box(0.1, 0.012, 0.014, lt, { y: 0.585, z: T + 0.012 });
        break;
      }
      case "apron": case "leather": case "kittel": {
        const long = o.garb !== "apron", y0 = long ? 0.2 : 0.27;
        if (o.garb === "kittel") { b.box(0.02, 0.37, 0.19, 0xcfd2d4, { y: 0.43 }); b.box(0.07, 0.06, 0.012, 0xe6e8ea, { x: 0.08, y: 0.64, z: T + 0.01 }); b.box(0.045, 0.012, 0.012, 0x3a78b8, { x: 0.08, y: 0.685, z: T + 0.012 }); }
        b.box(0.25, 0.66 - y0, 0.022, gc, { y: y0, z: T + 0.006 });
        [-1, 1].forEach(q => b.box(0.03, 0.17, 0.02, gc, { x: q * 0.065, y: 0.64, z: T }));
        b.box(0.04, 0.016, 0.2, gc, { x: 0, y: 0.8 });
        b.box(0.31, 0.03, 0.19, dk, { y: 0.46 });
        b.box(0.15, 0.085, 0.014, dk, { y: y0 + 0.07, z: T + 0.02 });
        if (o.garb === "leather") { b.box(0.18, 0.02, 0.015, lt, { y: y0 + 0.17, z: T + 0.02 }); b.box(0.02, 0.07, 0.02, 0xb8bcc4, { x: 0.11, y: 0.4, z: T }); }
        break;
      }
      case "vest": case "hivis": {
        [-1, 1].forEach(q => {
          b.box(0.1, 0.36, 0.02, gc, { x: q * 0.085, y: 0.43, z: T });
          b.box(0.08, 0.016, 0.2, gc, { x: q * 0.1, y: 0.8 });
          b.box(0.07, 0.07, 0.016, dk, { x: q * 0.09, y: 0.46, z: T + 0.012 });
          b.box(0.06, 0.06, 0.016, dk, { x: q * 0.09, y: 0.58, z: T + 0.012 });
        });
        b.box(0.31, 0.36, 0.02, gc, { y: 0.43, z: -T });
        if (o.garb === "hivis") { b.box(0.312, 0.03, 0.192, 0xe8ebe0, { y: 0.52 }); b.box(0.312, 0.03, 0.192, 0xe8ebe0, { y: 0.66 }); }
        else b.box(0.03, 0.06, 0.01, 0xe8d8a0, { x: -0.09, y: 0.7, z: T + 0.014 });
        break;
      }
      case "plaid": {
        const st = dk;
        for (let i = -2; i <= 2; i++) b.box(0.022, 0.38, 0.19, st, { x: i * 0.06, y: 0.42 });
        [0.5, 0.64].forEach(y => b.box(0.31, 0.024, 0.19, st, { y }));
        [-1, 1].forEach(q => { b.box(0.032, 0.4, 0.192, 0x2a2a30, { x: q * 0.075, y: 0.42 }); b.box(0.034, 0.03, 0.01, 0xb8bcc4, { x: q * 0.075, y: 0.45, z: T + 0.014 }); });
        break;
      }
      case "overall": {
        b.box(0.1, 0.075, 0.014, dk, { x: 0.06, y: 0.6, z: T + 0.012 });
        b.box(0.012, 0.09, 0.016, 0xc8ccd2, { x: 0.085, y: 0.63, z: T + 0.018 });                           /* Schraubenschlüssel in der Tasche */
        b.box(0.31, 0.04, 0.19, 0x6a4a2a, { y: 0.45 });                                                       /* Werkzeuggürtel */
        b.box(0.04, 0.03, 0.02, 0xd8b050, { y: 0.455, z: T + 0.01 });
        [[-0.17, 0.03], [0.17, 0.03]].forEach(([x, z]) => { b.box(0.06, 0.1, 0.07, 0x7a5a3a, { x, y: 0.35, z }); });
        b.box(0.02, 0.1, 0.02, 0xd8332b, { x: 0.17, y: 0.44, z: 0.03, rz: -0.2 });                           /* Schraubendreher */
        [-1, 1].forEach(q => b.box(0.034, 0.016, 0.2, dk, { x: q * 0.08, y: 0.8 }));
        break;
      }
    }
    if (o.cargo) [-1, 1].forEach(q => b.box(0.022, 0.1, 0.075, mix(o.pants || 0x3a4a5a, 0x000000, 0.2), { x: q * 0.119, y: 0.2 }));
  }
  /* Arm gebeugt (sitzend): Oberarm hängt, Unterarm liegt locker auf dem Oberschenkel; s = −1 links, +1 rechts; x,y = Schulter */
  function bentArm(b, o, s, x, y) {
    const shirt = o.shirt || 0x3f78c8, skin = o.skin || 0xf2c9a0, up = 0.34, fl = 0.25, ex = 1.6, ry = -s * 0.45;
    b.box(0.07, up, 0.08, shirt, { x, y: y - up, rz: s * 0.04 });
    b.box(0.066, fl, 0.072, shirt, { x, y: y - up, rx: ex, ry });
    const dz = Math.sin(ex) * fl, dx = Math.sin(ry) * dz, dy = Math.cos(ex) * fl;
    b.box(0.062, 0.062, 0.074, skin, { x: x + dx * 1.04, y: y - up + dy - 0.02, z: dz * 0.98 + 0.02 * 0, ry });
  }
  /* Leute: Förster, Nachbar, Bürgermeisterin, Mitarbeiter */
  function person(o) {
    o = o || {};
    G3.seed(4600 + (o.seed || 0));
    const b = new MB();
    const shirt = o.shirt || 0x3f78c8, pants = o.pants || 0x3a4a5a, skin = o.skin || 0xf2c9a0, hat = o.hat, boot = o.boots;
    /* v81: o.sit – sitzend. v95: Oberschenkel waagerecht in Höhe 0,317–0,417 (= Sitzhöhe 0,46 bei Maßstab 1,45), die Unterschenkel
       hängen senkrecht nach unten bis zum Boden, die Füße stehen davor; der Körper bleibt in Standhöhe (dy = 0). Die Beine sind lang genug,
       um vor der Sofakante frei zu hängen. o.noHead – Kopf als eigenes Teil (head()), damit er sich drehen und nicken kann. */
    const dy = 0;
    if (o.noLegs) { /* v114: Beine als eigene Teile (Haftzelle: Beine baumeln) */ }
    else if (o.sit) {
      [-0.07, 0.07].forEach(x => {
        b.box(0.09, 0.317, 0.1, pants, { x, z: 0.24 });
        b.box(0.09, 0.1, 0.35, pants, { x, y: 0.317, z: 0.115 });
        b.box(0.095, 0.05, 0.15, boot || 0x2a2a30, { x, z: 0.275 });
        if (boot) b.box(0.098, 0.12, 0.108, boot, { x, z: 0.24 });
      });
    } else [-0.07, 0.07].forEach(x => {
      b.box(0.09, 0.42, 0.11, pants, { x });
      if (boot) { b.box(0.098, 0.11, 0.118, boot, { x }); b.box(0.098, 0.05, 0.06, boot, { x, z: 0.06 }); }
    });
    b.box(0.3, 0.38, 0.18, shirt, { y: 0.42 + dy });
    if (o.garb) garbParts(b, o);
    /* armR: false – der rechte Arm kommt als eigenes, bewegliches Teil dazu (arm()) */
    [-1, 1].forEach(s => {
      if (o.noArms || (s === 1 && o.armR === false)) return;
      if (o.sit) bentArm(b, o, s, s * 0.19, 0.78);                                                  /* v112: sitzend – gebeugt, Hand auf dem Oberschenkel */
      else b.box(0.07, 0.34, 0.08, shirt, { x: s * 0.19, y: 0.44 + dy, rz: s * 0.08 });
    });
    if (!o.noHead) headParts(b, o, 0);
    if (o.tool === "axt" && !o.sit) { b.box(0.03, 0.5, 0.03, C.woodD, { x: 0.22, y: 0.3 + dy, rz: 0.2 }); b.box(0.12, 0.08, 0.02, 0x9aa6af, { x: 0.27, y: 0.55 + dy, rz: 0.2 }); }
    return b;
  }
  /* Arm zum Bewegen: Drehpunkt an der Schulter, hängt nach unten, mit Hand */
  function arm(o) {
    o = o || {};
    const b = new MB();
    b.box(0.07, 0.34, 0.08, o.shirt || 0x3f78c8, { y: -0.34 });
    b.box(0.062, 0.065, 0.072, o.skin || 0xf2c9a0, { y: -0.4 });
    return b;
  }
  /* v112: derselbe Arm gebeugt (sitzend) – Unterarm nach vorn auf den Oberschenkel */
  function armSit(o) {
    const b = new MB();
    bentArm(b, o || {}, 1, 0, 0);
    return b;
  }
  /* Saison-Deko */
  function cosDeco(k) {
    G3.seed(4700 + k.length);
    const b = new MB();
    if (k === "xmas") {
      b.cyl(0.1, 0.08, 0.3, 6, 0x6b4a30);
      for (let i = 0; i < 4; i++) b.cone(0.75 - i * 0.15, 0.7, 8, i % 2 ? 0x2f7a3a : 0x2c6e36, { y: 0.25 + i * 0.42 });
      for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, y = 0.4 + rnd() * 1.4, r = (0.72 - (y - 0.3) * 0.4) * 0.95; b.sphere(0.06, 6, 4, [0xd8332b, 0xf2c230, 0x3f78c8, 0xffffff][i % 4], { x: Math.cos(a) * r, y, z: Math.sin(a) * r }); }
      b.ico(0.12, 0xf2c230, { y: 2.12 });
    } else if (k === "lantern") {
      [[0, 0, 0.22], [0.32, 0.12, 0.16]].forEach(([x, z, r]) => {
        b.sphere(r, 9, 6, 0xf08a24, { x, y: r * 0.8, z, sy: 0.8 });
        b.box(r * 0.5, r * 0.25, 0.02, C.glow, { x, y: r * 0.85, z: z + r * 0.92 });
        b.box(0.03, 0.08, 0.03, 0x6b8f2c, { x, y: r * 1.6, z });
      });
    } else if (k === "maypole") {
      b.cyl(0.07, 0.05, 3.2, 6, 0xf6f1e6);
      b.cyl(0.4, 0.4, 0.06, 10, 0x2f7a3a, { y: 2.6 });
      for (let i = 0; i < 6; i++) b.box(0.03, 1.8, 0.02, [0xd8332b, 0x3f78c8, 0xf2c230][i % 3], { x: Math.cos(i) * 0.35, y: 0.9, z: Math.sin(i) * 0.35, rz: Math.cos(i) * 0.15, rx: Math.sin(i) * 0.15 });
      b.ico(0.35, 0x4f9a35, { y: 3.2, jitter: 0.3 });
    } else if (k === "snowman") {
      b.sphere(0.35, 9, 7, 0xffffff, { y: 0.32, smooth: true });
      b.sphere(0.25, 9, 7, 0xffffff, { y: 0.78, smooth: true });
      b.sphere(0.17, 9, 7, 0xffffff, { y: 1.12, smooth: true });
      b.cone(0.04, 0.18, 6, 0xf08a24, { rx: Math.PI / 2, y: 1.12, z: 0.16 });
      b.cyl(0.13, 0.13, 0.18, 8, 0x2a2a2e, { y: 1.24 });
      b.cyl(0.2, 0.2, 0.02, 8, 0x2a2a2e, { y: 1.24 });
    } else if (k === "easter") {
      b.box(0.5, 0.06, 0.4, C.woodD);
      b.sphere(0.22, 8, 6, 0xd9b07a, { y: 0.28, sy: 1.1 });
      b.sphere(0.14, 8, 6, 0xd9b07a, { y: 0.58 });
      [-1, 1].forEach(s => b.box(0.05, 0.25, 0.04, 0xc9a06a, { x: s * 0.06, y: 0.78, rz: s * 0.15 }));
      [[0.25, 0.1, 0xf6b3cf], [-0.22, 0.12, 0x8fd1f0], [0.15, -0.14, 0xf2e34a]].forEach(([x, z, c]) => b.sphere(0.06, 7, 5, c, { x, y: 0.1, z, sy: 1.3 }));
    }
    return b;
  }

  /* ---------------------- Fliegender Händler ---------------------------
     Bunter Marktwagen: Seitenklappe als gestreiftes Vordach, Theke mit Ware,
     Wimpelkette und ein großes Münzschild auf dem Dach. Theke zeigt nach −x. */
  function traderCart() {
    G3.seed(5600);
    const b = new MB(), body = 0x7a4ac8, trim = 0xf2c230, dark = 0x2a2a30;
    [[0.5, 0.75], [-0.5, 0.75], [0.5, -0.8], [-0.5, -0.8]].forEach(([x, z]) => {
      b.cyl(0.22, 0.22, 0.14, 10, dark, { rz: Math.PI / 2, x: x > 0 ? x + 0.07 : x - 0.07, y: 0.22, z, top: 0x9aa6af });
    });
    b.box(1.1, 0.2, 2.3, 0x4a3a5a, { y: 0.24 });
    /* Fahrerhaus vorn */
    b.box(1.08, 0.75, 0.6, 0xf3f4f6, { y: 0.42, z: 0.85 });
    b.box(1.0, 0.3, 0.05, C.glass, { y: 0.82, z: 1.16, rx: -0.25 });
    b.box(1.1, 0.08, 0.62, trim, { y: 1.17, z: 0.85 });
    /* Kofferaufbau, links (−x) offen */
    b.box(1.12, 1.2, 1.6, body, { y: 0.42, z: -0.35, top: 0x6a3ab8 });
    b.box(0.05, 0.75, 1.5, 0xfff3d6, { x: -0.54, y: 0.62, z: -0.35 });                /* Innenwand hell */
    b.box(0.3, 0.12, 1.55, 0xc9955a, { x: -0.7, y: 0.78, z: -0.35, top: 0xd8a868 });      /* Theke */
    b.box(0.05, 0.4, 1.55, 0xb8884a, { x: -0.84, y: 0.4, z: -0.35 });
    /* Ware: Äpfel, Kürbis, Gläser, Kisten */
    b.noise(0.12, m => {
      for (let i = 0; i < 7; i++) m.sphere(0.07, 6, 4, [0xd8332b, 0xf2a531, 0x7ac043][i % 3], { x: -0.7 + (i % 2) * 0.08, y: 0.97, z: -0.95 + i * 0.1 });
      m.sphere(0.13, 7, 5, 0xe8781e, { x: -0.68, y: 1.0, z: -0.05, sy: 0.75 });
      [0, 1, 2].forEach(i => { m.cyl(0.05, 0.05, 0.14, 7, 0xf2c230, { x: -0.72, y: 0.9, z: 0.12 + i * 0.12 }); m.cyl(0.055, 0.055, 0.03, 7, 0xd8332b, { x: -0.72, y: 1.04, z: 0.12 + i * 0.12 }); });
      m.box(0.26, 0.18, 0.3, 0xc9955a, { x: -0.95, y: 0.0, z: -0.6 });
      m.box(0.24, 0.18, 0.28, 0xb8884a, { x: -1.0, y: 0.0, z: -0.25, ry: 0.3 });
      for (let i = 0; i < 4; i++) m.sphere(0.06, 6, 4, 0xd8332b, { x: -0.95 + (i % 2) * 0.08, y: 0.22, z: -0.66 + (i >> 1) * 0.1 });
    });
    /* Klappe als Vordach, gestreift */
    for (let i = 0; i < 6; i++) b.box(0.9, 0.05, 0.27, i % 2 ? 0xfff3d6 : 0xd8332b, { x: -0.95, y: 1.55, z: -1.03 + i * 0.27, rz: -0.32 });
    [-1.08, 0.38].forEach(z => b.box(0.04, 0.85, 0.04, 0x9aa6af, { x: -1.32, y: 0.0, z }));
    /* Wimpelkette */
    for (let i = 0; i < 7; i++) {
      const z = -1.1 + i * 0.25, col = [0xd8332b, 0xf2c230, 0x3f78c8, 0x47b84f][i % 4];
      b.tri([-1.36, 1.38, z], [-1.36, 1.38, z + 0.2], [-1.36, 1.2, z + 0.1], col);
      b.tri([-1.36, 1.38, z + 0.2], [-1.36, 1.38, z], [-1.36, 1.2, z + 0.1], col);
    }
    /* Münzschild auf dem Dach */
    b.box(0.06, 0.5, 0.06, dark, { y: 1.62, z: -0.35 });
    b.cyl(0.36, 0.36, 0.08, 16, trim, { rx: Math.PI / 2, y: 2.25, z: -0.39, top: 0xffd84a });
    b.cyl(0.24, 0.24, 0.1, 16, 0xe2a91c, { rx: Math.PI / 2, y: 2.25, z: -0.4, top: 0xf2c230 });
    b.box(0.08, 0.26, 0.04, 0xb8860b, { y: 2.12, z: -0.29 });
    return b;
  }

  /* ===================== v121: Holz-Bausatz für die Warenbildchen =====================
     Stil bleibt Low-Poly mit flachen Facetten (wie die ganze Welt), aber jede Fläche bekommt Farbverläufe je Ecke (triV):
     • Langholz: ruhige Maserstreifen in Faserrichtung, jedes Brett etwas anders getönt
     • Hirnholz (Schnittflächen): heller, mit Jahresringen als feine Linien um den Kern, bei Balken ein Schwundriss
     • Fasen an allen Kanten, etwas heller als die Flächen – das ist die Glanzkante, die das Stück plastisch macht
     • Rinde je Holzart (Birke weiß mit Querstrichen, Kiefer rotbraun geschuppt, Buche glatt grau, Eiche tief gefurcht,
       Kirsche rotbraun mit hellen Querbändern)
     Alles deterministisch (G3.seed je Ware), ohne Texturen; Licht und Kontur kommen einheitlich aus thumbOf/thumbCrop. */
  const WT = {
    fichte: { a: 0xe2bf84, b: 0xc79c5e, ring: 0xa97b42, hirn: 0xeccf9c, core: 0xd4ad72 },
    kiefer: { a: 0xdcae6e, b: 0xbd8649, ring: 0x9a6534, hirn: 0xe8c68e, core: 0xc68c50 },
    buche:  { a: 0xdcb086, b: 0xc29168, ring: 0xa8764e, hirn: 0xe6c29a, core: 0xd3a074 },
    eiche:  { a: 0xc99a5e, b: 0xa67a43, ring: 0x86592c, hirn: 0xd8b07a, core: 0xa87440 },
    kirsche: { a: 0xc0744c, b: 0x9e5534, ring: 0x7a3c22, hirn: 0xcf8a62, core: 0x8f4a2c },
    birke:  { a: 0xe8d3a6, b: 0xcfb27e, ring: 0xb9976a, hirn: 0xefdcb4, core: 0xdcc196 },
    alt:    { a: 0xb98c5c, b: 0x9a6f44, ring: 0x6f4b2c, hirn: 0xcca170, core: 0x8f6440 }
  };
  const BARK = {
    birke:  { a: 0xf1eee6, b: 0xdcd8cc, mark: 0x2a2722, rim: 0x6f675a },
    kiefer: { a: 0xc9743f, b: 0x8a4a28, mark: 0x5e3420, rim: 0x6a3a22 },
    buche:  { a: 0xb2b1a9, b: 0x8f8e86, mark: 0x7a7972, rim: 0x6f6d66 },
    eiche:  { a: 0x6a5240, b: 0x3e2f24, mark: 0x2c2119, rim: 0x3a2b20 },
    kirsche: { a: 0x7a3b33, b: 0x562621, mark: 0xb98a6e, rim: 0x4a201c },
    ast:    { a: 0x7d6a54, b: 0x5a4a3a, mark: 0x4a3c2e, rim: 0x4e3f30 }
  };
  const cv = c => G3.col(c);
  const lerpC = (a, b, t) => { a = cv(a); b = cv(b); t = t < 0 ? 0 : t > 1 ? 1 : t; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  const mulC = (c, f) => { c = cv(c); return [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)]; };
  const hs = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  /* Viereck A-B-C-D (gegen den Uhrzeigersinn von außen) mit Farbe je Ecke */
  function q4(b, A, B, C, D, ca, cb, cc, cd) { b.triV(A, B, C, ca, cb, cc); b.triV(A, C, D, ca, cc, cd); }
  /* Strang: Querschnitt-Polygone R[i] (gleich viele Punkte, gegen den Uhrzeigersinn von +z gesehen) an z[i] (aufsteigend) → Mantel;
     col(i, j, s, p, jv): Farbe für Ring i, Seitenfläche j, s = 0/1 (Anfangs-/Endpunkt der Kante), Punkt p, Eckindex jv */
  function extrude(b, R, Z, col, o) {
    o = o || {};
    const n = R.length, m = R[0].length;
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < m; j++) {
      const j1 = (j + 1) % m, A = [R[i][j][0], R[i][j][1], Z[i]], B = [R[i][j1][0], R[i][j1][1], Z[i]], Cc = [R[i + 1][j1][0], R[i + 1][j1][1], Z[i + 1]], D = [R[i + 1][j][0], R[i + 1][j][1], Z[i + 1]];
      /* Außen ist rechts von der Kante (Polygon gegen den Uhrzeigersinn): A, B, C, D reicht schon richtig herum */
      q4(b, A, B, Cc, D, col(i, j, 0, A, j), col(i, j, 1, B, j1), col(i + 1, j, 1, Cc, j1), col(i + 1, j, 0, D, j));
    }
    if (o.cap0) capPoly(b, R[0], Z[0], -1, o.cap0);
    if (o.cap1) capPoly(b, R[n - 1], Z[n - 1], 1, o.cap1);
    return b;
  }
  /* Deckel eines Polygons (Fächer vom Schwerpunkt), dir = +1 schaut nach +z, −1 nach −z; col(p) */
  function capPoly(b, P, z, dir, col) {
    let cx = 0, cy = 0; P.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= P.length; cy /= P.length;
    const c = [cx, cy, z], cc = col(c);
    for (let j = 0; j < P.length; j++) {
      const p = [P[j][0], P[j][1], z], q = [P[(j + 1) % P.length][0], P[(j + 1) % P.length][1], z];
      if (dir > 0) b.triV(c, p, q, cc, col(p), col(q)); else b.triV(c, q, p, cc, col(q), col(p));
    }
  }
  /* Linie auf einer Fläche z = const (Jahresring, Riss): Punkte L in (x, y), Breite w, Farbe c, leicht vor der Fläche */
  function lineZ(b, L, z, dir, w, c) {
    for (let k = 0; k < L.length - 1; k++) {
      const a = L[k], e = L[k + 1], dx = e[0] - a[0], dy = e[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2, zz = z + dir * 0.0025;
      const A = [a[0] - nx, a[1] - ny, zz], B = [e[0] - nx, e[1] - ny, zz], Cc = [e[0] + nx, e[1] + ny, zz], D = [a[0] + nx, a[1] + ny, zz];
      if (dir > 0) q4(b, A, B, Cc, D, c, c, c, c); else q4(b, A, D, Cc, B, c, c, c, c);
    }
  }
  /* Jahresringe auf einem Hirnholz-Rechteck [x0,x1]×[y0,y1] um den Kern (px, py) – Kreisbögen, an den Rändern abgeschnitten */
  function ringsRect(b, x0, x1, y0, y1, z, dir, px, py, radii, w, c) {
    const ins = 0.012;
    radii.forEach(r => {
      let L = [];
      for (let k = 0; k <= 48; k++) {
        const a = (k / 48) * Math.PI * 2, x = px + Math.cos(a) * r, y = py + Math.sin(a) * r;
        if (x > x0 + ins && x < x1 - ins && y > y0 + ins && y < y1 - ins) L.push([x, y]);
        else { if (L.length > 1) lineZ(b, L, z, dir, w, c); L = []; }
      }
      if (L.length > 1) lineZ(b, L, z, dir, w, c);
    });
  }
  /* Querschnitt mit Fase c: Rechteck w × h (x mittig, y von 0 bis h); Hauptflächen in nx bzw. ny Abschnitte geteilt
     (damit die Maser quer über die Fläche laufen kann). Rückgabe: Punkte P und je Seitenfläche, ob sie eine Fase ist (hi) */
  function chamRect(w, h, c, nx, ny) {
    nx = nx || 1; ny = ny || 1;
    const P = [], hi = [], seg = (a, e, n, fase) => { for (let k = 0; k < n; k++) { P.push([a[0] + (e[0] - a[0]) * k / n, a[1] + (e[1] - a[1]) * k / n]); hi.push(fase); } };
    seg([-w / 2 + c, 0], [w / 2 - c, 0], nx, false); seg([w / 2 - c, 0], [w / 2, c], 1, true);
    seg([w / 2, c], [w / 2, h - c], ny, false); seg([w / 2, h - c], [w / 2 - c, h], 1, true);
    seg([w / 2 - c, h], [-w / 2 + c, h], nx, false); seg([-w / 2 + c, h], [-w / 2, h - c], 1, true);
    seg([-w / 2, h - c], [-w / 2, c], ny, false); seg([-w / 2, c], [-w / 2 + c, 0], 1, true);
    return { P, hi };
  }
  /* Kantholz / Brett / Balken in Faserrichtung z, Mitte bei z = 0. o: { w, h, l, ch, wt (Holzton), tone, seg, pith: [x, y] relativ, rings, crack, saw, stamp } */
  function lumber(b, o) {
    const W = WT[o.wt || "fichte"], w = o.w, h = o.h, l = o.l, ch = o.ch != null ? o.ch : Math.min(w, h) * 0.08, tone = o.tone || 1, seg = o.seg || 6;
    const CR = o.prof || chamRect(w, h, ch, o.nx || 5, o.ny || (h > w * 0.5 ? 4 : 1)), P = CR.P, R = [], Z = [];
    for (let i = 0; i <= seg; i++) { R.push(P); Z.push(-l / 2 + (l * i) / seg); }
    const ph = (o.seed || 1) * 3.7;
    const grain = (p, s) => {
      /* Maser: Streifen quer zur Faser, sanft gewellt entlang z */
      const u = (Math.abs(p[1] - h) < 1e-6 || p[1] < 1e-6 ? p[0] : p[1]) * 34 + Math.sin(p[2] * 2.3 + ph) * 1.6 + ph;
      let c = lerpC(W.a, W.b, 0.5 + 0.5 * Math.sin(u));
      if (Math.sin(u * 0.53 + 2.1) > 0.82) c = lerpC(c, W.ring, 0.45);                          /* einzelne dunkle Maserlinien */
      if (o.saw) c = mulC(c, 1 - 0.06 * (0.5 + 0.5 * Math.sin(p[2] * 38 + ph)));                 /* Sägespuren quer */
      return mulC(c, tone * (0.97 + 0.06 * hs(p[0] * 3, p[1] * 3, p[2] * 2 + ph)));
    };
    extrude(b, R, Z, (i, j, s, p) => { const c = o.colAt ? o.colAt(p, j, CR.hi[j]) : grain(p, s); return CR.hi[j] ? mulC(c, 1.09) : c; }, {});          /* Fasen = Glanzkanten */
    /* Hirnholz beider Enden */
    const hirn = p => mulC(lerpC(W.hirn, W.ring, 0.12 + 0.1 * hs(p[0] * 9, p[1] * 9, ph)), tone);
    capPoly(b, P, l / 2, 1, hirn); capPoly(b, P, -l / 2, -1, hirn);
    const px = o.pith ? o.pith[0] * w : (hs(ph, 1, 2) - 0.5) * w * 0.6, py = o.pith ? o.pith[1] * h : -h * (0.8 + hs(ph, 3, 4) * 1.5);
    const rr = o.rings || (() => { const d = Math.hypot(px, py - h / 2), out = []; for (let k = 1; k <= 14; k++) { const r = d - Math.max(w, h) * 0.9 + k * Math.max(w, h) * 0.16; if (r > 0.01) out.push(r); } return out; })();
    [1, -1].forEach(dir => ringsRect(b, -w / 2, w / 2, 0, h, dir * l / 2, dir, px, py, rr, Math.max(0.004, Math.min(w, h) * 0.035), mulC(W.ring, tone)));
    if (o.crack) [1, -1].forEach(dir => lineZ(b, [[px, py], [px + w * 0.05, h - ch * 0.5]], dir * l / 2, dir, Math.min(w, h) * 0.04, mulC(W.ring, 0.6)));
    if (o.crack) { const c = mulC(W.ring, 0.55); q4(b, [px - 0.004, h + 0.002, -l * 0.38], [px + 0.004, h + 0.002, -l * 0.38], [px + 0.01, h + 0.002, l * 0.3], [px + 0.002, h + 0.002, l * 0.3], c, c, c, c); }
    return b;
  }
  /* Stamm: Rinde je Art, Hirnholz mit Kern, Splint, Ringen, Rindenrand und Trockenriss */
  function logPiece(b, o) {
    const sp = o.sp, K = BARK[sp] || BARK.kiefer, W = WT[sp === "edel" ? "kirsche" : sp] || WT.kiefer, r = o.r, l = o.l, seg = 14, nL = 6, ph = (o.seed || 1) * 1.37;
    const R = [], Z = [];
    for (let i = 0; i <= nL; i++) {
      const z = -l / 2 + (l * i) / nL, P = [];
      for (let j = 0; j < seg; j++) {
        const a = (j / seg) * Math.PI * 2, furrow = sp === "eiche" ? (j % 2 ? 0.93 : 1.02) : sp === "kiefer" ? (j % 3 === 0 ? 0.95 : 1.01) : 1;
        const rr = r * furrow * (1 + (hs(i * 1.3 + ph, j * 2.1, 5) - 0.5) * (sp === "buche" ? 0.02 : 0.06)) * (1 - 0.03 * (z / l));
        P.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
      R.push(P); Z.push(z);
    }
    extrude(b, R, Z, (i, j0, s, p, j) => {
      const n = hs(i * 1.7 + ph, j * 0.9, 9);
      let c;
      if (sp === "birke") c = lerpC(K.a, K.b, n * 0.6);
      else if (sp === "kiefer") c = lerpC(K.a, K.b, j % 3 === 0 ? 0.85 : n * 0.45);
      else if (sp === "eiche") c = lerpC(K.a, K.b, j % 2 ? 0.95 : n * 0.4);
      else if (sp === "kirsche") c = lerpC(K.a, K.b, n * 0.5);
      else c = lerpC(K.a, K.b, n * 0.35);
      return mulC(c, 0.96 + 0.08 * hs(p[0] * 7, p[1] * 7, p[2] * 5 + ph));
    }, {});
    /* Querstriche der Birke, helle Korkbänder der Kirsche: schmale Streifen dicht auf der Rinde */
    if (sp === "birke" || sp === "kirsche") {
      const nM = sp === "birke" ? 9 : 6;
      for (let k = 0; k < nM; k++) {
        const z = -l / 2 + l * (0.08 + 0.84 * hs(k, ph, 1)), a0 = hs(k, 2, ph) * Math.PI * 2, span = sp === "birke" ? 0.5 + hs(k, 3, ph) * 0.7 : 1.4, dz = sp === "birke" ? 0.022 : 0.012, rr = r * 1.012;
        for (let s2 = 0; s2 < 4; s2++) {
          const a1 = a0 + (s2 / 4) * span, a2 = a0 + ((s2 + 1) / 4) * span, c = cv(K.mark);
          q4(b, [Math.cos(a1) * rr, Math.sin(a1) * rr, z - dz], [Math.cos(a2) * rr, Math.sin(a2) * rr, z - dz], [Math.cos(a2) * rr, Math.sin(a2) * rr, z + dz], [Math.cos(a1) * rr, Math.sin(a1) * rr, z + dz], c, c, c, c);
        }
      }
    }
    /* Hirnholz: Kern dunkler, Splint heller, Rindenrand */
    [[nL, 1], [0, -1]].forEach(([i, dir]) => {
      const P = R[i], z = Z[i];
      const inner = P.map(p => [p[0] * 0.86, p[1] * 0.86]);
      /* Rindenring */
      for (let j = 0; j < seg; j++) {
        const j1 = (j + 1) % seg, A = [P[j][0], P[j][1], z], B = [P[j1][0], P[j1][1], z], Cc = [inner[j1][0], inner[j1][1], z], D = [inner[j][0], inner[j][1], z], c = cv(K.rim);
        if (dir > 0) q4(b, A, B, Cc, D, c, c, c, c); else q4(b, D, Cc, B, A, c, c, c, c);
      }
      capPoly(b, inner, z, dir, p => { const d = Math.hypot(p[0], p[1]) / (r * 0.86); return lerpC(W.core, W.hirn, Math.min(1, d * 1.25)); });
      const rings = [0.22, 0.4, 0.56, 0.7].map(k => k * r);
      rings.forEach(rr => { const L = []; for (let k = 0; k <= 28; k++) { const a = (k / 28) * Math.PI * 2, w = 1 + (hs(k, rr * 50, ph) - 0.5) * 0.06; L.push([Math.cos(a) * rr * w, Math.sin(a) * rr * w]); } L[28] = L[0]; lineZ(b, L, z, dir, r * 0.035, W.ring); });
      const a = ph * 2.3 + dir;
      lineZ(b, [[Math.cos(a) * r * 0.08, Math.sin(a) * r * 0.08], [Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62]], z, dir, r * 0.05, mulC(W.ring, 0.62));
    });
    return b;
  }
  /* Scheit: Viertel eines Stamms (Keil mit Rinde außen), Spaltflächen hell mit Faser, Hirnholz mit Ringbögen um die Spitze */
  function splitPiece(b, o) {
    const sp = o.sp || "buche", K = BARK[sp] || BARK.buche, W = WT[sp] || WT.buche, r = o.r, l = o.l, ang = o.ang || 1.5, seg = 6, ph = (o.seed || 1) * 2.1;
    const P = [[0, 0]];
    for (let j = 0; j <= seg; j++) { const a = -ang / 2 + (ang * j) / seg; P.push([Math.cos(a) * r * (1 + (hs(j, ph, 1) - 0.5) * 0.06), Math.sin(a) * r * (1 + (hs(j, ph, 1) - 0.5) * 0.06)]); }
    /* Polygon gegen den Uhrzeigersinn: Spitze, dann den Bogen entlang */
    const R = [P, P, P], Z = [-l / 2, 0, l / 2];
    extrude(b, R, Z, (i, j, s, p, jv) => {
      if (j >= 1 && j <= seg) return mulC(lerpC(K.a, K.b, hs(i, jv, ph) * 0.5), 0.95 + 0.1 * hs(p[2] * 5, jv, ph));     /* Rinde */
      const u = Math.hypot(p[0], p[1]) * 30 + Math.sin(p[2] * 3 + ph) * 1.2;
      return mulC(lerpC(W.a, W.b, 0.5 + 0.5 * Math.sin(u)), 1.04);
    }, {});
    const hirn = p => lerpC(W.core, W.hirn, Math.min(1, Math.hypot(p[0], p[1]) / r * 1.2));
    capPoly(b, P, l / 2, 1, hirn); capPoly(b, P, -l / 2, -1, hirn);
    [1, -1].forEach(dir => [0.35, 0.58, 0.8].forEach(k => { const L = []; for (let q = 0; q <= 8; q++) { const a = -ang / 2 * 0.86 + (ang * 0.86 * q) / 8; L.push([Math.cos(a) * r * k, Math.sin(a) * r * k]); } lineZ(b, L, dir * l / 2, dir, r * 0.05, W.ring); }));
    return b;
  }
  /* Röhre entlang Punkten (Seil, Netz, Zweig), flach schattiert */
  function rope(b, pts, rad, col, sides) {
    sides = sides || 5;
    const n = pts.length, rings = [];
    let U = null;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], e = pts[Math.min(n - 1, i + 1)];
      let T = [e[0] - a[0], e[1] - a[1], e[2] - a[2]]; const tl = Math.hypot(T[0], T[1], T[2]) || 1; T = [T[0] / tl, T[1] / tl, T[2] / tl];
      if (!U) { const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; U = [T[1] * ref[2] - T[2] * ref[1], T[2] * ref[0] - T[0] * ref[2], T[0] * ref[1] - T[1] * ref[0]]; }
      else { const d = U[0] * T[0] + U[1] * T[1] + U[2] * T[2]; U = [U[0] - T[0] * d, U[1] - T[1] * d, U[2] - T[2] * d]; }
      const ul = Math.hypot(U[0], U[1], U[2]) || 1; U = [U[0] / ul, U[1] / ul, U[2] / ul];
      const V = [T[1] * U[2] - T[2] * U[1], T[2] * U[0] - T[0] * U[2], T[0] * U[1] - T[1] * U[0]], r = Array.isArray(rad) ? rad[i] : rad, R = [];
      for (let k = 0; k < sides; k++) { const t = (k / sides) * Math.PI * 2; R.push([pts[i][0] + (U[0] * Math.cos(t) + V[0] * Math.sin(t)) * r, pts[i][1] + (U[1] * Math.cos(t) + V[1] * Math.sin(t)) * r, pts[i][2] + (U[2] * Math.cos(t) + V[2] * Math.sin(t)) * r]); }
      rings.push(R);
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
      const k1 = (k + 1) % sides, A = rings[i][k], B = rings[i][k1], Cc = rings[i + 1][k1], D = rings[i + 1][k];
      const ca = typeof col === "function" ? col(i, k) : cv(col), cc = typeof col === "function" ? col(i + 1, k) : ca;
      /* Richtung prüfen: Normale soll von der Achse weg zeigen */
      const g = [(B[1] - A[1]) * (Cc[2] - A[2]) - (B[2] - A[2]) * (Cc[1] - A[1]), (B[2] - A[2]) * (Cc[0] - A[0]) - (B[0] - A[0]) * (Cc[2] - A[2]), (B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0])];
      const out = [A[0] - pts[i][0], A[1] - pts[i][1], A[2] - pts[i][2]];
      if (g[0] * out[0] + g[1] * out[1] + g[2] * out[2] >= 0) q4(b, A, B, Cc, D, ca, ca, cc, cc); else q4(b, A, D, Cc, B, ca, cc, cc, ca);
    }
    return b;
  }
  /* Drehkörper um y: Profil [[y, r], …], Farbe col(y, a) – Sack, Drechselbein */
  function lathe(b, prof, seg, col, rm) {
    const R = prof.map(([y, r]) => { const P = []; for (let j = 0; j < seg; j++) { const a = (j / seg) * Math.PI * 2, k = rm ? rm(y, a) : 1; P.push([Math.cos(a) * r * k, y, Math.sin(a) * r * k]); } return P; });
    for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < seg; j++) {
      const j1 = (j + 1) % seg, A = R[i][j], B = R[i][j1], Cc = R[i + 1][j1], D = R[i + 1][j];
      const a = (j / seg) * Math.PI * 2, a1 = ((j + 1) / seg) * Math.PI * 2;
      /* von außen gegen den Uhrzeigersinn: A (unten), D (oben) … */
      q4(b, A, D, Cc, B, col(prof[i][0], a, i, j), col(prof[i + 1][0], a, i + 1, j), col(prof[i + 1][0], a1, i + 1, j1), col(prof[i][0], a1, i, j1));
    }
    return b;
  }
  /* Spannband (rot) um ein Bündel: Rechteck w × h ab y0, an z */
  function band(b, w, h, y0, z, col) {
    const c = col || 0xd8332b, t = 0.012, d = 0.05;
    b.box(w + 2 * t, t, d, c, { y: y0 + h, z: z - d / 2 + d / 2 }); b.box(w + 2 * t, t, d, c, { y: y0 - t, z });
    [-1, 1].forEach(s => b.box(t, h + 2 * t, d, c, { x: s * (w / 2 + t / 2), y: y0 - t, z }));
    b.box(0.05, 0.03, d * 1.15, 0xb02a24, { y: y0 + h - 0.005, z });                                  /* Plombe */
  }

  /* v121: Holzwaren-Bildchen – alle 22 Holzartikel des Lagers (Stämme, Äste, Reste, Brennholz, Kaminholz, Pfosten, Bretter,
     Dielen, Balken, Kantholz, Bohlen, Platten, Kisten, Paletten, Möbelteile, Türen, Zaun, Schatulle). */
  const LOGSP = { birke: "birke", kiefer: "kiefer", buche: "buche", eiche: "eiche", edelholz: "kirsche" };
  const JUTE2 = { a: 0xd9c08c, b: 0xbfa36e, d: 0x9c8254, seam: 0xa88c5c };
  function jutesack(b, o) {
    /* gefüllter Jutesack: unten breit und etwas zusammengesackt, oben offen mit umgeschlagenem Rand, Inhalt schaut heraus;
       Webstruktur als feines Karo, eine Naht, weiche Falten */
    const prof = [[0, 0.27], [0.03, 0.335], [0.12, 0.37], [0.26, 0.365], [0.38, 0.34], [0.47, 0.31], [0.52, 0.3], [0.545, 0.315], [0.565, 0.32], [0.58, 0.3]];
    const rm = (y, a) => 1 + 0.05 * Math.sin(2 * a + 0.6) * (1 - y) + 0.035 * Math.sin(3 * a + 1.7) + (y < 0.1 ? 0.03 * Math.sin(5 * a) : 0);
    lathe(b, prof, 18, (y, a, i, j) => {
      const fold = 0.5 + 0.5 * Math.sin(a * 5 + y * 4), weave = ((i + j) % 2) * 0.06;
      let c = lerpC(JUTE2.a, JUTE2.b, fold * 0.5 + weave);
      if (y > 0.5) c = lerpC(c, 0xcbb07a, 0.4);                                                   /* umgeschlagener Rand */
      if (Math.abs(Math.sin(a - 0.9)) < 0.1 && y < 0.5) c = lerpC(c, JUTE2.seam, 0.6);            /* Naht */
      return mulC(c, y < 0.04 ? 0.82 : 1);
    }, rm);
    const ring = (y, r) => { const P = []; for (let j = 0; j < 18; j++) { const a = (j / 18) * Math.PI * 2, k = rm(y, a); P.push([Math.cos(a) * r * k, y, Math.sin(a) * r * k]); } return P; };
    const B = ring(0, 0.27); for (let j = 0; j < 18; j++) b.triV([0, 0, 0], B[j], B[(j + 1) % 18], JUTE2.d, JUTE2.d, JUTE2.d);
    /* Innenrand (dunkel) bis zur Füllung */
    const T = ring(0.58, 0.3), I = ring(0.5, 0.27);
    for (let j = 0; j < 18; j++) { const j1 = (j + 1) % 18; q4(b, T[j], T[j1], I[j1], I[j], 0x8a7046, 0x8a7046, 0x5a4428, 0x5a4428); }
    /* Füllung: flacher Hügel (Farbe je Inhalt) */
    const fc = (o && o.fillCol) || [0x9a7448, 0x7a5a36];
    const F = ring(0.53, 0.27); for (let j = 0; j < 18; j++) b.triV([0, 0.6, 0], F[(j + 1) % 18], F[j], fc[0], fc[1], fc[1]);
    /* v122: aufgenähtes Etikett vorn (gebogen wie der Sack), mit Farbband */
    if (o && o.label) {
      const rAt = y => { for (let k = 0; k < prof.length - 1; k++) if (y >= prof[k][0] && y <= prof[k + 1][0]) return prof[k][1] + (prof[k + 1][1] - prof[k][1]) * (y - prof[k][0]) / (prof[k + 1][0] - prof[k][0]); return prof[prof.length - 1][1]; };
      const pt = (y, a) => { const r = rAt(y) * rm(y, a) * 1.015; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
      const na = 6, ny = 4, a0 = Math.PI / 2 - 0.5, a1 = Math.PI / 2 + 0.5, y0 = 0.14, y1 = 0.36;
      for (let i = 0; i < ny; i++) for (let j = 0; j < na; j++) {
        const ya = y0 + (y1 - y0) * i / ny, yb = y0 + (y1 - y0) * (i + 1) / ny, aa = a0 + (a1 - a0) * j / na, ab = a0 + (a1 - a0) * (j + 1) / na;
        const c = (i === 1 || i === 2) ? o.label.band : o.label.col;
        q4(b, pt(ya, ab), pt(ya, aa), pt(yb, aa), pt(yb, ab), c, c, c, c);
      }
    }
    if (o && o.fill) o.fill(b);
  }
  /* Schatulle-, Tür- und Möbel-Messing */
  const BRASS2 = { a: 0xe8c25a, b: 0xb88a2a, d: 0x7a5a1a };
  function woodItem(id, b) {
    switch (id) {
      case "birke": case "kiefer": case "buche": case "eiche": case "edelholz": {
        const sp = LOGSP[id];
        [[-0.165, 0.155, 0.155, 1.1, 0.0], [0.165, 0.155, 0.15, 1.06, 0.04], [0.0, 0.43, 0.148, 1.12, -0.03]].forEach(([x, y, r, l, z], i) => b.at({ x, y, z }, m => logPiece(m, { sp, r, l, seed: i + 1 + id.length })));
        if (id === "edelholz") [[0.12, 0.66, 0.18], [-0.2, 0.42, 0.42]].forEach(([x, y, z]) => b.at({ x, y, z }, m => { const g = 0xffe27a; [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dx, dy]) => m.triV([0, 0, 0], [dx * 0.07 - dy * 0.012, dy * 0.07 + dx * 0.012, 0], [dx * 0.07 + dy * 0.012, dy * 0.07 - dx * 0.012, 0], g, 0xfff4c0, 0xfff4c0)); }));
        return true;
      }
      case "aeste": {
        /* Bündel krummer Äste mit Zweigstummeln, zweimal mit Hanfschnur gebunden */
        for (let i = 0; i < 9; i++) {
          const x = ((i % 3) - 1) * 0.075 + (hs(i, 1, 2) - 0.5) * 0.03, y = 0.05 + Math.floor(i / 3) * 0.065, r0 = 0.03 + hs(i, 2, 3) * 0.012, L = 1.05 + hs(i, 4, 5) * 0.2, pts = [], rr = [];
          for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([x + Math.sin(t * 5 + i) * 0.018, y + Math.sin(t * 4 + i * 2) * 0.015, -L / 2 + L * t]); rr.push(r0 * (1 - t * 0.45)); }
          rope(b, pts, rr, (k) => lerpC(BARK.ast.a, BARK.ast.b, hs(i, k, 7) * 0.6), 6);
          /* helle Schnittflächen */
          [[pts[0], rr[0], -1], [pts[5], rr[5], 1]].forEach(([p, r, d]) => b.at({ x: p[0], y: p[1], z: p[2] }, m => { const P = []; for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2; P.push([Math.cos(a) * r, Math.sin(a) * r]); } capPoly(m, P, 0, d, () => cv(0xe4c896)); }));
          if (i % 3 === 1) { const p = pts[2 + (i % 2)], d = i % 2 ? 1 : -1; rope(b, [p, [p[0] + d * 0.09, p[1] + 0.05, p[2] + 0.1], [p[0] + d * 0.14, p[1] + 0.09, p[2] + 0.13]], [0.012, 0.009, 0.004], BARK.ast.b, 5); }
        }
        [-0.26, 0.24].forEach(z => { const L = []; for (let k = 0; k <= 14; k++) { const a = (k / 14) * Math.PI * 2; L.push([Math.cos(a) * 0.15, 0.115 + Math.sin(a) * 0.105, z]); } rope(b, L, 0.011, 0xc9a46a, 5); });
        return true;
      }
      case "reste":
        jutesack(b, { fill: m => {
          /* Abschnitte schauen oben heraus, ein paar liegen davor */
          [[0.06, 0.6, 0.02, 0.5, 0.2], [-0.09, 0.61, -0.04, -0.6, 1.2], [0.02, 0.64, 0.1, 0.3, 2.1], [-0.03, 0.6, -0.12, 0.9, 0.6], [0.12, 0.6, -0.08, -0.3, 2.7], [-0.12, 0.58, 0.1, 0.2, 0.9]].forEach(([x, y, z, rx, ry], i) => m.at({ x, y, z, rx, ry }, q => lumber(q, { w: 0.07 + (i % 3) * 0.015, h: 0.035, l: 0.15 + (i % 4) * 0.025, wt: i % 2 ? "fichte" : "kiefer", seed: i + 3, seg: 1, nx: 1, ny: 1 })));
          [[0.32, 0.0, 0.26, 0.4], [0.42, 0.0, 0.1, 1.9], [0.24, 0.035, 0.34, 1.1]].forEach(([x, y, z, ry], i) => m.at({ x, y, z, ry }, q => lumber(q, { w: 0.08, h: 0.035, l: 0.15 + i * 0.03, wt: "fichte", seed: i + 7, seg: 1, nx: 1, ny: 1 })));
        } });
        return true;
      case "brennholz": {
        /* ordentlich gestapelte Scheite, alle parallel; jedes Scheit anders gedreht – Rinde, Spaltflächen und dreieckiges Hirnholz */
        const rows = [[4, 0.0], [3, 0.19], [2, 0.38]];
        let k = 0;
        rows.forEach(([n, y]) => { for (let i = 0; i < n; i++, k++) { const x = (i - (n - 1) / 2) * 0.215, rot = hs(k, 2, 7) * Math.PI * 2;
          b.at({ x, y: y + 0.1, z: (hs(k, 1, 1) - 0.5) * 0.1, rz: rot }, m => m.at({ x: -0.075 }, q => splitPiece(q, { sp: k % 3 === 2 ? "eiche" : "buche", r: 0.15, l: 0.56 + hs(k, 3, 3) * 0.08, ang: 1.65 + hs(k, 4, 4) * 0.35, seed: k + 1 }))); } });
        return true;
      }
      case "kaminholz": {
        /* Netzsack mit Buchenscheiten, liegend: vorn sieht man die hellen Hirnholz-Dreiecke, das orange Netz läuft in Ringen
           und Längsfäden darüber und ist hinten zugebunden (Clip und Etikett) */
        const C7 = [[0, 0.165], [-0.15, 0.09], [0.15, 0.09], [-0.15, 0.24], [0.15, 0.24], [0, 0.315], [0, 0.0]].slice(0, 6), Lg = 0.5;
        C7.forEach(([x, y], i) => b.at({ x: x * 0.95, y: y + 0.11, z: (hs(i, 1, 1) - 0.5) * 0.05, rz: hs(i, 2, 2) * Math.PI * 2 }, m => m.at({ x: -0.07 }, q => splitPiece(q, { sp: "buche", r: 0.14, l: Lg + hs(i, 3, 3) * 0.05, ang: 1.6, seed: i + 4 }))));
        const NET = 0xf2731e, cx = 0, cy = 0.27, rx = 0.285, ry = 0.255;
        for (let k = 0; k < 5; k++) { const z = -0.22 + k * 0.11, L = []; for (let t = 0; t <= 16; t++) { const a = (t / 16) * Math.PI * 2; L.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z + Math.sin(a * 2 + k) * 0.01]); } rope(b, L, 0.0075, NET, 4); }
        for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + 0.3, L = []; for (let t = 0; t <= 6; t++) { const z = 0.29 - t * 0.098, w = Math.sin(t * 1.3 + k) * 0.05, f = t === 0 ? 0.8 : 1; L.push([cx + Math.cos(a + w) * rx * f, cy + Math.sin(a + w) * ry * f, z]); }
          L.push([cx + Math.cos(a) * rx * 0.3, cy + Math.sin(a) * ry * 0.3, -0.4]); rope(b, L, 0.0065, NET, 4); }
        rope(b, [[0, cy, -0.4], [0, cy, -0.47]], 0.03, 0xd8551a, 6);
        b.at({ x: 0.05, y: cy - 0.1, z: -0.47, ry: 0.4 }, m => { m.box(0.16, 0.11, 0.008, 0xfaf4e4, { c: true }); m.box(0.12, 0.024, 0.01, NET, { y: 0.025, c: true }); m.box(0.08, 0.012, 0.01, 0x6a5a4a, { y: -0.02, c: true }); });
        return true;
      }
      case "pfosten": {
        /* Rundpfosten, geschält, angespitzt, Bund mit Spannband */
        for (let i = 0; i < 4; i++) {
          const x = (i % 2 - 0.5) * 0.19, y = 0.095 + Math.floor(i / 2) * 0.175, r = 0.088, L = 1.0, zz = (hs(i, 3, 1) - 0.5) * 0.05;
          b.at({ x, y, z: zz }, m => {
            const R = [], Z = [];
            for (let k = 0; k <= 4; k++) { const t = k / 4, P = []; for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2, rr = r * (1 + (hs(i, j, k) - 0.5) * 0.05); P.push([Math.cos(a) * rr, Math.sin(a) * rr]); } R.push(P); Z.push(-L / 2 + L * t); }
            /* Spitze: sechs Beilflächen */
            const tip = 0.26, A = [], ZA = [L / 2, L / 2 + tip * 0.55, L / 2 + tip];
            [1, 0.45, 0.04].forEach((k) => { const P = []; for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2; P.push([Math.cos(a) * r * k, Math.sin(a) * r * k]); } A.push(P); });
            const W = WT.kiefer;
            extrude(m, R, Z, (ii, j, s, p) => mulC(lerpC(W.a, W.b, 0.5 + 0.5 * Math.sin(j * 1.9 + i)), 0.95 + 0.08 * hs(p[2] * 4, j, i)), {});
            extrude(m, A, ZA, (ii, j) => mulC(cv(W.hirn), j % 2 ? 1.04 : 0.94), {});
            capPoly(m, R[0], -L / 2, -1, p => lerpC(W.core, W.hirn, Math.hypot(p[0], p[1]) / r));
            [0.3, 0.55, 0.8].forEach(k => { const Lr = []; for (let q = 0; q <= 20; q++) { const a = (q / 20) * Math.PI * 2; Lr.push([Math.cos(a) * r * k, Math.sin(a) * r * k]); } lineZ(m, Lr, -L / 2, -1, 0.004, W.ring); });
          });
        }
        band(b, 0.38, 0.35, 0.007, -0.25); band(b, 0.38, 0.35, 0.007, 0.2);
        return true;
      }
      case "bretter": {
        for (let i = 0; i < 10; i++) { const r = Math.floor(i / 2), c = i % 2; b.at({ x: (c - 0.5) * 0.275, y: r * 0.052, z: (hs(i, 1, 2) - 0.5) * 0.07 }, m => lumber(m, { w: 0.265, h: 0.048, l: 1.3, wt: i % 3 === 1 ? "kiefer" : "fichte", tone: 0.95 + hs(i, 2, 3) * 0.1, seed: i + 1, ch: 0.006, nx: 6 })); }
        band(b, 0.56, 0.27, 0.0, 0.32); band(b, 0.56, 0.27, 0.0, -0.36);
        return true;
      }
      case "dielen": {
        /* Hobeldielen mit Nut und Feder (an der Stirnseite zu sehen), glatt und hell */
        const w = 0.23, h = 0.042, t = 0.012, P = [[-w / 2, 0], [w / 2, 0], [w / 2, h * 0.34], [w / 2 + t, h * 0.38], [w / 2 + t, h * 0.66], [w / 2, h * 0.7], [w / 2, h], [-w / 2, h], [-w / 2, h * 0.7], [-w / 2 + t, h * 0.66], [-w / 2 + t, h * 0.38], [-w / 2, h * 0.34]];
        const sub = []; P.forEach((p, i) => { const q = P[(i + 1) % P.length]; const n = (i === 0 || i === 6) ? 5 : 1; for (let k = 0; k < n; k++) sub.push([p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n]); });
        const prof = { P: sub, hi: sub.map(() => false) };
        for (let i = 0; i < 8; i++) { const r = Math.floor(i / 2), c = i % 2; b.at({ x: (c - 0.5) * (w + t + 0.01), y: r * 0.046, z: (hs(i, 5, 2) - 0.5) * 0.05 }, m => lumber(m, { w, h, l: 1.4, wt: "fichte", tone: 1.02 + hs(i, 2, 3) * 0.05, seed: i + 11, prof })); }
        band(b, 0.52, 0.19, 0.0, 0.0, 0x2f78c8);
        return true;
      }
      case "balken": {
        /* zwei kräftige, sägeraue Balken mit Kern in der Mitte (Ringe rundum) und Schwundriss oben */
        [[-0.14, 0, 0], [0.14, 0, 0.06]].forEach(([x, y, z], i) => b.at({ x, y, z }, m => lumber(m, { w: 0.26, h: 0.26, l: 1.5, wt: "alt", tone: 1 - i * 0.05, seed: i + 21, ch: 0.018, pith: [0.04 - i * 0.08, 0.48], rings: [0.03, 0.06, 0.09, 0.12, 0.15, 0.18], saw: true, crack: true, nx: 5, ny: 5 })));
        b.at({ y: 0.262, z: -0.03, ry: 0.06 }, m => lumber(m, { w: 0.26, h: 0.26, l: 1.45, wt: "alt", tone: 0.97, seed: 23, ch: 0.018, pith: [0.5, 0.5], rings: [0.03, 0.06, 0.09, 0.12, 0.15, 0.18], saw: true, crack: true, nx: 5, ny: 5 }));
        return true;
      }
      case "bauholz": {
        /* Konstruktionsvollholz: gehobelt, hell, scharfe kleine Fasen, blauer Prüfstempel, als Paar gebunden */
        [[-0.115, 0], [0.115, 0]].forEach(([x], i) => b.at({ x, z: i * 0.04 }, m => {
          lumber(m, { w: 0.22, h: 0.22, l: 1.5, wt: "fichte", tone: 1.03 - i * 0.03, seed: i + 31, ch: 0.01, pith: [0.1 - i * 0.2, 0.5], rings: [0.04, 0.075, 0.11, 0.145], nx: 5, ny: 5 });
          m.box(0.12, 0.004, 0.17, 0x2f6fb0, { y: 0.22, z: 0.42 }); m.box(0.08, 0.005, 0.02, 0xeaf2fa, { y: 0.22, z: 0.45 }); m.box(0.08, 0.005, 0.02, 0xeaf2fa, { y: 0.22, z: 0.39 });
        }));
        band(b, 0.46, 0.22, 0.0, 0.3); band(b, 0.46, 0.22, 0.0, -0.35);
        return true;
      }
      case "bohlen": {
        /* unbesäumte Eichenbohlen: eine Kante gerade, die andere mit welliger Baumkante und Rindenstreifen */
        [0, 1].forEach(i => b.at({ y: i * 0.1, z: i * 0.14, x: -i * 0.07, ry: i * 0.07 }, m => {
          const w = 0.42, h = 0.085, L = 1.4, nL = 8, R = [], Z = [];
          for (let k = 0; k <= nL; k++) {
            const t = k / nL, wav = 0.03 * Math.sin(t * 5.3 + i * 2) + 0.015 * Math.sin(t * 13 + i), xr = w / 2 + wav;
            R.push([[-w / 2, 0], [-w / 2 + w * 0.25, 0], [-w / 2 + w * 0.5, 0], [-w / 2 + w * 0.75, 0], [xr - 0.03, 0], [xr, h * 0.35], [xr - 0.012, h * 0.75], [xr - 0.035, h], [-w / 2 + w * 0.75, h], [-w / 2 + w * 0.5, h], [-w / 2 + w * 0.25, h], [-w / 2, h]]);
            Z.push(-L / 2 + L * t);
          }
          const W = WT.eiche, K = BARK.eiche;
          extrude(m, R, Z, (ii, j, s, p) => {
            if (j === 4 || j === 5 || j === 6) return mulC(lerpC(K.a, K.b, hs(ii, j, i) * 0.6), 1.05);             /* Rinde an der Baumkante */
            const u = (j < 4 || j > 6) && Math.abs(p[1] - h) > 1e-4 && p[1] > 1e-4 ? p[1] * 60 : p[0] * 28 + Math.sin(p[2] * 2 + i) * 1.4;
            return mulC(lerpC(W.a, W.b, 0.5 + 0.5 * Math.sin(u)), 0.96 + 0.08 * hs(p[0] * 5, p[2] * 3, i));
          }, {});
          const hirn = p => lerpC(W.hirn, W.ring, 0.15 + 0.1 * hs(p[0] * 9, p[1] * 9, i));
          capPoly(m, R[nL], L / 2, 1, hirn); capPoly(m, R[0], -L / 2, -1, hirn);
          [1, -1].forEach(d => ringsRect(m, -w / 2, w / 2 - 0.04, 0, h, d * L / 2, d, 0.02, -0.22, [0.24, 0.27, 0.3, 0.33, 0.36], 0.005, W.ring));
        }));
        return true;
      }
      case "platten": {
        /* Sperrholzplatten: Deckfurnier mit Maser, an den Kanten die hellen und dunklen Lagen */
        for (let i = 0; i < 5; i++) b.at({ y: i * 0.066, x: (hs(i, 1, 1) - 0.5) * 0.05, z: (hs(i, 2, 2) - 0.5) * 0.05, ry: (hs(i, 3, 3) - 0.5) * 0.05 }, m => {
          const w = 0.95, l = 0.75, h = 0.064, nb = 3, W = { a: 0xdcbd84, b: 0xc29a5f, ring: 0x9a7040 };
          /* Kanten als Lagen */
          const layer = (y0, y1, k) => { const c = k % 2 ? cv(0x9c7444) : cv(0xe2c48e), cc = mulC(c, 0.92);
            q4(m, [-w / 2, y0, l / 2], [w / 2, y0, l / 2], [w / 2, y1, l / 2], [-w / 2, y1, l / 2], c, c, c, c);
            q4(m, [w / 2, y0, -l / 2], [-w / 2, y0, -l / 2], [-w / 2, y1, -l / 2], [w / 2, y1, -l / 2], cc, cc, cc, cc);
            q4(m, [w / 2, y0, l / 2], [w / 2, y0, -l / 2], [w / 2, y1, -l / 2], [w / 2, y1, l / 2], cc, cc, cc, cc);
            q4(m, [-w / 2, y0, -l / 2], [-w / 2, y0, l / 2], [-w / 2, y1, l / 2], [-w / 2, y1, -l / 2], c, c, c, c); };
          for (let k = 0; k < nb; k++) layer(h * k / nb, h * (k + 1) / nb, k);
          /* Deckfläche mit Maser (Streifen in x) */
          const nx = 6, nz = 10, tone = 0.95 + hs(i, 4, 4) * 0.08;
          for (let a = 0; a < nx; a++) for (let c2 = 0; c2 < nz; c2++) {
            const x0 = -w / 2 + w * a / nx, x1 = -w / 2 + w * (a + 1) / nx, z0 = -l / 2 + l * c2 / nz, z1 = -l / 2 + l * (c2 + 1) / nz;
            const g = (x, z) => { const u = z * 22 + Math.sin(x * 4 + i) * 2 + i; let c = lerpC(W.a, W.b, 0.5 + 0.5 * Math.sin(u)); if (Math.sin(u * 0.6 + 1) > 0.85) c = lerpC(c, W.ring, 0.35); return mulC(c, tone); };
            q4(m, [x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], g(x0, z1), g(x1, z1), g(x1, z0), g(x0, z0));
          }
          m.box(w, 0.002, l, 0xa8885a, {});
        });
        return true;
      }
      case "kisten": {
        /* Lattenkisten: Eckleisten, je Seite zwei Latten mit Spalt, Griffloch an den Stirnseiten, Boden innen dunkler */
        const crate = (x, y, z, ry, s) => b.at({ x, y, z, ry }, m => {
          const W = 0.5, D = 0.38, H = 0.3, t = 0.024, sl = 0.11;
          m.box(W - 0.02, 0.02, D - 0.02, 0x7a5a36, { y: 0.01 });
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => m.at({ x: sx * (W / 2 - 0.025), z: sz * (D / 2 - 0.025), y: H / 2 }, q => q.at({ rx: Math.PI / 2 }, r => lumber(r, { w: 0.05, h: 0.05, l: H, wt: "kiefer", seed: s + sx + sz * 3, ch: 0.006, seg: 1, nx: 1, ny: 1 }))));
          [0.035, 0.175].forEach((y0, k) => [-1, 1].forEach(sd => {
            m.at({ z: sd * (D / 2 + t / 2 - 0.004), y: y0, ry: Math.PI / 2 }, q => lumber(q, { w: t, h: sl, l: W - 0.02, wt: "fichte", tone: 0.96 + k * 0.05, seed: s + k + sd, ch: 0.004, seg: 2, nx: 1, ny: 3 }));
            m.at({ x: sd * (W / 2 + t / 2 - 0.004), y: y0 }, q => lumber(q, { w: t, h: sl, l: D - 0.02, wt: "fichte", tone: 0.98 + k * 0.04, seed: s + k + sd + 9, ch: 0.004, seg: 2, nx: 1, ny: 3 }));
          }));
          /* Grifflöcher */
          [-1, 1].forEach(sd => m.box(0.012, 0.035, 0.12, 0x3a2a18, { x: sd * (W / 2 + t - 0.002), y: 0.24, c: true }));
        });
        crate(-0.27, 0, 0, 0.05, 1); crate(0.27, 0, 0.02, -0.04, 5); crate(0, 0.305, 0, 0.1, 9);
        return true;
      }
      case "paletten": {
        /* Europaletten: 3 Kufen, 9 Klötze (außen mit Brandstempel), 3 Querbretter, 5 Deckbretter (außen breit) */
        for (let k = 0; k < 3; k++) b.at({ y: k * 0.172, x: (hs(k, 1, 1) - 0.5) * 0.04, z: (hs(k, 2, 2) - 0.5) * 0.04 }, m => {
          const L = 1.2, Wd = 0.8;
          [-0.36, 0, 0.36].forEach((z, i) => m.at({ z, y: 0 }, q => q.at({ ry: Math.PI / 2 }, r => lumber(r, { w: 0.1, h: 0.022, l: L, wt: "fichte", seed: k * 9 + i, ch: 0.004, seg: 2, nx: 2 }))));
          [-0.52, 0, 0.52].forEach((x, i) => [-0.36, 0, 0.36].forEach((z, j) => m.at({ x, z, y: 0.022 }, q => {
            lumber(q, { w: 0.145, h: 0.078, l: j === 1 ? 0.145 : 0.1, wt: "kiefer", tone: 0.92, seed: k * 3 + i + j, ch: 0.005, seg: 1, nx: 1, ny: 1 });
            if (i !== 1 && j !== 1) q.box(0.07, 0.03, 0.003, 0x4a3420, { x: 0, y: 0.024, z: (j === 1 ? 0.145 : 0.1) / 2 + 0.001 });
          })));
          [-0.52, 0, 0.52].forEach((x, i) => m.at({ x, y: 0.1 }, q => lumber(q, { w: 0.145, h: 0.022, l: Wd, wt: "fichte", tone: 0.97, seed: k * 5 + i + 40, ch: 0.004, seg: 2, nx: 2 })));
          [[-0.34, 0.145], [-0.17, 0.1], [0, 0.145], [0.17, 0.1], [0.34, 0.145]].forEach(([z, w], i) => m.at({ z, y: 0.122 }, q => q.at({ ry: Math.PI / 2 }, r => lumber(r, { w, h: 0.022, l: L, wt: "fichte", tone: 0.98 + hs(k, i, 5) * 0.06, seed: k * 7 + i + 60, ch: 0.004, seg: 3, nx: 3 }))));
        });
        return true;
      }
      case "moebel": {
        /* Stuhl aus Buche: gedrechselte Beine, Sitz mit runder Vorderkante, Lehne mit drei Sprossen; daneben ein loses Bein */
        const W = WT.buche, legC = (y, a, i) => mulC(lerpC(W.a, W.b, 0.5 + 0.5 * Math.sin(a * 3 + y * 9)), 0.97 + (i % 2) * 0.05);
        const leg = (x, z, h, back) => b.at({ x, z }, m => lathe(m, back ? [[0, 0.024], [0.05, 0.026], h > 0.6 ? [0.3, 0.022] : [0.3, 0.022], [h * 0.62, 0.028], [h * 0.68, 0.02], [h - 0.02, 0.022], [h, 0.012]] : [[0, 0.022], [0.05, 0.025], [0.2, 0.019], [0.26, 0.027], [0.32, 0.02], [0.43, 0.024], [0.45, 0.012]], 8, legC));
        leg(0.19, 0.19, 0.45); leg(-0.19, 0.19, 0.45); leg(0.19, -0.19, 0.95, true); leg(-0.19, -0.19, 0.95, true);
        b.at({ y: 0.43 }, m => lumber(m, { w: 0.48, h: 0.05, l: 0.46, wt: "buche", seed: 3, ch: 0.014, nx: 6, seg: 3 }));
        [0.6, 0.72, 0.84].forEach((y, i) => b.at({ y, z: -0.19 }, m => m.at({ ry: Math.PI / 2 }, q => lumber(q, { w: 0.03, h: i === 2 ? 0.08 : 0.04, l: 0.38, wt: "buche", seed: 5 + i, ch: 0.006, seg: 2, nx: 1, ny: 2 }))));
        [0.16].forEach(y => [[-1, 0], [1, 0]].forEach(([sx]) => b.at({ x: sx * 0.19, y }, m => lumber(m, { w: 0.02, h: 0.02, l: 0.36, wt: "buche", seed: 9, ch: 0.004, seg: 1, nx: 1, ny: 1 }))));
        b.at({ x: 0.42, y: 0.025, z: 0.15, rz: Math.PI / 2, ry: 0.35 }, m => lathe(m, [[0, 0.022], [0.05, 0.025], [0.2, 0.019], [0.26, 0.027], [0.32, 0.02], [0.43, 0.024], [0.45, 0.012]], 8, legC));
        return true;
      }
      case "tueren": {
        /* Kassettentür: Rahmen, vier erhabene Füllungen, Messingdrücker mit Schild, drei Bänder links */
        const W = 0.72, H = 1.45, T = 0.07, Wt = WT.eiche;
        b.at({ y: H / 2, z: 0 }, m => m.at({ rx: Math.PI / 2 }, q => lumber(q, { w: W, h: T, l: H, wt: "eiche", tone: 0.92, seed: 41, ch: 0.01, nx: 6, seg: 6, pith: [0.5, -3], rings: [] })));
        /* Füllungen */
        [[0.3, 0.42], [0.92, 0.5]].forEach(([y, hh]) => [-1, 1].forEach(sx => b.at({ x: sx * 0.165, y, z: T + 0.001 }, m => {
          const w = 0.24, h = hh, s = 0.03;
          const c0 = mulC(cv(Wt.a), 0.9), c1 = mulC(cv(Wt.a), 1.08), c2 = mulC(cv(Wt.b), 0.85), c3 = cv(Wt.b);
          const P = [[-w / 2, 0, 0], [w / 2, 0, 0], [w / 2, h, 0], [-w / 2, h, 0]], I = [[-w / 2 + s, s, 0.015], [w / 2 - s, s, 0.015], [w / 2 - s, h - s, 0.015], [-w / 2 + s, h - s, 0.015]];
          q4(m, P[0], P[1], I[1], I[0], c2, c2, c2, c2); q4(m, P[1], P[2], I[2], I[1], c3, c3, c3, c3); q4(m, P[2], P[3], I[3], I[2], c1, c1, c1, c1); q4(m, P[3], P[0], I[0], I[3], c1, c1, c1, c1);
          q4(m, I[0], I[1], I[2], I[3], c0, c0, mulC(c0, 1.04), mulC(c0, 1.04));
        })));
        /* Drücker */
        b.box(0.05, 0.16, 0.012, BRASS2.b, { x: 0.27, y: 0.72, z: T + 0.006, c: true });
        rope(b, [[0.27, 0.75, T + 0.012], [0.27, 0.75, T + 0.05], [0.18, 0.75, T + 0.055]], 0.011, BRASS2.a, 6);
        b.box(0.016, 0.022, 0.01, 0x2a2218, { x: 0.27, y: 0.67, z: T + 0.013, c: true });
        [0.2, 0.72, 1.25].forEach(y => b.box(0.03, 0.1, 0.03, 0x4a4a4a, { x: -W / 2 - 0.006, y, z: T / 2, c: true }));
        return true;
      }
      case "zaun": {
        /* Zaunelement: Latten mit Spitze, zwei Riegel und eine Strebe (Z) dahinter */
        const W = WT.kiefer;
        for (let i = 0; i < 7; i++) {
          const x = -0.54 + i * 0.18, h = 0.86 + (hs(i, 1, 1) - 0.5) * 0.02, w = 0.11, t = 0.028, P = [[-w / 2, 0], [w / 2, 0], [w / 2, h], [0, h + 0.09], [-w / 2, h]];
          b.at({ x, z: 0 }, m => {
            const sub = []; P.forEach((p, k) => { const q = P[(k + 1) % P.length]; const n = k === 1 || k === 4 ? 4 : 1; for (let a = 0; a < n; a++) sub.push([p[0] + (q[0] - p[0]) * a / n, p[1] + (q[1] - p[1]) * a / n]); });
            const R = [sub, sub], Z = [-t / 2, t / 2];
            extrude(m, R, Z, (ii, j, s, p) => mulC(lerpC(W.a, W.b, 0.5 + 0.5 * Math.sin(p[0] * 80 + i)), 0.95), {});
            const fc = p => mulC(lerpC(W.a, W.b, 0.5 + 0.5 * Math.sin(p[0] * 70 + Math.sin(p[1] * 6 + i) * 1.5 + i)), 1.02);
            capPoly(m, sub, t / 2, 1, fc); capPoly(m, sub, -t / 2, -1, fc);
          });
        }
        [0.16, 0.66].forEach((y, i) => b.at({ y, z: -0.04 }, m => m.at({ ry: Math.PI / 2 }, q => lumber(q, { w: 0.04, h: 0.085, l: 1.3, wt: "kiefer", tone: 0.9, seed: 50 + i, ch: 0.006, seg: 3, nx: 1, ny: 2 }))));
        b.at({ y: 0.41, z: -0.045, rz: -0.38 }, m => m.at({ ry: Math.PI / 2 }, q => lumber(q, { w: 0.035, h: 0.07, l: 1.16, wt: "kiefer", tone: 0.86, seed: 53, ch: 0.006, seg: 3, nx: 1, ny: 2 })));
        return true;
      }
      case "schatulle": {
        /* Edelholz-Schatulle: Kirschbaum, Deckel mit Fase und heller Einlegeader, Messingecken, Schlossblech, Füße */
        const W = 0.62, D = 0.42, H = 0.24, Kt = WT.kirsche;
        b.at({ y: 0.03 }, m => m.at({ ry: Math.PI / 2 }, q => lumber(q, { w: D, h: H, l: W, wt: "kirsche", seed: 61, ch: 0.012, nx: 6, ny: 3, pith: [0.5, -2], rings: [] })));
        b.at({ y: 0.03 + H }, m => m.at({ ry: Math.PI / 2 }, q => lumber(q, { w: D + 0.02, h: 0.09, l: W + 0.02, wt: "kirsche", tone: 1.06, seed: 62, ch: 0.03, nx: 6, ny: 1, pith: [0.5, -2], rings: [] })));
        const top = 0.03 + H + 0.09 + 0.002, c = cv(0xf0d6a8);
        [[-W / 2 + 0.06, -D / 2 + 0.06, W / 2 - 0.06, -D / 2 + 0.072], [-W / 2 + 0.06, D / 2 - 0.072, W / 2 - 0.06, D / 2 - 0.06], [-W / 2 + 0.06, -D / 2 + 0.06, -W / 2 + 0.072, D / 2 - 0.06], [W / 2 - 0.072, -D / 2 + 0.06, W / 2 - 0.06, D / 2 - 0.06]]
          .forEach(([x0, z0, x1, z1]) => q4(b, [x0, top, z1], [x1, top, z1], [x1, top, z0], [x0, top, z0], c, c, c, c));
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
          b.box(0.05, 0.05, 0.05, BRASS2.b, { x: sx * (W / 2 - 0.02), y: 0, z: sz * (D / 2 - 0.02), c: false, top: BRASS2.a });
          b.box(0.035, H + 0.085, 0.035, BRASS2.b, { x: sx * (W / 2 - 0.006), y: 0.03, z: sz * (D / 2 - 0.006), top: BRASS2.a });
        });
        b.box(0.09, 0.11, 0.012, BRASS2.a, { y: 0.03 + H - 0.08, z: D / 2 + 0.006, c: false });
        b.box(0.014, 0.035, 0.014, 0x2a1d10, { y: 0.03 + H - 0.055, z: D / 2 + 0.013, c: false });
        return true;
      }
    }
    return false;
  }

  /* ===================== v122: Hofwaren-, Fisch- und Werkzeug-Bildchen =====================
     Gleicher Stil und gleicher Bausatz wie die Holzwaren (v121): Low-Poly-Grundform, Farbe je Ecke für Materialien
     (Jute-Karo, Papier, Kunststoffschale, Zink, Stahl mit heller Schneide), weiche Normalen für Rundes (Obst, Gemüse,
     Säcke, Kannen) über skinV. Licht, Kontur und Schatten kommen einheitlich aus thumbOf/thumbCrop. */
  /* Haut über Ringe (wie in der Jagd): weiche Normalen aus den Nachbarpunkten, Farbe je Ecke, Kappen mit Spitze */
  function skinV(b, P, Cc, o) {
    o = o || {};
    const n = P.length, m = P[0].length, M = b.M, v = b.v;
    const sub = (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]], crs = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
    const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]); return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0]; }, dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
    const cen = P.map(R => { let x = 0, y = 0, z = 0; for (const p of R) { x += p[0]; y += p[1]; z += p[2]; } return [x / m, y / m, z / m]; });
    const N = P.map((R, i) => R.map((p, j) => {
      let q = nrm(crs(sub(R[(j + 1) % m], R[(j + m - 1) % m]), sub(P[Math.min(n - 1, i + 1)][j], P[Math.max(0, i - 1)][j])));
      if (!q[0] && !q[1] && !q[2]) q = nrm(sub(cen[Math.min(n - 1, i + 1)], cen[Math.max(0, i - 1)]));
      if (dot(q, o.ref ? o.ref(i, j, p) : sub(p, cen[i])) < 0) q = [-q[0], -q[1], -q[2]];
      return q;
    }));
    const put = (p, q, c) => {
      c = cv(c);
      v.push(M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14]);
      const x = M[0] * q[0] + M[4] * q[1] + M[8] * q[2], y = M[1] * q[0] + M[5] * q[1] + M[9] * q[2], z = M[2] * q[0] + M[6] * q[1] + M[10] * q[2], l = Math.hypot(x, y, z) || 1;
      v.push(x / l, y / l, z / l, c[0], c[1], c[2]);
    };
    const tri = (pa, na, ca, pb, nb, cb, pc, nc, cc) => {
      const g = crs(sub(pb, pa), sub(pc, pa));
      if (Math.abs(g[0]) + Math.abs(g[1]) + Math.abs(g[2]) < 1e-14) return;
      if (dot(g, [na[0] + nb[0] + nc[0], na[1] + nb[1] + nc[1], na[2] + nb[2] + nc[2]]) < 0) { put(pa, na, ca); put(pc, nc, cc); put(pb, nb, cb); } else { put(pa, na, ca); put(pb, nb, cb); put(pc, nc, cc); }
    };
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < m; j++) { const j1 = (j + 1) % m;
      tri(P[i][j], N[i][j], Cc[i][j], P[i + 1][j], N[i + 1][j], Cc[i + 1][j], P[i + 1][j1], N[i + 1][j1], Cc[i + 1][j1]);
      tri(P[i][j], N[i][j], Cc[i][j], P[i + 1][j1], N[i + 1][j1], Cc[i + 1][j1], P[i][j1], N[i][j1], Cc[i][j1]); }
    [[0, o.cap0, o.tip0, 1, o.n0, o.c0], [n - 1, o.cap1, o.tip1, n - 2, o.n1, o.c1]].forEach(([i, cap, tip, k, nq, cc]) => {
      if (!cap) return;
      const c = tip || cen[i], q = nq || nrm(sub(cen[i], cen[k])), col = cc != null ? cc : Cc[i][0];
      for (let j = 0; j < m; j++) { const j1 = (j + 1) % m; tri(c, q, col, P[i][j], N[i][j], Cc[i][j], P[i][j1], N[i][j1], Cc[i][j1]); }
    });
    return b;
  }
  /* weicher Drehkörper um y: prof [[y, r]] (unten → oben), col(p, y, a, i, j), rm(y, a) Radius-Faktor (Rippen, Dellen) */
  function sLathe(b, prof, seg, col, rm, o) {
    o = o || {};
    const P = [], Cc = [];
    prof.forEach(([y, r], i) => { const R = [], C2 = []; for (let j = 0; j < seg; j++) { const a = (j / seg) * Math.PI * 2, k = rm ? rm(y, a) : 1, p = [Math.cos(a) * r * k, y, Math.sin(a) * r * k]; R.push(p); C2.push(col(p, y, a, i, j)); } P.push(R); Cc.push(C2); });
    const y0 = prof[0][0], y1 = prof[prof.length - 1][0];
    return skinV(b, P, Cc, { cap0: o.cap0 !== false, cap1: o.cap1 !== false, tip0: o.tip0 || [0, y0, 0], tip1: o.tip1 || [0, y1, 0], n0: [0, -1, 0], n1: o.n1 || [0, 1, 0], c0: o.c0, c1: o.c1 });
  }
  /* Ellipsoid mit Farbe je Ecke und optionaler Beule (jit) */
  function sEll(b, c, r, col, m, n, jit, seed) {
    m = m || 10; n = n || 7; jit = jit || 0; seed = seed || 1;
    const P = [], Cc = [];
    for (let i = 1; i < n; i++) {
      const th = (i / n) * Math.PI, yy = Math.cos(th), s = Math.sin(th), R = [], C2 = [];
      for (let j = 0; j < m; j++) { const t = (j / m) * Math.PI * 2, k = 1 + (hs(i * 1.3 + seed, j * 2.7, seed) - 0.5) * jit, p = [c[0] + Math.cos(t) * s * r[0] * k, c[1] + yy * r[1] * k, c[2] + Math.sin(t) * s * r[2] * k]; R.push(p); C2.push(typeof col === "function" ? col(p, yy, t, i, j) : cv(col)); }
      P.push(R); Cc.push(C2);
    }
    return skinV(b, P, Cc, { cap0: true, cap1: true, tip0: [c[0], c[1] + r[1], c[2]], tip1: [c[0], c[1] - r[1], c[2]] });
  }
  /* abgerundetes Rechteck (x, z) mit n Punkten je Ecke */
  function rrect(w, d, rr, n) {
    const P = []; n = n || 3;
    [[w / 2 - rr, d / 2 - rr, 0], [-w / 2 + rr, d / 2 - rr, Math.PI / 2], [-w / 2 + rr, -d / 2 + rr, Math.PI], [w / 2 - rr, -d / 2 + rr, Math.PI * 1.5]].forEach(([cx, cz, a0]) => { for (let k = 0; k <= n; k++) { const a = a0 + (k / n) * Math.PI / 2; P.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]); } });
    return P;
  }
  /* Ringe aus einem Umriss (x, z) auf Höhe y mit Skalierung kx, kz – für Tüten, Schalen, Ballen, Säcke */
  const ringXZ = (OL, y, kx, kz, ox, oz) => OL.map(([x, z]) => [(ox || 0) + x * kx, y, (oz || 0) + z * (kz == null ? kx : kz)]);
  /* Lattenkiste (offen) – auch für Tomaten, Äpfel, Birnen */
  function slatCrate(b, W, D, H, s, o) {
    o = o || {};
    b.box(W - 0.02, 0.02, D - 0.02, 0x7a5a36, { y: 0.01 });
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => b.at({ x: sx * (W / 2 - 0.025), z: sz * (D / 2 - 0.025), y: H / 2 }, q => q.at({ rx: Math.PI / 2 }, r => lumber(r, { w: 0.05, h: 0.05, l: H, wt: "kiefer", seed: s + sx + sz * 3, ch: 0.006, seg: 1, nx: 1, ny: 1 }))));
    const t = 0.024, sl = o.slat || 0.11, ys = o.ys || [0.035, 0.175];
    ys.forEach((y0, k) => [-1, 1].forEach(sd => {
      b.at({ z: sd * (D / 2 + t / 2 - 0.004), y: y0, ry: Math.PI / 2 }, q => lumber(q, { w: t, h: sl, l: W - 0.02, wt: "fichte", tone: 0.96 + k * 0.05, seed: s + k + sd, ch: 0.004, seg: 2, nx: 1, ny: 3 }));
      b.at({ x: sd * (W / 2 + t / 2 - 0.004), y: y0 }, q => lumber(q, { w: t, h: sl, l: D - 0.02, wt: "fichte", tone: 0.98 + k * 0.04, seed: s + k + sd + 9, ch: 0.004, seg: 2, nx: 1, ny: 3 }));
    }));
    if (o.handles !== false) [-1, 1].forEach(sd => b.box(0.012, 0.035, 0.12, 0x3a2a18, { x: sd * (W / 2 + t - 0.002), y: ys[ys.length - 1] + sl * 0.6, c: true }));
  }
  /* Füllung in Reihen: fn(x, y, z, k) */
  function rows(nx, nz, dx, dz, y, fn, jit) { let k = 0; for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++, k++) fn((i - (nx - 1) / 2) * dx + (hs(i, j, 3) - 0.5) * (jit || 0), y + (hs(j, i, 5) - 0.5) * (jit || 0) * 0.5, (j - (nz - 1) / 2) * dz + (hs(i + 4, j, 7) - 0.5) * (jit || 0), k); }
  /* --- Obst und Gemüse --- */
  function tomato(b, x, y, z, r, k) {
    sEll(b, [x, y, z], [r, r * 0.82, r], (p, yy, t) => mulC(lerpC(0xe8402c, 0xc22a1e, 0.5 - 0.5 * yy + 0.15 * Math.sin(t * 5)), 0.97 + 0.06 * hs(p[0] * 40, p[2] * 40, k)), 12, 8, 0.05, k + 1);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + k; b.at({ x, y: y + r * 0.8, z, ry: -a }, m => sEll(m, [r * 0.32, 0, 0], [r * 0.34, r * 0.06, r * 0.09], 0x3f8a2a, 5, 4)); }
    rope(b, [[x, y + r * 0.8, z], [x + r * 0.05, y + r * 1.05, z]], r * 0.07, 0x4f7a2a, 5);
  }
  function apple(b, x, y, z, r, k, pear) {
    const prof = pear ? [[0, 0.25], [0.06, 0.62], [0.2, 0.92], [0.38, 0.96], [0.55, 0.78], [0.72, 0.52], [0.88, 0.42], [1.02, 0.3], [1.1, 0.12]] : [[0, 0.3], [0.05, 0.62], [0.18, 0.92], [0.38, 1.0], [0.58, 0.97], [0.75, 0.84], [0.86, 0.6], [0.9, 0.3]];
    const red = k % 3 !== 2;
    b.at({ x, y: y - r * (pear ? 0.1 : 0.5), z, ry: pear ? hs(k, 3, 3) * 6.28 : 0 }, mm => mm.at({ rz: pear ? Math.PI / 2 - 0.15 : (hs(k, 1, 1) - 0.5) * 0.4, rx: (hs(k, 2, 2) - 0.5) * 0.4, x: pear ? r * 0.5 : 0 }, m => sLathe(m, prof.map(([yy, rr]) => [yy * r, rr * r]), 12, (p, yy, a) => {
      if (pear) return mulC(lerpC(0xc8cf52, 0xa8a838, 0.5 + 0.5 * Math.sin(a * 3 + k)), hs(p[0] * 60, p[1] * 60, k) > 0.9 ? 0.78 : 1);
      const blush = 0.5 + 0.5 * Math.sin(a + k * 2.1);
      return red ? lerpC(lerpC(0xc8202a, 0x9c1420, 0.5 - 0.5 * Math.sin(a * 3 + k)), 0xd8b040, (1 - blush) * 0.22 * (yy / r < 0.4 ? 1 : 0.5)) : lerpC(0x8ab83a, 0xc8cc48, blush * 0.5);
    }, null, { tip1: [0, (pear ? 1.06 : 0.82) * r, 0] })));
    if (!pear) { rope(b, [[x, y + r * 0.32, z], [x + r * 0.12, y + r * 0.6, z]], r * 0.06, 0x6a4a2a, 4);
      if (k % 4 === 0) b.at({ x: x + r * 0.15, y: y + r * 0.5, z, rz: -0.6 }, m => sEll(m, [r * 0.3, 0, 0], [r * 0.35, r * 0.05, r * 0.16], 0x4f9a3a, 6, 4)); }
  }
  function strawberry(b, x, y, z, r, k) {
    b.at({ x, y, z, ry: hs(k, 5, 6) * Math.PI * 2 }, mm => mm.at({ rx: Math.PI / 2 + (hs(k, 1, 2) - 0.5) * 0.6, y: 0, z: -r * 0.6 }, m => {
      sLathe(m, [[-r * 0.15, 0.0], [0, r * 0.22], [r * 0.4, r * 0.62], [r * 0.85, r * 0.86], [r * 1.12, r * 0.78], [r * 1.28, r * 0.42], [r * 1.32, r * 0.2]], 14, (p, yy, a, i, j) => (i * 3 + j) % 5 === 0 && i > 0 && i < 6 ? cv(0xf2d050) : mulC(cv(0xd8202e), 0.88 + 0.14 * (yy / r)), null, {});
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + k; m.at({ ry: -a, y: r * 1.2 }, q => sEll(q, [r * 0.3, 0, 0], [r * 0.36, r * 0.05, r * 0.13], 0x3f9a3a, 5, 4)); }
      rope(m, [[0, r * 1.2, 0], [r * 0.05, r * 1.45, 0]], r * 0.06, 0x4f8a2a, 4);
    }));
  }
  function corncob(b, len, r, husk) {
    /* Kolben: Körner als Raster aus hellen und dunklen Ecken, an beiden Enden rund; Lieschblätter halb zurückgeschlagen */
    const prof = [[0, r * 0.4], [len * 0.04, r * 0.85], [len * 0.12, r], [len * 0.5, r * 1.02], [len * 0.82, r * 0.88], [len * 0.95, r * 0.55], [len, r * 0.15]], P = [];
    for (let i = 0; i <= 16; i++) { const yy = (i / 16) * len; let rr = prof[0][1]; for (let k = 0; k < prof.length - 1; k++) if (yy >= prof[k][0] && yy <= prof[k + 1][0]) rr = prof[k][1] + (prof[k + 1][1] - prof[k][1]) * (yy - prof[k][0]) / (prof[k + 1][0] - prof[k][0]); P.push([yy, rr]); }
    sLathe(b, P, 14, (p, yy, a, i, j) => ((i + j) % 2 ? cv(0xf6c832) : cv(0xe8a81e)), (yy, a) => 1 + 0.04 * Math.cos(a * 14), {});
    if (husk) for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; b.at({ ry: -a, y: len * 0.05 }, m => m.at({ rz: -0.25 - i * 0.08 }, q => sEll(q, [r * 1.05, len * 0.3, 0], [r * 0.22, len * 0.34, r * 0.7], (p, yy) => lerpC(0x8ab848, 0xd8d08a, 0.5 - yy * 0.5), 6, 6))); }
  }
  function wheatEar(b, len, k) {
    rope(b, [[0, 0, 0], [0.01, len * 0.5, 0], [0.025, len * 0.66, 0]], 0.009, 0xdcc070, 4);
    for (let i = 0; i < 7; i++) [-1, 1].forEach(s => { const t = 0.68 + i * 0.045; b.at({ x: 0.025 + s * 0.018, y: len * t, z: 0, rz: s * 0.35 }, m => sEll(m, [0, 0, 0], [0.018, 0.03, 0.016], k % 2 ? 0xe8aa30 : 0xd89a28, 5, 4)); });
    for (let i = 0; i < 5; i++) rope(b, [[0.025 + (i - 2) * 0.008, len * 0.98, 0], [0.025 + (i - 2) * 0.03, len * 1.22, 0]], 0.003, 0xeccf80, 3);
  }
  /* Papiertüte (Mehl): gerade Wände mit leichter Wölbung, oben gefalzt, vorne Etikett-Band und Bild */
  function paperBag(b, o) {
    const OL = rrect(0.36, 0.24, 0.03, 2), H = 0.5, R = [], Cc = [];
    const ys = [0, 0.02, 0.1, 0.2, 0.3, 0.4, 0.46, 0.5, 0.54, 0.58];
    ys.forEach((y, i) => {
      const bulge = i === 0 ? 0.94 : i < 7 ? 1 + 0.035 * Math.sin((y / H) * Math.PI) : 1, kz = i < 7 ? 1 : i === 7 ? 0.7 : i === 8 ? 0.25 : 0.12;
      const r = ringXZ(OL, y, bulge, bulge * kz); R.push(r);
      Cc.push(r.map(p => { let c = cv(o.paper); if (y > o.band[0] && y < o.band[1] && p[2] > 0.06) c = cv(o.bandC); if (y > 0.5) c = mulC(c, 0.96); return mulC(c, 0.97 + 0.05 * hs(p[0] * 30, y * 30, 1)); }));
    });
    skinV(b, R, Cc, { cap0: true, cap1: true, n0: [0, -1, 0], n1: [0, 1, 0] });
    b.box(0.37, 0.05, 0.035, mulC(cv(o.paper), 0.92), { y: 0.56, c: false });                         /* Falz oben */
    o.emblem(b, 0, (o.band[0] + o.band[1]) / 2, 0.128);
  }
  /* Futtersack (gewebter Kunststoff): kissenförmig, oben vernäht, Farbband und Tierbild */
  function feedSack(b, o) {
    const OL = rrect(0.5, 0.26, 0.11, 3), R = [], Cc = [], ys = [0, 0.03, 0.12, 0.26, 0.385, 0.4, 0.5, 0.515, 0.6, 0.64, 0.66], nb = ys.indexOf(0.6);
    ys.forEach((y, i) => {
      const k = i === 0 ? 0.82 : i < nb ? 1 + 0.06 * Math.sin((y / 0.6) * Math.PI) : i === nb ? 0.98 : i === nb + 1 ? 0.95 : 0.93, kz = i < nb ? 1 : i === nb ? 0.55 : i === nb + 1 ? 0.18 : 0.06;
      const r = ringXZ(OL, y, k, k * kz); R.push(r);
      Cc.push(r.map((p, j) => { let c = cv(o.sack); if (y >= o.band[0] && y <= o.band[1]) c = cv(o.bandC); if ((Math.round(p[0] * 60) + Math.round(y * 60)) % 2) c = mulC(c, 0.95); return c; }));
    });
    skinV(b, R, Cc, { cap0: true, cap1: true, n0: [0, -1, 0], n1: [0, 1, 0] });
    for (let i = 0; i < 9; i++) b.box(0.03, 0.012, 0.03, 0x8a8a8a, { x: -0.22 + i * 0.055, y: 0.63, rz: i % 2 ? 0.5 : -0.5, c: true });  /* Naht */
    b.box(0.3, 0.22, 0.01, 0xfaf6ee, { y: 0.12, z: 0.158, c: false });                                             /* Etikett */
    b.at({ x: 0, y: 0.24, z: 0.166, s: 1.5 }, m => o.emblem(m, 0, 0, 0));
    [0.16, 0.14].forEach((y, k) => b.box(0.2 - k * 0.06, 0.012, 0.004, 0x6a6a6a, { y, z: 0.165, c: true }));
  }
  /* Kunststoffschale mit Rand (Fleisch, Erdbeeren) */
  function tray(b, w, d, h, col, rim) {
    const OL = rrect(w, d, 0.05, 2), Ri = [ringXZ(OL, 0, 0.88), ringXZ(OL, h, 1), ringXZ(OL, h + 0.012, 1.03), ringXZ(OL, h, 0.93), ringXZ(OL, 0.015, 0.84)];
    skinV(b, Ri, Ri.map((r, i) => r.map(() => i === 2 ? cv(rim || col) : i >= 3 ? mulC(cv(col), 0.75) : cv(col))), { cap0: true, cap1: true, n0: [0, -1, 0], n1: [0, 1, 0], c1: mulC(cv(col), 0.7), ref: (i, j, p) => i >= 3 ? [-p[0], 0.3, -p[2]] : i === 2 ? [p[0], 1, p[2]] : [p[0], -0.2, p[2]] });
  }
  /* Zinkeimer */
  function bucket(b, r0, r1, h, o) {
    o = o || {};
    sLathe(b, [[0, r0 * 0.96], [0.01, r0], [h * 0.3, lerp1(r0, r1, 0.3)], [h * 0.31, lerp1(r0, r1, 0.3) * 1.02], [h * 0.33, lerp1(r0, r1, 0.33)], [h * 0.7, lerp1(r0, r1, 0.7)], [h * 0.71, lerp1(r0, r1, 0.7) * 1.02], [h * 0.73, lerp1(r0, r1, 0.73)], [h, r1], [h + 0.015, r1 * 1.03]], 16,
      (p, y, a) => mulC(lerpC(o.col || 0xa8b2ba, o.dark || 0x7d8890, 0.5 + 0.5 * Math.sin(a * 2 + 0.8)), 0.96 + 0.08 * hs(p[0] * 20, y * 20, 2)), null, { cap1: false });
    const I = [], In = []; for (let j = 0; j < 16; j++) { const a = (j / 16) * Math.PI * 2; I.push([Math.cos(a) * r1 * 0.98, h, Math.sin(a) * r1 * 0.98]); In.push([Math.cos(a) * r1 * 0.9, h - 0.08, Math.sin(a) * r1 * 0.9]); }
    skinV(b, [I, In], [I.map(() => cv(0x6a737a)), In.map(() => cv(0x4a5258))], { ref: (i, j, p) => [-p[0], 0.2, -p[2]] });
    const L = []; for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI; L.push([Math.cos(a) * r1 * 1.02, h + Math.sin(a) * r1 * 0.75, 0]); } rope(b, L, 0.008, 0x5a6268, 5);
  }
  const lerp1 = (a, c, t) => a + (c - a) * t;
  /* Tierbilder für Etiketten (stark vereinfacht, gut lesbar) */
  const embPig = (b, x, y, z) => b.at({ x, y, z }, m => { sEll(m, [0, 0, 0], [0.06, 0.05, 0.012], 0xf2a0a0, 8, 5); sEll(m, [0, -0.008, 0.012], [0.022, 0.016, 0.006], 0xe07a80, 6, 4); [-1, 1].forEach(s => sEll(m, [s * 0.04, 0.045, 0], [0.016, 0.02, 0.006], 0xe88a90, 4, 3)); });
  const embSheep = (b, x, y, z) => b.at({ x, y, z }, m => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; sEll(m, [Math.cos(a) * 0.035, Math.sin(a) * 0.025, 0], [0.028, 0.025, 0.01], 0xffffff, 6, 4); } sEll(m, [0.05, -0.005, 0.01], [0.02, 0.016, 0.008], 0x3a3a3a, 6, 4); });
  const embEar = col => (b, x, y, z) => b.at({ x, y, z }, m => { sEll(m, [0, 0, -0.002], [0.07, 0.05, 0.006], 0xfaf4e4, 10, 5); m.at({ y: -0.035, z: 0.004, s: 0.55 }, q => wheatEar(q, 0.1, 1)); void col; });
  const embCorn = (b, x, y, z) => b.at({ x, y, z }, m => { sEll(m, [0, 0, -0.002], [0.07, 0.05, 0.006], 0xfaf4e4, 10, 5); m.at({ x: -0.035, y: -0.01, z: 0.006, rz: -1.2 }, q => corncob(q, 0.08, 0.016, false)); });
  /* --- Textil --- */
  function sock(b, col, cuff) {
    /* flach liegende Wollsocke (Umriss wie ein Socken-Symbol): Bündchen mit Rippen, Ferse und Spitze andersfarbig, Strickmuster */
    const OUT = [[-0.075, 0.42], [-0.075, 0.3], [-0.075, 0.15], [-0.06, 0.06], [-0.02, 0.01], [0.04, -0.005], [0.12, -0.005], [0.2, -0.005], [0.28, 0.0], [0.33, 0.04], [0.34, 0.08], [0.32, 0.115], [0.27, 0.13], [0.2, 0.133], [0.12, 0.135], [0.08, 0.15], [0.075, 0.22], [0.075, 0.3], [0.075, 0.42], [0.025, 0.42], [-0.025, 0.42]];
    const t = 0.045, colAt = (x, y) => { if (y > 0.35) return mulC(cv(cuff), Math.round(x * 90) % 2 ? 0.86 : 1); if ((y < 0.1 && x < 0.06) || x > 0.26) return cv(cuff); return mulC(cv(col), (Math.round(x * 50) + Math.round(y * 50)) % 2 ? 0.94 : 1.02); };
    b.at({ rx: -Math.PI / 2 }, m => {
      extrude(m, [OUT, OUT], [0, t], (i, j, s2, p) => mulC(colAt(p[0], p[1]), 0.9), {});
      const LEG = [[-0.075, 0.15], [0.075, 0.15], [0.075, 0.22], [0.075, 0.3], [0.075, 0.42], [0.025, 0.42], [-0.025, 0.42], [-0.075, 0.42], [-0.075, 0.3]];
      const FOOT = [[-0.075, 0.15], [-0.06, 0.06], [-0.02, 0.01], [0.04, -0.005], [0.12, -0.005], [0.2, -0.005], [0.28, 0.0], [0.33, 0.04], [0.34, 0.08], [0.32, 0.115], [0.27, 0.13], [0.2, 0.133], [0.12, 0.135], [0.08, 0.15], [0.075, 0.15]];
      [LEG, FOOT].forEach(P => { capPoly(m, P, t, 1, p => colAt(p[0], p[1])); capPoly(m, P, 0, -1, p => mulC(colAt(p[0], p[1]), 0.8)); });
    });
  }
  function goodsItem(id, b) {
    switch (id) {
      case "mehl": paperBag(b, { paper: 0xf4efe3, band: [0.14, 0.36], bandC: 0x3f78c8, emblem: embEar(0) }); return true;
      case "maismehl": paperBag(b, { paper: 0xd8b986, band: [0.14, 0.36], bandC: 0x2f8a4a, emblem: embCorn }); return true;
      case "weizen":
        jutesack(b, { label: { col: 0xfaf4e4, band: 0xf0b83a }, fillCol: [0xe8c060, 0xc89a3a], fill: m => {
          for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.2; m.at({ x: Math.sin(a) * 0.07 + (i % 2) * 0.03, y: 0.5, z: (i % 3 - 1) * 0.05, rz: -a * 0.9, ry: i * 0.9, s: 1.75 }, q => wheatEar(q, 0.26 + (i % 3) * 0.02, i)); }
        } });
        return true;
      case "mais":
        jutesack(b, { label: { col: 0xfaf4e4, band: 0x2f8a4a }, fillCol: [0xf2c032, 0xd89a1e], fill: m => {
          [[-0.1, 0.5, 0.0, 0.35, 0.2], [0.06, 0.52, 0.06, -0.3, 1.8], [0.0, 0.5, -0.1, 0.1, 3]].forEach(([x, y, z, rz, ry]) => m.at({ x, y, z, rz, ry }, q => corncob(q, 0.34, 0.06, true)));
          m.at({ x: 0.34, y: 0.06, z: 0.28, rz: Math.PI / 2 - 0.05, ry: 0.5 }, q => corncob(q, 0.36, 0.062, true));
        } });
        return true;
      case "kartoffel": {
        const pot = (m, x, y, z, k, s) => sEll(m, [x, y, z], [0.085 * s, 0.065 * s, 0.07 * s], (p) => hs(p[0] * 50, p[1] * 50, p[2] * 50 + k) > 0.92 ? cv(0x7a5a30) : mulC(lerpC(0xc9a062, 0xa8834a, hs(p[0] * 9, p[2] * 9, k)), 1), 9, 6, 0.22, k + 3);
        jutesack(b, { fillCol: [0xb08a50, 0x8a6a3a], fill: m => { rows(3, 3, 0.15, 0.15, 0.6, (x, y, z, k) => pot(m, x, y, z, k, 1), 0.04); pot(m, 0.03, 0.66, 0.02, 11, 1.05);
          [[0.36, 0.06, 0.28, 1], [0.2, 0.055, 0.4, 2], [0.45, 0.05, 0.08, 3]].forEach(([x, y, z, k]) => pot(m, x, y, z, k + 20, 0.95)); } });
        return true;
      }
      case "tomate":
        slatCrate(b, 0.82, 0.58, 0.24, 21, { ys: [0.03, 0.125], slat: 0.09 });
        rows(4, 3, 0.19, 0.17, 0.15, (x, y, z, k) => tomato(b, x, y, z, 0.1, k), 0.02);
        [[0.05, 0.27, 0.03, 30], [-0.15, 0.27, -0.05, 31]].forEach(([x, y, z, k]) => tomato(b, x, y, z, 0.1, k));
        return true;
      case "apfel": case "birne":
        slatCrate(b, 0.82, 0.58, 0.24, 25, { ys: [0.03, 0.125], slat: 0.09 });
        rows(4, 3, 0.19, 0.17, 0.15, (x, y, z, k) => apple(b, x, y, z, id === "birne" ? 0.095 : 0.1, k, id === "birne"), 0.02);
        [[0.04, 0.27, 0.02, 40], [-0.16, 0.26, -0.06, 41]].forEach(([x, y, z, k]) => apple(b, x, y, z, 0.1, k, id === "birne"));
        return true;
      case "erdbeere": {
        /* grüne Pappschale, schräge Wände, gefüllt mit Erdbeeren (gelbe Nüsschen, grüner Kelch) */
        const OL = rrect(0.64, 0.46, 0.04, 2), G = 0x4f9a52, R = [ringXZ(OL, 0, 0.86), ringXZ(OL, 0.16, 1), ringXZ(OL, 0.175, 1.02), ringXZ(OL, 0.16, 0.95), ringXZ(OL, 0.03, 0.82)];
        skinV(b, R, R.map((r, i) => r.map(p => i >= 3 ? mulC(cv(G), 0.7) : mulC(cv(G), 0.95 + 0.08 * hs(p[0] * 30, p[2] * 30, i)))), { cap0: true, cap1: true, n0: [0, -1, 0], n1: [0, 1, 0], c1: mulC(cv(G), 0.6), ref: (i, j, p) => i >= 3 ? [-p[0], 0.3, -p[2]] : i === 2 ? [p[0], 1, p[2]] : [p[0], -0.2, p[2]] });
        rows(4, 3, 0.15, 0.14, 0.22, (x, y, z, k) => strawberry(b, x, y, z, 0.085, k), 0.02);
        [[0.03, 0.3, 0.02, 30], [-0.13, 0.29, -0.04, 31], [0.15, 0.29, 0.06, 32]].forEach(([x, y, z, k]) => strawberry(b, x, y, z, 0.085, k));
        return true;
      }
      case "kirsche": {
        const OL = rrect(0.58, 0.42, 0.04, 2), W = 0xf3eee2, R = [ringXZ(OL, 0, 0.86), ringXZ(OL, 0.15, 1), ringXZ(OL, 0.165, 1.02), ringXZ(OL, 0.15, 0.95), ringXZ(OL, 0.03, 0.82)];
        skinV(b, R, R.map((r, i) => r.map(() => i >= 3 ? mulC(cv(W), 0.8) : cv(W))), { cap0: true, cap1: true, n0: [0, -1, 0], n1: [0, 1, 0], c1: mulC(cv(W), 0.75), ref: (i, j, p) => i >= 3 ? [-p[0], 0.3, -p[2]] : i === 2 ? [p[0], 1, p[2]] : [p[0], -0.2, p[2]] });
        b.box(0.2, 0.06, 0.006, 0xd8332b, { y: 0.06, z: 0.215, c: false });
        rows(4, 3, 0.12, 0.12, 0.18, (x, y, z, k) => {
          sEll(b, [x, y, z], [0.058, 0.055, 0.058], (p, yy, t) => lerpC(0xb3132a, 0x6a0a18, 0.5 - 0.5 * yy + 0.2 * Math.sin(t + k)), 9, 6, 0.04, k);
          if (k % 2 === 0) rope(b, [[x, y + 0.05, z], [x + 0.02, y + 0.12, z + 0.02], [x + 0.06, y + 0.17, z + 0.04]], 0.006, 0x5a7a2a, 4);
        }, 0.015);
        return true;
      }
      case "karotte":
        for (let i = 0; i < 6; i++) {
          const x = (i % 3 - 1) * 0.1, y = 0.07 + Math.floor(i / 3) * 0.09, z = (hs(i, 1, 1) - 0.5) * 0.06;
          b.at({ x, y, z: z + 0.25, rx: -Math.PI / 2 }, m => sLathe(m, [[0, 0.004], [0.06, 0.02], [0.2, 0.04], [0.38, 0.058], [0.5, 0.066], [0.54, 0.06]], 10, (p, yy, a, ii) => mulC(cv(0xf2731e), ii % 2 ? 0.92 : 1.03), (yy, a) => 1 + 0.03 * Math.sin(a * 3 + yy * 30)));
          for (let k = 0; k < 4; k++) { const a = (k - 1.5) * 0.25 + i * 0.4, L = 0.22 + hs(i, k, 2) * 0.1; rope(b, [[x, y, z - 0.29], [x + Math.sin(a) * 0.05, y + 0.03, z - 0.29 - L * 0.5], [x + Math.sin(a) * 0.12, y + 0.06 + k * 0.01, z - 0.29 - L]], 0.008, 0x4f9a32, 4);
            b.at({ x: x + Math.sin(a) * 0.12, y: y + 0.06, z: z - 0.29 - L }, m => sEll(m, [0, 0, 0], [0.04, 0.012, 0.06], k % 2 ? 0x5aa83a : 0x4a9030, 6, 4)); }
        }
        b.box(0.38, 0.03, 0.035, 0xd8332b, { y: 0.1, z: -0.27, c: true });
        return true;
      case "kuerbis": {
        b.at({ y: 0 }, m => sLathe(m, [[0, 0.06], [0.04, 0.2], [0.13, 0.33], [0.28, 0.37], [0.43, 0.34], [0.53, 0.24], [0.57, 0.1], [0.56, 0.03]], 20, (p, yy, a) => mulC(lerpC(0xf08a24, 0xd8661a, 0.5 + 0.5 * Math.cos(a * 10)), 0.95 + 0.08 * hs(p[0] * 20, p[1] * 20, 1)), (yy, a) => 1 + 0.07 * Math.cos(a * 10), { tip1: [0, 0.52, 0] }));
        rope(b, [[0, 0.52, 0], [0.02, 0.6, 0], [0.07, 0.66, 0.01]], [0.035, 0.03, 0.024], 0x6b7a2c, 6);
        b.at({ x: -0.12, y: 0.54, z: 0.08, rz: 0.4, ry: 0.6 }, m => sEll(m, [0.08, 0, 0], [0.11, 0.015, 0.09], 0x5a8a2c, 8, 4));
        return true;
      }
      case "wolle": {
        /* Rohwolle: lockiges Vlies, cremeweiß mit dunkleren Spitzen, mit Schnur gebunden */
        sEll(b, [0, 0.2, 0], [0.42, 0.2, 0.3], (p, yy) => lerpC(0xf3ead6, 0xd8c8a4, 0.5 - 0.5 * yy), 14, 9, 0.12, 4);
        for (let i = 0; i < 34; i++) { const t = hs(i, 1, 9) * Math.PI * 2, u = hs(i, 2, 9), ph = u * Math.PI * 0.5, x = Math.cos(t) * Math.cos(ph) * 0.4, z = Math.sin(t) * Math.cos(ph) * 0.28, y = 0.2 + Math.sin(ph) * 0.19;
          sEll(b, [x, y, z], [0.085, 0.06, 0.085], (p, yy) => lerpC(0xfbf5e6, 0xb9a47c, 0.55 - 0.55 * yy + hs(i, 3, 3) * 0.15), 8, 6, 0.35, i); }
        const L = []; for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 2; L.push([0.02, 0.21 + Math.sin(a) * 0.23, Math.cos(a) * 0.33]); } rope(b, L, 0.012, 0xb8925a, 5);
        return true;
      }
      case "spaket": case "rpaket": {
        /* Fleisch in der Schale: Kotelett mit Fettrand (Schwein) bzw. Steak mit Marmorierung (Rind), Folienglanz, Etikett */
        const pork = id === "spaket";
        tray(b, 0.78, 0.54, 0.05, 0x2e2e34, 0x45454e);
        for (let i = 0; i < 2; i++) b.at({ x: -0.15 + i * 0.29, y: 0.055, z: (i - 0.5) * 0.04, ry: (i - 0.5) * 0.5 + 0.2 }, m => {
          sEll(m, [0, 0.035, 0], [0.16, 0.045, 0.21], (p, yy) => {
            const fat = pork && p[2] < -0.13 + 0.03 * Math.sin(p[0] * 20), marb = Math.sin(p[0] * 46 + Math.sin(p[2] * 30) * 2.5) > (pork ? 0.92 : 0.8);
            if (fat) return mulC(cv(0xfbeee4), 0.95 + 0.05 * yy);
            return mulC(marb ? cv(pork ? 0xf8cfc4 : 0xe8c0b8) : cv(pork ? 0xe88f86 : 0xa8222c), 0.86 + 0.16 * yy);
          }, 14, 6, 0.1, i + 2);
          if (pork) rope(m, [[0.02, 0.07, 0.08], [0.03, 0.075, -0.05]], 0.016, 0xf6efe4, 5);                    /* Knochen */
        });
        [[-0.2, 0.0, 0.6], [0.1, 0.06, 0.6]].forEach(([x, z, ry]) => b.box(0.22, 0.004, 0.012, 0xe6eaee, { x, y: 0.135, z, ry, c: true }));   /* Folienglanz */
        b.box(0.24, 0.006, 0.16, 0xfaf4e4, { x: 0.2, y: 0.14, z: 0.16, c: true });
        b.box(0.24, 0.007, 0.04, pork ? 0xd8332b : 0x2f6fb0, { x: 0.2, y: 0.142, z: 0.2, c: true });
        [0.15, 0.12].forEach((z, k) => b.box(0.15 - k * 0.04, 0.007, 0.012, 0x6a6a6a, { x: 0.18, y: 0.142, z, c: true }));
        return true;
      }
      case "hfutter":
        bucket(b, 0.26, 0.33, 0.44);
        sEll(b, [0, 0.42, 0], [0.31, 0.07, 0.31], (p) => { const h = hs(p[0] * 60, p[2] * 60, 1); return h > 0.85 ? cv(0x9a7a3a) : h > 0.5 ? cv(0xd8b46a) : cv(0xe8d08a); }, 16, 6, 0.1, 3);
        for (let i = 0; i < 30; i++) { const t = hs(i, 1, 1) * Math.PI * 2, r = Math.sqrt(hs(i, 2, 2)) * 0.26; sEll(b, [Math.cos(t) * r, 0.47 + hs(i, 3, 3) * 0.02, Math.sin(t) * r], [0.02, 0.013, 0.016], [0xe8c060, 0xb8782a, 0xf2e2a8][i % 3], 5, 3); }
        b.at({ x: 0.18, y: 0.47, z: 0.1, rz: -0.3, ry: 0.6 }, m => { sLathe(m, [[0, 0.06], [0.05, 0.07], [0.06, 0.07]], 10, () => cv(0xd8332b), null, { cap1: false }); rope(m, [[0.06, 0.03, 0], [0.2, 0.06, 0]], 0.014, 0xd8332b, 5); });
        return true;
      case "kfutter": {
        /* Heuballen: Halme längs (unruhige Strohfarbe), runde Kanten, abstehende Halme an den Stirnseiten, zwei Bindegarne */
        const OL0 = rrect(0.46, 0.42, 0.06, 2), OL = []; OL0.forEach((p, i) => { const q = OL0[(i + 1) % OL0.length]; for (let k = 0; k < 3; k++) OL.push([p[0] + (q[0] - p[0]) * k / 3, p[1] + (q[1] - p[1]) * k / 3]); });
        const R = [], Cc = [], xs = [-0.4, -0.39, -0.25, -0.1, 0.1, 0.25, 0.39, 0.4];
        xs.forEach((x, i) => { const k = i === 0 || i === xs.length - 1 ? 0.9 : 1, r = OL.map(([z, y]) => [x, y * k + 0.21, z * k]); R.push(r); Cc.push(r.map((p, j) => mulC(lerpC(0xeedc8e, 0x96883a, hs(j, 1, 1)), 0.94 + 0.12 * hs(p[0] * 10, j, 3)))); });
        skinV(b, R, Cc, { cap0: true, cap1: true, n0: [-1, 0, 0], n1: [1, 0, 0], c0: cv(0xc8b050), c1: cv(0xc8b050) });
        for (let i = 0; i < 40; i++) { const sd = i % 2 ? 1 : -1, z = (hs(i, 1, 1) - 0.5) * 0.42, y = 0.03 + hs(i, 2, 2) * 0.38; rope(b, [[sd * 0.39, y, z], [sd * (0.44 + hs(i, 3, 3) * 0.07), y + (hs(i, 4, 4) - 0.5) * 0.1, z + (hs(i, 5, 5) - 0.5) * 0.1]], 0.005, i % 3 ? 0xe6d07a : 0xbfb060, 3); }
        for (let i = 0; i < 24; i++) { const x = (hs(i, 6, 6) - 0.5) * 0.7, z = (hs(i, 7, 7) - 0.5) * 0.4; rope(b, [[x, 0.42, z], [x + (hs(i, 8, 8) - 0.5) * 0.14, 0.44, z + (hs(i, 9, 9) - 0.5) * 0.1]], 0.004, 0xe6d07a, 3); }
        [-0.2, 0.2].forEach(x => { const L = ringXZ(OL, 0, 1.04).map(([z, , zz]) => [x, 0, 0]); void L; const P = OL.map(([z, y]) => [x, y * 1.04 + 0.21, z * 1.04]); P.push(P[0]); rope(b, P, 0.008, 0xd8551a, 4); });
        return true;
      }
      case "sfutter": feedSack(b, { sack: 0xf2eee4, band: [0.4, 0.5], bandC: 0xe06a7a, emblem: embPig }); return true;
      case "schfutter": feedSack(b, { sack: 0xe8dcbc, band: [0.4, 0.5], bandC: 0x4f9a3a, emblem: embSheep }); return true;
      case "brot": {
        /* Laib: Kruste braun, oben Mehlstaub und drei schräge, hellere Einschnitte */
        const R = [], Cc = [];
        for (let i = 0; i <= 14; i++) { const t = i / 14, z = -0.38 + t * 0.76, s = Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.5) / 0.5, 2))) * 0.96 + 0.04, ring = [], col = [];
          for (let j = 0; j < 16; j++) { const a = (j / 16) * Math.PI * 2, sv = Math.sin(a), p = [Math.cos(a) * 0.24 * s, (sv > 0 ? sv * 0.2 : sv * 0.03) * s + 0.03 * s + 0.0, z]; p[1] = Math.max(p[1], 0) + 0.002; ring.push(p);
            const cut = sv > 0.55 && Math.abs(Math.sin((z * 1 + p[0] * 0.8) * 10.5)) < 0.32; col.push(cut ? cv(0xf0cf8a) : sv > 0.6 ? lerpC(0xb8742c, 0xe6d6b8, hs(i, j, 4) * 0.35) : sv < -0.1 ? cv(0x8a5420) : cv(0xc07a32)); }
          R.push(ring); Cc.push(col); }
        skinV(b, R, Cc, { cap0: true, cap1: true });
        [-0.2, 0, 0.2].forEach(z => b.at({ y: 0.225, z, ry: 0.6 }, m => sEll(m, [0, 0, 0], [0.11, 0.018, 0.03], (p, yy) => lerpC(0xf2d494, 0xe0b46a, 0.5 - 0.5 * yy), 8, 4)));
        return true;
      }
      case "butter": {
        /* Butterblock: links offen (blassgelb), rechts in Goldfolie mit blauem Etikett */
        b.at({ x: -0.14 }, m => m.at({ ry: Math.PI / 2 }, q => lumber(q, { w: 0.26, h: 0.2, l: 0.2, ch: 0.02, seg: 2, nx: 3, ny: 2, colAt: (p) => mulC(cv(0xf8e48a), 0.97 + 0.05 * hs(p[0] * 20, p[1] * 20, 1)), pith: [0.5, -3], rings: [] })));
        b.at({ x: 0.08 }, m => m.at({ ry: Math.PI / 2 }, q => lumber(q, { w: 0.27, h: 0.212, l: 0.3, ch: 0.022, seg: 5, nx: 4, ny: 3, colAt: (p) => mulC(lerpC(0xecc24e, 0xc8962a, 0.5 + 0.5 * Math.sin(p[0] * 34 + p[2] * 21 + p[1] * 17)), 1), pith: [0.5, -3], rings: [] })));
        b.box(0.18, 0.12, 0.006, 0x2f6fb0, { x: 0.1, y: 0.05, z: 0.136, c: false });
        b.box(0.12, 0.03, 0.007, 0xfaf4e4, { x: 0.1, y: 0.1, z: 0.137, c: false });
        b.box(0.18, 0.006, 0.14, 0x2f6fb0, { x: 0.1, y: 0.212, z: 0, c: false });
        return true;
      }
      case "kaese": {
        /* Laib mit Rinde, davor ein Keil mit Löchern */
        sLathe(b, [[0, 0.36], [0.02, 0.4], [0.06, 0.42], [0.2, 0.42], [0.24, 0.4], [0.26, 0.36]], 22, (p, y) => y < 0.03 || y > 0.24 ? cv(0xf2cc58) : lerpC(0xe8a838, 0xd8902a, hs(p[0] * 20, y * 20, 1) * 0.5), null, { c1: cv(0xf6d468) });
        [[0.15, 0.262, 0.1, 0.03], [-0.12, 0.262, -0.08, 0.025], [0.02, 0.262, 0.2, 0.02]].forEach(([x, y, z, r]) => { const P = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; P.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]); } for (let k = 0; k < 8; k++) b.triV([x, y, z], P[(k + 1) % 8], P[k], 0xd8a838, 0xe0b040, 0xe0b040); });
        b.at({ x: 0.52, z: 0.12, ry: -1.1 }, m => {
          const h = 0.22, A = [0, 0, 0], B2 = [0.34, 0, -0.11], C2 = [0.34, 0, 0.11], At = [0, h, 0], Bt = [0.34, h, -0.11], Ct = [0.34, h, 0.11], P = 0xf6d468, Pd = 0xeec254, Rd = 0xe0a034;
          m.triV(At, Ct, Bt, P, P, P); m.triV(A, B2, C2, Pd, Pd, Pd);
          q4(m, A, At, Bt, B2, Pd, P, P, Pd); q4(m, A, C2, Ct, At, Pd, Pd, P, P); q4(m, B2, Bt, Ct, C2, Rd, Rd, Rd, Rd);
          [[0.16, 0.09, 1, 0.024], [0.25, 0.15, 1, 0.018], [0.22, 0.06, -1, 0.02], [0.3, 0.14, -1, 0.015]].forEach(([x, y, sd, r]) => sEll(m, [x, y, sd * 0.323 * x], [r, r, r * 0.35], 0xd09a2e, 6, 4));
          [[0.15, 0.03], [0.25, -0.05]].forEach(([x, z]) => sEll(m, [x, h + 0.001, z], [0.02, 0.004, 0.02], 0xd09a2e, 6, 3));
        });
        return true;
      }
      case "socken":
        b.at({ x: -0.1, ry: 0.25, y: 0 }, m => sock(m, 0xf0e6d2, 0xc8323a));
        b.at({ x: 0.06, ry: -0.05, y: 0.046, z: 0.06 }, m => sock(m, 0xece0c8, 0xc8323a));
        return true;
      case "pullover": {
        /* zusammengelegter Strickpullover: Rippen längs, Norwegerband in Weiß, Rollkragen oben, Ärmel eingeschlagen, Rippbund unten */
        const B = 0x3a72c0;
        b.at({}, m => lumber(m, { w: 0.62, h: 0.12, l: 0.58, ch: 0.045, seg: 22, nx: 14, ny: 2, colAt: (p) => {
          let c = mulC(cv(B), Math.round(p[0] * 52) % 2 ? 0.88 : 1.0);
          if (p[2] < -0.08 && p[2] > -0.17) c = (Math.round(p[0] * 26 + Math.abs(p[2] + 0.125) * 40) % 3 === 0) ? cv(0xe6eef6) : cv(0xf4f6fa);
          if (p[2] > 0.22) c = mulC(cv(B), Math.round(p[0] * 70) % 2 ? 0.78 : 0.9);
          return c; }, pith: [0.5, -3], rings: [] }));
        b.at({ z: -0.24, y: 0.12 }, m => sLathe(m, [[0, 0.12], [0.03, 0.12], [0.05, 0.11]], 16, (p, y, a, i, j) => mulC(cv(0x2f5f98), j % 2 ? 0.85 : 1), (y, a) => (Math.sin(a) > 0 ? 0.9 : 0.55), { cap0: false, c1: cv(0x1f3f68) }));
        [-1, 1].forEach(s => b.at({ x: s * 0.17, y: 0.12, z: 0.05, ry: s * 0.35 }, m => lumber(m, { w: 0.12, h: 0.03, l: 0.42, ch: 0.012, seg: 4, nx: 3, ny: 1, colAt: (p) => p[2] > 0.15 ? mulC(cv(B), 0.8) : mulC(cv(B), Math.round(p[0] * 52) % 2 ? 0.86 : 0.97), pith: [0.5, -3], rings: [] })));
        return true;
      }
      case "koeder": {
        /* Dose Reusenköder: Blechdose mit grünem Etikett, Deckel aufgebogen, braune Köderpellets */
        sLathe(b, [[0, 0.15], [0.012, 0.16], [0.03, 0.158], [0.07, 0.158], [0.2, 0.158], [0.25, 0.158], [0.27, 0.163], [0.28, 0.16]], 16, (p, y, a) => y >= 0.07 && y <= 0.2 ? mulC(cv(0x2f6a3a), 0.95 + 0.08 * Math.sin(a * 2)) : mulC(lerpC(0xd8b458, 0xa8823a, 0.5 + 0.5 * Math.sin(a * 2 + 0.6)), 1), null, { c1: cv(0x5a3a22) });
        b.box(0.12, 0.07, 0.006, 0xf6f1e4, { y: 0.105, z: 0.158, c: false });
        for (let k = 0; k < 14; k++) { const t = hs(k, 1, 1) * Math.PI * 2, r = Math.sqrt(hs(k, 2, 2)) * 0.13; sEll(b, [Math.cos(t) * r, 0.29 + hs(k, 3, 3) * 0.02, Math.sin(t) * r], [0.025, 0.018, 0.02], k % 2 ? 0x7a4a2a : 0x9a6038, 6, 4, 0.3, k); }
        b.at({ x: 0.2, y: 0.25, z: -0.05, rz: -1.1 }, m => sLathe(m, [[0, 0.16], [0.012, 0.165], [0.018, 0.15]], 16, () => cv(0xd8b458), null, { c1: cv(0xc8a248) }));
        return true;
      }
      case "wurm": {
        /* Dose mit Erde und Tauwürmern: Zinkdose mit Sicken, krümelige Erde, rosige Würmer mit Ringeln */
        sLathe(b, [[0, 0.16], [0.012, 0.17], [0.06, 0.17], [0.065, 0.176], [0.07, 0.17], [0.13, 0.17], [0.135, 0.176], [0.14, 0.17], [0.21, 0.17], [0.225, 0.176]], 16, (p, y, a) => mulC(lerpC(0xb8c0c6, 0x8a949a, 0.5 + 0.5 * Math.sin(a * 2 + 0.8)), 1), null, { c1: cv(0x4a3424) });
        sEll(b, [0, 0.215, 0], [0.165, 0.03, 0.165], (p) => hs(p[0] * 50, p[2] * 50, 2) > 0.7 ? cv(0x6a4a30) : cv(0x3e2a1c), 14, 5, 0.15, 3);
        for (let w = 0; w < 3; w++) {
          const P = []; let x = (hs(w, 1, 1) - 0.5) * 0.1, z = (hs(w, 2, 2) - 0.5) * 0.1, y = 0.23, a = hs(w, 3, 3) * 6;
          for (let k = 0; k < 10; k++) { P.push([x, y, z]); a += 0.6 * (w % 2 ? 1 : -1); x += Math.cos(a) * 0.03; z += Math.sin(a) * 0.03; y += k < 4 ? 0.025 : k < 7 ? -0.01 : -0.02; }
          rope(b, P, P.map((_, k) => 0.016 * (k === 0 || k === 9 ? 0.6 : 1)), (k) => k === 3 ? cv(0xc8646a) : k % 2 ? cv(0xd88a84) : cv(0xe09a92), 6);
        }
        return true;
      }
      case "abfall": {
        /* Eimer mit Fischabfall: Gräte mit Rippen, Kopf, Schwanzflosse */
        bucket(b, 0.22, 0.28, 0.42);
        sEll(b, [0, 0.4, 0], [0.26, 0.04, 0.26], 0x6a5a4e, 12, 4);
        b.at({ y: 0.45, rz: 0.35, ry: 0.4 }, m => { rope(m, [[-0.18, 0, 0], [0.18, 0, 0]], 0.012, 0xf2ecdc, 5); for (let k = 0; k < 7; k++) { const x = -0.13 + k * 0.045; rope(m, [[x, 0, 0], [x - 0.02, 0, 0.07]], 0.005, 0xf2ecdc, 3); rope(m, [[x, 0, 0], [x - 0.02, 0, -0.07]], 0.005, 0xf2ecdc, 3); } });
        if (typeof FFM !== "undefined" && FFM.fishUp && FFM.FISH) { const t = new MB(); FFM.fishUp(t, FFM.FISH.barsch); b.merge(new MB().merge(t, { x: -0.3, rx: -0.6 }), { x: 0.08, y: 0.42, z: 0.06, ry: 0.5, s: 0.32 }); }
        return true;
      }
      case "garn": {
        const cols = [0xd8332b, 0x3f78c8, 0xf2c230, 0x47b84f, 0xf6f1e4];
        [[-0.22, 0, 0], [0.22, 0, 0.02], [0, 0, 0.24], [-0.05, 0, -0.2], [0, 0.26, 0.02]].forEach(([x, y, z], i) => {
          b.at({ x, y: y + 0.17, z, rx: i * 0.7, ry: i * 1.3 }, m => sEll(m, [0, 0, 0], [0.17, 0.17, 0.17], (p, yy, t) => mulC(cv(cols[i]), 0.82 + 0.24 * (0.5 + 0.5 * Math.sin(Math.atan2(p[1], p[0]) * 9 + yy * 3))), 18, 12, 0.03, i));
          for (let k = 0; k < 3; k++) { const L = []; for (let q = 0; q <= 14; q++) { const a = (q / 14) * Math.PI * 2; L.push([Math.cos(a) * 0.172, Math.sin(a) * 0.172 * Math.cos(k * 0.9 + i), Math.sin(a) * 0.172 * Math.sin(k * 0.9 + i)]); } b.at({ x, y: y + 0.17, z }, m => rope(m, L, 0.008, mulC(cv(cols[i]), 1.12), 4)); }
        });
        return true;
      }
    }
    return false;
  }
  /* --- Werkzeug (v122): Stiel mit Maser, geschmiedeter Kopf mit heller Schneide, Säge mit Kettenschwert und Zähnen --- */
  function toolNew(id) {
    const b = new MB();
    if (id === "axe1" || id === "axe2") {
      const steel = id === "axe2", L = steel ? 1.2 : 1.0;
      b.at({ rz: -0.55 }, m => {
        /* Stiel: leicht geschwungen, unten verdickt (Knauf) */
        const pts = [], rr = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([Math.sin(t * Math.PI) * 0.025 - t * 0.01, t * L, 0]); rr.push(t < 0.08 ? 0.045 : 0.034 - t * 0.004); }
        rope(m, pts, rr, (k) => steel ? mulC(cv(0xc9955a), k % 2 ? 0.94 : 1.03) : mulC(cv(0x8a6040), k % 2 ? 0.92 : 1.02), 7);
        if (steel) rope(m, [[0, 0.1, 0], [0, 0.32, 0]], 0.042, 0xd8332b, 7);
        /* Kopf: Nacken, Wange, breite Schneide */
        const P = [[-0.07, -0.06], [0.06, -0.06], [0.22, -0.12], [0.26, -0.13], [0.27, 0.13], [0.23, 0.12], [0.06, 0.06], [-0.07, 0.06]];
        m.at({ y: L - 0.07, z: 0 }, q => q.at({ rx: 0 }, r => { const Z = [-0.032, 0.032]; extrude(r, [P.map(([x, y]) => [x, y * 0.95]), P.map(([x, y]) => [x, y * 0.95])], Z, (i, j) => j === 3 ? cv(steel ? 0xf4f8fb : 0xd8d2c8) : steel ? mulC(cv(0x8a96a0), j % 2 ? 0.9 : 1.05) : mulC(cv(0x5a5048), j % 2 ? 0.9 : 1.05), {
          cap0: p => p[0] > 0.18 ? cv(steel ? 0xe2e8ee : 0xb8b0a4) : cv(steel ? 0x9aa6b0 : 0x6a5e54), cap1: p => p[0] > 0.18 ? cv(steel ? 0xe2e8ee : 0xb8b0a4) : cv(steel ? 0x9aa6b0 : 0x6a5e54) }); }));
        if (!steel) m.box(0.03, 0.03, 0.07, 0x6a4a2a, { x: -0.075, y: L - 0.09, c: false });
      });
      return b;
    }
    if (id === "saw1" || id === "saw2") {
      const pro = id === "saw2", body = pro ? 0xf2c230 : 0xf2731e, bar = pro ? 1.15 : 0.82;
      b.at({ y: 0.02 }, m => lumber(m, { w: 0.34, h: 0.34, l: 0.6, ch: 0.06, seg: 3, nx: 3, ny: 3, colAt: (p) => p[1] > 0.22 ? mulC(cv(body), 1.05) : p[1] < 0.06 ? cv(0x2a2a30) : cv(body), pith: [0.5, -3], rings: [] }));
      b.at({ x: 0.0, y: 0.36, z: -0.08 }, m => lumber(m, { w: 0.24, h: 0.08, l: 0.36, ch: 0.025, seg: 2, nx: 2, ny: 1, colAt: () => cv(0x2a2a30), pith: [0.5, -3], rings: [] }));
      rope(b, [[0, 0.4, -0.28], [0, 0.56, -0.22], [0, 0.58, -0.02], [0, 0.42, 0.05]], 0.03, 0x2a2a30, 6);                 /* Griff oben */
      rope(b, [[-0.2, 0.1, 0.24], [-0.21, 0.42, 0.24], [0, 0.5, 0.24], [0.21, 0.42, 0.24], [0.2, 0.1, 0.24]], 0.025, 0x2a2a30, 6);   /* Bügel */
      b.at({ y: 0.08, z: 0.3 + bar / 2 }, m => {
        m.box(0.03, 0.17, bar, 0xd8dde2, { c: true, y: 0.085 });
        for (let k = 0; k < Math.round(bar / 0.05); k++) { const z = -bar / 2 + k * 0.05 + 0.02; m.box(0.045, 0.02, 0.03, 0x2a2a30, { y: 0.177, z, c: false }); m.box(0.045, 0.02, 0.03, 0x2a2a30, { y: -0.02, z, c: false }); }
        rope(m, [[0, 0.085, bar / 2], [0, 0.085, bar / 2 + 0.01]], 0.095, 0x2a2a30, 10);
      });
      b.box(0.36, 0.1, 0.01, pro ? 0x2a2a30 : 0xfaf4e4, { y: 0.14, z: 0.302, c: false });
      if (pro) b.box(0.2, 0.05, 0.012, 0xf2c230, { y: 0.15, z: 0.31, c: false });
      return b;
    }
    if (id === "sickle") {
      b.at({ rz: -0.5 }, m => {
        sLathe(m, [[-0.52, 0.04], [-0.5, 0.048], [-0.3, 0.043], [-0.1, 0.045], [-0.02, 0.05], [0, 0.05]], 9, (p, y, a, i) => mulC(cv(0x9a6a3a), i % 2 ? 0.94 : 1.04), null, {});
        rope(m, [[0, -0.02, 0], [0, 0.04, 0]], 0.055, 0x6a4a2a, 8);
        /* Klinge als gebogener Streifen: innen helle Schneide */
        const N = 14, outer = [], inner = [];
        for (let i = 0; i <= N; i++) { const a = Math.PI * 0.05 + (i / N) * Math.PI * 0.95, r = 0.36, w = 0.09 * (1 - i / (N + 3)); outer.push([Math.cos(a) * r - r, Math.sin(a) * r + 0.04]); inner.push([Math.cos(a) * (r - w) - r, Math.sin(a) * (r - w) + 0.04]); }
        for (let i = 0; i < N; i++) [0.013, -0.013].forEach((z, s) => { const A = [outer[i][0], outer[i][1], z], B2 = [outer[i + 1][0], outer[i + 1][1], z], C2 = [inner[i + 1][0], inner[i + 1][1], z], D = [inner[i][0], inner[i][1], z];
          if (s === 0) q4(m, A, B2, C2, D, 0xc8d0d8, 0xc8d0d8, 0xf2f6f8, 0xf2f6f8); else q4(m, A, D, C2, B2, 0xa8b0b8, 0xe2e8ec, 0xe2e8ec, 0xa8b0b8); });
      });
      return b;
    }
    if (id === "water") {
      const G = 0x3f9a5a, Gd = 0x2f7a46;
      sLathe(b, [[0, 0.25], [0.02, 0.27], [0.06, 0.28], [0.4, 0.27], [0.44, 0.26], [0.48, 0.2], [0.5, 0.12]], 16, (p, y, a) => y > 0.12 && y < 0.17 || y > 0.41 && y < 0.45 ? cv(Gd) : mulC(cv(G), 0.95 + 0.08 * Math.sin(a * 2)), null, { c1: cv(Gd) });
      rope(b, [[0.2, 0.1, 0], [0.38, 0.3, 0], [0.5, 0.48, 0]], [0.045, 0.035, 0.03], G, 8);
      b.at({ x: 0.53, y: 0.52, rz: -0.7 }, m => sLathe(m, [[0, 0.03], [0.04, 0.08], [0.06, 0.09], [0.065, 0.085]], 12, (p, y) => y > 0.06 ? cv(0xb89a3a) : cv(0xd8b84a), null, { c1: cv(0x8a7a3a) }));
      rope(b, [[-0.24, 0.42, 0], [-0.3, 0.6, 0], [-0.1, 0.68, 0], [0.12, 0.52, 0]], 0.028, Gd, 7);
      return b;
    }
    return null;
  }

  /* ------------------------ Waren und Werkzeug --------------------------
     Kleine Modelle für Bildchen in Rezepten, Lager und Laden: Stämme je
     Holzart, Bretter, Balken, Platten, Kisten … und die Werkzeuge. */
  const WOOD = { bright: 0xd9b47c, mid: 0xb98550, dark: 0x9a6a3a };
  const LOG_SP = { birke: "birke", kiefer: "kiefer", buche: "buche", eiche: "eiche", edelholz: "kirsche" };
  function logs(b, sp, n) {
    const T = TREE_C[sp] || TREE_C.kiefer, P = [[-0.17, 0.16], [0.17, 0.16], [0, 0.44]].slice(0, n || 3);
    P.forEach(([x, y]) => {
      b.cyl(0.16, 0.16, 1.1, 9, T.bark, { rx: Math.PI / 2, x, y, z: -0.55, top: 0xe6c99a });
      b.cyl(0.1, 0.1, 0.01, 9, 0xd2b07c, { rx: Math.PI / 2, x, y, z: 0.552 });           /* Jahresring */
      if (sp === "birke") for (let i = 0; i < 5; i++) b.box(0.08, 0.025, 0.12, T.mark, { x: x + 0.13, y: y + 0.04 * (i % 3), z: -0.45 + i * 0.2 });
    });
  }
  function planks(b, n, w, t, l, col, cols) {
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      b.box(w, t, l, i % 2 ? col : mix(col, 0xffffff, 0.08), { x: (c - (cols - 1) / 2) * (w + 0.02), y: r * (t + 0.005), z: (rnd() - 0.5) * 0.06 });
    }
  }
  function strap(b, w, h, z) { b.box(w + 0.04, 0.03, 0.06, 0xd8332b, { y: h, z }); [-1, 1].forEach(s => b.box(0.03, h + 0.02, 0.06, 0xd8332b, { x: s * (w / 2 + 0.02), z })); }
  function item(id) {
    G3.seed(5100 + id.length * 13 + id.charCodeAt(0));
    const b = new MB();
    if (woodItem(id, b) || goodsItem(id, b)) return b;              /* v121: Holzwaren neu, v122: Hofwaren neu */
    switch (id) {
      case "birke": case "kiefer": case "buche": case "eiche": case "edelholz":
        logs(b, LOG_SP[id]);
        if (id === "edelholz") [[0.1, 0.62, 0.3], [-0.15, 0.4, -0.2]].forEach(([x, y, z]) => b.ico(0.06, 0xffe066, { x, y, z }));
        return b;
      case "aeste":
        for (let i = 0; i < 7; i++) b.cyl(0.035, 0.025, 1.1, 5, 0x7a5a3a, { rx: Math.PI / 2 + (rnd() - 0.5) * 0.15, ry: (rnd() - 0.5) * 0.2, x: (i % 4) * 0.07 - 0.1, y: 0.04 + Math.floor(i / 4) * 0.06, z: -0.55 });
        b.box(0.34, 0.03, 0.05, 0xd8b07a, { y: 0.12 }); return b;
      case "reste":
        sack(b, null, { col: 0xb89a68, dark: 0xa88a58, open: true });
        for (let i = 0; i < 9; i++) b.box(0.08, 0.025, 0.045, 0xe9cfa0, { x: 0.2 + (rnd() - 0.5) * 0.4, y: 0.02, z: 0.3 + (rnd() - 0.5) * 0.3, ry: rnd() * 3 });
        for (let i = 0; i < 5; i++) b.box(0.07, 0.02, 0.04, 0xe9cfa0, { x: (rnd() - 0.5) * 0.12, y: 0.81, z: (rnd() - 0.5) * 0.12, ry: rnd() * 3 });
        return b;
      case "brennholz":
        for (let i = 0; i < 9; i++) b.cyl(0.13, 0.13, 0.55, 3, i % 3 ? 0x8a6040 : 0x7a5032, { rx: Math.PI / 2, ry: 0, rz: (i % 2) * 1.05, x: (i % 3 - 1) * 0.22, y: 0.11 + Math.floor(i / 3) * 0.18, z: -0.27, top: 0xe6c99a });
        return b;
      case "kaminholz":
        for (let i = 0; i < 7; i++) b.cyl(0.1, 0.1, 0.45, 8, TREE_C.buche.bark, { rx: Math.PI / 2, x: [-0.2, 0, 0.2, -0.1, 0.1, -0.2, 0.2][i], y: [0.1, 0.1, 0.1, 0.27, 0.27, 0.27, 0.27][i] + (i > 4 ? 0.0 : 0), z: -0.22, top: 0xe6c99a });
        for (let i = 0; i < 4; i++) b.box(0.62, 0.03, 0.03, 0xf2731e, { y: 0.06 + i * 0.12, z: 0.24 });
        for (let i = 0; i < 4; i++) b.box(0.03, 0.42, 0.03, 0xf2731e, { x: -0.27 + i * 0.18, z: 0.24 });
        return b;
      case "pfosten":
        for (let i = 0; i < 4; i++) {
          const x = (i % 2 - 0.5) * 0.18, y = 0.09 + Math.floor(i / 2) * 0.18;
          b.box(0.16, 0.16, 1.1, WOOD.mid, { x, y: y - 0.08, z: -0.1 });
          b.cone(0.11, 0.25, 4, WOOD.bright, { rx: Math.PI / 2, x, y, z: 0.45, a0: Math.PI / 4 });
        }
        strap(b, 0.38, 0.38, -0.2); return b;
      case "bretter": planks(b, 10, 0.26, 0.05, 1.3, WOOD.mid, 2); strap(b, 0.56, 0.27, 0.3); strap(b, 0.56, 0.27, -0.35); return b;
      case "dielen": planks(b, 8, 0.24, 0.045, 1.4, WOOD.bright, 2); for (let i = 0; i < 4; i++) b.box(0.005, 0.01, 1.4, 0xb8884a, { x: -0.24 + i * 0.16, y: 0.175 }); strap(b, 0.52, 0.19, 0); return b;
      case "balken": [-0.14, 0.14].forEach(x => b.box(0.24, 0.24, 1.5, WOOD.mid, { x, top: 0xc99560 })); b.box(0.24, 0.24, 1.5, WOOD.mid, { y: 0.25, top: 0xc99560 }); return b;
      case "bauholz":
        [-0.13, 0.13].forEach(x => { b.box(0.22, 0.22, 1.5, 0xe0c48e, { x, top: 0xead2a0 }); b.box(0.12, 0.08, 0.005, 0x2f6fb0, { x, y: 0.1, z: 0.752 }); });
        b.box(0.22, 0.22, 1.5, 0xe0c48e, { y: 0.23, top: 0xead2a0 }); return b;
      case "bohlen": [0, 0.13].forEach((y, i) => b.box(0.42, 0.11, 1.4, i ? 0x8a5a34 : 0x7a4c2a, { y, z: i * 0.05, top: 0x9a6a40 })); return b;
      case "platten": for (let i = 0; i < 5; i++) b.box(0.95, 0.06, 0.75, i % 2 ? 0x9a6a3a : 0x8a5a30, { y: i * 0.065, x: (rnd() - 0.5) * 0.05, z: (rnd() - 0.5) * 0.05, top: 0xb98550 }); return b;
      case "kisten": {
        const crate = (x, y, z, ry) => b.at({ x, y, z, ry }, m => {
          m.box(0.5, 0.36, 0.4, 0xc9955a, { top: 0xb8884a });
          for (let i = 0; i < 3; i++) m.box(0.52, 0.03, 0.42, 0xa8753e, { y: 0.06 + i * 0.12 });
          m.box(0.46, 0.01, 0.36, 0x6a4a2a, { y: 0.361 });
        });
        crate(-0.27, 0, 0, 0.05); crate(0.27, 0, 0.02, -0.04); crate(0, 0.38, 0, 0.1); return b;
      }
      case "paletten":
        for (let k = 0; k < 3; k++) b.at({ y: k * 0.16 }, m => {
          [-0.42, 0, 0.42].forEach(x => [-0.32, 0, 0.32].forEach(z => m.box(0.13, 0.08, 0.13, 0xc9a06a, { x, z })));
          for (let i = 0; i < 5; i++) m.box(1.1, 0.03, 0.14, 0xd8b07a, { y: 0.08, z: -0.36 + i * 0.18 });
          [-0.42, 0, 0.42].forEach(x => m.box(0.13, 0.03, 0.85, 0xc09060, { x, y: 0.11 }));
        });
        return b;
      case "moebel":
        [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => b.box(0.06, 0.45, 0.06, 0xb8884a, { x, z }));
        b.box(0.5, 0.05, 0.5, 0xc9955a, { y: 0.45 });
        b.box(0.5, 0.45, 0.05, 0xc9955a, { y: 0.5, z: -0.22 });
        [0.15, 0.3].forEach(y => b.box(0.44, 0.04, 0.03, 0xb8884a, { y: 0.5 + y, z: -0.21 }));
        return b;
      case "tueren":
        b.box(0.7, 1.4, 0.08, 0xa8653c, { top: 0x9a5a34 });
        [[0.4, 0.35], [0.95, 0.35]].forEach(([y]) => b.box(0.52, 0.42, 0.02, 0x8a5030, { y, z: 0.045 }));
        b.sphere(0.04, 6, 4, 0xf2c230, { x: 0.26, y: 0.7, z: 0.07 });
        b.box(0.8, 0.06, 0.12, 0x6a4024, { y: 1.4 });
        return b;
      case "zaun":
        for (let i = 0; i < 6; i++) { b.box(0.1, 0.8, 0.04, 0xd8b07a, { x: -0.5 + i * 0.2 }); b.cone(0.07, 0.1, 4, 0xd8b07a, { x: -0.5 + i * 0.2, y: 0.8, a0: Math.PI / 4, sz: 0.4 }); }
        [0.18, 0.6].forEach(y => b.box(1.25, 0.08, 0.04, 0xb8884a, { y, z: -0.04 }));
        return b;
      case "mehl": case "maismehl": {
        const c = id === "mehl" ? 0xf1ece0 : 0xf2d77a, d = id === "mehl" ? 0xd8cfb8 : 0xd8b84a;
        b.box(0.46, 0.62, 0.3, c, { top: d });
        b.box(0.46, 0.1, 0.22, d, { y: 0.62 });
        b.box(0.3, 0.2, 0.01, id === "mehl" ? 0x3f78c8 : 0x2f8a4a, { y: 0.22, z: 0.151 });
        b.cone(0.05, 0.16, 4, 0xf2c230, { y: 0.24, z: 0.16, sz: 0.3 });
        return b;
      }
      case "schatulle":
        b.box(0.6, 0.3, 0.4, 0xa8553c, { top: 0x9a4a34 });
        b.cyl(0.2, 0.2, 0.6, 10, 0xb8603e, { rz: Math.PI / 2, x: 0.3, y: 0.3, sy: 0.6 });
        b.box(0.62, 0.04, 0.42, 0xf2c230, { y: 0.28 });
        b.box(0.1, 0.12, 0.03, 0xf2c230, { y: 0.24, z: 0.2 });
        return b;
    }
    return goods(id, b);
  }

  /* ------------------------------ Hofwaren -------------------------------
     Säcke, Kisten, Schalen, Backwaren, Milch und Fleisch – so, wie sie im
     Hofladen liegen. Gleiches Licht und gleicher Low-Poly-Stil wie das Holz. */
  const JUTE = 0xd8bf8c, JUTE_D = 0xc4a874, CARD = 0xcdbf9f, CRATE = 0xc9955a, CRATE_D = 0xa8753e;
  /* Jutesack: bauchig, oben zugebunden, vorne ein farbiges Etikett */
  function sack(b, label, o) {
    o = o || {};
    const c = o.col || JUTE, d = o.dark || JUTE_D;
    /* breiter Sack mit Schultern, oben abgebunden und aufgeplustert */
    b.at({ ry: Math.PI / 4 }, m => {
      m.noise(0.05, mm => {
        mm.cyl(0.33, 0.35, 0.46, 10, c, { sz: 0.72, smooth: true, bottom: d });
        mm.cyl(0.33, 0.12, 0.2, 10, c, { y: 0.46, sz: 0.72, smooth: true });
      });
      m.cyl(0.12, 0.12, 0.05, 8, 0x8a6040, { y: 0.64 });
      m.cyl(0.12, o.open ? 0.22 : 0.17, 0.12, 9, d, { y: 0.68, top: o.open ? 0x6a5030 : d });
      if (label != null) { m.box(0.34, 0.26, 0.02, 0xfaf4e4, { y: 0.12, z: 0.25 }); m.box(0.26, 0.15, 0.022, label, { y: 0.17, z: 0.255 }); }
    });
  }
  /* flache Obstkiste aus Latten */
  function crate(b, w, d) {
    b.box(w, 0.06, d, CRATE_D);
    [-1, 1].forEach(s => { b.box(w, 0.2, 0.04, CRATE, { y: 0.04, z: s * (d / 2 - 0.02), top: 0xd8a868 }); b.box(0.04, 0.2, d, CRATE, { x: s * (w / 2 - 0.02), y: 0.04, top: 0xd8a868 }); });
    b.box(w + 0.01, 0.03, 0.045, CRATE_D, { y: 0.13, z: d / 2 - 0.02 });
  }
  /* Früchte im Raster auf einer Fläche verteilen */
  function fill(b, w, d, r, y, fn) {
    const nx = Math.max(1, Math.floor(w / (r * 2.05))), nz = Math.max(1, Math.floor(d / (r * 2.05)));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = (i - (nx - 1) / 2) * r * 2.05 + (rnd() - 0.5) * r * 0.2, z = (j - (nz - 1) / 2) * r * 2.05 + (rnd() - 0.5) * r * 0.2;
      fn(x, y + (rnd() - 0.5) * r * 0.25, z, i * nz + j);
    }
  }
  /* Pappschale (Erdbeeren, Kirschen) */
  function punnet(b, w, d, col) { b.cyl(w * 0.62, w * 0.72, 0.16, 4, col, { a0: Math.PI / 4, sz: d / w, top: mix(col, 0x000000, 0.35) }); }
  function goods(id, b) {
    switch (id) {
      case "weizen":
        sack(b, 0xf0c64a, { open: true });
        for (let i = 0; i < 7; i++) {
          const a = (i - 3) * 0.2, x = Math.sin(a) * 0.22, rz = -a * 0.9;
          b.at({ x: x * 0.4, y: 0.84, z: (i % 2) * 0.05 - 0.02, rz }, m => { m.box(0.016, 0.34, 0.016, 0xc8a040, { y: 0 }); m.cyl(0.035, 0.012, 0.16, 6, 0xf0c64a, { y: 0.32 }); });
        }
        return b;
      case "mais":
        sack(b, 0xf2c230);
        [[-0.18, 0.4], [0.16, 0.32]].forEach(([x, ry], i) => b.at({ x, y: 0.08, z: 0.42, ry, rz: Math.PI / 2 - 0.08 }, m => {
          m.noise(0.12, mm => mm.cyl(0.075, 0.05, 0.42, 8, 0xf2c230, { y: -0.21 }));
          m.cone(0.09, 0.3, 5, 0x7ab648, { y: -0.27, rz: Math.PI, sz: 0.6 });
        }));
        return b;
      case "tomate":
        crate(b, 0.82, 0.58);
        fill(b, 0.7, 0.48, 0.12, 0.2, (x, y, z) => { b.sphere(0.12, 10, 7, 0xe03a2a, { x, y, z, sy: 0.82, smooth: true }); b.box(0.07, 0.02, 0.02, 0x3f8a2a, { x, y: y + 0.1, z, ry: rnd() * 3 }); b.box(0.02, 0.02, 0.07, 0x3f8a2a, { x, y: y + 0.1, z }); });
        return b;
      case "karotte":
        for (let i = 0; i < 6; i++) {
          const x = (i % 3 - 1) * 0.11, y = 0.07 + Math.floor(i / 3) * 0.1, z = (rnd() - 0.5) * 0.06;
          b.cone(0.07, 0.62, 7, 0xf2731e, { x, y, z: z - 0.05, rx: Math.PI / 2, smooth: true });
          for (let k = 0; k < 3; k++) b.box(0.025, 0.025, 0.32, 0x5aa83a, { x: x + (k - 1) * 0.03, y: y + (k - 1) * 0.02, z: z - 0.24, ry: (k - 1) * 0.35, rx: -0.2 });
        }
        b.box(0.4, 0.05, 0.05, 0xd8332b, { y: 0.1, z: -0.02 });
        return b;
      case "kartoffel":
        b.noise(0.06, m => m.cyl(0.3, 0.36, 0.55, 10, JUTE, { top: 0x8a6a40 }));
        b.cyl(0.34, 0.31, 0.08, 10, JUTE_D, { y: 0.52 });
        b.noise(0.15, m => {
          fill(m, 0.46, 0.46, 0.1, 0.6, (x, y, z) => m.ico(0.1, 0xc19a5b, { x, y, z, flat: 0.75, jitter: 0.35 }));
          [[0.34, 0.06, 0.32], [0.12, 0.06, 0.44]].forEach(([x, y, z]) => m.ico(0.1, 0xc19a5b, { x, y, z, flat: 0.7, jitter: 0.35 }));
        });
        return b;
      case "erdbeere":
        punnet(b, 0.7, 0.5, 0x4f9a52);
        fill(b, 0.56, 0.38, 0.085, 0.2, (x, y, z) => { b.cone(0.085, 0.14, 7, 0xe0303a, { x, y: y + 0.12, z, rx: Math.PI, smooth: true }); b.cyl(0.07, 0.04, 0.03, 6, 0x3f8a2a, { x, y: y + 0.11, z }); });
        return b;
      case "kuerbis":
        for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; b.sphere(0.24, 9, 7, 0xf08a24, { x: Math.cos(a) * 0.17, y: 0.3, z: Math.sin(a) * 0.17, sy: 1.15, sx: 0.8, ry: -a, smooth: true }); }
        b.sphere(0.3, 10, 7, 0xe07a1a, { y: 0.3, sy: 0.85, smooth: true });
        b.cyl(0.05, 0.035, 0.18, 6, 0x6b8f2c, { y: 0.55, rz: 0.25 });
        return b;
      case "apfel": case "birne":
        crate(b, 0.82, 0.58);
        fill(b, 0.7, 0.48, 0.12, 0.2, (x, y, z, k) => {
          if (id === "apfel") { b.sphere(0.12, 10, 7, k % 3 ? 0xd8332b : 0x9ac43a, { x, y, z, smooth: true }); b.box(0.015, 0.06, 0.015, 0x6a4a2a, { x, y: y + 0.11, z }); }
          else { b.sphere(0.11, 9, 7, 0xc8d24a, { x, y, z, smooth: true }); b.sphere(0.07, 8, 6, 0xc8d24a, { x, y: y + 0.12, z, smooth: true }); b.box(0.015, 0.06, 0.015, 0x6a4a2a, { x, y: y + 0.2, z }); }
        });
        if (id === "apfel") b.box(0.12, 0.012, 0.06, 0x4f9a3a, { x: 0.05, y: 0.34, z: 0.05, ry: 0.6 });
        return b;
      case "kirsche":
        punnet(b, 0.62, 0.46, 0xf6f1e4);
        fill(b, 0.5, 0.36, 0.07, 0.19, (x, y, z, k) => {
          b.sphere(0.07, 9, 6, 0xa3132a, { x, y: y + 0.03, z, smooth: true });
          if (k % 2 === 0) b.box(0.012, 0.16, 0.012, 0x4a7a2a, { x: x + 0.03, y: y + 0.08, z, rz: -0.4 });
        });
        return b;
      case "ei":
        b.box(0.66, 0.1, 0.44, CARD, { top: 0xb8aa8a });
        b.box(0.66, 0.04, 0.44, CARD, { y: 0.1, z: -0.36, rx: -1.1 });
        for (let i = 0; i < 6; i++) b.sphere(0.085, 9, 7, i === 2 ? 0xf6ead4 : 0xe8c8a0, { x: (i % 3 - 1) * 0.2, y: 0.17, z: (Math.floor(i / 3) - 0.5) * 0.19, sy: 1.25, smooth: true });
        return b;
      case "milch": {
        const st = 0xc8d0d8, st2 = 0xa8b2bc;
        b.cyl(0.26, 0.26, 0.48, 14, st, { smooth: true });
        b.cyl(0.26, 0.13, 0.16, 14, st, { y: 0.48, smooth: true });
        b.cyl(0.13, 0.13, 0.12, 12, st, { y: 0.62, smooth: true });
        b.cyl(0.16, 0.16, 0.05, 12, st2, { y: 0.72 });
        b.cyl(0.05, 0.05, 0.04, 8, st2, { y: 0.77 });
        b.cyl(0.265, 0.265, 0.06, 14, 0x3f78c8, { y: 0.2 });
        [-1, 1].forEach(sx => b.box(0.04, 0.14, 0.05, st2, { x: sx * 0.27, y: 0.46 }));
        return b;
      }
      case "wolle":
        b.noise(0.12, m => { for (let i = 0; i < 9; i++) m.ico(0.17 + rnd() * 0.06, i % 2 ? 0xeee3c8 : 0xf6efdc, { x: (i % 3 - 1) * 0.2 + (rnd() - 0.5) * 0.06, y: 0.13 + (i === 4 ? 0.12 : 0), z: (Math.floor(i / 3) - 1) * 0.17, flat: 0.75, jitter: 0.4, bottom: 0xd8c8a4 }); });
        return b;
      case "spaket": case "rpaket": {
        const meat = id === "spaket" ? 0xef9a92 : 0xb3343c, fat = id === "spaket" ? 0xfbe6dc : 0xf2d8d0;
        b.box(0.72, 0.05, 0.5, 0x2a2a30, { top: 0x3a3a42 });
        b.noise(0.08, m => m.box(0.6, 0.12, 0.4, meat, { y: 0.05 }));
        [-0.12, 0.08].forEach(z => b.box(0.58, 0.012, 0.035, fat, { y: 0.17, z, ry: id === "spaket" ? 0 : 0.3 }));
        if (id === "rpaket") [[-0.15, -0.05], [0.1, 0.1], [0.18, -0.1]].forEach(([x, z]) => b.box(0.08, 0.012, 0.02, fat, { x, y: 0.17, z, ry: rnd() * 3 }));
        b.box(0.22, 0.012, 0.16, 0xfaf4e4, { x: 0.18, y: 0.175, z: 0.1 });
        b.box(0.14, 0.013, 0.04, id === "spaket" ? 0xd8332b : 0x2f6fb0, { x: 0.18, y: 0.176, z: 0.12 });
        return b;
      }
      case "hfutter":
        b.cyl(0.28, 0.34, 0.5, 12, 0xa8b0b8, { top: 0x8a929a });
        b.noise(0.2, m => m.cyl(0.33, 0.33, 0.03, 12, 0xe8c060, { y: 0.48 }));
        b.noise(0.2, m => { for (let i = 0; i < 10; i++) m.ico(0.035, 0xd8a840, { x: (rnd() - 0.5) * 0.4, y: 0.52, z: (rnd() - 0.5) * 0.4 }); });
        b.cyl(0.345, 0.345, 0.04, 12, 0x8a929a, { y: 0.46 });
        b.at({ y: 0.5 }, m => { m.box(0.02, 0.02, 0.5, 0x6a6a72, { y: 0.22, rx: 0 }); [-1, 1].forEach(s => m.box(0.02, 0.24, 0.02, 0x6a6a72, { z: s * 0.25, rx: s * 0.4 })); });
        return b;
      case "kfutter":
        b.noise(0.14, m => m.box(0.9, 0.46, 0.5, 0xd2c45a, { top: 0xc4b84a }));
        [-0.2, 0.2].forEach(x => b.box(0.03, 0.47, 0.51, 0xd8332b, { x }));
        b.noise(0.2, m => { for (let i = 0; i < 6; i++) m.box(0.02, 0.1, 0.02, 0xb8a840, { x: (rnd() - 0.5) * 0.8, y: 0.46, z: (rnd() - 0.5) * 0.4, rz: (rnd() - 0.5) }); });
        return b;
      case "sfutter": sack(b, 0xef9a92, { col: 0xc8a06a, dark: 0xb08a58 }); return b;
      case "schfutter": sack(b, 0x5aa83a, { col: 0xe0d0a8, dark: 0xc8b88e }); return b;
      case "brot":
        b.sphere(0.34, 12, 8, 0xc98a3a, { y: 0.17, sy: 0.55, sz: 1.35, bottom: 0xa86a2a, smooth: true });
        [-0.18, 0, 0.18].forEach(z => b.box(0.24, 0.02, 0.05, 0xf0c88a, { y: 0.335, z, ry: 0.5 }));
        return b;
      case "fladen":
        for (let i = 0; i < 4; i++) {
          b.noise(0.08, m => m.cyl(0.36, 0.36, 0.045, 14, 0xe8c070, { x: (rnd() - 0.5) * 0.05, y: i * 0.05, z: (rnd() - 0.5) * 0.05, top: 0xf0d088 }));
        }
        for (let i = 0; i < 6; i++) b.cyl(0.035, 0.035, 0.006, 6, 0xb8803a, { x: Math.cos(i * 1.1) * 0.2, y: 0.2, z: Math.sin(i * 1.1) * 0.2 });
        return b;
      case "apfelkuchen":
        b.box(0.92, 0.1, 0.64, 0x5a5a62, { top: 0x4a4a52 });
        b.box(0.86, 0.1, 0.58, 0xe0b060, { y: 0.03, top: 0xe8c070 });
        for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) b.cyl(0.06, 0.06, 0.02, 6, 0xf2d878, { x: -0.36 + j * 0.145, y: 0.13, z: -0.21 + i * 0.14, sz: 0.5 });
        for (let i = 0; i < 4; i++) b.box(0.86, 0.025, 0.03, 0xc98a3a, { y: 0.15, z: -0.21 + i * 0.14 });
        return b;
      case "muffins":
        b.box(0.72, 0.12, 0.48, 0xf6f1e4, { top: 0xe8e0cc });
        for (let i = 0; i < 6; i++) {
          const x = (i % 3 - 1) * 0.22, z = (Math.floor(i / 3) - 0.5) * 0.22;
          b.cyl(0.08, 0.1, 0.12, 9, 0xf2a531, { x, y: 0.1, z, stripe: 0xe8902a });
          b.sphere(0.1, 9, 6, 0xc98a3a, { x, y: 0.23, z, sy: 0.7, smooth: true });
          b.sphere(0.06, 8, 5, 0xfaf6ee, { x, y: 0.28, z, sy: 0.6, smooth: true });
          b.cone(0.02, 0.06, 5, 0xf2731e, { x, y: 0.31, z, rz: 0.6 });
        }
        return b;
      case "kirschtorte":
        b.cyl(0.46, 0.46, 0.04, 16, 0xe8e8ec);
        b.cyl(0.4, 0.4, 0.12, 16, 0x5a3020, { y: 0.04, smooth: true });
        b.cyl(0.4, 0.4, 0.04, 16, 0xfaf4ee, { y: 0.16, smooth: true });
        b.cyl(0.4, 0.4, 0.1, 16, 0x5a3020, { y: 0.2, smooth: true });
        b.cyl(0.41, 0.41, 0.05, 16, 0xfaf4ee, { y: 0.3, smooth: true });
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.sphere(0.055, 7, 5, 0xfaf4ee, { x: Math.cos(a) * 0.3, y: 0.37, z: Math.sin(a) * 0.3, sy: 0.8 }); b.sphere(0.045, 7, 5, 0xb3132a, { x: Math.cos(a) * 0.3, y: 0.43, z: Math.sin(a) * 0.3, smooth: true }); }
        b.noise(0.2, m => { for (let i = 0; i < 9; i++) m.box(0.04, 0.012, 0.015, 0x3a2014, { x: (rnd() - 0.5) * 0.36, y: 0.355, z: (rnd() - 0.5) * 0.36, ry: rnd() * 3 }); });
        return b;
      case "pizza":
        b.cyl(0.52, 0.52, 0.05, 18, 0xc99a5a, { top: 0xd8a868 });
        b.cyl(0.46, 0.46, 0.05, 16, 0xe8c070, { y: 0.03 });
        b.cyl(0.4, 0.4, 0.03, 16, 0xd8401e, { y: 0.06 });
        b.noise(0.1, m => { for (let i = 0; i < 7; i++) m.cyl(0.11, 0.11, 0.012, 7, 0xf8e08a, { x: Math.cos(i * 0.9) * 0.2, y: 0.085, z: Math.sin(i * 0.9) * 0.22, sx: 1.3 }); });
        for (let i = 0; i < 6; i++) b.cyl(0.07, 0.07, 0.015, 9, 0xa82a2a, { x: Math.cos(i * 1.05 + 0.4) * 0.26, y: 0.095, z: Math.sin(i * 1.05 + 0.4) * 0.26 });
        [[0.05, 0.05], [-0.15, 0.12], [0.12, -0.18]].forEach(([x, z]) => b.box(0.06, 0.012, 0.04, 0x3f8a2a, { x, y: 0.1, z, ry: x * 9 }));
        return b;
      case "butter":
        b.box(0.5, 0.22, 0.28, 0xf8e27a, { top: 0xfbe98e });
        b.box(0.3, 0.235, 0.29, 0xe2b33a, { x: 0.105, top: 0xf2c84a });
        b.box(0.16, 0.1, 0.005, 0x3f78c8, { x: 0.12, y: 0.07, z: 0.147 });
        return b;
      case "pudding":
        b.box(0.66, 0.03, 0.66, 0xe8e0cc);
        for (let i = 0; i < 4; i++) {
          const x = (i % 2 - 0.5) * 0.3, z = (Math.floor(i / 2) - 0.5) * 0.3;
          b.cyl(0.12, 0.14, 0.12, 10, 0xfaf6ee, { x, y: 0.03, z });
          b.cyl(0.13, 0.1, 0.14, 10, 0xf2d060, { x, y: 0.15, z, top: 0xa0521e, smooth: true });
          b.sphere(0.035, 6, 4, 0xb3132a, { x, y: 0.31, z });
        }
        return b;
      case "kaese": {
        b.cyl(0.42, 0.42, 0.28, 18, 0xf2c84a, { top: 0xf6d870, smooth: true });
        b.cyl(0.425, 0.425, 0.02, 18, 0xd8a838, { y: 0.27 });
        /* ein Keil davor */
        const Y = 0xf6d870, h = 0.24;
        b.at({ x: 0.35, z: 0.42, ry: -0.5 }, m => {
          m.tri([0, 0, 0], [0.32, 0, -0.1], [0.32, 0, 0.1], Y); m.tri([0, h, 0], [0.32, h, 0.1], [0.32, h, -0.1], Y);
          m.quad([0, 0, 0], [0, h, 0], [0.32, h, -0.1], [0.32, 0, -0.1], 0xf0c040); m.quad([0, 0, 0], [0.32, 0, 0.1], [0.32, h, 0.1], [0, h, 0], 0xf0c040);
          m.quad([0.32, 0, -0.1], [0.32, h, -0.1], [0.32, h, 0.1], [0.32, 0, 0.1], 0xd8a838);
          [[0.12, 0.08, 0.035], [0.22, 0.16, -0.03]].forEach(([x, y, z]) => m.sphere(0.025, 6, 4, 0xd8a838, { x, y, z: z + 0.012 }));
        });
        [[0.3, 0.1, 0.2], [-0.25, 0.16, 0.3], [0.05, 0.08, 0.41]].forEach(([x, y, z]) => b.sphere(0.035, 6, 4, 0xd8a838, { x, y, z }));
        return b;
      }
      case "bratwurst":
        b.box(0.8, 0.04, 0.5, 0xfaf6ee, { top: 0xe8e0cc });
        for (let i = 0; i < 10; i++) {
          const z = (i % 5 - 2) * 0.09, y = 0.07 + Math.floor(i / 5) * 0.08;
          b.cyl(0.042, 0.042, 0.58, 8, 0xc06a3a, { rz: Math.PI / 2, x: 0.29, y, z, smooth: true });
          [-0.29, 0.29].forEach(x => b.sphere(0.042, 7, 5, 0xb05a32, { x, y, z }));
        }
        return b;
      case "schinken":
        b.box(0.86, 0.05, 0.56, 0xc99a5a, { top: 0xd8a868 });
        b.sphere(0.3, 11, 8, 0xd87070, { y: 0.3, sx: 1.25, sz: 0.95, bottom: 0xb85a5a, smooth: true });
        b.sphere(0.31, 11, 8, 0xa8603a, { x: -0.04, y: 0.33, sx: 1.18, sy: 0.8, sz: 0.9, smooth: true });
        b.cyl(0.05, 0.05, 0.3, 7, 0xf6efe0, { rz: Math.PI / 2, x: 0.6, y: 0.24 });
        b.sphere(0.07, 7, 5, 0xf6efe0, { x: 0.6, y: 0.24 });
        return b;
      case "gulasch":
        b.cyl(0.22, 0.22, 0.42, 14, 0x8a2a1a, { smooth: true });
        b.cyl(0.222, 0.222, 0.2, 14, 0xfaf4e4, { y: 0.11 });
        b.cyl(0.18, 0.2, 0.06, 14, 0x9a3a2a, { y: 0.42 });
        b.cyl(0.21, 0.21, 0.07, 14, 0xd8332b, { y: 0.47, top: 0xfaf4ee });
        b.box(0.14, 0.08, 0.005, 0xa8603a, { y: 0.17, z: 0.223 });
        return b;
      case "garn": {
        const cols = [0xd8332b, 0x3f78c8, 0xf2c230, 0x47b84f, 0xf6f1e4];
        [[-0.22, 0, 0], [0.22, 0, 0.02], [0, 0, 0.24], [-0.05, 0, -0.2], [0, 0.26, 0.02]].forEach(([x, y, z], i) => {
          b.sphere(0.17, 10, 7, cols[i], { x, y: y + 0.17, z, smooth: true });
          for (let k = 0; k < 3; k++) b.cyl(0.175, 0.175, 0.012, 10, mix(cols[i], 0xffffff, 0.3), { x, y: y + 0.17, z, rx: 0.6 + k * 0.5, ry: k });
        });
        return b;
      }
      case "socken":
        [[-0.17, 0, 0], [0.17, 0.12, 0.08]].forEach(([x, ry, y]) => b.at({ x, y, ry }, m => {
          m.box(0.22, 0.1, 0.52, 0xf2ead8, { z: -0.12, top: 0xf8f2e4 });
          m.box(0.22, 0.1, 0.26, 0xf2ead8, { z: 0.22, x: 0.07, ry: 0.55, top: 0xf8f2e4 });
          [-0.33, -0.2, -0.07].forEach((z, k) => m.box(0.225, 0.105, 0.06, k === 1 ? 0x3f78c8 : 0xd8332b, { z }));
          m.box(0.225, 0.105, 0.09, 0xd8332b, { z: 0.3, x: 0.11, ry: 0.55 });
        }));
        return b;
      case "pullover":
        b.box(0.62, 0.12, 0.56, 0x3f78c8, { top: 0x4a88d8 });
        [-0.14, 0.02, 0.18].forEach(z => b.box(0.62, 0.005, 0.04, 0xf6f1e4, { y: 0.122, z }));
        b.cyl(0.11, 0.11, 0.04, 10, 0x2f5f98, { y: 0.11, z: -0.24, sz: 0.6 });
        [-1, 1].forEach(s => b.box(0.12, 0.13, 0.5, 0x3a70b8, { x: s * 0.22, y: 0.0, z: 0.02, top: 0x4580c8 }));
        return b;
    }
    /* v53: Fische und Fischwaren */
    return typeof FFM !== "undefined" && FFM.fishItem ? FFM.fishItem(id) : null;
  }
  /* Werkzeug: Opas Axt, Stahlaxt, Kettensäge, Profi-Säge */
  function tool(id) {
    G3.seed(5300 + id.length);
    const nb = toolNew(id); if (nb) return nb;                       /* v122: Werkzeug neu */
    const b = new MB();
    if (id === "axe1" || id === "axe2") {
      const steel = id === "axe2", L = steel ? 1.25 : 1.0;
      b.at({ rz: -0.55 }, m => {
        m.box(0.07, L, 0.06, steel ? 0xc9955a : 0x8a6040, { y: 0 });
        if (steel) m.box(0.08, 0.22, 0.07, 0xd8332b, { y: 0.02 });
        m.box(0.12, 0.14, 0.08, steel ? 0x6f7a84 : 0x4a4440, { y: L - 0.14 });
        m.cone(0.16, 0.3, 4, steel ? 0xc8d0d8 : 0x6a5a4a, { rz: -Math.PI / 2, x: 0.05, y: L - 0.07, sz: 0.3, a0: Math.PI / 4 });
        if (!steel) m.box(0.05, 0.05, 0.085, 0x8a4a2a, { x: 0.12, y: L - 0.1 });
      });
      return b;
    }
    if (id === "saw1" || id === "saw2") {
      const pro = id === "saw2", body = pro ? 0xf2c230 : 0xf2731e, bar = pro ? 1.2 : 0.85;
      b.box(0.4, 0.36, 0.62, body, { y: 0.0, top: pro ? 0xe2b020 : 0xe2631e });
      b.box(0.34, 0.14, 0.46, 0x2a2a30, { y: 0.36, z: -0.04 });
      b.box(0.08, 0.2, 0.34, 0x2a2a30, { y: 0.5, z: -0.12 });                          /* Griff oben */
      b.box(0.44, 0.07, 0.07, 0x2a2a30, { y: 0.46, z: 0.22 });                          /* Bügel vorn */
      [-1, 1].forEach(s => b.box(0.07, 0.4, 0.07, 0x2a2a30, { x: s * 0.2, y: 0.1, z: 0.22 }));
      b.box(0.05, 0.18, bar, 0xd0d6dc, { y: 0.1, z: 0.31 + bar / 2 });                   /* Schwert */
      b.box(0.07, 0.035, bar, 0x2a2a30, { y: 0.27, z: 0.31 + bar / 2 });                 /* Kette oben */
      b.box(0.07, 0.035, bar, 0x2a2a30, { y: 0.07, z: 0.31 + bar / 2 });                 /* Kette unten */
      b.cyl(0.09, 0.09, 0.07, 10, 0x2a2a30, { rz: Math.PI / 2, x: -0.035, y: 0.19, z: 0.31 + bar });
      if (pro) b.box(0.42, 0.06, 0.2, 0x2a2a30, { y: 0.2, z: -0.24 });
      return b;
    }
    if (id === "sickle") {
      /* Sichel: Holzgriff und gebogene Klinge */
      b.at({ rz: -0.5 }, m => {
        m.cyl(0.05, 0.045, 0.5, 8, 0x9a6a3a, { y: -0.5 });
        m.cyl(0.055, 0.055, 0.04, 8, 0x6a4a2a, { y: 0.0 });
        for (let i = 0; i < 9; i++) {
          const a0 = Math.PI * 0.05 + i / 9 * Math.PI * 0.95, a1 = Math.PI * 0.05 + (i + 1) / 9 * Math.PI * 0.95, r = 0.36;
          const x0 = Math.cos(a0) * r - r, y0 = Math.sin(a0) * r + 0.04, x1 = Math.cos(a1) * r - r, y1 = Math.sin(a1) * r + 0.04;
          const len = Math.hypot(x1 - x0, y1 - y0) + 0.01, w = 0.09 * (1 - i / 11);
          m.box(len, w, 0.025, 0xc8d0d8, { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - w / 2, rz: Math.atan2(y1 - y0, x1 - x0), top: 0xe6eef2 });
        }
      });
      return b;
    }
    if (id === "water") {
      /* Gießkanne mit Brause */
      b.cyl(0.26, 0.28, 0.5, 14, 0x3f9a5a, { smooth: true, top: 0x2f7a46 });
      b.cyl(0.27, 0.27, 0.05, 14, 0x2f7a46, { y: 0.45 });
      b.cyl(0.04, 0.05, 0.62, 8, 0x3f9a5a, { x: 0.22, y: 0.12, rz: -0.95 });
      b.cyl(0.07, 0.11, 0.07, 10, 0xd8b84a, { x: 0.5, y: 0.47, rz: -0.95 });
      b.at({ y: 0.5 }, m => { m.box(0.05, 0.3, 0.05, 0x2f7a46, { x: -0.22 }); m.box(0.05, 0.05, 0.05, 0x2f7a46, { x: -0.15, y: 0.3 }); m.box(0.3, 0.05, 0.05, 0x2f7a46, { x: -0.08, y: 0.3, rz: -0.2 }); });
      return b;
    }
    return null;
  }
  /* Ladung beim Beladen: Kiste, Sack, Korb */
  function cargo(k) {
    G3.seed(5400 + k);
    const b = new MB();
    if (k === 1) { b.sphere(0.17, 8, 6, 0xd8c49a, { y: 0.17, sy: 1.1 }); b.cyl(0.05, 0.08, 0.08, 6, 0xd8c49a, { y: 0.34 }); b.box(0.12, 0.02, 0.02, 0x8a6040, { y: 0.35 }); }
    else if (k === 2) { b.cyl(0.17, 0.14, 0.2, 10, 0xb8884a, { top: 0x8a6040 }); for (let i = 0; i < 5; i++) b.sphere(0.06, 6, 4, [0xd8332b, 0xf2a531, 0x7ac043][i % 3], { x: Math.cos(i * 1.3) * 0.08, y: 0.22, z: Math.sin(i * 1.3) * 0.08 }); }
    else { b.box(0.32, 0.24, 0.28, 0xc9955a, { top: 0xb8884a }); b.box(0.34, 0.03, 0.3, 0xa8753e, { y: 0.1 }); }
    return b;
  }

  return {
    _wk: { lumber: o => lumber(new MB(), o), logPiece: o => logPiece(new MB(), o), splitPiece: o => splitPiece(new MB(), o), WOOD_IDS: ["birke", "kiefer", "buche", "eiche", "edelholz", "aeste", "reste", "brennholz", "kaminholz", "pfosten", "bretter", "balken", "platten", "kisten", "paletten", "dielen", "bauholz", "bohlen", "moebel", "tueren", "zaun", "schatulle"] },
    traderCart, solarVan, item, tool, cargo,
    TREE_C, TH, TREE_H, tree, treeRv, leafClump, bgTree, stump, sapling, fallen, logPile, fern, mushrooms, deadLog, boulder, bush, BUSH_ORDER, grassTuft, bgPine, bgLeaf, bgBirch, hofGround, hofPath, hofFence,
    terrain, ribbon, smoothLine, forestPath, YARD_COL, wayRaw, wayStraightAt, fillet, creekBank, creekWater, springBed, springPool, springRocks, bridge, pier, lootCrate, lootLid, goldChest, goldLid, lootBeam, lootRing, barrier,
    lakeShore, lakeWater, lakeFoam, lakeReeds, reedPatch, lilyPads,
    sawHall, SAW_BLADE, sawBlades, sawLager, sawBuero, sawLkw, holzTruck, palletLoad, decoWeg, kessel, KESSEL_CHIMNEY, machine, saegebock, yard,
    junk, stall, stallGoods, tractor, trailer, machineHall, stoneWall, stoneGate,
    fPlot, lakeSteg, fHuette, fBoot, fLager, fMarkt, rowboat, motorboat,
    deer, hare, boar, fox, squirrel, bird, birdWing, owl, owlWing, bat, batWing, hedgehog, heron, dog, cat, goat, person, head, arm, armSit, cosDeco
  };
})();
