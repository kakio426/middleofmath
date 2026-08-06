-- GoTrue's administrator invitation inserts the auth user first and sets
-- invited_at in a second update. Raising on insert therefore blocked the only
-- supported way to create a pilot teacher. The profile is now created when the
-- invitation lands, so an uninvited account still never gains a teacher profile.

create or replace function public.create_teacher_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;
  if new.invited_at is null then
    return new;
  end if;
  insert into public.teachers (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), '교사'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists auth_user_invite_create_teacher on auth.users;

create trigger auth_user_invite_create_teacher
after update of invited_at on auth.users
for each row
when (old.invited_at is null and new.invited_at is not null)
execute function public.create_teacher_profile();
