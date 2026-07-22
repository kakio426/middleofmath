create or replace function public.jsonb_is_trimmed_nonempty_string(p_value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(p_value) = 'string'
    and char_length(p_value #>> '{}') > 0
    and not (
      left(p_value #>> '{}', 1) = any(array[
        chr(9), chr(10), chr(11), chr(12), chr(13), chr(32), chr(160), chr(5760),
        chr(8192), chr(8193), chr(8194), chr(8195), chr(8196), chr(8197), chr(8198),
        chr(8199), chr(8200), chr(8201), chr(8202), chr(8232), chr(8233), chr(8239),
        chr(8287), chr(12288), chr(65279)
      ])
      or right(p_value #>> '{}', 1) = any(array[
        chr(9), chr(10), chr(11), chr(12), chr(13), chr(32), chr(160), chr(5760),
        chr(8192), chr(8193), chr(8194), chr(8195), chr(8196), chr(8197), chr(8198),
        chr(8199), chr(8200), chr(8201), chr(8202), chr(8232), chr(8233), chr(8239),
        chr(8287), chr(12288), chr(65279)
      ])
    ),
    false
  );
$$;

create or replace function public.jsonb_array_has_only_trimmed_ids(p_value jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_value) is distinct from 'array' then return false; end if;
  return not exists (
    select 1 from jsonb_array_elements(p_value) item
    where not public.jsonb_is_trimmed_nonempty_string(item)
  );
end;
$$;

create or replace function public.guard_diagnosis_trimmed_ids()
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
    return new;
  end if;

  if not public.jsonb_is_trimmed_nonempty_string(new.content #> '{manifest,id}')
    or exists (
      select 1 from jsonb_array_elements(new.content #> '{manifest,units}') unit
      where not public.jsonb_is_trimmed_nonempty_string(unit -> 'id')
    )
    or exists (
      select 1 from jsonb_array_elements(new.content #> '{manifest,interactionTypes}') interaction_type
      where not public.jsonb_is_trimmed_nonempty_string(interaction_type -> 'type')
    )
    or exists (
      select 1 from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
      where not public.jsonb_is_trimmed_nonempty_string(anchor -> 'id')
    )
    or exists (
      select 1 from jsonb_array_elements(new.content -> 'learnerStages') stage
      where not public.jsonb_is_trimmed_nonempty_string(stage -> 'id')
        or not public.jsonb_is_trimmed_nonempty_string(stage -> 'unitId')
        or not public.jsonb_array_has_only_trimmed_ids(stage -> 'curriculumAnchorIds')
        or not public.jsonb_array_has_only_trimmed_ids(stage -> 'prerequisiteStageIds')
    )
    or exists (
      select 1 from jsonb_array_elements(new.content -> 'signals') signal
      where not public.jsonb_is_trimmed_nonempty_string(signal -> 'id')
    )
    or exists (
      select 1 from jsonb_array_elements(new.content -> 'judgments') judgment
      where not public.jsonb_is_trimmed_nonempty_string(judgment -> 'id')
        or not public.jsonb_is_trimmed_nonempty_string(judgment -> 'unitId')
        or not public.jsonb_is_trimmed_nonempty_string(judgment -> 'learnerStageId')
        or not public.jsonb_array_has_only_trimmed_ids(judgment -> 'curriculumAnchorIds')
        or not public.jsonb_is_trimmed_nonempty_string(judgment #> '{interaction,type}')
        or exists (
          select 1 from jsonb_array_elements(coalesce(judgment -> 'choices', '[]'::jsonb)) choice
          where not public.jsonb_is_trimmed_nonempty_string(choice -> 'id')
            or (
              choice ? 'signalIds'
              and not public.jsonb_array_has_only_trimmed_ids(choice -> 'signalIds')
            )
        )
    ) then
    raise exception 'diagnosis IDs must be trimmed non-empty strings';
  end if;

  return new;
end;
$$;

create trigger diagnosis_sets_trimmed_ids_guard
before insert on public.diagnosis_sets
for each row execute function public.guard_diagnosis_trimmed_ids();
