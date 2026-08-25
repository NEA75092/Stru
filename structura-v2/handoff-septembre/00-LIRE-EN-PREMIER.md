# Structura — contrat de travail

Un seul document d'entrée. Si quelque chose contredit ce fichier, c'est ce fichier qui gagne.

## 1. Où vit la vérité

| Sujet | Source de vérité | Personne d'autre ne décide |
|---|---|---|
| Couleurs, rayons, typo | `structura-v2/src/design-tokens.css` **dans le dépôt** | ni la maquette, ni une capture, ni un souvenir |
| Comportement d'un écran | `structura-v2/handoff-septembre/specs/<ecran>.md` **commité** | pas le chat, pas une image |
| Rendu visé | la maquette nommée comme l'écran (`<Ecran>.dc.html`) | une seule par écran, jamais deux |

**Tout chemin s'écrit complet, depuis la racine du dépôt.** Un chemin relatif ne
veut rien dire sans son origine : c'est la panne A7, où tous les messages de lot
disaient `handoff-septembre/specs/…`, qui ne se résout que si on est déjà dans
`structura-v2/`. `check-sources.mjs` refuse désormais les chemins qui mentent.

## 1 bis. Zéro copie — la règle qui remplace six promesses

Les constats A1, A3, A6 et A7 sont **la même panne quatre fois** : le même contenu
vit à deux endroits, et rien ne crie quand les deux divergent. La réponse a
longtemps été une règle de plus (« lire au dépôt », « un seul chemin »). Une règle
sans code de sortie est une promesse, et les promesses ont échoué quatre fois.

| Ancien réflexe | Ce qu'on fait à la place |
|---|---|
| Copier un fichier du dépôt dans l'espace de design pour le consulter | **On le lit au dépôt, au moment où on en a besoin.** Une copie ne peut pas être périmée si elle n'existe pas. |
| Garder une maquette « toute l'app » à côté des maquettes par écran | Une maquette par écran, point. R3. |
| Archiver un document mort dans `archive/` | **On le supprime.** Git garde tout : l'historique EST l'archive. `archive/` le laissait à portée de `grep`, donc à portée d'erreur. |

Seules exceptions autorisées à vivre en double : les **assets binaires** (`assets/*.png`),
qui ne divergent pas silencieusement, et la maquette de référence, qui doit être
commitée pour que l'implémenteur puisse l'ouvrir (A3).

## 2. La boucle, dans cet ordre

1. **Le designer lit `src/design-tokens.css` au dépôt** avant de dessiner. Jamais de mémoire.
2. Il dessine `<Ecran>.dc.html` — un écran, 1400 px minimum, nommé comme l'écran.
3. Il écrit `handoff-septembre/specs/<ecran>.md` : invariants mesurables, règles à supprimer (fichier + sélecteur), et ce qu'il ne faut **pas** toucher.
4. **Il commit et pousse la spec.** Une spec non poussée n'existe pas — Claude Code ne voit que le dépôt.
5. Claude Code lit **la spec seule**, implémente, lance `tools/check-tokens.mjs` puis `tools/calque.mjs`, pousse.
6. Le designer resynchronise (`github.md`), constate, et corrige la spec ou la maquette — pas les deux dans deux sens.

## 3. Ce qui a cassé, et la règle qui l'empêche

| Panne constatée | Règle |
|---|---|
| Spec écrite côté design, jamais commitée → Claude Code ne la trouve pas (07/08) | **R1.** Rien n'est demandé à Claude Code tant que le fichier n'est pas dans le dépôt. |
| Trois semaines dessinées contre des tokens morts (05/08) | **R2.** Lecture de `design-tokens.css` au dépôt avant chaque maquette. |
| « Passe 7 » vs « passe 8 » qui se contredisent | **R3.** Plus de « passe N ». Un écran se remplace, il ne s'empile pas. |
| Maquette et code en désaccord, arbitrage flottant | **R4.** L'arbitrage est écrit dans la spec, daté, avec le perdant nommé. |
| Couleurs inventées dans les maquettes | **R5.** Zéro hex hors couleurs de marque émetteur. Uniquement des tokens de rôle. |
| Corrections « d'amélioration » non demandées | **R6.** Claude Code ne touche que ce que la spec nomme. Le reste est hors périmètre. |

## 4. Ce qu'on ne donne PAS à Claude Code

Une seule spec à la fois. Pas les correctifs d'archive, pas la maquette en pièce jointe, pas
l'historique des passes : deux sources = arbitrage improvisé = divergence.

## 5. Ce qui ne se touche jamais sans décision écrite

- `.pitch-preview-pane`, `.pitch-header-sticky`, `#autopitch-grid`, `html:has(#view-autopitch.active)`
- Les écarts de VL en encre monochrome (la mer signale l'interaction, la terre une barrière — un écart n'est ni l'un ni l'autre)
- Les icônes de navigation du dépôt, reprises verbatim (`rect rx`, `circle`), jamais re-dérivées en `path`
- Le lockup `assets/structura-lockup.png` — jamais redessiné

## 6. Avant tout push

```
node structura-v2/handoff-septembre/tools/check-sources.mjs   # depuis n'importe où dans le dépôt
cd structura-v2 && node handoff-septembre/tools/check-tokens.mjs   # exige structura-v2/
cd structura-v2 && node handoff-septembre/tools/calque.mjs --app <url>
```

Les origines diffèrent : `check-tokens.mjs` et `calque.mjs` se lancent depuis
`structura-v2/`, `check-sources.mjs` trouve la racine tout seul. Tant que les
deux premiers exigent une origine, la commande n'est pas copiable-collable
sans réfléchir — c'est-à-dire sans se tromper. À corriger dans un lot dédié :
ils doivent trouver la racine comme `check-sources.mjs` le fait.

Le `?v=` de toute feuille CSS éditée est bumpé **dans le même commit**.

## 7. Une règle sans sonde n'est pas une règle

État réel des six règles — ce qui est mécanique, et ce qui reste un jugement humain.
Une règle de la colonne « humain » qui casse deux fois doit gagner sa sonde ou sortir
du contrat ; on n'en ajoute pas une septième.

| Règle | Sonde | Ce qu'elle attrape |
|---|---|---|
| R1 — rien hors dépôt | `check-sources.mjs` | chemin cité qui ne se résout pas |
| R2 — tokens lus au dépôt | `check-tokens.mjs` | nom de token inexistant ou non déclaré localement |
| R3 — plus de « passe N » | `check-sources.mjs` + `menage.sh` | document périmé encore présent |
| R4 — arbitrage écrit, perdant nommé | **humain** | rien. C'est un jugement, il s'assume |
| R5 — zéro hex inventé | `check-tokens.mjs` (partiel) | ne voit pas encore un hex littéral hors marque |
| R6 — périmètre | `calque.mjs` | divergence hors des invariants nommés |
