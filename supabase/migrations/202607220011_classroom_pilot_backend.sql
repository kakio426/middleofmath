alter table public.classes
  add column pilot_ends_at timestamptz not null default (now() + interval '30 days'),
  add column purge_after timestamptz not null default (now() + interval '120 days'),
  add column purged_at timestamptz,
  add constraint classes_pilot_retention_order check (purge_after >= pilot_ends_at);

comment on column public.classes.pilot_ends_at is '파일럿 기본 종료 시점. 생성일부터 30일.';
comment on column public.classes.purge_after is '파일럿 종료 후 90일이 지난 서비스 역할 삭제 대상 시점. 기본 생성일부터 120일.';

alter table public.students add column join_secret_hash text;

update public.students
set join_secret_hash = extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf'))
where join_secret_hash is null;

alter table public.students alter column join_secret_hash set not null;

comment on column public.students.join_secret_hash is
  '학생별 6자리 개인 입장 코드의 단방향 해시. 원문은 생성·재발급 응답에서 한 번만 노출한다.';

do $$
begin
  if exists (
    select 1 from public.teachers teacher
    join auth.users user_row on user_row.id = teacher.id
    where coalesce(user_row.is_anonymous, false) = true or user_row.invited_at is null
  ) then
    raise exception 'teacher account invitation audit required before pilot migration';
  end if;
end;
$$;

create or replace function public.guard_teacher_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from auth.users
    where id = new.id
      and coalesce(is_anonymous, false) = false
      and invited_at is not null
  ) then
    raise exception 'teacher profile requires an invited non-anonymous account';
  end if;
  return new;
end;
$$;

create trigger teachers_invitation_guard
before insert or update of id on public.teachers
for each row execute function public.guard_teacher_invitation();

drop policy teacher_own_profile on public.teachers;

create policy teacher_read_own_profile on public.teachers
for select to authenticated using (id = auth.uid());

create policy teacher_update_own_profile on public.teachers
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

revoke insert on public.teachers from authenticated;

create index sessions_latest_completed_attempt_idx
  on public.sessions(assignment_id, student_id, completed_at desc, started_at desc, id desc)
  where status = 'completed';

create or replace function public.guard_assignment_content_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  stored_version text;
  stored_status public.content_status;
begin
  if tg_op = 'UPDATE' and (
    new.diagnosis_set_id <> old.diagnosis_set_id
    or new.diagnosis_set_version <> old.diagnosis_set_version
  ) then raise exception 'assignment content version is immutable'; end if;

  select version, status into stored_version, stored_status
  from public.diagnosis_sets where id = new.diagnosis_set_id;
  if stored_version is null
    or stored_version <> new.diagnosis_set_version
    or stored_status <> 'published' then
    raise exception 'assignment must reference the exact published content version';
  end if;
  return new;
end;
$$;

create trigger assignments_content_version_guard
before insert or update on public.assignments
for each row execute function public.guard_assignment_content_version();

create table public.anonymous_join_throttles (
  auth_uid uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  failure_count integer not null check (failure_count between 1 and 10),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.anonymous_join_throttles is
  '익명 인증 UID별 입장 실패 횟수만 보관한다. 클래스 코드 원문·코드 해시·IP는 저장하지 않는다.';

alter table public.anonymous_join_throttles enable row level security;
revoke all on public.anonymous_join_throttles from anon, authenticated;

create table public.pilot_operation_throttles (
  auth_uid uuid not null references auth.users(id) on delete cascade,
  app text not null,
  event_name text not null,
  window_started_at timestamptz not null,
  event_count integer not null check (event_count between 1 and 3),
  primary key (auth_uid, app, event_name)
);

comment on table public.pilot_operation_throttles is
  '클라이언트 운영 신호의 조작을 줄이기 위한 UID별 10분 버킷. 선택 payload·별칭·클래스 코드는 저장하지 않는다.';

alter table public.pilot_operation_throttles enable row level security;
revoke all on public.pilot_operation_throttles from anon, authenticated;

create table public.pilot_operations_daily (
  day date not null,
  app text not null check (app in ('student', 'teacher', 'system')),
  event_name text not null check (event_name in (
    'class_join.succeeded', 'class_join.failed', 'sync.failed',
    'session.started', 'session.completed',
    'interpretation.checksum_failed', 'interpretation.unsupported', 'interpretation.failed',
    'parent_report.exported', 'pilot_class.purged'
  )),
  event_count bigint not null check (event_count >= 0),
  primary key (day, app, event_name)
);

comment on table public.pilot_operations_daily is
  '만료 파일럿 삭제 전에 남기는 익명 운영 집계. 날짜·앱·이벤트명·건수 외 식별자는 저장하지 않는다.';

alter table public.pilot_operations_daily enable row level security;
revoke all on public.pilot_operations_daily from anon, authenticated;
grant select on public.pilot_operations_daily to service_role;

create or replace function public.increment_pilot_operation(p_app text, p_event_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.pilot_operations_daily (day, app, event_name, event_count)
  values (current_date, p_app, p_event_name, 1)
  on conflict (day, app, event_name) do update
  set event_count = pilot_operations_daily.event_count + 1;
end;
$$;

revoke all on function public.increment_pilot_operation(text, text) from public;

create or replace function public.record_pilot_operation(p_app text, p_event_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  throttle public.pilot_operation_throttles%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if (p_app, p_event_name) not in (
    ('student', 'sync.failed'),
    ('teacher', 'interpretation.checksum_failed'),
    ('teacher', 'interpretation.unsupported'),
    ('teacher', 'interpretation.failed')
  ) then raise exception 'operation event is not allowed'; end if;
  if p_app = 'teacher' and not exists (
    select 1 from public.teachers where id = auth.uid()
  ) then raise exception 'teacher authentication required'; end if;
  if p_app = 'student' and p_event_name = 'sync.failed' and not exists (
    select 1 from public.sessions
    where student_auth_uid = auth.uid()
      and created_at >= now() - interval '30 days'
  ) then raise exception 'student session required'; end if;

  insert into public.pilot_operation_throttles (
    auth_uid, app, event_name, window_started_at, event_count
  ) values (
    auth.uid(), p_app, p_event_name, now(), 1
  )
  on conflict (auth_uid, app, event_name) do update
  set window_started_at = case
        when pilot_operation_throttles.window_started_at <= now() - interval '10 minutes' then now()
        else pilot_operation_throttles.window_started_at
      end,
      event_count = case
        when pilot_operation_throttles.window_started_at <= now() - interval '10 minutes' then 1
        else least(pilot_operation_throttles.event_count + 1, 3)
      end
  where pilot_operation_throttles.window_started_at <= now() - interval '10 minutes'
     or pilot_operation_throttles.event_count < 3
  returning * into throttle;

  if throttle.auth_uid is null then return; end if;
  perform public.increment_pilot_operation(p_app, p_event_name);
end;
$$;

revoke all on function public.record_pilot_operation(text, text) from public;
grant execute on function public.record_pilot_operation(text, text) to authenticated;

create or replace function public.create_teacher_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.is_anonymous, false) = false then
    if new.invited_at is null then
      raise exception 'teacher account requires an administrator invitation';
    end if;
    insert into public.teachers (id, display_name)
    values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), '교사'))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.create_student(
  p_class_id uuid,
  p_roster_key text,
  p_display_alias text default null
)
returns table (
  student_id uuid,
  roster_key text,
  display_alias text,
  active boolean,
  join_secret text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated text := public.generate_join_code();
  inserted public.students%rowtype;
begin
  if not exists (
    select 1 from public.classes
    where id = p_class_id and teacher_id = auth.uid() and active = true
  ) then raise exception 'class not found'; end if;
  if char_length(trim(coalesce(p_roster_key, ''))) not between 1 and 20
    or char_length(trim(coalesce(p_display_alias, ''))) > 40 then
    raise exception 'invalid student identity';
  end if;

  insert into public.students (class_id, roster_key, display_alias, join_secret_hash)
  values (
    p_class_id,
    trim(p_roster_key),
    nullif(trim(coalesce(p_display_alias, '')), ''),
    extensions.crypt(generated, extensions.gen_salt('bf'))
  )
  returning * into inserted;

  return query select inserted.id, inserted.roster_key, inserted.display_alias,
    inserted.active, generated;
end;
$$;

create or replace function public.rotate_student_join_secret(p_student_id uuid)
returns table (student_id uuid, join_secret text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated text := public.generate_join_code();
begin
  if not exists (
    select 1 from public.students student
    join public.classes class on class.id = student.class_id
    where student.id = p_student_id and class.teacher_id = auth.uid()
  ) then raise exception 'student not found'; end if;

  update public.students
  set join_secret_hash = extensions.crypt(generated, extensions.gen_salt('bf'))
  where id = p_student_id;
  return query select p_student_id, generated;
end;
$$;

revoke insert on public.students from authenticated;
revoke all on function public.create_student(uuid, text, text) from public;
revoke all on function public.rotate_student_join_secret(uuid) from public;
grant execute on function public.create_student(uuid, text, text) to authenticated;
grant execute on function public.rotate_student_join_secret(uuid) to authenticated;

drop function public.join_class(text, text);

create function public.join_class(p_join_code text, p_roster_key text, p_student_secret text)
returns table (
  student_id uuid,
  class_id uuid,
  class_name text,
  roster_key text,
  display_alias text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_is_anonymous boolean;
  normalized_code text := upper(regexp_replace(coalesce(p_join_code, ''), '[^A-Z0-9]', '', 'g'));
  normalized_key text := trim(coalesce(p_roster_key, ''));
  normalized_secret text := upper(regexp_replace(coalesce(p_student_secret, ''), '[^A-Z0-9]', '', 'g'));
  found_class public.classes%rowtype;
  found_student public.students%rowtype;
  throttle public.anonymous_join_throttles%rowtype;
  credentials_valid boolean := false;
begin
  select is_anonymous into caller_is_anonymous from auth.users where id = caller_id;
  if caller_id is null or caller_is_anonymous is distinct from true then
    return;
  end if;

  select * into throttle
  from public.anonymous_join_throttles
  where auth_uid = caller_id
  for update;

  if throttle.locked_until is not null and throttle.locked_until > now() then
    perform public.increment_pilot_operation('student', 'class_join.failed');
    return;
  end if;
  if throttle.window_started_at > now() - interval '10 minutes'
    and throttle.failure_count >= 10 then
    update public.anonymous_join_throttles
    set locked_until = now() + interval '15 minutes', updated_at = now()
    where auth_uid = caller_id;
    perform public.increment_pilot_operation('student', 'class_join.failed');
    return;
  end if;

  if normalized_code ~ '^[A-Z0-9]{6}$'
    and normalized_secret ~ '^[A-Z0-9]{6}$'
    and char_length(normalized_key) between 1 and 20 then
    select * into found_class
    from public.classes
    where join_code_lookup = encode(extensions.digest(normalized_code, 'sha256'), 'hex')
      and active = true
      and pilot_ends_at >= now();

    if found_class.id is not null
      and extensions.crypt(normalized_code, found_class.join_code_hash) = found_class.join_code_hash then
      select * into found_student
      from public.students
      where students.class_id = found_class.id
        and students.roster_key = normalized_key
        and active = true;
    end if;
  end if;

  if found_student.id is not null then
    credentials_valid := extensions.crypt(normalized_secret, found_student.join_secret_hash)
      = found_student.join_secret_hash;
  end if;

  if found_class.id is null or found_student.id is null or credentials_valid is false then
    insert into public.anonymous_join_throttles (
      auth_uid, window_started_at, failure_count, locked_until, updated_at
    ) values (
      caller_id, now(), 1, null, now()
    )
    on conflict (auth_uid) do update
    set window_started_at = case
          when anonymous_join_throttles.window_started_at <= now() - interval '10 minutes' then now()
          else anonymous_join_throttles.window_started_at
        end,
        failure_count = case
          when anonymous_join_throttles.window_started_at <= now() - interval '10 minutes' then 1
          else least(anonymous_join_throttles.failure_count + 1, 10)
        end,
        locked_until = case
          when anonymous_join_throttles.locked_until > now() then anonymous_join_throttles.locked_until
          else null
        end,
        updated_at = now();

    perform public.increment_pilot_operation('student', 'class_join.failed');
    return;
  end if;

  delete from public.anonymous_join_throttles where auth_uid = caller_id;
  update public.student_access_grants
  set revoked_at = now()
  where student_access_grants.auth_uid = caller_id
    and student_access_grants.revoked_at is null
    and student_access_grants.student_id <> found_student.id;

  insert into public.student_access_grants (auth_uid, class_id, student_id)
  values (caller_id, found_class.id, found_student.id)
  on conflict on constraint student_access_grants_auth_uid_student_id_key
  do update set class_id = excluded.class_id, revoked_at = null, granted_at = now();

  perform public.increment_pilot_operation('student', 'class_join.succeeded');

  return query select found_student.id, found_class.id, found_class.name,
    found_student.roster_key, found_student.display_alias;
end;
$$;

revoke all on function public.join_class(text, text, text) from public;
grant execute on function public.join_class(text, text, text) to authenticated;

drop policy student_own_session_insert on public.sessions;
drop policy student_own_session_update on public.sessions;
revoke insert, update on public.sessions from authenticated;

create or replace function public.start_student_session(
  p_session_id uuid,
  p_assignment_id uuid,
  p_student_id uuid,
  p_client_session_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_is_anonymous boolean;
  existing public.sessions%rowtype;
  inserted_count integer := 0;
begin
  select is_anonymous into caller_is_anonymous from auth.users where id = caller_id;
  if caller_id is null or caller_is_anonymous is distinct from true then
    raise exception 'student authentication required';
  end if;
  if not exists (
    select 1
    from public.assignments assignment
    join public.student_access_grants grant_row
      on grant_row.class_id = assignment.class_id
    where assignment.id = p_assignment_id
      and assignment.status = 'active'
      and assignment.opens_at <= now()
      and (assignment.closes_at is null or assignment.closes_at >= now())
      and grant_row.auth_uid = caller_id
      and grant_row.student_id = p_student_id
      and grant_row.revoked_at is null
  ) then raise exception 'assignment is not available'; end if;

  insert into public.sessions (
    id, assignment_id, student_id, student_auth_uid, client_session_id,
    status, started_at, completed_at, last_event_seq
  ) values (
    p_session_id, p_assignment_id, p_student_id, caller_id, p_client_session_id,
    'in_progress', now(), null, 0
  ) on conflict (id) do nothing;
  get diagnostics inserted_count = row_count;

  select * into existing from public.sessions where id = p_session_id;
  if existing.student_auth_uid <> caller_id
    or existing.assignment_id <> p_assignment_id
    or existing.student_id <> p_student_id
    or existing.client_session_id <> p_client_session_id then
    raise exception 'session conflict';
  end if;

  if inserted_count = 1 then
    perform public.increment_pilot_operation('student', 'session.started');
  end if;
end;
$$;

revoke all on function public.start_student_session(uuid, uuid, uuid, uuid) from public;
grant execute on function public.start_student_session(uuid, uuid, uuid, uuid) to authenticated;

create or replace function public.append_observation_events(p_events jsonb)
returns table (client_event_id uuid, received_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  target_session public.sessions%rowtype;
  expected_set_key text;
  expected_set_version text;
  expected_content jsonb;
  existing_event public.observation_events%rowtype;
  event_received_at timestamptz;
  item_event_type text;
  item_client_event_id uuid;
  item_client_seq integer;
  expected_judgment_count integer;
  confirmed_judgment_count integer;
begin
  if auth.uid() is null or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 50 then
    raise exception 'invalid event batch';
  end if;

  for item in select value from jsonb_array_elements(p_events) loop
    item_client_event_id := (item ->> 'client_event_id')::uuid;
    item_client_seq := (item ->> 'client_seq')::integer;
    item_event_type := item ->> 'event_type';

    select * into target_session
    from public.sessions
    where id = (item ->> 'session_id')::uuid
      and student_auth_uid = auth.uid()
    for update;

    if target_session.id is null then raise exception 'session not found'; end if;

    select * into existing_event
    from public.observation_events
    where observation_events.client_event_id = item_client_event_id
      and observation_events.session_id = target_session.id;

    if existing_event.id is not null then
      if existing_event.id is distinct from (item ->> 'id')::uuid
        or existing_event.client_seq is distinct from item_client_seq
        or existing_event.event_type is distinct from item_event_type
        or existing_event.judgment_id is distinct from nullif(item ->> 'judgment_id', '')
        or existing_event.interaction_type is distinct from item ->> 'interaction_type'
        or existing_event.interaction_version is distinct from (item ->> 'interaction_version')::integer
        or existing_event.diagnosis_set_key is distinct from item ->> 'diagnosis_set_id'
        or existing_event.diagnosis_set_version is distinct from item ->> 'diagnosis_set_version'
        or existing_event.payload is distinct from coalesce(item -> 'payload', '{}'::jsonb)
        or existing_event.occurred_at is distinct from (item ->> 'occurred_at')::timestamptz then
        raise exception 'event id conflict';
      end if;
      event_received_at := existing_event.received_at;
      client_event_id := item_client_event_id;
      received_at := event_received_at;
      return next;
      event_received_at := null;
      existing_event := null;
      continue;
    end if;

    if target_session.status = 'completed' then raise exception 'session is already completed'; end if;
    if item_client_seq <> target_session.last_event_seq + 1 then raise exception 'event sequence mismatch'; end if;

    select diagnosis.set_key, diagnosis.version, diagnosis.content
    into expected_set_key, expected_set_version, expected_content
    from public.assignments assignment
    join public.diagnosis_sets diagnosis on diagnosis.id = assignment.diagnosis_set_id
    where assignment.id = target_session.assignment_id;

    if item ->> 'diagnosis_set_id' <> expected_set_key
      or item ->> 'diagnosis_set_version' <> expected_set_version then
      raise exception 'event content version does not match assignment';
    end if;

    if item_event_type = 'session_started' and item_client_seq <> 1 then
      raise exception 'invalid session start event';
    end if;

    if item_event_type = 'judgment_confirmed' then
      if not exists (
        select 1 from jsonb_array_elements(expected_content -> 'judgments') judgment
        where judgment ->> 'id' = item ->> 'judgment_id'
      ) then raise exception 'unknown judgment'; end if;
      if exists (
        select 1 from public.observation_events event
        where event.session_id = target_session.id
          and event.event_type = 'judgment_confirmed'
          and event.judgment_id = item ->> 'judgment_id'
      ) then raise exception 'judgment already confirmed'; end if;
    end if;

    if item_event_type = 'session_completed' then
      select count(*) into expected_judgment_count
      from jsonb_array_elements(expected_content -> 'judgments');
      select count(distinct event.judgment_id) into confirmed_judgment_count
      from public.observation_events event
      where event.session_id = target_session.id and event.event_type = 'judgment_confirmed';
      if confirmed_judgment_count <> expected_judgment_count then
        raise exception 'session completion requires every judgment';
      end if;
    end if;

    insert into public.observation_events (
      id, session_id, client_event_id, client_seq, event_type, judgment_id,
      interaction_type, interaction_version, diagnosis_set_key,
      diagnosis_set_version, payload, occurred_at
    ) values (
      (item ->> 'id')::uuid,
      target_session.id,
      item_client_event_id,
      item_client_seq,
      item_event_type,
      nullif(item ->> 'judgment_id', ''),
      item ->> 'interaction_type',
      (item ->> 'interaction_version')::integer,
      item ->> 'diagnosis_set_id',
      item ->> 'diagnosis_set_version',
      coalesce(item -> 'payload', '{}'::jsonb),
      (item ->> 'occurred_at')::timestamptz
    ) returning observation_events.received_at into event_received_at;

    update public.sessions
    set last_event_seq = item_client_seq,
        status = case when item_event_type = 'session_completed' then 'completed'::public.session_status else status end,
        completed_at = case when item_event_type = 'session_completed' then event_received_at else completed_at end,
        updated_at = now()
    where id = target_session.id;

    if item_event_type = 'session_completed' then
      perform public.increment_pilot_operation('student', 'session.completed');
    end if;

    client_event_id := item_client_event_id;
    received_at := event_received_at;
    return next;
    event_received_at := null;
  end loop;
end;
$$;

create or replace function public.guard_interpretation_run_consistency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected_version text;
begin
  select diagnosis_set_version into expected_version
  from public.assignments assignment
  join public.sessions session on session.assignment_id = assignment.id
  where session.id = new.session_id;

  if expected_version is null
    or new.diagnosis_set_version <> expected_version
    or new.report ->> 'sessionId' <> new.session_id::text
    or new.report ->> 'engineVersion' <> new.engine_version
    or new.report ->> 'diagnosisSetVersion' <> new.diagnosis_set_version then
    raise exception 'interpretation run does not match session or content version';
  end if;
  return new;
end;
$$;

create trigger interpretation_runs_consistency
before insert or update on public.interpretation_runs
for each row execute function public.guard_interpretation_run_consistency();

revoke update, delete, truncate on public.interpretation_runs from anon, authenticated;

create or replace function public.prevent_interpretation_run_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
    and auth.role() = 'service_role'
    and current_setting('middleofmath.purge_context', true) = 'service-role-expired-pilot' then
    return old;
  end if;
  raise exception 'interpretation runs are versioned and immutable';
end;
$$;

create trigger interpretation_runs_immutable
before update or delete on public.interpretation_runs
for each row execute function public.prevent_interpretation_run_mutation();

create or replace function public.guard_parent_report_export_consistency()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.interpretation_runs run
    where run.id = new.interpretation_run_id and run.session_id = new.session_id
  ) then raise exception 'parent export must reference the same session interpretation'; end if;
  if jsonb_typeof(new.report) is distinct from 'object'
    or not public.jsonb_object_has_only_keys(
      new.report,
      array['studentLabel', 'diagnosisTitle', 'generatedAt', 'participation', 'strengths', 'supportAreas', 'closing', 'disclaimer']
    )
    or jsonb_typeof(new.report -> 'strengths') is distinct from 'array'
    or jsonb_typeof(new.report -> 'supportAreas') is distinct from 'array'
    or jsonb_typeof(new.report -> 'studentLabel') is distinct from 'string'
    or jsonb_typeof(new.report -> 'diagnosisTitle') is distinct from 'string'
    or jsonb_typeof(new.report -> 'generatedAt') is distinct from 'string'
    or jsonb_typeof(new.report -> 'participation') is distinct from 'string'
    or jsonb_typeof(new.report -> 'closing') is distinct from 'string'
    or jsonb_typeof(new.report -> 'disclaimer') is distinct from 'string'
    or coalesce(new.report ->> 'studentLabel', '') ~ '^[0-9]+번'
    or exists (
      select 1 from jsonb_array_elements(new.report -> 'strengths') item
      where jsonb_typeof(item) is distinct from 'string'
    )
    or exists (
      select 1 from jsonb_array_elements(new.report -> 'supportAreas') item
      where not public.jsonb_object_has_only_keys(item, array['title', 'observation', 'homePrompt'])
        or jsonb_typeof(item -> 'title') is distinct from 'string'
        or jsonb_typeof(item -> 'observation') is distinct from 'string'
        or jsonb_typeof(item -> 'homePrompt') is distinct from 'string'
    ) then raise exception 'parent export contains invalid or identifying fields'; end if;
  return new;
end;
$$;

create trigger parent_report_exports_consistency
before insert on public.parent_report_exports
for each row execute function public.guard_parent_report_export_consistency();

create or replace function public.record_parent_report_export_operation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.increment_pilot_operation('teacher', 'parent_report.exported');
  return new;
end;
$$;

create trigger parent_report_exports_operation
after insert on public.parent_report_exports
for each row execute function public.record_parent_report_export_operation();

drop policy teacher_own_parent_exports on public.parent_report_exports;

create policy teacher_read_own_parent_exports on public.parent_report_exports
for select to authenticated using (
  reviewed_by = auth.uid()
  and exists (
    select 1 from public.sessions session
    join public.assignments assignment on assignment.id = session.assignment_id
    join public.classes class on class.id = assignment.class_id
    where session.id = parent_report_exports.session_id and class.teacher_id = auth.uid()
  )
);

create policy teacher_create_own_parent_export on public.parent_report_exports
for insert to authenticated with check (
  reviewed_by = auth.uid()
  and exists (
    select 1 from public.sessions session
    join public.assignments assignment on assignment.id = session.assignment_id
    join public.classes class on class.id = assignment.class_id
    where session.id = parent_report_exports.session_id and class.teacher_id = auth.uid()
  )
);

revoke update, delete, truncate on public.parent_report_exports from anon, authenticated;

create or replace function public.prevent_parent_report_export_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
    and auth.role() = 'service_role'
    and current_setting('middleofmath.purge_context', true) = 'service-role-expired-pilot' then
    return old;
  end if;
  raise exception 'parent report exports are immutable';
end;
$$;

create trigger parent_report_exports_immutable
before update or delete on public.parent_report_exports
for each row execute function public.prevent_parent_report_export_mutation();

create or replace function public.teacher_daily_pilot_aggregates(
  p_from date,
  p_to date
)
returns table (
  day date,
  classes_created bigint,
  students_added bigint,
  sessions_started bigint,
  sessions_completed bigint,
  observation_events_received bigint,
  parent_exports_generated bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or not exists (select 1 from public.teachers where id = auth.uid())
    or p_from is null or p_to is null or p_to < p_from or p_to - p_from > 92 then
    raise exception 'invalid aggregate request';
  end if;

  return query
  select series.day::date,
    (select count(*) from public.classes class
      where class.teacher_id = auth.uid() and class.created_at >= series.day and class.created_at < series.day + interval '1 day'),
    (select count(*) from public.students student
      join public.classes class on class.id = student.class_id
      where class.teacher_id = auth.uid() and student.created_at >= series.day and student.created_at < series.day + interval '1 day'),
    (select count(*) from public.sessions session
      join public.assignments assignment on assignment.id = session.assignment_id
      join public.classes class on class.id = assignment.class_id
      where class.teacher_id = auth.uid() and session.started_at >= series.day and session.started_at < series.day + interval '1 day'),
    (select count(*) from public.sessions session
      join public.assignments assignment on assignment.id = session.assignment_id
      join public.classes class on class.id = assignment.class_id
      where class.teacher_id = auth.uid() and session.completed_at >= series.day and session.completed_at < series.day + interval '1 day'),
    (select count(*) from public.observation_events event
      join public.sessions session on session.id = event.session_id
      join public.assignments assignment on assignment.id = session.assignment_id
      join public.classes class on class.id = assignment.class_id
      where class.teacher_id = auth.uid() and event.received_at >= series.day and event.received_at < series.day + interval '1 day'),
    (select count(*) from public.parent_report_exports export
      join public.sessions session on session.id = export.session_id
      join public.assignments assignment on assignment.id = session.assignment_id
      join public.classes class on class.id = assignment.class_id
      where class.teacher_id = auth.uid() and export.generated_at >= series.day and export.generated_at < series.day + interval '1 day')
  from generate_series(p_from::timestamptz, p_to::timestamptz, interval '1 day') series(day)
  order by series.day;
end;
$$;

revoke all on function public.teacher_daily_pilot_aggregates(date, date) from public;
grant execute on function public.teacher_daily_pilot_aggregates(date, date) to authenticated;

create or replace function public.prevent_observation_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
    and auth.role() = 'service_role'
    and current_setting('middleofmath.purge_context', true) = 'service-role-expired-pilot' then
    return old;
  end if;
  raise exception 'observation_events are append-only';
end;
$$;

create or replace function public.purge_expired_pilot_data(p_as_of timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_class_ids uuid[];
  target_auth_uids uuid[];
  deleted_parent_exports integer := 0;
  deleted_interpretation_runs integer := 0;
  deleted_events integer := 0;
  deleted_sessions integer := 0;
  deleted_assignments integer := 0;
  deleted_access_grants integer := 0;
  deleted_students integer := 0;
  deleted_operation_throttles integer := 0;
  deleted_classes integer := 0;
  deleted_anonymous_auth_users integer := 0;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if not pg_try_advisory_xact_lock(hashtext('middleofmath.purge_expired_pilot_data')) then
    return jsonb_build_object('skipped', 'another purge is running');
  end if;

  select array_agg(id) into target_class_ids
  from (
    select id from public.classes
    where purge_after <= p_as_of and purged_at is null
    for update skip locked
  ) target;

  if target_class_ids is null then
    return jsonb_build_object(
      'classesDeleted', 0, 'anonymousAuthUsers', 0, 'students', 0, 'accessGrants', 0,
      'assignments', 0, 'sessions', 0, 'events', 0, 'interpretationRuns', 0,
      'parentExports', 0
    );
  end if;

  perform set_config('middleofmath.purge_context', 'service-role-expired-pilot', true);

  select array_agg(distinct grant_row.auth_uid) into target_auth_uids
  from public.student_access_grants grant_row
  where grant_row.class_id = any(target_class_ids);

  delete from public.parent_report_exports export
  using public.sessions session, public.assignments assignment
  where export.session_id = session.id
    and session.assignment_id = assignment.id
    and assignment.class_id = any(target_class_ids);
  get diagnostics deleted_parent_exports = row_count;

  delete from public.interpretation_runs run
  using public.sessions session, public.assignments assignment
  where run.session_id = session.id
    and session.assignment_id = assignment.id
    and assignment.class_id = any(target_class_ids);
  get diagnostics deleted_interpretation_runs = row_count;

  delete from public.observation_events event
  using public.sessions session, public.assignments assignment
  where event.session_id = session.id
    and session.assignment_id = assignment.id
    and assignment.class_id = any(target_class_ids);
  get diagnostics deleted_events = row_count;

  delete from public.sessions session
  using public.assignments assignment
  where session.assignment_id = assignment.id
    and assignment.class_id = any(target_class_ids);
  get diagnostics deleted_sessions = row_count;

  delete from public.assignments where class_id = any(target_class_ids);
  get diagnostics deleted_assignments = row_count;

  delete from public.pilot_operation_throttles throttle
  where target_auth_uids is not null and throttle.auth_uid = any(target_auth_uids);
  get diagnostics deleted_operation_throttles = row_count;

  delete from public.student_access_grants where class_id = any(target_class_ids);
  get diagnostics deleted_access_grants = row_count;

  delete from public.students where class_id = any(target_class_ids);
  get diagnostics deleted_students = row_count;

  insert into public.pilot_operations_daily (day, app, event_name, event_count)
  values (p_as_of::date, 'system', 'pilot_class.purged', cardinality(target_class_ids))
  on conflict (day, app, event_name) do update
  set event_count = pilot_operations_daily.event_count + excluded.event_count;

  delete from public.classes where id = any(target_class_ids);
  get diagnostics deleted_classes = row_count;

  if target_auth_uids is not null then
    delete from auth.users user_row
    where user_row.id = any(target_auth_uids)
      and coalesce(user_row.is_anonymous, false) = true
      and not exists (
        select 1 from public.student_access_grants grant_row
        where grant_row.auth_uid = user_row.id and grant_row.revoked_at is null
      )
      and not exists (
        select 1 from public.sessions session where session.student_auth_uid = user_row.id
      );
    get diagnostics deleted_anonymous_auth_users = row_count;
  end if;

  perform set_config('middleofmath.purge_context', '', true);
  return jsonb_build_object(
    'classesDeleted', deleted_classes,
    'anonymousAuthUsers', deleted_anonymous_auth_users,
    'students', deleted_students,
    'accessGrants', deleted_access_grants,
    'operationThrottles', deleted_operation_throttles,
    'assignments', deleted_assignments,
    'sessions', deleted_sessions,
    'events', deleted_events,
    'interpretationRuns', deleted_interpretation_runs,
    'parentExports', deleted_parent_exports
  );
end;
$$;

revoke all on function public.purge_expired_pilot_data(timestamptz) from public;
grant execute on function public.purge_expired_pilot_data(timestamptz) to service_role;
