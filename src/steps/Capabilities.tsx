import React from "react";
import { Box, Text, useInput } from "ink";
import { MultiSelect } from "../components/MultiSelect.js";
import { NavHints } from "../components/NavHints.js";
import { StepHeader } from "../components/StepHeader.js";
import type { WizardStepProps } from "../types/step.js";

const CAPABILITY_OPTIONS = [
  { label: "Web search & research", value: "web_search" },
  { label: "Voice messages", value: "voice_messages", note: "Installs edge-tts + ffmpeg scripts" },
  { label: "Reminders", value: "reminders", note: "remind-me skill" },
  { label: "News & Hacker News", value: "hn_news", note: "hn skill" },
  { label: "Note-taking / Obsidian", value: "obsidian_notes", note: "obsidian-daily skill" },
  { label: "Study & Canvas LMS", value: "canvas_lms", note: "canvas-lms skill (follow-up setup)" },
  { label: "GitHub integration", value: "github_integration" },
  { label: "Gaming stats / FACEIT CS2", value: "faceit_cs2" },
  { label: "Todoist tasks", value: "todoist" },
  { label: "YouTube transcripts", value: "youtube_transcripts", note: "youtube-watcher skill" },
  { label: "Japanese language", value: "japanese_language", note: "japanese-translation-and-tutor skill" },
  { label: "Email monitoring", value: "email_monitoring", note: "requires setup after install" }
];

export function Capabilities({ state, onNext, onBack }: WizardStepProps): React.JSX.Element {
  useInput((_, key) => {
    if (key.escape) onBack();
  });

  const initialSelected = state.capabilities.length
    ? state.capabilities
    : state.keys.brave
      ? ["web_search"]
      : [];

  return (
    <Box flexDirection="column" padding={1}>
      <StepHeader title="Step 5/7 - Capabilities" subtitle="Choose what Jarvis should be able to do" />

      <MultiSelect
        label="Capabilities"
        options={CAPABILITY_OPTIONS}
        initialSelected={initialSelected}
        onSubmit={(capabilities) => {
          onNext({ capabilities });
        }}
      />

      <Text color="yellow">Email monitoring requires OAuth setup after installation.</Text>
      <NavHints canGoBack={true} enterLabel="Confirm selection" />
    </Box>
  );
}
