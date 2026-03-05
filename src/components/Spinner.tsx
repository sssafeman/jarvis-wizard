import React, { useEffect, useState } from "react";
import { Text } from "ink";

interface SpinnerProps {
  label: string;
  color?: "green" | "red" | "yellow" | "cyan" | "white";
}

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner({ label, color = "cyan" }: SpinnerProps): React.JSX.Element {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % FRAMES.length);
    }, 80);

    return () => clearInterval(timer);
  }, []);

  return <Text color={color}>{FRAMES[frame]} {label}</Text>;
}
