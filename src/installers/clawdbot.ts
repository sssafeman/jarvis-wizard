import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
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

const CLAWDHUB_REPO_CANDIDATES = [
  "https://github.com/clawdbot/{skill}.git",
  "https://github.com/clawdbot/skill-{skill}.git",
  "https://github.com/clawdbot/{skill}-skill.git"
];

function clawdbotConfigPath(): string {
  return path.join(os.homedir(), ".clawdbot", "clawdbot.json");
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
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

export async function installClawdhubSkill(skillName: string, workspacePath: string): Promise<boolean> {
  const workspace = workspacePath === "~" || workspacePath.startsWith("~/")
    ? path.join(os.homedir(), workspacePath.replace(/^~\/?/, ""))
    : workspacePath;
  const skillsPath = path.join(workspace, "skills");
  const targetPath = path.join(skillsPath, skillName);

  await mkdir(skillsPath, { recursive: true });

  if (await pathExists(targetPath)) {
    return true;
  }

  const installResult = await runCommandSafe(`clawdhub install ${shellQuote(skillName)}`, skillsPath);
  if (installResult.ok) {
    return true;
  }

  for (const template of CLAWDHUB_REPO_CANDIDATES) {
    const repo = template.replace("{skill}", skillName);
    const cloneResult = await runCommandSafe(
      `git clone ${shellQuote(repo)} ${shellQuote(skillName)}`,
      skillsPath
    );

    if (cloneResult.ok) {
      return true;
    }
  }

  return false;
}

export async function installSelectedSkills(capabilities: string[], workspacePath: string): Promise<SkillInstallSummary> {
  const installed: string[] = [];
  const failed: string[] = [];
  const selectedSkills = Array.from(
    new Set(capabilities.map((capability) => CAPABILITY_SKILLS[capability]).filter((skill): skill is string => Boolean(skill)))
  );

  for (const skill of selectedSkills) {
    const success = await installClawdhubSkill(skill, workspacePath);
    if (success) {
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
