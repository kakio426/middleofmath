begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

select results_eq(
  $$select anchor_key, grade, semester, grade_band,
      shared_across_semesters, shared_across_grade_band
    from public.curriculum_anchors
    where anchor_key = '[4수01-07]'$$,
  $$values (
      '[4수01-07]'::text, 4::smallint, 1::smallint, '3-4'::text,
      false, false
    )$$,
  '[4수01-07] is registered only for grade 4 semester 1'
);

select results_eq(
  $$select anchor_key, grade, semester, shared_across_semesters,
      shared_across_grade_band
    from public.curriculum_anchors
    where anchor_key in ('[4수01-04]', '[4수01-05]', '[4수01-08]')
    order by anchor_key$$,
  $$values
      ('[4수01-04]'::text, 3::smallint, 2::smallint, true, false),
      ('[4수01-05]'::text, 3::smallint, 2::smallint, true, false),
      ('[4수01-08]'::text, 3::smallint, 2::smallint, false, false)$$,
  'the three legacy canonical anchor rows keep their grade 3 scope'
);

select is(
  (select count(*) from public.curriculum_anchor_set_allowlist),
  12::bigint,
  'the exact cross-set allow-list has twelve reviewed rows'
);

select is(
  (
    select count(*)
    from public.curriculum_anchor_set_allowlist
    where anchor_key in (
      '[4수01-04]', '[4수01-05]', '[4수01-07]', '[4수01-08]'
    )
      and coverage = 'partial'
      and approved_by = 'teacher:workspace-owner'
      and approved_at = '2026-07-31T17:38:29+09:00'::timestamptz
  ),
  9::bigint,
  'all nine multiplication and division allowances retain approval evidence'
);

alter table public.diagnosis_sets disable trigger user;
alter table public.diagnosis_sets
  enable trigger diagnosis_sets_curriculum_alignment_guard;

select lives_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '43000000-0000-0000-0000-000000000001',
      'grade4-semester1-muldiv-positive',
      '1.0.0', 'muldiv-positive', 'draft', '{}'::jsonb,
      '{
        "manifest": {"grade": 4, "semester": 1},
        "curriculumAnchors": [
          {"id": "[4수01-04]"}, {"id": "[4수01-05]"},
          {"id": "[4수01-07]"}, {"id": "[4수01-08]"}
        ]
      }'::jsonb
    )$$,
  'grade 4 semester 1 may use the four reviewed unit anchors'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '43000000-0000-0000-0000-000000000002',
      'grade4-semester2-muldiv-negative',
      '1.0.0', 'muldiv-negative-semester', 'draft', '{}'::jsonb,
      '{
        "manifest": {"grade": 4, "semester": 2},
        "curriculumAnchors": [{"id": "[4수01-07]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'the allow-list does not pre-authorize grade 4 semester 2'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '43000000-0000-0000-0000-000000000003',
      'grade4-semester1-unapproved-anchor',
      '1.0.0', 'muldiv-negative-anchor', 'draft', '{}'::jsonb,
      '{
        "manifest": {"grade": 4, "semester": 1},
        "curriculumAnchors": [{"id": "[4수01-06]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  '[4수01-06] is not imported into the grade 4 unit'
);

select lives_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '43000000-0000-0000-0000-000000000004',
      'grade3-semester1-muldiv-regression',
      '1.0.0', 'muldiv-grade3-semester1', 'draft', '{}'::jsonb,
      '{
        "manifest": {"grade": 3, "semester": 1},
        "curriculumAnchors": [
          {"id": "[4수01-04]"}, {"id": "[4수01-05]"}
        ]
      }'::jsonb
    )$$,
  'the reviewed grade 3 semester 1 use remains available'
);

select lives_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '43000000-0000-0000-0000-000000000005',
      'grade3-semester2-estimate-regression',
      '1.0.0', 'muldiv-grade3-semester2', 'draft', '{}'::jsonb,
      '{
        "manifest": {"grade": 3, "semester": 2},
        "curriculumAnchors": [{"id": "[4수01-08]"}]
      }'::jsonb
    )$$,
  'the reviewed grade 3 semester 2 estimate use remains available'
);

select is(
  (
    select count(*)
    from public.curriculum_anchor_set_allowlist
    where set_key = 'grade4-semester2'
  ),
  0::bigint,
  'no multiplication or division anchor is allowed in grade 4 semester 2'
);

select ok(
  (
    select count(*) = 4
      and count(*) filter (where shared_across_grade_band) = 0
    from public.curriculum_anchors
    where anchor_key in (
      '[4수01-04]', '[4수01-05]', '[4수01-07]', '[4수01-08]'
    )
  ),
  'grade-band provenance does not turn on a broad sharing flag'
);

select * from finish();
rollback;
