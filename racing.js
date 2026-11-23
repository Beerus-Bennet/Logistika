"use strict";
/* v461: Eigene Rennbühne. Die Insel bleibt beim Fahren vollständig angehalten.
   Kauf, Kilometer und Preisgeld werden erst nach erfolgreichem Speichern bestätigt. */
const RACE=(()=>{
 const COST=15000,MONTH=30*1440,VERSION=469;
 let showroom=null,view='lobby',viewUID=null,choice=null;
 let on=false,U=null,Q=null,raf=0,last=0,accum=0,unsubs=[],held={},stick=0,pointer=null,focus=null,inert=[],mapStatic=null;
 const data=()=>S&&S.farm&&S.farm.race,month=()=>Math.floor(S.time/MONTH),built=()=>S&&S.farm&&(S.farm.objs||[]).find(o=>o.t==='racetrack');
 const available=()=>((S.ah&&S.ah.garage)||[]).filter(g=>g.kind!=='veh'&&CAR[g.car]&&!g.fleet&&!g.consigned);
 const busy=uid=>!!(data()&&data().active&&data().active.uid===uid);
 const cash=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(n)+' €';
 const carColor=g=>{const c=parseInt((g.paint&&g.paint[1]||'#2f6fed').replace('#',''),16);return Number.isFinite(c)?c:0x2f6fed;};
 const number=(n,d=1)=>new Intl.NumberFormat('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
 const clock=n=>{const m=Math.floor(n/60),s=(n%60).toFixed(2).padStart(5,'0');return m+':'+s.replace('.',',');};
 const prize=()=>Math.round(Math.min(5000000,250000*Math.pow(Math.max(1,S.stage||1),1.7))/1000)*1000;
 const receipt=()=>data()&&(data().months||[]).find(e=>e.month===month());
 const persist=()=>{try{return save()!==false;}catch(e){return false;}};
 /* v468: Fahrweise am konkreten Modell erklären, nicht an der Marke. */
 function drivingNote(p){
  if(p.drive==='A')return 'Allrad bringt Traktion beim Herausbeschleunigen. Das Auto fängt seitliches Rutschen früher ab; lange Drifts brauchen mehr Einsatz.';
  if(p.engine==='RR')return 'Das Gewicht auf der Hinterachse hilft beim Anfahren. Der Heckmotor verlangt in schnellen Kurven fein dosiertes Lenken und Gas.';
  if(p.engine==='MR')return 'Die zentrale Motorlage und der kurze Weg der Massen helfen beim Richtungswechsel. Drifts lassen sich einleiten, verlangen aber Gefühl.';
  return p.drift>.75?'Heckantrieb und genügend Leistung machen kontrollierte Powerdrifts leicht zugänglich. Mit Gegenlenken und dosiertem Gas hältst du die Linie.':'Heckantrieb; Gewicht, Radstand und Motorleistung bestimmen, wie flink und ausdauernd der Wagen driftet.';
 }
 function profileHTML(c){const p=RACEHANDLING.profile(c);return `<div class="race-tech"><span>${esc(p.driveName)} · ${esc(p.engineName)}</span><div class="race-tech-grid"><div><small>0–100 km/h</small><b>${p.estimated?'≈ ':''}${number(p.acc100,1)} s</b></div><div><small>Spitzentempo</small><b>${c.vmax} km/h</b></div><div><small>Masse ca.</small><b>${number(p.kg,0)} kg</b></div><div><small>Leistungsgewicht</small><b>${number(c.ps/p.kg*1000,0)} PS/t</b></div></div><div class="race-character"><span>Agilität <meter min="0" max="100" value="${Math.round((p.agility-.5)/.85*100)}"></meter></span><span>Drifteignung <meter min="0" max="100" value="${Math.round(p.drift*100)}"></meter></span></div><p>${drivingNote(p)}</p><small>Fahrcharakter im Spiel · ${p.estimated?'Beschleunigung angenähert; ':''}Masse je nach Ausstattung unterschiedlich.</small></div>`;}
 function fieldHTML(){return `<ol class="race-field" aria-label="Festes Starterfeld dieses Spielmonats">${RACEHANDLING.lineup(month()).map(r=>{const c=CAR[r.id],p=RACEHANDLING.profile(c);return `<li><span>${esc(r.driver)}</span><b>${esc(carName(c))}</b><small>${c.ps} PS · ${number(p.acc100,1)} s · ${esc(p.driveName)}</small></li>`;}).join('')}</ol>`;}
 /* v467: Umbauten ändern nur den bestehenden Kurs – keine neue Rodung oder Monatsfreigabe. */
 const layoutId=()=>RACETRACK.forId(data()&&data().layout).id;
 const modelKey=()=>`racetrack467:${layoutId()}`;
 const miniature=()=>RACETRACK.miniature(layoutId());
 const bestFor=id=>{const D=data();return D&&D.bests&&D.bests[id]||id==='werder'&&D&&D.best||0;};
 const courseSVG=(id,cls='race-route')=>{const T=RACETRACK.forId(id),start=T.at(T.START);return `<svg class="${cls}" viewBox="-240 -210 480 420" aria-label="Streckenverlauf ${esc(T.name)}" role="img"><path d="M${T.points.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' L')}"/><circle cx="${start.x}" cy="${start.z}" r="9"/></svg>`;};
 function rebuild(id){
  const D=data(),def=RACETRACK.layouts.find(l=>l.id===id);
  if(!built()||!D||Q||D.active||!def||layoutId()===id||(S.farm.clover||0)<50)return false;
  const before=JSON.stringify(D),clover=S.farm.clover,old=layoutId();
  D.layout=id;D.lastBuild={from:old,to:id,at:S.time,cost:50};S.farm.clover-=50;
  if(!persist()){S.farm.race=JSON.parse(before);S.farm.clover=clover;return false;}
  RACETRACK.use(id);
  // Nur den vorhandenen Bahn-Knoten austauschen; Wald und übrige Kulisse bleiben stehen.
  if(typeof FV!=='undefined'&&FV.R){const o=built(),e=FV.nodes.get(o.id);if(e){e.node.mesh=objMesh(o);e.sig=objSig(o);}}
  return true;
 }
 function workshop(uid,id){
  if(Q)return;stopShowroom();view='workshop';viewUID=uid||viewUID;choice=RACETRACK.layouts.some(l=>l.id===id)?id:layoutId();
  const def=RACETRACK.layouts.find(l=>l.id===choice),T=RACETRACK.forId(choice),same=choice===layoutId(),funds=(S.farm.clover||0)>=50;
  U.innerHTML=`<div class="race-lobby"><header class="race-workshop-head"><span class="race-label">LOGISTIKA MOTORPARK</span><h1>Streckenwerkstatt</h1><p>Ein neuer Verlauf für deinen Motorpark.</p></header><div class="race-lobby-body"><p class="race-note" data-note hidden role="status"></p><div class="race-workshop-balance"><b>${number(S.farm.clover||0,0)} Kleeblätter</b><span>Jeder Umbau: 50 Kleeblätter</span></div><div class="race-layouts">${RACETRACK.layouts.map(l=>`<button class="race-layout${l.id===choice?' selected':''}" data-race="layout" data-layout="${l.id}" aria-pressed="${l.id===choice}">${courseSVG(l.id)}<b>${esc(l.name)}</b><span>${esc(l.tag)}</span><small>${number(RACETRACK.forId(l.id).length/1000,2)} km${l.id===layoutId()?' · aktuell gebaut':''}</small></button>`).join('')}</div><article class="race-layout-preview">${courseSVG(choice)}<span class="race-label">DEINE VORSCHAU</span><h2>${esc(def.name)}</h2><p>${esc(def.description)}</p><b>${number(T.length/1000,2)} km · 2 Runden · 12 Kontrollpunkte</b></article><div class="race-rules"><p>Die Vorschau ist kostenlos. Erst „Für 50 Kleeblätter umbauen“ ändert deine Bahn. Auch der Rückbau kostet 50 Kleeblätter. Grundstück und Baumbestand bleiben erhalten.</p><p>Ein Umbau erneuert deinen Monatsstart nicht. Bestzeiten werden pro Streckenverlauf geführt.</p></div><button class="btn race-back" data-race="rebuild"${same||!funds?' disabled':''}>${same?'Dieser Kurs ist bereits gebaut':!funds?'Es fehlen '+number(50-(S.farm.clover||0),0)+' Kleeblätter':'Für 50 Kleeblätter umbauen'}</button><button class="btn ghost race-back" data-race="back">Abbrechen · zum Motorpark</button></div></div>`;
 }
 function stopShowroom(){if(showroom){showroom.destroy();showroom=null;}}
 function showCar(uid){
  if(Q)return;const g=available().find(g=>g.uid===uid);if(!g)return;stopShowroom();view='car';viewUID=uid;
  const c=CAR[g.car],specific=c.id==='lgal',color=carColor(g);
  U.innerHTML=`<div class="race-lobby"><header class="race-workshop-head"><span class="race-label">DEINE GARAGE · 3D</span><h1>${esc(carName(c))}</h1><p>${g.y} · ${esc(g.paint&&g.paint[0]||'Garagenlack')}</p></header><div class="race-lobby-body"><p class="race-note" data-note hidden role="status"></p><canvas class="race-car-canvas" aria-label="${esc(carName(c))} drehen: mit dem Finger über das Auto ziehen" tabindex="0"></canvas><p class="race-car-hint">Ziehen zum Drehen · mit dem Mausrad zoomen</p><div class="race-car-tools"><button data-race="carpose" data-pose="front">Front</button><button data-race="carpose" data-pose="side">Seite</button><button data-race="carpose" data-pose="rear">Heck</button><button data-race="carzoom" data-zoom="-.12" aria-label="Auto vergrößern">+</button><button data-race="carzoom" data-zoom=".12" aria-label="Auto verkleinern">−</button></div><div class="race-rules"><b>${specific?'Gallardo Coupé · 2006–2008':'Dein Wagen im Motorpark'}</b><p>${specific?'Flache Keilkarosserie, lange schräge Leuchten, seitliche Lufteinlässe und V10-Heck. Dieselbe Karosserie, derselbe Lack und dieselben Räder fahren auf der Rennstrecke.':'Dieses 3D-Modell wird auch auf der Rennstrecke verwendet.'}</p><p>${c.ps} PS · ${c.vmax} km/h · ${number(g.km,1)} km</p></div><button class="btn race-back" data-race="back">Zurück zum Motorpark</button></div></div>`;
  showroom=RACECARVIEW.create(U.querySelector('.race-car-canvas'),c,color,notice);if(!showroom)notice('Die 3D-Ansicht konnte nicht geöffnet werden. Dein Garagenauto bleibt erhalten.');
 }
 function clear(x,z,r=0){const o=built();if(!o)return false;const [w,d]=farmSize(o),a=o.x-FG/2,b=o.z-FG/2;return x>a-r&&x<a+w+r&&z>b-r&&z<b+d+r;}
 function canPlace(x,z,w,d,except){
  if(![x,z,w,d].every(Number.isFinite)||w<1||d<1||built()&&!except)return false;
  const R=farmZoneRect('display'),a=x-FG/2,b=z-FG/2;
  if(x<R.x0||z<R.z0||x+w>R.x1||z+d>R.z1||!farmFreeRect(x-1,z-1,w+2,d+2,except))return false;
  if(typeof VILLAGE!=='undefined'&&VILLAGE.overlaps(a-2,b-2,w+4,d+4))return false;
  const overlap=(x0,z0,x1,z1)=>a+w>x0&&a<x1&&b+d>z0&&b<z1;
  if(overlap(FHOF_MAX.x0-2,FHOF_MAX.z0-2,FHOF_MAX.x1+2,FHOF_MAX.z1+2)||overlap(FWORLD.yard[0]-3,FWORLD.yard[1]-3,FWORLD.yard[2]+3,FWORLD.yard[3]+3))return false;
  if(FWORLD.fields.some(([fx,fz,fw,fd])=>overlap(fx-fw/2-2,fz-fd/2-2,fx+fw/2+2,fz+fd/2+2)))return false;
  if(typeof FFISHERY!=='undefined'&&Object.values(FFISHERY).some(f=>overlap(f.x-f.sz[0]/2-2,f.z-f.sz[1]/2-2,f.x+f.sz[0]/2+2,f.z+f.sz[1]/2+2)))return false;
  for(let i=0;i<=w;i++)for(let j=0;j<=d;j++){
   const wx=a+i,wz=b+j;
   if(typeof islandGap==='function'&&islandGap(wx,wz)<3)return false;
   if(FAREA_ORDER.some(k=>!farmAreaOpen(k)&&FAREAS[k].locks.some(q=>wx>q[0]&&wx<q[2]&&wz>q[1]&&wz<q[3])))return false;
   if(wz>15||typeof ALPINE!=='undefined'&&ALPINE.contains(wx,wz)||inLake(wx,wz,3)||Math.hypot(wx-FWORLD.pond.x,wz-FWORLD.pond.z)<FWORLD.pond.r+3)return false;
   if(creekBankD(wx,wz)<3||nearPath(wx,wz)<3)return false;
   if(typeof HUNT!=='undefined'&&HUNT.clear(wx,wz,'bg')||typeof CAMP!=='undefined'&&CAMP.clear(wx,wz,'bg')||typeof RENT!=='undefined'&&RENT.clear(wx,wz))return false;
   if(FWORLD.clearings.some(c=>Math.hypot(wx-c[0],wz-c[1])<c[2]+2))return false;
  }
  return true;
 }
 function place(x,z,r=0){
  r=r&3;const w=r%2?RACETRACK.D:RACETRACK.W,d=r%2?RACETRACK.W:RACETRACK.D,F=S.farm;
  if(!Number.isInteger(x)||!Number.isInteger(z)||(F.clover||0)<COST||built()||!canPlace(x,z,w,d))return null;
  const old={clover:F.clover,seq:F.seq,objs:F.objs,trees:F.trees,race:F.race};
  F.objs=F.objs.slice();const o=farmAddObj({t:'racetrack',x,z,r});F.clover-=COST;
  F.race={version:VERSION,seq:1,months:[],best:0};
  F.trees=(F.trees||[]).filter(t=>!clear(t.x,t.z,1.7));
  if(!persist()){Object.assign(F,old);toast('Rennbahn nicht gekauft: Spielstand konnte nicht gespeichert werden.','bad');return null;}
  return o;
 }
 function planOrOpen(){
  if(built()){closeFarmSheet();open();return;}
  if((S.farm.clover||0)<COST){toast('Die Autorennbahn kostet 15.000 Kleeblätter.','warn');return;}
  if(!FV.R||FV.tutLock)return;
  closeFarmSheet();let spot=null;
  /* Selten aufgerufene Suche: zuerst rund um die Kamera, dann die Waldflächen. */
  const cx=Math.round(FV.R.cam.tx+FG/2-RACETRACK.W/2),cz=Math.round(FV.R.cam.tz+FG/2-RACETRACK.D/2);
  const R=farmZoneRect('display');for(let z=R.z0;z<=Math.min(R.z1-RACETRACK.D,FG/2-24);z+=4)for(let x=R.x0;x<=R.x1-RACETRACK.W;x+=4){if(spot&&Math.hypot(x-cx,z-cz)>Math.hypot(spot[0]-cx,spot[1]-cz))continue;if(canPlace(x,z,RACETRACK.W,RACETRACK.D))spot=[x,z];}
  startPlace({proto:{t:'racetrack',r:0},racetrack:true,label:'Autorennbahn · 15.000 Kleeblätter'},...(spot||[cx,cz]));
  if(FV.place){const P=FV.place,aspect=FV.R.w/FV.R.h,dist=Math.hypot(P.w,P.d)/(2*Math.tan(FV.R.cam.fov/2)*Math.min(1,aspect))*1.18;farmFocus({...P.proto,x:P.x,z:P.z},Math.max(FV.R.cam.dist,dist));}
  toast('Nur die Baufläche wird gerodet. 15.000 Kleeblätter werden erst beim Aufstellen abgezogen.','ok');
 }
 function recoverSaved(){const D=data();if(!D||!D.active||Q)return true;const prev=JSON.stringify(D);const e=(D.months||[]).find(x=>x.id===D.active.id);if(e&&e.status==='gestartet')e.status='abgebrochen';D.active=null;if(!persist()){S.farm.race=JSON.parse(prev);return false;}return true;}
 function notice(t){if(!U)return;const e=U.querySelector('[data-note]');if(e){e.textContent=t;e.hidden=!t;}}
 function listen(el,type,fn,options){el.addEventListener(type,fn,options);unsubs.push(()=>el.removeEventListener(type,fn,options));}
 function resetInput(){held={};stick=0;pointer=null;if(U){U.querySelectorAll('[data-hold]').forEach(b=>{if(b._raceReset)b._raceReset();});const k=U.querySelector('.race-stick-knob');if(k)k.style.transform='translate(-50%,-50%)';U.querySelectorAll('.held').forEach(e=>e.classList.remove('held'));}}
 function open(uid){
  if(on||!built())return;
  if(!recoverSaved()){toast('Der letzte Lauf konnte noch nicht gespeichert werden. Bitte Speicherplatz prüfen.','bad');return;}
  focus=document.activeElement;on=true;document.body.classList.add('race-open');
  U=document.createElement('section');U.className='race-root';U.setAttribute('role','dialog');U.setAttribute('aria-modal','true');U.setAttribute('aria-label','Logistika Motorpark');U.tabIndex=-1;document.body.appendChild(U);
  inert=Array.from(document.body.children).filter(e=>e!==U&&e instanceof HTMLElement).map(e=>[e,e.inert]);inert.forEach(([e])=>e.inert=true);
  listen(document,'visibilitychange',()=>{if(document.hidden)pause();});listen(window,'blur',()=>pause());listen(window,'pagehide',()=>{if(Q)checkpoint();});
  listen(window,'keydown',key);listen(window,'keyup',key);listen(U,'click',click);
  lobby(uid);U.focus();
 }
 function lobby(uid){
  destroyScene();Q=null;view='lobby';viewUID=uid||viewUID;RACETRACK.use(layoutId());const D=data(),best=bestFor(layoutId()),cars=available(),g=cars.find(g=>g.uid===uid)||cars[0],e=receipt(),disabled=!g;
  U.innerHTML=`<div class="race-lobby"><header class="race-hero"><div class="race-brand">LOGISTIKA MOTORSPORT <span>${esc(RACETRACK.name.toUpperCase())}</span></div><button class="race-close" data-race="close" aria-label="Motorpark schließen">×</button><span class="race-kicker">DEIN MOTORPARK</span><h1>Asphalt. Kurven.<br><em>Dein Moment.</em></h1><p>${number(RACETRACK.length/1000,2)} km · 12 Kontrollpunkte · Nitro-Gerade & S-Kurven</p><svg class="race-course" viewBox="-240 -210 480 420" aria-label="Streckenverlauf" role="img"><path d="M${RACETRACK.points.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' L')}"/><circle cx="${RACETRACK.at(RACETRACK.START).x}" cy="${RACETRACK.at(RACETRACK.START).z}" r="9"/></svg></header>
   <div class="race-lobby-body"><p class="race-note" data-note hidden role="status"></p><h2>Wähle deinen Garagenwagen</h2>${cars.length?`<label class="race-select">Fahrzeug<select id="raceCar">${cars.map(c=>`<option value="${esc(c.uid)}"${c===g?' selected':''}>${esc(carName(CAR[c.car]))} · ${c.y}</option>`).join('')}</select></label><div class="race-garage" id="raceGarage"></div>`:`<div class="race-empty"><b>Dein Startplatz wartet.</b><p>Ersteigere ein Auto im Auktionshaus. Autos im Kurierdienst oder in einer laufenden Auktion sind hier nicht verfügbar.</p><button class="btn" data-race="garage">Zur Garage</button></div>`}
   <div class="race-workshop-link"><div><b>${esc(RACETRACK.name)}</b><small>Dein aktueller Streckenverlauf</small></div><button class="btn ghost" data-race="workshop">Strecke umbauen · 50 Kleeblätter</button></div><div class="race-modes"><article><span class="race-label">FREIES FAHREN</span><h3>Training</h3><p>Zwei Runden, ohne Gegner. Lerne Bremspunkte, Drifts und Nitro kennen.</p><button class="btn" data-race="practice"${disabled?' disabled':''}>Training starten</button></article>
   <article class="race-month"><span class="race-label">SPIELMONAT ${month()+1}</span><h3>Monatsrennen</h3><b class="race-purse">${cash(prize())}</b><small>Siegprämie · 5 KI-Fahrer · 2 Runden</small><p>${e?e.status==='fertig'?`Platz ${e.place} · ${cash(e.prize)} gewonnen.`:'Dein Startplatz wurde diesen Monat bereits genutzt.':`Offenes Feld: Die Gegner bleiben diesen Spielmonat gleich. Dein schnelleres Auto bringt dir einen echten Vorteil. Alle sechs Plätze erhalten Preisgeld.`}</p>${fieldHTML()}<button class="btn" data-race="monthly"${disabled||e?' disabled':''}>${e?'Nächstes Rennen in '+Math.ceil(((month()+1)*MONTH-S.time)/1440)+' Spieltagen':'Zum Monatsrennen'}</button></article></div>
   <div class="race-rules"><b>Dein Auto fährt wirklich.</b><p>Jeder gefahrene Kilometer und zusätzlicher Rennverschleiß bleiben am Auto und senken seinen Sammlerwert. Kollisionen und Nitro beanspruchen es stärker. Ein Monat entspricht 30 Spieltagen. Verlassen oder Neuladen beendet den Monatsstart ohne Preisgeld.</p><p>Die Speditionszeit pausiert während deines Besuchs.${best?' Bestzeit auf diesem Kurs: '+clock(best)+'.':''}</p></div><button class="btn ghost race-back" data-race="close">Zurück zum Hof</button></div></div>`;
  const select=U.querySelector('#raceCar');if(select){select.onchange=carInfo;carInfo();}
 }
 function carInfo(){const g=garageById(U.querySelector('#raceCar').value);if(!g)return;const c=CAR[g.car];U.querySelector('#raceGarage').innerHTML=`<b>${esc(carName(c))}</b><div><span>${c.ps} PS</span><span>${number(g.km,1)} km</span></div><small>Marktwert ${cash(gValue(g))} · Rennverschleiß ${number(g.raceWear||0,2)} %</small>${profileHTML(c)}<button class="btn ghost race-car-open" data-race="carview">Auto in 3D ansehen</button>`;}
 function start(mode){
  if(Q)return;const g=garageById(U.querySelector('#raceCar').value);if(!g||!available().includes(g)||mode==='monthly'&&receipt())return;
  const c=CAR[g.car];RACETRACK.use(layoutId());
  U.innerHTML=`<canvas class="race-canvas" aria-label="Rennstrecke, gesteuert mit Joystick oder Pfeiltasten"></canvas><div class="race-hud"><div class="race-topline"><div><span class="race-label">${mode==='monthly'?'MONATSRENNEN':'TRAINING'}</span><b data-lap>Runde 1 / 2</b></div><div class="race-topbuttons"><button class="race-sound" data-race="sound" aria-label="Motorton umschalten">TON ${S.farm.snd?'AN':'AUS'}</button><button class="race-pause" data-race="pause" aria-label="Rennen pausieren"><svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></button></div></div><div class="race-stats"><b data-place>${mode==='monthly'?'6 / 6':'SOLO'}</b><span data-time>0:00,00</span></div><canvas class="race-map" width="140" height="120" aria-label="Streckenkarte mit Fahrzeugpositionen"></canvas><div class="race-speed"><strong data-speed>0</strong><span>km/h</span><div class="race-nitro"><i data-nitro></i></div><small>NITRO</small></div><div class="race-banner" data-banner role="status">3</div><div class="race-turn" data-turn></div><div class="race-drive-note" data-note hidden role="status"></div></div><div class="race-controls"><div class="race-stick" role="group" aria-label="Joystick: nach links oder rechts lenken, nach unten bremsen"><div class="race-stick-knob"></div><span>LENKEN</span></div><div class="race-buttons"><button class="race-nitro-btn" data-hold="nitro" aria-label="Nitro halten">NITRO</button><button data-hold="drift" aria-label="Drift halten">DRIFT</button><button data-hold="brake" aria-label="Bremse halten">BREMSE</button></div></div><div class="race-bottom"><button data-race="recover">Zur Strecke <small>+4 s</small></button><label><input id="raceAuto" type="checkbox" checked> Auto-Gas</label><button class="race-gas" data-hold="gas">GAS</button></div><div class="race-keyhint">Pfeile / WASD · Leertaste Drift · Umschalt Nitro · R zurück · Esc Pause</div><div class="race-overlay" hidden></div>`;
  Q={mode,g,c,layout:layoutId(),rig:RACETRACK.rig(c),p:RACEDRIVE.create(c,mode==='monthly'?5:0),ai:[],state:'countdown',count:3.4,total:0,chargedKm:0,chargedWear:0,value:gValue(g),baseKm:g.km,baseWear:g.raceWear||0,saveAt:0,hudAt:0,skidAt:0,auto:true,subAt:unsubs.length,meshes:[],tex:[],visuals:[],skids:[],skidSeq:0,camera:null};
  if(mode==='monthly')RACEHANDLING.lineup(month()).forEach((r,i)=>{const a=RACEDRIVE.create(CAR[r.id],i,true);a.skill=r.skill;a.driver=r.driver;a.color=r.color;Q.ai.push(a);});
  if(!buildScene()){Q=null;lobby(g.uid);notice('WebGL 2 ist nicht verfügbar. Der Monatsstart wurde nicht verbraucht.');return;}
  const D=data(),before=JSON.stringify(D),field=Q.ai.map(a=>({car:a.car.id,driver:a.driver,skill:a.skill}));Q.id='R'+D.seq++;D.active={id:Q.id,uid:g.uid,mode,layout:Q.layout,month:month(),field,km:0,wear:0};
  if(mode==='monthly'){D.months.unshift({id:Q.id,month:month(),uid:g.uid,status:'gestartet',layout:Q.layout,field,pool:prize()});D.months.length=Math.min(12,D.months.length);}
  if(!persist()){S.farm.race=JSON.parse(before);const uid=g.uid;lobby(uid);notice('Start nicht möglich: Der Spielstand konnte nicht gespeichert werden.');return;}
  bindControls();engineStart();last=0;accum=0;raf=requestAnimationFrame(frame);
 }
 function checkpoint(){if(!Q||!data().active||data().active.id!==Q.id)return true;const g=garageById(Q.g.uid);if(!g)return false;
  const km=Math.max(0,Q.p.km-Q.chargedKm),wear=Math.max(0,Q.p.wear-Q.chargedWear),old={km:g.km,raceWear:g.raceWear,adjAt:g.adjAt},a=data().active,oldA={km:a.km,wear:a.wear};
  g.km+=km;g.raceWear=Math.min(100,(g.raceWear||0)+wear);if(km>0)g.adjAt=S.time;a.km=Q.p.km;a.wear=Q.p.wear;
  if(!persist()){Object.assign(g,old);Object.assign(a,oldA);return false;}
  Q.chargedKm=Q.p.km;Q.chargedWear=Q.p.wear;return true;
 }
 function settle(completed){if(!Q||completed&&(!Q.p.finish||Q.p.next!==25||Q.p.lap<2)||!checkpoint())return false;const D=data();if(!D.active||D.active.id!==Q.id)return true;
  const old={race:JSON.stringify(D),money:S.money,revenue:S.revenue,ledger:S.ledger&&S.ledger.slice()};let amount=0,place=0;
  if(Q.mode==='monthly'){const e=D.months.find(e=>e.id===Q.id);if(!e||e.status!=='gestartet')return false;
   if(completed){place=1+Q.ai.filter(a=>a.finish&&a.finish<Q.p.finish).length;amount=Math.round(e.pool*[1,.64,.43,.29,.19,.12][place-1]);Object.assign(e,{status:'fertig',place,prize:amount,time:Q.p.finish});S.money+=amount;S.revenue=(S.revenue||0)+amount;logMoney('bonus','Monatsrennen '+RACETRACK.forId(Q.layout).name+' · Platz '+place,amount);}else e.status='abgebrochen';
  }
  if(completed){const best=bestFor(Q.layout);if(!best||Q.p.finish<best){D.bests=Object.assign({},D.bests,{[Q.layout]:Q.p.finish});if(Q.layout==='werder')D.best=Q.p.finish;}}D.active=null;
  if(!persist()){S.farm.race=JSON.parse(old.race);S.money=old.money;S.revenue=old.revenue;S.ledger=old.ledger;return false;}
  Q.award=amount;Q.place=place;return true;
 }
 function buildScene(){try{
  const R=G3.create(U.querySelector('.race-canvas'),{maxDpr:1.4,shadowSize:512,shadowBox:75});if(!R)return false;Q.R=R;Q.governor=G3.governor(R,{frameMs:1000/45,minScale:.65});
  R.env.fog=[.67,.81,.86];R.env.fogR=[180,520];R.env.sky=[.64,.79,.88];R.env.sun=[.55,.8,.4];R.env.wind=[0,0,0,0];
  const mesh=b=>{const m=R.mesh(b);Q.meshes.push(m);return m;};Q.mesh=mesh;
  R.nodes.push(R.node(mesh(RACETRACK.stage())));
  const wheels=new Map(),color=carColor(Q.g);
  const competitors=[Q.p,...Q.ai],cols=[color,0xe66a43,0xf2c453,0x41a29e,0xd6d8d7,0x806dc4];
  competitors.forEach((a,i)=>{const c=a.car,rig=RACETRACK.rig(c),key=c.id;if(!wheels.has(key))wheels.set(key,mesh(RACETRACK.wheel(c)));const wheel=wheels.get(key),body=mesh(RACETRACK.car(c,a.color||cols[i])),root=R.node(null),shell=R.addChild(root,R.node(body)),w=[];
   for(const x of [-rig.wheelX,rig.wheelX])for(const z of rig.axles){const axle=R.addChild(root,R.node(null,{x,y:rig.wheelY,z})),n=R.addChild(axle,R.node(wheel,{ry:x<0?Math.PI:0}));w.push({axle,n,front:z>0});}
   const flameB=new G3.MB();for(const x of [-rig.exhaustX,rig.exhaustX])flameB.ico(1,0x56d5ed,{x,y:rig.exhaustY,z:rig.exhaustZ,sx:.16,sy:.16,sz:.75});const flame=R.addChild(root,R.node(mesh(flameB),{visible:false,glow:.9,shadow:false}));
   R.nodes.push(root);Q.visuals.push({a,rig,root,shell,w,flame});
  });
  const skidB=new G3.MB();for(const x of [-.87,.87])skidB.plate(.17,1.8,0x202c32,{x,y0:.055});const skidM=mesh(skidB);
  for(let i=0;i<64;i++){const n=R.node(skidM,{visible:false,shadow:false});Q.skids.push(n);R.nodes.push(n);}
  /* Die Startbrücke bekommt einen scharfen Schriftzug statt Emoji-Beschilderung. */
  const cv=document.createElement('canvas');cv.width=1024;cv.height=160;const ctx=cv.getContext('2d');ctx.fillStyle='#15384e';ctx.fillRect(0,0,1024,160);ctx.font='900 66px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff5d6';ctx.fillText('LOGISTIKA · '+RACETRACK.name.toUpperCase()+'',512,104);const t=R.texture(cv);Q.tex.push(t);const p=RACETRACK.at(RACETRACK.START);R.nodes.push(R.node(null,{x:p.x-Math.sin(p.heading)*.66,y:7.25,z:p.z-Math.cos(p.heading)*.66,ry:p.heading+Math.PI,decal:{t,w:19,h:2.3,unlit:true},shadow:false}));
  listen(U.querySelector('.race-canvas'),'webglcontextlost',e=>{e.preventDefault();pause();notice('Grafikkontext unterbrochen. Bitte den Lauf beenden und die Rennbahn erneut öffnen.');});
  mapStatic=document.createElement('canvas');mapStatic.width=140;mapStatic.height=120;const m=mapStatic.getContext('2d');m.strokeStyle='#eef0dc';m.lineWidth=5;m.beginPath();RACETRACK.points.forEach((p,i)=>{const x=70+p[0]*.27,y=60+p[1]*.27;i?m.lineTo(x,y):m.moveTo(x,y);});m.stroke();
  camera(true);draw(0);return true;
 }catch(e){console.error('Rennbahn:',e);destroyScene();return false;}}
 /* v461: Ein leiser, synthetischer Motor nutzt den vorhandenen Hof-Audiokontext.
    Jede Quelle wird beim Pausieren/Verlassen gestoppt und getrennt. */
 function engineStart(){if(!Q||Q.sound||!S.farm.snd||!['countdown','driving'].includes(Q.state))return;try{if(!farmAC)farmAC=new(window.AudioContext||window.webkitAudioContext)();farmAC.resume().catch(()=>{});const osc=farmAC.createOscillator(),gain=farmAC.createGain();osc.type='triangle';osc.frequency.value=48;gain.gain.value=.012;osc.connect(gain);gain.connect(farmAC.destination);osc.start();Q.sound={osc,gain};}catch(e){/* Ton bleibt optional. */}}
 function engineStop(){if(!Q||!Q.sound)return;try{Q.sound.osc.stop();Q.sound.osc.disconnect();Q.sound.gain.disconnect();}catch(e){}Q.sound=null;}
 function engineUpdate(){if(!Q||!Q.sound)return;const ratio=Q.p.v/Q.p.spec.max,rev=(ratio*5)%1;Q.sound.osc.frequency.setTargetAtTime(48+rev*65+(Q.p.boost?15:0),farmAC.currentTime,.09);Q.sound.gain.gain.setTargetAtTime(Q.state==='driving'?.012+ratio*.014:.007,farmAC.currentTime,.08);}
 function destroyScene(){stopShowroom();engineStop();if(Q&&Q.goalFx)Q.goalFx.destroy();cancelAnimationFrame(raf);raf=0;resetInput();mapStatic=null;if(Q)unsubs.splice(Q.subAt).forEach(fn=>fn());if(Q&&Q.R){const R=Q.R;Q.meshes.forEach(m=>R.free(m));Q.tex.forEach(t=>R.texFree(t));R.nodes.length=0;R.instClear();const lose=R.gl.getExtension('WEBGL_lose_context');if(lose)lose.loseContext();Q.R=null;}}
 function camera(snap){const a=Q.p,R=Q.R,portrait=U.clientHeight>U.clientWidth,yaw=-a.h-Math.PI/2,lead=7+a.v*.10;const target={tx:a.x+Math.sin(a.h)*lead,ty:1.4,tz:a.z+Math.cos(a.h)*lead,yaw,dist:(portrait?36:26)+a.v*.10,pitch:portrait?.47:.38};
  if(!Q.camera||snap)Q.camera=target;else{for(const k of ['tx','tz','dist'])Q.camera[k]+=(target[k]-Q.camera[k])*(1-Math.exp(-(Q.renderDt||1/60)*10));Q.camera.yaw+=RACEDRIVE.wrap(yaw-Q.camera.yaw)*(1-Math.exp(-(Q.renderDt||1/60)*10));Q.camera.pitch=target.pitch;}
  Object.assign(R.cam,Q.camera,{fov:.78,near:.2,far:750});
 }
 function draw(t){if(!Q||!Q.R||Q.R.lost())return;for(const v of Q.visuals){const a=v.a;v.root.x=a.x;v.root.z=a.z;v.root.ry=a.h;v.shell.rz=-(a.steer||0)*Math.min(a.v/50,.7)*.035;for(const w of v.w){w.axle.ry=w.front?(a.steer||0)*.35:0;w.n.rx=-a.km*1000/v.rig.wheelRadius;}v.flame.visible=!!a.boost;v.flame.sz=.75+Math.sin(t*40)*.22;}
  if(Q.p.drifting&&Q.p.v>10&&t-Q.skidAt>.07){const n=Q.skids[Q.skidSeq++%Q.skids.length];n.visible=true;n.x=Q.p.x;n.z=Q.p.z;n.ry=Q.p.h;Q.skidAt=t;}
  camera(false);engineUpdate();Q.R.shadowBox=70;Q.R.render(t);minimap();
 }
 function minimap(){const canvas=U.querySelector('.race-map');if(!canvas||!mapStatic)return;const c=canvas.getContext('2d');c.clearRect(0,0,140,120);c.drawImage(mapStatic,0,0);const gate=RACETRACK.at(RACETRACK.START+(Q.p.next%12)*RACETRACK.length/12);c.strokeStyle='#ffc849';c.lineWidth=2;c.beginPath();c.arc(70+gate.x*.27,60+gate.z*.27,5,0,Math.PI*2);c.stroke();for(const a of Q.ai){c.fillStyle='#f3b75a';c.beginPath();c.arc(70+a.x*.27,60+a.z*.27,2.6,0,Math.PI*2);c.fill();}const a=Q.p;c.fillStyle='#6bedd5';c.strokeStyle='#112634';c.lineWidth=1.5;c.beginPath();c.arc(70+a.x*.27,60+a.z*.27,4,0,Math.PI*2);c.fill();c.stroke();}
 function input(){const steer=stick+(held.ArrowRight||held.KeyD?1:0)-(held.ArrowLeft||held.KeyA?1:0),brake=held.brake||held.ArrowDown||held.KeyS||held.stickBrake;return {steer,throttle:brake?0:Q.auto||held.gas||held.ArrowUp||held.KeyW?1:0,brake:brake?1:0,drift:held.drift||held.Space,nitro:held.nitro||held.ShiftLeft||held.ShiftRight};}
 function frame(now){if(!Q||!Q.R)return;raf=requestAnimationFrame(frame);const raw=last?Math.max(0,now-last):0,dt=Math.min(.12,raw/1000);last=now;Q.renderDt=Math.min(.2,raw/1000);if(document.hidden||Q.state==='paused'||Q.state==='finished'||Q.state==='save-error')return;
  Q.governor(raw,now);if(Q.state==='countdown'){Q.count-=Math.min(.5,raw/1000);U.querySelector('[data-banner]').textContent=Q.count>0?Math.min(3,Math.ceil(Q.count)):'LOS!';if(Q.count<=0){Q.state='driving';Q.bannerUntil=1;}draw(Q.total);return;}
  accum+=dt;const I=input();while(accum>=1/120&&Q.state==='driving'){RACEDRIVE.update(Q.p,I,1/120);for(const a of Q.ai)RACEDRIVE.aiUpdate(a,1/120,[Q.p,...Q.ai]);RACEDRIVE.collide(Q.p,Q.ai,1/120);Q.total+=1/120;accum-=1/120;if(Q.p.finish){finish();break;}}
  if(!Q||Q.state!=='driving')return;if(Q.total-Q.saveAt>3){Q.saveAt=Q.total;if(!checkpoint()){pause();notice('Speichern fehlgeschlagen. Die Fahrt pausiert; bitte erneut speichern.');}}
  draw(Q.total);if(Q.total-Q.hudAt>.1){hud();Q.hudAt=Q.total;}
 }
 function hud(){const a=Q.p,pos=1+Q.ai.filter(b=>b.finish||b.progress>a.progress).length;U.querySelector('[data-speed]').textContent=Math.round(a.v*3.6);U.querySelector('[data-lap]').textContent='Runde '+Math.min(2,a.lap+1)+' / 2';U.querySelector('[data-time]').textContent=clock(a.time+a.penalty);U.querySelector('[data-place]').textContent=Q.mode==='monthly'?pos+' / 6':'SOLO';U.querySelector('[data-nitro]').style.width=a.nitro+'%';
  const banner=U.querySelector('[data-banner]');banner.textContent=Q.total<Q.bannerUntil?'LOS!':a.hit>0?'KONTAKT':a.drifting?'DRIFT · '+Math.floor(a.drift)+' m':'';banner.classList.toggle('race-drift',a.drifting);const angle=RACEDRIVE.wrap(RACETRACK.at(a.s+40).heading-RACETRACK.at(a.s).heading);const delta=((a.s-RACETRACK.START-(a.next-1)*RACETRACK.length/12)%RACETRACK.length+RACETRACK.length)%RACETRACK.length,missed=a.next>0&&delta>RACETRACK.length/12+20&&delta<RACETRACK.length-50;U.querySelector('[data-turn]').textContent=missed?'Kontrollpunkt verpasst · Zur Strecke':(Math.abs(angle)>.45?(angle>0?'Rechtskurve':'Linkskurve'):'Freie Strecke');}
 function bindControls(){const zone=U.querySelector('.race-stick'),knob=zone.querySelector('.race-stick-knob');
  const move=e=>{if(e.pointerId!==pointer)return;const b=zone.getBoundingClientRect(),r=b.width*.37,dx=Math.max(-r,Math.min(r,e.clientX-b.left-b.width/2)),dy=Math.max(-r,Math.min(r,e.clientY-b.top-b.height/2));stick=dx/r;held.stickBrake=dy>r*.65;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;e.preventDefault();};
  listen(zone,'pointerdown',e=>{if(Q.state!=='driving'&&Q.state!=='countdown'||pointer!==null)return;pointer=e.pointerId;zone.setPointerCapture(e.pointerId);move(e);});listen(zone,'pointermove',move);
  for(const k of ['pointerup','pointercancel','lostpointercapture'])listen(zone,k,e=>{if(e.pointerId===pointer){pointer=null;stick=0;held.stickBrake=false;knob.style.transform='translate(-50%,-50%)';}});
  U.querySelectorAll('[data-hold]').forEach(b=>{let id=null;b._raceReset=()=>{if(id!==null&&b.hasPointerCapture(id))b.releasePointerCapture(id);id=null;b.classList.remove('held');};listen(b,'pointerdown',e=>{if(id!==null||Q.state!=='driving'&&Q.state!=='countdown')return;id=e.pointerId;b.setPointerCapture(id);held[b.dataset.hold]=true;b.classList.add('held');e.preventDefault();});for(const k of ['pointerup','pointercancel','lostpointercapture'])listen(b,k,e=>{if(id===e.pointerId){id=null;held[b.dataset.hold]=false;b.classList.remove('held');}});});
  U.querySelector('#raceAuto').onchange=e=>{Q.auto=e.target.checked;U.focus({preventScroll:true});};
 }
 function key(e){
  if(!on||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code==='Tab'&&e.type==='keydown'){const scope=U.querySelector('.race-overlay:not([hidden])')||U,tabs=Array.from(scope.querySelectorAll('button:not(:disabled),select,input,[tabindex="0"]')).filter(n=>n.getClientRects().length);if(tabs.length){const i=tabs.indexOf(document.activeElement);if(i<0||e.shiftKey&&i===0||!e.shiftKey&&i===tabs.length-1){e.preventDefault();tabs[e.shiftKey?tabs.length-1:0].focus();}}return;}
  if(e.code==='Escape'){e.preventDefault();if(e.type==='keydown'&&!e.repeat){if(!Q&&view!=='lobby')lobby(viewUID);else if(!Q||Q.state==='finished')close();else if(Q.state==='paused')resume();else pause();}return;}
  if(!Q)return;
  const codes=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyS','KeyA','KeyD','Space','ShiftLeft','ShiftRight','KeyR'];if(!codes.includes(e.code))return;if(e.target&&/INPUT|SELECT/.test(e.target.tagName))return;e.preventDefault();held[e.code]=e.type==='keydown';if(e.type==='keydown'&&!e.repeat&&e.code==='KeyR'&&Q.state==='driving'){RACEDRIVE.recover(Q.p);camera(true);}
 }
 function pause(){resetInput();if(!Q||!['countdown','driving'].includes(Q.state))return;Q.resumeState=Q.state;Q.state='paused';engineStop();checkpoint();U.querySelector('.race-overlay').hidden=false;U.querySelector('.race-overlay').innerHTML=`<div class="race-dialog"><span class="race-label">BOXENSTOPP</span><h2>Kurze Pause.</h2><p>WASD / Pfeile lenken und bremsen.<br>Leertaste: Drift · Umschalt: Nitro.</p><p>Aktuell ${number(Q.p.km,2)} km gefahren. ${Q.mode==='monthly'?'Beenden verbraucht den Monatsstart.':''}</p><button class="btn" data-race="resume">Weiterfahren</button><button class="btn ghost" data-race="abandon">Lauf beenden</button></div>`;U.querySelector('[data-race="resume"]').focus({preventScroll:true});}
 function resume(){if(!Q||Q.state!=='paused')return;if(!checkpoint()){notice('Speichern weiterhin nicht möglich. Bitte Gerätespeicher prüfen und erneut versuchen.');return;}notice('');if(!Q.R||Q.R.lost()){notice('Grafik unterbrochen. Bitte diesen Lauf beenden und die Rennbahn erneut öffnen.');return;}Q.state=Q.resumeState||'driving';U.querySelector('.race-overlay').hidden=true;last=0;resetInput();engineStart();}
 /* v469: Der Zieleinlauf wird genau einmal gefeiert, auch bei Speicherwiederholung.
    Preisgeld erscheint erst nach der erfolgreichen vorhandenen Transaktion. */
 function finish(){Q.state='finished';engineStop();resetInput();if(!Q.aiFinal){for(let t=0;t<Math.min(600,Q.p.penalty);t+=.05)for(const a of Q.ai)RACEDRIVE.aiUpdate(a,Math.min(.05,Q.p.penalty-t),Q.ai);Q.aiFinal=true;}hud();draw(Q.total);
  if(!Q.goalShown){Q.goalShown=true;Q.previousBest=bestFor(Q.layout);Q.personalBest=!Q.previousBest||Q.p.finish<Q.previousBest;Q.goalFx=RACEFINISH.start(U,{audio:S.farm.snd&&typeof farmAC!=='undefined'?farmAC:null,seed:469+Q.p.next});}
  if(!settle(true)){Q.state='save-error';U.querySelector('.race-overlay').hidden=false;U.querySelector('.race-overlay').innerHTML='<div class="race-dialog"><h2>Ziel erreicht.</h2><p>Dein Ergebnis konnte noch nicht gespeichert werden. Das Preisgeld wird erst danach gutgeschrieben.</p><button class="btn" data-race="retry">Ergebnis speichern</button></div>';return;}result();
 }
 function finishBadge(podium){return `<svg class="race-finish-badge" viewBox="0 0 100 96" aria-hidden="true">${podium?'<path d="M26 15H13v16q0 18 21 20m40-36h13v16q0 18-21 20" fill="none" stroke="#102635" stroke-width="7"/><path d="M27 10h46v28q0 22-23 22T27 38z" fill="currentColor" stroke="#102635" stroke-width="5"/><path d="M50 60v19m-20 7h40" fill="none" stroke="#102635" stroke-width="8" stroke-linecap="round"/><path d="m50 21 4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1z" fill="#fff6d5"/>':'<circle cx="50" cy="45" r="34" fill="currentColor" stroke="#102635" stroke-width="5"/><path d="m31 46 13 14 26-29" fill="none" stroke="#102635" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="m31 74-6 17 22-8m22-9 6 17-22-8" fill="currentColor" stroke="#102635" stroke-width="5"/>'}</svg>`;}
 function result(){const g=garageById(Q.g.uid),loss=Math.max(0,Q.value-gValue(g)),monthly=Q.mode==='monthly',podium=monthly&&Q.place<=3,tone=monthly&&Q.place<=3?['','gold','silver','bronze'][Q.place]:'finish';
  U.querySelector('.race-overlay').hidden=false;U.querySelector('.race-overlay').innerHTML=`<div class="race-dialog race-result race-result469 ${tone}"><div class="race-finish-header" role="status"><span class="race-finish-kicker">ZIELLINIE ÜBERQUERT</span>${finishBadge(podium)}<span class="race-label">${monthly?'MONATSRENNEN · Platz '+Q.place+' / 6':'TRAINING ABGESCHLOSSEN'}</span><h2>${monthly?Q.place===1?'Sieg!':'Platz '+Q.place:'Ziel erreicht!'}</h2><p>${monthly&&Q.place===1?'Ganz vorn ins Ziel – das ist dein Sieg.':'Beide Runden geschafft. Dein Ergebnis steht.'}</p></div>${Q.award?`<div class="race-prize469"><small>DEIN PREISGELD</small><strong class="race-win">+${cash(Q.award)}</strong></div>`:''}${Q.personalBest?`<div class="race-best469">${Q.previousBest?'Neue Bestzeit!':'Deine erste Kurszeit'} <span>${esc(RACETRACK.forId(Q.layout).name)}</span></div>`:''}<div class="race-result-grid"><div><small>GESAMTZEIT</small><b>${clock(Q.p.finish)}</b></div><div><small>GEFAHREN</small><b>${number(Q.p.km,2)} km</b></div><div><small>DRIFTSTRECKE</small><b>${Math.floor(Q.p.drift)} m</b></div><div><small>WERTVERLUST</small><b>−${cash(loss)}</b></div></div><p>${esc(carName(Q.c))}<br>${number(g.km,1)} km · Rennverschleiß ${number(g.raceWear||0,2)} %${Q.p.penalty?'<br>Enthaltene Zeitstrafe: '+Q.p.penalty+' s':''}</p><button class="btn" data-race="lobby">Zum Motorpark</button><button class="btn ghost" data-race="close">Zurück zum Hof</button></div>`;
  U.querySelector('[data-race="lobby"]').focus({preventScroll:true});
 }
 function abandon(){if(!Q)return;if(!settle(false)){notice('Speichern fehlgeschlagen. Der Lauf bleibt pausiert. Bitte erneut versuchen.');return;}const uid=Q.g.uid;lobby(uid);}
 function click(e){const b=e.target.closest('[data-race]');if(!b||b.disabled)return;switch(b.dataset.race){case'workshop':workshop(U.querySelector('#raceCar')?.value);break;case'layout':workshop(viewUID,b.dataset.layout);break;case'rebuild':if(rebuild(choice)){const uid=viewUID;lobby(uid);notice('Strecke umgebaut. 50 Kleeblätter wurden abgezogen.');}else notice('Umbau nicht durchgeführt. Bitte Kleeblätter und freien Spielstandspeicher prüfen.');break;case'back':lobby(viewUID);break;case'carview':showCar(U.querySelector('#raceCar')?.value);break;case'carpose':if(showroom)showroom.pose(b.dataset.pose);break;case'carzoom':if(showroom)showroom.zoom(+b.dataset.zoom);break;case'sound':S.farm.snd=!S.farm.snd;b.textContent='TON '+(S.farm.snd?'AN':'AUS');if(S.farm.snd)engineStart();else engineStop();persist();break;case'close':close();break;case'garage':if(close())showTab('market');break;case'practice':start('practice');break;case'monthly':start('monthly');break;case'pause':pause();break;case'resume':resume();break;case'abandon':abandon();break;case'lobby':lobby(Q&&Q.g.uid);break;case'recover':if(Q&&Q.state==='driving'){RACEDRIVE.recover(Q.p);camera(true);}break;case'retry':if(Q&&Q.state==='save-error')finish();break;}}
 function close(){if(!on)return true;if(Q&&data().active&&!settle(false)){pause();notice('Beenden erst nach erfolgreichem Speichern möglich. Bitte erneut versuchen.');return false;}destroyScene();unsubs.forEach(fn=>fn());unsubs=[];inert.forEach(([e,v])=>e.inert=v);inert=[];U.remove();U=null;Q=null;on=false;document.body.classList.remove('race-open');if(typeof FV!=='undefined')FV.last=performance.now();if(focus&&focus.isConnected)focus.focus({preventScroll:true});focus=null;return true;}
 FSIZE.racetrack=[RACETRACK.W,RACETRACK.D];FFIXED.add('racetrack');
 FCOS_CATS.push(['freizeit','Freizeit']);FCOSMETIC.push({id:'racetrack',race:true,cat:'freizeit',n:'Autorennbahn',i:'🏁',price:COST,d:'Eigener Motorpark mit Drifts, Nitro und Monatsrennen. 26 × 22 Kacheln; nur die Baufläche wird gerodet.'});
 /* v461: Vom Spieler ausdrücklich angeforderte, einmalige Gutschrift im lokalen Stand.
    Nur ein bewusst geöffneter Bonuslink löst sie aus; kein allgemeiner Startbonus. */
 document.addEventListener('DOMContentLoaded',()=>{
  if(!S||!S.farm)return;recoverSaved();
  const url=new URL(location.href),F=S.farm;
  if(url.searchParams.get('rennbahnbonus')!=='15000'||F.raceBonus15000)return;
  const before=F.clover;F.clover=(F.clover||0)+15000;F.raceBonus15000=true;
  if(!persist()){F.clover=before;delete F.raceBonus15000;toast('Gutschrift konnte nicht gespeichert werden. Bitte erneut versuchen.','bad');return;}
  url.searchParams.delete('rennbahnbonus');history.replaceState(null,'',url.href);
  toast('15.000 Kleeblätter wurden deinem Spielstand gutgeschrieben.','ok');
 });
 return {get on(){return on;},built,busy,clear,canPlace,place,planOrOpen,open,close,miniature,modelKey,layoutId,
  _test:{rebuild,workshop,showCar,bestFor,get showroom(){return showroom;},available,month,prize,receipt,recoverSaved,checkpoint,settle,get session(){return Q;},input,start,pause,resume}};
})();
