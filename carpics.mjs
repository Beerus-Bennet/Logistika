/* v372: Nur freigegebene Modellfotos aus carphotos.js wiederherstellen.
   Keine Wikipedia-Titelbilder, Markensuche oder automatische Neuzuordnung.
   node carpics.mjs --check  → alle Quellen, Lizenzen und Dateien offline prüfen
   node carpics.mjs          → fehlende/beschädigte freigegebene Dateien holen
   node carpics.mjs --force  → dieselben Dateien erneut holen, SHA muss passen */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const CHECK=process.argv.includes('--check'),FORCE=process.argv.includes('--force');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(ROOT,'cars.js'),'utf8')+'\n'+fs.readFileSync(path.join(ROOT,'carphotos.js'),'utf8')+'\nglobalThis.catalog=CARS;globalThis.photos=CAR_PHOTOS;',ctx);
const {catalog,photos}=ctx,errors=[],hash=data=>createHash('sha256').update(data).digest('hex');
const ids=new Set(catalog.map(c=>c.id));
for(const id of Object.keys(photos))if(!ids.has(id))errors.push(id+': unbekannte Modell-ID');
let restored=0;
for(const c of catalog){
 const p=photos[c.id];
 if(!p||p.model!==c.id||!/^photos\/[\w-]+\.jpg$/.test(p.f)||!p.file||!p.by||!p.lic||!p.licUrl||!p.page||!/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(p.source)||!/^[a-f0-9]{64}$/.test(p.sha256)||!Array.isArray(p.paint)||!/^#[a-f0-9]{6}$/i.test(p.paint[1])){errors.push(c.id+': unvollständige Freigabe');continue;}
 const file=path.join(ROOT,'cars',p.f),valid=fs.existsSync(file)&&hash(fs.readFileSync(file))===p.sha256;
 if(CHECK){if(!valid)errors.push(c.id+': Datei fehlt oder Fingerabdruck stimmt nicht');continue;}
 if(valid&&!FORCE)continue;
 try{
  const r=await fetch(p.source,{headers:{'User-Agent':'LogistikaCarPics/2.0 (https://github.com/Beerus-Bennet/Logistika; approved model photos)'},signal:AbortSignal.timeout(30000)});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const data=Buffer.from(await r.arrayBuffer());
  if(hash(data)!==p.sha256)throw new Error('Quelle hat sich geändert: vor Ersatz erneut manuell prüfen');
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);restored++;
 }catch(e){errors.push(c.id+': '+e.message);}
}
const credits=path.join(ROOT,'cars/credits.json'),expected=JSON.stringify(photos,null,1)+'\n';
if(CHECK){if(!fs.existsSync(credits)||fs.readFileSync(credits,'utf8')!==expected)errors.push('credits.json weicht von der Modellfreigabe ab');}
else if(!errors.length)fs.writeFileSync(credits,expected);
if(errors.length){errors.forEach(e=>console.error(e));process.exitCode=1;}
else console.log(`${catalog.length} Modellzuordnungen, Lizenzen und Bilddateien geprüft${CHECK?' (offline)':', '+restored+' wiederhergestellt'}.`);
