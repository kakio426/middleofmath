-- The parent export guard runs as the inserting teacher, but the content
-- migrations of 2026-08-02 revoked execute on jsonb_object_has_only_keys from
-- authenticated, so every export failed with 42501 and no teacher could finish
-- the flow. The guard only validates the new row, so run it as owner and keep
-- the helper unreachable from client roles.

create or replace function public.guard_parent_report_export_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.interpretation_runs run
    where run.id = new.interpretation_run_id and run.session_id = new.session_id
  ) then raise exception 'parent export must reference the same session interpretation'; end if;
  if jsonb_typeof(new.report) is distinct from 'object'
    or not public.jsonb_object_has_only_keys(
      new.report,
      array['studentLabel', 'diagnosisTitle', 'generatedAt', 'participation', 'strengths', 'supportAreas', 'closing', 'disclaimer']
    )
    or jsonb_typeof(new.report -> 'strengths') is distinct from 'array'
    or jsonb_typeof(new.report -> 'supportAreas') is distinct from 'array'
    or jsonb_typeof(new.report -> 'studentLabel') is distinct from 'string'
    or jsonb_typeof(new.report -> 'diagnosisTitle') is distinct from 'string'
    or jsonb_typeof(new.report -> 'generatedAt') is distinct from 'string'
    or jsonb_typeof(new.report -> 'participation') is distinct from 'string'
    or jsonb_typeof(new.report -> 'closing') is distinct from 'string'
    or jsonb_typeof(new.report -> 'disclaimer') is distinct from 'string'
    or coalesce(new.report ->> 'studentLabel', '') ~ '^[0-9]+번'
    or exists (
      select 1 from jsonb_array_elements(new.report -> 'strengths') item
      where jsonb_typeof(item) is distinct from 'string'
    )
    or exists (
      select 1 from jsonb_array_elements(new.report -> 'supportAreas') item
      where not public.jsonb_object_has_only_keys(item, array['title', 'observation', 'homePrompt'])
        or jsonb_typeof(item -> 'title') is distinct from 'string'
        or jsonb_typeof(item -> 'observation') is distinct from 'string'
        or jsonb_typeof(item -> 'homePrompt') is distinct from 'string'
    ) then raise exception 'parent export contains invalid or identifying fields'; end if;
  return new;
end;
$$;
