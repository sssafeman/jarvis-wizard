import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { WizardState } from "../state/wizard-state.js";
import { renderAgentsTemplate } from "../templates/agents.js";
import { renderHeartbeatTemplate } from "../templates/heartbeat.js";
import { renderIdentityTemplate } from "../templates/identity.js";
import { renderMemoryTemplate } from "../templates/memory.js";
import { renderSoulTemplate } from "../templates/soul.js";
import { renderToolsTemplate } from "../templates/tools.js";
import { renderUserTemplate } from "../templates/user.js";

export function expandHomePath(inputPath: string): string {
  if (inputPath === "~") {
    return os.homedir();
  }

  if (inputPath.startsWith("~/")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }

  return inputPath;
}

export async function ensureWorkspace(pathInput: string): Promise<string> {
  const workspacePath = expandHomePath(pathInput);
  await mkdir(workspacePath, { recursive: true });
  return workspacePath;
}

export async function writeWorkspaceFiles(state: WizardState): Promise<void> {
  const workspace = await ensureWorkspace(state.workspacePath);

  const files: Record<string, string> = {
    "SOUL.md": renderSoulTemplate(state),
    "USER.md": renderUserTemplate(state),
    "IDENTITY.md": renderIdentityTemplate(state),
    "AGENTS.md": renderAgentsTemplate(),
    "TOOLS.md": renderToolsTemplate(state),
    "MEMORY.md": renderMemoryTemplate(state),
    "HEARTBEAT.md": renderHeartbeatTemplate()
  };

  await Promise.all(
    Object.entries(files).map(([name, content]) => writeFile(path.join(workspace, name), content, "utf8"))
  );
}
