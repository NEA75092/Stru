# spec — Gabarit de contrôles (composant partagé)

Version 2 · 09/08/2026 · doctrine : `specs/00-doctrine.md` (D8)
**À implémenter en premier.** Aucun autre écran de ce lot ne part avant que ce
composant soit poussé : les six écrans suivants l'importent.

Rendu cible : `Dashboard.dc.html` + section 7c de la refonte validée.

---

## 1. Structure — un rang obligatoire, un rang conditionnel (corrigé le 09/08, v2)

| Rang | Contenu | Hauteur | Sur quels écrans |
|---|---|---|---|
| 1 — période | flèches ← →, libellé de période, sélecteur de mode, compteur d'événements | `62px` | **là où une période existe** : Calendrier aujourd'hui |
| 2 — recherche | recherche, date de référence, « Aujourd'hui » | `54px` | **les quatre**, toujours |

Gouttière entre les deux rangs : `12px`.

**Correction, perdant nommé : la v1 de ce § 1** (« deux barres, jamais une »). Elle exigeait un
rang de période sur des écrans qui n'ont pas de période — Portefeuille n'a pas de mois à
afficher. `src/passe7.css:512-514` avait raison contre elle, et `index.html` le confirme :
`.control-band` n'est monté que sur Calendrier (l.466), les trois autres n'ont que
`.control-band-sub`. Voir `audit-09-08.md` § A2.

Ce qui reste vrai, et qui était le vrai défaut : **un seul rang qui porte tout** déborde
horizontalement. Recherche et actions ne remontent jamais dans le rang de période.

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

## 4. Portée — **quatre écrans** (corrigé le 09/08, v2)

Le composant est monté sur : **Calendrier, Portefeuille, Barrières, Clients**. Aucun de
ces écrans ne redéclare de hauteur, de rayon ou de couleur de bouton de contrôle en
local — s'il en reste une, elle est supprimée, pas surchargée.

**Arbitrage du 09/08, perdant nommé : la v1 de ce § 4**, qui annonçait six écrans.
Pilotage et Doc Reader n'ont pas de rang de contrôles au sens de ce gabarit — Pilotage
n'a aucune spec écrite à ce jour, Doc Reader est traité au lot 7 avec
`specs/doc-reader.md`. Les monter ici, c'était spécifier deux écrans par surprise dans
le lot d'un composant partagé. Ils sont **hors périmètre** (R6) tant qu'une spec ne les
nomme pas.

## 5. Preuve de fin

Sonde manuelle (`calque.mjs` n'a pas de mode `controles`, cf. O4), en trois mesures :

1. Les **quatre** vues rendent `offsetHeight === 54` sur `.control-band-sub`.
2. Tout `.control-band` présent rend `offsetHeight === 62`. Aucune vue n'en porte deux.
3. `document.querySelectorAll('[class*=control] [style*=border-radius]')` ne renvoie
   aucune valeur > 0.

Une mesure absente se rapporte comme **non mesurée**, jamais comme conforme — c'est ce
qui a fait passer le § 5 v1 pour vert sur un invariant faux.
