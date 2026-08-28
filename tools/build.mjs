/* Assemble le jeu en un seul fichier HTML autonome.
   Pas de bundler dans le projet pour l'instant : une concatenation suffit, et
   elle garde l'ordre de chargement explicite. */
import {readFileSync, writeFileSync} from 'fs';
import {createHash} from 'crypto';

/* Un tampon de version dans la page. Sans lui, impossible de savoir quelle
   version quelqu'un a reellement jouee — un telephone garde la page en cache
   et on analyse un defaut deja corrige. Il apparait sur l'ecran-titre et dans
   le rapport de partie.
     Il est tire du CONTENU, pas du dernier commit : un sha de commit serait
   toujours celui d'avant, puisque la page est construite avant d'etre
   commitee. Deux pages identiques portent donc le meme tampon. */
const jour = new Date().toISOString().slice(0, 10);

const morceaux = [
  'art/sprites.js', 'art/monstres.js',
  'src/engine/rng.js', 'src/engine/config.js', 'src/engine/grille.js', 'src/engine/moteur.js',
  'src/game/decor.js', 'src/game/vecteur.js', 'src/game/projectiles.js', 'src/game/effets.js', 'src/game/son.js', 'src/game/rapport.js', 'src/game/jeu.js'
];
const corps = readFileSync('src/game/coquille.html', 'utf8')
  + morceaux.map(f => `\n/* ===== ${f} ===== */\n` + readFileSync(f, 'utf8')).join('\n');
const sha = createHash('sha256').update(corps).digest('hex').slice(0, 7);
const html = readFileSync('src/game/coquille.html', 'utf8')
  + `\n/* ===== version ===== */\nconst VERSION = ${JSON.stringify(jour + ' ' + sha)};\n`
  + morceaux.map(f => `\n/* ===== ${f} ===== */\n` + readFileSync(f, 'utf8')).join('\n')
  + '\n</script>\n';
writeFileSync('index.html', html);
console.log(`index.html  ${(html.length / 1024).toFixed(0)} Ko  ·  version ${jour} ${sha}`);
