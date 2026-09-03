# LOT 13 — le bas de page : les deux dalles pleine largeur passent en Liquide

Spec : ce message **plus la maquette**, qui fait foi.
Maquette : `handoff-septembre/maquette/Dashboard - Liquide.dc.html` — elle porte
désormais **cinq** dalles de plâtre : la grille de trois, puis deux pleine largeur.

## Pourquoi ce lot existe

Le client dit depuis quatre tours « des outils en bas traînent encore ». J'ai
cherché quatre fois dans le rail. **Il parlait du bas de la page.** Les deux
dalles pleine largeur — `.dash-perf-section` (« Performance du portefeuille ») et
`.cap-*` (« Sous la protection du capital ») — n'étaient **dans aucune de mes
maquettes**, donc dans aucun § de lot, donc jamais repeintes : elles portent
encore les fenêtres `6M / 1A / Tout`, la règle graduée −60/+20 et les filets
clairs d'avant Liquide. Mon audit du 02/09 les a même marquées « À TOI » et je
les ai tranchées « elles restent » — sans jamais les dessiner. L'angle mort était
déclaré, pas comblé.

## Ce que la maquette montre maintenant

**Dalle 4 — Performance du portefeuille** (`--dalle-a`, pleine largeur) :
en-tête sur une ligne, grand chiffre de perf à `clamp(34px,2.75cqw,44px)`
**teinté par son signe** (`--rouge` en baisse, `--vert` en hausse), sous-titre
« sur \<fenêtre\> · \<delta\> ». À droite, **les mêmes quatre fenêtres que le cadre
d'encours** — Mois · Trimestre · Année · Depuis l'origine, mêmes cibles 44 × 44,
même vocabulaire : `6M / 1A / Tout` disparaît. Courbe large `viewBox 0 0 1200 208`,
trame de quatre lignes, aire dégradée, tracé animé, aucune ombre.

**Dalle 5 — Sous la protection du capital** (`--dalle-c`, pleine largeur) :
grand chiffre = nombre de produits sous la barrière, sous-titre « la plus proche
à N pts ». **Règle horizontale graduée en points de VL**, bornes `REGLE = {min:
-30, max: 60}` déclarées une fois ; les six graduations et la position de chaque
produit en dérivent. Une ligne par produit : sigle · nom · segment allant de zéro
à sa distance, avec sa pointe · valeur signée. **Deux états de couleur, pas
trois** : `--rouge` sous la barrière, `--encre` au-dessus — même règle que le
Top / Flop. Six produits, les plus proches de la barrière d'abord.

Les deux ont un pied de dalle à chevron (« Ouvrir le pilotage », « Ouvrir le
suivi des barrières »), `border-top: 1px solid var(--trait)`, comme les trois
autres.

## Invariants

- Les fenêtres de période sont **une seule liste** (`PERIODES`) lue par le cadre
  d'encours **et** par la dalle de performance. Deux rangées, une source.
- La courbe large réemploie **`COURBE_PTS`**, la même trajectoire que la petite :
  les deux figures ne peuvent pas raconter deux histoires.
- `REGLE`, `BARRIERE` : une déclaration, tout le reste dérivé (graduations,
  positions, libellés, teintes).
- Zéro `box-shadow`, rayons dans l'échelle, aucune cible sous 44 px.

## Mesuré sur la maquette (1600)

5 `section` de plâtre : 411 / 411 / 411 puis **1277 / 1277** de large.
`0` trou de gabarit non résolu · `0` bouton sous 44 px · `scrollWidth == 1600`.

## Preuves attendues (`preuve-liquide --lot 13`)

1. `0` occurrence de `6m|1a|"Tout"` comme libellé de fenêtre dans les deux
   sections du bas ; les quatre libellés sont ceux de `PERIODES` ;
2. mesure DOM : `.dash-body` a **cinq** enfants de dalle, les deux derniers à
   la largeur du plâtre à ± 1 px ;
3. `0` `box-shadow` et `0` rayon hors échelle dans `.dash-perf-section` et
   `.cap-*` ;
4. la règle de barrière n'emploie que **deux** teintes ;
5. aucune cible sous 44 px dans les deux sections, à 1280 et 1600 ;
6. **la capture de conformité descend jusqu'au dernier pixel de la page** — c'est
   la leçon du lot : une capture qui s'arrête au pli ne prouve rien.

## Hors périmètre

Les trois dalles du haut, le premier plan, le rail, les huit autres écrans.
