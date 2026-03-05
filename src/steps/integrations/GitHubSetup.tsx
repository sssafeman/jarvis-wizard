import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { NavHints } from "../../components/NavHints.js";
import { PasswordInput } from "../../components/PasswordInput.js";
import { StepHeader } from "../../components/StepHeader.js";
import { TextInput } from "../../components/TextInput.js";
import { ValidationStatus, type Status } from "../../components/ValidationStatus.js";
import type { IntegrationScreenProps } from "./types.js";

interface GitHubProfile {
  avatar_url: string;
  name: string | null;
  public_repos: number;
  login: string;
}

type Stage = "username" | "token" | "done";

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

async function validateGithubUser(username: string): Promise<GitHubProfile> {
  const response = await fetchWithTimeout(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "jarvis-wizard"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }

  return (await response.json()) as GitHubProfile;
}

export function GitHubSetup({
  progressLabel,
  initialValues,
  onComplete,
  onSkip
}: IntegrationScreenProps): React.JSX.Element {
  const [stage, setStage] = useState<Stage>("username");
  const [username, setUsername] = useState(initialValues?.username ?? "");
  const [token, setToken] = useState(initialValues?.token ?? "");
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
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
        username: username.trim(),
        ...(token.trim() ? { token: token.trim() } : {})
      });
    }
  });

  const submitUsername = async (): Promise<void> => {
    if (!username.trim() || validating) {
      return;
    }

    setValidating(true);
    setStatus("validating");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const user = await validateGithubUser(username.trim());
      setProfile(user);
      setStatus("success");
      setSuccessMessage(`Found GitHub user ${user.login}.`);
      setStage("token");
    } catch (error) {
      setStatus("error");
      setErrorMessage((error as Error).message || "Failed to validate GitHub username.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <Box flexDirection="column">
      <StepHeader title={progressLabel} subtitle="GitHub integration" />
      <Text>Connect GitHub so Jarvis can track repos and optionally private notifications.</Text>

      {stage === "username" ? (
        <TextInput
          label="GitHub username"
          value={username}
          placeholder="octocat"
          active={!validating}
          onChange={(value) => {
            setStatus("idle");
            setUsername(value);
          }}
          validate={(value) => (value.trim() ? null : "GitHub username is required")}
          onSubmit={() => {
            void submitUsername();
          }}
        />
      ) : null}

      {profile ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="cyan">GitHub profile</Text>
          <Text>Avatar: {profile.avatar_url}</Text>
          <Text>Name: {profile.name || "(not set)"}</Text>
          <Text>Public repos: {profile.public_repos}</Text>
        </Box>
      ) : null}

      {stage === "token" ? (
        <PasswordInput
          label="Personal Access Token (optional)"
          value={token}
          placeholder="Press Enter to skip"
          active={!validating}
          onChange={setToken}
          onSubmit={() => {
            setStatus("success");
            setSuccessMessage(token.trim() ? "PAT saved." : "PAT skipped.");
            setStage("done");
          }}
        />
      ) : null}

      {stage === "done" ? <Text color="gray">Press Enter to save and continue.</Text> : null}

      <ValidationStatus status={status} successMessage={successMessage} errorMessage={errorMessage} />
      <NavHints canSkip={true} enterLabel={stage === "done" ? "Save integration" : "Continue"} />
    </Box>
  );
}
