/* v358: Die App bleibt im sichtbaren Browserfenster, auch beim Neuladen,
   Drehen und Ein-/Ausblenden der iOS-Browserleisten. Native Browseroberflächen
   gehören dem Browser; kein Scroll-Trick und kein erzwungener Vollbildmodus. */
(() => {
  const root = document.documentElement, vv = window.visualViewport;
  let frame = 0;
  function sync() {
    frame = 0;
    /* Pinch-Zoom nicht als neue App-Größe übernehmen. */
    if (vv && vv.scale > 1.02) return;
    const h = vv ? vv.height : window.innerHeight;
    if (!(h > 0)) return;
    root.style.setProperty("--app-height", h + "px");
    root.style.setProperty("--app-top", (vv ? vv.offsetTop : 0) + "px");
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(sync); }
  sync();
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
  window.addEventListener("load", schedule);
  window.addEventListener("orientationchange", schedule);
  if (vv) {
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
  }
})();

/* v431: Hochformat sperren, wo der Browser es erlaubt (installierte App); sonst zeigt #rotHint im Querformat einen Hinweis. */
try{if(screen.orientation&&screen.orientation.lock&&matchMedia("(pointer:coarse)").matches&&Math.min(screen.width,screen.height)<500)screen.orientation.lock("portrait-primary").catch(function(){});}catch(e){}
