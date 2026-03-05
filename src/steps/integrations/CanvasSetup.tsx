import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { NavHints } from "../../components/NavHints.js";
import { PasswordInput } from "../../components/PasswordInput.js";
import { StepHeader } from "../../components/StepHeader.js";
import { TextInput } from "../../components/TextInput.js";
import { ValidationStatus, type Status } from "../../components/ValidationStatus.js";
import type { IntegrationScreenProps } from "./types.js";

type Stage = "baseUrl" | "token" | "done";

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

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

async function validateCanvasConnection(baseUrl: string, token: string): Promise<number> {
  const normalized = normalizeBaseUrl(baseUrl);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json"
  };

  const selfResponse = await fetchWithTimeout(`${normalized}/api/v1/users/self`, {
    method: "GET",
    headers
  });

  if (!selfResponse.ok) {
    throw new Error(`Canvas returned ${selfResponse.status} from /users/self`);
  }

  const coursesResponse = await fetchWithTimeout(`${normalized}/api/v1/courses?enrollment_state=active`, {
    method: "GET",
    headers
  });

  if (!coursesResponse.ok) {
    throw new Error(`Canvas returned ${coursesResponse.status} from /courses`);
  }

  const data = (await coursesResponse.json()) as unknown;
  return Array.isArray(data) ? data.length : 0;
}

export function CanvasSetup({
  progressLabel,
  initialValues,
  onComplete,
  onSkip
}: IntegrationScreenProps): React.JSX.Element {
  const [stage, setStage] = useState<Stage>("baseUrl");
  const [baseUrl, setBaseUrl] = useState(initialValues?.baseUrl ?? "");
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
      onComplete({
        baseUrl: normalizeBaseUrl(baseUrl),
        token: token.trim()
      });
    }
  });

  const submitToken = async (): Promise<void> => {
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    const trimmedToken = token.trim();

    if (!normalizedBaseUrl || !trimmedToken || validating) {
      return;
    }

    setStatus("validating");
    setErrorMessage("");
    setSuccessMessage("");
    setValidating(true);

    try {
      const courseCount = await validateCanvasConnection(normalizedBaseUrl, trimmedToken);
      setSuccessMessage(`Connected! Found ${courseCount} active courses.`);
      setStatus("success");
      setStage("done");
    } catch (error) {
      setErrorMessage((error as Error).message || "Failed to connect to Canvas.");
      setStatus("error");
    } finally {
      setValidating(false);
    }
  };

  return (
    <Box flexDirection="column">
      <StepHeader title={progressLabel} subtitle="Canvas LMS integration" />
      <Text>Connect Canvas so Jarvis can read your courses, assignments, and due dates.</Text>

      {stage === "baseUrl" ? (
        <TextInput
          label="Canvas base URL"
          value={baseUrl}
          placeholder="https://kristiania.instructure.com"
          active={!validating}
          onChange={(value) => {
            setStatus("idle");
            setBaseUrl(value);
          }}
          validate={(value) => {
            const trimmed = value.trim();
            if (!trimmed) {
              return "Canvas base URL is required";
            }

            if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
              return "Must start with http:// or https://";
            }

            return null;
          }}
          onSubmit={() => {
            if (!normalizeBaseUrl(baseUrl)) {
              return;
            }

            setStage("token");
          }}
        />
      ) : null}

      {stage === "token" ? (
        <PasswordInput
          label="Canvas API token"
          value={token}
          placeholder="Paste API token"
          active={!validating}
          onChange={(value) => {
            setStatus("idle");
            setToken(value);
          }}
          validate={(value) => (value.trim() ? null : "Canvas token is required")}
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
