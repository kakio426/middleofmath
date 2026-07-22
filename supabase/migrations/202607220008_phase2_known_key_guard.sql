create or replace function public.jsonb_object_has_only_keys(p_object jsonb, p_allowed text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_object) is distinct from 'object' then return false; end if;
  return not exists (
    select 1 from jsonb_object_keys(p_object) key_name
    where not (key_name = any(p_allowed))
  );
end;
$$;

create or replace function public.guard_diagnosis_known_keys()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Type guards in the earlier runtime-schema triggers provide the specific
  -- error when one of these containers is absent or has the wrong type.
  if jsonb_typeof(new.content) is distinct from 'object'
    or jsonb_typeof(new.content -> 'manifest') is distinct from 'object'
    or jsonb_typeof(new.content #> '{manifest,units}') is distinct from 'array'
    or jsonb_typeof(new.content #> '{manifest,interactionTypes}') is distinct from 'array'
    or jsonb_typeof(new.content -> 'curriculumAnchors') is distinct from 'array'
    or jsonb_typeof(new.content -> 'learnerStages') is distinct from 'array'
    or jsonb_typeof(new.content -> 'signals') is distinct from 'array'
    or jsonb_typeof(new.content -> 'judgments') is distinct from 'array' then
    return new;
  end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'judgments') judgment
    where jsonb_typeof(judgment) is distinct from 'object'
      or jsonb_typeof(judgment -> 'visual') is distinct from 'object'
      or jsonb_typeof(judgment -> 'interaction') is distinct from 'object'
      or jsonb_typeof(judgment -> 'choices') is distinct from 'array'
      or (
        judgment #>> '{visual,kind}' = 'pictograph'
        and jsonb_typeof(judgment #> '{visual,rows}') is distinct from 'array'
      )
  ) then
    return new;
  end if;

  if not public.jsonb_object_has_only_keys(
      new.content,
      array['manifest', 'curriculumAnchors', 'learnerStages', 'signals', 'judgments']
    )
    or not public.jsonb_object_has_only_keys(
      new.content -> 'manifest',
      array['id', 'version', 'checksum', 'title', 'shortTitle', 'grade', 'semester', 'curriculum', 'status', 'units', 'interactionTypes', 'estimatedMinutes']
    ) then
    raise exception 'diagnosis content contains unknown fields';
  end if;

  if exists (
    select 1 from jsonb_array_elements(new.content #> '{manifest,units}') unit
    where not public.jsonb_object_has_only_keys(unit, array['id', 'order', 'title'])
  ) or exists (
    select 1 from jsonb_array_elements(new.content #> '{manifest,interactionTypes}') interaction_type
    where not public.jsonb_object_has_only_keys(interaction_type, array['type', 'version'])
  ) or exists (
    select 1 from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
    where not public.jsonb_object_has_only_keys(anchor, array['id', 'label', 'source'])
  ) or exists (
    select 1 from jsonb_array_elements(new.content -> 'learnerStages') stage
    where not public.jsonb_object_has_only_keys(
      stage,
      array['id', 'order', 'unitId', 'title', 'shortTitle', 'curriculumAnchorIds', 'prerequisiteStageIds']
    )
  ) or exists (
    select 1 from jsonb_array_elements(new.content -> 'signals') signal
    where not public.jsonb_object_has_only_keys(
      signal,
      array['id', 'title', 'severity', 'teacherInterpretation', 'teachingMove', 'parentSummary', 'homePrompt']
    )
  ) then
    raise exception 'diagnosis content contains unknown fields';
  end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'judgments') judgment
    where not public.jsonb_object_has_only_keys(
      judgment,
      array['id', 'unitId', 'learnerStageId', 'curriculumAnchorIds', 'prompt', 'context', 'visual', 'interaction', 'choices']
    )
      or not public.jsonb_object_has_only_keys(
        judgment -> 'interaction',
        array['type', 'version', 'config']
      )
      or not public.jsonb_object_has_only_keys(
        judgment -> 'visual',
        case judgment #>> '{visual,kind}'
          when 'none' then array['kind']
          when 'array' then array['kind', 'rows', 'columns', 'label']
          when 'division-groups' then array['kind', 'total', 'groups']
          when 'circle' then array['kind', 'showCenter', 'showRadius', 'showDiameter']
          when 'fraction-bar' then array['kind', 'numerator', 'denominator', 'unknown']
          when 'measurement' then array['kind', 'amount', 'unit']
          when 'pictograph' then array['kind', 'symbol', 'value', 'rows']
          else array['kind']
        end
      )
      or exists (
        select 1 from jsonb_array_elements(judgment -> 'choices') choice
        where not public.jsonb_object_has_only_keys(choice, array['id', 'label', 'correct', 'signalIds'])
      )
      or (
        judgment #>> '{visual,kind}' = 'pictograph'
        and jsonb_typeof(judgment #> '{visual,rows}') = 'array'
        and exists (
          select 1 from jsonb_array_elements(judgment #> '{visual,rows}') visual_row
          where not public.jsonb_object_has_only_keys(visual_row, array['label', 'count'])
        )
      )
  ) then
    raise exception 'diagnosis content contains unknown fields';
  end if;

  return new;
end;
$$;

create trigger diagnosis_sets_known_keys_guard
before insert on public.diagnosis_sets
for each row execute function public.guard_diagnosis_known_keys();
