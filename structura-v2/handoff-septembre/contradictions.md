# Contradictions relevées dans le code — 06/08/2026 (soir)

Relevé en lisant `design-tokens.css`, `tables.css`, `app-portfolio.js`,
`app-navigation.js` et `index.html` à `9220bc1`. Rien n'est corrigé ici :
une contradiction de doctrine s'arbitre, elle ne se patche pas en passant (R6).

Chaque entrée dit **qui contredit quoi**, et **ce que je propose**. Les entrées
marquées « à mesurer » ne sont pas des constats : je ne les ai pas vérifiées au
navigateur et je ne veux pas les affirmer.

---

## K1 — La terre sert à autre chose qu'une barrière, dans trois endroits

**La règle.** `design-tokens.css`, bloc « La terre porte le risque » :

> « Seule couleur qui exprime une distance de barrière. Ne sert **jamais** de couleur
> de marque ni de décoration. »

**Ce qui la contredit**, dans `tables.css` :

```css
/* Alias génériques (vue Decrement Score, badge de nav) — même palette,
   nom neutre pour un contexte qui n'est pas un statut de barrière. */
.st-ok  { color: var(--color-safe); }
.st-bad { color: var(--color-breach); }

.cell-warn { color: var(--color-watch); }
```

`.cell-warn` est employé en vrai : `formatIssuerVl()` rend
`<span class="cell-warn">À récupérer</span>`. Une VL non récupérée est une **tâche de
collecte**, pas une distance de barrière. Le commentaire du fichier reconnaît lui-même
l'entorse — « un contexte qui n'est pas un statut de barrière » — et la commet quand même.

**Ce que je propose.** `.cell-warn` passe en `--color-text-secondary` : le libellé
« À récupérer » dit déjà ce qu'il est. `.st-ok`/`.st-bad` sont supprimés au profit du
même traitement neutre, **sauf** dans le Decrement Score où l'avis est un jugement de
risque assumé et garde ses quatre pastilles.

C'est le même arbitrage que § 2.2 pour les écarts de VL, et que celui que je me suis
appliqué ce soir sur le bandeau d'indices, où j'avais commis exactement cette faute.

---

## K2 — Deux mécanismes différents pour le même filet gauche

Dans `tables.css` :

```css
.tbl-wrap tbody tr.selected     { border-left: 3px solid var(--color-accent); }
.row-breach td:first-child      { box-shadow: inset 3px 0 0 var(--color-breach); }
.tbl-wrap tbody tr:hover td:first-child { box-shadow: inset 2px 0 0 var(--color-accent); }
```

Même intention visuelle, trois fois, dont une par un moyen différent. Un `border-left`
sur un `<tr>` **occupe de la place** ; un `inset box-shadow` se peint par-dessus. Dans
une table en `table-layout: fixed` et `border-collapse: collapse`, la ligne sélectionnée
décale donc son contenu de 3 px là où la ligne franchie ne décale rien.

**À mesurer** : sélectionner une ligne et comparer le `getBoundingClientRect().left` de
sa première cellule avec celui d'une ligne voisine. Si l'écart est de 3 px, c'est un
défaut ; s'il est nul, `border-collapse` l'absorbe et il n'y a qu'une incohérence
d'écriture.

**Ce que je propose si l'écart existe.** `.selected` passe elle aussi en
`box-shadow: inset 3px 0 0` — un seul mécanisme pour un seul geste.

---

## K3 — Deux largeurs minimales concurrentes sur la même table

```css
.tbl-wrap table { min-width: 1400px; }   /* règle partagée */
#pf-table       { min-width: 1470px; }
#bar-table      { min-width: 1455px; }
```

Les deux tables principales écrasent la valeur partagée, qui ne s'applique donc qu'à la
table produits de la vue Clients. Ce n'est pas un bug — c'est un chiffre qui a l'air de
gouverner trois tableaux alors qu'il n'en gouverne qu'un, et le prochain qui le lira
croira que 1400 fait foi.

**Ce que je propose.** Déplacer `min-width: 1400px` sur le sélecteur de la table Clients,
et laisser `.tbl-wrap table` sans largeur minimale. Aucun rendu ne change ; ce qui change,
c'est qu'on ne peut plus se tromper en lisant.

---

## K4 — Une règle que le fichier s'impose et enfreint

`tables.css`, en tête :

> « Zéro couleur littérale — uniquement `var(--color-*)`. »

Puis, plus bas :

```css
.bar-track { background: var(--chaux-2); }
```

`--chaux-2` est un token de **rôle brut**, pas un token de consommation `--color-*`.
Ce n'est pas une couleur littérale au sens strict, donc la faute est mineure — mais la
piste d'une jauge est un fond retiré, et le système a exactement ce token :
`--color-surface-sunk`.

**Ce que je propose.** `.bar-track { background: var(--color-surface-sunk); }`.
À vérifier à l'œil : les deux valeurs sont proches mais pas identiques.

---

## K5 — Une fonction exportée qui ne fait rien

`app-portfolio.js` :

```js
function toggleCompact() {}
```

Exportée dans le `return`, donc exposée globalement. Soit un appelant existe encore
quelque part et il croit changer la densité, soit plus personne ne l'appelle.

**À mesurer** : `grep -rn "toggleCompact" src/ index.html`. Zéro appelant → suppression.
Un appelant → ce n'est plus une contradiction de code mais une fonctionnalité muette,
et c'est une autre discussion.

---

## Ce que je n'ai pas relevé

Je n'ai lu que cinq fichiers. `views.css`, `overlays.css`, `shell.css`, `controls.css`,
`relief.css`, `passe7.css` et les douze autres modules ne sont pas passés. Ce fichier
n'est pas un audit : c'est ce qui m'a sauté aux yeux en cherchant autre chose.

Un vrai audit se demande explicitement — et il se fait fichier par fichier, pas de mémoire.
