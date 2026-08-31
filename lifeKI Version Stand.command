#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "lifeKI · Wo bin ich?"
echo ""
node scripts/version.mjs status
lifeki_wait
