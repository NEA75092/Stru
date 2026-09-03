# LOT 12 — le bas du rail, pour de bon

Spec : `structura-v2/handoff-septembre/specs/lot-liquide-11-portable-et-vestiges.md`, **§ 1 réécrit**.
Maquette : `handoff-septembre/maquette/Dashboard - Liquide.dc.html` — à jour du 03/09 au soir.

**Le LOT 11 a raté son § 1, et c'est ma spec qui était fausse.** J'avais écrit
« retirer `.sidebar-foot` » et « `.sidebar-tools` : `margin-top: 24px` + filet ».
Tu l'as fait exactement. Mais le client ne parlait pas d'un bloc nommé : il
parlait de **tout ce qui traîne sous la nav**. Les quatre boutons
(recherche · notifications · jour/nuit · profil) sont donc toujours en bas du
rail, et sa capture à 1280 montre en plus le menu MODE DEMO qui s'ouvre **vers le
haut, par-dessus « Doc Reader »**, en carré à angles droits.

Ce que dit le § 1 maintenant :

1. **`.sidebar-tools` est supprimé** — les quatre boutons et le filet avec.
   Après `</nav>`, le rail ne contient plus rien. Preuve n° 1 : le rail a
   **3 enfants** et `0` élément après `</nav>`.
2. **jour/nuit + profil** remontent en haut à droite du premier plan, au-dessus
   de la carte d'agenda, en 44 × 44 sur le verre.
3. **recherche : supprimée sans remplacement** — elle est déjà dans la barre
   d'outils de chaque écran avec son `⌘K`. **notifications : supprimée** — « À
   regarder aujourd'hui » est le centre de notifications.
4. **Le menu de profil** s'ancre au nouveau couple, ouvre vers le bas, en
   `var(--r-dalle)`, trois entrées de 44 px, Mode démo avec son état lu sur
   l'état. Preuve n° 10 : intersection nulle avec les items de nav.
5. **`UTILISATEUR` est déclaré une fois** et sert le titre, les initiales,
   l'en-tête du menu et le prénom du « Bonjour ».

Deux points de ton retour, réglés côté maquette :

- **`.dash-platre` vs `.dash-body`** : c'est `.dash-body` qui a raison, la spec
  citait une classe morte. Je ne renomme rien.
- **Colonne de pastille émetteur** : ton `auto` a raison — la pastille porte
  l'id du registre, pas un sigle de 2 lettres. La maquette passe en
  `34px auto minmax(0,1fr) auto`. Le 28px de la spec était faux.

Sondes : `preuve-liquide --lot 11` (preuves 1 et 10 réécrites) **et** sweep
`--lot 5 → 11`. Mesures aux deux largeurs, jour et nuit.
