import type { WizardState, WizardStatePatch } from "../state/wizard-state.js";

export interface WizardStepProps {
  state: WizardState;
  onNext: (patch?: WizardStatePatch) => void;
  onBack: () => void;
}
