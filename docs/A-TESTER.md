# Ce qu'il y a à tester

**Le rapport de partie.** À la fin d'une partie, le bouton
« Copier le rapport de partie » met dans le presse-papier ce que chacun a bâti,
monté, envoyé, reçu, et qui a éliminé qui, avec la chronologie. **C'est ça qu'il
faut me coller** — une capture d'écran ne montre que le score final.

**La version.** L'écran-titre et le rapport affichent la date et le numéro de
build. Si tu me signales un défaut, ce numéro me dit tout de suite si tu jouais
la version corrigée ou une page restée en cache.

**Installer le jeu sur le téléphone** : ouvre
`https://capitaine-muffin.github.io/ltw7/`, puis « Ajouter à l'écran d'accueil ».
Il s'ouvre alors en plein écran, sans barre d'adresse, avec son icône.

Le prototype expose ses réglages derrière le **⚙**. L'écran de fin récapitule la
configuration exacte de la partie — **c'est ce récapitulatif qu'il faut me
recopier**, sinon « c'est trop dur » n'est pas exploitable.

## Le spam n'est plus une stratégie

Calé sur une vraie partie : **graine 142521, Blitz, bots Agressif** — treize
tours de guet, aucune amélioration, aucune technologie, et du spam du meilleur
rapport. Gagnée en 80 s avec 37 vies sur 39. Trois défauts en sortaient :

1. **Les bots n'investissaient que 120 à 200 or dans leur défense** sur toute la
   partie. Leur budget de tours était plafonné par le temps ; il est désormais
   indexé sur ce qu'ils ont réellement gagné — un tiers de leurs revenus leur
   revient toujours de droit.
2. **Un bot agressif envoyait un monstre toutes les 6 à 10 secondes**, contre
   trois par seconde pour un joueur. Son économie ne pouvait pas suivre. Les
   cadences sont resserrées, sauf en Débutant.
3. **L'échelle de difficulté était inversée.** « Agressif » mettait 80 % de son
   or en envois : ce n'était pas de la force, c'était de l'imprudence — il
   mourait de la main de ses voisins et laissait le joueur gagner par forfait.
   Un bot plus fort est maintenant un bot mieux **équilibré**, et la difficulté
   passe par la cadence et par la qualité des achats (`partRatio` : combien
   d'envois sont choisis au meilleur rapport plutôt qu'au plus gros revenu).

Résultat, sur cinq graines :

| Bots | Spam pur | Construire + améliorer + envoyer |
|---|---:|---:|
| Débutant | gagne 5/5 | gagne 5/5 |
| Normal | **0/5** | 4/5 |
| Agressif | **1/5** | 3/5 |
| Impitoyable | 4/5 * | 0/5 |

\* En Impitoyable les bots s'entretuent si vite qu'un joueur qui ne fait que
spammer survit par accident, sur les vies qu'il vole. Pour un joueur qui joue
vraiment, c'est bien la difficulté la plus dure (0/5). C'est un effet du
chacun-pour-soi, pas un réglage.

**Ce qu'il me faut de toi** : rejoue en Normal puis en Agressif et envoie-moi
les rapports. Mon joueur simulé est fruste — c'est ton retour qui tranche.


## Durées mesurées

Quatre joueurs, personne de passif (la ligne du joueur est confiée à l'IA, ce
qui approche un humain qui envoie vraiment). Moyenne sur quatre graines.

| Rythme | Bots | 1re élimination | Fin |
|---|---|---:|---:|
| Blitz | Débutant | 209 s | 349 s |
| Blitz | Normal | 191 s | 247 s |
| Blitz | Agressif | 145 s | 425 s |
| Blitz | Impitoyable | 120 s | 296 s |
| Classique | Normal | 405 s | 462 s |
| Classique | Agressif | 512 s | 1295 s |

**Classique + Agressif est le cas long** — plus de vingt minutes. C'est le
rythme fidèle à la map (25 vies, versement toutes les 10 s), et l'économie
s'emballe des deux côtés : tout le monde s'enrichit sans que personne ne perce
avant les monstres du très haut de gamme. À traiter, mais Blitz est le rythme
de référence pour l'instant.

## Deux couches de dessin

Les tailles de monstres viennent maintenant des échelles de modèle de la map
(`usca`), pas de mon estimation. Les **briseurs sont plus gros qu'une tour** —
c'est voulu par l'auteur : la Machine de démolition est un fantassin grossi
1,8 fois. À l'écran, une tour fait 1,50 case ; le Seigneur bandit en fait 1,78,
le Broyeur gobelin 1,67, le Char à vapeur 1,62, le Démolisseur 1,55.

Les monstres sont par ailleurs dessinés **1,35 fois plus grands** qu'avant : les proportions
entre eux restent celles de la map — un mouton reste minuscule à côté d'un
élémentaire d'eau — mais l'ensemble était trop petit pour qu'on voie les
sprites. C'est purement visuel, la simulation ne connaît pas cette valeur
(`echelleMonstre` dans la config, si tu veux la pousser plus loin).


Les **sprites restent du pixel** — c'est l'identité du jeu, et un sprite lissé
devient une bouillie. Tout ce qui n'est pas un sprite passe en revanche par des
courbes et des dégradés : ombres portées, lumière du plateau, barres de vie
arrondies, cercle de portée, icônes du bandeau, blason de l'écran-titre. C'est
le contraste entre les deux qui fait « fini » plutôt que « brut ».

Si quelque chose te paraît trop lissé ou au contraire trop cru, dis-le : le
dosage est le seul réglage qui compte ici.

## Les effets des tours, et comment on les voit

Cinq familles portent un effet en plus des dégâts, tous relevés dans les
capacités de la map :

| Effet | Qui le pose | Ce que tu vois |
|---|---|---|
| **Gel** | Glacier, Glace ultime, Cloaque, Tour damnée | le monstre vire au **bleu**, sa marche ralentit, des cristaux tournent à ses pieds |
| **Étourdissement** | Puits de magma, Canon électrique | il vire au **jaune**, son image se **fige**, des étoiles tournent au-dessus |
| **Poison** | Cloaque, Fosse septique | il vire au **vert** |
| **Vulnérabilité** | Lanterne sacrée | il vire à l'**orange** et prend plus de dégâts |

Les pastilles au-dessus de la barre de vie disent lesquels il porte quand il y
en a plusieurs ; la teinte du monstre montre le plus urgent.

## Le son

Tout est synthétisé — aucun fichier, rien de plus à télécharger. Une signature
par famille de tour : le sifflement de la flèche, le dard plus sec, le coup
sourd du mortier, le souffle du feu, le cristal du givre, la décharge, l'accord
du prisme. Le bouton **♪** du bandeau coupe le son, et ce choix est retenu.

Le contexte audio ne peut naître que d'un geste : c'est **Jouer** qui l'allume.
Si tu n'entends rien au premier chargement, c'est que tu as ouvert la page sans
cliquer.

## Les commandes

| Geste | Effet |
|---|---|
| **Appui** sur un achat, puis **appui** sur la grille | poser une tour (l'or part à la pose) |
| **Appui** sur une tour posée | la sélectionner : améliorations et revente |
| **Glissement latéral** sur le plateau | passer à la ligne voisine, dans un sens ou dans l'autre |
| Onglets du haut | même chose, en accès direct |
| Chevron **▾** à droite des onglets | le tableau de bord : vies, revenu, tours, et ce que chacun t'a envoyé |
| **♪** et **⚙** | couper le son · revenir aux réglages (la partie se met en pause) |

Le glissement ne pose jamais rien : la pose part au relâchement du doigt, et
seulement si le doigt n'a pas bougé.

## Les monstres se traversent — mais ne se dessinent plus l'un sur l'autre

Dans la map, toutes les créatures ont une collision de 1.0, c'est-à-dire aucune :
elles se traversent et se faufilent partout. C'est ce qui rend le maze en
serpentin intéressant, donc **la règle est gardée telle quelle**.

Ce qui change est purement visuel : chaque monstre est dessiné avec un décalage
stable, étalé le long du couloir et serré en travers. Une vague forme une
colonne en marche au lieu d'un seul sprite plus opaque. Les tirs visent la
position dessinée, pas celle de la simulation, donc les flèches tombent bien sur
la cible.

## Savoir ce que font les autres

Le prototype se jouait chacun dans son coin. Trois repères ont été ajoutés :

- **Une couleur par joueur.** Chaque monstre porte au sol un anneau à la couleur
  de celui qui l'a envoyé. Une vague d'un seul et même adversaire se voit
  immédiatement.
- **Le fil d'événements**, en haut du plateau : qui t'envoie quoi, qui te vole
  une vie, qui vient d'être éliminé. Ce qui te concerne est en clair, les
  échanges entre bots en gris.
- **La chaîne, sur les onglets** : celui qui te nourrit est marqué **te vise**
  (bordure rouge), celui que tu nourris **tu vises**. Le badge rouge à droite
  compte les monstres actuellement vivants sur cette ligne — un adversaire
  submergé se repère sans changer d'écran.

Ce qui manque encore, et sur quoi j'attends ton avis : un **tableau de bord**
dépliable (or, revenu, nombre de tours, ce que chacun t'a envoyé depuis le
début), à la manière du multiboard de la map d'origine.

## Le bois — la seule décision irréversible

Tu commences avec **3 bois** et tu n'en regagnes qu'en **éliminant un joueur**.
L'onglet Technologies contient **15 cases à 1 bois** : les 5 racines, et les 2
feuilles de chaque racine (fermées tant que leur racine ne l'est pas).

| Ce que tu fais de tes 3 bois | Ce que ça donne |
|---|---|
| 3 racines | trois tours élémentaires gratuites, **aucune** tour de fin de partie |
| 1 racine + ses 2 feuilles | une branche complète, deux tours de fin de partie |
| 2 racines + 1 feuille | l'entre-deux |

C'est exactement le choix de la map (*« Choose wisely! Make sure you get an Uber
tower! »*). **À tester en priorité** : est-ce que la partie se joue assez
longtemps pour que ce choix compte, ou est-ce qu'elle est pliée avant ?

## Les réglages

| Réglage | Valeurs | Ce que ça change |
|---|---|---|
| **Joueurs** | 3 à 7 | la longueur de la chaîne. 7 est la valeur de la map d'origine. |
| **Bots** | Débutant · Normal · Agressif · Impitoyable | voir ci-dessous |
| **Rythme** | Éclair · Blitz · Soutenu · Classique | vies et cadence du revenu |
| **Camp** | 4 | purement cosmétique — bâtiments et biome |
| **Graine** | 1 à 999999 | **rejouer exactement la même partie** |

| Rythme | Vies | Or de départ | Versement | Or / seconde | × Classique |
|---|---:|---:|---:|---:|---:|
| Éclair | 6 | 130 | 5 s | 5,00 | ×2,00 |
| Blitz | 10 | 120 | 6 s | 4,00 | ×1,60 |
| Soutenu | 16 | 110 | 8 s | 3,13 | ×1,25 |
| **Classique** | 25 | **100** | **10 s** | 2,50 | ×1,00 (la map) |

**Le versement est le battement du jeu** : c'est le moment où l'or tombe et où
il faut choisir entre une tour et un envoi. Une première version descendait à
2,5 s, ce qui ne raccourcissait pas la partie — ça rendait le joueur **4,8 fois
plus riche par seconde** qu'en Classique, avec des coûts inchangés. Toute la
grille de prix changeait de sens. Maintenant l'intervalle ne descend jamais sous
5 s et l'écart d'économie tient dans un rapport de deux ; ce sont **les vies et
la chronologie de déblocage** qui raccourcissent la partie.

## Ce que fait la difficulté

Elle ne triche pas : les bots jouent avec **les mêmes coûts** que toi. Elle
change ce qu'ils *font*.

| | Débutant | Normal | Agressif | Impitoyable |
|---|---|---|---|---|
| Construit | un bloc compact, mauvais | un serpentin | un serpentin | un serpentin |
| Améliore ses tours | non | non | oui | oui |
| Achète des branches | non | non | oui | oui |
| Part de l'or en envois | 30 % | 55 % | 70 % | 82 % |
| Envoie toutes les | 15-23 s | 9,5-15 s | 6-10 s | 4,5-7 s |
| Choisit ses monstres | presque au hasard | souvent bien | bien | très bien |
| Laisse passer un tour | 30 % | 16 % | 8 % | 3 % |

**Aucun bot ne joue l'optimum.** Le choix passe par un tirage pondéré : le bon
coup sort souvent, l'excellent parfois, et il leur arrive de se tromper ou de
laisser passer une fenêtre d'envoi. Un bot qui joue parfaitement se lit en une
partie et devient ennuyeux bien avant d'être difficile — la difficulté ne change
que la **pente** de ce tirage.

Mesuré sur 300 secondes, un bot Normal envoie **sept types de monstres
différents**, dans des proportions qui changent à chaque graine.

## Les briseurs

Quatre monstres **ne cherchent pas à passer** : ils marchent droit sur la tour la
plus proche et la démolissent. Ils ne volent aucune vie tant qu'il reste quelque
chose à casser — et quand la ligne est rasée, ils filent vers la sortie comme
n'importe qui.

| Monstre | Or | Revenu | Ce qu'il fait |
|---|---:|---:|---|
| **Démolisseur** | 500 | +50 | 60 dégâts, courte portée. Le premier accessible. |
| **Troll berserk** | 5 000 | +450 | 47 dégâts, rapide. |
| **Char à vapeur** | 30 000 | +2 500 | 400 dégâts, portée moyenne. |
| **Broyeur gobelin** | 100 000 | +5 000 | 750 dégâts. La scie qui tourne. |

Ils viennent tous de la map d'origine — repérables à leur nom qui contient
« ATTAK ». C'est l'autre façon de gagner une ligne : **on ne perce pas la
défense, on la supprime**, et les envois suivants passent tout seuls.

Dans la boutique ils portent la marque **brise**. Seuls les bots **Impitoyable**
en achètent, un envoi sur trois — c'est ce qui rend leur gameplay différent des
autres niveaux, et pas seulement plus rapide.

## Le doublement anti-tortue

**Dès que tu dépasses douze bâtiments, tout monstre non mécanique qu'on
t'envoie arrive en double.** C'est la règle de la map d'origine, et c'est elle
qui empêche la défense de gagner par accumulation.

Conséquence directe sur ta façon de jouer : **construire n'est pas gratuit**.
Une tour de plus, c'est plus de puissance de feu, mais aussi potentiellement le
double de monstres à encaisser. Le maze doit être efficace, pas gros.

Les cinq unités mécaniques échappent au doublement : Colosse, Infernal,
Seigneur bandit, Char à vapeur, Broyeur gobelin.

## La chronologie de déblocage

Les monstres **ne sont pas tous disponibles au départ**. Chacun s'ouvre à une
heure précise, reprise de la map : le Mouton à 5 s, le Fantassin à 80 s, le Char
à 420 s, le Seigneur bandit à 800 s. Dans la boutique, ceux qui ne sont pas
encore là affichent leur compte à rebours.

Et chacun a un **stock** (`x/y` dans la boutique) qui se vide quand on envoie et
se recharge tout seul. C'est ce qui empêche de noyer l'adversaire sous le
meilleur ratio.

Le profil **comprime cette chronologie sans en changer la forme** : Classique la
reprend telle quelle, Blitz à 32 %, Éclair à 20 %.

## Le Seigneur bandit — le sacrifice

100 000 or, 150 000 PV, frappe de **zone à distance**, et **+3 de revenu**.
Ce n'est pas une erreur : c'est le prix. On ne l'envoie pas pour s'enrichir, on
l'envoie pour **effacer une ligne** — au même prix, le Broyeur donne +5 000.
C'est le seul achat purement offensif du jeu, disponible seulement à 800 s
(compressé selon le profil) et limité à trois exemplaires.

**À tester en priorité en Classique** : est-ce que la partie va assez loin pour
qu'il apparaisse, et est-ce que le sacrifice se ressent comme un vrai choix ?

## La méthode la plus utile

**Fixe la graine et change un seul réglage.** Le bouton `↻ même` rejoue la même
partie : même terrain, mêmes bots, mêmes tirages. C'est le seul moyen de savoir
si un changement vient du réglage ou de la chance.

## Les trois questions auxquelles je ne peux pas répondre seul

1. **Combien de temps avant de mourir**, en Blitz / 4 joueurs / Normal, sans rien
   y connaître ? Si c'est moins de 60 s, l'entrée est trop raide.
2. **Est-ce qu'on a le temps de réfléchir** entre deux versements, ou est-ce
   qu'on passe son temps à poser des tours dans l'urgence ?
3. **Est-ce qu'on atteint l'arbre technologique ?** Il faut tuer un bot pour
   avoir du bois au-delà des 3 du départ. Si les parties n'y arrivent jamais,
   toute une couche du jeu est morte.

## Durées mesurées

4 joueurs, une graine de référence. « 1re élimination » = le premier joueur qui
tombe ; « fin » = il ne reste qu'un survivant.

| Rythme | Bots | 1re élimination | Fin |
|---|---|---:|---:|
| Blitz | Normal | 90 s | 257 s |
| Blitz | Agressif | 22 s | 113 s |
| Blitz | Impitoyable | 20 s | 99 s |
| Classique | Normal | 123 s | 445 s |
| Classique | Agressif | 38 s | 241 s |
| Classique | Impitoyable | 30 s | 341 s |

Ces durées ont beaucoup baissé depuis l'ajout du doublement anti-tortue :
Classique + Agressif passait de **plus de trente minutes** à 241 secondes. Le
blocage que je décrivais n'était pas un défaut d'équilibrage, c'était une
mécanique manquante.

**Éclair + Impitoyable termine en 43 secondes** : c'est un mode punitif, pas une
erreur. Pour découvrir le jeu, **Blitz + Débutant** laisse plus de trois minutes
avant la première élimination.

## Ce que je sais déjà être bancal

- **Le revenu des bots monte très haut** en fin de longue partie (plus de
  100 000). C'est la conséquence normale d'un revenu qui compose : chaque envoi
  l'augmente définitivement, et rien ne le fait redescendre. Les parties se
  terminent, mais les nombres deviennent énormes.
- Le Contrôleur n'entre en scène que si quelqu'un scelle son couloir. Pour le
  voir, ferme volontairement ta ligne avec une rangée complète.
