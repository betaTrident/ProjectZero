begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (id, email, role, aud)
values
  ('00000000-0000-4000-8000-000000000001', 'merchant-a@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-000000000002', 'merchant-b@example.test', 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.merchants (id, user_id, business_name, stellar_public_key)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Merchant A',
    'GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    'Merchant B',
    'GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4'
  )
on conflict (id) do nothing;

insert into public.payment_requests (
  id,
  merchant_id,
  title,
  amount,
  asset_code,
  status,
  stellar_destination,
  memo,
  expires_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Merchant A invoice',
    5.00,
    'XLM',
    'pending',
    'GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4',
    'ZERO-A-RLS',
    now() + interval '1 hour'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'Merchant B invoice',
    7.00,
    'XLM',
    'pending',
    'GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4',
    'ZERO-B-RLS',
    now() + interval '1 hour'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'Expired invoice',
    9.00,
    'XLM',
    'pending',
    'GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4',
    'ZERO-A-EXP',
    now() - interval '1 minute'
  )
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (
    select count(*)::int
    from public.payment_requests
    where merchant_id = '10000000-0000-4000-8000-000000000002'
  ),
  0,
  'merchant A cannot read merchant B payment requests'
);

reset role;

select lives_ok(
  $$
    select public.mark_payment_paid(
      '20000000-0000-4000-8000-000000000001',
      repeat('a', 64),
      '{"verified_at":"2026-01-01T00:00:00.000Z"}'::jsonb
    )
  $$,
  'mark_payment_paid settles a pending payable request'
);

select is(
  (
    select status
    from public.payment_requests
    where id = '20000000-0000-4000-8000-000000000001'
  ),
  'paid',
  'mark_payment_paid flips pending request to paid'
);

select is(
  (
    select count(*)::int
    from public.transactions
    where payment_request_id = '20000000-0000-4000-8000-000000000001'
      and stellar_tx_hash = repeat('a', 64)
  ),
  1,
  'mark_payment_paid inserts one transaction record'
);

select is(
  (
    select count(*)::int
    from public.payment_requests
    where status = 'pending'
      and expires_at is not null
      and expires_at < now()
  ),
  1,
  'expiry job predicate selects stale pending invoices'
);

select * from finish();

rollback;
