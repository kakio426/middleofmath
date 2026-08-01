import type { DiagnosisSet } from "@middle-of-math/domain";
import grade5Semester2Snapshot from "./grade5-semester2.runtime.json";
import grade6Semester1Snapshot from "./grade6-semester1.runtime.json";
import grade6Semester2Snapshot from "./grade6-semester2.runtime.json";

/**
 * 학생·교사 번들에는 실행에 필요한 진단 데이터만 넣는다.
 * 편집용 오개념 근거는 원본 TS와 기본 패키지 진입점에만 남긴다.
 */
export const grade5Semester2Diagnosis =
  grade5Semester2Snapshot as DiagnosisSet;
export const grade6Semester1Diagnosis =
  grade6Semester1Snapshot as DiagnosisSet;
export const grade6Semester2Diagnosis =
  grade6Semester2Snapshot as DiagnosisSet;
