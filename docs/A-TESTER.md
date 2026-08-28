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

Rythmes : Éclair 8 vies / versement 2,5 s · Blitz 12 / 4 s · Soutenu 18 / 6,5 s ·
Classique 25 / 10 s (les valeurs de la map d'origine).

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
| Choisit ses monstres | au hasard | **au meilleur ratio** | ratio + percée | ratio + percée |

Le dernier point est le plus important : un bot qui achète toujours le monstre
le plus cher **joue mal**, parce que les gros monstres ont le pire ratio
revenu/or (0,054 contre 0,200). Les bots à partir de Normal farment au ratio et
ne payent la percée que ponctuellement — comme un bon joueur.

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

## Ce que je sais déjà être bancal

- À 7 joueurs en Agressif ou Impitoyable, **personne ne meurt** : six survivants
  après 10 minutes de simulation. Les bots défendent mieux qu'ils n'attaquent.
- Le Contrôleur n'entre en scène que si quelqu'un scelle son couloir. Pour le
  voir, ferme volontairement ta ligne avec une rangée complète.
