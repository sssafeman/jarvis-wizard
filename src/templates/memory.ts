import type { WizardState } from "../state/wizard-state.js";

export function renderMemoryTemplate(state: WizardState): string {
  const today = new Date().toISOString().slice(0, 10);

  return `# MEMORY\n\n- Assistant: ${state.personality.assistantName} ${state.personality.emoji}\n- Created for: ${state.user.name}\n- Created on: ${today}\n- Workspace: ${state.workspacePath}\n`;
}
