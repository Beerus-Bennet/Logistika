/* v355: Verbindliche Übernahmepakete. Angebot, Übergabe und Beleg verwenden
   dieselben Objekte; bestehende Käufe werden nicht nachträglich neu bewertet. */
"use strict";

function corpCopy(value) { return JSON.parse(JSON.stringify(value)); }

/* Ein Betrieb hat passende Außenstellen für Verkehrsträger, die am Hauptsitz
   nicht abgefertigt werden können. Keine Flugzeuge am Binnenkai abstellen. */
function corpBusinessPlan(id, fleet) {
  const c = CORP[id], value = fleet.reduce((sum, f) => sum + vehValue(f), 0);
  const premium = value >= 50000000 ? 4 : value >= 10000000 ? 3 : c.tier;
  const sites = [{ node: c.hq, tier: Math.max(c.tier, premium), indexes: [] }];
  const locations = {};
  fleet.forEach((f, i) => {
    const mode = vType(f.type).mode, hq = N[c.hq];
    if (!locations[mode]) {
      const rad = Math.PI / 180;
      const distance = n => {
        const a = Math.sin((n.lat - hq.lat) * rad / 2) ** 2
          + Math.cos(hq.lat * rad) * Math.cos(n.lat * rad) * Math.sin((n.lon - hq.lon) * rad / 2) ** 2;
        return Math.asin(Math.sqrt(Math.min(1, a)));
      };
      const candidates = Object.values(N).filter(n => !n.via && isUnlocked(n.id) && n.modes.includes(mode));
      candidates.sort((a, b) => distance(a) - distance(b) || a.id.localeCompare(b.id));
      locations[mode] = hq.modes.includes(mode) ? c.hq : candidates[0] && candidates[0].id;
    }
    const node = locations[mode];
    if (!node) throw Error("Kein geeigneter Standort für " + MODE_INFO[mode].name);
    let site = sites.find(s => s.node === node && s.indexes.length < (value >= 10000000 || c.wave ? 100 : 72));
    if (!site) { site = { node, tier: Math.min(2, premium), indexes: [] }; sites.push(site); }
    site.indexes.push(i);
  });
  sites.forEach((s, si) => {
    /* Eine Qualifikationsstufe bewegt im bestehenden Spiel mehrere Fahrzeuge.
       Fahrer- und Dispositionsleistung werden entsprechend dieser Regeln geplant. */
    const skill = value >= 10000000 || c.wave ? 4 : 3;
    const drivers = Math.max(1, Math.ceil(s.indexes.length / (skill * .9 + .6)));
    const dispatchers = Math.max(1, Math.ceil((s.indexes.length - 2) / (skill * .89 * 3)));
    const roles = [...Array(drivers).fill("fahr"), ...Array(dispatchers).fill("disp")];
    if (s.indexes.length >= 5 || s.tier >= 1) roles.push("ums");
    if (s.tier >= 2 || s.indexes.some(i => "sa".includes(vType(fleet[i].type).mode))) roles.push("zoll");
    const minTeam = s.tier >= 3 ? Math.ceil(OFFICE_TIERS[s.tier].desks * .65) : 0;
    while (roles.length < minTeam) roles.push(["fahr", "disp", "ums", "zoll"][roles.length % 4]);
    while (s.tier < 4 && (roles.length > OFFICE_TIERS[s.tier].desks || s.indexes.length > OFFICE_TIERS[s.tier].slots)) s.tier++;
    if (roles.length > OFFICE_TIERS[s.tier].desks) throw Error("Team passt nicht in den angebotenen Standort");
    s.team = roles.map((role, i) => ({ role, skill: value >= 50000000 && (i + si) % 3 === 0 ? 5 : skill }));
    s.deco = officeFitout(s.tier);
  });
  return sites;
}

function corpBusinessAppraisal(id, fleet) {
  const sites = corpBusinessPlan(id, fleet);
  const fleetValue = fleet.reduce((sum, f) => sum + vehValue(f), 0);
  const hqValue = sites.reduce((sum, s) => sum + Math.round(buyPrice(s.node, OFFICE_TIERS[s.tier]) * .6), 0);
  const teamValue = sites.reduce((sum, s) => sum + s.team.reduce((v, p) => v + Math.round(ROLES[p.role].wage * (.62 + p.skill * .19)) * 4, 0), 0);
  const assets = fleetValue + hqValue;
  const goodwill = Math.round(assets * (.12 + Math.min(.18, (shares()[id] || 0) * .6))) + teamValue;
  /* Ein Kauf unter dem sofortigen Wiederverkaufswert wäre eine Geldquelle.
     Der Verhandlungsspielraum endet deshalb über dem Liquidationswert. */
  const floor = Math.ceil((fleetValue + sites.reduce((sum, s) => sum + Math.round(buyPrice(s.node, OFFICE_TIERS[s.tier]) * .55), 0)) * 1.02);
  return { fleet, sites, fleetValue, hqValue, teamValue, goodwill, floor, total: roundK(assets + goodwill, 1000) };
}

/* Konkrete Kennungen, Gesichter, Qualifikationen und Fahrzeugzustände bereits
   im Angebot reservieren. Schließen/Laden/Etappenwechsel würfelt nichts neu. */
function corpMakeDeal(id, appraisal) {
  const c = CORP[id], r = rivalById(id), dealId = "D" + S.seq++;
  const fleet = appraisal.fleet.map(f => {
    const v = makeVehicle(f.type);
    Object.assign(v, f, { foreign: { id, col: r.col } });
    return v;
  });
  const sites = appraisal.sites.map((s, i) => {
    const staff = s.team.map(spec => {
      const p = makeCandidate(false);
      return { id: p.id, name: p.name, ...spec, wage: Math.round(ROLES[spec.role].wage * (.62 + spec.skill * .19)),
        av: p.av, trait: "war vorher bei " + r.name, since: S.time, jobs: 0 };
    });
    s.indexes.forEach(k => { fleet[k].at = s.node; });
    const b = { id: "S" + S.seq++, node: s.node, tier: s.tier, rent: false, staff,
      vehicles: s.indexes.map(k => fleet[k].uid), mood: c.wave ? 86 : 80, opened: S.time, done: 0,
      nextAt: S.time + 30, pausedUntil: 0, pool: [], poolDay: -1, rentDue: S.time + 30 * 1440,
      sourceCompany: r.name, acquisition: dealId, deco: corpCopy(s.deco), branch: i > 0 };
    decoOf(b);
    return b;
  });
  const orders = [];
  /* Nur tatsächlich erzeugbare Aufträge zusagen, keine erfundenen Stammkunden. */
  for (let i = 0; i < (c.wave ? 2 + c.wave : 2); i++) {
    const o = typeof makeOrder === "function" ? makeOrder() : null;
    if (!o) continue;
    o.pay = Math.round(o.pay * (c.wave ? 1.4 : 1.25)); o.loyal = r.name;
    orders.push(o);
  }
  return { version: 353, dealId, id, name: r.name, icon: r.icon, col: r.col, created: S.time,
    fleet, sites, orders, rep: c.wave ? 5 : 3,
    appraisal: { fleetValue: appraisal.fleetValue, hqValue: appraisal.hqValue,
      teamValue: appraisal.teamValue, goodwill: appraisal.goodwill, floor: appraisal.floor, total: appraisal.total } };
}

function corpDealSummary(d) {
  const people = d.sites.flatMap(b => b.staff);
  return { staff: people.length, skill: people.length ? people.reduce((n, p) => n + p.skill, 0) / people.length : 0,
    wages: people.reduce((n, p) => n + p.wage, 0), sites: d.sites.length };
}

function corpDealDetails(d) {
  return `<details class="corp-package"><summary>Enthaltenes Unternehmen im Detail</summary>${corpDealContents(d)}</details>`;
}
function corpDealContents(d) {
  return `<div class="corp-package-body"><h4>Verbindliche Flotte · ${d.fleet.length} Fahrzeuge</h4>
    ${d.fleet.map(v => `<p>${esc(vType(v.type).name)} <small>${esc(N[v.at].short)} · Zustand ${100 - v.wear} %</small></p>`).join("")}
    ${d.sites.map(b => `<h4>${esc(OFFICE_TIERS[b.tier].name)} · ${esc(N[b.node].short)}</h4>
      <p>${esc(officeFitoutText(b.tier))}</p><p>${b.staff.length} Mitarbeitende · ${b.vehicles.length} Fahrzeuge
      ${!isUnlocked(b.node) ? " · Betrieb ab Freischaltung des Ortes" : ""}</p>
      ${b.staff.map(p => `<p>${esc(p.name)} <small>${esc(ROLES[p.role].name)} · ${p.skill}/5 · ${money(p.wage)}/Tag</small></p>`).join("")}`).join("")}
    </div>`;
}

function corpValidateDeal(d) {
  if (!d || d.version !== 353 || !d.fleet.length || !d.sites.length) throw Error("Das Übernahmepaket fehlt. Bitte das Angebot erneut öffnen.");
  const keys = new Set(S.fleet.map(v => v.uid).concat((S.bases || []).flatMap(b => [b.id, ...b.staff.map(p => p.id)]), S.orders.map(o => o.id)));
  Object.values((S.corp && S.corp.hq) || {}).forEach(p => {
    (p.sites353 || []).forEach(b => { keys.add(b.id); b.staff.forEach(s => keys.add(s.id)); });
    (p.staff || []).forEach(s => keys.add(s.id));
  });
  const add = id => { if (!id || keys.has(id)) throw Error("Doppelte Kennung im Übernahmepaket"); keys.add(id); };
  const assigned = new Set();
  d.fleet.forEach(v => { if (!vType(v.type) || !N[v.at] || !N[v.at].modes.includes(vType(v.type).mode)) throw Error("Ein Fahrzeug hat keinen geeigneten Standort"); add(v.uid); });
  d.sites.forEach(b => {
    const t = OFFICE_TIERS[b.tier];
    if (!t || !N[b.node] || b.staff.length > t.desks || b.vehicles.length > t.slots) throw Error("Standortkapazität im Angebot stimmt nicht");
    add(b.id);
    b.staff.forEach(p => { if (!ROLES[p.role] || p.skill < 1 || p.skill > 5 || !Number.isFinite(p.wage)) throw Error("Ungültige Personaldaten"); add(p.id); });
    b.vehicles.forEach(uid => {
      const v = d.fleet.find(f => f.uid === uid);
      if (!v || assigned.has(uid) || v.at !== b.node) throw Error("Fahrzeugzuordnung im Angebot stimmt nicht");
      assigned.add(uid);
    });
  });
  if (assigned.size !== d.fleet.length) throw Error("Nicht alle Fahrzeuge sind einem Standort zugeordnet");
  d.orders.forEach(o => add(o.id));
}

/* Synchroner Commit mit Rücknahme bei Fehlern einschließlich fehlgeschlagenem
   localStorage-Schreiben. Effekte/Telefon/Animation erst nach gespeichertem Beleg. */
function corpCommitDeal(id, price) {
  const C = corp(), t = C.talks[id], r = rivalById(id), c = CORP[id];
  if (C.owned[id]) return null;
  if (!Number.isFinite(price) || price <= 0 || price > S.money) throw Error("Kaufpreis oder Guthaben stimmt nicht.");
  const d = t && t.deal353;
  corpValidateDeal(d);
  if (d.id !== id || price < d.appraisal.floor) throw Error("Das Angebot liegt unter dem verhandelbaren Mindestwert.");
  const before = corpCopy(S), snapshot = corpCopy(d);
  try {
    const sh = shareState(), pct = Math.round((shares()[id] || 0) * 1000) / 10;
    const repBefore = typeof repOf === "function" ? repOf(S.stage) : null;
    const sites = corpCopy(d.sites), fleet = corpCopy(d.fleet), orders = corpCopy(d.orders);
    S.money -= price; S.expense += price;
    logMoney("corp", "Übernahme: " + r.name, -price);
    sh.me = (sh.me || 0) + (sh[id] || 0); sh[id] = 0;
    S.orders.forEach(o => { if (o.rival && o.rival.id === id) delete o.rival; });
    S.fleet.push(...fleet);
    const pending = [];
    sites.forEach(b => {
      b.opened = S.time; b.nextAt = S.time + 30; b.rentDue = S.time + 30 * 1440;
      b.staff.forEach(p => { p.since = S.time; });
      if (isUnlocked(b.node)) S.bases.push(b); else pending.push(b);
    });
    C.hq = C.hq || {};
    if (pending.length) C.hq[id] = { sites353: pending }; else delete C.hq[id];
    orders.forEach(o => {
      const delta = S.time - d.created;
      if (Number.isFinite(o.deadline)) o.deadline += delta;
      o.created = S.time; o.expire = Math.max((o.expire || d.created) + delta, S.time + 1440);
    });
    S.orders.push(...orders);
    if (typeof repAdd === "function") repAdd(S.stage, d.rep);
    const summary = corpDealSummary(d);
    const receipt = { kind: "win", id, dealId: d.dealId, at: S.time, price, veh: fleet.length,
      staff: summary.staff, sites: sites.length, pending: pending.length, cust: orders.length,
      pct, rep: repBefore == null ? d.rep : repOf(S.stage) - repBefore,
      company: S.player.company, name: d.name, icon: d.icon, col: d.col,
      hq: OFFICE_TIERS[sites[0].tier].name + " · " + N[sites[0].node].short,
      vehicleIds: fleet.map(v => v.uid), staffIds: sites.flatMap(b => b.staff.map(p => p.id)),
      baseIds: sites.map(b => b.id), orderIds: orders.map(o => o.id),
      assets: snapshot, left: activeRivals().filter(x => x.id !== id).length };
    C.owned[id] = { at: S.time, price, veh: fleet.length, staff: summary.staff, cust: orders.length, wave: c.wave || 0, hq: 1, receipt353: receipt };
    const owned = Object.values(C.owned);
    receipt.group = { count: owned.length, vehicles: owned.reduce((n, o) => n + (o.veh || 0), 0), paid: owned.reduce((n, o) => n + o.price, 0) };
    t.done = true;
    /* Der Beleg enthält das vollständige unveränderliche Kaufpaket. Nicht
       nochmals dieselben Daten im abgeschlossenen Gespräch speichern. */
    delete t.deal353;
    if (S.stake && S.stake.id === id) S.stake = null;
    if (save() === false) throw Error("Der Spielstand konnte nicht gespeichert werden. Der Kauf wurde zurückgenommen.");
    return receipt;
  } catch (error) {
    Object.keys(S).forEach(k => { delete S[k]; }); Object.assign(S, before);
    throw error;
  }
}
