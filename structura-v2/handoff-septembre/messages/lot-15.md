# LOT 15 — à Claude Code

Spec : `structura-v2/handoff-septembre/specs/lot-liquide-15-vies-separees-et-taille-ecran.md`.
Rendu cible : `Dashboard - Liquide.dc.html`. Lis le § 0 en premier.

Quatre choses, dans cet ordre :

1. **Séparer les deux vies** (§ 1). Le calendrier du premier plan et « À regarder
   aujourd'hui » ne montrent plus **aucun** événement produit ; les événements produit
   vivent uniquement dans la dalle du bas, qui prend le titre « Événements produits ».
   **Le § 0.1 est bloquant** : la donnée « vie de cabinet » n'existe pas au dépôt.
   Voie retenue : **(b)** — un modèle `cabinetEvents` alimenté en mode démo, vide en
   production avec un état vide écrit. Rien d'inventé en production.
2. **Les écarts restants du cadre d'encours et du calendrier** (§ 2 et § 3), un par un.
   Le § 3.3 est un défaut de lisibilité, pas un écart de goût : la pastille de jour
   chargé est peinte en encre sombre sur l'eau.
3. **L'app à la taille de l'écran** (§ 4). Le plancher de 1280 tombe, le repli se fait
   par la loi de la boîte, aucune `@media` nouvelle. Le § 4.4 (la nappe suit le premier
   plan) est la seule addition de DOM autorisée du lot — sans elle, les cartes de verre
   sortent de l'eau dès le premier repli.
4. **Le lockup** (§ 5) : bloc de marque centré, symbole 56 × 30. Aucun pixel du logo
   n'est redessiné.

Preuves à joindre : celles nommées au § 4, plus les captures jour + nuit à 1600 et 900.
