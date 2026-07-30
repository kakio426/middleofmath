-- Rollback:
-- delete from public.curriculum_anchors where anchor_key = '[4수03-16]'
-- after confirming no draft references the row.
--
-- The 3-4 grade-band source attests the code and module "길이".
-- Semester 1 placement is a Middle of Math editorial decision.

insert into public.curriculum_anchors (
  anchor_key, grade, semester, label, source
) values (
  '[4수03-16]',
  3,
  1,
  '길이',
  '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'
)
on conflict (anchor_key) do nothing;
