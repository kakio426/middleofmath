import graphJson from "./grade3-stage-prerequisite-graph.json";

export type StagePrerequisiteBasis =
  | "upstream-anchor-pair"
  | "same-anchor-editorial-sequence"
  | "local-editorial";

export interface StagePrerequisiteEdge {
  id: string;
  fromSetKey: string;
  fromStageId: string;
  toSetKey: string;
  toStageId: string;
  basis: StagePrerequisiteBasis;
  strength: "hard" | "soft";
  advisory: boolean;
  upstreamTopicId?: string;
  upstreamPrerequisiteId?: string;
  reviewEvidence: string;
}

export interface StagePrerequisiteGraph {
  graphRevision: string;
  sourceSetKey: string;
  reviewEvidence: string;
  edges: StagePrerequisiteEdge[];
  graphDigest: string;
}

export const grade3StagePrerequisiteGraph =
  graphJson as StagePrerequisiteGraph;

const prerequisiteGraphRegistry = new Map<string, StagePrerequisiteGraph | null>([
  [grade3StagePrerequisiteGraph.sourceSetKey, grade3StagePrerequisiteGraph]
]);

export function findStagePrerequisiteGraph(
  sourceSetKey: string
): StagePrerequisiteGraph | null | undefined {
  return prerequisiteGraphRegistry.get(sourceSetKey);
}

export function requiresStagePrerequisiteGraph(sourceSetKey: string): boolean {
  return prerequisiteGraphRegistry.has(sourceSetKey);
}

export function registeredStagePrerequisiteGraphSetKeys(): string[] {
  return [...prerequisiteGraphRegistry.keys()].sort();
}

export function registeredStagePrerequisiteGraphs(): StagePrerequisiteGraph[] {
  return [...prerequisiteGraphRegistry.values()]
    .filter((graph): graph is StagePrerequisiteGraph => Boolean(graph));
}
