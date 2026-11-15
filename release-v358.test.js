/* v358: Gemeinsame App-Shell nach Integration des parallelen Jagd-PRs. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const handlers=new Map(),C=vm.createContext({self:{addEventListener:(k,f)=>handlers.set(k,f)}});
vm.runInContext(fs.readFileSync('sw.js','utf8'),C);
assert.deepEqual([...handlers.keys()].sort(),['activate','fetch','install']);
assert.equal(vm.runInContext('VERSION',C),'v358');
const shell=Array.from(vm.runInContext('SHELL',C)),html=fs.readFileSync('index.html','utf8');
assert.ok(shell.length>80,'vollständige App-Shell');
for(const file of ['viewport.js','style.css','camp.js','staffgear.js','worldview.js']){
 assert.ok(html.includes(file+'?v=358'),file+' im HTML');assert.ok(shell.includes('./'+file+'?v=358'),file+' im Offline-Cache');assert.ok(fs.existsSync(file));
}
assert.ok(html.includes('hunt.js?v=357')&&shell.includes('./hunt.js?v=357'),'Jagd-PR mit unveränderter Asset-Version erhalten');
assert.match(html,/LOGI_V = "358"/);
for(const [,file] of html.matchAll(/(?:src|href)="([^"?]+)\?v=\d+"/g))if(/\.js$/.test(file))assert.ok(shell.some(s=>s.split('?')[0]==='./'+file),file+' offline enthalten');
for(const file of ['sw.js','index.html','style.css','CLAUDE.md','AENDERUNGEN.md'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/^(?:<<<<<<<|=======|>>>>>>>) /m,'keine Konfliktmarker');
const docs=fs.readFileSync('docs/INSEL-WERKZEUGE-v358.md','utf8');for(const [,asset]of docs.matchAll(/\]\((assets\/[^)]+)\)/g))assert.ok(fs.existsSync('docs/'+asset),asset);
console.log('OK v358: vollständiger Service Worker mit drei Ereignissen, App-Shell, konsistente neue Asset-Versionen, Jagd-PR und Vorschauen erhalten.');
