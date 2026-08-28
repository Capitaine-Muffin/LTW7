/* Le terrain. Tout est genere, rien n'est charge.
   Deux couches : l'herbe et son decor, cuits une fois dans un canvas hors
   ecran (ils ne changent jamais), puis le sentier, redessine seulement quand
   la grille change. Le decor ne doit jamais concurrencer les sprites : il
   reste sous les valeurs moyennes, sans contraste fort. */

/* Les quatre verts sont volontairement proches : au-dela, on voit le damier
   des cases au lieu d'une prairie. */
const D_HERBE  = ['#4a7c42', '#48793f', '#4d7f45', '#477740'];
const D_BRIN   = ['#568a49', '#3f6d38'];
const D_TERRE  = ['#7a5a38', '#6b4d2e', '#8a6a44'];
const D_PIERRE = ['#6b6a72', '#83828c', '#54535c'];

/* Hachage deterministe par case : le meme terrain a chaque partie, sans RNG. */
function dHash(x, y, sel){
  let h = (x * 374761393 + y * 668265263 + sel * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0);
}

function cuireTerrain(cfg, T){
  const cv = document.createElement('canvas');
  cv.width = cfg.LARGEUR * T; cv.height = cfg.HAUTEUR * T;
  const c = cv.getContext('2d');
  const px = Math.max(1, Math.round(T / 22));            // un "pixel" de decor, fin

  /* Le fond ne suit pas la grille : les taches de teinte sont plus larges
     qu'une case et decalees, sinon l'oeil lit le damier. */
  c.fillStyle = D_HERBE[0]; c.fillRect(0, 0, cv.width, cv.height);
  const pas = Math.round(T * 0.7);
  for (let y = -1; y * pas < cv.height; y++) for (let x = -1; x * pas < cv.width; x++){
    const h = dHash(x, y, 1);
    if (h % 3 === 0) continue;
    c.fillStyle = D_HERBE[h % D_HERBE.length];
    const dx = (h >> 5) % pas, dy = (h >> 11) % pas;
    c.fillRect(x * pas + dx, y * pas + dy, pas, pas);
  }

  for (let y = 0; y < cfg.HAUTEUR; y++) for (let x = 0; x < cfg.LARGEUR; x++){
    const h = dHash(x, y, 2);
    /* Brins : traits d'un pixel de large, deux ou trois par touffe. */
    const touffes = 2 + (h >> 3) % 3;
    for (let k = 0; k < touffes; k++){
      const g = dHash(x, y, 10 + k);
      const bx = x * T + (g % Math.max(1, T - px * 6)) + px * 2;
      const by = y * T + ((g >> 8) % Math.max(1, T - px * 6)) + px * 2;
      const ton = D_BRIN[(g >> 16) % 2];
      c.fillStyle = ton;
      c.fillRect(bx, by, px, px * 3);
      c.fillRect(bx + px * 2, by + px, px, px * 2);
      c.fillRect(bx - px, by + px * 2, px, px * 2);
    }
    const r = dHash(x, y, 3) % 100;
    if (r < 6){                                          // caillou pose au sol
      const g = dHash(x, y, 4);
      const bx = x * T + (g % Math.max(1, T - px * 7)) + px * 2;
      const by = y * T + ((g >> 7) % Math.max(1, T - px * 7)) + px * 2;
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(bx - px, by + px * 3, px * 6, px);
      c.fillStyle = D_PIERRE[2]; c.fillRect(bx, by + px, px * 4, px * 2);
      c.fillStyle = D_PIERRE[0]; c.fillRect(bx + px, by, px * 3, px);
      c.fillStyle = D_PIERRE[1]; c.fillRect(bx + px, by, px, px);
    } else if (r < 11){                                  // fleur
      const g = dHash(x, y, 5);
      const bx = x * T + (g % Math.max(1, T - px * 6)) + px * 2;
      const by = y * T + ((g >> 7) % Math.max(1, T - px * 6)) + px * 3;
      c.fillStyle = D_BRIN[1]; c.fillRect(bx + px, by + px, px, px * 3);
      c.fillStyle = ['#dcd6b4','#cf8496','#e6c96e'][(g >> 15) % 3];
      c.fillRect(bx, by, px * 3, px); c.fillRect(bx + px, by - px, px, px);
    }
  }
  /* Assombrissement des bords : donne du relief sans rien cacher. */
  const d = c.createLinearGradient(0, 0, 0, cv.height);
  d.addColorStop(0, 'rgba(0,0,0,.20)'); d.addColorStop(.16, 'rgba(0,0,0,0)');
  d.addColorStop(.84, 'rgba(0,0,0,0)'); d.addColorStop(1, 'rgba(0,0,0,.20)');
  c.fillStyle = d; c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

/* Le sentier : de la terre battue sur les cases que les creeps empruntent.
   Il dit au joueur ou passe le flux — c'est de l'information, pas du decor. */
function cuireSentier(cfg, T, chemin){
  const cv = document.createElement('canvas');
  cv.width = cfg.LARGEUR * T; cv.height = cfg.HAUTEUR * T;
  if (!chemin) return cv;
  const c = cv.getContext('2d');
  const px = Math.max(2, Math.round(T / 12));
  const surLeChemin = new Set(chemin);
  for (const i of chemin){
    const x = i % cfg.LARGEUR, y = (i / cfg.LARGEUR) | 0;
    const h = dHash(x, y, 7);
    c.fillStyle = D_TERRE[h % 3];
    c.fillRect(x * T, y * T, T, T);
    /* Bord adouci la ou le sentier touche l'herbe. */
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x + dx, ny = y + dy;
      if (surLeChemin.has(ny * cfg.LARGEUR + nx)) continue;
      c.fillStyle = 'rgba(74,124,66,.55)';
      if (dx) c.fillRect(x * T + (dx > 0 ? T - px : 0), y * T, px, T);
      else    c.fillRect(x * T, y * T + (dy > 0 ? T - px : 0), T, px);
    }
    /* Ornieres et cailloux. */
    for (let k = 0; k < 3; k++){
      const g = dHash(x, y, 20 + k);
      c.fillStyle = (g % 2) ? '#5c4028' : '#95784f';
      c.fillRect(x * T + (g % (T - px * 3)) + px, y * T + ((g >> 9) % (T - px * 2)) + px, px * 2, px);
    }
  }
  return cv;
}

/* L'entree : une gueule de caverne. La sortie : le portail qu'on defend. */
function dessinerEntree(c, cfg, T, ox, oy){
  const x = ox + cfg.entree.x * T, y = oy + cfg.entree.y * T;
  const px = Math.max(2, Math.round(T / 12));
  c.fillStyle = D_PIERRE[2]; c.fillRect(x, y, T, T);
  c.fillStyle = D_PIERRE[0]; c.fillRect(x, y, T, px * 2);
  for (let i = 0; i < 4; i++){
    c.fillStyle = D_PIERRE[i % 2];
    c.fillRect(x + i * T / 4, y, T / 4 - px, px * 3);
  }
  c.fillStyle = '#120f18';
  c.beginPath(); c.moveTo(x + T * .18, y + T);
  c.lineTo(x + T * .18, y + T * .42); c.lineTo(x + T * .5, y + T * .18);
  c.lineTo(x + T * .82, y + T * .42); c.lineTo(x + T * .82, y + T); c.closePath(); c.fill();
  c.fillStyle = 'rgba(150,120,190,.22)';
  c.fillRect(x + T * .26, y + T * .5, T * .48, T * .5);
}
function dessinerSortie(c, cfg, T, ox, oy){
  const x = ox + cfg.exit.x * T, y = oy + cfg.exit.y * T;
  const px = Math.max(2, Math.round(T / 12));
  c.fillStyle = '#5c4028'; c.fillRect(x, y, T, T);
  c.fillStyle = '#6b4d2e'; c.fillRect(x + px, y, T - px * 2, T);
  for (let i = 1; i < 4; i++){ c.fillStyle = '#4a3220';
    c.fillRect(x + i * T / 4, y, px, T); }
  c.fillStyle = '#8a6a44'; c.fillRect(x, y, T, px);
  /* Deux montants de pierre : ca doit ressembler a quelque chose qu'on defend. */
  /* Les montants restent DANS le plateau : deborder sur le fond sombre se lit
     comme un bug d'affichage, pas comme du decor. */
  c.fillStyle = D_PIERRE[2];
  c.fillRect(x - px * 2, y - px * 3, px * 3, T + px * 3);
  c.fillRect(x + T - px, y - px * 3, px * 3, T + px * 3);
  c.fillStyle = D_PIERRE[1];
  c.fillRect(x - px * 2, y - px * 3, px * 3, px * 2);
  c.fillRect(x + T - px, y - px * 3, px * 3, px * 2);
  c.fillStyle = D_PIERRE[0];                              // linteau
  c.fillRect(x - px * 2, y - px * 4, T + px * 5, px * 2);
  c.fillStyle = 'rgba(210,70,60,.30)'; c.fillRect(x, y + T * .55, T, T * .45);
}
