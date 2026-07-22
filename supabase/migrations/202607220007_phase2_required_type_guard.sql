create or replace function public.jsonb_integer_at_least(p_value jsonb, p_minimum numeric)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_value) is distinct from 'number'
    or coalesce(p_value #>> '{}', '') !~ '^-?[0-9]+$' then
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

create or replace function public.guard_diagnosis_required_types()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if jsonb_typeof(new.content) is distinct from 'object'
    or jsonb_typeof(new.content -> 'manifest') is distinct from 'object'
    or jsonb_typeof(new.content #> '{manifest,units}') is distinct from 'array'
    or jsonb_typeof(new.content #> '{manifest,interactionTypes}') is distinct from 'array'
    or jsonb_typeof(new.content -> 'curriculumAnchors') is distinct from 'array'
    or jsonb_typeof(new.content -> 'learnerStages') is distinct from 'array'
    or jsonb_typeof(new.content -> 'signals') is distinct from 'array'
    or jsonb_typeof(new.content -> 'judgments') is distinct from 'array' then
    raise exception 'diagnosis runtime schema is incomplete';
  end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'learnerStages') stage
    where jsonb_typeof(stage -> 'curriculumAnchorIds') is distinct from 'array'
      or jsonb_typeof(stage -> 'prerequisiteStageIds') is distinct from 'array'
  ) then raise exception 'learner stage schema is invalid'; end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'judgments') judgment
    where (judgment ? 'context' and jsonb_typeof(judgment -> 'context') is distinct from 'string')
      or jsonb_typeof(judgment -> 'curriculumAnchorIds') is distinct from 'array'
      or jsonb_typeof(judgment -> 'visual') is distinct from 'object'
      or jsonb_typeof(judgment -> 'interaction') is distinct from 'object'
      or (
        judgment #> '{interaction,config}' is not null
        and jsonb_typeof(judgment #> '{interaction,config}') is distinct from 'object'
      )
      or jsonb_typeof(judgment -> 'choices') is distinct from 'array'
      or exists (
        select 1 from jsonb_array_elements(judgment -> 'choices') choice
        where jsonb_typeof(choice -> 'correct') is distinct from 'boolean'
          or (choice ? 'signalIds' and jsonb_typeof(choice -> 'signalIds') is distinct from 'array')
      )
      or case judgment #>> '{visual,kind}'
        when 'none' then false
        when 'array' then jsonb_typeof(judgment #> '{visual,label}') is distinct from 'string'
        when 'division-groups' then false
        when 'circle' then
          (judgment #> '{visual,showCenter}' is not null and jsonb_typeof(judgment #> '{visual,showCenter}') is distinct from 'boolean')
          or (judgment #> '{visual,showRadius}' is not null and jsonb_typeof(judgment #> '{visual,showRadius}') is distinct from 'boolean')
          or (judgment #> '{visual,showDiameter}' is not null and jsonb_typeof(judgment #> '{visual,showDiameter}') is distinct from 'boolean')
        when 'fraction-bar' then
          judgment #> '{visual,unknown}' is not null
          and jsonb_typeof(judgment #> '{visual,unknown}') is distinct from 'string'
        when 'measurement' then false
        when 'pictograph' then
          jsonb_typeof(judgment #> '{visual,rows}') is distinct from 'array'
          or exists (
            select 1 from jsonb_array_elements(judgment #> '{visual,rows}') visual_row
            where jsonb_typeof(visual_row -> 'label') is distinct from 'string'
          )
        else true
      end
  ) then raise exception 'judgment runtime schema is invalid'; end if;
  return new;
end;
$$;

create trigger diagnosis_sets_required_types_guard
before insert on public.diagnosis_sets
for each row execute function public.guard_diagnosis_required_types();
