# Protocole de travail — Structura

Version 1 · 11/08/2026 · **remplace la section « boucle de travail » de `00-LIRE-EN-PREMIER.md`**.
Ce fichier gouverne *comment* on travaille. `00-LIRE-EN-PREMIER.md` gouverne *où vit la vérité*.

Écrit après deux semaines d'allers-retours. Le diagnostic est simple et il n'est pas
technique : **chacun des trois intervenants a travaillé sur un état différent du projet.**
Le designer lisait un dossier local, Claude lisait le dépôt poussé, Claude Code éditait
l'arbre de travail. Trois vérités, aucune sonde. Tout le reste en découle.

---

## 1. Les trois rôles, et ce que chacun n'a pas le droit de faire

| Rôle | Décide | N'a pas le droit de |
|---|---|---|
| **Toi** (designer / product) | l'arbitrage final, le périmètre, ce qui est beau | — |
| **Claude** (design) | la maquette, la spec, les valeurs | **écrire dans le dépôt** ; demander une vérification qu'il pouvait faire lui-même |
| **Claude Code** (implémentation) | le code | **inventer une valeur absente de la spec** ; élargir le périmètre du lot |

Une règle par rôle, une seule :

- **Claude vérifie avant d'envoyer.** Tout lot part avec ses valeurs déjà relevées à la
  source. Si Claude doit demander « peux-tu lancer ceci pour voir », le lot n'est pas prêt.
- **Claude Code ne devine jamais.** Valeur manquante, token inexistant, donnée absente du
  modèle : il laisse en l'état et le nomme dans son rapport. Un renvoi faux coûte plus
  cher qu'un trou.
- **Toi, tu ne relaies pas.** Si un message te sert seulement à transporter une question
  d'un côté à l'autre, le protocole a échoué : c'est un aller-retour, et il compte.

## 2. L'unité de travail : le lot

Un lot = **un écran ou un sujet, un commit, un rapport**. Jamais une ligne.

Un lot est recevable seulement s'il contient les cinq :

1. **le rendu cible**, cité par son chemin complet depuis la racine du dépôt ;
2. **les valeurs exactes** — relevées dans la maquette, pas décrites en prose ;
3. **le périmètre négatif** : ce à quoi on ne touche pas, nommé ;
4. **les sondes à passer** avant commit ;
5. **le format du rapport** attendu.

Un lot qui échoue deux fois de suite n'est pas re-corrigé une troisième : **on jette
l'outil ou l'approche.** C'est la leçon de `check-sources` — neuf allers-retours pour
un contrôle qui n'a jamais trouvé qu'une seule vraie erreur.

## 3. Avant chaque lot : la synchronisation, en deux commandes

La panne d'origine, celle qui a coûté deux semaines. Elle se ferme mécaniquement :

```
git status --porcelain      # doit être VIDE
git log --oneline -1        # le sha que Claude doit lire
```

**Tant que `git status` n'est pas vide, aucun lot ne part.** Une modification non
commitée signifie que Claude lit un fichier différent de celui que Claude Code va
éditer — c'est-à-dire une spec écrite sur le mauvais état.

Tu colles ces deux sorties en tête de conversation. Claude lit à ce sha, jamais ailleurs.

## 4. Après chaque lot : la vérification croisée

**Celui qui a fait le travail ne le valide pas.** Trois contrôles, dans cet ordre :

| Qui | Vérifie quoi | Comment |
|---|---|---|
| Claude Code | que le code fait ce que la spec dit | sondes + son propre rapport |
| Claude | que le rendu ressemble à la maquette | il lit le diff au dépôt après ton push |
| Toi | que ça sert le CGP | tu regardes l'écran, pas le code |

Les sondes, depuis leur bonne origine :

```
cd structura-v2 && node handoff-septembre/tools/check-tokens.mjs
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Un rapport de lot dit toujours, bloc par bloc : **fait / partiel / non fait**, et pour
tout « partiel » la raison précise. Un rapport sans « partiel » ni « non fait » sur un
lot de cinq blocs est suspect, pas rassurant.

## 5. L'arbitrage : la solution la plus rationnelle gagne

Quand deux sources se contredisent, on ne choisit pas la plus récente ni la plus
autoritaire. On **compte les sources concordantes** :

> Le 11/08, `.barrier-mark` était en mer dans le code, en encre dans la doctrine (D1) et
> en encre dans la maquette (l. 379/402/425). Deux contre un : le code avait tort.
> Corrigé en un lot, sans discussion.

Si le compte est 1–1, tu tranches, et **l'arbitrage s'écrit avec le perdant nommé** —
sinon il revient dans trois jours. Un arbitrage écrit ne se rediscute pas.

## 6. Ce qu'on copie aux meilleurs

Références retenues : **Orizen / FUTR**, **Evooq / Elus**, **Column**.
Ce qui est transposable, et rien d'autre :

- **La densité assumée.** Le Portfolio Monitor de FUTR met sur un écran : total par
  devise, allocation d'actifs, exposition devises, exposition émetteurs en %, GICS,
  prochains événements par produit, et un tableau de 16 positions paginé. Aucune
  illustration. Notre Dashboard est deux fois moins dense — c'est notre retard, pas notre
  sobriété.
- **La distance à la barrière comme donnée première.** FUTR affiche, par sous-jacent :
  strike, cours, PROT / CPN / AC, et `Distance +20,95 %` avec un `Exp. Status`. C'est
  exactement notre sujet, montré plus finement que chez nous.
- **« Alerté seulement quand il faut agir »** (Evooq). Notre écran doit répondre à « que
  dois-je faire aujourd'hui », pas « voici tout ce que je sais ».
- **La donnée brute comme visuel** (Column affiche ses payloads JSON en pleine page).
  Un tableau juste, dense et bien composé est plus crédible qu'un graphique décoratif.
- **Ce qu'aucun des trois ne fait**, et qu'on ne fera donc pas : ombre portée, dégradé de
  fond, icône décorative, carte arrondie à filet coloré.

## 7. Les six règles du contrat, et leur état

Une règle sans sonde est une promesse. Les promesses ont échoué six fois.

| Règle | Sonde | Reste humain |
|---|---|---|
| R1 — rien hors dépôt | `check-sources.mjs` | — |
| R2 — tokens lus au dépôt | `check-tokens.mjs` | — |
| R3 — plus de « passe N » | `check-sources.mjs` | — |
| R4 — arbitrage écrit, perdant nommé | — | oui (§ 5) |
| R5 — zéro hex inventé | `check-tokens.mjs` (partiel) | hex littéral hors marque |
| R6 — périmètre | `calque.mjs` | oui |

Une sonde qui crie pour rien est pire que pas de sonde : elle fait réécrire des lignes
justes, puis on cesse de la lancer. **Toute sonde neuve se cale sur le corpus existant
avant d'être imposée.**

## 8. Les invariants transversaux — ce qui ne se décide jamais dans un lot d'écran

On travaille par écran. Mais un CGP ne vit pas dans un écran : il passe d'un onglet à
l'autre en une seconde, et **toute différence qu'il remarque entre deux onglets est un
bug, même si chaque onglet est juste séparément.**

D'où la règle : **la liste ci-dessous ne se modifie pas dans un lot d'écran.** Un lot qui
a besoin de changer un invariant s'arrête et devient un lot transversal, qui touche tous
les écrans concernés en une fois.

| Invariant | Où il vit | Écrans qui en dépendent |
|---|---|---|
| Ossature : barre latérale 236px, nav 42px/ligne, filet `inset -1px 0 0 --color-border` | `shell.css` | tous |
| En-tête d'écran : date en mono 10,5px, titre `--font-heading` 52px/200 | `views.css` | tous |
| La règle de barrière (rainure, encoche PDI, curseur, zone franchie) | `app-utils.js` + `relief.css` | Dashboard, Barrières, Portefeuille, tiroir |
| Sémantique des couleurs : mer = sélectionné/actionnable, terre = barrière, encre = tout le reste | `CLAUDE.md` + `00-doctrine.md` | tous |
| Formats de nombres : `moneyShort`, `pctFr`, `ptsFr` | `app-utils.js` | tous |
| Seuils de statut | `statusFromDist` (`app-state.js`) | Dashboard, Barrières, Pilotage, Calendrier |
| Couleurs de marque émetteur (seuls hex autorisés, R5) | à créer, un seul endroit | Dashboard, Pilotage |
| Le tiroir produit (`openDrawer`) | `overlays.css` | tous les écrans qui listent des produits |
| Pas d'ombre portée, rayon 2 px | `00-doctrine.md` D6 | tous |

**Divergence ouverte, constatée le 11/08 — à trancher en lot transversal, pas dans un
lot d'écran :** le Dashboard classe le risque à `0 / 10 %` (`riskZoneFor`,
`app-dashboard.js`), Pilotage à `0 / 5 / 15 %` (`statusFromDist`, `app-state.js`). Le
code documente cette différence comme volontaire — trois zones pour la lecture rapide,
cinq statuts pour l'analyse. C'est défendable, mais alors **les libellés doivent
différer aussi** : « à surveiller » ne peut pas désigner deux populations différentes
d'un onglet à l'autre. Soit les seuils s'alignent, soit le Dashboard renomme ses zones.

**Les couleurs de marque émetteur n'existent aujourd'hui nulle part comme source
unique.** Le premier lot qui en a besoin (Dashboard § 5) les crée dans **un seul**
fichier, que Pilotage réutilisera — jamais une seconde table.
