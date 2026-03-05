import React from "react";
import { Box, Text, useInput } from "ink";

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

interface SelectListProps {
  label?: string;
  options: SelectOption[];
  selectedIndex: number;
  active?: boolean;
  onChange: (index: number) => void;
  onSubmit?: (option: SelectOption) => void;
}

export function SelectList({
  label,
  options,
  selectedIndex,
  active = true,
  onChange,
  onSubmit
}: SelectListProps): React.JSX.Element {
  useInput((_, key) => {
    if (!active) {
      return;
    }

    if (key.downArrow) {
      onChange((selectedIndex + 1) % options.length);
      return;
    }

    if (key.upArrow) {
      onChange((selectedIndex - 1 + options.length) % options.length);
      return;
    }

    if (key.return) {
      onSubmit?.(options[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column" marginBottom={1}>
      {label ? <Text color="cyan">{label}</Text> : null}
      {options.map((option, index) => {
        const selected = index === selectedIndex;

        return (
          <Text key={option.value} color={selected ? "green" : "white"}>
            {selected ? "❯" : " "} {option.label}
            {option.description ? <Text color="gray"> - {option.description}</Text> : null}
          </Text>
        );
      })}
      {active ? <Text color="gray">Use ↑/↓ and press Enter</Text> : null}
    </Box>
  );
}
