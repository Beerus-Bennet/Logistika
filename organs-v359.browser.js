/* v359: Statische Kontaktübersicht der tatsächlichen Organmodelle. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1100,height:880},serviceWorkers:'block'});await p.goto('http://127.0.0.1:8000/?test=1');
 const missing=await p.evaluate(()=>{
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:99999;overflow:auto;background:#f7f0e0;padding:20px;color:#14283a;font:14px system-ui';document.body.appendChild(host);
  host.innerHTML='<h2 style="margin:0 0 8px">Anatomische Organmodelle · v359</h2><p style="margin:0 0 14px">Statische Vergrößerungen der Spielmodelle. Einzelansichten ohne gemeinsame Maßstabsskala.</p>';
  const missing=[];
  for(const [k,n]of [['hirsch','Rothirsch'],['keiler','Keiler'],['fasan','Fasan']]){
   const title=document.createElement('h3');title.textContent=n;title.style.margin='12px 0 6px';host.appendChild(title);
   const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:repeat(7,1fr);gap:10px';host.appendChild(row);
   for(const t of ['herz','lunge','leber','magen','darm','niere','kropf']){
    const O=HUNT.ORG[k].find(O=>O.t===t);if(!O)continue;
    const u=thumbOf('organ-gallery359:'+k+':'+O.id,()=>HUNT._organPreview(k,O.id),{yaw:O.t==='lunge'&&O.c[0]<0?Math.PI-.75:.75,pitch:.18,noShadow:true,big:true});if(!u)missing.push(k+O.id);
    const cell=document.createElement('div');cell.style.cssText='display:flex;flex-direction:column;align-items:center;background:white;border:2px solid #c9c4b7;border-radius:12px;padding:8px';
    cell.innerHTML='<img style="width:100%;height:120px;object-fit:contain" alt="" src="'+u+'"><b>'+O.n+'</b>';row.appendChild(cell);
   }
  }return missing;
 });assert.deepEqual(missing,[]);fs.mkdirSync('/tmp/logistika-v359',{recursive:true});await p.screenshot({path:'/tmp/logistika-v359/organ-models.png'});console.log('OK: 19 anatomische Organansichten der drei Tierarten gerendert.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
