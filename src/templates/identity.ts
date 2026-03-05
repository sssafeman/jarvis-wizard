import type { WizardState } from "../state/wizard-state.js";

export function renderIdentityTemplate(state: WizardState): string {
  return `# IDENTITY\n\n- Name: ${state.personality.assistantName}\n- Emoji: ${state.personality.emoji}\n- Default model: ${state.model.default}\n`;
}
