# LOT 14 — les deux dalles du bas sont SUPPRIMÉES

Spec : ce message. Maquette : `handoff-septembre/maquette/Dashboard - Liquide.dc.html`
— elle porte **trois** dalles de plâtre, et rien après.

## Le LOT 13 était une erreur. Elle est de moi seul.

Le client a dit **supprimer**. J'ai lu « les deux cartes du bas font partie de
l'ancien design » et j'ai décidé de les **redessiner** en Liquide. Personne ne l'a
demandé. Mon audit du 02/09 les avait même marquées « À TOI » et je les avais
tranchées « elles restent » — contre l'instruction. Le LOT 13 est donc à défaire
entièrement : ce n'est pas un ajustement, c'est un retrait.

## § 1 — Ce qui sort

1.1 **La dalle « Performance du portefeuille »** — le `<section>` entier,
    ses fenêtres, sa courbe large, son pied. `.dalle--wide` avec elle si plus
    personne ne la porte.

1.2 **La dalle « Sous la protection du capital »** — le `<section>` entier,
    la règle graduée, les six lignes, le pied.

1.3 **Tout le code qui ne servait qu'à elles** : la construction de la règle
    (bornes, graduations, positions, repère zéro), la courbe large et son
    lissage, les valeurs `perfPeriode` / `perfLibelle` / `margeMin`, la
    fonction de fenêtre courante, et le reliquat de l'ancien `.cap-*` /
    `.perf-*` si le LOT 13 en a laissé. **Zéro sélecteur orphelin, zéro
    fonction non appelée** — la règle du projet, pas une option.

1.4 **Ce qui reste et ne bouge pas** : `PERIODES` (le cadre d'encours la lit),
    `BARRIERE`, `COURBE_PTS`, la trajectoire de la petite courbe.

## § 2 — Ce que devient le Dashboard

Nappe + premier plan, puis **trois dalles de plâtre**, puis **la fin de la page**.
Rien sous la troisième dalle. Mesuré sur la maquette à 1600 : trois `section`
de 411 px, hauteur totale **1549 px** (contre 2670 avec les deux dalles), `0`
trou de gabarit, `0` cible sous 44 px, `scrollWidth == 1600`.

## § 3 — Le point que tu m'as renvoyé au LOT 13 tombe

« Dalle 5 compte `d < 0` alors que la dalle B compte via `p.st` » : la dalle 5
n'existe plus, la question s'éteint. **La dalle B garde son `p.st`** — c'est
l'état de barrière de l'app, il ne change pas dans ce lot.

## § 4 — Preuves (`preuve-liquide --lot 14`)

1. `0` occurrence de `dash-perf|perf-panel|perf-chart|perf-kpi|\.cap-|dalle--wide`
   sous `src/` et dans `index.html` ;
2. `0` occurrence de « Performance du portefeuille » et « Sous la protection du
   capital » dans le rendu du Dashboard ;
3. mesure DOM : `.dash-body` a **exactement 3** enfants de dalle, et `0`
   élément après le troisième ;
4. `check-sources` : aucune fonction du module Dashboard sans appelant ;
5. sweep `--lot 5 → 14` vert, et **la capture de conformité descend au dernier
   pixel** (preuve n° 6 du LOT 13, qui reste la règle).

## § 5 — Hors périmètre

Les trois dalles, le premier plan, le rail, les huit autres écrans. Le doublon
`%%` de « Concentration émetteurs » (audit § D.1) reste ouvert et n'entre pas ici.
