# Plan — lot « passe 7 sur toute l'app »

Arrêté le 09/08/2026. Une spec à la fois (§ 4 du contrat). Ordre **non négociable** :
chaque étape dépend de la précédente.

| # | Lot | Spec à donner | Pourquoi ici |
|---|---|---|---|
| 0 | Tokens v2 | `specs/design-tokens-v2.md` | tout le reste est dessiné dessus. Aucun écran retouché dans ce commit |
| 1 | Gabarit de contrôles | `specs/controles.md` | composant partagé : six écrans l'importent ensuite (D8) |
| 2 | Dashboard | `specs/dashboard.md` + `specs/dashboard-correctif-02.md` | l'écran de référence ; la doctrine s'y vérifie en entier |
| 3 | Clients | `specs/clients.md` | tableau, dépend du gabarit |
| 4 | Pitch Engine | `specs/pitch-engine.md` | l'outil qui fait vendre ; ossature existante conservée |
| 5 | Decrement Score | `specs/decrement-score.md` | colonne Avis + tiroir |
| 6 | Portefeuille & Barrières | `specs/portefeuille.md`, `specs/barrieres.md` | même règle graduée que le Dashboard (D2), donc après lui |
| 7 | Doc Reader | `specs/doc-reader.md` | lot court, nettoyage |

Après chaque lot : `check-tokens.mjs`, `calque.mjs <ecran>`, push, puis resync
`github.md` avant de donner la spec suivante. Jamais deux lots en vol.
