import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { WizardState } from "../state/wizard-state.js";
import { runCommand, runCommandSafe } from "./shell.js";

export interface SkillInstallSummary {
  installed: string[];
  failed: string[];
}

const CAPABILITY_SKILLS: Record<string, string> = {
  reminders: "remind-me",
  hn_news: "hn",
  obsidian_notes: "obsidian-daily",
  canvas_lms: "canvas-lms",
  youtube_transcripts: "youtube-watcher",
  japanese_language: "japanese-translation-and-tutor"
};

function clawdbotConfigPath(): string {
  return path.join(os.homedir(), ".clawdbot", "clawdbot.json");
}

export async function installClawdbotGlobal(): Promise<void> {
  await runCommand("npm install -g clawdbot");
}

export async function writeClawdbotConfig(state: WizardState): Promise<string> {
  const dir = path.join(os.homedir(), ".clawdbot");
  const file = clawdbotConfigPath();

  await mkdir(dir, { recursive: true });

  const config = {
    model: state.model.default,
    anthropic: {
      apiKey: state.keys.anthropic
    },
    gateway: {
      port: state.gatewayPort,
      bind: "loopback",
      auth: "token"
    },
    channels: {
      telegram: {
        token: state.keys.telegramBot,
        allowedUsers: state.telegramChatId ? [state.telegramChatId] : []
      }
    },
    workspace: state.workspacePath
  };

  await writeFile(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return file;
}

export async function updateTelegramChatId(chatId: string): Promise<void> {
  const file = clawdbotConfigPath();
  const raw = await readFile(file, "utf8");
  const config = JSON.parse(raw) as {
    channels?: { telegram?: { allowedUsers?: string[] } };
  };

  if (!config.channels) {
    config.channels = {};
  }

  if (!config.channels.telegram) {
    config.channels.telegram = {};
  }

  config.channels.telegram.allowedUsers = chatId ? [chatId] : [];

  await writeFile(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function installSelectedSkills(capabilities: string[]): Promise<SkillInstallSummary> {
  const installed: string[] = [];
  const failed: string[] = [];

  for (const capability of capabilities) {
    const skill = CAPABILITY_SKILLS[capability];
    if (!skill) {
      continue;
    }

    const result = await runCommandSafe(`clawdbot skill install ${skill}`);
    if (result.ok) {
      installed.push(skill);
    } else {
      failed.push(skill);
    }
  }

  return { installed, failed };
}

export async function startGatewayDaemon(): Promise<void> {
  const result = await runCommandSafe("clawdbot gateway start --daemon");

  if (result.ok) {
    return;
  }

  const fallback = await runCommandSafe("clawdbot gateway daemon start");
  if (!fallback.ok) {
    throw new Error(result.stderr || fallback.stderr || "Failed to start clawdbot gateway daemon");
  }
}
