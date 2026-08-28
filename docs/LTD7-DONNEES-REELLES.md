# LTD 7 — les vraies données, extraites de la map

> **Source : `line_tower_wars_7_v1.12.w3m`**, désossée le 27 août 2026.
> Tout ce qui suit vient du script `war3map.j` (JASS) et de la table d'objets
> `war3map.w3u` de la map elle-même. **Ce ne sont plus des extraits de forum :
> c'est le code du jeu.**
>
> Ce document remplace, partout où il les contredit, les valeurs de
> `REFERENCE-LTD.md` §6 et §7.
>
> La map n'est pas versionnée ici (c'est l'œuvre de son auteur) — seuls les
> chiffres relevés le sont, et les outils qui permettent de refaire l'extraction.

---

## 1. Les constantes de départ

| Paramètre | Valeur | Où c'est écrit |
|---|---|---|
| **Vies** | **25** | `udg_Lives[i] = 25` |
| **Or de départ** | **100** | `SetPlayerStateBJ(…, RESOURCE_GOLD, 100)` |
| **Revenu de départ** | **25** | `udg_Income[i] = 25` |
| **Intervalle de revenu** | **10 secondes** | `StartTimerBJ(udg_Timer, true, 10.00)`, périodique |
| **Bois de départ** | **3** | `SetPlayerStateBJ(…, RESOURCE_LUMBER, 3)` — et le texte d'aide le répète |
| **Coût d'un déblocage** | **1 bois** | `ulum:1` sur les 15 unités d'achat (5 racines + 10 feuilles) |
| **Bois par joueur tué** | **+1** | `AdjustPlayerStateBJ(1, …, PLAYER_STATE_RESOURCE_LUMBER)` |
| **Lignes** | **7** | `gg_rct_Start_1` … `_7` |
| **Seuil anti-tortue** | **12 bâtiments** | `CountUnitsInGroup(…) < 12` — voir §5 quinquies, ce n'est **pas** un plafond d'unités |

⚠️ **Le tick est de 10 secondes, pas 15.** Les forums disaient 15 ; le code dit
10. Notre `CONCEPTION-JEU.md` partait sur 5 s pour des parties de 6 min — le
rapport reste cohérent, mais la référence était fausse.

Le versement est brutal et sans arrondi : `or += revenu`, pour chaque joueur,
toutes les 10 secondes.

---

## 2. La chaîne des lignes

`udg_Next[]` définit qui envoie à qui, en cercle. Deux détails qu'aucun guide ne
mentionne et qui changent le jeu :

**Un monstre qui sort n'est pas détruit.** Il est **téléporté au départ de la
ligne suivante** et continue sa route :

```jass
call SetUnitPositionLoc( GetTriggerUnit(), GetRandomLocInRect(udg_StartRegion[udg_NextLine]) )
call IssuePointOrderLocBJ( GetTriggerUnit(), "attack", GetRandomLocInRect(udg_EndRegion[udg_NextLine]) )
```

Un monstre bien lancé peut donc **voler une vie à plusieurs joueurs d'affilée**,
en traversant ligne après ligne, tant qu'on ne le tue pas. C'est énorme : une
défense trouée ne coûte pas une vie, elle en coûte une **à chaque joueur en aval
qui laisse passer à son tour**.

**La chaîne se recoud à la mort d'un joueur** : `udg_Next` est recalculé pour que
le cercle se referme sur les survivants.

---

## 3. Le vol de vie

```jass
set udg_Lives[victime] = udg_Lives[victime] - 1
set udg_Lives[envoyeur] = udg_Lives[envoyeur] + 1
```

Transfert strict, ±1. Messages : *« X stole a life from you »* / *« You stole a
life from X »*. À 0 vie le joueur est éliminé, ses unités sont supprimées, et son
tueur reçoit **1 bois**.

---

## 4. L'Anti Wall Machine — la réponse définitive

C'est **une seule unité neutre**, créée une fois au lancement, appartenant à un
joueur ordinateur (`Player(11)`), et nommée dans la map **« Anti cheating
system »** / **« Anti Wall Machine »**.

```jass
call CreateNUnitsAtLoc( 1, 'nkot', Player(11), … )
```

Sa fiche, telle qu'elle est dans `war3map.w3u` :

| Caractéristique | Valeur | Ce que ça veut dire |
|---|---|---|
| Capacités | **`Avul`** | **Invulnérable.** Les tours ne peuvent rien lui faire. |
| Points de vie | 500 000, régén. 1000/s | ceinture et bretelles |
| Dégâts | **998 (+3 dés)** ≈ 1000 | |
| Type d'attaque | **`msplash`**, rayon 200 | **dégâts de zone** |
| Cibles | **`structure` uniquement** | elle ne touche jamais une unité |
| Vitesse | **522** | le maximum du moteur Warcraft |

Son comportement, dans `war3map.j` :

- elle circule en boucle dans toutes les lignes, comme un monstre ;
- **elle ne vole aucune vie** — le code sort explicitement avant le bloc de vol
  quand l'unité appartient à `Player(11)` ;
- quand elle est bloquée, elle attaque le bâtiment qui la gêne. Le trigger
  `anti_wall` **attend 2 secondes puis lui réordonne d'avancer** — donc elle
  frappe, avance, refrappe si c'est encore fermé.

> **Traduction en langage de joueur :** environ 1000 points de dégâts de zone sur
> un rayon d'une case et demie, sur une machine invulnérable qui traverse à
> vitesse maximale. Les tours de la map ont entre 100 et 600 PV. **Elle n'ouvre
> pas une brèche : elle vaporise le pâté de tours.**

Le souvenir « il pouvait tout casser si ça l'énervait » était exact au sens
propre.

---

## 5. La liste d'envoi complète

`revenu` est stocké dans la « valeur » (point value) de l'unité, et ajouté au
revenu de l'envoyeur à l'achat.

| Unité | Or | Revenu | **Ratio** | PV | Vitesse |
|---|---:|---:|---:|---:|---:|
| Sheep | 5 | +1 | **0,200** | 5 | 270 |
| Frost Wolf | 10 | +2 | **0,200** | 40 | 300 |
| Acolyte | 50 | +8 | 0,160 | 200 | 270 |
| Footman | 75 | +12 | 0,160 | 250 | **370** |
| Mud Golem | 350 | +37 | 0,106 | 1 400 | 300 |
| Troll | 5 000 | +450 | 0,090 | 5 000 | 350 |
| Steam Tank | 30 000 | +2 500 | 0,083 | 100 000 | 270 |
| Infernal Boss | 40 000 | +3 000 | 0,075 | **350 000** | 270 |
| Frost Revenant | 50 000 | +3 300 | 0,066 | 110 000 | 350 |
| Water Elemental | 80 000 | +4 300 | 0,054 | 150 000 | 270 |

**Le ratio décroît strictement, de 0,200 à 0,054.** C'est le fait le plus utile
de tout ce document : le jeu d'origine tranche sans ambiguïté le débat que les
forums laissaient ouvert. **Les unités les moins chères rapportent quatre fois
plus de revenu par pièce d'or que les plus chères.**

D'où la forme de la courbe de jeu : on farme au Sheep et au Frost Wolf, et on
paye les grosses unités pour leur capacité à percer, en acceptant un rendement
économique dégradé. Acheter un Water Elemental, c'est convertir de l'économie en
menace.

Le **Footman** est l'exception intéressante : à 370 de vitesse, c'est la plus
rapide du bas de tableau. Il garde un ratio correct (0,160) tout en ayant une
vraie chance de percer. C'est le choix « je ne sais pas encore si j'attaque ou si
je farme ».

L'échelle est exponentielle : de 5 à 80 000 or, ×16 000. Une partie va très loin.

---

## 5 bis. Emprise au sol et échelle — combien de cases fait une tour ?

Question posée, et la map y répond sans ambiguïté.

**Une tour occupe une case entière, pas quatre.** Les bâtiments de la map
héritent du pathing par défaut des tours Warcraft, `4x4SimpleSolid.tga` — soit
4 × 4 cellules de pathing de 32 unités, c'est-à-dire **128 × 128 unités, une
tuile de terrain complète**. Les quatre bâtiments de menu de la map le
surchargent explicitement avec la même valeur, ce qui confirme la lecture.

**Un monstre, lui, n'a quasiment pas d'emprise** : `ucol = 1.0` pour toutes les
créatures envoyables — 19 unités sur 20 dans `war3map.w3u`, la vingtième étant
un mannequin de déblocage à 0. C'est un point. Les creeps se traversent entre
eux et se faufilent dans le moindre interstice — d'où le maze en serpentin
plutôt qu'en bouchon.

> **Conséquence pour nous :** on garde la règle telle quelle, parce qu'elle
> décide de la longueur du chemin et donc de tout l'équilibrage. Deux monstres
> envoyés au même pas occupent la même position dans la simulation. En revanche
> le **dessin** les décale — voir `ecartVisuel` — sinon une vague de vingt
> ressemble à un seul monstre un peu plus opaque que les autres.

| | Emprise au sol | Échelle du modèle |
|---|---|---|
| **Tours** | 1 case pleine (128 × 128) | **1,3 à 2,0** — Épine 1,5 · Sang 1,8 · Lame 2,0 · BOOM 2,0 |
| **Creeps** | collision 1.0 = un point | **0,5 à 1,5** — Loup de givre 0,5 · Centaure 1,0 · Élémentaire d'eau 1,5 |

> **La conclusion pour le rendu :** ce n'est pas la grille qu'il faut changer,
> c'est le rapport de taille à l'écran. Dans l'original **une tour est environ
> trois fois plus grosse qu'un creep**, et son modèle déborde de sa case. Un
> creep dessiné presque aussi gros qu'une tour est une erreur de rendu, pas une
> erreur de grille.

Et passer les tours à 2 × 2 serait **moins** fidèle, pas plus : ça diviserait par
quatre la finesse du labyrinthe (9 × 13 = 117 cases deviendraient 4 × 6
emplacements), ce qui viderait le mazing de sa substance — précisément la couche
de skill que le Contrôleur existe pour protéger.

---

## 5 sexies. Les effets spéciaux et les rayons de zone, champ par champ

Relevé dans `war3map.w3u`, pas dans les infobulles.

**Les capacités** (`uabi`) :

| Tour | Capacité | Ce que c'est | Chez nous |
|---|---|---|---|
| Ice Cream Merchant | `Afrb` | attaque de givre — ralentit | `ralentit:35` |
| Ultimate Ice Tower | `Afrb` | idem | `ralentit:40` |
| Electric Canon | `ACbh` | *Bash* — étourdissement | `etourdit:5` |
| Lightning Generator | `Alit` | attaque de foudre | dégâts purs |
| Magma Well | `Awfb` | projectile enflammé, étourdit | `etourdit:8` |
| Never Been Cleaned WC | `Aspo` | poison | `poison:40` + `ralentit:25` |
| Damned Tower | `Acri` | *Cripple* — affaiblissement | `ralentit:30` |
| Holy Lantern | `Afae` | *Faerie Fire* — réduit l'armure | `vulnerable:25` |

⚠️ Le `Acri` de la Tour damnée est un **ralentissement**, pas un surcroît de
dégâts : c'est l'erreur que faisaient les guides.

**Les rayons de zone** (champs d'arme). Trois rayons croissants : `ua1f` à
dégâts pleins, `ua1h` à dégâts moyens, `ua1q` à petits dégâts.

| Tour | Pleins | Moyens | Petits |
|---|---:|---:|---:|
| Crusher (Broyeur) | 200 | 200 | 200 |
| Barbecue · Magma Well · Septic Tank | 100 | 125 | 150 |
| Ultimate Water | 100 | 125 | 150 |
| Ultimate Ice | 200 | 300 | 400 |
| Enchanted Mushroom | 250 | 350 | 450 |
| BOOM Tower | 300 | 450 | 600 |
| Meteor Attractor | 400 | 600 | 800 |
| Anti Wall Machine | 200 | 200 | 200 |

> Notre moteur n'a qu'un rayon : on prend celui à **dégâts pleins**, le choix
> conservateur. Mes valeurs précédentes étaient estimées et toutes trop
> petites — Attracteur 200 au lieu de 400, Champignon 150 au lieu de 250.

---

## 5 ter. Le catalogue n'est pas un menu, c'est une chronologie

**La trouvaille la plus importante après l'Anti Wall Machine**, et elle était
cachée dans trois champs que j'avais ignorés : `usst`, `usma`, `usrg` — délai
d'ouverture, stock maximum, intervalle de recharge.

**Chaque monstre a une heure d'apparition.** On ne choisit pas dans une liste :
la liste s'ouvre au fil de la partie.

| Monstre | Disponible à | Stock max | Recharge |
|---|---:|---:|---:|
| Sheep | **5 s** | 20 | 2 s |
| Frost Wolf | 10 s | 15 | 3 s |
| Acolyte | 60 s | 10 | 5 s |
| Footman | 80 s | 10 | 5 s |
| Shadow (air) | 120 s | 20 | 7 s |
| Mud Golem | 140 s | 10 | 5 s |
| Demolition Machine | 160 s | 15 | 7 s |
| Troll | 330 s | 15 | 5 s |
| Banshee (air) | 390 s | 20 | 5 s |
| Steam Tank | 420 s | 15 | 5 s |
| Infernal Boss | 450 s | 10 | 7 s |
| Frost Wyrm (air) | 480 s | 10 | 10 s |
| Water Elemental | 510 s | 10 | 10 s |
| Goblin Shredder | 600 s | 10 | 10 s |
| Shadow Wolf | 700 s | 10 | 10 s |
| **Bandit Lord** | **800 s** | **3** | 15 s |

Ce que ça règle, et que je n'expliquais pas :

1. **Pourquoi on ne noie pas l'adversaire sous le meilleur ratio.** Le Sheep
   rapporte 0,200 par pièce d'or, mais son stock plafonne à 20 et se recharge
   toutes les 2 secondes. On ne peut pas en envoyer cent.
2. **Pourquoi une partie dure 30 à 60 minutes.** Ce n'est pas la courbe de coûts
   qui l'impose, c'est **la chronologie**. Le dernier monstre s'ouvre à 800 s :
   avant, il n'existe pas.
3. **Pourquoi la partie a une forme.** Chaque palier d'ouverture est un
   changement de phase — imposé par la map, pas par l'économie.

## 5 quater. Le Bandit Lord : un sacrifice, pas une blague

Je l'avais écarté comme une plaisanterie de l'auteur (100 000 or pour +3 de
revenu). C'était une erreur de lecture. Sa fiche :

| | |
|---|---|
| Points de vie | **150 000** — le deuxième plus élevé du jeu |
| Dégâts | 100 + 2d20, **à distance (300)** |
| Cibles | `debris,structure` — c'est un briseur |
| Armure | 8, régénération **1000/s** |
| Déplacement | `fort` — il passe partout |
| Capacités | dont `ANpi` (*Impale*), une attaque de **zone** |
| Disponible à | **800 s**, le plus tard du jeu |
| Stock | **3**, un toutes les 15 s |

Le +3 de revenu n'est pas un bug : **c'est le prix**. On ne l'envoie pas pour
s'enrichir, on l'envoie pour effacer une ligne — et on renonce à toute
l'économie que les 100 000 or auraient rapportée ailleurs (le Shadow Wolf, au
même prix, donne +6 000). C'est le seul achat du jeu qui soit **purement
offensif**, et il arrive au moment où les parties se décident.

---

## 5 quinquies. Relecture complète du JASS — ce que la première lecture avait manqué

Passe systématique sur les 37 triggers de la map. Quatre trouvailles, dont une
majeure.

### ⭐ Le doublement anti-tortue

**La trouvaille la plus importante de toute la relecture.** Dans
`Trig_spawn_Actions` :

```jass
if ( CountUnitsInGroup(GetUnitsOfPlayerAll(voisin)) < 12 ) then return
if ( IsUnitType(unite, UNIT_TYPE_MECHANICAL) == false ) then
    call CreateNUnitsAtLoc( 1, GetUnitTypeId(unite), ... )   // une DEUXIEME
```

Traduction : **si le défenseur possède douze unités ou plus — ses tours — tout
monstre non mécanique qu'on lui envoie arrive en double.**

C'est l'anti-tortue du jeu : **plus on se fortifie, plus on reçoit**. Et le
doublon n'entre pas par la zone d'apparition, donc **il ne rapporte pas de
revenu supplémentaire** : c'est un cadeau offensif pur.

> ⚠️ **J'avais lu ce 12 à l'envers.** J'en avais fait un plafond de douze
> monstres vivants par ligne, et j'avais bâti dessus tout un raisonnement sur
> « la place devient la ressource rare ». Ce plafond n'existe pas. Le 12 compte
> les **bâtiments du défenseur**, et il déclenche l'effet inverse d'un plafond.

Les cinq unités **mécaniques**, exclues du doublement : Golem de pierre,
Infernal, Bandit Lord, Char à vapeur, Broyeur gobelin. Les briseurs les plus
lourds ne sont pas doublés — seuls les creeps ordinaires le sont.

C'est ce mécanisme qui empêche la défense de gagner par accumulation, et son
absence expliquait à elle seule les parties interminables entre bots.

### Les effets de tours, lus dans le code plutôt que dans les infobulles

| Tour | Ce que fait vraiment le code |
|---|---|
| **Condensateur** | `vie × 0,80` — multiplicatif sur la vie **courante**, donc **il ne tue jamais**. Il ramène, il n'achève pas. |
| **La Mort** | `KillUnit()` — **tue net**, quels que soient les points de vie, puis se détruit. |
| **Tour BOUM** | se retire 0,1 s après son tir. Usage unique confirmé. |
| **Puits de magma** | lance `firebolt` — un étourdissement, pas des dégâts. |
| **Tour damnée** | lance `cripple` — un **ralentissement**, pas des dégâts bonus. |
| **Lanterne sacrée** | lance `faerie fire` — réduction d'armure, donc **dégâts subis majorés**. |
| **Fosse septique** | `vie × 0,95` toutes les 5 s pendant 30 s — un poison **en pourcentage**, redoutable sur les gros monstres et négligeable sur les petits. |
| **Téléporteur** | renvoie la cible au **départ de la ligne**, puis lui redonne l'ordre d'avancer. |

### L'achat de branche est à usage unique, et c'est le code qui le garantit

`Trig_Buy_Towers` : quand le bâtiment de branche (de type *sapper*) entre dans la
zone d'apparition, il est déplacé hors du plateau **et son type est rendu
indisponible au joueur** (`SetPlayerUnitAvailableBJ(..., false, ...)`). Une
branche ne s'achète donc qu'une fois.

### Deux garde-fous, pas des mécaniques

- **`Wood_Protector`** met le bois du joueur à zéro pendant une seconde à chaque
  début d'entraînement, puis le rend. C'est un correctif contre une double
  dépense du bois pendant qu'un achat est en cours — un bricolage propre au
  moteur Warcraft, sans intérêt pour nous.
- **`Untitled_Trigger_001`** donne 50 bois et 100 000 or au joueur 1. C'est un
  reste de débogage de l'auteur, pas une règle.

---

## 6. Les tours

55 bâtiments. Quelques repères de l'échelle basse, celle des premières minutes :

| Tour | Or | PV | Dégâts | Portée |
|---|---:|---:|---:|---:|
| Useless Tower | 10 | 100 | 8 | 500 |
| Sharp Tower | 10 | 250 | 18 | 150 |
| Pitiful Tower | 30 | 150 | 14 | 600 |
| Bloody Tower | 30 | 350 | 32 | 150 |
| Basic Tower | 120 | 200 | 22 | 700 |
| Canon Tower | 120 | 200 | 75 | 600 |
| Crusher | 120 | — | 154 | 150 |

La règle de conception est nette : **portée courte = gros dégâts, longue portée =
dégâts faibles**. 150 de portée, c'est le contact — donc les virages du maze.
700, c'est la couverture large.

Les tours avancées se paient **en bois**, pas en or (3 au départ, +1 par joueur
tué), ce qui en fait une ressource de progression et non d'économie.

Les infobulles écrites par l'auteur donnent aussi les effets, et ils sont plus
riches que ce qu'on avait supposé : ralentissement, dégâts de zone, poison sur
la durée, étourdissement, affaiblissement, dégâts en pourcentage de la vie
courante, **une tour qui se détruit après son premier tir** (1000 de dégâts,
zone gigantesque), et **une tour qui téléporte sa cible en haut de la ligne**.

---

## 7. Ce que ça change pour nous

1. **Le tick de revenu de la référence était faux** (10 s et non 15). Corrigé.
2. **Le ratio revenu/or décroissant est confirmé et chiffré.** On peut copier la
   forme de la courbe : ×4 d'écart entre le meilleur et le pire ratio.
3. **La règle « les vies sont un budget » est validée**, et pas seulement
   déduite : 25 vies pour une partie qui dure, avec des vols dans les deux sens.
4. **Le monstre qui survit continue sur la ligne suivante.** Mécanique majeure
   qu'on n'avait pas. À trancher : on la reprend ou pas ? Elle punit
   collectivement les défenses molles et crée des situations spectaculaires.
5. **L'Anti Wall Machine est un excellent modèle** : invulnérable (donc pas de
   parade à optimiser), ne vole pas de vie (donc pas de double peine), mais
   dévastatrice. C'est exactement l'équilibre qu'on visait en §4 de
   `CONCEPTION-JEU.md` — et le jeu d'origine avait déjà tranché dans le même sens.
6. **Les monstres envoyés attaquent, eux aussi, mais uniquement les structures**
   (`ua1g = structure` sur le Sheep, par exemple, 1 dégât). Ce n'est pas leur
   fonction : c'est ce qui les empêche de rester coincés. À vérifier plus
   finement si on veut le reproduire.

---

## 8. Refaire l'extraction

```sh
python3 tools/extract-w3x.py la_map.w3m extrait/
python3 tools/lire-w3u.py extrait/          # tables des unités et des tours
```

`tools/mpq_crypto.py` ajoute à mpyq le déchiffrement des fichiers MPQ et la
décompression PKWARE, sans lesquels la map ne s'ouvre pas — mpyq seul s'arrête
sur `NotImplementedError: Encryption is not supported yet`.
