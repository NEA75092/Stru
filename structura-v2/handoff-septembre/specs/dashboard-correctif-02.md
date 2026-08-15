# spec — Dashboard, correctif 02

Version 1 · 09/08/2026 · **complète** `specs/dashboard.md` v2, ne la remplace pas.
Doctrine : `specs/00-doctrine.md`.

---

## 1. Rendu cible — correction

`specs/dashboard.md` § 1 nomme `Direction Mediterranee v3.dc.html`. Cette maquette est
**périmée**. Le rendu cible est `Dashboard.dc.html` (1440 px, jour + nuit).

## 2. Blocs du Dashboard — liste arrêtée

| Bloc | État |
|---|---|
| Bandeau de KPI (encours, clients, coupons) | conservé |
| « Marge avant la barrière » | conservé — 5 plus serrés / 5 plus au large, jauge D1 |
| « Top / Flop VL » | **rétabli en 5 / 5**, écart à 100, axe centré, encre (D4), grille `186px 1fr 1fr 54px` |
| « Sous la protection du capital » | 3 produits, règle graduée D2, sans nominal (D5) |
| « Ce qui arrive » (calendrier) | conservé, groupé par mois, marque « Appel client » |
| « Répartition émetteurs » | anneau aux couleurs de marque + tableau part/encours |
| « À traiter aujourd'hui » | **supprimé** — refusé le 09/08 |

## 3. Répartition émetteurs — arbitrage du 09/08

Le **plafond interne de 25 % est supprimé** de tout l'écran : ni repère, ni libellé, ni
couleur d'alerte. Perdant nommé : la carte « Exposition par groupe bancaire » de la
refonte, qui en faisait son sujet.

| Invariant | Valeur |
|---|---|
| Anneau | `212px`, `conic-gradient` aux couleurs de marque émetteur (seul hex autorisé, R5) |
| Trou central | `inset 34px`, fond `--color-bg`, inset 1 px `--color-divider` + arête `--lumiere` |
| Centre | encours total `--font-heading` `34px`, nombre d'émetteurs en mono `9.5px` |
| Tableau | `grid: 10px minmax(0,1fr) 78px 60px`, `gap 14px`, séparateur `--color-divider` |
| Reste | « 14 autres émetteurs » en `color-mix(--color-ink, --color-bg 78%)` |
| Lien | « Exposition détaillée dans Pilotage » |

La version **complète** (barre empilée + lignes + encours) vit dans **Pilotage**, pas
ici. Le Dashboard donne la synthèse, Pilotage l'analyse.

## 4. Preuve de fin

Sonde : aucune occurrence de `25` en repère ou libellé dans le bloc émetteurs ;
la carte Top/Flop rend exactement **10 lignes**, 5 positives et 5 négatives.

## 5. Grille de page — mesurée sur Dashboard.dc.html (ajout du 15/08)

Trou de la v1 : le § 2 listait les blocs sans dire leur disposition. Sans cette
grille, chaque bloc occupe toute la largeur utile et la piste centrale des lignes
absorbe seule le surplus — les colonnes fixes ne bougent pas, la piste double.

| Zone | Valeur (l. de la maquette) |
|---|---|
| En-tête + bandeau de KPI | pleine largeur, `margin: 0 var(--view-pad)` (176, 187) |
| Corps | `grid-template-columns: minmax(0,1.32fr) minmax(0,1fr)`, `gap: 40px`, `padding: 40px var(--view-pad) 44px` (208) |
| Colonne gauche (1.32fr) | `flex column`, `gap: 44px` (210) : « Marge avant la barrière », puis « Top / Flop VL » |
| Colonne droite (1fr) | `flex column`, `gap: 40px` (357) : « Sous la protection du capital », puis « Ce qui arrive » |
| Répartition émetteurs | hors du corps, bande pleine largeur `296px minmax(0,1fr)`, `gap: 48px`, `margin: 0 var(--view-pad) 56px`, `padding: 34px 0 0`, filet haut `inset 0 1px 0 var(--color-border)` (482) |
| Titres de bloc | `--font-heading` `27px` poids 300, `letter-spacing: -0.025em` |

Arbitrage : « Distribution du risque » (`dashboard.md` § 2.3) n'est pas dans la
maquette. Il **reste** au Dashboard mais passe en colonne gauche sous Top/Flop,
sur toute la largeur de la colonne. Perdant nommé : `.dash-vl-grid`, la paire
côte à côte — elle compressait Top/Flop pendant que le reste s'étalait.

Preuve de fin : à 1440 px, la piste de `.cap-margin-row` mesure la largeur de la
colonne gauche moins 196 − 72 − 2×20, pas la largeur de la vue.
