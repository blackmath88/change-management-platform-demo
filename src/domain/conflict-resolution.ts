import { changeCaseSchema, type ChangeCase, type WorkspaceKey } from "./case";

export type ConflictSectionKey = "record" | WorkspaceKey;
export type ConflictChoices = Partial<Record<ConflictSectionKey, "local" | "remote">>;

export const conflictSections: ReadonlyArray<{
  key: ConflictSectionKey;
  label: string;
}> = [
  { key: "record", label: "Case frame" },
  { key: "direction", label: "Direction" },
  { key: "dynamics", label: "Dynamics" },
  { key: "influence", label: "Influence" },
  { key: "narrative", label: "Narrative" },
  { key: "experiments", label: "Experiments" },
  { key: "differences", label: "Differences" },
];

function recordFrame(value: ChangeCase) {
  return {
    title: value.title,
    organization: value.organization,
    situation: value.situation,
    status: value.status,
  };
}

function sectionValue(value: ChangeCase, key: ConflictSectionKey) {
  return key === "record" ? recordFrame(value) : value.workspaces[key];
}

export function changedConflictSections(
  local: ChangeCase,
  remote: ChangeCase,
): ConflictSectionKey[] {
  return conflictSections
    .filter(({ key }) => JSON.stringify(sectionValue(local, key)) !== JSON.stringify(sectionValue(remote, key)))
    .map(({ key }) => key);
}

export function conflictSectionSummary(value: ChangeCase, key: ConflictSectionKey): string {
  switch (key) {
    case "record":
      return [value.organization, value.status, value.situation].filter(Boolean).join(" · ");
    case "direction":
      return value.workspaces.direction.intendedOutcome || value.workspaces.direction.presentTension || "No direction recorded";
    case "dynamics":
      return `${value.workspaces.dynamics.forces.length} forces · ${value.workspaces.dynamics.interpretation || "No interpretation"}`;
    case "influence":
      return `${value.workspaces.influence.actors.length} actors · ${value.workspaces.influence.interpretation || "No interpretation"}`;
    case "narrative":
      return value.workspaces.narrative.centralTruth || value.workspaces.narrative.promise || "No narrative recorded";
    case "experiments":
      return `${value.workspaces.experiments.items.length} experiments · ${value.workspaces.experiments.learningQuestion || "No learning question"}`;
    case "differences":
      return `${value.workspaces.differences.items.length} tensions · ${value.workspaces.differences.operatingAgreement || "No operating agreement"}`;
  }
}

export function mergeConflict(
  local: ChangeCase,
  remote: ChangeCase,
  choices: ConflictChoices,
): ChangeCase {
  if (local.id !== remote.id) throw new Error("Cannot merge two different cases.");
  const record = choices.record === "remote" ? recordFrame(remote) : recordFrame(local);
  const workspaces = structuredClone(local.workspaces);
  const history = [...local.history, ...remote.history]
    .filter((entry, index, entries) => entries.findIndex(({ id }) => id === entry.id) === index)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  for (const { key } of conflictSections) {
    if (key !== "record" && choices[key] === "remote") {
      workspaces[key] = structuredClone(remote.workspaces[key]) as never;
    }
  }

  return changeCaseSchema.parse({
    ...local,
    ...record,
    workspaces,
    history,
    revision: Math.max(local.revision, remote.revision),
  });
}
