do $$
declare
  has_unsafe_teacher boolean;
begin
  if to_regclass('public.teachers') is null then
    return;
  end if;

  execute $query$
    select exists (
      select 1
      from public.teachers teacher
      join auth.users user_row on user_row.id = teacher.id
      where coalesce(user_row.is_anonymous, false) = true
        or user_row.invited_at is null
    )
  $query$ into has_unsafe_teacher;

  if has_unsafe_teacher then
    raise exception
      'production migration blocked: every teacher must be a non-anonymous invited user';
  end if;
end;
$$;
