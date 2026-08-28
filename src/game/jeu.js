/* Rendu et entrees. Tout ce qui touche au DOM vit ici — le moteur, lui, n'en
   sait rien. */

/* Chaque monstre a deux images ; on alterne pour la marche. */

let etat, camp, cache = {}, enMain = null, selection = null, ligneVue = 0,
    menu = null, acceleration = 1, dernier = 0, accum = 0, tirs = [];
/* Le glissement d'ecran entre deux lignes. On photographie le plateau qu'on
   quitte, puis on fait entrer le nouveau par le cote pendant 260 ms. Sans ca,
   changer de ligne se voyait a peine — le decor et la grille se ressemblent
   trop d'une ligne a l'autre. */
let transi = null, photo = null;
const DUREE_TRANSI = 260;

/* Une couleur par joueur : c'est ce qui permet de reconnaitre d'ou vient un
   monstre sans lire une seule ligne de texte. Le joueur est toujours l'or. */
const COULEURS = ['#ffd24a','#e05a5a','#5ac8e0','#8fd06a','#c08aff','#ff9a4a','#7ad0b8'];
const couleurJoueur = i => COULEURS[i % COULEURS.length];

/* L'ecart de foule. Dans la map d'origine les creeps ont `ucol = 1.0`, c'est
   a dire aucune collision : ils se traversent et un envoi simultane se
   superpose au pixel pres. On garde cette regle — elle decide de la longueur
   du chemin et donc de tout l'equilibrage — mais on decale le DESSIN d'un
   monstre a l'autre. Une vague ressemble alors a une troupe, pas a un seul
   monstre plus opaque que les autres. Le decalage ne depend que de l'identifiant :
   il est stable dans le temps, et le tir qui vise ce monstre applique le meme,
   sinon les fleches tomberaient a cote. */
/* Etale le long du chemin, serre en travers : une troupe en marche forme une
   colonne, pas une flaque. En milli-cases. */
const ETAL = 560, LARGE = 230;
function ecartVisuel(m, l){
  let h = Math.imul(m.id ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; h >>>= 0;
  const long = (h % 1000) / 500 - 1;               // -1 a 1, le long du chemin
  const trav = ((h >>> 10) % 1000) / 500 - 1;      // -1 a 1, en travers
  /* Direction locale du chemin : dans un labyrinthe le couloir tourne, et une
     colonne orientee au petit bonheur traverserait les murs. */
  let ux = 0, uy = 1;
  if (l.chemin && l.chemin.length > 1){
    const L = etat.cfg.LARGEUR;
    const a = l.chemin[Math.min(m.etape, l.chemin.length - 1)];
    const b = l.chemin[Math.min(m.etape + 1, l.chemin.length - 1)];
    const vx = (b % L) - (a % L), vy = ((b / L) | 0) - ((a / L) | 0);
    if (vx || vy){ ux = vx; uy = vy; }
  }
  return {dx: Math.round(long * ETAL * ux - trav * LARGE * uy),
          dy: Math.round(long * ETAL * uy + trav * LARGE * ux)};
}

/* ---- pre-rendu des sprites ---------------------------------------------- */
function preparerSprites(){
  for (const cle of Object.keys(MONSTRES_ART)) for (const im of [0, 1]){
    const g = dessinerMonstre(cle, im);
    const cv = document.createElement('canvas');
    cv.width = NM; cv.height = NM;
    const c = cv.getContext('2d');
    for (let y = 0; y < NM; y++) for (let x = 0; x < NM; x++){
      const v = g[y][x]; if (!v) continue; c.fillStyle = v; c.fillRect(x, y, 1, 1);
    }
    cache['m:' + cle + ':' + im] = cv;
  }
  /* Une planche par tour ET par camp : 30 tours x 4 camps. Le pre-rendu se
     fait une fois au demarrage, le jeu ne dessine plus que des images. */
  for (const type in TOURS_ART){
    const a = TOURS_ART[type];
    for (const f of CAMPS){
      const g = dessiner(a.k, f, false, a.r, a.t, a.v);
      const cv = document.createElement('canvas');
      cv.width = N; cv.height = N;
      const c = cv.getContext('2d');
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
        const v = g[y][x]; if (!v) continue;
        c.fillStyle = v; c.fillRect(x, y, 1, 1);
      }
      cache[type + ':' + f.k] = cv;
    }
  }
}

/* ---- dessin -------------------------------------------------------------- */
function dessinerJeu(){
  const cv = document.getElementById('scene'), c = cv.getContext('2d');
  const cfg = etat.cfg, l = etat.lignes[ligneVue];
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const larg = cv.clientWidth, haut = cv.clientHeight;
  /* Verifier la HAUTEUR aussi : ouvrir les reglages retrecit la zone sans
     changer sa largeur, et le bas du tampon gardait l'image precedente. */
  if (cv.width !== Math.round(larg * dpr) || cv.height !== Math.round(haut * dpr)){
    cv.width = Math.round(larg * dpr); cv.height = Math.round(haut * dpr);
  }
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.imageSmoothingEnabled = false;
  /* Decalage du glissement : le nouveau plateau arrive du cote d'ou vient le
     doigt, l'ancien sort de l'autre. Rien d'autre dans la page ne bouge. */
  let dxN = 0;
  if (transi){
    const e = 1 - Math.pow(1 - transi.u, 3);        // depart franc, arrivee douce
    dxN = transi.sens * larg * (1 - e);
  }
  c.save();
  c.translate(dxN, 0);

  const T = Math.floor(Math.min(larg / cfg.LARGEUR, haut / cfg.HAUTEUR));
  const ox = Math.floor((larg - T * cfg.LARGEUR) / 2);
  const oy = Math.floor((haut - T * cfg.HAUTEUR) / 2);
  c.clearRect(0, 0, larg, haut);

  /* Terrain cuit une fois ; sentier recuit seulement quand la grille bouge. */
  const B = BIOME(camp.k);
  if (!terrain || terrain.T !== T || terrain.camp !== camp.k)
    terrain = {T, camp: camp.k, img: cuireTerrain(cfg, T, B)};
  const sig = ligneVue + ':' + camp.k + ':' + (l.chemin ? l.chemin.join(',') : 'scelle');
  if (!sentier || sentier.T !== T || sentier.sig !== sig)
    sentier = {T, sig, img: cuireSentier(cfg, T, l.chemin, B)};
  c.drawImage(terrain.img, ox, oy);
  c.drawImage(sentier.img, ox, oy);

  c.strokeStyle = 'rgba(0,0,0,.07)'; c.lineWidth = 1;
  for (let x = 1; x < cfg.LARGEUR; x++){ c.beginPath();
    c.moveTo(ox + x * T + .5, oy); c.lineTo(ox + x * T + .5, oy + T * cfg.HAUTEUR); c.stroke(); }
  for (let y = 1; y < cfg.HAUTEUR; y++){ c.beginPath();
    c.moveTo(ox, oy + y * T + .5); c.lineTo(ox + T * cfg.LARGEUR, oy + y * T + .5); c.stroke(); }

  c.save();                                          // rien ne deborde du plateau
  c.beginPath(); c.rect(ox, oy, T * cfg.LARGEUR, T * cfg.HAUTEUR); c.clip();
  dessinerEntree(c, cfg, T, ox, oy, B);
  dessinerSortie(c, cfg, T, ox, oy, B);
  c.restore();
  c.strokeStyle = 'rgba(10,9,16,.40)'; c.lineWidth = 2;   // cadre du plateau
  c.strokeRect(ox + 1, oy + 1, T * cfg.LARGEUR - 2, T * cfg.HAUTEUR - 2);

  if (!l.chemin){                                   // couloir scelle : on le dit
    c.fillStyle = 'rgba(230,70,60,.18)'; c.fillRect(ox, oy, T * cfg.LARGEUR, T * cfg.HAUTEUR);
  }

  /* Tours, monstres et projectiles debordent leur case : on les enferme dans
     le plateau, sinon une tour posee en bord de grille bave sur le decor. */
  c.save(); c.beginPath(); c.rect(ox, oy, T * cfg.LARGEUR, T * cfg.HAUTEUR); c.clip();

  const tailleSprite = Math.round(T * 1.5);   // la tour deborde sa case, comme dans l'original
  for (const b of [...l.batiments].sort((a, z) => a.y - z.y)){
    const img = cache[b.type + ':' + camp.k] || cache['guet:' + camp.k];
    const px = ox + b.x * T + (T - tailleSprite) / 2;
    const py = oy + (b.y + 1) * T - tailleSprite * 0.92;
    c.drawImage(img, px, py, tailleSprite, tailleSprite);
    if (b.pv < b.pvMax){
      c.fillStyle = '#000'; c.fillRect(ox + b.x * T + 3, oy + b.y * T + 2, T - 6, 3);
      c.fillStyle = '#6de06d';
      c.fillRect(ox + b.x * T + 3, oy + b.y * T + 2, (T - 6) * b.pv / b.pvMax, 3);
    }
    if (selection === b){
      c.strokeStyle = '#ffd24a'; c.lineWidth = 2;
      c.strokeRect(ox + b.x * T + 1, oy + b.y * T + 1, T - 2, T - 2);
      const def = cfg.TOURS[b.type];
      if (def.p){ c.strokeStyle = 'rgba(255,210,74,.35)'; c.beginPath();
        c.arc(ox + (b.x + .5) * T, oy + (b.y + .5) * T, def.p * T / cfg.MILLI, 0, 7); c.stroke(); }
    }
  }

  /* Tri par ordonnee ECRAN, ecart compris : sinon un monstre decale vers le
     haut se retrouve dessine par-dessus celui qui est devant lui. */
  const troupe = l.monstres.map(m => {
    const e = ecartVisuel(m, l);
    return {m, mx: m.x + e.dx, my: m.y + e.dy};
  }).sort((a, z) => a.my - z.my);
  for (const {m, mx, my} of troupe){
    const x = ox + mx * T / cfg.MILLI, y = oy + my * T / cfg.MILLI;
    const def = cfg.MONSTRES[m.type];
    const taille = Math.round(T * (def.ech || 0.55));
    /* Les volants planent : on les remonte et on les fait osciller. */
    const vol = def.vol ? -taille * 0.30 + Math.sin((etat.pas + m.id * 7) / 6) * taille * 0.06 : 0;
    /* `sprite` permet a un monstre d'emprunter le dessin d'un autre. Les cinq
       du haut de catalogue n'ont pas encore le leur — sans ce repli ils
       seraient purement invisibles. */
    const art = def.sprite || m.type;
    const im = cache['m:' + art + ':' + (((etat.pas / 3) | 0) % 2)];
    if (def.vol){                                   // ombre portee au sol, detachee
      c.fillStyle = 'rgba(0,0,0,.28)';
      c.beginPath(); c.ellipse(x, y + taille * .22, taille * .30, taille * .12, 0, 0, 7); c.fill();
    }
    /* Anneau aux couleurs de l'expediteur. On voit d'un coup d'oeil que cette
       vague vient de Bot 2 — et donc que c'est lui qui monte en puissance. */
    c.strokeStyle = couleurJoueur(m.proprietaire); c.lineWidth = 2;
    c.beginPath(); c.ellipse(x, y + taille * .16, taille * .34, taille * .14, 0, 0, 7); c.stroke();
    if (im) c.drawImage(im, Math.round(x - taille / 2), Math.round(y - taille * .62 + vol), taille, taille);
    if (m.pv < m.pvMax){                            // barre lisible meme sur un mouton
      const w = Math.max(10, taille * .7);
      c.fillStyle = '#000';    c.fillRect(x - w / 2, y - taille * .72 + vol, w, 3);
      c.fillStyle = '#e05a5a'; c.fillRect(x - w / 2, y - taille * .72 + vol, w * m.pv / m.pvMax, 3);
    }
    /* Les etats. Le moteur applique quatre effets — ralentissement, poison,
       etourdissement, vulnerabilite — qui n'apparaissaient nulle part : on
       voyait une tour tirer sans jamais savoir ce qu'elle faisait. */
    const etats = [];
    if (m.etourdi > 0)   etats.push('#ffe14a');
    if (m.lent > 0)      etats.push('#9fe4ff');
    if (m.poisonReste>0) etats.push('#8fd06a');
    if (m.vulnerable>0)  etats.push('#ff9a4a');
    if (etats.length){
      const s = Math.max(3, Math.round(taille * .16));
      let px = x - (etats.length * (s + 1) - 1) / 2;
      const py = y - taille * .72 + vol - s - 3;
      for (const col of etats){
        c.fillStyle = '#000'; c.fillRect(Math.round(px) - 1, Math.round(py) - 1, s + 2, s + 2);
        c.fillStyle = col;    c.fillRect(Math.round(px), Math.round(py), s, s);
        px += s + 1;
      }
    }
  }

  dessinerTirs(c, cfg, T, ox, oy, tirs);   // au-dessus des monstres qu'ils frappent
  c.restore();

  if (etat.controleur && etat.controleur.ligne === ligneVue){
    const k = etat.controleur;
    const x = ox + k.x * T / cfg.MILLI, y = oy + k.y * T / cfg.MILLI;
    const taille = Math.round(T * 0.95);
    const im = cache['m:controleur:' + (((etat.pas / 2) | 0) % 2)];
    /* Halo d'alerte : il n'appartient a personne et il efface des batiments,
       il faut qu'on le reconnaisse avant qu'il n'arrive. */
    c.strokeStyle = 'rgba(255,207,58,.45)'; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, T * (.42 + .06 * Math.sin(etat.pas / 3)), 0, 7); c.stroke();
    if (im) c.drawImage(im, Math.round(x - taille / 2), Math.round(y - taille * .62), taille, taille);
  }

  dessinerEffets(c, cfg, T, ox, oy);

  if (enMain && !transi){                           // apercu de pose
    const p = survol;
    if (p && p.x >= 0){
      const libre = l.occupe[p.y * cfg.LARGEUR + p.x] < 0 &&
        !(p.x === cfg.entree.x && p.y === cfg.entree.y) &&
        !(p.x === cfg.exit.x && p.y === cfg.exit.y);
      c.fillStyle = libre ? 'rgba(255,255,255,.35)' : 'rgba(230,70,60,.5)';
      c.fillRect(ox + p.x * T, oy + p.y * T, T, T);
    }
  }
  c.restore();
  if (transi && photo){
    c.drawImage(photo, dxN - transi.sens * larg, 0, larg, haut);
  }
  voileDeVol(c, larg, haut);
  return {T, ox, oy};
}
let survol = null, geo = {T:1, ox:0, oy:0}, terrain = null, sentier = null;

/* ---- bandeaux ------------------------------------------------------------ */
function majBandeau(){
  const l = etat.lignes[etat.moi], cfg = etat.cfg;
  const reste = etat.prof.tickRevenu - (etat.pas % etat.prof.tickRevenu);
  document.getElementById('or').textContent = l.or.toLocaleString('fr');
  document.getElementById('revenu').textContent = '+' + l.revenu;
  document.getElementById('vies').textContent = l.vies;
  document.getElementById('bois').textContent = l.bois;
  document.getElementById('minuteur').textContent = (reste / 10).toFixed(1) + ' s';
  document.getElementById('jaugeRevenu').style.width =
    (100 - reste * 100 / etat.prof.tickRevenu) + '%';

  /* La chaine. Un joueur nourrit son voisin et se fait nourrir par un autre :
     tant qu'on ne sait pas LEQUEL, on ne sait pas d'ou vient le danger. */
  const proie = voisin(etat, etat.moi);
  let menace = etat.moi;
  for (let k = 1; k <= etat.lignes.length; k++){
    const j = (etat.moi - k + etat.lignes.length) % etat.lignes.length;
    if (!etat.lignes[j].mort){ menace = j; break; }
  }
  const onglets = document.getElementById('lignes');
  onglets.innerHTML = etat.lignes.map((x, i) => {
    const role = i === etat.moi ? '' : i === menace ? 'te vise'
               : i === proie ? 'tu vises' : '';
    const vagues = x.monstres.length;
    return `<button class="ong ${i === ligneVue ? 'actif' : ''} ${x.mort ? 'mort' : ''}
        ${i === menace && !x.mort ? 'menace' : ''}" data-ligne="${i}">
      <b><i class="pastille" style="background:${couleurJoueur(i)}"></i>${x.nom}</b>
      <span>♥ ${x.vies} · +${x.revenu}${vagues ? `<i class="vagues">${vagues}</i>` : ''}</span>
      ${role ? `<span class="chaine">${role}</span>` : ''}</button>`; }).join('');
  /* Le bandeau dit AUSSI quelle ligne on regarde : apres un glissement, les
     onglets du haut ne sont pas forcement dans le champ du regard. */
  const badge = document.getElementById('lecture');
  /* Cache pendant le glissement : c'est un element du DOM, il ne glisse pas
     avec le plateau et arriverait donc avant lui. */
  badge.hidden = (ligneVue === etat.moi) || !!transi;
  badge.textContent = etat.lignes[ligneVue].nom + ' · lecture seule';
}

/* Le panneau est reconstruit a chaque achat, ce qui remettait la rangee au
   debut : impossible d'enchainer les envois d'un gros monstre sans refaire
   defiler toute la liste. On retient donc le defilement par menu et on le
   repose apres la reconstruction. */
const defilements = {};
function panneau(){
  const d = document.getElementById('panneau');
  const rangee0 = d.querySelector('.rangee');
  if (rangee0 && d.dataset.cle != null) defilements[d.dataset.cle] = rangee0.scrollLeft;
  remplirPanneau(d);
  const cle = selection ? 'tour' : (menu || '');
  d.dataset.cle = cle;
  const rangee = d.querySelector('.rangee');
  if (rangee && defilements[cle]) rangee.scrollLeft = defilements[cle];
}

function remplirPanneau(d){
  const l = etat.lignes[etat.moi], cfg = etat.cfg;
  if (ligneVue !== etat.moi){ d.innerHTML =
    `<p class="vide">Ligne de ${etat.lignes[ligneVue].nom} — lecture seule. Reviens sur la tienne pour jouer.</p>`; return; }
  if (selection){
    const def = cfg.TOURS[selection.type];
    const vers = (def.vers || []).flatMap(v => v === 'ELEM'
      ? Object.keys(cfg.TOURS).filter(k => cfg.TOURS[k].branche)
      : [v]);
    d.innerHTML = `<div class="tete">${def.nom}
        <span>${def.deg ? def.deg + ' dég.' : def.degPct ? def.degPct + ' % PV' : 'aucun dégât'} ·
        portée ${(def.p / cfg.MILLI).toFixed(1)} · ${(600 / def.c).toFixed(0)}/min</span></div>
      <div class="rangee">` +
      vers.map(v => { const t = cfg.TOURS[v];
        const bloque = (t.branche && !l.branches[t.branche]) || (t.feuille && !l.feuilles[v]);
        const cher = l.or < t.or;
        const raison = t.branche ? cfg.BRANCHES[t.branche].nom : t.nom + ' (1 bois)';
        return `<button class="art ${bloque || cher ? 'off' : ''}" data-up="${v}">
          <b>${t.nom}</b><span>${bloque ? '🔒 ' + raison : t.or + ' or'}</span></button>`;
      }).join('') +
      `<button class="art vente" data-vendre="1"><b>Vendre</b><span>+${Math.floor(def.or * cfg.remboursement / 100)} or</span></button>
      </div>`;
    return;
  }
  if (menu === 'batiments'){
    d.innerHTML = `<div class="rangee">` + cfg.boutique.map(k => { const t = cfg.TOURS[k];
      return `<button class="art ${l.or < t.or ? 'off' : ''} ${enMain === k ? 'pris' : ''}" data-poser="${k}">
        <b>${t.nom}</b><span>${t.or} or</span></button>`; }).join('') +
      `</div><p class="aide">Un appui pour prendre, un appui sur la grille pour poser. L'or n'est débité qu'à la pose.</p>`;
  } else if (menu === 'monstres'){
    d.innerHTML = `<div class="rangee">` + Object.keys(cfg.MONSTRES).map(k => {
      const m = cfg.MONSTRES[k];
      const ouvertureA = Math.round(m.dispo * 10 * etat.prof.temps);
      const verrouille = etat.pas < ouvertureA;
      const reste = Math.ceil((ouvertureA - etat.pas) / 10);
      const stock = l.stock[k] || 0;
      const marque = m.sacrifice ? '<u class="sacr">sacrifice</u>'
                   : m.siege ? '<u>brise</u>'
                   : m.vol ? '<u class="air">vole</u>' : '';
      if (verrouille)
        return `<button class="art verrou" disabled>
          <b>${m.nom}</b><span>🔒 dans ${reste} s</span><i>${m.or.toLocaleString('fr')} or</i></button>`;
      const inactif = l.or < m.or || stock === 0;
      return `<button class="art ${inactif ? 'off' : ''} ${m.siege ? 'siege' : ''}" data-envoyer="${k}">
        <b>${m.nom}</b><span>${m.or.toLocaleString('fr')} or → +${m.revenu.toLocaleString('fr')}</span>
        <i>${(m.revenu / m.or).toFixed(3)} <em>${stock}/${m.stock[0]}</em> ${marque}</i></button>`;
      }).join('') +
      `</div><p class="aide">Le chiffre vert est le revenu par pièce d'or : les petits rapportent le plus
       mais ne percent pas. <em>x/y</em> = stock restant, il se recharge tout seul.
       <b>brise</b> démolit les tours au lieu de passer · <b>vole</b> ignore le labyrinthe ·
       <b>sacrifice</b> ne rapporte presque rien mais efface une ligne.</p>`;
  } else if (menu === 'techno'){
    /* Quinze deblocages a un bois : la racine, puis ses deux feuilles une fois
       la racine ouverte. Trois bois au depart — il faut choisir. */
    const cases = [];
    for (const k in cfg.BRANCHES){
      const b = cfg.BRANCHES[k], pris = !!l.branches[k];
      cases.push(`<button class="art ${pris ? 'acquis' : (l.bois < 1 ? 'off' : '')}" data-branche="${k}">
        <b>${b.nom}</b><span>${pris ? 'acquise' : '1 bois'}</span>
        <i>${cfg.TOURS[b.elementaire].nom}</i></button>`);
      for (const f of b.feuilles){
        const t = cfg.TOURS[f], eue = !!l.feuilles[f];
        const off = !pris || l.bois < 1;
        cases.push(`<button class="art ${eue ? 'acquis' : (off ? 'off' : '')}" data-feuille="${f}">
          <b>${t.nom}</b><span>${eue ? 'acquise' : pris ? '1 bois' : '🔒 ' + b.nom}</span>
          <i>${t.or.toLocaleString('fr')} or</i></button>`);
      }
    }
    d.innerHTML = `<div class="rangee">${cases.join('')}</div>
      <p class="aide"><b>${l.bois} bois</b> · 1 par case, +1 par joueur éliminé.
       Trois racines, ou une racine et ses deux feuilles. <b>Choisis bien.</b></p>`;
  } else d.innerHTML = '';
}

/* ---- le fil d'evenements ------------------------------------------------- */
/* Ce que le jeu ne disait pas : qui envoie quoi a qui, qui vole une vie a qui,
   qui vient d'etre elimine. On ne montre que ce qui nous concerne en clair —
   le reste, en gris et seulement si c'est marquant — sinon a sept joueurs le
   fil defile trop vite pour etre lu. */
let dernierVu = 0, lignesFil = [], filSignature = '';
const DUREE_FIL = 4200;

function nomDe(i){ return etat.lignes[i] ? etat.lignes[i].nom : '?'; }

function texteEvenement(e){
  const moi = etat.moi, cfg = etat.cfg;
  if (e.type === 'envoi'){
    const m = cfg.MONSTRES[e.monstre].nom;
    if (e.vers === moi) return {t: `<b>${nomDe(e.de)}</b> t'envoie ${m}${e.double ? ' ×2' : ''}`,
                                c: couleurJoueur(e.de), fort: true};
    if (e.de === moi)   return {t: `Tu envoies ${m} à <b>${nomDe(e.vers)}</b>`,
                                c: couleurJoueur(moi), fort: true};
    return {t: `${nomDe(e.de)} → ${nomDe(e.vers)} : ${m}`, c: '#6b6480', fort: false};
  }
  if (e.type === 'vol'){
    if (e.de === moi)   return {t: `<b>${nomDe(e.vers)}</b> te vole une vie`, c: '#e05a5a', fort: true};
    if (e.vers === moi) return {t: `Tu voles une vie à <b>${nomDe(e.de)}</b>`, c: '#6fc46a', fort: true};
    return null;                                   // deux bots entre eux : sans interet
  }
  if (e.type === 'mort')
    return {t: `☠ <b>${nomDe(e.ligne)}</b> est éliminé` +
               (e.par != null ? ` par ${nomDe(e.par)}` : ''), c: '#f0c451', fort: true};
  if (e.type === 'controleur' && e.ligne === ligneVue)
    return {t: `⚙ La machine anti-mur passe`, c: '#f0c451', fort: false};
  return null;
}

function majFil(maintenant){
  for (const e of etat.journal){
    if (e.n <= dernierVu) continue;
    dernierVu = e.n;
    const v = texteEvenement(e);
    if (!v) continue;
    /* Les envois entre bots ne meritent pas de chasser un message qui nous
       concerne : ils passent apres, et seulement s'il reste de la place. */
    if (!v.fort && lignesFil.filter(x => !x.fort).length >= 1) continue;
    lignesFil.push({...v, t0: maintenant});
    if (lignesFil.length > 4) lignesFil.shift();
  }
  lignesFil = lignesFil.filter(x => maintenant - x.t0 < DUREE_FIL);
  /* Ne rendre que si la liste a change : sinon l'animation d'entree redemarre
     a chaque image et le fil clignote. */
  const signature = lignesFil.map(x => x.t0).join(',');
  if (signature === filSignature) return;
  filSignature = signature;
  document.getElementById('fil').innerHTML = lignesFil.map(x =>
    `<div class="${x.fort ? '' : 'faible'}" style="border-left-color:${x.c}">${x.t}</div>`).join('');
}

/* ---- boucle -------------------------------------------------------------- */
function boucle(t){
  requestAnimationFrame(boucle);
  if (!dernier) dernier = t;
  let dt = Math.min(120, t - dernier); dernier = t;
  if (!etat.fini && !enPause()){
    /* On plafonne le retard AVANT de le rattraper. Sans ca, une image longue
       (changement de menu, onglet en arriere-plan) faisait avancer la partie
       de plusieurs secondes d'un coup : les monstres semblaient se teleporter.
       Mieux vaut perdre un peu de temps de jeu qu'un saut visible. */
    accum = Math.min(accum + dt * acceleration, etat.cfg.PAS_MS * 4);
    while (accum >= etat.cfg.PAS_MS){
      avancer(etat); accum -= etat.cfg.PAS_MS;
      collecterTirs(etat, ligneVue, tirs);
      collecterEffets(etat, ligneVue);
    }
  }
  avancerTirs(tirs, dt * acceleration);
  avancerEffets(dt * acceleration);
  if (transi){                                      // en temps reel, pas en temps de jeu
    transi.u += dt / DUREE_TRANSI;
    if (transi.u >= 1) transi = null;
  }
  geo = dessinerJeu();
  majBandeau();
  majFil(t);
  if (etat.fini) finir();
}
function finir(){
  const d = document.getElementById('fin');
  if (!d.hidden) return;
  d.hidden = false;
  const gagne = etat.vainqueur === etat.moi;
  const cfg = etat.cfg, prof = cfg.PROFILS[etat.profil], diff = cfg.DIFFICULTES[etat.difficulte];
  const mort = etat.journal.filter(e => e.type === 'mort');
  const premiere = mort.length ? Math.floor(mort[0].pas / 10) + ' s' : '—';
  /* Le recapitulatif est ce qu'on recopie pour un retour d'equilibrage : sans
     lui, « c'est trop dur » n'est pas exploitable. */
  d.innerHTML = `<div><h2>${gagne ? 'Gagné' : 'Éliminé'}</h2>
    <p>${gagne ? 'Dernier debout.'
               : 'Le dernier debout est ' + (etat.lignes[etat.vainqueur] || {nom:'personne'}).nom + '.'}</p>
    <div class="cfg">
      <b>${etat.lignes.length}</b> joueurs · bots <b>${diff.nom || etat.difficulte}</b> · rythme <b>${prof.nom}</b><br>
      graine <b>${etat.graine}</b> · camp <b>${camp.nom}</b><br>
      durée <b>${Math.floor(etat.pas / 10)} s</b> · 1<sup>re</sup> élimination <b>${premiere}</b><br>
      ton revenu final <b>+${etat.lignes[etat.moi].revenu}</b> ·
      tes tours <b>${etat.lignes[etat.moi].batiments.length}</b>
    </div>
    <div class="duo">
      <button id="rejouer">Rejouer</button>
      <button id="versMenu">Réglages</button>
    </div></div>`;
  document.getElementById('rejouer').onclick = () => { demarrer(true); fermerAccueil(); };
  document.getElementById('versMenu').onclick = () => {
    document.getElementById('fin').hidden = true; ouvrirAccueil(false); };
}

/* ---- entrees ------------------------------------------------------------- */
function caseSous(ev){
  const cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
  const px = (ev.clientX ?? ev.touches[0].clientX) - r.left;
  const py = (ev.clientY ?? ev.touches[0].clientY) - r.top;
  const x = Math.floor((px - geo.ox) / geo.T), y = Math.floor((py - geo.oy) / geo.T);
  if (x < 0 || y < 0 || x >= etat.cfg.LARGEUR || y >= etat.cfg.HAUTEUR) return null;
  return {x, y};
}
/* Changer de ligne. Le glisser fait la meme chose que les onglets du haut,
   au pouce : c'est le geste attendu sur telephone pour « la ligne d'a cote ». */
function allerLigne(i, sens){
  const n = etat.lignes.length;
  const cible = ((i % n) + n) % n;
  if (cible === ligneVue) return;
  if (sens == null){                      // par les onglets : on prend le chemin le plus court
    const droite = (cible - ligneVue + n) % n;
    sens = droite <= n - droite ? 1 : -1;
  }
  photographier();
  transi = {sens, u: 0};
  ligneVue = cible;
  selection = null; enMain = null; sentier = null; tirs.length = 0; viderEffets();
  panneau();
}

/* Copie du plateau tel qu'il est a l'instant du changement. */
function photographier(){
  const cv = document.getElementById('scene');
  if (!cv.width || !cv.height) return;
  if (!photo) photo = document.createElement('canvas');
  if (photo.width !== cv.width || photo.height !== cv.height){
    photo.width = cv.width; photo.height = cv.height;
  }
  const pc = photo.getContext('2d');
  pc.clearRect(0, 0, photo.width, photo.height);
  pc.drawImage(cv, 0, 0);
}

function brancher(){
  const cv = document.getElementById('scene');
  /* Un appui devient un glissement des qu'il depasse le seuil ; la pose de
     tour part alors au relachement, jamais a l'appui, sinon un glisser
     poserait une tour au passage. */
  let geste = null;
  const SEUIL = 34;                                   // px avant de parler de glissement
  cv.addEventListener('pointermove', e => {
    survol = caseSous(e);
    if (!geste) return;
    const dx = e.clientX - geste.x, dy = e.clientY - geste.y;
    if (Math.abs(dx) > SEUIL && Math.abs(dx) > Math.abs(dy) * 1.4) geste.glisse = true;
    else if (Math.abs(dy) > SEUIL) geste.annule = true;
  });
  cv.addEventListener('pointerleave', () => { survol = null; });
  cv.addEventListener('pointerdown', e => {
    survol = caseSous(e);
    geste = {x: e.clientX, y: e.clientY, glisse: false, annule: false};
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointercancel', () => { geste = null; });
  cv.addEventListener('pointerup', e => {
    const g = geste; geste = null;
    if (!g) return;
    if (g.glisse){                                    // gauche = ligne suivante
      const pas = e.clientX < g.x ? 1 : -1;
      allerLigne(ligneVue + pas, pas);
      return;
    }
    if (g.annule) return;
    const p = caseSous(e); survol = p;
    if (!p || ligneVue !== etat.moi) return;
    const l = etat.lignes[etat.moi];
    if (enMain){
      if (poserBatiment(etat, l, enMain, p.x, p.y)){
        effet('poussiere', (p.x + .5) * etat.cfg.MILLI, (p.y + .5) * etat.cfg.MILLI, {});
        if (l.or < etat.cfg.TOURS[enMain].or) enMain = null;   // plus les moyens : on lache
      }
      panneau(); return;
    }
    const id = l.occupe[p.y * etat.cfg.LARGEUR + p.x];
    selection = id >= 0 ? l.batiments.find(b => b.id === id) : null;
    if (selection) menu = null;
    panneau();
  });

  document.getElementById('barre').addEventListener('click', e => {
    const b = e.target.closest('[data-menu]'); if (!b) return;
    const m = b.dataset.menu;
    menu = (menu === m) ? null : m;
    selection = null; if (menu !== 'batiments') enMain = null;
    document.querySelectorAll('[data-menu]').forEach(x =>
      x.setAttribute('aria-pressed', String(x.dataset.menu === menu)));
    panneau();
  });
  document.getElementById('panneau').addEventListener('click', e => {
    const l = etat.lignes[etat.moi];
    const p = e.target.closest('[data-poser]');
    if (p){ enMain = (enMain === p.dataset.poser) ? null : p.dataset.poser; panneau(); return; }
    const v = e.target.closest('[data-envoyer]');
    if (v){ envoyer(etat, l, v.dataset.envoyer); panneau(); return; }
    const t = e.target.closest('[data-branche]');
    if (t){ acheterBranche(etat, l, t.dataset.branche); panneau(); return; }
    const f = e.target.closest('[data-feuille]');
    if (f){ acheterFeuille(etat, l, f.dataset.feuille); panneau(); return; }
    const u = e.target.closest('[data-up]');
    if (u && selection){ ameliorer(etat, l, selection, u.dataset.up); panneau(); return; }
    if (e.target.closest('[data-vendre]') && selection){
      effet('vente', (selection.x + .5) * etat.cfg.MILLI, (selection.y + .5) * etat.cfg.MILLI, {});
      vendre(etat, l, selection); selection = null; panneau(); }
  });
  document.getElementById('lignes').addEventListener('click', e => {
    const b = e.target.closest('[data-ligne]'); if (!b) return;
    allerLigne(+b.dataset.ligne);
  });
  document.getElementById('vitesse').addEventListener('click', e => {
    acceleration = acceleration === 1 ? 2 : acceleration === 2 ? 4 : 1;
    e.currentTarget.textContent = '×' + acceleration;
  });
}

const CLE_REGLAGES = 'ltw7.reglages';
function lireReglages(){
  const ids = ['nbJoueurs','difficulte','profil','camp'];
  try {
    const v = JSON.parse(localStorage.getItem(CLE_REGLAGES) || '{}');
    for (const id of ids) if (v[id] != null) document.getElementById(id).value = v[id];
  } catch (e){ /* premiere partie, ou stockage refuse : on garde les defauts */ }
  camp = CAMPS[+document.getElementById('camp').value] || CAMPS[0];
}
function ecrireReglages(){
  const v = {};
  for (const id of ['nbJoueurs','difficulte','profil','camp'])
    v[id] = document.getElementById(id).value;
  try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(v)); } catch (e){ /* sans importance */ }
}

function demarrer(memeGraine){
  const joueurs = +document.getElementById('nbJoueurs').value;
  const profil = document.getElementById('profil').value;
  const difficulte = document.getElementById('difficulte').value;
  const champGraine = document.getElementById('graine');
  const graine = memeGraine ? (+champGraine.value || 1)
                            : 1 + Math.floor(Math.random() * 999998);
  champGraine.value = graine;
  ecrireReglages();
  camp = CAMPS[+document.getElementById('camp').value] || CAMPS[0];
  terrain = null; sentier = null;
  etat = creerPartie({graine, profil, joueurs, difficulte});
  ligneVue = etat.moi; selection = null; enMain = null; menu = 'batiments'; acceleration = 1;
  tirs.length = 0; transi = null; dernierVu = 0; lignesFil = []; filSignature = '';
  viderEffets();
  document.getElementById('fil').innerHTML = '';
  document.querySelectorAll('[data-menu]').forEach(x =>
    x.setAttribute('aria-pressed', String(x.dataset.menu === 'batiments')));
  document.getElementById('fin').hidden = true;
  document.getElementById('vitesse').textContent = '×1';
  panneau();
}

/* L'ecran d'accueil met la partie en pause plutot que de la laisser courir
   derriere : regler la difficulte pendant qu'on se fait envahir n'a pas de
   sens, et le plateau sert de decor vivant sous le voile. */
function ouvrirAccueil(reprenable){
  document.getElementById('reprendre').hidden = !reprenable;
  document.getElementById('jouer').textContent = reprenable ? 'Nouvelle partie' : 'Jouer';
  document.getElementById('accueil').hidden = false;
}
function fermerAccueil(){
  document.getElementById('accueil').hidden = true;
  dernier = 0; accum = 0;                     // sinon la pause se rattrape d'un coup
}
const enPause = () => !document.getElementById('accueil').hidden;

window.addEventListener('DOMContentLoaded', () => {
  preparerSprites();
  brancher();
  lireReglages();
  document.getElementById('jouer').onclick = () => { demarrer(false); fermerAccueil(); };
  document.getElementById('memeGraine').onclick = () => { demarrer(true); fermerAccueil(); };
  document.getElementById('reprendre').onclick = fermerAccueil;
  document.getElementById('ouvrirReglages').onclick = () =>
    enPause() ? fermerAccueil() : ouvrirAccueil(!etat.fini);
  document.getElementById('camp').onchange = e => {
    camp = CAMPS[+e.target.value]; terrain = null; sentier = null; };
  demarrer(false);                            // une partie tourne sous le voile
  ouvrirAccueil(false);
  requestAnimationFrame(boucle);
});
