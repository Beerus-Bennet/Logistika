/* v372: Modellidentität, reale Bauzeiträume, alte Saves und Bild-Cache. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ROOT=fs.existsSync(path.join(__dirname,'cars.js'))?__dirname:path.join(__dirname,'..');
function fixture(){
 const storage=new Map([['logistika-carpics-2',JSON.stringify({prs:{src:'https://example.com/modern-green-911.jpg',paint:['Grün','#008800']}})]]);
 const ctx=vm.createContext({console,VEHICLES:[],localStorage:{removeItem:k=>storage.delete(k),getItem:k=>storage.get(k)},location:{origin:'http://localhost'},setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},URL,AbortController,
  S:{money:5000000,time:10000,stage:6,fleet:[]},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),rnd:(a,b)=>a+(b-a)*Math.random(),pick:a=>a[0],save(){},esc:s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"),money:n=>String(n),stamp:n=>String(n),toast(){},phoneMsg(){},logMoney(){},taxWare(){},activeTab:'farm',renderDirty:false,uid:()=> 'GARAGE-1'});
 for(const f of ['cars.js','carphotos.js','auction.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});
 return {ctx,run:s=>vm.runInContext(s,ctx),storage};
}
test('127 feste IDs, Quellen, Lizenzen und SHA stimmen mit echten Dateien überein',()=>{
 const {run}=fixture(),cars=run('CARS'),photos=run('CAR_PHOTOS');assert.equal(cars.length,127);assert.equal(Object.keys(photos).length,127);
 for(const c of cars){const p=photos[c.id];assert.equal(p.model,c.id);assert.ok(p.file&&p.by&&p.lic&&p.licUrl&&p.page);assert.match(p.source,/^https:\/\/(upload|thumb)\.wikimedia\.org\//);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'cars',p.f))).digest('hex'),p.sha256);assert.equal(run(`approvedPic('${c.id}')`),true);}
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ROOT,'cars/credits.json'))),JSON.parse(JSON.stringify(photos)));
 assert.equal(photos.prs.file,'1973 Porsche 911 Carrera RS 2.7.jpg');assert.equal(photos.prs.paint[0],'Schwarz');
});
test('Lose bleiben für jedes Modell innerhalb des konkreten Bauzeitraums',()=>{
 const {ctx,run}=fixture();
 for(const c of run('CARS')){ctx.model=c;const [a,b]=run('carBuildYears(model)');assert.ok(a<=b,c.id);assert.ok(c.y>=a&&c.y<=b,c.id+': Referenzjahr');for(let n=0;n<20;n++){const l=run('makeLot({car:model.id})');assert.ok(l.y>=a&&l.y<=b,c.id);assert.deepEqual(JSON.parse(JSON.stringify(l.paint)),JSON.parse(JSON.stringify(run('CAR_PHOTOS[model.id].paint'))));}assert.equal(run('carValidYear(model,1800)'),a);assert.equal(run('carValidYear(model,2099)'),b);}
 assert.equal(run('carValidYear(CAR.prs,1975)'),1973);
});
test('Alter Porsche-Spielstand: nur unmögliches Baujahr korrigieren, Gebote/Besitz behalten (Lack folgt seit v456 dem Foto)',()=>{
 const {ctx,run,storage}=fixture();assert.equal(storage.size,0);
 const old={on:true,lots:[{id:'L1835',kind:'car',car:'prs',y:1975,paint:['Schwarz','#15161a'],price:300000,bids:1,me:{max:450000},lead:'me',done:false}],garage:[{uid:'owned',kind:'car',car:'m129',y:2001,paint:['Violett','#452345'],paid:78000,km:103100,luck:1,cond:3,consigned:'L1840'}],past:[{id:'L1800',price:120000}],idx:{},seq:1836,view:'live',brand:'all',next:20000};
 ctx.S.ah=structuredClone(old);const money=ctx.S.money;run('ah()');assert.equal(ctx.S.ah.lots[0].y,1973);assert.equal(ctx.S.ah.garage[0].y,1992);const after=structuredClone(ctx.S.ah);delete after.modelYears372;delete after.paint456;/* v456: Lack folgt dem Foto, Rest bleibt */after.lots[0].paint=old.lots[0].paint;after.garage[0].paint=old.garage[0].paint;after.lots[0].y=1975;after.garage[0].y=2001;assert.deepEqual(after,old);assert.equal(ctx.S.money,money);
 const once=JSON.stringify(ctx.S.ah);run('ah();paintOfPhoto("prs");carPicHTML(CAR.prs,"#15161a");carPicHTML(CAR.m129,"#452345");');assert.equal(JSON.stringify(ctx.S.ah),once);ctx.S.ah=JSON.parse(once);run('ah()');assert.equal(JSON.stringify(ctx.S.ah),once);
});
test('Nur freigegebene Quelle und passende Lackierung, keine Umfärbung',()=>{
 const {run}=fixture();assert.equal(run('photoFits("prs","#15161A")'),true);assert.equal(run('paintMatch("prs","#15161A")'),true);assert.equal(run('paintMatch("prs","#008800")'),false);assert.equal(run('photoFits("prs","#008800")'),true);/* v453: Foto auch bei abweichender Farbe, kein Umfärben */
 for(const id of ['prs','mg63','m765'])assert.equal(run(`approvedPic('${id}',{...PICS['${id}'],file:'Wrong generation.jpg',src:'https://example.com/wrong-car.jpg'})`),false);
 assert.equal(run('approvedPic("prs",{...PICS.prs,model:"pgt3"})'),false);run('let paintCopy=paintOfPhoto("prs");paintCopy[0]="Kaputt";');assert.equal(run('CAR_PHOTOS.prs.paint[0]'),'Schwarz');
});
test('Cache-Schlüssel unterscheidet gleich lange Bildquellen und ignoriert alte Comic-Ergebnisse',()=>{
 const {run}=fixture();const oldKey=run('comicKey("prs")');run('COMIC_SOURCE.set("prs",PICS.prs.sha256);COMIC_URL.set("prs","blob:old");');assert.equal(run('comicReady("prs")'),true);
 run('PICS.prs={...PICS.prs,sha256:"a".repeat(64)}');assert.notEqual(run('comicKey("prs")'),oldKey);assert.equal(run('comicReady("prs")'),false);assert.equal(run('approvedPic("prs")'),false);assert.match(run('comicKey("prs")'),/\/v4\/prs\/a{64}\.jpg$/);
});
test('Zuschlag und Wiedereinlieferung behalten Modell und Lack, buchen genau einmal',()=>{
 const {ctx,run}=fixture();run('let purchase=makeLot({car:"prs"});purchase.rivals=[];globalThis.buyId=purchase.id;');const start=run('purchase.start');assert.equal(run('playerBid(purchase,purchase.start).ok'),true);const before=ctx.S.money;assert.equal(run('finishLot(purchase)'),'won');assert.equal(ctx.S.money,before-Math.round(start*1.12));assert.equal(run('ah().garage[0].car'),'prs');assert.equal(run('ah().garage[0].paint[0]'),'Schwarz');run('finishLot(purchase)');assert.equal(run('ah().garage.length'),1);
 const cash=ctx.S.money,boughtYear=run('ah().garage[0].y');run('let sold=consignCar(ah().garage[0].uid,500000)');assert.equal(run('sold.car'),'prs');assert.equal(run('sold.y'),boughtYear);assert.equal(run('sold.paint[0]'),'Schwarz');assert.equal(ctx.S.money,cash);
});
