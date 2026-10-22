/* =========================================================================
   LOGISTIKA – fpsaw.js  (v85, Axt seit v93)
   Sägen in der Ich-Perspektive. Die Kamera schwenkt aus der Vogelperspektive vor den Stamm
   des gewählten Baums, die Säge hängt im Vordergrund. Der Fallkerb-Schnitt wird am Stamm
   selbst getimt: ein grüner Ring (Zielzone), ein gelber Ring (perfekt) und eine rote Marke,
   die am Stamm auf und ab läuft. Danach der Fällschnitt (halten = sägen).
   Die Spielregeln bleiben in minigames.js (MG_GAMES.saw) – dieses Modul zeigt sie nur in 3D:
     SAW3D.can()            geht es gerade (Hof-Ansicht offen, Engine läuft)?
     SAW3D.begin(t, id)     Kamera losschicken, Säge und Ringe aufbauen → Lauf-Objekt
     SAW3D.ev(name, st)     Einzelereignisse: miss, notch, cut, stall, done
     SAW3D.step(dt, time)   je Bild: Kamera, Säge, Ringe, Kerb, Schnitt nachführen
     SAW3D.end(done)        Kamera zurück in die Hauptansicht, Hilfsteile weg
   Die Engine ist die eigene (gl3d.js), kein Three.js: Knoten mit Netzen, R.emit für Späne (Würfel).
   v93: dasselbe mit der Axt (begin(t, "axe1"|"axe2")): die Kamera steht nah am Stamm, die Axt hängt an einem
   Kamera-Knoten (wie camera.add), jeder Schlag holt aus, trifft abwechselnd Dach und Sohle des V-Kerbs,
   wirft Holzsplitter (echte kleine Quader) und vertieft den Kerb; Fall und Stumpf wie bei der Säge.
   Die Regeln (Nadel, Treffer, Kraft) bleiben in minigames.js (MG_GAMES.axe), ev("swing", st, { q, kp }) je Schlag.
   ========================================================================= */
const SAW3D = (() => {
  "use strict";
  let X = null;
  const ss = k => k * k * (3 - 2 * k), lerp = (a, b, k) => a + (b - a) * k;
  const unit = (key, col) => fmesh(key, () => { const b = new G3.MB(); b.box(1, 1, 1, col, {}); return b; });
  const CAM_KEYS = ["tx", "ty", "tz", "dist", "pitch", "yaw", "fov"];
  const ROOF_ANG = 35 * Math.PI / 180;                       /* Schienenwinkel beim schrägen Dachschnitt */
  /* Säge für die Ego-Sicht in drei Teilen (Lokalachsen: +z = Schiene nach vorne, +y = oben, Griff hinten bei -z):
     Gehäuse (fest), Schiene als Einheitslänge 0…1 entlang +z (wird per sz auf die nötige Länge gestreckt), runde Spitze. */
  function sawBody(id) {
    const b = new G3.MB(), pro = id === "saw2", body = pro ? 0xf2c230 : 0xf2731e, dk = 0x2a2a30;
    b.box(0.4, 0.36, 0.62, body, { y: 0.0, top: pro ? 0xe2b020 : 0xe2631e });
    b.box(0.34, 0.14, 0.46, dk, { y: 0.36, z: -0.04 });
    b.box(0.08, 0.2, 0.34, dk, { y: 0.5, z: -0.12 });                                   /* hinterer Griff */
    b.box(0.44, 0.07, 0.07, dk, { y: 0.46, z: 0.22 });                                  /* Bügelgriff vorn */
    [-1, 1].forEach(s => b.box(0.07, 0.4, 0.07, dk, { x: s * 0.2, y: 0.1, z: 0.22 }));
    b.box(0.12, 0.2, 0.1, dk, { x: 0.13, y: 0.1, z: 0.3 });                             /* Kettenraddeckel */
    if (pro) b.box(0.42, 0.06, 0.2, dk, { y: 0.2, z: -0.24 });
    return b;
  }
  function sawBar() {
    const b = new G3.MB(), dk = 0x2a2a30;
    b.box(0.17, 0.05, 1, 0xd0d6dc, { y: -0.025, z: 0.5, top: 0xe6ebef });
    [-1, 1].forEach(s => b.box(0.04, 0.075, 1, dk, { x: s * 0.095, y: -0.0375, z: 0.5 }));
    for (let i = 1; i < 8; i++) [-1, 1].forEach(s => b.box(0.05, 0.085, 0.03, 0xb8bec6, { x: s * 0.095, y: -0.0425, z: i / 8 }));
    return b;
  }
  function sawNose() {
    const b = new G3.MB();
    b.cyl(0.095, 0.095, 0.075, 12, 0x2a2a30, { y: -0.0375 });
    b.cyl(0.055, 0.055, 0.08, 10, 0xd0d6dc, { y: -0.04 });
    return b;
  }
  /* Drehung wie gl3d trs(): R = Ry·Rx·Rz */
  function rotV(v, rx, ry, rz) {
    const cz = Math.cos(rz), sz = Math.sin(rz), cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
    let x = v[0] * cz - v[1] * sz, y = v[0] * sz + v[1] * cz, z = v[2];
    const y2 = y * cx - z * sx, z2 = y * sx + z * cx; y = y2; z = z2;
    return [cy * x + sy * z, y, -sy * x + cy * z];
  }
  const GY0 = 0.12, GH = 1.0;                       /* Messbereich am Stamm: von GY0 bis GY0 + GH */

  /* ---- v93: Zweihand-Axt für die Ego-Sicht ----
     Lokalachsen der Axt: +y = Stiel nach oben (Ursprung = untere Hand), −z = Schneide (zeigt nach vorne zum Stamm),
     +z = Nacken/Rücken des Kopfs, x = Blattdicke. Stiel und Kopf sind ein Mesh (ein Zeichenaufruf). */
  const AXE_EDGE = [0, 0.775, -0.175];               /* Mitte der Schneide – dieser Punkt trifft den Kerb */
  const v3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    sc: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cr: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    n: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
  };
  /* 3×3-Matrizen zeilenweise (m[r*3+c]), Quaternionen [x, y, z, w] */
  const m3cols = (a, b, c) => [a[0], b[0], c[0], a[1], b[1], c[1], a[2], b[2], c[2]];
  const m3v = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
  const m3tv = (m, v) => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
  /* Matrix → Winkel für gl3d (R = Ry·Rx·Rz) */
  const eulOf = m => ({ rx: Math.asin(Math.max(-1, Math.min(1, -m[5]))), ry: Math.atan2(m[2], m[8]), rz: Math.atan2(m[3], m[4]) });
  function qOfM(m) {
    const t = m[0] + m[4] + m[8];
    let x, y, z, w;
    if (t > 0) { const s = Math.sqrt(t + 1) * 2; w = s / 4; x = (m[7] - m[5]) / s; y = (m[2] - m[6]) / s; z = (m[3] - m[1]) / s; }
    else if (m[0] > m[4] && m[0] > m[8]) { const s = Math.sqrt(1 + m[0] - m[4] - m[8]) * 2; w = (m[7] - m[5]) / s; x = s / 4; y = (m[1] + m[3]) / s; z = (m[2] + m[6]) / s; }
    else if (m[4] > m[8]) { const s = Math.sqrt(1 + m[4] - m[0] - m[8]) * 2; w = (m[2] - m[6]) / s; x = (m[1] + m[3]) / s; y = s / 4; z = (m[5] + m[7]) / s; }
    else { const s = Math.sqrt(1 + m[8] - m[0] - m[4]) * 2; w = (m[3] - m[1]) / s; x = (m[2] + m[6]) / s; y = (m[5] + m[7]) / s; z = s / 4; }
    return [x, y, z, w];
  }
  function mOfQ(q) {
    const [x, y, z, w] = q;
    return [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
      2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
      2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)];
  }
  const qMul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
  const qAx = (ax, a) => { const s = Math.sin(a / 2); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(a / 2)]; };
  function qSlerp(a, b, t) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = b.map(v => -v); d = -d; }
    if (d > 0.9995) { const r = a.map((v, i) => v + (b[i] - v) * t), l = Math.hypot(...r); return r.map(v => v / l); }
    const th = Math.acos(d), s = Math.sin(th), ka = Math.sin((1 - t) * th) / s, kb = Math.sin(t * th) / s;
    return a.map((v, i) => v * ka + b[i] * kb);
  }
  /* Lage aus Stielrichtung h und Schneidenrichtung e: hKeep = Stiel bleibt exakt (Ruhe), sonst bleibt die Schneide exakt (Schlag) */
  function frameQ(h, e, hKeep) {
    h = v3.n(h); e = v3.n(e);
    if (hKeep) e = v3.n(v3.sub(e, v3.sc(h, v3.dot(e, h))));
    else h = v3.n(v3.sub(h, v3.sc(e, v3.dot(h, e))));
    const z = v3.sc(e, -1), x = v3.cr(h, z);
    return qOfM(m3cols(x, h, z));
  }
  /* Fläche mit Windung nach außen (vom Mittelpunkt cen weg) */
  function faceOut(b, pts, col, cen) {
    const n = v3.cr(v3.sub(pts[1], pts[0]), v3.sub(pts[2], pts[0])), m = pts.reduce((s, p) => v3.add(s, v3.sc(p, 1 / pts.length)), [0, 0, 0]);
    const q = v3.dot(n, v3.sub(m, cen)) < 0 ? pts.slice().reverse() : pts;
    for (let i = 1; i + 1 < q.length; i++) b.tri(q[0], q[i], q[i + 1], col);
  }
  /* verjüngter Block zwischen hinterer Fläche (z0) und vorderer (z1): je Seite [y oben, y unten, halbe Dicke] */
  function slab(b, z0, k0, z1, k1, c) {
    const P = [[-k0[2], k0[0], z0], [k0[2], k0[0], z0], [k0[2], k0[1], z0], [-k0[2], k0[1], z0],
      [-k1[2], k1[0], z1], [k1[2], k1[0], z1], [k1[2], k1[1], z1], [-k1[2], k1[1], z1]];
    const cen = P.reduce((s, p) => v3.add(s, v3.sc(p, 1 / 8)), [0, 0, 0]);
    faceOut(b, [P[0], P[1], P[2], P[3]], c.back || c.side, cen);
    faceOut(b, [P[4], P[5], P[6], P[7]], c.front || c.side, cen);
    faceOut(b, [P[0], P[1], P[5], P[4]], c.top || c.side, cen);
    faceOut(b, [P[3], P[2], P[6], P[7]], c.bot || c.side, cen);
    faceOut(b, [P[0], P[3], P[7], P[4]], c.side, cen);
    faceOut(b, [P[1], P[2], P[6], P[5]], c.side, cen);
  }
  function axeMesh(id) {
    const b = new G3.MB(), steel = id === "axe2";
    const wood = steel ? 0xd2a066 : 0x9a6a44, knob = steel ? 0xb88850 : 0x7a5232;
    const head = steel ? 0x6c7682 : 0x56504a, cheek = steel ? 0x7a8592 : 0x625b54, bevel = steel ? 0xe3e8ec : 0xbfc3c6, poll = steel ? 0x5a636e : 0x48433f;
    /* Stiel: leicht abgeflacht (oval), unten ein Knauf, oben steckt er im Auge des Kopfs */
    b.at({ sz: 0.74 }, m => {
      m.cyl(0.025, 0.021, 0.05, 7, knob, { y: -0.1 });
      m.cyl(0.021, 0.0175, 0.46, 7, wood, { y: -0.05, notop: true, nobot: true });
      m.cyl(0.0175, 0.0195, 0.47, 7, wood, { y: 0.41, nobot: true });
      if (steel) m.cyl(0.0215, 0.0215, 0.08, 7, 0xd8332b, { y: 0.02 });
    });
    /* Kopf: Auge (um den Stiel), Blatt nach vorn (−z) mit Bart nach unten, blanke Fase an der Schneide, kurzer Nacken hinten */
    slab(b, 0.026, [0.846, 0.756, 0.024], -0.026, [0.846, 0.756, 0.024], { side: head });
    slab(b, -0.026, [0.846, 0.758, 0.02], -0.12, [0.872, 0.7, 0.0085], { side: cheek, top: head, bot: head });
    slab(b, -0.12, [0.872, 0.7, 0.0085], -0.175, [0.89, 0.66, 0.0012], { side: bevel, top: bevel, bot: bevel, front: bevel });
    slab(b, 0.05, [0.838, 0.764, 0.021], 0.026, [0.842, 0.76, 0.023], { side: poll });
    return b;
  }

  /* ---- V-Kerb als echte Geometrie (Einheitsradius 1, Sohle bei y = 0, Vorderseite = +z) ----
     Querschnitt von der Seite: waagerechte Sohle (hell), schräger Dachschnitt 45° (hell, etwas dunkler);
     der Stamm dazwischen ist ein Zylinder, der an der Dachebene z = zc + y beschnitten ist. */
  const WOOD = 0xfbe7bd, WOOD2 = 0xf5dcae, KMAX = 1.3, KQ = 20, KS = 1.9;   /* KS: Steilheit des Dachschnitts (Höhe pro Tiefe) */
  /* Rindenzeichnung wie bei den Bäumen im Spiel (woodmodels.js tree()): je Art Farbbänder/Flecken am Stamm.
     bf(y in Einheiten, Segment) → Farbe; bp = Höhen (Einheiten), an denen sich die Farbe ändert (Wände werden dort geteilt). */
  const TC_ = () => (typeof FWM !== "undefined" && FWM.TREE_C) || {};
  function barkStyle(sp, sz, sc, ts, ex) {
    const T = TC_()[sp];
    if (!T) return null;
    ts = ts || 1;
    const k = TH_[sz || 1] || 1, hs = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
    const bp = [];
    let bf = null;
    let cf = null, cy0 = -1e9, blobs = null, lat = null;
    if (sp === "birke") {
      const hb = 0.363 * k; bp.push(hb);
      bf = y => y < hb ? T.base : T.bark;
      /* Maserung wie bei echter Birkenrinde: schwarze, querliegende Streifen mit spitzen Enden (teils lang um den Stamm, teils kurze Striche), in Reihen */
      const hTr = (ex && ex.tp ? ex.tp[2] : 2.27 * k), R0 = (ex && ex.tp ? ex.tp[0] : 0.1), sd = (ex && ex.seed) || 0, rows = 9 + 3 * (sz || 1);
      blobs = [];
      for (let i = 0; i < rows; i++) {
        const yr = hTr * (0.2 + 0.68 * (i + 0.2 + 0.6 * hs(i * 1.37 + sd, 3.1)) / rows), nm = 1 + Math.floor(hs(i + sd, 2.3) * 2.6);
        for (let j = 0; j < nm; j++) {
          const f = 2 * Math.PI * hs(i * 2.11 + j * 5.3 + sd, 7.7), hy = 0.008 + 0.011 * hs(i * 3.3 + j + sd, 1.9), wf = hs(i + j * 7.1 + sd, 4.4) < 0.35 ? 0.18 + 0.2 * hs(i + j * 2.7 + sd, 5.3) : 0.55 + 0.8 * hs(i + j * 2.7 + sd, 5.3), y = yr + (hs(i + j, sd + 9.1) - 0.5) * 0.05;
          if (y > hb + hy) blobs.push({ y, f, hy, wf });
        }
      }
      cy0 = hb;
      const wr = d => { d = Math.abs(d) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
      cf = (ym, f) => {
        let m = 0;
        for (const o of blobs) {
          const u = wr(f - o.f) / o.wf; if (u >= 1) continue;
          const e = o.hy * (1 - u * u), v = e > 0 ? 1 - Math.abs(ym - o.y) / e : 0;
          if (v > m) m = v;
        }
        return m <= 0 ? T.bark : mixC(T.bark, T.mark, Math.min(1, m * 3));
      };
      lat = { ly: 0.006, la: 0.008 / R0 };
    } else if (sp === "kiefer") {
      const hb = 1.08 * k; bp.push(hb);
      bf = y => y < hb ? T.base : T.bark;
    } else if (sp === "eiche") {
      const hs2 = 0.72 * k; bp.push(hs2);
      bf = (y, g) => y < hs2 && g % 5 === 1 ? T.mark : T.bark;
    } else if (sp === "kirsche") {
      const n = 4 + (sz || 1), step = 0.8 * k / n;
      for (let i = 0; i < n; i++) bp.push(0.15 + i * step, 0.18 + i * step);
      bf = y => { const m = (y - 0.15) / step, kk = Math.floor(m); return m >= 0 && kk < n && (m - kk) * step < 0.03 ? T.mark : T.bark; };
    }
    if (!bf) bf = () => T.bark;
    /* Verjüngung (und Neigung) wie am Spielbaum: Stamm unten r0, oben r1 auf der Höhe h (Modellmaß, vor der Baumgröße ts) */
    let tp = null;
    const mt = ex && ex.tp;
    if (mt) {
      const hU = mt[2] * ts / sc, rho = mt[1] / mt[0];
      tp = { hU, f: yU => 1 - (1 - rho) * Math.min(1, Math.max(0, yU) / hU), lx: ex.lx || 0, lz: ex.lz || 0 };
    }
    const NS = 14;
    const wrap = f => ((f % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const ysn = v => v * ts / sc;
    return { tp, cy0: cf ? ysn(cy0) : 1e9, cf: cf ? (yu, f) => cf(yu * sc / ts, wrap(f)) : null, ly: lat ? ysn(lat.ly) : 1, la: lat ? lat.la : 1,
      blobs: blobs ? blobs.map(o => ({ y0: ysn(o.y - o.hy), y1: ysn(o.y + o.hy), f: o.f, df: o.wf })) : null,
      ycuts: blobs ? [...new Set(blobs.flatMap(o => [Math.floor(ysn(o.y - o.hy) / ysn(lat.ly)) * ysn(lat.ly), Math.ceil(ysn(o.y + o.hy) / ysn(lat.ly)) * ysn(lat.ly)]))].sort((x, y) => x - y) : null,
      bf: (yu, f) => bf(yu * sc / ts, Math.floor((((f % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI / NS)) % NS), bp: bp.map(v => v * ts / sc).sort((a, b) => a - b) };
  }
  /* Stamm ohne Kerb (Nahaufnahme vor dem ersten Treffer): Zylinder mit derselben Rindenzeichnung, Einheitsradius 1, Höhe hU */
  function mixC(c1, c2, k) { const r = (c1 >> 16) & 255, g = (c1 >> 8) & 255, bl = c1 & 255, r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255; return ((Math.round(r + (r2 - r) * k) << 16) | (Math.round(g + (g2 - g) * k) << 8) | Math.round(bl + (b2 - bl) * k)); }
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
  const wrapD = d => { d = Math.abs(d) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
  /* Eine Rindenfläche (Dreieck a,p,c) ausgeben: an den Farbgrenzen der Art sauber geschnitten (gerade Kante statt Zacken).
     Fleckenbereiche (Birke) werden an einem festen Gitter (Höhe × Winkel) geschnitten und mit Farbe je Ecke ausgegeben – das Gitter hängt nicht
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
  function taperB(b, sty) {
    const tp = sty && sty.tp;
    if (!tp) return b;
    const P = p => { const f = tp.f(p[1]); return [p[0] * f + tp.lx * p[1], p[1], p[2] * f + tp.lz * p[1]]; };
    return { tri: (a, p, c, col) => b.tri(P(a), P(p), P(c), col), triV: (a, p, c, ca, cp, cc) => b.triV(P(a), P(p), P(c), ca, cp, cc), raw: b };
  }
  function plainTrunk(bark, hU, sty) {
    const b0 = new G3.MB(), b = taperB(b0, sty), M = 14, ring = [];
    for (let i = 0; i <= M; i++) { const f = 2 * Math.PI * i / M; ring.push([Math.sin(f), Math.cos(f)]); }
    const lv = [0];
    if (sty) sty.bp.forEach(v => { if (v > 0.001 && v < hU - 0.001) lv.push(v); });
    lv.push(hU);
    for (let i = 0; i < M; i++) for (let j = 0; j + 1 < lv.length; j++) {
      const a = ring[i], c = ring[i + 1], y0 = lv[j], y1 = lv[j + 1], col = sty ? sty.bf((y0 + y1) / 2, (i + 0.5) * 2 * Math.PI / M) : bark;
      const P = [a[0], y0, a[1]], Q = [c[0], y0, c[1]], Q1 = [c[0], y1, c[1]], P1 = [a[0], y1, a[1]], o = [a[0] + c[0], 0, a[1] + c[1]];
      emitBark(b, P, Q, Q1, o, sty, col); emitBark(b, P, Q1, P1, o, sty, col);
    }
    const top = [0, hU, 0]; for (let i = 0; i < M; i++) b.tri(top, [ring[i + 1][0], hU, ring[i + 1][1]], [ring[i][0], hU, ring[i][1]], sty ? sty.bf(hU, (i + 0.5) * 2 * Math.PI / M) : bark);
    return b0;
  }
  function notchMesh(q, bark, wood, nyU, hU, part, sty) {
    nyU = nyU || 0; hU = hU || 0;
    const inLow = part !== "up", inUp = part !== "low";
    /* Bruchstufe: hinter der Kerbe (links im Bild) reißt das Haltestück ab – dort bleibt eine unregelmäßig erhöhte Leiste stehen */
    const STEP = 0.2, cl = (v, a, c) => Math.max(a, Math.min(c, v));
    const d = KMAX * q / KQ, zc = 1 - d, ym = d * KS, R = 6, M = 14, b0 = new G3.MB(), b = taperB(b0, sty);
    let curSeg = 0;
    const T = (a, p, c, col, out) => {
      if (wood !== 2 && (col === bark) === !!wood) return;
      if (sty && col === bark) { emitBark(b, a, p, c, out, sty, bark); return; }       /* wood: false = Rinde, true = Holz, 2 = beides (Stumpf in der Welt) */
      const u = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) b.tri(a, c, p, col); else b.tri(a, p, c, col);
    };
    /* senkrechte Rindenwand zwischen unterer Kante (p,n) und oberer (p1,n1), an den Farbwechseln der Art geteilt */
    const WALL = (p, n, p1, n1, o) => {
      const y0 = p[1], y1 = p1[1], f = [0];
      if (sty) sty.bp.forEach(v => { const t = (v - y0) / ((y1 - y0) || 1); if (t > 0.002 && t < 0.998) f.push(t); });
      f.push(1); f.sort((a, c) => a - c);
      const L = (u, w, t) => [u[0] + (w[0] - u[0]) * t, u[1] + (w[1] - u[1]) * t, u[2] + (w[2] - u[2]) * t];
      for (let j = 0; j + 1 < f.length; j++) {
        const a0 = L(p, p1, f[j]), a1 = L(p, p1, f[j + 1]), c0 = L(n, n1, f[j]), c1 = L(n, n1, f[j + 1]);
        T(a0, c0, c1, bark, o); T(a0, c1, a1, bark, o);
      }
    };
    const mix = (c1, c2, k) => { const r = (c1 >> 16) & 255, g = (c1 >> 8) & 255, bl = c1 & 255, r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255; return ((Math.round(r + (r2 - r) * k) << 16) | (Math.round(g + (g2 - g) * k) << 8) | Math.round(bl + (b2 - bl) * k)); };
    const AP = 0x9a6b3a;                                       /* tief im Kerb: dunkleres Holz, zur Öffnung hin hell */
    const TV = (a, p, c, ca, cp, cc) => {                        /* beidseitig, mit Farbverlauf */
      if (!wood) return;
      b.triV(a, p, c, ca, cp, cc); b.triV(a, c, p, ca, cc, cp);
    };
    /* Alle Ringe teilen sich dieselben Facetten-Grenzen wie der glatte Stamm (14 Sektoren): so liegen Muster und Schattierung
       beim Ansetzen der Säge exakt gleich. Nur der Rand der Kerböffnung (f1) kommt je Ringhöhe dazu. */
    const SW = 2 * Math.PI / 14;
    const angs = f1 => { const o = [f1]; for (let k = 1; k < 14; k++) { const bb = k * SW; if (bb > f1 + 1e-6 && bb < 2 * Math.PI - f1 - 1e-6) o.push(bb); } o.push(2 * Math.PI - f1); return o; };
    const ring = (y, zs) => { const f1 = Math.acos(Math.max(-1, Math.min(1, zs))), o = angs(f1).map(f => [Math.sin(f), y + nyU, Math.cos(f)]); o.f = angs(f1); return o; };
    /* Band zwischen zwei Ringen mit unterschiedlich vielen Punkten (Reißverschluss nach Winkel) */
    const strip = (pv, cu) => {
      let i = 0, j = 0;
      while (i < pv.length - 1 || j < cu.length - 1) {
        const stepI = j >= cu.length - 1 || (i < pv.length - 1 && pv.f[i + 1] <= cu.f[j + 1]);
        let A, B2, C;
        if (stepI) { A = pv[i]; B2 = pv[i + 1]; C = cu[j]; i++; } else { A = pv[i]; B2 = cu[j + 1]; C = cu[j]; j++; }
        const o = [A[0] + B2[0] + C[0], 0, A[2] + B2[2] + C[2]];
        if (stepI) T(A, B2, C, bark, o); else T(A, B2, C, bark, o);
      }
    };
    const lh = p => part ? STEP * (0.85 + 0.45 * cl((zc - p[2]) / (zc + 1), 0, 1) + 0.3 * (Math.sin(p[0] * 23.1 + p[2] * 11.7) * 0.5 + 0.5)) : 0;
    let prev = ring(0, zc);
    for (let j = 1; j <= R && inUp; j++) {
      const y = ym * j / R, cur = ring(y, zc + y / KS);
      strip(prev, cur);
      /* Dachfläche (Chord) */
      const c0 = mix(AP, WOOD2, (j - 1) / R), c1 = mix(AP, WOOD2, j / R), pl = prev.length - 1, cl2 = cur.length - 1;
      TV(prev[0], prev[pl], cur[cl2], c0, c0, c1); TV(prev[0], cur[cl2], cur[0], c0, c1, c1);
      prev = cur;
    }
    /* Sohle: Kreissegment vorne bei y = 0 */
    const f0 = Math.acos(Math.max(-1, Math.min(1, zc))), C = [0, nyU, zc], N = 10;
    for (let i = 0; i < N && inLow; i++) {
      const a = -f0 + 2 * f0 * i / N, c = -f0 + 2 * f0 * (i + 1) / N;
      TV(C, [Math.sin(a), nyU, Math.cos(a)], [Math.sin(c), nyU, Math.cos(c)], AP, WOOD, WOOD);
    }
    if (wood !== true && hU > 0) {
      /* Stamm unten (bis zur Sohle) und oben (ab der Dachkante): aus denselben Punkten wie der Kerb – gleiche Farbe, keine Fuge */
      const base = ring(0, zc), loop = base.slice(), f1 = f0;
      for (let m = -14; m <= 14; m++) { const aa = m * SW; if (aa > -f1 + 1e-6 && aa < f1 - 1e-6) loop.push([Math.sin(aa), nyU, Math.cos(aa)]); }
      const nb = base.length, up = (pt, i) => (i % loop.length) < nb ? [pt[0], pt[1] + lh(pt), pt[2]] : pt;
      for (let i = 0; i < loop.length && inLow; i++) {
        const p = up(loop[i], i), n = up(loop[(i + 1) % loop.length], i + 1), o = [p[0] + n[0], 0, p[2] + n[2]];
        const p0 = [p[0], 0, p[2]], n0 = [n[0], 0, n[2]];
        WALL(p0, n0, p, n, o, 0);
      }
      const top = ring(ym, 1);
      for (let i = 0; i < top.length - 1 && inUp; i++) {
        const p = top[i], n = top[i + 1], o = [p[0] + n[0], 0, p[2] + n[2]], p1 = [p[0], hU, p[2]], n1 = [n[0], hU, n[2]];
        WALL(p, n, p1, n1, o, 1);
      }
    }
    if (wood && part) {
      /* Bruchfläche hinter der Sohle: Unterseite des oberen Stücks passt formgleich auf die Leiste des Stumpfs */
      const arc = ring(0, zc).map(p => [p[0], p[1] + lh(p), p[2]]), cy = (arc[0][1] + arc[arc.length - 1][1]) / 2, Cc = [0, cy, zc];
      for (let i = 0; i < arc.length - 1; i++) {
        const k = i / (arc.length - 2), rim = mix(WOOD, 0xe9cf9c, 0.3 + 0.4 * Math.sin(k * Math.PI));
        if (part === "low") TV(Cc, arc[i + 1], arc[i], 0xe9cf9c, rim, rim);
        else TV(Cc, arc[i], arc[i + 1], 0xe9cf9c, rim, rim);
      }
      /* senkrechte Stufe zur Sohle hin */
      const a0 = ring(0, zc)[0], a1 = ring(0, zc)[arc.length - 1], aL = arc[arc.length - 1];
      TV(a0, a1, aL, 0xc79a62, 0xc79a62, WOOD2); TV(a0, aL, arc[0], 0xc79a62, WOOD2, WOOD2);
    }
    return b0;
  }

  /* echter Stammradius je Art/Größe (wie woodmodels.js tree()) – damit Zone, Kerb und Nahaufnahme-Stamm den Stamm wirklich verdecken */
  const TH_ = [0, 1.0, 1.55, 2.15, 3.0];
  function trunkR(t) {
    const sz = t.sz || 1, k = TH_[sz] || 1, sc = t.s || 1;
    let r;
    switch (t.sp) {
      case "birke": r = (0.07 * k + 0.02) * 1.15; break;
      case "kiefer": r = (0.1 * k + 0.02) * 1.1; break;
      case "fichte": r = (0.08 * k + 0.02) * 1.2; break;
      case "buche": r = (0.12 * k + 0.02) * 1.2; break;
      case "eiche": r = ((sz >= 4 ? 0.24 : 0.16) * k + 0.03) * 1.25; break;
      case "kirsche": r = (0.1 * k + 0.02) * 1.1; break;
      default: r = 0.14 + 0.035 * sz;
    }
    return Math.max(0.12, r * sc * 0.97);
  }

  function can() {
    return !!(typeof FV !== "undefined" && FV.R && FV.on && !FV.fp && typeof WV !== "undefined" && document.body.classList.contains("tab-farm"));
  }
  function camOf(c) { const o = {}; CAM_KEYS.forEach(k => { o[k] = c[k] || 0; }); return o; }

  /* ---- Der Spielbaum selbst (woodmodels.js tree()): Krone/Äste werden unverändert übernommen, damit der fallende Baum
     genauso aussieht wie vor dem Zoom. Nur der Stamm wird ersetzt (Kerbe, Schnitt) – mit gleicher Verjüngung und Neigung. ---- */
  const tpCache = {};
  function trunkParams(sp, sz) {
    const k = sp + sz;
    if (!(k in tpCache)) { try { const m = FWM.tree(sp, sz, 0); tpCache[k] = m && m.tp ? m.tp : null; } catch (e) { tpCache[k] = null; } }
    return tpCache[k];
  }
  function realInfo(t, fry) {
    let m = null;
    try { m = FWM.tree(t.sp, t.sz, t.id % 3); } catch (e) { m = null; }
    if (!m || !m.tk || !m.tp) return null;
    const al = m.tp[3] || 0, th = t.ry || 0, wx = -Math.sin(al) * Math.cos(th), wz = Math.sin(al) * Math.sin(th);
    return { m, tp: m.tp, lx: wx * Math.cos(fry) - wz * Math.sin(fry), lz: wx * Math.sin(fry) + wz * Math.cos(fry) };
  }
  /* Krone + Äste des Spielbaums (alles nach dem Stammteil), gedreht in das Bezugssystem des Kerb-Stamms (ry = fry) */
  function crownMesh(info, t, fry) {
    const out = new G3.MB(), v = info.m.v, d = (t.ry || 0) - fry, c = Math.cos(d), s = Math.sin(d), ts = t.s || 1;
    const lift = t.sp === "fichte" ? 1.3 / ts : -1e9;               /* Fichte: unterste Äste weg, sonst verdecken sie die Schnittstelle */
    for (let i = info.m.tk; i + 26 < v.length; i += 27) {
      if ((v[i + 1] + v[i + 10] + v[i + 19]) / 3 < lift) continue;
      for (let k = 0; k < 3; k++) {
        const o = i + k * 9;
        out.v.push(v[o] * c + v[o + 2] * s, v[o + 1], -v[o] * s + v[o + 2] * c, v[o + 3] * c + v[o + 5] * s, v[o + 4], -v[o + 3] * s + v[o + 5] * c, v[o + 6], v[o + 7], v[o + 8]);
      }
    }
    return out;
  }

  /* ---- Sichtschutz: Bäume zwischen Kamera und Zielbaum ----
     Zuerst wird die Blickrichtung gesucht, bei der am wenigsten im Weg steht; was dann noch stört, wird für die Dauer
     des Minispiels ausgeblendet (echte Bäume: unsichtbar, Kulissenbäume: aus der Kachel genommen) und danach zurückgesetzt. */
  const CR = { birke: 0.55, kiefer: 0.75, fichte: 0.75, buche: 1.0, eiche: 1.05, kirsche: 0.75 };
  function blockers(t) {
    const out = [];
    S.farm.trees.forEach(o => {
      if (o.id === t.id || o.st !== "up" || Math.hypot(o.x - t.x, o.z - t.z) > 16) return;
      out.push({ x: o.x, z: o.z, rc: (CR[o.sp] || 0.8) * Math.pow(TH_[o.sz || 1] || 1, 0.8) * (o.s || 1), real: o });
    });
    if (WV.bgChunks) for (const c of WV.bgChunks.values()) c.trees.forEach(o => {
      if (Math.hypot(o.x - t.x, o.z - t.z) > 16) return;
      out.push({ x: o.x, z: o.z, rc: (CR[o.sp] || 0.8) * Math.pow(o.s || 1, 0.8) * 0.9, bg: o, c });
    });
    return out;
  }
  function obstructs(b, ex, ez, t) {          /* steht b im Blickkorridor Auge → Zielbaum, oder steckt die Kamera in seiner Krone? */
    const vx = t.x - ex, vz = t.z - ez, L2 = vx * vx + vz * vz || 1;
    const u = Math.max(0, Math.min(1, ((b.x - ex) * vx + (b.z - ez) * vz) / L2));
    const d = Math.hypot(b.x - (ex + vx * u), b.z - (ez + vz * u));
    return u < 0.92 && d < b.rc * 0.85 + 0.3;
  }
  /* Der Kerb zeigt (aus Spielersicht) nach rechts, leicht zur Kamera hin gedreht: NA = Winkel von der Blickachse */
  const NA = 75 * Math.PI / 180;
  function faceOf(yaw) {
    const dx = Math.cos(yaw), dz = Math.sin(yaw), rx = Math.sin(yaw), rz = -Math.cos(yaw);   /* dx,dz: zur Kamera; rx,rz: rechts im Bild */
    return [Math.cos(NA) * dx + Math.sin(NA) * rx, Math.cos(NA) * dz + Math.sin(NA) * rz];
  }
  function fallBlocked(b, t, n, len) {         /* liegt b im Weg des fallenden Baums? */
    const u = (b.x - t.x) * n[0] + (b.z - t.z) * n[1];
    if (u < 0.4 || u > len) return false;
    return Math.abs((b.x - t.x) * n[1] - (b.z - t.z) * n[0]) < b.rc * 0.7 + 0.35;
  }
  /* ---- feste Hindernisse der Welt: Zäune, Mauern, Gebäude (Weltkoordinaten) ----
     Zäune/Mauern sind niedrige Strecken (Höhe h), Gebäude Rechtecke. Daran wird die Sichtlinie Kamera → Stammfuß geprüft:
     liegt ein Zaun davor, würde man durch ihn hindurchsägen. */
  const HIGH = new Set(["house", "barn", "silo", "bakery", "mill", "dairy", "butcher", "spinnery", "shed", "sw_halle", "sw_lager", "sw_buero", "sw_lkw", "kessel",
    "spalter", "hobel", "trocken", "verpack", "schleif", "fraese", "f_huette", "f_lager", "f_rauch", "f_kuehl", "f_markt", "stall"]);
  function obstacles() {
    const segs = [], boxes = [], F = S.farm;
    const seg = (ax, az, bx, bz, h) => segs.push({ ax, az, bx, bz, h });
    const gap = (x0, z0, x1, z1, g0, g1, h) => {              /* Linie mit Lücke (Tor) zwischen den Parametern g0 … g1 (Länge) */
      const L = Math.hypot(x1 - x0, z1 - z0) || 1, ux = (x1 - x0) / L, uz = (z1 - z0) / L;
      if (g0 == null) { seg(x0, z0, x1, z1, h); return; }
      seg(x0, z0, x0 + ux * g0, z0 + uz * g0, h); seg(x0 + ux * g1, z0 + uz * g1, x1, z1, h);
    };
    try {
      /* Hofzaun bzw. Steinmauer: Lücken am Südtor (FGATE.x ± 2) und am Westtor */
      const B = farmHofB(), stage = F.stage || 1, hh = stage >= 4 ? 0.62 : stage <= 1 ? 0.5 : 0.65, GX = FGATE.x, WZ = FGATE.wz;
      seg(B.x0, B.z0, B.x1, B.z0, hh); seg(B.x1, B.z0, B.x1, B.z1, hh);
      gap(B.x0, B.z1, B.x1, B.z1, GX - 2 - B.x0, GX + 2 - B.x0, hh);
      gap(B.x0, B.z0, B.x0, B.z1, WZ - 1.1 - B.z0, WZ + 1.1 - B.z0, hh);
      /* Sägewerkshof: Zaun mit Toren in Süden, Norden und Westen */
      const Y = FWORLD.yard, gx = (Y[0] + Y[2]) / 2, gz = (Y[1] + Y[3]) / 2, yh = 0.7;
      gap(Y[0], Y[1], Y[2], Y[1], gx - 2 - Y[0], gx + 2 - Y[0], yh); gap(Y[0], Y[3], Y[2], Y[3], gx - 2 - Y[0], gx + 2 - Y[0], yh);
      gap(Y[0], Y[1], Y[0], Y[3], gz - 2 - Y[1], gz + 2 - Y[1], yh); seg(Y[2], Y[1], Y[2], Y[3], yh);
    } catch (e) { /* ohne Zaun-Daten: nur Gebäude */ }
    (F.objs || []).forEach(o => {
      try {
        const [cx, cz] = farmCenter(o), [w, d] = farmSize(o);
        if (HIGH.has(o.t)) boxes.push({ cx, cz, hw: w / 2, hd: d / 2, h: 2.4 });
        else if (typeof FPENS !== "undefined" && FPENS[o.t]) { const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2; seg(x0, z0, x1, z0, 0.6); seg(x1, z0, x1, z1, 0.6); seg(x1, z1, x0, z1, 0.6); seg(x0, z1, x0, z0, 0.6); }
      } catch (e) { /* egal */ }
    });
    return { segs, boxes };
  }
  /* Wird die Sichtlinie E → P (3D) von Zaun/Mauer/Gebäude geschnitten? Rückgabe: Kosten */
  function sightCost(O, E, P) {
    let cost = 0;
    const dx = P[0] - E[0], dz = P[2] - E[2], dy = P[1] - E[1];
    O.segs.forEach(s => {
      const ex = s.bx - s.ax, ez = s.bz - s.az, den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-9) return;
      const u = ((s.ax - E[0]) * ez - (s.az - E[2]) * ex) / den, v = ((s.ax - E[0]) * dz - (s.az - E[2]) * dx) / den;
      if (u > 0.02 && u < 0.98 && v >= 0 && v <= 1) cost += E[1] + dy * u < s.h + 0.05 ? 7 : 2;       /* auch ein Zaun im Vordergrund stört */
    });
    O.boxes.forEach(b => {
      let u0 = 0, u1 = 1;
      [[E[0] - b.cx, dx, b.hw], [E[2] - b.cz, dz, b.hd]].forEach(([o, dd, h]) => {
        if (Math.abs(dd) < 1e-9) { if (Math.abs(o) > h) u1 = -1; return; }
        let a = (-h - o) / dd, c = (h - o) / dd; if (a > c) { const tt = a; a = c; c = tt; }
        u0 = Math.max(u0, a); u1 = Math.min(u1, c);
      });
      if (u1 > u0 && u0 < 0.98 && E[1] + dy * Math.max(0, u0) < b.h) cost += 14;
    });
    return cost;
  }
  function eyeCost(O, E) {                       /* steckt die Kamera selbst in einem Gebäude oder Zaun? */
    let cost = 0;
    O.boxes.forEach(b => { if (Math.abs(E[0] - b.cx) < b.hw + 0.3 && Math.abs(E[2] - b.cz) < b.hd + 0.3) cost += 25; });
    O.segs.forEach(s => {
      const ex = s.bx - s.ax, ez = s.bz - s.az, l2 = ex * ex + ez * ez || 1, u = Math.max(0, Math.min(1, ((E[0] - s.ax) * ex + (E[2] - s.az) * ez) / l2));
      if (Math.hypot(E[0] - s.ax - ex * u, E[2] - s.az - ez * u) < 0.3) cost += 8;
    });
    return cost;
  }
  /* Blickrichtung, Abstand und Neigung wählen: freie Sicht auf den Stamm (auch über Zäune hinweg), Kerbseite frei, wenig Umweg */
  function pickView(t, yaw0, dist, pitch, op) {
    const list = blockers(t), len = (typeof treeH === "function" ? treeH(t) : 3) * 0.85, O = obstacles(), r = trunkR(t), sz = t.sz || 1;
    const ty0 = 0.5 + 0.05 * sz;
    op = op || {};
    const minHd = op.minHd != null ? op.minHd : r + 1.3;          /* v93: die Axt steht näher am Stamm als die Säge */
    let best = null;
    for (const ds of op.ds || [1, 0.8, 0.65]) for (const pit of [pitch, pitch + 0.15, pitch + 0.3]) {
      const dd = dist * ds, hd = dd * Math.cos(pit);
      if (hd < minHd) continue;
      for (let k = 0; k <= 6; k++) for (const sg of k ? [1, -1] : [1]) {
        const yaw = yaw0 + sg * k * Math.PI / 6, ex = t.x + Math.cos(yaw) * hd, ez = t.z + Math.sin(yaw) * hd, fn = faceOf(yaw);
        let n = 0, fb = 0; const bl = [];
        list.forEach(b => { if (obstructs(b, ex, ez, t)) { n += b.rc; bl.push(b); } if (fallBlocked(b, t, fn, len)) fb++; });
        /* Sichtlinien: vor dem ersten Treffer (Kamera hoch/weit) und danach (näher, auf Kerbhöhe) – zum Stammfuß, zur Mitte, seitlich */
        let oc = 0;
        const rtx = Math.sin(yaw), rtz = -Math.cos(yaw);
        [[ty0 + Math.sin(pit) * dd, hd], [0.62 + Math.sin(pit) * dd * 0.78, hd * 0.78]].forEach(([ey, h2]) => {
          const E = [t.x + Math.cos(yaw) * h2, ey, t.z + Math.sin(yaw) * h2];
          oc += eyeCost(O, E);
          [[0.12, 0], [0.12, 0.8 * r], [0.12, -0.8 * r], [0.6, 0], [1.05, 0]].forEach(([py, lat]) => {
            oc += sightCost(O, E, [t.x + rtx * lat, py, t.z + rtz * lat]) * (py < 0.5 ? 1 : 0.6);
          });
        });
        const score = n * 10 + fb * 4 + oc + k * 0.8 + (ds < 1 ? 1.2 : 0) * (1 + (1 - ds) * 2) + (pit - pitch) * 5;
        if (!best || score < best.score) best = { score, yaw, bl, fb, dist: dd, pitch: pit, oc };
      }
    }
    return best;
  }

  function begin(t, toolId, opt) {
    if (!can()) return null;
    opt = opt || {};
    const isAxe = /^axe/.test(toolId || "");                       /* v93: axe1/axe2 = Axt, sonst Kettensäge */
    const R = FV.R, c = R.cam, sz = t.sz || 1, e = WV.trees.get(t.id);
    FV.focusId = (FV.focusId || 0) + 1; FV.focusing = false;
    const saved = camOf(c);
    saved.fov = c.fov || 0.55;
    const r = trunkR(t);
    /* Axt: der Waldarbeiter steht eine Armlänge plus Stiel vor dem Stamm und schaut leicht von oben auf die Kerbe (Kniehöhe) */
    const ny0 = Math.round((0.34 + 0.03 * sz) * 50) / 50;
    const goal = isAxe ? { tx: t.x, ty: ny0 + 0.12, tz: t.z, dist: 1.42 + 0.5 * r, pitch: 0.5, yaw: c.yaw, fov: 0.9 }
      : { tx: t.x, ty: 0.5 + 0.05 * sz, tz: t.z, dist: 2.5 + 0.25 * sz + 3.4 * r, pitch: 0.17, yaw: c.yaw, fov: 0.85 };
    const view = pickView(t, c.yaw, goal.dist, goal.pitch, isAxe ? { minHd: r + 0.7, ds: [1, 1.15] } : null);
    goal.dist = view.dist; goal.pitch = view.pitch;
    goal.yaw = c.yaw + Math.atan2(Math.sin(view.yaw - c.yaw), Math.cos(view.yaw - c.yaw));     /* kürzester Weg */
    const fn = faceOf(goal.yaw);
    const sh0 = r * (isAxe ? 1.25 : 0.9);
    goal.tx += fn[0] * sh0; goal.tz += fn[1] * sh0;     /* Blick leicht nach rechts auf die Kerbseite (Axt: etwas mehr, der Stamm ist nah) */
    X = { t, e, saved, goal, r, mode: "in", p: 0, cur: Object.assign({}, saved), sh: null, kick: 0, lunge: 0, notchY: null, nodes: [], toolId, dirx: fn[0], dirz: fn[1], nfx: fn[0], nfz: fn[1], fryN: Math.atan2(fn[0], fn[1]), fallRy: Math.atan2(fn[0], fn[1]), fallBlock: view.fb > 0, vib: 0,
      axe: isAxe, cutN: 0, chips: [], sw: null, at: 0 };
    if (isAxe) X.notchY = ny0;
    FV.fp = X;
    X.hideReal = []; X.hideBg = [];
    view.bl.forEach(b => {
      if (b.real) { const en = WV.trees.get(b.real.id); if (en) X.hideReal.push(en); }
      else if (b.bg) X.hideBg.push(b);
    });
    document.body.classList.add("fp3d");
    if (e) { X.sway0 = e.node.sway; e.node.sway = 0; X.vis0 = e.node.visible; }
    const add = (mesh, o) => { const n = fnode(mesh, Object.assign({ shadow: false }, o)); R.nodes.push(n); X.nodes.push(n); return n; };
    /* klarer Nahaufnahme-Stamm: verdeckt Äste und Nadeln, damit Zone und Schnitt gut lesbar sind */
    const T = (FWM.TREE_C && FWM.TREE_C[t.sp]) || { bark: 0x8a6a4a, mark: 0x6a4c33 };
    const info = realInfo(t, X.fryN);
    if (info) info.seed = t.id * 0.731;
    X.sty = barkStyle(t.sp, t.sz, r * 1.04, t.s || 1, info);
    X.trunk = add(fmesh("fp_tr0_" + t.id + "_" + t.sp, () => plainTrunk(T.bark, 1, X.sty)), { x: t.x, z: t.z, y: 0, ry: X.fryN, s: r * 1.04 });
    const vt = goal.ty + 0.5 * goal.dist, rcr = 0.5 + 1.2 * r;   /* grobe Oberkante des Bildes – die Krone muss darüber bleiben */
    X.topH = info ? Math.max(info.tp[2] * (t.s || 1), 2.1) : vt + 0.9;       /* Stammhöhe wie am Spielbaum (mindestens bis über die Kerbzone) */
    X.trunk.mesh = fmesh("fp_tr1_" + t.id + "_" + t.sp, () => plainTrunk(T.bark, X.topH / (r * 1.04), X.sty));
    const TL = (FWM.TREE_C && FWM.TREE_C[t.sp]) || { leaf: 0x4b7c2b };
    const conif = t.sp === "fichte" || t.sp === "kiefer";
    /* Nadelbäume: gestaffelte Etagen aus Kegeln (bis fast zum Boden), Laubbäume: Kugelkrone */
    if (info) {
      const ck = "fp_crw_" + t.id + "_" + t.sp;
      X.crown = add(fmesh(ck, () => crownMesh(info, t, X.fryN)), { x: t.x, z: t.z, y: 0, ry: X.fryN, s: t.s || 1, cull: false });
      X.realCrown = true; X.crownY = 0;
    } else X.crown = add(fmesh("fp_cr_" + t.sp, () => {
      const b = new G3.MB();
      if (conif) { const L = [TL.leaf, TL.leaf2 || TL.leaf, TL.leaf3 || TL.leaf]; for (let i = 0; i < 4; i++) b.cone(1.5 - i * 0.28, 1.5, 9, L[i % 3], { y: i * 0.95, nobot: false }); }
      else b.ico(1, TL.leaf, { jitter: 0.35 });
      return b;
    }), conif ? { x: t.x, z: t.z, y: vt - 0.3, s: 0.45 + 1.2 * r, cull: false } : { x: t.x, z: t.z, y: vt + rcr * 0.8, s: rcr, cull: false });
    if (!info) X.crownY = conif ? vt - 0.3 : vt + rcr * 0.8;
    X.keys = ["fp_tr0_" + t.id + "_" + t.sp, "fp_tr1_" + t.id + "_" + t.sp];
    if (info) X.keys.push("fp_crw_" + t.id + "_" + t.sp);
    X.nt = add(fmesh("fp_tk_dummy", () => notchMesh(1, T.bark)), { visible: false, cull: false });
    X.ntw = add(fmesh("fp_tw_dummy", () => notchMesh(1, T.bark, true)), { visible: false, cull: false, glow: 1 });
    X.bark = T.bark; X.kpv = X.kpT = isAxe ? clampN(opt.kp || 0, 0, 1) : 0;        /* angeschlagener Baum: der Kerb ist schon da */
    if (isAxe) {
      /* Entsprechung zu camera.add(axeGroup): ein Knoten ohne Mesh folgt der Kamera (Lage = Auge, Drehung = Blickrichtung),
         die Axt hängt als Kind daran und wird in Kamera-Koordinaten bewegt (x rechts, y oben, −z nach vorn). */
      X.rig = add(null, { cull: false, visible: false });
      X.axG = R.addChild(X.rig, fnode(fmesh("fp93_" + toolId, () => axeMesh(toolId)), { cull: false, shadow: false, glow: 0.18 }));
    } else {
    /* Reihenfolge = Zeichenreihenfolge beim Einblenden (durchsichtig): erst Spitze, dann Schiene, zuletzt das nahe Gehäuse */
    X.nose = add(fmesh("fp4_nose", sawNose), { cull: false, shadow: false, s: 0.4, visible: false });
    X.bar = add(fmesh("fp4_bar", sawBar), { cull: false, shadow: false, s: 0.4, visible: false });
    X.tool = add(fmesh("fp4_" + toolId, () => sawBody(toolId)), { cull: false, shadow: false, s: 0.4, visible: false });
    }
    X.zone = add(unit("fp_u_g", 0x47b84f), { alpha: 0.42, glow: 0.5, visible: false });
    X.perf = add(unit("fp_u_y", 0xffd23f), { alpha: 0.6, glow: 0.7, visible: false });
    X.mark = add(unit("fp_u_r", 0xe2465f), { alpha: 0.95, glow: 0.4, visible: false });
    X.notchD = add(unit("fp_u_nd", 0x120a05), { visible: false });
    X.notchL = add(unit("fp_u_nl", 0xffe9b0), { visible: false });
    X.rim = add(unit("fp_u_rm", 0xf6e4b8), { visible: false });
    X.slit = add(unit("fp_u_sl", 0x1c1008), { visible: false });
    /* Hitze-Anzeige an der Säge: dunkler Balken, darauf grün/orange/rot je nach Hitze */
    X.hBg = add(unit("fp_u_hb", 0x1a1a1f), { visible: false });
    X.hG = add(unit("fp_u_hg", 0x47b84f), { visible: false, glow: 0.5 });
    X.hO = add(unit("fp_u_ho", 0xffa21f), { visible: false, glow: 0.6 });
    X.hR = add(unit("fp_u_hr", 0xe2331f), { visible: false, glow: 0.9 });
    const ov = document.getElementById("farmAngel");
    if (ov) { X.gauge = document.createElement("div"); X.gauge.className = "fp-gauge"; X.gauge.innerHTML = "<span>🌡️</span><i><em></em></i>"; ov.appendChild(X.gauge); X.gfill = X.gauge.querySelector("em"); }
    if (ov) { X.hint = document.createElement("div"); X.hint.className = "fp-hint"; ov.appendChild(X.hint); }
    if (e) { X.t0ry = e.node.ry; X.t0rx = e.node.rx || 0; }
    return X;
  }

  /* Blickrichtung der Kamera aus ihren Werten (wie gl3d.js) */
  function basis(c) {
    const cp = Math.cos(c.pitch), eye = [c.tx + Math.cos(c.yaw) * cp * c.dist, c.ty + Math.sin(c.pitch) * c.dist, c.tz + Math.sin(c.yaw) * cp * c.dist];
    let f = [c.tx - eye[0], c.ty - eye[1], c.tz - eye[2]];
    const l = Math.hypot(f[0], f[1], f[2]) || 1; f = f.map(v => v / l);
    const rt = [-f[2], 0, f[0]], rl = Math.hypot(rt[0], rt[2]) || 1; rt[0] /= rl; rt[2] /= rl;
    const up = [rt[1] * f[2] - rt[2] * f[1], rt[2] * f[0] - rt[0] * f[2], rt[0] * f[1] - rt[1] * f[0]];
    return { eye, f, rt, up };
  }

  function ev(name, st) {
    if (!X) return;
    const now = performance.now() / 1000;
    if (name === "miss") { X.sh = { t0: now, amp: 0.07 }; X.kick = 1; }
    else if (name === "notch") {
      if (X.notchY == null) X.notchY = Math.round((GY0 + st.mk * GH) * 50) / 50;
      X.kpT = st.hits >= (st.need || 1) ? 0.6 : 0.3; X.lunge = 1; X.sh = { t0: now, amp: st.p1 > 0.95 ? 0.035 : 0.02 };
      chips(st.p1 > 0.95 ? 16 : 10, X.notchY, 0);
    }
    else if (name === "stall") { X.sh = { t0: now, amp: 0.05 }; X.kick = 1; smoke(); }
    else if (name === "swing" && X.axe) {
      /* v93: neuer Axtschlag. Hat der vorige das Holz noch nicht erreicht, zählt sein Treffer sofort (nichts geht verloren). */
      const info = arguments[2] || {};
      if (X.sw && (X.sw.ph === "wind" || X.sw.ph === "strike")) axeHit(X.sw);
      const miss = !(info.q > 0.5);
      X.sw = { ph: "wind", t: 0, q: info.q || 0, kp: info.kp || 0, T: axeTarget(X.cutN % 2 ? "sole" : "roof", miss), from: X.pose || null };
    }
  }
  /* Späne: kleine gelb-braune Würfel (shape 1) an der Vorderseite des Stamms */
  function front(lat) {
    const t = X.t, r = X.r;
    return [t.x + X.dirx * r + X.rtx * lat, t.z + X.dirz * r + X.rtz * lat];
  }
  function chips(n, y, lat) {
    if (!FV.R) return;
    const p = front(lat || 0);
    FV.R.burst({ x: p[0], y, z: p[1], n, col: [[0.95, 0.82, 0.45, 1], [0.78, 0.58, 0.32, 1], [0.62, 0.42, 0.24, 1]], speed: 1.6, up: 1.5, size: 0.06, shape: 1, life: 0.9 });
  }
  function smoke() {
    if (!FV.R || !X) return;
    const c = FV.R.cam, b = basis(c), p = X.tool;
    for (let i = 0; i < 5; i++) FV.R.emit({ x: p.x, y: p.y + 0.2, z: p.z, vx: (Math.random() - 0.5) * 0.4, vy: 0.8, vz: (Math.random() - 0.5) * 0.4, life: 0.9, size: 0.1, size2: 0.35, col: [0.55, 0.55, 0.58, 0.6], drag: 0.3 });
  }

  /* ---- v93: Axtschlag ----
     Je Schlag: Ausholen (0,15 s – Axt nach oben-rechts zurück, Hände 15 cm höher) → Schlag (0,10 s, beschleunigt im Bogen
     um die Hände, Hände 25 cm nach vorn) → Treffer (Späne, kurzes Wackeln, Kerb tiefer) → zurück in die Ruhelage (0,3 s).
     Abwechselnd Dachschnitt (Schneide kommt 45° von oben rechts) und Sohlenschnitt (waagerecht). Alle Lagen sind
     Kamera-Koordinaten; der Trefferpunkt kommt aus der echten Kerbform (gleiche Rechnung wie notchMesh). */
  const AX_T = { wind: 0.15, strike: 0.1, hit: 0.06, back: 0.3 };
  function kerbDepth() { const q = X.kpv > 0.02 ? Math.max(1, Math.min(KQ, Math.round(X.kpv * KQ))) : 0; return KMAX * q / KQ; }
  /* Punkt am Kerb-Stamm (Einheiten wie notchMesh: Höhe über der Sohle, Tiefe z; 1 = Rinde) → Welt, mit Verjüngung und Neigung */
  function kerbW(yOffU, zU) {
    const sc = X.r * 1.04, yU = X.notchY / sc + yOffU, tp = X.sty && X.sty.tp;
    let x = 0, z = zU;
    if (tp) { x = tp.lx * yU; z = zU * tp.f(yU) + tp.lz * yU; }
    const T0 = X.tiltT || 0, d = (X.tiltR != null ? X.tiltR : 0) - X.fryN;
    const v = rotV([x * sc, yU * sc, z * sc], T0 * Math.cos(d), X.fryN, -T0 * Math.sin(d));
    return [X.t.x + v[0], v[1], X.t.z + v[2]];
  }
  /* Ziel eines Schlags: Dach = Mitte der schrägen Dachfläche, Sohle = Mitte der waagerechten Sohle; daneben = Rinde über/unter dem Kerb */
  function axeTarget(kind, miss) {
    const sc = X.r * 1.04, d = kerbDepth(), ym = d * KS, zc = 1 - d, nf = [X.nfx, 0, X.nfz];
    let P, e;
    if (kind === "roof") {
      const y = miss ? ym + 0.15 / sc : Math.max(0.03 / sc, ym * 0.55);
      P = kerbW(y, miss ? 1 : zc + y / KS); e = v3.n([-nf[0], -1, -nf[2]]);
    } else {
      const y = miss ? -0.13 / sc : 0.02 / sc;
      P = kerbW(y, miss ? 1 : zc + Math.min(d, 0.03 / sc)); e = [-nf[0], 0, -nf[2]];      /* waagerecht an die Kerbspitze */
    }
    return { P, e, kind, miss };
  }
  const camOfB = B => m3cols(B.rt, B.up, v3.sc(B.f, -1));              /* Kameraraum → Welt (Spalten: rechts, oben, hinten) */
  const blendP = (p, q, k) => ({ H: v3.lerp(p.H, q.H, k), Q: qSlerp(p.Q, q.Q, k) });
  /* Ruhelage: Hände unten am Bildrand rechts der Mitte, Stiel schräg nach vorn-oben, Schneide zeigt auf den Kerb */
  function axeIdle(C, B, T, tf, asp) {
    const zH = 0.66, br = Math.sin(X.at * 1.7), H = [Math.max(0.06, 0.42 * zH * tf * asp), -1.0 * zH * tf + 0.005 * br, -zH];
    const head = [H[0] + 0.12, 0.03 + 0.006 * br, -1.24], K = m3tv(C, v3.sub(T.P, B.eye));
    return { H, Q: frameQ(v3.sub(head, H), v3.sub(K, head), true) };
  }
  /* Treffer: die Mitte der Schneide sitzt 12 mm tief im Holz, die Schneide zeigt genau in Schlagrichtung */
  function axeImpact(C, B, T, idle) {
    const P = m3tv(C, v3.sub(v3.add(T.P, v3.sc(T.e, 0.012)), B.eye)), e = v3.n(m3tv(C, T.e));
    const Hp = v3.add(idle.H, [0.02, -0.02, -0.25]);
    const Q = frameQ(v3.sub(P, Hp), e, false);
    return { H: v3.sub(P, m3v(mOfQ(Q), AXE_EDGE)), Q, e };
  }
  /* Ausholen: kurz und im Bild – Hände 15 cm höher (etwas nach rechts/zurück), die Axt halb in die Lage des Schnitttyps gedreht
     (Dach: Schneide 45° nach unten, Sohle: waagerecht) und dann um die Hände zurückgekippt (gegen die Schlagrichtung) */
  const WIND_MIX = 0.6, WIND_BACK = 0.32;
  function axeWind(imp, idle) {
    const h = m3v(mOfQ(imp.Q), [0, 1, 0]), a = v3.n(v3.cr(h, imp.e));
    return { H: v3.add(idle.H, [0.01, 0.15, 0.03]), Q: qMul(qAx(a, -WIND_BACK), qSlerp(idle.Q, imp.Q, WIND_MIX)) };
  }
  function axeHit(sw) {
    if (sw.done) return;
    sw.done = true;
    const T = sw.T;
    if (!T.miss) { X.kpT = Math.max(X.kpT, sw.kp); X.kpv = X.kpT; X.cutN++; }
    X.sh = { t0: performance.now() / 1000, amp: T.miss ? 0.016 : sw.q === 1 ? 0.013 : 0.009, dur: 0.1, y: true };
    axeChips(T, T.miss ? 5 : sw.q === 1 ? 12 : 9, T.miss);
    if (typeof sfx === "function") sfx(T.miss ? "bad" : "chop");
  }
  function axeTool(dt, B) {
    const R = FV.R, c = R.cam, C = camOfB(B), tf = Math.tan((c.fov || 0.9) / 2), asp = (R.w && R.h) ? R.w / R.h : 0.6;
    X.at += dt;
    const idle = axeIdle(C, B, axeTarget(X.cutN % 2 ? "sole" : "roof", false), tf, asp);
    let pose = idle;
    const sw = X.sw;
    if (sw) {
      if (!sw.from) sw.from = idle;
      sw.t += dt;
      const imp = axeImpact(C, B, sw.T, idle), wind = axeWind(imp, idle), h = m3v(mOfQ(imp.Q), [0, 1, 0]), a = v3.n(v3.cr(h, imp.e));
      const tHit = sw.T.miss ? 0.03 : AX_T.hit, tBack = sw.T.miss ? 0.24 : AX_T.back;
      if (sw.ph === "wind") { const k = Math.min(1, sw.t / AX_T.wind); pose = blendP(sw.from, wind, ss(k)); if (k >= 1) { sw.ph = "strike"; sw.t -= AX_T.wind; } }
      if (sw.ph === "strike") { const k = Math.min(1, sw.t / AX_T.strike); pose = blendP(wind, imp, Math.pow(k, 1.8)); if (k >= 1) { sw.ph = "hit"; sw.t -= AX_T.strike; axeHit(sw); } }
      if (sw.ph === "hit") {
        const k = Math.min(1, sw.t / tHit);
        pose = { H: imp.H, Q: qMul(qAx(a, 0.035 * Math.sin(sw.t * 95) * (1 - k)), imp.Q) };     /* Stiel federt im Holz nach */
        if (k >= 1) { sw.ph = "back"; sw.t -= tHit; }
      }
      if (sw.ph === "back") {
        const k = Math.min(1, sw.t / tBack);
        pose = blendP(imp, idle, ss(k));
        if (sw.T.miss) pose.Q = qMul(qAx(a, -0.5 * Math.sin(Math.PI * Math.min(1, k * 1.6))), pose.Q);   /* daneben: prallt ab */
        if (k >= 1) X.sw = null;
      }
    }
    /* Testhilfe: feste Lage (Phase, Anteil) für Standbilder */
    if (X.freeze) {
      const fz = X.freeze, T = fz.T || (fz.T = axeTarget(fz.kind || "roof", !!fz.miss)), imp = axeImpact(C, B, T, idle), wind = axeWind(imp, idle);
      pose = fz.ph === "wind" ? blendP(idle, wind, ss(fz.k)) : fz.ph === "strike" ? blendP(wind, imp, Math.pow(fz.k, 1.8)) : fz.ph === "hit" ? imp : idle;
      X.dbg = { T, imp, C, eye: B.eye };
    }
    X.pose = pose;
    const ready = X.mode === "hold" || (X.mode === "in" && X.p >= 1);
    X.app = clampN((X.app || 0) + (ready ? dt / 0.4 : -dt / 0.2), 0, 1);
    const ap = 1 - Math.pow(1 - X.app, 3), rg = X.rig, ax = X.axG, E = eulOf(mOfQ(pose.Q));
    rg.visible = X.mode !== "out" && X.app > 0.01;
    rg.x = B.eye[0]; rg.y = B.eye[1]; rg.z = B.eye[2];
    rg.rx = Math.asin(clampN(B.f[1], -1, 1)); rg.ry = Math.atan2(-B.f[0], -B.f[2]); rg.rz = 0;
    ax.x = pose.H[0]; ax.y = pose.H[1] - (1 - ap) * 0.4; ax.z = pose.H[2];
    ax.rx = E.rx; ax.ry = E.ry; ax.rz = E.rz; ax.alpha = ap > 0.99 ? 1 : ap;
  }
  /* Holzsplitter: echte kleine Quader (helles Holz #E5C396, einige mit Rinde), fliegen seitlich aus dem Kerbmund,
     drehen sich, fallen, springen kurz auf und bleiben liegen, dann schrumpfen sie weg. Höchstens 36 gleichzeitig. */
  function axeChips(T, n, miss) {
    const o = [X.nfx, 0, X.nfz], tg = [-X.nfz, 0, X.nfx], R = FV.R;
    const mW = fmesh("fp93_chip", () => { const b = new G3.MB(); b.box(1, 1, 1, 0xe5c396, { c: true, top: 0xecd0a8 }); return b; });
    const mB = fmesh("fp93_chipb_" + X.bark, () => { const b = new G3.MB(); b.box(1, 1, 1, 0xe5c396, { c: true, top: X.bark }); return b; });
    for (let i = 0; i < n; i++) {
      let c = X.chips.find(k => !(k.life > 0));
      if (!c) {
        if (X.chips.length >= 36) c = X.chips.reduce((a, b) => (a.t / a.life > b.t / b.life ? a : b));
        else { c = { n: fnode(mW, { shadow: false, cull: false, glow: 0.45 }) };       /* leicht selbstleuchtend wie das Kerbholz – sonst wirken sie im Gegenlicht grau */ R.nodes.push(c.n); X.nodes.push(c.n); X.chips.push(c); }
      }
      const bark = miss || Math.random() < 0.2, rnd = Math.random;
      c.n.mesh = bark ? mB : mW;
      const sp = (miss ? 0.8 : 1.4) + rnd() * 1.3, sd = (rnd() - 0.5) * 1.8, up = (T.kind === "roof" ? 0.3 : 0.9) + rnd() * 1.3;
      c.p = v3.add(T.P, v3.add(v3.sc(o, 0.02), v3.sc(tg, (rnd() - 0.5) * 0.06)));
      c.v = [o[0] * sp + tg[0] * sd, up, o[2] * sp + tg[2] * sd];
      c.r = [rnd() * 6.3, rnd() * 6.3, rnd() * 6.3]; c.w = [(rnd() - 0.5) * 34, (rnd() - 0.5) * 20, (rnd() - 0.5) * 34];
      const k = miss ? 0.7 : 1;
      c.s = [(0.03 + rnd() * 0.025) * k, (0.006 + rnd() * 0.005) * k, (0.016 + rnd() * 0.016) * k];
      c.t = 0; c.life = 0.85 + rnd() * 0.5; c.rest = false;
    }
  }
  function stepChips(dt) {
    for (const c of X.chips) {
      if (!(c.life > 0)) continue;
      c.t += dt;
      const n = c.n;
      if (c.t >= c.life) { c.life = 0; n.visible = false; continue; }
      if (!c.rest) {
        c.v[1] -= 9.81 * dt;
        const k = Math.max(0, 1 - 0.6 * dt); c.v[0] *= k; c.v[2] *= k;
        c.p = v3.add(c.p, v3.sc(c.v, dt)); c.r = v3.add(c.r, v3.sc(c.w, dt));
        const fl = c.s[1] * 0.5 + 0.004;
        if (c.p[1] < fl) {
          c.p[1] = fl;
          if (Math.abs(c.v[1]) < 0.7) { c.rest = true; c.r[0] = Math.round(c.r[0] / Math.PI) * Math.PI; c.r[2] = Math.round(c.r[2] / Math.PI) * Math.PI; }
          else { c.v[1] *= -0.3; c.v[0] *= 0.5; c.v[2] *= 0.5; c.w = v3.sc(c.w, 0.5); }
        }
      }
      const f = Math.min(1, (c.life - c.t) / 0.25);
      n.visible = true; n.x = c.p[0]; n.y = c.p[1]; n.z = c.p[2]; n.rx = c.r[0]; n.ry = c.r[1]; n.rz = c.r[2];
      n.sx = c.s[0] * f; n.sy = c.s[1] * f; n.sz = c.s[2] * f;
    }
  }

  function step(dt, time) {
    if (!X) return;
    const R = FV.R, c = R.cam, t = X.t, st = typeof MG !== "undefined" && MG.on && (MG.kind === "saw" || MG.kind === "axe") ? MG.st : null;
    /* Kamera: hin – halten – zurück */
    if (X.mode === "in") { X.p = Math.min(1, X.p + dt / 0.95); CAM_KEYS.forEach(k => { X.cur[k] = lerp(X.saved[k], X.goal[k], ss(X.p)); }); if (X.p >= 1) X.mode = "hold"; }
    else if (X.mode === "hold") {
      /* nach dem ersten Treffer näher an die Kerbe heranfahren */
      if (X.notchY != null && !X.axe) { X.goal.ty = X.notchY + 0.04; X.goal.dist = (X.dist0 || (X.dist0 = X.goal.dist)) * 0.78; }
      CAM_KEYS.forEach(k => { X.cur[k] += (X.goal[k] - X.cur[k]) * Math.min(1, dt * 3); });
    }
    else if (X.mode === "out") {
      X.p = Math.min(1, X.p + dt / 1.25);
      CAM_KEYS.forEach(k => { X.cur[k] = lerp(X.from[k], X.saved[k], ss(X.p)); });
      if (X.p >= 1 && (!X.keepStand || (X.fall && X.fall.done) || performance.now() / 1000 - X.endAt > 3.5)) { finish(); return; }
    }
    /* Kamerawackeln (Fehlschlag, Kerb, Überhitzen) */
    let sx = 0, sy = 0;
    if (X.sh) {
      const a = (performance.now() / 1000 - X.sh.t0), k = Math.max(0, 1 - a / (X.sh.dur || 0.45));
      if (!k) X.sh = null;
      else if (X.sh.y) sy = Math.sin(a * 130) * X.sh.amp * k * k;      /* v93 Axt: kurzer Ruck auf der Hochachse, nach ~30 ms fast weg */
      else { sx = Math.sin(a * 55) * X.sh.amp * k; sy = Math.cos(a * 47) * X.sh.amp * 0.7 * k; }
    }
    CAM_KEYS.forEach(k => { c[k] = X.cur[k]; });
    const B0 = basis(c);
    c.tx += B0.rt[0] * sx; c.tz += B0.rt[2] * sx; c.ty += sy;
    FV.touchAt = performance.now();
    if (X.chips.length) stepChips(dt);
    if (X.fall) { fallStep(dt); return; }
    const B = basis(c);
    X.rtx = B.rt[0]; X.rtz = B.rt[2];
    const dl = Math.hypot(B.eye[0] - t.x, B.eye[2] - t.z) || 1;
    X.dirx = X.nfx; X.dirz = X.nfz;                      /* Kerb-Richtung (rechts im Bild), nicht die Blickrichtung */
    const fryC = Math.atan2((B.eye[0] - t.x) / dl, (B.eye[2] - t.z) / dl), fry = X.fryN, r = X.r, show = X.mode !== "out" && !!st;
    /* Ringe am Stamm */
    const ph = st ? st.ph : 0, W = 2 * r + 0.2;
    const place = (n, w, y0, h, vis) => { n.visible = vis; if (!vis) return; n.x = t.x; n.z = t.z; n.ry = fryC; n.sx = n.sz = w; n.y = y0; n.sy = Math.max(0.01, h); };
    const kerb = show && ph === 1;
    if (st && st.zc != null) {
      place(X.zone, W, GY0 + (st.zc - st.zh) * GH, st.zh * 2 * GH, kerb);
      place(X.perf, W + 0.05, GY0 + (st.zc - st.zh * 0.35) * GH, st.zh * 0.7 * GH, kerb);
      place(X.mark, W + 0.1, GY0 + st.mk * GH - 0.022, 0.044, kerb);
      const inz = Math.abs(st.mk - st.zc) <= st.zh;
      X.mark.glow = inz ? 0.9 : 0.35;
    } else { X.zone.visible = X.perf.visible = X.mark.visible = false; }
    /* kerbProgress: 0 … 1 – Tiefe des V-Kerbs; im Fällschnitt vertieft die Säge ihn bis zum Bruch */
    const ny = X.notchY, cutting = show && ph === 2, pr = st ? Math.min(1, st.prog || 0) : 0;
    if (cutting) X.kpT = Math.max(X.kpT, 0.6 + 0.4 * pr);
    const dk = X.kpT - X.kpv;
    X.kpv += Math.sign(dk) * Math.min(Math.abs(dk), dt * (0.35 + Math.abs(dk) * 2.2));    /* gleichmäßig tiefer, am Ende weich */
    if (Math.abs(dk) > 0.01 && ny != null && !cutting && !X.axe) { if (Math.random() < dt * 14) chips(1, ny + X.kpv * KMAX * r * KS * 0.45, (Math.random() - 0.5) * r); X.sh = X.sh || { t0: performance.now() / 1000, amp: 0.012 }; }
    X.slit.visible = X.rim.visible = X.notchD.visible = X.notchL.visible = false;
    const depthW = X.kpv * KMAX * r * 1.04;               /* Tiefe in Metern */
    let aim;
    if (ny != null && X.kpv > 0.02) {
      const fp = front(0), sh = depthW * 0.9;
      aim = [fp[0] - X.dirx * sh, ny + depthW * KS * 0.4, fp[1] - X.dirz * sh];
      if (cutting && st.hold && !(st.stall > 0) && Math.random() < dt * 40) chips(1, ny + depthW * KS * 0.3, 0);
    } else {
      const y = kerb ? GY0 + st.mk * GH : ny != null ? ny : GY0 + 0.35, fp = front(0);
      aim = [fp[0], y, fp[1]];
    }
    if (!X.axe) {
    /* Säge: unten rechts im Bild, die Schiene zeigt auf die Zielstelle */
    X.kick = Math.max(0, X.kick - dt * 3.2); X.lunge = Math.max(0, X.lunge - dt * 2.6);
    const lg = X.lunge > 0 ? Math.sin(Math.min(1, X.lunge) * Math.PI) : 0;
    const run = cutting && st.hold && !(st.stall > 0);
    const dig = show && ph === 1 && ny != null && X.kpv < X.kpT - 0.015;      /* Kerb wird gerade eingesägt (Dach- bzw. Sohlenschnitt) */
    const work = run || dig;
    const vib = (work ? 0.012 : 0.0035) * Math.sin(time * 90) + (run ? 0.006 : 0.0015) * Math.sin(time * 61);
    /* Säge aus Sicht des Waldarbeiters (Referenzfoto): Gehäuse vorn unten im Bild (von hinten/oben gesehen, Griff zum Spieler),
       die Schiene läuft leicht schräg nach vorne in den Kerb und liegt flach auf der Sohle. Das Gehäuse hängt fest im Kameraraum
       (Viewmodel); die Schiene wird so lang gestreckt, dass ihre Spitze im Kerbmund steckt.
       Dachschnitt (1. Treffer): Rolle um die Längsachse, damit die Platte in der Dachfläche liegt. Sohlen-/Fällschnitt: flach.
       Beim Sägen schiebt sich die ganze Säge entlang der Schiene tiefer (Kerbtiefe + kleines Vor/Zurück), in Ruhe ein Stück zurück. */
    if (X.sa == null) X.sa = 0;
    X.sa += ((work ? 1 : 0) - X.sa) * (1 - Math.exp(-dt * 5));
    const sw = X.sa * X.sa * (3 - 2 * X.sa);
    const wantA = dig && (st.hits || 0) < 2 ? ROOF_ANG : 0;
    if (X.ang == null) X.ang = 0;
    X.ang += (wantA - X.ang) * (1 - Math.exp(-dt * 6));
    const near = Math.max(0.5, R.cam.dist * 0.2), zb = near * 1.35 + 0.25, sS = 0.3 * zb;
    const tf = Math.tan((R.cam.fov || 0.85) / 2), asp = (R.w && R.h) ? R.w / R.h : 0.6;
    const xb = zb * tf * asp * 0.3, yb = -zb * tf * 0.44;
    const Pb = [B.eye[0] + B.f[0] * zb + B.rt[0] * xb + B.up[0] * yb, B.eye[1] + B.f[1] * zb + B.rt[1] * xb + B.up[1] * yb, B.eye[2] + B.f[2] * zb + B.rt[2] * xb + B.up[2] * yb];
    const fm = front(0), yT = ny != null ? ny + 0.03 * sS : st && st.zc != null ? GY0 + st.zc * GH : aim[1];   /* vor dem 1. Treffer: Mitte des grünen Bereichs (ruhig, nicht der Markierung hinterher) */
    const tipB = [fm[0] - X.nfx * r * 0.1, yT, fm[1] - X.nfz * r * 0.1];          /* knapp im Kerbmund, auf der Sohle */
    let d = [tipB[0] - Pb[0], tipB[1] - Pb[1], tipB[2] - Pb[2]];
    const Lw = Math.hypot(d[0], d[1], d[2]) || 1; d = d.map(v => v / Lw);
    X.barL = X.barL == null ? Lw : X.barL + (Lw - X.barL) * Math.min(1, dt * 8);
    const osc = work ? (0.02 + 0.02 * (Math.sin(time * 9) * 0.5 + 0.5)) : 0;
    const push = (X.kpv * 0.45 * r + osc) * sw - (1 - sw) * 0.14 + lg * 0.06 - X.kick * 0.05;
    const ry = Math.atan2(d[0], d[2]), rx = -Math.asin(clampN(d[1], -1, 1));
    /* Rolle: Platte flach (Normale = oben) bzw. im Dachschnitt um X.ang zur Kerböffnung hin geneigt */
    const nd = [-X.nfx * Math.sin(X.ang), Math.cos(X.ang), -X.nfz * Math.sin(X.ang)], nk = nd[0] * d[0] + nd[1] * d[1] + nd[2] * d[2];
    const nn = [nd[0] - d[0] * nk, nd[1] - d[1] * nk, nd[2] - d[2] * nk];
    const X0 = rotV([1, 0, 0], rx, ry, 0), Y0 = rotV([0, 1, 0], rx, ry, 0);
    const rz = Math.atan2(-(nn[0] * X0[0] + nn[1] * X0[1] + nn[2] * X0[2]), nn[0] * Y0[0] + nn[1] * Y0[1] + nn[2] * Y0[2]) + vib * 3;
    /* Erst wenn die Kamera angekommen ist, kommt die Säge weich von unten ins Bild (nicht schon im Anflug mitfliegen) */
    const ready = !!st && (X.mode === "hold" || (X.mode === "in" && X.p >= 1));
    X.app = clampN((X.app || 0) + (ready ? dt / 0.4 : -dt / 0.2), 0, 1);
    const ap = 1 - Math.pow(1 - X.app, 3), drop = -(1 - ap) * zb * tf * 0.3;   /* einblenden + leicht von unten hereingleiten */
    const sh = [B.rt[0] * vib + B.up[0] * (vib * 0.6 + drop), B.rt[1] * vib + B.up[1] * (vib * 0.6 + drop) + Math.sin(time * 1.7) * 0.003, B.rt[2] * vib + B.up[2] * (vib * 0.6 + drop)];
    const P = [Pb[0] + d[0] * push + sh[0], Pb[1] + d[1] * push + sh[1], Pb[2] + d[2] * push + sh[2]];
    const off = rotV([0, 0.17, 0.31], rx, ry, rz);
    const tipW = [P[0] + d[0] * X.barL, P[1] + d[1] * X.barL, P[2] + d[2] * X.barL];
    const vis = X.mode !== "out" && X.app > 0.01;
    X.tool.visible = X.bar.visible = X.nose.visible = vis;
    X.tool.x = P[0] - off[0] * sS; X.tool.y = P[1] - off[1] * sS; X.tool.z = P[2] - off[2] * sS;
    X.bar.x = P[0]; X.bar.y = P[1]; X.bar.z = P[2];
    X.nose.x = tipW[0]; X.nose.y = tipW[1]; X.nose.z = tipW[2];
    [X.tool, X.bar, X.nose].forEach(n => { n.rx = rx; n.ry = ry; n.rz = rz; n.sx = n.sy = n.sz = sS; n.alpha = ap > 0.99 ? 1 : ap; });
    X.bar.sz = X.barL;
      if (work && Math.random() < dt * 28) R.emit({ x: fm[0], y: yT + 0.03, z: fm[1], vx: -d[0] * (1.0 + Math.random()) + B.rt[0] * (0.5 + Math.random() * 0.8), vy: 0.2 + Math.random() * 0.45, vz: -d[2] * (1.0 + Math.random()) + B.rt[2] * (0.5 + Math.random() * 0.8), g: -4, life: 0.6, size: 0.045, col: [0.95, 0.82, 0.5, 1], shape: 1 });
    } else axeTool(dt, B);                                   /* v93: Axt in der Hand statt Säge */
    /* Hitze-Anzeige (nur im Fällschnitt) */
    const showH = false, showG = show && ph === 2, heat = st ? clampN(st.heat || 0, 0, 1) : 0, stl = st && st.stall > 0;
    const hw = 0.5, hc = [B.eye[0] + B.f[0] * 1.1 + B.rt[0] * 0.3, B.eye[1] + B.f[1] * 1.1 + B.up[1] * 0.02, B.eye[2] + B.f[2] * 1.1 + B.rt[2] * 0.3];
    const hry = Math.atan2(-B.f[0], -B.f[2]);
    const hput = (n, w, off, vis, col) => { n.visible = vis; if (!vis) return; n.x = hc[0] + B.rt[0] * off; n.y = hc[1]; n.z = hc[2] + B.rt[2] * off; n.ry = hry; n.sx = Math.max(0.001, w); n.sy = 0.05; n.sz = 0.012; };
    hput(X.hBg, hw + 0.03, 0, showH);
    const fw = hw * Math.max(0.02, stl ? 1 : heat), foff = -hw / 2 + fw / 2;
    hput(X.hG, fw, foff, showH && !stl && heat < 0.6);
    hput(X.hO, fw, foff, showH && !stl && heat >= 0.6 && heat < 0.82);
    hput(X.hR, fw, foff, showH && (stl || heat >= 0.82));
    if (showH && (stl || heat > 0.72) && Math.random() < dt * (stl ? 14 : 6)) smoke();
    if (X.gauge) {
      X.gauge.classList.toggle("on", !!showG);
      X.gauge.classList.toggle("hot", !!stl || heat > 0.75);
      X.gfill.style.height = Math.round((stl ? 1 : heat) * 100) + "%";
    }
    /* Hinweis oben (kurz eingeblendet) */
    if (X.hint) {
      let tx = "", cls = "fp-hint";
      if (show && ph === 1) tx = (st.hits || 0) ? "Noch einmal – tiefer in den Stamm!" : "Tippen, wenn die Markierung im grünen Bereich ist";
      else if (show && ph === 2) { if (stl) { tx = "Überhitzt – kurz warten"; cls += " hot"; } else if (!X.heldOnce) tx = "Halten zum Sägen – loslassen kühlt den Motor"; else if (heat > 0.75) { tx = "Motor wird heiß – kurz loslassen!"; cls += " hot"; } }
      if (st && st.hold) X.heldOnce = true;
      if (!tx) cls += " off";
      if (X.hint.textContent !== tx && tx) X.hint.textContent = tx;
      if (X.hint.className !== cls) X.hint.className = cls;
    }
    X.trunk.visible = false;
    /* Erst kurz vor der Ankunft wird der echte Baum gegen den Nahaufnahme-Stamm getauscht – nicht schon im Anflug */
    const swap = X.mode === "hold" || (X.mode === "in" && X.p > 0.92) || !!X.keepStand;
    if (swap && !X.bgDone) {
      X.bgDone = true;
      X.hideBg = X.hideBg.filter(b => b.c.trees.indexOf(b.bg) >= 0);
      X.hideBg.forEach(b => b.c.trees.splice(b.c.trees.indexOf(b.bg), 1));
      [...new Set(X.hideBg.map(b => b.c))].forEach(c => bgChunkBuild(c));
    }
    if (X.e && X.e.node && swap) X.e.node.visible = false;
    if (swap) X.hideReal.forEach(en => { en.node.visible = false; });
    X.crown.visible = swap;
    if (X.realCrown) {       /* echte Krone: neigt sich wie die Stammteile um den Fuß */
      const T1 = X.tiltT || 0, d1 = (X.tiltR != null ? X.tiltR : 0) - fry, cn = X.crown;
      cn.x = t.x; cn.z = t.z; cn.y = 0; cn.ry = fry; cn.rx = T1 * Math.cos(d1); cn.rz = -T1 * Math.sin(d1);
    } else { X.crown.x = t.x + Math.sin(X.tiltR || 0) * X.crownY * Math.sin(X.tiltT || 0); X.crown.z = t.z + Math.cos(X.tiltR || 0) * X.crownY * Math.sin(X.tiltT || 0); }
    /* Der Baum verrät den Fall: neigt sich in Fallrichtung, knarrt/zittert, kurz vorm Fallen deutlich */
    if (X.axe && X.mode !== "out") { X.tiltR = X.fallRy; X.tiltT = X.kpv > 0.8 ? Math.pow((X.kpv - 0.8) / 0.2, 2) * 0.05 : 0; }  /* v93: Axt – die letzten Schläge lassen ihn sich neigen */
    if (X.e && X.e.node && st && st.dir) {
      const nd = X.e.node, p = ph === 2 ? Math.min(1, st.prog || 0) : 0, tl = p > 0.25 ? Math.pow((p - 0.25) / 0.75, 2) : 0;
      nd.sway = 0;
      if (tl > 0 && X.mode !== "out") {
        nd.ry = st.dir.ry; nd.rx = tl * 0.13;
        X.tiltT = nd.rx; X.tiltR = nd.ry;
        X.tilted = true;
      } else if (X.tilted && X.mode !== "out") { nd.ry = X.t0ry; nd.rx = X.t0rx; X.tiltT = 0; X.tilted = false; }
    }
    /* Stamm aus drei Teilen: unten, V-Kerb, oben – alle neigen sich mit dem Baum */
    const usePts = ny != null && X.kpv > 0.02 && swap;
    const sc = r * 1.04, q = Math.max(1, Math.min(KQ, Math.round(X.kpv * KQ)));
    [X.nt, X.ntw].forEach(n => { n.visible = usePts; });
    X.trunk.visible = !usePts && swap;
    if (X.trunk.visible) { X.trunk.x = t.x; X.trunk.z = t.z; }
    if (usePts) {
      const nyU = ny / sc, hU = X.topH / sc, key = t.id + "_" + q + "_" + Math.round(ny * 50);
      if (X.key !== key) {
        X.key = key;
        const k1 = "fp_tk_" + key, k2 = "fp_tw_" + key;
        X.nt.mesh = fmesh(k1, () => notchMesh(q, X.bark, false, nyU, hU, undefined, X.sty)); X.ntw.mesh = fmesh(k2, () => notchMesh(q, X.bark, true, nyU, hU, undefined, X.sty));
        X.keys.push(k1, k2);
      }
      const T0 = X.tiltT || 0, dl2 = (X.tiltR != null ? X.tiltR : 0) - fry;
      const trx = T0 * Math.cos(dl2), trz = -T0 * Math.sin(dl2);
      [X.nt, X.ntw].forEach(n => { n.x = t.x; n.z = t.z; n.y = 0; n.ry = fry; n.rx = trx; n.rz = trz; n.sx = n.sy = n.sz = sc; });
    }  }
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

  /* Hilfsteile weg, Baum wieder an die Stelle setzen, die Kamera ist zurück */
  function cleanNodes() {
    if (!X || !FV.R) return;
    X.nodes.forEach(n => { const i = FV.R.nodes.indexOf(n); if (i >= 0) FV.R.nodes.splice(i, 1); });
    X.nodes = [];
    if (X.e && X.e.node) X.e.node.visible = X.vis0 !== false;
    X.hideReal.forEach(en => { en.node.visible = true; });
    X.hideBg.forEach(b => { if (b.c.trees.indexOf(b.bg) < 0) b.c.trees.push(b.bg); });
    [...new Set(X.hideBg.map(b => b.c))].forEach(c => bgChunkBuild(c));
    (X.keys || []).forEach(k => { const m = FV.meshes[k]; if (m && FV.R.free) FV.R.free(m); delete FV.meshes[k]; });
    if (X.hint && X.hint.parentNode) X.hint.parentNode.removeChild(X.hint);
    if (X.gauge && X.gauge.parentNode) X.gauge.parentNode.removeChild(X.gauge);
    document.body.classList.remove("fp3d");
  }
  function finish() {
    const c = FV.R.cam;
    CAM_KEYS.forEach(k => { c[k] = X.saved[k]; });
    cleanNodes();
    FV.fp = null; X = null;
    if (typeof clampCam === "function") clampCam();
  }
  /* ---- Fall-Animation: der Baum knickt an der Sohle der Kerbe (rechts) ab und kippt nach rechts ----
     Unten bleibt der Stumpf stehen; oberes Stück + Krone drehen sich um den Drehpunkt L = Kerbsohle am Rand der Fallseite.
     Winkel: beschleunigt wie unter Schwerkraft (θ ~ t^2.2), am Boden rutscht der Stamm um den Rest nach unten. */
  function fall(t, dir, cb) {
    if (!X || !X.keepStand || X.t.id !== t.id || X.fall) return false;
    const R = FV.R, sc = X.r * 1.04, ny = X.notchY != null ? X.notchY : 0.5, q = Math.max(1, Math.min(KQ, Math.round(X.kpv * KQ)));
    const nyU = ny / sc, hU = X.topH / sc, kk = "fp_fl_" + X.key;
    const mk = (suffix, wood, part, o) => {
      const key = kk + suffix; X.keys.push(key);
      const n = fnode(fmesh(key, () => notchMesh(q, X.bark, wood, nyU, hU, part, X.sty)), Object.assign({ shadow: false, cull: false, x: t.x, z: t.z, ry: X.fryN, s: sc }, o || {}));
      R.nodes.push(n); X.nodes.push(n); return n;
    };
    X.nt.visible = X.ntw.visible = false; X.trunk.visible = false;
    /* der Stumpf bleibt: Form (Sohle + Bruchstufe) wird am Baum vermerkt, die Welt baut daraus den bleibenden Stumpf */
    t.cut = { sp: t.sp, sz: t.sz, s: t.s || 1, id: t.id, q, ny: Math.round(ny * 1000) / 1000, sc: Math.round(sc * 1000) / 1000, ry: Math.round(X.fryN * 1000) / 1000, bark: X.bark };
    X.fall = {
      t0: performance.now() / 1000, T: 1.75, cb, ny, zr: sc * 0.8, th0: X.tiltT || 0, done: false, landed: false,
      lowB: mk("_lb", false, "low"), lowW: mk("_lw", true, "low", { glow: 1 }),
      upB: mk("_ub", false, "up"), upW: mk("_uw", true, "up", { glow: 1 })
    };
    X.fall.up = [X.fall.upB, X.fall.upW];
    return true;
  }
  function fallStep() {
    const F = X.fall, t = X.t, now = performance.now() / 1000, el = Math.min(1, (now - F.t0) / F.T);
    const tmax = Math.PI / 2 * 0.985, th = F.th0 + (tmax - F.th0) * Math.pow(el, 2.2);
    const ny = F.ny, zr = F.zr, slip = (ny + zr - X.r) * Math.pow(el, 3) * 0.95, ry = X.fallRy;
    const place = (n, y0) => {
      const c = Math.cos(th), s = Math.sin(th), yp = (y0 - ny) * c + zr * s, zp = (y0 - ny) * s - zr * c;
      n.x = t.x + Math.sin(ry) * (zr + zp); n.z = t.z + Math.cos(ry) * (zr + zp); n.y = ny + yp - slip; n.ry = ry; n.rx = th; n.rz = 0; n.visible = !F.landed;
    };
    F.up.forEach(n => place(n, 0));
    X.crown.visible = !F.landed; place(X.crown, X.realCrown ? 0 : X.crownY);
    if (X.tool) X.tool.visible = X.bar.visible = X.nose.visible = false;
    if (X.rig) X.rig.visible = false;
    F.lowB.visible = F.lowW.visible = !F.landed;
    if (el >= 1 && !F.landed) {
      F.landed = true;
      X.keepStand = false;
      X.sh = { t0: now, amp: 0.05 };
      if (X.e && X.e.node) X.e.node.visible = X.vis0 !== false;
      try { F.cb && F.cb(); } catch (e) { /* egal */ }
      F.done = true;
    }
  }

  function end(done) {
    if (!X) return;
    if (X.axe && X.sw && !X.sw.done) axeHit(X.sw);          /* v93: der letzte Schlag zählt, auch wenn das Fenster schon schließt */
    if (done) { X.keepStand = true; X.endAt = performance.now() / 1000; }
    if (X.e && X.e.node && !done) X.e.node.visible = X.vis0 !== false;
    if (X.e && X.e.node && !done) { X.e.node.sway = X.sway0 != null ? X.sway0 : 0.22; if (X.t0ry != null) { X.e.node.ry = X.t0ry; X.e.node.rx = X.t0rx; } }
    /* Werkzeug und Ringe sofort weg, die Kamera schwenkt in 1,2 s zurück (der Baum fällt währenddessen) */
    X.nodes.forEach(n => { n.visible = false; });
    X.mode = "out"; X.p = 0; X.from = Object.assign({}, X.cur);
    X.mark.visible = X.zone.visible = X.perf.visible = false;
    document.body.classList.remove("fp3d");
  }
  /* bleibender Stumpf (Rinde + Holz in einem Mesh), wird von worldview.js für gefällte Bäume benutzt */
  function stumpMesh(c) { return notchMesh(c.q, c.bark, 2, c.ny / c.sc, 1, "low", barkStyle(c.sp, c.sz, c.sc, c.s || 1, { tp: trunkParams(c.sp, c.sz), seed: (c.id || 0) * 0.731 })); }
  /* Testhilfe (v93): feste Axtlage für Standbilder – SAW3D._freeze({ ph: "wind"|"strike"|"hit"|"idle", k, kind, miss }) bzw. null */
  function freeze(f) { if (X) X.freeze = f; return X ? X.dbg || null : null; }
  return { stumpMesh, can, begin, ev, step, end, fall, pick: pickView, _freeze: freeze, _axeMath: { frameQ, mOfQ, eulOf, qSlerp, axeMesh, rotV, AXE_EDGE }, get on() { return !!X; }, get ready() { return !!X && (X.app || 0) > 0.5; } };
})();
