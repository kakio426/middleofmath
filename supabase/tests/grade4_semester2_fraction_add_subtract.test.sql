create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key = '[4수01-15]'
  ),
  0::bigint,
  'the A3-2 review loop does not publish the fraction anchor to the database'
);

select is(
  (
    select count(*)
    from public.curriculum_anchor_set_allowlist
    where set_key = 'grade4-semester2'
  ),
  0::bigint,
  'the review set receives no publication allow-list rows'
);

select is(
  (
    select count(*)
    from public.diagnosis_sets
    where set_key = 'grade4-semester2'
  ),
  0::bigint,
  'the grade 4 semester 2 review content is not published as a database set'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      id, set_key, version, checksum, status, manifest, content
    ) values (
      '42000000-0000-0000-0000-000000000015',
      'grade4-semester2-fraction-review-negative',
      '1.1.0',
      'fraction-review-negative',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 4, "semester": 2},
        "curriculumAnchors": [{"id": "[4수01-15]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'an un-published review anchor cannot enter a database diagnosis set'
);

select throws_ok(
  $$
    select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        (
          select content
          from public.diagnosis_sets
          where set_key = 'grade4-semester1'
            and version = '1.4.0'
        ),
        '{judgments,0,visual}',
        '{"kind":"fraction-bar","numerator":2,"denominator":0}'::jsonb,
        true
      )
    )
  $$,
  'judgment runtime schema is invalid',
  'the existing fraction bar guard rejects a zero denominator'
);

select throws_ok(
  $$
    select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        (
          select content
          from public.diagnosis_sets
          where set_key = 'grade4-semester1'
            and version = '1.4.0'
        ),
        '{judgments,0,visual}',
        '{"kind":"fraction-bar","numerator":2,"denominator":7,"answer":"5/7"}'::jsonb,
        true
      )
    )
  $$,
  'judgment runtime schema is invalid',
  'the existing fraction bar guard rejects an answer-leaking unknown key'
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
