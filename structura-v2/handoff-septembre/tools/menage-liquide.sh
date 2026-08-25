#!/usr/bin/env bash
# menage-liquide.sh — sort du dépôt tout ce que la direction Liquide périme.
# Lancer depuis la RACINE DU DÉPÔT. --dry-run d'abord, toujours.
#
# Suppression et non archivage : l'historique git EST l'archive (doctrine 11/08).
# Un archive/ laisse les documents à portée de grep, donc d'erreur.
set -euo pipefail

DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

PERIMES=(
  # Specs de la direction Méditerranée / passe 8 — remplacées par les trois
  # specs Liquide. Elles se citent l'une l'autre : elles partent ensemble,
  # sinon check-sources.mjs vire rouge sur des citations pendantes.
  "structura-v2/handoff-septembre/specs/00-doctrine.md"
  "structura-v2/handoff-septembre/specs/dashboard.md"
  "structura-v2/handoff-septembre/specs/dashboard-correctif-01.md"
  "structura-v2/handoff-septembre/specs/dashboard-correctif-02.md"
  "structura-v2/handoff-septembre/specs/design-tokens-v2.md"
  "structura-v2/handoff-septembre/specs/barrieres.md"
  "structura-v2/handoff-septembre/specs/clients.md"
  "structura-v2/handoff-septembre/specs/controles.md"
  "structura-v2/handoff-septembre/specs/decrement-score.md"
  "structura-v2/handoff-septembre/specs/doc-reader.md"
  "structura-v2/handoff-septembre/specs/pitch-engine.md"
  "structura-v2/handoff-septembre/specs/portefeuille.md"
  # Spec d'écran écrite pour la scène 3D, supprimée le 19/08.
  "structura-v2/handoff-septembre/ecrans/dashboard.md"
  # Plan et messages écrits contre l'ancienne anatomie.
  "structura-v2/handoff-septembre/plan-septembre.md"
  "structura-v2/handoff-septembre/messages-claude-code.md"
  # Maquettes périmées encore au dépôt, s'il en reste.
  "structura-v2/handoff-septembre/maquette/Structura.dc.html"
  "structura-v2/handoff-septembre/maquette/Dashboard.dc.html"
)

echo "== ménage Liquide =="
MANQUANTS=0
for f in "${PERIMES[@]}"; do
  if [ -e "$f" ]; then
    if [ "$DRY" = "1" ]; then
      echo "  supprimerait  $f"
    else
      git rm -q "$f"
      echo "  supprimé      $f"
    fi
  else
    echo "  déjà absent   $f"
    MANQUANTS=$((MANQUANTS+1))
  fi
done

echo
echo "-- citations pendantes après ménage --"
# Toute référence, dans un fichier vivant, à un document qu'on vient de sortir.
RESTE=0
for f in "${PERIMES[@]}"; do
  BASE=$(basename "$f")
  HITS=$(grep -rl --exclude-dir=.git --exclude="$BASE" -- "$BASE" . 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    echo "  $BASE encore cité par :"
    echo "$HITS" | sed 's/^/      /'
    RESTE=$((RESTE+1))
  fi
done
[ "$RESTE" = "0" ] && echo "  aucune."

echo
echo "${#PERIMES[@]} entrées · $MANQUANTS déjà absentes · $RESTE citations pendantes"
if [ "$RESTE" != "0" ]; then
  echo "STOP : réécris ces citations avant de committer." >&2
  exit 1
fi
[ "$DRY" = "1" ] && echo "(--dry-run : rien n'a été supprimé)"
