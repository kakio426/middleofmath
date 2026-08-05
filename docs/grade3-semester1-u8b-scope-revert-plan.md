# 3학년 1학기 U8b 범위 분리 계획 (deepseek 작업 지시서)

## 배경

현재 작업트리의 `grade3-semester1.ts` 등 13개 파일은
`docs/implementation-decisions.md:162-167` (D4)와
`docs/grade3-semester1-content-coverage.md:92-97`이 "공식 학기 배치와
문항별 관찰 행동을 확인한 뒤 U8b에서 별도 버전으로 추가한다"고 못박은
4개 단원(평면도형·시간·덧셈과 뺄셈·소수)을, 그 검수 없이
`grade3-semester1@1.0.0`에 병합한 상태다. 프로젝트 소유자 확인 결과 이
병합에 대한 승인 이력이 없다.

결정: **`1.0.0`을 문서에 고정된 원래 범위(4단원·8단계·16판단, checksum
`36075f86f51e8b7c19f5df87b681a1b98fc9db84d2d0415d6fcd48d11aa1d56d`)로
복원한다.** 새로 만든 4개 단원 콘텐츠는 버리지 않고 별도의 미발행
초안으로 보존한다.

git HEAD(마지막 커밋) 상태의 `grade3-semester1.ts` checksum이 이미
`36075f86...`와 일치함을 확인했다 — 즉 "원래 범위"는 HEAD 그대로다.

## 운영 원칙

기존과 동일하다. deepseek는 코드 작업만 담당하고, 계획·검증(diff 리뷰 +
테스트 실행)은 Claude가 맡는다.

## 작업 순서 (반드시 이 순서대로, 0번을 건너뛰지 말 것)

### 0. 안전장치 먼저

아래 13개 파일의 **현재(U8b 병합) 상태를 먼저 복구 가능하게 저장**한다
(임시 브랜치, `git stash`, 파일 복사 등 편한 방법 아무거나). 되돌리기
전에 반드시 지금 상태를 다시 꺼내볼 수 있게 만들어 둘 것 — 이 작업
자체가 git 이력에 없는 미커밋 변경을 지우는 되돌리기이기 때문이다.

### 1. 새 4개 단원 콘텐츠를 초안 파일로 분리 보존

평면도형(`plane-figures`)·시간(`time`)·덧셈과 뺄셈
(`addition-subtraction`)·소수(`fraction-decimal`) 4개 단원의 학습
단계, 신호, 판단, 오답 rationale/derivation을 **어디서도 import되지
않는 별도 파일**(예: `packages/content/src/grade3-semester1-u8b-draft.ts`)
로 옮긴다.

- 오답 텍스트는 이번 세션에서 이미 고친 버전(어미 `"~로
  판단했습니다"`, rationale 복붙 해소)을 그대로 쓴다 — 품질 수정
  작업은 버리지 않는다.
- 파일 맨 위에 "미검토 초안 — D4 조건(공식 학기 배치·문항별 관찰
  행동 확인) 충족 전 발행 금지" 주석을 남긴다.
- 이 초안이 `blueprint-registry.ts`, `curriculum-anchor-registry.ts`의
  `grade3Semester1AnchorRegistry`/`curriculumAnchorSetAllowList`,
  학생·교사 런타임 어디에도 연결되지 않아야 한다.

### 2. 나머지 파일을 HEAD로 복원

아래 파일은 git HEAD 상태와 정확히 일치해야 한다 (= 원래 U8 범위):

- `packages/content/src/grade3-semester1.ts`
- `packages/content/src/grade3-semester1-rationales.ts`
- `packages/content/src/grade3-semester1-coverage.ts`
- `packages/content/src/grade3-semester1-crosswalk.json`
- `packages/content/src/curriculum-anchor-registry.ts`
- `packages/content/src/curriculum-crosswalk.ts`
- `packages/content/src/upstream/kr-learning-map.g3s1.snapshot.json`
- `packages/content/src/grade3-semester1.test.ts`
- `packages/content/src/grade3-semester1-diagnostic-gap.test.ts`
- `packages/content/src/grade3-semester1-rationale.test.ts`
- `packages/content/src/curriculum-anchor-registry.test.ts`

`schema.ts`와 `packages/domain/src/types.ts`는 새 시각자료 종류
(`line-segment-ray`, `clock-face`, `rightAngleIndexes`)를 추가한
것으로, 콘텐츠가 아니라 스키마 능력 추가라 그 자체는 D4 위반이 아니다.
1번 초안 파일이 이 타입을 계속 쓴다면 스키마·타입은 유지하고, 초안
파일에서도 안 쓰게 정리한다면 같이 되돌린다. 최종적으로 이 스키마
변경을 실제로 쓰는 곳이 초안 파일뿐이라는 걸 확인할 것.

### 3. 복원 확인

- `grade3Semester1Diagnosis.manifest.checksum ===
  "36075f86f51e8b7c19f5df87b681a1b98fc9db84d2d0415d6fcd48d11aa1d56d"`
- 단원 4개(곱셈·나눗셈·분수·길이), 학습 단계 8개, 판단 16개, 오답
  32개로 복귀
- `npx vitest run packages/content/src packages/domain/src` 전체 통과
- `npm run typecheck --workspace @middle-of-math/content --workspace
  @middle-of-math/domain` 클린
- `inspectDiagnosticIntegrity` 직접 호출 시 `valid: true`, warning
  4개(기존과 동일), error 0개

## 완료 기준

- [ ] `1.0.0`이 `docs/grade3-semester1-content-coverage.md`,
      `docs/implementation-decisions.md` D4와 정확히 일치
- [ ] U8b 초안(4단원 콘텐츠 + 이번 세션 품질 수정분)이 별도 파일에
      보존되고 어디서도 import되지 않음
- [ ] 전체 vitest·typecheck 통과
- [ ] `docs/` 파일은 수정하지 않음 (이미 맞는 내용이므로 되돌릴 대상이
      아니라 기준점)

## 다음 라운드에서 다룰 것 (이번 범위 아님)

U8b를 정식으로 추가하려면 D4가 요구하는 "공식 학기 배치 확인"과
"문항별 관찰 행동 확인"을 사람이 먼저 검수해야 한다. 이번 라운드에서는
진행하지 않는다.
