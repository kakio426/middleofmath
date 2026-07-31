-- Rollback:
-- 1. Keep published diagnosis rows immutable.
-- 2. Remove only the grade4-semester1 allowances after no draft or
--    assignment references version 1.4.0.
-- 3. Drop [4수01-07] only after no content or allowance references it.

do $$
begin
  if not exists (
    select 1
    from public.curriculum_anchors
    where anchor_key = '[4수01-04]'
      and grade = 3
      and semester = 2
      and shared_across_semesters
      and not shared_across_grade_band
  ) then
    raise exception '[4수01-04] canonical grade3-semester2 row is missing or changed';
  end if;
  if not exists (
    select 1
    from public.curriculum_anchors
    where anchor_key = '[4수01-05]'
      and grade = 3
      and semester = 2
      and shared_across_semesters
      and not shared_across_grade_band
  ) then
    raise exception '[4수01-05] canonical grade3-semester2 row is missing or changed';
  end if;
  if not exists (
    select 1
    from public.curriculum_anchors
    where anchor_key = '[4수01-08]'
      and grade = 3
      and semester = 2
      and not shared_across_grade_band
  ) then
    raise exception '[4수01-08] canonical grade3-semester2 row is missing or changed';
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
  '[4수01-07]',
  4,
  1,
  '3-4',
  false,
  false,
  '나누는 수가 두 자리 수인 나눗셈의 계산 원리를 이해하고 계산하기',
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

insert into public.curriculum_anchor_set_allowlist (
  anchor_key,
  set_key,
  is_canonical,
  coverage,
  approved_by,
  approved_at
) values
  ('[4수01-04]', 'grade3-semester1', false, 'partial', 'teacher:workspace-owner', '2026-07-31T17:38:29+09:00'),
  ('[4수01-04]', 'grade3-semester2', true, 'partial', 'teacher:workspace-owner', '2026-07-31T17:38:29+09:00'),
  ('[4수01-04]', 'grade4-semester1', false, 'partial', 'teacher:workspace-owner', '2026-07-31T17:38:29+09:00'),
  ('[4수01-05]', 'grade3-semester1', false, 'partial', 'teacher:workspace-owner', '2026-07-31T17:38:29+09:00'),
  ('[4수01-05]', 'grade3-semester2', true, 'partial', 'teacher:workspace-owner', '2026-07-31T17:38:29+09:00'),
  ('[4수01-05]', 'grade4-semester1', false, 'partial', 'teacher:workspace-owner', '2026-07-31T17:38:29+09:00'),
  ('[4수01-07]', 'grade4-semester1', true, 'partial', 'teacher:workspace-owner', '2026-07-31T17:38:29+09:00'),
  ('[4수01-08]', 'grade3-semester2', true, 'partial', 'teacher:workspace-owner', '2026-07-31T17:38:29+09:00'),
  ('[4수01-08]', 'grade4-semester1', false, 'partial', 'teacher:workspace-owner', '2026-07-31T17:38:29+09:00')
on conflict (anchor_key, set_key) do update
set is_canonical = excluded.is_canonical,
    coverage = excluded.coverage,
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at;

revoke insert, update, delete, truncate
  on public.curriculum_anchor_set_allowlist
  from anon, authenticated;
