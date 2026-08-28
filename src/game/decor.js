/* Le terrain. Tout est genere, rien n'est charge.
   Deux couches : l'herbe et son decor, cuits une fois dans un canvas hors
   ecran (ils ne changent jamais), puis le sentier, redessine seulement quand
   la grille change. Le decor ne doit jamais concurrencer les sprites : il
   reste sous les valeurs moyennes, sans contraste fort. */

/* Les quatre verts sont volontairement proches : au-dela, on voit le damier
   des cases au lieu d'une prairie. */
/* Un biome par camp : le terrain dit à qui appartient la ligne avant même
   qu'on lise le nom en haut. Mêmes formes, palettes differentes — exactement
   la regle des batiments. */
const BIOMES = {
  humain: {
    cle:'humain', nom:'Prairie',
    sol:['#5d9351','#5a8f4d','#619754','#588d4b'],
    brin:['#72ab60','#4c8044'],
    terre:['#9a7a52','#8a6c42','#a98d62'], orniere:['#785c3c','#b89d71'],
    pierre:['#87868f','#a09fa9','#6e6d75'],
    petales:['#f2eece','#e29caa','#f7de88'],
    bois:['#6e4d33','#7d5a3c','#9a7350','#57402b'],
    portail:'rgba(225,95,80,.34)', caverne:'rgba(178,150,215,.26)'
  },
  orc: {
    cle:'orc', nom:'Terres rouges',
    sol:['#a4784c','#9f754a','#ab7e4e','#997247'],
    brin:['#b79158','#85623b'],
    terre:['#c39d66','#b18a55','#d3af7a'], orniere:['#977342','#e2c799'],
    pierre:['#9d6e57','#b7876b','#7d5643'],
    petales:['#f0dc98','#dfa273','#f7eaba'],
    bois:['#7a5030','#8a5e3a','#a5764c','#5e3d24'],
    portail:'rgba(240,115,70,.36)', caverne:'rgba(255,175,105,.26)'
  },
  mortvivant: {
    cle:'mortvivant', nom:'Terre gâtée',
    sol:['#716d83','#6d697f','#767289','#69657b'],
    brin:['#847e96','#59536b'],
    terre:['#867f95','#7b728b','#948da3'], orniere:['#686177','#a79fb7'],
    pierre:['#928ba1','#aca5bb','#7a7389'],
    petales:['#adffa7','#f2ebd3','#94dd8f'],
    bois:['#665e50','#726957','#8a7f6a','#4f4840'],
    portail:'rgba(140,235,130,.30)', caverne:'rgba(150,255,160,.26)'
  },
  elfe: {
    cle:'elfe', nom:'Sous-bois',
    sol:['#4d7b76','#4a7873','#51827c','#48746f'],
    brin:['#619791','#3b5f5b'],
    terre:['#67917a','#5e856f','#749f87'], orniere:['#507260','#94bfa7'],
    pierre:['#6a848d','#8299a3','#566e75'],
    petales:['#adfff4','#d9c1ff','#c7f1e5'],
    bois:['#4c4c3a','#59593d','#71734f','#38382c'],
    portail:'rgba(140,215,255,.30)', caverne:'rgba(140,240,232,.28)'
  }
};

/* Le bord du sentier reprend le sol du biome, a moitie transparent. */
for (const b of Object.values(BIOMES)){
  const [r, v, bl] = [1, 3, 5].map(i => parseInt(b.sol[0].slice(i, i + 2), 16));
  b.bordSentier = `rgba(${r},${v},${bl},.55)`;
}
const BIOME = (k) => BIOMES[k] || BIOMES.humain;

/* Un element de decor par biome, pose rarement : c'est lui qui donne le
   caractere. Il reste sombre et desature — un joueur ne doit jamais le
   confondre avec une tour. */
const PROPS = {
  humain(c, x, y, px, B){                                  // buisson
    c.fillStyle = 'rgba(0,0,0,.20)'; c.fillRect(x - px, y + px * 5, px * 8, px);
    c.fillStyle = B.brin[1]; c.fillRect(x, y + px, px * 6, px * 5);
    c.fillStyle = B.brin[0]; c.fillRect(x + px, y, px * 4, px * 3);
    c.fillRect(x, y + px * 2, px * 2, px * 2);
    c.fillStyle = B.petales[0]; c.fillRect(x + px * 4, y + px * 2, px, px);
  },
  orc(c, x, y, px, B){                                     // crane sur un pieu
    c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, y + px * 7, px * 6, px);
    c.fillStyle = B.bois[3]; c.fillRect(x + px * 2, y + px * 3, px, px * 4);
    c.fillStyle = '#d8cdb0'; c.fillRect(x + px, y, px * 4, px * 3);
    c.fillRect(x + px * 2, y + px * 3, px * 2, px);
    c.fillStyle = '#2a2018'; c.fillRect(x + px, y + px, px, px);
    c.fillRect(x + px * 3, y + px, px, px);
  },
  mortvivant(c, x, y, px, B){                              // arbre mort
    c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(x, y + px * 9, px * 6, px);
    c.fillStyle = B.bois[3]; c.fillRect(x + px * 2, y + px * 2, px * 2, px * 7);
    c.fillStyle = B.bois[1];
    c.fillRect(x, y + px * 2, px * 2, px); c.fillRect(x, y, px, px * 2);
    c.fillRect(x + px * 4, y + px * 4, px * 2, px); c.fillRect(x + px * 5, y + px * 2, px, px * 2);
    c.fillStyle = B.petales[0]; c.fillRect(x + px * 3, y + px * 5, px, px);
  },
  elfe(c, x, y, px, B){                                    // champignons lumineux
    c.fillStyle = 'rgba(0,0,0,.20)'; c.fillRect(x, y + px * 6, px * 7, px);
    c.fillStyle = B.pierre[2]; c.fillRect(x + px, y + px * 3, px, px * 3);
    c.fillRect(x + px * 4, y + px * 4, px, px * 2);
    c.fillStyle = B.petales[0];
    c.fillRect(x, y + px * 2, px * 3, px); c.fillRect(x + px, y + px, px, px);
    c.fillRect(x + px * 3, y + px * 3, px * 3, px);
    c.fillStyle = B.petales[1]; c.fillRect(x + px, y + px * 2, px, px);
  }
};

/* Hachage deterministe par case : le meme terrain a chaque partie, sans RNG. */
function dHash(x, y, sel){
  let h = (x * 374761393 + y * 668265263 + sel * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0);
}

function cuireTerrain(cfg, T, B){
  const cv = document.createElement('canvas');
  cv.width = cfg.LARGEUR * T; cv.height = cfg.HAUTEUR * T;
  const c = cv.getContext('2d');
  const px = Math.max(1, Math.round(T / 22));            // un "pixel" de decor, fin

  /* Le fond ne suit pas la grille : les taches de teinte sont plus larges
     qu'une case et decalees, sinon l'oeil lit le damier. */
  c.fillStyle = B.sol[0]; c.fillRect(0, 0, cv.width, cv.height);
  const pas = Math.round(T * 0.7);
  for (let y = -1; y * pas < cv.height; y++) for (let x = -1; x * pas < cv.width; x++){
    const h = dHash(x, y, 1);
    if (h % 3 === 0) continue;
    c.fillStyle = B.sol[h % B.sol.length];
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
      const ton = B.brin[(g >> 16) % 2];
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
      c.fillStyle = B.pierre[2]; c.fillRect(bx, by + px, px * 4, px * 2);
      c.fillStyle = B.pierre[0]; c.fillRect(bx + px, by, px * 3, px);
      c.fillStyle = B.pierre[1]; c.fillRect(bx + px, by, px, px);
    } else if (r < 9){                                   // element de decor du biome
      const g = dHash(x, y, 6);
      const bx = x * T + (g % Math.max(1, T - px * 9)) + px;
      const by = y * T + ((g >> 7) % Math.max(1, T - px * 11)) + px;
      (PROPS[B.cle] || PROPS.humain)(c, bx, by, px, B);
    } else if (r < 14){                                  // fleur
      const g = dHash(x, y, 5);
      const bx = x * T + (g % Math.max(1, T - px * 6)) + px * 2;
      const by = y * T + ((g >> 7) % Math.max(1, T - px * 6)) + px * 3;
      c.fillStyle = B.brin[1]; c.fillRect(bx + px, by + px, px, px * 3);
      c.fillStyle = B.petales[(g >> 15) % 3];
      c.fillRect(bx, by, px * 3, px); c.fillRect(bx + px, by - px, px, px);
    }
  }
  /* Assombrissement des bords : donne du relief sans rien cacher. */
  const d = c.createLinearGradient(0, 0, 0, cv.height);
  d.addColorStop(0, 'rgba(0,0,0,.10)'); d.addColorStop(.13, 'rgba(0,0,0,0)');
  d.addColorStop(.87, 'rgba(0,0,0,0)'); d.addColorStop(1, 'rgba(0,0,0,.10)');
  c.fillStyle = d; c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

/* Le sentier : de la terre battue sur les cases que les creeps empruntent.
   Il dit au joueur ou passe le flux — c'est de l'information, pas du decor. */
function cuireSentier(cfg, T, chemin, B){
  const cv = document.createElement('canvas');
  cv.width = cfg.LARGEUR * T; cv.height = cfg.HAUTEUR * T;
  if (!chemin) return cv;
  const c = cv.getContext('2d');
  const px = Math.max(2, Math.round(T / 12));
  const surLeChemin = new Set(chemin);
  for (const i of chemin){
    const x = i % cfg.LARGEUR, y = (i / cfg.LARGEUR) | 0;
    const h = dHash(x, y, 7);
    c.fillStyle = B.terre[h % 3];
    c.fillRect(x * T, y * T, T, T);
    /* Bord adouci la ou le sentier touche l'herbe. */
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x + dx, ny = y + dy;
      if (surLeChemin.has(ny * cfg.LARGEUR + nx)) continue;
      c.fillStyle = B.bordSentier;
      if (dx) c.fillRect(x * T + (dx > 0 ? T - px : 0), y * T, px, T);
      else    c.fillRect(x * T, y * T + (dy > 0 ? T - px : 0), T, px);
    }
    /* Ornieres et cailloux. */
    for (let k = 0; k < 3; k++){
      const g = dHash(x, y, 20 + k);
      c.fillStyle = B.orniere[g % 2];
      c.fillRect(x * T + (g % (T - px * 3)) + px, y * T + ((g >> 9) % (T - px * 2)) + px, px * 2, px);
    }
  }
  return cv;
}

/* L'entree : une gueule de caverne. La sortie : le portail qu'on defend. */
function dessinerEntree(c, cfg, T, ox, oy, B){
  const x = ox + cfg.entree.x * T, y = oy + cfg.entree.y * T;
  const px = Math.max(2, Math.round(T / 12));
  c.fillStyle = B.pierre[2]; c.fillRect(x, y, T, T);
  c.fillStyle = B.pierre[0]; c.fillRect(x, y, T, px * 2);
  for (let i = 0; i < 4; i++){
    c.fillStyle = B.pierre[i % 2];
    c.fillRect(x + i * T / 4, y, T / 4 - px, px * 3);
  }
  c.fillStyle = '#120f18';
  c.beginPath(); c.moveTo(x + T * .18, y + T);
  c.lineTo(x + T * .18, y + T * .42); c.lineTo(x + T * .5, y + T * .18);
  c.lineTo(x + T * .82, y + T * .42); c.lineTo(x + T * .82, y + T); c.closePath(); c.fill();
  c.fillStyle = B.caverne;
  c.fillRect(x + T * .26, y + T * .5, T * .48, T * .5);
}
function dessinerSortie(c, cfg, T, ox, oy, B){
  const x = ox + cfg.exit.x * T, y = oy + cfg.exit.y * T;
  const px = Math.max(2, Math.round(T / 12));
  c.fillStyle = B.bois[0]; c.fillRect(x, y, T, T);
  c.fillStyle = B.bois[1]; c.fillRect(x + px, y, T - px * 2, T);
  for (let i = 1; i < 4; i++){ c.fillStyle = B.bois[3];
    c.fillRect(x + i * T / 4, y, px, T); }
  c.fillStyle = B.bois[2]; c.fillRect(x, y, T, px);
  /* Deux montants de pierre : ca doit ressembler a quelque chose qu'on defend. */
  /* Les montants restent DANS le plateau : deborder sur le fond sombre se lit
     comme un bug d'affichage, pas comme du decor. */
  c.fillStyle = B.pierre[2];
  c.fillRect(x - px * 2, y - px * 3, px * 3, T + px * 3);
  c.fillRect(x + T - px, y - px * 3, px * 3, T + px * 3);
  c.fillStyle = B.pierre[1];
  c.fillRect(x - px * 2, y - px * 3, px * 3, px * 2);
  c.fillRect(x + T - px, y - px * 3, px * 3, px * 2);
  c.fillStyle = B.pierre[0];                              // linteau
  c.fillRect(x - px * 2, y - px * 4, T + px * 5, px * 2);
  c.fillStyle = B.portail; c.fillRect(x, y + T * .55, T, T * .45);
}
