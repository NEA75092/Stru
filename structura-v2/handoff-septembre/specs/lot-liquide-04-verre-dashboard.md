# lot-liquide-04-verre-dashboard — donner son verre au premier plan

Version 2 · 31/08/2026 · dépend de `specs/00-doctrine-liquide.md`,
`specs/design-tokens-v3-liquide.md`, du correctif `lot-liquide-02b-correctif-nappe.md`
et de `lot-liquide-05-nappe-et-nuit.md`.
S'applique **après le LOT 5**, pas après le LOT 3.

## 0. Ce que la v2 annule

La v1 mettait **cinq** cartes en verre (le hero et les quatre KPI, chacune pour
elle-même) et écartait le cadre flottant. Deux erreurs de ma part :

- **L3 autorise trois cartes de verre par écran au maximum.** Cinq en font une
  vitrine. Le hero et la rangée de KPI sont **deux** cartes, pas cinq : les quatre
  KPI vivent dans un cadre flottant unique, qui est exactement l'usage que la
  maquette fait du cadre (l. 164-165).
- La v1 disait aussi « la carte du graphe ne passe pas en verre » **et** « si une
  carte est à cheval sur la limite, arrête-toi ». Elle est à cheval. C'est le LOT 5
  qui la range dans le plâtre ; ce lot n'y touche plus du tout.

## 1. Le défaut

Depuis le LOT 2, le Dashboard a de l'eau. Mais ce qui flotte dessus est resté mat et
opaque : le hero « Bonjour Marie » est une dalle crème posée sur la nappe, les quatre
KPI (PERFORMANCE LATENTE, CRITIQUE — BARRIÈRE FRANCHIE, SOUS SURVEILLANCE,
PORTEFEUILLE ACTIF) sont des rectangles blancs pleins.

C'est le pire des deux plans : ni verre, ni plâtre. La doctrine dit qu'une carte a
droit au `backdrop-filter` **si et seulement si** elle flotte au-dessus de l'eau. Ces
cartes flottent. Elles doivent être en verre.

## 2. Les deux niveaux de verre, mesurés sur la maquette

La maquette de référence — seule source de mesure — en emploie deux, et il faut les
distinguer :

**Cadre flottant** (l'enveloppe, plus légère) :

```
border-radius: var(--r-verre)            /* 24px */
border: 1px solid var(--flottant-brd)
background: var(--flottant)
backdrop-filter: blur(14px)
-webkit-backdrop-filter: blur(14px)
```

**Verre intérieur** (la carte lisible posée dans le cadre) :

```
border-radius: var(--r-dalle)            /* 20px */
border: 1px solid var(--verre-brd)
background: var(--verre)
backdrop-filter: blur(18px)
-webkit-backdrop-filter: blur(18px)
```

Valeurs des variables, jour puis nuit, telles qu'elles sont dans la maquette :

| Variable | Jour | Nuit |
|---|---|---|
| `--flottant` | `rgba(255,255,255,0.22)` | `rgba(255,255,255,0.10)` |
| `--flottant-brd` | `rgba(255,255,255,0.42)` | `rgba(255,255,255,0.20)` |
| `--verre` | `linear-gradient(155deg,rgba(255,255,255,.95),rgba(238,246,247,.87))` | `linear-gradient(155deg,rgba(30,42,52,.82),rgba(18,26,33,.74))` |
| `--verre-brd` | `rgba(255,255,255,.92)` | `rgba(255,255,255,.14)` |

**N'écris aucune de ces valeurs dans `dashboard.css`.** Emploie les tokens que le LOT 1
a créés pour elles. Si un des quatre n'a pas d'équivalent dans `design-tokens.css`,
**arrête-toi et dis lequel** — l'ajouter est une modification de la couche de tokens,
donc un autre lot. Ne recopie pas le littéral « juste pour cette fois ».

## 3. Ce qui passe en verre, et ce qui n'y passe pas

**Deux cartes de verre, pas cinq** (L3) :

| Carte | Traitement |
|---|---|
| le hero « Bonjour Marie » | **verre intérieur** seul |
| la rangée des quatre KPI | **cadre flottant** sur le conteneur de la rangée, **verre intérieur** sur chacun des quatre |

Le cadre flottant se pose sur le conteneur de grille **qui existe déjà** autour des
quatre KPI, avec son `padding: 12px`. **Aucune addition de DOM** : si aucun conteneur
n'enveloppe la rangée, **arrête-toi et dis-le** — je tranche entre l'ajout d'un niveau
de DOM et les quatre KPI en verre intérieur nu.

**Ne passent pas en verre** — elles sont dans le plâtre :

- la dalle « Performance du portefeuille », descendue dans le plâtre par le LOT 5 ;
- « Sous la protection du capital » et tout ce qui suit ;
- toute ligne de tableau, tout libellé de colonne.

Le test est unique et il n'a pas d'exception : **la carte est-elle entièrement dans les
640 px de la nappe ?** Oui → verre. Non → dalle mate, pleine opacité. Aucune carte ne
doit être à cheval — le LOT 5 l'a garanti ; si l'une l'est encore, le LOT 5 est
incomplet et tu t'arrêtes là plutôt que de peindre par-dessus.

## 4. Le repli quand le verre n'est pas disponible

`backdrop-filter` n'est pas garanti. Prévois le repli, sans le rendre visible aux
navigateurs qui savent :

```
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))
```

Dans ce cas, la carte prend `--verre` **sans** flou. Le dégradé est déjà à .95/.87
d'opacité en jour : la carte reste lisible sur l'eau sans aucun flou. Ne compense pas
par une couleur pleine inventée.

## 5. Le survol

Le relief vient d'un `translateY(-3px)` et d'une bordure claire. Sur les cartes de
verre :

```
transition: transform 280ms var(--ease)
:hover → transform: translateY(-3px)
```

Le survol se pose sur le **verre intérieur** — le hero, et chacun des quatre KPI — pas
sur le cadre flottant, qui ne bouge pas.

`--ease` est `cubic-bezier(0.16,1,0.3,1)` dans la maquette. Emploie le token, pas le
littéral. **Aucun `box-shadow`** — le LOT 3 vient précisément d'en purger l'app, ne
réintroduis pas ce qu'il a sorti.

Sous `prefers-reduced-motion: reduce`, la translation ne s'applique pas ; la bordure
claire suffit.

## 6. Ce qui ne bouge pas

Le contenu des cartes au caractère près : libellés, chiffres, sous-titres
(« −15,6 M€ vs encours initial », « Critique < 5 % · alerte 5–15 % », « 4 types ·
10 émetteurs »). Les couleurs de statut — rouge du 6, ambre du 5 — restent celles des
tokens de statut : **elles ne s'éclaircissent pas au motif d'être sur du verre.** Si un
chiffre de statut devient illisible sur le verre, c'est le verre qui est mal réglé, et
tu t'arrêtes.

Le graphe et ses barres d'écart de VL en encre monochrome : intouchés, et hors
périmètre depuis que le LOT 5 les a rangés dans le plâtre. Le code a eu raison sur ce
point.

## 7. Fichiers autorisés — un, plus le bump

| Fichier | Changement |
|---|---|
| `structura-v2/src/dashboard.css` | verre des deux cartes flottantes, survol, repli `@supports` |
| `structura-v2/index.html` | **uniquement** le bump `?v=` |

Aucun autre écran. Aucun autre fichier. **Aucune addition de DOM** : le cadre flottant
se pose sur un conteneur existant, cf. § 3.

## 8. Preuve

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 4
node structura-v2/handoff-septembre/tools/check-tokens.mjs
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Trois contrôles à ajouter à la sonde :

1. **zéro littéral de couleur** dans `dashboard.css` — tout passe par un token ;
2. **zéro `box-shadow`** dans `dashboard.css` (régression du LOT 3) ;
3. **`backdrop-filter` uniquement sur des sélecteurs du premier plan** — aucune règle
   de verre ne cible le graphe, un tableau ou une ligne.

Mesures DOM, jour **et** nuit : `backdrop-filter` calculé non vide sur le hero, sur le
conteneur de la rangée de KPI et sur les quatre KPI ; **vide** sur la dalle du graphe
et sur toute dalle du plâtre. Et le compte des éléments portant un `backdrop-filter`
non vide : **six** (1 hero + 1 cadre + 4 KPI), soit **deux cartes** au sens de L3.

Rapport : sorties brutes, sha, ces mesures, captures 1600 px jour + nuit du Dashboard,
**et une capture jour du Dashboard dans un navigateur sans `backdrop-filter`** (ou
avec la règle `@supports` forcée) pour montrer le repli du § 4.

## 9. Après ce lot

Le Dashboard est alors conforme à la maquette. Les huit autres écrans sont en plâtre
propre et cohérent, sans eau et sans verre — c'est un état fini, pas un état
intermédiaire. La question de savoir si un autre écran mérite sa nappe se pose écran
par écran, sur usage, et pas avant.
