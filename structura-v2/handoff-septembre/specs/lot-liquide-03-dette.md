# lot-liquide-03-dette — sortir le relief interdit des écrans

Version 1 · 25/08/2026 · dépend de `specs/00-doctrine-liquide.md` et
`specs/design-tokens-v3-liquide.md`. S'applique **après** le LOT 2.

## 1. Ce que ce lot corrige, et pourquoi il existe

Le LOT 1 a compté, sans rien corriger, ce que la doctrine Liquide interdit et qui vit
encore dans les fichiers d'écran :

| Défaut | Occurrences | Fichiers |
|---|---|---|
| `box-shadow` | 12 | `controls.css`, `dashboard.css` (×6), `shell.css`, `tables.css` (×3) |
| `border-radius` littéral | 2 | `overlays.css`, `views.css` |
| `Newsreader` / `IBM Plex` | 4 | `app-portfolio.js`, `overlays.css`, `passe7.css`, `dashboard.css` |
| token supprimé encore référencé | 1 | `tables.css` — `--chaux-2` |

Aucun n'est causé par les lots 0, 1 ou 2 : c'est de la dette antérieure. Elle est
listée ici parce que la doctrine dit **aucune ombre portée dans le projet** — pas
« aucune ombre dans les écrans refaits ». Tant que ces douze ombres sont là, huit
écrans sur neuf contredisent la direction, et le prochain écran refait héritera du
défaut par mimétisme.

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

### 3.1 `box-shadow` → relief par bordure et translation

Aucune ombre ne survit. Pour chaque déclaration, deux cas et deux seuls :

- **L'ombre marquait un survol ou un état actif** → supprime-la et donne à l'état
  `transform: translateY(-3px)` avec `transition: transform 160ms ease`, plus
  `border-color: var(--color-border-strong)`. C'est le relief de la doctrine.
- **L'ombre marquait une élévation permanente** (carte, panneau, dalle) → supprime-la
  sans compensation, et laisse la bordure `1px solid var(--color-border)` porter la
  séparation. Une dalle du plâtre est mate et plate : c'est voulu, pas un manque.

Si une troisième situation apparaît — une ombre qui ne fait ni l'un ni l'autre —
arrête-toi et décris-la. N'improvise pas un équivalent.

**`--shadow-float` n'est pas une exception.** Le LOT 1 l'a laissé dans la liste des
noms pour ne pas casser la compilation ; ce lot en supprime le dernier usage, puis
retire le token lui-même de `design-tokens.css`. Du code mort sort (doctrine).

### 3.2 Rayons littéraux → l'échelle à quatre valeurs

Les deux littéraux de `overlays.css` et `views.css` prennent la valeur de l'échelle
la plus proche par usage, jamais par arrondi numérique :

`--radius-min` 2 px (survol de ligne) · `--radius-nav` 8 px (item de nav) ·
`--radius-dalle` 20 px (dalle, verre intérieur, cadre) · `--radius-verre` 24 px
(carte flottante) · `--radius-full` 999 px.

Un overlay est un cadre → `--radius-dalle`. Si l'usage est ambigu, arrête-toi.

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

`.bar-track { background: var(--chaux-2); }` référence un token que le LOT 1 supprime
(§ 5 de la spec de tokens). Le correctif est déjà diagnostiqué et prescrit dans
`contradictions.md` du 06/08 : `var(--color-surface-sunk)`.

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
