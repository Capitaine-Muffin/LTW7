# Conception v0 — le jeu

**Nom de code : LTW 7 WARNET** (provisoire, interne — voir §9.1).

> Ce qu'on construit, avec des chiffres. Suite directe de `REFERENCE-LTD.md`
> (le quoi et le pourquoi côté Warcraft III) et de `NOUVEAUJEU.md` (le
> processus de publication, déjà rodé sur PING PIOU).
>
> **Statut : v0.** La structure est décidée. Les valeurs numériques sont un
> premier jet cohérent, destiné à être joué puis corrigé — pas des constantes
> sacrées. Elles vivent toutes dans **un seul fichier de réglage** (§7) pour
> que l'équilibrage ne soit jamais une chasse au trésor dans le code.

---

## 1. Le pitch en trois lignes

Un tower defense où **la seule façon de s'enrichir est d'attaquer l'adversaire**.
Chaque pièce d'or est un dilemme : une tour de plus, ou un monstre envoyé chez le
voisin qui augmentera ton revenu pour toute la partie. Les vies ne se perdent
pas : **elles se volent**.

Le créneau : ce système existe depuis 20 ans sur Warcraft III, il n'a jamais eu
d'implémentation mobile sérieuse.

---

## 2. La règle du jeu : fidélité par défaut

**On copie LTW 7. On ne s'en écarte que là où c'est impossible, et en le
justifiant par écrit.** Maintenant qu'on a le code de la map
(`LTD7-DONNEES-REELLES.md`, `LTD7-CATALOGUE.md`), « au maximum » n'est plus une
intention : c'est une liste.

### Ce qui se copie tel quel — et ne coûte rien

Ce sont des nombres. Les reprendre exactement demande le même travail que les
inventer, et supprime des mois d'équilibrage à l'aveugle.

| | |
|---|---|
| Vies, revenu de départ | **25 / 25** |
| Tick de revenu | **10 s** |
| Lignes en cercle | **7** |
| Vol de vie | −1 victime, +1 envoyeur |
| Le monstre qui sort continue sur la ligne suivante | ✅ |
| Plafond d'unités vivantes par ligne | **12** |
| Bois : 3 au départ, +1 par joueur tué | ✅ |
| Toute la courbe revenu/or, de 0,182 à 0,050 | ✅ |
| L'Anti Wall Machine et ses caractéristiques | ✅ |
| Le maze libre, sans chemin tracé | ✅ |
| Les tours, leurs dégâts, portées, cadences et effets | ✅ (voir §5) |

### Les trois écarts inévitables

Aucun n'est une question de goût. Chacun porte la déviation minimale.

**1. Sept joueurs humains en direct.** Impossible sur un jeu neuf : sans base
installée, il n'y a personne à apparier. **Déviation minimale : on garde les
lignes, on remplace les humains.**

- **V1 : contre des bots**, avec un nombre de joueurs **paramétrable de 3 à 7**.
  Sept est la valeur de la map, trois raccourcit la partie — et comme la chaîne
  est circulaire, elle fonctionne à l'identique quelle que soit sa longueur.
- **V2 : les bots cèdent la place aux rejeux** de vraies parties.

La règle du jeu ne change pas d'un iota : seule change l'identité de ceux qui
envoient.

**2. La durée.** Une partie LTW 7 dure 30 à 60 minutes. Un joueur mobile n'a pas
ça. **Déviation minimale : c'est un profil de réglage, pas une refonte** — voir
§7. Le mode `CLASSIQUE` garde les chiffres exacts ; le mode `BLITZ` garde les
mêmes *rapports* en accélérant le tick et en raccourcissant la courbe de coûts.
On livre `BLITZ` par défaut, `CLASSIQUE` reste jouable pour qui veut la vraie
chose.

**3. Les commandes.** Warcraft a une souris, onze raccourcis clavier et la file
d'attente au SHIFT. Un téléphone n'a qu'un doigt. C'est le seul endroit où il
faut inventer — voir §6.

### Ce qui n'est pas dans l'original, et le reste

Les **quatre camps** (Humain, Orc, Mort-vivant, Elfe) sont notre ajout. Ils sont
**purement cosmétiques** : mêmes bâtiments, mêmes chiffres, mêmes fonctions. Ils
ne touchent donc pas à la fidélité — et comme ils sont notre seule source de
revenu (§9), c'est exactement là qu'il fallait mettre l'invention.

---

## 3. La boucle

**Sept couloirs en cercle**, comme dans l'original. Tu en occupes un, les six
autres sont tenus par des bots (V1) puis par des rejeux de vraies parties (V2).
Tu envoies à ton voisin, tu reçois de l'autre : tu n'affrontes jamais celui qui
t'attaque.

Et **la chaîne se recoud quand un joueur meurt** : le cercle se referme sur les
survivants, exactement comme le fait `udg_Next` dans la map.

**Deux ressources :**

- **L'or** — se dépense en tours *ou* en envois.
- **Le revenu** — versé **toutes les 10 secondes** (la valeur de la map).
  Augmente **uniquement** par les envois, et l'augmentation est **définitive**.

**Le vol de vies.** Un monstre qui atteint le bas de ton couloir : **tu perds
1 vie, celui qui l'a envoyé en gagne 1**. À 0 vie, éliminé — et ton tueur reçoit
**1 bois**. Dernier debout gagne.

**Et le monstre ne meurt pas en sortant.** Il est reversé en haut du couloir
suivant et continue sa route. Une seule créature bien lancée peut voler une vie à
plusieurs joueurs d'affilée. C'est dans le code de la map, aucun guide ne le
mentionne, et c'est ce qui punit collectivement les défenses molles.

**Pas de vagues.** Le flux est continu. Il n'y a jamais de moment où l'on ne fait
rien.

### Les vies sont un budget, pas une barre de vie

Le raisonnement : les bons joueurs **calculent combien ils peuvent se permettre
de laisser passer** au lieu de tout arrêter, parce que surconstruire, c'est
mourir deux minutes plus tard, étranglé économiquement.

**Le code de LTW 7 le confirme** : 25 vies, transfert strict de ±1 à chaque
fuite, dans les deux sens. Ce n'est pas une barre de santé, c'est un compte
courant. (`LTD7-DONNEES-REELLES.md` §3.)

Conséquence directe sur notre interface : **perdre une vie ne doit pas être
dramatisé.** Pas d'écran rouge, pas de vibration d'alerte, pas de son de défaite.
Un compteur qui descend, et le compteur de l'adversaire qui monte. Le drame est
réservé aux 3 dernières vies.

---

## 4. Le terrain, le maze et le Contrôleur

**Grille 9 × 13**, une tour = une case. Entrée : la case centrale du haut.
Sortie : la case centrale du bas. Tout le reste est constructible.

- **Aucun chemin tracé.** Les monstres cherchent leur route (A* sur la grille).
- **Les monstres envoyés n'attaquent jamais rien.** Ni les tours qui leur tirent
  dessus, ni les murs qui les gênent. Ils marchent, c'est tout.
- **Rien n'interdit de fermer le passage.** Mais fermer est une **erreur punie**,
  pas une stratégie. Voir ci-dessous.

### Le Contrôleur

*(nom de travail)*

C'est l'unité neutre qui fait respecter la règle du passage libre. Le modèle
Warcraft est confirmé par les guides de la communauté : **« il y a une unité qui
attaque les bâtiments si tu bloques »**, et l'usage qui en découle est sans
ambiguïté — *« ne ferme jamais un mur complet, laisse toujours une demi-case
libre, sinon l'anti-triche vient détruire tes tours, et elles coûtent cher »*.

| | |
|---|---|
| Comportement | traverse le couloir périodiquement |
| Ciblé par les tours | **jamais** — aucune exception, on ne peut pas le tuer |
| Vole une vie en sortant | **non** |
| Si le passage est fermé | **il démolit toute la chaîne de bâtiments qui scelle le couloir** |
| Remboursement | **aucun** |
| Cadence de départ | **toutes les 15 s** — à régler au prototype |

Quatre raisons d'aimer cette solution, et c'est pour ça qu'on la garde telle
quelle :

1. **Elle est visible.** On voit l'unité entrer, on voit le mur tomber. Un
   anti-block invisible qui supprime des tours « parce que » est
   incompréhensible sur mobile — c'est le pire des deux mondes.
2. **On ne peut pas la contourner.** Elle n'est pas ciblable, donc il n'y a pas
   de parade à optimiser.
3. **Elle ne coûte rien au joueur honnête.** Qui maze normalement ne la remarque
   même pas.
4. **Elle punit, elle ne tue pas.** Aucune vie perdue : la sanction est
   patrimoniale. C'est cohérent avec un jeu où les vies sont un budget.

### Pourquoi la sanction doit rester brutale

C'est contre-intuitif, alors autant l'écrire : **on a vérifié le calcul, et un
blocage tiède casse le jeu.**

Les monstres envoyés n'attaquant pas, un mur fermé est une **défense parfaite**
tant qu'il tient : ils s'entassent et se font tirer dessus sans avancer. Si le
Contrôleur ne démolissait qu'un seul bâtiment, rebloquer coûterait une barricade
à 5 or toutes les 15 s — soit **0,33 or/s pour une immunité totale**, contre un
revenu de départ de 2 or/s. La tortue gagnerait, le mazing disparaîtrait, et
avec lui toute la couche de skill mécanique du jeu.

D'où la règle : **le Contrôleur démolit la chaîne entière** — barricades *et*
tours prises dedans — et **ne rembourse rien**. Bloquer redevient ce que c'est
dans le jeu d'origine : une bêtise coûteuse, pas une ligne de jeu.

> **Le vrai jeu, c'est de construire jusqu'à la limite sans la franchir.** Les
> bons mazeurs empilent mur après mur et s'arrêtent **une case avant** celle qui
> scellerait la sortie. C'est là que se situe le skill.

### Comment le moteur décide

Une seule fonction de pathfinding, un seul paramètre qui change :

> **A\*** sur la grille. Une case libre coûte 1. Une case occupée coûte **`∞`
> pour un monstre envoyé** (il contourne, ou s'arrête s'il n'y a plus de route)
> et **le prix de sa démolition pour le Contrôleur** (il passe par le plus
> faible et le détruit).

Le comportement des deux types d'unités **émerge** de ce seul paramètre. Pas de
branche « si bloqué alors ».

Le chemin est recalculé à chaque changement de la grille : pose, vente,
destruction.

⚠️ **Déterminisme.** L'A\* doit départager les égalités de façon stricte —
ordre de voisins fixe, file de priorité triée par (coût, index de case). Deux
chemins de coût identique doivent toujours donner le même résultat sur toutes
les machines, sinon les replays divergent et l'anti-triche s'effondre.

### L'avertissement, parce qu'on n'est pas sur PC

Sur Warcraft, on perd ses tours et on apprend. Sur mobile, on désinstalle. Donc :

- **Pendant la pose**, l'aperçu du trajet s'affiche en direct. Si la case
  scellerait le couloir, l'aperçu bascule en rouge et nomme la conséquence :
  *« ce mur sera démoli »*.
- **Une fois le couloir fermé**, la chaîne condamnée clignote et un **compte à
  rebours** affiche l'arrivée du Contrôleur. Le joueur a le temps de vendre.
- **Vendre rembourse 70 %.** Un bâtiment **démoli par le Contrôleur ne rembourse
  rien** — c'est toute la différence entre se raviser et se faire prendre.

### Idées écartées (pour mémoire)

- **Les monstres envoyés cassent les murs eux-mêmes.** C'est la règle de
  *Wintermaul Wars*, pas celle de LTW. Elle transforme le blocage en stratégie
  viable, ce qui déplace le jeu de « mazer finement » vers « empiler des PV » —
  et ça se conclut par la méta tortue calculée plus haut.
- **Le débordement** (les monstres bloqués s'accumulent et s'engouffrent d'un
  coup à la réouverture). Séduisant, mais ça n'a de sens que si le blocage est
  une ligne de jeu. Avec un Contrôleur punitif, ça ne sert plus à rien. À
  ressortir seulement si on décide un jour de rendre le blocage viable.

---

## 5. Le contenu : celui de la map

Le premier jet inventait huit tours et six monstres. **On jette ça** : le
catalogue réel est extrait et il est meilleur.

### Ce qu'il contient

- **9 bâtiments-monstres** — on en achète un, il rapporte du revenu **et** envoie
  sa créature chez le voisin. De 22 or (+4) à 100 000 or (+6 000).
- **13 creeps** envoyables, de 5 or (+1) à 80 000 or (+4 300).
- **33 tours**, de 10 or à 4 000 or, avec leurs dégâts, portées, cadences et
  effets réels.

Table complète dans `LTD7-CATALOGUE.md`, données brutes dans
`data/ltw7-catalogue.json`.

### Les effets à reproduire

Ils sont plus riches que ce qu'on avait imaginé, et ils viennent tous des
infobulles écrites par l'auteur de la map :

ralentissement · dégâts de zone (petite, moyenne, large, énorme) · poison sur la
durée · étourdissement · affaiblissement · **dégâts en pourcentage de la vie
courante** (Condenser : 20 %) · **tour détruite après son premier tir** (BOOM
Tower : 1000 de dégâts, zone gigantesque, déclenchée par une unité au sol
seulement) · **tour qui téléporte sa cible en haut de la ligne** · unités
aériennes qui ignorent le maze (`SHADOW`, `BANSHEE`, `FROST WYRM`).

Deux d'entre eux méritent d'être signalés parce qu'ils sont excellents et qu'on
ne les aurait jamais inventés : la tour **à usage unique** transforme une tour en
consommable tactique, et la tour **téléporteuse** rallonge le trajet sans occuper
une seule case de plus.

### Ce qu'on coupe, et pourquoi

L'original a des noms de map communautaire (« YOUR MOM (TROLL) », « LAMER GERMAN
- CAN ATTAK », « SHEEP - FOOD FOR TOWERS :D »). On garde **les chiffres**, on
renomme. Une fiche Play Store tout public ne survit pas à ce vocabulaire, et de
toute façon ces noms n'appartiennent pas au jeu, ils appartiennent à son auteur.

### Les 33 tours ne sont pas 33 choix

C'est la découverte qui règle la question, et elle est détaillée dans
`LTD7-ARBRE.md` : **on ne construit que deux tours dans une partie** (Useless
10 or, Sharp 10 or), tout le reste est une **amélioration sur place**, avec au
plus deux montées proposées à la fois.

L'arbre est parfaitement symétrique : **5 branches × 2 feuilles**, les cinq
tours élémentaires coûtant **0 or** (le fameux « premier upgrade gratuit » des
guides, confirmé par le code). Ce qui se paie, c'est la **branche**, en bois.

On garde donc les 33 tours **sans aucun tri** : elles ne sont jamais toutes
visibles en même temps.

---

## 6. Les commandes

C'est le seul endroit où il faut inventer, puisque le téléphone n'a ni souris ni
clavier.

### Trois boutiques, trois boutons

En bas de l'écran, **trois boutons permanents** : **Monstres**, **Bâtiments**,
**Technologies**. Un appui ouvre la ligne d'achat correspondante, en bandeau
au-dessus. Un second appui la referme. Jamais deux à la fois : l'écran de jeu
reste visible.

C'est la structure de la map d'origine ramenée au pouce — elle a exactement ces
trois familles de menus (« Show Basic / Advanced Unit Menu », les tours, et les
achats de branches en bois).

**Et le troisième règle le problème des 33 tours** (voir `LTD7-ARBRE.md`) :

| Menu | Ce qu'il contient | Fréquence d'usage |
|---|---|---|
| **Monstres** | les envois, deux pages (basique / avancé) | toutes les dix secondes |
| **Bâtiments** | **trois entrées seulement** : Useless 10 or, Sharp 10 or, Elemental 200 or | en continu |
| **Technologies** | l'arbre en bois : 5 racines, 10 feuilles | trois ou quatre fois par partie |

La boutique Bâtiments ne contient que trois entrées parce que **tout le reste est
une amélioration sur place** : on appuie sur une tour déjà posée, et elle propose
au plus deux montées. Le joueur ne choisit jamais parmi trente.

Le menu Technologies, lui, est rare et lourd : **3 bois au départ, +1 par joueur
tué**, une racine coûte 1 bois et chaque feuille 1 de plus. C'est là qu'on décide
qui on va être pour toute la partie — et comme le bois vient des kills,
**la spécialisation récompense l'agression**.

### Acheter un bâtiment, puis le poser

**Un appui pour acheter, un appui pour poser.** Pas de glisser-déposer : le doigt
masque la case visée, et sur une grille serrée on se trompe de case. Avec deux
appuis, la cible reste visible jusqu'au dernier moment.

Entre les deux, le bâtiment est « en main » :

- la grille affiche les cases valides ;
- **l'aperçu du trajet se met à jour en direct** sous le doigt ;
- si la pose scellerait le couloir, l'aperçu bascule et annonce le passage du
  Contrôleur (§4) ;
- un appui hors grille repose le bâtiment sans rien dépenser.

**L'or n'est débité qu'à la pose.** Acheter puis annuler ne coûte rien — sinon la
première partie d'un joueur se solde par un budget perdu en essais.

### Poser trente barricades

C'est le geste le plus fréquent du jeu, et deux appuis par barricade le rendent
pénible. **Le bâtiment reste en main après la pose** tant qu'on a de quoi payer :
on enchaîne les appuis, et on referme la boutique quand on a fini. C'est
l'équivalent de la file d'attente au SHIFT de Warcraft.

### Envoyer un monstre

Un appui dans la boutique Monstres suffit — pas de placement, la créature part
chez le voisin. La ligne d'achat affiche pour chacun **le coût, le gain de revenu
et le ratio**, parce que c'est exactement la décision que le joueur doit prendre
et qu'aucun joueur mobile ne fera la division de tête.

### Ton écran, c'est ta ligne

Une ligne occupe tout l'écran. C'est la seule où tu construis, et elle n'est
jamais masquée par autre chose que les bandeaux de boutique.

**Un balayage latéral fait défiler les lignes adverses, en lecture seule.** On y
voit tout — leur maze, ce qui les traverse, leurs vies, leur revenu — mais aucun
bouton n'est actif. C'est du renseignement, pas du contrôle.

Deux raisons de le faire ainsi, et la seconde compte autant que la première :

1. **On lit l'adversaire.** Voir le maze du voisin de droite, c'est savoir quel
   monstre lui fera mal. C'est la couche de skill que les guides appellent
   « lire les envois ».
2. **On ne peut pas se tromper de ligne.** Un mode lecture seule rend impossible
   de poser une tour chez quelqu'un d'autre par erreur de balayage — sur mobile
   ce genre d'erreur arrive, et elle coûte de l'or.

Un bandeau permanent en haut donne pour chaque joueur ses **vies** et son
**revenu** : c'est le tableau des scores de la map, et c'est ce qui dit qui est
en train de gagner.

---

## 7. Architecture

Contrainte héritée de la recette : **logique pure séparée du rendu dès le premier
jour**, sinon c'est irrattrapable.

```
src/
  engine/     ← simulation pure. Aucun DOM, aucun accès réseau, aucune horloge.
  meta/       ← progression, déblocages. Pur aussi.
  game/       ← rendu, entrées, pubs, achats, file d'envoi
  ui/         ← écrans
```

### Le moteur est déterministe, ou il n'est rien

Trois règles, toutes les trois obligatoires :

1. **Pas de nombres à virgule flottante** dans la simulation. Positions, PV,
   dégâts, vitesses : **entiers en virgule fixe** (millièmes de case). Une
   dérive de 10⁻¹⁵ suffit à faire diverger un replay.
2. **Pas d'horloge système.** Le moteur avance par `step()`, **100 ms de jeu par
   pas**. Le versement de revenu tombe tous les 50 pas. C'est le rendu qui
   décide quand appeler `step()`, pas l'inverse.
3. **Aléatoire semé.** Un PRNG explicite (xorshift), graine dans l'état de la
   partie. Jamais `Math.random()`.

Une partie est alors entièrement décrite par :

```
{ seed, config, entrées: [ {pas, action}, … ] }
```

Ce qu'on obtient gratuitement :

- **Anti-triche** : le serveur rejoue et recalcule le score (déjà prévu dans la
  recette).
- **PvP asynchrone** : la liste des envois d'un joueur, rejouée contre ma
  défense. C'est le mode V2, sans une ligne de serveur en plus.
- **Replays** partageables, pour un coût de stockage dérisoire.
- **Tests** : une partie de référence rejouée à chaque commit détecte
  instantanément toute régression d'équilibrage.

### Les bots

Un bot = **un script d'envois** (« à t=30 s, 2 Rats ; à t=75 s, 1 Brute… ») +
une routine de défense simple. Trois profils de difficulté, écrits à la main,
pas d'IA. Ils sont **exactement le même format** que ce que produira une partie
de joueur réel en V2.

---

## 8. Un seul fichier de réglage

Toutes les valeurs vivent dans `src/engine/config.ts`, alimenté par
`data/ltw7-catalogue.json`. Aucune constante numérique de gameplay ailleurs dans
le code.

**Et c'est ce qui rend la fidélité gratuite.** Deux profils, un seul moteur :

| | `CLASSIQUE` | `BLITZ` |
|---|---|---|
| Vies | 25 | 12 |
| Tick de revenu | 10 s | 4 s |
| Courbe de coûts | complète, jusqu'à 100 000 or | tronquée |
| Durée | 30-45 min | 6-8 min |
| Rapports revenu/or | **identiques** | **identiques** |

`BLITZ` n'invente rien : il garde les mêmes rapports en compressant l'échelle.
Livrer les deux coûte un objet de configuration de plus — à condition que la
séparation soit tenue dès la première ligne. Elle ne se rattrape pas après.

---

## 9. Monétisation — le point de vigilance

La recette PING PIOU (AdMob + RevenueCat + diamants) se transpose **sauf sur un
point** : ici, le joueur affronte d'autres joueurs.

> **Aucun achat ne doit donner de l'or, du revenu, des vies, ni débloquer une
> tour.** Un jeu compétitif où l'argent achète de la puissance est mort à la
> publication, et il n'y a pas de retour en arrière possible sur cette réputation.

Ce qui reste, et qui suffit :

- **Cosmétique** : apparences de tours, de monstres, de terrain.
- **Pub facultative** : reprendre une partie solo perdue. Solo uniquement.
- **Retrait des pubs** : achat unique.
- **Saisons** : classement remis à zéro, récompenses cosmétiques.

À cadrer maintenant, pas après : ça contraint le design du contenu.

---

## 10. Ce qui reste à trancher

1. **Le nom public.** Le nom de code du projet est **LTW 7 WARNET** — interne,
   provisoire. Il ne peut pas devenir le nom publié : « LTW », « Warcraft » et
   « Battle.net » appartiennent à Blizzard, et une fiche Play qui s'en approche
   est un motif de retrait. Le vrai nom se choisit avant la création de
   l'application dans la Play Console.
   **Conséquence** : `com.capitainemuffin.<jeu>` est **définitif dès la première
   publication** (recette §2.2), donc **on ne le fige pas maintenant**. Le nom de
   code ne doit apparaître dans aucun identifiant durable.
2. **Le renommage du catalogue.** Les noms d'origine sont ceux d'une map
   communautaire (« YOUR MOM (TROLL) », « SHEEP - FOOD FOR TOWERS :D ») ; il faut
   un jeu de noms à nous, cohérent avec les quatre camps. Les cinq branches
   (Feu, Froid, Foudre, Lumière, Ténèbres) sont en revanche déjà bonnes.
3. **La grille.** 9 × 13 est une hypothèse. À valider au doigt sur un vrai
   téléphone — c'est de l'équilibrage, ça se teste.
4. **Le mode par défaut au premier lancement** : `BLITZ` évidemment, mais
   est-ce qu'on montre `CLASSIQUE` d'emblée, ou est-ce qu'on le débloque ?

## 11. Prochaine étape proposée

Dans l'ordre, et rien de plus tant que ce n'est pas fait :

1. **Le squelette du projet** + la CI recopiée de PING PIOU.
2. **Le moteur nu**, sans rendu : grille, A*, anti-block, monstres, tours,
   économie, vol de vies. Avec ses tests de déterminisme.
3. **Un rendu minimal** (rectangles de couleur) pour jouer une partie complète.
4. **Alors seulement** : équilibrage, art, écrans, monétisation.

L'étape 2 est la seule qui soit vraiment risquée. C'est celle qu'il faut faire en
premier.
