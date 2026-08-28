import {readFileSync} from 'fs';
const src = ['rng','config','grille','moteur'].map(f => readFileSync(`src/engine/${f}.js`,'utf8')).join('\n');
const M = {}; new Function('X', src + '\nObject.assign(X,{creerPartie,avancer,CONFIG});')(M);
console.log('\nquatre IA de meme niveau — personne n\'est passif\n');
console.log('profil     bots           1re mort   fin       revenu moyen');
console.log('-'.repeat(64));
for (const P of ['BLITZ','CLASSIQUE']) {
  for (const D of ['facile','normal','agressif','impitoyable']){
    let m1=[], mf=[], rev=[];
    for (const g of [17693, 4242, 999, 31337]){
      const e = M.creerPartie({graine:g, profil:P, joueurs:4, difficulte:D});
      e.lignes[0].estJoueur = false;
      let p=null;
      for (let i=0;i<18000;i++){ M.avancer(e);
        if (!p && e.lignes.some(l=>l.mort)) p=e.pas;
        if (e.fini) break; }
      if (p) m1.push(p); if (e.fini) mf.push(e.pas);
      rev.push(Math.round(e.lignes.reduce((a,l)=>a+l.revenu,0)/4));
    }
    const moy = a => a.length ? (a.reduce((x,y)=>x+y,0)/a.length/10).toFixed(0)+' s' : '—';
    console.log(P.padEnd(11)+D.padEnd(15)+moy(m1).padStart(7)+moy(mf).padStart(10)+
      String(Math.round(rev.reduce((a,b)=>a+b,0)/rev.length)).padStart(14));
  }
  console.log('');
}
