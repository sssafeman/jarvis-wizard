import { copyFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import React, { useState } from "react";
import { Box, Text, useApp } from "ink";
import { SelectList } from "../components/SelectList.js";
import type { ExistingInstall } from "../utils/detect.js";

interface ExistingInstallProps {
  install: ExistingInstall;
  onOverwrite: () => void;
  onRepair: () => void;
}

const OPTIONS = [
  {
    label: "Overwrite - start fresh (backs up existing config)",
    value: "overwrite"
  },
  {
    label: "Repair - re-run installation only (keep your workspace files)",
    value: "repair"
  },
  {
    label: "Cancel - exit wizard",
    value: "cancel"
  }
] as const;

type ExistingChoice = (typeof OPTIONS)[number]["value"];

async function backupExistingConfig(): Promise<void> {
  const configPath = path.join(os.homedir(), ".clawdbot", "clawdbot.json");
  const backupPath = path.join(os.homedir(), ".clawdbot", "clawdbot.json.bak");
  await copyFile(configPath, backupPath);
}

export function ExistingInstall({ install, onOverwrite, onRepair }: ExistingInstallProps): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { exit } = useApp();

  const bot = install.configuredBot ? `@${install.configuredBot}` : "unknown";
  const workspace = install.workspacePath ?? "~/clawd";

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="yellow">⚠ Existing Jarvis installation detected.</Text>
      <Text>Bot: {bot}</Text>
      <Text>Workspace: {workspace}</Text>

      <Box marginTop={1}>
        <Text>What would you like to do?</Text>
      </Box>

      <SelectList
        options={OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
        selectedIndex={selectedIndex}
        active={!busy}
        onChange={(index) => {
          setError(null);
          setSelectedIndex(index);
        }}
        onSubmit={(option) => {
          if (busy) {
            return;
          }

          const choice = option.value as ExistingChoice;
          if (choice === "cancel") {
            exit();
            return;
          }

          if (choice === "repair") {
            onRepair();
            return;
          }

          if (!install.hasClawdbotConfig) {
            onOverwrite();
            return;
          }

          setBusy(true);
          void backupExistingConfig()
            .then(() => {
              onOverwrite();
            })
            .catch((backupError) => {
              setError((backupError as Error).message || "Failed to back up existing config");
              setBusy(false);
            });
        }}
      />

      {busy ? <Text color="yellow">Backing up ~/.clawdbot/clawdbot.json ...</Text> : null}
      {error ? <Text color="red">✗ {error}</Text> : null}
    </Box>
  );
}
