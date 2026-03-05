import React, { useEffect, useMemo, useState } from "react";
import { Box } from "ink";
import { CanvasSetup } from "./integrations/CanvasSetup.js";
import { FaceitSetup } from "./integrations/FaceitSetup.js";
import { GitHubSetup } from "./integrations/GitHubSetup.js";
import { TodoistSetup } from "./integrations/TodoistSetup.js";
import type { IntegrationScreenProps } from "./integrations/types.js";
import type { WizardStepProps } from "../types/step.js";

interface IntegrationRoute {
  capability: string;
  integrationKey: string;
  label: string;
  Screen: React.ComponentType<IntegrationScreenProps>;
}

const ROUTES: IntegrationRoute[] = [
  { capability: "canvas_lms", integrationKey: "canvas", label: "Canvas LMS", Screen: CanvasSetup },
  { capability: "github_integration", integrationKey: "github", label: "GitHub", Screen: GitHubSetup },
  { capability: "faceit_cs2", integrationKey: "faceit", label: "FACEIT CS2", Screen: FaceitSetup },
  { capability: "todoist", integrationKey: "todoist", label: "Todoist", Screen: TodoistSetup }
];

export function IntegrationSetup({ state, onNext }: WizardStepProps): React.JSX.Element {
  const routes = useMemo(
    () => ROUTES.filter((route) => state.capabilities.includes(route.capability)),
    [state.capabilities]
  );

  const [index, setIndex] = useState(0);
  const [integrations, setIntegrations] = useState(state.integrations);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) {
      return;
    }

    if (routes.length === 0) {
      setFinished(true);
      onNext();
      return;
    }

    if (index >= routes.length) {
      setFinished(true);
      onNext({ integrations });
    }
  }, [finished, index, integrations, onNext, routes.length]);

  const currentRoute = routes[index];
  if (!currentRoute) {
    return <Box />;
  }

  const progressLabel = `Step 5/8 - Integration Setup (${index + 1}/${routes.length}): ${currentRoute.label}`;
  const Screen = currentRoute.Screen;

  return (
    <Box flexDirection="column" padding={1}>
      <Screen
        progressLabel={progressLabel}
        initialValues={integrations[currentRoute.integrationKey]}
        onComplete={(values) => {
          setIntegrations((prev) => ({
            ...prev,
            [currentRoute.integrationKey]: values
          }));
          setIndex((prev) => prev + 1);
        }}
        onSkip={() => {
          setIndex((prev) => prev + 1);
        }}
      />
    </Box>
  );
}
