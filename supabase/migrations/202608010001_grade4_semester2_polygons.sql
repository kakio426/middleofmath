-- 4학년 2학기 다각형·모양 채우기 시각 계약.
-- A3-5는 review 상태이므로 콘텐츠를 발행하지 않고, 향후 저장되는
-- 좌표·삼각형 격자 자료가 런타임 스키마를 우회하지 못하게 한다.

create or replace function public.jsonb_triangle_cells_valid(
  p_cells jsonb,
  p_minimum integer default 1,
  p_maximum integer default 12
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  cell_value jsonb;
  item_index integer;
begin
  if jsonb_typeof(p_cells) is distinct from 'array'
    or jsonb_array_length(p_cells) not between p_minimum and p_maximum
  then return false; end if;

  for item_index in 0..jsonb_array_length(p_cells) - 1 loop
    cell_value := p_cells -> item_index;
    if jsonb_typeof(cell_value) is distinct from 'array'
      or jsonb_array_length(cell_value) <> 3
      or not public.jsonb_integer_at_least(cell_value -> 0, 0)
      or not public.jsonb_integer_at_least(cell_value -> 1, 0)
      or (cell_value ->> 0)::integer > 8
      or (cell_value ->> 1)::integer > 8
      or cell_value ->> 2 not in ('up', 'down')
    then return false; end if;
  end loop;

  return (
    select count(distinct value) = jsonb_array_length(p_cells)
    from jsonb_array_elements(p_cells) values_table(value)
  );
end;
$$;

create or replace function public.jsonb_polygon_outline_valid(
  p_outline jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_form text;
  vertices jsonb;
  lengths jsonb;
  point_value jsonb;
  item_index integer;
  previous_index integer;
  current_index integer;
  next_index integer;
  x integer[] := array[]::integer[];
  y integer[] := array[]::integer[];
  vertex_count integer;
  side_count integer;
  cross_value integer;
begin
  if jsonb_typeof(p_outline) is distinct from 'object'
    or not (p_outline ? 'form')
  then return false; end if;
  current_form := p_outline ->> 'form';

  if current_form = 'regular' then
    return public.jsonb_object_has_only_keys(
        p_outline, array['form', 'sideCount', 'rotationDegrees']
      )
      and public.jsonb_integer_at_least(p_outline -> 'sideCount', 3)
      and (p_outline ->> 'sideCount')::integer <= 8
      and public.jsonb_integer_at_least(p_outline -> 'rotationDegrees', 0)
      and (p_outline ->> 'rotationDegrees')::integer < 360
      and (p_outline ->> 'rotationDegrees')::integer % 5 = 0;
  end if;

  if current_form = 'equiangular' then
    if not public.jsonb_object_has_only_keys(
        p_outline, array['form', 'sideCount', 'sideLengths']
      )
      or not public.jsonb_integer_at_least(p_outline -> 'sideCount', 4)
      or (p_outline ->> 'sideCount')::integer not in (4, 6)
      or jsonb_typeof(p_outline -> 'sideLengths') is distinct from 'array'
      or jsonb_array_length(p_outline -> 'sideLengths')
        <> (p_outline ->> 'sideCount')::integer
    then return false; end if;
    lengths := p_outline -> 'sideLengths';
    for item_index in 0..jsonb_array_length(lengths) - 1 loop
      if not public.jsonb_integer_at_least(lengths -> item_index, 1)
        or (lengths ->> item_index)::integer > 20
      then return false; end if;
    end loop;
    if (
      select count(distinct value) < 2
      from jsonb_array_elements(lengths) value_table(value)
    ) then return false; end if;
    if (p_outline ->> 'sideCount')::integer = 4 then
      return lengths -> 0 = lengths -> 2
        and lengths -> 1 = lengths -> 3;
    end if;
    return (lengths ->> 0)::integer - (lengths ->> 2)::integer
          - (lengths ->> 3)::integer + (lengths ->> 5)::integer = 0
      and (lengths ->> 1)::integer + (lengths ->> 2)::integer
          - (lengths ->> 4)::integer - (lengths ->> 5)::integer = 0;
  end if;

  if current_form not in ('lattice', 'open', 'crossing', 'curved')
  then return false; end if;
  if current_form = 'curved' then
    if not public.jsonb_object_has_only_keys(
      p_outline, array['form', 'vertices', 'curvedSideIndex']
    ) then return false; end if;
  elsif not public.jsonb_object_has_only_keys(
    p_outline, array['form', 'vertices']
  ) then return false; end if;

  vertices := p_outline -> 'vertices';
  if jsonb_typeof(vertices) is distinct from 'array' then return false; end if;
  vertex_count := jsonb_array_length(vertices);
  if (current_form = 'open' and vertex_count not between 4 and 9)
    or (current_form <> 'open' and vertex_count not between 3 and 8)
  then return false; end if;

  for item_index in 0..vertex_count - 1 loop
    point_value := vertices -> item_index;
    if jsonb_typeof(point_value) is distinct from 'array'
      or jsonb_array_length(point_value) <> 2
      or not public.jsonb_integer_at_least(point_value -> 0, 0)
      or not public.jsonb_integer_at_least(point_value -> 1, 0)
      or (point_value ->> 0)::integer > 24
      or (point_value ->> 1)::integer > 24
    then return false; end if;
    x := array_append(x, (point_value ->> 0)::integer);
    y := array_append(y, (point_value ->> 1)::integer);
  end loop;
  if (
    select count(distinct value) <> vertex_count
    from jsonb_array_elements(vertices) value_table(value)
  ) then return false; end if;

  side_count := case when current_form = 'open'
    then vertex_count - 1 else vertex_count end;
  for item_index in 1..case when current_form = 'open'
    then vertex_count - 2 else vertex_count end loop
    if current_form = 'open' then
      previous_index := item_index;
      current_index := item_index + 1;
      next_index := item_index + 2;
    else
      previous_index := case when item_index = 1
        then vertex_count else item_index - 1 end;
      current_index := item_index;
      next_index := case when item_index = vertex_count
        then 1 else item_index + 1 end;
    end if;
    cross_value :=
      (x[current_index] - x[previous_index])
        * (y[next_index] - y[current_index])
      - (y[current_index] - y[previous_index])
        * (x[next_index] - x[current_index]);
    if cross_value = 0 then return false; end if;
  end loop;

  if current_form = 'curved' and (
    not public.jsonb_integer_at_least(p_outline -> 'curvedSideIndex', 0)
    or (p_outline ->> 'curvedSideIndex')::integer >= side_count
  ) then return false; end if;
  return true;
end;
$$;

create or replace function public.jsonb_polygon_figure_valid(
  p_visual jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_mode text;
  candidate_value jsonb;
  figure_value jsonb;
  item_index integer;
  expected_side_count integer := null;
  current_side_count integer;
  lattice_count integer := 0;
  curved_count integer := 0;
  open_count integer := 0;
  regular_count integer := 0;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'polygon-figure'
    or p_visual ->> 'mode' not in (
      'polygon-select', 'side-count-name', 'regular-select'
    )
  then return false; end if;
  current_mode := p_visual ->> 'mode';

  if current_mode = 'side-count-name' then
    return public.jsonb_object_has_only_keys(
        p_visual, array['kind', 'mode', 'figure']
      )
      and p_visual #>> '{figure,form}' = 'lattice'
      and public.jsonb_polygon_outline_valid(p_visual -> 'figure');
  end if;

  if not public.jsonb_object_has_only_keys(
      p_visual, array['kind', 'mode', 'candidates']
    )
    or jsonb_typeof(p_visual -> 'candidates') is distinct from 'array'
    or jsonb_array_length(p_visual -> 'candidates') <> 3
  then return false; end if;
  if (
    select count(distinct value ->> 'id') <> 3
      or string_agg(value ->> 'id', '' order by value ->> 'id') <> '가나다'
    from jsonb_array_elements(p_visual -> 'candidates') value_table(value)
  ) then return false; end if;

  for item_index in 0..2 loop
    candidate_value := p_visual -> 'candidates' -> item_index;
    if not public.jsonb_object_has_only_keys(
        candidate_value, array['id', 'figure']
      )
      or not public.jsonb_polygon_outline_valid(candidate_value -> 'figure')
    then return false; end if;
    figure_value := candidate_value -> 'figure';
    current_side_count := case
      when figure_value ->> 'form' in ('regular', 'equiangular')
        then (figure_value ->> 'sideCount')::integer
      when figure_value ->> 'form' = 'open'
        then jsonb_array_length(figure_value -> 'vertices') - 1
      else jsonb_array_length(figure_value -> 'vertices')
    end;
    if expected_side_count is null then expected_side_count := current_side_count;
    elsif expected_side_count <> current_side_count then return false; end if;
    lattice_count := lattice_count
      + case when figure_value ->> 'form' = 'lattice' then 1 else 0 end;
    curved_count := curved_count
      + case when figure_value ->> 'form' = 'curved' then 1 else 0 end;
    open_count := open_count
      + case when figure_value ->> 'form' = 'open' then 1 else 0 end;
    regular_count := regular_count
      + case when figure_value ->> 'form' = 'regular' then 1 else 0 end;
  end loop;

  if current_mode = 'polygon-select' then
    return lattice_count = 1 and curved_count = 1 and open_count = 1;
  end if;
  return regular_count = 1
    and lattice_count = 1
    and exists (
      select 1 from jsonb_array_elements(p_visual -> 'candidates') candidate
      where candidate #>> '{figure,form}' = 'equiangular'
    );
end;
$$;

create or replace function public.jsonb_tile_composition_valid(
  p_visual jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_mode text;
  item_value jsonb;
  piece_value jsonb;
  item_index integer;
  inner_index integer;
  piece_area integer;
  placed_area integer := 0;
  candidate_area integer;
  hole_area integer;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'tile-composition'
    or p_visual ->> 'mode' not in ('fill-remaining', 'tile-count')
  then return false; end if;
  current_mode := p_visual ->> 'mode';

  if current_mode = 'tile-count' then
    if not public.jsonb_object_has_only_keys(
        p_visual, array['kind', 'mode', 'region', 'piece']
      )
      or p_visual ->> 'piece' not in (
        'triangle', 'rhombus', 'trapezoid', 'hexagon'
      )
      or not public.jsonb_triangle_cells_valid(p_visual -> 'region', 3, 12)
    then return false; end if;
    piece_area := case p_visual ->> 'piece'
      when 'triangle' then 1 when 'rhombus' then 2
      when 'trapezoid' then 3 when 'hexagon' then 6 end;
    return jsonb_array_length(p_visual -> 'region') % piece_area = 0;
  end if;

  if not public.jsonb_object_has_only_keys(
      p_visual, array['kind', 'mode', 'board', 'placed', 'candidates']
    )
    or not public.jsonb_triangle_cells_valid(p_visual -> 'board', 3, 12)
    or jsonb_typeof(p_visual -> 'placed') is distinct from 'array'
    or jsonb_array_length(p_visual -> 'placed') not between 1 and 4
    or jsonb_typeof(p_visual -> 'candidates') is distinct from 'array'
    or jsonb_array_length(p_visual -> 'candidates') <> 3
  then return false; end if;

  for item_index in 0..jsonb_array_length(p_visual -> 'placed') - 1 loop
    item_value := p_visual -> 'placed' -> item_index;
    if not public.jsonb_object_has_only_keys(item_value, array['piece', 'cells'])
      or item_value ->> 'piece' not in (
        'triangle', 'rhombus', 'trapezoid', 'hexagon'
      )
      or not public.jsonb_triangle_cells_valid(item_value -> 'cells', 1, 6)
      or exists (
        select 1 from jsonb_array_elements(item_value -> 'cells') cell
        where not (p_visual -> 'board') @> jsonb_build_array(cell)
      )
    then return false; end if;
    piece_area := case item_value ->> 'piece'
      when 'triangle' then 1 when 'rhombus' then 2
      when 'trapezoid' then 3 when 'hexagon' then 6 end;
    if jsonb_array_length(item_value -> 'cells') <> piece_area
    then return false; end if;
    placed_area := placed_area + piece_area;
  end loop;
  hole_area := jsonb_array_length(p_visual -> 'board') - placed_area;
  if hole_area <= 0 then return false; end if;

  if (
    select count(distinct value ->> 'id') <> 3
      or string_agg(value ->> 'id', '' order by value ->> 'id') <> '가나다'
    from jsonb_array_elements(p_visual -> 'candidates') value_table(value)
  ) then return false; end if;
  for item_index in 0..2 loop
    item_value := p_visual -> 'candidates' -> item_index;
    if not public.jsonb_object_has_only_keys(item_value, array['id', 'pieces'])
      or jsonb_typeof(item_value -> 'pieces') is distinct from 'array'
      or jsonb_array_length(item_value -> 'pieces') not between 1 and 3
    then return false; end if;
    candidate_area := 0;
    for inner_index in 0..jsonb_array_length(item_value -> 'pieces') - 1 loop
      piece_value := item_value -> 'pieces' -> inner_index;
      if piece_value #>> '{}' not in (
        'triangle', 'rhombus', 'trapezoid', 'hexagon'
      ) then return false; end if;
      candidate_area := candidate_area + case piece_value #>> '{}'
        when 'triangle' then 1 when 'rhombus' then 2
        when 'trapezoid' then 3 when 'hexagon' then 6 end;
    end loop;
  end loop;
  return exists (
    select 1
    from jsonb_array_elements(p_visual -> 'candidates') candidate
    where (
      select sum(case piece #>> '{}'
        when 'triangle' then 1 when 'rhombus' then 2
        when 'trapezoid' then 3 when 'hexagon' then 6 end)
      from jsonb_array_elements(candidate -> 'pieces') piece
    ) = hole_area
  );
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_runtime_before_polygon_composition;

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
    perform public.assert_runtime_before_polygon_composition(p_content);
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'judgments') judgment
    where (
      judgment #>> '{visual,kind}' = 'polygon-figure'
      and not public.jsonb_polygon_figure_valid(judgment -> 'visual')
    ) or (
      judgment #>> '{visual,kind}' = 'tile-composition'
      and not public.jsonb_tile_composition_valid(judgment -> 'visual')
    )
  ) then
    raise exception 'judgment runtime schema is invalid';
  end if;

  normalized_content := jsonb_set(
    p_content,
    '{judgments}',
    coalesce((
      select jsonb_agg(
        case when judgment #>> '{visual,kind}' in (
          'polygon-figure', 'tile-composition'
        ) then jsonb_set(
          judgment, '{visual}', '{"kind":"none"}'::jsonb, true
        ) else judgment end
        order by ordinal
      )
      from jsonb_array_elements(p_content -> 'judgments')
        with ordinality rows(judgment, ordinal)
    ), '[]'::jsonb),
    true
  );
  perform public.assert_runtime_before_polygon_composition(normalized_content);
end;
$$;

create or replace function public.jsonb_object_has_only_keys(
  p_object jsonb,
  p_allowed text[]
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_object) is distinct from 'object' then return false; end if;
  if p_allowed = array['kind']
    and p_object ->> 'kind' = 'relation-pattern-diagram' then
    return public.jsonb_relation_pattern_diagram_valid(p_object);
  end if;
  if p_allowed = array['kind']
    and p_object ->> 'kind' = 'bar-chart-diagram' then
    return public.jsonb_bar_chart_diagram_valid(p_object);
  end if;
  if p_allowed = array['kind']
    and p_object ->> 'kind' = 'triangle-figure' then
    return public.jsonb_triangle_figure_valid(p_object);
  end if;
  if p_allowed = array['kind']
    and p_object ->> 'kind' = 'quadrilateral-figure' then
    return public.jsonb_quadrilateral_figure_valid(p_object);
  end if;
  if p_allowed = array['kind']
    and p_object ->> 'kind' = 'polygon-figure' then
    return public.jsonb_polygon_figure_valid(p_object);
  end if;
  if p_allowed = array['kind']
    and p_object ->> 'kind' = 'tile-composition' then
    return public.jsonb_tile_composition_valid(p_object);
  end if;
  return not exists (
    select 1 from jsonb_object_keys(p_object) key_name
    where not (key_name = any(p_allowed))
  );
end;
$$;

revoke all on function public.assert_diagnosis_runtime_schema(jsonb)
  from public;
revoke all on function public.jsonb_triangle_cells_valid(jsonb, integer, integer)
  from public;
revoke all on function public.jsonb_polygon_outline_valid(jsonb)
  from public;
revoke all on function public.jsonb_polygon_figure_valid(jsonb)
  from public;
revoke all on function public.jsonb_tile_composition_valid(jsonb)
  from public;
