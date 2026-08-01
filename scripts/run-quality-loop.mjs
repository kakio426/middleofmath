#!/usr/bin/env node

import { existsSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modes = new Set(["focused", "shared", "release"]);
const [requestedMode = "focused", ...rawArgs] = process.argv.slice(2);

if (["--help", "-h", "help"].includes(requestedMode)) {
  printHelp();
  process.exit(0);
}

if (rawArgs.some((argument) => ["--help", "-h"].includes(argument))) {
  printHelp();
  process.exit(0);
}

if (!modes.has(requestedMode)) {
  fail(`알 수 없는 모드입니다: ${requestedMode}`);
}

const options = parseArgs(rawArgs);
const selectedTests = resolveSelectedTests(options);

if (requestedMode !== "release" && options.tests.length === 0) {
  fail(
    "focused/shared 검증은 관련 계약을 확인할 명시적 --test 파일이 하나 이상 필요합니다. " +
      "--set만으로는 게이트를 통과할 수 없습니다.",
  );
}

const steps = [];
const auditScript =
  process.env.MOM_CONTENT_AUDIT_SCRIPT ||
  join(homedir(), ".codex", "skills", "middleofmath-content-review", "scripts", "audit_content.py");

if (!existsSync(auditScript)) {
  fail(
    `콘텐츠 정적 감사 스크립트를 찾지 못했습니다: ${auditScript}\n` +
      "middleofmath-content-review 스킬을 설치하거나 MOM_CONTENT_AUDIT_SCRIPT로 경로를 지정해 주세요.",
  );
}

steps.push({
  name: "콘텐츠 정적 감사",
  command: "python3",
  args: [
    auditScript,
    join(root, "packages", "content", "src"),
    join(root, "apps", "student", "src"),
    join(root, "packages", "ui", "src")
  ],
});

if (requestedMode !== "release") {
  steps.push({
    name: "변경 범위 Vitest",
    command: "npx",
    args: ["vitest", "run", ...selectedTests],
  });
  steps.push({ name: "타입 검사", command: "npm", args: ["run", "typecheck"] });
}

if (requestedMode === "shared") {
  steps.push({ name: "공용 코드 빌드·번들 누출 검사", command: "npm", args: ["run", "build"] });
}

if (requestedMode === "release") {
  steps.push(
    { name: "교육과정 교차표 재현", command: "npm", args: ["run", "test:crosswalk-repro"] },
    { name: "상위 학년 런타임 스냅숏 재현", command: "npm", args: ["run", "test:upper-runtime-repro"] },
    { name: "꺾은선그래프 좌표 퍼즈", command: "npm", args: ["run", "test:line-parity"] },
    { name: "전체 타입 검사", command: "npm", args: ["run", "typecheck"] },
    { name: "전체 단위·레거시 검사", command: "npm", args: ["test"] },
    { name: "전체 빌드·번들 누출 검사", command: "npm", args: ["run", "build"] },
    { name: "DB 마이그레이션·pgTAP", command: "npm", args: ["run", "test:db"] },
    { name: "브라우저 여정", command: "npm", args: ["run", "test:e2e"] },
    { name: "원격 smoke 계약", command: "npm", args: ["run", "test:smoke:contract"] },
  );
}

printRunHeader(requestedMode, options, selectedTests, steps);

if (options.dryRun) {
  console.log("\nDRY RUN: 명령을 실행하지 않았습니다.");
  printManualGate(requestedMode);
  process.exit(0);
}

const startedAt = Date.now();
for (const [index, step] of steps.entries()) {
  console.log(`\n[${index + 1}/${steps.length}] ${step.name}`);
  console.log(formatCommand(step.command, step.args));
  const stepStartedAt = Date.now();
  const result = spawnSync(step.command, step.args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    fail(`${step.name} 실행 실패: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${step.name} 실패(exit ${result.status ?? "unknown"}). 여기서 루프를 멈추고 원인을 수정하세요.`);
  }
  console.log(`통과 (${formatDuration(Date.now() - stepStartedAt)})`);
}

console.log(`\n자동 게이트 통과 (${formatDuration(Date.now() - startedAt)})`);
printManualGate(requestedMode);

function parseArgs(args) {
  const parsed = {
    set: "",
    unit: "",
    tests: [],
    includeVisual: false,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--set") {
      parsed.set = requireValue(args, ++index, token);
    } else if (token === "--unit") {
      parsed.unit = requireValue(args, ++index, token);
    } else if (token === "--test") {
      parsed.tests.push(requireValue(args, ++index, token));
    } else if (token === "--include-visual") {
      parsed.includeVisual = true;
    } else if (token === "--dry-run") {
      parsed.dryRun = true;
    } else {
      fail(`알 수 없는 옵션입니다: ${token}`);
    }
  }
  return parsed;
}

function requireValue(args, index, option) {
  const value = args[index];
  if (!value || value.startsWith("--")) fail(`${option} 뒤에 값을 입력해 주세요.`);
  return value;
}

function resolveSelectedTests(options) {
  const tests = [...options.tests];
  if (options.set) {
    const setTest = join("packages", "content", "src", `${options.set}.test.ts`);
    if (!existsSync(join(root, setTest))) {
      fail(`세트 기본 검사를 찾지 못했습니다: ${setTest}`);
    }
    tests.unshift(setTest);
  }
  if (options.includeVisual) {
    tests.push(join("apps", "student", "src", "visual-integrity-harness.test.tsx"));
  }

  const realRoot = realpathSync(root);
  const uniqueTests = [];
  for (const requestedPath of tests) {
    const resolvedPath = resolve(root, requestedPath);
    if (!existsSync(resolvedPath)) fail(`검사 파일을 찾지 못했습니다: ${requestedPath}`);

    const realPath = realpathSync(resolvedPath);
    const relativePath = relative(realRoot, realPath);
    if (relativePath === ".." || relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(relativePath)) {
      fail(`검사 파일은 저장소 안에 있어야 합니다: ${requestedPath}`);
    }
    if (!statSync(realPath).isFile()) {
      fail(`--test에는 디렉터리가 아니라 테스트 파일을 지정해야 합니다: ${requestedPath}`);
    }
    if (!/\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/.test(relativePath)) {
      fail(`지원하는 테스트 파일 이름이 아닙니다: ${requestedPath}`);
    }
    if (!uniqueTests.includes(relativePath)) uniqueTests.push(relativePath);
  }
  return uniqueTests;
}

function printRunHeader(mode, options, tests, plannedSteps) {
  const labels = { focused: "결함군 집중", shared: "공용 코드 승격", release: "학기·릴리스 전체" };
  console.log(`Middle of Math 완성도 루프 — ${labels[mode]}`);
  if (options.set) console.log(`세트: ${options.set}`);
  if (options.unit) console.log(`단원/결함군: ${options.unit}`);
  if (tests.length > 0) console.log(`대상 검사: ${tests.join(", ")}`);
  console.log(`자동 단계: ${plannedSteps.length}개`);
}

function printManualGate(mode) {
  console.log("\n다음 수동 게이트를 닫아야 이번 루프가 완료됩니다.");
  console.log("1. 원자료·정답·모든 오답 산출·오개념 ID가 서로 일치하는지 확인");
  console.log("2. 학생에게 필요한 정보가 실제 렌더러에 보이고 정답 누출이 없는지 확인");
  console.log("3. 초등 학년 어휘, 한국어 줄바꿈, 키보드·스크린리더 접근성 확인");
  console.log(
    mode === "focused"
      ? "4. 390×844와 대표 태블릿/데스크톱 한 화면에서 실제 문제를 확인"
      : "4. 390×844, 768×1024, 1280×720에서 변경 시각자료와 흐름을 확인",
  );
  console.log("5. 같은 Codex 검증 서브에이전트가 변경 범위만 읽기 전용 재검토");
  console.log("6. Blocker·High는 0, Medium은 수정 또는 사유·담당·재검토일을 기록한 뒤 종료");
}

function printHelp() {
  console.log(`Middle of Math 완성도 루프

사용법:
  npm run quality:focused -- --set grade6-semester2 --test 경로 [--unit 이름] [--include-visual]
  npm run quality:shared -- --set grade6-semester2 --test 경로 [--include-visual]
  npm run quality:release

모드:
  focused  한 결함군/단원의 정적 감사, 지정 Vitest, 타입 검사
  shared   focused + 전체 빌드·번들 누출 검사
  release  전체 테스트, DB, E2E를 포함한 학기/릴리스 게이트

옵션:
  --set <id>          packages/content/src/<id>.test.ts를 자동 포함
  --unit <이름>       실행 로그에 단원 또는 결함군을 기록
  --test <경로>       필수. 저장소 안의 명시적 *.test.* 또는 *.spec.* 파일
  --include-visual    학생 시각 무결성 하네스를 포함
  --dry-run           실행할 명령과 수동 게이트만 표시
`);
}

function formatCommand(command, args) {
  return [command, ...args].map((part) => (part.includes(" ") ? JSON.stringify(part) : part)).join(" ");
}

function formatDuration(milliseconds) {
  return `${(milliseconds / 1000).toFixed(1)}초`;
}

function fail(message) {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}
