-- A3-6: strict, non-public line-chart geometry oracle.
-- grade4-semester2 remains review-only; this migration adds no publication rows.

create or replace function public.jsonb_line_chart_tick_unit(p_visual jsonb)
returns integer
language plpgsql
immutable
set search_path = ''
as $$
declare
  axis jsonb := p_visual -> 'axis';
  first_tick jsonb;
  last_tick jsonb;
  tick_count integer;
  value_difference integer;
begin
  if jsonb_typeof(axis) is distinct from 'object'
    or jsonb_typeof(axis -> 'labeledTicks') is distinct from 'array'
    or jsonb_array_length(axis -> 'labeledTicks') <> 2
    or not public.jsonb_integer_at_least(axis -> 'tickCount', 2)
  then return null; end if;
  tick_count := (axis ->> 'tickCount')::integer;
  first_tick := axis -> 'labeledTicks' -> 0;
  last_tick := axis -> 'labeledTicks' -> 1;
  if not public.jsonb_integer_at_least(first_tick -> 'index', 0)
    or not public.jsonb_integer_at_least(first_tick -> 'value', 0)
    or not public.jsonb_integer_at_least(last_tick -> 'index', 0)
    or not public.jsonb_integer_at_least(last_tick -> 'value', 0)
    or (first_tick ->> 'index')::integer <> 0
    or (last_tick ->> 'index')::integer <> tick_count
  then return null; end if;
  value_difference := (last_tick ->> 'value')::integer
    - (first_tick ->> 'value')::integer;
  if value_difference <= 0 or value_difference % tick_count <> 0 then
    return null;
  end if;
  return value_difference / tick_count;
exception when others then
  return null;
end;
$$;

create or replace function public.jsonb_line_chart_point_value(
  p_visual jsonb,
  p_category_index integer
)
returns integer
language plpgsql
immutable
set search_path = ''
as $$
declare
  unit_value integer := public.jsonb_line_chart_tick_unit(p_visual);
  point_value jsonb;
begin
  if unit_value is null then return null; end if;
  select value into point_value
  from jsonb_array_elements(p_visual -> 'points') item(value)
  where (value ->> 'categoryIndex')::integer = p_category_index
  limit 1;
  if point_value is null then return null; end if;
  return (p_visual #>> '{axis,baselineValue}')::integer
    + (point_value ->> 'tick')::integer * unit_value;
exception when others then
  return null;
end;
$$;

create or replace function public.jsonb_line_chart_expected_answer(p_visual jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_mode text := p_visual ->> 'mode';
  target_value jsonb := p_visual -> 'target';
  from_index integer;
  to_index integer;
  from_value integer;
  to_value integer;
begin
  if current_mode = 'tick-unit' then
    return public.jsonb_line_chart_tick_unit(p_visual)::text;
  end if;
  if current_mode = 'point-value' then
    return public.jsonb_line_chart_point_value(
      p_visual, (target_value ->> 'categoryIndex')::integer
    )::text;
  end if;
  from_index := (target_value ->> 'fromIndex')::integer;
  to_index := (target_value ->> 'toIndex')::integer;
  from_value := public.jsonb_line_chart_point_value(p_visual, from_index);
  to_value := public.jsonb_line_chart_point_value(p_visual, to_index);
  if current_mode = 'step-change' then
    return abs(to_value - from_value)::text;
  elsif current_mode = 'between-estimate' then
    return ((from_value + to_value) / 2)::text;
  elsif current_mode = 'largest-rise' then
    return (p_visual #>> array['timeAxis', 'categories', from_index::text])
      || '→'
      || (p_visual #>> array['timeAxis', 'categories', to_index::text]);
  end if;
  return null;
exception when others then
  return null;
end;
$$;

create or replace function public.jsonb_line_chart_diagram_valid(p_visual jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_mode text;
  axis jsonb;
  time_axis jsonb;
  target_value jsonb;
  category_count integer;
  tick_count integer;
  baseline integer;
  unit_value integer;
  item_value jsonb;
  item_index integer;
  category_index integer;
  tick_value integer;
  ticks integer[];
  changes integer[] := array[]::integer[];
  from_index integer;
  to_index integer;
  target_change integer;
  change_value integer;
  max_rise integer;
  max_rise_count integer;
  max_rise_index integer;
  absolute_max integer;
  absolute_count integer;
  absolute_index integer;
  global_max integer;
  global_max_count integer;
  global_max_index integer;
  midpoint_tick numeric;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'line-chart-diagram'
    or p_visual ->> 'mode' not in (
      'tick-unit', 'point-value', 'step-change', 'largest-rise', 'between-estimate'
    )
  then return false; end if;
  current_mode := p_visual ->> 'mode';
  if current_mode = 'tick-unit' then
    if not public.jsonb_object_has_only_keys(
      p_visual, array['kind', 'mode', 'axis', 'timeAxis', 'points']
    ) then return false; end if;
  elsif not public.jsonb_object_has_only_keys(
    p_visual, array['kind', 'mode', 'axis', 'timeAxis', 'points', 'target']
  ) then return false; end if;

  axis := p_visual -> 'axis';
  time_axis := p_visual -> 'timeAxis';
  if not public.jsonb_object_has_only_keys(
      axis, array['unitLabel', 'baselineValue', 'tickCount', 'labeledTicks']
    )
    or jsonb_typeof(axis -> 'unitLabel') is distinct from 'string'
    or btrim(axis ->> 'unitLabel') = ''
    or not public.jsonb_integer_at_least(axis -> 'baselineValue', 0)
    or not public.jsonb_integer_at_least(axis -> 'tickCount', 2)
  then return false; end if;
  baseline := (axis ->> 'baselineValue')::integer;
  tick_count := (axis ->> 'tickCount')::integer;
  if baseline > 1000
    or tick_count > 12
    or jsonb_typeof(axis -> 'labeledTicks') is distinct from 'array'
    or jsonb_array_length(axis -> 'labeledTicks') <> 2
    or exists (
      select 1 from jsonb_array_elements(axis -> 'labeledTicks') tick
      where not public.jsonb_object_has_only_keys(tick, array['index', 'value'])
    )
    or (axis #>> '{labeledTicks,0,index}')::integer <> 0
    or (axis #>> '{labeledTicks,0,value}')::integer <> baseline
    or (axis #>> '{labeledTicks,1,index}')::integer <> tick_count
    or (axis #>> '{labeledTicks,1,value}')::integer > 2000
  then return false; end if;
  unit_value := public.jsonb_line_chart_tick_unit(p_visual);
  if unit_value is null then return false; end if;

  if not public.jsonb_object_has_only_keys(time_axis, array['label', 'categories'])
    or jsonb_typeof(time_axis -> 'label') is distinct from 'string'
    or btrim(time_axis ->> 'label') = ''
    or jsonb_typeof(time_axis -> 'categories') is distinct from 'array'
  then return false; end if;
  category_count := jsonb_array_length(time_axis -> 'categories');
  if category_count not between 4 and 6
    or exists (
      select 1 from jsonb_array_elements(time_axis -> 'categories') category
      where jsonb_typeof(category) is distinct from 'string'
        or btrim(category #>> '{}') = ''
    )
    or (
      select count(distinct category #>> '{}')
      from jsonb_array_elements(time_axis -> 'categories') category
    ) <> category_count
    or jsonb_typeof(p_visual -> 'points') is distinct from 'array'
    or jsonb_array_length(p_visual -> 'points') <> category_count
  then return false; end if;

  ticks := array_fill(null::integer, array[category_count]);
  for item_value in select value from jsonb_array_elements(p_visual -> 'points') loop
    if not public.jsonb_object_has_only_keys(item_value, array['categoryIndex', 'tick'])
      or not public.jsonb_integer_at_least(item_value -> 'categoryIndex', 0)
      or not public.jsonb_integer_at_least(item_value -> 'tick', 0)
    then return false; end if;
    category_index := (item_value ->> 'categoryIndex')::integer;
    tick_value := (item_value ->> 'tick')::integer;
    if category_index >= category_count or tick_value > tick_count
      or ticks[category_index + 1] is not null
    then return false; end if;
    ticks[category_index + 1] := tick_value;
  end loop;
  if array_position(ticks, null) is not null then return false; end if;
  if baseline > 0 and 0 = any(ticks) then return false; end if;
  for item_index in 1..category_count - 1 loop
    changes := array_append(changes, ticks[item_index + 1] - ticks[item_index]);
  end loop;

  if current_mode = 'tick-unit' then
    return tick_count <> unit_value;
  end if;
  target_value := p_visual -> 'target';
  if current_mode = 'point-value' then
    if not public.jsonb_object_has_only_keys(target_value, array['kind', 'categoryIndex'])
      or target_value ->> 'kind' is distinct from 'point'
      or not public.jsonb_integer_at_least(target_value -> 'categoryIndex', 0)
    then return false; end if;
    category_index := (target_value ->> 'categoryIndex')::integer;
    return category_index > 0
      and category_index < category_count - 1
      and ticks[category_index + 1] <> ticks[category_index]
      and ticks[category_index + 1] <> ticks[category_index + 2];
  end if;
  if not public.jsonb_object_has_only_keys(target_value, array['kind', 'fromIndex', 'toIndex'])
    or target_value ->> 'kind' is distinct from (case current_mode
      when 'between-estimate' then 'midpoint' else 'interval' end)
    or not public.jsonb_integer_at_least(target_value -> 'fromIndex', 0)
    or not public.jsonb_integer_at_least(target_value -> 'toIndex', 0)
  then return false; end if;
  from_index := (target_value ->> 'fromIndex')::integer;
  to_index := (target_value ->> 'toIndex')::integer;
  if to_index <> from_index + 1 or to_index >= category_count then return false; end if;
  target_change := changes[from_index + 1];

  if current_mode = 'step-change' then
    if abs(target_change) < 2 then return false; end if;
    return (select count(*) from unnest(changes) change where abs(change) = abs(target_change)) = 1;
  end if;
  if current_mode = 'largest-rise' then
    select max(change) into max_rise from unnest(changes) change;
    select count(*), min(ordinality - 1)
      into max_rise_count, max_rise_index
      from unnest(changes) with ordinality row(change, ordinality)
      where change = max_rise;
    select max(abs(change)) into absolute_max from unnest(changes) change;
    select count(*), min(ordinality - 1) into absolute_count, absolute_index
      from unnest(changes) with ordinality row(change, ordinality)
      where abs(change) = absolute_max;
    select max(tick) into global_max from unnest(ticks) tick;
    select count(*), min(ordinality - 1)
      into global_max_count, global_max_index
      from unnest(ticks) with ordinality row(tick, ordinality)
      where tick = global_max;
    return max_rise > 0
      and max_rise_count = 1
      and max_rise_index = from_index
      and from_index > 0
      and from_index < category_count - 2
      and absolute_count = 1
      and absolute_index <> from_index
      and global_max_count = 1
      and global_max_index not in (from_index, to_index);
  end if;

  midpoint_tick := (ticks[from_index + 1] + ticks[to_index + 1])::numeric / 2;
  return midpoint_tick = trunc(midpoint_tick)
    and not (midpoint_tick::integer = any(ticks));
exception when others then
  return false;
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_runtime_before_line_chart;

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
    perform public.assert_runtime_before_line_chart(p_content);
    return;
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_content -> 'judgments') judgment
    where judgment #>> '{visual,kind}' = 'line-chart-diagram'
      and not public.jsonb_line_chart_diagram_valid(judgment -> 'visual')
  ) then
    raise exception 'judgment runtime schema is invalid';
  end if;
  normalized_content := jsonb_set(
    p_content,
    '{judgments}',
    coalesce((
      select jsonb_agg(
        case when judgment #>> '{visual,kind}' = 'line-chart-diagram'
          then jsonb_set(judgment, '{visual}', '{"kind":"none"}'::jsonb, true)
          else judgment end
        order by ordinal
      )
      from jsonb_array_elements(p_content -> 'judgments')
        with ordinality rows(judgment, ordinal)
    ), '[]'::jsonb),
    true
  );
  perform public.assert_runtime_before_line_chart(normalized_content);
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
    and p_object ->> 'kind' = 'line-chart-diagram' then
    return public.jsonb_line_chart_diagram_valid(p_object);
  end if;
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

revoke all on function public.jsonb_line_chart_tick_unit(jsonb) from public;
revoke all on function public.jsonb_line_chart_point_value(jsonb, integer) from public;
revoke all on function public.jsonb_line_chart_expected_answer(jsonb) from public;
revoke all on function public.jsonb_line_chart_diagram_valid(jsonb) from public;
revoke all on function public.assert_diagnosis_runtime_schema(jsonb) from public;
revoke all on function public.jsonb_object_has_only_keys(jsonb, text[]) from public;
revoke all on function public.jsonb_line_chart_tick_unit(jsonb) from anon, authenticated;
revoke all on function public.jsonb_line_chart_point_value(jsonb, integer) from anon, authenticated;
revoke all on function public.jsonb_line_chart_expected_answer(jsonb) from anon, authenticated;
revoke all on function public.jsonb_line_chart_diagram_valid(jsonb) from anon, authenticated;
revoke all on function public.assert_diagnosis_runtime_schema(jsonb) from anon, authenticated;
revoke all on function public.jsonb_object_has_only_keys(jsonb, text[]) from anon, authenticated;
