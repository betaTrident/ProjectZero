-- Project ZERO baseline schema and RLS.
-- This migration mirrors supabase/schema.sql and supabase/rls.sql so local
-- Docker resets can build the database from migrations alone.

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

alter table public.merchants enable row level security;
alter table public.products enable row level security;
alter table public.payment_requests enable row level security;
alter table public.transactions enable row level security;
alter table public.receipts enable row level security;

drop policy if exists "merchants_select_own" on public.merchants;
create policy "merchants_select_own"
on public.merchants
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "merchants_insert_own" on public.merchants;
create policy "merchants_insert_own"
on public.merchants
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "merchants_update_own" on public.merchants;
create policy "merchants_update_own"
on public.merchants
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "products_crud_own" on public.products;
create policy "products_crud_own"
on public.products
for all
to authenticated
using (
  exists (
    select 1
    from public.merchants
    where merchants.id = products.merchant_id
      and merchants.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.merchants
    where merchants.id = products.merchant_id
      and merchants.user_id = (select auth.uid())
  )
);

drop policy if exists "payment_requests_crud_own" on public.payment_requests;
create policy "payment_requests_crud_own"
on public.payment_requests
for all
to authenticated
using (
  exists (
    select 1
    from public.merchants
    where merchants.id = payment_requests.merchant_id
      and merchants.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.merchants
    where merchants.id = payment_requests.merchant_id
      and merchants.user_id = (select auth.uid())
  )
);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.merchants
    where merchants.id = transactions.merchant_id
      and merchants.user_id = (select auth.uid())
  )
);

drop policy if exists "receipts_select_own" on public.receipts;
create policy "receipts_select_own"
on public.receipts
for select
to authenticated
using (
  exists (
    select 1
    from public.merchants
    where merchants.id = receipts.merchant_id
      and merchants.user_id = (select auth.uid())
  )
);

drop policy if exists "public_select_payment_request_merchant_name" on public.merchants;
create policy "public_select_payment_request_merchant_name"
on public.merchants
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.payment_requests
    where payment_requests.merchant_id = merchants.id
      and payment_requests.status in ('pending', 'paid')
      and (payment_requests.expires_at is null or payment_requests.expires_at > now())
  )
);

drop policy if exists "public_select_payable_payment_requests" on public.payment_requests;
create policy "public_select_payable_payment_requests"
on public.payment_requests
for select
to anon, authenticated
using (
  status in ('pending', 'paid')
  and (expires_at is null or expires_at > now() or status = 'paid')
);
