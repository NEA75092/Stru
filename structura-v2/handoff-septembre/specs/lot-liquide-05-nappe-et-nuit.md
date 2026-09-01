# lot-liquide-05-nappe-et-nuit — l'eau finit bien, et elle existe en nuit

Version 3 · 01/09/2026 · dépend de `specs/00-doctrine-liquide.md` (L1, L2, L8) et de
`specs/design-tokens-v3-liquide.md`. S'applique **après** le LOT 3 et **avant** le
LOT 4 : poser du verre sur une eau qu'on va refaire, c'est le faire deux fois.

Constaté sur les captures 1600 px jour + nuit du 31/08, après `d67c22b`.
La v2 intègre la mesure du § 2, qui a infirmé l'hypothèse de la v1 sur l'arête jour.

## 1. Les trois défauts

**D1 — Deux libellés vivent sur l'eau.** « Performance du portefeuille » et son
kicker de droite (« ENCOURS INITIAL VS VALORISATION · PERFORMANCE SUR LA PÉRIODE »)
sont posés dans la nappe. Le kicker est illisible en jour comme en nuit. L1 est
formel : rien d'informatif ne vit sur l'eau **sauf** le titre de l'écran et les
cartes de verre. La maquette n'a aucun libellé entre le premier plan (l. 158) et le
plâtre (l. 244) — ce couple est une invention du code.

**D2 — La carte du graphe est à cheval sur les 640 px.** Elle commence dans l'eau et
finit dans le plâtre. Ce n'est pas un défaut de peinture : c'est un bloc rangé dans le
mauvais plan.

**D3 — En nuit, l'eau a disparu.** Il ne reste qu'un liseré azur sous le ticker ; sous
le hero, tout est graphite uni. Cause mesurable, pas un goût : le huitième calque de
la nappe (le fondu) démarre à 42 % de 640 px, soit 269 px, et fond vers `--desk`. En
jour `--desk` est `#E1E4E3` et le fondu se lit comme de l'eau qui s'éclaircit ; en
nuit `--desk` est `#0B0F13` et le même fondu éteint l'eau avant même la rangée de KPI.
Le mode nuit fait partie de la direction, pas d'une option.

## 2. Le fondu de la nappe — des stops par thème

### Ce que la mesure a infirmé — à ne pas rouvrir

La v1 supposait que l'arête franche visible en jour venait d'un fondu atterrissant sur
une couleur qui n'est pas celle du dessous. **Mesuré au DOM le 31/08, c'est faux** :

| | Fond derrière le plâtre | Arrivée du fondu, stop 100 % |
|---|---|---|
| jour | `rgb(225,228,227)` | `rgb(225,228,227)` |
| nuit | `rgb(11,15,19)` | `rgb(11,15,19)` |

Identiques dans les deux thèmes — `--color-bg` **est** `var(--desk)`, et rien n'est
peint entre les deux. Il n'y a aucune couture de couleur à corriger, et le huitième
calque ne se redécrit pas.

**La cause réelle de l'arête est D2.** À 42 % l'eau commence à s'éteindre ; à ~85 % de
sa course elle rencontre le bord supérieur de la carte du graphe — un rectangle opaque,
pleine largeur, planté au milieu du fondu. Ce bord est ce qu'on lisait comme une arête.
Sortir le graphe des 640 px (§ 5) la fait disparaître : le fondu finit alors sa course
sur du vide. D1 enlevait ce qui la soulignait.

### Le seul changement du fondu

Son premier stop passe en token, pour pouvoir différer par thème :

> **Mesure à faire avant de coder.** Relève la valeur calculée du fond réellement
> peint derrière le plâtre, et celle vers laquelle le huitième calque fond. Si ce ne
> sont pas **le même token**, l'arête est là — le fondu atterrit sur une couleur qui
> n'est pas celle du dessous. Corrige en faisant fondre vers le token du fond réel.
> Si les deux sont déjà identiques, **arrête-toi et donne les deux valeurs** : le
> défaut est ailleurs et je le reprends.

La maquette porte désormais ce stop en token :

| Token | Jour | Nuit |
|---|---|---|
| `--fondu-haut` | `42%` | `58%` |
En nuit le fondu démarre plus bas : l'eau garde 371 px de présence pleine au lieu de
269, ce qui la fait exister sous le hero **et** sous la rangée de KPI. Les stops
suivants (66 / 84 / 95 / 100 %) sont inchangés dans les deux thèmes.

## 3. Les arêtes de lumière — trois tokens, deux thèmes

Les trois calques de lumière de la nappe étaient écrits en `rgba(255,255,255,…)`
littéral, donc identiques en jour et en nuit — sur un fond nuit deux fois plus sombre,
la même arête ne se voit plus. Ils passent en tokens, relevés à la maquette :

| Token | Jour | Nuit | Rôle |
|---|---|---|---|
| `--arete-voile` | `rgba(255,255,255,.18)` | `rgba(255,255,255,.26)` | voile vertical, calque 4 |
| `--arete-1` | `rgba(255,255,255,.38)` | `rgba(255,255,255,.52)` | arête haute, calque 6 |
| `--arete-2` | `rgba(255,255,255,.2)` | `rgba(255,255,255,.3)` | arête basse, calque 7 |

Ce sont de la lumière, pas des couleurs de marque : la règle « zéro couleur inventée »
tient. Les quatre tokens de ce lot (`--fondu-haut` + les trois arêtes) **s'ajoutent à
`design-tokens.css`**, jour et nuit, avec leur rôle en commentaire. C'est la seule
raison pour laquelle ce lot touche la couche de tokens.

Rien d'autre ne change dans la nappe : les huit calques, leurs géométries, leurs flous
et les trois `derive` (46 s, 58 s en `reverse`, 64 s) sont intacts.

## 4. D1 — les deux libellés descendent dans la dalle

Le couple « titre + kicker » n'est pas supprimé, il est **rangé**. Il devient l'entête
de la dalle du graphe, aux valeurs de L4 :

```
h2      : Jost 500 · 16.5px · letter-spacing .004em · color var(--encre)
kicker  : Instrument Sans · 11.5px · letter-spacing .1em · capitales
          color var(--encre-3)
```

Le texte des deux libellés ne change pas d'un caractère. Ils cessent seulement d'être
posés sur l'eau.

## 5. D2 — le graphe devient une dalle du plâtre

### 5.0 Le premier plan manque dans le code — on l'ajoute

Mesuré le 31/08 : hero et rangée de KPI s'arrêtent à y = 386, la nappe fait 640. Le
graphe comblait les 254 px restants, et c'est précisément le défaut. Le déplacer ne
suffit pas : il remonterait à ~450, toujours dans l'eau.

La cause est structurelle. **L2 nomme le premier plan comme un élément** (`padding:
52px 28px 0`, `z-index: 30`) ; le code n'en a pas — `.dash-welcome` et `.kpi-row` sont
enfants directs de la vue. Le conteneur qui manque n'est pas un niveau de DOM
décoratif, c'est un des deux plans de L1.

**Ajoute-le**, et lui seul :

```
<div class="dash-avant">   <!-- enveloppe .dash-welcome + .kpi-row, rien d'autre -->
  position: relative · z-index: 30
  padding: 52px 28px 0
  min-height: var(--nappe-h)
</div>
```

C'est la **seule** addition de DOM autorisée par ce lot. Toute autre → arrêt.

### 5.1 Une grandeur, un token : `--nappe-h`

`min-height: 640px` écrit à la main serait un second exemplaire de la hauteur de la
nappe — interdit par L10. **Ajoute `--nappe-h: 640px`** à `design-tokens.css` (même
valeur dans les deux thèmes, une seule déclaration suffit), et fais-le lire par les
deux :

- la nappe : `height: var(--nappe-h)` — remplace le `640px` littéral déjà en place ;
- `.dash-avant` : `min-height: var(--nappe-h)`.

La sonde du LOT 2 mesure la nappe à 640 px : elle doit rester verte, c'est le contrôle
que le token résout bien.

### 5.2 La dalle

La carte « Performance du portefeuille » quitte le premier plan et devient une dalle
mate, pleine largeur, aux valeurs de L4 :

```
padding: 34px · border-radius: var(--r-dalle)
background: var(--dalle-a)   /* première dalle du plâtre, l'alternance a→b→c reprend après */
hover → transform: translateY(-3px) · transition 280ms var(--ease)
```

Pas de `backdrop-filter`, pas de bordure de verre, pleine opacité. **La courbe, ses
axes, sa base 100 et les barres d'écart de VL en encre monochrome sont intouchés** —
le code a eu raison sur ce point et le rappel est ici pour qu'on ne le « corrige » pas
en passant.

Conséquence à vérifier au DOM : le premier plan ne contient plus que le hero et la
rangée de KPI, et **aucun élément ne franchit la ligne des 640 px**. C'est la
précondition du LOT 4.

### 5.3 La cascade de `relief.css`

Sortir `.dash-perf-section` des enfants directs de la vue décale les `nth-child` de
`relief.css`, qui l'anime aujourd'hui en position 4. **Réécris ces règles-là sur les
classes**, pas sur les positions : une animation indexée sur l'ordre du DOM se casse au
prochain déménagement, et il y en aura d'autres. Périmètre strict : **uniquement** les
sélecteurs `nth-child` qui ciblent les enfants de `#view-dashboard`. Les autres
`nth-child` du fichier ne bougent pas.

Les six animations de L8 et leurs délais restent identiques — c'est le sélecteur qui
change, pas le mouvement.

Si sortir le graphe du premier plan exige d'ajouter **un autre** élément enveloppant
que le `.dash-avant` du § 5.0, **arrête-toi et décris ce qui manque.**

## 6. Fichiers autorisés, et deux commits

| Fichier | Changement |
|---|---|
| `structura-v2/src/design-tokens.css` | ajout des 5 tokens : § 2, § 3 et `--nappe-h` |
| `structura-v2/src/shell.css` | fondu, arêtes et hauteur de nappe passés en tokens (stops et géométries inchangés) |
| `structura-v2/src/relief.css` | `nth-child` du Dashboard réécrits sur les classes (§ 5.3) |
| `structura-v2/src/dashboard.css` | `.dash-avant`, entête de dalle du § 4, dalle du graphe du § 5 |
| `structura-v2/index.html` | `.dash-avant` + déplacement du bloc du graphe + bump `?v=` |
| `structura-v2/handoff-septembre/maquette/Dashboard - Liquide.dc.html` | maquette à jour — elle référence les tokens de ce lot, donc elle part avec eux |

**Deux commits, dans cet ordre :**

1. **D3** — les 5 tokens, `shell.css`, la maquette. Sondes vertes à ce commit déjà :
   l'eau existe en nuit, les arêtes sont tokenisées, la maquette ne référence plus rien
   d'indéclaré. Rien ne bouge dans le gabarit.
2. **D1 + D2** — `.dash-avant`, le déménagement du graphe, l'entête de dalle,
   `relief.css`. Sondes vertes, et c'est ce commit qui doit satisfaire le § 7.

`index.html` bouge dans le commit 2, et c'est assumé : § 5.0 et § 5.2 sont un ajout de
plan et un déménagement de bloc, pas de la peinture. **Aucun autre écran.** Si un autre
écran change d'aspect à cause des nouveaux tokens, c'est qu'il consommait déjà les
littéraux : signale-le, ne le corrige pas dans ce lot.

## 7. Preuve

```bash
node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 5
cd structura-v2 && node handoff-septembre/tools/check-tokens.mjs; cd ..
node structura-v2/handoff-septembre/tools/check-sources.mjs
```

Contrôles à ajouter à la sonde :

1. **zéro `rgba(255,255,255` littéral dans `shell.css`** — les trois arêtes passent
   par leurs tokens ;
2. **`--fondu-haut` déclaré dans les deux blocs de thème** de `design-tokens.css` ;
3. **zéro `640` littéral** dans `shell.css` et `dashboard.css` — une seule grandeur, un
   seul token (§ 5.1) ;
4. **zéro `nth-child` ciblant un enfant de `#view-dashboard`** dans `relief.css` ;
5. **aucun texte dans les 640 px du haut hors premier plan** : liste les nœuds de
   texte dont le `getBoundingClientRect().top` est < 640 et qui ne descendent pas de
   `.dash-avant`. La liste doit être vide.

Mesures DOM, viewport 1600 px, jour **et** nuit :
`top` et `bottom` de la dalle du graphe (le `top` doit être > 640) · `top` du premier
élément du plâtre · et la confirmation qu'**aucun élément opaque ne coupe le fondu** :
aucune boîte à fond non transparent ne commence entre 269 px (jour) / 371 px (nuit) et
640 px hors premier plan.

Rapport : sorties brutes, sha, ces mesures, et **captures 1600 px jour + nuit du
Dashboard**. Les huit autres écrans n'ont pas de nappe : une capture jour de Clients
suffit à prouver qu'ils n'ont pas bougé.

## 8. Après ce lot

L'eau commence et finit proprement, en jour comme en nuit, et le premier plan ne
contient plus que ce qui a le droit d'y flotter. Le LOT 4 peut alors poser le verre
sur deux cartes — et deux seulement, cf. L3.
