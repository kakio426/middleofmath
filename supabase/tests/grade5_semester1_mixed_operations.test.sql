begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key = '[6수01-01]'
  ),
  0::bigint,
  'the A4-1 review loop does not publish the mixed-operations anchor'
);

select is(
  (
    select count(*)
    from public.curriculum_anchor_set_allowlist
    where set_key = 'grade5-semester1'
  ),
  0::bigint,
  'the review set receives no publication allow-list rows'
);

select is(
  (
    select count(*)
    from public.diagnosis_sets
    where set_key = 'grade5-semester1'
  ),
  0::bigint,
  'the grade 5 semester 1 review content is not published as a database set'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade5-semester1'
  ),
  0::bigint,
  'teacher-only mixed-operations rationales are not published before approval'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '51000000-0000-0000-0000-000000000001',
      'grade5-semester1-mixed-operations-review-negative',
      '1.0.0',
      'mixed-operations-review-negative',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 5, "semester": 1},
        "curriculumAnchors": [{"id": "[6수01-01]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'an unpublished review anchor cannot enter a database diagnosis set'
);

select lives_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        jsonb_set(
          (
            select content
            from public.diagnosis_sets
            where set_key = 'grade4-semester1'
              and version = '1.4.0'
          ),
          '{manifest,grade}',
          '5'::jsonb,
          true
        ),
        '{manifest,semester}',
        '1'::jsonb,
        true
      )
    )$$,
  'the shared SQL runtime contract accepts elementary grade 5 content'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.assert_diagnosis_runtime_schema(jsonb)',
    'execute'
  ),
  'anonymous clients cannot execute the internal runtime schema guard'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.assert_diagnosis_runtime_schema(jsonb)',
    'execute'
  ),
  'authenticated clients cannot execute the internal runtime schema guard'
);

select * from finish();

rollback;
