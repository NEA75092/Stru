#!/usr/bin/env bash
# menage.sh — supprime du dépôt les documents périmés, en une fois, avec la trace.
#
# À lancer depuis la RACINE DU DÉPÔT (celle qui contient structura-v2/).
# Rien n'est perdu : git garde tout. L'historique EST l'archive — c'est pourquoi
# on supprime au lieu de déplacer vers archive/, qui laissait les documents
# à portée de grep, c'est-à-dire à portée d'erreur (audit-09-08.md § A4).
#
#   bash structura-v2/handoff-septembre/tools/menage.sh --dry-run   # liste, ne touche à rien
#   bash structura-v2/handoff-septembre/tools/menage.sh             # supprime et prépare le commit
#
# Après : `git status` pour relire, puis `git commit`. Le push reste à toi.

set -euo pipefail
DRY=""
[[ "${1:-}" == "--dry-run" ]] && DRY="echo [dry-run] would rm"

if [[ ! -d structura-v2 ]]; then
  echo "✗ Lance ce script depuis la racine du dépôt (celle qui contient structura-v2/)." >&2
  exit 1
fi

# ── 1. Les passes. R3 : un écran se remplace, il ne s'empile pas. ───────────────
PASSES=(
  structura-v2/PASSE-1.md
  structura-v2/PASSE-2.md
  structura-v2/PASSE-3.md
  structura-v2/PASSE-4.md
  structura-v2/PASSE-5.md
  structura-v2/PASSE-6.md
  structura-v2/PASSE-7A-corrections.md
  structura-v2/PASSE-7A-corrections-2.md
  "structura-v2/handoff 7/PASSE-8.md"
  "structura-v2/handoff 7/REFERENCE-PRODUITS.md"
)

# ── 2. Le second CLAUDE.md. Deux fichiers du même nom qui disent autre chose,
#       c'est la divergence garantie (A4). Celui qui gouverne est à la racine
#       du projet design, pas dans structura-v2/.
DOUBLONS=(
  structura-v2/CLAUDE.md
)

# ── 3. Spec absorbée par dashboard.md + dashboard-correctif-02.md (A4). ────────
SPECS_MORTES=(
  structura-v2/handoff-septembre/specs/dashboard-correctif-01.md
)

# ── 4. Captures des passes 1 à 5 : ~30 Mo d'états que plus rien ne vise.
#       Les captures de la direction en vigueur ne sont pas dans ce lot.
CAPTURES=$(git ls-files 'structura-v2/screenshots/passe[1-5]-*' || true)

echo "── Documents périmés ──"
for f in "${PASSES[@]}" "${DOUBLONS[@]}" "${SPECS_MORTES[@]}"; do
  [[ -e "$f" ]] && { echo "  $f"; ${DRY:-git rm -q --} "$f"; } || echo "  (déjà absent) $f"
done

echo "── Captures passes 1-5 ──"
if [[ -n "$CAPTURES" ]]; then
  echo "$CAPTURES" | sed 's/^/  /'
  [[ -z "$DRY" ]] && echo "$CAPTURES" | xargs -r git rm -q --
else
  echo "  (aucune)"
fi

cat <<'FIN'

── RESTE À FAIRE À LA MAIN, dans le MÊME commit ────────────────────────────────
Supprimer PASSE-8.md ne suffit pas : le code y renvoie encore par commentaire.
Un implémenteur qui veut comprendre un token suit la citation et atterrit dans le
document que 00-doctrine.md prétend écraser. Ce n'est pas sa faute, c'est le code
qui l'y envoie (audit-09-08.md § A4).

  grep -rn "passe 8\|passe 7, section" structura-v2/src/

Chaque occurrence devient une référence à `handoff-septembre/specs/00-doctrine.md`,
avec le D-n correspondant. Tant que ce grep renvoie quelque chose, le ménage est
incomplet et la prochaine divergence est déjà écrite.

Puis :
  git status          # relire ce qui part
  git commit -m "menage: suppression des documents perimes (audit-09-08 A4)"
FIN
