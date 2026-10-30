begin;

-- A sale can arrive before the buyer has an account. Keep the verified sale
-- private until its receipt email is confirmed in G-lab.
create table public.gumroad_pending_course_purchases (
  sale_id text primary key check (length(trim(sale_id)) between 1 and 180),
  buyer_email text not null check (length(buyer_email) between 3 and 320),
  amount bigint not null check (amount = 4900),
  currency text not null check (currency = 'usd'),
  received_at timestamptz not null default now(),
  claimed_at timestamptz,
  revoked_at timestamptz
);

create index gumroad_pending_course_purchases_email_idx
  on public.gumroad_pending_course_purchases (buyer_email, received_at)
  where claimed_at is null and revoked_at is null;

alter table public.gumroad_pending_course_purchases enable row level security;
revoke all on public.gumroad_pending_course_purchases from public, anon, authenticated;
grant all on public.gumroad_pending_course_purchases to service_role;

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
  normalized_email text;
  existing_order public.course_orders;
  pending public.gumroad_pending_course_purchases;
  v_order_id uuid;
begin
  if p_sale_id is null or length(trim(p_sale_id)) not between 1 and 180 then
    raise exception 'Invalid Gumroad sale ID';
  end if;
  if p_event_id is null or length(trim(p_event_id)) not between 1 and 220
    or p_event_id <> ('sale:' || p_sale_id) then
    raise exception 'Invalid Gumroad sale event';
  end if;
  if p_buyer_email is null or length(trim(p_buyer_email)) not between 3 and 320 then
    raise exception 'Invalid buyer email';
  end if;
  if p_amount <> 4900 or lower(p_currency) <> 'usd' then
    raise exception 'Gumroad course price mismatch';
  end if;

  normalized_email := lower(trim(p_buyer_email));
  perform pg_advisory_xact_lock(hashtextextended('gumroad-sale:' || p_sale_id, 0));

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

  select * into pending
  from public.gumroad_pending_course_purchases
  where sale_id = p_sale_id
  for update;
  if found and pending.buyer_email <> normalized_email then
    raise exception 'Gumroad sale email does not match pending purchase';
  end if;

  select u.id into buyer
  from auth.users u
  where lower(u.email) = normalized_email
    and u.email_confirmed_at is not null;

  if buyer is null then
    insert into public.gumroad_pending_course_purchases(
      sale_id, buyer_email, amount, currency
    ) values (
      p_sale_id, normalized_email, p_amount, lower(p_currency)
    ) on conflict (sale_id) do nothing;
    update public.gumroad_ping_queue
    set status = 'processed', processed_at = now(), last_error = null
    where sale_id = p_sale_id and resource_name = 'sale';
    return;
  end if;

  if pending.revoked_at is not null then
    raise exception 'Gumroad sale was revoked before account claim';
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
  update public.gumroad_pending_course_purchases
  set claimed_at = coalesce(claimed_at, now())
  where sale_id = p_sale_id;
  update public.gumroad_ping_queue
  set status = 'processed', processed_at = now(), last_error = null
  where sale_id = p_sale_id and resource_name = 'sale';
end;
$$;

revoke all on function public.fulfill_gumroad_course_order(text, text, text, bigint, text)
  from public, anon, authenticated;
grant execute on function public.fulfill_gumroad_course_order(text, text, text, bigint, text)
  to service_role;

create or replace function public.claim_gumroad_pending_course_purchases(
  p_buyer_email text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  buyer uuid;
  normalized_email text;
  sale text;
  pending public.gumroad_pending_course_purchases;
  existing_order public.course_orders;
  v_order_id uuid;
  claimed integer := 0;
begin
  if p_buyer_email is null or length(trim(p_buyer_email)) not between 3 and 320 then
    raise exception 'Invalid buyer email';
  end if;
  normalized_email := lower(trim(p_buyer_email));
  select u.id into buyer
  from auth.users u
  where lower(u.email) = normalized_email
    and u.email_confirmed_at is not null;
  if buyer is null then
    raise exception 'A confirmed account for this email is required';
  end if;

  -- Use the same per-sale lock order as fulfillment and revocation handlers.
  for sale in
    select p.sale_id
    from public.gumroad_pending_course_purchases p
    where p.buyer_email = normalized_email
      and p.claimed_at is null
      and p.revoked_at is null
    order by p.received_at, p.sale_id
  loop
    perform pg_advisory_xact_lock(hashtextextended('gumroad-sale:' || sale, 0));
    select * into pending
    from public.gumroad_pending_course_purchases
    where sale_id = sale
    for update;
    if not found or pending.claimed_at is not null or pending.revoked_at is not null then
      continue;
    end if;
    if pending.buyer_email <> normalized_email
      or pending.amount <> 4900 or pending.currency <> 'usd' then
      raise exception 'Pending Gumroad purchase does not match account';
    end if;
    if not exists (
      select 1 from public.gumroad_ping_queue
      where sale_id = sale and resource_name = 'sale'
    ) then
      raise exception 'Gumroad sale Ping is missing';
    end if;
    if exists (
      select 1 from public.gumroad_ping_queue
      where sale_id = sale and resource_name in ('refund', 'dispute')
    ) then
      update public.gumroad_pending_course_purchases
      set revoked_at = coalesce(revoked_at, now())
      where sale_id = sale;
      continue;
    end if;

    select * into existing_order
    from public.course_orders
    where provider = 'gumroad' and provider_payment_id = sale
    for update;
    if found then
      if existing_order.user_id <> buyer
        or existing_order.course_id <> 'build-with-codex'
        or existing_order.amount <> pending.amount
        or existing_order.currency <> pending.currency then
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
        buyer, 'build-with-codex', 'gumroad', pending.amount, pending.currency, 'paid',
        sale, sale, now()
      ) returning id into v_order_id;
    end if;

    if exists (
      select 1 from public.course_payment_events
      where provider = 'gumroad' and event_id = ('sale:' || sale) and order_id <> v_order_id
    ) then
      raise exception 'Gumroad sale event already belongs to another order';
    end if;
    insert into public.course_payment_events(provider, event_id, order_id)
    values ('gumroad', 'sale:' || sale, v_order_id)
    on conflict do nothing;
    update public.course_orders
    set status = 'paid', provider_charge_id = sale, paid_at = coalesce(paid_at, now())
    where id = v_order_id;
    insert into public.course_enrollments(user_id, course_id, active)
    values (buyer, 'build-with-codex', true)
    on conflict (user_id, course_id) do update set active = true;
    update public.gumroad_pending_course_purchases
    set claimed_at = now()
    where sale_id = sale;
    update public.gumroad_ping_queue
    set status = 'processed', processed_at = now(), last_error = null
    where sale_id = sale and resource_name = 'sale';
    claimed := claimed + 1;
  end loop;
  return claimed;
end;
$$;

revoke all on function public.claim_gumroad_pending_course_purchases(text)
  from public, anon, authenticated;
grant execute on function public.claim_gumroad_pending_course_purchases(text)
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

  update public.gumroad_pending_course_purchases
  set revoked_at = coalesce(revoked_at, now())
  where sale_id = p_sale_id;
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

-- No lesson is publicly available as a trial. The route, workspace API and
-- progress-write policy all use this database-side entitlement check.
create or replace function public.course_can_study(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.course_enrollments
      where user_id = auth.uid()
        and course_id = 'build-with-codex'
        and active
    );
$$;
revoke all on function public.course_can_study(text) from public, anon;
grant execute on function public.course_can_study(text) to authenticated;

drop policy if exists progress_insert_own on public.course_progress;
create policy progress_insert_own on public.course_progress
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.course_can_study(lesson_slug)
  );

commit;
