# Ce qu'on dit à Claude Code

Un message par lot. On ne joint jamais la maquette ni l'historique (§ 4 du contrat).

---

## Lot 0 — tokens (déjà prêt)

> Lis `handoff-septembre/specs/design-tokens-v2.md` et applique-la, **elle seule**.
> Elle ne touche que `src/design-tokens.css` : onze valeurs de tokens de rôle
> remontées en chroma, jour et nuit, plus deux tokens à ajouter (`--color-band`,
> `--color-on-band`). **Aucun écran n'est retouché dans ce commit** — ni HTML, ni
> module JS, ni autre feuille CSS. Bump le `?v=` de `design-tokens.css`, lance
> `node handoff-septembre/tools/check-tokens.mjs`, pousse, et colle la sortie brute
> de la sonde dans ton rapport.

## Lot 1 — gabarit de contrôles

> Lis `handoff-septembre/specs/controles.md` et `handoff-septembre/specs/00-doctrine.md`.
> Implémente le gabarit **en composant partagé unique**, puis monte-le sur les six vues
> nommées au § 4. Supprime les hauteurs, rayons et couleurs de contrôle déclarés en local
> dans ces vues — supprime, ne surcharge pas. Ne touche à aucun autre bloc de ces écrans
> (R6). `check-tokens.mjs` + `calque.mjs controles`, bump des `?v=`, push, rapport.

## Lot 2 — Dashboard

> Lis `handoff-septembre/specs/dashboard.md`, `handoff-septembre/specs/dashboard-correctif-02.md`
> et `handoff-septembre/specs/00-doctrine.md`. Implémente les deux specs d'écran
> ensemble — **`dashboard-correctif-02.md` gagne en cas d'écart** avec `dashboard.md`
> (elle la complète et la corrige, elle ne la remplace pas). `dashboard-correctif-01.md`
> et tout document « PASSE-7 » (racine du dépôt, `handoff 7/`) sont **explicitement
> hors jeu** — périmés par R3, ne pas les lire pour arbitrer un doute. Les invariants du
> § 2 sont mesurables à 0 px près ; les règles du § 3 sont à **supprimer**, pas à
> surcharger. Tout ce que la spec ne nomme pas est hors périmètre. Si un invariant te
> paraît faux, ou demande une couleur qui n'existe pas dans `src/design-tokens.css`,
> **arrête-toi et remonte-le** au lieu d'inventer. `check-tokens.mjs`, puis
> `node handoff-septembre/tools/calque.mjs --app <url> --only 2.1` (répéter pour `2.2`
> et `2.3`), bump des `?v=`, push, sortie brute des sondes dans le rapport.

## Lots suivants

Même forme, une spec à la fois, dans l'ordre de `plan-septembre.md`. Le message type :

> Lis `handoff-septembre/specs/<ecran>.md` et `handoff-septembre/specs/00-doctrine.md`.
> Implémente cette spec seule. Les invariants du § 2 sont mesurables à 0 px près ;
> les règles du § 3 sont à **supprimer**, pas à surcharger. Tout ce que la spec ne
> nomme pas est hors périmètre. Si un invariant te paraît faux ou demande une couleur
> qui n'existe pas dans `src/design-tokens.css`, **arrête-toi et remonte-le** au lieu
> d'inventer — c'était la bonne méthode le 05/08. `check-tokens.mjs` + `calque.mjs`,
> bump des `?v=`, push, sortie brute des sondes dans le rapport.
