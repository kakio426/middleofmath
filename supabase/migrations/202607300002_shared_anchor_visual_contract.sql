-- Rollback:
-- 1. Restore guard_diagnosis_curriculum_alignment() from 202607220005.
-- 2. Restore assert_diagnosis_runtime_schema(), guard_diagnosis_required_types(),
--    and guard_diagnosis_known_keys() from their 20260722 migrations.
-- 3. Set shared_across_semesters = false, then drop the column only after no
--    published diagnosis set relies on a shared 3-4 grade-band anchor.

alter table public.curriculum_anchors
  add column shared_across_semesters boolean not null default false;

update public.curriculum_anchors
set shared_across_semesters = true
where anchor_key in (
  '[4수01-04]',
  '[4수01-05]',
  '[4수01-06]',
  '[4수01-09]'
);

comment on column public.curriculum_anchors.shared_across_semesters is
  '2022 개정 학년군 성취기준을 둘 이상의 로컬 학기 세트에서 사용할 때 true. 학기 배치 자체는 Middle of Math 편집 결정이다.';

create or replace function public.guard_diagnosis_curriculum_alignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
    where not exists (
      select 1 from public.curriculum_anchors approved
      where approved.anchor_key = anchor ->> 'id'
        and approved.active
        and approved.grade = (new.content #>> '{manifest,grade}')::integer
        and (
          approved.shared_across_semesters
          or approved.semester = (new.content #>> '{manifest,semester}')::integer
        )
    )
  ) then raise exception 'curriculum anchor grade or semester mismatch'; end if;
  return new;
end;
$$;

create or replace function public.jsonb_measure_parts_valid(
  p_parts jsonb,
  p_medium text
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_parts) is distinct from 'array'
    or jsonb_array_length(p_parts) not between 1 and 2 then
    return false;
  end if;
  return not exists (
    select 1
    from jsonb_array_elements(p_parts) part
    where jsonb_typeof(part) is distinct from 'object'
      or not public.jsonb_integer_at_least(part -> 'value', 0)
      or case p_medium
        when 'capacity' then coalesce(part ->> 'unit', '') not in ('mL', 'L')
        when 'weight' then coalesce(part ->> 'unit', '') not in ('g', 'kg', 't')
        else true
      end
  );
exception when others then
  return false;
end;
$$;

create or replace function public.jsonb_partition_diagrams_valid(p_diagrams jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_diagrams) is distinct from 'array'
    or jsonb_array_length(p_diagrams) not between 1 and 3 then
    return false;
  end if;
  return not exists (
    select 1
    from jsonb_array_elements(p_diagrams) diagram
    where jsonb_typeof(diagram) is distinct from 'object'
      or char_length(trim(coalesce(diagram ->> 'label', ''))) = 0
      or jsonb_typeof(diagram -> 'parts') is distinct from 'array'
      or jsonb_array_length(diagram -> 'parts') not between 2 and 8
      or exists (
        select 1
        from jsonb_array_elements(diagram -> 'parts') part
        where not public.jsonb_number_at_least(part, 0.0000000001)
      )
      or (
        diagram ? 'highlightedPart'
        and (
          not public.jsonb_integer_at_least(diagram -> 'highlightedPart', 0)
          or (diagram ->> 'highlightedPart')::integer
            >= jsonb_array_length(diagram -> 'parts')
        )
      )
  );
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
      or (
        judgment #> '{interaction,config}' is not null
        and jsonb_typeof(judgment #> '{interaction,config}') is distinct from 'object'
      )
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
          or (
            choice ? 'signalIds'
            and jsonb_typeof(choice -> 'signalIds') is distinct from 'array'
          )
      )
      or case judgment #>> '{visual,kind}'
        when 'none' then false
        when 'array' then
          not public.jsonb_integer_at_least(judgment #> '{visual,rows}', 1)
          or not public.jsonb_integer_at_least(judgment #> '{visual,columns}', 1)
          or jsonb_typeof(judgment #> '{visual,label}') is distinct from 'string'
        when 'item-collection' then
          char_length(trim(coalesce(judgment #>> '{visual,ariaLabel}', ''))) = 0
          or jsonb_typeof(judgment #> '{visual,items}') is distinct from 'array'
          or jsonb_array_length(judgment #> '{visual,items}') = 0
          or exists (
            select 1 from jsonb_array_elements(judgment #> '{visual,items}') item
            where jsonb_typeof(item) is distinct from 'string'
              or char_length(trim(item #>> '{}')) = 0
          )
        when 'data-table' then
          char_length(trim(coalesce(judgment #>> '{visual,title}', ''))) = 0
          or jsonb_typeof(judgment #> '{visual,rows}') is distinct from 'array'
          or jsonb_array_length(judgment #> '{visual,rows}') < 2
          or exists (
            select 1 from jsonb_array_elements(judgment #> '{visual,rows}') visual_row
            where char_length(trim(coalesce(visual_row ->> 'label', ''))) = 0
              or char_length(trim(coalesce(visual_row ->> 'value', ''))) = 0
          )
        when 'division-groups' then
          not public.jsonb_integer_at_least(judgment #> '{visual,total}', 1)
          or not public.jsonb_integer_at_least(judgment #> '{visual,groups}', 1)
        when 'circle' then
          (
            judgment #> '{visual,showCenter}' is not null
            and jsonb_typeof(judgment #> '{visual,showCenter}') is distinct from 'boolean'
          )
          or (
            judgment #> '{visual,showRadius}' is not null
            and jsonb_typeof(judgment #> '{visual,showRadius}') is distinct from 'boolean'
          )
          or (
            judgment #> '{visual,showDiameter}' is not null
            and jsonb_typeof(judgment #> '{visual,showDiameter}') is distinct from 'boolean'
          )
        when 'fraction-bar' then
          not public.jsonb_integer_at_least(judgment #> '{visual,numerator}', 0)
          or not public.jsonb_integer_at_least(judgment #> '{visual,denominator}', 1)
          or (
            judgment #> '{visual,unknown}' is not null
            and (
              jsonb_typeof(judgment #> '{visual,unknown}') is distinct from 'string'
              or coalesce(judgment #>> '{visual,unknown}', '')
                not in ('numerator', 'denominator')
            )
          )
        when 'partition-diagrams' then
          not public.jsonb_partition_diagrams_valid(
            judgment #> '{visual,diagrams}'
          )
        when 'measurement' then
          not public.jsonb_number_at_least(judgment #> '{visual,amount}', 0)
          or coalesce(judgment #>> '{visual,unit}', '')
            not in ('mL', 'L', 'g', 'kg')
        when 'length-relation' then
          not public.jsonb_integer_at_least(judgment #> '{visual,value}', 1)
          or coalesce(judgment #>> '{visual,fromUnit}', '')
            not in ('mm', 'cm', 'm', 'km')
          or coalesce(judgment #>> '{visual,targetUnit}', '')
            not in ('mm', 'cm', 'm', 'km')
        when 'unit-relation' then
          coalesce(judgment #>> '{visual,medium}', '')
            not in ('capacity', 'weight')
          or not public.jsonb_measure_parts_valid(
            judgment #> '{visual,given}',
            judgment #>> '{visual,medium}'
          )
          or case judgment #>> '{visual,medium}'
            when 'capacity' then coalesce(
              judgment #>> '{visual,targetUnit}',
              ''
            ) not in ('mL', 'L')
            when 'weight' then coalesce(
              judgment #>> '{visual,targetUnit}',
              ''
            ) not in ('g', 'kg', 't')
            else true
          end
        when 'measure-referent' then
          case judgment #>> '{visual,medium}'
            when 'capacity' then
              coalesce(judgment #>> '{visual,object}', '')
                not in ('paper-cup', 'water-bottle')
              or coalesce(judgment #>> '{visual,instrument}', '') <> 'beaker'
            when 'weight' then
              coalesce(judgment #>> '{visual,object}', '')
                not in ('watermelon', 'paper-clip')
              or coalesce(judgment #>> '{visual,instrument}', '') <> 'scale'
            else true
          end
        when 'quantity-combine' then
          coalesce(judgment #>> '{visual,medium}', '')
            not in ('capacity', 'weight')
          or coalesce(judgment #>> '{visual,operator}', '')
            not in ('add', 'subtract')
          or not public.jsonb_measure_parts_valid(
            judgment #> '{visual,left}',
            judgment #>> '{visual,medium}'
          )
          or not public.jsonb_measure_parts_valid(
            judgment #> '{visual,right}',
            judgment #>> '{visual,medium}'
          )
        when 'pictograph' then
          char_length(coalesce(judgment #>> '{visual,symbol}', '')) = 0
          or not public.jsonb_number_at_least(
            judgment #> '{visual,value}',
            0.0000000001
          )
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
    where (
        judgment ? 'context'
        and jsonb_typeof(judgment -> 'context') is distinct from 'string'
      )
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
          or (
            choice ? 'signalIds'
            and jsonb_typeof(choice -> 'signalIds') is distinct from 'array'
          )
      )
  ) then raise exception 'judgment runtime schema is invalid'; end if;
  return new;
end;
$$;

create or replace function public.guard_diagnosis_known_keys()
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

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'judgments') judgment
    where jsonb_typeof(judgment) is distinct from 'object'
      or jsonb_typeof(judgment -> 'visual') is distinct from 'object'
      or jsonb_typeof(judgment -> 'interaction') is distinct from 'object'
      or jsonb_typeof(judgment -> 'choices') is distinct from 'array'
  ) then return new; end if;

  if not public.jsonb_object_has_only_keys(
      new.content,
      array['manifest', 'curriculumAnchors', 'learnerStages', 'signals', 'judgments']
    )
    or not public.jsonb_object_has_only_keys(
      new.content -> 'manifest',
      array[
        'id', 'version', 'checksum', 'title', 'shortTitle', 'grade', 'semester',
        'curriculum', 'status', 'units', 'interactionTypes', 'estimatedMinutes'
      ]
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
      array[
        'id', 'order', 'unitId', 'title', 'shortTitle',
        'curriculumAnchorIds', 'prerequisiteStageIds'
      ]
    )
  ) or exists (
    select 1 from jsonb_array_elements(new.content -> 'signals') signal
    where not public.jsonb_object_has_only_keys(
      signal,
      array[
        'id', 'title', 'severity', 'teacherInterpretation', 'teachingMove',
        'parentSummary', 'homePrompt'
      ]
    )
  ) then
    raise exception 'diagnosis content contains unknown fields';
  end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'judgments') judgment
    where not public.jsonb_object_has_only_keys(
      judgment,
      array[
        'id', 'unitId', 'learnerStageId', 'curriculumAnchorIds',
        'prompt', 'context', 'visual', 'interaction', 'choices'
      ]
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
          when 'item-collection' then array['kind', 'ariaLabel', 'items']
          when 'data-table' then array['kind', 'title', 'rows']
          when 'division-groups' then array['kind', 'total', 'groups']
          when 'circle' then array['kind', 'showCenter', 'showRadius', 'showDiameter']
          when 'fraction-bar' then array['kind', 'numerator', 'denominator', 'unknown']
          when 'partition-diagrams' then array['kind', 'diagrams']
          when 'measurement' then array['kind', 'amount', 'unit']
          when 'length-relation' then array['kind', 'value', 'fromUnit', 'targetUnit']
          when 'unit-relation' then array['kind', 'medium', 'given', 'targetUnit']
          when 'measure-referent' then array['kind', 'medium', 'object', 'instrument']
          when 'quantity-combine' then array['kind', 'medium', 'operator', 'left', 'right']
          when 'pictograph' then array['kind', 'symbol', 'value', 'rows']
          else array['kind']
        end
      )
      or exists (
        select 1 from jsonb_array_elements(judgment -> 'choices') choice
        where not public.jsonb_object_has_only_keys(
          choice,
          array['id', 'label', 'correct', 'signalIds']
        )
      )
      or (
        judgment #>> '{visual,kind}' in ('data-table', 'pictograph')
        and jsonb_typeof(judgment #> '{visual,rows}') = 'array'
        and exists (
          select 1 from jsonb_array_elements(judgment #> '{visual,rows}') visual_row
          where not public.jsonb_object_has_only_keys(
            visual_row,
            case judgment #>> '{visual,kind}'
              when 'data-table' then array['label', 'value']
              else array['label', 'count']
            end
          )
        )
      )
      or (
        judgment #>> '{visual,kind}' = 'partition-diagrams'
        and jsonb_typeof(judgment #> '{visual,diagrams}') = 'array'
        and exists (
          select 1 from jsonb_array_elements(judgment #> '{visual,diagrams}') diagram
          where not public.jsonb_object_has_only_keys(
            diagram,
            array['label', 'parts', 'highlightedPart']
          )
        )
      )
      or (
        judgment #>> '{visual,kind}' = 'unit-relation'
        and jsonb_typeof(judgment #> '{visual,given}') = 'array'
        and exists (
          select 1 from jsonb_array_elements(judgment #> '{visual,given}') part
          where not public.jsonb_object_has_only_keys(part, array['value', 'unit'])
        )
      )
      or (
        judgment #>> '{visual,kind}' = 'quantity-combine'
        and (
          exists (
            select 1 from jsonb_array_elements(judgment #> '{visual,left}') part
            where not public.jsonb_object_has_only_keys(part, array['value', 'unit'])
          )
          or exists (
            select 1 from jsonb_array_elements(judgment #> '{visual,right}') part
            where not public.jsonb_object_has_only_keys(part, array['value', 'unit'])
          )
        )
      )
  ) then
    raise exception 'diagnosis content contains unknown fields';
  end if;

  return new;
end;
$$;

revoke all on function public.jsonb_measure_parts_valid(jsonb, text) from public;
revoke all on function public.jsonb_partition_diagrams_valid(jsonb) from public;
