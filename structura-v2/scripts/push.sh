#!/bin/bash
set -e
APP="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$APP/.." && pwd)"
cd "$ROOT"
echo "→ Push master → GitHub (Netlify suivra)…"
git push origin master
echo
echo "OK. Site : https://zesty-tiramisu-e45883.netlify.app/"
