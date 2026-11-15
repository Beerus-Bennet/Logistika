/* v355: Ein verständlicher Hai-Moment nach der bereits gespeicherten Übernahme.
   Reine Darstellung: weder Kauf noch Flotte noch Auszahlungen werden hier
   ausgeführt. Überspringen führt genau einmal zur bestehenden Übersicht. */
const CORP_SHARK = (() => {
  let active = null;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => { x=clamp01(x);return x*x*(3-2*x); };
  const mix = (a,b,t) => a+(b-a)*t;
  function art() {
    /* Eigenes Weißhai-Motiv: kräftiger Schulterbereich, schlanker Schwanzstiel,
       sichelförmige Schwanzflosse und geschlossenes Maul statt Comic-Grinsen. */
    return `<svg viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="shkBack" x1="555" y1="164" x2="583" y2="340" gradientUnits="userSpaceOnUse"><stop stop-color="#a6c5c9"/><stop offset=".12" stop-color="#597e8d"/><stop offset=".48" stop-color="#315769"/><stop offset=".8" stop-color="#16394e"/><stop offset="1" stop-color="#0b263c"/></linearGradient>
        <radialGradient id="shkVolume" cx=".7" cy=".23" r=".8"><stop stop-color="#bfd6d6" stop-opacity=".4"/><stop offset=".5" stop-color="#6a9299" stop-opacity=".06"/><stop offset="1" stop-color="#001b2e" stop-opacity=".55"/></radialGradient>
        <linearGradient id="shkBelly" x1="650" y1="280" x2="650" y2="348" gradientUnits="userSpaceOnUse"><stop stop-color="#dbe7df"/><stop offset=".6" stop-color="#b5cbc9"/><stop offset="1" stop-color="#557b88"/></linearGradient>
        <linearGradient id="shkFin" x1="470" y1="100" x2="590" y2="400" gradientUnits="userSpaceOnUse"><stop stop-color="#6c929c"/><stop offset=".4" stop-color="#365e73"/><stop offset="1" stop-color="#0b273d"/></linearGradient>
      <path id="shkHull" d="M253 264 C342 250 407 194 534 179 C675 161 788 179 851 210 C887 228 922 248 938 267 C923 284 904 296 880 305 C799 345 673 355 548 339 C422 323 338 302 254 290 Q244 276 253 264Z"/></defs>
      <g stroke="#0b2a3d" stroke-width="1.8" stroke-linejoin="round">
        <path d="M575 272 Q650 309 747 354 Q695 361 622 337 L539 300Z" fill="#153b50"/>
        <g class="shk-tail"><path d="M281 260 C220 233 185 147 131 80 C147 169 147 218 177 268 C149 305 143 349 121 397 C186 367 221 303 284 290 L310 276Z" fill="url(#shkFin)"/><path d="M178 267 Q217 279 280 275" stroke="#a2c6cc" opacity=".42"/><path d="M137 91 Q169 171 180 236" stroke="#abcdd0" opacity=".22"/></g>
        <path d="M409 206 C441 157 478 72 515 48 C500 113 522 156 565 189 L582 218Z" fill="url(#shkFin)"/>
        <path d="M420 204 Q461 140 503 68" stroke="#b2d6d6" opacity=".5"/>
        <path d="M287 250 320 217 335 244Z" fill="#365b6f"/>
        <use href="#shkHull" fill="url(#shkBack)"/>
        <path d="M267 283 C408 287 481 320 597 322 C722 330 812 308 863 284 Q899 271 938 267 C918 292 887 307 850 321 C759 353 643 355 536 337 C411 318 333 299 267 283Z" fill="url(#shkBelly)" stroke="none"/>
        <use href="#shkHull" fill="url(#shkVolume)" stroke="none"/>
        <path d="M330 249 C478 177 666 161 815 202" stroke="#d1e6e3" stroke-width="3" stroke-linecap="round" opacity=".58"/>
        <path d="M365 261 Q572 210 748 223" stroke="#81b4bb" stroke-width="1.3" opacity=".18"/>
        <path d="M792 298 Q865 307 925 277" stroke="#082334" stroke-width="3" stroke-linecap="round"/>
        <path d="M866 301 Q890 296 908 288" stroke="#647f86" stroke-width="1.5" opacity=".7"/>
        <path d="M744 216 Q725 247 743 282 M728 215 Q708 247 726 284 M711 215 Q691 246 709 285 M695 216 Q675 246 693 283 M679 218 Q660 244 677 279" stroke="#0b3047" stroke-width="3" stroke-linecap="round"/>
        <path class="shk-pectoral" d="M548 279 C578 304 636 381 698 423 C654 425 593 397 560 369 Q530 341 509 307Z" fill="url(#shkFin)"/>
        <path d="M543 302 Q590 360 678 414" stroke="#9ac2c7" stroke-width="1.5" opacity=".38"/>
        <path d="M799 223 Q817 219 833 230" stroke="#244757" stroke-width="4"/>
        <ellipse cx="820" cy="233" rx="6" ry="5.8" fill="#071c29" stroke="#96aeb0" stroke-width="1.4"/><circle cx="821.5" cy="231" r="1.5" fill="#dae9e7" stroke="none"/>
        <path d="M900 253 909 257" stroke="#173c50" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    </svg>`;
  }
  function sound() {
    const nodes=[];
    const stop=()=>{for(const n of nodes.splice(0)){try{n.stop();n.disconnect();}catch(_) { /* bereits beendet */ }} };
    return {stop,play(kind){
      if(!S.farm||!S.farm.snd||document.hidden)return;
      try {
        /* Eine bereits freigegebene Spiel-Audioverbindung verwenden; keine
           neue Autoplay-Berechtigung erzwingen. */
        if(typeof farmAC==='undefined'||!farmAC||farmAC.state!=='running')return;
        const ac=farmAC,t=ac.currentTime;
        const note=(hz,delay,duration,vol,end)=>{
          const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(hz,t+delay);
          if(end)o.frequency.exponentialRampToValueAtTime(end,t+delay+duration);
          g.gain.setValueAtTime(.0001,t+delay);g.gain.exponentialRampToValueAtTime(vol,t+delay+.025);g.gain.exponentialRampToValueAtTime(.0001,t+delay+duration);
          o.connect(g);g.connect(ac.destination);nodes.push(o);o.onended=()=>{o.disconnect();g.disconnect();const i=nodes.indexOf(o);if(i>=0)nodes.splice(i,1);};o.start(t+delay);o.stop(t+delay+duration+.03);
        };
        if(kind==='deep'){note(65,0,.7,.07,49);note(98,.36,.65,.035,73);}
        else if(kind==='rush'){note(90,0,.7,.045,440);note(147,.12,.7,.025,588);}
        else {note(73,0,1.4,.065);[293.66,369.99,440,587.33].forEach((f,i)=>note(f,i*.11,1.8,.025));}
      }catch(_) { /* Die Inszenierung funktioniert auch stumm. */ }
    }};
  }
  function open(ev, onDone) {
    if(active||document.getElementById('corpShow')||!ev||ev.kind!=='win')return false;
    const live=rivalById(ev.id);
    const r=ev.name?{name:ev.name,col:ev.col,icon:ev.icon}:live;if(!r)return false;
    const rm=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el=document.createElement('div'),previous=document.activeElement;
    el.id='corpShow';el.className='cs-shark'+(rm?' shk-rm':'');el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','shkTitle');el.tabIndex=-1;
    const game=S,company=ev.company||S.player.company,initials=String(r.name).split(/\s+/).map(w=>w[0]).join('').slice(0,2);
    const stats=[[ev.veh,'Fahrzeuge'],[ev.staff,'Mitarbeitende'],[ev.sites||1,'Standorte']];
    const ownInitials=String(company).split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
    el.innerHTML=`<div class="shk-sea" aria-hidden="true"><div class="shk-light"></div><div class="shk-grid"></div>
      <div class="shk-bubbles">${Array.from({length:18},(_,i)=>`<i style="--x:${(i*37+13)%100}%;--d:${i%7*.4}s;--s:${3+i%4*2}px"></i>`).join('')}</div>
      <div class="shk-orbit"></div><div class="shk-horizon"></div><div class="shk-swell"></div></div>
      <header class="shk-top"><span>LOGISTIKA <i>·</i> UNTERNEHMENSGRUPPE</span><button class="shk-skip" type="button">Animation überspringen <span aria-hidden="true">→</span></button></header>
      <div class="shk-caption"><p class="shk-kicker">${esc(company)} ÜBERNIMMT</p><h2 id="shkTitle">${esc(r.name)}</h2><p class="shk-intro">Aus Konkurrenz wird deine Unternehmensgruppe.<span>Du bestimmst jetzt den Kurs.</span></p></div>
      <div class="shk-stage" aria-hidden="true"><div class="shk-shadow"></div><div class="shk-surface-fin"><svg viewBox="0 0 300 180"><path d="M20 150 Q130 140 207 20 Q170 103 278 150Z" fill="#123a4e" stroke="#94dbd8" stroke-width="2"/><path d="M20 154 Q140 170 285 154" fill="none" stroke="#c5f0e9" stroke-width="2"/></svg></div><div class="shk-wake"></div><div class="shk-flag"><b>${esc(ownInitials)}</b><span>DEINE GRUPPE</span></div><div class="shk-target"><span>${esc(initials)}</span><i></i><b class="shk-acquired">✓</b></div><div class="shk-animal">${art()}</div>
        <div class="shk-burst">${Array.from({length:24},(_,i)=>`<i style="--a:${i*15}deg;--r:${90+i%5*24}px;--d:${i%3*.06}s"></i>`).join('')}</div></div>
      <section class="shk-result" aria-label="Ergebnis der Übernahme"><div class="shk-seal" aria-hidden="true"><svg viewBox="0 0 48 40" fill="none"><path d="M8 29 5 12l11 8L24 6l8 14 11-8-3 17H8Z" fill="#e4bf72" stroke="#fff0bd" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 34h30" stroke="#e4bf72" stroke-width="3" stroke-linecap="round"/></svg></div><p class="shk-kicker">ÜBERNAHME ABGESCHLOSSEN</p><h3 id="shkVictory"${company.length>24?' class="shk-brand-long"':''}>${esc(company)}</h3><p class="shk-power" id="shkPower">Ein Konkurrent weniger. Mehr Stärke für dich.</p>
        <p class="shk-company">${esc(r.name)}<span>ist jetzt Teil deiner Unternehmensgruppe.</span></p>
        <div class="shk-stats">${stats.map(([n,label])=>`<div><b data-shk-n="${Number(n)||0}">${rm?Number(n)||0:0}</b><span>${label}</span></div>`).join('')}</div>
        <button class="shk-details" type="button">Übernahme ansehen <span aria-hidden="true">→</span></button></section>
      <footer class="shk-bottom" aria-hidden="true"><span class="shk-phase" role="status">DEINE ENTSCHEIDUNG. DEIN WACHSTUM.</span><i><b></b></i><small>Der Hai steht für deinen Aufstieg am Markt.</small></footer>`;
    document.body.appendChild(el);document.body.classList.add('cs-open');
    const oldInert=[];Array.from(document.body.children).forEach(child=>{if(child!==el&&child.tagName!=='SCRIPT'&&!child.inert){oldInert.push(child);child.inert=true;}});
    const fin=el.querySelector('.shk-surface-fin'),shadow=el.querySelector('.shk-shadow'),phase=el.querySelector('.shk-phase'),animal=el.querySelector('.shk-animal'),target=el.querySelector('.shk-target'),wake=el.querySelector('.shk-wake'),bar=el.querySelector('.shk-bottom b'),numbers=el.querySelectorAll('[data-shk-n]'),audio=sound();
    let raf=0,elapsed=0,last=performance.now(),finished=false,hit=false,rushed=false,lit=false,phaseIndex=-1;
    function finish(){
      if(finished)return;finished=true;cancelAnimationFrame(raf);audio.stop();document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);el.remove();document.body.classList.remove('cs-open');oldInert.forEach(child=>{child.inert=false;});active=null;
      if(S===game)onDone();
      const report=document.getElementById('corpShow');if(report){report.tabIndex=-1;report.focus({preventScroll:true});}else if(previous&&previous.isConnected)previous.focus({preventScroll:true});
    }
    function key(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish();}
      else if(e.key==='Tab'){const buttons=[...el.querySelectorAll('button')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden');const i=buttons.indexOf(document.activeElement);e.preventDefault();if(buttons.length)buttons[i<0?(e.shiftKey?buttons.length-1:0):(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}}
    function visibility(){last=performance.now();el.classList.toggle('shk-paused',document.hidden);if(document.hidden)audio.stop();}
    function draw(t){
      const emergence=ease((t-1.5)/2.0),rush=ease((t-3.65)/1.1),exit=ease((t-4.7)/1.0);
      const finRise=ease((t-.3)/1.2),finFade=ease((t-1.9)/.7);
      fin.style.transform=`translate(${mix(-65,8,finRise)}%,${mix(30,0,finRise)}%) scale(${mix(.55,1.05,finRise)})`;
      fin.style.opacity=String(finRise*(1-finFade));
      shadow.style.transform=`translateX(${mix(-45,35,emergence+rush*.3)}%) scale(${.4+emergence*.8+rush*.3})`;
      shadow.style.opacity=String(finRise*(1-exit)*.65);
      animal.style.transform=`perspective(900px) translate(${mix(-90,-9,emergence)+rush*48+exit*95}%, ${mix(34,0,emergence)-rush*8+Math.sin(t*2)*1.2}%) scale(${mix(.36,1.04,emergence)+rush*.27}) rotate(${mix(-11,0,emergence)-rush*3}deg) rotateY(${mix(-20,0,emergence)}deg)`;
      animal.style.opacity=String(ease((t-1.45)/.5)*(1-exit));
      const integrate=ease((t-4.5)/.9);target.style.left=(76-integrate*15)+'%';
      target.style.transform=`translateY(${integrate*15}px) scale(${1-integrate*.18})`;target.style.opacity=String(1-ease((t-5.5)/.5));
      wake.style.opacity=String(emergence*(1-exit)*.75);wake.style.transform=`translateX(${rush*35}%) scaleX(${1+rush*.7})`;
      bar.style.width=clamp01(t/9.4)*100+'%';
      const pi=t<1.5?0:t<3.65?1:t<5.4?2:3;
      if(pi!==phaseIndex){phaseIndex=pi;phase.textContent=['DEINE ENTSCHEIDUNG. DEIN WACHSTUM.','DU ÜBERNIMMST DIE FÜHRUNG.','DIE ÜBERNAHME IST BESIEGELT.','DEINE UNTERNEHMENSGRUPPE WÄCHST.'][pi];}
      if(t>=3.45&&!rushed){rushed=true;if(!rm)audio.play('rush');}
      if(t>=4.5&&!hit){hit=true;el.classList.add('shk-hit');if(!rm)audio.play('resolve');}
      if(t>=5.7&&!lit){lit=true;el.classList.add('shk-reveal');el.setAttribute('aria-labelledby','shkVictory');el.setAttribute('aria-describedby','shkPower');el.querySelector('.shk-skip').innerHTML='Details ansehen <span aria-hidden="true">→</span>';}
      const count=ease((t-5.85)/.9);numbers.forEach(b=>b.textContent=String(Math.round(+b.dataset.shkN*count)));
    }
    function frame(now){if(!el.isConnected){finish();return;}const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
      if(!document.hidden){elapsed+=dt;draw(elapsed);}if(!S.farm||!S.farm.snd)audio.stop();
      if(elapsed>=9.4){finish();return;}raf=requestAnimationFrame(frame);
    }
    el.querySelectorAll('button').forEach(b=>b.onclick=finish);document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);
    active={finish};el.focus({preventScroll:true});visibility();
    if(rm){draw(7);animal.style.transform='translate(-5%,0) scale(1)';animal.style.opacity='.28';el.classList.add('shk-reveal');bar.style.width='100%';}
    else {draw(0);audio.play('deep');raf=requestAnimationFrame(frame);}
    return true;
  }
  function prime(){
    if(!S.farm||!S.farm.snd||typeof farmAC==='undefined')return;
    try{if(!farmAC){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;farmAC=new AC();}if(farmAC.state==='suspended')farmAC.resume().catch(()=>{});}catch(_) { /* Ton ist optional. */ }
  }
  return {open,prime};
})();
