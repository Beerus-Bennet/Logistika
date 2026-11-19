/* v418: Trägerschuss nur durch Weichteile ist beim Schalenwild nicht tödlich. node traeger-weich-v418.test.js */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const C={console,performance:{now:()=>Date.now()},navigator:{userAgent:'node'},localStorage:{getItem:()=>null,setItem(){}}};C.window=C;vm.createContext(C);
for(const f of ['gl3d.js','hunt.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),C);
const H=vm.runInContext('HUNT',C);let n=0;const test=(t,fn)=>{fn();console.log('ok '+(++n)+' '+t);};
const fate=org=>{const ids=org.map(o=>o.id);return ids.includes('hwirbel')?'spine':ids.some(i=>/^(schlagader|drossel|luftroehre)/.test(i))?'vessel':'soft';};
const P={x:0,y:0,z:0,ry:0,s:1,nrx:-0.35,nry:0,hrx:0.2,legs:[[0,0],[0,0],[0,0],[0,0]]};
const neckShots=k=>{const out=[];for(let y=0;y<=2.2;y+=0.02)for(let z=-1.5;z<=1.8;z+=0.02){const o=[6,y,z],d=[-1,0,0],h=H.zoneHit(k,P,o,d);
  if(h&&h.zone==='hals')out.push(H._shotRec(k,P,o,d,h,120,{}));}return out;};
test('Weichschuss am Träger ist nicht tödlich, Wirbel/Adern/Luftröhre bleiben tödlich (Hirsch, Keiler)',()=>{
 assert.equal(H.ZONE.halsweich.kill,false);assert.equal(H.ZONE.hals.kill,true);
 for(const k of ['hirsch','keiler']){const L=neckShots(k);let soft=0;assert.ok(L.length>100,k+': genug Trägertreffer');
  for(const rec of L){const f=fate(rec.org),z=H._neckSoft(k,'hals',rec);
   if(f==='soft'){soft++;assert.equal(z,'halsweich');assert.equal(rec.soft418,1);assert.equal(rec.dmg,30);assert.equal(rec.zone,'hals','Kanal/Wunde bleiben am Hals');}
   else{assert.equal(z,'hals');assert.equal(rec.soft418,undefined);}}
  assert.ok(soft>0&&soft<L.length,k+': beides kommt vor');
  console.log('   '+k+': '+Math.round(soft/L.length*100)+' % der Trägertreffer nur Weichteile');}
});
test('Fasan und andere Zonen unverändert',()=>{
 assert.equal(H._neckSoft('fasan','hals',{org:[{id:'decke'}]}),'hals');
 for(const z of ['herz','lunge','kopf','koerper'])assert.equal(H._neckSoft('hirsch',z,{org:[{id:'decke'}]}),z);
});
test('Trefferbild: neue Weichschüsse als „Weichschuss am Träger“, alte Trägerschüsse behalten ihre Wertung',()=>{
 const rec=neckShots('hirsch').find(r=>fate(r.org)==='soft');const old=JSON.parse(JSON.stringify(rec));
 H._neckSoft('hirsch','hals',rec);
 const a=H._xrShot('hirsch',rec),b=H._xrShot('hirsch',old);
 assert.equal(a.reportZone,'halsweich');assert.equal(a.anatomyUpdated,false);
 assert.equal(b.reportZone,'hals');assert.equal(b.dmg,old.dmg);
});
console.log(n+' Prüfgruppen v418 bestanden.');
