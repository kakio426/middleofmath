-- A4-6: strict perimeter/area diagram runtime contract. Review-only; no rows published.

create function public.jsonb_perimeter_area_diagram_valid(p_visual jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  shape_name text := p_visual ->> 'shape';
  allowed_keys text[];
  numeric_keys text[];
  key_name text;
  numeric_value integer;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' <> 'perimeter-area-diagram'
    or shape_name not in ('rectangle', 'square', 'parallelogram', 'triangle', 'trapezoid', 'rhombus')
  then return false; end if;
  allowed_keys := case shape_name
    when 'rectangle' then array['kind', 'shape', 'width', 'height']
    when 'square' then array['kind', 'shape', 'side']
    when 'parallelogram' then array['kind', 'shape', 'base', 'height']
    when 'triangle' then array['kind', 'shape', 'base', 'height']
    when 'trapezoid' then array['kind', 'shape', 'topBase', 'bottomBase', 'height']
    else array['kind', 'shape', 'diagonal1', 'diagonal2']
  end;
  numeric_keys := allowed_keys[3:array_length(allowed_keys, 1)];
  if exists (
    select 1 from jsonb_object_keys(p_visual) authored_key
    where not (authored_key = any(allowed_keys))
  ) or (select count(*) from jsonb_object_keys(p_visual)) <> array_length(allowed_keys, 1)
  then return false; end if;
  foreach key_name in array numeric_keys loop
    if not public.jsonb_integer_at_least(p_visual -> key_name, 1) then return false; end if;
    numeric_value := (p_visual ->> key_name)::integer;
    if numeric_value > 50 then return false; end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

alter function public.jsonb_object_has_only_keys(jsonb, text[])
  rename to jsonb_object_has_only_keys_before_perimeter_area;

create function public.jsonb_object_has_only_keys(p_object jsonb, p_allowed text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_allowed = array['kind']
    and p_object ->> 'kind' = 'perimeter-area-diagram' then
    return public.jsonb_perimeter_area_diagram_valid(p_object);
  end if;
  return public.jsonb_object_has_only_keys_before_perimeter_area(p_object, p_allowed);
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_runtime_before_perimeter_area;

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
    perform public.assert_runtime_before_perimeter_area(p_content);
    return;
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_content -> 'judgments') judgment
    where judgment #>> '{visual,kind}' = 'perimeter-area-diagram'
      and not public.jsonb_perimeter_area_diagram_valid(judgment -> 'visual')
  ) then
    raise exception 'judgment runtime schema is invalid';
  end if;
  normalized_content := jsonb_set(
    p_content,
    '{judgments}',
    coalesce((
      select jsonb_agg(
        case when judgment #>> '{visual,kind}' = 'perimeter-area-diagram'
          then jsonb_set(judgment, '{visual}', '{"kind":"none"}'::jsonb, true)
          else judgment end
        order by ordinal
      )
      from jsonb_array_elements(p_content -> 'judgments')
        with ordinality rows(judgment, ordinal)
    ), '[]'::jsonb),
    true
  );
  perform public.assert_runtime_before_perimeter_area(normalized_content);
end;
$$;

revoke all on function public.jsonb_perimeter_area_diagram_valid(jsonb) from public, anon, authenticated;
revoke all on function public.jsonb_object_has_only_keys_before_perimeter_area(jsonb, text[]) from public, anon, authenticated;
revoke all on function public.jsonb_object_has_only_keys(jsonb, text[]) from public, anon, authenticated;
revoke all on function public.assert_runtime_before_perimeter_area(jsonb) from public, anon, authenticated;
revoke all on function public.assert_diagnosis_runtime_schema(jsonb) from public, anon, authenticated;
