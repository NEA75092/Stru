# PASSE 6 — Densité, lisibilité, et les vues encore laides

**État à l'entrée :** passe 5 appliquée (non commitée à l'heure de cette
revue). Overlays, controls, tables, relief en place. `npm test` vert.

**Ce que cette passe traite :** la revue client du 26/07 sur les 13 captures de
l'app déployée. La mécanique est là ; ce qui manque est la **densité** (des
écrans où 5 lignes occupent 1300 px), la **hiérarchie** (des valeurs répétées
deux fois, des colonnes vides) et **deux bugs de données** qui font mentir les
chiffres.

Priorité : section A (les bugs — ils rendent l'app faussement fiable), puis B,
puis les vues.

---

## A. Deux bugs qui font mentir les chiffres

### 1. Le P&L perd son signe — portefeuille

Capture portefeuille, ligne Airbus : **P&L `468k€`** en rouge, **P&L % `−7,0 %`**.
Toutes les lignes ont le même défaut : un P&L négatif s'affiche en valeur
absolue. La couleur rouge est correcte (elle vient du signe réel), le nombre
est faux.

Le formateur de montants applique `Math.abs()` ou perd le signe en passant par
`toLocaleString` sur une valeur déjà arrondie. Corriger dans le formateur, pas
à l'appel : `−468k€`, avec le tiret demi-cadratin `−` (U+2212), pas le
trait d'union.

Vérifier ensuite qu'aucune valeur affichée ne contredit sa propre couleur.

### 2. L'astérisque parasite derrière chaque VL

Capture portefeuille : `93.01% ★`, `93.64% ★`… sur les 54 lignes. Ce glyphe
n'a aucune signification documentée et aucune légende. Deux cas : soit c'est un
marqueur « valeur estimée » — alors il lui faut une légende sous le tableau et
il ne doit apparaître que sur les lignes concernées ; soit c'est un résidu de
gabarit — alors il disparaît. Trancher en lisant le code, ne pas masquer en CSS.

### 3. Le ticker coupe ses entrées au bord

Sur les captures Clients, Portefeuille, Barrières, Pitch Engine : le ruban
commence par `),34`, `JSD 1,084`, `TAL 62,41`, `.12%` — la première entrée est
tronquée en plein milieu. Le défilement n'est pas remis à zéro sur un multiple
de la largeur d'une entrée. Faire défiler la piste de `-50 %` exactement
(deux copies de la liste), avec un `overflow: hidden` sur le conteneur et
`width: max-content` sur la piste. Aucune entrée ne doit jamais être coupée.

---

## B. Dashboard

### 1. Le montant total est affiché deux fois

Le bandeau bleu porte `ENCOURS GÉRÉ 229,2M€`, et la première carte KPI porte
`VALEUR TOTALE PORTEFEUILLE 229,2M€`. C'est le même nombre à 40 px d'écart.

Décision : **le bandeau garde le total**, la carte KPI change de sujet. Elle
devient **« Performance latente »** : `−6,79 %` en gros, `−16,7 M€ vs encours
initial` en sous-titre. Le total est un fait, la performance est l'information
— et c'est ce que les trois autres cartes racontent déjà (des états, pas des
sommes).

### 2. La sparkline de la première carte

Aujourd'hui : un trait diagonal nu, deux points, aucun repère. Ça ne dit rien
et ça encombre. Deux options, dans cet ordre de préférence :

- **La supprimer.** La carte porte déjà `−6,79 %`. Une courbe de deux points
  n'ajoute pas d'information.
- Si une courbe est voulue : au moins 12 points (un par mois), tracé
  `--color-aegean-2` 2 px, aire sous la courbe à 8 % d'opacité, aucun axe,
  hauteur 32 px, alignée à droite dans la carte et **jamais** à côté du
  chiffre — sous lui.

Ne pas garder l'état actuel.

### 3. Actions requises

Le montant est collé au bord droit, à 1400 px du titre : l'œil ne relie plus la
ligne à sa valeur. Refonte de la ligne en grille
`3px minmax(0, 1fr) auto auto` :

| Zone | Contenu | Largeur |
| --- | --- | --- |
| 1 | Filet de statut | 3 px |
| 2 | Nom du produit + contexte en dessous | reste |
| 3 | Pastille de statut `.st-*` | auto |
| 4 | Montant en mono + chevron | 160 px, aligné à droite |

- La pastille remplace le libellé `FRANCHIE` en mono minuscule : même composant
  que le tableau, donc même code couleur partout dans l'app.
- Le contexte (`DAX 40 · Distance protection : −11.8% · Proch. obs. 2026-08-19`)
  passe en 12 px `--color-text-secondary`, et **« Distance protection : »**
  disparaît — la valeur seule suffit : `DAX 40 · −11,8 % · obs. 19.08`.
- Dates au format court `19.08` partout, jamais `2026-08-19` (format ISO en
  interface). Cela vaut pour **toutes** les vues.
- Hauteur de ligne 64 px maximum. Les 5 lignes doivent tenir dans un écran sans
  défiler.

### 4. Performance du portefeuille — alignement

Les trois valeurs (`Encours initial 245,9M€`, `Valorisation 229,2M€`,
`Performance · YTD −2.20%`) ne partagent pas leur ligne de base : la troisième
porte un sous-titre qui décale le bloc. Les mettre en grille
`repeat(3, auto)` avec `align-items: baseline` et les trois sous-titres sur une
**seconde** rangée de la même grille. Même famille, même taille, même graisse
pour les trois valeurs (`--font-mono-data`, 22 px, 600).

`−2.20%` s'écrit `−2,20 %` (virgule décimale, espace insécable avant le
pourcent). À corriger dans le formateur, partout.

---

## C. Top / Flop VL — refonte

Le défaut est structurel : deux listes de 5 empilées occupent 1300 px de haut
pour dire que les VL vont de 92,39 % à 93,97 %. Un écart d'un point et demi,
étalé sur toute la page.

**Nouvelle disposition : deux colonnes côte à côte.** `grid-template-columns:
1fr 1fr; gap: var(--space-5)`. Top à gauche, Flop à droite. Hauteur totale
cible : 420 px, soit un tiers de l'actuelle.

Par ligne, grille `minmax(0, 1fr) auto` :

- nom du produit sur une ligne, ellipse, 13 px 600 ;
- sous-jacent en dessous, 11 px `--color-text-tertiary` ;
- **VL en mono à droite**, colorée par signe.

**Le montant disparaît** (demande client) : ce n'est pas un classement
d'encours.

**La légende manquante.** « 93,97 % » ne se lit pas sans savoir de quoi c'est le
pourcentage. Sous le titre de chaque colonne, une ligne de 11 px
`--color-text-tertiary` : *VL en % du nominal · base 100 à l'émission*. Sans
elle, la valeur est illisible pour quiconque n'a pas construit la table.

**Une barre de distribution** de 3 px sous chaque VL, remplie sur l'échelle
92–94 % (pas 0–100 % : l'écart réel est d'un point et demi, l'échelle doit le
montrer). C'est ce qui rend le classement visible plutôt que déductible.

---

## D. Portefeuille — colonnes

La colonne `DISTANCE PROTECTION` est coupée au bord droit et le tableau déborde
sans que le défilement soit évident. Trois corrections :

1. **Supprimer** la colonne `COUPON/AN` de la vue principale (elle vit dans le
   tiroir). Récupérer ses 6 %.
2. **Fusionner** `P&L` et `P&L %` en une seule colonne : `−468k€` avec
   `−7,0 %` en dessous en 11 px. Récupérer 6 % de plus.
3. Les 12 % récupérés vont à `DISTANCE PROTECTION` (9,5 % → 15 %) et à
   `PRODUIT` (16 % → 18 %) — aujourd'hui `Autocall / Phoenix BNP Par…` est
   tronqué au point d'être indistinguable d'une autre ligne.

Nouvelle répartition, 11 colonnes, somme 100 :

| Colonne | % | Colonne | % |
| --- | --- | --- | --- |
| Produit | 18 | P&L (+ %) | 11 |
| Type | 7 | Distance protection | 15 |
| Émetteur | 12 | Maturité | 6 |
| Nominal | 8 | Proch. évt. | 6 |
| VL | 7 | Statut | 8 |
| Valorisation | 9 | | |

Le `min-width` du tableau descend à 1200 px. Sous cette largeur, un dégradé de
6 px sur le bord droit signale le défilement (`--color-surface` → transparent).

**Relief manquant.** La demande « ça manque de design » se traite ici, pas par
des ornements : la rangée d'en-tête devient collante (`position: sticky; top: 0`)
avec le fond `--color-surface-raised` et une ombre basse de 1 px — sur 54 lignes,
c'est ce qui manque le plus. Le survol de ligne prend
`background: --color-surface-sunk` **et** un filet gauche de 2 px en
`--color-aegean`.

---

## E. Barrières

1. **Supprimer la colonne `TYPE BARRIÈRE`** (demande client) : elle affiche
   `—` sur toutes les lignes.
2. `NIVEAU BARRIÈRE` affiche `55% (3.30M…` — tronqué. Scinder : `55 %` en
   valeur, le niveau absolu en 11 px dessous.
3. Le tableau déborde au-delà de `DISTANCE PROTECTION` : appliquer la même
   grille de largeurs que la section D, colonnes 10, somme 100 :
   Produit/ISIN 20 · Type 7 · Émetteur 12 · Sous-jacent 11 · Niveau barrière 10
   · VL 7 · Valorisation 9 · Distance protection 16 · Statut 8.

4. **Les KPI sont trop violents.** Deux cartes sur quatre ont un **fond plein
   saturé** (corail et bleu). La règle validée était une **ombre teintée**, pas
   un aplat : deux aplats saturés côte à côte se battent, et « Zone saine » en
   bleu plein attire autant l'œil que « Barrières franchies » en corail plein —
   l'inverse de l'intention.

   Correction : les quatre cartes reprennent le fond `--gradient-card-lit`.
   Seule « Barrières franchies » garde un accent — filet supérieur de 3 px en
   `--color-danger` + `--shadow-card-coral`. Les trois autres :
   `--shadow-card` neutre, filet supérieur dans leur couleur de statut.

5. La **frise de distribution** est bonne. Deux ajouts : un repère vertical
   étiqueté à `0 %` (le seuil, aujourd'hui implicite) et une infobulle au
   survol d'un point donnant le nom du produit.

---

## F. Calendrier — reprise complète

C'est la vue la plus dégradée. Sur la capture : un bandeau blanc de 350 px
contenant quatre lignes de texte brut, « Vue mois » en paragraphe, les 6 modes
en boutons natifs non stylés, un champ date natif, une phrase d'explication en
16 px (`Colonne de gauche = focus…`) — et **aucune grille visible**. La grille
mensuelle de la passe 5 n'est pas atteignable sans défiler.

**Barre de contrôle unique**, hauteur 56 px, remplaçant le bandeau et les
trois blocs de réglages. Une seule ligne :

`‹ ›  Juillet 2026  |  [Vue principale · Jour · Semaine · Mois · Année · Plage · Glissant]  |  [recherche]  |  Grille / Liste`

- Les 7 modes en onglets-pastilles (section C de la passe 5), pas en boutons
  natifs.
- Le mois en 17 px 600 avec les deux chevrons de navigation — aujourd'hui
  changer de mois demande de modifier un champ date.
- Le champ date natif passe en contrôle secondaire, révélé par un bouton
  « date de référence », pas affiché en permanence.
- Supprimer la phrase `Colonne de gauche = focus sur la date de référence` :
  si la disposition a besoin d'être expliquée, elle est fausse.
- Supprimer le sous-titre `Date de référence : dimanche 26 juillet 2026 · 2
  événements sur la période affichée` — l'information passe dans la barre, en
  mono 11 px.

**La grille passe au-dessus du pli**, directement sous la barre. Les 4 cartes
KPI « Prochains 30 jours » passent **sous** la grille : ce sont des indicateurs
de contexte, pas le sujet de la vue.

Grille : 7 colonnes, cellules `min-height: 108px`, événements en pastilles
compactes (point de type + nom tronqué), 3 maximum puis « +2 ». Week-ends en
`--color-surface-sunk`. Légende des 4 types en mono 10 px à droite de la barre.

---

## G. Pilotage

Le client le juge laid et inutile en l'état. Il ne l'est pas : il porte la
concentration et le coupon moyen pondéré, deux chiffres que rien d'autre ne
donne. Le problème est qu'ils sont présentés comme du remplissage.

1. **Trois KPI en haut**, même composant que Barrières : `Concentration produit
   max 3,2 %`, `Coupon moyen pondéré 9,39 %/an`, `Concentration émetteur max
   19,9 %` (calculable, aujourd'hui absent — c'est le vrai risque d'un
   portefeuille de structurés).
2. **Répartition par type** : les 4 barres bleues identiques deviennent un
   histogramme horizontal empilé unique, une couleur par type, avec les
   pourcentages en étiquette. Quatre barres de la même couleur ne se comparent
   pas — une barre segmentée, si.
3. **Top 5 dossiers** : la valeur `69,2M€` est collée au bord droit, à 900 px
   du nom. Grille `minmax(0,1fr) auto` avec le montant à 140 px du bord, et une
   barre de part sous chaque ligne.
4. Le bandeau de titre passe de 250 px à 80 px : titre + une phrase, sur une
   ligne.

## H. Pitch Engine

Le pas-à-pas fonctionne, mais l'étape 5 est un dépotoir : 12 lignes de texte
brut, chacune suivie d'un bouton natif `Modifier`, et les titres de section
s'empilent en double (`Barrières & rappel` puis `Rappel & dégressivité`, sans
séparation).

1. **Le récapitulatif devient un tableau de deux colonnes** (libellé / valeur),
   `tables.css`, sans bouton par ligne. Un seul bouton « Modifier » par section,
   en tertiaire, dans l'en-tête de section — 12 boutons natifs alignés en
   escalier, c'est ce qui donne l'impression de casse.
2. **Hiérarchie des titres.** Chaque étape a **un** titre de niveau 1 et des
   sous-titres en mono capitales 10 px. Aujourd'hui `Barrières & rappel`,
   `Rappel & dégressivité`, `Mécanismes optionnels`, `Barrières bearish`,
   `Taux, callable & référence`, `Calendrier de call` sont tous au même rang
   visuel — six titres de même poids sur un écran.
3. **Le panneau de prévisualisation** occupe 45 % de l'écran pour afficher
   « Générez un pitch pour afficher le deck. ». Le réduire à 320 px tant qu'il
   est vide, et donner la largeur au formulaire — qui en manque.
4. Les 4 boutons d'action (`Utiliser dernier document lu`, `Générer pitch`,
   `Exporter PPTX`, `Exporter PDF`) sont sur une ligne, dont un qui déborde à
   gauche du conteneur. Un seul bouton primaire (`Générer pitch`), les trois
   autres en secondaire, dans un pied collant.
5. Les `<select>` et `<input>` natifs prennent les styles de `controls.css` —
   aujourd'hui ils sont au thème du système.

## I. Decrement Score

1. **L'en-tête de tableau ne défile pas avec le corps** : sur la capture, la
   première ligne de données passe **sous** la rangée d'en-tête et devient
   illisible (`Indice · USA · local` coupé en deux). En-tête `position: sticky`,
   fond opaque `--color-surface-raised`, `z-index: 2`.
2. **Colonnes.** Quatre colonnes seulement, mais 900 px de vide entre
   `SOUS-JACENT` et `DIVIDENDE − DÉCRÉMENT`. Répartition : Sous-jacent 34 ·
   Dividende − décrément 22 · Coût historique 22 · Score 22. Les trois
   dernières alignées à droite.
3. **`Cours de re…`** est tronqué dans la ligne de métadonnées : la faire tenir
   ou la retirer de la ligne (elle est dans la fiche).
4. **Police et couleur.** `Couvre +0.26 pts/an` est en vert, `Manque 2.46
   pts/an` en rouge, `1.1%/an sacrifié` en encre — trois traitements pour trois
   colonnes voisines, sans système. Corriger :
   - toutes les valeurs numériques en `--font-mono-data`, même taille (13 px),
     `tabular-nums` ;
   - la **couleur passe sur une pastille**, pas sur le texte : `.st-safe` pour
     « Couvre », `.st-crit` pour « Manque ». Le mot porte l'information, la
     couleur la double ;
   - `+0.26` s'écrit `+0,26` ; `1.1%/an` s'écrit `1,1 %/an`.
5. **La colonne Score manque** alors que la vue s'appelle Decrement Score : le
   tableau montre les composantes mais jamais la note. L'ajouter en dernière
   colonne, en pastille, sinon la vue ne tient pas sa promesse.
6. La légende (`Vert mécanisme confortable · Orange à justifier · Rouge coût
   difficile`) passe en trois pastilles réelles des mêmes classes, pas en texte
   coloré.

## J. Doc Reader

`<input type="file">` natif avec `Parcourir…` et `Aucun fichier sélectionné`
dans une zone de dépôt stylée : incohérent. Masquer l'input (`sr-only`),
rendre toute la zone cliquable et réceptive au glisser-déposer, avec le nom du
fichier affiché après sélection.

---

## K. Thème sombre

Vérifier **chaque** vue de cette passe en sombre. Points à contrôler en
priorité, d'après les corrections ci-dessus :

- la barre de distribution du Top/Flop (fond de piste `--color-surface-sunk`,
  invisible si le fond de carte est identique) ;
- l'en-tête collant des tableaux (un fond translucide laisse voir les lignes
  défiler derrière — le fond doit être opaque) ;
- les filets supérieurs de 3 px des KPI barrières ;
- les pastilles `.st-*` du Decrement Score sur fond sombre ;
- le dégradé de bord droit signalant le défilement horizontal.

Aucune capture de cette passe n'est validée sans sa paire sombre.

---

## Recette

- [ ] Aucun montant ne contredit sa couleur ; les P&L négatifs portent `−`.
- [ ] Plus aucun `★` sans légende ; plus aucune date au format ISO en interface.
- [ ] Le ticker ne coupe aucune entrée, à aucun moment du défilement.
- [ ] Le total du portefeuille n'apparaît qu'**une** fois sur le dashboard.
- [ ] La sparkline nue a disparu (ou porte 12 points et une aire).
- [ ] Actions requises : 5 lignes visibles sans défiler, montant à 160 px du
      bord, pastilles `.st-*`.
- [ ] Performance du portefeuille : trois valeurs sur la même ligne de base.
- [ ] Top/Flop : deux colonnes, ≤ 420 px de haut, légende de VL présente, plus
      aucun montant.
- [ ] Portefeuille : 11 colonnes, rien de coupé, en-tête collant.
- [ ] Barrières : `TYPE BARRIÈRE` supprimée, plus aucun aplat saturé sur les
      KPI.
- [ ] Calendrier : la grille est visible sans défiler, 7 modes en onglets, plus
      aucune phrase d'explication de disposition.
- [ ] Pilotage : 3 KPI, histogramme segmenté, montants rapprochés.
- [ ] Pitch Engine : récapitulatif en tableau, un bouton Modifier par section,
      un seul bouton primaire, contrôles non natifs.
- [ ] Decrement Score : en-tête collant opaque, 4 colonnes réparties, colonne
      Score présente, couleurs en pastilles.
- [ ] Doc Reader : zone de dépôt sans input natif visible.
- [ ] Les 10 vues capturées **dans les deux thèmes**.
