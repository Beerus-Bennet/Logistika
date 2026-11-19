/* v419: Waffenschrank im bestehenden Spiel, Chromium mit Software-WebGL.
   Lokalen Server starten: python3 -m http.server 8008 --bind 127.0.0.1
   node weapons-v419.browser.js [http://127.0.0.1:8008] */
const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
(async () => {
  const dir = path.join(__dirname, 'docs/assets/v419'); fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 760 }, serviceWorkers: 'block' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto((process.argv[2] || 'http://127.0.0.1:8008') + '/?test=1');
    await page.waitForFunction(() => typeof WEAPONS !== 'undefined' && typeof thumbOf === 'function');
    await page.evaluate(() => {
      S = Object.assign(newGame(), { phase: 'play', stage: 6, money: 1e7 }); farmNew();
      document.getElementById('intro').classList.remove('on'); document.body.className = 'has-farm tab-farm'; farmDOM();
      for (const w of WEAPONS.LIST) WEAPONS.grant(w.id);
      WEAPONS.shop(); thumbFill();
    });
    await page.waitForFunction(() => document.querySelectorAll('.wp-preview img').length === 10 && [...document.querySelectorAll('.wp-preview img,.wp-animal img')].every(i => i.complete && i.naturalWidth));
    const reports = [];
    for (const [width,height] of [[320,640],[390,760],[844,390],[1100,900]]) {
      await page.setViewportSize({width,height});
      const report = await page.evaluate(() => {
        const sheet = document.getElementById('farmSheetIn');
        const cropped = [], overflow = [];
        for (const card of document.querySelectorAll('.wp-card[data-w]')) {
          const id = card.dataset.w, box = card.getBoundingClientRect();
          if (card.scrollWidth > card.clientWidth + 1 || box.left < -1 || box.right > innerWidth + 1) overflow.push(id);
          const img = card.querySelector('.wp-preview img'), r = img.getBoundingClientRect(), N = img.naturalWidth;
          const cv = document.createElement('canvas'); cv.width = cv.height = N; const ctx = cv.getContext('2d'); ctx.drawImage(img,0,0);
          const px = ctx.getImageData(0,0,N,N).data; let x0=N,y0=N,x1=0,y1=0;
          for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(px[(y*N+x)*4+3]>24){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
          const fit = getComputedStyle(img).objectFit, scale = (fit==='cover'?Math.max:Math.min)(r.width/N,r.height/N);
          const ox=(r.width-N*scale)/2, oy=(r.height-N*scale)/2;
          if(ox+x0*scale < -1 || oy+y0*scale < -1 || ox+(x1+1)*scale > r.width+1 || oy+(y1+1)*scale > r.height+1) cropped.push(id);
        }
        return {width:innerWidth,height:innerHeight,cropped,overflow,sheetOverflow:sheet.scrollWidth>sheet.clientWidth+1,cards:document.querySelectorAll('.wp-card[data-w]').length};
      });
      assert.deepEqual(report.cropped, [], 'Alle Modellpixel sichtbar'); assert.deepEqual(report.overflow, [], 'Kein Kartenüberlauf');
      assert.equal(report.sheetOverflow, false); assert.equal(report.cards,10); reports.push(report);
      if(width===390) {
        await page.screenshot({path:path.join(dir,'waffenschrank-mobil.png')});
        for(const id of ['m18','dbl','b525','g17','rh454','royal']) await page.locator('.wp-card[data-w="'+id+'"] .wp-preview').screenshot({path:path.join(dir,id+'.png')});
      }
    }
    const cache = await page.evaluate(() => {
      const R=thumbR(true), render=R.render, mesh=R.mesh; let renders=0, meshes=0;
      R.render=function(...a){renders++;return render.apply(this,a)}; R.mesh=function(...a){meshes++;return mesh.apply(this,a)};
      const saveBefore=JSON.stringify(S.farm.guns);
      for(let i=0;i<20;i++){WEAPONS.shop();thumbFill();}
      R.render=render;R.mesh=mesh;
      return {renders,meshes,saveUnchanged:saveBefore===JSON.stringify(S.farm.guns),contextLost:R.lost()};
    });
    assert.deepEqual(cache,{renders:0,meshes:0,saveUnchanged:true,contextLost:false});
    /* Bestehende Auswahlknöpfe weiterhin im echten Waffenschrank benutzen. */
    await page.locator('[data-wp="sel"][data-id="g17"]').click();
    assert.equal(await page.evaluate(()=>WEAPONS.cur().id),'g17');
    await page.locator('[data-wp="sel"][data-id="m18"]').click();
    assert.equal(await page.evaluate(()=>WEAPONS.cur().id),'m18');
    assert.deepEqual(errors,[],'Keine JavaScriptfehler');
    fs.writeFileSync(path.join(dir,'messwerte.json'),JSON.stringify({viewports:reports,cache,errors},null,2)+'\n');
    console.log(JSON.stringify({viewports:reports,cache,errors},null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
