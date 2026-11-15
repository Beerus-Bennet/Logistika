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
  const stat = (icon, value, label) => `<div class="crp-stat"><span aria-hidden="true">${icon}</span><b>${esc(value)}</b><small>${esc(label)}</small></div>`;
  const el = document.createElement("div");
  el.id = "corpShow"; el.className = "cs-receipt";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "crpTitle"); el.tabIndex = -1;
  el.innerHTML = `<div class="crp-sheet">
    <header class="crp-mast"><span>LOGISTIK-KURIER</span><small>${esc(stamp(d.at == null ? S.time : d.at))}</small></header>
    <section class="crp-heading"><span class="crp-check" aria-hidden="true">✓</span><div><p>ÜBERNAHME ABGESCHLOSSEN</p>
      <h2 id="crpTitle">${esc(name)}</h2><span>Jetzt Teil von <strong>${esc(company)}</strong></span></div></section>
    <div class="crp-price"><span>Kaufpreis</span><b>${esc(money(d.price))}</b></div>
    <div class="crp-stats" aria-label="Bei diesem Kauf übernommen">
      ${stat("🚚", "+" + d.veh, "Fahrzeuge im Eigentum")}
      ${stat("👥", "+" + (d.staff || 0), "Mitarbeitende übernommen")}
      ${stat("🏢", d.sites || 1, "Standorte im Eigentum")}
      ${stat("📈", "+" + (d.pct || 0), "Prozentpunkte Marktanteil")}
      ${stat("📋", "+" + (d.cust || 0), "Aufträge von Kunden")}
      ${stat("⭐", "+" + (d.rep || 0), "Ruf")}
    </div>
    <div class="crp-operation"><b>${esc(d.hq || "Firmensitz übernommen")}</b>
      <span>${summary ? `Team Ø ${summary.skill.toFixed(1)}/5 · ${esc(money(summary.wages))} Löhne/Tag` : "Flotte und Team gehören jetzt dir."}</span>
      <span>${d.pending ? `${d.pending} Standorte mit Team bis zur Freischaltung reserviert.` : "Eingerichtet · Team und Flotte zugeordnet"}</span></div>
    <div class="crp-group"><b>Deine Gruppe nach diesem Kauf</b><span>${group.count} Übernahmen · ${group.vehicles} Fahrzeuge übernommen</span><small>${esc(money(group.paid))} Kaufpreise insgesamt</small></div>
    ${d.assets ? `<details class="corp-package crp-details"><summary>Fahrzeuge, Team & Standorte ansehen</summary><div class="crp-detail-content">${corpDealContents(d.assets)}</div></details>` : ""}
    <footer class="crp-footer"><button type="button" class="btn crp-close">Zur Unternehmensübersicht →</button></footer>
  </div>`;
  document.body.appendChild(el); document.body.classList.add("cs-open");
  const oldInert = [];
  Array.from(document.body.children).forEach(child => {
    if (child !== el && child.tagName !== "SCRIPT" && !child.inert) { oldInert.push(child); child.inert = true; }
  });
  let closed = false;
  function close(goToWorld = false) {
    if (closed) return; closed = true;
    document.removeEventListener("keydown", key, true); el.remove(); document.body.classList.remove("cs-open");
    oldInert.forEach(child => { child.inert = false; });
    if (goToWorld && typeof showTab === "function") showTab("world");
    else if (typeof activeTab !== "undefined" && activeTab === "world" && typeof renderWorld === "function") renderWorld();
    if (previous && previous.isConnected && !previous.closest("[inert]")) previous.focus({ preventScroll: true });
    else { const tab = document.querySelector('[data-tab="world"]'); if (tab) tab.focus({ preventScroll: true }); }
  }
  function key(e) {
    if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    if (e.key === "Tab") {
      const focusable = [...el.querySelectorAll("button, summary")].filter(b => b.getClientRects().length);
      const i = focusable.indexOf(document.activeElement);
      e.preventDefault(); if (focusable.length) focusable[(i + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
    }
  }
  document.addEventListener("keydown", key, true);
  el.querySelector(".crp-close").onclick = () => close(true);
  el.focus({ preventScroll: true });
}
