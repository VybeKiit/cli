-- VybeKiit store orders — fulfillment + refund tracking (issue #5 / #7).
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  email text,
  github_username text,
  refunded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_github_username_idx on public.orders (github_username);

alter table public.orders enable row level security;
