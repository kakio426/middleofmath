-- Rollback:
-- 1. Restore assert_diagnosis_runtime_schema(jsonb) and
--    jsonb_object_has_only_keys(jsonb, text[]) from 202607310001.
-- 2. Drop jsonb_relation_pattern_diagram_valid(jsonb).
-- 3. Delete [4수02-01], [4수02-02], and [4수02-03] only after confirming
--    that no draft references the A2-approved rows.

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
    '[4수02-01]',
    4,
    1,
    '3-4',
    false,
    false,
    '다양한 변화 규칙을 찾아 설명하고, 그 규칙을 수나 식으로 나타내기',
    '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'
  ),
  (
    '[4수02-02]',
    4,
    1,
    '3-4',
    false,
    false,
    '계산식의 배열에서 규칙을 찾고, 계산 결과를 추측하기',
    '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'
  ),
  (
    '[4수02-03]',
    4,
    1,
    '3-4',
    false,
    false,
    '등호를 사용하여 크기가 같은 두 양의 관계를 식으로 나타내기',
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

create or replace function public.jsonb_relation_pattern_diagram_valid(
  p_visual jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_mode text;
  allowed_keys text[];
  item jsonb;
  item_index integer;
  item_count integer;
  null_count integer;
  first_known_index integer;
  first_known_value integer;
  blank_index integer;
  difference integer;
  factor integer;
  start_value integer;
  expected_value integer;
  candidate_answers integer[] := array[]::integer[];
  candidate_count integer := 0;
  valid_candidate boolean;
  ask_order integer;
  previous_left integer;
  relation_matches integer := 0;
  amount integer;
  all_a_equal boolean;
  all_b_equal boolean;
  first_a integer;
  first_b integer;
  previous_changing integer;
  changing_difference integer;
  current_changing integer;
  expected_result numeric;
  left_total integer;
  known_right integer;
  answer integer;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'relation-pattern-diagram'
    or p_visual ->> 'mode' is null
    or p_visual ->> 'mode' not in (
      'number-sequence',
      'figure-sequence',
      'rule-table',
      'calculation-array',
      'equal-sign-balance'
    ) then
    return false;
  end if;

  current_mode := p_visual ->> 'mode';
  allowed_keys := case current_mode
    when 'number-sequence'
      then array['kind', 'mode', 'terms']
    when 'figure-sequence'
      then array['kind', 'mode', 'figure', 'counts', 'askOrder']
    when 'rule-table'
      then array['kind', 'mode', 'leftLabel', 'rightLabel', 'rows']
    when 'calculation-array'
      then array['kind', 'mode', 'calculations']
    else array['kind', 'mode', 'equation']
  end;
  if exists (
    select 1
    from jsonb_object_keys(p_visual) key_name
    where not (key_name = any(allowed_keys))
  ) then
    return false;
  end if;

  if current_mode = 'number-sequence' then
    if jsonb_typeof(p_visual -> 'terms') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'terms') not between 4 and 6 then
      return false;
    end if;
    item_count := jsonb_array_length(p_visual -> 'terms');
    null_count := 0;
    first_known_index := -1;
    blank_index := -1;
    for item, item_index in
      select value, ordinality::integer - 1
      from jsonb_array_elements(p_visual -> 'terms') with ordinality
    loop
      if jsonb_typeof(item) = 'null' then
        null_count := null_count + 1;
        blank_index := item_index;
      elsif not public.jsonb_integer_at_least(item, 1)
        or (item #>> '{}')::integer > 1000 then
        return false;
      elsif first_known_index = -1 then
        first_known_index := item_index;
        first_known_value := (item #>> '{}')::integer;
      end if;
    end loop;
    if null_count <> 1 then return false; end if;

    for difference in 1..1000 loop
      start_value := first_known_value - first_known_index * difference;
      valid_candidate := start_value >= 1;
      for item_index in 0..item_count - 1 loop
        expected_value := start_value + item_index * difference;
        if expected_value > 1000
          or (
            jsonb_typeof(p_visual -> 'terms' -> item_index) <> 'null'
            and (p_visual -> 'terms' ->> item_index)::integer
              <> expected_value
          ) then
          valid_candidate := false;
          exit;
        end if;
      end loop;
      if valid_candidate
        and not (start_value + blank_index * difference = any(candidate_answers))
        then
        candidate_answers := array_append(
          candidate_answers,
          start_value + blank_index * difference
        );
      end if;
    end loop;

    for factor in 2..20 loop
      if first_known_value % ((factor ^ first_known_index)::integer) <> 0 then
        continue;
      end if;
      start_value :=
        first_known_value / ((factor ^ first_known_index)::integer);
      valid_candidate := start_value >= 1;
      for item_index in 0..item_count - 1 loop
        expected_value := start_value * ((factor ^ item_index)::integer);
        if expected_value > 1000
          or (
            jsonb_typeof(p_visual -> 'terms' -> item_index) <> 'null'
            and (p_visual -> 'terms' ->> item_index)::integer
              <> expected_value
          ) then
          valid_candidate := false;
          exit;
        end if;
      end loop;
      if valid_candidate
        and not (
          start_value * ((factor ^ blank_index)::integer)
          = any(candidate_answers)
        )
        then
        candidate_answers := array_append(
          candidate_answers,
          start_value * ((factor ^ blank_index)::integer)
        );
      end if;
    end loop;
    return cardinality(candidate_answers) = 1;
  end if;

  if current_mode = 'figure-sequence' then
    if p_visual ->> 'figure' is null
      or p_visual ->> 'figure' not in ('square', 'circle', 'triangle')
      or jsonb_typeof(p_visual -> 'counts') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'counts') not between 3 and 4
      or not public.jsonb_integer_at_least(p_visual -> 'askOrder', 1)
      or (p_visual ->> 'askOrder')::integer > 5 then
      return false;
    end if;
    item_count := jsonb_array_length(p_visual -> 'counts');
    null_count := 0;
    first_known_index := -1;
    blank_index := -1;
    for item, item_index in
      select value, ordinality::integer - 1
      from jsonb_array_elements(p_visual -> 'counts') with ordinality
    loop
      if jsonb_typeof(item) = 'null' then
        null_count := null_count + 1;
        blank_index := item_index;
      elsif not public.jsonb_integer_at_least(item, 1)
        or (item #>> '{}')::integer > 1000 then
        return false;
      elsif first_known_index = -1 then
        first_known_index := item_index;
        first_known_value := (item #>> '{}')::integer;
      end if;
    end loop;
    if null_count > 1 then return false; end if;
    ask_order := (p_visual ->> 'askOrder')::integer;
    if ask_order <> (case
      when blank_index >= 0 then blank_index + 1
      else item_count + 1
    end) then
      return false;
    end if;

    candidate_count := 0;
    for difference in 1..1000 loop
      start_value := first_known_value - first_known_index * difference;
      valid_candidate := start_value >= 1;
      for item_index in 0..item_count - 1 loop
        expected_value := start_value + item_index * difference;
        if expected_value > 1000
          or (
            jsonb_typeof(p_visual -> 'counts' -> item_index) <> 'null'
            and (p_visual -> 'counts' ->> item_index)::integer
              <> expected_value
          ) then
          valid_candidate := false;
          exit;
        end if;
      end loop;
      if valid_candidate then candidate_count := candidate_count + 1; end if;
    end loop;
    return candidate_count = 1;
  end if;

  if current_mode = 'rule-table' then
    if jsonb_typeof(p_visual -> 'leftLabel') is distinct from 'string'
      or jsonb_typeof(p_visual -> 'rightLabel') is distinct from 'string'
      or btrim(p_visual ->> 'leftLabel') = ''
      or btrim(p_visual ->> 'rightLabel') = ''
      or jsonb_typeof(p_visual -> 'rows') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'rows') not between 3 and 4 then
      return false;
    end if;
    previous_left := 0;
    for item in select value from jsonb_array_elements(p_visual -> 'rows')
    loop
      if jsonb_typeof(item) is distinct from 'object'
        or exists (
          select 1 from jsonb_object_keys(item) key_name
          where key_name not in ('left', 'right')
        )
        or not public.jsonb_integer_at_least(item -> 'left', 1)
        or not public.jsonb_integer_at_least(item -> 'right', 1)
        or (item ->> 'left')::integer > 1000
        or (item ->> 'right')::integer > 1000
        or (item ->> 'left')::integer <= previous_left then
        return false;
      end if;
      previous_left := (item ->> 'left')::integer;
    end loop;

    for factor in 2..20 loop
      if not exists (
        select 1 from jsonb_array_elements(p_visual -> 'rows') row_item
        where (row_item ->> 'right')::integer
          <> (row_item ->> 'left')::integer * factor
      ) then relation_matches := relation_matches + 1; end if;
      if not exists (
        select 1 from jsonb_array_elements(p_visual -> 'rows') row_item
        where (row_item ->> 'left')::integer % factor <> 0
          or (row_item ->> 'right')::integer
            <> (row_item ->> 'left')::integer / factor
      ) then relation_matches := relation_matches + 1; end if;
    end loop;
    for amount in -100..100 loop
      if amount <> 0 and not exists (
        select 1 from jsonb_array_elements(p_visual -> 'rows') row_item
        where (row_item ->> 'right')::integer
          <> (row_item ->> 'left')::integer + amount
      ) then relation_matches := relation_matches + 1; end if;
    end loop;
    return relation_matches = 1;
  end if;

  if current_mode = 'calculation-array' then
    if jsonb_typeof(p_visual -> 'calculations') is distinct from 'array'
      or jsonb_array_length(p_visual -> 'calculations') not between 3 and 5 then
      return false;
    end if;
    item_count := jsonb_array_length(p_visual -> 'calculations');
    first_a := (p_visual #>> '{calculations,0,a}')::integer;
    first_b := (p_visual #>> '{calculations,0,b}')::integer;
    all_a_equal := true;
    all_b_equal := true;
    for item, item_index in
      select value, ordinality::integer - 1
      from jsonb_array_elements(p_visual -> 'calculations') with ordinality
    loop
      if jsonb_typeof(item) is distinct from 'object'
        or exists (
          select 1 from jsonb_object_keys(item) key_name
          where key_name not in ('a', 'operator', 'b', 'result')
        )
        or not public.jsonb_integer_at_least(item -> 'a', 1)
        or not public.jsonb_integer_at_least(item -> 'b', 1)
        or (item ->> 'a')::integer > 1000
        or (item ->> 'b')::integer > 1000
        or item ->> 'operator' is null
        or item ->> 'operator' not in ('multiply', 'divide')
        or item ->> 'operator'
          is distinct from p_visual #>> '{calculations,0,operator}'
        or (
          item_index = item_count - 1
          and jsonb_typeof(item -> 'result') is distinct from 'null'
        )
        or (
          item_index < item_count - 1
          and (
            not public.jsonb_integer_at_least(item -> 'result', 1)
            or (item ->> 'result')::integer > 1000
          )
        ) then
        return false;
      end if;
      all_a_equal := all_a_equal and (item ->> 'a')::integer = first_a;
      all_b_equal := all_b_equal and (item ->> 'b')::integer = first_b;
      if item_index < item_count - 1 then
        expected_result := case item ->> 'operator'
          when 'multiply'
            then (item ->> 'a')::integer * (item ->> 'b')::integer
          else (item ->> 'a')::numeric / (item ->> 'b')::numeric
        end;
        if expected_result <> trunc(expected_result)
          or (item ->> 'result')::integer <> expected_result then
          return false;
        end if;
      end if;
    end loop;
    if all_a_equal = all_b_equal then return false; end if;

    previous_changing := case when all_a_equal
      then (p_visual #>> '{calculations,0,b}')::integer
      else (p_visual #>> '{calculations,0,a}')::integer
    end;
    current_changing := case when all_a_equal
      then (p_visual #>> '{calculations,1,b}')::integer
      else (p_visual #>> '{calculations,1,a}')::integer
    end;
    changing_difference := current_changing - previous_changing;
    if changing_difference <= 0 then return false; end if;
    for item_index in 1..item_count - 1 loop
      current_changing := case when all_a_equal
        then (p_visual #>> array[
          'calculations', item_index::text, 'b'
        ])::integer
        else (p_visual #>> array[
          'calculations', item_index::text, 'a'
        ])::integer
      end;
      if current_changing
        <> previous_changing + changing_difference then
        return false;
      end if;
      previous_changing := current_changing;
    end loop;
    item := p_visual -> 'calculations' -> (item_count - 1);
    expected_result := case item ->> 'operator'
      when 'multiply'
        then (item ->> 'a')::integer * (item ->> 'b')::integer
      else (item ->> 'a')::numeric / (item ->> 'b')::numeric
    end;
    return expected_result = trunc(expected_result)
      and expected_result between 1 and 1000;
  end if;

  if jsonb_typeof(p_visual -> 'equation') is distinct from 'object'
    or exists (
      select 1 from jsonb_object_keys(p_visual -> 'equation') key_name
      where key_name not in ('operator', 'left', 'right')
    )
    or p_visual #>> '{equation,operator}' is distinct from 'add'
    or jsonb_typeof(p_visual #> '{equation,left}') is distinct from 'array'
    or jsonb_array_length(p_visual #> '{equation,left}') <> 2
    or jsonb_typeof(p_visual #> '{equation,right}') is distinct from 'array'
    or jsonb_array_length(p_visual #> '{equation,right}') <> 2 then
    return false;
  end if;
  for item in
    select value from jsonb_array_elements(p_visual #> '{equation,left}')
  loop
    if not public.jsonb_integer_at_least(item, 10)
      or (item #>> '{}')::integer > 99 then
      return false;
    end if;
  end loop;
  null_count := 0;
  known_right := null;
  for item in
    select value from jsonb_array_elements(p_visual #> '{equation,right}')
  loop
    if jsonb_typeof(item) = 'null' then
      null_count := null_count + 1;
    elsif not public.jsonb_integer_at_least(item, 10)
      or (item #>> '{}')::integer > 99 then
      return false;
    else
      known_right := (item #>> '{}')::integer;
    end if;
  end loop;
  if null_count <> 1 then return false; end if;
  left_total :=
    (p_visual #>> '{equation,left,0}')::integer
    + (p_visual #>> '{equation,left,1}')::integer;
  answer := left_total - known_right;
  return answer between 10 and 99;
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_diagnosis_runtime_schema_before_relation_pattern;

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
    perform public.assert_diagnosis_runtime_schema_before_relation_pattern(
      p_content
    );
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'judgments') judgment
    where judgment #>> '{visual,kind}' = 'relation-pattern-diagram'
      and not public.jsonb_relation_pattern_diagram_valid(
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
          when judgment #>> '{visual,kind}' = 'relation-pattern-diagram'
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

  perform public.assert_diagnosis_runtime_schema_before_relation_pattern(
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
  return not exists (
    select 1 from jsonb_object_keys(p_object) key_name
    where not (key_name = any(p_allowed))
  );
end;
$$;

revoke all on function public.assert_diagnosis_runtime_schema(jsonb)
  from public;
revoke all on function public.jsonb_relation_pattern_diagram_valid(jsonb)
  from public;
