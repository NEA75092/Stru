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
