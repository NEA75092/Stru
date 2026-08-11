# spec — design-tokens v2 (« Méditerranée v2 »)

07/08/2026 · `src/design-tokens.css` lu au dépôt (`NEA75092/Stru@master`) avant écriture
Maquette de référence : `Dashboard.dc.html` (jour + nuit, 1440 px)

## Ce que cette spec dit, en une phrase

**Aucun nom de token ne change.** Le vocabulaire `--color-*` / `--font-*` reste exactement
celui du dépôt. Seules les **valeurs** des onze tokens de rôle sont remontées en chroma :
la passe 8 était juste dans sa structure et trop pâle à l'écran.

---

## 1. Les onze tokens de rôle — valeurs à remplacer

`:root`, `src/design-tokens.css`. Rien d'autre ne bouge dans le bloc.

| Token | Passe 8 (actuel) | v2 (à poser) | Pourquoi |
|---|---|---|---|
| `--chaux` | `oklch(0.98 0.008 85)` | `oklch(0.976 0.011 85)` | un cheveu plus de terre dans le plâtre |
| `--chaux-2` | `oklch(0.955 0.012 80)` | `oklch(0.955 0.016 80)` | la marche se voyait à peine |
| `--rule` | `oklch(0.88 0.012 80)` | `oklch(0.882 0.016 80)` | filet trop gris, pas assez chaux |
| `--encre` | `oklch(0.26 0.045 235)` | `oklch(0.245 0.055 240)` | encre plus profonde, plus bleue — porte le bandeau |
| `--encre-2` | `oklch(0.50 0.030 235)` | `oklch(0.485 0.038 238)` | secondaire lavé |
| `--mer` | `oklch(0.62 0.13 205)` | `oklch(0.600 0.155 212)` | **le sujet du système** — il manquait de mer |
| `--mer-profonde` | `oklch(0.42 0.11 225)` | `oklch(0.400 0.135 232)` | survol trop proche de l'accent |
| `--lagune` | `oklch(0.93 0.035 200)` | `oklch(0.915 0.055 202)` | teinte de sélection invisible |
| `--olive` | `oklch(0.55 0.09 130)` | `oklch(0.550 0.115 132)` | olivier, pas kaki |
| `--ocre` | `oklch(0.68 0.13 75)` | `oklch(0.720 0.155 73)` | safran — c'est lui qui apporte le punch |
| `--terracotta` | `oklch(0.52 0.15 32)` | `oklch(0.545 0.175 32)` | tuile, pas brique sale |

`--lumiere` est inchangé (`oklch(0.995 0.004 85)`).

## 2. Nuit — `:root[data-theme="dark"]`

| Token | Actuel | v2 |
|---|---|---|
| `--chaux` | `oklch(0.14 0.035 235)` | `oklch(0.145 0.042 240)` |
| `--chaux-2` | `oklch(0.19 0.04 235)` | `oklch(0.195 0.046 240)` |
| `--mer` | `oklch(0.7 0.11 200)` | `oklch(0.735 0.135 198)` |
| `--mer-profonde` | `oklch(0.78 0.1 195)` | `oklch(0.815 0.125 195)` |
| `--olive` | `oklch(0.68 0.1 130)` | `oklch(0.690 0.125 132)` |
| `--ocre` | `oklch(0.75 0.13 75)` | `oklch(0.780 0.150 73)` |
| `--terracotta` | `oklch(0.64 0.15 32)` | `oklch(0.665 0.170 32)` |

`--encre` / `--encre-2` / `--rule` / `--lagune` / `--lumiere` en nuit : **inchangés**.
Les trois marches `--color-surface-*` de la nuit sont inchangées elles aussi.

## 3. Deux tokens à AJOUTER

Même statut que `--lumiere` ajouté le 05/08 : un rôle réel, pas une commodité.

```css
/* :root */
--color-band:    var(--encre);
--color-on-band: oklch(0.965 0.012 85);

/* :root[data-theme="dark"] */
--color-band:    oklch(0.115 0.038 240);
--color-on-band: #f3efe2;
```

**Rôle** : le bandeau d'encre pleine largeur qui porte les trois chiffres de tête d'un écran.
Une seule bande par vue. Ce n'est ni une carte ni une surface — c'est un aplat d'encre.
Interdits dessus : token de risque en fond, dégradé de teinte, ombre.

`structura-v2/handoff-septembre/tools/check-tokens.mjs` refusera ces deux noms tant qu'ils ne sont pas
déclarés : **les poser dans `design-tokens.css` est la première étape**, avant tout écran.

## 4. Invariants du bandeau (mesurables)

| # | Invariant | Valeur attendue |
|---|---|---|
| T1 | Arête haute du bandeau | `inset 0 1px 0 color-mix(in oklch, var(--color-on-band), transparent 80%)` — jamais une ombre |
| T2 | Séparateurs entre les trois chiffres | `inset 1px 0 0 color-mix(in oklch, var(--color-on-band), transparent 84%)` |
| T3 | Filet de pied | 4 px pleine largeur en `var(--color-watch)`, croissance `scaleX` 900 ms `--ease-spring` |
| T4 | Chiffre de tête | `--font-heading`, **200**, 54 px, `letter-spacing: -0.04em` |
| T5 | Sur-titre de colonne | `--font-mono-data`, 10 px, `0.16em`, capitales, `color-mix(… transparent 42%)` |
| T6 | Reflet spéculaire | balayage unique à l'entrée (2200 ms, retardé 460 ms), jamais en boucle |

## 5. Ce qui ne change pas

- Les rayons restent à **2 px** (`--radius-*`). Le nom `--radius-md` trompe, la valeur est bonne.
- **Aucune ombre portée** hors surfaces réellement flottantes (tiroir, modale, menu).
- Les couleurs de marque émetteur (`--issuer-*`) sont inchangées et restent la seule exception
  à « zéro couleur littérale ».
- Les écarts de VL restent en **encre monochrome**.
- Le grain reste posé une seule fois sur la vue (`--grain`, `--grain-opacity`, `--grain-blend`).

## 6. Ordre d'application

1. Poser les valeurs du § 1 et du § 2, ajouter les deux tokens du § 3.
2. Lancer `node handoff-septembre/tools/check-tokens.mjs` — doit passer sans ajout d'exception.
3. Rien d'autre. **Aucun écran n'est retouché dans ce commit** : on veut voir le delta de
   couleur seul, sans mélange avec un changement de mise en page.
