# spec — Decrement Score

Version 1 · 09/08/2026 · doctrine : `specs/00-doctrine.md`

---

## 1. Un avis, pas une note

Un CGP ne vend pas « 75/100 », il vend un avis. Le score reste **calculé**, mais il
n'est plus la colonne : la liste porte une pastille d'avis, le chiffre n'apparaît que
dans la fiche du sous-jacent, au clic.

| Avis | Plage | Remplissage de pastille |
|---|---|---|
| Recommandé | 85 – 100 | `--color-safe` 20 % + trame (D3), texte `--color-safe-2` |
| Acceptable | 70 – 84 | `--color-accent` 20 %, texte `--color-accent` |
| À justifier | 50 – 69 | `--color-watch` 20 % + trame, texte `--encre` (D7 : ocre interdit sous 24 px) |
| À éviter | 0 – 49 | `--color-breach` 20 % + trame, texte `--color-breach-2` |

## 2. Le tiroir du sous-jacent

En-tête, trois chiffres clés, les composantes en jauges (D1), **une seule** zone de
prose — celle que le CGP recopie dans son pitch.

| Invariant | Valeur |
|---|---|
| Trois KPI | `grid: repeat(3, 1fr)`, séparés par 1 px `--color-divider` |
| Valeur de KPI | `--font-mono-data` `22px`, `tabular-nums` |
| Les quatre questions | `grid: 1fr 132px`, `gap 16px`, jauge D1 par ligne |
| Verdict par ligne | `10.5px`, `--encre-2` |
| Zone « Lecture CGP » | fond `--color-surface-2`, inset 1 px, `13px`, `line-height 1.62` |

Les quatre questions sont **fixes** et formulées en français courant :
couverture du décrément par le dividende, performance sacrifiée par an, comportement
en forte baisse, comportement en stagnation sur 5 ans.

## 3. Règles à supprimer

| Fichier | Sélecteur | Action |
|---|---|---|
| `src/views.css` | colonne « Score » chiffrée de la liste | remplacer par la colonne « Avis » |
| `src/views.css` | tiroir en texte brut sans hiérarchie | remplacer par § 2 |

## 4. Preuve de fin

Un sous-jacent de chaque avis rendu ; le chiffre du score est **absent** de la liste et
**présent** dans le tiroir.
