# lot-liquide-07-vide-et-fenetre-mois — deux défauts vus sur les captures du LOT 6

Version 1 · 02/09/2026 · dépend de `specs/00-doctrine-liquide.md` et de
`specs/lot-liquide-06-premier-plan-conforme.md` (`ab999ee`), qu'il corrige sans le
remplacer. Petit lot, deux défauts, rien d'autre.

Source unique : `handoff-septembre/maquette/Dashboard - Liquide.dc.html`.

## 1. Les défauts

Relevés sur les captures de `ab999ee` à 1600 px, jour et nuit à l'identique.

**Défaut A — un vide sous la nappe.** L'eau finit à 640, la première dalle du plâtre
devrait suivre à 694, elle arrive plus bas. **Correction de ce que j'ai écrit d'abord :
`.kpi-row` n'a aucune marge résiduelle** — relu au dépôt à `ab999ee`, la règle ne porte
que `display`, `grid-template-columns` et `gap`. Le vide vient de deux sources qui
s'additionnent là où la maquette n'en a qu'une :

1. `shell.css` l. 311 — `.view { gap: var(--space-5) }`. Le Dashboard hérite d'un gap
   entre ses deux plans ; la maquette n'en met aucun (les deux plans sont deux frères
   dans un conteneur sans `gap`, l. 160 et l. 246).
2. `dashboard.css` — `.dash-body { padding: 40px 44px 44px }`. Le `40` du haut s'ajoute
   au gap ci-dessus, et le `44` latéral diverge du `28` de la maquette.

**Défaut B — la fenêtre « Mois » est vide au premier jour du mois.** Au 01/09, le mois
calendaire ne contient qu'un point. Conséquences visibles dans le cadre d'encours :
la ligne est plate, l'écart affiche `+0,0 %` et « soit +0 € sur la période », et les
deux repères d'axe lisent tous les deux `SEPT`. Le cadre d'encours — la carte de verre
nº 1, l'élément le plus regardé de l'écran — ne montre rien.

## 2. Défaut A — le plâtre remonte à la valeur de la maquette

La maquette n'a qu'**une seule** valeur entre l'eau et la première dalle, et c'est la
marge du plâtre lui-même (l. 246) :

```
plâtre : margin: 54px 28px
```

Le code doit donc en avoir une seule aussi. Deux règles, exactement :

`shell.css` — le gap de vue ne s'applique plus au Dashboard, dont les deux plans ne
sont pas deux étapes d'une pile. Les huit autres écrans gardent `.view { gap }` :

```css
#view-dashboard {
    gap: 0;
}
```

`dashboard.css` — le plâtre porte sa marge, comme dans la maquette, et n'a plus de
padding qui double la valeur :

```css
.dash-body {
    display: flex;
    flex-direction: column;
    gap: 44px;
    margin: 54px 28px;
    padding: 0;
}
```

Le `44` latéral devient `28` : c'est la valeur de la maquette. Le `28` du premier plan
et le `28` du plâtre coïncident donc — ils coïncident déjà dans la maquette, ce n'est
pas un alignement que j'ajoute.

Si, après ces deux règles, la première dalle ne tombe toujours pas à 54 px sous l'eau,
**arrête-toi et nomme la troisième source** (`.tilt-scope` sur `.kpi-row` est le premier
suspect à mesurer). Ne la compense pas par une valeur négative.

Attendu mesurable : `top` de `.kpi-row` = 694 à 1600 px, jour et nuit. `top` de la dalle
du graphe = 694 + hauteur des KPI + gouttière de la grille du plâtre. Aucune valeur
écrite à la main pour l'obtenir : elle doit tomber juste par les marges seules.

## 3. Défaut B — « Mois » devient une fenêtre glissante de 30 jours

**Décision (elle est mienne, tu ne l'avais pas tranchée) : fenêtre glissante.**
Pas d'état vide, pas de bascule automatique vers 6M. Trois raisons :

1. `6M`, `1A` sont déjà des fenêtres glissantes comptées depuis aujourd'hui. Le mois
   calendaire était le seul intrus ; l'aligner supprime une exception, pas une donnée.
2. Un état vide dans la carte de verre nº 1 demanderait un dessin qui n'existe pas dans
   la maquette. Je ne l'invente pas.
3. Une bascule automatique vers 6M ferait mentir le bouton actif : « Mois » surligné,
   six mois affichés.

Dans `perfRangeStart`, le cas `month` part de `aujourd'hui − 30 jours` — même forme que
les autres cas, pas de branche particulière au premier du mois. La série reste
`buildPerfSeries(data, 'month')`, la même fonction et le même historique que le graphe
YTD du plâtre (garde-fou nº 1 du LOT 6, inchangé).

Ce qui doit alors bouger tout seul, sans une seule valeur réécrite :

- les deux repères d'axe lisent le premier et le dernier point de la fenêtre (au 02/09 :
  `AOÛT` et `SEPT`) — ils sont dérivés des dates, jamais écrits ;
- l'écart et le « soit … € sur la période » lisent le premier et le dernier point de la
  même série ; ils cessent d'être nuls ;
- le libellé du bouton reste `Mois`.

## 4. Le 17.5px reste littéral

Aucun `--text-*` ne vaut 17.5. Je ne crée pas `--text-agenda` pour deux titres : ce
serait un token de position déguisé en token d'échelle, et l'échelle n'en a pas besoin.
Il reste littéral, même précédent que les deux `rgba(255,255,255,…)` déjà tranchés
« littéraux, comme la maquette ».

## 5. Périmètre

Touché : `src/shell.css` (une règle ajoutée), `src/dashboard.css` (`.dash-body`), `src/modules/app-dashboard.js`
(`perfRangeStart`, cas `month`), `?v=` bump. Rien d'autre. Aucun fichier de calendrier,
aucune couleur, aucun token nouveau ni retiré.

## 6. Preuves

À ajouter à `preuve-liquide --lot 7` :

1. `.dash-body` porte `margin: 54px 28px` et `padding: 0` dans `dashboard.css`.
2. `#view-dashboard { gap: 0 }` existe dans `shell.css`, et `.view { gap: … }` y est
   intact pour les autres écrans.
3. `perfRangeStart` n'a aucune branche calendaire (`getMonth()`, `setDate(1)`) dans le
   cas `month`.
4. Aucun `--text-agenda` au dépôt (le littéral est assumé, le token ne doit pas
   réapparaître par inadvertance).

Mesures DOM à rapporter, 1600 px, jour et nuit :

| | attendu |
|---|---|
| `top` de `.kpi-row` | 694 |
| écart entre bas de la nappe et première dalle | 54 |
| `left` de `.kpi-row` et de `.dash-avant-main` | identiques |
| repères d'axe du cadre d'encours | deux mois différents |
| écart affiché dans le cadre | ≠ `+0,0 %` |
| backdrop-filter rendus | 4, tous < 640 (pas de régression LOT 6) |
