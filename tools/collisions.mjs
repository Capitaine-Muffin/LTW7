/* La construction concatene les fichiers dans une seule portee. Ce controle
   attrape les collisions de noms GLOBAUX avant qu'elles ne cassent la page —
   c'est exactement ce qui est arrive avec `vitesse`. */
import {readFileSync} from 'fs';
const fichiers = ['art/sprites.js','src/engine/rng.js','src/engine/config.js',
  'src/engine/grille.js','src/engine/moteur.js','src/game/jeu.js'];
const vus = new Map(); let n = 0;
for (const p of fichiers){
  for (const m of readFileSync(p,'utf8').matchAll(/^(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/gm)){
    const nom = m[1];
    if (vus.has(nom)){ console.log(`  COLLISION  ${nom}  —  ${vus.get(nom)} et ${p}`); n++; }
    else vus.set(nom, p);
  }
}
console.log(n ? `\n${n} collision(s) — la page ne se chargera pas.` : `  aucune collision (${vus.size} noms globaux)`);
process.exit(n ? 1 : 0);
