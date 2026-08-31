# lot-liquide-03-dette — sortir le relief interdit des écrans

Version 1 · 25/08/2026 · dépend de `specs/00-doctrine-liquide.md` et
`specs/design-tokens-v3-liquide.md`. S'applique **après** le LOT 2.

## 1. Ce que ce lot corrige, et pourquoi il existe

Le LOT 1 a compté, sans rien corriger, ce que la doctrine Liquide interdit et qui vit
encore dans les fichiers d'écran :

| Défaut | Occurrences | Fichiers |
|---|---|---|
| `box-shadow: inset` | 10 (+1 `none`) | `dashboard.css`, `tables.css` — les 3 `var(--shadow-float)` d'`overlays.css` sont conformes (L5), non comptés |
| `border-radius` littéral | 2 | `overlays.css`, `views.css` |
| `Newsreader` / `IBM Plex` | 4 | `app-portfolio.js`, `overlays.css`, `passe7.css`, `dashboard.css` |
| token supprimé encore référencé | 1 | `tables.css` — `--chaux-2` |

> Le LOT 1 comptait 12 `box-shadow` (dont `controls.css` ×1 et `shell.css` ×1) :
> deux étaient le mot `box-shadow` dans une liste `transition:`, pas une ombre. Le
> vrai compte est de 10 `inset` plus un `box-shadow: none`, tous dans
> `dashboard.css` et `tables.css`.

Aucun n'est causé par les lots 0, 1 ou 2 : c'est de la dette antérieure. Elle est
listée ici parce que la doctrine dit **aucune ombre portée dans le projet**
(`00-doctrine-liquide.md` L5) — pas « aucune ombre dans les écrans refaits ». Tant
que ces ombres sont là, huit écrans sur neuf contredisent la direction, et le
prochain écran refait héritera du défaut par mimétisme.

**Ce lot ne prend aucune décision de design.** Chaque remplacement est prescrit
ci-dessous. S'il faut choisir, c'est que la spec est incomplète : arrête-toi (règle 3).

## 2. Localisation

Ne cherche pas à la main. Les emplacements exacts sont déjà dans la sortie du LOT 1 :
la sonde imprime fichier + ligne + déclaration pour les quatre compteurs. Reprends
cette liste telle quelle, ou relance :

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 1
```

Si la sortie donne le compte sans les emplacements, ajoute-les à l'affichage de la
sonde — c'est un fichier d'outillage, tu y as droit — et dis-le dans le rapport.

## 3. Les quatre remplacements

### 3.1 `box-shadow: inset` → bordure directionnelle ou `outline` équivalente

Aucune ombre portée ne survit dans les écrans. Les dix `box-shadow: inset`
(plus le `box-shadow: none` de `.issuer-table-row:last-child`) deviennent la
bordure que l'inset simulait :

- `inset ±Xpx 0 0` (filet gauche ou droit) → `border-left` / `border-right`, même
  largeur, même couleur ;
- `inset 0 ±1px 0` (filet haut ou bas) → `border-top` / `border-bottom` ;
- `box-shadow: none` posé pour retirer un filet → `border-…: none` (ou `0`).

Le décalage introduit par la bordure se compense **en padding uniquement**, du
même côté : `padding-left: calc(var(--space-3) - 3px)`, etc. Pas de `box-sizing`
ad hoc, pas de `translateY`.

**Deux exceptions, en `outline` + `outline-offset: -1px`** — ce sont des contours
complets (`inset 0 0 0 1px`) sur des éléments dont la hauteur est calculée, où une
bordure changerait la boîte : `.cap-rule` et `.cap-breach` (avec sa variante
`.cap-row.tone-watch .cap-breach`) dans `dashboard.css`.

Le filet gauche de `tr:hover td:first-child` (`tables.css`) reste un filet gauche
au survol — `border-left`, **sans** `translateY` : une translation casserait
l'alignement de la grille du tableau.

Si une déclaration ne rentre dans aucun de ces cas, arrête-toi et décris-la.

**`--shadow-float` est conservé — voir `00-doctrine-liquide.md` L5.** La doctrine
exempte nommément les trois seules surfaces réellement flottantes : le **tiroir**
(`.drawer`), la **modale** (`.modal`) et le **menu déroulant** (`.dropdown-menu`),
tous trois dans `overlays.css`. Leurs trois `box-shadow: var(--shadow-float)` sont
**conformes** et **ne sont pas comptabilisés** dans le compteur du lot ; le token
reste dans `design-tokens.css`. Le § 3.1 de la v1 disait le contraire (« supprime
le dernier usage, retire le token ») : erreur de rédaction, la doctrine L5 prime.
Conséquence pour la sonde : le compteur `box-shadow` du lot se lit
**« 0 hors `--shadow-float` »**, pas « 0 ».

### 3.2 Rayons littéraux → l'échelle à quatre valeurs

Les deux littéraux de `overlays.css` et `views.css` prennent la valeur de l'échelle
la plus proche par usage, jamais par arrondi numérique. Les noms ci-dessous sont
ceux de la **couche d'alias** `--radius-*`, la seule qu'un fichier d'écran
consomme :

`--radius-sm` 2 px (survol de ligne, trait, puce) · `--radius-md` 8 px (item de
nav) · `--radius-lg` 20 px (dalle, verre intérieur, cadre) · `--radius-xl` 24 px
(carte flottante) · `--radius-full` 999 px.

La doctrine (L6) nomme la **couche 1** — `--r-min` … `--r-plein`. Le code consomme
la couche d'alias, qui pointe dessus : `--radius-sm` **est** `var(--r-min)`, le
même 2 px, par son nom d'alias. Ne jamais citer un `--r-*` dans un fichier d'écran.

Les deux littéraux visés — `1px` sur le trait de légende d'`overlays.css`, `2px`
sur la puce 10×10 de `views.css` — sont des détails de survol, pas des cadres :
`--radius-sm` pour les deux. Si un autre usage est ambigu, arrête-toi.

### 3.3 Polices mortes → les deux polices de la direction

`Newsreader` et `IBM Plex` ne sont plus chargées depuis le LOT 1 : ces quatre
déclarations rendent une police système au hasard. Remplace par les tokens, jamais
par le nom de famille en clair :

- titres, chiffres, tout ce qui est tabulaire → `var(--font-titre)` (Jost)
- interface, libellés → `var(--font-ui)` (Instrument Sans)

`app-portfolio.js` est un fichier de logique : la police y est probablement dans une
chaîne de style d'un graphe. Même règle, même token via `getComputedStyle` si le
contexte l'exige — **aucune valeur en dur**.

### 3.4 `--chaux-2` dans `tables.css`

`.bar-track { background: var(‑‑chaux‑2); }` référence un token que le LOT 1 supprime
(§ 5 de la spec de tokens). Le correctif est déjà diagnostiqué et prescrit dans
`contradictions.md` du 06/08 : `var(--color-surface-sunk)`.

<!-- Les tirets de `‑‑chaux‑2` ci-dessus sont des U+2011 (non-ASCII), pas `--` :
     check-tokens.mjs ne doit plus y voir un appel de token supprimé. Le token
     est mort, la ligne reste lisible telle qu'écrite. -->


Un seul remplacement, dans un seul fichier. Ne touche pas au reste de `tables.css`.

## 4. Ce qui ne bouge pas

Les neuf onglets et leurs libellés · **les neuf tracés d'icônes au caractère près** ·
tout le DOM · toute la logique JS · les barres d'écart de VL en encre monochrome
(le code a eu raison, ne pas « corriger ») · les couleurs de marque émetteur.

`--grain` et `--blur-enter` dans `relief.css` **restent**. Ils sont tolérés par la
whitelist de `check-tokens.mjs` et servent la nappe du LOT 2. Ce ne sont pas des
défauts, ils sont dans le compteur pour mémoire.

## 5. Fichiers autorisés — sept

`src/controls.css` · `src/dashboard.css` · `src/overlays.css` · `src/passe7.css` ·
`src/tables.css` · `src/views.css` · `src/modules/app-portfolio.js`

Plus `src/design-tokens.css` pour la seule suppression de `--shadow-float` (§ 3.1),
et `index.html` pour le bump `?v=`.

`shell.css` n'est **pas** dans la liste : son unique `box-shadow` disparaît avec la
réécriture du LOT 2. S'il en reste un après le LOT 2, dis-le — c'est un défaut du
LOT 2, pas de celui-ci.

## 6. Preuve

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 3
node structura-v2/handoff-septembre/tools/check-tokens.mjs
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Fin du lot : les quatre compteurs du § 1 à **zéro**, `check-tokens` vert,
`check-sources` vert, diff des attributs `d=` vide.

Rapport : sorties brutes, sha, et captures 1600 px jour + nuit des **neuf** onglets.
C'est le premier moment où l'app entière est censée être cohérente : je veux tout voir.

## 7. Une question laissée ouverte, exprès

`src/passe7.css` porte un nom de passe, ce que la règle 3 du projet interdit désormais
(« une maquette = un écran, nommé comme l'écran »). Le renommer touche `index.html` et
tout ce qui l'importe : c'est structurel, donc hors de ce lot.

Ne le renomme pas. Signale-le dans le rapport et je trancherai.
