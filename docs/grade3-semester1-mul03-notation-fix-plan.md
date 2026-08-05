# 3학년 1학기 g3s1-mul-03 괄호 표기 수정 계획 (deepseek 작업 지시서)

## 운영 원칙

deepseek는 콘텐츠/코드 수정만 담당한다. 계획 수립과 검증(diff 리뷰 +
테스트 실행)은 Claude가 맡는다. 작업을 마치면 아래 "완료 기준"을 스스로
확인한 뒤 알린다.

**이번 라운드 범위는 g3s1-mul-03 문항의 선택지 표기 방식 변경으로
한정한다.** 정답/오답의 의미(어떤 오개념을 테스트하는지)는 그대로
유지하고 표기만 바꾼다. 이 문서에 없는 범위는 손대지 않는다.

## 배경

실사용 테스트(브라우저에서 직접 문항을 풀어보는 검수) 중 발견된 문제다.
`packages/content/src/grade3-semester1.ts`의 `g3s1-mul-03` 문항
("23×3을 자릿값에 맞게 나누어 계산한 식은 어느 것일까요?")이 선택지에
괄호 표기(`(20×3)+(3×3)`)를 쓰는데, 2022 개정 교육과정
[4수01-04](3~4학년군, 세 자리 수 범위 곱셈)에서 3학년은 아직 괄호를
이용한 식 표기를 배우지 않는다. 초등 3학년 대상 문항에 중학교 이후에
배우는 표기 규칙이 섞여 들어간 것으로, 문항 자체가 학생에게 낯선 기호
때문에 오개념 진단이 아니라 표기 해독 문제가 될 위험이 있다.

이 결함은 이번 세션의 U8b 병합과 무관하게 **원래 잠긴 콘텐츠(git HEAD,
checksum `36075f86f51e8b7c19f5df87b681a1b98fc9db84d2d0415d6fcd48d11aa1d56d`)에
이미 있던 것**이다.

결정: 괄호 대신 **화살표로 잇는 단계식**으로 표기를 바꾼다. 예:
`20×3=60 → 3×3=9 → 60+9=69`. 정답/오답이 테스트하는 오개념 구조(자릿값
분해 vs 자릿값 누락 vs 곱셈을 덧셈으로 대체)는 바꾸지 않는다.

## 수정 대상

### 1. `packages/content/src/grade3-semester1.ts:129-133` (g3s1-mul-03 선택지)

현재:
```ts
answers: [
  { id: "decompose-correct", label: "(20×3)+(3×3)" },
  { id: "decompose-place-dropped", label: "(2×3)+(3×3)" },
  { id: "decompose-addition", label: "23+3" }
]
```

변경 (계산 결과까지 포함한 화살표 단계식으로):
```ts
answers: [
  { id: "decompose-correct", label: "20×3=60 → 3×3=9 → 60+9=69" },
  { id: "decompose-place-dropped", label: "2×3=6 → 3×3=9 → 6+9=15" },
  { id: "decompose-addition", label: "23+3=26" }
]
```

`decompose-addition`은 원래도 괄호가 없었지만("23+3"), 다른 두 선택지와
표기 형식(계산 결과 포함 여부)을 맞추기 위해 "23+3=26"으로 계산 결과를
붙인다. 오개념 의미(곱셈을 덧셈으로 대체)는 그대로다.

id 값(`decompose-correct` 등)은 바꾸지 않는다 — rationale 파일과
coverage 파일이 이 id로 연결돼 있다.

### 2. `packages/content/src/grade3-semester1-rationales.ts:46`

현재 derivation이 괄호 표기를 그대로 인용한다:
```
"(20×3)+(3×3)에서 20을 2로 바꾸어 (2×3)+(3×3)으로 나타냈습니다."
```

새 선택지 표기에 맞춰 수정:
```
"20×3=60을 2×3=6으로 줄여서 십의 자리 값을 빠뜨렸습니다."
```

47행(`decompose-addition`)의 rationale/derivation은 괄호를 안 썼으므로
표기상 수정은 불필요하지만, "23×3을 나누어 곱하지 않고 23+3으로
나타냈습니다"라는 derivation은 새 선택지 라벨이 "23+3=26"으로 바뀌는
것과 자연스럽게 맞는지 확인하고, 필요하면 "23+3=26으로"처럼 결과를
붙여 라벨과 어긋나지 않게 손본다.

### 3. `docs/grade3-semester1-content-coverage.md:42-44`

현재:
```
- 두 자리 수 곱셈의 직접 확인은 `23×3`을 `(20×3)+(3×3)`으로 나타내는
  자릿값 구조를 묻고, ...
```

`(20×3)+(3×3)`을 `20×3=60 → 3×3=9 → 60+9=69`로 바꾼다. 이 문서가
콘텐츠 설명의 원 출처이므로 실제 라벨과 반드시 일치시킨다.

### 4. checksum 재계산 및 갱신 (중요 — 순서 지킬 것)

1번·2번을 수정하면 `grade3Semester1Diagnosis`의 내용이 바뀌므로
manifest checksum이 달라진다. **자동으로 재계산해서 그냥 덮어쓰지
말고**, 아래 순서를 따른다:

1. 1번·2번 수정을 마친 뒤,
   `packages/content/src/integrity-digest.ts`의
   `diagnosisContentChecksum(grade3Semester1Diagnosis)`를 호출해 새
   checksum 값을 얻는다 (스크립트로 직접 import해서 콘솔에 출력하면
   된다).
2. `packages/content/src/grade3-semester1.ts`의
   `manifest.checksum` 필드를 이 새 값으로 바꾼다.
3. `packages/content/src/grade3-semester1.test.ts:26`과 `:29`의
   하드코딩된 checksum 리터럴("36075f86...")도 같은 새 값으로 바꾼다
   (두 곳 다 같은 값이어야 함 — 하나는 고정값 비교, 하나는 자기 일관성
   비교).
4. `docs/grade3-semester1-content-coverage.md:35-38`의 "canonical
   checksum" 문구도 새 값으로 갱신한다.

버전(`manifest.version`, 현재 `"1.0.0"`)은 이번 라운드에서는 올리지
않는다 — 아직 발행 전(`status: "review"`) 단계의 콘텐츠 교정이기
때문이다. 버전을 올릴지는 Claude가 다음 라운드 검증 후 판단한다.

## 확인이 필요한 범위 밖 참고 사항

- `packages/content/src/grade3-semester2.ts`, `packages/ui/src/components.test.ts`,
  `packages/content/src/grade3-semester2-rationales.ts`에도 "20×3"
  문자열이 등장하지만, 전부 3학년 **2학기**의 다른 문항(부분곱을 두
  단계 문항으로 나눈 방식)이라 이번 수정 대상이 아니다. 건드리지 않는다.

## 완료 기준

- [ ] `g3s1-mul-03`의 세 선택지 라벨에 괄호가 없고, 화살표 단계식으로
      바뀜 (id는 유지)
- [ ] `grade3-semester1-rationales.ts:46`의 derivation이 괄호를
      인용하지 않음, 라벨과 의미가 일치
- [ ] `docs/grade3-semester1-content-coverage.md`의 예시 표기가 실제
      라벨과 일치
- [ ] 새 checksum이 `diagnosisContentChecksum()` 계산값과 정확히
      일치하고, `grade3-semester1.ts` manifest, `grade3-semester1.test.ts`
      2곳, `content-coverage.md` 네 군데 모두 같은 값
- [ ] `npx vitest run packages/content/src packages/domain/src` 전체
      통과
- [ ] `npm run typecheck --workspace @middle-of-math/content` 클린
- [ ] 이번에 건드린 파일 외 diff 없음 (특히 grade3-semester2 계열,
      answer id 값 자체는 안 바뀜)
