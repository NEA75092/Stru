# Constats ouverts — à traiter AVANT la spec Portefeuille

Ce fichier ne contient pas d'idées neuves. Il contient des défauts trouvés en cours de
route, hors périmètre de la passe en cours, qu'il serait plus coûteux de redécouvrir que
de noter. Chaque entrée est datée et nommée par ce qu'elle bloque.

---

## O1 — 06/08 · RÉSOLU en lisant le dépôt. Et il cachait bien pire.

**Ce que je demandais.** La liste des tokens de bord, pour trancher la couleur d'arête
de ma maquette. Demandée à l'implémenteur, donc un aller-retour.

**Ce qui s'est passé.** `src/design-tokens.css` est lisible directement depuis le dépôt.
Je ne l'avais pas ouvert. C9, C10 et O1 ont coûté un aller-retour chacun pour un fichier
que j'avais sous la main — trois allers-retours, zéro ligne changée dans l'app.

**La réponse, en dix secondes de lecture :**

| Token | Valeur résolue |
|---|---|
| `--color-border` (= `--rule`) | `oklch(0.88 0.012 80)` |
| `--color-border-strong` | `oklch(0.731 0.020 117)` |
| `--color-divider` | `oklch(0.925 0.010 82)` — filet de tableau, grille, axe |
| `--lumiere` | `oklch(0.995 0.004 85)` — arête haute, jamais un fond |

Mon `oklch(0.70 0.028 65)` tenait lieu de **deux rôles à la fois** : filet de tableau et
arête de structure. C'est la distinction que `dashboard.md` § 0 avait déjà tranchée pour
`--arete`. Refaite à l'identique, avec un littéral au lieu d'un nom.

**Fait.** Le bloc de tokens du dépôt est désormais dans la maquette (un `.dc.html` est
autonome, sans ce bloc tout `var()` retombe silencieusement). L'axe § 2.1 et le
séparateur § 2.2 passent en `var(--color-divider)`.

---

## O1b — 06/08 · Ma maquette emploie 48 couleurs. Le système en a douze.

**Le fait, mesuré.** 374 occurrences de couleur dans
`Direction Mediterranee v3.dc.html`, 48 valeurs distinctes. Trois groupes :

| Groupe | Couleurs | Occurrences | Ce que c'est |
|---|---|---|---|
| Exactement un token, écrit en littéral | 15 | 106 | `--lumiere` ×45, `--encre` ×32, `--terracotta` ×9… |
| **Presque** un token | 24 | **208** | `oklch(0.55 0.026 235)` ×59 ≈ `--encre-2` ; `oklch(0.84 0.018 70)` ×19 ≈ `--color-border`… |
| Aucun token proche | 9 | 60 | `oklch(0.52 0.11 215)` ×36 (l'accent de la maquette, à la place de `--mer`)… |

**C'est la cause des allers-retours.** Les 208 quasi-tokens sont une réserve inépuisable
de C9 et de C10 : chaque écran spécifié depuis cette maquette en libère une poignée, une
par aller-retour, indéfiniment. Le calque ne peut pas les voir — il compare la maquette à
l'app, et c'est la maquette elle-même qui est hors système.

**Ce qui se décide, en deux morceaux séparés parce qu'ils n'ont pas le même risque :**

1. **Les 106 occurrences exactes** → conversion mécanique en `var(--token)`.
   Aucun changement visuel, la valeur est identique au pixel. Pas un arbitrage.
2. **Les 208 quasi + les 60 orphelines** → une passe de repeinte assumée. Elle
   **change l'aspect** de la maquette : les filets s'éclaircissent (0,70 → 0,925 sur
   l'axe), l'accent passe au vrai `--mer`. C'est une décision de direction visuelle,
   elle se regarde à l'œil, elle ne se fait pas en passant.

**Non tranché.** Le point 2 attend un feu vert. Le point 1 peut se faire sans risque.

**Tant que ce n'est pas fait, aucune spec d'écran neuf.** Portefeuille est un écran de
tableau, donc un écran de filets : l'écrire depuis une maquette hors système, c'est le
05/08 à l'échelle d'un écran neuf.

---

## O2 — 06/08 · § 2.1 et § 2.3 n'ont été mesurés qu'à partir du 06/08 au soir

Leur « zéro divergence » du matin venait de sélecteurs vides
(correctif 01 · C8). Depuis la pose des ancres `data-calque`, les deux sections sont
réellement mesurées et sortent propres. Rien à faire : c'est noté pour que personne ne
cite le rapport du matin comme preuve de quoi que ce soit.

---

## O3 — 06/08 · Le calque ne couvre pas § 2.4

La maquette n'a pas d'ancre `data-calque` sur le gabarit de contrôles. § 2.4 est réputé
conforme sur la foi de la sonde du 06/08, ce qui vaut moins qu'une mesure. À instrumenter
à la prochaine retouche de cette zone, pas avant — un plan qui prétend couvrir ce qu'il
ne couvre pas est pire que rien.


---

## O4 — 09/08 · `calque.mjs controles` n'existe pas, et le message du lot 1 le demandait

**Le fait.** `messages-claude-code.md` demandait `calque.mjs controles`. Le script
n'accepte que `--app <url> [--only <section>]` ; toute autre forme sort en `exit=2`.
Signalé par l'implémenteur avant de commencer le lot, pas découvert après.

**Ce que ça révèle, et qui est pire que la faute de frappe.** Le gabarit de contrôles
est le § 2.4 du plan de calque — exactement celui que O3 déclare non instrumenté faute
d'ancre `data-calque` dans la maquette. Le message inventait donc une preuve pour la
seule zone que l'outil ne sait pas mesurer.

**Tranché.** Le § 5 de `controles.md` passe en sonde manuelle nommée, et le message du
lot ne cite plus `calque.mjs` pour ce composant. L'instrumentation du § 2.4 reste due
au moment où cette zone sera retouchée en maquette (O3), pas avant.
