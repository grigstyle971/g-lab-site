begin;

alter table public.course_orders
  drop constraint if exists course_orders_provider_check;
alter table public.course_orders
  add constraint course_orders_provider_check
  check (provider in ('stripe', 'prodamus', 'gumroad'));

-- Persist every sale/refund Ping before acknowledging Gumroad. The API lookup
-- and entitlement update then run after the response and can be reconciled.
create table public.gumroad_ping_queue (
  sale_id text not null check (length(trim(sale_id)) between 1 and 180),
  resource_name text not null check (resource_name in ('sale', 'refund', 'dispute')),
  status text not null default 'queued' check (status in ('queued', 'processed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text check (last_error is null or length(last_error) <= 120),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  primary key (sale_id, resource_name)
);

create index gumroad_ping_queue_due_idx
  on public.gumroad_ping_queue (next_attempt_at, received_at)
  where status = 'queued';

alter table public.gumroad_ping_queue enable row level security;
revoke all on public.gumroad_ping_queue from public, anon, authenticated;
grant all on public.gumroad_ping_queue to service_role;

create or replace function public.fulfill_gumroad_course_order(
  p_sale_id text,
  p_event_id text,
  p_buyer_email text,
  p_amount bigint,
  p_currency text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  buyer uuid;
  existing_order public.course_orders;
  v_order_id uuid;
begin
  if p_sale_id is null or length(trim(p_sale_id)) not between 1 and 180 then
    raise exception 'Invalid Gumroad sale ID';
  end if;
  if p_event_id is null or length(trim(p_event_id)) not between 1 and 220 then
    raise exception 'Invalid Gumroad event ID';
  end if;
  if p_event_id <> ('sale:' || p_sale_id) then
    raise exception 'Invalid Gumroad sale event';
  end if;
  if p_buyer_email is null or length(trim(p_buyer_email)) not between 3 and 320 then
    raise exception 'Invalid buyer email';
  end if;
  if p_amount <> 4900 or lower(p_currency) <> 'usd' then
    raise exception 'Gumroad course price mismatch';
  end if;

  select u.id into buyer
  from auth.users u
  where lower(u.email) = lower(trim(p_buyer_email))
    and u.email_confirmed_at is not null;
  if buyer is null then
    raise exception 'No confirmed G-lab account for Gumroad buyer email';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('gumroad-sale:' || p_sale_id, 0));
  perform pg_advisory_xact_lock(hashtextextended(buyer::text, 0));
  if exists (
    select 1 from public.gumroad_ping_queue
    where sale_id = p_sale_id and resource_name in ('refund', 'dispute')
  ) then
    raise exception 'Gumroad sale has a revocation Ping';
  end if;
  if not exists (
    select 1 from public.gumroad_ping_queue
    where sale_id = p_sale_id and resource_name = 'sale'
  ) then
    raise exception 'Gumroad sale Ping is missing';
  end if;
  select * into existing_order
  from public.course_orders
  where provider = 'gumroad' and provider_payment_id = p_sale_id
  for update;

  if found then
    if existing_order.user_id <> buyer
      or existing_order.course_id <> 'build-with-codex'
      or existing_order.amount <> p_amount
      or existing_order.currency <> lower(p_currency) then
      raise exception 'Gumroad sale does not match existing order';
    end if;
    if existing_order.status = 'refunded' then
      raise exception 'Gumroad order was already refunded';
    end if;
    v_order_id := existing_order.id;
  else
    insert into public.course_orders(
      user_id, course_id, provider, amount, currency, status,
      provider_payment_id, provider_charge_id, paid_at
    ) values (
      buyer, 'build-with-codex', 'gumroad', p_amount, lower(p_currency), 'paid',
      p_sale_id, p_sale_id, now()
    ) returning id into v_order_id;
  end if;

  if exists (
    select 1 from public.course_payment_events
    where provider = 'gumroad' and event_id = p_event_id and order_id <> v_order_id
  ) then
    raise exception 'Gumroad event already belongs to another order';
  end if;

  insert into public.course_payment_events(provider, event_id, order_id)
  values ('gumroad', p_event_id, v_order_id)
  on conflict do nothing;
  update public.course_orders
  set status = 'paid', provider_charge_id = p_sale_id, paid_at = coalesce(paid_at, now())
  where id = v_order_id;
  insert into public.course_enrollments(user_id, course_id, active)
  values (buyer, 'build-with-codex', true)
  on conflict (user_id, course_id) do update set active = true;
  update public.gumroad_ping_queue
  set status = 'processed', processed_at = now(), last_error = null
  where sale_id = p_sale_id and resource_name = 'sale';
end;
$$;

revoke all on function public.fulfill_gumroad_course_order(text, text, text, bigint, text)
  from public, anon, authenticated;
grant execute on function public.fulfill_gumroad_course_order(text, text, text, bigint, text)
  to service_role;

create or replace function public.process_gumroad_revocation_ping(
  p_sale_id text,
  p_resource text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_sale_id is null or length(trim(p_sale_id)) not between 1 and 180 then
    raise exception 'Invalid Gumroad sale ID';
  end if;
  if p_resource not in ('sale', 'refund', 'dispute') then
    raise exception 'Invalid Gumroad resource';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('gumroad-sale:' || p_sale_id, 0));
  if not exists (
    select 1 from public.gumroad_ping_queue
    where sale_id = p_sale_id and resource_name = p_resource
  ) then
    raise exception 'Gumroad Ping is missing';
  end if;

  update public.gumroad_ping_queue
  set status = 'processed', processed_at = now(), last_error = null
  where sale_id = p_sale_id and resource_name = p_resource;

  if exists (
    select 1 from public.course_orders
    where provider = 'gumroad' and provider_payment_id = p_sale_id
  ) then
    perform public.refund_course_order('gumroad', p_sale_id);
  end if;
end;
$$;

revoke all on function public.process_gumroad_revocation_ping(text, text)
  from public, anon, authenticated;
grant execute on function public.process_gumroad_revocation_ping(text, text)
  to service_role;

commit;
