import React from "react";
import { Box, Text } from "ink";

interface NavHintsProps {
  canGoBack?: boolean;
  canSkip?: boolean;
  enterLabel?: string;
}

export function NavHints({
  canGoBack = false,
  canSkip = false,
  enterLabel = "Continue",
}: NavHintsProps): React.JSX.Element {
  return (
    <Box marginTop={1} gap={3}>
      <Text color="gray">[Enter] {enterLabel}</Text>
      {canGoBack ? <Text color="gray">[Esc] Back</Text> : null}
      {canSkip ? <Text color="gray">[s] Skip</Text> : null}
      <Text color="gray">[Ctrl+C] Quit</Text>
    </Box>
  );
}
