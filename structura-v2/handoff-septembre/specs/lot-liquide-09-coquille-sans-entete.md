# lot-liquide-09-coquille-sans-entete — la barre d'en-tête sort, les outils entrent au rail

Version 1 · 02/09/2026 · dépend de `specs/00-doctrine-liquide.md` et de
`audit-maquette-02-09.md` § 1, qui est l'inventaire exhaustif dont ce lot est la
deuxième tranche. **Complète le LOT 2** (`lot-liquide-02-coquille.md`), qui avait laissé
`.header` hors périmètre — c'est cet oubli que ce lot ferme.

Source unique : `handoff-septembre/maquette/Dashboard - Liquide.dc.html`, l. 65-152
(le rail) et l. 153 (ce qui suit immédiatement le rail : **l'eau, rien d'autre**).

## 0. Arrête-toi si — la liste complète, en tête

| # | Cas | Ce que tu fais |
|---|---|---|
| 1 | un module autre que `app-dashboard.js` lit `#clk`, `#dt-str` ou `#ticker` | tu le nommes avant de supprimer |
| 2 | un écran autre que le Dashboard dépend d'un élément de `.header` pour fonctionner (pas seulement pour l'afficher) | tu t'arrêtes et tu le nommes |
| 3 | la bascule de thème perd sa persistance en changeant d'hôte | tu t'arrêtes : la logique et la clé ne changent pas |
| 4 | `sessionInitials` n'est pas accessible depuis le rail | tu le nommes |
| 5 | un tracé d'icône manque au dépôt (recherche, notifications) | tu le reprends **verbatim à la maquette** l. 144-150. Tu ne t'arrêtes pas, et tu n'en dessines aucun |
| 6 | la lune | tu la reprends **au dépôt** (`.theme-toggle` actuel), pas à la maquette. Règle 7 : on ne redessine pas ce qui existe |

Il n'y a pas d'autre ambiguïté dans ce document.

## 1. Le défaut

Le code porte une barre d'en-tête pleine largeur : ticker d'indices défilant, bascule
jour/nuit, pastille utilisateur, badge LIVE, horloge et date. **La maquette n'a aucun
de ces éléments.** Sous le bord du cadre, l'eau commence directement.

Les fonctions que ce bandeau portait vraiment — chercher, être notifié, basculer le
thème, ouvrir son profil — vivent dans la maquette **en pied de rail**, en quatre cibles
rondes de 44px. Elles ne disparaissent pas : elles déménagent.

Ce bandeau est resté « hors périmètre, inchangé » dans `shell.css` depuis le 25/08. Il
porte donc encore la peinture d'avant Liquide (filets clairs, `--radius-lg`, mono
majuscule, pastille pêche) au-dessus d'un écran entièrement repeint.

## 2. Ce qui sort

Dans `index.html` : le bloc `.header` **en entier**, et avec lui `.header-divider`,
`.header-ticker`, `#ticker`, `.header-right`, `.theme-toggle`, `.user-pill`,
`.user-avatar`, `.user-meta`, `.live-badge`, `.live-dot`, `.clock`, `#clk`,
`.date-str`, `#dt-str`.

Dans `app-dashboard.js` : `INDICES` (les onze valeurs en dur), `initTicker()`, `tick()`
et son `setInterval`, et leurs entrées dans l'objet retourné. Pas de code mort.

Dans `shell.css` : toutes les règles de `.header` à `.date-str`, plus
`.ticker-track/-item/-label/-val/-chg` et `@keyframes ticker-scroll` dans
`dashboard.css`. `.app-shell` perd son `gap` : il n'a plus qu'un enfant.

**Ce qui est perdu, et je le nomme :** le ticker d'indices, l'horloge, la date et le
badge LIVE n'ont pas d'équivalent dans la maquette et ne réapparaissent nulle part.
Les indices étaient onze valeurs écrites en dur, sans source de marché — ce lot supprime
donc aussi la seule donnée non sourcée de l'écran. L'horloge et la date restent
disponibles dans le système d'exploitation du conseiller.

**Portée : les neuf écrans.** `.header` est partagé. Après ce lot, aucun écran n'a de
barre haute, et les quatre outils du rail servent les neuf. C'est cohérent avec la
coquille de la maquette, qui est elle-même partagée — mais c'est un changement visible
sur Clients, Portefeuille, Barrières, Calendrier, Pilotage, Pitch Engine, Decrement
Score et Doc Reader, pas seulement sur le Dashboard. Attendu, pas un effet de bord.

## 3. Ce qui entre — la rangée d'outils, en pied de rail

Quatrième et dernier bloc du rail, après la nav et le pied d'actions :

```
margin-top: auto · padding-top: 22px
display: flex · align-items: center · gap: 6px
```

Quatre `button`, dans cet ordre : **recherche · notifications · jour/nuit · profil**.
Les trois premiers :

```
width: 44px · height: 44px · border-radius: var(--r-plein)
background: transparent · border: 1px solid transparent
transition: background 260ms var(--ease), border-color 260ms var(--ease)
hover → background: var(--flottant) ; border-color: var(--flottant-brd)
```

Icône 16px, tracé 1.5px, `rgba(255,255,255,0.92)`, bouts et jointures arrondis. **Reprends
les tracés de la maquette verbatim** (l. 144-150) : cercle + queue pour la recherche,
rectangle `rx 3.4` pour les notifications. Pour la lune, **reprends celui déjà au dépôt**
(le `.theme-toggle` actuel, règle 7 du CLAUDE.md : je ne redessine pas ce qui existe).

Le quatrième, le profil : `margin-left: auto`, 44px de cible, `padding: 0`, et dedans un
disque de 34px — `background: var(--flottant)`, `border: 1px solid var(--flottant-brd)`,
initiales en Jost 12.5px, letter-spacing .04em, `--sur-azur`. Les initiales viennent de
`sessionInitials(session.advisorName)`, déjà écrit ; le `title` porte le nom complet.

La bascule jour/nuit **garde exactement sa logique actuelle** — même gestionnaire, même
clé de persistance, `aria-pressed` sur l'état nuit. Seul son hôte change.

Conséquence sur le rail : `.sidebar-nav` perd son `flex: 1` (c'est la rangée d'outils qui
pousse désormais, par `margin-top: auto`), et `.sidebar-nav` garde son `overflow-y: auto`.

## 4. Tokens

`--flottant`, `--flottant-brd`, `--sur-azur`, `--r-plein`, `--ease` : tous déjà au dépôt,
tous déjà consommés par le rail. **Zéro token nouveau, zéro couleur nouvelle.** Le
`rgba(255,255,255,0.92)` des tracés est celui que `.nav-tab` emploie déjà.

## 5. Périmètre

`index.html`, `src/shell.css`, `src/dashboard.css` (les règles de ticker),
`src/modules/app-dashboard.js`, bump `?v=`. Si un autre module lit `#clk`, `#dt-str` ou
`#ticker`, **arrête-toi et nomme-le** au lieu de le laisser échouer en silence.

## 6. Preuves

`preuve-liquide --lot 9`, statiques :

1. zéro occurrence de `header-ticker`, `live-badge`, `#clk`, `#dt-str`, `#ticker`,
   `initTicker`, `INDICES`, `ticker-scroll` dans tout le dépôt ;
2. zéro règle `.header` restante dans `shell.css` ;
3. les quatre outils sont des `button` (zéro `div` cliquable dans le rail) ;
4. `.sidebar-nav` n'a plus `flex: 1`.

Mesurées en DOM, jour et nuit :

5. haut de l'eau = haut de la zone de vue, à 0 px près — plus rien au-dessus ;
6. les quatre cibles du rail mesurent ≥ 44 × 44.

À rapporter, 1600 px, jour et nuit : captures du haut d'écran (0–200) et du pied de rail,
plus une capture de **Clients** — c'est l'écran où la disparition de la barre se voit le
plus, et je veux la voir avant de te dire que c'est bon.
