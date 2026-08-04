# PASSE 8 — Direction visuelle, cohérence, et corrections transverses

**Nature de cette passe :** elle ne livre pas un écran, elle gouverne tous les
écrans. Les incohérences relevées (polices différentes, tailles bizarres,
descriptifs produit divergents, montants illisibles) ne sont pas des bugs
locaux : ce sont les symptômes d'une absence de système. On corrige la cause.

**Prérequis :** 7A, 7B, 7C, 7D livrés et déployés.
**Ordre d'exécution impératif :** §1 (tokens) → §2 (fiche produit unique) →
§3..§7 (corrections). Faire §3 avant §1 revient à re-styler deux fois.

**Discipline maintenue :** `?v=` bumpé pour chaque CSS touché dans le même
commit ; aucun `git push` sans demande explicite.

---

## §1 — Le système : encre sur papier, couleur réservée au risque

### 1.1 Typographie — pairing A « Éditorial »

| Rôle | Police | Usage |
|---|---|---|
| Titres, blocs de prose | **Newsreader** | titres de section, titres de tiroir, « Lecture CGP » |
| Interface | **Instrument Sans** | libellés, en-têtes de tableau, boutons, navigation |
| Chiffres | **IBM Plex Mono** | toute valeur numérique, sans exception |

Règles :

- **Trois familles, pas quatre.** Aucune autre police ne doit apparaître dans
  les feuilles. `grep` les `font-family` littéraux et les réduire à trois tokens
  (`--font-display`, `--font-ui`, `--font-mono`).
- **Tout nombre est en mono.** Montants, pourcentages, dates, scores, compteurs.
  C'est la règle qui rend l'app lisible en diagonale.
- **Échelle unique, 6 crans**, et rien entre les crans :

  `--text-xs 12px` · `--text-sm 14px` · `--text-base 16px` ·
  `--text-lg 20px` · `--text-xl 28px` · `--text-2xl 40px`

- **Zéro `font-size` littéral** hors définition des tokens. C'est ce point qui
  corrige les « polices différentes, tailles bizarres » du Decrement Score :
  ce n'était pas un défaut local mais l'absence d'échelle.
- Deux graisses par famille au maximum (400 / 600). Pas de 500, pas de 700.

### 1.2 Couleur — village méditerranéen en pleine lumière

Direction (réécrite le 01/08) : Cyclades, Sardaigne — le turquoise est le
sujet, pas un accent. Trois rôles, onze tokens, rien d'autre.

**La chaux porte les fonds.**
- `--chaux` — blanc chaud de mur à la chaux (`oklch(0.98 0.008 85)`)
- `--chaux-2` — en retrait (`oklch(0.955 0.012 80)`)
- `--rule` — filets (`oklch(0.88 0.012 80)`)
- `--encre` — texte, bleu de mer très profond, **jamais du noir**
  (`oklch(0.26 0.045 235)`)
- `--encre-2` — texte secondaire (`oklch(0.50 0.030 235)`)

**La mer porte l'interaction.** `--mer` (`oklch(0.62 0.13 205)`, turquoise
égéen franc) sur tout ce qui est actif, sélectionné ou cliquable : action
primaire (aplat plein, texte chaux), onglet courant, ligne sélectionnée, et
le repère de seuil de la réglette. `--mer-profonde` (`oklch(0.42 0.11 225)`)
au survol. `--lagune` (`oklch(0.93 0.035 200)`) en fond de sélection. Action
secondaire = filet `--rule` + texte `--encre`.

**La terre porte le risque.** `--olive` (`oklch(0.55 0.09 130)`) distance
confortable, `--ocre` (`oklch(0.68 0.13 75)`) sous surveillance,
`--terracotta` (`oklch(0.52 0.15 32)`) barrière franchie. Rien d'autre ne
porte ces tons.

Interdits :

1. Aucun violet, rose, jaune de statut, orange ni corail.
2. Aucun dégradé de fond, aucun aplat sombre pleine page — la lumière vient
   du blanc.
3. Les deltas de performance restent en encre (le signe et le mono
   suffisent).
4. Succès d'ingestion en encre, échec en `--terracotta`, avertissement en
   `--ocre` — pas de palette de statut séparée.

### 1.3 Grille éditoriale plutôt que cartes

- Séparation par **filet 1px `--rule` + gouttière**, non par boîte ombrée.
- Rayon de bordure : `2px` maximum. Pas de `12px`, pas de `16px`.
- **Aucune `box-shadow`** hors surfaces réellement flottantes (tiroir, menu).
- Densité : on lit un document, pas un tableau de bord.

### 1.4 La réglette de barrière — objet signature unique

Un seul composant, deux échelles, aucune variante :

| Échelle | Contexte | Contenu |
|---|---|---|
| `20px` | ligne de tableau | piste + repère de barrière + position |
| `200px` | tiroir | + valeur mono + étiquette de barrière |

Toute jauge de l'app (composantes Decrement incluses) utilise ce composant.
Si une jauge n'exprime pas une distance à un seuil, elle ne doit pas exister.

**Correction (05/08, avec §4) :** une troisième échelle « pleine largeur pour
Pilotage » figurait ici à tort. Ce qui occupe cet espace dans Pilotage n'est
pas une réglette : c'est la distribution du risque (§4), un nuage de points
multi-produits, pas une jauge à valeur unique. La réglette reste à deux
échelles ; la distribution du risque est un composant distinct.

Piste en `--chaux-2`, remplissage en ton de terre selon la distance
(`--olive`/`--ocre`/`--terracotta`), repère de seuil en `--mer` (réécrit le
01/08 avec §1.2).

### 1.5 Le chiffre porte toujours son échelle

Jamais de nombre nu. `98 / 100`, `2,53 pts/an`, `−18 % · barrière 60 %`,
`120 000 € · 2 versements`. Un nombre sans dénominateur ni unité n'informe
personne — c'est le défaut relevé sur le score Decrement affiché « 98 ».

---

## §2 — Fiche produit unique (non négociable)

Aujourd'hui le descriptif produit diffère selon qu'on l'ouvre depuis
Portefeuille, Barrières ou Calendrier. **Un seul composant, un seul jeu de
champs, aucune vue ne décide de ce qu'elle montre.**

Bloc unique, ordre imposé :

1. **Identité** — nom commercial, émetteur, ISIN, devise, type
   (Autocall / Phoenix / Reverse Convertible / Participation).
2. **Sous-jacent** — nom, niveau initial, niveau actuel, variation depuis
   l'origine.
3. **Barrières** — coupon, rappel, capital : chacune avec son niveau et la
   **distance actuelle**, en réglette 200px.
4. **Coupon** — taux, périodicité, **effet mémoire oui/non**, prochaine
   constatation.
5. **Échéancier** — constatations passées et à venir, statut de chacune.
6. **Position** — nominal investi, valorisation, plus/moins-value latente.

Contrainte technique : la vue passe un identifiant produit, rien d'autre. Si une
vue doit masquer un bloc, c'est une erreur de conception à me signaler avant de
coder.

---

## §3 — Calendrier : taxonomie des événements

Le calendrier est illisible parce qu'il mélange des natures d'événement
différentes et additionne ce qui ne s'additionne pas.

### 3.1 Quatre types d'événement, explicites

| Type | Flux | Ce qu'on affiche |
|---|---|---|
| `Constatation` | aucun | niveau requis, niveau actuel, distance. **Aucun montant.** |
| `Coupon` | oui | montant du coupon, acquis ou conditionnel |
| `Rappel` | oui | **capital remboursé + coupon = total** |
| `Maturité` | oui | capital remboursé (± perte en capital), + coupon final |

Chaque ligne d'événement porte son type en libellé. **Un montant n'apparaît que
s'il y a flux, et toujours étiqueté.** Une constatation sans flux n'affiche
jamais de montant — c'est la confusion actuelle.

### 3.2 Rappel anticipé : trois montants, pas un

Le bug relevé : un rappel d'autocall n'affiche que le coupon. Un rappel verse
**capital + coupon**. La ligne doit montrer les trois valeurs, le total en gras
mono. Idem pour la maturité.

### 3.3 « Attendus » et « payés » ne sont jamais dans la même mesure

La carte « Coupons attendus et payés » avec un seul montant est incohérente :
*attendus* est du futur, *payés* est du passé. Deux mesures distinctes, jamais
additionnées, jamais dans le même chiffre. Le KPI de la bande « Prochains
30 jours » ne porte que les **attendus** (c'est une bande prospective). Le
cumulé payé, s'il est utile, vit ailleurs et se nomme autrement.

### 3.4 « Date de référence » → « Valorisation au »

Le libellé actuel ne dit pas ce qu'il fait. C'est la date à laquelle tous les
encours, performances et distances sont calculés. Renommer en
**« Valorisation au »**, date affichée en clair à côté du libellé, et une ligne
d'aide : « recalcule le portefeuille tel qu'il était à cette date ».

### 3.5 Anneau de focus débordant

Le cadre bleu mal placé sur le dernier événement est très probablement un
`outline` débordant d'un conteneur en `overflow:hidden`. Corriger avec
`outline-offset` négatif ou en déplaçant l'anneau sur l'élément intérieur — et
la couleur de focus passe en `--ink`, pas en bleu (cf. §1.2).

### 3.6 Constaté le 02/08 : des Constatations affichent encore un montant

Capture d'écran (mode Année, écran Calendrier) : « Levier FTSE 100 - Dec 2027
— Constatation barriere » et « Levier SBF 120 - Fev 2026 — Constatation
barriere » affichent toutes deux `0,0 %` en bout de ligne. C'est exactement
l'exemple donné en §3.1 — une constatation ne doit **jamais** afficher de
montant. Pas encore corrigé (repéré en marge du correctif format de nombres,
pas dans le périmètre de cette passe-là). À traiter avec §3.1 quand le
calendrier sera repris.

---

## §4 — Barrières : le doublon « Distribution du risque »

Ne pas supprimer : la distribution a du sens à côté des barrières. Mais une
seule version travaillable.

- **Dans Barrières** — mini-graphe, hauteur ~120px, sans axes, non interactif,
  suivi d'un lien texte « Voir dans Pilotage ».
- **Dans Pilotage** — la version complète, seule interactive.

Un seul module de calcul alimente les deux.

---

## §5 — Decrement Score mis en avant

Dans le tiroir du sous-jacent, l'en-tête devient :

- la **pastille d'avis** en `--text-lg`, premier élément lu ;
- dessous, **`98 / 100`** en mono — le dénominateur est obligatoire, jamais
  `98` seul ;
- puis le nom du sous-jacent et son type.

Les cinq jauges de composantes passent sur la réglette de §1.4.

---

## §6 — Dossier client : bloc Identité + KPI d'adéquation

### 6.1 Bloc Identité (nouveau, en tête du dossier)

Nom · Prénom (ou Raison sociale) · Adresse · Email · Téléphone ·
**Patrimoine total déclaré**. Les commentaires existants restent inchangés.
Champs éditables en place, mêmes contrôles que le reste de l'app.

### 6.2 KPI « Part du patrimoine en structurés »

Encours en produits structurés ÷ patrimoine total déclaré, en pourcentage.
Quatrième KPI de la rangée du dossier.

Ce n'est pas un indicateur décoratif : c'est la mesure d'adéquation que le CGP
doit documenter en DDA. Deux exigences :

- si le patrimoine déclaré est absent, le KPI affiche **« non renseigné »** —
  jamais `0 %`, jamais `—` : l'absence de donnée est une information ;
- au-delà d'un seuil paramétrable (défaut 25 %), le pourcentage prend
  `--watch`. C'est un des rares usages légitimes de la couleur hors barrière,
  parce qu'il exprime lui aussi un risque de concentration.

---

## §7 — Documentation produits structurés (entrée de matière)

L'utilisateur dispose d'une documentation abondante (term sheets, DIC/KID,
échéanciers, notices d'indices à décrément). Procédure :

1. Les documents arrivent dans `uploads/`.
2. Ils ne sont **jamais** lus directement par le code applicatif.
3. Ils sont synthétisés dans un fichier de référence unique,
   `handoff 7/REFERENCE-PRODUITS.md` : vocabulaire exact, champs d'une fiche
   produit, mentions obligatoires, conventions de calcul.
4. Le code ne s'appuie que sur ce fichier de référence.

Priorité de lecture : term sheets (vocabulaire et champs) → échéancier réel
(logique acquis/conditionnel) → notice de décrément (points fixes vs % annuel) →
DIC/KID (mentions obligatoires) → rapport d'adéquation type (ce que « Lecture
CGP » doit produire).

---

## Checklist de sortie

- [ ] Trois familles de polices, zéro `font-family` littéral hors tokens.
- [ ] Zéro `font-size` littéral hors définition des 6 crans.
- [ ] Tout nombre en mono, toujours accompagné de son unité ou dénominateur.
- [ ] Aucun bouton, en-tête, carte ou navigation coloré ; couleur réservée au risque.
- [ ] Aucun dégradé de fond ; rayon ≤ 2px ; aucune ombre hors surfaces flottantes.
- [x] Réglette unique en deux échelles ; aucune autre famille de jauge.
- [ ] Fiche produit identique depuis Portefeuille, Barrières et Calendrier.
- [ ] Quatre types d'événement au calendrier ; montant seulement s'il y a flux.
- [ ] Rappel et maturité affichent capital + coupon + total.
- [ ] « Attendus » et « payés » jamais dans la même mesure.
- [x] « Valorisation au » remplace « Date de référence », date en clair.
- [x] Anneau de focus contenu, en `--ink`.
- [x] Distribution du risque : mini-graphe en Barrières + renvoi vers Pilotage.
- [ ] Score Decrement en `98 / 100`, pastille d'avis en tête du tiroir.
- [ ] Bloc Identité complet ; KPI part du patrimoine avec état « non renseigné ».
- [ ] `?v=` bumpé pour chaque CSS touché, même commit.
- [ ] `npm test` vert. Rien poussé sans demande.
