# LOT 8 — réponse aux deux points d'arrêt, avant que tu codes

Feu vert : **enchaîne les trois lots, 8 → 9 → 10.** Ne m'attends pas entre les deux.
Le défaut du § 5 tient : la dalle de performance et « Sous la protection du capital »
restent, repeintes au patron du § 3.

## 1. L'odomètre — ma spec était fausse, tu n'as pas à t'arrêter

J'ai relu `app-utils.js` au dépôt. `setTextFlash` → `flashText` (l. 278) est un **flash
de fond sémantique** au changement de valeur : il ne compte pas, il ne dure pas 900 ms,
il n'interpole rien. **Aucun odomètre n'existe au dépôt.** Écrire « réemploie
`setTextFlash` » était une erreur de ma part, du même genre que celles que tu as
listées : j'ai cité une fonction sur son nom au lieu de la lire.

Le § 4 bis de la spec est réécrit avec la décision : **une seule
`requestAnimationFrame` dans `app-dashboard.js`**, 900 ms, courbe `1 - (1-p)^4`, une
boucle pour les trois cibles, au premier rendu seulement, valeur exacte au dernier pas,
et `matchMedia('(prefers-reduced-motion: reduce)')` testé dans la boucle — le
coupe-circuit de `relief.css` ne couvre que le CSS.

## 2. Le repère de barrière — tu as trouvé un écart de modèle, et il est réel

Bien vu, et c'est plus grave que ce que ta question laissait entendre : **la maquette n'a
qu'une barrière** (`BARRIERE = 70`, constante de démo) et pose donc **un seul repère** à
la même abscisse pour les dix lignes. L'app porte **une barrière par produit**
(`p.barrier`, en % du spot initial : les trois positions à l'écran valent 74, 57 et 59).
Recopier la maquette aurait posé un repère faux sur neuf lignes sur dix.

Décision, écrite au § 4.2 : **le repère est par ligne**, à `p.barrier / VL_MAX * 100`, sur
la même échelle que sa jauge. Un produit sans barrière (capital garanti, `p.st.s ===
"none"`, sentinelle `dist = 999`) **n'a pas de repère du tout** — ni à 0, ni au bord.
`VL_MAX = 150` est déclaré une fois et lu par les jauges **et** les repères.

## 3. Sur ta note — elle est juste, et voilà ce qui change

Rien à négocier sur le fond : sept lots, six corrigés pour la même cause. Ce qui change,
concrètement, et c'est vérifiable dans les fichiers que tu viens de lire :

- **`audit-maquette-02-09.md` existe.** Maquette lue en entier, une fois, tous les écarts
  listés. C'est ce qui aurait dû être le premier geste du LOT 5.
- **Un § 0 « Arrête-toi si » en tête des specs 8, 9 et 10** : chaque valeur, sélecteur et
  ajout de DOM ambigu, rassemblé, avec la conduite à tenir — et la mention explicite des
  cas où tu **ne** dois **pas** t'arrêter. Le stop arrive à la relecture, pas pendant que
  tu codes.
- **L'audit 3.3 est corrigé à la source**, pas démenti plus loin : tu avais raison,
  trancher puis se dédire dans le même corpus est ce qui use. Le verdict lit maintenant
  CODE, avec la vérification (`latestVlAsOf` ne renvoie qu'une date) écrite dans la
  case.
- **Les preuves de géométrie en DOM** sont dans les trois specs, pas en bonus : LOT 8
  (trois colonnes égales, cibles de pied), LOT 9 (haut de l'eau = haut de la vue), LOT 10
  (fond résolu de la pastille du jour).

Sur les tokens et les sélecteurs cités de mémoire : j'ai lu `dashboard.css`,
`shell.css`, `relief.css`, `app-dashboard.js` et `app-utils.js` au dépôt avant d'écrire
ces trois specs. Si un nom cité n'existe toujours pas, il est dans le § 0 — nomme-le, et
c'est moi qui aurai encore lu trop vite.
