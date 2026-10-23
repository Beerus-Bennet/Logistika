/* Tests für die Haftzelle (v114): node tests/jail.test.js
   Lädt gl3d.js, farmmodels.js, woodmodels.js und jail.js ohne Browser und prüft die Modelle (keine NaN, Dreiecksbudget),
   die Lage von Fenster, Lichtstrahl, Bett und Figur und die Texte. */
const assert = require("assert");
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
let n = 0; const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };
const ctx = { console, Math, Object, Array, JSON, Map, Set, Float32Array, Uint8Array, Uint16Array, Int32Array, Date,
  performance: { now: () => Date.now() }, navigator: { userAgent: "node" }, localStorage: { getItem: () => null, setItem() {} } };
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
vm.runInContext("function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }", ctx);
["gl3d.js", "farmmodels.js", "woodmodels.js", "jail.js"].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8") + "\n;this.__l = 1;", ctx, { filename: f }));
vm.runInContext("this.J = JAIL3D; this.W = FWM;", ctx);
const J = ctx.J, W = ctx.W;
const fin = b => b.v.every(x => Number.isFinite(x));
const tris = b => b.v.length / 27;

test("Zelle: Modelle ohne NaN, Dreiecksbudget (Zelle < 14 000, Figur < 400)", () => {
  const c = J.cellStatic(); assert.ok(fin(c)); assert.ok(tris(c) > 2000 && tris(c) < 14000, "Zelle " + tris(c));
  const p = J.prisoner({ skin: 0xf2c9a0, hair: 0x6a4124, hs: "buzz", beard: 0, seed: 11 });
  ["T", "H", "armM", "th", "sh"].forEach(k => assert.ok(fin(p[k]) && tris(p[k]) > 0, k));
  assert.ok(tris(p.T) + tris(p.H) + tris(p.armM) * 2 + tris(p.th) * 2 + tris(p.sh) * 2 < 400);
  [J.ratMesh(), J.beamMesh(), J.guardMesh(), J.birdMesh()].forEach(b => assert.ok(fin(b) && tris(b) > 0));
});
test("Lichtstrahl: beginnt im Fenster der linken Wand und endet im Raum (Boden oder Rückwand)", () => {
  const b = J.beamMesh(); let xmin = 9, xmax = -9, zmin = 9, ymin = 9;
  for (let i = 0; i < b.v.length; i += 9) { xmin = Math.min(xmin, b.v[i]); xmax = Math.max(xmax, b.v[i]); zmin = Math.min(zmin, b.v[i + 2]); ymin = Math.min(ymin, b.v[i + 1]); }
  assert.ok(xmin > -1.75 && xmax < 1.7, "x " + xmin + " … " + xmax);
  assert.ok(zmin >= -1.31, "z " + zmin);
  assert.ok(ymin >= 0.03, "y " + ymin);
});
test("Figur sitzt: Hüfte auf der Matratze des oberen Betts, Knie knapp über der Bettkante", () => {
  const hipY = J.SIT_Y, kneeZ = J.SEAT.z + 0.29 * Math.cos(J.SEAT.ry);
  assert.ok(Math.abs(hipY - 0.115 - J.UM) < 0.02, "Oberschenkel liegen flach auf der Matratze");
  assert.ok(J.UM > J.LM + 0.4, "oberes Bett über dem unteren");
  assert.ok(J.SEAT.x > J.BUNK.x0 + 0.2 && J.SEAT.x < J.BUNK.x1 - 0.2, "Figur mittig auf dem Bett");
  assert.ok(J.SEAT.z > J.BUNK.z0 && J.SEAT.z < J.BUNK.z1, "Rumpf über der Matratze");
  assert.ok(kneeZ > J.BUNK.z1 - 0.08 && kneeZ < J.BUNK.z1 + 0.12, "Knie an der Kante " + kneeZ.toFixed(2));
  assert.ok(hipY - 0.417 + 0.04 > J.LM, "Füße über dem unteren Bett");
});
test("Texte: Tipps und Sprüche vorhanden, keine leeren Einträge", () => {
  assert.ok(J.TIPS.length >= 8 && J.TIPS.every(t => t.length > 10));
  ["man", "rat", "tap", "win"].forEach(k => assert.ok(J.SAY[k].length >= 2 && J.SAY[k].every(t => t.length > 1)));
});
test("Aussehen: ohne Spielstand Standardfigur; Hautfarbe und Haarfarbe sind Zahlen", () => {
  const L = J.look(); assert.ok(Number.isFinite(L.skin) && Number.isFinite(L.hair) && typeof L.hs === "string");
});
test("Person-Teile: noLegs/noArms/noHead lassen nur den Rumpf übrig", () => {
  const full = W.person({ shirt: 0xff0000, pants: 0x00ff00 }), torso = W.person({ shirt: 0xff0000, pants: 0x00ff00, noLegs: true, noArms: true, noHead: true });
  assert.ok(tris(torso) < tris(full) / 2 && tris(torso) > 0);
});
console.log(n + " Tests bestanden");
