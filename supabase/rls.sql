-- Project ZERO Row Level Security policies
-- Run after supabase/schema.sql.

alter table public.merchants enable row level security;
alter table public.products enable row level security;
alter table public.payment_requests enable row level security;
alter table public.transactions enable row level security;
alter table public.receipts enable row level security;

create or replace function public.current_user_owns_merchant(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.merchants
    where merchants.id = p_merchant_id
      and merchants.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_public_payable_request_for_merchant(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.payment_requests
    where payment_requests.merchant_id = p_merchant_id
      and payment_requests.status in ('pending', 'paid')
      and (
        payment_requests.expires_at is null
        or payment_requests.expires_at > now()
        or payment_requests.status = 'paid'
      )
  );
$$;

revoke all on function public.current_user_owns_merchant(uuid) from public;
grant execute on function public.current_user_owns_merchant(uuid) to authenticated;

revoke all on function public.has_public_payable_request_for_merchant(uuid) from public;
grant execute on function public.has_public_payable_request_for_merchant(uuid) to anon, authenticated;

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
using (public.current_user_owns_merchant(products.merchant_id))
with check (public.current_user_owns_merchant(products.merchant_id));

drop policy if exists "payment_requests_crud_own" on public.payment_requests;
drop policy if exists "payment_requests_select_own" on public.payment_requests;
drop policy if exists "payment_requests_insert_own" on public.payment_requests;

create policy "payment_requests_select_own"
on public.payment_requests
for select
to authenticated
using (public.current_user_owns_merchant(payment_requests.merchant_id));

create policy "payment_requests_insert_own"
on public.payment_requests
for insert
to authenticated
with check (public.current_user_owns_merchant(payment_requests.merchant_id));

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using (public.current_user_owns_merchant(transactions.merchant_id));

drop policy if exists "receipts_select_own" on public.receipts;
create policy "receipts_select_own"
on public.receipts
for select
to authenticated
using (public.current_user_owns_merchant(receipts.merchant_id));

drop policy if exists "public_select_payment_request_merchant_name" on public.merchants;
create policy "public_select_payment_request_merchant_name"
on public.merchants
for select
to anon
using (public.has_public_payable_request_for_merchant(merchants.id));

drop policy if exists "public_select_payable_payment_requests" on public.payment_requests;
create policy "public_select_payable_payment_requests"
on public.payment_requests
for select
to anon
using (
  status in ('pending', 'paid')
  and (expires_at is null or expires_at > now() or status = 'paid')
);

-- No anon insert/update/delete policies exist. Payment status changes are reserved
-- for server-side service-role verification via mark_payment_paid.
