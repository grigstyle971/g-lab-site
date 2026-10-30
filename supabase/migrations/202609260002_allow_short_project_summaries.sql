begin;

alter table public.project_inquiries
  drop constraint if exists project_inquiries_summary_check;

alter table public.project_inquiries
  add constraint project_inquiries_summary_check
  check (char_length(summary) between 3 and 3000);

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'public.submit_project_inquiry(text, text, text, text, jsonb, integer, integer, text, text, text, text)'::regprocedure
  ) into function_definition;

  if position('not between 10 and 3000' in function_definition) > 0 then
    execute replace(function_definition, 'not between 10 and 3000', 'not between 3 and 3000');
  end if;
end;
$$;

commit;
