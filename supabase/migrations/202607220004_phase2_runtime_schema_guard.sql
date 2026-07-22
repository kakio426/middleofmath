create or replace function public.jsonb_integer_at_least(p_value jsonb, p_minimum numeric)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_value) is distinct from 'number' or coalesce(p_value #>> '{}', '') !~ '^-?[0-9]+$' then
    return false;
  end if;
  return (p_value #>> '{}')::numeric >= p_minimum;
exception when others then
  return false;
end;
$$;

create or replace function public.jsonb_number_at_least(p_value jsonb, p_minimum numeric)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_value) is distinct from 'number' then return false; end if;
  return (p_value #>> '{}')::numeric >= p_minimum;
exception when others then
  return false;
end;
$$;

create or replace function public.assert_diagnosis_runtime_schema(p_content jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  manifest jsonb := p_content -> 'manifest';
begin
  if jsonb_typeof(p_content) is distinct from 'object'
    or jsonb_typeof(manifest) is distinct from 'object'
    or jsonb_typeof(manifest -> 'units') is distinct from 'array'
    or jsonb_array_length(manifest -> 'units') = 0
    or jsonb_typeof(manifest -> 'interactionTypes') is distinct from 'array'
    or jsonb_array_length(manifest -> 'interactionTypes') = 0
    or jsonb_typeof(p_content -> 'curriculumAnchors') is distinct from 'array'
    or jsonb_array_length(p_content -> 'curriculumAnchors') = 0
    or jsonb_typeof(p_content -> 'learnerStages') is distinct from 'array'
    or jsonb_array_length(p_content -> 'learnerStages') = 0
    or jsonb_typeof(p_content -> 'signals') is distinct from 'array'
    or jsonb_array_length(p_content -> 'signals') = 0
    or jsonb_typeof(p_content -> 'judgments') is distinct from 'array'
    or jsonb_array_length(p_content -> 'judgments') = 0 then
    raise exception 'diagnosis runtime schema is incomplete';
  end if;

  if char_length(trim(coalesce(manifest ->> 'id', ''))) = 0
    or coalesce(manifest ->> 'version', '') !~ '^\d+\.\d+\.\d+$'
    or char_length(trim(coalesce(manifest ->> 'title', ''))) = 0
    or char_length(trim(coalesce(manifest ->> 'shortTitle', ''))) = 0
    or not public.jsonb_integer_at_least(manifest -> 'grade', 1)
    or (manifest ->> 'grade')::integer > 6
    or not public.jsonb_integer_at_least(manifest -> 'semester', 1)
    or (manifest ->> 'semester')::integer not in (1, 2)
    or coalesce(manifest ->> 'curriculum', '') <> '2022-revised'
    or coalesce(manifest ->> 'status', '') <> 'published'
    or not public.jsonb_integer_at_least(manifest -> 'estimatedMinutes', 1) then
    raise exception 'diagnosis manifest schema is invalid';
  end if;

  if exists (
    select 1 from jsonb_array_elements(manifest -> 'units') unit
    where char_length(trim(coalesce(unit ->> 'id', ''))) = 0
      or char_length(trim(coalesce(unit ->> 'title', ''))) = 0
      or not public.jsonb_integer_at_least(unit -> 'order', 1)
  ) then raise exception 'diagnosis unit schema is invalid'; end if;

  if exists (
    select 1 from jsonb_array_elements(manifest -> 'interactionTypes') interaction
    where char_length(trim(coalesce(interaction ->> 'type', ''))) = 0
      or not public.jsonb_integer_at_least(interaction -> 'version', 1)
      or concat(interaction ->> 'type', '@', interaction ->> 'version')
        not in ('choice@1', 'fraction-bar@1', 'measurement@1', 'pictograph@1')
  ) then raise exception 'manifest interaction schema is invalid'; end if;

  if exists (
    select 1 from jsonb_array_elements(p_content -> 'curriculumAnchors') anchor
    where char_length(trim(coalesce(anchor ->> 'id', ''))) = 0
      or char_length(trim(coalesce(anchor ->> 'label', ''))) = 0
      or char_length(trim(coalesce(anchor ->> 'source', ''))) = 0
  ) then raise exception 'curriculum anchor schema is invalid'; end if;

  if exists (
    select 1 from jsonb_array_elements(p_content -> 'learnerStages') stage
    where char_length(trim(coalesce(stage ->> 'id', ''))) = 0
      or char_length(trim(coalesce(stage ->> 'unitId', ''))) = 0
      or char_length(trim(coalesce(stage ->> 'title', ''))) = 0
      or char_length(trim(coalesce(stage ->> 'shortTitle', ''))) = 0
      or not public.jsonb_integer_at_least(stage -> 'order', 1)
      or jsonb_typeof(stage -> 'curriculumAnchorIds') is distinct from 'array'
      or jsonb_array_length(stage -> 'curriculumAnchorIds') = 0
      or jsonb_typeof(stage -> 'prerequisiteStageIds') is distinct from 'array'
  ) then raise exception 'learner stage schema is invalid'; end if;

  if exists (
    select 1 from jsonb_array_elements(p_content -> 'signals') signal
    where char_length(trim(coalesce(signal ->> 'id', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'title', ''))) = 0
      or coalesce(signal ->> 'severity', '') not in ('low', 'medium', 'high')
      or char_length(trim(coalesce(signal ->> 'teacherInterpretation', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'teachingMove', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'parentSummary', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'homePrompt', ''))) = 0
  ) then raise exception 'signal schema is invalid'; end if;

  if exists (
    select 1 from jsonb_array_elements(p_content -> 'judgments') judgment
    where char_length(trim(coalesce(judgment ->> 'id', ''))) = 0
      or char_length(trim(coalesce(judgment ->> 'unitId', ''))) = 0
      or char_length(trim(coalesce(judgment ->> 'learnerStageId', ''))) = 0
      or char_length(trim(coalesce(judgment ->> 'prompt', ''))) = 0
      or (judgment ? 'context' and jsonb_typeof(judgment -> 'context') is distinct from 'string')
      or jsonb_typeof(judgment -> 'curriculumAnchorIds') is distinct from 'array'
      or jsonb_array_length(judgment -> 'curriculumAnchorIds') = 0
      or jsonb_typeof(judgment -> 'visual') is distinct from 'object'
      or jsonb_typeof(judgment -> 'interaction') is distinct from 'object'
      or char_length(trim(coalesce(judgment #>> '{interaction,type}', ''))) = 0
      or not public.jsonb_integer_at_least(judgment #> '{interaction,version}', 1)
      or (judgment #> '{interaction,config}' is not null and jsonb_typeof(judgment #> '{interaction,config}') is distinct from 'object')
      or jsonb_typeof(judgment -> 'choices') is distinct from 'array'
      or jsonb_array_length(judgment -> 'choices') < 2
      or not exists (
        select 1 from jsonb_array_elements(manifest -> 'interactionTypes') descriptor
        where descriptor ->> 'type' = judgment #>> '{interaction,type}'
          and descriptor ->> 'version' = judgment #>> '{interaction,version}'
      )
      or exists (
        select 1 from jsonb_array_elements(judgment -> 'choices') choice
        where char_length(trim(coalesce(choice ->> 'id', ''))) = 0
          or char_length(trim(coalesce(choice ->> 'label', ''))) = 0
          or jsonb_typeof(choice -> 'correct') is distinct from 'boolean'
          or (choice ? 'signalIds' and jsonb_typeof(choice -> 'signalIds') is distinct from 'array')
      )
      or case judgment #>> '{visual,kind}'
        when 'none' then false
        when 'array' then
          not public.jsonb_integer_at_least(judgment #> '{visual,rows}', 1)
          or not public.jsonb_integer_at_least(judgment #> '{visual,columns}', 1)
          or jsonb_typeof(judgment #> '{visual,label}') is distinct from 'string'
        when 'division-groups' then
          not public.jsonb_integer_at_least(judgment #> '{visual,total}', 1)
          or not public.jsonb_integer_at_least(judgment #> '{visual,groups}', 1)
        when 'circle' then
          (judgment #> '{visual,showCenter}' is not null and jsonb_typeof(judgment #> '{visual,showCenter}') is distinct from 'boolean')
          or (judgment #> '{visual,showRadius}' is not null and jsonb_typeof(judgment #> '{visual,showRadius}') is distinct from 'boolean')
          or (judgment #> '{visual,showDiameter}' is not null and jsonb_typeof(judgment #> '{visual,showDiameter}') is distinct from 'boolean')
        when 'fraction-bar' then
          not public.jsonb_integer_at_least(judgment #> '{visual,numerator}', 0)
          or not public.jsonb_integer_at_least(judgment #> '{visual,denominator}', 1)
          or (
            judgment #> '{visual,unknown}' is not null
            and (
              jsonb_typeof(judgment #> '{visual,unknown}') is distinct from 'string'
              or coalesce(judgment #>> '{visual,unknown}', '') not in ('numerator', 'denominator')
            )
          )
        when 'measurement' then
          not public.jsonb_number_at_least(judgment #> '{visual,amount}', 0)
          or coalesce(judgment #>> '{visual,unit}', '') not in ('mL', 'L', 'g', 'kg')
        when 'pictograph' then
          char_length(coalesce(judgment #>> '{visual,symbol}', '')) = 0
          or not public.jsonb_number_at_least(judgment #> '{visual,value}', 0.0000000001)
          or jsonb_typeof(judgment #> '{visual,rows}') is distinct from 'array'
          or jsonb_array_length(judgment #> '{visual,rows}') = 0
          or exists (
            select 1 from jsonb_array_elements(judgment #> '{visual,rows}') visual_row
            where jsonb_typeof(visual_row -> 'label') is distinct from 'string'
              or not public.jsonb_integer_at_least(visual_row -> 'count', 0)
          )
        else true
      end
  ) then raise exception 'judgment runtime schema is invalid'; end if;
end;
$$;

create or replace function public.guard_diagnosis_runtime_schema()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_diagnosis_runtime_schema(new.content);
  return new;
end;
$$;

create trigger diagnosis_sets_runtime_schema_guard
before insert on public.diagnosis_sets
for each row execute function public.guard_diagnosis_runtime_schema();

revoke all on function public.jsonb_integer_at_least(jsonb, numeric) from public;
revoke all on function public.jsonb_number_at_least(jsonb, numeric) from public;
revoke all on function public.assert_diagnosis_runtime_schema(jsonb) from public;
