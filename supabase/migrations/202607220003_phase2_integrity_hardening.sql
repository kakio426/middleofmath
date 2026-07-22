create or replace function public.canonical_jsonb_text(p_value jsonb)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  result text;
begin
  case jsonb_typeof(p_value)
    when 'object' then
      select '{' || coalesce(string_agg(
        to_jsonb(entry.key)::text || ':' || public.canonical_jsonb_text(entry.value),
        ',' order by entry.key collate "C"
      ), '') || '}'
      into result
      from jsonb_each(p_value) entry;
      return result;
    when 'array' then
      select '[' || coalesce(string_agg(
        public.canonical_jsonb_text(entry.value),
        ',' order by entry.ordinality
      ), '') || ']'
      into result
      from jsonb_array_elements(p_value) with ordinality entry(value, ordinality);
      return result;
    else
      return p_value::text;
  end case;
end;
$$;

comment on function public.canonical_jsonb_text(jsonb) is
  '브라우저 canonicalJson과 동일한 키 정렬·공백 없는 JSON. 콘텐츠 SHA-256 재현에 사용한다.';

alter table public.diagnosis_sets disable trigger diagnosis_sets_immutable;
with normalized as (
  select
    id,
    jsonb_set(content, '{manifest,checksum}', '""'::jsonb, true) as checksum_input
  from public.diagnosis_sets
), checksummed as (
  select
    id,
    checksum_input,
    encode(extensions.digest(convert_to(public.canonical_jsonb_text(checksum_input), 'UTF8'), 'sha256'), 'hex') as checksum
  from normalized
), finalized as (
  select id, checksum, jsonb_set(checksum_input, '{manifest,checksum}', to_jsonb(checksum), true) as content
  from checksummed
)
update public.diagnosis_sets target
set checksum = finalized.checksum,
    content = finalized.content,
    manifest = finalized.content -> 'manifest'
from finalized
where target.id = finalized.id;
alter table public.diagnosis_sets enable trigger diagnosis_sets_immutable;

create or replace function public.validate_and_checksum_published_diagnosis_set()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  checksum_input jsonb;
  calculated_checksum text;
begin
  if new.status <> 'published' then
    raise exception 'new diagnosis sets must be published';
  end if;
  if jsonb_typeof(new.content) <> 'object'
    or jsonb_typeof(new.content -> 'manifest') <> 'object'
    or jsonb_typeof(new.content -> 'manifest' -> 'units') <> 'array'
    or jsonb_array_length(new.content -> 'manifest' -> 'units') = 0
    or jsonb_typeof(new.content -> 'curriculumAnchors') <> 'array'
    or jsonb_array_length(new.content -> 'curriculumAnchors') = 0
    or jsonb_typeof(new.content -> 'learnerStages') <> 'array'
    or jsonb_array_length(new.content -> 'learnerStages') = 0
    or jsonb_typeof(new.content -> 'signals') <> 'array'
    or jsonb_array_length(new.content -> 'signals') = 0
    or jsonb_typeof(new.content -> 'judgments') <> 'array'
    or jsonb_array_length(new.content -> 'judgments') = 0 then
    raise exception 'invalid diagnosis content structure';
  end if;
  if new.content #>> '{manifest,id}' <> new.set_key
    or new.content #>> '{manifest,version}' <> new.version
    or coalesce((new.content #>> '{manifest,grade}')::integer, 0) not between 1 and 6
    or coalesce((new.content #>> '{manifest,semester}')::integer, 0) not in (1, 2)
    or new.content #>> '{manifest,curriculum}' <> '2022-revised' then
    raise exception 'manifest identity or curriculum is invalid';
  end if;
  if char_length(trim(coalesce(new.content #>> '{manifest,title}', ''))) = 0
    or char_length(trim(coalesce(new.content #>> '{manifest,shortTitle}', ''))) = 0 then
    raise exception 'manifest titles are required';
  end if;

  if exists (
    select item ->> 'id'
    from jsonb_array_elements(new.content -> 'manifest' -> 'units') item
    group by item ->> 'id' having count(*) > 1 or item ->> 'id' is null
  ) or exists (
    select item ->> 'id'
    from jsonb_array_elements(new.content -> 'curriculumAnchors') item
    group by item ->> 'id' having count(*) > 1 or item ->> 'id' is null
  ) or exists (
    select item ->> 'id'
    from jsonb_array_elements(new.content -> 'learnerStages') item
    group by item ->> 'id' having count(*) > 1 or item ->> 'id' is null
  ) or exists (
    select item ->> 'id'
    from jsonb_array_elements(new.content -> 'signals') item
    group by item ->> 'id' having count(*) > 1 or item ->> 'id' is null
  ) or exists (
    select item ->> 'id'
    from jsonb_array_elements(new.content -> 'judgments') item
    group by item ->> 'id' having count(*) > 1 or item ->> 'id' is null
  ) then
    raise exception 'content IDs must be present and unique';
  end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
    where not exists (
      select 1 from public.curriculum_anchors approved
      where approved.anchor_key = anchor ->> 'id' and approved.active
    )
  ) then raise exception 'unapproved curriculum anchor'; end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'learnerStages') stage
    where not exists (
      select 1 from jsonb_array_elements(new.content -> 'manifest' -> 'units') unit
      where unit ->> 'id' = stage ->> 'unitId'
    )
    or exists (
      select 1 from jsonb_array_elements(coalesce(stage -> 'curriculumAnchorIds', '[]'::jsonb)) anchor_id
      where not exists (
        select 1 from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
        where anchor ->> 'id' = anchor_id #>> '{}'
      )
    )
    or exists (
      select 1 from jsonb_array_elements(coalesce(stage -> 'prerequisiteStageIds', '[]'::jsonb)) prerequisite_id
      where not exists (
        select 1 from jsonb_array_elements(new.content -> 'learnerStages') candidate
        where candidate ->> 'id' = prerequisite_id #>> '{}'
      )
    )
  ) then raise exception 'learner stage contains an unknown reference'; end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'signals') signal
    where char_length(trim(coalesce(signal ->> 'id', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'title', ''))) = 0
      or coalesce(signal ->> 'severity', '') not in ('low', 'medium', 'high')
      or char_length(trim(coalesce(signal ->> 'teacherInterpretation', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'teachingMove', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'parentSummary', ''))) = 0
      or char_length(trim(coalesce(signal ->> 'homePrompt', ''))) = 0
  ) then raise exception 'teacher and guardian signal copy are required'; end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'judgments') judgment
    where not exists (
      select 1 from jsonb_array_elements(new.content -> 'manifest' -> 'units') unit
      where unit ->> 'id' = judgment ->> 'unitId'
    )
    or not exists (
      select 1 from jsonb_array_elements(new.content -> 'learnerStages') stage
      where stage ->> 'id' = judgment ->> 'learnerStageId'
    )
    or exists (
      select 1 from jsonb_array_elements(coalesce(judgment -> 'curriculumAnchorIds', '[]'::jsonb)) anchor_id
      where not exists (
        select 1 from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
        where anchor ->> 'id' = anchor_id #>> '{}'
      )
    )
    or concat(judgment #>> '{interaction,type}', '@', judgment #>> '{interaction,version}')
      not in ('choice@1', 'fraction-bar@1', 'measurement@1', 'pictograph@1')
    or jsonb_typeof(judgment -> 'choices') <> 'array'
    or jsonb_array_length(judgment -> 'choices') < 2
    or (select count(*) from jsonb_array_elements(judgment -> 'choices') choice where coalesce((choice ->> 'correct')::boolean, false)) <> 1
    or exists (
      select choice ->> 'id' from jsonb_array_elements(judgment -> 'choices') choice
      group by choice ->> 'id' having count(*) > 1 or choice ->> 'id' is null
    )
    or exists (
      select 1 from jsonb_array_elements(judgment -> 'choices') choice
      where (
        not coalesce((choice ->> 'correct')::boolean, false)
        and jsonb_array_length(coalesce(choice -> 'signalIds', '[]'::jsonb)) = 0
      )
      or exists (
        select 1 from jsonb_array_elements(coalesce(choice -> 'signalIds', '[]'::jsonb)) signal_id
        where not exists (
          select 1 from jsonb_array_elements(new.content -> 'signals') signal
          where signal ->> 'id' = signal_id #>> '{}'
        )
      )
    )
    or concat_ws(' ', judgment ->> 'context', judgment ->> 'prompt', judgment -> 'choices')
      ~ '(오개념|진단 결과|정답은|틀렸|부족|교사용|학부모용)'
  ) then raise exception 'judgment validation failed'; end if;

  if exists (
    with recursive edges as (
      select stage ->> 'id' as stage_id, prerequisite #>> '{}' as prerequisite_id
      from jsonb_array_elements(new.content -> 'learnerStages') stage,
           jsonb_array_elements(coalesce(stage -> 'prerequisiteStageIds', '[]'::jsonb)) prerequisite
    ), walk(start_id, current_id, path, cycle) as (
      select stage_id, prerequisite_id, array[stage_id, prerequisite_id], stage_id = prerequisite_id
      from edges
      union all
      select walk.start_id, edges.prerequisite_id, walk.path || edges.prerequisite_id,
             edges.prerequisite_id = any(walk.path)
      from walk join edges on edges.stage_id = walk.current_id
      where not walk.cycle
    )
    select 1 from walk where cycle
  ) then raise exception 'prerequisite cycle detected'; end if;

  if exists (
    select 1
    from public.diagnosis_sets previous,
         jsonb_array_elements(previous.content -> 'manifest' -> 'units') previous_item
    where previous.set_key = new.set_key
      and not exists (
        select 1 from jsonb_array_elements(new.content -> 'manifest' -> 'units') current_item
        where current_item ->> 'id' = previous_item ->> 'id'
      )
  ) or exists (
    select 1
    from public.diagnosis_sets previous,
         jsonb_array_elements(previous.content -> 'curriculumAnchors') previous_item
    where previous.set_key = new.set_key
      and not exists (
        select 1 from jsonb_array_elements(new.content -> 'curriculumAnchors') current_item
        where current_item ->> 'id' = previous_item ->> 'id'
      )
  ) or exists (
    select 1
    from public.diagnosis_sets previous,
         jsonb_array_elements(previous.content -> 'learnerStages') previous_item
    where previous.set_key = new.set_key
      and not exists (
        select 1 from jsonb_array_elements(new.content -> 'learnerStages') current_item
        where current_item ->> 'id' = previous_item ->> 'id'
      )
  ) or exists (
    select 1
    from public.diagnosis_sets previous,
         jsonb_array_elements(previous.content -> 'signals') previous_item
    where previous.set_key = new.set_key
      and not exists (
        select 1 from jsonb_array_elements(new.content -> 'signals') current_item
        where current_item ->> 'id' = previous_item ->> 'id'
      )
  ) or exists (
    select 1
    from public.diagnosis_sets previous,
         jsonb_array_elements(previous.content -> 'judgments') previous_item
    where previous.set_key = new.set_key
      and not exists (
        select 1 from jsonb_array_elements(new.content -> 'judgments') current_item
        where current_item ->> 'id' = previous_item ->> 'id'
      )
  ) or exists (
    select 1
    from public.diagnosis_sets previous,
         jsonb_array_elements(previous.content -> 'judgments') previous_judgment,
         jsonb_array_elements(previous_judgment -> 'choices') previous_choice
    where previous.set_key = new.set_key
      and not exists (
        select 1
        from jsonb_array_elements(new.content -> 'judgments') current_judgment,
             jsonb_array_elements(current_judgment -> 'choices') current_choice
        where current_judgment ->> 'id' = previous_judgment ->> 'id'
          and current_choice ->> 'id' = previous_choice ->> 'id'
      )
  ) then raise exception 'published stable IDs cannot be removed'; end if;

  checksum_input := jsonb_set(new.content, '{manifest,checksum}', '""'::jsonb, true);
  calculated_checksum := encode(
    extensions.digest(convert_to(public.canonical_jsonb_text(checksum_input), 'UTF8'), 'sha256'),
    'hex'
  );
  new.content := jsonb_set(checksum_input, '{manifest,checksum}', to_jsonb(calculated_checksum), true);
  new.manifest := new.content -> 'manifest';
  new.checksum := calculated_checksum;
  new.validation_report := jsonb_build_object(
    'valid', true,
    'issues', '[]'::jsonb,
    'source', 'database',
    'validatedAt', now()
  );
  return new;
end;
$$;

create trigger diagnosis_sets_validate_and_checksum
before insert on public.diagnosis_sets
for each row execute function public.validate_and_checksum_published_diagnosis_set();

drop policy if exists published_content_read on public.diagnosis_sets;
drop policy if exists teacher_content_read on public.diagnosis_sets;

create policy teacher_and_content_team_published_read on public.diagnosis_sets
for select to authenticated using (
  status = 'published' and (
    exists (select 1 from public.teachers teacher where teacher.id = auth.uid())
    or public.is_content_team_member()
  )
);

create policy student_assigned_published_read on public.diagnosis_sets
for select to authenticated using (
  status = 'published' and exists (
    select 1
    from public.assignments assignment
    join public.student_access_grants grant_row on grant_row.class_id = assignment.class_id
    where assignment.diagnosis_set_id = diagnosis_sets.id
      and assignment.status = 'active'
      and assignment.opens_at <= now()
      and (assignment.closes_at is null or assignment.closes_at >= now())
      and grant_row.auth_uid = auth.uid()
      and grant_row.revoked_at is null
  )
);

create or replace function public.can_read_content_draft(p_draft_id uuid, p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_owner_id = auth.uid()
    or exists (
      select 1 from public.content_team_members member
      where member.user_id = auth.uid() and member.active and member.role = 'admin'
    )
    or exists (
      select 1
      from public.content_review_requests request
      join public.content_team_members member on member.user_id = auth.uid()
      where request.draft_id = p_draft_id
        and member.active and member.role in ('reviewer', 'admin')
        and (request.reviewer_id is null or request.reviewer_id = auth.uid())
    );
$$;

drop policy if exists content_team_read_drafts on public.content_drafts;
drop policy if exists content_team_read_revisions on public.content_draft_revisions;
drop policy if exists content_team_read_reviews on public.content_review_requests;
drop policy if exists content_team_read_comments on public.content_review_comments;

create policy content_scoped_read_drafts on public.content_drafts
for select to authenticated using (public.can_read_content_draft(id, owner_id));

create policy content_scoped_read_revisions on public.content_draft_revisions
for select to authenticated using (exists (
  select 1 from public.content_drafts draft
  where draft.id = content_draft_revisions.draft_id
    and public.can_read_content_draft(draft.id, draft.owner_id)
));

create policy content_scoped_read_reviews on public.content_review_requests
for select to authenticated using (
  author_id = auth.uid()
  or reviewer_id = auth.uid()
  or (
    reviewer_id is null
    and public.is_content_team_member(array['reviewer'::public.content_team_role, 'admin'::public.content_team_role])
  )
  or public.is_content_team_member(array['admin'::public.content_team_role])
);

create policy content_scoped_read_comments on public.content_review_comments
for select to authenticated using (exists (
  select 1
  from public.content_review_requests request
  join public.content_drafts draft on draft.id = request.draft_id
  where request.id = content_review_comments.review_request_id
    and public.can_read_content_draft(draft.id, draft.owner_id)
));

revoke all on function public.canonical_jsonb_text(jsonb) from public;
revoke all on function public.can_read_content_draft(uuid, uuid) from public;
grant execute on function public.canonical_jsonb_text(jsonb) to authenticated;
grant execute on function public.can_read_content_draft(uuid, uuid) to authenticated;
