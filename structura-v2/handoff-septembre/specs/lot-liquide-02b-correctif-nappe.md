# lot-liquide-02b-correctif-nappe — l'eau n'est que sur le Dashboard

Version 1 · 25/08/2026 · correctif du LOT 2 (sha `e69646a`). Dépend de
`specs/00-doctrine-liquide.md` et `specs/lot-liquide-02-coquille.md`.

## 1. Le défaut, et de qui il vient

Le LOT 2 a posé la nappe dans `shell.css`, donc sous **les neuf écrans**. La doctrine
dit l'inverse : « rien d'informatif n'y vit sauf le titre et les cartes de verre ».
La nappe n'a de sens que là où les 640 px du haut sont un titre et des cartes
flottantes — c'est-à-dire le Dashboard, et lui seul.

**C'est une erreur de découpage de la spec, pas de l'implémentation.** J'ai décrit la
nappe comme un élément de coquille alors que c'est un élément d'écran. Le LOT 2 a fait
exactement ce qui était écrit.

Ce que ça produit, constaté aux captures du sha `e69646a` :

| Écran | Défaut |
|---|---|
| Clients | la ligne d'en-tête du tableau (CLIENT / ENCOURS / PERFORMANCE / PRODUITS) est posée sur l'eau — donnée dense sur la nappe |
| Calendrier | « INDICATEURS À VENIR, INDÉPENDANTS DE LA PÉRIODE AFFICHÉE » illisible : encre claire sur azur clair, contraste mort en mode jour |
| Dashboard | même défaut sur « ENCOURS INITIAL VS VALORISATION · PERFORMANCE SUR LA PÉRIODE » |
| Pitch Engine | la nappe passe derrière le formulaire et l'aperçu collant, deux zones de saisie |

Les trois défauts de contraste **disparaissent avec la nappe** : il n'y a rien à
retoucher en typographie ni en couleur d'encre. Ne corrige aucun libellé.

## 2. Le correctif

La nappe ne s'affiche que lorsque l'écran actif est le Dashboard. Sur les huit autres,
aucune eau : le plâtre commence sous le header.

**Emploie le mécanisme d'écran actif qui existe déjà** — l'attribut, la classe ou l'id
que l'app pose déjà pour savoir quel onglet est ouvert. Ne crée ni attribut, ni classe,
ni état JS pour ça. Si aucun mécanisme n'est atteignable depuis CSS, **arrête-toi et
dis-le** : c'est alors une décision d'architecture, pas un correctif de peinture.

La transition entre un écran avec eau et un écran sans eau ne s'anime pas. Une nappe
qui se retire en fondu à chaque changement d'onglet est un effet qui n'aide pas le CGP
à voir ce qu'il doit faire : `display` binaire, pas d'`opacity` animée.

## 3. Ce qui ne bouge pas

Le rail marine reste sur les neuf écrans — c'est le rail, pas l'eau. Même largeur
236 px, même lockup, mêmes neuf items à 44 px, mêmes tracés d'icônes. La coque bordée
et sa jointure centrale nue restent telles quelles : la solution sans conteneur ajouté
était la bonne, ne la défais pas.

Les huit couches de la nappe, les deux dérives et les deux arêtes de lumière restent
inchangées **dans leur définition**. On change où elles s'affichent, pas ce qu'elles
sont.

## 4. Fichiers autorisés — deux

| Fichier | Changement |
|---|---|
| `structura-v2/src/shell.css` | la nappe devient conditionnelle à l'écran actif |
| `structura-v2/index.html` | **uniquement** le bump `?v=` |

Si le conditionnement exige de toucher `index.html` au-delà du `?v=` — parce que le
bloc `.nappe` est mal placé dans l'arbre pour être ciblé — dis-le avant d'agir.

## 5. Preuve

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 2
node structura-v2/handoff-septembre/tools/check-tokens.mjs
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Les contrôles du LOT 2 restent tous verts : nappe à 640 px (sur le Dashboard),
rail à 236 px, `prefers-reduced-motion` présent, diff des tracés `d=` vide.

Ajoute une mesure DOM : **hauteur de `.nappe` sur un écran non-Dashboard, qui doit
être 0 ou l'élément absent.** C'est la preuve du correctif.

Rapport : sorties brutes, sha, cette mesure, et captures 1600 px jour + nuit de
**Dashboard, Clients, Calendrier, Pitch Engine** — les quatre mêmes qu'au LOT 2, pour
que la comparaison soit directe.

## 6. Ce qui vient après, et pourquoi pas maintenant

Sur le Dashboard, le hero « Bonsoir Marie » et les quatre KPI sont restés **mates et
opaques** alors qu'ils flottent au-dessus de l'eau. C'est le défaut symétrique : un
premier plan sans verre. Il se corrige dans `dashboard.css`, un fichier d'écran, donc
hors du périmètre de ce correctif comme de celui du LOT 2.

C'est le LOT 4 : `specs/lot-liquide-04-verre-dashboard.md`. Ne l'anticipe pas ici.
