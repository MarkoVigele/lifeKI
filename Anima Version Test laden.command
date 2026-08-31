#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Anima · Test laden"
echo "Lädt eine vorhandene Spielwiese."
echo ""
anima_version open-test --ask
