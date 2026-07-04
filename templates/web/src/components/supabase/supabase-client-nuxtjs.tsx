import { createBrowserClient } from '@supabase/ssr';
import process from 'node:process';

export function createClient() {
  return createBrowserClient(
    process.env.NUXT_PUBLIC_SUPABASE_URL!,
    process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
