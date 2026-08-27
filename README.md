# LTW 7 Warnet

*(nom de code — provisoire, voir `docs/CONCEPTION-JEU.md` §10)*

Un tower defense mobile où **la seule façon de s'enrichir est d'attaquer
l'adversaire**. Chaque pièce d'or est un arbitrage : une tour de plus, ou un
monstre envoyé chez le voisin qui augmentera ton revenu pour toute la partie.
Les vies ne se perdent pas — **elles se volent**.

C'est la transposition de **Line Tower Wars**, mode de jeu Warcraft III joué sur
Battle.net depuis vingt ans. Le créneau : ce système n'a jamais eu
d'implémentation mobile sérieuse.

---

## Où lire quoi

| Fichier | Ce qu'on y trouve |
|---|---|
| **`docs/CONCEPTION-JEU.md`** | la conception : boucle, terrain, commandes, architecture, monétisation. **Commence par là.** |
| `docs/LTD7-DONNEES-REELLES.md` | les constantes extraites du code de la map d'origine |
| `docs/LTD7-CATALOGUE.md` | 9 bâtiments-monstres, 13 creeps, 33 tours, avec leurs vrais chiffres |
| `docs/LTD7-ARBRE.md` | l'arbre des technologies : 5 branches × 2 feuilles, payé en bois |
| `docs/REFERENCE-LTD.md` | le contexte, l'histoire de la famille de maps, la méta des joueurs |
| `data/ltw7-catalogue.json` | le catalogue en données, destiné à alimenter le moteur |
| `art/` | les 32 sprites 48 × 48, dessinés en code |
| `tools/` | extracteur de map Warcraft III, lecteur de table d'objets, aperçu PNG |

## Le principe directeur

**Fidélité par défaut.** La map `line_tower_wars_7_v1.12.w3m` a été désossée : on
a le script JASS et la table d'objets. Les chiffres ne sont donc pas devinés, ils
sont copiés. On ne s'écarte de l'original que là où c'est impossible — et chaque
écart est justifié par écrit dans la conception.

## État

La conception et les données sont complètes. **Le moteur n'existe pas encore** —
c'est la prochaine étape, et la seule qui porte un vrai risque technique.

Deux contraintes non négociables pour cette étape, parce qu'elles ne se
rattrapent pas après coup :

- **la logique pure séparée du rendu** (`src/engine`, `src/meta`, sans DOM) ;
- **un moteur déterministe** : entiers en virgule fixe, pas d'horloge système,
  aléatoire semé. C'est ce qui donne l'anti-triche serveur *et* le PvP
  asynchrone avec le même code.

## Refaire l'extraction

```sh
python3 tools/extract-w3x.py la_map.w3m extrait/
python3 tools/lire-w3u.py extrait/
```

La map elle-même n'est pas versionnée : c'est l'œuvre de son auteur. On garde les
chiffres relevés, pas le fichier.
