# spec — Barrières

06/08/2026 (soir) · sur `9220bc1` · maquette : `maquette/Structura.dc.html`, onglet Barrières

## 1. Rendu cible

`maquette/Structura.dc.html`, onglet Barrières. Aucune paraphrase.

---

## 2. Ce qui est déjà conforme et ne bouge pas

Relevé dans `src/modules/app-portfolio.js` et `src/tables.css`, en les lisant.

| Élément | Où | État |
|---|---|---|
| Tri par défaut du tableau | `barrierSort = { col: "dist", asc: true }` — le plus proche du seuil en tête | **conforme, et c'est le bon** |
| Exclusion des capital garanti | `.filter(p => p.type !== "CG")` | conforme — un CG n'a structurellement pas de barrière |
| Filtre par statut | les 4 cartes de compteur, point d'entrée unique (passe 8 § 4) | conforme |
| Proportion sous chaque compteur | `count / total` en largeur | conforme |
| Sous-titre des cartes critique/surveillance | date de la prochaine observation la plus proche | conforme |
| Largeurs des dix colonnes | `#bar-table thead th:nth-child(n)` | conforme |
| Jauge de distance | `renderGauge({ scale: "row", min: −20, max: +40 })` | conforme — voir § 3 |
| Pastilles, filets, arête de survol | `tables.css` | conforme (voir `specs/portefeuille.md` § 2) |

---

## 3. L'axe des jauges : le code a raison, ma maquette a tort

`app-portfolio.js` fixe `GAUGE_AXIS_MIN = -20` et `GAUGE_AXIS_MAX = 40` en constantes, et
écrit le motif juste au-dessus :

> « axe fixe -20 %/+40 %, repère de seuil toujours à sa position 0 % […] pour que la même
> barrière tombe au même endroit en ligne de tableau et en tiroir »

**C'est un meilleur raisonnement que le mien.** Ma maquette dérive l'axe de la
distribution affichée : chaque écran devient auto-cohérent, et deux écrans deviennent
incomparables — la même barrière change de place selon ce qui est filtré à côté d'elle.
Sur un écran de risque, une position qui bouge sans que la donnée bouge est un piège.

**Rien à changer dans l'app.** La maquette sera alignée sur l'axe fixe.

> **Une question ouverte, à mesurer et non à trancher.** Le portefeuille contient des
> distances au-delà de +40 % (relevé : +41,8 % et +54,5 %). Sur un axe borné à +40, où
> `renderGauge` les place-t-il — bornées à l'extrémité, ou hors piste ? Si elles sont
> bornées, deux produits très différents se superposent au même point ; si elles
> débordent, c'est un défaut de rendu. **Mesure-le et renvoie-moi ce que tu observes.**
> Ne corrige rien avant : selon la réponse, c'est soit conforme, soit un correctif à
> écrire, et ce n'est pas à l'implémenteur de choisir lequel (R6).

---

## 4. Invariants mesurables — ce qui reste à faire

| Invariant | Valeur attendue | État |
|---|---|---|
| Frise de distribution | mini-graphe non interactif ici ; la version avec échelle et pastilles cliquables vit dans Pilotage | à vérifier conforme |
| Échelle sous la frise | **aucune** sur cet écran (elle appartient à Pilotage) | à vérifier |
| Compteur « 11 » du badge de navigation | somme franchie + critique + alerte, pas le total à barrière | à vérifier |

Rien d'autre. Cet écran est, à ma connaissance, le plus conforme des neuf.

---

## 5. Règles à supprimer

Aucune.

---

## 6. Ce qui n'est pas dans cette spec

La densité, l'air, la typographie d'en-tête et la frise à axe dérivé de la maquette sont
des **propositions non spécifiées**. Ne pas les implémenter. La frise à axe dérivé est
même explicitement écartée par le § 3.
