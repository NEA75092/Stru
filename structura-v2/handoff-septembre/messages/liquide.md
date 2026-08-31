# Liquide — protocole complet pour Claude Code

Tout ce que Claude Code doit faire est ici. **Une seule chose à lui dire**, une fois
les fichiers commités et poussés :

> Lis `structura-v2/handoff-septembre/messages/liquide.md` et applique le LOT 0,
> puis le LOT 1. Arrête-toi au point d'arrêt.

Puis, après lecture du rapport :

> Applique le LOT 2.

Puis, après lecture des captures :

> Applique le correctif LOT 2 : `specs/lot-liquide-02b-correctif-nappe.md`.

Puis, après validation :

> Applique le LOT 3.

Puis :

> Applique le LOT 4.

---

## Où se lancent les sondes

`check-tokens.mjs` se lance **depuis `structura-v2/`**, pas depuis la racine du
dépôt : depuis la racine il ne trouve pas `src/design-tokens.css` et sort **0** —
un faux vert. Les deux autres se lancent depuis la racine.

```bash
cd structura-v2 && node handoff-septembre/tools/check-tokens.mjs; cd ..
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot N
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

## Vocabulaire : la doctrine nomme, le code sélectionne

Le rail de navigation s'appelle `.sidebar` dans le code, ses items `.nav-tab`. La
couche 1 des rayons se nomme `--r-*` dans la doctrine ; les écrans consomment la
couche d'alias `--radius-*`. Une sonde s'écrit toujours sur le sélecteur et sur le
nom d'alias, jamais sur le mot de la doctrine — deux lots de faux vert ont été
payés pour l'apprendre (31/08).

---

## Règles qui valent pour les trois lots

1. **Rien de structurel ne change. Seule la peinture change.** Mêmes onglets, mêmes
   outils, même DOM, mêmes fonctionnalités, même logique JS.
2. **Un lot = une liste de fichiers autorisés.** Si un fichier hors liste doit
   changer, **arrête-toi et dis-le**. Ne le change pas « juste pour que ça marche ».
3. **S'il manque une valeur, ne l'invente pas.** Arrête-toi et demande. Une valeur
   inventée passe les sondes et se voit six semaines plus tard.
4. **Ne redessine aucune icône, aucun tracé SVG existant.** C'est la panne du 06/08
   et du 19/08, signalée deux fois.
5. Un lot se termine par : sonde verte, `?v=` bumpé, **commit poussé**, rapport.
   Un lot non poussé n'est pas clos, même si tout est vert et que l'ordre
   d'exécution du message a oublié de le dire.
6. **Les captures ne sont pas optionnelles.** Sans elles je ne peux pas juger le
   rendu, et le lot n'est pas clos.

À lire avant de commencer, depuis la racine du dépôt :

```
structura-v2/handoff-septembre/00-LIRE-EN-PREMIER.md
structura-v2/handoff-septembre/specs/00-doctrine-liquide.md
structura-v2/handoff-septembre/specs/design-tokens-v3-liquide.md
structura-v2/handoff-septembre/specs/lot-liquide-02-coquille.md
structura-v2/handoff-septembre/specs/lot-liquide-02b-correctif-nappe.md
structura-v2/handoff-septembre/specs/lot-liquide-03-dette.md
structura-v2/handoff-septembre/specs/lot-liquide-04-verre-dashboard.md
```

---

# LOT 0 — ménage

Le dépôt porte encore les specs de la direction Méditerranée. Elles se citent
l'une l'autre : elles doivent partir **ensemble**, sinon `check-sources.mjs` vire
rouge sur des citations pendantes.

```bash
bash structura-v2/handoff-septembre/tools/menage-liquide.sh --dry-run
bash structura-v2/handoff-septembre/tools/menage-liquide.sh
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Le script s'arrête tout seul s'il reste une citation pendante. Dans ce cas :
réécris la citation vers la spec Liquide correspondante, **ne recrée pas le
document supprimé**.

Commit à part, message : `ménage : sortie des specs Méditerranée périmées`.

**Suppression et non archivage.** L'historique git est l'archive — un dossier
`archive/` laisse les documents à portée de `grep`, donc d'erreur (doctrine 11/08).

---

# LOT 1 — la couche de tokens

Spec : `specs/design-tokens-v3-liquide.md`.

## Le principe

L'app consomme trente et un noms `--color-*`, six `--radius-*`, cinq `--shadow-*`,
trois `--font-*` et six `--text-*`. **Ces noms restent.** Tu réécris uniquement ce
vers quoi ils pointent. Toute l'app se repeint depuis un seul fichier, sans qu'un
seul écran soit édité.

## Fichiers autorisés — exactement deux

| Fichier | Changement |
|---|---|
| `structura-v2/src/design-tokens.css` | réécrit selon §§ 2 à 5 |
| `structura-v2/index.html` | **uniquement** les trois lignes de police du § 6 |

Plus la whitelist de `tools/check-tokens.mjs`.

## Interdits

- Éditer un fichier d'écran.
- Écrire un littéral de couleur dans la couche 2 du § 4.
- Renommer `data-theme="dark"`.
- Inventer un token.

## Preuve

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 1
node structura-v2/handoff-septembre/tools/check-tokens.mjs
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

`preuve-liquide.mjs` remplit seul la table du § 8 et sort 1 si une preuve échoue.
Il imprime aussi, en fin de sortie, **le comptage des couleurs écrites en dur par
fichier d'écran** — c'est la réponse à la seule question ouverte du lot. Ne les
corrige pas, donne juste le chiffre.

## ⛔ POINT D'ARRÊT

Après le commit poussé, **arrête-toi** et rends :

- la sortie brute des trois commandes ci-dessus ;
- le sha poussé ;
- **des captures 1600 px, jour et nuit, du Dashboard et de trois autres onglets.**

Les captures des autres onglets sont le cœur de la preuve : elles montrent que le
remappage a repeint des écrans que personne n'a touchés. Si un onglet ressort
illisible, c'est un alias mal ciblé au § 4 — un seul fichier à corriger.

**Ne commence pas le lot 2 sans validation.**

---

# LOT 2 — la coquille

Spec : `specs/lot-liquide-02-coquille.md`.

## Fichiers autorisés — exactement deux

| Fichier | Changement |
|---|---|
| `structura-v2/src/shell.css` | réécrit — cadre, rail, nappe, animations |
| `structura-v2/index.html` | **une seule** addition de DOM : le bloc `.nappe` du § 4 |

## Ce qui ne bouge pas, et que je vérifierai au diff

Les neuf onglets et leurs libellés · **les neuf tracés d'icônes au caractère près**
· le pied du rail · la barre basse · le badge de compteur · toute la logique JS.

## La divergence de marque — ne pas trancher

La maquette porte GUERFIN, le dépôt porte Structura, et `guerfin-symbole-clair.png`
n'existe pas au dépôt. Emploie `assets/structura-mark.png` avec le mot
« STRUCTURA » aux métriques du § 3, et **signale-le dans le rapport**. C'est une
décision client, pas d'implémentation.

## Preuve

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 2
node structura-v2/handoff-septembre/tools/check-tokens.mjs
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Le lot 2 ajoute quatre contrôles : nappe à 640 px, rail à 236 px,
`prefers-reduced-motion` présent, et **diff des attributs `d=` des icônes, qui doit
être vide**.

Rapport : sorties brutes, sha, hauteurs DOM des neuf items de nav (≥ 44 px chacun),
et **captures 1600 px jour + nuit de Dashboard, Clients, Calendrier, Pitch Engine.**

---

# LOT 3 — la dette de relief

Spec : `specs/lot-liquide-03-dette.md`.

Le LOT 1 a compté ce que la direction Liquide interdit et qui traîne encore dans les
écrans : douze `box-shadow`, deux rayons littéraux, quatre polices mortes, un token
supprimé encore référencé. Aucun n'est causé par les lots précédents. Tant qu'ils sont
là, huit écrans sur neuf contredisent la doctrine.

Ce lot est **mécanique, pas créatif** : aucune décision de design à prendre, chaque
remplacement est prescrit à la ligne dans la spec. Il vient **après** le LOT 2 pour ne
pas entrer en collision avec la réécriture de `shell.css`.

## Preuve

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 3
node structura-v2/handoff-septembre/tools/check-tokens.mjs
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Les quatre compteurs du LOT 1 (`box-shadow`, rayons littéraux, `Newsreader / IBM Plex`,
tokens supprimés) doivent tous sortir à **zéro**. C'est la définition de fin du lot.

Rapport : sorties brutes, sha, et captures 1600 px jour + nuit des **neuf** onglets.
À ce lot-là je veux tout, parce que c'est le premier moment où l'app entière est censée
être cohérente.

---

# CORRECTIF LOT 2 — l'eau n'est que sur le Dashboard

Spec : `specs/lot-liquide-02b-correctif-nappe.md`.

Le LOT 2 a posé la nappe sous les neuf écrans. Elle ne doit vivre que sous le
Dashboard : ailleurs, elle met de la donnée dense sur un dégradé et tue trois
légendes au contraste. **Erreur de découpage de ma spec, pas de l'implémentation.**

Deux fichiers : `src/shell.css` (conditionnement) et `index.html` (bump `?v=` seul).
La preuve supplémentaire est une mesure DOM : hauteur de `.nappe` à 0 — ou élément
absent — sur un écran non-Dashboard.

---

# LOT 4 — le verre du Dashboard

Spec : `specs/lot-liquide-04-verre-dashboard.md`.

Le hero et les quatre KPI flottent au-dessus de l'eau et sont restés mats. La
doctrine leur donne droit au verre — et à eux seuls. Un fichier : `src/dashboard.css`.

Les valeurs des deux niveaux de verre sont relevées sur la maquette dans la spec.
**Elles ne s'écrivent pas en clair dans le CSS** : si un token manque, arrête-toi et
dis lequel.

---

## Pourquoi trois lots et pas un

Le lot 1 ne touche aucun écran : s'il casse quelque chose, la cause est forcément
un alias, dans cent lignes. Le lot 2 ne touche aucun contenu : s'il casse quelque
chose, c'est la coquille. Un lot unique mélangerait les deux causes et coûterait
les six allers-retours de l'épisode `check-sources` du 11/08.

## Ce qui n'est pas au dépôt et devrait y être

`Dashboard - Liquide.dc.html`, la maquette de référence. Tant qu'elle n'est pas
dans `structura-v2/handoff-septembre/maquette/`, `calque.mjs` ne peut rien mesurer
et les specs sont la seule source. Elles sont écrites pour suffire, mais une sonde
vaut mieux qu'une relecture.
