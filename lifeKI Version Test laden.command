#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "lifeKI · Test laden"
echo "Lädt eine vorhandene Spielwiese."
echo ""
lifeki_version open-test --ask
