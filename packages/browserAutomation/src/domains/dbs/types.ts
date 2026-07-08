import { SUPABASE_DASHBOARD_URL as SUPABASE_DASHBOARD_URL_CONST } from '@vybekiit/browser-automation/core/constants';
import type { BaseVerbContext } from '@vybekiit/browser-automation/core/types';

export type SupabaseVerbContext = BaseVerbContext;

/** Supabase dashboard origin — entry point for browser-fallback project setup. */
export const SUPABASE_DASHBOARD_URL = SUPABASE_DASHBOARD_URL_CONST;

/** Result of Supabase setup: project URL and API keys. */
export type SupabaseSetupResult = {
  projectUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  projectRef: string;
};

/** Env block written to .env after setup. Agent never sees key values. */
export type SupabaseEnvBlock = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
} & Record<string, string>;

/**
 * Supabase Env Block.
 *
 * @param result - Operation result to convert.
 * @returns Computed value for downstream automation.
 * @example
 * const result = supabaseEnvBlock(result);
 */
export const supabaseEnvBlock = (result: SupabaseSetupResult): SupabaseEnvBlock => ({
  SUPABASE_URL: result.projectUrl,
  SUPABASE_ANON_KEY: result.anonKey,
  SUPABASE_SERVICE_ROLE_KEY: result.serviceRoleKey,
});
