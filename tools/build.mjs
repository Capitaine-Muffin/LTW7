/* Assemble le jeu en un seul fichier HTML autonome.
   Pas de bundler dans le projet pour l'instant : une concatenation suffit, et
   elle garde l'ordre de chargement explicite. */
import {readFileSync, writeFileSync} from 'fs';
const morceaux = [
  'art/sprites.js', 'art/monstres.js',
  'src/engine/rng.js', 'src/engine/config.js', 'src/engine/grille.js', 'src/engine/moteur.js',
  'src/game/jeu.js'
];
const html = readFileSync('src/game/coquille.html', 'utf8')
  + morceaux.map(f => `\n/* ===== ${f} ===== */\n` + readFileSync(f, 'utf8')).join('\n')
  + '\n</script>\n';
writeFileSync('index.html', html);
console.log(`index.html  ${(html.length / 1024).toFixed(0)} Ko`);
