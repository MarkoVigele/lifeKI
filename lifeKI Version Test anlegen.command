#!/bin/zsh
cd "$(dirname "$0")"
source scripts/finder-env.zsh

echo "lifeKI · Test anlegen"
echo "Neue Spielwiese von hier. Stabil bleibt unberührt."
echo ""
lifeki_version new-test --ask
