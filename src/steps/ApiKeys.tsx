import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { NavHints } from "../components/NavHints.js";
import { PasswordInput } from "../components/PasswordInput.js";
import { SelectList } from "../components/SelectList.js";
import { StepHeader } from "../components/StepHeader.js";
import { TextInput } from "../components/TextInput.js";
import type { WizardStepProps } from "../types/step.js";

const MODELS = [
  { label: "Claude Sonnet 4.5", value: "anthropic/claude-sonnet-4-5" },
  { label: "Claude Opus 4", value: "anthropic/claude-opus-4" },
  { label: "Claude Haiku", value: "anthropic/claude-haiku-3-5" }
];

async function validateAnthropicKey(key: string): Promise<{ ok: boolean; reason?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      signal: controller.signal
    });

    if (response.status === 200) {
      return { ok: true };
    }

    return { ok: false, reason: `Anthropic returned ${response.status}` };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  } finally {
    clearTimeout(timeout);
  }
}

async function validateTelegramToken(token: string): Promise<{ ok: boolean; reason?: string; username?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      method: "GET",
      signal: controller.signal
    });

    if (!response.ok) {
      return { ok: false, reason: `Telegram returned ${response.status}` };
    }

    const data = (await response.json()) as {
      ok?: boolean;
      result?: { username?: string };
      description?: string;
    };

    if (!data.ok) {
      return { ok: false, reason: data.description ?? "Invalid Telegram token" };
    }

    return { ok: true, username: data.result?.username ?? "unknown" };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  } finally {
    clearTimeout(timeout);
  }
}

export function ApiKeys({ state, onNext, onBack }: WizardStepProps): React.JSX.Element {
  const [stage, setStage] = useState(0);

  useInput((_, key) => {
    if (key.escape && !validating) {
      if (stage > 0) setStage((s) => s - 1);
      else onBack();
    }
  });
  const [anthropic, setAnthropic] = useState(state.keys.anthropic);
  const [telegram, setTelegram] = useState(state.keys.telegramBot);
  const [brave, setBrave] = useState(state.keys.brave);
  const [modelIndex, setModelIndex] = useState(
    Math.max(
      0,
      MODELS.findIndex((option) => option.value === state.model.default)
    )
  );
  const [status, setStatus] = useState<{ tone: "green" | "red" | "yellow"; text: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState(state.integrations.telegram?.botUsername ?? "");

  const submitAnthropic = async (): Promise<void> => {
    if (!anthropic.trim() || validating) {
      return;
    }

    setValidating(true);
    setStatus({ tone: "yellow", text: "Validating Anthropic key..." });

    const validation = await validateAnthropicKey(anthropic.trim());
    if (!validation.ok) {
      setStatus({ tone: "red", text: `✗ Invalid: ${validation.reason ?? "Unknown error"}` });
      setValidating(false);
      return;
    }

    setStatus({ tone: "green", text: "✓ Valid! Anthropic key accepted." });
    setValidating(false);
    setStage(1);
  };

  const submitTelegram = async (): Promise<void> => {
    if (!telegram.trim() || validating) {
      return;
    }

    setValidating(true);
    setStatus({ tone: "yellow", text: "Validating Telegram bot token..." });

    const validation = await validateTelegramToken(telegram.trim());
    if (!validation.ok) {
      setStatus({ tone: "red", text: `✗ Invalid: ${validation.reason ?? "Unknown error"}` });
      setValidating(false);
      return;
    }

    setTelegramUsername(validation.username ?? "unknown");
    setStatus({ tone: "green", text: `✓ Valid! Telegram bot @${validation.username}` });
    setValidating(false);
    setStage(2);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <StepHeader title="Step 3/8 - API Keys" subtitle="Connect required providers" />

      {stage === 0 ? (
        <PasswordInput
          label="Anthropic API key"
          value={anthropic}
          placeholder="sk-ant-..."
          onChange={(value) => {
            setStatus(null);
            setAnthropic(value);
          }}
          validate={(value) => (value.trim().length > 0 ? null : "Anthropic API key is required")}
          onSubmit={() => {
            void submitAnthropic();
          }}
        />
      ) : null}

      {stage === 1 ? (
        <PasswordInput
          label="Telegram bot token"
          value={telegram}
          placeholder="123456:ABC..."
          onChange={(value) => {
            setStatus(null);
            setTelegram(value);
          }}
          validate={(value) => (value.trim().length > 0 ? null : "Telegram token is required")}
          onSubmit={() => {
            void submitTelegram();
          }}
        />
      ) : null}

      {stage === 2 ? (
        <TextInput
          label="Brave Search API key (optional)"
          value={brave}
          placeholder="Press Enter to skip"
          onChange={(value) => {
            setStatus(null);
            setBrave(value);
          }}
          onSubmit={() => {
            if (!brave.trim()) {
              setStatus({ tone: "yellow", text: "Brave key skipped." });
            } else {
              setStatus({ tone: "green", text: "Brave key saved." });
            }
            setStage(3);
          }}
        />
      ) : null}

      {stage === 3 ? (
        <SelectList
          label="Default model"
          options={MODELS}
          selectedIndex={modelIndex}
          onChange={setModelIndex}
          onSubmit={(option) => {
            onNext({
              keys: {
                anthropic: anthropic.trim(),
                telegramBot: telegram.trim(),
                brave: brave.trim()
              },
              model: {
                default: option.value
              },
              integrations: {
                ...state.integrations,
                telegram: {
                  ...(state.integrations.telegram ?? {}),
                  botUsername: telegramUsername || "unknown"
                }
              }
            });
          }}
        />
      ) : null}

      {status ? <Text color={status.tone}>{status.text}</Text> : null}
      <Text color="gray">Sub-step: {stage + 1}/4</Text>
      <NavHints canGoBack={true} />
    </Box>
  );
}
