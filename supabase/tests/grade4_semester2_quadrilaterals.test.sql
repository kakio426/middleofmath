create extension if not exists pgtap with schema extensions;

begin;

select plan(28);

select has_function(
  'public',
  'jsonb_quadrilateral_figure_valid',
  array['jsonb'],
  'quadrilateral visual validator exists'
);

select ok(
  public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"side-perpendicular","vertices":[[3,9],[0,0],[9,0],[9,7]],"baseSideIndex":0,"rightAngleVertexIndexes":[0,2]}'::jsonb
  ),
  'a perpendicular-side figure with exact marks is accepted'
);

select ok(
  public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"side-parallel-distance","vertices":[[6,8],[0,0],[14,0],[20,8]],"parallelSidePairs":[[0,2],[1,3]],"sideLengthLabels":[{"sideIndex":0,"lengthCm":10},{"sideIndex":1,"lengthCm":14}],"distanceSegment":{"fromVertexIndex":0,"toSideIndex":1,"lengthCm":8}}'::jsonb
  ),
  'a parallel-distance figure whose labels derive from coordinates is accepted'
);

select ok(
  public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"parallel-classify","vertices":[[5,12],[0,0],[20,0],[11,12]],"parallelSidePairs":[[1,3]]}'::jsonb
  ),
  'a trapezoid with exactly one parallel pair is accepted'
);

select ok(
  public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"equal-side-classify","vertices":[[4,6],[0,3],[4,0],[8,3]],"equalSideGroups":[[0,1,2,3]]}'::jsonb
  ),
  'a non-square rhombus with four equal sides is accepted'
);

select ok(
  public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"opposite-angle","parallelSidePairs":[[0,2],[1,3]],"angles":[null,70,null,null],"askAngleIndex":3}'::jsonb
  ),
  'an opposite-angle property figure is accepted'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"parallel-classify","vertices":[[5,12],[0,0],[20,0],[11,12]],"parallelSidePairs":[[1,3]],"answer":"사다리꼴"}'::jsonb
  ),
  'an answer-leaking unknown visual key is rejected'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"parallel-classify","vertices":[[5,12],[0,0],[20,0],[11,12]],"parallelSidePairs":[[1,3]],"equalSideGroups":[[0,1]]}'::jsonb
  ),
  'fields from another quadrilateral mode are rejected'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"parallel-classify","vertices":[[5,12],[0,0],[20,0],[11,12]],"parallelSidePairs":[[0,2]]}'::jsonb
  ),
  'a false parallel mark is rejected'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"side-perpendicular","vertices":[[3,9],[0,0],[9,0],[9,7]],"baseSideIndex":0,"rightAngleVertexIndexes":[0]}'::jsonb
  ),
  'missing right-angle marks are rejected'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"side-perpendicular","vertices":[[18,17],[22,15],[18,9],[15,11]],"baseSideIndex":0,"rightAngleVertexIndexes":[0,2]}'::jsonb
  ),
  'an unmarked angle that looks almost square is rejected'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"side-perpendicular","vertices":[[3,4],[0,0],[12,0],[12,4]],"baseSideIndex":1,"rightAngleVertexIndexes":[2,3],"parallelSidePairs":[[1,3]]}'::jsonb
  ),
  'the two-right-angle shortcut and a parallel field are rejected'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"parallel-classify","vertices":[[0,0],[12,12],[0,12],[12,0]],"parallelSidePairs":[[0,2]]}'::jsonb
  ),
  'a crossed quadrilateral is rejected'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"side-parallel-distance","vertices":[[6,8],[0,0],[14,0],[20,8]],"parallelSidePairs":[[0,2],[1,3]],"sideLengthLabels":[{"sideIndex":0,"lengthCm":9},{"sideIndex":1,"lengthCm":14}],"distanceSegment":{"fromVertexIndex":0,"toSideIndex":1,"lengthCm":8}}'::jsonb
  ),
  'a side-length label that disagrees with coordinates is rejected'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"side-parallel-distance","vertices":[[6,8],[0,0],[14,0],[20,8]],"parallelSidePairs":[[0,2],[1,3]],"sideLengthLabels":[{"sideIndex":0,"lengthCm":10},{"sideIndex":1,"lengthCm":14}],"distanceSegment":{"fromVertexIndex":0,"toSideIndex":1,"lengthCm":7}}'::jsonb
  ),
  'a distance value that disagrees with the perpendicular height is rejected'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"parallel-classify","vertices":[[6,8],[0,0],[14,0],[20,8]],"parallelSidePairs":[[0,2],[1,3]]}'::jsonb
  ),
  'a two-pair parallelogram cannot masquerade as the one-pair trapezoid item'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"equal-side-classify","vertices":[[5,12],[0,0],[20,0],[11,12]],"equalSideGroups":[[0,1,2,3]]}'::jsonb
  ),
  'an unequal quadrilateral cannot carry four equal-side marks'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"equal-side-classify","vertices":[[0,8],[0,0],[8,0],[8,8]],"equalSideGroups":[[0,1,2,3]]}'::jsonb
  ),
  'a square is excluded from the non-square rhombus classification item'
);

select ok(
  not public.jsonb_quadrilateral_figure_valid(
    '{"kind":"quadrilateral-figure","mode":"opposite-angle","parallelSidePairs":[[0,2],[1,3]],"angles":[null,70,null,null],"askAngleIndex":2}'::jsonb
  ),
  'the question mark must be opposite the one shown angle'
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
        '{"kind":"quadrilateral-figure","mode":"parallel-classify","vertices":[[5,12],[0,0],[20,0],[11,12]],"parallelSidePairs":[[0,2]]}'::jsonb,
        true
      )
    )
  $$,
  'judgment runtime schema is invalid',
  'the runtime schema rejects an invalid quadrilateral visual'
);

select throws_ok(
  $$
    select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        jsonb_set(
          (
            select content
            from public.diagnosis_sets
            where set_key = 'grade4-semester1'
              and version = '1.4.0'
          ),
          '{judgments,0,visual}',
          '{"kind":"quadrilateral-figure","mode":"side-perpendicular","vertices":[[3,9],[0,0],[9,0],[9,7]],"baseSideIndex":0,"rightAngleVertexIndexes":[0,2]}'::jsonb,
          true
        ),
        '{judgments,0,prompt}',
        to_jsonb('변 ㄹㄱ에 수직인 변을 골라 보세요.'::text),
        true
      )
    )
  $$,
  'judgment runtime schema is invalid',
  'the runtime schema rejects a prompt naming a different base side'
);

select throws_ok(
  $$
    select public.assert_diagnosis_runtime_schema(
      jsonb_set(
        jsonb_set(
          (
            select content
            from public.diagnosis_sets
            where set_key = 'grade4-semester1'
              and version = '1.4.0'
          ),
          '{judgments,0,visual}',
          '{"kind":"quadrilateral-figure","mode":"side-perpendicular","vertices":[[3,9],[0,0],[9,0],[9,7]],"baseSideIndex":0,"rightAngleVertexIndexes":[0,2]}'::jsonb,
          true
        ),
        '{judgments,0,prompt}',
        to_jsonb('변 ㄱㄴ과 변 ㄹㄱ 중 수직인 두 변을 골라 보세요.'::text),
        true
      )
    )
  $$,
  'judgment runtime schema is invalid',
  'the runtime schema rejects a prompt naming more than one side'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.jsonb_quadrilateral_figure_valid(jsonb)',
    'execute'
  ),
  'anonymous clients cannot execute the quadrilateral validator'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.jsonb_quadrilateral_figure_valid(jsonb)',
    'execute'
  ),
  'authenticated clients cannot execute the quadrilateral validator'
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

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key in ('[4수03-03]', '[4수03-10]')
  ),
  0::bigint,
  'the A3-3 review loop does not publish its anchors to the database'
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

select * from finish();

rollback;
