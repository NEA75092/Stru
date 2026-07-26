# PASSE 3 — Logo, relief et mouvement

**État attendu à l'entrée :** passe 1 et passe 2 commitées et poussées,
`npm test` vert.

**Ce que fait cette passe :** rétablit le logo d'origine du client
(fourni en PNG, deux variantes générées), et remplace le relief perdu
pendant la migration par un système cohérent — ombres teintées, liserés
de lumière, grain, halo au curseur, entrées décalées.

**Ce qu'elle ne fait pas :** aucune modification de mise en page, aucun
changement de valeur de token couleur existante. Rien de ce qui suit ne
peut casser passe 1 ni passe 2.

---

## Reversement de décision assumé

La règle du 24/07 « les cards n'ont plus d'ombre, le relief vient de la
bordure et de deux blocs dégradés pleins par écran » est **annulée**.

Motif : constat direct sur les captures passe 1 et passe 2, dans les deux
thèmes — sans ombre ni dégradé interne, les cartes n'ont pas d'épaisseur,
elles flottent. Ce n'était pas un bug de règle CSS mais une décision de
direction trop stricte.

Ce qui la remplace n'est pas « remettre des ombres » : l'ombre d'une
carte est **teintée de la couleur de la carte** (la carte encours projette
du bleu, la carte critique du rouge), jamais un gris neutre. Le
commentaire de `design-tokens.css` qui porte l'ancienne règle doit être
réécrit, pas supprimé — le fichier documente ses reversements.

---

## A. Assets logo

Quatre fichiers à copier dans `assets/` (fournis, fond transparent,
détourés depuis le PNG du client) :

| Fichier | Usage | Dimensions |
| --- | --- | --- |
| `structura-lockup.png` | sidebar, thème clair | 1036 × 251 |
| `structura-lockup-dark.png` | sidebar, thème sombre | 1036 × 251 |
| `structura-mark.png` | favicon, écran de chargement, clair | 255 × 247 |
| `structura-mark-dark.png` | favicon, sombre | 255 × 247 |

Les variantes sombres ne sont pas un filtre CSS : l'encre marine passe en
crème, les barres d'histogramme en bleu ciel, la volute en gris chaud.
Un `filter: invert()` aurait cassé la marque.

---

## B. `src/shell.css`

1. **`.sidebar-brand`** — remplacer le bloc wordmark par le lockup :

```css
.sidebar-brand {
    display: flex;
    align-items: center;
    padding: var(--space-6) var(--space-5) var(--space-5);
    border-bottom: 1px solid var(--color-border);
}

.sidebar-brand-img {
    display: block;
    width: 100%;
    max-width: 188px;
    height: auto;
}

:root[data-theme="dark"] .sidebar-brand-img {
    content: url("../assets/structura-lockup-dark.png");
}
```

2. **Supprimer** `.sidebar-wordmark` et `.sidebar-wordmark-dot`, et le
   commentaire « Wordmark typographique : pas d'image… » qui les précède.

3. **`.sr-only`** — le nom accessible de la marque reste dans le DOM :

```css
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
}
```

4. **`.app`** — ajouter `position: relative;` (le grain se pose sur
   `.app::after`).

5. **`.view`** — ajouter `position: relative;` (le halo se pose en
   absolu dedans).

6. **`.view.active`** — retirer `animation: view-in …` et supprimer
   `@keyframes view-in`. Les entrées passent en décalé par bloc dans
   `relief.css` ; garder les deux ferait jouer l'animation deux fois.

---

## C. `src/dashboard.css`

Les cartes existent déjà : on change des valeurs sur les sélecteurs en
place, on n'ajoute aucun sélecteur.

1. Sur la carte KPI générique : `background: var(--gradient-card-lit);`
   et `box-shadow: var(--lit-top), var(--shadow-card);`
2. Sur la carte KPI à liseré bleu :
   `box-shadow: var(--lit-top), var(--lit-bottom-aegean), var(--shadow-card-aegean);`
3. Sur la carte KPI critique (corail) :
   `box-shadow: var(--lit-top), var(--lit-bottom-coral), var(--shadow-card-coral);`
4. Sur chaque `:hover` de carte : `transform: translateY(-4px);` +
   la variante `-hover` de l'ombre correspondante, avec
   `transition: transform var(--duration-slow) var(--ease-spring), box-shadow var(--duration-slow) var(--ease-spring);`
5. Panneaux (perf, Top/Flop, exposition, alertes) :
   `box-shadow: var(--lit-top), var(--shadow-card);`
6. Modale / tiroir / dropdown : `box-shadow: var(--shadow-float);`

Vérifier qu'aucune de ces règles ne réintroduit de couleur littérale :
tout passe par les tokens de la section suivante.

---

## D. `src/design-tokens.css`

Coller le contenu de `passe3-tokens.css` : le premier bloc à la fin du
`:root` existant, le second à la fin de `:root[data-theme="dark"]`.

`--shadow-card` et `--shadow-card-hover` changent de valeur (elles
valaient `none` et une ombre grise) : tout ce qui les consomme déjà
gagne le relief sans une ligne de plus.

---

## E. `src/relief.css` (nouveau)

Copier `relief.css` tel quel dans `src/`, et le charger **après**
`shell.css` et `dashboard.css` dans `index.html`.

---

## F. `index.html`

1. Sidebar :

```html
<div class="sidebar-brand">
    <img class="sidebar-brand-img" src="assets/structura-lockup.png"
         alt="" width="1036" height="251" />
    <span class="sr-only">Structura</span>
</div>
```

2. Favicon : `<link rel="icon" href="assets/structura-mark.png" />`
3. Dans chaque vue concernée, en premier enfant de `.view` :
   `<div class="spotlight" aria-hidden="true"></div>`
4. Aucun attribut `style=` de couleur (test 6).

---

## G. JavaScript

1. **Halo au curseur** — un écouteur, sur la vue active
   (`app-navigation.js`, au changement d'onglet, ou une fois sur `.main`
   avec délégation) :

```js
function bindSpotlight(view) {
    view.addEventListener("mousemove", (e) => {
        const r = view.getBoundingClientRect();
        view.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        view.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
}
```

Pas de `requestAnimationFrame`, pas de state : deux variables CSS, seule
la peinture du dégradé est recalculée.

2. **Inclinaison au survol** — sur les cartes KPI du dashboard
   uniquement :

```js
card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -3;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 3;
    card.style.transform =
        `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
});
card.addEventListener("mouseleave", () => { card.style.transform = ""; });
```

3. **Odomètre** — sur le seul KPI d'encours total. Le markup est produit
   une fois, seule `--d` change ensuite :

```js
function renderOdometer(el, text) {
    if (el.childElementCount !== text.length) {
        el.innerHTML = [...text].map((ch) => /\d/.test(ch)
            ? `<span class="odometer-digit"><span class="odometer-reel">${
                Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join("")
              }</span></span>`
            : `<span class="odometer-digit">${ch}</span>`).join("");
    }
    [...text].forEach((ch, i) => {
        const reel = el.children[i].firstElementChild;
        if (reel) reel.style.setProperty("--d", ch);
    });
}
```

4. **Sparkline** — la jauge et la courbe existent déjà en SVG dans
   `app-dashboard.js` : il suffit d'ajouter la classe `sparkline` au
   `<svg>`, l'animation est dans `relief.css`.

5. **Repère de barrière** — sur la jauge de distance, ajouter
   `<span class="barrier-mark" style="--at: 74%"></span>` (la variable
   n'est pas une couleur, test 6 reste vert).

---

## H. `tests/css-hygiene.test.js`

1. `MIGRATED` devient `["shell.css", "relief.css"]`.
2. Le test 8 change de sens — la marque redevient une image, par
   décision du client du 26/07 (le logo d'origine est restauré depuis sa
   sauvegarde). Le remplacer par :

```js
/* ── 8. Le logo est l'image de marque du client, en deux variantes ── */
test("la marque est l'image du client, avec sa variante sombre", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.ok(html.includes("sidebar-brand-img"), "index.html n'utilise pas .sidebar-brand-img");
  assert.ok(!html.includes("sidebar-wordmark"), "index.html contient encore le wordmark typographique — remplacé par le logo du client");
  assert.ok(html.includes("sr-only"), "le nom accessible de la marque a disparu du DOM");
  for (const f of ["structura-lockup.png", "structura-lockup-dark.png", "structura-mark.png"]) {
    assert.ok(fs.existsSync(path.join(ROOT, "assets", f)), `assets/${f} manquant`);
  }
});
```

3. `STAGES` gagne un drapeau `relief: true`. **Ne pas** passer
   `STAGES.views` à `true` : cette passe ne migre pas les 9 vues — c'est
   la passe 4. Le fichier `css-hygiene.test.js` du bundle contient déjà
   ces trois changements, plus un test 8 bis qui interdit les ombres
   littérales dans `relief.css` : le copier tel quel dans `tests/`.

---

## I. `CLAUDE.md`

Remplacer par la version du bundle. Trois changements :

- L'ordre d'exécution passe à 4 passes (la passe 3 est celle-ci, l'ancienne
  passe 3 « le reste » devient la passe 4).
- Une section **Reversements de décision (26/07/2026)** documente les deux
  décisions du 24/07 annulées, avec leur motif : « les cards n'ont plus
  d'ombre » et « la marque est un wordmark typographique ».
- La ligne sur la barrière parle du logo du client, plus du wordmark.

---

## Recette

- [ ] `npm test` vert, `relief.css` inclus dans MIGRATED.
- [ ] Zéro `!important` et zéro couleur littérale dans `relief.css`.
- [ ] Logo net dans la sidebar, clair **et** sombre, sans halo ni fond.
- [ ] Favicon visible dans l'onglet.
- [ ] Chaque carte KPI projette une ombre **de sa propre teinte**.
- [ ] En sombre, chaque carte a son liseré de lumière en haut.
- [ ] Survol : la carte monte de 4 px, l'ombre s'ouvre, ≤ 3° d'inclinaison.
- [ ] Le halo suit le curseur sans saccade (profiler : pas de layout).
- [ ] L'anneau conique n'apparaît **qu'une fois** par écran.
- [ ] L'odomètre roule jusqu'à la valeur exacte, sans chiffre coupé.
- [ ] `prefers-reduced-motion` : plus aucun mouvement, relief intact.
- [ ] Captures `screenshots/passe3-clair.png` et `passe3-sombre.png`.
