# LOT 10 — message à Claude Code

Spec : `structura-v2/handoff-septembre/specs/lot-liquide-10-details-premier-plan.md`.
Contexte : `audit-maquette-02-09.md` § 3. À faire **après** le LOT 9. Petit lot, dernier
du Dashboard.

Quatre changements, tous dans le premier plan :

1. **Les libellés de période du cadre d'encours** : « Mois · Trimestre · Année · Depuis
   l'origine » au lieu de « Mois · 6M · 1A · Tout ». Quatre fenêtres glissantes
   (30 / 90 / 365 jours / première souscription). Les cas `6m` et `1a` de
   `perfRangeStart` **restent** : la dalle de performance du plâtre les consomme.
   L'écart venait de ma spec du LOT 6, pas du code.
2. **La pastille du jour courant** dans l'agenda passe en `--rouge` / `--rouge-encre`
   (fond rouge, encre sombre), pas en blanc sur marine.
3. **Le jour chargé** perd son fond : la pastille de 4px sous le numéro suffit, et elle
   passe en une seule couleur — la variante de risque `.is-risk` sort. Deux signaux pour
   un fait, c'était un de trop. La règle du LOT 6 tient : pas d'événement, pas de
   pastille.
4. **Le kicker reste sans heure.** Je l'avais classé « à corriger » dans l'audit : c'était
   mon erreur. La maquette tient son heure d'une constante de démo, l'app dérive le
   kicker de `latestVlAsOf()` qui ne porte qu'une date. L'ajouter serait inventer une
   donnée. Le § 4 de la spec porte le démenti.

Le § 5 liste ce qu'il ne faut **pas** aligner sur la maquette : « sur la période » (la
fenêtre est glissante), le contenu de « À regarder aujourd'hui » (pas de source de
relation client dans l'app), l'encours abrégé.

Une fois ce lot passé : **relance `--lot 5` à `--lot 10` d'affilée** et dis-moi si
l'audit est vide. Ce sera la fin du Dashboard.
