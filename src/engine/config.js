/* Toutes les valeurs de jeu vivent ici. Aucune constante de gameplay ailleurs.
   Les chiffres viennent de data/ltw7-catalogue.json, extrait de la map. */

const CASE = 128;          // unites Warcraft par case : sert a convertir les portees
const PAS_MS = 100;        // duree d'un pas de simulation
const MILLI = 1000;        // 1 case = 1000 milli-cases (virgule fixe, jamais de flottant)

const portee = u => Math.round(u * MILLI / CASE);        // unites WC3 -> milli-cases
const cadence = parMin => Math.max(1, Math.round(600 / parMin)); // tirs/min -> pas entre deux tirs
const vitesse = v => Math.round(v * 100 / CASE);         // unites/s -> milli-cases par pas

/* Les quinze deblocages en bois de la map — cinq racines et dix feuilles, un
   bois chacun (`ulum:1` dans war3map.w3u). Avec trois bois au depart, on ne
   peut PAS tout ouvrir : c'est ca, le choix de debut de partie. */
const BRANCHES = {
  feu:     {nom:'Feu',      elementaire:'barbecue',   feuilles:['boom','meteore']},
  froid:   {nom:'Froid',    elementaire:'glacier',    feuilles:['eauUltime','glaceUltime']},
  foudre:  {nom:'Foudre',   elementaire:'courtCircuit',feuilles:['generateur','condensateur']},
  tenebres:{nom:'Ténèbres', elementaire:'cloaque',    feuilles:['mort','fosse']},
  lumiere: {nom:'Lumière',  elementaire:'oiseau',     feuilles:['champignon','teleporteur']}
};

/* Tours. `vers` = les ameliorations proposees quand on appuie dessus. */
/* Les rayons de zone viennent des champs d'arme de la map : `ua1f` est le
   rayon a degats PLEINS, `ua1h` le rayon a degats moyens, `ua1q` le petit —
   ils vont croissant. Notre moteur n'a qu'un rayon, on prend donc le rayon a
   degats pleins : c'est le choix conservateur. Mes valeurs precedentes etaient
   estimees et toutes trop petites (Attracteur 200 au lieu de 400, Champignon
   150 au lieu de 250). */
const TOURS = {
  //                       or    pv   deg  portee        cadence      vers
  guet:      {nom:'Guet',      or:10,  pv:100, deg:10,  p:portee(500), c:cadence(60),  vers:['pitie']},
  epine:     {nom:'Épine',     or:10,  pv:250, deg:20,  p:portee(150), c:cadence(60),  vers:['sang']},
  pitie:     {nom:'Pitié',     or:30,  pv:150, deg:17,  p:portee(600), c:cadence(100), vers:['canon','socle']},
  sang:      {nom:'Sang',      or:30,  pv:350, deg:35,  p:portee(150), c:cadence(100), vers:['broyeur','lame']},
  canon:     {nom:'Canon',     or:120, pv:200, deg:80,  p:portee(600), c:cadence(30),  zone:portee(90), vers:['ELEM']},
  socle:     {nom:'Socle',     or:120, pv:200, deg:25,  p:portee(700), c:cadence(200), vers:['ELEM']},
  broyeur:   {nom:'Broyeur',   or:120, pv:200, deg:160, p:portee(150), c:cadence(12),  zone:portee(200), vers:['ELEM']},
  lame:      {nom:'Lame',      or:120, pv:200, deg:50,  p:portee(150), c:cadence(200), vers:['ELEM']},
  elementaire:{nom:'Élémentaire',or:200,pv:250, deg:75,  p:portee(700), c:cadence(60),  vers:['ELEM']},

  /* Les cinq elementaires coutent 0 or : c'est le "premier upgrade gratuit". */
  barbecue:    {nom:'Brasier',   branche:'feu',      or:0, pv:300, deg:100,p:portee(300), c:cadence(30), zone:portee(100), vers:['puits']},
  glacier:     {nom:'Glacier',   branche:'froid',    or:0, pv:300, deg:75, p:portee(700), c:cadence(60), ralentit:35, vers:['eauBenite']},
  courtCircuit:{nom:'Arc',       branche:'foudre',   or:0, pv:300, deg:100,p:portee(300), c:cadence(60), vers:['canonElec']},
  cloaque:     {nom:'Cloaque',   branche:'tenebres', or:0, pv:300, deg:60, p:portee(700), c:cadence(60), poison:40, ralentit:25, vers:['damne']},
  oiseau:      {nom:'Rapace',    branche:'lumiere',  or:0, pv:300, deg:250,p:portee(500), c:cadence(24), vers:['lanterne']},

  puits:     {nom:'Puits de magma', or:800, pv:1000, deg:250, p:portee(500), c:cadence(90),  zone:portee(100), etourdit:8,  vers:['boom','meteore']},
  eauBenite: {nom:'Eau bénite',     or:800, pv:1000, deg:300, p:portee(700), c:cadence(60),  vers:['eauUltime','glaceUltime']},
  canonElec: {nom:'Canon électrique',or:800,pv:1000, deg:150, p:portee(500), c:cadence(120), etourdit:5,  vers:['generateur','condensateur']},
  /* La Tour damnee lance « cripple » dans la map : un ralentissement, pas des
     degats supplementaires. La Lanterne lance « faerie fire », qui reduit
     l'armure — ici, un surcout de degats subis. */
  damne:     {nom:'Tour damnée',    or:800, pv:1000, deg:250, p:portee(700), c:cadence(60),  ralentit:30, vers:['mort','fosse']},
  lanterne:  {nom:'Lanterne sacrée',or:800, pv:1000, deg:300, p:portee(600), c:cadence(60),  vulnerable:25, vers:['champignon','teleporteur']},

  boom:        {nom:'Tour BOUM',    feuille:'feu', or:300, pv:5000, deg:1000,p:portee(150), c:cadence(60), zone:portee(300), usageUnique:true},
  meteore:     {nom:'Attracteur',   feuille:'feu', or:4000,pv:3000, deg:1000,p:portee(1000),c:cadence(20), zone:portee(400)},
  eauUltime:   {nom:'Eau ultime',   feuille:'froid', or:3000,pv:2000, deg:600, p:portee(700), c:cadence(60), zone:portee(100)},
  glaceUltime: {nom:'Glace ultime', feuille:'froid', or:4000,pv:2500, deg:200, p:portee(700), c:cadence(60), zone:portee(200), ralentit:40},
  generateur:  {nom:'Générateur',   feuille:'foudre', or:4000,pv:2500, deg:250, p:portee(700), c:cadence(300)},
  /* Le Condensateur multiplie la vie courante par 0,8 : il ne tue JAMAIS, il
     ne fait que ramener. La Mort, elle, tue net, quels que soient les points
     de vie — et se detruit apres son unique tir. */
  condensateur:{nom:'Condensateur', feuille:'foudre', or:3000,pv:1500, degPct:20,p:portee(500),c:cadence(12)},
  mort:        {nom:'La Mort',      feuille:'tenebres', or:300, pv:5000, tue:true, p:portee(700),c:cadence(60), usageUnique:true},
  /* La Fosse retire 5 % de la vie COURANTE toutes les 5 s pendant 30 s : un
     poison en pourcentage, donc redoutable sur les gros monstres. */
  fosse:       {nom:'Fosse septique',feuille:'tenebres', or:4000,pv:3000,deg:350, p:portee(700), c:cadence(30), zone:portee(100),
                poisonPct:5, poisonDuree:300, poisonPas:50},
  champignon:  {nom:'Champignon',   feuille:'lumiere', or:4000,pv:1800, deg:500, p:portee(700), c:cadence(30), zone:portee(250)},
  teleporteur: {nom:'Téléporteur',  feuille:'lumiere', or:4000,pv:2500, deg:0,   p:portee(700), c:cadence(2),  teleporte:true}
};

/* Monstres envoyables. Le ratio revenu/or decroit strictement : c'est le
   levier de reglage numero un du jeu. */
/* `ech`   = taille a l'ecran, en fraction de case (voir LTD7-DONNEES-REELLES §5 bis).
   `dispo` = seconde a laquelle le monstre devient achetable.
   `stock` = [maximum simultane, secondes pour en regagner un].

   Le catalogue de LTW 7 n'est pas un menu : c'est une CHRONOLOGIE. Le Mouton
   est la des la 5e seconde, le Fantassin a 80 s, le Char a 420 s, et le
   Seigneur bandit seulement a 800 s — avec un stock de 3. C'est ce qui empeche
   de noyer l'adversaire sous le meilleur ratio et ce qui donne sa forme a la
   partie. Les valeurs viennent des champs usst / usma / usrg de la map. */
const MONSTRES = {
  mouton:  {nom:'Mouton',   or:5,   revenu:1,  pv:5,     v:vitesse(270), ech:0.42, dispo:5,   stock:[20, 2]},
  loup:    {nom:'Loup',     or:10,  revenu:2,  pv:40,    v:vitesse(300), ech:0.50, dispo:10,  stock:[15, 3]},
  squelette:{nom:'Squelette', or:22, revenu:4,  pv:88,    v:vitesse(270), ech:0.48, dispo:40,  stock:[10, 5]},
  acolyte: {nom:'Acolyte',  or:50,  revenu:8,  pv:200,   v:vitesse(270), ech:0.52, dispo:60,  stock:[10, 5]},
  fantassin:{nom:'Fantassin',or:75, revenu:12, pv:250,   v:vitesse(370), ech:0.54, dispo:80,  stock:[10, 5]},
  grognard:{nom:'Grognard', or:100, revenu:14, pv:400,   v:vitesse(270), ech:0.60, dispo:100, stock:[6, 5]},
  ombre:   {nom:'Ombre',    or:200, revenu:22, pv:600,   v:vitesse(300), vol:true, ech:0.58, dispo:120, stock:[20, 7]},
  golem:   {nom:'Golem',    or:350, revenu:37, pv:1400,  v:vitesse(300), ech:0.72, dispo:140, stock:[10, 5]},
  /* Les barreaux intermediaires. Ils manquaient, et c'est ce qui creait douze
     minutes d'immobilite : entre le Demolisseur a 500 or et le Troll a 5 000,
     rien ne devenait abordable, donc l'attaque n'avancait plus pendant que la
     defense, elle, continuait de monter. Ils viennent tous de la map. */
  centaure:{nom:'Centaure', or:1000, revenu:100, pv:4000,  v:vitesse(300), ech:0.74,
            dispo:250, stock:[25, 3]},
  colosse: {nom:'Colosse de pierre', or:1000, revenu:100, pv:10000, v:vitesse(270), ech:0.82,
            dispo:300, stock:[10, 15], mecanique:true},
  taureau: {nom:'Taurren', or:2000, revenu:200, pv:8000,  v:vitesse(270), ech:0.84,
            dispo:300, stock:[25, 3]},
  troll:   {nom:'Troll berserk', or:5000, revenu:450, pv:5000, v:vitesse(350), ech:0.80,
            dispo:330, stock:[15, 5], siege:{deg:47, portee:portee(150), cadence:cadence(60)}},
  wendigo: {nom:'Wendigo', or:10000, revenu:900, pv:40000, v:vitesse(350), ech:0.86,
            dispo:360, stock:[25, 3]},
  banshee: {nom:'Banshee',  or:20000,revenu:1700,pv:60000,v:vitesse(300), vol:true, ech:0.76,
            dispo:390, stock:[20, 5]},
  /* Le haut du catalogue. Il manquait, et c'est ce qui rendait la defense
     imbattable en fin de partie : mes monstres plafonnaient a 60 000 PV alors
     qu'une ligne bien montee inflige plus de 180 000 degats sur un trajet. */
  infernal:{nom:'Infernal',  or:40000, revenu:3000, pv:350000, v:vitesse(270), ech:0.90,
            dispo:450, stock:[10, 7], mecanique:true},
  spectre: {nom:'Spectre de givre', or:50000, revenu:3300, pv:110000, v:vitesse(350), ech:0.78,
            dispo:450, stock:[20, 5]},
  wyrm:    {nom:'Wyrm de givre', or:60000, revenu:4000, pv:120000, v:vitesse(300), vol:true,
            ech:0.86, dispo:480, stock:[10, 10]},
  elementaire:{nom:'Élémentaire d\'eau', or:80000, revenu:4300, pv:150000, v:vitesse(270),
            ech:0.94, dispo:510, stock:[10, 10]},
  loupOmbre:{nom:'Loup d\'ombre', or:100000, revenu:6000, pv:200000, v:vitesse(300), ech:0.88,
            dispo:700, stock:[10, 10]},

  /* --- Les briseurs ---------------------------------------------------------
     Ils ne cherchent pas a passer : ils viennent casser les tours. Ils ne
     volent donc aucune vie tant qu'il reste quelque chose a demolir. C'est
     l'autre facon de gagner une ligne — on ne perce pas la defense, on la
     supprime. Reperables dans la map a leur nom qui contient « ATTAK ». */
  demolisseur:{nom:'Démolisseur', or:500, revenu:50, pv:1000, v:vitesse(270), ech:0.62,
               dispo:160, stock:[15, 7],
               siege:{deg:60,  portee:portee(120), cadence:cadence(45)}},
  char:    {nom:'Char à vapeur', or:30000, revenu:2500, pv:100000, v:vitesse(270), ech:0.88,
            dispo:420, stock:[15, 5],
            siege:{deg:400, portee:portee(200), cadence:cadence(40)}},
  broyeur: {nom:'Broyeur gobelin', or:100000, revenu:5000, pv:100000, v:vitesse(300), ech:0.84,
            dispo:600, stock:[10, 10], mecanique:true,
            siege:{deg:750, portee:portee(140), cadence:cadence(70)}},

  /* --- Le sacrifice ---------------------------------------------------------
     150 000 PV, une frappe de zone a distance, et +3 de revenu pour 100 000 or.
     Ce n'est pas une blague de l'auteur : c'est un choix. On ne l'envoie pas
     pour s'enrichir, on l'envoie pour effacer une ligne — et on renonce a toute
     l'economie que la meme somme aurait rapportee. Disponible seulement a
     800 secondes, avec un stock de trois : le plus rare du jeu. */
  seigneur:{nom:'Seigneur bandit', or:100000, revenu:3, pv:150000, v:vitesse(250), ech:0.92,
            dispo:800, stock:[3, 15], sacrifice:true, mecanique:true,
            siege:{deg:900, portee:portee(300), cadence:cadence(30), zone:portee(180)}}
};

/* Les profils raccourcissent la partie par les VIES et par la chronologie de
   deblocage (`temps`), pas en gonflant l'economie.

   Le versement est le battement du jeu : c'est le moment ou l'or tombe et ou il
   faut choisir entre une tour et un envoi. Sous cinq secondes on n'a plus le
   temps de regarder sa ligne, et raccourcir l'intervalle sans toucher aux couts
   ne rend pas la partie plus courte — ca rend le joueur plus riche. Une
   premiere version faisait d'Eclair une partie 4,8 fois plus riche par seconde
   que Classique, ce qui changeait le sens de toute la grille de prix.

   Ici l'intervalle ne descend jamais sous 5 s et l'or par seconde reste dans un
   rapport de deux, au lieu de cinq. */
const PROFILS = {
  //                        vies  or   revenu tick  temps   -> or/s   x Classique
  /* Classique = la map, chiffre pour chiffre : 25 vies, 100 or, revenu 25,
     versement toutes les 10 s, 3 bois. Les autres rythmes s'en ecartent d'un
     cran chacun — jamais plus, pour ne pas changer le sens des prix. */
  ECLAIR:    {nom:'Éclair',    vies:6,  or:130, revenu:25, tickRevenu:50,  bois:3, temps:0.18},
  BLITZ:     {nom:'Blitz',     vies:10, or:120, revenu:24, tickRevenu:60,  bois:3, temps:0.30},
  SOUTENU:   {nom:'Soutenu',   vies:16, or:110, revenu:25, tickRevenu:80,  bois:3, temps:0.55},
  CLASSIQUE: {nom:'Classique', vies:25, or:100, revenu:25, tickRevenu:100, bois:3, temps:1.00}
};

/* La difficulte change ce que les bots FONT, pas leurs statistiques : ils
   jouent le meme jeu que toi, avec les memes couts. Un bot facile construit
   mal et envoie peu ; un bot impitoyable maze, ameliore, achete ses branches
   et reinvestit la quasi-totalite de son or. */
const DIFFICULTES = {
  /* `biais` : a quel point le bot choisit VRAIMENT le meilleur envoi.
     1,0 = il tire au hasard parmi ce qu'il peut s'offrir. Plus on descend, plus
     il privilegie le bon choix — mais jamais au point d'etre previsible. Un bot
     qui joue toujours l'optimum se lit en une partie et devient ennuyeux bien
     avant d'etre difficile.
     `saute` : probabilite sur 100 de laisser passer une fenetre d'envoi, comme
     un joueur qui hesite ou qui garde son or. */
  facile:      {nom:'Débutant',    intervalle:[150, 230], partEnvois:0.30,
                maze:false, ameliore:false, branches:false, poseTous:11,
                biais:0.92, saute:30},
  normal:      {nom:'Normal',      intervalle:[95, 150],  partEnvois:0.55,
                maze:true,  ameliore:false, branches:false, poseTous:8,
                biais:0.62, saute:16},
  /* 0,80 et non 0,70 : en dessous, un bot Agressif construit assez pour rendre
     sa ligne imprenable sans envoyer assez pour prendre celle des autres, et
     deux d'entre eux se bloquent au-dela de trente minutes. Le creux
     « defense forte, offense moyenne » est le pire endroit ou se placer. */
  agressif:    {nom:'Agressif',    intervalle:[62, 100],  partEnvois:0.80,
                maze:true,  ameliore:true,  branches:true,  poseTous:6, siege:true,
                biais:0.45, saute:8},
  impitoyable: {nom:'Impitoyable', intervalle:[45, 72],   partEnvois:0.82,
                maze:true,  ameliore:true,  branches:true,  poseTous:4, siege:true,
                biais:0.33, saute:3}
};

const CONFIG = {
  CASE, PAS_MS, MILLI, LARGEUR:9, HAUTEUR:13,
  entree:{x:4,y:0}, exit:{x:4,y:12},
  remboursement:70,          // % rendu a la vente ; une demolition ne rend rien
  /* Le fameux « 12 » de la map ne plafonne PAS les monstres : il compte les
     BATIMENTS du defenseur. A partir de douze tours, tout monstre non mecanique
     envoye chez lui arrive EN DOUBLE. C'est l'anti-tortue du jeu d'origine :
     plus on se fortifie, plus on recoit. (war3map.j, Trig_spawn_Actions) */
  seuilDoublement:12,
  boisParKill:1,
  controleur:{ periode:400, deg:1000, zone:portee(200), v:vitesse(522) },
  TOURS, MONSTRES, BRANCHES, PROFILS, DIFFICULTES,
  /* Ce qui est constructible d'emblee : trois entrees, tout le reste est
     une amelioration sur place. */
  boutique:['guet','epine','elementaire']
};
