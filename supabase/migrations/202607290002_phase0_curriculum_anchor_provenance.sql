-- Rollback:
-- 1. Restore [4수03-17] and [4수03-20] to the labels from 202607220002.
-- 2. Delete only the five anchor rows inserted below after confirming no draft references them.
--
-- The external DECK6 learning map is editorial provenance only. The approved
-- anchor labels continue to come from the 2022 revised Korean math curriculum.

insert into public.curriculum_anchors (
  anchor_key, grade, semester, label, source
) values
  ('[4수01-08]', 3, 2, '자연수의 사칙계산이 필요한 상황에서 어림셈하기', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수03-18]', 3, 2, '1L와 1mL의 관계를 알고 들이를 두 가지 방식으로 나타내기', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수03-21]', 3, 2, '1kg과 1g의 관계를 알고 무게를 두 가지 방식으로 나타내기', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수03-22]', 3, 2, '1t을 알고 1t과 1kg의 관계 이해하기', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정'),
  ('[4수03-23]', 3, 2, '실생활과 연결하여 무게의 덧셈과 뺄셈하기', '교육부 고시 제2022-33호 [별책 8] 수학과 교육과정')
on conflict (anchor_key) do update
set
  grade = excluded.grade,
  semester = excluded.semester,
  label = excluded.label,
  source = excluded.source,
  active = true;

update public.curriculum_anchors
set label = '들이의 단위를 알고 들이를 어림하고 재기'
where anchor_key = '[4수03-17]';

update public.curriculum_anchors
set label = '무게의 단위를 알고 무게를 어림하고 재기'
where anchor_key = '[4수03-20]';

comment on table public.curriculum_anchors is
  '발행 승인용 한국 수학 교육과정 성취기준 등록부. 외부 학습맵은 교차표 근거이며 이 표의 승인 권한을 대체하지 않는다.';
