-- Rollback:
-- 1. Restore guard_diagnosis_curriculum_alignment() and
--    assert_diagnosis_runtime_schema(jsonb) from 202607310002.
-- 2. Restore jsonb_object_has_only_keys(jsonb, text[]) from 202607310002.
-- 3. Drop jsonb_bar_chart_diagram_valid(jsonb),
--    jsonb_bar_array_valid(jsonb, integer), and curriculum_anchor_set_allowlist
--    only after no draft relies on the A2-3 bar-graph contract.

do $$
begin
  if not exists (
    select 1
    from public.curriculum_anchors
    where anchor_key = '[4수04-01]'
      and grade = 3
      and semester = 2
      and not shared_across_semesters
      and not shared_across_grade_band
  ) then
    raise exception '[4수04-01] canonical grade3-semester2 row is missing or changed';
  end if;
end;
$$;

insert into public.curriculum_anchors (
  anchor_key,
  grade,
  semester,
  grade_band,
  shared_across_semesters,
  shared_across_grade_band,
  label,
  source
) values (
  '[4수04-03]',
  4,
  1,
  '3-4',
  false,
  false,
  '탐구 문제를 위한 자료를 수집·정리하여 막대그래프로 나타내고 해석하기',
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

create table public.curriculum_anchor_set_allowlist (
  anchor_key text not null
    references public.curriculum_anchors(anchor_key) on delete restrict,
  set_key text not null
    check (set_key ~ '^grade[1-6]-semester[12]$'),
  is_canonical boolean not null default false,
  coverage text not null check (coverage in ('exact', 'partial')),
  approved_by text not null
    check (approved_by ~ '^teacher:[a-z0-9][a-z0-9._-]{2,63}$'),
  approved_at timestamptz not null,
  primary key (anchor_key, set_key)
);

create unique index curriculum_anchor_set_allowlist_one_canonical
  on public.curriculum_anchor_set_allowlist(anchor_key)
  where is_canonical;

comment on table public.curriculum_anchor_set_allowlist is
  '학년 또는 학기를 넘는 성취기준을 정확한 진단 세트에만 허용하는 fail-closed 원장.';

alter table public.curriculum_anchor_set_allowlist enable row level security;

insert into public.curriculum_anchor_set_allowlist (
  anchor_key,
  set_key,
  is_canonical,
  coverage,
  approved_by,
  approved_at
) values
  (
    '[4수04-01]',
    'grade3-semester2',
    true,
    'partial',
    'teacher:workspace-owner',
    '2026-07-31T15:04:15+09:00'
  ),
  (
    '[4수04-01]',
    'grade4-semester1',
    false,
    'partial',
    'teacher:workspace-owner',
    '2026-07-31T15:04:15+09:00'
  ),
  (
    '[4수04-03]',
    'grade4-semester1',
    true,
    'partial',
    'teacher:workspace-owner',
    '2026-07-31T15:04:15+09:00'
  );

create or replace function public.guard_diagnosis_curriculum_alignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  diagnosis_set_key text;
begin
  if new.content #>> '{manifest,grade}' is null
    or new.content #>> '{manifest,semester}' is null then
    raise exception 'curriculum anchor grade or semester mismatch';
  end if;
  diagnosis_set_key := format(
    'grade%s-semester%s',
    new.content #>> '{manifest,grade}',
    new.content #>> '{manifest,semester}'
  );

  if exists (
    select 1
    from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
    where not exists (
      select 1
      from public.curriculum_anchors approved
      where approved.anchor_key = anchor ->> 'id'
        and approved.active
        and (
          (
            exists (
              select 1
              from public.curriculum_anchor_set_allowlist scoped
              where scoped.anchor_key = approved.anchor_key
            )
            and exists (
              select 1
              from public.curriculum_anchor_set_allowlist scoped
              where scoped.anchor_key = approved.anchor_key
                and scoped.set_key = diagnosis_set_key
            )
          )
          or (
            not exists (
              select 1
              from public.curriculum_anchor_set_allowlist scoped
              where scoped.anchor_key = approved.anchor_key
            )
            and (
              approved.grade =
                (new.content #>> '{manifest,grade}')::integer
              or (
                approved.shared_across_grade_band
                and approved.grade_band is not null
                and (new.content #>> '{manifest,grade}')::integer
                  between split_part(
                    approved.grade_band,
                    '-',
                    1
                  )::integer
                  and split_part(
                    approved.grade_band,
                    '-',
                    2
                  )::integer
              )
            )
            and (
              approved.shared_across_semesters
              or approved.semester =
                (new.content #>> '{manifest,semester}')::integer
            )
          )
        )
    )
  ) then
    raise exception 'curriculum anchor grade or semester mismatch';
  end if;
  return new;
end;
$$;

create or replace function public.jsonb_bar_array_valid(
  p_bars jsonb,
  p_tick_count integer
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  bar_item jsonb;
begin
  if jsonb_typeof(p_bars) is distinct from 'array'
    or jsonb_array_length(p_bars) not between 2 and 6 then
    return false;
  end if;
  for bar_item in select value from jsonb_array_elements(p_bars)
  loop
    if jsonb_typeof(bar_item) is distinct from 'object'
      or exists (
        select 1 from jsonb_object_keys(bar_item) key_name
        where key_name not in ('category', 'ticks')
      )
      or jsonb_typeof(bar_item -> 'category') is distinct from 'string'
      or btrim(bar_item ->> 'category') = ''
      or char_length(bar_item ->> 'category') > 8
      or not public.jsonb_integer_at_least(bar_item -> 'ticks', 0)
      or (bar_item ->> 'ticks')::integer > p_tick_count then
      return false;
    end if;
  end loop;
  return (
    select count(*) = count(distinct item ->> 'category')
    from jsonb_array_elements(p_bars) item
  );
end;
$$;

create or replace function public.jsonb_bar_chart_diagram_valid(
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
  axis jsonb;
  tick_count integer;
  labeled_ticks jsonb;
  tick_item jsonb;
  tick_index integer;
  tick_value integer;
  previous_index integer := -1;
  derived_step integer := null;
  current_step integer;
  bars jsonb;
  target_bar jsonb;
  target_value integer;
  comparison jsonb;
  first_bar jsonb;
  second_bar jsonb;
  difference_value integer;
  table_rows jsonb;
  table_item jsonb;
  candidates jsonb;
  candidate jsonb;
  candidate_bar jsonb;
  candidate_index integer;
  table_count integer;
  matching_candidates integer := 0;
begin
  if jsonb_typeof(p_visual) is distinct from 'object'
    or p_visual ->> 'kind' is distinct from 'bar-chart-diagram'
    or p_visual ->> 'mode' is null
    or p_visual ->> 'mode' not in (
      'unit-value',
      'bar-value',
      'bar-difference',
      'table-match',
      'chart-conclusion'
    ) then
    return false;
  end if;

  current_mode := p_visual ->> 'mode';
  allowed_keys := case current_mode
    when 'unit-value' then array['kind', 'mode', 'axis', 'bars']
    when 'bar-value'
      then array['kind', 'mode', 'axis', 'bars', 'target']
    when 'bar-difference'
      then array['kind', 'mode', 'axis', 'bars', 'comparison']
    when 'table-match'
      then array['kind', 'mode', 'axis', 'table', 'candidates']
    else array['kind', 'mode', 'axis', 'bars']
  end;
  if exists (
    select 1 from jsonb_object_keys(p_visual) key_name
    where not (key_name = any(allowed_keys))
  ) then
    return false;
  end if;

  axis := p_visual -> 'axis';
  if jsonb_typeof(axis) is distinct from 'object'
    or exists (
      select 1 from jsonb_object_keys(axis) key_name
      where key_name not in (
        'orientation',
        'tickCount',
        'labeledTicks',
        'unitLabel'
      )
    )
    or axis ->> 'orientation' is null
    or axis ->> 'orientation' not in ('vertical', 'horizontal')
    or not public.jsonb_integer_at_least(axis -> 'tickCount', 2)
    or (axis ->> 'tickCount')::integer > 12
    or jsonb_typeof(axis -> 'unitLabel') is distinct from 'string'
    or btrim(axis ->> 'unitLabel') = ''
    or char_length(axis ->> 'unitLabel') > 4
    or jsonb_typeof(axis -> 'labeledTicks') is distinct from 'array'
    or jsonb_array_length(axis -> 'labeledTicks') not between 2 and 4 then
    return false;
  end if;
  tick_count := (axis ->> 'tickCount')::integer;
  labeled_ticks := axis -> 'labeledTicks';

  for tick_item, candidate_index in
    select value, ordinality::integer - 1
    from jsonb_array_elements(labeled_ticks) with ordinality
  loop
    if jsonb_typeof(tick_item) is distinct from 'object'
      or exists (
        select 1 from jsonb_object_keys(tick_item) key_name
        where key_name not in ('index', 'value')
      )
      or not public.jsonb_integer_at_least(tick_item -> 'index', 0)
      or not public.jsonb_integer_at_least(tick_item -> 'value', 0) then
      return false;
    end if;
    tick_index := (tick_item ->> 'index')::integer;
    tick_value := (tick_item ->> 'value')::integer;
    if tick_index > tick_count
      or tick_index <= previous_index
      or (
        candidate_index = 0
        and (tick_index <> 0 or tick_value <> 0)
      ) then
      return false;
    end if;
    if tick_index > 0 then
      if tick_value <= 0 or tick_value % tick_index <> 0 then
        return false;
      end if;
      current_step := tick_value / tick_index;
      if derived_step is null then
        derived_step := current_step;
      elsif derived_step <> current_step then
        return false;
      end if;
    end if;
    previous_index := tick_index;
  end loop;
  if previous_index <> tick_count or derived_step is null then
    return false;
  end if;
  if current_mode = 'unit-value'
    and exists (
      select 1 from jsonb_array_elements(labeled_ticks) tick
      where (tick ->> 'index')::integer = 1
    ) then
    return false;
  end if;

  if current_mode <> 'table-match' then
    bars := p_visual -> 'bars';
    if not public.jsonb_bar_array_valid(bars, tick_count) then
      return false;
    end if;
  end if;

  if current_mode = 'bar-value' then
    if jsonb_typeof(p_visual -> 'target') is distinct from 'string'
      or btrim(p_visual ->> 'target') = '' then
      return false;
    end if;
    select item into target_bar
    from jsonb_array_elements(bars) item
    where item ->> 'category' = p_visual ->> 'target';
    if target_bar is null then return false; end if;
    target_value := (target_bar ->> 'ticks')::integer * derived_step;
    return not exists (
      select 1 from jsonb_array_elements(labeled_ticks) tick
      where (tick ->> 'value')::integer = target_value
    );
  end if;

  if current_mode = 'bar-difference' then
    comparison := p_visual -> 'comparison';
    if jsonb_typeof(comparison) is distinct from 'object'
      or comparison ->> 'kind' is null
      or comparison ->> 'kind' not in ('pair', 'extremes') then
      return false;
    end if;
    if comparison ->> 'kind' = 'pair' then
      if exists (
        select 1 from jsonb_object_keys(comparison) key_name
        where key_name not in ('kind', 'categories')
      )
        or jsonb_typeof(comparison -> 'categories') is distinct from 'array'
        or jsonb_array_length(comparison -> 'categories') <> 2
        or jsonb_typeof(comparison #> '{categories,0}')
          is distinct from 'string'
        or jsonb_typeof(comparison #> '{categories,1}')
          is distinct from 'string'
        or comparison #>> '{categories,0}'
          = comparison #>> '{categories,1}' then
        return false;
      end if;
      select item into first_bar
      from jsonb_array_elements(bars) item
      where item ->> 'category' = comparison #>> '{categories,0}';
      select item into second_bar
      from jsonb_array_elements(bars) item
      where item ->> 'category' = comparison #>> '{categories,1}';
      if first_bar is null or second_bar is null then return false; end if;
    else
      if exists (
        select 1 from jsonb_object_keys(comparison) key_name
        where key_name <> 'kind'
      ) then
        return false;
      end if;
      select item into first_bar
      from jsonb_array_elements(bars) item
      order by (item ->> 'ticks')::integer desc
      limit 1;
      select item into second_bar
      from jsonb_array_elements(bars) item
      order by (item ->> 'ticks')::integer asc
      limit 1;
    end if;
    difference_value :=
      abs(
        (first_bar ->> 'ticks')::integer
        - (second_bar ->> 'ticks')::integer
      ) * derived_step;
    return difference_value > 0
      and not exists (
        select 1 from jsonb_array_elements(labeled_ticks) tick
        where (tick ->> 'value')::integer = difference_value
      );
  end if;

  if current_mode = 'table-match' then
    table_rows := p_visual -> 'table';
    candidates := p_visual -> 'candidates';
    if jsonb_typeof(table_rows) is distinct from 'array'
      or jsonb_array_length(table_rows) not between 2 and 6
      or jsonb_typeof(candidates) is distinct from 'array'
      or jsonb_array_length(candidates) <> 3 then
      return false;
    end if;
    for table_item in select value from jsonb_array_elements(table_rows)
    loop
      if jsonb_typeof(table_item) is distinct from 'object'
        or exists (
          select 1 from jsonb_object_keys(table_item) key_name
          where key_name not in ('category', 'count')
        )
        or jsonb_typeof(table_item -> 'category') is distinct from 'string'
        or btrim(table_item ->> 'category') = ''
        or char_length(table_item ->> 'category') > 8
        or not public.jsonb_integer_at_least(table_item -> 'count', 0)
        or (table_item ->> 'count')::integer > tick_count * derived_step
        or (table_item ->> 'count')::integer % derived_step <> 0 then
        return false;
      end if;
    end loop;
    if (
      select count(*) <> count(distinct item ->> 'category')
      from jsonb_array_elements(table_rows) item
    ) then
      return false;
    end if;

    for candidate in select value from jsonb_array_elements(candidates)
    loop
      if jsonb_typeof(candidate) is distinct from 'object'
        or exists (
          select 1 from jsonb_object_keys(candidate) key_name
          where key_name not in ('id', 'bars')
        )
        or candidate ->> 'id' is null
        or candidate ->> 'id' not in ('가', '나', '다')
        or not public.jsonb_bar_array_valid(
          candidate -> 'bars',
          tick_count
        )
        or jsonb_array_length(candidate -> 'bars')
          <> jsonb_array_length(table_rows) then
        return false;
      end if;
      table_count := jsonb_array_length(table_rows);
      for candidate_index in 0..table_count - 1 loop
        table_item := table_rows -> candidate_index;
        candidate_bar := candidate -> 'bars' -> candidate_index;
        if candidate_bar ->> 'category'
          is distinct from table_item ->> 'category' then
          return false;
        end if;
      end loop;
      if not exists (
        select 1
        from generate_series(0, table_count - 1) item_index
        where (
          candidate -> 'bars' -> item_index ->> 'ticks'
        )::integer * derived_step
          <> (
            table_rows -> item_index ->> 'count'
          )::integer
      ) then
        matching_candidates := matching_candidates + 1;
      end if;
    end loop;
    if (
      select count(*) <> count(distinct item ->> 'id')
      from jsonb_array_elements(candidates) item
    ) then
      return false;
    end if;
    return matching_candidates = 1;
  end if;

  return true;
end;
$$;

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_diagnosis_runtime_schema_before_bar_chart;

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
    perform public.assert_diagnosis_runtime_schema_before_bar_chart(p_content);
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_content -> 'judgments') judgment
    where judgment #>> '{visual,kind}' = 'bar-chart-diagram'
      and not public.jsonb_bar_chart_diagram_valid(judgment -> 'visual')
  ) then
    raise exception 'judgment runtime schema is invalid';
  end if;

  normalized_content := jsonb_set(
    p_content,
    '{judgments}',
    coalesce((
      select jsonb_agg(
        case
          when judgment #>> '{visual,kind}' = 'bar-chart-diagram'
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

  perform public.assert_diagnosis_runtime_schema_before_bar_chart(
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
  return not exists (
    select 1 from jsonb_object_keys(p_object) key_name
    where not (key_name = any(p_allowed))
  );
end;
$$;

revoke all on table public.curriculum_anchor_set_allowlist from public;
revoke all on table public.curriculum_anchor_set_allowlist
  from anon, authenticated;
revoke all on function public.assert_diagnosis_runtime_schema(jsonb)
  from public;
revoke all on function public.jsonb_bar_array_valid(jsonb, integer)
  from public;
revoke all on function public.jsonb_bar_chart_diagram_valid(jsonb)
  from public;
