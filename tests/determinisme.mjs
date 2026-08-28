/* Le test qui compte le plus du projet.
   Si deux parties de meme graine divergent, l'anti-triche serveur ne peut plus
   rejouer les parties et le PvP asynchrone ne marche pas. Ce test doit passer
   avant tout le reste. */
import {readFileSync} from 'fs';
const src = ['rng','config','grille','moteur'].map(f =>
  readFileSync(`src/engine/${f}.js`, 'utf8')).join('\n');
const M = {};
new Function('X', src + '\nObject.assign(X,{creerPartie,avancer,poserBatiment,envoyer,CONFIG});')(M);

function empreinte(e){
  const p = [e.pas, e.fini, e.vainqueur];
  for (const l of e.lignes){
    p.push(l.or, l.revenu, l.vies, l.bois, l.mort ? 1 : 0, l.batiments.length, l.monstres.length);
    for (const b of l.batiments) p.push(b.type, b.x, b.y, b.pv, b.recharge);
    for (const m of l.monstres) p.push(m.type, m.x, m.y, m.pv, m.etape);
  }
  if (e.controleur) p.push(e.controleur.ligne, e.controleur.x, e.controleur.y);
  let h = 2166136261;
  for (const v of p){ const s = String(v);
    for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } }
  return h >>> 0;
}

/* Une partie scriptee : memes actions, aux memes pas. */
function jouer(graine){
  const e = M.creerPartie({graine, joueurs: 5});
  const scenario = [
    [5,'poser','guet',3,3],[8,'poser','epine',5,3],[20,'poser','guet',3,5],
    [40,'envoyer','mouton'],[60,'poser','epine',5,5],[95,'envoyer','loup'],
    [150,'poser','guet',4,7],[210,'envoyer','acolyte'],[300,'poser','epine',2,9],
    [420,'envoyer','fantassin'],[600,'poser','guet',6,9]
  ];
  let k = 0;
  for (let pas = 0; pas < 2500; pas++){
    while (k < scenario.length && scenario[k][0] === pas){
      const [, act, a, b, c] = scenario[k++];
      const l = e.lignes[0];
      if (act === 'poser') M.poserBatiment(e, l, a, b, c);
      else M.envoyer(e, l, a);
    }
    M.avancer(e);
  }
  return e;
}

let echecs = 0;
const dire = (ok, txt) => { console.log(`${ok ? '  ok  ' : '  ECHEC'} ${txt}`); if (!ok) echecs++; };

console.log('\ndeterminisme');
const a = jouer(4242), b = jouer(4242);
dire(empreinte(a) === empreinte(b), 'meme graine -> partie identique au pas 2500');
dire(empreinte(jouer(4243)) !== empreinte(a), 'graine differente -> partie differente');

console.log('\nreprise a mi-chemin');
const c1 = jouer(777);
const c2 = jouer(777);
dire(empreinte(c1) === empreinte(c2), 'rejeu integral reproductible');

console.log('\nentiers seulement');
let flottants = 0;
for (const l of a.lignes){
  for (const m of l.monstres) if (!Number.isInteger(m.x) || !Number.isInteger(m.y)) flottants++;
  for (const b2 of l.batiments) if (!Number.isInteger(b2.pv)) flottants++;
}
dire(flottants === 0, 'aucune position ni PV en virgule flottante');

console.log('\nregles');
const e = M.creerPartie({graine: 1, joueurs: 3});
const l0 = e.lignes[0], orAvant = l0.or;
dire(M.poserBatiment(e, l0, 'guet', 4, 0) === false, 'on ne construit pas sur la case d\'entree');
dire(M.poserBatiment(e, l0, 'guet', 4, 12) === false, 'on ne construit pas sur la sortie');
dire(l0.or === orAvant, 'une pose refusee ne coute rien');
M.poserBatiment(e, l0, 'guet', 3, 4);
dire(l0.or === orAvant - 10, 'une pose acceptee debite le prix');
const rev = l0.revenu; M.envoyer(e, l0, 'mouton');
dire(l0.revenu === rev + 1, 'un envoi augmente le revenu definitivement');
dire(e.lignes[1].monstres.length === 1, 'le monstre part chez le voisin, pas chez soi');

console.log('\nscellement et Controleur');
const s = M.creerPartie({graine: 9, joueurs: 3});
const ls = s.lignes[0]; ls.or = 100000;
for (let x = 0; x < 9; x++) M.poserBatiment(s, ls, 'guet', x, 6);
dire(ls.scellee === true, 'un mur complet scelle bien la ligne');
const avant = ls.batiments.length;
for (let i = 0; i < 900; i++) M.avancer(s);
dire(ls.batiments.length < avant, `le Controleur a demoli (${avant} -> ${ls.batiments.length} batiments)`);

console.log('\nles quatre difficultes tiennent la duree');
for (const d of ['facile','normal','agressif','impitoyable']){
  let planté = null;
  const e2 = M.creerPartie({graine: 31337, joueurs: 7, difficulte: d, profil: 'BLITZ'});
  try { for (let i = 0; i < 6000; i++) M.avancer(e2); }
  catch (err){ planté = err.message; }
  const vivants = e2.lignes.filter(l => !l.mort).length;
  dire(!planté, `${d} : 600 s sans plantage${planté ? ' — ' + planté : ''} (${vivants} survivant(s))`);
}

console.log('\nla difficulte change vraiment le jeu');
const envois = {};
for (const d of ['facile','impitoyable']){
  const e3 = M.creerPartie({graine: 99, joueurs: 4, difficulte: d, profil: 'BLITZ'});
  for (let i = 0; i < 1500; i++) M.avancer(e3);
  envois[d] = e3.lignes[1].revenu;
}
dire(envois.impitoyable > envois.facile * 1.5,
  `revenu d'un bot a 150 s : debutant ${envois.facile}, impitoyable ${envois.impitoyable}`);

console.log(echecs ? `\n${echecs} echec(s)\n` : '\ntout passe\n');
process.exit(echecs ? 1 : 0);
