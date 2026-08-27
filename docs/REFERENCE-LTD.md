# LTD 7 (Line Tower Wars) — note de référence

> Ce que c'est, comment ça marche, et ce qu'on en garde pour le jeu mobile.
> Rédigé le 26 août 2026 à partir de sources publiques (voir §14).
>
> ## ⚠️ Document dépassé sur les chiffres — voir `LTD7-DONNEES-REELLES.md`
>
> La map `line_tower_wars_7_v1.12.w3m` a été récupérée et désossée le 27 août
> 2026. **Les valeurs numériques viennent désormais du code du jeu**, pas de ce
> document. Ce fichier reste utile pour le contexte, l'histoire de la famille de
> maps et la méta des joueurs — mais dès qu'un chiffre est en jeu, c'est l'autre
> qui fait foi. Notamment : **le tick de revenu est de 10 s, pas 15**.
>
> ---
>
> **Fiabilité de ce qui reste — à lire avant de faire confiance à un chiffre.**
> **Aucune page de ce document n'a été ouverte directement.** L'accès réseau de
> l'environnement de dev bloque hiveworkshop, epicwar, w3reforged, ENT,
> maultactics et les forums Blizzard. Tout vient d'extraits renvoyés par un
> moteur de recherche, recoupés entre eux. Les liens de §14 sont donc des
> **pistes à vérifier**, pas des sources lues.
>
> En pratique :
> - **§2 à §5 (les mécaniques)** : solides, recoupées par plusieurs pages
>   consacrées à LTW.
> - **§6 (les chiffres)** : ordres de grandeur. Ils varient d'une version à
>   l'autre.
> - **§7 (la méta)** : la plus fragile — « Tower Wars » désigne trois jeux
>   différents et les recherches les mélangent. Chaque point y porte sa mention
>   de fiabilité.
>
> **Une heure sur un vrai PC** avec le jeu ouvert et l'éditeur de map vaudrait
> plus que tout ce document pour les valeurs numériques.

---

## 1. De quoi on parle exactement

« LTD 7 » désigne **Line Tower Wars 7**, dont la déclinaison compétitive
s'appelle **« Line Tower Wars 7 Ranked »** — « le Line Tower Wars classique pour
les joueurs compétitifs », avec rangs et suivi de statistiques. C'est une map
personnalisée Warcraft III, jouée sur Battle.net, d'une famille qui porte
plusieurs noms selon la branche :

| Nom | Ce que c'est |
|---|---|
| **Line Tower Wars (LTW)** | la branche originale, celle qui nous intéresse |
| **Line Tower Wars 7 / 7 Ranked** | la version « classique » avec ELO et stats — le « LTD 7 » |
| **Line Tower Wars: Reforged** | remake moderne (jusqu'à 15 joueurs, leaderboard saisonnier in-game, premier de la famille à intégrer un système de rating) |
| **Team Line Tower Wars (TLTW)** | variante par équipes |
| **LTW – Evolution**, **Line Tower Defense RR** | forks divers |

⚠️ **Ne pas confondre avec Legion TD.** Legion TD partage l'idée d'envoyer des
unités à l'adversaire, mais les unités s'y battent toutes seules et **il n'y a
pas de maze**. Dans LTW, on construit un labyrinthe et les tours tirent. Les deux
sont souvent appelés « LTD » par les joueurs — ce document parle **uniquement**
de la branche Line Tower Wars.

---

## 2. La boucle de jeu

Chaque joueur possède **son propre couloir** (sa « line ») : une entrée d'un
côté, une sortie de l'autre. Deux choses se passent en même temps, en continu —
il n'y a **pas de vagues** comme dans un TD classique.

1. **Tu construis des tours dans ton couloir** pour arrêter ce qui arrive.
2. **Tu achètes des creeps qui partent chez ton voisin** — pas chez toi.

Le sens du flux est fixe : **tu envoies au joueur à ta droite, tu reçois du
joueur à ta gauche**. La chaîne est circulaire, donc personne n'attaque et ne
défend contre la même personne.

**Vies et vol de vies.** Chaque joueur démarre avec un stock de vies. Un creep
qui traverse tout un couloir et atteint la sortie fait **perdre une vie au
défenseur et en fait gagner une à celui qui l'a envoyé**. Ce n'est pas juste des
dégâts : c'est un **transfert**. On appelle ça un *leak* (une fuite).

**Fin de partie.** À 0 vie, tu es éliminé. **Le dernier en vie gagne.**

---

## 3. La double économie — le vrai cœur du jeu

C'est ce qui distingue LTW de tous les TD classiques, et c'est ce qu'il faut
garder à tout prix.

Il y a **deux ressources** :

- **L'or** — se dépense immédiatement, en tours *ou* en creeps.
- **Le revenu (income)** — un montant qui **s'ajoute à ton or à intervalle
  régulier** (~15 secondes). Le revenu ne se dépense pas, il se construit.

**Le seul moyen d'augmenter son revenu est d'envoyer des creeps chez le voisin.**
Acheter un creep, c'est donc à la fois une attaque et un investissement
économique. D'où le dilemme permanent :

> Chaque pièce d'or dépensée en tour est une pièce qui n'a pas augmenté ton
> revenu. Chaque pièce dépensée en creep est une pièce qui n'a pas renforcé ta
> défense. Et pendant que tu hésites, ton voisin de gauche envoie.

Le dilemme se dédouble à l'intérieur même du choix « creep » :

- **Les creeps faibles donnent le meilleur revenu par pièce d'or**, mais meurent
  vite et ne volent quasiment jamais de vie → achat purement économique.
- **Les creeps forts ou rapides donnent moins de revenu par pièce d'or**, mais
  percent → achat offensif. Les creeps rapides sont particulièrement efficaces
  pour voler des vies : ils passent moins de temps sous le feu des tours.

La courbe d'une partie typique :
**début** défense minimale, on ne veut pas leak tôt → **milieu** course au
revenu, on envoie en masse → **fin** l'or afflue, on achète les grosses tours et
on essaie de percer.

**Boule de neige et retour.** Le revenu compose : celui qui prend de l'avance
creuse l'écart. Mais le vol de vies coupe dans les deux sens — un joueur à 3 vies
qui réussit à percer récupère du stock sur le dos de son voisin. Le système est
explosif, pas linéaire.

---

## 4. Le mazing (le labyrinthe)

Le couloir est **une zone de construction libre**, pas un chemin tracé. Les
creeps cherchent leur route eux-mêmes.

- **On ne ferme pas — et c'est une unité neutre qui le fait respecter.** Dans
  LTW, **« il y a une unité qui attaque les bâtiments si tu bloques »**. Elle
  patrouille, les creeps envoyés **n'attaquent jamais rien** eux-mêmes, et le
  conseil que tous les guides répètent est le même : *« ne bloque pas un mur
  complet, laisse toujours une demi-case libre, sinon l'anti-triche vient
  détruire tes tours — et elles coûtent cher »*.
- **La sanction est volontairement brutale**, et c'est ce qui garde le jeu
  centré sur le mazing : bloquer n'est pas une ligne de jeu alternative, c'est
  une bêtise coûteuse.
- ⚠️ **La famille voisine fait l'inverse.** Dans *Wintermaul Wars*, ce sont
  **les creeps eux-mêmes qui attaquent** quand on bloque — donc bloquer y est
  une vraie stratégie. Les deux écoles existent ; LTW a choisi la première.
- **Le vrai skill est de construire jusqu'à la limite sans la franchir** : les
  bons mazeurs empilent mur après mur et s'arrêtent **une case avant** celle qui
  scellerait la sortie.
- **Le but est donc d'allonger le trajet**, pas de le fermer : on force les
  creeps à parcourir des allées en serpentin sous le feu des tours.
- **Barricades.** Le builder (un paysan) peut poser des barricades bon marché
  qui servent de murs, et qui **s'améliorent ensuite en n'importe quelle tour de
  base**. La technique standard consiste à **spammer du bâtiment basique** pour
  dessiner la forme du maze, puis à revendre plus tard ce qui ne sert plus.
- **Placement.** Tours de mêlée sur les **virages** (les creeps y passent au
  contact), tours à distance ailleurs.

Le maze, c'est la couche de skill mécanique du jeu : deux joueurs avec le même or
n'obtiennent pas du tout la même défense.

---

## 5. Tours, technologies, tours élémentaires

Dans les versions modernes (Reforged), l'échelle est très large : **plus de 100
tours et 36 creeps** différents à envoyer.

**Cinq technologies** structurent l'arbre : **Feu, Glace, Foudre, Lumière,
Ténèbres**. On les recherche et on les **combine** pour débloquer des tours plus
puissantes.

**Les tours élémentaires** sont le sommet de l'arbre :

- ce sont les plus fortes du jeu ;
- **on ne peut en posséder qu'une seule à la fois** ;
- **la première amélioration d'une tour élémentaire est gratuite**.

**Les wisps de technologie** donnent accès aux améliorations élémentaires. On les
obtient de deux façons :

- **en tuant un joueur** (en lui volant sa dernière vie) → récompense au kill ;
- **en en achetant un**, à un coût volontairement dissuasif : il faut 100 000 de
  revenu et 100 000 d'or, **et l'achat fait perdre 100 000 de revenu**.

C'est un design intéressant : la récompense de fin de partie est aussi un
accélérateur, ce qui pousse à finir les joueurs affaiblis au lieu de farmer.

---

## 6. Chiffres indicatifs (varient selon la version)

> **Périmé.** Les vraies valeurs de LTW 7 v1.12 sont dans
> `LTD7-DONNEES-REELLES.md` §1. Notamment : vies 25 ✅, revenu de départ 25 ✅,
> mais **tick de 10 s et non 15**, et 7 lignes et non 8.

| Paramètre | Valeur observée | Remarque |
|---|---|---|
| Vies de départ | **20, 25 ou 30** | dépend de la version / du mode |
| Revenu de départ | **25** | |
| Intervalle de revenu | **~15 secondes** | |
| Joueurs | **jusqu'à 8** en classique, **15** en Reforged | |
| Nombre de tours | **100+** en Reforged | |
| Creeps envoyables | **36** en Reforged | |
| Durée d'une partie | **30 à 60 minutes** | ⚠️ voir §12 |
| Tour élémentaire (base) | **200 or** | avant améliorations ; 1ʳᵉ amélioration gratuite |
| Part de l'or investie en envois (méta joueurs) | **~60 %** | ~1/3 gardé pour les tours |
| Exemple de creep haut de gamme | Giant Wolf : 90 000 PV, coûte 33 000 or, rapporte 2 200 de revenu | montre l'échelle exponentielle de fin de partie |

Les modes ranked (LTW 7 Ranked, Reforged) ajoutent **ELO, saisons et
leaderboard**, suivis in-game et sur wc3stats.

---

## 7. Ce que dit la communauté (forums, guides, hostbots)

Les mécaniques ci-dessus décrivent le système. Ce que les joueurs en ont tiré,
lui, est plus instructif pour un game designer.

> ⚠️ **Lisez d'abord ceci.** Cette section est la moins fiable du document, pour
> une raison précise : **« Tower Wars » est le nom d'au moins trois jeux
> différents.** Il y a *Line Tower Wars* (la map Warcraft III, notre sujet),
> *Tower Wars* (un jeu Steam de 2012), et *TowerWars* (un mini-jeu Minecraft sur
> Hypixel). Une recherche sur « tower wars strategy » ramène les trois mélangés,
> et comme je n'ai pas pu **ouvrir** les pages — seulement lire des extraits —
> je ne peux pas toujours dire de quel jeu vient une phrase.
>
> Chaque point ci-dessous porte donc une mention : **[LTW]** quand la source est
> une page consacrée à Line Tower Wars, **[à vérifier]** quand la phrase vient
> d'une recherche qui mélangeait les trois. Les points *[à vérifier]* restent
> intéressants comme intuitions de game design — ils ne sont simplement pas des
> faits établis sur LTW.

### Le ratio revenu/or n'est pas uniforme — **[LTW]**

Les joueurs calculent, pour chaque creep, **revenu obtenu ÷ or dépensé**. Et
selon les maps, ce sont tantôt les unités les moins chères, tantôt les plus
chères, qui donnent le meilleur ratio. C'est le levier de réglage n°1 du jeu :
la courbe de ce ratio détermine à elle seule le rythme des parties.

### On maze, on ne bloque pas — **[LTW]**

Le conseil est unanime et répété partout : **ne jamais fermer un mur complet**,
toujours laisser une demi-case libre, sinon l'unité anti-triche vient détruire
les tours. Le jeu consiste à allonger le trajet au maximum **sans franchir cette
limite** (détail en §4).

### Poser vite, spammer, revendre — **[LTW]**

En début de partie, poser ses bâtiments très vite pour ne pas leaker tôt, sans
hésiter à **spammer du bâtiment basique** pour dessiner la forme du maze : on
revend plus tard ce qui ne sert plus.

### Le ratio revenu/or décroît — **[confirmé par le code]**

Le débat « ce sont les unités chères ou les unités bon marché qui rapportent le
plus ? » est tranché : dans LTW 7, le ratio va de **0,200** (Sheep, 5 or) à
**0,054** (Water Elemental, 80 000 or), en décroissance stricte. Table complète
dans `LTD7-DONNEES-REELLES.md` §5.

### La règle des deux tiers — **[à vérifier]**

Un partage or/creeps souvent cité : **~60 % de l'or en envois, ~1/3 pour les
tours**. ⚠️ Cette phrase vient très probablement d'un guide de *Tower Wars*
(Steam) ou du *TowerWars* d'Hypixel, **pas de LTW**. Elle reste une piste utile
— un jeu où l'arbitrage se stabilise autour d'un ratio net est un jeu bien
réglé — mais ce n'est pas un chiffre à reprendre tel quel.

### Le leak volontaire — **[à vérifier]**

L'idée que les joueurs *calculent combien ils peuvent se permettre de laisser
passer* plutôt que de tout arrêter, parce que surconstruire étouffe l'économie.
⚠️ Même réserve de provenance. **Mais elle est cohérente avec la mécanique
établie de LTW** : les vies s'y volent au lieu de se perdre, donc elles sont
structurellement une ressource et pas une barre de santé. On la garde comme
principe de design (la barre de vies est un budget, cf. `CONCEPTION-JEU.md`),
en sachant qu'on l'a déduite plutôt que constatée.

### Lire l'adversaire — **[à vérifier]**

Regarder ce que l'autre a envoyé et **l'espacement** de ses envois, puis
construire en conséquence ; épargner puis envoyer groupé pour saturer une
défense calibrée sur un flux régulier. ⚠️ Provenance incertaine, mais le
mécanisme est générique à tous les jeux d'envoi et ne dépend d'aucune règle
propre à LTW.

### Reconstruire son maze — **[à vérifier]**

Vendre et reconstruire un mur pour **changer quelle sortie est ouverte** :
exploit dans certains rulesets, jeu avancé dans d'autres. ⚠️ Vient de la
littérature *maul* en général, pas d'une page LTW. À trancher explicitement dans
nos règles de toute façon, parce que les joueurs le trouveront.

### Premiers envois — **[à vérifier]**

« Commencer par les unités les moins chères (zombies) ». ⚠️ Le mot *zombies*
trahit une source Hypixel. Le **principe** (ouvrir avec le meilleur ratio
revenu/or, sans chercher l'impact offensif) découle en revanche directement du
point [LTW] en tête de section.

---

## 8. Les modes de partie (options d'hébergement)

La version LTW – Evolution, hébergée par les bots **ENT Gaming**, expose une
liste de modes que l'hôte active au lancement. Elle vaut le détour : c'est une
liste de tous les axes sur lesquels le jeu peut être tordu, testée pendant des
années.

| Mode | Effet |
|---|---|
| `-noattacker` (`-ns`) | pas d'envois du tout → TD coopératif pur |
| `-noair` (`-na`) | pas d'unités aériennes (elles ignorent le maze) |
| `-gold`, `-life` | or et vies de départ paramétrables |
| `-alltechs` (`-at`) | toutes les technologies débloquées d'entrée |
| `-fastmode` (`-fm`) | partie accélérée |
| `-streamincome` (`-si`) | **revenu versé en continu au lieu des paliers de 15 s** |
| `-hardgame` (`-hg`) | difficulté accrue |
| `-nolimits` (`-nl`) | suppression des limites (une tour élémentaire max, etc.) |
| `-randomspawn` (`-rs`) | point d'apparition aléatoire |
| `-randomtech` (`-rt`) | technologies tirées au sort |
| `-terrainsnow` (`-ts`) | cosmétique |

Deux enseignements pour nous :

1. **`-streamincome` existe.** Le tick de 15 s est un choix, pas une nécessité.
   Sur mobile, un revenu continu (jauge qui monte) est probablement plus lisible
   qu'un versement discret — à tester, ça change le tempo.
2. **`-noattacker` prouve que le TD solo tient debout** sans la couche PvP. C'est
   notre mode d'apprentissage tout trouvé.

Les versions récentes ont aussi **une IA** explicitement conçue pour que les
nouveaux apprennent contre l'ordinateur. Le besoin d'un onboarding hors PvP est
donc reconnu depuis longtemps dans cette famille de jeux.

---

## 9. Le paysage mobile actuel

Recherche faite sur les stores : **personne n'occupe vraiment la place.**

- Les TD PvP mobiles existants (**Random Dice**, **Defenders 2**, **Toy
  Defense**, **Tower War – Tactical Conquest**) sont soit des TD à decks/cartes,
  soit de la capture de tours à la « Galcon ». **Aucun ne reprend la double
  économie or/revenu ni le vol de vies.**
- **Fortline: Tower Wars** (App Store) est ce qui s'en rapproche le plus par le
  nom ; à examiner de près avant de figer notre design.
- **Line War** (App Store / Steam) n'a rien à voir malgré le nom : c'est de la
  capture de tours reliées par des lignes, avec des power-ups.
- **Line Tower Wars** existe en version navigateur sur Kongregate (vieille, en
  Flash) — la démonstration que le concept s'adapte hors de WC3.

Conclusion : le concept a **20 ans de validation communautaire** et **aucune
implémentation mobile sérieuse**. C'est le bon signal.

---

## 10. Glossaire

| Terme | Sens |
|---|---|
| **Line / lane** | le couloir d'un joueur |
| **Leak** | un creep qui traverse et vole une vie |
| **Send** | acheter un creep pour l'envoyer chez le voisin |
| **Income** | le revenu périodique, augmenté uniquement par les envois |
| **Maze** | le labyrinthe formé par les tours |
| **Block** | fermer complètement le passage — interdit |
| **Builder** | l'unité qui construit (un paysan) |
| **Wisp de tech** | la clé des tours élémentaires |

---
## 11. Pourquoi ce jeu tient depuis 20 ans

Vaut la peine d'être explicite, parce que c'est ce qu'il faut réussir à copier :

1. **Chaque décision est un arbitrage à somme nulle.** Or défensif contre or
   économique, sur une horloge qui tourne.
2. **Ton adversaire est un joueur, pas un script.** Ce qui arrive dans ton
   couloir a été acheté par quelqu'un qui pense.
3. **Deux couches de skill distinctes** : l'économie (quoi acheter, quand) et la
   mécanique (comment poser le maze). On peut être bon dans une et mauvais dans
   l'autre.
4. **Pas de temps mort.** Pas de vagues, pas de phase de préparation : le flux
   est continu et asymétrique (on n'attaque pas celui qui nous attaque).
5. **Les retours sont possibles**, parce que les vies se volent au lieu de se
   perdre.

---

## 12. Transposition mobile — ce qui passe et ce qui casse

### Ce qu'on garde absolument

- **La double économie or / revenu** : c'est le jeu.
- **Le vol de vies** : c'est ce qui rend le PvP direct et cruel.
- **Le maze libre** : c'est la couche de skill mécanique.
- **L'asymétrie du flux** (j'attaque A, je suis attaqué par B), si le format le permet.

### Ce qui casse tel quel

| Problème | Détail | Piste |
|---|---|---|
| **Durée** | 30-60 min est inacceptable en mobile | viser **5 à 8 minutes** : moins de vies, tick de revenu plus rapide, courbe de coûts raccourcie |
| **Contrôle du maze** | poser un labyrinthe à la souris sur un écran de 6 pouces | grille **volontairement grossière** (genre 8×12), pose au tap, zoom limité voire absent |
| **8 à 15 joueurs simultanés** | matchmaking impossible sur un jeu neuf sans base de joueurs | **1v1**, ou 1 joueur + 3 bots dans une chaîne à 4 |
| **100+ tours, 36 creeps** | illisible sur mobile, et infaisable en solo dev | **8 à 12 tours**, 3 paliers, **6 à 8 creeps** |
| **Temps réel en réseau** | coûteux, fragile, et vide sans joueurs en ligne | voir ci-dessous |

### La piste qui colle à l'architecture existante

La recette PING PIOU impose déjà **la logique pure séparée du rendu**
(`src/engine`, `src/meta`, sans DOM) pour que **le serveur puisse rejouer les
parties** en anti-triche. Ce choix ouvre gratuitement une option précieuse ici :

> **Le PvP asynchrone.** Je ne joue pas contre toi en direct : je joue contre
> **la séquence d'envois que tu as jouée** dans ta partie. Le serveur la stocke,
> me la rejoue, et compare les résultats.

Avantages : pas de serveur temps réel, pas de matchmaking en ligne à peupler, ça
marche à 3 h du matin avec 4 joueurs actifs, et le moteur déterministe qu'on doit
écrire de toute façon pour l'anti-triche **est** l'infrastructure du mode.
Un moteur en **ticks discrets et déterministes** est donc à écrire dès la
première ligne — pas rétro-adaptable.

---

## 13. Décisions à trancher avant de coder

1. **Format** : 1v1 asynchrone (fantôme), solo contre chaîne de bots, ou les deux
   (solo pour apprendre, async pour rejouer) ?
2. **Longueur de partie cible** et donc nombre de vies + cadence du tick.
3. **Grille** : taille exacte, et est-ce que le maze est libre ou semi-guidé ?
4. **Monétisation** : la recette PING PIOU (pubs AdMob + achats RevenueCat +
   diamants) se transpose, mais un jeu compétitif supporte mal le pay-to-win →
   à cadrer tôt, ça contraint le design.
5. **Nom, `applicationId` `com.capitainemuffin.<jeu>`** — définitif dès la
   première publication.

---

## 14. Sources

Pages consultées via recherche web (l'accès direct à ces domaines est bloqué par
le proxy de l'environnement de dev — recoupement fait sur les extraits) :

- [Line Tower Wars 7 Ranked — base de maps w3reforged](https://maps.w3reforged.com/maps/categories/tower-defense-td/Line%20Tower%20Wars%207%20Ranked)
- [Line Tower Wars: Reforged — map en vedette, w3reforged](https://maps.w3reforged.com/featured-maps/line-tower-wars-reforged)
- [Line Tower Wars: Reforged — Hive Workshop](https://www.hiveworkshop.com/threads/line-tower-wars-reforged.354130/)
- [Line Tower Wars — Warcraft 3 Wiki (gaming-tools)](https://gaming-tools.com/warcraft-3/line-tower-wars/)
- [Complete Line Tower Wars guide — forums Blizzard Warcraft III: Reforged](https://us.forums.blizzard.com/en/warcraft3/t/complete-line-tower-wars-guide/21972)
- [Line Tower Wars v18.5.01 — Hive Workshop](https://www.hiveworkshop.com/threads/line-tower-wars-v18-5-01.250346/)
- [Line Tower Wars 7 — Epic War](https://www.epicwar.com/maps/261120/)
- [Line Tower Wars Walkthrough — Ayumilove](https://ayumilove.wordpress.com/2009/04/16/line-tower-wars-walkthrough-tower-defense/)
- [Line Tower Defense RR 1.3 — wc3maps](https://wc3maps.com/map/101333)
- [Mazing: the complete guide to maze tower-defense — Maul Tactics](https://maultactics.gg/articles/mazing-guide)
- [TD like wintermaul wars or line tower wars — Hive Workshop](https://www.hiveworkshop.com/threads/td-like-wintermaul-wars-or-line-tower-wars-help.186061/)
- [Anti blocking trigger for mazing TD — Hive Workshop](https://www.hiveworkshop.com/threads/anti-blocking-trigger-for-mazing-td.42701/)
- [Line Tower Wars: Anti-block trigger malfunctioning — The Helper](https://www.thehelper.net/threads/line-tower-wars-anti-block-trigger-malfunctioning.72608/)
- [Wintermaul Wars: the WC3 map that invented a genre — Maul Tactics](https://maultactics.gg/articles/wintermaul-wars-history)
- [Line Tower Wars — The Helper (forum)](https://www.thehelper.net/threads/line-tower-wars.51602/)
- [Tower War, how to do it right — Hive Workshop (forum)](https://www.hiveworkshop.com/threads/tower-war-how-to-do-it-right.195461/)
- [Tower Wars — guides et discussions stratégie, Steam Community](https://steamcommunity.com/app/214360/discussions/1/846944689658891175/)
- [Updates for the LTW hostbot — ENT Gaming (forum)](https://entgaming.net/forum/viewtopic.php?t=21636)
- [Line Tower Wars – Evolution v1.67 → v2.34 — ENT Gaming (forum)](https://entgaming.net/forum/viewtopic.php?t=65266)
- [LTW – Evolution v2.43 — Hive Workshop](https://www.hiveworkshop.com/threads/ltw-evolution-v2-43.209564/)
- [LTW – Evolution : voler les vies des autres joueurs — Softpedia](https://news.softpedia.com/news/LTW-Evolution-Steal-the-lives-of-other-players-in-order-to-survive-114711.shtml)
- [Complete Line Tower Wars guide (Reforged) — YouTube](https://www.youtube.com/watch?v=icXbPcIjNWE)
- [Line Tower Wars — version navigateur, Kongregate](https://www.kongregate.com/en/games/xweaselx/line-tower-wars)
- [Fortline: Tower Wars — App Store](https://apps.apple.com/us/app/fortline-tower-wars/id1444911339)
- [Line War — App Store](https://apps.apple.com/us/app/line-war/id6621242703)
