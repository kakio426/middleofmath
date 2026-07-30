begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select results_eq(
  $$select anchor_key, grade, semester, grade_band
    from public.curriculum_anchors
    where anchor_key in ('[4수01-01]', '[4수01-02]')
    order by anchor_key$$,
  $$values
      ('[4수01-01]'::text, 4::smallint, 1::smallint, '3-4'::text),
      ('[4수01-02]'::text, 4::smallint, 1::smallint, '3-4'::text)$$,
  'the two A1-approved large-number anchors are registered for grade 4 semester 1'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key in ('[4수01-01]', '[4수01-02]')
      and not shared_across_semesters
      and not shared_across_grade_band
  ),
  2::bigint,
  'A1 approval does not accidentally authorize cross-semester or cross-grade reuse'
);

select ok(
  public.jsonb_place_value_chart_valid(
    '{
      "kind": "place-value-chart",
      "digits": [3, 0, 5, 2, 7],
      "ask": "value",
      "highlightIndexes": [2]
    }'::jsonb
  ),
  'a valid highlighted place-value chart is accepted'
);

select ok(
  public.jsonb_place_value_chart_valid(
    '{
      "kind": "place-value-chart",
      "digits": [3, 0, 5, 2, 7],
      "ask": "place-name"
    }'::jsonb
  ),
  'a place-name chart without answer-revealing highlight is accepted'
);

select is(
  public.jsonb_place_value_chart_valid(
    '{
      "kind": "place-value-chart",
      "digits": [0, 3, 5, 2],
      "ask": "value",
      "highlightIndexes": [1]
    }'::jsonb
  ),
  false,
  'a leading-zero place-value chart is rejected'
);

select is(
  public.jsonb_place_value_chart_valid(
    '{
      "kind": "place-value-chart",
      "digits": [3, "x", 5, 2],
      "ask": "value",
      "highlightIndexes": [1]
    }'::jsonb
  ),
  false,
  'a non-numeric digit is rejected without a database cast error'
);

select is(
  public.jsonb_place_value_chart_valid(
    '{
      "kind": "place-value-chart",
      "digits": [3, 0, 5, 2],
      "ask": "value",
      "highlightIndexes": [1, 1]
    }'::jsonb
  ),
  false,
  'duplicate highlight indexes are rejected'
);

select is(
  public.jsonb_place_value_chart_valid(
    '{
      "kind": "place-value-chart",
      "digits": [3, 0, 5, 2],
      "ask": "value",
      "highlightIndexes": [4]
    }'::jsonb
  ),
  false,
  'an out-of-range highlight index is rejected'
);

select is(
  public.jsonb_place_value_chart_valid(
    '{
      "kind": "place-value-chart",
      "digits": [3, 0, 5, 2],
      "ask": "place-name",
      "highlightIndexes": [1]
    }'::jsonb
  ),
  false,
  'a place-name prompt cannot leak the answer through highlighting'
);

select lives_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind": "place-value-chart",
          "digits": [3, 0, 5, 2, 7],
          "ask": "value",
          "highlightIndexes": [2]
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
  'the database runtime contract accepts a valid place-value chart'
);

select throws_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind": "place-value-chart",
          "digits": [3, 0, 5, 2],
          "ask": "value",
          "highlightIndexes": ["x"]
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
  'the runtime contract rejects a malformed place-value chart cleanly'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              content,
              '{manifest,id}',
              '"grade4-place-value-unknown-field"'::jsonb,
              true
            ),
            '{manifest,version}',
            '"1.0.0"'::jsonb,
            true
          ),
          '{judgments,0,visual}',
          '{
            "kind": "place-value-chart",
            "digits": [3, 0, 5, 2],
            "ask": "value",
            "highlightIndexes": [1]
          }'::jsonb,
          true
        ),
        '{judgments,0,visual,answer}',
        '"thousands"'::jsonb,
        true
      ) as content
      from public.diagnosis_sets
      where set_key = 'grade3-semester2'
        and status = 'published'
      order by published_at desc
      limit 1
    )
    insert into public.diagnosis_sets (
      set_key,
      version,
      checksum,
      status,
      manifest,
      content,
      published_at
    )
    select
      'grade4-place-value-unknown-field',
      '1.0.0',
      'fake',
      'published',
      content -> 'manifest',
      content,
      now()
    from source$$,
  'P0001',
  'diagnosis content contains unknown fields',
  'the known-key guard rejects answer data hidden in a place-value visual'
);

select * from finish();
rollback;
