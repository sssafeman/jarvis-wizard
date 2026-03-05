import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";

interface PasswordInputProps {
  label: string;
  value: string;
  placeholder?: string;
  active?: boolean;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  validate?: (value: string) => string | null;
}

export function PasswordInput({
  label,
  value,
  placeholder,
  active = true,
  onChange,
  onSubmit,
  validate
}: PasswordInputProps): React.JSX.Element {
  const [touched, setTouched] = useState(false);
  const validationMessage = useMemo(() => (validate ? validate(value) : null), [validate, value]);
  const showValidation = touched && value.length > 0;
  const masked = value.length > 0 ? "*".repeat(value.length) : placeholder ?? "";

  useInput((input, key) => {
    if (!active) {
      return;
    }

    setTouched(true);

    if (key.return) {
      onSubmit?.();
      return;
    }

    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      onChange(value + input);
    }
  });

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text color="cyan">{label}: </Text>
        <Text color={value.length > 0 ? "white" : "gray"}>{masked}</Text>
      </Text>
      {active ? <Text color="gray">Type and press Enter</Text> : null}
      {showValidation && validationMessage === null ? <Text color="green">✓ Valid!</Text> : null}
      {showValidation && validationMessage !== null ? <Text color="red">✗ Invalid: {validationMessage}</Text> : null}
    </Box>
  );
}
