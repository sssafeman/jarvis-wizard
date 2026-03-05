import React from "react";
import { Box, Text, useInput } from "ink";
import { NavHints } from "../components/NavHints.js";
import { StepHeader } from "../components/StepHeader.js";
import type { WizardStepProps } from "../types/step.js";

const BANNER = [
  "  ╔══════════════════════════════╗",
  "  ║     JARVIS SETUP WIZARD      ║",
  "  ║         Phase 1 MVP          ║",
  "  ╚══════════════════════════════╝",
].join("\n");

export function Welcome({ onNext }: WizardStepProps): React.JSX.Element {
  useInput((input, key) => {
    if (key.return) {
      onNext();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan">{BANNER}</Text>

      <Box flexDirection="column" marginTop={1}>
        <StepHeader
          title="Welcome"
          subtitle="Set up your personal AI assistant in ~10 minutes."
        />
        <Text color="yellow">Before you start, you will need:</Text>
        <Text> • Anthropic API key (console.anthropic.com)</Text>
        <Text> • Telegram bot token (@BotFather)</Text>
        <Text color="gray"> • Brave Search API key (optional)</Text>
      </Box>

      <NavHints enterLabel="Let's go" />
    </Box>
  );
}
