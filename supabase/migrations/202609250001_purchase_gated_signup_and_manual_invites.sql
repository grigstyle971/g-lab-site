begin;

-- Keep the paid-only lesson gate intact even if the legacy workspace setup is
-- reapplied or an older database missed the follow-up Gumroad migration.
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

-- A buyer can create an account only after a verified Gumroad sale has been
-- queued for the receipt email. The owner can reserve the same path manually.
create table public.course_manual_access_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (
    length(trim(email)) between 3 and 254
    and email = lower(trim(email))
  ),
  active boolean not null default true,
  reason text not null check (length(trim(reason)) between 1 and 500),
  granted_by uuid not null references auth.users(id),
  claimed_user_id uuid references auth.users(id),
  claimed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index course_manual_access_invites_ready_idx
  on public.course_manual_access_invites (email)
  where active and claimed_at is null and revoked_at is null;

create table public.course_manual_access_invite_audit (
  id bigint generated always as identity primary key,
  email text not null,
  active boolean not null,
  reason text not null,
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.course_manual_access_invites enable row level security;
alter table public.course_manual_access_invite_audit enable row level security;
revoke all on public.course_manual_access_invites,
  public.course_manual_access_invite_audit from public, anon, authenticated;
grant all on public.course_manual_access_invites,
  public.course_manual_access_invite_audit to service_role;

create function public.course_account_signup_allowed(p_buyer_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_buyer_email is not null
    and length(trim(p_buyer_email)) between 3 and 254
    and (
      exists (
        select 1
        from public.gumroad_pending_course_purchases p
        where p.buyer_email = lower(trim(p_buyer_email))
          and p.amount = 4900
          and p.currency = 'usd'
          and p.claimed_at is null
          and p.revoked_at is null
          and exists (
            select 1 from public.gumroad_ping_queue q
            where q.sale_id = p.sale_id and q.resource_name = 'sale'
          )
          and not exists (
            select 1 from public.gumroad_ping_queue q
            where q.sale_id = p.sale_id
              and q.resource_name in ('refund', 'dispute')
          )
      )
      or exists (
        select 1 from public.course_manual_access_invites i
        where i.email = lower(trim(p_buyer_email))
          and i.active
          and i.claimed_at is null
          and i.revoked_at is null
      )
      or exists (
        select 1
        from auth.users u
        join public.course_enrollments e on e.user_id = u.id
        where lower(u.email) = lower(trim(p_buyer_email))
          and u.email_confirmed_at is not null
          and e.course_id = 'build-with-codex'
          and e.active
      )
    );
$$;
revoke all on function public.course_account_signup_allowed(text)
  from public, anon, authenticated;
grant execute on function public.course_account_signup_allowed(text)
  to service_role;

create function public.claim_course_manual_access_invite(p_buyer_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text;
  buyer uuid;
  invitation public.course_manual_access_invites;
begin
  if p_buyer_email is null or length(trim(p_buyer_email)) not between 3 and 254 then
    raise exception 'Invalid buyer email';
  end if;
  normalized_email := lower(trim(p_buyer_email));

  select u.id into buyer
  from auth.users u
  where lower(u.email) = normalized_email
    and u.email_confirmed_at is not null;
  if buyer is null then return false; end if;

  perform pg_advisory_xact_lock(
    hashtextextended('manual-course-access:' || normalized_email, 0)
  );
  select * into invitation
  from public.course_manual_access_invites i
  where i.email = normalized_email
    and i.active
    and i.claimed_at is null
    and i.revoked_at is null
  for update;
  if not found then return false; end if;

  insert into public.course_manual_access(user_id, course_id, active, reason)
  values (buyer, 'build-with-codex', true, invitation.reason)
  on conflict (user_id, course_id) do update
    set active = true, reason = excluded.reason, updated_at = now();
  insert into public.course_enrollments(user_id, course_id, active)
  values (buyer, 'build-with-codex', true)
  on conflict (user_id, course_id) do update set active = true;
  insert into public.course_access_audit(user_id, active, reason, actor)
  values (
    buyer,
    true,
    invitation.reason,
    'owner:' || invitation.granted_by::text
  );
  update public.course_manual_access_invites
  set claimed_user_id = buyer, claimed_at = now(), updated_at = now()
  where id = invitation.id;
  return true;
end;
$$;
revoke all on function public.claim_course_manual_access_invite(text)
  from public, anon, authenticated;
grant execute on function public.claim_course_manual_access_invite(text)
  to service_role;

drop function public.owner_set_course_access(text, boolean, text);

create function public.owner_set_course_access(
  p_email text,
  p_active boolean,
  p_reason text
)
returns table(
  student_id uuid,
  access_active boolean,
  registration_pending boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  normalized_email text;
  actor_email text;
  target uuid;
  enabled boolean;
begin
  if actor_id is null or not public.course_is_owner() then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  if p_email is null or length(trim(p_email)) not between 3 and 254
    or p_reason is null or length(trim(p_reason)) not between 1 and 500
    or p_active is null then
    raise exception 'Specify a valid email, grant or revoke, and a reason';
  end if;
  normalized_email := lower(trim(p_email));
  select lower(u.email) into actor_email from auth.users u where u.id = actor_id;

  select u.id into target
  from auth.users u
  where lower(u.email) = normalized_email
    and u.email_confirmed_at is not null
  limit 1;

  if target is not null then
    perform pg_advisory_xact_lock(hashtextextended(target::text, 0));
    insert into public.course_manual_access(user_id, course_id, active, reason)
    values (target, 'build-with-codex', p_active, trim(p_reason))
    on conflict (user_id, course_id) do update
      set active = excluded.active, reason = excluded.reason, updated_at = now();
    enabled := p_active or exists (
      select 1 from public.course_orders o
      where o.user_id = target
        and o.course_id = 'build-with-codex'
        and o.status = 'paid'
    );
    insert into public.course_enrollments(user_id, course_id, active)
    values (target, 'build-with-codex', enabled)
    on conflict (user_id, course_id) do update set active = excluded.active;
    insert into public.course_access_audit(user_id, active, reason, actor)
    values (target, p_active, trim(p_reason), coalesce(actor_email, actor_id::text));
    update public.course_manual_access_invites
    set active = false,
        claimed_user_id = case when p_active then target else claimed_user_id end,
        claimed_at = case when p_active then coalesce(claimed_at, now()) else claimed_at end,
        revoked_at = case when p_active then revoked_at else now() end,
        updated_at = now()
    where email = normalized_email and claimed_at is null;
    insert into public.course_manual_access_invite_audit(email, active, reason, actor_id)
    values (normalized_email, p_active, trim(p_reason), actor_id);
    return query select target, enabled, false;
    return;
  end if;

  if p_active then
    insert into public.course_manual_access_invites(
      email, active, reason, granted_by, claimed_user_id, claimed_at,
      revoked_at, created_at, updated_at
    ) values (
      normalized_email, true, trim(p_reason), actor_id, null, null,
      null, now(), now()
    )
    on conflict (email) do update set
      active = true,
      reason = excluded.reason,
      granted_by = actor_id,
      claimed_user_id = null,
      claimed_at = null,
      revoked_at = null,
      updated_at = now();
    insert into public.course_manual_access_invite_audit(email, active, reason, actor_id)
    values (normalized_email, true, trim(p_reason), actor_id);
    return query select null::uuid, true, true;
    return;
  end if;

  update public.course_manual_access_invites
  set active = false, reason = trim(p_reason), revoked_at = now(), updated_at = now()
  where email = normalized_email and claimed_at is null;
  insert into public.course_manual_access_invite_audit(email, active, reason, actor_id)
  values (normalized_email, false, trim(p_reason), actor_id);
  return query select null::uuid, false, false;
end;
$$;
revoke all on function public.owner_set_course_access(text, boolean, text)
  from public, anon;
grant execute on function public.owner_set_course_access(text, boolean, text)
  to authenticated;

create or replace function public.owner_course_students(
  p_search text default '',
  p_after uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not public.course_is_owner() then
    raise exception 'Owner required' using errcode = '42501';
  end if;
  with all_students as (
    select
      u.id,
      u.email,
      (u.email_confirmed_at is not null) as confirmed,
      coalesce(e.active, false) as active,
      coalesce(m.active, false) as manual_access,
      exists (
        select 1 from public.course_orders o
        where o.user_id = u.id
          and o.course_id = 'build-with-codex'
          and o.status = 'paid'
      ) as paid_access,
      (select count(*) from public.course_progress p where p.user_id = u.id) as completed,
      e.created_at as access_since,
      m.updated_at as manual_updated_at,
      m.reason,
      false as pending_registration
    from auth.users u
    left join public.course_enrollments e
      on e.user_id = u.id and e.course_id = 'build-with-codex'
    left join public.course_manual_access m
      on m.user_id = u.id and m.course_id = 'build-with-codex'
    where position(lower(left(coalesce(p_search, ''), 254)) in lower(coalesce(u.email, ''))) > 0

    union all

    select
      i.id,
      i.email,
      false as confirmed,
      false as active,
      true as manual_access,
      false as paid_access,
      0::bigint as completed,
      null::timestamptz as access_since,
      i.updated_at as manual_updated_at,
      i.reason,
      true as pending_registration
    from public.course_manual_access_invites i
    where i.active and i.claimed_at is null and i.revoked_at is null
      and position(lower(left(coalesce(p_search, ''), 254)) in lower(i.email)) > 0
  )
  select coalesce(jsonb_agg(to_jsonb(page_row)), '[]'::jsonb)
  into result
  from (
    select * from all_students s
    where p_after is null or s.id > p_after
    order by s.id
    limit 51
  ) page_row;
  return result;
end;
$$;
revoke all on function public.owner_course_students(text, uuid)
  from public, anon;
grant execute on function public.owner_course_students(text, uuid)
  to authenticated;

commit;
