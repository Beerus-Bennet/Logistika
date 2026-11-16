/* v365: Optionale Live-Prüfung des externen Schienendienstes und der realen Karte. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const p=await b.newPage({viewport:{width:390,height:760},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.goto('http://127.0.0.1:8000/?test=1');
 const result=await p.evaluate(async()=>{
  const a=[52.53,13.37],b=[53.06,14.28],line=await geoFetch({a,b,mode:'l'});if(!line)return null;
  S=Object.assign(newGame(),{phase:'play',stage:6,money:3e8,time:600,speed:0,tut:{done:true},player:{company:'Weitwind Spedition',name:'Jonas',avatar:{art:'p1'},origin:3},jobs:[],fleet:[],orders:[]});document.querySelector('#intro').classList.remove('on');document.body.className='';activeTab='map';showTab('map');
  const pts=[a,b];pts.gm=['l'];GEO.mem.set(geoKey(a,b,'l'),line);GEO.ver++;
  const leg={mode:'l',nodes:['b-mitte','schwedt'],from:'b-mitte',to:'schwedt',_c:pts,dist:geoLen(pts),done:false};S.jobs=[{id:'route365',curLeg:0,legs:[leg],order:{id:'order365',from:'b-mitte',to:'schwedt',cargo:Object.keys(CARGO)[0],weight:1000,shipper:'Test',pick:nodeAddr('b-mitte'),drop:nodeAddr('schwedt')}}];S.fog=false;map.setBounds(null);map.setView([52.8,13.8],8);mapRedraw();
  return {points:line.length,km:geoLen(line),pending:routePending(pts),display:legDisp(leg).length,first:line[0],requested:a};
 });assert.ok(result,'Externer Schienendienst muss für diese optionale Live-Prüfung erreichbar sein.');assert.ok(result.points>50&&result.display>50);assert.equal(result.pending,false);console.log('LIVE Schiene Berlin–Schwedt:',result);
 await p.waitForTimeout(1800);const out='/tmp/logistika-v365';fs.mkdirSync(out,{recursive:true});await p.screenshot({path:out+'/rail-route.png'});assert.deepEqual(errors,[]);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
