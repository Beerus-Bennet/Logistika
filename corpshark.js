/* v348: Ein Hai-Moment nach der bereits gespeicherten Übernahme.
   Reine Darstellung: weder Kauf noch Flotte noch Auszahlungen werden hier
   ausgeführt. Überspringen führt genau einmal zur bestehenden Übersicht. */
const CORP_SHARK = (() => {
  let active = null;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => { x=clamp01(x);return x*x*(3-2*x); };
  const mix = (a,b,t) => a+(b-a)*t;
  function art() {
    return `<svg viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="shkBody" x1="540" y1="160" x2="620" y2="350" gradientUnits="userSpaceOnUse"><stop stop-color="#83bdca"/><stop offset=".18" stop-color="#45889d"/><stop offset=".6" stop-color="#1b4f68"/><stop offset="1" stop-color="#092d46"/></linearGradient>
        <linearGradient id="shkBelly" x1="590" y1="265" x2="650" y2="354" gradientUnits="userSpaceOnUse"><stop stop-color="#e5f5e9"/><stop offset="1" stop-color="#6d9ba6"/></linearGradient>
        <linearGradient id="shkFin" x1="400" y1="140" x2="590" y2="400" gradientUnits="userSpaceOnUse"><stop stop-color="#6eacbb"/><stop offset=".55" stop-color="#24566d"/><stop offset="1" stop-color="#05263d"/></linearGradient>
        <linearGradient id="shkEdge"><stop stop-color="#b5f6ee" stop-opacity="0"/><stop offset=".55" stop-color="#c0f7e7" stop-opacity=".8"/><stop offset="1" stop-color="#f9df9c" stop-opacity=".4"/></linearGradient>
      </defs>
      <g stroke="#07263b" stroke-width="3" stroke-linejoin="round">
        <path d="M601 294 Q663 321 714 365 Q663 355 612 332 L559 300Z" fill="#143f57"/>
        <g class="shk-tail">
          <path d="M278 264 C195 241 158 162 113 92 Q117 207 161 259 Q132 312 109 379 C180 349 218 302 280 293Z" fill="url(#shkFin)"/>
          <path d="M165 260 Q205 276 270 281" stroke="#80bbc7" stroke-width="3" opacity=".55"/>
        </g>
        <path d="M428 200 Q474 132 535 65 Q526 130 573 185 L610 215Z" fill="url(#shkFin)"/>
        <path d="M289 251 L318 207 Q330 232 365 237Z" fill="#2b6278"/>
        <path d="M246 265 C340 226 395 187 559 179 C730 168 842 189 902 239 Q928 258 906 278 C842 326 729 346 586 340 C426 339 347 313 246 295 Q232 280 246 265Z" fill="url(#shkBody)"/>
        <path d="M286 292 C460 302 556 319 682 309 C778 304 841 277 911 263 Q915 277 891 289 C797 336 689 349 563 338 Q397 330 286 292Z" fill="url(#shkBelly)" stroke="none"/>
        <path d="M327 241 Q577 151 809 208" stroke="url(#shkEdge)" stroke-width="5" stroke-linecap="round"/>
        <path d="M795 285 Q858 283 909 263 L894 282 Q853 303 806 300Z" fill="#051a2a" stroke-width="2"/>
        <path d="M825 285 L832 294 L839 283 M851 280 L858 288 L865 277 M878 272 L883 280 L889 268" fill="#eff7ec" stroke="none"/>
        <path d="M733 226 Q713 252 731 278 M718 223 Q696 251 713 280 M702 222 Q681 250 696 281 M687 221 Q665 248 679 278 M672 222 Q651 246 665 272" stroke="#10384d" stroke-width="4" stroke-linecap="round" opacity=".85"/>
        <path class="shk-pectoral" d="M570 282 Q619 314 696 409 C626 390 567 354 526 309Z" fill="url(#shkFin)"/>
        <path d="M553 299 Q599 352 665 390" stroke="#92c0c3" stroke-width="2" opacity=".35"/>
        <ellipse cx="851" cy="233" rx="8" ry="7" fill="#081a24" stroke="#a8bda8" stroke-width="2"/>
        <circle cx="853" cy="231" r="2.2" fill="#efffff" stroke="none"/>
        <path d="M891 246 L898 248" stroke="#10364a" stroke-width="3" stroke-linecap="round"/>
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
    const r=rivalById(ev.id);if(!r)return false;
    const rm=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el=document.createElement('div'),previous=document.activeElement;
    el.id='corpShow';el.className='cs-shark'+(rm?' shk-rm':'');el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','shkTitle');el.tabIndex=-1;
    const game=S,company=S.player.company,initials=String(r.name).split(/\s+/).map(w=>w[0]).join('').slice(0,2);
    const stats=[[ev.veh,'Fahrzeuge'],[ev.staff,'Mitarbeitende'],Number(ev.pct)>0?[ev.pct,'% Marktanteil']:[ev.cust||0,'Stammkunden']];
    el.innerHTML=`<div class="shk-sea" aria-hidden="true"><div class="shk-light"></div><div class="shk-grid"></div>
      <div class="shk-bubbles">${Array.from({length:18},(_,i)=>`<i style="--x:${(i*37+13)%100}%;--d:${i%7*.4}s;--s:${3+i%4*2}px"></i>`).join('')}</div>
      <div class="shk-orbit"></div><div class="shk-horizon"></div></div>
      <header class="shk-top"><span>LOGISTIKA <i>·</i> UNTERNEHMENSGRUPPE</span><button class="shk-skip" type="button">Animation überspringen <span aria-hidden="true">→</span></button></header>
      <div class="shk-caption"><p class="shk-kicker">DEIN ZUG. DEINE ENTSCHEIDUNG.</p><h2 id="shkTitle">Du spielst jetzt<br>in einer anderen Liga.</h2><p class="shk-intro">${esc(r.name)}<span>Eine neue Ära beginnt.</span></p></div>
      <div class="shk-stage" aria-hidden="true"><div class="shk-wake"></div><div class="shk-target"><span>${esc(initials)}</span><i></i></div><div class="shk-animal">${art()}</div>
        <div class="shk-burst">${Array.from({length:24},(_,i)=>`<i style="--a:${i*15}deg;--r:${90+i%5*24}px;--d:${i%3*.06}s"></i>`).join('')}</div></div>
      <section class="shk-result" aria-label="Ergebnis der Übernahme"><div class="shk-seal" aria-hidden="true"><svg viewBox="0 0 48 40" fill="none"><path d="M8 29 5 12l11 8L24 6l8 14 11-8-3 17H8Z" fill="#e4bf72" stroke="#fff0bd" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 34h30" stroke="#e4bf72" stroke-width="3" stroke-linecap="round"/></svg></div><p class="shk-kicker">ÜBERNAHME ABGESCHLOSSEN</p><h3 id="shkVictory"${company.length>24?' class="shk-brand-long"':''}>${esc(company)}</h3><p class="shk-power" id="shkPower">Du gibst den Kurs vor.</p>
        <p class="shk-company">${esc(r.name)}<span>ist jetzt Teil deiner Unternehmensgruppe.</span></p>
        <div class="shk-stats">${stats.map(([n,label])=>`<div><b data-shk-n="${Number(n)||0}">${rm?Number(n)||0:0}</b><span>${label}</span></div>`).join('')}</div>
        <button class="shk-details" type="button">Übernahme ansehen <span aria-hidden="true">→</span></button></section>
      <footer class="shk-bottom" aria-hidden="true"><span>HAIFISCH</span><i><b></b></i><small>Ein Meilenstein für ${esc(company)}</small></footer>`;
    document.body.appendChild(el);document.body.classList.add('cs-open');
    const animal=el.querySelector('.shk-animal'),target=el.querySelector('.shk-target'),wake=el.querySelector('.shk-wake'),bar=el.querySelector('.shk-bottom b'),numbers=el.querySelectorAll('[data-shk-n]'),audio=sound();
    let raf=0,elapsed=0,last=performance.now(),finished=false,hit=false,rushed=false,lit=false;
    function finish(){
      if(finished)return;finished=true;cancelAnimationFrame(raf);audio.stop();document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);el.remove();document.body.classList.remove('cs-open');active=null;
      if(S===game)onDone();
      const report=document.getElementById('corpShow');if(report){report.tabIndex=-1;report.focus({preventScroll:true});}else if(previous&&previous.isConnected)previous.focus({preventScroll:true});
    }
    function key(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish();}
      else if(e.key==='Tab'){const buttons=[...el.querySelectorAll('button')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden');const i=buttons.indexOf(document.activeElement);e.preventDefault();if(buttons.length)buttons[i<0?(e.shiftKey?buttons.length-1:0):(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}}
    function visibility(){last=performance.now();if(document.hidden)audio.stop();}
    function draw(t){
      const emergence=ease((t-.65)/2.1),rush=ease((t-2.85)/1.05),exit=ease((t-4.05)/1.45);
      animal.style.transform=`translate(${mix(-100,-5,emergence)-rush*10+exit*100}%, ${mix(25,-3,emergence)-rush*5+Math.sin(t*2)*1.5}%) scale(${mix(.35,.64,emergence)+rush*.66}) rotate(${mix(-9,0,emergence)-rush*3}deg)`;
      animal.style.opacity=String(Math.min(1,t*1.2)*(1-exit));
      const swallow=ease((t-3.12)/.55);target.style.transform=`translate(${swallow*90}px,${swallow*20}px) scale(${1-swallow*.96}) rotate(${swallow*22}deg)`;target.style.opacity=String(1-swallow);
      wake.style.opacity=String(emergence*(1-exit)*.55);wake.style.transform=`translateX(${rush*35}%) scaleX(${1+rush*.7})`;
      bar.style.width=clamp01(t/8.2)*100+'%';
      if(t>=2.7&&!rushed){rushed=true;if(!rm)audio.play('rush');}
      if(t>=3.7&&!hit){hit=true;el.classList.add('shk-hit');if(!rm)audio.play('resolve');}
      if(t>=4.3&&!lit){lit=true;el.classList.add('shk-reveal');el.setAttribute('aria-labelledby','shkVictory');el.setAttribute('aria-describedby','shkPower');el.querySelector('.shk-skip').innerHTML='Details ansehen <span aria-hidden="true">→</span>';}
      const count=ease((t-4.5)/1.2);numbers.forEach(b=>b.textContent=String(Math.round(+b.dataset.shkN*count)));
    }
    function frame(now){if(!el.isConnected){finish();return;}const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
      if(!document.hidden){elapsed+=dt;draw(elapsed);}if(!S.farm||!S.farm.snd)audio.stop();
      if(elapsed>=8.2){finish();return;}raf=requestAnimationFrame(frame);
    }
    el.querySelectorAll('button').forEach(b=>b.onclick=finish);document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);
    active={finish};el.focus({preventScroll:true});
    if(rm){draw(6);animal.style.transform='translate(-5%,0) scale(1)';animal.style.opacity='.28';el.classList.add('shk-reveal');bar.style.width='100%';}
    else {draw(0);audio.play('deep');raf=requestAnimationFrame(frame);}
    return true;
  }
  function prime(){
    if(!S.farm||!S.farm.snd||typeof farmAC==='undefined')return;
    try{if(!farmAC){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;farmAC=new AC();}if(farmAC.state==='suspended')farmAC.resume().catch(()=>{});}catch(_) { /* Ton ist optional. */ }
  }
  return {open,prime};
})();
