begin;
create function public.course_is_owner() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.course_access_owner o join auth.users u on u.id=o.user_id where o.user_id=auth.uid() and lower(u.email)='grigstyle971@gmail.com' and u.email_confirmed_at is not null);
$$;
revoke all on function public.course_is_owner() from public,anon;
grant execute on function public.course_is_owner() to authenticated;
create function public.course_can_study(p_slug text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.course_enrollments where user_id=auth.uid() and course_id='build-with-codex' and active);
$$;
revoke all on function public.course_can_study(text) from public,anon;
grant execute on function public.course_can_study(text) to authenticated;
create table public.course_notebooks(
 user_id uuid not null references auth.users(id),
 lesson_slug text not null check(lesson_slug in ('welcome','codex-workflow','project-context','editing-with-codex','github-account','github-repository','git-push','computer-workspace','vercel-first-deploy','responsive-hero','nextjs-foundation','environment-variables','supabase-project','supabase-auth','data-model','client-space')),
 content jsonb not null check(jsonb_typeof(content)='object' and octet_length(content::text)<=24000),
 revision integer not null default 1,
 updated_at timestamptz not null default now(),
 primary key(user_id,lesson_slug)
);
alter table public.course_notebooks enable row level security;
revoke all on public.course_notebooks from public,anon,authenticated;
grant select on public.course_notebooks to authenticated;
create policy notebook_read on public.course_notebooks for select to authenticated using(user_id=auth.uid() and public.course_can_study(lesson_slug));
create function public.save_course_notebook(p_slug text,p_content jsonb,p_revision integer)
returns integer language plpgsql security definer set search_path='' as $$
declare current_revision integer; new_revision integer;
begin
 if not public.course_can_study(p_slug) then raise exception 'Access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':notebook:' || p_slug,0));
 select revision into current_revision from public.course_notebooks where user_id=auth.uid() and lesson_slug=p_slug;
 if p_revision is null or p_revision<>coalesce(current_revision,0) then raise exception 'Newer version exists' using errcode='40001'; end if;
 new_revision:=coalesce(current_revision,0)+1;
 insert into public.course_notebooks(user_id,lesson_slug,content,revision) values(auth.uid(),p_slug,p_content,new_revision)
 on conflict(user_id,lesson_slug) do update set content=excluded.content,revision=excluded.revision,updated_at=now();
 return new_revision;
end; $$;
revoke all on function public.save_course_notebook(text,jsonb,integer) from public,anon;
grant execute on function public.save_course_notebook(text,jsonb,integer) to authenticated;
create table public.course_feedback(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 lesson_slug text not null check(lesson_slug in ('welcome','codex-workflow','project-context','editing-with-codex','github-account','github-repository','git-push','computer-workspace','vercel-first-deploy','responsive-hero','nextjs-foundation','environment-variables','supabase-project','supabase-auth','data-model','client-space')),
 step text not null check(length(step) between 1 and 120),
 message text not null check(length(message) between 5 and 2000),
 resolved boolean not null default false,created_at timestamptz not null default now()
);
alter table public.course_feedback enable row level security;
revoke all on public.course_feedback from public,anon,authenticated;
create function public.send_course_feedback(p_slug text,p_step text,p_message text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.course_can_study(p_slug) then raise exception 'Access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':feedback',0));
 if (select count(*) from public.course_feedback where user_id=auth.uid() and created_at>now()-interval '1 day')>=10 then raise exception 'Daily limit' using errcode='P0001'; end if;
 insert into public.course_feedback(user_id,lesson_slug,step,message) values(auth.uid(),p_slug,trim(p_step),trim(p_message));
end; $$;
revoke all on function public.send_course_feedback(text,text,text) from public,anon;
grant execute on function public.send_course_feedback(text,text,text) to authenticated;
create function public.owner_course_students(p_search text default '',p_after uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.course_is_owner() then raise exception 'Owner required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into result from (
 select u.id,u.email,u.email_confirmed_at is not null as confirmed,coalesce(e.active,false) as active,e.created_at as access_since,
 coalesce(m.active,false) as manual_access,m.updated_at as manual_updated_at,m.reason,
 exists(select 1 from public.course_orders o where o.user_id=u.id and o.status='paid' and o.course_id='build-with-codex') as paid_access,
 (select count(*) from public.course_progress p where p.user_id=u.id) as completed
 from auth.users u left join public.course_enrollments e on e.user_id=u.id and e.course_id='build-with-codex'
 left join public.course_manual_access m on m.user_id=u.id and m.course_id='build-with-codex'
 where (p_after is null or u.id>p_after) and position(lower(left(coalesce(p_search,''),254)) in lower(coalesce(u.email,'')))>0
 order by u.id limit 51) r;
 return result;
end; $$;
create function public.owner_course_feedback(p_resolved boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.course_is_owner() then raise exception 'Owner required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into result from(select f.*,u.email from public.course_feedback f join auth.users u on u.id=f.user_id where f.resolved=p_resolved order by f.created_at desc,f.id desc limit 50) r;
 return result;
end; $$;
create function public.owner_resolve_feedback(p_id uuid,p_resolved boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.course_is_owner() then raise exception 'Owner required' using errcode='42501'; end if;
 update public.course_feedback set resolved=p_resolved where id=p_id;
 if not found then raise exception 'Feedback not found'; end if;
end; $$;
revoke all on function public.owner_course_students(text,uuid),public.owner_course_feedback(boolean),public.owner_resolve_feedback(uuid,boolean) from public,anon;
grant execute on function public.owner_course_students(text,uuid),public.owner_course_feedback(boolean),public.owner_resolve_feedback(uuid,boolean) to authenticated;
commit;
