begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select is(
  (
    select count(*)
    from public.diagnosis_sets
    where set_key = 'grade4-semester1'
      and version = '1.4.0'
      and status = 'published'
  ),
  1::bigint,
  'grade4 semester1 v1.4.0 is published exactly once'
);

select results_eq(
  $$select
      jsonb_array_length(content -> 'manifest' -> 'units'),
      jsonb_array_length(content -> 'learnerStages'),
      jsonb_array_length(content -> 'judgments')
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and version = '1.4.0'$$,
  $$values (6, 33, 66)$$,
  'v1.4.0 publishes six units, 33 stages, and 66 judgments'
);

select results_eq(
  $$select
      checksum,
      checksum = content #>> '{manifest,checksum}'
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and version = '1.4.0'$$,
  $$values (
      '8d1b5ecdcf8755a46b295d459425f863e050be3305105eaaf5ba9ce71f3a4623'::text,
      true
    )$$,
  'the v1.4.0 database checksum is pinned and synchronized into the manifest'
);

select ok(
  (
    select publication_gate ->> 'setKey' = set_key
      and publication_gate ->> 'targetVersion' = version
      and publication_gate ->> 'blueprintRevision' = '2026-07-31.6'
      and publication_gate ->> 'crosswalkRevision' = '2026-07-31.6'
      and (publication_gate ->> 'valid')::boolean
      and (publication_gate ->> 'errorCount')::integer = 0
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and version = '1.4.0'
  ),
  'the v1.4.0 gate is scoped to the exact content and reviewed ledgers'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade4-semester1' and version = '1.4.0'
  ),
  132::bigint,
  'every v1.4.0 distractor has one teacher note'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes note
    join public.diagnosis_sets diagnosis
      on diagnosis.set_key = note.set_key and diagnosis.version = note.version
    cross join jsonb_array_elements(diagnosis.content -> 'judgments') judgment
    cross join jsonb_array_elements(judgment -> 'choices') choice
    where note.set_key = 'grade4-semester1'
      and note.version = '1.4.0'
      and judgment ->> 'id' = note.judgment_id
      and choice ->> 'id' = note.choice_id
      and (choice ->> 'correct')::boolean
  ),
  0::bigint,
  'no correct choice receives a teacher distractor note'
);

select lives_ok(
  $$select public.assert_distractor_note_coverage(
      'grade4-semester1', '1.4.0'
    )$$,
  'v1.4.0 exact note coverage passes'
);

select results_eq(
  $$select
      jsonb_array_length(content -> 'manifest' -> 'units'),
      jsonb_array_length(content -> 'learnerStages'),
      jsonb_array_length(content -> 'judgments')
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and version = '1.3.0'$$,
  $$values (5, 27, 54)$$,
  'the immutable v1.3.0 content shape remains unchanged'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade4-semester1' and version = '1.3.0'
  ),
  108::bigint,
  'the immutable v1.3.0 note ledger remains unchanged'
);

select is(
  (
    select checksum
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and version = '1.3.0'
  ),
  'eaf33bde3cf313aef2bd8fd19fe6d8ccce8e55351309f14198cc99335a12c4cd',
  'the immutable v1.3.0 database checksum remains unchanged'
);

select throws_ok(
  $$update public.diagnosis_distractor_notes
    set teacher_note = 'tampered'
    where set_key = 'grade4-semester1' and version = '1.4.0'
      and judgment_id = 'g4s1-muldiv-01' and choice_id = '426'$$,
  'P0001',
  'published diagnosis distractor notes are immutable',
  'a published v1.4.0 teacher note cannot be updated'
);

select throws_ok(
  $$delete from public.diagnosis_distractor_notes
    where set_key = 'grade4-semester1' and version = '1.4.0'
      and judgment_id = 'g4s1-muldiv-01' and choice_id = '426'$$,
  'P0001',
  'published diagnosis distractor notes are immutable',
  'a published v1.4.0 teacher note cannot be deleted'
);

insert into public.diagnosis_distractor_notes (
  set_key, version, judgment_id, choice_id, signal_ids,
  misconception_key, misconception_title, teacher_note
) values (
  'grade4-semester1', '1.4.0', 'extra-judgment', 'extra-choice',
  array['mul-div.estimate'], 'extra-probe', '추가 검사', '추가 검사 노트'
);

select throws_ok(
  $$select public.assert_distractor_note_coverage(
      'grade4-semester1', '1.4.0'
    )$$,
  'P0001',
  'distractor note count mismatch: expected 132, found 133',
  'an extra teacher note fails closed'
);

select * from finish();
rollback;
