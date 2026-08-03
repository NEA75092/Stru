#!/bin/bash
# Pousse les commits déjà faits vers GitHub → Netlify rebuild.
# Ne committe jamais : échoue si quelque chose traîne en staging ou modifié.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

git status -sb
echo

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "→ Changements non commités détectés — rien poussé."
  echo "  Committer explicitement (par correctif) avant de relancer, ou"
  echo "  vérifier qu'il ne s'agit pas d'un chantier encore en cours."
  exit 1
fi

if ! git status -sb | grep -q 'ahead'; then
  echo "Déjà à jour avec GitHub. Rien à faire."
  exit 0
fi

git push origin master
echo
echo "OK — push envoyé. Netlify va redéployer sous 1–2 min."
echo "Site : https://zesty-tiramisu-e45883.netlify.app/"
