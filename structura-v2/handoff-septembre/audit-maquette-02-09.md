# audit-maquette-02-09 — l'inventaire complet des écarts, maquette vs code

02/09/2026. Maquette lue **intégralement** (684 lignes) :
`handoff-septembre/maquette/Dashboard - Liquide.dc.html`.
Code lu au dépôt à `999468a` : `src/shell.css`, `src/dashboard.css`, `src/relief.css`,
`src/modules/app-dashboard.js`, `index.html`.

**Pourquoi ce document existe.** Les LOT 5 à 7 ont corrigé les écarts un par un, à mesure
que les captures les révélaient. C'était ma faute de méthode : je spécifiais depuis la
partie de la maquette que j'avais sous les yeux, jamais depuis la maquette entière. Ce
document est la liste exhaustive. **Tout écart non listé ici n'existe pas** ; s'il en
sort un plus tard, c'est que ce document était faux, et il le dira.

Verdict par ligne : **CODE** = le code a raison, la maquette suit · **MAQ** = la maquette
fait foi, le code change · **TRANCHÉ** = écart connu, déjà arbitré, ne se rouvre pas ·
**À TOI** = je ne peux pas trancher seul.

---

## 1. La coquille — le plus gros écart, et je ne l'avais jamais signalé

| nº | Écart | Maquette | Code | Verdict |
|---|---|---|---|---|
| 1.1 | **La barre d'en-tête n'existe pas** | aucun bandeau haut : l'eau commence sous le bord du cadre | `.header` plein largeur : ticker d'indices, bascule jour/nuit, pastille utilisateur, badge LIVE, horloge + date | **MAQ** |
| 1.2 | **Rangée d'outils en pied de rail** | quatre cibles rondes 44px, `margin-top:auto` : recherche, notifications, jour/nuit, avatar « AB » | absente | **MAQ** |
| 1.3 | Ticker d'indices | n'existe pas | `initTicker()` + `INDICES` (11 valeurs en dur) | **MAQ** — le bloc sort, `INDICES` avec lui |
| 1.4 | Horloge, date, badge LIVE | n'existent pas | `tick()` toutes les secondes, `#clk`, `#dt-str`, `.live-badge` | **MAQ** |
| 1.5 | Libellé du premier onglet | « Tableau de bord » | « Dashboard » | **À TOI** — la nav entière est en anglais côté code (Pitch Engine, Decrement Score, Doc Reader). Traduire les neuf ou n'en traduire aucun. |
| 1.6 | Marque | GUERFIN + `assets/guerfin-symbole-clair.png` | STRUCTURA + `assets/structura-mark.png` | **TRANCHÉ** (LOT 2 § 6 : on emploie l'existant, décision client en attente) |

`.header` est resté hors périmètre de tous les lots depuis le 25/08 (« hors périmètre de
ce lot, inchangé », `shell.css`). C'est pour cela qu'il porte encore la peinture d'avant
Liquide : filets clairs, rayon `--radius-lg`, mono majuscule, pastille pêche. Il ne
s'agit pas de le repeindre : **la maquette ne l'a pas.**

---

## 2. Le plâtre — pas implémenté du tout

| nº | Écart | Maquette | Code | Verdict |
|---|---|---|---|---|
| 2.1 | Structure | **trois dalles mates**, `repeat(3,minmax(0,1fr))`, gap 22, padding 34, `--dalle-a/b/c`, entrées décalées 0/90/180ms | cinq blocs empilés, dont trois **à nu sur le fond** (ni dalle, ni rayon, ni fond) | **MAQ** |
| 2.2 | Dalle 1 | « Concentration émetteurs » : grand chiffre 44px, 5 lignes à jauge 2px, ligne « Les deux premiers », pied | « Exposition par groupe bancaire » : tableau à swatch carré et trait souligné | **MAQ** |
| 2.3 | Dalle 2 | « Top / Flop produits » : bascule Top 5 / Flop 5, jauge 3px + repère de barrière, sigle émetteur en cercle 28px | « Top / Flop VL » : liste unique de dix, axe divergent, trame d'encre | **MAQ** pour la boîte et la bascule ; **CODE** pour la trame d'encre et le repère (acquis du CLAUDE.md) |
| 2.4 | Dalle 3 | « Événements de la semaine » : grand chiffre, 5 lignes date/sigle/titre/montant, pied « Ouvrir l'agenda » | n'existe pas au Dashboard | **MAQ** |
| 2.5 | Rangée de quatre KPI | n'existe pas | `.kpi-row` : performance latente, franchies, surveillance, portefeuille actif | **MAQ** — sort. Les quatre nombres sont tous ailleurs (§ 5 du LOT 8) |
| 2.6 | Dalle de performance du portefeuille | n'existe pas | `.dash-perf-section`, déjà peinte en dalle mate (LOT 5) | **À TOI** |
| 2.7 | « Sous la protection du capital » | n'existe pas | `.cap-*`, règle graduée −60/+20 | **À TOI** — figure signature tranchée le 05/08 (D2), la maquette ne la remplace pas |
| 2.8 | Pieds de dalle | un `button` par dalle, `border-top`, libellé + chevron sortant | aucun | **MAQ** |
| 2.9 | Odomètre | les trois grands chiffres montent en 900 ms (`roul`) | aucun | **MAQ** |

---

## 3. Le premier plan — conforme depuis `999468a`, sauf quatre détails

| nº | Écart | Maquette | Code | Verdict |
|---|---|---|---|---|
| 3.1 | **Libellés de période du cadre d'encours** | « Mois · Trimestre · Année · Depuis l'origine » | « Mois · 6M · 1A · Tout » | **MAQ** — c'est moi qui ai introduit l'écart au LOT 6 |
| 3.2 | **Le grand chiffre d'encours** | euros entiers : « 24 812 400 € » | abrégé : « 204,1 M€ » | **À TOI** — la maquette dit le montant exact, le code l'abrège ; à 40px les deux tiennent |
| 3.3 | Kicker | « mis à jour le {date} **à {heure}** · {cabinet} » | « mis à jour le 02.09 · Cabinet Structura » — pas d'heure | **CODE** — vérifié : `latestVlAsOf()` ne renvoie qu'une date, les VL émetteur n'ont pas d'horodatage dans le modèle. L'heure de la maquette vient d'une constante de démo. L'afficher serait inventer une donnée. |
| 3.4 | Phrase de delta | « soit {delta} **ce mois** » | « soit {delta} sur la période » | **CODE** — la fenêtre est glissante depuis le LOT 7, « ce mois » serait faux |
| 3.5 | **Pastille du jour dans l'agenda** | fond `--rouge`, encre `--rouge-encre` | fond blanc, encre `--color-band` | **MAQ** |
| 3.6 | Pastille de jour chargé | `rgba(255,255,255,.7)` sous le numéro | fond `--flottant` **sur** le numéro + point dessous | **MAQ** |
| 3.7 | Contenu de « À regarder aujourd'hui » | relation client : bulletin à signer, KYC, entrée en gestion — avec verbes (Relancer / Compléter / Préparer) | barrières : nom du produit + `statusLabel` (FRANCHIE) | **TRANCHÉ** (LOT 6, garde-fou nº 3 : l'app n'a aucune donnée de relation client ; un verbe serait inventé) |

---

## 4. Ce qui est conforme, et que personne ne doit « corriger »

Vérifié ligne à ligne, aucun écart : le cadre de page (30px, rayon `--r-dalle`, bordure
`--marine 22%`), le rail (236px, dégradé marine trois arrêts, items 44px, liseré 2px de
l'actif, badge de Barrières), les huit couches de la nappe et le fondu, la géométrie du
premier plan (640 bord à bord, deux colonnes 1fr/440, gap 40, padding 52/28), les deux
épaisseurs de verre du cadre d'encours (blur 14 / 18), la carte d'agenda, l'échelle de
rayons, l'absence totale de `box-shadow`, le mode nuit.

---

## 5. L'ordre des lots, et ce qu'il reste

1. **LOT 8 — le plâtre** (`specs/lot-liquide-08-platre-conforme.md`, écrit) : § 2 en
   entier. C'est le gros morceau, et c'est ce qu'on voit d'abord.
2. **LOT 9 — la coquille** : § 1 en entier. La barre d'en-tête sort, la rangée d'outils
   entre en pied de rail. Petit lot, gros effet.
3. **LOT 10 — les détails du premier plan** : § 3, les trois lignes marquées MAQ.
   Vingt minutes.

**Les quatre « À TOI » : je les tranche, tu n'as rien à cocher.** Ce sont les seuls
points de tout l'écran qui opposent la maquette à une décision antérieure ; voilà ma
décision et sa raison. Un mot de toi renverse n'importe laquelle.

- **1.5 libellés de nav → CODE.** « Tableau de bord » est un libellé français isolé au
  milieu de huit anglais (Pitch Engine, Decrement Score, Doc Reader). Traduire les neuf
  est une décision de produit, pas de direction visuelle : hors de ces lots.
- **2.6 dalle de performance → elle reste**, en dalle du patron du § 3. C'est le seul
  endroit de l'app qui porte l'historique complet et ses fenêtres.
- **2.7 « Sous la protection du capital » → elle reste**, même patron. Figure signature
  tranchée le 05/08 (D2) ; la maquette n'en propose aucun remplacement, et la supprimer
  ferait perdre la seule lecture de l'ampleur d'un franchissement.
- **3.2 encours → CODE, abrégé.** La démo de la maquette porte 24 M€ ; le portefeuille
  réel en porte 204. « 204 148 320 € » à 40px est un nombre qu'on ne lit pas.

Donc : le plâtre a **trois enfants** — la grille de trois dalles, puis ces deux dalles
pleine largeur.
