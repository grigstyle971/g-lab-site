begin;
-- Pin the existing confirmed owner account by ID, not editable profile metadata.
create table public.course_access_owner (
 user_id uuid primary key references auth.users(id)
);
alter table public.course_access_owner enable row level security;
revoke all on public.course_access_owner from public,anon,authenticated;
insert into public.course_access_owner(user_id)
select id from auth.users
where lower(email)='grigstyle971@gmail.com' and email_confirmed_at is not null;
do $$ begin
 if (select count(*) from public.course_access_owner) <> 1 then
 raise exception 'Register and confirm grigstyle971@gmail.com before installing owner access';
 end if;
end $$;
create function public.owner_set_course_access(p_email text,p_active boolean,p_reason text)
returns table(student_id uuid,access_active boolean)
language plpgsql security definer set search_path='' as $$
declare actor_id uuid := auth.uid();
begin
 if actor_id is null or not exists(
 select 1 from public.course_access_owner o join auth.users u on u.id=o.user_id
 where o.user_id=actor_id and lower(u.email)='grigstyle971@gmail.com' and u.email_confirmed_at is not null
 ) then raise exception 'Owner access required' using errcode='42501'; end if;
 return query select * from public.set_manual_course_access(p_email,p_active,p_reason);
end;
$$;
revoke all on function public.owner_set_course_access(text,boolean,text) from public,anon;
grant execute on function public.owner_set_course_access(text,boolean,text) to authenticated;
commit;
