begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select is(
  (
    select count(*)
    from public.diagnosis_sets
    where set_key = 'grade3-semester2'
      and version = '2.2.0'
      and status = 'published'
  ),
  1::bigint,
  'grade3 semester2 v2.2.0 is published exactly once'
);

select results_eq(
  $$select
      jsonb_array_length(content -> 'manifest' -> 'units'),
      jsonb_array_length(content -> 'learnerStages'),
      jsonb_array_length(content -> 'judgments')
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '2.2.0'$$,
  $$values (6, 32, 64)$$,
  'v2.2.0 publishes six units, 32 stages, and 64 judgments'
);

select results_eq(
  $$select
      checksum,
      checksum = content #>> '{manifest,checksum}'
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '2.2.0'$$,
  $$values (
      '0a07f0c677fdfcd396eddf07e612c6037fa2f6d94c8df6b97e3fa6ece30e8422'::text,
      true
    )$$,
  'the v2.2.0 database checksum is pinned and synchronized into the manifest'
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
    where set_key = 'grade3-semester2' and version = '2.2.0'
  ),
  'the v2.2.0 gate is scoped to the exact content and pinned upstream map'
);

select is(
  (
    select count(*)
    from public.diagnosis_distractor_notes
    where set_key = 'grade3-semester2' and version = '2.2.0'
  ),
  128::bigint,
  'every v2.2.0 distractor has one teacher note'
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
      and note.version = '2.2.0'
      and judgment ->> 'id' = note.judgment_id
      and choice ->> 'id' = note.choice_id
      and (choice ->> 'correct')::boolean
  ),
  0::bigint,
  'no correct choice receives a teacher distractor note'
);

select lives_ok(
  $$select public.assert_distractor_note_coverage(
      'grade3-semester2', '2.2.0'
    )$$,
  'v2.2.0 exact note coverage passes'
);

-- 1.0.0 은 학생에게 배정된 운영본이고 2.1.0 은 이미 발행된 검수본이다.
-- 2.2.0 발행이 두 행을 건드리지 않는다는 것이 이 마이그레이션의 안전 조건이다.
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

select results_eq(
  $$select
      status::text,
      checksum,
      jsonb_array_length(content -> 'judgments')
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '2.1.0'$$,
  $$values (
      'published'::text,
      '566762c8491f7c0365d992ed8187cf748bc03b6209f43328a0a4cac987f623ae'::text,
      64
    )$$,
  'the immutable v2.1.0 publication remains unchanged'
);

-- 2.2.0 은 2.1.0 의 안정 문항 ID 를 모두 이어받아야 한다. 하나라도 빠지면
-- 2.1.0 배정의 응답 기록이 발행본과 짝을 잃는다.
select is(
  (
    select count(*)
    from public.diagnosis_sets old
    cross join jsonb_array_elements(old.content -> 'judgments') old_judgment
    where old.set_key = 'grade3-semester2' and old.version = '2.1.0'
      and not exists (
        select 1
        from public.diagnosis_sets fresh
        cross join jsonb_array_elements(fresh.content -> 'judgments') new_judgment
        where fresh.set_key = 'grade3-semester2' and fresh.version = '2.2.0'
          and new_judgment ->> 'id' = old_judgment ->> 'id'
      )
  ),
  0::bigint,
  'v2.2.0 carries every stable judgment id from v2.1.0'
);

-- 내용 검수에서 확정한 수정이 발행본에 실제로 들어갔는지 확인한다.
-- 앞의 두 항목은 지문이 정답을 미리 말하던 것을 없앤 자리다.
select results_eq(
  $$select
      (judgment -> 'context') is null,
      judgment ->> 'context',
      judgment -> 'visual' ->> 'kind',
      (
        select array_agg(choice ->> 'id' order by choice ->> 'id')
        from jsonb_array_elements(judgment -> 'choices') choice
      )
    from public.diagnosis_sets diagnosis
    cross join jsonb_array_elements(diagnosis.content -> 'judgments') judgment
    where diagnosis.set_key = 'grade3-semester2'
      and diagnosis.version = '2.2.0'
      and judgment ->> 'id' in (
        'g3s2-div-04', 'g3s2-div-06', 'g3s2-graph-06', 'g3s2-circle-08'
      )
    order by judgment ->> 'id'$$,
  $$values
      (true, null::text, 'circle'::text, array['10cm', '5cm', 'opening-varies']),
      (true, null::text, 'none'::text, array['21', '3-boxes', '6']),
      (
        false,
        '쿠키 35개를 접시 5개에 똑같이 나누어 놓았어요.'::text,
        'division-groups'::text,
        array['35-div-5', '35-div-5-wrong', '35-minus-5']
      ),
      (
        false,
        '동물 그림을 종류별로 나누어 세어 보세요.'::text,
        'item-collection'::text,
        array['2-cats-counted', '4-rabbits', '7-all-animals']
      )$$,
  'the reviewed content fixes reached the published v2.2.0 payload'
);

select throws_ok(
  $$update public.diagnosis_distractor_notes
    set teacher_note = 'tampered'
    where set_key = 'grade3-semester2' and version = '2.2.0'
      and judgment_id = 'g3s2-mul-01' and choice_id = '6'$$,
  'P0001',
  'published diagnosis distractor notes are immutable',
  'a published v2.2.0 teacher note cannot be updated'
);

select throws_ok(
  $$delete from public.diagnosis_distractor_notes
    where set_key = 'grade3-semester2' and version = '2.2.0'
      and judgment_id = 'g3s2-mul-01' and choice_id = '6'$$,
  'P0001',
  'published diagnosis distractor notes are immutable',
  'a published v2.2.0 teacher note cannot be deleted'
);

insert into public.diagnosis_distractor_notes (
  set_key, version, judgment_id, choice_id, signal_ids,
  misconception_key, misconception_title, teacher_note
) values (
  'grade3-semester2', '2.2.0', 'extra-judgment', 'extra-choice',
  array['multiplication.place-value-loss'], 'extra-probe', '추가 검사', '추가 검사 노트'
);

select throws_ok(
  $$select public.assert_distractor_note_coverage(
      'grade3-semester2', '2.2.0'
    )$$,
  'P0001',
  'distractor note count mismatch: expected 128, found 129',
  'an extra teacher note fails closed'
);

select * from finish();
rollback;
