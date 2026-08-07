# 3학년 2학기 전체 진단 콘텐츠 커버리지

상태: 제작·검수 중
대상 세트: `grade3-semester2`
교육과정: 2022 개정 교육과정

## 목적

이 문서는 3학년 2학기 문제은행이 단원 이름만 나열하지 않고, 학생의 수학적 판단을 작은 학습 단계로 나누어 빠짐없이 관찰하도록 하는 제작 계약이다.

`DECK6/korean-elementary-learning-map`은 성취기준과 주제 ID를 찾는 색인으로 사용한다. 학생 문항, 오답 해석, 학년·학기 배치는 해당 저장소에서 복사하지 않는다. 학년·학기 배치와 실제 평가 범위는 교육부 고시와 2025학년도 경기도교육청 3학년 2학기 수업·평가 계획을 우선한다.

## 근거 자료

- [교육부 고시 제2022-33호 별책 8 수학과 교육과정](https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&m=040401)
- [경기도교육청, 2025학년도 초등학교 3~4학년 2학기 수업·평가 계획 예시 자료](https://www.goe.go.kr/resource/goe/na/bbs_2675/2025/07/f4c15fac-ae7b-46aa-8e16-b8d86b710d44.pdf)
- [`DECK6/korean-elementary-learning-map`](https://github.com/DECK6/korean-elementary-learning-map/tree/3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c) 데이터 `kr-full-depth-v0.4`, 온톨로지 `0.3.0-p3`, 커밋 `3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c`

### 고정 학습맵 교차표

외부 학습맵은 런타임 진단 데이터가 아니라 제작·검수용 sidecar다. `packages/content/src/upstream/kr-learning-map.snapshot.json`에는 원문 제목·요약·평가 문항을 복사하지 않고 ID, 성취기준 코드, 학년군·교과·영역, 검증 상태, 관계 종류와 강도만 보존한다.

- 원본 상태: `integrated-workstream-candidate`, `public-doc-derived`, 독립 비공식 자료
- 원본이 명시한 제한: 개별 학습자 진단을 지원하지 않음
- 파일 고정값:
  - `curriculum-standards.json`: `aaaebb939c17fcc11a808fef3ae8164823425f74bfe8092a4a66941cb8c33335`
  - `topics.json`: `80aa059ed305ce4cbeb0df45436c0b204a42cd208204c1cc1e5332c70c4bf5f3`
  - `dependencies.json`: `e09a6137bb70edf2a0b0928c05a4bd3f102c80845846ff13b10767ef4ceafe2c`
- 로컬 교차표: 성취기준 17개 `matched`, 진단 단계 32개 `topic-partial`
- 선수 후보: 단원 시작 단계 6개에만 연결하며 모두 `advisory`이고 로컬 단계 ID를 자동 생성하지 않음
- 표준 빌드·테스트·발행은 네트워크를 사용하지 않는다. 갱신 검토 때만 `npm run refresh:crosswalk -- --commit <40자리 커밋>`을 실행하고, `--write` 뒤에는 교차표를 사람이 다시 검수한다.

교차표 상태는 성취기준에 `matched | code-only | gap | local-only`, 단계에 `topic-matched | topic-partial | gap | local-only`를 사용한다. `matched`는 코드와 범위를 직접 대조했다는 뜻이지, 외부 저장소가 Middle of Math 문항이나 학생 진단을 승인했다는 뜻이 아니다.

## 단원별 공식 앵커

| 순서 | 단원 | 2022 개정 성취기준 앵커 | 반드시 관찰할 범위 |
|---:|---|---|---|
| 1 | 곱셈 | `[4수01-04]`, `[4수01-08]` | 세 자리 수와 한 자리 수의 곱셈, 두 자리 수끼리의 곱셈, 계산 결과 어림 |
| 2 | 나눗셈 | `[4수01-05]`, `[4수01-06]`, `[4수01-08]` | 나눗셈의 의미와 곱셈 관계, 한 자리 수로 나누는 계산, 몫과 나머지, 몫 어림 |
| 3 | 원 | `[4수03-06]`, `[4수03-07]` | 중심·반지름·지름과 성질, 컴퍼스로 원 그리기 |
| 4 | 분수 | `[4수01-09]`, `[4수01-10]`, `[4수01-11]` | 등분할과 분수, 단위분수·진분수·가분수·대분수, 분수 변환과 크기 비교 |
| 5 | 들이와 무게 | `[4수03-17]`~`[4수03-23]` | 들이와 무게의 측정·어림, 단위 관계와 표현, `t`, 들이와 무게의 덧셈·뺄셈 |
| 6 | 그림그래프 | `[4수04-01]` | 자료 수집·분류·정리, 그림그래프 나타내기와 해석 |

중복을 제외한 공식 앵커는 17개다. `[4수01-08]`은 곱셈과 나눗셈에 함께 연결한다.

## 문제은행 제작 계약

각 작은 학습 단계는 다음 조건을 모두 만족해야 한다.

1. 직접 확인 문항이 한 개 이상 있어야 한다.
2. 숫자나 표현만 바꾼 복제가 아닌 적용·전이 문항이 한 개 이상 있어야 한다.
3. 두 문항의 오답은 같은 단계의 관찰 신호와 연결되어야 한다.
4. 학생 문구는 정오·진단·부족을 암시하지 않아야 한다.
5. 전략 이름이나 긴 설명을 이해해야만 풀 수 있는 문항을 쓰지 않는다.
6. 가능한 경우 그림, 수 모형, 분수 막대, 측정값, 그래프를 먼저 제시한다.
7. 오답 하나만으로 학생의 숙달이나 부족을 확정하지 않는다.

## 발행과 호환성

- 기존 `1.0.0`의 단원·단계·문항·선택지 ID는 삭제하거나 다른 의미로 바꾸지 않는다.
- 전체 문제은행은 새 버전으로 만들고 기존 `1.0.0` 발행본을 덮어쓰지 않는다.
- 문제은행 커버리지는 런타임 콘텐츠와 분리된 blueprint로 검사한다.
- 새 버전은 자동 검증과 다른 제작자의 내용 검수를 통과하기 전까지 발행 상태로 바꾸지 않는다.

### 진단 무결성 게이트

`grade3-semester2`의 진단 무결성 게이트는 `2.0.0`부터 강제한다. 이미 발행되어 운영 호환성을 유지해야 하는 `1.x` 계열은 `DI_GATE_NOT_ENFORCED` 경고와 감사 기록을 남기되 차단하지 않는다. `1.0.0` 파일럿 발행본을 폐기한 뒤 강제 시작 버전을 `1.0.0`으로 낮추는 후속 검토가 필요하다.

게이트는 검수 요청, 승인, 발행에서 실행된다. 초안 생성·자동 저장·가져오기·충돌 복구는 작업 중인 불완전한 내용을 보존해야 하므로 차단하지 않는다.

차단 오류:

- `DI_BLUEPRINT_MISSING`, `DI_BLUEPRINT_REVISION_MISSING`
- `DI_DISTRACTOR_RATIONALE_REQUIRED`, `DI_DISTRACTOR_RATIONALE_ORPHAN`
- `DI_DISTRACTOR_SIGNAL_MISMATCH`, `DI_MISCONCEPTION_ID_REQUIRED`
- `DI_MISCONCEPTION_ID_SCOPE`, `DI_MISCONCEPTION_TITLE_MISSING`
- `DI_RATIONALE_TOO_SHORT`, `DI_DERIVATION_TOO_SHORT`
- `DI_RATIONALE_DUPLICATED`, `DI_DERIVATION_NOT_MECHANISTIC`
- `DI_RATIONALE_COPIED_FROM_SIGNAL`, `DI_RATIONALE_RESTATES_CHOICE`
- `DI_SHARED_RATIONALE_INCONSISTENT`
- `DI_SIGNAL_CANNOT_SEPARATE_MISCONCEPTIONS`
- `DI_UNJUSTIFIED_DUPLICATE_DISTRACTOR`
- `DI_STAGE_MISCONCEPTION_DISCRIMINATION_REQUIRED`
- `DI_MISCONCEPTION_EVIDENCE_REPETITION_REQUIRED`
- `DI_FALLBACK_SIGNAL_REFERENCED`, `DI_DUPLICATE_CHOICE_LABEL`
- `DI_PRESENTATION_POSITION_IMBALANCE`, `DI_PRESENTATION_SESSION_DEGENERATE`

검토 경고:

- `DI_SIGNAL_NOT_CONFIRMABLE`
- `DI_MISCONCEPTION_SIGNAL_SPLIT`
- `DI_SEVERITY_UNDIFFERENTIATED`
- `DI_GATE_NOT_ENFORCED`
- `CW_UPSTREAM_CANDIDATE_DATA`, `CW_COVERAGE_GAPS_PRESENT`
- `CW_PREDECESSOR_ADVISORY`

교육과정 교차표 차단 오류:

- `CW_CROSSWALK_MISSING`, `CW_REVISION_MISSING`, `CW_UPSTREAM_PIN_MISSING`
- `CW_SNAPSHOT_DIGEST_MISMATCH`, `CW_CROSSWALK_DIGEST_MISMATCH`
- `CW_ANCHOR_UNMAPPED`, `CW_ANCHOR_ROW_ORPHAN`
- `CW_STAGE_UNMAPPED`, `CW_STAGE_ROW_ORPHAN`
- `CW_UPSTREAM_ID_UNKNOWN`, `CW_SCOPE_MISMATCH`
- `CW_STATUS_EVIDENCE_REQUIRED`, `CW_ANCHOR_LABEL_DRIFT`
- `CW_PREDECESSOR_SCOPE_INVALID`

현재 `2.2.0` 검수 콘텐츠는 64개 문항의 오답 128개에 독립적인
`misconceptionId`, 검수 제목, 근거, 도출 과정을 연결했다. 32개 단계마다
오개념 2개를 직접·전이 문항에서 반복 관찰하며, 블루프린트 리비전
`2026-07-30.2`는 진단 무결성 차단 오류 0개로 통과한다. 남는 경고 2개는
외부 학습맵이 후보 데이터이고 선수 관계가 자문용이라는 출처 한계다.

오답 도출 과정은 다음 순서로 작성한다.

1. 실제 선택지 값이 나오는 최소 계산이나 잘못 적용한 판단 규칙을 재현한다.
2. 선택지 문구, 신호의 교사 해석, 다른 오답 근거를 복사하지 않는다.
3. `misconceptionId`는 해당 학습 단계 ID로 시작하고 사람이 읽을 짧은 제목을 둔다.
4. 한 런타임 신호를 공유하더라도 편집 원장에서는 서로 다른 오개념을 구분한다.
5. 공통 신호 사용 이유는 단계마다 한 문장으로 고정하고 다른 단계에 재사용하지 않는다.

이 편집 원장은 `DiagnosisSet` 밖에 두어 학생 콘텐츠, 응답 이벤트,
학부모 공유본에 들어가지 않는다. 스튜디오는 이를 읽기 전용으로 보여 주며
선택지 ID가 달라지면 추측하지 않고 불일치로 표시한다.

심각도는 학생을 평가하는 등급이 아니라 교사가 재확인 순서를 잡는 검토값이다.

- `high`: 뒤 단계의 이해를 막기 쉬운 핵심 개념 관계
- `medium`: 계산·표현·자료 해석 과정의 주요 절차
- `low`: 어림, 측정 도구 선택처럼 보조 확인이 적절한 전략

`2.2.0`의 전체 신호 34개 분포는 `high 10 / medium 18 / low 6`이다.
이 중 진단 신호는 32개(`high 10 / medium 18 / low 4`)이고, 나머지
`low` 2개는 엔진 fallback인 `needs-scaffold`, `needs-review`다.
자동 게이트 통과는 발행 승인이 아니며, 실제 발행 전에는 다른 교사의 내용
검수가 필요하다.

블루프린트와 교차표의 의미 검증은 TypeScript 애플리케이션에서 수행한다. SQL은 이 편집 메타데이터를 학생 런타임 JSON에 중복 저장하지 않으며, 대신 게이트 버전·적용 여부·세트·목표 버전·오류 및 경고 수와 `crosswalkRevision`, 두 digest, 고정 커밋·taxonomy·ontology 버전을 발행 행의 단일 불변 `publication_gate`에 기록한다. 직접 RPC 호출자가 증명을 위조할 가능성까지 SQL만으로 재계산할 수는 없으므로, 발행은 반드시 애플리케이션의 `PublishDiagnosisSet`을 거치고 CI와 코드 검수를 함께 사용한다.

## 사람 검수 기록

자동 검사가 볼 수 없는 것만 사람이 본다. 오답을 고른 학생이 정말 그렇게
생각했는지, 지문이 정답을 미리 말하지는 않는지, 후속 지도가 그 오개념에
실제로 듣는지는 스키마로 확인할 수 없다.

**2026-08-07 · `2.1.0` 검수** — 파일럿 운영자 본인과 검증 에이전트 둘(codex,
gemini)이 각각 64문항 전체를 봤다. 판정이 크게 갈렸다: 17건 / 1건 / 1건.
17건을 문항 데이터에 하나씩 대조해 13건을 결함으로 확정했고, 나머지 4건은
오개념 ID의 제목이 이미 두 기제를 포괄하도록 쓰여 있어 반영하지 않았다.
확정된 결함은 네 갈래였다.

- 지문이 정답을 미리 말하는 문항 2건 — 나눗셈을 몰라도 숫자를 베껴 맞힐 수 있었다
- 도출이 산술적으로 거짓이거나 재현되지 않는 오답 4건
- 짝문항과 기제가 달라 같은 오개념을 두 번 관찰할 수 없는 오답 3건
- 이산량 문제에 연속량 표상을 붙인 시각자료 3건 외 1건

**2026-08-07 · `2.2.0` 재검수** — 64/64 통과, 수정 필요 0건.

검수 에이전트의 통과 판정은 근거를 재계산해 확인하기 전까지 증거가 아니다.
한 에이전트는 64문항 전원 통과에 오답 도출이 "실제 학생 사고와 정확히
부합"한다고 적었는데, 그 안에는 등식이 거짓인 `g3s2-measure-07`이 들어
있었다. 뺄셈 한 번이면 드러난다.

반대 방향도 같다. 검수 도중 `g3s2-div-01`의 오답 `2개`를 세 검수가 모두
놓친 결함으로 판단했으나 틀린 판단이었다. 오개념 제목 "계산 결과의
일부나 남은 부분만 답으로 사용함"은 12에서 일의 자리만 남긴 경우와
짝문항의 남은 양을 함께 포괄한다. 같은 이유로 다른 문항에는 과장이라고
판정해 놓고 이 문항에만 더 엄한 잣대를 댄 것이다. 문항 하나를 볼 때
적용한 기준은 나머지 63개에도 그대로 적용돼야 한다.

덧붙여 `1.0.0`의 선택지 ID 는 상위 버전에서 바꿀 수 없다. 학생 응답이
선택지 ID 를 참조하므로 `preserves every published unit, stage, signal,
judgment, and choice ID` 검사가 막는다. 발행된 문항의 선택지를 손대는
수정은 애초에 선택지가 아니다.

## 완료 조건

- 여섯 단원과 17개 공식 앵커가 모두 작은 학습 단계에 연결된다.
- 모든 단계가 직접 확인과 적용·전이 문항을 각각 한 개 이상 가진다.
- 모든 오답 선택지가 하나 이상의 관찰 신호를 가진다.
- 모든 오답 선택지가 독립적인 오개념 ID·근거·도출 과정을 가진다.
- 각 단계에서 서로 다른 오개념을 두 가지 이상 구분할 수 있다.
- 학생 문구 어휘 검사, 스키마 검사, 참조 무결성 검사, 커버리지 검사가 통과한다.
- 진단 무결성 게이트와 발행 증명 DB 검사가 통과한다.
- 학생 화면에서 모든 시각 자료와 선택지가 깨지지 않고 표시된다.
- 기존 `1.0.0` 콘텐츠와 이벤트를 계속 해석할 수 있다.
