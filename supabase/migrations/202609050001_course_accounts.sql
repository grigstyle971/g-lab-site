begin;
-- Run once in the intended Supabase project. Existing app tables are preserved.
create table public.course_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  course_id text not null check (course_id = 'build-with-codex'),
  provider text not null check (provider in ('stripe','prodamus')),
  amount bigint not null check (amount > 0),
  currency text not null check (currency in ('usd','rub')),
  status text not null default 'pending' check (status in ('pending','paid','refunded')),
  provider_payment_id text,
  provider_charge_id text,
  checkout_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique(provider, provider_payment_id)
);
create index course_orders_user_idx on public.course_orders(user_id, created_at desc);
create table public.course_enrollments (
  user_id uuid not null references auth.users(id),
  course_id text not null check (course_id = 'build-with-codex'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key(user_id, course_id)
);
create table public.course_payment_events (
  provider text not null,
  event_id text not null,
  order_id uuid not null references public.course_orders(id),
  created_at timestamptz not null default now(),
  primary key(provider, event_id)
);
create table public.course_progress (
  user_id uuid not null references auth.users(id),
  lesson_slug text not null check (lesson_slug in ('welcome','codex-workflow','project-context','editing-with-codex','github-account','github-repository','git-push','computer-workspace','vercel-first-deploy','responsive-hero','nextjs-foundation','environment-variables','supabase-project','supabase-auth','data-model','client-space')),
  completed_at timestamptz not null default now(),
  primary key(user_id, lesson_slug)
);
alter table public.course_orders enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.course_payment_events enable row level security;
alter table public.course_progress enable row level security;
revoke all on public.course_orders, public.course_enrollments, public.course_payment_events, public.course_progress from anon, authenticated;
grant select on public.course_orders, public.course_enrollments, public.course_progress to authenticated;
grant insert on public.course_progress to authenticated;
grant all on public.course_orders, public.course_enrollments, public.course_payment_events, public.course_progress to service_role;
create policy orders_read_own on public.course_orders for select to authenticated using ((select auth.uid()) = user_id);
create policy enrollment_read_own on public.course_enrollments for select to authenticated using ((select auth.uid()) = user_id);
create policy progress_read_own on public.course_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy progress_insert_own on public.course_progress for insert to authenticated with check (
 (select auth.uid()) = user_id and exists(select 1 from public.course_enrollments e where e.user_id = (select auth.uid()) and e.course_id = 'build-with-codex' and e.active)
);
-- Only a verified server webhook may call this function. A row lock makes retries atomic.
create function public.fulfill_course_order(p_order_id uuid, p_provider text, p_payment_id text, p_event_id text, p_amount bigint, p_currency text, p_charge_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.course_orders;
begin
 select * into o from public.course_orders where id = p_order_id;
 if found then
 perform pg_advisory_xact_lock(hashtextextended(o.user_id::text,0));
 select * into o from public.course_orders where id = p_order_id for update;
 end if;
 if not found then raise exception 'Unknown order'; end if;
 if o.provider <> p_provider or o.amount <> p_amount or o.currency <> p_currency then raise exception 'Payment mismatch'; end if;
 if p_payment_id is null or p_payment_id = '' or p_event_id is null or p_event_id = '' then raise exception 'Missing payment reference'; end if;
 if o.provider_payment_id is not null and o.provider_payment_id <> p_payment_id then raise exception 'Payment reference mismatch'; end if;
 if o.status = 'refunded' then raise exception 'Order was refunded'; end if;
 if exists(select 1 from public.course_payment_events where provider=p_provider and event_id=p_event_id and order_id<>p_order_id) then raise exception 'Event already belongs to another order'; end if;
 insert into public.course_payment_events(provider,event_id,order_id) values(p_provider,p_event_id,p_order_id) on conflict do nothing;
 update public.course_orders set status='paid', provider_payment_id=p_payment_id, provider_charge_id=coalesce(p_charge_id,provider_charge_id), paid_at=coalesce(paid_at,now()) where id=p_order_id;
 insert into public.course_enrollments(user_id,course_id,active) values(o.user_id,o.course_id,true) on conflict(user_id,course_id) do update set active=true;
end;
$$;
revoke all on function public.fulfill_course_order(uuid,text,text,text,bigint,text,text) from public, anon, authenticated;
grant execute on function public.fulfill_course_order(uuid,text,text,text,bigint,text,text) to service_role;
-- Full refunds revoke access only when no other paid order still grants it.
create function public.refund_course_order(p_provider text, p_charge_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.course_orders;
begin
 select * into o from public.course_orders where provider=p_provider and provider_charge_id=p_charge_id;
 if found then
 perform pg_advisory_xact_lock(hashtextextended(o.user_id::text,0));
 select * into o from public.course_orders where provider=p_provider and provider_charge_id=p_charge_id for update;
 end if;
 if not found then raise exception 'Unknown payment'; end if;
 update public.course_orders set status='refunded' where id=o.id;
 if not exists(select 1 from public.course_orders where user_id=o.user_id and course_id=o.course_id and status='paid') then
 update public.course_enrollments set active=false where user_id=o.user_id and course_id=o.course_id;
 end if;
end;
$$;
revoke all on function public.refund_course_order(text,text) from public, anon, authenticated;
grant execute on function public.refund_course_order(text,text) to service_role;
commit;
