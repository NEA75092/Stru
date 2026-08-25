# La boucle design ↔ code — ce qui a cassé, ce qu'on fait à la place

Écrit le 15/08/2026 après dix jours de lots qui corrigeaient ma dérive au lieu de construire.
Remplace la boucle en 6 étapes de `00-LIRE-EN-PREMIER.md` § 4 (perdant nommé).

## 1. Le diagnostic, et il n'est pas de nous

La panne est documentée comme le mode d'échec type de l'outil : les écrans générés
utilisent des couleurs approximées, des noms de composants inventés et des espacements
qui ne correspondent à aucun token du système réel — et la première session
d'implémentation corrige la dérive au lieu de livrer des fonctionnalités.

C'est mot pour mot notre journal de bord. Preuves dans nos propres fichiers :

| Dérive | Preuve |
| --- | --- |
| Échelle de type inventée | `design-tokens.css` déclare 12/14/16/20/28/40 ; la maquette utilisait 9,5 · 10 · 12,5 · 13,5 · 14,5 · 19 · 21 · 27 · 34 |
| Grille 4 px ignorée | paddings 9, 13, 22, 26, 34, 44 px |
| Rôle de couleur violé | `--mer` posé sur des barres de données, alors que le fichier dit « ne décore rien : ne marque que ce qui est actif, sélectionné ou cliquable » |
| Anatomie inventée | bandeau d'encre, Top/Flop en deux colonnes, listes barrées — aucun équivalent dans l'app, qui a ticker + cartes KPI à filet + tableaux à en-têtes |
| Bloc en doublon | « Marge avant la barrière » et « Top / Flop VL » posaient la même question ; trois passes pour l'entendre |

## 2. Ce qui change

**R-B1 — La maquette n'est pas le livrable de transmission.** Un `.md` de spec par lot,
relu et commité à la main, c'est le travail que l'outil fait déjà. Le paquet de
transmission emporte l'intention, la structure des composants et le contexte de style
vers Claude Code en une instruction, contre le dépôt réel. On l'utilise. Les specs
d'écran deviennent une trace de décisions, pas un mode d'emploi de mise en œuvre.

**R-B2 — Claude Code doit voir ce qu'il produit.** Sans navigateur, l'agent écrit du
HTML/CSS à l'aveugle. Avec un navigateur piloté (Playwright en MCP), il capture,
propose, vérifie, puis modifie. C'est la panne exacte du 15/08 : `calque.mjs` a échoué
trois fois sur `[data-calque]` absent, et le rapport m'est revenu en me demandant de
croire des captures que je ne pouvais pas mesurer. Un agent qui voit ne renvoie pas ça.

**R-B3 — La structure se règle en fil de fer, la peinture vient après.** Le mode fil de
fer existe et coûte moins cher ; c'est le bon mode tant que l'ossature bouge. Nos cinq
passes de raffinement sur une structure fausse sont le contre-exemple : le rendement
décroît vite quand on peaufine ce qui n'est pas encore juste.

**R-B4 — Le retour code → design se fait en captures de l'app vivante.** Le sens
design → code est solide, le retour ne l'est pas : il n'existe pas de canal direct, on
renvoie des captures du rendu réel. **Ce retour marchait déjà** — 261 captures dans
l'espace de design. Je ne les avais pas lues. La panne était de mon côté, pas de
l'outillage.

**R-B5 — Le contexte de code est importé, pas recopié.** Le dépôt est rattaché au projet
de design ; les tokens et les composants existants sont lus là. Aucune copie locale
(déjà R1, maintenant mécanique).

## 3. La boucle, en cinq temps

1. **Cadrer** — une question par écran, à voix haute. « À quoi le CGP répond en trois
   secondes ? » Trois blocs maximum.
2. **Fil de fer** — ossature seule, sur l'anatomie de l'app existante. Validation à l'œil.
3. **Maquette** — un écran, nommé comme l'écran, sur les tokens lus au dépôt. Échelle de
   six crans et grille 4 px vérifiées avant livraison.
4. **Transmission** — paquet vers Claude Code contre le dépôt. Pas de `.md` de lot.
5. **Retour** — captures de l'app vivante déposées ici. **Je les lis avant de redessiner.**

## 4. Ce qu'on garde du contrat actuel

- R2 (tokens lus au dépôt), R3 (une maquette = un écran), R5 (zéro couleur inventée hors
  marque émetteur) : inchangés, ils ont tenu.
- Les arbitrages avec perdant nommé : c'est le seul document de spec qui a servi.
- `check-tokens.mjs` et `check-sources.mjs` : verts, ils restent.
- **À ajouter :** une sonde d'échelle. Refuse toute taille de police hors 12/14/16/20/28/40
  et tout espacement non multiple de 4 dans une maquette. Elle aurait attrapé la dérive
  du 07/08 le jour même.

## 5. Ce que je ne fais plus

- Écrire un `.md` de lot avant d'avoir montré l'écran.
- Peaufiner une composition dont l'ossature n'est pas validée.
- Redessiner sans avoir ouvert les captures de l'app.
- Inventer une anatomie de page quand l'app en a déjà une qui marche.
