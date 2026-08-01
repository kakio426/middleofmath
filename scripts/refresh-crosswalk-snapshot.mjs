import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const commitIndex = args.indexOf("--commit");
const commit = commitIndex >= 0 ? args[commitIndex + 1] : "";
const codesIndex = args.indexOf("--codes");
const outputIndex = args.indexOf("--out");
const expectedDigestIndex = args.indexOf("--expect-digest");
const expectedDigest = expectedDigestIndex >= 0
  ? args[expectedDigestIndex + 1]
  : "";
const gradeBandIndex = args.indexOf("--grade-band");
const gradeBand = gradeBandIndex >= 0 ? args[gradeBandIndex + 1] : "3-4";
const snapshotSchemaIndex = args.indexOf("--snapshot-schema");
const snapshotSchema = snapshotSchemaIndex >= 0
  ? args[snapshotSchemaIndex + 1]
  : gradeBand === "5-6" ? "evidence-v1" : "legacy-v0";
const shouldWrite = args.includes("--write");
if (!/^[0-9a-f]{40}$/.test(commit)) {
  throw new Error(
    "사용법: node scripts/refresh-crosswalk-snapshot.mjs --commit <40자리 커밋> "
    + "[--grade-band 3-4|5-6] [--codes <쉼표로 구분한 코드>] "
    + "[--snapshot-schema legacy-v0|evidence-v1] "
    + "[--expect-digest <sha256:...>] [--out <경로>] [--write]"
  );
}
if (!new Set(["3-4", "5-6"]).has(gradeBand)) {
  throw new Error("--grade-band는 3-4 또는 5-6이어야 합니다.");
}
if (!new Set(["legacy-v0", "evidence-v1"]).has(snapshotSchema)) {
  throw new Error("--snapshot-schema은 legacy-v0 또는 evidence-v1이어야 합니다.");
}
if (gradeBand === "5-6" && snapshotSchema !== "evidence-v1") {
  throw new Error("5-6학년군은 출처 근거를 보존하는 evidence-v1 스키마를 사용해야 합니다.");
}
if (expectedDigest && !/^sha256:[0-9a-f]{64}$/.test(expectedDigest)) {
  throw new Error("--expect-digest는 sha256:<64자리 16진수> 형식이어야 합니다.");
}
if (shouldWrite && outputIndex < 0) {
  throw new Error("--write를 사용할 때는 덮어쓸 --out 경로를 명시해야 합니다.");
}

const repository = "DECK6/korean-elementary-learning-map";
const rawBase = `https://raw.githubusercontent.com/${repository}/${commit}`;
const filePaths = [
  "data/kr/manifest.json",
  "data/kr/curriculum-standards.json",
  "data/kr/topics.json",
  "data/kr/dependencies.json",
  "dist/ontology/manifest.json"
];

async function fetchFile(path) {
  const response = await fetch(`${rawBase}/${path}`);
  if (!response.ok) throw new Error(`${path} 다운로드 실패: ${response.status}`);
  const text = await response.text();
  return {
    path,
    text,
    bytes: Buffer.byteLength(text),
    sha256: createHash("sha256").update(text).digest("hex"),
    json: JSON.parse(text)
  };
}

const files = new Map(
  (await Promise.all(filePaths.map(fetchFile))).map((file) => [file.path, file])
);
const manifest = files.get("data/kr/manifest.json").json;
for (const name of [
  "curriculum-standards.json",
  "topics.json",
  "dependencies.json"
]) {
  const downloaded = files.get(`data/kr/${name}`);
  const pinned = manifest.files[name];
  if (downloaded.sha256 !== pinned.sha256 || downloaded.bytes !== pinned.bytes) {
    throw new Error(`${name}이 원본 manifest의 해시 또는 크기와 다릅니다.`);
  }
}

const defaultCodesByGradeBand = {
  "3-4": [
    "[4수01-04]", "[4수01-05]", "[4수01-06]", "[4수01-08]",
    "[4수01-09]", "[4수01-10]", "[4수01-11]", "[4수03-06]",
    "[4수03-07]", "[4수03-17]", "[4수03-18]", "[4수03-19]",
    "[4수03-20]", "[4수03-21]", "[4수03-22]", "[4수03-23]",
    "[4수04-01]"
  ],
  "5-6": [
    "[6수01-01]", "[6수01-04]", "[6수01-05]", "[6수02-01]",
    "[6수01-06]", "[6수01-07]", "[6수01-12]", "[6수01-08]",
    "[6수03-11]", "[6수03-12]", "[6수03-13]", "[6수03-14]",
    "[6수01-02]", "[6수01-03]", "[6수01-09]", "[6수03-01]",
    "[6수03-02]", "[6수01-13]", "[6수03-03]", "[6수03-04]",
    "[6수04-01]", "[6수04-04]", "[6수04-05]", "[6수04-06]",
    "[6수01-10]", "[6수01-11]", "[6수03-05]", "[6수03-06]",
    "[6수01-14]", "[6수01-15]", "[6수02-02]", "[6수02-03]",
    "[6수04-02]", "[6수04-03]", "[6수03-17]", "[6수03-18]",
    "[6수03-19]", "[6수03-09]", "[6수03-10]", "[6수02-04]",
    "[6수02-05]", "[6수03-15]", "[6수03-16]", "[6수03-07]",
    "[6수03-08]"
  ]
};
const defaultCodes = defaultCodesByGradeBand[gradeBand];
const codes = codesIndex >= 0
  ? [...new Set((args[codesIndex + 1] ?? "").split(",").map((code) => code.trim()).filter(Boolean))]
  : defaultCodes;
if (codes.length === 0 || codes.some((code) => !/^\[[246]수\d{2}-\d{2}\]$/.test(code))) {
  throw new Error("--codes에는 [6수01-01] 형식의 성취기준을 하나 이상 지정해야 합니다.");
}
const standardsDocument = files.get("data/kr/curriculum-standards.json").json;
const topicsDocument = files.get("data/kr/topics.json").json;
const dependenciesDocument = files.get("data/kr/dependencies.json").json;
const ontologyManifest = files.get("dist/ontology/manifest.json").json;
const math = standardsDocument.curricula.find(
  (curriculum) => curriculum.id === "kr-2022-elem-math"
);
if (!math) throw new Error("고정 커밋에서 한국 초등 수학 교육과정을 찾지 못했습니다.");

const standards = math.standards
  .filter((standard) => codes.includes(standard.code))
  .map((standard) => snapshotSchema === "legacy-v0" ? {
    key: standard.key,
    code: standard.code,
    gradeBand: standard.gradeBand,
    subject: standard.subject,
    domain: standard.domain,
    verificationStatus: standard.verificationStatus
  } : {
    key: standard.key,
    code: standard.code,
    gradeBand: standard.gradeBand,
    subject: standard.subject,
    domain: standard.domain,
    module: standard.module,
    focus: standard.focus,
    sourceRefs: standard.sourceRefs,
    evidence: (standard.evidence ?? []).map((item) => ({
      sourceId: item.sourceId,
      locator: item.locator,
      evidenceType: item.evidenceType,
      basis: item.basis
    })),
    verificationStatus: standard.verificationStatus
  });
if (standards.length !== codes.length) {
  throw new Error(
    `필요한 성취기준은 ${codes.length}개인데 ${standards.length}개만 찾았습니다.`
  );
}
const referencedSourceIds = new Set(snapshotSchema === "evidence-v1"
  ? standards.flatMap((standard) => standard.sourceRefs ?? [])
  : []);
const sources = standardsDocument.sources
  .filter((source) => referencedSourceIds.has(source.id))
  .map((source) => ({
    id: source.id,
    name: source.name,
    url: source.url,
    accessDate: source.accessDate,
    sourceType: source.sourceType,
    publisher: source.publisher,
    via: source.via,
    attachmentName: source.attachmentName,
    fileSizeBytes: source.fileSizeBytes,
    pdfPages: source.pdfPages,
    sha256: source.sha256
  }))
  .sort((left, right) => Buffer.from(left.id).compare(Buffer.from(right.id)));
if (sources.length !== referencedSourceIds.size) {
  throw new Error("성취기준이 참조하는 공식 출처를 모두 찾지 못했습니다.");
}

const entryTopicIdsByGradeBand = {
  "3-4": [
    "kr.mt.math.number-operations.g3-4.s4-01-04.representation",
    "kr.mt.math.number-operations.g3-4.s4-01-05.concept",
    "kr.mt.math.geometry-measurement.g3-4.s4-03-06.concept",
    "kr.mt.math.number-operations.g3-4.s4-01-09.representation",
    "kr.mt.math.geometry-measurement.g3-4.s4-03-17.concept",
    "kr.mt.math.data-probability.g3-4.s4-04-01.concept"
  ],
  "5-6": [
    "kr.mt.math.number-operations.g5-6.s6-01-01.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-04.representation",
    "kr.mt.math.change-relationships.g5-6.s6-02-01.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-06.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-08.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-11.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-02.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-09.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-01.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-13.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-03.representation",
    "kr.mt.math.data-probability.g5-6.s6-04-01.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-10.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-11.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-05.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-06.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-14.representation",
    "kr.mt.math.number-operations.g5-6.s6-01-15.representation",
    "kr.mt.math.change-relationships.g5-6.s6-02-02.representation",
    "kr.mt.math.change-relationships.g5-6.s6-02-03.representation",
    "kr.mt.math.data-probability.g5-6.s6-04-02.representation",
    "kr.mt.math.data-probability.g5-6.s6-04-03.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-17.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-18.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-19.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-09.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-10.representation",
    "kr.mt.math.change-relationships.g5-6.s6-02-04.representation",
    "kr.mt.math.change-relationships.g5-6.s6-02-05.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-15.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-16.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-07.representation",
    "kr.mt.math.geometry-measurement.g5-6.s6-03-08.representation"
  ]
};
const entryTopicIds = entryTopicIdsByGradeBand[gradeBand];
const dependencies = entryTopicIds.map((topicId) => {
  const dependency = dependenciesDocument.dependencies.find(
    (row) => row.topicId === topicId
  );
  if (!dependency) throw new Error(`선수 후보를 찾지 못했습니다: ${topicId}`);
  return {
    topicId: dependency.topicId,
    prerequisiteId: dependency.prerequisiteId,
    relationship: "prerequisite",
    strength: dependency.strength,
    basis: dependency.basis
  };
});

const topicIds = new Set(
  topicsDocument.topics
    .filter((topic) => topic.standards?.some((key) =>
      codes.some((code) => key.endsWith(code))
    ))
    .map((topic) => topic.id)
);
for (const dependency of dependencies) {
  topicIds.add(dependency.topicId);
  topicIds.add(dependency.prerequisiteId);
}
const relationships = new Map(
  standardsDocument.standardMappings.map((row) => [
    row.microTopicId,
    row.relationship
  ])
);
const topics = topicsDocument.topics
  .filter((topic) => topicIds.has(topic.id))
  .map((topic) => ({
    id: topic.id,
    standardKey: topic.standards?.[0] ?? null,
    gradeBand: topic.gradeBand,
    subject: topic.subject,
    domain: topic.domain,
    verificationStatus: topic.verificationStatus,
    relationship: relationships.get(topic.id) ?? "prerequisite-only"
  }))
  .sort((left, right) => Buffer.from(left.id).compare(Buffer.from(right.id)));

const snapshot = {
  upstream: {
    repository,
    commit,
    license: "MIT",
    taxonomyVersion: manifest.taxonomyVersion,
    ontologyVersion: ontologyManifest.ontologyVersion,
    generatedAt: manifest.generatedAt,
    status: manifest.status,
    verificationStatus: manifest.verificationStatus,
    officialStatus: "independent-non-official",
    learnerDiagnosisSupported: false
  },
  ...(gradeBand === "5-6" ? {
    scope: {
      gradeBand,
      requestedCodes: codes
    }
  } : {}),
  files: Object.fromEntries(
    ["curriculum-standards.json", "topics.json", "dependencies.json"].map(
      (name) => [name, manifest.files[name]]
    )
  ),
  ...(snapshotSchema === "evidence-v1" ? { sources } : {}),
  advisory: snapshotSchema === "legacy-v0" ? {
    crosswalkOnly: true,
    notLearnerDiagnosis: true,
    candidatePrerequisites: true
  } : {
    crosswalkOnly: true,
    notLearnerDiagnosis: true,
    candidatePrerequisites: true,
    locatorProvenance: "upstream-recorded",
    locatorLocallyReproducible: false,
    locatorUsage: "추출 도구·버전·플래그가 고정되지 않은 DECK6 상류 줄 번호다. 로컬 재현이나 학기 배치 승인 근거로 사용하지 않는다."
  },
  standards,
  topics,
  dependencies
};
snapshot.snapshotDigest =
  `sha256:${createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")}`;
if (expectedDigest && snapshot.snapshotDigest !== expectedDigest) {
  throw new Error(
    `스냅숏 digest 불일치: 기대 ${expectedDigest}, 실제 ${snapshot.snapshotDigest}`
  );
}

const output = `${JSON.stringify(snapshot, null, 2)}\n`;
const outputPath = resolve(
  outputIndex >= 0
    ? args[outputIndex + 1] ?? ""
    : "packages/content/src/upstream/kr-learning-map.snapshot.json"
);
if (shouldWrite) {
  await writeFile(outputPath, output, "utf8");
  console.log(`갱신 완료: ${outputPath}`);
  console.log("교차표를 다시 검수하고 crosswalkDigest를 갱신해야 합니다.");
} else {
  console.log(`검증 완료: ${repository}@${commit}`);
  console.log(`taxonomy ${snapshot.upstream.taxonomyVersion}`);
  console.log(`ontology ${snapshot.upstream.ontologyVersion}`);
  console.log(`standards ${standards.length}, topics ${topics.length}, dependencies ${dependencies.length}`);
  console.log(`snapshotDigest ${snapshot.snapshotDigest}`);
  console.log("--write를 지정하지 않아 저장소 파일은 변경하지 않았습니다.");
}
