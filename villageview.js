/* v340: Die Wohnsiedlung verwendet dieselbe Hausarchitektur wie die Hütte
   am See. Bewohner tragen Alltagskleidung und haben gegliederte Gehbewegungen. */
const VILLAGE_VIEW = (() => {
  const D=VILLAGE_DATA,W={R:null,homes:new Map(),actors:new Map(),road:null,extension:null},DAY=1440;
  const add=(mesh,o)=>{const n=fnode(mesh,o);W.R.nodes.push(n);return n;};
  function roadMesh(extension){
    const b=new FM.MB(),asphalt=0x656d78,kerb=0xc9c7bb;
    const street=(a,c)=>{const x=(a[0]+c[0])/2,z=(a[1]+c[1])/2,vertical=a[0]===c[0],length=Math.hypot(c[0]-a[0],c[1]-a[1]);
      b.plate(vertical?3:length,vertical?length:3,asphalt,{x,z,y0:.045});
      [-1,1].forEach(s=>b.plate(vertical?.72:length,vertical?length:.72,kerb,{x:x+(vertical?s*1.88:0),z:z+(vertical?0:s*1.88),y0:.065}));};
    if(!extension){street([-62,20],[-62,64]);b.plate(3,3,asphalt,{x:-62,z:19.5,y0:.047});
      for(let x=-63.1;x<-60.8;x+=.6)b.plate(.3,.7,0xf0ebd9,{x,z:21.8,y0:.071});
      b.box(.07,1.1,.07,0x64717a,{x:-64.8,z:23.2});b.box(.65,.65,.06,0xf0f0e7,{x:-64.8,z:23.2,y:.8});
      b.box(.45,.36,.065,0x466e85,{x:-64.8,z:23.24,y:.94});
    }else{street([-62,64],[-62,98]);street([-98,22],[-98,98]);[22,64,98].forEach(z=>street([-116,z],[-62,z]));
      [-62,-98].forEach(x=>[22,64,98].forEach(z=>b.plate(4.6,4.6,asphalt,{x,z,y0:.073})));}
    return b;
  }
  function garden(p){
    const b=new FM.MB(),rnd=erbeRng(Number(p.id)+31);
    b.plate(13,10.4,[0x86b85b,0x90ba66,0x80ac58][Number(p.id)%3],{y0:.032});
    const step=VILLAGE.door(p),xx=step[0]-p.x,zz=step[1]-p.z,curb=p.road+p.side*2.35-p.x;
    b.plate(Math.abs(xx-curb)+.4,.8,0xc9c1aa,{x:(xx+curb)/2,z:zz,y0:.06});
    /* Niedrige Hecken hinter dem Haus; der Zugang zur Straße bleibt offen. */
    [-1,1].forEach(s=>b.box(11.8,.38,.25,0x477b3d,{x:-p.side*.3,y:.04,z:s*5.04}));
    b.box(.25,.38,10,0x477b3d,{x:p.side*6.2,y:.04});
    for(let i=0;i<5;i++){const x=p.side*(4.8+rnd()*.6),z=-3.8+i*.5;b.ico(.14,0x45823a,{x,y:.18,z});b.ico(.07,[0xe4ae5a,0xc86c95,0x8da8ce][i%3],{x,y:.3,z});}
    b.box(.42,.32,.34,0x526a6d,{x:curb+p.side*.3,z:1,y:.7});b.box(.06,.7,.06,0x5d4f3d,{x:curb+p.side*.3,z:1});
    return b;
  }
  function buildingMesh(){
    const b=new FM.MB();b.plate(5.2,5.2,0xb5ada0,{y0:.05});
    [-2,2].forEach(x=>[-2,2].forEach(z=>b.box(.13,2.2,.13,0xc69a66,{x,z})));
    [1.1,2.1].forEach(y=>{b.box(4.2,.12,.12,0xc69a66,{y,z:-2});b.box(4.2,.12,.12,0xc69a66,{y,z:2});});
    b.box(2.0,.35,.7,0xd2b488,{x:3.1,z:1});b.box(.6,.6,.6,0xa98765,{x:3.1,z:-1});return b;
  }
  function markerMesh(){const b=new FM.MB();[-6,6].forEach(x=>[-4.9,4.9].forEach(z=>{b.box(.08,.5,.08,0x987454,{x,z});b.box(.13,.1,.13,0xe9dfb9,{x,z,y:.4});}));return b;}
  function attach(R){
    W.R=R;W.homes.clear();W.actors.clear();
    W.road=add(fmesh("village-road340",()=>roadMesh(false)),{shadow:false});
    W.extension=add(fmesh("village-grid340",()=>roadMesh(true)),{shadow:false,visible:VILLAGE.state().expanded});
    sync();
  }
  function actor(p,r){
    const old=W.actors.get(p.id);if(old&&old.id===r.id)return old;
    if(old){const i=W.R.nodes.indexOf(old.node);if(i>=0)W.R.nodes.splice(i,1);}
    const L=r.look,full=FWM.person(L);let top=0;for(let i=1;i<full.v.length;i+=9)top=Math.max(top,full.v[i]);
    const scale=(.88+(r.seed%4)*.015)/top;
    const n=add(fmesh("village-body:"+r.id,()=>FWM.person({...L,noLegs:true,noArms:true})),{x:p.x,z:p.z,s:scale,visible:false});
    const legs=[-1,1].map(s=>W.R.addChild(n,fnode(fmesh("village-leg:"+L.pants+":"+L.boots,()=>{const b=new FM.MB();b.box(.09,.42,.11,L.pants,{y:-.42});b.box(.1,.05,.16,L.boots||0x4b4946,{y:-.42,z:.025});return b;}),{x:s*.07,y:.42})));
    const arms=[-1,1].map(s=>W.R.addChild(n,fnode(fmesh("village-arm:"+L.shirt+":"+L.skin,()=>FWM.arm(L)),{x:s*(L.fem?.17:.19),y:.78})));
    const a={id:r.id,node:n,legs,arms,scale};W.actors.set(p.id,a);return a;
  }
  function sync(){
    if(!W.R||!farmOn())return;const T=VILLAGE.state();W.extension.visible=T.expanded;
    for(const p of D.plots){const h=T.homes[p.id];let e=W.homes.get(p.id);
      if(!e){
        e={garden:add(fmesh("village-garden:"+p.id,()=>garden(p)),{x:p.x,z:p.z,visible:false,shadow:false}),marker:add(fmesh("village-markers340",markerMesh),{x:p.x,z:p.z,visible:false}),site:add(fmesh("village-site340",buildingMesh),{x:p.x,z:p.z,visible:false}),house:null,lit:null,type:null};W.homes.set(p.id,e);}
      const blocked=!!VILLAGE.obstruction(p),built=!!h.resident||h.status==="ready";
      e.marker.visible=!p.starter&&T.expanded&&!built;
      e.site.visible=h.status==="building"&&!blocked;
      e.garden.visible=built&&!blocked;
      if((built||h.status==="building")&&e.type!==h.type){
        for(const n of [e.house,e.lit])if(n){const i=W.R.nodes.indexOf(n);if(i>=0)W.R.nodes.splice(i,1);}
        const k=D.houses[h.type],style=Number(p.id)%3;
        e.garden.mesh=fmesh("village-garden:"+p.id+":"+h.type,()=>garden(p));
        e.house=add(fmesh("village-house:"+style,()=>RENT.homeMesh(style)),{x:p.x,z:p.z,ry:p.ry,s:k.scale,visible:built&&!blocked});
        e.lit=add(fmesh("village-light340",()=>RENT.homeLights()),{x:p.x,z:p.z,ry:p.ry,s:k.scale,visible:false,shadow:false,glow:.55});e.type=h.type;
      }
      if(e.house){e.house.visible=built&&!blocked;if(built)e.house.sy=D.houses[h.type].scale;}
      if(h.resident)actor(p,h.resident);else if(W.actors.has(p.id))W.actors.get(p.id).node.visible=false;
    }
  }
  function walkPoint(points,part){const ds=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));let n=ds.reduce((a,b)=>a+b,0)*part;
    for(let i=0;i<ds.length;i++){if(n<=ds[i]||i===ds.length-1){const f=ds[i]?n/ds[i]:0;return {x:points[i][0]+(points[i+1][0]-points[i][0])*f,z:points[i][1]+(points[i+1][1]-points[i][1])*f,ry:Math.atan2(points[i+1][0]-points[i][0],points[i+1][1]-points[i][1])};}n-=ds[i];}return {x:points[0][0],z:points[0][1],ry:0};}
  function step(dt,time){
    if(!W.R||!farmOn())return;const T=VILLAGE.state(),m=S.time%DAY;
    for(const p of D.plots){const h=T.homes[p.id],e=W.homes.get(p.id);if(!e)continue;
      if(e.lit)e.lit.visible=!!h.resident&&e.house.visible&&((m>=360&&m<450)||(m>=1080&&m<1350));
      if(h.status==="building"&&e.house){const f=1-(h.ready-S.time)/(D.houses[h.type].days*DAY);e.house.visible=f>.7&&!VILLAGE.obstruction(p);e.house.sy=D.houses[h.type].scale*Math.max(.08,(f-.7)/.3);}
      const a=W.actors.get(p.id);if(!a||!h.resident)continue;
      const r=h.resident,atHome=m>=360&&m<1320&&(r.job.includes("Ruhestand")||r.job==="Selbstständig"||m<510||m>=990),blocked=!!VILLAGE.obstruction(p);
      a.node.visible=atHome&&!blocked;if(!a.node.visible)continue;
      const front=VILLAGE.door(p),sx=p.road+p.side*2.5,clock=(S.time+r.seed*11)%110;
      const moving=clock>38&&clock<92,part=Math.max(0,Math.min(1,(clock-38)/54));
      const pts=[front,[sx,p.z],[sx,Math.max(24,p.z-5)],[sx,p.z],front],q=moving?walkPoint(pts,part):{x:front[0],z:front[1],ry:p.ry};
      a.node.x=q.x;a.node.z=q.z;a.node.y=.04+(moving?Math.abs(Math.sin(time*8))*.018:0);a.node.ry=q.ry;
      const wave=moving?Math.sin(time*8+r.seed)*.45:0;a.legs.forEach((n,i)=>n.rx=(i?1:-1)*wave);a.arms.forEach((n,i)=>n.rx=(i?-1:1)*wave*.7);
      if(e.lit&&e.lit.visible&&Math.random()<dt*.2){const k=D.houses[h.type],c=VILLAGE.local(p,-2.95*k.scale,-.2*k.scale);W.R.emit({x:c[0],y:7*k.scale,z:c[1],vx:.08,vy:.35,vz:.05,life:2,size:.18,size2:.5,col:[.72,.72,.7,.2],drag:.8});}
    }
  }
  function pick(x,y){if(!W.R)return null;const ray=W.R.ray(x,y);let best=null;
    for(const p of D.plots){const h=VILLAGE.home(p.id),e=W.homes.get(p.id);if(!e||(!e.garden.visible&&!e.marker.visible&&!e.site.visible))continue;
      const d=W.R.hitBox(ray,[p.x-4.6,0,p.z-3.2],[p.x+4.6,h.resident||h.status==="ready"?6.5:2.3,p.z+3.2]);
      if(d!=null&&(!best||d<best.d))best={d,id:p.id};}return best;}
  function tags(){if(!W.R||!farmOn())return [];const T=VILLAGE.state(),out=[{id:"town",x:-62,y:2,z:24,html:"🏘️ "+esc(T.name),open:()=>VILLAGE_UI.open()}];
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
