# Ce qu'on dit à Claude Code

Un message par lot. On ne joint jamais la maquette ni l'historique (§ 4 du contrat).

**Chemins : toujours complets depuis la racine du dépôt** — `structura-v2/handoff-septembre/…`.
Écrit sans le préfixe, le chemin ne résout pas et l'implémenteur cherche ailleurs (audit § A7).

---

## Lot 0 — tokens (déjà prêt)

> Lis `handoff-septembre/specs/design-tokens-v2.md` et applique-la, **elle seule**.
> Elle ne touche que `src/design-tokens.css` : onze valeurs de tokens de rôle
> remontées en chroma, jour et nuit, plus deux tokens à ajouter (`--color-band`,
> `--color-on-band`). **Aucun écran n'est retouché dans ce commit** — ni HTML, ni
> module JS, ni autre feuille CSS. Bump le `?v=` de `design-tokens.css`, lance
> `node handoff-septembre/tools/check-tokens.mjs`, pousse, et colle la sortie brute
> de la sonde dans ton rapport.

## Lot 1 — gabarit de contrôles · **clos le 09/08, rien à committer**

Le gabarit était déjà conforme (composant unique partagé, deux rangs 62/54, coins droits,
mode actif en trait bas). Deux corrections côté design en sont sorties : § 4 ramené à
quatre écrans (v2 de la spec) et O4 sur `calque.mjs`. Message d'origine conservé :


> Lis `handoff-septembre/specs/controles.md` et `handoff-septembre/specs/00-doctrine.md`.
> Implémente le gabarit **en composant partagé unique**, puis monte-le sur les six vues
> nommées au § 4. Supprime les hauteurs, rayons et couleurs de contrôle déclarés en local
> dans ces vues — supprime, ne surcharge pas. Ne touche à aucun autre bloc de ces écrans
> (R6). `check-tokens.mjs` + `calque.mjs controles`, bump des `?v=`, push, rapport.

## Lot 2 — Dashboard

> Lis `structura-v2/handoff-septembre/specs/dashboard.md`,
> `structura-v2/handoff-septembre/specs/dashboard-correctif-02.md` et
> `structura-v2/handoff-septembre/specs/00-doctrine.md`. **Ces trois-là, rien d'autre.**
> Sont périmés, quoi qu'en disent les commentaires du code qui les citent encore :
> `structura-v2/PASSE-1..6.md`, `PASSE-7A-corrections*.md`, `structura-v2/handoff 7/PASSE-8.md`,
> `structura-v2/CLAUDE.md`, `specs/dashboard-correctif-01.md`, et toute maquette en pièce jointe.
> Si un commentaire de `design-tokens.css` ou de `passe7.css` renvoie à « passe 7 » ou
> « passe 8 », **ne va pas lire le document** : la doctrine en vigueur est `00-doctrine.md`.
> **En cas d'écart, le correctif 02 gagne sur `dashboard.md`** — il fixe le rendu cible
> (`Dashboard.dc.html`) et la liste arrêtée des blocs. Le § 0.1 de `dashboard.md` est déjà
> fait (`--lumiere` est dans le dépôt depuis le lot 0) : ne le réimplémente pas.
> Les invariants du § 2 sont mesurables à 0 px près ; les règles du § 3 sont à **supprimer**,
> pas à surcharger. Tout ce que la spec ne nomme pas est hors périmètre (R6). Si un invariant
> te paraît faux ou demande une couleur absente de `src/design-tokens.css`, **arrête-toi et
> remonte-le** au lieu d'inventer.
> **Le § 2.4 (gabarit de contrôles) est hors périmètre** : il a été vidé au profit de
> `specs/controles.md`, le composant est clos depuis le lot 1, on n'y touche pas.
> Sont périmés et ne servent à rien ici : `dashboard-correctif-01.md`, `structura-v2/PASSE-*.md`,
> `structura-v2/handoff 7/`, `Direction Mediterranee v3.dc.html`, `Structura.dc.html`.
> `node structura-v2/handoff-septembre/tools/check-tokens.mjs` +
> `node structura-v2/handoff-septembre/tools/calque.mjs --app <url> --only 2.1` (puis 2.2, 2.3)
> — il mesure `structura-v2/handoff-septembre/maquette/Dashboard.dc.html` par défaut. Bump des `?v=`, push, sortie brute
> des sondes dans le rapport, et **toute mesure non lancée se rapporte comme non mesurée**.

## Lots suivants

Même forme, une spec à la fois, dans l'ordre de `plan-septembre.md`. Le message type :

> Lis `handoff-septembre/specs/<ecran>.md` et `handoff-septembre/specs/00-doctrine.md`.
> Implémente cette spec seule. Les invariants du § 2 sont mesurables à 0 px près ;
> les règles du § 3 sont à **supprimer**, pas à surcharger. Tout ce que la spec ne
> nomme pas est hors périmètre. Si un invariant te paraît faux ou demande une couleur
> qui n'existe pas dans `src/design-tokens.css`, **arrête-toi et remonte-le** au lieu
> d'inventer — c'était la bonne méthode le 05/08. `check-tokens.mjs` + `calque.mjs`,
> bump des `?v=`, push, sortie brute des sondes dans le rapport.
