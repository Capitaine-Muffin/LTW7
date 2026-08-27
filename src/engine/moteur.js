/* Le moteur. Pur : aucun DOM, aucun reseau, aucune horloge systeme.
   On avance par avancer(), 100 ms de jeu par appel. Une partie est entierement
   decrite par {graine, profil, entrees[]} — c'est ce qui donne l'anti-triche
   serveur et le PvP asynchrone avec le meme code. */

let _id = 0;
const nouvelId = () => ++_id;

function creerLigne(cfg, prof, i, estJoueur){
  return {
    i, estJoueur, nom: estJoueur ? 'Toi' : 'Bot ' + i,
    or: prof.or, revenu: prof.revenu, vies: prof.vies, bois: prof.bois,
    branches: {}, batiments: [], monstres: [],
    occupe: new Int32Array(cfg.LARGEUR * cfg.HAUTEUR).fill(-1),
    chemin: null, scellee: false, mort: false,
    prochainBot: 60 + i * 17          // decale les bots pour qu'ils ne jouent pas a l'unisson
  };
}

function creerPartie({graine = 12345, profil = 'BLITZ', joueurs = 4, cfg = CONFIG} = {}){
  _id = 0;
  const prof = cfg.PROFILS[profil];
  const etat = {
    cfg, prof, pas: 0, rng: creerRng(graine), graine, profil,
    lignes: [], moi: 0, fini: false, vainqueur: null, journal: [],
    controleur: null, prochainControleur: cfg.controleur.periode
  };
  for (let i = 0; i < joueurs; i++) etat.lignes.push(creerLigne(cfg, prof, i, i === 0));
  etat.lignes.forEach(l => recalculerChemin(etat, l));
  return etat;
}

/* Le voisin a qui on envoie : le suivant encore en vie, en cercle. */
function voisin(etat, i){
  const n = etat.lignes.length;
  for (let k = 1; k <= n; k++){
    const j = (i + k) % n;
    if (!etat.lignes[j].mort) return j;
  }
  return i;
}

function recalculerChemin(etat, l){
  l.chemin = calculerChemin(etat.cfg, l.occupe, null);
  l.scellee = l.chemin === null;
}

/* ---- actions du joueur --------------------------------------------------- */
function poserBatiment(etat, l, type, x, y){
  const cfg = etat.cfg, def = cfg.TOURS[type];
  const i = y * cfg.LARGEUR + x;
  if (!def || l.occupe[i] >= 0 || l.or < def.or) return false;
  if (x === cfg.entree.x && y === cfg.entree.y) return false;
  if (x === cfg.exit.x && y === cfg.exit.y) return false;
  l.or -= def.or;
  const b = {id: nouvelId(), type, x, y, pv: def.pv, pvMax: def.pv, recharge: 0};
  l.batiments.push(b);
  l.occupe[i] = b.id;
  recalculerChemin(etat, l);
  return true;
}
function ameliorer(etat, l, b, vers){
  const cfg = etat.cfg, def = cfg.TOURS[vers];
  if (!def) return false;
  if (def.branche && !l.branches[def.branche]) return false;
  if (l.or < def.or) return false;
  l.or -= def.or;
  b.type = vers; b.pvMax = def.pv; b.pv = def.pv; b.recharge = 0;
  return true;
}
function vendre(etat, l, b){
  const def = etat.cfg.TOURS[b.type];
  l.or += Math.floor(def.or * etat.cfg.remboursement / 100);
  retirerBatiment(etat, l, b);
  return true;
}
function retirerBatiment(etat, l, b){
  l.occupe[b.y * etat.cfg.LARGEUR + b.x] = -1;
  l.batiments.splice(l.batiments.indexOf(b), 1);
  recalculerChemin(etat, l);
}
function envoyer(etat, l, type){
  const def = etat.cfg.MONSTRES[type];
  if (!def || l.or < def.or) return false;
  const cible = etat.lignes[voisin(etat, l.i)];
  if (cible === l) return false;
  if (cible.monstres.length >= etat.cfg.maxVivants) return false;
  l.or -= def.or;
  l.revenu += def.revenu;                       // definitif : c'est tout le jeu
  faireApparaitre(etat, cible, type, l.i);
  return true;
}
function acheterBranche(etat, l, cle){
  if (l.branches[cle] || l.bois < 1) return false;
  l.bois -= 1; l.branches[cle] = true; return true;
}

function faireApparaitre(etat, ligne, type, proprietaire){
  const cfg = etat.cfg, def = cfg.MONSTRES[type];
  ligne.monstres.push({
    id: nouvelId(), type, proprietaire, pv: def.pv, pvMax: def.pv,
    x: cfg.entree.x * cfg.MILLI + cfg.MILLI / 2,
    y: cfg.entree.y * cfg.MILLI + cfg.MILLI / 2,
    etape: 0, lent: 0, etourdi: 0, poison: 0, poisonReste: 0
  });
}

/* ---- un pas de simulation ------------------------------------------------ */
function avancer(etat){
  const cfg = etat.cfg;
  etat.pas++;
  if (etat.pas % etat.prof.tickRevenu === 0)
    for (const l of etat.lignes) if (!l.mort) l.or += l.revenu;

  for (const l of etat.lignes) if (!l.mort){ deplacerMonstres(etat, l); tirer(etat, l); }
  bots(etat);
  controleur(etat);

  const vivants = etat.lignes.filter(l => !l.mort);
  if (vivants.length <= 1 && !etat.fini){
    etat.fini = true;
    etat.vainqueur = vivants[0] ? vivants[0].i : null;
  }
  return etat;
}

function deplacerMonstres(etat, l){
  const cfg = etat.cfg;
  for (let k = l.monstres.length - 1; k >= 0; k--){
    const m = l.monstres[k], def = cfg.MONSTRES[m.type];
    if (m.poisonReste > 0){ m.poisonReste--; if (etat.pas % 10 === 0) m.pv -= m.poison; }
    if (m.pv <= 0){ l.monstres.splice(k, 1); continue; }
    if (m.etourdi > 0){ m.etourdi--; continue; }
    let v = def.v;
    if (m.lent > 0){ m.lent--; v = Math.round(v * (100 - 40) / 100); }

    if (def.vol){                                   // les volants ignorent le maze
      const cy = cfg.exit.y * cfg.MILLI + cfg.MILLI / 2;
      const cx = cfg.exit.x * cfg.MILLI + cfg.MILLI / 2;
      const dx = cx - m.x, dy = cy - m.y;
      const d = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy)));
      m.x += Math.round(dx * v / d); m.y += Math.round(dy * v / d);
      if (d <= v){ sortie(etat, l, m, k); }
      continue;
    }
    if (!l.chemin){ continue; }                     // ligne scellee : il attend
    const suiv = l.chemin[Math.min(m.etape + 1, l.chemin.length - 1)];
    const sx = (suiv % cfg.LARGEUR) * cfg.MILLI + cfg.MILLI / 2;
    const sy = ((suiv / cfg.LARGEUR) | 0) * cfg.MILLI + cfg.MILLI / 2;
    const dx = sx - m.x, dy = sy - m.y;
    const d = Math.abs(dx) + Math.abs(dy);
    if (d <= v){
      m.x = sx; m.y = sy; m.etape++;
      if (m.etape >= l.chemin.length - 1){ sortie(etat, l, m, k); }
    } else {
      m.x += Math.round(dx * v / d); m.y += Math.round(dy * v / d);
    }
  }
}

/* Un monstre qui sort vole une vie ET repart sur la ligne suivante. */
function sortie(etat, l, m, k){
  const envoyeur = etat.lignes[m.proprietaire];
  l.monstres.splice(k, 1);
  if (l.vies > 0){
    l.vies -= 1;
    if (envoyeur && !envoyeur.mort) envoyeur.vies += 1;
    etat.journal.push({pas: etat.pas, type: 'vol', de: l.i, vers: m.proprietaire});
  }
  if (l.vies <= 0 && !l.mort){
    l.mort = true; l.monstres = [];
    if (envoyeur && !envoyeur.mort) envoyeur.bois += etat.cfg.boisParKill;
    etat.journal.push({pas: etat.pas, type: 'mort', ligne: l.i, par: m.proprietaire});
    return;
  }
  const suivante = etat.lignes[voisin(etat, l.i)];
  if (suivante && suivante !== l && !suivante.mort &&
      suivante.monstres.length < etat.cfg.maxVivants && m.pv > 0){
    m.etape = 0;
    m.x = etat.cfg.entree.x * etat.cfg.MILLI + etat.cfg.MILLI / 2;
    m.y = etat.cfg.entree.y * etat.cfg.MILLI + etat.cfg.MILLI / 2;
    suivante.monstres.push(m);
  }
}

function tirer(etat, l){
  const cfg = etat.cfg;
  for (const b of l.batiments){
    const def = cfg.TOURS[b.type];
    if (!def.deg && !def.degPct && !def.teleporte) continue;
    if (b.recharge > 0){ b.recharge--; continue; }
    const bx = b.x * cfg.MILLI + cfg.MILLI / 2, by = b.y * cfg.MILLI + cfg.MILLI / 2;
    let cible = null, meilleure = -1;
    for (const m of l.monstres){                    // le plus avance d'abord
      const dx = m.x - bx, dy = m.y - by;
      if (dx * dx + dy * dy > def.p * def.p) continue;
      if (m.etape > meilleure){ meilleure = m.etape; cible = m; }
    }
    if (!cible) continue;
    b.recharge = def.c;
    if (def.teleporte){ cible.etape = 0;
      cible.x = cfg.entree.x * cfg.MILLI + cfg.MILLI / 2;
      cible.y = cfg.entree.y * cfg.MILLI + cfg.MILLI / 2; continue; }
    const touches = def.zone
      ? l.monstres.filter(m => {const dx = m.x - cible.x, dy = m.y - cible.y;
          return dx * dx + dy * dy <= def.zone * def.zone;})
      : [cible];
    for (const m of touches){
      m.pv -= def.degPct ? Math.ceil(m.pv * def.degPct / 100) : def.deg;
      if (def.ralentit) m.lent = 20;
      if (def.etourdit) m.etourdi = def.etourdit;
      if (def.poison){ m.poison = def.poison; m.poisonReste = 40; }
    }
    l.monstres = l.monstres.filter(m => m.pv > 0);
    if (def.usageUnique) retirerBatiment(etat, l, b);
  }
}

/* Bots : deterministes, pas d'IA. Ils mazent en serpentin et envoient
   regulierement le meilleur monstre qu'ils peuvent payer. */
const PLAN_BOT = [];
for (let y = 2; y <= 10; y += 2)
  for (let x = 0; x < 9; x++) PLAN_BOT.push({x, y: y, sauter: (y / 2) % 2 ? x === 8 : x === 0});
function bots(etat){
  const cfg = etat.cfg;
  for (const l of etat.lignes){
    if (l.estJoueur || l.mort) continue;
    if (l.or >= 30 && etat.pas % 7 === 0){
      const place = PLAN_BOT.filter(p => !p.sauter)[l.batiments.length];
      if (place && l.occupe[place.y * cfg.LARGEUR + place.x] < 0)
        poserBatiment(etat, l, l.batiments.length % 3 === 0 ? 'epine' : 'guet', place.x, place.y);
    }
    if (etat.pas >= l.prochainBot){
      /* Le seul aleatoire du moteur, et il passe par le RNG seme : sans lui,
         toutes les parties d'un meme profil seraient identiques. */
      l.prochainBot = etat.pas + etat.rng.entre(70, 130);
      const abordables = Object.keys(cfg.MONSTRES)
        .filter(k => cfg.MONSTRES[k].or <= l.or)
        .sort((a, b) => cfg.MONSTRES[b].or - cfg.MONSTRES[a].or);
      if (abordables.length){
        /* Le plus cher la plupart du temps, sinon le suivant : un bot qui joue
           toujours pareil se lit en une partie. */
        const choix = (abordables.length > 1 && etat.rng.entre(0, 3) === 0) ? 1 : 0;
        envoyer(etat, l, abordables[choix]);
      }
    }
  }
}

/* Le Controleur : une seule unite, invulnerable, qui traverse les lignes et
   demolit ce qui scelle le passage. Il ne vole aucune vie. */
function controleur(etat){
  const cfg = etat.cfg;
  if (!etat.controleur){
    if (etat.pas < etat.prochainControleur) return;
    const scellee = etat.lignes.find(l => !l.mort && l.scellee);
    if (!scellee) { etat.prochainControleur = etat.pas + 50; return; }
    etat.controleur = {ligne: scellee.i, x: cfg.entree.x * cfg.MILLI + cfg.MILLI / 2,
      y: cfg.entree.y * cfg.MILLI + cfg.MILLI / 2, etape: 0, chemin: null};
  }
  const c = etat.controleur, l = etat.lignes[c.ligne];
  if (l.mort){ etat.controleur = null; etat.prochainControleur = etat.pas + cfg.controleur.periode; return; }
  if (!c.chemin || c.chemin.length === 0)
    c.chemin = calculerChemin(cfg, l.occupe, i => {
      const b = l.batiments.find(b => b.id === l.occupe[i]);
      return b ? Math.round(b.pv / 20) : 0;
    });
  if (!c.chemin){ etat.controleur = null; return; }

  const cible = c.chemin[Math.min(c.etape + 1, c.chemin.length - 1)];
  const occupant = l.occupe[cible];
  if (occupant >= 0){                                // il vaporise, il ne perce pas
    const cx = (cible % cfg.LARGEUR) * cfg.MILLI + cfg.MILLI / 2;
    const cy = ((cible / cfg.LARGEUR) | 0) * cfg.MILLI + cfg.MILLI / 2;
    for (const b of [...l.batiments]){
      const bx = b.x * cfg.MILLI + cfg.MILLI / 2, by = b.y * cfg.MILLI + cfg.MILLI / 2;
      const dx = bx - cx, dy = by - cy;
      if (dx * dx + dy * dy <= cfg.controleur.zone * cfg.controleur.zone){
        b.pv -= cfg.controleur.deg;
        if (b.pv <= 0) retirerBatiment(etat, l, b);
      }
    }
    etat.journal.push({pas: etat.pas, type: 'controleur', ligne: l.i});
    c.chemin = null;
    return;
  }
  const sx = (cible % cfg.LARGEUR) * cfg.MILLI + cfg.MILLI / 2;
  const sy = ((cible / cfg.LARGEUR) | 0) * cfg.MILLI + cfg.MILLI / 2;
  const dx = sx - c.x, dy = sy - c.y, d = Math.abs(dx) + Math.abs(dy);
  const v = cfg.controleur.v;
  if (d <= v){ c.x = sx; c.y = sy; c.etape++;
    if (c.etape >= c.chemin.length - 1){
      etat.controleur = null; etat.prochainControleur = etat.pas + cfg.controleur.periode; }
  } else { c.x += Math.round(dx * v / d); c.y += Math.round(dy * v / d); }
}
