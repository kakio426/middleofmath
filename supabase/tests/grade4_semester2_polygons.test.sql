create extension if not exists pgtap with schema extensions;

begin;

select plan(23);

select has_function(
  'public', 'jsonb_polygon_figure_valid', array['jsonb'],
  'polygon figure validator exists'
);
select has_function(
  'public', 'jsonb_tile_composition_valid', array['jsonb'],
  'tile composition validator exists'
);

select ok(
  public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"polygon-select","candidates":[{"id":"가","figure":{"form":"curved","vertices":[[1,1],[8,1],[10,5],[6,9],[1,6]],"curvedSideIndex":2}},{"id":"나","figure":{"form":"lattice","vertices":[[1,1],[8,1],[10,5],[6,9],[1,6]]}},{"id":"다","figure":{"form":"open","vertices":[[1,1],[8,1],[10,5],[6,9],[1,6],[3,3]]}}]}'::jsonb
  ),
  'closed, curved, and open candidates with equal segment counts are accepted'
);

select ok(
  public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"side-count-name","figure":{"form":"lattice","vertices":[[0,0],[10,0],[10,6],[5,3],[0,6]]}}'::jsonb
  ),
  'a concave side-count polygon is accepted'
);

select ok(
  public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"regular-select","candidates":[{"id":"가","figure":{"form":"lattice","vertices":[[0,3],[4,6],[8,3],[4,0]]}},{"id":"나","figure":{"form":"equiangular","sideCount":4,"sideLengths":[9,4,9,4]}},{"id":"다","figure":{"form":"regular","sideCount":4,"rotationDegrees":20}}]}'::jsonb
  ),
  'regular-polygon candidates carrying the two different distractor forms are accepted'
);

select ok(
  public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"fill-remaining","board":[[0,1,"up"],[0,1,"down"],[1,1,"up"],[1,1,"down"],[1,2,"up"],[2,1,"up"]],"placed":[{"piece":"rhombus","cells":[[0,1,"up"],[0,1,"down"]]}],"candidates":[{"id":"가","pieces":["rhombus","rhombus"]},{"id":"나","pieces":["trapezoid","triangle"]},{"id":"다","pieces":["triangle","triangle"]}]}'::jsonb
  ),
  'a remaining-space board with placed and candidate pieces is accepted'
);

select ok(
  public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"tile-count","region":[[2,1,"down"],[2,1,"up"],[3,1,"down"],[3,1,"up"],[2,2,"down"],[2,2,"up"],[3,2,"down"],[3,2,"up"],[2,3,"down"],[2,3,"up"],[3,3,"down"],[3,3,"up"]],"piece":"rhombus"}'::jsonb
  ),
  'the independent twelve-cell direct region tiles with six rhombi'
);

select ok(
  not public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"polygon-select","candidates":[{"id":"가","figure":{"form":"lattice","vertices":[[1,1],[8,1],[10,5],[6,9],[1,6]]}},{"id":"나","figure":{"form":"lattice","vertices":[[1,1],[8,1],[10,5],[6,9],[1,6]]}},{"id":"다","figure":{"form":"open","vertices":[[1,1],[8,1],[10,5],[6,9],[1,6],[3,3]]}}]}'::jsonb
  ),
  'two closed straight candidates are rejected'
);

select ok(
  not public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"polygon-select","candidates":[{"id":"가","figure":{"form":"curved","vertices":[[1,1],[8,1],[10,5],[6,9],[1,6]],"curvedSideIndex":2}},{"id":"가","figure":{"form":"lattice","vertices":[[1,1],[8,1],[10,5],[6,9],[1,6]]}},{"id":"다","figure":{"form":"open","vertices":[[1,1],[8,1],[10,5],[6,9],[1,6],[3,3]]}}]}'::jsonb
  ),
  'duplicate candidate labels are rejected'
);

select ok(
  not public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"side-count-name","figure":{"form":"lattice","vertices":[[0,0],[10,0],[10,6],[5,3],[0,6]]},"answer":"오각형"}'::jsonb
  ),
  'an answer-leaking polygon key is rejected'
);

select ok(
  not public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"regular-select","candidates":[{"id":"가","figure":{"form":"regular","sideCount":4,"rotationDegrees":0}},{"id":"나","figure":{"form":"regular","sideCount":4,"rotationDegrees":20}},{"id":"다","figure":{"form":"equiangular","sideCount":4,"sideLengths":[9,4,9,4]}}]}'::jsonb
  ),
  'regular-polygon candidates without the required distractor forms are rejected'
);

select ok(
  not public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"tile-count","region":[[2,2,"up"],[2,2,"up"],[2,1,"up"],[1,1,"down"],[1,2,"down"],[2,1,"down"]],"piece":"rhombus"}'::jsonb
  ),
  'duplicate triangular cells are rejected'
);

select ok(
  not public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"tile-count","region":[[2,2,"up"],[1,2,"up"],[2,1,"up"],[1,1,"down"],[1,2,"down"]],"piece":"rhombus"}'::jsonb
  ),
  'a region whose area is not divisible by the piece is rejected'
);

select ok(
  not public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"fill-remaining","board":[[0,1,"up"],[0,1,"down"],[1,1,"up"],[1,1,"down"]],"placed":[{"piece":"rhombus","cells":[[7,7,"up"],[7,7,"down"]]}],"candidates":[{"id":"가","pieces":["rhombus"]},{"id":"나","pieces":["triangle"]},{"id":"다","pieces":["hexagon"]}]}'::jsonb
  ),
  'a placed piece outside the board is rejected'
);

select lives_ok(
  $$
    select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        (
          select content from public.diagnosis_sets
          where set_key = 'grade4-semester1' and version = '1.4.0'
        ),
        '{judgments,0,visual}',
        '{"kind":"polygon-figure","mode":"side-count-name","figure":{"form":"lattice","vertices":[[0,0],[10,0],[10,6],[5,3],[0,6]]}}'::jsonb,
        true
      )
    )
  $$,
  'the runtime schema accepts a valid polygon visual'
);

select throws_ok(
  $$
    select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        (
          select content from public.diagnosis_sets
          where set_key = 'grade4-semester1' and version = '1.4.0'
        ),
        '{judgments,0,visual}',
        '{"kind":"tile-composition","mode":"tile-count","region":[[2,2,"up"],[2,2,"up"],[2,1,"up"]],"piece":"triangle"}'::jsonb,
        true
      )
    )
  $$,
  'judgment runtime schema is invalid',
  'the runtime schema rejects duplicate triangular cells'
);

select ok(
  not has_function_privilege(
    'anon', 'public.jsonb_polygon_figure_valid(jsonb)', 'execute'
  ),
  'anonymous clients cannot execute the polygon validator'
);
select ok(
  not has_function_privilege(
    'authenticated', 'public.jsonb_polygon_figure_valid(jsonb)', 'execute'
  ),
  'authenticated clients cannot execute the polygon validator'
);
select ok(
  not has_function_privilege(
    'anon', 'public.jsonb_tile_composition_valid(jsonb)', 'execute'
  ),
  'anonymous clients cannot execute the tile validator'
);
select ok(
  not has_function_privilege(
    'authenticated', 'public.jsonb_tile_composition_valid(jsonb)', 'execute'
  ),
  'authenticated clients cannot execute the tile validator'
);

select is(
  (
    select count(*) from public.curriculum_anchors
    where anchor_key in ('[4수03-11]', '[4수03-12]')
  ),
  0::bigint,
  'the A3-5 review loop does not publish its anchors'
);

select is(
  (
    select count(*) from public.diagnosis_sets
    where set_key = 'grade4-semester2'
  ),
  0::bigint,
  'the A3-5 review loop does not publish the diagnosis set'
);

select ok(
  not has_function_privilege(
    'anon', 'public.assert_diagnosis_runtime_schema(jsonb)', 'execute'
  ),
  'anonymous clients cannot execute the internal runtime guard'
);

select * from finish();
rollback;
