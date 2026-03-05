#!/usr/bin/env bash
set -euo pipefail

has_node_18() {
  if ! command -v node >/dev/null 2>&1; then
    return 1
  fi

  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  [ "$major" -ge 18 ]
}

install_fnm_and_node() {
  echo "Node.js >= 18 is required. Installing fnm..."

  if ! command -v fnm >/dev/null 2>&1; then
    curl -fsSL https://fnm.vercel.app/install | bash
  fi

  export PATH="$HOME/.fnm:$PATH"
  eval "$(fnm env --shell bash)"
  fnm install 20
  fnm default 20
}

if ! has_node_18; then
  install_fnm_and_node
fi

echo "Running Jarvis Wizard..."
npx @sssafeman/jarvis-wizard@latest
