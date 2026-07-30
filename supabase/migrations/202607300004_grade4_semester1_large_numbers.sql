-- Rollback:
-- 1. Restore assert_diagnosis_runtime_schema(jsonb) and
--    guard_diagnosis_known_keys() from 202607300002.
-- 2. Drop jsonb_place_value_chart_valid(jsonb).
-- 3. Delete [4수01-01] and [4수01-02] only after confirming no draft
--    references the A1-approved rows.

insert into public.curriculum_anchors (
  anchor_key,
  grade,
  semester,
  grade_band,
  shared_across_semesters,
  shared_across_grade_band,
  label,
  source
) values
  (
    '[4수01-01]',
    4,
    1,
    '3-4',
    false,
    false,
    '10000 이상의 큰 수를 읽고 쓰며 자릿값과 위치적 기수법 이해하기',
    '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'
  ),
  (
    '[4수01-02]',
    4,
    1,
    '3-4',
    false,
    false,
    '큰 수의 계열을 이해하고 크기를 비교하며 비교 방법 설명하기',
    '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'
  )
on conflict (anchor_key) do update
set grade = excluded.grade,
    semester = excluded.semester,
    grade_band = excluded.grade_band,
    shared_across_semesters = excluded.shared_across_semesters,
    shared_across_grade_band = excluded.shared_across_grade_band,
    label = excluded.label,
    source = excluded.source,
    active = true;

create or replace function public.jsonb_place_value_chart_valid(p_visual jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    jsonb_typeof(p_visual) = 'object'
    and p_visual ->> 'kind' = 'place-value-chart'
    and jsonb_typeof(p_visual -> 'digits') = 'array'
    and jsonb_array_length(p_visual -> 'digits') between 4 and 9
    and public.jsonb_integer_at_least(p_visual #> '{digits,0}', 1)
    and not exists (
      select 1
      from jsonb_array_elements(p_visual -> 'digits') digit
      where case
        when not public.jsonb_integer_at_least(digit, 0) then true
        else (digit #>> '{}')::numeric > 9
      end
    )
    and p_visual ->> 'ask' in ('value', 'place-name')
    and case p_visual ->> 'ask'
      when 'place-name' then not (p_visual ? 'highlightIndexes')
      when 'value' then
        jsonb_typeof(p_visual -> 'highlightIndexes') = 'array'
        and jsonb_array_length(p_visual -> 'highlightIndexes') between 1 and 2
        and not exists (
          select 1
          from jsonb_array_elements(p_visual -> 'highlightIndexes') item
          where case
            when not public.jsonb_integer_at_least(item, 0) then true
            else (item #>> '{}')::numeric
              >= jsonb_array_length(p_visual -> 'digits')
          end
        )
        and (
          select count(*) = count(distinct item #>> '{}')
          from jsonb_array_elements(p_visual -> 'highlightIndexes') item
        )
      else false
    end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_diagnosis_runtime_schema_before_grade4;

create function public.assert_diagnosis_runtime_schema(p_content jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_content jsonb;
begin
  if jsonb_typeof(p_content -> 'judgments') is distinct from 'array' then
    perform public.assert_diagnosis_runtime_schema_before_grade4(p_content);
    return;
  end if;

  if jsonb_typeof(p_content -> 'judgments') = 'array'
    and exists (
      select 1
      from jsonb_array_elements(p_content -> 'judgments') judgment
      where judgment #>> '{visual,kind}' = 'place-value-chart'
        and not public.jsonb_place_value_chart_valid(judgment -> 'visual')
    ) then
    raise exception 'judgment runtime schema is invalid';
  end if;

  normalized_content := jsonb_set(
    p_content,
    '{judgments}',
    coalesce((
      select jsonb_agg(
        case
          when judgment #>> '{visual,kind}' = 'place-value-chart'
            then jsonb_set(
              judgment,
              '{visual}',
              '{"kind":"none"}'::jsonb,
              true
            )
          else judgment
        end
        order by ordinal
      )
      from jsonb_array_elements(p_content -> 'judgments')
        with ordinality rows(judgment, ordinal)
    ), '[]'::jsonb),
    true
  );

  perform public.assert_diagnosis_runtime_schema_before_grade4(
    normalized_content
  );
end;
$$;

revoke all on function public.assert_diagnosis_runtime_schema(jsonb)
  from public;
revoke all on function public.jsonb_place_value_chart_valid(jsonb)
  from public;

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
      array[
        'manifest',
        'curriculumAnchors',
        'learnerStages',
        'signals',
        'judgments'
      ]
    )
    or not public.jsonb_object_has_only_keys(
      new.content -> 'manifest',
      array[
        'id', 'version', 'checksum', 'title', 'shortTitle', 'grade',
        'semester', 'curriculum', 'status', 'units', 'interactionTypes',
        'estimatedMinutes'
      ]
    ) then
    raise exception 'diagnosis content contains unknown fields';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.content #> '{manifest,units}') unit
    where not public.jsonb_object_has_only_keys(
      unit,
      array['id', 'order', 'title']
    )
  ) or exists (
    select 1
    from jsonb_array_elements(
      new.content #> '{manifest,interactionTypes}'
    ) interaction_type
    where not public.jsonb_object_has_only_keys(
      interaction_type,
      array['type', 'version']
    )
  ) or exists (
    select 1
    from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
    where not public.jsonb_object_has_only_keys(
      anchor,
      array['id', 'label', 'source']
    )
  ) or exists (
    select 1
    from jsonb_array_elements(new.content -> 'learnerStages') stage
    where not public.jsonb_object_has_only_keys(
      stage,
      array[
        'id', 'order', 'unitId', 'title', 'shortTitle',
        'curriculumAnchorIds', 'prerequisiteStageIds'
      ]
    )
  ) or exists (
    select 1
    from jsonb_array_elements(new.content -> 'signals') signal
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
    select 1
    from jsonb_array_elements(new.content -> 'judgments') judgment
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
          when 'item-collection'
            then array['kind', 'ariaLabel', 'items']
          when 'data-table' then array['kind', 'title', 'rows']
          when 'division-groups' then array['kind', 'total', 'groups']
          when 'circle'
            then array[
              'kind', 'showCenter', 'showRadius', 'showDiameter'
            ]
          when 'fraction-bar'
            then array[
              'kind', 'numerator', 'denominator', 'unknown'
            ]
          when 'partition-diagrams' then array['kind', 'diagrams']
          when 'measurement' then array['kind', 'amount', 'unit']
          when 'length-relation'
            then array['kind', 'value', 'fromUnit', 'targetUnit']
          when 'unit-relation'
            then array['kind', 'medium', 'given', 'targetUnit']
          when 'measure-referent'
            then array['kind', 'medium', 'object', 'instrument']
          when 'quantity-combine'
            then array[
              'kind', 'medium', 'operator', 'left', 'right'
            ]
          when 'place-value-chart'
            then array[
              'kind', 'digits', 'ask', 'highlightIndexes'
            ]
          when 'pictograph'
            then array['kind', 'symbol', 'value', 'rows']
          else array['kind']
        end
      )
      or exists (
        select 1
        from jsonb_array_elements(judgment -> 'choices') choice
        where not public.jsonb_object_has_only_keys(
          choice,
          array['id', 'label', 'correct', 'signalIds']
        )
      )
      or (
        judgment #>> '{visual,kind}' in ('data-table', 'pictograph')
        and jsonb_typeof(judgment #> '{visual,rows}') = 'array'
        and exists (
          select 1
          from jsonb_array_elements(
            judgment #> '{visual,rows}'
          ) visual_row
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
          select 1
          from jsonb_array_elements(
            judgment #> '{visual,diagrams}'
          ) diagram
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
          select 1
          from jsonb_array_elements(judgment #> '{visual,given}') part
          where not public.jsonb_object_has_only_keys(
            part,
            array['value', 'unit']
          )
        )
      )
      or (
        judgment #>> '{visual,kind}' = 'quantity-combine'
        and (
          exists (
            select 1
            from jsonb_array_elements(judgment #> '{visual,left}') part
            where not public.jsonb_object_has_only_keys(
              part,
              array['value', 'unit']
            )
          )
          or exists (
            select 1
            from jsonb_array_elements(judgment #> '{visual,right}') part
            where not public.jsonb_object_has_only_keys(
              part,
              array['value', 'unit']
            )
          )
        )
      )
  ) then
    raise exception 'diagnosis content contains unknown fields';
  end if;

  return new;
end;
$$;
