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
    sol:['#4a7c42','#48793f','#4d7f45','#477740'],
    brin:['#568a49','#3f6d38'],
    terre:['#7a5a38','#6b4d2e','#8a6a44'], orniere:['#5c4028','#95784f'],
    pierre:['#6b6a72','#83828c','#54535c'],
    petales:['#dcd6b4','#cf8496','#e6c96e'],
    bois:['#5c4028','#6b4d2e','#8a6a44','#4a3220'],
    portail:'rgba(210,70,60,.30)', caverne:'rgba(150,120,190,.22)'
  },
  orc: {
    cle:'orc', nom:'Terres rouges',
    sol:['#8a6136','#856035','#916838','#7f5a32'],
    brin:['#9c7742','#6b4a26'],
    terre:['#a8814c','#96703f','#b8925c'], orniere:['#7a5730','#c9a878'],
    pierre:['#7d5340','#966850','#5e3e2f'],
    petales:['#d8c07a','#c98a5a','#e8d8a0'],
    bois:['#5e3a22','#6e472a','#8a5e3a','#472b18'],
    portail:'rgba(220,90,50,.32)', caverne:'rgba(255,150,80,.20)'
  },
  mortvivant: {
    cle:'mortvivant', nom:'Terre gâtée',
    sol:['#4a4658','#474354','#4e4a5e','#443f52'],
    brin:['#5c5568','#38334a'],
    terre:['#5e5768','#544d5e','#6b6478'], orniere:['#433d50','#7d768c'],
    pierre:['#6b6478','#847d92','#544e60'],
    petales:['#8dff8a','#ded6bc','#6fbf6a'],
    bois:['#4a4438','#564e40','#6b6152','#3a352c'],
    portail:'rgba(120,210,110,.26)', caverne:'rgba(120,255,130,.20)'
  },
  elfe: {
    cle:'elfe', nom:'Sous-bois',
    sol:['#31524f','#2e4f4c','#355754','#2c4a48'],
    brin:['#3f6b62','#25423f'],
    terre:['#4a6b56','#42604d','#557a62'], orniere:['#35503f','#6f9a80'],
    pierre:['#4a5f66','#5f7880','#3a4c52'],
    petales:['#7ffff0','#c4a8ff','#a8e0d0'],
    bois:['#3a3a2c','#47472f','#5f6140','#2c2c22'],
    portail:'rgba(120,200,255,.26)', caverne:'rgba(111,230,221,.24)'
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
  d.addColorStop(0, 'rgba(0,0,0,.20)'); d.addColorStop(.16, 'rgba(0,0,0,0)');
  d.addColorStop(.84, 'rgba(0,0,0,0)'); d.addColorStop(1, 'rgba(0,0,0,.20)');
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
