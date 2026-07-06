create extension if not exists pg_cron with schema extensions;

create index if not exists payment_requests_pending_expiry_idx
  on public.payment_requests(expires_at)
  where status = 'pending' and expires_at is not null;

select cron.unschedule(jobid)
from cron.job
where jobname = 'expire-pending-invoices';

select cron.schedule(
  'expire-pending-invoices',
  '*/5 * * * *',
  $$
    update public.payment_requests
    set status = 'expired',
        updated_at = now()
    where status = 'pending'
      and expires_at is not null
      and expires_at < now();
  $$
);
