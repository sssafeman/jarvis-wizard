import React from "react";
import { Box, Text } from "ink";

interface StepHeaderProps {
  title: string;
  subtitle?: string;
}

export function StepHeader({ title, subtitle }: StepHeaderProps): React.JSX.Element {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>
        {title}
      </Text>
      {subtitle ? <Text color="gray">{subtitle}</Text> : null}
    </Box>
  );
}
