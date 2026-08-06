-- create_student declares an `active` output column, so the unqualified
-- `active = true` in its ownership check resolved to that variable instead of
-- classes.active and every call raised 42702. No test covered the function, so
-- adding a student failed only in a real browser. Qualify the column.

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
    select 1 from public.classes owned_class
    where owned_class.id = p_class_id
      and owned_class.teacher_id = auth.uid()
      and owned_class.active = true
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
