# LOT 8 — message à Claude Code

Contexte, à lire d'abord : `structura-v2/handoff-septembre/audit-maquette-02-09.md`.
C'est l'inventaire **exhaustif** des écarts entre la maquette et le code, fait après
lecture intégrale des 684 lignes de la maquette. Les LOT 8, 9 et 10 en sont les trois
tranches. Rien d'autre ne reste sur le Dashboard.

Spec de ce lot : `structura-v2/handoff-septembre/specs/lot-liquide-08-platre-conforme.md`.

**Ce lot est le gros morceau : le plâtre n'a jamais été implémenté.** Sous la nappe,
l'écran porte encore cinq blocs de l'ancienne anatomie, dont trois posés à nu sur le
fond. La maquette a trois dalles mates en trois colonnes.

Ce que la spec te demande, en résumé :

- la grille du plâtre : `repeat(3, minmax(0,1fr))`, gap 22, `align-items: start` ;
- trois dalles au même patron (§ 3) : padding 34, `var(--r-dalle)`,
  `--dalle-a/b/c`, gap 34, survol `translateY(-3px)`, titre 16.5px, un grand chiffre
  44px avec sa phrase de contexte, un corps, un pied en `button` avec `border-top` ;
- les trois corps (§ 4) : Concentration émetteurs, Top / Flop produits avec bascule
  Top 5 / Flop 5, Événements de la semaine ;
- l'odomètre des trois grands chiffres (§ 4 bis) : une seule montée de 900 ms, en
  réemployant `setTextFlash` ;
- la rangée de quatre KPI sort du Dashboard (§ 5), `bindKpiTilt` avec elle. Les règles
  `.kpi*` **restent** au dépôt : quatre autres écrans les consomment ;
- la dalle de performance et « Sous la protection du capital » **restent**, repeintes au
  patron du § 3, pleine largeur sous la grille de trois. C'est mon arbitrage, il est
  motivé dans l'audit § 5.

**Aucune donnée inventée.** Les trois dalles réemploient `renderIssuerExposure`,
`renderVlTopFlop` et `buildProductCalendarEvents` — le § 4 dit lequel pour chacune. Si
l'une de ces sources ne donne pas ce que la dalle demande, **arrête-toi et nomme le
trou** au lieu de le combler.

**Zéro token nouveau.** Si un token nommé au § 6 n'existe pas au dépôt, arrête-toi et
nomme-le.

Preuves : § 8, dont **deux mesurées en DOM** (trois colonnes égales, cibles de pied
≥ 44 px). Une sonde qui ne lit que le CSS écrit ne prouve pas un écran — c'est ce qui
nous a coûté le LOT 7.
