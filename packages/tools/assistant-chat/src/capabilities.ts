import type { VybeAssistant } from '@vybekiit/report-mode';

export interface AssistantModelOption {
  readonly id: string;
  readonly label?: string;
  readonly default?: boolean;
}

export interface AssistantCapability {
  readonly id: VybeAssistant;
  readonly streaming: boolean;
  readonly modelPicker: boolean;
  readonly installed: boolean;
  readonly reason?: string;
}

export interface CapabilitiesResponse {
  readonly assistants: readonly AssistantCapability[];
}

export interface ModelsResponse {
  readonly assistant: VybeAssistant;
  readonly models: readonly AssistantModelOption[];
  readonly source: 'live' | 'fallback';
  readonly fetchedAt: string;
}

export interface SendTurnOptions {
  readonly assistant?: VybeAssistant;
  readonly model?: string;
}
