import React from "react";
import { Text } from "ink";
import { Spinner } from "./Spinner.js";

export type Status = "idle" | "validating" | "success" | "error";

export interface ValidationStatusProps {
  status: Status;
  successMessage?: string;
  errorMessage?: string;
}

export function ValidationStatus({
  status,
  successMessage,
  errorMessage
}: ValidationStatusProps): React.JSX.Element | null {
  if (status === "idle") {
    return null;
  }

  if (status === "validating") {
    return <Spinner label="Validating connection..." color="cyan" />;
  }

  if (status === "success") {
    return <Text color="green">✓ {successMessage ?? "Validation successful."}</Text>;
  }

  return <Text color="red">✗ {errorMessage ?? "Validation failed."}</Text>;
}
