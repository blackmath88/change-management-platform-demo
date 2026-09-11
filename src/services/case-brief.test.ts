import { describe, expect, it } from "vitest";
import { createExampleCase } from "../domain/case";
import { contextBriefToMarkdown, createContextBrief } from "./case-brief";

describe("context brief", () => {
  it("orders consequential material into a portable brief", () => {
    const value = createExampleCase();
    value.revision = 12;
    const brief = createContextBrief(value, {
      audience: "Regional leads",
      purpose: "Prepare the pilot decision",
      generatedAt: "2026-09-12T10:00:00.000Z",
    });

    expect(brief.sections.map(({ id }) => id)).toEqual([
      "direction",
      "dynamics",
      "influence",
      "narrative",
      "experiments",
      "differences",
      "record",
    ]);
    expect(brief.sections.find(({ id }) => id === "dynamics")?.items[0].label)
      .toContain("5/5");
    expect(contextBriefToMarkdown(brief)).toContain(
      "**Prepared for:** Regional leads",
    );
    expect(contextBriefToMarkdown(brief)).toContain("**Case revision:** 12");
  });

  it("omits empty workspaces instead of manufacturing conclusions", () => {
    const value = createExampleCase();
    value.workspaces.narrative = {
      centralTruth: "",
      promise: "",
      acknowledgedCost: "",
      invitation: "",
    };

    const brief = createContextBrief(value, {
      audience: "",
      purpose: "",
      generatedAt: "2026-09-12T10:00:00.000Z",
    });
    expect(brief.sections.some(({ id }) => id === "narrative")).toBe(false);
  });
});
