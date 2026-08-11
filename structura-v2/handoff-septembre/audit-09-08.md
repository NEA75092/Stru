# Audit — sources de vérité et périmètre · 09/08/2026

Demandé après le rapport du lot 1. Lu au dépôt `NEA75092/Stru@a1c3c30` (`index.html`,
`src/passe7.css`, `src/views.css`, `src/controls.css`, `src/design-tokens.css`,
`src/modules/app-calendar.js`) et dans `handoff-septembre/`. Chaque constat porte sa preuve
en fichier + ligne. Rien n'est corrigé sans le dire.

**Verdict court.** L'implémenteur ne fabule pas : il lit ce que le dépôt contient. Le problème
est que le dépôt contient **deux fois la même spec**, **une maquette de référence absente**, et
**neuf documents périmés que rien n'interdit d'ouvrir**. Trois causes, six constats.

---

## A1 — Le gabarit de contrôles est spécifié DEUX fois, sans perdant nommé

`specs/dashboard.md § 2.4` et `specs/controles.md` décrivent le même composant, avec des
invariants quasi identiques (62/54, flèches 50 px, bloc 208 px, actif en trait bas 2 px).
Aucun des deux ne dit lequel gagne — **R4 non appliquée, et par moi.**

Le code, lui, a déjà choisi : il cite la version Dashboard.

| Preuve | Contenu |
|---|---|
| `src/views.css:376` | `/* 50 px de large, cellule à part entière de .control-band (specs/dashboard.md § 2.4) */` |
| `src/modules/app-calendar.js:733` | `// Compteur de .control-band (specs/dashboard.md § 2.4)` |

**Conséquence directe sur le lot 2 :** le message du lot 2 redonne `dashboard.md` en entier.
L'implémenteur relira donc le § 2.4 et pourra retoucher le composant qu'on vient de clore —
avec une spec concurrente sous la main, dans le même fichier qu'on lui demande d'appliquer.

**Corrigé maintenant :** le § 2.4 de `dashboard.md` est remplacé par un renvoi d'une ligne à
`controles.md`, qui devient la seule source. Perdant nommé : le § 2.4.

---

## A2 — « Deux bandes 62/54 sur les quatre vues » est faux, et ma spec rendait le contraire indémontrable

`index.html` au dépôt :

| Vue | Ligne | Contenu réel de `.control-stack` |
|---|---|---|
| Portefeuille | 308–309 | `.control-band-sub` **seul** (54 px) |
| Barrières | 425–426 | `.control-band-sub` **seul** |
| Clients | 668–669 | `.control-band-sub` **seul** |
| Calendrier | 465–466 | `.control-band` **+** `.control-band-sub` |

Et `src/passe7.css:512-514` l'écrit lui-même : `.control-band` « 62 px, période + modes,
**seulement là où une période existe : Calendrier** ».

Donc le § 1 de `controles.md` (« deux barres, jamais une ») et son § 5 (« les quatre vues
rendent le même `offsetHeight` de rang 1 (62) ») décrivent un état que le code n'a jamais eu et
qu'une vue sans période **ne doit pas** avoir : Portefeuille n'a pas de mois à afficher.

Le rapport les déclare pourtant verts. Ce n'est pas un mensonge, c'est une preuve qui n'existe
pas : la sonde du § 5 n'est pas outillée (O4), « conforme » voulait dire « regardé à l'œil ».
**Une spec dont la preuve n'est pas exécutable revient toujours verte.**

**Corrigé maintenant :** § 1 et § 5 de `controles.md` distinguent le rang de période
(conditionnel, Calendrier seul aujourd'hui) du rang de recherche (obligatoire, les quatre vues).

---

## A3 — La maquette de référence n'est pas dans le dépôt, et l'outil en mesure une autre

`CLAUDE.md` et `specs/00-doctrine.md` nomment `Dashboard.dc.html` comme rendu cible.

1. `handoff-septembre/maquette/` au dépôt ne contient que `Structura.dc.html` (154 Ko) et
   `support.js`. **`Dashboard.dc.html` n'y est pas** : l'implémenteur ne peut pas l'ouvrir.
2. `tools/calque.mjs:30-32` mesure en dur `../maquette/Structura.dc.html`. Toute preuve de
   calque du lot 2 portera donc sur une maquette que la doctrine déclare non-référence.

C'est la panne du 07/08 (R1 : « ce qui n'est pas poussé n'existe pas ») appliquée à la maquette
au lieu de la spec, et le contrôle automatique qui certifie le mauvais fichier.

**Corrigé maintenant :** `Dashboard.dc.html` + `support.js` copiés dans
`handoff-septembre/maquette/` (à committer), et `calque.mjs` prend un `--maquette <fichier>`
avec `Dashboard.dc.html` par défaut.

**Reste à trancher (une décision, pas un correctif) :** `Structura.dc.html` est une maquette
« toute l'app », ce que la règle 3 de `CLAUDE.md` interdit. Soit elle est déclarée périmée et
supprimée, soit la règle 3 change. Aujourd'hui les deux coexistent — c'est R3 non appliquée.

---

## A7 — Le handoff existe à DEUX endroits, et je travaillais dans le mauvais

Constaté le 09/08 en relisant l'arbre du dépôt, après signalement.

| Où | Quoi |
|---|---|
| Dépôt | `structura-v2/handoff-septembre/…` — **le seul que Claude Code lit** |
| Poste design | `handoff-septembre/…` **à la racine du projet** — ma copie de travail |

Les deux ne sont reliés par rien : chaque livraison passe par une recopie à la main. Tant que
la recopie est faite, ça marche ; le jour où elle est oubliée, je spécifie contre un fichier que
personne ne lit — **la panne du 07/08, avec un chemin au lieu d'un commit**.

Pire, tous les messages de lot que j'ai écrits disent `handoff-septembre/specs/<ecran>.md`.
Depuis la racine du dépôt, ce chemin **n'existe pas**. Il ne résout que si Claude Code se trouve
déjà dans `structura-v2/`. Il a donc raison de lire « ceux qui sont dans structura-v2 » : c'est
le seul endroit où ils sont.

**Corrigé :** la copie de travail est déplacée sous `structura-v2/handoff-septembre/`, un seul
chemin partout, et les messages de lot portent désormais le chemin **complet depuis la racine du
dépôt**.

---

## A8 — Un handoff dans un dossier de téléchargement n'existe pas

Tu en vois dans « download ». Je ne peux ni les lire ni les nommer : je ne vois que le dépôt et
ce projet. Claude Code non plus — il ne lit que le dépôt.

Ce n'est donc pas un cas particulier, c'est **R1 mot pour mot** : un document hors dépôt ne
gouverne rien, ne se cite pas dans une spec, et ne peut pas être « lu par erreur ». Le risque
n'est pas qu'il les lise — c'est que **nous** croyions qu'ils font foi.

**Contenu constaté (capture du 09/08, 18:57) — tranché, rien à récupérer :**

| Élément | Date | Verdict |
|---|---|---|
| `handoff-septembre/` | 06/08 18:19 | export dézippé de `Structura Pro…ement App.zip` (même minute). **Antérieur à `00-doctrine.md`, `controles.md`, les deux correctifs Dashboard.** À jeter |
| `handoff-septembre 2/` | 09/08 15:47 | même chose, dézippé de `…App(1).zip`. Le « 2 » est le suffixe macOS d'un second dézippage. À jeter |
| `pitch-engine.md` | 06/08 23:53 | la version d'avant sa mise au dépôt (github.md la notait « pas dans le dépôt, R1 »). Elle y est. À jeter |
| Les deux `.zip` | 06/08 · 09/08 | exports du projet. À jeter |

Aucun n'a jamais été lu par Claude Code — il ne voit que le dépôt. Le risque était entièrement
de notre côté : ouvrir le fichier le plus proche au lieu du vrai. C'est la panne du 07/08.

---

## A4 — Onze documents périmés vivent dans le dépôt, à portée de `grep`

| Fichier | Taille | Statut |
|---|---|---|
| `structura-v2/PASSE-1..6.md` | ~70 Ko | périmés (D-doctrine les écrase) |
| `structura-v2/PASSE-7A-corrections{,-2}.md` | 8 Ko | périmés |
| `structura-v2/handoff 7/PASSE-8.md` | 15,9 Ko | **le piège principal — voir ci-dessous** |
| `structura-v2/handoff 7/REFERENCE-PRODUITS.md` | 3,5 Ko | périmé |
| `specs/dashboard-correctif-01.md` | 15 Ko | absorbé par la spec + le correctif 02 |
| `structura-v2/CLAUDE.md` | 17,8 Ko | **autre** fichier que le `CLAUDE.md` du projet design |

Le § 4 du contrat dit « on ne donne qu'une spec à la fois ». Il gouverne ce qu'on **donne**, pas
ce qu'on **trouve**. Un implémenteur qui cherche « control-band » ou « barrière » tombe sur des
documents qui contredisent la doctrine, et rien dans le dépôt ne dit qu'ils sont morts.

**`PASSE-8.md` n'est pas périmé pour le code — il en est encore la source citée.**
`src/design-tokens.css` renvoie à « passe 8, §1.2 », « passe 8, §1.1 », « passe 8, §1.3 » dans
ses propres commentaires, et `passe7.css` cite « passe 7, section C ». Un implémenteur qui veut
comprendre un token suit la citation et atterrit dans `handoff 7/PASSE-8.md`, c'est-à-dire
exactement le document que `00-doctrine.md` prétend écraser. **Ce n'est pas une erreur de
lecture de sa part : c'est le code qui l'y envoie.** Tant que ces commentaires citent la passe 8,
l'archiver ne suffit pas — il faut réécrire les citations en « specs/00-doctrine.md, D-n ».

**À faire, côté dépôt (je ne peux pas pousser) :** `git mv` des huit premiers vers
`archive/` + un `archive/LISEZ-MOI.md` d'une ligne : « périmé, ne sert qu'à l'historique ;
la vérité est dans handoff-septembre/specs ». Le `structura-v2/CLAUDE.md` demande un arbitrage :
deux fichiers du même nom disant des choses différentes, c'est la garantie d'une divergence.

---

## A5 — Le « composant unique » vit dans trois feuilles, dont une que la spec ne nomme jamais

| Feuille | Ce qu'elle porte |
|---|---|
| `src/passe7.css` § C (l.512-720) | `.control-stack`, `.control-band`, `.control-band-sub`, `.seg-item` |
| `src/views.css` (l.372-410) | flèches 50 px, cellule de recherche |
| `src/controls.css` (l.56-75) | `.search` **38 px**, et `.f-inp/.f-sel` **44 px** |

`controls.css` n'apparaît dans aucune spec. Sa hauteur de champ (38) est un invariant du
gabarit qui vit hors du gabarit, avec son propre commentaire « passe 7, section C » — donc une
quatrième source de vérité sur la même barre. Le grep « aucune hauteur locale » du rapport est
juste **par vue** et faux **par composant**.

**À faire au lot suivant qui touche cette zone :** `controles.md` nomme les trois feuilles et
dit laquelle porte quoi. Pas maintenant : le lot 1 est clos, on ne rouvre pas (R6).

---

## A6 — Côté design, la vérité est recopiée trois fois

`structura-v2/index.html` (copie locale du dépôt), `handoff-septembre/maquette/Structura.dc.html`,
`Dashboard.dc.html`, plus 282 captures dans `uploads/`. Aucune n'est datée par rapport aux
autres. C'est la même faute que A3, à l'échelle du poste de travail : on croit lire le dépôt, on
lit une copie.

**Règle que je m'ajoute :** avant chaque maquette, la lecture se fait **au dépôt** (comme pour
`design-tokens.css`, R2), et la copie locale n'est qu'un cache — jamais une source citée dans
une spec.

---

## Ce que ça change pour le lot 2

Le lot 2 reste **go**, avec trois garde-fous ajoutés au message :
§ 2.4 hors périmètre (renvoyé à `controles.md`), `dashboard-correctif-01.md` et les PASSE-*
nommés explicitement comme périmés, et le calque lancé sur `Dashboard.dc.html` — qui doit donc
partir dans le même commit que les specs.
