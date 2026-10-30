begin;
create table public.course_manual_access (
 user_id uuid not null references auth.users(id),
 course_id text not null check(course_id='build-with-codex'),
 active boolean not null,
 reason text not null check(length(trim(reason)) between 1 and 500),
 updated_at timestamptz not null default now(),
 primary key(user_id,course_id)
);
create table public.course_access_audit (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id),
 active boolean not null,
 reason text not null,
 actor text not null,
 created_at timestamptz not null default now()
);
alter table public.course_manual_access enable row level security;
alter table public.course_access_audit enable row level security;
revoke all on public.course_manual_access,public.course_access_audit from public,anon,authenticated;
-- Deliberately restricted to the database owner in SQL Editor, not a public RPC.
create function public.set_manual_course_access(p_email text,p_active boolean,p_reason text)
returns table(student_id uuid,access_active boolean) language plpgsql security definer set search_path='' as $$
declare target uuid; enabled boolean;
begin
 if p_active is null or p_reason is null or length(trim(p_reason)) not between 1 and 500 then raise exception 'Specify grant/revoke and a reason (1–500 characters)'; end if;
 select id into strict target from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null;
 perform pg_advisory_xact_lock(hashtextextended(target::text,0));
 insert into public.course_manual_access(user_id,course_id,active,reason) values(target,'build-with-codex',p_active,trim(p_reason)) on conflict(user_id,course_id) do update set active=excluded.active,reason=excluded.reason,updated_at=now();
 enabled := p_active or exists(select 1 from public.course_orders where user_id=target and course_id='build-with-codex' and status='paid');
 insert into public.course_enrollments(user_id,course_id,active) values(target,'build-with-codex',enabled) on conflict(user_id,course_id) do update set active=excluded.active;
 insert into public.course_access_audit(user_id,active,reason,actor) values(target,p_active,trim(p_reason),session_user);
 return query select target,enabled;
exception when no_data_found then raise exception 'No confirmed student with this email. Ask them to register and confirm their email first.';
end;
$$;
revoke all on function public.set_manual_course_access(text,boolean,text) from public,anon,authenticated,service_role;
create or replace function public.refund_course_order(p_provider text, p_charge_id text)
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
 if not exists(select 1 from public.course_orders where user_id=o.user_id and course_id=o.course_id and status='paid') and not exists(select 1 from public.course_manual_access where user_id=o.user_id and course_id=o.course_id and active) then
 update public.course_enrollments set active=false where user_id=o.user_id and course_id=o.course_id;
 end if;
end;
$$;

commit;
