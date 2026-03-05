import { readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface ExistingInstall {
  hasClawdbotConfig: boolean;
  hasWorkspace: boolean;
  workspacePath?: string;
  configuredBot?: string;
}

interface ClawdbotConfig {
  workspace?: string;
  channels?: {
    telegram?: {
      username?: string;
      botUsername?: string;
      bot?: string;
    };
  };
}

function expandHomePath(inputPath: string): string {
  if (inputPath === "~") {
    return os.homedir();
  }

  if (inputPath.startsWith("~/")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }

  return inputPath;
}

function compactHomePath(inputPath: string): string {
  const home = os.homedir();
  if (inputPath === home) {
    return "~";
  }

  if (inputPath.startsWith(`${home}${path.sep}`)) {
    return `~/${inputPath.slice(home.length + 1)}`;
  }

  return inputPath;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeBotUsername(raw?: string): string | undefined {
  if (!raw) {
    return undefined;
  }

  const cleaned = raw.trim();
  if (!cleaned) {
    return undefined;
  }

  return cleaned.startsWith("@") ? cleaned.slice(1) : cleaned;
}

export async function detectExistingInstall(workspacePath: string): Promise<ExistingInstall> {
  const configPath = path.join(os.homedir(), ".clawdbot", "clawdbot.json");
  const hasClawdbotConfig = await pathExists(configPath);

  let configuredWorkspace = workspacePath;
  let configuredBot: string | undefined;

  if (hasClawdbotConfig) {
    try {
      const rawConfig = await readFile(configPath, "utf8");
      const parsed = JSON.parse(rawConfig) as ClawdbotConfig;
      if (typeof parsed.workspace === "string" && parsed.workspace.trim()) {
        configuredWorkspace = parsed.workspace.trim();
      }

      configuredBot = normalizeBotUsername(
        parsed.channels?.telegram?.botUsername ?? parsed.channels?.telegram?.username ?? parsed.channels?.telegram?.bot
      );
    } catch {
      // Keep default values when config parsing fails.
    }
  }

  const workspaceCandidates = [
    configuredWorkspace,
    workspacePath,
    "~/clawd"
  ].filter((candidate, index, list) => list.indexOf(candidate) === index);

  let hasWorkspace = false;
  let detectedWorkspacePath: string | undefined;
  for (const candidate of workspaceCandidates) {
    if (await pathExists(expandHomePath(candidate))) {
      hasWorkspace = true;
      detectedWorkspacePath = compactHomePath(expandHomePath(candidate));
      break;
    }
  }

  return {
    hasClawdbotConfig,
    hasWorkspace,
    workspacePath: detectedWorkspacePath ?? compactHomePath(expandHomePath(configuredWorkspace)),
    configuredBot
  };
}
