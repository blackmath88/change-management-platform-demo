import { z } from "zod";

export const caseStatusSchema = z.enum(["active", "paused", "complete", "archived"]);
export type CaseStatus = z.infer<typeof caseStatusSchema>;

const forceSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["enabling", "constraining"]),
  strength: z.number().min(1).max(5),
  evidence: z.string(),
});

const actorSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  influence: z.number().min(1).max(5),
  stance: z.number().min(-2).max(2),
  interest: z.number().min(1).max(5),
  notes: z.string(),
});

const experimentSchema = z.object({
  id: z.string(),
  hypothesis: z.string(),
  signal: z.string(),
  status: z.enum(["idea", "running", "observed"]),
});

const differenceSchema = z.object({
  id: z.string(),
  tension: z.string(),
  sideA: z.string(),
  sideB: z.string(),
  coordination: z.string(),
});

export const caseHistoryEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(["decision", "evidence"]),
  statement: z.string(),
  context: z.string(),
  source: z.string(),
  workspace: z.union([
    z.literal("case"),
    z.enum([
      "direction",
      "dynamics",
      "influence",
      "narrative",
      "experiments",
      "differences",
    ]),
  ]),
  recordedAt: z.string(),
});

export const changeCaseSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  title: z.string(),
  organization: z.string(),
  situation: z.string(),
  status: caseStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  revision: z.number().int().nonnegative(),
  workspaces: z.object({
    direction: z.object({
      intendedOutcome: z.string(),
      presentTension: z.string(),
      whyNow: z.string(),
      boundaries: z.string(),
      evidence: z.string(),
      assumptions: z.string(),
    }),
    dynamics: z.object({
      forces: z.array(forceSchema),
      interpretation: z.string(),
    }),
    influence: z.object({
      actors: z.array(actorSchema),
      interpretation: z.string(),
    }),
    narrative: z.object({
      centralTruth: z.string(),
      promise: z.string(),
      acknowledgedCost: z.string(),
      invitation: z.string(),
    }),
    experiments: z.object({
      items: z.array(experimentSchema),
      learningQuestion: z.string(),
    }),
    differences: z.object({
      items: z.array(differenceSchema),
      operatingAgreement: z.string(),
    }),
  }),
  history: z.array(caseHistoryEntrySchema).default([]),
});

export type ChangeCase = z.infer<typeof changeCaseSchema>;
export type CaseHistoryEntry = z.infer<typeof caseHistoryEntrySchema>;
export type Force = ChangeCase["workspaces"]["dynamics"]["forces"][number];
export type Actor = ChangeCase["workspaces"]["influence"]["actors"][number];
export type Experiment = ChangeCase["workspaces"]["experiments"]["items"][number];
export type Difference = ChangeCase["workspaces"]["differences"]["items"][number];
export type WorkspaceKey = keyof ChangeCase["workspaces"];

export function createEmptyCase(
  input: Pick<ChangeCase, "title" | "organization" | "situation">,
): ChangeCase {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    title: input.title.trim() || "Untitled case",
    organization: input.organization.trim(),
    situation: input.situation.trim(),
    status: "active",
    createdAt: now,
    updatedAt: now,
    revision: 0,
    workspaces: {
      direction: {
        intendedOutcome: "",
        presentTension: input.situation.trim(),
        whyNow: "",
        boundaries: "",
        evidence: "",
        assumptions: "",
      },
      dynamics: { forces: [], interpretation: "" },
      influence: { actors: [], interpretation: "" },
      narrative: {
        centralTruth: "",
        promise: "",
        acknowledgedCost: "",
        invitation: "",
      },
      experiments: { items: [], learningQuestion: "" },
      differences: { items: [], operatingAgreement: "" },
    },
    history: [],
  };
}

export function createExampleCase(): ChangeCase {
  const value = createEmptyCase({
    title: "A service model people can actually use",
    organization: "Northline Cooperative",
    situation:
      "Three regional teams are consolidating their intake process while protecting local judgment and trusted relationships.",
  });

  value.workspaces.direction = {
    intendedOutcome:
      "A shared intake experience that feels coherent to clients without erasing the expertise of regional teams.",
    presentTension:
      "Consistency is needed, but the current proposal treats valuable local variation as failure.",
    whyNow:
      "Demand has increased by 28%, hand-offs are failing, and teams are already creating unofficial workarounds.",
    boundaries:
      "Local teams retain authority over exceptional cases. No launch before frontline testing.",
    evidence:
      "Client interviews · hand-off audit · regional team retrospectives",
    assumptions:
      "A common entry point can coexist with distributed professional judgment.",
  };
  value.workspaces.dynamics = {
    forces: [
      {
        id: crypto.randomUUID(),
        label: "Frontline frustration with repeated data entry",
        kind: "enabling",
        strength: 4,
        evidence: "Mentioned in 17 of 21 interviews",
      },
      {
        id: crypto.randomUUID(),
        label: "Fear that central standards will remove local discretion",
        kind: "constraining",
        strength: 5,
        evidence: "Raised by every regional lead",
      },
      {
        id: crypto.randomUUID(),
        label: "Visible sponsorship from operations",
        kind: "enabling",
        strength: 3,
        evidence: "Funding and time protected for two pilots",
      },
    ],
    interpretation:
      "The practical case is accepted. Resistance concentrates around professional identity and decision rights, not the need to improve intake.",
  };
  value.workspaces.influence = {
    actors: [
      {
        id: crypto.randomUUID(),
        name: "Regional leads",
        role: "Operational authority",
        influence: 5,
        stance: -1,
        interest: 5,
        notes: "Need a credible boundary around local discretion.",
      },
      {
        id: crypto.randomUUID(),
        name: "Intake practitioners",
        role: "Daily users",
        influence: 3,
        stance: 1,
        interest: 5,
        notes: "Support improvement but distrust a head-office design.",
      },
      {
        id: crypto.randomUUID(),
        name: "Operations sponsor",
        role: "Executive sponsor",
        influence: 5,
        stance: 2,
        interest: 4,
        notes: "Can protect experimentation from premature standardization.",
      },
    ],
    interpretation:
      "Regional leads are not blockers to manage; they are the holders of the operating knowledge the design currently lacks.",
  };
  value.workspaces.narrative = {
    centralTruth:
      "The present system asks clients and practitioners to compensate for broken hand-offs.",
    promise:
      "One clear way into the service, with expert judgment preserved where it matters.",
    acknowledgedCost:
      "Teams will need to make their local rules visible and retire some familiar workarounds.",
    invitation:
      "Help define the minimum common path and the explicit points where local judgment begins.",
  };
  value.workspaces.experiments = {
    learningQuestion:
      "Can one shared entry pattern reduce hand-off failure without slowing exceptional cases?",
    items: [
      {
        id: crypto.randomUUID(),
        hypothesis:
          "A two-week pilot co-designed by practitioners will reduce duplicate entry without reducing discretion.",
        signal: "Duplicate fields and exception handling time",
        status: "running",
      },
    ],
  };
  value.workspaces.differences = {
    items: [
      {
        id: crypto.randomUUID(),
        tension: "Who defines an exceptional case?",
        sideA: "A common rule is required for consistency.",
        sideB: "Professional judgment cannot be exhaustively codified.",
        coordination:
          "Publish a small shared baseline and review exceptions monthly instead of forcing a complete definition now.",
      },
    ],
    operatingAgreement:
      "We will standardize the client entry path while treating exception handling as a governed professional practice.",
  };
  value.history = [
    {
      id: crypto.randomUUID(),
      kind: "evidence",
      statement: "Repeated data entry is a shared frontline concern.",
      context: "Seventeen of twenty-one practitioner interviews named it without prompting.",
      source: "Practitioner interviews, synthesis round 01",
      workspace: "dynamics",
      recordedAt: new Date(Date.now() - 86_400_000 * 3).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      kind: "decision",
      statement: "Local teams retain authority over exceptional cases.",
      context: "A common intake path should not silently become centralized professional judgment.",
      source: "Regional leads working session",
      workspace: "direction",
      recordedAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
  ];
  return value;
}

export function createCaseCopy(
  source: ChangeCase,
  now = new Date().toISOString(),
): ChangeCase {
  const duplicate = structuredClone(source);
  duplicate.id = crypto.randomUUID();
  duplicate.title = `${source.title} — working copy`;
  duplicate.status = "active";
  duplicate.revision = 0;
  duplicate.createdAt = now;
  duplicate.updatedAt = now;
  return changeCaseSchema.parse(duplicate);
}
