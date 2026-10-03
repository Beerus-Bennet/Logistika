/* =========================================================================
   LOGISTIKA – gl3d.js
   Kleine WebGL2-Engine für die 3D-Hofansicht – ohne Fremdbibliothek.
   Low-Poly-Modelle mit Vertexfarben, Sonne mit weichen Schatten, Himmels-
   licht, Nebel am Rand, Wasser mit Glitzern, wiegende Pflanzen und
   Partikel (Staub, Rauch, Tropfen, Herzen).
   ========================================================================= */
const G3 = (() => {
  "use strict";

  /* ------------------------------- Mathe -------------------------------- */
  const ID = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  function mul(o, a, b) {
    const r = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let k = 0; k < 4; k++) {
        r[c * 4 + k] = a[k] * b[c * 4] + a[4 + k] * b[c * 4 + 1] + a[8 + k] * b[c * 4 + 2] + a[12 + k] * b[c * 4 + 3];
      }
    o.set(r);
    return o;
  }
  function persp(o, fovy, asp, n, f) {
    const t = 1 / Math.tan(fovy / 2);
    o.fill(0);
    o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = (2 * f * n) / (n - f);
    return o;
  }
  function ortho(o, l, r, b, t, n, f) {
    o.fill(0);
    o[0] = 2 / (r - l); o[5] = 2 / (t - b); o[10] = -2 / (f - n);
    o[12] = -(r + l) / (r - l); o[13] = -(t + b) / (t - b); o[14] = -(f + n) / (f - n); o[15] = 1;
    return o;
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  function lookAt(o, e, t, up) {
    const z = norm(sub(e, t)), x = norm(cross(up, z)), y = cross(z, x);
    o[0] = x[0]; o[1] = y[0]; o[2] = z[0]; o[3] = 0;
    o[4] = x[1]; o[5] = y[1]; o[6] = z[1]; o[7] = 0;
    o[8] = x[2]; o[9] = y[2]; o[10] = z[2]; o[11] = 0;
    o[12] = -dot(x, e); o[13] = -dot(y, e); o[14] = -dot(z, e); o[15] = 1;
    return o;
  }
  function invert(o, m) {
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3], a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7],
      a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11], a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10,
      b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12,
      b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30,
      b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return null;
    det = 1 / det;
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det; o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det; o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det; o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det; o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det; o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det; o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det; o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det; o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return o;
  }
  /* T · Ry · Rx · Rz · S */
  function trs(o, x, y, z, rx, ry, rz, sx, sy, sz) {
    const cy = Math.cos(ry), syy = Math.sin(ry), cx = Math.cos(rx), sxx = Math.sin(rx), cz = Math.cos(rz), szz = Math.sin(rz);
    /* R = Ry*Rx*Rz */
    const r00 = cy * cz + syy * sxx * szz, r01 = -cy * szz + syy * sxx * cz, r02 = syy * cx;
    const r10 = cx * szz, r11 = cx * cz, r12 = -sxx;
    const r20 = -syy * cz + cy * sxx * szz, r21 = syy * szz + cy * sxx * cz, r22 = cy * cx;
    o[0] = r00 * sx; o[1] = r10 * sx; o[2] = r20 * sx; o[3] = 0;
    o[4] = r01 * sy; o[5] = r11 * sy; o[6] = r21 * sy; o[7] = 0;
    o[8] = r02 * sz; o[9] = r12 * sz; o[10] = r22 * sz; o[11] = 0;
    o[12] = x; o[13] = y; o[14] = z; o[15] = 1;
    return o;
  }
  const xf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
  const xf4 = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12] * p[3], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13] * p[3],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14] * p[3], m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15] * p[3]];

  /* Farbe: 0xRRGGBB oder [r,g,b] → [r,g,b] 0..1 */
  function col(c) {
    if (Array.isArray(c)) return c;
    return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
  }
  const shade = (c, f) => [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)];
  /* kleiner deterministischer Zufall für Farbrauschen */
  let seed = 1;
  const srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* ---------------------------- Modellbau ------------------------------- */
  /* Alles sind flach schattierte Dreiecke mit Farbe – der Low-Poly-Look.
     Transformationen stapeln sich wie in einem Szenengraph.            */
  class MB {
    constructor() { this.v = []; this.M = ID(); this.stack = []; this.jit = 0; }
    /* lokale Transformation für die Dauer von fn */
    at(t, fn) {
      this.stack.push(this.M);
      const L = trs(new Float32Array(16), t.x || 0, t.y || 0, t.z || 0, t.rx || 0, t.ry || 0, t.rz || 0,
        t.sx || t.s || 1, t.sy || t.s || 1, t.sz || t.s || 1);
      this.M = mul(new Float32Array(16), this.M, L);
      fn(this);
      this.M = this.stack.pop();
      return this;
    }
    /* Farbrauschen 0..1 für die folgenden Teile (Holz, Gras, Laub) */
    noise(j, fn) { const o = this.jit; this.jit = j; fn(this); this.jit = o; return this; }
    tri(a, b, c, color, na, nb, nc) {
      const A = xf(this.M, a), B = xf(this.M, b), C = xf(this.M, c);
      let n = norm(cross(sub(B, A), sub(C, A)));
      const cc = col(color);
      const f = this.jit ? 1 + (srand() - 0.5) * this.jit : 1;
      const k = shade(cc, f);
      if (na) {
        const R = this.M;
        const tn = p => norm([R[0] * p[0] + R[4] * p[1] + R[8] * p[2], R[1] * p[0] + R[5] * p[1] + R[9] * p[2], R[2] * p[0] + R[6] * p[1] + R[10] * p[2]]);
        const n1 = tn(na), n2 = tn(nb), n3 = tn(nc);
        this.v.push(...A, ...n1, ...k, ...B, ...n2, ...k, ...C, ...n3, ...k);
      } else this.v.push(...A, ...n, ...k, ...B, ...n, ...k, ...C, ...n, ...k);
      return this;
    }
    quad(a, b, c, d, color) { this.tri(a, b, c, color); this.tri(a, c, d, color); return this; }
    /* Dreieck mit eigener Farbe je Ecke (weiche Verläufe: Wasser, Ufer) */
    triV(a, b, c, ca, cb, cc) {
      const A = xf(this.M, a), B = xf(this.M, b), C = xf(this.M, c);
      const n = norm(cross(sub(B, A), sub(C, A)));
      this.v.push(...A, ...n, ...col(ca), ...B, ...n, ...col(cb), ...C, ...n, ...col(cc));
      return this;
    }
    /* Quader: Grundfläche mittig auf y=0 (o.c = mittig in y) */
    box(w, h, d, color, o) {
      o = o || {};
      const go = () => {
        const x = w / 2, z = d / 2, y0 = o.c ? -h / 2 : 0, y1 = y0 + h;
        const top = o.top != null ? o.top : color, side = color, bot = o.bot != null ? o.bot : shade(col(color), 0.7);
        const p = [[-x, y0, -z], [x, y0, -z], [x, y0, z], [-x, y0, z], [-x, y1, -z], [x, y1, -z], [x, y1, z], [-x, y1, z]];
        this.quad(p[4], p[7], p[6], p[5], top);
        if (!o.nobot) this.quad(p[0], p[1], p[2], p[3], bot);
        const fr = o.front != null ? o.front : side;
        this.quad(p[3], p[2], p[6], p[7], fr);               /* +z vorn */
        this.quad(p[1], p[0], p[4], p[5], o.back != null ? o.back : side);  /* −z */
        this.quad(p[2], p[1], p[5], p[6], o.right != null ? o.right : side); /* +x */
        this.quad(p[0], p[3], p[7], p[4], o.left != null ? o.left : side);   /* −x */
      };
      return this._wrap(o, go);
    }
    /* Zylinder/Kegelstumpf: Boden auf y=0 */
    cyl(r1, r2, h, seg, color, o) {
      o = o || {};
      const go = () => {
        const top = o.top != null ? o.top : color;
        const a0 = o.a0 || 0;
        for (let i = 0; i < seg; i++) {
          const a = a0 + (i / seg) * Math.PI * 2, b = a0 + ((i + 1) / seg) * Math.PI * 2;
          const p1 = [Math.cos(a) * r1, 0, Math.sin(a) * r1], p2 = [Math.cos(b) * r1, 0, Math.sin(b) * r1];
          const q1 = [Math.cos(a) * r2, h, Math.sin(a) * r2], q2 = [Math.cos(b) * r2, h, Math.sin(b) * r2];
          const c = o.stripe && i % 2 ? o.stripe : color;
          if (o.smooth) {
            const k = (r1 - r2) / h;
            const na = norm([Math.cos(a), k, Math.sin(a)]), nb = norm([Math.cos(b), k, Math.sin(b)]);
            if (r2 > 0.0001) { this.tri(p1, q1, q2, c, na, na, nb); this.tri(p1, q2, p2, c, na, nb, nb); }
            else this.tri(p1, q1, p2, c, na, norm([Math.cos((a + b) / 2), k, Math.sin((a + b) / 2)]), nb);
          } else {
            if (r2 > 0.0001) this.quad(p1, q1, q2, p2, c);
            else this.tri(p1, q1, p2, c);
          }
          if (r2 > 0.0001 && !o.notop) this.tri([0, h, 0], q2, q1, top);
          if (!o.nobot) this.tri([0, 0, 0], p1, p2, shade(col(color), 0.7));
        }
      };
      return this._wrap(o, go);
    }
    cone(r, h, seg, color, o) { return this.cyl(r, 0, h, seg, color, o); }
    /* Kugel (mittig), seg Längen-, rings Breitenkreise */
    sphere(r, seg, rings, color, o) {
      o = o || {};
      const go = () => {
        const pt = (i, j) => {
          const th = (j / rings) * Math.PI, ph = (i / seg) * Math.PI * 2;
          return [Math.sin(th) * Math.cos(ph) * r, Math.cos(th) * r, Math.sin(th) * Math.sin(ph) * r];
        };
        for (let j = 0; j < rings; j++)
          for (let i = 0; i < seg; i++) {
            const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
            const cc = o.bottom && j >= rings / 2 ? o.bottom : color;
            if (o.smooth) {
              const n = p => [p[0] / r, p[1] / r, p[2] / r];
              if (j > 0) this.tri(a, b, c, cc, n(a), n(b), n(c));
              if (j < rings - 1) this.tri(a, c, d, cc, n(a), n(c), n(d));
            } else {
              if (j > 0) this.tri(a, b, c, cc);
              if (j < rings - 1) this.tri(a, c, d, cc);
            }
          }
      };
      return this._wrap(o, go);
    }
    /* Ikosaeder (Laub, Büsche, Steine) – jitter verbeult die Form */
    ico(r, color, o) {
      o = o || {};
      const go = () => {
        const t = (1 + Math.sqrt(5)) / 2;
        let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
        let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
          [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
        if (o.detail) {
          const cache = {};
          const mid = (a, b) => {
            const k = a < b ? a + "_" + b : b + "_" + a;
            if (cache[k] != null) return cache[k];
            V.push(norm([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2]));
            return (cache[k] = V.length - 1);
          };
          const F2 = [];
          F.forEach(([a, b, c]) => { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
          F = F2;
        }
        const j = o.jitter || 0;
        const P = V.map(v => { const k = 1 + (srand() - 0.5) * j; return [v[0] * r * k, v[1] * r * k * (o.flat || 1), v[2] * r * k]; });
        F.forEach(([a, b, c]) => {
          const cc = o.bottom && (P[a][1] + P[b][1] + P[c][1]) < -r * 0.6 ? o.bottom : color;
          this.tri(P[a], P[b], P[c], cc);
        });
      };
      return this._wrap(o, go);
    }
    /* Satteldach: First entlang x, Breite w (x), Tiefe d (z), Höhe h; Boden y=0 */
    roof(w, d, h, color, o) {
      o = o || {};
      const go = () => {
        const x = w / 2, z = d / 2, gable = o.gable != null ? o.gable : color, t = o.thick || 0.06;
        /* zwei Dachflächen (mit Dicke) */
        this.quad([-x, 0, z], [x, 0, z], [x, h, 0], [-x, h, 0], color);
        this.quad([x, 0, -z], [-x, 0, -z], [-x, h, 0], [x, h, 0], color);
        this.quad([-x, -t, z], [-x, 0, z], [-x, h, 0], [-x, h - t, 0], shade(col(color), 0.8));
        this.quad([x, 0, z], [x, -t, z], [x, h - t, 0], [x, h, 0], shade(col(color), 0.8));
        this.quad([-x, -t, z], [x, -t, z], [x, 0, z], [-x, 0, z], shade(col(color), 0.7));
        this.quad([x, -t, -z], [-x, -t, -z], [-x, 0, -z], [x, 0, -z], shade(col(color), 0.7));
        /* Giebeldreiecke */
        if (!o.nogable) {
          const gx = x - (o.inset || 0.12), gz = z - (o.inset || 0.12);
          this.tri([gx, 0, gz], [gx, 0, -gz], [gx, h - 0.04, 0], gable);
          this.tri([-gx, 0, -gz], [-gx, 0, gz], [-gx, h - 0.04, 0], gable);
        }
      };
      return this._wrap(o, go);
    }
    /* Mansarddach (Scheune): Knick bei k (0..1 Höhe), Boden y=0 */
    gambrel(w, d, h, color, o) {
      o = o || {};
      const go = () => {
        const x = w / 2, z = d / 2, k = o.k || 0.55, zi = z * (o.zi || 0.55), hk = h * k, gable = o.gable != null ? o.gable : color;
        this.quad([-x, 0, z], [x, 0, z], [x, hk, zi], [-x, hk, zi], color);
        this.quad([-x, hk, zi], [x, hk, zi], [x, h, 0], [-x, h, 0], shade(col(color), 1.08));
        this.quad([x, 0, -z], [-x, 0, -z], [-x, hk, -zi], [x, hk, -zi], color);
        this.quad([x, hk, -zi], [-x, hk, -zi], [-x, h, 0], [x, h, 0], shade(col(color), 1.08));
        const g = x - 0.1, gz = z - 0.1, gzi = zi - 0.06;
        [g, -g].forEach(s => {
          const P = [[s, 0, gz], [s, 0, -gz], [s, hk, -gzi], [s, h - 0.05, 0], [s, hk, gzi]];
          if (s > 0) { this.tri(P[0], P[1], P[2], gable); this.tri(P[0], P[2], P[4], gable); this.tri(P[4], P[2], P[3], gable); }
          else { this.tri(P[1], P[0], P[2], gable); this.tri(P[2], P[0], P[4], gable); this.tri(P[2], P[4], P[3], gable); }
        });
      };
      return this._wrap(o, go);
    }
    /* flaches Rechteck auf dem Boden (y = yo) */
    plate(w, d, color, o) {
      o = o || {};
      return this._wrap(o, () => {
        const x = w / 2, z = d / 2, y = o.y0 || 0;
        this.quad([-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z], color);
      });
    }
    /* Scheibe (Teich, Weg, Beet) */
    disc(r, seg, color, o) {
      o = o || {};
      return this._wrap(o, () => {
        for (let i = 0; i < seg; i++) {
          const a = (i / seg) * Math.PI * 2, b = ((i + 1) / seg) * Math.PI * 2;
          const ra = r * (1 + (o.wob ? Math.sin(a * 3 + 1) * o.wob : 0)), rb = r * (1 + (o.wob ? Math.sin(b * 3 + 1) * o.wob : 0));
          this.tri([0, 0, 0], [Math.cos(b) * rb, 0, Math.sin(b) * rb], [Math.cos(a) * ra, 0, Math.sin(a) * ra], color);
        }
      });
    }
    _wrap(o, go) {
      if (o.x || o.y || o.z || o.rx || o.ry || o.rz || o.s || o.sx || o.sy || o.sz) this.at(o, go);
      else go();
      return this;
    }
    add(other) { for (let i = 0; i < other.v.length; i++) this.v.push(other.v[i]); return this; }
    /* anderes Modell mit Lage t (x, y, z, ry, s) einfügen – für große, starre Kulissen */
    merge(other, t) {
      const M = trs(new Float32Array(16), t.x || 0, t.y || 0, t.z || 0, t.rx || 0, t.ry || 0, t.rz || 0, t.s || 1, t.s || 1, t.s || 1);
      const v = other.v, out = this.v;
      for (let i = 0; i < v.length; i += 9) {
        const x = v[i], y = v[i + 1], z = v[i + 2], a = v[i + 3], b = v[i + 4], c = v[i + 5];
        out.push(M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]);
        const nx = M[0] * a + M[4] * b + M[8] * c, ny = M[1] * a + M[5] * b + M[9] * c, nz = M[2] * a + M[6] * b + M[10] * c;
        const l = Math.hypot(nx, ny, nz) || 1;
        out.push(nx / l, ny / l, nz / l, v[i + 6], v[i + 7], v[i + 8]);
      }
      return this;
    }
    count() { return this.v.length / 9; }
  }

  /* ------------------------------ Shader -------------------------------- */
  const VS = `#version 300 es
  layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in vec3 aCol;
  uniform mat4 uModel, uVP, uLVP; uniform float uTime, uSway, uWater;
  out vec3 vNor; out vec3 vCol; out vec3 vW; out vec4 vL;
  void main(){
    vec4 w = uModel * vec4(aPos, 1.0);
    if (uSway > 0.0) {
      float h = max(0.0, aPos.y);
      w.x += sin(uTime * 1.6 + w.z * 0.7 + w.x * 0.3) * 0.045 * h * uSway;
      w.z += cos(uTime * 1.25 + w.x * 0.6) * 0.035 * h * uSway;
    }
    vW = w.xyz; vNor = mat3(uModel) * aNor; vCol = aCol; vL = uLVP * w;
    gl_Position = uVP * w;
  }`;
  const FS = `#version 300 es
  precision highp float; precision highp sampler2DShadow;
  in vec3 vNor; in vec3 vCol; in vec3 vW; in vec4 vL;
  uniform vec3 uSunDir, uSunCol, uSky, uGround, uFog, uCam; uniform vec2 uFogR;
  uniform vec4 uTint; uniform float uGlow, uAlpha, uWater, uShadowOn, uTime, uTexel, uNight;
  uniform sampler2DShadow uShadow;
  out vec4 o;
  float shadow(){
    vec3 p = vL.xyz / vL.w * 0.5 + 0.5;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
    float s = 0.0;
    for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++)
      s += texture(uShadow, vec3(p.xy + vec2(float(i), float(j)) * uTexel * 1.25, p.z - 0.0018));
    return s / 9.0;
  }
  void main(){
    vec3 n = normalize(vNor);
    if (uWater > 0.5) {
      /* kleine Kräuselwellen aus vier Richtungen */
      vec2 p = vW.xz, g = vec2(0.0);
      vec2 d1 = vec2(0.8, 0.6), d2 = vec2(-0.5, 0.86), d3 = vec2(0.95, -0.31), d4 = vec2(-0.7, -0.71);
      g += d1 * cos(dot(p, d1) * 2.1 + uTime * 1.2) * 0.030;
      g += d2 * cos(dot(p, d2) * 3.6 + uTime * 1.6) * 0.022;
      g += d3 * cos(dot(p, d3) * 6.3 + uTime * 2.3) * 0.014;
      g += d4 * cos(dot(p, d4) * 10.1 + uTime * 3.0) * 0.009;
      n = normalize(vec3(-g.x, 1.0, -g.y));
    }
    float d = dot(n, uSunDir);
    float wrap = clamp((d + 0.2) / 1.2, 0.0, 1.0);
    float sh = uShadowOn > 0.5 ? shadow() : 1.0;
    vec3 amb = mix(uGround, uSky, n.y * 0.5 + 0.5);
    vec3 c = vCol * (amb + uSunCol * wrap * sh);
    if (uWater > 0.5) {
      vec3 v = normalize(uCam - vW); vec3 h = normalize(uSunDir + v);
      c = vCol * (amb * 0.95 + uSunCol * 0.5 * sh);
      float fr = 0.12 + 0.6 * pow(1.0 - max(dot(n, v), 0.0), 4.0);        /* Himmel spiegelt sich */
      c = mix(c, uSky * 1.25 + vec3(0.06, 0.08, 0.1), fr);
      c += pow(max(dot(n, h), 0.0), 180.0) * 1.6 * sh * uSunCol;           /* Glitzern */
    }
    /* Fenster und Glut leuchten nachts: sehr helle, warme Vertexfarben */
    float warm = step(0.995, vCol.r) * step(0.80, vCol.g) * step(vCol.g, 0.87) * step(0.46, vCol.b) * step(vCol.b, 0.52);
    c = mix(c, vCol * 1.15, warm * uNight);
    c = mix(c, uTint.rgb, uTint.a);
    c += uGlow * vec3(1.0, 0.92, 0.62) * 0.42;
    float f = smoothstep(uFogR.x, uFogR.y, length(vW - uCam));
    c = mix(c, uFog, f);
    o = vec4(c, uAlpha);
  }`;
  const SVS = `#version 300 es
  layout(location=0) in vec3 aPos;
  uniform mat4 uModel, uLVP; uniform float uTime, uSway;
  void main(){
    vec4 w = uModel * vec4(aPos, 1.0);
    if (uSway > 0.0) { float h = max(0.0, aPos.y); w.x += sin(uTime * 1.6 + w.z * 0.7 + w.x * 0.3) * 0.045 * h * uSway; w.z += cos(uTime * 1.25 + w.x * 0.6) * 0.035 * h * uSway; }
    gl_Position = uLVP * w;
  }`;
  const SFS = `#version 300 es
  precision mediump float; out vec4 o; void main(){ o = vec4(1.0); }`;
  /* Partikel: Billboards, rund und weich */
  const PVS = `#version 300 es
  layout(location=0) in vec3 aC; layout(location=1) in vec2 aK; layout(location=2) in float aS; layout(location=3) in vec4 aCol; layout(location=4) in float aShape;
  uniform mat4 uVP; uniform vec3 uR, uU;
  out vec2 vK; out vec4 vCol; out float vShape;
  void main(){ vK = aK; vCol = aCol; vShape = aShape; gl_Position = uVP * vec4(aC + (uR * aK.x + uU * aK.y) * aS, 1.0); }`;
  const PFS = `#version 300 es
  precision mediump float; in vec2 vK; in vec4 vCol; in float vShape; out vec4 o;
  void main(){
    float a;
    if (vShape < 0.5) a = smoothstep(1.0, 0.55, length(vK));                 /* weicher Punkt */
    else if (vShape < 1.5) a = step(max(abs(vK.x), abs(vK.y)), 0.75);        /* Schnipsel */
    else {                                                                    /* Herz */
      vec2 p = vK * 1.25; p.y = -p.y + 0.25;
      float x = p.x, y = p.y - sqrt(abs(x)) * 0.55;
      a = smoothstep(1.05, 0.9, x * x + y * y * 1.6);
    }
    if (a < 0.02) discard;
    o = vec4(vCol.rgb, vCol.a * a);
  }`;

  function compile(gl, vs, fs) {
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  }

  /* ------------------------------ Renderer ------------------------------ */
  function create(canvas, opts) {
    opts = opts || {};
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.keep });
    if (!gl) return null;
    let main, shad, part;
    const meshes = new Set();
    let shadowFB = null, shadowTex = null;
    const SH = opts.shadowSize || 2048;
    let lost = false;
    const R = {
      gl, canvas, nodes: [], lost: () => lost,
      cam: { tx: 0, ty: 0, tz: 0, dist: 30, yaw: Math.PI / 4, pitch: 0.92, fov: 0.55 },
      env: {
        sun: norm([0.55, 0.85, 0.35]), sunCol: [1.0, 0.94, 0.82], sky: [0.66, 0.78, 0.92], ground: [0.42, 0.40, 0.32],
        fog: [0.72, 0.84, 0.95], fogR: [55, 95], night: 0
      },
      shadowBox: opts.shadowBox || 24,
      V: ID(), P: ID(), VP: ID(), IVP: ID(), LVP: ID(), eye: [0, 0, 0], w: 1, h: 1, dpr: 1,
      time: 0, onRestore: null
    };

    function init() {
      main = compile(gl, VS, FS);
      shad = compile(gl, SVS, SFS);
      part = compile(gl, PVS, PFS);
      shadowTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, shadowTex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SH, SH);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      shadowFB = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0);
      gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      partBuf = gl.createBuffer(); partVAO = gl.createVertexArray();
      gl.bindVertexArray(partVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
      const st = 11 * 4;
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, st, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, st, 20);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, st, 24);
      gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 1, gl.FLOAT, false, st, 40);
      gl.bindVertexArray(null);
    }
    let partBuf, partVAO;
    init();

    function upload(m) {
      m.vao = gl.createVertexArray();
      m.buf = gl.createBuffer();
      gl.bindVertexArray(m.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
      gl.bufferData(gl.ARRAY_BUFFER, m.data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
      gl.bindVertexArray(null);
    }
    /* MB → Mesh (GPU) */
    R.mesh = function (mb) {
      const data = mb instanceof Float32Array ? mb : new Float32Array(mb.v);
      const m = { data, count: data.length / 9, vao: null, buf: null, box: null };
      let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      for (let i = 0; i < data.length; i += 9)
        for (let k = 0; k < 3; k++) { if (data[i + k] < lo[k]) lo[k] = data[i + k]; if (data[i + k] > hi[k]) hi[k] = data[i + k]; }
      m.box = [lo, hi];
      if (!lost) upload(m);
      meshes.add(m);
      return m;
    };
    R.free = function (m) {
      if (!m) return;
      meshes.delete(m);
      if (m.vao) { gl.deleteVertexArray(m.vao); gl.deleteBuffer(m.buf); }
      m.vao = null;
    };
    /* Knoten: Mesh + Lage. Kinder erben die Lage der Eltern. */
    R.node = function (mesh, o) {
      const n = Object.assign({ mesh, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, visible: true,
        tint: null, glow: 0, alpha: 1, sway: 0, water: 0, shadow: true, children: [], parent: null, W: ID() }, o || {});
      if (o && o.s != null) { n.sx = n.sy = n.sz = o.s; }
      return n;
    };
    R.addChild = (p, c) => { c.parent = p; p.children.push(c); return c; };

    canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); lost = true; });
    canvas.addEventListener("webglcontextrestored", () => {
      lost = false; init();
      meshes.forEach(upload);
      if (R.onRestore) R.onRestore();
    });

    R.resize = function () {
      const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 2);
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      R.w = w; R.h = h; R.dpr = dpr;
      const W = Math.round(w * dpr), H = Math.round(h * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    };

    function updateCamera() {
      const c = R.cam;
      const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
      R.eye = [c.tx + Math.cos(c.yaw) * cp * c.dist, c.ty + sp * c.dist, c.tz + Math.sin(c.yaw) * cp * c.dist];
      lookAt(R.V, R.eye, [c.tx, c.ty, c.tz], [0, 1, 0]);
      persp(R.P, c.fov, R.w / R.h, Math.max(0.5, c.dist * 0.2), c.dist * 4 + 60);
      mul(R.VP, R.P, R.V);
      invert(R.IVP, R.VP);
      /* Sonnenkamera: fester Kasten um die Kameramitte */
      const L = ID(), Pr = ID(), s = R.shadowBox, sd = R.env.sun;
      const cx = Math.round(c.tx / 2) * 2, cz = Math.round(c.tz / 2) * 2;
      lookAt(L, [cx + sd[0] * 40, sd[1] * 40, cz + sd[2] * 40], [cx, 0, cz], [0, 1, 0]);
      ortho(Pr, -s, s, -s, s, 1, 90);
      mul(R.LVP, Pr, L);
    }
    R.updateCamera = updateCamera;

    function world(n, parentW) {
      trs(n.W, n.x, n.y, n.z, n.rx, n.ry, n.rz, n.sx, n.sy, n.sz);
      if (parentW) mul(n.W, parentW, n.W);
      return n.W;
    }

    function collect(list, out, parentW, inh) {
      for (const n of list) {
        if (!n.visible) continue;
        world(n, parentW);
        const st = inh ? { tint: n.tint || inh.tint, glow: Math.max(n.glow, inh.glow), alpha: Math.min(n.alpha, inh.alpha), shadow: n.shadow && inh.shadow } : n;
        if (n.mesh) out.push([n, st]);
        if (n.children.length) collect(n.children, out, n.W, st);
      }
    }

    const NOTINT = [0, 0, 0, 0];
    R.render = function (time) {
      if (lost) return;
      R.time = time;
      R.resize();
      updateCamera();
      const list = [];
      collect(R.nodes, list, null, null);
      const E = R.env;

      /* 1) Schatten */
      gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
      gl.viewport(0, 0, SH, SH);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      gl.useProgram(shad.p);
      gl.uniformMatrix4fv(shad.u.uLVP, false, R.LVP);
      gl.uniform1f(shad.u.uTime, time);
      for (const [n, st] of list) {
        if (!st.shadow || st.alpha < 0.99 || n.water || !n.mesh.vao) continue;
        gl.uniformMatrix4fv(shad.u.uModel, false, n.W);
        gl.uniform1f(shad.u.uSway, n.sway);
        gl.bindVertexArray(n.mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, n.mesh.count);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      /* 2) Szene */
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(main.p);
      const u = main.u;
      gl.uniformMatrix4fv(u.uVP, false, R.VP);
      gl.uniformMatrix4fv(u.uLVP, false, R.LVP);
      gl.uniform3fv(u.uSunDir, E.sun); gl.uniform3fv(u.uSunCol, E.sunCol);
      gl.uniform3fv(u.uSky, E.sky); gl.uniform3fv(u.uGround, E.ground);
      gl.uniform3fv(u.uFog, E.fog); gl.uniform2fv(u.uFogR, E.fogR);
      gl.uniform3fv(u.uCam, R.eye);
      gl.uniform1f(u.uTime, time); gl.uniform1f(u.uShadowOn, 1); gl.uniform1f(u.uTexel, 1 / SH);
      gl.uniform1f(u.uNight, E.night || 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shadowTex);
      gl.uniform1i(u.uShadow, 0);
      const draw = (n, st) => {
        if (!n.mesh.vao) return;
        gl.uniformMatrix4fv(u.uModel, false, n.W);
        gl.uniform1f(u.uSway, n.sway); gl.uniform1f(u.uWater, n.water);
        gl.uniform4fv(u.uTint, st.tint || NOTINT);
        gl.uniform1f(u.uGlow, st.glow || 0); gl.uniform1f(u.uAlpha, st.alpha);
        gl.bindVertexArray(n.mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, n.mesh.count);
      };
      gl.disable(gl.BLEND);
      for (const [n, st] of list) if (st.alpha >= 0.99 && !n.shadowOnly) draw(n, st);
      /* halbdurchsichtig (Bauvorschau) zuletzt */
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for (const [n, st] of list) if (st.alpha < 0.99 && !n.shadowOnly) draw(n, st);
      drawParticles();
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    };

    /* ----------------------------- Partikel ----------------------------- */
    const parts = [];
    R.emit = function (p) {
      if (parts.length > 700) parts.shift();
      parts.push(Object.assign({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, drag: 0, life: 1, t: 0, size: 0.2, size2: null,
        col: [1, 1, 1, 1], fade: true, shape: 0 }, p));
    };
    R.burst = function (o) {
      for (let i = 0; i < (o.n || 10); i++) {
        const a = Math.random() * Math.PI * 2, s = (o.speed || 2) * (0.5 + Math.random() * 0.7);
        R.emit({
          x: o.x + (Math.random() - 0.5) * (o.spread || 0.3), y: o.y + Math.random() * (o.h || 0.1), z: o.z + (Math.random() - 0.5) * (o.spread || 0.3),
          vx: Math.cos(a) * s * (o.flat ? 1 : 0.6), vy: (o.up || 2) * (0.6 + Math.random() * 0.6), vz: Math.sin(a) * s * (o.flat ? 1 : 0.6),
          g: o.g != null ? o.g : -6, drag: o.drag || 1.2, life: (o.life || 0.9) * (0.7 + Math.random() * 0.6),
          size: (o.size || 0.12) * (0.7 + Math.random() * 0.6), size2: o.size2, col: Array.isArray(o.col[0]) ? o.col[Math.floor(Math.random() * o.col.length)] : o.col,
          shape: o.shape || 0
        });
      }
    };
    R.stepParticles = function (dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.t += dt;
        if (p.t >= p.life) { parts.splice(i, 1); continue; }
        p.vy += p.g * dt;
        const k = Math.max(0, 1 - p.drag * dt);
        p.vx *= k; p.vy *= p.g ? 1 : k; p.vz *= k;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < 0.02 && p.g < 0) { p.y = 0.02; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; }
      }
    };
    R.particleCount = () => parts.length;
    let pdata = new Float32Array(0);
    function drawParticles() {
      if (!parts.length) return;
      const need = parts.length * 6 * 11;
      if (pdata.length < need) pdata = new Float32Array(need * 2);
      const K = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
      let o = 0;
      for (const p of parts) {
        const f = p.t / p.life;
        const s = p.size2 != null ? p.size + (p.size2 - p.size) * f : p.size;
        const a = p.col[3] * (p.fade ? (f < 0.15 ? f / 0.15 : 1 - Math.max(0, (f - 0.55) / 0.45)) : 1);
        for (const k of K) {
          pdata[o++] = p.x; pdata[o++] = p.y; pdata[o++] = p.z; pdata[o++] = k[0]; pdata[o++] = k[1]; pdata[o++] = s;
          pdata[o++] = p.col[0]; pdata[o++] = p.col[1]; pdata[o++] = p.col[2]; pdata[o++] = a; pdata[o++] = p.shape;
        }
      }
      gl.useProgram(part.p);
      gl.uniformMatrix4fv(part.u.uVP, false, R.VP);
      const V = R.V;
      gl.uniform3f(part.u.uR, V[0], V[4], V[8]);
      gl.uniform3f(part.u.uU, V[1], V[5], V[9]);
      gl.bindVertexArray(partVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pdata.subarray(0, o), gl.DYNAMIC_DRAW);
      gl.disable(gl.CULL_FACE);
      gl.drawArrays(gl.TRIANGLES, 0, o / 11);
      gl.enable(gl.CULL_FACE);
    }

    /* -------------------- Bildschirm ↔ Welt (Antippen) ------------------- */
    R.project = function (x, y, z) {
      const c = xf4(R.VP, [x, y, z, 1]);
      if (c[3] <= 0) return null;
      return [(c[0] / c[3] * 0.5 + 0.5) * R.w, (1 - (c[1] / c[3] * 0.5 + 0.5)) * R.h, c[2] / c[3]];
    };
    R.ray = function (sx, sy) {
      const nx = (sx / R.w) * 2 - 1, ny = 1 - (sy / R.h) * 2;
      const a = xf4(R.IVP, [nx, ny, -1, 1]), b = xf4(R.IVP, [nx, ny, 1, 1]);
      const p0 = [a[0] / a[3], a[1] / a[3], a[2] / a[3]], p1 = [b[0] / b[3], b[1] / b[3], b[2] / b[3]];
      return { o: p0, d: norm(sub(p1, p0)) };
    };
    /* Schnitt mit der Ebene y = h */
    R.ground = function (sx, sy, h) {
      const r = R.ray(sx, sy);
      if (Math.abs(r.d[1]) < 1e-5) return null;
      const t = ((h || 0) - r.o[1]) / r.d[1];
      if (t < 0) return null;
      return [r.o[0] + r.d[0] * t, h || 0, r.o[2] + r.d[2] * t];
    };
    /* Strahl gegen achsenparallelen Kasten [lo, hi] – Abstand oder null */
    R.hitBox = function (r, lo, hi) {
      let t0 = -1e9, t1 = 1e9;
      for (let k = 0; k < 3; k++) {
        if (Math.abs(r.d[k]) < 1e-9) { if (r.o[k] < lo[k] || r.o[k] > hi[k]) return null; continue; }
        let a = (lo[k] - r.o[k]) / r.d[k], b = (hi[k] - r.o[k]) / r.d[k];
        if (a > b) { const t = a; a = b; b = t; }
        t0 = Math.max(t0, a); t1 = Math.min(t1, b);
        if (t0 > t1) return null;
      }
      return t1 < 0 ? null : Math.max(0, t0);
    };
    return R;
  }

  return { MB, create, col, shade, srand: () => srand(), seed: s => { seed = s || 1; }, mul, trs, ID, norm };
})();
