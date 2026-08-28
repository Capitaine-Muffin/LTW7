/* Simule des parties sans rendu et mesure ce qui compte pour l'equilibrage :
   combien de temps avant la premiere elimination, avant la fin, et ou en est
   l'economie. Un joueur humain n'est pas simule : la ligne 0 est passive, ce
   qui donne la borne basse — le temps de survie de quelqu'un qui ne fait rien. */
import {readFileSync} from 'fs';
const src = ['rng','config','grille','moteur'].map(f =>
  readFileSync(`src/engine/${f}.js`,'utf8')).join('\n');
const M = {};
new Function('X', src + '\nObject.assign(X,{creerPartie,avancer,CONFIG});')(M);

const profils = process.env.PROFILS ? process.env.PROFILS.split(',')
              : ['ECLAIR','BLITZ','SOUTENU','CLASSIQUE'];
const diffs   = ['facile','normal','agressif','impitoyable'];
const joueurs = +(process.env.JOUEURS || 4);
const MAX     = +(process.env.MAX || 12000);     // 20 minutes de jeu

console.log(`\n${joueurs} joueurs · la ligne du joueur est passive (borne basse)\n`);
console.log('profil     bots           1re mort   ma mort   fin      revenu bot  vies bot');
console.log('-'.repeat(78));
for (const P of profils){
  for (const D of diffs){
    const e = M.creerPartie({graine: 20240827, profil: P, joueurs, difficulte: D});
    let premiere = null, maMort = null, fin = null;
    for (let i = 0; i < MAX; i++){
      M.avancer(e);
      if (!premiere && e.lignes.some(l => l.mort)) premiere = e.pas;
      if (!maMort && e.lignes[0].mort) maMort = e.pas;
      if (e.fini){ fin = e.pas; break; }
    }
    const s = p => p == null ? '   —' : (p/10).toFixed(0).padStart(4) + ' s';
    const bot = e.lignes[1];
    console.log(P.padEnd(11) + D.padEnd(15) + s(premiere) + '   ' + s(maMort) +
      '   ' + s(fin) + '   ' + String(bot.revenu).padStart(9) + String(bot.vies).padStart(10));
  }
  console.log('');
}
