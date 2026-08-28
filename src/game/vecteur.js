/* La couche vectorielle. Les sprites restent du pixel — c'est l'identite du
   jeu, et un sprite lisse devient une bouillie. Tout ce qui n'est PAS un
   sprite passe en revanche par des courbes et des degrades : ombres, lumiere
   du plateau, barres de vie, cercles de portee. Le contraste entre les deux
   est ce qui fait « propre » plutot que « brut » : c'est la recette de
   beaucoup de jeux pixel modernes. */

/* Une ombre douce coute cher a recalculer : on la cuit une fois dans un
   tampon et on la redimensionne. Cent monstres a l'ecran, un seul degrade. */
let tamponOmbre = null;
function ombreCuite(){
  if (tamponOmbre) return tamponOmbre;
  const R = 64;
  tamponOmbre = document.createElement('canvas');
  tamponOmbre.width = R * 2; tamponOmbre.height = R * 2;
  const c = tamponOmbre.getContext('2d');
  const d = c.createRadialGradient(R, R, 0, R, R, R);
  d.addColorStop(0,   'rgba(0,0,0,.46)');
  d.addColorStop(.55, 'rgba(0,0,0,.24)');
  d.addColorStop(1,   'rgba(0,0,0,0)');
  c.fillStyle = d; c.fillRect(0, 0, R * 2, R * 2);
  return tamponOmbre;
}
function ombreDouce(c, x, y, rx, ry){
  c.drawImage(ombreCuite(), x - rx, y - ry, rx * 2, ry * 2);
}

/* La lumiere du plateau : une nappe chaude venue du haut, la ou se trouve
   l'entree, et un assombrissement des bords. Sans elle le terrain est un
   aplat, et aucun sprite ne s'y detache vraiment. */
function eclairage(c, ox, oy, larg, haut){
  const nappe = c.createLinearGradient(0, oy, 0, oy + haut);
  nappe.addColorStop(0,   'rgba(255,238,190,.16)');
  nappe.addColorStop(.35, 'rgba(255,238,190,.05)');
  nappe.addColorStop(1,   'rgba(20,16,40,.10)');
  c.fillStyle = nappe; c.fillRect(ox, oy, larg, haut);
}
function vignette(c, ox, oy, larg, haut){
  const r = Math.hypot(larg, haut) / 2;
  const v = c.createRadialGradient(ox + larg / 2, oy + haut / 2, r * .55,
                                   ox + larg / 2, oy + haut / 2, r);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(8,6,18,.34)');
  c.fillStyle = v; c.fillRect(ox, oy, larg, haut);
}

/* Un rectangle a coins ronds, brique de base de tout le reste. */
function pave(c, x, y, w, h, r){
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y,     x + w, y + h, r);
  c.arcTo(x + w, y + h, x,     y + h, r);
  c.arcTo(x,     y + h, x,     y,     r);
  c.arcTo(x,     y,     x + w, y,     r);
  c.closePath();
}

/* Barre de vie : socle sombre arrondi, remplissage en degrade, filet clair en
   haut. Trois traits au lieu de deux rectangles plats, et l'objet cesse d'etre
   un debug. */
function barreVie(c, x, y, w, h, part, teinte){
  pave(c, x - 1, y - 1, w + 2, h + 2, (h + 2) / 2);
  c.fillStyle = 'rgba(6,5,12,.78)'; c.fill();
  if (part <= 0) return;
  const p = Math.max(h, w * part);
  const d = c.createLinearGradient(x, y, x, y + h);
  d.addColorStop(0, teinte[0]); d.addColorStop(1, teinte[1]);
  pave(c, x, y, p, h, h / 2);
  c.fillStyle = d; c.fill();
  if (p > h * 1.6){
    pave(c, x + 1, y + .5, p - 2, Math.max(1, h * .34), h * .2);
    c.fillStyle = 'rgba(255,255,255,.30)'; c.fill();
  }
}
const VIE_MONSTRE = ['#ff8f7a', '#c4382f'];
const VIE_TOUR    = ['#9df08d', '#3f9b45'];

/* Le cercle de portee : un disque en degrade et un liszere pointille qui
   tourne. Un cercle plein masquait le terrain, un simple trait se perdait. */
function cerclePortee(c, x, y, r, phase){
  const d = c.createRadialGradient(x, y, r * .55, x, y, r);
  d.addColorStop(0, 'rgba(255,210,74,0)');
  d.addColorStop(1, 'rgba(255,210,74,.16)');
  c.fillStyle = d;
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.save();
  c.setLineDash([r * .10, r * .07]);
  c.lineDashOffset = -phase / 26;
  c.strokeStyle = 'rgba(255,210,74,.75)'; c.lineWidth = 2;
  c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  c.restore();
}

/* Le liseré du plateau, en degrade plutot qu'un trait uni. */
function cadrePlateau(c, ox, oy, larg, haut){
  const d = c.createLinearGradient(ox, oy, ox, oy + haut);
  d.addColorStop(0, 'rgba(255,255,255,.16)');
  d.addColorStop(.5, 'rgba(10,9,16,.35)');
  d.addColorStop(1, 'rgba(10,9,16,.55)');
  c.strokeStyle = d; c.lineWidth = 2;
  pave(c, ox + 1, oy + 1, larg - 2, haut - 2, 6);
  c.stroke();
}
