import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { NavHints } from "../components/NavHints.js";
import { SelectList } from "../components/SelectList.js";
import { StepHeader } from "../components/StepHeader.js";
import { TextInput } from "../components/TextInput.js";
import type { WizardStepProps } from "../types/step.js";

const OCCUPATIONS = [
  { label: "Student", value: "Student" },
  { label: "Developer", value: "Developer" },
  { label: "Creative", value: "Creative" },
  { label: "Other", value: "Other" }
];

const TECH_LEVELS = [
  { label: "Advanced terminal user", value: "Advanced terminal user" },
  { label: "Intermediate", value: "Intermediate" },
  { label: "Beginner", value: "Beginner" }
];

export function UserInfo({ state, onNext, onBack }: WizardStepProps): React.JSX.Element {
  const [stage, setStage] = useState(0);

  useInput((_, key) => {
    if (key.escape) {
      if (stage > 0) setStage((s) => s - 1);
      else onBack();
    }
  });
  const [name, setName] = useState(state.user.name);
  const [timezone, setTimezone] = useState(state.user.timezone);
  const [occupationIndex, setOccupationIndex] = useState(
    Math.max(
      0,
      OCCUPATIONS.findIndex((option) => option.value === state.user.occupation)
    )
  );
  const [techLevelIndex, setTechLevelIndex] = useState(
    Math.max(
      0,
      TECH_LEVELS.findIndex((option) => option.value === state.user.techLevel)
    )
  );
  const [error, setError] = useState<string | null>(null);

  const currentOccupation = useMemo(() => OCCUPATIONS[occupationIndex]?.value ?? "Developer", [occupationIndex]);
  const currentTechLevel = useMemo(() => TECH_LEVELS[techLevelIndex]?.value ?? "Intermediate", [techLevelIndex]);

  return (
    <Box flexDirection="column" padding={1}>
      <StepHeader title="Step 2/7 - User Info" subtitle="Tell Jarvis who you are" />

      {stage === 0 ? (
        <TextInput
          label="Your name"
          value={name}
          placeholder="e.g. Sam"
          onChange={(value) => {
            setError(null);
            setName(value);
          }}
          validate={(value) => (value.trim().length > 0 ? null : "Name is required")}
          onSubmit={() => {
            if (!name.trim()) {
              setError("Please enter your name.");
              return;
            }
            setStage(1);
          }}
        />
      ) : null}

      {stage === 1 ? (
        <TextInput
          label="Timezone"
          value={timezone}
          placeholder="Europe/Oslo"
          onChange={(value) => {
            setError(null);
            setTimezone(value);
          }}
          validate={(value) => (value.trim().length > 0 ? null : "Timezone is required")}
          onSubmit={() => {
            if (!timezone.trim()) {
              setError("Timezone cannot be empty.");
              return;
            }
            setStage(2);
          }}
        />
      ) : null}

      {stage === 2 ? (
        <SelectList
          label="Occupation"
          options={OCCUPATIONS}
          selectedIndex={occupationIndex}
          onChange={setOccupationIndex}
          onSubmit={() => setStage(3)}
        />
      ) : null}

      {stage === 3 ? (
        <SelectList
          label="Tech level"
          options={TECH_LEVELS}
          selectedIndex={techLevelIndex}
          onChange={setTechLevelIndex}
          onSubmit={() => {
            const trimmed = name.trim();
            onNext({
              user: {
                name: trimmed,
                callName: trimmed,
                timezone: timezone.trim(),
                occupation: currentOccupation,
                techLevel: currentTechLevel
              }
            });
          }}
        />
      ) : null}

      {error ? <Text color="red">✗ {error}</Text> : null}
      <Text color="gray">Sub-step: {stage + 1}/4</Text>
      <NavHints canGoBack={true} />
    </Box>
  );
}
