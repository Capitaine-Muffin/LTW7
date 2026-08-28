/* Autopsie d'une partie precise. Sert a comprendre POURQUOI une elimination
   arrive trop tot : combien de tours chacun avait, combien il avait envoye, et
   ou passait son or.
     GRAINE=17693 node tools/diagnostic.mjs */
import {readFileSync} from 'fs';
const src = ['rng','config','grille','moteur'].map(f =>
  readFileSync(`src/engine/${f}.js`,'utf8')).join('\n');
const M = {};
new Function('X', src + '\nObject.assign(X,{creerPartie,avancer,CONFIG});')(M);

const e = M.creerPartie({graine: +(process.env.GRAINE || 17693),
  profil: process.env.PROFIL || 'BLITZ', joueurs: +(process.env.JOUEURS || 4),
  difficulte: process.env.DIFF || 'agressif'});

/* JOUEUR=bot fait jouer la ligne 0 par l'IA : c'est le seul moyen d'approcher
   ce qui se passe quand un humain competent envoie vraiment. Avec une ligne 0
   passive on ne mesure que la borne basse. */
if (process.env.JOUEUR === 'bot') e.lignes[0].estJoueur = false;

console.log('pas    ' + e.lignes.map(l => l.nom.padEnd(15)).join(''));
console.log('       ' + e.lignes.map(() => 'vies tours envois'.padEnd(15)).join(''));
let premiere = null;
for (let i = 0; i < 1500; i++){
  M.avancer(e);
  if (!premiere && e.lignes.some(l => l.mort)) premiere = e.pas;
  if (e.pas % 20 === 0 && e.pas <= 400)
    console.log(String((e.pas/10).toFixed(0)+'s').padEnd(7) +
      e.lignes.map(l => (String(l.vies).padStart(4) + String(l.batiments.length).padStart(6) +
        String(Object.values(l.envoisParType).reduce((a,b)=>a+b,0)).padStart(7)).padEnd(15)).join(''));
  if (e.fini) break;
}
console.log('\n1re elimination :', premiere ? (premiere/10).toFixed(0)+' s' : 'aucune');
console.log('fin de partie   :', e.fini ? (e.pas/10).toFixed(0)+' s' : 'non finie');
for (const l of e.lignes)
  console.log(` ${l.nom.padEnd(6)} tours ${String(l.batiments.length).padStart(3)}` +
    ` · or depense en tours ${String(l.depenseTours).padStart(6)}` +
    ` · en envois ${String(l.depenseEnvois).padStart(7)}` +
    ` · revenu ${String(l.revenu).padStart(5)}${l.mort ? '  (mort)' : ''}`);
