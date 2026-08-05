# RÉFÉRENCE PRODUITS STRUCTURÉS — ossature

Ce fichier est vide de contenu produit. Il fixe la structure que §7 impose ;
le remplissage vient une fois les documents déposés, dans l'ordre de lecture
ci-dessous — pas avant, et jamais en le devinant entre-temps.

Rappel de la règle (§7) : ce fichier est la **seule** source que le code
applicatif peut lire. Aucun `uploads/*.pdf` n'est jamais référencé ou lu par
`src/`. Si un champ manque ici, il n'existe pas pour le code, quelle que soit
la richesse du document source.

Ordre de lecture imposé par §7 — chaque section ci-dessous n'est remplie
qu'à son tour, jamais en anticipant sur les documents suivants :

1. Term sheets → §A, §B
2. Échéancier réel → §C
3. Notice de décrément → §D
4. DIC/KID → §E
5. Rapport d'adéquation type → §F

---

## §A — Vocabulaire exact

Table à deux colonnes : terme du document source → terme retenu dans l'app.
Un seul terme retenu par notion, même si les term sheets varient d'un
émetteur à l'autre (ex. « date de constatation » vs « date d'observation »).

| Terme(s) source | Terme retenu (app) | Note |
| --- | --- | --- |
| — à remplir depuis les term sheets — | | |

## §B — Champs d'une fiche produit

Un champ par ligne. Ne liste que ce que le code lit réellement (croiser avec
`app-state.js` `normalizeProduct` / `normalizeAllocation` une fois rempli —
ne pas inventer un champ que rien ne consomme).

| Champ | Type | Obligatoire | Source (doc) | Convention |
| --- | --- | --- | --- | --- |
| — à remplir depuis les term sheets — | | | | |

## §C — Logique acquis / conditionnel

Depuis l'échéancier réel, pas depuis le term sheet (le term sheet décrit le
mécanisme théorique ; l'échéancier montre ce qui s'est réellement produit).

- Conditions de déclenchement d'un coupon (barrière, mémoire, effet cliquet…)
- Différence entre un montant **attendu** (projeté, avant la date) et **acquis**
  (constaté, après) — vocabulaire à faire correspondre à la règle checklist
  « Attendus et payés jamais dans la même mesure »
- Cas de rappel anticipé : ce qui devient exigible ce jour-là (capital +
  coupon(s), cf. checklist §2)

À remplir : —

## §D — Points fixes vs pourcentage annuel (décrément)

Distinction centrale pour le Decrement Score et ses jauges — ne pas la
mélanger avec une performance classique.

- Définition du décrément fixe (points d'indice retirés à intervalle fixe)
- Définition du décrément proportionnel (% annualisé)
- Comment un sous-jacent à décrément affecte le calcul de barrière /
  distance à barrière (déjà implémenté ailleurs — ce fichier documente la
  règle, ne la réimplémente pas)

À remplir : —

## §E — Mentions obligatoires (DIC/KID)

Ce que la réglementation impose d'afficher quelque part dans l'app pour
chaque produit — pas nécessairement dans la fiche elle-même, mais localisé
ici pour que rien ne soit oublié au moment de décider où.

- Indicateur de risque (SRI, échelle 1-7)
- Scénarios de performance (favorable / modéré / défavorable / de tension)
- Coûts (entrée, sortie, courants)
- Durée de détention recommandée

À remplir : —

## §F — Rapport d'adéquation type (« Lecture CGP »)

Ce que la fonctionnalité « Lecture CGP » doit produire, en sortie — structure
du rapport, pas son moteur de calcul. Sert de spec fonctionnelle pour l'outil
qui viendra consommer ce fichier de référence en entier (§A à §E).

À remplir : —
