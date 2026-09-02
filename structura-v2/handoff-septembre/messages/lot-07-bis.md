# LOT 7 bis — message à Claude Code

Tes deux causes sont les bonnes et tes mesures suffisent : je ne redemande rien, je
tranche. **Les deux corrections, dans un seul commit.** Pas de spec séparée — ce
fichier fait foi.

## 1. `.dash-avant` passe en `border-box` (`dashboard.css`)

C'est mon erreur de spec au LOT 6 : j'ai donné `padding: 52px 28px 0` et
`min-height: var(--nappe-h)` sans donner le box-model, donc le padding s'est ajouté aux
640. La maquette mesure la nappe bord à bord.

```css
.dash-avant {
    box-sizing: border-box;
    /* le reste inchangé */
}
```

## 2. `block-in` reçoit une image `100%` explicite (`relief.css`)

Une keyframe qui n'a qu'une image `0%` avec `fill-mode: both` laisse un transform
résiduel sur un bloc haut : c'est un défaut de la keyframe, pas de sa cascade. On
n'exclut donc pas `.dash-body` de la cascade d'entrée (elle est juste), on ferme
l'animation :

```css
@keyframes block-in {
    0% {
        opacity: 0;
        transform: translateY(18px) scale(0.985);
        filter: blur(var(--blur-enter));
    }
    100% {
        opacity: 1;
        transform: none;
        filter: none;
    }
}
```

`relief.css` entre dans le périmètre pour cette seule règle. Bump `?v=` pour les deux
fichiers CSS dans le même commit.

## 3. Le `−3 px` de `left` : à remesurer, pas à corriger

Il vient probablement du même box-model. Remesure-le **après** le point 1 : s'il tombe
à 0, tu n'y touches pas. S'il reste, tu le laisses et tu me le dis — 3 px de sous-pixel
sur une piste `minmax(0,1fr)` ne valent pas une règle de plus.

## Ce que j'ajoute à la sonde, et pourquoi

`preuve-liquide --lot 7` a dit vrai sur les quatre règles **et** l'écran était faux : les
sondes lisent la source, pas le rendu. Ajoute à `--lot 7` deux preuves de géométrie
mesurées en DOM, pas en texte :

1. hauteur de boîte de `.dash-avant` = `--nappe-h` exactement (640) ;
2. `top` de `.kpi-row` − bas de `.dash-avant` = 54.

Une sonde qui ne mesure que du CSS écrit ne prouve pas un écran. Celles-là, si.

## Preuves à me rendre

`preuve-liquide --lot 7` (avec les deux nouvelles), `--lot 6`, `--lot 5`,
`check-tokens`, `check-sources`. Mesures DOM à 1600 px, jour et nuit : hauteur de
`.dash-avant` = 640 · `top` de `.kpi-row` = 694 · écart eau / première dalle = 54 ·
`left` de `.kpi-row` vs `.dash-avant-main` · 4 backdrop-filter, tous sous 640. Une
capture premier plan et une page complète, jour et nuit.
