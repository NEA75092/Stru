# Structura — contrat de travail

Un seul document d'entrée. Si quelque chose contredit ce fichier, c'est ce fichier qui gagne.

## 1. Où vit la vérité

| Sujet | Source de vérité | Personne d'autre ne décide |
|---|---|---|
| Couleurs, rayons, typo | `src/design-tokens.css` **dans le dépôt** | ni la maquette, ni une capture, ni un souvenir |
| Comportement d'un écran | `handoff-septembre/specs/<ecran>.md` **commité** | pas le chat, pas une image |
| Rendu visé | la maquette nommée comme l'écran (`<Ecran>.dc.html`) | une seule par écran, jamais deux |

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

Les origines diffèrent : check-tokens.mjs et calque.mjs se lancent depuis
structura-v2/, check-sources.mjs trouve la racine tout seul. Tant que les
deux premiers exigent une origine, la commande n'est pas copiable-collable
sans réfléchir — c'est-à-dire sans se tromper. À corriger dans un lot
dédié : ils doivent trouver la racine comme check-sources.mjs le fait.

Le `?v=` de toute feuille CSS éditée est bumpé **dans le même commit**.
