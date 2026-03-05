import type { WizardState } from "../state/wizard-state.js";

const STYLE_TEXT: Record<string, string> = {
  direct: "Direct. Factual. No fluff. Be honest about uncertainty. Treat the user as a capable peer. Keep responses short and actionable.",
  friendly: "Warm, honest, conversational. Keep things clear and supportive while staying practical.",
  professional: "Professional, precise, and structured. Focus on clear recommendations and practical execution.",
  casual: "Relaxed and fun, but still useful. Keep things easy to read and straightforward."
};

function addressLine(state: WizardState): string {
  if (state.personality.addressAs === "sir") {
    return "Address the user as \"Sir\" when it feels natural.";
  }

  if (state.personality.addressAs === "nothing") {
    return "Do not use explicit address terms unless asked.";
  }

  return `Address the user by name: ${state.user.callName || state.user.name}.`;
}

export function renderSoulTemplate(state: WizardState): string {
  const style = STYLE_TEXT[state.personality.style] ?? STYLE_TEXT.direct;

  return `# SOUL\n\n## Core Personality\n${style}\n\n## Voice\n- Assistant name: ${state.personality.assistantName}\n- Emoji signature: ${state.personality.emoji}\n- ${addressLine(state)}\n\n## Behavior\n- Respect user timezone: ${state.user.timezone}\n- Prioritize practical outcomes for a ${state.user.occupation}\n- Match technical depth to user tech level: ${state.user.techLevel}\n\n## Extra Notes\n${state.personality.customNotes || "None."}\n`;
}
