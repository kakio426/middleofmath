begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

select results_eq(
  $$select grade, semester, label
    from public.curriculum_anchors
    where anchor_key = '[4수03-16]'$$,
  $$values (3::smallint, 1::smallint, '길이'::text)$$,
  'the grounded length anchor is registered as an editorial semester 1 row'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where active and grade = 3 and semester = 2
  ),
  17::bigint,
  'the 17 reviewed semester 2 anchors remain unchanged'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key = '[4수03-05]'
  ),
  0::bigint,
  'the unsupported plane-figure anchor is not registered as semester 1'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where active
      and shared_across_semesters
      and anchor_key in (
        '[4수01-04]',
        '[4수01-05]',
        '[4수01-06]',
        '[4수01-09]'
      )
  ),
  4::bigint,
  'the four 3-4 grade-band number anchors are explicitly shared across semesters'
);

alter table public.diagnosis_sets disable trigger user;
alter table public.diagnosis_sets
  enable trigger diagnosis_sets_curriculum_alignment_guard;

select lives_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '31000000-0000-0000-0000-000000000001',
      'grade3-semester1-alignment-positive',
      '1.0.0',
      'anchor-positive',
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
  'semester 1 publication alignment accepts shared grade-band anchors and its local length anchor'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '31000000-0000-0000-0000-000000000002',
      'grade3-semester1-alignment-negative',
      '1.0.0',
      'anchor-negative',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 3, "semester": 1},
        "curriculumAnchors": [{"id": "[4수03-17]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'a semester 2-only anchor is rejected from semester 1'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '31000000-0000-0000-0000-000000000003',
      'grade3-semester2-local-anchor-negative',
      '1.0.0',
      'anchor-negative-reverse',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 3, "semester": 2},
        "curriculumAnchors": [{"id": "[4수03-16]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'the semester 1-only length anchor does not become shared accidentally'
);

select * from finish();
rollback;
