import type { WizardState } from "../state/wizard-state.js";

function renderIntegrationSections(state: WizardState): string {
  const sections: string[] = [];
  const { canvas, faceit, github, todoist } = state.integrations;
  const caps = state.capabilities;

  // --- Configured integrations ---
  if (canvas?.baseUrl) {
    sections.push([
      "## Canvas LMS",
      `- Base URL: ${canvas.baseUrl}`,
      "- API Token: Configured",
    ].join("\n"));
  }

  if (github?.username) {
    sections.push([
      "## GitHub",
      `- Username: ${github.username}`,
      `- Personal Access Token: ${github.token ? "Configured" : "Not configured"}`,
    ].join("\n"));
  }

  if (faceit?.nickname) {
    sections.push([
      "## FACEIT",
      `- Nickname: ${faceit.nickname}`,
      "- API Key: optional — add below if you want private stats",
      "- API Base: https://open.faceit.com/data/v4",
    ].join("\n"));
  }

  if (todoist?.token) {
    sections.push([
      "## Todoist",
      "- API Token: Configured",
    ].join("\n"));
  }

  if (caps.includes("voice_messages")) {
    sections.push([
      "## Voice Pipeline",
      "- Scripts: `~/bin/jarvis-speak` and `~/bin/jarvis-listen`",
      "- TTS: edge-tts (en-GB-RyanNeural default)",
      "- Change voice: set JARVIS_VOICE env var or pass --voice flag",
    ].join("\n"));
  }

  // --- Setup-later stubs for selected-but-unconfigured integrations ---
  const stubs: string[] = [];

  if (caps.includes("email_monitoring")) {
    stubs.push([
      "## Outlook Email (setup required)",
      "# 1. Register an Azure app at portal.azure.com",
      "# 2. Run: pip install msal",
      "# 3. Copy ~/bin/ms-token to this machine and run it once to authenticate",
      "# 4. Add: CLIENT_ID = <your-app-id>",
    ].join("\n"));
  }

  if (caps.includes("obsidian_notes")) {
    stubs.push([
      "## Obsidian",
      "# Set your vault path below:",
      "# - Vault: ~/Documents/vault-personal",
      "# Install obsidian-cli: yay -S obsidian-cli-bin",
    ].join("\n"));
  }

  if (caps.includes("japanese_language")) {
    stubs.push([
      "## Wanikani (optional)",
      "# API Token: (get from wanikani.com/settings/personal_access_tokens)",
      "# Username: ",
    ].join("\n"));
  }

  if (stubs.length > 0) {
    sections.push("## Setup Later\n" + stubs.join("\n\n"));
  }

  return sections.length > 0 ? sections.join("\n\n") : "No integrations configured.";
}

export function renderToolsTemplate(state: WizardState): string {
  const caps = state.capabilities.length > 0
    ? state.capabilities.map((c) => `- ${c}`).join("\n")
    : "- None selected";

  return [
    "# TOOLS.md - Local Notes",
    "",
    "## Core",
    `- Anthropic API key: ${state.keys.anthropic ? "Configured" : "MISSING"}`,
    `- Telegram bot token: ${state.keys.telegramBot ? "Configured" : "MISSING"}`,
    `- Brave Search key: ${state.keys.brave ? "Configured" : "Not configured"}`,
    `- Model: ${state.model.default}`,
    "",
    "## Capabilities",
    caps,
    "",
    renderIntegrationSections(state),
    "",
    "---",
    "Add whatever helps you do your job. This is your cheat sheet.",
  ].join("\n");
}
