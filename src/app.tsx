import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Text } from "ink";
import { DEFAULT_WIZARD_STATE, mergeWizardState } from "./state/wizard-state.js";
import type { WizardState, WizardStatePatch } from "./state/wizard-state.js";
import { ApiKeys } from "./steps/ApiKeys.js";
import { Capabilities } from "./steps/Capabilities.js";
import { Complete } from "./steps/Complete.js";
import { ExistingInstall } from "./steps/ExistingInstall.js";
import { IntegrationSetup } from "./steps/IntegrationSetup.js";
import { Installation } from "./steps/Installation.js";
import { Personality } from "./steps/Personality.js";
import { ResumePrompt } from "./steps/ResumePrompt.js";
import { SmokeTest } from "./steps/SmokeTest.js";
import { UserInfo } from "./steps/UserInfo.js";
import { Welcome } from "./steps/Welcome.js";
import type { StepTransitionOptions } from "./types/step.js";
import { detectExistingInstall } from "./utils/detect.js";
import type { ExistingInstall as ExistingInstallInfo } from "./utils/detect.js";
import { clearWizardState, loadWizardStateSnapshot, saveWizardState } from "./utils/persistence.js";

const STEP_WELCOME = 0;
const STEP_EXISTING_INSTALL = 1;
const STEP_USER_INFO = 2;
const STEP_PERSONALITY = 3;
const STEP_API_KEYS = 4;
const STEP_CAPABILITIES = 5;
const STEP_INTEGRATIONS = 6;
const STEP_INSTALLATION = 7;
const STEP_SMOKE_TEST = 8;
const STEP_COMPLETE = 9;
const FINAL_STEP_INDEX = STEP_COMPLETE;

const STEP_LABELS: Record<number, string> = {
  [STEP_WELCOME]: "Welcome",
  [STEP_EXISTING_INSTALL]: "Existing Install",
  [STEP_USER_INFO]: "User Info",
  [STEP_PERSONALITY]: "Personality",
  [STEP_API_KEYS]: "API Keys",
  [STEP_CAPABILITIES]: "Capabilities",
  [STEP_INTEGRATIONS]: "Integration Setup",
  [STEP_INSTALLATION]: "Installation",
  [STEP_SMOKE_TEST]: "Smoke Test",
  [STEP_COMPLETE]: "Complete"
};

interface ResumeData {
  state: WizardState;
  stepIndex: number;
  startedAt: number;
}

function clampStepIndex(index: number): number {
  if (!Number.isFinite(index)) {
    return STEP_WELCOME;
  }

  return Math.min(Math.max(Math.floor(index), STEP_WELCOME), FINAL_STEP_INDEX);
}

function isStepVisible(stepIndex: number, state: WizardState, existingInstall: ExistingInstallInfo | null): boolean {
  if (stepIndex === STEP_EXISTING_INSTALL) {
    return Boolean(existingInstall) && state.existingInstallAction === null;
  }

  return true;
}

function findNextVisibleStep(
  fromIndex: number,
  state: WizardState,
  existingInstall: ExistingInstallInfo | null
): number {
  for (let index = Math.max(fromIndex, STEP_WELCOME); index <= FINAL_STEP_INDEX; index += 1) {
    if (isStepVisible(index, state, existingInstall)) {
      return index;
    }
  }

  return FINAL_STEP_INDEX;
}

function findPreviousVisibleStep(
  fromIndex: number,
  state: WizardState,
  existingInstall: ExistingInstallInfo | null
): number {
  for (let index = Math.min(fromIndex, FINAL_STEP_INDEX); index >= STEP_WELCOME; index -= 1) {
    if (isStepVisible(index, state, existingInstall)) {
      return index;
    }
  }

  return STEP_WELCOME;
}

export function App(): React.JSX.Element {
  const [state, setState] = useState(DEFAULT_WIZARD_STATE);
  const [stepIndex, setStepIndex] = useState(STEP_WELCOME);
  const [existingInstall, setExistingInstall] = useState<ExistingInstallInfo | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      const [detectedInstall, savedState] = await Promise.all([
        detectExistingInstall(DEFAULT_WIZARD_STATE.workspacePath),
        loadWizardStateSnapshot()
      ]);

      if (detectedInstall.hasClawdbotConfig || detectedInstall.hasWorkspace) {
        setExistingInstall(detectedInstall);
      }

      if (savedState) {
        setResumeData({
          state: savedState.state,
          stepIndex: clampStepIndex(savedState.stepIndex),
          startedAt: savedState.startedAt
        });
        setShowResumePrompt(true);
      }

      setReady(true);
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (isStepVisible(stepIndex, state, existingInstall)) {
      return;
    }

    setStepIndex((current) => findNextVisibleStep(current + 1, state, existingInstall));
  }, [existingInstall, state, stepIndex]);

  const onNext = useCallback((patch?: WizardStatePatch, options?: StepTransitionOptions): void => {
    const mergedState = mergeWizardState(state, patch);
    const candidate = options?.jumpToStepIndex;
    const nextStep = candidate !== undefined
      ? clampStepIndex(candidate)
      : findNextVisibleStep(stepIndex + 1, mergedState, existingInstall);

    setState(mergedState);
    setStepIndex(nextStep);

    if (nextStep === STEP_COMPLETE) {
      void clearWizardState();
    } else {
      void saveWizardState(mergedState, nextStep);
    }
  }, [existingInstall, state, stepIndex]);

  const onBack = useCallback((): void => {
    setStepIndex((current) => findPreviousVisibleStep(current - 1, state, existingInstall));
  }, [existingInstall, state]);

  const onResume = useCallback((): void => {
    if (!resumeData) {
      return;
    }

    setState(resumeData.state);
    setStepIndex(clampStepIndex(resumeData.stepIndex));
    setShowResumePrompt(false);
  }, [resumeData]);

  const onStartFresh = useCallback((): void => {
    setState(DEFAULT_WIZARD_STATE);
    setStepIndex(STEP_WELCOME);
    setResumeData(null);
    setShowResumePrompt(false);
    void clearWizardState();
  }, []);

  const onOverwriteExisting = useCallback((): void => {
    onNext({
      existingInstallAction: "overwrite",
      installMode: "fresh"
    });
  }, [onNext]);

  const onRepairExisting = useCallback((): void => {
    const patch: WizardStatePatch = {
      existingInstallAction: "repair",
      installMode: "repair",
      workspacePath: existingInstall?.workspacePath ?? state.workspacePath
    };

    if (existingInstall?.configuredBot) {
      patch.integrations = {
        ...state.integrations,
        telegram: {
          ...(state.integrations.telegram ?? {}),
          botUsername: existingInstall.configuredBot
        }
      };
    }

    onNext(patch, { jumpToStepIndex: STEP_INSTALLATION });
  }, [existingInstall, onNext, state.integrations, state.workspacePath]);

  const currentStepIndex = useMemo(() => {
    if (isStepVisible(stepIndex, state, existingInstall)) {
      return stepIndex;
    }

    return findNextVisibleStep(stepIndex + 1, state, existingInstall);
  }, [existingInstall, state, stepIndex]);

  const resumeStepLabel = resumeData
    ? STEP_LABELS[clampStepIndex(resumeData.stepIndex)] ?? "Welcome"
    : "Welcome";

  if (!ready) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="gray">Loading setup wizard...</Text>
      </Box>
    );
  }

  if (showResumePrompt && resumeData) {
    return (
      <Box flexDirection="column">
        <ResumePrompt
          startedAt={resumeData.startedAt}
          lastStepLabel={resumeStepLabel}
          onResume={onResume}
          onStartFresh={onStartFresh}
        />
      </Box>
    );
  }

  if (currentStepIndex === STEP_WELCOME) {
    return (
      <Box flexDirection="column">
        <Welcome state={state} onNext={onNext} onBack={onBack} />
      </Box>
    );
  }

  if (currentStepIndex === STEP_EXISTING_INSTALL && existingInstall) {
    return (
      <Box flexDirection="column">
        <ExistingInstall install={existingInstall} onOverwrite={onOverwriteExisting} onRepair={onRepairExisting} />
      </Box>
    );
  }

  if (currentStepIndex === STEP_USER_INFO) {
    return (
      <Box flexDirection="column">
        <UserInfo state={state} onNext={onNext} onBack={onBack} />
      </Box>
    );
  }

  if (currentStepIndex === STEP_PERSONALITY) {
    return (
      <Box flexDirection="column">
        <Personality state={state} onNext={onNext} onBack={onBack} />
      </Box>
    );
  }

  if (currentStepIndex === STEP_API_KEYS) {
    return (
      <Box flexDirection="column">
        <ApiKeys state={state} onNext={onNext} onBack={onBack} />
      </Box>
    );
  }

  if (currentStepIndex === STEP_CAPABILITIES) {
    return (
      <Box flexDirection="column">
        <Capabilities state={state} onNext={onNext} onBack={onBack} />
      </Box>
    );
  }

  if (currentStepIndex === STEP_INTEGRATIONS) {
    return (
      <Box flexDirection="column">
        <IntegrationSetup state={state} onNext={onNext} onBack={onBack} />
      </Box>
    );
  }

  if (currentStepIndex === STEP_INSTALLATION) {
    return (
      <Box flexDirection="column">
        <Installation state={state} onNext={onNext} onBack={onBack} />
      </Box>
    );
  }

  if (currentStepIndex === STEP_SMOKE_TEST) {
    return (
      <Box flexDirection="column">
        <SmokeTest state={state} onNext={onNext} onBack={onBack} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Complete state={state} onNext={onNext} onBack={onBack} />
    </Box>
  );
}
