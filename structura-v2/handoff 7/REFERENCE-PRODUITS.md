# Référence produits structurés

Fichier de référence unique pour l'entrée de matière documentaire (§7 de
PASSE-8.md). Les documents sources (`uploads/`) ne sont jamais lus
directement par le code applicatif — tout passe par ce fichier.

**Statut : ossature vide.** Aucun document déposé dans `uploads/` à ce
stade. Les sections ci-dessous reprennent l'ordre de lecture fixé par §7 ;
chacune attend un document précis, pas un remplissage au fil de l'eau.
Ne pas anticiper le contenu avant d'avoir le document sous les yeux — un
vocabulaire ou une convention de calcul devinés ici referaient exactement
l'erreur que ce fichier existe pour éviter.

---

## 1. Vocabulaire exact

Source : **term sheets**.

Terminologie telle qu'elle apparaît dans les documents — pas une
traduction ni une normalisation a priori. Un même mécanisme peut porter
des noms différents d'un émetteur à l'autre ; ce tableau doit le montrer,
pas le lisser.

*(vide — en attente de term sheets)*

## 2. Champs d'une fiche produit

Source : **term sheets**.

Liste des champs effectivement présents sur un term sheet, avec leur
libellé exact et leur emplacement type dans le document (pour guider une
future extraction). Distinct de la fiche produit unique de §2 (l'écran) :
ceci documente ce qu'un document source contient, pas ce que l'app
affiche.

*(vide — en attente de term sheets)*

## 3. Logique acquis / conditionnel

Source : **échéancier réel**.

Comment un échéancier réel distingue un coupon déjà versé (acquis) d'un
coupon encore soumis à condition de marché (conditionnel) — vocabulaire,
mise en forme, tout signal qui permettrait au code de faire cette
distinction sans la deviner.

*(vide — en attente d'un échéancier réel)*

## 4. Décrément : points fixes vs % annuel

Source : **notice de décrément**.

Convention de la notice pour exprimer le décrément — en points d'indice
fixes ou en pourcentage annuel — et comment la distinguer à la lecture.
Directement lié à `decrement-engine.js` (points vs %/an, déjà une
distinction active dans le moteur actuel).

*(vide — en attente d'une notice de décrément)*

## 5. Mentions obligatoires

Source : **DIC/KID**.

Mentions réglementaires qui doivent apparaître telles quelles — texte
exact, pas une paraphrase — pour qu'une fiche produit ou un rapport
généré par l'app ne s'expose pas à en avoir inventé ou oublié une.

*(vide — en attente d'un DIC/KID)*

## 6. Rapport d'adéquation type — ce que « Lecture CGP » doit produire

Source : **rapport d'adéquation type**.

Structure et contenu attendus d'un rapport d'adéquation DDA, pour cadrer
ce que la fonctionnalité « Lecture CGP » de l'app doit produire en sortie.
Dernier maillon de la chaîne de lecture (§7) : les cinq sections
précédentes l'alimentent.

*(vide — en attente d'un rapport d'adéquation type)*
