-- Merchants must not mutate settlement fields directly. Only service_role may
-- update payment_requests (via mark_payment_paid and expiry jobs).

revoke update, delete on public.payment_requests from authenticated;

drop policy if exists "payment_requests_crud_own" on public.payment_requests;

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
