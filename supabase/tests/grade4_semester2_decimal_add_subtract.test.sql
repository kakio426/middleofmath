create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key = '[4수01-13]'
  ),
  0::bigint,
  'the A3-4 review loop does not publish the decimal place-value anchor'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key = '[4수01-14]'
  ),
  0::bigint,
  'the A3-4 review loop does not publish the decimal comparison anchor'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key = '[4수01-16]'
  ),
  0::bigint,
  'the A3-4 review loop does not publish the decimal operation anchor'
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
      '42000000-0000-0000-0000-000000000016',
      'grade4-semester2-decimal-review-negative',
      '1.3.0',
      'decimal-review-negative',
      'draft',
      '{}'::jsonb,
      '{
        "manifest": {"grade": 4, "semester": 2},
        "curriculumAnchors": [{"id": "[4수01-13]"}]
      }'::jsonb
    )$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'an unpublished review anchor cannot enter a database diagnosis set'
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
