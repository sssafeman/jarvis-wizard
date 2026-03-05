import { readFile, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { WizardState } from "../state/wizard-state.js";

const STATE_FILE = path.join(os.homedir(), ".jarvis-wizard-state.json");
const MAX_STATE_AGE_MS = 24 * 60 * 60 * 1000;

interface PersistedWizardState {
  state: WizardState;
  stepIndex: number;
  startedAt: number;
  updatedAt: number;
}

function isValidPersistedState(value: unknown): value is PersistedWizardState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const cast = value as Partial<PersistedWizardState>;
  return (
    typeof cast.stepIndex === "number"
    && cast.stepIndex >= 0
    && typeof cast.startedAt === "number"
    && typeof cast.updatedAt === "number"
    && Boolean(cast.state)
  );
}

async function loadRawState(): Promise<PersistedWizardState | null> {
  try {
    const fileStat = await stat(STATE_FILE);
    const ageMs = Date.now() - fileStat.mtimeMs;
    if (ageMs > MAX_STATE_AGE_MS) {
      return null;
    }

    const raw = await readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidPersistedState(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveWizardState(state: WizardState, stepIndex: number): Promise<void> {
  const existing = await loadRawState();
  const now = Date.now();
  const payload: PersistedWizardState = {
    state,
    stepIndex,
    startedAt: existing?.startedAt ?? now,
    updatedAt: now
  };

  await writeFile(STATE_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function loadWizardState(): Promise<{ state: WizardState; stepIndex: number } | null> {
  const saved = await loadRawState();
  if (!saved) {
    return null;
  }

  return {
    state: saved.state,
    stepIndex: saved.stepIndex
  };
}

export async function loadWizardStateSnapshot(): Promise<PersistedWizardState | null> {
  return loadRawState();
}

export async function clearWizardState(): Promise<void> {
  try {
    await unlink(STATE_FILE);
  } catch {
    // Ignore missing file or permission race conditions.
  }
}
