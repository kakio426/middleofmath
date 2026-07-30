import type { DiagnosisCoverageBlueprint } from "./coverage";
import { grade3Semester1CoverageBlueprint } from "./grade3-semester1-coverage";
import { grade3Semester2CoverageBlueprint } from "./grade3-semester2-coverage";
import { grade4Semester1CoverageBlueprint } from "./grade4-semester1-coverage";

const blueprints = Object.freeze<Record<string, DiagnosisCoverageBlueprint>>({
  [grade3Semester1CoverageBlueprint.diagnosisSetId]: grade3Semester1CoverageBlueprint,
  [grade3Semester2CoverageBlueprint.diagnosisSetId]: grade3Semester2CoverageBlueprint,
  [grade4Semester1CoverageBlueprint.diagnosisSetId]: grade4Semester1CoverageBlueprint
});

export function findCoverageBlueprint(
  setKey: string
): DiagnosisCoverageBlueprint | undefined {
  return blueprints[setKey];
}

export function registeredBlueprintSetKeys(): string[] {
  return Object.keys(blueprints).sort();
}
