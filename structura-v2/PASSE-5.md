# PASSE 5 — Primitives partagées, overlays et vues restantes

**État à l'entrée :** passe 4 poussée et déployée. `styles.css` et
`institutional-theme.css` supprimés, alias legacy supprimés, thème sombre
complété, `tables.css` en place, `npm test` vert (55/55).

**Ce que la passe 4 a laissé tomber, et pourquoi.** En auditant la section A,
Claude Code a signalé que le tiroir produit, la modale, les boutons/formulaires,
la toolbar et les vues Analytics/Ingestion ne tenaient que grâce aux deux
feuilles supprimées. La réponse a été « suis la lettre du document » — et la
lettre ne couvrait que trois vues. C'est une erreur de cadrage de PASSE-4.md,
pas une erreur d'exécution : le signalement était le bon, et la décision de
périmètre était mauvaise. Cette passe la corrige.

**Ce que le client voit aujourd'hui en production.** Le ticker de marché rendu
deux fois de suite en texte brut ; le formulaire complet « Nouveau produit
structuré » (18 champs) empilé en bas de chaque page ; le calendrier des
événements en liste nue sous le dashboard ; le KPI « Valeur totale portefeuille »
affichant `012345678901234567890123456789,0123456789M€`. Les vues Clients,
Analytics, Ingestion, Calendrier, Pitch Engine et Decrement Score sans mise en
forme.

**Priorité :** l'ordre des sections ci-dessous est l'ordre d'exécution. A et B
rendent l'app présentable immédiatement ; les vues viennent après.

---

## A. Les overlays — la régression la plus visible

Tout ce qui doit flotter au-dessus de la page s'affiche aujourd'hui dans le flux
normal, en bas du document : c'est le seul défaut qui casse **toutes** les pages
à la fois.

Créer `src/overlays.css` avec les quatre primitives suivantes. Elles n'existent
nulle part ailleurs — aucun risque de collision.

### 1. Le voile

```css
.overlay-scrim {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgb(22 39 58 / 0.42);
    backdrop-filter: blur(3px);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--duration-base) var(--ease-standard);
}

.overlay-scrim.open {
    opacity: 1;
    pointer-events: auto;
}
```

En thème sombre : `rgb(0 0 0 / 0.6)`.

### 2. La modale (« Nouveau client », « Nouveau produit »)

`position: fixed`, centrée, `z-index: 101`, `max-width: 720px`,
`max-height: 88vh`, `overflow-y: auto`, `border-radius: var(--radius-lg)`,
fond `var(--gradient-card-lit)`, ombre `var(--shadow-float)`.

Fermée : `display: none` — **pas** `visibility` ni `opacity` seule. Le
formulaire ne doit pas rester dans le flux, c'est ce qui produit l'empilement
actuel.

En-tête de modale collant (`position: sticky; top: 0`) avec le titre et le
bouton de fermeture, pied collant en bas avec les actions. Un formulaire de 18
champs a besoin que « Enregistrer » reste atteignable.

### 3. Le tiroir produit

`position: fixed; inset-block: 0; right: 0; width: min(560px, 100vw)`,
`z-index: 101`, `transform: translateX(100%)` fermé,
`translateX(0)` ouvert, transition sur `transform` uniquement (pas sur `right`).
Fermé, il porte aussi `visibility: hidden` pour sortir du parcours de tabulation.

### 4. Le menu déroulant (profil, filtres)

`position: absolute` sur un parent `position: relative`, `z-index: 90`,
`display: none` fermé. Ombre `var(--shadow-float)`.

### Grille des formulaires

Dans le même fichier : les 18 champs de « Nouveau produit » en
`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4)`,
les champs longs (Nom du produit, Notes) en `grid-column: 1 / -1`. Label au-dessus
du champ, en mono capitales 10 px `--color-text-tertiary`. Hauteur de champ
44 px minimum. L'astérisque des champs requis en `--color-coral` — c'est un
usage sémantique légitime, il ne compte pas dans le quota de deux blocs corail.

**Vérification :** ouvrir chaque vue et confirmer qu'aucun formulaire, aucune
liste de calendrier et aucun tiroir n'apparaît sans action de l'utilisateur.

---

## B. Deux bugs à corriger avant tout le reste

### 1. Le ticker de marché rendu deux fois

Le ruban CAC 40 / EURO STOXX / DAX apparaît en double. Soit le duplicata est
volontaire (technique classique du défilement en boucle : deux copies de la
liste dans une piste animée), soit l'initialisation est appelée deux fois.

- Si c'est la boucle : la piste a besoin de
  `overflow: hidden` sur le conteneur, `display: flex; width: max-content` sur
  la piste et une animation `translateX(-50%)`. Sans ces trois règles — perdues
  avec les feuilles héritées — les deux copies se lisent bout à bout en texte
  brut, exactement ce que voit le client.
- Si c'est un double appel : chercher l'initialisation appelée à la fois au
  chargement et au changement de vue.

Vérifier lequel des deux cas s'applique avant de corriger. Au passage :
séparation visible entre le nom de l'indice et sa valeur (aujourd'hui
« CAC 407 893,42 » se lit comme un seul nombre), valeur en `--font-mono-data`,
variation en `--color-success` / `--color-danger`, séparateur vertical entre les
entrées.

### 2. L'odomètre déroule ses dix chiffres

`012345678901234567890123456789,0123456789M€` : chaque colonne montre sa
bobine entière au lieu d'un seul chiffre. Le rognage ne s'applique pas.

Deux causes possibles, à départager en lisant la hauteur calculée dans
l'inspecteur :

- `--odo-h` n'est pas déclarée sur l'élément qui porte `.odometer`, et une des
  règles de `dashboard.css` remet `height: auto` ou `overflow: visible` sur le
  conteneur du KPI ;
- le markup généré par `renderOdometer()` n'a pas de conteneur `.odometer` —
  seuls les `.odometer-digit` existent, et sans hauteur ferme leur
  `overflow: hidden` ne rogne rien.

Correction, indépendante des deux cas : ne plus faire dépendre le rognage d'une
variable héritée. La hauteur de la bobine est celle de la ligne du chiffre —
déclarer sur `.odometer` **et** `.odometer-digit` une `height` en `em`
(`height: 1em; overflow: hidden`), et calculer la translation en `em` plutôt
qu'en pixels : `transform: translateY(calc(var(--d, 0) * -1em))`. La bobine suit
alors la taille de police du KPI sans qu'aucune variable ne soit à poser.

Vérifier ensuite que la valeur affichée est bien `229,2 M€` et qu'aucun chiffre
n'est coupé en haut ou en bas.

---

## C. Les primitives d'interface

Créer `src/controls.css`. Ces règles existaient dans les feuilles supprimées et
sont utilisées par toutes les vues.

- **Boutons** : primaire (fond `--color-aegean`, texte blanc), secondaire (fond
  transparent, bordure `--color-border`), tertiaire (texte seul). Hauteur 40 px,
  `border-radius: var(--radius-full)`, `--shadow-card` sur le primaire au survol
  avec `translateY(-1px)`. État `:disabled` à 45 % d'opacité, curseur
  `not-allowed`.
- **Champs de saisie** : hauteur 44 px, fond `--color-surface`, bordure
  `--color-border`, `border-radius: var(--radius-sm)`. Au focus : bordure
  `--color-aegean` + `box-shadow: 0 0 0 3px rgb(31 111 178 / 0.14)`. Jamais
  `outline: none` sans remplacement visible.
- **Toolbar de vue** : `display: flex; align-items: center; gap: var(--space-3)`,
  le `.toolbar-spacer` en `flex: 1`. Champ de recherche, filtres et actions sur
  une ligne, qui passe à la ligne proprement sous 900 px.
- **Onglets** (Top/Flop VL, Clients) : filet actif de 2 px en `--color-aegean`
  sous l'onglet sélectionné, transition sur la couleur seule.
- **États vides** : un texte centré en `--color-text-tertiary`, 13 px, sans
  encadré. Le `colspan` doit couvrir toutes les colonnes du tableau concerné.

---

## D. Vue Clients

Le tableau produits fonctionne déjà via `tables.css`. Le reste de la vue est à
refaire dans `src/views.css`.

- **Liste de clients** en cartes, grille
  `repeat(auto-fill, minmax(320px, 1fr))`, `gap: var(--space-4)`. Par carte :
  nom en 15 px semi-gras, segment en pastille, encours en `--font-mono-data`
  18 px, nombre de produits et compteur d'alertes. Fond
  `var(--gradient-card-lit)`, `box-shadow: var(--lit-top), var(--shadow-card)`,
  survol `translateY(-4px)` + `--shadow-card-hover`.
- Une carte de client portant une barrière franchie prend
  `--shadow-card-coral` — c'est le seul usage du corail de la vue.
- **Fiche client** (au clic) dans le tiroir de la section A, pas dans une
  nouvelle vue.
- Aucun montant coloré, ici non plus.

## E. Vue Barrières

Le tableau et les KPI sont faits (passe 4). Reste :

- La **frise de distance** : les 54 produits placés sur un axe horizontal de
  −20 % à +40 %, un point par produit, coloré par statut, la zone sous 0 %
  teintée en `rgb(193 72 59 / 0.08)`. Elle donne en un coup d'œil la
  distribution du risque, ce qu'aucun tableau ne montre.
- Les filtres de statut en boutons-pastilles reprenant les couleurs des
  pastilles du tableau, avec le compteur de chaque catégorie.

## F. Vue Calendrier

Le client la juge « moche et pas organisée ». Elle est aujourd'hui non stylée.

- **Grille mensuelle** : 7 colonnes, en-têtes de jours en mono capitales 10 px.
  Chaque cellule `min-height: 96px`, bordure `--color-border`, numéro du jour en
  haut à droite. Le jour courant porte un fond `rgb(31 111 178 / 0.06)` et son
  numéro en `--color-aegean` gras.
- **Événements** en pastilles compactes dans la cellule : point coloré par type
  (observation, coupon, rappel, maturité) + nom du produit tronqué à l'ellipse.
  Trois maximum par cellule, puis « +2 » cliquable.
- **Légende des quatre types** en haut à droite, sur une ligne.
- Un week-end porte un fond légèrement plus sourd (`--color-surface-sunk`) :
  aucune observation n'y tombe, l'œil doit le savoir sans lire.
- Basculement mois / liste dans la toolbar. La vue liste est un tableau
  `tables.css` : Date, Produit, Type, Émetteur, Montant.

## G. Vue Analytics / Pilotage et vue Ingestion

Non mentionnées dans PASSE-4.md, non stylées depuis. À reprendre dans
`views.css` avec le vocabulaire déjà en place : cartes
`var(--gradient-card-lit)` + `var(--lit-top), var(--shadow-card)`, titres de
section en mono capitales 12 px, tableaux via `tables.css`, graphiques avec les
tokens `-2` désormais valides dans les deux thèmes.

Pas d'invention de contenu : reprendre exactement les blocs déjà présents dans
le markup et leur donner la forme du système.

## H. Pitch Engine et Decrement Score

Ces deux vues n'ont jamais été spécifiées et leur markup est généré en JS. Le
client signale sur Decrement Score : police incohérente, graisse aléatoire,
couleurs de statut absentes.

Ne pas improviser une nouvelle mise en page. Traitement minimal, en trois
règles :

1. Toute valeur numérique passe en `--font-mono-data` avec
   `font-variant-numeric: tabular-nums`, une seule taille par niveau
   hiérarchique.
2. La graisse ne prend que deux valeurs : 400 pour le texte, 600 pour les
   titres et les valeurs de premier rang. Rien en 700 ou 800 hors titre de vue.
3. Les statuts passent par les classes `.st-*` de `tables.css` — plus aucune
   couleur posée en JS (le test 11 doit rester vert).

Si la structure reste illisible après ça, capturer et remonter : ce sera une
passe 6 avec une vraie spec de contenu.

---

## I. Tests

Ajouter à `tests/css-hygiene.test.js` :

```js
/* ── 13. Les overlays ne vivent pas dans le flux ────────────
   Régression passe 4 : la modale et le calendrier s'affichaient
   empilés en bas de chaque page, faute de position fixed. */
test("chaque primitive d'overlay est positionnée hors du flux", () => {
  const css = read("overlays.css");
  for (const sel of [".overlay-scrim", ".modal", ".drawer"]) {
    const block = css.slice(css.indexOf(sel));
    const decl = block.slice(0, block.indexOf("}"));
    assert.match(decl, /position:\s*fixed/, `${sel} n'est pas en position: fixed`);
    assert.match(decl, /z-index:/, `${sel} n'a pas de z-index`);
  }
});

/* ── 14. Un état fermé sort réellement du flux ──────────────── */
test("les overlays fermés sont en display: none", () => {
  const css = read("overlays.css");
  assert.match(css, /\.modal(?![\w-])[^{]*\{[^}]*display:\s*none/,
    "la modale fermée doit être en display: none, pas seulement transparente");
});
```

`MIGRATED` devient :

```js
const MIGRATED = ["shell.css", "relief.css", "tables.css",
                  "overlays.css", "controls.css", "views.css"];
```

Le test 10 reste actif : zéro `!important`, zéro couleur littérale dans les six
fichiers.

---

## Recette

- [ ] Aucun formulaire, calendrier ou tiroir visible sans action de
      l'utilisateur, sur **aucune** vue.
- [ ] Modale « Nouveau produit » : centrée, en-tête et pied collants, les 18
      champs sur deux colonnes, « Enregistrer » atteignable sans scroll de page.
- [ ] Tiroir produit : entre par la droite, sort du parcours de tabulation
      fermé.
- [ ] Ticker affiché **une** fois, nom et valeur séparés, variations colorées.
- [ ] KPI « Valeur totale portefeuille » : `229,2 M€`, aucun chiffre parasite ni
      coupé.
- [ ] Boutons, champs, onglets et toolbars stylés sur les 9 vues ; focus
      toujours visible.
- [ ] Clients : cartes en grille, fiche dans le tiroir, aucun montant coloré.
- [ ] Calendrier : grille mensuelle, événements en pastilles, légende,
      week-ends sourds, bascule mois/liste.
- [ ] Analytics, Ingestion, Pitch Engine, Decrement Score : cohérence
      typographique, statuts par classes, plus aucune couleur en JS.
- [ ] `npm test` vert avec les tests 13 et 14 ; `MIGRATED` à six fichiers.
- [ ] Les 9 vues ouvertes **dans les deux thèmes** avant de cocher quoi que ce
      soit. Captures `screenshots/passe5-<vue>-{clair,sombre}.png`.

---

## Note de méthode

Le signalement de périmètre fait pendant la passe 4 était juste et la réponse
reçue était mauvaise. Règle qui en découle, à ajouter à `CLAUDE.md` :

> Quand un audit révèle qu'une suppression casse des éléments hors périmètre, le
> périmètre est faux — pas l'audit. Remonter la liste et attendre un arbitrage
> explicite sur **chaque** élément, plutôt qu'un « suis la lettre du document »
> qui laisse des vues non stylées en production.
