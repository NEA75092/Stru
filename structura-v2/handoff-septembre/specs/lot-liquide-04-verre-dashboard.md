# lot-liquide-04-verre-dashboard — donner son verre au premier plan

Version 1 · 25/08/2026 · dépend de `specs/00-doctrine-liquide.md`,
`specs/design-tokens-v3-liquide.md` et du correctif `lot-liquide-02b-correctif-nappe.md`.
S'applique **après** le LOT 3.

## 1. Le défaut

Depuis le LOT 2, le Dashboard a de l'eau. Mais ce qui flotte dessus est resté mat et
opaque : le hero « Bonsoir Marie » est une dalle crème posée sur la nappe, les quatre
KPI (PERFORMANCE LATENTE, CRITIQUE — BARRIÈRE FRANCHIE, SOUS SURVEILLANCE,
PORTEFEUILLE ACTIF) sont des rectangles blancs pleins.

C'est le pire des deux plans : ni verre, ni plâtre. La doctrine dit qu'une carte a
droit au `backdrop-filter` **si et seulement si** elle flotte au-dessus de l'eau. Ces
cinq cartes flottent. Elles doivent être en verre.

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

**En verre intérieur** : les quatre cartes KPI, et le hero « Bonsoir Marie ».

**En cadre flottant** : rien pour l'instant. La maquette emploie le cadre autour d'un
groupe de cartes ; le Dashboard du dépôt n'a pas ce regroupement, et l'introduire est
une modification de structure. Reste au verre intérieur seul.

**Ne passent pas en verre** — elles sont sous la nappe, dans le plâtre :

- le graphe « Performance du portefeuille » et son cadre ;
- « Sous la protection du capital » et tout ce qui suit ;
- toute ligne de tableau, tout libellé de colonne.

Le test est unique et il n'a pas d'exception : **la carte est-elle dans les 640 px de
la nappe ?** Oui → verre. Non → dalle mate, pleine opacité. Si une carte est à cheval
sur la limite, arrête-toi et décris-la : c'est un problème de gabarit, pas de peinture.

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

Le relief vient d'un `translateY(-3px)` et d'une bordure claire. Sur ces cinq cartes :

```
transition: transform 160ms var(--ease)
:hover → transform: translateY(-3px)
```

`--ease` est `cubic-bezier(0.16,1,0.3,1)` dans la maquette. Emploie le token, pas le
littéral. **Aucun `box-shadow`** — le LOT 3 vient précisément d'en purger l'app, ne
réintroduis pas ce qu'il a sorti.

Sous `prefers-reduced-motion: reduce`, la translation ne s'applique pas ; la bordure
claire suffit.

## 6. Ce qui ne bouge pas

Le contenu des cartes au caractère près : libellés, chiffres, sous-titres
(« −16,8 M€ vs encours initial », « Critique < 5 % · alerte 5–15 % », « 4 types ·
10 émetteurs »). Les couleurs de statut — rouge du 6, ambre du 7 — restent celles des
tokens de statut : **elles ne s'éclaircissent pas au motif d'être sur du verre.** Si un
chiffre de statut devient illisible sur le verre, c'est le verre qui est mal réglé, et
tu t'arrêtes.

Le graphe et ses barres d'écart de VL en encre monochrome : intouchés. Le code a eu
raison sur ce point.

## 7. Fichiers autorisés — un, plus le bump

| Fichier | Changement |
|---|---|
| `structura-v2/src/dashboard.css` | verre des cinq cartes flottantes, survol, repli `@supports` |
| `structura-v2/index.html` | **uniquement** le bump `?v=` |

Aucun autre écran. Aucun autre fichier. Aucune addition de DOM : si le verre exige un
élément enveloppant, **arrête-toi** — c'est le cadre flottant du § 3, écarté exprès.

## 8. Preuve

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 4
node structura-v2/handoff-septembre/tools/check-tokens.mjs
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Trois contrôles à ajouter à la sonde :

1. **zéro littéral de couleur** dans `dashboard.css` — tout passe par un token ;
2. **zéro `box-shadow`** dans `dashboard.css` (régression du LOT 3) ;
3. **`backdrop-filter` uniquement sur des sélecteurs du haut de page** — aucune règle
   de verre ne cible le graphe, un tableau ou une ligne.

Mesures DOM : `backdrop-filter` calculé non vide sur les cinq cartes, et vide sur le
cadre du graphe.

Rapport : sorties brutes, sha, ces mesures, captures 1600 px jour + nuit du Dashboard,
**et une capture jour du Dashboard dans un navigateur sans `backdrop-filter`** (ou
avec la règle `@supports` forcée) pour montrer le repli du § 4.

## 9. Après ce lot

Le Dashboard est alors conforme à la maquette. Les huit autres écrans sont en plâtre
propre et cohérent, sans eau et sans verre — c'est un état fini, pas un état
intermédiaire. La question de savoir si un autre écran mérite sa nappe se pose écran
par écran, sur usage, et pas avant.
