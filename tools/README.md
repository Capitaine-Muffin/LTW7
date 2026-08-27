# Outils

## `extract-w3x.py` — ouvrir une map Warcraft III

Une map `.w3x` / `.w3m` est une archive **MPQ** précédée d'un en-tête de 512 octets.
Ce script l'ouvre et en sort les fichiers lisibles.

```sh
python3 tools/extract-w3x.py chemin/vers/la_map.w3x extrait/
```

Ce qu'on vient y chercher, par ordre d'intérêt :

| Fichier | Contenu |
|---|---|
| `war3map.j` | **le script JASS** — les vraies constantes : or de départ, revenu, vies, coût de chaque creep, comportement exact de l'anti-block. La source de vérité. |
| `war3map.wts` | table des chaînes : noms et infobulles des unités et des tours |
| `war3map.w3u` / `.w3t` | unités et objets personnalisés (binaire, éditeur d'objets) |
| `war3map.w3i` | réglages de la map : joueurs, équipes, forces |

**Limite connue.** `mpyq` gère les secteurs compressés en zlib et bzip2, mais **pas
la compression PKWARE « implode »**, courante dans les maps de l'époque. Si
l'extraction ressort vide, c'est presque sûrement ça — il faudra alors écrire un
décodeur DCL. C'est faisable, mais ce n'est pas une ligne de code.

### `mpyq.py` — dépendance embarquée

Copie de [mpyq](https://pypi.org/project/mpyq/) 0.2.5 (licence BSD, voir
`mpyq.LICENSE`). Embarquée parce que `pip install mpyq` échoue à la construction
du paquet sur les Python récents, alors que le module lui-même fonctionne très
bien. Aucune modification.
