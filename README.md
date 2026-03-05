# Jarvis Setup Wizard

A single-command installer that sets up your own personalized Jarvis AI assistant powered by [Clawdbot](https://github.com/clawdbot/clawdbot).

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/sssafeman/jarvis-wizard/main/install.sh | bash
```

## What it does

Walks you through a 7-step terminal UI wizard:

1. **Welcome** — overview of what you need
2. **User Info** — your name, timezone, occupation
3. **Personality** — assistant name, style, address mode
4. **API Keys** — Anthropic + Telegram (validated live)
5. **Capabilities** — select features (voice, reminders, Canvas, etc.)
6. **Installation** — installs Clawdbot, generates workspace files, starts daemon
7. **Complete** — your assistant is live on Telegram

## Requirements

- Node.js ≥ 18 (installed automatically via fnm if missing)
- Anthropic API key
- Telegram bot token (from [@BotFather](https://t.me/BotFather))

## Manual run

```bash
git clone https://github.com/sssafeman/jarvis-wizard
cd jarvis-wizard
npm install
npx tsx src/index.tsx
```

## Phases

- [x] Phase 1 — Full wizard UI + workspace file generation
- [x] Phase 2 — Skills & integrations (Canvas, GitHub, FACEIT, Todoist + setup stubs)
- [x] Phase 3 — Polish + resume/repair + smoke test
- [ ] Phase 4 — npm publish + distribution

## Built by

[@sssafeman](https://github.com/sssafeman)
