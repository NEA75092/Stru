# LOT 7 — message à Claude Code

Spec : `structura-v2/handoff-septembre/specs/lot-liquide-07-vide-et-fenetre-mois.md`
(à lire au dépôt, pas ici). Elle corrige `ab999ee` sans le remplacer. Petit lot.

Deux défauts vus sur les captures du LOT 6, à 1600 px, jour et nuit à l'identique.

## A — le vide sous la nappe (§ 2 de la spec)

L'eau finit à 640, la première dalle du plâtre doit suivre à 694. Deux valeurs
s'additionnent là où la maquette n'en a qu'une (`margin: 54px 28px` sur le plâtre,
maquette l. 246) : le `gap` hérité de `.view` (`shell.css` l. 311) et le
`padding: 40px 44px 44px` de `.dash-body`.

`shell.css` — ajouter, sans toucher à `.view { gap: … }` que les huit autres écrans
consomment :

```css
#view-dashboard {
    gap: 0;
}
```

`dashboard.css` — `.dash-body` devient :

```css
.dash-body {
    display: flex;
    flex-direction: column;
    gap: 44px;
    margin: 54px 28px;
    padding: 0;
}
```

Le latéral passe de 44 à 28 : c'est la valeur de la maquette.

**Ce que je t'avais dit et qui était faux** : `.kpi-row` n'a aucune marge résiduelle à
retirer — je l'ai relu au dépôt après coup, la règle ne porte que `display`,
`grid-template-columns` et `gap`. N'y touche pas.

Si la dalle ne tombe pas à 54 px sous l'eau après ces deux règles, **arrête-toi et
nomme la troisième source** (mesure `.tilt-scope` sur `.kpi-row` d'abord). Aucune
compensation par une valeur négative.

## B — la fenêtre « Mois » du cadre d'encours (§ 3 de la spec)

Au 01/09, le mois calendaire ne contient qu'un point : ligne plate, `+0,0 %`,
« soit +0 € sur la période », et les deux repères d'axe qui lisent tous les deux
`SEPT`. Le cadre d'encours ne montre rien.

Dans `perfRangeStart` (`app-dashboard.js`), le cas `month` devient une fenêtre
glissante de 30 jours, même forme que `6m` et `1a` :

```js
if (range === "month") {
  const d = new Date(now);
  d.setDate(d.getDate() - 30);
  return d;
}
```

Aucune branche calendaire (`setDate(1)`, `getMonth()`) dans ce cas. Pas d'état vide,
pas de bascule automatique vers 6M — le bouton actif ne doit jamais mentir sur ce qui
est affiché. La série reste `buildPerfSeries(data, 'month')` : même fonction, même
historique que le graphe YTD du plâtre (garde-fou nº 1 du LOT 6, inchangé).

Rien à réécrire à la main derrière : les repères d'axe, l'écart et le
« soit … € sur la période » se dérivent déjà du premier et du dernier point de la série.
Le libellé du bouton reste `Mois`.

## Périmètre et hygiène

`src/shell.css`, `src/dashboard.css`, `src/modules/app-dashboard.js`, bump `?v=` dans
le même commit que l'édition CSS. Rien d'autre : aucun fichier de calendrier, aucune
couleur, aucun token nouveau ni retiré. Le `17.5px` des titres d'agenda et d'alertes
**reste littéral** — pas de `--text-agenda`, la sonde le vérifie.

## Preuves à me rendre

- `preuve-liquide --lot 7` (4 sondes, § 6 de la spec), `--lot 6`, `--lot 5`,
  `check-tokens`, `check-sources`.
- Mesures DOM à 1600 px, jour et nuit : `top` de `.kpi-row` = 694 · écart eau /
  première dalle = 54 · `left` de `.kpi-row` = `left` de `.dash-avant-main` · les deux
  repères d'axe du cadre d'encours sur deux mois différents · l'écart affiché ≠
  `+0,0 %` · 4 backdrop-filter rendus, tous sous 640 (pas de régression LOT 6).
- Captures premier plan (0–720) et page complète, jour et nuit.
