-- A real-class pilot assigns one unit at a time. Existing assignments keep the
-- previous whole-set behavior when unit_id is null.

alter table public.assignments
  add column unit_id text;

alter table public.assignments
  add constraint assignments_unit_id_trimmed
  check (
    unit_id is null
    or (
      char_length(trim(unit_id)) > 0
      and unit_id = trim(unit_id)
    )
  );

comment on column public.assignments.unit_id is
  '배정한 단원 ID. null은 이전 발행본과의 호환을 위한 학기 전체 배정이다.';

create or replace function public.guard_assignment_content_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  stored_version text;
  stored_status public.content_status;
  stored_content jsonb;
  assigned_grade integer;
  assigned_semester integer;
begin
  if tg_op = 'INSERT' and new.unit_id is null then
    raise exception 'new assignment requires a unit';
  end if;

  if tg_op = 'UPDATE' and (
    new.diagnosis_set_id <> old.diagnosis_set_id
    or new.diagnosis_set_version <> old.diagnosis_set_version
  ) then raise exception 'assignment content version is immutable'; end if;
  if tg_op = 'UPDATE' and new.unit_id is distinct from old.unit_id then
    raise exception 'assignment unit is immutable';
  end if;

  select version, status, content
  into stored_version, stored_status, stored_content
  from public.diagnosis_sets
  where id = new.diagnosis_set_id;

  if stored_version is null
    or stored_version <> new.diagnosis_set_version
    or stored_status <> 'published' then
    raise exception 'assignment must reference the exact published content version';
  end if;

  if new.unit_id is not null and not exists (
    select 1
    from jsonb_array_elements(stored_content #> '{manifest,units}') unit
    where unit ->> 'id' = new.unit_id
  ) then
    raise exception 'assignment unit is not in the published content';
  end if;

  if new.unit_id is not null and not exists (
    select 1
    from jsonb_array_elements(stored_content -> 'judgments') judgment
    where judgment ->> 'unitId' = new.unit_id
  ) then
    raise exception 'assignment unit has no judgments';
  end if;

  select grade, semester
  into assigned_grade, assigned_semester
  from public.classes
  where id = new.class_id;

  if assigned_grade is null
    or assigned_grade <> (stored_content #>> '{manifest,grade}')::integer
    or assigned_semester <> (stored_content #>> '{manifest,semester}')::integer then
    raise exception 'assignment grade and semester must match the class';
  end if;

  return new;
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
  expected_unit_id text;
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

    select diagnosis.set_key, diagnosis.version, assignment.unit_id, diagnosis.content
    into expected_set_key, expected_set_version, expected_unit_id, expected_content
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
        select 1
        from jsonb_array_elements(expected_content -> 'judgments') judgment
        where judgment ->> 'id' = item ->> 'judgment_id'
          and (
            expected_unit_id is null
            or judgment ->> 'unitId' = expected_unit_id
          )
      ) then raise exception 'judgment is outside the assignment scope'; end if;
      if exists (
        select 1 from public.observation_events event
        where event.session_id = target_session.id
          and event.event_type = 'judgment_confirmed'
          and event.judgment_id = item ->> 'judgment_id'
      ) then raise exception 'judgment already confirmed'; end if;
    end if;

    if item_event_type = 'session_completed' then
      select count(*) into expected_judgment_count
      from jsonb_array_elements(expected_content -> 'judgments') judgment
      where expected_unit_id is null
        or judgment ->> 'unitId' = expected_unit_id;
      select count(distinct event.judgment_id) into confirmed_judgment_count
      from public.observation_events event
      where event.session_id = target_session.id
        and event.event_type = 'judgment_confirmed';
      if confirmed_judgment_count <> expected_judgment_count then
        raise exception 'session completion requires every assigned judgment';
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

revoke all on function public.append_observation_events(jsonb) from public;
grant execute on function public.append_observation_events(jsonb) to authenticated;
