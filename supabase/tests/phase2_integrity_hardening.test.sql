begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, is_anonymous,
  invited_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'integrity-teacher@example.test', 'x', now(), false, now(), '{}', '{}', now(), now()),
  ('11000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', null, 'x', now(), true, null, '{}', '{}', now(), now()),
  ('11000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'integrity-owner@example.test', 'x', now(), false, now(), '{}', '{}', now(), now()),
  ('11000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'integrity-other@example.test', 'x', now(), false, now(), '{}', '{}', now(), now()),
  ('11000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'integrity-reviewer@example.test', 'x', now(), false, now(), '{}', '{}', now(), now());

insert into public.content_team_members (user_id, role) values
  ('11000000-0000-0000-0000-000000000003', 'author'),
  ('11000000-0000-0000-0000-000000000004', 'author'),
  ('11000000-0000-0000-0000-000000000005', 'reviewer');

insert into public.classes (
  id, teacher_id, name, grade, semester, join_code_lookup, join_code_hash
) values (
  '12000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '무결성 테스트반', 3, 2, 'integrity-test-lookup', 'integrity-test-hash'
);

insert into public.students (id, class_id, roster_key, join_secret_hash)
values ('13000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', '1', extensions.crypt('SAFE27', extensions.gen_salt('bf')));

insert into public.assignments (
  id, class_id, diagnosis_set_id, diagnosis_set_version, unit_id, status, opens_at, created_by
)
select
  '14000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  id, version, 'multiplication', 'active', now() - interval '1 minute',
  '11000000-0000-0000-0000-000000000001'
from public.diagnosis_sets
where set_key = 'grade3-semester2' and version = '1.0.0';

select is(
  (select checksum from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'),
  'c7fb34ecbaadc47a3d64bd8c525b02313dd8eecc74e57a796cf042c77e962a69',
  'database and package reproduce the canonical baseline checksum'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000002', true);
select is(
  (select count(*)::integer from public.diagnosis_sets),
  0,
  'an anonymous student cannot read unassigned published content'
);

set local role postgres;
insert into public.student_access_grants (auth_uid, class_id, student_id)
values (
  '11000000-0000-0000-0000-000000000002',
  '12000000-0000-0000-0000-000000000001',
  '13000000-0000-0000-0000-000000000001'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000002', true);
select is(
  (select count(*)::integer from public.diagnosis_sets),
  1,
  'a student reads only the exact diagnosis set assigned to their class'
);

set local role postgres;
select throws_ok(
  $$with source as (
      select jsonb_set(content #- '{judgments,11}', '{manifest,version}', '"1.0.99"'::jsonb, true) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'grade3-semester2', '1.0.99', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'published stable IDs cannot be removed',
  'database validation rejects removing a published stable ID'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-language-probe"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{judgments,0,prompt}', '"진단 결과를 보고 정답을 고르세요."'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-language-probe', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'judgment validation failed',
  'database validation rejects diagnostic language in student copy'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-empty-prompt"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{judgments,0,prompt}', '""'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-empty-prompt', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'judgment runtime schema is invalid',
  'database runtime schema rejects an empty student prompt'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-bad-visual"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{judgments,0,visual}', '{"kind":"measurement","amount":-1,"unit":"cm"}'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-bad-visual', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'judgment runtime schema is invalid',
  'database runtime schema rejects a malformed visual'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          content #- '{manifest,curriculum}',
          '{manifest,id}', '"phase2-missing-curriculum"'::jsonb, true
        ),
        '{manifest,version}', '"1.0.0"'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-missing-curriculum', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'diagnosis manifest schema is invalid',
  'database runtime schema rejects a missing curriculum'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-missing-unit"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{judgments,8,visual}', '{"kind":"measurement","amount":1}'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-missing-unit', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'judgment runtime schema is invalid',
  'database runtime schema rejects a measurement without a unit'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-null-unknown"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{judgments,7,visual,unknown}', 'null'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-null-unknown', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'judgment runtime schema is invalid',
  'database runtime schema rejects an explicit null optional enum'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-missing-prerequisites"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ) #- '{learnerStages,0,prerequisiteStageIds}',
        '{manifest,status}', '"published"'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-missing-prerequisites', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'learner stage schema is invalid',
  'database rejects a stage without prerequisiteStageIds'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(content, '{manifest,id}', '"phase2-missing-correct"'::jsonb, true),
        '{manifest,version}', '"1.0.0"'::jsonb, true
      ) #- '{judgments,0,choices,1,correct}' as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-missing-correct', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'judgment runtime schema is invalid',
  'database rejects a choice without a correct boolean'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(content, '{manifest,id}', '"phase2-missing-visual-label"'::jsonb, true),
        '{manifest,version}', '"1.0.0"'::jsonb, true
      ) #- '{judgments,0,visual,label}' as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-missing-visual-label', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'judgment runtime schema is invalid',
  'database rejects an array visual without a label field'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-unknown-field"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{judgments,0,choices,0,debug}', 'true'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-unknown-field', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'diagnosis content contains unknown fields',
  'database rejects fields that the student parser would otherwise strip'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-padded-id"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{judgments,0,choices,0,id}', '" padded-choice-id "'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-padded-id', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'diagnosis IDs must be trimmed non-empty strings',
  'database rejects IDs that strict student parsing would reject'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-tab-id"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{judgments,0,choices,0,id}', to_jsonb(E'\tpadded-tab-id'::text), true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-tab-id', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'diagnosis IDs must be trimmed non-empty strings',
  'database rejects tab-padded IDs like JavaScript trim'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-nbsp-id"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{judgments,0,choices,0,id}', to_jsonb(U&'\00A0padded-nbsp-id'::text), true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-nbsp-id', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'diagnosis IDs must be trimmed non-empty strings',
  'database rejects NBSP-padded IDs like JavaScript trim'
);

select throws_ok(
  $$with source as (
      select jsonb_set(
        jsonb_set(
          jsonb_set(content, '{manifest,id}', '"phase2-anchor-mismatch"'::jsonb, true),
          '{manifest,version}', '"1.0.0"'::jsonb, true
        ),
        '{manifest,grade}', '4'::jsonb, true
      ) as content
      from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
    )
    insert into public.diagnosis_sets (set_key, version, checksum, status, manifest, content, published_at)
    select 'phase2-anchor-mismatch', '1.0.0', 'fake', 'published', content -> 'manifest', content, now() from source$$,
  'P0001',
  'curriculum anchor grade or semester mismatch',
  'database rejects curriculum anchors from another grade or semester'
);

with source as (
  select jsonb_set(
    jsonb_set(content, '{manifest,id}', '"phase2-checksum-probe"'::jsonb, true),
    '{manifest,version}', '"1.0.0"'::jsonb, true
  ) as content
  from public.diagnosis_sets where set_key = 'grade3-semester2' and version = '1.0.0'
)
insert into public.diagnosis_sets (
  set_key, version, checksum, status, manifest, content, published_at,
  publication_gate
)
select
  'phase2-checksum-probe',
  '1.0.0',
  'fake',
  'published',
  content -> 'manifest',
  content,
  now(),
  jsonb_build_object(
    'gate', 'diagnostic-integrity',
    'gateVersion', 'phase2-test-v1',
    'setKey', 'phase2-checksum-probe',
    'targetVersion', '1.0.0',
    'policy', 'warn',
    'enforced', false,
    'valid', true,
    'errorCount', 0,
    'warningCount', 0
  )
from source;

select ok(
  (select checksum <> 'fake' and checksum = content #>> '{manifest,checksum}'
   from public.diagnosis_sets where set_key = 'phase2-checksum-probe'),
  'database calculates and stamps checksum instead of trusting the client'
);

insert into public.content_drafts (id, set_key, owner_id, base_diagnosis_set_id, content)
select
  '15000000-0000-0000-0000-000000000001',
  'grade3-semester2',
  '11000000-0000-0000-0000-000000000003',
  id,
  jsonb_set(content, '{manifest,status}', '"draft"'::jsonb, true)
from public.diagnosis_sets
where set_key = 'grade3-semester2' and version = '1.0.0';

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000004', true);
select is(
  (select count(*)::integer from public.content_drafts where id = '15000000-0000-0000-0000-000000000001'),
  0,
  'an unrelated author cannot read another author draft'
);

set local role postgres;
insert into public.content_review_requests (
  id, draft_id, draft_revision, author_id, reviewer_id, status
) values (
  '16000000-0000-0000-0000-000000000001',
  '15000000-0000-0000-0000-000000000001',
  1,
  '11000000-0000-0000-0000-000000000003',
  '11000000-0000-0000-0000-000000000005',
  'pending'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000005', true);
select is(
  (select count(*)::integer from public.content_drafts where id = '15000000-0000-0000-0000-000000000001'),
  1,
  'the assigned reviewer can read the submitted draft'
);

select * from finish();
rollback;
