begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select results_eq(
  $$select anchor_key, grade, semester, grade_band
    from public.curriculum_anchors
    where anchor_key in ('[4수03-04]', '[4수03-05]')
    order by anchor_key$$,
  $$values
      ('[4수03-04]'::text, 4::smallint, 1::smallint, '3-4'::text),
      ('[4수03-05]'::text, 4::smallint, 1::smallint, '3-4'::text)$$,
  'the two A2-1-approved figure transformation anchors are registered'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key in ('[4수03-04]', '[4수03-05]')
      and not shared_across_semesters
      and not shared_across_grade_band
  ),
  2::bigint,
  'A2-1 approval does not authorize cross-semester or cross-grade reuse'
);

select ok(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"slide",
      "rows":6,
      "columns":8,
      "sourceCells":[
        {"row":1,"column":1},
        {"row":2,"column":1},
        {"row":2,"column":2}
      ],
      "targetCells":[
        {"row":1,"column":4},
        {"row":2,"column":4},
        {"row":2,"column":5}
      ],
      "sourceMarker":{"row":1,"column":1},
      "targetMarker":{"row":1,"column":4},
      "direction":"right",
      "amount":3
    }'::jsonb
  ),
  'an exact three-cell slide and its marker are accepted'
);

select is(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"slide",
      "rows":6,
      "columns":8,
      "sourceCells":[{"row":1,"column":1}],
      "targetCells":[{"row":1,"column":3}],
      "direction":"right",
      "amount":3
    }'::jsonb
  ),
  false,
  'a target cell that disagrees with the declared slide is rejected'
);

select ok(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"flip-left-right",
      "rows":5,
      "columns":8,
      "sourceCells":[
        {"row":1,"column":1},
        {"row":2,"column":1},
        {"row":2,"column":2}
      ],
      "targetCells":[
        {"row":1,"column":6},
        {"row":2,"column":6},
        {"row":2,"column":5}
      ],
      "axisIndex":4
    }'::jsonb
  ),
  'a left-right flip across an in-grid vertical axis is accepted'
);

select is(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"flip-left-right",
      "rows":5,
      "columns":8,
      "sourceCells":[{"row":1,"column":1}],
      "targetCells":[{"row":1,"column":6}],
      "axisIndex":8
    }'::jsonb
  ),
  false,
  'a flip axis outside the grid is rejected'
);

select ok(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"rotate",
      "rows":7,
      "columns":7,
      "sourceCells":[
        {"row":1,"column":3},
        {"row":2,"column":3},
        {"row":2,"column":4}
      ],
      "targetCells":[
        {"row":3,"column":5},
        {"row":3,"column":4},
        {"row":4,"column":4}
      ],
      "center":{"row":3,"column":3},
      "turn":"clockwise"
    }'::jsonb
  ),
  'a clockwise quarter turn around a fixed center is accepted'
);

select is(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"rotate",
      "rows":7,
      "columns":7,
      "sourceCells":[{"row":1,"column":3}],
      "targetCells":[{"row":3,"column":1}],
      "center":{"row":3,"column":3},
      "turn":"clockwise"
    }'::jsonb
  ),
  false,
  'a rotation target in the opposite direction is rejected'
);

select ok(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"point-move",
      "rows":6,
      "columns":8,
      "points":[
        {"label":"A","row":4,"column":1},
        {"label":"B","row":1,"column":5}
      ]
    }'::jsonb
  ),
  'two distinct A and B points are accepted'
);

select is(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"point-move",
      "rows":6,
      "columns":8,
      "points":[
        {"label":"A","row":4,"column":1},
        {"label":"A","row":1,"column":5}
      ]
    }'::jsonb
  ),
  false,
  'duplicate point labels are rejected'
);

select is(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"point-move",
      "rows":6,
      "columns":8,
      "points":[
        {"label":"A","row":6,"column":1},
        {"label":"B","row":1,"column":5}
      ]
    }'::jsonb
  ),
  false,
  'a point outside the grid is rejected'
);

select is(
  public.jsonb_grid_transform_diagram_valid(
    '{
      "kind":"grid-transform-diagram",
      "mode":"point-move",
      "rows":6,
      "columns":8,
      "points":[
        {"label":"A","row":4,"column":1},
        {"label":"B","row":1,"column":5}
      ],
      "sourceCells":[{"row":4,"column":1}]
    }'::jsonb
  ),
  false,
  'point movement cannot be disguised as vertex-based figure movement'
);

select lives_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind":"grid-transform-diagram",
          "mode":"point-move",
          "rows":6,
          "columns":8,
          "points":[
            {"label":"A","row":4,"column":1},
            {"label":"B","row":1,"column":5}
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
  'the database runtime contract accepts a valid point-move diagram'
);

select throws_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind":"grid-transform-diagram",
          "mode":"slide",
          "rows":6,
          "columns":8,
          "sourceCells":[{"row":1,"column":1}],
          "targetCells":[{"row":1,"column":3}],
          "direction":"right",
          "amount":3
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
  'the database runtime contract rejects inconsistent transform coordinates'
);

select * from finish();
rollback;
