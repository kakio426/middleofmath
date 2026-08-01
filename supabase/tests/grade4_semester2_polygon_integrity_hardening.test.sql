create extension if not exists pgtap with schema extensions;

begin;

select plan(24);

select ok(
  not public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"polygon-select","candidates":[{"id":"가","figure":{"form":"curved","vertices":[[1,1],[8,1],[8,8],[1,8]],"curvedSideIndex":1}},{"id":"나","figure":{"form":"lattice","vertices":[[1,1],[8,8],[1,8],[8,1]]}},{"id":"다","figure":{"form":"open","vertices":[[1,1],[8,1],[8,8],[1,8],[3,3]]}}]}'::jsonb
  ),
  'a self-intersecting lattice candidate is rejected'
);

select ok(
  not public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"side-count-name","figure":{"form":"lattice","vertices":[[0,0],[4,0],[4,4],[0,4]]}}'::jsonb
  ),
  'a convex regular square cannot replace the concave side-count figure'
);

select ok(
  not public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"regular-select","candidates":[{"id":"가","figure":{"form":"lattice","vertices":[[0,0],[4,0],[4,4],[0,4]]}},{"id":"나","figure":{"form":"equiangular","sideCount":4,"sideLengths":[9,4,9,4]}},{"id":"다","figure":{"form":"regular","sideCount":4,"rotationDegrees":20}}]}'::jsonb
  ),
  'regular-select rejects two mathematically regular candidates'
);

select ok(
  public.jsonb_polygon_figure_valid(
    '{"kind":"polygon-figure","mode":"side-count-name","figure":{"form":"lattice","vertices":[[2,1],[10,2],[8,5],[10,9],[4,10],[1,6]]}}'::jsonb
  ),
  'the revised independent concave hexagon passes the SQL oracle'
);

select ok(
  not public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"tile-count","region":[[0,0,"up"],[0,0,"down"],[5,5,"up"],[5,5,"down"]],"piece":"rhombus"}'::jsonb
  ),
  'an area-divisible but disconnected tile-count region is rejected'
);

select ok(
  not public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"tile-count","region":[[1,1,"up"],[1,1,"down"],[1,2,"up"],[1,2,"down"],[2,1,"up"],[2,2,"up"]],"piece":"rhombus"}'::jsonb
  ),
  'a connected equal-area region still requires an exact-cover tiling'
);

select ok(
  not public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"fill-remaining","board":[[0,0,"up"],[0,0,"down"],[1,0,"up"],[1,0,"down"],[1,1,"up"],[2,0,"up"]],"placed":[{"piece":"rhombus","cells":[[0,0,"up"],[1,0,"up"]]}],"candidates":[{"id":"가","pieces":["rhombus","rhombus"]},{"id":"나","pieces":["trapezoid","triangle"]},{"id":"다","pieces":["triangle","triangle"]}]}'::jsonb
  ),
  'placed cells must be congruent to the named pattern block'
);

select ok(
  not public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"fill-remaining","board":[[0,1,"up"],[0,1,"down"],[1,1,"up"],[1,1,"down"],[1,2,"up"],[2,1,"up"]],"placed":[{"piece":"triangle","cells":[[1,0,"up"]]}],"candidates":[{"id":"가","pieces":["rhombus","rhombus"]},{"id":"나","pieces":["trapezoid","triangle"]},{"id":"다","pieces":["triangle","triangle"]}]}'::jsonb
  ),
  'cell containment compares ordered coordinates instead of JSON array elements'
);

select ok(
  not public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"fill-remaining","board":[[0,1,"up"],[0,1,"down"],[1,1,"up"],[1,1,"down"],[1,2,"up"],[2,1,"up"]],"placed":[{"piece":"rhombus","cells":[[0,1,"up"],[0,1,"down"]]}],"candidates":[{"id":"가","pieces":["rhombus","rhombus"]},{"id":"나","pieces":["hexagon"]},{"id":"다","pieces":["triangle","triangle"]}]}'::jsonb
  ),
  'fill-remaining rejects a bank where no candidate exact-covers the hole'
);

select ok(
  public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"fill-remaining","board":[[1,1,"up"],[1,1,"down"],[1,2,"up"],[1,2,"down"],[2,1,"up"],[2,2,"up"],[1,3,"up"],[1,3,"down"]],"placed":[{"piece":"rhombus","cells":[[1,3,"up"],[1,3,"down"]]}],"candidates":[{"id":"가","pieces":["trapezoid","trapezoid"]},{"id":"나","pieces":["rhombus","rhombus","rhombus"]},{"id":"다","pieces":["rhombus","rhombus"]}]}'::jsonb
  ),
  'the revised transfer board has exactly one fitting candidate and two distinct distractor mechanisms'
);

select ok(
  not public.jsonb_tile_composition_valid(
    '{"kind":"tile-composition","mode":"fill-remaining","board":[[1,1,"up"],[1,1,"down"],[1,2,"up"],[1,2,"down"],[2,1,"up"],[2,2,"up"],[1,3,"up"],[1,3,"down"]],"placed":[{"piece":"rhombus","cells":[[1,3,"up"],[1,3,"down"]]}],"candidates":[{"id":"가","pieces":["trapezoid","trapezoid"]},{"id":"나","pieces":["rhombus","rhombus","rhombus"]},{"id":"다","pieces":["rhombus","rhombus","rhombus"]}]}'::jsonb
  ),
  'fill-remaining requires a smaller non-fitting distractor as well as an equal-area non-fit'
);

select ok(
  public.jsonb_triangle_cells_can_tile(
    '[[1,1,"up"],[1,1,"down"],[1,2,"up"],[1,2,"down"],[2,1,"up"],[2,2,"up"]]'::jsonb,
    '["trapezoid","trapezoid"]'::jsonb
  ),
  'SQL exact-cover accepts the authored two-trapezoid solution'
);

select ok(
  not public.jsonb_triangle_cells_can_tile(
    '[[1,1,"up"],[1,1,"down"],[1,2,"up"],[1,2,"down"],[2,1,"up"],[2,2,"up"]]'::jsonb,
    '["rhombus","rhombus","rhombus"]'::jsonb
  ),
  'SQL exact-cover rejects the equal-area three-rhombus distractor'
);

set local statement_timeout = '1000ms';

select ok(
  public.jsonb_triangle_cells_can_tile(
    '[[2,1,"down"],[2,1,"up"],[3,1,"down"],[3,1,"up"],[2,2,"down"],[2,2,"up"],[3,2,"down"],[3,2,"up"],[2,3,"down"],[2,3,"up"],[3,3,"down"],[3,3,"up"]]'::jsonb,
    '["rhombus","rhombus","rhombus","rhombus","rhombus","rhombus"]'::jsonb
  ),
  'a solvable twelve-cell six-rhombus region finishes within the safety timeout'
);

select ok(
  public.jsonb_triangle_cells_can_tile(
    '[[2,1,"up"],[2,1,"down"],[3,1,"up"],[2,2,"up"],[2,2,"down"],[3,2,"up"],[2,3,"up"],[2,3,"down"],[3,3,"up"],[4,3,"down"],[4,3,"up"],[3,3,"down"]]'::jsonb,
    '["trapezoid","trapezoid","trapezoid","trapezoid"]'::jsonb
  ),
  'the authored twelve-cell transfer region accepts four trapezoids within the safety timeout'
);

select ok(
  not public.jsonb_triangle_cells_can_tile(
    '[[2,1,"up"],[2,1,"down"],[3,1,"up"],[2,2,"up"],[2,2,"down"],[3,2,"up"],[2,3,"up"],[2,3,"down"],[3,3,"up"],[4,3,"down"],[4,3,"up"],[3,3,"down"]]'::jsonb,
    '["rhombus","rhombus","rhombus","rhombus","rhombus","rhombus"]'::jsonb
  ),
  'an untileable twelve-cell six-rhombus region safely returns false before timeout'
);

set local statement_timeout = '0';

select ok(
  not has_function_privilege(
    'anon', 'public.jsonb_triangle_cells_can_tile(jsonb,jsonb,integer)', 'execute'
  ),
  'anonymous clients cannot execute the exact-cover oracle'
);

select ok(
  not has_function_privilege(
    'authenticated', 'public.jsonb_triangle_cells_can_tile(jsonb,jsonb,integer)', 'execute'
  ),
  'authenticated clients cannot execute the exact-cover oracle'
);

select ok(
  not has_function_privilege(
    'anon', 'public.jsonb_polygon_outline_valid(jsonb)', 'execute'
  ),
  'anonymous clients cannot execute the strict outline oracle'
);

select ok(
  not has_function_privilege(
    'authenticated', 'public.jsonb_polygon_outline_valid(jsonb)', 'execute'
  ),
  'authenticated clients cannot execute the strict outline oracle'
);

select ok(
  not has_function_privilege(
    'anon', 'public.jsonb_object_has_only_keys(jsonb,text[])', 'execute'
  ),
  'the shared validation dispatcher is no longer a public client entrypoint'
);

select ok(
  not has_function_privilege(
    'authenticated', 'public.jsonb_object_has_only_keys(jsonb,text[])', 'execute'
  ),
  'authenticated clients cannot execute the shared validation dispatcher'
);

select ok(
  not has_function_privilege(
    'anon', 'public.assert_distractor_note_coverage(text,text)', 'execute'
  ),
  'anonymous clients cannot execute the security-definer note coverage helper'
);

select ok(
  not has_function_privilege(
    'authenticated', 'public.assert_distractor_note_coverage(text,text)', 'execute'
  ),
  'authenticated clients cannot execute the security-definer note coverage helper'
);

select * from finish();
rollback;
