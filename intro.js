/* =========================================================================
   LOGISTIKA – Charaktererstellung, Firmengründung und Tutorial
   ========================================================================= */
"use strict";

const COMPANY_COLORS = ["#2f6fed", "#19b8c9", "#20a97a", "#f2a33c", "#e2465f", "#7c5cff"];

/* Klein anfangen: wenig Geld, dafür ein, zwei Fahrzeuge aus der Vorgeschichte. */
/* Die drei Kurierstarts bleiben für ältere Spielstände erhalten, werden
   aber nicht mehr angeboten: Seit v36 startet jeder als Erbe. */
const ORIGINS = [
  { id: "kurier", name: "Fahrradkurier", cash: 1000, gifts: ["v-bullitt", "v-bullitt"], hidden: true,
    text: "Du kennst jede Abkürzung zwischen Mitte und Neukölln. Zwei Lastenräder bringst du mit." },
  { id: "roller", name: "Rollerkurier", cash: 1000, gifts: ["v-simson", "v-simson"], hidden: true,
    text: "Jahrelang Pizza und Apothekenfahrten – jetzt auf eigene Rechnung, mit zwei Mopeds." },
  { id: "erbe", name: "Werkstatterbe", cash: 1000, gifts: ["v-caddy"], hidden: true,
    text: "Der Hof deines Onkels gehört jetzt dir – samt Kastenwagen und Ölflecken." },
  { id: "hof", name: "Obsthof-Erbe", farm: "hof", icon: "🌾", cash: 500, gifts: ["v-bullitt", "v-simson"],
    text: "Opa Hinrichs kleiner Hof bei Werder (Havel): Felder, Obst, Hühner – dahinter Wald, Sägewerk und See." },
  /* frühere Ostsee-Fischerei: nur noch für alte Spielstände (werden zum Hof) */
  { id: "fisch", name: "Fischerei-Erbe", farm: "hof", icon: "🐟", cash: 500, gifts: ["v-bullitt", "v-simson"], hidden: true,
    text: "Die frühere Ostsee-Fischerei – heute ist daraus Opas Hof geworden." }
];
const ORIGIN_DEFAULT = 3;
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
    origin: ORIGIN_DEFAULT, color: 0,
    avatar: avRandom()
  };
  INTRO.draft.avatar.acc = 0;
  INTRO.step = S.phase === "founding" ? 3 : 0;
  if (S.phase === "founding" && S.player) INTRO.draft = JSON.parse(JSON.stringify(S.player));
  /* Spielstand steckt noch in der Gründung eines Hofs: gleich auf den Hof */
  if (S.phase === "founding" && S.player && ORIGINS[S.player.origin] && ORIGINS[S.player.origin].farm && S.fleet.length) {
    $("#intro").classList.add("on");
    finishFounding();
    return;
  }
  $("#intro").classList.add("on");
  renderIntro();
}

function renderIntro() {
  const el = $("#intro");
  const d = INTRO.draft;
  const farmStart = ORIGINS[d.origin] && ORIGINS[d.origin].farm;
  const dots = (farmStart ? [0, 1, 2] : [0, 1, 2, 3]).map(i => `<i class="${i === INTRO.step ? "on" : ""}"></i>`).join("");
  let body = "";

  /* ---------- 0: Willkommen ---------- */
  if (INTRO.step === 0) {
    body = `
      <div class="intro-card">
        <div class="intro-h">Ein Brief vom Notar</div>
        <div class="intro-p">
          Du hast Opas Hof an der Havel geerbt! Felder, Wald, Sägewerk, Fischerei –
          und später eine Spedition. Zuerst: Gesicht und Name.
        </div>
      </div>
      <div class="intro-card greet">
        <div class="greet-fig">${guideFigure(150, "g0")}</div>
        <div class="greet-tx">
          <b>${GUIDE.name}</b><span>Nachbarin · fährt die Ware aus</span>
          <div class="intro-p">„Moin! Ich zeig dir gleich alles.“</div>
        </div>
      </div>
      <div class="intro-btns"><button class="btn go" id="iNext">Los geht’s</button></div>`;
  }

  /* ---------- 1: Charakter ---------- */
  if (INTRO.step === 1) {
    const a = d.avatar;
    const slots = PLAYER_ART_SLOTS.filter(sl => playerArtSrc(sl.id));
    /* v57: kein Selbstgestalten mehr – fertige Figur (Standard) oder aus einem Foto */
    const mode = d.mode === "photo" ? "photo" : "preset";
    if (mode === "preset" && !a.art && slots.length) a.art = slots[0].id;
    body = `
      <div class="intro-card">
        <div class="intro-h">Wer bist du?</div>
        <div class="intro-p">Aus der Sicht dieser Figur läuft das ganze Spiel.</div>
        <div class="av-stage"><div class="frame">${portraitHTML(a, 170, { uid: "big", bgColor: COMPANY_COLORS[d.color] + "33" })}</div></div>

        <div class="modeswitch">
          <button data-mode="preset" class="${mode === "preset" ? "on" : ""}">🧑 Fertige Figur</button>
          <button data-mode="photo" class="${mode === "photo" ? "on" : ""}">📸 Aus Foto</button>
        </div>

        ${mode === "photo" ? photoEditorHTML(!!a.photo)
        : slots.length ? `<div class="artgrid">
            ${slots.map(sl => `<button class="artpick${a.art === sl.id ? " on" : ""}" data-art="${sl.id}"
               title="${esc(sl.label)}"><img src="${playerArtSrc(sl.id)}" alt="${esc(sl.label)}"></button>`).join("")}
          </div>
          <div class="intro-p small">Tipp die Figur an, die du spielen willst.</div>`
        : `<div class="hintbox">Die Figuren werden geladen …</div>`}

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
        <div class="intro-h">Dein Erbe</div>
        <div class="intro-p">Name, Hausfarbe und Erbe. Der Name kommt auch auf deine Lkw.</div>
        <div class="field">
          <label for="iFirm">Name deines Betriebs</label>
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
          <label>Was hast du geerbt?</label>
          <div class="origins">
            ${ORIGINS.map((o, i) => {
              if (o.hidden) return "";
              const gift = giftText(o);
              return `<button class="origin ${i === d.origin ? "on" : ""}${o.soon ? " soon" : ""}" data-origin="${i}" ${o.soon ? "disabled" : ""}>
                <b>${o.icon ? o.icon + " " : ""}${o.name}${o.soon ? ` <em class="soonchip">kommt bald</em>` : ""}</b><small>${o.text}</small>
                ${o.soon ? "" : `<span class="cash">${money(o.cash)}${gift ? " + " + esc(gift) : ""}</span>`}
              </button>`;
            }).join("")}
          </div>
        </div>
      </div>
      <div class="intro-btns">
        <button class="btn ghost" id="iBack">Zurück</button>
        <button class="btn go" id="iNext">Erbe antreten</button>
      </div>`;
  }

  /* ---------- 3: Gründung ---------- */
  if (INTRO.step === 3) {
    const startVehicles = VEHICLES.filter(v => v.stage === 1 && !v.special);
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
          ${ORIGINS[S.player.origin].farm ? `Opas Lastenrad und Simson stehen bereit – für Werder, Glindow und Potsdam.
          Ein Auto gibt’s im Markt.`
          : `Deine Fahrzeuge stehen schon im Hof. Mehr gibt es jederzeit im Markt.`}
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
        <button class="btn go${S.fleet.length ? "" : " disabled"}" id="iFound">${ORIGINS[S.player.origin].farm ? "Hof übernehmen" : "Firma gründen"}</button>
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

  $$("#intro [data-mode]").forEach(b => b.onclick = () => {
    INTRO.draft.mode = b.dataset.mode;
    if (b.dataset.mode !== "photo") { delete INTRO.draft.avatar.photo; photoForget(); }
    if (b.dataset.mode === "photo") INTRO.draft.avatar.art = null;
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

  $$("#intro [data-color]").forEach(b => b.onclick = () => { d.color = +b.dataset.color; renderIntro(); });
  $$("#intro [data-origin]").forEach(b => b.onclick = () => { if (ORIGINS[+b.dataset.origin].soon) return; d.origin = +b.dataset.origin; renderIntro(); });
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
  /* Erben brauchen keinen Fahrzeugkauf – Lastenrad und Simson stehen schon im Schuppen */
  if (o.farm) { finishFounding(); return; }
  INTRO.step = 3;
  renderIntro();
  save();
}

function finishFounding() {
  if (!S.fleet.length || S.phase === "play") return;
  S.phase = "play";
  S.time = 6 * 60;
  S.lastDay = 0;
  document.body.classList.remove("locked");
  $("#intro").classList.remove("on");
  /* Erbe eines Hofs: Start auf dem Hof, die Spedition kommt später */
  const org = ORIGINS[S.player.origin];
  if (org && org.farm && typeof farmNew === "function") {
    farmNew(org.farm);
    farmBodyClasses();
    const fa = farmAddr();
    S.fleet.forEach(f => { f.at = FARM_NODE; f.spot = { lat: fa.lat, lon: fa.lon, t: "Stellplatz am Schuppen, " + fa.t, a: fa.a }; f.spotAt = FARM_NODE; });
    clearRouteCache();
    buildNetBuffers();
    showTab("farm");
    map.setView(FARM_VIEW.center, FARM_VIEW.zoom);
    renderFogNote(fogRadiusKm(S.stage, level()));
    save();
    toast(FT().welcome(S.player.name), "ok");
    return;
  }
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
  { tx: () => S.farm ? "Jetzt wird’s eine Spedition, Chef! Ich bin deine Disponentin – "
      + "wir machen den ersten Auftrag zusammen. Die Uhr steht still."
      : "Moin! Ich bin Lina, deine Disponentin – "
      + "wir machen den ersten Auftrag zusammen. Die Uhr steht still." },
  { tx: () => {
      const f = tutVeh();
      return "Deine Karte – der Nebel lichtet sich mit jedem Level. "
        + (f ? `Hier steht dein ${tvIcon()} ${esc(tvName())}: ${esc(vehSpot(f).t)}, ${esc(N[f.at].short)}. ` : "")
        + "<b>Der Standort entscheidet über Gewinn oder Verlust.</b>";
    },
    target: tutVehRect,
    before: () => {
      showTab("map");
      const f = tutVeh();
      if (f) { const p = vehPos(f) || [N[f.at].lat, N[f.at].lon]; map.setView(p, Math.max(12.6, Math.min(13.4, map.zoom))); }
    } },

  /* ---------- mit Übungsauftrag ---------- */
  { need: "order",
    tx: () => "Stecknadeln: <b>Gelb</b> = offener Auftrag, "
      + "<b>Orange</b> = in Arbeit. Meine Übung liegt neben deinem "
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
      return `Unter „Aufträge“ liegt oben meine ⭐ Übung: `
        + `${CARGO[o.cargo].name} von ${esc(N[o.from].short)} nach ${esc(N[o.to].short)}.`;
    },
    target: tutOrderCard, before: () => { showTab("orders"); $("#view .view-body").scrollTop = 0; } },
  { need: "order",
    tx: () => `Dein <b>Leerfahrt-Radar</b>: ✅ Fahrzeug schon am Abholort. `
      + `↩️ Muss erst leer hin – das zahlst du. `
      + `🚫 Keins frei.`,
    target: () => document.querySelector("#tab-orders .card.order.tut .vhintrow") },
  { id: "pick", need: "order",
    tx: "Jetzt du: Tipp auf den ⭐ Übungsauftrag.",
    target: tutOrderCard, waitFor: "openPlanner",
    before: () => { if (activeTab !== "orders") showTab("orders"); $("#view .view-body").scrollTop = 0; },
    already: () => planState && planState.order.id === tutOrderId },
  { need: "order", inPlanner: true, top: false,
    tx: () => {
      const r = tutRepoSel();
      return `Minikarte: 📦 Abholung, 🏁 Ziel, deine Fahrzeuge. `
        + (r.km < 0.5
          ? `Dein ${esc(tvName())} steht schon dort: <b>keine Linie = keine Leerfahrt.</b>`
          : `Gestrichelt = Leerfahrt: ${kmf(r.km)} auf deine Kosten.`);
    },
    target: "#modalBody .pmap" },
  { need: "order", inPlanner: true, top: false,
    tx: () => tutEligibleCount() > 1
      ? "Fahrzeugwahl: Das nächste steht oben. "
        + "Tipp ruhig ein anderes an – die Karte zeigt dann die Leerfahrt."
      : `Hier wählst du das Fahrzeug. `
        + `Dein ${esc(tvName())} ist schon da: ✅ vor Ort.`,
    target: "#modalBody .vpick", allow: () => tutEligibleCount() > 1 },
  { need: "order", inPlanner: true, top: true,
    tx: () => {
      const r = tutRepoSel();
      return "Erlös minus Kosten = <b>Deckungsbeitrag</b>. Grün = lohnt sich. "
        + (r.eur > 0.005
          ? `Die Leerfahrt frisst ${money(r.eur)} davon.`
          : "Ohne Leerfahrt bleibt am meisten.");
    },
    target: "#modalBody .sum" },
  { id: "accept", need: "order", inPlanner: true, top: true,
    tx: "Passt? Dann tipp auf „Auftrag annehmen“.",
    target: "#modalBody #mAccept", waitFor: "orderAccepted" },

  { id: "accepted", need: "job",
    tx: () => `Angenommen! Unter „Live“ verfolgst du ihn – `
      + `gleich fährt dein ${tvIcon()} ${esc(tvName())} los.`,
    target: () => { const j = tutJob(); return j && document.querySelector(`#tab-jobs .card.job[data-job="${j.id}"]`); },
    before: () => showTab("jobs") },
  { need: "job",
    tx: () => {
      const j = tutJob(), nx = S.orders.find(o => o.tutNext);
      return `Profi-Trick: Danach steht dein ${esc(tvName())} in `
        + `${esc(N[j.order.to].short)}. <b>Nimm einen Auftrag, der dort startet.</b> `
        + (nx ? `Einer liegt bereit ⭐ – ist dein ${esc(tvName())} dort, wird er grün. ` : "")
        + `„📍 Leerfahrt“ oben sortiert solche nach vorn.`;
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
    tx: "Unter „Aufträge“ kommen die Ausschreibungen. Für eine Übung ist kein Fahrzeug frei – "
      + "also kurz so:",
    target: '[data-tab="orders"]', before: () => showTab("orders") },
  { need: "none",
    tx: "<b>Leerfahrt-Radar</b>: ✅ Fahrzeug am Abholort, ↩️ muss erst leer "
      + "hin, 🚫 keins frei. "
      + "Gestrichelt auf der Minikarte = Leerfahrt.",
    target: "#tab-orders .card.order .vhintrow" },

  { tx: "„Flotte“ zeigt, wo deine Fahrzeuge stehen. Verteil sie auf "
      + "Stadtteile – dann ist immer eins nah.",
    target: '[data-tab="fleet"]', before: () => showTab("map") },
  { tx: "Später mietest du unter „Büros“ einen Standort – mit "
      + "<b>Disposition</b> fahren die Fahrzeuge dort von allein.",
    target: '[data-tab="bases"]', before: () => showTab("map") },
  { tx: "Dein <b>Diensthandy</b>: Hier meldet sich dein Team. "
      + "Nachrichten verschwinden nach <b>24 Stunden</b>.",
    target: "#phoneBtn", top: true, before: () => showTab("map") },
  { tx: "Fertig! ⏸ links hält an, 1× bis 30× regeln das Tempo. Ab jetzt läuft die Uhr – viel Erfolg!",
    target: '#controls [data-speed="0"]', before: () => showTab("map") }
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
  tutBlock(null, false, null, true);   /* in der Pause dazwischen ist alles gesperrt – das Abdunkeln bleibt,
                                          sonst blitzt kurz die helle Seite dahinter auf */
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
function tutBlock(hole, open, ring, keep) {
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
  if (ring) set(i, ring.left, ring.top, ring.width, ring.height); else if (!keep) i.style.display = "none";
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
    { tx: "Psst, Chef! <b>Mr. Snus</b> hat sich auf dem Diensttelefon gemeldet – er verkauft Snus unter der Hand.",
      target: "#phoneBtn", top: true },
    { tx: () => `Einkauf: ${money(SNUS_BUY)} die Dose, nur per <b>Nachtwallet in Solana</b> ◎ (zum Senden wischen). Abholen im Späti. `
        + `<b>Graue Aufträge</b> zahlen ${money(SNUS_SELL)} die Dose.` },
    { tx: () => `Vorsicht, <b>Zivilfahnder</b>: zahlen mehr als ${money(SNUS_SELL)} und wollen 20, 30 Dosen. `
        + `Sicheres Zeichen: <b>weißes Hemd UND glatt rasiert</b>. `
        + `Nur eins davon? Dann echt.` },
    { tx: () => `Lieferst du an einen Fahnder: Ware und Geld weg, <b>${SNUS_JAIL_DAYS} Tage Haft</b>. `
        + "✕ blockiert Kunden gratis, unter „Live“ brichst du Übergaben ab." },
    { tx: "Dein Büro-Team beliefert Snus-Kunden mit – "
        + "Verdächtige lässt es liegen und fragt dich." }
  ],
  extras: [
    { tx: "Hier oben: 🎯 deine <b>Ziele</b> – täglich drei Aufgaben mit Prämie, dazu Missionen und Erfolge.",
      target: "#goalsBtn", top: true },
    { tx: "<b>Blitzfracht</b> und <b>Rabe &amp; Söhne</b> schnappen dir Aufträge weg – die Karte zeigt, wann. "
        + "Bei Großaufträgen verhandelst du im Planer." },
    { tx: "Pannen, Staus, Streiks: Dann ruft jemand an. Solange offen, max. 3× – "
        + "sonst entscheidet bald der Fahrer.", target: "#phoneBtn", top: true },
    { tx: "Verschleiß: Unter „Flotte“ schickst du Fahrzeuge in die Werkstatt. "
        + "„Welt“ zeigt Ruf, Diesel, Hausbank und Steuern." },
    { tx: "Selten kommt eine <b>Einladung zur Sonderfahrt</b>: eilig, fürstlich bezahlt, nur für dich." }
  ],
  pablo: [
    { tx: "Chef … <b>Don Pablo</b> ist am Telefon. Kokain, tonnenweise.",
      target: "#phoneBtn", top: true },
    { tx: () => `Einkauf: ${money(PABLO_BUY * 1000)} pro Tonne, per Nachtwallet in Solana ◎. Ware im Flughafen-Hangar. `
        + `Kunden zahlen ${money(PABLO_SELL * 1000)} pro Tonne.` },
    { tx: "Echte Kunden heißen wie ihre Stadt (<b>Mr. Hamburg</b>, <b>Mr. Paris</b>) und wollen genau dorthin." },
    { tx: "<b>Mr. Banane</b>, <b>Mr. Schnitzel</b>? Interpol! Lieferst du da hin, "
        + "ist das Spiel endgültig vorbei." },
    { tx: "Ich hab dich gewarnt. Seine Nachricht liegt auf dem Telefon.", target: "#phoneBtn", top: true }
  ],
  bases: [
    { tx: "Ein <b>Büro</b> ist ein Stützpunkt: Dein Team nimmt dort selbst Aufträge an "
        + "und schickt die zugeordneten Fahrzeuge los.",
      target: "#tab-bases .card", wait: 420 },
    { tx: "Ein Standort pro Etappe. Stadtteile sind günstig, Häfen, Flughäfen "
        + "und Terminals teurer, aber besser angebunden.",
      target: "#newBaseNode" },
    { tx: "Fünf Größen von <b>Kontor</b> bis <b>Konzernzentrale</b>. 👥 Schreibtische, 🚚 Stellplätze, "
        + "📡 Einzugsgebiet.",
      target: "#tab-bases .tierlist .tier" },
    { tx: "Kaufen kostet einmalig, Miete wird monatlich abgebucht. Zum Mieten brauchst du "
        + "30 Tagesmieten auf dem Konto.",
      target: "#tab-bases .tierlist .tier .buyrow" },
    { tx: "Steht dein erstes Büro, zeig ich dir den Rest." }
  ],
  base1: [
    { tx: () => { const b = S.bases[0]; return `Dein erstes Büro${b ? " in " + esc(N[b.node].name) : ""}! Oben: Größe, `
        + "Miete oder Kauf, Monatskosten."; },
      target: "#tab-bases .card.base .card-top", wait: 420 },
    { tx: "Der Grundriss: Tipp drauf zum Einrichten. "
        + "Jedes Möbelstück hebt die Stimmung.",
      target: "#tab-bases .card.base .planpeek" },
    { tx: "Die <b>Stimmung</b>: Unter 70 % gibt’s Streit – "
        + "dann steht der Standort, bis du entscheidest.",
      target: "#tab-bases .card.base .moodbar" },
    { tx: "Vier Stellen im Büro – die Zahl ist die Summe der Sterne darin. "
        + "Kurz einzeln:", target: "#tab-bases .card.base .covrow" },
    { tx: () => ROLE_TEXT.disp, target: '#tab-bases .card.base .cov[data-role="disp"]' },
    { tx: () => ROLE_TEXT.fahr, target: '#tab-bases .card.base .cov[data-role="fahr"]' },
    { tx: () => ROLE_TEXT.ums, target: '#tab-bases .card.base .cov[data-role="ums"]' },
    { tx: () => ROLE_TEXT.zoll + " Tipp später auf eine Stelle, dann erklär ich sie nochmal.",
      target: '#tab-bases .card.base .cov[data-role="zoll"]' },
    { tx: "Täglich neue <b>Bewerbungen</b>: Sterne = Können, rechts die Gebühr. "
        + "🤝 stellt ein.",
      target: () => $("#tab-bases .card.base .staff.cand") || baseHead(1)() },
    { tx: "Dein <b>Team</b>: Misch die Rollen und hab genug Leute, "
        + "sonst gibt’s Streit. ✕ oder Mülleimer kündigt – "
        + "Abfindung: zwei Wochenlöhne.",
      target: baseHead(0) },
    { tx: "Hier ordnest du <b>Fahrzeuge</b> zu (oder unter „Flotte“). "
        + "Den Rest disponierst du selbst.",
      target: () => $("#tab-bases .card.base .assignrow") || baseHead(2)() },
    { tx: "Zieh Fahrpersonal auf ein Fahrzeug – dann fährt es fest und schneller. "
        + "Die Leiste unten zeigt, wo du loslässt.",
      target: () => $("#tab-bases .card.base .staff.veh") || baseHead(2)() },
    { tx: "Kennzahlen: Plätze, Fahrzeuge, Gebiet, Löhne (täglich) "
        + "und Miete (monatlich).",
      target: "#tab-bases .card.base .meta.small" },
    { tx: "Hier vergrößerst du. Kündigen oder Verkaufen löscht Team und Einrichtung.",
      target: "#tab-bases .card.base .baserow" },
    { tx: "Das war’s! Gutes Team, schönes Büro – dann läuft’s fast von allein." }
  ]
};

/* Die vier Stellen im Büro – Lina erklärt sie im Büro-Rundgang und
   auf Zuruf, wenn man im Büro auf eine Stelle tippt. */
const ROLE_TEXT = {
  get disp() { return `${ROLES.disp.icon} <b>Disposition</b> nimmt Aufträge im Einzugsgebiet an und schickt Fahrzeuge – `
    + "ohne sie läuft nichts. ★★★ schafft rund zehn Fahrzeuge, Check alle 25 Minuten."; },
  get fahr() { return `${ROLES.fahr.icon} <b>Fahrpersonal</b>: wie viele Fahrzeuge gleichzeitig rollen. Fest zugeteilt `
    + "pro Stern 2 % schneller. Zu wenige Leute drücken die Stimmung."; },
  get ums() { return `${ROLES.ums.icon} <b>Umschlag</b>: bis zu ⅓ weniger Standzeit. `
    + "Lohnt sich an Häfen, Flughäfen, Terminals."; },
  get zoll() { return `${ROLES.zoll.icon} <b>Zoll &amp; Papiere</b>: bis zu 12 % Zuschlag auf Büro-Aufträge. `
    + "Ab Etappe 4 macht sie die Zollpapiere – "
    + "und gibt dir einen Tipp plus 10 Sekunden."; }
};
function roleHere(r, b) {
  if (!b) return "";
  const where = esc(N[b.node].short), n = roleCount(b, r), pw = rolePower(b, r);
  if (!n) return `In ${where} ist die Stelle noch frei – schau unter „Bewerbungen“.`;
  const who = `${n} ${n === 1 ? "Person" : "Leute"} mit zusammen ${pw} ★`;
  if (r === "disp") return `In ${where}: ${who} – reicht für <b>${dispCap(b)} Fahrzeuge</b>, Check alle <b>${dur(dispatchInterval(b))}</b>.`;
  if (r === "fahr") return `In ${where}: ${who}. <b>${driverCap(b)} Fahrzeuge</b> gleichzeitig, ${assignedDriverIds(b).size} fest zugeordnet.`;
  if (r === "ums") return `In ${where}: ${who}. Laden und Löschen <b>${Math.round((1 - umschlagFactor(b.node)) * 100)} %</b> schneller.`;
  return `In ${where}: ${who}. <b>+${Math.round(baseBonus(b) * 100)} %</b> auf jeden Büro-Auftrag${tierOf(b).prestige ? " (inkl. Prestige)" : ""}.`;
}
function linaRole(r, baseId) {
  const b = baseById(baseId);
  const target = `#tab-bases .card.base .cov[data-role="${r}"][data-rolebase="${baseId}"]`;
  LINA_TALKS["role_" + r] = [{ tx: () => ROLE_TEXT[r], target }, { tx: () => roleHere(r, b), target }];
  if (S.tutSeen) delete S.tutSeen["role_" + r];
  linaTalk("role_" + r);
}

/* Startet ein Gespräch, sobald Platz dafür ist (kein anderes Tutorial,
   keine Haft, kein Bericht auf dem Schirm). */
function linaTalk(key, tries) {
  const seen = (S.tutSeen = S.tutSeen || {});
  if (seen[key] || !LINA_TALKS[key]) return;
  /* Auf dem Hof stört Lina nicht – sie wartet, bis man zur Spedition wechselt */
  if (playing() && activeTab === "farm") { setTimeout(() => linaTalk(key, tries), 4000); return; }
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
