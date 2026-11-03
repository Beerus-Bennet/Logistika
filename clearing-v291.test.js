/* v291: Aufräumen ohne Ausdauer: node clearing-v291.test.js */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const extract=(file,name)=>{const s=read(file),i=s.indexOf('function '+name+'('),end=s.indexOf('\n}',i);assert.ok(i>=0&&end>i);return s.slice(i,end+2);};
const C={console};vm.createContext(C);
vm.runInContext(read('erbedata.js').match(/const FJUNK = \{[\s\S]*?\n\};/)[0],C);
vm.runInContext(`var S,inv,xp,events;var room=100;
farmStaUse=()=>{throw Error('Aufräumen darf keine Ausdauer prüfen')};
farmRoom=()=>room;farmAdd=(id,n)=>{inv[id]=(inv[id]||0)+n};farmXP=n=>{xp+=n};farmEvent=e=>events.push(e);
esc=String;fqty=(id,n)=>n+' '+id;eur=String;`,C);
vm.runInContext(extract('erbe.js','farmClearJunk')+'\n'+extract('worldview.js','worldPopHTML'),C);
const run=s=>vm.runInContext(s,C);
for(const kind of ['reifen','schrott','unkraut','bretter','karre']){
 run(`S={money:0,revenue:0,farm:{sta:0,objs:[{k:'${kind}'}],stats:{cleared:0}}};inv={};xp=0;events=[];var item=S.farm.objs[0];var result=farmClearJunk(item);`);
 assert.equal(run('S.farm.sta'),0);assert.equal(run('S.farm.objs.length'),0);assert.equal(run('S.farm.stats.cleared'),1);assert.equal(run('xp'),5);
 assert.equal(JSON.stringify(run('inv')),JSON.stringify(run(`FJUNK['${kind}'].gain`)));
 assert.equal(run('S.money'),run(`FJUNK['${kind}'].m||0`));
 assert.equal(run('farmClearJunk(item)'),null);assert.equal(run('xp'),5);assert.equal(run('S.farm.stats.cleared'),1);
 assert.doesNotMatch(run(`worldPopHTML({k:'${kind}'},{kind:'junk'})`),/💪|Brotzeit|Energie/);
}
run(`S.farm.objs=[{k:'bretter'}];room=0;var result=farmClearJunk(S.farm.objs[0]);`);assert.equal(run('result.got.length'),0);assert.equal(run('farmClearJunk(null)'),null);
console.log('OK: alle fünf Gerümpelarten bei 0 Ausdauer, Belohnungen unverändert, kein Doppelgewinn, volles Lager und Anzeige ohne Kraftkosten.');
