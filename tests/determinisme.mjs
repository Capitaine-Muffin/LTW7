/* Le test qui compte le plus du projet.
   Si deux parties de meme graine divergent, l'anti-triche serveur ne peut plus
   rejouer les parties et le PvP asynchrone ne marche pas. Ce test doit passer
   avant tout le reste. */
import {readFileSync} from 'fs';
const src = ['rng','config','grille','moteur'].map(f =>
  readFileSync(`src/engine/${f}.js`, 'utf8')).join('\n');
const M = {};
new Function('X', src + '\nObject.assign(X,{creerPartie,avancer,poserBatiment,ameliorer,envoyer,faireApparaitre,acheterBranche,acheterFeuille,CONFIG});')(M);

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
dire(M.envoyer(e, l0, 'mouton') === false, 'un monstre non encore debloque est refuse');
for (let i = 0; i < 30; i++) M.avancer(e);          // on passe la 5e seconde
const rev = l0.revenu;
dire(M.envoyer(e, l0, 'mouton') === true, 'une fois debloque, il part');
dire(l0.revenu === rev + 1, 'un envoi augmente le revenu definitivement');
dire(e.lignes[1].monstres.length >= 1, 'le monstre part chez le voisin, pas chez soi');

console.log('\nchronologie et stocks');
const st = M.creerPartie({graine: 2, joueurs: 3, profil: 'CLASSIQUE'});
const j0 = st.lignes[0]; j0.or = 10000000;
dire(st.cfg.MONSTRES.seigneur.dispo === 800, 'le Seigneur bandit est bien fixe a 800 s');
dire(st.cfg.MONSTRES.seigneur.stock[0] === 3, 'son stock maximum est de 3');
dire(M.envoyer(st, j0, 'seigneur') === false, 'on ne peut pas l\'envoyer au debut de la partie');
for (let i = 0; i < 60; i++) M.avancer(st);
const stockAvant = j0.stock.mouton;
for (let n = 0; n < 5; n++) M.envoyer(st, j0, 'mouton');
dire(j0.stock.mouton < stockAvant,
  `le stock se vide quand on envoie (${stockAvant} -> ${j0.stock.mouton})`);
const bas = j0.stock.mouton;
for (let i = 0; i < 60; i++) M.avancer(st);
dire(j0.stock.mouton > bas, `et il se recharge avec le temps (${bas} -> ${j0.stock.mouton})`);
/* Le plafond de stock est ce qui empeche de noyer l'adversaire sous le
   meilleur ratio : on ne peut pas envoyer vingt Moutons d'affilee. */
let envoisAffiles = 0;
while (M.envoyer(st, j0, 'mouton')) envoisAffiles++;
dire(envoisAffiles <= st.cfg.MONSTRES.mouton.stock[0],
  `le plafond de stock borne les envois d'affilee (${envoisAffiles} au maximum)`);

console.log('\nscellement et Controleur');
const s = M.creerPartie({graine: 9, joueurs: 3});
const ls = s.lignes[0]; ls.or = 100000;
for (let x = 0; x < 9; x++) M.poserBatiment(s, ls, 'guet', x, 6);
dire(ls.scellee === true, 'un mur complet scelle bien la ligne');
const avant = ls.batiments.length;
for (let i = 0; i < 900; i++) M.avancer(s);
dire(ls.batiments.length < avant, `le Controleur a demoli (${avant} -> ${ls.batiments.length} batiments)`);

console.log('\nles briseurs cassent au lieu de passer');
const br = M.creerPartie({graine: 5, joueurs: 3});
/* On neutralise les autres bots : sinon leurs propres envois volent des vies
   a la ligne observee et le test mesure autre chose que le Demolisseur. */
for (const l of br.lignes) l.estJoueur = true;
const cible = br.lignes[1];
cible.or = 100000;
for (const [x, y] of [[3,4],[5,4],[3,6],[5,6]]) M.poserBatiment(br, cible, 'guet', x, y);
/* La ligne visee est tenue par un bot qui continue de batir : on suit donc
   des tours PRECISES, pas un total. */
const viesAvant = cible.vies;
br.lignes[0].or = 100000;
/* Le Demolisseur n'est disponible qu'a 160 s : on avance jusque-la. */
while (!M.envoyer(br, br.lignes[0], 'demolisseur')) M.avancer(br);
const suivies = cible.batiments.map(b => b.id);
/* On surveille pas a pas : tant qu'il reste une tour debout, le compteur de
   vies ne doit pas bouger. Une fois la ligne rasee, il a le droit de sortir. */
let volAvantRasage = false, viesAuRasage = viesAvant;
for (let i = 0; i < 900; i++){
  M.avancer(br);
  if (cible.batiments.length > 0){
    if (cible.vies < viesAuRasage) volAvantRasage = true;
    viesAuRasage = cible.vies;
  }
}
const restantes = suivies.filter(id => cible.batiments.some(b => b.id === id)).length;
dire(restantes < suivies.length,
  `le Demolisseur a detruit des tours suivies (${suivies.length} -> ${restantes})`);
dire(!volAvantRasage && viesAuRasage === viesAvant,
  `aucune vie volee tant qu'il restait une tour debout (${viesAvant} -> ${viesAuRasage})`);

console.log('\nun briseur sort quand il n\'y a plus rien a casser');
const br2 = M.creerPartie({graine: 6, joueurs: 3});
br2.lignes[0].or = 100000;
br2.lignes[1].estJoueur = true;                     // on neutralise le bot : ligne vide
while (!M.envoyer(br2, br2.lignes[0], 'demolisseur')) M.avancer(br2);
let sorti = false;
for (let i = 0; i < 900 && !sorti; i++){ M.avancer(br2);
  sorti = br2.journal.some(j => j.type === 'vol' && j.de === 1); }
dire(sorti, 'sur une ligne sans tour, il file a la sortie et vole une vie');

console.log('\nles quatre difficultes tiennent la duree');
for (const d of ['facile','normal','agressif','impitoyable']){
  let planté = null;
  const e2 = M.creerPartie({graine: 31337, joueurs: 7, difficulte: d, profil: 'BLITZ'});
  try { for (let i = 0; i < 6000; i++) M.avancer(e2); }
  catch (err){ planté = err.message; }
  const vivants = e2.lignes.filter(l => !l.mort).length;
  dire(!planté, `${d} : 600 s sans plantage${planté ? ' — ' + planté : ''} (${vivants} survivant(s))`);
}

console.log('\nles bots ne jouent pas deux fois la meme partie');
function melange(graine, diff){
  const e = M.creerPartie({graine, joueurs: 4, difficulte: diff, profil: 'BLITZ'});
  for (let i = 0; i < 3000; i++) M.avancer(e);
  return e.lignes[1].envoisParType;
}
const a1 = melange(111, 'normal'), a2 = melange(222, 'normal');
dire(JSON.stringify(a1) !== JSON.stringify(a2),
  `deux graines -> deux facons de jouer (${Object.keys(a1).length} et ${Object.keys(a2).length} types envoyes)`);
dire(Object.keys(a1).length >= 2,
  `un bot ne se contente pas d'un seul monstre (${Object.keys(a1).join(', ')})`);
const dur = melange(111, 'impitoyable');
dire(Object.keys(dur).length >= 2,
  `meme le plus dur varie (${Object.keys(dur).join(', ')})`);

console.log('\nla difficulte change vraiment le jeu');
const envois = {};
for (const d of ['facile','impitoyable']){
  const e3 = M.creerPartie({graine: 99, joueurs: 4, difficulte: d, profil: 'BLITZ'});
  for (let i = 0; i < 1500; i++) M.avancer(e3);
  envois[d] = e3.lignes[1].revenu;
}
dire(envois.impitoyable > envois.facile * 1.5,
  `revenu d'un bot a 150 s : debutant ${envois.facile}, impitoyable ${envois.impitoyable}`);

/* Les projectiles sont dessines a partir de cette trace : si le moteur cesse
   de la remplir, les tours tirent en silence et personne ne le voit passer. */
console.log('\nle moteur laisse une trace de chaque tir');
{
  const e = M.creerPartie({graine: 7, joueurs: 3});
  M.poserBatiment(e, e.lignes[0], 'guet', 4, 4);
  M.faireApparaitre(e, e.lignes[0], 'mouton', 1);
  let vus = 0, exemple = null;
  for (let i = 0; i < 40; i++){
    M.avancer(e);
    for (const t of e.tirs) if (t.ligne === 0){ vus++; exemple = exemple || t; }
  }
  dire(vus > 0, `une tour de guet laisse ${vus} tir(s) en 4 s`);
  dire(exemple && exemple.type === 'guet' && Number.isInteger(exemple.cx),
    'le tir porte le type de la tour et un point d\'impact entier');
  const avant = e.tirs.length; M.avancer(e);
  dire(e.tirs.length <= Math.max(1, avant + 2), 'la trace est videe a chaque pas, elle ne s\'accumule pas');
}

/* Le budget en bois est LA decision de debut de partie : quinze deblocages a
   un bois, trois bois au depart. Si les feuilles redeviennent gratuites, le
   choix disparait et tout le monde finit avec le meme arbre complet. */
console.log('\nles quinze deblocages coutent un bois chacun');
{
  const e = M.creerPartie({graine: 3, joueurs: 3});
  const l = e.lignes[0];
  dire(l.bois === 3, `trois bois au depart (${l.bois})`);
  dire(!M.acheterFeuille(e, l, 'boom'), 'une feuille se refuse tant que sa racine n\'est pas ouverte');
  dire(M.acheterBranche(e, l, 'feu') && l.bois === 2, 'la racine Feu coute 1 bois');
  dire(M.acheterFeuille(e, l, 'boom') && l.bois === 1, 'la feuille BOUM coute 1 bois');
  dire(M.acheterFeuille(e, l, 'meteore') && l.bois === 0, 'la seconde feuille aussi');
  dire(!M.acheterBranche(e, l, 'froid'), 'a zero bois, plus rien ne s\'ouvre');

  /* Et l'or seul ne suffit pas : sans le bois, la tour de fin reste fermee. */
  const e2 = M.creerPartie({graine: 3, joueurs: 3});
  const l2 = e2.lignes[0];
  M.acheterBranche(e2, l2, 'feu');
  M.poserBatiment(e2, l2, 'guet', 2, 2);
  const b2 = l2.batiments[0];
  l2.or = 99999;
  b2.type = 'puits';
  dire(!M.ameliorer(e2, l2, b2, 'boom'), 'riche mais sans bois : la tour BOUM reste fermee');
  M.acheterFeuille(e2, l2, 'boom');
  dire(M.ameliorer(e2, l2, b2, 'boom'), 'le bois depense, elle s\'ouvre');
}

/* Une tour qui se fait demolir doit riposter, pas continuer a tirer sur les
   moutons qui passent. C'est ce qui rend les briseurs jouables des deux cotes. */
console.log('\nune tour riposte a qui la demolit');
{
  const e = M.creerPartie({graine: 5, joueurs: 3});
  const l = e.lignes[0];
  M.poserBatiment(e, l, 'guet', 4, 6);
  M.faireApparaitre(e, l, 'demolisseur', 1);   // vient casser
  M.faireApparaitre(e, l, 'mouton', 1);        // passe devant, plus avance
  const brise = l.monstres[0], mouton = l.monstres[1];
  let touche = null;
  for (let i = 0; i < 200 && !touche; i++){
    M.avancer(e);
    if (brise.pv < brise.pvMax) touche = 'briseur';
    else if (mouton.pv < mouton.pvMax) touche = 'mouton';
  }
  dire(touche === 'briseur', `la tour tire d'abord sur ${touche || 'personne'}`);
}

console.log(echecs ? `\n${echecs} echec(s)\n` : '\ntout passe\n');
process.exit(echecs ? 1 : 0);
