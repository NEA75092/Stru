# LOT 11 — le format portable, les vestiges, et quatre défauts de la maquette

Source de vérité : `Dashboard - Liquide.dc.html` (relue et corrigée le 03/09).
Doctrine : `handoff-septembre/specs/00-doctrine-liquide.md`.
Ce lot ne touche que le Dashboard et la coquille. Les huit autres écrans sont le LOT 12+.

## § 0 — Arrête-toi si

1. Un `clamp()` du § 2 ne donne pas la valeur haute attendue à 1600 px de fenêtre
   (le rendu 1600 ne doit pas bouger d'un pixel : ce lot ajoute un plancher, il ne
   redessine pas le rendu de référence).
2. `assets/guerfin-symbole-clair-detoure.png` n'est pas au dépôt (§ 4.3).
3. Un `cqw` ne se résout pas (navigateur sans `container-type`) — dis-le, ne
   retombe pas sur `vw`.
4. Retirer `.sidebar-foot` casse un test : `tests/ui-smoke.test.js` ou
   `css-hygiene` cite `sidebar-mode`, `sidebar-btn` ou `sidebar-add`.
   Dans ce cas : dis-le, ne réécris pas le test de ton propre chef.
5. `exportCSV()`, `exportXLSX()`, `toggleAppMode()` ou `openModal()` n'a **aucun**
   autre point d'appel dans l'app (§ 1.3) — il faudrait alors leur en donner un
   avant de retirer celui du rail.

Ne t'arrête pas pour : la marque (§ 4 tranche : GUERFIN), les tableaux à onze colonnes
(§ 2.4 tranche), le nombre de dalles du plâtre (inchangé).

## § 1 — Le bas du rail est **vide**. Rien n'y descend.

C'est le troisième tour sur ce point et les deux premiers étaient à côté. Le
client n'a jamais parlé de `.sidebar-foot` seul : **il parle de tout ce qui
traîne sous la nav.** Au LOT 11 j'ai retiré `.sidebar-foot` et *déplacé*
`.sidebar-tools` (recherche · notifications · jour/nuit · profil) juste sous le
filet — donc les quatre boutons sont toujours là, toujours en bas. Corrigé pour
de bon :

1.1 **`.sidebar-tools` est supprimé**, ses quatre boutons avec, et le filet
    `border-top` avec. Après `</nav>`, le rail **ne contient plus rien**.
    Le rail a exactement **trois enfants** : la marque, le bouton primaire,
    la nav. Onze boutons au total dans le rail : 1 primaire + 10 items de nav.

1.2 **L'action primaire reste en tête de rail** (acquis du LOT 11, § inchangé) :
    un `<button>` pleine largeur entre la marque et la nav, `min-height: 44px`,
    `border-radius: var(--radius-full)`, fond `--azur-clair`, encre `--marine`,
    glyphe + puis « Nouveau produit ». Appelle `openModal()`.

1.3 **Où vont les quatre :**
    - **jour / nuit** et **profil** → un couple de 44 × 44 **en haut à droite du
      premier plan**, au-dessus de la carte d'agenda, dans la colonne de droite
      (`justify-content: flex-end`, `gap: 4px`, `margin-bottom: -4px`). Ils
      flottent sur l'eau : c'est du verre, la doctrine est respectée.
    - **recherche** → **rien dans la coquille.** Elle vit déjà dans la barre
      d'outils de chaque écran, avec son `⌘K`. Deux champs de recherche pour un
      seul acte, c'était le doublon.
    - **notifications** → **supprimé sans remplacement.** La carte « À regarder
      aujourd'hui » *est* le centre de notifications de cette app ; une cloche
      qui redit la même chose est du bruit.

1.4 **Le menu de profil s'ancre au nouveau couple**, pas au rail : panneau de
    222 px, `position: absolute; right: 0; top: 50px`, ouverture **vers le
    bas**, `role="menu"`, fond `--marine`, `border-radius: var(--r-dalle)`.
    Trois entrées de 44 px : **Mode démo** (avec son état ACTIF / INACTIF lu sur
    l'état, pas écrit deux fois), Réglages du cabinet, Se déconnecter.
    Capture du client à 1280 : l'ancien menu s'ouvrait **vers le haut par-dessus
    « Doc Reader »**, en carré à angles droits, hors échelle de rayons. Il n'y a
    plus d'ancrage dans le rail, donc plus de recouvrement possible.

1.5 **L'identité est déclarée une fois.** `UTILISATEUR` donne le titre du
    bouton, les initiales de la pastille, l'en-tête du menu **et** le prénom du
    « Bonjour ». Aucun des quatre n'est écrit à la main.

## § 2 — Tenir sur 1280 **et** 1440 sans défilement horizontal

`shell.css` l. 37 dit `min-width: 1600px`. C'est faux depuis le premier jour sur
un portable. Le plancher devient **1280**. Aucune `@media` : des `clamp()`, donc
un seul rendu continu de 1280 à 1600 — et à 1600 les valeurs hautes sont
exactement celles d'aujourd'hui.

2.0 **L'unité est `cqw`, jamais `vw`.** `.app` porte
    `container-type: inline-size` et **toutes** les grandeurs variables du
    tableau ci-dessous se mesurent en `cqw` — 1 cqw = 1 % de la largeur de
    `.app`, pas de la fenêtre. J'ai d'abord écrit ce lot en `vw` : c'était une
    faute, et mesurable. En `vw`, une app posée dans un conteneur plus étroit
    que la fenêtre (aperçu, panneau latéral, fenêtre zoomée, capture) reçoit des
    grandeurs calculées sur une largeur qui n'est pas la sienne — mesuré : rail
    à 208 px alors que l'app faisait 1600. La promesse « à 1600 le rendu ne
    bouge pas d'un pixel » n'est vérifiable qu'en `cqw`.
    `--nappe-h` est déclaré **sur `.app`** (pas sur `:root`) : un `cqw` dans un
    token déclaré hors du conteneur ne se résout pas contre lui.

| Sélecteur | Propriété | Valeur |
| --- | --- | --- |
| `.app` | `min-width` | `1280px` |
| `.app` | `container-type` | `inline-size` |
| `.app` | `padding` | `clamp(18px,1.6vw,30px)` — **seule `vw` du lot** (le desk, lui, est bien la fenêtre) |
| `.app` | `--nappe-h` | `clamp(568px,44.4cqw,640px)` |
| `.sidebar` | `width` | `clamp(212px,14.75cqw,236px)` |
| `.dash-avant` | `padding` | `clamp(40px,3.25cqw,52px) clamp(18px,1.75cqw,28px) 0` |
| `.dash-avant` | `grid-template-columns` | `minmax(0,1fr) clamp(360px,27.5cqw,440px)` |
| `.dash-avant` | `gap` | `clamp(24px,2.5cqw,40px)` |
| `.dash-lede-title` | `font-size` | `clamp(40px,3.4cqw,54px)` |
| `.dash-encours-frame` | `width` / `margin-top` | `min(472px,100%)` / `clamp(24px,2.15cqw,34px)` |
| `.dash-encours-val` | `font-size` | `clamp(33px,2.5cqw,40px)` |
| `.dash-platre` | `margin` | `clamp(40px,3.4cqw,54px) clamp(18px,1.75cqw,28px)` |
| `.dash-platre` grille | `gap` | `clamp(16px,1.4cqw,22px)` |
| dalle (3) | `padding` / `gap` interne | `clamp(24px,2.15cqw,34px)` |
| grand chiffre de dalle (3) | `font-size` | `clamp(34px,2.75cqw,44px)` |

2.1 Le plâtre reste à **trois colonnes** de 1280 à 1600. Pas de repli à deux :
    la dalle la plus étroite fait ~265 px de contenu à 1280, mesuré, et tient.

2.2 La nappe : **568 px à 1280, 623 à 1440, 640 à 1600** — mesuré sur la
    maquette, ce sont les trois valeurs que la preuve n° 4 attend. C'est la
    seule grandeur de la doctrine que ce lot fait varier, et elle varie avec la
    largeur de l'app, jamais avec sa hauteur.

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

## § 4 bis — Cibles de survol : les neuf manquements

La règle du projet dit **≥ 44 px**. La maquette en violait **neuf**, mesurés au
DOM, dont quatre que j'avais moi-même posés au § 1.4. Tous corrigés :

| Élément | Avant | Après | Comment |
| --- | --- | --- | --- |
| 3 icônes du bas de rail | 41 × 44 | 44 × 44 | la rangée sort du padding du rail : `margin: 0 -3px` |
| pastille de profil | 40 × 44 | 44 × 44 | `flex: 0 0 auto`, et `margin-left: auto` |
| 4 boutons de période | 29→91 × 28 | ≥ 44 × 44 | `min-width: 44px; min-height: 44px; padding: 0 10px`, rangée en `gap: 6px` décalée de `-10px` pour que « Mois » reste aligné sur le bord du cadre |
| croix de l'agenda | 30 × 30 | 44 × 44 | le bouton devient une cible transparente de 44 ; le disque bordé de 30 est un `span` intérieur — l'aspect ne change pas |
| Top 5 / Flop 5 | 65 × 30 | 69 × 44 | `min-height: 44px` sur les deux, `padding: 3px` sur le groupe |

**Ceci clôt le point que je t'avais renvoyé au LOT 10** (« Mois » à 43 px,
« accepter la maquette ou ouvrir un lot cibles tactiles »). La réponse est :
la maquette avait tort, elle est corrigée, et la géométrie ci-dessus fait foi.
Aucun lot séparé.

## § 5 — Preuves (`preuve-liquide --lot 11`)

1. `0` occurrence de `sidebar-foot|sidebar-mode|sidebar-btn|sidebar-add|sidebar-tools`
   dans `index.html` **et** `shell.css` ; et mesure DOM : le rail a **3 enfants**,
   et `0` élément après `</nav>` ;
2. `.app { min-width: 1280px; container-type: inline-size }` et `0` occurrence
   de `1600px` dans `shell.css` ;
3. **`0` occurrence de `vw` sous `src/`**, à l'exception du `padding` de `.app`
   et des `100vh`/`100vw` de plein écran — la sonde liste les exceptions
   nommément et échoue sur toute autre ;
4. mesure DOM à **1280 / 1440 / 1600**, jour et nuit, sur les neuf vues :
   `scrollWidth <= clientWidth` (aucun défilement horizontal) **et** hauteur de
   `.dash-avant` = **568 / 623 / 640** ;
5. mesure DOM : **aucun `<button>` sous 44 px** en largeur ou en hauteur, aux
   trois largeurs — 37 boutons sur le Dashboard, `0` manquement (§ 4 bis) ;
6. `0` occurrence de `--ambre` sous `src/` ;
7. le bouton primaire du rail est un `<button>` de `min-height >= 44px`, et
   c'est le **premier** élément focalisable après la marque ;
8. `0` `margin-top: auto` sur `.sidebar-tools` ;
9. `0` occurrence de `structura-mark` dans `index.html` (§ 4) ;
10. mesure DOM : le menu de profil ouvert ne recouvre **aucun** item de nav
    (intersection de rectangles nulle), à 1280 comme à 1600.

## § 6 — Hors périmètre

Contenu des dalles, libellés, encours abrégé, « sur la période », les huit autres
écrans, le mobile. Le bloc « Coupons encaissés cette semaine » et la ligne
« … en jeu sur ces trois dossiers » de la maquette sont des ajouts de détail —
ils entrent au **LOT 11 bis**, pas ici, pour que ce lot reste mesurable.
