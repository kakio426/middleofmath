begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select is(
  (
    select count(*)
    from public.curriculum_anchors
    where active
      and grade = 3
      and semester = 2
      and anchor_key in (
        '[4수01-04]', '[4수01-05]', '[4수01-06]', '[4수01-08]',
        '[4수01-09]', '[4수01-10]', '[4수01-11]', '[4수03-06]',
        '[4수03-07]', '[4수03-17]', '[4수03-18]', '[4수03-19]',
        '[4수03-20]', '[4수03-21]', '[4수03-22]', '[4수03-23]',
        '[4수04-01]'
      )
  ),
  17::bigint,
  'all 17 grade 3 semester 2 anchors are approved and active'
);

select is(
  (select label from public.curriculum_anchors where anchor_key = '[4수03-17]'),
  '들이의 단위를 알고 들이를 어림하고 재기',
  'the reviewed capacity anchor label is registered'
);

select is(
  (select label from public.curriculum_anchors where anchor_key = '[4수03-20]'),
  '무게의 단위를 알고 무게를 어림하고 재기',
  'the reviewed weight anchor label is registered'
);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  invited_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('41000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'gate-author@example.test', 'x', now(), now(), '{}', '{}', now(), now()),
  ('41000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'gate-reviewer@example.test', 'x', now(), now(), '{}', '{}', now(), now());

insert into public.content_team_members (user_id, role) values
  ('41000000-0000-0000-0000-000000000001', 'author'),
  ('41000000-0000-0000-0000-000000000002', 'reviewer');

set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-0000-0000-000000000001', true);

insert into public.content_drafts (
  id, set_key, owner_id, base_diagnosis_set_id, content
)
select
  '42000000-0000-0000-0000-000000000001',
  'phase0-gate-content',
  '41000000-0000-0000-0000-000000000001',
  null,
  jsonb_set(
    jsonb_set(content, '{manifest,id}', '"phase0-gate-content"'),
    '{manifest,status}',
    '"draft"'
  )
from public.diagnosis_sets
where set_key = 'grade3-semester2' and version = '1.0.0';

select * from public.request_content_review(
  '43000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000001',
  1,
  '41000000-0000-0000-0000-000000000002'
);

select set_config('request.jwt.claim.sub', '41000000-0000-0000-0000-000000000002', true);
select * from public.decide_content_review(
  '43000000-0000-0000-0000-000000000001',
  1,
  'approve'
);

select set_config('request.jwt.claim.sub', '41000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$select public.publish_diagnosis_set(
    '42000000-0000-0000-0000-000000000001', 1, '1.0.0', 'missing gate',
    '{"valid":true,"issues":[]}'
  )$$,
  'P0001',
  'publication gate attestation required',
  'legacy validation payload cannot bypass the publication gate'
);

select throws_ok(
  $$select public.publish_diagnosis_set(
    '42000000-0000-0000-0000-000000000001', 1, '1.0.0', 'rejected gate',
    '{"valid":true,"issues":[],"gates":[{
      "gate":"diagnostic-integrity","gateVersion":"gate-1.0.0",
      "policy":"enforce","enforced":true,
      "setKey":"phase0-gate-content","targetVersion":"1.0.0",
      "blueprintRevision":"test-1","valid":false,
      "errorCount":1,"warningCount":0
    }]}'
  )$$,
  'P0001',
  'publication gate rejected content',
  'an enforced failing attestation is rejected'
);

select throws_ok(
  $$select public.publish_diagnosis_set(
    '42000000-0000-0000-0000-000000000001', 1, '1.0.0', 'missing set scope',
    '{"valid":true,"issues":[],"gates":[{
      "gate":"diagnostic-integrity","gateVersion":"gate-1.0.0",
      "policy":"warn","enforced":false,
      "targetVersion":"1.0.0",
      "blueprintRevision":null,"valid":true,
      "errorCount":0,"warningCount":1
    }]}'
  )$$,
  'P0001',
  'publication gate attestation required',
  'the publication RPC requires a gate set key'
);

select throws_ok(
  $$select public.publish_diagnosis_set(
    '42000000-0000-0000-0000-000000000001', 1, '1.0.0', 'missing version scope',
    '{"valid":true,"issues":[],"gates":[{
      "gate":"diagnostic-integrity","gateVersion":"gate-1.0.0",
      "policy":"warn","enforced":false,
      "setKey":"phase0-gate-content",
      "blueprintRevision":null,"valid":true,
      "errorCount":0,"warningCount":1
    }]}'
  )$$,
  'P0001',
  'publication gate attestation required',
  'the publication RPC requires a gate target version'
);

select throws_ok(
  $$select public.publish_diagnosis_set(
    '42000000-0000-0000-0000-000000000001', 1, '1.0.0', 'wrong set',
    '{"valid":true,"issues":[],"gates":[{
      "gate":"diagnostic-integrity","gateVersion":"gate-1.0.0",
      "policy":"warn","enforced":false,
      "setKey":"other-content","targetVersion":"1.0.0",
      "blueprintRevision":null,"valid":true,
      "errorCount":0,"warningCount":1
    }]}'
  )$$,
  'P0001',
  'publication gate scope mismatch',
  'the attested set key must match the draft'
);

select throws_ok(
  $$select public.publish_diagnosis_set(
    '42000000-0000-0000-0000-000000000001', 1, '1.0.0', 'wrong version',
    '{"valid":true,"issues":[],"gates":[{
      "gate":"diagnostic-integrity","gateVersion":"gate-1.0.0",
      "policy":"warn","enforced":false,
      "setKey":"phase0-gate-content","targetVersion":"1.0.1",
      "blueprintRevision":null,"valid":true,
      "errorCount":0,"warningCount":1
    }]}'
  )$$,
  'P0001',
  'publication gate scope mismatch',
  'the attested target version must match publication'
);

select throws_ok(
  $$select public.publish_diagnosis_set(
    '42000000-0000-0000-0000-000000000001', 1, '1.0.0', 'wrong policy',
    '{"valid":true,"issues":[],"gates":[{
      "gate":"diagnostic-integrity","gateVersion":"gate-1.0.0",
      "policy":"enforce","enforced":false,
      "setKey":"phase0-gate-content","targetVersion":"1.0.0",
      "blueprintRevision":null,"valid":true,
      "errorCount":0,"warningCount":1
    }]}'
  )$$,
  'P0001',
  'publication gate enforcement mismatch',
  'a non-enforced attestation must use warn policy'
);

create temporary table phase0_gate_published as
select * from public.publish_diagnosis_set(
  '42000000-0000-0000-0000-000000000001',
  1,
  '1.0.0',
  'valid gate attestation',
  '{
    "valid":true,
    "issues":[{
      "code":"DI_GATE_NOT_ENFORCED","path":"/",
      "message":"legacy lineage","severity":"warning"
    }],
    "gates":[{
      "gate":"diagnostic-integrity","gateVersion":"gate-1.0.0",
      "policy":"warn","enforced":false,
      "setKey":"phase0-gate-content","targetVersion":"1.0.0",
      "blueprintRevision":null,"valid":true,
      "errorCount":0,"warningCount":1,
      "crosswalkRevision":"crosswalk-2026-07-29.1",
      "crosswalkDigest":"sha256:e39d1284f97d38b4946c1787665504385f71aeb1d9e5e03f5ee9ff2d1ffa90ab",
      "upstreamCommit":"3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c",
      "upstreamTaxonomyVersion":"kr-full-depth-v0.4",
      "upstreamOntologyVersion":"0.3.0-p3"
    }]
  }'
);

select ok(
  (
    select publication_gate is not null
      and publication_gate ->> 'gate' = 'diagnostic-integrity'
      and content #>> '{manifest,checksum}' = checksum
    from phase0_gate_published
  ),
  'the gate attestation survives publication and checksum validation'
);

select ok(
  (
    select publication_gate ->> 'crosswalkRevision' = 'crosswalk-2026-07-29.1'
      and publication_gate ->> 'upstreamCommit' = '3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c'
      and publication_gate ->> 'upstreamTaxonomyVersion' = 'kr-full-depth-v0.4'
      and publication_gate ->> 'upstreamOntologyVersion' = '0.3.0-p3'
    from phase0_gate_published
  ),
  'the crosswalk provenance survives inside the single publication gate'
);

set local role postgres;

select throws_ok(
  $$update public.diagnosis_sets
    set publication_gate = null
    where set_key = 'phase0-gate-content' and version = '1.0.0'$$,
  'P0001',
  'published diagnosis sets are immutable',
  'the publication gate attestation is immutable'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at,
      published_by, reviewed_by
    )
    select
      'phase0-direct-content',
      '1.0.0',
      'placeholder',
      'published',
      jsonb_set(manifest, '{id}', '"phase0-direct-content"'),
      jsonb_set(content, '{manifest,id}', '"phase0-direct-content"'),
      now(),
      '41000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000002'
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '1.0.0'$$,
  '23514',
  'new row for relation "diagnosis_sets" violates check constraint "diagnosis_sets_publication_gate_required"',
  'a direct attributed publication also requires an attestation'
);

select * from finish();
rollback;
