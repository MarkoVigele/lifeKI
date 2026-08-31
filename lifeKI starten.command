#!/bin/zsh
cd "$(dirname "$0")"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

PORT=45221
URL="http://127.0.0.1:${PORT}"

if lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "lifeKI läuft bereits unter ${URL}"
  open "${URL}"
  echo ""
  echo "Taste zum Schließen …"
  read -r
  exit 0
fi

if [ ! -d node_modules ]; then
  echo "Abhängigkeiten fehlen — installiere einmalig …"
  npm install || exit 1
fi

echo "lifeKI startet unter ${URL}"
echo "Dieses Fenster offen lassen. Zum Beenden: lifeKI stoppen.command"
echo "Ordner: ~/Documents/Projekte/lifeKI"
echo ""
(sleep 1.5 && open "${URL}") &
npm run dev
