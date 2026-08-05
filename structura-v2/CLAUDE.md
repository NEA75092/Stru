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

## Typographie (mise à jour §1, 03/08)

Trois familles, chacune un rôle, aucune ne déborde sur celui d'une autre :

| Famille | Token | Sert à |
| --- | --- | --- |
| Newsreader | `--font-heading` | titres, display — noms de produit, en-têtes de section |
| Instrument Sans | `--font-body` | texte courant, UI, labels, boutons |
| IBM Plex Mono | `--font-mono-data` | tout chiffre, ISIN, libellé technique, micro-label en capitales |

Échelle en six pas, aucun texte en dessous de `--text-xs` :
`--text-xs` 12px · `--text-sm` 14px · `--text-base` 16px · `--text-lg` 20px ·
`--text-xl` 28px · `--text-2xl` 40px.

Cette section annule et remplace la version précédente (« Inter partout,
pas de police display séparée ») : cette règle datait d'avant la direction
typographique de §1 et n'était plus vraie depuis que Newsreader/Instrument
Sans/IBM Plex Mono ont été actées. Une règle périmée dans ce fichier est
pire qu'aucune règle — elle fait signaler un faux problème à chaque passe.

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

## `deploy.sh` — à éviter en l'état (02/08)

`../deploy.sh` (hors du repo `structura-v2`, à la racine `Structura/`) fait
`git add structura-v2 ... && git add -u` avant de committer. Lancé tel quel,
il aspire **tout** l'état non commité du moment — chantier en cours inclus —
dans un seul commit au message générique (« Mise à jour Structura <date> »).
Ça contredit directement la règle des commits atomiques par correctif.

Constat du 02/08 : passe 8 avait un gros chantier non commité (tokens
couleur, tables, fiche produit unique…) en même temps que deux correctifs
prêts à pousser. `deploy.sh` aurait tout committé ensemble. Écarté au profit
d'un `git push origin master` direct — les commits déjà faits suffisent à
déclencher le redéploiement Netlify, `deploy.sh` ne fait rien de plus dans
ce cas (son propre embranchement « rien à committer » le confirme : il ne
fait qu'un push s'il n'y a rien en staging).

**Avant de relancer `deploy.sh` : vérifier `git status` d'abord.** S'il y a
autre chose que ce qu'on vient de committer explicitement, ne pas le lancer
— pousser à la main. Version corrigée proposée (pousse sans jamais committer
ce qui n'a pas été validé) :

```bash
#!/bin/bash
# Pousse les commits déjà faits vers GitHub → Netlify rebuild.
# Ne committe jamais : échoue si quelque chose traîne en staging ou modifié.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

git status -sb
echo

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "→ Changements non commités détectés — rien poussé."
  echo "  Committer explicitement (par correctif) avant de relancer, ou"
  echo "  vérifier qu'il ne s'agit pas d'un chantier encore en cours."
  exit 1
fi

if ! git status -sb | grep -q 'ahead'; then
  echo "Déjà à jour avec GitHub. Rien à faire."
  exit 0
fi

git push origin master
echo
echo "OK — push envoyé. Netlify va redéployer sous 1–2 min."
echo "Site : https://zesty-tiramisu-e45883.netlify.app/"
```

## Portée d'un « deploie » (03/08)

Un « deploie » (ou « pousse ») ne porte que sur ce qui est nommé au moment
où il est écrit, ou à défaut sur ce qui est déjà commité à cet instant —
jamais sur ce qui sera commité après. Un « ne pousse pas » donné plus tôt
dans la session reste valable pour tout ce qui n'a pas encore été
explicitement réautorisé ; il ne s'annule pas tout seul avec le temps, et
un `/loop` ou un wakeup programmé n'est jamais une instruction de push.

Constat du 03/08 qui a motivé cette règle : une consigne se terminait par
« ne pousse pas », suivie plus tard dans la session d'un « deploie » sans
autre précision. Le push a porté sur les commits qui existaient à l'instant
du « deploie » — c'était la bonne lecture, mais la reconstitution après
coup a pris un tour de dialogue pour être vérifiée. Toujours confirmer
`git log origin/master -N --oneline` + `git status -sb` (sortie brute,
pas une reformulation) avant d'affirmer un état de déploiement — voir
aussi la règle de compte-rendu ci-dessous.

## Rendre compte d'un état git : sortie brute + une phrase (03/08)

Quand on demande un état git (poussé/pas poussé, déployé/pas déployé), la
réponse est la sortie brute des commandes (`git log`, `git status -sb`,
`grep` sur le site déployé) suivie d'**une** phrase qui en tire la
conclusion — jamais un paragraphe qui reformule, résume et interprète en
même temps. Un compte-rendu du 03/08 a annoncé « rien poussé », puis
« déployé », puis un paragraphe qui contredisait les deux — la confusion
venait de la rédaction, pas de l'état réel (qui était correct). Ça a coûté
un tour de dialogue à démêler.

## « Zéro consommateur » avant de supprimer un champ (03/08)

Le 02/08, `sourceLabel` a été retiré de `decrement-engine.js` avec la
justification « vérifié par grep sur tout le repo, zéro consommateur ».
Faux : `app-screener.js` le consommait via `score.sourceLabel` (un objet
intermédiaire, pas le nom du champ tel quel). En production depuis ce
commit : chaque ligne de la table Decrement Score affichait
`undefined`. Repéré et corrigé le 03/08 (hotfix `f241a7b`).

Vérification après coup : un grep texte de `sourceLabel` sur l'état
d'avant suppression retrouve bien les trois occurrences, y compris
`score.sourceLabel` — la recherche n'était donc pas aveugle à l'accès
via un objet intermédiaire, contrairement à l'hypothèse la plus
naturelle. La vraie cause : une des trois occurrences était un
identifiant local sans rapport (`app.js`, une variable `sourceLabel`
pour un tout autre usage, "Sources : ..."). Ce bruit a suffi à faire
conclure « zéro consommateur réel » sans que chaque occurrence trouvée
soit vérifiée une par une.

Règle qui en découle : **« zéro consommateur » se prouve en examinant
individuellement chaque occurrence qu'un grep retourne, jamais en
comptant ou en survolant la liste.** Un nom de champ réutilisé ailleurs
pour tout autre chose (variable locale, paramètre, propriété d'un objet
sans rapport) noie le vrai consommateur dans le bruit — la seule
parade est de lire chaque ligne, pas de se fier au nombre de résultats.

## Ce que la passe 8 (§1 et ses correctifs) a appris (05/08)

Quatre habitudes prises pendant cette passe, chacune motivée par un raté
concret rencontré en vérifiant plutôt qu'en supposant l'état du code.

1. **Une largeur de colonne se mesure, elle ne s'estime pas.** Une
   première correction des en-têtes tronqués de Barrières et Decrement
   Score a été faite au jugé (largeur de caractère calculée à la main) —
   insuffisante : la colonne "Coût historique" a été retronquée dans la
   foulée par une largeur reprise trop vite ailleurs. Le calcul correct
   est venu d'une mesure directe dans le navigateur, colonne par colonne,
   sur chaque en-tête, badge et cellule des trois tables
   (`scrollWidth > clientWidth`). C'est cette mesure, pas une estimation,
   qui a aussi révélé que Type/Émetteur/VL débordaient ailleurs —
   invisible à l'œil et au calcul manuel.

2. **Un remplacement par lot se vérifie par un grep large après coup, pas
   seulement avant.** Le correctif du formateur de pourcentages a raté une
   occurrence (`consensus?.status?.consensusPct ?? 0`) parce que le
   remplacement ciblait l'opérateur `|| 0` — `??` est un opérateur
   différent, invisible tant que le grep de vérification reste calé sur le
   motif du remplacement plutôt que rouvert en large (`}%` sans filtre
   d'opérateur) une fois le remplacement fait.

3. **`pctFr` / `formatPctFr` sont le seul chemin pour un pourcentage
   affiché à l'écran — jamais de `.toFixed()` + `"%"` local, même dans un
   champ qui n'a aujourd'hui aucun consommateur.** Un champ « zéro
   consommateur » peut être branché demain ; le formater correctement
   maintenant ne coûte rien et évite de rejouer le même bug de formatage
   à retardement, silencieusement, le jour où quelqu'un le branche.

4. **Cocher une case de checklist exige de vérifier le comportement, pas le
   commit.** Un commit dont le message annonce §6.2 avait bel et bien livré
   §6.1 et une partie de §6.2 — le KPI existait, avec le mauvais
   comportement dans l'état vide. Relire le commit l'aurait coché ; ouvrir
   le tiroir d'un client sans patrimoine l'a démenti. Cette case est restée
   décochée trois jours pour cette raison.

5. **Une passe n'est close que si chacun de ses écrans a été rouvert et
   comparé à la version précédente — pas si un document en amont affirme
   qu'elle est livrée.** Passe 8 a écrit « 7A-7D livrés et déployés » comme
   prérequis, sans que personne ne rouvre 7a et 7b pour vérifier. Les deux
   sont restés au format Passe 6 (ancienne jauge, ancien Top/Flop VL)
   pendant des semaines sous ce prérequis non vérifié, jusqu'à ce que
   l'audit du 05/08 les rouvre un par un et trouve l'écart. Une mention
   « livré » dans un fichier de suivi est une affirmation, pas une preuve ;
   la seule preuve est l'écran ouvert, comparé à ce qu'il devait devenir.

## Ce qu'il ne faut pas faire

- Écrire un nouveau fichier CSS « de correction » par-dessus les autres.
- Répondre à un problème d'alignement par un `transform: translate…` ou une
  marge négative : c'est un symptôme de deux layouts concurrents sur le même
  élément — chercher le doublon et en supprimer un.
- Ajouter un bloc, une métrique ou une carte non demandée. Si une information
  apparaît déjà ailleurs, elle n'est pas dupliquée : une information, un endroit.
