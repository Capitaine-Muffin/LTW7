/* Toutes les valeurs de jeu vivent ici. Aucune constante de gameplay ailleurs.
   Les chiffres viennent de data/ltw7-catalogue.json, extrait de la map. */

const CASE = 128;          // unites Warcraft par case : sert a convertir les portees
const PAS_MS = 100;        // duree d'un pas de simulation
const MILLI = 1000;        // 1 case = 1000 milli-cases (virgule fixe, jamais de flottant)

const portee = u => Math.round(u * MILLI / CASE);        // unites WC3 -> milli-cases
const cadence = parMin => Math.max(1, Math.round(600 / parMin)); // tirs/min -> pas entre deux tirs
const vitesse = v => Math.round(v * 100 / CASE);         // unites/s -> milli-cases par pas

const BRANCHES = {
  feu:     {nom:'Feu',      elementaire:'barbecue',   feuilles:['boom','meteore']},
  froid:   {nom:'Froid',    elementaire:'glacier',    feuilles:['eauUltime','glaceUltime']},
  foudre:  {nom:'Foudre',   elementaire:'courtCircuit',feuilles:['generateur','condensateur']},
  tenebres:{nom:'Ténèbres', elementaire:'cloaque',    feuilles:['mort','fosse']},
  lumiere: {nom:'Lumière',  elementaire:'oiseau',     feuilles:['champignon','teleporteur']}
};

/* Tours. `vers` = les ameliorations proposees quand on appuie dessus. */
const TOURS = {
  //                       or    pv   deg  portee        cadence      vers
  guet:      {nom:'Guet',      or:10,  pv:100, deg:10,  p:portee(500), c:cadence(60),  vers:['pitie']},
  epine:     {nom:'Épine',     or:10,  pv:250, deg:20,  p:portee(150), c:cadence(60),  vers:['sang']},
  pitie:     {nom:'Pitié',     or:30,  pv:150, deg:17,  p:portee(600), c:cadence(100), vers:['canon','socle']},
  sang:      {nom:'Sang',      or:30,  pv:350, deg:35,  p:portee(150), c:cadence(100), vers:['broyeur','lame']},
  canon:     {nom:'Canon',     or:120, pv:200, deg:80,  p:portee(600), c:cadence(30),  zone:portee(90), vers:['ELEM']},
  socle:     {nom:'Socle',     or:120, pv:200, deg:25,  p:portee(700), c:cadence(200), vers:['ELEM']},
  broyeur:   {nom:'Broyeur',   or:120, pv:200, deg:160, p:portee(150), c:cadence(12),  zone:portee(120), vers:['ELEM']},
  lame:      {nom:'Lame',      or:120, pv:200, deg:50,  p:portee(150), c:cadence(200), vers:['ELEM']},
  elementaire:{nom:'Élémentaire',or:200,pv:250, deg:75,  p:portee(700), c:cadence(60),  vers:['ELEM']},

  /* Les cinq elementaires coutent 0 or : c'est le "premier upgrade gratuit". */
  barbecue:    {nom:'Brasier',   branche:'feu',      or:0, pv:300, deg:100,p:portee(300), c:cadence(30), zone:portee(80), vers:['puits']},
  glacier:     {nom:'Glacier',   branche:'froid',    or:0, pv:300, deg:75, p:portee(700), c:cadence(60), ralentit:35, vers:['eauBenite']},
  courtCircuit:{nom:'Arc',       branche:'foudre',   or:0, pv:300, deg:100,p:portee(300), c:cadence(60), vers:['canonElec']},
  cloaque:     {nom:'Cloaque',   branche:'tenebres', or:0, pv:300, deg:60, p:portee(700), c:cadence(60), poison:40, ralentit:25, vers:['damne']},
  oiseau:      {nom:'Rapace',    branche:'lumiere',  or:0, pv:300, deg:250,p:portee(500), c:cadence(24), vers:['lanterne']},

  puits:     {nom:'Puits de magma', or:800, pv:1000, deg:250, p:portee(500), c:cadence(90),  zone:portee(80), etourdit:8,  vers:['boom','meteore']},
  eauBenite: {nom:'Eau bénite',     or:800, pv:1000, deg:300, p:portee(700), c:cadence(60),  vers:['eauUltime','glaceUltime']},
  canonElec: {nom:'Canon électrique',or:800,pv:1000, deg:150, p:portee(500), c:cadence(120), etourdit:5,  vers:['generateur','condensateur']},
  damne:     {nom:'Tour damnée',    or:800, pv:1000, deg:250, p:portee(700), c:cadence(60),  vers:['mort','fosse']},
  lanterne:  {nom:'Lanterne sacrée',or:800, pv:1000, deg:300, p:portee(600), c:cadence(60),  vers:['champignon','teleporteur']},

  boom:        {nom:'Tour BOUM',    or:300, pv:5000, deg:1000,p:portee(150), c:cadence(60), zone:portee(220), usageUnique:true},
  meteore:     {nom:'Attracteur',   or:4000,pv:3000, deg:1000,p:portee(1000),c:cadence(20), zone:portee(200)},
  eauUltime:   {nom:'Eau ultime',   or:3000,pv:2000, deg:600, p:portee(700), c:cadence(60), zone:portee(70)},
  glaceUltime: {nom:'Glace ultime', or:4000,pv:2500, deg:200, p:portee(700), c:cadence(60), zone:portee(150), ralentit:40},
  generateur:  {nom:'Générateur',   or:4000,pv:2500, deg:250, p:portee(700), c:cadence(300)},
  condensateur:{nom:'Condensateur', or:3000,pv:1500, degPct:20,p:portee(500),c:cadence(12)},
  mort:        {nom:'La Mort',      or:300, pv:5000, degPct:100,p:portee(700),c:cadence(60), usageUnique:true},
  fosse:       {nom:'Fosse septique',or:4000,pv:3000,deg:350, p:portee(700), c:cadence(30), zone:portee(70), poison:60},
  champignon:  {nom:'Champignon',   or:4000,pv:1800, deg:500, p:portee(700), c:cadence(30), zone:portee(150)},
  teleporteur: {nom:'Téléporteur',  or:4000,pv:2500, deg:0,   p:portee(700), c:cadence(2),  teleporte:true}
};

/* Monstres envoyables. Le ratio revenu/or decroit strictement : c'est le
   levier de reglage numero un du jeu. */
const MONSTRES = {
  mouton:  {nom:'Mouton',   or:5,   revenu:1,  pv:5,     v:vitesse(270)},
  loup:    {nom:'Loup',     or:10,  revenu:2,  pv:40,    v:vitesse(300)},
  acolyte: {nom:'Acolyte',  or:50,  revenu:8,  pv:200,   v:vitesse(270)},
  fantassin:{nom:'Fantassin',or:75, revenu:12, pv:250,   v:vitesse(370)},
  golem:   {nom:'Golem',    or:350, revenu:37, pv:1400,  v:vitesse(300)},
  ombre:   {nom:'Ombre',    or:200, revenu:22, pv:600,   v:vitesse(300), vol:true},
  troll:   {nom:'Troll',    or:5000,revenu:450,pv:5000,  v:vitesse(350)},
  banshee: {nom:'Banshee',  or:20000,revenu:1700,pv:60000,v:vitesse(300), vol:true}
};

const PROFILS = {
  BLITZ:     {nom:'Blitz',     vies:12, or:120, revenu:25, tickRevenu:40,  bois:3},
  CLASSIQUE: {nom:'Classique', vies:25, or:120, revenu:25, tickRevenu:100, bois:3}
};

const CONFIG = {
  CASE, PAS_MS, MILLI, LARGEUR:9, HAUTEUR:13,
  entree:{x:4,y:0}, exit:{x:4,y:12},
  remboursement:70,          // % rendu a la vente ; une demolition ne rend rien
  maxVivants:12,             // plafond d'unites par ligne, valeur de la map
  boisParKill:1,
  controleur:{ periode:400, deg:1000, zone:portee(200), v:vitesse(522) },
  TOURS, MONSTRES, BRANCHES, PROFILS,
  /* Ce qui est constructible d'emblee : trois entrees, tout le reste est
     une amelioration sur place. */
  boutique:['guet','epine','elementaire']
};
