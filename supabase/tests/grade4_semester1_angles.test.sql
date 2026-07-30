begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

select results_eq(
  $$select anchor_key, grade, semester, grade_band
    from public.curriculum_anchors
    where anchor_key in ('[4수03-02]', '[4수03-24]', '[4수03-25]')
    order by anchor_key$$,
  $$values
      ('[4수03-02]'::text, 4::smallint, 1::smallint, '3-4'::text),
      ('[4수03-24]'::text, 4::smallint, 1::smallint, '3-4'::text),
      ('[4수03-25]'::text, 4::smallint, 1::smallint, '3-4'::text)$$,
  'the three A1-approved angle anchors are registered for grade 4 semester 1'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key in ('[4수03-02]', '[4수03-24]', '[4수03-25]')
      and not shared_across_semesters
      and not shared_across_grade_band
  ),
  3::bigint,
  'A1 angle approval does not authorize cross-semester or cross-grade reuse'
);

select ok(
  public.jsonb_angle_figure_valid(
    '{"kind":"angle-figure","degrees":90,"mode":"bare","rayLengths":[42,88],"label":"가"}'::jsonb
  ),
  'a valid bare angle with unequal rays is accepted'
);

select is(
  public.jsonb_angle_figure_valid(
    '{"kind":"angle-figure","degrees":180,"mode":"bare"}'::jsonb
  ),
  false,
  'a straight angle outside the elementary diagnostic contract is rejected'
);

select is(
  public.jsonb_angle_figure_valid(
    '{"kind":"angle-figure","degrees":85,"mode":"bare","protractorPlacement":"aligned"}'::jsonb
  ),
  false,
  'a bare angle cannot carry a hidden protractor placement'
);

select ok(
  public.jsonb_angle_figure_valid(
    '{"kind":"angle-figure","degrees":125,"mode":"protractor","protractorPlacement":"aligned"}'::jsonb
  ),
  'an aligned protractor angle is accepted'
);

select ok(
  public.jsonb_polygon_angle_diagram_valid(
    '{
      "kind":"polygon-angle-diagram",
      "polygon":"triangle",
      "mode":"find-missing",
      "angles":[
        {"label":"가","value":55},
        {"label":"나","value":80},
        {"label":"다","value":null}
      ]
    }'::jsonb
  ),
  'a triangle with one valid missing angle is accepted'
);

select is(
  public.jsonb_polygon_angle_diagram_valid(
    '{
      "kind":"polygon-angle-diagram",
      "polygon":"triangle",
      "mode":"find-missing",
      "angles":[
        {"label":"가","value":55},
        {"label":"나","value":80},
        {"label":"다","value":45}
      ]
    }'::jsonb
  ),
  false,
  'a find-missing diagram without a missing angle is rejected'
);

select is(
  public.jsonb_polygon_angle_diagram_valid(
    '{
      "kind":"polygon-angle-diagram",
      "polygon":"triangle",
      "mode":"verify-claim",
      "angles":[
        {"label":"가","value":60},
        {"label":"가","value":70},
        {"label":"다","value":60}
      ]
    }'::jsonb
  ),
  false,
  'duplicate angle labels are rejected'
);

select is(
  public.jsonb_polygon_angle_diagram_valid(
    '{
      "kind":"polygon-angle-diagram",
      "polygon":"triangle",
      "mode":"find-missing",
      "angles":[
        {"label":"가","value":100},
        {"label":"나","value":90},
        {"label":"다","value":null}
      ]
    }'::jsonb
  ),
  false,
  'known angles that imply a non-positive missing angle are rejected'
);

select is(
  public.jsonb_polygon_angle_diagram_valid(
    '{
      "kind":"polygon-angle-diagram",
      "polygon":"triangle",
      "mode":"verify-claim",
      "angles":[
        {"label":"가","value":60},
        {"label":"나","value":70},
        {"label":"다","value":50}
      ],
      "diagonal":false
    }'::jsonb
  ),
  false,
  'a triangle cannot carry a diagonal field'
);

select ok(
  public.jsonb_polygon_angle_diagram_valid(
    '{
      "kind":"polygon-angle-diagram",
      "polygon":"quadrilateral",
      "mode":"verify-claim",
      "angles":[
        {"label":"가","value":95},
        {"label":"나","value":100},
        {"label":"다","value":80},
        {"label":"라","value":85}
      ],
      "diagonal":true
    }'::jsonb
  ),
  'a quadrilateral split into two triangles is accepted'
);

select lives_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind":"angle-figure",
          "degrees":125,
          "mode":"protractor",
          "protractorPlacement":"aligned"
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
  'the database runtime contract accepts a valid angle figure'
);

select throws_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind":"polygon-angle-diagram",
          "polygon":"triangle",
          "mode":"find-missing",
          "angles":[
            {"label":"가","value":100},
            {"label":"나","value":90},
            {"label":"다","value":null}
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
  'the runtime contract rejects a malformed angle diagram cleanly'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              content,
              '{manifest,id}',
              '"grade4-angle-unknown-field"'::jsonb,
              true
            ),
            '{manifest,version}',
            '"1.0.0"'::jsonb,
            true
          ),
          '{judgments,0,visual}',
          '{
            "kind":"angle-figure",
            "degrees":90,
            "mode":"bare"
          }'::jsonb,
          true
        ),
        '{judgments,0,visual,answer}',
        '"right-angle"'::jsonb,
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
      'grade4-angle-unknown-field',
      '1.0.0',
      'fake',
      'published',
      content -> 'manifest',
      content,
      now()
    from source$$,
  'P0001',
  'diagnosis content contains unknown fields',
  'the known-key guard rejects answer data hidden in an angle visual'
);

select * from finish();
rollback;
