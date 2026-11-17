/* v383: Waffenkatalog, Kauf, Energie/Eignung und Modelle. node weapons-v383.test.js */
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), assert = require('node:assert/strict');
const C = { console, S: { money: 20000, expense: 0, farm: {} }, save() {}, logMoney() {}, money: n => n + ' €', esc: s => String(s) };
C.window = C; vm.createContext(C);
for (const f of ['gl3d.js', 'weapons.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/^const (G3|WEAPONS) =/m, 'var $1 ='), C);
const W = vm.runInContext('WEAPONS', C);
let n = 0; const test = (t, fn) => { fn(); console.log('ok ' + (++n) + ' ' + t); };

test('Katalog: 10 Waffen, eindeutige Kennungen, genau eine Sonderwaffe, Startwaffe kostenlos', () => {
  assert.equal(W.LIST.length, 10);
  assert.equal(new Set(W.LIST.map(w => w.id)).size, 10);
  assert.equal(W.LIST.filter(w => w.special).map(w => w.id).join(), 'royal');
  assert.equal(W.BY.m18.price, 0);
  W.LIST.forEach(w => { assert.ok(w.name && w.cal && w.type && w.txt && w.real, w.id + ' beschriftet'); assert.ok(w.mag >= 1 && w.cyc > 0 && w.rel > 0 && w.zooms.length && w.maxR > 0, w.id + ' Werte'); if (!w.special && w.id !== 'm18') assert.ok(w.price > 0, w.id + ' hat Preis'); });
});
test('Mündungsenergie entspricht den realen Größenordnungen (±8 %)', () => {
  const real = { m18: 3930, dbl: 3675, cz375: 5030, r8wm: 5170, g17: 518, rh454: 2425 };
  for (const id in real) { const e = W.E0(W.BY[id]); assert.ok(Math.abs(e / real[id] - 1) < 0.08, id + ' ' + Math.round(e) + ' J statt ' + real[id]); }
});
test('Eignung: Pistole und Flinte nur Fasan, Revolver nah, Büchsen weit', () => {
  assert.ok(W.canKill(W.BY.g17, 'fasan', 30) && !W.canKill(W.BY.g17, 'hirsch', 10) && !W.canKill(W.BY.g17, 'keiler', 10) && !W.canKill(W.BY.g17, 'fasan', 80));
  assert.ok(W.canKill(W.BY.b525, 'fasan', 40) && !W.canKill(W.BY.b525, 'hirsch', 20) && !W.canKill(W.BY.b525, 'fasan', 70));
  assert.ok(W.canKill(W.BY.rh454, 'hirsch', 40) && W.canKill(W.BY.rh454, 'keiler', 60) && !W.canKill(W.BY.rh454, 'hirsch', 95));
  assert.ok(W.canKill(W.BY.m18, 'hirsch', 200) && !W.canKill(W.BY.m18, 'hirsch', 450));
  assert.ok(W.canKill(W.BY.r8wm, 'hirsch', 500) && W.canKill(W.BY.sr1, 'keiler', 100));
});
test('Durchschuss: schwere Kaliber immer, Pistole nie', () => {
  ['dbl', 'cz375', 'royal'].forEach(id => assert.ok(W.BY[id].thru && W.BY[id].pen >= 9, id));
  assert.ok(W.BY.g17.pen < 0.5 && !W.BY.g17.thru);
});
test('Schnellfeuer: Selbstlader, Doppelbüchse und Pistole schneller als Repetierer; Sonderwaffe ohne Nachschuss-Abzug', () => {
  assert.ok(W.BY.sr1.cyc < W.BY.m18.cyc / 2 && W.BY.dbl.cyc < W.BY.m18.cyc / 3 && W.BY.g17.cyc < 0.25 && W.BY.g17.mag === 17);
  assert.equal(W.BY.sr1.mag, 3);                /* Jagd-Selbstlader: 2 im Magazin + 1 im Lauf */
  assert.ok(W.BY.royal.noMulti && !W.BY.dbl.noMulti && W.BY.royal.bonus > 0);
});
test('Spielstand: Startwaffe, Kauf, zu wenig Geld, Sonderwaffe nicht käuflich, Wahl, Lucky-Gewinn', () => {
  assert.equal(W.cur().id, 'm18'); assert.ok(W.owns('m18') && !W.owns('r8'));
  assert.equal(W.buy('royal'), 'nein'); C.S.money = 100; assert.equal(W.buy('r8'), 'geld'); assert.ok(!W.owns('r8'));
  C.S.money = 5000; assert.equal(W.buy('r8'), 'ok'); assert.equal(C.S.money, 800); assert.equal(C.S.expense, 4200); assert.equal(W.cur().id, 'r8');
  assert.equal(W.buy('r8'), 'nein');
  assert.ok(W.select('m18') && W.cur().id === 'm18'); assert.ok(!W.select('g17'));
  assert.equal(W.list().length, 9); assert.equal(W.owned().map(w => w.id).sort().join(), 'm18,r8');      /* Schrank zeigt die Sonderwaffe erst mit Besitz */
  assert.ok(W.grant('royal') && !W.grant('royal') && W.owns('royal'));
  assert.equal(W.list().length, 10); assert.equal(W.owned().map(w => w.id).sort().join(), 'm18,r8,royal');
  C.S.farm.guns.sel = 'xyz'; assert.equal(W.cur().id, 'm18');        /* kaputte Wahl fällt auf die Startwaffe zurück */
});
test('Alle 3D-Modelle bauen geschlossene, endliche Dreiecke', () => {
  W.LIST.forEach(w => { const b = W.model(w.id); assert.ok(b.v.length > 27 * 20 && b.v.length % 27 === 0, w.id); assert.ok(b.v.every(Number.isFinite), w.id + ' endlich'); });
});
console.log(n + ' Waffenprüfungen v383 bestanden.');
