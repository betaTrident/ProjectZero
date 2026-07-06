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
