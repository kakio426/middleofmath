-- Rollback:
-- 1. Restore assert_diagnosis_runtime_schema(jsonb) and
--    guard_diagnosis_known_keys() from 202607300004.
-- 2. Drop jsonb_angle_figure_valid(jsonb) and
--    jsonb_polygon_angle_diagram_valid(jsonb).
-- 3. Delete the three angle anchors only after confirming that no draft
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
    '[4수03-02]',
    4,
    1,
    '3-4',
    false,
    false,
    '각과 직각을 이해하고 직각과 비교하여 예각과 둔각 구별하기',
    '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'
  ),
  (
    '[4수03-24]',
    4,
    1,
    '3-4',
    false,
    false,
    '1도와 각도기를 이용하여 각의 크기를 재고 어림하기',
    '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'
  ),
  (
    '[4수03-25]',
    4,
    1,
    '3-4',
    false,
    false,
    '삼각형과 사각형의 내각의 크기의 합을 추론하고 설명하기',
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

create or replace function public.jsonb_angle_figure_valid(p_visual jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  item jsonb;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'angle-figure'
    or not public.jsonb_integer_at_least(p_visual -> 'degrees', 1)
    or (p_visual ->> 'degrees')::numeric > 179
    or p_visual ->> 'mode' not in ('bare', 'protractor') then
    return false;
  end if;

  if p_visual ? 'rayLengths' then
    if jsonb_typeof(p_visual -> 'rayLengths') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'rayLengths') <> 2 then
      return false;
    end if;
    for item in select value from jsonb_array_elements(p_visual -> 'rayLengths')
    loop
      if not public.jsonb_integer_at_least(item, 20)
        or (item #>> '{}')::numeric > 120 then
        return false;
      end if;
    end loop;
  end if;

  if p_visual ? 'referenceRightAngle'
    and jsonb_typeof(p_visual -> 'referenceRightAngle') is distinct from 'boolean' then
    return false;
  end if;
  if p_visual ? 'label'
    and (
      jsonb_typeof(p_visual -> 'label') is distinct from 'string'
      or length(btrim(p_visual ->> 'label')) = 0
    ) then
    return false;
  end if;
  if p_visual ? 'protractorPlacement'
    and p_visual ->> 'protractorPlacement'
      not in ('aligned', 'vertex-off', 'baseline-off') then
    return false;
  end if;
  if p_visual ->> 'mode' = 'bare'
    and p_visual ? 'protractorPlacement' then
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.jsonb_polygon_angle_diagram_valid(
  p_visual jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  item jsonb;
  expected_length integer;
  unknown_count integer := 0;
  known_sum integer := 0;
  total integer;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'polygon-angle-diagram'
    or p_visual ->> 'polygon' not in ('triangle', 'quadrilateral')
    or p_visual ->> 'mode' not in ('find-missing', 'verify-claim')
    or jsonb_typeof(p_visual -> 'angles') is distinct from 'array' then
    return false;
  end if;

  expected_length := case p_visual ->> 'polygon'
    when 'triangle' then 3
    else 4
  end;
  if jsonb_array_length(p_visual -> 'angles') <> expected_length then
    return false;
  end if;
  if p_visual ? 'diagonal'
    and jsonb_typeof(p_visual -> 'diagonal') is distinct from 'boolean' then
    return false;
  end if;
  if p_visual ->> 'polygon' = 'triangle' and p_visual ? 'diagonal' then
    return false;
  end if;

  for item in select value from jsonb_array_elements(p_visual -> 'angles')
  loop
    if jsonb_typeof(item) is distinct from 'object'
      or jsonb_typeof(item -> 'label') is distinct from 'string'
      or length(btrim(item ->> 'label')) = 0
      or not (item ? 'value') then
      return false;
    end if;
    if jsonb_typeof(item -> 'value') = 'null' then
      unknown_count := unknown_count + 1;
    elsif not public.jsonb_integer_at_least(item -> 'value', 1)
      or (item ->> 'value')::numeric > 179 then
      return false;
    else
      known_sum := known_sum + (item ->> 'value')::integer;
    end if;
  end loop;

  if (
    select count(*) <> count(distinct value ->> 'label')
    from jsonb_array_elements(p_visual -> 'angles')
  ) then
    return false;
  end if;

  total := case p_visual ->> 'polygon' when 'triangle' then 180 else 360 end;
  if p_visual ->> 'mode' = 'find-missing' then
    return unknown_count = 1 and total - known_sum between 1 and 179;
  end if;
  return unknown_count = 0
    and known_sum <= case p_visual ->> 'polygon'
      when 'triangle' then 358
      else 716
    end;
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_diagnosis_runtime_schema_before_angles;

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
    perform public.assert_diagnosis_runtime_schema_before_angles(p_content);
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'judgments') judgment
    where (
      judgment #>> '{visual,kind}' = 'angle-figure'
      and not public.jsonb_angle_figure_valid(judgment -> 'visual')
    ) or (
      judgment #>> '{visual,kind}' = 'polygon-angle-diagram'
      and not public.jsonb_polygon_angle_diagram_valid(judgment -> 'visual')
    )
  ) then
    raise exception 'judgment runtime schema is invalid';
  end if;

  normalized_content := jsonb_set(
    p_content,
    '{judgments}',
    coalesce((
      select jsonb_agg(
        case
          when judgment #>> '{visual,kind}' in (
            'angle-figure',
            'polygon-angle-diagram'
          ) then jsonb_set(
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

  perform public.assert_diagnosis_runtime_schema_before_angles(
    normalized_content
  );
end;
$$;

revoke all on function public.assert_diagnosis_runtime_schema(jsonb)
  from public;
revoke all on function public.jsonb_angle_figure_valid(jsonb)
  from public;
revoke all on function public.jsonb_polygon_angle_diagram_valid(jsonb)
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
          when 'angle-figure'
            then array[
              'kind', 'degrees', 'mode', 'rayLengths',
              'referenceRightAngle', 'protractorPlacement', 'label'
            ]
          when 'polygon-angle-diagram'
            then array[
              'kind', 'polygon', 'mode', 'angles', 'diagonal'
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
      or (
        judgment #>> '{visual,kind}' = 'polygon-angle-diagram'
        and jsonb_typeof(judgment #> '{visual,angles}') = 'array'
        and exists (
          select 1
          from jsonb_array_elements(judgment #> '{visual,angles}') angle_item
          where not public.jsonb_object_has_only_keys(
            angle_item,
            array['label', 'value']
          )
        )
      )
  ) then
    raise exception 'diagnosis content contains unknown fields';
  end if;

  return new;
end;
$$;
