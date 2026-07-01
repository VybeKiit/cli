-- License activation + audit fields for the VybeKiit store gate (Issue #4).
alter table public.orders
  add column if not exists license_key text,
  add column if not exists activated_at timestamptz,
  add column if not exists revoked boolean not null default false;

create unique index if not exists orders_license_key_uidx on public.orders (license_key)
  where license_key is not null;

-- RLS intent: enabled with no anon/authenticated policies — only the service-role
-- client (server routes) bypasses RLS. Browser/anon keys cannot read or write orders.
