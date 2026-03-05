import type { WizardState } from "../state/wizard-state.js";

function renderIntegrations(integrations: WizardState["integrations"]): string {
  const entries = Object.entries(integrations);
  if (entries.length === 0) {
    return "No extra integrations configured yet.";
  }

  return entries
    .map(([name, values]) => {
      const lines = Object.entries(values).map(([key, value]) => `- ${key}: ${value || "(empty)"}`);
      return `### ${name}\n${lines.join("\\n")}`;
    })
    .join("\n\n");
}

export function renderToolsTemplate(state: WizardState): string {
  return `# TOOLS\n\n## Core Keys\n- Anthropic API key: ${state.keys.anthropic ? "Configured" : "Missing"}\n- Telegram bot token: ${state.keys.telegramBot ? "Configured" : "Missing"}\n- Brave Search key: ${state.keys.brave ? "Configured" : "Not configured"}\n\n## Model\n- ${state.model.default}\n\n## Capabilities\n${state.capabilities.length > 0 ? state.capabilities.map((capability) => `- ${capability}`).join("\\n") : "- None selected"}\n\n## Integrations\n${renderIntegrations(state.integrations)}\n`;
}
