# LOT 8 — § 0 #5 levé : le sigle émetteur

Tu avais raison de le garder ouvert. **Le sigle n'existe pas au dépôt.** Vérifié dans
`src/issuer-registry.js` (17 émetteurs) : chaque entrée porte `id`, `label`,
`brandColor`, `aliases`, `officialSources`, `fieldExtractors`. **Aucun champ `sigle`,
`abbr` ou équivalent.** Tu n'as donc pas à t'arrêter là-dessus : voici la décision.

## Ce qu'on n'aura pas

Les sigles de deux lettres de la maquette (`BP`, `SG`, `MS`, `NX`, `CA`…) sont écrits à
la main dans son `REGISTRE` de démo. Les dériver d'un `label` produirait des collisions
et des abréviations fausses — « Crédit Agricole CIB » et « Citigroup » ne donnent pas
deux lettres distinctes par une règle simple. **On n'invente pas d'abréviation** (§ 0 #5).

## Ce qu'on a, et ce qu'on emploie

L'identifiant d'émetteur de l'app est le `id` du registre : `BNP`, `SG`, `MS`, `JPM`,
`GS`, `DB`, `BARC`, `HSBC`, `NATIXIS`, `CACIB`, `CITI`, `UBS`, `VONTOBEL`, `UNICREDIT`,
`COMMERZ`, `LEONTEQ`, `BOFA`. C'est **la même table** que celle qui porte déjà les
couleurs de marque et que Pilotage consomme (`issuerBrandClass`) — pas une seconde
source.

**La pastille porte le `id`, tel quel.** Conséquence de forme, assumée : de 2 à 9
caractères ne tiennent pas dans un disque de 28px. Le disque devient une **pastille à
largeur automatique** :

```
height: 28px · min-width: 28px · padding: 0 10px
border-radius: var(--r-plein) · border: 1px solid var(--trait)
background: transparent
font-family: Jost · font-size: 11.5px · letter-spacing: .02em · line-height: 1
color: var(--encre-2) · white-space: nowrap
```

Encre uniquement, **jamais la couleur de marque** : la teinte d'émetteur ne vit que dans
la dalle « Concentration », où les lignes se comparent entre elles. Ailleurs, l'émetteur
s'identifie en encre — c'est déjà la règle de la maquette pour ses sigles.

Le reste de la géométrie ne bouge pas : la ligne garde ses `min-height: 44px` et son
gap 13, seule la première colonne devient `auto` au lieu de `28px`.

**Émetteur hors registre** (`bankGroupName` retombe sur le libellé brut, ou « Émetteur à
confirmer ») : **pas de pastille du tout**. Pas de tiret, pas de point d'interrogation,
pas de première lettre. Le nom du produit porte déjà l'information.

## Si tu préfères les deux lettres

Alors c'est une décision de donnée, pas de rendu : il faut **ajouter un champ `sigle` aux
17 entrées** d'`issuer-registry.js`, écrit à la main, une fois. Ce n'est pas dans le
périmètre du LOT 8 et je ne te le demande pas maintenant. Dis-le si tu le veux, je le
spécifie séparément avec les 17 valeurs arbitrées.

## À jour dans la spec

Le § 4.2 et le § 4.3 de `lot-liquide-08-platre-conforme.md` disent « sigle émetteur dans
un cercle 28px ». **Lis-les avec la pastille ci-dessus** : c'est cette note qui fait foi
sur ce point précis, et le § 0 #5 est levé.

Le reste du § 0 est vert de ton côté comme du mien. Enchaîne.
