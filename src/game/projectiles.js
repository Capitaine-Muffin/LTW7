/* Les projectiles. Purement decoratifs : le moteur a deja applique les degats
   au pas ou il a tire, on ne fait que rejouer le trajet a l'ecran. Une tour
   qui frappe sans qu'on voie rien partir donne l'impression qu'elle dort. */

const PROJ = {
  /* v : milli-cases par milliseconde. duree = distance / v, bornee. */
  fleche:  {v:14, forme:'fleche', fut:'#8a6b3a', c:'#e8eef5', b:'#2a2420',
            plume:'#d8434a', eclat:'#fff6d8'},
  perce:   {v:26, forme:'dard',   fut:'#6a707e', c:'#e2e7ef', b:'#22262e', eclat:'#ffffff'},
  mortier: {v:7,  forme:'bombe',  c:'#4b4750', b:'#141219', eclat:'#ffb24a', arc:0.26},
  braise:  {v:11, forme:'gemme',  c:'#ff9a2e', b:'#5e2004', eclat:'#ffe6a8', trainee:'#ff6a1a'},
  givre:   {v:12, forme:'gemme',  c:'#9fe4ff', b:'#1d4a68', eclat:'#f2fcff', trainee:'#5fc4ee'},
  foudre:  {v:0,  forme:'eclair', c:'#bfe6ff', b:'#2f7fb8', eclat:'#ffffff'},
  prisme:  {v:10, forme:'gemme',  c:'#c58cff', b:'#3a1e5e', eclat:'#f6ecff', trainee:'#8e5ad6'},
  /* Les monstres de siege lancent des blocs, pas des sorts. */
  siege:   {v:9,  forme:'bombe',  c:'#7a5c3a', b:'#231708', eclat:'#e0a860', arc:0.22}
};
const DUREE_ECLAT = 130;                   // ms de flash a l'impact

/* Ramasse les tirs du pas qui vient d'etre simule, pour la ligne regardee. */
function collecterTirs(etat, ligne, liste){
  for (const t of etat.tirs){
    if (t.ligne !== ligne) continue;
    const genre = t.monstre ? 'siege' : ((TOURS_ART[t.type] || {}).k || 'fleche');
    const p = PROJ[genre] || PROJ.fleche;
    const dx = t.cx - t.x, dy = t.cy - t.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    liste.push({
      genre, p, dist,
      x: t.x, y: t.y - (t.monstre ? 0 : 260),   // la tour tire depuis sa hauteur
      cx: t.cx, cy: t.cy, zone: t.zone,
      age: 0, duree: p.v ? Math.max(60, Math.min(420, dist / p.v)) : 90
    });
    if (liste.length > 220) liste.shift();       // garde-fou en vitesse x8
  }
}

function avancerTirs(liste, dt){
  for (let i = liste.length - 1; i >= 0; i--){
    liste[i].age += dt;
    if (liste[i].age > liste[i].duree + DUREE_ECLAT) liste.splice(i, 1);
  }
}

/* Un pave aligne sur la grille des pixels : c'est ce qui garde le rendu net. */
function pav(c, x, y, w, h, couleur){
  c.fillStyle = couleur;
  c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function dessinerTirs(c, cfg, T, ox, oy, liste){
  const u2p = v => v * T / cfg.MILLI;
  for (const t of liste){
    const u = Math.min(1, t.age / t.duree);
    const x0 = ox + u2p(t.x), y0 = oy + u2p(t.y);
    const x1 = ox + u2p(t.cx), y1 = oy + u2p(t.cy);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const taille = Math.max(4, Math.round(T * 0.17));

    if (t.age <= t.duree){
      if (t.genre === 'foudre'){ eclair(c, x0, y0, x1, y1, t.p, u, taille); continue; }
      let x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
      if (t.p.arc) y -= Math.sin(Math.PI * u) * u2p(t.dist) * t.p.arc;
      if (t.p.trainee){                         // quatre copies qui s'effacent
        for (let k = 1; k <= 4; k++){
          const v = u - k * 0.08; if (v < 0) break;
          let tx = x0 + (x1 - x0) * v, ty = y0 + (y1 - y0) * v;
          if (t.p.arc) ty -= Math.sin(Math.PI * v) * u2p(t.dist) * t.p.arc;
          const r = taille * (0.44 - k * 0.07);
          c.globalAlpha = 0.75 - k * 0.15;
          pav(c, tx - r, ty - r, r * 2, r * 2, t.p.trainee);
        }
        c.globalAlpha = 1;
      }
      corps(c, t, x, y, ang, taille);
    } else {
      impact(c, t, x1, y1, (t.age - t.duree) / DUREE_ECLAT, u2p, taille);
    }
  }
  c.globalAlpha = 1;
}

/* Le projectile lui-meme. Contour sombre puis coeur clair : la meme recette
   que les sprites, pour que tout se detache du sol.
   La fleche est dessinee piece par piece — fut, tete en escalier, empennage —
   parce qu'un simple trait clair sur l'herbe ne se lit pas comme une fleche. */
function corps(c, t, x, y, ang, s){
  const p = t.p;
  if (p.forme === 'fleche' || p.forme === 'dard'){
    const plumes = p.forme === 'fleche';
    const L = plumes ? s * 2.6 : s * 1.8;
    const h = Math.max(2, s * 0.30);              // demi-epaisseur du fut
    c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(ang);
    pav(c, -L / 2 - 1, -h - 1, L * 0.80 + 2, h * 2 + 2, p.b);      // contour du fut
    pav(c, -L / 2, -h, L * 0.80, h * 2, p.fut);
    const tete = L * 0.36, n = 4;                 // tete en escalier, du gros au fin
    for (let pass = 0; pass < 2; pass++)          // contour d'abord, coeur ensuite
      for (let k = 0; k < n; k++){
        const hh = h * (1.75 - k * 0.34), w = tete / n, e = pass ? 0 : 1;
        pav(c, L * 0.26 + k * w - e, -hh - e, w + e * 2, hh * 2 + e * 2,
            pass ? (k < 2 ? p.c : p.eclat) : p.b);
      }
    if (plumes) for (const sg of [-1, 1]){        // empennage : deux plumes rouges
      pav(c, -L / 2 - 1, sg * h - 1, s * 0.75 + 2, h * 1.5 + 2, p.b);
      pav(c, -L / 2, sg * h, s * 0.75, h * 1.5, p.plume);
    }
    c.restore();
    return;
  }
  if (p.forme === 'gemme'){                       // losange : ni tour, ni monstre
    const r = s * 0.72;
    for (let k = -2; k <= 2; k++){
      const w = r * (1 - Math.abs(k) / 3), q = r / 2.5;
      pav(c, x - w - 1, y + k * q - 1, w * 2 + 2, q + 2, p.b);
    }
    for (let k = -2; k <= 2; k++){
      const w = r * (1 - Math.abs(k) / 3), q = r / 2.5;
      pav(c, x - w, y + k * q, w * 2, q, k <= -1 ? p.eclat : p.c);
    }
    return;
  }
  /* Bombe : un octogone, pas un carre — un carre se confond avec les pierres
     du decor. Bandes de largeurs decroissantes, contour puis coeur. */
  const r = s * 0.85, bandes = [0.52, 0.86, 1, 0.86, 0.52], q = r * 2 / 5;
  for (let pass = 0; pass < 2; pass++)
    bandes.forEach((f, k) => {
      const w = r * f, e = pass ? 0 : 1;
      pav(c, x - w - e, y - r + k * q - e, w * 2 + e * 2, q + e * 2, pass ? p.c : p.b);
    });
  pav(c, x - r * 0.5, y - r * 0.55, r * 0.45, q * 0.8, p.eclat);   // reflet
  pav(c, x - r * 0.22, y - r * 1.45, r * 0.44, r * 0.5, p.eclat);  // etincelle de meche
}

/* La foudre ne voyage pas : elle est deja arrivee. On la dessine en zigzag,
   avec un decalage qui depend du temps pour qu'elle grouille. */
function eclair(c, x0, y0, x1, y1, p, u, s){
  const n = 5, dx = (x1 - x0) / n, dy = (y1 - y0) / n;
  const nx = -(y1 - y0), ny = (x1 - x0);
  const norme = Math.max(1, Math.sqrt(nx * nx + ny * ny));
  c.globalAlpha = 1 - u * 0.65;
  for (let k = 0; k < n; k++){
    const d = (k % 2 ? 1 : -1) * s * 0.9 * (1 - k / n);
    const ax = x0 + dx * k + nx / norme * (k ? d : 0);
    const ay = y0 + dy * k + ny / norme * (k ? d : 0);
    const bx = x0 + dx * (k + 1) + nx / norme * (k + 1 < n ? -d : 0);
    const by = y0 + dy * (k + 1) + ny / norme * (k + 1 < n ? -d : 0);
    c.strokeStyle = p.b; c.lineWidth = Math.max(3, s * 0.7);
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
    c.strokeStyle = p.eclat; c.lineWidth = Math.max(1, s * 0.28);
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  }
  c.globalAlpha = 1;
}

/* L'impact. Une gerbe de quatre pixels, et un anneau si la tour frappe en zone
   — c'est la seule facon de voir d'un coup d'oeil qu'elle touche un groupe. */
function impact(c, t, x, y, u, u2p, s){
  c.globalAlpha = 1 - u;
  const d = s * (0.5 + u * 1.6);
  for (const [sx, sy] of [[-1,-1],[1,-1],[-1,1],[1,1]])
    pav(c, x + sx * d - s * 0.25, y + sy * d - s * 0.25, s * 0.5, s * 0.5, t.p.eclat);
  pav(c, x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8, t.p.c);
  if (t.zone){
    c.strokeStyle = t.p.eclat; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, u2p(t.zone) * (0.35 + u * 0.65), 0, 7); c.stroke();
  }
  c.globalAlpha = 1;
}
