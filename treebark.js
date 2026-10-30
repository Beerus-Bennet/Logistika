/* =========================================================================
   LOGISTIKA – treebark.js  (v152)
   Gemeinsames Rinden- und Stammsystem aller Waldbäume. Vorher hatte die Ich-Perspektive (fpsaw.js) einen eigenen,
   fein gestalteten Stamm und die Hof-/Waldansicht (woodmodels.js tree()) ein schlichtes 7-Eck-Rohr mit aufgesetzten
   Klötzchen – beim Wechsel der Ansicht sah der Baum wie ein anderer aus. Jetzt bauen alle Ansichten den Stamm hier:
     barkStyle(sp, sz, sc, ts, ex)   Rindenzeichnung je Art: Farbe je Höhe/Facette, Teilungshöhen, Markierungen, Relief, Verjüngung
     plainTrunk(bark, hU, sty, o)    Stamm (Einheitsradius 1, Höhe hU) – o.M Facetten (28 fein, 14 grob), o.marks = Markierungen als Auflage
     trunk(sp, sz, v, tp, o)         fertiger Stamm im Modellmaß des Baums (Hof-/Waldansicht, beide Detailstufen)
     seedOf(sp, sz, v)               gemeinsamer Samen – Relief und Markierungen sind in allen Ansichten dieselben
     emitBark, taperB, splitF, mixC, reliefOf, NSEC – für Kerb und Stumpf in fpsaw.js
   Detailstufen (ex.lod): 0 = Ich-Perspektive (Markierungen als exakt geschnittene Rindenflächen, nötig für den Kerb),
   1 = nah in der Hof-/Waldansicht (gleiche Zeichnung, Markierungen als anliegende Auflage), 2 = fern (14 Facetten,
   gröbere Bänder, nur die großen Markierungen). Alle Stufen haben dieselbe Silhouette (gleiches Relief an denselben Kanten).
   Eigene Engine (gl3d.js, G3.MB) – kein Three.js.
   ========================================================================= */
const TBARK = (() => {
  "use strict";
  const TC_ = () => (typeof FWM !== "undefined" && FWM.TREE_C) || {};
  const TH_ = [0, 1.0, 1.55, 2.15, 3.0];
  /* v128: 28 Sektoren und echtes Relief der Borke (Rippen/Furchen, Wurzelanlauf). Relief: Radiusfaktor je Winkel (und Höhe);
     er wirkt über taperB auf alle Punkte (Rinde, Kerbflächen, Stumpf), daher bleibt alles dicht.
     v152: [Rippen, Wurzelanlauf, Rippen oben, Übergangshöhe/k] – Kiefer und Birke sind unten rau und oben glatt. */
  const NSEC = 28;
  const RELIEF = { eiche: [0.075, 0.16], kiefer: [0.055, 0.07, 0.014, 1.1], fichte: [0.03, 0.08], buche: [0.008, 0.2], birke: [0.016, 0.05, 0.006, 0.45], kirsche: [0.018, 0.06] };
  const hs = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const wrapD = d => { d = Math.abs(d) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
  const wrap = f => ((f % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  function mixC(c1, c2, k) { const r = (c1 >> 16) & 255, g = (c1 >> 8) & 255, bl = c1 & 255, r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255; return ((Math.round(r + (r2 - r) * k) << 16) | (Math.round(g + (g2 - g) * k) << 8) | Math.round(bl + (b2 - bl) * k)); }
  function reliefOf(sp, seed, k) {
    const R0 = RELIEF[sp]; if (!R0) return null;
    const [amp, fl, aTop, hT] = R0, s = (seed || 0) * 3.7, kk = k || 1;
    const g = th => 0.5 * Math.sin(7 * th + s) + 0.3 * Math.sin(13 * th + 2.1 * s + 1) + 0.2 * Math.sin(19 * th + 0.7 * s + 2);   /* −1…1 */
    const aY = aTop == null ? () => amp : yU => aTop + (amp - aTop) * (1 - sstep(hT * kk * 0.75, hT * kk * 1.35, yU));
    return { g, f: (th, yU) => 1 + aY(yU) * g(th) + fl * Math.exp(-Math.max(0, yU) / 0.35) * (0.6 + 0.4 * Math.max(0, Math.sin(5 * th + s))) };
  }
  /* gemeinsamer Samen je Art/Größe/Variante (die Hofansicht baut je Variante ein Modell, alle Ansichten nehmen denselben) */
  const seedOf = (sp, sz, v) => ((v || 0) * 1.37 + (sz || 1) * 0.53 + (sp || "").length * 0.29) % 7;

  /* Rindenzeichnung je Art. Innen arbeitet alles im Modellmaß des Baums (y wie in tree(), k = Größenfaktor);
     bf(y in Einheiten, Winkel) → Farbe; bp = Teilungshöhen (Einheiten) – dort wechselt die Farbe mit gerader Kante.
     marks: Querstriche, Narben, Augen (Birke, Buche) – lod 0 schneidet sie als Rindenflächen (cf/blobs), sonst Auflage. */
  function barkStyle(sp, sz, sc, ts, ex) {
    const T = TC_()[sp];
    if (!T) return null;
    ts = ts || 1; ex = ex || {};
    const lod = ex.lod || 0, far = lod >= 2, k = TH_[sz || 1] || 1, sd = ex.seed || 0;
    const hTr = ex.tp ? ex.tp[2] : 2.27 * k, R0 = ex.tp ? ex.tp[0] : 0.1;
    const bp = [], marks = [];
    let bf = null, lat = null;
    const gOf = f => Math.floor(wrap(f) / (2 * Math.PI / NSEC)) % NSEC;
    if (sp === "birke") {
      /* Fuß dunkel und rissig, der Übergang zur weißen Rinde ist zackig (vier Höhen, je Facette eine); oben cremeweiß mit
         zarten Bändern in gebrochenen Weiß-/Grautönen (nie reinweiß, nie dunkle Seiten) */
      const hb = 0.363 * k, J = [0.72, 0.88, 1.05, 1.24].map(f => f * hb), jag = g => J[Math.floor(hs(g * 1.31 + sd, 5.7) * 3.999)];
      J.forEach(v => bp.push(v));
      const rb = hb * 0.34; if (!far) bp.push(rb, rb * 2);
      const rw = (far ? 0.62 : 0.26) * k;
      for (let y = J[3] + rw; y < hTr - 0.02; y += rw) bp.push(y);
      const WH = [0xf1ede2, 0xebe6d8, 0xf5f2e9, 0xe3ded0], BS = [T.base, 0x34312c, 0x5e5951, 0x8a857b];
      bf = (y, g) => {
        const jb = jag(g);
        if (y < jb) {
          const row = Math.floor(y / rb), q = hs(g * 2.3 + row * 1.7 + sd, row + 3.1);
          if (q < 0.34) return BS[1];                                   /* tiefe Risse */
          if (y > jb - rb * 1.05 && q > 0.72) return BS[3];             /* helle Inseln am Übergang */
          return q < 0.7 ? BS[0] : BS[2];
        }
        const row = Math.floor((y - J[3]) / rw), q = hs(g * 0.71 + row * 3.3 + sd, row * 0.37 + 1.9);
        return WH[Math.floor(q * q * 3.999)];
      };
      /* Querstriche wie bei echter Birkenrinde: lange, spitz auslaufende Bänder um den Stamm, kurze Striche, oben dichter;
         unter jedem Ast eine dunkle, nach unten offene Astnarbe („Chinesenbart“). Je Variante andere Lage (Samen). */
      /* drei Formen: lange, spitz auslaufende Bänder (halb um den Stamm), kurze Striche, und im unteren Drittel einzelne breite,
         unregelmäßige Flecken; dichter zum Fuß hin, jede Form mit etwas Schieflage (sk) – kein gleichmäßiges Punktmuster */
      const rows = 10 + 3 * (sz || 1);
      for (let i = 0; i < rows; i++) {
        const yr = J[3] + 0.04 * k + (hTr * 0.92 - J[3]) * Math.pow((i + 0.2 + 0.6 * hs(i * 1.37 + sd, 3.1)) / rows, 1.2), nm = 1 + Math.floor(hs(i + sd, 2.3) * 2.6);
        for (let j = 0; j < nm; j++) {
          const f = 2 * Math.PI * hs(i * 2.11 + j * 5.3 + sd, 7.7), q = hs(i + j * 7.1 + sd, 4.4), q2 = hs(i * 3.3 + j + sd, 1.9), q3 = hs(i + j * 2.7 + sd, 5.3);
          const low = yr < hTr * 0.55, kind = q < 0.5 ? 0 : q < (low ? 0.86 : 0.97) ? 1 : 2;
          const hy = (kind === 0 ? 0.008 + 0.01 * q2 : kind === 1 ? 0.006 + 0.005 * q2 : 0.018 + 0.012 * q2) * (0.8 + 0.2 * k);
          const wf = kind === 0 ? 0.5 + 0.7 * q3 : kind === 1 ? 0.14 + 0.18 * q3 : 0.22 + 0.24 * q3, y = yr + (hs(i + j, sd + 9.1) - 0.5) * 0.05;
          if (y > J[3] + hy) marks.push({ y, f, hy, wf, big: kind !== 1 || q2 > 0.6, sk: (hs(i * 0.7 + j, sd + 1.3) - 0.5) * (kind === 2 ? 1.1 : 0.7) });
        }
      }
      if (!far) for (let i = 0; i < 10 + 6 * (sz || 1); i++) {      /* Lentizellen: kurze, feine Striche */
        const y = J[3] + (hTr - J[3]) * (0.05 + 0.92 * hs(i * 1.9 + sd, 8.3)), f = 2 * Math.PI * hs(i * 4.7 + sd, 2.9);
        marks.push({ y, f, hy: 0.0035 + 0.003 * hs(i, sd + 4.1), wf: 0.07 + 0.09 * hs(i * 1.3, sd + 2.2), tiny: true });
      }
      (ex.scars || []).forEach(([y, f], i) => { if (y > J[3] + 0.05 && y < hTr) marks.push({ y: y - 0.01 * k, f, hy: 0.011 * k, wf: 0.5 + 0.15 * hs(i, sd), hc: 0.07 * k + 0.6 * R0, chev: true, big: true }); });
      lat = { ly: 0.006, la: 0.008 / R0, cy0: J[0] };
    } else if (sp === "kiefer") {
      /* unten graubraune, dicke Schuppenborke mit dunklen Furchen (starkes Relief), zackig übergehend in die fuchsrote, glatte
         Spiegelrinde, die in dünnen Plättchen leicht heller/dunkler wechselt */
      const hb = 1.08 * k, J = [0.8, 0.94, 1.08, 1.24].map(f => f * hb), jag = g => J[Math.floor(hs(g * 1.7 + sd, 2.9) * 3.999)];
      J.forEach(v => bp.push(v));
      const rl = (far ? 0.45 : 0.12) * k, ru = (far ? 0.9 : 0.24) * k;
      for (let y = rl; y < J[0] - 0.01; y += rl) bp.push(y);
      for (let y = J[3] + ru; y < hTr - 0.02; y += ru) bp.push(y);
      const RL = reliefOf("kiefer", sd, k), PL = [T.base, 0x7d6553, 0x62503f, 0x86705c], UP = [T.bark, 0xd2804a, 0xbd6a3a, 0xd98f57];
      bf = (y, g) => {
        const th = (g + 0.5) * 2 * Math.PI / NSEC, rv = RL ? RL.g(th) : 0, jb = jag(g);
        if (y < jb) {
          const row = Math.floor(y / rl), q = hs(g * 1.9 + row * 0.61 + sd, row + 0.3);
          if (rv < -0.3) return 0x45342a;                                                  /* Furche */
          const c = PL[Math.floor(q * 3.999)];
          return y > jb - rl && hs(g * 0.37 + sd, row) > 0.45 ? mixC(c, T.bark, 0.2 + 0.35 * q) : c;   /* Übergang: einzelne erste rote Schuppen */
        }
        const row = Math.floor((y - J[3]) / ru), q = hs(g * 0.83 + row * 2.9 + sd, row * 0.41 + 0.7);
        return UP[Math.floor(q * q * 3.999)];
      };
    } else if (sp === "eiche") {
      /* v128: tief gefurchte Borke – Rippen hell und in Platten gebrochen, Furchen dunkel, unten moosig-dunkler Fuß */
      const rh = (far ? 0.2 : 0.075) * k, nR = Math.ceil(2.6 * k / rh), RL = reliefOf("eiche", sd, k), light = 0x76604c, moss = 0x4f5a34;
      for (let i = 1; i < nR; i++) bp.push(i * rh);
      bf = (y, g) => {
        const th = (g + 0.5) * 2 * Math.PI / NSEC, rv = RL ? RL.g(th) : 0, row = Math.floor(y / (0.075 * k)), hh = hs(g * 1.7 + row * 0.37 + sd, row + g * 0.11);
        if (rv < -0.25) return hh < 0.5 ? T.mark : 0x342519;                           /* Furche */
        const base = mixC(T.bark, light, Math.max(0, rv) * 0.7 * (0.55 + 0.45 * hh));   /* Rippe, Platten mit wechselnder Helligkeit */
        if (y < 0.18 * k && g % 3 !== 0) return mixC(base, moss, 0.45 * (1 - y / (0.18 * k)));
        return hh < 0.12 ? T.mark : base;
      };
    } else if (sp === "buche") {
      /* glatt und silbergrau, ganz leicht gefleckt (heller/dunkler, an der Wetterseite ein Hauch Grünalgen), dazu einzelne
         dunkle „Buchenaugen“ (Narben abgeworfener Äste) */
      const rr = (far ? 0.45 : 0.2) * k;
      for (let y = rr; y < hTr - 0.02; y += rr) bp.push(y);
      const GR = [T.bark, 0x938c7f, 0x7a7468, 0x8a8b7c], ALG = 0x8f9a7c, ws = hs(sd, 6.1) * 2 * Math.PI;
      bf = (y, g) => {
        const row = Math.floor(y / rr), q = hs(g * 1.3 + row * 2.1 + sd, row * 0.7 + 4.4), th = (g + 0.5) * 2 * Math.PI / NSEC;
        let c = GR[Math.floor(q * 3.999)];
        if (wrapD(th - ws) < 0.9 && y < hTr * 0.7) c = mixC(c, ALG, 0.28 * (1 - wrapD(th - ws) / 0.9) * (1 - y / (hTr * 0.7)));
        return c;
      };
      const ne = 2 + Math.floor(hs(sd, 1.1) * 3);
      for (let i = 0; i < ne; i++) marks.push({ y: hTr * (0.3 + 0.55 * hs(i * 3.1 + sd, 7.3)), f: 2 * Math.PI * hs(i * 5.7 + sd, 3.3), hy: 0.012 * k, wf: 0.28 + 0.12 * hs(i, sd), hc: 0.05 * k + 0.3 * R0, chev: true, big: true, col: 0x5f5e58 });
      (ex.scars || []).forEach(([y, f]) => { if (y < hTr * 0.95) marks.push({ y: y - 0.02 * k, f, hy: 0.014 * k, wf: 0.4, hc: 0.06 * k + 0.4 * R0, chev: true, big: true, col: 0x5f5e58 }); });
    } else if (sp === "fichte") {
      /* graubraune, kleinschuppige Rinde: kurze Platten in leicht wechselnden Tönen */
      const rr = (far ? 0.16 : 0.06) * k;
      for (let y = rr; y < hTr - 0.01; y += rr) bp.push(y);
      const SC = [T.bark, 0x6a4b39, 0x523a2c, 0x765644];
      bf = (y, g) => { const row = Math.floor(y / rr), q = hs(g * 1.1 + row * 1.7 + sd, row + 2.2); return SC[Math.floor(q * q * 3.999)]; };
    } else if (sp === "kirsche") {
      /* rotbraun, glänzend; waagrechte Lentizellen-Bänder, die nicht ganz geschlossen um den Stamm laufen; dazwischen breite,
         leicht hellere Ringelborke-Streifen */
      const n = 4 + (sz || 1), step = 0.8 * k / n;
      for (let i = 0; i < n; i++) bp.push(0.15 + i * step, 0.18 + i * step);
      const RB = [T.bark, 0x763d36, 0x62302b, 0x7d4239];
      bf = (y, g) => {
        const m = (y - 0.15) / step, kk = Math.floor(m);
        if (m >= 0 && kk < n && (m - kk) * step < 0.03 && hs(g * 0.9 + kk * 3.7 + sd, 1.3) > 0.22) return T.mark;
        const q = hs(Math.floor(g / 2) * 1.3 + kk * 2.3 + sd, kk + 5.1);
        return RB[Math.floor(q * q * 3.999)];
      };
    }
    if (!bf) bf = () => T.bark;
    /* Verjüngung (und Neigung) wie am Spielbaum: Stamm unten r0, oben r1 auf der Höhe h (Modellmaß, vor der Baumgröße ts) */
    let tp = null;
    const mt = ex.tp;
    if (mt) {
      const hU = mt[2] * ts / sc, rho = mt[1] / mt[0];
      tp = { hU, f: yU => 1 - (1 - rho) * Math.min(1, Math.max(0, yU) / hU), lx: ex.lx || 0, lz: ex.lz || 0 };
    }
    const ysn = v => v * ts / sc;
    const RL = reliefOf(sp, sd, k), rel = RL ? (th, yu) => RL.f(th, yu * sc / ts) : null;
    /* Markierungen: Form (Querstrich mit spitzen Enden oder nach unten offene Narbe) */
    /* fern: nur die großen Markierungen (je Baum höchstens acht Bänder plus Narben) – aus der Entfernung reicht das Muster */
    const big = far ? marks.filter(o => o.chev).concat(marks.filter(o => o.big && !o.chev && !o.tiny).sort((a, c) => c.wf * c.hy - a.wf * a.hy).slice(0, 8)) : marks;
    const cover = (o, ym, f) => {
      const us = (((f - o.f) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI, u = Math.abs(us) / o.wf; if (u >= 1) return 0;
      if (o.chev) { const yc = o.y - o.hc * u, e = o.hy * (1 - 0.45 * u); return e > 0 ? 1 - Math.abs(ym - yc) / e : 0; }
      const e = o.hy * (1 - u * u) * (1 + (o.sk || 0) * us / o.wf); return e > 0 ? 1 - Math.abs(ym - o.y) / e : 0;
    };
    const bfU = (yu, f) => bf(yu * sc / ts, gOf(f));
    let cf = null, blobs = null, ycuts = null;
    if (lod === 0 && big.length && lat) {
      /* Ich-Perspektive: Markierungen als Rindenflächen (der Kerb schneidet durch) – wie v85, plus Narben */
      cf = (yu, f) => {
        const ym = yu * sc / ts;
        let m = 0, mc = T.mark;
        for (const o of big) { const v = cover(o, ym, f); if (v > m) { m = v; mc = o.col || T.mark; } }
        const base = bfU(yu, f);
        return m <= 0 ? base : mixC(base, mc, Math.min(1, m * 3));
      };
      blobs = big.map(o => ({ y0: ysn(o.y - o.hy - (o.chev ? o.hc : 0)), y1: ysn(o.y + o.hy), f: o.f, df: o.wf }));
      const ly = ysn(lat.ly);
      ycuts = [...new Set(blobs.flatMap(o => [Math.floor(o.y0 / ly) * ly, Math.ceil(o.y1 / ly) * ly]))].sort((x, y) => x - y);
    }
    return { sp, lod, fc: sp === "eiche" && lod < 2, la0: 2 * Math.PI / NSEC, tp, rel,
      cy0: cf ? ysn(lat.cy0) : 1e9, cf, ly: lat ? ysn(lat.ly) : 1, la: lat ? lat.la : 1, blobs, ycuts,
      marks: lod > 0 ? big.map(o => ({ y: ysn(o.y), hy: ysn(o.hy), hc: o.chev ? ysn(o.hc) : 0, f: o.f, wf: o.wf, chev: !!o.chev, col: o.col || T.mark, tiny: !!o.tiny, sk: o.sk || 0 })) : [],
      bf: bfU, bp: bp.map(v => v * ts / sc).sort((a, b) => a - b), mark: T.mark };
  }
  /* Vieleck an einer Ebene teilen (f(P) = 0): [Seite f ≤ 0, Seite f ≥ 0] (Sutherland–Hodgman) */
  function splitF(poly, f) {
    const lo = [], hi = [], n = poly.length;
    for (let i = 0; i < n; i++) {
      const A = poly[i], B = poly[(i + 1) % n], da = f(A), db = f(B);
      if (da <= 0) lo.push(A); if (da >= 0) hi.push(A);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db), P = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; lo.push(P); hi.push(P); }
    }
    return [lo, hi];
  }
  /* Eine Rindenfläche (Dreieck a,p,c) ausgeben: an den Farbgrenzen der Art sauber geschnitten (gerade Kante statt Zacken).
     Fleckenbereiche (lod 0) werden an einem festen Gitter (Höhe × Winkel) geschnitten und mit Farbe je Ecke ausgegeben – das Gitter hängt nicht
     von der Form des Kerb-Meshs ab, die Flecken stehen deshalb beim Sägen still. out = grob nach außen zeigender Vektor (Windung). */
  function emitBark(b, a, p, c, out, sty, bark) {
    const put = (x, y, z, cx, cy, cz) => {
      const u = [y[0] - x[0], y[1] - x[1], y[2] - x[2]], v = [z[0] - x[0], z[1] - x[1], z[2] - x[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * n[0] + n[1] * n[1] + n[2] * n[2] < 1e-14) return;
      const flip = n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0;
      if (cx === cy && cy === cz) { if (flip) b.tri(x, z, y, cx); else b.tri(x, y, z, cx); }
      else if (flip) b.triV(x, z, y, cx, cz, cy); else b.triV(x, y, z, cx, cy, cz);
    };
    const ang = P => Math.atan2(P[0], P[2]);
    const cen = pc => { const m = [0, 0, 0]; pc.forEach(q => { m[0] += q[0] / pc.length; m[1] += q[1] / pc.length; m[2] += q[2] / pc.length; }); return m; };
    const flat = pc => { const m = cen(pc), col = sty ? sty.bf(m[1], ang(m)) : bark; for (let i = 1; i + 1 < pc.length; i++) put(pc[0], pc[i], pc[i + 1], col, col, col); };
    const grad = pc => { for (let i = 1; i + 1 < pc.length; i++) { const A = pc[0], B = pc[i], C = pc[i + 1]; put(A, B, C, sty.cf(A[1], ang(A)), sty.cf(B[1], ang(B)), sty.cf(C[1], ang(C))); } };
    const cutBy = (pieces, f0) => { const nx = []; pieces.forEach(pc => { const r = f0(pc); r.forEach(h => { if (h.length >= 3) nx.push(h); }); }); return nx; };
    const yext = pc => pc.reduce((m, q) => [Math.min(m[0], q[1]), Math.max(m[1], q[1])], [1e9, -1e9]);
    let pieces = [[a, p, c]];
    if (sty) sty.bp.forEach(v => { pieces = cutBy(pieces, pc => { const [lo, hi] = yext(pc); return v <= lo + 1e-6 || v >= hi - 1e-6 ? [pc] : splitF(pc, P => P[1] - v); }); });
    /* v151: Farbe hängt an der Facette (bf nimmt den Schwerpunktwinkel) – Flächen deshalb auch an den Facettengrenzen schneiden, sonst entstehen dunkle Zacken */
    if (sty && sty.fc && sty.la0) {
      const la = sty.la0;
      pieces = cutBy(pieces, pc => {
        const m = cen(pc), sf = ang(m), se = pc.reduce((e, q) => Math.max(e, wrapD(ang(q) - sf)), 0);
        if (se > 1.2 || se < 1e-6) return [pc];
        let out = [], r2 = pc;
        for (let k = Math.ceil((sf - se) / la); k * la < sf + se; k++) {
          const al = k * la, ca = Math.cos(al), sa = Math.sin(al), [lo, hi] = splitF(r2, P => P[0] * ca - P[2] * sa);
          if (lo.length >= 3) out.push(lo); r2 = hi; if (r2.length < 3) break;
        }
        if (r2.length >= 3) out.push(r2);
        return out;
      });
    }
    if (!(sty && sty.blobs)) { pieces.forEach(flat); return; }
    pieces.forEach(pc => {
      const m0 = cen(pc);
      if (m0[1] < sty.cy0) { flat(pc); return; }
      /* in Bänder an den Fleckengrenzen teilen, damit nur wirklich betroffene Bereiche fein werden */
      let bands = [pc];
      sty.ycuts.forEach(v => { bands = cutBy(bands, q => { const [lo, hi] = yext(q); return v <= lo + 1e-6 || v >= hi - 1e-6 ? [q] : splitF(q, P => P[1] - v); }); });
      bands.forEach(bd => {
        const m = cen(bd), fm = ang(m), ext = bd.reduce((e, q) => Math.max(e, wrapD(ang(q) - fm)), 0), [y0, y1] = yext(bd);
        if (!sty.blobs.some(o => y1 > o.y0 && y0 < o.y1 && wrapD(fm - o.f) < ext + o.df)) { flat(bd); return; }
        let strips = [], rest = bd;
        for (let k = Math.floor(y0 / sty.ly) + 1; k * sty.ly < y1 - 1e-9; k++) { const v = k * sty.ly, [lo, hi] = splitF(rest, P => P[1] - v); if (lo.length >= 3) strips.push(lo); rest = hi; if (rest.length < 3) break; }
        if (rest.length >= 3) strips.push(rest);
        strips.forEach(st => {
          const sm = cen(st), sf = ang(sm), se = st.reduce((e, q) => Math.max(e, wrapD(ang(q) - sf)), 0);
          let cells = [], r2 = st;
          for (let k = Math.ceil((sf - se) / sty.la); k * sty.la < sf + se; k++) {
            const al = k * sty.la, ca = Math.cos(al), sa = Math.sin(al), [lo, hi] = splitF(r2, P => P[0] * ca - P[2] * sa);
            if (lo.length >= 3) cells.push(lo); r2 = hi; if (r2.length < 3) break;
          }
          if (r2.length >= 3) cells.push(r2);
          cells.forEach(grad);
        });
      });
    });
  }
  /* Verjüngung/Neigung: alle Dreiecke laufen durch diese Abbildung (Normalen entstehen danach im MB) */
  function mapper(sty) {
    const tp = sty && sty.tp, rl = sty && sty.rel;
    if (!tp && !rl) return null;
    const LA = 2 * Math.PI / NSEC;
    return p => {
      let f = tp ? tp.f(p[1]) : 1, x = p[0], z = p[2];
      if (rl && (x * x + z * z) > 1e-10) {
        /* v151: Relief nur an den Facettenkanten auswerten und dazwischen linear mischen – Schnittpunkte in der Facettenmitte
           (Höhenteilung, Kerb) bekamen sonst einen anderen Wert als die Fläche dort hat → Sägezahn-Dreiecke an Eichen */
        const th0 = Math.floor(Math.atan2(x, z) / LA) * LA, th1 = th0 + LA, s0 = Math.sin(th0), c0 = Math.cos(th0), s1 = Math.sin(th1), c1 = Math.cos(th1);
        const det = s0 * c1 - s1 * c0, ka = (x * c1 - z * s1) / det, kb = (s0 * z - c0 * x) / det, f0 = rl(th0, p[1]), f1 = rl(th1, p[1]);
        x = ka * f0 * s0 + kb * f1 * s1; z = ka * f0 * c0 + kb * f1 * c1;
      }
      return [x * f + (tp ? tp.lx * p[1] : 0), p[1], z * f + (tp ? tp.lz * p[1] : 0)];
    };
  }
  function taperB(b, sty) {
    const P = mapper(sty);
    if (!P) return b;
    return { tri: (a, p, c, col) => b.tri(P(a), P(p), P(c), col), triV: (a, p, c, ca, cp, cc) => b.triV(P(a), P(p), P(c), ca, cp, cc), raw: b };
  }
  /* Markierungen als dünne Auflage auf den Stammfacetten (Hof-/Waldansicht): Punkte liegen auf der Facettenebene (gleiche Abbildung
     wie der Stamm) und 1,5 % darüber, an jeder Facettenkante geknickt – so liegen sie überall an, ohne zu flimmern oder zu schweben. */
  function markStrips(b0, sty, M, hU) {
    const P = mapper(sty) || (p => p), D = 2 * Math.PI / M, EPS = 0.015;
    const surf = (th, y) => {
      const t0 = wrap(th), i = Math.floor(t0 / D) % M, a0 = i * D, a1 = a0 + D;
      const s = Math.sin(t0 - a0), s2 = Math.sin(a1 - t0), t = s / ((s + s2) || 1);
      const A = P([Math.sin(a0), y, Math.cos(a0)]), B = P([Math.sin(a1), y, Math.cos(a1)]);
      const p = [A[0] + (B[0] - A[0]) * t, y, A[2] + (B[2] - A[2]) * t], ax = sty && sty.tp ? [sty.tp.lx * y, sty.tp.lz * y] : [0, 0];
      return [ax[0] + (p[0] - ax[0]) * (1 + EPS), y, ax[1] + (p[2] - ax[1]) * (1 + EPS)];
    };
    const face = (A, B, C, col, th) => {
      const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * Math.sin(th) + n[2] * Math.cos(th) < 0) b0.tri(A, C, B, col); else b0.tri(A, B, C, col);
    };
    for (const o of sty.marks) {
      if (o.y - o.hy - o.hc < 0.02 || o.y + o.hy > hU - 0.02) continue;
      /* Stützwinkel: gleichmäßig über die Breite (mind. 6 Stücke) plus jede Facettenkante dazwischen */
      const lo = o.f - o.wf, hi = o.f + o.wf, A = [];
      const ns = o.tiny ? 2 : Math.max(5, Math.ceil(1.2 * o.wf / D));
      for (let q = 0; q <= ns; q++) A.push(lo + (hi - lo) * q / ns);
      for (let k = Math.ceil(lo / D); k * D < hi; k++) A.push(k * D + 1e-5);
      A.sort((x, y) => x - y);
      const prof = th => {
        const us = Math.max(-1, Math.min(1, (th - o.f) / o.wf)), u = Math.abs(us);
        if (o.chev) { const yc = o.y - o.hc * u, e = o.hy * (1 - 0.45 * u); return [yc - e, yc + e]; }
        const e = o.hy * (1 - u * u) * (1 + o.sk * us) + o.hy * 0.08; return [o.y - e, o.y + e];
      };
      for (let q = 0; q + 1 < A.length; q++) {
        const ta = A[q], tb = A[q + 1]; if (tb - ta < 1e-6) continue;
        const [a0, a1] = prof(ta), [b1, b2] = prof(tb), tm = (ta + tb) / 2;
        const p00 = surf(ta, a0), p01 = surf(ta, a1), p10 = surf(tb, b1), p11 = surf(tb, b2);
        face(p00, p10, p11, o.col, tm); face(p00, p11, p01, o.col, tm);
      }
    }
  }
  /* Stamm (Einheitsradius 1, Höhe hU): o.M Facetten (Teiler von 28, damit das Relief an denselben Kanten sitzt), o.top = Deckel */
  function plainTrunk(bark, hU, sty, o) {
    o = o || {};
    const b0 = new G3.MB(), b = taperB(b0, sty), M = o.M || NSEC, ring = [];
    for (let i = 0; i <= M; i++) { const f = 2 * Math.PI * i / M; ring.push([Math.sin(f), Math.cos(f)]); }
    const lv = [0];
    if (sty) sty.bp.forEach(v => { if (v > 0.001 && v < hU - 0.001) lv.push(v); });
    lv.push(hU);
    const fa = i => (i + 0.5) * 2 * Math.PI / M - (M < NSEC ? 1e-4 : 0);
    for (let i = 0; i < M; i++) for (let j = 0; j + 1 < lv.length; j++) {
      const a = ring[i], c = ring[i + 1], y0 = lv[j], y1 = lv[j + 1], col = sty ? sty.bf((y0 + y1) / 2, fa(i)) : bark;
      const P = [a[0], y0, a[1]], Q = [c[0], y0, c[1]], Q1 = [c[0], y1, c[1]], P1 = [a[0], y1, a[1]], ou = [a[0] + c[0], 0, a[1] + c[1]];
      if (M < NSEC || !sty) { const fs = sty ? Object.assign({}, sty, { bp: [], blobs: null, fc: false, bf: () => col }) : null; emitBark(b, P, Q, Q1, ou, fs, col); emitBark(b, P, Q1, P1, ou, fs, col); }
      else { emitBark(b, P, Q, Q1, ou, sty, col); emitBark(b, P, Q1, P1, ou, sty, col); }
    }
    if (o.top !== false) { const top = [0, hU, 0]; for (let i = 0; i < M; i++) b.tri(top, [ring[i + 1][0], hU, ring[i + 1][1]], [ring[i][0], hU, ring[i][1]], sty ? sty.bf(hU, fa(i)) : bark); }
    if (sty && sty.marks && sty.marks.length) markStrips(b0, sty, M, hU);
    return b0;
  }
  /* Stamm für die Hof-/Waldansicht im Modellmaß des Baums: tp = [r unten, r oben, Höhe, Neigung] wie tree() (b.tp).
     o.lod 1 = nah (28 Facetten), 2 = fern (14 Facetten); o.scars = [[y, Winkel]] Astansätze (Birke/Buche: Narben darunter). */
  function trunk(sp, sz, v, tp, o) {
    o = o || {};
    const T = TC_()[sp] || { bark: 0x8a6a4a }, lod = o.lod || 2, r0 = tp[0];
    const sty = barkStyle(sp, sz, r0, 1, { tp, seed: seedOf(sp, sz, v), lx: -Math.sin(tp[3] || 0), lz: 0, lod, scars: o.scars });
    /* fern: dicke Arten 14, schlanke 7 Facetten (Teiler von 28 – gleiche Kanten wie nah, kein Sprung im Umriss) */
    const mb = plainTrunk(T.bark, tp[2] / r0, sty, { M: lod >= 2 ? (sp === "eiche" || sp === "buche" ? 14 : 7) : NSEC });
    const out = new G3.MB();
    out.merge(mb, { s: r0 });
    return out;
  }
  return { NSEC, TH: TH_, RELIEF, reliefOf, seedOf, barkStyle, mixC, splitF, wrapD, emitBark, taperB, plainTrunk, trunk };
})();
