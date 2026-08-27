/* La grille et le chemin. Une seule fonction de recherche : ce qui change entre
   un monstre et le Controleur, c'est le prix d'une case occupee.
     - monstre     : occupee = infranchissable, il contourne ou il attend
     - Controleur  : occupee = prix de sa demolition, il passe par le plus faible */

const IDX = (c, x, y) => y * c.LARGEUR + x;
const XY  = (c, i) => ({x: i % c.LARGEUR, y: (i / c.LARGEUR) | 0});

/* Voisins dans un ordre FIXE. Toute la reproductibilite des replays en depend :
   deux chemins de cout egal doivent toujours donner le meme resultat. */
const VOISINS = [[0,-1],[1,0],[0,1],[-1,0]];

function calculerChemin(cfg, occupe, coutOccupe){
  const n = cfg.LARGEUR * cfg.HAUTEUR;
  const dep = IDX(cfg, cfg.entree.x, cfg.entree.y);
  const arr = IDX(cfg, cfg.exit.x, cfg.exit.y);
  const g = new Int32Array(n).fill(0x7fffffff);
  const prec = new Int32Array(n).fill(-1);
  const vu = new Uint8Array(n);
  g[dep] = 0;
  /* File de priorite : tableau trie par (f, index). Sur 117 cases c'est plus
     rapide qu'un tas, et l'ordre est totalement determine. */
  const file = [dep];
  const h = i => { const p = XY(cfg, i);
    return Math.abs(p.x - cfg.exit.x) + Math.abs(p.y - cfg.exit.y); };

  while (file.length){
    let meilleur = 0;
    for (let k = 1; k < file.length; k++){
      const a = file[k], b = file[meilleur];
      const fa = g[a] + h(a), fb = g[b] + h(b);
      if (fa < fb || (fa === fb && a < b)) meilleur = k;
    }
    const cur = file.splice(meilleur, 1)[0];
    if (cur === arr) break;
    if (vu[cur]) continue;
    vu[cur] = 1;
    const p = XY(cfg, cur);
    for (const [dx, dy] of VOISINS){
      const x = p.x + dx, y = p.y + dy;
      if (x < 0 || y < 0 || x >= cfg.LARGEUR || y >= cfg.HAUTEUR) continue;
      const j = IDX(cfg, x, y);
      let pas = 10;
      if (occupe[j] >= 0){
        if (coutOccupe === null) continue;          // le monstre ne traverse pas
        pas = 10 + coutOccupe(j);
      }
      const nouveau = g[cur] + pas;
      if (nouveau < g[j]){ g[j] = nouveau; prec[j] = cur; file.push(j); }
    }
  }
  if (g[arr] === 0x7fffffff) return null;           // aucune route, meme en cassant
  const chemin = [];
  for (let i = arr; i !== -1; i = prec[i]) chemin.push(i);
  return chemin.reverse();
}

/* Y a-t-il encore une route libre ? Sert a savoir si la ligne est scellee. */
function routeLibre(cfg, occupe){ return calculerChemin(cfg, occupe, null) !== null; }
