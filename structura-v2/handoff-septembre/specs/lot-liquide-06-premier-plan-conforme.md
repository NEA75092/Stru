# lot-liquide-06-premier-plan-conforme — le premier plan devient celui de la maquette

Version 2 · 01/09/2026 · dépend de `specs/00-doctrine-liquide.md` (L1, L2, L3, L4).
**Remplace le LOT 4** (`lot-liquide-04-verre-dashboard.md`, v2) et la v1 de ce lot :
poser du verre sur le hero actuel n'a pas de sens, puisque le hero actuel n'est pas
celui de la maquette. Un seul lot, une seule fois.

Source unique : `handoff-septembre/maquette/Dashboard - Liquide.dc.html`, le premier
plan (le `div` commenté « premier plan : seul endroit où le verre a droit de cité »).
**Toutes les valeurs ci-dessous sont relevées là.** Rien n'est proposé, rien n'est
arrondi. Si une valeur manque dans ce document, elle est dans la maquette : relève-la,
ne l'invente pas.

## 1. Le défaut

Le LOT 5 a fait exister l'eau, et a rendu visible que le premier plan est creux :
`.dash-avant` va de 20 à 712, la rangée de KPI finit vers 525, il reste ~190 px d'eau
vide. Ce n'est **pas** un défaut de répartition — v1 de ce lot se trompait.

La maquette n'a pas de rangée de KPI, et son premier plan a **deux colonnes**. Le code
a un hero pleine largeur et quatre cartes de KPI. Ce qui manque, c'est une colonne
entière : les cartes de verre qui remplissent les 640 px.

## 2. La grille du premier plan

`.dash-avant` devient exactement :

```
position: relative · z-index: 30
display: grid
grid-template-columns: minmax(0, 1fr) 440px
gap: 40px
align-items: start
padding: 52px 28px 0
min-height: var(--nappe-h)
```

Le `28px` est la valeur de la maquette : **il ne devient pas 44**. J'avais demandé une
`--gouttiere: 44px` au tour précédent — **cette consigne est annulée**, elle faisait
diverger le code de la maquette. Si tu l'as déjà écrite, retire-la ; s'il en reste un
token non référencé, il sort (pas de code mort).

## 3. Colonne de gauche — l'entête et le cadre d'encours

Trois éléments, dans cet ordre :

```
kicker : 13px · color var(--sur-azur-2) · margin-bottom 3px
h1     : Jost 300 · 54px · line-height 1.04 · letter-spacing -.012em
         color var(--sur-azur) · margin 0
```

Puis le **cadre flottant** — c'est le verre nº 1 de L3 :

```
margin-top: 34px · width: 472px · padding: 12px
border-radius: var(--r-verre) · border: 1px solid var(--flottant-brd)
background: var(--flottant) · backdrop-filter: blur(14px)   (+ -webkit-)
```

et **dans** ce cadre, la dalle de verre intérieure — verre nº 2 :

```
padding: 22px 24px 20px · border-radius: var(--r-dalle)
background: var(--verre) · border: 1px solid var(--verre-brd)
backdrop-filter: blur(18px)   (+ -webkit-)
transition: transform 280ms var(--ease) · hover → translateY(-3px)
```

Contenu de la dalle, dans l'ordre : libellé « Encours sous gestion » (14px,
`var(--encre)`) · le montant (Jost 300 · 40px · line-height 1 · letter-spacing -.012em ·
`tabular-nums` · `var(--encre)` · margin `13px 0 5px`) · une ligne performance du mois
(14px `var(--vert)` + 13px `var(--encre-2)`, `align-items: baseline`, gap 9px) · la
courbe · les boutons de période (13px, gap 8px, `margin-right: 14px` par bouton).

**La courbe** : SVG `viewBox="0 0 380 112"`, `preserveAspectRatio="none"`, hauteur
112px, pleine largeur. Quatre lignes de grille en `var(--encre-faible)`,
`stroke-dasharray="3 4"`, à y = 22 / 50 / 78 / 104. Aire remplie d'un dégradé vertical
`var(--vert)` de 0.2 à 0 d'opacité. Ligne `var(--vert)`, `stroke-width 1.8`, tracée à
l'`animation: tracer 900ms var(--ease) 120ms both`. Curseur vertical
`var(--encre-faible)` de y=8 à y=104, et un point r=4.2 rempli `var(--vert)`, bordé
`var(--puck)` 2px, `animation: paraitre 300ms linear 940ms both`. Les deux bornes de
date sont posées en absolu, 11.5px `var(--encre-3)`, Jost, `tabular-nums`.

Ces deux `@keyframes` (`tracer`, `paraitre`) sont dans la maquette : reprends-les
telles quelles, ne les réécris pas.

## 4. Colonne de droite — 440 px, deux cartes de verre

`display: flex · flex-direction: column · gap: 16px`.

**Carte agenda** (pas de survol — elle ne se soulève pas) :

```
padding: 18px 20px 16px · border-radius: var(--r-verre)
border: 1px solid var(--flottant-brd) · background: var(--flottant)
backdrop-filter: blur(14px)
```

Entête : le libellé de jour long (Jost 500 · 17.5px · letter-spacing .004em ·
`var(--sur-azur)`) et un bouton de fermeture 30×30 rond, bordé `var(--flottant-brd)`,
croix 12px. Puis la semaine : `grid-template-columns: repeat(7, 1fr)`,
`justify-items: center`, `row-gap: 10px` — une ligne de noms de jour (13px
`var(--sur-azur-2)`), une ligne de pastilles 30×30 rondes (14px, Jost, `tabular-nums`)
chacune surmontant un point de 4px.

**Carte alertes** — « À regarder aujourd'hui » (celle-là se soulève) :

```
padding: 18px 20px 14px · border-radius: var(--r-verre)
border: 1px solid var(--flottant-brd)
background: linear-gradient(160deg,
  color-mix(in oklab, var(--marine) 44%, transparent),
  color-mix(in oklab, var(--marine) 26%, transparent))
backdrop-filter: blur(18px) saturate(1.2)
transition: transform 280ms var(--ease) · hover → translateY(-3px)
```

Entête : le titre (mêmes valeurs que l'agenda) et le **compteur d'alertes** — pastille
26×26 ronde, fond `var(--rouge)`, encre `var(--rouge-encre)`, 13px, 600, `tabular-nums`.
**Ce compteur se calcule depuis la liste**, jamais écrit en dur.

Chaque alerte est un `button` : `grid-template-columns: 34px minmax(0,1fr) auto`,
gap 13px, `padding: 12px 0`, `min-height: 44px`, `border-top: 1px solid
rgba(255,255,255,.18)`. Glyphe dans un rond 34×34 `rgba(255,255,255,.18)` bordé
`var(--flottant-brd)` · titre 14px `var(--sur-azur)` + détail 13px
`rgba(255,255,255,0.76)`, tous deux en `text-overflow: ellipsis` · puce d'action
`padding 6px 14px`, `var(--r-plein)`, fond `var(--chip)`, encre `var(--chip-encre)`,
13px 500.

**Trois cartes de verre au total, et trois seulement** (cadre d'encours, agenda,
alertes) : L3 est respectée pile. Aucune autre carte de l'écran ne reçoit de
`backdrop-filter`.

## 5. La rangée de KPI descend dans le plâtre

Les quatre KPI (performance latente, barrière franchie, sous surveillance, portefeuille
actif) **n'existent pas dans la maquette**. Leurs faits sont réels et ne se perdent
pas : `.kpi-row` **déménage** en premier enfant de `.dash-body`, au-dessus de la dalle
du graphe — même geste qu'au LOT 5 pour `.dash-perf-section`.

Dans le plâtre, elles cessent d'être du verre : fond `var(--color-surface-1)`,
`border-radius: var(--radius-lg)`, survol `translateY(-3px)` 280ms. **Leurs chiffres,
leurs libellés et leurs filets de couleur de statut ne changent pas d'un caractère.**

Si la valeur d'encours du cadre de verre et un KPI parlent du même fait, ils lisent la
**même** source (L10) — ne duplique pas la grandeur.

## 6. Fichiers autorisés

| Fichier | Changement |
|---|---|
| `structura-v2/src/design-tokens.css` | retrait de `--gouttiere` si le LOT 4 l'a introduite ; aucun ajout |
| `structura-v2/src/dashboard.css` | grille du premier plan, cadre + dalle d'encours, deux cartes de droite, KPI en dalles mates |
| `structura-v2/src/relief.css` | rien, sauf si la cascade du § 5.3 du LOT 5 doit suivre le déménagement de `.kpi-row` |
| `structura-v2/index.html` | les deux colonnes du premier plan, le déménagement de `.kpi-row`, bump `?v=` |

**Le DOM du premier plan est réécrit** : c'est le lot qui le dit, ce n'est pas une
dérogation. Aucun autre écran. Aucun token neuf — si une valeur ci-dessus n'a pas
d'alias déclaré dans `design-tokens.css`, **arrête-toi et donne la liste**.

## 6 bis. Amendement du 01/09 — le JS et les sources

Le § 6 n'autorisait pas de JS. Trois widgets du premier plan sont pilotés par des
données que l'app n'a pas : la courbe mensuelle du cadre d'encours, l'agenda de la
semaine, et « À regarder aujourd'hui ». **`structura-v2/src/modules/app-dashboard.js`
est ajouté aux fichiers autorisés**, pour ces trois-là et rien d'autre.

Chaque widget **réemploie un fait existant** — aucune série, aucune liste, aucun libellé
n'est créé :

| widget | source |
|---|---|
| courbe mensuelle, `perfMois`, `deltaMois` | l'historique de portefeuille, fenêtré sur le mois courant |
| agenda de la semaine | les événements de `app-calendar.js` de la semaine en cours |
| « À regarder aujourd'hui » | les positions de `alerts-list`, reformatées glyphe / titre / détail / puce |
| `nAlertes` | la longueur de la liste (§ 4) |
| `majLe`, nom du cabinet | `session` |

Trois garde-fous, qui font partie du lot :

1. **Une seule série.** La courbe du mois et le graphe YTD du plâtre lisent le **même**
   historique, avec deux fenêtres. Deux séries pour le même fait = L10 violée.
   `perfMois` et `deltaMois` se dérivent de cette fenêtre, ils ne se ressaisissent pas.
2. **L'agenda ne décore pas.** Un jour sans événement n'a **pas** de pastille. Les
   valeurs `fond` / `encre` d'un jour couvrent trois états réels — aujourd'hui, jour
   avec événement, jour vide — et rien d'autre.
3. **Les alertes sont un rendu, pas une liste neuve.** Le libellé de la puce d'action se
   dérive du type d'alerte. Si un type d'alerte ne permet de dériver aucun libellé,
   **arrête-toi** — n'écris pas un verbe pour combler.

Si, après ça, un widget manque de matière, **il n'est pas rendu vide** : signale-le au
rapport et laisse-le hors du commit.

## 7. Preuve

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 6
cd structura-v2 && node handoff-septembre/tools/check-tokens.mjs; cd ..
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Contrôles :

1. **exactement 3 éléments avec `backdrop-filter`** dans le Dashboard rendu (L3) ;
2. **zéro `backdrop-filter` sous la ligne des 640 px** ;
3. `grid-template-columns` calculé du premier plan = `… 440px` ;
4. `--gouttiere` absent du dépôt ;
5. le compteur d'alertes affiché = la longueur de la liste.

Mesures DOM 1600 px, jour **et** nuit : `bottom` de la colonne de droite (elle doit
occuper l'eau, pas la moitié) · `bottom` de `.dash-avant` ≥ 640 · `top` du premier
élément du plâtre · `top` de la dalle du graphe > 640 · liste des éléments à
`backdrop-filter` avec leur `top`.

Rapport : sorties brutes, sha, ces mesures, captures 1600 px jour + nuit du Dashboard,
**et une capture du premier plan seul, côte à côte avec la maquette.** C'est cette
comparaison qui juge le lot, pas les sondes.
