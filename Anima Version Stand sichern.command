#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Anima · Stand sichern"
echo "Merkt den aktuellen Code wie ein Foto. Du kannst später genau hierher zurück."
echo ""
anima_version save --ask
