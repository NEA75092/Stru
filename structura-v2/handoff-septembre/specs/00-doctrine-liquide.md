# doctrine — « Liquide », et comment l'étendre aux huit autres écrans

Version 1 · 25/08/2026 · **remplace** `specs/00-doctrine.md` (D1–D10, direction Méditerranée), supprimée
dans ce lot — l'historique reste en git log. Dépend de
`specs/design-tokens-v3-liquide.md`.
Rendu cible et seule source de mesure : `Dashboard - Liquide.dc.html`.

---

## 0. Comment lire ce document

Il n'existe pas de maquette pour Clients, Portefeuille, Barrières, Calendrier,
Pilotage, Pitch Engine, Decrement Score et Doc Reader. Il n'y en aura pas avant
septembre. Ces huit écrans se dessinent **par dérivation du Dashboard**, et ce
document est la table de dérivation.

Une règle qui n'est pas ici n'existe pas. Si un cas n'est pas couvert, il se
tranche en écrivant la règle, pas en improvisant à l'écran.

Le rail de navigation est `.sidebar` dans le code. « rail » est le mot de la
doctrine, `.sidebar` est le sélecteur — toute sonde s'écrit sur le sélecteur, pas
sur le mot.

---

## L1 — Deux plans, jamais mélangés

Tout écran de l'app se compose de deux plans, dans cet ordre vertical :

1. **La nappe** — bandeau haut de **640 px**, c'est de l'eau. Rien d'informatif n'y
   vit **sauf** le titre de l'écran et les cartes de verre.
2. **Le plâtre** — sous la nappe, des dalles mates (`--dalle-a/b/c`), pleine
   opacité. **Toute la donnée dense vit là** : tableaux, listes, graphiques,
   formulaires.

Un écran qui n'a pas de chiffres de tête garde quand même sa nappe : elle porte
alors le titre et un ou deux filtres. Elle ne rétrécit pas et ne disparaît pas.
Une hauteur de nappe qui varie d'un écran à l'autre est un défaut.

## L2 — L'ossature de page est identique sur les neuf écrans

Relevée à `Dashboard - Liquide.dc.html` l. 65-66, 158, 244-245.

| Élément | Valeur |
|---|---|
| Fond de fenêtre | `--desk`, `padding: 30px` |
| Coque | `border-radius: var(--r-dalle)`, `border: 1px solid color-mix(in oklab, var(--marine) 22%, transparent)`, `overflow: hidden` |
| Largeur plancher | `min-width: 1600px` |
| Rail de navigation | `236px`, `linear-gradient(180deg, var(--marine) 0%, color-mix(in oklab, var(--marine) 84%, #000) 62%, color-mix(in oklab, var(--marine) 68%, #000) 100%)`, `padding: 24px 16px 20px` |
| Nappe | `position: absolute`, `height: 640px`, `overflow: hidden`, `pointer-events: none` |
| Premier plan | `padding: 52px 28px 0`, `z-index: 30` |
| Plâtre | `margin: 54px 28px`, `z-index: 20` |

**Le rail ne change jamais** : mêmes neuf entrées, mêmes tracés d'icônes, même
pied (Mode démo / CSV / Excel / + Nouveau produit), même barre d'outils basse
(recherche, notifications, jour-nuit, avatar). Il est repris **verbatim** de la
maquette. Le seul delta d'un écran à l'autre est `aria-current="page"` et le
liseré de 2 px `--azur-clair` sur l'item actif.

## L3 — Le verre est réservé au premier plan

Une carte n'a droit au `backdrop-filter` **que si elle flotte au-dessus de l'eau**.
Une dalle du plâtre n'en a jamais : le verre sur du mat, c'est le dashboard
générique.

**Carte de verre** (l. 164-165) — deux couches, toujours :

```
extérieur : padding 12px · border-radius var(--r-verre)
            border 1px var(--flottant-brd) · background var(--flottant)
            backdrop-filter blur(14px)
intérieur : padding 22px 24px 20px · border-radius var(--r-dalle)
            background var(--verre) · border 1px var(--verre-brd)
            backdrop-filter blur(18px)
            hover → transform translateY(-3px), transition 280ms var(--ease)
```

Trois cartes de verre au maximum par écran. Au-delà, la nappe devient une vitrine.

## L4 — Le plâtre : la dalle est l'unité

Relevée l. 245-247, identique aux trois dalles du Dashboard.

```
grille  : repeat(3, minmax(0,1fr)) · gap 22px · align-items start
dalle   : padding 34px · border-radius var(--r-dalle)
          background var(--dalle-a | -b | -c)
          display flex · column · gap 34px
          hover → transform translateY(-3px), transition 280ms var(--ease)
          animation colonne 700ms var(--ease) both, décalage 80ms par dalle
```

**Les trois dalles alternent dans l'ordre a → b → c**, puis reprennent à `a`. Une
dalle n'est jamais peinte de la même teinte que sa voisine immédiate.

Un écran dense (Portefeuille, Barrières, Clients) emploie une **dalle unique pleine
largeur** au lieu de trois : mêmes valeurs, `grid-template-columns: minmax(0,1fr)`.

### Entête de dalle

```
h2      : Jost 500 · 16.5px · letter-spacing .004em · color var(--encre) · margin 0
chiffre : Jost 300 · 44px · letter-spacing -.01em · tabular-nums · color var(--encre)
unité   : accolée au chiffre, taille réduite, même famille
```

### Ligne de liste ou de tableau

```
button  : display grid · gap 13px · padding 12px 10px · margin 0 -10px
          min-height 44px · border none · background none
          border-radius var(--r-min)
          hover → background var(--survol)
séparateur : 1px var(--trait), jamais entre la dernière ligne et le bord
```

Le `margin: 0 -10px` négatif est **obligatoire** : il fait déborder la surface de
survol dans le padding de la dalle, sans décaler le texte. Une ligne dont le survol
s'arrête avant le bord du texte est un défaut.

## L5 — Le relief ne vient jamais d'une ombre

`translateY(-3px)` au survol, et bordures claires. **Aucun `box-shadow` dans le
projet**, sauf `--shadow-float` sur le tiroir, la modale et le menu déroulant —
les trois seules surfaces réellement flottantes : elles sortent du flux, elles se
ferment, elles n'ont aucune place réservée dans la page. Aucune quatrième surface
ne s'ajoute à cette liste sans arbitrage écrit.

## L6 — Cinq rayons, pas un de plus

`--r-min: 2px` (survol de ligne) · `--r-nav: 8px` (item de nav) · `--r-dalle: 20px`
(dalle, verre intérieur, coque) · `--r-verre: 24px` (carte flottante) ·
`--r-plein: 999px` (pastille, avatar, bouton de pied).

## L7 — Typographie

**Jost** porte les titres, les chiffres et tout ce qui est tabulaire. **Instrument
Sans** porte l'interface et les libellés. Pas de serif, pas d'italique, pas de
troisième famille.

| Rôle | Valeur |
|---|---|
| Titre d'écran (sur la nappe) | Jost 300 · 54px · line-height 1.04 · `--sur-azur` |
| Surtitre (sur la nappe) | Instrument Sans · 13px · `--sur-azur-2` |
| Titre de dalle | Jost 500 · 16.5px |
| Grand chiffre de dalle | Jost 300 · 44px |
| Grand chiffre de verre | Jost 300 · 40px |
| Libellé de ligne | Instrument Sans · 14px |
| Note, date, unité | Instrument Sans · 13px / 11.5px · `--encre-3` |
| Bouton capitales | Jost · 11.5px · letter-spacing .1em |

Tout nombre porte `font-variant-numeric: tabular-nums`. Sans exception.

## L8 — Le mouvement, six animations et pas d'autres

```css
@keyframes colonne { from { opacity:0; translate:0 14px } to { opacity:1; translate:0 0 } }
@keyframes ligne   { from { opacity:0; translate:0 7px  } to { opacity:1; translate:0 0 } }
@keyframes jauge   { from { width:0 } to { width:var(--w) } }
@keyframes tracer  { from { stroke-dashoffset:1 } to { stroke-dashoffset:0 } }
@keyframes paraitre{ from { opacity:0 } to { opacity:1 } }
@keyframes derive  { 0%,100% { transform:translate3d(0,0,0) rotate(0deg) scale(1) }
                     50%     { transform:translate3d(2.5%,-2%,0) rotate(7deg) scale(1.06) } }
```

`derive` anime **uniquement** les nappes floutées de l'eau (46 s et 58 s, la seconde
en `reverse`). Les jauges partent après le contenu (délai 320 à 520 ms). Le bloc
`@media (prefers-reduced-motion: reduce) { *{ animation:none!important;
transition:none!important } }` est obligatoire sur chaque écran.

## L9 — Tout ce qui est cliquable est un `button`

Nav, bascules, lignes de liste, pieds de carte, pastilles de filtre. Pas un seul
`div` avec `cursor: pointer`. Cible de survol **≥ 44 px** de haut, toujours.

## L10 — Une seule source de vérité par grandeur

Un compteur, un badge et une phrase qui parlent du même fait lisent la même
constante. Aucune valeur dérivable n'est écrite à la main : le libellé de jour se
calcule depuis la date, le nombre d'alertes depuis la liste, le repère de barrière
depuis `BARRIERE`. Pas de code mort — un token non référencé, une méthode non
appelée, une clé de `renderVals` inutilisée : ça sort.

---

## Portée — ce lot ne concerne qu'un écran

Il n'existe pas de maquette pour Clients, Portefeuille, Barrières, Calendrier,
Pilotage, Pitch Engine, Decrement Score et Doc Reader, et **on ne les dessine pas
maintenant**. Ils se repeignent seuls par la couche d'alias du lot 01 et par la
coquille du lot 02 : mêmes onglets, mêmes outils, même DOM, même logique.

Un écran ne reçoit de spec propre que le jour où il est maquetté. Écrire ici ce
qu'ils devraient devenir serait de la spec morte — la même faute que les onze
documents périmés d'A4.

### Ce qui ne se redessine pas

**Ne pas redessiner ce qui existe** — le logo, les icônes de nav, l'ossature d'un
écran corrigée en usage. Concrètement : le monogramme, les neuf tracés d'icônes de
nav, les six modes du calendrier, l'ossature du Pitch Engine, le tri par en-tête,
les couleurs de marque émetteur. Ils sont repris verbatim. Les redessiner est la
panne du 06/08 et du 19/08.

---

## Preuve de fin, par lot

1. Captures **1600 px jour + nuit**.
2. Nappe mesurée à 640 px, rail à 236 px, plâtre à `margin: 54px 28px`.
3. `check-tokens.mjs` et `check-sources.mjs` verts.
4. Sonde : zéro `box-shadow` hors `--shadow-float`, zéro `div` cliquable,
   zéro `border-radius` littéral, zéro nombre sans `tabular-nums`.
5. Toute cible cliquable ≥ 44 px, vérifiée au DOM et non à l'œil.
6. `git diff --stat` conforme à la liste de fichiers autorisée par le lot.

## Un chiffre affiché ne dépend jamais d'une frame (03/09)

Les compteurs qui montent sont une **décoration**. La règle, valable sur les neuf
écrans et sur toute animation de valeur à venir :

- le facteur d'animation **absent vaut 1** (la valeur finale), jamais 0 —
  `this.state.roul ?? 1`, pas `|| 0` ;
- la rampe ne fait que **partir** de 0 quand elle a pu démarrer ;
- un **filet** à l'échéance écrit la valeur finale même si aucune frame n'arrive,
  et il est nettoyé au démontage comme la rampe.

Pris sur le fait : la maquette du Dashboard affichait `0 %` / `0,0` / `0` sur les
trois têtes de dalle après un chargement neuf — les lignes en dessous étant
peuplées — parce que la rampe ne redémarrait pas après un remontage. Un
`setState` sans rapport les remplissait d'un coup. **Le défaut n'était pas la
valeur, c'était de faire dépendre un chiffre d'une frame livrée.**

Corollaire de lecture : ce défaut vivait dans la maquette, pas dans le dépôt.
Il n'ouvre donc **pas** de § de lot — il entre ici, comme invariant, et la sonde
d'un écran vérifie que sa tête de dalle est non nulle au premier rendu.
