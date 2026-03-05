import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCommandSafe } from "./shell.js";

const JARVIS_SPEAK_SCRIPT = String.raw`#!/usr/bin/env bash
# Jarvis TTS — sends voice message via Telegram
VOICE="\${JARVIS_VOICE:-en-GB-RyanNeural}"
URGENT=false
TEXT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --voice) VOICE="$2"; shift 2 ;;
    --urgent) URGENT=true; shift ;;
    *) TEXT="$TEXT $1"; shift ;;
  esac
done

TEXT="\${TEXT# }"
if [ -z "$TEXT" ]; then echo "Usage: jarvis-speak [--voice VOICE] [--urgent] <text>"; exit 1; fi

TMP=$(mktemp --suffix=.mp3)
edge-tts --voice "$VOICE" --text "$TEXT" --write-media "$TMP" 2>/dev/null
CHAT_ID=$(jq -r '.channels.telegram.allowedUsers[0] // empty' ~/.clawdbot/clawdbot.json 2>/dev/null)
BOT_TOKEN=$(jq -r '.channels.telegram.token // empty' ~/.clawdbot/clawdbot.json 2>/dev/null)

if [ -n "$CHAT_ID" ] && [ -n "$BOT_TOKEN" ]; then
  curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendVoice" \
    -F chat_id="$CHAT_ID" \
    -F voice=@"$TMP" > /dev/null
  echo "Sent voice message (\${#TEXT} chars, voice: $VOICE)"
else
  echo "ERROR: Telegram not configured. Set chat ID in ~/.clawdbot/clawdbot.json"
fi
rm -f "$TMP"
`;

const JARVIS_LISTEN_SCRIPT = `#!/usr/bin/env bash
# Jarvis listen helper - normalizes input audio for downstream transcription tools.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: jarvis-listen <audio-file>"
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ERROR: ffmpeg not installed"
  exit 1
fi

INPUT="$1"
if [ ! -f "$INPUT" ]; then
  echo "ERROR: file not found: $INPUT"
  exit 1
fi

OUT=$(mktemp --suffix=.wav)
ffmpeg -y -i "$INPUT" -ar 16000 -ac 1 "$OUT" >/dev/null 2>&1
echo "$OUT"
`;

async function detectPipBinary(): Promise<string> {
  const pip = await runCommandSafe("command -v pip");
  if (pip.ok && pip.stdout.trim()) {
    return "pip";
  }

  const pip3 = await runCommandSafe("command -v pip3");
  if (pip3.ok && pip3.stdout.trim()) {
    return "pip3";
  }

  throw new Error("pip or pip3 is required to install edge-tts");
}

async function ensureEdgeTtsInstalled(): Promise<void> {
  const pipBinary = await detectPipBinary();
  const check = await runCommandSafe(`${pipBinary} show edge-tts`);

  if (check.ok) {
    return;
  }

  const install = await runCommandSafe(`${pipBinary} install edge-tts`);
  if (!install.ok) {
    throw new Error(install.stderr || "Failed to install edge-tts");
  }
}

async function ensureFfmpegInstalled(): Promise<void> {
  const ffmpeg = await runCommandSafe("which ffmpeg");
  if (!ffmpeg.ok || !ffmpeg.stdout.trim()) {
    throw new Error("ffmpeg is required for voice mode. Install ffmpeg and re-run.");
  }
}

async function ensureBinScripts(): Promise<void> {
  const binDir = path.join(os.homedir(), "bin");
  await mkdir(binDir, { recursive: true });

  const speakPath = path.join(binDir, "jarvis-speak");
  const listenPath = path.join(binDir, "jarvis-listen");

  await writeFile(speakPath, JARVIS_SPEAK_SCRIPT, "utf8");
  await writeFile(listenPath, JARVIS_LISTEN_SCRIPT, "utf8");
  await chmod(speakPath, 0o755);
  await chmod(listenPath, 0o755);
}

async function ensureFishPath(): Promise<void> {
  const fishDir = path.join(os.homedir(), ".config", "fish");
  const fishConfig = path.join(fishDir, "config.fish");

  await mkdir(fishDir, { recursive: true });

  let content = "";
  try {
    content = await readFile(fishConfig, "utf8");
  } catch {
    content = "";
  }

  const line = "set -gx PATH $HOME/bin $PATH";
  if (!content.includes("$HOME/bin")) {
    const nextContent = content.trim().length > 0 ? `${content.trim()}\n${line}\n` : `${line}\n`;
    await writeFile(fishConfig, nextContent, "utf8");
  }
}

export async function setupVoicePipeline(): Promise<void> {
  await ensureEdgeTtsInstalled();
  await ensureFfmpegInstalled();
  await ensureBinScripts();
  await ensureFishPath();
}
