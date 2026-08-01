-- 4학년 2학기 삼각형 전용 시각 계약.
-- review 콘텐츠가 발행 저장소로 들어오기 전에 변·각·표시의 수학적
-- 일관성을 데이터베이스에서도 동일하게 검사한다.

create or replace function public.jsonb_triangle_figure_valid(p_visual jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_mode text;
  side_values integer[] := array[]::integer[];
  angle_values integer[] := array[]::integer[];
  completed_angles integer[] := array[]::integer[];
  equal_side_indexes integer[] := array[]::integer[];
  side_value jsonb;
  angle_value jsonb;
  equal_side_value jsonb;
  item_index integer;
  known_sum integer := 0;
  unknown_count integer := 0;
  missing_angle integer := null;
  ask_index integer := null;
  first_equal_index integer := null;
  second_equal_index integer := null;
  remaining_index integer := null;
  given_equal_index integer := null;
  given_angle integer := null;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'triangle-figure'
    or p_visual ->> 'mode' not in (
      'side-classify',
      'side-angle',
      'angle-classify'
    )
    or exists (
      select 1
      from jsonb_object_keys(p_visual) key_name
      where key_name not in (
        'kind',
        'mode',
        'sides',
        'angles',
        'equalSideIndexes',
        'askIndex'
      )
    ) then
    return false;
  end if;

  current_mode := p_visual ->> 'mode';

  if current_mode = 'side-classify' and (
    not (p_visual ? 'sides')
    or p_visual ? 'angles'
    or p_visual ? 'equalSideIndexes'
    or p_visual ? 'askIndex'
  ) then
    return false;
  end if;
  if current_mode = 'side-angle' and (
    p_visual ? 'sides'
    or not (p_visual ? 'angles')
    or not (p_visual ? 'equalSideIndexes')
    or not (p_visual ? 'askIndex')
  ) then
    return false;
  end if;
  if current_mode = 'angle-classify' and (
    not (p_visual ? 'angles')
    or p_visual ? 'sides'
    or p_visual ? 'equalSideIndexes'
  ) then
    return false;
  end if;

  if p_visual ? 'sides' then
    if jsonb_typeof(p_visual -> 'sides') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'sides') <> 3 then
      return false;
    end if;
    for item_index in 0..2 loop
      side_value := p_visual -> 'sides' -> item_index;
      if not public.jsonb_integer_at_least(side_value, 1)
        or (side_value #>> '{}')::integer > 20 then
        return false;
      end if;
      side_values := array_append(
        side_values,
        (side_value #>> '{}')::integer
      );
    end loop;
    if side_values[1] + side_values[2] <= side_values[3]
      or side_values[2] + side_values[3] <= side_values[1]
      or side_values[3] + side_values[1] <= side_values[2] then
      return false;
    end if;
  end if;

  if p_visual ? 'angles' then
    if jsonb_typeof(p_visual -> 'angles') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'angles') <> 3 then
      return false;
    end if;
    for item_index in 0..2 loop
      angle_value := p_visual -> 'angles' -> item_index;
      if jsonb_typeof(angle_value) = 'null' then
        unknown_count := unknown_count + 1;
        angle_values := array_append(angle_values, null);
      elsif not public.jsonb_integer_at_least(angle_value, 1)
        or (angle_value #>> '{}')::integer > 179 then
        return false;
      else
        known_sum := known_sum + (angle_value #>> '{}')::integer;
        angle_values := array_append(
          angle_values,
          (angle_value #>> '{}')::integer
        );
      end if;
    end loop;

    if p_visual ? 'askIndex' then
      if not public.jsonb_integer_at_least(p_visual -> 'askIndex', 0)
        or (p_visual ->> 'askIndex')::integer > 2 then
        return false;
      end if;
      ask_index := (p_visual ->> 'askIndex')::integer;
    end if;
  end if;

  if p_visual ? 'equalSideIndexes' then
    if jsonb_typeof(p_visual -> 'equalSideIndexes') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'equalSideIndexes') <> 2 then
      return false;
    end if;
    for item_index in 0..1 loop
      equal_side_value := p_visual -> 'equalSideIndexes' -> item_index;
      if not public.jsonb_integer_at_least(equal_side_value, 0)
        or (equal_side_value #>> '{}')::integer > 2 then
        return false;
      end if;
      equal_side_indexes := array_append(
        equal_side_indexes,
        (equal_side_value #>> '{}')::integer
      );
    end loop;
    if equal_side_indexes[1] = equal_side_indexes[2] then return false; end if;
  end if;

  if current_mode = 'angle-classify' then
    if unknown_count <> 0
      or known_sum <> 180
      or ask_index is not null then
      return false;
    end if;
    completed_angles := angle_values;
  end if;

  if current_mode = 'side-angle' then
    if unknown_count <> 2
      or ask_index is null
      or array_length(equal_side_indexes, 1) <> 2 then
      return false;
    end if;

    first_equal_index := equal_side_indexes[1] + 1;
    second_equal_index := equal_side_indexes[2] + 1;
    remaining_index := 6 - first_equal_index - second_equal_index;
    if ask_index + 1 = first_equal_index then
      given_equal_index := second_equal_index;
    elsif ask_index + 1 = second_equal_index then
      given_equal_index := first_equal_index;
    else
      return false;
    end if;

    if angle_values[ask_index + 1] is not null
      or angle_values[remaining_index] is not null
      or angle_values[given_equal_index] is null then
      return false;
    end if;

    given_angle := angle_values[given_equal_index];
    if given_angle * 2 >= 180 or given_angle * 3 = 180 then
      return false;
    end if;

    missing_angle := 180 - given_angle * 2;
    for item_index in 1..3 loop
      completed_angles := array_append(
        completed_angles,
        case
          when item_index = remaining_index then missing_angle
          else given_angle
        end
      );
    end loop;
  end if;

  if array_length(equal_side_indexes, 1) = 2
    and array_length(completed_angles, 1) = 3 then
    first_equal_index := equal_side_indexes[1] + 1;
    second_equal_index := equal_side_indexes[2] + 1;
    remaining_index := 6 - first_equal_index - second_equal_index;
    if completed_angles[first_equal_index]
        is distinct from completed_angles[second_equal_index]
      or completed_angles[remaining_index]
        is not distinct from completed_angles[first_equal_index] then
      return false;
    end if;
  end if;

  return true;
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_diagnosis_runtime_schema_before_triangle_figure;

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
    perform public.assert_diagnosis_runtime_schema_before_triangle_figure(
      p_content
    );
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'judgments') judgment
    where judgment #>> '{visual,kind}' = 'triangle-figure'
      and not public.jsonb_triangle_figure_valid(judgment -> 'visual')
  ) then
    raise exception 'judgment runtime schema is invalid';
  end if;

  normalized_content := jsonb_set(
    p_content,
    '{judgments}',
    coalesce((
      select jsonb_agg(
        case
          when judgment #>> '{visual,kind}' = 'triangle-figure'
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

  perform public.assert_diagnosis_runtime_schema_before_triangle_figure(
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
  return not exists (
    select 1 from jsonb_object_keys(p_object) key_name
    where not (key_name = any(p_allowed))
  );
end;
$$;

revoke all on function public.assert_diagnosis_runtime_schema(jsonb)
  from public;
revoke all on function public.jsonb_triangle_figure_valid(jsonb)
  from public;
