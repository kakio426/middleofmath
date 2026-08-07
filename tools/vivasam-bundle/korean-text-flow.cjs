"use strict";

const TEXT_FLOW_CONTRACT_VERSION = 1;

const SLIDE_TITLE_FLOW = Object.freeze({
  maxCharactersPerLine: 20,
  maxLines: 2,
  minLastLineCharacters: 4,
});

const TWO_COLUMN_TITLE_FLOW = Object.freeze({
  maxCharactersPerLine: 16,
  maxLines: 2,
  minLastLineCharacters: 4,
});

const SUMMARY_NEXT_QUESTION_FLOW = Object.freeze({
  maxCharactersPerLine: 10,
  maxLines: 4,
  minLastLineCharacters: 4,
});

function compactWhitespace(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function countCharacters(value) {
  return Array.from(String(value)).length;
}

function sourceTokens(value) {
  const normalized = compactWhitespace(value);
  return normalized ? normalized.split(" ") : [];
}

function assertKoreanTextFlow(source, lines, options) {
  const expectedTokens = sourceTokens(source);
  const safeLines = Array.isArray(lines) ? lines.map((line) => compactWhitespace(line)).filter(Boolean) : [];
  const actualTokens = safeLines.flatMap((line) => line.split(" "));
  const maxCharacters = options.maxCharactersPerLine;
  const maxLines = options.maxLines;
  const minLast = options.minLastLineCharacters ?? 1;

  if (safeLines.length === 0) throw new Error("한국어 줄바꿈 계약 위반: 표시할 문장이 비었습니다.");
  if (safeLines.length > maxLines) throw new Error(`한국어 줄바꿈 계약 위반: ${safeLines.length}줄이 최대 ${maxLines}줄을 넘습니다.`);
  if (expectedTokens.length !== actualTokens.length || expectedTokens.some((token, index) => token !== actualTokens[index])) {
    throw new Error("한국어 줄바꿈 계약 위반: 어절이 줄 중간에서 분리되었거나 순서가 바뀌었습니다.");
  }
  safeLines.forEach((line, index) => {
    if (countCharacters(line) > maxCharacters) {
      throw new Error(`한국어 줄바꿈 계약 위반: ${index + 1}번째 줄이 ${maxCharacters}자를 넘습니다: ${line}`);
    }
    if (/^[,.;:!?…·)\]}]/u.test(line)) {
      throw new Error(`한국어 줄바꿈 계약 위반: ${index + 1}번째 줄이 문장부호로 시작합니다: ${line}`);
    }
    if (/(?:및|또는|그리고|→)$/u.test(line)) {
      throw new Error(`한국어 줄바꿈 계약 위반: ${index + 1}번째 줄이 연결 표현에서 끊겼습니다: ${line}`);
    }
  });
  if (safeLines.length > 1 && countCharacters(safeLines.at(-1).replace(/\s/g, "")) < minLast) {
    throw new Error("한국어 줄바꿈 계약 위반: 마지막 줄에 짧은 토막만 남았습니다.");
  }
  return safeLines;
}

function wrapKoreanWords(source, options) {
  const tokens = sourceTokens(source);
  const maxCharacters = options.maxCharactersPerLine;
  const lines = [];
  let current = "";

  if (!tokens.length) throw new Error("한국어 줄바꿈 계약 위반: 표시할 문장이 비었습니다.");
  for (const token of tokens) {
    if (countCharacters(token) > maxCharacters) {
      throw new Error(`한국어 줄바꿈 계약 위반: '${token}' 어절이 한 줄 허용 폭 ${maxCharacters}자를 넘습니다. 상자를 넓히거나 글자 크기를 조정하세요.`);
    }
    const candidate = current ? `${current} ${token}` : token;
    if (current && countCharacters(candidate) > maxCharacters) {
      lines.push(current);
      current = token;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  const minLast = options.minLastLineCharacters ?? 1;
  while (lines.length > 1 && countCharacters(lines.at(-1).replace(/\s/g, "")) < minLast) {
    const previousTokens = lines.at(-2).split(" ");
    if (previousTokens.length <= 1) break;
    const moved = previousTokens.at(-1);
    const rebalancedLast = `${moved} ${lines.at(-1)}`;
    const rebalancedPrevious = previousTokens.slice(0, -1).join(" ");
    if (!rebalancedPrevious || countCharacters(rebalancedLast) > maxCharacters) break;
    lines.splice(lines.length - 2, 2, rebalancedPrevious, rebalancedLast);
  }
  return assertKoreanTextFlow(source, lines, options);
}

function explicitKoreanLines(source, options) {
  const authoredLines = String(source).split(/\r?\n/).map((line) => compactWhitespace(line)).filter(Boolean);
  if (authoredLines.length > 1) return assertKoreanTextFlow(source, authoredLines, options);
  return wrapKoreanWords(source, options);
}

function toPptxTextRuns(lines) {
  return lines.map((line, index) => ({
    text: line,
    options: { breakLine: index < lines.length - 1 },
  }));
}

module.exports = {
  TEXT_FLOW_CONTRACT_VERSION,
  SLIDE_TITLE_FLOW,
  TWO_COLUMN_TITLE_FLOW,
  SUMMARY_NEXT_QUESTION_FLOW,
  assertKoreanTextFlow,
  explicitKoreanLines,
  toPptxTextRuns,
  wrapKoreanWords,
};
