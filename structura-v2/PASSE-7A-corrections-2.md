# PASSE 7 — Section A, deuxième passe de correctifs

Les 8 correctifs sont en place et l'étape 1 est lisible. Six défauts restants,
tous visuels, aucun structurel. Périmètre : `#view-autopitch`, `src/passe7.css`,
`src/app.js`.

## 1. L'en-tête collant n'a pas de fond — le contenu passe dessous

Captures 4 et 8 : le fil des 4 étapes est collant mais **transparent**. Les
champs défilent derrière lui et, pire, les flèches d'un `input[type=number]`
apparaissent **au-dessus** du fil (le petit spinner flottant en haut à droite).

- Le conteneur collant (`PITCH ENGINE` + `#pitch-wizard-progress`) reçoit
  `background: var(--color-surface-1)`, un `padding` vertical, un filet bas
  `1px solid var(--color-divider)` et un `z-index` **supérieur** à celui des
  champs.
- Vérifier en défilant 1200 px : aucun champ, aucun spinner, aucune ombre ne
  doit apparaître par-dessus le fil.

## 2. Les blocs à un seul champ gaspillent une demi-largeur

Captures 3, 6, 9 : `RAPPEL & DÉGRESSIVITÉ` (1 champ), `MÉCANISMES OPTIONNELS`
(1 champ), `CALENDRIER DE CALL & PÉRIODES` (1 champ) occupent chacun une bande
pleine largeur avec **la moitié droite vide**. C'est ce qui garde l'étape 1 à
deux hauteurs d'écran.

Règle : les blocs sont eux-mêmes posés dans une **grille à 2 colonnes**.
Un bloc qui contient **1 ou 2 champs** prend une colonne ; un bloc qui en
contient **3 ou plus** prend `grid-column: 1 / -1`. Objectif : l'étape 1 d'un
Phoenix complet **tient en une hauteur et demie** (≤ 1350 px en 1440×900).

## 3. La carte d'aperçu est une carte vide de 900 px

Les 4 lignes clés occupent 200 px en haut, puis ~900 px de vide avec
« Générez un pitch pour afficher le deck. » au milieu. Le plafond de 320 px a
été mis sur `.pitch-preview-empty`, mais **la carte** continue de s'étirer
(`flex: 1`).

- `.pitch-preview-card` se dimensionne **à son contenu** : plus de `flex: 1`.
- L'espace restant de la colonne reste vide (les boutons restent en pied via
  `margin-top: auto`), ou reçoit le futur bloc scénarios — pas une carte creuse.

## 4. Le titre de bloc ment selon la famille

Capture 8 (Bearish Taux) : le bloc `SOUS-JACENT & DÉCRÉMENT` contient
`TYPE BEARISH` et `VERSION BEARISH PHOENIX` — aucun rapport avec un décrément.
Même problème capture 9.

Les titres de blocs doivent être **neutres** ou dépendre de la famille :
`Mécanique du sous-jacent` plutôt que `Sous-jacent & décrément`. Un titre qui
ne décrit pas ses champs est pire qu'aucun titre.

## 5. `BARRIÈRE RAPPEL BEARISH (%)` vaut 2

Capture 9 : deux champs côte à côte, `BARRIÈRE RAPPEL BEARISH (%)` = **2** et
`BARRIÈRE COUPON BEARISH (%)` = **95**. Une barrière en pourcentage à 2 % est
soit une valeur par défaut fausse, soit un mauvais champ (un nombre de périodes
affiché comme un pourcentage). À trancher **en lisant `product-schema.js`**,
pas en changeant la valeur au hasard.

## 6. La couleur du cabinet par défaut est noire

Capture 1 : `#000000`. Le noir n'existe pas dans la palette. Défaut =
`--color-aegean` (`#1f6fb2`), et proposer 4 pastilles de la palette
(aegean, corail, encre, succès) à côté du sélecteur libre.

## Critères de sortie

- [ ] Rien ne passe au-dessus du fil d'étapes en défilant 1200 px.
- [ ] Étape 1 Phoenix ≤ 1350 px de haut ; aucun bloc à 1 champ en pleine largeur.
- [ ] La carte d'aperçu fait la hauteur de son contenu, pas celle de la colonne.
- [ ] Aucun titre de bloc contredit par ses champs, sur les 5 familles.
- [ ] Valeur par défaut de la barrière rappel bearish justifiée par le schéma.
- [ ] Couleur cabinet par défaut = aegean, 4 pastilles de palette.
- [ ] `npm test` vert.
