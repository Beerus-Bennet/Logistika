/* v419: Sichtbare Öffnungen und festes Geometriebudget der Waffenmodelle.
   node weapons-v419.test.js – echte Dreiecke, kein WebGL nötig. */
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const C = { S: { money: 10000, farm: { guns: { own: { m18: 1 }, sel: 'm18' } } } }; C.window = C; vm.createContext(C);
for (const file of ['gl3d.js', 'weapons.js']) vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, file), 'utf8').replace(/^const (G3|WEAPONS) =/m, 'var $1 ='), C);
const W = C.WEAPONS, before = JSON.stringify(C.S), meshes = {};
const sub = (a, b) => a.map((n, i) => n - b[i]), dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function hit(v, o, dir) {
  let nearest = Infinity;
  for (let i = 0; i < v.length; i += 27) {
    const a = v.slice(i, i+3), e1 = sub(v.slice(i+9, i+12), a), e2 = sub(v.slice(i+18, i+21), a);
    const p = cross(dir, e2), det = dot(e1, p); if (Math.abs(det) < 1e-10) continue;
    const t = sub(o, a), u = dot(t, p)/det; if (u < -1e-7 || u > 1+1e-7) continue;
    const q = cross(t, e1), w = dot(dir, q)/det; if (w < -1e-7 || u+w > 1+1e-7) continue;
    const d = dot(e2, q)/det; if (d > 1e-7) nearest = Math.min(nearest, d);
  }
  return nearest;
}
let total = 0;
for (const w of W.LIST) {
  const v = meshes[w.id] = W.model(w.id).v;
  assert.ok(v.every(Number.isFinite) && v.length % 27 === 0, w.id+' endliche Dreiecke');
  assert.ok(v.length/27 <= 1500, w.id+' begrenzte Geometrie'); total += v.length/27;
  assert.equal(JSON.stringify(v), JSON.stringify(W.model(w.id).v), w.id+' deterministisch');
}
assert.ok(total <= 8500, 'Gesamtbudget'); assert.equal(JSON.stringify(C.S), before, 'Modellbau ändert keinen Spielstand');
console.log('ok: zehn deterministische Modelle, '+total+' Dreiecke, kein Save-Eingriff');
const bores = {
  m18:[[.645,.012,0,.0145]], r8:[[.645,.012,0,.0145]], sr1:[[.605,.012,0,.0145]],
  cz375:[[.605,.012,0,.019]], r8wm:[[.745,.012,0,.019]],
  dbl:[[.625,.016,-.02,.0155],[.625,.016,.02,.0155]], royal:[[.625,.016,-.02,.0155],[.625,.016,.02,.0155]],
  b525:[[.765,.02,0,.0155],[.765,-.012,0,.0155]], g17:[[.126,.048,0,.009]], rh454:[[.236,.062,0,.02]]
};
for (const id in bores) for (const [x,y,z,r] of bores[id]) {
  const depth = hit(meshes[id], [x+.02,y,z], [-1,0,0]);
  assert.ok(depth > .034 && depth < .038, id+' vertiefte Lauföffnung statt geschlossener Kappe: '+depth);
  const crown = hit(meshes[id], [x+.02,y+r*.8,z], [-1,0,0]);
  assert.ok(Math.abs(crown-.02)<1e-6, id+' sichtbarer Mündungsring');
}
console.log('ok: alle 13 Lauföffnungen mit Tiefe und geschlossenem Metallrand');
const guards = {m18:[-.138,-.043,.082],r8:[-.138,-.043,.082],sr1:[-.138,-.043,.082],cz375:[-.138,-.043,.082],r8wm:[-.138,-.043,.082],dbl:[-.14,-.051,.09],royal:[-.14,-.051,.09],b525:[-.191,-.059,.086],g17:[.025,-.019,.08],rh454:[-.045,-.028,.075]};
for (const id in guards) {
  const [x,y,w] = guards[id];
  assert.equal(hit(meshes[id], [x+w*.25,y,.2], [0,0,-1]), Infinity, id+' freie Öffnung neben dem Abzug');
  assert.ok(Number.isFinite(hit(meshes[id], [x+w*.47,y,.2], [0,0,-1])), id+' Bügel um die Öffnung');
}
console.log('ok: offene Abzugsbügel an allen zehn Waffen');
