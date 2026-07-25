# Passe 1 — la coquille

Une seule tâche, un seul commit. Ne rien faire d'autre.

## Fichiers fournis

- `src/shell.css` — la feuille de coquille, écrite. **À ne pas récrire.**
- `tests/css-hygiene.test.js` — la barrière.
- `CLAUDE.md` — les règles.

## Étapes

### 1. Poser les fichiers
- `src/shell.css`, `tests/css-hygiene.test.js`, `CLAUDE.md` à la racine du repo.
- Ajouter au `test` de `package.json` : `&& node tests/css-hygiene.test.js`
- Dans `index.html`, charger `shell.css` **après** `design-tokens.css` et
  supprimer le paramètre de cache-busting périmé :
  ```html
  <link rel="stylesheet" href="./src/design-tokens.css?v=20260726" />
  <link rel="stylesheet" href="./src/shell.css?v=20260726" />
  <link rel="stylesheet" href="./src/styles.css?v=20260726" />
  <link rel="stylesheet" href="./src/institutional-theme.css?v=20260726" />
  <link rel="stylesheet" href="./src/dashboard.css?v=20260726" />
  ```
  `shell.css` est chargée **avant** les anciennes feuilles volontairement : elle
  ne doit gagner par aucun artifice d'ordre. Elle gagne parce que les règles
  concurrentes sont supprimées à l'étape 3.

### 2. Remplacer le logo par le wordmark
Dans `index.html`, remplacer le bloc `.sidebar-brand` :
```html
<div class="sidebar-brand">
    <span class="sidebar-wordmark">Structura</span>
    <span class="sidebar-wordmark-dot" aria-hidden="true"></span>
</div>
```
Supprimer `assets/structura-logo-sidebar.png` et
`assets/structura-logo-wordmark-transparent.png`, et toute référence à
`.sidebar-logo` / `.header-logo` / `.logo-img` / `.logo-text` / `.logo-ver`
dans le CSS et le JS.

### 3. Supprimer les règles concurrentes
Pour **chaque** sélecteur déclaré dans `src/shell.css`, supprimer toutes ses
autres déclarations dans `styles.css`, `institutional-theme.css` et
`dashboard.css` — y compris les variantes `#view-x .sel`, `:hover`, `.active`,
et les blocs `@media` correspondants.

Le test 4 (`aucun sélecteur migré n'est encore déclaré dans une ancienne
feuille`) liste précisément ce qui reste. Le faire passer, sélecteur par
sélecteur. Points de vigilance relevés à l'audit :

| Sélecteur | Déclarations à supprimer |
| --- | --- |
| `.sidebar-brand` | `institutional-theme.css:3762` (le dégradé corail) et `:3815` |
| `.sidebar-logo` | `institutional-theme.css:3770`, `:3811`, `styles.css:101`, `:5114` |
| `.sidebar`, `.sidebar-nav`, `.sidebar-foot` | 4 à 5 déclarations chacun, 2 fichiers |
| `.nav-tab`, `.nav-tab.active`, `.nav-tab .ico`, `.nav-tab .tab-badge` | 4 à 5 chacun ; **attention** à `.nav-tab:not(.active)` dans `institutional-theme.css`, plus spécifique et invisible à une recherche du sélecteur exact |
| `.user-avatar` | `styles.css:273`, `institutional-theme.css:234`, `:4007` |
| `.user-pill`, `.header-user-pill` | `styles.css:249`, `institutional-theme.css:226`, `:3095`, `:3995` |
| `.header-right`, `.header-ticker`, `.live-badge`, `.clock` | 4 à 5 chacun |
| `.btn`, `.btn-gold` | `.btn` 5 fois ; `.btn-gold` 4 fois — supprimer entièrement |
| `.theme-toggle` | `institutional-theme.css:3952-3979` |

### 4. Renommer `.btn-gold` → `.btn-primary`
Dans `index.html` et dans tous les modules de `src/modules/` qui génèrent du
HTML (`app-portfolio.js:617`, `app-analytics.js:179`, et les autres occurrences).
Le bouton devient bleu. Le corail ne sert plus de fond de bouton.

### 5. Sortir la couleur du HTML
Supprimer les 33 attributs `style=` de couleur d'`index.html`
(`style="color: var(--red)"`, `var(--orange)`, `var(--blue)`, `var(--gold)` —
lignes 182, 195, 208, 288 et suivantes). Porter la couleur par classe sur le
conteneur existant : `.kpi.k-red .kpi-val { color: var(--color-danger); }`
Ces règles-là appartiennent à la passe 2 : les mettre dans `dashboard.css` pour
l'instant, sans `!important`.

### 6. Vérifier
```
npm test
```
Puis, **avant de commiter**, deux captures d'écran : thème clair et thème
sombre, sidebar + header visibles. Vérifier point par point :

- [ ] Aucun fond ni halo derrière le wordmark, dans les deux thèmes.
- [ ] Le wordmark est lisible en sombre (il hérite de `--color-ink`).
- [ ] Wordmark et onglets alignés sur la même gouttière gauche (20 px).
- [ ] Bouton de thème, avatar, badge LIVE : même hauteur (36 px), même axe.
- [ ] Initiales parfaitement centrées dans le carré de l'avatar.
- [ ] Aucun bouton orange nulle part.
- [ ] La pastille de nav glisse sans décalage sur l'onglet actif.

## Critère d'acceptation

`npm test` vert **et** les deux captures fournies. Sans les captures, la passe
n'est pas terminée — même si le test passe.

## Interdits pour cette passe

- Toucher au contenu ou à la mise en page d'une vue (c'est la passe 2 et 3).
- Récrire `shell.css` ou `css-hygiene.test.js`.
- Ajouter un `!important`, où que ce soit.
- Créer un nouveau fichier CSS.
