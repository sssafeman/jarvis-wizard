import React from "react";
import { Box, Text, useApp, useInput } from "ink";
import { StepHeader } from "../components/StepHeader.js";
import type { WizardStepProps } from "../types/step.js";

export function Complete({ state }: WizardStepProps): React.JSX.Element {
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.return || key.escape || input.toLowerCase() === "q") {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <StepHeader title="Step 7/8 - Complete" subtitle="Jarvis is ready" />

      <Text color="green">✓ Setup complete.</Text>
      <Text>Bot name: {state.personality.assistantName}</Text>
      <Text>Workspace: {state.workspacePath}</Text>

      <Box flexDirection="column" marginTop={1}>
        <Text color="cyan">Quick commands:</Text>
        <Text>• clawdbot gateway status</Text>
        <Text>• clawdbot gateway wake --text "Hello Jarvis" --mode now</Text>
        <Text>• jarvis-speak "Testing voice output"</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text color="yellow">Share with friends:</Text>
        <Text>curl -fsSL https://raw.githubusercontent.com/sssafeman/jarvis-wizard/main/install.sh | bash</Text>
      </Box>

      <Text color="gray">Press Enter (or q) to exit.</Text>
    </Box>
  );
}
