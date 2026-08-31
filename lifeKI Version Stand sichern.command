#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "lifeKI · Stand sichern"
echo "Merkt den aktuellen Code wie ein Foto. Du kannst später genau hierher zurück."
echo ""
lifeki_version save --ask
