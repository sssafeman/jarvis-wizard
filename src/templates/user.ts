import type { WizardState } from "../state/wizard-state.js";

export function renderUserTemplate(state: WizardState): string {
  return `# USER\n\n- Name: ${state.user.name}\n- Preferred call name: ${state.user.callName || state.user.name}\n- Timezone: ${state.user.timezone}\n- Occupation: ${state.user.occupation}\n- Tech level: ${state.user.techLevel}\n\n## Preferences\n- Preferred assistant style: ${state.personality.style}\n- Address mode: ${state.personality.addressAs}\n`;
}
