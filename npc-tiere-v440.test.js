/* v440: Vollständige, endliche NPC-Modelle mit festen Grafikbudgets. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=vm.createContext({console});for(const f of ['gl3d.js','farmmodels.js','woodmodels.js'])vm.runInContext(fs.readFileSync(f,'utf8'),C);
const names=['deer','hare','squirrel','boar','fox','hedgehog','heron','bird','owl','bat','dog','cat','goat'],report={};
for(const k of names){const v=vm.runInContext('FWM.'+k+'().v',C);assert.ok(v.every(Number.isFinite));assert.equal(v.length%27,0);assert.ok(v.length/27<=1000,k+' Geometriebudget');assert.equal(JSON.stringify(v),vm.runInContext('JSON.stringify(FWM.'+k+'().v)',C),k+' stabil');report[k]=v.length/27;}
for(const k of ['birdWing','owlWing','batWing']){const v=vm.runInContext('FWM.'+k+'().v',C);assert.ok(v.every(Number.isFinite));assert.ok(v.length/27<=100,k+' Flügelbudget');}
const v=vm.runInContext('FWM.squirrel().v',C);let tallBack=0;for(let i=0;i<v.length;i+=9)if(v[i+1]>.23&&v[i+2]<-.02)tallBack++;
assert.ok(tallBack>100,'Buschige hohe Schwanzsilhouette statt dünnem Stab');
console.log('13 stabile NPC-Modelle, drei Flügelpaare innerhalb des Budgets und klare Eichhörnchen-Silhouette geprüft.',report);
