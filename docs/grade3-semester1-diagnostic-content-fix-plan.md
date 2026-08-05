# 3학년 1학기 진단 콘텐츠 결함 수정 계획 (deepseek 작업 지시서)

## 운영 원칙

deepseek는 콘텐츠/코드 수정만 담당한다. 계획 수립과 검증(diff 리뷰 +
테스트 실행)은 Claude가 맡는다. 작업을 마치면 아래 "완료 기준"을 스스로
확인한 뒤 알린다. 이후 Claude가 같은 기준으로 재검증하고, 남은 결함이
있으면 이 문서를 갱신해서 다시 넘긴다.

**이번 라운드 범위는 오답 rationale·derivation 텍스트 수정으로
한정한다.** 이 문서에 없는 범위(schema, domain 타입, crosswalk, anchor
registry, 새 문항 추가)는 손대지 않는다.

## 배경

`npx vitest run packages/content/src` 기준 437/438 통과,
`grade3-semester1-diagnostic-gap.test.ts` 1건 실패. 원인은
`packages/content/src/grade3-semester1-rationales.ts`에 새로 추가된
오답 데이터 72건 중 9건이 무결성 게이트
(`packages/content/src/diagnostic-integrity.ts`)의 error 조건에 걸림.
테스트가 아니라 콘텐츠 쪽 결함이다.

## 수정 항목 A — derivation에 계산식·판단 근거 없음 (7건)

검증 규칙: `diagnostic-integrity.ts:69-71` `hasMechanisticDerivation`.
derivation 문자열에 숫자/연산 기호가 있거나 `"~로 판단"` /
`"~로 취급"` 문구가 있어야 통과한다.

대상 (모두 `grade3-semester1-rationales.ts`):

- 61행 `g3s1-pf-01 / line`
- 62행 `g3s1-pf-01 / ray`
- 94행 `g3s1-pf-06 / unequal`
- 106행 `g3s1-pf-07 / parallelogram`
- 107행 `g3s1-pf-07 / rhombus`
- 108행 `g3s1-pf-08 / square`
- 109행 `g3s1-pf-08 / rectangle`

조치: 각 derivation 문장 끝을 `"~로 판단했습니다"` 또는
`"~로 취급했습니다"` 형태로 바꿔서, 숫자가 없는 도형 분류 문항도
게이트를 통과하게 한다. 어떤 오개념으로 그 오답을 골랐는지에 대한
의미는 그대로 유지하고 어미만 바꾼다.

## 수정 항목 B — rationale 텍스트 복붙 (2쌍, 4건)

검증 규칙: `diagnostic-integrity.ts:343-356`. 서로 다른 오답의
rationale/derivation 정규화 텍스트가 동일하면 error.

- 256행(`g3s1-tim-03`) ↔ 258행(`g3s1-tim-04`): rationale 완전 동일
- 286행(`g3s1-dec-03`) ↔ 288행(`g3s1-dec-04`): rationale 완전 동일

조치: 각 문항의 구체적 숫자(시각, 소수)를 rationale 문장에도 반영해서
두 문항의 rationale이 서로 달라지게 한다. derivation은 이미 숫자가
달라 통과 상태이므로 rationale만 고치면 된다.

## 재발 방지 규칙 (앞으로 오답을 추가할 때 지킬 것)

1. 오답을 새로 추가할 때 rationale은 그 문항의 구체적 맥락(숫자·도형
   이름 등)을 최소 한 곳 포함해서, 비슷한 문항이라도 문장이 100%
   겹치지 않게 쓴다.
2. 숫자가 없는 분류·판단형 문항의 derivation은 반드시
   `"~로 판단했습니다"` / `"~로 취급했습니다"` 어미로 마무리한다.
3. 오답 데이터를 추가·수정한 뒤에는 최소
   `npx vitest run packages/content/src/grade3-semester1-diagnostic-gap.test.ts`
   를 직접 돌려 통과를 확인하고 넘긴다. 게이트가 로컬에서 바로 걸리는
   항목이라 CI까지 안 가도 잡을 수 있다.

## 완료 기준

- [x] `npx vitest run packages/content/src` 전체 통과 (438/438)
- [x] `npm run typecheck --workspace @middle-of-math/content` 클린
- [x] 이번에 수정한 9건 외에 새로 깨진 테스트 없음 (diff가
      rationale/derivation 텍스트 범위에만 한정됨을 Claude가 diff로
      확인)

## 이번 라운드에서 다루지 않는 별도 이슈 (참고용, 코드 범위 아님)

`tmp/goe-cookies.txt`에 goe.go.kr 세션 쿠키로 보이는 값이 gitignore
안 된 채 남아 있음. 커밋 대상 아니며 이번 코드 수정 범위와 무관하다.
삭제하거나 `.gitignore`에 `tmp/`, `.codex-work/` 추가가 필요하다는
점만 별도로 인지하고 있을 것.
