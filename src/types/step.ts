import type { WizardState, WizardStatePatch } from "../state/wizard-state.js";

export interface StepTransitionOptions {
  jumpToStepIndex?: number;
}

export interface WizardStepProps {
  state: WizardState;
  onNext: (patch?: WizardStatePatch, options?: StepTransitionOptions) => void;
  onBack: () => void;
}
