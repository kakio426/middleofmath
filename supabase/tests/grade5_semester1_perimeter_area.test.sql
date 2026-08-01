begin;
select plan(19);

select ok(public.jsonb_perimeter_area_diagram_valid(
  '{"kind":"perimeter-area-diagram","shape":"rectangle","width":8,"height":5}'::jsonb
), 'rectangle dimensions are accepted');
select ok(public.jsonb_perimeter_area_diagram_valid(
  '{"kind":"perimeter-area-diagram","shape":"square","side":7}'::jsonb
), 'square side is accepted');
select ok(public.jsonb_perimeter_area_diagram_valid(
  '{"kind":"perimeter-area-diagram","shape":"parallelogram","base":9,"height":4}'::jsonb
), 'parallelogram base and height are accepted');
select ok(public.jsonb_perimeter_area_diagram_valid(
  '{"kind":"perimeter-area-diagram","shape":"triangle","base":10,"height":6}'::jsonb
), 'triangle base and height are accepted');
select ok(public.jsonb_perimeter_area_diagram_valid(
  '{"kind":"perimeter-area-diagram","shape":"trapezoid","topBase":6,"bottomBase":10,"height":5}'::jsonb
), 'trapezoid dimensions are accepted');
select ok(public.jsonb_perimeter_area_diagram_valid(
  '{"kind":"perimeter-area-diagram","shape":"rhombus","diagonal1":12,"diagonal2":8}'::jsonb
), 'rhombus diagonals are accepted');
select isnt(public.jsonb_perimeter_area_diagram_valid(
  '{"kind":"perimeter-area-diagram","shape":"triangle","base":10}'::jsonb
), true, 'missing height is rejected');
select isnt(public.jsonb_perimeter_area_diagram_valid(
  '{"kind":"perimeter-area-diagram","shape":"square","side":7,"answer":49}'::jsonb
), true, 'answer leak key is rejected');
select isnt(public.jsonb_perimeter_area_diagram_valid(
  '{"kind":"perimeter-area-diagram","shape":"rectangle","width":8,"height":5,"side":8}'::jsonb
), true, 'shape-incompatible length key is rejected');
select isnt(has_function_privilege('anon', 'public.jsonb_perimeter_area_diagram_valid(jsonb)', 'EXECUTE'), true, 'anon cannot execute visual guard directly');
select isnt(has_function_privilege('authenticated', 'public.jsonb_perimeter_area_diagram_valid(jsonb)', 'EXECUTE'), true, 'authenticated cannot execute visual guard directly');
select isnt(has_function_privilege('anon', 'public.jsonb_object_has_only_keys_before_perimeter_area(jsonb,text[])', 'EXECUTE'), true, 'anon cannot execute previous key guard directly');
select isnt(has_function_privilege('authenticated', 'public.jsonb_object_has_only_keys_before_perimeter_area(jsonb,text[])', 'EXECUTE'), true, 'authenticated cannot execute previous key guard directly');
select isnt(has_function_privilege('anon', 'public.jsonb_object_has_only_keys(jsonb,text[])', 'EXECUTE'), true, 'anon cannot execute current key guard directly');
select isnt(has_function_privilege('authenticated', 'public.jsonb_object_has_only_keys(jsonb,text[])', 'EXECUTE'), true, 'authenticated cannot execute current key guard directly');
select isnt(has_function_privilege('anon', 'public.assert_runtime_before_perimeter_area(jsonb)', 'EXECUTE'), true, 'anon cannot execute previous runtime guard directly');
select isnt(has_function_privilege('authenticated', 'public.assert_runtime_before_perimeter_area(jsonb)', 'EXECUTE'), true, 'authenticated cannot execute previous runtime guard directly');
select isnt(has_function_privilege('anon', 'public.assert_diagnosis_runtime_schema(jsonb)', 'EXECUTE'), true, 'anon cannot execute current runtime guard directly');
select isnt(has_function_privilege('authenticated', 'public.assert_diagnosis_runtime_schema(jsonb)', 'EXECUTE'), true, 'authenticated cannot execute current runtime guard directly');

select * from finish();
rollback;
