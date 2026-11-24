/* v340: Nachbarschaft, Empfehlungen, Grundstücke und Wohnverträge.
   Alles liegt im Hofspielstand; bestehende Häuser am See bleiben eigenständig. */
const VILLAGE = (() => {
  const D=VILLAGE_DATA, DAY=1440, WEEK=7*DAY;
  const plot=id=>D.plots.find(p=>p.id===id);
  function state() {
    if(!farmOn())return null;
    const F=S.farm,T=F.village||(F.village={v:340,name:"Seeblick",born:S.time,expanded:false,deliveries:0,referrals:[],seq:1,earned:0,homes:{}});
    for(const p of D.plots)if(!T.homes[p.id])T.homes[p.id]=p.starter
      ? {status:"resident",type:"holz",resident:JSON.parse(JSON.stringify(D.neighbors[p.resident])),deliveries:0}
      : {status:"vacant",deliveries:0};
    return T;
  }
  const home=id=>{const T=state();return T&&T.homes[id];};
  function geo(x,z){return [FARM_PT[0]-z*2/111320,FARM_PT[1]+x*2/(111320*Math.cos(FARM_PT[0]*Math.PI/180))];}
  function local(p,x,z){return [p.x+x*Math.cos(p.ry)+z*Math.sin(p.ry),p.z-x*Math.sin(p.ry)+z*Math.cos(p.ry)];}
  function door(p){const h=home(p.id),k=D.houses[h&&h.type]||D.houses.holz;return local(p,.5*k.scale,5.5*k.scale);} /* v344: einschließlich Körperradius vor den Stufen. */
  function address(p){const q=geo(...door(p));return {lat:q[0],lon:q[1],t:p.street+" "+p.number,a:state().name};}
  function clear(x,z){const r=D.rect;return x>r[0]&&x<r[2]&&z>r[1]&&z<r[3];}
  function overlaps(x,z,w,d){const r=D.rect;return x<r[2]&&x+w>r[0]&&z<r[3]&&z+d>r[1];}
  /* Ein freier Ortsbereich im gesperrten Seegebiet; das Ufer bleibt gesperrt. */
  function clipLock(r){
    const q=D.rect,x0=Math.max(r[0],q[0]),z0=Math.max(r[1],q[1]),x1=Math.min(r[2],q[2]),z1=Math.min(r[3],q[3]);
    if(x0>=x1||z0>=z1)return [r];
    return [[r[0],r[1],x0,r[3]],[x1,r[1],r[2],r[3]],[x0,r[1],x1,z0],[x0,z1,x1,r[3]]].filter(a=>a[2]>a[0]&&a[3]>a[1]);
  }
  function obstruction(p){
    const r=typeof VILLAGE_SITE!=="undefined"?VILLAGE_SITE.lot(p):[p.x-6.5,p.z-5.3,p.x+6.5,p.z+5.3];
    return S.farm.objs.find(o=>{const s=farmSize(o),x=o.x-FG/2,z=o.z-FG/2;return x<r[2]&&x+s[0]>r[0]&&z<r[3]&&z+s[1]>r[1];});
  }
  function residents(){const T=state();return T?D.plots.filter(p=>T.homes[p.id].resident).map(p=>({p,h:T.homes[p.id],r:T.homes[p.id].resident})):[];}
  function changed(){save();renderDirty=true;if(typeof VILLAGE_VIEW!=="undefined")VILLAGE_VIEW.sync();}
  function pay(label,n){S.money-=n;S.expense+=n;logMoney("farm",state().name+" · "+label,-n);}
  function canExpand(){const T=state();return T&&!T.expanded&&flv()>=8&&(T.deliveries>=6||(S.farm.stats.deliv||0)>=6);}
  function expand(){if(!canExpand()||S.money<D.extension)return false;pay("Straßen und Versorgungsleitungen",D.extension);state().expanded=true;changed();return true;}
  function buy(id){const T=state(),h=home(id),p=plot(id);if(!T||!p||!T.expanded||!h||h.status!=="vacant"||S.money<D.land||obstruction(p))return false;
    pay("Grundstück "+p.street+" "+p.number,D.land);h.status="land";h.invested=D.land;changed();return true;}
  function build(id,type,materials){
    const h=home(id),p=plot(id),k=D.houses[type],cost=k&&(materials?k.cost:k.turnkey);
    if(!h||!p||!k||h.status!=="land"||S.money<cost||obstruction(p)||(materials&&!farmHasAll(k.need)))return false;
    if(materials)for(const [item,n]of Object.entries(k.need))farmTake(item,n);
    pay("Bau "+k.n,cost);h.invested+=cost;h.status="building";h.type=type;h.ready=S.time+k.days*DAY;applyCampaign(h);changed();return true;
  }
  /* v365: Eine zentrale Anzeige erreicht Interessenten für passende Häuser,
     auch im Bau. Konditionen sind vormerkbar; Übergabe erst bei Bezugsfertigkeit. */
  function applyCampaign(h){
    const C=state().campaign;if(!C||S.time>=C.expires||h.listing||!['building','ready'].includes(h.status)||!C.types.includes(h.type))return;
    h.listing={channel:C.channel,at:S.time,ready:Math.max(S.time,C.ready),expires:Math.max(S.time+8*DAY,(h.ready||S.time)+8*DAY),offers:null,preference:C.kind};
  }
  function advertise(channel,types,kind){
    const T=state();types=[...new Set(types||[])].filter(k=>D.houses[k]);
    if(!T||T.campaign&&S.time<T.campaign.expires||!types.length||!['any','rent','buy'].includes(kind)||!['referral','online'].includes(channel))return false;
    if(!Object.values(T.homes).some(h=>h.status==='land'||['building','ready'].includes(h.status)&&types.includes(h.type)))return false;
    if(channel==='referral'&&T.deliveries<3&&(S.farm.stats.deliv||0)<3)return false;
    if(channel==='online'){if(S.money<D.ad)return false;pay('Sammelanzeige für Wohnhäuser',D.ad);}
    T.campaign={channel,types,kind,at:S.time,ready:S.time+(channel==='online'?8*60:DAY),expires:S.time+14*DAY};
    Object.values(T.homes).forEach(applyCampaign);changed();return true;
  }
  function stopAdvert(){const T=state();if(!T||!T.campaign)return false;delete T.campaign;changed();return true;}
  function list(id,channel){
    const h=home(id),T=state();if(!h||!["ready","building"].includes(h.status)||h.listing||!["referral","online"].includes(channel))return false;
    if(channel==="referral"&&T.deliveries<3&&(S.farm.stats.deliv||0)<3)return false;
    if(channel==="online"){if(S.money<D.ad)return false;pay("Onlineanzeige",D.ad);}
    h.listing={channel,at:S.time,ready:S.time+(channel==="online"?8*60:DAY),expires:Math.max(S.time+8*DAY,(h.ready||S.time)+8*DAY),offers:null};changed();return true;
  }
  function relist(id){const h=home(id),L=h&&h.listing;if(!h||!["ready","building"].includes(h.status)||!L||!L.offers||!L.offers.every(c=>c.declined)||L.extra>0)return false;
    h.lastApplicants=L.offers.map(c=>c.n);delete h.listing;changed();return true;}
  /* v478: Bewertung wie vor dem Versetzen (Siedlung −10, Bezugspunkt ebenfalls). */
  /* v433: Nachfrage je Grundstück – Seeblick (nah am See) und ruhige Lage (wenige Nachbarn) ziehen mehr Interessenten an. */
  function demand(id){
    const T=state(),p=plot(id),h=T.homes[id],e=Math.hypot((p.x-4)/36,(p.z-48)/22),see=Math.max(0,Math.min(1,1-(e-1.8)/1.6));
    const nb=D.plots.filter(q=>q.id!==id&&Math.hypot(q.x-p.x,q.z-p.z)<=24&&T.homes[q.id].resident).length,quiet=nb<=1?1:nb===2?.4:0;
    return {see,nb,quiet,score:.5+4.5*see+1.2*quiet+(h.type==="familie"?.3:0)+(h.listing&&h.listing.channel==="online"?.3:0)};
  }
  /* Anzahl der Interessenten der ersten Welle: gar keine, eine oder viele – je nach Lage und Zufall */
  function offerCount(id,R,wave){const dm=demand(id).score;return Math.max(0,Math.min(6,Math.floor(dm*(wave?.45:.3+1.4*R())*(wave?R():1))));}
  function offers(id,count,more){
    const T=state(),h=home(id),k=D.houses[h.type],R=erbeRng(T.seq++*937+Number(id)*137+Math.floor(S.time)),dm=demand(id);
    if(count==null)count=offerCount(id,R,false);
    const first=["Marie","David","Emilia","Jonas","Amira","Lars","Sofia","Alexander","Clara","Daniel","Tobias","Leyla","Finn","Hannah","Murat","Greta"],last=["Weber","Krüger","Peters","Fischer","Becker","Lorenz","Sommer","Hahn","Winter","Vogel","Brandt","Kaya","Ziegler","Roth","Lange","Engel"];
    const used=new Set([...(h.lastApplicants||[]),...(more||[]).map(c=>c.n),...residents().map(x=>x.r.n),...Object.values(T.homes).flatMap(x=>x.listing&&x.listing.offers?x.listing.offers.map(c=>c.n):[]) ]);
    return Array.from({length:count},()=>{const seed=T.seq++;let j=Math.floor(R()*first.length),l=Math.floor(R()*last.length),n=first[j]+" "+last[l];
      for(let tries=0;used.has(n)&&tries<300;tries++){j=(j+1)%first.length;if(!j)l=(l+1)%last.length;n=first[j]+" "+last[l];}used.add(n);
      const kind=h.listing.preference&&h.listing.preference!=="any"?h.listing.preference:R()<.3+.25*dm.see?"buy":"rent",
        cur={rent:Math.round(k.rent*(.85+R()*.1)/10)*10,buy:Math.round(k.sale*(.85+R()*.1)/1000)*1000};
      return {id:"I"+seed,n,seed,job:["Angestellt","Fachkraft","Selbstständig","Lehrkraft","Handwerker","Im Ruhestand"][Math.floor(R()*6)],size:1+Math.floor(R()*3),look:{...D.looks[(j%2)+2*(seed%3)],seed},
        kind,cur,price:cur[kind],
        rentBudget:Math.round(k.rent*(1.08+R()*.35+.1*dm.see)/10)*10,buyBudget:Math.round(k.sale*(1.06+R()*.3+.1*dm.see)/1000)*1000,pat:3+Math.floor(R()*2),rounds:0,
        referrer:h.listing.channel==="referral"?residents()[seed%residents().length].r.n:null};});
  }
  /* v433: Verhandlung über mehrere Tage. Jede Anfrage hat ein verdecktes Budget (bis ~40 % über Richtwert) und Geduld.
     Ein Vorschlag wird nach einigen Stunden bis Tagen beantwortet: im Budget → Zusage, sonst Gegenangebot, das sich dem Budget nähert. */
  const unit=kind=>kind==="rent"?10:1000;
  function curOf(c,kind){const k=c.cur||(c.cur={});if(k[kind]==null)k[kind]=kind===c.kind?c.price:Math.round((kind==="rent"?c.rentBudget:c.buyBudget)*.8/unit(kind))*unit(kind);return k[kind];}
  function negotiate(id,offerId,kind,price){
    const h=home(id),L=h&&h.listing,c=L&&L.offers&&L.offers.find(c=>c.id===offerId),k=h&&D.houses[h.type];
    if(!c||!["ready","building"].includes(h.status)||S.time>=L.expires||c.declined||c.pending||!["rent","buy"].includes(kind)||!Number.isFinite(price)||price<=0)return false;
    if(price<(kind==="rent"?k.rent:k.sale)*.6){c.reply="Bitte nennen Sie ein marktübliches Angebot. Prüfen Sie Betrag und Vertragsart.";changed();return false;}
    price=Math.round(price);const cur=curOf(c,kind);
    if(price<=cur){c.reply="Mein Angebot von "+money(cur)+" liegt bereits darüber. Sie können es direkt annehmen.";changed();return false;}
    const R=erbeRng(c.seed*31+(c.rounds||0)*7+Math.floor(price));
    c.pending={kind,price,due:S.time+DAY*(.5+R()*1.2)};delete c.agreed;
    c.reply="Vielen Dank für Ihren Vorschlag. Ich bespreche das und melde mich in den nächsten Tagen.";
    changed();return true;
  }
  function resolve(p,h,c){
    const P=c.pending;if(!P)return;delete c.pending;c.rounds=(c.rounds||0)+1;
    const budget=P.kind==="rent"?c.rentBudget:c.buyBudget,cur=curOf(c,P.kind),R=erbeRng(c.seed*17+c.rounds*13);
    if(P.price<=budget){c.agreed={kind:P.kind,price:P.price};c.kind=P.kind;c.price=P.price;c.cur[P.kind]=P.price;
      c.reply="Vielen Dank, ich bin mit "+money(P.price)+(P.kind==="rent"?" Kaltmiete im Monat":" Kaufpreis")+" einverstanden. Bitte lassen Sie uns den Vertrag abschließen.";return;}
    c.pat=(c.pat==null?4-c.rounds+1:c.pat)-(P.price>budget*1.3?2:1);
    if(c.pat<=0){c.declined=true;c.reply="Vielen Dank für Ihre Zeit. Leider kommen wir preislich nicht zusammen. Ich ziehe meine Anfrage zurück.";return;}
    const u=unit(P.kind),next=Math.min(budget,Math.max(cur+u,Math.round((cur+(budget-cur)*(.3+R()*.3))/u)*u));
    c.cur[P.kind]=next;c.kind=P.kind;c.price=next;
    c.reply="Das übersteigt mein Budget. Ich könnte Ihnen mit "+money(next)+(P.kind==="rent"?" Kaltmiete im Monat":" Kaufpreis")+" entgegenkommen."+(c.pat<=1?" Viel mehr ist für mich nicht drin.":"");
  }
  /* Eigenes Angebot der Interessenten direkt annehmen (Mietanfrage ohne Verhandlung) */
  function accept(id,offerId){
    const h=home(id),L=h&&h.listing,c=L&&L.offers&&L.offers.find(c=>c.id===offerId);
    if(!c||!["ready","building"].includes(h.status)||S.time>=L.expires||c.declined||c.pending||c.agreed)return false;
    c.agreed={kind:c.kind,price:curOf(c,c.kind)};c.reply="Vielen Dank, ich freue mich! Bitte lassen Sie uns den Vertrag abschließen.";changed();return true;
  }
  /* v433: Rückkauf eines verkauften Hauses – frühestens nach einem Tag, 10 % Aufschlag auf den Verkaufspreis, danach 1 % je Tag (höchstens 20 %). */
  function buybackPrice(id){const h=home(id);if(!h||h.status!=="sold"||!h.contract)return 0;return Math.round(h.contract.price*Math.min(1.2,1.1+.01*Math.max(0,(S.time-h.contract.since)/DAY))/1000)*1000;}
  function buyback(id){
    const h=home(id),p=plot(id),pr=buybackPrice(id);
    if(!pr||S.time-h.contract.since<DAY||S.money<pr)return false;
    pay("Rückkauf Haus "+p.street+" "+p.number,pr);
    h.history=(h.history||[]).concat({n:h.resident.n,sold:h.contract.price,back:pr,at:S.time});h.lastApplicants=[h.resident.n];
    delete h.resident;delete h.contract;h.status="ready";changed();return true;
  }
  function sign(id,offerId){
    const h=home(id),L=h&&h.listing,c=L&&L.offers&&L.offers.find(c=>c.id===offerId);
    if(!c||h.status!=="ready"||!c.agreed||c.declined||S.time>=L.expires)return false;
    const a=c.agreed;h.resident={id:c.id,n:c.n,job:c.job,size:c.size,seed:c.seed,look:c.look};
    h.contract={id:"V"+state().seq++,kind:a.kind,price:a.price,since:S.time};
    if(a.kind==="buy"){h.status="sold";S.money+=a.price;S.revenue+=a.price;logMoney("farm","Hausverkauf · "+c.n,a.price);}
    else{h.status="rented";h.contract.next=S.time+WEEK;h.contract.earned=0;}
    delete h.listing;changed();return true;
  }
  function tick(){
    const T=state();if(!T)return;
    if(typeof VILLAGE_PEOPLE!=="undefined")VILLAGE_PEOPLE.tick(); /* v343: Abläufe auch außerhalb der 3D-Ansicht weiterführen. */
    for(const p of D.plots){const h=T.homes[p.id];
      if(h.status==="building"&&S.time>=h.ready){h.status="ready";toast("🏘️ "+p.street+" "+p.number+" ist bezugsfertig. Vorgemerkte Konditionen können jetzt abgeschlossen werden.","ok");renderDirty=true;}
      applyCampaign(h);
      if(h.listing){const L=h.listing;
        if(S.time>=L.expires){h.lastApplicants=(L.offers||[]).map(c=>c.n);delete h.listing;renderDirty=true;}
        else if(!L.offers&&S.time>=L.ready){const R=erbeRng(T.seq++*71+Number(p.id)),n=offerCount(p.id,R,false);L.offers=offers(p.id,n);L.extra=n>0?Math.floor(R()*3):1+Math.floor(R()*2);L.nextWave=S.time+DAY*(1+R()*2);
          if(n)toast("🏡 "+(n===1?"Eine neue Wohnanfrage":"Neue Wohnanfragen ("+n+")")+" für "+p.street+" "+p.number+".","ok",false,"village:"+p.id);renderDirty=true;}
        else if(L.offers){
          if(L.extra>0&&S.time>=L.nextWave&&L.offers.length<6){const R=erbeRng(T.seq++*53+Number(p.id)),n=Math.min(6-L.offers.length,offerCount(p.id,R,true));L.extra--;L.nextWave=S.time+DAY*(1+R()*2);
            if(n>0){L.offers=L.offers.concat(offers(p.id,n,L.offers));toast("🏡 "+(n===1?"Weitere Wohnanfrage":"Weitere Wohnanfragen")+" für "+p.street+" "+p.number+".","ok",false,"village:"+p.id);}renderDirty=true;}
          for(const c of L.offers)if(c.pending&&S.time>=c.pending.due){resolve(p,h,c);toast("💬 "+c.n+" hat auf dein Angebot geantwortet ("+p.street+" "+p.number+").","ok",false,"village:"+p.id);renderDirty=true;}}}
      if(h.status==="rented"&&S.time>=h.contract.next){const C=h.contract,n=1+Math.floor((S.time-C.next)/WEEK),gross=Math.round(C.price*7/30*n),cost=Math.round(gross*.08);
        S.money+=gross-cost;S.revenue+=gross;S.expense+=cost;C.earned+=gross-cost;T.earned+=gross-cost;C.next+=n*WEEK;
        logMoney("farm","Miete · "+p.street+" "+p.number,gross);logMoney("farm","Instandhaltungsrücklage · "+p.street+" "+p.number,-cost);renderDirty=true;}
    }
  }
  function value(){const T=state();return T?Object.values(T.homes).reduce((v,h)=>v+(["land","building","ready","rented"].includes(h.status)?Math.round((h.invested||0)*.85):0),0):0;}
  function route(id){
    const p=plot(id),end=door(p),sx=typeof VILLAGE_SITE!=="undefined"?VILLAGE_SITE.sidewalk:1.335;
    /* v343: Beide Wohnstraßen münden direkt ein; Haustürwege gehen durch das tatsächliche Tor. */
    return [[0,0],[5,0],[5,18.5],[p.road,18.5],[p.road,end[1]],[p.road+p.side*sx,end[1]],end];
  }
  function variants(o,mode){
    if(!o.village||o.village.friend)return null;
    const pts=route(o.village.plot).map(q=>geo(...q)),dist=pathLen(pts);
    return ["b","r"].filter(m=>(!mode||m===mode)&&unlockedModes().includes(m)).map(m=>{
      const ref=refVeh(m,o.cargo,o.weight,dist),leg={mode:m,nodes:[FARM_NODE,"w-seeblick"],from:FARM_NODE,to:"w-seeblick",dist,maxHop:dist,kind:"direkt",pts,localStreet:true,ref:ref&&ref.id};
      return {label:m==="b"?"Fahrrad in der Nachbarschaft":"Direkt im Wohngebiet",key:m,legs:[leg],dist,time:dist/(ref?ref.speed:15)*60,cost:0,ref:chainRef(o,[leg])};
    });
  }
  function repo(v,leg,o){
    if(!v.villageAt||!plot(v.villageAt)||leg.from!==FARM_NODE||!["b","r"].includes(leg.mode))return null;
    const end=geo(...door(plot(v.villageAt)));if(hav(vehPoint(v),end)>.04)return null;
    const pts=route(v.villageAt).map(q=>geo(...q)).reverse();pts.gm=pts.slice(1).map(()=>"v");
    const d=pathLen(pts);return {t:d/vType(v.type).speed*60,d,ok:true,edges:[],pts};
  }
  function orderFor(id,items,extra){
    const T=state(),p=plot(id),h=home(id);if(!T||!p||!h.resident)return null;
    const o=farmOrderObj("w-seeblick",h.resident.n,items,{area:"hof",village:{plot:id,person:h.resident.id},...extra});
    if(!o)return null;o.drop={...address(p),t:h.resident.n+", "+address(p).t};
    const v=variants(o,"b")[0];o.refDist=Math.round(v.dist*100)/100;o.refTime=Math.ceil(v.time+4);o.pay=farmOrderPay(items,v.dist,1.4);
    o.desc="Hallo! Ich wohne im "+p.street+" "+p.number+". Bitte bringen Sie mir "+Object.keys(items).map(k=>fqty(k,items[k])).join(" und ")+" direkt nach Hause. Vielen Dank, "+h.resident.n+".";
    return o;
  }
  function nextOrder(){
    const T=state();if(!T)return null;
    if(T.deliveries>=6&&flv()>=5&&Math.random()>.7)return null;
    const busy=new Set(farmOrders().map(o=>o.shipper)),pool=residents().filter(x=>!busy.has(x.r.n)).sort((a,b)=>(a.h.deliveries||0)-(b.h.deliveries||0));
    const foods=["apfel","brot","ei","tomate","karotte","milch","kaese"].filter(k=>farmCanMake(k)||farmInv(k)>0);
    if(!foods.length)return null;
    if(T.referrals.length&&T.deliveries>=6&&Math.random()<.25){const f=pick(T.referrals.filter(f=>!busy.has(f.n)));
      if(f){const items={[pick(foods)]:1},o=farmOrderObj(f.town,f.n,items,{area:"hof",village:{friend:f.id,referrer:f.referrer}});
        if(o){o.desc="Guten Tag! "+f.referrer+" hat mir Ihren Hof empfohlen. Ich würde gerne "+fqty(Object.keys(items)[0],1)+" bestellen. Freundliche Grüße, "+f.n;return o;}}}
    if(!pool.length)return null;
    const target=pool[0],items={},choices=foods.slice().sort(()=>Math.random()-.5);
    for(const k of choices.slice(0,2)){const n=farmInv(k)>0?Math.min(2,farmInv(k)):1;if(Object.keys(items).reduce((s,id)=>s+FITEMS[id].kg*items[id],0)+FITEMS[k].kg*n<=12)items[k]=n;}
    return Object.keys(items).length?orderFor(target.p.id,items):null;
  }
  function delivered(o){
    const T=state(),v=o.village;if(!T||!v||v.delivered)return;v.delivered=true;T.deliveries++;
    const h=v.plot&&T.homes[v.plot];if(!h)return;h.deliveries=(h.deliveries||0)+1;
    const p=plot(v.plot);
    if(p.starter&&h.deliveries>=2&&!T.referrals.some(f=>f.id===h.resident.id)){
      T.referrals.push({...D.friends[p.resident],id:h.resident.id,referrer:h.resident.n});
      toast("🤝 "+h.resident.n+" empfiehlt Ihren Hof weiter: "+D.friends[p.resident].n+" kennt jetzt Ihr Angebot.","ok");}
  }
  function note(o){if(!o.village)return "";return o.village.friend?"Empfohlen von "+o.village.referrer:"Nachbarschaft · "+address(plot(o.village.plot)).t;}
  return {state,home,plot,geo,local,door,address,clear,overlaps,clipLock,obstruction,residents,expand,canExpand,buy,build,advertise,stopAdvert,list,relist,offers,negotiate,accept,demand,buybackPrice,buyback,sign,tick,value,route,variants,repo,orderFor,nextOrder,delivered,note};
})();
