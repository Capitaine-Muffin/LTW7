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
    depenseTours: 0, depenseEnvois: 0,   // sert au partage or/envois des bots
    stock: {}, prochainStock: {},        // chronologie de deblocage (voir config)
    envoisParType: {},                   // ce qu'on a envoye, et combien de fois
    occupe: new Int32Array(cfg.LARGEUR * cfg.HAUTEUR).fill(-1),
    chemin: null, scellee: false, mort: false,
    prochainBot: 60 + i * 17          // decale les bots pour qu'ils ne jouent pas a l'unisson
  };
}

function creerPartie({graine = 12345, profil = 'BLITZ', joueurs = 4,
                      difficulte = 'normal', cfg = CONFIG} = {}){
  _id = 0;
  const prof = cfg.PROFILS[profil];
  const diff = cfg.DIFFICULTES[difficulte] || cfg.DIFFICULTES.normal;
  const etat = {
    cfg, prof, diff, pas: 0, rng: creerRng(graine), graine, profil, difficulte,
    lignes: [], moi: 0, fini: false, vainqueur: null, journal: [],
    controleur: null, prochainControleur: cfg.controleur.periode
  };
  for (let i = 0; i < joueurs; i++){
    const l = creerLigne(cfg, prof, i, i === 0);
    for (const k in cfg.MONSTRES){
      l.stock[k] = cfg.MONSTRES[k].stock[0];      // le stock est plein au deblocage
      l.prochainStock[k] = 0;
    }
    etat.lignes.push(l);
  }
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
  l.or -= def.or; l.depenseTours += def.or;
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
  l.or -= def.or; l.depenseTours += def.or;
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
/* A quel pas de simulation un monstre devient-il achetable ? */
function pasDeDisponibilite(etat, def){
  return Math.round(def.dispo * 10 * etat.prof.temps);
}
function disponible(etat, l, type){
  const def = etat.cfg.MONSTRES[type];
  return etat.pas >= pasDeDisponibilite(etat, def) && (l.stock[type] || 0) > 0;
}
function envoyer(etat, l, type){
  const def = etat.cfg.MONSTRES[type];
  if (!def || l.or < def.or) return false;
  if (!disponible(etat, l, type)) return false;
  const cible = etat.lignes[voisin(etat, l.i)];
  if (cible === l) return false;
  if (cible.monstres.length >= etat.cfg.maxVivants) return false;
  l.or -= def.or; l.depenseEnvois += def.or;
  l.stock[type] -= 1;
  l.envoisParType[type] = (l.envoisParType[type] || 0) + 1;
  if (l.prochainStock[type] <= etat.pas)
    l.prochainStock[type] = etat.pas + Math.max(1, Math.round(def.stock[1] * 10 * etat.prof.temps));
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
    etape: 0, lent: 0, etourdi: 0, poison: 0, poisonReste: 0, cible: null, frappe: 0
  });
}

/* ---- un pas de simulation ------------------------------------------------ */
function avancer(etat){
  const cfg = etat.cfg;
  etat.pas++;
  /* Versement. Trois details repris du JASS de la map :
       - le premier tombe un intervalle complet apres le debut, pas au pas 0 ;
       - les elimines ne touchent rien (ils sortent de la force ThePlayers) ;
       - le versement s'arrete des qu'il ne reste qu'un joueur. */
  if (etat.pas % etat.prof.tickRevenu === 0 && etat.lignes.filter(l => !l.mort).length > 1)
    for (const l of etat.lignes) if (!l.mort) l.or += l.revenu;

  /* Rechargement des stocks. */
  for (const l of etat.lignes){
    if (l.mort) continue;
    for (const k in cfg.MONSTRES){
      const def = cfg.MONSTRES[k];
      if (l.stock[k] >= def.stock[0]) continue;
      if (etat.pas >= l.prochainStock[k]){
        l.stock[k] += 1;
        l.prochainStock[k] = etat.pas + Math.max(1, Math.round(def.stock[1] * 10 * etat.prof.temps));
      }
    }
  }

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
    /* sortie() peut vider ce tableau d'un coup si la ligne meurt : on releve
       l'element a chaque tour et on s'arrete des que la ligne est tombee. */
    const m = l.monstres[k];
    if (!m) continue;
    const def = cfg.MONSTRES[m.type];
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
      if (d <= v){ sortie(etat, l, m, k); if (l.mort) return; }
      continue;
    }
    /* Un briseur ne suit pas le chemin : il marche droit sur le batiment le
       plus proche et le demolit. Quand il n'y a plus rien a casser, il se
       comporte comme n'importe quel monstre et file vers la sortie. */
    if (def.siege && l.batiments.length){
      if (m.cible == null || !l.batiments.some(b => b.id === m.cible)){
        let meilleur = null, dmin = Infinity;
        for (const b of l.batiments){
          const bx = b.x * cfg.MILLI + cfg.MILLI / 2, by = b.y * cfg.MILLI + cfg.MILLI / 2;
          const d2 = (bx - m.x) * (bx - m.x) + (by - m.y) * (by - m.y);
          /* Departage strict par identifiant : deux batiments a egale
             distance doivent toujours donner le meme choix. */
          if (d2 < dmin || (d2 === dmin && meilleur && b.id < meilleur.id)){ dmin = d2; meilleur = b; }
        }
        m.cible = meilleur ? meilleur.id : null;
      }
      const cible = l.batiments.find(b => b.id === m.cible);
      if (cible){
        const bx = cible.x * cfg.MILLI + cfg.MILLI / 2, by = cible.y * cfg.MILLI + cfg.MILLI / 2;
        const dx = bx - m.x, dy = by - m.y;
        const d = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy)));
        if (d > def.siege.portee){
          m.x += Math.round(dx * v / d); m.y += Math.round(dy * v / d);
        } else {
          m.frappe = (m.frappe || 0) - 1;
          if (m.frappe <= 0){
            m.frappe = def.siege.cadence;
            const touches = def.siege.zone
              ? l.batiments.filter(b => {
                  const ax = b.x * cfg.MILLI + cfg.MILLI / 2, ay = b.y * cfg.MILLI + cfg.MILLI / 2;
                  const ex = ax - bx, ey = ay - by;
                  return ex * ex + ey * ey <= def.siege.zone * def.siege.zone;
                })
              : [cible];
            for (const b of touches) b.pv -= def.siege.deg;
            for (const b of [...touches]) if (b.pv <= 0) retirerBatiment(etat, l, b);
            if (cible.pv <= 0) m.cible = null;
          }
        }
        continue;
      }
    }
    if (!l.chemin){ continue; }                     // ligne scellee : il attend
    const suiv = l.chemin[Math.min(m.etape + 1, l.chemin.length - 1)];
    const sx = (suiv % cfg.LARGEUR) * cfg.MILLI + cfg.MILLI / 2;
    const sy = ((suiv / cfg.LARGEUR) | 0) * cfg.MILLI + cfg.MILLI / 2;
    const dx = sx - m.x, dy = sy - m.y;
    const d = Math.abs(dx) + Math.abs(dy);
    if (d <= v){
      m.x = sx; m.y = sy; m.etape++;
      if (m.etape >= l.chemin.length - 1){ sortie(etat, l, m, k); if (l.mort) return; }
    } else {
      m.x += Math.round(dx * v / d); m.y += Math.round(dy * v / d);
    }
  }
}

/* Un monstre qui sort vole une vie ET repart sur la ligne suivante. */
function sortie(etat, l, m, k){
  const envoyeur = etat.lignes[m.proprietaire];
  const i = l.monstres.indexOf(m);            // par identite : l'index peut avoir bouge
  if (i >= 0) l.monstres.splice(i, 1);
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

/* Bots. Deterministes, sans IA : des regles simples dont l'agressivite vient
   du profil de difficulte. Ils jouent avec les memes couts que le joueur. */

/* Tirage pondere : le premier de la liste sort le plus souvent, les suivants
   de moins en moins. `biais` regle la pente — 1,0 donne un tirage uniforme.
   Tout passe par le RNG seme, donc la partie reste rejouable a l'identique. */
function tirerPondere(rng, liste, biais){
  if (liste.length <= 1) return liste[0];
  const poids = [];
  let total = 0, p = 1000;
  for (let i = 0; i < liste.length; i++){
    poids.push(Math.max(1, Math.round(p)));
    total += poids[i];
    p *= biais;
  }
  let n = rng.entre(1, total);
  for (let i = 0; i < liste.length; i++){ n -= poids[i]; if (n <= 0) return liste[i]; }
  return liste[liste.length - 1];
}

/* Serpentin : on laisse une case libre en bout de rangee, alternee, ce qui
   allonge le trajet sans jamais sceller le couloir. */
function planMaze(cfg){
  const plan = [];
  for (let r = 0; r < 5; r++){
    const y = 2 + r * 2, gauche = r % 2 === 0;
    for (let x = 0; x < cfg.LARGEUR; x++){
      if (gauche ? x === cfg.LARGEUR - 1 : x === 0) continue;   // la breche
      plan.push({x, y});
    }
  }
  return plan;
}
/* Sans maze : un bloc compact, mauvais et lisible comme tel. */
function planBloc(cfg){
  const plan = [];
  for (let y = 4; y <= 8; y++) for (let x = 2; x <= 6; x++) plan.push({x, y});
  return plan;
}
let PLAN_MAZE = null, PLAN_BLOC = null;

function bots(etat){
  const cfg = etat.cfg, d = etat.diff;
  if (!PLAN_MAZE){ PLAN_MAZE = planMaze(cfg); PLAN_BLOC = planBloc(cfg); }
  for (const l of etat.lignes){
    if (l.estJoueur || l.mort) continue;

    /* Construire — mais pas au point d'etouffer l'economie. La communaute LTW
       s'accorde sur environ 60 % de l'or en envois : un bot qui met tout dans
       ses tours meurt etrangle vingt secondes plus tard. On borne donc la
       depense en tours par rapport a la depense en envois. */
    const plafondTours = (l.depenseEnvois + 90) * (1 - d.partEnvois) / d.partEnvois;
    if (etat.pas % d.poseTous === 0 && l.depenseTours < plafondTours){
      const plan = d.maze ? PLAN_MAZE : PLAN_BLOC;
      const place = plan[l.batiments.length];
      if (place && l.occupe[place.y * cfg.LARGEUR + place.x] < 0){
        const type = (l.batiments.length % 3 === 0) ? 'epine' : 'guet';
        poserBatiment(etat, l, type, place.x, place.y);
      }
      /* Monter les tours, et les monter LOIN. Une tour de guet a 100 points de
         vie ne survit pas une seconde a un briseur de fin de partie : un bot
         riche qui continue de poser des tours a 10 or n'a plus de defense du
         tout. Il faut donc construire en PROFONDEUR des que l'or le permet —
         plusieurs paliers d'un coup sur la meme tour. */
      if (d.ameliore && l.batiments.length){
        let b = l.batiments.reduce((a, z) =>
          (cfg.TOURS[z.type].or < cfg.TOURS[a.type].or ? z : a));
        for (let etage = 0; etage < 4; etage++){
          const vers = (cfg.TOURS[b.type].vers || [])
            .flatMap(v => v === 'ELEM'
              ? Object.keys(cfg.TOURS).filter(k => cfg.TOURS[k].branche && l.branches[cfg.TOURS[k].branche])
              : [v])
            .filter(v => { const t2 = cfg.TOURS[v];
              return (!t2.branche || l.branches[t2.branche]) && t2.or <= l.or; });
          if (!vers.length) break;
          if (!ameliorer(etat, l, b, vers[etat.rng.entre(0, vers.length - 1)])) break;
        }
      }
    }

    /* Se specialiser */
    if (d.branches && l.bois >= 1){
      const libres = Object.keys(cfg.BRANCHES).filter(k => !l.branches[k]);
      if (libres.length) acheterBranche(etat, l, libres[etat.rng.entre(0, libres.length - 1)]);
    }

    /* Envoyer. Le choix du monstre est LA decision economique du jeu, et un
       bot qui prend toujours le plus cher joue mal : les gros monstres ont le
       plus mauvais ratio revenu/or (0,054 contre 0,200 pour le moins cher).
       Un bon bot farme au ratio et ne paye la percee que ponctuellement. */
    if (etat.pas >= l.prochainBot){
      l.prochainBot = etat.pas + etat.rng.entre(d.intervalle[0], d.intervalle[1]);
      /* Il arrive qu'on laisse passer son tour : un joueur hesite, ou garde son
         or pour la fenetre suivante. */
      if (etat.rng.entre(1, 100) <= d.saute) continue;
      let budget = Math.floor(l.or * d.partEnvois);
      const cles = Object.keys(cfg.MONSTRES);
      /* Ce qui est rare change au fil de la partie. Au debut c'est l'or, donc
         le bon critere est le revenu par piece. Plus tard l'or ne manque plus
         et ce qui est rare, c'est la PLACE : douze unites vivantes au maximum
         par ligne, et une fenetre d'envoi toutes les quelques secondes. Le bon
         critere devient alors le revenu par envoi. Trier par revenu decroissant
         couvre les deux cas tout seul : au debut on ne peut de toute facon
         s'offrir que les petits. */
      const parRevenu = [...cles].sort((a, b) => cfg.MONSTRES[b].revenu - cfg.MONSTRES[a].revenu);
      const parRatio = [...cles].sort((a, b) =>
        (cfg.MONSTRES[b].revenu / cfg.MONSTRES[b].or) - (cfg.MONSTRES[a].revenu / cfg.MONSTRES[a].or));
      const parPrix = [...cles].sort((a, b) => cfg.MONSTRES[b].or - cfg.MONSTRES[a].or);
      l.envoisFaits = (l.envoisFaits || 0) + 1;
      const percee = d.ameliore && l.envoisFaits % 4 === 0;   // percee ponctuelle
      /* Les bots qui savent jouer alternent : voler des vies, puis raser la
         defense pour que les envois suivants passent tout seuls. */
      const siege = d.siege && l.envoisFaits % 3 === 0;
      if (siege){
        const briseurs = cles.filter(k => cfg.MONSTRES[k].siege && cfg.MONSTRES[k].or <= budget
            && !cfg.MONSTRES[k].sacrifice && disponible(etat, l, k))
          .sort((a, b) => cfg.MONSTRES[b].or - cfg.MONSTRES[a].or);
        if (briseurs.length && envoyer(etat, l, briseurs[0])) budget -= cfg.MONSTRES[briseurs[0]].or;
      }

      const combien = etat.rng.entre(2, 6);            // toutes les salves ne se valent pas
      for (let n = 0; n < combien; n++){
        const abordable = k => cfg.MONSTRES[k].or <= budget && cfg.MONSTRES[k].or <= l.or
          && disponible(etat, l, k);
        const dispo = cles.filter(abordable);
        if (!dispo.length) break;
        let cle;
        if (percee && n === 0){
          cle = tirerPondere(etat.rng, parPrix.filter(abordable), d.biais);
        } else {
          /* Le classement melange les deux criteres — revenu par envoi et
             revenu par piece — puis on tire dedans. Le bot va souvent vers le
             bon choix, rarement vers l'excellent, parfois a cote. */
          const ordre = etat.rng.entre(0, 2) === 0 ? parRatio : parRevenu;
          cle = tirerPondere(etat.rng, ordre.filter(abordable), d.biais);
        }
        if (!cle || !envoyer(etat, l, cle)) break;
        budget -= cfg.MONSTRES[cle].or;
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
