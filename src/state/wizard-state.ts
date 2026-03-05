export type InstallMode = "fresh" | "repair";
export type ExistingInstallAction = "overwrite" | "repair" | null;

export interface WizardState {
  user: {
    name: string;
    callName: string;
    timezone: string;
    occupation: string;
    techLevel: string;
  };
  personality: {
    assistantName: string;
    emoji: string;
    style: string;
    addressAs: string;
    customNotes: string;
  };
  keys: {
    anthropic: string;
    telegramBot: string;
    brave: string;
  };
  model: {
    default: string;
  };
  capabilities: string[];
  integrations: Record<string, Record<string, string>>;
  workspacePath: string;
  gatewayPort: number;
  telegramChatId: string;
  installMode: InstallMode;
  existingInstallAction: ExistingInstallAction;
}

export type WizardStatePatch = Partial<Omit<WizardState, "user" | "personality" | "keys" | "model">> & {
  user?: Partial<WizardState["user"]>;
  personality?: Partial<WizardState["personality"]>;
  keys?: Partial<WizardState["keys"]>;
  model?: Partial<WizardState["model"]>;
};

export const DEFAULT_WIZARD_STATE: WizardState = {
  user: {
    name: "",
    callName: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    occupation: "Developer",
    techLevel: "Intermediate"
  },
  personality: {
    assistantName: "Jarvis",
    emoji: "⚡",
    style: "direct",
    addressAs: "name",
    customNotes: ""
  },
  keys: {
    anthropic: "",
    telegramBot: "",
    brave: ""
  },
  model: {
    default: "anthropic/claude-sonnet-4-5"
  },
  capabilities: [],
  integrations: {},
  workspacePath: "~/clawd",
  gatewayPort: 18789,
  telegramChatId: "",
  installMode: "fresh",
  existingInstallAction: null
};

export function mergeWizardState(state: WizardState, patch?: WizardStatePatch): WizardState {
  if (!patch) {
    return state;
  }

  return {
    ...state,
    ...patch,
    user: {
      ...state.user,
      ...patch.user
    },
    personality: {
      ...state.personality,
      ...patch.personality
    },
    keys: {
      ...state.keys,
      ...patch.keys
    },
    model: {
      ...state.model,
      ...patch.model
    },
    integrations: {
      ...state.integrations,
      ...patch.integrations
    }
  };
}
