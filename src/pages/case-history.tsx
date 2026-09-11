import { useMemo, useState, type FormEvent } from "react";
import { useParams } from "@tanstack/react-router";
import { useCases } from "../app/cases-context";
import type {
  CaseHistoryEntry,
  ChangeCase,
  WorkspaceKey,
} from "../domain/case";

const workspaceLabels: Record<CaseHistoryEntry["workspace"], string> = {
  case: "Whole case",
  direction: "Direction",
  dynamics: "Dynamics",
  influence: "Influence",
  narrative: "Narrative",
  experiments: "Experiments",
  differences: "Differences",
};

type HistoryFilter = "all" | CaseHistoryEntry["kind"];

function formatMoment(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CaseHistory() {
  const { caseId } = useParams({ strict: false });
  const { getCase, saveCase } = useCases();
  const value = caseId ? getCase(caseId) : undefined;
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [kind, setKind] = useState<CaseHistoryEntry["kind"]>("decision");
  const [statement, setStatement] = useState("");
  const [context, setContext] = useState("");
  const [source, setSource] = useState("");
  const [workspace, setWorkspace] =
    useState<CaseHistoryEntry["workspace"]>("case");
  const [recording, setRecording] = useState(false);

  const visible = useMemo(
    () =>
      [...(value?.history ?? [])]
        .filter((entry) => filter === "all" || entry.kind === filter)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    [filter, value?.history],
  );

  if (!value) return null;

  async function record(event: FormEvent) {
    event.preventDefault();
    if (!statement.trim() || !value) return;
    setRecording(true);
    const entry: CaseHistoryEntry = {
      id: crypto.randomUUID(),
      kind,
      statement: statement.trim(),
      context: context.trim(),
      source: source.trim(),
      workspace,
      recordedAt: new Date().toISOString(),
    };
    try {
      await saveCase({
        ...value,
        history: [...value.history, entry],
      });
      setStatement("");
      setContext("");
      setSource("");
    } finally {
      setRecording(false);
    }
  }

  return (
    <main className="case-history">
      <header className="stage-header history-header">
        <div className="workspace__index">07</div>
        <div>
          <p className="meta-label">Decision & evidence record</p>
          <h1>What changed our understanding?</h1>
        </div>
        <p>
          Preserve consequential choices and the evidence that shaped them.
          Corrections are added as new entries so the path remains visible.
        </p>
      </header>

      <div className="history-composition">
        <form className="history-entry-form" onSubmit={record}>
          <p className="meta-label">Make an entry</p>
          <div className="history-kind" role="group" aria-label="Entry kind">
            <button
              type="button"
              className={kind === "decision" ? "is-selected" : ""}
              onClick={() => setKind("decision")}
            >
              Decision
            </button>
            <button
              type="button"
              className={kind === "evidence" ? "is-selected" : ""}
              onClick={() => setKind("evidence")}
            >
              Evidence
            </button>
          </div>
          <label>
            <span>{kind === "decision" ? "What was decided?" : "What did we learn?"}</span>
            <textarea
              required
              rows={4}
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
            />
          </label>
          <label>
            <span>{kind === "decision" ? "Reason and trade-off" : "Interpretation and limits"}</span>
            <textarea
              rows={4}
              value={context}
              onChange={(event) => setContext(event.target.value)}
            />
          </label>
          <div className="history-entry-form__pair">
            <label>
              <span>Related field</span>
              <select
                value={workspace}
                onChange={(event) =>
                  setWorkspace(event.target.value as "case" | WorkspaceKey)
                }
              >
                {Object.entries(workspaceLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Source or setting</span>
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="Interview, workshop, data…"
              />
            </label>
          </div>
          <button className="action-button" type="submit" disabled={recording}>
            {recording ? "Recording…" : "Add to record"}
          </button>
        </form>

        <section className="history-ledger">
          <header>
            <div>
              <p className="meta-label">Chronology</p>
              <strong>{value.history.length} entries</strong>
            </div>
            <div className="history-filters" aria-label="Filter record">
              {(["all", "decision", "evidence"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={filter === option ? "is-selected" : ""}
                  onClick={() => setFilter(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </header>

          {visible.length === 0 ? (
            <p className="history-empty">
              No {filter === "all" ? "" : `${filter} `}entries yet. Record only
              what will matter when the case is revisited.
            </p>
          ) : (
            <ol>
              {visible.map((entry) => (
                <li key={entry.id} className={`history-entry history-entry--${entry.kind}`}>
                  <div className="history-entry__moment">
                    <span>{entry.kind}</span>
                    <time dateTime={entry.recordedAt}>{formatMoment(entry.recordedAt)}</time>
                  </div>
                  <div className="history-entry__body">
                    <h2>{entry.statement}</h2>
                    {entry.context && <p>{entry.context}</p>}
                    <footer>
                      <span>{workspaceLabels[entry.workspace]}</span>
                      {entry.source && <cite>{entry.source}</cite>}
                    </footer>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
