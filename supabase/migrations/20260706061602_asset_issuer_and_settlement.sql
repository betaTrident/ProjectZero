alter table public.payment_requests
  add column if not exists asset_issuer text;

alter table public.payment_requests
  drop constraint if exists payment_requests_asset_issuer_check;

alter table public.payment_requests
  add constraint payment_requests_asset_issuer_check
  check (
    (asset_code = 'XLM' and asset_issuer is null)
    or
    (asset_code <> 'XLM' and asset_issuer ~ '^G[A-Z2-7]{55}$')
  );

alter table public.transactions
  add column if not exists asset_issuer text;

grant select, insert, update, delete on public.payment_requests to service_role;
grant select, insert on public.transactions to service_role;

create or replace function public.mark_payment_paid(
  p_request_id uuid,
  p_tx_hash text,
  p_payload jsonb default '{}'::jsonb
)
returns public.payment_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_request public.payment_requests;
begin
  update public.payment_requests
  set status = 'paid',
      paid_at = now(),
      updated_at = now()
  where id = p_request_id
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  returning * into paid_request;

  if paid_request.id is null then
    raise exception 'payment request is not payable'
      using errcode = 'P0001';
  end if;

  insert into public.transactions (
    payment_request_id,
    merchant_id,
    stellar_tx_hash,
    destination_wallet,
    amount,
    asset_code,
    asset_issuer,
    raw_payload
  )
  values (
    paid_request.id,
    paid_request.merchant_id,
    p_tx_hash,
    paid_request.stellar_destination,
    paid_request.amount,
    paid_request.asset_code,
    paid_request.asset_issuer,
    p_payload
  );

  return paid_request;
end;
$$;

revoke all on function public.mark_payment_paid(uuid, text, jsonb) from public;
revoke all on function public.mark_payment_paid(uuid, text, jsonb) from anon;
revoke all on function public.mark_payment_paid(uuid, text, jsonb) from authenticated;
grant execute on function public.mark_payment_paid(uuid, text, jsonb) to service_role;
