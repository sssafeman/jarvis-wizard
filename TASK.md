Build Phase 1 (MVP) of the Jarvis Setup Wizard — a Node.js + TypeScript + Ink TUI that lets anyone set up their own personalized Jarvis AI assistant from scratch.

## Project: jarvis-wizard
## Location: ~/Projects/jarvis-wizard (git repo already initialized)

## What to build in Phase 1:

### 1. Project setup
- `package.json` with: ink, react, @types/react, typescript, tsx (for running TS directly), commander
- `tsconfig.json` for modern TypeScript
- `src/index.tsx` — entry point
- `install.sh` — bootstrap bash script (checks Node.js ≥18, installs via fnm if missing, then runs `npx @sssafeman/jarvis-wizard@latest`)

### 2. Wizard state type (`src/state/wizard-state.ts`)
```typescript
interface WizardState {
  user: { name: string; callName: string; timezone: string; occupation: string; techLevel: string; };
  personality: { assistantName: string; emoji: string; style: string; addressAs: string; customNotes: string; };
  keys: { anthropic: string; telegramBot: string; brave: string; };
  model: { default: string; };
  capabilities: string[];
  integrations: Record<string, Record<string, string>>;
  workspacePath: string;
  gatewayPort: number;
  telegramChatId: string;
}
```

### 3. Wizard steps (all in `src/steps/`)

**Welcome.tsx** — shows ASCII art header, what you'll need (Anthropic key, Telegram token), [Let's go] button

**UserInfo.tsx** — collects:
- Name (what to call them)
- Timezone (auto-detect from system, show as default)
- Occupation (Student / Developer / Creative / Other)
- Tech level (Advanced terminal user / Intermediate / Beginner)

**Personality.tsx** — collects:
- Assistant name (default: Jarvis)
- Emoji (default: ⚡)
- Style: Direct & concise / Friendly & conversational / Professional / Casual
- Address as: By name / "Sir" (butler mode) / Nothing
- Free text for extra personality notes

**ApiKeys.tsx** — collects:
- Anthropic API key (validate via `https://api.anthropic.com/v1/models` with `x-api-key` header, accept if 200)
- Telegram bot token (validate via `https://api.telegram.org/bot${TOKEN}/getMe`, show bot username on success)
- Brave Search API key (optional, skip button)
- Model: Claude Sonnet 4.5 (default) / Claude Opus 4 / Claude Haiku

**Capabilities.tsx** — multi-select checklist:
- [x] Web search & research (pre-checked if Brave key entered)
- [ ] Voice messages (installs edge-tts + ffmpeg + jarvis-speak/listen scripts)
- [ ] Reminders (remind-me skill)
- [ ] News & Hacker News (hn skill)
- [ ] Note-taking / Obsidian (obsidian-daily skill)
- [ ] Study & Canvas LMS (canvas-lms skill — triggers follow-up)
- [ ] GitHub integration
- [ ] Gaming stats / FACEIT CS2
- [ ] YouTube transcripts (youtube-watcher skill)
- [ ] Japanese language (japanese-translation-and-tutor skill)
- [ ] Email monitoring (Outlook OAuth — shows "requires setup after install")

**Installation.tsx** — shows live progress spinners:
1. Installing Clawdbot globally (`npm install -g clawdbot`)
2. Creating workspace at chosen path (default ~/clawd)
3. Generating workspace files (SOUL.md, USER.md, IDENTITY.md, AGENTS.md, TOOLS.md, MEMORY.md, HEARTBEAT.md)
4. Writing Clawdbot config (~/.clawdbot/clawdbot.json)
5. Installing selected skills
6. Setting up voice pipeline (if selected)
7. Starting Clawdbot gateway daemon
8. Asking user: "Send a message to your Telegram bot (@botname) to get your Chat ID, then enter it here: ___"

**Complete.tsx** — success screen with:
- Bot name, workspace path
- Quick commands reference
- "Share with friends: curl -fsSL https://raw.githubusercontent.com/sssafeman/jarvis-wizard/main/install.sh | bash"

### 4. Workspace file templates (`src/templates/`)
TypeScript functions that take WizardState and return markdown strings:

**soul.ts** — generates SOUL.md based on personality.style:
- direct: "Direct. Factual. No fluff. Be honest... Treat {name} as capable peer. Short responses."
- friendly: "Warm, honest, conversational..."
- professional: "Professional, precise..."
- casual: "Relaxed, fun..."
Plus voice/address section based on addressAs

**user.ts** — generates USER.md with name, callName, timezone, occupation, tech level, preferences

**identity.ts** — generates IDENTITY.md with assistantName, emoji

**agents.ts** — copy the standard AGENTS.md content verbatim (it's the same for everyone)

**tools.ts** — generates TOOLS.md header + sections for each configured integration (keys, canvas config if set up, etc.)

**memory.ts** — minimal seed: who the assistant is, created by, today's date

**heartbeat.ts** — empty with comments

### 5. Clawdbot config writer (`src/installers/clawdbot.ts`)
Writes `~/.clawdbot/clawdbot.json` in this format:
```json
{
  "model": "anthropic/claude-sonnet-4-5",
  "anthropic": { "apiKey": "..." },
  "gateway": { "port": 18789, "bind": "loopback", "auth": "token" },
  "channels": {
    "telegram": {
      "token": "...",
      "allowedUsers": []
    }
  },
  "workspace": "~/clawd"
}
```

### 6. Main app (`src/app.tsx`)
Simple step-by-step state machine using React useState. Steps array, currentStep index, shared state object. Each step receives state + onNext(partialState) callback.

### 7. Reusable components (`src/components/`)
- **TextInput.tsx** — labeled text field with validation support
- **PasswordInput.tsx** — masked input (shows *** while typing)  
- **SelectList.tsx** — arrow-key navigable single select
- **MultiSelect.tsx** — space to toggle, enter to confirm
- **Spinner.tsx** — animated spinner with label
- **StepHeader.tsx** — step title + subtitle

## Style guidelines
- Use Ink's `Box`, `Text`, `useInput`, `useApp` primitives
- Colors: green for success, red for error, yellow for warning, cyan for prompts
- Keep each step focused — no overwhelming screens
- Show validation feedback inline (✓ Valid! or ✗ Invalid: reason)

## Voice pipeline installer (`src/installers/voice.ts`)
When voice capability selected:
1. Check if edge-tts is installed: `pip show edge-tts`
2. If not: `pip install edge-tts`
3. Check if ffmpeg is installed: `which ffmpeg`
4. Write `~/bin/jarvis-speak` script (the one from the user's existing setup)
5. Write `~/bin/jarvis-listen` script
6. chmod +x both
7. Add `~/bin` to PATH in ~/.config/fish/config.fish if not present

The jarvis-speak script content:
```bash
#!/usr/bin/env bash
# Jarvis TTS — sends voice message via Telegram
VOICE="${JARVIS_VOICE:-en-GB-RyanNeural}"
URGENT=false
TEXT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --voice) VOICE="$2"; shift 2 ;;
    --urgent) URGENT=true; shift ;;
    *) TEXT="$TEXT $1"; shift ;;
  esac
done

TEXT="${TEXT# }"
if [ -z "$TEXT" ]; then echo "Usage: jarvis-speak [--voice VOICE] [--urgent] <text>"; exit 1; fi

TMP=$(mktemp --suffix=.mp3)
edge-tts --voice "$VOICE" --text "$TEXT" --write-media "$TMP" 2>/dev/null
CHAT_ID=$(jq -r '.channels.telegram.allowedUsers[0] // empty' ~/.clawdbot/clawdbot.json 2>/dev/null)
BOT_TOKEN=$(jq -r '.channels.telegram.token // empty' ~/.clawdbot/clawdbot.json 2>/dev/null)

if [ -n "$CHAT_ID" ] && [ -n "$BOT_TOKEN" ]; then
  curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendVoice" \
    -F chat_id="$CHAT_ID" \
    -F voice=@"$TMP" > /dev/null
  echo "Sent voice message (${#TEXT} chars, voice: $VOICE)"
else
  echo "ERROR: Telegram not configured. Set chat ID in ~/.clawdbot/clawdbot.json"
fi
rm -f "$TMP"
```

## Final deliverable for Phase 1
A working wizard that:
1. Runs via `npx tsx src/index.tsx` from the project directory
2. Walks through all 7 steps
3. Generates correct workspace files
4. Writes valid clawdbot.json config
5. Installs voice pipeline if selected
6. Is ready to test end-to-end

## When done, notify:
clawdbot gateway wake --text "Done: jarvis-wizard Phase 1 complete. Ready to test." --mode now
