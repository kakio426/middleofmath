begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  invited_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'phase2-author@example.test', 'x', now(), now(), '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'phase2-reviewer@example.test', 'x', now(), now(), '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'phase2-teacher@example.test', 'x', now(), now(), '{}', '{}', now(), now());

insert into public.content_team_members (user_id, role) values
  ('10000000-0000-0000-0000-000000000001', 'author'),
  ('10000000-0000-0000-0000-000000000002', 'reviewer');

set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true); end $$;

insert into public.content_drafts (id, set_key, owner_id, base_diagnosis_set_id, content)
select
  '20000000-0000-0000-0000-000000000001',
  'phase2-pgtap-content',
  '10000000-0000-0000-0000-000000000001',
  null,
  jsonb_set(
    jsonb_set(content, '{manifest,id}', '"phase2-pgtap-content"'),
    '{manifest,status}',
    '"draft"'
  )
from public.diagnosis_sets
where set_key = 'grade3-semester2' and version = '1.0.0';

select is(
  (select revision from public.save_content_draft(
    '20000000-0000-0000-0000-000000000001',
    1,
    (select content from public.content_drafts where id = '20000000-0000-0000-0000-000000000001')
  )),
  2,
  'autosave increments an optimistic revision'
);

select throws_ok(
  $$select public.save_content_draft(
    '20000000-0000-0000-0000-000000000001',
    1,
    (select content from public.content_drafts where id = '20000000-0000-0000-0000-000000000001')
  )$$,
  'P0001',
  'revision conflict',
  'stale autosave is rejected'
);

select is(
  (select status::text from public.request_content_review(
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    2,
    '10000000-0000-0000-0000-000000000002'
  )),
  'pending',
  'author submits the exact saved revision'
);

do $$ begin perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true); end $$;

select is(
  (select status::text from public.decide_content_review(
    '30000000-0000-0000-0000-000000000001', 2, 'approve'
  )),
  'approved',
  'a different reviewer approves the revision'
);

do $$ begin perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true); end $$;

create temporary table phase2_published as
select * from public.publish_diagnosis_set(
  '20000000-0000-0000-0000-000000000001',
  2,
  '1.0.0',
  'pgTAP workflow check',
  '{
    "valid": true,
    "issues": [{
      "code": "DI_GATE_NOT_ENFORCED",
      "path": "/",
      "message": "legacy lineage",
      "severity": "warning"
    }],
    "gates": [{
      "gate": "diagnostic-integrity",
      "gateVersion": "gate-1.0.0",
      "policy": "warn",
      "enforced": false,
      "setKey": "phase2-pgtap-content",
      "targetVersion": "1.0.0",
      "blueprintRevision": null,
      "valid": true,
      "errorCount": 0,
      "warningCount": 1
    }]
  }'
);

select ok(
  (select reviewed_by <> published_by from phase2_published),
  'publication records independent reviewer and publisher'
);
select is(
  (select jsonb_array_length(content -> 'judgments') from phase2_published),
  12,
  'publication stores full DiagnosisSet content'
);
select ok(
  (select content #>> '{manifest,checksum}' = checksum from phase2_published),
  'published content and row checksum agree'
);

set local role postgres;
select throws_ok(
  $$update public.diagnosis_sets set content = '{}' where set_key = 'phase2-pgtap-content' and version = '1.0.0'$$,
  'P0001',
  'published diagnosis sets are immutable',
  'published content cannot be mutated'
);

select * from finish();
rollback;
