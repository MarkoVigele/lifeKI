#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Anima · Stand laden"
echo "Öffnet einen zuvor gesicherten Schnappschuss."
echo ""
anima_version load --ask
