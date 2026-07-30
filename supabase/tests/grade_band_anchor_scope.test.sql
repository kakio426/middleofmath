begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where active and grade_band = '3-4'
  ),
  23::bigint,
  'all 23 currently approved [4수] anchors record their 3-4 grade-band provenance'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where shared_across_grade_band
  ),
  0::bigint,
  'grade-band provenance alone does not authorize any grade 4 use'
);

update public.curriculum_anchors
set shared_across_grade_band = true
where anchor_key = '[4수01-04]';

alter table public.diagnosis_sets disable trigger user;
alter table public.diagnosis_sets
  enable trigger diagnosis_sets_curriculum_alignment_guard;

select lives_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '41000000-0000-0000-0000-000000000001',
      'grade4-semester1-grade-band-positive',
      '1.0.0',
      'grade-band-positive',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 4, "semester": 1},
        "curriculumAnchors": [{"id": "[4수01-04]"}]
      }'::jsonb
    )$$,
  'an explicitly approved grade-band anchor can be used by grade 4'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '41000000-0000-0000-0000-000000000002',
      'grade4-semester1-length-negative',
      '1.0.0',
      'grade-band-negative-length',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 4, "semester": 1},
        "curriculumAnchors": [{"id": "[4수03-16]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'a grade 3 semester 1-only anchor remains unavailable to grade 4'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '41000000-0000-0000-0000-000000000003',
      'grade4-semester2-capacity-negative',
      '1.0.0',
      'grade-band-negative-capacity',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 4, "semester": 2},
        "curriculumAnchors": [{"id": "[4수03-17]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'a grade 3 semester 2-only anchor remains unavailable to grade 4'
);

select lives_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '31000000-0000-0000-0000-000000000011',
      'grade3-semester1-grade-band-regression',
      '1.0.0',
      'grade3-regression-positive',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 3, "semester": 1},
        "curriculumAnchors": [
          {"id": "[4수01-04]"},
          {"id": "[4수01-05]"},
          {"id": "[4수01-06]"},
          {"id": "[4수01-09]"},
          {"id": "[4수03-16]"}
        ]
      }'::jsonb
    )$$,
  'the existing grade 3 semester 1 shared and local anchors still align'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '31000000-0000-0000-0000-000000000012',
      'grade3-semester1-grade-band-negative',
      '1.0.0',
      'grade3-regression-negative',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 3, "semester": 1},
        "curriculumAnchors": [{"id": "[4수03-17]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'the existing grade 3 semester boundary remains enforced'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '31000000-0000-0000-0000-000000000013',
      'grade3-semester2-grade-band-negative',
      '1.0.0',
      'grade3-regression-negative-reverse',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 3, "semester": 2},
        "curriculumAnchors": [{"id": "[4수03-16]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'the reverse grade 3 semester boundary remains enforced'
);

select ok(
  (
    select shared_across_grade_band
      and shared_across_semesters
      and grade_band = '3-4'
    from public.curriculum_anchors
    where anchor_key = '[4수01-04]'
  ),
  'cross-grade and cross-semester approvals are independent explicit flags'
);

select * from finish();
rollback;
