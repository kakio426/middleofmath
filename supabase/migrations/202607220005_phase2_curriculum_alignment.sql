create or replace function public.guard_diagnosis_curriculum_alignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
    where not exists (
      select 1 from public.curriculum_anchors approved
      where approved.anchor_key = anchor ->> 'id'
        and approved.active
        and approved.grade = (new.content #>> '{manifest,grade}')::integer
        and approved.semester = (new.content #>> '{manifest,semester}')::integer
    )
  ) then raise exception 'curriculum anchor grade or semester mismatch'; end if;
  return new;
end;
$$;

create trigger diagnosis_sets_curriculum_alignment_guard
before insert on public.diagnosis_sets
for each row execute function public.guard_diagnosis_curriculum_alignment();
