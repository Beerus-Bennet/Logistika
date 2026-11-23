"use strict";
/* v468: Fahrzeugspezifische Technik für den vorhandenen Katalog.
   Masse/Radstand/Antrieb nach Modellreferenzen in docs/FAHRPROFILE-v468.md.
   Masse ist ein Näherungswert; Trockenangaben erhalten 100 kg Betriebsstoffe.
   Reifen-/Aero-Werte sind Spielabstimmung, keine Hersteller-Messwerte. */
const RACEHANDLING=(()=>{
 // kg, Antrieb (R=Heck/A=Allrad), Motorlage, Radstand m, Reifen, Aero, ggf. Trockenmasse.
 const DATA={
  p356:[935,'R','RR',2.10,.77,0],p550:[550,'R','MR',2.10,.83,0],p930:[1335,'R','RR',2.272,.94,.02],p959:[1450,'A','RR',2.272,1.01,.05],
  pcgt:[1380,'R','MR',2.73,1.12,.16],p918:[1674,'A','MR',2.73,1.20,.27],pgt3:[1435,'R','RR',2.457,1.22,.34],pgt2:[1470,'R','RR',2.453,1.23,.38],
  p924:[1242,'R','FR',2.40,.86,0],p944:[1180,'R','FR',2.40,.91,0],p928:[1580,'R','FR',2.50,.93,.01],p986:[1250,'R','MR',2.418,1.00,0],
  ptay:[2295,'A','EV',2.90,1.10,.03],pcay:[2175,'A','FR',2.895,1.03,0],prs:[1075,'R','RR',2.268,.91,.02],p911r:[1370,'R','RR',2.457,1.16,.08],p917:[820,'R','MR',2.30,1.32,.50],
  aurq:[1300,'A','FR',2.524,.88,0],asq:[1298,'A','FR',2.204,.98,.04],ars2:[1595,'A','FR',2.611,.94,0],ar8a:[1565,'A','MR',2.65,1.08,.04],
  ar8:[1645,'A','MR',2.65,1.16,.15],ars6:[2150,'A','FR',2.929,1.07,.02],aetr:[2347,'A','EV',2.90,1.10,.03],ars4:[1790,'A','FR',2.826,1.07,.01],
  m300:[1295,'R','FR',2.40,.76,0],m113:[1300,'R','FR',2.40,.76,0],m129:[1880,'R','FR',2.515,.89,0],mclk:[1440,'R','MR',2.67,1.14,.30],
  mslr:[1743,'R','FR',2.70,1.07,.08],msls:[1619,'R','FR',2.68,1.10,.08],mamg:[1645,'R','FR',2.63,1.13,.08],mone:[1695,'A','MR',2.72,1.32,.72],
  mg63:[2485,'A','FR',2.89,.94,0],m540:[2300,'R','FR',2.98,.62,0],
  b507:[1330,'R','FR',2.48,.75,0],be9:[1380,'R','FR',2.624,.80,0],bm1:[1300,'R','MR',2.60,.93,.03],bm3:[1200,'R','FR',2.562,.95,.02],
  bm5:[1795,'R','FR',2.83,1.01,0],bz3:[1285,'R','FR',2.446,.96,0],bz8:[1585,'R','FR',2.504,1.02,0],bi8:[1539,'A','MR',2.80,1.05,.02],
  bm2:[1725,'R','FR',2.747,1.12,.03],b02t:[1080,'R','FR',2.50,.83,.01],
  f250:[950,'R','FR',2.40,.82,0],f308:[1280,'R','MR',2.34,.87,0],f288:[1160,'R','MR',2.45,.96,.03,true],ftr:[1708,'R','MR',2.55,.95,.02],
  ff40:[1254,'R','MR',2.45,1.03,.17],ff50:[1230,'R','MR',2.58,1.07,.18],fenz:[1480,'R','MR',2.65,1.14,.25],flaf:[1585,'R','MR',2.65,1.23,.35],
  f458:[1565,'R','MR',2.65,1.15,.10],f812:[1744,'R','FR',2.72,1.15,.15],fsf90:[1600,'A','MR',2.65,1.24,.30,true],f296:[1540,'R','MR',2.60,1.23,.25],
  fsp3:[1485,'R','MR',2.651,1.23,.25,true],fpur:[2170,'A','FR',3.018,1.11,.02],fdyt:[1200,'R','FR',2.40,.84,0,true],froma:[1570,'R','FR',2.67,1.12,.06],
  bt57:[1800,'R','FR',3.302,.62,0],beb110:[1620,'A','MR',2.55,1.04,.10],bvey:[1888,'A','MR',2.71,1.13,.16],bchi:[1995,'A','MR',2.711,1.18,.23],
  bdiv:[1961,'A','MR',2.711,1.25,.40],bnoi:[1995,'A','MR',2.711,1.16,.19],b110:[1976,'A','MR',2.711,1.22,.30],bbol:[1450,'A','MR',2.75,1.46,1.05],
  bmis:[1977,'A','MR',2.711,1.17,.19],btou:[1995,'A','MR',2.74,1.23,.28],
  lmiu:[1292,'R','MR',2.50,.83,0],lcou:[1488,'R','MR',2.45,.94,.04],llm2:[2700,'A','FR',2.95,.78,0],ldia:[1576,'R','MR',2.65,1.00,.04],
  lmur:[1841,'A','MR',2.665,1.08,.10],lgal:[1597,'A','MR',2.56,1.09,.06],lven:[1450,'A','MR',2.70,1.24,.45,true],lave:[1731,'A','MR',2.70,1.15,.16],
  lhur:[1553,'A','MR',2.62,1.16,.12],lcen:[1675,'A','MR',2.70,1.22,.35],lsian:[1785,'A','MR',2.70,1.20,.23],luru:[2200,'A','FR',3.002,1.06,.01],
  lrev:[1880,'A','MR',2.779,1.25,.30],lesa:[1630,'R','FR',2.65,.81,0],ltem:[1690,'A','MR',2.658,1.22,.20,true],
  adb5:[1502,'R','FR',2.489,.77,0],adbz:[1225,'R','FR',2.362,.82,0],avan:[1835,'R','FR',2.69,1.01,.02],aone:[1630,'R','FR',2.791,1.13,.12],
  avnt:[1630,'R','FR',2.705,1.12,.08],adva:[1340,'R','MR',2.77,1.37,.95],
  mf1:[1260,'R','MR',2.718,1.08,.08],mp1:[1490,'R','MR',2.67,1.25,.43],msen:[1374,'R','MR',2.67,1.34,.85],mspe:[1597,'R','MR',2.73,1.15,.13],
  m765:[1339,'R','MR',2.67,1.27,.42],mart:[1498,'R','MR',2.64,1.18,.12],
  rssh:[2108,'R','FR',3.035,.70,0],rpha:[2560,'R','FR',3.552,.90,0],rcul:[2660,'A','FR',3.295,.92,0],rspe:[2890,'A','EV',3.21,.96,0],
  bblo:[1727,'R','FR',3.30,.61,0],bcon:[2422,'R','FR',3.061,.86,0],bcgt:[2350,'A','FR',2.746,.99,0],bcsp:[2459,'A','FR',2.851,1.10,.03],
  mbor:[1535,'R','MR',2.60,.85,0],mmc12:[1500,'R','MR',2.80,1.15,.37],mmc20:[1540,'R','MR',2.70,1.19,.12],
  jxk:[1295,'R','FR',2.591,.73,0],jetp:[1234,'R','FR',2.438,.79,0],jxkss:[921,'R','FR',2.30,.85,0],jxj:[1470,'R','MR',2.64,1.03,.05],
  pzon:[1280,'R','MR',2.73,1.09,.12,true],phuy:[1350,'R','MR',2.795,1.17,.28,true],putop:[1280,'R','MR',2.794,1.20,.20,true],
  kccr:[1230,'R','MR',2.659,1.05,.08],kreg:[1590,'R','MR',2.662,1.22,.25],kagr:[1395,'R','MR',2.662,1.26,.47],
  lesp:[1270,'R','MR',2.459,.94,.02],lels:[725,'R','MR',2.30,1.03,0],lemi:[1487,'R','MR',2.573,1.16,.08],leva:[1887,'A','EV',2.80,1.30,.65],
  fgt40:[1000,'R','MR',2.413,.93,.06],fsh:[1265,'R','FR',2.743,.81,0],fgt05:[1581,'R','MR',2.71,1.07,.10],fgt17:[1521,'R','MR',2.71,1.25,.40]
 };
 const REF={prs:'Porsche 911 (classic)',p911r:'Porsche 991',asq:'Audi Quattro',bm3:'BMW M3',bm5:'BMW M5',lels:'Lotus Elise',fgt17:'Ford GT'};
 const cache=new WeakMap(),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function profile(c){
  if(cache.has(c))return cache.get(c);
  const d=DATA[c.id]||[1500,'R','FR',2.65,1,0],kg=d[0]+(d[6]?100:0),drive=d[1],engine=d[2];
  const estimated=!Number.isFinite(c.acc)||c.acc<=0,acc100=estimated?clamp(2+kg/Math.max(50,c.ps||180)*.85*(c.y<1960?1.18:1),2.4,24):c.acc;
  const agility=clamp(Math.pow(1500/kg,.22)*Math.pow(2.65/d[3],.6)*(c.body==='suv'?.80:1),.64,1.35);
  const drift=clamp((drive==='R'?1:.46)*(engine==='FR'?1:engine==='RR'?.76:.87)*clamp((c.ps||180)/kg*5,.35,1.15),.16,1);
  const p=Object.freeze({kg,drive,engine,wheelbase:d[3],tyre:d[4]*(c.body==='suv'?.84:1),aero:d[5],agility,drift,acc100,estimated,
   driveName:drive==='A'?'Allradantrieb':'Heckantrieb',engineName:{FR:'Frontmotor',MR:'Mittelmotor',RR:'Heckmotor',EV:'Elektroantrieb'}[engine],
   source:DATA[c.id]?'https://en.wikipedia.org/wiki/'+encodeURIComponent(REF[c.id]||c.wp||c.m).replace(/%20/g,'_'):null});
  cache.set(c,p);return p;
 }
 /* v468: Fester offener Wettbewerb: pro Monat dieselben Autos/Fahrer,
    unabhängig von Spielerwagen, Preis, Garage, Lack und Streckenumbau. */
 const POOLS=[['p924','p944','bz3','bm3','aurq','be9'],['p986','bm5','ars4','m129','ar8a','f308'],['bm2','mamg','lgal','f458','pgt3','pcgt'],['ars6','ar8','pgt2','lhur','lave','f812'],['flaf','p918','bchi','fenz','m765','msen']];
 const DRIVERS=['Mara','Cem','Luca','Nora','Alex'],COLORS=[0xe66a43,0xf2c453,0x41a29e,0xd6d8d7,0x806dc4];
 function lineup(month){
  let seed=(Math.max(0,Math.floor(month))+1)^0x468a731;const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
  return POOLS.map((pool,i)=>({id:pool[Math.floor(next()*pool.length)],driver:DRIVERS[i],skill:.87+next()*.09,color:COLORS[i]}));
 }
 return {profile,lineup,ids:Object.keys(DATA)};
})();
