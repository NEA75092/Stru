# PASSE 4 — Suppression des feuilles héritées et migration des vues

**État à l'entrée :** passes 1 à 3 poussées, `npm test` vert, commit `c5d02ec`.

**Le constat qui déclenche cette passe.** Le client a passé en revue l'app
livrée après la passe 3. Portefeuille, barrières, clients, calendrier, pitch
engine et decrement score sont jugés inutilisables. Ce n'est pas un désaccord
de goût : **ces vues n'ont jamais été migrées.** Elles sont encore peintes par
`styles.css` (83 Ko) et `institutional-theme.css` (74 Ko), les deux fichiers
que l'audit du 25/07 devait supprimer. Aucune décision de direction artistique
validée depuis le 24/07 ne s'y applique.

**La règle qui gouverne cette passe :** on commence par **supprimer**, pas par
corriger. Tant que les deux feuilles héritées sont là, chaque correction se
fait contre une dizaine de règles concurrentes — c'est exactement le mécanisme
qui a produit trois livraisons perçues comme « sans changement visible ».

Ne pas traiter les symptômes un par un. Les quatre défauts ci-dessous ont deux
causes, pas huit.

---

## Les quatre défauts, et leur cause réelle

### 1. Les mots se chevauchent dans la colonne Émetteur

Trois règles contradictoires s'appliquent à la même cellule, dans le même
fichier. Celle qui gagne dépend de l'ordre des lignes.

```
institutional-theme.css
l.1383   overflow-wrap: anywhere !important;
l.1411   white-space: nowrap !important;
l.1667   overflow-wrap: normal !important;
l.2322   white-space: nowrap !important;
```

### 2. La colonne VL a disparu

Le `<th>` VL **est bien présent** dans `index.html` (portefeuille l.331,
barrières l.405). Ce n'est pas un problème de markup. Le tableau est en
`table-layout: fixed` mais seules 5 colonnes sur 13 ont une largeur déclarée :
les 8 autres se partagent le reste, et quand il ne reste rien elles tombent à
zéro pixel.

```
institutional-theme.css
l.1096   table-layout: fixed;
l.1797   #view-portfolio td:nth-child(3)  { width: 13%; }
l.1799   #view-portfolio td:nth-child(4)  { width: 11%; }
l.1801   #view-portfolio td:nth-child(8)  { width: 9%;  }
l.1803   #view-portfolio td:nth-child(9)  { width: 10%; }
l.1805   #view-portfolio td:nth-child(10) { width: 11%; }
```

Pour mémoire, `#view-portfolio thead th` est déclaré **13 fois** dans ce seul
fichier, dont plusieurs avec un `:nth-child(n)` sans effet de sélection —
uniquement pour gagner en spécificité contre les autres déclarations du même
fichier.

### 3. Les valeurs et les graphiques sont invisibles en thème sombre

`:root[data-theme="dark"]` ne redéfinit que la couleur **de base** de chaque
paire, jamais sa variante foncée. Tout ce qui consomme un « -2 » garde donc une
valeur de thème clair sur un fond `#14110b`.

| Token | Valeur (les deux thèmes) | Redéfini en sombre |
| --- | --- | --- |
| `--color-aegean-2` | `#0d3f6b` | ❌ |
| `--color-aegean-deep-1` | `#0d3f6b` | ❌ |
| `--color-aegean-deep-2` | `#0a2f52` | ❌ |
| `--color-coral-2` / `--color-coral-deep` | `#c1522f` | ❌ |
| `--color-ocean` | `#146e9c` | ❌ |
| `--color-ocean-2` | `#0f5878` | ❌ |
| `--color-success-2` | `#226b46` | ❌ |
| `--color-warning-2` | `#b87330` | ❌ |
| `--color-danger-2` | `#a03a2f` | ❌ |
| `--color-ink-on-coral` | `#2a1409` | ❌ |

C'est la cause unique du graphique de performance invisible, des valorisations
illisibles et des dégradés qui virent au noir. Les alias hérités
(`--sea-light`, `--blue2`, `--red2`, `--orange2`, `--green2`, `--olive`,
`--gold2`, `--terracotta`) pointent tous vers ces tokens et propagent le
problème dans les vues non migrées.

### 4. Les montants sont colorés en corail

```
app-portfolio.js  l.414 et l.498
<td class="num" style="color:var(--gold);">${formatIssuerVl(p)}</td>

app-screener.js   l.101
<td class="num" style="color:var(--gold);font-weight:700;">
```

`--gold` est un alias mort maintenu en vie par le bloc de pont de
`design-tokens.css`. Il résout vers le corail. Cela viole **deux** règles
validées à la fois :

- règle CLAUDE.md : « Un montant n'est jamais coloré. »
- sémantique validée : le corail est réservé au bloc d'alerte, deux apparitions
  par écran maximum. Ici il est sur chaque ligne de chaque tableau.

`app-portfolio.js:500` pose de la même façon la couleur de statut en JS via
`ST_COLOR`, qui référence `--red` / `--orange` / `--green` / `--text3` — tous
des alias hérités.

**Pourquoi le test ne l'a pas vu :** le test 6 ne lit que `index.html`, et le
test 5 ne scanne que les `.css` plus `index.html`. Aucun test ne regarde
`src/modules/*.js`. C'est le trou à fermer (section G).

---

## A. Supprimer les feuilles héritées

1. Supprimer `src/styles.css` et `src/institutional-theme.css`, ainsi que leurs
   `<link>` dans `index.html`.
2. Supprimer le bloc **ALIAS LEGACY** de `design-tokens.css` (le `:root` qui
   mappe `--bg`, `--gold`, `--sea`, `--red`, `--text2`… vers les tokens neufs).
   Il n'existait que pour maintenir ces deux feuilles en vie.
3. Le reste de la passe consiste à réécrire ce qu'elles peignaient, vue par
   vue, dans des fichiers neufs.

Ne pas conserver un fichier « de compatibilité » pendant la transition : c'est
la manœuvre qui a créé la situation actuelle.

## B. Compléter le thème sombre

Dans `:root[data-theme="dark"]` de `design-tokens.css`, ajouter une valeur pour
**chacun** des dix tokens du tableau du défaut 3. Principe : la variante « -2 »
d'une couleur doit rester distinguable de sa base **et** lisible sur
`--color-bg`. En clair la « -2 » est plus foncée que la base ; en sombre elle
doit être **plus claire**, pas plus foncée.

Valeurs de départ (à ajuster au contraste réel, minimum 4.5:1 sur
`--color-bg` pour tout ce qui porte du texte) :

```css
:root[data-theme="dark"] {
    --color-aegean-2: #7fb8e8;
    --color-aegean-deep-1: #2f6f9f;
    --color-aegean-deep-2: #235572;
    --color-coral-2: #f0a98d;
    --color-coral-deep: #f0a98d;
    --color-ocean: #4fa3c8;
    --color-ocean-2: #7ec0dd;
    --color-success-2: #78c99b;
    --color-warning-2: #edbb84;
    --color-danger-2: #ea8b7e;
    --color-ink-on-coral: #2a1409;
}
```

Vérification obligatoire : basculer en sombre et contrôler le graphique de
performance du dashboard, les valorisations du portefeuille et les jauges de
barrière. C'est là que le défaut se voyait.

## C. Le système de tableau

Un seul fichier `src/tables.css`, partagé par portefeuille, barrières et le
tableau produits de la vue clients. Voir la maquette de référence, section 4a.

**Largeurs.** Une largeur par colonne, déclarée **une seule fois**, sur la
rangée d'en-tête. Avec `table-layout: fixed`, cette rangée gouverne tout le
tableau : aucune largeur sur les cellules du corps, aucune règle `nth-child`.
Les pourcentages somment à 100.

Portefeuille (13 colonnes) :

| Colonne | % | Colonne | % |
| --- | --- | --- | --- |
| Produit | 16 | P&L % | 6 |
| Type | 7 | Coupon/an | 6 |
| Émetteur | 10 | Distance protection | 9,5 |
| Nominal | 7,5 | Maturité | 5 |
| VL | 6 | Proch. évt. | 5 |
| Valorisation | 8 | Statut | 7 |
| P&L | 7 | | |

Le tableau porte `min-width: 1400px` dans un conteneur `overflow-x: auto` : en
dessous il défile, il n'écrase pas ses colonnes.

**Débordement — une seule règle, sans exception.** Chaque cellule tient sur une
ligne : `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.
Aucun `overflow-wrap`, nulle part. La cellule Émetteur porte un attribut
`title` avec le nom complet.

**Colonne Produit.** Nom du produit en 12,5 px semi-gras, ISIN en dessous en
`--font-mono-data` 10 px `--color-text-tertiary`. Cela libère la largeur d'une
colonne entière sans rien perdre.

**Montants.** VL, Nominal, Valorisation : `--font-mono-data`, `--color-ink`,
alignés à droite, `font-variant-numeric: tabular-nums`. **Aucune couleur.**
Supprimer les `style="color:var(--gold)"` de `app-portfolio.js:414` et `:498`
et de `app-screener.js:101`.

Seuls P&L, P&L % et Distance portent une couleur, parce que leur signe est
l'information : `--color-success` / `--color-danger` / `--color-text-tertiary`
pour un zéro ou une absence.

**Statut en pastille.** Point coloré 6 px + libellé, sur un fond teinté à faible
opacité, `border-radius: var(--radius-full)`. La couleur ne porte jamais
l'information seule : le mot la double. La couleur passe par une **classe**
(`.st-breach`, `.st-crit`, `.st-warn`, `.st-safe`, `.st-none`, `.st-unknown`),
plus par `ST_COLOR` en JS. Réduire `ST_COLOR` à un mappage vers ces noms de
classe.

**Distance protection — trois cas, trois traitements.** C'est le point que le
client a explicitement demandé de régler. Ne jamais laisser la cellule vide.

| Cas | Affichage | Traitement |
| --- | --- | --- |
| Barrière suivie | `−11,7 %` + jauge | Couleur du statut, jauge remplie à la proportion réelle |
| Produit **sans** barrière (capital garanti) | `—` + mention « sans barrière » | Gris `--color-text-tertiary`, jauge vide. Ce n'est pas un trou : c'est une information sur le produit. Statut « Garanti » |
| Donnée **manquante** | « À confirmer » + « donnée manquante » | Ambre `--color-warning`, jauge vide. C'est une tâche, pas un état du produit — et cela doit se distinguer visuellement du cas précédent |

La distinction se fait sur le type de produit, pas sur la nullité de `p.dist` :
un `CG` (capital garanti) n'a structurellement pas de barrière ; un `AC` sans
distance a une donnée absente.

**Colonnes à ajouter à la vue Barrières** (demande client) : `TYPE` et
`ÉMETTEUR`, en 2ᵉ et 3ᵉ position, mêmes règles que le portefeuille. Le `<th>`
et le `<td>` correspondants sont à ajouter en même temps — vérifier que le
`colspan` de l'état vide (`app-portfolio.js:468`, actuellement `10`) suit.

## D. Les KPI de la vue Barrières

Aujourd'hui : quatre chiffres nus, aucun relief, aucune hiérarchie. La passe 3
a livré les ombres teintées et les liserés — ils ne sont câblés que sur le
dashboard. Les appliquer ici. Voir maquette section 4b.

- Grille `grid-template-rows: 14px 1fr 44px` sur les quatre cartes : les
  chiffres partagent alors exactement la même ligne de base, quelle que soit la
  longueur du libellé ou du sous-titre. C'est la condition pour qu'ils soient
  comparables — l'alignement, pas la couleur.
- Libellés sur **une** ligne. Déplacer la précision du seuil dans le
  sous-titre : « Alerte critique » + « Sous 5 % du seuil · prochaine obs.
  04.08 », pas « Alerte critique < 5 % » qui passe à la ligne.
- Une barre de proportion sous chaque chiffre : la part du portefeuille. Six
  barrières franchies sur 54 produits, c'est 11 % — l'information est là, pas
  dans le « 6 ».
- **Deux** cartes teintées sur quatre, pas quatre : corail sur « Barrières
  franchies », bleu sur « Zone saine ». Les deux du milieu gardent
  `--shadow-card` neutre. Si les quatre sont teintées, aucune ne ressort.

## E. Accueil et actions requises (dashboard)

Voir maquette section 4c.

- Le bandeau d'accueil est un bloc **bleu plein** (`--color-aegean` →
  `--color-aegean-deep-1`, 135°), l'un des deux blocs de couleur autorisés par
  écran. Il porte : la date et la date de VL en mono capitales, « Bonsoir
  Marie » en 30 px, **une** phrase qui nomme la décision du jour, et deux
  totaux à droite. Pas de carte grise avec un « Bonjour » centré.
- Actions requises : une ligne par action, en grille
  `3px minmax(0,1fr) auto`. Le filet vertical coloré de 3 px tient sur toute la
  hauteur de la ligne et remplace la pastille — il se lit en balayant la
  colonne. Titre + motif en mono à droite du titre, contexte en dessous,
  montant en mono aligné à droite.
- À supprimer : les émojis de statut (`ico: "🔴"` / `"🟡"` / `"✅"` produits par
  `buildPortfolioAlerts()`), les fonds pleins corail par ligne, et le compteur
  en gros caractères.

## F. Le graphique de performance

- Les tracés SVG utilisent `--color-aegean-2` : ils redeviennent visibles dès la
  section B. Vérifier après.
- Le carré de couleur de la performance YTD est à remplacer par la même pastille
  que les statuts (point + valeur), et non un aplat.
- « Encours initial », « Valorisation » et « Performance YTD » sont trois
  valeurs de même rang : même taille, même graisse, même famille
  (`--font-mono-data`), alignées sur la même ligne de base. Aujourd'hui elles
  diffèrent — c'est ce que le client a relevé.

## G. Fermer le trou dans le test

Ajouter à `tests/css-hygiene.test.js` :

```js
/* ── 11. La couleur ne s'écrit pas dans le JS ──────────────
   Le test 6 ne regardait qu'index.html : les modules ont continué
   à poser des couleurs en attribut style pendant trois passes. */
test("aucun module ne pose de couleur en attribut style", () => {
  const dir = path.join(SRC, "modules");
  const offenders = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".js"))) {
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    const hits = src.match(/style="[^"]*(?:color|background)\s*:/gi) || [];
    if (hits.length) offenders.push(`${f} (${hits.length}x) — ex. ${hits[0]}`);
  }
  assert.equal(
    offenders.length,
    0,
    `couleur posée en JS — passer par une classe :\n  ${offenders.join("\n  ")}`,
  );
});

/* ── 12. Chaque token de couleur existe dans les deux thèmes ── */
test("aucun token de couleur n'est absent du thème sombre", () => {
  const css = read("design-tokens.css");
  const light = css.slice(css.indexOf(":root"), css.indexOf('[data-theme="dark"]'));
  const dark = css.slice(css.indexOf('[data-theme="dark"]'));
  const names = (s) => new Set((s.match(/--color-[a-z0-9-]+(?=\s*:)/gi) || []));
  const missing = [...names(light)].filter((n) => !names(dark).has(n));
  assert.equal(
    missing.length,
    0,
    `tokens sans valeur en sombre (valeur du thème clair sur fond sombre) : ${missing.join(", ")}`,
  );
});
```

Le test 12 échouera d'abord sur les dix tokens de la section B, plus
éventuellement quelques neutres volontairement partagés (`--color-sky`,
`--color-neutral-warm`). Pour ceux-là, redéclarer la même valeur dans le bloc
sombre avec un commentaire d'une ligne expliquant pourquoi elle est identique —
une décision explicite, pas un oubli.

Mettre à jour `MIGRATED` et `STAGES` :

```js
const MIGRATED = ["shell.css", "relief.css", "tables.css", "views.css"];
const STAGES = { shell: true, dashboard: true, relief: true, views: true };
```

Le test 10 devient alors actif et vérifie que `styles.css` et
`institutional-theme.css` ont bien disparu et qu'il ne reste aucun `!important`
dans `src/*.css`. C'est la fin de l'audit.

---

## Hors périmètre de cette passe

**Calendrier, pitch engine, decrement score.** Le client les signale comme
cassés mais la description ne suffit pas à identifier la cause, et le pitch
engine est du markup généré en JS. Une fois les feuilles héritées supprimées
(section A), ces trois vues seront **non stylées** — c'est attendu. Les
capturer dans cet état, en clair et en sombre, et les remonter : elles feront
l'objet d'une passe 5 avec une spec dédiée. Ne pas improviser leur design.

---

## Recette

- [ ] `styles.css` et `institutional-theme.css` supprimés du dépôt et
      d'`index.html`.
- [ ] Bloc ALIAS LEGACY supprimé de `design-tokens.css` ; plus aucun usage de
      `--gold`, `--sea`, `--red`, `--text2`… dans `src/`.
- [ ] `npm test` vert, tests 11 et 12 inclus, `STAGES` tout à `true`.
- [ ] Zéro `!important` dans `src/*.css` (test 10 actif).
- [ ] Portefeuille : 13 colonnes visibles, VL comprise, aucun chevauchement,
      Émetteur coupé à l'ellipse avec infobulle.
- [ ] Barrières : colonnes Type et Émetteur ajoutées, VL visible, `colspan` de
      l'état vide corrigé.
- [ ] Aucun montant coloré nulle part ; corail ≤ 2 apparitions par écran.
- [ ] Distance protection : les trois cas rendus distinctement, aucune cellule
      vide.
- [ ] KPI barrières : quatre chiffres sur la même ligne de base, deux cartes
      teintées sur quatre, barre de proportion présente.
- [ ] Thème sombre : graphique de performance, valorisations et jauges
      lisibles. Capture à l'appui.
- [ ] Accueil : bandeau bleu plein, une phrase de décision, plus aucun émoji.
- [ ] Captures `screenshots/passe4-clair.png` et `passe4-sombre.png`, plus les
      captures des trois vues hors périmètre.
