import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { Spinner } from "../components/Spinner.js";
import { StepHeader } from "../components/StepHeader.js";
import { TextInput } from "../components/TextInput.js";
import {
  installClawdbotGlobal,
  installSelectedSkills,
  startGatewayDaemon,
  updateTelegramChatId,
  writeClawdbotConfig
} from "../installers/clawdbot.js";
import { setupVoicePipeline } from "../installers/voice.js";
import { ensureWorkspace, writeWorkspaceFiles } from "../installers/workspace.js";
import type { WizardStepProps } from "../types/step.js";

type TaskStatus = "pending" | "running" | "success" | "error" | "skipped";

type TaskId =
  | "install_clawdbot"
  | "create_workspace"
  | "generate_files"
  | "write_config"
  | "install_skills"
  | "voice"
  | "start_gateway";

interface InstallTask {
  id: TaskId;
  label: string;
  status: TaskStatus;
  detail?: string;
}

const BASE_TASKS: InstallTask[] = [
  { id: "install_clawdbot", label: "Installing Clawdbot globally", status: "pending" },
  { id: "create_workspace", label: "Creating workspace", status: "pending" },
  { id: "generate_files", label: "Generating workspace files", status: "pending" },
  { id: "write_config", label: "Writing Clawdbot config", status: "pending" },
  { id: "install_skills", label: "Installing selected skills", status: "pending" },
  { id: "voice", label: "Setting up voice pipeline", status: "pending" },
  { id: "start_gateway", label: "Starting Clawdbot gateway daemon", status: "pending" }
];

function statusIcon(status: TaskStatus): string {
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

function statusColor(status: TaskStatus): "green" | "red" | "yellow" | "white" {
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

export function Installation({ state, onNext }: WizardStepProps): React.JSX.Element {
  const [tasks, setTasks] = useState<InstallTask[]>(BASE_TASKS);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<"running" | "await-chat" | "error">("running");
  const [chatId, setChatId] = useState(state.telegramChatId);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatSaving, setChatSaving] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const { exit } = useApp();

  const botUsername = useMemo(() => state.integrations.telegram?.botUsername ?? "your-bot", [state.integrations]);

  const setTask = (id: TaskId, status: TaskStatus, detail?: string): void => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status, detail } : task)));
  };

  async function runTask(id: TaskId, action: () => Promise<string | void>): Promise<void> {
    setTask(id, "running");

    try {
      const detail = await action();
      setTask(id, "success", detail ?? undefined);
    } catch (error) {
      const message = (error as Error).message || "Unknown error";
      setTask(id, "error", message);
      throw error;
    }
  }

  useEffect(() => {
    if (started) {
      return;
    }

    setStarted(true);

    const run = async (): Promise<void> => {
      try {
        await runTask("install_clawdbot", async () => {
          await installClawdbotGlobal();
        });

        await runTask("create_workspace", async () => {
          const workspace = await ensureWorkspace(state.workspacePath);
          return workspace;
        });

        await runTask("generate_files", async () => {
          await writeWorkspaceFiles(state);
          return "SOUL.md, USER.md, IDENTITY.md, AGENTS.md, TOOLS.md, MEMORY.md, HEARTBEAT.md";
        });

        await runTask("write_config", async () => {
          const configPath = await writeClawdbotConfig(state);
          return configPath;
        });

        await runTask("install_skills", async () => {
          const summary = await installSelectedSkills(state.capabilities);
          if (summary.failed.length > 0) {
            return `Installed: ${summary.installed.length}, failed: ${summary.failed.join(", ")}`;
          }

          return summary.installed.length > 0
            ? `Installed: ${summary.installed.join(", ")}`
            : "No skill-based capabilities selected";
        });

        if (state.capabilities.includes("voice_messages")) {
          await runTask("voice", async () => {
            await setupVoicePipeline();
          });
        } else {
          setTask("voice", "skipped", "Voice capability not selected");
        }

        await runTask("start_gateway", async () => {
          await startGatewayDaemon();
        });

        setPhase("await-chat");
      } catch (error) {
        setRuntimeError((error as Error).message || "Installation failed");
        setPhase("error");
      }
    };

    void run();
  }, [started, state]);

  useInput((input, key) => {
    if (phase !== "error") {
      return;
    }

    if (key.escape || input.toLowerCase() === "q") {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <StepHeader title="Step 6/7 - Installation" subtitle="Applying your setup" />

      {tasks.map((task) => {
        if (task.status === "running") {
          return <Spinner key={task.id} label={task.label} color="cyan" />;
        }

        return (
          <Text key={task.id} color={statusColor(task.status)}>
            {statusIcon(task.status)} {task.label}
            {task.detail ? <Text color="gray"> ({task.detail})</Text> : null}
          </Text>
        );
      })}

      {phase === "await-chat" ? (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow">
            Send a message to your Telegram bot (@{botUsername}), then paste your Chat ID below.
          </Text>
          <TextInput
            label="Telegram Chat ID"
            value={chatId}
            placeholder="e.g. 123456789"
            active={!chatSaving}
            onChange={(value) => {
              setChatError(null);
              setChatId(value);
            }}
            validate={(value) => (value.trim().length > 0 ? null : "Chat ID is required")}
            onSubmit={() => {
              if (!chatId.trim()) {
                setChatError("Chat ID is required.");
                return;
              }

              if (chatSaving) {
                return;
              }

              setChatSaving(true);
              void updateTelegramChatId(chatId.trim())
                .then(() => {
                  onNext({ telegramChatId: chatId.trim() });
                })
                .catch((error) => {
                  setChatError((error as Error).message || "Failed to save Chat ID");
                  setChatSaving(false);
                });
            }}
          />
        </Box>
      ) : null}

      {chatError ? <Text color="red">✗ {chatError}</Text> : null}
      {phase === "error" && runtimeError ? <Text color="red">Installation failed: {runtimeError}</Text> : null}
      {phase === "error" ? <Text color="gray">Press q or Esc to exit.</Text> : null}
    </Box>
  );
}
