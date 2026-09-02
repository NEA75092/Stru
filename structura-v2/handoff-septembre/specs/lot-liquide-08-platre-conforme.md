# lot-liquide-08-platre-conforme — le plâtre devient celui de la maquette

Version 1 · 02/09/2026 · dépend de `specs/00-doctrine-liquide.md` (L1, L2, L4) et de
`specs/lot-liquide-07-vide-et-fenetre-mois.md` (`999468a`), qui a clos le premier plan.
**Ce lot finit le Dashboard.** Il n'y a pas d'écran suivant avant lui.

Source unique : `handoff-septembre/maquette/Dashboard - Liquide.dc.html`, l. 246-330 (le
`div` commenté « le plâtre : dalles mates, jamais de verre »). **Toutes les valeurs
ci-dessous sont relevées là.** Si une valeur manque ici, elle est dans la maquette :
relève-la, ne l'invente pas.

## 0. Arrête-toi si — la liste complète, en tête

Tout ce sur quoi ce lot pourrait être ambigu, rassemblé ici. **Si l'un de ces cas se
présente, arrête-toi, nomme-le, et ne comble pas.** Il n'y en a pas d'autre dans le
document.

| # | Cas | Ce que tu fais |
|---|---|---|
| 1 | un token du § 6 n'existe pas au dépôt (`--dalle-a/b/c`, `--rail`, `--trait`, `--survol`, `--encre-2`, `--encre-3`, `--em-l`, `--em-c`) | tu le nommes. Tu ne le crées pas, tu ne le remplaces pas par un littéral |
| 2 | `renderIssuerExposure` ne donne pas la part du premier émetteur ou le nombre de groupes (§ 4.1) | tu nommes le champ manquant |
| 3 | `renderVlTopFlop` ne donne pas `p.barrier` par ligne, ou `p.st.s` pour compter les « sous barrière » (§ 4.2) | tu le nommes |
| 4 | `buildProductCalendarEvents()` ne permet pas de filtrer sur la semaine en cours (§ 4.3) | tu le nommes. Tu ne touches à aucun fichier de calendrier |
| 5 | le sigle émetteur | **levé** : aucun champ `sigle` au dépôt, le § 4 ter donne la pastille à `id`. Tu ne t'arrêtes pas |
| 6 | la sortie de `.kpi-row` du Dashboard casse un autre écran (§ 5) | tu t'arrêtes : les règles `.kpi*` doivent rester au dépôt |
| 7 | `16.5px` ou `44px` n'ont pas de `--text-*` | ils restent littéraux, tu ne t'arrêtes pas (précédent du `17.5px`, LOT 7) |
| 8 | l'odomètre (§ 4 bis) | plus d'ambiguïté : `setTextFlash` n'est pas un odomètre, le § 4 bis donne la décision. Tu ne t'arrêtes pas |

## 1. Le défaut

Le premier plan est conforme depuis `999468a`. Sous la nappe, l'écran porte encore
l'anatomie d'avant Liquide : quatre cartes KPI à filet gauche coloré, une dalle de
performance, puis « Sous la protection du capital », « Top / Flop VL » et « Exposition
par groupe bancaire » posés **à nu sur le fond** — ni dalle, ni rayon, ni fond mat.

La maquette n'a rien de tout cela. Elle a **trois dalles mates, en trois colonnes
égales**, chacune bâtie sur le même patron. Le plâtre n'a jamais été implémenté : les
LOT 5 à 7 n'ont traité que l'eau et le premier plan.

## 2. La grille du plâtre

Le conteneur est déjà juste depuis le LOT 7 (`margin: 54px 28px`). Il reçoit la grille :

```
display: grid
grid-template-columns: repeat(3, minmax(0, 1fr))
gap: 22px
align-items: start
```

Les trois dalles sont ses seuls enfants directs, dans cet ordre, avec leur entrée
décalée (`animation: colonne 700ms var(--ease)`, délais `0ms`, `90ms`, `180ms`).

## 3. Le patron de dalle — identique pour les trois

Aucune des trois n'a de bordure, aucune n'a de verre (L1), aucune n'a d'ombre (R5).

```
padding: 34px · border-radius: var(--r-dalle) · background: var(--dalle-a|b|c)
display: flex · flex-direction: column · gap: 34px
transition: transform 280ms var(--ease) · hover → translateY(-3px)
```

Contenu, dans cet ordre, pour les trois :

1. **titre** — `h2`, Jost 500, 16.5px, letter-spacing .004em, encre, `margin: 0` ;
2. **le grand chiffre** — Jost 300, **44px**, letter-spacing -.01em, tabular-nums, encre,
   suivi sur la même ligne de base (`gap: 9px`) d'une phrase de contexte en 14px
   `--encre-2`. L'unité (`%`) est un `span` en Instrument Sans 13px `--encre-3` : elle
   n'est pas à la taille du chiffre ;
3. **le corps** — propre à chaque dalle, § 4 ;
4. **le pied** — un `button` pleine largeur, `min-height: 44px`,
   `margin-top: 26px; padding: 18px 0 0`, `border-top: 1px solid var(--trait)`, libellé
   13px `--encre-2` à gauche, chevron sortant 14px à droite. C'est un `button`, jamais
   un `div` cliquable.

## 4. Les trois dalles, et d'où viennent leurs données

**Règle de ce lot, comme au LOT 6 § 6 bis : aucune donnée inventée, aucune série
nouvelle.** Chaque dalle réemploie un fait que l'app produit déjà. Les trois ont leur
source ; si l'une ne l'avait pas, elle ne serait pas dans ce lot.

### 4.1 · `--dalle-a` — « Concentration émetteurs »

Source : `renderIssuerExposure()` (`app-dashboard.js`), déjà groupée par
`bankGroupName()` et triée par nominal. Rien à recalculer.

- grand chiffre : **part du premier émetteur**, en % de l'encours ; contexte :
  « au premier émetteur · {N} au total », N = nombre de groupes ;
- corps : cinq lignes `gap: 18px`. Par ligne : pastille ronde 7px à la teinte de marque,
  nom (14px, ellipsis), montant (11.5px `--encre-2`) et part (14px) alignés à droite,
  puis une jauge `height: 2px` sur `--rail` remplie à la part réelle
  (`animation: jauge 900ms var(--ease) 320ms`) ;
- une ligne de total avant le pied : « Les deux premiers » + la somme des deux parts ;
- pied : « Voir les {N} émetteurs ».

**La couleur de marque n'est jamais peinte brute** (règle du CLAUDE.md) : on n'en garde
que la teinte, posée sur `--em-l` / `--em-c`. Le mécanisme existe déjà côté code
(`issuerBrandClass` + les classes `.issuer-<id>`), il ne change pas.

### 4.2 · `--dalle-b` — « Top / Flop produits »

Source : `renderVlTopFlop()`, qui classe déjà tous les produits par VL. La sélection
Top 5 / Flop 5 existe ; ce lot lui ajoute la **bascule** de la maquette au lieu d'une
liste unique de dix.

- grand chiffre : **VL moyenne** du périmètre ; contexte : « VL moyenne · {N} sous
  barrière », N compté sur `p.st.s` (le champ existant), pas sur un seuil réécrit ;
- bascule : deux `button` `Top 5` / `Flop 5` dans un segment `--rail`, rayon
  `var(--r-plein)`, `padding: 7px 16px`, l'actif en `aria-pressed` ;
- corps : cinq lignes. Par ligne : **la pastille d'émetteur** (§ 4 ter), nom, VL, écart
  teinté, puis une jauge `height: 3px` sur
  `--rail` **et le repère de barrière** — filet 1.5px `--encre-2`, débord 4px haut et bas.

**Le repère est par ligne, pas partagé — et c'est un écart de modèle que je tranche
ici.** La maquette n'a qu'une barrière (`BARRIERE = 70`, une constante de démo) et pose
donc un seul repère à la même abscisse pour les dix lignes. L'app, elle, porte **une
barrière par produit** (`p.barrier`, en % du spot initial : les trois positions à l'écran
valent 74, 57 et 59). Un repère unique serait donc faux pour neuf lignes sur dix.

Chaque ligne porte son repère, à `p.barrier / VL_MAX * 100`, sur la même échelle que sa
jauge. **Un produit sans barrière** (capital garanti : `p.st.s === "none"`, sentinelle
`dist = 999` d'`app-state.js`) **n'a pas de repère** — pas de repère à 0, pas de repère
au bord : rien. Un seuil qui n'a rien à comparer n'encode rien, c'est déjà la règle de
`renderGauge` (`app-utils.js`).

`VL_MAX = 150` est le plafond de l'échelle, relevé dans la maquette : **une seule
déclaration**, lue par les jauges et par les repères. C'est lui qui rend les dix lignes
comparables d'un rendu à l'autre — un domaine recalculé sur les lignes affichées ferait
bouger l'échelle à chaque bascule Top/Flop ;
- pied : le libellé suit la vue active.

Le repère de barrière et la trame d'encre des écarts de VL sont deux choses que le code
a eu **raison** de faire (CLAUDE.md) : leur mécanisme est conservé tel quel, seule la
boîte autour change.

### 4.3 · `--dalle-c` — « Événements de la semaine »

Source : `buildProductCalendarEvents()`, le même global que la carte d'agenda du premier
plan (LOT 6, garde-fou nº 2) — filtré sur la semaine en cours. Aucun fichier de
calendrier n'est touché.

- grand chiffre : **nombre d'événements de la semaine**, dérivé de la liste, jamais
  écrit ; contexte : « cette semaine » ;
- corps : une ligne par événement (`min-height: 44px`, survol `--survol`), en trois
  colonnes `44px minmax(0,1fr) auto` : jour court + date en Jost, puis **la pastille
  d'émetteur** (§ 4 ter) + titre + détail, puis le montant à droite ;
- pied : « Ouvrir l'agenda ».

**Si la semaine est vide, la dalle affiche `0` et son corps est vide** — c'est
l'information, pas un bug. Aucun contenu de remplissage.

## 4 ter. La pastille d'émetteur — le sigle n'existe pas au dépôt

Vérifié dans `src/issuer-registry.js` : les 17 entrées portent `id`, `label`,
`brandColor`, `aliases`, `officialSources`, `fieldExtractors`. **Aucun champ `sigle`.**
Les sigles de deux lettres de la maquette (`BP`, `SG`, `NX`…) sont écrits à la main dans
son registre de démo ; les dériver d'un `label` produirait des abréviations fausses.

On emploie donc l'identifiant qui existe : le `id` du registre — `BNP`, `SG`, `MS`,
`JPM`, `NATIXIS`, `CACIB`, `UNICREDIT`… **la même table** que les couleurs de marque,
déjà lue par `issuerBrandClass`. De 2 à 9 caractères ne tenant pas dans un disque de
28px, le disque devient une pastille à largeur automatique :

```
height: 28px · min-width: 28px · padding: 0 10px
border-radius: var(--r-plein) · border: 1px solid var(--trait) · background: transparent
Jost 11.5px · letter-spacing .02em · line-height 1 · color var(--encre-2) · nowrap
```

Encre uniquement, **jamais la couleur de marque** : la teinte d'émetteur ne vit que dans
`--dalle-a`, où les lignes se comparent entre elles.

La première colonne des lignes concernées passe de `28px` à `auto` ; le reste de la
géométrie (`min-height: 44px`, gap 13) ne bouge pas.

**Émetteur hors registre** (`bankGroupName` retombe sur le libellé brut, ou « Émetteur à
confirmer ») : **pas de pastille du tout.** Ni tiret, ni initiale, ni point
d'interrogation — le nom du produit porte déjà l'information.

Si les deux lettres sont voulues, c'est une décision de donnée : ajouter un champ
`sigle` aux 17 entrées du registre, à la main, dans un lot séparé. Hors périmètre ici.

## 4 bis. L'odomètre des trois grands chiffres

**Correction de ce que ce document disait en v1, et c'était faux** : j'écrivais de
réemployer `setTextFlash`. Je l'ai relu au dépôt (`app-utils.js` l. 278 → `flashText`) :
ce n'est pas un odomètre, c'est un **flash de fond sémantique** au changement de valeur.
Il ne compte pas, il ne dure pas 900 ms, il n'interpole rien. Aucun odomètre n'existe au
dépôt. Tu n'as donc pas à t'arrêter sur ce point : voici la décision.

Une seule `requestAnimationFrame` dans `app-dashboard.js`, au premier rendu du Dashboard
et **une seule fois** (pas à chaque `renderDashboardModules`) :

```
durée   900 ms
courbe  p → 1 - (1-p)^4        (la courbe de la maquette, l. 476)
cibles  les trois grands chiffres, lus depuis la même progression
arrêt   à p = 1, la valeur affichée est la valeur exacte, jamais un arrondi de la montée
```

Trois exigences :

- **une boucle, trois cibles.** Pas trois animations indépendantes.
- **la valeur finale est la vraie valeur.** La montée ne doit jamais laisser un chiffre
  à 99 % de sa valeur : le dernier pas écrit la valeur formatée normalement.
- **`prefers-reduced-motion` coupe la montée** et affiche la valeur finale
  immédiatement. Le coupe-circuit de `relief.css` ne couvre que le CSS ; une boucle JS
  doit tester `matchMedia` elle-même.

Aucun autre chiffre de l'écran ne monte : ni les parts, ni les VL, ni les montants.

## 5. Ce qui disparaît, et ce que je garde contre la maquette

À nommer explicitement, parce que c'est du contenu qui sort de l'écran.

**Sortent — la maquette ne les a pas, et aucun de leurs chiffres n'est perdu :**

- **la rangée de quatre KPI** (`.kpi-row` du Dashboard, `.kpi`, `.kpi-lbl/-val/-sub`, les
  filets `k-red`/`k-orange`). Ses quatre nombres réapparaissent tous ailleurs :
  performance latente → dalle de performance ; barrières franchies et sous surveillance →
  la carte « À regarder aujourd'hui » du premier plan, déjà à l'écran ; nombre de
  produits et d'émetteurs → la ligne de contexte de `--dalle-a`. **Rien à réécrire.**
  Les règles `.kpi*` restent au dépôt : Barrières, Pilotage, Clients et Calendrier les
  consomment (`.kpi-row-accent-top`, `.cal-kpi-row`, `.dr-kpi-row`). Seul l'usage
  Dashboard sort — et `bindKpiTilt()`, qui ciblait `#view-dashboard .kpi.tilt`, devient
  du code mort : il sort aussi.

**Restent, et je l'assume contre la maquette :**

- **la dalle de performance du portefeuille** (`.dash-perf-section`). Le LOT 5 l'a
  descendue dans le plâtre exprès, elle est déjà peinte en dalle mate, et c'est le seul
  endroit de l'app qui porte l'historique complet avec ses fenêtres YTD/6M/1A.
- **« Sous la protection du capital »** (`.cap-*`, la règle graduée −60/+20). C'est la
  figure signature tranchée le 05/08 (D2) et spécifiée par `dashboard.md` § 2.1 ; la
  maquette n'en propose aucun remplacement.

Les deux passent **sous** la grille des trois dalles, pleine largeur, chacune dans une
dalle du même patron que le § 3 (`--dalle-a`, padding 34, rayon `--r-dalle`, survol
`translateY(-3px)`) — la boîte devient conforme même si le bloc n'est pas dans la
maquette. Le plâtre a donc trois enfants : la grille de trois, puis ces deux dalles.

**Si tu veux les voir sortir aussi, dis-le et je le fais dans le même lot** : c'est le
seul point de ce document que je ne peux pas trancher à ta place, parce qu'il oppose la
maquette à une spec de comportement d'écran. Je ne le rouvre pas autrement.

## 6. Tokens

Même discipline qu'au LOT 6 : **on traduit vers l'alias déclaré quand il existe**
(`--r-dalle` → `--radius-lg`, etc.), et on consomme en couche 1 les tokens Liquide sans
alias (`--dalle-a/b/c`, `--rail`, `--trait`, `--survol`, `--encre-2`, `--encre-3`,
`--em-l`, `--em-c`). **Zéro couleur inventée. Zéro token nouveau.** Si un token nommé ici
n'existe pas au dépôt, **arrête-toi et nomme-le** — ne le crée pas, ne le remplace pas
par un littéral.

`16.5px` et `44px` : si aucun `--text-*` ne vaut ces valeurs, elles restent littérales,
même précédent que le `17.5px` du LOT 7.

## 7. Périmètre

`src/dashboard.css`, `index.html` (les trois dalles + retrait de `.kpi-row` du
Dashboard), `src/modules/app-dashboard.js` (les trois rendus, retrait de `bindKpiTilt`),
`src/relief.css` **seulement si** la cascade d'entrée doit suivre les trois colonnes,
bump `?v=`. Rien d'autre : aucun fichier de calendrier, aucun autre écran.

## 8. Preuves

`preuve-liquide --lot 8`, statiques :

1. zéro `backdrop-filter` sous un sélecteur du plâtre (régression L1) ;
2. zéro `box-shadow` ajouté (R5) ;
3. les trois dalles portent `--dalle-a`, `--dalle-b`, `--dalle-c` — trois fonds
   distincts, pas trois fois le même ;
4. aucun `.kpi` sous `#view-dashboard` dans `index.html` ; aucune occurrence de
   `bindKpiTilt` au dépôt ;
5. aucun rayon hors des quatre valeurs de l'échelle ;
6. tout élément cliquable des trois dalles est un `button` (zéro `div` avec
   `cursor: pointer` sous le plâtre).

**Et deux preuves de géométrie mesurées en DOM**, comme au LOT 7 bis — c'est ce qui a
manqué au LOT 7 :

7. la grille du plâtre a exactement **trois** colonnes de largeur égale à ±1 px ;
8. chaque pied de dalle a une hauteur de cible ≥ 44 px.

Mesures à rapporter, 1600 px, jour et nuit : haut de la première dalle = 694 · trois
colonnes égales · gap 22 · zéro `backdrop-filter` au-delà de 640 · le repère de barrière
de `--dalle-b` à la position dérivée de `BARRIERE` · le grand chiffre de `--dalle-c` égal
au nombre de lignes rendues.
