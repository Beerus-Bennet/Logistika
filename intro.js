/* =========================================================================
   LOGISTIKA – Charaktererstellung, Firmengründung und Tutorial
   ========================================================================= */
"use strict";

const COMPANY_COLORS = ["#2f6fed", "#19b8c9", "#20a97a", "#f2a33c", "#e2465f", "#7c5cff"];

const ORIGINS = [
  { id: "kurier", name: "Fahrradkurier", cash: 58000, gift: "v-bullitt",
    text: "Du kennst jede Abkürzung zwischen Mitte und Neukölln. Dein Lastenrad bringst du mit." },
  { id: "kaufmann", name: "Speditionskaufmann", cash: 65000, gift: null,
    text: "Zehn Jahre Disposition bei einer großen Spedition. Jetzt auf eigene Rechnung." },
  { id: "erbe", name: "Werkstatterbe", cash: 36000, gift: "v-caddy",
    text: "Der Hof deines Onkels gehört jetzt dir – samt Kastenwagen und Ölflecken." }
];

const NAME_POOL = ["Mara", "Jonas", "Lea", "Timo", "Nora", "Elias", "Frida", "Kian", "Alma", "Bosse"];
const FIRM_POOL = ["Nordpfeil Logistik", "Spree Fracht", "Kompass Transporte", "Achse & Anker",
                   "Blaufracht", "Weitwind Spedition", "Kurs Nord", "Pendel Logistik"];

const INTRO = {
  step: 0,
  draft: null
};

/* ---------------------- Eigene Artwork für die Disponentin ---------------
   Liegt unter art/lina.png eine Bilddatei, wird sie statt der SVG-Figur
   verwendet – Hochformat, freigestellt (PNG oder WebP mit Transparenz).
   Fehlt sie, zeichnet das Spiel die Figur wie bisher selbst.             */
const GUIDE_ART = "art/lina.png";
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
    ? `<img class="guide-art" src="${guideArt}" alt="${GUIDE.name}">`
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
    const mode = d.mode === "preset" ? "preset" : "build";
    body = `
      <div class="intro-card">
        <div class="intro-h">Wer bist du?</div>
        <div class="intro-p">Aus der Sicht dieser Figur läuft das ganze Spiel.</div>
        <div class="av-stage"><div class="frame">${portraitHTML(a, 170, { uid: "big", bgColor: COMPANY_COLORS[d.color] + "33" })}</div></div>

        <div class="modeswitch">
          <button data-mode="build" class="${mode === "build" ? "on" : ""}">✏️ Selbst gestalten</button>
          <button data-mode="preset" class="${mode === "preset" ? "on" : ""}">🧑 Fertige Figur</button>
        </div>

        ${mode === "build" ? `<div class="pickers">
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
             <b>art/player/w1.png</b> bis <b>m4.png</b> ab – sie erscheinen dann hier zur Auswahl.
             Das Format steht in <b>art/player/README.md</b>.</div>`}

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
              const gift = o.gift ? vType(o.gift) : null;
              return `<button class="origin ${i === d.origin ? "on" : ""}" data-origin="${i}">
                <b>${o.name}</b><small>${o.text}</small>
                <span class="cash">${money(o.cash)}${gift ? " + " + gift.icon + " " + esc(gift.name) : ""}</span>
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
          Ohne Fahrzeug keine Spedition. Kauf dir mindestens eins, dann melden wir
          den Betrieb an und die Karte geht auf.
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
    if (b.dataset.mode === "build") INTRO.draft.avatar.art = null;
    else if (!INTRO.draft.avatar.art) {
      const first = PLAYER_ART_SLOTS.find(sl => playerArtSrc(sl.id));
      if (first) INTRO.draft.avatar.art = first.id;
    }
    renderIntro();
  });
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
  const d = INTRO.draft;
  const o = ORIGINS[d.origin];
  S.player = JSON.parse(JSON.stringify(d));
  S.phase = "founding";
  S.money = o.cash;
  S.revenue = 0; S.expense = 0;
  S.fleet = [];
  if (o.gift) {
    const v = makeVehicle(o.gift, false);
    v.gift = true;
    S.fleet.push(v);
  }
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

/* ------------------------------ Tutorial -------------------------------- */
const TUT_STEPS = [
  { tx: "Moin! Ich bin Lina, deine Disponentin. Eine Minute, dann kennst du den Laden. Die Uhr steht solange still." },
  { tx: "Das hier ist deine Karte. Jedes Fahrzeug fährt live über das echte Straßen-, Schienen- und Wassernetz.",
    top: true, before: () => showTab("map") },
  { tx: "Alles Dunkle ist noch unerschlossen. Mit jedem Level und jeder Etappe lichtet sich der Nebel.",
    target: "#fogBtn", pad: 6, top: true, before: () => showTab("map") },
  { tx: "Unten wechselst du die Ansicht. Unter „Aufträge“ laufen die Ausschreibungen ein.",
    target: '[data-tab="orders"]', pad: 6, before: () => showTab("orders") },
  { tx: "Jede Zeile ist ein Angebot: Ladung, Strecke, Erlös und Frist. Tipp eine an – dann öffnet sich die Planung.",
    target: "#tab-orders .card.order", pad: 5, before: () => showTab("orders") },
  { tx: "In der Planung wählst du für jede Teilstrecke ein Fahrzeug. Unten stehen Kosten, Laufzeit und Deckungsbeitrag. "
      + "Ist der grün, lohnt sich die Fahrt – dann auf „Auftrag annehmen“.",
    before: () => showTab("orders") },
  { tx: "Leerfahrten, Standzeiten und Tagesfixkosten gehen von der Marge ab. Fahr nie mit einem zu großen Fahrzeug los.",
    before: () => showTab("orders") },
  { tx: "Später mietest du unter „Büros“ einen Standort. Wer dort Personal einstellt, lässt sein Team disponieren – "
      + "und bekommt Anrufe aufs Diensttelefon.",
    target: '[data-tab="bases"]', pad: 6, before: () => showTab("map") },
  { tx: "Das war’s. Oben rechts hältst du das Spiel jederzeit an – ab jetzt läuft die Uhr. Viel Erfolg, und wenn’s brennt, bin ich auf Kanal 1.",
    target: "#pauseBtn", pad: 6, top: true, before: () => showTab("map") }
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
addEventListener("resize", () => { if (document.body.classList.contains("tut-on")) drawCloud(); });

let tutStep = 0;
function startTutorial() {
  if (S.tut && S.tut.done) return;
  tutStep = 0;
  showTutStep();
}
function endTutorial() {
  S.tut = { done: true };
  document.body.classList.remove("tut-on");
  if (typeof renderPause === "function") renderPause();
  $("#tutor").classList.remove("on");
  $("#tutor").innerHTML = "";          /* keine unsichtbaren Knöpfe zurücklassen */
  $("#spot").classList.remove("on");
  $("#spot").innerHTML = "";
  save();
}

function showTutStep() {
  const st = TUT_STEPS[tutStep];
  if (!st) return endTutorial();
  if (st.before) st.before();

  const tutor = $("#tutor"), spot = $("#spot");
  document.body.classList.add("tut-on");
  tutor.classList.toggle("top", !!st.top);
  tutor.classList.add("on");
  tutor.innerHTML = `
    <div class="tut-box">
      <div class="tut-fig">${guideFigure(300, "t" + tutStep)}</div>
      <div class="tut-bubble">
        <svg class="tut-cloud" aria-hidden="true" preserveAspectRatio="none"></svg>
        <div class="tut-in">
          <div class="tut-who">${GUIDE.name} · ${GUIDE.role}</div>
          <div class="tut-tx">${st.tx}</div>
          <div class="tut-row">
            <button class="btn" id="tutNext">${tutStep === TUT_STEPS.length - 1 ? "Alles klar" : "Weiter"}</button>
            <button class="tut-skip" id="tutSkip">überspringen</button>
          </div>
        </div>
      </div>
    </div>`;
  drawCloud();
  requestAnimationFrame(drawCloud);
  $("#tutNext").onclick = () => { tutStep++; showTutStep(); };
  $("#tutSkip").onclick = endTutorial;

  /* Scheinwerfer auf das passende Element. Das Ziel wird erst im Moment des
     Messens gesucht: Listen bauen sich zwischendurch neu auf, und ein Element
     von vorhin liefert dann eine Größe von null – daraus wurde früher ein
     winziges Rechteck in der Ecke. */
  if (st.target) {
    const place = () => {
      const el = document.querySelector(st.target);
      const hide = () => { spot.classList.remove("on"); spot.innerHTML = ""; };
      if (!el) return hide();
      const r = el.getBoundingClientRect();
      if (r.width < 12 || r.height < 12) return hide();
      const p = st.pad == null ? 6 : st.pad;
      const w = r.width + p * 2, h = r.height + p * 2;
      /* Ein Rahmen um den halben Bildschirm erklärt nichts – dann lieber keiner. */
      if (w * h > window.innerWidth * window.innerHeight * 0.4) return hide();
      spot.classList.add("on");
      spot.innerHTML = `<i style="left:${Math.max(2, r.left - p)}px;top:${Math.max(2, r.top - p)}px;
        width:${Math.min(w, window.innerWidth - 4)}px;height:${Math.min(h, window.innerHeight - 4)}px"></i>`;
    };
    setTimeout(place, st.before ? 360 : 0);
    return;
  }
  spot.classList.remove("on");
  spot.innerHTML = "";
}
