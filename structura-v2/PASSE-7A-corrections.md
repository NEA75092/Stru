# PASSE 7 — Section A, correctifs après revue du 28/07

Section A appliquée. Huit défauts sur captures, dans l'ordre de gravité.
Rien d'autre ne bouge : pas de section B-F, pas de nouvelle vue.

## 1. L'étape 1 est un mur de 4 écrans (bloquant)

Les trois anciennes étapes ont été concaténées en **une colonne** de champs pleine
largeur : on défile 4 hauteurs d'écran pour saisir un produit. C'est le défaut
d'origine, déplacé, pas corrigé.

- Les champs de l'étape 1 passent en **grille à 2 colonnes** :
  `grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4)`.
  Un champ long (sous-jacent, entité de référence) prend `grid-column: 1 / -1`.
- Chaque `.pitch-substep-title` ouvre un **bloc** : fond `--color-wash`,
  rayon `--radius-md`, padding `--space-5`, titre en tête du bloc. Plus un
  titre flottant dans un flux continu.
- Objectif mesurable : **l'étape 1 tient en 2 hauteurs d'écran maximum** en
  1440×900 pour une famille Phoenix complète.

## 2. Des titres de sous-groupes sans aucun champ

Captures 2, 4, 6, 7 : `SOUS-JACENT & DÉCRÉMENT`, `RAPPEL & DÉGRESSIVITÉ`,
`MÉCANISMES OPTIONNELS`, `BARRIÈRES BEARISH`, `TAUX, CALLABLE & RÉFÉRENCE`,
`CALENDRIER DE CALL & PÉRIODES` s'affichent **vides** — tous leurs
`.pitch-field` sont masqués par `data-families`.

Un `.pitch-substep-title` (et son bloc) est masqué dès qu'aucun `.pitch-field`
frère n'est visible. À faire dans `updatePitchProductFields()`, après le
filtrage des champs — pas en CSS.

## 3. La colonne d'aperçu défile avec le formulaire

Captures 2, 6, 7 : la carte d'aperçu et les boutons `Retour` / `Continuer`
partent en haut de page et laissent 800 px de vide à droite. Le CGP perd ses
boutons dès qu'il descend dans le formulaire.

- `.pitch-preview-pane` : `position: sticky; top: 0; height: 100vh;
  display: flex; flex-direction: column`.
- Les deux boutons sont en **pied de cette colonne** (`margin-top: auto`),
  donc toujours visibles.
- Le fil des 4 étapes (`#pitch-wizard-progress`) devient lui aussi collant en
  haut de la colonne de gauche : à l'étape 1, capture 1, il n'est plus visible.

## 4. La carte d'aperçu est vide et hors cadre

Les 4 lignes clés (`Coupon`, `Barrière coupon`, `Protection capital`,
`Premier rappel`) sont affichées **au-dessus** de la carte, et la carte contient
un vide de ~800 px avec « Générez un pitch pour afficher le deck. ».

- Les 4 lignes clés vivent **dans** `.pitch-preview-card`, sous le nom du
  produit, séparées par un filet `--color-divider`.
- `.pitch-preview-empty` : **320 px de haut maximum** (déjà demandé en passe 6),
  pas la hauteur restante.

## 5. Deux indicateurs d'étape concurrents

Le fil `1 Le produit / 2 Le contenu / 3 La mise en forme / 4 Présenter` (capture 5)
et le `Étape n sur 4` + tirets dans la colonne d'aperçu disent la même chose.

Garder **le fil seul**. Supprimer `#pitch-wizard-status` et la rangée de tirets
de la colonne d'aperçu (les tirets de pagination du deck, eux, restent dans la
carte d'aperçu — ce ne sont pas les mêmes).

## 6. Le sélecteur de couleur du cabinet est une barre noire

Capture 5 : `COULEUR DU CABINET` est un `input[type=color]` étiré sur toute la
largeur du formulaire, rendu comme un aplat noir. Le ramener à **44 × 44 px**,
rayon `--radius-sm`, avec la valeur hex affichée à côté en mono.

## 7. Le champ `LOGO DU CABINET` est un input natif brut

Même capture : `Parcourir… Aucun fichier sélectionné.` Reprendre le gabarit
`.btn` secondaire + nom de fichier à côté, hauteur 44 px comme les autres champs.

## 8. Ordre des feuilles — à confirmer, pas à deviner

`passe7.css` doit être chargé **après** `views.css`. Si `dashboard.css` est déjà
avant `views.css` dans `index.html`, alors l'ordre attendu est simplement :
`… views.css → passe7.css`. C'est le cas retenu. Aucun déplacement de
`dashboard.css`.

## Critères de sortie

- [ ] Étape 1 en 2 colonnes, ≤ 2 hauteurs d'écran en 1440×900 (Phoenix complet).
- [ ] Aucun titre de sous-groupe visible sans champ visible, sur les 5 familles.
- [ ] Aperçu + boutons collants : visibles à tout moment du défilement.
- [ ] 4 lignes clés dans la carte ; placeholder ≤ 320 px.
- [ ] Un seul indicateur d'étape.
- [ ] Couleur cabinet 44 × 44 px ; logo sur gabarit `.btn`.
- [ ] `npm test` vert, aucun `!important`, aucune couleur littérale.
