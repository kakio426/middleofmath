begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key in ('[6수01-06]', '[6수01-07]', '[6수01-12]')
  ),
  0::bigint,
  'the A4-4 review loop does not publish fraction reduction anchors'
);

select is(
  (
    select count(*)
    from public.curriculum_anchor_set_allowlist
    where set_key = 'grade5-semester1'
  ),
  0::bigint,
  'the four-unit grade 5 review set still receives no publication allow-list rows'
);

select is(
  (
    select count(*)
    from public.diagnosis_sets
    where set_key = 'grade5-semester1'
  ),
  0::bigint,
  'the four-unit grade 5 semester 1 review content is not published'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade5-semester1'
  ),
  0::bigint,
  'teacher-only fraction rationales remain outside the database'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '54000000-0000-0000-0000-000000000006',
      'grade5-semester1-fraction-equivalence-review-negative',
      '1.0.0',
      'fraction-equivalence-review-negative',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 5, "semester": 1},
        "curriculumAnchors": [{"id": "[6수01-06]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'the unpublished fraction equivalence anchor cannot enter a database diagnosis set'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '54000000-0000-0000-0000-000000000007',
      'grade5-semester1-fraction-compare-review-negative',
      '1.0.0',
      'fraction-compare-review-negative',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 5, "semester": 1},
        "curriculumAnchors": [{"id": "[6수01-07]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'the unpublished fraction comparison anchor cannot enter a database diagnosis set'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '54000000-0000-0000-0000-000000000012',
      'grade5-semester1-fraction-decimal-review-negative',
      '1.0.0',
      'fraction-decimal-review-negative',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 5, "semester": 1},
        "curriculumAnchors": [{"id": "[6수01-12]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'the unpublished fraction-decimal anchor cannot enter a database diagnosis set'
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
  'the shared SQL runtime contract accepts grade 5 fraction review-shaped content'
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
