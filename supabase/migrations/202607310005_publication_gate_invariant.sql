-- Rollback:
-- drop trigger if exists diagnosis_sets_zz_publication_gate_guard
--   on public.diagnosis_sets;
-- drop function if exists public.assert_diagnosis_set_publication_gate();

create or replace function public.assert_diagnosis_set_publication_gate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  gate jsonb;
begin
  if new.status <> 'published' then
    return new;
  end if;

  gate := new.publication_gate;

  -- Preserve the older attributed-publication check constraint's stable error
  -- while closing the unattributed direct-insert path it did not cover.
  if gate is null then
    if new.published_by is not null then
      return new;
    end if;
    raise exception 'publication gate attestation required';
  end if;

  if jsonb_typeof(gate) <> 'object'
    or coalesce(gate ->> 'gate', '') <> 'diagnostic-integrity'
    or char_length(trim(coalesce(gate ->> 'gateVersion', ''))) = 0
    or coalesce(gate ->> 'policy', '') not in ('enforce', 'warn')
    or jsonb_typeof(gate -> 'enforced') is distinct from 'boolean'
    or jsonb_typeof(gate -> 'valid') is distinct from 'boolean'
    or jsonb_typeof(gate -> 'errorCount') is distinct from 'number'
    or jsonb_typeof(gate -> 'warningCount') is distinct from 'number' then
    raise exception 'publication gate attestation required';
  end if;

  if gate ->> 'setKey' <> new.set_key
    or gate ->> 'targetVersion' <> new.version then
    raise exception 'publication gate scope mismatch';
  end if;

  if ((gate ->> 'policy') = 'enforce') is distinct from
      ((gate ->> 'enforced')::boolean) then
    raise exception 'publication gate enforcement mismatch';
  end if;

  if not (gate ->> 'valid')::boolean
    or (gate ->> 'errorCount')::numeric <> 0 then
    raise exception 'publication gate rejected content';
  end if;

  if (gate ->> 'errorCount')::numeric < 0
    or (gate ->> 'warningCount')::numeric < 0 then
    raise exception 'publication gate attestation required';
  end if;

  return new;
end;
$$;

create trigger diagnosis_sets_zz_publication_gate_guard
before insert or update on public.diagnosis_sets
for each row execute function public.assert_diagnosis_set_publication_gate();

comment on function public.assert_diagnosis_set_publication_gate() is
  'published 진단 세트가 정확한 세트·버전 범위의 유효한 진단 무결성 gate를 보존하도록 강제한다.';
