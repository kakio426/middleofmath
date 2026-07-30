-- Rollback:
-- 1. Restore publish_diagnosis_set from 202607220002_phase2_content_studio.sql.
-- 2. alter table public.diagnosis_sets
--      drop constraint diagnosis_sets_publication_gate_required;
-- 3. alter table public.diagnosis_sets drop column publication_gate;

alter table public.diagnosis_sets
  add column publication_gate jsonb;

alter table public.diagnosis_sets
  add constraint diagnosis_sets_publication_gate_required
  check (published_by is null or publication_gate is not null);

comment on column public.diagnosis_sets.publication_gate is
  '발행 당시 애플리케이션이 계산한 진단 무결성 게이트 증명. 발행 행과 함께 불변으로 보존한다.';

create or replace function public.publish_diagnosis_set(
  p_draft_id uuid,
  p_expected_revision integer,
  p_version text,
  p_release_notes text,
  p_validation jsonb
)
returns public.diagnosis_sets
language plpgsql
security definer
set search_path = ''
as $$
declare
  draft public.content_drafts%rowtype;
  review public.content_review_requests%rowtype;
  result public.diagnosis_sets%rowtype;
  published_content jsonb;
  content_checksum text;
  base_version text;
  publisher_is_admin boolean;
  gate jsonb;
  gate_entry jsonb;
begin
  if not exists (
    select 1 from public.content_team_members
    where user_id = auth.uid() and role in ('author', 'admin') and active
  ) then raise exception 'active content author required'; end if;
  select * into draft from public.content_drafts where id = p_draft_id for update;
  if draft.id is null then raise exception 'draft not found'; end if;
  if draft.owner_id <> auth.uid() and not exists (
    select 1 from public.content_team_members where user_id = auth.uid() and role = 'admin' and active
  ) then raise exception 'draft owner or admin required'; end if;
  if draft.status <> 'approved' or draft.revision <> p_expected_revision then raise exception 'revision conflict or draft not approved'; end if;
  if p_version !~ '^\d+\.\d+\.\d+$' then raise exception 'semantic version required'; end if;
  if char_length(trim(coalesce(p_release_notes, ''))) = 0 then raise exception 'release notes required'; end if;
  if coalesce((p_validation ->> 'valid')::boolean, false) = false
    or jsonb_typeof(p_validation -> 'issues') <> 'array'
    or exists (select 1 from jsonb_array_elements(p_validation -> 'issues') item where item ->> 'severity' = 'error') then
    raise exception 'content validation failed';
  end if;

  gate := p_validation -> 'gates';
  if jsonb_typeof(gate) is distinct from 'array'
    or jsonb_array_length(gate) <> 1 then
    raise exception 'publication gate attestation required';
  end if;
  gate_entry := gate -> 0;
  if coalesce(gate_entry ->> 'gate', '') <> 'diagnostic-integrity'
    or char_length(trim(coalesce(gate_entry ->> 'gateVersion', ''))) = 0
    or coalesce(gate_entry ->> 'policy', '') not in ('enforce', 'warn')
    or jsonb_typeof(gate_entry -> 'enforced') is distinct from 'boolean'
    or jsonb_typeof(gate_entry -> 'valid') is distinct from 'boolean'
    or jsonb_typeof(gate_entry -> 'errorCount') is distinct from 'number'
    or jsonb_typeof(gate_entry -> 'warningCount') is distinct from 'number' then
    raise exception 'publication gate attestation required';
  end if;
  if gate_entry ->> 'setKey' <> draft.set_key
    or gate_entry ->> 'targetVersion' <> p_version then
    raise exception 'publication gate scope mismatch';
  end if;
  if (gate_entry ->> 'enforced')::boolean
    and not (gate_entry ->> 'valid')::boolean then
    raise exception 'publication gate rejected content';
  end if;
  if not (gate_entry ->> 'enforced')::boolean
    and gate_entry ->> 'policy' <> 'warn' then
    raise exception 'publication gate enforcement mismatch';
  end if;

  select * into review from public.content_review_requests
  where draft_id = draft.id and draft_revision = draft.revision and status = 'approved'
  order by decided_at desc limit 1 for update;
  if review.id is null or review.reviewer_id is null or review.reviewer_id = draft.owner_id then
    raise exception 'independent reviewer approval required';
  end if;
  publisher_is_admin := exists (
    select 1 from public.content_team_members where user_id = auth.uid() and role = 'admin' and active
  );
  if draft.base_diagnosis_set_id is null then
    if exists (select 1 from public.diagnosis_sets where set_key = draft.set_key) or p_version <> '1.0.0' then
      raise exception 'new diagnosis set must start at 1.0.0';
    end if;
  else
    select version into base_version from public.diagnosis_sets where id = draft.base_diagnosis_set_id;
    if base_version is null then raise exception 'base diagnosis set not found'; end if;
    if publisher_is_admin then
      if row(
        split_part(p_version, '.', 1)::integer,
        split_part(p_version, '.', 2)::integer,
        split_part(p_version, '.', 3)::integer
      ) <= row(
        split_part(base_version, '.', 1)::integer,
        split_part(base_version, '.', 2)::integer,
        split_part(base_version, '.', 3)::integer
      ) then raise exception 'new version must be greater than base version'; end if;
    elsif p_version <> concat(
      split_part(base_version, '.', 1), '.',
      split_part(base_version, '.', 2), '.',
      split_part(base_version, '.', 3)::integer + 1
    ) then
      raise exception 'authors may only publish the next patch version';
    end if;
  end if;
  if (draft.content #>> '{manifest,id}') <> draft.set_key then raise exception 'manifest id must match set key'; end if;
  if coalesce((draft.content #>> '{manifest,grade}')::integer, 0) not between 1 and 6 then raise exception 'elementary grade required'; end if;
  if coalesce((draft.content #>> '{manifest,semester}')::integer, 0) not in (1, 2) then raise exception 'semester required'; end if;
  if jsonb_typeof(draft.content -> 'judgments') <> 'array'
    or jsonb_array_length(draft.content -> 'judgments') = 0
    or jsonb_typeof(draft.content -> 'signals') <> 'array'
    or jsonb_array_length(draft.content -> 'signals') = 0 then
    raise exception 'judgments and signals are required';
  end if;
  if exists (
    select 1 from jsonb_array_elements(coalesce(draft.content -> 'curriculumAnchors', '[]'::jsonb)) anchor
    where not exists (
      select 1 from public.curriculum_anchors approved
      where approved.anchor_key = anchor ->> 'id' and approved.active
    )
  ) then raise exception 'unapproved curriculum anchor'; end if;
  if exists (
    select 1 from jsonb_array_elements(coalesce(draft.content -> 'judgments', '[]'::jsonb)) judgment
    where concat(judgment #>> '{interaction,type}', '@', judgment #>> '{interaction,version}')
      not in ('choice@1', 'fraction-bar@1', 'measurement@1', 'pictograph@1')
  ) then raise exception 'unsupported interaction'; end if;
  if exists (
    select 1 from jsonb_array_elements(draft.content -> 'judgments') judgment
    where jsonb_typeof(judgment -> 'choices') <> 'array'
      or jsonb_array_length(judgment -> 'choices') < 2
      or (select count(*) from jsonb_array_elements(judgment -> 'choices') choice where coalesce((choice ->> 'correct')::boolean, false)) <> 1
  ) then raise exception 'each judgment requires choices and one correct answer'; end if;
  if exists (
    select 1 from jsonb_array_elements(draft.content -> 'signals') signal
    where char_length(trim(coalesce(signal ->> 'teacherInterpretation', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'teachingMove', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'parentSummary', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'homePrompt', ''))) = 0
  ) then raise exception 'teacher and guardian signal copy are required'; end if;

  published_content := jsonb_set(
    jsonb_set(
      jsonb_set(draft.content, '{manifest,version}', to_jsonb(p_version), true),
      '{manifest,status}', '"published"'::jsonb, true
    ),
    '{manifest,checksum}', '""'::jsonb, true
  );
  content_checksum := encode(extensions.digest(convert_to(published_content::text, 'UTF8'), 'sha256'), 'hex');
  published_content := jsonb_set(published_content, '{manifest,checksum}', to_jsonb(content_checksum), true);

  insert into public.diagnosis_sets (
    set_key, version, checksum, status, manifest, content, published_at,
    release_notes, published_by, reviewed_by, validation_report, publication_gate
  ) values (
    draft.set_key, p_version, content_checksum, 'published', published_content -> 'manifest', published_content, now(),
    trim(p_release_notes), auth.uid(), review.reviewer_id, p_validation, gate_entry
  ) returning * into result;

  update public.content_drafts set status = 'published' where id = draft.id;
  update public.content_review_requests set status = 'published' where id = review.id;
  return result;
end;
$$;
