import { useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useCases } from "../app/cases-context";
import {
  contextBriefToMarkdown,
  createContextBrief,
  downloadContextBrief,
} from "../services/case-brief";

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CaseBriefPage() {
  const { caseId } = useParams({ strict: false });
  const { getCase } = useCases();
  const value = caseId ? getCase(caseId) : undefined;
  const [audience, setAudience] = useState("");
  const [purpose, setPurpose] = useState("");
  const [copied, setCopied] = useState(false);
  const brief = useMemo(
    () => value ? createContextBrief(value, { audience, purpose }) : null,
    [audience, purpose, value],
  );

  if (!value || !brief) return null;

  async function copyBrief() {
    if (!brief) return;
    await navigator.clipboard.writeText(contextBriefToMarkdown(brief));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="case-brief-page">
      <header className="stage-header brief-header">
        <div className="workspace__index">08</div>
        <div>
          <p className="meta-label">Context brief / generated locally</p>
          <h1>A portable reading of the case.</h1>
        </div>
        <p>
          The brief arranges what has been recorded without inventing a
          conclusion. Empty fields remain absent rather than being filled by prose.
        </p>
      </header>

      <section className="brief-controls" aria-label="Brief preparation">
        <label>
          <span>Prepared for</span>
          <input
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            placeholder="A person, group, or room"
          />
        </label>
        <label>
          <span>Purpose</span>
          <input
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="The conversation this should support"
          />
        </label>
        <div>
          <button type="button" onClick={() => void copyBrief()}>
            {copied ? "Copied" : "Copy Markdown"}
          </button>
          <button type="button" onClick={() => downloadContextBrief(brief)}>
            Download .md
          </button>
          <button type="button" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </section>

      <article className="context-brief">
        <header className="context-brief__cover">
          <p>CONTEXT BRIEF · REVISION {String(brief.revision).padStart(2, "0")}</p>
          <h1>{brief.title}</h1>
          {brief.organization && <strong>{brief.organization}</strong>}
          <dl>
            {brief.audience && (
              <>
                <dt>Prepared for</dt>
                <dd>{brief.audience}</dd>
              </>
            )}
            {brief.purpose && (
              <>
                <dt>Purpose</dt>
                <dd>{brief.purpose}</dd>
              </>
            )}
            <dt>Generated</dt>
            <dd>{formatGeneratedAt(brief.generatedAt)}</dd>
          </dl>
        </header>

        <section className="context-brief__situation">
          <p className="brief-folio">00</p>
          <div>
            <p className="meta-label">Situation</p>
            <h2>{brief.situation || "No situation has been recorded."}</h2>
          </div>
        </section>

        {brief.sections.map((section, index) => (
          <section className="brief-section" key={section.id}>
            <p className="brief-folio">{String(index + 1).padStart(2, "0")}</p>
            <div>
              <h2>{section.title}</h2>
              {section.introduction && (
                <p className="brief-section__introduction">{section.introduction}</p>
              )}
              {section.items.length > 0 && (
                <ul>
                  {section.items.map((item, itemIndex) => (
                    <li key={`${item.label}-${itemIndex}`}>
                      <span>{item.label}</span>
                      <strong>{item.text}</strong>
                      {item.note && <p>{item.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}

        <footer className="context-brief__footer">
          <span>Casework</span>
          <span>Generated from the recorded case · no inferred content</span>
        </footer>
      </article>
    </main>
  );
}
