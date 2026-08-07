import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { DiagnosisSet } from "@middle-of-math/domain";
import {
  grade3Semester2CompleteDiagnosis,
  grade4Semester1Diagnosis
} from "../packages/content/src/index";

/**
 * `protect_published_diagnosis` 는 새 발행본을 같은 set_key 의 **모든** 기존
 * 행과 대조해 단원·성취기준·학습 단계·신호·문항·선택지 ID 가 하나라도
 * 사라지면 거부한다. 학생 응답이 이 ID 들을 참조하기 때문이다.
 *
 * 콘텐츠 패키지의 기존 검사는 각 세트의 최초 발행본 한 개하고만 비교해서,
 * 그 뒤에 발행된 버전에서만 존재하던 ID 를 지우는 것을 잡지 못했다. 실제로
 * grade3-semester2 2.2.0 이 2.1.0 의 선택지 ID 다섯 개를 지운 채 CI 까지
 * 올라가 `published stable IDs cannot be removed` 로 막혔다. 여기서는
 * 커밋된 발행 마이그레이션을 직접 읽어 트리거와 같은 것을 검사한다.
 */

const migrationsDir = fileURLToPath(
  new URL("../supabase/migrations", import.meta.url)
);

interface PublishedPayload {
  file: string;
  version: string;
  content: DiagnosisSet;
}

async function readPublications(setKeyPattern: string): Promise<PublishedPayload[]> {
  const files = (await readdir(migrationsDir))
    .filter((name) => name.includes(setKeyPattern) && name.endsWith(".sql"))
    .sort();
  const payloads: PublishedPayload[] = [];
  for (const file of files) {
    const sql = await readFile(`${migrationsDir}/${file}`, "utf8");
    // 발행 SQL 은 콘텐츠를 $content$…$content$ 달러 인용으로 감싼다.
    const match = /\$content\$([\s\S]*?)\$content\$/.exec(sql);
    if (!match) continue;
    const content = JSON.parse(match[1]) as DiagnosisSet;
    payloads.push({ file, version: content.manifest.version, content });
  }
  return payloads;
}

function stableIds(content: DiagnosisSet): Set<string> {
  const ids = new Set<string>();
  for (const unit of content.manifest.units) ids.add(`unit:${unit.id}`);
  for (const anchor of content.curriculumAnchors) ids.add(`anchor:${anchor.id}`);
  for (const stage of content.learnerStages) ids.add(`stage:${stage.id}`);
  for (const signal of content.signals) ids.add(`signal:${signal.id}`);
  for (const judgment of content.judgments) {
    ids.add(`judgment:${judgment.id}`);
    for (const choice of judgment.choices) {
      ids.add(`choice:${judgment.id}/${choice.id}`);
    }
  }
  return ids;
}

const sets: Array<{ name: string; filePattern: string; current: DiagnosisSet }> = [
  {
    name: "grade3-semester2",
    filePattern: "grade3_semester2_publication",
    current: grade3Semester2CompleteDiagnosis
  },
  {
    name: "grade4-semester1",
    filePattern: "grade4_semester1_publication",
    current: grade4Semester1Diagnosis
  }
];

describe("published stable IDs", () => {
  for (const set of sets) {
    it(`${set.name}: the current set keeps every ID from every published version`, async () => {
      const publications = await readPublications(set.filePattern);
      expect(publications.length).toBeGreaterThan(0);

      const currentIds = stableIds(set.current);
      const removed: string[] = [];
      for (const publication of publications) {
        // 자기 자신을 발행한 마이그레이션은 비교 대상이 아니다.
        if (publication.version === set.current.manifest.version) continue;
        for (const id of stableIds(publication.content)) {
          if (!currentIds.has(id)) {
            removed.push(`${publication.version} -> ${id}`);
          }
        }
      }
      expect(removed, "published stable IDs cannot be removed").toEqual([]);
    });
  }
});
