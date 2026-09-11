import { describe, expect, it } from "vitest";
import {
  changeCaseSchema,
  createCaseCopy,
  createEmptyCase,
  createExampleCase,
} from "./case";

describe("change case", () => {
  it("creates a complete, versioned durable record", () => {
    const value = createEmptyCase({
      title: "  A difficult transition  ",
      organization: "  Northline  ",
      situation: "  Two operating models overlap.  ",
    });

    expect(changeCaseSchema.parse(value)).toEqual(value);
    expect(value.title).toBe("A difficult transition");
    expect(value.organization).toBe("Northline");
    expect(value.workspaces.direction.presentTension).toBe(
      "Two operating models overlap.",
    );
    expect(Object.keys(value.workspaces)).toEqual([
      "direction",
      "dynamics",
      "influence",
      "narrative",
      "experiments",
      "differences",
    ]);
  });

  it("ships a product example without course or university language", () => {
    const value = createExampleCase();
    const serialized = JSON.stringify(value).toLowerCase();

    expect(changeCaseSchema.safeParse(value).success).toBe(true);
    expect(serialized).not.toContain("imd");
    expect(serialized).not.toContain("course");
    expect(serialized).not.toContain("university");
    expect(value.workspaces.dynamics.forces).toHaveLength(3);
    expect(value.workspaces.influence.actors).toHaveLength(3);
    expect(value.history).toHaveLength(2);
  });

  it("opens records created before history was introduced", () => {
    const previousRecord = createEmptyCase({
      title: "Earlier record",
      organization: "Northline",
      situation: "Created under the first schema.",
    }) as Record<string, unknown>;
    delete previousRecord.history;

    expect(changeCaseSchema.parse(previousRecord).history).toEqual([]);
  });

  it("duplicates a case as a distinct active working record", () => {
    const original = createExampleCase();
    original.status = "archived";
    original.revision = 14;
    const duplicate = createCaseCopy(original, "2026-09-11T20:00:00.000Z");

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.title).toBe(`${original.title} — working copy`);
    expect(duplicate.status).toBe("active");
    expect(duplicate.revision).toBe(0);
    expect(duplicate.createdAt).toBe("2026-09-11T20:00:00.000Z");
    expect(duplicate.workspaces).toEqual(original.workspaces);
  });
});
