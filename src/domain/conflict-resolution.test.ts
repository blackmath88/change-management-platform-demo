import { describe, expect, it } from "vitest";
import { createEmptyCase } from "./case";
import { changedConflictSections, mergeConflict } from "./conflict-resolution";

function conflictingCases() {
  const local = createEmptyCase({
    title: "Local title",
    organization: "Common organization",
    situation: "Local situation",
  });
  local.revision = 3;
  local.workspaces.direction.intendedOutcome = "Keep local direction";

  const remote = structuredClone(local);
  remote.title = "Remote title";
  remote.revision = 5;
  remote.workspaces.direction.intendedOutcome = "Use remote direction";
  remote.workspaces.narrative.promise = "Use remote promise";
  return { local, remote };
}

describe("conflict resolution", () => {
  it("identifies differences in terms of the product workspaces", () => {
    const { local, remote } = conflictingCases();
    expect(changedConflictSections(local, remote)).toEqual([
      "record",
      "direction",
      "narrative",
    ]);
  });

  it("combines deliberate section choices without mutating either source", () => {
    const { local, remote } = conflictingCases();
    local.history.push({
      id: "local-evidence",
      kind: "evidence",
      statement: "Local observation",
      context: "",
      source: "",
      workspace: "case",
      recordedAt: "2026-09-11T10:00:00.000Z",
    });
    remote.history.push({
      id: "remote-decision",
      kind: "decision",
      statement: "Remote decision",
      context: "",
      source: "",
      workspace: "direction",
      recordedAt: "2026-09-11T11:00:00.000Z",
    });
    const merged = mergeConflict(local, remote, {
      record: "local",
      direction: "remote",
      narrative: "remote",
    });

    expect(merged.title).toBe("Local title");
    expect(merged.workspaces.direction.intendedOutcome).toBe("Use remote direction");
    expect(merged.workspaces.narrative.promise).toBe("Use remote promise");
    expect(merged.revision).toBe(5);
    expect(merged.history.map(({ id }) => id)).toEqual([
      "local-evidence",
      "remote-decision",
    ]);
    expect(local.workspaces.direction.intendedOutcome).toBe("Keep local direction");
  });
});
