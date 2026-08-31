#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Anima · Wo bin ich?"
echo ""
node scripts/version.mjs status
anima_wait
