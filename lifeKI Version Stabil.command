#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "lifeKI · Stabil"
echo "Wechsel zurück auf die sichere Hauptversion (main)."
echo ""
lifeki_version stable --ask
