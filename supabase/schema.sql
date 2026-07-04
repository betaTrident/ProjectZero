-- Project ZERO schema
-- Run this before supabase/rls.sql.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null check (char_length(trim(business_name)) between 2 and 120),
  slug text unique check (slug is null or slug ~ '^[a-z0-9-]{3,80}$'),
  stellar_public_key text check (stellar_public_key is null or stellar_public_key ~ '^G[A-Z2-7]{55}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text,
  price numeric(12,2) not null check (price > 0),
  asset_code text not null default 'XLM' check (asset_code ~ '^[A-Z0-9]{1,12}$'),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text,
  amount numeric(12,2) not null check (amount > 0),
  asset_code text not null default 'XLM' check (asset_code ~ '^[A-Z0-9]{1,12}$'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'cancelled')),
  stellar_destination text not null check (stellar_destination ~ '^G[A-Z2-7]{55}$'),
  memo text not null unique,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_requests_paid_at_status_check
    check ((status = 'paid' and paid_at is not null) or (status <> 'paid'))
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.payment_requests(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  stellar_tx_hash text not null unique,
  source_wallet text,
  destination_wallet text,
  amount numeric(12,2),
  asset_code text,
  verified_at timestamptz not null default now(),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.payment_requests(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  receipt_number text not null unique,
  created_at timestamptz not null default now()
);

drop trigger if exists set_merchants_updated_at on public.merchants;
create trigger set_merchants_updated_at
before update on public.merchants
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_requests_updated_at on public.payment_requests;
create trigger set_payment_requests_updated_at
before update on public.payment_requests
for each row execute function public.set_updated_at();

create index if not exists merchants_user_id_idx on public.merchants(user_id);
create index if not exists products_merchant_id_idx on public.products(merchant_id);
create index if not exists products_merchant_active_idx on public.products(merchant_id, is_active);
create index if not exists payment_requests_merchant_status_idx on public.payment_requests(merchant_id, status, created_at desc);
create index if not exists payment_requests_public_lookup_idx
  on public.payment_requests(id, status)
  where status in ('pending', 'paid');
create index if not exists payment_requests_memo_idx on public.payment_requests(memo);
create index if not exists transactions_merchant_created_idx on public.transactions(merchant_id, created_at desc);
create index if not exists receipts_merchant_created_idx on public.receipts(merchant_id, created_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.merchants to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.payment_requests to authenticated;
grant select on public.transactions to authenticated;
grant select on public.receipts to authenticated;
grant select on public.merchants to anon;
grant select on public.payment_requests to anon;
