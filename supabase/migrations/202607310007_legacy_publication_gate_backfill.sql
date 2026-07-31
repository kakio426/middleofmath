-- Rollback:
-- alter table public.diagnosis_sets
--   drop constraint if exists diagnosis_sets_published_gate_required;
-- The backfilled attestation is intentionally retained because published rows
-- are immutable operating records.

alter table public.diagnosis_sets
  disable trigger diagnosis_sets_immutable;

update public.diagnosis_sets
set publication_gate = jsonb_build_object(
  'gate', 'diagnostic-integrity',
  'gateVersion', 'legacy-backfill-v1',
  'setKey', set_key,
  'targetVersion', version,
  'policy', 'warn',
  'enforced', false,
  'valid', true,
  'errorCount', 0,
  'warningCount', 1,
  'blueprintRevision', null,
  'backfillReason', 'published before the publication gate invariant'
)
where status = 'published'
  and publication_gate is null;

alter table public.diagnosis_sets
  enable trigger diagnosis_sets_immutable;

alter table public.diagnosis_sets
  add constraint diagnosis_sets_published_gate_required
  check (status <> 'published' or publication_gate is not null);

comment on constraint diagnosis_sets_published_gate_required
  on public.diagnosis_sets is
  '모든 기존·신규 published 진단 세트는 세트와 버전에 고정된 publication gate를 가져야 한다.';
