/* « J'ai juste spam les mobs et ca a tue tout le monde. » On le simule : la
   ligne 0 ne construit RIEN et envoie des qu'elle peut, en prenant a chaque
   fois le meilleur ratio revenu/or disponible. Si cette strategie gagne, le
   jeu n'a pas de decision — c'est le pire defaut possible pour un tower wars.
     node tools/essai-spam.mjs */
import {readFileSync} from 'fs';
const src = ['rng','config','grille','moteur'].map(f =>
  readFileSync(`src/engine/${f}.js`,'utf8')).join('\n');
const M = {};
new Function('X', src + '\nObject.assign(X,{creerPartie,avancer,envoyer,poserBatiment,ameliorer,acheterBranche,CONFIG});')(M);

/* Deux joueurs humains simules, pour comparer les strategies a armes egales. */
function jouer(graine, diff, profil, strategie){
  const e = M.creerPartie({graine, profil, joueurs: 4, difficulte: diff});
  const l = e.lignes[0], cfg = e.cfg;
  const parRatio = Object.keys(cfg.MONSTRES)
    .sort((a, z) => cfg.MONSTRES[z].revenu / cfg.MONSTRES[z].or
                  - cfg.MONSTRES[a].revenu / cfg.MONSTRES[a].or);
  /* Un serpentin simple, pose case par case : la defense « normale ». */
  const plan = [];
  for (let y = 2; y <= 10; y += 2) for (let x = 1; x < 8; x++) plan.push({x, y});
  for (let i = 0; i < 12000; i++){
    M.avancer(e);
    if (l.mort) break;
    if (strategie !== 'spam' && e.pas % 8 === 0 && l.batiments.length < plan.length){
      const p = plan[l.batiments.length];
      M.poserBatiment(e, l, l.batiments.length % 3 === 0 ? 'epine' : 'guet', p.x, p.y);
    }
    /* Un joueur qui ne fait que poser des tours de guet n'est pas un joueur :
       le vrai geste est d'AMELIORER. Sans ca le banc mesurait un debutant. */
    if (strategie !== 'spam' && e.pas % 12 === 0 && l.batiments.length){
      if (!l.branches.froid) M.acheterBranche(e, l, 'froid');
      const b = l.batiments.reduce((a, z) =>
        cfg.TOURS[z.type].or < cfg.TOURS[a.type].or ? z : a);
      const suite = (cfg.TOURS[b.type].vers || []).flatMap(v => v === 'ELEM'
        ? Object.keys(cfg.TOURS).filter(k => cfg.TOURS[k].branche && l.branches[cfg.TOURS[k].branche])
        : [v]).filter(v => { const t = cfg.TOURS[v];
          return (!t.branche || l.branches[t.branche]) && (!t.feuille || l.feuilles[v]); });
      if (suite.length) M.ameliorer(e, l, b, suite[0]);
    }
    if (strategie !== 'tours' && e.pas % 6 === 0)
      for (const k of parRatio) if (M.envoyer(e, l, k)) break;
    if (e.fini) break;
  }
  return {mort: l.mort, gagne: e.vainqueur === 0, pas: e.pas,
          vies: l.vies, revenu: l.revenu, tours: l.batiments.length};
}

const graines = [17693, 4242, 999, 31337, 777];
console.log('\nstrategie du joueur, contre trois bots — 5 graines\n');
console.log('bots          strategie      gagnees   survie moyenne   revenu final');
console.log('-'.repeat(72));
for (const d of ['normal', 'agressif', 'impitoyable']){
  for (const st of ['spam', 'tours', 'mixte']){
    const r = graines.map(g => jouer(g, d, 'BLITZ', st));
    const gagnees = r.filter(x => x.gagne).length;
    const survie = (r.reduce((a, x) => a + x.pas, 0) / r.length / 10).toFixed(0);
    const rev = Math.round(r.reduce((a, x) => a + x.revenu, 0) / r.length);
    console.log(d.padEnd(14) + st.padEnd(15) + `${gagnees}/5`.padStart(7) +
      String(survie + ' s').padStart(17) + String(rev).padStart(15));
  }
  console.log('');
}
