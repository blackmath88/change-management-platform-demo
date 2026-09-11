import { describe, expect, it } from "vitest";
import { createExampleCase } from "../domain/case";
import { createCaseFile, parseCaseFile } from "./case-file";

describe("case files", () => {
  it("round-trips a native Casework record", () => {
    const original = createExampleCase();
    const parsed = parseCaseFile(
      JSON.parse(JSON.stringify(createCaseFile(original))),
    );

    expect(parsed.migratedFromLegacy).toBe(false);
    expect(parsed.value).toEqual(original);
  });

  it("migrates the previous project and module envelope", () => {
    const parsed = parseCaseFile({
      meta: { schema_version: "1.0" },
      project: {
        title: "Operating model renewal",
        organization: "Northline",
        summary: "Regional hand-offs are breaking down.",
      },
      modules: {
        vision: {
          ctx_current: "Teams use incompatible intake practices.",
          ctx_why: "Demand has increased.",
          vision_statement: "One coherent path with local judgment intact.",
        },
        forces: {
          driving: [{ label: "Visible client need", strength: 4, type: "rational" }],
          resisting: [{ label: "Identity loss", strength: 5, type: "emotional" }],
          summary: "The need is accepted; authority is contested.",
        },
        stakeholders: {
          stakeholders: [{
            id: "regional-leads",
            name: "Regional leads",
            role: "Operational authority",
            power: 5,
            interest: 5,
            stance: "skeptic",
            concerns: "Loss of local discretion",
          }],
        },
        communication: {
          core_problem: "Clients compensate for broken hand-offs.",
          core_solution: "One clear entry path.",
          comms_risk_notes: "Do not conceal the implementation cost.",
        },
        nudges: {
          nudges: [{
            id: "pilot",
            title: "Run a practitioner-led pilot",
            action: "Test one region for two weeks",
            timing: "Before final design",
          }],
        },
        coordinate: {
          differences: [{
            id: "exception-rule",
            positionA_label: "Use a common exception rule",
            positionB_label: "Rely on professional judgment",
            values_at_stake: "Consistency versus discretion",
          }],
          summary: "Review exceptions together each month.",
        },
      },
    });

    expect(parsed.migratedFromLegacy).toBe(true);
    expect(parsed.value.title).toBe("Operating model renewal");
    expect(parsed.value.workspaces.dynamics.forces).toHaveLength(2);
    expect(parsed.value.workspaces.dynamics.forces[1].kind).toBe("constraining");
    expect(parsed.value.workspaces.influence.actors[0].stance).toBe(-1);
    expect(parsed.value.workspaces.experiments.items[0].status).toBe("idea");
    expect(parsed.value.workspaces.differences.items[0].tension).toBe(
      "Consistency versus discretion",
    );
  });

  it("rejects unrelated JSON", () => {
    expect(() => parseCaseFile({ hello: "world" })).toThrow(
      "not a Casework record",
    );
  });
});
