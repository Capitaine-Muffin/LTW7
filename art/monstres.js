/* Les monstres. 24 x 24, deux images d'animation, meme methode que les
   batiments : chaque partie est dessinee a part et detouree en noir avant
   d'etre collee, sinon la silhouette s'affaisse en aplat.
   Ils sont vus de face : ils descendent le couloir vers le joueur. */

const NM = 24;
const MG = () => Array.from({length: NM}, () => Array(NM).fill(null));
const MP = (g, x, y, c) => { x = Math.round(x); y = Math.round(y);
  if (c && x >= 0 && x < NM && y >= 0 && y < NM) g[y][x] = c; };
const MR = (g, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) MP(g, x + i, y + j, c); };
function MOUT(g, c){ const n = g.map(r => r.slice());
  for (let y = 0; y < NM; y++) for (let x = 0; x < NM; x++){ if (g[y][x]) continue;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const a = x + dx, b = y + dy;
      if (a >= 0 && a < NM && b >= 0 && b < NM && g[b][a]){ n[y][x] = c; break; } } }
  return n; }
function MCOUCHE(base, c, fn){ const t = MG(); fn(t); const o = MOUT(t, c);
  for (let y = 0; y < NM; y++) for (let x = 0; x < NM; x++) if (o[y][x]) base[y][x] = o[y][x]; }
/* Corps en trois bandes : ombre a droite, masse au milieu, lumiere a gauche. */
function MCORPS(g, x, y, w, h, p){
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){
    const t = i / (w - 1);
    MP(g, x + i, y + j, t < 0.18 ? p.c3 : t < 0.62 ? p.c2 : p.c1);
  }
  MR(g, x + 1, y, w - 2, 1, p.c3);
}
function MOMBRE(g, cx, larg, p){
  for (let i = -larg; i <= larg; i++){
    const h = Math.round(1.6 * Math.sqrt(Math.max(0, 1 - (i / larg) ** 2)));
    for (let j = 0; j < h; j++) MP(g, cx + i, 21 + j, p.sol);
  }
}

const MONSTRES_ART = {

  /* --- Squelette : os secs, cage thoracique ouverte, feu vert dans le crane.
     Il marche en cliquetant : une image sur deux, la machoire tombe. --- */
  squelette(g, f, p){
    MOMBRE(g, 12, 6, p);
    MCOUCHE(g, p.d, t => {                                                        // jambes
      MR(t, 10 - (f?1:0), 16, 2, 5, p.c2); MR(t, 13 + (f?1:0), 16, 2, 5, p.c2);
      MR(t, 10 - (f?1:0), 20, 2, 1, p.c1); MR(t, 13 + (f?1:0), 20, 2, 1, p.c1); });
    MCOUCHE(g, p.d, t => {                                                        // cage thoracique
      MR(t, 11, 9, 3, 8, p.c1);
      for (let j = 0; j < 4; j++){ const w = 4 - (j > 2 ? 1 : 0);
        MR(t, 12 - w, 10 + j*2, w, 1, p.c3); MR(t, 13, 10 + j*2, w, 1, p.c2); } });
    MCOUCHE(g, p.d, t => {                                                        // bras ballants
      MR(t, 7 + (f?0:1), 10, 2, 7, p.c2); MR(t, 16 - (f?0:1), 10, 2, 7, p.c2); });
    MCOUCHE(g, p.d, t => {                                                        // crane
      MR(t, 9, 2, 7, 6, p.c3); MR(t, 10, 1, 5, 1, p.c3);
      MR(t, 10, 4, 2, 2, p.d); MR(t, 14, 4, 2, 2, p.d);
      MP(t, 10, 4, p.lueur); MP(t, 15, 4, p.lueur);
      MR(t, 10, 7 + (f?1:0), 6, 1, p.c1);                                         // machoire
      for (let i = 10; i < 16; i += 2) MP(t, i, 7 + (f?1:0), p.d); });
  },
  /* --- Grognard : orc trapu, epaules plus larges que hautes, hache basse. --- */
  grognard(g, f, p){
    MOMBRE(g, 12, 8, p);
    MCOUCHE(g, p.d, t => {                                                        // jambes courtes
      MR(t, 8 - (f?1:0), 17, 4, 4, p.c1); MR(t, 13 + (f?1:0), 17, 4, 4, p.c1);
      MR(t, 8 - (f?1:0), 20, 4, 1, p.d); MR(t, 13 + (f?1:0), 20, 4, 1, p.d); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 6, 9, 13, 9, p);                             // torse large
      MR(t, 6, 12, 13, 1, p.t2); MR(t, 10, 9, 5, 9, p.t1); MR(t, 10, 9, 1, 9, p.t2); });
    MCOUCHE(g, p.d, t => {                                                        // hache
      MR(t, 18 + (f?0:1), 7, 2, 12, p.c1);
      MR(t, 16 + (f?0:1), 5, 6, 4, p.metal); MR(t, 16 + (f?0:1), 5, 6, 1, p.metalC);
      MR(t, 21 + (f?0:1), 5, 1, 4, p.metalC); });
    MCOUCHE(g, p.d, t => {                                                        // tete, defenses
      MR(t, 9, 3, 7, 6, p.c2); MR(t, 10, 2, 5, 1, p.c3);
      MR(t, 10, 5, 2, 2, p.d); MR(t, 14, 5, 2, 2, p.d);
      MP(t, 10, 5, p.oeil); MP(t, 15, 5, p.oeil);
      MP(t, 10, 8, p.metalC); MP(t, 15, 8, p.metalC);                             // defenses
      MR(t, 8, 4, 1, 3, p.c1); MR(t, 16, 4, 1, 3, p.c1); });
  },
  /* --- Centaure : quatre pattes devant, buste humain dessus, arc en travers.
     La seule silhouette large ET haute du catalogue. --- */
  centaure(g, f, p){
    MOMBRE(g, 12, 9, p);
    MCOUCHE(g, p.d, t => {                                                        // quatre pattes
      for (const [x, d] of [[6,0],[9,1],[14,1],[17,0]]){
        MR(t, x, 16 + (f?d:1-d), 2, 5 - (f?d:1-d), p.c1);
        MR(t, x, 20, 2, 1, p.d); } });
    MCOUCHE(g, p.d, t => { MCORPS(t, 5, 11, 15, 6, p);                            // croupe
      MR(t, 5, 11, 15, 1, p.c3);
      for (let i = 6; i < 20; i += 4) MP(t, i, 14, p.crin); });
    MCOUCHE(g, p.d, t => { MR(t, 18, 8, 2, 6, p.crin); MP(t, 20, 10, p.crin); });  // queue
    MCOUCHE(g, p.d, t => {                                                        // buste et epaules
      MR(t, 8, 6, 9, 2, p.peau);                                                  // epaules
      MR(t, 10, 8, 5, 4, p.peau); MR(t, 10, 8, 1, 4, p.c2); MR(t, 14, 8, 1, 4, p.c1);
      MR(t, 8, 8, 2, 4 + (f?1:0), p.peau); MR(t, 15, 8, 2, 4 + (f?0:1), p.peau); });
    MCOUCHE(g, p.d, t => {                                                        // arc tenu de biais
      for (let j = 0; j < 11; j++){ const dx = Math.round(2 * Math.sin(j / 10 * Math.PI));
        MP(t, 4 - dx, 2 + j, p.c1); }
      for (let j = 1; j < 11; j++) MP(t, 4, 2 + j, p.metal); });
    MCOUCHE(g, p.d, t => { MR(t, 10, 2, 5, 4, p.peau);                            // tete
      MR(t, 9, 1, 7, 2, p.crin); MP(t, 9, 3, p.crin); MP(t, 16, 3, p.crin);
      MP(t, 11, 4, p.d); MP(t, 14, 4, p.d); MP(t, 11, 4, p.oeil); MP(t, 14, 4, p.oeil);
      MR(t, 11, 5, 3, 1, p.c1); });
  },
  /* --- Colosse de pierre : bloc, pas de cou, veine bleue au milieu. --- */
  colosse(g, f, p){
    MOMBRE(g, 12, 9, p);
    MCOUCHE(g, p.d, t => {                                                        // pieds massifs
      MR(t, 6, 17, 5, 4, p.c1); MR(t, 14, 17, 5, 4, p.c1);
      MR(t, 6, 20, 5, 1, p.d); MR(t, 14, 20, 5, 1, p.d); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 5, 5, 15, 13, p);                            // bloc
      for (const [x, y, w, h] of [[6,7,4,3],[12,6,5,4],[7,12,5,4],[14,11,4,5]]){
        MR(t, x, y, w, 1, p.c3); MR(t, x, y + h - 1, w, 1, p.d); }
      MR(t, 11, 8, 2, 8, p.lueur); MP(t, 11, 10, p.c3); });                       // veine
    MCOUCHE(g, p.d, t => {                                                        // bras-massues
      MR(t, 1 + (f?0:1), 7, 4, 10, p.c2); MR(t, 19 - (f?0:1), 7, 4, 10, p.c2);
      MR(t, 1 + (f?0:1), 15, 4, 2, p.c1); MR(t, 19 - (f?0:1), 15, 4, 2, p.c1); });
    MCOUCHE(g, p.d, t => {                                                        // mousse au sommet
      MR(t, 7, 3, 4, 2, p.mousse); MR(t, 14, 4, 3, 1, p.mousse);
      MR(t, 9, 8, 2, 2, p.lueur); MR(t, 14, 8, 2, 2, p.lueur); });
  },
  /* --- Taurren : cornes horizontales tres larges, anneau au museau. --- */
  taureau(g, f, p){
    MOMBRE(g, 12, 8, p);
    MCOUCHE(g, p.d, t => {                                                        // sabots
      MR(t, 8 - (f?1:0), 17, 3, 4, p.c1); MR(t, 14 + (f?1:0), 17, 3, 4, p.c1);
      MR(t, 8 - (f?1:0), 20, 3, 1, p.d); MR(t, 14 + (f?1:0), 20, 3, 1, p.d); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 6, 9, 13, 9, p);                             // torse
      MR(t, 6, 9, 13, 1, p.c3); MR(t, 9, 12, 7, 1, p.c1); });
    MCOUCHE(g, p.d, t => {                                                        // poings
      MR(t, 3 + (f?0:1), 11, 3, 4, p.c2); MR(t, 18 - (f?0:1), 11, 3, 4, p.c2); });
    MCOUCHE(g, p.d, t => { MR(t, 8, 3, 9, 6, p.c2); MR(t, 9, 2, 7, 1, p.c3);      // tete
      MR(t, 10, 6, 5, 3, p.c1); MP(t, 12, 8, p.anneau); MP(t, 11, 8, p.anneau);
      MR(t, 9, 4, 2, 2, p.d); MR(t, 14, 4, 2, 2, p.d);
      MP(t, 9, 4, p.oeil); MP(t, 15, 4, p.oeil); });
    MCOUCHE(g, p.d, t => {                                                        // cornes
      for (let i = 0; i < 5; i++){
        MP(t, 7 - i, 3 - (i > 2 ? 1 : 0), p.corne);
        MP(t, 17 + i, 3 - (i > 2 ? 1 : 0), p.corne); }
      MP(t, 2, 1, p.corne); MP(t, 21, 1, p.corne); });
  },
  /* --- Wendigo : long, decharne, bois de cerf, souffle de givre. --- */
  wendigo(g, f, p){
    MOMBRE(g, 12, 7, p);
    MCOUCHE(g, p.d, t => {                                                        // longues jambes
      MR(t, 9 - (f?1:0), 15, 2, 6, p.c1); MR(t, 14 + (f?1:0), 15, 2, 6, p.c1);
      MR(t, 8 - (f?1:0), 20, 4, 1, p.c2); MR(t, 13 + (f?1:0), 20, 4, 1, p.c2); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 9, 8, 7, 8, p);                              // torse etroit
      for (let j = 0; j < 3; j++) MR(t, 10, 9 + j*2, 5, 1, p.c3); });             // cotes
    MCOUCHE(g, p.d, t => {                                                        // bras tres longs
      MR(t, 6 + (f?0:1), 8, 2, 11, p.c2); MR(t, 17 - (f?0:1), 8, 2, 11, p.c2);
      for (let i = 0; i < 3; i++){ MP(t, 5 + (f?0:1) + i, 19, p.corne);
        MP(t, 17 - (f?0:1) + i, 19, p.corne); } });
    MCOUCHE(g, p.d, t => { MR(t, 9, 3, 7, 5, p.c3); MR(t, 10, 7, 5, 2, p.c2);     // crane allonge
      MR(t, 10, 5, 2, 2, p.d); MR(t, 14, 5, 2, 2, p.d);
      MP(t, 10, 5, p.oeil); MP(t, 15, 5, p.oeil); });
    MCOUCHE(g, p.d, t => {                                                        // bois
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++){
        MP(t, 12 + s * (2 + i), 3 - i, p.corne);
        if (i % 2) MP(t, 12 + s * (2 + i), 2 - i, p.corne); } });
    MCOUCHE(g, p.d, t => { if (f){ MP(t, 12, 10, p.givre); MP(t, 11, 12, p.givre);
      MP(t, 13, 13, p.givre); } });                                               // souffle
  },
  /* --- Mouton : minuscule, comique, il ne fait peur a personne --- */
  mouton(g, f, p){
    MOMBRE(g, 12, 7, p);
    MCOUCHE(g, p.d, t => {                                                        // pattes fines
      MR(t, 7 + (f?0:1), 17, 2, 4, p.t1); MR(t, 15 - (f?1:0), 17, 2, 4, p.t1); });
    MCOUCHE(g, p.d, t => {                                                        // toison : elle domine
      MR(t, 4, 8, 16, 10, p.c3); MR(t, 5, 7, 14, 1, p.c3);
      MR(t, 4, 15, 16, 3, p.c2); MR(t, 5, 17, 14, 1, p.c1);
      for (const [x, y] of [[4,8],[7,6],[11,6],[15,7],[18,9],[3,12],[19,13],[6,17],[16,17]])
        MR(t, x, y, 3, 3, p.c3);
      for (const [x, y] of [[6,11],[10,10],[14,12],[9,15]]) MR(t, x, y, 2, 1, p.c2); });
    MCOUCHE(g, p.d, t => { MR(t, 9, 14, 6, 5, p.t1);                              // museau noir, bas
      MR(t, 10, 13, 4, 1, p.t2); MR(t, 10, 18, 4, 1, p.t2);
      MP(t, 10, 15, p.oeil); MP(t, 13, 15, p.oeil);
      MP(t, 8, 14, p.t2); MP(t, 15, 14, p.t2); });                                // oreilles
  },
  /* --- Loup de givre : quadrupede bas, museau en avant, regard qui brille --- */
  loup(g, f, p){
    MOMBRE(g, 12, 8, p);
    MCOUCHE(g, p.d, t => { for (const x of [5, 9, 14, 18]) MR(t, x, 16, 2, 5, p.c1);
      MR(t, 5 + (f?0:1), 16, 2, 5, p.c1); MR(t, 18 - (f?1:0), 16, 2, 5, p.c1); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 5, 9, 15, 8, p);                             // dos
      MR(t, 6, 9, 13, 1, p.c3);
      for (let i = 6; i < 19; i += 3) MP(t, i, 11, p.c3);                         // echine
      MR(t, 3, 10, 3, 2, p.c2); MP(t, 2, 9, p.c2); MP(t, 1, 8, p.c1); });         // queue
    MCOUCHE(g, p.d, t => { MR(t, 14, 4, 8, 8, p.c2); MR(t, 15, 4, 6, 1, p.c3);    // crane
      for (let i = 0; i < 4; i++) MR(t, 20 + i, 8 + i, 3 - i, 3, p.c1);           // museau effile
      MR(t, 21, 10, 2, 1, p.d);
      MR(t, 14, 2, 3, 3, p.c2); MR(t, 15, 1, 2, 2, p.c2); MP(t, 16, 1, p.c3);     // oreilles triangulaires
      MR(t, 18, 2, 3, 3, p.c2); MR(t, 18, 1, 2, 2, p.c2); MP(t, 18, 1, p.c3);
      MP(t, 15, 3, p.d); MP(t, 19, 3, p.d);
      MR(t, 15, 7, 2, 2, p.oeil); MR(t, 19, 7, 2, 2, p.oeil);
      MP(t, 15, 7, p.lueur); MP(t, 19, 7, p.lueur);
      MR(t, 16, 11, 5, 1, p.c1); });
  },
  /* --- Acolyte : capuche, aucune jambe visible, mains qui rougeoient --- */
  acolyte(g, f, p){
    MOMBRE(g, 12, 6, p);
    MCOUCHE(g, p.d, t => {                                                        // robe evasee
      for (let j = 0; j < 12; j++){ const w = 5 + Math.floor(j * .75);
        MCORPS(t, 12 - (w >> 1), 9 + j, w, 1, p); }
      MR(t, 7, 20, 10, 1, p.c1);
      for (let i = 8; i < 17; i += 3) MP(t, i + (f?1:0), 20, p.d); });             // ourlet
    MCOUCHE(g, p.d, t => { MR(t, 8, 3, 8, 8, p.c1); MR(t, 9, 2, 6, 2, p.c2);      // capuche
      MR(t, 9, 5, 6, 5, p.d); MR(t, 10, 7, 2, 2, p.lueur); MR(t, 13, 7, 2, 2, p.lueur); });
    MCOUCHE(g, p.d, t => { MR(t, 5, 12 + (f?0:1), 3, 3, p.c2); MR(t, 16, 12 + (f?1:0), 3, 3, p.c2);
      MP(t, 6, 13 + (f?0:1), p.lueur); MP(t, 17, 13 + (f?1:0), p.lueur); });      // mains
  },
  /* --- Fantassin : casque a fente, bouclier rond, epee levee --- */
  fantassin(g, f, p){
    MOMBRE(g, 12, 7, p);
    MCOUCHE(g, p.d, t => { MR(t, 9 - (f?1:0), 17, 3, 4, p.c1); MR(t, 13 + (f?0:1), 17, 3, 4, p.c1);
      MR(t, 9 - (f?1:0), 20, 3, 1, p.d); MR(t, 13 + (f?0:1), 20, 3, 1, p.d); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 8, 10, 9, 8, p);                             // tabard
      MR(t, 11, 10, 3, 8, p.t1); MR(t, 11, 10, 1, 8, p.t2);
      MR(t, 8, 10, 9, 1, p.metal); MR(t, 8, 13, 9, 1, p.c3); });
    MCOUCHE(g, p.d, t => { MR(t, 9, 3, 7, 7, p.metal); MR(t, 10, 2, 5, 2, p.metalC);
      MR(t, 10, 6, 5, 2, p.d); MP(t, 11, 6, p.oeil); MP(t, 13, 6, p.oeil);        // fente
      MR(t, 12, 0, 1, 2, p.t1); MP(t, 11, 0, p.t1); });                           // plumet
    MCOUCHE(g, p.d, t => { MR(t, 4, 11, 5, 7, p.metal); MR(t, 5, 12, 3, 5, p.t1); // bouclier
      MR(t, 5, 11, 3, 1, p.metalC); MP(t, 6, 14, p.metalC); });
    MCOUCHE(g, p.d, t => { MR(t, 18, 4 - (f?1:0), 2, 10, p.metalC);               // epee
      MR(t, 18, 3 - (f?1:0), 2, 1, p.metal); MR(t, 17, 13 - (f?1:0), 4, 2, p.t2); });
  },
  /* --- Golem de boue : masse, bras enormes, fissures qui rougeoient --- */
  golem(g, f, p){
    MOMBRE(g, 12, 10, p);
    MCOUCHE(g, p.d, t => { MR(t, 6, 17, 5, 4, p.c1); MR(t, 13, 17, 5, 4, p.c1);
      MR(t, 6, 20, 5, 1, p.d); MR(t, 13, 20, 5, 1, p.d); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 5, 6, 14, 12, p);
      for (const [x, y, w] of [[7,9,3],[13,8,4],[9,14,5],[15,13,2]]){             // bosses
        MR(t, x, y, w, 2, p.c3); MR(t, x, y + 2, w, 1, p.c1); }
      MR(t, 8, 11, 4, 1, p.lueur); MR(t, 13, 15, 3, 1, p.lueur);                  // fissures
      MP(t, 10, 12, p.lueur); MP(t, 14, 16, p.lueur); });
    MCOUCHE(g, p.d, t => {                                                        // bras rattaches
      const ga = 8 + (f?0:1), dr = 8 + (f?1:0);
      MR(t, 2, ga, 6, 9, p.c2); MR(t, 2, ga, 2, 9, p.c3); MR(t, 2, ga + 7, 6, 2, p.c1);
      MR(t, 16, dr, 6, 9, p.c2); MR(t, 16, dr, 2, 9, p.c3); MR(t, 16, dr + 7, 6, 2, p.c1);
      MR(t, 6, ga + 1, 3, 4, p.c2); MR(t, 15, dr + 1, 3, 4, p.c2); });             // epaules
    MCOUCHE(g, p.d, t => { MR(t, 9, 2, 6, 5, p.c2); MR(t, 10, 1, 4, 1, p.c3);     // tete
      MR(t, 10, 4, 2, 2, p.lueur); MR(t, 13, 4, 2, 2, p.lueur); });
  },
  /* --- Ombre : volante, effilochee, pas de sol --- */
  ombre(g, f, p){
    MCOUCHE(g, p.d, t => {
      for (let j = 0; j < 14; j++){ const w = 9 - Math.floor(Math.abs(j - 5) / 2);
        const dec = Math.round(Math.sin((j + (f ? 2 : 0)) / 3) * 1.4);
        MCORPS(t, 12 - (w >> 1) + dec, 4 + j, w, 1, p); }
      for (let i = 0; i < 4; i++) MP(t, 9 + i * 2 + (f?1:0), 18 + (i % 2), p.c1); });
    MCOUCHE(g, p.d, t => { MR(t, 8, 2, 8, 6, p.c1); MR(t, 9, 1, 6, 2, p.c2);      // capuche
      MR(t, 9, 4, 6, 4, p.d);
      MR(t, 10, 5, 2, 2, p.lueur); MR(t, 13, 5, 2, 2, p.lueur);
      MP(t, 10, 5, p.lueurC); MP(t, 14, 5, p.lueurC); });
    MCOUCHE(g, p.d, t => { MR(t, 3, 8 + (f?1:0), 5, 2, p.c2); MP(t, 2, 9 + (f?1:0), p.c1);
      MR(t, 16, 8 + (f?0:1), 5, 2, p.c2); MP(t, 21, 9 + (f?0:1), p.c1); });       // bras
  },
  /* --- Troll : voute, defenses, gourdin --- */
  troll(g, f, p){
    MOMBRE(g, 12, 9, p);
    MCOUCHE(g, p.d, t => { MR(t, 7 - (f?1:0), 16, 4, 5, p.c1); MR(t, 13 + (f?0:1), 16, 4, 5, p.c1);
      MR(t, 7 - (f?1:0), 20, 4, 1, p.d); MR(t, 13 + (f?0:1), 20, 4, 1, p.d); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 6, 7, 12, 10, p);
      MR(t, 8, 10, 8, 1, p.c1); MR(t, 8, 13, 8, 1, p.c1);                         // cotes
      MR(t, 7, 7, 10, 1, p.c3); });
    MCOUCHE(g, p.d, t => { MR(t, 2, 8 + (f?1:0), 4, 8, p.c2); MR(t, 2, 8 + (f?1:0), 2, 8, p.c3);
      MR(t, 18, 6 + (f?0:1), 4, 8, p.c2); MR(t, 18, 6 + (f?0:1), 2, 8, p.c3); });
    MCOUCHE(g, p.d, t => { MR(t, 8, 2, 8, 6, p.c2); MR(t, 9, 1, 6, 1, p.c3);      // tete
      MR(t, 9, 4, 2, 2, p.oeil); MR(t, 13, 4, 2, 2, p.oeil);
      MP(t, 9, 4, p.lueur); MP(t, 14, 4, p.lueur);
      MR(t, 9, 7, 6, 1, p.d);
      MP(t, 9, 6, p.os); MP(t, 9, 5, p.os); MP(t, 14, 6, p.os); MP(t, 14, 5, p.os); }); // defenses
    MCOUCHE(g, p.d, t => { MR(t, 19, 1 + (f?0:1), 4, 6, p.bois);                  // gourdin
      MR(t, 20, 6 + (f?0:1), 2, 8, p.bois2); MP(t, 19, 2 + (f?0:1), p.c3); });
  },
  /* --- Demolisseur : chariot de siege pousse par un sapeur --- */
  demolisseur(g, f, p){
    MOMBRE(g, 12, 8, p);
    MCOUCHE(g, p.d, t => {                                                      // roues
      for (const cx of [7, 17]){
        for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++){
          const d = Math.hypot(x, y); if (d > 3.3) continue;
          MP(t, cx + x, 17 + y, d > 2 ? p.c1 : p.d);
        }
        for (let k = 0; k < 4; k++){                                            // rayons tournants
          const a = k * Math.PI / 2 + (f ? 0.8 : 0);
          MP(t, cx + Math.cos(a) * 2, 17 + Math.sin(a) * 2, p.c3);
        }
        MP(t, cx, 17, p.c3);
      } });
    MCOUCHE(g, p.d, t => { MCORPS(t, 4, 10, 16, 6, p);                          // chassis
      MR(t, 5, 10, 14, 1, p.c3); MR(t, 5, 15, 14, 1, p.c1);
      for (let i = 6; i < 19; i += 4) MR(t, i, 11, 1, 4, p.c1); });
    MCOUCHE(g, p.d, t => { MR(t, 1, 11, 5, 4, p.metal); MR(t, 1, 11, 5, 1, p.metalC);
      MR(t, 0, 12, 2, 2, p.metalC); });                                          // belier
    MCOUCHE(g, p.d, t => { MR(t, 19, 5 + (f?0:1), 4, 6, p.t1);                   // sapeur
      MR(t, 20, 4 + (f?0:1), 2, 2, p.t2); MP(t, 20, 5 + (f?0:1), p.oeil); });
  },
  /* --- Char a vapeur : blindage, chenilles, cheminee --- */
  char(g, f, p){
    MOMBRE(g, 12, 10, p);
    MCOUCHE(g, p.d, t => { MR(t, 2, 16, 20, 5, p.c1);                            // chenilles
      for (let i = 2; i < 22; i += 3) MR(t, i + (f?1:0), 16, 2, 5, p.c2);
      MR(t, 2, 16, 20, 1, p.c3); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 3, 7, 18, 9, p);                            // caisse
      MR(t, 4, 7, 16, 1, p.c3);
      MR(t, 4, 10, 16, 1, p.c1); MR(t, 4, 13, 16, 1, p.c1);
      for (let i = 5; i < 20; i += 4){ MP(t, i, 8, p.metalC); MP(t, i, 15, p.metal); } });
    MCOUCHE(g, p.d, t => { MR(t, 0, 9, 4, 5, p.metal); MR(t, 0, 9, 4, 1, p.metalC);
      MR(t, 0, 11, 3, 1, p.lueur); });                                           // soc avant
    MCOUCHE(g, p.d, t => { MR(t, 15, 2, 4, 6, p.metal); MR(t, 15, 2, 4, 1, p.metalC);
      MR(t, 16, 0, 2, 2, p.c3); MP(t, 15, 1, p.c2); MP(t, 18, 0 + (f?1:0), p.c2); });
    MCOUCHE(g, p.d, t => { MR(t, 6, 4, 6, 4, p.c2); MR(t, 7, 3, 4, 1, p.c3);     // tourelle
      MR(t, 7, 5, 2, 2, p.lueur); });
  },
  /* --- Broyeur gobelin : la scie qui tourne --- */
  broyeur(g, f, p){
    MOMBRE(g, 13, 9, p);
    MCOUCHE(g, p.d, t => { MR(t, 8, 15, 4, 6, p.c1); MR(t, 15, 15, 4, 6, p.c1);  // pattes
      MR(t, 8, 20, 4, 1, p.d); MR(t, 15, 20, 4, 1, p.d); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 7, 6, 13, 10, p);                           // carcasse
      MR(t, 8, 6, 11, 1, p.c3); MR(t, 8, 11, 11, 1, p.c1);
      MR(t, 9, 8, 3, 2, p.lueur); MR(t, 14, 8, 3, 2, p.lueur); });
    MCOUCHE(g, p.d, t => { MR(t, 18, 3, 3, 5, p.metal); MP(t, 19, 2, p.c3);      // cheminee
      MP(t, 19, 1 - (f?1:0), p.c2); });
    MCOUCHE(g, p.d, t => {                                                       // scie circulaire
      const R = 6;
      for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++){
        const d = Math.hypot(x, y); if (d > R + .3) continue;
        MP(t, 4 + x, 11 + y, d > R - 1.6 ? p.metalC : (d < 1.6 ? p.metal : p.d));
      }
      for (let k = 0; k < 8; k++){                                               // dents
        const a = k * Math.PI / 4 + (f ? Math.PI / 8 : 0);
        MP(t, 4 + Math.cos(a) * (R + .6), 11 + Math.sin(a) * (R + .6), p.metalC);
      }
      for (let k = 0; k < 4; k++){
        const a = k * Math.PI / 2 + (f ? 0.7 : 0);
        MP(t, 4 + Math.cos(a) * 3, 11 + Math.sin(a) * 3, p.metal);
      } });
  },
  /* --- Infernal : masse de roche en fusion, cornes, fissures ardentes --- */
  infernal(g, f, p){
    MOMBRE(g, 12, 11, p);
    MCOUCHE(g, p.d, t => { MR(t, 5, 17, 6, 4, p.c1); MR(t, 13, 17, 6, 4, p.c1);
      MR(t, 5, 20, 6, 1, p.d); MR(t, 13, 20, 6, 1, p.d);
      MR(t, 6, 18, 4, 1, p.lueur); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 4, 6, 16, 11, p);                          // torse
      for (const [x, y, w] of [[6,8,4],[13,7,4],[8,13,6],[15,12,3]]){           // blocs de roche
        MR(t, x, y, w, 3, p.c3); MR(t, x, y + 3, w, 1, p.c1); }
      MR(t, 7, 11, 6, 1, p.lueur); MR(t, 12, 14, 4, 1, p.lueur);                // fissures
      MR(t, 9, 9, 2, 1, p.lueurC); MP(t, 15, 15, p.lueur); });
    MCOUCHE(g, p.d, t => {                                                       // bras enormes
      const ga = 7 + (f?0:1), dr = 7 + (f?1:0);
      MR(t, 0, ga, 6, 10, p.c2); MR(t, 0, ga, 2, 10, p.c3); MR(t, 0, ga + 8, 6, 2, p.c1);
      MR(t, 18, dr, 6, 10, p.c2); MR(t, 18, dr, 2, 10, p.c3); MR(t, 18, dr + 8, 6, 2, p.c1);
      MP(t, 2, ga + 4, p.lueur); MP(t, 21, dr + 4, p.lueur); });
    MCOUCHE(g, p.d, t => { MR(t, 8, 1, 8, 6, p.c2); MR(t, 9, 0, 6, 1, p.c3);    // tete
      MR(t, 9, 3, 3, 2, p.lueurC); MR(t, 13, 3, 3, 2, p.lueurC);
      MR(t, 10, 6, 4, 1, p.lueur);
      for (const [dx, dy] of [[7,0],[6,-1],[6,-2],[16,0],[17,-1],[17,-2]]) MP(t, dx, dy + 1, p.c1); });
  },
  /* --- Spectre de givre : decharne, arete de glace, marche --- */
  spectre(g, f, p){
    MOMBRE(g, 12, 7, p);
    MCOUCHE(g, p.d, t => { MR(t, 9 - (f?1:0), 17, 2, 4, p.c1); MR(t, 14 + (f?0:1), 17, 2, 4, p.c1); });
    MCOUCHE(g, p.d, t => {                                                       // corps effile
      for (let j = 0; j < 12; j++){ const w = 8 - Math.abs(j - 4) / 2 | 0;
        MCORPS(t, 12 - (w >> 1), 6 + j, w, 1, p); }
      MR(t, 8, 10, 8, 1, p.c1); MR(t, 9, 13, 6, 1, p.c1);
      MR(t, 11, 8, 2, 6, p.lueur); MP(t, 12, 9, p.lueurC); });
    MCOUCHE(g, p.d, t => {                                                       // aretes de glace
      for (const [x, y, h] of [[6,7,4],[17,8,3],[7,13,3],[16,13,2]]){
        for (let k = 0; k < h; k++) MP(t, x + (k % 2), y - k, k > h - 2 ? p.lueurC : p.lueur); } });
    MCOUCHE(g, p.d, t => { MR(t, 9, 1, 6, 5, p.c2); MR(t, 10, 0, 4, 1, p.c3);   // crane
      MR(t, 10, 3, 5, 2, p.d);
      MR(t, 10, 3, 2, 2, p.lueurC); MR(t, 13, 3, 2, 2, p.lueurC);
      MP(t, 8, 2, p.c1); MP(t, 15, 2, p.c1); });
    MCOUCHE(g, p.d, t => { MR(t, 4, 9 + (f?1:0), 5, 2, p.c2); MP(t, 3, 10 + (f?1:0), p.lueur);
      MR(t, 15, 9 + (f?0:1), 5, 2, p.c2); MP(t, 20, 10 + (f?0:1), p.lueur); });
  },
  /* --- Wyrm de givre : ailes deployees, long cou, volant --- */
  wyrm(g, f, p){
    MCOUCHE(g, p.d, t => {                                                       // ailes
      const b = f ? 0 : 2;
      for (let k = 0; k < 8; k++){
        const h = Math.round(k * 0.7);
        MR(t, 6 - k, 8 - h + b, 1, 3 + h, p.c2);
        MR(t, 17 + k, 8 - h + b, 1, 3 + h, p.c2);
        if (k % 2 === 0){ MP(t, 6 - k, 8 - h + b, p.c3); MP(t, 17 + k, 8 - h + b, p.c3); }
      } });
    MCOUCHE(g, p.d, t => { MCORPS(t, 7, 8, 10, 7, p);                            // corps
      MR(t, 8, 8, 8, 1, p.c3); MR(t, 8, 14, 8, 1, p.c1);
      for (let i = 8; i < 16; i += 3) MP(t, i, 11, p.lueur); });
    MCOUCHE(g, p.d, t => {                                                        // queue
      for (let k = 0; k < 6; k++) MR(t, 11 + (f?1:0), 15 + k, 2 - (k > 3 ? 1 : 0), 1, p.c1);
      MP(t, 11, 21, p.c2); });
    MCOUCHE(g, p.d, t => { MR(t, 10, 3, 4, 5, p.c2);                              // cou et tete
      MR(t, 9, 1, 7, 3, p.c2); MR(t, 10, 1, 5, 1, p.c3);
      MR(t, 15, 2, 4, 2, p.c1); MP(t, 19, 3, p.d);
      MR(t, 10, 2, 2, 1, p.lueurC); MP(t, 14, 2, p.lueurC);
      MP(t, 9, 0, p.c1); MP(t, 12, 0, p.c1);                                      // cornes
      MP(t, 16, 4, p.lueur); MP(t, 17, 4, p.lueur); });
  },
  /* --- Elementaire d'eau : masse translucide, noyau, crete --- */
  elementaire(g, f, p){
    MOMBRE(g, 12, 10, p);
    MCOUCHE(g, p.d, t => {                                                        // masse ondulante
      for (let j = 0; j < 16; j++){
        const w = 14 - Math.abs(j - 9) - (j < 4 ? (4 - j) * 2 : 0);
        const dec = Math.round(Math.sin((j + (f ? 2 : 0)) / 3.5) * 1.4);
        MCORPS(t, 12 - (w >> 1) + dec, 5 + j, Math.max(3, w), 1, p);
      }
      for (let j = 6; j < 19; j += 4) MR(t, 7, j, 9, 1, p.c1); });
    MCOUCHE(g, p.d, t => {                                                        // crete d'ecume
      const b = f ? 0 : 1;
      MR(t, 6, 3 + b, 3, 2, p.c3); MR(t, 10, 2 + b, 4, 2, p.c3); MR(t, 15, 3 + b, 3, 2, p.c3);
      MP(t, 11, 1 + b, p.lueurC); MP(t, 16, 2 + b, p.lueurC); MP(t, 7, 2 + b, p.lueurC); });
    MCOUCHE(g, p.d, t => { MR(t, 9, 9, 6, 6, p.lueur); MR(t, 10, 10, 4, 4, p.lueurC);
      MR(t, 11, 11, 2, 2, p.c3); });                                              // noyau
    MCOUCHE(g, p.d, t => { MR(t, 9, 7, 2, 2, p.d); MR(t, 13, 7, 2, 2, p.d);
      MP(t, 9, 7, p.lueurC); MP(t, 14, 7, p.lueurC); });                          // yeux
  },
  /* --- Loup d'ombre : le loup, en plus grand et plus noir --- */
  loupOmbre(g, f, p){
    MOMBRE(g, 12, 10, p);
    MCOUCHE(g, p.d, t => { for (const x of [3, 8, 14, 19]) MR(t, x, 15, 3, 6, p.c1);
      MR(t, 3 + (f?0:1), 15, 3, 6, p.c1); MR(t, 19 - (f?1:0), 15, 3, 6, p.c1);
      for (const x of [3, 8, 14, 19]) MR(t, x, 20, 3, 1, p.d); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 3, 7, 18, 9, p);
      MR(t, 4, 7, 16, 1, p.c3);
      for (let i = 5; i < 20; i += 3) MR(t, i, 5 + (i % 2), 2, 3, p.c2);          // echine hirsute
      MR(t, 1, 8, 3, 2, p.c2); MP(t, 0, 7, p.c1); MP(t, 0, 6 - (f?1:0), p.c2); });
    MCOUCHE(g, p.d, t => { MR(t, 14, 2, 9, 9, p.c2); MR(t, 15, 2, 7, 1, p.c3);   // tete
      for (let k = 0; k < 5; k++) MR(t, 21 + k, 7 + k, 4 - k, 3, p.c1);
      MR(t, 22, 9, 3, 1, p.d);
      MR(t, 14, 0, 3, 3, p.c2); MP(t, 15, 0, p.c3);
      MR(t, 19, 0, 3, 3, p.c2); MP(t, 20, 0, p.c3);
      MR(t, 15, 5, 3, 3, p.lueur); MR(t, 19, 5, 3, 3, p.lueur);
      MP(t, 16, 6, p.lueurC); MP(t, 20, 6, p.lueurC);
      MR(t, 16, 10, 6, 1, p.c1); });
  },
  /* --- Seigneur bandit : le sacrifice. Massif, cornu, lame demesuree --- */
  seigneur(g, f, p){
    MOMBRE(g, 12, 11, p);
    MCOUCHE(g, p.d, t => { MR(t, 5, 16, 5, 5, p.c1); MR(t, 14, 16, 5, 5, p.c1);
      MR(t, 5, 20, 5, 1, p.d); MR(t, 14, 20, 5, 1, p.d);
      MR(t, 5, 16, 5, 1, p.c2); MR(t, 14, 16, 5, 1, p.c2); });
    MCOUCHE(g, p.d, t => { MCORPS(t, 4, 7, 16, 10, p);                          // torse
      MR(t, 5, 7, 14, 1, p.c3);
      MR(t, 8, 9, 8, 5, p.metal); MR(t, 8, 9, 8, 1, p.metalC);                  // plastron
      MR(t, 10, 11, 4, 2, p.lueur); MP(t, 11, 11, p.lueurC);
      MR(t, 4, 14, 16, 1, p.c1); });
    MCOUCHE(g, p.d, t => {                                                       // epaulieres
      MR(t, 1, 6 + (f?0:1), 5, 5, p.metal); MR(t, 1, 6 + (f?0:1), 5, 1, p.metalC);
      MR(t, 18, 6 + (f?1:0), 5, 5, p.metal); MR(t, 18, 6 + (f?1:0), 5, 1, p.metalC);
      MP(t, 2, 5 + (f?0:1), p.os); MP(t, 21, 5 + (f?1:0), p.os); });
    MCOUCHE(g, p.d, t => { MR(t, 8, 1, 8, 6, p.c2); MR(t, 9, 0, 6, 1, p.c3);    // casque
      MR(t, 9, 3, 6, 3, p.d);
      MR(t, 10, 4, 2, 2, p.lueur); MR(t, 13, 4, 2, 2, p.lueur);
      MP(t, 10, 4, p.lueurC); MP(t, 14, 4, p.lueurC);
      for (const [dx, dy] of [[7,0],[6,-1],[6,-2],[16,0],[17,-1],[17,-2]]) MP(t, dx, dy + 1, p.os); });
    MCOUCHE(g, p.d, t => {                                                       // lame demesuree
      const dy = f ? 0 : 1;
      MR(t, 21, 2 + dy, 3, 13, p.metalC); MR(t, 22, 2 + dy, 1, 13, p.metal);
      MR(t, 21, 1 + dy, 3, 1, p.metalC); MP(t, 22, 0 + dy, p.metalC);
      MR(t, 20, 14 + dy, 5, 2, p.os); MR(t, 22, 15 + dy, 1, 3, p.c1); });
  },
  /* --- Banshee : volante, voile en lambeaux, bras ouverts --- */
  banshee(g, f, p){
    MCOUCHE(g, p.d, t => {
      for (let j = 0; j < 15; j++){ const w = 10 - Math.floor(Math.abs(j - 4) / 1.7);
        const dec = Math.round(Math.sin((j + (f ? 3 : 0)) / 3.5) * 1.8);
        MCORPS(t, 12 - (w >> 1) + dec, 4 + j, Math.max(2, w), 1, p); }
      for (let i = 0; i < 5; i++) MP(t, 8 + i * 2, 18 + ((i + (f?1:0)) % 3), p.c1); });
    MCOUCHE(g, p.d, t => { MR(t, 9, 2, 6, 6, p.c2); MR(t, 10, 1, 4, 1, p.c3);     // visage
      MR(t, 10, 4, 4, 3, p.d);
      MR(t, 10, 4, 2, 2, p.lueurC); MR(t, 13, 4, 2, 2, p.lueurC);
      MP(t, 12, 7, p.lueur);                                                       // bouche
      MP(t, 8, 1, p.c1); MP(t, 15, 1, p.c1); MP(t, 7, 3, p.c1); MP(t, 16, 3, p.c1); });
    MCOUCHE(g, p.d, t => { MR(t, 2, 7 + (f?1:0), 6, 2, p.c2); MP(t, 1, 8 + (f?1:0), p.lueur);
      MR(t, 16, 7 + (f?0:1), 6, 2, p.c2); MP(t, 22, 8 + (f?0:1), p.lueur);
      MP(t, 3, 9 + (f?1:0), p.c1); MP(t, 20, 9 + (f?0:1), p.c1); });              // bras
  }
};

const PAL_MONSTRES = {
  squelette:{d:'#101014', c1:'#8f8b7a', c2:'#c2bda6', c3:'#e6e2cc', oeil:'#7dff86',
            lueur:'#7dff86', metal:'#6b6f78', sol:'#1e1e26'},
  grognard:{d:'#0f1410', c1:'#3d5c2e', c2:'#5c8442', c3:'#7ba659', oeil:'#ffd76a',
            metal:'#7d8496', metalC:'#c2c8d6', t1:'#8a3020', t2:'#5c1e12', sol:'#1f2a1c'},
  centaure:{d:'#140f0c', c1:'#5c3a22', c2:'#82552f', c3:'#a87445', oeil:'#ffd76a',
            peau:'#c08a5a', crin:'#2e1c10', metal:'#8a8f9c', sol:'#2a1c14'},
  colosse: {d:'#0e1216', c1:'#39434c', c2:'#556270', c3:'#758494', lueur:'#6fe0ff',
            mousse:'#3f6b46', sol:'#1c222a'},
  taureau: {d:'#140e0a', c1:'#4a2f1c', c2:'#6e4728', c3:'#93643c', oeil:'#ff6a3a',
            corne:'#ddd3b4', anneau:'#c8a33c', sol:'#281a10'},
  wendigo: {d:'#0c1014', c1:'#4c5560', c2:'#6d7885', c3:'#93a0ad', oeil:'#a8f0ff',
            corne:'#d8d2c0', givre:'#c8f0ff', sol:'#1a2028'},
  mouton:  {d:'#141018', c1:'#a8a2ae', c2:'#d8d4dc', c3:'#f2f0f4', t1:'#3a3440', t2:'#544c5c', oeil:'#f2f0f4', sol:'#2a2434'},
  loup:    {d:'#0d1218', c1:'#3a5570', c2:'#557a99', c3:'#7ea6c0', oeil:'#0d1218', lueur:'#8fe8ff', sol:'#1d2836'},
  acolyte: {d:'#120e1a', c1:'#382a52', c2:'#523c73', c3:'#6f5696', lueur:'#b98cff', sol:'#241c34'},
  fantassin:{d:'#12111a', c1:'#2c4a86', c2:'#3d68b8', c3:'#5b8ad8', t1:'#c8a33c', t2:'#8a6f22',
             metal:'#7d8496', metalC:'#c2c8d6', oeil:'#ffd76a', sol:'#242336'},
  golem:   {d:'#140f0a', c1:'#4a3520', c2:'#6b4d2e', c3:'#8f6c44', lueur:'#ff9c3a', sol:'#2a2016'},
  ombre:   {d:'#0c0a14', c1:'#2a2140', c2:'#3f3160', c3:'#584585', lueur:'#a678ff', lueurC:'#e0c8ff', sol:'#1a1526'},
  troll:   {d:'#0d1410', c1:'#2f5238', c2:'#437a4e', c3:'#5c9668', oeil:'#141a14', lueur:'#ffe07a',
            os:'#e8e2c8', bois:'#5c4028', bois2:'#3f2c1c', sol:'#1c2a1e'},
  demolisseur:{d:'#140f0c', c1:'#4a3520', c2:'#6b4d2e', c3:'#8f6c44',
               metal:'#7d7a72', metalC:'#b8b4a8', t1:'#5c6b3a', t2:'#7d8a4e',
               oeil:'#e8d060', sol:'#2a2016'},
  char:      {d:'#101418', c1:'#33404a', c2:'#4a5b68', c3:'#6b8090',
               metal:'#7d8694', metalC:'#c0c8d4', lueur:'#ff9c3a', sol:'#1d262e'},
  broyeur:   {d:'#12130c', c1:'#3f4a26', c2:'#5c6b33', c3:'#7d8f46',
               metal:'#6b6f78', metalC:'#c8ccd6', lueur:'#ffcf3a', sol:'#232616'},
  infernal:{d:'#160c08', c1:'#3d1e12', c2:'#5c2e18', c3:'#7d4522',
            lueur:'#ff7a1a', lueurC:'#ffd07a', sol:'#2a1408'},
  spectre: {d:'#0b1218', c1:'#25404f', c2:'#356075', c3:'#4d8199',
            lueur:'#8fe0ff', lueurC:'#e0f8ff', sol:'#18262e'},
  wyrm:    {d:'#0c1620', c1:'#264257', c2:'#376379', c3:'#4f8ba3',
            lueur:'#a0e8ff', lueurC:'#e8faff', sol:'#182632'},
  elementaire:{d:'#08151c', c1:'#1d5570', c2:'#2b7a9c', c3:'#45a3c4',
            lueur:'#6fd8f5', lueurC:'#d0f6ff', sol:'#0f2a36'},
  loupOmbre:{d:'#0a0810', c1:'#221c33', c2:'#332a4a', c3:'#4a3d66',
            lueur:'#a86aff', lueurC:'#e2c4ff', sol:'#160f22'},
  seigneur:{d:'#140a12', c1:'#3d1f30', c2:'#5c2f44', c3:'#7d4258',
            metal:'#5c5560', metalC:'#a89fb0', os:'#e2d8c0',
            lueur:'#ff4a5a', lueurC:'#ffb0b8', sol:'#2a1420'},
  banshee: {d:'#0a1416', c1:'#1f4a4e', c2:'#2f6f72', c3:'#4a9a9a', lueur:'#7ffff0', lueurC:'#d4fffa', sol:'#16282a'}
};

function dessinerMonstre(cle, image){
  const p = PAL_MONSTRES[cle], fn = MONSTRES_ART[cle];
  const g = MG();
  if (fn) fn(g, image, p);
  return g;
}
