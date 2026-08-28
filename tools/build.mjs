/* Assemble le jeu en un seul fichier HTML autonome.
   Pas de bundler dans le projet pour l'instant : une concatenation suffit, et
   elle garde l'ordre de chargement explicite. */
import {readFileSync, writeFileSync} from 'fs';
import {execSync} from 'child_process';

/* Un tampon de version dans la page. Sans lui, impossible de savoir quelle
   version quelqu'un a reellement jouee — un telephone garde la page en cache
   et on analyse un defaut deja corrige. Il apparait sur l'ecran-titre et dans
   le rapport de partie. */
const sha = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); }
                     catch (e){ return 'local'; } })();
const jour = new Date().toISOString().slice(0, 10);
const VERSION = `const VERSION = ${JSON.stringify(jour + ' ' + sha)};\n`;
const morceaux = [
  'art/sprites.js', 'art/monstres.js',
  'src/engine/rng.js', 'src/engine/config.js', 'src/engine/grille.js', 'src/engine/moteur.js',
  'src/game/decor.js', 'src/game/vecteur.js', 'src/game/projectiles.js', 'src/game/effets.js', 'src/game/son.js', 'src/game/rapport.js', 'src/game/jeu.js'
];
const html = readFileSync('src/game/coquille.html', 'utf8')
  + '\n/* ===== version ===== */\n' + VERSION
  + morceaux.map(f => `\n/* ===== ${f} ===== */\n` + readFileSync(f, 'utf8')).join('\n')
  + '\n</script>\n';
writeFileSync('index.html', html);
console.log(`index.html  ${(html.length / 1024).toFixed(0)} Ko  ·  version ${jour} ${sha}`);
