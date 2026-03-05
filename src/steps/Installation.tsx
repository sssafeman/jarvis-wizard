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

const TASK_ORDER: TaskId[] = [
  "install_clawdbot",
  "create_workspace",
  "generate_files",
  "write_config",
  "install_skills",
  "voice",
  "start_gateway"
];

const BASE_TASKS: InstallTask[] = [
  { id: "install_clawdbot", label: "Installing Clawdbot globally", status: "pending" },
  { id: "create_workspace", label: "Creating workspace", status: "pending" },
  { id: "generate_files", label: "Generating workspace files", status: "pending" },
  { id: "write_config", label: "Writing Clawdbot config", status: "pending" },
  { id: "install_skills", label: "Installing selected skills", status: "pending" },
  { id: "voice", label: "Setting up voice pipeline", status: "pending" },
  { id: "start_gateway", label: "Starting Clawdbot gateway daemon", status: "pending" }
];

const TASK_FIX_SUGGESTIONS: Record<TaskId, string> = {
  install_clawdbot: "Try: npm install -g clawdbot manually, then re-run the wizard",
  create_workspace: "Check write access to your workspace path and try again",
  generate_files: "Check write access inside your workspace and try again",
  write_config: "Check permissions on ~/.clawdbot/",
  install_skills: "Skills can be installed later with: clawdhub install <name>",
  voice: "Try installing voice dependencies manually, then retry",
  start_gateway: "Try: clawdbot gateway start --daemon manually"
};

class TaskExecutionError extends Error {
  readonly taskId: TaskId;

  constructor(taskId: TaskId, message: string) {
    super(message);
    this.taskId = taskId;
  }
}

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
  const [failedTaskId, setFailedTaskId] = useState<TaskId | null>(null);
  const [retrying, setRetrying] = useState(false);

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
      throw new TaskExecutionError(id, message);
    }
  }

  async function runTaskById(id: TaskId): Promise<void> {
    if (state.installMode === "repair" && (id === "create_workspace" || id === "generate_files" || id === "write_config")) {
      if (id === "create_workspace") {
        setTask(id, "skipped", "Repair mode keeps existing workspace");
      } else if (id === "generate_files") {
        setTask(id, "skipped", "Repair mode keeps existing workspace files");
      } else {
        setTask(id, "skipped", "Repair mode keeps existing clawdbot config");
      }
      return;
    }

    if (id === "voice" && !state.capabilities.includes("voice_messages")) {
      setTask("voice", "skipped", "Voice capability not selected");
      return;
    }

    if (id === "install_clawdbot") {
      await runTask(id, async () => {
        await installClawdbotGlobal();
      });
      return;
    }

    if (id === "create_workspace") {
      await runTask(id, async () => {
        const workspace = await ensureWorkspace(state.workspacePath);
        return workspace;
      });
      return;
    }

    if (id === "generate_files") {
      await runTask(id, async () => {
        await writeWorkspaceFiles(state);
        return "SOUL.md, USER.md, IDENTITY.md, AGENTS.md, TOOLS.md, MEMORY.md, HEARTBEAT.md";
      });
      return;
    }

    if (id === "write_config") {
      await runTask(id, async () => {
        const configPath = await writeClawdbotConfig(state);
        return configPath;
      });
      return;
    }

    if (id === "install_skills") {
      await runTask(id, async () => {
        const summary = await installSelectedSkills(state.capabilities, state.workspacePath);
        if (summary.failed.length > 0) {
          throw new Error(`Installed: ${summary.installed.length}, failed: ${summary.failed.join(", ")}`);
        }

        return summary.installed.length > 0
          ? `Installed: ${summary.installed.join(", ")}`
          : "No skill-based capabilities selected";
      });
      return;
    }

    if (id === "voice") {
      await runTask(id, async () => {
        await setupVoicePipeline();
      });
      return;
    }

    await runTask(id, async () => {
      await startGatewayDaemon();
    });
  }

  function finishInstallation(): void {
    if (state.installMode === "repair" || state.telegramChatId.trim()) {
      onNext({ installMode: "fresh" });
      return;
    }

    setPhase("await-chat");
  }

  async function runFrom(startTaskId: TaskId): Promise<void> {
    const startIndex = TASK_ORDER.indexOf(startTaskId);
    const fromIndex = startIndex < 0 ? 0 : startIndex;

    for (let index = fromIndex; index < TASK_ORDER.length; index += 1) {
      await runTaskById(TASK_ORDER[index]);
    }

    finishInstallation();
  }

  function setFailure(taskId: TaskId, message: string): void {
    setRuntimeError(message);
    setFailedTaskId(taskId);
    setPhase("error");
  }

  useEffect(() => {
    if (started) {
      return;
    }

    setStarted(true);

    const run = async (): Promise<void> => {
      try {
        await runFrom(TASK_ORDER[0]);
      } catch (error) {
        if (error instanceof TaskExecutionError) {
          setFailure(error.taskId, error.message);
          return;
        }

        setRuntimeError((error as Error).message || "Installation failed");
        setPhase("error");
      }
    };

    void run();
  }, [started]);

  const retryFailedTask = async (): Promise<void> => {
    if (!failedTaskId || retrying) {
      return;
    }

    setRetrying(true);
    setRuntimeError(null);
    setChatError(null);
    setPhase("running");
    setTask(failedTaskId, "pending");

    try {
      await runFrom(failedTaskId);
      setFailedTaskId(null);
    } catch (error) {
      if (error instanceof TaskExecutionError) {
        setFailure(error.taskId, error.message);
      } else {
        setRuntimeError((error as Error).message || "Installation failed");
        setPhase("error");
      }
    } finally {
      setRetrying(false);
    }
  };

  useInput((input, key) => {
    if (phase !== "error") {
      return;
    }

    if (input.toLowerCase() === "r") {
      void retryFailedTask();
      return;
    }

    if (key.escape || input.toLowerCase() === "q") {
      exit();
    }
  });

  const fixSuggestion = failedTaskId ? TASK_FIX_SUGGESTIONS[failedTaskId] : null;

  return (
    <Box flexDirection="column" padding={1}>
      <StepHeader title="Step 6/8 - Installation" subtitle="Applying your setup" />

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
                  onNext({
                    telegramChatId: chatId.trim(),
                    installMode: "fresh"
                  });
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
      {phase === "error" && fixSuggestion ? <Text color="yellow">{fixSuggestion}</Text> : null}
      {phase === "error" ? <Text color="gray">Press r to retry failed task, or q / Esc to exit.</Text> : null}
    </Box>
  );
}
