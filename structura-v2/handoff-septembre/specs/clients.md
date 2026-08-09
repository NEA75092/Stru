# spec — Clients

Version 1 · 09/08/2026 · doctrine : `specs/00-doctrine.md`
Dépend de : `specs/controles.md` (poussé avant).

---

## 1. Un tableau, pas des cartes

Cinq colonnes qui se lisent d'un coup d'œil, plus une alerte **seulement quand il y en
a une**. Le profil de risque, les produits détenus et l'historique de pitch vivent dans
la fiche client, pas dans la liste.

| Invariant | Valeur |
|---|---|
| `grid-template-columns` | `minmax(0,1fr) 150px 110px 120px 180px 36px` |
| `gap` | `20px` |
| `padding` de ligne | `15px 26px` |
| En-tête | `13px 26px`, mono `9.5px`, `--encre-2` (D7), capitales |
| Séparateur de ligne | 1 px `--color-divider` |
| Nom client | **complet**, `14px`, une ligne ; référence + enveloppe en 2ᵉ ligne `11px` |
| Encours / Performance / Produits | `--font-mono-data`, alignés à droite, `tabular-nums` |
| Performance | encre monochrome (D4), points d'écart |
| Colonne 5 | intitulée « Remarque » |
| Alerte | pastille, aplat + trame `--color-breach` (D3), texte `--color-breach-2` |
| Chevron | `--color-text-tertiary`, colonne `36px` |
| Tri | par en-tête, sur les quatre colonnes chiffrées |

## 2. Règles à supprimer

| Fichier | Sélecteur | Action |
|---|---|---|
| `src/views.css` | cartes clients (grille de vignettes) | supprimer, remplacer par le tableau |
| `src/modules/app-clients.js` | troncature du nom client | supprimer — nom complet |
| `src/modules/app-clients.js` | colonnes « profil de risque » et « produits détenus » en liste | déplacer en fiche client |

## 3. Preuve de fin

Un client sans alerte et un client avec alerte rendus côte à côte ; la colonne
« Remarque » est **vide** (pas un tiret, pas une pastille grise) pour le premier.
