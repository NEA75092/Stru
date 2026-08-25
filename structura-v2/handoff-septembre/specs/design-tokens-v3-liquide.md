# spec — design tokens v3 « Liquide »

Version 2 · 25/08/2026 · **remplace** la couche chromatique de la passe 8 dans
`src/design-tokens.css`.
Rendu cible et seule source de mesure : `Dashboard - Liquide.dc.html`.

> **v2 annule deux décisions de la v1** : le renommage `data-theme="dark"` →
> `"nuit"` (risque pour zéro gain visible) et la suppression du vocabulaire
> `--color-*` (remplacée par la couche d'alias du § 4, qui est le cœur de ce lot).

---

## 0. Le principe de ce lot

**Rien de structurel ne change. Seule la peinture change.** Mêmes onglets, mêmes
outils, même DOM, mêmes fonctionnalités.

L'app consomme aujourd'hui trente et un noms `--color-*`, six `--radius-*`, cinq
`--shadow-*`, trois `--font-*` et six `--text-*`. Ces noms **restent**. On réécrit
uniquement ce vers quoi ils pointent.

Conséquence : **aucun fichier d'écran n'est édité dans ce lot.** Un seul fichier
change, `src/design-tokens.css`, et toute l'app se repeint.

C'est aussi le chemin qui minimise l'erreur : il n'y a pas de conversion manuelle
écran par écran, donc pas d'occasion d'en oublier un.

## 1. Deux couches, dans cet ordre

```
couche 1 — les tokens Liquide   (§ 2 / § 3)  la source de vérité, noms nouveaux
couche 2 — les alias hérités    (§ 4)        les noms que l'app consomme déjà
```

La couche 2 ne contient **que** des `var()` et des `color-mix()` pointant vers la
couche 1. Pas un seul littéral. Un jour on supprimera la couche 2 écran par écran ;
ce n'est pas ce lot.

## 2. Couche 1 — Liquide, jour

Relevé à `Dashboard - Liquide.dc.html` l. 15-33. Aucune valeur inventée.

```css
:root {
    /* Le fond de bureau */
    --desk: #E1E4E3;

    /* L'eau — quatre profondeurs */
    --azur: #4696B3;
    --azur-clair: #8FD3E6;
    --azur-profond: #136C95;
    --marine: #073D5D;

    /* L'encre — trois niveaux, jamais plus */
    --encre: #111111;
    --encre-2: #5B6577;
    --encre-3: #7C8790;
    --trait: rgba(17, 17, 17, 0.08);
    --rail: rgba(17, 17, 17, 0.08);
    --encre-faible: rgba(17, 17, 17, 0.16);

    /* Sur la nappe — le seul texte qui vit sur l'eau */
    --sur-azur: #FFFFFF;
    --sur-azur-2: rgba(255, 255, 255, 0.74);

    /* Le risque — réservé à la distance de barrière */
    --vert: #1F6B41;
    --rouge: #FF5557;
    --ambre: #E0972A;
    --rouge-encre: #3A0A0B;

    /* Le verre — premier plan uniquement */
    --flottant: rgba(255, 255, 255, 0.22);
    --flottant-brd: rgba(255, 255, 255, 0.42);
    --verre: linear-gradient(155deg, rgba(255,255,255,.95), rgba(238,246,247,.87));
    --verre-brd: rgba(255, 255, 255, 0.92);

    /* Le plâtre — trois dalles mates */
    --dalle-a: linear-gradient(150deg, #F2F8F9 0%, #FBFCFB 48%, #FDF5EB 100%);
    --dalle-b: linear-gradient(160deg, #FEF7EE 0%, #FDF5EB 60%, #FCEFE0 100%);
    --dalle-c: linear-gradient(190deg, #FDF6EC 0%, #FCFBF8 58%, #FAFCFC 100%);

    /* Équivalents plats des trois dalles — le stop médian de chaque dégradé.
       Nécessaires parce qu'un dégradé ne peut pas servir de background-color.
       Relevés, pas inventés : ce sont les stops 48% / 60% / 58% ci-dessus. */
    --dalle-a-plat: #FBFCFB;
    --dalle-b-plat: #FDF5EB;
    --dalle-c-plat: #FCFBF8;

    /* Pastilles pleines */
    --puck: #FFFFFF;
    --chip: #FFFFFF;
    --chip-encre: #111111;

    /* Survol de ligne */
    --survol: color-mix(in oklab, var(--azur) 7%, transparent);

    /* Marque émetteur : teinte seule, clarté et chroma du système */
    --em-l: .575;
    --em-c: .165;

    /* Voile des overlays. AJOUT ASSUMÉ : la maquette n'a ni tiroir ni modale,
       la valeur est dérivée de --marine, pas reprise de la passe 8. */
    --voile: rgb(7 61 93 / 0.42);

    /* Rayons — cinq valeurs, pas une de plus */
    --r-min: 2px;
    --r-nav: 8px;
    --r-dalle: 20px;
    --r-verre: 24px;
    --r-plein: 999px;

    /* Mouvement */
    --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## 3. Couche 1 — Liquide, nuit

Sélecteur inchangé : **`:root[data-theme="dark"]`**. Le nom `dark` du dépôt est
conservé — il n'est visible de personne, et le renommer touche trois langages pour
rien.

```css
:root[data-theme="dark"] {
    --desk: #0B0F13;

    --azur: #1E5F7C;
    --azur-clair: #4EA8C4;
    --azur-profond: #0B3F5C;
    --marine: #04222F;

    --encre: #F0F3F2;
    --encre-2: #A9B5C0;
    --encre-3: #8792A0;
    --trait: rgba(255, 255, 255, 0.10);
    --rail: rgba(255, 255, 255, 0.10);
    --encre-faible: rgba(255, 255, 255, 0.22);

    --vert: #4FA87A;
    --rouge: #FF7A7C;
    --ambre: #EDB65C;
    --rouge-encre: #2A0708;

    --flottant: rgba(255, 255, 255, 0.10);
    --flottant-brd: rgba(255, 255, 255, 0.20);
    --verre: linear-gradient(155deg, rgba(30,42,52,.82), rgba(18,26,33,.74));
    --verre-brd: rgba(255, 255, 255, 0.14);

    --dalle-a: linear-gradient(150deg, #151B21 0%, #12181D 48%, #1A1F22 100%);
    --dalle-b: linear-gradient(160deg, #1C1A18 0%, #171A1D 60%, #1E1A16 100%);
    --dalle-c: linear-gradient(190deg, #1A1B18 0%, #14181C 58%, #12181A 100%);

    --dalle-a-plat: #12181D;
    --dalle-b-plat: #171A1D;
    --dalle-c-plat: #14181C;

    --puck: #EAF3F6;
    --chip: #EAF3F6;
    --chip-encre: #0E1519;

    --survol: color-mix(in oklab, var(--azur-clair) 9%, transparent);

    --em-l: .775;
    --em-c: .145;

    --voile: rgb(0 0 0 / 0.62);
}
```

`--sur-azur`, `--sur-azur-2`, les cinq rayons et `--ease` **ne sont pas
redéclarés** : la nappe reste de l'eau en nuit, le texte qui la surmonte reste
blanc, et un rayon n'a pas de thème.

## 4. Couche 2 — les alias hérités

**C'est le cœur du lot.** Ces trente et un noms sont ceux que l'app consomme
déjà, dans `styles.css`, `institutional-theme.css`, `views.css`, `dashboard.css`,
`relief.css`, `passe7.css` et les modules JS. Ils ne changent pas de nom. Ils
changent de cible.

Ce bloc se place **après** le § 2, dans le même `:root`, et son pendant nuit après
le § 3.

```css
/* ── Couche 2 : vocabulaire de consommation hérité ──
   Ne contient que des var() vers la couche 1. Zéro littéral. */
:root {
    /* Fonds */
    --color-bg:               var(--desk);
    --color-surface-1:        var(--dalle-a-plat);
    --color-surface-2:        var(--dalle-b-plat);
    --color-surface-3:        var(--dalle-c-plat);
    --color-surface-1-hover:  color-mix(in oklab, var(--dalle-a-plat), var(--azur) 7%);
    --color-surface-2-hover:  color-mix(in oklab, var(--dalle-b-plat), var(--azur) 7%);
    --color-surface-3-hover:  color-mix(in oklab, var(--dalle-c-plat), var(--azur) 7%);
    --color-wash:             var(--desk);
    --color-surface-sunk:     var(--desk);
    --color-surface-raised:   var(--puck);

    /* Traits */
    --color-border:           var(--trait);
    --color-border-strong:    var(--encre-faible);
    --color-divider:          var(--rail);

    /* Voile */
    --color-scrim:            var(--voile);

    /* Encre */
    --color-ink:              var(--encre);
    --color-text-primary:     var(--encre);
    --color-text-secondary:   var(--encre-2);
    --color-text-tertiary:    var(--encre-3);
    --color-text-on-dark:     var(--sur-azur);

    /* Interaction — azur-profond porte le texte et les liens (contraste),
       azur porte les aplats. C'est ce que fait la maquette : a{--azur-profond},
       a:hover{--azur}. */
    --color-accent:           var(--azur-profond);
    --color-accent-hover:     var(--azur);
    --color-accent-tint:      var(--survol);
    --color-accent-ink:       var(--sur-azur);

    /* Risque */
    --color-safe:             var(--vert);
    --color-safe-2:           color-mix(in oklab, var(--vert), var(--encre) 20%);
    --color-watch:            var(--ambre);
    --color-watch-2:          color-mix(in oklab, var(--ambre), var(--encre) 20%);
    --color-breach:           var(--rouge);
    --color-breach-2:         color-mix(in oklab, var(--rouge), var(--encre) 20%);

    /* Bandeau — devient la marine du rail, plus l'encre de la passe 8 */
    --color-band:             var(--marine);
    --color-on-band:          var(--sur-azur);

    /* Rayons — l'échelle Liquide, sous les anciens noms */
    --radius-xs:              0px;
    --radius-sm:              var(--r-min);
    --radius-md:              var(--r-nav);
    --radius-lg:              var(--r-dalle);
    --radius-xl:              var(--r-verre);
    --radius-full:            var(--r-plein);

    /* Ombres — aucune, sauf la surface réellement flottante */
    --shadow-card:            none;
    --shadow-card-hover:      none;
    --shadow-sm:              none;
    --shadow-md:              none;
    --shadow-lg:              none;
    --shadow-float:           0 32px 64px -28px rgb(7 61 93 / 0.42);

    /* Typographie — deux familles. --font-mono-data devient Jost : les chiffres
       sont tabulaires par font-variant-numeric, pas par une famille mono.
       Garder l'alias évite d'éditer les fichiers qui le consomment. */
    --font-heading:           'Jost', system-ui, sans-serif;
    --font-body:              'Instrument Sans', system-ui, sans-serif;
    --font-mono-data:         'Jost', system-ui, sans-serif;

    /* Échelle de type — relevée à la maquette, sous les anciens noms */
    --text-xs:                11.5px;
    --text-sm:                13px;
    --text-base:              14px;
    --text-lg:                16.5px;
    --text-xl:                44px;
    --text-2xl:               54px;
    /* Septième cran, ajout assumé : le grand chiffre d'une carte de verre,
       plus petit que celui d'une dalle (40 vs 44). Relevé l. 167. */
    --text-verre:             40px;

    /* Mouvement — les anciens noms pointent tous sur la courbe Liquide */
    --ease-standard:          var(--ease);
    --ease-out:               var(--ease);
    --ease-spring:            var(--ease);
    --duration-fast:          120ms;
    --duration-base:          220ms;
    --duration-slow:          280ms;
    --duration-enter:         700ms;
    --stagger:                80ms;
}
```

Pendant nuit — **trois lignes seulement**, tout le reste hérite :

```css
:root[data-theme="dark"] {
    --shadow-float:           0 36px 70px -26px rgb(0 0 0 / 0.85);
    --color-safe-2:           color-mix(in oklab, var(--vert), #fff 15%);
    --color-watch-2:          color-mix(in oklab, var(--ambre), #fff 15%);
    --color-breach-2:         color-mix(in oklab, var(--rouge), #fff 15%);
}
```

## 5. Ce qui disparaît du fichier

| Sorti | Pourquoi |
|---|---|
| `--chaux`, `--chaux-2`, `--rule` | remplacés par `--desk`, les dalles, `--trait` |
| `--mer`, `--mer-profonde`, `--lagune` | remplacés par la famille azur |
| `--olive`, `--ocre`, `--terracotta` | remplacés par `--vert`, `--ambre`, `--rouge` |
| `--lumiere` | le relief vient du `translateY(-3px)`, plus d'arête |
| `--grain`, `--grain-opacity`, `--grain-blend` | la nappe remplace le papier |
| `--blur-enter` | l'entrée se fait en translation, pas en flou |
| `--space-*` | **conservés tels quels**, grille 4 px inchangée |
| `--issuer-*` (17) | **conservés tels quels** |

Les deux dernières lignes sont là exprès : ce sont les deux familles qu'on pourrait
croire concernées et qui ne le sont pas.

## 6. Les polices

Ajouter au `<head>` d'`index.html`, avant toute feuille :

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&family=Instrument+Sans:wght@400;500;600&display=swap">
```

Retirer les `<link>` de Newsreader et d'IBM Plex Mono. Ajouter sur `body` :

```css
font-feature-settings: 'ss01';
-webkit-font-smoothing: antialiased;
```

**Aucun autre changement dans `index.html`.**

## 7. Ce que ce lot interdit

- Éditer un fichier d'écran. Un seul fichier change : `src/design-tokens.css`
  (plus les trois lignes de police du § 6 dans `index.html`).
- Écrire un littéral de couleur dans la couche 2.
- Inventer un token. S'il en manque un, le dire et s'arrêter.
- Renommer `data-theme="dark"`.

## 8. Preuve de fin

| # | Sonde | Attendu |
|---|---|---|
| 1 | `check-tokens.mjs` | vert, après ajout des noms du § 2 à la whitelist |
| 2 | `check-sources.mjs` | vert |
| 3 | `git diff --stat` | exactement 2 fichiers : `design-tokens.css`, `index.html` |
| 4 | occurrences de `--chaux`, `--mer`, `--olive`, `--ocre`, `--terracotta`, `--lumiere`, `--grain` dans `src/` | 0 |
| 5 | littéraux de couleur dans le bloc « couche 2 » | 0 |
| 6 | occurrences de `Newsreader` ou `IBM Plex` dans le dépôt | 0 |
| 7 | captures **1600 px, jour et nuit**, du Dashboard **et** de trois autres onglets | fournies |

La sonde 7 est celle qui compte : elle prouve que le remappage a repeint des écrans
que personne n'a touchés. Si un onglet ressort illisible, c'est un alias mal ciblé
au § 4, pas un défaut d'écran — et ça se corrige dans le même fichier.
