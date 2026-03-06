#!/usr/bin/env bash
set -euo pipefail

PKG="@sssafeman/jarvis-wizard"

has_node_18() {
  if ! command -v node >/dev/null 2>&1; then
    return 1
  fi

  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  [ "$major" -ge 18 ]
}

install_fnm_and_node() {
  printf '\n[Jarvis Wizard Installer]\n'
  printf 'Node.js >= 18 is required. Installing fnm + Node.js...\n'

  if ! command -v fnm >/dev/null 2>&1; then
    curl -fsSL https://fnm.vercel.app/install | bash
  fi

  export PATH="$HOME/.fnm:$HOME/.local/share/fnm:$PATH"
  eval "$(fnm env --shell bash)"
  fnm install 20
  fnm default 20
}

print_header() {
  cat <<'EOF'
=========================================
  Jarvis Setup Wizard
  One-command Clawdbot onboarding
=========================================
EOF
}

if ! has_node_18; then
  install_fnm_and_node
fi

print_header
echo "Launching via npx..."

if ! npx --yes "$PKG@latest"; then
  echo "npx failed. Falling back to global install..."
  npm install -g "$PKG"
  jarvis-wizard
fi
