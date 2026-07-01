-- Preset: anyone signed in can read; only the owner can write.
-- Replace `your_table` and `user_id` as needed.

alter table public.your_table enable row level security;

create policy "Authenticated users can read"
  on public.your_table
  for select
  to authenticated
  using (true);

create policy "Owners insert"
  on public.your_table
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Owners update"
  on public.your_table
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners delete"
  on public.your_table
  for delete
  to authenticated
  using (auth.uid() = user_id);
