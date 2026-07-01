-- Preset: rows belong to the signed-in user (copy into a migration after creating your table).
-- Replace `your_table` and ensure a `user_id uuid references auth.users(id)` column exists.

alter table public.your_table enable row level security;

create policy "Users read own rows"
  on public.your_table
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own rows"
  on public.your_table
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own rows"
  on public.your_table
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own rows"
  on public.your_table
  for delete
  to authenticated
  using (auth.uid() = user_id);
