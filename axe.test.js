/* Tests für die Axt in der Ich-Perspektive (v93): node tests/axe.test.js
   Lädt gl3d.js (Mesh-Bauer) und fpsaw.js ohne Browser und prüft Lage-Rechnung und Axtmodell. */
const assert = require("assert");
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
let n = 0; const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };
const ctx = { console, Math, Object, Array, JSON, Map, Set, Float32Array, Uint8Array, Uint16Array, Int32Array, Date,
  performance: { now: () => Date.now() }, navigator: { userAgent: "node" }, localStorage: { getItem: () => null, setItem() {} } };
ctx.window = ctx; ctx.self = ctx;
vm.createContext(ctx);
for (const f of ["gl3d.js", "fpsaw.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8") + "\n;this.__last = 1;", ctx, { filename: f });
const A = vm.runInContext("SAW3D._axeMath", ctx);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]);
const nrm = a => { const l = len(a); return a.map(v => v / l); };
const col = (m, c) => [m[c], m[3 + c], m[6 + c]];
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; };

test("Lage → Winkel für gl3d (R = Ry·Rx·Rz) ergibt dieselbe Drehung (2000 Zufallslagen)", () => {
  for (let i = 0; i < 2000; i++) {
    const h = [rnd(), rnd(), rnd()], e = [rnd(), rnd(), rnd()];
    if (len(h) < 0.1 || len(e) < 0.1 || Math.abs(dot(nrm(h), nrm(e))) > 0.97) continue;
    const M = A.mOfQ(A.frameQ(h, e, i % 2 === 0)), E = A.eulOf(M);
    for (const v of [[1, 0, 0], [0, 1, 0], [0, 0, 1], A.AXE_EDGE]) {
      const p = A.rotV(v, E.rx, E.ry, E.rz), q = [dot(M.slice(0, 3), v), dot(M.slice(3, 6), v), dot(M.slice(6, 9), v)];
      assert.ok(len(p.map((x, k) => x - q[k])) < 1e-9, "Abweichung bei Lage " + i);
    }
  }
});
test("Beim Schlag zeigt die Schneide (−z) genau in Schlagrichtung, der Stiel steht senkrecht dazu", () => {
  for (let i = 0; i < 500; i++) {
    const h = [rnd(), rnd(), rnd()], e = nrm([rnd(), rnd(), rnd()]);
    if (len(h) < 0.1 || Math.abs(dot(nrm(h), e)) > 0.97) continue;
    const M = A.mOfQ(A.frameQ(h, e, false)), blade = col(M, 2).map(v => -v), stiel = col(M, 1);
    assert.ok(dot(blade, e) > 1 - 1e-9, "Schneide schief");
    assert.ok(Math.abs(dot(stiel, e)) < 1e-9, "Stiel nicht senkrecht");
    assert.ok(dot(stiel, nrm(h)) > 0, "Stiel zeigt nach hinten");
    const det = dot(col(M, 0), [stiel[1] * col(M, 2)[2] - stiel[2] * col(M, 2)[1], stiel[2] * col(M, 2)[0] - stiel[0] * col(M, 2)[2], stiel[0] * col(M, 2)[1] - stiel[1] * col(M, 2)[0]]);
    assert.ok(Math.abs(det - 1) < 1e-9, "keine echte Drehung (gespiegelt)");
  }
});
test("Übergang zwischen zwei Lagen (slerp) beginnt und endet exakt, bleibt eine Drehung", () => {
  const a = A.frameQ([0, 1, 0], [0, 0, -1], true), b = A.frameQ([0.3, 0.5, -0.8], [-1, -1, 0], false);
  const close = (p, q) => Math.min(len(p.slice(0, 3).map((v, i) => v - q[i])) + Math.abs(p[3] - q[3]), len(p.slice(0, 3).map((v, i) => v + q[i])) + Math.abs(p[3] + q[3]));
  assert.ok(close(A.qSlerp(a, b, 0), a) < 1e-9 && close(A.qSlerp(a, b, 1), b) < 1e-9);
  for (let k = 0; k <= 10; k++) { const q = A.qSlerp(a, b, k / 10); assert.ok(Math.abs(Math.hypot(...q) - 1) < 1e-9); }
});
test("Axtmodell: Schneide vorn (−z), Nacken hinten, Trefferpunkt liegt auf der Schneide", () => {
  for (const id of ["axe1", "axe2"]) {
    const v = A.axeMesh(id).v;
    let zmin = 1e9, zmax = -1e9, ymax = -1e9, ymin = 1e9, edgeY0 = 1e9, edgeY1 = -1e9;
    for (let i = 0; i < v.length; i += 9) {
      zmin = Math.min(zmin, v[i + 2]); zmax = Math.max(zmax, v[i + 2]); ymin = Math.min(ymin, v[i + 1]); ymax = Math.max(ymax, v[i + 1]);
    }
    for (let i = 0; i < v.length; i += 9) if (v[i + 2] < zmin + 1e-6) { edgeY0 = Math.min(edgeY0, v[i + 1]); edgeY1 = Math.max(edgeY1, v[i + 1]); }
    assert.ok(Math.abs(zmin - A.AXE_EDGE[2]) < 1e-6, id + ": Schneide nicht bei z = " + A.AXE_EDGE[2]);
    assert.ok(zmax < 0.06 && -zmin > 2.5 * zmax, id + ": Nacken länger als die Klinge");
    assert.ok(Math.abs((edgeY0 + edgeY1) / 2 - A.AXE_EDGE[1]) < 1e-6, id + ": Trefferpunkt nicht mittig auf der Schneide");
    assert.ok(ymin < -0.05 && ymax > 0.85, id + ": Stiel zu kurz");
  }
});
console.log(n + " Tests bestanden");
