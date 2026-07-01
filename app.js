(function () {
  const UNKNOWN_DELAY_MS = 30000;
  const UNKNOWN_CHOICE = {
    id: "__unknown__",
    label: "잘 모르겠어요",
    sublabel: "현재 판단을 건너뛰고 다음 판단으로 넘어갑니다",
    correct: false,
    signal: "needs-scaffold",
    misconception: "판단 시작점이 불명확함",
    teacherNote: "개념을 말로 설명하기보다 먼저 선택 가능한 기준을 좁혀주는 발문이 필요합니다.",
  };

  const SIGNAL_COPY = {
    "add-denominators": {
      title: "분모를 더해 통분 기준을 만드는 경향",
      severity: "high",
      interpretation: "공통 기준을 찾기보다 보이는 두 분모를 계산 대상으로 보고 있습니다.",
      teachingMove: "분모는 더할 수가 아니라 조각의 이름이라는 점을 분수막대로 다시 세워주세요.",
    },
    "add-across": {
      title: "분자끼리, 분모끼리 바로 더함",
      severity: "high",
      interpretation: "통분 전 절차로 바로 결과를 만들고 있습니다.",
      teachingMove: "같은 단위가 된 뒤에만 조각 수를 더한다는 순서를 고정해 주세요.",
    },
    "subtract-across": {
      title: "분자와 분모를 각각 빼는 경향",
      severity: "high",
      interpretation: "뺄셈에서도 분모를 기준이 아니라 계산 대상으로 보고 있습니다.",
      teachingMove: "같은 이름의 조각끼리 뺄 때 이름은 남고 개수만 변한다는 예시가 필요합니다.",
    },
    "subtract-denominators": {
      title: "뺄셈에서 분모도 함께 뺌",
      severity: "high",
      interpretation: "공통 기준을 유지한다는 감각이 아직 약합니다.",
      teachingMove: "통분 이후 분모가 왜 유지되는지 막대와 단위 언어로 확인해 주세요.",
    },
    "numerator-denominator-mix": {
      title: "분자의 합을 분모 자리에 씀",
      severity: "high",
      interpretation: "분모를 공통 기준이 아니라 계산 결과가 들어가는 자리로 보고 있습니다.",
      teachingMove: "분모는 계산 결과가 아니라 조각 이름이 유지되는 자리라는 점을 막대로 다시 확인해 주세요.",
    },
    "denominator-only": {
      title: "분모만 바꾸고 분자를 유지함",
      severity: "medium",
      interpretation: "동치분수에서 같은 크기를 보존하려면 분자도 함께 변한다는 연결이 약합니다.",
      teachingMove: "같은 막대를 더 잘게 나눌 때 칠해진 조각 수도 함께 늘어나는 장면을 반복해 주세요.",
    },
    "additive-equivalence": {
      title: "동치분수를 덧셈 변화로 봄",
      severity: "medium",
      interpretation: "분모 증가량을 분자에도 더하는 방식으로 같은 크기를 만들려 합니다.",
      teachingMove: "증가량보다 배수가 같아야 한다는 점을 작은 수 예시로 확인해 주세요.",
    },
    "multiplier-miscalculation": {
      title: "분모 변화의 배수를 잘못 계산함",
      severity: "medium",
      interpretation: "곱셈으로 동치분수를 만든다는 절차는 알지만 배수 자체를 잘못 구하고 있습니다.",
      teachingMove: "분모가 몇 배가 됐는지 먼저 확인한 뒤 분자에 적용하는 순서로 나눠서 짚어주세요.",
    },
    "larger-denominator-only": {
      title: "큰 분모만 공통 기준으로 삼음",
      severity: "medium",
      interpretation: "두 분모가 모두 표현되는 기준인지 점검하는 습관이 아직 약합니다.",
      teachingMove: "선택한 기준으로 두 분수를 모두 바꿀 수 있는지 되묻는 루틴을 넣어주세요.",
    },
    "smaller-denominator-only": {
      title: "작은 분모만 공통 기준으로 삼음",
      severity: "medium",
      interpretation: "공통 기준의 조건보다 익숙한 분모를 우선 선택합니다.",
      teachingMove: "두 분모가 모두 나누어지는지 확인하는 체크 질문이 필요합니다.",
    },
    "word-operation-confusion": {
      title: "문장 상황에서 연산 선택이 흔들림",
      severity: "high",
      interpretation: "남은 양, 사용한 양, 전체 양의 관계가 수식으로 안정적으로 옮겨지지 않습니다.",
      teachingMove: "계산 전 그림 한 줄로 처음 양과 사용한 양을 구분하게 해주세요.",
    },
    "operation-guessing": {
      title: "문제 단서 없이 연산을 추측함",
      severity: "medium",
      interpretation: "문장 속 행동과 연산 사이의 연결이 약합니다.",
      teachingMove: "더한다, 뺀다, 남는다 같은 말과 식을 짝짓는 짧은 판단을 추가해 주세요.",
    },
    "numerator-only": {
      title: "분자만 보고 크기를 판단함",
      severity: "medium",
      interpretation: "전체가 몇 조각인지보다 칠해진 조각 수에 먼저 반응합니다.",
      teachingMove: "같은 1칸이라도 전체 조각 수가 다르면 크기가 달라지는 비교가 필요합니다.",
    },
    "part-whole-confusion": {
      title: "부분과 전체 수의 역할이 흔들림",
      severity: "medium",
      interpretation: "분자와 분모가 각각 무엇을 말하는지 연결이 약합니다.",
      teachingMove: "분수 표기와 막대의 전체 조각 수, 칠한 조각 수를 동시에 짚어주세요.",
    },
    "reversed-fraction": {
      title: "분자와 분모 위치를 뒤집어 읽음",
      severity: "high",
      interpretation: "전체를 나타내는 수와 부분을 나타내는 수의 자리를 구분하지 못하고 있습니다.",
      teachingMove: "분수 표기에서 아래 수는 전체 조각 수, 위 수는 칠한 조각 수라는 자리를 막대와 함께 반복해 확인해 주세요.",
    },
    "size-order": {
      title: "동치와 크기 비교를 혼동함",
      severity: "medium",
      interpretation: "같은 크기를 찾는 질문에 더 큰 분수를 고르는 등 동치와 크기비교 질문을 구분하지 못합니다.",
      teachingMove: "지금 묻는 것이 같은 크기인지 더 큰 크기인지를 먼저 말로 확인하게 해주세요.",
    },
    "rule-guessing": {
      title: "임의 계산 규칙을 만듦",
      severity: "medium",
      interpretation: "절차의 이유보다 보이는 숫자를 조합해 답을 만들고 있습니다.",
      teachingMove: "계산 전 '무엇을 세는 단계인지'를 말하게 하는 짧은 루틴이 필요합니다.",
    },
    "surface-number": {
      title: "보이는 숫자를 그대로 옮김",
      severity: "medium",
      interpretation: "숫자 표면과 실제 양 사이의 연결이 약합니다.",
      teachingMove: "분수막대에서 먼저 세고 그다음 수식으로 옮기는 순서를 권합니다.",
    },
    "conversion-missed": {
      title: "통분 변환 단계가 빠짐",
      severity: "medium",
      interpretation: "공통 기준은 떠올렸지만 실제 변환을 건너뛰고 있습니다.",
      teachingMove: "결과 선택 전 변환된 두 분수를 반드시 쓰는 중간 판단을 넣어주세요.",
    },
    "estimation-overprocedure": {
      title: "통분 절차 없이 어림으로 답함",
      severity: "medium",
      interpretation: "정확한 공통 기준 변환을 거치지 않고 대략적인 크기 감각으로 답을 고릅니다.",
      teachingMove: "어림으로 맞았더라도 통분과 계산 절차를 직접 쓰게 해 절차 자체를 확인해 주세요.",
    },
    "needs-scaffold": {
      title: "판단 시작점에서 추가 발판이 필요함",
      severity: "medium",
      interpretation: "오래 머문 뒤 모르겠어요를 선택한 단계는 개념 접근 시작점이 흐릴 수 있습니다.",
      teachingMove: "바로 설명시키기보다 보기 수를 줄이거나 막대 기준을 먼저 고르게 해주세요.",
    },
    "slow-judgment": {
      title: "특정 단계에서 오래 고민함",
      severity: "low",
      interpretation: "정답 여부와 별개로 판단 근거를 찾는 시간이 길었습니다.",
      teachingMove: "학생이 멈춘 단계의 이전 개념을 짧은 확인 질문으로 되짚어 주세요.",
    },
    "unstable-choice": {
      title: "선택을 여러 번 바꿈",
      severity: "low",
      interpretation: "두 기준 사이에서 흔들린 흔적이 있습니다.",
      teachingMove: "마지막 선택보다 처음 흔들린 두 선택의 차이를 비교하게 해주세요.",
    },
  };

  const questions = window.MOM_QUESTIONS || [];
  const app = document.querySelector("#app");
  const roleTabs = Array.from(document.querySelectorAll(".role-tab"));

  const state = {
    view: "student",
    problemIndex: 0,
    stepIndex: 0,
    selectedChoiceId: null,
    firstSelectionMs: null,
    selectedAtMs: null,
    selectionChanges: 0,
    stepStartMs: performance.now(),
    unknownVisible: false,
    unknownTimer: null,
    logs: [],
    completed: false,
    selectedStudentId: "current",
  };

  function init() {
    roleTabs.forEach((tab) => {
      tab.addEventListener("click", () => setView(tab.dataset.view));
    });
    app.addEventListener("click", handleAppClick);
    window.__MOM_SHOW_UNKNOWN = () => {
      state.unknownVisible = true;
      renderApp();
    };
    startUnknownTimer();
    renderApp();
  }

  function setView(view) {
    state.view = view;
    if (view === "student" && !state.completed) {
      startUnknownTimer();
    } else {
      clearUnknownTimer();
    }
    renderApp();
  }

  function handleAppClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    if (action === "select-choice") selectChoice(target.dataset.choiceId);
    if (action === "select-unknown") selectChoice(UNKNOWN_CHOICE.id);
    if (action === "next-step") goNext();
    if (action === "open-teacher") setView("teacher");
    if (action === "restart") restartSession();
    if (action === "select-student") {
      state.selectedStudentId = target.dataset.studentId;
      renderApp();
    }
  }

  function currentProblem() {
    return questions[state.problemIndex];
  }

  function currentStep() {
    return currentProblem().steps[state.stepIndex];
  }

  function selectChoice(choiceId) {
    if (!state.selectedChoiceId) {
      state.firstSelectionMs = performance.now() - state.stepStartMs;
    } else if (state.selectedChoiceId !== choiceId) {
      state.selectionChanges += 1;
    }
    state.selectedChoiceId = choiceId;
    state.selectedAtMs = performance.now();
    renderApp();
  }

  function goNext() {
    if (!state.selectedChoiceId) return;
    state.logs.push(buildLogEntry());

    const problem = currentProblem();
    const isLastStep = state.stepIndex === problem.steps.length - 1;
    const isLastProblem = state.problemIndex === questions.length - 1;

    if (isLastStep && isLastProblem) {
      state.completed = true;
      clearUnknownTimer();
      renderApp();
      return;
    }

    if (isLastStep) {
      enterStep(state.problemIndex + 1, 0);
      return;
    }

    enterStep(state.problemIndex, state.stepIndex + 1);
  }

  function enterStep(problemIndex, stepIndex) {
    clearUnknownTimer();
    state.problemIndex = problemIndex;
    state.stepIndex = stepIndex;
    state.selectedChoiceId = null;
    state.firstSelectionMs = null;
    state.selectedAtMs = null;
    state.selectionChanges = 0;
    state.stepStartMs = performance.now();
    state.unknownVisible = false;
    startUnknownTimer();
    renderApp();
  }

  function buildLogEntry() {
    const problem = currentProblem();
    const step = currentStep();
    const choice = getSelectedChoice();
    const now = performance.now();
    return {
      studentId: "현재 익명 세션",
      problemId: problem.id,
      problemTitle: problem.title,
      stepId: step.id,
      stepTitle: step.title,
      prompt: step.prompt,
      selectedLabel: choice.label,
      selectedChoiceId: choice.id,
      isCorrect: Boolean(choice.correct),
      signal: choice.signal,
      misconception: choice.misconception,
      teacherNote: choice.teacherNote,
      durationMs: Math.round(now - state.stepStartMs),
      firstSelectionMs: state.firstSelectionMs === null ? null : Math.round(state.firstSelectionMs),
      afterChoiceMs: state.selectedAtMs === null ? null : Math.round(now - state.selectedAtMs),
      selectionChanges: state.selectionChanges,
      usedUnknown: choice.id === UNKNOWN_CHOICE.id,
      recordedAt: new Date().toISOString(),
    };
  }

  function getSelectedChoice() {
    if (state.selectedChoiceId === UNKNOWN_CHOICE.id) return UNKNOWN_CHOICE;
    return currentStep().choices.find((choice) => choice.id === state.selectedChoiceId) || UNKNOWN_CHOICE;
  }

  function restartSession() {
    clearUnknownTimer();
    state.problemIndex = 0;
    state.stepIndex = 0;
    state.selectedChoiceId = null;
    state.firstSelectionMs = null;
    state.selectedAtMs = null;
    state.selectionChanges = 0;
    state.stepStartMs = performance.now();
    state.unknownVisible = false;
    state.logs = [];
    state.completed = false;
    state.selectedStudentId = "current";
    state.view = "student";
    startUnknownTimer();
    renderApp();
  }

  function startUnknownTimer() {
    clearUnknownTimer();
    state.unknownTimer = window.setTimeout(() => {
      state.unknownVisible = true;
      renderApp();
    }, UNKNOWN_DELAY_MS);
  }

  function clearUnknownTimer() {
    if (state.unknownTimer) {
      window.clearTimeout(state.unknownTimer);
      state.unknownTimer = null;
    }
  }

  function renderApp() {
    roleTabs.forEach((tab) => {
      const active = tab.dataset.view === state.view;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });

    if (state.view === "teacher") {
      renderTeacher();
      return;
    }
    renderStudent();
  }

  function renderStudent() {
    if (state.completed) {
      app.innerHTML = renderCompletion();
      return;
    }

    const problem = currentProblem();
    const step = currentStep();
    const ordinal = stepOrdinal(state.problemIndex, state.stepIndex);
    const percent = Math.round((ordinal / totalStepCount()) * 100);
    const isLast = state.problemIndex === questions.length - 1 && state.stepIndex === problem.steps.length - 1;

    app.innerHTML = `
      <section class="student-workspace">
        <div class="student-progress-layer">
          <div
            class="thin-progress"
            role="progressbar"
            aria-label="풀이 진행률"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${percent}"
          >
            <span style="width: ${percent}%"></span>
          </div>
        </div>

        <div class="student-layout">
          <section class="problem-panel" aria-labelledby="problem-title">
            <div class="problem-meta">
              <span>5학년 분수</span>
              <span>${escapeHtml(problem.focus)}</span>
            </div>
            <h2 id="problem-title">${escapeHtml(problem.title)}</h2>
            <p>${escapeHtml(problem.stem)}</p>
            <div class="problem-position">
              <span>문항 ${state.problemIndex + 1} / ${questions.length}</span>
              <span>판단 ${state.stepIndex + 1} / ${problem.steps.length}</span>
            </div>
          </section>

          <section class="judgment-panel" aria-labelledby="step-title">
            <div class="step-heading">
              <p class="section-label">지금 볼 판단</p>
              <h3 id="step-title">${escapeHtml(step.title)}</h3>
            </div>
            <p class="step-prompt">${escapeHtml(step.prompt)}</p>
            ${renderFractionBars(step.bars || [])}
            <div class="choice-list" role="group" aria-label="선택지">
              ${step.choices.map(renderChoice).join("")}
            </div>
            <div class="unknown-slot" aria-live="polite">
              ${renderUnknownButton()}
            </div>
            <div class="student-actions">
              <button
                class="primary-button"
                type="button"
                data-action="next-step"
                ${state.selectedChoiceId ? "" : "disabled"}
              >
                ${isLast ? "마치기" : "다음"}
              </button>
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderChoice(choice) {
    const selected = choice.id === state.selectedChoiceId;
    return `
      <button
        class="choice-option ${selected ? "is-selected" : ""}"
        type="button"
        data-action="select-choice"
        data-choice-id="${escapeHtml(choice.id)}"
        aria-pressed="${selected}"
      >
        <span class="choice-label">${escapeHtml(choice.label)}</span>
      </button>
    `;
  }

  function renderUnknownButton() {
    if (!state.unknownVisible) return "";
    const selected = state.selectedChoiceId === UNKNOWN_CHOICE.id;
    return `
      <button
        class="unknown-button ${selected ? "is-selected" : ""}"
        type="button"
        data-action="select-unknown"
        aria-pressed="${selected}"
      >
        잘 모르겠어요
      </button>
    `;
  }

  function renderFractionBars(bars) {
    if (!bars.length) return "";
    return `
      <div class="fraction-bars" aria-label="분수막대">
        ${bars.map(renderFractionBar).join("")}
      </div>
    `;
  }

  function renderFractionBar(bar) {
    const pieces = Array.from({ length: bar.denominator }, (_, index) => {
      const filled = index < bar.numerator ? "is-filled" : "";
      return `<span class="bar-piece ${filled}" aria-hidden="true"></span>`;
    }).join("");
    return `
      <figure class="fraction-bar" aria-label="${escapeHtml(bar.label)} 분수막대, ${bar.denominator}칸 중 ${bar.numerator}칸">
        <figcaption>${escapeHtml(bar.label)}</figcaption>
        <div class="bar-pieces" style="grid-template-columns: repeat(${bar.denominator}, 1fr)">
          ${pieces}
        </div>
      </figure>
    `;
  }

  function renderCompletion() {
    return `
      <section class="completion-panel">
        <p class="section-label">풀이 완료</p>
        <h2>풀이 기록이 저장되었습니다.</h2>
        <p>학생 화면에는 정오답 대신 완료 상태만 보여줍니다. 세부 진단은 교사 화면에서만 확인합니다.</p>
        <div class="completion-actions">
          <button class="secondary-button" type="button" data-action="restart">처음부터</button>
          <button class="primary-button" type="button" data-action="open-teacher">교사 화면 보기</button>
        </div>
      </section>
    `;
  }

  function renderTeacher() {
    const students = getStudentsForTeacher();
    ensureSelectedStudent(students);
    const selectedStudent = students.find((student) => student.id === state.selectedStudentId) || students[0];
    const summaryRows = buildClassSummary(students);
    const hasCurrentLogs = state.logs.length > 0;
    const totalLogs = students.reduce((sum, student) => sum + student.logs.length, 0);
    const misconceptionCount = students.reduce(
      (sum, student) => sum + student.logs.filter((log) => !log.isCorrect || log.usedUnknown).length,
      0
    );

    app.innerHTML = `
      <section class="teacher-dashboard">
        <div class="dashboard-heading">
          <div>
            <p class="section-label">교사용</p>
            <h2>현재 풀이 진단</h2>
            <p>${hasCurrentLogs ? "현재 학생의 풀이 기록만 기준으로 진단합니다." : "학생 화면에서 한 단계 이상 진행하면 현재 풀이 기반 진단이 생깁니다."}</p>
          </div>
          <button class="secondary-button" type="button" data-action="restart">새 학생 기록 시작</button>
        </div>

        <div class="metric-strip" aria-label="반 요약 지표">
          ${renderMetric("분석 대상", hasCurrentLogs ? "현재 세션" : "기록 없음", "샘플을 섞지 않고 방금 푼 기록만 봅니다")}
          ${renderMetric("관찰 판단", `${totalLogs}개`, "문항 안의 작은 판단 단위")}
          ${renderMetric("주의 신호", `${misconceptionCount}개`, "오개념 또는 발판 요청")}
        </div>

        <div class="teacher-grid">
          <section class="summary-panel" aria-labelledby="summary-title">
            <div class="panel-heading">
              <h3 id="summary-title">오개념 우선순위</h3>
              <p>교사가 바로 읽을 수 있는 해석 문장으로만 정리합니다.</p>
            </div>
            <div class="summary-list">
              ${summaryRows.length ? summaryRows.map(renderSummaryRow).join("") : renderTeacherEmptyState()}
            </div>
          </section>

          <aside class="student-panel" aria-labelledby="student-title">
            <div class="panel-heading">
              <h3 id="student-title">학생별 풀이 흔적</h3>
              <p>선택, 머문 시간대, 선택 변경을 함께 봅니다.</p>
            </div>
            <div class="student-selector" role="listbox" aria-label="학생 선택">
              ${students.map((student) => renderStudentSelector(student, selectedStudent.id)).join("")}
            </div>
            ${renderStudentDetail(selectedStudent)}
          </aside>
        </div>

        <section class="ai-panel" aria-labelledby="ai-title">
          <div>
            <p class="section-label">DeepSeek 연결 설계</p>
            <h3 id="ai-title">현재는 규칙 기반 요약, API에는 익명 요약 로그만 전달</h3>
          </div>
          <p>
            전송 후보 필드는 문제 ID, 단계 ID, 선택 신호, 시간대 해석, 선택 변경 수, 모르겠어요 사용 여부,
            선택 후 확인 시간입니다. 현재 세션의 익명 요약 로그만 사용하며, 학생 이름, 자유 서술 원문,
            학교 식별 정보는 보내지 않습니다.
          </p>
        </section>
      </section>
    `;
  }

  function renderMetric(label, value, hint) {
    return `
      <div class="metric-item">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <p>${escapeHtml(hint)}</p>
      </div>
    `;
  }

  function renderTeacherEmptyState() {
    return `
      <div class="empty-state">
        <h4>아직 현재 풀이 기록이 없습니다.</h4>
        <p>학생 화면에서 선택 후 다음을 누르면 이곳에 현재 세션 기준 진단이 표시됩니다.</p>
      </div>
    `;
  }

  function renderSummaryRow(row) {
    return `
      <article class="summary-row severity-${row.copy.severity}">
        <div class="summary-main">
          <span class="severity-label">${severityLabel(row.copy.severity)}</span>
          <h4>${escapeHtml(row.copy.title)}</h4>
          <p>${escapeHtml(row.copy.interpretation)}</p>
        </div>
        <div class="summary-count">
          <strong>${row.studentCount}명</strong>
          <span>${row.eventCount}개 판단</span>
        </div>
        <p class="teaching-move">${escapeHtml(row.copy.teachingMove)}</p>
      </article>
    `;
  }

  function renderStudentSelector(student, selectedId) {
    const active = student.id === selectedId;
    const issueCount = student.logs.filter((log) => !log.isCorrect || log.usedUnknown).length;
    return `
      <button
        class="student-chip ${active ? "is-selected" : ""}"
        type="button"
        data-action="select-student"
        data-student-id="${escapeHtml(student.id)}"
        aria-selected="${active}"
      >
        <span>${escapeHtml(student.id)}</span>
        <strong>${issueCount}</strong>
      </button>
    `;
  }

  function renderStudentDetail(student) {
    if (!student.logs.length) {
      return `
        <div class="empty-state">
          <h4>아직 풀이 기록이 없습니다.</h4>
          <p>학생 화면에서 한 단계 이상 진행하면 이곳에 해석이 생깁니다.</p>
        </div>
      `;
    }

    return `
      <div class="timeline">
        ${student.logs.map(renderLogRow).join("")}
      </div>
    `;
  }

  function renderLogRow(log) {
    const status = log.isCorrect && !log.usedUnknown ? "안정" : "확인";
    return `
      <article class="timeline-row">
        <div class="timeline-header">
          <span>${escapeHtml(log.problemTitle || log.problemId)}</span>
          <strong>${escapeHtml(log.stepTitle || "판단")}</strong>
        </div>
        <div class="timeline-body">
          <p><span>선택</span>${escapeHtml(log.selectedLabel || "기록 없음")}</p>
          <p><span>시간 해석</span>${escapeHtml(timeInterpretation(log))}</p>
          <p><span>행동 신호</span>${escapeHtml(behaviorInterpretation(log))}</p>
        </div>
        <div class="timeline-footer">
          <span class="status-pill status-${status === "안정" ? "stable" : "check"}">${status}</span>
          <span>${escapeHtml(log.misconception || log.teacherNote || "현재 단계에서는 큰 흔들림이 보이지 않습니다.")}</span>
        </div>
      </article>
    `;
  }

  function getStudentsForTeacher() {
    const current = {
      id: "현재 익명 세션",
      logs: state.logs,
    };
    return [current];
  }

  function ensureSelectedStudent(students) {
    if (!students.some((student) => student.id === state.selectedStudentId)) {
      state.selectedStudentId = students[0].id;
    }
  }

  function buildClassSummary(students) {
    const summary = new Map();
    students.forEach((student) => {
      student.logs.forEach((log) => {
        collectSignal(summary, student.id, log.signal, log);
        if (log.durationMs >= 18000 || log.firstSelectionMs >= 14000) collectSignal(summary, student.id, "slow-judgment", log);
        if (log.selectionChanges >= 2) collectSignal(summary, student.id, "unstable-choice", log);
      });
    });

    return Array.from(summary.values())
      .filter((row) => row.copy)
      .sort((a, b) => {
        const severityDelta = severityRank(b.copy.severity) - severityRank(a.copy.severity);
        if (severityDelta) return severityDelta;
        return b.studentCount - a.studentCount || b.eventCount - a.eventCount;
      })
      .slice(0, 7);
  }

  function collectSignal(summary, studentId, signal, log) {
    const copy = SIGNAL_COPY[signal];
    if (!copy) return;
    if (copy.severity !== "positive" && log.isCorrect && !log.usedUnknown && signal !== "slow-judgment" && signal !== "unstable-choice") {
      return;
    }
    if (!summary.has(signal)) {
      summary.set(signal, {
        signal,
        copy,
        students: new Set(),
        eventCount: 0,
        studentCount: 0,
      });
    }
    const row = summary.get(signal);
    row.students.add(studentId);
    row.studentCount = row.students.size;
    row.eventCount += 1;
  }

  function timeInterpretation(log) {
    if (log.usedUnknown) return "오래 머문 뒤 발판 요청이 있었습니다.";
    if (log.durationMs >= 22000 || log.firstSelectionMs >= 18000) return "판단 근거를 찾는 시간이 길었습니다.";
    if (log.durationMs >= 12000 || log.firstSelectionMs >= 9000) return "충분히 고민한 뒤 선택했습니다.";
    if (log.durationMs <= 4500 && log.selectionChanges === 0) return "빠르게 확신하고 선택했습니다.";
    return "일반적인 속도로 판단했습니다.";
  }

  function behaviorInterpretation(log) {
    const parts = [];
    if (log.selectionChanges > 0) parts.push(`선택을 ${log.selectionChanges}번 바꿈`);
    if (log.usedUnknown) parts.push("잘 모르겠어요 사용");
    if (parts.length) return parts.join(", ");
    if (log.isCorrect) return "큰 흔들림 없이 다음 판단으로 이동";
    return "선택 변경 없이 오개념 신호가 남음";
  }

  function severityLabel(severity) {
    if (severity === "high") return "우선 지도";
    if (severity === "medium") return "확인 필요";
    if (severity === "positive") return "좋은 신호";
    return "관찰";
  }

  function severityRank(severity) {
    return { high: 3, medium: 2, low: 1, positive: 0 }[severity] || 0;
  }

  function stepOrdinal(problemIndex, stepIndex) {
    return questions.slice(0, problemIndex).reduce((sum, problem) => sum + problem.steps.length, 0) + stepIndex + 1;
  }

  function totalStepCount() {
    return questions.reduce((sum, problem) => sum + problem.steps.length, 0);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
