# Comparaison app ↔ maquette — Dashboard, 03/09 au soir

Méthode : captures de l'app à 1280 et 1600 (jour, plus le menu de profil ouvert)
contre la maquette `Dashboard - Liquide.dc.html` mesurée au DOM aux mêmes
largeurs. **Un écart est un bug, qu'un § l'ait prévu ou non.**

## A — Conforme, rien à faire

Rail vide sous la nav (3 enfants, 0 élément après `</nav>`) · « Nouveau produit »
en tête · couple jour/nuit + profil en haut à droite sur le verre · menu de
profil ouvrant vers le bas, aucun recouvrement de la nav · nappe 568 / 623 / 640
· aucun débordement horizontal · aucune cible sous 44 px · courbe lisse fermée
sur la trame · Top / Flop en encre monochrome · pastille du jour en rouge.

## B — L'app avait raison, **la maquette est corrigée**

| Écart | App | Maquette avant | Corrigé en |
| --- | --- | --- | --- |
| Encours | `221,1 M€` | `24 812 400 €` | `millions(ENCOURS)` — l'abrégé était « hors périmètre » au LOT 11 § 5, donc l'app faisait foi et c'est ma maquette qui divergeait |
| Libellé de delta | « sur la période » | « ce mois » | « sur la période » |
| Bornes de la courbe | `AOÛT` / `SEPT` | `01.08` / `20.08` | `moisCourt()`, dérivé de la date |
| Cabinet | « Cabinet Structura » | « APC Courtage » | `CABINET`, déclaré une fois |
| Conseiller | « Marie » / « M » | « Antoine Bertrand » / « AB » | `UTILISATEUR = "Marie"` — titre, initiale, en-tête de menu et prénom du « Bonjour » en dérivent |

## C — Deux défauts de **ma maquette**, trouvés par la comparaison

1. **La perf était peinte en vert quel que soit son signe.** `color: var(--vert)`
   était écrit en dur ; à −0,4 % la maquette affichait une baisse en vert.
   Corrigé : `perfTeinte` suit le signe (`--rouge` / `--vert`), une seule source.
2. **La courbe pouvait contredire son chiffre.** `COURBE_PTS` était une liste
   écrite à la main, montante, pendant que `PERF_MOIS` pouvait être négatif.
   Corrigé : les douze points sont **engendrés par `PERF_MOIS`** (onde fixe +
   pente dérivée du chiffre) — une perf négative descend, c'est structurel.
   C'est la vraie cause du « problème de courbe sur sa forme ».

## D — À corriger dans **l'app** (lot suivant)

1. **`%%` doublé dans « Concentration émetteurs ».** Les captures 1280 et 1600
   montrent `42,8 M€  18 %%` et `50,9 M€  21 %%` : le suffixe est ajouté deux
   fois — une fois par le formateur, une fois par le gabarit. Un seul des deux
   doit le porter. **Visible en production, sur la dalle la plus lue.**
2. **Le libellé de nav dit « Dashboard », la maquette dit « Tableau de bord ».**
   Toute la nav est en français sauf cet item (et « Pitch Engine » / « Decrement
   Score », qui sont des noms de produit). **À trancher par le client** — je ne
   change pas un libellé de nav de ma propre autorité (règle 7).

## E — Écarts qui ne sont **pas** des écarts

Montants, nombres d'alertes, badge de Barrières, contenu de « À regarder
aujourd'hui », « 0 cette semaine » : données de session. La maquette porte un
jeu de démonstration, l'app le sien. Ne rien aligner là.

## F — La leçon de méthode (03/09, après quatre allers-retours)

« Des outils en bas » voulait dire **le bas de la page**, pas le bas du rail. J'ai
cherché quatre fois au mauvais endroit sans jamais faire défiler l'écran jusqu'en
bas. Deux règles qui s'appliquent à moi désormais :

1. **Toute capture de conformité va jusqu'au dernier pixel.** Un écran ne s'arrête
   pas au pli.
2. **Un « À TOI » que je tranche « ça reste » m'oblige à le dessiner.** Les deux
   dalles pleine largeur étaient arbitrées et non dessinées : c'est ce trou-là qui
   a survécu à six lots. Un arbitrage sans maquette n'est pas un arbitrage.
