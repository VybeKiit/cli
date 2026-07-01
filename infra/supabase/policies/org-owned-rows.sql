-- Preset: rows belong to an organization workspace (wire to @vybekiit/tenancy when enabled).
-- Replace `your_table` with your schema.

alter table public.your_table enable row level security;

create policy "Org members read org rows"
  on public.your_table
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members om
      where om.org_id = your_table.org_id
        and om.user_id = auth.uid()::text
    )
  );

create policy "Org members write org rows"
  on public.your_table
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.organization_members om
      where om.org_id = your_table.org_id
        and om.user_id = auth.uid()::text
    )
  );
