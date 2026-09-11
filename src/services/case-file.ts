import {
  changeCaseSchema,
  createEmptyCase,
  type Actor,
  type ChangeCase,
  type Difference,
  type Experiment,
  type Force,
} from "../domain/case";

export interface CaseFile {
  format: "casework.case";
  formatVersion: 1;
  exportedAt: string;
  case: ChangeCase;
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberIn(value: unknown, minimum: number, maximum: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.max(minimum, Math.min(maximum, parsed))
    : fallback;
}

function joined(...values: unknown[]) {
  return values.map(text).filter(Boolean).join("\n\n");
}

function migrateForces(value: UnknownRecord): Force[] {
  const convert = (kind: Force["kind"]) => (item: UnknownRecord): Force => ({
    id: text(item.id) || crypto.randomUUID(),
    label: text(item.label),
    kind,
    strength: numberIn(item.strength, 1, 5, 3),
    evidence: text(item.evidence) || (text(item.type) ? `Previously marked: ${text(item.type)}` : ""),
  });
  return [
    ...records(value.driving).map(convert("enabling")),
    ...records(value.resisting).map(convert("constraining")),
  ];
}

const stanceValues: Record<string, number> = {
  champion: 2,
  supporter: 2,
  supportive: 1,
  neutral: 0,
  undecided: 0,
  skeptic: -1,
  sceptic: -1,
  blocker: -2,
  resistant: -2,
};

function migrateActors(value: UnknownRecord): Actor[] {
  return records(value.stakeholders).map((item) => ({
    id: text(item.id) || crypto.randomUUID(),
    name: text(item.name),
    role: text(item.role) || text(item.group),
    influence: numberIn(item.power ?? item.influence, 1, 5, 3),
    interest: numberIn(item.interest, 1, 5, 3),
    stance:
      stanceValues[text(item.stance).toLowerCase()] ??
      numberIn(item.stance, -2, 2, 0),
    notes: joined(item.motivations, item.concerns, item.needs, item.notes),
  }));
}

function migrateExperiments(value: UnknownRecord): Experiment[] {
  return records(value.nudges).map((item) => ({
    id: text(item.id) || crypto.randomUUID(),
    hypothesis:
      joined(item.title, item.action) ||
      "Imported intervention; rewrite this as a testable hypothesis.",
    signal: joined(item.timing, item.barrier),
    status: "idea",
  }));
}

function migrateDifferences(value: UnknownRecord): Difference[] {
  return records(value.differences).map((item) => ({
    id: text(item.id) || crypto.randomUUID(),
    tension: text(item.values_at_stake) || "Previously recorded difference",
    sideA: joined(item.positionA_label, item.positionA_holders),
    sideB: joined(item.positionB_label, item.positionB_holders),
    coordination: text(item.coordination),
  }));
}

export function createCaseFile(value: ChangeCase): CaseFile {
  return {
    format: "casework.case",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    case: changeCaseSchema.parse(value),
  };
}

export function parseCaseFile(input: unknown): {
  value: ChangeCase;
  migratedFromLegacy: boolean;
} {
  const outer = record(input);

  if (outer.format === "casework.case" && outer.formatVersion === 1) {
    return {
      value: changeCaseSchema.parse(outer.case),
      migratedFromLegacy: false,
    };
  }

  const direct = changeCaseSchema.safeParse(input);
  if (direct.success) {
    return { value: direct.data, migratedFromLegacy: false };
  }

  const project = record(outer.project);
  const modules = record(outer.modules);
  if (!Object.keys(project).length && !Object.keys(modules).length) {
    throw new Error("This file is not a Casework record or a recognized legacy export.");
  }

  const vision = record(modules.vision);
  const dynamics = record(modules.forces);
  const influence = record(modules.stakeholders);
  const communication = record(modules.communication);
  const nudges = record(modules.nudges);
  const coordinate = record(modules.coordinate);

  const value = createEmptyCase({
    title: text(project.title) || text(vision.ctx_title) || "Imported case",
    organization: text(project.organization) || text(vision.ctx_org),
    situation:
      text(project.summary) ||
      text(vision.ctx_current) ||
      "Imported from an earlier project record.",
  });

  value.workspaces.direction = {
    intendedOutcome:
      text(vision.vision_statement) ||
      text(vision.ctx_desired) ||
      text(vision.north_star),
    presentTension: text(vision.ctx_current) || text(project.summary),
    whyNow: joined(vision.ctx_why, vision.vision_case),
    boundaries: "",
    evidence: records(vision.signals)
      .map((item) => text(item.label) || text(item.text) || text(item.signal))
      .filter(Boolean)
      .join(" · "),
    assumptions: "",
  };
  value.workspaces.dynamics = {
    forces: migrateForces(dynamics),
    interpretation: text(dynamics.summary),
  };
  value.workspaces.influence = {
    actors: migrateActors(influence),
    interpretation: "",
  };
  value.workspaces.narrative = {
    centralTruth: text(communication.core_problem),
    promise: joined(communication.core_solution, communication.core_impact),
    acknowledgedCost: text(communication.comms_risk_notes),
    invitation: joined(
      communication.core_outlook,
      communication.obj_know,
      communication.obj_feel,
      communication.obj_do,
    ),
  };
  value.workspaces.experiments = {
    items: migrateExperiments(nudges),
    learningQuestion: joined(
      nudges.momentum_blockers,
      nudges.momentum_tipping,
    ),
  };
  value.workspaces.differences = {
    items: migrateDifferences(coordinate),
    operatingAgreement: text(coordinate.summary),
  };

  return {
    value: changeCaseSchema.parse(value),
    migratedFromLegacy: true,
  };
}

export function downloadCase(value: ChangeCase) {
  const contents = JSON.stringify(createCaseFile(value), null, 2);
  const blobUrl = URL.createObjectURL(
    new Blob([contents], { type: "application/json" }),
  );
  const link = document.createElement("a");
  const slug =
    value.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "case";
  link.href = blobUrl;
  link.download = `${slug}.casework.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
