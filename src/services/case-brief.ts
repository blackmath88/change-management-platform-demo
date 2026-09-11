import type { ChangeCase } from "../domain/case";

export interface ContextBriefOptions {
  audience: string;
  purpose: string;
  generatedAt?: string;
}

export interface ContextBriefItem {
  label: string;
  text: string;
  note?: string;
}

export interface ContextBriefSection {
  id: string;
  title: string;
  introduction?: string;
  items: ContextBriefItem[];
}

export interface ContextBrief {
  title: string;
  organization: string;
  situation: string;
  audience: string;
  purpose: string;
  generatedAt: string;
  revision: number;
  sections: ContextBriefSection[];
}

function present(items: ContextBriefItem[]) {
  return items.filter(({ text }) => text.trim());
}

export function createContextBrief(
  value: ChangeCase,
  options: ContextBriefOptions,
): ContextBrief {
  const { direction, dynamics, influence, narrative, experiments, differences } =
    value.workspaces;
  const sections: ContextBriefSection[] = [];

  const directionItems = present([
    { label: "Present tension", text: direction.presentTension },
    { label: "Why now", text: direction.whyNow },
    { label: "Boundaries", text: direction.boundaries },
    { label: "Evidence base", text: direction.evidence },
    { label: "Assumptions", text: direction.assumptions },
  ]);
  if (direction.intendedOutcome || directionItems.length) {
    sections.push({
      id: "direction",
      title: "Direction",
      introduction: direction.intendedOutcome,
      items: directionItems,
    });
  }

  const forceItems = dynamics.forces
    .slice()
    .sort((a, b) => b.strength - a.strength)
    .map((force) => ({
      label: `${force.kind === "enabling" ? "Enabling" : "Constraining"} · ${force.strength}/5`,
      text: force.label,
      note: force.evidence,
    }));
  if (dynamics.interpretation || forceItems.length) {
    sections.push({
      id: "dynamics",
      title: "Dynamics shaping the situation",
      introduction: dynamics.interpretation,
      items: forceItems,
    });
  }

  const actorItems = influence.actors
    .slice()
    .sort((a, b) => b.influence - a.influence)
    .map((actor) => ({
      label: `${actor.role || "Actor"} · influence ${actor.influence}/5`,
      text: actor.name,
      note: actor.notes,
    }));
  if (influence.interpretation || actorItems.length) {
    sections.push({
      id: "influence",
      title: "Influence and legitimate concern",
      introduction: influence.interpretation,
      items: actorItems,
    });
  }

  const narrativeItems = present([
    { label: "Central truth", text: narrative.centralTruth },
    { label: "Promise", text: narrative.promise },
    { label: "Acknowledged cost", text: narrative.acknowledgedCost },
    { label: "Invitation", text: narrative.invitation },
  ]);
  if (narrativeItems.length) {
    sections.push({
      id: "narrative",
      title: "Credible narrative",
      items: narrativeItems,
    });
  }

  const experimentItems = experiments.items.map((experiment) => ({
    label: experiment.status,
    text: experiment.hypothesis,
    note: experiment.signal ? `Signal: ${experiment.signal}` : "",
  }));
  if (experiments.learningQuestion || experimentItems.length) {
    sections.push({
      id: "experiments",
      title: "Learning agenda",
      introduction: experiments.learningQuestion,
      items: experimentItems,
    });
  }

  const differenceItems = differences.items.map((difference) => ({
    label: difference.tension,
    text: [difference.sideA, difference.sideB].filter(Boolean).join(" ↔ "),
    note: difference.coordination,
  }));
  if (differences.operatingAgreement || differenceItems.length) {
    sections.push({
      id: "differences",
      title: "Differences to coordinate",
      introduction: differences.operatingAgreement,
      items: differenceItems,
    });
  }

  const historyItems = value.history
    .slice()
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, 8)
    .map((entry) => ({
      label: `${entry.kind} · ${entry.workspace} · ${entry.recordedAt.slice(0, 10)}`,
      text: entry.statement,
      note: [entry.context, entry.source].filter(Boolean).join(" — "),
    }));
  if (historyItems.length) {
    sections.push({
      id: "record",
      title: "Recent decisions and evidence",
      items: historyItems,
    });
  }

  return {
    title: value.title,
    organization: value.organization,
    situation: value.situation,
    audience: options.audience.trim(),
    purpose: options.purpose.trim(),
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    revision: value.revision,
    sections,
  };
}

function markdownText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function contextBriefToMarkdown(brief: ContextBrief): string {
  const lines = [
    `# ${markdownText(brief.title)}`,
    "",
    brief.organization ? `**Organization:** ${markdownText(brief.organization)}` : "",
    brief.audience ? `**Prepared for:** ${markdownText(brief.audience)}` : "",
    brief.purpose ? `**Purpose:** ${markdownText(brief.purpose)}` : "",
    `**Case revision:** ${brief.revision}`,
    `**Generated:** ${brief.generatedAt}`,
    "",
    "## Situation",
    "",
    markdownText(brief.situation) || "No situation has been recorded.",
  ].filter((line, index, all) => line || all[index - 1] !== "");

  for (const section of brief.sections) {
    lines.push("", `## ${section.title}`, "");
    if (section.introduction) lines.push(markdownText(section.introduction), "");
    for (const item of section.items) {
      lines.push(`- **${markdownText(item.label)}:** ${markdownText(item.text)}`);
      if (item.note) lines.push(`  ${markdownText(item.note)}`);
    }
  }

  lines.push("", "---", "", "Generated from the current Changefield record.");
  return `${lines.join("\n").trim()}\n`;
}

export function downloadContextBrief(brief: ContextBrief) {
  const url = URL.createObjectURL(
    new Blob([contextBriefToMarkdown(brief)], {
      type: "text/markdown;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  const slug =
    brief.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "case";
  link.href = url;
  link.download = `${slug}-context-brief.md`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
