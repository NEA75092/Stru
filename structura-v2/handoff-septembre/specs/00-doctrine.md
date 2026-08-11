# spec — Doctrine visuelle commune

Version 1 · 09/08/2026 · s'applique à **tous** les écrans.
Les specs d'écran ne répètent pas ce fichier : elles le citent (« D1 », « D4 »…).
Ce fichier **écrase** tout document « PASSE-7 » ou « passe 8 » antérieur. R3 : plus de passe N.

Tokens de référence : `src/design-tokens.css` au dépôt, valeurs remontées par
`specs/design-tokens-v2.md`. Rendu cible : `Dashboard.dc.html` (jour + nuit, 1440 px).

---

## D1. Le motif signature : jauge + repère de seuil

Une seule figure porte **toute** la lecture du risque dans l'application : une gorge
horizontale, un remplissage, un repère vertical de seuil. Distance à la barrière,
Top/Flop, décrément, calendrier : même objet, mêmes règles. Un CGP apprend à lire un
graphique, pas huit.

| Invariant | Valeur |
|---|---|
| Gorge | hauteur `11px`, fond `--color-surface-sunk`, double inset, `border-radius: 1px` |
| Repère de seuil | filet `1px` vertical, encre, opacité `0.72`, dépassant la gorge de 4 px |
| Curseur (valeur réelle) | `3px`, `--color-safe` / `--color-watch` / `--color-breach` selon la strate |
| Ordre de peinture | gorge → trace de fond → zone franchie → repère de seuil → curseur |
| Débordement | `overflow: hidden` sur la cellule, valeurs `clamp`ées |

Aucun écran n'invente une seconde figure de risque. Un camembert, une note sur 100, un
badge coloré ne remplacent jamais cette jauge.

## D2. L'axe du risque, une définition unique

**−60 % à +20 %**, niveau initial (0 %) en repère intérieur à **75 % de l'axe**.
Tranché le 05/08 pour toute l'application (spec Dashboard § 2.1) : un produit qui a
gagné a droit à une place sur la règle. Les graduations d'en-tête sont positionnées
sur la même valeur d'axe que leur marque (`left: at(v)`, `translateX(-50%)`), jamais
par `space-between`. Les deux bornes s'alignent par le bord.

Plancher de la zone franchie : **≥ 9 px, obtenus vers la gauche** —
`left = min(at(spot), at(barrière) − 9px)`, `right = at(barrière)`.

## D3. La trame, seule façon de dire « perdu »

Aplat de la teinte à **20 %** + hachures **`115deg, teinte 0 2px, transparent 2px 5px`**.
Réglage unique : écarts de VL, zones de risque, barres du Decrement Score, puce
d'alerte de Clients. Le 1 px / 3 px a été testé le 05/08 et rejeté (invisible à zoom 1).

## D4. Les écarts de performance sont en encre

La mer signale l'interaction, la terre une barrière. Un écart de VL n'est ni l'un ni
l'autre : il reste **monochrome encre**, dans les deux sens. Arbitrage du 05/08,
perdant nommé : la maquette passe 7 en bleu/rouge. `.up, .dn { color: var(--color-ink) }`
est correct et ne se touche pas.

Valeurs en **points d'écart à 100** (`+27,4`), jamais en `%`, jamais deux décimales.

## D5. Une alerte n'a pas besoin d'un montant

Sous la barrière, le CGP a besoin d'un **écart** et d'une **date**. Pas de nominal, pas
de pastille de statut, pas de sparkline. Le nominal vit dans la fiche produit.

## D6. Relief sans ombre portée

`box-shadow` portée sur une carte : **aucune**. Le relief vient du creux
(`--color-surface-sunk`), de l'arête (`--lumiere`, toujours sur un bord **supérieur**),
de la cannelure et du reflet spéculaire. `border-radius` maximum **2 px**. Deux niches nommées, et deux seulement : les **pastilles d'état** (avis, alerte, compteur) et les **avatars**, qui gardent un rayon plein. Une pastille n'est pas un bouton de contrôle.
Chiffres > 24 px : `text-shadow: 0 1px 0 var(--lumiere)`, jamais de glow.

## D7. Contraste, formulé par rôle

`--color-text-tertiary` (2,83:1) est **interdit sur tout libellé**, quelle que soit la
taille — capitales, mono, en-tête de colonne, bouton : `--encre-2`.
Remplissage et texte ne prennent pas le même token : dès qu'un rôle
(`--color-safe/watch/breach`) porte du texte, il prend sa variante `-2`.
L'ocre ne porte pas de texte sous 24 px : en dessous, `--encre`.

## D8. Le gabarit de contrôles, avant tout le reste

Deux barres (période 62 px, recherche 54 px), rayon 0, séparateurs 1 px. C'est un
**composant unique**, sorti une fois et importé partout — voir `specs/controles.md`.
Les décalages de boutons constatés sur six écrans viennent de son absence, pas
d'oublis ponctuels.

## D9. Motion

Entrée : `dcRise` 620 ms `cubic-bezier(0.16,1,0.3,1)`, échelonnée par bloc (80 ms).
Barres : `dcGrow` `transform-origin` du côté de leur ancrage. Reflet spéculaire une
fois à l'ouverture, rejouable au survol. `prefers-reduced-motion` coupe tout.

## D10. Ce qui ne se touche jamais

`.pitch-preview-pane`, `.pitch-header-sticky`, `#autopitch-grid`,
`html:has(#view-autopitch.active)`, les icônes de nav du dépôt (verbatim), le lockup,
les six modes du calendrier (day/week/month/year/range/rolling — vérifiés dans
`app-calendar.js`, aucun doublon).
