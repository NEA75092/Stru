# lot-liquide-10-details-premier-plan — les six derniers écarts

Version 1 · 02/09/2026 · troisième et dernière tranche de `audit-maquette-02-09.md`
(§ 3). Après ce lot, **le Dashboard est conforme et l'audit est vide.**

Source unique : `handoff-septembre/maquette/Dashboard - Liquide.dc.html`, l. 159-243 et
la classe logique (l. 620-684 pour les libellés de période, l. 512-524 pour la semaine).

## 0. Arrête-toi si — la liste complète, en tête

| # | Cas | Ce que tu fais |
|---|---|---|
| 1 | un autre appelant que le cadre d'encours consomme `ENCOURS_RANGES` | tu le nommes |
| 2 | la dalle de performance du plâtre perd ses fenêtres YTD / 6M / 1A | tu t'arrêtes : les cas `6m` et `1a` de `perfRangeStart` **restent** |
| 3 | `--rouge-encre` n'existe pas au dépôt | tu le nommes. Il est déjà consommé par le compteur d'alertes (LOT 6), il devrait être là |
| 4 | retirer `.is-risk` casse un autre écran | tu le nommes |
| 5 | l'heure du kicker | plus d'ambiguïté : le § 4 tranche, elle ne s'affiche pas. Tu ne t'arrêtes pas |

Il n'y a pas d'autre ambiguïté dans ce document.

## 1. Les libellés de période du cadre d'encours (audit 3.1)

La maquette porte **quatre** libellés : « Mois · Trimestre · Année · Depuis l'origine ».
Le code porte « Mois · 6M · 1A · Tout ». L'écart vient de ma spec du LOT 6, pas du code.

Les quatre fenêtres, toutes glissantes, dans la continuité du LOT 7 :

| libellé | clé | début de fenêtre |
|---|---|---|
| Mois | `month` | aujourd'hui − 30 j *(inchangé, LOT 7)* |
| Trimestre | `trim` | aujourd'hui − 90 j |
| Année | `annee` | aujourd'hui − 365 j |
| Depuis l'origine | `all` | première date de souscription *(cas `all` existant, inchangé)* |

Les cas `6m` et `1a` de `perfRangeStart` **restent** : la dalle de performance du plâtre
les consomme avec ses propres boutons (YTD / 6M / 1A / Depuis le début), qui ne changent
pas. Ce lot ne touche qu'aux quatre boutons **du cadre d'encours**.

## 2. La pastille du jour dans l'agenda (audit 3.5)

Maquette : le jour courant est un disque **rouge** — `background: var(--rouge)`,
`color: var(--rouge-encre)`. Le code le peint en blanc sur encre marine.

Alias au dépôt : `--rouge` = `--color-breach`, `--rouge-encre` n'a pas d'alias et se
consomme en couche 1 (il est déjà consommé ainsi par le compteur d'alertes, LOT 6).

## 3. Le jour chargé dans l'agenda (audit 3.6)

Maquette : un jour qui porte un événement garde un numéro **sans fond**, et se signale
par la seule pastille de 4px sous le numéro, `rgba(255,255,255,.7)`. Le code lui met un
fond `--flottant` **sur** le numéro *et* un point dessous — deux signaux pour un fait.

Le fond `.has-ev` sort. La pastille reste, **en une seule couleur** : la variante de
risque `.is-risk` (`--color-breach` si l'événement touche une barrière) sort aussi. Elle
n'est pas dans la maquette, et le premier plan n'est pas l'endroit où se lit la gravité
d'un événement — c'est le rôle de « À regarder aujourd'hui », juste dessous.

La règle du LOT 6 ne change pas : **pas d'événement, pas de pastille.**

## 4. L'heure du kicker — la maquette a tort, et voici pourquoi (audit 3.3)

La maquette écrit « mis à jour le {date} **à {heure}** ». Je l'avais classé « MAQ » dans
l'audit. **C'est une erreur de ma part, corrigée ici** : la maquette tient son heure d'une
constante de démo (`MAJ = new Date(2026, 7, 20, 8, 30)`), alors que l'app dérive ce
kicker de `latestVlAsOf()`, qui ne porte **qu'une date** — les VL émetteur n'ont pas
d'horodatage dans le modèle.

Afficher une heure serait donc inventer une donnée. **Le kicker reste sans heure.** Si un
jour le flux de VL porte un horodatage, l'heure s'ajoutera d'elle-même.

C'est le seul point de l'audit où la maquette perd, et il est nommé comme tel.

## 5. Ce qui ne bouge pas, et qu'il ne faut pas « aligner »

- « soit {delta} **sur la période** » : la maquette dit « ce mois », mais la fenêtre est
  glissante depuis le LOT 7 — « ce mois » serait faux (audit 3.4).
- Le contenu de « À regarder aujourd'hui » reste les alertes de barrière avec
  `statusLabel`. Les alertes de relation client de la maquette (bulletin à signer, KYC,
  entrée en gestion) n'ont aucune source dans l'app (audit 3.7, tranché au LOT 6).
- L'encours reste abrégé (« 204,1 M€ »), pas en euros entiers (audit 3.2).

## 6. Périmètre

`src/dashboard.css` (pastilles d'agenda), `src/modules/app-dashboard.js`
(`ENCOURS_RANGES`, `perfRangeStart`, `renderAgendaWeek`), bump `?v=`. Rien d'autre.

## 7. Preuves

`preuve-liquide --lot 10` :

1. `ENCOURS_RANGES` porte exactement les quatre libellés « Mois », « Trimestre »,
   « Année », « Depuis l'origine » ;
2. `perfRangeStart` a un cas `trim` et un cas `annee`, tous deux glissants, et garde
   `6m`/`1a` pour la dalle de performance ;
3. zéro `.has-ev` et zéro `.is-risk` au dépôt ;
4. aucune heure dans le kicker (`toLocaleTimeString` absent de `renderSessionChrome`).

Mesuré en DOM, jour et nuit : la pastille du jour courant a bien
`background-color` = `--color-breach` résolu · un jour chargé n'a **pas** de fond ·
les quatre boutons de période ont une cible ≥ 44 px de large.

Et, une fois ce lot passé : **relance `--lot 5` à `--lot 10` d'affilée** et dis-moi si
l'audit est vide. C'est la fin du Dashboard.
