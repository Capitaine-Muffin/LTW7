# Les sprites

Deux fichiers : `sprites.js` (les bâtiments, 48 × 48) et `monstres.js` (les
créatures, 24 × 24, deux images de marche chacune).


`sprites.js` dessine les 32 bâtiments (8 × 4 camps) en **48 × 48**. Aucun fichier
image : tout est tracé pixel par pixel à l'exécution.

## Ce qui fait la différence entre un sprite et un aplat

**Les calques.** Chaque pièce est dessinée dans une grille vierge, **détourée en
noir**, puis collée sur la précédente :

```js
couche(g, noir, t => roue (t, 33,34, 7))      // roue arrière
couche(g, noir, t => affut(t, 12,29, 24,6))   // châssis
couche(g, noir, t => fut  (t, 10,19, 30,4, [2,11,20]))
couche(g, noir, t => roue (t, 17,36, 8))      // roue avant
```

C'est ce qui donne les traits noirs **entre** le fût et l'affût, entre la roue et
le châssis. Un détourage unique sur la silhouette extérieure ne les produit pas,
et le sprite s'affaisse.

**Le fût.** La brique de base : quatre bandes de valeur du haut vers le bas, un
liseré clair sur l'arête supérieure, des frettes plus sombres qui débordent d'un
pixel, un évasement et une bouche noire au bout. La même fonction sert au canon
du Mortier, aux colonnes et au mât de la Foudre. C'est elle qui fait lire un
cylindre plutôt qu'une tache.

## Deux couches séparées

| Couche | Qui la fournit | Ce qu'elle dessine |
|---|---|---|
| **Matière** | le camp (`ARCHI.humain.mat`, `.toit`, `.crete`, `.orne`) | pierre appareillée, rondins, os, bois tressé |
| **Machinerie** | la fonction du bâtiment | vasque, cristal, orbe, canon, baliste, cœur |

La machinerie est **identique d'un camp à l'autre**, seulement teintée. Règle de
jeu déguisée en règle de dessin : sans elle, un joueur devrait réapprendre huit
bâtiments à chaque skin rencontré.

**Ajouter un camp** = une palette de vingt teintes + quatre fonctions de matière.

## Voir ce qu'on dessine

```sh
FOND="#ffffff" ECH=5 node tools/apercu.mjs art/sprites.js planche.png
FOND="#4a7c42" ECH=5 node tools/apercu.mjs art/sprites.js herbe.png   # sol de jeu
ECH=6 BAT=mortier node tools/apercu.mjs art/sprites.js essai.png      # un seul
```

**Toujours juger sur le sol où le sprite sera posé.** Les mêmes sprites vus sur
fond sombre paraissent ternes et sur fond clair paraissent nets — ce n'est pas
le sprite qui change, c'est le contraste du détourage noir. Le fond vert du
terrain est pour l'instant le plus flatteur des trois testés.

`tools/apercu.mjs` écrit un PNG (encodeur écrit à la main, zlib de Node — il n'y
a pas de bibliothèque d'image ici). Dessiner du pixel art sans regarder le
résultat ne marche pas : la boucle « je dessine → je regarde → je corrige » est
l'outil principal, pas un accessoire.

## Contraintes à ne pas casser

- **La barricade reste la plus pauvre des huit.** Pas de couronnement, pas de
  lueur. On en pose trente puis on les revend : si elle a l'air précieuse, le
  joueur hésite et le maze ne se construit jamais.
- **Le Prisme est le seul animé.** Une seule par joueur : le pouls est un
  privilège, pas un effet.
- **Portée courte = trapu, longue portée = élancé.**
- **Givre et Foudre ne doivent pas se confondre** : cristal anguleux facetté
  contre sphère nette à bande équatoriale. Au premier jet elles se ressemblaient.
- **Test avant de peaufiner** : rendre en silhouette noire. Un bâtiment qui n'est
  plus identifiable en noir ne le sera pas davantage en couleur sur une case de
  40 pixels.


---

# Les monstres (`monstres.js`)

24 × 24, **deux images** par créature — la seconde décale les pattes, les bras
ou l'ondulation du voile. C'est une seule ligne de différence et ça suffit à
faire vivre le plateau.

Même méthode que les bâtiments : chaque partie dessinée à part, détourée en
noir, puis collée (`MCOUCHE`). Le corps passe par `MCORPS`, qui pose trois
bandes de valeur — lumière à gauche, masse au centre, ombre à droite.

| Créature | Ce qu'elle doit dire au premier coup d'œil |
|---|---|
| **Mouton** | dérisoire. Toison énorme, museau noir minuscule, deux pattes fines. C'est l'achat purement économique : il ne doit faire peur à personne. |
| **Loup** | rapide. Quadrupède bas sur pattes, museau effilé, oreilles triangulaires, regard cyan. |
| **Acolyte** | occulte. Capuche, aucune jambe visible, mains qui rougeoient. |
| **Fantassin** | militaire. Casque à fente, bouclier rond, épée levée, tabard bleu. Le seul qui ressemble à un soldat. |
| **Golem** | lourd. Masse trapue, bras rattachés aux épaules, fissures orange. |
| **Ombre** | volante. Silhouette effilochée qui ondule, capuche, pas de sol. |
| **Troll** | brutal. Voûté, défenses, gourdin. |
| **Banshee** | volante et chère. Voile déchiré, bras ouverts, turquoise lumineux. |
| **Démolisseur** | chariot de siège à roues qui tournent, bélier, sapeur derrière. |
| **Char à vapeur** | blindage, chenilles décalées entre les deux images, cheminée. |
| **Broyeur gobelin** | la scie circulaire pivote d'un huitième de tour entre les images. |
| **Infernal** | masse de roche en fusion, fissures ardentes, bras démesurés. |
| **Spectre de givre** | décharné, arêtes de glace qui poussent sur les flancs. |
| **Wyrm de givre** | ailes déployées qui battent, long cou, queue effilée. |
| **Élémentaire d'eau** | masse translucide qui ondule, noyau lumineux, crête d'écume. |
| **Loup d'ombre** | le loup en plus grand et plus noir, échine hirsute, regard violet. |
| **Seigneur bandit** | épaulières, casque cornu, lame démesurée. Le sacrifice. |

**Les volants sont dessinés plus haut que leur case, avec une ombre portée
détachée au sol** — c'est ce qui dit « il ignore ton labyrinthe » sans une seule
ligne de texte.

## L'échelle, et pourquoi elle compte

Dans la map d'origine une tour occupe **une case entière** et un creep a une
collision de 1.0, c'est-à-dire un point ; les modèles de tours y sont mis à
l'échelle 1,3 à 2,0 et les creeps à 0,5 à 1,5. **Le rapport visuel est d'environ
trois pour un.**

D'où le rendu : les bâtiments sont dessinés à **1,5 × la case** (ils débordent,
comme dans l'original) et chaque monstre porte son propre facteur `ech` dans
`config.js` — 0,42 pour le mouton, 0,80 pour le troll. Un creep dessiné presque
aussi gros qu'une tour est une erreur de rendu, pas une erreur de grille.

```sh
node tools/apercu-monstres.mjs planche.png   # les 8, deux images chacune
```


---

# Le terrain (`src/game/decor.js`)

Généré, jamais chargé. Deux couches, deux durées de vie :

- **L'herbe et son décor** sont cuits une fois dans un canvas hors écran — ils ne
  changent jamais de la partie.
- **Le sentier de terre battue** est recuit seulement quand la grille bouge,
  c'est-à-dire quand une tour est posée, vendue ou démolie.

Chaque case tire son décor d'un **hachage déterministe** de ses coordonnées : le
même terrain à chaque partie, sans consommer une seule valeur du RNG semé — que
le moteur réserve au gameplay.

## Deux règles apprises en le dessinant

**Les taches de teinte ne suivent pas la grille.** Une couleur par case, même
avec des verts très proches, et l'œil lit un damier au lieu d'une prairie. Le
fond est donc pavé par blocs de 0,7 case, décalés aléatoirement.

**Le décor reste sous les valeurs moyennes.** Pas de contraste fort, pas de
saturation : tout ce qui brille doit être un sprite ou une information. Les
cailloux ont une ombre portée pour se poser au sol, sinon ils flottent.

Le **sentier n'est pas de la décoration** : c'est de l'information. Il dit au
joueur où passe le flux, et il se redessine sous ses yeux quand il pose un mur.

## Quatre biomes, un par camp

Même principe que les bâtiments : mêmes formes, palettes différentes. Le terrain
dit à qui appartient la ligne avant même qu'on lise le nom en haut de l'écran.

| Camp | Biome | Ce qui le signe |
|---|---|---|
| Humain | **Prairie** | verts, cailloux gris, fleurs, buissons |
| Orc | **Terres rouges** | ocres secs, sentier de sable, crânes sur pieux |
| Mort-vivant | **Terre gâtée** | gris-violet, cendres, arbres morts, champignons verts |
| Elfe | **Sous-bois** | verts bleutés, mousse, champignons luminescents turquoise |

Un cinquième biome coûte une palette de huit teintes et **une** fonction de
décor (`PROPS`). Le reste est partagé.
