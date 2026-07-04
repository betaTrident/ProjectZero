-- Project ZERO Row Level Security policies
-- Run after supabase/schema.sql.

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

-- No anon insert/update/delete policies exist. Payment status changes are reserved
-- for server-side service-role verification in Phase 3.
