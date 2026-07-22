create extension if not exists pgcrypto with schema extensions;

create type public.assignment_status as enum ('draft', 'active', 'closed', 'archived');
create type public.session_status as enum ('in_progress', 'sync_pending', 'completed', 'abandoned');
create type public.content_status as enum ('draft', 'review', 'published', 'retired');

create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '교사',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.teachers is '교사 프로필. 이메일은 auth.users만 원장으로 사용한다.';

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 60),
  grade smallint not null default 3 check (grade between 1 and 12),
  semester smallint not null default 2 check (semester in (1, 2)),
  join_code_lookup text not null unique,
  join_code_hash text not null,
  join_code_rotated_at timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.classes.join_code_lookup is '정규화된 코드의 SHA-256. 코드 원문은 저장하지 않는다.';
comment on column public.classes.join_code_hash is '코드 확인용 bcrypt 해시.';

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  roster_key text not null check (char_length(roster_key) between 1 and 20),
  display_alias text check (display_alias is null or char_length(display_alias) between 1 and 24),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, roster_key)
);

comment on column public.students.roster_key is '클래스 안에서 교사가 부여한 안정 번호. 실명이 아니다.';
comment on column public.students.display_alias is '선택 표시명. 인증·조인 키로 사용하지 않는다.';

create table public.student_access_grants (
  id uuid primary key default gen_random_uuid(),
  auth_uid uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (auth_uid, student_id)
);

create unique index student_access_one_active_identity
  on public.student_access_grants(auth_uid)
  where revoked_at is null;

create table public.diagnosis_sets (
  id uuid primary key default gen_random_uuid(),
  set_key text not null,
  version text not null,
  checksum text not null,
  status public.content_status not null default 'draft',
  manifest jsonb not null,
  content jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (set_key, version),
  unique (set_key, version, checksum),
  check (jsonb_typeof(manifest) = 'object'),
  check (jsonb_typeof(content) = 'object')
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  diagnosis_set_id uuid not null references public.diagnosis_sets(id) on delete restrict,
  diagnosis_set_version text not null,
  status public.assignment_status not null default 'draft',
  opens_at timestamptz not null default now(),
  closes_at timestamptz,
  created_by uuid not null references public.teachers(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (closes_at is null or closes_at > opens_at)
);

create table public.sessions (
  id uuid primary key,
  assignment_id uuid not null references public.assignments(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  student_auth_uid uuid not null references auth.users(id) on delete restrict,
  client_session_id uuid not null,
  status public.session_status not null default 'in_progress',
  started_at timestamptz not null,
  completed_at timestamptz,
  last_event_seq integer not null default 0 check (last_event_seq >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, client_session_id)
);

create unique index sessions_one_active_attempt
  on public.sessions(assignment_id, student_id)
  where status in ('in_progress', 'sync_pending');

create table public.observation_events (
  id uuid primary key,
  session_id uuid not null references public.sessions(id) on delete restrict,
  client_event_id uuid not null unique,
  client_seq integer not null check (client_seq > 0),
  event_type text not null check (event_type in (
    'session_started', 'choice_selected', 'choice_changed',
    'uncertainty_selected', 'judgment_confirmed', 'session_completed'
  )),
  judgment_id text,
  interaction_type text not null,
  interaction_version integer not null check (interaction_version > 0),
  diagnosis_set_key text not null,
  diagnosis_set_version text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (session_id, client_seq),
  check (jsonb_typeof(payload) = 'object')
);

comment on table public.observation_events is '학생 판단 관찰 원자료. INSERT만 허용하는 append-only 로그.';

create table public.interpretation_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  engine_version text not null,
  diagnosis_set_version text not null,
  generated_at timestamptz not null default now(),
  report jsonb not null,
  unique (session_id, engine_version, diagnosis_set_version)
);

create table public.parent_report_exports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  interpretation_run_id uuid not null references public.interpretation_runs(id) on delete cascade,
  reviewed_by uuid not null references public.teachers(id) on delete restrict,
  report jsonb not null,
  generated_at timestamptz not null default now()
);

comment on table public.parent_report_exports is '교사가 검토해 출력한 학부모 공유용 문장. 교사용 원본 리포트와 분리한다.';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger teachers_touch_updated_at before update on public.teachers
for each row execute function public.touch_updated_at();
create trigger classes_touch_updated_at before update on public.classes
for each row execute function public.touch_updated_at();
create trigger students_touch_updated_at before update on public.students
for each row execute function public.touch_updated_at();
create trigger sessions_touch_updated_at before update on public.sessions
for each row execute function public.touch_updated_at();

create or replace function public.protect_session_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.assignment_id <> old.assignment_id
    or new.student_id <> old.student_id
    or new.student_auth_uid <> old.student_auth_uid
    or new.client_session_id <> old.client_session_id
    or new.started_at <> old.started_at then
    raise exception 'session identity fields are immutable';
  end if;
  return new;
end;
$$;

create trigger sessions_protect_identity before update on public.sessions
for each row execute function public.protect_session_identity();

create or replace function public.create_teacher_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.is_anonymous, false) = false then
    insert into public.teachers (id, display_name)
    values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), '교사'))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger auth_user_create_teacher
after insert on auth.users
for each row execute function public.create_teacher_profile();

create or replace function public.generate_join_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  generated text := '';
  index_value integer;
begin
  for position in 1..6 loop
    index_value := 1 + floor(random() * length(alphabet))::integer;
    generated := generated || substr(alphabet, index_value, 1);
  end loop;
  return generated;
end;
$$;

create or replace function public.create_class(
  p_name text,
  p_grade smallint default 3,
  p_semester smallint default 2
)
returns table (class_id uuid, class_name text, join_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated text;
  inserted_id uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.teachers where id = auth.uid()) then
    raise exception 'teacher authentication required';
  end if;
  loop
    generated := public.generate_join_code();
    begin
      insert into public.classes (
        teacher_id, name, grade, semester, join_code_lookup, join_code_hash
      ) values (
        auth.uid(), trim(p_name), p_grade, p_semester,
        encode(extensions.digest(generated, 'sha256'), 'hex'),
        extensions.crypt(generated, extensions.gen_salt('bf'))
      ) returning id into inserted_id;
      exit;
    exception when unique_violation then
      -- 짧은 코드 충돌이면 새 코드를 만든다.
    end;
  end loop;
  return query select inserted_id, trim(p_name), generated;
end;
$$;

create or replace function public.rotate_class_join_code(p_class_id uuid)
returns table (class_id uuid, join_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated text;
begin
  if not exists (
    select 1 from public.classes where id = p_class_id and teacher_id = auth.uid()
  ) then
    raise exception 'class not found';
  end if;
  loop
    generated := public.generate_join_code();
    begin
      update public.classes
      set join_code_lookup = encode(extensions.digest(generated, 'sha256'), 'hex'),
          join_code_hash = extensions.crypt(generated, extensions.gen_salt('bf')),
          join_code_rotated_at = now()
      where id = p_class_id;
      exit;
    exception when unique_violation then
      -- 짧은 코드 충돌이면 새 코드를 만든다.
    end;
  end loop;
  return query select p_class_id, generated;
end;
$$;

create or replace function public.join_class(p_join_code text, p_roster_key text)
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
  normalized_code text := upper(regexp_replace(coalesce(p_join_code, ''), '[^A-Z0-9]', '', 'g'));
  normalized_key text := trim(coalesce(p_roster_key, ''));
  found_class public.classes%rowtype;
  found_student public.students%rowtype;
begin
  if auth.uid() is null then
    raise exception 'anonymous authentication required';
  end if;
  if normalized_code !~ '^[A-Z0-9]{6}$' or char_length(normalized_key) not between 1 and 20 then
    raise exception 'invalid join credentials';
  end if;

  select * into found_class
  from public.classes
  where join_code_lookup = encode(extensions.digest(normalized_code, 'sha256'), 'hex')
    and active = true;

  if found_class.id is null
    or extensions.crypt(normalized_code, found_class.join_code_hash) <> found_class.join_code_hash then
    raise exception 'invalid join credentials';
  end if;

  select * into found_student
  from public.students
  where students.class_id = found_class.id
    and students.roster_key = normalized_key
    and active = true;

  if found_student.id is null then
    raise exception 'invalid join credentials';
  end if;

  update public.student_access_grants
  set revoked_at = now()
  where student_access_grants.auth_uid = auth.uid()
    and student_access_grants.revoked_at is null
    and student_access_grants.student_id <> found_student.id;

  insert into public.student_access_grants (auth_uid, class_id, student_id)
  values (auth.uid(), found_class.id, found_student.id)
  on conflict on constraint student_access_grants_auth_uid_student_id_key
  do update set class_id = excluded.class_id, revoked_at = null, granted_at = now();

  return query select found_student.id, found_class.id, found_class.name,
    found_student.roster_key, found_student.display_alias;
end;
$$;

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
  event_received_at timestamptz;
begin
  if auth.uid() is null or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 50 then
    raise exception 'invalid event batch';
  end if;

  for item in select value from jsonb_array_elements(p_events) loop
    select * into target_session
    from public.sessions
    where id = (item ->> 'session_id')::uuid
      and student_auth_uid = auth.uid();

    if target_session.id is null then
      raise exception 'session not found';
    end if;

    select d.set_key, d.version into expected_set_key, expected_set_version
    from public.assignments a
    join public.diagnosis_sets d on d.id = a.diagnosis_set_id
    where a.id = target_session.assignment_id;

    if item ->> 'diagnosis_set_id' <> expected_set_key
      or item ->> 'diagnosis_set_version' <> expected_set_version then
      raise exception 'event content version does not match assignment';
    end if;

    insert into public.observation_events (
      id, session_id, client_event_id, client_seq, event_type, judgment_id,
      interaction_type, interaction_version, diagnosis_set_key,
      diagnosis_set_version, payload, occurred_at
    ) values (
      (item ->> 'id')::uuid,
      target_session.id,
      (item ->> 'client_event_id')::uuid,
      (item ->> 'client_seq')::integer,
      item ->> 'event_type',
      nullif(item ->> 'judgment_id', ''),
      item ->> 'interaction_type',
      (item ->> 'interaction_version')::integer,
      item ->> 'diagnosis_set_id',
      item ->> 'diagnosis_set_version',
      coalesce(item -> 'payload', '{}'::jsonb),
      (item ->> 'occurred_at')::timestamptz
    )
    on conflict on constraint observation_events_client_event_id_key do nothing
    returning observation_events.received_at into event_received_at;

    if event_received_at is null then
      select observation_events.received_at into event_received_at
      from public.observation_events
      where observation_events.client_event_id = (item ->> 'client_event_id')::uuid
        and observation_events.session_id = target_session.id;
    end if;

    if event_received_at is null then
      raise exception 'event id conflict';
    end if;

    client_event_id := (item ->> 'client_event_id')::uuid;
    received_at := event_received_at;
    return next;
    event_received_at := null;
  end loop;
end;
$$;

create or replace function public.prevent_observation_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'observation_events are append-only';
end;
$$;

create trigger observation_events_append_only
before update or delete on public.observation_events
for each row execute function public.prevent_observation_event_mutation();

alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.student_access_grants enable row level security;
alter table public.diagnosis_sets enable row level security;
alter table public.assignments enable row level security;
alter table public.sessions enable row level security;
alter table public.observation_events enable row level security;
alter table public.interpretation_runs enable row level security;
alter table public.parent_report_exports enable row level security;

create policy teacher_own_profile on public.teachers
for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy teacher_own_classes on public.classes
for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy teacher_own_students on public.students
for all to authenticated
using (exists (select 1 from public.classes c where c.id = students.class_id and c.teacher_id = auth.uid()))
with check (exists (select 1 from public.classes c where c.id = students.class_id and c.teacher_id = auth.uid()));

create policy student_read_self on public.students
for select to authenticated
using (exists (
  select 1 from public.student_access_grants g
  where g.student_id = students.id and g.auth_uid = auth.uid() and g.revoked_at is null
));

create policy teacher_read_access_grants on public.student_access_grants
for select to authenticated
using (exists (select 1 from public.classes c where c.id = student_access_grants.class_id and c.teacher_id = auth.uid()));

create policy student_read_own_access_grant on public.student_access_grants
for select to authenticated
using (auth_uid = auth.uid() and revoked_at is null);

create policy published_content_read on public.diagnosis_sets
for select to authenticated using (status = 'published');

create policy teacher_content_read on public.diagnosis_sets
for select to authenticated using (exists (select 1 from public.teachers t where t.id = auth.uid()));

create policy teacher_own_assignments on public.assignments
for all to authenticated
using (exists (select 1 from public.classes c where c.id = assignments.class_id and c.teacher_id = auth.uid()))
with check (
  created_by = auth.uid()
  and exists (select 1 from public.classes c where c.id = assignments.class_id and c.teacher_id = auth.uid())
);

create policy student_read_active_assignments on public.assignments
for select to authenticated
using (
  status = 'active'
  and opens_at <= now()
  and (closes_at is null or closes_at >= now())
  and exists (
    select 1 from public.student_access_grants g
    where g.class_id = assignments.class_id and g.auth_uid = auth.uid() and g.revoked_at is null
  )
);

create policy teacher_own_sessions on public.sessions
for all to authenticated
using (exists (
  select 1 from public.assignments a join public.classes c on c.id = a.class_id
  where a.id = sessions.assignment_id and c.teacher_id = auth.uid()
))
with check (exists (
  select 1 from public.assignments a join public.classes c on c.id = a.class_id
  where a.id = sessions.assignment_id and c.teacher_id = auth.uid()
));

create policy student_own_session_select on public.sessions
for select to authenticated using (student_auth_uid = auth.uid());

create policy student_own_session_insert on public.sessions
for insert to authenticated with check (
  student_auth_uid = auth.uid()
  and exists (
    select 1
    from public.student_access_grants g
    join public.assignments a on a.class_id = g.class_id
    where g.auth_uid = auth.uid() and g.student_id = sessions.student_id
      and g.revoked_at is null and a.id = sessions.assignment_id and a.status = 'active'
  )
);

create policy student_own_session_update on public.sessions
for update to authenticated
using (student_auth_uid = auth.uid())
with check (student_auth_uid = auth.uid());

create policy teacher_read_observation_events on public.observation_events
for select to authenticated using (exists (
  select 1
  from public.sessions s
  join public.assignments a on a.id = s.assignment_id
  join public.classes c on c.id = a.class_id
  where s.id = observation_events.session_id and c.teacher_id = auth.uid()
));

create policy teacher_own_interpretations on public.interpretation_runs
for all to authenticated
using (exists (
  select 1 from public.sessions s
  join public.assignments a on a.id = s.assignment_id
  join public.classes c on c.id = a.class_id
  where s.id = interpretation_runs.session_id and c.teacher_id = auth.uid()
))
with check (exists (
  select 1 from public.sessions s
  join public.assignments a on a.id = s.assignment_id
  join public.classes c on c.id = a.class_id
  where s.id = interpretation_runs.session_id and c.teacher_id = auth.uid()
));

create policy teacher_own_parent_exports on public.parent_report_exports
for all to authenticated
using (reviewed_by = auth.uid())
with check (
  reviewed_by = auth.uid()
  and exists (
    select 1 from public.sessions s
    join public.assignments a on a.id = s.assignment_id
    join public.classes c on c.id = a.class_id
    where s.id = parent_report_exports.session_id and c.teacher_id = auth.uid()
  )
);

revoke all on function public.create_class(text, smallint, smallint) from public;
revoke all on function public.rotate_class_join_code(uuid) from public;
revoke all on function public.join_class(text, text) from public;
revoke all on function public.append_observation_events(jsonb) from public;
grant execute on function public.create_class(text, smallint, smallint) to authenticated;
grant execute on function public.rotate_class_join_code(uuid) to authenticated;
grant execute on function public.join_class(text, text) to authenticated;
grant execute on function public.append_observation_events(jsonb) to authenticated;

grant select, insert, update on public.teachers to authenticated;
grant select, insert, update on public.classes to authenticated;
grant select, insert, update on public.students to authenticated;
grant select on public.student_access_grants to authenticated;
grant select on public.diagnosis_sets to authenticated;
grant select, insert, update on public.assignments to authenticated;
grant select, insert, update on public.sessions to authenticated;
grant select on public.observation_events to authenticated;
grant select, insert, update on public.interpretation_runs to authenticated;
grant select, insert, update on public.parent_report_exports to authenticated;

revoke update, delete, truncate on public.observation_events from anon, authenticated;
