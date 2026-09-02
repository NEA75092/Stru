# LOT 9 — message à Claude Code

Spec : `structura-v2/handoff-septembre/specs/lot-liquide-09-coquille-sans-entete.md`.
Contexte : `audit-maquette-02-09.md` § 1. À faire **après** le LOT 8.

**La barre d'en-tête n'existe pas dans la maquette.** Ni ticker d'indices, ni horloge, ni
date, ni badge LIVE, ni pastille utilisateur. Sous le bord du cadre, l'eau commence
directement. C'est l'écart le plus gros de tout l'écran, et il a survécu à sept lots
parce que `shell.css` déclarait `.header` « hors périmètre ».

Deux mouvements :

1. **`.header` sort en entier** — le bloc, ses règles, et côté JS `INDICES`,
   `initTicker()`, `tick()` et son `setInterval`. Pas de code mort. Le § 2 de la spec
   liste tous les sélecteurs et tous les ids.
2. **Une rangée de quatre outils entre en pied de rail** (§ 3) : recherche,
   notifications, jour/nuit, profil. Quatre cibles 44px rondes, `margin-top: auto`,
   survol `--flottant` + `--flottant-brd`. La bascule de thème garde exactement sa
   logique : seul son hôte change. Le tracé de la lune se reprend **au dépôt**, pas à la
   maquette (règle 7 : je ne redessine pas ce qui existe).

**Portée : les neuf écrans**, `.header` étant partagé. C'est voulu et écrit au § 2 — pas
un effet de bord. Ce qui est perdu sans équivalent : le ticker, l'horloge, la date, le
badge LIVE. Les indices étaient onze valeurs en dur sans source de marché.

Si un autre module lit `#clk`, `#dt-str` ou `#ticker`, arrête-toi et nomme-le.

Preuves : § 6. Et je veux une capture de **Clients** : c'est là que la disparition de la
barre se voit le plus.
