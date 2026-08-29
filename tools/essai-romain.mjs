/* Le banc calé sur une VRAIE partie (rapport du 2026-08-28, graine 142521) :
   treize tours de guet, aucune amélioration, aucune techno, et du spam du
   meilleur ratio aussi vite que le stock le permet. C'est ce qui a gagne en
   80 s avec 37 vies sur 39. Tant que cette strategie ecrase les bots, le jeu
   n'a pas d'equilibre.
     node tools/essai-romain.mjs */
import {readFileSync} from 'fs';
const src = ['rng','config','grille','moteur'].map(f =>
  readFileSync(`src/engine/${f}.js`,'utf8')).join('\n');
const M = {};
new Function('X', src + '\nObject.assign(X,{creerPartie,avancer,envoyer,poserBatiment,ameliorer,acheterBranche,CONFIG});')(M);

/* Deux profils de joueur, pour verifier que l'echelle de difficulte tient :
   « spam » rejoue la partie du rapport (treize guets, aucune amelioration) ;
   « bon » construit, ameliore et ouvre une branche, ce qu'un joueur fait des
   qu'il a compris le jeu. */
function partie(graine, diff, profil = 'spam'){
  const e = M.creerPartie({graine, profil: 'BLITZ', joueurs: 4, difficulte: diff});
  const l = e.lignes[0], cfg = e.cfg;
  const ratio = Object.keys(cfg.MONSTRES).sort((a, z) =>
    cfg.MONSTRES[z].revenu / cfg.MONSTRES[z].or - cfg.MONSTRES[a].revenu / cfg.MONSTRES[a].or);
  /* Treize tours de guet en bloc, comme dans le rapport. */
  const plan = [];
  for (let y = 3; y <= 9; y += 3) for (let x = 1; x < 8; x++) plan.push({x, y});
  for (let i = 0; i < 12000; i++){
    M.avancer(e);
    if (l.batiments.length < (profil === 'bon' ? plan.length : 13)){
      const p = plan[l.batiments.length];
      if (p) M.poserBatiment(e, l, profil === 'bon' && l.batiments.length % 3 === 0
        ? 'epine' : 'guet', p.x, p.y);
    }
    if (profil === 'bon' && e.pas % 10 === 0 && l.batiments.length){
      if (!l.branches.froid) M.acheterBranche(e, l, 'froid');
      const b = l.batiments.reduce((a, z) =>
        cfg.TOURS[z.type].or < cfg.TOURS[a.type].or ? z : a);
      const suite = (cfg.TOURS[b.type].vers || []).flatMap(v => v === 'ELEM'
        ? Object.keys(cfg.TOURS).filter(k => cfg.TOURS[k].branche && l.branches[cfg.TOURS[k].branche])
        : [v]).filter(v => { const t = cfg.TOURS[v];
          return (!t.branche || l.branches[t.branche]) && (!t.feuille || l.feuilles[v]); });
      if (suite.length) M.ameliorer(e, l, b, suite[0]);
    }
    /* Spam : a chaque pas, autant d'envois que l'or et le stock le permettent. */
    for (let k = 0; k < 3; k++){
      let envoye = false;
      for (const t of ratio) if (M.envoyer(e, l, t)){ envoye = true; break; }
      if (!envoye) break;
    }
    if (e.fini || l.mort) break;
  }
  return {gagne: e.vainqueur === 0, mort: l.mort, pas: e.pas,
          vies: l.vies, envois: Object.values(l.envoisParType).reduce((a, b) => a + b, 0),
          revenu: l.revenu,
          defBot: Math.round(e.lignes.slice(1).reduce((a, x) => a + x.depenseTours, 0) / 3),
          envBot: Math.round(e.lignes.slice(1).reduce((a, x) =>
            a + Object.values(x.envoisParType).reduce((p, q) => p + q, 0), 0) / 3)};
}

const graines = [142521, 698652, 17693, 4242, 999];
console.log('\ndeux profils de joueur contre les bots — 5 graines, Blitz\n');
console.log('bots            profil    gagnees   duree    mes vies   envois bot   defense bot');
console.log('-'.repeat(84));
for (const d of ['facile','normal','agressif','impitoyable']){
  for (const pr of ['spam','bon']){
    const r = graines.map(g => partie(g, d, pr));
    const moy = f => Math.round(r.reduce((a, x) => a + f(x), 0) / r.length);
    console.log(d.padEnd(15) + pr.padEnd(10) + `${r.filter(x => x.gagne).length}/5`.padStart(7) +
      String(moy(x => x.pas / 10) + ' s').padStart(9) +
      String(moy(x => x.vies)).padStart(11) +
      String(moy(x => x.envBot)).padStart(13) + String(moy(x => x.defBot)).padStart(14));
  }
  console.log('');
}
