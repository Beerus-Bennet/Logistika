"use strict";
/* v328: Jedes Präparat ist ein eigenes, unveränderliches Ausstellungsstück.
   Im Lager zählt die Ware, draußen das Objekt mit derselben Stückkennung.
   Die Kopie am Objekt erhält auch bei alten Spielständen alle individuellen Merkmale. */
const TROPHIES = (() => {
  const objects = () => S.farm.objs.filter(o => o.t === "trophy");
  const placed = u => objects().find(o => o.u === u) || null;
  const record = o => (S.farm.hunt && S.farm.hunt.coll || []).find(r => r.u === o.u) || o.specimen;
  function proto(r) {
    const b = HUNT.trophyInfo(r);
    return { t: "trophy", k: r.k, u: r.u, sz: [b.size, b.size], h: b.height, r: 0, specimen: JSON.parse(JSON.stringify(r)) };
  }
  /* Überall auf freigeschaltetem, freiem Land. Straßen, Wasser, Bäume und
     Berghänge bleiben frei; vorhandene Bau-/Wegesperren gelten weiterhin. */
  function canPlace(x, z, w, d, except) {
    if (![x,z,w,d].every(Number.isFinite)) return false;
    if (typeof VILLAGE !== "undefined" && VILLAGE.overlaps(x-FG/2,z-FG/2,w,d)) return false;
    const R = farmZoneRect("display");
    if (x < R.x0 || z < R.z0 || x+w > R.x1 || z+d > R.z1) return false;
    for (let a = x; a <= x+w; a += .5) for (let b = z; b <= z+d; b += .5) {
      const wx = a-FG/2, wz = b-FG/2;
      if (FAREA_ORDER.some(k => !farmAreaOpen(k) && FAREAS[k].locks.some(q => wx>q[0] && wx<q[2] && wz>q[1] && wz<q[3]))) return false;
      if (FWM.springHeightW(wx,wz) > .025) return false;
    }
    const zone = farmZoneAt(x,z,w,d);
    if (zone === "hof" || zone === "yard") return farmFits(x,z,w,d,except,"deco");
    return farmWildOk(x,z,w,d,except);
  }
  function place(u, x, z, rotation) {
    const r = HUNT.collSync().find(r => r.u === u);
    if (!r || placed(u) || !Number.isInteger(x) || !Number.isInteger(z)) return null;
    const p = proto(r), id = HUNT.trophyId(r.k,r.m);
    if (!canPlace(x,z,...p.sz) || !farmTake(id,1)) return null;
    return farmAddObj(Object.assign(p,{x,z,r:(rotation||0)&3}));
  }
  function store(u) {
    const o = placed(u);
    if (!o) return false;
    const r = record(o), id = HUNT.trophyId(r.k,r.m);
    if (farmRoom(id) < 1) { toast("Das Trophäenlager ist voll. Schaffe zuerst einen freien Platz.","bad"); return false; }
    farmAdd(id,1,3);
    S.farm.objs.splice(S.farm.objs.indexOf(o),1);
    farmSyncScene(); save();
    return true;
  }
  function start(u) {
    if (FV.tutLock || !FV.R) return;
    const r = HUNT.collSync().find(r => r.u === u);
    if (!r) return;
    closeFarmSheet();
    const o = placed(u);
    if (o) { startMove(o); return; }
    const p = proto(r), size = p.sz[0], cx = Math.round(FV.R.cam.tx+FG/2-size/2), cz = Math.round(FV.R.cam.tz+FG/2-size/2);
    /* Zuerst nahe der Kamera suchen, damit kein Wald mit vielen tausend
       Rasterfeldern gescannt wird. Eine rote Vorschau darf weitergezogen werden. */
    let at = null;
    for (let ring = 0; ring <= 16 && !at; ring++) for (let dz = -ring; dz <= ring && !at; dz++) for (let dx = -ring; dx <= ring && !at; dx++) {
      if (Math.max(Math.abs(dx),Math.abs(dz)) !== ring) continue;
      if (canPlace(cx+dx,cz+dz,size,size)) at = [cx+dx,cz+dz];
    }
    startPlace({proto:p,trophy:u,label:"Präparat aufstellen"},...(at || [cx,cz]));
  }
  return { objects, placed, record, canPlace, place, store, start };
})();
