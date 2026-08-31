export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

lifeki_wait() {
  echo ""
  echo "Taste zum Beenden …"
  read -r
}

lifeki_version() {
  node scripts/version.mjs "$@"
  local code=$?
  lifeki_wait
  return $code
}
