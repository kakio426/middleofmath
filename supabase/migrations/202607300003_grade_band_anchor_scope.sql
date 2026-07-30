-- Rollback:
-- 1. Restore guard_diagnosis_curriculum_alignment() from 202607300002.
-- 2. Restore the shared_across_semesters column comment from 202607300002.
-- 3. Drop shared_across_grade_band and grade_band only after confirming that
--    no approved draft or published diagnosis set relies on grade-band scope.

alter table public.curriculum_anchors
  add column grade_band text,
  add column shared_across_grade_band boolean not null default false,
  add constraint curriculum_anchors_grade_band_check
    check (grade_band is null or grade_band ~ '^(1-2|3-4|5-6)$');

update public.curriculum_anchors
set grade_band = '3-4'
where anchor_key like '[4수%';

comment on column public.curriculum_anchors.grade_band is
  '교육과정 원문이 제시한 학년군 범위. 이 값만으로 특정 학년의 사용을 승인하지 않는다.';

comment on column public.curriculum_anchors.shared_across_grade_band is
  '검수자가 같은 학년군의 다른 학년에서도 이 앵커를 쓰도록 명시적으로 승인했을 때만 true.';

comment on column public.curriculum_anchors.shared_across_semesters is
  '같은 학년의 다른 학기에서도 쓰도록 명시적으로 승인한 앵커. 학년 간 공유는 shared_across_grade_band에서 별도 승인한다.';

create or replace function public.guard_diagnosis_curriculum_alignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from jsonb_array_elements(new.content -> 'curriculumAnchors') anchor
    where not exists (
      select 1
      from public.curriculum_anchors approved
      where approved.anchor_key = anchor ->> 'id'
        and approved.active
        and (
          approved.grade = (new.content #>> '{manifest,grade}')::integer
          or (
            approved.shared_across_grade_band
            and approved.grade_band is not null
            and (new.content #>> '{manifest,grade}')::integer
              between split_part(approved.grade_band, '-', 1)::integer
              and split_part(approved.grade_band, '-', 2)::integer
          )
        )
        and (
          approved.shared_across_semesters
          or approved.semester
            = (new.content #>> '{manifest,semester}')::integer
        )
    )
  ) then
    raise exception 'curriculum anchor grade or semester mismatch';
  end if;
  return new;
end;
$$;
