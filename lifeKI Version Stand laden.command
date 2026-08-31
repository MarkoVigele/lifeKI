#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "lifeKI · Stand laden"
echo "Öffnet einen zuvor gesicherten Schnappschuss."
echo ""
lifeki_version load --ask
