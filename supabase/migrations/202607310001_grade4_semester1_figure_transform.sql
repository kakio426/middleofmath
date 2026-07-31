-- Rollback:
-- 1. Restore assert_diagnosis_runtime_schema(jsonb) and
--    guard_diagnosis_known_keys() from 202607300005.
-- 2. Drop jsonb_grid_transform_diagram_valid(jsonb),
--    jsonb_grid_cells_valid(jsonb, integer, integer), and
--    jsonb_grid_cell_valid(jsonb, integer, integer).
-- 3. Delete [4수03-04] and [4수03-05] only after confirming that no draft
--    references the A2-1-approved rows.

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
    '[4수03-04]',
    4,
    1,
    '3-4',
    false,
    false,
    '구체물이나 평면도형의 밀기, 뒤집기, 돌리기 활동을 통하여 그 변화 이해하기',
    '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'
  ),
  (
    '[4수03-05]',
    4,
    1,
    '3-4',
    false,
    false,
    '평면에서 점의 이동을 위치와 방향을 이용하여 설명하기',
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

create or replace function public.jsonb_grid_cell_valid(
  p_cell jsonb,
  p_rows integer,
  p_columns integer
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_cell) = 'object'
    and public.jsonb_integer_at_least(p_cell -> 'row', 0)
    and public.jsonb_integer_at_least(p_cell -> 'column', 0)
    and (p_cell ->> 'row')::integer < p_rows
    and (p_cell ->> 'column')::integer < p_columns;
$$;

create or replace function public.jsonb_grid_cells_valid(
  p_cells jsonb,
  p_rows integer,
  p_columns integer
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_cells) = 'array'
    and jsonb_array_length(p_cells) between 1 and 8
    and not exists (
      select 1
      from jsonb_array_elements(p_cells) item
      where not public.jsonb_grid_cell_valid(item, p_rows, p_columns)
    )
    and (
      select count(*) = count(distinct value)
      from jsonb_array_elements(p_cells)
    );
$$;

create or replace function public.jsonb_grid_transform_diagram_valid(
  p_visual jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  row_count integer;
  column_count integer;
  current_mode text;
  source_item jsonb;
  expected_item jsonb;
  expected_row integer;
  expected_column integer;
  amount integer;
  axis_index integer;
  center_row integer;
  center_column integer;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'grid-transform-diagram'
    or p_visual ->> 'mode' not in (
      'slide',
      'flip-left-right',
      'flip-up-down',
      'rotate',
      'point-move'
    )
    or not public.jsonb_integer_at_least(p_visual -> 'rows', 4)
    or not public.jsonb_integer_at_least(p_visual -> 'columns', 4)
    or (p_visual ->> 'rows')::integer > 8
    or (p_visual ->> 'columns')::integer > 8 then
    return false;
  end if;

  row_count := (p_visual ->> 'rows')::integer;
  column_count := (p_visual ->> 'columns')::integer;
  current_mode := p_visual ->> 'mode';

  if current_mode = 'point-move' then
    if p_visual ?| array[
        'sourceCells',
        'targetCells',
        'sourceMarker',
        'targetMarker',
        'axisIndex',
        'center',
        'direction',
        'amount',
        'turn'
      ]
      or jsonb_typeof(p_visual -> 'points') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'points') <> 2
      or exists (
        select 1
        from jsonb_array_elements(p_visual -> 'points') point_item
        where not public.jsonb_grid_cell_valid(
          point_item,
          row_count,
          column_count
        )
          or point_item ->> 'label' not in ('A', 'B')
      )
      or (
        select count(distinct value ->> 'label') <> 2
          or count(distinct jsonb_build_object(
            'row', value -> 'row',
            'column', value -> 'column'
          )) <> 2
        from jsonb_array_elements(p_visual -> 'points')
      ) then
      return false;
    end if;
    return true;
  end if;

  if p_visual ? 'points'
    or not public.jsonb_grid_cells_valid(
      p_visual -> 'sourceCells',
      row_count,
      column_count
    )
    or not public.jsonb_grid_cells_valid(
      p_visual -> 'targetCells',
      row_count,
      column_count
    )
    or jsonb_array_length(p_visual -> 'sourceCells')
      <> jsonb_array_length(p_visual -> 'targetCells') then
    return false;
  end if;

  if (p_visual ? 'sourceMarker') <> (p_visual ? 'targetMarker') then
    return false;
  end if;
  if p_visual ? 'sourceMarker' then
    if not public.jsonb_grid_cell_valid(
        p_visual -> 'sourceMarker',
        row_count,
        column_count
      )
      or not public.jsonb_grid_cell_valid(
        p_visual -> 'targetMarker',
        row_count,
        column_count
      )
      or not (p_visual -> 'sourceCells')
        @> jsonb_build_array(p_visual -> 'sourceMarker')
      or not (p_visual -> 'targetCells')
        @> jsonb_build_array(p_visual -> 'targetMarker') then
      return false;
    end if;
  end if;

  if current_mode = 'slide' then
    if p_visual ->> 'direction' not in ('up', 'down', 'left', 'right')
      or not public.jsonb_integer_at_least(p_visual -> 'amount', 1)
      or (p_visual ->> 'amount')::integer > 7
      or p_visual ?| array['axisIndex', 'center', 'turn'] then
      return false;
    end if;
    amount := (p_visual ->> 'amount')::integer;
  elsif current_mode in ('flip-left-right', 'flip-up-down') then
    if not public.jsonb_integer_at_least(p_visual -> 'axisIndex', 1)
      or p_visual ?| array['direction', 'amount', 'center', 'turn'] then
      return false;
    end if;
    axis_index := (p_visual ->> 'axisIndex')::integer;
    if (
      current_mode = 'flip-left-right'
      and axis_index >= column_count
    ) or (
      current_mode = 'flip-up-down'
      and axis_index >= row_count
    ) then
      return false;
    end if;
  else
    if not public.jsonb_grid_cell_valid(
        p_visual -> 'center',
        row_count,
        column_count
      )
      or p_visual ->> 'turn' not in ('clockwise', 'counterclockwise')
      or p_visual ?| array['direction', 'amount', 'axisIndex'] then
      return false;
    end if;
    center_row := (p_visual #>> '{center,row}')::integer;
    center_column := (p_visual #>> '{center,column}')::integer;
  end if;

  for source_item in
    select value from jsonb_array_elements(p_visual -> 'sourceCells')
  loop
    expected_row := (source_item ->> 'row')::integer;
    expected_column := (source_item ->> 'column')::integer;

    if current_mode = 'slide' then
      expected_row := expected_row + case p_visual ->> 'direction'
        when 'down' then amount
        when 'up' then -amount
        else 0
      end;
      expected_column := expected_column + case p_visual ->> 'direction'
        when 'right' then amount
        when 'left' then -amount
        else 0
      end;
    elsif current_mode = 'flip-left-right' then
      expected_column := 2 * axis_index - 1 - expected_column;
    elsif current_mode = 'flip-up-down' then
      expected_row := 2 * axis_index - 1 - expected_row;
    elsif p_visual ->> 'turn' = 'clockwise' then
      expected_row :=
        center_row + expected_column - center_column;
      expected_column :=
        center_column - (source_item ->> 'row')::integer + center_row;
    else
      expected_row :=
        center_row - expected_column + center_column;
      expected_column :=
        center_column + (source_item ->> 'row')::integer - center_row;
    end if;

    expected_item := jsonb_build_object(
      'row', expected_row,
      'column', expected_column
    );
    if not public.jsonb_grid_cell_valid(
        expected_item,
        row_count,
        column_count
      )
      or not (p_visual -> 'targetCells') @> jsonb_build_array(expected_item)
      then
      return false;
    end if;
  end loop;

  if p_visual ? 'sourceMarker' then
    source_item := p_visual -> 'sourceMarker';
    expected_row := (source_item ->> 'row')::integer;
    expected_column := (source_item ->> 'column')::integer;

    if current_mode = 'slide' then
      expected_row := expected_row + case p_visual ->> 'direction'
        when 'down' then amount
        when 'up' then -amount
        else 0
      end;
      expected_column := expected_column + case p_visual ->> 'direction'
        when 'right' then amount
        when 'left' then -amount
        else 0
      end;
    elsif current_mode = 'flip-left-right' then
      expected_column := 2 * axis_index - 1 - expected_column;
    elsif current_mode = 'flip-up-down' then
      expected_row := 2 * axis_index - 1 - expected_row;
    elsif p_visual ->> 'turn' = 'clockwise' then
      expected_row :=
        center_row + expected_column - center_column;
      expected_column :=
        center_column - (source_item ->> 'row')::integer + center_row;
    else
      expected_row :=
        center_row - expected_column + center_column;
      expected_column :=
        center_column + (source_item ->> 'row')::integer - center_row;
    end if;

    if p_visual -> 'targetMarker' is distinct from jsonb_build_object(
      'row', expected_row,
      'column', expected_column
    ) then
      return false;
    end if;
  end if;

  return true;
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_diagnosis_runtime_schema_before_grid_transform;

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
    perform public.assert_diagnosis_runtime_schema_before_grid_transform(
      p_content
    );
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'judgments') judgment
    where judgment #>> '{visual,kind}' = 'grid-transform-diagram'
      and not public.jsonb_grid_transform_diagram_valid(
        judgment -> 'visual'
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
          when judgment #>> '{visual,kind}' = 'grid-transform-diagram'
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

  perform public.assert_diagnosis_runtime_schema_before_grid_transform(
    normalized_content
  );
end;
$$;

revoke all on function public.assert_diagnosis_runtime_schema(jsonb)
  from public;
revoke all on function public.jsonb_grid_transform_diagram_valid(jsonb)
  from public;
revoke all on function public.jsonb_grid_cells_valid(jsonb, integer, integer)
  from public;
revoke all on function public.jsonb_grid_cell_valid(jsonb, integer, integer)
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
              'kind', 'mode', 'radiusValue', 'showCenter',
              'showRadius', 'showDiameter'
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
          when 'grid-transform-diagram'
            then array[
              'kind', 'mode', 'rows', 'columns', 'sourceCells',
              'targetCells', 'sourceMarker', 'targetMarker', 'axisIndex',
              'center', 'direction', 'amount', 'turn', 'points'
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
      or (
        judgment #>> '{visual,kind}' = 'grid-transform-diagram'
        and (
          (
            jsonb_typeof(judgment #> '{visual,sourceCells}') = 'array'
            and exists (
              select 1
              from jsonb_array_elements(
                judgment #> '{visual,sourceCells}'
              ) cell_item
              where not public.jsonb_object_has_only_keys(
                cell_item,
                array['row', 'column']
              )
            )
          )
          or (
            jsonb_typeof(judgment #> '{visual,targetCells}') = 'array'
            and exists (
              select 1
              from jsonb_array_elements(
                judgment #> '{visual,targetCells}'
              ) cell_item
              where not public.jsonb_object_has_only_keys(
                cell_item,
                array['row', 'column']
              )
            )
          )
          or (
            judgment #> '{visual,sourceMarker}' is not null
            and not public.jsonb_object_has_only_keys(
              judgment #> '{visual,sourceMarker}',
              array['row', 'column']
            )
          )
          or (
            judgment #> '{visual,targetMarker}' is not null
            and not public.jsonb_object_has_only_keys(
              judgment #> '{visual,targetMarker}',
              array['row', 'column']
            )
          )
          or (
            judgment #> '{visual,center}' is not null
            and not public.jsonb_object_has_only_keys(
              judgment #> '{visual,center}',
              array['row', 'column']
            )
          )
          or (
            jsonb_typeof(judgment #> '{visual,points}') = 'array'
            and exists (
              select 1
              from jsonb_array_elements(
                judgment #> '{visual,points}'
              ) point_item
              where not public.jsonb_object_has_only_keys(
                point_item,
                array['label', 'row', 'column']
              )
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
