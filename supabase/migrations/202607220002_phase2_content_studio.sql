create type public.content_team_role as enum ('author', 'reviewer', 'admin');
create type public.content_draft_status as enum ('draft', 'in_review', 'changes_requested', 'approved', 'published');
create type public.content_review_status as enum ('pending', 'changes_requested', 'approved', 'cancelled', 'published');

create table public.content_team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.content_team_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.content_team_members is '내부 콘텐츠 제작·검수 계정. 일반 교사와 분리해 RLS에서 사용한다.';

create table public.curriculum_anchors (
  id uuid primary key default gen_random_uuid(),
  anchor_key text not null unique,
  curriculum text not null default '2022-revised' check (curriculum = '2022-revised'),
  grade smallint not null check (grade between 1 and 6),
  semester smallint not null check (semester in (1, 2)),
  label text not null check (char_length(trim(label)) > 0),
  source text not null check (char_length(trim(source)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_drafts (
  id uuid primary key,
  set_key text not null check (set_key ~ '^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$'),
  owner_id uuid not null references auth.users(id) on delete restrict,
  base_diagnosis_set_id uuid references public.diagnosis_sets(id) on delete restrict,
  status public.content_draft_status not null default 'draft',
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_drafts_owner_updated_idx on public.content_drafts(owner_id, updated_at desc);

create table public.content_draft_revisions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.content_drafts(id) on delete restrict,
  revision integer not null check (revision > 0),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (draft_id, revision)
);

create table public.content_review_requests (
  id uuid primary key,
  draft_id uuid not null references public.content_drafts(id) on delete restrict,
  draft_revision integer not null check (draft_revision > 0),
  author_id uuid not null references auth.users(id) on delete restrict,
  reviewer_id uuid references auth.users(id) on delete restrict,
  status public.content_review_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  check (reviewer_id is null or reviewer_id <> author_id)
);

create unique index content_one_open_review_per_draft
  on public.content_review_requests(draft_id)
  where status = 'pending';

create table public.content_review_comments (
  id uuid primary key default gen_random_uuid(),
  review_request_id uuid not null references public.content_review_requests(id) on delete restrict,
  author_id uuid not null references auth.users(id) on delete restrict,
  path text not null check (path ~ '^/'),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  required boolean not null default true,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.diagnosis_sets
  add column release_notes text,
  add column published_by uuid references auth.users(id) on delete restrict,
  add column reviewed_by uuid references auth.users(id) on delete restrict,
  add column validation_report jsonb;

comment on column public.diagnosis_sets.content is '학생 런타임이 직접 읽는 발행 시점 전체 DiagnosisSet JSON. 패키지 참조가 아니다.';
comment on column public.diagnosis_sets.checksum is 'manifest.checksum을 빈 문자열로 둔 발행 JSONB의 SHA-256.';

create trigger curriculum_anchors_touch_updated_at before update on public.curriculum_anchors
for each row execute function public.touch_updated_at();
create trigger content_drafts_touch_updated_at before update on public.content_drafts
for each row execute function public.touch_updated_at();

create or replace function public.capture_initial_content_draft_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.content_draft_revisions (draft_id, revision, content, created_by)
  values (new.id, new.revision, new.content, new.owner_id);
  return new;
end;
$$;

create trigger content_draft_capture_initial_revision
after insert on public.content_drafts
for each row execute function public.capture_initial_content_draft_revision();

create or replace function public.protect_published_diagnosis_set()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'published diagnosis sets are immutable';
  end if;
  if old.status = 'published'
    and new.status = 'retired'
    and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status') then
    return new;
  end if;
  raise exception 'published diagnosis sets are immutable';
end;
$$;

create trigger diagnosis_sets_immutable
before update or delete on public.diagnosis_sets
for each row execute function public.protect_published_diagnosis_set();

create or replace function public.protect_content_review_comment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.review_request_id <> old.review_request_id
    or new.author_id <> old.author_id
    or new.path <> old.path
    or new.body <> old.body
    or new.required <> old.required
    or new.created_at <> old.created_at then
    raise exception 'review comment fields are immutable';
  end if;
  return new;
end;
$$;

create trigger content_review_comments_protect
before update on public.content_review_comments
for each row execute function public.protect_content_review_comment();

create or replace function public.save_content_draft(
  p_draft_id uuid,
  p_expected_revision integer,
  p_content jsonb
)
returns public.content_drafts
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.content_drafts%rowtype;
  next_revision integer;
begin
  if not exists (
    select 1 from public.content_team_members
    where user_id = auth.uid() and role in ('author', 'admin') and active
  ) then raise exception 'active content author required'; end if;
  select * into target from public.content_drafts where id = p_draft_id for update;
  if target.id is null then raise exception 'draft not found'; end if;
  if target.owner_id <> auth.uid() and not exists (
    select 1 from public.content_team_members where user_id = auth.uid() and role = 'admin' and active
  ) then raise exception 'draft owner or admin required'; end if;
  if target.status = 'published' then raise exception 'draft is not editable'; end if;
  if target.revision <> p_expected_revision then raise exception 'revision conflict'; end if;
  if jsonb_typeof(p_content) <> 'object' then raise exception 'content must be an object'; end if;

  next_revision := target.revision + 1;
  update public.content_drafts
  set content = p_content, revision = next_revision, status = 'draft'
  where id = target.id
  returning * into target;

  insert into public.content_draft_revisions (draft_id, revision, content, created_by)
  values (target.id, target.revision, target.content, auth.uid());

  update public.content_review_requests
  set status = 'cancelled', decided_at = now()
  where draft_id = target.id and status in ('pending', 'approved');

  return target;
end;
$$;

create or replace function public.request_content_review(
  p_request_id uuid,
  p_draft_id uuid,
  p_expected_revision integer,
  p_reviewer_id uuid default null
)
returns public.content_review_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.content_drafts%rowtype;
  result public.content_review_requests%rowtype;
begin
  if not exists (
    select 1 from public.content_team_members
    where user_id = auth.uid() and role in ('author', 'admin') and active
  ) then raise exception 'active content author required'; end if;
  select * into target from public.content_drafts where id = p_draft_id for update;
  if target.id is null or target.owner_id <> auth.uid() then raise exception 'draft owner required'; end if;
  if target.status not in ('draft', 'changes_requested') then raise exception 'draft cannot be submitted'; end if;
  if target.revision <> p_expected_revision then raise exception 'revision conflict'; end if;
  if p_reviewer_id = auth.uid() then raise exception 'author cannot review own draft'; end if;
  if p_reviewer_id is not null and not exists (
    select 1 from public.content_team_members
    where user_id = p_reviewer_id and role in ('reviewer', 'admin') and active
  ) then raise exception 'reviewer role required'; end if;

  insert into public.content_review_requests (
    id, draft_id, draft_revision, author_id, reviewer_id
  ) values (
    p_request_id, target.id, target.revision, auth.uid(), p_reviewer_id
  ) returning * into result;

  update public.content_drafts set status = 'in_review' where id = target.id;
  return result;
end;
$$;

create or replace function public.decide_content_review(
  p_review_request_id uuid,
  p_expected_draft_revision integer,
  p_decision text
)
returns public.content_review_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  request public.content_review_requests%rowtype;
  draft public.content_drafts%rowtype;
begin
  if not exists (
    select 1 from public.content_team_members
    where user_id = auth.uid() and role in ('reviewer', 'admin') and active
  ) then raise exception 'reviewer role required'; end if;
  if p_decision not in ('approve', 'request_changes') then raise exception 'invalid review decision'; end if;

  select * into request from public.content_review_requests where id = p_review_request_id for update;
  select * into draft from public.content_drafts where id = request.draft_id for update;
  if request.id is null or request.status <> 'pending' then raise exception 'open review not found'; end if;
  if request.author_id = auth.uid() then raise exception 'author cannot review own draft'; end if;
  if request.reviewer_id is not null and request.reviewer_id <> auth.uid() then raise exception 'review assigned to another reviewer'; end if;
  if request.draft_revision <> p_expected_draft_revision or draft.revision <> p_expected_draft_revision then
    raise exception 'revision conflict';
  end if;
  if p_decision = 'approve' and exists (
    select 1 from public.content_review_comments
    where review_request_id = request.id and required and resolved_at is null
  ) then raise exception 'required review comments must be resolved'; end if;

  update public.content_review_requests
  set reviewer_id = auth.uid(),
      status = case when p_decision = 'approve' then 'approved'::public.content_review_status else 'changes_requested'::public.content_review_status end,
      decided_at = now()
  where id = request.id
  returning * into request;

  update public.content_drafts
  set status = case when p_decision = 'approve' then 'approved'::public.content_draft_status else 'changes_requested'::public.content_draft_status end
  where id = draft.id;
  return request;
end;
$$;

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
    release_notes, published_by, reviewed_by, validation_report
  ) values (
    draft.set_key, p_version, content_checksum, 'published', published_content -> 'manifest', published_content, now(),
    trim(p_release_notes), auth.uid(), review.reviewer_id, p_validation
  ) returning * into result;

  update public.content_drafts set status = 'published' where id = draft.id;
  update public.content_review_requests set status = 'published' where id = review.id;
  return result;
end;
$$;

create or replace function public.retire_diagnosis_set(p_diagnosis_set_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.content_team_members where user_id = auth.uid() and role = 'admin' and active
  ) then raise exception 'content admin required'; end if;
  update public.diagnosis_sets set status = 'retired'
  where id = p_diagnosis_set_id and status = 'published';
  if not found then raise exception 'published diagnosis set not found'; end if;
end;
$$;

create or replace function public.is_content_team_member(
  p_roles public.content_team_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_team_members
    where user_id = auth.uid()
      and active
      and (p_roles is null or role = any(p_roles))
  );
$$;

alter table public.content_team_members enable row level security;
alter table public.curriculum_anchors enable row level security;
alter table public.content_drafts enable row level security;
alter table public.content_draft_revisions enable row level security;
alter table public.content_review_requests enable row level security;
alter table public.content_review_comments enable row level security;

create policy content_team_read_self_or_admin on public.content_team_members
for select to authenticated using (
  user_id = auth.uid() or public.is_content_team_member(array['admin'::public.content_team_role])
);

create policy active_curriculum_anchors_read on public.curriculum_anchors
for select to authenticated using (active or exists (
  select 1 where public.is_content_team_member()
));

create policy content_admin_manage_curriculum_anchors on public.curriculum_anchors
for all to authenticated using (
  public.is_content_team_member(array['admin'::public.content_team_role])
) with check (
  public.is_content_team_member(array['admin'::public.content_team_role])
);

create policy content_team_read_drafts on public.content_drafts
for select to authenticated using (public.is_content_team_member());

create policy content_author_create_draft on public.content_drafts
for insert to authenticated with check (
  owner_id = auth.uid() and public.is_content_team_member(array['author'::public.content_team_role, 'admin'::public.content_team_role])
);

create policy content_team_read_revisions on public.content_draft_revisions
for select to authenticated using (public.is_content_team_member());

create policy content_team_read_reviews on public.content_review_requests
for select to authenticated using (public.is_content_team_member());

create policy content_team_read_comments on public.content_review_comments
for select to authenticated using (public.is_content_team_member());

create policy content_reviewer_create_comment on public.content_review_comments
for insert to authenticated with check (
  author_id = auth.uid() and exists (
    select 1 from public.content_review_requests request
    where request.id = review_request_id and request.status = 'pending' and request.author_id <> auth.uid()
  ) and public.is_content_team_member(array['reviewer'::public.content_team_role, 'admin'::public.content_team_role])
);

create policy content_team_resolve_comment on public.content_review_comments
for update to authenticated using (public.is_content_team_member() and exists (
  select 1 from public.content_review_requests request
  join public.content_drafts draft on draft.id = request.draft_id
  where request.id = review_request_id and (draft.owner_id = auth.uid() or content_review_comments.author_id = auth.uid())
)) with check (public.is_content_team_member() and exists (
  select 1 from public.content_review_requests request
  join public.content_drafts draft on draft.id = request.draft_id
  where request.id = review_request_id and (draft.owner_id = auth.uid() or content_review_comments.author_id = auth.uid())
));

drop policy teacher_content_read on public.diagnosis_sets;

create policy teacher_assigned_retired_content_read on public.diagnosis_sets
for select to authenticated using (
  status = 'retired' and exists (
    select 1 from public.assignments assignment
    join public.classes class on class.id = assignment.class_id
    where assignment.diagnosis_set_id = diagnosis_sets.id and class.teacher_id = auth.uid()
  )
);

create policy content_team_retired_content_read on public.diagnosis_sets
for select to authenticated using (
  status = 'retired' and public.is_content_team_member()
);

create policy assigned_retired_content_read on public.diagnosis_sets
for select to authenticated using (
  status = 'retired' and exists (
    select 1 from public.assignments assignment
    join public.student_access_grants grant_row on grant_row.class_id = assignment.class_id
    where assignment.diagnosis_set_id = diagnosis_sets.id
      and grant_row.auth_uid = auth.uid() and grant_row.revoked_at is null
  )
);

revoke all on function public.save_content_draft(uuid, integer, jsonb) from public;
revoke all on function public.request_content_review(uuid, uuid, integer, uuid) from public;
revoke all on function public.decide_content_review(uuid, integer, text) from public;
revoke all on function public.publish_diagnosis_set(uuid, integer, text, text, jsonb) from public;
revoke all on function public.retire_diagnosis_set(uuid) from public;
revoke all on function public.is_content_team_member(public.content_team_role[]) from public;
grant execute on function public.save_content_draft(uuid, integer, jsonb) to authenticated;
grant execute on function public.request_content_review(uuid, uuid, integer, uuid) to authenticated;
grant execute on function public.decide_content_review(uuid, integer, text) to authenticated;
grant execute on function public.publish_diagnosis_set(uuid, integer, text, text, jsonb) to authenticated;
grant execute on function public.retire_diagnosis_set(uuid) to authenticated;
grant execute on function public.is_content_team_member(public.content_team_role[]) to authenticated;

grant select on public.content_team_members to authenticated;
grant select, insert, update on public.curriculum_anchors to authenticated;
grant select, insert on public.content_drafts to authenticated;
grant select on public.content_draft_revisions to authenticated;
grant select on public.content_review_requests to authenticated;
grant select, insert, update on public.content_review_comments to authenticated;

revoke update, delete, truncate on public.diagnosis_sets from anon, authenticated;

insert into public.curriculum_anchors (anchor_key, grade, semester, label, source)
values
  ('[4수01-04]', 3, 2, '한 자리 수 또는 두 자리 수를 곱하는 곱셈', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수01-05]', 3, 2, '나눗셈의 의미와 곱셈과의 관계', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수01-06]', 3, 2, '한 자리 수로 나누는 나눗셈', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수03-06]', 3, 2, '원의 중심, 반지름, 지름', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수03-07]', 3, 2, '컴퍼스로 원 그리기', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수01-09]', 3, 2, '등분할과 분수', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수01-10]', 3, 2, '단위분수, 진분수, 가분수, 대분수', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수01-11]', 3, 2, '분모가 같은 분수와 단위분수의 크기 비교', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수03-17]', 3, 2, 'L와 mL의 관계와 들이 측정', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수03-19]', 3, 2, '들이의 덧셈과 뺄셈', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수03-20]', 3, 2, 'g과 kg의 관계와 무게 측정', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수04-01]', 3, 2, '실생활 자료와 그림그래프', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정')
on conflict (anchor_key) do nothing;
