begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

create function pg_temp.clone_published_content(
  p_set_key text,
  p_version text default '1.0.0'
)
returns jsonb
language sql
stable
as $$
  select jsonb_set(
    jsonb_set(content, '{manifest,id}', to_jsonb(p_set_key), true),
    '{manifest,version}', to_jsonb(p_version), true
  )
  from public.diagnosis_sets
  where set_key = 'grade3-semester2' and version = '1.0.0'
$$;

create function pg_temp.test_publication_gate(
  p_set_key text,
  p_version text default '1.0.0',
  p_policy text default 'warn',
  p_enforced boolean default false,
  p_valid boolean default true,
  p_error_count integer default 0
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'gate', 'diagnostic-integrity',
    'gateVersion', 'test-v1',
    'setKey', p_set_key,
    'targetVersion', p_version,
    'policy', p_policy,
    'enforced', p_enforced,
    'valid', p_valid,
    'errorCount', p_error_count,
    'warningCount', 0
  )
$$;

select ok(
  (
    select publication_gate ->> 'setKey' = set_key
      and publication_gate ->> 'targetVersion' = version
      and (publication_gate ->> 'valid')::boolean
      and (publication_gate ->> 'errorCount')::integer = 0
    from public.diagnosis_sets
    where set_key = 'grade4-semester1' and version = '1.3.0'
  ),
  'the current grade 4 publication satisfies the database invariant'
);

select ok(
  (
    select publication_gate ->> 'setKey' = set_key
      and publication_gate ->> 'targetVersion' = version
      and (publication_gate ->> 'valid')::boolean
      and (publication_gate ->> 'errorCount')::integer = 0
    from public.diagnosis_sets
    where set_key = 'grade3-semester2' and version = '1.0.0'
  ),
  'the legacy grade 3 publication has a scoped backfilled gate'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.diagnosis_sets'::regclass
      and conname = 'diagnosis_sets_published_gate_required'
      and convalidated
  ),
  'the database constrains every published row to keep a gate'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at
    )
    select
      'gate-missing-probe', '1.0.0', 'fake', 'published',
      content -> 'manifest', content, now()
    from (
      select pg_temp.clone_published_content('gate-missing-probe') as content
    ) source$$,
  'P0001',
  'publication gate attestation required',
  'an unattributed direct publication cannot omit the gate'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at,
      publication_gate
    )
    select
      'gate-missing-set-key', '1.0.0', 'fake', 'published',
      content -> 'manifest', content, now(),
      pg_temp.test_publication_gate('gate-missing-set-key') - 'setKey'
    from (
      select pg_temp.clone_published_content('gate-missing-set-key') as content
    ) source$$,
  'P0001',
  'publication gate attestation required',
  'a direct publication cannot omit the gate set key'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at,
      publication_gate
    )
    select
      'gate-missing-target-version', '1.0.0', 'fake', 'published',
      content -> 'manifest', content, now(),
      pg_temp.test_publication_gate('gate-missing-target-version')
        - 'targetVersion'
    from (
      select pg_temp.clone_published_content(
        'gate-missing-target-version'
      ) as content
    ) source$$,
  'P0001',
  'publication gate attestation required',
  'a direct publication cannot omit the gate target version'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at,
      publication_gate
    )
    select
      'gate-set-scope-probe', '1.0.0', 'fake', 'published',
      content -> 'manifest', content, now(),
      pg_temp.test_publication_gate('another-set')
    from (
      select pg_temp.clone_published_content('gate-set-scope-probe') as content
    ) source$$,
  'P0001',
  'publication gate scope mismatch',
  'the gate set key must match the published row'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at,
      publication_gate
    )
    select
      'gate-version-scope-probe', '1.0.0', 'fake', 'published',
      content -> 'manifest', content, now(),
      pg_temp.test_publication_gate('gate-version-scope-probe', '2.0.0')
    from (
      select pg_temp.clone_published_content('gate-version-scope-probe') as content
    ) source$$,
  'P0001',
  'publication gate scope mismatch',
  'the gate target version must match the published row'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at,
      publication_gate
    )
    select
      'gate-policy-probe', '1.0.0', 'fake', 'published',
      content -> 'manifest', content, now(),
      pg_temp.test_publication_gate(
        'gate-policy-probe', '1.0.0', 'enforce', false
      )
    from (
      select pg_temp.clone_published_content('gate-policy-probe') as content
    ) source$$,
  'P0001',
  'publication gate enforcement mismatch',
  'the policy and enforced flag cannot disagree'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at,
      publication_gate
    )
    select
      'gate-invalid-probe', '1.0.0', 'fake', 'published',
      content -> 'manifest', content, now(),
      pg_temp.test_publication_gate(
        'gate-invalid-probe', '1.0.0', 'enforce', true, false
      )
    from (
      select pg_temp.clone_published_content('gate-invalid-probe') as content
    ) source$$,
  'P0001',
  'publication gate rejected content',
  'an invalid enforced gate cannot publish content'
);

select throws_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at,
      publication_gate
    )
    select
      'gate-error-probe', '1.0.0', 'fake', 'published',
      content -> 'manifest', content, now(),
      pg_temp.test_publication_gate(
        'gate-error-probe', '1.0.0', 'warn', false, true, 1
      )
    from (
      select pg_temp.clone_published_content('gate-error-probe') as content
    ) source$$,
  'P0001',
  'publication gate rejected content',
  'a gate with an error cannot publish content'
);

select lives_ok(
  $$insert into public.diagnosis_sets (
      set_key, version, checksum, status, manifest, content, published_at,
      publication_gate
    )
    select
      'gate-valid-probe', '1.0.0', 'fake', 'published',
      content -> 'manifest', content, now(),
      pg_temp.test_publication_gate('gate-valid-probe')
    from (
      select pg_temp.clone_published_content('gate-valid-probe') as content
    ) source$$,
  'a scoped, valid warn gate may publish content'
);

select ok(
  (
    select checksum <> 'fake'
      and checksum = content #>> '{manifest,checksum}'
      and publication_gate ->> 'setKey' = 'gate-valid-probe'
    from public.diagnosis_sets
    where set_key = 'gate-valid-probe' and version = '1.0.0'
  ),
  'the checksum trigger and publication gate both survive direct publication'
);

select * from finish();
rollback;
