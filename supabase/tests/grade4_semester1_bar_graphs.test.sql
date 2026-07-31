begin;

create extension if not exists pgtap with schema extensions;
select plan(28);

select results_eq(
  $$select anchor_key, grade, semester, shared_across_semesters,
      shared_across_grade_band
    from public.curriculum_anchors
    where anchor_key = '[4수04-01]'$$,
  $$values (
      '[4수04-01]'::text,
      3::smallint,
      2::smallint,
      false,
      false
    )$$,
  '[4수04-01] keeps its grade 3 semester 2 canonical registration'
);

select results_eq(
  $$select anchor_key, grade, semester, shared_across_semesters,
      shared_across_grade_band
    from public.curriculum_anchors
    where anchor_key = '[4수04-03]'$$,
  $$values (
      '[4수04-03]'::text,
      4::smallint,
      1::smallint,
      false,
      false
    )$$,
  '[4수04-03] is registered for grade 4 semester 1 without broad sharing'
);

select results_eq(
  $$select anchor_key, set_key, is_canonical, coverage
    from public.curriculum_anchor_set_allowlist
    order by anchor_key, set_key$$,
  $$values
      ('[4수01-04]'::text, 'grade3-semester1'::text, false, 'partial'::text),
      ('[4수01-04]'::text, 'grade3-semester2'::text, true, 'partial'::text),
      ('[4수01-04]'::text, 'grade4-semester1'::text, false, 'partial'::text),
      ('[4수01-05]'::text, 'grade3-semester1'::text, false, 'partial'::text),
      ('[4수01-05]'::text, 'grade3-semester2'::text, true, 'partial'::text),
      ('[4수01-05]'::text, 'grade4-semester1'::text, false, 'partial'::text),
      ('[4수01-07]'::text, 'grade4-semester1'::text, true, 'partial'::text),
      ('[4수01-08]'::text, 'grade3-semester2'::text, true, 'partial'::text),
      ('[4수01-08]'::text, 'grade4-semester1'::text, false, 'partial'::text),
      ('[4수04-01]'::text, 'grade3-semester2'::text, true, 'partial'::text),
      ('[4수04-01]'::text, 'grade4-semester1'::text, false, 'partial'::text),
      ('[4수04-03]'::text, 'grade4-semester1'::text, true, 'partial'::text)$$,
  'the cross-set allow-list contains only the twelve reviewed placements'
);

select is(
  (
    select count(*)
    from public.curriculum_anchor_set_allowlist
    where set_key = 'grade4-semester2'
  ),
  0::bigint,
  'the allow-list does not pre-authorize the unreviewed grade 4 semester 2 set'
);

select ok(
  (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.curriculum_anchor_set_allowlist'::regclass
  ),
  'row level security protects the public approval allow-list'
);

select ok(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram",
      "mode":"unit-value",
      "axis":{
        "orientation":"vertical",
        "tickCount":5,
        "labeledTicks":[{"index":0,"value":0},{"index":5,"value":50}],
        "unitLabel":"권"
      },
      "bars":[
        {"category":"동화","ticks":3},
        {"category":"과학","ticks":5}
      ]
    }'::jsonb
  ),
  'a unit-value chart derives ten units from five intervals'
);

select ok(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram",
      "mode":"bar-value",
      "axis":{
        "orientation":"horizontal",
        "tickCount":6,
        "labeledTicks":[{"index":0,"value":0},{"index":6,"value":30}],
        "unitLabel":"명"
      },
      "bars":[
        {"category":"축구","ticks":4},
        {"category":"야구","ticks":2}
      ],
      "target":"축구"
    }'::jsonb
  ),
  'a bar-value chart accepts a target whose value is not printed'
);

select ok(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram",
      "mode":"bar-difference",
      "axis":{
        "orientation":"vertical",
        "tickCount":12,
        "labeledTicks":[{"index":0,"value":0},{"index":12,"value":60}],
        "unitLabel":"개"
      },
      "bars":[
        {"category":"연필","ticks":12},
        {"category":"공책","ticks":8},
        {"category":"자","ticks":5}
      ],
      "comparison":{"kind":"extremes"}
    }'::jsonb
  ),
  'a bar-difference chart accepts a non-printed extreme difference'
);

select ok(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram",
      "mode":"table-match",
      "axis":{
        "orientation":"vertical",
        "tickCount":12,
        "labeledTicks":[{"index":0,"value":0},{"index":12,"value":36}],
        "unitLabel":"개"
      },
      "table":[
        {"category":"사과","count":6},
        {"category":"배","count":9},
        {"category":"감","count":3},
        {"category":"귤","count":12}
      ],
      "candidates":[
        {"id":"가","bars":[
          {"category":"사과","ticks":2},{"category":"배","ticks":3},
          {"category":"감","ticks":1},{"category":"귤","ticks":4}
        ]},
        {"id":"나","bars":[
          {"category":"사과","ticks":6},{"category":"배","ticks":9},
          {"category":"감","ticks":3},{"category":"귤","ticks":12}
        ]},
        {"id":"다","bars":[
          {"category":"사과","ticks":3},{"category":"배","ticks":4},
          {"category":"감","ticks":2},{"category":"귤","ticks":5}
        ]}
      ]
    }'::jsonb
  ),
  'a table-match chart accepts exactly one faithful candidate'
);

select ok(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram",
      "mode":"chart-conclusion",
      "axis":{
        "orientation":"vertical",
        "tickCount":8,
        "labeledTicks":[{"index":0,"value":0},{"index":8,"value":40}],
        "unitLabel":"명"
      },
      "bars":[
        {"category":"축구","ticks":8},
        {"category":"농구","ticks":5},
        {"category":"수영","ticks":3}
      ]
    }'::jsonb
  ),
  'a chart-conclusion visual is accepted without encoding the answer'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"unit-value",
      "axis":{"orientation":"vertical","tickCount":5,
        "labeledTicks":[{"index":0,"value":0},{"index":5,"value":50}],
        "unitLabel":"권"},
      "bars":[{"category":"동화","ticks":3},{"category":"과학","ticks":5}],
      "answer":10
    }'::jsonb
  ),
  true,
  'answer-bearing or unknown top-level keys are rejected'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"unit-value",
      "axis":{"orientation":"vertical","tickCount":5,
        "labeledTicks":[
          {"index":0,"value":0},{"index":1,"value":10},{"index":5,"value":50}
        ],"unitLabel":"권"},
      "bars":[{"category":"동화","ticks":3},{"category":"과학","ticks":5}]
    }'::jsonb
  ),
  true,
  'unit-value evidence cannot print the value of the first interval'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"unit-value",
      "axis":{"orientation":"vertical","tickCount":5,
        "labeledTicks":[
          {"index":0,"value":0},{"index":2,"value":20},{"index":5,"value":55}
        ],"unitLabel":"권"},
      "bars":[{"category":"동화","ticks":3},{"category":"과학","ticks":5}]
    }'::jsonb
  ),
  true,
  'inconsistent labeled tick spacing is rejected'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"chart-conclusion",
      "axis":{"orientation":"vertical","tickCount":5,
        "labeledTicks":[{"index":0,"value":0},{"index":5,"value":50}],
        "unitLabel":"권"},
      "bars":[{"category":"동화","ticks":3},{"category":"동화","ticks":5}]
    }'::jsonb
  ),
  true,
  'duplicate bar categories are rejected'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"chart-conclusion",
      "axis":{"orientation":"vertical","tickCount":5,
        "labeledTicks":[{"index":0,"value":0},{"index":5,"value":50}],
        "unitLabel":"권"},
      "bars":[{"category":"동화","ticks":6},{"category":"과학","ticks":5}]
    }'::jsonb
  ),
  true,
  'a bar cannot extend beyond the axis'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"bar-value",
      "axis":{"orientation":"vertical","tickCount":5,
        "labeledTicks":[{"index":0,"value":0},{"index":5,"value":50}],
        "unitLabel":"권"},
      "bars":[{"category":"동화","ticks":3},{"category":"과학","ticks":5}],
      "target":"역사"
    }'::jsonb
  ),
  true,
  'a bar-value target must exist in the chart'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"bar-value",
      "axis":{"orientation":"vertical","tickCount":5,
        "labeledTicks":[{"index":0,"value":0},{"index":3,"value":30},
          {"index":5,"value":50}],"unitLabel":"권"},
      "bars":[{"category":"동화","ticks":3},{"category":"과학","ticks":5}],
      "target":"동화"
    }'::jsonb
  ),
  true,
  'a bar-value target cannot have its answer printed on the axis'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"bar-difference",
      "axis":{"orientation":"vertical","tickCount":12,
        "labeledTicks":[{"index":0,"value":0},{"index":12,"value":60}],
        "unitLabel":"개"},
      "bars":[{"category":"연필","ticks":12},{"category":"자","ticks":5}],
      "comparison":{"kind":"pair","categories":["연필","공책"]}
    }'::jsonb
  ),
  true,
  'both named comparison bars must exist'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"bar-difference",
      "axis":{"orientation":"vertical","tickCount":10,
        "labeledTicks":[
          {"index":0,"value":0},{"index":4,"value":20},{"index":10,"value":50}
        ],"unitLabel":"개"},
      "bars":[{"category":"연필","ticks":8},{"category":"자","ticks":4}],
      "comparison":{"kind":"pair","categories":["연필","자"]}
    }'::jsonb
  ),
  true,
  'a difference question cannot print the difference as an axis label'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"table-match",
      "axis":{"orientation":"vertical","tickCount":8,
        "labeledTicks":[{"index":0,"value":0},{"index":8,"value":24}],
        "unitLabel":"개"},
      "table":[{"category":"사과","count":7},{"category":"배","count":9}],
      "candidates":[
        {"id":"가","bars":[{"category":"사과","ticks":2},{"category":"배","ticks":3}]},
        {"id":"나","bars":[{"category":"사과","ticks":3},{"category":"배","ticks":3}]},
        {"id":"다","bars":[{"category":"사과","ticks":4},{"category":"배","ticks":3}]}
      ]
    }'::jsonb
  ),
  true,
  'table counts must be divisible by the derived axis unit'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"table-match",
      "axis":{"orientation":"vertical","tickCount":8,
        "labeledTicks":[{"index":0,"value":0},{"index":8,"value":24}],
        "unitLabel":"개"},
      "table":[{"category":"사과","count":6},{"category":"배","count":9}],
      "candidates":[
        {"id":"가","bars":[{"category":"사과","ticks":2},{"category":"배","ticks":3}]},
        {"id":"가","bars":[{"category":"사과","ticks":3},{"category":"배","ticks":3}]},
        {"id":"다","bars":[{"category":"사과","ticks":4},{"category":"배","ticks":3}]}
      ]
    }'::jsonb
  ),
  true,
  'table-match candidate IDs must be unique'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"table-match",
      "axis":{"orientation":"vertical","tickCount":8,
        "labeledTicks":[{"index":0,"value":0},{"index":8,"value":24}],
        "unitLabel":"개"},
      "table":[{"category":"사과","count":6},{"category":"배","count":9}],
      "candidates":[
        {"id":"가","bars":[{"category":"사과","ticks":2},{"category":"배","ticks":3}]},
        {"id":"나","bars":[{"category":"사과","ticks":2},{"category":"배","ticks":3}]},
        {"id":"다","bars":[{"category":"사과","ticks":4},{"category":"배","ticks":3}]}
      ]
    }'::jsonb
  ),
  true,
  'table-match evidence must not contain two correct candidates'
);

select isnt(
  public.jsonb_bar_chart_diagram_valid(
    '{
      "kind":"bar-chart-diagram","mode":"table-match",
      "axis":{"orientation":"vertical","tickCount":8,
        "labeledTicks":[{"index":0,"value":0},{"index":8,"value":24}],
        "unitLabel":"개"},
      "table":[{"category":"사과","count":6},{"category":"배","count":9}],
      "candidates":[
        {"id":"가","bars":[{"category":"배","ticks":3},{"category":"사과","ticks":2}]},
        {"id":"나","bars":[{"category":"사과","ticks":3},{"category":"배","ticks":3}]},
        {"id":"다","bars":[{"category":"사과","ticks":4},{"category":"배","ticks":3}]}
      ]
    }'::jsonb
  ),
  true,
  'candidate bars must keep the table category order'
);

select lives_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind":"bar-chart-diagram",
          "mode":"chart-conclusion",
          "axis":{
            "orientation":"vertical",
            "tickCount":5,
            "labeledTicks":[{"index":0,"value":0},{"index":5,"value":50}],
            "unitLabel":"명"
          },
          "bars":[
            {"category":"축구","ticks":5},
            {"category":"농구","ticks":3}
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
  'the complete database runtime contract accepts a valid bar chart'
);

select throws_ok(
  $$select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        source.content,
        '{judgments,0,visual}',
        '{
          "kind":"bar-chart-diagram",
          "mode":"chart-conclusion",
          "axis":{
            "orientation":"vertical",
            "tickCount":5,
            "labeledTicks":[{"index":0,"value":0},{"index":5,"value":50}],
            "unitLabel":"명"
          },
          "bars":[
            {"category":"축구","ticks":6},
            {"category":"농구","ticks":3}
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
  'the complete database runtime contract rejects an overflowing bar'
);

select volatility_is(
  'public',
  'jsonb_bar_array_valid',
  array['jsonb', 'integer'],
  'immutable',
  'the bar-array helper is immutable'
);

select volatility_is(
  'public',
  'jsonb_bar_chart_diagram_valid',
  array['jsonb'],
  'immutable',
  'the bar-chart validator is immutable'
);

select is(
  (
    select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'curriculum_anchor_set_allowlist'
      and grantee in ('anon', 'authenticated')
  ),
  0::bigint,
  'client roles cannot mutate or read the approval allow-list'
);

select * from finish();
rollback;
