# spec — Gabarit de contrôles (composant partagé)

Version 1 · 09/08/2026 · doctrine : `specs/00-doctrine.md` (D8)
**À implémenter en premier.** Aucun autre écran de ce lot ne part avant que ce
composant soit poussé : les six écrans suivants l'importent.

Rendu cible : `Dashboard.dc.html` + section 7c de la refonte validée.

---

## 1. Structure — deux barres, jamais une

| Rang | Contenu | Hauteur |
|---|---|---|
| 1 | flèches ← →, libellé de période, sélecteur de mode, compteur d'événements | `62px` |
| 2 | recherche, date de référence, « Aujourd'hui » | `54px` |

Gouttière entre les deux rangs : `12px`. Une seule barre = débordement horizontal ;
c'est le défaut constaté sur Calendrier, Portefeuille et Barrières.

## 2. Invariants mesurables

| Invariant | Valeur |
|---|---|
| Flèches ← → | `50px` de large, séparées par 1 px `--color-border` |
| Bloc période (libellé) | `min-width: 208px`, `padding: 0 22px` |
| Boutons de mode | `padding: 0 20px`, séparés par 1 px `--color-border` |
| Mode actif | trait bas `2px` `--color-accent` — **jamais** un fond plein |
| Modes inactifs | libellé `--encre-2` (D7), jamais `--color-text-tertiary` |
| `border-radius` sur tout le gabarit | `0` |
| Champ de recherche | `⌘K` en `kbd`, bordure 1 px, `10px` |
| Compteur d'événements | pastille `--color-accent` `6px`, `pulse` 2600 ms |

## 3. Les six modes du calendrier restent six

`day / week / month / year / range / rolling` — vérifiés dans
`src/modules/app-calendar.js` : aucun doublon. Ils passent tels quels sur le gabarit.
Toute proposition de les réduire est hors périmètre (R6).

## 4. Portée

Le composant est monté sur : Calendrier, Portefeuille, Barrières, Clients, Pilotage,
Doc Reader. Aucun de ces écrans ne redéclare de hauteur, de rayon ou de couleur de
bouton de contrôle en local — s'il en reste une, elle est supprimée, pas surchargée.

## 5. Preuve de fin

Sonde : les six vues rendent le même `offsetHeight` de rang 1 (62) et de rang 2 (54),
et `document.querySelectorAll('[class*=control] [style*=border-radius]')` ne renvoie
aucune valeur > 0.
