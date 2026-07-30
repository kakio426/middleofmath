begin;

create extension if not exists pgtap with schema extensions;
select plan(56);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, is_anonymous,
  invited_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('21000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'pilot-teacher-1@example.test', 'x', now(), false, now(), '{}', '{}', now(), now()),
  ('21000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'pilot-teacher-2@example.test', 'x', now(), false, now(), '{}', '{}', now(), now()),
  ('21000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', null, 'x', now(), true, null, '{}', '{}', now(), now()),
  ('21000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', null, 'x', now(), true, null, '{}', '{}', now(), now()),
  ('21000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', null, 'x', now(), true, null, '{}', '{}', now(), now());

select throws_ok(
  $$insert into auth.users (
      id, aud, role, email, encrypted_password, email_confirmed_at, is_anonymous,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '21000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
      'public-signup@example.test', 'x', now(), false, '{}', '{}', now(), now()
    )$$,
  'P0001',
  'teacher account requires an administrator invitation',
  'public email signup cannot create a teacher account'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$insert into public.teachers (id, display_name)
    values ('21000000-0000-0000-0000-000000000003', '자가 승격')$$,
  '42501',
  'permission denied for table teachers',
  'an anonymous student cannot create a teacher profile'
);
set local role postgres;

insert into public.classes (
  id, teacher_id, name, grade, semester, join_code_lookup, join_code_hash
) values
  (
    '22000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001',
    '파일럿 1반', 3, 2,
    encode(extensions.digest('ABC234', 'sha256'), 'hex'), extensions.crypt('ABC234', extensions.gen_salt('bf'))
  ),
  (
    '22000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000002',
    '파일럿 2반', 3, 2,
    encode(extensions.digest('XYZ567', 'sha256'), 'hex'), extensions.crypt('XYZ567', extensions.gen_salt('bf'))
  );

select ok(
  (select pilot_ends_at between created_at + interval '29 days 23 hours' and created_at + interval '30 days 1 hour'
   from public.classes where id = '22000000-0000-0000-0000-000000000001'),
  'pilot defaults to about 30 days'
);
select is(
  (select purge_after - pilot_ends_at from public.classes where id = '22000000-0000-0000-0000-000000000001'),
  interval '90 days',
  'purge defaults to 90 days after pilot end'
);

insert into public.students (id, class_id, roster_key, display_alias, join_secret_hash) values
  ('23000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '12', '별빛', extensions.crypt('STAR27', extensions.gen_salt('bf'))),
  ('23000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', '8', '새싹', extensions.crypt('LEAF27', extensions.gen_salt('bf')));

insert into public.assignments (
  id, class_id, diagnosis_set_id, diagnosis_set_version, status, opens_at, created_by
)
select '24000000-0000-0000-0000-000000000001'::uuid, '22000000-0000-0000-0000-000000000001'::uuid, id, version, 'active'::public.assignment_status, now() - interval '2 days', '21000000-0000-0000-0000-000000000001'::uuid
from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
union all
select '24000000-0000-0000-0000-000000000002'::uuid, '22000000-0000-0000-0000-000000000002'::uuid, id, version, 'active'::public.assignment_status, now() - interval '2 days', '21000000-0000-0000-0000-000000000002'::uuid
from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0';

select throws_ok(
  $$insert into public.assignments (
      id, class_id, diagnosis_set_id, diagnosis_set_version, status, opens_at, created_by
    ) select
      '24000000-0000-0000-0000-000000000099',
      '22000000-0000-0000-0000-000000000001', id, '9.9.9', 'active', now(),
      '21000000-0000-0000-0000-000000000001'
    from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'$$,
  'P0001',
  'assignment must reference the exact published content version',
  'assignment rejects a mismatched content version'
);

select throws_ok(
  $$update public.assignments set diagnosis_set_version = '9.9.9'
    where id = '24000000-0000-0000-0000-000000000001'$$,
  'P0001',
  'assignment content version is immutable',
  'assignment cannot change its content version after creation'
);

insert into public.sessions (
  id, assignment_id, student_id, student_auth_uid, client_session_id,
  status, started_at, completed_at, last_event_seq
) values
  ('25000000-0000-0000-0000-000000000001', '24000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', '25000000-0000-0000-0000-000000000001', 'completed', now() - interval '2 hours', now() - interval '90 minutes', 2),
  ('25000000-0000-0000-0000-000000000002', '24000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000003', '25000000-0000-0000-0000-000000000002', 'completed', now() - interval '1 hour', now() - interval '30 minutes', 2),
  ('25000000-0000-0000-0000-000000000003', '24000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000003', '25000000-0000-0000-0000-000000000003', 'completed', now() - interval '1 hour', now() - interval '20 minutes', 1);

insert into public.observation_events (
  id, session_id, client_event_id, client_seq, event_type, interaction_type,
  interaction_version, diagnosis_set_key, diagnosis_set_version, payload, occurred_at
) values
  ('26000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000000011', 1, 'session_started', 'choice', 1, 'grade3-semester2', '1.0.0', '{}', now() - interval '2 hours'),
  ('26000000-0000-0000-0000-000000000002', '25000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000000012', 1, 'session_started', 'choice', 1, 'grade3-semester2', '1.0.0', '{}', now() - interval '1 hour'),
  ('26000000-0000-0000-0000-000000000003', '25000000-0000-0000-0000-000000000003', '26000000-0000-0000-0000-000000000013', 1, 'session_started', 'choice', 1, 'grade3-semester2', '1.0.0', '{}', now() - interval '1 hour');

insert into public.interpretation_runs (
  id, session_id, engine_version, diagnosis_set_version, generated_at, report
) values
  (
    '27000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000002',
    'rules-2.0.0', '1.0.0', now(),
    '{"sessionId":"25000000-0000-0000-0000-000000000002","engineVersion":"rules-2.0.0","diagnosisSetVersion":"1.0.0"}'
  ),
  (
    '27000000-0000-0000-0000-000000000002', '25000000-0000-0000-0000-000000000003',
    'rules-2.0.0', '1.0.0', now(),
    '{"sessionId":"25000000-0000-0000-0000-000000000003","engineVersion":"rules-2.0.0","diagnosisSetVersion":"1.0.0"}'
  );

select lives_ok(
  $$insert into public.interpretation_runs (
      id, session_id, engine_version, diagnosis_set_version, generated_at, report
    ) values (
      '27000000-0000-0000-0000-000000000003',
      '25000000-0000-0000-0000-000000000002',
      'rules-3.0.0',
      '1.0.0',
      now(),
      '{
        "sessionId":"25000000-0000-0000-0000-000000000002",
        "diagnosisSetId":"grade3-semester2",
        "diagnosisSetVersion":"1.0.0",
        "engineVersion":"rules-3.0.0",
        "generatedAt":"2026-07-29T00:00:00.000Z",
        "observedJudgmentCount":1,
        "stableJudgmentCount":0,
        "uncertaintyCount":0,
        "findings":[],
        "evidence":[],
        "opportunities":[],
        "confirmedFindingCount":0,
        "tentativeFindingCount":0,
        "responseStyle":{
          "confirmationCount":1,
          "provenanceCount":0,
          "provenanceCoverage":0,
          "dominantPosition":null,
          "dominantPositionRate":null,
          "positionStyleSuspected":false,
          "fastConfirmationCount":0
        }
      }'
    )$$,
  'a rules-3 interpretation report with confidence metadata is accepted'
);

select is(
  (
    select count(*)::integer
    from public.interpretation_runs
    where session_id = '25000000-0000-0000-0000-000000000002'
  ),
  2,
  'rules-2 and rules-3 runs remain side by side for the same session'
);

select throws_ok(
  $$update public.interpretation_runs
    set generated_at = now()
    where id = '27000000-0000-0000-0000-000000000001'$$,
  'P0001',
  'interpretation runs are versioned and immutable',
  'the pre-existing rules-2 interpretation remains immutable'
);

insert into public.parent_report_exports (
  id, session_id, interpretation_run_id, reviewed_by, report
) values (
  '28000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000002',
  '27000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001',
  '{"studentLabel":"별빛","diagnosisTitle":"3학년 2학기 수학","generatedAt":"2026-07-22T00:00:00.000Z","participation":"참여함","strengths":[],"supportAreas":[],"closing":"계속 관찰합니다.","disclaimer":"한 번의 관찰입니다."}'
);

select throws_ok(
  $$insert into public.parent_report_exports (
      id, session_id, interpretation_run_id, reviewed_by, report
    ) values (
      '28000000-0000-0000-0000-000000000002', '25000000-0000-0000-0000-000000000002',
      '27000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001',
      '{"studentLabel":"12번 · 별빛","diagnosisTitle":"3학년 2학기 수학","generatedAt":"2026-07-22T00:00:00.000Z","participation":"참여함","strengths":[],"supportAreas":[],"closing":"계속 관찰합니다.","disclaimer":"한 번의 관찰입니다."}'
    )$$,
  'P0001',
  'parent export contains invalid or identifying fields',
  'parent export rejects a roster-number label'
);

select columns_are(
  'public', 'anonymous_join_throttles',
  array['auth_uid', 'window_started_at', 'failure_count', 'locked_until', 'updated_at'],
  'join throttle stores no raw code or IP column'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000005', true);
select is(
  (select count(*)::integer from public.join_class('ABC234', '12', 'STAR27')),
  1,
  'a student needs the correct non-predictable personal code'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000003', true);
do $$ begin
  for attempt_number in 1..10 loop
    perform * from public.join_class('BAD999', '12', 'BAD999');
  end loop;
end $$;

set local role postgres;
select is(
  (select failure_count from public.anonymous_join_throttles where auth_uid = '21000000-0000-0000-0000-000000000003'),
  10,
  'ten failed attempts are counted in the ten minute window'
);
select is(
  (select locked_until from public.anonymous_join_throttles where auth_uid = '21000000-0000-0000-0000-000000000003'),
  null::timestamptz,
  'the tenth failure is allowed without starting the lock'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000003', true);
select is((select count(*)::integer from public.join_class('ABC234', '12', 'STAR27')), 0, 'the eleventh attempt starts the lock before credential evaluation');

set local role postgres;
select ok(
  (select locked_until between now() + interval '14 minutes 50 seconds' and now() + interval '15 minutes 10 seconds'
   from public.anonymous_join_throttles where auth_uid = '21000000-0000-0000-0000-000000000003'),
  'the lock lasts fifteen minutes'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
create temporary table rotated_join_code as
select join_code from public.rotate_class_join_code('22000000-0000-0000-0000-000000000001');

set local role postgres;
select ok(
  (select locked_until > now() from public.anonymous_join_throttles where auth_uid = '21000000-0000-0000-0000-000000000003'),
  'rotating a class code does not clear an anonymous identity lock'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000003', true);
select is(
  (select count(*)::integer from public.join_class((select join_code from rotated_join_code), '12', 'STAR27')),
  0,
  'locked identity receives the same empty generic result for a correct rotated code'
);

set local role postgres;
update public.anonymous_join_throttles
set locked_until = now() - interval '1 second', window_started_at = now() - interval '16 minutes'
where auth_uid = '21000000-0000-0000-0000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000003', true);
select is(
  (select count(*)::integer from public.join_class((select join_code from rotated_join_code), '12', 'STAR27')),
  1,
  'identity can join with the current code after the lock expires'
);

set local role postgres;
select is(
  (select count(*)::integer from public.anonymous_join_throttles where auth_uid = '21000000-0000-0000-0000-000000000003'),
  0,
  'successful join clears failure state'
);
select is(
  (select event_count::integer from public.pilot_operations_daily where day = current_date and app = 'student' and event_name = 'class_join.failed'),
  12,
  'join failures retain only an anonymous daily count'
);
select is(
  (select event_count::integer from public.pilot_operations_daily where day = current_date and app = 'student' and event_name = 'class_join.succeeded'),
  2,
  'join successes retain only an anonymous daily count'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$select public.start_student_session(
      '25000000-0000-0000-0000-000000000004',
      '24000000-0000-0000-0000-000000000001',
      '23000000-0000-0000-0000-000000000001',
      '25000000-0000-0000-0000-000000000004'
    )$$,
  'student starts a server-owned session through the validated RPC'
);
select throws_ok(
  $$update public.sessions
    set status = 'completed', completed_at = now() + interval '100 years'
    where id = '25000000-0000-0000-0000-000000000004'$$,
  '42501',
  'permission denied for table sessions',
  'student cannot forge session completion state or timestamp'
);
select lives_ok(
$_$
do $body$
declare
  judgment_events jsonb;
  event_batch jsonb;
  judgment_count integer;
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', gen_random_uuid(),
      'session_id', '25000000-0000-0000-0000-000000000004',
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
          select jsonb_agg(choice.value ->> 'id' order by choice.ordinality desc)
          from jsonb_array_elements(judgment.value -> 'choices')
            with ordinality choice(value, ordinality)
        )
      ),
      'occurred_at', now()
    ) order by judgment.ordinality
  ), count(*) into judgment_events, judgment_count
  from public.diagnosis_sets diagnosis,
       jsonb_array_elements(diagnosis.content -> 'judgments') with ordinality judgment(value, ordinality)
  where diagnosis.set_key = 'grade3-semester2' and diagnosis.version = '1.0.0';

  event_batch := jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid(),
    'session_id', '25000000-0000-0000-0000-000000000004',
    'client_event_id', gen_random_uuid(),
    'client_seq', 1,
    'event_type', 'session_started',
    'interaction_type', 'choice',
    'interaction_version', 1,
    'diagnosis_set_id', 'grade3-semester2',
    'diagnosis_set_version', '1.0.0',
    'payload', '{}'::jsonb,
    'occurred_at', now()
  )) || judgment_events || jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid(),
    'session_id', '25000000-0000-0000-0000-000000000004',
    'client_event_id', gen_random_uuid(),
    'client_seq', judgment_count + 2,
    'event_type', 'session_completed',
    'interaction_type', 'choice',
    'interaction_version', 1,
    'diagnosis_set_id', 'grade3-semester2',
    'diagnosis_set_version', '1.0.0',
    'payload', '{}'::jsonb,
    'occurred_at', now() + interval '100 years'
  ));
  perform * from public.append_observation_events(event_batch);
end
$body$
$_$,
  'server accepts a complete ordered event batch exactly once'
);

set local role postgres;
select ok(
  (select status = 'completed'
      and completed_at between now() - interval '1 minute' and now() + interval '1 minute'
      and completed_at < now() + interval '1 year'
      and last_event_seq = 14
   from public.sessions where id = '25000000-0000-0000-0000-000000000004'),
  'server derives completion status and timestamp instead of trusting the client clock'
);
select is(
  (
    select event.payload -> 'presentedChoiceIds'
    from public.observation_events event
    where event.session_id = '25000000-0000-0000-0000-000000000004'
      and event.event_type = 'judgment_confirmed'
    order by event.client_seq
    limit 1
  ),
  (
    select jsonb_agg(choice.value ->> 'id' order by choice.ordinality desc)
    from public.diagnosis_sets diagnosis
    cross join lateral jsonb_array_elements(diagnosis.content -> 'judgments')
      with ordinality judgment(value, ordinality)
    cross join lateral jsonb_array_elements(judgment.value -> 'choices')
      with ordinality choice(value, ordinality)
    where diagnosis.set_key = 'grade3-semester2'
      and diagnosis.version = '1.0.0'
      and judgment.ordinality = 1
  ),
  'presented choice IDs pass through the append-only event API in exact non-authored order'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000003', true);
select public.start_student_session(
  '25000000-0000-0000-0000-000000000005',
  '24000000-0000-0000-0000-000000000001',
  '23000000-0000-0000-0000-000000000001',
  '25000000-0000-0000-0000-000000000005'
);
select lives_ok(
  $$select * from public.append_observation_events(jsonb_build_array(jsonb_build_object(
      'id', '26000000-0000-0000-0000-000000000020',
      'session_id', '25000000-0000-0000-0000-000000000005',
      'client_event_id', '26000000-0000-0000-0000-000000000021',
      'client_seq', 1,
      'event_type', 'session_started',
      'interaction_type', 'choice',
      'interaction_version', 1,
      'diagnosis_set_id', 'grade3-semester2',
      'diagnosis_set_version', '1.0.0',
      'payload', '{}'::jsonb,
      'occurred_at', '2026-07-22T00:00:00.000Z'
    )))$$,
  'first delivery appends an observation event'
);
select lives_ok(
  $$select * from public.append_observation_events(jsonb_build_array(jsonb_build_object(
      'id', '26000000-0000-0000-0000-000000000020',
      'session_id', '25000000-0000-0000-0000-000000000005',
      'client_event_id', '26000000-0000-0000-0000-000000000021',
      'client_seq', 1,
      'event_type', 'session_started',
      'interaction_type', 'choice',
      'interaction_version', 1,
      'diagnosis_set_id', 'grade3-semester2',
      'diagnosis_set_version', '1.0.0',
      'payload', '{}'::jsonb,
      'occurred_at', '2026-07-22T00:00:00.000Z'
    )))$$,
  'an identical client event retry is idempotent'
);
select throws_ok(
  $$select * from public.append_observation_events(jsonb_build_array(jsonb_build_object(
      'id', '26000000-0000-0000-0000-000000000020',
      'session_id', '25000000-0000-0000-0000-000000000005',
      'client_event_id', '26000000-0000-0000-0000-000000000021',
      'client_seq', 1,
      'event_type', 'session_started',
      'interaction_type', 'choice',
      'interaction_version', 1,
      'diagnosis_set_id', 'grade3-semester2',
      'diagnosis_set_version', '1.0.0',
      'payload', '{"changed":true}'::jsonb,
      'occurred_at', '2026-07-22T00:00:00.000Z'
    )))$$,
  'P0001',
  'event id conflict',
  'a reused client event ID with different payload is rejected'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$select public.record_pilot_operation('student', 'sync.failed')$$,
  'student can increment the allowlisted anonymous sync failure count'
);
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000006', true);
select throws_ok(
  $$select public.record_pilot_operation('student', 'sync.failed')$$,
  'P0001',
  'student session required',
  'an anonymous identity without a real session cannot pollute sync failure metrics'
);
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000003', true);
do $$ begin
  for event_number in 1..4 loop
    perform public.record_pilot_operation('student', 'sync.failed');
  end loop;
end $$;
set local role postgres;
select is(
  (select event_count::integer from public.pilot_operations_daily where day = current_date and app = 'student' and event_name = 'sync.failed'),
  3,
  'client telemetry is capped per identity and ten-minute bucket'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select is((select count(*)::integer from public.classes where id = '22000000-0000-0000-0000-000000000002'), 0, 'teacher one cannot read teacher two class');
select is((select count(*)::integer from public.sessions where id = '25000000-0000-0000-0000-000000000003'), 0, 'teacher one cannot read teacher two session');
select is((select count(*)::integer from public.observation_events where session_id = '25000000-0000-0000-0000-000000000003'), 0, 'teacher one cannot read teacher two events');
select is((select count(*)::integer from public.interpretation_runs where session_id = '25000000-0000-0000-0000-000000000003'), 0, 'teacher one cannot read teacher two interpretation');
select is(
  (select observation_events_received::integer from public.teacher_daily_pilot_aggregates(current_date, current_date)),
  17,
  'privacy-safe daily aggregate includes only the current teacher events'
);

select throws_ok(
  $$update public.interpretation_runs set generated_at = now() where id = '27000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table interpretation_runs',
  'ordinary teacher cannot rewrite an interpretation run'
);
select throws_ok(
  $$delete from public.interpretation_runs where id = '27000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table interpretation_runs',
  'ordinary teacher cannot delete an interpretation run'
);

select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.classes where id = '22000000-0000-0000-0000-000000000001'), 0, 'teacher two cannot read teacher one class');
select is((select count(*)::integer from public.sessions where assignment_id = '24000000-0000-0000-0000-000000000001'), 0, 'teacher two cannot read teacher one sessions');
select is((select count(*)::integer from public.observation_events where session_id in ('25000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000002')), 0, 'teacher two cannot read teacher one events');
select is((select count(*)::integer from public.interpretation_runs where session_id = '25000000-0000-0000-0000-000000000002'), 0, 'teacher two cannot read teacher one interpretation');
select is(
  (select observation_events_received::integer from public.teacher_daily_pilot_aggregates(current_date, current_date)),
  1,
  'teacher two daily aggregate excludes teacher one activity'
);

select throws_ok(
  $$select public.purge_expired_pilot_data(now())$$,
  '42501',
  'permission denied for function purge_expired_pilot_data',
  'ordinary authenticated teacher cannot execute purge'
);

set local role postgres;
select throws_ok(
  $$update public.observation_events set payload = '{"changed":true}' where id = '26000000-0000-0000-0000-000000000001'$$,
  'P0001',
  'observation_events are append-only',
  'ordinary observation mutation remains blocked'
);

update public.classes
set pilot_ends_at = now() - interval '91 days', purge_after = now() - interval '1 day'
where id = '22000000-0000-0000-0000-000000000001';

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select lives_ok(
  $$select public.purge_expired_pilot_data(now())$$,
  'service role purges expired children in dependency order'
);

set local role postgres;
select is(
  (select count(*)::integer from public.classes where id = '22000000-0000-0000-0000-000000000001'),
  0,
  'purge removes the expired class instead of retaining a teacher-linked shell'
);
select ok(
  (select active and purged_at is null from public.classes where id = '22000000-0000-0000-0000-000000000002'),
  'purge leaves an unexpired class active'
);
select is(
  (select count(*)::integer
   from public.students student
   left join public.assignments assignment on assignment.class_id = student.class_id
   left join public.sessions session on session.assignment_id = assignment.id
   left join public.observation_events event on event.session_id = session.id
   left join public.interpretation_runs run on run.session_id = session.id
   left join public.parent_report_exports export on export.session_id = session.id
   where student.class_id = '22000000-0000-0000-0000-000000000001'),
  0,
  'expired class students and dependent evidence are deleted'
);
select is(
  (select count(*)::integer from public.sessions where assignment_id = '24000000-0000-0000-0000-000000000002'),
  1,
  'unexpired class evidence remains'
);
select is(
  (select count(*)::integer from auth.users where id = '21000000-0000-0000-0000-000000000005'),
  0,
  'purge removes a class-bound orphan anonymous identity'
);
select columns_are(
  'public', 'pilot_operations_daily',
  array['day', 'app', 'event_name', 'event_count'],
  'preserved rollup contains only date, app, event name, and count'
);
select is(
  (select coalesce(sum(event_count), 0)::integer from public.pilot_operations_daily where event_name = 'session.started'),
  2,
  'server-owned session starts leave anonymous operation counts'
);
select is(
  (select coalesce(sum(event_count), 0)::integer from public.pilot_operations_daily where event_name = 'parent_report.exported'),
  1,
  'purge rollup preserves the parent export count without report content'
);

select * from finish();
rollback;
