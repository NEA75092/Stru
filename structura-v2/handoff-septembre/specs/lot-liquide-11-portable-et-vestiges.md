# LOT 11 — le format portable, les vestiges, et quatre défauts de la maquette

Source de vérité : `Dashboard - Liquide.dc.html` (relue et corrigée le 03/09).
Doctrine : `handoff-septembre/specs/00-doctrine-liquide.md`.
Ce lot ne touche que le Dashboard et la coquille. Les huit autres écrans sont le LOT 12+.

## § 0 — Arrête-toi si

1. Un `clamp()` du § 2 ne donne pas la valeur haute attendue à 1600 px de fenêtre
   (le rendu 1600 ne doit pas bouger d'un pixel : ce lot ajoute un plancher, il ne
   redessine pas le rendu de référence).
2. `assets/guerfin-symbole-clair-detoure.png` n'est pas au dépôt (§ 4.3).
3. Retirer `.sidebar-foot` casse un test : `tests/ui-smoke.test.js` ou
   `css-hygiene` cite `sidebar-mode`, `sidebar-btn` ou `sidebar-add`.
   Dans ce cas : dis-le, ne réécris pas le test de ton propre chef.
4. `exportCSV()`, `exportXLSX()`, `toggleAppMode()` ou `openModal()` n'a **aucun**
   autre point d'appel dans l'app (§ 1.3) — il faudrait alors leur en donner un
   avant de retirer celui du rail.

Ne t'arrête pas pour : la marque (§ 4 tranche : GUERFIN), les tableaux à onze colonnes
(§ 2.4 tranche), le nombre de dalles du plâtre (inchangé).

## § 1 — Les vestiges de l'ancien design sortent du rail

`index.html` l. 104-119 : `.sidebar-foot` (MODE DEMO · CSV · Excel · + Nouveau
produit) est resté sous la nav, au-dessus de `.sidebar-tools`. Il n'existe plus
dans la maquette. **Erreur de ma part : il y était encore le 02/09, aucun lot ne
l'avait audité.**

1.1 **Supprimer `.sidebar-foot`** d'`index.html` et ses règles de `shell.css`
    (`.sidebar-foot`, `.sidebar-mode`, `.sidebar-actions`, `.sidebar-btn`,
    `.sidebar-add`). Zéro sélecteur orphelin.

1.2 **L'action primaire remonte en tête de rail**, entre la marque et la nav :
    un seul `<button>`, pleine largeur, `min-height: 44px`,
    `border-radius: var(--radius-full)`, fond `--azur-clair`, encre `--marine`,
    glyphe + de 14 px puis « Nouveau produit » (sans le « + » typographique :
    le glyphe le porte). `margin-bottom: 20px`. Appelle `openModal()`.

1.3 **Les trois autres fonctions ne disparaissent pas** :
    - CSV / Excel → barre d'outils de l'écran courant (Portefeuille, Barrières,
      Clients, Calendrier ont déjà un gabarit de contrôles : `controls.css`).
      Tant que le LOT 12 n'est pas passé, garde-les **dans la barre d'outils du
      Portefeuille uniquement** ; ne les laisse pas dans le rail.
    - MODE DEMO → menu de la pastille de profil du pied de rail.

1.4 **Le pied de rail n'est plus flottant.** `.sidebar-tools` :
    `margin-top: 24px` (plus de `margin-top: auto`), `padding-top: 16px`,
    `border-top: 1px solid rgba(255,255,255,0.14)`, `gap: 2px`, et la pastille
    de profil en `margin-left: 6px` (plus de `margin-left: auto`). Les quatre
    cibles restent 44 × 44.

## § 2 — Tenir sur 1280 **et** 1440 sans défilement horizontal

`shell.css` l. 37 dit `min-width: 1600px`. C'est faux depuis le premier jour sur
un portable. Le plancher devient **1280**. Aucune `@media` : des `clamp()`, donc
un seul rendu continu de 1280 à 1600 — et à 1600 les valeurs hautes sont
exactement celles d'aujourd'hui.

| Sélecteur | Propriété | Valeur |
| --- | --- | --- |
| `.app` | `min-width` | `1280px` |
| `.app` | `padding` | `clamp(18px,1.6vw,30px)` |
| `.sidebar` | `width` | `clamp(208px,15vw,236px)` |
| `:root` | `--nappe-h` | `clamp(568px,44.4vw,640px)` |
| `.dash-avant` | `padding` | `clamp(40px,3.6vw,52px) clamp(18px,1.9vw,28px) 0` |
| `.dash-avant` | `grid-template-columns` | `minmax(0,1fr) clamp(360px,28vw,440px)` |
| `.dash-avant` | `gap` | `clamp(24px,2.6vw,40px)` |
| `.dash-lede-title` | `font-size` | `clamp(40px,3.5vw,54px)` |
| `.dash-encours-frame` | `width` / `margin-top` | `min(472px,100%)` / `clamp(24px,2.4vw,34px)` |
| `.dash-encours-val` | `font-size` | `clamp(33px,2.7vw,40px)` |
| `.dash-platre` | `margin` | `clamp(40px,3.6vw,54px) clamp(18px,1.9vw,28px)` |
| `.dash-platre` grille | `gap` | `clamp(16px,1.5vw,22px)` |
| dalle (3) | `padding` / `gap` interne | `clamp(24px,2.3vw,34px)` |
| grand chiffre de dalle (3) | `font-size` | `clamp(34px,2.9vw,44px)` |

2.1 Le plâtre reste à **trois colonnes** de 1280 à 1600. Pas de repli à deux :
    la dalle la plus étroite fait ~265 px de contenu à 1280, mesuré, et tient.

2.2 La nappe garde ses 640 px à 1440 et au-delà ; elle descend à 568 à 1280.
    C'est la seule grandeur de la doctrine que ce lot fait varier, et elle varie
    avec la largeur, jamais avec la hauteur.

2.3 **Le point de rupture 1080 px supprimé au lot 1 ne revient pas.** Sous 1280,
    l'app défile — c'est assumé, le mobile est un autre chantier.

2.4 **Tableaux à onze colonnes** (`#pf-table` 1470, `#bar-table` 1455,
    `.tbl-wrap table` 1400) : **défilement horizontal dans la dalle**, pas de
    colonne masquée. Le `min-width` de la table reste ; c'est `.tbl-wrap` qui
    porte `overflow-x: auto` et ne dépasse jamais sa dalle. Une colonne masquée
    sous 1440 serait une donnée qui disparaît sans que le CGP le sache.

## § 3 — Les quatre défauts que le client a vus, corrigés dans la maquette

3.1 **Événements : le tri est explicite, jamais l'ordre d'écriture.**
    Aujourd'hui et à venir d'abord, au plus proche ; le passé descend en bas,
    du plus récent au plus ancien, en `--color-text-tertiary`.
    `(a.passe - b.passe) || (a.passe ? b.n - a.n : a.n - b.n)`.
    Le libellé de délai d'animation est attribué **après** le tri (l'entrée
    échelonnée suit l'ordre affiché).

3.2 **Courbe d'encours : forme refaite.** Le bruit sinusoïdal sort. Douze
    constatations, lissage **Catmull-Rom** (tangentes réelles ; l'ancien lissage
    posait les deux points de contrôle à la même abscisse, ce qui produisait un
    plateau à chaque point). Ligne de base **104**, haut **14** — 104 est la
    dernière ligne de la trame, donc l'aire se ferme **sur** la trame et non
    8 px sous elle, ce qui était le vrai défaut visible.

3.3 **Alignement du texte** :
    - rangée de périodes : `gap: 14px` sur la rangée, **et plus de
      `margin-right` sur les boutons** (une seule source d'espacement) ;
    - ligne d'événement : quatre colonnes `34px 28px minmax(0,1fr) auto`
      (date · pastille émetteur · texte · montant). Le `padding-left: 37px`
      qui faisait tenir le détail sous le titre disparaît : titre et détail
      partagent le même bord gauche parce qu'ils sont dans la même colonne ;
    - la pile de date est alignée à gauche (`align-items: flex-start`), pas
      centrée : la colonne était le seul bloc centré de l'écran.

3.4 **Écart de VL du Top / Flop : encre monochrome.** `--ambre` sort — l'écart
    n'a plus **que deux états** : `--color-ink` au-dessus de la barrière,
    `--color-breach` en dessous. Trois couleurs sur une figure que la doctrine
    veut monochrome, c'était l'erreur. La jauge suit la même règle.
    Corollaire : **la pastille active du sélecteur Top 5 / Flop 5 prend
    `--chip-encre`, pas `--color-ink`** — en nuit, encre claire sur pastille
    claire, le libellé était invisible.

## § 4 — Le logo : GUERFIN, et c'est un livrable de mon côté

**Tranché par le client le 03/09 : la marque de l'app est GUERFIN.** Le
mot-marque STRUCTURA et `assets/structura-mark*.png` sortent du rail. La
divergence ouverte depuis le 25/08 est close dans ce sens-là.

4.1 Artwork : `assets/guerfin-symbole-clair.png` portait 74 px de vide à gauche
    et 215 px en bas — posé en 38 × 28 `object-fit: contain`, il rendait un
    logo minuscule et décentré. Détouré à son encre : **644 × 344, ratio 1,87**,
    livré sous `assets/guerfin-symbole-clair-detoure.png`. C'est un recadrage,
    aucun pixel redessiné (règle 7).

4.2 Dans le rail : `img` **34 × 18**, `object-fit: contain`, `gap: 11px`,
    mot-marque « GUERFIN » en Jost 500 / 15 px / `letter-spacing: .18em`,
    encre `--color-on-band`. Bloc **aligné à gauche** sur l'inset de 14 px des
    items de nav — il était centré, seul bloc centré du rail.

4.3 **Les deux fichiers ne sont pas au dépôt.** Je les y pousse avec la spec ;
    si `assets/guerfin-symbole-clair-detoure.png` manque au moment où tu codes,
    arrête-toi (§ 0.2) — ne substitue pas `structura-mark`, ne redessine rien.

4.4 Variante nuit : **aucune.** Le rail reste marine en jour comme en nuit,
    l'artwork clair vaut pour les deux thèmes (même règle qu'au 19/08).

## § 5 — Preuves (`preuve-liquide --lot 11`)

1. `0` occurrence de `sidebar-foot|sidebar-mode|sidebar-btn|sidebar-add` dans
   `index.html` **et** `shell.css` ;
2. `.app { min-width: 1280px }` et `0` occurrence de `1600px` dans `shell.css` ;
3. mesure DOM à **1280 × 800** et **1440 × 900**, jour et nuit :
   `document.scrollingElement.scrollWidth <= innerWidth` — sur les neuf vues ;
4. mesure DOM : hauteur de `.dash-avant` = valeur résolue de `--nappe-h`
   (568 à 1280, 640 à 1600), et bas de `.dash-avant` → haut de la première
   dalle = 54 px à 1600, la valeur du `clamp` ailleurs ;
5. `0` occurrence de `--ambre` sous `src/` ;
6. le bouton primaire du rail est un `<button>` de `min-height >= 44px`, et
   c'est le **premier** élément focalisable après la marque ;
7. `0` `margin-top: auto` sur `.sidebar-tools`.

## § 6 — Hors périmètre

Contenu des dalles, libellés, encours abrégé, « sur la période », les huit autres
écrans, le mobile. Le bloc « Coupons encaissés cette semaine » et la ligne
« … en jeu sur ces trois dossiers » de la maquette sont des ajouts de détail —
ils entrent au **LOT 11 bis**, pas ici, pour que ce lot reste mesurable.
