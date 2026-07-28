# 실교실 파일럿 운영 절차

이 문서는 3학년 2학기 파일럿을 staging에서 검증하고 production으로 승격하는 운영 기준이다. 로컬 Keychain이나 터미널 암호 입력은 배포 경로에 사용하지 않는다.

## 환경 경계

- staging과 production은 서로 다른 Supabase 프로젝트와 Vercel 프로젝트를 사용한다.
- Vercel 프로젝트의 Root Directory는 각각 `apps/student`, `apps/teacher`, `apps/studio`로 지정한다.
- 모든 배포 환경에서 `VITE_DEMO_MODE=false`를 명시한다. 데모 모드는 로컬·CI 브라우저 검증에서만 `true`로 사용한다.
- 세 앱에는 환경별 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 설정한다.
- Supabase Auth Redirect URL은 student, teacher, studio의 staging/production 도메인을 각각 분리해 허용 목록에 등록한다.

## GitHub environment secrets

`staging`과 `production` GitHub Environment에 아래 배포 비밀값을 별도로 둔다.

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_URL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_STUDENT`
- `VERCEL_PROJECT_ID_TEACHER`
- `VERCEL_PROJECT_ID_STUDIO`
- `STAGING_TEACHER_EMAIL` (staging 초대 교사 smoke 계정)
- `STAGING_TEACHER_PASSWORD` (staging 초대 교사 smoke 계정)

`staging-retention`과 `production-retention` Environment에는 각각 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`만 둔다. 배포 승인과 매일 삭제 승인을 분리하기 위해 retention Environment에는 Required reviewer를 걸지 않는다. workflow와 DB advisory lock이 purge 중복 실행을 직렬화한다. service-role key는 Vercel에 설정하지 않는다.

production Environment에는 Required reviewers를 설정한다. 공개 회원가입 UI는 제공하지 않으며, 파일럿 교사는 Supabase Dashboard의 관리자 초대로만 만든다. migration 전에 아래 조회 결과가 0인지 확인한다. 결과가 있으면 자동 삭제하지 말고 계정 소유자와 클래스 연결을 수동 검토한다.

```sql
select count(*)
from public.teachers teacher
join auth.users user_row on user_row.id = teacher.id
where coalesce(user_row.is_anonymous, false) = true or user_row.invited_at is null;
```

현재 생성된 Vercel 프로젝트는 `middle-of-math-student`, `middle-of-math-teacher`, `middle-of-math-studio`다. Preview에는 현재 staging Supabase 공개 설정과 `VITE_DEMO_MODE=false`가 등록되어 있다. staging workflow는 각 배포를 `middle-of-math-{student|teacher|studio}-staging.vercel.app` 고정 별칭에 연결한다. GitHub의 staging·production·staging-retention·production-retention Environment와 production Required reviewer도 생성했다. Vercel token·조직·프로젝트 ID 및 staging Supabase URL·project ref, staging-retention URL은 등록했다. staging의 Supabase access token·DB password와 smoke 계정, 두 retention Environment의 service-role key, 별도 production Supabase 값은 운영자가 발급한 뒤 추가해야 한다.

## 배포 순서

1. `main`의 CI가 타입 검사, Vitest와 기존 하네스, 전체 빌드, 로컬 migration·pgTAP, Playwright를 통과한다.
2. staging workflow가 비대화식 자격증명으로 같은 migration chain을 적용한 후 세 Vercel 앱을 배포한다.
3. staging에서 교사 로그인 → 클래스 생성 → 학생 추가 → 배정 → 학생 완료 → 반 요약 → 학부모 출력 흐름을 확인한다.
4. staging에서 검증한 정확한 커밋 SHA로 production workflow를 수동 실행한다.
5. 승인자가 변경 범위와 staging 증거를 확인하면 production migration과 배포가 진행된다.
6. 배포 직후 production 세 URL에서 데모·설정 오류 화면이 아닌 실제 학생 입장, 교사 로그인, 스튜디오 로그인 화면이 열리는지 Playwright smoke가 확인한다.

## 파일럿 보존·삭제

- 클래스 생성 시 파일럿 종료일과 종료 후 90일인 삭제 예정일을 확인한다.
- 매일 03:17 KST에 GitHub Actions가 service-role 전용 purge RPC를 실행한다. 일반 교사·학생 토큰으로 purge를 호출하지 않는다.
- 삭제 순서는 학부모 export → 해석 결과 → 관찰 이벤트 → 세션 → 배정 → 접근 grant → 학생 → 클래스 → 해당 클래스에만 연결된 익명 Auth 사용자다.
- 삭제 뒤에는 교사 ID가 연결된 클래스 껍데기도 남기지 않고 날짜, 앱, 이벤트명, 건수만 남긴 익명 운영 집계만 유지한다.
- purge 전후로 일반 사용자의 `observation_events` UPDATE·DELETE가 계속 거부되는지 pgTAP을 확인한다.

## 관측 정보 원칙

운영 로그에는 입장 성공률, 동기화 실패 수, 완료율, checksum/해석 실패 수만 기록한다. 학생 선택 payload, 학생 별칭, 클래스 코드·학생 개인 코드 원문, IP는 기록하지 않는다. 클라이언트가 보내는 동기화 실패 신호는 최근 30일 안에 실제 세션이 있는 UID만 UID별 10분에 3건으로 제한하고, 세션 시작·완료 시각과 학부모 export 건수는 서버 함수·트리거에서 파생한다.

## 장애 시 중단 기준

- checksum 또는 콘텐츠·엔진 버전을 해석할 수 없으면 해당 세션을 집계하지 않고 교사에게 `해석 대기`로 표시한다.
- staging smoke가 실패하면 production 승인을 열지 않는다.
- migration 실패 시 앱만 먼저 배포하지 않는다. 원인을 수정한 새 커밋으로 CI부터 다시 진행한다.
