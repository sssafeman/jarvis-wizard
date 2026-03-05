import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "../components/Spinner.js";
import { StepHeader } from "../components/StepHeader.js";
import { runCommandSafe } from "../installers/shell.js";
import type { WizardStepProps } from "../types/step.js";

type CheckStatus = "pending" | "running" | "success" | "error" | "skipped";

interface CheckState {
  status: CheckStatus;
  detail?: string;
}

function statusIcon(status: CheckStatus): string {
  if (status === "success") {
    return "✓";
  }

  if (status === "error") {
    return "✗";
  }

  if (status === "skipped") {
    return "-";
  }

  return "•";
}

function statusColor(status: CheckStatus): "green" | "red" | "yellow" | "white" {
  if (status === "success") {
    return "green";
  }

  if (status === "error") {
    return "red";
  }

  if (status === "skipped") {
    return "yellow";
  }

  return "white";
}

async function sendTelegramTestMessage(token: string, chatId: string): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: "🤖 Jarvis is online! Setup complete."
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram returned ${response.status}`);
  }

  const payload = (await response.json()) as { ok?: boolean; description?: string };
  if (!payload.ok) {
    throw new Error(payload.description ?? "Telegram sendMessage failed");
  }
}

export function SmokeTest({ state, onNext }: WizardStepProps): React.JSX.Element {
  const [gateway, setGateway] = useState<CheckState>({ status: "pending" });
  const [telegram, setTelegram] = useState<CheckState>({ status: "pending" });
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (running) {
      return;
    }

    setRunning(true);

    const run = async (): Promise<void> => {
      setGateway({ status: "running" });
      const gatewayStatus = await runCommandSafe("clawdbot gateway status");
      if (gatewayStatus.ok) {
        setGateway({ status: "success", detail: "Gateway is running" });
      } else {
        setGateway({
          status: "error",
          detail: gatewayStatus.stderr || "Gateway is not running"
        });
      }

      if (!state.telegramChatId.trim()) {
        setTelegram({
          status: "skipped",
          detail: "Send a message to your bot to verify it's working"
        });
        setDone(true);
        return;
      }

      if (!state.keys.telegramBot.trim()) {
        setTelegram({
          status: "error",
          detail: "Telegram bot token is missing"
        });
        setDone(true);
        return;
      }

      setTelegram({ status: "running" });
      try {
        await sendTelegramTestMessage(state.keys.telegramBot.trim(), state.telegramChatId.trim());
        setTelegram({ status: "success", detail: "Test message sent to Telegram" });
      } catch (error) {
        setTelegram({
          status: "error",
          detail: (error as Error).message || "Failed to send Telegram test message"
        });
      } finally {
        setDone(true);
      }
    };

    void run();
  }, [running, state.keys.telegramBot, state.telegramChatId]);

  useInput((_, key) => {
    if (!done) {
      return;
    }

    if (key.return) {
      onNext();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <StepHeader title="Step 7/8 - Smoke Test" subtitle="Verifying gateway and Telegram delivery" />

      {gateway.status === "running" ? (
        <Spinner label="Checking clawdbot gateway status" color="cyan" />
      ) : (
        <Text color={statusColor(gateway.status)}>
          {statusIcon(gateway.status)} {gateway.detail ?? "Gateway status check"}
        </Text>
      )}

      {telegram.status === "running" ? (
        <Spinner label="Sending Telegram test message" color="cyan" />
      ) : (
        <Text color={statusColor(telegram.status)}>
          {statusIcon(telegram.status)} {telegram.detail ?? "Telegram test pending"}
        </Text>
      )}

      {done ? <Text color="gray">Press Enter to continue.</Text> : null}
    </Box>
  );
}
