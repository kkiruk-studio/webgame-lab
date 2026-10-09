#!/bin/sh
# 사용: ./deploy.sh "커밋 메시지"
set -e
cd "$(dirname "$0")"
git add -A
git commit -m "${1:-update}" || true
git push
echo "https://kkiruk-studio.github.io/webgame-lab/"
