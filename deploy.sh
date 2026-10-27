#!/bin/sh
# 사용: ./deploy.sh "커밋 메시지"
set -e
cd "$(dirname "$0")"
STAMP=$(date +%Y%m%d%H%M%S)
for f in games/*/index.html; do
  sed -i '' -E "s/(\.(js|css))\?v=[0-9]+/\1?v=${STAMP}/g" "$f"
done
git add -A
git commit -m "${1:-update}" || true
git push
echo "https://kkiruk-studio.github.io/webgame-lab/"
