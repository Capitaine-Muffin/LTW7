# Ce qu'il y a à tester

Le prototype expose ses réglages derrière le **⚙**. L'écran de fin récapitule la
configuration exacte de la partie — **c'est ce récapitulatif qu'il faut me
recopier**, sinon « c'est trop dur » n'est pas exploitable.

## Les réglages

| Réglage | Valeurs | Ce que ça change |
|---|---|---|
| **Joueurs** | 3 à 7 | la longueur de la chaîne. 7 est la valeur de la map d'origine. |
| **Bots** | Débutant · Normal · Agressif · Impitoyable | voir ci-dessous |
| **Rythme** | Éclair · Blitz · Soutenu · Classique | vies et cadence du revenu |
| **Camp** | 4 | purement cosmétique — bâtiments et biome |
| **Graine** | 1 à 999999 | **rejouer exactement la même partie** |

| Rythme | Vies | Versement | Or / seconde | × Classique |
|---|---:|---:|---:|---:|
| Éclair | 6 | 5 s | 5,00 | ×2,00 |
| Blitz | 10 | 6 s | 4,00 | ×1,60 |
| Soutenu | 16 | 8 s | 3,13 | ×1,25 |
| **Classique** | 25 | **10 s** | 2,50 | ×1,00 (la map) |

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

Simulation à 4 joueurs, **ligne du joueur passive** — c'est donc la borne basse :
le temps de survie de quelqu'un qui ne fait absolument rien.

| Rythme | Bots | Mort du passif | Fin de partie |
|---|---|---:|---:|
| Éclair | Normal | 53 s | 661 s |
| Éclair | Impitoyable | 17 s | 279 s |
| Blitz | Normal | 63 s | 1031 s |
| Blitz | Impitoyable | 21 s | 488 s |
| Classique | Normal | 110 s | — |
| Classique | Impitoyable | 34 s | — |

À lire ainsi : en Blitz/Normal tu as **une minute de marge** si tu ne fais rien,
donc largement de quoi apprendre. En Impitoyable, vingt secondes.

## Ce que je sais déjà être bancal

- **Le revenu des bots s'emballe** en fin de partie : plus de 300 000 sur les
  longues parties. La défense monte plus vite que l'offense, et personne ne
  meurt plus. Les parties Classique ne se terminent toujours pas.
- Le Contrôleur n'entre en scène que si quelqu'un scelle son couloir. Pour le
  voir, ferme volontairement ta ligne avec une rangée complète.
