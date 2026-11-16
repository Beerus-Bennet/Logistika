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
  /* v362: Der Beleg passt ohne Scrollen auf eine Seite. Kennzahlen als nüchternes Raster ohne Bildzeichen, Angaben zum
     Betrieb als Zeilen; der Bestand im Einzelnen klappt als eigene Ansicht über den Beleg (scrollt dort für sich),
     der Knopf darunter bleibt immer sichtbar. Inhalt und Zahlen wie bisher. */
  const stat = (value, label) => `<div class="crp2-kpi"><b>${esc(value)}</b><small>${esc(label)}</small></div>`;
  const row = (label, value) => `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
  const el = document.createElement("div");
  el.id = "corpShow"; el.className = "cs-receipt";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "crpTitle"); el.tabIndex = -1;
  el.innerHTML = `<div class="crp-sheet crp2">
    <header class="crp-mast"><span>LOGISTIK-KURIER · KAUFBELEG</span><small>${esc(stamp(d.at == null ? S.time : d.at))}</small></header>
    <div class="crp2-body">
      <section class="crp2-head"><p><i aria-hidden="true">✓</i>Übernahme abgeschlossen</p>
        <h2 id="crpTitle">${esc(name)}</h2><span>Jetzt Teil von <strong>${esc(company)}</strong></span></section>
      <div class="crp2-price"><span>Kaufpreis</span><b>${esc(money(d.price))}</b></div>
      <div class="crp2-kpis" aria-label="Bei diesem Kauf übernommen">
        ${stat("+" + d.veh, "Fahrzeuge")}${stat("+" + (d.staff || 0), "Mitarbeitende")}${stat(d.sites || 1, (d.sites || 1) === 1 ? "Standort" : "Standorte")}
        ${stat("+" + (d.pct || 0) + " %-Pkt.", "Marktanteil")}${stat("+" + (d.cust || 0), "Aufträge")}${stat("+" + (d.rep || 0), "Ruf")}
      </div>
      <dl class="crp2-rows">
        ${row("Firmensitz", esc(d.hq || "übernommen"))}
        ${row("Team", summary ? `Ø ${summary.skill.toFixed(1)} von 5 · ${esc(money(summary.wages))} Löhne/Tag` : "übernommen")}
        ${row("Status", d.pending ? `${d.pending} Standorte bis zur Freischaltung reserviert` : "Eingerichtet, Team und Flotte zugeordnet")}
        ${row("Deine Gruppe", `${group.count} Übernahmen · ${group.vehicles} Fahrzeuge · ${esc(money(group.paid))}`)}
      </dl>
      ${d.assets ? `<details class="corp-package crp-details"><summary><span class="crp2-open">Bestand im Einzelnen ansehen</span><span class="crp2-back">‹ Zurück zum Beleg</span></summary><div class="crp-detail-content">${corpDealContents(d.assets)}</div></details>` : ""}
    </div>
    <footer class="crp-footer"><button type="button" class="btn crp-close">Zur Unternehmensübersicht →</button></footer>
  </div>`;
  document.body.appendChild(el); document.body.classList.add("cs-open");
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
      const focusable = [...el.querySelectorAll("button, summary")].filter(b => b.getClientRects().length);
      const i = focusable.indexOf(document.activeElement);
      e.preventDefault(); if (focusable.length) focusable[i < 0 ? (e.shiftKey ? focusable.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
    }
  }
  document.addEventListener("keydown", key, true);
  el.querySelector(selector).onclick = () => close(true);
  el.focus({ preventScroll: true });
}
