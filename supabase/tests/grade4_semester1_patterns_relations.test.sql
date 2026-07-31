begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select results_eq(
  $$select anchor_key, grade, semester, grade_band
    from public.curriculum_anchors
    where anchor_key in ('[4수02-01]', '[4수02-02]', '[4수02-03]')
    order by anchor_key$$,
  $$values
      ('[4수02-01]'::text, 4::smallint, 1::smallint, '3-4'::text),
      ('[4수02-02]'::text, 4::smallint, 1::smallint, '3-4'::text),
      ('[4수02-03]'::text, 4::smallint, 1::smallint, '3-4'::text)$$,
  'the three A2-approved relation anchors are registered'
);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where anchor_key in ('[4수02-01]', '[4수02-02]', '[4수02-03]')
      and not shared_across_semesters
      and not shared_across_grade_band
  ),
  3::bigint,
  'A2 approval does not authorize cross-semester or cross-grade reuse'
);

select ok(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"number-sequence","terms":[2,6,18,null,162]}'::jsonb
  ),
  'a unique geometric number sequence is accepted'
);

select ok(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"figure-sequence","figure":"square","counts":[3,5,7,null],"askOrder":4}'::jsonb
  ),
  'a unique arithmetic figure sequence is accepted'
);

select ok(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"rule-table","leftLabel":"순서","rightLabel":"개수","rows":[{"left":1,"right":4},{"left":2,"right":8},{"left":3,"right":12}]}'::jsonb
  ),
  'a table with one consistent relation is accepted'
);

select ok(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"calculation-array","calculations":[{"a":120,"operator":"divide","b":2,"result":60},{"a":120,"operator":"divide","b":4,"result":30},{"a":120,"operator":"divide","b":6,"result":20},{"a":120,"operator":"divide","b":8,"result":null}]}'::jsonb
  ),
  'an exact calculation array with the final result hidden is accepted'
);

select ok(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"equal-sign-balance","equation":{"operator":"add","left":[45,18],"right":[39,null]}}'::jsonb
  ),
  'a two-digit equality with one blank is accepted'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"number-sequence","terms":[2,null,null,54]}'::jsonb
  ),
  true,
  'a number sequence cannot contain two blanks'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"figure-sequence","figure":"triangle","counts":[2,5,9,null],"askOrder":4}'::jsonb
  ),
  true,
  'an inconsistent figure sequence is rejected'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"rule-table","leftLabel":"순서","rightLabel":"개수","rows":[{"left":1,"right":4},{"left":2,"right":9},{"left":3,"right":12}]}'::jsonb
  ),
  true,
  'an inconsistent relation table is rejected'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"calculation-array","calculations":[{"a":11,"operator":"multiply","b":11,"result":121},{"a":11,"operator":"multiply","b":12,"result":131},{"a":11,"operator":"multiply","b":13,"result":null}]}'::jsonb
  ),
  true,
  'an incorrect displayed calculation is rejected'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"equal-sign-balance","equation":{"operator":"add","left":[10,10],"right":[19,null]}}'::jsonb
  ),
  true,
  'an equality whose answer is not two digits is rejected'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"number-sequence","terms":[2,6,18,null],"answer":54}'::jsonb
  ),
  true,
  'answer-bearing or unknown visual keys are rejected'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"figure-sequence","counts":[3,5,7,null],"askOrder":4}'::jsonb
  ),
  true,
  'a figure sequence cannot omit the figure kind'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","equation":{"operator":"add","left":[45,18],"right":[39,null]}}'::jsonb
  ),
  true,
  'a relation visual cannot omit its mode'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"calculation-array","calculations":[{"a":120,"b":2,"result":60},{"a":120,"b":4,"result":30},{"a":120,"b":6,"result":20},{"a":120,"b":8,"result":null}]}'::jsonb
  ),
  true,
  'each calculation must name its operator'
);

select isnt(
  public.jsonb_relation_pattern_diagram_valid(
    '{"kind":"relation-pattern-diagram","mode":"calculation-array","calculations":[{"a":120,"operator":"divide","b":2,"result":60},{"a":120,"operator":"divide","b":4,"result":30},{"a":120,"operator":"divide","b":6,"result":20},{"a":120,"operator":"divide","b":8}]}'::jsonb
  ),
  true,
  'the final calculation must contain an explicit null result'
);

select volatility_is(
  'public',
  'jsonb_relation_pattern_diagram_valid',
  array['jsonb'],
  'immutable',
  'the relation visual validator is immutable'
);

select * from finish();
rollback;
