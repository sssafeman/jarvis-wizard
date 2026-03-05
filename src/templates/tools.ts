import type { WizardState } from "../state/wizard-state.js";

function configuredLabel(value: string | undefined): string {
  return value && value.trim() ? "Configured" : "Not configured";
}

function renderIntegrationSections(state: WizardState): string {
  const sections: string[] = [];
  const canvas = state.integrations.canvas;
  const faceit = state.integrations.faceit;
  const github = state.integrations.github;
  const todoist = state.integrations.todoist;

  if (canvas?.baseUrl) {
    sections.push(
      [
        "### Canvas LMS",
        `- Base URL: ${canvas.baseUrl}`,
        "- API token: Configured (stored in local wizard state; keep secret when sharing files)"
      ].join("\n")
    );
  }

  if (faceit?.nickname) {
    sections.push(["### FACEIT", `- Nickname: ${faceit.nickname}`, "- Player ID: Resolved by nickname at runtime"].join("\n"));
  }

  if (github?.username) {
    sections.push(
      [
        "### GitHub",
        `- Username: ${github.username}`,
        `- Personal Access Token: ${configuredLabel(github.token)}`
      ].join("\n")
    );
  }

  if (todoist?.token) {
    sections.push(["### Todoist", `- API token: ${todoist.token}`].join("\n"));
  }

  if (state.capabilities.includes("voice_messages")) {
    sections.push(
      [
        "### Voice Pipeline",
        "- Enabled: Yes",
        "- Scripts: `~/bin/jarvis-speak` and `~/bin/jarvis-listen`"
      ].join("\n")
    );
  }

  return sections.length > 0 ? sections.join("\n\n") : "No optional integrations configured yet.";
}

export function renderToolsTemplate(state: WizardState): string {
  return `# TOOLS\n\n## Core Keys\n- Anthropic API key: ${state.keys.anthropic ? "Configured" : "Missing"}\n- Telegram bot token: ${state.keys.telegramBot ? "Configured" : "Missing"}\n- Brave Search key: ${state.keys.brave ? "Configured" : "Not configured"}\n\n## Model\n- ${state.model.default}\n\n## Capabilities\n${state.capabilities.length > 0 ? state.capabilities.map((capability) => `- ${capability}`).join("\\n") : "- None selected"}\n\n## Integrations\n${renderIntegrationSections(state)}\n`;
}
