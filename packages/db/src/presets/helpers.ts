/** SQL helper fragments included by preset manifests. */
export const PRESET_HELPERS: Readonly<Record<string, string>> = {
  is_admin: `-- App-level admin check for RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;`,

  realtime_publication: `-- Enable Supabase Realtime for kit tables (run after tables exist)
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
exception
  when insufficient_privilege then null;
end $$;`,
};

/** Tables to add to supabase_realtime publication when preset is applied. */
export const REALTIME_TABLES = [
  'organizations',
  'organization_members',
  'ai_conversations',
  'ai_messages',
  'notifications_log',
] as const;

export function renderRealtimeGrants(tables: readonly string[]): string {
  const lines = tables.map(
    (table) => `alter publication supabase_realtime add table public.${table};`,
  );
  return `-- Realtime publication grants\n${lines.join('\n')}`;
}
