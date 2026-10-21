/* =========================================================================
   LOGISTIKA – zcheck.js  (Entwicklerwerkzeug, wird vom Spiel nicht geladen)
   Findet Z-Fighting in den Low-Poly-Modellen: Flächen, die genau übereinander
   liegen und deshalb flimmern (z. B. Pfostenköpfe bündig mit dem Steg-Belag).

   Verfahren (zcheck): jedes Modell wird aus der Spielkamera (Neigung 0,9, vier
   Blickrichtungen – Gebäude lassen sich drehen) zweimal gezeichnet, einmal mit
   umgekehrter Reihenfolge der Dreiecke. Nur wo zwei Flächen gleich tief liegen,
   hängt das Bild von der Reihenfolge ab – diese Pixel sind die Flimmerstellen.
   Ein dritter Durchgang liefert ihre Lage im Modell (x, y, z).

   Benutzung im Browser (Spiel geöffnet, Konsole):
     const s = document.createElement("script"); s.src = "zcheck.js"; document.head.append(s);
     zcheck()                      → alle Modelle aus FWM, FM, FFM (Tabelle)
     zcheck(["pier", "bridge"])    → nur diese
     zrender(FWM.pier())           → ein Modell: { px, spots: [[x, y, z, Pixel], …] }
     zcheckMB(FWM.pier())          → rechnerisch: alle Paare deckungsgleicher Dreiecke
   ========================================================================= */
(function () {
  const EPS_D = 0.0015, MIN_A = 0.0004;
  /* Dreiecke aus einem MB (9 Floats je Ecke: Position, Normale, Farbe) */
  function tris(mb) {
    const v = mb.v || mb, out = [];
    for (let i = 0; i + 26 < v.length; i += 27) {
      const A = [v[i], v[i + 1], v[i + 2]], B = [v[i + 9], v[i + 10], v[i + 11]], C = [v[i + 18], v[i + 19], v[i + 20]];
      const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
      let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const l = Math.hypot(n[0], n[1], n[2]);
      if (l < 1e-9) continue;
      n = [n[0] / l, n[1] / l, n[2] / l];
      out.push({ A, B, C, n, d: n[0] * A[0] + n[1] * A[1] + n[2] * A[2], col: [v[i + 6], v[i + 7], v[i + 8]], k: i / 27 });
    }
    return out;
  }
  /* 2D-Projektion auf die Ebene (größte Normalenkomponente weglassen) */
  function proj(t) {
    const a = Math.abs(t.n[0]), b = Math.abs(t.n[1]), c = Math.abs(t.n[2]);
    const ax = a >= b && a >= c ? [1, 2] : b >= c ? [0, 2] : [0, 1];
    return [t.A, t.B, t.C].map(p => [p[ax[0]], p[ax[1]]]);
  }
  /* Fläche der Überdeckung zweier 2D-Dreiecke (Sutherland–Hodgman) */
  function area(P) { let s = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; }
  function clip(subj, clipT) {
    let out = subj;
    const ccw = area(clipT) > 0;
    for (let i = 0; i < 3 && out.length; i++) {
      const a = clipT[i], b = clipT[(i + 1) % 3], inp = out; out = [];
      const side = p => { const s = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); return ccw ? s : -s; };
      for (let j = 0; j < inp.length; j++) {
        const p = inp[j], q = inp[(j + 1) % inp.length], sp = side(p), sq = side(q);
        if (sp >= 0) out.push(p);
        if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
      }
    }
    return out;
  }
  function overlap(t1, t2) { const P = clip(proj(t1), proj(t2)); return P.length >= 3 ? Math.abs(area(P)) : 0; }
  /* Treffer in einem Modell */
  function zcheckMB(mb, o) {
    o = o || {};
    const T = tris(mb), grid = new Map(), hits = [];
    const key = t => [Math.round(t.n[0] * 50), Math.round(t.n[1] * 50), Math.round(t.n[2] * 50), Math.round(t.d / EPS_D)].join(",");
    T.forEach(t => { const k = key(t); (grid.get(k) || grid.set(k, []).get(k)).push(t); });
    for (const t of T) {
      const [a, b, c, d] = key(t).split(",").map(Number);
      for (let dd = -1; dd <= 1; dd++) {
        const L = grid.get([a, b, c, d + dd].join(","));
        if (!L) continue;
        for (const u of L) {
          if (u.k <= t.k) continue;
          if (t.n[0] * u.n[0] + t.n[1] * u.n[1] + t.n[2] * u.n[2] < 0.999) continue;
          if (Math.abs(t.d - u.d) > EPS_D) continue;
          const A = overlap(t, u);
          if (A > MIN_A) hits.push({ a: t.k, b: u.k, area: +A.toFixed(4), at: t.A.map(x => +x.toFixed(3)), n: t.n.map(x => +x.toFixed(2)), sameCol: t.col.every((x, i) => Math.abs(x - u.col[i]) < 0.02) });
        }
      }
    }
    /* Unterseiten (Normale nach unten) sieht die Kamera nie – sie zählen nicht */
    return o.all ? hits : hits.filter(h => (!h.sameCol || o.same) && h.n[1] > -0.3);
  }
  /* ---------------- Bildprüfung (sichtbares Flimmern) ----------------
     1. Tiefe der vordersten Fläche je Pixel (Tiefentextur).
     2. Alle Dreiecke noch einmal ohne Tiefentest; ein Fragment zählt, wenn es höchstens EPS (Welt: 0,5 mm)
        hinter der vordersten Fläche liegt. Mit Blend MAX und MIN entstehen die hellste und die dunkelste
        Farbe dieser Fragmente – unterscheiden sie sich, liegen dort zwei verschieden farbige Flächen
        gleichauf: Z-Fighting. Kanten und Auflagelinien (1–2 Pixel breit) fallen durch eine Erosion weg.
     3. Ein Durchgang mit der Lage (x, y, z) als Farbe sagt, wo im Modell das ist. */
  let GL = null;
  function glInit() {
    if (GL) return GL;
    const W = 320, cv = document.createElement("canvas"); cv.width = cv.height = W;
    const gl = cv.getContext("webgl2", { antialias: false, depth: true, preserveDrawingBuffer: true });
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s; };
    const VS = "#version 300 es\nin vec3 aP; in vec3 aC; uniform mat4 uM; uniform vec3 uLo, uSz; out vec3 vC; out vec3 vP;\nvoid main(){ vC = aC; vP = (aP - uLo) / uSz; gl_Position = uM * vec4(aP, 1.0); }";
    const prog = fs => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return p; };
    const pD = prog("#version 300 es\nprecision highp float; in vec3 vC; in vec3 vP; out vec4 o; void main(){ o = vec4(1.0); }");
    const pN = prog("#version 300 es\nprecision highp float; precision highp sampler2D; uniform sampler2D uD; uniform float uE; in vec3 vC; in vec3 vP; out vec4 o;\nvoid main(){ float d = texelFetch(uD, ivec2(gl_FragCoord.xy), 0).r; if (gl_FragCoord.z > d + uE) discard; o = vec4(vC, 1.0); }");
    const pP = prog("#version 300 es\nprecision highp float; in vec3 vC; in vec3 vP; out vec4 o; void main(){ o = vec4(vP, 1.0); }");
    const dt = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, dt);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, W, W, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST));
    const ct = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, ct); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, W, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ct, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, dt, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    GL = { W, cv, gl, pD, pN, pP, dt, fb, buf: gl.createBuffer() };
    return GL;
  }
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function viewProj(eye, ctr, fov, n, f) {
    const z = nrm(sub3(eye, ctr)), x = nrm(crs([0, 1, 0], z)), y = crs(z, x);
    const V = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
    const t = 1 / Math.tan(fov / 2), P = [t, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0];
    const M = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k]; M[c * 4 + r] = s; }
    return M;
  }
  /* o.yaws: Blickrichtungen (Standard: alle vier Seiten), o.pitch, o.dist (Kameraabstand wie im Spiel), o.eps (Welt) */
  function zrender(mb, o) {
    o = o || {};
    const v = mb.v || mb, n = Math.floor(v.length / 27);
    if (!n) return { px: 0, spots: [] };
    const { W, gl, pD, pN, pP, dt, fb, buf } = glInit();
    let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (let i = 0; i < v.length; i += 9) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[i + k]); hi[k] = Math.max(hi[k], v[i + k]); }
    const sz = sub3(hi, lo).map(x => Math.max(x, 1e-3)), ctr = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2], rad = Math.hypot(sz[0], sz[1], sz[2]) / 2;
    const data = new Float32Array(n * 18);
    for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) { const a = t * 27 + k * 9; data.set([v[a], v[a + 1], v[a + 2], v[a + 6], v[a + 7], v[a + 8]], t * 18 + k * 6); }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const D = o.dist || 30, pitch = o.pitch || 0.9, yaws = o.yaws || [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    const near = Math.max(0.5, D * 0.2), far = D * 4 + 60, eps = (o.eps || 0.0005) * far * near / ((far - near) * D * D);
    const use = (p, M) => {
      gl.useProgram(p);
      const aP = gl.getAttribLocation(p, "aP"), aC = gl.getAttribLocation(p, "aC");
      gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 24, 0);
      if (aC >= 0) { gl.enableVertexAttribArray(aC); gl.vertexAttribPointer(aC, 3, gl.FLOAT, false, 24, 12); }
      gl.uniformMatrix4fv(gl.getUniformLocation(p, "uM"), false, M); gl.uniform3fv(gl.getUniformLocation(p, "uLo"), lo); gl.uniform3fv(gl.getUniformLocation(p, "uSz"), sz);
    };
    const read = () => { const px = new Uint8Array(W * W * 4); gl.readPixels(0, 0, W, W, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
    gl.viewport(0, 0, W, W); gl.enable(gl.CULL_FACE);
    const cl = new Map(); let px = 0, pxA = 0;
    for (const yaw of yaws) {
      const eye = [ctr[0] + D * Math.cos(pitch) * Math.sin(yaw), ctr[1] + D * Math.sin(pitch), ctr[2] + D * Math.cos(pitch) * Math.cos(yaw)];
      const fov = 2 * Math.atan(rad * 1.1 / D), M = viewProj(eye, ctr, fov, near, far);
      pxA = Math.pow(2 * D * Math.tan(fov / 2) / W, 2);
      /* 1) Tiefe */
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true);
      gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      use(pD, M); gl.drawArrays(gl.TRIANGLES, 0, n * 3);
      /* 2) hellste und dunkelste Farbe der vordersten Fragmente */
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dt);
      use(pN, M); gl.uniform1i(gl.getUniformLocation(pN, "uD"), 0); gl.uniform1f(gl.getUniformLocation(pN, "uE"), eps);
      gl.blendEquation(gl.MAX); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, n * 3); const MX = read();
      gl.blendEquation(gl.MIN); gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, n * 3); const MN = read();
      gl.blendEquation(gl.FUNC_ADD); gl.disable(gl.BLEND);
      gl.bindTexture(gl.TEXTURE_2D, null);
      /* 3) Lage */
      gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      use(pP, M); gl.drawArrays(gl.TRIANGLES, 0, n * 3); const P = read();
      const bad = new Uint8Array(W * W);
      for (let i = 0; i < W * W; i++) { const j = i * 4; if (MX[j + 3] && Math.abs(MX[j] - MN[j]) + Math.abs(MX[j + 1] - MN[j + 1]) + Math.abs(MX[j + 2] - MN[j + 2]) > 6) bad[i] = 1; }
      for (let y = 1; y < W - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (!bad[i] || !bad[i - 1] || !bad[i + 1] || !bad[i - W] || !bad[i + W]) continue;
        px++;
        const q = [0, 1, 2].map(k => lo[k] + P[i * 4 + k] / 255 * sz[k]), key = q.map(x => +(Math.round(x / 0.05) * 0.05).toFixed(2)).join(",");
        cl.set(key, (cl.get(key) || 0) + 1);
      }
    }
    const spots = [...cl.entries()].sort((a, b) => b[1] - a[1]).slice(0, o.top || 8).map(([k, c]) => k.split(",").map(Number).concat([c]));
    /* cm²: Pixel × Pixelfläche in der Welt (kleine Modelle werden zum Prüfen groß gezeichnet) */
    return { px, cm2: +(px * pxA * 1e4).toFixed(1), spots };
  }
  window.zrender = zrender;
  /* alle Modelle mit Standardwerten (Funktionen, die Argumente brauchen, werden mit typischen Werten gerufen) */
  const ARGS = {
    tree: [["birke", 2, 0], ["kiefer", 3, 0], ["fichte", 3, 1], ["buche", 3, 2], ["eiche", 4, 0], ["kirsche", 2, 0]],
    bgTree: [["birke", 0], ["kiefer", 1], ["eiche", 2]], stump: [["buche", 2]], fallen: [["eiche", 3]], sapling: [["birke"]],
    yard: [[26, 24]], road: [[20]], pigRun: [[5, 4]]
  };
  window.zcheckMB = zcheckMB;
  window.zcheck = function (only) {
    /* die Modell-Bibliotheken sind globale const (nicht an window) */
    const libs = { FWM: typeof FWM !== "undefined" ? FWM : null, FM: typeof FM !== "undefined" ? FM : null, FFM: typeof FFM !== "undefined" ? FFM : null }, res = [];
    for (const [ln, lib] of Object.entries(libs)) {
      if (!lib) continue;
      for (const [name, fn] of Object.entries(lib)) {
        if (typeof fn !== "function" || (only && !only.includes(name))) continue;
        if (/^(MB|ribbon|fillet|terrain|smoothLine|wayRaw|wayStraightAt|forestPath|hofGround|creek|spring|lakeShore|lakeWater|fenceLine|rectFence)/.test(name)) continue;
        for (const args of ARGS[name] || [[]]) {
          let mb;
          try { mb = fn(...args); } catch (e) { continue; }
          if (!mb || !(mb.v || mb.length)) continue;
          const r = zrender(mb);
          if (r.cm2 >= (window.ZCHECK_MIN || 2)) res.push({ model: ln + "." + name + (args.length ? "(" + args.join(",") + ")" : ""), px: r.px, cm2: r.cm2, spots: r.spots });
        }
      }
    }
    res.sort((a, b) => b.cm2 - a.cm2);
    console.table(res.map(r => ({ model: r.model, cm2: r.cm2, stellen: r.spots.slice(0, 3).map(s => s.slice(0, 3).join("/")).join("  ") })));
    return res;
  };
})();
