begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

select lives_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind": "partition-diagrams",
          "diagrams": [
            {"label": "가", "parts": [1, 1, 1, 1], "highlightedPart": 0},
            {"label": "나", "parts": [1, 2, 1, 2], "highlightedPart": 0}
          ]
        }'::jsonb,
        true
      )
    )
    from (
      select content
      from public.diagnosis_sets
      where set_key = 'grade3-semester2'
        and status = 'published'
      order by published_at desc
      limit 1
    ) source$$,
  'the database runtime contract accepts semantic equal-partition diagrams'
);

select lives_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind": "length-relation",
          "value": 2,
          "fromUnit": "km",
          "targetUnit": "m"
        }'::jsonb,
        true
      )
    )
    from (
      select content
      from public.diagnosis_sets
      where set_key = 'grade3-semester2'
        and status = 'published'
      order by published_at desc
      limit 1
    ) source$$,
  'the database runtime contract accepts a length-unit relation visual'
);

select throws_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind": "partition-diagrams",
          "diagrams": [
            {"label": "가", "parts": [1, 1, 1], "highlightedPart": 3}
          ]
        }'::jsonb,
        true
      )
    )
    from (
      select content
      from public.diagnosis_sets
      where set_key = 'grade3-semester2'
        and status = 'published'
      order by published_at desc
      limit 1
    ) source$$,
  'P0001',
  'judgment runtime schema is invalid',
  'an out-of-range highlighted partition is rejected'
);

select * from finish();
rollback;
