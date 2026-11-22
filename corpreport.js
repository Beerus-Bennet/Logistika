/* v355: Kaufbeleg aus dem gespeicherten Ergebnis, mit lesbarer mobiler Übersicht. */
"use strict";
function corpWinReport(ev) {
  if (document.getElementById("corpShow")) return;
  const r = rivalById(ev.id), receipt = ev.assets ? ev : corp().owned[ev.id] && corp().owned[ev.id].receipt353;
  const d = receipt || ev, name = d.name || r && r.name || "Unternehmen";
  const company = d.company || S.player.company, previous = document.activeElement;
  const summary = d.assets ? corpDealSummary(d.assets) : null;
  const group = d.group || { count: Object.keys(corp().owned).length,
    vehicles: Object.values(corp().owned).reduce((n, o) => n + (o.veh || 0), 0),
    paid: Object.values(corp().owned).reduce((n, o) => n + (o.price || 0), 0) };
  /* v448: Markanter Übernahmebeleg mit klarer Preis-/Kennzahlenhierarchie.
     Ausschließlich Darstellung des gespeicherten Kaufpakets, keine Neuberechnung. */
  const num=(n,digits=0)=>Number(n||0).toLocaleString("de-DE",{maximumFractionDigits:digits});
  const icons={
    fleet:'<path d="M3 6h11v10H3zM14 10h4l3 4v2h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    team:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v2"/>',
    site:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    share:'<path d="M4 4v16h16M7 15l4-4 4 2 5-7M16 6h4v4"/>',
    orders:'<path d="M7 4H4v17h16V4h-3M8 3h8v4H8zM8 12h8M8 16h5"/>',
    rep:'<path d="m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1Z"/>'
  };
  const stat=(value,label,icon,unit="")=>`<div class="crp2-kpi${value.length>6?' crp448-compact':''}"><span class="crp448-kpi-value"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[icon]}</svg><b>${esc(value)}</b></span>${unit?`<span class="crp448-unit">${esc(unit)}</span>`:''}<small>${esc(label)}</small></div>`;
  const row = (label, value) => `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
  const el = document.createElement("div");
  el.id = "corpShow"; el.className = "cs-receipt";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "crpTitle"); el.tabIndex = -1;
  el.innerHTML = `<div class="crp-sheet crp2 crp448">
    <header class="crp-mast"><span>LOGISTIK-KURIER<span class="crp448-document">Kaufbeleg</span></span><small>${esc(stamp(d.at == null ? S.time : d.at))}</small></header>
    <div class="crp2-body">
      <section class="crp2-head"><p><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg></i>Übernahme abgeschlossen</p>
        <h2 id="crpTitle">${esc(name)}</h2><span>Jetzt Teil von <strong>${esc(company)}</strong></span></section>
      <div class="crp2-price"><span>Kaufpreis</span><b>${esc(money(d.price))}</b><svg class="crp448-price-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M12 9h30l10 10v36H12Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M42 9v12h10M21 30h21M21 37h15M21 45l5 4 13-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="crp2-kpis" aria-label="Bei diesem Kauf übernommen">
        ${stat("+"+num(d.veh),"Fahrzeuge","fleet")}${stat("+"+num(d.staff),"Mitarbeitende","team")}${stat(num(d.sites||1),(d.sites||1)===1?"Standort":"Standorte","site")}
        ${stat("+"+num(d.pct,1),"Marktanteil","share","%-Pkt.")}${stat("+"+num(d.cust),"Aufträge","orders")}${stat("+"+num(d.rep),"Ruf","rep")}
      </div>
      <dl class="crp2-rows">
        ${row("Firmensitz", esc(d.hq || "übernommen"))}
        ${row("Team", summary ? `Ø ${num(summary.skill,1)} von 5 · ${esc(money(summary.wages))} Löhne/Tag` : "übernommen")}
        ${row("Status", d.pending ? `${d.pending} Standorte bis zur Freischaltung reserviert` : "Eingerichtet, Team und Flotte zugeordnet")}
        ${row("Deine Gruppe", `${group.count} Übernahmen · ${group.vehicles} Fahrzeuge · <span class="crp448-money">${esc(money(group.paid))}</span>`)}
      </dl>
      ${d.assets ? `<button type="button" class="crp-inventory-open" aria-expanded="false" aria-controls="crpInventory">Bestand im Einzelnen ansehen <span aria-hidden="true">›</span></button>
      <section id="crpInventory" class="crp-inventory" aria-label="Übernommener Bestand" hidden><button type="button" class="crp-inventory-back">‹ Zurück zum Beleg</button><div class="crp-detail-content" tabindex="0" aria-label="Bestandsliste">${corpDealContents(d.assets)}</div></section>` : ""}
    </div>
    <footer class="crp-footer"><button type="button" class="btn crp-close">Zur Unternehmensübersicht →</button></footer>
  </div>`;
  document.body.appendChild(el); document.body.classList.add("cs-open");
  /* v367: Ein eigener begrenzter Flex-Bereich statt des anonymen Inhaltskastens
     von <details>. So scrollt auch die lange Flotte nativ per Finger; der
     Zurück-Knopf und die Unternehmensübersicht bleiben außerhalb der Liste. */
  const open = el.querySelector(".crp-inventory-open"), inventory = el.querySelector(".crp-inventory");
  if (open) {
    const back = inventory.querySelector(".crp-inventory-back"), body = el.querySelector(".crp2-body");
    open.onclick = () => { body.scrollTop = 0; inventory.hidden = false; body.classList.add("inventory-open"); open.inert = true; open.setAttribute("aria-expanded", "true"); back.focus({ preventScroll: true }); };
    back.onclick = () => { inventory.hidden = true; body.classList.remove("inventory-open"); open.inert = false; open.setAttribute("aria-expanded", "false"); open.focus({ preventScroll: true }); };
  }
  corpDialogBind356(el, ".crp-close", previous, true);
}

/* v356: Kompakte Konzernmeldung mit allen Kennzahlen auf einer Seite. */
function corpThreatReport(ev) {
  const rivals = (ev.ids || []).map(id => ({r: rivalById(id), c: CORP[id], id})).filter(x => x.r && x.c);
  if (!rivals.length || document.getElementById("corpShow")) return;
  const previous = document.activeElement, el = document.createElement("div");
  el.id = "corpShow"; el.className = "cs-challenge";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "ctTitle"); el.tabIndex = -1;
  const cards = rivals.map(({r, c, id}) => {
    const a = corpAppraisal(id), initials = r.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2);
    return `<article class="ct-rival"><div class="ct-rival-head"><span class="ct-mark" aria-hidden="true">${esc(initials)}</span><h3>${esc(r.name)}</h3></div>
      <dl><div><dt>Fahrzeuge</dt><dd>${a.fleet.length}</dd></div><div><dt>Firmensitz</dt><dd>${esc(N[c.hq].short)}</dd></div><div><dt>Firmenwert</dt><dd>${esc(money(a.total))}</dd></div></dl></article>`;
  }).join("");
  el.innerHTML = `<section class="ct-sheet"><header class="ct-mast"><b>LOGISTIK-KURIER</b><small>${esc(stamp(S.time))}</small></header>
    <div class="ct-heading"><p>NEUE KONZERNE AM MARKT</p><h2 id="ctTitle">Konzerne greifen an</h2><span>Neue Konkurrenz für <strong>${esc(S.player.company)}</strong></span></div>
    <div class="ct-rivals">${cards}</div>
    <div class="ct-rule"><b>Sie bewerben sich schneller um Aufträge.</b><span>Hol dir die Marktführung zurück – dann kannst du sie kaufen.</span></div>
    <blockquote class="ct-quote"><p>„${esc(rivals[0].c.hello || "Wir wollen die Marktführung.")}“</p><cite>${esc(rivals[0].c.boss)} · ${esc(rivals[0].c.role)}</cite></blockquote>
    <footer class="ct-footer"><button type="button" class="btn ct-close">Herausforderung annehmen</button></footer></section>`;
  document.body.appendChild(el); document.body.classList.add("cs-open");
  corpDialogBind356(el, ".ct-close", previous, false);
  if (typeof sfx === "function") try { sfx("horn"); } catch (_) { /* Stumm weiterhin bedienbar. */ }
}

/* v356: Gemeinsames Schließen/Fokusverhalten der beiden Konzernmeldungen. */
function corpDialogBind356(el, selector, previous, goToWorld) {
  const oldInert = [];
  Array.from(document.body.children).forEach(child => {
    if (child !== el && child.tagName !== "SCRIPT" && !child.inert) { oldInert.push(child); child.inert = true; }
  });
  let closed = false;
  function close(navigate = false) {
    if (closed) return; closed = true;
    document.removeEventListener("keydown", key, true); el.remove(); document.body.classList.remove("cs-open");
    oldInert.forEach(child => { child.inert = false; });
    if (navigate && goToWorld && typeof showTab === "function") showTab("world");
    else if (typeof activeTab !== "undefined" && activeTab === "world" && typeof renderWorld === "function") renderWorld();
    if (previous && previous.isConnected && !previous.closest("[inert]")) previous.focus({ preventScroll: true });
    else { const tab = document.querySelector('[data-tab="world"]'); if (tab) tab.focus({ preventScroll: true }); }
  }
  function key(e) {
    if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    if (e.key === "Tab") {
      const focusable = [...el.querySelectorAll('button, summary, [tabindex="0"]')].filter(b => !b.disabled && !b.closest("[hidden],[inert]") && b.getClientRects().length);
      const i = focusable.indexOf(document.activeElement);
      e.preventDefault(); if (focusable.length) focusable[i < 0 ? (e.shiftKey ? focusable.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
    }
  }
  document.addEventListener("keydown", key, true);
  el.querySelector(selector).onclick = () => close(true);
  el.focus({ preventScroll: true });
}
