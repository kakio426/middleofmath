import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const teacherSources = new Map([
  ["교사 화면", "../apps/teacher/src/teacher-app.tsx"],
  ["교사 화면 스타일", "../apps/teacher/src/teacher.css"],
  ["공용 화면 요소", "../packages/ui/src/components.tsx"],
  ["분석 문구 규칙", "../packages/domain/src/diagnosis-rules.ts"],
  ["가정 공유 문구", "../packages/domain/src/interpretation.ts"]
].map(([label, path]) => [
  label,
  readFileSync(new URL(path, import.meta.url), "utf8")
]));

const teacherAppSource = teacherSources.get("교사 화면") ?? "";
const teacherCssSource = teacherSources.get("교사 화면 스타일") ?? "";

describe("교사용 화면 용어", () => {
  it("개발·연구 용어와 번역되지 않은 영문 표제를 교사에게 노출하지 않는다", () => {
    const forbiddenPhrases = [
      "Invited teachers only",
      "Common signals",
      "Attempt history",
      "Teacher observation sheet",
      "First class",
      "New pilot class",
      "Add student",
      "최신 엔진 해석",
      "콘텐츠 checksum 또는 상호작용 버전",
      "현재 엔진이 지원하지 않는 상호작용 버전",
      "콘텐츠 체크섬",
      "검수 완료된 발행 버전",
      "발행 콘텐츠",
      "Phase 3",
      "해시로 보관",
      "판단 단위",
      "관찰한 판단",
      "판단 목차",
      "학생이 본 판단",
      "선택한 판단",
      "원자료와 응답 기록 보기",
      "오답 해석",
      "반복 확인",
      "한 번 관찰"
    ];

    for (const [sourceLabel, source] of teacherSources) {
      for (const phrase of forbiddenPhrases) {
        expect(source, `${sourceLabel}의 금지 표현: ${phrase}`).not.toContain(phrase);
      }
    }
  });

  it("CSS 가상 요소 문구에도 모호한 분석 용어를 넣지 않는다", () => {
    const pseudoElementCopy = [...teacherCssSource.matchAll(/content:\s*"([^"]+)"/g)]
      .map((match) => match[1])
      .filter(Boolean);

    expect(pseudoElementCopy).toContain("선택한 내용");
    for (const copy of pseudoElementCopy) {
      expect(copy).not.toMatch(/신호|판단|해석|원자료|엔진|체크섬|checksum/i);
    }
  });

  it("학교 현장에 맞는 핵심 용어를 일관되게 사용한다", () => {
    for (const phrase of [
      "현재 학급",
      "학생 분석지",
      "학생 응답 기록",
      "같은 생각이 반복됨",
      "한 번 더 확인 필요",
      "가정 공유용 결과표"
    ]) {
      expect(teacherAppSource).toContain(phrase);
    }
  });
});
