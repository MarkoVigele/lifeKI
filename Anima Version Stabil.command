#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Anima · Stabil"
echo "Wechsel zurück auf die sichere Hauptversion (main)."
echo ""
anima_version stable --ask
