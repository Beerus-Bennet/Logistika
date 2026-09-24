/* =========================================================================
   LOGISTIKA – Charaktererstellung, Firmengründung und Tutorial
   ========================================================================= */
"use strict";

const COMPANY_COLORS = ["#2f6fed", "#19b8c9", "#20a97a", "#f2a33c", "#e2465f", "#7c5cff"];

/* Klein anfangen: wenig Geld, dafür ein, zwei Fahrzeuge aus der Vorgeschichte. */
const ORIGINS = [
  { id: "kurier", name: "Fahrradkurier", cash: 1000, gifts: ["v-bullitt", "v-bullitt"],
    text: "Du kennst jede Abkürzung zwischen Mitte und Neukölln. Zwei Lastenräder bringst du mit." },
  { id: "roller", name: "Rollerkurier", cash: 1000, gifts: ["v-simson", "v-simson"],
    text: "Jahrelang Pizza und Apothekenfahrten – jetzt auf eigene Rechnung, mit zwei Mopeds." },
  { id: "erbe", name: "Werkstatterbe", cash: 1000, gifts: ["v-caddy"],
    text: "Der Hof deines Onkels gehört jetzt dir – samt Kastenwagen und Ölflecken." }
];
/* Geschenkfahrzeuge als „2× 🚲 Larry vs Harry Bullitt“ */
function giftText(o) {
  const c = {};
  (o.gifts || []).forEach(id => { c[id] = (c[id] || 0) + 1; });
  return Object.keys(c).map(id => { const t = vType(id); return (c[id] > 1 ? c[id] + "× " : "") + t.icon + " " + t.name; }).join(", ");
}

const NAME_POOL = ["Mara", "Jonas", "Lea", "Timo", "Nora", "Elias", "Frida", "Kian", "Alma", "Bosse"];
const FIRM_POOL = ["Nordpfeil Logistik", "Spree Fracht", "Kompass Transporte", "Achse & Anker",
                   "Blaufracht", "Weitwind Spedition", "Kurs Nord", "Pendel Logistik"];

const INTRO = {
  step: 0,
  draft: null
};

/* ---------------------- Eigene Artwork für die Disponentin ---------------
   Liegt unter lina.png eine Bilddatei, wird sie statt der SVG-Figur
   verwendet – Hochformat, freigestellt (PNG oder WebP mit Transparenz).
   Fehlt sie, zeichnet das Spiel die Figur wie bisher selbst.             */
const GUIDE_ART = "lina.png";
/* Die Grafik gehört zum Lieferumfang, also wird sie von Anfang an gezeigt.
   Erst wenn sie wirklich fehlt, springt der SVG-Baukasten ein – vorher
   erschien für einen Moment die gezeichnete Figur, was wie ein Wechsel
   mitten im Bild aussah. */
let guideArt = GUIDE_ART;
function probeGuideArt() {
  document.body.classList.add("guide-art");
  const img = new Image();
  img.onload = () => {};
  img.onerror = () => {                       /* nur im Fehlerfall umschalten */
    guideArt = "";
    document.body.classList.remove("guide-art");
    const t = $("#tutor");
    if (t && t.classList.contains("on")) showTutStep();
    if ($("#intro").classList.contains("on") && INTRO.step === 0) renderIntro();
  };
  img.src = GUIDE_ART;
}
function guideFigure(size, uid) {
  return guideArt
    ? `<img class="guide-art" src="${guideArt}" alt="${GUIDE.name}" width="289" height="821">`
    : avatarFigureSVG(GUIDE.avatar, size, { uid: uid, label: GUIDE.name });
}

/* ------------------------------ Ablauf --------------------------------- */
function startIntro() {
  probeGuideArt();
  document.body.classList.add("locked");
  INTRO.draft = {
    name: "", company: "",
    origin: 1, color: 0,
    avatar: avRandom()
  };
  INTRO.draft.avatar.acc = 0;
  INTRO.step = S.phase === "founding" ? 3 : 0;
  if (S.phase === "founding" && S.player) INTRO.draft = JSON.parse(JSON.stringify(S.player));
  $("#intro").classList.add("on");
  renderIntro();
}

function renderIntro() {
  const el = $("#intro");
  const d = INTRO.draft;
  const dots = [0, 1, 2, 3].map(i => `<i class="${i === INTRO.step ? "on" : ""}"></i>`).join("");
  let body = "";

  /* ---------- 0: Willkommen ---------- */
  if (INTRO.step === 0) {
    body = `
      <div class="intro-card">
        <div class="intro-h">Willkommen in der Disposition</div>
        <div class="intro-p">
          Du baust eine Spedition auf – vom ersten Lastenrad in Berlin bis zur
          Containerflotte auf allen Ozeanen. Zuerst brauchst du ein Gesicht,
          eine Firma und mindestens ein Fahrzeug.
        </div>
      </div>
      <div class="intro-card greet">
        <div class="greet-fig">${guideFigure(150, "g0")}</div>
        <div class="greet-tx">
          <b>${GUIDE.name}</b><span>${GUIDE.role}</span>
          <div class="intro-p">„Ich bin deine Disponentin. Ich melde mich gleich wieder, sobald deine Firma steht.“</div>
        </div>
      </div>
      <div class="intro-btns"><button class="btn go" id="iNext">Los geht’s</button></div>`;
  }

  /* ---------- 1: Charakter ---------- */
  if (INTRO.step === 1) {
    const pick = (key, label, value) => `
      <div class="picker">
        <button data-dec="${key}" aria-label="zurück">‹</button>
        <div class="lbl"><span>${label}</span><b>${value}</b></div>
        <button data-inc="${key}" aria-label="weiter">›</button>
      </div>`;
    const a = d.avatar;
    const male = AV.sexes[avWrap(a, "sex")] === "m";
    const slots = PLAYER_ART_SLOTS.filter(sl => playerArtSrc(sl.id));
    const mode = d.mode === "preset" || d.mode === "photo" ? d.mode : "build";
    body = `
      <div class="intro-card">
        <div class="intro-h">Wer bist du?</div>
        <div class="intro-p">Aus der Sicht dieser Figur läuft das ganze Spiel.</div>
        <div class="av-stage"><div class="frame">${portraitHTML(a, 170, { uid: "big", bgColor: COMPANY_COLORS[d.color] + "33" })}</div></div>

        <div class="modeswitch">
          <button data-mode="build" class="${mode === "build" ? "on" : ""}">✏️ Selbst gestalten</button>
          <button data-mode="preset" class="${mode === "preset" ? "on" : ""}">🧑 Fertige Figur</button>
          <button data-mode="photo" class="${mode === "photo" ? "on" : ""}">📸 Aus Foto</button>
        </div>

        ${mode === "photo" ? photoEditorHTML(!!a.photo) : mode === "build" ? `<div class="pickers">
          ${pick("sex", "Typ", AV_LABEL.sex[AV.sexes[avWrap(a, "sex")]])}
          ${pick("hair", "Frisur", AV_LABEL.hair[avHairList(a)[avWrap(a, "hair")]])}
          ${pick("hairColor", "Haarfarbe", AV_LABEL.hairColor[AV.hairColors[avWrap(a, "hairColor")].id])}
          ${pick("eyes", "Augenfarbe", AV_LABEL.eyes[AV.eyeColors[avWrap(a, "eyes")].id])}
          ${pick("skin", "Hautton", AV_LABEL.skin[AV.skins[avWrap(a, "skin")].id])}
          ${male ? pick("beard", "Bart", AV_LABEL.beard[AV.beards[avWrap(a, "beard")]]) : ""}
          ${pick("outfit", "Kleidung", AV.outfits[avWrap(a, "outfit")].name)}
          ${pick("acc", "Zubehör", AV_LABEL.acc[AV.accessories[avWrap(a, "acc")]])}
        </div>
        <div class="intro-btns" style="margin-top:10px">
          <button class="btn ghost" id="iDice">🎲 Würfeln</button>
        </div>`
        : slots.length ? `<div class="artgrid">
            ${slots.map(sl => `<button class="artpick${a.art === sl.id ? " on" : ""}" data-art="${sl.id}"
               title="${esc(sl.label)}"><img src="${playerArtSrc(sl.id)}" alt="${esc(sl.label)}"></button>`).join("")}
          </div>
          <div class="intro-p small">Tipp die Figur an, die du spielen willst.</div>`
        : `<div class="hintbox">Noch sind keine fertigen Figuren hinterlegt. Leg Bilder als
             <b>player-w1.png</b> bis <b>player-m4.png</b> ab – sie erscheinen dann hier zur Auswahl.
             Das Format steht in <b>PLAYER-ART.md</b>.</div>`}

        <div class="field">
          <label for="iName">Dein Name</label>
          <input id="iName" maxlength="22" autocomplete="off" spellcheck="false"
                 placeholder="z. B. ${NAME_POOL[0]}" value="${esc(d.name)}">
        </div>
      </div>
      <div class="intro-btns">
        <button class="btn ghost" id="iBack">Zurück</button>
        <button class="btn go" id="iNext">Weiter</button>
      </div>`;
  }

  /* ---------- 2: Firma ---------- */
  if (INTRO.step === 2) {
    body = `
      <div class="intro-card">
        <div class="intro-h">Deine Firma</div>
        <div class="intro-p">Name, Hausfarbe und deine Herkunft. Die Herkunft bestimmt, womit du startest.</div>
        <div class="field">
          <label for="iFirm">Firmenname</label>
          <input id="iFirm" maxlength="26" autocomplete="off" spellcheck="false"
                 placeholder="z. B. ${FIRM_POOL[0]}" value="${esc(d.company)}">
        </div>
        <div class="field">
          <label>Hausfarbe</label>
          <div class="swatches">
            ${COMPANY_COLORS.map((c, i) =>
              `<button class="swatch ${i === d.color ? "on" : ""}" data-color="${i}"
                 style="background:${c}" aria-label="Farbe ${i + 1}"></button>`).join("")}
          </div>
        </div>
        <div class="field">
          <label>Herkunft</label>
          <div class="origins">
            ${ORIGINS.map((o, i) => {
              const gift = giftText(o);
              return `<button class="origin ${i === d.origin ? "on" : ""}" data-origin="${i}">
                <b>${o.name}</b><small>${o.text}</small>
                <span class="cash">${money(o.cash)}${gift ? " + " + esc(gift) : ""}</span>
              </button>`;
            }).join("")}
          </div>
        </div>
      </div>
      <div class="intro-btns">
        <button class="btn ghost" id="iBack">Zurück</button>
        <button class="btn go" id="iNext">Firma anmelden</button>
      </div>`;
  }

  /* ---------- 3: Gründung ---------- */
  if (INTRO.step === 3) {
    const startVehicles = VEHICLES.filter(v => v.stage === 1);
    const count = (id) => S.fleet.filter(f => f.type === id).length;
    /* Nur selbst gekaufte lassen sich wieder abgeben – das Fahrzeug aus der
       Herkunft gehört zur Vorgeschichte und bleibt. */
    const bought = (id) => S.fleet.filter(f => f.type === id && !f.gift).length;
    body = `
      <div class="intro-card">
        <div class="found-head">
          <div class="frame">${portraitHTML(S.player.avatar, 52, { uid: "fh", bgColor: COMPANY_COLORS[S.player.color] + "33" })}</div>
          <div><div class="intro-h" style="font-size:19px">${esc(S.player.company)}</div>
            <div class="intro-p">${esc(S.player.name)} · ${ORIGINS[S.player.origin].name}</div></div>
        </div>
        <div class="intro-p">
          Deine Fahrzeuge aus der Vorgeschichte stehen schon im Hof. Viel Geld ist
          nicht da – der Rest kommt über die ersten Aufträge. Mehr Fahrzeuge gibt es
          jederzeit im Markt.
        </div>
        <div class="found-money"><span>Startkapital</span><b>${money(S.money)}</b></div>
        ${startVehicles.map(t => {
          const afford = S.money >= t.price;
          const n = count(t.id);
          return `<div class="mini">
            <span class="ic">${t.icon}</span>
            <div class="tx"><b>${esc(t.name)}</b>
              <small>${kgf(t.cap)} · ${t.speed} km/h · ${fmt(t.costKm, 2)} €/km · ${money(t.price)}</small></div>
            ${n ? `<span class="ct">${n}×</span>` : ""}
            ${bought(t.id) ? `<button class="add sub" data-unbuy="${t.id}"
              aria-label="wieder abgeben" title="wieder abgeben">−</button>` : ""}
            <button class="add${afford ? "" : " disabled"}" data-buy="${t.id}" aria-label="kaufen">+</button>
          </div>`;
        }).join("")}
        ${S.fleet.length ? "" : `<div class="lockrow">Noch kein Fahrzeug im Fuhrpark</div>`}
      </div>
      <div class="intro-btns">
        <button class="btn ghost" id="iBack">Zurück</button>
        <button class="btn go${S.fleet.length ? "" : " disabled"}" id="iFound">Firma gründen</button>
      </div>`;
  }

  el.innerHTML = `<div class="intro-wrap">
      <div class="intro-logo">LOGISTIKA</div>
      <div class="intro-sub">Welt der Logistik</div>
      <div class="steps">${dots}</div>
      ${body}
    </div>`;
  bindIntro();
}

function bindIntro() {
  const d = INTRO.draft;
  const nameEl = $("#iName"), firmEl = $("#iFirm");
  if (nameEl) nameEl.oninput = () => { d.name = nameEl.value; };
  if (firmEl) firmEl.oninput = () => { d.company = firmEl.value; };

  const step = (k, dir) => {
    const len = avLen(d.avatar, k);
    d.avatar[k] = (avWrap(d.avatar, k) + dir + len) % len;
    /* Frisurenlisten sind je Typ verschieden – Index sauber halten */
    if (k === "sex") d.avatar.hair = Math.min(d.avatar.hair, avHairList(d.avatar).length - 1);
    renderIntro();
  };
  $$("#intro [data-mode]").forEach(b => b.onclick = () => {
    INTRO.draft.mode = b.dataset.mode;
    if (b.dataset.mode !== "photo") { delete INTRO.draft.avatar.photo; photoForget(); }
    if (b.dataset.mode === "build" || b.dataset.mode === "photo") INTRO.draft.avatar.art = null;
    else if (!INTRO.draft.avatar.art) {
      const first = PLAYER_ART_SLOTS.find(sl => playerArtSrc(sl.id));
      if (first) INTRO.draft.avatar.art = first.id;
    }
    renderIntro();
  });
  /* Foto-Modus: Vorschau ist das große Porträt oben */
  if (d.mode === "photo" && INTRO.step === 1) {
    bindPhotoEditor($("#intro .av-stage .frame"), (url, full) => {
      d.avatar.photo = url;
      const img = $("#intro .av-stage .frame img.pt-photo");
      /* Stil-Knöpfe erscheinen erst, wenn ein Bild geladen ist */
      if (img && (!full || $("#intro .ph-styles"))) img.src = url; else renderIntro();
    }, renderIntro);
  }
  $$("#intro [data-art]").forEach(b => b.onclick = () => {
    INTRO.draft.avatar.art = b.dataset.art || null;
    renderIntro();
  });
  $$("#intro [data-inc]").forEach(b => b.onclick = () => step(b.dataset.inc, 1));
  $$("#intro [data-dec]").forEach(b => b.onclick = () => step(b.dataset.dec, -1));
  const dice = $("#iDice");
  if (dice) dice.onclick = () => { d.avatar = avRandom(d.avatar.sex); renderIntro(); };

  $$("#intro [data-color]").forEach(b => b.onclick = () => { d.color = +b.dataset.color; renderIntro(); });
  $$("#intro [data-origin]").forEach(b => b.onclick = () => { d.origin = +b.dataset.origin; renderIntro(); });
  $$("#intro [data-unbuy]").forEach(b => b.onclick = () => {
    const t = vType(b.dataset.unbuy);
    if (!t) return;
    /* Das zuletzt gekaufte Exemplar geht zurück, zum vollen Preis –
       in der Gründung ist noch kein Kilometer gefahren. */
    for (let i = S.fleet.length - 1; i >= 0; i--) {
      const f = S.fleet[i];
      if (f.type === t.id && !f.gift) {
        S.fleet.splice(i, 1);
        S.money += t.price; S.expense = Math.max(0, S.expense - t.price);
        break;
      }
    }
    renderIntro();
  });
  $$("#intro [data-buy]").forEach(b => b.onclick = () => {
    const t = vType(b.dataset.buy);
    if (!t || S.money < t.price) return;
    S.money -= t.price; S.expense += t.price;
    S.fleet.push(makeVehicle(t.id, false));
    renderIntro();
  });

  const back = $("#iBack");
  if (back) back.onclick = () => {
    if (INTRO.step === 3) {
      // Gründung abbrechen: Fahrzeuge zurückgeben, Kapital wiederherstellen
      S.fleet = []; S.money = 0; S.expense = 0; S.phase = "intro";
      INTRO.step = 2;
    } else INTRO.step--;
    renderIntro();
  };

  const next = $("#iNext");
  if (next) next.onclick = () => {
    if (INTRO.step === 1) {
      if (!d.name.trim()) d.name = pick(NAME_POOL);
      d.name = d.name.trim().slice(0, 22);
    }
    if (INTRO.step === 2) {
      if (!d.company.trim()) d.company = pick(FIRM_POOL);
      d.company = d.company.trim().slice(0, 26);
      beginFounding();
      return;
    }
    INTRO.step++;
    renderIntro();
  };

  const found = $("#iFound");
  if (found) found.onclick = finishFounding;
}

/* --------------------------- Gründungsphase ----------------------------- */
function beginFounding() {
  if (typeof photoForget === "function") photoForget();
  const d = INTRO.draft;
  const o = ORIGINS[d.origin];
  S.player = JSON.parse(JSON.stringify(d));
  S.phase = "founding";
  S.money = o.cash;
  S.revenue = 0; S.expense = 0;
  S.fleet = [];
  (o.gifts || []).forEach(id => {
    const v = makeVehicle(id, false);
    v.gift = true;
    S.fleet.push(v);
  });
  INTRO.step = 3;
  renderIntro();
  save();
}

function finishFounding() {
  if (!S.fleet.length) return;
  S.phase = "play";
  S.time = 6 * 60;
  S.lastDay = 0;
  document.body.classList.remove("locked");
  $("#intro").classList.remove("on");
  clearRouteCache();
  buildNetBuffers();
  spawnOrders(8);
  const st = STAGES[S.stage - 1];
  showTab("map");
  map.setView(st.center, st.zoom);
  renderFogNote(fogRadiusKm(S.stage, level()));
  save();
  toast("🎉 " + S.player.company + " ist angemeldet. Willkommen im Geschäft!", "ok");
  setTimeout(startTutorial, 700);
}

/* ------------------------------ Tutorial --------------------------------
   Lina geht mit dem Spieler einen echten Auftrag durch: Übungsauftrag in
   der Liste finden, Leerfahrt-Hinweis lesen, Planung mit Minikarte und
   Fahrzeugauswahl verstehen, annehmen, verfolgen. Der Übungsauftrag startet
   genau dort, wo ein freies Fahrzeug steht – so sieht man einmal, wie ein
   Auftrag ohne Leerfahrt aussieht.

   Schritt-Felder:
     tx       Text oder Funktion, die den Text liefert
     target   CSS-Selektor, Funktion (Element oder Rechteck) oder nichts
     top      Blase oben (true) / unten (false); fehlt es, entscheidet der Platz
     before   läuft vor dem Anzeigen (Reiter wechseln, Karte schwenken)
     waitFor  kein „Weiter“ – der Schritt wartet auf eine echte Aktion
     inPlanner  gehört zum geöffneten Planer; Schließen führt zurück
     need     "order" (Übungsauftrag offen), "job" (angenommen),
              "none" (keine Übung möglich) – sonst wird übersprungen      */
let tutOrderId = null;
function tutOrder() { return tutOrderId ? S.orders.find(o => o.id === tutOrderId) || null : null; }
function tutJob() { return tutOrderId ? S.jobs.find(j => j.order.id === tutOrderId) || null : null; }
/* Das Fahrzeug, um das es geht – je nach Stand aus Planer, Auftrag oder Flotte */
function tutVeh() {
  if (planState && planState.order.id === tutOrderId) {
    const f = S.fleet.find(x => x.uid === planState.assign[0]);
    if (f) return f;
  }
  const j = tutJob();
  if (j) { const f = S.fleet.find(x => x.uid === j.legs[0].veh); if (f) return f; }
  const o = tutOrder();
  if (o) { const p = dispatchPreview(o); if (p.ok && p.veh) return p.veh; }
  return S.fleet.find(f => f.phase === "idle") || S.fleet[0] || null;
}
const tvName = () => { const f = tutVeh(); return f ? vType(f.type).brand : "Fahrzeug"; };
const tvIcon = () => { const f = tutVeh(); return f ? vType(f.type).icon : "🚚"; };
function tutRepoSel() {
  if (!planState) return { km: 0, eur: 0 };
  const ev = evaluate(planState.variants[planState.vi], planState.order, planState.assign);
  let km = 0, eur = 0;
  ev.detail.forEach(d => { if (d.veh && d.repo && d.repo.ok && d.repo.d >= 0.5) { km += d.repo.d; eur += d.repo.d * d.t.costKm; } });
  return { km, eur };
}
function tutEligibleCount() {
  if (!planState) return 0;
  const leg = planState.variants[planState.vi].legs[0];
  return eligible(leg, planState.order, []).length;
}
const tutOrderCard = () => document.querySelector("#tab-orders .card.order.tut");
/* Rechteck um ein Fahrzeug auf der großen Karte */
function tutVehRect() {
  const f = tutVeh();
  if (!f || !map) return null;
  const p = vehPos(f) || [N[f.at].lat, N[f.at].lon];
  const s = map.screenPos(p[0], p[1]);
  const fo = (typeof vehFan === "function" && vehFan()[f.uid]) || [0, 0];
  const x = s[0] + fo[0], y = s[1] + fo[1];
  return { left: x - 24, top: y - 24, width: 48, height: 48, right: x + 24, bottom: y + 24 };
}

/* Stecknadel des Übungsauftrags auf der großen Karte */
function tutPinRect() {
  if (typeof pinHits === "undefined") return null;
  const h = pinHits.find(x => x.items.some(i => i.kind === "order" && i.id === tutOrderId));
  if (!h) return null;
  return { left: h.x - 17, top: h.y - 17, width: 34, height: 46, right: h.x + 17, bottom: h.y + 29 };
}

const TUT_STEPS = [
  { tx: "Moin! Ich bin Lina, deine Disponentin. Wir wickeln jetzt zusammen deinen ersten Auftrag ab – "
      + "Schritt für Schritt. Die Uhr steht so lange still." },
  { tx: () => {
      const f = tutVeh();
      return "Das ist deine Karte – alles Dunkle ist noch Nebel, der lichtet sich mit jedem Level. "
        + (f ? `Und hier steht dein ${tvIcon()} ${esc(tvName())} – ${esc(vehSpot(f).t)} in ${esc(N[f.at].short)}. ` : "")
        + "Merk dir das: <b>Wo ein Fahrzeug steht, entscheidet, ob eine Fahrt Geld bringt oder kostet.</b>";
    },
    target: tutVehRect,
    before: () => {
      showTab("map");
      const f = tutVeh();
      if (f) { const p = vehPos(f) || [N[f.at].lat, N[f.at].lon]; map.setView(p, Math.max(12.6, Math.min(13.4, map.zoom))); }
    } },

  /* ---------- mit Übungsauftrag ---------- */
  { need: "order",
    tx: () => "Siehst du die Stecknadeln? <b>Gelb</b> ist eine offene Ausschreibung – genau dort, wo der Auftraggeber sitzt. "
      + "<b>Orange</b> heißt: angenommen und in Arbeit. Antippen öffnet den Auftrag. Meine Übung wartet gleich neben deinem "
      + `${tvIcon()} ${esc(tvName())}.`,
    target: tutPinRect,
    before: () => {
      /* Nah genug heran, dass Nadel und Fahrzeug nebeneinander zu sehen sind */
      const o = tutOrder(), f = tutVeh();
      if (!o || !f) return;
      const a = oPick(o), v = vehPoint(f);
      showTab("map");
      map.setView([(a.lat + v[0]) / 2 + 0.0012, (a.lon + v[1]) / 2], 14.3);
    } },
  { need: "order",
    tx: () => {
      const o = tutOrder();
      return `Unter „Aufträge“ laufen die Ausschreibungen ein. Ganz oben liegt ein Übungsauftrag von mir ⭐: `
        + `${CARGO[o.cargo].name} von ${esc(N[o.from].short)} nach ${esc(N[o.to].short)}.`;
    },
    target: tutOrderCard, before: () => { showTab("orders"); $("#view .view-body").scrollTop = 0; } },
  { need: "order",
    tx: () => `Diese Zeile ist dein <b>Leerfahrt-Radar</b>. ✅ Grün: ein freies Fahrzeug steht schon am Abholort – `
      + `keine Leerfahrt. ↩️ Gelb: es müsste erst leer hinfahren. Das kostet Sprit und Zeit, und keiner bezahlt dich dafür. `
      + `🚫 Rot: gerade kein passendes Fahrzeug frei.`,
    target: () => document.querySelector("#tab-orders .card.order.tut .vhintrow") },
  { id: "pick", need: "order",
    tx: "Jetzt du: Tipp auf den ⭐ Übungsauftrag.",
    target: tutOrderCard, waitFor: "openPlanner",
    before: () => { if (activeTab !== "orders") showTab("orders"); $("#view .view-body").scrollTop = 0; },
    already: () => planState && planState.order.id === tutOrderId },
  { need: "order", inPlanner: true, top: false,
    tx: () => {
      const r = tutRepoSel();
      return `Das ist die Planung. Die Minikarte zeigt, wo alles liegt: 📦 Abholung, 🏁 Ziel und deine Fahrzeuge. `
        + (r.km < 0.5
          ? `Dein ${esc(tvName())} steht direkt am Abholort – darum gibt es keine gestrichelte Linie. <b>Keine Linie = keine Leerfahrt.</b>`
          : `Die gestrichelte Linie ist die Leerfahrt: ${kmf(r.km)}, die du selbst bezahlst.`);
    },
    target: "#modalBody .pmap" },
  { need: "order", inPlanner: true, top: false,
    tx: () => tutEligibleCount() > 1
      ? "Hier wählst du das Fahrzeug. Die Liste ist nach Entfernung sortiert: oben steht, wer am nächsten dran ist – "
        + "mit Standort und was die Leerfahrt kosten würde. Tipp ruhig mal ein anderes an, dann siehst du die Leerfahrt auf der Karte."
      : `Hier wählst du das Fahrzeug. Bei jedem steht, wo es gerade parkt und ob es erst leer anfahren müsste. `
        + `Dein ${esc(tvName())} ist schon da: ✅ vor Ort.`,
    target: "#modalBody .vpick", allow: () => tutEligibleCount() > 1 },
  { need: "order", inPlanner: true, top: true,
    tx: () => {
      const r = tutRepoSel();
      return "Unten die Rechnung: Frachterlös minus Fahrtkosten ergibt den <b>Deckungsbeitrag</b>. Grün heißt, die Fahrt lohnt sich. "
        + (r.eur > 0.005
          ? `Gerade frisst die Leerfahrt ${money(r.eur)} davon – das Fahrzeug vor Ort wäre günstiger.`
          : "Ohne Leerfahrt bleibt am meisten übrig.");
    },
    target: "#modalBody .sum" },
  { id: "accept", need: "order", inPlanner: true, top: true,
    tx: "Passt? Dann tipp auf „Auftrag annehmen“.",
    target: "#modalBody #mAccept", waitFor: "orderAccepted" },

  { id: "accepted", need: "job",
    tx: () => `Angenommen – dein erster Auftrag! Unter „Live“ verfolgst du ihn. Sobald wir fertig sind, läuft die Uhr `
      + `und dein ${tvIcon()} ${esc(tvName())} fährt los.`,
    target: () => { const j = tutJob(); return j && document.querySelector(`#tab-jobs .card.job[data-job="${j.id}"]`); },
    before: () => showTab("jobs") },
  { need: "job",
    tx: () => {
      const j = tutJob(), nx = S.orders.find(o => o.tutNext);
      return `Und jetzt der wichtigste Trick gegen Leerfahrten: Nach der Zustellung steht dein ${esc(tvName())} in `
        + `${esc(N[j.order.to].short)}. <b>Nimm als Nächstes einen Auftrag, der genau dort startet.</b> `
        + (nx ? `Einen hab ich dir schon reingelegt ⭐ – sobald dein ${esc(tvName())} dort ist, wird sein Hinweis grün. ` : "")
        + `Mit „📍 Leerfahrt“ oben in der Leiste holst du solche Aufträge nach oben.`;
    },
    target: () => document.querySelector("#tab-orders .card.order.tutnext .vhintrow")
      || document.querySelector('#viewTools [data-sort="near"]'),
    before: () => {
      const j = tutJob();
      if (j && !S.orders.some(o => o.tutNext) && typeof makeFollowupOrder === "function") makeFollowupOrder(j);
      showTab("orders");
      $("#view .view-body").scrollTop = 0;
    } },

  /* ---------- ohne Übungsauftrag (alle Fahrzeuge unterwegs) ---------- */
  { need: "none",
    tx: "Unter „Aufträge“ laufen die Ausschreibungen ein. Für eine Übungsfahrt ist gerade kein Fahrzeug frei – "
      + "so liest du die Liste trotzdem:",
    target: '[data-tab="orders"]', before: () => showTab("orders") },
  { need: "none",
    tx: "Unter jedem Auftrag steht dein <b>Leerfahrt-Radar</b>: ✅ ein Fahrzeug steht schon am Abholort, ↩️ es müsste erst leer "
      + "hinfahren, 🚫 gerade keins frei. Tippst du einen Auftrag an, zeigt dir die Minikarte, wo alles steht – "
      + "die gestrichelte Linie ist die Leerfahrt.",
    target: "#tab-orders .card.order .vhintrow" },

  { tx: "Unter „Flotte“ steht bei jedem Fahrzeug, wo es gerade parkt oder hinfährt. Hast du mehrere, verteil sie auf "
      + "verschiedene Stadtteile – dann ist fast immer eins in der Nähe.",
    target: '[data-tab="fleet"]', before: () => showTab("map") },
  { tx: "Noch disponierst du jeden Auftrag selbst. Später mietest du unter „Büros“ einen Standort: Wer dort jemanden aus der "
      + "<b>Disposition</b> einstellt, dessen Fahrzeuge fahren von allein – und er bekommt Anrufe aufs Diensttelefon.",
    target: '[data-tab="bases"]', before: () => showTab("map") },
  { tx: "Das ist dein <b>Diensthandy</b>. Hier melden sich dein Team – und manchmal auch Leute, die du nicht kennst. "
      + "Aus Sicherheitsgründen löscht es jede Nachricht nach <b>24 Stunden</b>. Lies also zeitnah.",
    target: "#phoneBtn", top: true, before: () => showTab("map") },
  { tx: "Das war’s. Oben rechts hältst du das Spiel jederzeit an – ab jetzt läuft die Uhr. Viel Erfolg, und wenn’s brennt, bin ich auf Kanal 1.",
    target: "#pauseBtn", top: true, before: () => showTab("map") }
];


/* Wolkenkontur: einmal im Uhrzeigersinn um das Textfeld, jede Kante aus
   gleich großen Bögen. Die Bogenzahl richtet sich nach der Kantenlänge,
   damit die Beulen bei kurzem wie bei langem Text gleich groß aussehen. */
function cloudPath(w, h, bump) {
  const x0 = bump, y0 = bump, x1 = w - bump, y1 = h - bump;
  const iw = Math.max(1, x1 - x0), ih = Math.max(1, y1 - y0);
  const nx = Math.max(3, Math.round(iw / (bump * 1.9)));
  const ny = Math.max(2, Math.round(ih / (bump * 1.9)));
  const sx = iw / nx, sy = ih / ny;
  const a = (r, x, y) => ` A${r.toFixed(1)},${r.toFixed(1)} 0 0 1 ${x.toFixed(1)},${y.toFixed(1)}`;
  let d = `M${x0.toFixed(1)},${y0.toFixed(1)}`;
  for (let i = 1; i <= nx; i++) d += a(sx * 0.54, x0 + sx * i, y0);
  for (let i = 1; i <= ny; i++) d += a(sy * 0.54, x1, y0 + sy * i);
  for (let i = 1; i <= nx; i++) d += a(sx * 0.54, x1 - sx * i, y1);
  for (let i = 1; i <= ny; i++) d += a(sy * 0.54, x0, y1 - sy * i);
  return d + "Z";
}

/* Zeichnet die Wolke passend zur aktuellen Größe der Blase. */
function drawCloud() {
  const box = $("#tutor .tut-bubble"), svg = $("#tutor .tut-cloud");
  if (!box || !svg) return;
  const w = box.offsetWidth, h = box.offsetHeight;
  if (w < 40 || h < 30) return;
  const bump = Math.min(11, Math.max(7, Math.round(h / 11)));
  /* Die zwei Punkte laufen schräg nach oben auf Linas Mund zu. */
  const tail = document.body.classList.contains("guide-art")
    ? `<circle cx="-10" cy="${(h * 0.52).toFixed(0)}" r="8.5"/>
       <circle cx="-26" cy="${(h * 0.52 - 15).toFixed(0)}" r="5"/>`
    : `<circle cx="-10" cy="${(h - 34).toFixed(0)}" r="8.5"/>
       <circle cx="-26" cy="${(h - 19).toFixed(0)}" r="5"/>`;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.innerHTML = `<g><path d="${cloudPath(w, h, bump)}"/>${tail}</g>`;
}
addEventListener("resize", () => { if (document.body.classList.contains("tut-on")) { drawCloud(); tutRefresh(); } });

let tutStep = 0, tutTimer = 0;
/* Welche Schrittliste gerade läuft: das große Einführungstutorial ("main")
   oder eines von Linas späteren Gesprächen (siehe LINA_TALKS). */
let tutList = TUT_STEPS, tutKey = "main";
function startTutorial() {
  if (S.tut && S.tut.done) return;
  if (planState) closeModal();
  tutList = TUT_STEPS; tutKey = "main";
  /* Übungsauftrag anlegen – oder einen alten wiederfinden, falls das
     Tutorial nochmal läuft. */
  const old = S.orders.find(o => o.tut);
  tutOrderId = old ? old.id : ((typeof makeTutorialOrder === "function" && makeTutorialOrder()) || {}).id || null;
  tutStep = 0;
  showTutStep();
}
function tutNeedOk(need) {
  if (!need) return true;
  if (need === "order") return !!tutOrder();
  if (need === "job") return !!tutJob();
  if (need === "none") return !tutOrder() && !tutJob();
  return true;
}
function tutGo(i) { tutStep = i; showTutStep(); }

/* Echte Aktionen aus game.js: Planer geöffnet, Auftrag angenommen, Planer zu. */
function tutSignal(tag, o) {
  if (!document.body.classList.contains("tut-on")) return;
  if (tutKey !== "main") return;
  const st = tutList[tutStep];
  if (!st) return;
  if (tag === "openPlanner") {
    if (st.waitFor !== "openPlanner") return;
    if (!o || o.id !== tutOrderId) {
      closeModal();
      toast("Tipp erst auf Linas ⭐ Übungsauftrag – danach bist du frei.", "warn");
      return;
    }
    tutGo(tutStep + 1);
  } else if (tag === "orderAccepted") {
    if (!o || o.id !== tutOrderId) return;
    const i = tutList.findIndex(s => s.id === "accepted");
    if (i > tutStep) tutGo(i);
  } else if (tag === "plannerClosed") {
    /* Abgebrochen, während Lina die Planung erklärt: zurück zur Liste. */
    if (st.inPlanner && tutOrder()) tutGo(tutList.findIndex(s => s.id === "pick"));
  }
}

function endTutorial() {
  clearTimeout(tutTimer);
  if (tutKey === "main") {
    S.tut = { done: true };
    S.orders.forEach(o => { delete o.tut; });
    tutOrderId = null;
  } else {
    (S.tutSeen = S.tutSeen || {})[tutKey] = true;
  }
  tutKey = "main"; tutList = TUT_STEPS;
  document.body.classList.remove("tut-on", "tut-talk");
  if (typeof renderPause === "function") renderPause();
  $("#tutor").classList.remove("on", "top", "compact");
  $("#tutor").innerHTML = "";          /* keine unsichtbaren Knöpfe zurücklassen */
  tutUnblock();
  save();
  render();
}

function tutText(st) { return typeof st.tx === "function" ? st.tx() : st.tx; }
function tutResolve(st) {
  if (!st.target) return null;
  const t = typeof st.target === "function" ? st.target() : document.querySelector(st.target);
  return t || null;
}

function showTutStep() {
  let st = tutList[tutStep];
  while (st && !tutNeedOk(st.need)) { tutStep++; st = tutList[tutStep]; }
  if (!st) return endTutorial();
  /* Ist die erwartete Aktion schon passiert (Planer bereits offen), gleich weiter. */
  if (st.waitFor && st.already && st.already()) { tutStep++; return showTutStep(); }

  clearTimeout(tutTimer);
  document.body.classList.add("tut-on");
  /* Bei Linas späteren Gesprächen stören Meldungen oben nur (sie liegen
     sonst genau über dem, was sie gerade zeigt). */
  document.body.classList.toggle("tut-talk", tutKey !== "main");
  if (typeof renderPause === "function") renderPause();
  try { if (st.before) st.before(); } catch (e) { console.warn("Tutorial:", e); }

  const tutor = $("#tutor");
  tutor.classList.remove("on");
  tutor.innerHTML = "";                /* keine Knöpfe vom letzten Schritt stehen lassen */
  tutBlock(null, false);               /* in der Pause dazwischen ist alles gesperrt */
  tutAskedAt = performance.now();
  tutWatch();
  /* Kurz warten, bis Reiterwechsel, Kartenschwenk oder das Hochfahren des
     Planers durch sind – sonst misst man das Ziel mitten in der Bewegung. */
  const delay = st.before || st.inPlanner || st.wait ? (st.wait || 380) : 40;
  const idx = tutStep;
  tutTimer = setTimeout(() => {
    if (tutStep !== idx) return;
    try { renderTutStep(st, true); }
    catch (e) { console.warn("Tutorial:", e); tutGo(tutStep + 1); }
  }, delay);
}

/* ------------------------------ Sperre ----------------------------------
   Solange Lina spricht, geht nur, was sie verlangt. Vier unsichtbare
   Scheiben rund um das Leuchtfenster fangen jede Berührung ab. Bei
   Mitmach-Schritten („Tipp auf …“) bleibt das Fenster selbst frei, sonst
   ist auch das abgedeckt. Scrollen ist währenddessen aus, damit das
   Fenster nicht vom Inhalt wegrutschen kann.                             */
let tutAskedAt = 0, tutWatchT = 0, tutPlaced = null;
function tutBlock(hole, open, ring) {
  const spot = $("#spot");
  if (!spot.querySelector("b")) spot.innerHTML = `<i></i><b></b><b></b><b></b><b></b>`;
  spot.classList.add("on");
  const W = innerWidth, H = innerHeight;
  const i = spot.querySelector("i"), bs = spot.querySelectorAll("b");
  const set = (el, x, y, w, h) => {
    if (w <= 0 || h <= 0) { el.style.display = "none"; return; }
    el.style.display = "block";
    el.style.left = x + "px"; el.style.top = y + "px"; el.style.width = w + "px"; el.style.height = h + "px";
  };
  if (ring) set(i, ring.left, ring.top, ring.width, ring.height); else i.style.display = "none";
  if (hole && open) {
    const x0 = Math.max(0, hole.left), y0 = Math.max(0, hole.top);
    const x1 = Math.min(W, hole.left + hole.width), y1 = Math.min(H, hole.top + hole.height);
    set(bs[0], 0, 0, W, y0);
    set(bs[1], 0, y1, W, H - y1);
    set(bs[2], 0, y0, x0, y1 - y0);
    set(bs[3], x1, y0, W - x1, y1 - y0);
  } else {
    set(bs[0], 0, 0, W, H);
    for (let k = 1; k < 4; k++) bs[k].style.display = "none";
  }
}
function tutUnblock() {
  const spot = $("#spot");
  spot.classList.remove("on");
  spot.innerHTML = "";
  clearInterval(tutWatchT); tutWatchT = 0;
}
/* Wo liegt das Ziel gerade, wie groß ist das Leuchtfenster? */
function tutGeom(st) {
  const el = tutResolve(st);
  const r = el ? (el.nodeType === 1 ? el.getBoundingClientRect() : el) : null;
  const ok = !!(r && r.width >= 12 && r.height >= 12);
  const p = st.pad == null ? 6 : st.pad;
  let ring = null;
  if (ok && (r.width + p * 2) * (r.height + p * 2) <= innerWidth * innerHeight * 0.42) {
    ring = { left: Math.max(2, r.left - p), top: Math.max(2, r.top - p),
             width: Math.min(r.width + p * 2, innerWidth - 4), height: Math.min(r.height + p * 2, innerHeight - 4) };
  }
  const hole = ring || (ok ? { left: r.left, top: r.top, width: r.width, height: r.height } : null);
  return { el, r, ok, ring, hole };
}
function tutOpen(st) {
  if (st.waitFor) return true;
  return typeof st.allow === "function" ? !!st.allow() : !!st.allow;
}
/* Fenster nachführen (Liste neu gezeichnet, Planer umgebaut, Handy gedreht)
   und aufpassen, dass nie eine Sperre ohne Lina stehen bleibt. */
function tutWatch() {
  if (tutWatchT) return;
  tutWatchT = setInterval(() => {
    if (!document.body.classList.contains("tut-on")) { tutUnblock(); return; }
    const tutor = $("#tutor"), st = tutList[tutStep];
    if (!st) return endTutorial();
    if (!tutor.classList.contains("on")) {
      if (performance.now() - tutAskedAt > 2500) showTutStep();
      return;
    }
    const g = tutGeom(st);
    /* Hat sich das Ziel spürbar verschoben (Schrift nachgeladen, Liste neu
       gezeichnet), wird auch Linas Platz neu bestimmt – sonst nur das Fenster. */
    const pl = tutPlaced, r = g.r;
    const moved = !pl !== !r || (r && pl && Math.abs(r.top - pl.top) + Math.abs(r.left - pl.left)
      + Math.abs(r.width - pl.width) + Math.abs(r.height - pl.height) > 4);
    if (moved) renderTutStep(st, false);
    else tutBlock(g.hole, tutOpen(st) && g.ok, g.ring);
  }, 200);
}
/* Mitmach-Schritt, dessen Ziel nicht da ist: Lina erledigt es selbst,
   damit niemand in der Sperre festsitzt. */
function tutFallback(st) {
  if (st.waitFor === "openPlanner" && tutOrder()) return openPlanner(tutOrderId);
  if (st.waitFor === "orderAccepted" && planState && planState.order.id === tutOrderId) {
    const btn = $("#mAccept");
    if (btn && !btn.classList.contains("disabled")) return acceptOrder(planState.vi);
    /* Geht wirklich nicht: Übung fallen lassen, weiter mit der Kurzfassung */
    const id = tutOrderId;
    tutOrderId = null;
    S.orders = S.orders.filter(o => o.id !== id);
    closeModal();
  }
  tutGo(tutStep + 1);
}

function renderTutStep(st, fresh) {
  const tutor = $("#tutor");
  const last = tutStep === tutList.length - 1;
  const el = tutResolve(st);
  const inModal = !!(el && el.nodeType === 1 && el.closest("#modal"));
  const inView = !!(el && el.nodeType === 1 && el.closest("#view .view-body"));
  /* Mitmach-Schritt ohne erreichbares Ziel (oder „annehmen“ gesperrt)? */
  const stuck = st.waitFor && (!el || (el.nodeType === 1 && el.classList.contains("disabled")));
  if (fresh) {
    tutor.innerHTML = `
      <div class="tut-box">
        <div class="tut-fig">${guideFigure(300, "t" + tutStep)}</div>
        <div class="tut-bubble">
          <svg class="tut-cloud" aria-hidden="true" preserveAspectRatio="none"></svg>
          <div class="tut-in">
            <div class="tut-who">${GUIDE.name} · ${GUIDE.role}</div>
            <div class="tut-tx">${tutText(st)}</div>
            <div class="tut-row">
              ${st.waitFor && !stuck
                ? `<span class="tut-wait">👉 Tipp auf das leuchtende Feld</span>`
                : `<button class="btn" id="tutNext">${last ? "Alles klar" : "Weiter"}</button>`}
            </div>
          </div>
        </div>
      </div>`;
    /* Größe steht fest, bevor das Bild geladen ist; trotzdem nach dem Laden
       einmal nachmessen, damit Lina sicher nicht aufs Ziel rutscht. */
    const fig = tutor.querySelector("img.guide-art");
    if (fig && !fig.complete) fig.onload = () => tutRefresh();
    const nextBtn = $("#tutNext");
    if (nextBtn) {
      let used = false;                 /* ein Tipp = ein Schritt, auch bei Doppeltipp */
      nextBtn.onclick = () => {
        if (used) return; used = true;
        if (stuck) tutFallback(st); else tutGo(tutStep + 1);
      };
    }
  }
  /* Lina rückt zusammen, wo es eng wird: im Planer immer, in den Listen bei
     den späteren Gesprächen (Büros, Mr. Snus, Don Pablo). */
  tutor.classList.toggle("compact", inModal || (inView && tutKey !== "main"));

  /* Ziel im Planer bzw. in der Liste so scrollen, dass es neben der Blase frei liegt */
  if (fresh && (inModal || (inView && tutKey !== "main"))) {
    const box = el.closest(".modal-inner, .view-body");
    if (box) {
      const br = box.getBoundingClientRect(), er = el.getBoundingClientRect();
      box.scrollTop += st.top ? (er.bottom - br.bottom + 14) : (er.top - br.top - 12);
    }
  }
  const g = tutGeom(st);
  const r = g.r, ok = g.ok;
  tutPlaced = r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;

  /* Oben oder unten? Beide Lagen ausmessen und die nehmen, die das Ziel
     nicht verdeckt – die Vorgabe des Schritts hat bei Gleichstand Vorrang. */
  if (fresh) tutor.classList.add("measure");
  tutor.classList.add("on");
  const bx = tutor.querySelector(".tut-box");
  const cover = a => ok ? Math.max(0, Math.min(a.bottom, r.bottom + 10) - Math.max(a.top, r.top - 10)) : 0;
  /* Lage ohne Aufploppen-Animation messen (die skaliert die Blase gerade noch) */
  const place = () => { const t = tutor.getBoundingClientRect(); return { top: t.top + bx.offsetTop, bottom: t.top + bx.offsetTop + bx.offsetHeight }; };
  const measure = () => {
    tutor.classList.add("top"); const rt = place();
    tutor.classList.remove("top"); const rb = place();
    return [cover(rt), cover(rb)];
  };
  let [ct, cb] = measure();
  /* Kleiner Bildschirm: Deckt Lina das Ziel oben wie unten zu, rückt sie zusammen */
  if (ct > 0 && cb > 0 && !tutor.classList.contains("compact")) {
    tutor.classList.add("compact");
    [ct, cb] = measure();
  }
  let top;
  if (st.top === true) top = !(ct > 0 && cb < ct);
  else if (st.top === false) top = cb > 0 && ct < cb;
  else top = ok ? (ct < cb || (ct === cb && r.top + r.height / 2 > innerHeight * 0.55)) : false;
  tutor.classList.toggle("top", top);
  tutor.classList.remove("measure");
  drawCloud();
  requestAnimationFrame(drawCloud);

  tutBlock(g.hole, tutOpen(st) && ok && !stuck, g.ring);
}

/* Planer neu gezeichnet (anderes Fahrzeug gewählt) oder Fenster gedreht:
   Text und Scheinwerfer nachziehen, ohne die Blase neu aufploppen zu lassen. */
function tutRefresh() {
  if (!document.body.classList.contains("tut-on")) return;
  const st = tutList[tutStep];
  if (!st || !$("#tutor").classList.contains("on")) return;
  const tx = $("#tutor .tut-tx");
  if (tx) { const t = tutText(st); if (tx.innerHTML !== t) tx.innerHTML = t; }
  renderTutStep(st, false);
}

/* ============================ Linas Gespräche ============================
   Kurze Einschübe, sobald etwas Neues auftaucht: Mr. Snus, Don Pablo und
   die Büros (einmal ohne, einmal mit erstem Standort). Jedes nur einmal –
   unter „Welt“ lassen sie sich wiederholen. Die Uhr steht dabei still.  */
const baseHead = i => () => $$("#tab-bases .card.base .sechead.sm")[i] || null;
const LINA_TALKS = {
  snus: [
    { tx: "Psst, Chef! Auf dem Diensttelefon hat sich gerade <b>Mr. Snus</b> gemeldet. Der verkauft Snus unter der Hand.",
      target: "#phoneBtn", top: true },
    { tx: () => `So läuft’s: Du kaufst bei ihm für ${money(SNUS_BUY)} die Dose. Die Ware liegt dann in einem Späti in der Stadt. `
        + `Kunden aus den Siedlungen am Stadtrand melden sich als <b>graue Aufträge</b> und zahlen ${money(SNUS_SELL)} die Dose – geliefert wird mit deiner eigenen Flotte.` },
    { tx: () => `Aber Vorsicht: Unter den Kunden sind <b>Zivilfahnder</b>. Die zahlen mehr als ${money(SNUS_SELL)} und wollen gleich 20, 30 Dosen. `
        + `Nur: Manche Stammkunden zahlen auch einfach gern mehr. Der sichere Hinweis ist das Aussehen – <b>weißes Hemd UND glatt rasiert</b>. `
        + `Hat einer nur eins von beidem, ist er echt.` },
    { tx: () => `Lieferst du an einen Fahnder, klicken die Handschellen: Ware weg, Geld weg und <b>${SNUS_JAIL_DAYS} Tage Haft</b>. `
        + "Passt dir ein Kunde nicht, blockierst du ihn mit ✕ – kostet nichts. Und eine laufende Übergabe kannst du unter „Live“ abbrechen." },
    { tx: "Hast du ein Büro mit Disposition, fährt dein Team Snus-Kunden mit. Wer auffällig viel zahlt oder will, den lässt es liegen und sagt dir Bescheid – "
        + "ob Fahnder oder großzügiger Kunde, entscheidest du dann selbst." },
    { tx: "Ob du mitmachst, entscheidest du – „Nein, danke mein Akh“ ist auch eine Antwort. Übrigens: Aus Sicherheitsgründen löscht das "
        + "Diensthandy jede Nachricht nach <b>24 Stunden</b>. Und den 🧮 Rechner darin solltest du dir mal genauer ansehen.",
      target: "#phoneBtn", top: true }
  ],
  pablo: [
    { tx: "Chef … <b>Don Pablo</b> ist am Telefon. Der spielt in einer ganz anderen Liga: Kokain, tonnenweise.",
      target: "#phoneBtn", top: true },
    { tx: () => `Er verkauft die Tonne für ${money(PABLO_BUY * 1000)}. Die Ware wartet in einem Hangar an einem Flughafen. `
        + `Seine Kunden zahlen ${money(PABLO_SELL * 1000)} pro Tonne und nehmen ein paar hundert Kilo bis ein paar Tonnen.` },
    { tx: "Echte Kunden heißen wie ihre Stadt – <b>Mr. Hamburg</b>, <b>Mr. Paris</b> – und wollen genau dorthin beliefert werden." },
    { tx: "Heißt einer anders – <b>Mr. Banane</b>, <b>Mr. Schnitzel</b> –, dann ist das Interpol. Lieferst du an so jemanden, "
        + "ist das Spiel vorbei. Endgültig, mit Bericht und allem." },
    { tx: "Ich hab dich gewarnt. Seine Nachricht liegt auf dem Telefon.", target: "#phoneBtn", top: true }
  ],
  bases: [
    { tx: "Willkommen in der Standortverwaltung! Ein <b>Büro</b> ist ein Stützpunkt: Dein Team dort nimmt selbst Aufträge an "
        + "und schickt die Fahrzeuge los, die du ihm zuordnest – auch wenn du gerade woanders beschäftigt bist.",
      target: "#tab-bases .card", wait: 420 },
    { tx: "Pro Etappe darfst du einen Standort betreiben. Hier wählst du den Ort: Stadtteile sind günstig, Häfen, Flughäfen "
        + "und Terminals kosten mehr, liegen aber an den großen Verkehrswegen.",
      target: "#newBaseNode" },
    { tx: "Drei Größen: <b>Kontor</b>, <b>Halle</b> und <b>Zentrum</b>. 👥 sind die Schreibtische für Personal, 🚚 die Stellplätze "
        + "für Fahrzeuge und 📡 das Einzugsgebiet, in dem dein Team Ausschreibungen abgreift.",
      target: "#tab-bases .tierlist .tier" },
    { tx: "Kaufen kostet einmal viel Geld. Mieten kostet pro Tag, abgebucht wird einmal im Monat. Mieten kannst du erst, "
        + "wenn mindestens 30 Tagesmieten auf dem Konto liegen.",
      target: "#tab-bases .tierlist .tier .buyrow" },
    { tx: "Sobald dein erstes Büro steht, zeig ich dir Personal, Rollen, Fahrzeuge und Einrichtung." }
  ],
  base1: [
    { tx: () => { const b = S.bases[0]; return `Dein erstes Büro${b ? " in " + esc(N[b.node].name) : ""}! Oben stehen Größe, `
        + "ob gemietet oder gekauft, und was es im Monat kostet."; },
      target: "#tab-bases .card.base .card-top", wait: 420 },
    { tx: "Das ist der Grundriss von oben. Tipp drauf, um einzurichten: Boden, Wände, Küche, Pflanzen – die Möbel lassen sich "
        + "verschieben. Jedes Stück macht das Büro behaglicher, und Behaglichkeit hält die Stimmung oben.",
      target: "#tab-bases .card.base .planpeek" },
    { tx: "Die <b>Stimmung</b> im Team. Unter 70 % gibt es öfter Ärger: Dann klingelt das Diensttelefon, der Standort steht still, "
        + "und du entscheidest, wie der Streit gelöst wird – mal kostet das Geld, mal Zeit.",
      target: "#tab-bases .card.base .moodbar" },
    { tx: () => `Es gibt vier Rollen. ${ROLES.disp.icon} <b>Disposition</b> nimmt Aufträge an – ohne sie passiert gar nichts. `
        + `${ROLES.fahr.icon} <b>Fahrpersonal</b> legt fest, wie viele Fahrzeuge gleichzeitig rollen. ${ROLES.ums.icon} <b>Umschlag</b> `
        + `verkürzt Lade- und Entladezeiten. ${ROLES.zoll.icon} <b>Zoll &amp; Papiere</b> bringen Servicezuschlag. Die Zahl zeigt, wie stark die Rolle besetzt ist.`,
      target: "#tab-bases .card.base .covrow" },
    { tx: "Hier kommen jeden Tag neue <b>Bewerbungen</b> rein. Die Sterne zeigen das Können, darunter stehen Rolle und Tageslohn, "
        + "rechts die einmalige Vermittlungsgebühr. Tipp auf 🤝, um jemanden einzustellen.",
      target: () => $("#tab-bases .card.base .staff.cand") || baseHead(1)() },
    { tx: "Dein <b>Team</b>. Mischung ist wichtig: Wer nur eine Rolle besetzt oder zu wenig Leute für zu viele Fahrzeuge hat, "
        + "bekommt Streit. Kündigen geht über ✕ oder indem du die Person auf den Mülleimer unten ziehst – "
        + "die Abfindung sind zwei Wochenlöhne.",
      target: baseHead(0) },
    { tx: "Hier ordnest du dem Standort <b>Fahrzeuge</b> zu – oder direkt unter „Flotte“ am Fahrzeug. Mit denen disponiert das Team "
        + "und nimmt jeweils das passende. Der Rest deiner Flotte bleibt bei dir: Den teilst du selbst ein.",
      target: () => $("#tab-bases .card.base .assignrow") || baseHead(2)() },
    { tx: "Zieh jemanden aus dem Fahrpersonal auf ein Fahrzeug: Dann fährt diese Person es fest und ist schneller unterwegs. "
        + "Beim Ziehen zeigt dir eine Leiste unten, wo du loslassen kannst.",
      target: () => $("#tab-bases .card.base .staff.veh") || baseHead(2)() },
    { tx: "Die Kennzahlen: Plätze, Stellplätze, wie viele Fahrzeuge gleichzeitig fahren können, Einzugsgebiet, Löhne pro Tag "
        + "und die nächste Miete. Löhne gehen täglich ab, die Miete monatlich – auch wenn gerade nichts läuft.",
      target: "#tab-bases .card.base .meta.small" },
    { tx: "Wird es eng, vergrößerst du hier zum nächsten Gebäude. Kündigen oder verkaufen geht auch – dann sind Team und Einrichtung weg.",
      target: "#tab-bases .card.base .baserow" },
    { tx: "Das war’s zu den Büros. Gutes Team, schönes Büro, genug Leute für die Fahrzeuge – dann läuft der Laden fast von allein." }
  ]
};

/* Startet ein Gespräch, sobald Platz dafür ist (kein anderes Tutorial,
   keine Haft, kein Bericht auf dem Schirm). */
function linaTalk(key, tries) {
  const seen = (S.tutSeen = S.tutSeen || {});
  if (seen[key] || !LINA_TALKS[key]) return;
  const busy = !playing() || !(S.tut && S.tut.done) || tutorialRunning() || S.jail || S.over
    || document.body.classList.contains("report-open") || document.body.classList.contains("dragging-staff");
  if (busy) {
    if ((tries || 0) < 30) setTimeout(() => linaTalk(key, (tries || 0) + 1), 4000);
    return;
  }
  tutList = LINA_TALKS[key]; tutKey = key; tutStep = 0;
  if (key === "bases" || key === "base1") { if (planState) closeModal(); if (activeTab !== "bases") showTab("bases"); $("#view .view-body").scrollTop = 0; }
  showTutStep();
}
/* Beim Öffnen des Büro-Reiters: passendes Gespräch, falls noch nicht gehört */
function tutTabHook(name) {
  if (name !== "bases" || !S.tut || !S.tut.done || tutorialRunning() || tutKey !== "main") return;
  const seen = S.tutSeen || {};
  if ((S.bases || []).length) { if (!seen.base1) setTimeout(() => linaTalk("base1"), 350); }
  else if (!seen.bases) setTimeout(() => linaTalk("bases"), 350);
}
/* Unter „Welt“: ein Gespräch noch einmal hören */
function replayTalk(key) {
  if (!S.tutSeen) S.tutSeen = {};
  if (key === "offices") {
    delete S.tutSeen.bases; delete S.tutSeen.base1;
    return linaTalk((S.bases || []).length ? "base1" : "bases");
  }
  delete S.tutSeen[key];
  linaTalk(key);
}
