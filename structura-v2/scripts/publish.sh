#!/bin/bash
# Prépare un commit Structura. Le push reste une étape explicite.
# Usage :
#   npm run publish:prep
#   npm run publish:prep -- "Mon message"
# Puis :
#   npm run publish

set -e
APP="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$APP/.." && pwd)"
cd "$ROOT"

MSG="${1:-Mise à jour Structura $(date '+%Y-%m-%d %H:%M')}"

echo "→ Repo : $ROOT"
echo "→ Message : $MSG"
echo
git status -sb
echo

git add structura-v2 netlify.toml README.md .gitignore 2>/dev/null || true
git add -u

if git diff --cached --quiet; then
  echo "Rien de nouveau à committer."
else
  git commit -m "$MSG"
  echo
  echo "Commit créé."
fi

echo
echo "Pour publier sur le site Netlify, lance :"
echo "  npm run publish"
echo "ou :"
echo "  git push origin master"
