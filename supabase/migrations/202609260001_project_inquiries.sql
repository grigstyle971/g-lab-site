begin;

create table public.project_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  project_type text not null check (project_type in ('website', 'landing', 'portal', 'automation', 'other')),
  summary text not null check (char_length(summary) between 3 and 3000),
  project_brief jsonb not null check (jsonb_typeof(project_brief) = 'object' and octet_length(project_brief::text) <= 10000),
  estimated_min_usd integer not null check (estimated_min_usd between 1 and 100000),
  estimated_max_usd integer not null check (estimated_max_usd between estimated_min_usd and 100000),
  timeline text not null check (char_length(timeline) between 1 and 80),
  budget_range text not null check (char_length(budget_range) between 1 and 80),
  locale text not null check (locale in ('en', 'ru')),
  requester_hash text not null check (requester_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'new' check (status in ('new', 'replied', 'closed'))
);

create index project_inquiries_created_idx on public.project_inquiries (created_at desc);
create index project_inquiries_requester_idx on public.project_inquiries (requester_hash, created_at desc);
alter table public.project_inquiries enable row level security;
revoke all on public.project_inquiries from public, anon, authenticated;

create function public.submit_project_inquiry(
  p_name text,
  p_email text,
  p_project_type text,
  p_summary text,
  p_project_brief jsonb,
  p_estimated_min_usd integer,
  p_estimated_max_usd integer,
  p_timeline text,
  p_budget_range text,
  p_locale text,
  p_requester_hash text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 120
    or char_length(trim(coalesce(p_email, ''))) not between 3 and 254
    or trim(coalesce(p_email, '')) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_project_type not in ('website', 'landing', 'portal', 'automation', 'other')
    or char_length(trim(coalesce(p_summary, ''))) not between 3 and 3000
    or p_project_brief is null
    or jsonb_typeof(p_project_brief) <> 'object'
    or octet_length(p_project_brief::text) > 10000
    or p_estimated_min_usd is null
    or p_estimated_max_usd is null
    or p_estimated_min_usd not between 1 and 100000
    or p_estimated_max_usd not between p_estimated_min_usd and 100000
    or char_length(trim(coalesce(p_project_brief ->> 'audience', ''))) not between 3 and 700
    or (case when jsonb_typeof(p_project_brief -> 'pages') = 'array'
      then jsonb_array_length(p_project_brief -> 'pages') between 1 and 12
        and (p_project_brief -> 'pages') <@ '["home","about","services","product","work","pricing","faq","contact","blog","account","other","unsure"]'::jsonb
      else false end) is not true
    or char_length(coalesce(p_project_brief ->> 'customPages', '')) > 500
    or (case when jsonb_typeof(p_project_brief -> 'features') = 'array'
      then jsonb_array_length(p_project_brief -> 'features') between 1 and 13
        and (p_project_brief -> 'features') <@ '["form","booking","payments","accounts","catalog","search","languages","cms","admin","analytics","integrations","other","unsure"]'::jsonb
      else false end) is not true
    or char_length(coalesce(p_project_brief ->> 'customFeatures', '')) > 500
    or coalesce(p_project_brief ->> 'visualStyle', '') not in ('minimal','premium','bold','cinematic','friendly','reference','unsure')
    or char_length(coalesce(p_project_brief ->> 'references', '')) > 1000
    or coalesce(p_project_brief ->> 'assets', '') not in ('ready','partial','need-help','unsure')
    or coalesce(p_project_brief ->> 'domain', '') not in ('have','need','unsure')
    or char_length(coalesce(p_project_brief ->> 'existingTools', '')) > 1200
    or (p_project_brief ->> 'visualStyle' = 'reference' and char_length(trim(coalesce(p_project_brief ->> 'references', ''))) = 0)
    or ((case when jsonb_typeof(p_project_brief -> 'pages') = 'array'
      then 'other' = any(array(select jsonb_array_elements_text(p_project_brief -> 'pages'))) else false end)
      and char_length(trim(coalesce(p_project_brief ->> 'customPages', ''))) = 0)
    or ((case when jsonb_typeof(p_project_brief -> 'features') = 'array'
      then 'other' = any(array(select jsonb_array_elements_text(p_project_brief -> 'features'))) else false end)
      and char_length(trim(coalesce(p_project_brief ->> 'customFeatures', ''))) = 0)
    or char_length(trim(coalesce(p_timeline, ''))) not between 1 and 80
    or char_length(trim(coalesce(p_budget_range, ''))) not between 1 and 80
    or p_locale not in ('en', 'ru')
    or p_requester_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid project inquiry' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('project-inquiry:' || p_requester_hash, 0));
  if (select count(*) from public.project_inquiries
      where requester_hash = p_requester_hash and created_at > now() - interval '30 minutes') >= 3 then
    raise exception 'Project inquiry limit' using errcode = 'P0001';
  end if;

  insert into public.project_inquiries(name, email, project_type, summary, project_brief, estimated_min_usd, estimated_max_usd, timeline, budget_range, locale, requester_hash)
  values (trim(p_name), lower(trim(p_email)), p_project_type, trim(p_summary), p_project_brief, p_estimated_min_usd, p_estimated_max_usd, trim(p_timeline), trim(p_budget_range), p_locale, p_requester_hash)
  returning id into new_id;
  return new_id;
end;
$$;

create function public.owner_project_inquiries()
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
  select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) into result
  from (
    select id, created_at, name, email, project_type, summary, project_brief, estimated_min_usd, estimated_max_usd, timeline, budget_range, locale, status
    from public.project_inquiries
    order by created_at desc
    limit 100
  ) r;
  return result;
end;
$$;

create function public.owner_update_project_inquiry(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.course_is_owner() then
    raise exception 'Owner required' using errcode = '42501';
  end if;
  if p_status not in ('new', 'replied', 'closed') then
    raise exception 'Invalid inquiry status' using errcode = '22023';
  end if;
  update public.project_inquiries set status = p_status where id = p_id;
  if not found then raise exception 'Inquiry not found' using errcode = 'P0002'; end if;
end;
$$;

revoke all on function public.submit_project_inquiry(text, text, text, text, jsonb, integer, integer, text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_project_inquiry(text, text, text, text, jsonb, integer, integer, text, text, text, text) to service_role;
revoke all on function public.owner_project_inquiries(), public.owner_update_project_inquiry(uuid, text) from public, anon;
grant execute on function public.owner_project_inquiries(), public.owner_update_project_inquiry(uuid, text) to authenticated;

commit;
