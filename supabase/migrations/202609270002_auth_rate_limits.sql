create table public.g_lab_auth_rate_limit_buckets (
  scope text not null check (scope in (
    'auth-api-ip',
    'signin-ip',
    'signin-email',
    'verify-ip',
    'verify-email',
    'send-ip',
    'send-email',
    'password-ip'
  )),
  subject_hash text not null check (subject_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  primary key (scope, subject_hash, window_started_at)
);

create index g_lab_auth_rate_limit_expiry_idx
  on public.g_lab_auth_rate_limit_buckets (window_started_at);

alter table public.g_lab_auth_rate_limit_buckets enable row level security;
revoke all on public.g_lab_auth_rate_limit_buckets from public, anon, authenticated;
grant all on public.g_lab_auth_rate_limit_buckets to service_role;

create function public.consume_g_lab_auth_rate_limit(
  p_scope text,
  p_subject_hash text
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_window_seconds integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_started_at timestamptz;
  v_attempt_count integer;
  v_retry_after_seconds integer;
begin
  case p_scope
    when 'auth-api-ip' then v_limit := 60; v_window_seconds := 600;
    when 'signin-ip' then v_limit := 12; v_window_seconds := 900;
    when 'signin-email' then v_limit := 8; v_window_seconds := 900;
    when 'verify-ip' then v_limit := 20; v_window_seconds := 900;
    when 'verify-email' then v_limit := 8; v_window_seconds := 900;
    when 'send-ip' then v_limit := 12; v_window_seconds := 3600;
    when 'send-email' then v_limit := 3; v_window_seconds := 3600;
    when 'password-ip' then v_limit := 20; v_window_seconds := 900;
    else raise exception 'Unknown authentication rate limit scope';
  end case;

  if p_subject_hash is null or p_subject_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid authentication rate limit key';
  end if;

  v_window_started_at := pg_catalog.date_bin(
    pg_catalog.make_interval(secs => v_window_seconds),
    v_now,
    timestamptz 'epoch'
  );

  insert into public.g_lab_auth_rate_limit_buckets as current_bucket (
    scope,
    subject_hash,
    window_started_at,
    attempt_count
  ) values (
    p_scope,
    p_subject_hash,
    v_window_started_at,
    1
  )
  on conflict (scope, subject_hash, window_started_at)
  do update set attempt_count = least(
    current_bucket.attempt_count + 1,
    v_limit + 1
  )
  returning attempt_count into v_attempt_count;

  -- One request at a time removes counters that can no longer affect a limit.
  if pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended('g-lab-auth-rate-limit-cleanup', 0)
  ) then
    delete from public.g_lab_auth_rate_limit_buckets
    where window_started_at < v_now - interval '24 hours';
  end if;

  v_retry_after_seconds := greatest(
    1,
    pg_catalog.ceil(extract(epoch from (
      v_window_started_at + pg_catalog.make_interval(secs => v_window_seconds) - v_now
    )))::integer
  );

  return query select v_attempt_count <= v_limit, v_retry_after_seconds;
end;
$$;

revoke all on function public.consume_g_lab_auth_rate_limit(text, text)
  from public, anon, authenticated;
grant execute on function public.consume_g_lab_auth_rate_limit(text, text)
  to service_role;
