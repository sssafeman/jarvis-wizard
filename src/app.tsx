import React, { useMemo, useState } from "react";
import { Box } from "ink";
import { DEFAULT_WIZARD_STATE, mergeWizardState } from "./state/wizard-state.js";
import type { WizardStatePatch } from "./state/wizard-state.js";
import { ApiKeys } from "./steps/ApiKeys.js";
import { Capabilities } from "./steps/Capabilities.js";
import { Complete } from "./steps/Complete.js";
import { IntegrationSetup } from "./steps/IntegrationSetup.js";
import { Installation } from "./steps/Installation.js";
import { Personality } from "./steps/Personality.js";
import { UserInfo } from "./steps/UserInfo.js";
import { Welcome } from "./steps/Welcome.js";
import type { WizardStepProps } from "./types/step.js";

const STEPS: Array<React.ComponentType<WizardStepProps>> = [
  Welcome,
  UserInfo,
  Personality,
  ApiKeys,
  Capabilities,
  IntegrationSetup,
  Installation,
  Complete
];

export function App(): React.JSX.Element {
  const [state, setState] = useState(DEFAULT_WIZARD_STATE);
  const [stepIndex, setStepIndex] = useState(0);

  const Step = useMemo(() => STEPS[stepIndex] ?? Complete, [stepIndex]);

  const onNext = (patch?: WizardStatePatch): void => {
    setState((prev) => mergeWizardState(prev, patch));
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const onBack = (): void => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Box flexDirection="column">
      <Step state={state} onNext={onNext} onBack={onBack} />
    </Box>
  );
}
