# spec — Dashboard

Version 2 · 05/08/2026 (soir) · tokens de référence : `src/design-tokens.css` (passe 8, 01/08)
La v1 nommait quatre tokens inexistants — voir § 0.
Ce fichier **écrase** toute spec Dashboard antérieure, y compris tout document « PASSE-7 ».

---

## 0. Tokens — mapping (correction du 05/08, soir)

La version 1 de cette spec nommait quatre tokens qui n'existent pas. Faute de rédaction,
signalée par l'implémenteur au titre de R6, et corrigée ici. Le mapping ci-dessous est
la seule interprétation valable :

| Nom fautif (v1) | À utiliser | Pourquoi |
|---|---|---|
| `--arete` (séparateur de ligne de tableau, axe de graphique) | `--color-divider` | `design-tokens.css` le déclare pour exactement cet usage : « grille de graphique, séparateurs de lignes de tableau, fond des barres de progression » |
| `--arete` (séparation structurelle entre cellules du gabarit de contrôles) | `--color-border` | Une arête de structure, pas un filet de tableau. Deux rôles distincts, deux tokens — c'est ce que le nom unique masquait |
| `--creux` | `--color-surface-sunk` | Déjà déclaré : « fond légèrement retiré, une marche sous `--color-surface-2` » |
| `--encre-douce` | `--color-text-tertiary` | Déjà déclaré |
| `--chaux-haut` | **`--lumiere`, à ajouter** | Voir § 0.1 |

### 0.1 Un seul token à ajouter : `--lumiere`

C'est le douzième token de rôle, et le seul que la couche relief exige. Rôle :
**l'arête de lumière**, quand la lumière tombe d'en haut — bord supérieur d'un panneau
creusé, incision d'un chiffre gravé. Aucun token existant ne le porte : `--chaux` est
un fond, pas une arête, et une arête de lumière doit être plus claire que le fond
qu'elle borde.

À ajouter dans `src/design-tokens.css`, dans le bloc des tokens de rôle, avec ce commentaire :

```css
/* Douzième token de rôle (05/08) — l'arête de lumière. La couche
   relief de la passe 8 n'emploie aucune ombre portée : le relief
   vient du creux, de l'arête et de la cannelure. Cette valeur est
   la seule lumière du système, toujours sur un bord SUPÉRIEUR ou
   en text-shadow d'incision, jamais en fond de surface. */
--lumiere: oklch(0.995 0.004 85);
```

Et sous `:root[data-theme="dark"]` — en nuit, la lumière ne peut pas être plus claire
que la chaux, elle devient un voile :

```css
--lumiere: rgb(214 226 242 / 0.10);
```

Les deux autres valeurs de la couche relief n'ont **pas** besoin de nouveau token :
l'ombre basse d'un panneau est `--rule`, le fond de creux profond est
`--color-border-strong`.

Aucune autre couleur n'est à ajouter. Si un invariant ci-dessous semble en demander une,
c'est une faute de spec : arrête-toi et remonte-la (R6). Tu as eu raison de le faire.

---

## 1. Rendu cible

`Direction Mediterranee v3.dc.html`, sections **A**, **B** et **C**.
Ouvre-la et travaille à côté. Elle est dessinée à 1560 px, l'app est à 1400 px minimum :
seules les colonnes en `minmax(0, 1fr)` absorbent la différence, toutes les autres
largeurs sont fixes et se transposent au pixel.

Aucune description en prose du rendu n'est fournie, volontairement. Ce qui n'est pas
dans les invariants ci-dessous se lit sur la maquette.

---

## 2. Invariants mesurables

Relevables au navigateur sur `origin/master` après push. Tolérance : **0 px**, sauf
mention. Le nom de classe est indicatif quand il n'existe pas encore — la valeur, non.

### 2.1 Carte « Sous la protection du capital » (section A)

| Invariant | Valeur attendue |
|---|---|
| `grid-template-columns` de la ligne | `minmax(0,1fr) 120px 300px 88px` |
| `gap` de la ligne | `28px` |
| `padding` vertical de ligne | `20px` haut et bas |
| Séparateur de ligne | `border-bottom: 1px` en `--color-divider` — **pas** en `--color-ink` |
| Axe de la règle | gauche = **−60 %**, droite = **+20 %**. Valeurs bornées par `clamp` |
| Repère de niveau initial | filet `1px` en `--color-border-strong` à **75 % de l'axe**, dans la gorge |
| Débordement | `overflow: hidden` sur la cellule de règle |
| Rainure de l'axe | hauteur `11px`, `border-radius: 1px`, fond `--color-surface-sunk`, double inset |
| Curseur (niveau réel) | largeur `3px`, remplissage `--color-safe` / `--color-watch` / `--color-breach` selon la strate, `border-radius: 1px` |
| Encoche PDI (seuil) | largeur `1px`, encre, opacité `0.72` |
| Graduations d'en-tête intérieures | positionnées sur la même valeur d'axe que leur marque — mid du libellé à **±2 px** du tick |
| Graduations d'en-tête des deux bornes | alignées par le **bord** (`left: 0` / `right: 0`), délibérément : les centrer déborderait de la cellule. L'invariant ±2 px ne les concerne pas |
| Zone franchie | aplat `--color-breach` 20 % **+** trame `115deg, --color-breach 0 2px, transparent 2px 5px`, cerné 1 px |
| Bord droit de la zone franchie | **ancré sur l'encoche de barrière**, sans exception |
| Largeur minimale de la zone franchie | **≥ 9 px**, obtenus en étendant vers la **gauche** — jamais vers la droite |
| Perf. vs initial | `--font-mono-data`, `25px`, `tabular-nums`, `--color-breach-2` (texte → variante `-2`) |
| Hauteur totale d'une ligne | `≈ 74px` (tolérance ±2) |
| Champs **absents** | nominal, pastille de statut, sparkline |

**Définition de l'axe — tranchée le 05/08, une fois pour toute l'application.**
L'axe va de **−60 % à +20 %**, et le niveau initial (0 %) est un **repère intérieur à
75 %**, pas le bord droit. La v2 de cette spec plaçait le bord droit à 0 % : sur
Portefeuille, deux produits au-dessus de leur niveau initial (+4,2 et +12,6) sortaient
alors physiquement de la piste, jusqu'à 66 px dans la colonne voisine, curseur invisible.
Ce n'était pas un réglage mais une définition fausse — un produit qui a gagné a droit à
une place sur la règle. Toute valeur hors bornes est **clampée**, et la cellule porte
`overflow: hidden` comme garde-fou.

**Le plancher s'étend vers la gauche.** Constaté le 05/08 sur « Autocall LVMH », produit
à 0,8 point sous sa barrière — précisément le cas pour lequel le plancher existe : la
largeur plancherée à 9 px partait du niveau réel et grandissait vers la droite, donc la
trame traversait l'encoche de 6 px et hachurait du territoire **au-dessus** de la
barrière. Une trame affirme « cette portion est perdue » ; elle affirmait une perte qui
n'existait pas, et l'encoche se retrouvait noyée dans la bande au lieu d'en marquer le
bord. Calcul obligatoire : `left = min(at(spot), at(barrière) − 9px)`, `right = at(barrière)`.

**Un en-tête de règle n'est pas une légende, c'est une graduation.** Les libellés sont
positionnés en absolu sur la même valeur d'axe que les marques de la gorge (`left: at(0)`
pour le zéro, `translateX(-50%)`), jamais par `space-between` ni par une marge devinée.
Constaté le 05/08 : un `margin-right: 20%` posé à la main plaçait « initial » à 120 px
alors que le repère était à 225 px — l'en-tête annonçait le zéro au-dessus de ce qui
valait −28 %, et toutes les distances de barrière se lisaient décalées. Une graduation
qui n'est pas dérivée de l'axe mentira de nouveau au premier changement d'axe.

**Ordre de peinture de la règle graduée — non négociable.**
`rainure → trace de coussin → zone franchie → encoche de barrière → curseur`.
Constaté le 05/08 sur Portefeuille : la trace peinte en dernier recouvrait l'encoche de
barrière sur toute ligne non franchie, c'est-à-dire qu'un aplat décoratif masquait le
repère le plus important de l'écran. La trace est un fond, elle se peint comme un fond.

**Trace de coussin** — dessinée **uniquement** sur les lignes non franchies : sous la
barrière il n'y a pas de coussin, donc rien à tracer. Du bord gauche au niveau réel,
`top: 11px; height: 9px` — elle **remplit** la gorge, elle ne la chevauche pas — et
`--encre` à **11 %** maximum. Au-delà, elle pèse plus lourd que la zone franchie en
terracotta, qui est la seule information que l'écran doit rendre évidente. Hiérarchie
imposée : zone franchie > encoche > trace.

Le plancher de 1,6 % n'est pas cosmétique : sous ce seuil la trame ne rend qu'une
seule hachure sur 300 px et la zone franchie devient invisible. Un produit à 0,8 point
sous sa barrière est exactement le cas où il faut la voir.

### 2.2 Carte « Écarts de VL » (section B)

| Invariant | Valeur attendue |
|---|---|
| `grid-template-columns` | `200px minmax(0,1fr) minmax(0,1fr) 64px` |
| `gap` | `16px` |
| Hauteur de ligne | `38px` — hauteur **fixe**, pas de padding vertical |
| Nom du produit | **une seule ligne**, `ellipsis`. Le sous-jacent n'est pas affiché |
| Hauteur de barre | `10px` (aujourd'hui `4px` : c'est le défaut principal) |
| Barre positive | `--color-ink` plein, opacité `0.62`, arête haute `--lumiere`, origine **gauche** |
| Barre négative | aplat `--color-ink` 20 % **+** trame `115deg, --color-ink 0 2px, transparent 2px 5px`, origine **droite** |
| Axe central | `inset -1px 0 0` sur la colonne « sous 100 », 1 px `--color-divider` |
| Valeur | points d'écart à 100, ex. `+27,4` — **pas** de `%`, **pas** de 2 décimales |
| Couleur de la valeur | encre, jamais terre ni mer, dans les deux sens |
| Légende | dans l'en-tête de carte (`sous 100` / `au-dessus`), **pas** de ligne interne |

**Règle de trame — non négociable.** Une trame ne se lit comme une quantité que si
elle a une masse : **aplat de la même teinte à 20 % d'opacité, plus des hachures de
2 px pour 5 px de pas, à 115°**. La valeur 1 px / 3 px a été testée le 05/08 et rejetée :
à zoom 1 les bandes disparaissent alors que les traits pleins de 1 px voisins rendent
parfaitement. Toute bande tramée de l'application suit ce réglage — écarts de VL,
zones de risque, barres du Decrement Score, puce d'alerte de la liste Clients.

**Le monochrome est correct et reste.** La mer signale l'interaction, la terre une
barrière ; un écart de VL n'est ni l'un ni l'autre. Toute maquette antérieure
demandant du bleu/rouge ici est périmée.

### 2.3 Carte « Distribution du risque » (section B, droite)

Cette carte **n'existe pas** sur `master`. Elle est à créer sur le Dashboard.
Ne pas réutiliser la version de `app-analytics.js` (Pilotage) : elle a une autre
définition de zones.

| Invariant | Valeur attendue |
|---|---|
| Barre empilée | hauteur `44px`, 3 segments, `inset -1px 0 0 --chaux` entre segments |
| Zone 1 « Sous la barrière » | aplat `--color-breach` 20 % + trame 2/5 px, arête haute 1 px |
| Zone 2 « À surveiller » | aplat `--color-watch` 20 % + trame 2/5 px, seuil : **< 10 % de la barrière** |
| Zone 3 « Zone de rendement » | aplat `--color-ink` 10 %, arête haute `--color-ink` 34 % |
| Ligne de légende | `grid: 14px minmax(0,1fr) 74px 62px`, `gap 16px`, `padding 14px 0` |
| Pourcentage | `19px`, `tabular-nums`, couleur = couleur de la zone |
| Comptage produits | `11.5px`, `--color-text-tertiary` |
| Somme des trois zones | **exactement 100 %** — sonde arithmétique, pas visuelle |

### 2.4 Gabarit de contrôles (section C) — **fait une fois, sert partout**

C'est celui qui règle tous les décalages de boutons de l'application. À sortir en
composant réutilisable avant les autres écrans.

| Invariant | Valeur attendue |
|---|---|
| Rang 1 (période) | hauteur `62px` |
| Rang 2 (recherche) | hauteur `54px` |
| Flèches ← → | `50px` de large, séparées par 1 px `--color-border` |
| Bloc mois | `min-width: 208px`, `padding: 0 22px` |
| Boutons de période | `padding: 0 20px`, séparés par 1 px `--color-border`, **aucun** `border-radius` |
| Période active | trait bas `2px` en `--color-accent`, jamais un fond plein |
| Périodes inactives | libellé `--encre-2` (§ 2.5), jamais `--color-text-tertiary` |
| `border-radius` sur tout le gabarit | `0` |
| Champ de recherche | `⌘K` en `kbd`, bordure 1 px, `10px` |
| Compteur d'événements | pastille `--color-accent` `6px`, `pulse` 2600 ms |

### 2.5 Global

| Invariant | Valeur attendue |
|---|---|
| Familles | `--font-heading` / `--font-body` / `--font-mono-data`, jamais une quatrième |
| `border-radius` maximum hors niches et feuille client | `2px` |
| `box-shadow` **portée** sur une carte | aucune. Le relief est en `inset` |
| Reflet spéculaire | `sheen`, 2100 ms, une fois à l'ouverture, rejouable au survol |
| `prefers-reduced-motion` | toutes les animations coupées |
| Chiffres > 24 px | `text-shadow: 0 1px 0 var(--lumiere)` (incision), jamais de glow |
| Tout libellé (capitales, mono, en-tête de colonne, bouton) | `--encre-2`. `--color-text-tertiary` est **interdit sur du libellé, quelle que soit la taille** |

**Remplissage et texte ne prennent pas le même token.** `--color-safe`, `--color-watch`
et `--color-breach` sont des couleurs de **remplissage** : trames, segments, curseurs.
Dès qu'un de ces rôles porte du **texte**, il prend sa variante `-2`
(`--color-breach-2` = 6,48:1, `--color-safe-2` = 5,63:1).

**Exception, tranchée explicitement : l'ocre ne porte pas de texte sous 24 px.**
`--color-watch` mesure 2,57:1 et `--color-watch-2` 3,46:1 — conforme au-delà de 24 px,
insuffisant en dessous. Donc : un chiffre « à surveiller » de 24 px ou plus prend
`--color-watch-2` ; en dessous il passe en `--encre`, et l'ocre reste sur la **marque**
(curseur dans la gorge) et sur le libellé. Constaté le 05/08 : la strate « à surveiller »,
celle où la décision se joue, était la moins lisible de l'écran.

**Règle de contraste — tranchée le 05/08, formulée par rôle et non par taille.**
`--color-text-tertiary` mesure **2,83:1** sur la chaux : sous 4,5:1. Le token n'est pas
modifié — il reste juste pour de la prose secondaire longue — mais il est **interdit sur
tout libellé**, quelle que soit sa taille. Les libellés passent en `--encre-2`.

La première version de cette règle disait « ≤ 11 px en capitales ». Un seuil de taille
fuit à sa frontière : les cinq boutons de période inactifs du gabarit, à 11,5 px, sont
passés juste à côté et sont restés illisibles — dans le composant même que le § 2.4
décrit comme celui qui se propage partout. Une règle de contraste se formule par rôle.

---

## 3. Règles à supprimer

Supprimer, jamais surcharger. Une règle périmée qui survit sous une surcharge
réapparaît au premier refactor.

| Fichier | Sélecteur / ligne | Action |
|---|---|---|
| `src/dashboard.css` | `.vl-diverge-bar { height: 4px }` | passer à `10px` |
| `src/dashboard.css` | `border-bottom` des lignes Top/Flop en `--color-ink` | passer en `--color-divider` |
| `src/dashboard.css` | grille `1fr / 2fr / 76px` de la carte VL | remplacer par § 2.2 |
| `src/modules/app-dashboard.js` | rendu du sous-jacent en 2ᵉ ligne du nom VL | supprimer |
| `src/modules/app-dashboard.js` | formatage `%` + 2 décimales des écarts de VL | passer en points d'écart à 100 |
| `src/modules/app-dashboard.js` | ligne de légende interne de la carte VL | supprimer, remonter dans l'en-tête |
| `src/modules/app-dashboard.js` | `renderGauge` sur axe `−20/+40` pour les barrières | remplacer par la règle graduée § 2.1 |
| `src/modules/app-dashboard.js` | pastille de statut des lignes de barrière | supprimer |
| `src/dashboard.css` | commentaires « §1.2 » | déplacer dans `CLAUDE.md` (R5), puis supprimer du CSS |

**À ne pas toucher :** `.up, .dn { color: var(--color-ink) }`. C'est correct (§ 2.2).

---

## 4. Preuve de fin

1. Sonde d'invariants lancée sur `origin/master` **après push**, sortie brute collée
   dans le rapport (R7).
2. Le Dashboard et la section correspondante de la maquette ouverts côte à côte.
3. Un cas limite exercé explicitement : un produit à moins de 2 points sous sa
   barrière (zone franchie visible) et un produit au-dessus de 100 (branche positive
   de la carte VL rendue). Injecter les données si le jeu réel ne les contient pas —
   c'était la bonne méthode du rapport du 05/08, elle se garde.
