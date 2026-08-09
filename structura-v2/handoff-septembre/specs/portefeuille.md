# spec — Portefeuille

06/08/2026 (soir) · sur `9220bc1` · maquette : `maquette/Structura.dc.html`, onglet Portefeuille

## Ce que cette spec dit, en une phrase

**Presque rien à faire.** `src/tables.css` porte déjà le système de tableau complet,
et il est juste. La maquette s'en était écartée sur cinq points ; c'est **la maquette
qui a été corrigée**, pas le code. Ce fichier existe pour dire ce qui reste, et surtout
pour dire ce qui ne doit pas bouger.

---

## 1. Rendu cible

`maquette/Structura.dc.html`, onglet Portefeuille. Aucune paraphrase en prose : la
prose reformule et introduit du jeu.

---

## 2. Ce qui est déjà conforme et ne bouge pas

Relevé dans `src/tables.css` en le lisant, pas de mémoire :

| Élément | Où | État |
|---|---|---|
| Largeurs des dix colonnes | `#pf-table thead th:nth-child(n)`, en % | conforme, ne pas retoucher |
| Largeur minimale du tableau | `#pf-table { min-width: 1470px }` | conforme |
| Débordement d'une cellule | `.tbl-wrap td` — une ligne, ellipse, `title` sur l'Émetteur | conforme |
| Montants | `.num` — mono, tabular, à droite, **jamais de couleur** | conforme |
| Pastille de statut | `.pill-status` — ronde, teinte 84 %, point de 6 px | conforme |
| Pastille de type | `.pill-category` — neutre pour tous les types | conforme |
| Filet d'une ligne en alerte | `.row-breach` / `.row-warn` — `inset 3px 0 0` sur la 1ʳᵉ cellule | conforme |
| Arête de survol | `.tbl-wrap tbody tr:hover td:first-child` — `inset 2px 0 0 --color-accent` | conforme |
| Jauge de distance | `.bar-track` 64 px max, 6 px de haut, `.bar-fill` par statut | conforme |

> **Les cinq écarts relevés au calque venaient de ma maquette.** Pastilles carrées au
> lieu de rondes, teinte à 88 % au lieu de 84, point supprimé, filet à 2 px au lieu de
> 3, type en texte au lieu d'une pastille. Aucun n'était une décision : je redessinais
> un système que je n'avais pas lu. La maquette est corrigée dans ce dossier.
>
> Cas d'école : l'arête de mer au survol d'une ligne, que j'ai « conçue » le 06/08 au
> soir, existe dans `tables.css` depuis la passe 4. Une maquette qui ignore le code
> finit par réinventer ce qu'il contient déjà — au mieux à l'identique, au pire à côté.

---

## 3. Invariants mesurables — ce qui reste à faire

| Invariant | Valeur attendue | État |
|---|---|---|
| Colonne « Distance protection » coupée au bord droit | la colonne doit être entièrement visible à la largeur de travail | **à corriger** (C5 du correctif 01) |
| Ordre par défaut à l'ouverture | par statut décroissant : franchie, critique, alerte, sain | **à écrire** |
| Compteur du bandeau | reflète les lignes **affichées** après filtre, pas le total du portefeuille | à vérifier |

C5 est le seul défaut de rendu relevé sur cet écran. Il avait été signalé le 06/08 au
matin et renvoyé à cette spec pour ne pas être découvert deux fois.

L'ordre par défaut n'a jamais été écrit nulle part — même famille de trou que C6 sur le
Top/Flop. Un tableau de suivi qui s'ouvre sur un ordre alphabétique oblige à chercher ce
qui brûle ; il doit s'ouvrir sur ce qui brûle.

---

## 4. Règles à supprimer

Aucune. C'est la première spec de ce dossier qui n'en supprime pas une seule.

---

## 5. Ce qui n'est pas dans cette spec

La densité, l'air autour du tableau et la typographie de l'en-tête diffèrent entre la
maquette et l'app. **Ce sont des propositions, pas des défauts** : elles ne sont pas
spécifiées ici et ne doivent pas être implémentées. Si on veut y toucher, ça se décide
séparément, et ça se mesure.
