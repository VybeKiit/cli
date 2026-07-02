export type RealtimeProviderName = 'supabase' | 'cloudflare-do' | 'local';

export type RealtimeHandler = (payload: Record<string, unknown>) => void;

export interface RealtimeChannel {
  subscribe(handler: RealtimeHandler): void;
  publish(payload: Record<string, unknown>): Promise<void>;
  unsubscribe(): void;
}

export interface RealtimeProvider {
  readonly name: RealtimeProviderName;
  channel(name: string): RealtimeChannel;
}
