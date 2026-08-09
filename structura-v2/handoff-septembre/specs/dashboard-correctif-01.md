# Correctif 01 — Dashboard § 2.2 et § 2.3

06/08/2026 · sur l'état poussé `bd043c7` · s'applique par-dessus `specs/dashboard.md`

**L'implémentation est conforme. Le rendu est mauvais.** Les deux à la fois : la sonde
mesure ce que la spec a nommé, et ce qui est parti de travers, la spec ne l'avait pas
nommé. **Quatre défauts réels, tous des trous de spec, tous à ma charge :** C1 l'échelle
des barres, C6 la règle de sélection, C7 l'arête de la barre négative. C8 n'est pas un
défaut de rendu mais la condition pour que les suivants soient détectables ; C9 et C10
sont des fautes de ma maquette, pas de l'app ; C11 est une faute de mon outil, qui
laissait C4 passer inaperçu. C3 a
d'abord accusé la trame ; c'était faux, et le paragraphe le documente au lieu de
disparaître. Rien ici n'est un reproche sur le travail livré.

---

## C1 — § 2.2 · L'échelle de la barre d'écart n'existe pas dans la spec

**Constat.** Dix lignes, écarts de −6,0 à −7,6, **dix barres de largeur identique**.
La barre ne porte aucune information : elle répète la présence d'une valeur négative,
que le signe donne déjà. Le tableau lit mieux sans elle qu'avec.

**Cause.** La spec fixe la hauteur, la trame, l'origine, la couleur — et jamais le
**domaine**. Sans domaine écrit, un domaine fixe large (±30 points) est le choix
raisonnable, et il écrase un jeu réel étalé sur 1,6 point. Le défaut est dans la spec.

**Correction.**

| Invariant | Valeur attendue |
|---|---|
| Domaine | `max(abs(écart))` des lignes **affichées**, arrondi au point supérieur, **plancher 4 points** |
| Recalcul | à chaque changement du jeu affiché (filtre, période, tri) |
| Largeur | `abs(écart) / domaine`, en %, **plancher 3 px** |
| En-tête colonnes | **inchangé** — « sous 100 » / « au-dessus ». Ne pas y toucher |
| Axe | inchangé — 1 px `--color-divider`, au centre, **permanent même si aucune ligne positive** |

La barre est **comparative à l'intérieur de la liste affichée**, et rien d'autre : c'est
le rôle d'une barre dans un Top/Flop. La valeur exacte de chaque ligne est déjà dans la
colonne « écart », au point près — la barre n'a pas à la répéter, elle a à faire voir
le classement. Aucune échelle à afficher, aucun en-tête à modifier.

> Une version antérieure de ce correctif remplaçait « sous 100 » / « au-dessus » par
> les bornes du domaine. **Annulé.** C'était un changement de fonctionnalité introduit
> sous couvert de correctif esthétique, et il n'avait été demandé par personne. Les
> en-têtes de § 2.2 restent ceux de la spec d'origine.

---

## C2 — § 2.2 · La moitié droite reste vide et c'est normal

Les dix lignes sont négatives, la colonne « au-dessus » est vide sur toute la hauteur.
**Ne pas la supprimer, ne pas recentrer.** L'axe doit occuper la même abscisse quand un
positif apparaît ; un axe qui se déplace au fil des données est pire qu'une colonne
vide. Son en-tête « au-dessus » l'explique déjà : la colonne est vide parce qu'aucun
produit n'est au-dessus de 100. Rien à ajouter.

---

## C3 — RETIRÉ. Faux diagnostic.

**Ce que j'ai cru voir.** Dans la carte VL de l'app, la trame 2/5 px rendait un ruban
de chantier au lieu d'une matière. J'en ai conclu que la trame ne tenait pas à ce
calibre, et j'ai écrit une règle interdisant la trame sous 24 px de haut — donc sur la
barre d'écart, le segment franchi, les barres du Decrement Score et la puce Clients.

**Ce qui était vrai.** Le ruban ne venait pas de la trame. Il venait de **C1** : dix
barres de largeur identique, empilées, dont les hachures s'alignaient d'une ligne à
l'autre et formaient un bloc de moiré. Dès que les largeurs varient, la même trame au
même calibre se lit parfaitement — vérifiable sur la maquette, écran B, et ça
l'était avant que je la modifie.

**Ce que la règle détruisait.** La trame n'est pas une décoration : c'est le système
sémantique de l'application, écrit sous la carte VL — « l'encre pleine monte, **l'encre
gravée descend** ». Un aplat uni pour le négatif supprime la distinction sur laquelle
tout le dessin repose, et laisse la légende décrire un dessin qui n'existe plus.

> **Rien ne change sur les trames.** Barre négative § 2.2, segment franchi § 2.1,
> pastilles de légende, barres du Decrement Score, puce d'alerte Clients : trame
> `115deg, 0 2px, transparent 2px 5px` sur aplat 20 %, **inchangée**, partout.
> Le seul défaut de la carte VL est l'échelle, traitée en C1.

Le grain, la cannelure et la grille de 72 px n'ont jamais été concernés non plus.

## C4 — § 2.3 · Les pourcentages dans les segments

**Constat.** « 7,4 % » en encre posé sur 70 px de trame rouge : illisible. « 85,2 % »
au centre du segment gris : lisible, et **déjà présent trois lignes plus bas** dans la
légende, en plus gros et mieux placé.

**Correction.** Aucune étiquette à l'intérieur de la barre empilée, quelle que soit la
largeur du segment — y compris la zone de rendement. La barre donne la proportion, la
légende donne les nombres. Un `title` par segment pour le survol.

**La hauteur reste `44px`** (§ 2.3 inchangé) : la maquette n'a jamais logé de texte
dans cette barre, l'étiquette est une addition d'implémentation. Rien d'autre à bouger.
C4 est le seul point de ce correctif qui ne soit pas un trou de ma spec.

---

## C6 — § 2.2 · Quelles lignes la carte affiche : jamais écrit

**Constat.** La carte affiche les **dix pires** écarts. Elle doit afficher un
**Top/Flop : 5 meilleures valorisations et 5 pires**.

**Cause.** Même trou que C1, et à ma charge de la même façon. § 2.2 fixe la grille, la
hauteur de ligne, la barre, l'axe, le format des valeurs — et ne dit **nulle part**
combien de lignes, lesquelles, ni dans quel ordre. Le mot « Top/Flop » n'apparaît que
dans la table de suppressions, à propos d'un `border-bottom`. Dix pires est un choix
recevable devant une spec muette. Le défaut est dans la spec.

**Correction.**

| Invariant | Valeur attendue |
|---|---|
| Sélection | classer **tous** les produits par écart à 100 décroissant ; prendre les **5 premiers** et les **5 derniers** |
| Signe | **aucune condition de signe.** Les « 5 meilleurs » sont les 5 premiers du classement, même si tous sont négatifs |
| Ordre d'affichage | un seul bloc de 10, écart décroissant, du meilleur au pire |
| Moins de 10 produits | afficher tous les produits, une seule fois chacun, même classement. Ne jamais compléter, ne jamais répéter une ligne dans les deux groupes |
| Domaine des barres | inchangé (C1) — recalculé sur **ces 10 lignes**, plancher 4 points |
| Séparateur entre les deux groupes | **aucun** pour l'instant. Voir la note ci-dessous |

> **Point ouvert, à ne pas trancher seul (R6/R9).** Un Top/Flop se dessine parfois avec
> une césure visible entre les 5 et les 5. La maquette n'en a pas, donc l'app n'en met
> pas. Si la lecture le réclame une fois les vraies données en place, ça remonte comme
> une demande, pas comme un correctif.

**Sur la maquette.** Le jeu par défaut de `Direction Mediterranee v3.dc.html` était
`resserré` — dix négatifs entre −6,0 et −7,6, aucun « top ». C'est ce jeu qui était
regardé depuis le début. Il est désormais **en second** : le défaut est le vrai
top/flop 5+5. Le jeu resserré **reste disponible** en prop `jeuVL` et ne doit pas être
supprimé — c'est le cas qui rend le défaut d'échelle de C1 reproductible en un clic.

---

## C7 — § 2.2 · L'arête de la barre négative : jamais écrite

**Constat.** Relevé par le calque, confirmé par Claude Code : la barre négative de
l'app n'a **aucun** `box-shadow`. La maquette en pose un.

**Cause.** § 2.2 nomme l'arête de la barre **positive** (« arête haute `--lumiere` ») et
rien pour la négative. Troisième trou de la même famille que C1 et C6 : la spec décrit
un élément et en oublie le symétrique.

**Correction.**

| Invariant | Valeur attendue |
|---|---|
| Barre négative · arête | `inset 0 -1px 0 var(--lumiere)` — arête **basse**, pas haute |
| Barre positive · arête | inchangée |

L'arête est basse sur la négative et haute sur la positive parce que les deux barres
creusent en sens inverse : la lumière tombe du même côté sur les deux, c'est la matière
qui s'inverse. Ce n'est pas une ombre portée — `CLAUDE.md` reste respecté.

---

## C8 — Ancres `data-calque` à poser dans l'app

Ce n'est pas un défaut de rendu : c'est ce qui rend les défauts de rendu détectables.

Le calque v1 nommait des classes CSS côté app, devinées depuis la spec. L'app en emploie
d'autres. Résultat : § 2.1 et § 2.3 sont sortis « sans divergence » sur des cartes que
le script n'avait pas trouvées. **Un zéro obtenu sur un sélecteur vide.** Les deux
sections restent donc à vérifier : leur « conforme » du 06/08 ne vaut rien.

Corrigé des deux côtés : le calque ne connaît plus que `data-calque`, et un sélecteur
sans correspondance côté app est désormais compté comme une divergence.

**À poser dans le markup de l'app**, sur l'élément qui porte déjà la classe existante —
attribut ajouté, **aucune classe renommée, aucun CSS touché** :

| `data-calque` | Élément |
|---|---|
| `groove` | la gorge d'une ligne § 2.1 |
| `breach` | le segment franchi |
| `notch` | l'encoche de barrière |
| `vl-row` | une ligne de la carte VL |
| `vl-bar` | la barre d'écart, positive **et** négative |
| `vl-val` | la cellule qui porte la valeur chiffrée de l'écart |
| `risk-seg` | un segment de la barre empilée § 2.3 |
| `risk-chip` | une pastille de légende § 2.3 |

`risk-seg-label` n'est **pas** à poser : C4 dit qu'il n'existe aucune étiquette dans la
barre. Le calque compte cette ancre à zéro des deux côtés, c'est le test.

---

## C9 — § 2.1 · Couleur de la gorge : la maquette avait tort

**Constat.** Gorge de l'app `oklch(0.93415 0.01299 84.65)` (`--color-surface-sunk`,
conforme à `dashboard.md` § 2.1) ; gorge de la maquette `oklch(0.945 0.016 78)`.

**Arbitrage — l'app a raison, la maquette est corrigée.** Une gorge est un creux :
`--color-surface-sunk` est le token de rôle exact, et la spec le nommait déjà.
Ma maquette portait un littéral que je n'avais pas lu dans `design-tokens.css` —
la règle 2 de `CLAUDE.md`, violée par celui qui l'a écrite. **Rien à changer dans
l'app.** La maquette est à jour dans ce dossier.

---

## C10 — RETIRÉ. Ma maquette employait une couleur hors système.

**Ce que je demandais.** Un creux bas `inset 0 -3px 5px -3px` sur les segments de la
barre empilée, en `oklch(0.70 0.028 65)` — la valeur que rend ma maquette.

**Ce que la vérification a donné.** Aucun token de `design-tokens.css` ne porte cette
valeur. Comparaison programmatique de chaque token déclaré et dérivé, faite par
l'implémenteur : le plus proche, `--color-border-strong`, calcule à
`oklch(0.7312 0.01992 117.2)` — plus de 50° de teinte d'écart. Pas une correspondance.

**Arbitrage — la maquette a tort, l'app ne change pas.** La règle 2 de `CLAUDE.md` ne
souffre pas d'exception : zéro couleur inventée, uniquement des tokens de rôle. Un creux
que je ne peux pas nommer n'entre pas dans l'app, si joli soit-il. **Le creux est retiré
de la maquette** ; le segment garde son arête de division, qui suffit au relief.

C'était la bonne question à me poser, et la réponse n'est pas celle que j'espérais.
Demander à l'implémenteur de coder une valeur en dur parce que le designer y tient,
c'est précisément ce qui a produit le 05/08.

---

## C11 — § 2.3 · C4 n'est pas appliqué, et mon test ne pouvait pas le voir

**Constat.** Le pourcentage `85,2 %` est affiché **dans** la barre empilée. C4 le
interdit depuis le 06/08. Le calque sortait pourtant `0 = 0`.

**Cause — défaut de l'outil, à ma charge.** Le test comptait les éléments portant une
ancre `risk-seg-label` et exigeait le même nombre des deux côtés. Le pourcentage est un
**nœud texte direct** du segment, pas un élément dédié : le test prouvait l'absence
d'une balise que personne n'avait écrite, jamais l'absence du texte. Un contrôle qu'il
suffit de ne pas instrumenter pour passer ne contrôle rien.

**Corrigé dans le calque** : il lit désormais le texte des segments, pas leur balisage,
et cite le contenu fautif. L'ancre `risk-seg-label` n'existe plus dans le plan.

**Correction côté app — C4, inchangé :** aucune étiquette à l'intérieur de la barre
empilée, quelle que soit la largeur du segment, y compris la zone de rendement.
La légende porte déjà `85,2 %` trois lignes plus bas, en plus gros et mieux placé.
Un `title` par segment pour le survol.

---

## C12 — 06/08 (soir) · Seize divergences, toutes de ma maquette

**Constat.** Après la refonte de la maquette en app entière, le calque sort seize
divergences sur § 2.1, § 2.2 et § 2.3 : gorge 11 → 8 px, rayon 1 → 0, segment franchi
9 → 6 px et son anneau perdu, encoche 22 → 20 px et opacité 0,72 → 0,70, ligne VL
38 → 40 px et gap 16 → 14, barre d'écart 10 → 9 px et son arête de lumière perdue,
barre empilée 44 → 52 px.

**Arbitrage — l'app a raison sur les seize. Rien à coder.** Ces valeurs avaient été
arrêtées, mesurées et implémentées (C1, C4, C7). En redessinant la maquette de zéro
je les ai réécrites au jugé, sans intention de design derrière aucune d'elles. Une
passe esthétique qui déplace une géométrie spécifiée rouvre une décision fermée sans
le dire — c'est la faute du 05/08, commise une fois de plus par le même.

**La maquette est corrigée**, pas l'app. Le calque doit repasser à zéro sans qu'une
ligne de `dashboard.css` ou d'`app-dashboard.js` ne bouge.

> Ce que la refonte propose vraiment sur § 2 — colonnes du Top/Flop, densité, air
> autour des blocs — n'est pas dans ces seize lignes. Si on veut y toucher, ça se
> specifie et ça se décide ; ça ne se glisse pas dans un pixel.

---

## C5 — Hors § 2, relevé au passage · Portefeuille

La colonne « Distance protection » est coupée par le bord droit de la fenêtre à la
largeur de travail. À traiter dans la spec Portefeuille, **pas** dans cette passe :
signalé pour que ce ne soit pas découvert deux fois.

---

## Ce qui est validé et ne bouge plus

§ 2.4 gabarit de contrôles, § 2.1 rainure et plancher 1,6 %, cas limites A et B,
`sumExactly100`, les valeurs en points sans `%`. Le compteur d'événements manquant
trouvé et corrigé en cours de route : bien vu.

Le `rowHeight` § 2.2 à 37 px : **abandonné**, pas toléré. Avec C1/C3 la ligne est
retouchée de toute façon ; qu'elle retombe à 38 px à ce moment-là, sans correctif dédié.
Un pixel signalé plutôt que caché, c'est le comportement attendu — la réponse est que la
tolérance stricte s'appliquait à des invariants que je n'étais pas en train de rouvrir.
