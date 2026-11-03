/* v277: node shadow.test.js – sichtbare Bodenfläche und hohe Schattenwerfer bleiben in der Schattenkarte. */
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = fs.existsSync(path.join(__dirname, 'gl3d.js')) ? __dirname : path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'gl3d.js'), 'utf8');
const camera = source.slice(source.indexOf('    function updateCamera()'), source.indexOf('    R.updateCamera = updateCamera;'));
/* Die echte Kamerafunktion mit ihren internen Mathehelfern ausführen, ohne GPU-Doppelimplementierung. */
const ctx = {}; vm.createContext(ctx);
vm.runInContext(source.replace('return { MB, create,', 'return { cameraTest: (R, SH) => {' + camera + 'updateCamera();}, xf4, create, MB,') + ';this.G=G3;', ctx);
const G = ctx.G; let checks = 0;
for (const aspect of [1920 / 900, 1, 0.5]) for (const yaw of [0.78, 3.9]) for (const tx of [-30, 0, 30]) {
  const R = { cam: { tx, ty: 0, tz: -8, dist: 55, pitch: 1, yaw, fov: .55 }, w: aspect * 900, h: 900,
    shadowBox: 22, env: { sun: G.norm([.8, .3, .4]) }, V: G.ID(), P: G.ID(), VP: G.ID(), IVP: G.ID(), LVP: G.ID() };
  G.cameraTest(R, 2048);
  for (const x of [-1, 1]) for (const y of [-1, 1]) {
    const q = G.xf4(R.IVP, [x, y, 1, 1]), p = q.slice(0, 3).map(v => v / q[3]);
    const t = -R.eye[1] / (p[1] - R.eye[1]);
    for (const h of [0, 20]) {
      const v = G.xf4(R.LVP, [R.eye[0] + (p[0] - R.eye[0]) * t, h, R.eye[2] + (p[2] - R.eye[2]) * t, 1]);
      for (let i = 0; i < 3; i++) assert.ok(Math.abs(v[i] / v[3]) <= 1.00001, `abgeschnitten: aspect=${aspect}, yaw=${yaw}, x=${tx}, Höhe=${h}, Achse=${i}`);
      checks++;
    }
  }
}
console.log(checks + ' Schatten-Abdeckungsprüfungen bestanden');
