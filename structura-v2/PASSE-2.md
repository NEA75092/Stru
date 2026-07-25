# Passe 2 — le dashboard

La passe 1 est bonne : la coquille est propre et alignée dans les deux thèmes.
Les deux captures révèlent en revanche deux défauts que le test ne pouvait pas
voir, plus une série d'erreurs sémantiques. Cette passe les corrige.

## Fichiers fournis

- `src/dashboard.css` — réécrit intégralement. **Remplace** l'ancien fichier.
- Le bloc de tokens sombres ci-dessous, à substituer dans `design-tokens.css`.

---

## Étape 0 — LE mode sombre (priorité absolue)

Sur la capture sombre, les cartes sont **invisibles** : le fond de page est
`#1b1811`, la surface des cartes `#242019` — 4 % d'écart de luminance — et la
bordure à 12 % d'opacité ne les détache pas. Résultat : un écran noir avec du
texte flottant. Ce n'est pas un bug de règle CSS, c'est l'échelle de neutres
sombres qui est trop resserrée.

Remplacer **tout** le bloc `:root[data-theme="dark"]` de `design-tokens.css`
par celui-ci :

```css
:root[data-theme="dark"] {
    /* Fond nettement plus sombre que les surfaces : 3 marches
       distinctes (bg → surface-1 → surface-2), écart minimum de 8 %
       de luminance entre chacune, sinon les cartes disparaissent
       (constat capture 25/07). Même famille chaude que le clair. */
    --color-bg: #14110b;
    --color-surface-1: #211d15;
    --color-surface-2: #2b261c;
    --color-surface-3: #383024;
    --color-surface-1-hover: #29241a;
    --color-surface-2-hover: #332d21;
    --color-surface-3-hover: #423928;
    --color-wash: #1a170f;
    --color-border: rgb(238 228 206 / 0.16);
    --color-border-strong: rgb(238 228 206 / 0.26);
    --color-divider: rgb(238 228 206 / 0.1);

    --color-ink: #f3efe2;
    --color-text-primary: #f3efe2;
    --color-text-secondary: #b3a795;
    --color-text-tertiary: #8a7f6e;

    /* Le corail pur brûle sur fond sombre : version désaturée pour le
       texte et les tints, le corail plein reste réservé au bloc
       d'alerte du mode clair. */
    --color-coral: #e59274;
    --color-aegean: #4a97d6;
    --color-aegean-tint: rgb(74 151 214 / 0.18);
    --color-coral-tint: rgb(229 146 116 / 0.16);
    --color-ocean-tint: rgb(20 110 156 / 0.22);
    --color-success: #4caf7d;
    --color-warning: #e0a25c;
    --color-danger: #e06a5b;

    --shadow-card: none;
    --shadow-card-hover: 0 4px 14px rgb(0 0 0 / 0.4);
    --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.35);
    --shadow-md: 0 6px 16px rgb(0 0 0 / 0.38);
    --shadow-lg: 0 16px 32px rgb(0 0 0 / 0.45);
}
```

Vérification : en sombre, chaque carte doit se détacher du fond **sans qu'on
ait besoin de chercher sa bordure**. Si les cartes se confondent encore, c'est
que le fond n'est pas assez sombre — ne pas éclaircir les cartes pour
compenser.

---

## Étape 1 — Poser `dashboard.css`

Le fichier fourni remplace l'ancien. Puis, pour **chaque** sélecteur qu'il
déclare, supprimer toutes ses autres déclarations dans `styles.css` et
`institutional-theme.css` — variantes `#view-dashboard .x`, `:hover`, `@media`
comprises. Le test 4 de `css-hygiene` liste ce qui reste.

Ajouter `"dashboard.css"` à `MIGRATED` et passer `STAGES.dashboard` à `true`.

---

## Étape 2 — Les 6 corrections JS

Le CSS seul ne peut pas les faire : ce sont des valeurs écrites dans
`app-dashboard.js`.

### 2.1 Les emojis dans les alertes
`buildPortfolioAlerts()` produit `ico: "🔴"` / `"🟡"`, et l'état vide `"✅"`.
Supprimer la propriété `ico`. Dans `renderAlerts()`, remplacer
`<span class="al-ico">${a.ico}</span>` par `<span class="al-dot"></span>`
(et `al-ok` pour l'état vide). La couleur vient de `.al-crit`/`.al-warn`/`.al-ok`.

### 2.2 La performance négative affichée en vert
`index.html` porte `class="kpi-sub up"` **en dur** sur `#kpi-total-sub` : un
`-6,83 %` reste donc vert. Retirer `up` du HTML et, dans
`renderDashboardSummary()`, après le `setText("kpi-total-sub", …)` :

```js
const totalSub = document.getElementById("kpi-total-sub");
if (totalSub) {
  totalSub.classList.toggle("up", totalNominal > 0 && pnlPct >= 0);
  totalSub.classList.toggle("dn", totalNominal > 0 && pnlPct < 0);
}
```

### 2.3 Les couleurs du donut, écrites en dur
`buildIssuerDonutSvg()` contient `["#1f6fb2", "#f0916f", "#9dc2e2"]` et
`"#d8cdb6"`. Les lire depuis les tokens, sinon le donut garde les couleurs du
mode clair en mode sombre :

```js
const css = getComputedStyle(document.documentElement);
const token = (name) => css.getPropertyValue(name).trim();
const PALETTE = [token("--color-aegean"), token("--color-coral"), token("--color-sky")];
const REST_COLOR = token("--color-neutral-warm");
```

### 2.4 Les couleurs froides du graphique de performance
`drawPerfHistory()` utilise `labelColor = "#8b93a6"` et
`markerRing = "#1a2029"` en sombre : deux gris **froids**, hérités de
l'ancienne échelle, sur des cartes désormais chaudes. Les remplacer par les
tokens (`--color-text-tertiary` et `--color-surface-1`) via le même helper
`token()`. `lineColor` passe aussi par `--color-aegean`.

### 2.5 Le `style=` injecté par le JS
`renderAlerts()` et `evHtml()` injectent `style="cursor:pointer"`. Le curseur
est déjà porté par `.al` et `.ev` dans le CSS : supprimer ces attributs.

### 2.6 Le sparkline
`renderKpiSparkline()` cible `#kpi-total-spark`, qui n'existe pas dans
`index.html` — le tracé visible sur la capture vient donc d'ailleurs, et il
flotte à côté du chiffre sans axe ni référence. Ajouter le SVG dans la carte,
à l'intérieur de `.kpi-val`, après le chiffre :

```html
<svg class="kpi-spark" id="kpi-total-spark" viewBox="0 0 52 20" aria-hidden="true"></svg>
```
Si un autre tracé existait, le supprimer.

---

## Étape 3 — Vérifier

```
npm test
```

Puis captures dans `screenshots/passe2-clair.png` et `passe2-sombre.png`,
1440px, **dashboard scrollé jusqu'en bas** pour montrer Top/Flop, exposition et
agenda. Checklist :

- [ ] En sombre : les 4 cartes KPI se détachent nettement du fond.
- [ ] Les 4 cartes KPI ont le même fond et la même bordure — aucune n'est
      remplie en corail ; la criticité se lit sur le filet gauche et le chiffre.
- [ ] Les 4 chiffres KPI sont sur la même ligne de base, même quand un libellé
      passe sur deux lignes.
- [ ] `-6,83 %` s'affiche en rouge, pas en vert.
- [ ] Aucun emoji nulle part sur le dashboard.
- [ ] Aucun nom de produit ni montant en bleu.
- [ ] Top/Flop VL : une seule liste, les % et les montants alignés sur les
      mêmes deux colonnes du haut en bas du bloc.
- [ ] Le bandeau d'indices n'est pas tronqué à gauche (fondu, pas coupe nette).
- [ ] Le donut et le graphique de performance suivent le thème sombre.

## Interdits

- Ajouter un `!important`, un fichier CSS, un bloc ou une métrique.
- Éclaircir les cartes en sombre plutôt qu'assombrir le fond.
- Toucher aux vues Clients / Pilotage / autres (c'est la passe 3).
