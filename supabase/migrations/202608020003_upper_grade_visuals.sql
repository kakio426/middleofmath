-- 5-2~6-2: strict solid, part-chart, circle-unit, and multi-turn grid contracts.

create or replace function public.jsonb_solid_diagram_valid(p_visual jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  mode_name text := p_visual ->> 'mode';
  shape_name text := p_visual ->> 'shape';
  cube_item jsonb;
  x_value integer;
  y_value integer;
  z_value integer;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' <> 'solid-diagram'
    or mode_name not in ('structure', 'net', 'dimensions', 'unit-stack')
  then return false; end if;

  if mode_name in ('structure', 'net') then
    return shape_name in (
      'rectangular-prism', 'cube', 'triangular-prism', 'square-pyramid',
      'cylinder', 'cone', 'sphere'
    ) and public.jsonb_object_has_only_keys(
      p_visual, array['kind', 'mode', 'shape']
    );
  end if;

  if mode_name = 'dimensions' then
    if shape_name = 'rectangular-prism' then
      if not public.jsonb_object_has_only_keys(
        p_visual, array['kind', 'mode', 'shape', 'width', 'depth', 'height']
      ) then return false; end if;
      return public.jsonb_integer_at_least(p_visual -> 'width', 1)
        and public.jsonb_integer_at_least(p_visual -> 'depth', 1)
        and public.jsonb_integer_at_least(p_visual -> 'height', 1)
        and (p_visual ->> 'width')::integer <= 30
        and (p_visual ->> 'depth')::integer <= 30
        and (p_visual ->> 'height')::integer <= 30;
    elsif shape_name = 'cube' then
      return public.jsonb_object_has_only_keys(
        p_visual, array['kind', 'mode', 'shape', 'width']
      ) and public.jsonb_integer_at_least(p_visual -> 'width', 1)
        and (p_visual ->> 'width')::integer <= 30;
    elsif shape_name = 'cylinder' then
      return public.jsonb_object_has_only_keys(
        p_visual, array['kind', 'mode', 'shape', 'radius', 'height']
      ) and public.jsonb_integer_at_least(p_visual -> 'radius', 1)
        and public.jsonb_integer_at_least(p_visual -> 'height', 1)
        and (p_visual ->> 'radius')::integer <= 20
        and (p_visual ->> 'height')::integer <= 30;
    end if;
    return false;
  end if;

  if shape_name <> 'unit-cubes'
    or p_visual ->> 'frontDirection' not in ('left', 'right')
    or not public.jsonb_object_has_only_keys(
      p_visual, array['kind', 'mode', 'shape', 'cubes', 'frontDirection']
    )
    or jsonb_typeof(p_visual -> 'cubes') is distinct from 'array'
    or jsonb_array_length(p_visual -> 'cubes') < 1
    or jsonb_array_length(p_visual -> 'cubes') > 40
  then return false; end if;
  if (select count(*) <> count(distinct value)
      from jsonb_array_elements(p_visual -> 'cubes')) then
    return false;
  end if;
  for cube_item in select value from jsonb_array_elements(p_visual -> 'cubes') loop
    if jsonb_typeof(cube_item) is distinct from 'array'
      or jsonb_array_length(cube_item) <> 3
      or not public.jsonb_integer_at_least(cube_item -> 0, 0)
      or not public.jsonb_integer_at_least(cube_item -> 1, 0)
      or not public.jsonb_integer_at_least(cube_item -> 2, 0)
    then return false; end if;
    x_value := (cube_item ->> 0)::integer;
    y_value := (cube_item ->> 1)::integer;
    z_value := (cube_item ->> 2)::integer;
    if x_value > 5 or y_value > 5 or z_value > 5 then return false; end if;
    if z_value > 0 and not exists (
      select 1
      from jsonb_array_elements(p_visual -> 'cubes') support_cube
      where (support_cube ->> 0)::integer = x_value
        and (support_cube ->> 1)::integer = y_value
        and (support_cube ->> 2)::integer = z_value - 1
    ) then return false; end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create function public.jsonb_part_chart_diagram_valid(p_visual jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' <> 'part-chart-diagram'
    or p_visual ->> 'mode' not in ('strip', 'circle')
    or not public.jsonb_integer_at_least(p_visual -> 'totalParts', 10)
    or (p_visual ->> 'totalParts')::integer not in (10, 20)
    or not public.jsonb_object_has_only_keys(
      p_visual, array['kind', 'mode', 'totalParts', 'segments']
    )
    or jsonb_typeof(p_visual -> 'segments') is distinct from 'array'
    or jsonb_array_length(p_visual -> 'segments') < 2
    or jsonb_array_length(p_visual -> 'segments') > 6
  then return false; end if;
  if exists (
    select 1 from jsonb_array_elements(p_visual -> 'segments') segment
    where not public.jsonb_object_has_only_keys(segment, array['label', 'parts'])
      or jsonb_typeof(segment -> 'label') <> 'string'
      or length(btrim(segment ->> 'label')) = 0
      or not public.jsonb_integer_at_least(segment -> 'parts', 1)
      or (segment ->> 'parts')::integer > 20
  ) then return false; end if;
  return (select count(*) = count(distinct value ->> 'label')
      and sum((value ->> 'parts')::integer) = (p_visual ->> 'totalParts')::integer
    from jsonb_array_elements(p_visual -> 'segments'));
exception when others then
  return false;
end;
$$;

alter function public.jsonb_grid_transform_diagram_valid(jsonb)
  rename to jsonb_grid_transform_diagram_valid_before_quarter_turns;

create function public.jsonb_grid_transform_diagram_valid(p_visual jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  row_count integer;
  column_count integer;
  quarter_turn_count integer;
  center_row integer;
  center_column integer;
  source_item jsonb;
  expected_cells jsonb := '[]'::jsonb;
  current_row integer;
  current_column integer;
  next_row integer;
  next_column integer;
  turn_index integer;
begin
  if not (p_visual ? 'quarterTurns') then
    return public.jsonb_grid_transform_diagram_valid_before_quarter_turns(p_visual);
  end if;
  if p_visual ->> 'kind' <> 'grid-transform-diagram'
    or p_visual ->> 'mode' <> 'rotate'
    or p_visual ->> 'turn' not in ('clockwise', 'counterclockwise')
    or not public.jsonb_integer_at_least(p_visual -> 'rows', 4)
    or not public.jsonb_integer_at_least(p_visual -> 'columns', 4)
    or not public.jsonb_integer_at_least(p_visual -> 'quarterTurns', 1)
    or (p_visual ->> 'rows')::integer > 8
    or (p_visual ->> 'columns')::integer > 8
    or (p_visual ->> 'quarterTurns')::integer > 3
    or not public.jsonb_object_has_only_keys(
      p_visual,
      array['kind','mode','rows','columns','sourceCells','targetCells',
        'sourceMarker','targetMarker','center','turn','quarterTurns']
    )
  then return false; end if;
  row_count := (p_visual ->> 'rows')::integer;
  column_count := (p_visual ->> 'columns')::integer;
  quarter_turn_count := (p_visual ->> 'quarterTurns')::integer;
  if not public.jsonb_grid_cells_valid(p_visual -> 'sourceCells', row_count, column_count)
    or not public.jsonb_grid_cells_valid(p_visual -> 'targetCells', row_count, column_count)
    or jsonb_array_length(p_visual -> 'sourceCells') <> jsonb_array_length(p_visual -> 'targetCells')
    or not public.jsonb_grid_cell_valid(p_visual -> 'center', row_count, column_count)
  then return false; end if;
  center_row := (p_visual #>> '{center,row}')::integer;
  center_column := (p_visual #>> '{center,column}')::integer;
  for source_item in select value from jsonb_array_elements(p_visual -> 'sourceCells') loop
    current_row := (source_item ->> 'row')::integer;
    current_column := (source_item ->> 'column')::integer;
    for turn_index in 1..quarter_turn_count loop
      if p_visual ->> 'turn' = 'clockwise' then
        next_row := center_row + current_column - center_column;
        next_column := center_column - current_row + center_row;
      else
        next_row := center_row - current_column + center_column;
        next_column := center_column + current_row - center_row;
      end if;
      current_row := next_row;
      current_column := next_column;
    end loop;
    if current_row < 0 or current_row >= row_count
      or current_column < 0 or current_column >= column_count
    then return false; end if;
    expected_cells := expected_cells || jsonb_build_array(
      jsonb_build_object('row', current_row, 'column', current_column)
    );
  end loop;
  if not expected_cells @> (p_visual -> 'targetCells')
    or not (p_visual -> 'targetCells') @> expected_cells
  then return false; end if;
  if (p_visual ? 'sourceMarker') <> (p_visual ? 'targetMarker') then return false; end if;
  if p_visual ? 'sourceMarker' then
    if not (p_visual -> 'sourceCells') @> jsonb_build_array(p_visual -> 'sourceMarker')
      or not (p_visual -> 'targetCells') @> jsonb_build_array(p_visual -> 'targetMarker')
    then return false; end if;
    current_row := (p_visual #>> '{sourceMarker,row}')::integer;
    current_column := (p_visual #>> '{sourceMarker,column}')::integer;
    for turn_index in 1..quarter_turn_count loop
      if p_visual ->> 'turn' = 'clockwise' then
        next_row := center_row + current_column - center_column;
        next_column := center_column - current_row + center_row;
      else
        next_row := center_row - current_column + center_column;
        next_column := center_column + current_row - center_row;
      end if;
      current_row := next_row;
      current_column := next_column;
    end loop;
    if (p_visual #>> '{targetMarker,row}')::integer <> current_row
      or (p_visual #>> '{targetMarker,column}')::integer <> current_column
    then return false; end if;
  end if;
  return true;
exception when others then
  return false;
end;
$$;

alter function public.jsonb_object_has_only_keys(jsonb, text[])
  rename to jsonb_object_has_only_keys_before_upper_grade_visuals;

create or replace function public.jsonb_object_has_only_keys(p_object jsonb, p_allowed text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_allowed = array['kind'] and p_object ->> 'kind' = 'solid-diagram' then
    return public.jsonb_solid_diagram_valid(p_object);
  end if;
  if p_allowed = array['kind'] and p_object ->> 'kind' = 'part-chart-diagram' then
    return public.jsonb_part_chart_diagram_valid(p_object);
  end if;
  if p_object ->> 'kind' = 'circle'
    and p_allowed = array['kind','mode','radiusValue','showCenter','showRadius','showDiameter']
  then
    return public.jsonb_object_has_only_keys_before_upper_grade_visuals(
      p_object,
      array['kind','mode','radiusValue','diameterValue','measurementUnit','showCenter','showRadius','showDiameter']
    )
      and not (p_object ? 'radiusValue' and p_object ? 'diameterValue')
      and (not (p_object ? 'diameterValue') or p_object ->> 'mode' = 'diameter')
      and (not (p_object ? 'measurementUnit') or (
        (p_object ? 'radiusValue' or p_object ? 'diameterValue')
        and p_object ->> 'measurementUnit' in ('cm', 'm')
      ));
  end if;
  if p_object ->> 'kind' = 'grid-transform-diagram'
    and p_allowed = array[
      'kind','mode','rows','columns','sourceCells','targetCells','sourceMarker',
      'targetMarker','axisIndex','center','direction','amount','turn','points'
    ]
  then
    return public.jsonb_object_has_only_keys_before_upper_grade_visuals(
      p_object,
      array[
        'kind','mode','rows','columns','sourceCells','targetCells','sourceMarker',
        'targetMarker','axisIndex','center','direction','amount','turn','quarterTurns','points'
      ]
    );
  end if;
  return public.jsonb_object_has_only_keys_before_upper_grade_visuals(p_object, p_allowed);
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_runtime_before_upper_grade_visuals;

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
    perform public.assert_runtime_before_upper_grade_visuals(p_content);
    return;
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_content -> 'judgments') judgment
    where (judgment #>> '{visual,kind}' = 'solid-diagram'
      and not public.jsonb_solid_diagram_valid(judgment -> 'visual'))
      or (judgment #>> '{visual,kind}' = 'part-chart-diagram'
      and not public.jsonb_part_chart_diagram_valid(judgment -> 'visual'))
  ) then raise exception 'judgment runtime schema is invalid'; end if;
  normalized_content := jsonb_set(
    p_content,
    '{judgments}',
    coalesce((
      select jsonb_agg(
        case when judgment #>> '{visual,kind}' in ('solid-diagram', 'part-chart-diagram')
          then jsonb_set(judgment, '{visual}', '{"kind":"none"}'::jsonb, true)
          else judgment end order by ordinal
      )
      from jsonb_array_elements(p_content -> 'judgments')
        with ordinality rows(judgment, ordinal)
    ), '[]'::jsonb),
    true
  );
  perform public.assert_runtime_before_upper_grade_visuals(normalized_content);
end;
$$;

revoke all on function public.jsonb_solid_diagram_valid(jsonb) from public, anon, authenticated;
revoke all on function public.jsonb_part_chart_diagram_valid(jsonb) from public, anon, authenticated;
revoke all on function public.jsonb_grid_transform_diagram_valid_before_quarter_turns(jsonb) from public, anon, authenticated;
revoke all on function public.jsonb_grid_transform_diagram_valid(jsonb) from public, anon, authenticated;
revoke all on function public.jsonb_object_has_only_keys_before_upper_grade_visuals(jsonb, text[]) from public, anon, authenticated;
revoke all on function public.jsonb_object_has_only_keys(jsonb, text[]) from public, anon, authenticated;
revoke all on function public.assert_runtime_before_upper_grade_visuals(jsonb) from public, anon, authenticated;
revoke all on function public.assert_diagnosis_runtime_schema(jsonb) from public, anon, authenticated;
