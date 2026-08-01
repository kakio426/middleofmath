-- A3-5 independent-review hardening.
-- Mirror the TypeScript polygon and triangular-lattice geometry oracles in SQL
-- before grade4-semester2 is eligible for publication.

create or replace function public.jsonb_triangle_cell_key(p_cell jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select (p_cell ->> 0) || ':' || (p_cell ->> 1) || ':' || (p_cell ->> 2)
$$;

create or replace function public.triangle_lattice_edge_key(
  p_ax integer, p_ay integer, p_bx integer, p_by integer
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when format('%s:%s', p_ax, p_ay) <= format('%s:%s', p_bx, p_by)
      then format('%s:%s|%s:%s', p_ax, p_ay, p_bx, p_by)
    else format('%s:%s|%s:%s', p_bx, p_by, p_ax, p_ay)
  end
$$;

create or replace function public.jsonb_triangle_cell_edge_keys(p_cell jsonb)
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  c integer := (p_cell ->> 0)::integer;
  r integer := (p_cell ->> 1)::integer;
begin
  if p_cell ->> 2 = 'up' then
    return array[
      public.triangle_lattice_edge_key(c, r, c + 1, r),
      public.triangle_lattice_edge_key(c + 1, r, c, r + 1),
      public.triangle_lattice_edge_key(c, r + 1, c, r)
    ];
  end if;
  return array[
    public.triangle_lattice_edge_key(c + 1, r, c, r + 1),
    public.triangle_lattice_edge_key(c, r + 1, c + 1, r + 1),
    public.triangle_lattice_edge_key(c + 1, r + 1, c + 1, r)
  ];
end;
$$;

create or replace function public.jsonb_triangle_cells_contain(
  p_cells jsonb,
  p_cell jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select exists (
    select 1 from jsonb_array_elements(p_cells) item(value)
    where item.value = p_cell
  )
$$;

create or replace function public.jsonb_triangle_cells_connected(p_cells jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  cell_count integer;
  visited integer[] := array[0];
  changed boolean := true;
  candidate_index integer;
  reached_index integer;
begin
  if jsonb_typeof(p_cells) is distinct from 'array' then return false; end if;
  cell_count := jsonb_array_length(p_cells);
  if cell_count = 0 then return false; end if;
  while changed loop
    changed := false;
    for candidate_index in 0..cell_count - 1 loop
      if candidate_index = any(visited) then continue; end if;
      foreach reached_index in array visited loop
        if public.jsonb_triangle_cell_edge_keys(p_cells -> candidate_index)
          && public.jsonb_triangle_cell_edge_keys(p_cells -> reached_index)
        then
          visited := array_append(visited, candidate_index);
          changed := true;
          exit;
        end if;
      end loop;
    end loop;
  end loop;
  return cardinality(visited) = cell_count;
end;
$$;

create or replace function public.jsonb_rotate_triangle_cell(p_cell jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case p_cell ->> 2
    when 'up' then jsonb_build_array(
      -(p_cell ->> 1)::integer - 1,
      (p_cell ->> 0)::integer + (p_cell ->> 1)::integer,
      'down'
    )
    else jsonb_build_array(
      -(p_cell ->> 1)::integer - 1,
      (p_cell ->> 0)::integer + (p_cell ->> 1)::integer + 1,
      'up'
    )
  end
$$;

create or replace function public.jsonb_triangle_cells_rotated(
  p_cells jsonb,
  p_turns integer
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  result_cells jsonb := p_cells;
  turn_index integer;
begin
  if p_turns <= 0 then return result_cells; end if;
  for turn_index in 1..p_turns loop
    select coalesce(jsonb_agg(public.jsonb_rotate_triangle_cell(cell) order by ordinal), '[]'::jsonb)
    into result_cells
    from jsonb_array_elements(result_cells) with ordinality source(cell, ordinal);
  end loop;
  return result_cells;
end;
$$;

create or replace function public.jsonb_triangle_cells_translated(
  p_cells jsonb,
  p_column_delta integer,
  p_row_delta integer
)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_array(
      (cell ->> 0)::integer + p_column_delta,
      (cell ->> 1)::integer + p_row_delta,
      cell ->> 2
    ) order by ordinal
  ), '[]'::jsonb)
  from jsonb_array_elements(p_cells) with ordinality source(cell, ordinal)
$$;

create or replace function public.jsonb_pattern_block_area(p_piece text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_piece
    when 'triangle' then 1
    when 'rhombus' then 2
    when 'trapezoid' then 3
    when 'hexagon' then 6
    else null
  end
$$;

create or replace function public.jsonb_pattern_block_template(p_piece text)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case p_piece
    when 'triangle' then '[[0,0,"up"]]'::jsonb
    when 'rhombus' then '[[0,0,"up"],[0,0,"down"]]'::jsonb
    when 'trapezoid' then '[[0,0,"up"],[0,0,"down"],[1,0,"up"]]'::jsonb
    when 'hexagon' then '[[0,0,"up"],[-1,0,"up"],[0,-1,"up"],[-1,-1,"down"],[-1,0,"down"],[0,-1,"down"]]'::jsonb
    else null
  end
$$;

create or replace function public.jsonb_triangle_cells_can_tile(
  p_region jsonb,
  p_pieces jsonb,
  p_piece_index integer default 0
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  region_count integer;
  piece_count integer;
  total_area integer;
  piece_names text[];
  piece_name text;
  cached_piece text := null;
  template_cells jsonb;
  rotated_cells jsonb;
  translated_cells jsonb;
  target_cell jsonb;
  source_cell jsonb;
  translated_cell jsonb;
  turn_index integer;
  piece_index integer;
  column_delta integer;
  row_delta integer;
  region_index integer;
  placement_mask bigint;
  used_mask bigint;
  next_mask bigint;
  full_mask bigint;
  placements bigint[] := array[]::bigint[];
  states bigint[] := array[0::bigint];
  next_states bigint[];
  placement_valid boolean;
begin
  if jsonb_typeof(p_region) is distinct from 'array'
    or jsonb_typeof(p_pieces) is distinct from 'array'
  then return false; end if;
  region_count := jsonb_array_length(p_region);
  if p_piece_index < 0 or p_piece_index > jsonb_array_length(p_pieces)
    or region_count > 12
  then return false; end if;
  piece_count := jsonb_array_length(p_pieces) - p_piece_index;
  if piece_count = 0 then return region_count = 0; end if;
  if region_count = 0 or piece_count > 12 then return false; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_pieces) with ordinality item(value, ordinal)
    where ordinal > p_piece_index
      and public.jsonb_pattern_block_area(value #>> '{}') is null
  ) then return false; end if;

  select array_agg(piece_value order by piece_area desc, ordinal), sum(piece_area)
  into piece_names, total_area
  from (
    select
      item.value #>> '{}' as piece_value,
      public.jsonb_pattern_block_area(item.value #>> '{}') as piece_area,
      item.ordinal
    from jsonb_array_elements(p_pieces) with ordinality item(value, ordinal)
    where item.ordinal > p_piece_index
  ) ordered_pieces;
  if total_area <> region_count then return false; end if;
  full_mask := (1::bigint << region_count) - 1;

  for piece_index in 1..cardinality(piece_names) loop
    piece_name := piece_names[piece_index];
    if cached_piece is distinct from piece_name then
      cached_piece := piece_name;
      placements := array[]::bigint[];
      template_cells := public.jsonb_pattern_block_template(piece_name);
      for turn_index in 0..5 loop
        rotated_cells := public.jsonb_triangle_cells_rotated(template_cells, turn_index);
        for target_cell in select value from jsonb_array_elements(p_region) loop
          for source_cell in select value from jsonb_array_elements(rotated_cells) loop
            if source_cell ->> 2 is distinct from target_cell ->> 2 then continue; end if;
            column_delta := (target_cell ->> 0)::integer
              - (source_cell ->> 0)::integer;
            row_delta := (target_cell ->> 1)::integer
              - (source_cell ->> 1)::integer;
            translated_cells := public.jsonb_triangle_cells_translated(
              rotated_cells, column_delta, row_delta
            );
            placement_mask := 0;
            placement_valid := true;
            for translated_cell in
              select value from jsonb_array_elements(translated_cells)
            loop
              select region.ordinal - 1
              into region_index
              from jsonb_array_elements(p_region) with ordinality region(value, ordinal)
              where public.jsonb_triangle_cell_key(region.value)
                = public.jsonb_triangle_cell_key(translated_cell)
              limit 1;
              if not found then
                placement_valid := false;
                exit;
              end if;
              placement_mask := placement_mask | (1::bigint << region_index);
            end loop;
            if placement_valid and not placement_mask = any(placements) then
              placements := array_append(placements, placement_mask);
              if cardinality(placements) > 512 then
                raise exception 'exact-cover placement limit exceeded'
                  using errcode = '54000';
              end if;
            end if;
          end loop;
        end loop;
      end loop;
    end if;
    if cardinality(placements) = 0 then return false; end if;

    next_states := array[]::bigint[];
    foreach used_mask in array states loop
      foreach placement_mask in array placements loop
        if (used_mask & placement_mask) <> 0 then continue; end if;
        next_mask := used_mask | placement_mask;
        if not next_mask = any(next_states) then
          next_states := array_append(next_states, next_mask);
          if cardinality(next_states) > 4096 then
            raise exception 'exact-cover state limit exceeded'
              using errcode = '54000';
          end if;
        end if;
      end loop;
    end loop;
    if cardinality(next_states) = 0 then return false; end if;
    states := next_states;
  end loop;
  return full_mask = any(states);
end;
$$;

create or replace function public.integer_segments_intersect(
  p_ax integer, p_ay integer, p_bx integer, p_by integer,
  p_cx integer, p_cy integer, p_dx integer, p_dy integer
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  cross_ab_c bigint := (p_bx - p_ax)::bigint * (p_cy - p_ay)
    - (p_by - p_ay)::bigint * (p_cx - p_ax);
  cross_ab_d bigint := (p_bx - p_ax)::bigint * (p_dy - p_ay)
    - (p_by - p_ay)::bigint * (p_dx - p_ax);
  cross_cd_a bigint := (p_dx - p_cx)::bigint * (p_ay - p_cy)
    - (p_dy - p_cy)::bigint * (p_ax - p_cx);
  cross_cd_b bigint := (p_dx - p_cx)::bigint * (p_by - p_cy)
    - (p_dy - p_cy)::bigint * (p_bx - p_cx);
begin
  if ((cross_ab_c > 0 and cross_ab_d < 0) or (cross_ab_c < 0 and cross_ab_d > 0))
    and ((cross_cd_a > 0 and cross_cd_b < 0) or (cross_cd_a < 0 and cross_cd_b > 0))
  then return true; end if;
  return (cross_ab_c = 0 and p_cx between least(p_ax, p_bx) and greatest(p_ax, p_bx)
      and p_cy between least(p_ay, p_by) and greatest(p_ay, p_by))
    or (cross_ab_d = 0 and p_dx between least(p_ax, p_bx) and greatest(p_ax, p_bx)
      and p_dy between least(p_ay, p_by) and greatest(p_ay, p_by))
    or (cross_cd_a = 0 and p_ax between least(p_cx, p_dx) and greatest(p_cx, p_dx)
      and p_ay between least(p_cy, p_dy) and greatest(p_cy, p_dy))
    or (cross_cd_b = 0 and p_bx between least(p_cx, p_dx) and greatest(p_cx, p_dx)
      and p_by between least(p_cy, p_dy) and greatest(p_cy, p_dy));
end;
$$;

create or replace function public.jsonb_polygon_has_nonadjacent_intersection(
  p_vertices jsonb,
  p_closed boolean
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  vertex_count integer := jsonb_array_length(p_vertices);
  edge_count integer;
  left_index integer;
  right_index integer;
  left_next integer;
  right_next integer;
begin
  edge_count := case when p_closed then vertex_count else vertex_count - 1 end;
  for left_index in 0..edge_count - 1 loop
    left_next := (left_index + 1) % vertex_count;
    for right_index in left_index + 1..edge_count - 1 loop
      right_next := (right_index + 1) % vertex_count;
      if left_index = right_index or left_next = right_index or right_next = left_index
      then continue; end if;
      if public.integer_segments_intersect(
        (p_vertices -> left_index ->> 0)::integer,
        (p_vertices -> left_index ->> 1)::integer,
        (p_vertices -> left_next ->> 0)::integer,
        (p_vertices -> left_next ->> 1)::integer,
        (p_vertices -> right_index ->> 0)::integer,
        (p_vertices -> right_index ->> 1)::integer,
        (p_vertices -> right_next ->> 0)::integer,
        (p_vertices -> right_next ->> 1)::integer
      ) then return true; end if;
    end loop;
  end loop;
  return false;
end;
$$;

alter function public.jsonb_polygon_outline_valid(jsonb)
  rename to jsonb_polygon_outline_shape_valid;

create function public.jsonb_polygon_outline_valid(p_outline jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_form text;
  intersects boolean;
begin
  if not public.jsonb_polygon_outline_shape_valid(p_outline) then return false; end if;
  current_form := p_outline ->> 'form';
  if current_form in ('regular', 'equiangular') then return true; end if;
  intersects := public.jsonb_polygon_has_nonadjacent_intersection(
    p_outline -> 'vertices', current_form <> 'open'
  );
  return case when current_form = 'crossing' then intersects else not intersects end;
end;
$$;

create or replace function public.jsonb_polygon_lattice_all_sides_equal(p_outline jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  vertices jsonb := p_outline -> 'vertices';
  vertex_count integer := jsonb_array_length(vertices);
  item_index integer;
  next_index integer;
  length_squared bigint;
  reference_length bigint := null;
begin
  for item_index in 0..vertex_count - 1 loop
    next_index := (item_index + 1) % vertex_count;
    length_squared :=
      ((vertices -> next_index ->> 0)::integer - (vertices -> item_index ->> 0)::integer)::bigint ^ 2
      + ((vertices -> next_index ->> 1)::integer - (vertices -> item_index ->> 1)::integer)::bigint ^ 2;
    if reference_length is null then reference_length := length_squared;
    elsif length_squared <> reference_length then return false; end if;
  end loop;
  return true;
end;
$$;

create or replace function public.jsonb_polygon_lattice_all_angles_equal(p_outline jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  vertices jsonb := p_outline -> 'vertices';
  vertex_count integer := jsonb_array_length(vertices);
  item_index integer;
  previous_index integer;
  next_index integer;
  first_x bigint;
  first_y bigint;
  second_x bigint;
  second_y bigint;
  dot_value bigint;
  first_length bigint;
  second_length bigint;
  reference_dot bigint := null;
  reference_first_length bigint;
  reference_second_length bigint;
begin
  for item_index in 0..vertex_count - 1 loop
    previous_index := (item_index + vertex_count - 1) % vertex_count;
    next_index := (item_index + 1) % vertex_count;
    first_x := (vertices -> previous_index ->> 0)::integer
      - (vertices -> item_index ->> 0)::integer;
    first_y := (vertices -> previous_index ->> 1)::integer
      - (vertices -> item_index ->> 1)::integer;
    second_x := (vertices -> next_index ->> 0)::integer
      - (vertices -> item_index ->> 0)::integer;
    second_y := (vertices -> next_index ->> 1)::integer
      - (vertices -> item_index ->> 1)::integer;
    dot_value := first_x * second_x + first_y * second_y;
    first_length := first_x * first_x + first_y * first_y;
    second_length := second_x * second_x + second_y * second_y;
    if reference_dot is null then
      reference_dot := dot_value;
      reference_first_length := first_length;
      reference_second_length := second_length;
    elsif (reference_dot < 0) <> (dot_value < 0)
      or reference_dot * reference_dot * first_length * second_length
        <> dot_value * dot_value * reference_first_length * reference_second_length
    then return false; end if;
  end loop;
  return true;
end;
$$;

create or replace function public.jsonb_polygon_outline_is_regular(p_outline jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if not public.jsonb_polygon_outline_valid(p_outline) then return false; end if;
  if p_outline ->> 'form' = 'regular' then return true; end if;
  if p_outline ->> 'form' <> 'lattice' then return false; end if;
  return public.jsonb_polygon_lattice_all_sides_equal(p_outline)
    and public.jsonb_polygon_lattice_all_angles_equal(p_outline);
end;
$$;

create or replace function public.jsonb_polygon_outline_is_concave(p_outline jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  vertices jsonb := p_outline -> 'vertices';
  vertex_count integer;
  item_index integer;
  previous_index integer;
  next_index integer;
  cross_value bigint;
  has_positive boolean := false;
  has_negative boolean := false;
begin
  if p_outline ->> 'form' <> 'lattice'
    or not public.jsonb_polygon_outline_valid(p_outline)
  then return false; end if;
  vertex_count := jsonb_array_length(vertices);
  for item_index in 0..vertex_count - 1 loop
    previous_index := (item_index + vertex_count - 1) % vertex_count;
    next_index := (item_index + 1) % vertex_count;
    cross_value :=
      ((vertices -> item_index ->> 0)::integer - (vertices -> previous_index ->> 0)::integer)::bigint
        * ((vertices -> next_index ->> 1)::integer - (vertices -> item_index ->> 1)::integer)
      - ((vertices -> item_index ->> 1)::integer - (vertices -> previous_index ->> 1)::integer)::bigint
        * ((vertices -> next_index ->> 0)::integer - (vertices -> item_index ->> 0)::integer);
    has_positive := has_positive or cross_value > 0;
    has_negative := has_negative or cross_value < 0;
  end loop;
  return has_positive and has_negative;
end;
$$;

create or replace function public.jsonb_polygon_side_ratio_clear(p_outline jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  vertices jsonb := p_outline -> 'vertices';
  vertex_count integer := jsonb_array_length(vertices);
  item_index integer;
  next_index integer;
  length_squared bigint;
  minimum_length bigint := null;
  maximum_length bigint := null;
begin
  for item_index in 0..vertex_count - 1 loop
    next_index := (item_index + 1) % vertex_count;
    length_squared :=
      ((vertices -> next_index ->> 0)::integer - (vertices -> item_index ->> 0)::integer)::bigint ^ 2
      + ((vertices -> next_index ->> 1)::integer - (vertices -> item_index ->> 1)::integer)::bigint ^ 2;
    minimum_length := least(coalesce(minimum_length, length_squared), length_squared);
    maximum_length := greatest(coalesce(maximum_length, length_squared), length_squared);
  end loop;
  return 25 * maximum_length >= 49 * minimum_length;
end;
$$;

create or replace function public.jsonb_polygon_figure_valid(p_visual jsonb)
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
  sides_only_count integer := 0;
  angles_only_count integer := 0;
  all_sides_equal boolean;
  all_angles_equal boolean;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'polygon-figure'
    or p_visual ->> 'mode' not in ('polygon-select', 'side-count-name', 'regular-select')
  then return false; end if;
  current_mode := p_visual ->> 'mode';
  if current_mode = 'side-count-name' then
    return public.jsonb_object_has_only_keys(p_visual, array['kind', 'mode', 'figure'])
      and p_visual #>> '{figure,form}' = 'lattice'
      and public.jsonb_polygon_outline_valid(p_visual -> 'figure')
      and public.jsonb_polygon_outline_is_concave(p_visual -> 'figure')
      and not public.jsonb_polygon_outline_is_regular(p_visual -> 'figure')
      and public.jsonb_polygon_side_ratio_clear(p_visual -> 'figure');
  end if;
  if not public.jsonb_object_has_only_keys(p_visual, array['kind', 'mode', 'candidates'])
    or jsonb_typeof(p_visual -> 'candidates') is distinct from 'array'
    or jsonb_array_length(p_visual -> 'candidates') <> 3
  then return false; end if;
  if (
    select count(distinct value ->> 'id') <> 3
      or string_agg(value ->> 'id', '' order by value ->> 'id') <> '가나다'
    from jsonb_array_elements(p_visual -> 'candidates') candidate(value)
  ) then return false; end if;
  for item_index in 0..2 loop
    candidate_value := p_visual -> 'candidates' -> item_index;
    if not public.jsonb_object_has_only_keys(candidate_value, array['id', 'figure'])
      or not public.jsonb_polygon_outline_valid(candidate_value -> 'figure')
      or candidate_value #>> '{figure,form}' = 'crossing'
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
    lattice_count := lattice_count + (figure_value ->> 'form' = 'lattice')::integer;
    curved_count := curved_count + (figure_value ->> 'form' = 'curved')::integer;
    open_count := open_count + (figure_value ->> 'form' = 'open')::integer;
    if current_mode = 'regular-select' then
      all_sides_equal := case figure_value ->> 'form'
        when 'regular' then true
        when 'equiangular' then false
        when 'lattice' then public.jsonb_polygon_lattice_all_sides_equal(figure_value)
        else false end;
      all_angles_equal := case figure_value ->> 'form'
        when 'regular' then true
        when 'equiangular' then true
        when 'lattice' then public.jsonb_polygon_lattice_all_angles_equal(figure_value)
        else false end;
      regular_count := regular_count + (all_sides_equal and all_angles_equal)::integer;
      sides_only_count := sides_only_count + (all_sides_equal and not all_angles_equal)::integer;
      angles_only_count := angles_only_count + (not all_sides_equal and all_angles_equal)::integer;
    end if;
  end loop;
  if current_mode = 'polygon-select' then
    return lattice_count = 1 and curved_count = 1 and open_count = 1;
  end if;
  return regular_count = 1 and sides_only_count = 1 and angles_only_count = 1;
end;
$$;

create or replace function public.jsonb_tile_composition_valid(p_visual jsonb)
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
  candidate_area integer;
  hole_area integer;
  pieces jsonb;
  placed_cells jsonb := '[]'::jsonb;
  hole_cells jsonb;
  fits boolean;
  fit_count integer := 0;
  has_equal_area_nonfit boolean := false;
  has_smaller_nonfit boolean := false;
  cell_value jsonb;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'tile-composition'
    or p_visual ->> 'mode' not in ('fill-remaining', 'tile-count')
  then return false; end if;
  current_mode := p_visual ->> 'mode';
  if current_mode = 'tile-count' then
    if not public.jsonb_object_has_only_keys(p_visual, array['kind', 'mode', 'region', 'piece'])
      or public.jsonb_pattern_block_area(p_visual ->> 'piece') is null
      or not public.jsonb_triangle_cells_valid(p_visual -> 'region', 3, 12)
      or not public.jsonb_triangle_cells_connected(p_visual -> 'region')
    then return false; end if;
    piece_area := public.jsonb_pattern_block_area(p_visual ->> 'piece');
    if jsonb_array_length(p_visual -> 'region') % piece_area <> 0 then return false; end if;
    pieces := '[]'::jsonb;
    for item_index in 1..jsonb_array_length(p_visual -> 'region') / piece_area loop
      pieces := pieces || jsonb_build_array(p_visual ->> 'piece');
    end loop;
    return public.jsonb_triangle_cells_can_tile(p_visual -> 'region', pieces);
  end if;
  if not public.jsonb_object_has_only_keys(
      p_visual, array['kind', 'mode', 'board', 'placed', 'candidates']
    )
    or not public.jsonb_triangle_cells_valid(p_visual -> 'board', 3, 12)
    or not public.jsonb_triangle_cells_connected(p_visual -> 'board')
    or jsonb_typeof(p_visual -> 'placed') is distinct from 'array'
    or jsonb_array_length(p_visual -> 'placed') not between 1 and 4
    or jsonb_typeof(p_visual -> 'candidates') is distinct from 'array'
    or jsonb_array_length(p_visual -> 'candidates') <> 3
  then return false; end if;
  for item_index in 0..jsonb_array_length(p_visual -> 'placed') - 1 loop
    item_value := p_visual -> 'placed' -> item_index;
    if not public.jsonb_object_has_only_keys(item_value, array['piece', 'cells'])
      or public.jsonb_pattern_block_area(item_value ->> 'piece') is null
      or not public.jsonb_triangle_cells_valid(
        item_value -> 'cells', 1, public.jsonb_pattern_block_area(item_value ->> 'piece')
      )
      or jsonb_array_length(item_value -> 'cells')
        <> public.jsonb_pattern_block_area(item_value ->> 'piece')
      or not public.jsonb_triangle_cells_can_tile(
        item_value -> 'cells', jsonb_build_array(item_value ->> 'piece')
      )
    then return false; end if;
    for cell_value in select value from jsonb_array_elements(item_value -> 'cells') loop
      if not public.jsonb_triangle_cells_contain(p_visual -> 'board', cell_value)
        or public.jsonb_triangle_cells_contain(placed_cells, cell_value)
      then return false; end if;
      placed_cells := placed_cells || jsonb_build_array(cell_value);
    end loop;
  end loop;
  select coalesce(jsonb_agg(board_cell order by ordinal), '[]'::jsonb)
  into hole_cells
  from jsonb_array_elements(p_visual -> 'board') with ordinality board(board_cell, ordinal)
  where not public.jsonb_triangle_cells_contain(placed_cells, board_cell);
  hole_area := jsonb_array_length(hole_cells);
  if hole_area = 0 or not public.jsonb_triangle_cells_connected(hole_cells)
  then return false; end if;
  if (
    select count(distinct value ->> 'id') <> 3
      or string_agg(value ->> 'id', '' order by value ->> 'id') <> '가나다'
    from jsonb_array_elements(p_visual -> 'candidates') candidate(value)
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
      piece_area := public.jsonb_pattern_block_area(piece_value #>> '{}');
      if piece_area is null then return false; end if;
      candidate_area := candidate_area + piece_area;
    end loop;
    fits := public.jsonb_triangle_cells_can_tile(hole_cells, item_value -> 'pieces');
    fit_count := fit_count + fits::integer;
    has_equal_area_nonfit := has_equal_area_nonfit
      or (not fits and candidate_area = hole_area);
    has_smaller_nonfit := has_smaller_nonfit
      or (not fits and candidate_area < hole_area);
  end loop;
  return fit_count = 1 and has_equal_area_nonfit and has_smaller_nonfit;
end;
$$;

revoke all on function public.jsonb_triangle_cell_key(jsonb) from public;
revoke all on function public.triangle_lattice_edge_key(integer, integer, integer, integer) from public;
revoke all on function public.jsonb_triangle_cell_edge_keys(jsonb) from public;
revoke all on function public.jsonb_triangle_cells_contain(jsonb, jsonb) from public;
revoke all on function public.jsonb_triangle_cells_connected(jsonb) from public;
revoke all on function public.jsonb_rotate_triangle_cell(jsonb) from public;
revoke all on function public.jsonb_triangle_cells_rotated(jsonb, integer) from public;
revoke all on function public.jsonb_triangle_cells_translated(jsonb, integer, integer) from public;
revoke all on function public.jsonb_pattern_block_area(text) from public;
revoke all on function public.jsonb_pattern_block_template(text) from public;
revoke all on function public.jsonb_triangle_cells_can_tile(jsonb, jsonb, integer) from public;
revoke all on function public.integer_segments_intersect(integer, integer, integer, integer, integer, integer, integer, integer) from public;
revoke all on function public.jsonb_polygon_has_nonadjacent_intersection(jsonb, boolean) from public;
revoke all on function public.jsonb_polygon_outline_shape_valid(jsonb) from public;
revoke all on function public.jsonb_polygon_outline_valid(jsonb) from public;
revoke all on function public.jsonb_polygon_lattice_all_sides_equal(jsonb) from public;
revoke all on function public.jsonb_polygon_lattice_all_angles_equal(jsonb) from public;
revoke all on function public.jsonb_polygon_outline_is_regular(jsonb) from public;
revoke all on function public.jsonb_polygon_outline_is_concave(jsonb) from public;
revoke all on function public.jsonb_polygon_side_ratio_clear(jsonb) from public;
revoke all on function public.jsonb_polygon_figure_valid(jsonb) from public;
revoke all on function public.jsonb_tile_composition_valid(jsonb) from public;
revoke all on function public.jsonb_object_has_only_keys(jsonb, text[]) from public;
revoke all on function public.assert_distractor_note_coverage(text, text) from public;
revoke all on function public.assert_distractor_note_coverage(text, text) from anon, authenticated;
