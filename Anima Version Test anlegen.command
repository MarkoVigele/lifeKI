#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "Anima · Test anlegen"
echo "Neue Spielwiese von hier. Stabil bleibt unberührt."
echo ""
anima_version new-test --ask
