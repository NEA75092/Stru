# spec — Gabarit de contrôles (composant partagé)

Version 2 · 09/08/2026 · doctrine : `specs/00-doctrine.md` (D8)
**À implémenter en premier.** Aucun autre écran de ce lot ne part avant que ce
composant soit poussé : les quatre écrans suivants l'importent.

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

## 4. Portée — révisée le 09/08 (v2)

Le composant est monté sur quatre écrans : Calendrier, Portefeuille, Barrières,
Clients. Aucun de ces écrans ne redéclare de hauteur, de rayon ou de couleur de
bouton de contrôle en local — s'il en reste une, elle est supprimée, pas surchargée.

**Pilotage et Doc Reader retirés de la portée.** La v1 les nommait tous les deux ;
ni l'un ni l'autre n'a de barre de recherche, de période ou de mode à migrer —
constaté par Claude Code le 09/08 en confrontant cette spec au dépôt avant d'écrire
du code. Pilotage n'a aucune spec écrite à ce jour ; Doc Reader est traité au lot 7.
Perdant nommé : c'est la v1 de cette portée qui était fausse, pas le constat.

## 5. Preuve de fin — sonde manuelle (v2)

`calque.mjs` n'instrumente pas cette zone (§ 2.4 non câblé — voir
`constats-ouverts.md` O3 et O4) : pas de sonde automatisée tant que la maquette ne
porte pas les ancres `data-calque` correspondantes. Vérification manuelle sur les
quatre vues : même `offsetHeight` de rang 1 (62) et de rang 2 (54) à l'inspecteur,
et aucun `border-radius` calculé > 0 sur les éléments du gabarit.
