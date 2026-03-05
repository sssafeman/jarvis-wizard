import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { NavHints } from "../../components/NavHints.js";
import { StepHeader } from "../../components/StepHeader.js";
import { TextInput } from "../../components/TextInput.js";
import { ValidationStatus, type Status } from "../../components/ValidationStatus.js";
import type { IntegrationScreenProps } from "./types.js";

type Stage = "nickname" | "done";

export function FaceitSetup({
  progressLabel,
  initialValues,
  onComplete,
  onSkip
}: IntegrationScreenProps): React.JSX.Element {
  const [stage, setStage] = useState<Stage>("nickname");
  const [nickname, setNickname] = useState(initialValues?.nickname ?? "");
  const [status, setStatus] = useState<Status>("idle");

  useInput((input, key) => {
    if (key.escape || input.toLowerCase() === "s") {
      onSkip();
      return;
    }

    if (stage === "done" && key.return) {
      onComplete({ nickname: nickname.trim() });
    }
  });

  return (
    <Box flexDirection="column">
      <StepHeader title={progressLabel} subtitle="FACEIT integration" />
      <Text>Add your FACEIT nickname so Jarvis can track CS2 stats and recent match performance.</Text>
      <Text color="gray">API key optional - your public stats will still be visible.</Text>

      {stage === "nickname" ? (
        <TextInput
          label="FACEIT nickname"
          value={nickname}
          placeholder="your-nickname"
          onChange={(value) => {
            setStatus("idle");
            setNickname(value);
          }}
          validate={(value) => (value.trim() ? null : "Nickname is required")}
          onSubmit={() => {
            if (!nickname.trim()) {
              setStatus("error");
              return;
            }

            setStatus("success");
            setStage("done");
          }}
        />
      ) : null}

      {stage === "done" ? <Text color="gray">Press Enter to save and continue.</Text> : null}

      <ValidationStatus
        status={status}
        successMessage="Nickname saved. Jarvis will use public FACEIT data."
        errorMessage="Please enter a valid nickname."
      />
      <NavHints canSkip={true} enterLabel={stage === "done" ? "Save integration" : "Continue"} />
    </Box>
  );
}
