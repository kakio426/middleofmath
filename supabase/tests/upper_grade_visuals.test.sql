begin;
select plan(27);

select ok(public.jsonb_solid_diagram_valid('{"kind":"solid-diagram","mode":"structure","shape":"sphere"}'::jsonb), 'solid structure accepted');
select ok(public.jsonb_solid_diagram_valid('{"kind":"solid-diagram","mode":"dimensions","shape":"rectangular-prism","width":5,"depth":3,"height":4}'::jsonb), 'box dimensions accepted');
select ok(public.jsonb_solid_diagram_valid('{"kind":"solid-diagram","mode":"unit-stack","shape":"unit-cubes","cubes":[[0,0,0],[0,0,1]],"frontDirection":"right"}'::jsonb), 'supported cube stack accepted');
select isnt(public.jsonb_solid_diagram_valid('{"kind":"solid-diagram","mode":"unit-stack","shape":"unit-cubes","cubes":[[0,0,1]],"frontDirection":"right"}'::jsonb), true, 'floating cube rejected');
select isnt(public.jsonb_solid_diagram_valid('{"kind":"solid-diagram","mode":"dimensions","shape":"cube","width":4,"answer":64}'::jsonb), true, 'answer leak rejected');
select isnt(public.jsonb_solid_diagram_valid('{"kind":"solid-diagram","mode":"unit-stack","shape":"unit-cubes","cubes":[[0,0,0],[0,0,0]],"frontDirection":"right"}'::jsonb), true, 'duplicate cube rejected');

select ok(public.jsonb_part_chart_diagram_valid('{"kind":"part-chart-diagram","mode":"strip","totalParts":10,"segments":[{"label":"가","parts":4},{"label":"나","parts":6}]}'::jsonb), 'strip chart accepted');
select ok(public.jsonb_part_chart_diagram_valid('{"kind":"part-chart-diagram","mode":"circle","totalParts":20,"segments":[{"label":"가","parts":5},{"label":"나","parts":15}]}'::jsonb), 'circle chart accepted');
select isnt(public.jsonb_part_chart_diagram_valid('{"kind":"part-chart-diagram","mode":"strip","totalParts":10,"segments":[{"label":"가","parts":4},{"label":"나","parts":5}]}'::jsonb), true, 'wrong part sum rejected');
select isnt(public.jsonb_part_chart_diagram_valid('{"kind":"part-chart-diagram","mode":"strip","totalParts":10,"segments":[{"label":"가","parts":4},{"label":"가","parts":6}]}'::jsonb), true, 'duplicate labels rejected');
select isnt(public.jsonb_part_chart_diagram_valid('{"kind":"part-chart-diagram","mode":"strip","totalParts":10,"segments":[{"label":"가","parts":4},{"label":"나","parts":6}],"percent":40}'::jsonb), true, 'derived percent rejected');

select ok(public.jsonb_grid_transform_diagram_valid('{"kind":"grid-transform-diagram","mode":"rotate","rows":7,"columns":7,"sourceCells":[{"row":1,"column":1}],"targetCells":[{"row":5,"column":5}],"center":{"row":3,"column":3},"turn":"clockwise","quarterTurns":2}'::jsonb), 'half turn accepted');
select isnt(public.jsonb_grid_transform_diagram_valid('{"kind":"grid-transform-diagram","mode":"rotate","rows":7,"columns":7,"sourceCells":[{"row":1,"column":1}],"targetCells":[{"row":1,"column":5}],"center":{"row":3,"column":3},"turn":"clockwise","quarterTurns":2}'::jsonb), true, 'wrong half turn target rejected');

select ok(public.jsonb_object_has_only_keys('{"kind":"circle","mode":"radius","radiusValue":5,"measurementUnit":"m"}'::jsonb, array['kind','mode','radiusValue','showCenter','showRadius','showDiameter']), 'circle radius in metres accepted');
select ok(public.jsonb_object_has_only_keys('{"kind":"circle","mode":"diameter","diameterValue":20,"measurementUnit":"m"}'::jsonb, array['kind','mode','radiusValue','showCenter','showRadius','showDiameter']), 'circle diameter in metres accepted');
select isnt(public.jsonb_object_has_only_keys('{"kind":"circle","mode":"diameter","radiusValue":10,"diameterValue":20}'::jsonb, array['kind','mode','radiusValue','showCenter','showRadius','showDiameter']), true, 'simultaneous radius and diameter values rejected');
select isnt(public.jsonb_object_has_only_keys('{"kind":"circle","mode":"diameter","measurementUnit":"m"}'::jsonb, array['kind','mode','radiusValue','showCenter','showRadius','showDiameter']), true, 'unit without length rejected');

select isnt(has_function_privilege('anon', 'public.jsonb_solid_diagram_valid(jsonb)', 'EXECUTE'), true, 'anon cannot execute solid guard');
select isnt(has_function_privilege('authenticated', 'public.jsonb_solid_diagram_valid(jsonb)', 'EXECUTE'), true, 'authenticated cannot execute solid guard');
select isnt(has_function_privilege('anon', 'public.jsonb_part_chart_diagram_valid(jsonb)', 'EXECUTE'), true, 'anon cannot execute chart guard');
select isnt(has_function_privilege('authenticated', 'public.jsonb_part_chart_diagram_valid(jsonb)', 'EXECUTE'), true, 'authenticated cannot execute chart guard');
select isnt(has_function_privilege('anon', 'public.jsonb_grid_transform_diagram_valid(jsonb)', 'EXECUTE'), true, 'anon cannot execute grid guard');
select isnt(has_function_privilege('authenticated', 'public.jsonb_grid_transform_diagram_valid(jsonb)', 'EXECUTE'), true, 'authenticated cannot execute grid guard');
select isnt(has_function_privilege('anon', 'public.jsonb_object_has_only_keys(jsonb,text[])', 'EXECUTE'), true, 'anon cannot execute key guard');
select isnt(has_function_privilege('authenticated', 'public.jsonb_object_has_only_keys(jsonb,text[])', 'EXECUTE'), true, 'authenticated cannot execute key guard');
select isnt(has_function_privilege('anon', 'public.assert_diagnosis_runtime_schema(jsonb)', 'EXECUTE'), true, 'anon cannot execute runtime guard');
select isnt(has_function_privilege('authenticated', 'public.assert_diagnosis_runtime_schema(jsonb)', 'EXECUTE'), true, 'authenticated cannot execute runtime guard');

select * from finish();
rollback;
