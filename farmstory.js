/* v349: Bekannte statt austauschbarer Kaufkarten. Geschichten sind optional,
   Arbeitsbeginn bleibt eine ausdrückliche, geprüfte Vereinbarung. */
const FARM_STORY = (() => {
  const people = {
    farmer:{name:'Erwin Krüger',role:'Landwirt · Nachbarssohn',via:'Direkt von nebenan',look:144,trait:'kennt Opas Felder',perk:14,
      arrival:'Erwin ist der Sohn von Nachbar Heinrich Krüger, dem das alte Sägewerk gehört. Er hat schon mit Opa die Obsternte eingebracht. Nach seiner landwirtschaftlichen Ausbildung ist er zurück an der Havel. Beim ersten Rundgang hilft er dir als Nachbar; später möchte er regelmäßig mit dir arbeiten.',
      why:'„Auf diesen Feldern habe ich angefangen. Ich möchte, dass hier wieder etwas wächst — und dir zeigen, wie du deinen eigenen Rhythmus findest.“',
      tip:'Ernte reife Felder, säe direkt nach und gieße die frische Saat. Lass etwas Getreide für Futter und Mehl im Lager.',welcome:'Wir fangen bei dem an, was gerade reif ist.'},
    pfleger:{name:'Marta Feldmann',role:'Tierpflegerin · Nachbarin',via:'Erwins Empfehlung am Hühnerstall',look:86,trait:'kennt jedes Tier',perk:14,
      arrival:'Marta versorgt die Tiere auf dem Nachbarhof. Erwin bittet sie, mit dir nach Opas Hühnern zu sehen. Sie möchte wieder näher an Zuhause arbeiten und sich Zeit für feste Futterrunden nehmen.',
      why:'„Ein voller Stall ist noch kein guter Stall. Wir schauen gemeinsam auf Futter, Platz und die Tiere selbst.“',
      tip:'Nach dem Einsammeln brauchen die Tiere wieder Futter. Freie Stallfläche und regelmäßige Versorgung verbessern die Produkte.',welcome:'Ich mache erst eine ruhige Runde durch die Ställe. Du zeigst mir, wo das Futter liegt.'},
    hofmeister:{name:'Bente Krüger',role:'Hofmeisterin · Erwins Tante',via:'Ein Besuch in der Backstube',look:302,trait:'denkt in Vorräten',perk:14,
      arrival:'Bente hat für Opas Erntehelfer Brot gebacken. Als Erwin von deinem ersten eigenen Brot erzählt, schaut sie in der Backstube vorbei. Sie sucht einen festen Platz für ihr Handwerk, ohne den Kontakt zu den Kunden zu verlieren.',
      why:'„Wenn Mühle und Ofen zusammenpassen, bleibt die Küche nicht kalt. Ich halte die Verarbeitung im Takt — du entscheidest, was wir anbieten.“',
      tip:'Plane Mehl vor Brot ein und sammle fertige Produkte ein, damit Produktionsplätze frei bleiben. Reserviere Zutaten für offene Bestellungen.',welcome:'Wir schreiben zuerst auf, was gebraucht wird. Dann bekommt jede Maschine ihren sinnvollen nächsten Auftrag.'},
    fahrer:{name:'Tom Albrecht',role:'Fahrer · aus dem Dorf',via:'Eine Begegnung an der Liefertafel',look:216,trait:'kennt die Haustüren',perk:14,
      arrival:'Tom hat früher Pakete in der Gegend ausgefahren. An deiner Liefertafel entdeckt er bekannte Adressen. Er möchte wieder feste Kunden statt ständig wechselnder Touren betreuen und schlägt dir eine Zusammenarbeit vor.',
      why:'„Bei Köhlers geht die Klingel schlecht, bei Familie Berger sitzt abends jemand im Garten. Eine Lieferung endet für mich erst beim richtigen Menschen.“',
      tip:'Stelle erst die bestellten Waren bereit. Kleine Lieferungen passen aufs Rad; für größere Mengen brauchst du das passende Fahrzeug.',welcome:'Ich übernehme die fertigen Hofbestellungen. Neue Zusagen bleiben deine Entscheidung.'},
    holzfaeller:{name:'Hannes Brandt',role:'Holzfäller · Freund des Försters',via:'Die gemeinsame Waldbegehung',look:392,trait:'arbeitet mit Augenmaß',perk:14,
      arrival:'Bei der Waldbegehung empfiehlt der Förster Hannes, der schon lange die örtlichen Bestände kennt. Hannes möchte einen festen Betrieb unterstützen, der Holz nutzt und gleichzeitig an den nächsten Bestand denkt.',
      why:'„Ich kenne den Wald seit meiner Lehre. Wir holen heraus, was wir brauchen, und lassen ihm eine Zukunft.“',
      tip:'Erst die freigegebene Fläche betreten und ausgewachsene Bäume wählen. Räume das Holz weg, bevor du weitere Stämme fällst.',welcome:'Wir sehen uns zuerst Bestand und freie Lagerplätze an. Die Axt kommt danach.'},
    saeger:{name:'Ralf Henning',role:'Sägewerker · aus Opas Sägewerk',via:'Hannes stellt den früheren Kollegen vor',look:188,trait:'kennt jede Maserung',perk:14,
      arrival:'Ralf hat an Opas Säge schon Bretter zugeschnitten. Hannes bringt ihn beim Aufbau der Holzverarbeitung mit. Nach Jahren auf Montage möchte er wieder dauerhaft in seiner Heimat arbeiten.',
      why:'„An dieser Säge kenne ich jedes Geräusch. Mit guten Stämmen und klaren Aufträgen machen wir hier wieder brauchbares Material.“',
      tip:'Lass Platz für fertige Holzprodukte. Ein voller Holzplatz bremst die Verarbeitung, auch wenn noch Stämme vorhanden sind.',welcome:'Ich prüfe die Säge und die Warteschlangen. Danach richten wir die Arbeit am tatsächlichen Bedarf aus.'},
    mechaniker:{name:'Aylin Demir',role:'Mechanikerin · aus der Dorfwerkstatt',via:'Ralf bittet um einen Werkstattbesuch',look:230,trait:'repariert statt wegzuwerfen',perk:14,
      arrival:'Ralf kennt Aylin aus der Dorfwerkstatt und bittet sie, die alten Maschinen mit dir durchzugehen. Sie sucht einen Betrieb, in dem Wartung zählt und Reparaturen nicht erst nach dem Stillstand beginnen.',
      why:'„Opa hat vieles gut gepflegt. Wenn wir rechtzeitig nachsehen, halten diese Maschinen noch eine ganze Weile.“',
      tip:'Achte auf Reparaturen, Energie und Brennstoff, bevor du lange Warteschlangen planst. Sonnenstrom und Nachtbetrieb ergänzen sich.',welcome:'Zeig mir zuerst die Maschinen, die täglich laufen. Wir fangen bei den wichtigsten an.'},
    fischer:{name:'Willi Schmied',role:'Angler · Linas Bekannter',via:'Lina vermittelt den Kontakt am See',look:104,trait:'liest Wasser und Wetter',perk:14,
      arrival:'Lina kennt Willi von Lieferungen an die Hafenleute. Als deine Fischerei bereit ist, vermittelt sie euch den Kontakt. Willi verbringt seit Jahrzehnten seine Morgen am See und möchte seinen Fang wieder direkt vor Ort abgeben.',
      why:'„Lina sagt, bei dir landet guter Fisch nicht irgendwo. Wenn wir zusammenarbeiten, geht er frisch vom Wasser zu deinen Kunden.“',
      tip:'Bereite Köder und freie Kühlplätze vor. Leere Reusen regelmäßig; ohne Köder beginnt kein neuer Fang.',welcome:'Lass uns am Steg anfangen. Erst schauen wir aufs Wasser, dann auf Köder und Kühlkiste.'},
    fischwirt:{name:'Nele Peters',role:'Fischwirtin · Willis Empfehlung',via:'Ein Kennenlernen am Fischmarkt',look:54,trait:'hält die Kühlkette',perk:14,
      arrival:'Willi bringt Nele zum Fischmarkt mit. Sie hat in einem kleinen Fischbetrieb gelernt und möchte die Verarbeitung wieder vom Fang bis zur Abgabe begleiten. Dein kurzer Weg vom See zum Verkauf passt zu ihrem Plan.',
      why:'„Ich möchte wissen, wo der Fisch herkommt — und wer ihn später isst. Hier können wir beides zusammenhalten.“',
      tip:'Sorge für freie Kühlplätze und hole fertige Ware aus den Häusern. Filetieren und Räuchern lohnen sich, wenn genug Lagerplatz bleibt.',welcome:'Wir schauen zuerst auf Kühlung und fertige Ware. Frische hat Vorrang vor einer langen Warteschlange.'}
  };
  function state(){if(!S.farm)return null;const F=S.farm,T=F.people349||(F.people349={});T.met=T.met||{};T.agreed=T.agreed||{};T.introduced=T.introduced||{};return T;}
  function profile(role){return people[role]||null;}
  function meet(role){const p=profile(role),T=state();if(!p||!T)return;T.met[role]=T.met[role]||{at:S.time};}
  function candidate(role){const p=profile(role),R=FSTAFF_ROLES[role];return {id:'friend349:'+role,role,name:p.name,look:p.look,perk:p.perk,trait:p.trait,wage:Math.round((R.wage[0]+R.wage[1])/2),story349:role};}
  function speaker(role){const p=profile(role);return {name:p.name,role:p.role,face:portrait(role)};}
  function portrait(role){return `<svg viewBox="0 0 60 60" aria-hidden="true"><rect width="60" height="60" rx="30" fill="#dce9dc"/><path d="M10 60V47Q12 36 30 36T50 47V60" fill="${role==='farmer'?'#4c7446':'#426b83'}"/><circle cx="30" cy="24" r="13" fill="#e6b995"/><path d="M17 22Q15 8 30 9Q45 9 43 22" fill="#79533a"/><path d="M13 17H47L42 13H19Z" fill="${role==='farmer'?'#c5a45b':'#52748b'}"/><circle cx="25" cy="24" r="1.1" fill="#233342"/><circle cx="35" cy="24" r="1.1" fill="#233342"/><path d="M26 30Q30 33 34 30" fill="none" stroke="#825142" stroke-width="1.4" stroke-linecap="round"/></svg>`;}
  function hint(role,key,text){const p=speaker(role);if(typeof linaHint==='function')linaHint(key,text,{speaker:p});}
  function announce(){const T=state();if(!T||!S.farm.tut||!S.farm.tut.done||S.time<(T.nextIntroAt||0))return;
    for(const role of Object.keys(people))if(staffRoleOpen(role)&&!staffHas(role)&&!T.introduced[role]){
      T.introduced[role]=1;T.nextIntroAt=S.time+180;const p=profile(role);
      if(typeof phoneMsg==='function')phoneMsg({from:role==='fischer'?'Lina Sturm':p.name,kind:'info',title:'Eine Bekanntschaft: '+p.name,body:p.arrival+' Im Bauernhaus unter „Team“ könnt ihr euch kennenlernen. Ein Gespräch verpflichtet dich zu nichts.'});
      break; /* Nachholende Spielstände erhalten keine neun Meldungen auf einmal. */
    }
  }
  function open(role,back){const p=profile(role);if(!p)return;meet(role);save();
    const existing=(S.farm.staff||[]).find(s=>s.role===role),person=existing||candidate(role),can=staffRoleOpen(role)&&!existing;
    const fee=person.wage*2;let page=0;
    function render(){
      const me=existing?existing.name:p.name;
      const legacy=existing&&!existing.story349;const body=page===0?(legacy?'„Wir kennen uns inzwischen von der täglichen Arbeit auf deinem Hof. Lass uns besprechen, was gerade gebraucht wird und wie wir die nächsten Schritte angehen.“':p.arrival):page===1?(legacy?'„Ich kenne unseren Hof inzwischen gut. Wir sprechen miteinander ab, welche Arbeiten gerade Vorrang haben — du behältst die Entscheidungen in der Hand.“':p.why):p.tip;
      openFarmSheet(`<div class="fs-h">${esc(me)}<small>${esc(legacy?FSTAFF_ROLES[role].n:p.role)}</small></div><div class="fst-story"><div class="fst-story-face">${typeof staffIc==='function'?staffIc(person):portrait(role)}</div><p class="fst-story-via">${esc(legacy?'Im Hofteam':p.via)}</p><h3>${[existing?'Unsere gemeinsame Arbeit':'Wie ihr euch kennenlernt','Warum wir zusammenarbeiten','Mein Tipp für deinen Hof'][page]}</h3><p>${esc(body)}</p>
        ${page===2?`<div class="fst-terms"><b>${existing?'Eure Zusammenarbeit':'Wenn du Unterstützung möchtest'}</b><span>${eur(person.wage)} Lohn pro Spieltag + Brotzeit</span>${!existing?`<span>Einmalig ${eur(fee)} Startprämie · +${person.perk} % ${esc(person.trait)}</span>`:''}<small>${existing?'Euer vereinbarter Lohn gilt weiter.':can?'Erst mit deiner Zusage beginnt die Arbeit.':FSTAFF_ROLES[role].g==='see'?'Regelmäßige Arbeit ab Level 19 und geöffnetem Seeufer.':'Regelmäßige Arbeit erst, wenn die Station freigeschaltet ist.'}</small></div>`:''}</div>
        <div class="fst-story-actions">${page?'<button class="btn ghost" id="fstBack">Zurück</button>':''}<button class="btn ghost" id="fstLater">${existing?'Schließen':'Später'}</button>${page<2?'<button class="btn" id="fstNext">Weiter</button>':can?`<button class="btn" id="fstAgree" ${S.money<fee?'disabled':''}>Zusammenarbeit vereinbaren<small>${eur(fee)} einmalig</small></button>`:''}</div>`, 'story');
      $('#fstLater').onclick=()=>{if(back)back();else closeFarmSheet();};const b=$('#fstBack');if(b)b.onclick=()=>{page--;render();};const n=$('#fstNext');if(n)n.onclick=()=>{page++;render();};const a=$('#fstAgree');if(a)a.onclick=()=>{
        staffCands();if(!staffHire(candidate(role).id)){sfx('bad');return;}state().agreed[role]=S.time;save();farmSyncScene();sfx('build');
        openFarmSheet(`<div class="fs-h">Willkommen im Hofteam<small>${esc(me)}</small></div><div class="fst-story"><div class="fst-story-face">${typeof staffIc==='function'?staffIc(person):portrait(role)}</div><p>„${esc(p.welcome)}“</p><p>${esc(p.tip)}</p></div><button class="btn fgo" id="fstWelcome">Zum Team</button>`,'story');if(typeof thumbFill==='function')thumbFill();$('#fstWelcome').onclick=()=>{if(back)back();else closeFarmSheet();};
      };
    }render();
  }
  return {people,profile,candidate,state,meet,speaker,portrait,hint,announce,open};
})();
