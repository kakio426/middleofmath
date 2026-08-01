create extension if not exists pgtap with schema extensions;

begin;

select plan(40);

select ok(public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":0,"tickCount":6,"labeledTicks":[{"index":0,"value":0},{"index":6,"value":18}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":4}]}'::jsonb
), 'tick-unit visual is valid');

select is(public.jsonb_line_chart_expected_answer(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":0,"tickCount":6,"labeledTicks":[{"index":0,"value":0},{"index":6,"value":18}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":4}]}'::jsonb
), '3', 'tick-unit answer is derived');

select ok(public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"point-value","axis":{"unitLabel":"도","baselineValue":4,"tickCount":10,"labeledTicks":[{"index":0,"value":4},{"index":10,"value":24}]},"timeAxis":{"label":"주","categories":["A","B","C","D","E"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":9},{"categoryIndex":3,"tick":6},{"categoryIndex":4,"tick":4}],"target":{"kind":"point","categoryIndex":3}}'::jsonb
), 'point-value visual with a wave baseline is valid');

select is(public.jsonb_line_chart_expected_answer(
  '{"kind":"line-chart-diagram","mode":"point-value","axis":{"unitLabel":"도","baselineValue":4,"tickCount":10,"labeledTicks":[{"index":0,"value":4},{"index":10,"value":24}]},"timeAxis":{"label":"주","categories":["A","B","C","D","E"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":9},{"categoryIndex":3,"tick":6},{"categoryIndex":4,"tick":4}],"target":{"kind":"point","categoryIndex":3}}'::jsonb
), '16', 'point value includes the baseline');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"point-value","axis":{"unitLabel":"도","baselineValue":4,"tickCount":10,"labeledTicks":[{"index":0,"value":4},{"index":10,"value":24}]},"timeAxis":{"label":"주","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":2},{"categoryIndex":2,"tick":0},{"categoryIndex":3,"tick":3}],"target":{"kind":"point","categoryIndex":1}}'::jsonb
), 'a point cannot sit on a wave-truncated baseline');

select ok(public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"step-change","axis":{"unitLabel":"도","baselineValue":0,"tickCount":7,"labeledTicks":[{"index":0,"value":0},{"index":7,"value":35}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":4}],"target":{"kind":"interval","fromIndex":1,"toIndex":2}}'::jsonb
), 'step-change visual is valid');

select is(public.jsonb_line_chart_expected_answer(
  '{"kind":"line-chart-diagram","mode":"step-change","axis":{"unitLabel":"도","baselineValue":0,"tickCount":7,"labeledTicks":[{"index":0,"value":0},{"index":7,"value":35}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":4}],"target":{"kind":"interval","fromIndex":1,"toIndex":2}}'::jsonb
), '15', 'step change multiplies ticks by the unit');

select ok(public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"largest-rise","axis":{"unitLabel":"도","baselineValue":0,"tickCount":7,"labeledTicks":[{"index":0,"value":0},{"index":7,"value":28}]},"timeAxis":{"label":"시각","categories":["A","B","C","D","E"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":7},{"categoryIndex":4,"tick":2}],"target":{"kind":"interval","fromIndex":1,"toIndex":2}}'::jsonb
), 'largest-rise visual defeats max-point and absolute-change shortcuts');

select is(public.jsonb_line_chart_expected_answer(
  '{"kind":"line-chart-diagram","mode":"largest-rise","axis":{"unitLabel":"도","baselineValue":0,"tickCount":7,"labeledTicks":[{"index":0,"value":0},{"index":7,"value":28}]},"timeAxis":{"label":"시각","categories":["A","B","C","D","E"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":7},{"categoryIndex":4,"tick":2}],"target":{"kind":"interval","fromIndex":1,"toIndex":2}}'::jsonb
), 'B→C', 'largest-rise answer names the derived interval');

select ok(public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"between-estimate","axis":{"unitLabel":"도","baselineValue":0,"tickCount":6,"labeledTicks":[{"index":0,"value":0},{"index":6,"value":24}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":5},{"categoryIndex":3,"tick":2}],"target":{"kind":"midpoint","fromIndex":1,"toIndex":2}}'::jsonb
), 'between-estimate visual is valid');

select is(public.jsonb_line_chart_expected_answer(
  '{"kind":"line-chart-diagram","mode":"between-estimate","axis":{"unitLabel":"도","baselineValue":0,"tickCount":6,"labeledTicks":[{"index":0,"value":0},{"index":6,"value":24}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":5},{"categoryIndex":3,"tick":2}],"target":{"kind":"midpoint","fromIndex":1,"toIndex":2}}'::jsonb
), '16', 'midpoint value is derived from the segment');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"between-estimate","axis":{"unitLabel":"도","baselineValue":0,"tickCount":6,"labeledTicks":[{"index":0,"value":0},{"index":6,"value":24}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":4},{"categoryIndex":3,"tick":2}],"target":{"kind":"midpoint","fromIndex":1,"toIndex":2}}'::jsonb
), 'odd midpoint tick is rejected');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"between-estimate","axis":{"unitLabel":"도","baselineValue":0,"tickCount":6,"labeledTicks":[{"index":0,"value":0},{"index":6,"value":24}]},"timeAxis":{"label":"시각","categories":["A","B","C","D","E"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":5},{"categoryIndex":3,"tick":4},{"categoryIndex":4,"tick":1}],"target":{"kind":"midpoint","fromIndex":1,"toIndex":2}}'::jsonb
), 'a midpoint already plotted elsewhere is rejected');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"largest-rise","axis":{"unitLabel":"도","baselineValue":0,"tickCount":8,"labeledTicks":[{"index":0,"value":0},{"index":8,"value":32}]},"timeAxis":{"label":"시각","categories":["A","B","C","D","E"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":2},{"categoryIndex":2,"tick":5},{"categoryIndex":3,"tick":2},{"categoryIndex":4,"tick":5}],"target":{"kind":"interval","fromIndex":1,"toIndex":2}}'::jsonb
), 'tied maximum rises are rejected');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"largest-rise","axis":{"unitLabel":"도","baselineValue":0,"tickCount":8,"labeledTicks":[{"index":0,"value":0},{"index":8,"value":32}]},"timeAxis":{"label":"시각","categories":["A","B","C","D","E"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":2},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":3},{"categoryIndex":4,"tick":2}],"target":{"kind":"interval","fromIndex":1,"toIndex":2}}'::jsonb
), 'argmax rise cannot also be argmax absolute change');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"largest-rise","axis":{"unitLabel":"도","baselineValue":0,"tickCount":7,"labeledTicks":[{"index":0,"value":0},{"index":7,"value":28}]},"timeAxis":{"label":"시각","categories":["A","B","C","D","E"]},"points":[{"categoryIndex":0,"tick":6},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":7},{"categoryIndex":4,"tick":6}],"target":{"kind":"interval","fromIndex":1,"toIndex":2}}'::jsonb
), 'argmax rise cannot tie an earlier fall in absolute magnitude');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"largest-rise","axis":{"unitLabel":"도","baselineValue":0,"tickCount":8,"labeledTicks":[{"index":0,"value":0},{"index":8,"value":32}]},"timeAxis":{"label":"시각","categories":["A","B","C","D","E"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":5},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":7},{"categoryIndex":4,"tick":1}],"target":{"kind":"interval","fromIndex":0,"toIndex":1}}'::jsonb
), 'largest rise cannot be the first interval');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"step-change","axis":{"unitLabel":"도","baselineValue":0,"tickCount":7,"labeledTicks":[{"index":0,"value":0},{"index":7,"value":35}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":4}],"target":{"kind":"interval","fromIndex":0,"toIndex":2}}'::jsonb
), 'step target must be adjacent');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"step-change","axis":{"unitLabel":"도","baselineValue":0,"tickCount":7,"labeledTicks":[{"index":0,"value":0},{"index":7,"value":35}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":4},{"categoryIndex":3,"tick":7}],"target":{"kind":"interval","fromIndex":1,"toIndex":2}}'::jsonb
), 'one-tick target change is rejected');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"step-change","axis":{"unitLabel":"도","baselineValue":0,"tickCount":7,"labeledTicks":[{"index":0,"value":0},{"index":7,"value":35}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":3}],"target":{"kind":"interval","fromIndex":1,"toIndex":2}}'::jsonb
), 'target absolute change must be unique');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":0,"tickCount":5,"labeledTicks":[{"index":0,"value":0},{"index":5,"value":22}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":2},{"categoryIndex":2,"tick":3},{"categoryIndex":3,"tick":4}]}'::jsonb
), 'non-integral unit is rejected');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":4,"tickCount":5,"labeledTicks":[{"index":0,"value":0},{"index":5,"value":20}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":2},{"categoryIndex":2,"tick":3},{"categoryIndex":3,"tick":4}]}'::jsonb
), 'first label must equal the baseline');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":1001,"tickCount":5,"labeledTicks":[{"index":0,"value":1001},{"index":5,"value":1021}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":2},{"categoryIndex":2,"tick":3},{"categoryIndex":3,"tick":4}]}'::jsonb
), 'baseline upper bound matches Zod');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":0,"tickCount":10,"labeledTicks":[{"index":0,"value":0},{"index":10,"value":2010}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":2},{"categoryIndex":2,"tick":3},{"categoryIndex":3,"tick":4}]}'::jsonb
), 'labeled value upper bound matches Zod');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":0,"tickCount":5,"labeledTicks":[{"index":0,"value":0},{"index":5,"value":25}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":1},{"categoryIndex":1,"tick":2},{"categoryIndex":2,"tick":3},{"categoryIndex":3,"tick":4}]}'::jsonb
), 'tick count cannot equal unit value');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":0,"tickCount":6,"labeledTicks":[{"index":0,"value":0},{"index":6,"value":18}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":4}],"values":[6,9,18,12]}'::jsonb
), 'derived values field is rejected');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":0,"tickCount":6,"labeledTicks":[{"index":0,"value":0},{"index":6,"value":18}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":4}],"legend":"온도"}'::jsonb
), 'legend and second-series affordances are rejected');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"tick-unit","axis":{"unitLabel":"도","baselineValue":0,"tickCount":6,"labeledTicks":[{"index":0,"value":0},{"index":6,"value":18}]},"timeAxis":{"label":"시각","categories":["A","B","B","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":6},{"categoryIndex":3,"tick":4}]}'::jsonb
), 'duplicate categories are rejected');

select ok(not public.jsonb_line_chart_diagram_valid(
  '{"kind":"line-chart-diagram","mode":"point-value","axis":{"unitLabel":"도","baselineValue":0,"tickCount":5,"labeledTicks":[{"index":0,"value":0},{"index":5,"value":20}]},"timeAxis":{"label":"시각","categories":["A","B","C","D"]},"points":[{"categoryIndex":0,"tick":2},{"categoryIndex":1,"tick":3},{"categoryIndex":2,"tick":5},{"categoryIndex":3,"tick":4}],"target":{"kind":"point","categoryIndex":0}}'::jsonb
), 'point target cannot be an endpoint');

select ok(not has_function_privilege(
  'anon', 'public.jsonb_line_chart_diagram_valid(jsonb)', 'execute'
), 'anonymous clients cannot execute line-chart oracle');

select ok(not has_function_privilege(
  'authenticated', 'public.jsonb_line_chart_diagram_valid(jsonb)', 'execute'
), 'authenticated clients cannot execute line-chart oracle');

select ok(not has_function_privilege(
  'anon', 'public.assert_diagnosis_runtime_schema(jsonb)', 'execute'
), 'anonymous clients cannot execute the recreated runtime wrapper');

select ok(not has_function_privilege(
  'authenticated', 'public.assert_diagnosis_runtime_schema(jsonb)', 'execute'
), 'authenticated clients cannot execute the recreated runtime wrapper');

select ok(not has_function_privilege(
  'anon', 'public.jsonb_object_has_only_keys(jsonb,text[])', 'execute'
), 'anonymous clients cannot execute the recreated key helper');

select ok(not has_function_privilege(
  'authenticated', 'public.jsonb_object_has_only_keys(jsonb,text[])', 'execute'
), 'authenticated clients cannot execute the recreated key helper');

select ok((select not prosecdef from pg_proc where oid =
  'public.jsonb_line_chart_diagram_valid(jsonb)'::regprocedure
), 'line-chart oracle is not security definer');

select ok((select proconfig @> array['search_path=""']::text[] from pg_proc where oid =
  'public.jsonb_line_chart_diagram_valid(jsonb)'::regprocedure
), 'line-chart oracle pins an empty search path');

select is((select count(*)::integer from public.diagnosis_sets
  where set_key = 'grade4-semester2'), 0, 'review set is not published');

select is((select count(*)::integer from public.curriculum_anchors
  where anchor_key = '[4수04-02]'), 0, 'review-only anchor is not inserted');

select is((select count(*)::integer from public.curriculum_anchor_set_allowlist
  where set_key = 'grade4-semester2'), 0, 'review set receives no DB allowlist row');

select * from finish();
rollback;
