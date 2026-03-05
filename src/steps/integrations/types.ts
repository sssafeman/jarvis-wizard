export interface IntegrationScreenProps {
  progressLabel: string;
  onComplete: (values: Record<string, string>) => void;
  onSkip: () => void;
  initialValues?: Record<string, string>;
}
