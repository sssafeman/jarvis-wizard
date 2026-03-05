import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { NavHints } from "../components/NavHints.js";
import { SelectList } from "../components/SelectList.js";
import { StepHeader } from "../components/StepHeader.js";
import { TextInput } from "../components/TextInput.js";
import type { WizardStepProps } from "../types/step.js";

const STYLE_OPTIONS = [
  { label: "Direct & concise", value: "direct" },
  { label: "Friendly & conversational", value: "friendly" },
  { label: "Professional", value: "professional" },
  { label: "Casual", value: "casual" }
];

const ADDRESS_OPTIONS = [
  { label: "By name", value: "name" },
  { label: '"Sir" (butler mode)', value: "sir" },
  { label: "Nothing", value: "nothing" }
];

export function Personality({ state, onNext, onBack }: WizardStepProps): React.JSX.Element {
  const [stage, setStage] = useState(0);

  useInput((_, key) => {
    if (key.escape) {
      if (stage > 0) setStage((s) => s - 1);
      else onBack();
    }
  });
  const [assistantName, setAssistantName] = useState(state.personality.assistantName || "Jarvis");
  const [emoji, setEmoji] = useState(state.personality.emoji || "⚡");
  const [styleIndex, setStyleIndex] = useState(
    Math.max(
      0,
      STYLE_OPTIONS.findIndex((option) => option.value === state.personality.style)
    )
  );
  const [addressIndex, setAddressIndex] = useState(
    Math.max(
      0,
      ADDRESS_OPTIONS.findIndex((option) => option.value === state.personality.addressAs)
    )
  );
  const [customNotes, setCustomNotes] = useState(state.personality.customNotes);
  const [error, setError] = useState<string | null>(null);

  const style = useMemo(() => STYLE_OPTIONS[styleIndex]?.value ?? "direct", [styleIndex]);
  const addressAs = useMemo(() => ADDRESS_OPTIONS[addressIndex]?.value ?? "name", [addressIndex]);

  return (
    <Box flexDirection="column" padding={1}>
      <StepHeader title="Step 3/7 - Personality" subtitle="Define your assistant identity" />

      {stage === 0 ? (
        <TextInput
          label="Assistant name"
          value={assistantName}
          placeholder="Jarvis"
          onChange={(value) => {
            setError(null);
            setAssistantName(value);
          }}
          validate={(value) => (value.trim().length > 0 ? null : "Assistant name is required")}
          onSubmit={() => {
            if (!assistantName.trim()) {
              setError("Assistant name is required.");
              return;
            }
            setStage(1);
          }}
        />
      ) : null}

      {stage === 1 ? (
        <TextInput
          label="Emoji"
          value={emoji}
          placeholder="⚡"
          onChange={(value) => {
            setError(null);
            setEmoji(value);
          }}
          validate={(value) => (value.trim().length > 0 ? null : "Emoji is required")}
          onSubmit={() => {
            if (!emoji.trim()) {
              setError("Emoji is required.");
              return;
            }
            setStage(2);
          }}
        />
      ) : null}

      {stage === 2 ? (
        <SelectList
          label="Style"
          options={STYLE_OPTIONS}
          selectedIndex={styleIndex}
          onChange={setStyleIndex}
          onSubmit={() => setStage(3)}
        />
      ) : null}

      {stage === 3 ? (
        <SelectList
          label="Address as"
          options={ADDRESS_OPTIONS}
          selectedIndex={addressIndex}
          onChange={setAddressIndex}
          onSubmit={() => setStage(4)}
        />
      ) : null}

      {stage === 4 ? (
        <TextInput
          label="Extra personality notes"
          value={customNotes}
          placeholder="Optional"
          onChange={setCustomNotes}
          onSubmit={() => {
            onNext({
              personality: {
                assistantName: assistantName.trim(),
                emoji: emoji.trim(),
                style,
                addressAs,
                customNotes: customNotes.trim()
              }
            });
          }}
        />
      ) : null}

      {error ? <Text color="red">✗ {error}</Text> : null}
      <Text color="gray">Sub-step: {stage + 1}/5</Text>
      <NavHints canGoBack={true} />
    </Box>
  );
}
