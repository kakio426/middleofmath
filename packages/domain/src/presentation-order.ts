export interface PresentationSeed {
  readonly sessionId: string;
  readonly judgmentId: string;
}

export interface PresentationBalanceJudgment {
  readonly id: string;
  readonly choiceIds: readonly string[];
  readonly correctChoiceId: string;
}

export interface PresentationBalanceGroup {
  choiceCount: number;
  sampleCount: number;
  expectedRate: number;
  positionCounts: number[];
  positionRates: number[];
  maxDeviation: number;
}

export interface DegeneratePresentationSession {
  sessionId: string;
  judgmentCount: number;
  dominantPosition: number;
  dominantPositionRate: number;
}

export interface PresentationBalanceReport {
  groups: PresentationBalanceGroup[];
  maxDeviation: number;
  degenerateSessions: DegeneratePresentationSession[];
  authoredFirstFixedSessionIds: string[];
}

export function presentationHash(seed: PresentationSeed, choiceId: string): number {
  const value = `${seed.sessionId}\u0000${seed.judgmentId}\u0000${choiceId}`;
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619) >>> 0;
  }
  return hash;
}

export function presentedChoiceIds(
  seed: PresentationSeed,
  choiceIds: readonly string[]
): string[] {
  return [...choiceIds].sort((left, right) => {
    const hashDifference = presentationHash(seed, left) - presentationHash(seed, right);
    if (hashDifference !== 0) return hashDifference;
    if (left === right) return 0;
    return left < right ? -1 : 1;
  });
}

export function presentedChoices<TChoice extends { id: string }>(
  seed: PresentationSeed,
  choices: readonly TChoice[]
): TChoice[] {
  const byId = new Map(choices.map((choice) => [choice.id, choice]));
  return presentedChoiceIds(seed, choices.map((choice) => choice.id))
    .map((choiceId) => byId.get(choiceId))
    .filter((choice): choice is TChoice => Boolean(choice));
}

export function analyzePresentationBalance(input: {
  sessionIds: readonly string[];
  judgments: readonly PresentationBalanceJudgment[];
}): PresentationBalanceReport {
  const countsByChoiceCount = new Map<number, number[]>();
  const samplesByChoiceCount = new Map<number, number>();
  const sessionPositions = new Map<string, number[]>();
  const authoredFirstFixedSessionIds: string[] = [];

  for (const sessionId of input.sessionIds) {
    const positions: number[] = [];
    let authoredFirstStillFirst = 0;
    for (const judgment of input.judgments) {
      if (
        judgment.choiceIds.length < 2
        || !judgment.choiceIds.includes(judgment.correctChoiceId)
      ) {
        continue;
      }
      const order = presentedChoiceIds(
        { sessionId, judgmentId: judgment.id },
        judgment.choiceIds
      );
      const position = order.indexOf(judgment.correctChoiceId);
      if (position < 0) continue;

      const counts = countsByChoiceCount.get(judgment.choiceIds.length)
        ?? Array.from({ length: judgment.choiceIds.length }, () => 0);
      counts[position] += 1;
      countsByChoiceCount.set(judgment.choiceIds.length, counts);
      samplesByChoiceCount.set(
        judgment.choiceIds.length,
        (samplesByChoiceCount.get(judgment.choiceIds.length) ?? 0) + 1
      );
      positions.push(position);
      if (order[0] === judgment.choiceIds[0]) {
        authoredFirstStillFirst += 1;
      }
    }
    sessionPositions.set(sessionId, positions);
    if (positions.length > 0 && authoredFirstStillFirst === positions.length) {
      authoredFirstFixedSessionIds.push(sessionId);
    }
  }

  const groups = [...countsByChoiceCount.entries()]
    .sort(([left], [right]) => left - right)
    .map(([choiceCount, positionCounts]) => {
      const sampleCount = samplesByChoiceCount.get(choiceCount) ?? 0;
      const expectedRate = 1 / choiceCount;
      const positionRates = positionCounts.map((count) =>
        sampleCount === 0 ? 0 : count / sampleCount
      );
      return {
        choiceCount,
        sampleCount,
        expectedRate,
        positionCounts,
        positionRates,
        maxDeviation: Math.max(
          ...positionRates.map((rate) => Math.abs(rate - expectedRate))
        )
      };
    });

  const degenerateSessions = [...sessionPositions.entries()]
    .filter(([, positions]) => positions.length >= 5)
    .map(([sessionId, positions]) => {
      const positionCounts = new Map<number, number>();
      for (const position of positions) {
        positionCounts.set(position, (positionCounts.get(position) ?? 0) + 1);
      }
      const [dominantPosition, dominantCount] = [...positionCounts.entries()]
        .sort(([leftPosition, leftCount], [rightPosition, rightCount]) =>
          rightCount - leftCount || leftPosition - rightPosition
        )[0];
      return {
        sessionId,
        judgmentCount: positions.length,
        dominantPosition: dominantPosition + 1,
        dominantPositionRate: dominantCount / positions.length
      };
    })
    .filter((session) => session.dominantPositionRate > 0.8);

  return {
    groups,
    maxDeviation: groups.length === 0
      ? 0
      : Math.max(...groups.map((group) => group.maxDeviation)),
    degenerateSessions,
    authoredFirstFixedSessionIds
  };
}
