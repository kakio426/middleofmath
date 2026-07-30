export interface RuntimeStagePrerequisiteEdge {
  id: string;
  fromSetKey: string;
  fromStageId: string;
  toSetKey: string;
  toStageId: string;
  advisory: true;
}

const runtimeEdges: readonly RuntimeStagePrerequisiteEdge[] = Object.freeze([
  {
    id: "g3-multiplication-to-division",
    fromSetKey: "grade3-semester1",
    fromStageId: "multiplication.two-digit-by-one",
    toSetKey: "grade3-semester2",
    toStageId: "division.meaning",
    advisory: true
  },
  {
    id: "g3-length-to-capacity",
    fromSetKey: "grade3-semester1",
    fromStageId: "length.unit-convert",
    toSetKey: "grade3-semester2",
    toStageId: "measurement.capacity-measure",
    advisory: true
  },
  {
    id: "g3-multiplication-semester-sequence",
    fromSetKey: "grade3-semester1",
    fromStageId: "multiplication.two-digit-by-one",
    toSetKey: "grade3-semester2",
    toStageId: "multiplication.place-value",
    advisory: true
  },
  {
    id: "g3-division-semester-sequence",
    fromSetKey: "grade3-semester1",
    fromStageId: "division.multiplication-link",
    toSetKey: "grade3-semester2",
    toStageId: "division.remainder",
    advisory: true
  },
  {
    id: "g3-fraction-semester-sequence",
    fromSetKey: "grade3-semester1",
    fromStageId: "fraction.part-of-whole",
    toSetKey: "grade3-semester2",
    toStageId: "fraction.part-whole",
    advisory: true
  },
  {
    id: "g3-length-to-weight",
    fromSetKey: "grade3-semester1",
    fromStageId: "length.unit-choice",
    toSetKey: "grade3-semester2",
    toStageId: "measurement.weight-measure",
    advisory: true
  }
]);

export function incomingPrerequisiteEdges(
  setKey: string,
  stageId: string
): RuntimeStagePrerequisiteEdge[] {
  return runtimeEdges.filter(
    (edge) => edge.toSetKey === setKey && edge.toStageId === stageId
  );
}

export function runtimeStagePrerequisiteEdges(): RuntimeStagePrerequisiteEdge[] {
  return [...runtimeEdges];
}
