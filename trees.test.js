/* Tests für die Baumabstände (v92): node tests/trees.test.js
   Lädt die echten Modelle (gl3d.js, farmmodels.js, woodmodels.js) und die Spiellogik (erbe.js) ohne Browser. */
const assert = require("assert");
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
let n = 0; const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };

const load = files => {
  const ctx = { console, Math, Object, Array, JSON, Map, Set, Float32Array, Uint8Array, Uint16Array, Int32Array, Date,
    performance: { now: () => Date.now() }, navigator: { userAgent: "node" }, localStorage: { getItem: () => null, setItem() {} } };
  ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext("function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }", ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8") + "\n;this.__last = 1;", ctx, { filename: f });
  return ctx;
};
const M = load(["gl3d.js", "farmmodels.js", "woodmodels.js"]);
vm.runInContext("this.FWM = FWM;", M);
const E = load(["data.js", "farmdata.js", "fishdata.js", "erbedata.js", "farm.js", "erbe.js"]);
const ev = s => vm.runInContext(s, E);
const DIM = ev("FTREE_DIM"), treeClash = ev("treeClash"), treeBody = ev("treeBody"), erbeSpaceTrees = ev("erbeSpaceTrees");

test("FTREE_DIM stimmt mit den Baummodellen überein (Kronenradius, Stamm, Kronenhöhe; breiteste Variante)", () => {
  for (const sp of Object.keys(DIM)) for (let sz = 1; sz <= 4; sz++) {
    let cr = 0, tr = 0, cy0 = 1e9, cy1 = 0;
    for (let v = 0; v < 3; v++) {
      const b = M.FWM.tree(sp, sz, v), V = b.v, tk = b.tk || 0; tr = Math.max(tr, b.tp[0]);
      for (let i = tk; i < V.length; i += 9) { cr = Math.max(cr, Math.hypot(V[i], V[i + 2])); cy0 = Math.min(cy0, V[i + 1]); cy1 = Math.max(cy1, V[i + 1]); }
    }
    const e = DIM[sp][sz - 1], key = sp + " " + sz;
    assert.ok(Math.abs(e[0] - cr) < 0.02, key + " Krone " + e[0] + " ≠ " + cr.toFixed(2));
    assert.ok(Math.abs(e[1] - tr) < 0.02, key + " Stamm " + e[1] + " ≠ " + tr.toFixed(2));
    assert.ok(Math.abs(e[2] - cy0) < 0.02 && Math.abs(e[3] - cy1) < 0.02, key + " Höhe " + e.slice(2) + " ≠ " + [cy0.toFixed(2), cy1.toFixed(2)]);
  }
});
test("treeClash: Stämme brauchen Luft, Kronen dürfen sich berühren und etwas überlappen", () => {
  const A = treeBody("buche", 2, 1, 0, 0), r = A.cr;
  assert.strictEqual(treeClash(A, treeBody("buche", 2, 1, 0.3, 0)), true, "Stamm im Stamm");
  assert.strictEqual(treeClash(A, treeBody("buche", 2, 1, r * 1.1, 0)), true, "Krone zu tief im Nachbarn");
  assert.strictEqual(treeClash(A, treeBody("buche", 2, 1, r * 1.25, 0)), false, "überlappende Kronen erlaubt");
  assert.strictEqual(treeClash(A, treeBody("buche", 2, 1, r * 2.1, 0)), false);
});
test("treeClash: ein kleiner Baum darf unter den Rand einer hohen Krone, aber nicht an ihren Stamm", () => {
  const big = treeBody("kiefer", 3, 1, 0, 0);          /* Krone erst ab 3,9 m Höhe */
  const near = treeBody("birke", 1, 1, 1.2, 0), far = treeBody("birke", 1, 1, 0.5, 0);
  assert.ok(near.y1 < big.y0, "Voraussetzung: kleine Krone ganz unter der großen");
  assert.strictEqual(treeClash(big, near), false);
  assert.strictEqual(treeClash(big, far), true);
});
test("Gleich große Kronen: Abstand ≥ 1,2 · Radius (überlappen höchstens 80 %)", () => {
  for (const sp of ["birke", "fichte", "eiche"]) {
    const a = treeBody(sp, 2, 1, 0, 0), r = a.cr;
    assert.strictEqual(treeClash(a, treeBody(sp, 2, 1, r * 1.19, 0)), true, sp);
    assert.strictEqual(treeClash(a, treeBody(sp, 2, 1, r * 1.21, 0)), false, sp);
  }
});
const T1 = ev("erbeMakeTrees()"), T2 = ev("erbeMakeTrees()");
test("fällbare Bäume: Erzeugung reproduzierbar (gleiche ids, gleiche Orte)", () => {
  assert.strictEqual(JSON.stringify(T1), JSON.stringify(T2));
  assert.ok(T1.length > 150, "Bäume " + T1.length);
});
test("fällbare Bäume: kein Stamm im Stamm, höchstens zwei Kronenüberschneidungen (uralte Eichen)", () => {
  const B = T1.map(t => treeBody(t.sp, Math.max(t.mx || 1, t.sz || 1), t.s || 1, t.x, t.z));
  let clash = 0, trunk = 0;
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const d = Math.hypot(B[i].x - B[j].x, B[i].z - B[j].z);
    if (d < B[i].tr + B[j].tr + 0.3) trunk++;
    if (treeClash(B[i], B[j])) clash++;
  }
  assert.strictEqual(trunk, 0);
  assert.ok(clash <= 2, "Überschneidungen " + clash);
});
test("erbeSpaceTrees: der spätere von zwei ineinanderstehenden Bäumen rückt, keiner fällt weg, Wiederholung ändert nichts", () => {
  const base = T1.filter(t => t.area === "wald").slice(0, 1)[0];
  const L = [{ id: 1, sp: "buche", sz: 2, mx: 2, s: 1, x: base.x, z: base.z }, { id: 2, sp: "buche", sz: 2, mx: 2, s: 1, x: base.x + 0.4, z: base.z + 0.2 }];
  const moved = erbeSpaceTrees(L);
  assert.strictEqual(JSON.stringify(moved), "[2]");                 /* (Felder aus dem vm-Kontext: über JSON vergleichen) */
  assert.strictEqual(L.length, 2);
  assert.strictEqual(L[0].x, base.x);
  assert.strictEqual(treeClash(treeBody("buche", 2, 1, L[0].x, L[0].z), treeBody("buche", 2, 1, L[1].x, L[1].z)), false);
  assert.strictEqual(erbeSpaceTrees(L).length, 0);
});
console.log("\n" + n + " Tests bestanden");
