/* Rendu et entrees. Tout ce qui touche au DOM vit ici — le moteur, lui, n'en
   sait rien. */

const SPRITE = {                    // quelle planche de sprite pour quelle tour
  guet:'fleche', pitie:'fleche', socle:'fleche', elementaire:'fleche',
  epine:'perce', sang:'perce', lame:'perce', broyeur:'perce',
  canon:'mortier',
  barbecue:'braise', puits:'braise', boom:'braise', meteore:'braise',
  glacier:'givre', eauBenite:'givre', eauUltime:'givre', glaceUltime:'givre',
  courtCircuit:'foudre', canonElec:'foudre', generateur:'foudre', condensateur:'foudre',
  cloaque:'prisme', damne:'prisme', fosse:'prisme', mort:'prisme',
  oiseau:'prisme', lanterne:'prisme', champignon:'prisme', teleporteur:'prisme'
};
/* Chaque monstre a deux images ; on alterne pour la marche. */

let etat, camp, cache = {}, enMain = null, selection = null, ligneVue = 0,
    menu = null, acceleration = 1, dernier = 0, accum = 0, tirs = [];

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
  for (const b of BATS) for (const f of CAMPS){
    const g = dessiner(b.k, f, false);
    const cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    const c = cv.getContext('2d');
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
      const v = g[y][x]; if (!v) continue;
      c.fillStyle = v; c.fillRect(x, y, 1, 1);
    }
    cache[b.k + ':' + f.k] = cv;
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
    const img = cache[(SPRITE[b.type] || 'fleche') + ':' + camp.k];
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

  for (const m of [...l.monstres].sort((a, z) => a.y - z.y)){
    const x = ox + m.x * T / cfg.MILLI, y = oy + m.y * T / cfg.MILLI;
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
    if (im) c.drawImage(im, Math.round(x - taille / 2), Math.round(y - taille * .62 + vol), taille, taille);
    if (m.pv < m.pvMax){                            // barre lisible meme sur un mouton
      const w = Math.max(10, taille * .7);
      c.fillStyle = '#000';    c.fillRect(x - w / 2, y - taille * .72 + vol, w, 3);
      c.fillStyle = '#e05a5a'; c.fillRect(x - w / 2, y - taille * .72 + vol, w * m.pv / m.pvMax, 3);
    }
  }

  dessinerTirs(c, cfg, T, ox, oy, tirs);   // au-dessus des monstres qu'ils frappent
  c.restore();

  if (etat.controleur && etat.controleur.ligne === ligneVue){
    const k = etat.controleur;
    const x = ox + k.x * T / cfg.MILLI, y = oy + k.y * T / cfg.MILLI, r = T * .34;
    c.fillStyle = '#ffcf3a'; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.fillStyle = '#0d0b10'; c.fillRect(x - r, y - r, r * 2, 2); c.fillRect(x - r, y + r - 2, r * 2, 2);
    c.fillRect(x - r, y - r, 2, r * 2); c.fillRect(x + r - 2, y - r, 2, r * 2);
    c.fillRect(x - r * .5, y - r * .3, r, r * .25);
  }

  if (enMain){                                      // apercu de pose
    const p = survol;
    if (p && p.x >= 0){
      const libre = l.occupe[p.y * cfg.LARGEUR + p.x] < 0 &&
        !(p.x === cfg.entree.x && p.y === cfg.entree.y) &&
        !(p.x === cfg.exit.x && p.y === cfg.exit.y);
      c.fillStyle = libre ? 'rgba(255,255,255,.35)' : 'rgba(230,70,60,.5)';
      c.fillRect(ox + p.x * T, oy + p.y * T, T, T);
    }
  }
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

  const onglets = document.getElementById('lignes');
  onglets.innerHTML = etat.lignes.map((x, i) =>
    `<button class="ong ${i === ligneVue ? 'actif' : ''} ${x.mort ? 'mort' : ''}" data-ligne="${i}">
      <b>${i === etat.moi ? 'Toi' : 'Bot ' + i}</b><span>♥ ${x.vies} · +${x.revenu}</span></button>`).join('');
  /* Le bandeau dit AUSSI quelle ligne on regarde : apres un glissement, les
     onglets du haut ne sont pas forcement dans le champ du regard. */
  const badge = document.getElementById('lecture');
  badge.hidden = (ligneVue === etat.moi);
  badge.textContent = etat.lignes[ligneVue].nom + ' · lecture seule';
}

function panneau(){
  const d = document.getElementById('panneau');
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
        const bloque = t.branche && !l.branches[t.branche];
        const cher = l.or < t.or;
        return `<button class="art ${bloque || cher ? 'off' : ''}" data-up="${v}">
          <b>${t.nom}</b><span>${bloque ? '🔒 ' + cfg.BRANCHES[t.branche].nom : t.or + ' or'}</span></button>`;
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
    d.innerHTML = `<div class="rangee">` + Object.keys(cfg.BRANCHES).map(k => { const b = cfg.BRANCHES[k];
      const pris = l.branches[k];
      return `<button class="art ${pris ? 'acquis' : (l.bois < 1 ? 'off' : '')}" data-branche="${k}">
        <b>${b.nom}</b><span>${pris ? 'acquise' : '1 bois'}</span></button>`; }).join('') +
      `</div><p class="aide">3 bois au départ, +1 par joueur éliminé. Une branche débloque sa tour élémentaire — qui, elle, est gratuite.</p>`;
  } else d.innerHTML = '';
}

/* ---- boucle -------------------------------------------------------------- */
function boucle(t){
  requestAnimationFrame(boucle);
  if (!dernier) dernier = t;
  let dt = Math.min(120, t - dernier); dernier = t;
  if (!etat.fini){
    /* On plafonne le retard AVANT de le rattraper. Sans ca, une image longue
       (changement de menu, onglet en arriere-plan) faisait avancer la partie
       de plusieurs secondes d'un coup : les monstres semblaient se teleporter.
       Mieux vaut perdre un peu de temps de jeu qu'un saut visible. */
    accum = Math.min(accum + dt * acceleration, etat.cfg.PAS_MS * 4);
    while (accum >= etat.cfg.PAS_MS){
      avancer(etat); accum -= etat.cfg.PAS_MS;
      collecterTirs(etat, ligneVue, tirs);
    }
  }
  avancerTirs(tirs, dt * acceleration);
  geo = dessinerJeu();
  majBandeau();
  if (etat.fini) finir();
}
function finir(){
  const d = document.getElementById('fin');
  if (!d.hidden) return;
  d.hidden = false;
  const gagne = etat.vainqueur === etat.moi;
  d.innerHTML = `<div><h2>${gagne ? 'Gagné' : 'Éliminé'}</h2>
    <p>${gagne ? 'Dernier debout.' : 'Le dernier debout est ' + (etat.lignes[etat.vainqueur] || {nom:'personne'}).nom + '.'}
    Revenu final : +${etat.lignes[etat.moi].revenu} · ${Math.floor(etat.pas / 10)} s de partie.</p>
    <button id="rejouer">Rejouer</button></div>`;
  document.getElementById('rejouer').onclick = () => demarrer();
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
function allerLigne(i){
  const n = etat.lignes.length;
  ligneVue = ((i % n) + n) % n;
  selection = null; enMain = null; sentier = null; tirs.length = 0;
  panneau();
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
      allerLigne(ligneVue + (e.clientX < g.x ? 1 : -1));
      return;
    }
    if (g.annule) return;
    const p = caseSous(e); survol = p;
    if (!p || ligneVue !== etat.moi) return;
    const l = etat.lignes[etat.moi];
    if (enMain){
      if (poserBatiment(etat, l, enMain, p.x, p.y)){
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
    const u = e.target.closest('[data-up]');
    if (u && selection){ ameliorer(etat, l, selection, u.dataset.up); panneau(); return; }
    if (e.target.closest('[data-vendre]') && selection){
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
  tirs.length = 0;
  document.querySelectorAll('[data-menu]').forEach(x =>
    x.setAttribute('aria-pressed', String(x.dataset.menu === 'batiments')));
  document.getElementById('fin').hidden = true;
  document.getElementById('vitesse').textContent = '×1';
  panneau();
}

window.addEventListener('DOMContentLoaded', () => {
  preparerSprites();
  brancher();
  lireReglages();
  document.getElementById('rejouerHaut').onclick = () => {
    document.getElementById('reglages').dataset.ouvert = '0'; demarrer(false); };
  document.getElementById('memeGraine').onclick = () => {
    document.getElementById('reglages').dataset.ouvert = '0'; demarrer(true); };
  document.getElementById('ouvrirReglages').onclick = () => {
    const r = document.getElementById('reglages');
    r.dataset.ouvert = r.dataset.ouvert === '1' ? '0' : '1'; };
  document.getElementById('camp').onchange = e => {
    camp = CAMPS[+e.target.value]; terrain = null; sentier = null; };
  demarrer(false);
  requestAnimationFrame(boucle);
});
