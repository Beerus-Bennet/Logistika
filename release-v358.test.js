/* v358: Gemeinsame App-Shell nach Integration des parallelen Jagd-PRs. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const handlers=new Map(),C=vm.createContext({self:{addEventListener:(k,f)=>handlers.set(k,f)}});
vm.runInContext(fs.readFileSync('sw.js','utf8'),C);
assert.deepEqual([...handlers.keys()].sort(),['activate','fetch','install']);
const version=vm.runInContext('VERSION',C);assert.match(version,/^v[0-9]+$/); /* v359: fortlaufende Lieferung statt fester historischer Nummer */
const shell=Array.from(vm.runInContext('SHELL',C)),html=fs.readFileSync('index.html','utf8');
assert.ok(shell.length>80,'vollständige App-Shell');
for(const file of ['viewport.js','style.css','camp.js','staffgear.js','worldview.js','events.js','farmview.js','game.js','hunt.js','villageview.js','vista.js','corp.js','corpreport.js','villagesite.js','villagegarden.js']){
 const m=html.match(new RegExp(file.replaceAll('.','\\.')+'\\?v=([0-9]+)'));assert.ok(m,file+' im HTML');
 assert.ok(shell.includes('./'+file+'?v='+m[1]),file+' gleiche Version im Offline-Cache');assert.ok(fs.existsSync(file));
}
assert.ok(!html.includes('src="corpshark.js')&&!shell.some(s=>s.includes('corpshark.js')),'Hai-Animation wird nicht mehr geladen');
assert.ok(html.includes('window.LOGI_V = "'+version.slice(1)+'"'));
for(const [,file] of html.matchAll(/(?:src|href)="([^"?]+)\?v=\d+"/g))if(/\.js$/.test(file))assert.ok(shell.some(s=>s.split('?')[0]==='./'+file),file+' offline enthalten');
for(const file of ['sw.js','index.html','style.css','CLAUDE.md','AENDERUNGEN.md'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/^(?:<<<<<<<|=======|>>>>>>>) /m,'keine Konfliktmarker');
const docs=fs.readFileSync('docs/INSEL-WERKZEUGE-v358.md','utf8');for(const [,asset]of docs.matchAll(/\]\((assets\/[^)]+)\)/g))assert.ok(fs.existsSync('docs/'+asset),asset);
console.log('OK '+version+': vollständiger Service Worker mit drei Ereignissen, App-Shell, konsistente neue Asset-Versionen, Jagd-PR und Vorschauen erhalten.');
