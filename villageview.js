/* v340: Die Wohnsiedlung verwendet dieselbe Hausarchitektur wie die Hütte
   am See. Bewohner tragen Alltagskleidung und haben gegliederte Gehbewegungen. */
const VILLAGE_VIEW = (() => {
  const D=VILLAGE_DATA,W={R:null,homes:new Map(),actors:new Map(),road:null,extension:null,fences:null,fenceKey:""},DAY=1440;
  const add=(mesh,o)=>{const n=fnode(mesh,o);W.R.nodes.push(n);return n;};
  /* v343: Lageplan, Einmündungen und gemeinsame Grundstücksgrenzen. */
  const roadMesh=expanded=>VILLAGE_SITE.roadMesh(expanded);
  const garden=p=>VILLAGE_SITE.garden(p);
  function buildingMesh(){
    const b=new FM.MB();b.plate(5.2,5.2,0xb5ada0,{y0:.05});
    [-2,2].forEach(x=>[-2,2].forEach(z=>b.box(.13,2.2,.13,0xc69a66,{x,z})));
    [1.1,2.1].forEach(y=>{b.box(4.2,.12,.12,0xc69a66,{y,z:-2});b.box(4.2,.12,.12,0xc69a66,{y,z:2});});
    b.box(2.0,.35,.7,0xd2b488,{x:3.1,z:1});b.box(.6,.6,.6,0xa98765,{x:3.1,z:-1});return b;
  }
  function markerMesh(){const b=new FM.MB();[-6,6].forEach(x=>[-4.9,4.9].forEach(z=>{b.box(.08,.5,.08,0x987454,{x,z});b.box(.13,.1,.13,0xe9dfb9,{x,z,y:.4});}));return b;}
  function attach(R){
    W.R=R;W.homes.clear();W.fenceKey="";VILLAGE_PEOPLE.attach(R);W.actors=VILLAGE_PEOPLE._world.actors;
    W.road=add(fmesh("village-road343",()=>roadMesh(false)),{shadow:false});
    W.extension=add(fmesh("village-grid343",()=>roadMesh(true)),{shadow:false,visible:VILLAGE.state().expanded});
    W.fences=add(null,{shadow:true});
    const sign=new FM.MB();for(const x of [-.8,.8])sign.box(.12,1.8,.12,0x715035,{x});sign.box(1.85,.9,.12,0x9a714b,{y:.8});sign.box(2.0,.1,.4,0x82533c,{y:1.72});
    W.sign=add(fmesh("town-sign344",()=>sign),{x:-64.5,z:24});
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle='#e9d7ac';ctx.fillRect(0,0,512,192);ctx.fillStyle='#3d5137';ctx.textAlign='center';ctx.font='bold 70px sans-serif';ctx.fillText('Seeblick',256,106);ctx.font='25px sans-serif';ctx.fillText('Nachbarschaft · Stadtbau',256,151);
    W.R.addChild(W.sign,W.R.node(null,{y:1.25,z:.071,decal:{t:W.R.texture(canvas),w:1.7,h:.65}}));
    sync();
  }
  function sync(){
    if(!W.R||!farmOn())return;const T=VILLAGE.state();W.extension.visible=T.expanded;W.road.visible=!T.expanded;
    for(const p of D.plots){const h=T.homes[p.id];let e=W.homes.get(p.id);
      if(!e){
        e={garden:add(fmesh("village-garden343:"+p.id,()=>garden(p)),{x:p.x,z:p.z,visible:false,shadow:false}),marker:add(fmesh("village-markers340",markerMesh),{x:p.x,z:p.z,visible:false}),site:add(fmesh("village-site340",buildingMesh),{x:p.x,z:p.z,visible:false}),house:null,lit:null,type:null};W.homes.set(p.id,e);}
      const blocked=!!VILLAGE.obstruction(p),built=!!h.resident||h.status==="ready";
      e.marker.visible=!p.starter&&T.expanded&&!built;
      e.site.mesh=fmesh("village-site344:"+(h.type||"holz"),()=>VILLAGE_SITE.construction(h.type||"holz"));
      e.site.visible=h.status==="building"&&!blocked;
      e.garden.visible=built&&!blocked;
      if((built||h.status==="building")&&e.type!==h.type){
        for(const n of [e.house,e.lit])if(n){const i=W.R.nodes.indexOf(n);if(i>=0)W.R.nodes.splice(i,1);}
        const k=D.houses[h.type],style=Number(p.id)%3;
        e.garden.mesh=fmesh("village-garden343:"+p.id+":"+h.type,()=>garden(p));
        e.house=add(fmesh("village-house344:"+h.type+":"+style,()=>VILLAGE_SITE.homeMesh(h.type,style)),{x:p.x,z:p.z,ry:p.ry,s:k.scale,visible:built&&!blocked});
        e.lit=add(fmesh("village-light340",()=>RENT.homeLights()),{x:p.x,z:p.z,ry:p.ry,s:k.scale,visible:false,shadow:false,glow:.55});e.type=h.type;
      }
      if(e.house){e.house.visible=built&&!blocked;if(built)e.house.sy=D.houses[h.type].scale;}
      if(!e.gate){
        const g=VILLAGE_SITE.gate(p),m=VILLAGE_SITE.mailbox(p);
        e.gate=add(fmesh("village-gate343",VILLAGE_SITE.gateMesh),{x:g[0],z:g[1]-.6});
        e.mail=add(fmesh("village-mail343",VILLAGE_SITE.mailboxMesh),{x:m[0],z:m[1],ry:-p.side*Math.PI/2});
        e.flap=W.R.addChild(e.mail,fnode(fmesh("village-mailflap343",VILLAGE_SITE.mailFlap),{y:1.12,z:.17}));
      }
      const g=VILLAGE_SITE.gate(p),m=VILLAGE_SITE.mailbox(p);e.gate.x=g[0];e.gate.z=g[1]-.6;e.mail.x=m[0];e.mail.z=m[1];
      e.gate.visible=e.mail.visible=built&&!blocked;
    }
    const occupied=D.plots.filter(p=>{const h=T.homes[p.id];return (h.resident||h.status==="ready")&&!VILLAGE.obstruction(p);}),key=occupied.map(p=>p.id).join(",");
    if(key!==W.fenceKey){W.fenceKey=key;const plan=VILLAGE_SITE.fencePlan(occupied);W.fences.mesh=fmesh("village-fences343:"+key,()=>VILLAGE_SITE.fenceMesh(plan));}
    VILLAGE_PEOPLE.sync();
  }
  function step(dt,time){
    if(!W.R||!farmOn())return;VILLAGE_PEOPLE.step(dt,time);const T=VILLAGE.state(),m=S.time%DAY;
    for(const p of D.plots){const h=T.homes[p.id],e=W.homes.get(p.id);if(!e)continue;
      if(e.lit)e.lit.visible=!!h.resident&&e.house.visible&&((m>=360&&m<450)||(m>=1080&&m<1350));
      if(h.status==="building"&&e.house){const f=1-(h.ready-S.time)/(D.houses[h.type].days*DAY);e.house.visible=f>.7&&!VILLAGE.obstruction(p);e.house.sy=D.houses[h.type].scale*Math.max(.08,(f-.7)/.3);}
      const actor=W.actors.get(p.id),g=VILLAGE_SITE.gate(p),L=h.life&&h.life.active,q=L&&VILLAGE_PEOPLE.sample(L);
      if(e.gate){const nearby=actor&&actor.node.visible&&Math.hypot(actor.node.x-g[0],actor.node.z-g[1])<2.1;
        e.gate.ry+=((nearby?p.side*1.15:0)-e.gate.ry)*Math.min(1,dt*5);
        const flap=q&&q.kind==="mail"?Math.sin(Math.PI*q.f)*1.35:0;e.flap.rx+=(flap-e.flap.rx)*Math.min(1,dt*7);}
      if(e.lit&&e.lit.visible&&Math.random()<dt*.2){const k=D.houses[h.type],c=VILLAGE.local(p,-2.95*k.scale,-.2*k.scale);W.R.emit({x:c[0],y:7*k.scale,z:c[1],vx:.08,vy:.35,vz:.05,life:2,size:.18,size2:.5,col:[.72,.72,.7,.2],drag:.8});}
    }
  }
  function pick(x,y){if(!W.R)return null;const ray=W.R.ray(x,y);const sd=W.R.hitBox(ray,[-65.5,0,23.7],[-63.5,1.9,24.3]);let best=sd!=null?{d:sd,id:null}:null;
    for(const p of D.plots){const h=VILLAGE.home(p.id),e=W.homes.get(p.id);if(!e||(!e.garden.visible&&!e.marker.visible&&!e.site.visible))continue;
      const d=W.R.hitBox(ray,[p.x-4.6,0,p.z-3.2],[p.x+4.6,h.resident||h.status==="ready"?6.5:2.3,p.z+3.2]);
      if(d!=null&&(!best||d<best.d))best={d,id:p.id};}return best;}
  function tags(){if(!W.R||!farmOn())return [];const T=VILLAGE.state(),out=[];
    for(const p of D.plots){const h=T.homes[p.id];if(W.R.cam.dist>65||Math.hypot(W.R.cam.tx-p.x,W.R.cam.tz-p.z)>34)continue;
      /* v341: keine Namensschilder über bewohnten Häusern mehr (Antippen des Hauses öffnet weiterhin die Nachbarschaft, siehe pick) */
      if(!h.resident&&(h.status==="building"||h.status==="ready"))out.push({id:p.id,x:p.x,y:h.status==="ready"?6:2.5,z:p.z,html:h.status==="building"?"🏗️ "+p.number:"🏡 Wohnanfragen",open:()=>VILLAGE_UI.open(p.id)});}
    return out;}
  function focus(id){const p=id&&VILLAGE.plot(id),wide=VILLAGE.state().expanded,R=FV.R;
    const aspect=R.w/R.h,tan=Math.tan(R.cam.fov/2),span=Math.max(wide?91:47,(wide?103:50)/aspect),dist=span/(2*tan)*1.16+(wide?30:15),near=Math.max(25,12/(2*tan*aspect)*1.16+5);
    closeFarmSheet();farmFocusXZ(p?p.x:wide?-81:-62,p?p.z:wide?59:44,p?near:dist,750);}
  return {attach,sync,step,pick,tags,focus,_world:W};
})();

/* v340: Nachbarschaft und förmliche Wohnverhandlungen im bestehenden Bodenblatt. */
const VILLAGE_UI = (() => {
  const D=VILLAGE_DATA,labels={vacant:"Freies Grundstück",land:"Eigenes Baugrundstück",building:"Im Bau",ready:"Bezugsfertig",resident:"Bewohnt · Nachbarschaft",rented:"Vermietet",sold:"Verkauft · bewohnt"};
  const folds=new Map();
  const address=p=>esc(p.street+" "+p.number);
  function overview(){const T=VILLAGE.state(),people=VILLAGE.residents();
    return `<p class="town-lead">Sechs Haushalte sind schon hier zu Hause. Lerne deine Nachbarn durch kleine Fahrradlieferungen kennen. Gute Erfahrungen werden weitererzählt.</p>
      <div class="town-stats"><span>🏡 ${people.length} bewohnte Häuser</span><span>👥 ${people.reduce((n,x)=>n+x.r.size,0)} Einwohner</span><span>🚲 ${T.deliveries} Lieferungen</span><span>🤝 ${T.referrals.length} Empfehlungen</span></div>
      <button class="btn ghost" data-town-focus="">📍 Wohnviertel ansehen</button>
      <div class="town-plan" aria-label="Grundstücksplan der Siedlung">${[0,1,2,3,4].map(row=>["1"+row+"0","1"+row+"1","0"+row+"0","0"+row+"1"].map(id=>{const p=VILLAGE.plot(id),h=T.homes[id];return `<button data-town-home="${id}" class="${h.resident?"lived":""}" aria-label="${address(p)}: ${labels[h.status]}"><span>${h.resident?"🏡":h.status==="building"?"🏗️":"▧"}</span>${address(p)}<small>${h.resident?esc(h.resident.n.split(" ")[0]):esc(labels[h.status])}</small></button>`;}).join("")).join("")}</div>
      ${!T.expanded?`<section class="town-card"><b>Das nächste Quartier erschließen</b><p>Rechtwinklige Querstraßen, Gehwege und Versorgungsleitungen öffnen weitere 14 Baugrundstücke.</p><small>Ab Hof-Level 8 und sechs Hoflieferungen · ${money(D.extension)}</small><button class="btn" data-town-expand ${!VILLAGE.canExpand()||S.money<D.extension?"disabled":""}>Quartier erschließen</button></section>`:""}
      <div class="sechead sm">Nachbarn und Bekanntschaften</div>${people.map(({p,h,r})=>`<details class="town-person" data-town-fold="${r.id}"><summary><b>${esc(r.n)}</b><small>${address(p)} · ${h.deliveries||0} Lieferungen</small></summary><p>${esc(r.job)} · ${r.size} ${r.size===1?"Person":"Personen"} im Haushalt</p><button class="btn tiny ghost" data-town-home="${p.id}">Haus und Kontakt öffnen</button></details>`).join("")}
      ${T.referrals.length?`<div class="sechead sm">Weiterempfohlen</div>${T.referrals.map(f=>`<div class="town-card"><b>${esc(f.n)}</b><small>${esc(f.job)} · ${esc(N[f.town].short)}<br>Kennt deinen Hof durch ${esc(f.referrer)}.</small></div>`).join("")}`:""}
      <p class="fs-sub">Wöchentliche Netto-Mieteinnahmen bisher: ${money(T.earned)}. Die sechs bestehenden Häuser gehören ihren Bewohnern.</p>`;
  }
  function applicant(p,h,c){const a=c.agreed,kind=a?a.kind:c.kind,price=a?a.price:c.price;
    return `<details class="town-applicant" data-town-fold="${c.id}"${a?" open":""}><summary><b>${esc(c.n)}</b><small>${c.kind==="rent"?"Mietanfrage":"Kaufinteresse"} · ${c.size} ${c.size===1?"Person":"Personen"}</small></summary>
      <p>Sehr geehrte Damen und Herren,<br>${c.referrer?esc(c.referrer)+" hat mir Ihr Haus empfohlen.":"ich bin auf Ihre Onlineanzeige aufmerksam geworden."} Ich interessiere mich für das Haus ${address(p)}. ${c.kind==="rent"?"Ich biete "+money(c.price)+" monatliche Kaltmiete.":"Mein Kaufangebot beträgt "+money(c.price)+"."}<br>Mit freundlichen Grüßen<br>${esc(c.n)}</p>
      ${c.reply?`<p class="town-reply">${esc(c.reply)}</p>`:""}
      ${c.declined?`<b>Anfrage zurückgezogen</b>`:a?`<div class="town-agreement"><b>Vertragsangebot prüfen</b><p>${kind==="rent"?"Unbefristete Vermietung · "+money(price)+" Kaltmiete/Monat. Abrechnung alle sieben Spieltage, 8 % Rücklage werden abgezogen.":"Verkauf für "+money(price)+". Das Haus gehört anschließend der neuen Partei; du erhältst keine Miete."}</p><button class="btn" data-town-sign="${c.id}">${kind==="rent"?"Mietvertrag abschließen":"Kaufvertrag abschließen"}</button></div>`:
      `<form class="town-negotiate" data-town-negotiate="${c.id}"><label>Vertragsart<select name="kind"><option value="rent"${kind==="rent"?" selected":""}>Miete / Monat</option><option value="buy"${kind==="buy"?" selected":""}>Kaufpreis</option></select></label><label>Ihr Angebot in €<input name="price" type="number" min="1" step="1" required value="${price}"></label><button class="btn tiny ghost" type="submit">Konditionen vorschlagen</button></form>`}</details>`;
  }
  function detail(id){const p=VILLAGE.plot(id),h=VILLAGE.home(id),T=VILLAGE.state(),k=D.houses[h.type],block=VILLAGE.obstruction(p);
    let s=`<button class="btn tiny ghost" data-town-home="">← Übersicht</button><div class="town-card"><b>${address(p)}</b><small>${esc(labels[h.status])}</small><button class="btn tiny ghost" data-town-focus="${id}">📍 Zum Grundstück</button></div>`;
    if(block)s+=`<p class="hintbox warn">Auf diesem Grundstück steht bereits ein eigenes Objekt. Es bleibt erhalten. Räume es zuerst um, bevor du hier baust.</p>`;
    if(h.resident)s+=`<section class="town-card"><b>${esc(h.resident.n)}</b><p>${esc(h.resident.job)} · ${h.resident.size} Personen im Haushalt<br>${h.deliveries||0} Lieferungen erhalten</p><p>Die kleinen Lebensmittelbestellungen passen auf ein Fahrrad. Nach zwei erfolgreichen Lieferungen erzählen die Start-Nachbarn ihrem Bekanntenkreis vom Hof.</p><button class="btn ghost" data-town-orders>📋 Zur Bestelltafel</button></section>`;
    if(h.status==="vacant")s+=`<p>Eigenes Grundstück für ein Einfamilienhaus mit Garten und Straßenzugang.</p><button class="btn" data-town-buy ${!T.expanded||block||S.money<D.land?"disabled":""}>Grundstück kaufen · ${money(D.land)}</button>${!T.expanded?`<p class="fs-sub">Zuerst in der Übersicht das nächste Quartier erschließen.</p>`:""}`;
    if(h.status==="land")s+=Object.entries(D.houses).map(([type,k])=>`<section class="town-card"><b>${esc(k.n)}</b><small>Bauzeit ${k.days} Spieltage · Orientierung: ${money(k.rent)}/Monat oder ${money(k.sale)} Verkauf</small><p>Eigenmaterial: ${Object.entries(k.need).map(([i,n])=>esc(fqty(i,n))).join(", ")}</p><button class="btn" data-town-build="${type}|own" ${block||S.money<k.cost||!farmHasAll(k.need)?"disabled":""}>Mit eigenem Holz · ${money(k.cost)}</button><button class="btn ghost" data-town-build="${type}|turnkey" ${block||S.money<k.turnkey?"disabled":""}>Schlüsselfertig · ${money(k.turnkey)}</button></section>`).join("");
    if(h.status==="building")s+=`<p>Das ${esc(k.n)} wird errichtet. Fertig in ${dur(Math.max(1,h.ready-S.time))}.</p>`;
    if(h.status==="ready"){
      const L=h.listing;
      s+=`<div class="town-card"><b>${esc(k.n)} · bezugsfertig</b><p>Richtwert: ${money(k.rent)} Kaltmiete/Monat oder ${money(k.sale)} Kaufpreis. Die Interessenten können andere Konditionen vorschlagen.</p></div>`;
      if(!L)s+=`<div class="town-actions"><button class="btn" data-town-list="referral"${T.deliveries<3&&(S.farm.stats.deliv||0)<3?" disabled":""}>🤝 Über Nachbarn vermitteln · kostenlos</button><button class="btn ghost" data-town-list="online"${S.money<D.ad?" disabled":""}>🌐 Onlineanzeige · ${money(D.ad)}</button></div>`;
      else s+=`<p class="fs-sub">${L.channel==="referral"?"Nachbarschaftsempfehlung":"Onlineanzeige"} · gültig noch ${dur(Math.max(1,L.expires-S.time))}</p>${L.offers?L.offers.map(c=>applicant(p,h,c)).join(""):`<p>Die Vermittlung läuft. Erste Wohnanfragen in ${dur(Math.max(1,L.ready-S.time))}.</p>`}${L.offers&&L.offers.every(c=>c.declined)?`<p>Es kam zu keiner Einigung. Das Haus bleibt unbewohnt. Du kannst neue Interessenten suchen.</p><button class="btn ghost" data-town-relist>Neu vermitteln</button>`:""}`;
    }
    if(h.contract)s+=`<div class="town-card"><b>${h.contract.kind==="rent"?"Unbefristeter Mietvertrag":"Abgeschlossener Kaufvertrag"}</b><p>${h.contract.kind==="rent"?money(h.contract.price)+" Kaltmiete pro Monat · nächste Abrechnung in "+dur(Math.max(1,h.contract.next-S.time))+".<br>Netto erhalten: "+money(h.contract.earned):"Einmaliger Kaufpreis: "+money(h.contract.price)+". Eigentum der Bewohner."}</p></div>`;
    return s;
  }
  function open(id){if(!farmOn())return;VILLAGE.tick();if(id&&!VILLAGE.plot(id))id=null;FV.sheetFn=()=>open(id);
    document.querySelectorAll("#farmSheetIn [data-town-fold]").forEach(d=>folds.set(d.dataset.townFold,d.open));
    const T=VILLAGE.state(),content=id?detail(id):overview();openFarmSheet(`<div class="fs-h"><span class="fs-ic">🏘️</span>${esc(T.name)}<small>Nachbarschaft & Stadtbau</small></div><div class="town-content">${content}</div>`,"town");
    const q=s=>document.querySelectorAll("#farmSheetIn "+s),act=fn=>{const ok=fn();if(!ok)toast("Diese Aktion ist gerade nicht möglich. Prüfe Voraussetzungen und Budget.","warn");open(id);};
    q("[data-town-fold]").forEach(d=>{if(folds.has(d.dataset.townFold))d.open=folds.get(d.dataset.townFold);});
    q("[data-town-home]").forEach(b=>b.onclick=()=>open(b.dataset.townHome||null));
    q("[data-town-focus]").forEach(b=>b.onclick=()=>VILLAGE_VIEW.focus(b.dataset.townFocus));
    q("[data-town-expand]").forEach(b=>b.onclick=()=>act(()=>VILLAGE.expand()));q("[data-town-buy]").forEach(b=>b.onclick=()=>act(()=>VILLAGE.buy(id)));
    q("[data-town-build]").forEach(b=>b.onclick=()=>{const [k,m]=b.dataset.townBuild.split("|");act(()=>VILLAGE.build(id,k,m==="own"));});
    q("[data-town-list]").forEach(b=>b.onclick=()=>act(()=>VILLAGE.list(id,b.dataset.townList)));
    q("[data-town-relist]").forEach(b=>b.onclick=()=>act(()=>VILLAGE.relist(id)));
    q("[data-town-negotiate]").forEach(f=>{
      f.oninput=()=>f.dataset.dirty="1";
      f.elements.kind.onchange=()=>{const k=D.houses[VILLAGE.home(id).type];f.elements.price.value=f.elements.kind.value==="rent"?k.rent:k.sale;};
      f.onsubmit=e=>{e.preventDefault();VILLAGE.negotiate(id,f.dataset.townNegotiate,f.elements.kind.value,+f.elements.price.value);open(id);};
    });
    q("[data-town-sign]").forEach(b=>b.onclick=()=>act(()=>VILLAGE.sign(id,b.dataset.townSign)));
    q("[data-town-orders]").forEach(b=>b.onclick=()=>openFarmOrders(null,"hof"));
    FV.sheetTick=()=>{const active=document.activeElement;if((active&&active.closest(".town-negotiate"))||document.querySelector('.town-negotiate[data-dirty="1"]'))return;
      VILLAGE.tick();if((id?detail(id):overview())===content)return;
      const box=document.querySelector("#farmSheetIn"),top=box.scrollTop;open(id);box.scrollTop=top;};
  }
  return {open};
})();
