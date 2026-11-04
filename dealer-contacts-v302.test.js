/* v302: node dealer-contacts-v302.test.js
   Echte Telefon-/Händlerfunktionen mit kleinem DOM-Ersatz und Transportplaner-Fixture.
   Keine Wallet-Kurse aus dem Netz, keine echten Zahlungen, kein Browsertest. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = fs.existsSync(path.join(__dirname, 'offices.js')) ? __dirname : path.join(__dirname, '..');
const ctx = vm.createContext({ console, DECISIONS: {} });
const run = s => vm.runInContext(s, ctx);
for (const file of ['offices.js', 'snus.js', 'pablo.js']) run(fs.readFileSync(path.join(root, file), 'utf8'));
run(`
var notices=[], hints=[], saves=0, saved='', rendered=0, modalHTML='', buttons=[], nodes={};
function element(){return {scrollTop:0,style:{},dataset:{},classList:{contains:x=>x==='open',add(){},remove(){},toggle(){}},scrollIntoView(){}};}
nodes['#modal']=element();nodes['#modalBody']=element();nodes['.phone-list']=element();
Object.defineProperty(nodes['#modalBody'],'innerHTML',{get:()=>modalHTML,set:html=>{
 modalHTML=html;buttons=[];
 for(const m of html.matchAll(/<button\\b([^>]*)>/g)){
   const b=element(); b.disabled=/\\sdisabled(?:\\s|$)/.test(m[1]);
   for(const a of m[1].matchAll(/data-([a-z]+)="([^"]*)"/g))b.dataset[a[1]]=a[2];
   const id=m[1].match(/id="([^"]*)"/); if(id)nodes['#'+id[1]]=b;
   buttons.push(b);
 }
}});
function $(s){if(s==='#phoneBtn'||s==='#phoneCount')return null;if(s==='#modalBody .phone')return modalHTML.includes('mhead phone')?element():null;
 if(s.includes('[data-mid='))return null;return nodes[s]||element();}
function $$(s){const a=s.match(/\\[data-([a-z]+)\\]/);return a?buttons.filter(b=>a[1] in b.dataset):[];}
var document={body:{classList:{add(){},remove(){}}}};
var N={a:{id:'a',name:'Berlin',short:'Berlin',type:'city',modes:['r','a'],lat:52,lon:13},
 b:{id:'b',name:'Potsdam',short:'Potsdam',type:'city',modes:['r','a'],lat:52.1,lon:13.1},
 c:{id:'c',name:'Hamburg',short:'Hamburg',type:'city',modes:['r','a'],lat:53,lon:10}};
var AV={outfits:[{id:'bluse'},{id:'hoodie'}],beards:[0,1]};
function esc(x){return String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function money(x){return x+' €';} function kgf(x){return x+' kg';}function kmf(x){return x+' km';}function dur(x){return x+' min';}
function fmt(x){return String(x);}function stamp(t){return 'Tag '+t;}function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function dayOf(t){return Math.floor(t/1440)+1;}function clock(t){return String(t);}
function rnd(a,b){return a+(b-a)*Math.random();}function pick(a){return a[Math.floor(Math.random()*a.length)];}
function level(){return S.testLevel;}function logiOn(){return S.logi!==false;}
function toast(t){notices.push(t);}function linaHint(k){hints.push(k);}function save(){saves++;saved=JSON.stringify(S);}
function render(){rendered++;}function closeModal(){}function setTimeout(){return 1;}
function logMoney(k,l,a){S.ledger.push({k,l,a,t:S.time});}function unlockedNodes(){return Object.values(N);}
function hav(){return 5;}function makeAddr(node,kind){return {t:kind+' '+node};}
function plan(){return {time:20,dist:10};}function buildVariants(o){return [o];}function planOptions(){return [{}];}function bestOption(x){return x[0];}
function addrText(a){return a&&a.t||'';}function oPick(o){return o.pick;}function oDrop(o){return o.drop;}
snusGuy=()=>({outfit:1,beard:1,acc:0,hair:0});
var S;
function fresh(){S={seq:1,time:1000,stage:4,testLevel:3,money:1e9,expense:0,orders:[],jobs:[],bases:[],fleet:[{at:'a'}],ledger:[],phone:{msgs:[],unread:0}};
 notices=[];hints=[];saves=0;saved='';rendered=0;phoneTab='msgs';modalHTML='';}
`);
let count = 0;
function test(name, fn) { run('fresh()'); fn(); count++; console.log('ok ' + name); }
const get = s => JSON.parse(run(`JSON.stringify(${s})`));
const click = (key, value) => {
  ctx.key = key; ctx.value = value;
  assert.equal(run('!!buttons.find(b=>b.dataset[key]===value && typeof b.onclick==="function")'), true, 'Gebundene Schaltfläche ' + key);
  run('var tapped=buttons.find(b=>b.dataset[key]===value);if(!tapped.disabled)tapped.onclick();');
};

test('Freischaltung und genau eine Begrüßung je Händler, auch nach Ablauf/Neuladen/Monaten', () => {
  run('S.testLevel=1;S.stage=2;tickSnus();tickPablo();');
  assert.equal(run('S.phone.msgs.length'), 0);
  run('S.testLevel=2;S.stage=3;tickSnus();tickPablo();S.time+=500;tickSnus();tickPablo();');
  assert.deepEqual(get('S.phone.msgs.map(m=>m.kind).sort()'), ['pablo', 'snus']);
  assert.equal(run('S.phone.unread'), 2);
  assert.equal(run('notices.length'), 2);
  assert.equal(run('saves>=2'), true, 'Begrüßung sofort gespeichert');
  run('S=JSON.parse(saved);S.time+=1500;prunePhone();for(var i=0;i<90;i++){S.time+=1440;tickSnus();tickPablo();}');
  assert.equal(run('S.phone.msgs.length'), 0);
  assert.deepEqual(get('S.phone.contacts'), {snus:true,pablo:true});
  run('snusOffer();pabloOffer();');
  assert.equal(run('S.phone.msgs.length'), 0);
});

test('Migration vor Chat-Löschung: alte Absagen, Käufe und Tutorialkontakte bleiben bekannt', () => {
  run(`S.phone.msgs=[{kind:'snus',state:'no',time:-9999,thread:[]}];S.pablo={kg:700,bought:1000,sold:300};prunePhone();`);
  assert.equal(run('S.phone.msgs.length'), 0);
  assert.deepEqual(get('phoneContactsState()'), {snus:true,pablo:true});
  run('tickSnus();tickPablo();S.time+=1e6;tickSnus();tickPablo();');
  assert.equal(run('S.phone.msgs.length'), 0);
  run('fresh();S.tutSeen={snus:true,pablo:true};phoneContactsState();S=JSON.parse(JSON.stringify(S));prunePhoneSilent();');
  assert.deepEqual(get('phoneContactsState()'), {snus:true,pablo:true});
  run('fresh();snusState();pabloState();');
  assert.deepEqual(get('phoneContactsState()'), {}, 'Nur ein leerer Zustandscontainer ist noch keine Bekanntschaft');
});

test('Telefon-Reiter, dauerhafte Kontaktkarten und stille Anfrage über echte Klickbindungen', () => {
  run('snusOffer();pabloOffer();S.time+=1500;prunePhone();openPhone();');
  click('ptab','contacts');
  assert.match(run('modalHTML'), /Mr\. Snus/);assert.match(run('modalHTML'), /Don Pablo/);
  assert.match(run('modalHTML'), /Kokain & Crack/);
  const n = run('notices.length'), unread = run('S.phone.unread');
  click('contact','pablo');
  assert.equal(run('phoneTab'), 'msgs');
  assert.equal(run('notices.length'), n);assert.equal(run('S.phone.unread'), unread);
  assert.match(run('modalHTML'), /data-pbstep="M\d+\|crack\|1"/);
  click('pbstep',run('pabloOpenMsg().id')+'|crack|1');
  assert.equal(run('pabloPicked(pabloOpenMsg(),"crack")'), 1);
  const offer = run('pabloOpenMsg().id');
  click('ptab','contacts');click('contact','pablo');
  assert.equal(run('pabloOpenMsg().id'), offer, 'Wiederholtes Öffnen legt keine Chats an');
  assert.equal(run('S.phone.msgs.length'), 1);
  click('ptab','news');assert.equal(run('phoneTab'), 'news');click('ptab','calc');assert.equal(run('phoneTab'), 'calc');
});

test('Sortimente bleiben bei Absage, Ablauf und Speicherzyklus stabil', () => {
  run('snusOffer();pabloOffer();var sn=snusOpenMsg(),pb=pabloOpenMsg();snusReply(sn.id,true);pabloReply(pb.id,true);');
  const sn = get('sn.offer'), pb = get('pabloRows(pb)');
  run('snusCancel(sn.id);pabloCancel(pb.id);S=JSON.parse(saved);phoneContactDealer("snus");phoneContactDealer("pablo");');
  assert.deepEqual(get('snusOpenMsg().offer'), sn);assert.deepEqual(get('pabloRows(pabloOpenMsg())'), pb);
  run('S.time+=1500;prunePhone();S=JSON.parse(JSON.stringify(S));phoneContactDealer("snus");phoneContactDealer("pablo");');
  assert.deepEqual(get('snusOpenMsg().offer'), sn);assert.deepEqual(get('pabloRows(pabloOpenMsg())'), pb);
});

test('Bestand und laufende Lieferungen sperren neue Bestellung und alte offene Angebote', () => {
  run('snusOffer();pabloOffer();var sn=snusOpenMsg(),pb=pabloOpenMsg();snusReply(sn.id,true);pabloReply(pb.id,true);snusAll(sn.id,true);pabloAll(pb.id,true);');
  const cash = run('S.money');
  run('S.snus.stock[sn.offer[0].id]=1;S.pablo.stock.kokain=50;S.pablo.kg=50;snusBuy(sn.id);pabloBuy(pb.id);');
  assert.equal(run('S.money'), cash);
  run('S.snus.stock={};S.pablo.stock={kokain:0,crack:0};S.pablo.kg=0;S.jobs=[{order:{snus:{n:1}}},{order:{pablo:{kg:50}}}];snusBuy(sn.id);pabloBuy(pb.id);');
  assert.equal(run('S.money'), cash);assert.match(run('phoneDealerBlock("snus")'), /unterwegs/);
  run('S.jobs=[];S.time+=1500;prunePhone();S.jail={};phoneContactDealer("snus");phoneContactDealer("pablo");');
  assert.equal(run('S.phone.msgs.length'), 0);
  run('S.jail=null;S.over={};phoneContactDealer("snus");phoneContactDealer("pablo");');assert.equal(run('S.phone.msgs.length'), 0);
  run('S.over=null;S.logi=false;phoneContactDealer("snus");phoneContactDealer("pablo");');assert.equal(run('S.phone.msgs.length'), 0);
  run('S.logi=true;phoneContactDealer("snus");phoneContactDealer("pablo");');assert.equal(run('S.phone.msgs.length'), 2);
});

test('Snus-Einkauf, Mengenbegrenzung, Zahlung und gespeicherte Auswahl', () => {
  run('snusOffer();var sn=snusOpenMsg();snusReply(sn.id,true);var sid=sn.offer[0].id;snusStep(sn.id,sid,9999);');
  assert.equal(run('sn.pick[sid]'), run('sn.offer[0].have'));
  run('S=JSON.parse(saved);sn=snusOpenMsg();sid=sn.offer[0].id;var n=sn.pick[sid],cash=S.money;snusBuy(sn.id,{eur:1,sol:1});');
  assert.equal(run('S.money'), run('cash'), 'Geänderte Wallet-Auswahl nicht abgerechnet');
  run('snusBuy(sn.id);');assert.equal(run('S.money'), run('cash-n*SNUS_BUY'));
  assert.equal(run('snusTotal()'), run('n'));assert.equal(run('S.snus.bought'), run('n'));
  assert.equal(run('S.orders.length'), 2, 'Erste sichere Kunden erzeugt');
  run('var paid=S.money;snusBuy(sn.id);');assert.equal(run('S.money'),run('paid'));
  assert.equal(run('S.snus.supply302'),undefined,'Neue Lieferung erst nach Einkauf');
});

test('Gemischter Pablo-Einkauf und getrennte Reservierung, Entnahme, Rückgabe, Abschluss', () => {
  run('pabloOffer();var pb=pabloOpenMsg();pabloReply(pb.id,true);pabloStep(pb.id,"crack",1);pabloStep(pb.id,"kokain",1);var cash=S.money;pabloBuy(pb.id);');
  assert.equal(run('S.money'),run('cash-2000*PABLO_BUY'));
  assert.deepEqual(get('S.pablo.stock'),{kokain:1000,crack:1000});assert.equal(run('S.pablo.kg'),2000);
  assert.equal(run('S.pablo.bought'),2000);assert.equal(run('S.orders[0].pablo.cop'),false);
  assert.match(run('pabloStockHTML()'),/Crack/);assert.match(run('pabloStockHTML()'),/Kokain/);
  run(`S.orders=[{pablo:{kg:400,sort:'crack'}},{pablo:{kg:300}}];`);
  assert.equal(run('pabloFree("crack")'),600);assert.equal(run('pabloFree("kokain")'),700);assert.equal(run('pabloFree()'),1300);
  run(`var o={pablo:{kg:400,sort:'crack'}};pabloTake(o);`);
  assert.deepEqual(get('S.pablo.stock'),{kokain:1000,crack:600});assert.equal(run('S.pablo.kg'),1600);
  run('pabloGiveBack(o);');assert.equal(run('S.pablo.kg'),2000);assert.equal(run('S.pablo.stock.crack'),1000);
  run('pabloTake(o);pabloDelivered(o,32000);');assert.equal(run('S.pablo.sold'),400);assert.equal(run('S.pablo.earned'),32000);
  assert.equal(run('shadowTotals().pb.stock'),1600);assert.match(run('shadowBookHTML()'),/Don Pablo/);
});

test('Alte Pablo-Bestände, numerische Angebote und untypisierte laufende Aufträge kompatibel', () => {
  run(`S.pablo={kg:700,at:'a',bought:1000,sold:300};var old={id:'OLD',kind:'pablo',time:S.time,state:'offer',expires:S.time+500,tons:10,pick:2,thread:[{list:true}]};S.phone.msgs=[old];`);
  assert.deepEqual(get('pabloState().stock'),{kokain:700,crack:0});
  run('pabloTake({pablo:{kg:700}});pabloGiveBack({pablo:{kg:700}});');assert.equal(run('S.pablo.kg'),700);
  run('S.pablo.kg=0;S.pablo.stock.kokain=0;pabloStep("OLD","kokain",1);');assert.equal(run('pabloPicked(old,"kokain")'),3);
  assert.match(run('pabloMsgHTML(old)'),/Kokain/);
  run('pabloBuy("OLD");');assert.deepEqual(get('S.pablo.stock'),{kokain:3000,crack:0});
  assert.doesNotMatch(run('S.ledger[0].l'),/object Object/);
  run('S=JSON.parse(saved);pabloState();');assert.equal(run('S.pablo.kg'),3000,'Migration bucht nicht doppelt');
});

test('Kleine Restmengen beider Waren vollständig auslieferbar, keine vermischten Kundenaufträge', () => {
  for(const sort of ['kokain','crack']) for(const kg of [1,50,250,300,1000]) {
    run(`fresh();var beforeRandom=Math.random;Math.random=()=>0.99;S.pablo={kg:${kg},at:'a',bought:${kg},sold:0,stock:{kokain:0,crack:0},stock302:true};S.pablo.stock['${sort}']=${kg};var o=pabloCustomer(true);Math.random=beforeRandom;`);
    assert.equal(run('o.pablo.sort'), sort);assert.ok(run('o.pablo.kg')>0 && run('o.pablo.kg')<=kg);
    if(kg<300) assert.equal(run('o.pablo.kg'), kg);
    assert.match(run('o.desc'),new RegExp(sort==='crack'?'Crack':'Kokain'));
    assert.match(run('pabloOrderCard(o,"")'),new RegExp(sort==='crack'?'Crack':'Kokain'));
    assert.equal(run('pabloCustomer(true)'),null,'Reservierter Rest nicht doppelt vergeben');
    run('S.orders=[];pabloTake(o);S.jobs=[{order:o}];');assert.match(run('phoneDealerBlock("pablo")'),/unterwegs/);
    run('pabloDelivered(o,o.pay);S.jobs=[];');assert.equal(run('phoneDealerBlock("pablo")'),'');
  }
});

test('Neue Sortimente unterscheiden sich nach Einkauf, auch bei identischer Zufallsfolge', () => {
  run('var nativeRandom=Math.random;Math.random=()=>0.5;snusOffer();pabloOffer();var sn=snusOpenMsg(),pb=pabloOpenMsg();snusReply(sn.id,true);pabloReply(pb.id,true);snusAll(sn.id,true);pabloAll(pb.id,true);');
  const sn = get('sn.offer'), pb = get('pabloRows(pb)');
  run('snusBuy(sn.id);pabloBuy(pb.id);S.orders=[];S.snus.stock={};S.pablo.stock={kokain:0,crack:0};S.pablo.kg=0;phoneContactDealer("snus");phoneContactDealer("pablo");');
  assert.notDeepEqual(get('snusOpenMsg().offer'),sn);assert.notDeepEqual(get('pabloRows(pabloOpenMsg())'),pb);
  run('Math.random=nativeRandom;');
});

test('Abgelaufene Angebote, fehlendes Guthaben und doppelte Kaufbestätigung buchen nichts', () => {
  run('snusOffer();pabloOffer();var sn=snusOpenMsg(),pb=pabloOpenMsg();snusReply(sn.id,true);pabloReply(pb.id,true);snusAll(sn.id,true);pabloAll(pb.id,true);S.money=0;snusPay(sn.id);pabloPay(pb.id);');
  assert.equal(run('S.expense'),0);
  run('S.money=1e9;S.time=Math.max(sn.expires,pb.expires)+1;snusBuy(sn.id);pabloBuy(pb.id);phoneExpireDealerOffers("snus");phoneExpireDealerOffers("pablo");');
  assert.equal(run('S.expense'),0);assert.equal(run('sn.state'),'gone');assert.equal(run('pb.state'),'gone');
  assert.match(run('sn.thread.at(-1).t'),/Kontakte/);assert.match(run('pb.thread.at(-1).t'),/Kontakte/);
});

test('Alte parallele Werbeangebote verlieren nach dem Einkauf ihre Gültigkeit', () => {
  run('snusOffer();pabloOffer();var sn=snusOpenMsg(),pb=pabloOpenMsg();snusReply(sn.id,true);pabloReply(pb.id,true);');
  run(`S.phone.msgs.push({...JSON.parse(JSON.stringify(sn)),id:'OLD-SN'},{...JSON.parse(JSON.stringify(pb)),id:'OLD-PB'});
    snusAll(sn.id,true);pabloAll(pb.id,true);snusBuy(sn.id);pabloBuy(pb.id);`);
  assert.equal(run('S.phone.msgs.find(m=>m.id==="OLD-SN").state'),'gone');
  assert.equal(run('S.phone.msgs.find(m=>m.id==="OLD-PB").state'),'gone');
  run('S.orders=[];S.snus.stock={};S.pablo.stock={kokain:0,crack:0};S.pablo.kg=0;phoneContactDealer("pablo");');
  assert.notEqual(run('pabloOpenMsg().id'),'OLD-PB');
});

/* v302: Zusätzlich echtes Weltnetz/Routing aus game.js verwenden. Nur die
   Fahrzeug-Zuteilungsansicht bleibt eine Fixture; keine Luftfracht in Etappe 3. */
{
  const route = vm.createContext({console,DECISIONS:{},document:{querySelector:s=>s==='#modal'?{classList:{contains:()=>false}}:null}});
  const game = fs.readFileSync(path.join(root,'game.js'),'utf8');
  const routing = game.slice(0, game.indexOf('/* ------------------------------ Spielstand'));
  for (const text of [fs.readFileSync(path.join(root,'data.js'),'utf8'),routing,
    fs.readFileSync(path.join(root,'offices.js'),'utf8'),fs.readFileSync(path.join(root,'pablo.js'),'utf8')]) vm.runInContext(text,route);
  const rr = s=>vm.runInContext(s,route);
  rr(`var S={stage:3,testLevel:9,time:1000,seq:1,money:1e9,expense:0,orders:[],jobs:[],phone:{msgs:[],unread:0},bases:[],fleet:[],ledger:[]};
    function isUnlocked(id){return N[id]&&N[id].stage<=S.stage;}
    function unlockedNodes(){return Object.values(N).filter(n=>isUnlocked(n.id));}
    function unlockedModes(){return STAGES[S.stage-1].modes;}
    function logiOn(){return true;}function save(){}function render(){}function toast(){}function setTimeout(){}
    function logMoney(k,l,a){S.ledger.push({k,l,a,t:S.time});}
    function makeAddr(id,kind){return {t:(N[id].type==='air'?'Hangar':'Lagerhalle')+' '+N[id].short};}
    function buildVariants(o){return [plan(o.from,o.to,o.cargo,o.weight,'time')].filter(Boolean);}
    function planOptions(o,v){return v.map(x=>({ok:true,v:x}));}function bestOption(a){return a[0];}
    pabloOffer();var m=pabloOpenMsg();pabloReply(m.id,true);pabloStep(m.id,'crack',1);pabloBuy(m.id);
  `);
  assert.equal(rr('PABLO_STAGE'),3);assert.equal(rr('STAGES[PABLO_STAGE-1].name'),'Deutschland');
  assert.equal(rr('N[S.pablo.at].type'),'city');assert.equal(rr('N[S.pablo.at].modes.includes("r")'),true);
  assert.equal(rr('pabloDepotLabel()'),'Lagerhalle');assert.ok(rr('N[S.pablo.at].stage<=3'));
  assert.ok(rr('S.orders.length>0'),'Kunde mit echtem deutschem Routennetz erzeugt');
  assert.equal(rr('S.orders[0].pablo.sort'),'crack');
  assert.equal(rr('plan(S.orders[0].from,S.orders[0].to,"ware",S.orders[0].weight,"time").legs.some(l=>l.mode==="a")'),false);
  count++;console.log('ok Deutschland: echte Weltdaten und Routing, Lagerhalle per Straße, Crack-Auftrag ohne Luftfracht');
}

console.log(count + ' Händler-/Telefon-Szenarien bestanden. DOM-/Zuteilungs-Fixtures, kein Live-Browser-/Handytest.');
