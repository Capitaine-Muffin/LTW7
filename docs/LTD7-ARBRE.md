# LTW 7 — l'arbre des tours

> Reconstruit depuis `war3map.w3u` (champs `ureq` « requiert » et `uupt`
> « s'améliore en »). C'est la pièce qui manquait : **les 33 tours ne sont pas
> 33 choix, c'est une chaîne d'améliorations à cinq branches.**

---

## Le principe

On ne construit que **deux tours** dans une partie. Tout le reste est de
l'amélioration **sur place**, sur la tour déjà posée. À aucun moment le joueur ne
choisit parmi trente entrées.

Et l'accès aux branches se paie **en bois**, pas en or : 3 au départ, +1 par
joueur tué. C'est une ressource rare et non renouvelable par l'économie — donc
un vrai choix de spécialisation, définitif pour la partie.

---

## La chaîne d'or (aucun bois requis)

```
Useless Tower  10 or  ──▶  Pitiful Tower  30 or  ──┬──▶  Canon Tower   120 or
  (portée 500)                (portée 600)         └──▶  Basic Tower   120 or

Sharp Tower    10 or  ──▶  Bloody Tower   30 or  ──┬──▶  Crusher       120 or
  (portée 150)                (portée 150)         └──▶  Lame Tower    120 or

Elemental Tower  200 or   (directement constructible)
```

Deux familles dès la première pose : **longue portée** (Useless → Pitiful) et
**contact** (Sharp → Bloody), soit les deux rôles du mazing — les tours de
contact aux virages, les longues portées ailleurs.

## Le pivot : les cinq tours élémentaires

**Les six tours à 120-200 or débouchent toutes sur les cinq mêmes élémentaires.**
Et elles coûtent **0 or** :

| Élémentaire | Branche requise | Effet |
|---|---|---|
| **Barbecue** | Fire Towers | 100 dég., petite zone |
| **Ice Cream Merchant** | Cold Towers | 75 dég., **ralentit** |
| **Short Circuit** | Static Towers | 100 dég., cadence 60/min |
| **Little Bird** | Light Towers | 250 dég., cadence 24/min |
| **Never Been Cleaned WC** | Dark Towers | 60 dég. **+40 poison / 4 s**, ralentit |

> C'est le fameux **« la première amélioration d'une tour élémentaire est
> gratuite »** que répétaient les guides. Confirmé par le code : `or = 0`.
> La branche, elle, a coûté 1 bois.

## Puis une tour à 800, puis deux feuilles

Chaque élémentaire monte en une seule tour à **800 or**, qui ouvre à son tour
**deux feuilles** — chacune derrière **1 bois supplémentaire**.

| Branche | 0 or | 800 or | Feuilles (1 bois chacune) |
|---|---|---|---|
| 🔥 **Fire** | Barbecue | **Magma Well** — 250 dég., étourdit | **BOOM Tower** · **Meteor Attractor** |
| ❄️ **Cold** | Ice Cream Merchant | **Blessed Water** — 300 dég. | **Ultimate Water** · **Ultimate Ice** |
| ⚡ **Static** | Short Circuit | **Electric Canon** — 150 dég., étourdit | **Lightning Generator** · **Condenser** |
| 🌑 **Dark** | Never Been Cleaned WC | **Damned Tower** — 250 dég., affaiblit | **The Death** · **Septic Tank** |
| ✨ **Light** | Little Bird | **Holy Lantern** — 300 dég., lucioles | **Enchanted Mushroom** · **Teleport Tower** |

Structure parfaitement symétrique : **5 branches × 2 feuilles = 10 tours de
fin de partie**, et jamais plus de deux options ouvertes à la fois sur une tour.

---

## Le budget en bois

| | |
|---|---|
| Départ | **3 bois** |
| Gain | **+1 par joueur tué** |
| Coût d'une racine (Fire, Cold, Static, Light, Dark) | **1 bois** |
| Coût d'une feuille | **1 bois**, et sa racine doit être achetée |

Donc, avec les 3 bois du départ :

- **3 racines** → trois élémentaires gratuites, aucune feuille. Polyvalent, plafonné.
- **1 racine + 2 feuilles** → une branche complète. Spécialisé, redoutable en fin de partie.
- **2 racines + 1 feuille** → l'entre-deux.

Le texte d'aide de la map ne dit pas autre chose : *« Vous démarrez avec 3 bois,
utilisables pour acheter les tours avancées. **Choisissez bien !** Assurez-vous
d'avoir une tour Uber ! Vous obtenez plus de bois en éliminant les autres
joueurs. »*

Et comme le bois vient des kills, **la spécialisation récompense l'agression** :
le joueur qui finit ses voisins est le seul qui débloque tout l'arbre.

---

## Ce que ça règle pour nous

**Le problème des « 33 tours dans une boutique tactile » n'existe pas.** La
boutique Bâtiments ne contient que **trois entrées** : Useless (10), Sharp (10),
Elemental (200). Tout le reste se joue **en appuyant sur une tour déjà posée**,
avec au plus deux améliorations proposées à la fois.

Il faut donc **trois menus**, et pas deux :

1. **Monstres** — les envois (deux pages : basique / avancé, comme la map).
2. **Bâtiments** — trois entrées seulement.
3. **Technologies** — l'arbre en bois, ouvert rarement, à décisions lourdes.

Le troisième est celui qui porte l'identité stratégique de la partie : c'est là
qu'on choisit qui on va être.
