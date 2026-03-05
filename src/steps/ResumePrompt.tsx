import React, { useMemo, useState } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";

interface ResumePromptProps {
  startedAt: number;
  lastStepLabel: string;
  onResume: () => void;
  onStartFresh: () => void;
}

const OPTIONS = [
  { label: "Yes, resume where I left off", value: "resume" },
  { label: "No, start fresh", value: "fresh" }
] as const;

function formatStartedAgo(startedAt: number): string {
  const diffMs = Math.max(0, Date.now() - startedAt);
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function ResumePrompt({
  startedAt,
  lastStepLabel,
  onResume,
  onStartFresh
}: ResumePromptProps): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const startedAgo = useMemo(() => formatStartedAgo(startedAt), [startedAt]);

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan">↩ Resume previous setup?</Text>
      <Text>Started: {startedAgo}</Text>
      <Text>Last step: {lastStepLabel}</Text>

      <Box marginTop={1}>
        <SelectList
          options={OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
          onSubmit={(option) => {
            if (option.value === "resume") {
              onResume();
              return;
            }

            onStartFresh();
          }}
        />
      </Box>
    </Box>
  );
}
