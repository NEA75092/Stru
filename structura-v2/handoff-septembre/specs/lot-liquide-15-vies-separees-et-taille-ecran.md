# LOT 15 — Liquide · deux vies séparées, l'app à la taille de l'écran, le lockup

Rendu cible et seule source de mesure : `Dashboard - Liquide.dc.html` (jour + nuit).
Doctrine : `handoff-septembre/specs/00-doctrine-liquide.md`.
Sources lues au dépôt à `master` avant d'écrire : `structura-v2/index.html`,
`src/shell.css`, `src/dashboard.css`, `src/modules/app-dashboard.js`.

---

## § 0 — Arrête-toi si

**0.1 — bloquant, à trancher avant toute ligne de code.** Le § 1 demande une liste
d'événements **hors produit** (rendez-vous, dossiers, obligations du cabinet). Cette
donnée n'existe pas au dépôt : `CLIENTS` (`app-state.js`) ne porte ni date, ni tâche,
ni rendez-vous, et `buildProductCalendarEvents()` ne produit que de la vie de produit.
Deux voies, aucune n'est à choisir par l'implémenteur :

- **(a) dériver de ce qui existe** — dossiers clients incomplets, souscriptions en
  attente — sans jamais inventer de date. Le calendrier n'a alors de pastille que si
  une date réelle existe, et il est souvent vide.
- **(b) un modèle `cabinetEvents`** (id, date ISO, titre, détail, montant en jeu,
  action) alimenté en mode démo, **vide en production** avec un état vide écrit.

Recommandation design : **(b)**. Arrête-toi et demande si le choix n'est pas écrit
dans le message de lot.

**0.2** — Ne remplace aucune valeur du § 2 / § 3 par une « équivalente » : les
tokens nommés ici sont ceux de la maquette, relevés ligne à ligne.

**0.3** — Ne t'arrête pas pour : le repli à deux colonnes du plâtre (§ 4.3 annule
explicitement le LOT 11 § 2.1), le lockup centré (§ 5 annule le LOT 11 § 4).

---

## § 1 — Les deux vies ne se mélangent pas

Le premier plan est la vie du **cabinet**. Le plâtre est la vie des **produits**.
Un événement ne peut pas figurer dans les deux.

| # | Élément | Aujourd'hui | Doit devenir |
|---|---|---|---|
| 1.1 | `#dash-agenda-week` (`renderAgendaWeek`) | pastilles issues de `buildProductCalendarEvents()` | pastilles issues de la **seule** source de vie de cabinet (§ 0.1). Un jour sans événement de cabinet n'a pas de pastille, même s'il porte trois coupons. |
| 1.2 | `#dash-today-list` (`renderTodayList` / `buildPortfolioAlerts`) | 3 produits `breach`/`crit`/`warn`, chip = `statusLabel`, glyphe `!`/`•` | les dossiers **à traiter** : chip = verbe d'action (`Relancer`, `Compléter`, `Préparer`), glyphe `✓` / `⚑` / `→`, détail = `montant en jeu · antériorité`. Sélection : les entrées de cabinet qui portent une action et dont la date est échue ou du jour. |
| 1.3 | sous-ligne de `.dash-today` | absente | `« {somme en jeu} en jeu sur {N} dossier(s) »` — 13px, `rgba(255,255,255,.76)`, `margin: -6px 0 12px`. **`N` et la somme sont dérivés de la liste**, jamais écrits. |
| 1.4 | dalle C (`renderWeekEvents`) | `buildProductCalendarEvents()` | inchangé — elle est désormais la **seule** consommatrice de cette source. |
| 1.5 | titre de la dalle C | « Événements de la semaine » | **« Événements produits »** (le « cette semaine » reste dans `#dalle-c-num-ctx`). |

`buildPortfolioAlerts()` n'est plus appelée par le Dashboard. Elle n'est pas
supprimée sans vérification : si aucun autre écran ne la lit, elle sort (pas de code
mort) ; sinon elle reste où elle est consommée.

---

## § 2 — Le cadre d'encours : les écarts restants, un par un

| # | Maquette | Code aujourd'hui | Correction |
|---|---|---|---|
| 2.1 | trame (4 lignes) et ligne verticale du curseur en `--encre-faible` | `stroke="var(--color-border-strong)"` | les deux traits passent en `--encre-faible` |
| 2.2 | période inactive en `--encre-2` | `.dash-encours-range { color: var(--color-text-tertiary) }` | `var(--color-text-secondary)` ; l'active reste `--color-ink` |
| 2.3 | perf de période : `+ 4,82 %` — **2 décimales, espace après le signe** | `pctFr(periodPct, 1)` sans espace → `+4,8 %` | 2 décimales et espace après le signe |
| 2.4 | delta : `soit + 610 k€ sur la période` — **k€, arrondi au millier** | `moneyShort(periodAbs)` → `+0,6 M€` | k€ arrondi au millier, espace après le signe |
| 2.5 | teinte de la perf par token | `perfMoisEl.style.color = …` en JS | une classe (`.is-up` / `.is-dn` posée par `classList.toggle`), zéro couleur en `style=""` |
| 2.6 | curseur : `fill --vert`, `stroke --puck` | `stroke="var(--color-surface-raised)"` | vérifier que l'alias résout `--puck` ; s'il diverge, aligner sur `--puck` |

---

## § 3 — Le calendrier de la semaine : les écarts restants

| # | Maquette | Code aujourd'hui | Correction |
|---|---|---|---|
| 3.1 | en-tête = `20 août` (jour + mois) · plage `17 – 23 août` à droite · croix | `#dash-agenda-day` = `jeudi 20 août`, **aucune plage** | retirer `weekday: "long"` ; ajouter la plage — `<span class="dash-agenda-range">`, 13px, `--sur-azur-2`, `margin-left: 10px; flex: 1`, `white-space: nowrap`. Plage **calculée** depuis le lundi affiché, jamais écrite. |
| 3.2 | numéro de jour ordinaire en `--sur-azur` (blanc plein) | `.dash-agenda-num { color: var(--sur-azur-2) }` | `--sur-azur` ; le disque rouge d'aujourd'hui ne change pas |
| 3.3 | pastille de jour chargé `rgba(255,255,255,.7)` | `.dash-agenda-dot { background: var(--color-text-tertiary) }` — encre sombre posée sur l'eau | `rgba(255,255,255,.7)` — **défaut de lisibilité réel, pas un écart de goût** |
| 3.4 | semaine ISO, lundi → dimanche | conforme | ne pas toucher |

---

## § 4 — L'app à la taille de l'écran (plus de plancher, plus de défilement)

Le repli se fait **tout seul**, par la loi de la boîte, sans une seule `@media` :
c'est la « détection automatique » demandée. Aucun point de rupture nommé.

| # | Règle | Valeur |
|---|---|---|
| 4.1 | `.app` | `min-width: 1280px` **tombe** ; `min-height: 100dvh`. `container-type: inline-size` et le `padding: clamp(18px,1.6vw,30px)` restent. |
| 4.2 | `.dash-avant` | `display: flex; flex-wrap: wrap` (plus de `grid-template-columns`). `.dash-avant-main { flex: 1 1 420px; min-width: 0 }` · `.dash-avant-side { flex: 1 1 320px; max-width: 440px; min-width: 0 }`. `gap`, `padding` haut/latéral inchangés ; **`padding-bottom: clamp(28px, 2.4cqw, 38px)`** ajouté. |
| 4.3 | `.dash-platre` | `grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr))` — 3 → 2 → 1 colonne selon la place. **Annule le LOT 11 § 2.1** (« jamais de repli à deux »), qui supposait le plancher de 1280. |
| 4.4 | la nappe suit le premier plan | nouvelle boîte `position: relative` enveloppant `.nappe` + `.dash-avant` (seule addition de DOM du lot) ; `.nappe { inset: 0 }` remplace `height: var(--nappe-h)`. `.dash-avant` garde `min-height: var(--nappe-h)` et son `box-sizing: border-box` : **à 1600 la hauteur d'eau ne bouge pas d'un pixel.** Sans cette boîte, dès que la colonne de droite se replie, les cartes de verre sortent de l'eau et se posent sur le desk — doctrine L1 cassée. Le `:has(~ #view-dashboard.active)` de `shell.css` doit continuer de porter : si l'enveloppe casse le sélecteur de fratrie, elle prend la place de `.nappe` dans la condition. |
| 4.5 | tableaux à onze colonnes | acquis LOT 11 : `min-width` conservé, défilement **dans** la dalle. Inchangé. |

**Preuves attendues (DOM, jour + nuit)** : débordement horizontal = 0 à 1600 / 1280 /
1100 / 900 ; à 1600, `.dash-avant-side` = 440 px, `.dash-platre` = 3 colonnes,
hauteur de la boîte d'eau = `--nappe-h` ; à 900, `.dash-avant` a deux rangées et la
boîte d'eau contient encore les trois cartes de verre (bas de `.dash-today` ≤ bas de
la nappe).

---

## § 5 — Le lockup

| # | Règle |
|---|---|
| 5.1 | `.sidebar-brand` : colonne centrée — `flex-direction: column; align-items: center; gap: 11px; padding: 10px 14px 22px; margin: 0 0 22px; border-bottom: 1px solid var(--flottant-brd)`. **Annule le LOT 11 § 4** (aligné à gauche sur l'inset de nav) — arbitrage client du 03/09. |
| 5.2 | `.sidebar-brand-img` : `56 × 30`, `object-fit: contain`. |
| 5.3 | `.sidebar-brand-word` : Jost 500, `17px`, `letter-spacing: .26em`, **`text-indent: .26em`** (sans lui l'interlettre du dernier caractère décentre le mot). |
| 5.4 | Aucun pixel du logo redessiné (R7) : seul le cadrage d'affichage change. |

---

## § 6 — Ce qui ne bouge pas

Les trois dalles et leur contenu (hors titre § 1.5), la courbe Catmull-Rom et sa
ligne de base 104, le repère de barrière par ligne, l'écart de VL monochrome à deux
états, l'odomètre, les six animations, `PERIODES` (une source pour la rangée),
le rail marine en jour comme en nuit.
