import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";

export interface MultiSelectOption {
  label: string;
  value: string;
  note?: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  initialSelected?: string[];
  active?: boolean;
  onSubmit: (selectedValues: string[]) => void;
}

export function MultiSelect({
  label,
  options,
  initialSelected = [],
  active = true,
  onSubmit
}: MultiSelectProps): React.JSX.Element {
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  useInput((input, key) => {
    if (!active) {
      return;
    }

    if (key.downArrow) {
      setCursor((prev) => (prev + 1) % options.length);
      return;
    }

    if (key.upArrow) {
      setCursor((prev) => (prev - 1 + options.length) % options.length);
      return;
    }

    if (input === " ") {
      const current = options[cursor]?.value;
      if (!current) {
        return;
      }

      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(current)) {
          next.delete(current);
        } else {
          next.add(current);
        }

        return next;
      });
      return;
    }

    if (key.return) {
      onSubmit(Array.from(selected));
    }
  });

  const selectedCount = useMemo(() => selected.size, [selected]);

  return (
    <Box flexDirection="column" marginBottom={1}>
      {label ? <Text color="cyan">{label}</Text> : null}
      {options.map((option, index) => {
        const focused = index === cursor;
        const checked = selected.has(option.value);

        return (
          <Text key={option.value} color={focused ? "green" : "white"}>
            {focused ? "❯" : " "} [{checked ? "x" : " "}] {option.label}
            {option.note ? <Text color="gray"> - {option.note}</Text> : null}
          </Text>
        );
      })}
      <Text color="gray">Use ↑/↓ to move, Space to toggle, Enter to confirm ({selectedCount} selected)</Text>
    </Box>
  );
}
