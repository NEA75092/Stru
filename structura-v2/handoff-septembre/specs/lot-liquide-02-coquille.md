# spec — lot Liquide 02 : la coquille

Version 1 · 25/08/2026 · dépend de `specs/design-tokens-v3-liquide.md` (lot 01)
et de `specs/00-doctrine-liquide.md`.
Rendu cible et seule source de mesure : `Dashboard - Liquide.dc.html`.

---

## 0. Périmètre

La coquille, c'est ce qui est identique sur les neuf onglets : le cadre de page, le
rail de navigation, la nappe. **Le contenu des écrans n'est pas touché** — il vit
sous la nappe et se repeint tout seul grâce aux alias du lot 01.

Fichiers autorisés à changer, et aucun autre :

| Fichier | Nature du changement |
|---|---|
| `src/shell.css` | réécrit — cadre, rail, nappe |
| `index.html` | **une seule addition de DOM** : le bloc de la nappe (§ 3) |

Si un troisième fichier doit changer, s'arrêter et le dire.

## 1. Ce qui ne bouge pas

- **Les neuf onglets**, dans l'ordre du dépôt, avec leurs libellés exacts :
  Tableau de bord · Clients · Portefeuille · Barrières · Calendrier · Pilotage ·
  Pitch Engine · Decrement Score · Doc Reader.
- **Les neuf tracés d'icônes**, repris verbatim d'`index.html`. Ne pas les
  redessiner — c'est la panne du 06/08 et du 19/08, deux fois signalée.
- **Le monogramme et le lockup** : `assets/structura-mark.png` et ses variantes.
  Voir § 6, question ouverte.
- Le pied du rail (Mode démo, CSV, Excel, + Nouveau produit), la barre basse
  (recherche, notifications, jour/nuit, avatar), le badge de compteur sur
  Barrières. Mêmes éléments, mêmes libellés, même ordre.
- **Toute la logique JS.** Navigation, bascule de thème, `localStorage` : rien.

## 2. Le cadre de page

Relevé l. 65-66.

```css
body {
    margin: 0;
    background: var(--desk);
    color: var(--encre);
    font-family: 'Instrument Sans', system-ui, sans-serif;
    font-feature-settings: 'ss01';
    -webkit-font-smoothing: antialiased;
}
.app {
    width: 100%;
    min-width: 1600px;
    min-height: 100vh;
    background: var(--desk);
    padding: 30px;
    display: flex;
}
.app-coque {                       /* l'élément qui contient rail + vue */
    position: relative;
    flex: 1;
    min-width: 0;
    border-radius: var(--r-dalle);
    overflow: hidden;
    border: 1px solid color-mix(in oklab, var(--marine) 22%, transparent);
    display: flex;
}
```

Le `::after` de grain de la passe 8 est supprimé de `.app`.

Liens, partout :

```css
a         { color: var(--azur-profond); text-decoration: none; }
a:hover   { color: var(--azur); }
```

Barre de défilement :

```css
::-webkit-scrollbar        { width: 9px; }
::-webkit-scrollbar-thumb  { background: rgba(103,113,136,.3); border-radius: var(--r-plein); }
::-webkit-scrollbar-track  { background: transparent; }
```

## 3. Le rail de navigation

Relevé l. 68-152.

```css
.rail {
    position: relative;
    z-index: 40;
    width: 236px;
    flex: 0 0 auto;
    background: linear-gradient(180deg,
        var(--marine) 0%,
        color-mix(in oklab, var(--marine) 84%, #000) 62%,
        color-mix(in oklab, var(--marine) 68%, #000) 100%);
    display: flex;
    flex-direction: column;
    padding: 24px 16px 20px;
}
```

**Le rail est marine en jour comme en nuit.** Il ne suit pas la bascule de thème —
seule sa teinte `--marine` change de valeur. Acquis du 19/08, conservé.

### Le lockup

```
conteneur : display flex · align-items center · justify-content center
            gap 11px · padding 0 6px · margin 2px 0 32px
image     : width 38px · height 28px · object-fit contain
mot       : Jost 500 · 16px · letter-spacing .2em · color var(--sur-azur)
```

### Un item de nav

```css
.rail-item {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    min-height: 44px;
    border: none;
    border-radius: var(--r-nav);
    cursor: pointer;
    text-align: left;
    background: transparent;
    transition: background 220ms var(--ease);
}
.rail-item:hover        { background: var(--flottant); }
.rail-item[aria-current="page"] { background: var(--flottant); }
.rail-item[aria-current="page"]::before {   /* le liseré */
    content: "";
    position: absolute;
    left: 0; top: 9px; bottom: 9px;
    width: 2px;
    border-radius: var(--r-min);
    background: var(--azur-clair);
}
.rail-nav { display: flex; flex-direction: column; gap: 2px; }
```

Libellé : Jost · 14px · `letter-spacing: .012em` · `white-space: nowrap`.
Couleur `var(--sur-azur)` sur l'actif, `rgba(255,255,255,0.92)` sinon.

Icône : 18 × 18, `viewBox="0 0 20 20"`, `fill="none"`,
`stroke-width="1.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
Stroke `var(--azur-clair)` sur l'actif, `rgba(255,255,255,0.8)` sinon.

Badge de compteur (Barrières) : Jost · 11.5px · `padding: 2px 7px` ·
`border-radius: var(--r-plein)` · `background: rgba(255,255,255,0.16)` ·
`color: var(--sur-azur)` · `font-variant-numeric: tabular-nums`.

### Le pied

Séparé par `margin-top: 26px; padding-top: 22px; border-top: 1px solid
rgba(255,255,255,0.14)`, colonne à `gap: 9px`.

| Bouton | Style |
|---|---|
| MODE DÉMO · CSV · EXCEL | `padding: 11px 0` · `min-height: 44px` · `--r-plein` · fond transparent · `border: 1px solid var(--flottant-brd)` · Jost 11.5px `letter-spacing: .1em` · survol `background: var(--flottant)` |
| + Nouveau produit | mêmes métriques · `border: none` · `background: var(--azur-clair)` · `color: var(--marine)` · Jost 13.5px `letter-spacing: .02em` · survol `color-mix(in oklab, var(--azur-clair) 82%, #fff)` |

CSV et EXCEL sont côte à côte dans un flex à `gap: 9px`, chacun `flex: 1`.

### La barre basse

`margin-top: auto; padding-top: 22px`, flex à `gap: 6px`. Trois boutons ronds de
**44 × 44** (recherche, notifications, jour/nuit), icônes 16 px, fond transparent,
`border: 1px solid transparent`, survol `background: var(--flottant); border-color:
var(--flottant-brd)`, transition 260 ms. L'avatar est poussé à droite par
`margin-left: auto` : bouton 44 × 44 contenant une pastille de 34 px
(`--flottant` + `--flottant-brd`, initiales en Jost 12.5px `letter-spacing: .04em`).

Le bouton jour/nuit porte `aria-pressed` et garde son gestionnaire actuel.

## 4. La nappe

**Seule addition de DOM du lot.** Elle se place en premier enfant du conteneur de
vue, avant le contenu de l'écran.

```html
<div class="nappe" aria-hidden="true">
  <div class="nappe-eau"></div>
  <div class="nappe-derive-a"></div>
  <div class="nappe-derive-b"></div>
  <div class="nappe-voile"></div>
  <div class="nappe-halo"></div>
  <div class="nappe-arete-a"></div>
  <div class="nappe-arete-b"></div>
  <div class="nappe-fondu"></div>
</div>
```

Relevé l. 155-172.

```css
.nappe {
    position: absolute;
    left: 0; top: 0; right: 0;
    height: 640px;
    overflow: hidden;
    pointer-events: none;
}
.nappe > * { position: absolute; }

.nappe-eau {
    inset: 0;
    background: linear-gradient(161deg,
        color-mix(in oklab, var(--azur-clair) 42%, var(--azur)) 0%,
        var(--azur) 22%,
        color-mix(in oklab, var(--azur) 36%, var(--azur-profond)) 44%,
        var(--azur-profond) 68%,
        var(--marine) 100%);
}
.nappe-derive-a {
    left: 34%; top: -72%; width: 82%; height: 168%;
    border-radius: 46% 54% 42% 58%;
    background: radial-gradient(54% 54% at 42% 38%,
        color-mix(in oklab, var(--azur-clair) 82%, #fff), var(--azur) 58%, transparent 86%);
    filter: blur(64px);
    opacity: .62;
    animation: derive 46s var(--ease) infinite;
}
.nappe-derive-b {
    left: -22%; top: -44%; width: 60%; height: 134%;
    border-radius: 54% 46% 58% 42%;
    background: radial-gradient(52% 52% at 56% 48%, var(--azur-clair), transparent 76%);
    filter: blur(72px);
    opacity: .3;
    animation: derive 58s var(--ease) infinite reverse;
}
.nappe-voile {
    left: 58%; top: -14%; width: 30%; height: 124%;
    background: linear-gradient(180deg, rgba(255,255,255,.18), transparent 66%);
    filter: blur(46px);
    transform: rotate(10deg);
}
.nappe-halo {
    left: 4%; top: 34%; width: 52%; height: 86%;
    border-radius: 50%;
    background: radial-gradient(50% 50% at 50% 50%,
        color-mix(in oklab, var(--azur-clair) 34%, transparent), transparent 72%);
    filter: blur(58px);
    opacity: .5;
    animation: derive 64s var(--ease) infinite;
}
.nappe-arete-a {
    left: 10%; top: 13%; width: 70%; height: 1.5px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.38), transparent);
    filter: blur(2px);
    transform: rotate(-6.5deg);
}
.nappe-arete-b {
    left: 30%; top: 39%; width: 58%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
    filter: blur(1px);
    transform: rotate(5.5deg);
}
.nappe-fondu {
    inset: 0;
    background: linear-gradient(to bottom,
        transparent 42%,
        color-mix(in oklab, var(--desk) 22%, transparent) 66%,
        color-mix(in oklab, var(--desk) 62%, transparent) 84%,
        color-mix(in oklab, var(--desk) 92%, transparent) 95%,
        var(--desk) 100%);
}
```

**Ordre des huit couches obligatoire.** Le fondu est toujours dernier : c'est lui
qui raccorde l'eau au plâtre.

Le contenu de la vue passe en `position: relative; z-index: 20` pour se poser
au-dessus.

## 5. Les animations

Toutes dans `shell.css`, déclarées une fois.

```css
@keyframes colonne { from { opacity:0; translate:0 14px } to { opacity:1; translate:0 0 } }
@keyframes ligne   { from { opacity:0; translate:0 7px  } to { opacity:1; translate:0 0 } }
@keyframes jauge   { from { width:0 } to { width:var(--w) } }
@keyframes tracer  { from { stroke-dashoffset:1 } to { stroke-dashoffset:0 } }
@keyframes paraitre{ from { opacity:0 } to { opacity:1 } }
@keyframes derive  {
    0%,100% { transform: translate3d(0,0,0) rotate(0deg) scale(1) }
    50%     { transform: translate3d(2.5%,-2%,0) rotate(7deg) scale(1.06) }
}
@media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
}
```

Le bloc `prefers-reduced-motion` est **obligatoire** : sans lui, deux nappes de
64 px de flou tournent en boucle chez quelqu'un qui a demandé le contraire.

## 6. Question ouverte — la marque

La maquette porte **GUERFIN** et `assets/guerfin-symbole-clair.png`. Le dépôt porte
**Structura** et quatre fichiers `structura-lockup/mark`. Le fichier Guerfin
n'existe pas au dépôt.

**Ne pas trancher.** Employer `assets/structura-mark.png` avec le mot « STRUCTURA »
aux métriques du § 3, et signaler la divergence dans le rapport. Le renommage de
produit, s'il a lieu, est une décision client, pas un choix d'implémentation.

## 7. Preuve de fin

| # | Sonde | Attendu |
|---|---|---|
| 1 | `git diff --stat` | exactement 2 fichiers : `shell.css`, `index.html` |
| 2 | `check-tokens.mjs`, `check-sources.mjs` | verts |
| 3 | `box-shadow` dans `src/` | 0 hors `--shadow-float` |
| 4 | `.nappe` mesurée au DOM | `height: 640px` |
| 5 | `.rail` mesuré au DOM | `width: 236px` |
| 6 | hauteur de chaque `.rail-item` au DOM | ≥ 44px, les neuf |
| 7 | les neuf `d=` d'icônes | identiques à ceux d'avant le lot, au caractère près |
| 8 | captures **1600 px jour + nuit** | Dashboard, Clients, Calendrier, Pitch Engine |

La sonde 7 se vérifie avec un `git diff` sur les attributs `d` : il doit être vide.
La sonde 8 couvre quatre onglets exprès — la coquille est partagée, un défaut
dessus se voit partout ou nulle part.
