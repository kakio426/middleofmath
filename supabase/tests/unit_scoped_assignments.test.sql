begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

select has_column(
  'public',
  'assignments',
  'unit_id',
  'assignments store an optional unit scope'
);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, is_anonymous,
  invited_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '31000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
    'unit-pilot-teacher@example.test', 'x', now(), false, now(), '{}', '{}', now(), now()
  ),
  (
    '31000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
    null, 'x', now(), true, null, '{}', '{}', now(), now()
  );

insert into public.classes (
  id, teacher_id, name, grade, semester, join_code_lookup, join_code_hash
) values (
  '32000000-0000-0000-0000-000000000001',
  '31000000-0000-0000-0000-000000000001',
  '단원 배정 시험반', 3, 2,
  encode(extensions.digest('UNIT27', 'sha256'), 'hex'),
  extensions.crypt('UNIT27', extensions.gen_salt('bf'))
);

insert into public.students (
  id, class_id, roster_key, display_alias, join_secret_hash
) values (
  '33000000-0000-0000-0000-000000000001',
  '32000000-0000-0000-0000-000000000001',
  '1', '단원학생', extensions.crypt('STUD27', extensions.gen_salt('bf'))
);

insert into public.student_access_grants (
  auth_uid, class_id, student_id
) values (
  '31000000-0000-0000-0000-000000000002',
  '32000000-0000-0000-0000-000000000001',
  '33000000-0000-0000-0000-000000000001'
);

select throws_ok(
  $$insert into public.assignments (
      id, class_id, diagnosis_set_id, diagnosis_set_version,
      status, opens_at, created_by
    )
    select
      '34000000-0000-0000-0000-000000000097',
      '32000000-0000-0000-0000-000000000001', id, version,
      'active', now() - interval '1 hour',
      '31000000-0000-0000-0000-000000000001'
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '1.0.0'$$,
  'P0001',
  'new assignment requires a unit',
  'new assignments cannot use the legacy whole-semester scope'
);

select throws_ok(
  $$insert into public.assignments (
      id, class_id, diagnosis_set_id, diagnosis_set_version, unit_id,
      status, opens_at, created_by
    )
    select
      '34000000-0000-0000-0000-000000000099',
      '32000000-0000-0000-0000-000000000001', id, version,
      'not-a-unit', 'active', now() - interval '1 hour',
      '31000000-0000-0000-0000-000000000001'
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '1.0.0'$$,
  'P0001',
  'assignment unit is not in the published content',
  'an assignment rejects an unknown unit'
);

select throws_ok(
  $$insert into public.assignments (
      id, class_id, diagnosis_set_id, diagnosis_set_version, unit_id,
      status, opens_at, created_by
    )
    select
      '34000000-0000-0000-0000-000000000098',
      '32000000-0000-0000-0000-000000000001', id, version,
      content #>> '{manifest,units,0,id}', 'active', now() - interval '1 hour',
      '31000000-0000-0000-0000-000000000001'
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and status = 'published'
    order by published_at desc
    limit 1$$,
  'P0001',
  'assignment grade and semester must match the class',
  'an assignment rejects a diagnosis from another grade or semester'
);

select lives_ok(
  $$insert into public.assignments (
      id, class_id, diagnosis_set_id, diagnosis_set_version, unit_id,
      status, opens_at, created_by
    )
    select
      '34000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000001', id, version,
      'multiplication', 'active', now() - interval '1 hour',
      '31000000-0000-0000-0000-000000000001'
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '1.0.0'$$,
  'a teacher can assign one published unit'
);

select throws_ok(
  $$update public.assignments
    set unit_id = 'division'
    where id = '34000000-0000-0000-0000-000000000001'$$,
  'P0001',
  'assignment unit is immutable',
  'the unit scope cannot change after assignment creation'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '31000000-0000-0000-0000-000000000002',
  true
);

select lives_ok(
  $$select public.start_student_session(
      '35000000-0000-0000-0000-000000000001',
      '34000000-0000-0000-0000-000000000001',
      '33000000-0000-0000-0000-000000000001',
      '35000000-0000-0000-0000-000000000001'
    )$$,
  'the student can start the unit assignment'
);

select lives_ok(
  $$select * from public.append_observation_events(
    jsonb_build_array(jsonb_build_object(
      'id', '36000000-0000-0000-0000-000000000001',
      'session_id', '35000000-0000-0000-0000-000000000001',
      'client_event_id', '36000000-0000-0000-0000-000000000011',
      'client_seq', 1,
      'event_type', 'session_started',
      'interaction_type', 'choice',
      'interaction_version', 1,
      'diagnosis_set_id', 'grade3-semester2',
      'diagnosis_set_version', '1.0.0',
      'payload', '{}'::jsonb,
      'occurred_at', now()
    ))
  )$$,
  'the unit session records its start event'
);

select throws_ok(
$_$
select * from public.append_observation_events(
  jsonb_build_array(jsonb_build_object(
    'id', '36000000-0000-0000-0000-000000000099',
    'session_id', '35000000-0000-0000-0000-000000000001',
    'client_event_id', '36000000-0000-0000-0000-000000000099',
    'client_seq', 2,
    'event_type', 'judgment_confirmed',
    'judgment_id', (
      select judgment ->> 'id'
      from public.diagnosis_sets diagnosis,
           jsonb_array_elements(diagnosis.content -> 'judgments') judgment
      where diagnosis.set_key = 'grade3-semester2'
        and diagnosis.version = '1.0.0'
        and judgment ->> 'unitId' = 'division'
      limit 1
    ),
    'interaction_type', 'choice',
    'interaction_version', 1,
    'diagnosis_set_id', 'grade3-semester2',
    'diagnosis_set_version', '1.0.0',
    'payload', '{}'::jsonb,
    'occurred_at', now()
  ))
)
$_$,
  'P0001',
  'judgment is outside the assignment scope',
  'the server rejects a judgment from another unit'
);

select lives_ok(
$_$
do $body$
declare
  scoped_events jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', gen_random_uuid(),
      'session_id', '35000000-0000-0000-0000-000000000001',
      'client_event_id', gen_random_uuid(),
      'client_seq', judgment.ordinality + 1,
      'event_type', 'judgment_confirmed',
      'judgment_id', judgment.value ->> 'id',
      'interaction_type', judgment.value -> 'interaction' ->> 'type',
      'interaction_version', (judgment.value -> 'interaction' ->> 'version')::integer,
      'diagnosis_set_id', 'grade3-semester2',
      'diagnosis_set_version', '1.0.0',
      'payload', jsonb_build_object(
        'choiceId', judgment.value -> 'choices' -> 0 ->> 'id',
        'durationMs', 1000,
        'firstSelectionMs', 500,
        'confirmationMs', 200,
        'selectionChanges', 0,
        'uncertainty', false,
        'presentedChoiceIds', (
          select jsonb_agg(choice.value ->> 'id' order by choice.ordinality)
          from jsonb_array_elements(judgment.value -> 'choices')
            with ordinality choice(value, ordinality)
        )
      ),
      'occurred_at', now()
    ) order by judgment.ordinality
  ) into scoped_events
  from public.diagnosis_sets diagnosis,
       jsonb_array_elements(diagnosis.content -> 'judgments')
         with ordinality judgment(value, ordinality)
  where diagnosis.set_key = 'grade3-semester2'
    and diagnosis.version = '1.0.0'
    and judgment.value ->> 'unitId' = 'multiplication';

  perform * from public.append_observation_events(scoped_events);
  perform * from public.append_observation_events(
    jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid(),
      'session_id', '35000000-0000-0000-0000-000000000001',
      'client_event_id', gen_random_uuid(),
      'client_seq', 4,
      'event_type', 'session_completed',
      'interaction_type', 'choice',
      'interaction_version', 1,
      'diagnosis_set_id', 'grade3-semester2',
      'diagnosis_set_version', '1.0.0',
      'payload', '{}'::jsonb,
      'occurred_at', now()
    ))
  );
end
$body$
$_$,
  'a unit session completes after only its assigned judgments'
);

set local role postgres;
select ok(
  (
    select status = 'completed' and last_event_seq = 4
    from public.sessions
    where id = '35000000-0000-0000-0000-000000000001'
  ),
  'the completed unit session stores the server-derived final state'
);

select * from finish();
rollback;
