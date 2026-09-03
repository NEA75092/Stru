# LOT 11 — à donner à Claude Code

Spec : `structura-v2/handoff-septembre/specs/lot-liquide-11-portable-et-vestiges.md`
Maquette : `Dashboard - Liquide.dc.html` — relue et **corrigée** le 03/09
(elle a changé : courbe, tri des événements, alignements, couleur du Top/Flop,
rail. Ne code pas depuis la version que tu as lue au LOT 10.)

Trois retours client, dans l'ordre de gravité :

1. **« Rien n'a été supprimé des anciens outils en bas, c'est cata. »**
   `.sidebar-foot` est encore là (`index.html` l. 104-119). Il sort — § 1.
   Ma faute : il était encore dans ma maquette, aucun lot ne l'a audité.
2. **« Le format n'est pas adapté à un ordinateur portable. »**
   `min-width: 1600px`. Plancher 1280, par `clamp()`, § 2. À 1600 le rendu
   ne bouge pas d'un pixel — c'est la preuve n° 4.
3. **« Le rendu n'est pas tout à fait le même. »** Quatre défauts nommés par le
   client, tous corrigés côté maquette d'abord : § 3. Les trois premiers points
   sont des retours sur **le rendu de l'app**, pas sur la maquette : le § 3 dit
   ce que la maquette montre désormais, et c'est elle qui fait foi.

**Un quatrième point, arbitré après coup :** la marque du rail est **GUERFIN**,
pas Structura — j'avais substitué `structura-mark-dark.png` parce que l'artwork
Guerfin était absent du dépôt et rendait un cadre vide. Faux réflexe : c'était le
bon logo, mal cadré. Il est détouré (`assets/guerfin-symbole-clair-detoure.png`,
644 × 344) et poussé avec cette spec. § 4.

Lance `preuve-liquide --lot 11` **et** un sweep `--lot 5 → 11` avant de pousser.
Les mesures DOM du § 5.3 se font aux deux largeurs, jour et nuit.
