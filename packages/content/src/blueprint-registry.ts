import type { DiagnosisCoverageBlueprint } from "./coverage";
import { grade3Semester1CoverageBlueprint } from "./grade3-semester1-coverage";
import { grade3Semester2CoverageBlueprint } from "./grade3-semester2-coverage";
import { grade4Semester1CoverageBlueprint } from "./grade4-semester1-coverage";
import { grade4Semester2CoverageBlueprint } from "./grade4-semester2-coverage";
import { grade5Semester1CoverageBlueprint } from "./grade5-semester1-coverage";
import { grade5Semester2CoverageBlueprint } from "./grade5-semester2";
import { grade6Semester1CoverageBlueprint } from "./grade6-semester1";
import { grade6Semester2CoverageBlueprint } from "./grade6-semester2";

const blueprints = Object.freeze<Record<string, DiagnosisCoverageBlueprint>>({
  [grade3Semester1CoverageBlueprint.diagnosisSetId]: grade3Semester1CoverageBlueprint,
  [grade3Semester2CoverageBlueprint.diagnosisSetId]: grade3Semester2CoverageBlueprint,
  [grade4Semester1CoverageBlueprint.diagnosisSetId]: grade4Semester1CoverageBlueprint,
  [grade4Semester2CoverageBlueprint.diagnosisSetId]: grade4Semester2CoverageBlueprint,
  [grade5Semester1CoverageBlueprint.diagnosisSetId]: grade5Semester1CoverageBlueprint,
  [grade5Semester2CoverageBlueprint.diagnosisSetId]: grade5Semester2CoverageBlueprint,
  [grade6Semester1CoverageBlueprint.diagnosisSetId]: grade6Semester1CoverageBlueprint,
  [grade6Semester2CoverageBlueprint.diagnosisSetId]: grade6Semester2CoverageBlueprint
});

export function findCoverageBlueprint(
  setKey: string
): DiagnosisCoverageBlueprint | undefined {
  return blueprints[setKey];
}

export function registeredBlueprintSetKeys(): string[] {
  return Object.keys(blueprints).sort();
}
