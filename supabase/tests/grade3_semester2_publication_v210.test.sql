begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select is(
  (
    select count(*)
    from public.diagnosis_sets
    where set_key = 'grade3-semester2'
      and version = '2.1.0'
      and status = 'published'
  ),
  1::bigint,
  'grade3 semester2 v2.1.0 is published exactly once'
);

select results_eq(
  $$select
      jsonb_array_length(content -> 'manifest' -> 'units'),
      jsonb_array_length(content -> 'learnerStages'),
      jsonb_array_length(content -> 'judgments')
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '2.1.0'$$,
  $$values (6, 32, 64)$$,
  'v2.1.0 publishes six units, 32 stages, and 64 judgments'
);

select results_eq(
  $$select
      checksum,
      checksum = content #>> '{manifest,checksum}'
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '2.1.0'$$,
  $$values (
      '566762c8491f7c0365d992ed8187cf748bc03b6209f43328a0a4cac987f623ae'::text,
      true
    )$$,
  'the v2.1.0 database checksum is pinned and synchronized into the manifest'
);

select ok(
  (
    select publication_gate ->> 'setKey' = set_key
      and publication_gate ->> 'targetVersion' = version
      and publication_gate ->> 'upstreamCommit'
        = '3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c'
      and publication_gate ->> 'upstreamTaxonomyVersion' = 'kr-full-depth-v0.4'
      and (publication_gate ->> 'valid')::boolean
      and (publication_gate ->> 'errorCount')::integer = 0
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '2.1.0'
  ),
  'the v2.1.0 gate is scoped to the exact content and pinned upstream map'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade3-semester2' and version = '2.1.0'
  ),
  128::bigint,
  'every v2.1.0 distractor has one teacher note'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes note
    join public.diagnosis_sets diagnosis
      on diagnosis.set_key = note.set_key and diagnosis.version = note.version
    cross join jsonb_array_elements(diagnosis.content -> 'judgments') judgment
    cross join jsonb_array_elements(judgment -> 'choices') choice
    where note.set_key = 'grade3-semester2'
      and note.version = '2.1.0'
      and judgment ->> 'id' = note.judgment_id
      and choice ->> 'id' = note.choice_id
      and (choice ->> 'correct')::boolean
  ),
  0::bigint,
  'no correct choice receives a teacher distractor note'
);

select lives_ok(
  $$select public.assert_distractor_note_coverage(
      'grade3-semester2', '2.1.0'
    )$$,
  'v2.1.0 exact note coverage passes'
);

-- 1.0.0 은 이미 배정 이력이 걸린 발행본이다. 2.1.0 발행이 이 행을
-- 건드리지 않는다는 것이 이 마이그레이션의 안전 조건이다.
select results_eq(
  $$select
      status::text,
      jsonb_array_length(content -> 'manifest' -> 'units'),
      jsonb_array_length(content -> 'judgments')
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '1.0.0'$$,
  $$values ('published'::text, 6, 12)$$,
  'the immutable v1.0.0 publication remains unchanged'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade3-semester2' and version = '1.0.0'
  ),
  0::bigint,
  'no teacher note is written under the older v1.0.0 version'
);

-- 2.1.0 은 1.0.0 의 안정 ID 를 모두 이어받아야 한다. 하나라도 빠지면
-- 이전 배정의 응답 기록이 발행본과 짝을 잃는다.
select is(
  (
    select count(*)
    from public.diagnosis_sets old
    cross join jsonb_array_elements(old.content -> 'judgments') old_judgment
    where old.set_key = 'grade3-semester2' and old.version = '1.0.0'
      and not exists (
        select 1
        from public.diagnosis_sets fresh
        cross join jsonb_array_elements(fresh.content -> 'judgments') new_judgment
        where fresh.set_key = 'grade3-semester2' and fresh.version = '2.1.0'
          and new_judgment ->> 'id' = old_judgment ->> 'id'
      )
  ),
  0::bigint,
  'v2.1.0 carries every stable judgment id from v1.0.0'
);

select throws_ok(
  $$update public.diagnosis_distractor_notes
    set teacher_note = 'tampered'
    where set_key = 'grade3-semester2' and version = '2.1.0'
      and judgment_id = 'g3s2-mul-01' and choice_id = '6'$$,
  'P0001',
  'published diagnosis distractor notes are immutable',
  'a published v2.1.0 teacher note cannot be updated'
);

select throws_ok(
  $$delete from public.diagnosis_distractor_notes
    where set_key = 'grade3-semester2' and version = '2.1.0'
      and judgment_id = 'g3s2-mul-01' and choice_id = '6'$$,
  'P0001',
  'published diagnosis distractor notes are immutable',
  'a published v2.1.0 teacher note cannot be deleted'
);

insert into public.diagnosis_distractor_notes (
  set_key, version, judgment_id, choice_id, signal_ids,
  misconception_key, misconception_title, teacher_note
) values (
  'grade3-semester2', '2.1.0', 'extra-judgment', 'extra-choice',
  array['multiplication.place-value-loss'], 'extra-probe', '추가 검사', '추가 검사 노트'
);

select throws_ok(
  $$select public.assert_distractor_note_coverage(
      'grade3-semester2', '2.1.0'
    )$$,
  'P0001',
  'distractor note count mismatch: expected 128, found 129',
  'an extra teacher note fails closed'
);

select * from finish();
rollback;
