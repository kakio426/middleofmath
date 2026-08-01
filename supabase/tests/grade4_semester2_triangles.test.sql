create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

select has_function(
  'public',
  'jsonb_triangle_figure_valid',
  array['jsonb'],
  'triangle visual validator exists'
);

select ok(
  public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"side-classify","sides":[5,5,8]}'::jsonb
  ),
  'valid isosceles side classification is accepted'
);

select ok(
  public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"side-angle","angles":[null,70,null],"equalSideIndexes":[0,1],"askIndex":0}'::jsonb
  ),
  'an isosceles property item with one given equal angle is accepted'
);

select ok(
  public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"angle-classify","angles":[35,55,90]}'::jsonb
  ),
  'valid angle classification is accepted'
);

select ok(
  not public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"side-classify","sides":[1,2,3]}'::jsonb
  ),
  'triangle inequality violation is rejected'
);

select ok(
  not public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"angle-classify","angles":[90,40,40]}'::jsonb
  ),
  'angles that do not sum to 180 are rejected'
);

select ok(
  not public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"angle-classify","angles":[null,null,40],"askIndex":0}'::jsonb
  ),
  'two unknown angles are rejected'
);

select ok(
  not public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"side-angle","angles":[null,70,40],"equalSideIndexes":[0,1],"askIndex":0}'::jsonb
  ),
  'showing the third angle and exposing an angle-sum route is rejected'
);

select ok(
  not public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"side-angle","angles":[null,70,null],"equalSideIndexes":[0,0],"askIndex":0}'::jsonb
  ),
  'equal side marks must identify two different sides'
);

select ok(
  not public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"side-angle","sides":[8,8,6],"angles":[null,70,null],"equalSideIndexes":[0,1],"askIndex":0}'::jsonb
  ),
  'side-angle mode rejects contradictory numeric side labels'
);

select ok(
  not public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"angle-classify"}'::jsonb
  ),
  'angle classification requires all three angle slots'
);

select ok(
  not public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"side-angle","angles":[null,70,null],"equalSideIndexes":[0,1],"askIndex":2}'::jsonb
  ),
  'askIndex must identify one of the two equal opposite angles'
);

select ok(
  not public.jsonb_triangle_figure_valid(
    '{"kind":"triangle-figure","mode":"angle-classify","angles":[35,55,90],"answer":"직각삼각형"}'::jsonb
  ),
  'unknown visual keys are rejected'
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
        '{"kind":"triangle-figure","mode":"side-classify","sides":[1,2,3]}'::jsonb,
        true
      )
    )
  $$,
  'judgment runtime schema is invalid',
  'runtime schema rejects an invalid triangle visual'
);

select * from finish();

rollback;
