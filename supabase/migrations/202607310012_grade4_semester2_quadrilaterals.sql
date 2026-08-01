-- 4학년 2학기 사각형 전용 시각 계약.
-- 화면에 표시하는 수직·평행·거리·같은 변·맞은편 각의 관계를
-- 좌표에서 다시 계산해 잘못된 도형이 저장 계층을 통과하지 못하게 한다.

create or replace function public.jsonb_quadrilateral_figure_valid(
  p_visual jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_mode text;
  vertices jsonb;
  point_value jsonb;
  pair_value jsonb;
  group_value jsonb;
  label_value jsonb;
  distance_value jsonb;
  angle_value jsonb;
  x integer[] := array[]::integer[];
  y integer[] := array[]::integer[];
  side_x integer[] := array[]::integer[];
  side_y integer[] := array[]::integer[];
  side_length_squared integer[] := array[]::integer[];
  turns integer[] := array[]::integer[];
  right_angles boolean[] := array[false, false, false, false];
  declared_right_angles boolean[] := array[false, false, false, false];
  label_seen boolean[] := array[false, false, false, false];
  equal_seen boolean[] := array[false, false, false, false];
  item_index integer;
  inner_index integer;
  next_index integer;
  previous_index integer;
  left_index integer;
  right_index integer;
  base_index integer;
  from_vertex_index integer;
  to_side_index integer;
  length_cm integer;
  dot_value integer;
  cross_value integer;
  actual_parallel_02 boolean := false;
  actual_parallel_13 boolean := false;
  declared_parallel_02 boolean := false;
  declared_parallel_13 boolean := false;
  actual_parallel_count integer := 0;
  perpendicular_count integer := 0;
  parallel_count integer := 0;
  touching_non_perpendicular_count integer := 0;
  right_angle_count integer := 0;
  known_angle_count integer := 0;
  given_angle_index integer := null;
  given_angle integer := null;
  ask_angle_index integer := null;
  projection integer;
  area integer;
  target_side_length_squared integer;
  opposite_side_index integer;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'quadrilateral-figure'
    or p_visual ->> 'mode' not in (
      'side-perpendicular',
      'side-parallel-distance',
      'parallel-classify',
      'equal-side-classify',
      'opposite-angle'
    )
    or exists (
      select 1
      from jsonb_object_keys(p_visual) key_name
      where key_name not in (
        'kind',
        'mode',
        'vertices',
        'baseSideIndex',
        'rightAngleVertexIndexes',
        'parallelSidePairs',
        'equalSideGroups',
        'sideLengthLabels',
        'distanceSegment',
        'angles',
        'askAngleIndex'
      )
    ) then
    return false;
  end if;

  current_mode := p_visual ->> 'mode';

  if current_mode = 'side-perpendicular' and (
    not (p_visual ? 'vertices')
    or not (p_visual ? 'baseSideIndex')
    or not (p_visual ? 'rightAngleVertexIndexes')
    or p_visual ? 'parallelSidePairs'
    or p_visual ? 'equalSideGroups'
    or p_visual ? 'sideLengthLabels'
    or p_visual ? 'distanceSegment'
    or p_visual ? 'angles'
    or p_visual ? 'askAngleIndex'
  ) then return false; end if;

  if current_mode = 'side-parallel-distance' and (
    not (p_visual ? 'vertices')
    or p_visual ? 'baseSideIndex'
    or p_visual ? 'rightAngleVertexIndexes'
    or not (p_visual ? 'parallelSidePairs')
    or p_visual ? 'equalSideGroups'
    or not (p_visual ? 'sideLengthLabels')
    or not (p_visual ? 'distanceSegment')
    or p_visual ? 'angles'
    or p_visual ? 'askAngleIndex'
  ) then return false; end if;

  if current_mode = 'parallel-classify' and (
    not (p_visual ? 'vertices')
    or p_visual ? 'baseSideIndex'
    or p_visual ? 'rightAngleVertexIndexes'
    or not (p_visual ? 'parallelSidePairs')
    or p_visual ? 'equalSideGroups'
    or p_visual ? 'sideLengthLabels'
    or p_visual ? 'distanceSegment'
    or p_visual ? 'angles'
    or p_visual ? 'askAngleIndex'
  ) then return false; end if;

  if current_mode = 'equal-side-classify' and (
    not (p_visual ? 'vertices')
    or p_visual ? 'baseSideIndex'
    or p_visual ? 'rightAngleVertexIndexes'
    or p_visual ? 'parallelSidePairs'
    or not (p_visual ? 'equalSideGroups')
    or p_visual ? 'sideLengthLabels'
    or p_visual ? 'distanceSegment'
    or p_visual ? 'angles'
    or p_visual ? 'askAngleIndex'
  ) then return false; end if;

  if current_mode = 'opposite-angle' and (
    p_visual ? 'vertices'
    or p_visual ? 'baseSideIndex'
    or p_visual ? 'rightAngleVertexIndexes'
    or not (p_visual ? 'parallelSidePairs')
    or p_visual ? 'equalSideGroups'
    or p_visual ? 'sideLengthLabels'
    or p_visual ? 'distanceSegment'
    or not (p_visual ? 'angles')
    or not (p_visual ? 'askAngleIndex')
  ) then return false; end if;

  -- 모든 평행 쌍은 마주 보는 변의 쌍이며 중복 없이 선언해야 한다.
  if current_mode in (
    'side-parallel-distance',
    'parallel-classify',
    'opposite-angle'
  ) then
    if jsonb_typeof(p_visual -> 'parallelSidePairs') is distinct from 'array'
      or jsonb_array_length(
        p_visual -> 'parallelSidePairs'
      ) not between 1 and 2
    then return false; end if;

    for item_index in 0..jsonb_array_length(
      p_visual -> 'parallelSidePairs'
    ) - 1 loop
      pair_value := p_visual -> 'parallelSidePairs' -> item_index;
      if jsonb_typeof(pair_value) is distinct from 'array'
        or jsonb_array_length(pair_value) <> 2
        or not public.jsonb_integer_at_least(pair_value -> 0, 0)
        or not public.jsonb_integer_at_least(pair_value -> 1, 0)
        or (pair_value ->> 0)::integer > 3
        or (pair_value ->> 1)::integer > 3
      then return false; end if;
      left_index := (pair_value ->> 0)::integer;
      right_index := (pair_value ->> 1)::integer;
      if left_index = right_index then return false; end if;
      if (least(left_index, right_index) = 0
          and greatest(left_index, right_index) = 2) then
        if declared_parallel_02 then return false; end if;
        declared_parallel_02 := true;
      elsif (least(left_index, right_index) = 1
          and greatest(left_index, right_index) = 3) then
        if declared_parallel_13 then return false; end if;
        declared_parallel_13 := true;
      else
        return false;
      end if;
    end loop;
  end if;

  if current_mode = 'opposite-angle' then
    if not declared_parallel_02 or not declared_parallel_13
      or jsonb_typeof(p_visual -> 'angles') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'angles') <> 4
      or not public.jsonb_integer_at_least(p_visual -> 'askAngleIndex', 0)
      or (p_visual ->> 'askAngleIndex')::integer > 3
    then return false; end if;
    ask_angle_index := (p_visual ->> 'askAngleIndex')::integer;

    for item_index in 0..3 loop
      angle_value := p_visual -> 'angles' -> item_index;
      if jsonb_typeof(angle_value) = 'null' then
        continue;
      end if;
      if not public.jsonb_integer_at_least(angle_value, 20)
        or (angle_value #>> '{}')::integer > 160
      then return false; end if;
      known_angle_count := known_angle_count + 1;
      given_angle_index := item_index;
      given_angle := (angle_value #>> '{}')::integer;
    end loop;

    return known_angle_count = 1
      and given_angle is not null
      and given_angle <> 90
      and ask_angle_index = (given_angle_index + 2) % 4
      and jsonb_typeof(
        p_visual -> 'angles' -> ask_angle_index
      ) = 'null';
  end if;

  vertices := p_visual -> 'vertices';
  if jsonb_typeof(vertices) is distinct from 'array'
    or jsonb_array_length(vertices) <> 4
  then return false; end if;

  for item_index in 0..3 loop
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

  for item_index in 1..4 loop
    for inner_index in item_index + 1..4 loop
      if inner_index <= 4
        and x[item_index] = x[inner_index]
        and y[item_index] = y[inner_index]
      then return false; end if;
    end loop;
  end loop;

  for item_index in 1..4 loop
    next_index := case when item_index = 4 then 1 else item_index + 1 end;
    side_x := array_append(side_x, x[next_index] - x[item_index]);
    side_y := array_append(side_y, y[next_index] - y[item_index]);
    side_length_squared := array_append(
      side_length_squared,
      (x[next_index] - x[item_index]) * (x[next_index] - x[item_index])
        + (y[next_index] - y[item_index]) * (y[next_index] - y[item_index])
    );
  end loop;

  for item_index in 1..4 loop
    next_index := case when item_index = 4 then 1 else item_index + 1 end;
    turns := array_append(
      turns,
      side_x[item_index] * side_y[next_index]
        - side_y[item_index] * side_x[next_index]
    );
  end loop;
  if not (
    turns[1] > 0 and turns[2] > 0 and turns[3] > 0 and turns[4] > 0
  ) and not (
    turns[1] < 0 and turns[2] < 0 and turns[3] < 0 and turns[4] < 0
  ) then return false; end if;

  actual_parallel_02 :=
    side_x[1] * side_y[3] - side_y[1] * side_x[3] = 0;
  actual_parallel_13 :=
    side_x[2] * side_y[4] - side_y[2] * side_x[4] = 0;
  actual_parallel_count :=
    (case when actual_parallel_02 then 1 else 0 end)
    + (case when actual_parallel_13 then 1 else 0 end);

  if current_mode in ('side-parallel-distance', 'parallel-classify')
    and (
      declared_parallel_02 is distinct from actual_parallel_02
      or declared_parallel_13 is distinct from actual_parallel_13
    )
  then return false; end if;

  for item_index in 1..4 loop
    previous_index := case when item_index = 1 then 4 else item_index - 1 end;
    next_index := case when item_index = 4 then 1 else item_index + 1 end;
    right_angles[item_index] :=
      (x[previous_index] - x[item_index])
        * (x[next_index] - x[item_index])
      + (y[previous_index] - y[item_index])
        * (y[next_index] - y[item_index]) = 0;
    if right_angles[item_index] then
      right_angle_count := right_angle_count + 1;
    end if;
  end loop;

  if current_mode = 'side-perpendicular' then
    if not public.jsonb_integer_at_least(p_visual -> 'baseSideIndex', 0)
      or (p_visual ->> 'baseSideIndex')::integer > 3
      or jsonb_typeof(
        p_visual -> 'rightAngleVertexIndexes'
      ) is distinct from 'array'
      or jsonb_array_length(
        p_visual -> 'rightAngleVertexIndexes'
      ) <> 2
    then return false; end if;
    base_index := (p_visual ->> 'baseSideIndex')::integer + 1;

    for item_index in 0..jsonb_array_length(
      p_visual -> 'rightAngleVertexIndexes'
    ) - 1 loop
      angle_value := p_visual -> 'rightAngleVertexIndexes' -> item_index;
      if not public.jsonb_integer_at_least(angle_value, 0)
        or (angle_value #>> '{}')::integer > 3
        or declared_right_angles[(angle_value #>> '{}')::integer + 1]
      then return false; end if;
      declared_right_angles[(angle_value #>> '{}')::integer + 1] := true;
    end loop;

    if not (
      (declared_right_angles[1] and declared_right_angles[3])
      or (declared_right_angles[2] and declared_right_angles[4])
    ) then return false; end if;

    for item_index in 1..4 loop
      if declared_right_angles[item_index]
        is distinct from right_angles[item_index]
      then return false; end if;
      next_index := case when item_index = 4 then 1 else item_index + 1 end;
      if item_index <> base_index
        and not (
          declared_right_angles[item_index]
          or declared_right_angles[next_index]
        )
      then return false; end if;
      if not declared_right_angles[item_index] then
        previous_index := case when item_index = 1
          then 4 else item_index - 1 end;
        dot_value := side_x[previous_index] * side_x[item_index]
          + side_y[previous_index] * side_y[item_index];
        if dot_value * dot_value * 100
          < 7
            * side_length_squared[previous_index]
            * side_length_squared[item_index]
        then return false; end if;
      end if;
      if item_index <> base_index then
        dot_value := side_x[base_index] * side_x[item_index]
          + side_y[base_index] * side_y[item_index];
        cross_value := side_x[base_index] * side_y[item_index]
          - side_y[base_index] * side_x[item_index];
        if dot_value = 0 then
          perpendicular_count := perpendicular_count + 1;
        end if;
        if cross_value = 0 then
          parallel_count := parallel_count + 1;
        end if;
      end if;
    end loop;
    previous_index := case when base_index = 1 then 4 else base_index - 1 end;
    next_index := case when base_index = 4 then 1 else base_index + 1 end;
    for item_index in 1..2 loop
      inner_index := case when item_index = 1
        then previous_index else next_index end;
      dot_value := side_x[base_index] * side_x[inner_index]
        + side_y[base_index] * side_y[inner_index];
      if dot_value <> 0 then
        touching_non_perpendicular_count :=
          touching_non_perpendicular_count + 1;
      end if;
    end loop;
    return perpendicular_count = 1
      and parallel_count = 0
      and touching_non_perpendicular_count = 1;
  end if;

  if current_mode = 'side-parallel-distance' then
    if jsonb_typeof(p_visual -> 'sideLengthLabels') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'sideLengthLabels') <> 2
    then return false; end if;
    for item_index in 0..1 loop
      label_value := p_visual -> 'sideLengthLabels' -> item_index;
      if jsonb_typeof(label_value) is distinct from 'object'
        or exists (
          select 1 from jsonb_object_keys(label_value) key_name
          where key_name not in ('sideIndex', 'lengthCm')
        )
        or not (label_value ? 'sideIndex')
        or not (label_value ? 'lengthCm')
        or not public.jsonb_integer_at_least(label_value -> 'sideIndex', 0)
        or (label_value ->> 'sideIndex')::integer > 3
        or not public.jsonb_integer_at_least(label_value -> 'lengthCm', 1)
        or (label_value ->> 'lengthCm')::integer > 40
      then return false; end if;
      left_index := (label_value ->> 'sideIndex')::integer + 1;
      length_cm := (label_value ->> 'lengthCm')::integer;
      if label_seen[left_index]
        or side_length_squared[left_index] <> length_cm * length_cm
      then return false; end if;
      label_seen[left_index] := true;
    end loop;

    distance_value := p_visual -> 'distanceSegment';
    if jsonb_typeof(distance_value) is distinct from 'object'
      or exists (
        select 1 from jsonb_object_keys(distance_value) key_name
        where key_name not in ('fromVertexIndex', 'toSideIndex', 'lengthCm')
      )
      or not (distance_value ? 'fromVertexIndex')
      or not (distance_value ? 'toSideIndex')
      or not (distance_value ? 'lengthCm')
      or not public.jsonb_integer_at_least(
        distance_value -> 'fromVertexIndex', 0
      )
      or (distance_value ->> 'fromVertexIndex')::integer > 3
      or not public.jsonb_integer_at_least(
        distance_value -> 'toSideIndex', 0
      )
      or (distance_value ->> 'toSideIndex')::integer > 3
      or not public.jsonb_integer_at_least(distance_value -> 'lengthCm', 1)
      or (distance_value ->> 'lengthCm')::integer > 40
    then return false; end if;

    from_vertex_index :=
      (distance_value ->> 'fromVertexIndex')::integer + 1;
    to_side_index := (distance_value ->> 'toSideIndex')::integer + 1;
    length_cm := (distance_value ->> 'lengthCm')::integer;
    target_side_length_squared := side_length_squared[to_side_index];
    projection :=
      (x[from_vertex_index] - x[to_side_index]) * side_x[to_side_index]
      + (y[from_vertex_index] - y[to_side_index]) * side_y[to_side_index];
    area := abs(
      side_x[to_side_index] * (y[from_vertex_index] - y[to_side_index])
      - side_y[to_side_index] * (x[from_vertex_index] - x[to_side_index])
    );
    opposite_side_index := ((to_side_index - 1 + 2) % 4) + 1;
    next_index := case when opposite_side_index = 4
      then 1 else opposite_side_index + 1 end;
    return projection > 0
      and projection < target_side_length_squared
      and area * area
        = length_cm * length_cm * target_side_length_squared
      and from_vertex_index in (opposite_side_index, next_index);
  end if;

  if current_mode = 'parallel-classify' then
    return actual_parallel_count = 1 and right_angle_count = 0;
  end if;

  if current_mode = 'equal-side-classify' then
    if jsonb_typeof(p_visual -> 'equalSideGroups') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'equalSideGroups') <> 1
    then return false; end if;
    group_value := p_visual -> 'equalSideGroups' -> 0;
    if jsonb_typeof(group_value) is distinct from 'array'
      or jsonb_array_length(group_value) <> 4
    then return false; end if;
    for item_index in 0..3 loop
      angle_value := group_value -> item_index;
      if not public.jsonb_integer_at_least(angle_value, 0)
        or (angle_value #>> '{}')::integer > 3
        or equal_seen[(angle_value #>> '{}')::integer + 1]
      then return false; end if;
      equal_seen[(angle_value #>> '{}')::integer + 1] := true;
    end loop;
    return side_length_squared[1] = side_length_squared[2]
      and side_length_squared[2] = side_length_squared[3]
      and side_length_squared[3] = side_length_squared[4]
      and right_angle_count = 0;
  end if;

  return false;
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_runtime_before_quadrilateral_figure;

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
    perform public.assert_runtime_before_quadrilateral_figure(p_content);
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'judgments') judgment
    where judgment #>> '{visual,kind}' = 'quadrilateral-figure'
      and not public.jsonb_quadrilateral_figure_valid(judgment -> 'visual')
  ) then
    raise exception 'judgment runtime schema is invalid';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'judgments') judgment
    cross join lateral (
      select count(*) as mentioned_side_count
      from unnest(
        array['변 ㄱㄴ', '변 ㄴㄷ', '변 ㄷㄹ', '변 ㄹㄱ']
      ) side_name
      where coalesce(judgment ->> 'prompt', '') like
        '%' || side_name || '%'
    ) mentions
    where judgment #>> '{visual,kind}' = 'quadrilateral-figure'
      and judgment #>> '{visual,mode}' = 'side-perpendicular'
      and (
        mentions.mentioned_side_count <> 1
        or coalesce(judgment ->> 'prompt', '') not like
          '%' || (
            array['변 ㄱㄴ', '변 ㄴㄷ', '변 ㄷㄹ', '변 ㄹㄱ']
          )[
            (judgment #>> '{visual,baseSideIndex}')::integer + 1
          ] || '%'
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
          when judgment #>> '{visual,kind}' = 'quadrilateral-figure'
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

  perform public.assert_runtime_before_quadrilateral_figure(
    normalized_content
  );
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
  return not exists (
    select 1 from jsonb_object_keys(p_object) key_name
    where not (key_name = any(p_allowed))
  );
end;
$$;

revoke all on function public.assert_diagnosis_runtime_schema(jsonb)
  from public;
revoke all on function public.jsonb_quadrilateral_figure_valid(jsonb)
  from public;
