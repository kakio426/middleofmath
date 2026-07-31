begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select is(
  (
    select count(*)
    from public.diagnosis_sets
    where set_key = 'grade4-semester1'
      and version = '1.3.0'
      and status = 'published'
  ),
  1::bigint,
  'grade 4 semester 1 version 1.3.0 is published exactly once'
);

select results_eq(
  $$select
      jsonb_array_length(content #> '{manifest,units}'),
      jsonb_array_length(content -> 'learnerStages'),
      jsonb_array_length(content -> 'judgments')
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and version = '1.3.0'$$,
  $$values (5, 27, 54)$$,
  'the published payload contains all five units, 27 stages, and 54 judgments'
);

select ok(
  (
    select content #>> '{manifest,status}' = 'published'
      and content #>> '{manifest,checksum}' = checksum
      and char_length(checksum) = 64
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and version = '1.3.0'
  ),
  'the database pins the published status and canonical checksum'
);

select ok(
  (
    select publication_gate ->> 'gate' = 'diagnostic-integrity'
      and (publication_gate ->> 'enforced')::boolean
      and (publication_gate ->> 'valid')::boolean
      and publication_gate ->> 'blueprintRevision' = '2026-07-31.5'
      and publication_gate ->> 'crosswalkRevision' = '2026-07-31.5'
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and version = '1.3.0'
  ),
  'the immutable publication keeps the enforced integrity attestation'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade4-semester1' and version = '1.3.0'
  ),
  108::bigint,
  'every non-correct choice has one teacher-only note'
);

select is(
  (
    select count(distinct judgment_id)
    from public.diagnosis_distractor_notes
    where set_key = 'grade4-semester1' and version = '1.3.0'
  ),
  54::bigint,
  'teacher notes cover all 54 judgments'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade4-semester1'
      and version = '1.3.0'
      and (
        cardinality(signal_ids) = 0
        or char_length(trim(misconception_key)) = 0
        or char_length(trim(misconception_title)) = 0
        or char_length(trim(teacher_note)) = 0
      )
  ),
  0::bigint,
  'no teacher note has an empty signal, key, title, or explanation'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes note
    join public.diagnosis_sets diagnosis
      on diagnosis.set_key = note.set_key
      and diagnosis.version = note.version
    join lateral jsonb_array_elements(diagnosis.content -> 'judgments') judgment
      on judgment ->> 'id' = note.judgment_id
    join lateral jsonb_array_elements(judgment -> 'choices') choice
      on choice ->> 'id' = note.choice_id
    where (choice ->> 'correct')::boolean
  ),
  0::bigint,
  'correct choices never receive a teacher note'
);

select lives_ok(
  $$select public.assert_distractor_note_coverage(
      'grade4-semester1', '1.3.0'
    )$$,
  'the fail-closed exact note coverage assertion passes'
);

select ok(
  (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.diagnosis_distractor_notes'::regclass
  ),
  'row level security protects teacher-only notes'
);

select ok(
  has_table_privilege(
    'authenticated',
    'public.diagnosis_distractor_notes',
    'select'
  ),
  'authenticated readers may request notes through RLS'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.diagnosis_distractor_notes',
    'insert,update,delete'
  ),
  'authenticated readers cannot mutate notes'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.diagnosis_distractor_notes',
    'select'
  ),
  'anonymous users cannot select notes'
);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, is_anonymous,
  invited_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '51000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'grade4-teacher@example.test', 'x',
    now(), false, now(), '{}', '{}', now(), now()
  ),
  (
    '51000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', null, 'x',
    now(), true, null, '{}', '{}', now(), now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '51000000-0000-0000-0000-000000000001',
  true
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade4-semester1' and version = '1.3.0'
  ),
  108::bigint,
  'an invited teacher can read all notes for the pinned version'
);

select set_config(
  'request.jwt.claim.sub',
  '51000000-0000-0000-0000-000000000002',
  true
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade4-semester1' and version = '1.3.0'
  ),
  0::bigint,
  'a student identity cannot read teacher-only notes'
);

set local role postgres;

select throws_ok(
  $$update public.diagnosis_distractor_notes
    set teacher_note = 'changed'
    where set_key = 'grade4-semester1'
      and version = '1.3.0'
      and judgment_id = 'g4s1-bar-01'
      and choice_id = 'five-people'$$,
  'P0001',
  'published diagnosis distractor notes are immutable',
  'published teacher notes cannot be updated'
);

select throws_ok(
  $$delete from public.diagnosis_distractor_notes
    where set_key = 'grade4-semester1'
      and version = '1.3.0'
      and judgment_id = 'g4s1-bar-01'
      and choice_id = 'five-people'$$,
  'P0001',
  'published diagnosis distractor notes are immutable',
  'published teacher notes cannot be deleted'
);

select throws_ok(
  $$with injected as (
      insert into public.diagnosis_distractor_notes (
        set_key, version, judgment_id, choice_id, signal_ids,
        misconception_key, misconception_title, teacher_note
      ) values (
        'grade4-semester1', '1.3.0', 'g4s1-bar-01', 'ten-people',
        array['bar-graph.scale'], 'extra.correct-choice',
        '정답 선택에 잘못 추가함', '정답에는 교사 오답 해석을 붙이지 않습니다.'
      )
      returning 1
    )
    select public.assert_distractor_note_coverage(
      'grade4-semester1', '1.3.0'
    )
    from injected$$,
  'P0001',
  'distractor note count mismatch: expected 108, found 109',
  'coverage fails closed when an extra note is introduced'
);

select * from finish();
rollback;
