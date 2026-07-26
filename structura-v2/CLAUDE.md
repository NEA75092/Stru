# Structura — règles de travail

Ce fichier est lu à chaque session. Il n'est pas indicatif.

## Contexte : pourquoi ces règles existent

Audit du 25/07/2026 : `src/` contenait 3 feuilles de style, 10 753 lignes,
250 Ko, **1 415 `!important`** et **263 sélecteurs déclarés 3 fois ou plus**.
`.client-card` était stylée par 6 règles dans 3 fichiers, `.vl-top-flop` par 6,
`.user-avatar` par 3.

Cause : chaque refonte a été ajoutée **par-dessus** la précédente avec
`!important` au lieu de remplacer. Conséquence : rayons, graisses, paddings et
couleurs de trois époques cohabitent sur le même écran, le design system ne
peint qu'une partie de chaque élément, et plusieurs livraisons ont été perçues
comme « aucun changement visible » malgré des commits réels.

## Les 4 règles

### 1. Supprimer, jamais surcharger
Toute règle qui remplace une règle existante **supprime** l'ancienne, dans le
même commit. Un sélecteur = une déclaration, dans un seul fichier.
Interdit : ajouter une règle plus spécifique, ou un `!important`, pour gagner
contre une règle qu'on aurait pu supprimer.

### 2. Zéro `!important`, zéro couleur littérale
Aucun `!important` dans une feuille réécrite. Aucun `#hex` ni `rgba()` hors de
`design-tokens.css` — seulement `var(--color-*)`. Les couleurs en dur sont la
cause directe des incohérences en mode nuit (≈90 cas trouvés à l'audit).

### 3. La couleur ne s'écrit pas dans le HTML ni dans le JS
Pas d'attribut `style=` portant une couleur dans `index.html`, pas de
`style="color:var(--…)"` injecté par un module. La couleur passe par une
classe. Les alias de l'ancienne charte (`--gold`, `--sand`, `--sea`,
`--terracotta`, `--purple`, `--blue2`…) sont morts : ne pas les réintroduire.

### 4. Aucune passe ne se termine sans vérification visuelle
Capture d'écran en thème **clair** ET **sombre** avant de déclarer une passe
faite. Trois cycles ont livré du code non vérifié visuellement.

## Sémantique des couleurs (décidée, non rediscutable)

| Couleur | Sert à | Ne sert jamais à |
| --- | --- | --- |
| Bleu `--color-aegean` | état sélectionné, action principale | mettre un montant en valeur |
| Corail `--color-coral` | bloc d'alerte, Δ négatif — 2 apparitions par écran max | fond de bouton, halo, décor |
| Vert / rouge | signe d'une variation chiffrée | décoration |
| Encre + mono | tous les montants, `tabular-nums`, alignés à droite | — |

Un montant n'est jamais coloré : il est en `--font-mono-data`, encre pleine,
aligné à droite sur une colonne commune. C'est l'alignement qui le rend
comparable, pas la couleur.

## Typographie

Inter (400–800) partout, y compris les gros chiffres. IBM Plex Mono pour tout
chiffre, ISIN, libellé technique et micro-label en capitales. Aucun texte sous
11 px. Pas de police display séparée.

## La barrière

`npm test` inclut `tests/css-hygiene.test.js`. Il vérifie mécaniquement les
règles 1 à 3, la sémantique du corail, et la présence du logo du client. **Une passe n'est pas
terminée tant que `npm test` n'est pas vert.** Ne pas modifier ce test pour le
faire passer : le faire passer en corrigeant le CSS.

Le test progresse par passe. À la fin d'une passe :
1. ajouter la feuille écrite à `MIGRATED`,
2. passer le drapeau correspondant à `true` dans `STAGES`,
3. relancer `npm test`.

## Ordre d'exécution

1. **Passe 1 — coquille** : sidebar, header, nav, profil, boutons (`shell.css`).
   Visible sur les 9 vues ; sert de référence de style pour la suite.
2. **Passe 2 — dashboard** : KPI, performance, Top/Flop VL, exposition bancaire.
3. **Passe 3 — logo, relief et mouvement** : logo d'origine du client restauré,
   ombres teintées, liserés de lumière, grain, halo au curseur, entrées
   décalées (`relief.css`). Aucune mise en page touchée.
4. **Passe 4 — suppression des feuilles héritées** : `styles.css` et
   `institutional-theme.css` supprimés, alias legacy supprimés, thème sombre
   complété, système de tableau unique (portefeuille, barrières, clients),
   KPI barrières, accueil.
5. **Passe 5 — primitives partagées et vues restantes** : overlays (modale,
   tiroir, menus), boutons/champs/toolbars, clients, calendrier, analytics,
   ingestion, pitch engine, decrement score.

À la fin de la passe 4 : `styles.css` et `institutional-theme.css` sont
supprimés, le bloc d'alias `dashboard.css:40-64` est supprimé, et il ne reste
aucun `!important` dans `src/*.css`.

## Reversements de décision (26/07/2026)

Deux décisions du 24/07 sont **annulées** par le client. Elles restent écrites
ici avec leur motif : ce fichier documente ses reversements, il ne les efface pas.

1. **« Les cards n'ont plus d'ombre »** → annulée. Sans ombre ni dégradé
   interne, les cartes n'avaient pas d'épaisseur. Le relief revient, mais
   **teinté** : l'ombre d'une carte porte la teinte de la carte (bleu pour
   l'encours, corail pour le critique), jamais un gris neutre. Une ombre grise
   est une ombre de template.
2. **« La marque est un wordmark typographique »** → annulée. Le client a
   restauré son logo d'origine depuis sa sauvegarde. La marque est de nouveau
   une image, en deux variantes (claire et sombre) — pas un `filter: invert()`.

## Ce que la passe 4 a appris (26/07, revue client)

Trois passes ont été livrées « vertes » alors que six vues sur neuf étaient
encore peintes par les feuilles héritées. Deux trous dans la barrière l'ont
permis, tous deux fermés en passe 4 :

1. **Aucun test ne lisait `src/modules/*.js`.** Le test 6 ne regardait
   qu'`index.html`. Résultat : `style="color:var(--gold)"` a survécu trois
   passes dans `app-portfolio.js` et `app-screener.js`, colorant en corail
   tous les montants de tous les tableaux — contre deux règles validées.
   → test 11.
2. **Aucun test ne vérifiait la parité clair/sombre des tokens.** Dix tokens
   (`--color-aegean-2`, `--color-ocean-2`, `--color-success-2`…) n'avaient
   aucune valeur en sombre et gardaient donc une couleur de thème clair sur un
   fond presque noir : graphiques et valorisations invisibles. → test 12.

Règle qui en découle : **un drapeau `STAGES` ne passe à `true` que si la vue
a été ouverte dans les deux thèmes.** « Le test est vert » n'a jamais voulu
dire « la vue est faite ».

## Périmètre : ce que la passe 5 a appris (26/07)

La passe 4 a supprimé les deux feuilles héritées. L'audit préalable a
correctement signalé que le tiroir, la modale, les boutons/formulaires et deux
vues jamais mentionnées ne tenaient que grâce à elles. La réponse reçue a été
« suis la lettre du document » — et la lettre ne couvrait que trois vues.
Résultat en production : le formulaire de 18 champs empilé en bas de chaque
page, le calendrier en liste nue, six vues sans mise en forme.

> **Quand un audit révèle qu'une suppression casse des éléments hors périmètre,
> le périmètre est faux — pas l'audit.** Remonter la liste et attendre un
> arbitrage explicite sur chaque élément, plutôt qu'un « suis la lettre du
> document » qui laisse des vues non stylées en production.

Le signalement était le bon. C'est la décision de périmètre qui était mauvaise.

## Ce qu'il ne faut pas faire

- Écrire un nouveau fichier CSS « de correction » par-dessus les autres.
- Répondre à un problème d'alignement par un `transform: translate…` ou une
  marge négative : c'est un symptôme de deux layouts concurrents sur le même
  élément — chercher le doublon et en supprimer un.
- Ajouter un bloc, une métrique ou une carte non demandée. Si une information
  apparaît déjà ailleurs, elle n'est pas dupliquée : une information, un endroit.
