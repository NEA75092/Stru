# spec — Pitch Engine

06/08/2026 (soir) · sur `9220bc1` · maquette : `maquette/Structura.dc.html`, onglet Pitch Engine

## Ce que cette spec dit, en une phrase

**L'ossature de l'app est juste et ne bouge pas.** Le pas-à-pas en 4 étapes, la colonne
d'aperçu collante de 460 px, le récapitulatif de l'étape 4 et la bascule plein écran
sont l'aboutissement de sept correctifs datés (`PASSE-7A-corrections.md`,
`PASSE-7A-corrections-2.md`) ; ma maquette les avait remplacés par un flux en colonne
unique. **C'est la maquette qui est corrigée.** Reste la finition typographique et
l'aboutissement du PDF — le seul livrable du plan qui n'existe pas encore.

---

## 1. Rendu cible

`maquette/Structura.dc.html`, onglet Pitch Engine, **après application du § 5**.
Tant que le § 5 n'est pas appliqué, la maquette est en désaccord avec cette spec sur
la disposition ; la spec fait foi, pas la maquette.

---

## 2. Ce qui est déjà conforme et ne bouge pas

Relevé dans `src/passe7.css` et `index.html` en les lisant, pas de mémoire :

| Élément | Où | État |
|---|---|---|
| Grille de la vue, aperçu à 460 px | `#autopitch-grid` | conforme |
| Bascule plein écran | `#autopitch-grid.pitch-fullscreen`, `#pitch-fullscreen-btn` | conforme |
| Colonne d'aperçu collante, pied jamais poussé hors champ | `.pitch-preview-pane`, `.pitch-preview-nav { margin-top: auto }` | conforme |
| En-tête + fil des étapes collants, opaques | `.pitch-header-sticky` | conforme |
| Décalage de défilement calculé à chaud | `pitchSyncHeaderOffset()`, `--pitch-header-h` | conforme |
| Étape 1 en deux colonnes, blocs élargis à ≥ 3 champs | `.pitch-field-grid`, `.pitch-step-blocks`, `.pitch-substep-block-wide` | conforme |
| Une ligne cochable = une page du document | `.pitch-block`, `.pitch-block-pages` | conforme |
| Vignettes de slides, pas un mur de texte | `.pitch-slide-thumb`, `.pitch-slide-line-kv` | conforme |
| Récap de l'étape 4 avec « Modifier » | `.pitch-recap-row`, `#pitch-recap-*` | conforme |
| Couleur de marque en 44 × 44 + hex mono | `.pitch-color-field`, `.pitch-color-input` | conforme |
| Rayon des cartes | `--radius-md` vaut **2 px** dans `design-tokens.css:140` | conforme — ne pas « corriger » |

> **Vérifié avant d'écrire, contre mon propre soupçon** : j'allais signaler les
> `border-radius: var(--radius-md)` de `passe7.css` comme un reste de la passe 7
> arrondie. Les trois tokens de rayon valent 2 px depuis la passe 8. Le nom trompe,
> la valeur est bonne. Aucune règle à toucher.

---

## 3. Invariants mesurables — ce qui reste à faire

### 3.1 Finition (mesurable au navigateur)

| # | Invariant | Valeur attendue |
|---|---|---|
| P1 | Titre d'écran (`.pitch-task-question`) | `--font-heading`, **200**, 46 px, `letter-spacing: -0.03em` — pas `600` / `--text-xl` |
| P2 | Sur-titre « PITCH ENGINE » | `--font-mono-data`, 10,5 px, `letter-spacing: 0.18em`, `--color-text-tertiary` |
| P3 | Libellé de champ | `--font-mono-data`, 10 px, `0.14em`, capitales, `--color-text-tertiary` |
| P4 | Hauteur de champ et de bouton d'étape | **42 px** — champs, `Continuer`, boutons du pied |
| P5 | Creux d'un champ | `inset 0 0 0 1px var(--color-border)`, `inset 0 2px 4px -3px var(--color-border-strong)` sur `--color-surface-2` ; au survol, l'anneau passe à `--color-border-strong` |
| P6 | Case cochée de l'étape 2 | carré 18 px, `--color-accent` plein, glyphe en `--chaux`. **Supprimer `accent-color`** : la case native ne porte ni le rayon ni l'anneau du système |
| P7 | Survol d'une ligne d'étape 2 | `inset 2px 0 0 var(--color-accent)` + fond `--color-surface-2` — jamais `border-color` |
| P8 | Étape active du fil | anneau `inset 0 0 0 1px var(--color-border-strong)`, pastille du numéro pleine en `--color-accent`, texte `--color-ink` |
| P9 | Aperçu de couverture | `aspect-ratio: 16 / 9`, fond `--chaux`, filet 2 px × 46 px en `--color-accent` en pied |

### 3.2 Le PDF — le seul livrable manquant du plan

| # | Invariant | Valeur attendue |
|---|---|---|
| P10 | `Télécharger le PDF` produit un fichier | un PDF réellement ouvert, sans retouche manuelle |
| P11 | Page du document | **1212 × 682 px** exactement, aucun `flex` qui déborde |
| P12 | Nombre de pages | égal à la somme des `.pitch-block-pages` des blocs cochés |
| P13 | Couleur de marque | seule couleur du document hors encre ; l'interface Structura n'y met aucun token de rôle |
| P14 | Un bloc décoché | n'apparaît nulle part dans le PDF, ni en page, ni en sommaire |

P10 à P14 sont la preuve de fin de la semaine 18 → 24 août du `plan-septembre.md`.
C'est le différenciateur de la démo : tout le reste de cette spec est de la finition,
celle-ci est le produit.

---

## 4. Règles à supprimer

| Fichier | Sélecteur | Raison |
|---|---|---|
| `src/passe7.css` | `.pitch-block-box input { accent-color }` | remplacé par la case dessinée de P6 |
| `src/passe7.css` | `.pitch-block:hover { border-color: var(--color-accent) }` | remplacé par l'arête interne de P7 |
| `src/views.css` | `.pitch-wizard-step.active` / `.pitch-wizard-step.done .pitch-wizard-step-num` | à réécrire selon P8 — supprimer, pas surcharger |

Rien d'autre. En particulier, **ne pas toucher** `.pitch-preview-pane`,
`.pitch-header-sticky`, `#autopitch-grid` ni `html:has(#view-autopitch.active)` :
chacune corrige un défaut constaté en usage, aucun ne se voit sur une capture.

---

## 5. Corrections portées sur la maquette — faites le 06/08 au soir

La maquette montrait un flux en colonne unique, un aperçu qui n'apparaissait qu'à
l'étape 3, et aucun récapitulatif. Les trois étaient faux, et corrigés dans
`maquette/Structura.dc.html` :

1. Colonne d'aperçu de **460 px permanente**, collante, présente aux étapes 1 à 3.
2. `Retour` / `Continuer` dans le pied de cette colonne, `Continuer` en `flex: 1`.
   Le libellé devient « Générer le document » à l'étape 3.
3. Étape 4 hors grille (équivalent de `.pitch-fullscreen`), précédée du récapitulatif
   en quatre cellules avec « Modifier » qui renvoie à l'étape concernée.

La maquette et cette spec disent maintenant la même chose : `tools/calque.mjs` peut
être lancé sur cet écran.

---

## 6. Ce qui n'est pas dans cette spec

L'export PPTX (le bouton existe ; son rendu n'est pas spécifié), le choix du logo cabinet
au-delà du gabarit de bouton, et l'onglet « Contenu brut » de l'aperçu. Ce sont des
propositions, pas des défauts.
