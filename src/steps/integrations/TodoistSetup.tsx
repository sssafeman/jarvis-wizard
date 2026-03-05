import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { NavHints } from "../../components/NavHints.js";
import { PasswordInput } from "../../components/PasswordInput.js";
import { StepHeader } from "../../components/StepHeader.js";
import { ValidationStatus, type Status } from "../../components/ValidationStatus.js";
import type { IntegrationScreenProps } from "./types.js";

type Stage = "token" | "done";

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function validateTodoistToken(token: string): Promise<number> {
  const response = await fetchWithTimeout("https://api.todoist.com/rest/v2/projects", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Todoist returned ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? data.length : 0;
}

export function TodoistSetup({
  progressLabel,
  initialValues,
  onComplete,
  onSkip
}: IntegrationScreenProps): React.JSX.Element {
  const [stage, setStage] = useState<Stage>("token");
  const [token, setToken] = useState(initialValues?.token ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [validating, setValidating] = useState(false);

  useInput((input, key) => {
    if (validating) {
      return;
    }

    if (key.escape || input.toLowerCase() === "s") {
      onSkip();
      return;
    }

    if (stage === "done" && key.return) {
      onComplete({ token: token.trim() });
    }
  });

  const submitToken = async (): Promise<void> => {
    const trimmed = token.trim();
    if (!trimmed || validating) {
      return;
    }

    setStatus("validating");
    setErrorMessage("");
    setSuccessMessage("");
    setValidating(true);

    try {
      const projectCount = await validateTodoistToken(trimmed);
      setStatus("success");
      setSuccessMessage(`Connected! Found ${projectCount} projects.`);
      setStage("done");
    } catch (error) {
      setStatus("error");
      setErrorMessage((error as Error).message || "Failed to connect to Todoist.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <Box flexDirection="column">
      <StepHeader title={progressLabel} subtitle="Todoist integration" />
      <Text>Connect Todoist so Jarvis can manage tasks, projects, and reminders.</Text>

      {stage === "token" ? (
        <PasswordInput
          label="Todoist API token"
          value={token}
          placeholder="Paste Todoist token"
          active={!validating}
          onChange={(value) => {
            setStatus("idle");
            setToken(value);
          }}
          validate={(value) => (value.trim() ? null : "Todoist token is required")}
          onSubmit={() => {
            void submitToken();
          }}
        />
      ) : null}

      {stage === "done" ? <Text color="gray">Press Enter to save and continue.</Text> : null}

      <ValidationStatus status={status} successMessage={successMessage} errorMessage={errorMessage} />
      <NavHints canSkip={true} enterLabel={stage === "done" ? "Save integration" : "Continue"} />
    </Box>
  );
}
